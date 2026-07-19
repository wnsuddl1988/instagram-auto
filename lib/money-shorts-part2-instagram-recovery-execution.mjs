import { createHash, randomUUID } from "node:crypto";
import { isAbsolute, join, resolve } from "node:path";

import {
  acquireMoneyShortsYoutubeOnlyRecoveryLock,
  releaseMoneyShortsYoutubeOnlyRecoveryLock,
  writeMoneyShortsYoutubeOnlyRecoveryEvidenceOnce,
} from "./money-shorts-youtube-only-recovery.mjs";

export const MONEY_SHORTS_PART2_INSTAGRAM_RECOVERY_EXECUTION_VERSION =
  "money_shorts_part2_instagram_recovery_execution_v1";
export const MONEY_SHORTS_PART2_INSTAGRAM_RECOVERY_EXECUTION_APPROVAL =
  "APPROVE_PART2_INSTAGRAM_RECOVERY_EXECUTION_V1";
export const MONEY_SHORTS_PART2_INSTAGRAM_RECOVERY_EXECUTION_DIRNAME =
  "part2-instagram-recovery-execution-v1";
export const MONEY_SHORTS_PART2_INSTAGRAM_RECOVERY_EXECUTION_PREFLIGHT_FILENAME =
  "part2-instagram-recovery-execution-preflight.json";
export const MONEY_SHORTS_PART2_INSTAGRAM_RECOVERY_EXECUTION_CLAIM_FILENAME =
  "claim.json";
export const MONEY_SHORTS_PART2_INSTAGRAM_RECOVERY_EXECUTION_RESULT_FILENAME =
  "result.json";
export const MONEY_SHORTS_PART2_INSTAGRAM_RECOVERY_EXECUTION_TRANSITIONS =
  Object.freeze([
    "external_execution_ready",
    "instagram_identity_verify_intent",
    "instagram_identity_verify_confirmed",
    "instagram_reconciliation_intent",
    "instagram_reconciliation_confirmed_no_match",
    "blob_head_intent",
    "blob_head_confirmed",
    "instagram_container_intent",
    "instagram_container_confirmed",
    "instagram_poll_intent",
    "instagram_poll_observed",
    "instagram_container_ready",
    "instagram_reconciliation_before_publish_intent",
    "instagram_reconciliation_before_publish_confirmed_no_match",
    "instagram_publish_intent",
    "instagram_publish_confirmed",
    "instagram_media_verify_intent",
    "instagram_media_verify_confirmed",
    "ledger_write_intent",
    "ledger_write_confirmed",
    "complete",
  ]);

const SHA256_RE = /^[a-f0-9]{64}$/;
const CONTENT_ID_RE = /^[A-Za-z0-9._:-]{1,240}-part-2$/;
const PUBLIC_ID_RE = /^[A-Za-z0-9._:-]{1,240}$/;
const INSTAGRAM_ACCOUNT_ID_RE = /^[1-9][0-9]{5,31}$/;
const INSTAGRAM_PUBLIC_ID_RE = /^[1-9][0-9]{5,39}$/;
const YOUTUBE_CHANNEL_ID_RE = /^UC[A-Za-z0-9_-]{22}$/;
const BLOCKER_CODE_RE = /^[A-Z0-9_]{3,180}$/;
const BLOB_PATHNAME_RE =
  /^[A-Za-z0-9][A-Za-z0-9._/-]{0,1023}$/;

const COUNTER_NAMES = Object.freeze([
  "identityCount",
  // One count means one bounded logical full scan, including every page
  // needed to prove coverage. It is not a per-page transport counter.
  "mediaListCount",
  "blobHeadCount",
  "containerCreateCount",
  "statusPollCount",
  "mediaPublishCount",
  "mediaVerifyCount",
  "ledgerWriteCount",
  "credentialReadCount",
  "evidenceWriteCount",
  "blobPutCount",
  "youtubeActionCount",
  "part1ActionCount",
  "databaseMutationCount",
  "credentialValuePrintCount",
  "automaticRetryCount",
]);

const FORBIDDEN_COUNTER_NAMES = Object.freeze([
  "blobPutCount",
  "youtubeActionCount",
  "part1ActionCount",
  "databaseMutationCount",
  "credentialValuePrintCount",
  "automaticRetryCount",
]);

const RESULT_STATUSES = new Set([
  "FAILED_BEFORE_RECOVERY_MUTATION",
  "INSTAGRAM_CONTAINER_OUTCOME_UNKNOWN",
  "INSTAGRAM_CONTAINER_CREATED_NOT_PUBLISHED",
  "INSTAGRAM_PUBLISH_OUTCOME_UNKNOWN",
  "INSTAGRAM_PUBLISHED_LEDGER_MISSING",
  "INSTAGRAM_PUBLISHED_LEDGER_COMMIT_OUTCOME_UNKNOWN",
  "INSTAGRAM_AND_LEDGER_CONFIRMED_RECOVERY_EVIDENCE_INCOMPLETE",
  "PART2_INSTAGRAM_RECOVERY_OK",
]);

const RESULT_ALLOWED_LATEST_TRANSITIONS =
  Object.freeze({
    FAILED_BEFORE_RECOVERY_MUTATION: Object.freeze([
      "external_execution_ready",
      "instagram_identity_verify_intent",
      "instagram_identity_verify_confirmed",
      "instagram_reconciliation_intent",
      "instagram_reconciliation_confirmed_no_match",
      "blob_head_intent",
      "blob_head_confirmed",
    ]),
    INSTAGRAM_CONTAINER_OUTCOME_UNKNOWN:
      Object.freeze([
        "instagram_container_intent",
      ]),
    INSTAGRAM_CONTAINER_CREATED_NOT_PUBLISHED:
      Object.freeze([
        "instagram_container_intent",
        "instagram_container_confirmed",
        "instagram_poll_intent",
        "instagram_poll_observed",
        "instagram_container_ready",
        "instagram_reconciliation_before_publish_intent",
        "instagram_reconciliation_before_publish_confirmed_no_match",
      ]),
    INSTAGRAM_PUBLISH_OUTCOME_UNKNOWN:
      Object.freeze([
        "instagram_publish_intent",
      ]),
    INSTAGRAM_PUBLISHED_LEDGER_MISSING:
      Object.freeze([
        "instagram_publish_intent",
        "instagram_publish_confirmed",
        "instagram_media_verify_intent",
        "instagram_media_verify_confirmed",
        "ledger_write_intent",
      ]),
    INSTAGRAM_PUBLISHED_LEDGER_COMMIT_OUTCOME_UNKNOWN:
      Object.freeze([
        "ledger_write_intent",
      ]),
    INSTAGRAM_AND_LEDGER_CONFIRMED_RECOVERY_EVIDENCE_INCOMPLETE:
      Object.freeze([
        "ledger_write_intent",
        "ledger_write_confirmed",
      ]),
    PART2_INSTAGRAM_RECOVERY_OK: Object.freeze([
      "complete",
    ]),
  });

const PLAN_KEYS = Object.freeze([
  "schemaVersion",
  "mode",
  "status",
  "reviewPreflightFingerprint",
  "reviewPlanFingerprint",
  "sourceEvidenceBundleFingerprint",
  "recoveryOutDir",
  "currentBinding",
  "expectedInstagramAccountId",
  "expectedYoutubeChannelId",
  "blob",
  "captionSha256",
  "shareToFeed",
  "ledger",
  "executionBoundary",
  "safety",
  "planFingerprint",
]);

const CURRENT_BINDING_KEYS = Object.freeze([
  "contentId",
  "version",
  "productionPartId",
  "contentUnitManifestPath",
  "contentUnitSha256",
  "instagramSourceSha256",
  "youtubeSourceSha256",
  "publishMetadataSha256",
  "finalVideoApprovalFingerprint",
]);

const PLAN_SAFETY = Object.freeze({
  automaticRetryAllowed: false,
  blobPutAllowed: false,
  youtubeActionAllowed: false,
  part1ActionAllowed: false,
  databaseMutationAllowed: false,
  secretPrintAllowed: false,
  containerCreateMaximum: 1,
  mediaPublishMaximum: 1,
  ledgerWriteMaximum: 1,
});

const EXECUTION_BOUNDARY = Object.freeze({
  platform: "instagram_reels",
  separateRecoveryEvidenceRequired: true,
  freshReconciliationRequiredBeforeContainer: true,
  freshReconciliationRequiredBeforePublish: true,
  existingBlobHeadOnly: true,
  orphanContainerRisk:
    "UNKNOWN_PRIOR_CONTAINER_MAY_EXIST",
});

const RESULT_SAFETY = Object.freeze({
  automaticRetryAllowed: false,
  externalRecoveryEnabled: false,
  retryRequiresNewOwnerApproval: true,
  blobPutAllowed: false,
  youtubeActionAllowed: false,
  part1ActionAllowed: false,
  databaseMutationAllowed: false,
  secretPrintAllowed: false,
});

