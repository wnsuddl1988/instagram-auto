import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { coordinateMoneyShortsSafeSessionDryRun } from "../lib/money-shorts-safe-session-coordinator.mjs";
import {
  MONEY_SHORTS_SAFE_SESSION_HOST_VERSION,
  executeMoneyShortsSafeSessionHostStep,
} from "../lib/money-shorts-safe-session-host.mjs";
import { planMoneyShortsAutomationQueueRun } from "../lib/money-shorts-automation-queue-planner.mjs";
import { buildMoneyShortsResumablePlan } from "../lib/money-shorts-resumable-orchestrator.mjs";
import {
  beginMoneyShortsSafeSessionAction,
  finishMoneyShortsSafeSessionAction,
  readMoneyShortsSafeSessionStore,
  startMoneyShortsSafeSession,
} from "../lib/money-shorts-safe-session-store.mjs";

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

const coordinatorFingerprint = "a".repeat(64);
const queuePreviewFingerprint = "b".repeat(64);
const planFingerprint = "c".repeat(64);
const claimFingerprint = "d".repeat(64);

function coordination(overrides = {}) {
  return {
    schemaVersion: "money_shorts_safe_session_coordinator_v1",
    mode: "session_coordinator_dry_run",
    state: "ready",
    reason: "one safe action",
    sessionId: "owner-session-001",
    coordinatorFingerprint,
    queuePreviewFingerprint,
    nextClaim: {
      previewFingerprint: queuePreviewFingerprint,
      jobId: "job-safe-host-topic",
      topicId: "safe-host-topic",
      action: "flowMotionPrepare",
      planFingerprint,
    },
    actionPlannedCount: 1,
    actionExecuted: false,
    executionReceiptCreated: false,
    queueStateWritten: false,
    sessionStateWritten: false,
    lockAcquired: false,
    automaticRetryCount: 0,
    safety: {
      timerEnabled: false,
      backgroundWorkerEnabled: false,
      paidActionEnabled: false,
      externalGenerationEnabled: false,
      ownerQaDecisionEnabled: false,
      uploadEnabled: false,
      publicationEnabled: false,
    },
    ...overrides,
  };
}

function store({ claimed = false, completedActionCount = 0 } = {}) {
  return {
    schemaVersion: "money_shorts_safe_session_store_v1",
    updatedAt: "2026-07-17T12:00:00.000Z",
    currentSession: {
      sessionId: "owner-session-001",
      status: "ready",
      maxActionCount: 2,
      completedActionCount,
      actionInFlight: claimed,
      activeClaim: claimed
        ? {
          ...coordination().nextClaim,
          claimFingerprint,
        }
        : null,
    },
    history: [],
  };
}

function executorResult({
  status = "success",
  blockerCode = null,
  actionCount = 1,
  receiptStatus = "terminal",
  receiptResultStatus = status,
} = {}) {
  return {
    action: "automationQueueRunSelected",
    status,
    summary: "bounded executor result",
    blockerCode,
    noLive: true,
    raw: {
      executedAction: "flowMotionPrepare",
      receipt: {
        status: receiptStatus,
        topicId: "safe-host-topic",
        action: "flowMotionPrepare",
        planFingerprint,
        resultStatus: receiptResultStatus,
        blockerCode: receiptResultStatus === "success" ? null : blockerCode,
      },
      execution: {
        actionCount,
        chainedActionCount: 0,
        automaticRetryCount: 0,
        localRenderExecuted: false,
      },
    },
  };
}

function createHarness({
  coordinationResult = coordination(),
  beginThrows = false,
  executorThrows = false,
  finishThrows = false,
  executionResult = executorResult(),
} = {}) {
  const events = [];
  let beginInput = null;
  let executorInput = null;
  let finishInput = null;
  const dependencies = {
    readSessionStore: () => {
      events.push("read-session");
      return store();
    },
    readQueueView: () => {
      events.push("read-queue");
      return { runPreview: { previewFingerprint: queuePreviewFingerprint } };
    },
    coordinateSession: () => {
      events.push("coordinate");
      return coordinationResult;
    },
    beginSessionAction: (input) => {
      events.push("begin-session");
      beginInput = input;
      if (beginThrows) throw new Error("begin_failed");
      return store({ claimed: true });
    },
    executeBoundedStep: (input) => {
      events.push("execute-bounded");
      executorInput = input;
      if (executorThrows) throw new Error("executor_failed");
      return executionResult;
    },
    finishSessionAction: (input) => {
      events.push("finish-session");
      finishInput = input;
      if (finishThrows) throw new Error("finish_failed");
      return store({ completedActionCount: 1 });
    },
  };
  const input = {
    expectedSessionId: "owner-session-001",
    expectedCoordinatorFingerprint: coordinatorFingerprint,
    expectedQueuePreviewFingerprint: queuePreviewFingerprint,
    dependencies,
  };
  return {
    events,
    input,
    get beginInput() { return beginInput; },
    get executorInput() { return executorInput; },
    get finishInput() { return finishInput; },
  };
}

