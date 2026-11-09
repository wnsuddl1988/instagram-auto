import {
  closeSync,
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { createHash, randomUUID } from "node:crypto";
import { dirname, join } from "node:path";

import { isMoneyShortsSafeAutoAdvanceAction } from "./money-shorts-resumable-orchestrator.mjs";

export const MONEY_SHORTS_AUTOMATION_EXECUTION_STORE_VERSION = "money_shorts_automation_execution_store_v1";
export const MONEY_SHORTS_AUTOMATION_EXECUTION_ROOT = "C:\\tmp\\money-shorts-os\\automation-execution-v1";
export const MONEY_SHORTS_AUTOMATION_RECOVERY_DECISIONS = [
  "acknowledge_artifacts_advanced",
  "clear_for_manual_retry",
];

function safeTopicSlug(topicId) {
  if (typeof topicId !== "string" || !/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,239}$/.test(topicId)) return null;
  return topicId;
}

function canonicalPlanSnapshot(plan) {
  return {
    schemaVersion: plan?.schemaVersion ?? null,
    topicId: plan?.topicId ?? null,
    status: plan?.status ?? null,
    completedStageCount: plan?.completedStageCount ?? null,
    totalStageCount: plan?.totalStageCount ?? null,
    stages: Array.isArray(plan?.stages)
      ? plan.stages.map((stage) => ({ id: stage.id, state: stage.state }))
      : [],
    next: plan?.next
      ? {
          stageId: plan.next.stageId ?? null,
          action: plan.next.action ?? null,
          gate: plan.next.gate ?? null,
          canAutoAdvance: plan.next.canAutoAdvance === true,
        }
      : null,
  };
}

export function fingerprintMoneyShortsAutomationPlan(plan) {
  return createHash("sha256").update(JSON.stringify(canonicalPlanSnapshot(plan))).digest("hex");
}

function pathsFor(topicId, action, planFingerprint, rootDir) {
  const slug = safeTopicSlug(topicId);
  if (!slug) throw new Error("automation_execution_topic_id_invalid");
  if (!isMoneyShortsSafeAutoAdvanceAction(action)) throw new Error("automation_execution_action_not_safe");
  if (!/^[a-f0-9]{64}$/.test(planFingerprint)) throw new Error("automation_execution_plan_fingerprint_invalid");
  const topicDir = join(rootDir, slug);
  const executionKey = createHash("sha256")
    .update(`${MONEY_SHORTS_AUTOMATION_EXECUTION_STORE_VERSION}\n${slug}\n${action}\n${planFingerprint}`)
    .digest("hex");
  return {
    topicDir,
    lockPath: join(topicDir, "in-flight.lock.json"),
    receiptPath: join(topicDir, "receipts", `${executionKey}.json`),
    executionKey,
  };
}

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return null;
  }
}

function writeJsonAtomic(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  const tempPath = `${path}.${randomUUID()}.tmp`;
  writeFileSync(tempPath, `${JSON.stringify(value, null, 2)}\n`, { encoding: "utf8", flag: "wx" });
  renameSync(tempPath, path);
}

function isManualRetryClearance(receipt) {
  return receipt?.status === "terminal" &&
    receipt?.resultStatus === "recovered_cleared_for_manual_retry" &&
    receipt?.manualRetryAllowed === true;
}

function archiveManualRetryClearance(paths, receipt) {
  const archivePath = join(
    paths.topicDir,
    "recoveries",
    `${paths.executionKey}.${receipt.executionId}.json`,
  );
  const archived = readJson(archivePath);
  if (archived) {
    if (
      archived.executionId !== receipt.executionId ||
      archived.resultStatus !== "recovered_cleared_for_manual_retry"
    ) {
      throw new Error("automation_recovery_archive_mismatch");
    }
  } else {
    writeJsonAtomic(archivePath, receipt);
  }
  rmSync(paths.receiptPath);
  return archivePath;
}

