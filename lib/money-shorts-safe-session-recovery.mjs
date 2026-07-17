import { createHash } from "node:crypto";

import { fingerprintMoneyShortsAutomationPlan } from "./money-shorts-automation-execution-store.mjs";
import { verifyMoneyShortsAutomationQueuePreviewClaim } from "./money-shorts-automation-queue-planner.mjs";
import {
  MONEY_SHORTS_SAFE_SESSION_STORE_VERSION,
  fingerprintMoneyShortsSafeSessionClaim,
} from "./money-shorts-safe-session-store.mjs";
import { isMoneyShortsSafeAutoAdvanceAction } from "./money-shorts-resumable-orchestrator.mjs";

export const MONEY_SHORTS_SAFE_SESSION_RECOVERY_VERSION = "money_shorts_safe_session_recovery_v1";
const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const SAFE_CODE_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9_.:-]{0,199}$/;

function fingerprintResult(result) {
  return createHash("sha256").update(JSON.stringify({
    schemaVersion: result.schemaVersion,
    state: result.state,
    comparison: result.comparison,
    allowedDecision: result.allowedDecision,
    sessionId: result.sessionId,
    claimFingerprint: result.claimFingerprint,
    currentPlanFingerprint: result.currentPlanFingerprint,
    executionRecoveryDecision: result.executionRecoveryDecision,
    terminalResult: result.terminalResult,
    actionCountDelta: result.actionCountDelta,
    sessionDisposition: result.sessionDisposition,
  })).digest("hex");
}

function finishResult(result) {
  const complete = {
    schemaVersion: MONEY_SHORTS_SAFE_SESSION_RECOVERY_VERSION,
    mode: "evidence_only_recovery_plan",
    state: "manual_evidence_required",
    comparison: "unclassified_evidence",
    allowedDecision: null,
    reason: "중단된 세션 claim의 증거를 안전하게 판정할 수 없습니다.",
    sessionId: null,
    claimFingerprint: null,
    currentPlanFingerprint: null,
    executionRecoveryDecision: null,
    terminalResult: null,
    actionCountDelta: 0,
    sessionDisposition: "keep_locked",
    ownerConfirmationRequired: false,
    actionExecuted: false,
    executionReceiptCreated: false,
    executionReceiptMutated: false,
    sessionStateWritten: false,
    automaticRetryCount: 0,
    paidActionExecuted: false,
    externalGenerationExecuted: false,
    renderExecuted: false,
    uploadExecuted: false,
    publicationExecuted: false,
    ...result,
  };
  return {
    ...complete,
    recoveryFingerprint: fingerprintResult(complete),
  };
}

function inactiveResult(sessionId = null) {
  return finishResult({
    state: "inactive",
    comparison: "no_interrupted_claim",
    reason: "복구할 실행 중 세션 claim이 없습니다.",
    sessionId,
    sessionDisposition: "unchanged",
  });
}

function manualResult(base, comparison, reason) {
  return finishResult({
    ...base,
    state: "manual_evidence_required",
    comparison,
    allowedDecision: null,
    reason,
    terminalResult: null,
    actionCountDelta: 0,
    sessionDisposition: "keep_locked",
    ownerConfirmationRequired: false,
  });
}

function decisionResult(base, {
  comparison,
  allowedDecision,
  reason,
  terminalResult = null,
  actionCountDelta = 0,
  sessionDisposition,
  executionRecoveryDecision = null,
}) {
  return finishResult({
    ...base,
    state: "decision_required",
    comparison,
    allowedDecision,
    reason,
    terminalResult,
    actionCountDelta,
    sessionDisposition,
    executionRecoveryDecision,
    ownerConfirmationRequired: true,
  });
}

function receiptMatchesClaim(receipt, claim) {
  return receipt != null &&
    receipt.topicId === claim.topicId &&
    receipt.action === claim.action &&
    receipt.planFingerprint === claim.planFingerprint;
}

function safeTerminalBlocker(blockerCode) {
  return typeof blockerCode === "string" && SAFE_CODE_PATTERN.test(blockerCode);
}

