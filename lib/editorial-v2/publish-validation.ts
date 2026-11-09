import type {
  ApprovedRenderIntegrationSessionSnapshot,
  PublishPackage,
  PublishValidationIssue,
  PublishValidationSummary,
  SessionPublicationLedger,
} from "./contracts";
import { validatePublishDestinationIdentity } from "./publish-identity";
import { checkSessionPublishDuplicate, validateSessionPublicationLedger } from "./publish-ledger-session";
import { validatePlatformPublishMetadata } from "./publish-metadata";
import { validatePublishPackageShape } from "./publish-package";

export interface PublishValidationContext {
  readonly approvedRenderIntegration: ApprovedRenderIntegrationSessionSnapshot | null;
  readonly ledger: SessionPublicationLedger;
  readonly rightsResolvedForPlanning: boolean;
  readonly paidPossibleOwnerConfirmation: boolean;
}

function issue(code: string, fieldPath: string, message: string, blocking: boolean): PublishValidationIssue {
  return { code, platformId: null, fieldPath, message, blocking };
}

export function validatePublishIntegration(
  publishPackage: PublishPackage,
  context: PublishValidationContext,
): readonly PublishValidationIssue[] {
  const issues: PublishValidationIssue[] = [...validatePublishPackageShape(publishPackage)];
  if (!context.approvedRenderIntegration) {
    issues.push(issue("approved_render_integration_missing", "approvedRenderIntegration", "승인된 Render Integration snapshot이 없습니다.", true));
  } else {
    if (context.approvedRenderIntegration.renderManifest.manifestHash !== publishPackage.renderManifestHash) issues.push(issue("render_manifest_identity_mismatch", "renderManifestHash", "승인된 Render Manifest hash와 publish package가 다릅니다.", true));
    if (context.approvedRenderIntegration.approvalState !== "approved") issues.push(issue("render_approval_missing", "approvedRenderIntegration.approvalState", "Render Integration session 승인이 필요합니다.", true));
  }
  const supported = new Set(["instagram_reels", "youtube_shorts"]);
  if (publishPackage.platformPackages.length === 0) issues.push(issue("selected_platform_zero", "platformPackages", "선택된 플랫폼이 없습니다.", true));
  for (const platformPackage of publishPackage.platformPackages) {
    if (!supported.has(platformPackage.platformId)) issues.push({ code: "unsupported_publish_platform", platformId: platformPackage.platformId, fieldPath: "platformId", message: "지원하지 않는 플랫폼입니다.", blocking: true });
    issues.push(...validatePublishDestinationIdentity(platformPackage.expectedDestinationIdentity, platformPackage.observedDestinationIdentity));
    issues.push(...validatePlatformPublishMetadata(platformPackage.metadata));
    const duplicate = checkSessionPublishDuplicate(platformPackage.dedupeKey, context.ledger);
    if (duplicate.blocking) issues.push({ code: "session_publish_duplicate_key", platformId: platformPackage.platformId, fieldPath: "dedupeKey", message: `동일 session key가 이미 존재합니다: ${duplicate.matchedAttemptIds.join(", ")}`, blocking: true });
    issues.push({ code: "remote_duplicate_status_unknown", platformId: platformPackage.platformId, fieldPath: "dedupeKey", message: "remote platform duplicate 상태는 확인하지 않았습니다.", blocking: false });
    if (!platformPackage.coverPlan || !platformPackage.coverLogicalUri.startsWith("cover://")) issues.push({ code: "publish_cover_plan_missing", platformId: platformPackage.platformId, fieldPath: "coverPlan", message: "유효한 cover metadata plan이 없습니다.", blocking: true });
    if (!platformPackage.renderLogicalUri.startsWith("render://")) issues.push({ code: "publish_render_logical_uri_invalid", platformId: platformPackage.platformId, fieldPath: "renderLogicalUri", message: "render logical URI가 유효하지 않습니다.", blocking: true });
  }
  const schedule = publishPackage.scheduleIntent;
  const validationNow = Date.parse(schedule.validationNowIso);
  if (!Number.isFinite(validationNow)) issues.push(issue("publish_validation_now_invalid", "scheduleIntent.validationNowIso", "명시적 validationNowIso가 유효하지 않습니다.", true));
  if (schedule.executionIntent === "scheduled_future") {
    const scheduledAt = schedule.scheduledAtIso ? Date.parse(schedule.scheduledAtIso) : Number.NaN;
    if (!Number.isFinite(scheduledAt)) issues.push(issue("publish_schedule_timestamp_invalid", "scheduleIntent.scheduledAtIso", "예약 시간이 유효하지 않습니다.", true));
    if (Number.isFinite(scheduledAt) && Number.isFinite(validationNow) && scheduledAt <= validationNow) issues.push(issue("publish_schedule_in_past", "scheduleIntent.scheduledAtIso", "예약 시간이 validationNow보다 과거입니다.", true));
    if (!schedule.timezone?.trim()) issues.push(issue("publish_schedule_timezone_missing", "scheduleIntent.timezone", "예약 timezone이 필요합니다.", true));
    if (!schedule.scheduleOwnerConfirmation) issues.push(issue("publish_schedule_owner_confirmation_missing", "scheduleIntent.scheduleOwnerConfirmation", "예약 의도에 Owner 확인이 필요합니다.", true));
    if (schedule.schedulerCapabilityRequired !== true) issues.push(issue("publish_scheduler_requirement_hidden", "scheduleIntent.schedulerCapabilityRequired", "예약에는 scheduler capability가 필요합니다.", true));
    issues.push(issue("scheduler_unavailable", "scheduleIntent.schedulerAvailable", "실제 scheduler는 unavailable이며 예약 실행이 아닙니다.", false));
  }
  if (schedule.executionReady !== false || schedule.schedulerAvailable !== false) issues.push(issue("publish_schedule_execution_false_claim", "scheduleIntent", "Schedule intent는 executionReady=false, schedulerAvailable=false여야 합니다.", true));
  if (!context.rightsResolvedForPlanning || publishPackage.rightsSummary.unresolved) issues.push(issue("publish_rights_unresolved", "rightsSummary", "rights planning review가 해결되지 않았습니다.", true));
  if (publishPackage.costSummary.paidPossible && (!context.paidPossibleOwnerConfirmation || !publishPackage.costSummary.ownerConfirmation)) issues.push(issue("publish_paid_possible_owner_confirmation_missing", "costSummary.ownerConfirmation", "비용 가능성이 있는 계획에는 Owner 확인이 필요합니다.", true));
  for (const ledgerIssue of validateSessionPublicationLedger(context.ledger)) issues.push(issue(ledgerIssue, "ledger", `Session ledger 검증 실패: ${ledgerIssue}`, true));
  issues.push(issue("durable_publication_ledger_unavailable", "durableLedgerAvailable", "중복 방지는 session-only이며 durable ledger가 아닙니다.", false));
  issues.push(issue("actual_upload_unavailable", "uploadExecuted", "실제 upload capability가 없습니다.", false));
  issues.push(issue("browser_ui_unverified", "runtimeUi", "브라우저 UI runtime은 아직 검증하지 않았습니다.", false));
  return issues;
}

export function summarizePublishValidation(
  issues: readonly PublishValidationIssue[],
): PublishValidationSummary {
  const cloned = issues.map((entry) => ({ ...entry }));
  const blockingIssueCount = cloned.filter((entry) => entry.blocking).length;
  return {
    valid: blockingIssueCount === 0,
    blockingIssueCount,
    warningCount: cloned.length - blockingIssueCount,
    verificationLevel: "PUBLISH_INTEGRATION_PRECHECK_ONLY",
    executionEligible: false,
    issues: cloned,
  };
}

export function canApprovePublishIntegration(summary: PublishValidationSummary): boolean {
  return summary.valid && summary.blockingIssueCount === 0 && summary.executionEligible === false;
}
