#!/usr/bin/env node

/**
 * Generic Google Flow runner for one prepared money-shorts motion job.
 *
 * --contract-check validates only local files and never imports Playwright.
 * --generate-live requires the job's exact Owner approval text plus the
 * server-only ALLOW_FLOW_MOTION_GENERATION=1 marker. It may submit at most one
 * Veo generation across Gemini 2 -> 3 -> 4, and advances profiles only when an
 * explicit quota-exhausted message is visible before submission.
 */

import { createHash, randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import { classifyVeoBody, ensureChrome, isCDPOpen } from "./_gemini-veo-core.mjs";
import { GEMINI_VEO_PROFILE_CHAIN } from "./_gemini-veo-profile-chain.mjs";
import {
  GEMINI_FLOW_TARGET,
  isExactGeminiFlowProjectRootUrl,
} from "./_gemini-flow-no-submit-contract.mjs";
import {
  hasRequiredGenerationFacts,
} from "./_flow-motion-approval-selection.mjs";
import { classifyPriorFlowMotionGenerationSummary } from "./_flow-motion-generation-summary.mjs";
import {
  captureGenerationConfirmationBaseline,
  clickCurrentComposerMakeAtomic,
  clickRequiredGenerationConfirmationAtomic,
  collectGenerationConfirmationCandidates,
} from "./_flow-motion-confirmation-dom.mjs";
import { acquireFlowMotionExecutionLock } from "./_flow-motion-execution-lock.mjs";
import {
  capturePostMakeFailureEvidence,
  waitForPostMakeOutcome,
} from "./_flow-motion-post-make-outcome.mjs";
import { classifyComposerReferenceIdentity } from "./_flow-motion-reference-binding.mjs";
import {
  collectPromptBoundFlowResultCandidates,
  inspectExactAttemptMarkerResultCandidates,
  parseExactFlowResultUrl,
  selectExactNewFlowResult,
} from "./_flow-motion-result-binding.mjs";

const modes = ["--contract-check", "--generate-live"].filter((flag) => process.argv.includes(flag));
const forbiddenArgs = ["--new-project", "--change-account", "--launch-browser", "--press-enter", "--save-settings"];
const OUTPUT_ROOT = path.resolve("C:/tmp/money-shorts-os");
const EXPECTED_PACKET_SCHEMA = "money_shorts_flow_motion_approval_packet_v1";
const EXPECTED_STATE_SCHEMA = "money_shorts_flow_motion_state_v1";
const EXPECTED_JOB_SCHEMA = "money_shorts_flow_motion_job_v1";
const GENERATION_TIMEOUT_MS = 600_000;

function argValue(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] ?? null : null;
}

function fail(code, detail = "") {
  const suffix = detail ? `:${String(detail).replace(/\s+/g, " ").slice(0, 240)}` : "";
  console.error(`ABORT: ${code}${suffix}`);
  process.exit(2);
}

function loadJson(filePath, label) {
  if (!fs.existsSync(filePath)) fail(`${label}_missing`);
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    fail(`${label}_invalid_json`);
  }
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function normalized(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function isAttemptId(value) {
  return /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(String(value ?? ""));
}

function buildProviderPrompt(semanticPrompt, attemptId) {
  if (!isAttemptId(attemptId)) throw new Error("flow_motion_attempt_id_invalid");
  const marker = `FLOW_ATTEMPT_ID_${attemptId}`;
  return {
    marker,
    prompt: normalized(
      `${semanticPrompt} ${marker}. Automation metadata only; do not depict, speak, caption, or render this identifier.`,
    ),
  };
}

function samePath(left, right) {
  return path.resolve(left).toLowerCase() === path.resolve(right).toLowerCase();
}

function writeJsonAtomic(filePath, value, token) {
  if (!isAttemptId(token)) throw new Error("atomic_json_attempt_id_invalid");
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

function assertLocalPath(filePath, label) {
  const resolved = path.resolve(filePath);
  const rel = path.relative(OUTPUT_ROOT, resolved);
  if (!filePath || rel.startsWith("..") || path.isAbsolute(rel)) fail(`${label}_outside_local_output_root`);
  return resolved;
}

function validateContracts(packetPath, statePath, jobId, ownerApproval, live, allowExistingOutput = false) {
  const packet = loadJson(packetPath, "packet");
  const state = loadJson(statePath, "state");
  const failures = [];
  if (packet?.schemaVersion !== EXPECTED_PACKET_SCHEMA) failures.push("packet_schema_mismatch");
  if (state?.schemaVersion !== EXPECTED_STATE_SCHEMA) failures.push("state_schema_mismatch");
  if (!samePath(packet?.statePath ?? "", statePath)) failures.push("packet_state_path_mismatch");
  if (state?.statePath && !samePath(state.statePath, statePath)) failures.push("state_self_path_mismatch");
  if (packet?.status !== "generating" || packet?.job?.status !== "generating") failures.push("packet_not_generating");
  const stateJob = Array.isArray(state?.jobs) ? state.jobs.find((row) => row?.jobId === jobId) : null;
  const job = packet?.job;
  if (!stateJob || !job || stateJob.jobId !== job.jobId || job.jobId !== jobId) failures.push("job_identity_mismatch");
  if (job?.contractVersion !== EXPECTED_JOB_SCHEMA) failures.push("job_schema_mismatch");
  if (stateJob?.status !== "generating") failures.push("state_job_not_generating");
  if (job?.approval?.required !== true || !job?.approval?.ownerApprovalId) failures.push("owner_approval_evidence_missing");
  if (live && ownerApproval !== job?.approval?.requiredWording) failures.push("owner_approval_text_mismatch");
  if (job?.providerTarget?.provider !== "Google Flow") failures.push("provider_mismatch");
  if (job?.providerTarget?.primaryProfile !== "Gemini 2") failures.push("primary_profile_mismatch");
  if (JSON.stringify(job?.providerTarget?.fallbackProfiles) !== JSON.stringify(["Gemini 3", "Gemini 4"])) failures.push("fallback_profiles_mismatch");
  if (job?.providerTarget?.fallbackCondition !== "explicit_quota_exhausted_only") failures.push("fallback_policy_mismatch");
  if (job?.providerTarget?.projectId !== GEMINI_FLOW_TARGET.projectId) failures.push("project_mismatch");
  if (job?.providerTarget?.videoModel !== GEMINI_FLOW_TARGET.model) failures.push("model_mismatch");
  if (job?.providerTarget?.aspectRatio !== GEMINI_FLOW_TARGET.aspectRatio) failures.push("aspect_ratio_mismatch");
  if (job?.providerTarget?.outputCount !== 1) failures.push("output_count_mismatch");
  if (job?.providerTarget?.expectedCreditsPerGeneration !== GEMINI_FLOW_TARGET.expectedCreditsPerGeneration) failures.push("expected_credits_mismatch");
  if (job?.providerTarget?.confirmBeforeGeneration !== "always") failures.push("confirmation_policy_mismatch");
  const referencePath = assertLocalPath(job?.referenceFile ?? "", "reference");
  const expectedVideoPath = assertLocalPath(job?.expectedVideoPath ?? "", "video");
  const qaEvidencePath = assertLocalPath(job?.qaEvidencePath ?? "", "qa_evidence");
  const packetResolved = assertLocalPath(packetPath, "packet");
  const stateResolved = assertLocalPath(statePath, "state");
  if (!samePath(job?.packetPath ?? "", packetResolved)) failures.push("job_packet_path_mismatch");
  if (path.dirname(expectedVideoPath) !== path.dirname(packetResolved)) failures.push("video_job_directory_mismatch");
  if (path.dirname(qaEvidencePath) !== path.dirname(packetResolved)) failures.push("qa_job_directory_mismatch");
  const sceneDirectory = `scene-${String(job?.sceneNumber ?? "").padStart(2, "0")}`;
  const contractDirectory = `contract-${String(job?.referenceSha256 ?? "").slice(0, 16)}-${String(job?.promptSha256 ?? "").slice(0, 16)}`;
  const relativeJobDirectory = path.relative(path.dirname(stateResolved), path.dirname(packetResolved)).replace(/\\/g, "/");
  const legacyJobDirectory = relativeJobDirectory === sceneDirectory;
  const contentAddressedJobDirectory = relativeJobDirectory === `${sceneDirectory}/${contractDirectory}`;
  if (!legacyJobDirectory && !contentAddressedJobDirectory) failures.push("state_job_directory_mismatch");
  if (!fs.existsSync(referencePath)) failures.push("reference_missing");
  if (fs.existsSync(referencePath) && sha256(fs.readFileSync(referencePath)) !== job?.referenceSha256) failures.push("reference_hash_mismatch");
  if (sha256(job?.prompt ?? "") !== job?.promptSha256) failures.push("prompt_hash_mismatch");
  if (!String(job?.approval?.requiredWording ?? "").includes(job?.referenceSha256 ?? "")) failures.push("approval_reference_hash_missing");
  if (!String(job?.approval?.requiredWording ?? "").includes(job?.promptSha256 ?? "")) failures.push("approval_prompt_hash_missing");
  if (!String(job?.approval?.requiredWording ?? "").includes("quota_exhausted")) failures.push("approval_fallback_policy_missing");
  if (fs.existsSync(expectedVideoPath) && !allowExistingOutput) failures.push("output_already_exists");
  if (failures.length > 0) fail("flow_motion_contract_failed", failures.join(","));
  return { packet, state, job, referencePath, expectedVideoPath };
}

function firstVisible(locator) {
  return (async () => {
    const count = await locator.count();
    for (let index = 0; index < count; index += 1) {
      const row = locator.nth(index);
      if (await row.isVisible().catch(() => false)) return row;
    }
    return null;
  })();
}

async function waitForFirstVisible(page, locator, timeoutMs = 15_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const visible = await firstVisible(locator);
    if (visible) return visible;
    await page.waitForTimeout(250);
  }
  return null;
}

async function visibleBodyText(page) {
  return page.locator("body").innerText().catch(() => "");
}

async function inspectExplicitQuota(page) {
  const classified = classifyVeoBody(await visibleBodyText(page));
  return classified?.type === "quota" ? classified : null;
}

async function closeStaleAgentPanel(page) {
  let closed = false;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const visibleDialog = await firstVisible(page.locator('[role="dialog"]'));
    if (!visibleDialog) break;
    const dialogCloseButton = await firstVisible(
      visibleDialog.locator("button").filter({ hasText: /^\s*close\s*(?:닫기|Close)\s*$/i }),
    );
    if (!dialogCloseButton) break;
    await dialogCloseButton.click();
    await page.waitForTimeout(250);
    closed = true;
  }
  return closed;
}

