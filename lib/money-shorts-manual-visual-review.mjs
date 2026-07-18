import { createHash } from "node:crypto";

export const MONEY_SHORTS_MANUAL_VISUAL_REVIEW_VERSION = "money_shorts_manual_visual_review_v1";
export const MONEY_SHORTS_MANUAL_VISUAL_REVIEW_EVIDENCE_FILE = "manual-visual-review.json";
export const MONEY_SHORTS_MANUAL_VISUAL_REVIEW_APPROVAL_TEXT = "이미지 승인";
export const MONEY_SHORTS_SELECTED_SCENE_REGENERATION_APPROVAL_TEXT = "선택 장면 재생성";

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

function normalizedCurrentParts(parts) {
  if (!Array.isArray(parts) || parts.length === 0) return null;
  const seenPartIds = new Set();
  const rows = [];
  for (const part of parts) {
    const partId = part?.partId;
    if (
      !["single", "part-1", "part-2"].includes(partId) ||
      seenPartIds.has(partId) ||
      !/^[a-f0-9]{64}$/.test(part?.imageSetSha256 ?? "") ||
      !Array.isArray(part?.scenes) ||
      part.scenes.length === 0
    ) return null;
    seenPartIds.add(partId);
    const scenes = part.scenes.map((scene) => ({
      sceneIndex: scene?.sceneIndex,
      imageSha256: typeof scene?.imageSha256 === "string" ? scene.imageSha256.toLowerCase() : null,
      ready: scene?.ready === true,
    })).sort((a, b) => Number(a.sceneIndex) - Number(b.sceneIndex));
    if (!scenes.every((scene, index) =>
      scene.sceneIndex === index + 1 &&
      scene.ready === true &&
      /^[a-f0-9]{64}$/.test(scene.imageSha256 ?? ""))) return null;
    rows.push({
      partId,
      imageSetSha256: part.imageSetSha256,
      scenes,
    });
  }
  return rows;
}

export function moneyShortsImageSetSha256(scenes) {
  const bindings = normalizedSceneBindings(scenes);
  if (!bindings) return null;
  return createHash("sha256").update(JSON.stringify({
    version: MONEY_SHORTS_MANUAL_VISUAL_REVIEW_VERSION,
    scenes: bindings,
  })).digest("hex");
}

export function buildMoneyShortsManualVisualReviewEvidence({
  summary,
  approvalTransactionId,
  reviewedAt = new Date().toISOString(),
}) {
  const contract = summary?.manualVisualReview;
  const scenes = normalizedSceneBindings(summary?.scenes);
  const imageSetSha256 = moneyShortsImageSetSha256(summary?.scenes);
  if (
    contract?.version !== MONEY_SHORTS_MANUAL_VISUAL_REVIEW_VERSION ||
    contract?.required !== true ||
    contract?.evidenceFileName !== MONEY_SHORTS_MANUAL_VISUAL_REVIEW_EVIDENCE_FILE ||
    typeof summary?.topicId !== "string" ||
    summary.topicId.length === 0 ||
    !scenes ||
    !imageSetSha256 ||
    !/^[a-f0-9]{64}$/.test(approvalTransactionId ?? "") ||
    typeof reviewedAt !== "string" ||
    !Number.isFinite(Date.parse(reviewedAt))
  ) {
    return { ok: false, reason: "MANUAL_VISUAL_REVIEW_CURRENT_IMAGE_SET_INVALID" };
  }
  return {
    ok: true,
    evidence: {
      schemaVersion: MONEY_SHORTS_MANUAL_VISUAL_REVIEW_VERSION,
      topicId: summary.topicId,
      decision: "accepted",
      acceptedForDownstream: true,
      renderAllowed: true,
      reviewerRole: "owner",
      ownerApproval: true,
      approvalTransactionId,
      reviewedAt,
      sceneCount: scenes.length,
      imageSetSha256,
      scenes,
    },
  };
}

/**
 * Commits every part evidence as one recoverable local transaction.
 * Existing evidence is renamed to a transaction-scoped backup before replacement; if a later
 * replacement fails, every already-replaced active file is moved aside and the prior file is
 * restored. No evidence file is deleted.
 */