function validActiveClaim(session) {
  const claim = session?.activeClaim;
  if (
    session?.actionInFlight !== true ||
    claim == null ||
    typeof claim.jobId !== "string" ||
    typeof claim.topicId !== "string" ||
    !isMoneyShortsSafeAutoAdvanceAction(claim.action) ||
    !SHA256_PATTERN.test(claim.coordinatorFingerprint ?? "") ||
    !SHA256_PATTERN.test(claim.queuePreviewFingerprint ?? "") ||
    !SHA256_PATTERN.test(claim.previewFingerprint ?? "") ||
    !SHA256_PATTERN.test(claim.planFingerprint ?? "") ||
    !SHA256_PATTERN.test(claim.claimFingerprint ?? "") ||
    claim.previewFingerprint !== claim.queuePreviewFingerprint
  ) {
    return false;
  }
  try {
    return fingerprintMoneyShortsSafeSessionClaim({
      sessionId: session.sessionId,
      coordinatorFingerprint: claim.coordinatorFingerprint,
      queuePreviewFingerprint: claim.queuePreviewFingerprint,
      claim,
    }) === claim.claimFingerprint;
  } catch {
    return false;
  }
}

function exactUnstartedPreview(runPreview, claim) {
  return verifyMoneyShortsAutomationQueuePreviewClaim({
    preview: runPreview,
    claim: {
      previewFingerprint: claim.queuePreviewFingerprint,
      jobId: claim.jobId,
      topicId: claim.topicId,
      action: claim.action,
      planFingerprint: claim.planFingerprint,
    },
  }).ok === true;
}