function publicReceipt(receipt) {
  if (!receipt || typeof receipt !== "object") return null;
  return {
    schemaVersion: receipt.schemaVersion ?? null,
    executionId: receipt.executionId ?? null,
    executionKey: receipt.executionKey ?? null,
    topicId: receipt.topicId ?? null,
    action: receipt.action ?? null,
    planFingerprint: receipt.planFingerprint ?? null,
    status: receipt.status ?? null,
    startedAt: receipt.startedAt ?? null,
    finishedAt: receipt.finishedAt ?? null,
    resultStatus: receipt.resultStatus ?? null,
    blockerCode: receipt.blockerCode ?? null,
    planAfterFingerprint: receipt.planAfterFingerprint ?? null,
    planBefore: receipt.planBefore ?? null,
    recoveryDecision: receipt.recoveryDecision ?? null,
    recoveredAt: receipt.recoveredAt ?? null,
    manualRetryAllowed: receipt.manualRetryAllowed === true,
  };
}

/**
 * Acquires a durable per-topic lock and writes the in-progress receipt before execution.
 * Existing in-progress or terminal evidence is never cleared automatically.
 * @param {{topicId: string, action: string, plan: any, rootDir?: string, now?: () => string, executionId?: string}} input
 */
export function beginMoneyShortsAutomationExecution({
  topicId,
  action,
  plan,
  rootDir = MONEY_SHORTS_AUTOMATION_EXECUTION_ROOT,
  now = () => new Date().toISOString(),
  executionId = randomUUID(),
}) {
  const planFingerprint = fingerprintMoneyShortsAutomationPlan(plan);
  const paths = pathsFor(topicId, action, planFingerprint, rootDir);
  const priorReceipt = readJson(paths.receiptPath);
  const retryClearance = isManualRetryClearance(priorReceipt);
  if (priorReceipt && !retryClearance) {
    return {
      ok: false,
      reason: priorReceipt.status === "in_progress"
        ? "automation_execution_previous_attempt_requires_manual_review"
        : "automation_execution_identical_attempt_already_recorded",
      receipt: publicReceipt(priorReceipt),
    };
  }

  mkdirSync(paths.topicDir, { recursive: true });
  const startedAt = now();
  const lockRecord = {
    schemaVersion: MONEY_SHORTS_AUTOMATION_EXECUTION_STORE_VERSION,
    executionId,
    executionKey: paths.executionKey,
    topicId,
    action,
    planFingerprint,
    startedAt,
  };
  let lockFd = null;
  try {
    lockFd = openSync(paths.lockPath, "wx");
    writeFileSync(lockFd, `${JSON.stringify(lockRecord, null, 2)}\n`, "utf8");
    closeSync(lockFd);
    lockFd = null;
  } catch (error) {
    if (lockFd != null) closeSync(lockFd);
    if (error && typeof error === "object" && error.code === "EEXIST") {
      return {
        ok: false,
        reason: "automation_execution_topic_in_flight",
        receipt: publicReceipt(readJson(paths.lockPath)),
      };
    }
    throw error;
  }

  if (retryClearance) {
    try {
      const latestReceipt = readJson(paths.receiptPath);
      if (
        !isManualRetryClearance(latestReceipt) ||
        latestReceipt.executionId !== priorReceipt.executionId
      ) {
        throw new Error("automation_recovery_clearance_changed");
      }
      archiveManualRetryClearance(paths, latestReceipt);
    } catch (error) {
      rmSync(paths.lockPath, { force: true });
      throw error;
    }
  }

  const receipt = {
    ...lockRecord,
    status: "in_progress",
    finishedAt: null,
    resultStatus: null,
    blockerCode: null,
    planAfterFingerprint: null,
    planBefore: canonicalPlanSnapshot(plan),
    recoveryDecision: null,
    recoveredAt: null,
    manualRetryAllowed: false,
  };
  try {
    writeJsonAtomic(paths.receiptPath, receipt);
  } catch (error) {
    rmSync(paths.lockPath, { force: true });
    throw error;
  }

  return {
    ok: true,
    handle: {
      executionId,
      executionKey: paths.executionKey,
      topicId,
      action,
      planFingerprint,
      lockPath: paths.lockPath,
      receiptPath: paths.receiptPath,
      startedAt,
    },
    receipt: publicReceipt(receipt),
  };
}

/**
 * Writes terminal evidence before releasing the topic lock. A write failure keeps the lock.
 * @param {{handle: any, resultStatus: "success" | "blocked" | "error", blockerCode?: string | null, planAfter?: any, now?: () => string}} input
 */
