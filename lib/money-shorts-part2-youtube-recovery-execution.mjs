import { createHash, randomUUID } from "node:crypto";
import { join, resolve } from "node:path";

import {
  acquireMoneyShortsYoutubeOnlyRecoveryLock,
  releaseMoneyShortsYoutubeOnlyRecoveryLock,
  writeMoneyShortsYoutubeOnlyRecoveryEvidenceOnce,
} from "./money-shorts-youtube-only-recovery.mjs";

export const MONEY_SHORTS_PART2_YOUTUBE_RECOVERY_EXECUTION_VERSION =
  "money_shorts_part2_youtube_recovery_execution_v1";
export const MONEY_SHORTS_PART2_YOUTUBE_RECOVERY_EXECUTION_APPROVAL =
  "APPROVE_PART2_YOUTUBE_RECOVERY_EXECUTION_V1";
export const MONEY_SHORTS_PART2_YOUTUBE_RECOVERY_EXECUTION_INSPECTION =
  "INSPECT_PART2_YOUTUBE_RECOVERY_EVIDENCE_V1";
export const MONEY_SHORTS_PART2_YOUTUBE_RECOVERY_EXECUTION_DIRNAME =
  "part2-youtube-recovery-execution-v1";
export const MONEY_SHORTS_PART2_YOUTUBE_RECOVERY_EXECUTION_PREFLIGHT_FILENAME =
  "execution-preflight.json";
export const MONEY_SHORTS_PART2_YOUTUBE_RECOVERY_EXECUTION_CLAIM_FILENAME =
  "claim.json";
export const MONEY_SHORTS_PART2_YOUTUBE_RECOVERY_EXECUTION_RESULT_FILENAME =
  "result.json";
export const MONEY_SHORTS_PART2_YOUTUBE_RECOVERY_EXECUTION_TRANSITIONS =
  Object.freeze([
    "external_execution_ready",
    "youtube_channel_verify_intent",
    "youtube_channel_verify_confirmed",
    "youtube_insert_intent",
    "youtube_insert_confirmed",
    "ledger_write_intent",
    "ledger_write_confirmed",
    "complete",
  ]);

const SHA256_RE = /^[a-f0-9]{64}$/;
const CONTENT_ID_RE = /^[A-Za-z0-9._:-]{1,240}-part-2$/;
const CHANNEL_ID_RE = /^UC[A-Za-z0-9_-]{22}$/;
const PUBLIC_ID_RE = /^[A-Za-z0-9._:-]{1,240}$/;
const YOUTUBE_VIDEO_ID_RE = /^[A-Za-z0-9_-]{6,30}$/;
const RESULT_STATUSES = new Set([
  "FAILED_BEFORE_YOUTUBE_INSERT",
  "YOUTUBE_UPLOAD_OUTCOME_UNKNOWN",
  "BOTH_PUBLISHED_LEDGER_MISSING",
  "YOUTUBE_AND_LEDGER_CONFIRMED_RECOVERY_EVIDENCE_INCOMPLETE",
  "PART2_YOUTUBE_RECOVERY_OK",
]);
const COUNTER_NAMES = Object.freeze([
  "youtubeChannelVerificationCount",
  "youtubeInsertCount",
  "instagramActionCount",
  "blobMutationCount",
  "ledgerWriteCount",
  "databaseMutationCount",
  "credentialReadCount",
  "youtubeApiInvocationCount",
  "recoveryEvidenceWriteCount",
  "credentialValuePrintCount",
]);

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function fingerprint(value) {
  return sha256(JSON.stringify(value));
}

function isPlainObject(value) {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function strictString(value) {
  return typeof value === "string" ? value : "";
}

function validIso(value) {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    Number.isFinite(Date.parse(value))
  );
}