function terminalDecision(base, claim, receipt, currentPlan, currentPlanFingerprint) {
  if (
    !receiptMatchesClaim(receipt, claim) ||
    receipt.status !== "terminal"
  ) {
    return manualResult(base, "terminal_receipt_mismatch", "종료 영수증이 세션 claim과 정확히 일치하지 않아 잠금을 유지합니다.");
  }

  if (receipt.resultStatus === "recovered_cleared_for_manual_retry") {
    if (
      receipt.manualRetryAllowed === true &&
      currentPlanFingerprint === claim.planFingerprint &&
      receipt.planAfterFingerprint === currentPlanFingerprint
    ) {
      return decisionResult(base, {
        comparison: "execution_recovery_cleared_without_progress",
        allowedDecision: "clear_session_claim_after_execution_recovery",
        reason: "실행 영수증이 무진행 수동 재시도 허용으로 종료되었습니다. Owner 확인 후 현재 세션은 중지 상태로 claim만 해제할 수 있습니다.",
        sessionDisposition: "halt_after_clear",
      });
    }
    return manualResult(base, "cleared_receipt_plan_mismatch", "재시도 허용 영수증과 현재 계획이 일치하지 않아 세션 claim을 해제하지 않습니다.");
  }

  if (receipt.resultStatus === "error") {
    if (!safeTerminalBlocker(receipt.blockerCode)) {
      return manualResult(base, "terminal_error_blocker_invalid", "오류 종료 영수증의 차단 코드가 유효하지 않아 잠금을 유지합니다.");
    }
    if (receipt.planAfterFingerprint != null && receipt.planAfterFingerprint !== currentPlanFingerprint) {
      return manualResult(base, "terminal_error_plan_mismatch", "오류 종료 후 계획 해시가 현재 증거와 달라 잠금을 유지합니다.");
    }
    return decisionResult(base, {
      comparison: "matching_terminal_error_receipt",
      allowedDecision: "terminalize_session_from_receipt",
      reason: "정확히 일치하는 오류 종료 영수증이 있어 Owner 확인 후 세션 작업 1회로 종결할 수 있습니다.",
      terminalResult: { resultStatus: "error", blockerCode: receipt.blockerCode, actionCount: 1 },
      actionCountDelta: 1,
      sessionDisposition: "terminalize_matching_claim",
    });
  }

  if (receipt.planAfterFingerprint !== currentPlanFingerprint) {
    return manualResult(base, "terminal_plan_after_mismatch", "종료 영수증의 이후 계획 해시가 현재 아티팩트 계획과 달라 잠금을 유지합니다.");
  }

  if (receipt.resultStatus === "success") {
    return decisionResult(base, {
      comparison: "matching_terminal_success_receipt",
      allowedDecision: "terminalize_session_from_receipt",
      reason: "정확히 일치하는 성공 종료 영수증이 있어 Owner 확인 후 세션 작업 1회로 종결할 수 있습니다.",
      terminalResult: { resultStatus: "success", blockerCode: null, actionCount: 1 },
      actionCountDelta: 1,
      sessionDisposition: "terminalize_matching_claim",
    });
  }

  if (receipt.resultStatus === "blocked") {
    if (!safeTerminalBlocker(receipt.blockerCode)) {
      return manualResult(base, "terminal_blocker_invalid", "차단 종료 영수증의 차단 코드가 유효하지 않아 잠금을 유지합니다.");
    }
    return decisionResult(base, {
      comparison: "matching_terminal_blocked_receipt",
      allowedDecision: "terminalize_session_from_receipt",
      reason: "정확히 일치하는 차단 종료 영수증이 있어 Owner 확인 후 세션 작업 1회로 종결할 수 있습니다.",
      terminalResult: { resultStatus: "blocked", blockerCode: receipt.blockerCode, actionCount: 1 },
      actionCountDelta: 1,
      sessionDisposition: "terminalize_matching_claim",
    });
  }

  if (receipt.resultStatus === "recovered_artifacts_advanced_acknowledged") {
    const beforeCount = receipt.planBefore?.completedStageCount;
    const currentCount = currentPlan?.completedStageCount;
    if (Number.isInteger(beforeCount) && Number.isInteger(currentCount) && currentCount > beforeCount) {
      return decisionResult(base, {
        comparison: "matching_recovered_advanced_receipt",
        allowedDecision: "terminalize_session_from_receipt",
        reason: "기존 복구 영수증과 증가한 단계 증거가 일치해 Owner 확인 후 세션 작업 1회로 종결할 수 있습니다.",
        terminalResult: { resultStatus: "success", blockerCode: null, actionCount: 1 },
        actionCountDelta: 1,
        sessionDisposition: "terminalize_matching_claim",
      });
    }
    return manualResult(base, "recovered_advanced_count_mismatch", "복구 영수증은 진행을 주장하지만 완료 단계 증가가 확인되지 않아 잠금을 유지합니다.");
  }

  return manualResult(base, "terminal_result_unsupported", "종료 영수증 결과가 세션 복구 허용 목록과 맞지 않아 잠금을 유지합니다.");
}

/**
 * Produces only an evidence-derived Owner recovery decision for one interrupted session claim.
 * It performs no store read/write, receipt mutation, retry, dispatch, render, upload, or publish.
 */