export function finishMoneyShortsAutomationExecution({
  handle,
  resultStatus,
  blockerCode = null,
  planAfter = null,
  now = () => new Date().toISOString(),
}) {
  const activeLock = readJson(handle?.lockPath);
  const inProgress = readJson(handle?.receiptPath);
  if (
    !handle ||
    activeLock?.executionId !== handle.executionId ||
    inProgress?.executionId !== handle.executionId ||
    inProgress?.status !== "in_progress"
  ) {
    throw new Error("automation_execution_handle_or_lock_mismatch");
  }
  if (!["success", "blocked", "error"].includes(resultStatus)) {
    throw new Error("automation_execution_result_status_invalid");
  }

  const receipt = {
    ...inProgress,
    status: "terminal",
    finishedAt: now(),
    resultStatus,
    blockerCode: typeof blockerCode === "string" ? blockerCode : null,
    planAfterFingerprint: planAfter == null ? null : fingerprintMoneyShortsAutomationPlan(planAfter),
  };
  writeJsonAtomic(handle.receiptPath, receipt);
  rmSync(handle.lockPath);
  return publicReceipt(receipt);
}

export function inspectMoneyShortsAutomationExecution({
  topicId,
  action,
  plan,
  rootDir = MONEY_SHORTS_AUTOMATION_EXECUTION_ROOT,
}) {
  const planFingerprint = fingerprintMoneyShortsAutomationPlan(plan);
  return inspectMoneyShortsAutomationExecutionByFingerprint({
    topicId,
    action,
    planFingerprint,
    rootDir,
  });
}

/**
 * Reads execution evidence for an already content-addressed historical claim.
 * This is required after artifacts advance because the current plan object no longer
 * reproduces the old receipt path. It never clears, retries, or mutates evidence.
 */
export function inspectMoneyShortsAutomationExecutionByFingerprint({
  topicId,
  action,
  planFingerprint,
  rootDir = MONEY_SHORTS_AUTOMATION_EXECUTION_ROOT,
}) {
  const paths = pathsFor(topicId, action, planFingerprint, rootDir);
  const receipt = readJson(paths.receiptPath);
  if (receipt) {
    if (isManualRetryClearance(receipt)) {
      return { status: "available", receipt: publicReceipt(receipt) };
    }
    return {
      status: receipt.status === "in_progress" ? "manual_review_required" : "identical_attempt_recorded",
      receipt: publicReceipt(receipt),
    };
  }
  if (existsSync(paths.lockPath)) {
    return { status: "topic_in_flight", receipt: publicReceipt(readJson(paths.lockPath)) };
  }
  return { status: "available", receipt: null };
}

/**
 * Reads a per-topic in-flight lock independently of the current next action.
 * It never expires, unlocks, or retries an attempt.
 */
