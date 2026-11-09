import { executeMoneyShortsBoundedAutomationStep } from "./money-shorts-automation-executor.mjs";
import {
  MONEY_SHORTS_SAFE_SESSION_COORDINATOR_VERSION,
  coordinateMoneyShortsSafeSessionDryRun,
} from "./money-shorts-safe-session-coordinator.mjs";
import {
  beginMoneyShortsSafeSessionAction,
  finishMoneyShortsSafeSessionAction,
} from "./money-shorts-safe-session-store.mjs";

export const MONEY_SHORTS_SAFE_SESSION_HOST_VERSION =
  "money_shorts_safe_session_host_v1";

const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const TERMINAL_RESULT_STATUSES = new Set(["success", "blocked", "error"]);
const COORDINATOR_SAFETY_KEYS = [
  "timerEnabled",
  "backgroundWorkerEnabled",
  "paidActionEnabled",
  "externalGenerationEnabled",
  "ownerQaDecisionEnabled",
  "uploadEnabled",
  "publicationEnabled",
];

function zeroExecution() {
  return {
    actionCount: 0,
    sessionActionCountDelta: 0,
    chainedActionCount: 0,
    automaticRetryCount: 0,
    paidActionExecuted: false,
    externalGenerationExecuted: false,
    uploadExecuted: false,
    publicationExecuted: false,
    localRenderExecuted: false,
  };
}

function stopped({
  status = "blocked",
  summary,
  detail,
  blockerCode,
  sessionStore = null,
  coordination = null,
  executorResult = null,
  actionCount = 0,
  claimLockedForRecovery = false,
}) {
  return {
    action: "safeSessionRunNext",
    status,
    summary,
    detail,
    blockerCode,
    raw: {
      session: sessionStore,
      coordination,
      executorResult,
      claimLockedForRecovery,
      execution: {
        ...zeroExecution(),
        actionCount,
      },
    },
    noLive: true,
  };
}

function coordinatorBlockerCode(coordination) {
  if (coordination?.state === "inactive") return "SAFE_SESSION_NOT_ACTIVE";
  if (coordination?.state === "waiting") return "SAFE_SESSION_ACTION_IN_FLIGHT";
  if (coordination?.state === "halted") return "SAFE_SESSION_HALTED";
  return "SAFE_SESSION_COORDINATOR_BLOCKED";
}

function exactReadyCoordination(coordination) {
  const claim = coordination?.nextClaim;
  return coordination?.schemaVersion === MONEY_SHORTS_SAFE_SESSION_COORDINATOR_VERSION &&
    coordination?.mode === "session_coordinator_dry_run" &&
    coordination?.state === "ready" &&
    coordination?.actionPlannedCount === 1 &&
    coordination?.actionExecuted === false &&
    coordination?.executionReceiptCreated === false &&
    coordination?.queueStateWritten === false &&
    coordination?.sessionStateWritten === false &&
    coordination?.lockAcquired === false &&
    coordination?.automaticRetryCount === 0 &&
    COORDINATOR_SAFETY_KEYS.every((key) => coordination?.safety?.[key] === false) &&
    SHA256_PATTERN.test(coordination?.coordinatorFingerprint ?? "") &&
    SHA256_PATTERN.test(coordination?.queuePreviewFingerprint ?? "") &&
    claim != null &&
    claim.previewFingerprint === coordination.queuePreviewFingerprint &&
    typeof claim.jobId === "string" &&
    typeof claim.topicId === "string" &&
    typeof claim.action === "string" &&
    SHA256_PATTERN.test(claim.planFingerprint ?? "");
}

function matchingTerminalReceipt(receipt, claim) {
  return receipt?.status === "terminal" &&
    receipt.topicId === claim.topicId &&
    receipt.action === claim.action &&
    receipt.planFingerprint === claim.planFingerprint &&
    TERMINAL_RESULT_STATUSES.has(receipt.resultStatus) &&
    (
      receipt.resultStatus === "success"
        ? receipt.blockerCode == null
        : typeof receipt.blockerCode === "string" && receipt.blockerCode.length > 0
    );
}

