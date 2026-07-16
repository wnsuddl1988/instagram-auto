import { createHash } from "node:crypto";

import { fingerprintMoneyShortsAutomationPlan } from "./money-shorts-automation-execution-store.mjs";
import { isMoneyShortsSafeAutoAdvanceAction } from "./money-shorts-resumable-orchestrator.mjs";

export const MONEY_SHORTS_AUTOMATION_QUEUE_PLANNER_VERSION =
  "money_shorts_automation_queue_planner_v1";

const GUARD_SKIP = Object.freeze({
  topic_in_flight: {
    code: "topic_in_flight",
    reason: "이 주제의 이전 안전 작업이 아직 실행 중이라 건너뜁니다.",
  },
  manual_review_required: {
    code: "manual_review_required",
    reason: "중단된 이전 실행을 Owner가 확인해야 하므로 건너뜁니다.",
  },
  identical_attempt_recorded: {
    code: "identical_attempt_recorded",
    reason: "같은 계획과 작업의 실행 기록이 있어 중복 실행을 막았습니다.",
  },
  store_unavailable: {
    code: "store_unavailable",
    reason: "실행 영수증 저장소를 확인할 수 없어 안전하게 건너뜁니다.",
  },
  not_applicable: {
    code: "execution_not_applicable",
    reason: "현재 계획은 실행 영수증 안전장치의 대상이 아니므로 건너뜁니다.",
  },
});

function stableQueueOrder(left, right) {
  const leftCreatedAt = typeof left?.createdAt === "string" ? left.createdAt : "\uffff";
  const rightCreatedAt = typeof right?.createdAt === "string" ? right.createdAt : "\uffff";
  return leftCreatedAt.localeCompare(rightCreatedAt) ||
    String(left?.topicId ?? "").localeCompare(String(right?.topicId ?? "")) ||
    String(left?.jobId ?? "").localeCompare(String(right?.jobId ?? ""));
}

function skipped(job, code, reason) {
  const planFingerprint = job?.livePlan == null
    ? null
    : fingerprintMoneyShortsAutomationPlan(job.livePlan);
  return {
    jobId: job?.jobId ?? null,
    topicId: job?.topicId ?? null,
    title: job?.title ?? job?.topicId ?? null,
    createdAt: job?.createdAt ?? null,
    eligible: false,
    eligibilityCode: code,
    eligibilityReason: reason,
    action: job?.livePlan?.next?.action ?? null,
    stageId: job?.livePlan?.next?.stageId ?? null,
    stageLabel: job?.livePlan?.next?.stageLabel ?? null,
    gate: job?.livePlan?.next?.gate ?? null,
    completedStageCount: job?.livePlan?.completedStageCount ?? null,
    totalStageCount: job?.livePlan?.totalStageCount ?? null,
    executionGuardStatus: job?.executionGuard?.status ?? null,
    planFingerprint,
    executionGuardFingerprint: fingerprintExecutionGuard(job?.executionGuard),
  };
}

function fingerprintExecutionGuard(guard) {
  const evidence = {
    status: guard?.status ?? null,
    receipt: guard?.receipt
      ? {
          executionId: guard.receipt.executionId ?? null,
          planFingerprint: guard.receipt.planFingerprint ?? null,
          action: guard.receipt.action ?? null,
          status: guard.receipt.status ?? null,
          resultStatus: guard.receipt.resultStatus ?? null,
          blockerCode: guard.receipt.blockerCode ?? null,
        }
      : null,
    recovery: guard?.recovery
      ? {
          status: guard.recovery.status ?? null,
          comparison: guard.recovery.comparison ?? null,
          allowedDecision: guard.recovery.allowedDecision ?? null,
          currentPlanFingerprint: guard.recovery.currentPlanFingerprint ?? null,
        }
      : null,
  };
  return createHash("sha256").update(JSON.stringify(evidence)).digest("hex");
}

function fingerprintSelection(selection) {
  if (selection == null) return null;
  const evidence = {
    schemaVersion: MONEY_SHORTS_AUTOMATION_QUEUE_PLANNER_VERSION,
    jobId: selection.jobId,
    topicId: selection.topicId,
    createdAt: selection.createdAt,
    action: selection.action,
    stageId: selection.stageId,
    gate: selection.gate,
    completedStageCount: selection.completedStageCount,
    totalStageCount: selection.totalStageCount,
    planFingerprint: selection.planFingerprint,
    executionGuardFingerprint: selection.executionGuardFingerprint,
  };
  return createHash("sha256").update(JSON.stringify(evidence)).digest("hex");
}

