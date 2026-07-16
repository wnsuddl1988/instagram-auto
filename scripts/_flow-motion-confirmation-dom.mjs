import {
  hasRequiredGenerationFacts,
  selectCurrentApprovalCandidate,
} from "./_flow-motion-approval-selection.mjs";

const APPROVAL_CONTROL_SELECTOR = 'button, [role="button"], [role="radio"], label, div';
const MAKE_BUTTON_TEXT = /^\s*arrow_forward\s*(?:만들기|Create)\s*$/i;

export async function collectGenerationConfirmationCandidates(page, job) {
  const approvalOptions = page.locator(APPROVAL_CONTROL_SELECTOR);
  const expectedPrompt = String(job?.prompt ?? "").replace(/\s+/g, " ").trim();
  const expectedCredits = Number(job?.providerTarget?.expectedCreditsPerGeneration ?? 20);
  const expectedOutputCount = Number(job?.providerTarget?.outputCount ?? 1);
  const candidates = await approvalOptions.evaluateAll((elements, args) => {
    const normalized = (value) => String(value ?? "").replace(/\s+/g, " ").trim();
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
    const hasFacts = (value) => {
      const text = normalized(value);
      return creditToken.test(text) && outputToken.test(text) && actionToken.test(text);
    };
    const isApproveOnce = (element) => /^(?:(?:check|radio_button_(?:un)?checked))?(?:승인|Approve)$/i.test(
      normalized(element.textContent || element.getAttribute("aria-label")).replace(/\s+/g, ""),
    );
    const approvalElements = elements.filter(isApproveOnce);
    const roots = [];

    return approvalElements.map((element) => {
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

      const tag = element.tagName;
      const role = element.getAttribute("role");
      const interactive = tag === "BUTTON" || role === "button" || role === "radio" || style.cursor === "pointer" || element.tabIndex >= 0;
      const enabled = !element.hasAttribute("disabled") && element.getAttribute("aria-disabled") !== "true" && style.pointerEvents !== "none";
      const outermost = !approvalElements.some((other) => other !== element && other.contains(element));
      return {
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
      };
    });
  }, { expectedPrompt, expectedCredits, expectedOutputCount });

  return {
    approvalOptions,
    approvalElementCount: await approvalOptions.count(),
    candidates,
  };
}

export async function findRequiredGenerationConfirmation(page, job, options = {}) {
  const snapshot = await collectGenerationConfirmationCandidates(page, job);
  const relevant = snapshot.candidates.filter((candidate) =>
    candidate.creditPromptMatches && candidate.interactive && candidate.enabled,
  );
  const pending = relevant.filter((candidate) =>
    !candidate.acknowledged &&
    (Number.isInteger(options.freshAfterIndex)
      ? candidate.index >= options.freshAfterIndex
      : candidate.promptMatches),
  );
  const acknowledged = relevant.filter((candidate) => candidate.promptMatches && candidate.acknowledged);
  if (pending.length === 0) {
    if (!Number.isInteger(options.freshAfterIndex) && acknowledged.length > 0) {
      throw new Error("confirmation_already_acknowledged_no_resubmit");
    }
    return { confirmation: null, snapshot };
  }

  let selected;
  try {
    selected = selectCurrentApprovalCandidate(snapshot.candidates, {
      freshAfterIndex: options.freshAfterIndex,
    });
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
      approveOption: snapshot.approvalOptions.nth(selected.index),
      confirmationText: selected.confirmationText,
      selected,
    },
    snapshot,
  };
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
