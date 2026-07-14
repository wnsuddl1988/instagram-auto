#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import {
  GEMINI_FLOW_NO_SUBMIT_CONTRACT_VERSION,
  GEMINI_FLOW_NO_SUBMIT_POLICY,
  GEMINI_FLOW_TARGET,
  evaluateGeminiFlowObservation,
} from "./_gemini-flow-no-submit-contract.mjs";

const runnerPath = "scripts/run-minjae-flow-live-no-submit-v1.mjs";
const source = fs.readFileSync(runnerPath, "utf8");
const clickTargets = [...source.matchAll(/await\s+([A-Za-z][A-Za-z0-9_]*)\.click\(/g)].map((match) => match[1]);
let passed = 0;
let failed = 0;

function check(label, condition) {
  if (condition) {
    passed += 1;
    console.log(`PASS ${label}`);
  } else {
    failed += 1;
    console.error(`FAIL ${label}`);
  }
}

const contractRun = spawnSync(process.execPath, [runnerPath, "--contract-check"], { encoding: "utf8" });
const contractOutput = contractRun.status === 0 ? JSON.parse(contractRun.stdout) : null;
const liveWithoutApproval = spawnSync(process.execPath, [runnerPath, "--live-readonly"], { encoding: "utf8" });
const forbiddenSubmit = spawnSync(process.execPath, [runnerPath, "--contract-check", "--submit"], { encoding: "utf8" });

const goodObservation = {
  profileId: 2,
  currentHost: "labs.google",
  projectId: GEMINI_FLOW_TARGET.projectId,
  authenticated: true,
  proBadgeVisible: true,
  projectEmpty: true,
  onboardingDialogVisible: false,
  settingsOpened: true,
  confirmBeforeGeneration: "always",
  selectedVideoTabs: ["crop_9_16\n9:16", "1x"],
  videoModel: "Veo 3.1 - Fast",
  availableVideoModels: ["Omni Flash", "Veo 3.1 - Lite", "Veo 3.1 - Fast", "Veo 3.1 - Quality"],
  creditBalance: 1_000,
  blockedNetworkMutations: [],
  browserLaunched: false,
  newProjectCreated: false,
  settingsSaved: false,
  promptTyped: false,
  referenceAttached: false,
  generationSubmitted: false,
  accountChanged: false,
  submissionCount: 0,
};

check("contract is versioned", GEMINI_FLOW_NO_SUBMIT_CONTRACT_VERSION === "gemini_flow_no_submit_contract_v1");
check("target is the approved existing Gemini 2 Flow project", GEMINI_FLOW_TARGET.profileId === 2 && GEMINI_FLOW_TARGET.cdpPort === 9224 && GEMINI_FLOW_TARGET.projectUrl.endsWith(GEMINI_FLOW_TARGET.projectId));
check("target defaults are Fast 9:16 single output with explicit confirmation", GEMINI_FLOW_TARGET.model === "Veo 3.1 - Fast" && GEMINI_FLOW_TARGET.aspectRatio === "9:16" && GEMINI_FLOW_TARGET.outputCount === 1 && GEMINI_FLOW_TARGET.creditSpendApprovalPolicy === "always");
check("policy prohibits every external mutation", Object.entries(GEMINI_FLOW_NO_SUBMIT_POLICY).every(([key, value]) => key === "submissionCount" ? value === 0 : value === false));
check("local contract mode performs no browser or network access", contractRun.status === 0 && contractOutput?.passed === true && contractOutput?.browserImported === false && contractOutput?.browserAccessed === false && contractOutput?.networkAccessed === false);
check("Playwright is imported only after the contract-only exit", !/import\s+\{?\s*chromium[^\n]*from\s+["']playwright["']/.test(source) && source.indexOf("process.exit(0)") < source.indexOf('await import("playwright")'));
check("live mode requires explicit read-only approval", liveWithoutApproval.status === 2 && /--allow-browser-readonly/.test(liveWithoutApproval.stderr));
check("submit arguments are rejected before any live path", forbiddenSubmit.status === 2 && /--submit is forbidden/.test(forbiddenSubmit.stderr));
check("good observation passes but is never paid-generation ready", evaluateGeminiFlowObservation(goodObservation).passed === true && evaluateGeminiFlowObservation(goodObservation).readyForPaidGeneration === false);
check("wrong model fails closed", evaluateGeminiFlowObservation({ ...goodObservation, videoModel: "Omni Flash" }).failures.includes("video_model_mismatch"));
check("wrong ratio or output count fails closed", evaluateGeminiFlowObservation({ ...goodObservation, selectedVideoTabs: ["16:9", "2x"] }).failures.includes("aspect_ratio_mismatch") && evaluateGeminiFlowObservation({ ...goodObservation, selectedVideoTabs: ["16:9", "2x"] }).failures.includes("output_count_mismatch"));
check("automatic credit spending fails closed", evaluateGeminiFlowObservation({ ...goodObservation, confirmBeforeGeneration: "not_always" }).failures.includes("credit_approval_policy_mismatch"));
check("insufficient credits fail closed", evaluateGeminiFlowObservation({ ...goodObservation, creditBalance: 19 }).failures.includes("insufficient_or_unknown_credit_balance"));
check("onboarding and non-empty project fail closed", evaluateGeminiFlowObservation({ ...goodObservation, onboardingDialogVisible: true, projectEmpty: false }).failures.length >= 2);
check("any network mutation attempt fails closed", evaluateGeminiFlowObservation({ ...goodObservation, blockedNetworkMutations: [{ method: "PATCH", url: "blocked" }] }).failures.includes("network_mutation_attempt_blocked"));
check("runner never launches Chrome or closes the shared browser", !/\bspawn\b|browser\.close\(/.test(source) && /gemini_2_cdp_not_open_browser_launch_forbidden/.test(source));
check("runner contains no prompt typing, attachment, upload, save, project creation, or generation click", !/\.fill\(|\.type\(|setInputFiles|filechooser|waitForEvent\(["']filechooser|\.getByRole\([^\n]*(?:저장|Save|새 프로젝트|New project|만들기|Generate)/.test(source));
check("the only browser clicks open settings, the model menu, and the credit dialog", JSON.stringify(clickTargets) === JSON.stringify(["settingsButton", "modelButton", "proBadge"]));
check("runner blocks non-telemetry Flow mutations before the server", /page\.route\(["']\*\*\/\*["']/.test(source) && /route\.abort\(["']blockedbyclient["']\)/.test(source) && /isForbiddenMutationRequest/.test(source));
check("runner inspects only a disposable page and records its closure", /context\.newPage\(\)/.test(source) && /if \(page\) await page\.close/.test(source) && /disposablePageClosed/.test(source));
check("evidence keeps all mutation and submission fields false", /settingsSaved: false/.test(source) && /promptTyped: false/.test(source) && /referenceAttached: false/.test(source) && /generationSubmitted: false/.test(source) && /submissionCount: 0/.test(source));
check("live evidence is written only under C tmp", /C:\/tmp\/money-shorts-os\/gemini-veo\/diagnostics\/minjae-flow-live-no-submit-v1/.test(source));

console.log(JSON.stringify({ passed: failed === 0, passedCount: passed, totalCount: passed + failed, failedCount: failed }, null, 2));
process.exit(failed === 0 ? 0 : 1);
