#!/usr/bin/env node

/**
 * Read-only Flow readiness probe for the existing empty Minjae project.
 *
 * Modes:
 *   --contract-check  local-only contract evidence; no browser import or access
 *   --live-readonly   inspect the already-running Gemini 2 CDP session
 *
 * The live mode never launches Chrome, creates a project, saves settings, types a
 * prompt, attaches media, or submits a generation. Project/settings/generation
 * mutations are blocked at the page network boundary before they reach Flow.
 */

import fs from "node:fs";
import path from "node:path";
import { isCDPOpen } from "./_gemini-veo-core.mjs";
import {
  GEMINI_FLOW_NO_SUBMIT_CONTRACT_VERSION,
  GEMINI_FLOW_NO_SUBMIT_POLICY,
  GEMINI_FLOW_TARGET,
  evaluateGeminiFlowObservation,
} from "./_gemini-flow-no-submit-contract.mjs";

const modes = ["--contract-check", "--live-readonly"].filter((flag) => process.argv.includes(flag));
const LIVE_APPROVAL_ARG = "--allow-browser-readonly";
const forbiddenArgs = [
  "--submit",
  "--save",
  "--new-project",
  "--type-prompt",
  "--attach-reference",
  "--upload",
  "--change-account",
  "--launch-browser",
];
const usedForbiddenArg = forbiddenArgs.find((arg) => process.argv.includes(arg));

if (modes.length !== 1 || usedForbiddenArg) {
  console.error(usedForbiddenArg
    ? `ABORT: ${usedForbiddenArg} is forbidden in the Flow no-submit runner.`
    : "ABORT: choose exactly one mode: --contract-check | --live-readonly");
  process.exit(2);
}

const mode = modes[0];
if (mode === "--live-readonly" && !process.argv.includes(LIVE_APPROVAL_ARG)) {
  console.error(`BLOCKED: ${LIVE_APPROVAL_ARG} is required for live read-only Flow inspection.`);
  process.exit(2);
}
if (mode === "--contract-check" && process.argv.includes(LIVE_APPROVAL_ARG)) {
  console.error(`ABORT: ${LIVE_APPROVAL_ARG} is accepted only in --live-readonly mode.`);
  process.exit(2);
}

if (mode === "--contract-check") {
  console.log(JSON.stringify({
    passed: true,
    mode: "contract_check_no_browser",
    contractVersion: GEMINI_FLOW_NO_SUBMIT_CONTRACT_VERSION,
    target: GEMINI_FLOW_TARGET,
    policy: GEMINI_FLOW_NO_SUBMIT_POLICY,
    browserImported: false,
    browserAccessed: false,
    networkAccessed: false,
  }, null, 2));
  process.exit(0);
}

const OUTPUT_DIR = "C:/tmp/money-shorts-os/gemini-veo/diagnostics/minjae-flow-live-no-submit-v1";
const SUMMARY_PATH = path.join(OUTPUT_DIR, "summary.json");

