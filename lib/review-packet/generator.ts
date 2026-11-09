import type { AssembledContentPackage } from "@/lib/content-package/types";
import type {
  ReviewPacket,
  ReviewPacketOptions,
  ReviewSourceRef,
  ReviewFactCardSummary,
  ReviewBlueprintSummary,
  ReviewScriptSummary,
  ReviewRiskSummary,
  ReviewQaSummary,
  ReviewRenderSummary,
  ReviewSocialCopy,
} from "./types";
import { REVIEW_PACKET_SCHEMA_VERSION } from "./types";

/**
 * Converts an AssembledContentPackage into a compact Owner review packet.
 *
 * - Deterministic: no new Date(), no external calls, no AI generation.
 * - All text is copied verbatim from the existing package — no new facts invented.
 * - Owner decision fields initialized to pending (null).
 */
export function generateReviewPacket(
  pkg: AssembledContentPackage,
  options: ReviewPacketOptions = {},
): ReviewPacket {
  const { summary, factCard, blueprint, scriptPackage, riskReview, finalQa, timeline, renderManifest } = pkg;

  const reviewPacketId = options.reviewPacketId ?? `rp-${summary.contentPackageId}`;

  // Source refs — verbatim from factCard citations
  const sourceRefs: ReviewSourceRef[] = factCard.citations.map((c) => ({
    citationId: c.id,
    sourceName: c.sourceName,
    sourceUrl: c.sourceUrl,
    publishedDate: c.publishedDate,
  }));

  // Fact Card summary
  const factCardSummary: ReviewFactCardSummary = {
    factCardId: factCard.id,
    indicatorName: factCard.indicatorName,
    dataPeriod: factCard.dataPeriod,
    currentValue: factCard.currentValue,
    interpretation: factCard.interpretation,
    cautionNote: factCard.cautionNote,
    allowedClaimsCount: factCard.allowedClaims.length,
    blockedClaimsCount: factCard.blockedClaims.length,
    isPublishable: factCard.isPublishable,
  };

  // Blueprint summary
  const blueprintSummary: ReviewBlueprintSummary = {
    blueprintVideoId: blueprint.videoId,
    templateKey: blueprint.templateKey,
    targetDurationSec: blueprint.targetDurationSec,
    sceneCount: blueprint.scenes.length,
  };

  // Script summaries — one per duration variant
  const scriptSummaries: ReviewScriptSummary[] = scriptPackage.scripts.map((s) => ({
    targetDurationSec: s.targetDurationSec,
    sceneCount: s.scenes.length,
    fullNarration: s.fullNarration,
    captionTexts: s.scenes.map((sc) => sc.captionText),
  }));

  // Social copy — verbatim
  const socialCopy: ReviewSocialCopy = {
    title: scriptPackage.title,
    topic: scriptPackage.topic,
    coreMessage: scriptPackage.coreMessage,
    youtubeTitle: scriptPackage.youtubeTitle,
    instagramCaption: scriptPackage.instagramCaption,
    hashtags: scriptPackage.hashtags,
    hashtagCount: scriptPackage.hashtags.length,
    moneyOsCta: scriptPackage.moneyOsCta,
  };

  // Risk summary
  const riskSummary: ReviewRiskSummary = {
    overallRiskLevel: riskReview.overallRiskLevel,
    isBlocked: riskReview.isBlocked,
    findingCount: riskReview.findings.length,
    findingCodes: riskReview.findings.map((f) => f.code),
  };

  // QA summary
  const failedCheckCodes = finalQa.checks
    .filter((c) => !c.passed && c.code !== null)
    .map((c) => c.code as string);

  const qaSummary: ReviewQaSummary = {
    readyForRender: finalQa.readyForRender,
    isRiskBlocked: finalQa.isRiskBlocked,
    totalChecks: finalQa.summary.total,
    passedChecks: finalQa.summary.passed,
    failedChecks: finalQa.summary.failed,
    blockersFailed: finalQa.summary.blockersFailed,
    failedCheckCodes,
  };

  // Render/timeline summary
  const renderSummary: ReviewRenderSummary = {
    timelineId: timeline.timelineId,
    renderManifestId: renderManifest.manifestId,
    plannedDurationSec: renderManifest.ffmpegPlan.estimatedDurationSec,
    measuredAudioDurationSec: timeline.measuredAudioDurationSec,
    sceneCount: timeline.scenes.length,
  };

  return {
    schemaVersion: REVIEW_PACKET_SCHEMA_VERSION,
    reviewPacketId,
    contentPackageId: summary.contentPackageId,

    factCardIds: summary.factCardIds,
    sourceCitationIds: summary.sourceCitationIds,
    blueprintVideoId: summary.blueprintVideoId,
    scriptPackageId: summary.scriptPackageId,
    chartCardPackageId: summary.chartCardPackageId,
    imagePromptPackageId: summary.imagePromptPackageId,
    voiceProfileId: summary.voiceProfileId,
    ttsPackageId: summary.ttsPackageId,
    timelineId: summary.timelineId,
    renderManifestId: summary.renderManifestId,

    sourceRefs,
    factCard: factCardSummary,
    blueprint: blueprintSummary,
    scripts: scriptSummaries,
    socialCopy,
    risk: riskSummary,
    qa: qaSummary,
    render: renderSummary,

    needsOwnerApproval: true,
    ownerDecision: null,
    ownerNotes: null,

    ...(options.createdAt !== undefined ? { createdAt: options.createdAt } : {}),
  };
}
