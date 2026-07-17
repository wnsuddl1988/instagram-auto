import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  MONEY_SHORTS_AUTOMATION_EXECUTOR_VERSION,
  dispatchMoneyShortsSafeAutomationAction,
  executeMoneyShortsBoundedAutomationStep,
} from "../lib/money-shorts-automation-executor.mjs";

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

function plan(action = "flowMotionPrepare", overrides = {}) {
  return {
    topicId: "executor-topic",
    status: "ready_to_advance",
    completedStageCount: 3,
    totalStageCount: 12,
    next: {
      action,
      canAutoAdvance: true,
      stageId: "flow_prepare",
      stageLabel: "Flow 모션 준비",
      gate: "none",
      reason: "다음 로컬 안전 작업을 준비합니다.",
    },
    ...overrides,
  };
}

function createHarness({
  beforePlan = plan(),
  afterPlan = plan("finalVideoCreate", { completedStageCount: 4 }),
  beginResult = null,
  handlerThrows = false,
  finishThrows = false,
  queueMode = false,
  verifyResult = null,
} = {}) {
  const events = [];
  let snapshotReadCount = 0;
  let queueReadCount = 0;
  const handlers = {
    realTtsPreflight: () => ({ action: "realTtsPreflight", status: "success", summary: "tts preflight", noLive: true }),
    flowMotionPrepare: () => {
      events.push("dispatch");
      if (handlerThrows) throw new Error("fake_action_failure");
      return { action: "flowMotionPrepare", status: "success", summary: "flow prepared", noLive: true };
    },
    finalVideoCreate: () => ({ action: "finalVideoCreate", status: "success", summary: "rendered", noLive: true }),
    wizardPreflight: () => ({ action: "wizardPreflight", status: "success", summary: "preflight", noLive: true }),
  };
  const selection = {
    jobId: "job-executor-topic",
    topicId: "executor-topic",
    action: beforePlan.next?.action,
    planFingerprint: "plan-fingerprint",
    previewFingerprint: "preview-fingerprint",
  };
  const dependencies = {
    beginExecution: () => {
      events.push("begin");
      return beginResult ?? { ok: true, handle: { executionId: "execution-1" }, receipt: { status: "in_progress" } };
    },
    fingerprintPlan: () => {
      events.push("fingerprint");
      return "plan-fingerprint";
    },
    finishExecution: ({ resultStatus }) => {
      events.push(`finish:${resultStatus}`);
      if (finishThrows) throw new Error("fake_finish_failure");
      return { status: "finished", resultStatus };
    },
    isSafeAction: (action) => ["realTtsPreflight", "flowMotionPrepare", "finalVideoCreate", "wizardPreflight"].includes(action),
    readExecutionGuard: () => {
      events.push("guard");
      return { status: "available", receipt: null };
    },
    readQueueView: () => {
      queueReadCount += 1;
      events.push(queueReadCount === 1 ? "queue:before" : "queue:after");
      return queueReadCount === 1
        ? { runPreview: { previewFingerprint: "preview-fingerprint" } }
        : { runPreview: { previewFingerprint: "after-preview" }, synced: true };
    },
    readSnapshot: () => {
      snapshotReadCount += 1;
      events.push(snapshotReadCount === 1 ? "snapshot:before" : "snapshot:after");
      const currentPlan = snapshotReadCount === 1 ? beforePlan : afterPlan;
      return { plan: currentPlan, preflights: [], publishResults: [] };
    },
    syncQueueJob: () => events.push("sync"),
    verifyQueuePreviewClaim: () => {
      events.push("verify");
      return verifyResult ?? { ok: true, selection };
    },
  };
  const input = queueMode
    ? {
        previewFingerprint: selection.previewFingerprint,
        jobId: selection.jobId,
        topicId: selection.topicId,
        selectedAction: selection.action,
        planFingerprint: selection.planFingerprint,
      }
    : { topicId: "executor-topic" };
  return { events, handlers, dependencies, input };
}

check("executor contract is versioned", MONEY_SHORTS_AUTOMATION_EXECUTOR_VERSION === "money_shorts_automation_executor_v1");

const dispatchEvents = [];
const dispatchHandlers = Object.fromEntries(
  ["realTtsPreflight", "flowMotionPrepare", "finalVideoCreate", "wizardPreflight"].map((action) => [action, () => {
    dispatchEvents.push(action);
    return { action, status: "success", summary: action, noLive: true };
  }]),
);
for (const action of ["realTtsPreflight", "flowMotionPrepare", "finalVideoCreate", "wizardPreflight"]) {
  dispatchMoneyShortsSafeAutomationAction({ action, topicId: "executor-topic", handlers: dispatchHandlers });
}
check("dispatcher invokes exactly the four local-safe handlers", dispatchEvents.join(",") === "realTtsPreflight,flowMotionPrepare,finalVideoCreate,wizardPreflight");
const unsafeDispatch = dispatchMoneyShortsSafeAutomationAction({ action: "actualUpload", topicId: "executor-topic", handlers: dispatchHandlers });
check("dispatcher blocks an action outside the exact allowlist", unsafeDispatch.status === "blocked" && unsafeDispatch.blockerCode === "AUTOMATION_ACTION_NOT_SAFE" && dispatchEvents.length === 4);

