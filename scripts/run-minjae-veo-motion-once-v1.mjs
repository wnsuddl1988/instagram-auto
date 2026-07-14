#!/usr/bin/env node

/**
 * Executes the Owner-approved Minjae Gemini/Veo motion check at most once.
 *
 * Modes:
 *   --contract-check        local hash/policy validation only
 *   --preflight-no-submit   attach + exact prompt DOM check, then close tab
 *   --execute-one           exactly one send-button click across Gemini 2→3→4
 *
 * The execute mode requires a fresh preflight artifact plus explicit CLI gates.
 * A persistent exclusive submission-intent ledger is written before the click;
 * any click error or process interruption consumes the one-submit budget.
 */

import { spawn } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import { classifyVeoBody, isCDPOpen } from "./_gemini-veo-core.mjs";
import {
  GEMINI_VEO_PROFILE_CHAIN,
  GEMINI_VEO_PROFILE_POLICY,
  assertGeminiVeoSubmissionBudget,
  canAdvanceToNextGeminiProfile,
} from "./_gemini-veo-profile-chain.mjs";

const PACKET_PATH = "C:/tmp/money-shorts-os/gemini-veo/minjae-horizon-motion-pilot-v1/approval-packet.json";
const CHROME_EXE = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const modes = ["--contract-check", "--preflight-no-submit", "--execute-one"].filter((flag) => process.argv.includes(flag));
if (modes.length !== 1) {
  console.error("ABORT: choose exactly one mode: --contract-check | --preflight-no-submit | --execute-one");
  process.exit(2);
}
const mode = modes[0];

function argValue(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
}

