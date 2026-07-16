import { randomUUID } from "node:crypto";

import {
  hasRequiredGenerationFacts,
  selectCurrentApprovalCandidate,
} from "./_flow-motion-approval-selection.mjs";

const APPROVAL_CONTROL_SELECTOR = 'button, [role="button"], [role="radio"], label, div';
const MAKE_BUTTON_TEXT = /^\s*arrow_forward\s*(?:만들기|Create)\s*$/i;
const APPROVAL_TARGET_ATTRIBUTE = "data-flow-motion-approval-target";
const APPROVAL_ARMED_ATTRIBUTE = "data-flow-motion-approval-armed";

async function evaluateGenerationConfirmationCandidates(page, job, mark = null) {
  const approvalOptions = page.locator(APPROVAL_CONTROL_SELECTOR);
  const expectedPrompt = String(job?.prompt ?? "").replace(/\s+/g, " ").trim();
  const expectedCredits = Number(job?.providerTarget?.expectedCreditsPerGeneration ?? 20);
  const expectedOutputCount = Number(job?.providerTarget?.outputCount ?? 1);
  return approvalOptions.evaluateAll((elements, args) => {
    const normalized = (value) => String(value ?? "").replace(/\s+/g, " ").trim();
    const compact = (value) => normalized(value).replace(/\s+/g, "");
    const numberToken = (value) => `(?<!\\d)${value}(?!\\d)`;
    const credits = numberToken(args.expectedCredits);
    const outputs = numberToken(args.expectedOutputCount);
    const creditToken = new RegExp(
      `(?:크레딧\\s*${credits}\\s*개|${credits}\\s*개(?:의)?\\s*크레딧|${credits}\\s*(?:Google\\s*Flow\\s*)?credits?|credits?\\s*${credits})`,
      "i",
    );
    const outputToken = new RegExp(
      `(?:${outputs}\\s*개(?:의)?\\s*동영상|동영상\\s*${outputs}\\s*개|${outputs}\\s*videos?|videos?\\s*${outputs})`,
      "i",
    );
    const actionToken = /(?:사용|소모|생성|시작|use|spend|generate|create|start)/i;
    const persistentToken = /(?:다시묻지않음|항상승인|don['’]?taskagain|donotaskagain|neveraskagain|alwaysapprove|approvealways)/i;
    const approveOnceToken = /^(?:(?:check|radio_button_(?:un)?checked))?(?:승인|Approve)$/i;
    const hasFacts = (value) => {
      const text = normalized(value);
      return creditToken.test(text) && outputToken.test(text) && actionToken.test(text);
    };
    const isInteractive = (element) => {
      const style = getComputedStyle(element);
      const role = element.getAttribute("role");
      return element.tagName === "BUTTON" || element.tagName === "LABEL" ||
        role === "button" || role === "radio" || style.cursor === "pointer" || element.tabIndex >= 0;
    };
    const labelledByText = (element) => normalized(String(element.getAttribute("aria-labelledby") ?? "")
      .split(/\s+/)
      .filter(Boolean)
      .map((id) => element.ownerDocument.getElementById(id)?.textContent ?? "")
      .join(" "));
    const belongsToPersistentApproval = (element) => {
      let current = element;
      for (let depth = 0; current && depth < 8; depth += 1, current = current.parentElement) {
        if (depth > 0 && hasFacts(current.textContent)) break;
        if (depth === 0 || isInteractive(current)) {
          const combined = compact(`${current.textContent ?? ""} ${current.getAttribute("aria-label") ?? ""} ${labelledByText(current)}`);
          if (persistentToken.test(combined)) return true;
        }
      }
      return false;
    };
    const isApproveOnce = (element) => {
      const values = [compact(element.textContent), compact(element.getAttribute("aria-label")), compact(labelledByText(element))].filter(Boolean);
      return values.some((value) => approveOnceToken.test(value)) &&
        !values.some((value) => persistentToken.test(value)) &&
        !belongsToPersistentApproval(element);
    };
    const approvalElements = elements.filter(isApproveOnce);
    const roots = [];

    const records = approvalElements.map((element) => {
      const index = elements.indexOf(element);
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      let confirmationRoot = null;
      let current = element;
      for (let depth = 0; current && depth < 10; depth += 1, current = current.parentElement) {
        if (hasFacts(current.textContent)) {
          confirmationRoot = current;
          break;
        }
      }
      let cardKey = null;
      let confirmationText = "";
      let cardInViewport = false;
      if (confirmationRoot) {
        cardKey = roots.indexOf(confirmationRoot);
        if (cardKey < 0) {
          roots.push(confirmationRoot);
          cardKey = roots.length - 1;
        }
        confirmationText = normalized(confirmationRoot.textContent);
        const cardRect = confirmationRoot.getBoundingClientRect();
        cardInViewport = cardRect.bottom > 0 && cardRect.top < innerHeight && cardRect.right > 0 && cardRect.left < innerWidth;
      }

      let promptMatches = false;
      let acknowledged = false;
      current = confirmationRoot;
      for (let depth = 0; current && depth < 14; depth += 1, current = current.parentElement) {
        const previousText = normalized(current.previousElementSibling?.textContent);
        if (previousText === args.expectedPrompt) {
          promptMatches = true;
          const nextText = normalized(current.nextElementSibling?.textContent);
          acknowledged = /^(?:승인|Approve)$/.test(nextText);
          break;
        }
      }

      const role = element.getAttribute("role");
      const interactive = element.tagName === "BUTTON" || element.tagName === "LABEL" ||
        role === "button" || role === "radio" || style.cursor === "pointer" || element.tabIndex >= 0;
      const enabled = !element.hasAttribute("disabled") && element.getAttribute("aria-disabled") !== "true" && style.pointerEvents !== "none";
      const outermost = !approvalElements.some((other) => other !== element && other.contains(element));
      return {
        element,
        candidate: {
          index,
          cardKey,
          creditPromptMatches: confirmationRoot !== null && hasFacts(confirmationText),
          promptMatches,
          acknowledged,
          interactive,
          enabled,
          outermost,
          inViewport: cardInViewport && rect.bottom > 0 && rect.top < innerHeight && rect.right > 0 && rect.left < innerWidth,
          confirmationText,
          controlText: normalized(element.textContent || element.getAttribute("aria-label")),
          controlAriaLabel: normalized(element.getAttribute("aria-label")),
        },
      };
    });

    let markedCount = 0;
    let markError = null;
    if (args.mark) {
      for (const element of elements) element.removeAttribute(args.mark.attribute);
      const active = records.filter(({ candidate }) =>
        candidate.creditPromptMatches && candidate.promptMatches && !candidate.acknowledged &&
        candidate.interactive && candidate.enabled,
      );
      const cardKeys = [...new Set(active.map(({ candidate }) => candidate.cardKey))];
      let preferred = [];
      if (cardKeys.length !== 1 || cardKeys[0] === null || cardKeys[0] === undefined) {
        markError = `atomic_approval_target_ambiguous:${cardKeys.length}`;
      } else {
        const sameCard = active.filter(({ candidate }) => candidate.cardKey === cardKeys[0]);
        const inViewport = sameCard.filter(({ candidate }) => candidate.inViewport);
        const visibleOrSameCard = inViewport.length > 0 ? inViewport : sameCard;
        const outermost = visibleOrSameCard.filter(({ candidate }) => candidate.outermost);
        preferred = outermost.length > 0 ? outermost : visibleOrSameCard;
        if (preferred.length !== 1) markError = `atomic_approval_target_ambiguous:${preferred.length}`;
      }
      if (!markError) {
        const record = preferred[0];
        if (record.candidate.confirmationText !== args.mark.selected.confirmationText ||
            record.candidate.controlText !== args.mark.selected.controlText ||
            record.candidate.outermost !== args.mark.selected.outermost) {
          markError = "atomic_approval_descriptor_changed";
        }
      }
      if (!markError) {
        const record = preferred[0];
        markedCount = 1;
        record.element.setAttribute(args.mark.attribute, args.mark.token);
        const payload = {
          confirmationText: record.candidate.confirmationText.slice(0, 240),
          controlText: record.candidate.controlText,
          observedBy: "dom_capture_click_event",
          clickDispatched: true,
          submissionCount: 1,
        };
        const gate = { armed: false, seen: false };
        const dispatchListener = (event) => {
          if (!gate.armed || gate.seen) {
            event.preventDefault();
            event.stopImmediatePropagation();
            return;
          }
          gate.seen = true;
          const binding = globalThis[args.mark.bindingName];
          if (typeof binding === "function") void binding(payload);
        };
        record.element[args.mark.gateKey] = gate;
        record.element[args.mark.listenerKey] = dispatchListener;
        record.element.addEventListener("click", dispatchListener, { capture: true });
      }
    }

    return {
      approvalElementCount: elements.length,
      candidates: records.map(({ candidate }) => candidate),
      markedCount,
      markError,
    };
  }, { expectedPrompt, expectedCredits, expectedOutputCount, mark });
}

export async function collectGenerationConfirmationCandidates(page, job) {
  return evaluateGenerationConfirmationCandidates(page, job);
}

export async function findRequiredGenerationConfirmation(page, job) {
  const snapshot = await collectGenerationConfirmationCandidates(page, job);
  const relevant = snapshot.candidates.filter((candidate) =>
    candidate.creditPromptMatches && candidate.interactive && candidate.enabled,
  );
  const pending = relevant.filter((candidate) =>
    !candidate.acknowledged && candidate.promptMatches,
  );
  const acknowledged = relevant.filter((candidate) => candidate.promptMatches && candidate.acknowledged);
  if (pending.length === 0) {
    if (acknowledged.length > 0) {
      throw new Error("confirmation_already_acknowledged_no_resubmit");
    }
    return { confirmation: null, snapshot };
  }

  let selected;
  try {
    selected = selectCurrentApprovalCandidate(snapshot.candidates);
  } catch (error) {
    if (/^active_approval_ambiguous:0$/.test(String(error?.message ?? error))) {
      return { confirmation: null, snapshot };
    }
    throw error;
  }
  if (!hasRequiredGenerationFacts(
    selected.confirmationText,
    Number(job?.providerTarget?.expectedCreditsPerGeneration ?? 20),
    Number(job?.providerTarget?.outputCount ?? 1),
  )) {
    throw new Error("generation_confirmation_facts_invalid");
  }
  return {
    confirmation: {
      confirmationText: selected.confirmationText,
      selected,
    },
    snapshot,
  };
}

export async function clickRequiredGenerationConfirmationAtomic(page, job, selected, callbacks = {}) {
  if (!selected || !hasRequiredGenerationFacts(
    selected.confirmationText,
    Number(job?.providerTarget?.expectedCreditsPerGeneration ?? 20),
    Number(job?.providerTarget?.outputCount ?? 1),
  )) throw new Error("generation_confirmation_facts_invalid_before_atomic_click");

  const token = randomUUID().replace(/-/g, "");
  const bindingName = `flowMotionApprovalDispatch_${token}`;
  const listenerKey = `__flowMotionApprovalListener_${token}`;
  const gateKey = `__flowMotionApprovalGate_${token}`;
  let dispatchEvidence = null;
  let dispatchPersistenceError = null;
  let resolveDispatch;
  const dispatchObserved = new Promise((resolve) => { resolveDispatch = resolve; });
  await page.exposeBinding(bindingName, async (_source, evidence) => {
    if (!dispatchEvidence) {
      dispatchEvidence = evidence;
      try {
        if (typeof callbacks.onClickDispatched === "function") callbacks.onClickDispatched(evidence);
      } catch (error) {
        dispatchPersistenceError = error;
      }
      resolveDispatch(evidence);
    }
    return true;
  });

  const marked = await evaluateGenerationConfirmationCandidates(page, job, {
    attribute: APPROVAL_TARGET_ATTRIBUTE,
    token,
    bindingName,
    listenerKey,
    gateKey,
    selected,
  });
  if (marked.markError) throw new Error(marked.markError);
  if (marked.markedCount !== 1) throw new Error(`atomic_approval_target_ambiguous:${marked.markedCount}`);

  const pinned = page.locator(`[${APPROVAL_TARGET_ATTRIBUTE}="${token}"]`);
  if (await pinned.count() !== 1) throw new Error("atomic_approval_target_detached_before_pin");
  const handle = await pinned.elementHandle();
  if (!handle) throw new Error("atomic_approval_target_handle_missing");
  try {
    await handle.click({ trial: true, timeout: 2_000 });
    const stillPinned = await handle.evaluate((element, args) =>
      element.isConnected && element.getAttribute(args.attribute) === args.token,
    { attribute: APPROVAL_TARGET_ATTRIBUTE, token });
    if (!stillPinned) throw new Error("atomic_approval_target_detached_after_trial");

    const armedEvidence = {
      confirmationText: selected.confirmationText.slice(0, 240),
      controlText: selected.controlText,
      approvalClickAttemptCount: 1,
      clickIntentArmed: true,
    };
    if (typeof callbacks.onClickArmed === "function") callbacks.onClickArmed(armedEvidence);
    const gateArmed = await handle.evaluate((element, args) => {
      const gate = element[args.gateKey];
      if (!element.isConnected || !gate || gate.seen) return false;
      gate.armed = true;
      element.setAttribute(args.armedAttribute, "true");
      return true;
    }, { gateKey, armedAttribute: APPROVAL_ARMED_ATTRIBUTE });
    if (!gateArmed) throw new Error("atomic_approval_gate_not_armed");

    let clickError = null;
    try {
      await handle.click({ noWaitAfter: true, timeout: 5_000 });
    } catch (error) {
      clickError = error;
    }
    if (!dispatchEvidence) {
      await Promise.race([
        dispatchObserved,
        new Promise((resolve) => setTimeout(resolve, 1_500)),
      ]);
    }
    if (!dispatchEvidence) {
      const unknown = new Error("approval_click_outcome_unknown_no_retry");
      unknown.cause = clickError;
      throw unknown;
    }
    if (dispatchPersistenceError) {
      const persistenceFailure = new Error("approval_dispatch_persistence_failed_no_retry");
      persistenceFailure.cause = dispatchPersistenceError;
      throw persistenceFailure;
    }
    return {
      ...dispatchEvidence,
      clickCallError: clickError ? String(clickError?.message ?? clickError).replace(/\s+/g, " ").slice(0, 160) : null,
    };
  } finally {
    await handle.evaluate((element, args) => {
      const listener = element[args.listenerKey];
      if (typeof listener === "function") element.removeEventListener("click", listener, true);
      delete element[args.listenerKey];
      delete element[args.gateKey];
      element.removeAttribute(args.attribute);
      element.removeAttribute(args.armedAttribute);
    }, {
      attribute: APPROVAL_TARGET_ATTRIBUTE,
      armedAttribute: APPROVAL_ARMED_ATTRIBUTE,
      listenerKey,
      gateKey,
    }).catch(() => {});
    await handle.dispose().catch(() => {});
  }
}

export async function findCurrentComposerMakeButton(promptBox) {
  let scope = promptBox;
  for (let depth = 0; depth < 9; depth += 1) {
    const buttons = scope.locator("button").filter({ hasText: MAKE_BUTTON_TEXT });
    const visibleEnabled = [];
    for (let index = 0; index < await buttons.count(); index += 1) {
      const button = buttons.nth(index);
      if (await button.isVisible().catch(() => false) &&
          await button.isEnabled().catch(() => false) &&
          await button.getAttribute("aria-disabled") !== "true") {
        visibleEnabled.push(button);
      }
    }
    if (visibleEnabled.length === 1) return visibleEnabled[0];
    if (visibleEnabled.length > 1) throw new Error(`generation_make_button_ambiguous:${visibleEnabled.length}`);
    scope = scope.locator("xpath=..");
  }
  return null;
}
