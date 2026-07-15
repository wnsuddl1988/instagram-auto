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
import { GEMINI_FLOW_TARGET } from "./_gemini-flow-no-submit-contract.mjs";
import {
  isApprovalAcknowledged,
  selectCurrentApprovalCandidate,
} from "./_flow-motion-approval-selection.mjs";

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

function projectIdFromUrl(urlValue) {
  return String(urlValue).match(/\/project\/([a-f0-9-]+)/i)?.[1] ?? null;
}

async function visibleBodyText(page) {
  return page.locator("body").innerText().catch(() => "");
}

async function inspectExplicitQuota(page) {
  const classified = classifyVeoBody(await visibleBodyText(page));
  return classified?.type === "quota" ? classified : null;
}

async function closeStaleAgentPanel(page) {
  const closeButton = await firstVisible(
    page.locator("button").filter({ hasText: /^\s*close\s*(?:닫기|Close)\s*$/i }),
  );
  if (!closeButton) return false;
  await closeButton.click();
  await page.waitForTimeout(250);
  return true;
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
  const sources = await images.evaluateAll((elements) => [...new Set(elements
    .map((element) => element.getAttribute("src") ?? "")
    .filter(Boolean))]);
  if (sources.length === 0) return null;
  if (sources.length !== 1) throw new Error(`reference_media_asset_ambiguous:${sources.length}`);
  let addToPrompt = await waitForFirstVisible(
    page,
    dialog.locator("button").filter({ hasText: /프롬프트에 추가|Add to prompt/i }),
  );
  if (addToPrompt && !(await addToPrompt.isEnabled().catch(() => false))) {
    const mediaTile = await firstVisible(images);
    if (!mediaTile) return null;
    await mediaTile.click();
    addToPrompt = await waitForFirstVisible(
      page,
      dialog.locator("button").filter({ hasText: /프롬프트에 추가|Add to prompt/i }),
    );
  }
  if (!addToPrompt || !(await addToPrompt.isEnabled().catch(() => false))) {
    throw new Error("add_reference_to_prompt_missing");
  }
  await addToPrompt.click();
  await page.waitForTimeout(500);
  return { referenceFileName, mediaAssetCount: sources.length };
}

async function fillPromptAndVerify(page, job, referenceEvidence) {
  const promptBox = await firstVisible(page.locator('[contenteditable="true"][data-placeholder*="만들"], [contenteditable="true"][aria-label*="만들"], [contenteditable="true"]'));
  if (!promptBox) throw new Error("prompt_composer_missing");
  await promptBox.fill(job.prompt);
  const promptDomSha256 = sha256(normalized(await promptBox.innerText()));
  if (promptDomSha256 !== job.promptSha256) throw new Error("prompt_dom_hash_mismatch");
  const attachmentCount = await promptBox.evaluate((element) => element.parentElement?.parentElement?.querySelectorAll("img").length ?? 0);
  if (attachmentCount !== 1) throw new Error(`reference_attachment_count_invalid:${attachmentCount}`);
  return { ...referenceEvidence, promptDomSha256, attachmentCount };
}

async function attachReferenceAndPrompt(page, job, priorSummary) {
  const assetPicker = await firstVisible(page.locator("button").filter({ hasText: /add_2/i }));
  if (!assetPicker) throw new Error("asset_picker_button_missing");
  await assetPicker.click();
  let pickerDialog = await waitForFirstVisible(page, page.locator('[role="dialog"]'));
  if (!pickerDialog) throw new Error("media_picker_dialog_missing");

  const uploadReferenceFile = buildReferenceUploadAlias(job);
  const uploadFileName = path.basename(uploadReferenceFile);

  const recoverPriorUpload = priorSummary?.status === "FAILED_NO_AUTOMATIC_RETRY" &&
    priorSummary?.jobId === job.jobId &&
    priorSummary?.submissionCount === 0 &&
    [
      "uploaded_reference_missing_from_media_picker",
      "add_reference_to_prompt_missing",
      "required_generation_confirmation_dialog_missing",
    ].includes(priorSummary?.failure);
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
  await page.waitForTimeout(5_000);

  const pickerAfterUpload = await firstVisible(page.locator("button").filter({ hasText: /add_2/i }));
  if (!pickerAfterUpload) throw new Error("asset_picker_after_upload_missing");
  await pickerAfterUpload.click();
  pickerDialog = await waitForFirstVisible(page, page.locator('[role="dialog"]').filter({ hasText: uploadFileName }));
  if (!pickerDialog) throw new Error("uploaded_reference_missing_from_media_picker");
  const attached = await selectMediaAndAddToPrompt(page, pickerDialog, uploadFileName);
  if (!attached) throw new Error("uploaded_reference_missing_from_media_picker");
  return fillPromptAndVerify(page, job, { ...attached, referenceSource: "uploaded_hash_alias" });
}