/**
 * Executes exactly one coordinator-selected local-safe queue action for an Owner-started session.
 * It has no loop, timer, retry, paid/external generation, QA decision, upload, or publication path.
 *
 * @param {{
 *   expectedSessionId?: string,
 *   expectedCoordinatorFingerprint?: string,
 *   expectedQueuePreviewFingerprint?: string,
 *   handlers?: Record<string, Function>,
 *   executorDependencies?: Record<string, Function>,
 *   dependencies?: {
 *     readSessionStore?: Function,
 *     readQueueView?: Function,
 *     coordinateSession?: Function,
 *     beginSessionAction?: Function,
 *     executeBoundedStep?: Function,
 *     finishSessionAction?: Function,
 *   },
 * }} input
 */
export function executeMoneyShortsSafeSessionHostStep({
  expectedSessionId = "",
  expectedCoordinatorFingerprint = "",
  expectedQueuePreviewFingerprint = "",
  handlers = {},
  executorDependencies = {},
  dependencies = {},
} = {}) {
  const readSessionStore = dependencies.readSessionStore;
  const readQueueView = dependencies.readQueueView;
  const coordinateSession = dependencies.coordinateSession ??
    coordinateMoneyShortsSafeSessionDryRun;
  const beginSessionAction = dependencies.beginSessionAction ??
    beginMoneyShortsSafeSessionAction;
  const executeBoundedStep = dependencies.executeBoundedStep ??
    executeMoneyShortsBoundedAutomationStep;
  const finishSessionAction = dependencies.finishSessionAction ??
    finishMoneyShortsSafeSessionAction;

  if (
    typeof readSessionStore !== "function" ||
    typeof readQueueView !== "function" ||
    typeof coordinateSession !== "function" ||
    typeof beginSessionAction !== "function" ||
    typeof executeBoundedStep !== "function" ||
    typeof finishSessionAction !== "function"
  ) {
    return stopped({
      status: "error",
      summary: "안전 세션 단일 실행기의 로컬 의존성이 준비되지 않았습니다.",
      blockerCode: "SAFE_SESSION_HOST_DEPENDENCY_INVALID",
    });
  }

  let sessionStore;
  let queueView;
  let coordination;
  try {
    sessionStore = readSessionStore();
    queueView = readQueueView();
    coordination = coordinateSession({
      sessionStore,
      runPreview: queueView.runPreview,
    });
  } catch {
    return stopped({
      status: "error",
      summary: "안전 세션과 큐 증거를 다시 읽지 못해 작업을 시작하지 않았습니다.",
      blockerCode: "SAFE_SESSION_HOST_READ_FAILED",
    });
  }

  if (!exactReadyCoordination(coordination)) {
    return stopped({
      summary: coordination?.reason ?? "현재 실행 가능한 안전 세션 작업이 없습니다.",
      detail: "세션·큐 상태를 읽기만 했으며 claim과 실행 영수증은 만들지 않았습니다.",
      blockerCode: coordinatorBlockerCode(coordination),
      sessionStore,
      coordination,
    });
  }

  if (
    expectedSessionId !== coordination.sessionId ||
    expectedCoordinatorFingerprint !== coordination.coordinatorFingerprint ||
    expectedQueuePreviewFingerprint !== coordination.queuePreviewFingerprint
  ) {
    return stopped({
      summary: "화면에 표시된 안전 세션 계획과 현재 증거가 달라 작업을 시작하지 않았습니다.",
      detail: "세션 상태를 다시 확인한 뒤 새로 표시된 단일 작업만 실행해 주세요.",
      blockerCode: "SAFE_SESSION_COORDINATOR_DRIFTED",
      sessionStore,
      coordination,
    });
  }

  const claim = coordination.nextClaim;
  let claimedStore;
  try {
    claimedStore = beginSessionAction({
      sessionId: coordination.sessionId,
      coordinatorFingerprint: coordination.coordinatorFingerprint,
      queuePreviewFingerprint: coordination.queuePreviewFingerprint,
      claim,
    });
  } catch {
    return stopped({
      summary: "안전 세션 claim을 원자적으로 기록하지 못해 작업을 시작하지 않았습니다.",
      detail: "중복·중지·상한·상태 변경 가능성을 다시 확인해 주세요.",
      blockerCode: "SAFE_SESSION_CLAIM_BEGIN_FAILED",
      sessionStore,
      coordination,
    });
  }

  let executorResult;
  try {
    executorResult = executeBoundedStep({
      requestAction: "automationQueueRunSelected",
      input: {
        previewFingerprint: claim.previewFingerprint,
        jobId: claim.jobId,
        topicId: claim.topicId,
        selectedAction: claim.action,
        planFingerprint: claim.planFingerprint,
      },
      handlers,
      dependencies: executorDependencies,
    });
  } catch {
    return stopped({
      status: "error",
      summary: "세션 claim 뒤 단일 executor 호출이 예기치 않게 중단됐습니다.",
      detail: "자동 재시도하지 않습니다. 중단 claim과 실행 영수증 증거를 복구 카드에서 확인해 주세요.",
      blockerCode: "SAFE_SESSION_EXECUTOR_THROWN",
      sessionStore: claimedStore,
      coordination,
      claimLockedForRecovery: true,
    });
  }

  const executorActionCount = executorResult?.raw?.execution?.actionCount;
  if (executorActionCount !== 1) {
    return stopped({
      status: executorResult?.status === "error" ? "error" : "blocked",
      summary: "세션 claim 뒤 실행 직전 증거가 달라 실제 작업은 시작되지 않았습니다.",
      detail: "claim을 자동 해제하거나 재시도하지 않습니다. 새 복구 판정을 확인해 주세요.",
      blockerCode: "SAFE_SESSION_EXECUTION_NOT_STARTED",
      sessionStore: claimedStore,
      coordination,
      executorResult,
      claimLockedForRecovery: true,
    });
  }

  const receipt = executorResult?.raw?.receipt;
  if (!matchingTerminalReceipt(receipt, claim)) {
    return stopped({
      status: "error",
      summary: "안전 작업은 1회 시도됐지만 종료 영수증을 확정할 수 없습니다.",
      detail: "세션 claim을 유지하고 자동 재시도하지 않습니다. 실행 영수증 복구를 먼저 확인해 주세요.",
      blockerCode: "SAFE_SESSION_EXECUTION_RECEIPT_NOT_TERMINAL",
      sessionStore: claimedStore,
      coordination,
      executorResult,
      actionCount: 1,
      claimLockedForRecovery: true,
    });
  }

  let finishedStore;
  try {
    finishedStore = finishSessionAction({
      sessionId: coordination.sessionId,
      claimFingerprint: claimedStore.currentSession?.activeClaim?.claimFingerprint,
      resultStatus: receipt.resultStatus,
      blockerCode: receipt.blockerCode,
      actionCount: 1,
    });
  } catch {
    return stopped({
      status: "error",
      summary: "실행 영수증은 종료됐지만 안전 세션 완료 상태를 확정하지 못했습니다.",
      detail: "같은 작업을 재실행하지 않습니다. 일치 영수증 기반 세션 복구에서 종결해 주세요.",
      blockerCode: "SAFE_SESSION_TERMINALIZE_FAILED",
      sessionStore: claimedStore,
      coordination,
      executorResult,
      actionCount: 1,
      claimLockedForRecovery: true,
    });
  }

  const responseStatus = new Set(["success", "blocked", "error"]).has(executorResult?.status)
    ? executorResult.status
    : "error";
  return {
    action: "safeSessionRunNext",
    status: responseStatus,
    summary: responseStatus === "success"
      ? `안전 세션에서 ${claim.action} 작업 1회를 실행하고 즉시 멈췄습니다.`
      : `안전 세션에서 ${claim.action} 작업 1회를 시도하고 결과를 기록한 뒤 멈췄습니다.`,
    detail: executorResult?.summary ?? "단일 executor 결과를 확인해 주세요.",
    blockerCode: responseStatus === "success"
      ? undefined
      : executorResult?.blockerCode ?? receipt.blockerCode,
    raw: {
      session: finishedStore,
      coordination,
      executorResult,
      claimLockedForRecovery: false,
      execution: {
        actionCount: 1,
        sessionActionCountDelta: 1,
        chainedActionCount: 0,
        automaticRetryCount: 0,
        paidActionExecuted: false,
        externalGenerationExecuted: false,
        uploadExecuted: false,
        publicationExecuted: false,
        localRenderExecuted:
          executorResult?.raw?.execution?.localRenderExecuted === true,
        sessionTerminalResult: {
          resultStatus: receipt.resultStatus,
          blockerCode: receipt.blockerCode,
        },
      },
    },
    noLive: true,
  };
}
