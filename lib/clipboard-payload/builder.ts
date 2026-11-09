import type { ReviewPacket } from "@/lib/review-packet/types";
import type { OwnerDecisionGateResult } from "@/lib/owner-decision/types";
import type {
  ClipboardPayload,
  ClipboardPayloadOptions,
  ClipboardCopySections,
  CopyBlockerCode,
  CopyScriptSection,
  CopySourceRef,
  CopyQaRiskWarning,
} from "./types";
import { CLIPBOARD_PAYLOAD_SCHEMA_VERSION } from "./types";

/**
 * Builds a clipboard payload from an approved ReviewPacket + OwnerDecisionGateResult.
 *
 * - Deterministic: no new Date(), no external calls, no AI generation.
 * - No OS clipboard access.
 * - All copy text verbatim from ReviewPacket fields.
 * - copyReady=true only when gate.canProceedToRender=true AND ids match.
 */
export function buildClipboardPayload(
  packet: ReviewPacket,
  gate: OwnerDecisionGateResult,
  options: ClipboardPayloadOptions = {},
): ClipboardPayload {
  const clipboardPayloadId =
    options.clipboardPayloadId ?? `cp-payload-${packet.reviewPacketId}`;

  const blockerCodes: CopyBlockerCode[] = [];

  if (!gate.canProceedToRender) {
    blockerCodes.push("gate_not_approved");
  }
  if (gate.reviewPacketId !== packet.reviewPacketId) {
    blockerCodes.push("review_packet_id_mismatch");
  }
  if (gate.contentPackageId !== packet.contentPackageId) {
    blockerCodes.push("content_package_id_mismatch");
  }

  const copyReady = blockerCodes.length === 0;

  // QA/risk warning always surfaced for Owner visibility
  const qaRiskWarning: CopyQaRiskWarning = {
    readyForRender: packet.qa.readyForRender,
    isRiskBlocked: packet.qa.isRiskBlocked,
    overallRiskLevel: packet.risk.overallRiskLevel,
    findingCount: packet.risk.findingCount,
    failedCheckCodes: packet.qa.failedCheckCodes,
  };

  // Build sections only when ready
  let sections: ClipboardCopySections | null = null;
  if (copyReady) {
    const scripts: CopyScriptSection[] = packet.scripts.map((s) => ({
      targetDurationSec: s.targetDurationSec,
      fullNarration: s.fullNarration,
      captionTexts: s.captionTexts,
    }));

    const sourceRefs: CopySourceRef[] = packet.sourceRefs.map((ref) => ({
      citationId: ref.citationId,
      sourceName: ref.sourceName,
      sourceUrl: ref.sourceUrl,
      publishedDate: ref.publishedDate,
      attributionLine: `출처: ${ref.sourceName} (${ref.publishedDate}) — ${ref.sourceUrl}`,
    }));

    sections = {
      title: packet.socialCopy.title,
      topic: packet.socialCopy.topic,
      coreMessage: packet.socialCopy.coreMessage,
      youtubeTitle: packet.socialCopy.youtubeTitle,
      instagramCaption: packet.socialCopy.instagramCaption,
      hashtagsText: packet.socialCopy.hashtags.join(" "),
      moneyOsCta: packet.socialCopy.moneyOsCta,
      scripts,
      sourceRefs,
    };
  }

  return {
    schemaVersion: CLIPBOARD_PAYLOAD_SCHEMA_VERSION,
    clipboardPayloadId,

    reviewPacketId: packet.reviewPacketId,
    contentPackageId: packet.contentPackageId,
    factCardIds: packet.factCardIds,
    sourceCitationIds: packet.sourceCitationIds,
    blueprintVideoId: packet.blueprintVideoId,
    scriptPackageId: packet.scriptPackageId,
    gateResultId: gate.gateResultId,

    copyReady,
    blockerCodes,
    sections,
    qaRiskWarning,

    ...(options.createdAt !== undefined ? { createdAt: options.createdAt } : {}),
  };
}
