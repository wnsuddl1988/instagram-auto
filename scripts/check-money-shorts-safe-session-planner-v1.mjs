import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  MONEY_SHORTS_SAFE_SESSION_MAX_ACTIONS,
  MONEY_SHORTS_SAFE_SESSION_PLANNER_VERSION,
  planMoneyShortsSafeSessionDryRun,
} from "../lib/money-shorts-safe-session-planner.mjs";
import { planMoneyShortsAutomationQueueRun } from "../lib/money-shorts-automation-queue-planner.mjs";
import { buildMoneyShortsResumablePlan } from "../lib/money-shorts-resumable-orchestrator.mjs";

let passed = 0;
let failed = 0;
function check(name, condition) {
  if (condition) {
    passed += 1;
    console.log(`PASS  ${name}`);
  } else {
    failed += 1;
    console.error(`FAIL  ${name}`);
  }
}

const basePlanInput = {
  scriptReady: true,
  characterReady: true,
  realTtsReady: true,
  generatedImageCount: 8,
  expectedImageCount: 8,
  realImagesReady: true,
  flowState: "not_prepared",
  flowReadyForRender: false,
  finalVideoReady: false,
  mediaQualityGateOk: false,
  publishPreflightReady: false,
  publishedAllParts: false,
};

function job(topicId, queueOrder, planOverrides = {}) {
  return {
    jobId: `job-${topicId}`,
    topicId,
    title: `제목 ${topicId}`,
    queueOrder,
    createdAt: `2026-07-17T0${queueOrder}:00:00.000Z`,
    livePlan: buildMoneyShortsResumablePlan({ topicId, ...basePlanInput, ...planOverrides }),
    executionGuard: { status: "available", receipt: null },
    lifecycle: { status: "active" },
  };
}

function session(overrides = {}) {
  return {
    sessionId: "owner-session-001",
    mode: "owner_started_bounded_local",
    status: "ready",
    maxActionCount: 3,
    completedActionCount: 0,
    actionInFlight: false,
    ...overrides,
  };
}

const runPreview = planMoneyShortsAutomationQueueRun({ jobs: [job("safe-first", 1), job("safe-second", 2)] });
const ready = planMoneyShortsSafeSessionDryRun({ session: session(), runPreview });
check("safe session schema and cap are versioned", MONEY_SHORTS_SAFE_SESSION_PLANNER_VERSION === "money_shorts_safe_session_planner_v1" && MONEY_SHORTS_SAFE_SESSION_MAX_ACTIONS === 3);
check("dry-run plans exactly one selected local-safe action", ready.state === "ready" && ready.plannedActionCount === 1 && ready.nextClaim?.topicId === "safe-first");
check("dry-run executes and writes nothing", ready.actionExecuted === false && ready.executionReceiptCreated === false && ready.queueStateWritten === false && Object.values(ready.safety).every((value) => value === false));
check("dry-run binds the exact queue preview claim", ready.nextClaim.previewFingerprint === runPreview.previewFingerprint && ready.nextClaim.planFingerprint === runPreview.selected.planFingerprint);
check("same evidence reproduces the same decision fingerprint", planMoneyShortsSafeSessionDryRun({ session: session(), runPreview }).decisionFingerprint === ready.decisionFingerprint);

const stopped = planMoneyShortsSafeSessionDryRun({ session: session({ status: "stop_requested" }), runPreview });
check("Owner stop request prevents a new action", stopped.state === "halted" && stopped.decisionCode === "owner_stop_requested" && stopped.plannedActionCount === 0);
const inFlight = planMoneyShortsSafeSessionDryRun({ session: session({ actionInFlight: true }), runPreview });
check("in-flight work waits and never plans a concurrent action", inFlight.state === "waiting" && inFlight.decisionCode === "current_action_in_flight" && inFlight.nextClaim == null);
const capped = planMoneyShortsSafeSessionDryRun({ session: session({ completedActionCount: 3 }), runPreview });
check("session cap halts before another action", capped.state === "halted" && capped.decisionCode === "session_action_cap_reached");

const ownerGatePreview = planMoneyShortsAutomationQueueRun({ jobs: [job("owner-gate", 1, { generatedImageCount: 0, realImagesReady: false })] });
const ownerGate = planMoneyShortsSafeSessionDryRun({ session: session(), runPreview: ownerGatePreview });
check("Owner-gated queue work halts the dry-run", ownerGate.state === "halted" && ownerGate.decisionCode === "no_safe_queue_action");

const unsafePreview = structuredClone(runPreview);
unsafePreview.selected.action = "actualUpload";
const unsafe = planMoneyShortsSafeSessionDryRun({ session: session(), runPreview: unsafePreview });
check("unsafe or forged action selection is blocked", unsafe.state === "blocked" && unsafe.decisionCode === "unsafe_or_invalid_selection");
const staleSafePreview = structuredClone(runPreview);
staleSafePreview.selected.action = "wizardPreflight";
const staleSafe = planMoneyShortsSafeSessionDryRun({ session: session(), runPreview: staleSafePreview });
check("changed safe action with a stale preview fingerprint is blocked", staleSafe.state === "blocked" && staleSafe.decisionCode === "unsafe_or_invalid_selection");

let capRejected = false;
try {
  planMoneyShortsSafeSessionDryRun({ session: session({ maxActionCount: 4 }), runPreview });
} catch (error) {
  capRejected = error instanceof Error && error.message === "safe_session_action_cap_invalid";
}
check("session cap above three is rejected", capRejected);

let invalidSessionRejected = false;
try {
  planMoneyShortsSafeSessionDryRun({ session: session({ sessionId: "../unsafe" }), runPreview });
} catch (error) {
  invalidSessionRejected = error instanceof Error && error.message === "safe_session_id_invalid";
}
check("unsafe session identifier is rejected", invalidSessionRejected);

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const plannerSource = readFileSync(join(root, "lib", "money-shorts-safe-session-planner.mjs"), "utf8");
check("session planner imports no filesystem, process runner, network, or timer", !/node:fs|node:child_process|spawn|execSync|\bfetch\s*\(|setTimeout|setInterval/u.test(plannerSource));
check("session planner never names paid generation or upload as an executable case", !/case\s+["'](?:realTtsCreate|realSceneImagesCreate|flowMotionGenerate|actualUpload)["']/u.test(plannerSource));

console.log(`\n${passed + failed} checks - ${passed} PASS, ${failed} FAIL`);
if (failed > 0) process.exit(1);