async function ensureAgentPanelOpen(page) {
  const toggle = await firstVisible(
    page.locator("button").filter({ hasText: /^\s*(?:에이전트|Agent)\s*$/i }),
  );
  if (!toggle) throw new Error("flow_agent_toggle_missing");
  if (await toggle.getAttribute("aria-pressed") !== "true") {
    await toggle.click();
    await page.waitForTimeout(250);
  }
  if (await toggle.getAttribute("aria-pressed") !== "true") throw new Error("flow_agent_panel_not_open");
}

function buildReferenceUploadAlias(job) {
  const extension = path.extname(job.referenceFile).toLowerCase();
  if (!/^\.(?:png|jpe?g|webp)$/.test(extension)) throw new Error("reference_extension_unsupported");
  const aliasPath = path.join(path.dirname(job.packetPath), `reference-${job.referenceSha256.slice(0, 16)}${extension}`);
  if (!fs.existsSync(aliasPath)) fs.copyFileSync(job.referenceFile, aliasPath);
  if (sha256(fs.readFileSync(aliasPath)) !== job.referenceSha256) throw new Error("reference_upload_alias_hash_mismatch");
  return aliasPath;
}

async function selectMediaAndAddToPrompt(page, dialog, referenceFileName) {
  if (!/^[a-zA-Z0-9._-]+$/.test(referenceFileName)) throw new Error("reference_media_filename_invalid");
  const images = dialog.locator(`img[alt="${referenceFileName}"]`);
  const mediaAssetCount = await images.count();
  if (mediaAssetCount === 0) return null;
  const sources = await images.evaluateAll((elements) => [...new Set(elements
    .map((element) => element.getAttribute("src") ?? "")
    .filter(Boolean))]);
  if (sources.length === 0) return null;
  // Flow may retain duplicate uploads of the same hash-bound alias after a pre-submit retry.
  // Always select the role=option tile containing an exact-alias image so a stale media
  // selection cannot drive the Add action.
  const mediaOptions = dialog.locator(`[role="option"]:has(img[alt="${referenceFileName}"])`);
  const mediaOptionCount = await mediaOptions.count();
  if (mediaOptionCount === 0) return null;
  const mediaOption = await firstVisible(mediaOptions);
  if (!mediaOption) return null;
  const selectedOptionSelector = `[role="option"][aria-selected="true"]:has(img[alt="${referenceFileName}"])`;
  let selected = await dialog.locator(selectedOptionSelector).count() > 0;
  if (!selected) await mediaOption.click({ force: true, timeout: 5_000 });
  const selectionDeadline = Date.now() + 5_000;
  while (Date.now() < selectionDeadline) {
    selected = await dialog.locator(selectedOptionSelector).count() > 0;
    if (selected) break;
    await page.waitForTimeout(100);
  }
  if (!selected) throw new Error("reference_media_option_not_selected");
  const selectedOptionCount = await dialog.locator('[role="option"][aria-selected="true"]:has(img)').count();
  if (selectedOptionCount !== 1) {
    throw new Error(`reference_media_selection_count_invalid:${selectedOptionCount}`);
  }
  const selectedImage = dialog.locator(selectedOptionSelector).locator(`img[alt="${referenceFileName}"]`).first();
  const selectedMediaSource = await selectedImage.getAttribute("src");
  if (!selectedMediaSource) throw new Error("reference_media_source_missing_after_selection");
  const addToPrompt = await waitForFirstVisible(
    page,
    dialog.locator("button").filter({ hasText: /프롬프트에 추가|Add to prompt/i }),
  );
  if (!addToPrompt || !(await addToPrompt.isEnabled().catch(() => false))) {
    throw new Error("add_reference_to_prompt_missing");
  }
  await addToPrompt.click();
  await page.waitForTimeout(500);
  return {
    referenceFileName,
    mediaAssetCount,
    mediaOptionCount,
    mediaUniqueSourceCount: sources.length,
    selectedOptionCount,
    selectedMediaSource,
  };
}

