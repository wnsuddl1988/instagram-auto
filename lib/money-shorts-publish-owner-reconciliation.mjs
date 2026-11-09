import { createHash } from "node:crypto";

import {
  normalizeMoneyShortsPublishAttemptBinding,
} from "./money-shorts-publish-attempt-journal.mjs";

export const MONEY_SHORTS_PUBLISH_OWNER_RECONCILIATION_VERSION =
  "money_shorts_publish_owner_reconciliation_v1";
export const MONEY_SHORTS_PUBLISH_OWNER_RECONCILIATION_DECISION =
  "confirm_instagram_published_youtube_not_published";
export const MONEY_SHORTS_PUBLISH_OWNER_RECONCILIATION_CONFIRM_TEXT =
  "유튜브 미게시 확인";
export const MONEY_SHORTS_PUBLISH_OWNER_RECONCILIATION_DIRNAME =
  "owner-reconciliation-v1";

const SHA256_RE = /^[a-f0-9]{64}$/;
const PUBLIC_ID_RE = /^[A-Za-z0-9._:-]{1,200}$/;
const YOUTUBE_CHANNEL_ID_RE = /^UC[A-Za-z0-9_-]{22}$/;
const RECONCILIABLE_PART_IDS = new Set([
  "part-1",
  "part-2",
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

function safeTopicSlug(value) {
  const slug = strictString(value)
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
  return slug.length > 0 ? slug : null;
}

function validIso(value) {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    Number.isFinite(Date.parse(value))
  );
}

function validBinding(value) {
  const binding =
    normalizeMoneyShortsPublishAttemptBinding(value);
  return (
    binding.contentId.length > 0 &&
    binding.version.length > 0 &&
    RECONCILIABLE_PART_IDS.has(binding.productionPartId) &&
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

export function normalizeInstagramReelPermalink(value) {
  if (typeof value !== "string" || value.length > 300) {
    return null;
  }
  try {
    const parsed = new URL(value);
    if (
      parsed.protocol !== "https:" ||
      parsed.hostname !== "www.instagram.com" ||
      parsed.username ||
      parsed.password ||
      parsed.search ||
      parsed.hash
    ) {
      return null;
    }
    const segments = parsed.pathname
      .split("/")
      .filter(Boolean);
    const validPath =
      (segments.length === 2 &&
        segments[0] === "reel") ||
      (segments.length === 3 &&
        /^[A-Za-z0-9._]+$/.test(segments[0]) &&
        segments[1] === "reel");
    const shortcode = segments.at(-1) ?? "";
    if (
      !validPath ||
      !/^[A-Za-z0-9_-]{5,80}$/.test(shortcode)
    ) {
      return null;
    }
    return `https://www.instagram.com/${segments.join("/")}/`;
  } catch {
    return null;
  }
}

export function moneyShortsPublishOwnerReconciliationMatchesRequest(
  recovery,
  request,
) {
  const normalizedPermalink =
    normalizeInstagramReelPermalink(
      request?.instagramPermalink,
    );
  return (
    recovery?.state === "instagram_only" &&
    recovery?.ownerResolution?.present === true &&
    recovery?.ownerResolution?.valid === true &&
    recovery?.ownerResolution?.applied === true &&
    recovery.ownerResolution.sourceRecoveryFingerprint ===
      request?.expectedRecoveryFingerprint &&
    normalizedPermalink !== null &&
    recovery.ownerResolution.instagramPermalink ===
      normalizedPermalink &&
    recovery.ownerResolution.youtubeChannelId ===
      request?.youtubeChannelId &&
    request?.decision ===
      MONEY_SHORTS_PUBLISH_OWNER_RECONCILIATION_DECISION &&
    request?.confirmation ===
      MONEY_SHORTS_PUBLISH_OWNER_RECONCILIATION_CONFIRM_TEXT &&
    request?.confirmInstagramPublished === true &&
    request?.confirmYoutubeNotPublished === true
  );
}

function normalizedAttemptEvidence(value) {
  const normalized = {
    claimSha256: strictString(value?.claimSha256),
    eventCount: value?.eventCount,
    latestTransition: strictString(value?.latestTransition),
    latestEventSha256: strictString(value?.latestEventSha256),
  };
  return (
    value?.present === true &&
    value?.journalValid === true &&
    SHA256_RE.test(normalized.claimSha256) &&
    Number.isSafeInteger(normalized.eventCount) &&
    normalized.eventCount > 0 &&
    normalized.latestTransition === "youtube_insert_intent" &&
    SHA256_RE.test(normalized.latestEventSha256)
  )
    ? normalized
    : null;
}

function stableEvidence(value) {
  const binding = validBinding(value?.currentBinding);
  const attempt = normalizedAttemptEvidence({
    present: true,
    journalValid: true,
    ...value?.attemptEvidence,
  });
  const instagramPermalink =
    normalizeInstagramReelPermalink(
      value?.instagram?.permalink,
    );
  const instagramMediaId =
    strictString(value?.instagram?.mediaId);
  const youtubeChannelId =
    strictString(value?.youtube?.channelId);
  const topicSlug = safeTopicSlug(value?.topicId);
  const productionPartId =
    strictString(value?.productionPartId);
  if (
    value?.schemaVersion !==
      MONEY_SHORTS_PUBLISH_OWNER_RECONCILIATION_VERSION ||
    value?.decision !==
      MONEY_SHORTS_PUBLISH_OWNER_RECONCILIATION_DECISION ||
    value?.reviewerRole !== "owner" ||
    value?.ownerConfirmation !== true ||
    !topicSlug ||
    !RECONCILIABLE_PART_IDS.has(productionPartId) ||
    !SHA256_RE.test(strictString(value?.resultSha256)) ||
    !SHA256_RE.test(
      strictString(value?.sourceRecoveryFingerprint),
    ) ||
    !binding ||
    binding.contentId !==
      `wizard-${topicSlug}-${productionPartId}` ||
    binding.productionPartId !== productionPartId ||
    !attempt ||
    value?.instagram?.outcome !== "confirmed_published" ||
    !PUBLIC_ID_RE.test(instagramMediaId) ||
    !instagramPermalink ||
    value?.youtube?.outcome !== "confirmed_not_published" ||
    value?.youtube?.videoId !== null ||
    !YOUTUBE_CHANNEL_ID_RE.test(youtubeChannelId) ||
    value?.youtube?.evidenceMethod !==
      "owner_manual_youtube_studio_content_list" ||
    !validIso(value?.youtube?.checkedAtIso) ||
    !validIso(value?.recordedAtIso) ||
    value?.safety?.automaticRetryAllowed !== false ||
    value?.safety?.instagramPublishAllowed !== false ||
    value?.safety?.youtubePublishAllowed !== false ||
    value?.safety?.part2PublishAllowed !== false ||
    value?.safety?.externalActionCount !== 0
  ) {
    return null;
  }
  return {
    schemaVersion:
      MONEY_SHORTS_PUBLISH_OWNER_RECONCILIATION_VERSION,
    decision:
      MONEY_SHORTS_PUBLISH_OWNER_RECONCILIATION_DECISION,
    reviewerRole: "owner",
    ownerConfirmation: true,
    topicId: value.topicId,
    productionPartId,
    resultSha256: value.resultSha256,
    sourceRecoveryFingerprint:
      value.sourceRecoveryFingerprint,
    currentBinding: binding,
    attemptEvidence: attempt,
    instagram: {
      outcome: "confirmed_published",
      mediaId: instagramMediaId,
      permalink: instagramPermalink,
    },
    youtube: {
      outcome: "confirmed_not_published",
      videoId: null,
      channelId: youtubeChannelId,
      evidenceMethod:
        "owner_manual_youtube_studio_content_list",
      checkedAtIso: value.youtube.checkedAtIso,
    },
    recordedAtIso: value.recordedAtIso,
    safety: {
      automaticRetryAllowed: false,
      instagramPublishAllowed: false,
      youtubePublishAllowed: false,
      part2PublishAllowed: false,
      externalActionCount: 0,
    },
  };
}

export function buildMoneyShortsPublishOwnerReconciliationEvidence({
  topicId,
  productionPartId,
  recovery,
  attemptEvidence,
  decision,
  confirmation,
  confirmInstagramPublished,
  confirmYoutubeNotPublished,
  instagramPermalink,
  youtubeChannelId,
  checkedAtIso = new Date().toISOString(),
}) {
  const binding = validBinding(recovery?.currentBinding);
  const attempt = normalizedAttemptEvidence(attemptEvidence);
  const permalink =
    normalizeInstagramReelPermalink(instagramPermalink);
  if (
    !RECONCILIABLE_PART_IDS.has(productionPartId) ||
    recovery?.state !== "ambiguous" ||
    recovery?.reason !== "youtube_publish_outcome_unknown" ||
    !SHA256_RE.test(
      strictString(recovery?.recoveryFingerprint),
    ) ||
    !SHA256_RE.test(strictString(recovery?.resultSha256)) ||
    !binding ||
    binding.productionPartId !== productionPartId ||
    !PUBLIC_ID_RE.test(
      strictString(recovery?.instagramMediaId),
    ) ||
    recovery?.youtubeVideoId !== null ||
    recovery?.automaticRetryAllowed !== false ||
    recovery?.externalRecoveryEnabled !== false ||
    !attempt ||
    decision !==
      MONEY_SHORTS_PUBLISH_OWNER_RECONCILIATION_DECISION ||
    confirmation !==
      MONEY_SHORTS_PUBLISH_OWNER_RECONCILIATION_CONFIRM_TEXT ||
    confirmInstagramPublished !== true ||
    confirmYoutubeNotPublished !== true ||
    !permalink ||
    !YOUTUBE_CHANNEL_ID_RE.test(
      strictString(youtubeChannelId),
    ) ||
    !validIso(checkedAtIso)
  ) {
    return {
      ok: false,
      reason:
        "PUBLISH_OWNER_RECONCILIATION_INPUT_INVALID_OR_STALE",
    };
  }
  const stable = stableEvidence({
    schemaVersion:
      MONEY_SHORTS_PUBLISH_OWNER_RECONCILIATION_VERSION,
    decision,
    reviewerRole: "owner",
    ownerConfirmation: true,
    topicId,
    productionPartId,
    resultSha256: recovery.resultSha256,
    sourceRecoveryFingerprint:
      recovery.recoveryFingerprint,
    currentBinding: binding,
    attemptEvidence: attempt,
    instagram: {
      outcome: "confirmed_published",
      mediaId: recovery.instagramMediaId,
      permalink,
    },
    youtube: {
      outcome: "confirmed_not_published",
      videoId: null,
      channelId: youtubeChannelId,
      evidenceMethod:
        "owner_manual_youtube_studio_content_list",
      checkedAtIso,
    },
    recordedAtIso: checkedAtIso,
    safety: {
      automaticRetryAllowed: false,
      instagramPublishAllowed: false,
      youtubePublishAllowed: false,
      part2PublishAllowed: false,
      externalActionCount: 0,
    },
  });
  if (!stable) {
    return {
      ok: false,
      reason:
        "PUBLISH_OWNER_RECONCILIATION_EVIDENCE_BUILD_FAILED",
    };
  }
  return {
    ok: true,
    evidence: {
      ...stable,
      resolutionFingerprint: sha256(
        JSON.stringify(stable),
      ),
    },
  };
}

export function validateMoneyShortsPublishOwnerReconciliationEvidence({
  evidence,
  fileSha256,
  currentBinding,
  resultSha256,
  attemptEvidence,
  instagramMediaId,
  expectedSourceRecoveryFingerprint = null,
}) {
  if (!isPlainObject(evidence)) {
    return {
      valid: false,
      reason: "owner_reconciliation_not_object",
    };
  }
  const stable = stableEvidence(evidence);
  const resolutionFingerprint =
    strictString(evidence.resolutionFingerprint);
  const canonicalEvidence = stable
    ? {
        ...stable,
        resolutionFingerprint,
      }
    : null;
  if (
    !stable ||
    !canonicalEvidence ||
    !SHA256_RE.test(resolutionFingerprint) ||
    resolutionFingerprint !==
      sha256(JSON.stringify(stable)) ||
    !SHA256_RE.test(strictString(fileSha256)) ||
    fileSha256 !==
      sha256(
        `${JSON.stringify(canonicalEvidence, null, 2)}\n`,
      ) ||
    JSON.stringify(evidence) !==
      JSON.stringify(canonicalEvidence)
  ) {
    return {
      valid: false,
      reason:
        "owner_reconciliation_schema_or_fingerprint_invalid",
    };
  }
  const expectedBinding = validBinding(currentBinding);
  const expectedAttempt =
    normalizedAttemptEvidence(attemptEvidence);
  if (
    !expectedBinding ||
    !expectedAttempt ||
    stable.resultSha256 !== resultSha256 ||
    JSON.stringify(stable.currentBinding) !==
      JSON.stringify(expectedBinding) ||
    JSON.stringify(stable.attemptEvidence) !==
      JSON.stringify(expectedAttempt) ||
    stable.instagram.mediaId !== instagramMediaId ||
    (expectedSourceRecoveryFingerprint !== null &&
      stable.sourceRecoveryFingerprint !==
        expectedSourceRecoveryFingerprint)
  ) {
    return {
      valid: false,
      reason:
        "owner_reconciliation_current_evidence_mismatch",
    };
  }
  return {
    valid: true,
    reason: null,
    resolutionFingerprint:
      resolutionFingerprint,
    sourceRecoveryFingerprint:
      stable.sourceRecoveryFingerprint,
    instagramPermalink:
      stable.instagram.permalink,
    youtubeChannelId: stable.youtube.channelId,
    checkedAtIso: stable.youtube.checkedAtIso,
  };
}