export function inspectMoneyShortsAutomationRecovery({
  topicId,
  currentPlan,
  rootDir = MONEY_SHORTS_AUTOMATION_EXECUTION_ROOT,
}) {
  const slug = safeTopicSlug(topicId);
  if (!slug) throw new Error("automation_execution_topic_id_invalid");
  const topicDir = join(rootDir, slug);
  const lockPath = join(topicDir, "in-flight.lock.json");
  if (!existsSync(lockPath)) {
    return { status: "none", comparison: "no_in_flight_lock", allowedDecision: null, receipt: null };
  }

  const lock = readJson(lockPath);
  if (
    !lock ||
    lock.topicId !== topicId ||
    !isMoneyShortsSafeAutoAdvanceAction(lock.action) ||
    !/^[a-f0-9]{64}$/.test(lock.planFingerprint ?? "")
  ) {
    return {
      status: "manual_evidence_required",
      comparison: "invalid_lock_evidence",
      allowedDecision: null,
      receipt: publicReceipt(lock),
    };
  }

  const paths = pathsFor(topicId, lock.action, lock.planFingerprint, rootDir);
  const receipt = readJson(paths.receiptPath);
  if (
    !receipt ||
    receipt.status !== "in_progress" ||
    receipt.executionId !== lock.executionId ||
    receipt.executionKey !== lock.executionKey ||
    receipt.planFingerprint !== lock.planFingerprint
  ) {
    return {
      status: "manual_evidence_required",
      comparison: "receipt_lock_mismatch",
      allowedDecision: null,
      receipt: publicReceipt(receipt ?? lock),
    };
  }

  const currentPlanFingerprint = fingerprintMoneyShortsAutomationPlan(currentPlan);
  const beforeCompletedStageCount = Number.isInteger(receipt.planBefore?.completedStageCount)
    ? receipt.planBefore.completedStageCount
    : null;
  const currentCompletedStageCount = Number.isInteger(currentPlan?.completedStageCount)
    ? currentPlan.completedStageCount
    : null;
  let status = "decision_required";
  let comparison = "current_plan_unchanged";
  let allowedDecision = "clear_for_manual_retry";

  if (currentPlanFingerprint !== receipt.planFingerprint) {
    if (
      beforeCompletedStageCount != null &&
      currentCompletedStageCount != null &&
      currentCompletedStageCount > beforeCompletedStageCount
    ) {
      comparison = "artifacts_advanced";
      allowedDecision = "acknowledge_artifacts_advanced";
    } else {
      status = "manual_evidence_required";
      comparison = "ambiguous_plan_change";
      allowedDecision = null;
    }
  }

  return {
    status,
    comparison,
    allowedDecision,
    currentPlanFingerprint,
    beforeCompletedStageCount,
    currentCompletedStageCount,
    receipt: publicReceipt(receipt),
  };
}

/**
 * Resolves only an evidence-matched interrupted attempt. It never runs the action.
 * Terminal evidence is written before the topic lock is released.
 */
export function resolveMoneyShortsAutomationRecovery({
  topicId,
  currentPlan,
  decision,
  expectedExecutionId,
  expectedCurrentPlanFingerprint,
  rootDir = MONEY_SHORTS_AUTOMATION_EXECUTION_ROOT,
  now = () => new Date().toISOString(),
}) {
  if (!MONEY_SHORTS_AUTOMATION_RECOVERY_DECISIONS.includes(decision)) {
    throw new Error("automation_recovery_decision_invalid");
  }
  const recovery = inspectMoneyShortsAutomationRecovery({ topicId, currentPlan, rootDir });
  if (
    recovery.status !== "decision_required" ||
    recovery.allowedDecision !== decision ||
    recovery.receipt?.executionId !== expectedExecutionId ||
    recovery.currentPlanFingerprint !== expectedCurrentPlanFingerprint
  ) {
    throw new Error("automation_recovery_evidence_or_decision_mismatch");
  }

  const paths = pathsFor(
    topicId,
    recovery.receipt.action,
    recovery.receipt.planFingerprint,
    rootDir,
  );
  const activeLock = readJson(paths.lockPath);
  const inProgress = readJson(paths.receiptPath);
  if (
    activeLock?.executionId !== expectedExecutionId ||
    inProgress?.executionId !== expectedExecutionId ||
    inProgress?.status !== "in_progress"
  ) {
    throw new Error("automation_recovery_lock_changed");
  }

  const recoveredAt = now();
  const receipt = {
    ...inProgress,
    status: "terminal",
    finishedAt: recoveredAt,
    resultStatus: decision === "acknowledge_artifacts_advanced"
      ? "recovered_artifacts_advanced_acknowledged"
      : "recovered_cleared_for_manual_retry",
    blockerCode: decision === "acknowledge_artifacts_advanced"
      ? "AUTOMATION_INTERRUPTED_ARTIFACTS_ADVANCED_ACKNOWLEDGED"
      : "AUTOMATION_INTERRUPTED_NO_ARTIFACT_ADVANCE_CLEARED",
    planAfterFingerprint: recovery.currentPlanFingerprint,
    recoveryDecision: decision,
    recoveredAt,
    manualRetryAllowed: decision === "clear_for_manual_retry",
  };
  writeJsonAtomic(paths.receiptPath, receipt);
  rmSync(paths.lockPath);
  return {
    receipt: publicReceipt(receipt),
    comparison: recovery.comparison,
    actionExecuted: false,
    automaticRetryExecuted: false,
  };
}
