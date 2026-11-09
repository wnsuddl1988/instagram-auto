export const MONEY_SHORTS_AUTOMATION_EXECUTOR_VERSION =
  "money_shorts_automation_executor_v1";

function zeroExecution() {
  return { actionCount: 0, chainedActionCount: 0, automaticRetryCount: 0 };
}

/** Dispatches exactly one already-approved local-safe action through injected handlers. */
export function dispatchMoneyShortsSafeAutomationAction({ action = "", topicId = "", handlers = {} } = {}) {
  switch (action) {
    case "realTtsPreflight":
      return handlers.realTtsPreflight(topicId);
    case "flowMotionPrepare":
      return handlers.flowMotionPrepare(topicId);
    case "finalVideoCreate":
      return handlers.finalVideoCreate(topicId);
    case "wizardPreflight":
      return handlers.wizardPreflight(topicId);
    default:
      return {
        action: "automationAdvance",
        status: "blocked",
        summary: "자동 실행 허용 목록 밖의 작업이라 중단했습니다.",
        blockerCode: "AUTOMATION_ACTION_NOT_SAFE",
        noLive: true,
      };
  }
}

/**
 * Executes at most one local-safe action with the existing durable receipt lifecycle.
 * All stateful functions are injected so this orchestration can be tested without real work.
 */
