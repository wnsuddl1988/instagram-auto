import type {
  PublishExpectedDestinationIdentity,
  PublishIdentityComparison,
  PublishObservedDestinationIdentity,
  PublishValidationIssue,
} from "./contracts";

export interface PublishIdentityValidationSummary {
  readonly valid: boolean;
  readonly blockingIssueCount: number;
  readonly warningCount: number;
  readonly identityExecutionVerified: false;
  readonly issues: readonly PublishValidationIssue[];
}

type PublishDestinationIdentity = PublishExpectedDestinationIdentity | PublishObservedDestinationIdentity;

export function normalizePublishDestinationIdentity<TIdentity extends PublishDestinationIdentity>(
  identity: TIdentity,
): TIdentity {
  return {
    ...identity,
    stableDestinationId: identity.stableDestinationId.trim(),
    displayLabel: identity.displayLabel.trim(),
  };
}

export function comparePublishDestinationIdentity(
  expected: PublishExpectedDestinationIdentity,
  observed: PublishObservedDestinationIdentity,
): PublishIdentityComparison {
  const normalizedExpected = normalizePublishDestinationIdentity(expected);
  const normalizedObserved = normalizePublishDestinationIdentity(observed);
  const platformMatches = normalizedExpected.platformId === normalizedObserved.platformId;
  const stableDestinationIdMatches = normalizedExpected.stableDestinationId.length > 0
    && normalizedObserved.stableDestinationId.length > 0
    && normalizedExpected.stableDestinationId === normalizedObserved.stableDestinationId;
  const blockingReasons: string[] = [];
  if (!normalizedExpected.stableDestinationId) blockingReasons.push("expected_destination_id_missing");
  if (!normalizedObserved.stableDestinationId) blockingReasons.push("observed_destination_id_missing");
  if (!platformMatches) blockingReasons.push("destination_platform_mismatch");
  if (normalizedExpected.stableDestinationId && normalizedObserved.stableDestinationId && !stableDestinationIdMatches) {
    blockingReasons.push("wrong_account_destination_mismatch");
  }
  if (!normalizedExpected.ownerConfirmation) blockingReasons.push("owner_account_confirmation_missing");
  return {
    platformId: normalizedExpected.platformId,
    expectedStableDestinationId: normalizedExpected.stableDestinationId,
    observedStableDestinationId: normalizedObserved.stableDestinationId,
    platformMatches,
    stableDestinationIdMatches,
    ownerConfirmed: normalizedExpected.ownerConfirmation,
    matchesForPlanning: blockingReasons.length === 0,
    identityExecutionVerified: false,
    blockingReasons,
  };
}

export function validatePublishDestinationIdentity(
  expected: PublishExpectedDestinationIdentity,
  observed: PublishObservedDestinationIdentity,
): readonly PublishValidationIssue[] {
  const comparison = comparePublishDestinationIdentity(expected, observed);
  const issues: PublishValidationIssue[] = comparison.blockingReasons.map((code) => ({
    code,
    platformId: expected.platformId,
    fieldPath: code.includes("observed") ? "observedDestinationIdentity" : "expectedDestinationIdentity",
    message: code === "wrong_account_destination_mismatch"
      ? "기대 목적지와 수동 관찰 목적지가 달라 게시 계획 승인을 차단했습니다."
      : `목적지 identity gate 실패: ${code}`,
    blocking: true,
  }));
  if (observed.observationLevel !== "manual_unverified") {
    issues.push({
      code: "external_identity_observation_not_available_in_slice7",
      platformId: expected.platformId,
      fieldPath: "observedDestinationIdentity.observationLevel",
      message: "Slice 7에서는 manual_unverified 관찰만 사용할 수 있습니다.",
      blocking: true,
    });
  }
  issues.push({
    code: "manual_identity_observation_only",
    platformId: expected.platformId,
    fieldPath: "observedDestinationIdentity.observationLevel",
    message: "수동 관찰 정보이며 실제 외부 계정 검증이 아닙니다.",
    blocking: false,
  });
  issues.push({
    code: "external_identity_verification_missing",
    platformId: expected.platformId,
    fieldPath: "identityExecutionVerified",
    message: "실제 게시 전 read-only 외부 계정 검증이 필요합니다.",
    blocking: false,
  });
  return issues;
}

export function summarizeIdentityValidation(
  issues: readonly PublishValidationIssue[],
): PublishIdentityValidationSummary {
  const clonedIssues = issues.map((issue) => ({ ...issue }));
  const blockingIssueCount = clonedIssues.filter((issue) => issue.blocking).length;
  return {
    valid: blockingIssueCount === 0,
    blockingIssueCount,
    warningCount: clonedIssues.length - blockingIssueCount,
    identityExecutionVerified: false,
    issues: clonedIssues,
  };
}