async function inspectComposerBinding(promptBox) {
  return promptBox.evaluate((element) => {
    const scope = element.parentElement?.parentElement;
    const attachments = scope ? [...scope.querySelectorAll("img")].map((image) => ({
      alt: image.getAttribute("alt") ?? "",
      source: image.currentSrc || image.getAttribute("src") || "",
    })) : [];
    return {
      promptText: String(element.textContent ?? "").replace(/\s+/g, " ").trim(),
      attachments,
    };
  });
}

async function verifyComposerBinding(promptBox, job, evidence) {
  const inspected = await inspectComposerBinding(promptBox);
  if (sha256(inspected.promptText) !== job.promptSha256) throw new Error("prompt_dom_hash_mismatch_before_make");
  if (inspected.attachments.length !== 1) {
    throw new Error(`reference_attachment_count_invalid_before_make:${inspected.attachments.length}`);
  }
  const attachment = inspected.attachments[0];
  const sourceHash = attachment.source ? sha256(attachment.source) : null;
  if (attachment.alt !== evidence.referenceFileName && sourceHash !== evidence.composerAttachmentSourceSha256) {
    throw new Error("reference_attachment_identity_mismatch_before_make");
  }
  return { promptDomSha256: job.promptSha256, attachmentCount: 1, composerAttachmentSourceSha256: sourceHash };
}

async function fillPromptAndVerify(page, job, referenceEvidence) {
  const promptBox = await firstVisible(page.locator('[contenteditable="true"][data-placeholder*="만들"], [contenteditable="true"][aria-label*="만들"], [contenteditable="true"]'));
  if (!promptBox) throw new Error("prompt_composer_missing");
  await promptBox.fill(job.prompt);
  const promptDomSha256 = sha256(normalized(await promptBox.innerText()));
  if (promptDomSha256 !== job.promptSha256) throw new Error("prompt_dom_hash_mismatch");
  const inspected = await inspectComposerBinding(promptBox);
  const attachmentCount = inspected.attachments.length;
  if (attachmentCount !== 1) throw new Error(`reference_attachment_count_invalid:${attachmentCount}`);
  const attachment = inspected.attachments[0];
  const selectedMediaSourceSha256 = sha256(referenceEvidence.selectedMediaSource);
  const composerAttachmentSourceSha256 = attachment.source ? sha256(attachment.source) : null;
  const referenceIdentityMethod = classifyComposerReferenceIdentity({
    referenceFileName: referenceEvidence.referenceFileName,
    attachmentAlt: attachment.alt,
    selectedMediaSourceSha256,
    composerAttachmentSourceSha256,
    baselineAttachmentCount: referenceEvidence.baselineAttachmentCount,
    selectedOptionCount: referenceEvidence.selectedOptionCount,
    attachmentCount,
  });
  if (!referenceIdentityMethod) throw new Error("reference_attachment_identity_mismatch");
  const { selectedMediaSource: _selectedMediaSource, ...safeReferenceEvidence } = referenceEvidence;
  return {
    evidence: {
      ...safeReferenceEvidence,
      promptDomSha256,
      attachmentCount,
      selectedMediaSourceSha256,
      composerAttachmentSourceSha256,
      referenceIdentityMethod,
    },
    promptBox,
  };
}

async function waitForUploadedReferenceDialog(page, uploadFileName, timeoutMs = 60_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    let pickerDialog = await firstVisible(
      page.locator('[role="dialog"]').filter({ hasText: /(?:미디어 업로드|Upload media|프롬프트에 추가|Add to prompt)/i }),
    );
    if (!pickerDialog) {
      const pickerButton = await firstVisible(page.locator("button").filter({ hasText: /add_2/i }));
      if (pickerButton) {
        await pickerButton.click();
        await page.waitForTimeout(500);
        pickerDialog = await firstVisible(
          page.locator('[role="dialog"]').filter({ hasText: /(?:미디어 업로드|Upload media|프롬프트에 추가|Add to prompt)/i }),
        );
      }
    }
    if (pickerDialog && await pickerDialog.locator(`img[alt="${uploadFileName}"]`).count() > 0) {
      return pickerDialog;
    }
    await page.waitForTimeout(500);
  }
  return null;
}

async function attachReferenceAndPrompt(page, job, priorSummary) {
  const emptyPromptBox = await firstVisible(page.locator('[contenteditable="true"][data-placeholder*="만들"], [contenteditable="true"][aria-label*="만들"], [contenteditable="true"]'));
  if (!emptyPromptBox) throw new Error("prompt_composer_missing_before_reference");
  const baselineComposer = await inspectComposerBinding(emptyPromptBox);
  if (baselineComposer.attachments.length !== 0) {
    throw new Error(`prompt_composer_not_empty_before_reference:${baselineComposer.attachments.length}`);
  }
  const assetPicker = await waitForFirstVisible(
    page,
    page.locator("button").filter({ hasText: /^\s*add_2\s*(?:만들기|Create)\s*$/i }),
  );
  if (!assetPicker) throw new Error("asset_picker_button_missing");
  await assetPicker.click();
  let pickerDialog = await waitForFirstVisible(
    page,
    page.locator('[role="dialog"]').filter({ hasText: /(?:미디어 업로드|Upload media|프롬프트에 추가|Add to prompt)/i }),
  );
  if (!pickerDialog) throw new Error("media_picker_dialog_missing");

  const uploadReferenceFile = buildReferenceUploadAlias(job);
  const uploadFileName = path.basename(uploadReferenceFile);

  const recoverPriorUpload = priorSummary?.status === "FAILED_NO_AUTOMATIC_RETRY" &&
    priorSummary?.jobId === job.jobId &&
    priorSummary?.submissionCount === 0 &&
    priorSummary?.referenceSha256 === job.referenceSha256 &&
    priorSummary?.promptSha256 === job.semanticPromptSha256;
  if (recoverPriorUpload) {
    const recovered = await selectMediaAndAddToPrompt(page, pickerDialog, uploadFileName);
    if (recovered) {
      return fillPromptAndVerify(page, job, {
        ...recovered,
        baselineAttachmentCount: baselineComposer.attachments.length,
        referenceSource: "recovered_prior_upload",
      });
    }
  }

  const uploadButton = await firstVisible(pickerDialog.getByText(/^(?:upload\s*)?(?:미디어 업로드|Upload media)$/i, { exact: true }));
  if (!uploadButton) throw new Error("media_upload_button_missing");
  const chooserPromise = page.waitForEvent("filechooser", { timeout: 10_000 });
  await uploadButton.click();
  const chooser = await chooserPromise;
  await chooser.setFiles(uploadReferenceFile);
  pickerDialog = await waitForUploadedReferenceDialog(page, uploadFileName);
  if (!pickerDialog) throw new Error("uploaded_reference_missing_from_media_picker");
  const attached = await selectMediaAndAddToPrompt(page, pickerDialog, uploadFileName);
  if (!attached) throw new Error("uploaded_reference_missing_from_media_picker");
  return fillPromptAndVerify(page, job, {
    ...attached,
    baselineAttachmentCount: baselineComposer.attachments.length,
    referenceSource: "uploaded_hash_alias",
  });
}

