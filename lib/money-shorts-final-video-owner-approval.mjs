import { createHash } from "node:crypto";

export const MONEY_SHORTS_FINAL_VIDEO_OWNER_APPROVAL_VERSION =
  "money_shorts_final_video_owner_approval_v1";
export const MONEY_SHORTS_FINAL_VIDEO_OWNER_APPROVAL_TEXT =
  "최종 영상 승인";
export const MONEY_SHORTS_PUBLISH_PREFLIGHT_BINDING_VERSION =
  "money_shorts_publish_preflight_binding_v1";

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function normalizePart(part) {
  return {
    partId: String(part?.partId ?? ""),
    wizardScriptFingerprint: String(
      part?.wizardScriptFingerprint ?? "",
    ),
    audioSha256: String(part?.audioSha256 ?? ""),
    imageSetSha256: String(part?.imageSetSha256 ?? ""),
    finalMp4Sha256: String(part?.finalMp4Sha256 ?? ""),
    publishMetadataSha256: String(
      part?.publishMetadataSha256 ?? "",
    ),
    durationSec: Number(part?.durationSec),
    sizeBytes: Number(part?.sizeBytes),
  };
}

function validSha256(value) {
  return /^[a-f0-9]{64}$/.test(value);
}

function validPart(part) {
  return (
    /^(single|part-1|part-2)$/.test(part.partId) &&
    part.wizardScriptFingerprint.length > 0 &&
    validSha256(part.audioSha256) &&
    validSha256(part.imageSetSha256) &&
    validSha256(part.finalMp4Sha256) &&
    validSha256(part.publishMetadataSha256) &&
    Number.isFinite(part.durationSec) &&
    part.durationSec >= 15 &&
    part.durationSec <= 60 &&
    Number.isSafeInteger(part.sizeBytes) &&
    part.sizeBytes > 0
  );
}

function validPartSet(parts) {
  const partIds = parts.map((part) => part.partId);
  return (
    (partIds.length === 1 && partIds[0] === "single") ||
    (partIds.length === 2 &&
      partIds[0] === "part-1" &&
      partIds[1] === "part-2")
  );
}

function stableEvidence(topicId, parts) {
  return {
    schemaVersion:
      MONEY_SHORTS_FINAL_VIDEO_OWNER_APPROVAL_VERSION,
    status: "OWNER_FINAL_VIDEO_ACCEPTED",
    topicId,
    confirmations: {
      watchedAllParts: true,
      publishMetadataReviewed: true,
      exactFilesAcceptedForPublish: true,
    },
    parts,
  };
}

export function buildMoneyShortsFinalVideoOwnerApprovalEvidence({
  topicId,
  parts,
  acceptedAt,
}) {
  const normalizedTopicId = String(topicId ?? "").trim();
  const normalizedParts = Array.isArray(parts)
    ? parts
        .map(normalizePart)
        .sort((left, right) =>
          left.partId.localeCompare(right.partId),
        )
    : [];
  if (
    !/^[a-z0-9][a-z0-9_-]{2,180}$/i.test(normalizedTopicId) ||
    normalizedParts.length < 1 ||
    normalizedParts.length > 2 ||
    !normalizedParts.every(validPart) ||
    new Set(normalizedParts.map((part) => part.partId)).size !==
      normalizedParts.length ||
    !validPartSet(normalizedParts)
  ) {
    throw new Error("final_video_owner_approval_input_invalid");
  }
  const stable = stableEvidence(normalizedTopicId, normalizedParts);
  return {
    ...stable,
    finalVideoApprovalFingerprint: sha256(
      JSON.stringify(stable),
    ),
    acceptedAt: String(acceptedAt ?? new Date().toISOString()),
  };
}

