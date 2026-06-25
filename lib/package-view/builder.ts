import type {
  PackageListItem,
  PackageDetailModel,
  PackageWorkflowStatus,
  PackageCopyActionSummary,
  PackageGateStatus,
  PackageViewCounts,
  PackageViewInputs,
  PackageViewBuilderOptions,
} from "./types";
import { PACKAGE_VIEW_SCHEMA_VERSION } from "./types";

/** Derive the gate status label from gate result and owner decision. */
function resolveGateStatus(
  ownerDecision: string | null,
  canProceedToRender: boolean,
  hasGateResult: boolean,
): PackageGateStatus {
  if (!hasGateResult) return "pending";
  if (ownerDecision === "rejected") return "rejected";
  if (ownerDecision === "revision_requested") return "revision_requested";
  if (ownerDecision === "approved" && !canProceedToRender) return "approved_but_blocked";
  if (ownerDecision === "approved" && canProceedToRender) return "approved";
  return "pending";
}

/** Build compact counts from review packet fields. */
function buildCounts(
  inputs: PackageViewInputs,
): PackageViewCounts {
  const { reviewPacket } = inputs;
  return {
    scenes: reviewPacket.blueprint.sceneCount,
    scripts: reviewPacket.scripts.length,
    sources: reviewPacket.sourceRefs.length,
    hashtags: reviewPacket.socialCopy.hashtagCount,
  };
}

/**
 * Build a PackageListItem from the pipeline inputs.
 * All display text comes verbatim from existing package fields.
 */
export function buildPackageListItem(
  inputs: PackageViewInputs,
  options: PackageViewBuilderOptions = {},
): PackageListItem {
  const { reviewPacket, gateResult, clipboardPayload } = inputs;
  const hasGateResult = gateResult !== null;
  const canProceedToRender = gateResult?.canProceedToRender ?? false;
  const ownerDecision = gateResult?.ownerDecision ?? null;
  const gateStatus = resolveGateStatus(ownerDecision, canProceedToRender, hasGateResult);

  const primarySource = reviewPacket.sourceRefs[0] ?? null;
  const copyReady = clipboardPayload?.copyReady ?? false;

  return {
    schemaVersion: PACKAGE_VIEW_SCHEMA_VERSION,
    contentPackageId: reviewPacket.contentPackageId,
    reviewPacketId: reviewPacket.reviewPacketId,
    clipboardPayloadId: clipboardPayload?.clipboardPayloadId ?? null,
    gateResultId: gateResult?.gateResultId ?? null,

    topic: reviewPacket.socialCopy.topic,
    title: reviewPacket.socialCopy.title,
    coreMessage: reviewPacket.socialCopy.coreMessage,

    primarySourceName: primarySource?.sourceName ?? "",
    primarySourceDate: primarySource?.publishedDate ?? "",

    indicatorName: reviewPacket.factCard.indicatorName,
    currentValue: reviewPacket.factCard.currentValue,
    dataPeriod: reviewPacket.factCard.dataPeriod,

    gateStatus,
    copyReady,
    qaReady: reviewPacket.qa.readyForRender,
    riskBlocked: reviewPacket.risk.isBlocked,

    counts: buildCounts(inputs),

    createdAt: options.createdAt,
  };
}

/**
 * Build a PackageDetailModel from the pipeline inputs.
 * All text fields come verbatim from existing package fields — no new content generated.
 */
