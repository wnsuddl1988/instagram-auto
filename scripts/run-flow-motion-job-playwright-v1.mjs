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

import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

import { classifyVeoBody, isCDPOpen } from "./_gemini-veo-core.mjs";
import { GEMINI_VEO_PROFILE_CHAIN } from "./_gemini-veo-profile-chain.mjs";
import {
  GEMINI_FLOW_TARGET,
  isExactGeminiFlowProjectRootUrl,
} from "./_gemini-flow-no-submit-contract.mjs";
import {
  hasRequiredGenerationFacts,
  isApprovalAcknowledged,
} from "./_flow-motion-approval-selection.mjs";
import { classifyPriorFlowMotionGenerationSummary } from "./_flow-motion-generation-summary.mjs";
import {
  clickRequiredGenerationConfirmationAtomic,
  collectGenerationConfirmationCandidates,
  findCurrentComposerMakeButton,
  findRequiredGenerationConfirmation,
} from "./_flow-motion-confirmation-dom.mjs";

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

function samePath(left, right) {
  return path.resolve(left).toLowerCase() === path.resolve(right).toLowerCase();
}

function assertLocalPath(filePath, label) {
  const resolved = path.resolve(filePath);
  const rel = path.relative(OUTPUT_ROOT, resolved);
  if (!filePath || rel.startsWith("..") || path.isAbsolute(rel)) fail(`${label}_outside_local_output_root`);
  return resolved;
}

function validateContracts(packetPath, statePath, jobId, ownerApproval, live) {
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
  const packetResolved = assertLocalPath(packetPath, "packet");
  const stateResolved = assertLocalPath(statePath, "state");
  if (!samePath(job?.packetPath ?? "", packetResolved)) failures.push("job_packet_path_mismatch");
  if (path.dirname(expectedVideoPath) !== path.dirname(packetResolved)) failures.push("video_job_directory_mismatch");
  if (path.dirname(stateResolved) !== path.dirname(path.dirname(packetResolved))) failures.push("state_job_directory_mismatch");
  if (!fs.existsSync(referencePath)) failures.push("reference_missing");
  if (fs.existsSync(referencePath) && sha256(fs.readFileSync(referencePath)) !== job?.referenceSha256) failures.push("reference_hash_mismatch");
  if (sha256(job?.prompt ?? "") !== job?.promptSha256) failures.push("prompt_hash_mismatch");
  if (!String(job?.approval?.requiredWording ?? "").includes(job?.referenceSha256 ?? "")) failures.push("approval_reference_hash_missing");
  if (!String(job?.approval?.requiredWording ?? "").includes(job?.promptSha256 ?? "")) failures.push("approval_prompt_hash_missing");
  if (!String(job?.approval?.requiredWording ?? "").includes("quota_exhausted")) failures.push("approval_fallback_policy_missing");
  if (fs.existsSync(expectedVideoPath)) failures.push("output_already_exists");
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
  const addToPrompt = await waitForFirstVisible(
    page,
    dialog.locator("button").filter({ hasText: /프롬프트에 추가|Add to prompt/i }),
  );
  if (!addToPrompt || !(await addToPrompt.isEnabled().catch(() => false))) {
    throw new Error("add_reference_to_prompt_missing");
  }
  await addToPrompt.click();
  await page.waitForTimeout(500);
  return { referenceFileName, mediaAssetCount, mediaOptionCount, mediaUniqueSourceCount: sources.length };
}