check(
  "safe-session host contract is versioned",
  MONEY_SHORTS_SAFE_SESSION_HOST_VERSION === "money_shorts_safe_session_host_v1",
);

const successHarness = createHarness();
const success = executeMoneyShortsSafeSessionHostStep(successHarness.input);
check(
  "host preserves read-coordinate-claim-execute-terminalize order",
  successHarness.events.join(",") ===
    "read-session,read-queue,coordinate,begin-session,execute-bounded,finish-session",
);
check(
  "host binds the exact coordinator and queue claim before the executor",
  successHarness.beginInput.coordinatorFingerprint === coordinatorFingerprint &&
    successHarness.beginInput.queuePreviewFingerprint === queuePreviewFingerprint &&
    successHarness.beginInput.claim.planFingerprint === planFingerprint &&
    successHarness.executorInput.requestAction === "automationQueueRunSelected" &&
    successHarness.executorInput.input.previewFingerprint === queuePreviewFingerprint,
);
check(
  "host terminalizes exactly one matching session claim and stops",
  success.status === "success" &&
    successHarness.finishInput.claimFingerprint === claimFingerprint &&
    successHarness.finishInput.actionCount === 1 &&
    success.raw.execution.actionCount === 1 &&
    success.raw.execution.sessionActionCountDelta === 1 &&
    success.raw.execution.chainedActionCount === 0 &&
    success.raw.execution.automaticRetryCount === 0,
);

const driftHarness = createHarness();
const drifted = executeMoneyShortsSafeSessionHostStep({
  ...driftHarness.input,
  expectedCoordinatorFingerprint: "e".repeat(64),
});
check(
  "stale displayed coordinator evidence stops before claim and receipt",
  drifted.blockerCode === "SAFE_SESSION_COORDINATOR_DRIFTED" &&
    driftHarness.events.join(",") === "read-session,read-queue,coordinate" &&
    drifted.raw.execution.actionCount === 0,
);

const haltedHarness = createHarness({
  coordinationResult: coordination({
    state: "halted",
    reason: "session cap reached",
    nextClaim: null,
    actionPlannedCount: 0,
  }),
});
const halted = executeMoneyShortsSafeSessionHostStep(haltedHarness.input);
check(
  "stop or cap coordinator result never creates a session claim",
  halted.blockerCode === "SAFE_SESSION_HALTED" &&
    haltedHarness.events.join(",") === "read-session,read-queue,coordinate",
);

const beginHarness = createHarness({ beginThrows: true });
const beginFailed = executeMoneyShortsSafeSessionHostStep(beginHarness.input);
check(
  "failed atomic session claim prevents executor invocation",
  beginFailed.blockerCode === "SAFE_SESSION_CLAIM_BEGIN_FAILED" &&
    beginHarness.events.join(",") === "read-session,read-queue,coordinate,begin-session",
);

const zeroHarness = createHarness({
  executionResult: executorResult({ status: "blocked", blockerCode: "AUTOMATION_QUEUE_PREVIEW_DRIFTED", actionCount: 0 }),
});
const zero = executeMoneyShortsSafeSessionHostStep(zeroHarness.input);
check(
  "pre-execution drift leaves the session claim locked without automatic clearance",
  zero.blockerCode === "SAFE_SESSION_EXECUTION_NOT_STARTED" &&
    zero.raw.claimLockedForRecovery === true &&
    zero.raw.execution.actionCount === 0 &&
    !zeroHarness.events.includes("finish-session"),
);

const throwHarness = createHarness({ executorThrows: true });
const thrown = executeMoneyShortsSafeSessionHostStep(throwHarness.input);
check(
  "executor throw leaves claim locked and never retries",
  thrown.blockerCode === "SAFE_SESSION_EXECUTOR_THROWN" &&
    thrown.raw.claimLockedForRecovery === true &&
    throwHarness.events.filter((event) => event === "execute-bounded").length === 1 &&
    !throwHarness.events.includes("finish-session"),
);

const receiptHarness = createHarness({
  executionResult: executorResult({ receiptStatus: "in_progress" }),
});
const receiptPending = executeMoneyShortsSafeSessionHostStep(receiptHarness.input);
check(
  "non-terminal execution receipt cannot increment the session",
  receiptPending.blockerCode === "SAFE_SESSION_EXECUTION_RECEIPT_NOT_TERMINAL" &&
    receiptPending.raw.execution.actionCount === 1 &&
    receiptPending.raw.execution.sessionActionCountDelta === 0 &&
    !receiptHarness.events.includes("finish-session"),
);

const finishHarness = createHarness({ finishThrows: true });
const finishFailed = executeMoneyShortsSafeSessionHostStep(finishHarness.input);
check(
  "session terminalization failure keeps the exact claim for receipt-based recovery",
  finishFailed.blockerCode === "SAFE_SESSION_TERMINALIZE_FAILED" &&
    finishFailed.raw.claimLockedForRecovery === true &&
    finishHarness.events.filter((event) => event === "execute-bounded").length === 1,
);