export function commitMoneyShortsManualVisualReviewEvidenceTransaction({
  writes,
  approvalTransactionId,
  io,
}) {
  if (
    !Array.isArray(writes) ||
    writes.length === 0 ||
    !/^[a-f0-9]{64}$/.test(approvalTransactionId ?? "") ||
    !io ||
    typeof io.exists !== "function" ||
    typeof io.writeText !== "function" ||
    typeof io.rename !== "function"
  ) {
    return { ok: false, reason: "MANUAL_VISUAL_REVIEW_TRANSACTION_INPUT_INVALID" };
  }
  const seenPaths = new Set();
  const rows = [];
  for (const write of writes) {
    if (
      typeof write?.path !== "string" ||
      write.path.length === 0 ||
      seenPaths.has(write.path) ||
      typeof write?.content !== "string"
    ) {
      return { ok: false, reason: "MANUAL_VISUAL_REVIEW_TRANSACTION_WRITE_INVALID" };
    }
    seenPaths.add(write.path);
    rows.push({
      path: write.path,
      content: write.content,
      tempPath: `${write.path}.${approvalTransactionId}.tmp`,
      backupPath: `${write.path}.${approvalTransactionId}.previous`,
      failedPath: `${write.path}.${approvalTransactionId}.failed`,
      previousMoved: false,
      committed: false,
    });
  }

  try {
    for (const row of rows) io.writeText(row.tempPath, row.content);
    for (const row of rows) {
      if (io.exists(row.path)) {
        io.rename(row.path, row.backupPath);
        row.previousMoved = true;
      }
      io.rename(row.tempPath, row.path);
      row.committed = true;
    }
    return { ok: true };
  } catch {
    let rollbackPassed = true;
    for (const row of rows.slice().reverse()) {
      try {
        if (row.committed && io.exists(row.path)) io.rename(row.path, row.failedPath);
        if (row.previousMoved && io.exists(row.backupPath)) io.rename(row.backupPath, row.path);
      } catch {
        rollbackPassed = false;
      }
    }
    return {
      ok: false,
      reason: rollbackPassed
        ? "MANUAL_VISUAL_REVIEW_TRANSACTION_WRITE_FAILED_ROLLED_BACK"
        : "MANUAL_VISUAL_REVIEW_TRANSACTION_ROLLBACK_FAILED",
    };
  }
}

export function validateMoneyShortsImageReviewApproval({
  currentParts,
  claims,
  confirmReviewedAllImages,
  confirmVisualQualityAccepted,
  confirmDownstreamUse,
  approvalText,
}) {
  if (
    confirmReviewedAllImages !== true ||
    confirmVisualQualityAccepted !== true ||
    confirmDownstreamUse !== true ||
    approvalText !== MONEY_SHORTS_MANUAL_VISUAL_REVIEW_APPROVAL_TEXT
  ) {
    return { ok: false, reason: "MANUAL_VISUAL_REVIEW_CONFIRMATION_REQUIRED" };
  }
  const parts = normalizedCurrentParts(currentParts);
  if (!parts) return { ok: false, reason: "MANUAL_VISUAL_REVIEW_CURRENT_PARTS_INVALID" };
  if (!Array.isArray(claims) || claims.length !== parts.length) {
    return { ok: false, reason: "MANUAL_VISUAL_REVIEW_IMAGE_SET_CLAIMS_REQUIRED" };
  }
  const claimByPartId = new Map();
  for (const claim of claims) {
    if (
      !["single", "part-1", "part-2"].includes(claim?.partId) ||
      claimByPartId.has(claim.partId) ||
      !/^[a-f0-9]{64}$/.test(claim?.imageSetSha256 ?? "")
    ) {
      return { ok: false, reason: "MANUAL_VISUAL_REVIEW_IMAGE_SET_CLAIM_INVALID" };
    }
    claimByPartId.set(claim.partId, claim.imageSetSha256);
  }
  if (parts.some((part) => claimByPartId.get(part.partId) !== part.imageSetSha256)) {
    return { ok: false, reason: "MANUAL_VISUAL_REVIEW_IMAGE_SET_STALE" };
  }
  return { ok: true, parts };
}