function isPlainObject(value) {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function hasExactKeys(value, keys) {
  if (!isPlainObject(value)) return false;
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return (
    actual.length === expected.length &&
    actual.every((key, index) => key === expected[index])
  );
}

function strictString(value) {
  return typeof value === "string" ? value : "";
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function serializedEvidenceSha256(evidence) {
  return sha256(`${JSON.stringify(evidence, null, 2)}\n`);
}

function validIso(value) {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    Number.isFinite(Date.parse(value))
  );
}

function fingerprinted(stable, field) {
  return {
    ...stable,
    [field]: sha256(JSON.stringify(stable)),
  };
}

function validFingerprint(value, field) {
  if (
    !isPlainObject(value) ||
    !SHA256_RE.test(strictString(value[field]))
  ) {
    return false;
  }
  const { [field]: actual, ...stable } = value;
  return actual === sha256(JSON.stringify(stable));
}

function exactRecord(value, expected) {
  return (
    hasExactKeys(value, Object.keys(expected)) &&
    Object.entries(expected).every(
      ([key, expectedValue]) =>
        JSON.stringify(value[key]) ===
        JSON.stringify(expectedValue),
    )
  );
}

function validBlobPathname(value) {
  return (
    BLOB_PATHNAME_RE.test(strictString(value)) &&
    !value.startsWith("/") &&
    !value.includes("\\") &&
    !value.split("/").includes("..")
  );
}

function validInstagramReelPermalink(value) {
  if (typeof value !== "string") return false;
  try {
    const parsed = new URL(value);
    const segments = parsed.pathname
      .split("/")
      .filter(Boolean);
    return (
      parsed.protocol === "https:" &&
      parsed.hostname === "www.instagram.com" &&
      parsed.username === "" &&
      parsed.password === "" &&
      parsed.port === "" &&
      parsed.search === "" &&
      parsed.hash === "" &&
      segments.length === 2 &&
      segments[0] === "reel" &&
      /^[A-Za-z0-9_-]{5,80}$/.test(segments[1]) &&
      value ===
        `https://www.instagram.com/reel/${segments[1]}/`
    );
  } catch {
    return false;
  }
}

function validCurrentBinding(value) {
  return (
    hasExactKeys(value, CURRENT_BINDING_KEYS) &&
    CONTENT_ID_RE.test(strictString(value.contentId)) &&
    strictString(value.version).length > 0 &&
    value.productionPartId === "part-2" &&
    strictString(value.contentUnitManifestPath).length > 0 &&
    SHA256_RE.test(strictString(value.contentUnitSha256)) &&
    SHA256_RE.test(
      strictString(value.instagramSourceSha256),
    ) &&
    SHA256_RE.test(
      strictString(value.youtubeSourceSha256),
    ) &&
    SHA256_RE.test(
      strictString(value.publishMetadataSha256),
    ) &&
    SHA256_RE.test(
      strictString(value.finalVideoApprovalFingerprint),
    )
  );
}

function canonicalCounters(value) {
  if (
    !hasExactKeys(value, COUNTER_NAMES) ||
    !COUNTER_NAMES.every(
      (name) =>
        Number.isSafeInteger(value[name]) &&
        value[name] >= 0,
    ) ||
    !FORBIDDEN_COUNTER_NAMES.every(
      (name) => value[name] === 0,
    ) ||
    value.containerCreateCount > 1 ||
    value.mediaPublishCount > 1 ||
    value.mediaVerifyCount > 1 ||
    value.ledgerWriteCount > 1 ||
    value.blobHeadCount > 1 ||
    value.identityCount > 1 ||
    value.mediaListCount > 2 ||
    value.statusPollCount > 24 ||
    value.credentialReadCount > 2
  ) {
    return null;
  }
  return Object.fromEntries(
    COUNTER_NAMES.map((name) => [name, value[name]]),
  );
}

export function zeroMoneyShortsPart2InstagramRecoveryExecutionCounters() {
  return Object.fromEntries(
    COUNTER_NAMES.map((name) => [name, 0]),
  );
}

function validPlan(value) {
  return (
    hasExactKeys(value, PLAN_KEYS) &&
    validFingerprint(value, "planFingerprint") &&
    value.schemaVersion ===
      MONEY_SHORTS_PART2_INSTAGRAM_RECOVERY_EXECUTION_VERSION &&
    value.mode === "part2_instagram_recovery_execution" &&
    value.status === "RECOVERY_EXECUTION_PLAN_OK" &&
    SHA256_RE.test(
      strictString(value.reviewPreflightFingerprint),
    ) &&
    SHA256_RE.test(
      strictString(value.reviewPlanFingerprint),
    ) &&
    SHA256_RE.test(
      strictString(value.sourceEvidenceBundleFingerprint),
    ) &&
    typeof value.recoveryOutDir === "string" &&
    isAbsolute(value.recoveryOutDir) &&
    value.recoveryOutDir === resolve(value.recoveryOutDir) &&
    validCurrentBinding(value.currentBinding) &&
    INSTAGRAM_ACCOUNT_ID_RE.test(
      strictString(value.expectedInstagramAccountId),
    ) &&
    YOUTUBE_CHANNEL_ID_RE.test(
      strictString(value.expectedYoutubeChannelId),
    ) &&
    hasExactKeys(value.blob, [
      "urlSha256",
      "pathname",
    ]) &&
    SHA256_RE.test(strictString(value.blob.urlSha256)) &&
    validBlobPathname(value.blob.pathname) &&
    SHA256_RE.test(strictString(value.captionSha256)) &&
    typeof value.shareToFeed === "boolean" &&
    hasExactKeys(value.ledger, ["baselineSha256"]) &&
    SHA256_RE.test(
      strictString(value.ledger.baselineSha256),
    ) &&
    exactRecord(value.executionBoundary, EXECUTION_BOUNDARY) &&
    exactRecord(value.safety, PLAN_SAFETY)
  );
}

export function validateMoneyShortsPart2InstagramRecoveryExecutionPlan(
  plan,
) {
  const valid = validPlan(plan);
  return {
    valid,
    reason: valid
      ? "part2_instagram_recovery_execution_plan_valid"
      : "part2_instagram_recovery_execution_plan_invalid",
  };
}

export function validateMoneyShortsPart2InstagramRecoveryExecutionAuthorization(
  authorization,
) {
  if (
    !hasExactKeys(authorization, [
      "armed",
      "approval",
      "expectedReviewPreflightFingerprint",
      "expectedExecutionPreflightFingerprint",
    ])
  ) {
    return {
      ok: false,
      reason:
        "PART2_INSTAGRAM_RECOVERY_EXECUTION_AUTHORIZATION_SHAPE_INVALID",
    };
  }
  if (
    authorization.approval !==
    MONEY_SHORTS_PART2_INSTAGRAM_RECOVERY_EXECUTION_APPROVAL
  ) {
    return {
      ok: false,
      reason:
        "PART2_INSTAGRAM_RECOVERY_EXECUTION_EXACT_APPROVAL_REQUIRED",
    };
  }
  if (
    typeof authorization.armed !== "boolean" ||
    !SHA256_RE.test(
      strictString(
        authorization.expectedReviewPreflightFingerprint,
      ),
    )
  ) {
    return {
      ok: false,
      reason:
        "PART2_INSTAGRAM_RECOVERY_EXECUTION_EXPECTED_BINDING_INVALID",
    };
  }
  if (
    authorization.armed === true &&
    !SHA256_RE.test(
      strictString(
        authorization.expectedExecutionPreflightFingerprint,
      ),
    )
  ) {
    return {
      ok: false,
      reason:
        "PART2_INSTAGRAM_RECOVERY_EXECUTION_EXPECTED_PREFLIGHT_REQUIRED",
    };
  }
  if (
    authorization.armed === false &&
    authorization.expectedExecutionPreflightFingerprint !==
      null
  ) {
    return {
      ok: false,
      reason:
        "PART2_INSTAGRAM_RECOVERY_EXECUTION_DRY_RUN_PREFLIGHT_MUST_BE_NULL",
    };
  }
  return {
    ok: true,
    armed: authorization.armed,
    approval:
      MONEY_SHORTS_PART2_INSTAGRAM_RECOVERY_EXECUTION_APPROVAL,
    expectedReviewPreflightFingerprint:
      authorization.expectedReviewPreflightFingerprint,
    expectedExecutionPreflightFingerprint:
      authorization.armed
        ? authorization.expectedExecutionPreflightFingerprint
        : null,
    orphanContainerRiskAcknowledgedByExactApproval:
      authorization.armed,
  };
}

function validReviewPreflightForPlan({
  reviewPreflight,
  expectedReviewPreflightFingerprint,
  currentBinding,
  expectedInstagramAccountId,
  expectedYoutubeChannelId,
  blobPathname,
  blobUrlSha256,
  ledgerBaselineSha256,
}) {
  return (
    validFingerprint(
      reviewPreflight,
      "preflightFingerprint",
    ) &&
    reviewPreflight.schemaVersion ===
      "money_shorts_part2_instagram_recovery_preflight_v1" &&
    reviewPreflight.evidenceType === "preflight" &&
    reviewPreflight.status === "LOCAL_RECOVERY_REVIEW_OK" &&
    reviewPreflight.armed === false &&
    reviewPreflight.executionAuthorized === false &&
    reviewPreflight.readyForActualExecution === false &&
    reviewPreflight.ownerApprovalRequired === true &&
    reviewPreflight.safeToRetry === false &&
    reviewPreflight.safeToPublish === false &&
    reviewPreflight.preflightFingerprint ===
      expectedReviewPreflightFingerprint &&
    SHA256_RE.test(
      strictString(reviewPreflight.recoveryPlanFingerprint),
    ) &&
    SHA256_RE.test(
      strictString(
        reviewPreflight.sourceEvidenceBundleFingerprint,
      ),
    ) &&
    reviewPreflight.plan?.recoveryPlanFingerprint ===
      reviewPreflight.recoveryPlanFingerprint &&
    reviewPreflight.plan?.sourceEvidenceBundleFingerprint ===
      reviewPreflight.sourceEvidenceBundleFingerprint &&
    reviewPreflight.plan?.status ===
      "LOCAL_RECOVERY_REVIEW_OK" &&
    reviewPreflight.plan?.mode === "code_only_dry_run" &&
    reviewPreflight.plan?.armed === false &&
    reviewPreflight.plan?.readyForActualExecution === false &&
    reviewPreflight.plan?.ownerApprovalRequired === true &&
    reviewPreflight.plan?.safeToRetry === false &&
    reviewPreflight.plan?.safeToPublish === false &&
    reviewPreflight.plan?.currentRecoveryClassification
      ?.state === "ambiguous" &&
    reviewPreflight.plan?.currentRecoveryClassification
      ?.reason === "instagram_publish_outcome_unknown" &&
    reviewPreflight.plan?.currentRecoveryClassification
      ?.recoverablePlatformCandidate === null &&
    reviewPreflight.plan?.currentRecoveryClassification
      ?.automaticRetryAllowed === false &&
    reviewPreflight.plan?.currentRecoveryClassification
      ?.externalRecoveryEnabled === false &&
    reviewPreflight.plan?.observedBoundary
      ?.containerCreateAttempted === true &&
    reviewPreflight.plan?.observedBoundary
      ?.containerOutcome === "unknown" &&
    reviewPreflight.plan?.observedBoundary
      ?.containerConfirmedObserved === false &&
    reviewPreflight.plan?.observedBoundary
      ?.publishIntentObserved === false &&
    reviewPreflight.plan?.observedBoundary
      ?.instagramMediaId === null &&
    reviewPreflight.plan?.observedBoundary
      ?.youtubeVideoId === null &&
    reviewPreflight.plan?.duplicateSafety
      ?.localLedgerClean === true &&
    reviewPreflight.plan?.duplicateSafety
      ?.externalInstagramPublicationState === "unknown" &&
    reviewPreflight.plan?.duplicateSafety
      ?.freshExternalReconciliationPerformed === false &&
    reviewPreflight.plan?.duplicateSafety
      ?.safeToRepublish === false &&
    reviewPreflight.plan?.priorAuthorization?.consumed ===
      true &&
    reviewPreflight.plan?.priorAuthorization?.reusable ===
      false &&
    reviewPreflight.plan?.priorAuthorization
      ?.authorizesRetry === false &&
    reviewPreflight.plan?.priorAuthorization
      ?.authorizesRecoveryExecution === false &&
    JSON.stringify(reviewPreflight.plan?.pendingGates) ===
      JSON.stringify([
        "live_instagram_reconciliation",
        "new_owner_mutation_approval",
        "actual_runner_implemented_and_validated",
      ]) &&
    reviewPreflight.plan?.futureExecutionBoundary
      ?.recoveryRunnerImplemented === false &&
    reviewPreflight.plan?.futureExecutionBoundary
      ?.executionAuthorized === false &&
    reviewPreflight.plan?.futureExecutionBoundary
      ?.separateRecoveryOutDirRequired === true &&
    reviewPreflight.plan?.futureExecutionBoundary
      ?.blobPutAllowed === false &&
    reviewPreflight.plan?.futureExecutionBoundary
      ?.instagramContainerCreateAllowed === false &&
    reviewPreflight.plan?.futureExecutionBoundary
      ?.instagramPublishAllowed === false &&
    reviewPreflight.plan?.futureExecutionBoundary
      ?.youtubeInsertAllowed === false &&
    reviewPreflight.plan?.futureExecutionBoundary
      ?.ledgerWriteAllowed === false &&
    reviewPreflight.plan?.futureExecutionBoundary
      ?.part1ActionAllowed === false &&
    reviewPreflight.plan?.futureExecutionBoundary
      ?.automaticRetryCount === 0 &&
    JSON.stringify(reviewPreflight.plan?.currentBinding) ===
      JSON.stringify(currentBinding) &&
    reviewPreflight.plan?.expectedInstagramAccountId ===
      expectedInstagramAccountId &&
    reviewPreflight.plan?.expectedYoutubeChannelId ===
      expectedYoutubeChannelId &&
    reviewPreflight.plan?.blob?.pathname === blobPathname &&
    reviewPreflight.plan?.blob?.urlSha256 === blobUrlSha256 &&
    reviewPreflight.plan?.ledger?.sha256 ===
      ledgerBaselineSha256
  );
}

export function buildMoneyShortsPart2InstagramRecoveryExecutionPlan({
  reviewPreflight,
  expectedReviewPreflightFingerprint,
  recoveryOutDir,
  currentBinding,
  expectedInstagramAccountId,
  expectedYoutubeChannelId,
  blobPathname,
  blobUrlSha256,
  captionSha256,
  shareToFeed,
  ledgerBaselineSha256,
}) {
  if (
    typeof recoveryOutDir !== "string" ||
    !isAbsolute(recoveryOutDir) ||
    !validCurrentBinding(currentBinding) ||
    !INSTAGRAM_ACCOUNT_ID_RE.test(
      strictString(expectedInstagramAccountId),
    ) ||
    !YOUTUBE_CHANNEL_ID_RE.test(
      strictString(expectedYoutubeChannelId),
    ) ||
    !SHA256_RE.test(strictString(blobUrlSha256)) ||
    !validBlobPathname(blobPathname) ||
    !SHA256_RE.test(strictString(captionSha256)) ||
    typeof shareToFeed !== "boolean" ||
    !SHA256_RE.test(strictString(ledgerBaselineSha256)) ||
    !validReviewPreflightForPlan({
      reviewPreflight,
      expectedReviewPreflightFingerprint,
      currentBinding,
      expectedInstagramAccountId,
      expectedYoutubeChannelId,
      blobPathname,
      blobUrlSha256,
      ledgerBaselineSha256,
    })
  ) {
    return {
      ok: false,
      reason:
        "PART2_INSTAGRAM_RECOVERY_EXECUTION_PLAN_INPUT_INVALID",
    };
  }
  const normalizedRecoveryOutDir = resolve(recoveryOutDir);
  const stable = {
    schemaVersion:
      MONEY_SHORTS_PART2_INSTAGRAM_RECOVERY_EXECUTION_VERSION,
    mode: "part2_instagram_recovery_execution",
    status: "RECOVERY_EXECUTION_PLAN_OK",
    reviewPreflightFingerprint:
      expectedReviewPreflightFingerprint,
    reviewPlanFingerprint:
      reviewPreflight.recoveryPlanFingerprint,
    sourceEvidenceBundleFingerprint:
      reviewPreflight.sourceEvidenceBundleFingerprint,
    recoveryOutDir: normalizedRecoveryOutDir,
    currentBinding: structuredClone(currentBinding),
    expectedInstagramAccountId,
    expectedYoutubeChannelId,
    blob: {
      urlSha256: blobUrlSha256,
      pathname: blobPathname,
    },
    captionSha256,
    shareToFeed,
    ledger: {
      baselineSha256: ledgerBaselineSha256,
    },
    executionBoundary: {
      ...EXECUTION_BOUNDARY,
    },
    safety: {
      ...PLAN_SAFETY,
    },
  };
  return {
    ok: true,
    plan: fingerprinted(stable, "planFingerprint"),
  };
}

export function buildMoneyShortsPart2InstagramRecoveryExecutionPreflight({
  plan,
  boundAtIso,
}) {
  if (!validPlan(plan) || !validIso(boundAtIso)) {
    return null;
  }
  const stable = {
    schemaVersion:
      MONEY_SHORTS_PART2_INSTAGRAM_RECOVERY_EXECUTION_VERSION,
    evidenceType: "preflight",
    status: "PREFLIGHT_ONLY_OK",
    armed: false,
    executionAuthorized: false,
    orphanContainerRiskAcknowledgedByExactApproval: false,
    boundAtIso,
    planFingerprint: plan.planFingerprint,
    reviewPreflightFingerprint:
      plan.reviewPreflightFingerprint,
    reviewPlanFingerprint: plan.reviewPlanFingerprint,
    sourceEvidenceBundleFingerprint:
      plan.sourceEvidenceBundleFingerprint,
    recoveryOutDir: plan.recoveryOutDir,
    currentBinding: structuredClone(plan.currentBinding),
    expectedInstagramAccountId:
      plan.expectedInstagramAccountId,
    expectedYoutubeChannelId:
      plan.expectedYoutubeChannelId,
    blob: structuredClone(plan.blob),
    captionSha256: plan.captionSha256,
    shareToFeed: plan.shareToFeed,
    ledgerBaselineSha256: plan.ledger.baselineSha256,
    sideEffectCounters:
      zeroMoneyShortsPart2InstagramRecoveryExecutionCounters(),
  };
  return fingerprinted(stable, "preflightFingerprint");
}

export function validateMoneyShortsPart2InstagramRecoveryExecutionPreflight({
  evidence,
  currentPlan,
  expectedPreflightFingerprint,
}) {
  const valid =
    validPlan(currentPlan) &&
    hasExactKeys(evidence, [
      "schemaVersion",
      "evidenceType",
      "status",
      "armed",
      "executionAuthorized",
      "orphanContainerRiskAcknowledgedByExactApproval",
      "boundAtIso",
      "planFingerprint",
      "reviewPreflightFingerprint",
      "reviewPlanFingerprint",
      "sourceEvidenceBundleFingerprint",
      "recoveryOutDir",
      "currentBinding",
      "expectedInstagramAccountId",
      "expectedYoutubeChannelId",
      "blob",
      "captionSha256",
      "shareToFeed",
      "ledgerBaselineSha256",
      "sideEffectCounters",
      "preflightFingerprint",
    ]) &&
    validFingerprint(evidence, "preflightFingerprint") &&
    evidence.schemaVersion ===
      MONEY_SHORTS_PART2_INSTAGRAM_RECOVERY_EXECUTION_VERSION &&
    evidence.evidenceType === "preflight" &&
    evidence.status === "PREFLIGHT_ONLY_OK" &&
    evidence.armed === false &&
    evidence.executionAuthorized === false &&
    evidence.orphanContainerRiskAcknowledgedByExactApproval ===
      false &&
    validIso(evidence.boundAtIso) &&
    evidence.planFingerprint === currentPlan.planFingerprint &&
    evidence.reviewPreflightFingerprint ===
      currentPlan.reviewPreflightFingerprint &&
    evidence.reviewPlanFingerprint ===
      currentPlan.reviewPlanFingerprint &&
    evidence.sourceEvidenceBundleFingerprint ===
      currentPlan.sourceEvidenceBundleFingerprint &&
    evidence.recoveryOutDir === currentPlan.recoveryOutDir &&
    JSON.stringify(evidence.currentBinding) ===
      JSON.stringify(currentPlan.currentBinding) &&
    evidence.expectedInstagramAccountId ===
      currentPlan.expectedInstagramAccountId &&
    evidence.expectedYoutubeChannelId ===
      currentPlan.expectedYoutubeChannelId &&
    JSON.stringify(evidence.blob) ===
      JSON.stringify(currentPlan.blob) &&
    evidence.captionSha256 === currentPlan.captionSha256 &&
    evidence.shareToFeed === currentPlan.shareToFeed &&
    evidence.ledgerBaselineSha256 ===
      currentPlan.ledger.baselineSha256 &&
    JSON.stringify(evidence.sideEffectCounters) ===
      JSON.stringify(
        zeroMoneyShortsPart2InstagramRecoveryExecutionCounters(),
      ) &&
    evidence.preflightFingerprint ===
      expectedPreflightFingerprint;
  return {
    valid,
    reason: valid
      ? "part2_instagram_recovery_execution_preflight_valid"
      : "part2_instagram_recovery_execution_preflight_invalid",
  };
}

function validClaim(value) {
  return (
    hasExactKeys(value, [
      "schemaVersion",
      "evidenceType",
      "armed",
      "approvalToken",
      "orphanContainerRiskAcknowledgedByExactApproval",
      "claimId",
      "claimedAtIso",
      "planFingerprint",
      "preflightFingerprint",
      "reviewPreflightFingerprint",
      "reviewPlanFingerprint",
      "sourceEvidenceBundleFingerprint",
      "recoveryOutDir",
      "currentBinding",
      "expectedInstagramAccountId",
      "expectedYoutubeChannelId",
      "blob",
      "captionSha256",
      "shareToFeed",
      "ledgerBaselineSha256",
      "safety",
      "claimFingerprint",
    ]) &&
    validFingerprint(value, "claimFingerprint") &&
    value.schemaVersion ===
      MONEY_SHORTS_PART2_INSTAGRAM_RECOVERY_EXECUTION_VERSION &&
    value.evidenceType === "claim" &&
    value.armed === true &&
    value.approvalToken ===
      MONEY_SHORTS_PART2_INSTAGRAM_RECOVERY_EXECUTION_APPROVAL &&
    value.orphanContainerRiskAcknowledgedByExactApproval ===
      true &&
    PUBLIC_ID_RE.test(strictString(value.claimId)) &&
    validIso(value.claimedAtIso) &&
    SHA256_RE.test(strictString(value.planFingerprint)) &&
    SHA256_RE.test(strictString(value.preflightFingerprint)) &&
    SHA256_RE.test(
      strictString(value.reviewPreflightFingerprint),
    ) &&
    SHA256_RE.test(
      strictString(value.reviewPlanFingerprint),
    ) &&
    SHA256_RE.test(
      strictString(value.sourceEvidenceBundleFingerprint),
    ) &&
    typeof value.recoveryOutDir === "string" &&
    isAbsolute(value.recoveryOutDir) &&
    value.recoveryOutDir === resolve(value.recoveryOutDir) &&
    validCurrentBinding(value.currentBinding) &&
    INSTAGRAM_ACCOUNT_ID_RE.test(
      strictString(value.expectedInstagramAccountId),
    ) &&
    YOUTUBE_CHANNEL_ID_RE.test(
      strictString(value.expectedYoutubeChannelId),
    ) &&
    hasExactKeys(value.blob, [
      "urlSha256",
      "pathname",
    ]) &&
    SHA256_RE.test(strictString(value.blob.urlSha256)) &&
    validBlobPathname(value.blob.pathname) &&
    SHA256_RE.test(strictString(value.captionSha256)) &&
    typeof value.shareToFeed === "boolean" &&
    SHA256_RE.test(
      strictString(value.ledgerBaselineSha256),
    ) &&
    exactRecord(value.safety, {
      ...PLAN_SAFETY,
      orphanContainerRiskAcknowledgedByExactApproval: true,
    })
  );
}

export function buildMoneyShortsPart2InstagramRecoveryExecutionClaim({
  plan,
  preflightFingerprint,
  claimedAtIso,
  claimId = randomUUID(),
}) {
  if (
    !validPlan(plan) ||
    !SHA256_RE.test(strictString(preflightFingerprint)) ||
    !validIso(claimedAtIso) ||
    !PUBLIC_ID_RE.test(strictString(claimId))
  ) {
    return null;
  }
  const stable = {
    schemaVersion:
      MONEY_SHORTS_PART2_INSTAGRAM_RECOVERY_EXECUTION_VERSION,
    evidenceType: "claim",
    armed: true,
    approvalToken:
      MONEY_SHORTS_PART2_INSTAGRAM_RECOVERY_EXECUTION_APPROVAL,
    orphanContainerRiskAcknowledgedByExactApproval: true,
    claimId,
    claimedAtIso,
    planFingerprint: plan.planFingerprint,
    preflightFingerprint,
    reviewPreflightFingerprint:
      plan.reviewPreflightFingerprint,
    reviewPlanFingerprint: plan.reviewPlanFingerprint,
    sourceEvidenceBundleFingerprint:
      plan.sourceEvidenceBundleFingerprint,
    recoveryOutDir: plan.recoveryOutDir,
    currentBinding: structuredClone(plan.currentBinding),
    expectedInstagramAccountId:
      plan.expectedInstagramAccountId,
    expectedYoutubeChannelId:
      plan.expectedYoutubeChannelId,
    blob: structuredClone(plan.blob),
    captionSha256: plan.captionSha256,
    shareToFeed: plan.shareToFeed,
    ledgerBaselineSha256: plan.ledger.baselineSha256,
    safety: {
      ...PLAN_SAFETY,
      orphanContainerRiskAcknowledgedByExactApproval: true,
    },
  };
  return fingerprinted(stable, "claimFingerprint");
}

export function validateMoneyShortsPart2InstagramRecoveryExecutionClaim({
  evidence,
  currentPlan,
  expectedPreflightFingerprint,
}) {
  const valid =
    validClaim(evidence) &&
    validPlan(currentPlan) &&
    evidence.planFingerprint === currentPlan.planFingerprint &&
    evidence.preflightFingerprint ===
      expectedPreflightFingerprint &&
    evidence.reviewPreflightFingerprint ===
      currentPlan.reviewPreflightFingerprint &&
    evidence.reviewPlanFingerprint ===
      currentPlan.reviewPlanFingerprint &&
    evidence.sourceEvidenceBundleFingerprint ===
      currentPlan.sourceEvidenceBundleFingerprint &&
    evidence.recoveryOutDir === currentPlan.recoveryOutDir &&
    JSON.stringify(evidence.currentBinding) ===
      JSON.stringify(currentPlan.currentBinding) &&
    evidence.expectedInstagramAccountId ===
      currentPlan.expectedInstagramAccountId &&
    evidence.expectedYoutubeChannelId ===
      currentPlan.expectedYoutubeChannelId &&
    JSON.stringify(evidence.blob) ===
      JSON.stringify(currentPlan.blob) &&
    evidence.captionSha256 === currentPlan.captionSha256 &&
    evidence.shareToFeed === currentPlan.shareToFeed &&
    evidence.ledgerBaselineSha256 ===
      currentPlan.ledger.baselineSha256;
  return {
    valid,
    reason: valid
      ? "part2_instagram_recovery_execution_claim_valid"
      : "part2_instagram_recovery_execution_claim_invalid",
  };
}

function validPublicState(value, claim) {
  if (
    !hasExactKeys(value, [
      "instagram",
      "blob",
      "ledger",
      "forbidden",
    ]) ||
    !hasExactKeys(value.instagram, [
      "accountId",
      "identityStatus",
      "reconciliationBeforeCreate",
      "reconciliationBeforeCreateFingerprint",
      "reconciliationBeforeCreatePagesScanned",
      "reconciliationBeforeCreateItemsScanned",
      "reconciliationBeforeCreateCandidateCount",
      "reconciliationBeforePublish",
      "reconciliationBeforePublishFingerprint",
      "reconciliationBeforePublishPagesScanned",
      "reconciliationBeforePublishItemsScanned",
      "reconciliationBeforePublishCandidateCount",
      "containerOutcome",
      "containerId",
      "lastStatusCode",
      "publishOutcome",
      "mediaId",
      "mediaVerified",
      "permalink",
      "publishedAtIso",
      "mediaType",
      "mediaProductType",
    ]) ||
    (value.instagram.accountId !== null &&
      !INSTAGRAM_ACCOUNT_ID_RE.test(
        strictString(value.instagram.accountId),
      )) ||
    ![
      "not_started",
      "intent",
      "confirmed",
      "mismatch",
      "unknown",
    ].includes(value.instagram.identityStatus) ||
    (value.instagram.identityStatus === "confirmed" &&
      value.instagram.accountId !==
        claim.expectedInstagramAccountId) ||
    ![
      "not_started",
      "intent",
      "confirmed_no_match",
      "blocked",
      "unknown",
    ].includes(
      value.instagram.reconciliationBeforeCreate,
    ) ||
    (value.instagram.reconciliationBeforeCreateFingerprint !==
      null &&
      !SHA256_RE.test(
        strictString(
          value.instagram
            .reconciliationBeforeCreateFingerprint,
        ),
      )) ||
    (value.instagram.reconciliationBeforeCreatePagesScanned !==
      null &&
      (!Number.isSafeInteger(
        value.instagram
          .reconciliationBeforeCreatePagesScanned,
      ) ||
        value.instagram
          .reconciliationBeforeCreatePagesScanned < 1 ||
        value.instagram
          .reconciliationBeforeCreatePagesScanned > 10)) ||
    (value.instagram.reconciliationBeforeCreateItemsScanned !==
      null &&
      (!Number.isSafeInteger(
        value.instagram
          .reconciliationBeforeCreateItemsScanned,
      ) ||
        value.instagram
          .reconciliationBeforeCreateItemsScanned < 0 ||
        value.instagram
          .reconciliationBeforeCreateItemsScanned > 1_000)) ||
    (value.instagram.reconciliationBeforeCreateCandidateCount !==
      null &&
      (!Number.isSafeInteger(
        value.instagram
          .reconciliationBeforeCreateCandidateCount,
      ) ||
        value.instagram
          .reconciliationBeforeCreateCandidateCount < 0 ||
        value.instagram
          .reconciliationBeforeCreateCandidateCount >
          1_000)) ||
    (value.instagram.reconciliationBeforeCreate ===
      "confirmed_no_match" &&
      (!SHA256_RE.test(
        strictString(
          value.instagram
            .reconciliationBeforeCreateFingerprint,
        ),
      ) ||
        !Number.isSafeInteger(
          value.instagram
            .reconciliationBeforeCreatePagesScanned,
        ) ||
        value.instagram
          .reconciliationBeforeCreatePagesScanned < 1 ||
        value.instagram
          .reconciliationBeforeCreatePagesScanned > 10 ||
        !Number.isSafeInteger(
          value.instagram
            .reconciliationBeforeCreateItemsScanned,
        ) ||
        value.instagram
          .reconciliationBeforeCreateItemsScanned < 0 ||
        value.instagram
          .reconciliationBeforeCreateItemsScanned >
          1_000 ||
        value.instagram
          .reconciliationBeforeCreateCandidateCount !==
          0)) ||
    (value.instagram.reconciliationBeforeCreate ===
      "blocked" &&
      (!Number.isSafeInteger(
        value.instagram
          .reconciliationBeforeCreateCandidateCount,
      ) ||
        value.instagram
          .reconciliationBeforeCreateCandidateCount <= 0)) ||
    ![
      "not_started",
      "intent",
      "confirmed_no_match",
      "blocked",
      "unknown",
    ].includes(
      value.instagram.reconciliationBeforePublish,
    ) ||
    (value.instagram.reconciliationBeforePublishFingerprint !==
      null &&
      !SHA256_RE.test(
        strictString(
          value.instagram
            .reconciliationBeforePublishFingerprint,
        ),
      )) ||
    (value.instagram.reconciliationBeforePublishPagesScanned !==
      null &&
      (!Number.isSafeInteger(
        value.instagram
          .reconciliationBeforePublishPagesScanned,
      ) ||
        value.instagram
          .reconciliationBeforePublishPagesScanned < 1 ||
        value.instagram
          .reconciliationBeforePublishPagesScanned > 10)) ||
    (value.instagram.reconciliationBeforePublishItemsScanned !==
      null &&
      (!Number.isSafeInteger(
        value.instagram
          .reconciliationBeforePublishItemsScanned,
      ) ||
        value.instagram
          .reconciliationBeforePublishItemsScanned < 0 ||
        value.instagram
          .reconciliationBeforePublishItemsScanned >
          1_000)) ||
    (value.instagram.reconciliationBeforePublishCandidateCount !==
      null &&
      (!Number.isSafeInteger(
        value.instagram
          .reconciliationBeforePublishCandidateCount,
      ) ||
        value.instagram
          .reconciliationBeforePublishCandidateCount < 0 ||
        value.instagram
          .reconciliationBeforePublishCandidateCount >
          1_000)) ||
    (value.instagram.reconciliationBeforePublish ===
      "confirmed_no_match" &&
      (!SHA256_RE.test(
        strictString(
          value.instagram
            .reconciliationBeforePublishFingerprint,
        ),
      ) ||
        !Number.isSafeInteger(
          value.instagram
            .reconciliationBeforePublishPagesScanned,
        ) ||
        value.instagram
          .reconciliationBeforePublishPagesScanned < 1 ||
        value.instagram
          .reconciliationBeforePublishPagesScanned > 10 ||
        !Number.isSafeInteger(
          value.instagram
            .reconciliationBeforePublishItemsScanned,
        ) ||
        value.instagram
          .reconciliationBeforePublishItemsScanned < 0 ||
        value.instagram
          .reconciliationBeforePublishItemsScanned >
          1_000 ||
        value.instagram
          .reconciliationBeforePublishCandidateCount !==
          0)) ||
    (value.instagram.reconciliationBeforePublish ===
      "blocked" &&
      (!Number.isSafeInteger(
        value.instagram
          .reconciliationBeforePublishCandidateCount,
      ) ||
        value.instagram
          .reconciliationBeforePublishCandidateCount <=
          0)) ||
    ![
      "not_started",
      "unknown",
      "confirmed_created",
      "ready",
      "failed",
    ].includes(value.instagram.containerOutcome) ||
    (value.instagram.containerId !== null &&
      !INSTAGRAM_PUBLIC_ID_RE.test(
        strictString(value.instagram.containerId),
      )) ||
    (value.instagram.lastStatusCode !== null &&
      ![
        "IN_PROGRESS",
        "FINISHED",
        "ERROR",
        "EXPIRED",
        "UNKNOWN",
      ].includes(value.instagram.lastStatusCode)) ||
    ![
      "not_started",
      "unknown",
      "confirmed_published",
      "failed",
    ].includes(value.instagram.publishOutcome) ||
    (value.instagram.mediaId !== null &&
      !INSTAGRAM_PUBLIC_ID_RE.test(
        strictString(value.instagram.mediaId),
      )) ||
    typeof value.instagram.mediaVerified !== "boolean" ||
    (value.instagram.permalink !== null &&
      !validInstagramReelPermalink(
        value.instagram.permalink,
      )) ||
    (value.instagram.publishedAtIso !== null &&
      !validIso(value.instagram.publishedAtIso)) ||
    ![null, "VIDEO"].includes(value.instagram.mediaType) ||
    ![null, "REELS"].includes(
      value.instagram.mediaProductType,
    ) ||
    (value.instagram.publishOutcome ===
      "confirmed_published" &&
      value.instagram.mediaId === null) ||
    (value.instagram.mediaVerified === true &&
      (value.instagram.publishOutcome !==
        "confirmed_published" ||
        !validInstagramReelPermalink(
          value.instagram.permalink,
        ) ||
        !validIso(value.instagram.publishedAtIso) ||
        value.instagram.mediaType !== "VIDEO" ||
        value.instagram.mediaProductType !== "REELS")) ||
    !hasExactKeys(value.blob, [
      "pathname",
      "urlSha256",
      "headVerified",
      "headStatus",
      "headContentType",
    ]) ||
    value.blob.pathname !== claim.blob.pathname ||
    value.blob.urlSha256 !== claim.blob.urlSha256 ||
    typeof value.blob.headVerified !== "boolean" ||
    (value.blob.headStatus !== null &&
      (!Number.isSafeInteger(value.blob.headStatus) ||
        value.blob.headStatus < 100 ||
        value.blob.headStatus > 599)) ||
    (value.blob.headContentType !== null &&
      typeof value.blob.headContentType !== "string") ||
    (value.blob.headVerified === true &&
      (value.blob.headStatus !== 200 ||
        !strictString(value.blob.headContentType).startsWith(
          "video/",
        ))) ||
    !hasExactKeys(value.ledger, [
      "baselineSha256",
      "currentSha256",
      "writeOk",
      "readbackOk",
      "recordedKey",
      "publishedId",
    ]) ||
    value.ledger.baselineSha256 !==
      claim.ledgerBaselineSha256 ||
    (value.ledger.currentSha256 !== null &&
      !SHA256_RE.test(
        strictString(value.ledger.currentSha256),
      )) ||
    typeof value.ledger.writeOk !== "boolean" ||
    typeof value.ledger.readbackOk !== "boolean" ||
    (value.ledger.recordedKey !== null &&
      value.ledger.recordedKey !==
        `${claim.currentBinding.contentId}/instagram_reels/${claim.currentBinding.version}`) ||
    (value.ledger.publishedId !== null &&
      !INSTAGRAM_PUBLIC_ID_RE.test(
        strictString(value.ledger.publishedId),
      )) ||
    !hasExactKeys(value.forbidden, [
      "blobPutCount",
      "youtubeActionCount",
      "part1ActionCount",
      "databaseMutationCount",
      "automaticRetryCount",
      "credentialValuePrintCount",
    ]) ||
    !Object.values(value.forbidden).every(
      (counter) => counter === 0,
    )
  ) {
    return false;
  }
  return (
    (value.ledger.writeOk === false &&
      value.ledger.readbackOk === false) ||
    (value.ledger.writeOk === true &&
      value.ledger.readbackOk === false) ||
    (value.ledger.writeOk === true &&
      value.ledger.readbackOk === true &&
      value.ledger.recordedKey !== null &&
      value.ledger.publishedId ===
        value.instagram.mediaId &&
      SHA256_RE.test(
        strictString(value.ledger.currentSha256),
      ))
  );
}

function transitionCounterInvariant(
  transition,
  counters,
) {
  const index =
    MONEY_SHORTS_PART2_INSTAGRAM_RECOVERY_EXECUTION_TRANSITIONS.indexOf(
      transition,
    );
  if (
    index < 0 ||
    counters.evidenceWriteCount !== index + 2 ||
    counters.credentialReadCount !== 2
  ) {
    return false;
  }
  const atOrAfter = (candidate) =>
    index >=
    MONEY_SHORTS_PART2_INSTAGRAM_RECOVERY_EXECUTION_TRANSITIONS.indexOf(
      candidate,
    );
  return (
    counters.identityCount ===
      (atOrAfter("instagram_identity_verify_confirmed")
        ? 1
        : 0) &&
    counters.mediaListCount ===
      (atOrAfter(
        "instagram_reconciliation_before_publish_confirmed_no_match",
      )
        ? 2
        : atOrAfter(
              "instagram_reconciliation_confirmed_no_match",
            )
          ? 1
          : 0) &&
    counters.blobHeadCount ===
      (atOrAfter("blob_head_confirmed") ? 1 : 0) &&
    counters.containerCreateCount ===
      (atOrAfter("instagram_container_confirmed")
        ? 1
        : 0) &&
    (transition === "instagram_poll_observed"
      ? counters.statusPollCount >= 1
      : atOrAfter("instagram_poll_observed")
        ? counters.statusPollCount >= 1
        : counters.statusPollCount === 0) &&
    counters.mediaPublishCount ===
      (atOrAfter("instagram_publish_confirmed") ? 1 : 0) &&
    counters.mediaVerifyCount ===
      (atOrAfter("instagram_media_verify_confirmed")
        ? 1
        : 0) &&
    counters.ledgerWriteCount ===
      (atOrAfter("ledger_write_confirmed") ? 1 : 0)
  );
}

function transitionStateInvariant(
  transition,
  publicState,
) {
  const index =
    MONEY_SHORTS_PART2_INSTAGRAM_RECOVERY_EXECUTION_TRANSITIONS.indexOf(
      transition,
    );
  const atOrAfter = (candidate) =>
    index >=
    MONEY_SHORTS_PART2_INSTAGRAM_RECOVERY_EXECUTION_TRANSITIONS.indexOf(
      candidate,
    );
  return (
    (!atOrAfter("instagram_identity_verify_confirmed") ||
      publicState.instagram.identityStatus === "confirmed") &&
    (!atOrAfter(
      "instagram_reconciliation_confirmed_no_match",
    ) ||
      publicState.instagram.reconciliationBeforeCreate ===
        "confirmed_no_match") &&
    (!atOrAfter("blob_head_confirmed") ||
      publicState.blob.headVerified === true) &&
    (!atOrAfter("instagram_container_confirmed") ||
      (publicState.instagram.containerId !== null &&
        [
          "confirmed_created",
          "ready",
        ].includes(
          publicState.instagram.containerOutcome,
        ))) &&
    (!atOrAfter("instagram_poll_observed") ||
      publicState.instagram.lastStatusCode !== null) &&
    (!atOrAfter("instagram_container_ready") ||
      publicState.instagram.containerOutcome === "ready") &&
    (!atOrAfter(
      "instagram_reconciliation_before_publish_confirmed_no_match",
    ) ||
      publicState.instagram.reconciliationBeforePublish ===
        "confirmed_no_match") &&
    (!atOrAfter("instagram_publish_confirmed") ||
      publicState.instagram.publishOutcome ===
        "confirmed_published") &&
    (!atOrAfter("instagram_media_verify_confirmed") ||
      (publicState.instagram.mediaVerified === true &&
        validInstagramReelPermalink(
          publicState.instagram.permalink,
        ) &&
        validIso(publicState.instagram.publishedAtIso) &&
        publicState.instagram.mediaType === "VIDEO" &&
        publicState.instagram.mediaProductType === "REELS")) &&
    (!atOrAfter("ledger_write_confirmed") ||
      (publicState.ledger.writeOk === true &&
        publicState.ledger.readbackOk === true))
  );
}

export function buildMoneyShortsPart2InstagramRecoveryExecutionEvent({
  claim,
  previousEvidenceSha256,
  previousTransition = null,
  transition,
  recordedAtIso,
  publicState,
  sideEffectCounters,
}) {
  const sequence =
    MONEY_SHORTS_PART2_INSTAGRAM_RECOVERY_EXECUTION_TRANSITIONS.indexOf(
      transition,
    );
  const previousSequence =
    previousTransition === null
      ? -1
      : MONEY_SHORTS_PART2_INSTAGRAM_RECOVERY_EXECUTION_TRANSITIONS.indexOf(
          previousTransition,
        );
  const counters = canonicalCounters(sideEffectCounters);
  if (
    !validClaim(claim) ||
    !SHA256_RE.test(strictString(previousEvidenceSha256)) ||
    sequence < 0 ||
    sequence !== previousSequence + 1 ||
    !validIso(recordedAtIso) ||
    !validPublicState(publicState, claim) ||
    counters === null ||
    !transitionCounterInvariant(transition, counters) ||
    !transitionStateInvariant(transition, publicState)
  ) {
    return null;
  }
  const stable = {
    schemaVersion:
      MONEY_SHORTS_PART2_INSTAGRAM_RECOVERY_EXECUTION_VERSION,
    evidenceType: "event",
    claimId: claim.claimId,
    claimFingerprint: claim.claimFingerprint,
    sequence: sequence + 1,
    transition,
    previousTransition,
    previousEvidenceSha256,
    recordedAtIso,
    publicState: structuredClone(publicState),
    sideEffectCounters: counters,
  };
  return fingerprinted(stable, "eventFingerprint");
}

export function validateMoneyShortsPart2InstagramRecoveryExecutionEvent({
  evidence,
  claim,
  previousEvidenceSha256,
  previousTransition = null,
}) {
  if (!isPlainObject(evidence)) {
    return {
      valid: false,
      reason:
        "part2_instagram_recovery_execution_event_invalid",
    };
  }
  const rebuilt =
    buildMoneyShortsPart2InstagramRecoveryExecutionEvent({
      claim,
      previousEvidenceSha256,
      previousTransition,
      transition: evidence.transition,
      recordedAtIso: evidence.recordedAtIso,
      publicState: evidence.publicState,
      sideEffectCounters: evidence.sideEffectCounters,
    });
  const valid =
    rebuilt !== null &&
    JSON.stringify(rebuilt) === JSON.stringify(evidence);
  return {
    valid,
    reason: valid
      ? "part2_instagram_recovery_execution_event_valid"
      : "part2_instagram_recovery_execution_event_invalid",
  };
}

function confirmedPublished(publicState) {
  return (
    publicState.instagram.publishOutcome ===
      "confirmed_published" &&
    INSTAGRAM_PUBLIC_ID_RE.test(
      strictString(publicState.instagram.mediaId),
    )
  );
}

function successStateInvariant(
  claim,
  publicState,
  counters,
  latestTransition,
) {
  return (
    latestTransition === "complete" &&
    counters.identityCount === 1 &&
    counters.mediaListCount === 2 &&
    counters.blobHeadCount === 1 &&
    counters.containerCreateCount === 1 &&
    counters.statusPollCount >= 1 &&
    counters.statusPollCount <= 24 &&
    counters.mediaPublishCount === 1 &&
    counters.mediaVerifyCount === 1 &&
    counters.ledgerWriteCount === 1 &&
    counters.credentialReadCount === 2 &&
    counters.evidenceWriteCount ===
      MONEY_SHORTS_PART2_INSTAGRAM_RECOVERY_EXECUTION_TRANSITIONS.length +
        2 &&
    publicState.instagram.identityStatus === "confirmed" &&
    publicState.instagram.reconciliationBeforeCreate ===
      "confirmed_no_match" &&
    SHA256_RE.test(
      strictString(
        publicState.instagram
          .reconciliationBeforeCreateFingerprint,
      ),
    ) &&
    Number.isSafeInteger(
      publicState.instagram
        .reconciliationBeforeCreatePagesScanned,
    ) &&
    publicState.instagram
      .reconciliationBeforeCreatePagesScanned >= 1 &&
    publicState.instagram
      .reconciliationBeforeCreatePagesScanned <= 10 &&
    Number.isSafeInteger(
      publicState.instagram
        .reconciliationBeforeCreateItemsScanned,
    ) &&
    publicState.instagram
      .reconciliationBeforeCreateItemsScanned >= 0 &&
    publicState.instagram
      .reconciliationBeforeCreateItemsScanned <= 1_000 &&
    publicState.instagram
      .reconciliationBeforeCreateCandidateCount === 0 &&
    publicState.instagram.reconciliationBeforePublish ===
      "confirmed_no_match" &&
    SHA256_RE.test(
      strictString(
        publicState.instagram
          .reconciliationBeforePublishFingerprint,
      ),
    ) &&
    Number.isSafeInteger(
      publicState.instagram
        .reconciliationBeforePublishPagesScanned,
    ) &&
    publicState.instagram
      .reconciliationBeforePublishPagesScanned >= 1 &&
    publicState.instagram
      .reconciliationBeforePublishPagesScanned <= 10 &&
    Number.isSafeInteger(
      publicState.instagram
        .reconciliationBeforePublishItemsScanned,
    ) &&
    publicState.instagram
      .reconciliationBeforePublishItemsScanned >= 0 &&
    publicState.instagram
      .reconciliationBeforePublishItemsScanned <= 1_000 &&
    publicState.instagram
      .reconciliationBeforePublishCandidateCount === 0 &&
    publicState.blob.headVerified === true &&
    publicState.instagram.containerOutcome === "ready" &&
    publicState.instagram.mediaVerified === true &&
    validInstagramReelPermalink(
      publicState.instagram.permalink,
    ) &&
    validIso(publicState.instagram.publishedAtIso) &&
    publicState.instagram.mediaType === "VIDEO" &&
    publicState.instagram.mediaProductType === "REELS" &&
    confirmedPublished(publicState) &&
    publicState.ledger.writeOk === true &&
    publicState.ledger.readbackOk === true &&
    publicState.ledger.recordedKey ===
      `${claim.currentBinding.contentId}/instagram_reels/${claim.currentBinding.version}` &&
    publicState.ledger.publishedId ===
      publicState.instagram.mediaId
  );
}

function resultStatusInvariant({
  claim,
  publicState,
  counters,
  latestTransition,
  status,
}) {
  if (
    !RESULT_ALLOWED_LATEST_TRANSITIONS[
      status
    ]?.includes(latestTransition)
  ) {
    return false;
  }
  if (status === "PART2_INSTAGRAM_RECOVERY_OK") {
    return successStateInvariant(
      claim,
      publicState,
      counters,
      latestTransition,
    );
  }
  if (status === "FAILED_BEFORE_RECOVERY_MUTATION") {
    return (
      counters.containerCreateCount === 0 &&
      counters.mediaPublishCount === 0 &&
      counters.ledgerWriteCount === 0 &&
      !confirmedPublished(publicState)
    );
  }
  if (status === "INSTAGRAM_CONTAINER_OUTCOME_UNKNOWN") {
    return (
      counters.containerCreateCount === 1 &&
      counters.mediaPublishCount === 0 &&
      counters.ledgerWriteCount === 0 &&
      latestTransition === "instagram_container_intent" &&
      publicState.instagram.containerId === null &&
      publicState.instagram.mediaId === null
    );
  }
  if (
    status === "INSTAGRAM_CONTAINER_CREATED_NOT_PUBLISHED"
  ) {
    return (
      counters.containerCreateCount === 1 &&
      counters.mediaPublishCount === 0 &&
      counters.ledgerWriteCount === 0 &&
      publicState.instagram.containerId !== null &&
      publicState.instagram.mediaId === null &&
      !confirmedPublished(publicState)
    );
  }
  if (status === "INSTAGRAM_PUBLISH_OUTCOME_UNKNOWN") {
    return (
      counters.containerCreateCount === 1 &&
      counters.mediaPublishCount === 1 &&
      counters.ledgerWriteCount === 0 &&
      latestTransition === "instagram_publish_intent" &&
      publicState.instagram.containerId !== null &&
      publicState.instagram.mediaId === null
    );
  }
  if (status === "INSTAGRAM_PUBLISHED_LEDGER_MISSING") {
    return (
      counters.containerCreateCount === 1 &&
      counters.mediaPublishCount === 1 &&
      confirmedPublished(publicState) &&
      publicState.ledger.writeOk !== true
    );
  }
  if (
    status ===
    "INSTAGRAM_PUBLISHED_LEDGER_COMMIT_OUTCOME_UNKNOWN"
  ) {
    return (
      counters.containerCreateCount === 1 &&
      counters.mediaPublishCount === 1 &&
      counters.ledgerWriteCount === 1 &&
      confirmedPublished(publicState) &&
      publicState.ledger.writeOk === true &&
      publicState.ledger.readbackOk === false
    );
  }
  return (
    status ===
      "INSTAGRAM_AND_LEDGER_CONFIRMED_RECOVERY_EVIDENCE_INCOMPLETE" &&
    counters.containerCreateCount === 1 &&
    counters.mediaPublishCount === 1 &&
    counters.ledgerWriteCount === 1 &&
    confirmedPublished(publicState) &&
    publicState.ledger.writeOk === true &&
    publicState.ledger.readbackOk === true
  );
}

function latestEventResultInvariant({
  claim,
  latestEvent,
  latestEventFileSha256,
  resultCounters,
}) {
  if (
    !isPlainObject(latestEvent) ||
    resultCounters === null ||
    !SHA256_RE.test(strictString(latestEventFileSha256)) ||
    serializedEvidenceSha256(latestEvent) !==
      latestEventFileSha256
  ) {
    return false;
  }
  const validation =
    validateMoneyShortsPart2InstagramRecoveryExecutionEvent({
      evidence: latestEvent,
      claim,
      previousEvidenceSha256:
        latestEvent.previousEvidenceSha256,
      previousTransition:
        latestEvent.previousTransition,
    });
  const eventCounters = canonicalCounters(
    latestEvent.sideEffectCounters,
  );
  if (!validation.valid || eventCounters === null) {
    return false;
  }
  const actionCounterByIntent = {
    instagram_identity_verify_intent:
      "identityCount",
    instagram_reconciliation_intent:
      "mediaListCount",
    blob_head_intent: "blobHeadCount",
    instagram_container_intent:
      "containerCreateCount",
    instagram_reconciliation_before_publish_intent:
      "mediaListCount",
    instagram_publish_intent:
      "mediaPublishCount",
    instagram_media_verify_intent:
      "mediaVerifyCount",
    ledger_write_intent: "ledgerWriteCount",
  };
  const expectedActionCounter =
    actionCounterByIntent[latestEvent.transition] ?? null;
  const evidenceWriteDelta =
    resultCounters.evidenceWriteCount -
    eventCounters.evidenceWriteCount;
  if (![1, 2].includes(evidenceWriteDelta)) {
    return false;
  }
  return COUNTER_NAMES.every((name) => {
    if (name === "evidenceWriteCount") {
      return true;
    }
    if (
      latestEvent.transition ===
        "instagram_poll_intent" &&
      name === "statusPollCount"
    ) {
      const delta =
        resultCounters[name] - eventCounters[name];
      return delta >= 1 && delta <= 24;
    }
    return name === expectedActionCounter
      ? resultCounters[name] === eventCounters[name] + 1
      : resultCounters[name] === eventCounters[name];
  });
}

export function buildMoneyShortsPart2InstagramRecoveryExecutionResult({
  claim,
  latestEvent,
  latestEventFileSha256,
  status,
  blockerCode,
  completedAtIso,
  publicState,
  sideEffectCounters,
}) {
  const counters = canonicalCounters(sideEffectCounters);
  const latestTransition = latestEvent?.transition;
  const success =
    status === "PART2_INSTAGRAM_RECOVERY_OK";
  if (
    !validClaim(claim) ||
    !latestEventResultInvariant({
      claim,
      latestEvent,
      latestEventFileSha256,
      resultCounters: counters,
    }) ||
    !MONEY_SHORTS_PART2_INSTAGRAM_RECOVERY_EXECUTION_TRANSITIONS.includes(
      latestTransition,
    ) ||
    !RESULT_STATUSES.has(status) ||
    !validIso(completedAtIso) ||
    Date.parse(completedAtIso) <
      Date.parse(latestEvent.recordedAtIso) ||
    (success
      ? blockerCode !== null
      : !BLOCKER_CODE_RE.test(strictString(blockerCode))) ||
    !validPublicState(publicState, claim) ||
    counters === null ||
    !resultStatusInvariant({
      claim,
      publicState,
      counters,
      latestTransition,
      status,
    })
  ) {
    return null;
  }
  const stable = {
    schemaVersion:
      MONEY_SHORTS_PART2_INSTAGRAM_RECOVERY_EXECUTION_VERSION,
    evidenceType: "result",
    status,
    blockerCode: success ? null : blockerCode,
    claimId: claim.claimId,
    claimFingerprint: claim.claimFingerprint,
    planFingerprint: claim.planFingerprint,
    preflightFingerprint: claim.preflightFingerprint,
    reviewPreflightFingerprint:
      claim.reviewPreflightFingerprint,
    reviewPlanFingerprint: claim.reviewPlanFingerprint,
    sourceEvidenceBundleFingerprint:
      claim.sourceEvidenceBundleFingerprint,
    recoveryOutDir: claim.recoveryOutDir,
    currentBinding: structuredClone(claim.currentBinding),
    expectedInstagramAccountId:
      claim.expectedInstagramAccountId,
    expectedYoutubeChannelId:
      claim.expectedYoutubeChannelId,
    blob: structuredClone(claim.blob),
    captionSha256: claim.captionSha256,
    shareToFeed: claim.shareToFeed,
    ledgerBaselineSha256:
      claim.ledgerBaselineSha256,
    orphanContainerRiskAcknowledgedByExactApproval: true,
    latestEventSha256: latestEventFileSha256,
    latestTransition,
    completedAtIso,
    publicState: structuredClone(publicState),
    sideEffectCounters: counters,
    safety: {
      ...RESULT_SAFETY,
    },
  };
  return fingerprinted(stable, "resultFingerprint");
}

export function validateMoneyShortsPart2InstagramRecoveryExecutionResult({
  evidence,
  claim,
  latestEvent,
  latestEventFileSha256,
}) {
  if (
    !isPlainObject(evidence) ||
    evidence.latestEventSha256 !==
      latestEventFileSha256
  ) {
    return {
      valid: false,
      reason:
        "part2_instagram_recovery_execution_result_invalid",
    };
  }
  const rebuilt =
    buildMoneyShortsPart2InstagramRecoveryExecutionResult({
      claim,
      latestEvent,
      latestEventFileSha256,
      status: evidence.status,
      blockerCode: evidence.blockerCode,
      completedAtIso: evidence.completedAtIso,
      publicState: evidence.publicState,
      sideEffectCounters: evidence.sideEffectCounters,
    });
  const valid =
    rebuilt !== null &&
    JSON.stringify(rebuilt) === JSON.stringify(evidence);
  return {
    valid,
    reason: valid
      ? "part2_instagram_recovery_execution_result_valid"
      : "part2_instagram_recovery_execution_result_invalid",
  };
}

export function moneyShortsPart2InstagramRecoveryExecutionPaths(
  recoveryOutDir,
) {
  const root = resolve(recoveryOutDir);
  const evidenceDir = join(
    root,
    MONEY_SHORTS_PART2_INSTAGRAM_RECOVERY_EXECUTION_DIRNAME,
  );
  const eventDir = join(evidenceDir, "events");
  return {
    evidenceDir,
    preflightPath: join(
      evidenceDir,
      MONEY_SHORTS_PART2_INSTAGRAM_RECOVERY_EXECUTION_PREFLIGHT_FILENAME,
    ),
    claimPath: join(
      evidenceDir,
      MONEY_SHORTS_PART2_INSTAGRAM_RECOVERY_EXECUTION_CLAIM_FILENAME,
    ),
    eventDir,
    resultPath: join(
      evidenceDir,
      MONEY_SHORTS_PART2_INSTAGRAM_RECOVERY_EXECUTION_RESULT_FILENAME,
    ),
    lockPath: join(
      root,
      ".part2-instagram-recovery-execution-v1.lock",
    ),
  };
}

export function moneyShortsPart2InstagramRecoveryExecutionEventPath(
  eventDir,
  transition,
) {
  const index =
    MONEY_SHORTS_PART2_INSTAGRAM_RECOVERY_EXECUTION_TRANSITIONS.indexOf(
      transition,
    );
  return index < 0
    ? null
    : join(
        eventDir,
        `${String(index + 1).padStart(2, "0")}-${transition}.json`,
      );
}

function mapEvidenceWriteReason(reason) {
  const mapping = {
    recovery_evidence_write_input_invalid:
      "PART2_INSTAGRAM_RECOVERY_EXECUTION_EVIDENCE_WRITE_INPUT_INVALID",
    recovery_evidence_exists_or_orphaned_manual_review_required:
      "PART2_INSTAGRAM_RECOVERY_EXECUTION_EVIDENCE_EXISTS_OR_ORPHANED",
    recovery_evidence_write_failed:
      "PART2_INSTAGRAM_RECOVERY_EXECUTION_EVIDENCE_WRITE_FAILED",
    recovery_evidence_readback_mismatch:
      "PART2_INSTAGRAM_RECOVERY_EXECUTION_EVIDENCE_READBACK_MISMATCH",
    recovery_evidence_readback_failed:
      "PART2_INSTAGRAM_RECOVERY_EXECUTION_EVIDENCE_READBACK_FAILED",
  };
  return (
    mapping[reason] ??
    "PART2_INSTAGRAM_RECOVERY_EXECUTION_EVIDENCE_WRITE_FAILED"
  );
}

export function writeMoneyShortsPart2InstagramRecoveryExecutionEvidenceOnce({
  path,
  evidence,
  fingerprintField,
  fsImpl,
}) {
  const result =
    writeMoneyShortsYoutubeOnlyRecoveryEvidenceOnce({
      path,
      evidence,
      fingerprintField,
      ...(fsImpl ? { fsImpl } : {}),
    });
  return result.ok === true
    ? {
        ...result,
        reason: null,
      }
    : {
        ...result,
        reason: mapEvidenceWriteReason(result.reason),
      };
}

export function acquireMoneyShortsPart2InstagramRecoveryExecutionLock({
  lockPath,
  fsImpl,
}) {
  const result =
    acquireMoneyShortsYoutubeOnlyRecoveryLock({
      lockPath,
      ...(fsImpl ? { fsImpl } : {}),
    });
  return result.ok === true
    ? result
    : {
        ...result,
        reason:
          "PART2_INSTAGRAM_RECOVERY_EXECUTION_LOCK_ACTIVE_OR_ORPHANED",
      };
}

export function releaseMoneyShortsPart2InstagramRecoveryExecutionLock({
  lock,
  fsImpl,
}) {
  const result =
    releaseMoneyShortsYoutubeOnlyRecoveryLock({
      lock,
      ...(fsImpl ? { fsImpl } : {}),
    });
  if (result.ok === true) return result;
  return {
    ...result,
    reason:
      result.reason ===
      "youtube_only_recovery_lock_changed"
        ? "PART2_INSTAGRAM_RECOVERY_EXECUTION_LOCK_CHANGED"
        : "PART2_INSTAGRAM_RECOVERY_EXECUTION_LOCK_RELEASE_FAILED",
  };
}