async function fillPromptAndVerify(page, job, referenceEvidence) {
  const promptBox = await firstVisible(page.locator('[contenteditable="true"][data-placeholder*="만들"], [contenteditable="true"][aria-label*="만들"], [contenteditable="true"]'));
  if (!promptBox) throw new Error("prompt_composer_missing");
  await promptBox.fill(job.prompt);
  const promptDomSha256 = sha256(normalized(await promptBox.innerText()));
  if (promptDomSha256 !== job.promptSha256) throw new Error("prompt_dom_hash_mismatch");
  const attachmentCount = await promptBox.evaluate((element) => element.parentElement?.parentElement?.querySelectorAll("img").length ?? 0);
  if (attachmentCount !== 1) throw new Error(`reference_attachment_count_invalid:${attachmentCount}`);
  return {
    evidence: { ...referenceEvidence, promptDomSha256, attachmentCount },
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
  const assetPicker = await firstVisible(page.locator("button").filter({ hasText: /add_2/i }));
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
    priorSummary?.promptSha256 === job.promptSha256;
  if (recoverPriorUpload) {
    const recovered = await selectMediaAndAddToPrompt(page, pickerDialog, uploadFileName);
    if (recovered) {
      return fillPromptAndVerify(page, job, { ...recovered, referenceSource: "recovered_prior_upload" });
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
  return fillPromptAndVerify(page, job, { ...attached, referenceSource: "uploaded_hash_alias" });
}

async function waitForRequiredGenerationConfirmation(page, job, timeoutMs = 240_000) {
  const deadline = Date.now() + timeoutMs;
  let lastSnapshot = null;
  while (Date.now() < deadline) {
    // The exact prompt sibling is hash-verified before this point. Flow may
    // re-render the whole panel after Make, so global DOM indexes are not a
    // stable freshness signal; bind the confirmation to that exact prompt.
    const result = await findRequiredGenerationConfirmation(page, job);
    lastSnapshot = result.snapshot;
    if (result.confirmation) return { confirmation: result.confirmation, snapshot: result.snapshot };
    await page.waitForTimeout(250);
  }
  return { confirmation: null, snapshot: lastSnapshot };
}

async function approveRequiredGenerationConfirmation(page, confirmation, job, callbacks) {
  const confirmationText = confirmation.confirmationText;
  if (!hasRequiredGenerationFacts(
    confirmationText,
    job.providerTarget.expectedCreditsPerGeneration,
    job.providerTarget.outputCount,
  )) throw new Error("generation_cost_or_output_facts_unconfirmed");
  const acknowledgementCountBefore = await approvalAcknowledgementCount(page);
  const atomicEvidence = await clickRequiredGenerationConfirmationAtomic(page, job, confirmation.selected, callbacks);
  const clickEvidence = {
    ...atomicEvidence,
    acknowledgementCountBefore,
    acknowledgementCountAfter: null,
  };
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    const acknowledgementCountAfter = await approvalAcknowledgementCount(page);
    if (isApprovalAcknowledged(acknowledgementCountBefore, acknowledgementCountAfter)) {
      return {
        ...clickEvidence,
        acknowledgementCountAfter,
      };
    }
    await page.waitForTimeout(250);
  }
  throw new Error("confirmation_click_not_acknowledged");
}

async function approvalAcknowledgementCount(page) {
  return page.locator("p").filter({ hasText: /^\s*(?:승인|Approve)\s*$/i }).evaluateAll((elements) => elements.filter((element) =>
    /^(?:승인|Approve)$/i.test(String(element.textContent ?? "").replace(/\s+/g, " ").trim()),
  ).length);
}

async function submitWithRequiredConfirmation(page, job, promptBox, callbacks) {
  await ensureAgentPanelOpen(page);
  const makeButton = await findCurrentComposerMakeButton(promptBox);
  if (!makeButton) throw new Error("generation_make_button_unavailable_in_current_composer");
  const baseline = await collectGenerationConfirmationCandidates(page, job);
  await makeButton.click();

  const result = await waitForRequiredGenerationConfirmation(page, job);
  if (!result.confirmation) {
    const snapshot = result.snapshot;
    const facts = snapshot?.candidates?.filter((candidate) => candidate.creditPromptMatches).length ?? 0;
    const interactive = snapshot?.candidates?.filter((candidate) => candidate.creditPromptMatches && candidate.interactive).length ?? 0;
    throw new Error(
      `required_generation_confirmation_dialog_missing:baseline=${baseline.approvalElementCount},` +
      `current=${snapshot?.approvalElementCount ?? 0},facts=${facts},interactive=${interactive}`,
    );
  }
  return approveRequiredGenerationConfirmation(page, result.confirmation, job, callbacks);
}

async function videoEditHrefs(page) {
  return page.locator('a[href*="/edit/"]:has(video)').evaluateAll((elements) => [...new Set(elements
    .map((element) => element.href)
    .filter(Boolean))]);
}

async function waitForGeneratedVideoPageEvidence(page, job, timeoutMs = 60_000) {
  const deadline = Date.now() + timeoutMs;
  let promptMatched = false;
  let aspectRatioMatched = false;
  while (Date.now() < deadline) {
    const editBodyText = normalized(await visibleBodyText(page));
    promptMatched ||= editBodyText.includes(normalized(job.prompt));
    aspectRatioMatched ||= /(?:crop_portrait\s*)?9:16\s*9:16/i.test(editBodyText);
    const sources = await page.locator("video").evaluateAll((elements) => [...new Set(elements
      .map((element) => element.currentSrc || element.getAttribute("src") || "")
      .filter(Boolean))]);
    if (sources.length > 1) throw new Error(`generated_video_source_ambiguous:${sources.length}`);
    if (promptMatched && aspectRatioMatched && sources.length === 1) return sources[0];
    await page.waitForTimeout(1_000);
  }
  if (!promptMatched) throw new Error("generated_video_prompt_mismatch");
  if (!aspectRatioMatched) throw new Error("generated_video_aspect_ratio_evidence_missing");
  throw new Error("generated_video_source_ambiguous:0");
}

async function downloadGeneratedVideo(page, targetPath, initialVideoEditHrefs, job) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < GENERATION_TIMEOUT_MS) {
    await page.waitForTimeout(5_000);
    const classified = classifyVeoBody(await visibleBodyText(page));
    if (classified?.type === "quota") throw new Error("quota_exhausted_after_submission_no_fallback");
    if (classified?.type === "refusal") throw new Error("generation_refused");
    if (classified?.type === "transient") throw new Error("generation_transient_error_no_retry");
    const currentPageEditHref = /\/edit\/[a-f0-9-]+/i.test(page.url()) ? page.url() : null;
    const currentVideoEditHrefs = await videoEditHrefs(page);
    const newVideoEditHrefs = [...new Set([
      ...currentVideoEditHrefs,
      ...(currentPageEditHref ? [currentPageEditHref] : []),
    ])].filter((href) => !initialVideoEditHrefs.includes(href));
    if (newVideoEditHrefs.length === 0) continue;
    if (newVideoEditHrefs.length !== 1) throw new Error(`generated_video_edit_link_ambiguous:${newVideoEditHrefs.length}`);
    const editUrl = newVideoEditHrefs[0];
    if (page.url() !== editUrl) {
      await page.goto(editUrl, { waitUntil: "domcontentloaded", timeout: 30_000 });
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
    fs.writeFileSync(targetPath, await response.body());
    if (!fs.existsSync(targetPath) || fs.statSync(targetPath).size < 100_000) throw new Error("downloaded_video_too_small");
    return { editUrl, mediaUrl: mediaUrl.href, contentType };
  }
  throw new Error("flow_generation_timeout");
}

function probeVideo(videoPath) {
  const result = spawnSync("ffprobe", [
    "-v", "error", "-print_format", "json", "-show_streams", "-show_format", videoPath,
  ], { shell: false, encoding: "utf8", timeout: 60_000, maxBuffer: 2 * 1024 * 1024 });
  if (result.status !== 0) throw new Error("ffprobe_failed");
  const probe = JSON.parse(result.stdout);
  const video = probe.streams?.find((stream) => stream.codec_type === "video");
  const durationSec = Number(probe.format?.duration ?? video?.duration);
  if (!video || !Number.isInteger(video.width) || !Number.isInteger(video.height)) throw new Error("video_stream_missing");
  if (video.height <= video.width || Math.abs(video.width / video.height - 9 / 16) > 0.03) throw new Error("video_not_portrait_9_16");
  if (!Number.isFinite(durationSec) || durationSec < 1 || durationSec > 20) throw new Error("video_duration_out_of_bounds");
  return { width: video.width, height: video.height, durationSec };
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
if (live && process.env.ALLOW_FLOW_MOTION_GENERATION !== "1") fail("live_generation_marker_missing");
if (live && !ownerApproval) fail("owner_approval_required");
if (!live && ownerApproval) fail("owner_approval_is_live_only");
const contract = validateContracts(packetPath, statePath, jobId, ownerApproval, live);

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
const priorSummary = fs.existsSync(summaryPath) ? loadJson(summaryPath, "prior_summary") : null;
const priorSummaryClassification = classifyPriorFlowMotionGenerationSummary(
  priorSummary,
  GEMINI_FLOW_TARGET.expectedCreditsPerGeneration,
);
if (priorSummaryClassification.action === "block") {
  fail("prior_approval_click_outcome_requires_manual_review", priorSummaryClassification.reason);
}
const priorSubmissionCount = priorSummaryClassification.submissionCount;
const resumeSubmittedResult = priorSummaryClassification.action === "resume_submitted_result" &&
  priorSummary?.jobId === jobId &&
  priorSummary?.referenceSha256 === contract.job.referenceSha256 &&
  priorSummary?.promptSha256 === contract.job.promptSha256 &&
  samePath(priorSummary?.outputVideoPath ?? "", contract.expectedVideoPath) &&
  Array.isArray(priorSummary?.initialVideoEditHrefs) &&
  !fs.existsSync(contract.expectedVideoPath);
if (priorSummaryClassification.action === "resume_submitted_result" && !resumeSubmittedResult) {
  fail("prior_submission_requires_new_owner_approval");
}
const profileAttempts = [];
let page = null;
let pageOpenedByRunner = false;
let selectedProfile = null;
let submissionCount = 0;
let approvalClickAttemptCount = Number(priorSummary?.approvalClickAttemptCount ?? (priorSubmissionCount > 0 ? 1 : 0));
let approvalClickOutcomeUnknown = false;
let composerEvidence = null;
let submitEvidence = null;
let pendingConfirmation = null;
let initialVideoEditHrefs = [];
let summary;
function recordApprovalClickIntentArmed(evidence) {
  if (approvalClickAttemptCount > 0) throw new Error("approval_click_attempt_duplicate");
  approvalClickAttemptCount = 1;
  approvalClickOutcomeUnknown = true;
  fs.writeFileSync(summaryPath, `${JSON.stringify({
    schemaVersion: "money_shorts_flow_motion_generation_summary_v1",
    status: "APPROVAL_CLICK_OUTCOME_UNKNOWN",
    jobId,
    generatedAt: new Date().toISOString(),
    selectedProfile: selectedProfile?.desktopShortcutName ?? null,
    profileAttempts,
    submissionCount: 0,
    expectedCreditsSpent: null,
    approvalClickAttemptCount,
    approvalClickIntent: evidence,
    referenceSha256: contract.job.referenceSha256,
    promptSha256: contract.job.promptSha256,
    outputVideoPath: contract.expectedVideoPath,
    initialVideoEditHrefs,
    composerEvidence,
    ownerQaPassed: false,
    renderReady: false,
  }, null, 2)}\n`, "utf8");
}
function recordApprovalClickDispatched(evidence) {
  if (submissionCount === 1) return;
  submissionCount = 1;
  approvalClickOutcomeUnknown = false;
  submitEvidence = evidence;
  fs.writeFileSync(summaryPath, `${JSON.stringify({
    schemaVersion: "money_shorts_flow_motion_generation_summary_v1",
    status: "SUBMITTED_PENDING_RESULT",
    jobId,
    generatedAt: new Date().toISOString(),
    selectedProfile: selectedProfile?.desktopShortcutName ?? null,
    profileAttempts,
    submissionCount: 1,
    expectedCreditsSpent: GEMINI_FLOW_TARGET.expectedCreditsPerGeneration,
    approvalClickAttemptCount: Math.max(approvalClickAttemptCount, 1),
    referenceSha256: contract.job.referenceSha256,
    promptSha256: contract.job.promptSha256,
    outputVideoPath: contract.expectedVideoPath,
    initialVideoEditHrefs,
    composerEvidence,
    submitEvidence: evidence,
    ownerQaPassed: false,
    renderReady: false,
  }, null, 2)}\n`, "utf8");
}
try {
  const { chromium } = await import("playwright");
  for (const profile of GEMINI_VEO_PROFILE_CHAIN) {
    if (!await isCDPOpen(profile.cdpPort)) {
      profileAttempts.push({ profileId: profile.profileId, state: "unavailable", reason: "cdp_not_open_browser_launch_forbidden" });
      if (profile.profileId === 2) throw new Error("gemini_2_cdp_not_open_browser_launch_forbidden");
      break;
    }
    const browser = await chromium.connectOverCDP(`http://127.0.0.1:${profile.cdpPort}`);
    const context = browser.contexts()[0];
    if (!context) throw new Error(`gemini_${profile.profileId}_browser_context_missing`);
    const existingProjectRootPage = context.pages().find((candidate) =>
      isExactGeminiFlowProjectRootUrl(candidate.url(), GEMINI_FLOW_TARGET.projectId),
    );
    if (resumeSubmittedResult && profile.profileId !== 2) break;
    if (!resumeSubmittedResult && existingProjectRootPage) {
      const existingConfirmation = await findRequiredGenerationConfirmation(existingProjectRootPage, contract.job);
      if (existingConfirmation.confirmation) {
        page = existingProjectRootPage;
        pendingConfirmation = existingConfirmation.confirmation;
      }
    }
    if (!page) {
      // A Flow /edit/... result page also contains an enabled "Make" control, but it
      // belongs to the result editor ("Describe changes"), not the project composer.
      // Always use a dedicated exact-root page for a new job or result recovery.
      page = await context.newPage();
      pageOpenedByRunner = true;
      await page.goto(GEMINI_FLOW_TARGET.projectUrl, { waitUntil: "domcontentloaded", timeout: 30_000 });
      await page.waitForTimeout(2_500);
    }
    const currentUrl = new URL(page.url());
    if (!isExactGeminiFlowProjectRootUrl(currentUrl.href, GEMINI_FLOW_TARGET.projectId)) {
      throw new Error(`gemini_${profile.profileId}_flow_project_mismatch`);
    }
    await closeStaleAgentPanel(page);
    if (!resumeSubmittedResult && !pendingConfirmation) {
      const existingConfirmation = await findRequiredGenerationConfirmation(page, contract.job);
      pendingConfirmation = existingConfirmation.confirmation;
    }
    const quota = resumeSubmittedResult ? null : await inspectExplicitQuota(page);
    if (quota) {
      profileAttempts.push({ profileId: profile.profileId, state: "quota_exhausted", evidence: quota.snippet ?? quota.text });
      if (pageOpenedByRunner) await page.close();
      page = null;
      pageOpenedByRunner = false;
      continue;
    }
    selectedProfile = profile;
    profileAttempts.push({ profileId: profile.profileId, state: resumeSubmittedResult ? "selected_resume_download" : "selected" });
    break;
  }
  if (!page || !selectedProfile) throw new Error("all_allowed_profiles_quota_exhausted_or_unavailable");

  initialVideoEditHrefs = resumeSubmittedResult
    ? priorSummary.initialVideoEditHrefs
    : await videoEditHrefs(page);
  if (sha256(fs.readFileSync(contract.referencePath)) !== contract.job.referenceSha256 || sha256(contract.job.prompt) !== contract.job.promptSha256) {
    throw new Error("hash_changed_immediately_before_submit");
  }
  if (resumeSubmittedResult) {
    composerEvidence = priorSummary.composerEvidence;
    submitEvidence = priorSummary.submitEvidence;
    submissionCount = 1;
  } else if (pendingConfirmation) {
    composerEvidence = {
      referenceSource: "recovered_pending_confirmation",
      promptDomSha256: contract.job.promptSha256,
      attachmentCount: 1,
    };
    submitEvidence = await approveRequiredGenerationConfirmation(
      page,
      pendingConfirmation,
      contract.job,
      {
        onClickArmed: recordApprovalClickIntentArmed,
        onClickDispatched: recordApprovalClickDispatched,
      },
    );
  } else {
    const attachment = await attachReferenceAndPrompt(page, contract.job, priorSummary);
    composerEvidence = attachment.evidence;
    submitEvidence = await submitWithRequiredConfirmation(
      page,
      contract.job,
      attachment.promptBox,
      {
        onClickArmed: recordApprovalClickIntentArmed,
        onClickDispatched: recordApprovalClickDispatched,
      },
    );
  }
  submissionCount = Number(submitEvidence?.submissionCount ?? submissionCount);
  if (!resumeSubmittedResult) {
    fs.writeFileSync(summaryPath, `${JSON.stringify({
      schemaVersion: "money_shorts_flow_motion_generation_summary_v1",
      status: "SUBMITTED_PENDING_RESULT",
      jobId,
      generatedAt: new Date().toISOString(),
      selectedProfile: selectedProfile.desktopShortcutName,
      profileAttempts,
      submissionCount,
      expectedCreditsSpent: GEMINI_FLOW_TARGET.expectedCreditsPerGeneration,
      approvalClickAttemptCount,
      referenceSha256: contract.job.referenceSha256,
      promptSha256: contract.job.promptSha256,
      outputVideoPath: contract.expectedVideoPath,
      initialVideoEditHrefs,
      composerEvidence,
      submitEvidence,
      ownerQaPassed: false,
      renderReady: false,
    }, null, 2)}\n`, "utf8");
  }
  const downloadEvidence = await downloadGeneratedVideo(page, contract.expectedVideoPath, initialVideoEditHrefs, contract.job);
  const probe = probeVideo(contract.expectedVideoPath);
  summary = {
    schemaVersion: "money_shorts_flow_motion_generation_summary_v1",
    status: "OWNER_QA_REQUIRED",
    jobId,
    generatedAt: new Date().toISOString(),
    selectedProfile: selectedProfile.desktopShortcutName,
    profileAttempts,
    submissionCount,
    expectedCreditsSpent: GEMINI_FLOW_TARGET.expectedCreditsPerGeneration,
    approvalClickAttemptCount,
    referenceSha256: contract.job.referenceSha256,
    promptSha256: contract.job.promptSha256,
    outputVideoPath: contract.expectedVideoPath,
    initialVideoEditHrefs,
    outputVideoSha256: sha256(fs.readFileSync(contract.expectedVideoPath)),
    probe,
    composerEvidence,
    submitEvidence,
    downloadEvidence,
    ownerQaPassed: false,
    renderReady: false,
  };
} catch (error) {
  const failure = String(error?.message ?? error).replace(/\s+/g, " ").slice(0, 240);
  const unknownClickOutcome = approvalClickOutcomeUnknown || failure.includes("approval_click_outcome_unknown_no_retry");
  summary = {
    schemaVersion: "money_shorts_flow_motion_generation_summary_v1",
    status: submissionCount === 1
      ? "SUBMITTED_RESULT_RECOVERY_REQUIRED"
      : unknownClickOutcome
        ? "APPROVAL_CLICK_OUTCOME_UNKNOWN"
        : "FAILED_NO_AUTOMATIC_RETRY",
    jobId,
    generatedAt: new Date().toISOString(),
    selectedProfile: selectedProfile?.desktopShortcutName ?? null,
    profileAttempts,
    submissionCount,
    expectedCreditsSpent: submissionCount === 1 ? GEMINI_FLOW_TARGET.expectedCreditsPerGeneration : unknownClickOutcome ? null : 0,
    approvalClickAttemptCount,
    referenceSha256: contract.job.referenceSha256,
    promptSha256: contract.job.promptSha256,
    outputVideoPath: contract.expectedVideoPath,
    initialVideoEditHrefs,
    composerEvidence,
    submitEvidence,
    ownerQaPassed: false,
    renderReady: false,
    failure,
  };
} finally {
  if (page && pageOpenedByRunner) await page.close().catch(() => {});
}

fs.writeFileSync(summaryPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ ...summary, summaryPath }, null, 2));
process.exit(summary.status === "OWNER_QA_REQUIRED" ? 0 : 1);
