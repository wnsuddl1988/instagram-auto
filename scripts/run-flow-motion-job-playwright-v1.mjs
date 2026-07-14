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

async function attachReferenceAndPrompt(page, job) {
  const assetPicker = await firstVisible(page.locator("button").filter({ hasText: /add_2/i }));
  if (!assetPicker) throw new Error("asset_picker_button_missing");
  await assetPicker.click();
  const uploadButton = await firstVisible(page.getByText(/^(?:upload\s*)?(?:미디어 업로드|Upload media)$/i, { exact: true }));
  if (!uploadButton) throw new Error("media_upload_button_missing");
  const chooserPromise = page.waitForEvent("filechooser", { timeout: 10_000 });
  await uploadButton.click();
  const chooser = await chooserPromise;
  await chooser.setFiles(job.referenceFile);
  await page.waitForTimeout(5_000);

  const pickerAfterUpload = await firstVisible(page.locator("button").filter({ hasText: /add_2/i }));
  if (!pickerAfterUpload) throw new Error("asset_picker_after_upload_missing");
  await pickerAfterUpload.click();
  const referenceFileName = path.basename(job.referenceFile);
  const mediaDialog = await firstVisible(page.locator('[role="dialog"]').filter({ hasText: referenceFileName }));
  if (!mediaDialog) throw new Error("uploaded_reference_missing_from_media_picker");
  const addToPrompt = await firstVisible(mediaDialog.locator("button").filter({ hasText: /프롬프트에 추가|Add to prompt/i }));
  if (!addToPrompt) throw new Error("add_reference_to_prompt_missing");
  await addToPrompt.click();
  await page.waitForTimeout(500);

  const promptBox = await firstVisible(page.locator('[contenteditable="true"][data-placeholder*="만들"], [contenteditable="true"][aria-label*="만들"], [contenteditable="true"]'));
  if (!promptBox) throw new Error("prompt_composer_missing");
  await promptBox.fill(job.prompt);
  const promptDomSha256 = sha256(normalized(await promptBox.innerText()));
  if (promptDomSha256 !== job.promptSha256) throw new Error("prompt_dom_hash_mismatch");
  const attachmentCount = await promptBox.evaluate((element) => element.parentElement?.parentElement?.querySelectorAll("img").length ?? 0);
  if (attachmentCount !== 1) throw new Error(`reference_attachment_count_invalid:${attachmentCount}`);
  return { promptDomSha256, attachmentCount };
}

async function submitWithRequiredConfirmation(page) {
  const advance = await firstVisible(page.locator("button").filter({ hasText: /arrow_forward/i }));
  if (!advance || !(await advance.isEnabled().catch(() => false))) throw new Error("generation_advance_button_unavailable");
  await advance.click();
  const confirmDialog = await firstVisible(page.locator('[role="dialog"]').filter({ hasText: /(?:20\s*(?:크레딧|credits)|Veo 3\.1|생성 확인|Confirm generation)/i }));
  if (!confirmDialog) throw new Error("required_generation_confirmation_dialog_missing");
  const dialogText = normalized(await confirmDialog.innerText());
  if (!/20\s*(?:크레딧|credits)/i.test(dialogText)) throw new Error("generation_credit_cost_unconfirmed");
  const confirmButton = await firstVisible(confirmDialog.locator("button").filter({ hasText: /^(?:생성|Generate|확인|Confirm)$/i }));
  if (!confirmButton || !(await confirmButton.isEnabled().catch(() => false))) throw new Error("generation_confirm_button_unavailable");
  await confirmButton.click();
  return { dialogText: dialogText.slice(0, 240), submissionCount: 1 };
}

async function downloadGeneratedVideo(page, targetPath, initialDownloadCount) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < GENERATION_TIMEOUT_MS) {
    await page.waitForTimeout(5_000);
    const classified = classifyVeoBody(await visibleBodyText(page));
    if (classified?.type === "quota") throw new Error("quota_exhausted_after_submission_no_fallback");
    if (classified?.type === "refusal") throw new Error("generation_refused");
    if (classified?.type === "transient") throw new Error("generation_transient_error_no_retry");
    const downloads = page.locator('button[aria-label*="다운로드"], button[aria-label*="Download"], button[title*="다운로드"], button[title*="Download"], a[download]');
    const count = await downloads.count();
    if (count <= initialDownloadCount) continue;
    let button = null;
    for (let index = count - 1; index >= initialDownloadCount; index -= 1) {
      const candidate = downloads.nth(index);
      if (await candidate.isVisible().catch(() => false)) { button = candidate; break; }
    }
    if (!button) continue;
    const [download] = await Promise.all([
      page.waitForEvent("download", { timeout: 60_000 }),
      button.click(),
    ]);
    await download.saveAs(targetPath);
    if (!fs.existsSync(targetPath) || fs.statSync(targetPath).size < 100_000) throw new Error("downloaded_video_too_small");
    return;
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
const profileAttempts = [];
let page = null;
let selectedProfile = null;
let submissionCount = 0;
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
    page = await context.newPage();
    await page.goto(GEMINI_FLOW_TARGET.projectUrl, { waitUntil: "domcontentloaded", timeout: 30_000 });
    await page.waitForTimeout(2_500);
    const currentUrl = new URL(page.url());
    if (currentUrl.hostname !== "labs.google" || projectIdFromUrl(currentUrl.href) !== GEMINI_FLOW_TARGET.projectId) {
      throw new Error(`gemini_${profile.profileId}_flow_project_mismatch`);
    }
    const quota = await inspectExplicitQuota(page);
    if (quota) {
      profileAttempts.push({ profileId: profile.profileId, state: "quota_exhausted", evidence: quota.snippet ?? quota.text });
      await page.close();
      page = null;
      continue;
    }
    selectedProfile = profile;
    profileAttempts.push({ profileId: profile.profileId, state: "selected" });
    break;
  }
  if (!page || !selectedProfile) throw new Error("all_allowed_profiles_quota_exhausted_or_unavailable");

  const initialDownloadCount = await page.locator('button[aria-label*="다운로드"], button[aria-label*="Download"], button[title*="다운로드"], button[title*="Download"], a[download]').count();
  const composerEvidence = await attachReferenceAndPrompt(page, contract.job);
  if (sha256(fs.readFileSync(contract.referencePath)) !== contract.job.referenceSha256 || sha256(contract.job.prompt) !== contract.job.promptSha256) {
    throw new Error("hash_changed_immediately_before_submit");
  }
  const submitEvidence = await submitWithRequiredConfirmation(page);
  submissionCount = submitEvidence.submissionCount;
  await downloadGeneratedVideo(page, contract.expectedVideoPath, initialDownloadCount);
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
    outputVideoSha256: sha256(fs.readFileSync(contract.expectedVideoPath)),
    probe,
    composerEvidence,
    submitEvidence,
    ownerQaPassed: false,
    renderReady: false,
  };
} catch (error) {
  summary = {
    schemaVersion: "money_shorts_flow_motion_generation_summary_v1",
    status: "FAILED_NO_AUTOMATIC_RETRY",
    jobId,
    generatedAt: new Date().toISOString(),
    selectedProfile: selectedProfile?.desktopShortcutName ?? null,
    profileAttempts,
    submissionCount,
    expectedCreditsSpent: submissionCount === 1 ? GEMINI_FLOW_TARGET.expectedCreditsPerGeneration : 0,
    outputVideoPath: contract.expectedVideoPath,
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
