import type { ReviewPacket } from "@/lib/review-packet/types";
import type {
  OwnerDecisionInput,
  OwnerDecisionGateResult,
  OwnerDecisionGateOptions,
  GateBlockerCode,
} from "./types";
import { OWNER_DECISION_GATE_SCHEMA_VERSION } from "./types";

/**
 * Evaluates an Owner decision against a review packet and returns a gate result.
 *
 * - Deterministic: no new Date(), no external calls, no AI generation.
 * - Does not mutate the incoming ReviewPacket.
 * - canProceedToRender=true only when:
 *     decision === "approved" AND qa.readyForRender=true AND risk.isBlocked=false
 */
export function evaluateOwnerDecision(
  packet: ReviewPacket,
  input: OwnerDecisionInput,
  options: OwnerDecisionGateOptions = {},
): OwnerDecisionGateResult {
  const gateResultId =
    options.gateResultId ?? `gate-${packet.reviewPacketId}`;

  const blockerCodes: GateBlockerCode[] = [];

  // reviewPacketId must match
  if (input.reviewPacketId !== packet.reviewPacketId) {
    blockerCodes.push("review_packet_id_mismatch");
  }

  // Decision check — only "approved" passes; all other values block.
  if (input.decision === "approved") {
    // no decision blocker
  } else if (input.decision === null) {
    blockerCodes.push("decision_pending");
  } else if (input.decision === "rejected") {
    blockerCodes.push("decision_rejected");
  } else if (input.decision === "revision_requested") {
    blockerCodes.push("decision_revision_requested");
  } else {
    blockerCodes.push("unsupported_decision");
  }

  // QA readiness
  if (!packet.qa.readyForRender) {
    blockerCodes.push("qa_not_ready");
  }

  // Risk block
  if (packet.risk.isBlocked) {
    blockerCodes.push("risk_blocked");
  }

  const canProceedToRender = blockerCodes.length === 0;

  return {
    schemaVersion: OWNER_DECISION_GATE_SCHEMA_VERSION,
    gateResultId,

    reviewPacketId: packet.reviewPacketId,
    contentPackageId: packet.contentPackageId,
    factCardIds: packet.factCardIds,
    sourceCitationIds: packet.sourceCitationIds,
    blueprintVideoId: packet.blueprintVideoId,
    scriptPackageId: packet.scriptPackageId,
    chartCardPackageId: packet.chartCardPackageId,
    imagePromptPackageId: packet.imagePromptPackageId,
    voiceProfileId: packet.voiceProfileId,
    ttsPackageId: packet.ttsPackageId,
    timelineId: packet.timelineId,
    renderManifestId: packet.renderManifestId,

    ownerDecision: input.decision,
    ownerNotes: input.notes,

    canProceedToRender,
    blockerCodes,

    qa: {
      readyForRender: packet.qa.readyForRender,
      isRiskBlocked: packet.qa.isRiskBlocked,
      blockersFailed: packet.qa.blockersFailed,
      failedCheckCodes: packet.qa.failedCheckCodes,
    },
    risk: {
      overallRiskLevel: packet.risk.overallRiskLevel,
      isBlocked: packet.risk.isBlocked,
      findingCount: packet.risk.findingCount,
    },

    ...(input.decidedAt !== undefined ? { decidedAt: input.decidedAt } : {}),
    ...(options.createdAt !== undefined ? { createdAt: options.createdAt } : {}),
  };
}
