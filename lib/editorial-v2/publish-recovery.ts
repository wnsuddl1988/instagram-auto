import type {
  PlatformPublicationState,
  PublishPackage,
  PublishRecoveryPlan,
  PublishRecoveryReason,
  SessionPublicationLedger,
} from "./contracts";
import { clonePublishPackage } from "./publish-package";

export function comparePlatformPublicationStates(
  previous: PlatformPublicationState,
  next: PlatformPublicationState,
): readonly PublishRecoveryReason[] {
  const reasons: PublishRecoveryReason[] = [];
  if (previous.dedupeKey !== next.dedupeKey) reasons.push("package_changed");
  if (next.failed) reasons.push("platform_dry_run_failed");
  if (next.blocked) reasons.push("identity_mismatch");
  if (next.failed && !next.retryable) reasons.push("non_retryable_failure");
  return reasons;
}

export function canRetryPlatformPublication(state: PlatformPublicationState): boolean {
  return state.failed && state.retryable && !state.successful && !state.blocked;
}

export function buildPublishRecoveryPlan(
  publishPackage: PublishPackage,
  ledger: SessionPublicationLedger,
): PublishRecoveryPlan {
  const packagePlatforms = new Set(publishPackage.platformPackages.map((entry) => entry.platformId));
  const relevantStates = ledger.platformStates.filter((state) => packagePlatforms.has(state.platformId));
  const successfulPlatformIds = relevantStates.filter((state) => state.successful).map((state) => state.platformId);
  const failedPlatformIds = relevantStates.filter((state) => state.failed).map((state) => state.platformId);
  const retryablePlatformIds = relevantStates.filter(canRetryPlatformPublication).map((state) => state.platformId);
  const blockedPlatformIds = relevantStates.filter((state) => state.blocked || (state.failed && !state.retryable)).map((state) => state.platformId);
  const unchangedSuccessfulAttemptIds = relevantStates
    .filter((state) => state.successful && state.latestAttemptId)
    .map((state) => state.latestAttemptId)
    .filter((attemptId): attemptId is string => attemptId !== null);
  const requiredPlanChanges: string[] = [];
  for (const state of relevantStates) {
    if (state.blocked) requiredPlanChanges.push(`${state.platformId}:destination_identity_or_package_change_required`);
    if (state.failed && !state.retryable) requiredPlanChanges.push(`${state.platformId}:non_retryable_failure_review_required`);
  }
  const schedule = publishPackage.scheduleIntent;
  if (schedule.executionIntent === "scheduled_future" && schedule.scheduledAtIso && Number.isFinite(Date.parse(schedule.validationNowIso)) && Number.isFinite(Date.parse(schedule.scheduledAtIso)) && Date.parse(schedule.scheduledAtIso) <= Date.parse(schedule.validationNowIso)) {
    requiredPlanChanges.push("schedule_expired:new_schedule_required");
  }
  const globalBlockingReasons = publishPackage.platformPackages.length === 0 ? ["publish_platform_missing"] : [];
  const nextAllowedActions = publishPackage.platformPackages.map((entry) => {
    const state = relevantStates.find((candidate) => candidate.platformId === entry.platformId) ?? null;
    if (state?.successful) return { platformId: entry.platformId, action: "preserve_success" as const, reasons: [] as readonly PublishRecoveryReason[], attemptIds: state.latestAttemptId ? [state.latestAttemptId] : [], actualRetryExecuted: false as const };
    if (state && canRetryPlatformPublication(state)) return { platformId: entry.platformId, action: "retry_failed_dry_run" as const, reasons: ["platform_dry_run_failed"] as readonly PublishRecoveryReason[], attemptIds: state.latestAttemptId ? [state.latestAttemptId] : [], actualRetryExecuted: false as const };
    if (state?.blocked || (state?.failed && !state.retryable)) return { platformId: entry.platformId, action: "change_plan_required" as const, reasons: [state.blocked ? "identity_mismatch" : "non_retryable_failure"] as readonly PublishRecoveryReason[], attemptIds: state.latestAttemptId ? [state.latestAttemptId] : [], actualRetryExecuted: false as const };
    return { platformId: entry.platformId, action: "no_action" as const, reasons: [] as readonly PublishRecoveryReason[], attemptIds: [], actualRetryExecuted: false as const };
  });
  return {
    planVersion: "publish-recovery-plan-v1",
    successfulPlatformIds,
    failedPlatformIds,
    retryablePlatformIds,
    blockedPlatformIds,
    unchangedSuccessfulAttemptIds,
    requiredPlanChanges,
    globalBlockingReasons,
    nextAllowedActions,
    actualRetryExecuted: false,
  };
}

export function buildFailedPlatformRetryPackage(
  publishPackage: PublishPackage,
  recoveryPlan: PublishRecoveryPlan,
): PublishPackage {
  const allowed = new Set(recoveryPlan.retryablePlatformIds);
  const cloned = clonePublishPackage(publishPackage);
  const platformPackages = cloned.platformPackages.filter((entry) => allowed.has(entry.platformId));
  return {
    ...cloned,
    packageId: `${cloned.packageId}:retry:${platformPackages.map((entry) => entry.platformId).join(",") || "none"}`,
    platformPackages,
  };
}
