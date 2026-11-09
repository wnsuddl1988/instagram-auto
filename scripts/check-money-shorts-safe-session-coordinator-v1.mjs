import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { MONEY_SHORTS_SAFE_SESSION_STORE_VERSION } from "../lib/money-shorts-safe-session-store.mjs";
import {
  MONEY_SHORTS_SAFE_SESSION_COORDINATOR_VERSION,
  coordinateMoneyShortsSafeSessionDryRun,
} from "../lib/money-shorts-safe-session-coordinator.mjs";
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

function sessionStore(currentSession = null) {
  return {
    schemaVersion: MONEY_SHORTS_SAFE_SESSION_STORE_VERSION,
    updatedAt: "2026-07-17T12:00:00.000Z",
    currentSession,
    history: currentSession == null ? [] : [{ at: "2026-07-17T12:00:00.000Z", kind: "started", sessionId: currentSession.sessionId, maxActionCount: currentSession.maxActionCount, actionCount: 0 }],
  };
}

function session(overrides = {}) {
  return {
    schemaVersion: MONEY_SHORTS_SAFE_SESSION_STORE_VERSION,
    sessionId: "owner-session-001",
    mode: "owner_started_bounded_local",
    status: "ready",
    maxActionCount: 2,
    completedActionCount: 0,
    actionInFlight: false,
    startedAt: "2026-07-17T12:00:00.000Z",
    updatedAt: "2026-07-17T12:00:00.000Z",
    stopRequestedAt: null,
    ...overrides,
  };
}

function safePreview() {
  const plan = buildMoneyShortsResumablePlan({ topicId: "coordinator-topic", ...basePlanInput });
  return planMoneyShortsAutomationQueueRun({ jobs: [{
    jobId: "job-coordinator-topic",
    topicId: "coordinator-topic",
    title: "Coordinator test",
    queueOrder: 1,
    createdAt: "2026-07-17T12:00:00.000Z",
    livePlan: plan,
    executionGuard: { status: "available", receipt: null },
    lifecycle: { status: "active" },
  }] });
}

const preview = safePreview();
const inactive = coordinateMoneyShortsSafeSessionDryRun({ sessionStore: sessionStore(), runPreview: preview });
check("coordinator schema is versioned", MONEY_SHORTS_SAFE_SESSION_COORDINATOR_VERSION === "money_shorts_safe_session_coordinator_v1");
check("missing Owner session stays inactive without a claim", inactive.state === "inactive" && inactive.nextClaim == null && inactive.actionPlannedCount === 0);
check("inactive coordinator keeps every execution side effect false", inactive.actionExecuted === false && inactive.executionReceiptCreated === false && inactive.queueStateWritten === false && inactive.sessionStateWritten === false && inactive.lockAcquired === false && Object.values(inactive.safety).every((value) => value === false));

const readyStore = sessionStore(session());
const ready = coordinateMoneyShortsSafeSessionDryRun({ sessionStore: readyStore, runPreview: preview });
check("ready session returns the exact one-claim planner evidence", ready.state === "ready" && ready.nextClaim?.topicId === "coordinator-topic" && ready.nextClaim?.previewFingerprint === preview.previewFingerprint && ready.actionPlannedCount === 1);
check("same persisted evidence reproduces coordinator fingerprint", coordinateMoneyShortsSafeSessionDryRun({ sessionStore: readyStore, runPreview: preview }).coordinatorFingerprint === ready.coordinatorFingerprint);

const stopped = coordinateMoneyShortsSafeSessionDryRun({ sessionStore: sessionStore(session({ status: "stop_requested", stopRequestedAt: "2026-07-17T12:01:00.000Z" })), runPreview: preview });
check("stop-requested session halts before exposing a claim", stopped.state === "halted" && stopped.nextClaim == null && stopped.actionPlannedCount === 0);

const noSafePreview = planMoneyShortsAutomationQueueRun({ jobs: [] });
const noSafe = coordinateMoneyShortsSafeSessionDryRun({ sessionStore: readyStore, runPreview: noSafePreview });
check("empty queue returns a halt reason without any claim", noSafe.state === "halted" && noSafe.nextClaim == null && noSafe.actionPlannedCount === 0);

let invalidStoreRejected = false;
try {
  coordinateMoneyShortsSafeSessionDryRun({ sessionStore: { ...readyStore, schemaVersion: "wrong" }, runPreview: preview });
} catch (error) {
  invalidStoreRejected = error instanceof Error && error.message === "safe_session_coordinator_store_invalid";
}
check("wrong persisted store schema is rejected", invalidStoreRejected);

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = readFileSync(join(root, "lib", "money-shorts-safe-session-coordinator.mjs"), "utf8");
check("coordinator imports no store I/O, runner, network, timer, or executor", !/node:fs|node:child_process|readMoneyShortsSafeSessionStore|writeFile|runOneSafeAutomationAction|beginMoneyShortsAutomationExecution|\bfetch\s*\(|setTimeout|setInterval|actualUpload|realTtsCreate|flowMotionGenerate/u.test(source));

console.log(`\n${passed + failed} checks - ${passed} PASS, ${failed} FAIL`);
if (failed > 0) process.exit(1);
