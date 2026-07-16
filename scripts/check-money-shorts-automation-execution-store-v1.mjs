import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  MONEY_SHORTS_AUTOMATION_EXECUTION_STORE_VERSION,
  beginMoneyShortsAutomationExecution,
  fingerprintMoneyShortsAutomationPlan,
  finishMoneyShortsAutomationExecution,
  inspectMoneyShortsAutomationExecution,
  inspectMoneyShortsAutomationRecovery,
  resolveMoneyShortsAutomationRecovery,
} from "../lib/money-shorts-automation-execution-store.mjs";
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

const topicId = "automation-execution-test-topic";
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
const planA = buildMoneyShortsResumablePlan(base);
const planB = buildMoneyShortsResumablePlan({ ...base, flowState: "render_ready", flowReadyForRender: true });
const rootDir = mkdtempSync(join(tmpdir(), "money-shorts-execution-store-"));

try {
  check("store schema is versioned", MONEY_SHORTS_AUTOMATION_EXECUTION_STORE_VERSION === "money_shorts_automation_execution_store_v1");
  check("plan fingerprint is deterministic", fingerprintMoneyShortsAutomationPlan(planA) === fingerprintMoneyShortsAutomationPlan(structuredClone(planA)));
  check("different durable plan state changes fingerprint", fingerprintMoneyShortsAutomationPlan(planA) !== fingerprintMoneyShortsAutomationPlan(planB));

  const first = beginMoneyShortsAutomationExecution({
    topicId,
    action: "flowMotionPrepare",
    plan: planA,
    rootDir,
    executionId: "execution-a",
    now: () => "2026-07-17T01:00:00.000Z",
  });
  check("first safe execution acquires durable lock", first.ok === true && existsSync(first.handle.lockPath));
  check("in-progress receipt exists before action", first.ok === true && existsSync(first.handle.receiptPath));
  const inProgress = first.ok ? JSON.parse(readFileSync(first.handle.receiptPath, "utf8")) : null;
  check("receipt binds topic action and plan fingerprint", inProgress?.status === "in_progress" && inProgress.topicId === topicId && inProgress.action === "flowMotionPrepare" && inProgress.planFingerprint === fingerprintMoneyShortsAutomationPlan(planA));

  const sameWhileActive = beginMoneyShortsAutomationExecution({ topicId, action: "flowMotionPrepare", plan: planA, rootDir });
  check("same in-progress attempt requires manual review", sameWhileActive.ok === false && sameWhileActive.reason === "automation_execution_previous_attempt_requires_manual_review");
  const otherWhileActive = beginMoneyShortsAutomationExecution({ topicId, action: "finalVideoCreate", plan: planB, rootDir });
  check("different action for same topic is blocked by one topic lock", otherWhileActive.ok === false && otherWhileActive.reason === "automation_execution_topic_in_flight");

  const terminal = first.ok ? finishMoneyShortsAutomationExecution({
    handle: first.handle,
    resultStatus: "success",
    planAfter: planB,
    now: () => "2026-07-17T01:01:00.000Z",
  }) : null;
  check("terminal receipt is written before lock release", terminal?.status === "terminal" && terminal.resultStatus === "success" && first.ok && !existsSync(first.handle.lockPath));
  check("terminal receipt records recomputed plan fingerprint", terminal?.planAfterFingerprint === fingerprintMoneyShortsAutomationPlan(planB));

  const sameAfterSuccess = beginMoneyShortsAutomationExecution({ topicId, action: "flowMotionPrepare", plan: planA, rootDir });
  check("identical completed attempt never reruns", sameAfterSuccess.ok === false && sameAfterSuccess.reason === "automation_execution_identical_attempt_already_recorded");
  const inspection = inspectMoneyShortsAutomationExecution({ topicId, action: "flowMotionPrepare", plan: planA, rootDir });
  check("restart inspection sees terminal receipt", inspection.status === "identical_attempt_recorded" && inspection.receipt?.executionId === "execution-a");

  const nextPlan = beginMoneyShortsAutomationExecution({
    topicId,
    action: "finalVideoCreate",
    plan: planB,
    rootDir,
    executionId: "execution-b",
  });
  check("new plan fingerprint may acquire the released topic lock", nextPlan.ok === true);
  if (nextPlan.ok) {
    const blockedTerminal = finishMoneyShortsAutomationExecution({
      handle: nextPlan.handle,
      resultStatus: "blocked",
      blockerCode: "TEST_BLOCKER",
      planAfter: planB,
    });
    check("blocked result is terminal and content-addressed", blockedTerminal.resultStatus === "blocked" && blockedTerminal.blockerCode === "TEST_BLOCKER");
  }

  let unsafeRejected = false;
  try {
    beginMoneyShortsAutomationExecution({ topicId, action: "actualUpload", plan: planA, rootDir });
  } catch (error) {
    unsafeRejected = error instanceof Error && error.message === "automation_execution_action_not_safe";
  }
  check("paid or publication action cannot enter the store", unsafeRejected);

  const retryTopicId = "automation-recovery-retry-topic";
  const retryPlan = buildMoneyShortsResumablePlan({ ...base, topicId: retryTopicId });
  const interruptedRetry = beginMoneyShortsAutomationExecution({
    topicId: retryTopicId,
    action: "flowMotionPrepare",
    plan: retryPlan,
    rootDir,
    executionId: "execution-retry-1",
  });
  const unchangedRecovery = inspectMoneyShortsAutomationRecovery({
    topicId: retryTopicId,
    currentPlan: retryPlan,
    rootDir,
  });
  check(
    "unchanged interrupted plan offers only manual retry clearance",
    unchangedRecovery.status === "decision_required" &&
      unchangedRecovery.comparison === "current_plan_unchanged" &&
      unchangedRecovery.allowedDecision === "clear_for_manual_retry",
  );
  let wrongUnchangedDecisionRejected = false;
  try {
    resolveMoneyShortsAutomationRecovery({
      topicId: retryTopicId,
      currentPlan: retryPlan,
      decision: "acknowledge_artifacts_advanced",
      expectedExecutionId: "execution-retry-1",
      expectedCurrentPlanFingerprint: unchangedRecovery.currentPlanFingerprint,
      rootDir,
    });
  } catch (error) {
    wrongUnchangedDecisionRejected = error instanceof Error && error.message === "automation_recovery_evidence_or_decision_mismatch";
  }
  check("unchanged plan rejects advanced-artifact acknowledgement", wrongUnchangedDecisionRejected);
  const clearedRetry = resolveMoneyShortsAutomationRecovery({
    topicId: retryTopicId,
    currentPlan: retryPlan,
    decision: "clear_for_manual_retry",
    expectedExecutionId: "execution-retry-1",
    expectedCurrentPlanFingerprint: unchangedRecovery.currentPlanFingerprint,
    rootDir,
    now: () => "2026-07-17T02:00:00.000Z",
  });
  check(
    "manual retry clearance terminalizes evidence before unlocking",
    interruptedRetry.ok === true &&
      clearedRetry.receipt.resultStatus === "recovered_cleared_for_manual_retry" &&
      clearedRetry.receipt.manualRetryAllowed === true &&
      !existsSync(interruptedRetry.handle.lockPath),
  );
  const retryInspection = inspectMoneyShortsAutomationExecution({
    topicId: retryTopicId,
    action: "flowMotionPrepare",
    plan: retryPlan,
    rootDir,
  });
  check("cleared identical plan is available but does not auto-run", retryInspection.status === "available" && clearedRetry.actionExecuted === false);
  const manualRetry = beginMoneyShortsAutomationExecution({
    topicId: retryTopicId,
    action: "flowMotionPrepare",
    plan: retryPlan,
    rootDir,
    executionId: "execution-retry-2",
  });
  check("later explicit attempt may start with a new execution id", manualRetry.ok === true && manualRetry.receipt.executionId === "execution-retry-2");
  if (manualRetry.ok) {
    finishMoneyShortsAutomationExecution({ handle: manualRetry.handle, resultStatus: "blocked", planAfter: retryPlan });
  }

  const advancedTopicId = "automation-recovery-advanced-topic";
  const advancedPlanBefore = buildMoneyShortsResumablePlan({ ...base, topicId: advancedTopicId });
  const advancedPlanAfter = buildMoneyShortsResumablePlan({
    ...base,
    topicId: advancedTopicId,
    flowState: "render_ready",
    flowReadyForRender: true,
  });
  const interruptedAdvanced = beginMoneyShortsAutomationExecution({
    topicId: advancedTopicId,
    action: "flowMotionPrepare",
    plan: advancedPlanBefore,
    rootDir,
    executionId: "execution-advanced-1",
  });
  const advancedRecovery = inspectMoneyShortsAutomationRecovery({
    topicId: advancedTopicId,
    currentPlan: advancedPlanAfter,
    rootDir,
  });
  check(
    "advanced artifact plan offers only acknowledgement",
    advancedRecovery.status === "decision_required" &&
      advancedRecovery.comparison === "artifacts_advanced" &&
      advancedRecovery.allowedDecision === "acknowledge_artifacts_advanced" &&
      advancedRecovery.currentCompletedStageCount > advancedRecovery.beforeCompletedStageCount,
  );
  const acknowledged = resolveMoneyShortsAutomationRecovery({
    topicId: advancedTopicId,
    currentPlan: advancedPlanAfter,
    decision: "acknowledge_artifacts_advanced",
    expectedExecutionId: "execution-advanced-1",
    expectedCurrentPlanFingerprint: advancedRecovery.currentPlanFingerprint,
    rootDir,
  });
  check(
    "advanced recovery records acknowledgement without rerun",
    interruptedAdvanced.ok === true &&
      acknowledged.receipt.resultStatus === "recovered_artifacts_advanced_acknowledged" &&
      acknowledged.actionExecuted === false &&
      !existsSync(interruptedAdvanced.handle.lockPath),
  );
  const acknowledgedOriginal = beginMoneyShortsAutomationExecution({
    topicId: advancedTopicId,
    action: "flowMotionPrepare",
    plan: advancedPlanBefore,
    rootDir,
  });
  check("acknowledged original plan remains non-repeatable", acknowledgedOriginal.ok === false && acknowledgedOriginal.reason === "automation_execution_identical_attempt_already_recorded");

  const ambiguousTopicId = "automation-recovery-ambiguous-topic";
  const ambiguousPlanBefore = buildMoneyShortsResumablePlan({ ...base, topicId: ambiguousTopicId });
  const ambiguousPlanAfter = structuredClone(ambiguousPlanBefore);
  ambiguousPlanAfter.status = "manual_attention";
  beginMoneyShortsAutomationExecution({
    topicId: ambiguousTopicId,
    action: "flowMotionPrepare",
    plan: ambiguousPlanBefore,
    rootDir,
    executionId: "execution-ambiguous-1",
  });
  const ambiguousRecovery = inspectMoneyShortsAutomationRecovery({
    topicId: ambiguousTopicId,
    currentPlan: ambiguousPlanAfter,
    rootDir,
  });
  check(
    "same-count plan mutation remains locked for manual evidence",
    ambiguousRecovery.status === "manual_evidence_required" &&
      ambiguousRecovery.comparison === "ambiguous_plan_change" &&
      ambiguousRecovery.allowedDecision == null,
  );
} finally {
  rmSync(rootDir, { recursive: true, force: true });
}

console.log(`\n${passed + failed} checks - ${passed} PASS, ${failed} FAIL`);
if (failed > 0) process.exit(1);
