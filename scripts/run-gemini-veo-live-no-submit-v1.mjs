#!/usr/bin/env node

/**
 * Gemini 2 -> 3 -> 4 Veo live readiness probe.
 *
 * This runner opens one disposable tab per inspected profile and only checks:
 *   1) authenticated Gemini access,
 *   2) the Upload/tools button,
 *   3) the Video/Veo entry point,
 *   4) explicit quota/refusal/transient text after opening that entry point.
 *
 * It never types a prompt, attaches a file, acknowledges an intro dialog,
 * changes an account, or submits a message/Veo request.
 */

import fs from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";
import { chromium } from "playwright";
import { classifyVeoBody, isCDPOpen } from "./_gemini-veo-core.mjs";
import {
  GEMINI_VEO_PROFILE_CHAIN,
  GEMINI_VEO_PROFILE_CHAIN_VERSION,
  GEMINI_VEO_PROFILE_POLICY,
  assertGeminiVeoSubmissionBudget,
  canAdvanceToNextGeminiProfile,
  resolveGeminiVeoProfile,
} from "./_gemini-veo-profile-chain.mjs";

const APPROVAL_ARG = "--allow-browser-readonly";
const forbiddenArgs = ["--submit", "--type-prompt", "--attach-reference", "--login", "--change-account"];
const usedForbiddenArg = forbiddenArgs.find((arg) => process.argv.includes(arg));
if (!process.argv.includes(APPROVAL_ARG) || usedForbiddenArg) {
  console.error(
    usedForbiddenArg
      ? `ABORT: ${usedForbiddenArg} is forbidden in the no-submit live preflight.`
      : `BLOCKED: ${APPROVAL_ARG} is required for the read-only browser preflight.`,
  );
  process.exit(2);
}

const CHROME_EXE = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const OUT_DIR = GEMINI_VEO_PROFILE_POLICY.outputRoot + "/diagnostics/live-no-submit-v1";
const SUMMARY_PATH = path.join(OUT_DIR, "summary.json");
const startedAt = new Date().toISOString();
const profileResults = [];

fs.mkdirSync(OUT_DIR, { recursive: true });

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function log(profile, message) {
  console.log(`[${new Date().toISOString().slice(11, 19)}][Gemini ${profile.profileId}] ${message}`);
}

async function ensureReadOnlyChrome(profile) {
  if (!fs.existsSync(CHROME_EXE)) throw new Error("chrome_executable_missing");
  if (!fs.existsSync(profile.userDataDir)) throw new Error("profile_directory_missing");
  if (await isCDPOpen(profile.cdpPort)) return { launchedThisRun: false };

  log(profile, `launching isolated Chrome profile on CDP ${profile.cdpPort}`);
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
    if (await isCDPOpen(profile.cdpPort)) return { launchedThisRun: true };
  }
  throw new Error("cdp_unavailable_after_launch");
}

async function firstVisible(locator) {
  const count = await locator.count();
  for (let index = 0; index < count; index += 1) {
    const candidate = locator.nth(index);
    if (await candidate.isVisible().catch(() => false)) return candidate;
  }
  return null;
}

async function readCurrentVeoStatusText(page) {
  const regions = page.locator('main, [role="dialog"], [role="alert"], [role="status"], [aria-live], [role="menu"]');
  const text = [];
  const count = await regions.count();
  for (let index = 0; index < count; index += 1) {
    const region = regions.nth(index);
    if (!(await region.isVisible().catch(() => false))) continue;
    const value = await region.innerText().catch(() => "");
    if (value) text.push(value);
  }
  return text.join("\n");
}

function publicEvidence(base, extra = {}) {
  return {
    cdpPort: base.cdpPort,
    launchedThisRun: base.launchedThisRun,
    currentHost: base.currentHost,
    authenticated: base.authenticated,
    toolsButtonVisible: base.toolsButtonVisible,
    videoEntryVisible: base.videoEntryVisible,
    veoEntryOpened: base.veoEntryOpened,
    compositorVisible: base.compositorVisible,
    introDialogVisible: base.introDialogVisible,
    ...extra,
  };
}

