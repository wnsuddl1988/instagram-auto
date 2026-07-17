import {
  coordinateMoneyShortsSafeSessionDryRun,
} from "./money-shorts-safe-session-coordinator.mjs";
import {
  executeMoneyShortsSafeSessionHostStep,
} from "./money-shorts-safe-session-host.mjs";

export const MONEY_SHORTS_SAFE_SESSION_BOUNDED_RUNNER_VERSION =
  "money_shorts_safe_session_bounded_runner_v1";

const MAX_BOUNDED_ACTIONS = 3;
const SHA256_PATTERN = /^[a-f0-9]{64}$/;

function executionSummary({
  actionCount,
  localRenderExecuted = false,
}) {
  return {
    actionCount,
    sessionActionCountDelta: actionCount,
    chainedActionCount: Math.max(0, actionCount - 1),
    automaticRetryCount: 0,
    paidActionExecuted: false,
    externalGenerationExecuted: false,
    ownerQaDecisionExecuted: false,
    uploadExecuted: false,
    publicationExecuted: false,
    localRenderExecuted,
  };
}

function result({
  status,
  summary,
  detail,
  blockerCode,
  actionCount,
  localRenderExecuted,
  stopReason,
  session = null,
  coordination = null,
  steps = [],
}) {
  return {
    action: "safeSessionRunBounded",
    status,
    summary,
    detail,
    blockerCode,
    raw: {
      session,
      coordination,
      stopReason,
      steps,
      execution: executionSummary({
        actionCount,
        localRenderExecuted,
      }),
      safety: {
        ownerStarted: true,
        maxBoundedActions: MAX_BOUNDED_ACTIONS,
        timerEnabled: false,
        backgroundWorkerEnabled: false,
        automaticRetryEnabled: false,
        paidActionEnabled: false,
        externalGenerationEnabled: false,
        ownerQaDecisionEnabled: false,
        uploadEnabled: false,
        publicationEnabled: false,
      },
    },
    noLive: true,
  };
}

function exactSession(session, expectedSessionId) {
  return session != null &&
    session.sessionId === expectedSessionId &&
    session.mode === "owner_started_bounded_local" &&
    Number.isInteger(session.maxActionCount) &&
    session.maxActionCount >= 1 &&
    session.maxActionCount <= MAX_BOUNDED_ACTIONS &&
    Number.isInteger(session.completedActionCount) &&
    session.completedActionCount >= 0 &&
    session.completedActionCount <= session.maxActionCount;
}

function coordinationFingerprintReady(coordination, expectedSessionId) {
  return coordination?.state === "ready" &&
    coordination?.sessionId === expectedSessionId &&
    coordination?.actionPlannedCount === 1 &&
    SHA256_PATTERN.test(coordination?.coordinatorFingerprint ?? "") &&
    SHA256_PATTERN.test(coordination?.queuePreviewFingerprint ?? "") &&
    coordination?.nextClaim != null;
}

/**
 * Runs an Owner-started bounded local session for at most three successful
 * single-host transitions. Every transition re-reads the session and queue,
 * re-coordinates current evidence, and then delegates to the existing
 * claim/receipt-protected one-action host. It has no timer or retry path.
 */