async function approveRequiredGenerationConfirmation(page, confirmation, job, callbacks) {
  const confirmationText = confirmation.confirmationText;
  if (!hasRequiredGenerationFacts(
    confirmationText,
    job.providerTarget.expectedCreditsPerGeneration,
    job.providerTarget.outputCount,
  )) throw new Error("generation_cost_or_output_facts_unconfirmed");
  const atomicEvidence = await clickRequiredGenerationConfirmationAtomic(page, job, confirmation.selected, callbacks);
  // The captured event belongs to the exact newly-created card. A page-global
  // "승인" counter can be changed by another historical card and is not proof
  // about this attempt, so result binding below is the next authoritative step.
  return atomicEvidence;
}

async function submitWithRequiredConfirmation(
  page,
  job,
  promptBox,
  composerEvidence,
  initialResultHrefs,
  callbacks,
) {
  await ensureAgentPanelOpen(page);
  await verifyComposerBinding(promptBox, job, composerEvidence);
  const baselineSnapshot = await collectGenerationConfirmationCandidates(page, job);
  const baseline = captureGenerationConfirmationBaseline(baselineSnapshot);
  await verifyComposerBinding(promptBox, job, composerEvidence);
  await clickCurrentComposerMakeAtomic(page, promptBox, {
    onClickArmed: (evidence) => callbacks.onMakeClickArmed({
      ...evidence,
      approvalElementCountBefore: baselineSnapshot.approvalElementCount,
      promptBoundApprovalCardCountsBefore: baseline.cardCounts,
    }),
    onClickDispatched: callbacks.onMakeClickDispatched,
  });

  const result = await waitForPostMakeOutcome(page, job, {
    confirmationBaseline: baseline,
    initialResultHrefs,
    projectUrl: GEMINI_FLOW_TARGET.projectUrl,
    timeoutMs: GENERATION_TIMEOUT_MS,
  });
  if (result.state === "direct_result") {
    const evidence = {
      clickDispatched: false,
      observedBy: "exact_attempt_result_after_make_no_confirmation",
      submissionCount: 1,
      postMakeObservation: result.observation,
    };
    callbacks.onDirectResultObserved(result.binding, evidence);
    return evidence;
  }
  if (result.state === "timeout") {
    const observation = result.observation;
    const error = new Error(
      `post_make_outcome_timeout:baseline=${baselineSnapshot.approvalElementCount},` +
      `last=${observation.lastApprovalElementCount},max=${observation.maxApprovalElementCount},` +
      `factsMax=${observation.maxCreditFactCandidateCount},` +
      `interactiveMax=${observation.maxInteractiveCreditCandidateCount},polls=${observation.pollCount}`,
    );
    error.postMakeObservation = observation;
    throw error;
  }
  callbacks.onMakeClickConfirmedNoSubmission({
    observedBy: "required_credit_confirmation_visible",
    creditPromptMatches: true,
    postMakeObservation: result.observation,
  });
  return approveRequiredGenerationConfirmation(page, result.confirmation, job, callbacks);
}

async function currentFlowResultHrefs(page) {
  return page.locator('a[href*="/edit/"]').evaluateAll((elements) => [...new Set(elements
    .map((element) => element.href)
    .filter(Boolean))]);
}

async function stabilizeExistingFlowResultHrefs(page, timeoutMs = 10_000) {
  const deadline = Date.now() + timeoutMs;
  let previousKey = null;
  let stableCount = 0;
  let latest = [];
  while (Date.now() < deadline) {
    latest = (await currentFlowResultHrefs(page)).sort();
    const key = JSON.stringify(latest);
    stableCount = key === previousKey ? stableCount + 1 : 0;
    if (stableCount >= 6) return latest;
    previousKey = key;
    await page.waitForTimeout(500);
  }
  return latest;
}

async function waitForGeneratedVideoPageEvidence(page, job, timeoutMs = 60_000) {
  const deadline = Date.now() + timeoutMs;
  let lastPromptMatched = false;
  let lastAspectRatioMatched = false;
  while (Date.now() < deadline) {
    const editBodyText = normalized(await visibleBodyText(page));
    const promptMatched = editBodyText.includes(normalized(job.prompt));
    const aspectRatioMatched = /(?:crop_portrait\s*)?9:16\s*9:16/i.test(editBodyText);
    lastPromptMatched = promptMatched;
    lastAspectRatioMatched = aspectRatioMatched;
    const sources = await page.locator("video").evaluateAll((elements) => [...new Set(elements
      .map((element) => element.currentSrc || element.getAttribute("src") || "")
      .filter(Boolean))]);
    if (sources.length > 1) throw new Error(`generated_video_source_ambiguous:${sources.length}`);
    if (promptMatched && aspectRatioMatched && sources.length === 1) return sources[0];
    await page.waitForTimeout(1_000);
  }
  if (!lastPromptMatched) throw new Error("generated_video_prompt_mismatch");
  if (!lastAspectRatioMatched) throw new Error("generated_video_aspect_ratio_evidence_missing");
  throw new Error("generated_video_source_ambiguous:0");
}

async function generatedVideoPagePromptMatches(page, job, timeoutMs = 15_000) {
  const deadline = Date.now() + timeoutMs;
  const expectedPrompt = normalized(job.prompt);
  while (Date.now() < deadline) {
    const editBodyText = normalized(await visibleBodyText(page));
    if (editBodyText.includes(expectedPrompt)) return true;
    const promptPanelReady = /(?:프롬프트\s*펼치기|Expand\s*prompt|Reuse\s*prompt|텍스트\s*프롬프트\s*재사용)/i.test(editBodyText);
    if (promptPanelReady && await page.locator("video").count() > 0) return false;
    await page.waitForTimeout(500);
  }
  return false;
}