function normalized(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

async function firstVisible(locator) {
  const count = await locator.count();
  for (let index = 0; index < count; index += 1) {
    const candidate = locator.nth(index);
    if (await candidate.isVisible().catch(() => false)) return candidate;
  }
  return null;
}

function isAllowedTelemetryRequest(method, url) {
  if (method !== "POST") return false;
  return /(?:batchLogFrontendEvents|general\.submitBatchLog|likeness:checkEligibility|google-analytics\.com\/g\/collect|google\.com\/g\/collect)/i.test(url);
}

function isForbiddenMutationRequest(request) {
  const method = request.method().toUpperCase();
  if (["GET", "HEAD", "OPTIONS"].includes(method)) return false;
  const url = request.url();
  if (isAllowedTelemetryRequest(method, url)) return false;
  if (!/(?:labs\.google|aisandbox-pa\.googleapis\.com)/i.test(url)) return false;
  return ["POST", "PUT", "PATCH", "DELETE"].includes(method);
}

function projectIdFromUrl(urlValue) {
  const match = String(urlValue).match(/\/project\/([a-f0-9-]+)/i);
  return match?.[1] ?? null;
}

async function runLiveReadonly() {
  const profileOpen = await isCDPOpen(GEMINI_FLOW_TARGET.cdpPort);
  if (!profileOpen) throw new Error("gemini_2_cdp_not_open_browser_launch_forbidden");

  const { chromium } = await import("playwright");
  const browser = await chromium.connectOverCDP(`http://127.0.0.1:${GEMINI_FLOW_TARGET.cdpPort}`);
  const context = browser.contexts()[0];
  if (!context) throw new Error("gemini_2_browser_context_missing");

  let page = null;
  let outcome = null;
  const blockedNetworkMutations = [];
  try {
    page = await context.newPage();
    await page.route("**/*", async (route) => {
      const request = route.request();
      if (isForbiddenMutationRequest(request)) {
        blockedNetworkMutations.push({ method: request.method(), url: request.url() });
        await route.abort("blockedbyclient");
        return;
      }
      await route.continue();
    });

    await page.goto(GEMINI_FLOW_TARGET.projectUrl, {
      waitUntil: "domcontentloaded",
      timeout: 30_000,
    });
    await page.waitForTimeout(2_500);

    const currentUrl = new URL(page.url());
    const signIn = await firstVisible(page.getByRole("button", { name: /^(로그인|Sign in)$/i }));
    const authenticated = currentUrl.hostname === "labs.google" && !signIn && !/accounts\.google\.com|signin/i.test(currentUrl.href);
    const onboardingNext = await firstVisible(page.locator('[role="dialog"] button').filter({ hasText: /^(다음|Next)$/i }));
    const bodyText = await page.locator("body").innerText();
    const proBadge = await firstVisible(page.locator("button").filter({ hasText: /^PRO$/ }));
    const settingsButton = await firstVisible(page.locator("button").filter({ hasText: /(?:tune\s*)?(?:설정|Settings)$/i }));

    let settingsOpened = false;
    let confirmBeforeGeneration = null;
    let selectedVideoTabs = [];
    let videoModel = null;
    let availableVideoModels = [];
    let creditBalance = null;

    if (!onboardingNext && settingsButton) {
      await settingsButton.click();
      await page.waitForTimeout(600);
      const videoHeading = await firstVisible(page.getByText(/^(동영상 생성 기본값|Video generation defaults)$/i, { exact: true }));
      settingsOpened = Boolean(videoHeading);
      if (videoHeading) {
        const section = videoHeading.locator("xpath=..");
        const alwaysRadio = await firstVisible(page.getByRole("radio").filter({ hasText: /^(?:radio_button_checked\s*)?(항상|Always)/i }));
        confirmBeforeGeneration = await alwaysRadio?.getAttribute("aria-checked") === "true" ? "always" : "not_always";
        selectedVideoTabs = await section.locator('[role="tab"][aria-selected="true"]').evaluateAll((elements) => elements.map((element) => (
          element.innerText || element.textContent || ""
        )));
        const modelButton = await firstVisible(section.locator("button").filter({ hasText: /Omni Flash|Veo 3\.1/i }));
        videoModel = normalized(await modelButton?.innerText()).replace(/\s*arrow_drop_down\s*$/i, "");
        if (modelButton) {
          await modelButton.click();
          await page.waitForTimeout(300);
          availableVideoModels = await page.locator('[role="menuitem"]:visible').evaluateAll((elements) => elements.map((element) => (
            element.innerText || element.textContent || ""
          )));
          await page.keyboard.press("Escape");
        }
      }
    }

    if (proBadge) {
      await proBadge.click();
      await page.waitForTimeout(300);
      const accountDialog = await firstVisible(page.locator('[role="dialog"]').filter({ hasText: /Google Flow (?:크레딧|credits)/i }));
      const accountText = accountDialog ? await accountDialog.innerText() : "";
      const creditMatch = accountText.match(/([\d,]+)\s+Google Flow (?:크레딧|credits)/i);
      creditBalance = creditMatch ? Number(creditMatch[1].replace(/,/g, "")) : null;
      if (accountDialog) await page.keyboard.press("Escape");
    }

    const observation = {
      profileId: GEMINI_FLOW_TARGET.profileId,
      currentHost: currentUrl.hostname,
      projectId: projectIdFromUrl(currentUrl.href),
      authenticated,
      proBadgeVisible: Boolean(proBadge),
      projectEmpty: /미디어 만들기를 시작하거나 미디어를 드롭하세요|start creating media|drop media/i.test(bodyText),
      onboardingDialogVisible: Boolean(onboardingNext),
      settingsOpened,
      confirmBeforeGeneration,
      selectedVideoTabs,
      videoModel,
      availableVideoModels,
      creditBalance,
      expectedCreditsPerGeneration: GEMINI_FLOW_TARGET.expectedCreditsPerGeneration,
      creditCostVerifiedInUi: false,
      blockedNetworkMutations,
      browserLaunched: false,
      newProjectCreated: false,
      settingsSaved: false,
      promptTyped: false,
      referenceAttached: false,
      generationSubmitted: false,
      accountChanged: false,
      submissionCount: 0,
    };
    outcome = {
      schemaVersion: "minjae_flow_live_no_submit_v1",
      contractVersion: GEMINI_FLOW_NO_SUBMIT_CONTRACT_VERSION,
      mode: "live_browser_readonly_no_submit",
      checkedAt: new Date().toISOString(),
      observation,
      evaluation: evaluateGeminiFlowObservation(observation),
      disposablePageClosed: false,
    };
  } finally {
    if (page) await page.close().catch(() => {});
    if (outcome) outcome.disposablePageClosed = true;
  }
  return outcome;
}

let summary;
try {
  summary = await runLiveReadonly();
} catch (error) {
  summary = {
    schemaVersion: "minjae_flow_live_no_submit_v1",
    contractVersion: GEMINI_FLOW_NO_SUBMIT_CONTRACT_VERSION,
    mode: "live_browser_readonly_no_submit",
    checkedAt: new Date().toISOString(),
    evaluation: {
      passed: false,
      readyForOwnerUploadDecision: false,
      readyForPaidGeneration: false,
      failures: [String(error?.message ?? error)],
    },
    disposablePageClosed: true,
  };
}

fs.mkdirSync(OUTPUT_DIR, { recursive: true });
fs.writeFileSync(SUMMARY_PATH, JSON.stringify(summary, null, 2) + "\n", "utf8");
console.log(JSON.stringify({ ...summary, summaryPath: SUMMARY_PATH }, null, 2));
process.exit(summary.evaluation?.passed ? 0 : 1);