export function buildPackageDetailModel(
  inputs: PackageViewInputs,
  options: PackageViewBuilderOptions = {},
): PackageDetailModel {
  const { reviewPacket, gateResult, clipboardPayload } = inputs;
  const hasGateResult = gateResult !== null;
  const canProceedToRender = gateResult?.canProceedToRender ?? false;
  const ownerDecision = gateResult?.ownerDecision ?? null;
  const gateStatus = resolveGateStatus(ownerDecision, canProceedToRender, hasGateResult);

  const copyReady = clipboardPayload?.copyReady ?? false;
  const hashtagsText = reviewPacket.socialCopy.hashtags.join(" ");

  return {
    schemaVersion: PACKAGE_VIEW_SCHEMA_VERSION,

    contentPackageId: reviewPacket.contentPackageId,
    reviewPacketId: reviewPacket.reviewPacketId,
    clipboardPayloadId: clipboardPayload?.clipboardPayloadId ?? null,
    gateResultId: gateResult?.gateResultId ?? null,

    factCardIds: reviewPacket.factCardIds,
    sourceCitationIds: reviewPacket.sourceCitationIds,
    blueprintVideoId: reviewPacket.blueprintVideoId,
    scriptPackageId: reviewPacket.scriptPackageId,
    chartCardPackageId: reviewPacket.chartCardPackageId,
    imagePromptPackageId: reviewPacket.imagePromptPackageId,
    voiceProfileId: reviewPacket.voiceProfileId,
    ttsPackageId: reviewPacket.ttsPackageId,
    timelineId: reviewPacket.timelineId,
    renderManifestId: reviewPacket.renderManifestId,

    topic: reviewPacket.socialCopy.topic,
    title: reviewPacket.socialCopy.title,
    coreMessage: reviewPacket.socialCopy.coreMessage,
    youtubeTitle: reviewPacket.socialCopy.youtubeTitle,
    instagramCaption: reviewPacket.socialCopy.instagramCaption,
    hashtagsText,
    moneyOsCta: reviewPacket.socialCopy.moneyOsCta,

    factCard: {
      factCardId: reviewPacket.factCard.factCardId,
      indicatorName: reviewPacket.factCard.indicatorName,
      dataPeriod: reviewPacket.factCard.dataPeriod,
      currentValue: reviewPacket.factCard.currentValue,
    },

    sourceRefs: reviewPacket.sourceRefs.map((ref) => ({
      citationId: ref.citationId,
      sourceName: ref.sourceName,
      sourceUrl: ref.sourceUrl,
      publishedDate: ref.publishedDate,
    })),

    risk: {
      overallRiskLevel: reviewPacket.risk.overallRiskLevel,
      isBlocked: reviewPacket.risk.isBlocked,
      findingCount: reviewPacket.risk.findingCount,
    },

    qa: {
      readyForRender: reviewPacket.qa.readyForRender,
      isRiskBlocked: reviewPacket.qa.isRiskBlocked,
      blockersFailed: reviewPacket.qa.blockersFailed,
      failedCheckCodes: reviewPacket.qa.failedCheckCodes,
    },

    gateStatus,
    ownerNotes: gateResult?.ownerNotes ?? reviewPacket.ownerNotes,
    canProceedToRender,

    copyReady,
    gateBlockerCodes: gateResult?.blockerCodes ?? [],
    copyBlockerCodes: clipboardPayload?.blockerCodes ?? [],

    counts: buildCounts(inputs),

    createdAt: options.createdAt,
  };
}

/**
 * Build a PackageWorkflowStatus for the workflow status bar UI.
 */
export function buildPackageWorkflowStatus(
  inputs: PackageViewInputs,
): PackageWorkflowStatus {
  const { reviewPacket, gateResult, clipboardPayload } = inputs;
  const hasGateResult = gateResult !== null;
  const canProceedToRender = gateResult?.canProceedToRender ?? false;
  const ownerDecision = gateResult?.ownerDecision ?? null;
  const gateStatus = resolveGateStatus(ownerDecision, canProceedToRender, hasGateResult);

  return {
    schemaVersion: PACKAGE_VIEW_SCHEMA_VERSION,
    contentPackageId: reviewPacket.contentPackageId,
    reviewPacketId: reviewPacket.reviewPacketId,
    hasClipboardPayload: clipboardPayload !== null,
    hasGateResult,
    gateStatus,
    copyReady: clipboardPayload?.copyReady ?? false,
    qaReady: reviewPacket.qa.readyForRender,
    riskBlocked: reviewPacket.risk.isBlocked,
    canProceedToRender,
  };
}

/** Human-readable blocker label map. */
const BLOCKER_LABEL_MAP: Record<string, string> = {
  gate_not_approved: "승인 대기",
  review_packet_id_mismatch: "ID 불일치 (리뷰 패킷)",
  content_package_id_mismatch: "ID 불일치 (패키지)",
  decision_pending: "결정 미완료",
  decision_rejected: "반려됨",
  decision_revision_requested: "수정 요청됨",
  unsupported_decision: "지원되지 않는 결정",
  qa_not_ready: "QA 미통과",
  risk_blocked: "위험 항목 차단",
};

/**
 * Build a PackageCopyActionSummary for the action bar UI.
 * Merges gate blockers and clipboard blockers so the UI always shows
 * a meaningful reason when copyReady=false.
 * When gateResult is null and copying is not ready, synthesizes a pending blocker.
 */
export function buildPackageCopyActionSummary(
  inputs: PackageViewInputs,
): PackageCopyActionSummary {
  const { gateResult, clipboardPayload } = inputs;
  const copyReady = clipboardPayload?.copyReady ?? false;

  // Collect gate blockers first, then clipboard blockers; de-duplicate.
  const seen = new Set<string>();
  const allCodes: string[] = [];
  for (const code of (gateResult?.blockerCodes ?? [])) {
    if (!seen.has(code)) { seen.add(code); allCodes.push(code); }
  }
  for (const code of (clipboardPayload?.blockerCodes ?? [])) {
    if (!seen.has(code)) { seen.add(code); allCodes.push(code); }
  }

  // When gateResult is null and not copy-ready, synthesize a pending blocker.
  if (!copyReady && gateResult === null && allCodes.length === 0) {
    allCodes.push("decision_pending");
  }

  // When copyReady, no labels needed regardless of intermediate codes.
  const blockerLabels = copyReady
    ? []
    : allCodes.map((code) => BLOCKER_LABEL_MAP[code] ?? code);

  return {
    schemaVersion: PACKAGE_VIEW_SCHEMA_VERSION,
    clipboardPayloadId: clipboardPayload?.clipboardPayloadId ?? null,
    copyReady,
    blockerLabels,
  };
}