const blockedHarness = createHarness({
  executionResult: executorResult({
    status: "blocked",
    blockerCode: "FLOW_PACKET_INPUT_REQUIRED",
    receiptResultStatus: "blocked",
  }),
});
const blocked = executeMoneyShortsSafeSessionHostStep(blockedHarness.input);
check(
  "matching blocked terminal receipt counts one attempt with its exact blocker",
  blocked.status === "blocked" &&
    blockedHarness.finishInput.resultStatus === "blocked" &&
    blockedHarness.finishInput.blockerCode === "FLOW_PACKET_INPUT_REQUIRED" &&
    blocked.raw.execution.sessionActionCountDelta === 1,
);

const integrationRoot = mkdtempSync(join(tmpdir(), "money-shorts-safe-session-host-"));
try {
  startMoneyShortsSafeSession({
    maxActionCount: 2,
    sessionId: "owner-session-integration",
    rootDir: integrationRoot,
    now: () => "2026-07-17T14:00:00.000Z",
    mutationId: "host-integration-start",
  });
  const integrationPlan = buildMoneyShortsResumablePlan({
    topicId: "safe-host-integration-topic",
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
  });
  const integrationPreview = planMoneyShortsAutomationQueueRun({
    jobs: [{
      jobId: "job-safe-host-integration-topic",
      topicId: integrationPlan.topicId,
      title: "Safe host integration",
      queueOrder: 1,
      createdAt: "2026-07-17T14:00:00.000Z",
      livePlan: integrationPlan,
      executionGuard: { status: "available", receipt: null },
      lifecycle: { status: "active" },
    }],
  });
  const initialStore = readMoneyShortsSafeSessionStore({ rootDir: integrationRoot });
  const integrationCoordination = coordinateMoneyShortsSafeSessionDryRun({
    sessionStore: initialStore,
    runPreview: integrationPreview,
  });
  let integrationExecutorCalls = 0;
  const integrated = executeMoneyShortsSafeSessionHostStep({
    expectedSessionId: "owner-session-integration",
    expectedCoordinatorFingerprint: integrationCoordination.coordinatorFingerprint,
    expectedQueuePreviewFingerprint: integrationCoordination.queuePreviewFingerprint,
    dependencies: {
      readSessionStore: () => readMoneyShortsSafeSessionStore({ rootDir: integrationRoot }),
      readQueueView: () => ({ runPreview: integrationPreview }),
      beginSessionAction: (input) => beginMoneyShortsSafeSessionAction({
        ...input,
        rootDir: integrationRoot,
        now: () => "2026-07-17T14:01:00.000Z",
        mutationId: "host-integration-begin",
      }),
      executeBoundedStep: ({ input }) => {
        integrationExecutorCalls += 1;
        return {
          action: "automationQueueRunSelected",
          status: "success",
          summary: "integration local safe action",
          noLive: true,
          raw: {
            receipt: {
              status: "terminal",
              topicId: input.topicId,
              action: input.selectedAction,
              planFingerprint: input.planFingerprint,
              resultStatus: "success",
              blockerCode: null,
            },
            execution: {
              actionCount: 1,
              chainedActionCount: 0,
              automaticRetryCount: 0,
              localRenderExecuted: false,
            },
          },
        };
      },
      finishSessionAction: (input) => finishMoneyShortsSafeSessionAction({
        ...input,
        rootDir: integrationRoot,
        now: () => "2026-07-17T14:02:00.000Z",
        mutationId: "host-integration-finish",
      }),
    },
  });
  const integratedStore = readMoneyShortsSafeSessionStore({ rootDir: integrationRoot });
  check(
    "real atomic session store integration begins and finishes the exact one claim",
    integrated.status === "success" &&
      integrationExecutorCalls === 1 &&
      integratedStore.currentSession.completedActionCount === 1 &&
      integratedStore.currentSession.actionInFlight === false &&
      integratedStore.currentSession.activeClaim == null,
  );
  check(
    "real atomic session history records one start and one terminal action",
    integratedStore.history.map((event) => event.kind).join(",") ===
      "started,action_started,action_finished",
  );
} finally {
  rmSync(integrationRoot, { recursive: true, force: true });
}

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = readFileSync(join(root, "lib", "money-shorts-safe-session-host.mjs"), "utf8");
check(
  "host contains no loop, timer, network, automatic retry, paid generation, QA, upload, or publication call",
  !/while\s*\(|for\s*\(|setTimeout|setInterval|node:child_process|\bfetch\s*\(|realTtsCreate|realSceneImagesCreate|flowMotionGenerate|flowMotionQaPass|flowMotionQaFail|actualUpload/u.test(source),
);

console.log(`\n${passed + failed} checks - ${passed} PASS, ${failed} FAIL`);
if (failed > 0) process.exit(1);