const successHarness = createHarness();
const success = executeMoneyShortsBoundedAutomationStep({
  requestAction: "automationAdvance",
  input: successHarness.input,
  handlers: successHarness.handlers,
  dependencies: successHarness.dependencies,
});
check("single safe step preserves begin-dispatch-recompute-finish-guard order", successHarness.events.join(",") === "snapshot:before,begin,dispatch,snapshot:after,finish:success,guard");
check("single safe step reports exactly one action, zero chain, and zero retry", success.raw.execution.actionCount === 1 && success.raw.execution.chainedActionCount === 0 && success.raw.execution.automaticRetryCount === 0);

const unsafeHarness = createHarness({ beforePlan: plan("actualUpload") });
const unsafe = executeMoneyShortsBoundedAutomationStep({ requestAction: "automationAdvance", input: unsafeHarness.input, handlers: unsafeHarness.handlers, dependencies: unsafeHarness.dependencies });
check("unsafe live plan stops before receipt creation", unsafe.status === "blocked" && unsafeHarness.events.join(",") === "snapshot:before");

const lockedHarness = createHarness({ beginResult: { ok: false, reason: "automation_execution_topic_in_flight", receipt: { status: "in_progress" } } });
const locked = executeMoneyShortsBoundedAutomationStep({ requestAction: "automationAdvance", input: lockedHarness.input, handlers: lockedHarness.handlers, dependencies: lockedHarness.dependencies });
check("in-flight receipt blocks before dispatch", locked.blockerCode === "AUTOMATION_TOPIC_IN_FLIGHT" && lockedHarness.events.join(",") === "snapshot:before,begin");

const throwHarness = createHarness({ handlerThrows: true });
const thrown = executeMoneyShortsBoundedAutomationStep({ requestAction: "automationAdvance", input: throwHarness.input, handlers: throwHarness.handlers, dependencies: throwHarness.dependencies });
check("unexpected action failure writes one error finalization and never retries", thrown.blockerCode === "AUTOMATION_SAFE_ACTION_UNEXPECTED_FAILURE" && throwHarness.events.join(",") === "snapshot:before,begin,dispatch,finish:error" && thrown.raw.execution.automaticRetryCount === 0);

const finishHarness = createHarness({ finishThrows: true });
const finishFailed = executeMoneyShortsBoundedAutomationStep({ requestAction: "automationAdvance", input: finishHarness.input, handlers: finishHarness.handlers, dependencies: finishHarness.dependencies });
check("terminal receipt failure stops after one action for manual review", finishFailed.blockerCode === "AUTOMATION_RECEIPT_FINALIZE_FAILED" && finishHarness.events.join(",") === "snapshot:before,begin,dispatch,snapshot:after,finish:success");

const queueHarness = createHarness({ queueMode: true });
const queueSuccess = executeMoneyShortsBoundedAutomationStep({ requestAction: "automationQueueRunSelected", input: queueHarness.input, handlers: queueHarness.handlers, dependencies: queueHarness.dependencies });
check("queue claim is verified and fingerprinted before receipt creation", queueHarness.events.indexOf("verify") < queueHarness.events.indexOf("fingerprint") && queueHarness.events.indexOf("fingerprint") < queueHarness.events.indexOf("begin"));
check("queue sync happens only after terminal receipt", queueHarness.events.indexOf("finish:success") < queueHarness.events.indexOf("sync") && queueSuccess.raw.queue.synced === true);

const driftHarness = createHarness({ queueMode: true, verifyResult: { ok: false, reason: "preview_fingerprint_drifted", selection: null } });
const drifted = executeMoneyShortsBoundedAutomationStep({ requestAction: "automationQueueRunSelected", input: driftHarness.input, handlers: driftHarness.handlers, dependencies: driftHarness.dependencies });
check("stale queue claim stops before snapshot and receipt", drifted.blockerCode === "AUTOMATION_QUEUE_PREVIEW_DRIFTED" && driftHarness.events.join(",") === "queue:before,verify");

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = readFileSync(join(root, "lib", "money-shorts-automation-executor.mjs"), "utf8");
check("executor has no timer, background loop, network, paid generation, QA, upload, or publication path", !/setTimeout|setInterval|while\s*\(|node:child_process|\bfetch\s*\(|realTtsCreate|realSceneImagesCreate|flowMotionGenerate|actualUpload|flowMotionQaPass|flowMotionQaFail/u.test(source));

console.log(`\n${passed + failed} checks - ${passed} PASS, ${failed} FAIL`);
if (failed > 0) process.exit(1);