async function findRequiredGenerationConfirmation(page, job) {
  const expectedPromptText = normalized(job.prompt);
  const approvalOptions = page.locator("div").filter({ hasText: /^\s*check\s*(?:승인|Approve)\s*$/i });
  const candidates = await approvalOptions.evaluateAll((elements, expectedPrompt) => elements.map((element, index) => {
    const rect = element.getBoundingClientRect();
    let current = element;
    let promptMatches = false;
    let acknowledged = false;
    let confirmationText = "";
    for (let depth = 0; current && depth < 8; depth += 1, current = current.parentElement) {
      const previousText = String(current.previousElementSibling?.textContent ?? "").replace(/\s+/g, " ").trim();
      if (previousText.includes(expectedPrompt)) {
        promptMatches = true;
        confirmationText = String(current.textContent ?? "").replace(/\s+/g, " ").trim();
        const nextText = String(current.nextElementSibling?.textContent ?? "").replace(/\s+/g, " ").trim();
        acknowledged = /^(?:승인|Approve)$/i.test(nextText);
        break;
      }
    }
    const localText = String(element.parentElement?.parentElement?.textContent ?? "").replace(/\s+/g, " ").trim();
    return {
      index,
      inViewport: rect.top >= 0 && rect.bottom <= window.innerHeight && rect.left >= 0 && rect.right <= window.innerWidth,
      creditPromptMatches: /(?:크레딧\s*20개를 사용하여\s*1개 동영상 생성을 시작할까요\?|start.{0,80}1\s*video.{0,80}20\s*credits)/i.test(localText),
      promptMatches,
      acknowledged,
      confirmationText,
    };
  }), expectedPromptText);
  if (candidates.length === 0) return null;
  const promptMatches = candidates.filter((candidate) => candidate.promptMatches);
  if (promptMatches.length === 0) return null;
  const currentPending = promptMatches.filter((candidate) =>
    candidate.inViewport && candidate.creditPromptMatches && !candidate.acknowledged,
  );
  const currentAcknowledged = promptMatches.filter((candidate) =>
    candidate.inViewport && candidate.creditPromptMatches && candidate.acknowledged,
  );
  if (currentPending.length === 0 && currentAcknowledged.length > 0) {
    throw new Error("confirmation_already_acknowledged_no_resubmit");
  }
  const selected = selectCurrentApprovalCandidate(candidates);
  return {
    approveOption: approvalOptions.nth(selected.index),
    confirmationText: selected.confirmationText,
  };
}

async function waitForRequiredGenerationConfirmation(page, job, timeoutMs = 120_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const confirmation = await findRequiredGenerationConfirmation(page, job);
    if (confirmation) return confirmation;
    await page.waitForTimeout(250);
  }
  return null;
}

