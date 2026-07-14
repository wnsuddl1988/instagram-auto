#!/usr/bin/env node

/**
 * Flow upload + prompt preflight for the isolated Minjae articulated-motion test.
 *
 * Modes:
 *   --contract-check       local packet validation only; no browser import/access
 *   --preflight-no-submit  one approved reference attachment and exact prompt fill
 *
 * This runner has no generation-submit path. It never launches Chrome, creates a
 * project, saves settings, changes accounts, presses Enter, or spends credits.
 */

import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { isCDPOpen } from "./_gemini-veo-core.mjs";
import { GEMINI_FLOW_TARGET } from "./_gemini-flow-no-submit-contract.mjs";

const DEFAULT_PACKET_PATH = "C:/tmp/money-shorts-os/gemini-veo/minjae-horizon-flow-motion-pilot-v1/approval-packet.json";
const READONLY_SUMMARY_PATH = "C:/tmp/money-shorts-os/gemini-veo/diagnostics/minjae-flow-live-no-submit-v1/summary.json";
const EXPECTED_SCHEMA = "minjae_flow_motion_approval_packet_v1";
const EXPECTED_ATTEMPT_ID = "minjae_horizon_flow_motion_v1";
const EXPECTED_OUTPUT_ROOT = "C:/tmp/money-shorts-os/gemini-veo/minjae-horizon-flow-motion-pilot-v1";
const EXPECTED_INTENT_PATH = path.join(EXPECTED_OUTPUT_ROOT, "upload-intent.json");
const EXPECTED_SUMMARY_PATH = path.join(EXPECTED_OUTPUT_ROOT, "upload-prompt-no-submit-summary.json");
const EXPECTED_REFERENCE_PATH = "C:/tmp/money-shorts-os/web-wizard-create-v1/character-cast-v1/minjae_horizon/candidate-2.png";
const EXPECTED_REFERENCE_SHA256 = "f6eaa1a87cd0d513154f697853f5c8cd7bbd0e0116a0ee2dee8722210ecbf771";
const EXPECTED_PROMPT_SHA256 = "18b03539c9c9392f86cc4af16b54c3c1c5cf35edc1add16d74f73c0b4afbeb1f";
const READONLY_MAX_AGE_MS = 30 * 60 * 1000;
const LIVE_APPROVAL_ARG = "--owner-approved-upload-no-submit";
const REFERENCE_APPROVAL_ARG = "--allow-one-reference-upload";
const modes = ["--contract-check", "--preflight-no-submit"].filter((flag) => process.argv.includes(flag));
const forbiddenArgs = [
  "--submit",
  "--generate",
  "--save",
  "--new-project",
  "--change-account",
  "--launch-browser",
  "--press-enter",
  "--fallback-profile",
];

function argValue(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] ?? null : null;
}

function fail(message, exitCode = 2) {
  console.error(`ABORT: ${message}`);
  process.exit(exitCode);
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

function loadJson(filePath, label) {
  if (!fs.existsSync(filePath)) fail(`${label}_missing`);
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    fail(`${label}_invalid_json`);
  }
}