export function validateMoneyShortsSelectedSceneRegeneration({
  currentParts,
  selections,
  confirmRegeneration,
  approvalText,
}) {
  if (
    confirmRegeneration !== true ||
    approvalText !== MONEY_SHORTS_SELECTED_SCENE_REGENERATION_APPROVAL_TEXT
  ) {
    return { ok: false, reason: "SELECTED_SCENE_REGENERATION_CONFIRMATION_REQUIRED" };
  }
  const parts = normalizedCurrentParts(currentParts);
  if (!parts) return { ok: false, reason: "SELECTED_SCENE_REGENERATION_CURRENT_PARTS_INVALID" };
  if (!Array.isArray(selections) || selections.length === 0) {
    return { ok: false, reason: "SELECTED_SCENE_REGENERATION_TARGET_REQUIRED" };
  }
  const partById = new Map(parts.map((part) => [part.partId, part]));
  const seenTargets = new Set();
  const grouped = new Map();
  for (const selection of selections) {
    const part = partById.get(selection?.partId);
    const sceneIndex = selection?.sceneIndex;
    const imageSha256 = typeof selection?.imageSha256 === "string"
      ? selection.imageSha256.toLowerCase()
      : null;
    const imageSetSha256 = selection?.imageSetSha256;
    const currentScene = Number.isInteger(sceneIndex)
      ? part?.scenes.find((scene) => scene.sceneIndex === sceneIndex)
      : null;
    const targetKey = `${selection?.partId ?? ""}:${sceneIndex ?? ""}`;
    if (
      !part ||
      seenTargets.has(targetKey) ||
      !currentScene ||
      !/^[a-f0-9]{64}$/.test(imageSha256 ?? "") ||
      imageSha256 !== currentScene.imageSha256 ||
      imageSetSha256 !== part.imageSetSha256
    ) {
      return { ok: false, reason: "SELECTED_SCENE_REGENERATION_TARGET_STALE_OR_INVALID" };
    }
    seenTargets.add(targetKey);
    const partTargets = grouped.get(part.partId) ?? [];
    partTargets.push({ sceneIndex, imageSha256 });
    grouped.set(part.partId, partTargets);
  }
  const selectedParts = parts
    .filter((part) => grouped.has(part.partId))
    .map((part) => {
      const regenerateScenes = grouped.get(part.partId)
        .slice()
        .sort((a, b) => a.sceneIndex - b.sceneIndex);
      const regenerateIndexes = new Set(regenerateScenes.map((scene) => scene.sceneIndex));
      return {
        partId: part.partId,
        imageSetSha256: part.imageSetSha256,
        regenerateScenes,
        retainedScenes: part.scenes
          .filter((scene) => !regenerateIndexes.has(scene.sceneIndex))
          .map((scene) => ({ sceneIndex: scene.sceneIndex, imageSha256: scene.imageSha256 })),
      };
    });
  return { ok: true, parts: selectedParts, selectedSceneCount: selections.length };
}

export function validateMoneyShortsManualVisualReviewTransaction(parts) {
  if (!Array.isArray(parts) || parts.length === 0) {
    return {
      passed: false,
      reason: "MANUAL_VISUAL_REVIEW_TRANSACTION_PARTS_REQUIRED",
      approvalTransactionId: null,
    };
  }
  const transactionIds = parts.map((part) =>
    part?.ready === true &&
    /^[a-f0-9]{64}$/.test(part?.approvalTransactionId ?? "")
      ? part.approvalTransactionId
      : null);
  if (transactionIds.some((transactionId) => transactionId == null)) {
    return {
      passed: false,
      reason: "MANUAL_VISUAL_REVIEW_TRANSACTION_PART_NOT_ACCEPTED",
      approvalTransactionId: null,
    };
  }
  const candidate = transactionIds[0];
  if (transactionIds.some((transactionId) => transactionId !== candidate)) {
    return {
      passed: false,
      reason: "MANUAL_VISUAL_REVIEW_TRANSACTION_MISMATCH",
      approvalTransactionId: null,
    };
  }
  return { passed: true, reason: null, approvalTransactionId: candidate };
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
    return {
      passed: false,
      reason: "MANUAL_VISUAL_REVIEW_EVIDENCE_MISSING",
      imageSetSha256,
      approvalTransactionId: null,
    };
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
    /^[a-f0-9]{64}$/.test(evidence.approvalTransactionId ?? "") &&
    typeof evidence.reviewedAt === "string" && Number.isFinite(Date.parse(evidence.reviewedAt)) &&
    evidence.sceneCount === summaryBindings.length &&
    evidence.imageSetSha256 === imageSetSha256 &&
    evidenceBindings != null &&
    JSON.stringify(evidenceBindings) === JSON.stringify(summaryBindings);
  return accepted
    ? {
        passed: true,
        reason: null,
        imageSetSha256,
        approvalTransactionId: evidence.approvalTransactionId,
      }
    : {
        passed: false,
        reason: "MANUAL_VISUAL_REVIEW_NOT_ACCEPTED_OR_STALE",
        imageSetSha256,
        approvalTransactionId: null,
      };
}