export function validateMoneyShortsFinalVideoOwnerApprovalEvidence({
  evidence,
  topicId,
  currentPart,
  expectedPartIds = null,
}) {
  if (
    !evidence ||
    typeof evidence !== "object" ||
    Array.isArray(evidence)
  ) {
    return { accepted: false, reason: "approval_evidence_missing" };
  }
  const normalizedTopicId = String(topicId ?? "").trim();
  const evidenceParts = Array.isArray(evidence.parts)
    ? evidence.parts
        .map(normalizePart)
        .sort((left, right) =>
          left.partId.localeCompare(right.partId),
        )
    : [];
  if (
    evidence.schemaVersion !==
      MONEY_SHORTS_FINAL_VIDEO_OWNER_APPROVAL_VERSION ||
    evidence.status !== "OWNER_FINAL_VIDEO_ACCEPTED" ||
    evidence.topicId !== normalizedTopicId ||
    evidence.confirmations?.watchedAllParts !== true ||
    evidence.confirmations?.publishMetadataReviewed !== true ||
    evidence.confirmations?.exactFilesAcceptedForPublish !== true ||
    evidenceParts.length < 1 ||
    evidenceParts.length > 2 ||
    !evidenceParts.every(validPart) ||
    new Set(evidenceParts.map((part) => part.partId)).size !==
      evidenceParts.length ||
    !validPartSet(evidenceParts)
  ) {
    return { accepted: false, reason: "approval_evidence_invalid" };
  }
  const normalizedExpectedPartIds = Array.isArray(expectedPartIds)
    ? expectedPartIds
        .map((partId) => String(partId ?? ""))
        .sort((left, right) => left.localeCompare(right))
    : null;
  if (
    normalizedExpectedPartIds &&
    JSON.stringify(normalizedExpectedPartIds) !==
      JSON.stringify(evidenceParts.map((part) => part.partId))
  ) {
    return {
      accepted: false,
      reason: "approval_part_set_mismatch",
    };
  }
  const expectedFingerprint = sha256(
    JSON.stringify(stableEvidence(normalizedTopicId, evidenceParts)),
  );
  if (
    evidence.finalVideoApprovalFingerprint !== expectedFingerprint
  ) {
    return {
      accepted: false,
      reason: "approval_fingerprint_mismatch",
    };
  }
  const normalizedCurrentPart = normalizePart(currentPart);
  if (!validPart(normalizedCurrentPart)) {
    return {
      accepted: false,
      reason: "current_final_video_evidence_invalid",
    };
  }
  const approvedPart = evidenceParts.find(
    (part) => part.partId === normalizedCurrentPart.partId,
  );
  if (
    !approvedPart ||
    JSON.stringify(approvedPart) !==
      JSON.stringify(normalizedCurrentPart)
  ) {
    return { accepted: false, reason: "approved_final_video_changed" };
  }
  return {
    accepted: true,
    reason: null,
    finalVideoApprovalFingerprint: expectedFingerprint,
    acceptedAt:
      typeof evidence.acceptedAt === "string"
        ? evidence.acceptedAt
        : null,
  };
}

function normalizePreflightBinding(value) {
  return {
    contentUnitManifestPath: String(
      value?.contentUnitManifestPath ?? "",
    ),
    contentUnitSha256: String(value?.contentUnitSha256 ?? ""),
    instagramSourceSha256: String(
      value?.instagramSourceSha256 ?? "",
    ),
    youtubeSourceSha256: String(
      value?.youtubeSourceSha256 ?? "",
    ),
    publishMetadataSha256: String(
      value?.publishMetadataSha256 ?? "",
    ),
    finalVideoApprovalFingerprint: String(
      value?.finalVideoApprovalFingerprint ?? "",
    ),
  };
}

function validPreflightBinding(binding) {
  return (
    binding.contentUnitManifestPath.length > 0 &&
    validSha256(binding.contentUnitSha256) &&
    validSha256(binding.instagramSourceSha256) &&
    validSha256(binding.youtubeSourceSha256) &&
    validSha256(binding.publishMetadataSha256) &&
    validSha256(binding.finalVideoApprovalFingerprint)
  );
}

export function buildMoneyShortsPublishPreflightBinding({
  current,
  boundAt,
}) {
  const normalized = normalizePreflightBinding(current);
  if (!validPreflightBinding(normalized)) {
    throw new Error("publish_preflight_binding_input_invalid");
  }
  return {
    schemaVersion:
      MONEY_SHORTS_PUBLISH_PREFLIGHT_BINDING_VERSION,
    status: "PREFLIGHT_ONLY_OK",
    blockerCode: null,
    ...normalized,
    bindingFingerprint: sha256(JSON.stringify(normalized)),
    boundAt: String(boundAt ?? new Date().toISOString()),
  };
}

export function validateMoneyShortsPublishPreflightBinding({
  evidence,
  current,
}) {
  if (
    !evidence ||
    typeof evidence !== "object" ||
    Array.isArray(evidence)
  ) {
    return { valid: false, reason: "preflight_evidence_missing" };
  }
  const normalizedCurrent = normalizePreflightBinding(current);
  const normalizedEvidence = normalizePreflightBinding(evidence);
  const evidenceBindingVersion =
    evidence.artifactBindingVersion ?? evidence.schemaVersion;
  if (
    evidenceBindingVersion !==
      MONEY_SHORTS_PUBLISH_PREFLIGHT_BINDING_VERSION ||
    evidence.status !== "PREFLIGHT_ONLY_OK" ||
    evidence.blockerCode != null ||
    !validSha256(evidence.bindingFingerprint) ||
    !validPreflightBinding(normalizedCurrent) ||
    !validPreflightBinding(normalizedEvidence)
  ) {
    return { valid: false, reason: "preflight_evidence_invalid" };
  }
  if (
    JSON.stringify(normalizedEvidence) !==
    JSON.stringify(normalizedCurrent)
  ) {
    return { valid: false, reason: "preflight_binding_changed" };
  }
  if (
    evidence.bindingFingerprint !==
      sha256(JSON.stringify(normalizedEvidence))
  ) {
    return {
      valid: false,
      reason: "preflight_binding_fingerprint_mismatch",
    };
  }
  return { valid: true, reason: null };
}