function validatePacket(packet, packetPath) {
  const failures = [];
  if (!samePath(packetPath, DEFAULT_PACKET_PATH)) failures.push("packet_path_outside_flow_attempt");
  if (packet?.schemaVersion !== EXPECTED_SCHEMA) failures.push("packet_schema_mismatch");
  if (packet?.attemptId !== EXPECTED_ATTEMPT_ID) failures.push("attempt_id_mismatch");
  if (packet?.status !== "OWNER_APPROVAL_REQUIRED_UPLOAD_NO_SUBMIT") failures.push("packet_status_mismatch");
  if (packet?.priorApprovalReuseAllowed !== false) failures.push("prior_approval_reuse_must_be_false");
  if (packet?.priorGeminiRetryId !== "minjae_horizon_retry_v2") failures.push("prior_retry_provenance_missing");
  if (!samePath(packet?.outputPlan?.root ?? "", EXPECTED_OUTPUT_ROOT)) failures.push("output_root_mismatch");
  if (!samePath(packet?.outputPlan?.packetPath ?? "", DEFAULT_PACKET_PATH)) failures.push("packet_output_path_mismatch");
  if (!samePath(packet?.outputPlan?.uploadIntentPath ?? "", EXPECTED_INTENT_PATH)) failures.push("upload_intent_path_mismatch");
  if (!samePath(packet?.outputPlan?.preflightSummaryPath ?? "", EXPECTED_SUMMARY_PATH)) failures.push("preflight_summary_path_mismatch");
  if (packet?.providerUi?.provider !== "Google Flow") failures.push("provider_mismatch");
  if (packet?.providerUi?.profileDesktopShortcutName !== "Gemini 2") failures.push("profile_name_mismatch");
  if (packet?.providerUi?.profileId !== GEMINI_FLOW_TARGET.profileId) failures.push("profile_id_mismatch");
  if (packet?.providerUi?.cdpPort !== GEMINI_FLOW_TARGET.cdpPort) failures.push("cdp_port_mismatch");
  if (packet?.providerUi?.projectId !== GEMINI_FLOW_TARGET.projectId) failures.push("project_id_mismatch");
  if (packet?.providerUi?.projectUrl !== GEMINI_FLOW_TARGET.projectUrl) failures.push("project_url_mismatch");
  if (packet?.providerUi?.videoModel !== GEMINI_FLOW_TARGET.model) failures.push("model_mismatch");
  if (packet?.providerUi?.aspectRatio !== GEMINI_FLOW_TARGET.aspectRatio) failures.push("aspect_ratio_mismatch");
  if (packet?.providerUi?.outputCount !== GEMINI_FLOW_TARGET.outputCount) failures.push("output_count_mismatch");
  if (packet?.providerUi?.confirmBeforeGeneration !== GEMINI_FLOW_TARGET.creditSpendApprovalPolicy) failures.push("confirmation_policy_mismatch");
  if (packet?.providerUi?.expectedCreditsPerGeneration !== GEMINI_FLOW_TARGET.expectedCreditsPerGeneration) failures.push("credit_cost_mismatch");
  if (packet?.providerUi?.accountFallbackAllowed !== false) failures.push("account_fallback_must_be_false");
  if (packet?.providerUi?.reasoningModelSelectionRequired !== false) failures.push("reasoning_model_must_be_irrelevant");
  if (!samePath(packet?.character?.referenceFile ?? "", EXPECTED_REFERENCE_PATH)) failures.push("reference_path_mismatch");
  if (packet?.character?.referenceSha256 !== EXPECTED_REFERENCE_SHA256) failures.push("reference_hash_mismatch");
  if (packet?.scene?.promptSha256 !== EXPECTED_PROMPT_SHA256) failures.push("prompt_hash_mismatch");
  if (!fs.existsSync(packet?.character?.referenceFile ?? "")) failures.push("reference_file_missing");
  if (fs.existsSync(packet?.character?.referenceFile ?? "") && sha256(fs.readFileSync(packet.character.referenceFile)) !== EXPECTED_REFERENCE_SHA256) failures.push("reference_file_hash_mismatch");
  if (sha256(packet?.scene?.prompt ?? "") !== EXPECTED_PROMPT_SHA256) failures.push("prompt_content_hash_mismatch");
  const boundary = packet?.liveBoundary ?? {};
  for (const key of [
    "approvalGrantedNow",
    "referenceAttachedNow",
    "promptTypedNow",
    "submittedNow",
    "settingsSavedNow",
    "newProjectCreatedNow",
    "accountChangedNow",
    "creditsSpentNow",
  ]) {
    if (boundary[key] !== false) failures.push(`${key}_must_be_false`);
  }
  if (boundary.generationRequiresSeparateOwnerApproval !== true) failures.push("separate_generation_approval_missing");
  if (!String(boundary.requiredOwnerApprovalWording ?? "").includes(EXPECTED_ATTEMPT_ID)) failures.push("upload_approval_identity_missing");
  if (!String(boundary.requiredOwnerApprovalWording ?? "").includes(EXPECTED_REFERENCE_SHA256)) failures.push("upload_approval_reference_hash_missing");
  if (!String(boundary.requiredOwnerApprovalWording ?? "").includes(EXPECTED_PROMPT_SHA256)) failures.push("upload_approval_prompt_hash_missing");
  if (!String(boundary.requiredOwnerApprovalWording ?? "").includes(GEMINI_FLOW_TARGET.projectId)) failures.push("upload_approval_project_id_missing");
  if (!String(boundary.requiredOwnerApprovalWording ?? "").includes("생성 전송·크레딧 사용 금지")) failures.push("upload_approval_no_submit_boundary_missing");
  return failures;
}