async function approveRequiredGenerationConfirmation(page, confirmation) {
  const confirmationText = confirmation.confirmationText;
  if (!/(?:크레딧\s*20개|20\s*credits)/i.test(confirmationText)) {
    throw new Error("generation_credit_cost_unconfirmed");
  }
  if (!/(?:1개 동영상|1\s*video)/i.test(confirmationText)) {
    throw new Error("generation_output_count_unconfirmed");
  }
  if (!confirmation.approveOption) throw new Error("confirmation_approve_option_missing");
  const acknowledgementCountBefore = await approvalAcknowledgementCount(page);
  await confirmation.approveOption.click();
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    const acknowledgementCountAfter = await approvalAcknowledgementCount(page);
    if (isApprovalAcknowledged(acknowledgementCountBefore, acknowledgementCountAfter)) {
      return {
        confirmationText: confirmationText.slice(0, 240),
        acknowledgementCountBefore,
        acknowledgementCountAfter,
        submissionCount: 1,
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

async function submitWithRequiredConfirmation(page, job) {
  const makeButton = await firstVisible(
    page.locator("button").filter({ hasText: /^\s*arrow_forward\s*(?:만들기|Create)\s*$/i }),
  );
  if (!makeButton ||
      !(await makeButton.isEnabled().catch(() => false)) ||
      await makeButton.getAttribute("aria-disabled") === "true") {
    throw new Error("generation_make_button_unavailable");
  }
  await makeButton.click();

  const confirmation = await waitForRequiredGenerationConfirmation(page, job);
  if (!confirmation) throw new Error("required_generation_confirmation_dialog_missing");
  return approveRequiredGenerationConfirmation(page, confirmation);
}

async function videoEditHrefs(page) {
  return page.locator('a[href*="/edit/"]:has(video)').evaluateAll((elements) => [...new Set(elements
    .map((element) => element.href)
    .filter(Boolean))]);
}

async function downloadGeneratedVideo(page, targetPath, initialVideoEditHrefs, job) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < GENERATION_TIMEOUT_MS) {
    await page.waitForTimeout(5_000);
    const classified = classifyVeoBody(await visibleBodyText(page));
    if (classified?.type === "quota") throw new Error("quota_exhausted_after_submission_no_fallback");
    if (classified?.type === "refusal") throw new Error("generation_refused");
    if (classified?.type === "transient") throw new Error("generation_transient_error_no_retry");
    const currentVideoEditHrefs = await videoEditHrefs(page);
    const newVideoEditHrefs = currentVideoEditHrefs.filter((href) => !initialVideoEditHrefs.includes(href));
    if (newVideoEditHrefs.length === 0) continue;
    if (newVideoEditHrefs.length !== 1) throw new Error(`generated_video_edit_link_ambiguous:${newVideoEditHrefs.length}`);
    const editUrl = newVideoEditHrefs[0];
    await page.goto(editUrl, { waitUntil: "domcontentloaded", timeout: 30_000 });
    await page.waitForTimeout(2_000);
    const editBodyText = normalized(await visibleBodyText(page));
    if (!editBodyText.includes(normalized(job.prompt))) throw new Error("generated_video_prompt_mismatch");
    if (!/(?:crop_portrait\s*)?9:16\s*9:16/i.test(editBodyText)) throw new Error("generated_video_aspect_ratio_evidence_missing");
    const sources = await page.locator("video").evaluateAll((elements) => [...new Set(elements
      .map((element) => element.currentSrc || element.getAttribute("src") || "")
      .filter(Boolean))]);
    if (sources.length !== 1) throw new Error(`generated_video_source_ambiguous:${sources.length}`);
    const mediaUrl = new URL(sources[0], page.url());
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
const priorSubmissionCount = Number(priorSummary?.submissionCount ?? 0);
const resumeSubmittedResult = priorSubmissionCount === 1 &&
  ["SUBMITTED_PENDING_RESULT", "SUBMITTED_RESULT_RECOVERY_REQUIRED"].includes(priorSummary?.status) &&
  priorSummary?.jobId === jobId &&
  priorSummary?.referenceSha256 === contract.job.referenceSha256 &&
  priorSummary?.promptSha256 === contract.job.promptSha256 &&
  samePath(priorSummary?.outputVideoPath ?? "", contract.expectedVideoPath) &&
  Array.isArray(priorSummary?.initialVideoEditHrefs) &&
  !fs.existsSync(contract.expectedVideoPath);
if (priorSubmissionCount > 0 && !resumeSubmittedResult) {
  fail("prior_submission_requires_new_owner_approval");
}
const profileAttempts = [];
let page = null;
let selectedProfile = null;
let submissionCount = 0;
let composerEvidence = null;
let submitEvidence = null;
let pendingConfirmation = null;
let initialVideoEditHrefs = [];
let summary;
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
    const existingProjectPage = context.pages().find((candidate) =>
      projectIdFromUrl(candidate.url()) === GEMINI_FLOW_TARGET.projectId,
    );
    if (resumeSubmittedResult && profile.profileId !== 2) break;
    if (resumeSubmittedResult && existingProjectPage) {
      page = existingProjectPage;
    } else if (existingProjectPage) {
      const existingConfirmation = await findRequiredGenerationConfirmation(existingProjectPage, contract.job);
      if (existingConfirmation) {
        page = existingProjectPage;
        pendingConfirmation = existingConfirmation;
      }
    }
    if (!page) {
      page = await context.newPage();
      await page.goto(GEMINI_FLOW_TARGET.projectUrl, { waitUntil: "domcontentloaded", timeout: 30_000 });
      await page.waitForTimeout(2_500);
    }
    const currentUrl = new URL(page.url());
    if (currentUrl.hostname !== "labs.google" || projectIdFromUrl(currentUrl.href) !== GEMINI_FLOW_TARGET.projectId) {
      throw new Error(`gemini_${profile.profileId}_flow_project_mismatch`);
    }
    await closeStaleAgentPanel(page);
    const quota = resumeSubmittedResult ? null : await inspectExplicitQuota(page);
    if (quota) {
      profileAttempts.push({ profileId: profile.profileId, state: "quota_exhausted", evidence: quota.snippet ?? quota.text });
      await page.close();
      page = null;
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
    submitEvidence = await approveRequiredGenerationConfirmation(page, pendingConfirmation);
  } else {
    composerEvidence = await attachReferenceAndPrompt(page, contract.job, priorSummary);
    submitEvidence = await submitWithRequiredConfirmation(page, contract.job);
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
  summary = {
    schemaVersion: "money_shorts_flow_motion_generation_summary_v1",
    status: submissionCount === 1 ? "SUBMITTED_RESULT_RECOVERY_REQUIRED" : "FAILED_NO_AUTOMATIC_RETRY",
    jobId,
    generatedAt: new Date().toISOString(),
    selectedProfile: selectedProfile?.desktopShortcutName ?? null,
    profileAttempts,
    submissionCount,
    expectedCreditsSpent: submissionCount === 1 ? GEMINI_FLOW_TARGET.expectedCreditsPerGeneration : 0,
    referenceSha256: contract.job.referenceSha256,
    promptSha256: contract.job.promptSha256,
    outputVideoPath: contract.expectedVideoPath,
    initialVideoEditHrefs,
    composerEvidence,
    submitEvidence,
    ownerQaPassed: false,
    renderReady: false,
    failure: String(error?.message ?? error).replace(/\s+/g, " ").slice(0, 240),
  };
} finally {
  if (page) await page.close().catch(() => {});
}

fs.writeFileSync(summaryPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ ...summary, summaryPath }, null, 2));
process.exit(summary.status === "OWNER_QA_REQUIRED" ? 0 : 1);