function sameValue(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function validSelfFingerprint(value, field) {
  if (!isPlainObject(value)) return false;
  const { [field]: actual, ...stable } = value;
  return SHA256_RE.test(strictString(actual)) &&
    actual === fingerprint(stable);
}

function withFingerprint(stable, field) {
  return {
    ...stable,
    [field]: fingerprint(stable),
  };
}

function canonicalCounters(value) {
  if (
    !isPlainObject(value) ||
    Object.keys(value).length !== COUNTER_NAMES.length ||
    !COUNTER_NAMES.every(
      (name) =>
        Object.hasOwn(value, name) &&
        Number.isSafeInteger(value[name]) &&
        value[name] >= 0,
    )
  ) {
    return null;
  }
  return Object.fromEntries(
    COUNTER_NAMES.map((name) => [name, value[name]]),
  );
}

export function zeroMoneyShortsPart2YoutubeRecoveryExecutionCounters() {
  return Object.fromEntries(
    COUNTER_NAMES.map((name) => [name, 0]),
  );
}

function validYoutubeMetadata(value) {
  return (
    isPlainObject(value) &&
    typeof value.titleWithShortsSuffix === "string" &&
    value.titleWithShortsSuffix.length > 0 &&
    typeof value.descriptionBase === "string" &&
    Array.isArray(value.tags) &&
    value.tags.every(
      (tag) => typeof tag === "string" && tag.length > 0,
    ) &&
    typeof value.categoryId === "string" &&
    value.categoryId.length > 0 &&
    typeof value.defaultLanguage === "string" &&
    value.defaultLanguage.length > 0 &&
    ["private", "unlisted", "public"].includes(
      value.privacyStatus,
    ) &&
    typeof value.selfDeclaredMadeForKids === "boolean" &&
    typeof value.containsSyntheticMedia === "boolean"
  );
}

function validReviewPreflight(evidence) {
  if (
    !validSelfFingerprint(evidence, "preflightFingerprint") ||
    evidence.status !==
      "LOCAL_PART2_YOUTUBE_RECOVERY_PREFLIGHT_OK" ||
    evidence.readyForActualExecution !== false ||
    evidence.safeToUpload !== false ||
    evidence.ownerApprovalRequired !== true ||
    !validSelfFingerprint(
      evidence.plan,
      "planFingerprint",
    )
  ) {
    return false;
  }
  const plan = evidence.plan;
  const binding = plan.currentBinding;
  const instagram = plan.instagramRecovery;
  const youtube = plan.youtube;
  const ledger = plan.ledger;
  return (
    plan.mode === "part2_youtube_only_recovery_review" &&
    binding?.productionPartId === "part-2" &&
    CONTENT_ID_RE.test(strictString(binding?.contentId)) &&
    strictString(binding?.version).length > 0 &&
    SHA256_RE.test(
      strictString(binding?.contentUnitSha256),
    ) &&
    SHA256_RE.test(
      strictString(binding?.youtubeSourceSha256),
    ) &&
    binding.youtubeSourceSha256 ===
      binding.instagramSourceSha256 &&
    SHA256_RE.test(
      strictString(binding?.publishMetadataSha256),
    ) &&
    instagram?.status ===
      "PART2_INSTAGRAM_RECOVERY_OK" &&
    PUBLIC_ID_RE.test(strictString(instagram?.mediaId)) &&
    typeof instagram?.permalink === "string" &&
    instagram.permalink.length > 0 &&
    validIso(instagram?.publishedAtIso) &&
    youtube?.outcome === "confirmed_not_started" &&
    youtube?.videoId === null &&
    youtube?.actionAllowed === false &&
    CHANNEL_ID_RE.test(
      strictString(youtube?.expectedChannelId),
    ) &&
    youtube?.sourceSha256 ===
      binding.youtubeSourceSha256 &&
    youtube?.metadataSha256 ===
      binding.publishMetadataSha256 &&
    validYoutubeMetadata(youtube?.metadata) &&
    SHA256_RE.test(strictString(ledger?.sha256)) &&
    ledger?.instagramRecordConfirmed === true &&
    ledger?.instagramPublishedId === instagram.mediaId &&
    ledger?.youtubeRecordAbsent === true &&
    ledger?.expectedYoutubeKey ===
      `${binding.contentId}/youtube_shorts/${binding.version}` &&
    plan.safety?.readyForActualExecution === false &&
    plan.safety?.youtubeActionAllowed === false &&
    plan.safety?.instagramActionAllowed === false &&
    plan.safety?.blobMutationAllowed === false &&
    plan.safety?.ledgerMutationAllowed === false &&
    plan.safety?.automaticRetryAllowed === false
  );
}

export function validateMoneyShortsPart2YoutubeRecoveryExecutionAuthorization({
  armed,
  approval,
  inspection,
  expectedReviewPreflightFingerprint,
  expectedExecutionPreflightFingerprint,
}) {
  const valid =
    typeof armed === "boolean" &&
    approval ===
      MONEY_SHORTS_PART2_YOUTUBE_RECOVERY_EXECUTION_APPROVAL &&
    inspection ===
      MONEY_SHORTS_PART2_YOUTUBE_RECOVERY_EXECUTION_INSPECTION &&
    SHA256_RE.test(
      strictString(expectedReviewPreflightFingerprint),
    ) &&
    (armed
      ? SHA256_RE.test(
          strictString(
            expectedExecutionPreflightFingerprint,
          ),
        )
      : expectedExecutionPreflightFingerprint === null ||
        expectedExecutionPreflightFingerprint === undefined);
  return valid
    ? {
        ok: true,
        armed,
        expectedReviewPreflightFingerprint,
        expectedExecutionPreflightFingerprint:
          armed
            ? expectedExecutionPreflightFingerprint
            : null,
      }
    : {
        ok: false,
        reason:
          "PART2_YOUTUBE_RECOVERY_EXECUTION_AUTHORIZATION_INVALID",
      };
}

export function buildMoneyShortsPart2YoutubeRecoveryExecutionPlan({
  reviewPreflight,
  expectedReviewPreflightFingerprint,
}) {
  if (
    !validReviewPreflight(reviewPreflight) ||
    reviewPreflight.preflightFingerprint !==
      expectedReviewPreflightFingerprint
  ) {
    return {
      ok: false,
      reason:
        "PART2_YOUTUBE_RECOVERY_EXECUTION_REVIEW_PREFLIGHT_INVALID",
    };
  }
  const reviewPlan = reviewPreflight.plan;
  const stable = {
    schemaVersion:
      MONEY_SHORTS_PART2_YOUTUBE_RECOVERY_EXECUTION_VERSION,
    mode: "part2_youtube_only_recovery_execution",
    sourceReviewPreflightFingerprint:
      reviewPreflight.preflightFingerprint,
    sourceReviewPlanFingerprint:
      reviewPlan.planFingerprint,
    currentBinding: structuredClone(
      reviewPlan.currentBinding,
    ),
    originalAttempt: structuredClone(
      reviewPlan.originalAttempt,
    ),
    instagramRecovery: structuredClone(
      reviewPlan.instagramRecovery,
    ),
    youtube: {
      ...structuredClone(reviewPlan.youtube),
      actionAllowed: true,
    },
    ledger: structuredClone(reviewPlan.ledger),
    safety: {
      ownerApprovalRequired: true,
      executionPreflightRequired: true,
      youtubeActionScope: "one_channel_read_one_insert",
      maxYoutubeChannelVerificationCount: 1,
      maxYoutubeInsertCount: 1,
      maxLedgerWriteCount: 1,
      instagramActionAllowed: false,
      blobMutationAllowed: false,
      databaseMutationAllowed: false,
      part1ActionAllowed: false,
      automaticRetryAllowed: false,
      credentialValuePrintAllowed: false,
    },
  };
  return {
    ok: true,
    plan: withFingerprint(stable, "planFingerprint"),
  };
}

export function validateMoneyShortsPart2YoutubeRecoveryExecutionPlan(
  plan,
) {
  const valid =
    validSelfFingerprint(plan, "planFingerprint") &&
    plan.schemaVersion ===
      MONEY_SHORTS_PART2_YOUTUBE_RECOVERY_EXECUTION_VERSION &&
    plan.mode ===
      "part2_youtube_only_recovery_execution" &&
    plan.currentBinding?.productionPartId === "part-2" &&
    CONTENT_ID_RE.test(
      strictString(plan.currentBinding?.contentId),
    ) &&
    SHA256_RE.test(
      strictString(plan.sourceReviewPreflightFingerprint),
    ) &&
    SHA256_RE.test(
      strictString(plan.sourceReviewPlanFingerprint),
    ) &&
    plan.instagramRecovery?.status ===
      "PART2_INSTAGRAM_RECOVERY_OK" &&
    plan.youtube?.outcome === "confirmed_not_started" &&
    plan.youtube?.videoId === null &&
    plan.youtube?.actionAllowed === true &&
    CHANNEL_ID_RE.test(
      strictString(plan.youtube?.expectedChannelId),
    ) &&
    validYoutubeMetadata(plan.youtube?.metadata) &&
    plan.ledger?.youtubeRecordAbsent === true &&
    SHA256_RE.test(strictString(plan.ledger?.sha256)) &&
    plan.safety?.executionPreflightRequired === true &&
    plan.safety?.maxYoutubeChannelVerificationCount === 1 &&
    plan.safety?.maxYoutubeInsertCount === 1 &&
    plan.safety?.maxLedgerWriteCount === 1 &&
    plan.safety?.instagramActionAllowed === false &&
    plan.safety?.blobMutationAllowed === false &&
    plan.safety?.databaseMutationAllowed === false &&
    plan.safety?.part1ActionAllowed === false &&
    plan.safety?.automaticRetryAllowed === false &&
    plan.safety?.credentialValuePrintAllowed === false;
  return {
    valid,
    reason: valid
      ? "part2_youtube_recovery_execution_plan_valid"
      : "part2_youtube_recovery_execution_plan_invalid",
  };
}

export function buildMoneyShortsPart2YoutubeRecoveryExecutionPreflight({
  plan,
  boundAtIso,
}) {
  if (
    validateMoneyShortsPart2YoutubeRecoveryExecutionPlan(
      plan,
    ).valid !== true ||
    !validIso(boundAtIso)
  ) {
    return null;
  }
  const stable = {
    schemaVersion:
      MONEY_SHORTS_PART2_YOUTUBE_RECOVERY_EXECUTION_VERSION,
    evidenceType: "execution_preflight",
    status:
      "PART2_YOUTUBE_RECOVERY_EXECUTION_PREFLIGHT_OK",
    boundAtIso,
    readyForArmedExecution: true,
    safeToUploadWithoutArm: false,
    ownerApprovalRequired: true,
    plan: structuredClone(plan),
    sideEffectCounters:
      zeroMoneyShortsPart2YoutubeRecoveryExecutionCounters(),
  };
  return withFingerprint(stable, "preflightFingerprint");
}

export function validateMoneyShortsPart2YoutubeRecoveryExecutionPreflight({
  evidence,
  currentPlan,
  expectedPreflightFingerprint,
}) {
  const rebuilt =
    buildMoneyShortsPart2YoutubeRecoveryExecutionPreflight({
      plan: currentPlan,
      boundAtIso: evidence?.boundAtIso,
    });
  const valid =
    rebuilt !== null &&
    SHA256_RE.test(strictString(expectedPreflightFingerprint)) &&
    evidence?.preflightFingerprint ===
      expectedPreflightFingerprint &&
    sameValue(rebuilt, evidence) &&
    sameValue(
      evidence.sideEffectCounters,
      zeroMoneyShortsPart2YoutubeRecoveryExecutionCounters(),
    );
  return {
    valid,
    reason: valid
      ? "part2_youtube_recovery_execution_preflight_valid"
      : "part2_youtube_recovery_execution_preflight_invalid",
  };
}

function validPublicState(value) {
  if (!isPlainObject(value)) return false;
  const instagram = value.instagram;
  const youtube = value.youtube;
  const ledger = value.ledger;
  const instagramValid =
    instagram?.outcome === "confirmed_published" &&
    PUBLIC_ID_RE.test(strictString(instagram?.mediaId)) &&
    typeof instagram?.permalink === "string" &&
    instagram.permalink.length > 0 &&
    validIso(instagram?.publishedAtIso) &&
    instagram?.actionCount === 0;
  const youtubeBaseValid =
    ["not_started", "checking", "uploading", "uploaded", "unknown"].includes(
      youtube?.status,
    ) &&
    ["confirmed_not_published", "confirmed_published", "unknown"].includes(
      youtube?.outcome,
    ) &&
    CHANNEL_ID_RE.test(strictString(youtube?.channelId));
  const youtubePublished =
    youtube?.outcome === "confirmed_published";
  const youtubeValueValid = youtubePublished
    ? YOUTUBE_VIDEO_ID_RE.test(
        strictString(youtube?.videoId),
      ) &&
      youtube?.url ===
        `https://www.youtube.com/shorts/${youtube.videoId}` &&
      validIso(youtube?.publishedAtIso)
    : youtube?.videoId === null &&
      youtube?.url === null &&
      youtube?.publishedAtIso === null;
  const ledgerValid =
    typeof ledger?.writeOk === "boolean" &&
    typeof ledger?.readbackOk === "boolean" &&
    (ledger?.writeLockReleased === null ||
      typeof ledger?.writeLockReleased === "boolean") &&
    (ledger?.recordedKey === null ||
      typeof ledger?.recordedKey === "string") &&
    (ledger?.publishedId === null ||
      typeof ledger?.publishedId === "string") &&
    (ledger?.readbackSha256 === null ||
      SHA256_RE.test(strictString(ledger?.readbackSha256)));
  return (
    instagramValid &&
    youtubeBaseValid &&
    youtubeValueValid &&
    ledgerValid
  );
}

function validEventTransitionInvariant({
  transition,
  publicState,
  counters,
}) {
  const index =
    MONEY_SHORTS_PART2_YOUTUBE_RECOVERY_EXECUTION_TRANSITIONS.indexOf(
      transition,
    );
  if (index < 0) return false;
  const expected = {
    youtubeChannelVerificationCount: index >= 2 ? 1 : 0,
    youtubeInsertCount: index >= 4 ? 1 : 0,
    instagramActionCount: 0,
    blobMutationCount: 0,
    ledgerWriteCount: index >= 6 ? 1 : 0,
    databaseMutationCount: 0,
    credentialReadCount: 3,
    youtubeApiInvocationCount:
      index >= 4 ? 2 : index >= 2 ? 1 : 0,
    recoveryEvidenceWriteCount: index + 2,
    credentialValuePrintCount: 0,
  };
  if (!sameValue(counters, expected)) return false;

  const youtube = publicState.youtube;
  const ledger = publicState.ledger;
  const youtubeExpected =
    index === 0
      ? youtube.status === "not_started" &&
        youtube.outcome === "confirmed_not_published"
      : index <= 2
        ? youtube.status === "checking" &&
          youtube.outcome === "confirmed_not_published"
        : index === 3
          ? youtube.status === "uploading" &&
            youtube.outcome === "confirmed_not_published"
          : youtube.status === "uploaded" &&
            youtube.outcome === "confirmed_published";
  const ledgerExpected =
    index < 6
      ? ledger.writeOk === false &&
        ledger.readbackOk === false &&
        ledger.recordedKey === null &&
        ledger.publishedId === null &&
        ledger.readbackSha256 === null
      : ledger.writeOk === true &&
        ledger.readbackOk === true &&
        typeof ledger.recordedKey === "string" &&
        ledger.recordedKey.length > 0 &&
        ledger.publishedId === youtube.videoId &&
        SHA256_RE.test(strictString(ledger.readbackSha256));
  return youtubeExpected && ledgerExpected;
}

export function buildMoneyShortsPart2YoutubeRecoveryExecutionClaim({
  plan,
  executionPreflightFingerprint,
  claimedAtIso,
  claimId = randomUUID(),
}) {
  if (
    validateMoneyShortsPart2YoutubeRecoveryExecutionPlan(
      plan,
    ).valid !== true ||
    !SHA256_RE.test(
      strictString(executionPreflightFingerprint),
    ) ||
    !validIso(claimedAtIso) ||
    !PUBLIC_ID_RE.test(strictString(claimId))
  ) {
    return null;
  }
  const stable = {
    schemaVersion:
      MONEY_SHORTS_PART2_YOUTUBE_RECOVERY_EXECUTION_VERSION,
    evidenceType: "claim",
    claimId,
    claimedAtIso,
    planFingerprint: plan.planFingerprint,
    executionPreflightFingerprint,
    sourceReviewPreflightFingerprint:
      plan.sourceReviewPreflightFingerprint,
    sourceReviewPlanFingerprint:
      plan.sourceReviewPlanFingerprint,
    currentBinding: structuredClone(plan.currentBinding),
    instagram: structuredClone(plan.instagramRecovery),
    youtubeBinding: {
      sourceSha256: plan.youtube.sourceSha256,
      metadataSha256: plan.youtube.metadataSha256,
      variantId: plan.youtube.variantId,
      channelId: plan.youtube.expectedChannelId,
    },
    ledgerBaselineSha256: plan.ledger.sha256,
    expectedYoutubeLedgerKey:
      plan.ledger.expectedYoutubeKey,
    safety: {
      automaticRetryAllowed: false,
      instagramActionAllowed: false,
      blobMutationAllowed: false,
      databaseMutationAllowed: false,
      part1ActionAllowed: false,
      credentialValuePrintAllowed: false,
    },
  };
  return withFingerprint(stable, "claimFingerprint");
}

export function validateMoneyShortsPart2YoutubeRecoveryExecutionClaim(
  evidence,
) {
  const valid =
    validSelfFingerprint(evidence, "claimFingerprint") &&
    evidence.schemaVersion ===
      MONEY_SHORTS_PART2_YOUTUBE_RECOVERY_EXECUTION_VERSION &&
    evidence.evidenceType === "claim" &&
    PUBLIC_ID_RE.test(strictString(evidence.claimId)) &&
    validIso(evidence.claimedAtIso) &&
    SHA256_RE.test(strictString(evidence.planFingerprint)) &&
    SHA256_RE.test(
      strictString(evidence.executionPreflightFingerprint),
    ) &&
    SHA256_RE.test(
      strictString(evidence.sourceReviewPreflightFingerprint),
    ) &&
    evidence.currentBinding?.productionPartId === "part-2" &&
    CONTENT_ID_RE.test(
      strictString(evidence.currentBinding?.contentId),
    ) &&
    evidence.instagram?.status ===
      "PART2_INSTAGRAM_RECOVERY_OK" &&
    CHANNEL_ID_RE.test(
      strictString(evidence.youtubeBinding?.channelId),
    ) &&
    SHA256_RE.test(
      strictString(evidence.youtubeBinding?.sourceSha256),
    ) &&
    SHA256_RE.test(
      strictString(evidence.ledgerBaselineSha256),
    ) &&
    evidence.expectedYoutubeLedgerKey ===
      `${evidence.currentBinding.contentId}/youtube_shorts/${evidence.currentBinding.version}` &&
    evidence.safety?.automaticRetryAllowed === false &&
    evidence.safety?.instagramActionAllowed === false &&
    evidence.safety?.blobMutationAllowed === false &&
    evidence.safety?.databaseMutationAllowed === false &&
    evidence.safety?.part1ActionAllowed === false &&
    evidence.safety?.credentialValuePrintAllowed === false;
  return {
    valid,
    reason: valid
      ? "part2_youtube_recovery_execution_claim_valid"
      : "part2_youtube_recovery_execution_claim_invalid",
  };
}

export function buildMoneyShortsPart2YoutubeRecoveryExecutionEvent({
  claim,
  previousEvidenceSha256,
  previousTransition = null,
  transition,
  recordedAtIso,
  publicState,
  sideEffectCounters,
}) {
  const sequence =
    MONEY_SHORTS_PART2_YOUTUBE_RECOVERY_EXECUTION_TRANSITIONS.indexOf(
      transition,
    );
  const previousSequence =
    previousTransition === null
      ? -1
      : MONEY_SHORTS_PART2_YOUTUBE_RECOVERY_EXECUTION_TRANSITIONS.indexOf(
          previousTransition,
        );
  const counters = canonicalCounters(sideEffectCounters);
  if (
    validateMoneyShortsPart2YoutubeRecoveryExecutionClaim(
      claim,
    ).valid !== true ||
    !SHA256_RE.test(strictString(previousEvidenceSha256)) ||
    sequence < 0 ||
    sequence !== previousSequence + 1 ||
    !validIso(recordedAtIso) ||
    !validPublicState(publicState) ||
    publicState.instagram.mediaId !==
      claim.instagram.mediaId ||
    publicState.instagram.permalink !==
      claim.instagram.permalink ||
    publicState.instagram.publishedAtIso !==
      claim.instagram.publishedAtIso ||
    publicState.youtube.channelId !==
      claim.youtubeBinding.channelId ||
    (publicState.ledger.recordedKey !== null &&
      publicState.ledger.recordedKey !==
        claim.expectedYoutubeLedgerKey) ||
    counters === null ||
    !validEventTransitionInvariant({
      transition,
      publicState,
      counters,
    })
  ) {
    return null;
  }
  const stable = {
    schemaVersion:
      MONEY_SHORTS_PART2_YOUTUBE_RECOVERY_EXECUTION_VERSION,
    evidenceType: "event",
    claimId: claim.claimId,
    claimFingerprint: claim.claimFingerprint,
    sequence: sequence + 1,
    transition,
    previousEvidenceSha256,
    recordedAtIso,
    publicState: structuredClone(publicState),
    sideEffectCounters: counters,
  };
  return withFingerprint(stable, "eventFingerprint");
}

export function validateMoneyShortsPart2YoutubeRecoveryExecutionEvent({
  evidence,
  claim,
  previousEvidenceSha256,
  previousTransition,
}) {
  const rebuilt =
    buildMoneyShortsPart2YoutubeRecoveryExecutionEvent({
      claim,
      previousEvidenceSha256,
      previousTransition,
      transition: evidence?.transition,
      recordedAtIso: evidence?.recordedAtIso,
      publicState: evidence?.publicState,
      sideEffectCounters: evidence?.sideEffectCounters,
    });
  const valid = rebuilt !== null && sameValue(rebuilt, evidence);
  return {
    valid,
    reason: valid
      ? "part2_youtube_recovery_execution_event_valid"
      : "part2_youtube_recovery_execution_event_invalid",
  };
}

export function buildMoneyShortsPart2YoutubeRecoveryExecutionResult({
  claim,
  latestEvent,
  latestEventFileSha256,
  latestEventSha256,
  latestTransition,
  status,
  blockerCode,
  completedAtIso,
  publicState,
  sideEffectCounters,
}) {
  const counters = canonicalCounters(sideEffectCounters);
  const latestCounters = canonicalCounters(
    latestEvent?.sideEffectCounters,
  );
  const youtube = publicState?.youtube;
  const ledger = publicState?.ledger;
  const youtubeConfirmed =
    youtube?.outcome === "confirmed_published" &&
    YOUTUBE_VIDEO_ID_RE.test(strictString(youtube?.videoId)) &&
    youtube?.url ===
      `https://www.youtube.com/shorts/${youtube?.videoId}`;
  const statusInvariant =
    status === "FAILED_BEFORE_YOUTUBE_INSERT"
      ? counters?.youtubeInsertCount === 0 &&
        youtube?.outcome === "confirmed_not_published" &&
        ["not_started", "checking"].includes(
          youtube?.status,
        ) &&
        youtube?.videoId === null &&
        ledger?.writeOk !== true
      : status === "YOUTUBE_UPLOAD_OUTCOME_UNKNOWN"
        ? counters?.youtubeInsertCount === 1 &&
          youtube?.outcome === "unknown" &&
          youtube?.videoId === null &&
          ledger?.writeOk !== true &&
          latestTransition === "youtube_insert_intent"
        : status === "BOTH_PUBLISHED_LEDGER_MISSING"
          ? counters?.youtubeInsertCount === 1 &&
            youtubeConfirmed &&
            ledger?.writeOk !== true &&
            [
              "youtube_insert_confirmed",
              "ledger_write_intent",
            ].includes(latestTransition)
          : status ===
              "YOUTUBE_AND_LEDGER_CONFIRMED_RECOVERY_EVIDENCE_INCOMPLETE"
            ? counters?.youtubeInsertCount === 1 &&
              youtubeConfirmed &&
              ledger?.writeOk === true &&
              ledger?.readbackOk === true &&
              ledger?.recordedKey ===
                claim?.expectedYoutubeLedgerKey &&
              ledger?.publishedId === youtube?.videoId &&
              SHA256_RE.test(
                strictString(ledger?.readbackSha256),
              ) &&
              [
                "ledger_write_intent",
                "ledger_write_confirmed",
              ].includes(latestTransition)
            : status === "PART2_YOUTUBE_RECOVERY_OK"
              ? counters?.youtubeChannelVerificationCount === 1 &&
                counters?.youtubeInsertCount === 1 &&
                counters?.youtubeApiInvocationCount === 2 &&
                counters?.ledgerWriteCount === 1 &&
                counters?.credentialReadCount === 3 &&
                counters?.recoveryEvidenceWriteCount === 10 &&
                youtubeConfirmed &&
                ledger?.writeOk === true &&
                ledger?.readbackOk === true &&
                ledger?.recordedKey ===
                  claim?.expectedYoutubeLedgerKey &&
                ledger?.publishedId === youtube?.videoId &&
                SHA256_RE.test(
                  strictString(ledger?.readbackSha256),
                ) &&
                latestTransition === "complete"
              : false;
  const blockerValid =
    status === "PART2_YOUTUBE_RECOVERY_OK"
      ? blockerCode === null
      : /^[A-Z0-9_]{3,180}$/.test(
          strictString(blockerCode),
        );
  const expectedCounterDelta =
    latestTransition === "youtube_channel_verify_intent"
      ? {
          youtubeChannelVerificationCount: 1,
          youtubeApiInvocationCount: 1,
        }
      : latestTransition === "youtube_insert_intent"
        ? {
            youtubeInsertCount: 1,
            youtubeApiInvocationCount: 1,
          }
        : latestTransition === "ledger_write_intent"
          ? { ledgerWriteCount: 1 }
          : {};
  const countersFollowLatestEvent =
    latestCounters !== null &&
    COUNTER_NAMES.every((name) => {
      const expectedDelta =
        name === "recoveryEvidenceWriteCount"
          ? 1
          : expectedCounterDelta[name] ?? 0;
      return (
        counters?.[name] ===
        latestCounters[name] + expectedDelta
      );
    });
  const latestEventBindingValid =
    isPlainObject(latestEvent) &&
    latestEvent.claimId === claim?.claimId &&
    latestEvent.claimFingerprint ===
      claim?.claimFingerprint &&
    latestEvent.transition === latestTransition &&
    latestEventFileSha256 === latestEventSha256 &&
    SHA256_RE.test(strictString(latestEventFileSha256)) &&
    latestEventFileSha256 ===
      sha256(`${JSON.stringify(latestEvent, null, 2)}\n`) &&
    validIso(latestEvent.recordedAtIso) &&
    Date.parse(completedAtIso) >=
      Date.parse(latestEvent.recordedAtIso) &&
    countersFollowLatestEvent;
  const stateFollowsLatestEvent =
    sameValue(
      publicState.instagram,
      latestEvent?.publicState?.instagram,
    ) &&
    (latestTransition === "youtube_insert_intent"
      ? youtube?.outcome === "unknown" &&
        youtube?.videoId === null
      : sameValue(
          youtube,
          latestEvent?.publicState?.youtube,
        )) &&
    (latestTransition === "ledger_write_intent"
      ? true
      : sameValue(
          ledger,
          latestEvent?.publicState?.ledger,
        ));
  if (
    validateMoneyShortsPart2YoutubeRecoveryExecutionClaim(
      claim,
    ).valid !== true ||
    counters === null ||
    !SHA256_RE.test(strictString(latestEventSha256)) ||
    !MONEY_SHORTS_PART2_YOUTUBE_RECOVERY_EXECUTION_TRANSITIONS.includes(
      latestTransition,
    ) ||
    !RESULT_STATUSES.has(status) ||
    !blockerValid ||
    !validIso(completedAtIso) ||
    !latestEventBindingValid ||
    !stateFollowsLatestEvent ||
    !validPublicState(publicState) ||
    publicState.instagram.mediaId !==
      claim.instagram.mediaId ||
    publicState.instagram.permalink !==
      claim.instagram.permalink ||
    publicState.instagram.publishedAtIso !==
      claim.instagram.publishedAtIso ||
    youtube?.channelId !== claim.youtubeBinding.channelId ||
    counters.instagramActionCount !== 0 ||
    counters.blobMutationCount !== 0 ||
    counters.databaseMutationCount !== 0 ||
    counters.credentialValuePrintCount !== 0 ||
    !statusInvariant
  ) {
    return null;
  }
  const stable = {
    schemaVersion:
      MONEY_SHORTS_PART2_YOUTUBE_RECOVERY_EXECUTION_VERSION,
    evidenceType: "result",
    status,
    blockerCode,
    claimId: claim.claimId,
    claimFingerprint: claim.claimFingerprint,
    planFingerprint: claim.planFingerprint,
    executionPreflightFingerprint:
      claim.executionPreflightFingerprint,
    sourceReviewPreflightFingerprint:
      claim.sourceReviewPreflightFingerprint,
    currentBinding: structuredClone(claim.currentBinding),
    latestEventSha256,
    latestTransition,
    completedAtIso,
    publicState: structuredClone(publicState),
    sideEffectCounters: counters,
    safety: structuredClone(claim.safety),
  };
  return withFingerprint(stable, "resultFingerprint");
}

export function validateMoneyShortsPart2YoutubeRecoveryExecutionResult({
  evidence,
  claim,
  latestEvent,
  latestEventFileSha256,
}) {
  const rebuilt =
    buildMoneyShortsPart2YoutubeRecoveryExecutionResult({
      claim,
      latestEvent,
      latestEventFileSha256,
      latestEventSha256: evidence?.latestEventSha256,
      latestTransition: evidence?.latestTransition,
      status: evidence?.status,
      blockerCode: evidence?.blockerCode,
      completedAtIso: evidence?.completedAtIso,
      publicState: evidence?.publicState,
      sideEffectCounters: evidence?.sideEffectCounters,
    });
  const valid = rebuilt !== null && sameValue(rebuilt, evidence);
  return {
    valid,
    reason: valid
      ? "part2_youtube_recovery_execution_result_valid"
      : "part2_youtube_recovery_execution_result_invalid",
  };
}

export function moneyShortsPart2YoutubeRecoveryExecutionPaths(
  recoveryOutDir,
) {
  const root = resolve(recoveryOutDir);
  const evidenceDir = join(
    root,
    MONEY_SHORTS_PART2_YOUTUBE_RECOVERY_EXECUTION_DIRNAME,
  );
  const eventDir = join(evidenceDir, "events");
  return {
    root,
    evidenceDir,
    preflightPath: join(
      evidenceDir,
      MONEY_SHORTS_PART2_YOUTUBE_RECOVERY_EXECUTION_PREFLIGHT_FILENAME,
    ),
    claimPath: join(
      evidenceDir,
      MONEY_SHORTS_PART2_YOUTUBE_RECOVERY_EXECUTION_CLAIM_FILENAME,
    ),
    eventDir,
    resultPath: join(
      evidenceDir,
      MONEY_SHORTS_PART2_YOUTUBE_RECOVERY_EXECUTION_RESULT_FILENAME,
    ),
    lockPath: join(
      root,
      ".part2-youtube-recovery-execution-v1.lock",
    ),
  };
}

export function moneyShortsPart2YoutubeRecoveryExecutionEventPath(
  eventDir,
  transition,
) {
  const index =
    MONEY_SHORTS_PART2_YOUTUBE_RECOVERY_EXECUTION_TRANSITIONS.indexOf(
      transition,
    );
  return index < 0
    ? null
    : join(
        eventDir,
        `${String(index + 1).padStart(2, "0")}-${transition}.json`,
      );
}

function mapWriteReason(reason) {
  const mapping = {
    recovery_evidence_write_input_invalid:
      "PART2_YOUTUBE_RECOVERY_EXECUTION_EVIDENCE_WRITE_INPUT_INVALID",
    recovery_evidence_exists_or_orphaned_manual_review_required:
      "PART2_YOUTUBE_RECOVERY_EXECUTION_EVIDENCE_EXISTS_OR_ORPHANED",
    recovery_evidence_write_failed:
      "PART2_YOUTUBE_RECOVERY_EXECUTION_EVIDENCE_WRITE_FAILED",
    recovery_evidence_readback_mismatch:
      "PART2_YOUTUBE_RECOVERY_EXECUTION_EVIDENCE_READBACK_MISMATCH",
    recovery_evidence_readback_failed:
      "PART2_YOUTUBE_RECOVERY_EXECUTION_EVIDENCE_READBACK_FAILED",
  };
  return mapping[reason] ??
    "PART2_YOUTUBE_RECOVERY_EXECUTION_EVIDENCE_WRITE_FAILED";
}

export function writeMoneyShortsPart2YoutubeRecoveryExecutionEvidenceOnce({
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
    ? { ...result, reason: null }
    : { ...result, reason: mapWriteReason(result.reason) };
}

export function writeMoneyShortsPart2YoutubeRecoveryExecutionPreflight({
  path,
  evidence,
  fsImpl,
}) {
  return writeMoneyShortsPart2YoutubeRecoveryExecutionEvidenceOnce({
    path,
    evidence,
    fingerprintField: "preflightFingerprint",
    ...(fsImpl ? { fsImpl } : {}),
  });
}

export function acquireMoneyShortsPart2YoutubeRecoveryExecutionLock({
  lockPath,
  fsImpl,
}) {
  const result = acquireMoneyShortsYoutubeOnlyRecoveryLock({
    lockPath,
    ...(fsImpl ? { fsImpl } : {}),
  });
  return result.ok === true
    ? result
    : {
        ...result,
        reason:
          "PART2_YOUTUBE_RECOVERY_EXECUTION_LOCK_ACTIVE_OR_ORPHANED",
      };
}

export function releaseMoneyShortsPart2YoutubeRecoveryExecutionLock({
  lock,
  fsImpl,
}) {
  const result = releaseMoneyShortsYoutubeOnlyRecoveryLock({
    lock,
    ...(fsImpl ? { fsImpl } : {}),
  });
  return result.ok === true
    ? result
    : {
        ...result,
        reason:
          "PART2_YOUTUBE_RECOVERY_EXECUTION_LOCK_RELEASE_FAILED",
      };
}