function validateFreshReadonlySummary(summary) {
  const failures = [];
  const checkedAt = Date.parse(summary?.checkedAt ?? "");
  const observation = summary?.observation ?? {};
  if (summary?.schemaVersion !== "minjae_flow_live_no_submit_v1") failures.push("readonly_schema_mismatch");
  if (summary?.evaluation?.passed !== true || summary?.evaluation?.readyForOwnerUploadDecision !== true) failures.push("readonly_preflight_not_passed");
  if (!Number.isFinite(checkedAt) || Date.now() - checkedAt > READONLY_MAX_AGE_MS || checkedAt > Date.now() + 60_000) failures.push("readonly_preflight_stale");
  if (observation.profileId !== GEMINI_FLOW_TARGET.profileId) failures.push("readonly_profile_mismatch");
  if (observation.projectId !== GEMINI_FLOW_TARGET.projectId) failures.push("readonly_project_mismatch");
  if (observation.projectEmpty !== true) failures.push("readonly_project_not_empty");
  if (observation.videoModel !== GEMINI_FLOW_TARGET.model) failures.push("readonly_model_mismatch");
  if (!(observation.selectedVideoTabs ?? []).some((value) => normalized(value).endsWith(GEMINI_FLOW_TARGET.aspectRatio))) failures.push("readonly_ratio_mismatch");
  if (!(observation.selectedVideoTabs ?? []).some((value) => normalized(value).endsWith(`${GEMINI_FLOW_TARGET.outputCount}x`))) failures.push("readonly_output_count_mismatch");
  if (observation.confirmBeforeGeneration !== GEMINI_FLOW_TARGET.creditSpendApprovalPolicy) failures.push("readonly_confirmation_policy_mismatch");
  if (!Number.isInteger(observation.creditBalance) || observation.creditBalance < GEMINI_FLOW_TARGET.minimumCreditBalance) failures.push("readonly_credit_balance_unconfirmed");
  if ((observation.blockedNetworkMutations ?? []).length !== 0) failures.push("readonly_network_mutation_detected");
  for (const key of ["browserLaunched", "newProjectCreated", "settingsSaved", "promptTyped", "referenceAttached", "generationSubmitted", "accountChanged"]) {
    if (observation[key] !== false) failures.push(`readonly_${key}_must_be_false`);
  }
  if (observation.submissionCount !== 0) failures.push("readonly_submission_count_mismatch");
  return failures;
}

function isAllowedReadOnlyPostRequest(method, url) {
  if (method !== "POST") return false;
  return /(?:batchLogFrontendEvents|general\.submitBatchLog|general\.reportClientSideError|likeness:checkEligibility|v1:checkAppAvailability|v1:fetchUserRecommendations|google-analytics\.com\/g\/collect|google\.com\/g\/collect)/i.test(url);
}

function isUploadRequest(method, url) {
  if (!["POST", "PUT"].includes(method)) return false;
  return /(?:upload|media|blob|storage|googleusercontent)/i.test(url);
}

function projectIdFromUrl(urlValue) {
  return String(urlValue).match(/\/project\/([a-f0-9-]+)/i)?.[1] ?? null;
}

function urlWithoutQuery(urlValue) {
  try {
    const parsed = new URL(urlValue);
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    return "unparseable_url";
  }
}