async function waitForExactFlowResultBinding(page, initialResultHrefs, job, knownBinding = null) {
  if (knownBinding) {
    const parsed = parseExactFlowResultUrl(knownBinding.editUrl, GEMINI_FLOW_TARGET.projectUrl);
    if (!parsed || parsed.providerResultId !== knownBinding.providerResultId) {
      throw new Error("stored_flow_result_binding_invalid");
    }
    return { ...parsed, observedBy: "stored_exact_result_binding" };
  }

  const startedAt = Date.now();
  let stableBindingKey = null;
  let stableBindingCount = 0;
  let lastMarkerProbeKey = null;
  let nextMarkerProbeAt = 0;
  while (Date.now() - startedAt < GENERATION_TIMEOUT_MS) {
    await page.waitForTimeout(2_000);
    const classified = classifyVeoBody(await visibleBodyText(page));
    if (classified?.type === "quota") throw new Error("quota_exhausted_after_submission_no_fallback");
    if (classified?.type === "refusal") throw new Error("generation_refused");
    if (classified?.type === "transient") throw new Error("generation_transient_error_no_retry");

    const direct = parseExactFlowResultUrl(page.url(), GEMINI_FLOW_TARGET.projectUrl);
    let candidates;
    if (direct) {
      const promptMatches = await generatedVideoPagePromptMatches(page, job);
      candidates = [{
        href: direct.editUrl,
        exactPromptMatches: promptMatches,
        scopeLinkCount: 1,
        videoCount: await page.locator("video").count(),
        observedBy: "same_page_navigation",
      }];
    } else {
      candidates = await collectPromptBoundFlowResultCandidates(
        page,
        job.prompt,
        submitEvidence?.approvalCardToken ?? null,
      );
    }
    let selected = selectExactNewFlowResult(candidates, initialResultHrefs, GEMINI_FLOW_TARGET.projectUrl);
    if (!direct && selected.state === "waiting") {
      const baseline = new Set(initialResultHrefs
        .map((href) => parseExactFlowResultUrl(href, GEMINI_FLOW_TARGET.projectUrl)?.editUrl)
        .filter(Boolean));
      const deltaKey = JSON.stringify([...new Set(candidates
        .map((candidate) => parseExactFlowResultUrl(candidate?.href, GEMINI_FLOW_TARGET.projectUrl)?.editUrl)
        .filter((href) => href && !baseline.has(href)))].sort());
      if (deltaKey !== "[]" && (deltaKey !== lastMarkerProbeKey || Date.now() >= nextMarkerProbeAt)) {
        lastMarkerProbeKey = deltaKey;
        nextMarkerProbeAt = Date.now() + 5_000;
        const markerCandidates = await inspectExactAttemptMarkerResultCandidates(
          page,
          job.prompt,
          initialResultHrefs,
          GEMINI_FLOW_TARGET.projectUrl,
        );
        selected = selectExactNewFlowResult(markerCandidates, initialResultHrefs, GEMINI_FLOW_TARGET.projectUrl);
      }
    }
    if (selected.state === "ambiguous") {
      throw new Error(`flow_result_binding_ambiguous:${selected.candidateResultIds.join(",")}`);
    }
    if (selected.state === "ready") {
      const bindingKey = `${selected.binding.providerResultId}\n${selected.binding.editUrl}`;
      stableBindingCount = bindingKey === stableBindingKey ? stableBindingCount + 1 : 1;
      stableBindingKey = bindingKey;
      if (stableBindingCount >= 3) return selected.binding;
    } else {
      stableBindingKey = null;
      stableBindingCount = 0;
    }
  }
  throw new Error("flow_result_binding_timeout_no_search");
}