async function inspectProfile(profile) {
  const evidence = {
    cdpPort: profile.cdpPort,
    launchedThisRun: false,
    currentHost: null,
    authenticated: false,
    toolsButtonVisible: false,
    videoEntryVisible: false,
    veoEntryOpened: false,
    compositorVisible: false,
    introDialogVisible: false,
  };
  let page = null;

  try {
    const chromeState = await ensureReadOnlyChrome(profile);
    evidence.launchedThisRun = chromeState.launchedThisRun;

    const browser = await chromium.connectOverCDP(`http://localhost:${profile.cdpPort}`);
    const context = browser.contexts()[0];
    if (!context) throw new Error("browser_context_missing");

    page = await context.newPage();
    await page.goto("https://gemini.google.com/app", {
      waitUntil: "domcontentloaded",
      timeout: 30_000,
    });
    await page.waitForTimeout(2_500);

    const url = new URL(page.url());
    evidence.currentHost = url.hostname;
    const signIn = await firstVisible(page.getByRole("button", { name: /^(로그인|Sign in)$/i }));
    const loginRequired = /accounts\.google\.com|signin/i.test(url.href) || Boolean(signIn);
    if (loginRequired) {
      return { profileId: profile.profileId, state: "login_required", evidence: publicEvidence(evidence) };
    }
    evidence.authenticated = true;

    const toolsButton = await firstVisible(page.locator([
      'button[aria-label="업로드 및 도구"]',
      'button[aria-label*="Upload and tools"]',
      'button[aria-label*="Upload files"]',
    ].join(", ")));
    evidence.toolsButtonVisible = Boolean(toolsButton);
    if (!toolsButton) {
      return { profileId: profile.profileId, state: "ambiguous_failure", evidence: publicEvidence(evidence, { reason: "tools_button_missing" }) };
    }

    await toolsButton.click();
    await page.waitForTimeout(1_200);

    const menuClassification = classifyVeoBody(await readCurrentVeoStatusText(page));
    if (menuClassification?.type === "quota") {
      return { profileId: profile.profileId, state: "quota_exhausted", evidence: publicEvidence(evidence, { quotaDetected: true }) };
    }
    if (menuClassification?.type === "transient") {
      return { profileId: profile.profileId, state: "transient_error", evidence: publicEvidence(evidence) };
    }
    if (menuClassification?.type === "refusal") {
      return { profileId: profile.profileId, state: "refusal", evidence: publicEvidence(evidence) };
    }

    const videoEntry = await firstVisible(page.getByText(/^(동영상|Video)$/i, { exact: true }));
    evidence.videoEntryVisible = Boolean(videoEntry);
    if (!videoEntry) {
      return { profileId: profile.profileId, state: "ambiguous_failure", evidence: publicEvidence(evidence, { reason: "video_entry_missing" }) };
    }

    await videoEntry.click();
    evidence.veoEntryOpened = true;
    await page.waitForTimeout(2_000);

    const afterText = await readCurrentVeoStatusText(page);
    const afterClassification = classifyVeoBody(afterText);
    if (afterClassification?.type === "quota") {
      return { profileId: profile.profileId, state: "quota_exhausted", evidence: publicEvidence(evidence, { quotaDetected: true }) };
    }
    if (afterClassification?.type === "transient") {
      return { profileId: profile.profileId, state: "transient_error", evidence: publicEvidence(evidence) };
    }
    if (afterClassification?.type === "refusal") {
      return { profileId: profile.profileId, state: "refusal", evidence: publicEvidence(evidence) };
    }

    evidence.compositorVisible = Boolean(await firstVisible(page.locator([
      'button[aria-label*="가로 모드"]',
      'button[aria-label*="세로 모드"]',
      'button[aria-label*="16:9"]',
      'button[aria-label*="9:16"]',
      'button[aria-label*="aspect"]',
    ].join(", "))));
    evidence.introDialogVisible = Boolean(await firstVisible(
      page.getByRole("button", { name: /사용해 보기|Try it|Got it/i }),
    ));

    if (!evidence.compositorVisible && !evidence.introDialogVisible) {
      return { profileId: profile.profileId, state: "ambiguous_failure", evidence: publicEvidence(evidence, { reason: "veo_readiness_unconfirmed" }) };
    }

    return { profileId: profile.profileId, state: "ready", evidence: publicEvidence(evidence, { quotaDetected: false }) };
  } catch (error) {
    return {
      profileId: profile.profileId,
      state: "unavailable",
      evidence: publicEvidence(evidence, { reason: String(error?.message ?? error).slice(0, 160) }),
    };
  } finally {
    if (page) await page.close().catch(() => {});
  }
}

for (const profile of GEMINI_VEO_PROFILE_CHAIN) {
  log(profile, "checking live no-submit readiness");
  const result = await inspectProfile(profile);
  profileResults.push(result);
  log(profile, `state=${result.state}`);

  if (result.state === "ready" || !canAdvanceToNextGeminiProfile(result.state)) break;
}

const decision = resolveGeminiVeoProfile(profileResults.map(({ profileId, state }) => ({ profileId, state })));
const submissionBudget = assertGeminiVeoSubmissionBudget([]);
const summary = {
  schemaVersion: "gemini_veo_live_no_submit_v1",
  contractVersion: GEMINI_VEO_PROFILE_CHAIN_VERSION,
  mode: "live_browser_readonly_no_submit",
  startedAt,
  finishedAt: new Date().toISOString(),
  priority: GEMINI_VEO_PROFILE_CHAIN.map((profile) => profile.desktopShortcutName),
  profiles: profileResults,
  decision,
  submissionCount: submissionBudget.submissionCount,
  promptTyped: false,
  referenceAttached: false,
  introDialogAcknowledged: false,
  aspectRatioChanged: false,
  automaticLoginAttempted: false,
  accountChanged: false,
};

fs.writeFileSync(SUMMARY_PATH, JSON.stringify(summary, null, 2) + "\n", "utf8");
console.log(JSON.stringify({ ...summary, summaryPath: SUMMARY_PATH }, null, 2));
process.exit(decision.decision === "READY" ? 0 : 1);