async function firstVisible(locator) {
  const count = await locator.count();
  for (let index = 0; index < count; index += 1) {
    const candidate = locator.nth(index);
    if (await candidate.isVisible().catch(() => false)) return candidate;
  }
  return null;
}

function writeIntentLedgerExclusive(packet) {
  const intentPath = packet.outputPlan.uploadIntentPath;
  fs.mkdirSync(packet.outputPlan.root, { recursive: true });
  const intent = {
    schemaVersion: "minjae_flow_upload_intent_v1",
    attemptId: packet.attemptId,
    createdAt: new Date().toISOString(),
    projectId: packet.providerUi.projectId,
    referenceSha256: packet.character.referenceSha256,
    promptSha256: packet.scene.promptSha256,
    permittedReferenceSelections: 1,
    generationSubmitPermitted: false,
    creditsSpendPermitted: false,
  };
  const descriptor = fs.openSync(intentPath, "wx");
  try {
    fs.writeFileSync(descriptor, `${JSON.stringify(intent, null, 2)}\n`, "utf8");
  } finally {
    fs.closeSync(descriptor);
  }
  return intentPath;
}

const forbiddenArg = forbiddenArgs.find((arg) => process.argv.includes(arg));
if (modes.length !== 1) fail("choose_exactly_one_mode_contract_check_or_preflight_no_submit");
if (forbiddenArg) fail(`${forbiddenArg}_is_forbidden`);

const mode = modes[0];
const packetPath = argValue("--packet-path") ?? DEFAULT_PACKET_PATH;
const packet = loadJson(packetPath, "packet");
const packetFailures = validatePacket(packet, packetPath);
if (packetFailures.length > 0) fail(`packet_contract_failed:${packetFailures.join(",")}`);

if (mode === "--contract-check") {
  const liveOnlyArgs = [
    LIVE_APPROVAL_ARG,
    REFERENCE_APPROVAL_ARG,
    "--approved-reference-sha256",
    "--approved-prompt-sha256",
  ];
  const liveOnlyArg = liveOnlyArgs.find((arg) => process.argv.includes(arg));
  if (liveOnlyArg) fail(`${liveOnlyArg}_is_live_only`);
  console.log(JSON.stringify({
    passed: true,
    mode: "contract_check_no_browser",
    packetPath,
    attemptId: packet.attemptId,
    target: packet.providerUi,
    referenceSha256: packet.character.referenceSha256,
    promptSha256: packet.scene.promptSha256,
    browserImported: false,
    browserAccessed: false,
    networkAccessed: false,
    generationSubmitAvailable: false,
    creditsSpent: false,
  }, null, 2));
  process.exit(0);
}

if (!process.argv.includes(LIVE_APPROVAL_ARG)) fail(`${LIVE_APPROVAL_ARG}_required`);
if (!process.argv.includes(REFERENCE_APPROVAL_ARG)) fail(`${REFERENCE_APPROVAL_ARG}_required`);
if (argValue("--approved-reference-sha256") !== EXPECTED_REFERENCE_SHA256) fail("approved_reference_sha256_mismatch");
if (argValue("--approved-prompt-sha256") !== EXPECTED_PROMPT_SHA256) fail("approved_prompt_sha256_mismatch");

const readonlySummary = loadJson(READONLY_SUMMARY_PATH, "readonly_summary");
const readonlyFailures = validateFreshReadonlySummary(readonlySummary);
if (readonlyFailures.length > 0) fail(`readonly_contract_failed:${readonlyFailures.join(",")}`);
if (fs.existsSync(packet.outputPlan.uploadIntentPath)) fail("upload_intent_already_exists_duplicate_upload_blocked");
if (!await isCDPOpen(GEMINI_FLOW_TARGET.cdpPort)) fail("gemini_2_cdp_not_open_browser_launch_forbidden");

let page = null;
let uploadArmed = false;
let uploadRequestCount = 0;
let uploadSelectionCount = 0;
let libraryAssetMatchedByFileName = false;
let composerAttachmentImageCount = 0;
const blockedNetworkMutations = [];
const allowedUploadRequests = [];
let intentPath = null;
let summary = null;