const approvedPromptSha256 = argValue("--approved-prompt-sha256");
const approvedReferenceSha256 = argValue("--approved-reference-sha256");
if (!/^[a-f0-9]{64}$/.test(approvedPromptSha256 ?? "") || !/^[a-f0-9]{64}$/.test(approvedReferenceSha256 ?? "")) {
  console.error("ABORT: both approved SHA-256 values are required");
  process.exit(2);
}
if (mode === "--execute-one" && (!process.argv.includes("--owner-approved-once") || !process.argv.includes("--allow-one-submit"))) {
  console.error("ABORT: execute mode requires --owner-approved-once and --allow-one-submit");
  process.exit(2);
}
if (mode !== "--execute-one" && (process.argv.includes("--owner-approved-once") || process.argv.includes("--allow-one-submit"))) {
  console.error("ABORT: live approval flags are accepted only in --execute-one mode");
  process.exit(2);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function normalized(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const packet = JSON.parse(fs.readFileSync(PACKET_PATH, "utf8"));
const prompt = normalized(packet.scene?.prompt);
const referenceFile = packet.character?.referenceFile;
const promptSha256 = sha256(prompt);
const referenceSha256 = fs.existsSync(referenceFile) ? sha256(fs.readFileSync(referenceFile)) : null;
const outputRoot = packet.outputPlan?.root;
const outputVideo = packet.outputPlan?.expectedVideoPath;
const partialVideo = `${outputVideo}.part`;
const preflightPath = path.join(outputRoot, "live-preflight-summary.json");
const intentPath = path.join(outputRoot, "submission-intent.json");
const resultPath = path.join(outputRoot, "execution-result.json");
const DOWNLOAD_SELECTOR = [
  'button[aria-label*="다운로드"]',
  'button[aria-label*="Download"]',
  'button[title*="다운로드"]',
  'button[title*="Download"]',
  'a[download]',
].join(", ");
const RESPONSE_SELECTORS = [
  "main model-response",
  'main [data-test-id^="model-response"]',
  'main [data-testid^="model-response"]',
  'main [data-message-author-role="model"]',
  'main [data-message-author-role="assistant"]',
];
const PREEXISTING_VIDEO_ROOTS = [path.resolve("output/v2")];

function sameSizeMp4Files(root, expectedSize) {
  const matches = [];
  const pending = [root];
  while (pending.length > 0) {
    const current = pending.pop();
    let entries;
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      const candidate = path.join(current, entry.name);
      if (entry.isDirectory()) {
        pending.push(candidate);
      } else if (entry.isFile() && /\.mp4$/i.test(entry.name)) {
        try {
          if (fs.statSync(candidate).size === expectedSize) matches.push(candidate);
        } catch {
          // Unreadable unrelated artifacts are ignored; nothing is mutated.
        }
      }
    }
  }
  return matches;
}

function findPreexistingVideoDuplicate(filePath) {
  const expectedSize = fs.statSync(filePath).size;
  const downloadedSha256 = sha256(fs.readFileSync(filePath));
  for (const root of PREEXISTING_VIDEO_ROOTS) {
    for (const candidate of sameSizeMp4Files(root, expectedSize)) {
      if (path.resolve(candidate) === path.resolve(filePath)) continue;
      if (sha256(fs.readFileSync(candidate)) === downloadedSha256) {
        return { downloadedSha256, duplicatePath: path.resolve(candidate) };
      }
    }
  }
  return { downloadedSha256, duplicatePath: null };
}

const contractErrors = [];
if (packet.schemaVersion !== "minjae_veo_motion_approval_packet_v1") contractErrors.push("packet_schema_mismatch");
if (packet.status !== "OWNER_APPROVAL_REQUIRED_NO_SUBMIT") contractErrors.push("packet_status_mismatch");
if (packet.character?.id !== "minjae_horizon" || packet.character?.selectedCandidateNumber !== 2) contractErrors.push("character_selection_mismatch");
if (promptSha256 !== packet.scene?.promptSha256 || promptSha256 !== approvedPromptSha256) contractErrors.push("prompt_hash_mismatch");
if (referenceSha256 !== packet.character?.referenceSha256 || referenceSha256 !== approvedReferenceSha256) contractErrors.push("reference_hash_mismatch");
if (packet.profilePolicy?.advanceOnlyOn !== "quota_exhausted") contractErrors.push("fallback_policy_mismatch");
if (packet.profilePolicy?.maxSubmissionCountAcrossChain !== 1 || GEMINI_VEO_PROFILE_POLICY.maxSubmissionCountAcrossChain !== 1) contractErrors.push("submission_budget_mismatch");
if (JSON.stringify(packet.profilePolicy?.priority) !== JSON.stringify(GEMINI_VEO_PROFILE_CHAIN.map((profile) => profile.desktopShortcutName))) contractErrors.push("profile_priority_mismatch");
if (!/^C:[\\/]+tmp[\\/]+money-shorts-os[\\/]/i.test(`${outputRoot}/`)) contractErrors.push("unsafe_output_root");
if (contractErrors.length > 0) {
  console.error(JSON.stringify({ passed: false, contractErrors }, null, 2));
  process.exit(2);
}

if (mode === "--contract-check") {
  const existingOutputProvenance = fs.existsSync(outputVideo) ? findPreexistingVideoDuplicate(outputVideo) : null;
  console.log(JSON.stringify({
    passed: true,
    mode: "contract_check_no_browser",
    characterId: packet.character.id,
    promptSha256,
    referenceSha256,
    priority: packet.profilePolicy.priority,
    submissionBudget: 1,
    existingOutputProvenance,
    browserLaunched: false,
    submitted: false,
  }, null, 2));
  process.exit(0);
}

fs.mkdirSync(outputRoot, { recursive: true });
if (fs.existsSync(outputVideo) || fs.existsSync(partialVideo)) {
  console.error("ABORT: output or partial video already exists; overwrite is forbidden");
  process.exit(2);
}
if (fs.existsSync(intentPath)) {
  console.error(`ABORT: submission intent already exists; re-submit is forbidden: ${intentPath}`);
  process.exit(2);
}

if (mode === "--execute-one") {
  if (!fs.existsSync(preflightPath)) {
    console.error("ABORT: fresh no-submit preflight is required before execute mode");
    process.exit(2);
  }
  const prior = JSON.parse(fs.readFileSync(preflightPath, "utf8"));
  const ageMs = Date.now() - Date.parse(prior.checkedAt);
  if (!prior.readyBeforeSend || !prior.freshConversationConfirmed || prior.promptSha256 !== promptSha256 || prior.referenceSha256 !== referenceSha256 || ageMs < 0 || ageMs > 30 * 60_000) {
    console.error("ABORT: preflight is stale or does not match the approved packet hashes");
    process.exit(2);
  }
}

function log(profile, message) {
  const label = profile ? `Gemini ${profile.profileId}` : "chain";
  console.log(`[${new Date().toISOString().slice(11, 19)}][${label}] ${message}`);
}

async function firstVisible(locator) {
  const count = await locator.count();
  for (let index = 0; index < count; index += 1) {
    const candidate = locator.nth(index);
    if (await candidate.isVisible().catch(() => false)) return candidate;
  }
  return null;
}

async function visibleLocators(locator) {
  const rows = [];
  const count = await locator.count();
  for (let index = 0; index < count; index += 1) {
    const candidate = locator.nth(index);
    if (await candidate.isVisible().catch(() => false)) rows.push(candidate);
  }
  return rows;
}

async function captureConversationProvenance(page) {
  const responseCounts = {};
  for (const selector of RESPONSE_SELECTORS) {
    responseCounts[selector] = await page.locator(selector).count();
  }
  return {
    url: page.url(),
    responseCounts,
    visibleDownloadCount: (await visibleLocators(page.locator("main").locator(DOWNLOAD_SELECTOR))).length,
    visibleVideoCount: (await visibleLocators(page.locator("main video"))).length,
  };
}

async function ensureFreshConversation(page) {
  const labelled = await firstVisible(page.locator([
    'button[aria-label*="새 채팅"]',
    'a[aria-label*="새 채팅"]',
    'button[aria-label*="새 대화"]',
    'a[aria-label*="새 대화"]',
    'button[aria-label*="New chat"]',
    'a[aria-label*="New chat"]',
  ].join(", ")));
  const exactText = labelled ? null : await firstVisible(page.getByText(/^(새 채팅|새 대화|New chat)$/i, { exact: true }));
  const newChat = labelled ?? exactText;
  if (newChat) {
    await newChat.click();
    await page.waitForTimeout(1_500);
  }
  const baseline = await captureConversationProvenance(page);
  const responseTotal = Object.values(baseline.responseCounts).reduce((sum, count) => sum + count, 0);
  if (responseTotal !== 0 || baseline.visibleDownloadCount !== 0 || baseline.visibleVideoCount !== 0) {
    throw new ProfileStateError("ambiguous_failure", "fresh_chat_contains_prior_response_or_media");
  }
  return baseline;
}

async function findNewResponseScope(page, baseline) {
  for (const selector of RESPONSE_SELECTORS) {
    const beforeCount = baseline.responseCounts[selector] ?? 0;
    const responses = page.locator(selector);
    const afterCount = await responses.count();
    if (afterCount <= beforeCount) continue;
    for (let index = afterCount - 1; index >= beforeCount; index -= 1) {
      const response = responses.nth(index);
      if (await response.isVisible().catch(() => false)) {
        return { response, selector, beforeCount, afterCount, responseIndex: index };
      }
    }
  }
  return null;
}

async function readResponseMediaEvidence(response) {
  const sources = await response.locator("video, video source").evaluateAll((elements) => elements.map((element) => (
    element.currentSrc || element.src || element.getAttribute("src") || ""
  )).filter(Boolean));
  const normalizedSources = sources.map((value) => String(value)).sort();
  return {
    videoElementCount: await response.locator("video").count(),
    mediaSourceCount: normalizedSources.length,
    mediaSourceSha256: normalizedSources.length > 0 ? sha256(normalizedSources.join("\n")) : null,
  };
}

async function readCurrentStatusText(page) {
  const regions = page.locator('main, [role="dialog"], [role="alert"], [role="status"], [aria-live], [role="menu"]');
  const text = [];
  for (const region of await visibleLocators(regions)) {
    const value = await region.innerText().catch(() => "");
    if (value) text.push(value);
  }
  return text.join("\n");
}

class ProfileStateError extends Error {
  constructor(state, reason) {
    super(reason);
    this.state = state;
  }
}

function throwForProviderState(classification, context) {
  if (!classification) return;
  if (classification.type === "quota") throw new ProfileStateError("quota_exhausted", `${context}:explicit_quota`);
  if (classification.type === "transient") throw new ProfileStateError("transient_error", `${context}:transient_error`);
  if (classification.type === "refusal") throw new ProfileStateError("refusal", `${context}:refusal`);
}

async function ensureChrome(profile) {
  if (!fs.existsSync(CHROME_EXE)) throw new ProfileStateError("unavailable", "chrome_executable_missing");
  if (!fs.existsSync(profile.userDataDir)) throw new ProfileStateError("unavailable", "profile_directory_missing");
  if (await isCDPOpen(profile.cdpPort)) return;
  const child = spawn(CHROME_EXE, [
    `--remote-debugging-port=${profile.cdpPort}`,
    `--user-data-dir=${profile.userDataDir}`,
    "--no-first-run",
    "--no-default-browser-check",
    "https://gemini.google.com/app",
  ], { detached: true, stdio: "ignore" });
  child.unref();
  for (let attempt = 0; attempt < 40; attempt += 1) {
    await wait(500);
    if (await isCDPOpen(profile.cdpPort)) return;
  }
  throw new ProfileStateError("unavailable", "cdp_unavailable_after_launch");
}

async function activateVideoTool(page) {
  const toolsButton = await firstVisible(page.locator([
    'button[aria-label="업로드 및 도구"]',
    'button[aria-label="Upload and tools"]',
    'button[aria-label="Upload files and more"]',
  ].join(", ")));
  if (!toolsButton) throw new ProfileStateError("ambiguous_failure", "tools_button_missing");
  await toolsButton.click();
  await page.waitForTimeout(1_200);
  throwForProviderState(classifyVeoBody(await readCurrentStatusText(page)), "tool_menu");

  const videoEntry = await firstVisible(page.getByText(/^(동영상|Video)$/i, { exact: true }));
  if (!videoEntry) throw new ProfileStateError("ambiguous_failure", "video_entry_missing");
  await videoEntry.click();
  await page.waitForTimeout(2_000);
  throwForProviderState(classifyVeoBody(await readCurrentStatusText(page)), "video_entry");

  const introButton = await firstVisible(page.getByRole("button", { name: /^(사용해 보기|Try it|Got it)$/i }));
  if (introButton) {
    await introButton.click();
    await page.waitForTimeout(800);
  }
}

async function ensureVerticalMode(page) {
  const aspect = await firstVisible(page.locator([
    'button[aria-label*="세로 모드"]',
    'button[aria-label*="가로 모드"]',
    'button[aria-label*="9:16"]',
    'button[aria-label*="16:9"]',
    'button[aria-label*="aspect"]',
  ].join(", ")));
  if (!aspect) throw new ProfileStateError("ambiguous_failure", "aspect_button_missing");
  const aria = await aspect.getAttribute("aria-label").catch(() => "");
  if (/세로|9:16|portrait/i.test(aria) && !/가로|16:9|landscape/i.test(aria)) return;
  await aspect.click();
  await page.waitForTimeout(900);
  const verticalChoice = await firstVisible(page.getByText(/세로 모드\s*\(9:16\)|Portrait\s*\(9:16\)|^9:16$/i, { exact: false }));
  if (!verticalChoice) throw new ProfileStateError("ambiguous_failure", "vertical_choice_missing");
  await verticalChoice.click();
  await page.waitForTimeout(900);
  const confirmed = await firstVisible(page.locator('button[aria-label*="세로 모드"], button[aria-label*="9:16"], button[aria-label*="Portrait"]'));
  if (!confirmed) throw new ProfileStateError("ambiguous_failure", "vertical_mode_unconfirmed");
}

async function attachReference(page) {
  const toolsButton = await firstVisible(page.locator([
    'button[aria-label="업로드 및 도구"]',
    'button[aria-label="Upload and tools"]',
    'button[aria-label="Upload files and more"]',
  ].join(", ")));
  if (!toolsButton) throw new ProfileStateError("ambiguous_failure", "tools_button_missing_before_attach");
  const thumbnailSelector = 'img[src^="blob:"], img[src^="data:"]';
  const removeSelector = 'button[aria-label*="삭제"], button[aria-label*="Remove"]';
  const beforeThumbnails = (await visibleLocators(page.locator(thumbnailSelector))).length;
  const beforeRemove = (await visibleLocators(page.locator(removeSelector))).length;
  await toolsButton.click();
  await page.waitForTimeout(900);
  const fileButton = await firstVisible(page.getByRole("button", { name: /^(파일|File)$/i }));
  const fileText = fileButton ? null : await firstVisible(page.getByText(/^(파일|File)$/i, { exact: true }));
  const fileEntry = fileButton ?? fileText;
  if (!fileEntry) {
    const diagnostic = await page.evaluate(() => {
      const visible = (element) => {
        const rect = element.getBoundingClientRect();
        const style = getComputedStyle(element);
        return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none";
      };
      return {
        fileInputs: Array.from(document.querySelectorAll('input[type="file"]')).map((element) => ({
          accept: element.getAttribute("accept"),
          multiple: element.hasAttribute("multiple"),
          disabled: element.disabled,
          ariaLabel: element.getAttribute("aria-label"),
          visible: visible(element),
        })),
        visibleButtons: Array.from(document.querySelectorAll("button")).filter(visible).map((element) => ({
          ariaLabel: element.getAttribute("aria-label"),
          title: element.getAttribute("title"),
          text: (element.textContent || "").replace(/\s+/g, " ").trim().slice(0, 100),
        })).filter((row) => row.ariaLabel || row.title || row.text).slice(-40),
      };
    });
    fs.writeFileSync(path.join(outputRoot, "attachment-ui-diagnostic.json"), JSON.stringify(diagnostic, null, 2) + "\n", "utf8");
    const visibleMenuText = normalized(await readCurrentStatusText(page)).slice(-360);
    throw new ProfileStateError("ambiguous_failure", `file_entry_missing:inputs=${diagnostic.fileInputs.length}:${visibleMenuText}`);
  }
  const [chooser] = await Promise.all([
    page.waitForEvent("filechooser", { timeout: 8_000 }).catch(() => null),
    fileEntry.click(),
  ]);
  if (!chooser) throw new ProfileStateError("ambiguous_failure", "filechooser_missing");
  if (sha256(fs.readFileSync(referenceFile)) !== approvedReferenceSha256) throw new Error("reference_hash_changed_before_attach");
  await chooser.setFiles(referenceFile);
  await page.waitForTimeout(2_500);
  const afterThumbnails = (await visibleLocators(page.locator(thumbnailSelector))).length;
  const afterRemove = (await visibleLocators(page.locator(removeSelector))).length;
  if (afterThumbnails <= beforeThumbnails && afterRemove <= beforeRemove) {
    throw new ProfileStateError("ambiguous_failure", "reference_attachment_unconfirmed");
  }
  return { beforeThumbnails, afterThumbnails, beforeRemove, afterRemove };
}

async function typeExactPrompt(page) {
  const input = await firstVisible(page.locator('rich-textarea .ql-editor[contenteditable="true"], rich-textarea [contenteditable="true"]'));
  if (!input) throw new ProfileStateError("ambiguous_failure", "composer_input_missing");
  await input.fill(prompt);
  await page.waitForTimeout(700);
  const typed = normalized(await input.innerText().catch(() => ""));
  if (typed !== prompt || sha256(typed) !== approvedPromptSha256) throw new Error("prompt_dom_hash_mismatch");
  const required = [
    "Minjae",
    "luminous, lived-in Korean reading corner",
    "camera motion alone is not enough",
    "true restrained articulated character motion",
    "natural wrist and elbow path",
    "No readable text",
  ];
  if (required.some((value) => !typed.includes(value))) throw new Error("prompt_required_motion_contract_missing");
  return input;
}

async function uniqueSendButton(page) {
  const candidates = page.getByRole("button", { name: /^(메시지 보내기|Send message)$/i });
  const visible = await visibleLocators(candidates);
  if (visible.length !== 1) throw new ProfileStateError("ambiguous_failure", `send_button_visible_count_${visible.length}`);
  if (!(await visible[0].isEnabled().catch(() => false))) throw new ProfileStateError("ambiguous_failure", "send_button_disabled");
  await visible[0].click({ trial: true });
  return visible[0];
}

async function prepareProfile(profile) {
  await ensureChrome(profile);
  const browser = await chromium.connectOverCDP(`http://localhost:${profile.cdpPort}`);
  const context = browser.contexts()[0];
  if (!context) throw new ProfileStateError("unavailable", "browser_context_missing");
  const page = await context.newPage();
  try {
    await page.goto("https://gemini.google.com/app", { waitUntil: "domcontentloaded", timeout: 30_000 });
    await page.waitForTimeout(2_500);
    const url = new URL(page.url());
    const signIn = await firstVisible(page.getByRole("button", { name: /^(로그인|Sign in)$/i }));
    if (/accounts\.google\.com|signin/i.test(url.href) || signIn) throw new ProfileStateError("login_required", "login_required");
    await ensureFreshConversation(page);
    await activateVideoTool(page);
    await ensureVerticalMode(page);
    const attachment = await attachReference(page);
    await typeExactPrompt(page);
    throwForProviderState(classifyVeoBody(await readCurrentStatusText(page)), "ready_before_send");
    const sendButton = await uniqueSendButton(page);
    const conversationBaseline = await captureConversationProvenance(page);
    const responseTotal = Object.values(conversationBaseline.responseCounts).reduce((sum, count) => sum + count, 0);
    if (responseTotal !== 0 || conversationBaseline.visibleDownloadCount !== 0 || conversationBaseline.visibleVideoCount !== 0) {
      throw new ProfileStateError("ambiguous_failure", "prior_media_appeared_before_send");
    }
    return { page, sendButton, attachment, conversationBaseline };
  } catch (error) {
    await page.close().catch(() => {});
    throw error;
  }
}

const profileAudit = [];
let prepared = null;
let selectedProfile = null;
for (const profile of GEMINI_VEO_PROFILE_CHAIN) {
  log(profile, "preparing exact approved packet");
  try {
    prepared = await prepareProfile(profile);
    selectedProfile = profile;
    profileAudit.push({ profileId: profile.profileId, state: "ready" });
    break;
  } catch (error) {
    const state = error instanceof ProfileStateError ? error.state : "ambiguous_failure";
    profileAudit.push({ profileId: profile.profileId, state, reason: String(error?.message ?? error).slice(0, 160) });
    log(profile, `state=${state}`);
    if (!canAdvanceToNextGeminiProfile(state)) break;
  }
}

if (!prepared || !selectedProfile) {
  console.error(JSON.stringify({ passed: false, submitted: false, profileAudit }, null, 2));
  process.exit(1);
}

if (mode === "--preflight-no-submit") {
  const summary = {
    schemaVersion: "minjae_veo_live_preflight_v1",
    checkedAt: new Date().toISOString(),
    readyBeforeSend: true,
    selectedProfileId: selectedProfile.profileId,
    promptSha256,
    referenceSha256,
    profileAudit,
    submissionCount: 0,
    promptTyped: true,
    referenceAttached: true,
    freshConversationConfirmed: true,
    responseBaseline: prepared.conversationBaseline,
    submitted: false,
  };
  fs.writeFileSync(preflightPath, JSON.stringify(summary, null, 2) + "\n", "utf8");
  await prepared.page.close().catch(() => {});
  console.log(JSON.stringify({ ...summary, preflightPath }, null, 2));
  process.exit(0);
}

assertGeminiVeoSubmissionBudget([]);
if (sha256(normalized(packet.scene.prompt)) !== approvedPromptSha256 || sha256(fs.readFileSync(referenceFile)) !== approvedReferenceSha256) {
  await prepared.page.close().catch(() => {});
  console.error("ABORT: approved hashes changed immediately before submission intent");
  process.exit(2);
}

const attemptId = randomUUID();
const intent = {
  schemaVersion: "minjae_veo_submission_intent_v1",
  attemptId,
  reservedAt: new Date().toISOString(),
  profileId: selectedProfile.profileId,
  promptSha256,
  referenceSha256,
  submissionCountReserved: 1,
  ownerApprovalWording: packet.liveBoundary.requiredOwnerApprovalWording,
  outcomeRule: "any click error or process interruption consumes the one-submit budget; no automatic resubmit",
};
fs.writeFileSync(intentPath, JSON.stringify(intent, null, 2) + "\n", { encoding: "utf8", flag: "wx" });
assertGeminiVeoSubmissionBudget([{ type: "veo_submit", profileId: selectedProfile.profileId }]);

try {
  await prepared.sendButton.click();
} catch (error) {
  fs.writeFileSync(resultPath, JSON.stringify({
    schemaVersion: "minjae_veo_execution_result_v1",
    attemptId,
    status: "AMBIGUOUS_CLICK_OUTCOME_NO_RETRY",
    profileId: selectedProfile.profileId,
    submissionCount: 1,
    error: String(error?.message ?? error).slice(0, 240),
    finishedAt: new Date().toISOString(),
  }, null, 2) + "\n", { encoding: "utf8", flag: "wx" });
  console.error("ABORT: send click outcome is ambiguous; automatic retry is forbidden");
  process.exit(1);
}

log(selectedProfile, "send button clicked once; waiting for generated video");
let status = "TIMEOUT_PENDING_RECOVERY";
let downloaded = false;
let failureReason = null;
let responseProvenance = null;
let suggestedFilename = null;
let rejectedPartialVideo = null;
let duplicateExistingArtifact = null;
const generationStartedAt = Date.now();
while (Date.now() - generationStartedAt < 8 * 60_000) {
  await prepared.page.waitForTimeout(5_000);
  const elapsedSec = Math.round((Date.now() - generationStartedAt) / 1000);
  const providerState = classifyVeoBody(await readCurrentStatusText(prepared.page));
  if (providerState?.type === "refusal") {
    status = "REFUSAL_NO_RETRY";
    failureReason = providerState.type;
    break;
  }
  if (providerState?.type === "quota") {
    status = "POST_SUBMIT_QUOTA_NO_FALLBACK";
    failureReason = providerState.type;
    break;
  }
  if (providerState?.type === "transient") {
    status = "TRANSIENT_AFTER_SUBMIT_NO_RETRY";
    failureReason = providerState.type;
    break;
  }

  const scopedResponse = await findNewResponseScope(prepared.page, prepared.conversationBaseline);
  if (scopedResponse) {
    const mediaEvidence = await readResponseMediaEvidence(scopedResponse.response);
    const downloadCandidates = await visibleLocators(scopedResponse.response.locator(DOWNLOAD_SELECTOR));
    responseProvenance = {
      conversationUrlBeforeSend: prepared.conversationBaseline.url,
      conversationUrlAfterSend: prepared.page.url(),
      responseSelector: scopedResponse.selector,
      responseCountBefore: scopedResponse.beforeCount,
      responseCountAfter: scopedResponse.afterCount,
      responseIndex: scopedResponse.responseIndex,
      scopedDownloadCount: downloadCandidates.length,
      ...mediaEvidence,
    };
    if (downloadCandidates.length > 1) {
      status = "AMBIGUOUS_SCOPED_DOWNLOAD_COUNT_NO_RETRY";
      failureReason = `scoped_download_count_${downloadCandidates.length}`;
      break;
    }
    if (downloadCandidates.length === 1) {
      const scopedDownload = downloadCandidates[0];
      try {
        const [download] = await Promise.all([
          prepared.page.waitForEvent("download", { timeout: 60_000 }),
          scopedDownload.click(),
        ]);
        suggestedFilename = download.suggestedFilename();
        await download.saveAs(partialVideo);
        const bytes = fs.readFileSync(partialVideo);
        const hasMp4Header = bytes.subarray(0, 64).includes(Buffer.from("ftyp"));
        if (bytes.length < 100_000 || !hasMp4Header) throw new Error(`download_integrity_failed:size=${bytes.length},mp4=${hasMp4Header}`);
        const duplicate = findPreexistingVideoDuplicate(partialVideo);
        responseProvenance.downloadedSha256 = duplicate.downloadedSha256;
        if (duplicate.duplicatePath) {
          status = "DOWNLOAD_MATCHES_PREEXISTING_ARTIFACT_NO_RETRY";
          failureReason = "download_hash_matches_preexisting_video";
          rejectedPartialVideo = partialVideo;
          duplicateExistingArtifact = duplicate.duplicatePath;
          break;
        }
        fs.renameSync(partialVideo, outputVideo);
        downloaded = true;
        status = "SAVED_PENDING_MANUAL_MOTION_QA";
      } catch (error) {
        status = "DOWNLOAD_FAILED_NO_RETRY";
        failureReason = String(error?.message ?? error).slice(0, 240);
      }
      break;
    }
  }
  const videos = await prepared.page.locator("main video").count();
  const globalDownloads = (await visibleLocators(prepared.page.locator("main").locator(DOWNLOAD_SELECTOR))).length;
  log(selectedProfile, `${elapsedSec}s elapsed; videoElements=${videos}; scopedResponse=${Boolean(scopedResponse)}; globalDownloadButtons=${globalDownloads}`);
}

if (!downloaded && status === "TIMEOUT_PENDING_RECOVERY") {
  status = responseProvenance ? "SCOPED_RESPONSE_TIMEOUT_NO_RETRY" : "DOWNLOAD_PROVENANCE_UNCONFIRMED_NO_RETRY";
  failureReason = responseProvenance ? "scoped_response_never_exposed_one_download" : "new_response_container_not_observed";
}

const result = {
  schemaVersion: "minjae_veo_execution_result_v1",
  attemptId,
  status,
  profileId: selectedProfile.profileId,
  profileAudit,
  submissionCount: 1,
  promptSha256,
  referenceSha256,
  outputVideo: downloaded ? outputVideo : null,
  outputSha256: downloaded ? sha256(fs.readFileSync(outputVideo)) : null,
  outputBytes: downloaded ? fs.statSync(outputVideo).size : null,
  suggestedFilename,
  rejectedPartialVideo,
  duplicateExistingArtifact,
  conversationBaseline: prepared.conversationBaseline,
  responseProvenance,
  failureReason,
  automaticRetryPerformed: false,
  fallbackAfterSubmitPerformed: false,
  manualMotionQaRequired: downloaded,
  pageKeptOpenForRecovery: !downloaded,
  finishedAt: new Date().toISOString(),
};
fs.writeFileSync(resultPath, JSON.stringify(result, null, 2) + "\n", { encoding: "utf8", flag: "wx" });
if (downloaded) await prepared.page.close().catch(() => {});
console.log(JSON.stringify({ ...result, intentPath, resultPath }, null, 2));
process.exit(downloaded ? 0 : 1);
