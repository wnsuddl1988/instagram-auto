import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { fingerprintMoneyShortsAutomationPlan } from "../lib/money-shorts-automation-execution-store.mjs";
import { planMoneyShortsAutomationQueueRun } from "../lib/money-shorts-automation-queue-planner.mjs";
import {
  MONEY_SHORTS_SAFE_SESSION_RECOVERY_VERSION,
  planMoneyShortsSafeSessionRecovery,
} from "../lib/money-shorts-safe-session-recovery.mjs";
import {
  beginMoneyShortsSafeSessionAction,
  readMoneyShortsSafeSessionStore,
  startMoneyShortsSafeSession,
} from "../lib/money-shorts-safe-session-store.mjs";
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

const topicId = "safe-session-recovery-topic";
const jobId = "job-safe-session-recovery-topic";
const base = {
  topicId,
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
const planBefore = buildMoneyShortsResumablePlan(base);
const planAfter = buildMoneyShortsResumablePlan({
  ...base,
  flowState: "render_ready",
  flowReadyForRender: true,
});
const planBeforeFingerprint = fingerprintMoneyShortsAutomationPlan(planBefore);
const planAfterFingerprint = fingerprintMoneyShortsAutomationPlan(planAfter);
const availableGuard = { status: "available", receipt: null, recovery: { status: "none" } };
const runPreview = planMoneyShortsAutomationQueueRun({ jobs: [{
  jobId,
  topicId,
  title: "Safe session recovery",
  queueOrder: 1,
  createdAt: "2026-07-17T14:00:00.000Z",
  livePlan: planBefore,
  executionGuard: availableGuard,
  lifecycle: { status: "active" },
}] });

const rootDir = mkdtempSync(join(tmpdir(), "money-shorts-safe-session-recovery-"));
let activeStore;
try {
  startMoneyShortsSafeSession({
    sessionId: "recovery-session",
    maxActionCount: 2,
    rootDir,
    now: () => "2026-07-17T14:00:00.000Z",
    mutationId: "start-recovery-session",
  });
  beginMoneyShortsSafeSessionAction({
    sessionId: "recovery-session",
    coordinatorFingerprint: "a".repeat(64),
    queuePreviewFingerprint: runPreview.previewFingerprint,
    claim: {
      previewFingerprint: runPreview.previewFingerprint,
      jobId,
      topicId,
      action: planBefore.next.action,
      planFingerprint: planBeforeFingerprint,
    },
    rootDir,
    now: () => "2026-07-17T14:01:00.000Z",
    mutationId: "begin-recovery-action",
  });
  activeStore = readMoneyShortsSafeSessionStore({ rootDir });
} finally {
  rmSync(rootDir, { recursive: true, force: true });
}

const inactive = planMoneyShortsSafeSessionRecovery({
  sessionStore: { ...activeStore, currentSession: null },
});
check("recovery schema is versioned", MONEY_SHORTS_SAFE_SESSION_RECOVERY_VERSION === "money_shorts_safe_session_recovery_v1");
check("no active claim stays inactive", inactive.state === "inactive" && inactive.allowedDecision == null && inactive.actionCountDelta === 0);

const unstarted = planMoneyShortsSafeSessionRecovery({
  sessionStore: activeStore,
  currentPlan: planBefore,
  runPreview,
  claimExecutionGuard: availableGuard,
});
check("exact unchanged evidence offers only unstarted claim clearance", unstarted.state === "decision_required" && unstarted.allowedDecision === "clear_unstarted_session_claim" && unstarted.actionCountDelta === 0 && unstarted.sessionDisposition === "halt_after_clear");
check("every recovery plan remains no-execution and requires Owner confirmation", unstarted.ownerConfirmationRequired === true && unstarted.actionExecuted === false && unstarted.executionReceiptCreated === false && unstarted.executionReceiptMutated === false && unstarted.sessionStateWritten === false && unstarted.automaticRetryCount === 0);
check("same evidence reproduces the same recovery fingerprint", planMoneyShortsSafeSessionRecovery({ sessionStore: activeStore, currentPlan: planBefore, runPreview, claimExecutionGuard: availableGuard }).recoveryFingerprint === unstarted.recoveryFingerprint);

const driftedUnstarted = planMoneyShortsSafeSessionRecovery({
  sessionStore: activeStore,
  currentPlan: planBefore,
  runPreview: planMoneyShortsAutomationQueueRun({ jobs: [] }),
  claimExecutionGuard: availableGuard,
});
check("missing receipt plus queue drift remains locked", driftedUnstarted.state === "manual_evidence_required" && driftedUnstarted.allowedDecision == null && driftedUnstarted.sessionDisposition === "keep_locked");

function receipt(overrides = {}) {
  return {
    executionId: "execution-recovery-1",
    topicId,
    action: planBefore.next.action,
    planFingerprint: planBeforeFingerprint,
    status: "terminal",
    resultStatus: "success",
    blockerCode: null,
    planAfterFingerprint,
    planBefore: {
      completedStageCount: planBefore.completedStageCount,
    },
    manualRetryAllowed: false,
    ...overrides,
  };
}

const terminalSuccess = planMoneyShortsSafeSessionRecovery({
  sessionStore: activeStore,
  currentPlan: planAfter,
  claimExecutionGuard: { status: "identical_attempt_recorded", receipt: receipt() },
});
check("matching terminal success offers one-count session terminalization", terminalSuccess.allowedDecision === "terminalize_session_from_receipt" && terminalSuccess.terminalResult?.resultStatus === "success" && terminalSuccess.actionCountDelta === 1);

const terminalBlocked = planMoneyShortsSafeSessionRecovery({
  sessionStore: activeStore,
  currentPlan: planBefore,
  claimExecutionGuard: {
    status: "identical_attempt_recorded",
    receipt: receipt({ resultStatus: "blocked", blockerCode: "TEST_BLOCKER", planAfterFingerprint: planBeforeFingerprint }),
  },
});
check("matching terminal blocker preserves its exact result", terminalBlocked.allowedDecision === "terminalize_session_from_receipt" && terminalBlocked.terminalResult?.resultStatus === "blocked" && terminalBlocked.terminalResult?.blockerCode === "TEST_BLOCKER" && terminalBlocked.actionCountDelta === 1);

const terminalError = planMoneyShortsSafeSessionRecovery({
  sessionStore: activeStore,
  currentPlan: planBefore,
  claimExecutionGuard: {
    status: "identical_attempt_recorded",
    receipt: receipt({ resultStatus: "error", blockerCode: "ACTION_FAILED", planAfterFingerprint: null }),
  },
});
check("matching terminal error may lack an after-plan but still counts one attempt", terminalError.allowedDecision === "terminalize_session_from_receipt" && terminalError.terminalResult?.resultStatus === "error" && terminalError.actionCountDelta === 1);

const clearedReceipt = planMoneyShortsSafeSessionRecovery({
  sessionStore: activeStore,
  currentPlan: planBefore,
  claimExecutionGuard: {
    status: "available",
    receipt: receipt({
      resultStatus: "recovered_cleared_for_manual_retry",
      blockerCode: "AUTOMATION_INTERRUPTED_NO_ARTIFACT_ADVANCE_CLEARED",
      planAfterFingerprint: planBeforeFingerprint,
      manualRetryAllowed: true,
    }),
  },
});
check("cleared execution recovery offers only halt-and-clear session disposition", clearedReceipt.allowedDecision === "clear_session_claim_after_execution_recovery" && clearedReceipt.actionCountDelta === 0 && clearedReceipt.sessionDisposition === "halt_after_clear");

const advancedReceipt = planMoneyShortsSafeSessionRecovery({
  sessionStore: activeStore,
  currentPlan: planAfter,
  claimExecutionGuard: {
    status: "identical_attempt_recorded",
    receipt: receipt({
      resultStatus: "recovered_artifacts_advanced_acknowledged",
      blockerCode: "AUTOMATION_INTERRUPTED_ARTIFACTS_ADVANCED_ACKNOWLEDGED",
    }),
  },
});
check("acknowledged advanced receipt requires a real completed-stage increase", advancedReceipt.allowedDecision === "terminalize_session_from_receipt" && advancedReceipt.terminalResult?.resultStatus === "success" && advancedReceipt.actionCountDelta === 1);

const inProgressReceipt = receipt({ status: "in_progress", resultStatus: null, planAfterFingerprint: null });
const interruptedUnchanged = planMoneyShortsSafeSessionRecovery({
  sessionStore: activeStore,
  currentPlan: planBefore,
  claimExecutionGuard: { status: "manual_review_required", receipt: inProgressReceipt },
  executionRecovery: {
    status: "decision_required",
    comparison: "current_plan_unchanged",
    allowedDecision: "clear_for_manual_retry",
    currentPlanFingerprint: planBeforeFingerprint,
    beforeCompletedStageCount: planBefore.completedStageCount,
    currentCompletedStageCount: planBefore.completedStageCount,
    receipt: inProgressReceipt,
  },
});
check("unchanged interrupted execution must resolve its receipt before halting session", interruptedUnchanged.allowedDecision === "resolve_execution_then_clear_session_claim" && interruptedUnchanged.executionRecoveryDecision === "clear_for_manual_retry" && interruptedUnchanged.actionCountDelta === 0);

const interruptedAdvanced = planMoneyShortsSafeSessionRecovery({
  sessionStore: activeStore,
  currentPlan: planAfter,
  claimExecutionGuard: { status: "manual_review_required", receipt: inProgressReceipt },
  executionRecovery: {
    status: "decision_required",
    comparison: "artifacts_advanced",
    allowedDecision: "acknowledge_artifacts_advanced",
    currentPlanFingerprint: planAfterFingerprint,
    beforeCompletedStageCount: planBefore.completedStageCount,
    currentCompletedStageCount: planAfter.completedStageCount,
    receipt: inProgressReceipt,
  },
});
check("advanced interrupted execution resolves receipt before one-count terminalization", interruptedAdvanced.allowedDecision === "resolve_execution_then_terminalize_session" && interruptedAdvanced.executionRecoveryDecision === "acknowledge_artifacts_advanced" && interruptedAdvanced.actionCountDelta === 1);

const mismatchedReceipt = planMoneyShortsSafeSessionRecovery({
  sessionStore: activeStore,
  currentPlan: planAfter,
  claimExecutionGuard: {
    status: "identical_attempt_recorded",
    receipt: receipt({ topicId: "another-topic" }),
  },
});
check("terminal receipt from another claim remains locked", mismatchedReceipt.state === "manual_evidence_required" && mismatchedReceipt.comparison === "terminal_receipt_mismatch");

const ambiguousRecovery = planMoneyShortsSafeSessionRecovery({
  sessionStore: activeStore,
  currentPlan: planAfter,
  claimExecutionGuard: { status: "manual_review_required", receipt: inProgressReceipt },
  executionRecovery: {
    status: "manual_evidence_required",
    comparison: "ambiguous_plan_change",
    allowedDecision: null,
    currentPlanFingerprint: planAfterFingerprint,
    receipt: inProgressReceipt,
  },
});
check("ambiguous execution evidence never exposes a recovery decision", ambiguousRecovery.state === "manual_evidence_required" && ambiguousRecovery.allowedDecision == null && ambiguousRecovery.sessionDisposition === "keep_locked");

const forgedStore = structuredClone(activeStore);
forgedStore.currentSession.activeClaim.planFingerprint = "f".repeat(64);
const forged = planMoneyShortsSafeSessionRecovery({
  sessionStore: forgedStore,
  currentPlan: planBefore,
  runPreview,
  claimExecutionGuard: availableGuard,
});
check("forged active claim fingerprint fails closed", forged.state === "manual_evidence_required" && forged.comparison === "invalid_active_claim");

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = readFileSync(join(root, "lib", "money-shorts-safe-session-recovery.mjs"), "utf8");
check("recovery planner has no filesystem write, dispatcher, timer, retry, paid action, render, upload, or publication path", !/node:fs|writeFile|renameSync|rmSync|executeMoneyShortsBoundedAutomationStep|dispatchMoneyShortsSafeAutomationAction|beginMoneyShortsAutomationExecution|finishMoneyShortsAutomationExecution|resolveMoneyShortsAutomationRecovery|setTimeout|setInterval|realTtsCreate|realSceneImagesCreate|flowMotionGenerate|finalVideoCreate|actualUpload/u.test(source));

console.log(`\n${passed + failed} checks - ${passed} PASS, ${failed} FAIL`);
if (failed > 0) process.exit(1);