try {
  const { chromium } = await import("playwright");
  const browser = await chromium.connectOverCDP(`http://127.0.0.1:${GEMINI_FLOW_TARGET.cdpPort}`);
  const context = browser.contexts()[0];
  if (!context) throw new Error("gemini_2_browser_context_missing");

  page = await context.newPage();
  await page.route("**/*", async (route) => {
    const request = route.request();
    const method = request.method().toUpperCase();
    const url = request.url();
    const flowMutation = !["GET", "HEAD", "OPTIONS"].includes(method)
      && /(?:labs\.google|googleapis\.com|googleusercontent\.com)/i.test(url);

    if (!flowMutation || isAllowedReadOnlyPostRequest(method, url)) {
      await route.continue();
      return;
    }
    if (uploadArmed && uploadRequestCount === 0 && isUploadRequest(method, url)) {
      uploadRequestCount += 1;
      allowedUploadRequests.push({ method, url: urlWithoutQuery(url) });
      await route.continue();
      return;
    }
    blockedNetworkMutations.push({ method, url: urlWithoutQuery(url) });
    await route.abort("blockedbyclient");
  });

  await page.goto(GEMINI_FLOW_TARGET.projectUrl, { waitUntil: "domcontentloaded", timeout: 30_000 });
  await page.waitForTimeout(2_500);
  const currentUrl = new URL(page.url());
  if (currentUrl.hostname !== "labs.google") throw new Error("flow_host_mismatch");
  if (projectIdFromUrl(currentUrl.href) !== GEMINI_FLOW_TARGET.projectId) throw new Error("flow_project_mismatch");

  const pageTextBefore = await page.locator("body").innerText();
  if (!/미디어 만들기를 시작하거나 미디어를 드롭하세요|start creating media|drop media/i.test(pageTextBefore)) throw new Error("flow_project_not_empty_or_empty_state_unconfirmed");

  const assetPickerButton = await firstVisible(page.locator("button").filter({ hasText: /add_2/i }));
  if (!assetPickerButton) throw new Error("asset_picker_button_missing");
  await assetPickerButton.click();
  const mediaUploadButton = await firstVisible(page.getByText(/^(?:upload\s*)?(?:미디어 업로드|Upload media)$/i, { exact: true }));
  if (!mediaUploadButton) throw new Error("media_upload_button_missing");

  intentPath = writeIntentLedgerExclusive(packet);
  const fileChooserPromise = page.waitForEvent("filechooser", { timeout: 10_000 });
  await mediaUploadButton.click();
  const fileChooser = await fileChooserPromise;
  uploadArmed = true;
  uploadSelectionCount += 1;
  await fileChooser.setFiles(packet.character.referenceFile);
  await page.waitForTimeout(5_000);
  uploadArmed = false;

  const referenceFileName = path.basename(packet.character.referenceFile);
  const assetPickerButtonAfterUpload = await firstVisible(page.locator("button").filter({ hasText: /add_2/i }));
  if (!assetPickerButtonAfterUpload) throw new Error("asset_picker_button_after_upload_missing");
  await assetPickerButtonAfterUpload.click();

  const mediaDialogLocator = page.locator('[role="dialog"]').filter({ hasText: referenceFileName });
  await mediaDialogLocator.waitFor({ state: "visible", timeout: 10_000 }).catch(() => {});
  const mediaDialog = await firstVisible(mediaDialogLocator);
  if (!mediaDialog) throw new Error("uploaded_reference_missing_from_media_picker");
  libraryAssetMatchedByFileName = true;

  const addToPromptButton = await firstVisible(mediaDialog.locator("button").filter({
    hasText: /프롬프트에 추가|Add to prompt/i,
  }));
  if (!addToPromptButton) throw new Error("add_uploaded_reference_to_prompt_button_missing");
  await addToPromptButton.click();
  await page.waitForTimeout(500);

  const promptBox = await firstVisible(page.locator('[contenteditable="true"][data-placeholder*="만들"], [contenteditable="true"][aria-label*="만들"], [contenteditable="true"]'));
  if (!promptBox) throw new Error("prompt_composer_missing");
  composerAttachmentImageCount = await promptBox.evaluate((element) => (
    element.parentElement?.parentElement?.querySelectorAll("img").length ?? 0
  ));
  const referenceAttached = uploadSelectionCount === 1
    && uploadRequestCount <= 1
    && libraryAssetMatchedByFileName
    && composerAttachmentImageCount === 1;
  if (!referenceAttached) throw new Error("reference_attachment_evidence_missing");

  await promptBox.fill(packet.scene.prompt);
  const promptDomText = normalized(await promptBox.innerText());
  const promptDomSha256 = sha256(promptDomText);
  if (promptDomSha256 !== packet.scene.promptSha256) throw new Error("prompt_dom_hash_mismatch");

  const generationButtonVisible = Boolean(await firstVisible(page.locator("button").filter({ hasText: /arrow_forward/i })));
  if (blockedNetworkMutations.length > 0) throw new Error("unexpected_network_mutation_blocked");

  summary = {
    schemaVersion: "minjae_flow_upload_prompt_no_submit_v1",
    attemptId: packet.attemptId,
    mode: "approved_upload_prompt_no_submit",
    checkedAt: new Date().toISOString(),
    packetPath,
    readonlySummaryPath: READONLY_SUMMARY_PATH,
    intentPath,
    target: packet.providerUi,
    evidence: {
      referenceFile: packet.character.referenceFile,
      referenceSha256: sha256(fs.readFileSync(packet.character.referenceFile)),
      promptSha256: packet.scene.promptSha256,
      promptDomSha256,
      uploadSelectionCount,
      uploadRequestCount,
      libraryAssetMatchedByFileName,
      composerAttachmentImageCount,
      allowedUploadRequests,
      blockedNetworkMutations,
      generationButtonVisible,
      referenceAttached: true,
      promptTyped: true,
      browserLaunched: false,
      newProjectCreated: false,
      settingsSaved: false,
      generationSubmitted: false,
      accountChanged: false,
      creditsSpent: false,
      submissionCount: 0,
      pageKeptOpen: true,
    },
    evaluation: {
      passed: true,
      readyForOwnerGenerationDecision: true,
      readyForPaidGeneration: false,
      generationRequiresSeparateOwnerApproval: true,
      failures: [],
    },
  };
} catch (error) {
  summary = {
    schemaVersion: "minjae_flow_upload_prompt_no_submit_v1",
    attemptId: packet.attemptId,
    mode: "approved_upload_prompt_no_submit",
    checkedAt: new Date().toISOString(),
    packetPath,
    readonlySummaryPath: READONLY_SUMMARY_PATH,
    intentPath,
    evidence: {
      referenceSha256: packet.character.referenceSha256,
      promptSha256: packet.scene.promptSha256,
      uploadSelectionCount,
      uploadRequestCount,
      libraryAssetMatchedByFileName,
      composerAttachmentImageCount,
      allowedUploadRequests,
      blockedNetworkMutations,
      browserLaunched: false,
      newProjectCreated: false,
      settingsSaved: false,
      generationSubmitted: false,
      accountChanged: false,
      creditsSpent: false,
      submissionCount: 0,
      pageKeptOpen: Boolean(page && !page.isClosed()),
    },
    evaluation: {
      passed: false,
      readyForOwnerGenerationDecision: false,
      readyForPaidGeneration: false,
      generationRequiresSeparateOwnerApproval: true,
      failures: [String(error?.message ?? error)],
    },
  };
}

fs.mkdirSync(packet.outputPlan.root, { recursive: true });
fs.writeFileSync(packet.outputPlan.preflightSummaryPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ ...summary, summaryPath: packet.outputPlan.preflightSummaryPath }, null, 2));
process.exit(summary.evaluation.passed ? 0 : 1);
