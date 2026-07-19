import { createHash, randomUUID } from "node:crypto";
import * as nodeFs from "node:fs";
import { basename, dirname, join } from "node:path";

import {
  normalizeMoneyShortsPublishAttemptBinding,
} from "./money-shorts-publish-attempt-journal.mjs";

export const MONEY_SHORTS_YOUTUBE_ONLY_RECOVERY_VERSION =
  "money_shorts_youtube_only_part1_recovery_v1";
export const MONEY_SHORTS_YOUTUBE_ONLY_RECOVERY_APPROVAL =
  "APPROVE_YOUTUBE_ONLY_PART1_RECOVERY_V1";
export const MONEY_SHORTS_YOUTUBE_ONLY_RECOVERY_PREFLIGHT_FILENAME =
  "youtube-only-part1-recovery-preflight.json";
export const MONEY_SHORTS_YOUTUBE_ONLY_RECOVERY_DIRNAME =
  "youtube-only-part1-recovery-v1";
export const MONEY_SHORTS_YOUTUBE_ONLY_RECOVERY_CLAIM_FILENAME =
  "claim.json";
export const MONEY_SHORTS_YOUTUBE_ONLY_RECOVERY_RESULT_FILENAME =
  "result.json";

const SHA256_RE = /^[a-f0-9]{64}$/;
const CHANNEL_ID_RE = /^UC[A-Za-z0-9_-]{22}$/;
const PUBLIC_ID_RE = /^[A-Za-z0-9._:-]{1,200}$/;
const YOUTUBE_VIDEO_ID_RE = /^[A-Za-z0-9_-]{6,30}$/;
const RESULT_STATUSES = new Set([
  "FAILED_BEFORE_YOUTUBE_INSERT",
  "YOUTUBE_UPLOAD_OUTCOME_UNKNOWN",
  "BOTH_PUBLISHED_LEDGER_MISSING",
  "YOUTUBE_AND_LEDGER_CONFIRMED_RECOVERY_EVIDENCE_INCOMPLETE",
  "YOUTUBE_ONLY_RECOVERY_OK",
]);
const EVENT_TRANSITIONS = Object.freeze([
  "external_execution_ready",
  "youtube_channel_verify_intent",
  "youtube_channel_verify_confirmed",
  "youtube_insert_intent",
  "youtube_insert_confirmed",
  "ledger_write_intent",
  "ledger_write_confirmed",
  "complete",
]);
const SIDE_EFFECT_COUNTER_NAMES = Object.freeze([
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
const RECOVERY_EVIDENCE_PATH_NAMES = Object.freeze([
  "sourcePublishDir",
  "recoveryOutDir",
  "contentUnitManifestPath",
  "originalResultPath",
  "originalAttemptClaimPath",
  "originalAttemptJournalDir",
  "ownerResolutionPath",
  "ledgerPath",
  "instagramSourcePath",
  "youtubeSourcePath",
]);

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
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

function canonicalSideEffectCounters(value) {
  if (
    !isPlainObject(value) ||
    Object.keys(value).length !==
      SIDE_EFFECT_COUNTER_NAMES.length ||
    !SIDE_EFFECT_COUNTER_NAMES.every(
      (name) =>
        Object.hasOwn(value, name) &&
        Number.isSafeInteger(value[name]) &&
        value[name] >= 0,
    )
  ) {
    return null;
  }
  return Object.fromEntries(
    SIDE_EFFECT_COUNTER_NAMES.map((name) => [
      name,
      value[name],
    ]),
  );
}

function zeroSideEffectCounters() {
  return Object.fromEntries(
    SIDE_EFFECT_COUNTER_NAMES.map((name) => [name, 0]),
  );
}

function validAttemptEvidence(value) {
  return (
    value?.present === true &&
    value?.journalValid === true &&
    SHA256_RE.test(strictString(value?.claimSha256)) &&
    Number.isSafeInteger(value?.eventCount) &&
    value.eventCount > 0 &&
    value?.latestTransition === "youtube_insert_intent" &&
    validIso(value?.latestRecordedAtIso) &&
    SHA256_RE.test(strictString(value?.latestEventSha256))
  )
    ? {
        claimSha256: value.claimSha256,
        eventCount: value.eventCount,
        latestTransition: value.latestTransition,
        latestRecordedAtIso: value.latestRecordedAtIso,
        latestEventSha256: value.latestEventSha256,
      }
    : null;
}

function fingerprintObject(value) {
  return sha256(JSON.stringify(value));
}

function validEvidencePaths(value) {
  return (
    isPlainObject(value) &&
    Object.keys(value).length ===
      RECOVERY_EVIDENCE_PATH_NAMES.length &&
    RECOVERY_EVIDENCE_PATH_NAMES.every(
      (name) =>
        Object.hasOwn(value, name) &&
        typeof value[name] === "string" &&
        value[name].length > 0,
    )
  );
}

function normalizeBinding(value) {
  return normalizeMoneyShortsPublishAttemptBinding(value);
}

function validBinding(value) {
  const binding = normalizeBinding(value);
  return (
    binding.contentId.length > 0 &&
    binding.version.length > 0 &&
    binding.productionPartId === "part-1" &&
    binding.contentUnitManifestPath.length > 0 &&
    SHA256_RE.test(binding.contentUnitSha256) &&
    SHA256_RE.test(binding.instagramSourceSha256) &&
    SHA256_RE.test(binding.youtubeSourceSha256) &&
    SHA256_RE.test(binding.publishMetadataSha256) &&
    SHA256_RE.test(binding.finalVideoApprovalFingerprint)
  )
    ? binding
    : null;
}

function validYoutubeMetadata(value) {
  if (!isPlainObject(value)) return false;
  const title = strictString(value.titleWithShortsSuffix);
  const titleBase = strictString(value.titleBase);
  const description = strictString(value.descriptionBase);
  return (
    titleBase.length > 0 &&
    title.length > 0 &&
    title.length <= 100 &&
    title.includes("#Shorts") &&
    description.length >= 60 &&
    description.length <= 5000 &&
    Array.isArray(value.tags) &&
    value.tags.length >= 3 &&
    value.tags.length <= 8 &&
    new Set(value.tags).size === value.tags.length &&
    value.tags.every(
      (tag) =>
        typeof tag === "string" &&
        tag.length > 0 &&
        tag.length <= 500,
    ) &&
    typeof value.categoryId === "string" &&
    /^[0-9]{1,3}$/.test(value.categoryId) &&
    typeof value.defaultLanguage === "string" &&
    value.defaultLanguage.length > 0 &&
    ["private", "unlisted", "public"].includes(
      value.privacyStatus,
    ) &&
    typeof value.selfDeclaredMadeForKids === "boolean" &&
    typeof value.containsSyntheticMedia === "boolean"
  );
}

function validInstagramPermalink(value) {
  if (typeof value !== "string") return false;
  try {
    const parsed = new URL(value);
    const segments = parsed.pathname
      .split("/")
      .filter(Boolean);
    const validPath =
      (segments.length === 2 &&
        segments[0] === "reel") ||
      (segments.length === 3 &&
        /^[A-Za-z0-9._]+$/.test(segments[0]) &&
        segments[1] === "reel");
    return (
      parsed.protocol === "https:" &&
      parsed.hostname === "www.instagram.com" &&
      parsed.username === "" &&
      parsed.password === "" &&
      parsed.port === "" &&
      parsed.search === "" &&
      parsed.hash === "" &&
      validPath &&
      /^[A-Za-z0-9_-]{5,80}$/.test(
        segments.at(-1) ?? "",
      ) &&
      value ===
        `https://www.instagram.com/${segments.join("/")}/`
    );
  } catch {
    return false;
  }
}

function validateRecoveryPlan(plan) {
  if (!isPlainObject(plan)) return false;
  const { planFingerprint, ...stable } = plan;
  const binding = validBinding(plan.currentBinding);
  return (
    plan.schemaVersion ===
      MONEY_SHORTS_YOUTUBE_ONLY_RECOVERY_VERSION &&
    plan.mode === "youtube_only_part1_recovery" &&
    SHA256_RE.test(strictString(planFingerprint)) &&
    planFingerprint === fingerprintObject(stable) &&
    binding !== null &&
    SHA256_RE.test(strictString(plan.originalResultSha256)) &&
    SHA256_RE.test(
      strictString(plan.originalAttemptClaimSha256),
    ) &&
    validAttemptEvidence({
      present: true,
      journalValid: true,
      ...plan.originalAttemptJournal,
    }) !== null &&
    plan.originalAttemptJournal.claimSha256 ===
      plan.originalAttemptClaimSha256 &&
    SHA256_RE.test(strictString(plan.recoveryFingerprint)) &&
    SHA256_RE.test(
      strictString(plan.ownerResolutionSha256),
    ) &&
    SHA256_RE.test(
      strictString(plan.ownerResolutionFingerprint),
    ) &&
    CHANNEL_ID_RE.test(strictString(plan.expectedChannelId)) &&
    validEvidencePaths(plan.evidencePaths) &&
    plan.instagram?.outcome === "confirmed_published" &&
    PUBLIC_ID_RE.test(strictString(plan.instagram?.mediaId)) &&
    validInstagramPermalink(plan.instagram?.permalink) &&
    validIso(plan.instagram?.publishedAtIso) &&
    plan.instagram?.actionAllowed === false &&
    plan.instagram?.sourcePath ===
      plan.evidencePaths.instagramSourcePath &&
    plan.instagram?.sourceSha256 ===
      binding?.instagramSourceSha256 &&
    plan.youtube?.outcome === "confirmed_not_published" &&
    plan.youtube?.videoId === null &&
    typeof plan.youtube?.sourcePath === "string" &&
    plan.youtube.sourcePath.length > 0 &&
    SHA256_RE.test(strictString(plan.youtube?.sourceSha256)) &&
    plan.youtube.sourceSha256 ===
      binding?.youtubeSourceSha256 &&
    Number.isSafeInteger(plan.youtube?.sourceSizeBytes) &&
    plan.youtube.sourceSizeBytes > 0 &&
    typeof plan.youtube?.variantId === "string" &&
    plan.youtube.variantId.length > 0 &&
    SHA256_RE.test(strictString(plan.youtube?.metadataSha256)) &&
    plan.youtube.metadataSha256 ===
      binding?.publishMetadataSha256 &&
    validYoutubeMetadata(plan.youtube?.metadata) &&
    plan.youtube.metadata.categoryId === "27" &&
    plan.youtube.metadata.defaultLanguage === "ko" &&
    plan.youtube.metadata.privacyStatus === "public" &&
    plan.youtube.metadata.selfDeclaredMadeForKids === false &&
    plan.youtube.metadata.containsSyntheticMedia === true &&
    plan.youtube.channelId === plan.expectedChannelId &&
    plan.evidencePaths.contentUnitManifestPath ===
      binding?.contentUnitManifestPath &&
    plan.evidencePaths.youtubeSourcePath ===
      plan.youtube.sourcePath &&
    SHA256_RE.test(strictString(plan.ledger?.sha256)) &&
    plan.ledger?.instagramAlreadyPublished === false &&
    plan.ledger?.youtubeAlreadyPublished === false &&
    plan.safety?.blobMutationAllowed === false &&
    plan.safety?.instagramPublishAllowed === false &&
    plan.safety?.youtubePublishAllowed === false &&
    plan.safety?.ledgerMutationAllowed === false &&
    plan.safety?.automaticRetryCount === 0 &&
    plan.safety?.externalActionCount === 0
  );
}

function validateRecoveryClaim(claim) {
  if (!isPlainObject(claim)) return false;
  return (
    evidenceFingerprint(claim, "claimFingerprint") !== null &&
    claim.schemaVersion ===
      MONEY_SHORTS_YOUTUBE_ONLY_RECOVERY_VERSION &&
    claim.evidenceType === "claim" &&
    PUBLIC_ID_RE.test(strictString(claim.claimId)) &&
    validIso(claim.claimedAtIso) &&
    SHA256_RE.test(strictString(claim.planFingerprint)) &&
    SHA256_RE.test(strictString(claim.preflightFingerprint)) &&
    SHA256_RE.test(strictString(claim.recoveryFingerprint)) &&
    SHA256_RE.test(
      strictString(claim.ownerResolutionSha256),
    ) &&
    SHA256_RE.test(
      strictString(claim.ownerResolutionFingerprint),
    ) &&
    SHA256_RE.test(
      strictString(claim.originalResultSha256),
    ) &&
    SHA256_RE.test(
      strictString(claim.originalAttemptClaimSha256),
    ) &&
    CHANNEL_ID_RE.test(strictString(claim.expectedChannelId)) &&
    validBinding(claim.currentBinding) !== null &&
    claim.instagram?.outcome === "confirmed_published" &&
    PUBLIC_ID_RE.test(strictString(claim.instagram?.mediaId)) &&
    validInstagramPermalink(claim.instagram?.permalink) &&
    validIso(claim.instagram?.publishedAtIso) &&
    claim.instagram?.actionAllowed === false &&
    claim.instagram?.sourceSha256 ===
      claim.currentBinding.instagramSourceSha256 &&
    typeof claim.instagram?.sourcePath === "string" &&
    claim.instagram.sourcePath.length > 0 &&
    claim.youtubeBinding?.sourceSha256 ===
      claim.currentBinding.youtubeSourceSha256 &&
    claim.youtubeBinding?.metadataSha256 ===
      claim.currentBinding.publishMetadataSha256 &&
    typeof claim.youtubeBinding?.variantId === "string" &&
    claim.youtubeBinding.variantId.length > 0 &&
    claim.youtubeBinding?.channelId ===
      claim.expectedChannelId &&
    SHA256_RE.test(
      strictString(claim.ledgerBaselineSha256),
    ) &&
    claim.safety?.automaticRetryAllowed === false &&
    claim.safety?.instagramPublishAllowed === false &&
    claim.safety?.blobMutationAllowed === false &&
    claim.safety?.part2PublishAllowed === false
  );
}

function validPublicState(value) {
  if (
    !isPlainObject(value) ||
    Object.keys(value).length !== 3 ||
    !isPlainObject(value.instagram) ||
    !isPlainObject(value.youtube) ||
    !isPlainObject(value.ledger)
  ) {
    return false;
  }
  const instagram = value.instagram;
  const youtube = value.youtube;
  const ledger = value.ledger;
  const instagramValid =
    Object.keys(instagram).length === 5 &&
    instagram.outcome === "confirmed_published" &&
    PUBLIC_ID_RE.test(strictString(instagram.mediaId)) &&
    validInstagramPermalink(instagram.permalink) &&
    validIso(instagram.publishedAtIso) &&
    instagram.actionCount === 0;
  const videoId =
    youtube.videoId === null
      ? null
      : strictString(youtube.videoId);
  const youtubeValid =
    Object.keys(youtube).length === 6 &&
    [
      "not_started",
      "unknown",
      "uploaded",
    ].includes(youtube.status) &&
    [
      "confirmed_not_published",
      "unknown",
      "confirmed_published",
    ].includes(youtube.outcome) &&
    (videoId === null ||
      YOUTUBE_VIDEO_ID_RE.test(videoId)) &&
    (videoId === null
      ? youtube.url === null
      : youtube.url ===
        `https://www.youtube.com/shorts/${videoId}`) &&
    CHANNEL_ID_RE.test(strictString(youtube.channelId)) &&
    (youtube.publishedAtIso === null ||
      validIso(youtube.publishedAtIso)) &&
    (youtube.outcome !== "confirmed_published" ||
      (videoId !== null &&
        youtube.status === "uploaded" &&
        validIso(youtube.publishedAtIso)));
  const ledgerValid =
    Object.keys(ledger).length === 6 &&
    typeof ledger.writeOk === "boolean" &&
    typeof ledger.readbackOk === "boolean" &&
    (ledger.writeLockReleased === null ||
      typeof ledger.writeLockReleased === "boolean") &&
    (ledger.recordedKey === null ||
      (typeof ledger.recordedKey === "string" &&
        /^[A-Za-z0-9._:/-]{1,500}$/.test(
          ledger.recordedKey,
        ))) &&
    (ledger.publishedId === null ||
      YOUTUBE_VIDEO_ID_RE.test(
        strictString(ledger.publishedId),
      )) &&
    (ledger.readbackSha256 === null ||
      SHA256_RE.test(
        strictString(ledger.readbackSha256),
      ));
  return instagramValid && youtubeValid && ledgerValid;
}

export function validateMoneyShortsYoutubeOnlyRecoveryAuthorization({
  armed,
  approval,
  expectedRecoveryFingerprint,
  expectedResolutionSha256,
  expectedChannelId,
  expectedPreflightFingerprint,
}) {
  if (
    approval !==
    MONEY_SHORTS_YOUTUBE_ONLY_RECOVERY_APPROVAL
  ) {
    return {
      ok: false,
      reason:
        "YOUTUBE_ONLY_RECOVERY_EXACT_APPROVAL_REQUIRED",
    };
  }
  if (
    !SHA256_RE.test(strictString(expectedRecoveryFingerprint)) ||
    !SHA256_RE.test(strictString(expectedResolutionSha256)) ||
    !CHANNEL_ID_RE.test(strictString(expectedChannelId))
  ) {
    return {
      ok: false,
      reason:
        "YOUTUBE_ONLY_RECOVERY_EXPECTED_EVIDENCE_INVALID",
    };
  }
  if (
    armed === true &&
    !SHA256_RE.test(
      strictString(expectedPreflightFingerprint),
    )
  ) {
    return {
      ok: false,
      reason:
        "YOUTUBE_ONLY_RECOVERY_EXPECTED_PREFLIGHT_REQUIRED",
    };
  }
  return {
    ok: true,
    armed: armed === true,
    expectedRecoveryFingerprint,
    expectedResolutionSha256,
    expectedChannelId,
    expectedPreflightFingerprint:
      armed === true ? expectedPreflightFingerprint : null,
  };
}

/**
 * Builds one pure, no-action recovery plan from the already classified current
 * recovery state and caller-recomputed artifact facts.
 */
export function buildMoneyShortsYoutubeOnlyRecoveryPlan({
  recovery,
  contentUnit,
  artifactFacts,
  attemptEvidence,
  metadataGateOk,
  instagramPublishedAtIso,
  expectedRecoveryFingerprint,
  expectedResolutionSha256,
  expectedChannelId,
}) {
  const binding = validBinding(recovery?.currentBinding);
  const metadata = contentUnit?.youtubeMetadata;
  const artifactBinding =
    validBinding(artifactFacts?.currentBinding);
  const ownerResolution = recovery?.ownerResolution;
  const ledger = recovery?.ledger;
  const safety = recovery?.safety;
  const attempt = validAttemptEvidence(attemptEvidence);
  const evidencePaths = artifactFacts?.evidencePaths;
  const valid =
    recovery?.state === "instagram_only" &&
    recovery?.reason ===
      "owner_confirmed_instagram_published_youtube_not_published" &&
    recovery?.recoverablePlatformCandidate ===
      "youtube_shorts" &&
    recovery?.genericDualUploadBlocked === true &&
    recovery?.automaticRetryAllowed === false &&
    recovery?.externalRecoveryEnabled === false &&
    recovery?.recoveryFingerprint ===
      expectedRecoveryFingerprint &&
    SHA256_RE.test(strictString(recovery?.resultSha256)) &&
    recovery?.attemptEvidencePresent === true &&
    SHA256_RE.test(
      strictString(recovery?.attemptClaimSha256),
    ) &&
    attempt !== null &&
    attempt.claimSha256 === recovery?.attemptClaimSha256 &&
    binding !== null &&
    artifactBinding !== null &&
    JSON.stringify(binding) ===
      JSON.stringify(artifactBinding) &&
    ownerResolution?.present === true &&
    ownerResolution?.valid === true &&
    ownerResolution?.applied === true &&
    ownerResolution?.sha256 ===
      expectedResolutionSha256 &&
    SHA256_RE.test(
      strictString(
        ownerResolution?.resolutionFingerprint,
      ),
    ) &&
    ownerResolution?.youtubeChannelId ===
      expectedChannelId &&
    PUBLIC_ID_RE.test(
      strictString(recovery?.instagramMediaId),
    ) &&
    typeof ownerResolution?.instagramPermalink ===
      "string" &&
    ownerResolution.instagramPermalink.length > 0 &&
    ledger?.readOk === true &&
    ledger?.instagramAlreadyPublished === false &&
    ledger?.youtubeAlreadyPublished === false &&
    safety?.blobMutationAllowed === false &&
    safety?.instagramPublishAllowed === false &&
    safety?.youtubePublishAllowed === false &&
    safety?.ledgerMutationAllowed === false &&
    safety?.automaticRetryCount === 0 &&
    safety?.externalActionCount === 0 &&
    contentUnit?.schemaVersion ===
      "dual_platform_content_unit_v1" &&
    contentUnit?.contentId === binding?.contentId &&
    contentUnit?.version === binding?.version &&
    contentUnit?.wizardProductionPartId === "part-1" &&
    contentUnit?.sourceIntegrity?.productionPartId ===
      "part-1" &&
    contentUnit?.sourceIntegrity
      ?.finalVideoApprovalFingerprint ===
      binding?.finalVideoApprovalFingerprint &&
    contentUnit?.sourceIntegrity?.finalMp4Sha256 ===
      binding?.youtubeSourceSha256 &&
    contentUnit?.sourceIntegrity?.publishMetadataSha256 ===
      binding?.publishMetadataSha256 &&
    typeof contentUnit?.instagramSourcePath === "string" &&
    contentUnit.instagramSourcePath.length > 0 &&
    typeof contentUnit?.youtubeSourcePath === "string" &&
    contentUnit.youtubeSourcePath.length > 0 &&
    evidencePaths?.instagramSourcePath ===
      contentUnit.instagramSourcePath &&
    evidencePaths?.youtubeSourcePath ===
      contentUnit.youtubeSourcePath &&
    artifactFacts?.sourceIntegrityValid === true &&
    Number.isSafeInteger(artifactFacts?.sourceSizeBytes) &&
    artifactFacts.sourceSizeBytes > 0 &&
    typeof artifactFacts?.youtubeVariantId === "string" &&
    artifactFacts.youtubeVariantId.length > 0 &&
    SHA256_RE.test(
      strictString(artifactFacts?.ledgerSha256),
    ) &&
    validEvidencePaths(evidencePaths) &&
    metadataGateOk === true &&
    validYoutubeMetadata(metadata) &&
    metadata.categoryId === "27" &&
    metadata.defaultLanguage === "ko" &&
    metadata.privacyStatus === "public" &&
    metadata.selfDeclaredMadeForKids === false &&
    metadata.containsSyntheticMedia === true &&
    validIso(instagramPublishedAtIso);

  if (!valid) {
    return {
      ok: false,
      reason:
        "YOUTUBE_ONLY_RECOVERY_CURRENT_EVIDENCE_NOT_ELIGIBLE",
    };
  }

  const stable = {
    schemaVersion:
      MONEY_SHORTS_YOUTUBE_ONLY_RECOVERY_VERSION,
    mode: "youtube_only_part1_recovery",
    currentBinding: binding,
    originalResultSha256: recovery.resultSha256,
    originalAttemptClaimSha256:
      recovery.attemptClaimSha256,
    originalAttemptJournal: attempt,
    recoveryFingerprint:
      recovery.recoveryFingerprint,
    ownerResolutionSha256: ownerResolution.sha256,
    ownerResolutionFingerprint:
      ownerResolution.resolutionFingerprint,
    expectedChannelId,
    evidencePaths,
    instagram: {
      outcome: "confirmed_published",
      mediaId: recovery.instagramMediaId,
      permalink: ownerResolution.instagramPermalink,
      publishedAtIso: instagramPublishedAtIso,
      actionAllowed: false,
      sourcePath: contentUnit.instagramSourcePath,
      sourceSha256: binding.instagramSourceSha256,
    },
    youtube: {
      outcome: "confirmed_not_published",
      videoId: null,
      sourcePath: contentUnit.youtubeSourcePath,
      sourceSha256: binding.youtubeSourceSha256,
      sourceSizeBytes: artifactFacts.sourceSizeBytes,
      variantId: artifactFacts.youtubeVariantId,
      metadataSha256: binding.publishMetadataSha256,
      metadata,
      channelId: expectedChannelId,
    },
    ledger: {
      sha256: artifactFacts.ledgerSha256,
      instagramAlreadyPublished: false,
      youtubeAlreadyPublished: false,
    },
    safety: {
      blobMutationAllowed: false,
      instagramPublishAllowed: false,
      youtubePublishAllowed: false,
      ledgerMutationAllowed: false,
      automaticRetryCount: 0,
      externalActionCount: 0,
    },
  };
  return {
    ok: true,
    plan: {
      ...stable,
      planFingerprint: fingerprintObject(stable),
    },
  };
}

export function buildMoneyShortsYoutubeOnlyRecoveryPreflight({
  plan,
  boundAtIso,
}) {
  const { planFingerprint, ...planStable } =
    isPlainObject(plan) ? plan : {};
  if (
    !validateRecoveryPlan(plan) ||
    !SHA256_RE.test(strictString(planFingerprint)) ||
    planFingerprint !== fingerprintObject(planStable) ||
    !validIso(boundAtIso)
  ) {
    return null;
  }
  const stable = {
    schemaVersion:
      MONEY_SHORTS_YOUTUBE_ONLY_RECOVERY_VERSION,
    status: "PREFLIGHT_ONLY_OK",
    armed: false,
    planFingerprint: plan.planFingerprint,
    recoveryFingerprint: plan.recoveryFingerprint,
    ownerResolutionSha256:
      plan.ownerResolutionSha256,
    expectedChannelId: plan.expectedChannelId,
    currentBinding: plan.currentBinding,
    boundAtIso,
    sideEffectCounters: {
      ...zeroSideEffectCounters(),
    },
  };
  return {
    ...stable,
    preflightFingerprint: fingerprintObject(stable),
  };
}

export function validateMoneyShortsYoutubeOnlyRecoveryPreflight({
  evidence,
  currentPlan,
  expectedPreflightFingerprint,
}) {
  if (
    !isPlainObject(evidence) ||
    !validateRecoveryPlan(currentPlan)
  ) {
    return { valid: false, reason: "preflight_not_object" };
  }
  const {
    preflightFingerprint,
    ...stable
  } = evidence;
  const valid =
    evidence.schemaVersion ===
      MONEY_SHORTS_YOUTUBE_ONLY_RECOVERY_VERSION &&
    evidence.status === "PREFLIGHT_ONLY_OK" &&
    evidence.armed === false &&
    evidence.planFingerprint ===
      currentPlan?.planFingerprint &&
    evidence.recoveryFingerprint ===
      currentPlan?.recoveryFingerprint &&
    evidence.ownerResolutionSha256 ===
      currentPlan?.ownerResolutionSha256 &&
    evidence.expectedChannelId ===
      currentPlan?.expectedChannelId &&
    JSON.stringify(evidence.currentBinding) ===
      JSON.stringify(currentPlan?.currentBinding) &&
    SHA256_RE.test(strictString(preflightFingerprint)) &&
    preflightFingerprint ===
      expectedPreflightFingerprint &&
    preflightFingerprint === fingerprintObject(stable) &&
    JSON.stringify(evidence.sideEffectCounters) ===
      JSON.stringify(zeroSideEffectCounters());
  return {
    valid,
    reason: valid
      ? "preflight_valid"
      : "preflight_stale_or_invalid",
  };
}

export function buildMoneyShortsYoutubeOnlyRecoveryClaim({
  plan,
  preflightFingerprint,
  claimedAtIso,
  claimId = randomUUID(),
}) {
  const { planFingerprint, ...planStable } =
    isPlainObject(plan) ? plan : {};
  if (
    !validateRecoveryPlan(plan) ||
    !SHA256_RE.test(strictString(planFingerprint)) ||
    planFingerprint !== fingerprintObject(planStable) ||
    !SHA256_RE.test(strictString(preflightFingerprint)) ||
    !validIso(claimedAtIso) ||
    !PUBLIC_ID_RE.test(strictString(claimId))
  ) {
    return null;
  }
  const stable = {
    schemaVersion:
      MONEY_SHORTS_YOUTUBE_ONLY_RECOVERY_VERSION,
    evidenceType: "claim",
    claimId,
    claimedAtIso,
    planFingerprint: plan.planFingerprint,
    preflightFingerprint,
    recoveryFingerprint: plan.recoveryFingerprint,
    ownerResolutionSha256:
      plan.ownerResolutionSha256,
    ownerResolutionFingerprint:
      plan.ownerResolutionFingerprint,
    originalResultSha256:
      plan.originalResultSha256,
    originalAttemptClaimSha256:
      plan.originalAttemptClaimSha256,
    expectedChannelId: plan.expectedChannelId,
    currentBinding: plan.currentBinding,
    instagram: plan.instagram,
    youtubeBinding: {
      sourceSha256: plan.youtube.sourceSha256,
      metadataSha256: plan.youtube.metadataSha256,
      variantId: plan.youtube.variantId,
      channelId: plan.youtube.channelId,
    },
    ledgerBaselineSha256: plan.ledger.sha256,
    safety: {
      automaticRetryAllowed: false,
      instagramPublishAllowed: false,
      blobMutationAllowed: false,
      part2PublishAllowed: false,
    },
  };
  return {
    ...stable,
    claimFingerprint: fingerprintObject(stable),
  };
}

export function buildMoneyShortsYoutubeOnlyRecoveryEvent({
  claim,
  previousEvidenceSha256,
  previousTransition = null,
  transition,
  recordedAtIso,
  publicState,
  sideEffectCounters,
}) {
  const sequence = EVENT_TRANSITIONS.indexOf(transition);
  const previousSequence =
    previousTransition === null
      ? -1
      : EVENT_TRANSITIONS.indexOf(previousTransition);
  const counters =
    canonicalSideEffectCounters(sideEffectCounters);
  if (
    !validateRecoveryClaim(claim) ||
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
      claim.expectedChannelId ||
    (publicState.ledger.recordedKey !== null &&
      publicState.ledger.recordedKey !==
        `${claim.currentBinding.contentId}/youtube_shorts/${claim.currentBinding.version}`) ||
    counters === null
  ) {
    return null;
  }
  const stable = {
    schemaVersion:
      MONEY_SHORTS_YOUTUBE_ONLY_RECOVERY_VERSION,
    evidenceType: "event",
    claimId: claim.claimId,
    claimFingerprint: claim.claimFingerprint,
    sequence: sequence + 1,
    transition,
    previousEvidenceSha256,
    recordedAtIso,
    publicState,
    sideEffectCounters: counters,
  };
  return {
    ...stable,
    eventFingerprint: fingerprintObject(stable),
  };
}

export function buildMoneyShortsYoutubeOnlyRecoveryResult({
  claim,
  latestEventSha256,
  latestTransition,
  status,
  blockerCode,
  completedAtIso,
  instagram,
  youtube,
  ledger,
  sideEffectCounters,
}) {
  const counters =
    canonicalSideEffectCounters(sideEffectCounters);
  if (counters === null) return null;
  const blockerCodeValid =
    status === "YOUTUBE_ONLY_RECOVERY_OK"
      ? blockerCode === null
      : typeof blockerCode === "string" &&
        /^[A-Z0-9_]{3,160}$/.test(blockerCode);
  const instagramValid =
    instagram?.outcome === "confirmed_published" &&
    PUBLIC_ID_RE.test(strictString(instagram?.mediaId)) &&
    typeof instagram?.permalink === "string" &&
    instagram.permalink.length > 0 &&
    validIso(instagram?.publishedAtIso) &&
    instagram.mediaId === claim?.instagram?.mediaId &&
    instagram.permalink === claim?.instagram?.permalink &&
    instagram.publishedAtIso ===
      claim?.instagram?.publishedAtIso;
  const youtubeConfirmed =
    youtube?.outcome === "confirmed_published" &&
    YOUTUBE_VIDEO_ID_RE.test(strictString(youtube?.videoId)) &&
    youtube?.channelId === claim?.expectedChannelId &&
    youtube?.url ===
      `https://www.youtube.com/shorts/${youtube?.videoId}`;
  const zeroForbiddenEffects =
    counters.instagramActionCount === 0 &&
    counters.blobMutationCount === 0 &&
    counters.databaseMutationCount === 0 &&
    counters.credentialValuePrintCount === 0;
  const statusInvariant =
    status === "FAILED_BEFORE_YOUTUBE_INSERT"
      ? counters.youtubeInsertCount === 0 &&
        [
          "not_started",
          "confirmed_not_published",
        ].includes(youtube?.outcome) &&
        youtube?.videoId == null &&
        ledger?.writeOk !== true
      : status === "YOUTUBE_UPLOAD_OUTCOME_UNKNOWN"
        ? counters.youtubeInsertCount === 1 &&
          youtube?.outcome === "unknown" &&
          youtube?.videoId == null &&
          ledger?.writeOk !== true &&
          latestTransition === "youtube_insert_intent"
        : status === "BOTH_PUBLISHED_LEDGER_MISSING"
          ? counters.youtubeInsertCount === 1 &&
            youtubeConfirmed &&
            ledger?.writeOk !== true &&
            [
              "youtube_insert_confirmed",
              "ledger_write_intent",
            ].includes(latestTransition)
          : status ===
              "YOUTUBE_AND_LEDGER_CONFIRMED_RECOVERY_EVIDENCE_INCOMPLETE"
            ? counters.youtubeInsertCount === 1 &&
              youtubeConfirmed &&
              ledger?.writeOk === true &&
              ledger?.readbackOk === true &&
              ledger?.recordedKey ===
                `${claim?.currentBinding?.contentId}/youtube_shorts/${claim?.currentBinding?.version}` &&
              ledger?.publishedId === youtube?.videoId &&
              SHA256_RE.test(
                strictString(ledger?.readbackSha256),
              ) &&
              [
                "ledger_write_intent",
                "ledger_write_confirmed",
              ].includes(latestTransition)
          : status === "YOUTUBE_ONLY_RECOVERY_OK"
            ? counters.youtubeChannelVerificationCount === 1 &&
              counters.youtubeInsertCount === 1 &&
              counters.youtubeApiInvocationCount === 2 &&
              counters.ledgerWriteCount === 1 &&
              counters.credentialReadCount === 3 &&
              counters.recoveryEvidenceWriteCount === 10 &&
              youtubeConfirmed &&
              ledger?.writeOk === true &&
              ledger?.readbackOk === true &&
              ledger?.recordedKey ===
                `${claim?.currentBinding?.contentId}/youtube_shorts/${claim?.currentBinding?.version}` &&
              ledger?.publishedId === youtube?.videoId &&
              SHA256_RE.test(
                strictString(ledger?.readbackSha256),
              ) &&
              validIso(youtube?.publishedAtIso) &&
              latestTransition === "complete"
            : false;
  if (
    !validateRecoveryClaim(claim) ||
    !SHA256_RE.test(strictString(latestEventSha256)) ||
    !RESULT_STATUSES.has(status) ||
    !EVENT_TRANSITIONS.includes(latestTransition) ||
    !validIso(completedAtIso) ||
    !blockerCodeValid ||
    !validPublicState({ instagram, youtube, ledger }) ||
    !instagramValid ||
    !zeroForbiddenEffects ||
    !statusInvariant
  ) {
    return null;
  }
  const stable = {
    schemaVersion:
      MONEY_SHORTS_YOUTUBE_ONLY_RECOVERY_VERSION,
    evidenceType: "result",
    status,
    blockerCode:
      typeof blockerCode === "string"
        ? blockerCode
        : null,
    claimId: claim.claimId,
    claimFingerprint: claim.claimFingerprint,
    planFingerprint: claim.planFingerprint,
    preflightFingerprint:
      claim.preflightFingerprint,
    recoveryFingerprint:
      claim.recoveryFingerprint,
    ownerResolutionSha256:
      claim.ownerResolutionSha256,
    ownerResolutionFingerprint:
      claim.ownerResolutionFingerprint,
    originalResultSha256:
      claim.originalResultSha256,
    originalAttemptClaimSha256:
      claim.originalAttemptClaimSha256,
    expectedChannelId: claim.expectedChannelId,
    currentBinding: claim.currentBinding,
    latestEventSha256,
    latestTransition,
    completedAtIso,
    instagram,
    youtube,
    ledger,
    sideEffectCounters: counters,
    safety: {
      automaticRetryAllowed: false,
      instagramPublishAllowed: false,
      blobMutationAllowed: false,
      part2PublishAllowed: false,
    },
  };
  return {
    ...stable,
    resultFingerprint: fingerprintObject(stable),
  };
}

function readBytes(fsImpl, path) {
  const value = fsImpl.readFileSync(path);
  return Buffer.isBuffer(value)
    ? value
    : Buffer.from(String(value), "utf8");
}

function evidenceFingerprint(value, field) {
  if (
    !isPlainObject(value) ||
    !SHA256_RE.test(strictString(value[field]))
  ) {
    return null;
  }
  const { [field]: actual, ...stable } = value;
  return actual === fingerprintObject(stable)
    ? actual
    : null;
}

export function writeMoneyShortsYoutubeOnlyRecoveryEvidenceOnce({
  path,
  evidence,
  fingerprintField,
  fsImpl = nodeFs,
}) {
  const fingerprint = evidenceFingerprint(
    evidence,
    fingerprintField,
  );
  if (
    typeof path !== "string" ||
    path.length === 0 ||
    !fingerprint
  ) {
    return {
      ok: false,
      reason: "recovery_evidence_write_input_invalid",
    };
  }
  const serialized = `${JSON.stringify(evidence, null, 2)}\n`;
  const expectedSha256 = sha256(serialized);
  const preparedPath =
    `${path}.${fingerprint}.prepared`;
  const committedSourcePath =
    `${path}.${fingerprint}.committed-source`;
  if (
    fsImpl.existsSync(path) ||
    fsImpl.existsSync(preparedPath) ||
    fsImpl.existsSync(committedSourcePath)
  ) {
    return {
      ok: false,
      reason:
        "recovery_evidence_exists_or_orphaned_manual_review_required",
    };
  }
  try {
    fsImpl.mkdirSync(dirname(path), { recursive: true });
    const fd = fsImpl.openSync(preparedPath, "wx", 0o600);
    try {
      fsImpl.writeFileSync(fd, serialized, "utf8");
      fsImpl.fsyncSync(fd);
    } finally {
      fsImpl.closeSync(fd);
    }
    fsImpl.linkSync(preparedPath, path);
  } catch {
    return {
      ok: false,
      reason: "recovery_evidence_write_failed",
    };
  }
  try {
    fsImpl.renameSync(preparedPath, committedSourcePath);
  } catch {
    // Canonical hard-link already exists. Keep prepared evidence on failure.
  }
  try {
    const actualSha256 = sha256(readBytes(fsImpl, path));
    return actualSha256 === expectedSha256
      ? {
          ok: true,
          sha256: actualSha256,
        }
      : {
          ok: false,
          reason: "recovery_evidence_readback_mismatch",
          evidenceSaved: true,
        };
  } catch {
    return {
      ok: false,
      reason: "recovery_evidence_readback_failed",
      evidenceSaved: true,
    };
  }
}

export function writeMoneyShortsYoutubeOnlyRecoveryPreflight({
  path,
  evidence,
  fsImpl = nodeFs,
}) {
  if (
    typeof path !== "string" ||
    !evidenceFingerprint(
      evidence,
      "preflightFingerprint",
    )
  ) {
    return {
      ok: false,
      reason: "recovery_preflight_write_input_invalid",
    };
  }
  const serialized = `${JSON.stringify(evidence, null, 2)}\n`;
  const directory = dirname(path);
  const preparedPrefix = `${basename(path)}.`;
  const tempPath =
    `${path}.${evidence.preflightFingerprint}.prepared`;
  let preparedOrphanPresent = false;
  try {
    preparedOrphanPresent =
      fsImpl.existsSync(directory) &&
      fsImpl
        .readdirSync(directory)
        .some(
          (name) =>
            typeof name === "string" &&
            name.startsWith(preparedPrefix) &&
            name.endsWith(".prepared"),
        );
  } catch {
    return {
      ok: false,
      reason:
        "recovery_preflight_directory_unreadable",
    };
  }
  if (
    preparedOrphanPresent ||
    fsImpl.existsSync(tempPath)
  ) {
    return {
      ok: false,
      reason:
        "recovery_preflight_prepared_orphan_manual_review_required",
    };
  }
  let stage = "mkdir";
  try {
    fsImpl.mkdirSync(directory, { recursive: true });
    stage = "open";
    const fd = fsImpl.openSync(tempPath, "wx", 0o600);
    try {
      stage = "write";
      fsImpl.writeFileSync(fd, serialized, "utf8");
      stage = "fsync";
      fsImpl.fsyncSync(fd);
    } finally {
      fsImpl.closeSync(fd);
    }
    stage = "rename";
    fsImpl.renameSync(tempPath, path);
    stage = "readback";
    const actualSha256 = sha256(readBytes(fsImpl, path));
    return {
      ok: actualSha256 === sha256(serialized),
      reason:
        actualSha256 === sha256(serialized)
          ? null
          : "recovery_preflight_readback_mismatch",
      sha256: actualSha256,
    };
  } catch (error) {
    const code =
      typeof error?.code === "string" &&
      /^[A-Z0-9_]+$/.test(error.code)
        ? error.code
        : "UNKNOWN";
    return {
      ok: false,
      reason:
        `recovery_preflight_${stage}_failed_${code}`,
      preparedPath:
        stage === "open" ? tempPath : undefined,
    };
  }
}

function normalizeFileIdentity(stat) {
  return {
    dev: String(stat?.dev ?? ""),
    ino: String(stat?.ino ?? ""),
    size: String(stat?.size ?? ""),
    mtimeMs: String(stat?.mtimeMs ?? ""),
    ctimeMs: String(stat?.ctimeMs ?? ""),
  };
}

function sameFileIdentity(left, right) {
  return (
    left.dev === right.dev &&
    left.ino === right.ino &&
    left.size === right.size &&
    left.mtimeMs === right.mtimeMs &&
    left.ctimeMs === right.ctimeMs
  );
}

export function acquireMoneyShortsYoutubeOnlyRecoveryLock({
  lockPath,
  fsImpl = nodeFs,
}) {
  let descriptor = null;
  let ownedIdentity = null;
  try {
    descriptor = fsImpl.openSync(lockPath, "wx", 0o600);
    const stat =
      typeof fsImpl.fstatSync === "function"
        ? fsImpl.fstatSync(descriptor)
        : fsImpl.statSync(lockPath);
    ownedIdentity = normalizeFileIdentity(stat);
    fsImpl.fsyncSync(descriptor);
    return {
      ok: true,
      lockPath,
      descriptor,
      fileIdentity: ownedIdentity,
      owned: true,
    };
  } catch {
    if (descriptor !== null) {
      try {
        fsImpl.closeSync(descriptor);
      } catch {}
      // fsync/stat 이후 실패한 lock은 자동 삭제하지 않는다. 경로 교체
      // TOCTOU에서 다른 프로세스 lock을 지우는 것보다 orphan을 fail-closed로
      // 남겨 Owner 수동 검토를 요구하는 편이 안전하다.
    }
    return {
      ok: false,
      reason:
        "youtube_only_recovery_lock_active_or_orphaned",
    };
  }
}

export function releaseMoneyShortsYoutubeOnlyRecoveryLock({
  lock,
  fsImpl = nodeFs,
}) {
  if (!isPlainObject(lock) || lock.owned !== true) {
    return { ok: true, released: false };
  }
  try {
    const beforeClose = normalizeFileIdentity(
      fsImpl.statSync(lock.lockPath),
    );
    if (!sameFileIdentity(beforeClose, lock.fileIdentity)) {
      try {
        fsImpl.closeSync(lock.descriptor);
        lock.descriptor = null;
      } catch {}
      return {
        ok: false,
        reason: "youtube_only_recovery_lock_changed",
      };
    }
    fsImpl.closeSync(lock.descriptor);
    lock.descriptor = null;
    const afterClose = normalizeFileIdentity(
      fsImpl.statSync(lock.lockPath),
    );
    if (!sameFileIdentity(afterClose, lock.fileIdentity)) {
      return {
        ok: false,
        reason: "youtube_only_recovery_lock_changed",
      };
    }
    fsImpl.unlinkSync(lock.lockPath);
    lock.owned = false;
    return { ok: true, released: true };
  } catch {
    if (lock.descriptor !== null) {
      try {
        fsImpl.closeSync(lock.descriptor);
        lock.descriptor = null;
      } catch {}
    }
    return {
      ok: false,
      reason: "youtube_only_recovery_lock_release_failed",
    };
  }
}

export function moneyShortsYoutubeOnlyRecoveryEventPath(
  recoveryDir,
  transition,
) {
  const index = EVENT_TRANSITIONS.indexOf(transition);
  return index >= 0
    ? join(
        recoveryDir,
        `${String(index + 1).padStart(2, "0")}-${transition}.json`,
      )
    : null;
}

export function moneyShortsYoutubeOnlyRecoveryPaths(outDir) {
  const recoveryDir = join(
    outDir,
    MONEY_SHORTS_YOUTUBE_ONLY_RECOVERY_DIRNAME,
  );
  return {
    preflightPath: join(
      outDir,
      MONEY_SHORTS_YOUTUBE_ONLY_RECOVERY_PREFLIGHT_FILENAME,
    ),
    recoveryDir,
    claimPath: join(
      recoveryDir,
      MONEY_SHORTS_YOUTUBE_ONLY_RECOVERY_CLAIM_FILENAME,
    ),
    resultPath: join(
      recoveryDir,
      MONEY_SHORTS_YOUTUBE_ONLY_RECOVERY_RESULT_FILENAME,
    ),
  };
}