export function planMoneyShortsSafeSessionRecovery({
  sessionStore,
  currentPlan = null,
  runPreview = null,
  claimExecutionGuard = null,
  executionRecovery = null,
} = {}) {
  if (sessionStore?.schemaVersion !== MONEY_SHORTS_SAFE_SESSION_STORE_VERSION) {
    throw new Error("safe_session_recovery_store_invalid");
  }
  const session = sessionStore.currentSession;
  if (session == null) return inactiveResult();
  if (session.actionInFlight !== true && session.activeClaim == null) {
    return inactiveResult(session.sessionId ?? null);
  }

  const rawClaim = session.activeClaim;
  const initialBase = {
    sessionId: session.sessionId ?? null,
    claimFingerprint: SHA256_PATTERN.test(rawClaim?.claimFingerprint ?? "") ? rawClaim.claimFingerprint : null,
  };
  if (!validActiveClaim(session)) {
    return manualResult(initialBase, "invalid_active_claim", "실행 중 상태와 active claim 증거가 일치하지 않아 잠금을 유지합니다.");
  }
  const claim = session.activeClaim;
  if (currentPlan?.topicId !== claim.topicId) {
    return manualResult(initialBase, "current_plan_topic_mismatch", "현재 계획의 주제가 active claim과 달라 잠금을 유지합니다.");
  }

  const currentPlanFingerprint = fingerprintMoneyShortsAutomationPlan(currentPlan);
  const base = {
    ...initialBase,
    currentPlanFingerprint,
  };
  const guard = claimExecutionGuard;
  if (guard?.status === "available" && guard.receipt == null) {
    if (currentPlanFingerprint === claim.planFingerprint && exactUnstartedPreview(runPreview, claim)) {
      return decisionResult(base, {
        comparison: "claim_recorded_executor_not_started",
        allowedDecision: "clear_unstarted_session_claim",
        reason: "세션 claim은 기록됐지만 실행 영수증이 없고 큐·계획 증거도 그대로입니다. Owner 확인 후 세션을 중지하고 claim만 해제할 수 있습니다.",
        sessionDisposition: "halt_after_clear",
      });
    }
    return manualResult(base, "unstarted_evidence_drifted", "실행 영수증은 없지만 큐 또는 계획 증거가 달라 자동 판정을 중단합니다.");
  }

  if (guard?.status === "available" && guard.receipt != null) {
    return terminalDecision(base, claim, guard.receipt, currentPlan, currentPlanFingerprint);
  }

  if (guard?.status === "identical_attempt_recorded") {
    return terminalDecision(base, claim, guard.receipt, currentPlan, currentPlanFingerprint);
  }

  if (guard?.status === "manual_review_required") {
    if (
      executionRecovery?.status !== "decision_required" ||
      !receiptMatchesClaim(executionRecovery.receipt, claim) ||
      executionRecovery.currentPlanFingerprint !== currentPlanFingerprint
    ) {
      return manualResult(base, "execution_recovery_evidence_mismatch", "실행 복구 증거가 active claim 및 현재 계획과 일치하지 않아 잠금을 유지합니다.");
    }
    if (
      executionRecovery.allowedDecision === "clear_for_manual_retry" &&
      executionRecovery.comparison === "current_plan_unchanged" &&
      currentPlanFingerprint === claim.planFingerprint
    ) {
      return decisionResult(base, {
        comparison: "interrupted_execution_no_artifact_progress",
        allowedDecision: "resolve_execution_then_clear_session_claim",
        reason: "중단된 실행의 계획이 그대로입니다. 기존 실행 복구를 먼저 종결한 뒤 Owner 확인으로 세션을 중지하고 claim을 해제할 수 있습니다.",
        sessionDisposition: "halt_after_clear",
        executionRecoveryDecision: "clear_for_manual_retry",
      });
    }
    if (
      executionRecovery.allowedDecision === "acknowledge_artifacts_advanced" &&
      executionRecovery.comparison === "artifacts_advanced" &&
      Number.isInteger(executionRecovery.beforeCompletedStageCount) &&
      Number.isInteger(executionRecovery.currentCompletedStageCount) &&
      executionRecovery.currentCompletedStageCount > executionRecovery.beforeCompletedStageCount
    ) {
      return decisionResult(base, {
        comparison: "interrupted_execution_artifacts_advanced",
        allowedDecision: "resolve_execution_then_terminalize_session",
        reason: "완료 단계가 증가한 중단 실행 증거가 있습니다. 기존 실행 복구를 먼저 종결한 뒤 Owner 확인으로 세션 작업 1회를 성공 처리할 수 있습니다.",
        terminalResult: { resultStatus: "success", blockerCode: null, actionCount: 1 },
        actionCountDelta: 1,
        sessionDisposition: "terminalize_matching_claim",
        executionRecoveryDecision: "acknowledge_artifacts_advanced",
      });
    }
    return manualResult(base, "execution_recovery_decision_unsupported", "실행 복구 결론이 세션 복구 계약과 일치하지 않아 잠금을 유지합니다.");
  }

  return manualResult(base, "execution_guard_not_recoverable", "실행 안전장치 상태를 세션 복구 계약으로 판정할 수 없어 잠금을 유지합니다.");
}