function evaluateQueueJob(job) {
  const plan = job?.livePlan;
  if (
    typeof job?.jobId !== "string" ||
    typeof job?.topicId !== "string" ||
    typeof job?.createdAt !== "string" ||
    Number.isNaN(Date.parse(job.createdAt)) ||
    plan?.topicId !== job.topicId
  ) {
    return skipped(job, "invalid_job_evidence", "큐 작업과 현재 계획의 식별 증거가 맞지 않아 건너뜁니다.");
  }

  if (plan.status === "complete" || plan.next == null) {
    return skipped(job, "completed", "모든 제작·게시 단계가 완료된 주제라 건너뜁니다.");
  }

  if (job?.lifecycle?.status === "paused") {
    return skipped(job, "paused_by_owner", "Owner가 일시정지한 주제라 다시 재개할 때까지 건너뜁니다.");
  }

  if (plan.next.canAutoAdvance !== true) {
    if (plan.status === "manual_recovery_required" || plan.next.gate === "manual_recovery") {
      return skipped(job, "manual_recovery_required", plan.next.reason || "수동 복구가 필요한 단계라 건너뜁니다.");
    }
    return skipped(job, "owner_gate_required", plan.next.reason || "Owner 확인이 필요한 단계라 건너뜁니다.");
  }

  const action = plan.next.action;
  if (!isMoneyShortsSafeAutoAdvanceAction(action)) {
    return skipped(job, "unsafe_action", "로컬 안전 실행 허용 목록 밖의 작업이라 건너뜁니다.");
  }

  const guardStatus = job?.executionGuard?.status;
  if (guardStatus !== "available") {
    const guardSkip = GUARD_SKIP[guardStatus] ?? {
      code: "execution_guard_unknown",
      reason: "실행 안전장치 상태를 판정할 수 없어 건너뜁니다.",
    };
    return skipped(job, guardSkip.code, guardSkip.reason);
  }

  return {
    jobId: job.jobId,
    topicId: job.topicId,
    title: job.title ?? job.topicId,
    createdAt: job.createdAt,
    eligible: true,
    eligibilityCode: "eligible_safe_local_action",
    eligibilityReason: "현재 계획과 기존 안전장치가 로컬 작업 1개를 허용합니다.",
    action,
    stageId: plan.next.stageId,
    stageLabel: plan.next.stageLabel,
    gate: plan.next.gate,
    completedStageCount: plan.completedStageCount,
    totalStageCount: plan.totalStageCount,
    executionGuardStatus: guardStatus,
    planFingerprint: fingerprintMoneyShortsAutomationPlan(plan),
    executionGuardFingerprint: fingerprintExecutionGuard(job.executionGuard),
  };
}

/**
 * Builds one deterministic dry-run selection from live queue evidence.
 * This function is pure: it writes no receipt and executes no action.
 */
export function planMoneyShortsAutomationQueueRun({ jobs } = {}) {
  if (!Array.isArray(jobs)) throw new Error("automation_queue_planner_jobs_required");

  const evaluations = [...jobs]
    .sort(stableQueueOrder)
    .map(evaluateQueueJob);
  const selectedEvaluation = evaluations.find((item) => item.eligible) ?? null;
  const selected = selectedEvaluation == null ? null : {
    jobId: selectedEvaluation.jobId,
    topicId: selectedEvaluation.topicId,
    title: selectedEvaluation.title,
    createdAt: selectedEvaluation.createdAt,
    action: selectedEvaluation.action,
    stageId: selectedEvaluation.stageId,
    stageLabel: selectedEvaluation.stageLabel,
    gate: selectedEvaluation.gate,
    completedStageCount: selectedEvaluation.completedStageCount,
    totalStageCount: selectedEvaluation.totalStageCount,
    planFingerprint: selectedEvaluation.planFingerprint,
    executionGuardFingerprint: selectedEvaluation.executionGuardFingerprint,
    reason: "실행 가능한 주제 중 생성 시각이 가장 오래되어 다음 작업으로 선택했습니다.",
  };
  const previewFingerprint = fingerprintSelection(selected);

  return {
    schemaVersion: MONEY_SHORTS_AUTOMATION_QUEUE_PLANNER_VERSION,
    mode: "deterministic_dry_run",
    evaluatedJobCount: evaluations.length,
    eligibleJobCount: evaluations.filter((item) => item.eligible).length,
    selectionCount: selected == null ? 0 : 1,
    previewFingerprint,
    selected,
    evaluations: evaluations.map((item) => {
      const itemSelected = selected?.jobId === item.jobId;
      return {
        ...item,
        selected: itemSelected,
        decisionReason: itemSelected
          ? "실행 가능한 주제 중 생성 시각이 가장 오래되어 다음 작업으로 선택했습니다."
          : item.eligible
            ? "더 오래된 실행 가능 주제가 먼저 선택되어 후순위로 대기합니다."
            : item.eligibilityReason,
      };
    }),
    safety: {
      actionExecuted: false,
      executionReceiptCreated: false,
      timerEnabled: false,
      backgroundWorkerEnabled: false,
      automaticRetryEnabled: false,
      paidActionEnabled: false,
      externalGenerationEnabled: false,
      uploadEnabled: false,
      publicationEnabled: false,
    },
  };
}

/**
 * Verifies that a client claim still matches the newly recomputed preview.
 * It never executes or persists anything.
 */
export function verifyMoneyShortsAutomationQueuePreviewClaim({ preview, claim } = {}) {
  if (
    preview?.schemaVersion !== MONEY_SHORTS_AUTOMATION_QUEUE_PLANNER_VERSION ||
    typeof claim !== "object" ||
    claim == null
  ) {
    return { ok: false, reason: "preview_claim_invalid" };
  }
  if (preview.selected == null || preview.previewFingerprint == null) {
    return { ok: false, reason: "preview_has_no_selection" };
  }
  if (
    typeof claim.previewFingerprint !== "string" ||
    !/^[a-f0-9]{64}$/.test(claim.previewFingerprint) ||
    claim.previewFingerprint !== preview.previewFingerprint
  ) {
    return { ok: false, reason: "preview_fingerprint_drifted" };
  }

  const selected = preview.selected;
  if (
    claim.jobId !== selected.jobId ||
    claim.topicId !== selected.topicId ||
    claim.action !== selected.action ||
    claim.planFingerprint !== selected.planFingerprint
  ) {
    return { ok: false, reason: "preview_selection_drifted" };
  }
  return {
    ok: true,
    selection: {
      jobId: selected.jobId,
      topicId: selected.topicId,
      action: selected.action,
      planFingerprint: selected.planFingerprint,
      previewFingerprint: preview.previewFingerprint,
    },
  };
}