export function executeMoneyShortsSafeSessionBoundedRun({
  expectedSessionId = "",
  expectedCoordinatorFingerprint = "",
  expectedQueuePreviewFingerprint = "",
  handlers = {},
  executorDependencies = {},
  hostDependencies = {},
  dependencies = {},
} = {}) {
  const readSessionStore = dependencies.readSessionStore;
  const readQueueView = dependencies.readQueueView;
  const coordinateSession = dependencies.coordinateSession ??
    coordinateMoneyShortsSafeSessionDryRun;
  const executeHostStep = dependencies.executeHostStep ??
    executeMoneyShortsSafeSessionHostStep;

  if (
    !/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/.test(expectedSessionId) ||
    !SHA256_PATTERN.test(expectedCoordinatorFingerprint) ||
    !SHA256_PATTERN.test(expectedQueuePreviewFingerprint) ||
    typeof readSessionStore !== "function" ||
    typeof readQueueView !== "function" ||
    typeof coordinateSession !== "function" ||
    typeof executeHostStep !== "function"
  ) {
    return result({
      status: "blocked",
      summary: "로컬 연속 실행 확인 정보나 의존성이 올바르지 않아 시작하지 않았습니다.",
      detail: "화면의 세션·큐 상태를 다시 확인해 주세요.",
      blockerCode: "SAFE_SESSION_BOUNDED_INPUT_INVALID",
      actionCount: 0,
      localRenderExecuted: false,
      stopReason: "invalid_input",
    });
  }

  let actionCount = 0;
  let localRenderExecuted = false;
  const steps = [];
  let latestSessionStore = null;
  let latestCoordination = null;

  for (let stepIndex = 0; stepIndex < MAX_BOUNDED_ACTIONS; stepIndex += 1) {
    let queueView;
    try {
      latestSessionStore = readSessionStore();
      queueView = readQueueView();
      latestCoordination = coordinateSession({
        sessionStore: latestSessionStore,
        runPreview: queueView?.runPreview,
      });
    } catch {
      return result({
        status: "error",
        summary: actionCount > 0
          ? `${actionCount}회 실행 뒤 현재 증거를 다시 읽지 못해 즉시 중단했습니다.`
          : "현재 세션·큐 증거를 읽지 못해 로컬 연속 실행을 시작하지 않았습니다.",
        detail: "자동 재시도하지 않습니다. 현재 세션 상태를 다시 확인해 주세요.",
        blockerCode: "SAFE_SESSION_BOUNDED_READ_FAILED",
        actionCount,
        localRenderExecuted,
        stopReason: "evidence_read_failed",
        session: latestSessionStore,
        coordination: latestCoordination,
        steps,
      });
    }

    const currentSession = latestSessionStore?.currentSession;
    if (!exactSession(currentSession, expectedSessionId)) {
      return result({
        status: actionCount > 0 ? "success" : "blocked",
        summary: actionCount > 0
          ? `${actionCount}회 실행 뒤 세션이 바뀌어 즉시 멈췄습니다.`
          : "화면에 표시된 세션과 현재 세션이 달라 시작하지 않았습니다.",
        detail: "새 세션 상태를 확인한 뒤 다시 결정해 주세요.",
        blockerCode: actionCount > 0 ? undefined : "SAFE_SESSION_BOUNDED_SESSION_DRIFTED",
        actionCount,
        localRenderExecuted,
        stopReason: "session_drifted",
        session: latestSessionStore,
        coordination: latestCoordination,
        steps,
      });
    }

    if (
      currentSession.status !== "ready" ||
      currentSession.actionInFlight === true ||
      currentSession.activeClaim != null
    ) {
      return result({
        status: actionCount > 0 ? "success" : "blocked",
        summary: actionCount > 0
          ? `${actionCount}회 실행 뒤 세션 중지·복구 조건에서 멈췄습니다.`
          : "현재 세션이 중지 또는 복구 대기 상태라 시작하지 않았습니다.",
        detail: "중지 요청 또는 claim 복구를 먼저 확인해 주세요.",
        blockerCode: actionCount > 0 ? undefined : "SAFE_SESSION_BOUNDED_SESSION_NOT_READY",
        actionCount,
        localRenderExecuted,
        stopReason: "session_not_ready",
        session: latestSessionStore,
        coordination: latestCoordination,
        steps,
      });
    }

    if (currentSession.completedActionCount >= currentSession.maxActionCount) {
      return result({
        status: actionCount > 0 ? "success" : "blocked",
        summary: actionCount > 0
          ? `세션 상한까지 로컬 안전 작업 ${actionCount}회를 실행하고 멈췄습니다.`
          : "안전 세션이 이미 설정된 실행 상한에 도달했습니다.",
        detail: "세션을 보관 종료하기 전에는 추가 작업을 실행하지 않습니다.",
        blockerCode: actionCount > 0 ? undefined : "SAFE_SESSION_BOUNDED_CAP_ALREADY_REACHED",
        actionCount,
        localRenderExecuted,
        stopReason: "session_cap_reached",
        session: latestSessionStore,
        coordination: latestCoordination,
        steps,
      });
    }

    if (!coordinationFingerprintReady(latestCoordination, expectedSessionId)) {
      return result({
        status: actionCount > 0 ? "success" : "blocked",
        summary: actionCount > 0
          ? `로컬 안전 작업 ${actionCount}회 뒤 Owner 확인 단계 또는 안전 중단 조건에서 멈췄습니다.`
          : "현재 이어서 실행할 로컬 안전 작업이 없습니다.",
        detail: latestCoordination?.reason ?? "세션·큐 계획을 다시 확인해 주세요.",
        blockerCode: actionCount > 0 ? undefined : "SAFE_SESSION_BOUNDED_NO_SAFE_ACTION",
        actionCount,
        localRenderExecuted,
        stopReason: latestCoordination?.state ?? "no_safe_action",
        session: latestSessionStore,
        coordination: latestCoordination,
        steps,
      });
    }

    if (
      stepIndex === 0 &&
      (
        latestCoordination.coordinatorFingerprint !== expectedCoordinatorFingerprint ||
        latestCoordination.queuePreviewFingerprint !== expectedQueuePreviewFingerprint
      )
    ) {
      return result({
        status: "blocked",
        summary: "화면에 표시된 첫 작업 지문과 현재 증거가 달라 시작하지 않았습니다.",
        detail: "세션 상태를 새로고침한 뒤 새 지문으로 다시 확인해 주세요.",
        blockerCode: "SAFE_SESSION_BOUNDED_FIRST_PLAN_DRIFTED",
        actionCount: 0,
        localRenderExecuted: false,
        stopReason: "first_plan_drifted",
        session: latestSessionStore,
        coordination: latestCoordination,
        steps,
      });
    }

    let hostResult;
    try {
      hostResult = executeHostStep({
        expectedSessionId,
        expectedCoordinatorFingerprint: latestCoordination.coordinatorFingerprint,
        expectedQueuePreviewFingerprint: latestCoordination.queuePreviewFingerprint,
        handlers,
        executorDependencies,
        dependencies: {
          ...hostDependencies,
          readSessionStore,
          readQueueView,
          coordinateSession,
        },
      });
    } catch {
      return result({
        status: "error",
        summary: actionCount > 0
          ? `로컬 안전 작업 ${actionCount}회 뒤 단일 실행기가 중단되어 멈췄습니다.`
          : "첫 단일 실행기가 중단되어 로컬 연속 실행을 멈췄습니다.",
        detail: "자동 재시도하지 않습니다. 현재 세션 claim과 영수증 증거를 확인해 주세요.",
        blockerCode: "SAFE_SESSION_BOUNDED_HOST_THROWN",
        actionCount,
        localRenderExecuted,
        stopReason: "host_thrown",
        session: latestSessionStore,
        coordination: latestCoordination,
        steps,
      });
    }
    const stepActionCount = hostResult?.raw?.execution?.actionCount;
    const stepDelta = hostResult?.raw?.execution?.sessionActionCountDelta;
    localRenderExecuted = localRenderExecuted ||
      hostResult?.raw?.execution?.localRenderExecuted === true;
    steps.push({
      index: stepIndex + 1,
      topicId: latestCoordination.nextClaim?.topicId ?? null,
      action: latestCoordination.nextClaim?.action ?? null,
      status: hostResult?.status ?? "error",
      blockerCode: hostResult?.blockerCode ?? null,
      actionCount: stepActionCount === 1 ? 1 : 0,
    });

    if (stepActionCount === 1 && stepDelta === 1) {
      actionCount += 1;
      latestSessionStore = hostResult?.raw?.session ?? latestSessionStore;
    }

    if (
      hostResult?.status !== "success" ||
      stepActionCount !== 1 ||
      stepDelta !== 1
    ) {
      return result({
        status: hostResult?.status === "error" ? "error" : "blocked",
        summary: actionCount > 0
          ? `로컬 안전 작업 ${actionCount}회 결과를 기록하고 첫 비정상 결과에서 멈췄습니다.`
          : "첫 로컬 안전 작업이 시작되지 않아 즉시 멈췄습니다.",
        detail: hostResult?.summary ?? "단일 실행 결과를 확인해 주세요.",
        blockerCode: hostResult?.blockerCode ?? "SAFE_SESSION_BOUNDED_STEP_NOT_SUCCESSFUL",
        actionCount,
        localRenderExecuted,
        stopReason: "first_non_success",
        session: hostResult?.raw?.session ?? latestSessionStore,
        coordination: latestCoordination,
        steps,
      });
    }
  }

  return result({
    status: "success",
    summary: `Owner가 승인한 상한 안에서 로컬 안전 작업 ${actionCount}회를 실행하고 멈췄습니다.`,
    detail: "최대 3회 유한 실행을 마쳤습니다. 자동 재시도·유료 생성·QA 판정·업로드·게시는 실행하지 않았습니다.",
    actionCount,
    localRenderExecuted,
    stopReason: "bounded_runner_limit_reached",
    session: latestSessionStore,
    coordination: latestCoordination,
    steps,
  });
}
