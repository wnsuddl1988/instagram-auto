import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { findRequiredGenerationConfirmation } from "./_flow-motion-confirmation-dom.mjs";
import {
  collectPromptBoundFlowResultCandidates,
  inspectExactAttemptMarkerResultCandidates,
  parseExactFlowResultUrl,
  selectExactNewFlowResult,
} from "./_flow-motion-result-binding.mjs";

function normalized(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function writeJsonAtomic(filePath, value, token) {
  const tempPath = `${filePath}.${token}.${process.pid}.${Date.now()}.tmp`;
  let descriptor = null;
  try {
    descriptor = fs.openSync(tempPath, "wx");
    fs.writeFileSync(descriptor, `${JSON.stringify(value, null, 2)}\n`, "utf8");
    fs.fsyncSync(descriptor);
    fs.closeSync(descriptor);
    descriptor = null;
    fs.renameSync(tempPath, filePath);
  } finally {
    if (descriptor !== null) fs.closeSync(descriptor);
    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
  }
}

async function directPageResultCandidate(page, job, projectUrl) {
  const direct = parseExactFlowResultUrl(page.url(), projectUrl);
  if (!direct) return null;
  const exactPromptMatches = await page.locator("body").evaluate((root, expectedPrompt) => {
    const normalize = (value) => String(value ?? "").replace(/\s+/g, " ").trim();
    const nodes = [root, ...root.querySelectorAll("*")];
    return nodes.some((node) => {
      if (normalize(node.textContent) !== expectedPrompt) return false;
      return ![...node.children].some((child) => normalize(child.textContent) === expectedPrompt);
    });
  }, normalized(job.prompt));
  return {
    href: direct.editUrl,
    exactPromptMatches,
    scopeLinkCount: 1,
    videoCount: await page.locator("video").count(),
    observedBy: "same_page_navigation",
  };
}

function updateObservation(observation, snapshot, selected) {
  const candidates = snapshot?.candidates ?? [];
  const factCandidates = candidates.filter((candidate) => candidate.creditPromptMatches);
  const interactiveCandidates = factCandidates.filter((candidate) => candidate.interactive);
  observation.pollCount += 1;
  observation.lastApprovalElementCount = Number(snapshot?.approvalElementCount ?? 0);
  observation.maxApprovalElementCount = Math.max(
    observation.maxApprovalElementCount,
    observation.lastApprovalElementCount,
  );
  observation.maxCreditFactCandidateCount = Math.max(
    observation.maxCreditFactCandidateCount,
    factCandidates.length,
  );
  observation.maxInteractiveCreditCandidateCount = Math.max(
    observation.maxInteractiveCreditCandidateCount,
    interactiveCandidates.length,
  );
  for (const candidate of factCandidates) {
    const sample = normalized(candidate.confirmationText).slice(0, 240);
    if (sample && !observation.confirmationTextSamples.includes(sample) &&
        observation.confirmationTextSamples.length < 4) {
      observation.confirmationTextSamples.push(sample);
    }
  }
  if (selected?.state === "ready" && selected.binding?.providerResultId &&
      !observation.newResultIds.includes(selected.binding.providerResultId)) {
    observation.newResultIds.push(selected.binding.providerResultId);
  }
}

export async function waitForPostMakeOutcome(page, job, options = {}) {
  const timeoutMs = Number(options.timeoutMs ?? 600_000);
  const pollIntervalMs = Number(options.pollIntervalMs ?? 250);
  const confirmationStablePolls = Number(options.confirmationStablePolls ?? 7);
  const resultStablePolls = Number(options.resultStablePolls ?? 3);
  const initialResultHrefs = Array.isArray(options.initialResultHrefs) ? options.initialResultHrefs : [];
  const projectUrl = String(options.projectUrl ?? "");
  const baseline = options.confirmationBaseline ?? { cardCounts: {} };
  const deadline = Date.now() + timeoutMs;
  let stableConfirmationKey = null;
  let stableConfirmationCount = 0;
  let stableResultKey = null;
  let stableResultCount = 0;
  let lastMarkerProbeKey = null;
  let nextMarkerProbeAt = 0;
  const observation = {
    pollCount: 0,
    maxApprovalElementCount: 0,
    lastApprovalElementCount: 0,
    maxCreditFactCandidateCount: 0,
    maxInteractiveCreditCandidateCount: 0,
    confirmationTextSamples: [],
    newResultIds: [],
  };

  while (Date.now() < deadline) {
    const confirmationResult = await findRequiredGenerationConfirmation(page, job, { baseline });
    const directCandidate = await directPageResultCandidate(page, job, projectUrl);
    const resultCandidates = directCandidate
      ? [directCandidate]
      : await collectPromptBoundFlowResultCandidates(page, job.prompt, null);
    let selectedResult = selectExactNewFlowResult(resultCandidates, initialResultHrefs, projectUrl);
    if (!directCandidate && selectedResult.state === "waiting") {
      const baseline = new Set(initialResultHrefs
        .map((href) => parseExactFlowResultUrl(href, projectUrl)?.editUrl)
        .filter(Boolean));
      const deltaKey = JSON.stringify([...new Set(resultCandidates
        .map((candidate) => parseExactFlowResultUrl(candidate?.href, projectUrl)?.editUrl)
        .filter((href) => href && !baseline.has(href)))].sort());
      if (deltaKey !== "[]" && (deltaKey !== lastMarkerProbeKey || Date.now() >= nextMarkerProbeAt)) {
        lastMarkerProbeKey = deltaKey;
        nextMarkerProbeAt = Date.now() + 5_000;
        const markerCandidates = await inspectExactAttemptMarkerResultCandidates(
          page,
          job.prompt,
          initialResultHrefs,
          projectUrl,
        );
        selectedResult = selectExactNewFlowResult(markerCandidates, initialResultHrefs, projectUrl);
      }
    }
    updateObservation(observation, confirmationResult.snapshot, selectedResult);
    if (selectedResult.state === "ambiguous") {
      const error = new Error(`post_make_result_binding_ambiguous:${selectedResult.candidateResultIds.join(",")}`);
      error.postMakeObservation = observation;
      throw error;
    }
    if (selectedResult.state === "ready") {
      const resultKey = `${selectedResult.binding.providerResultId}\n${selectedResult.binding.editUrl}`;
      stableResultCount = resultKey === stableResultKey ? stableResultCount + 1 : 1;
      stableResultKey = resultKey;
      if (stableResultCount >= resultStablePolls) {
        return {
          state: "direct_result",
          binding: {
            ...selectedResult.binding,
            observedBy: "exact_attempt_result_after_make_no_confirmation",
          },
          observation,
        };
      }
      // A unique attempt-marker result is stronger evidence than a confirmation
      // card. Never approve while that result is stabilizing.
      await page.waitForTimeout(pollIntervalMs);
      continue;
    }
    stableResultKey = null;
    stableResultCount = 0;

    if (confirmationResult.confirmation) {
      const selected = confirmationResult.confirmation.selected;
      const confirmationKey = JSON.stringify([
        selected.cardFingerprint,
        selected.cardOrdinal,
        selected.confirmationText,
        selected.controlText,
      ]);
      stableConfirmationCount = confirmationKey === stableConfirmationKey
        ? stableConfirmationCount + 1
        : 1;
      stableConfirmationKey = confirmationKey;
      if (stableConfirmationCount >= confirmationStablePolls) {
        return {
          state: "confirmation",
          confirmation: confirmationResult.confirmation,
          observation,
        };
      }
    } else {
      stableConfirmationKey = null;
      stableConfirmationCount = 0;
    }
    await page.waitForTimeout(pollIntervalMs);
  }

  return { state: "timeout", observation };
}

export async function capturePostMakeFailureEvidence(page, options = {}) {
  const job = options.job;
  const initialResultHrefs = Array.isArray(options.initialResultHrefs) ? options.initialResultHrefs : [];
  const observation = options.observation ?? null;
  const evidenceDirectory = path.resolve(String(options.evidenceDirectory ?? ""));
  const attemptId = String(options.attemptId ?? "");
  if (!job?.jobId || !/^[a-f0-9-]{36}$/i.test(attemptId) || !fs.existsSync(evidenceDirectory)) {
    throw new Error("post_make_evidence_contract_invalid");
  }
  const screenshotPath = path.join(evidenceDirectory, `post-make-evidence-${attemptId}.png`);
  const evidencePath = path.join(evidenceDirectory, `post-make-evidence-${attemptId}.json`);
  let screenshotError = null;
  try {
    await page.screenshot({ path: screenshotPath, fullPage: true, timeout: 15_000 });
  } catch (error) {
    screenshotError = String(error?.message ?? error).replace(/\s+/g, " ").slice(0, 240);
  }
  const promptBoxes = page.locator('[contenteditable="true"]');
  let promptBox = null;
  for (let index = 0; index < await promptBoxes.count(); index += 1) {
    const candidate = promptBoxes.nth(index);
    if (await candidate.isVisible().catch(() => false)) {
      promptBox = candidate;
      break;
    }
  }
  const composer = promptBox ? await promptBox.evaluate((element) => {
    const scope = element.parentElement?.parentElement;
    return {
      promptText: String(element.textContent ?? "").replace(/\s+/g, " ").trim(),
      attachments: scope ? [...scope.querySelectorAll("img")].map((image) => ({
        alt: image.getAttribute("alt") ?? "",
        source: image.currentSrc || image.getAttribute("src") || "",
      })) : [],
    };
  }).catch(() => null) : null;
  const currentHrefs = await page.locator('a[href*="/edit/"]').evaluateAll((elements) => [...new Set(elements
    .map((element) => element.href)
    .filter(Boolean))]).catch(() => []);
  const baseline = new Set(initialResultHrefs);
  const newHrefs = currentHrefs.filter((href) => !baseline.has(href));
  const bodyText = normalized(await page.locator("body").innerText().catch(() => "")).slice(0, 4_000);
  const evidence = {
    schemaVersion: "money_shorts_flow_motion_post_make_evidence_v1",
    attemptId,
    jobId: job.jobId,
    capturedAt: new Date().toISOString(),
    pageUrl: page.url(),
    observation,
    currentResultHrefs: currentHrefs,
    newResultHrefs: newHrefs,
    composer: composer ? {
      promptSha256: sha256(composer.promptText),
      attachments: composer.attachments.map((attachment) => ({
        alt: attachment.alt,
        sourceSha256: attachment.source ? sha256(attachment.source) : null,
      })),
    } : null,
    bodyText,
    screenshotPath: screenshotError ? null : screenshotPath,
    screenshotSha256: screenshotError || !fs.existsSync(screenshotPath)
      ? null
      : sha256(fs.readFileSync(screenshotPath)),
    screenshotError,
  };
  writeJsonAtomic(evidencePath, evidence, attemptId);
  return {
    evidencePath,
    screenshotPath: evidence.screenshotPath,
    screenshotSha256: evidence.screenshotSha256,
    screenshotError,
  };
}
