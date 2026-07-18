import { createHash } from "node:crypto";

export const MONEY_SHORTS_TTS_OWNER_LISTENING_GATE_VERSION =
  "money_shorts_tts_owner_listening_gate_v1";
export const MONEY_SHORTS_TTS_OWNER_APPROVAL_TEXT = "음성 승인";

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function normalizePart(part) {
  return {
    partId: String(part?.partId ?? ""),
    audioSha256: String(part?.audioSha256 ?? ""),
    ttsInputContractSha256: String(part?.ttsInputContractSha256 ?? ""),
    wizardScriptFingerprint: String(part?.wizardScriptFingerprint ?? ""),
    durationSec: Number(part?.durationSec),
  };
}

function validPart(part) {
  return (
    /^(single|part-1|part-2)$/.test(part.partId) &&
    /^[a-f0-9]{64}$/.test(part.audioSha256) &&
    /^[a-f0-9]{64}$/.test(part.ttsInputContractSha256) &&
    part.wizardScriptFingerprint.length > 0 &&
    Number.isFinite(part.durationSec) &&
    part.durationSec >= 10 &&
    part.durationSec <= 60
  );
}

function stableEvidence(topicId, parts) {
  return {
    schemaVersion: MONEY_SHORTS_TTS_OWNER_LISTENING_GATE_VERSION,
    status: "OWNER_LISTENING_ACCEPTED",
    topicId,
    confirmations: {
      listenedAllParts: true,
      voiceQualityAccepted: true,
      downstreamUseAccepted: true,
    },
    parts,
  };
}

export function buildMoneyShortsTtsOwnerListeningEvidence({
  topicId,
  parts,
  acceptedAt,
}) {
  const normalizedTopicId = String(topicId ?? "").trim();
  const normalizedParts = Array.isArray(parts)
    ? parts.map(normalizePart).sort((a, b) => a.partId.localeCompare(b.partId))
    : [];
  if (
    !/^[a-z0-9][a-z0-9_-]{2,180}$/i.test(normalizedTopicId) ||
    normalizedParts.length < 1 ||
    normalizedParts.length > 2 ||
    !normalizedParts.every(validPart) ||
    new Set(normalizedParts.map((part) => part.partId)).size !== normalizedParts.length
  ) {
    throw new Error("tts_owner_listening_evidence_input_invalid");
  }
  const stable = stableEvidence(normalizedTopicId, normalizedParts);
  return {
    ...stable,
    qualityApprovalFingerprint: sha256(JSON.stringify(stable)),
    acceptedAt: String(acceptedAt ?? new Date().toISOString()),
  };
}

export function validateMoneyShortsTtsOwnerListeningEvidence({
  evidence,
  topicId,
  currentPart,
}) {
  if (!evidence || typeof evidence !== "object" || Array.isArray(evidence)) {
    return { accepted: false, reason: "approval_evidence_missing" };
  }
  const normalizedTopicId = String(topicId ?? "").trim();
  const evidenceParts = Array.isArray(evidence.parts)
    ? evidence.parts.map(normalizePart).sort((a, b) => a.partId.localeCompare(b.partId))
    : [];
  if (
    evidence.schemaVersion !== MONEY_SHORTS_TTS_OWNER_LISTENING_GATE_VERSION ||
    evidence.status !== "OWNER_LISTENING_ACCEPTED" ||
    evidence.topicId !== normalizedTopicId ||
    evidence.confirmations?.listenedAllParts !== true ||
    evidence.confirmations?.voiceQualityAccepted !== true ||
    evidence.confirmations?.downstreamUseAccepted !== true ||
    evidenceParts.length < 1 ||
    evidenceParts.length > 2 ||
    !evidenceParts.every(validPart) ||
    new Set(evidenceParts.map((part) => part.partId)).size !==
      evidenceParts.length
  ) {
    return { accepted: false, reason: "approval_evidence_invalid" };
  }
  const expectedFingerprint = sha256(
    JSON.stringify(stableEvidence(normalizedTopicId, evidenceParts)),
  );
  if (evidence.qualityApprovalFingerprint !== expectedFingerprint) {
    return { accepted: false, reason: "approval_fingerprint_mismatch" };
  }
  const normalizedCurrentPart = normalizePart(currentPart);
  if (!validPart(normalizedCurrentPart)) {
    return { accepted: false, reason: "current_audio_evidence_invalid" };
  }
  const approvedPart = evidenceParts.find(
    (part) => part.partId === normalizedCurrentPart.partId,
  );
  if (
    !approvedPart ||
    JSON.stringify(approvedPart) !== JSON.stringify(normalizedCurrentPart)
  ) {
    return { accepted: false, reason: "approved_audio_changed" };
  }
  return {
    accepted: true,
    reason: null,
    qualityApprovalFingerprint: expectedFingerprint,
    acceptedAt: typeof evidence.acceptedAt === "string" ? evidence.acceptedAt : null,
  };
}