async function downloadGeneratedVideo(page, targetPath, initialResultHrefs, job, options = {}) {
  const binding = await waitForExactFlowResultBinding(page, initialResultHrefs, job, options.knownBinding ?? null);
  if (typeof options.onResultBound === "function") options.onResultBound(binding);
  if (page.url() !== binding.editUrl) {
    // Exactly one job-bound URL is selected before this single navigation.
    // Never traverse project history or inspect unrelated result pages.
    await page.goto(binding.editUrl, { waitUntil: "domcontentloaded", timeout: 30_000 });
  }
  const source = await waitForGeneratedVideoPageEvidence(page, job);
  const mediaUrl = new URL(source, page.url());
  if (mediaUrl.hostname !== "labs.google" || mediaUrl.pathname !== "/fx/api/trpc/media.getMediaUrlRedirect") {
    throw new Error("generated_video_source_url_untrusted");
  }
  const response = await page.context().request.get(mediaUrl.href, { timeout: 60_000 });
  if (!response.ok()) throw new Error(`generated_video_download_failed:${response.status()}`);
  const contentType = response.headers()["content-type"] ?? "";
  if (!/^video\//i.test(contentType)) throw new Error(`generated_video_content_type_invalid:${contentType}`);
  const tempPath = `${targetPath}.${options.attemptId ?? process.pid}.download.tmp`;
  try {
    fs.writeFileSync(tempPath, await response.body());
    if (!fs.existsSync(tempPath) || fs.statSync(tempPath).size < 100_000) throw new Error("downloaded_video_too_small");
    fs.renameSync(tempPath, targetPath);
  } finally {
    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
  }
  return {
    ...binding,
    mediaUrl: mediaUrl.href,
    contentType,
  };
}

function probeVideo(videoPath) {
  const result = spawnSync("ffprobe", [
    "-v", "error", "-print_format", "json", "-show_streams", "-show_format", videoPath,
  ], { shell: false, encoding: "utf8", timeout: 60_000, maxBuffer: 2 * 1024 * 1024 });
  if (result.status !== 0) throw new Error("ffprobe_failed");
  const probe = JSON.parse(result.stdout);
  const video = probe.streams?.find((stream) => stream.codec_type === "video");
  const audioStreamCount = probe.streams?.filter((stream) => stream.codec_type === "audio").length ?? 0;
  const durationSec = Number(probe.format?.duration ?? video?.duration);
  if (!video || !Number.isInteger(video.width) || !Number.isInteger(video.height)) throw new Error("video_stream_missing");
  if (video.height <= video.width || Math.abs(video.width / video.height - 9 / 16) > 0.03) throw new Error("video_not_portrait_9_16");
  if (!Number.isFinite(durationSec) || durationSec < 1 || durationSec > 20) throw new Error("video_duration_out_of_bounds");
  return { width: video.width, height: video.height, durationSec, audioStreamCount };
}

function providerOriginalVideoPath(expectedVideoPath) {
  const jobRoot = path.dirname(expectedVideoPath);
  const canonical = path.join(jobRoot, "flow-motion-provider-original.mp4");
  if (!fs.existsSync(canonical)) return canonical;
  return path.join(jobRoot, `flow-motion-provider-original-${Date.now()}-${process.pid}.mp4`);
}

function stripProviderAudio(providerVideoPath, expectedVideoPath) {
  const providerProbe = probeVideo(providerVideoPath);
  const videoOnlyTempPath = path.join(
    path.dirname(expectedVideoPath),
    `flow-motion-video-only-${Date.now()}-${process.pid}.tmp.mp4`,
  );
  const result = spawnSync("ffmpeg", [
    "-v", "error", "-y", "-i", providerVideoPath,
    "-map", "0:v:0", "-c:v", "copy", "-an", "-movflags", "+faststart",
    videoOnlyTempPath,
  ], { shell: false, encoding: "utf8", timeout: 120_000, maxBuffer: 2 * 1024 * 1024 });
  if (result.status !== 0 || !fs.existsSync(videoOnlyTempPath)) {
    throw new Error(`provider_audio_strip_failed:${normalized(result.stderr)}`);
  }
  const outputProbe = probeVideo(videoOnlyTempPath);
  if (outputProbe.audioStreamCount !== 0) throw new Error("provider_audio_strip_verification_failed");
  fs.renameSync(videoOnlyTempPath, expectedVideoPath);
  return {
    providerOriginalPath: providerVideoPath,
    providerOriginalSha256: sha256(fs.readFileSync(providerVideoPath)),
    providerAudioStreamCount: providerProbe.audioStreamCount,
    providerAudioRemoved: providerProbe.audioStreamCount > 0,
    outputAudioStreamCount: outputProbe.audioStreamCount,
  };
}

const forbiddenArg = forbiddenArgs.find((arg) => process.argv.includes(arg));
if (modes.length !== 1) fail("choose_exactly_one_mode");
if (forbiddenArg) fail("forbidden_argument", forbiddenArg);
const packetPath = argValue("--packet-path");
const statePath = argValue("--state-path");
const jobId = argValue("--job-id");
if (!packetPath || !statePath || !jobId) fail("packet_state_job_args_required");
const live = modes[0] === "--generate-live";
const ownerApproval = argValue("--owner-approval");
const recoverExistingOnly = process.argv.includes("--recover-existing-only");
if (live && process.env.ALLOW_FLOW_MOTION_GENERATION !== "1") fail("live_generation_marker_missing");
if (live && !ownerApproval) fail("owner_approval_required");
if (!live && ownerApproval) fail("owner_approval_is_live_only");
if (!live && recoverExistingOnly) fail("recovery_only_is_live_only");
const contract = validateContracts(packetPath, statePath, jobId, ownerApproval, live, recoverExistingOnly);

if (!live) {
  console.log(JSON.stringify({
    passed: true,
    mode: "contract_check_no_browser",
    jobId,
    referenceSha256: contract.job.referenceSha256,
    promptSha256: contract.job.promptSha256,
    expectedVideoPath: contract.expectedVideoPath,
    browserImported: false,
    browserAccessed: false,
    submissionCount: 0,
    creditsSpent: 0,
  }, null, 2));
  process.exit(0);
}

const summaryPath = path.join(path.dirname(contract.expectedVideoPath), "generation-summary.json");
let executionLock = null;
const leaseRequestId = randomUUID();
try {
  // Acquire the OS-backed single-flight lease before reading any mutable summary
  // or output state. This removes the pre-lock TOCTOU window between two jobs.
  executionLock = await acquireFlowMotionExecutionLock(OUTPUT_ROOT, {
    attemptId: leaseRequestId,
    jobId,
  });
} catch (error) {
  console.log(JSON.stringify({
    schemaVersion: "money_shorts_flow_motion_generation_summary_v1",
    status: "EXECUTION_LOCK_BLOCKED_NO_BROWSER",
    attemptId: leaseRequestId,
    jobId,
    submissionCount: 0,
    expectedCreditsSpent: 0,
    browserAccessed: false,
    failure: `flow_motion_execution_lock_unavailable:${String(error?.message ?? error)}`,
  }, null, 2));
  process.exit(2);
}
const priorSummary = fs.existsSync(summaryPath) ? loadJson(summaryPath, "prior_summary") : null;
const priorSummaryClassification = classifyPriorFlowMotionGenerationSummary(
  priorSummary,
  GEMINI_FLOW_TARGET.expectedCreditsPerGeneration,
);
if (priorSummaryClassification.action === "block") {
  fail("prior_approval_click_outcome_requires_manual_review", priorSummaryClassification.reason);
}
const priorSubmissionCount = priorSummaryClassification.submissionCount;
const safeNewAttempt = priorSummaryClassification.action === "safe_new_attempt";
const priorAttemptIdValid = isAttemptId(priorSummary?.attemptId);
const priorProviderPrompt = priorAttemptIdValid
  ? buildProviderPrompt(contract.job.prompt, priorSummary.attemptId)
  : null;
const priorProviderPromptValid = priorProviderPrompt !== null &&
  priorSummary?.providerPromptMarker === priorProviderPrompt.marker &&
  priorSummary?.providerPromptSha256 === sha256(priorProviderPrompt.prompt);
const priorResultBinding = priorSummary?.resultBinding &&
  parseExactFlowResultUrl(priorSummary.resultBinding.editUrl, GEMINI_FLOW_TARGET.projectUrl);
const priorResultBindingValid = priorSummary?.resultBinding == null || (
  priorSummary.resultBinding.schemaVersion === "money_shorts_flow_motion_result_binding_v1" &&
  priorResultBinding?.providerResultId === priorSummary.resultBinding.providerResultId &&
  priorSummary.resultBinding.attemptId === priorSummary.attemptId &&
  priorSummary.resultBinding.jobId === jobId &&
  priorSummary.resultBinding.referenceSha256 === contract.job.referenceSha256 &&
  priorSummary.resultBinding.promptSha256 === contract.job.promptSha256 &&
  priorSummary.resultBinding.providerPromptSha256 === priorSummary.providerPromptSha256
);
const priorResumeIdentityValid =
  priorSummary?.schemaVersion === "money_shorts_flow_motion_generation_summary_v1" &&
  priorSummary?.jobId === jobId &&
  priorSummary?.referenceSha256 === contract.job.referenceSha256 &&
  priorSummary?.promptSha256 === contract.job.promptSha256 &&
  samePath(priorSummary?.outputVideoPath ?? "", contract.expectedVideoPath) &&
  Array.isArray(priorSummary?.initialVideoEditHrefs) &&
  priorAttemptIdValid &&
  priorProviderPromptValid &&
  priorResultBindingValid;
const resumeSubmittedResult = priorSummaryClassification.action === "resume_submitted_result" &&
  priorResumeIdentityValid;
const reconcileUncertainResult = priorSummaryClassification.action === "reconcile_uncertain_result" &&
  priorResumeIdentityValid;
if (priorSummaryClassification.action === "resume_submitted_result" && !resumeSubmittedResult) {
  fail("prior_submission_requires_new_owner_approval");
}
if (priorSummaryClassification.action === "reconcile_uncertain_result" && !reconcileUncertainResult) {
  fail("prior_uncertain_result_identity_invalid");
}
if (recoverExistingOnly && !resumeSubmittedResult && !reconcileUncertainResult) {
  fail("recovery_only_requires_existing_attempt");
}
if (!recoverExistingOnly && (resumeSubmittedResult || reconcileUncertainResult)) {
  fail("existing_attempt_requires_recovery_only");
}
const resumeExistingResult = recoverExistingOnly && (resumeSubmittedResult || reconcileUncertainResult);
const finalizeExistingOutput = resumeSubmittedResult &&
  priorSummary?.resultBinding != null &&
  fs.existsSync(contract.expectedVideoPath);
const profileAttempts = [];
const attemptId = resumeExistingResult ? priorSummary.attemptId : randomUUID();
const providerPrompt = buildProviderPrompt(contract.job.prompt, attemptId);
const providerPromptSha256 = sha256(providerPrompt.prompt);
const providerJob = {
  ...contract.job,
  prompt: providerPrompt.prompt,
  promptSha256: providerPromptSha256,
  semanticPromptSha256: contract.job.promptSha256,
};
let page = null;
let pageOpenedByRunner = false;
let selectedProfile = null;
let submissionCount = 0;
let makeClickAttemptCount = safeNewAttempt ? 0 : Number(priorSummary?.makeClickAttemptCount ?? 0);
let makeClickOutcomeUnknown = reconcileUncertainResult && priorSummary?.status === "MAKE_CLICK_OUTCOME_UNKNOWN";
let makeClickIntent = safeNewAttempt ? null : (priorSummary?.makeClickIntent ?? null);
let approvalClickAttemptCount = safeNewAttempt
  ? 0
  : Number(priorSummary?.approvalClickAttemptCount ?? (priorSubmissionCount > 0 ? 1 : 0));
let approvalClickOutcomeUnknown = reconcileUncertainResult && priorSummary?.status === "APPROVAL_CLICK_OUTCOME_UNKNOWN";
let approvalClickIntent = safeNewAttempt ? null : (priorSummary?.approvalClickIntent ?? null);
let composerEvidence = null;
let submitEvidence = null;
let initialVideoEditHrefs = [];
let resultBinding = resumeExistingResult ? priorSummary.resultBinding : null;
let postMakeObservation = null;
let postMakeFailureEvidence = null;
let summary;
function generationSummary(status, overrides = {}) {
  return {
    schemaVersion: "money_shorts_flow_motion_generation_summary_v1",
    status,
    attemptId,
    jobId,
    generatedAt: new Date().toISOString(),
    selectedProfile: selectedProfile?.desktopShortcutName ?? null,
    profileAttempts,
    submissionCount,
    expectedCreditsSpent: submissionCount === 1
      ? GEMINI_FLOW_TARGET.expectedCreditsPerGeneration
      : (makeClickOutcomeUnknown || approvalClickOutcomeUnknown) ? null : 0,
    makeClickAttemptCount,
    makeClickIntent,
    approvalClickAttemptCount,
    approvalClickIntent,
    referenceSha256: contract.job.referenceSha256,
    promptSha256: contract.job.promptSha256,
    providerPromptMarker: providerPrompt.marker,
    providerPromptSha256,
    outputVideoPath: contract.expectedVideoPath,
    initialVideoEditHrefs,
    composerEvidence,
    submitEvidence,
    resultBinding,
    postMakeObservation,
    postMakeFailureEvidence,
    ownerQaPassed: false,
    renderReady: false,
    ...overrides,
  };
}
function persistSummary(status, overrides = {}) {
  writeJsonAtomic(summaryPath, generationSummary(status, overrides), attemptId);
}
function recordMakeClickIntentArmed(evidence) {
  if (makeClickAttemptCount > 0) throw new Error("make_click_attempt_duplicate");
  makeClickAttemptCount = 1;
  makeClickOutcomeUnknown = true;
  makeClickIntent = evidence;
  persistSummary("MAKE_CLICK_OUTCOME_UNKNOWN");
}
function recordMakeClickConfirmedNoSubmission(evidence) {
  makeClickOutcomeUnknown = false;
  makeClickIntent = { ...makeClickIntent, ...evidence, outcomeConfirmedNoSubmission: true };
  persistSummary("CONFIRMATION_PENDING_NO_SUBMISSION");
}
function recordMakeClickDispatched(evidence) {
  makeClickIntent = { ...makeClickIntent, ...evidence, dispatchObserved: true };
  persistSummary("MAKE_CLICK_OUTCOME_UNKNOWN");
}
function recordApprovalClickIntentArmed(evidence) {
  if (approvalClickAttemptCount > 0) throw new Error("approval_click_attempt_duplicate");
  approvalClickAttemptCount = 1;
  approvalClickOutcomeUnknown = true;
  approvalClickIntent = evidence;
  persistSummary("APPROVAL_CLICK_OUTCOME_UNKNOWN");
}
function recordApprovalClickDispatched(evidence) {
  if (submissionCount === 1) return;
  submissionCount = 1;
  approvalClickOutcomeUnknown = false;
  submitEvidence = evidence;
  persistSummary("SUBMITTED_PENDING_RESULT");
}
function recordDirectResultObserved(binding, evidence) {
  submissionCount = 1;
  makeClickOutcomeUnknown = false;
  approvalClickOutcomeUnknown = false;
  submitEvidence = evidence;
  postMakeObservation = evidence.postMakeObservation ?? null;
  resultBinding = {
    ...binding,
    attemptId,
    jobId,
    referenceSha256: contract.job.referenceSha256,
    promptSha256: contract.job.promptSha256,
    providerPromptSha256,
  };
  persistSummary("SUBMITTED_RESULT_BOUND_PENDING_DOWNLOAD");
}
function recordResultBinding(binding) {
  if (reconcileUncertainResult && submissionCount === 0) {
    submissionCount = 1;
    makeClickOutcomeUnknown = false;
    approvalClickOutcomeUnknown = false;
    submitEvidence = {
      clickDispatched: false,
      observedBy: "exact_attempt_result_recovered_after_uncertain_click",
      submissionCount: 1,
    };
  }
  resultBinding = {
    ...binding,
    attemptId,
    jobId,
    referenceSha256: contract.job.referenceSha256,
    promptSha256: contract.job.promptSha256,
    providerPromptSha256,
  };
  persistSummary("SUBMITTED_RESULT_BOUND_PENDING_DOWNLOAD");
}
try {
  if (finalizeExistingOutput) {
    selectedProfile = GEMINI_VEO_PROFILE_CHAIN.find(
      (profile) => profile.desktopShortcutName === priorSummary.selectedProfile,
    ) ?? null;
    if (!selectedProfile) throw new Error("existing_output_profile_invalid");
    profileAttempts.push({ profileId: selectedProfile.profileId, state: "selected_existing_output_finalize" });
    initialVideoEditHrefs = priorSummary.initialVideoEditHrefs;
    composerEvidence = priorSummary.composerEvidence;
    submitEvidence = priorSummary.submitEvidence;
    submissionCount = 1;
    const existingProbe = probeVideo(contract.expectedVideoPath);
    if (existingProbe.audioStreamCount !== 0) throw new Error("existing_output_audio_not_stripped");
    summary = generationSummary("OWNER_QA_REQUIRED", {
      outputVideoSha256: sha256(fs.readFileSync(contract.expectedVideoPath)),
      probe: existingProbe,
      downloadEvidence: {
        ...resultBinding,
        recoveredExistingOutput: true,
      },
    });
  } else {
  const { chromium } = await import("playwright");
  for (const profile of GEMINI_VEO_PROFILE_CHAIN) {
    if (resumeExistingResult && profile.desktopShortcutName !== priorSummary.selectedProfile) continue;
    if (!await isCDPOpen(profile.cdpPort)) {
      try {
        // The exact per-scene Owner approval already opened this live path. After a
        // reboot, restore only the fixed isolated Gemini profile; do not submit,
        // change accounts or mutate settings during browser startup.
        await ensureChrome(profile.cdpPort, profile.userDataDir, () => {});
      } catch (error) {
        profileAttempts.push({ profileId: profile.profileId, state: "unavailable", reason: "cdp_auto_launch_failed" });
        const detail = String(error?.message ?? error).replace(/\s+/g, " ").slice(0, 160);
        throw new Error(`gemini_${profile.profileId}_cdp_auto_launch_failed:${detail}`);
      }
    }
    const browser = await chromium.connectOverCDP(`http://127.0.0.1:${profile.cdpPort}`);
    const context = browser.contexts()[0];
    if (!context) throw new Error(`gemini_${profile.profileId}_browser_context_missing`);
    // Every attempt gets a new dedicated project-root page. Existing tabs and
    // pending cards can belong to older images/prompts and are never resumed.
    page = await context.newPage();
    pageOpenedByRunner = true;
    await page.goto(GEMINI_FLOW_TARGET.projectUrl, { waitUntil: "domcontentloaded", timeout: 30_000 });
    await page.waitForTimeout(2_500);
    const currentUrl = new URL(page.url());
    if (!isExactGeminiFlowProjectRootUrl(currentUrl.href, GEMINI_FLOW_TARGET.projectId)) {
      throw new Error(`gemini_${profile.profileId}_flow_project_mismatch`);
    }
    await closeStaleAgentPanel(page);
    const quota = resumeExistingResult ? null : await inspectExplicitQuota(page);
    if (quota) {
      profileAttempts.push({ profileId: profile.profileId, state: "quota_exhausted", evidence: quota.snippet ?? quota.text });
      if (pageOpenedByRunner) await page.close();
      page = null;
      pageOpenedByRunner = false;
      continue;
    }
    selectedProfile = profile;
    profileAttempts.push({ profileId: profile.profileId, state: resumeExistingResult ? "selected_resume_download" : "selected" });
    break;
  }
  if (!page || !selectedProfile) throw new Error("all_allowed_profiles_quota_exhausted_or_unavailable");

  if (sha256(fs.readFileSync(contract.referencePath)) !== contract.job.referenceSha256 || sha256(contract.job.prompt) !== contract.job.promptSha256) {
    throw new Error("hash_changed_immediately_before_submit");
  }
  if (resumeExistingResult) {
    initialVideoEditHrefs = priorSummary.initialVideoEditHrefs;
    composerEvidence = priorSummary.composerEvidence;
    submitEvidence = priorSummary.submitEvidence;
    submissionCount = resumeSubmittedResult ? 1 : 0;
  } else {
    if (priorSummary?.status === "CONFIRMATION_PENDING_NO_SUBMISSION") {
      makeClickAttemptCount = 0;
      makeClickIntent = null;
    }
    const attachment = await attachReferenceAndPrompt(page, providerJob, priorSummary);
    composerEvidence = attachment.evidence;
    initialVideoEditHrefs = await stabilizeExistingFlowResultHrefs(page);
    submitEvidence = await submitWithRequiredConfirmation(
      page,
      providerJob,
      attachment.promptBox,
      composerEvidence,
      initialVideoEditHrefs,
      {
        onMakeClickArmed: recordMakeClickIntentArmed,
        onMakeClickDispatched: recordMakeClickDispatched,
        onMakeClickConfirmedNoSubmission: recordMakeClickConfirmedNoSubmission,
        onDirectResultObserved: recordDirectResultObserved,
        onClickArmed: recordApprovalClickIntentArmed,
        onClickDispatched: recordApprovalClickDispatched,
      },
    );
  }
  submissionCount = Number(submitEvidence?.submissionCount ?? submissionCount);
  if (!resumeExistingResult && !resultBinding) {
    persistSummary("SUBMITTED_PENDING_RESULT");
  }
  const providerOriginalPath = providerOriginalVideoPath(contract.expectedVideoPath);
  const downloadEvidence = await downloadGeneratedVideo(
    page,
    providerOriginalPath,
    initialVideoEditHrefs,
    providerJob,
    {
      knownBinding: resultBinding,
      onResultBound: recordResultBinding,
      attemptId,
    },
  );
  const audioNormalization = stripProviderAudio(providerOriginalPath, contract.expectedVideoPath);
  const probe = probeVideo(contract.expectedVideoPath);
  summary = generationSummary("OWNER_QA_REQUIRED", {
    outputVideoSha256: sha256(fs.readFileSync(contract.expectedVideoPath)),
    probe,
    downloadEvidence,
    audioNormalization,
  });
  }
} catch (error) {
  const failure = String(error?.message ?? error).replace(/\s+/g, " ").slice(0, 240);
  postMakeObservation = error?.postMakeObservation ?? postMakeObservation;
  const unknownMakeOutcome = makeClickOutcomeUnknown;
  const unknownClickOutcome = approvalClickOutcomeUnknown || failure.includes("approval_click_outcome_unknown_no_retry");
  if ((unknownMakeOutcome || unknownClickOutcome) && page && pageOpenedByRunner) {
    try {
      postMakeFailureEvidence = await capturePostMakeFailureEvidence(page, {
        job: providerJob,
        initialResultHrefs: initialVideoEditHrefs,
        observation: postMakeObservation,
        evidenceDirectory: path.dirname(summaryPath),
        attemptId,
      });
    } catch (evidenceError) {
      postMakeFailureEvidence = {
        evidenceCaptureError: String(evidenceError?.message ?? evidenceError).replace(/\s+/g, " ").slice(0, 240),
      };
    }
  }
  const confirmedNoSubmission = submissionCount === 0 &&
    approvalClickAttemptCount === 0 &&
    makeClickIntent?.outcomeConfirmedNoSubmission === true &&
    failure.startsWith("required_generation_confirmation_dialog_missing");
  const status = submissionCount === 1
    ? "SUBMITTED_RESULT_RECOVERY_REQUIRED"
    : unknownMakeOutcome
      ? "MAKE_CLICK_OUTCOME_UNKNOWN"
      : unknownClickOutcome
        ? "APPROVAL_CLICK_OUTCOME_UNKNOWN"
        : confirmedNoSubmission
          ? "CONFIRMATION_PENDING_NO_SUBMISSION"
          : "FAILED_NO_AUTOMATIC_RETRY";
  summary = generationSummary(status, {
    failure,
  });
} finally {
  if (page && pageOpenedByRunner) await page.close().catch(() => {});
  let finalizationError = null;
  try {
    if (summary) writeJsonAtomic(summaryPath, summary, attemptId);
  } catch (error) {
    finalizationError = error;
  }
  try {
    await executionLock.release();
  } catch (error) {
    finalizationError ??= error;
  }
  if (finalizationError) throw finalizationError;
}

console.log(JSON.stringify({ ...summary, summaryPath }, null, 2));
process.exit(summary.status === "OWNER_QA_REQUIRED" ? 0 : 1);
