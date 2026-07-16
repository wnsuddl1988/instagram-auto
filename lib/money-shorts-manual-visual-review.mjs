import { createHash } from "node:crypto";

export const MONEY_SHORTS_MANUAL_VISUAL_REVIEW_VERSION = "money_shorts_manual_visual_review_v1";
export const MONEY_SHORTS_MANUAL_VISUAL_REVIEW_EVIDENCE_FILE = "manual-visual-review.json";

export function buildPendingManualVisualReviewState() {
  return {
    version: MONEY_SHORTS_MANUAL_VISUAL_REVIEW_VERSION,
    required: true,
    status: "pending",
    acceptedForDownstream: false,
    renderAllowed: false,
    evidenceFileName: MONEY_SHORTS_MANUAL_VISUAL_REVIEW_EVIDENCE_FILE,
  };
}

function normalizedSceneBindings(scenes) {
  if (!Array.isArray(scenes) || scenes.length === 0) return null;
  const rows = scenes.map((scene) => ({
    sceneIndex: scene?.sceneIndex,
    visualEvidenceId: scene?.visualEvidenceId,
    promptFingerprint: scene?.promptFingerprint,
    imageSha256: typeof scene?.imageSha256 === "string" ? scene.imageSha256.toLowerCase() : null,
  })).sort((a, b) => Number(a.sceneIndex) - Number(b.sceneIndex));
  const valid = rows.every((row, index) =>
    row.sceneIndex === index + 1 &&
    typeof row.visualEvidenceId === "string" && row.visualEvidenceId.length > 0 &&
    /^[a-f0-9]{16}$/.test(row.promptFingerprint ?? "") &&
    /^[a-f0-9]{64}$/.test(row.imageSha256 ?? ""));
  return valid ? rows : null;
}

export function moneyShortsImageSetSha256(scenes) {
  const bindings = normalizedSceneBindings(scenes);
  if (!bindings) return null;
  return createHash("sha256").update(JSON.stringify({
    version: MONEY_SHORTS_MANUAL_VISUAL_REVIEW_VERSION,
    scenes: bindings,
  })).digest("hex");
}

export function validateMoneyShortsManualVisualReview({ summary, evidence }) {
  const contract = summary?.manualVisualReview;
  if (
    contract?.version !== MONEY_SHORTS_MANUAL_VISUAL_REVIEW_VERSION ||
    contract?.required !== true ||
    contract?.evidenceFileName !== MONEY_SHORTS_MANUAL_VISUAL_REVIEW_EVIDENCE_FILE
  ) {
    return { passed: false, reason: "SUMMARY_MANUAL_VISUAL_REVIEW_CONTRACT_MISSING", imageSetSha256: null };
  }
  const summaryBindings = normalizedSceneBindings(summary?.scenes);
  const imageSetSha256 = moneyShortsImageSetSha256(summary?.scenes);
  if (!summaryBindings || !imageSetSha256) {
    return { passed: false, reason: "SUMMARY_IMAGE_SET_BINDING_INVALID", imageSetSha256: null };
  }
  if (!evidence || typeof evidence !== "object") {
    return { passed: false, reason: "MANUAL_VISUAL_REVIEW_EVIDENCE_MISSING", imageSetSha256 };
  }
  const evidenceBindings = normalizedSceneBindings(evidence.scenes);
  const accepted =
    evidence.schemaVersion === MONEY_SHORTS_MANUAL_VISUAL_REVIEW_VERSION &&
    evidence.topicId === summary.topicId &&
    evidence.decision === "accepted" &&
    evidence.acceptedForDownstream === true &&
    evidence.renderAllowed === true &&
    evidence.reviewerRole === "owner" &&
    evidence.ownerApproval === true &&
    typeof evidence.reviewedAt === "string" && Number.isFinite(Date.parse(evidence.reviewedAt)) &&
    evidence.sceneCount === summaryBindings.length &&
    evidence.imageSetSha256 === imageSetSha256 &&
    evidenceBindings != null &&
    JSON.stringify(evidenceBindings) === JSON.stringify(summaryBindings);
  return accepted
    ? { passed: true, reason: null, imageSetSha256 }
    : { passed: false, reason: "MANUAL_VISUAL_REVIEW_NOT_ACCEPTED_OR_STALE", imageSetSha256 };
}
