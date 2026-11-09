import { createHash } from "node:crypto";

import { MONEY_SHORTS_AUTOMATION_QUEUE_PLANNER_VERSION } from "./money-shorts-automation-queue-planner.mjs";
import { isMoneyShortsSafeAutoAdvanceAction } from "./money-shorts-resumable-orchestrator.mjs";

export const MONEY_SHORTS_SAFE_SESSION_PLANNER_VERSION = "money_shorts_safe_session_planner_v1";
export const MONEY_SHORTS_SAFE_SESSION_MAX_ACTIONS = 3;

function safeSessionId(sessionId) {
  if (typeof sessionId !== "string" || !/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/.test(sessionId)) {
    throw new Error("safe_session_id_invalid");
  }
  return sessionId;
}

function assertSession(session) {
  if (session?.mode !== "owner_started_bounded_local") {
    throw new Error("safe_session_mode_invalid");
  }
  if (session?.status !== "ready" && session?.status !== "stop_requested") {
    throw new Error("safe_session_status_invalid");
  }
  if (!Number.isInteger(session.maxActionCount) || session.maxActionCount < 1 || session.maxActionCount > MONEY_SHORTS_SAFE_SESSION_MAX_ACTIONS) {
    throw new Error("safe_session_action_cap_invalid");
  }
  if (!Number.isInteger(session.completedActionCount) || session.completedActionCount < 0 || session.completedActionCount > session.maxActionCount) {
    throw new Error("safe_session_completed_count_invalid");
  }
  if (typeof session.actionInFlight !== "boolean") {
    throw new Error("safe_session_in_flight_flag_invalid");
  }
}

function assertRunPreview(runPreview) {
  if (
    runPreview?.schemaVersion !== MONEY_SHORTS_AUTOMATION_QUEUE_PLANNER_VERSION ||
    runPreview?.mode !== "deterministic_dry_run" ||
    (runPreview.selectionCount !== 0 && runPreview.selectionCount !== 1) ||
    !Array.isArray(runPreview.evaluations)
  ) {
    throw new Error("safe_session_queue_preview_invalid");
  }
}

function fingerprintDecision(decision) {
  return createHash("sha256").update(JSON.stringify({
    schemaVersion: MONEY_SHORTS_SAFE_SESSION_PLANNER_VERSION,
    sessionId: decision.sessionId,
    sessionStatus: decision.sessionStatus,
    completedActionCount: decision.completedActionCount,
    maxActionCount: decision.maxActionCount,
    decisionCode: decision.decisionCode,
    queuePreviewFingerprint: decision.queuePreviewFingerprint,
    nextClaim: decision.nextClaim,
  })).digest("hex");
}

function fingerprintQueueSelection(selection) {
  if (selection == null) return null;
  return createHash("sha256").update(JSON.stringify({
    schemaVersion: MONEY_SHORTS_AUTOMATION_QUEUE_PLANNER_VERSION,
    jobId: selection.jobId,
    topicId: selection.topicId,
    queueOrder: selection.queueOrder,
    createdAt: selection.createdAt,
    action: selection.action,
    stageId: selection.stageId,
    gate: selection.gate,
    completedStageCount: selection.completedStageCount,
    totalStageCount: selection.totalStageCount,
    planFingerprint: selection.planFingerprint,
    executionGuardFingerprint: selection.executionGuardFingerprint,
  })).digest("hex");
}

function baseDecision(session, runPreview) {
  return {
    schemaVersion: MONEY_SHORTS_SAFE_SESSION_PLANNER_VERSION,
    mode: "deterministic_session_dry_run",
    sessionId: session.sessionId,
    sessionStatus: session.status,
    completedActionCount: session.completedActionCount,
    maxActionCount: session.maxActionCount,
    remainingActionCapacity: session.maxActionCount - session.completedActionCount,
    queuePreviewFingerprint: runPreview.previewFingerprint ?? null,
    actionExecuted: false,
    executionReceiptCreated: false,
    queueStateWritten: false,
    plannedActionCount: 0,
    automaticRetryCount: 0,
    nextClaim: null,
    stopPolicy: "after_current_action",
    safety: {
      timerEnabled: false,
      backgroundWorkerEnabled: false,
      paidActionEnabled: false,
      externalGenerationEnabled: false,
      ownerQaDecisionEnabled: false,
      uploadEnabled: false,
      publicationEnabled: false,
    },
  };
}

function finishDecision(decision) {
  return {
    ...decision,
    decisionFingerprint: fingerprintDecision(decision),
  };
}

/**
 * Plans at most one future local safe action for an Owner-started bounded session.
 * This is a pure dry-run: it executes nothing and writes no queue/session/receipt state.
 */
export function planMoneyShortsSafeSessionDryRun({ session, runPreview } = {}) {
  const normalizedSession = { ...session, sessionId: safeSessionId(session?.sessionId) };
  assertSession(normalizedSession);
  assertRunPreview(runPreview);
  const base = baseDecision(normalizedSession, runPreview);

  if (normalizedSession.status === "stop_requested") {
    return finishDecision({ ...base, state: "halted", decisionCode: "owner_stop_requested", reason: "Owner 중지 요청을 확인해 새 작업을 시작하지 않습니다." });
  }
  if (normalizedSession.actionInFlight) {
    return finishDecision({ ...base, state: "waiting", decisionCode: "current_action_in_flight", reason: "현재 작업이 끝난 뒤 중지·재계획 여부를 확인합니다." });
  }
  if (normalizedSession.completedActionCount >= normalizedSession.maxActionCount) {
    return finishDecision({ ...base, state: "halted", decisionCode: "session_action_cap_reached", reason: "Owner가 정한 세션 작업 상한에 도달했습니다." });
  }

  const selected = runPreview.selected;
  if (selected == null || runPreview.selectionCount !== 1 || runPreview.previewFingerprint == null) {
    return finishDecision({ ...base, state: "halted", decisionCode: "no_safe_queue_action", reason: "현재 큐에는 자동화 허용 범위의 로컬 안전 작업이 없습니다." });
  }
  if (
    !isMoneyShortsSafeAutoAdvanceAction(selected.action) ||
    typeof selected.jobId !== "string" ||
    typeof selected.topicId !== "string" ||
    typeof selected.planFingerprint !== "string" ||
    !/^[a-f0-9]{64}$/.test(selected.planFingerprint) ||
    !/^[a-f0-9]{64}$/.test(runPreview.previewFingerprint) ||
    fingerprintQueueSelection(selected) !== runPreview.previewFingerprint
  ) {
    return finishDecision({ ...base, state: "blocked", decisionCode: "unsafe_or_invalid_selection", reason: "선택 증거가 안전 실행 계약과 맞지 않아 세션을 차단합니다." });
  }

  return finishDecision({
    ...base,
    state: "ready",
    decisionCode: "one_local_safe_action_planned",
    reason: "현재 큐 증거로 로컬 안전 작업 1개만 계획했습니다. 이 드라이런은 실행하지 않습니다.",
    plannedActionCount: 1,
    nextClaim: {
      previewFingerprint: runPreview.previewFingerprint,
      jobId: selected.jobId,
      topicId: selected.topicId,
      action: selected.action,
      planFingerprint: selected.planFingerprint,
    },
  });
}