export function executeMoneyShortsBoundedAutomationStep({
  requestAction = "",
  input = {},
  handlers = {},
  dependencies = {},
} = {}) {
  if (requestAction !== "automationAdvance" && requestAction !== "automationQueueRunSelected") {
    throw new Error("automation_executor_request_action_invalid");
  }
  const {
    beginExecution,
    fingerprintPlan,
    finishExecution,
    isSafeAction,
    readExecutionGuard,
    readQueueView,
    readSnapshot,
    syncQueueJob,
    verifyQueuePreviewClaim,
  } = dependencies;

  if (requestAction === "automationAdvance" && input.queueJob === true) {
    return {
      action: requestAction,
      status: "blocked",
      summary: "큐 작업은 최신 미리보기의 선택 지문을 확인한 뒤 전용 버튼으로만 실행할 수 있습니다.",
      blockerCode: "AUTOMATION_QUEUE_PREVIEW_REQUIRED",
      raw: { execution: zeroExecution() },
      noLive: true,
    };
  }

  let expectedQueueSelection = null;
  let topicId = typeof input.topicId === "string" ? input.topicId : "";
  const queueJobRequested = requestAction === "automationQueueRunSelected";

  if (queueJobRequested) {
    let queue;
    try {
      queue = readQueueView();
    } catch {
      return {
        action: requestAction,
        status: "error",
        summary: "자동 작업 큐를 다시 계산하지 못해 실행하지 않았습니다.",
        blockerCode: "AUTOMATION_QUEUE_STORE_UNAVAILABLE",
        raw: { execution: zeroExecution() },
        noLive: true,
      };
    }
    const verified = verifyQueuePreviewClaim({
      preview: queue.runPreview,
      claim: {
        previewFingerprint: input.previewFingerprint,
        jobId: input.jobId,
        topicId: input.topicId,
        action: input.selectedAction,
        planFingerprint: input.planFingerprint,
      },
    });
    if (!verified.ok || verified.selection == null) {
      const blockerCode = verified.reason === "preview_has_no_selection"
        ? "AUTOMATION_QUEUE_NO_ELIGIBLE_SELECTION"
        : verified.reason === "preview_fingerprint_drifted"
          ? "AUTOMATION_QUEUE_PREVIEW_DRIFTED"
          : verified.reason === "preview_selection_drifted"
            ? "AUTOMATION_QUEUE_SELECTION_DRIFTED"
            : "AUTOMATION_QUEUE_PREVIEW_CLAIM_INVALID";
      return {
        action: requestAction,
        status: "blocked",
        summary: "큐 미리보기와 현재 상태가 달라 작업을 시작하지 않았습니다.",
        detail: "큐를 다시 확인한 뒤 새로 선택된 안전 작업을 직접 실행해 주세요.",
        blockerCode,
        raw: { queue, execution: zeroExecution() },
        noLive: true,
      };
    }
    expectedQueueSelection = {
      jobId: verified.selection.jobId,
      topicId: verified.selection.topicId,
      action: verified.selection.action,
      planFingerprint: verified.selection.planFingerprint,
      previewFingerprint: verified.selection.previewFingerprint,
    };
    topicId = verified.selection.topicId;
  }

  const before = readSnapshot(topicId);
  const nextAction = before.plan.next?.action ?? null;
  if (
    before.plan.next?.canAutoAdvance !== true ||
    nextAction == null ||
    !isSafeAction(nextAction)
  ) {
    return {
      action: requestAction,
      status: "blocked",
      summary: "현재 단계는 자동 실행할 수 없어 확인 지점에서 멈췄습니다.",
      detail: before.plan.next?.reason ?? "추가 작업이 없습니다.",
      blockerCode: before.plan.next?.gate ?? "AUTOMATION_NO_SAFE_ACTION",
      raw: { planBefore: before.plan, execution: zeroExecution() },
      noLive: true,
    };
  }

  if (
    expectedQueueSelection != null &&
    (
      topicId !== expectedQueueSelection.topicId ||
      nextAction !== expectedQueueSelection.action ||
      fingerprintPlan(before.plan) !== expectedQueueSelection.planFingerprint
    )
  ) {
    return {
      action: requestAction,
      status: "blocked",
      summary: "실행 직전 계획이 미리보기와 달라 영수증을 만들지 않고 중단했습니다.",
      detail: "큐를 다시 확인하면 현재 산출물 기준의 새 작업이 표시됩니다.",
      blockerCode: "AUTOMATION_QUEUE_SELECTION_DRIFTED",
      raw: { planBefore: before.plan, execution: zeroExecution() },
      noLive: true,
    };
  }

  let started;
  try {
    started = beginExecution({ topicId, action: nextAction, plan: before.plan });
  } catch {
    return {
      action: requestAction,
      status: "error",
      summary: "자동 실행 잠금과 사전 영수증을 기록하지 못해 작업을 시작하지 않았습니다.",
      blockerCode: "AUTOMATION_EXECUTION_STORE_UNAVAILABLE",
      raw: { execution: zeroExecution() },
      noLive: true,
    };
  }
  if (!started.ok) {
    const blockerCode = started.reason === "automation_execution_topic_in_flight"
      ? "AUTOMATION_TOPIC_IN_FLIGHT"
      : started.reason === "automation_execution_identical_attempt_already_recorded"
        ? "AUTOMATION_IDENTICAL_ATTEMPT_RECORDED"
        : "AUTOMATION_PREVIOUS_ATTEMPT_MANUAL_REVIEW_REQUIRED";
    return {
      action: requestAction,
      status: "blocked",
      summary: blockerCode === "AUTOMATION_TOPIC_IN_FLIGHT"
        ? "이 주제의 다른 안전 작업이 이미 실행 중이라 중복 실행을 막았습니다."
        : "같은 계획의 실행 기록이 남아 있어 자동 재실행을 막았습니다.",
      detail: "이전 실행 결과 또는 중단 상태를 확인한 뒤 다음 계획으로 진행해야 합니다.",
      blockerCode,
      raw: { receipt: started.receipt, execution: zeroExecution() },
      noLive: true,
    };
  }

  let executed;
  let after;
  try {
    executed = dispatchMoneyShortsSafeAutomationAction({
      action: nextAction,
      topicId,
      handlers,
    });
    after = readSnapshot(topicId);
  } catch {
    let receipt = started.receipt;
    try {
      receipt = finishExecution({
        handle: started.handle,
        resultStatus: "error",
        blockerCode: "AUTOMATION_SAFE_ACTION_UNEXPECTED_FAILURE",
        planAfter: null,
      });
    } catch {
      // Finalization failure intentionally leaves the durable lock for Owner recovery.
    }
    return {
      action: requestAction,
      status: "error",
      summary: "안전 작업 실행 중 예기치 않은 오류가 발생해 자동 재시도 없이 중단했습니다.",
      blockerCode: "AUTOMATION_SAFE_ACTION_UNEXPECTED_FAILURE",
      raw: {
        receipt,
        execution: { actionCount: 1, chainedActionCount: 0, automaticRetryCount: 0 },
      },
      noLive: true,
    };
  }

  let receipt;
  try {
    receipt = finishExecution({
      handle: started.handle,
      resultStatus: executed.status,
      blockerCode: executed.blockerCode ?? null,
      planAfter: after.plan,
    });
  } catch {
    return {
      action: requestAction,
      status: "error",
      summary: "안전 작업은 끝났지만 완료 영수증을 확정하지 못했습니다. 잠금을 유지하고 수동 확인에서 멈췄습니다.",
      blockerCode: "AUTOMATION_RECEIPT_FINALIZE_FAILED",
      raw: {
        receipt: started.receipt,
        executedAction: nextAction,
        execution: { actionCount: 1, chainedActionCount: 0, automaticRetryCount: 0 },
      },
      noLive: true,
    };
  }

  let queue = null;
  if (queueJobRequested) {
    try {
      syncQueueJob({
        topicId,
        plan: after.plan,
        advanceResult: {
          status: executed.status,
          blockerCode: executed.blockerCode ?? null,
          executedAction: nextAction,
          actionCount: 1,
        },
      });
      queue = readQueueView();
    } catch {
      return {
        action: requestAction,
        status: "error",
        summary: "안전 작업 1개는 끝났지만 큐의 최신 단계를 저장하지 못했습니다. 자동 재시도 없이 중단했습니다.",
        blockerCode: "AUTOMATION_QUEUE_SYNC_FAILED",
        raw: {
          executedAction: nextAction,
          receipt,
          planAfter: after.plan,
          execution: { actionCount: 1, chainedActionCount: 0, automaticRetryCount: 0 },
        },
        noLive: true,
      };
    }
  }

  const executionGuard = readExecutionGuard(after.plan);
  const stopLabel = after.plan.next?.stageLabel ?? "완료";
  return {
    action: requestAction,
    status: executed.status,
    summary: executed.status === "success"
      ? `${executed.summary} 다음 단계(${stopLabel})를 다시 확인하고 멈췄습니다.`
      : `안전 작업 1개를 시도한 뒤 중단했습니다: ${executed.summary}`,
    detail: after.plan.next?.reason ?? "추가 작업이 없습니다.",
    blockerCode: executed.blockerCode,
    raw: {
      executedAction: nextAction,
      receipt,
      executionGuard,
      queue,
      execution: {
        actionCount: 1,
        chainedActionCount: 0,
        automaticRetryCount: 0,
        externalGenerationExecuted: false,
        paidActionExecuted: false,
        uploadExecuted: false,
        publicationExecuted: false,
        localRenderExecuted: nextAction === "finalVideoCreate" && executed.status === "success",
        result: executed,
      },
      planBefore: before.plan,
      planAfter: after.plan,
      preflights: after.preflights,
      publishResults: after.publishResults,
    },
    noLive: true,
  };
}
