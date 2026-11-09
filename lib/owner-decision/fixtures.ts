import {
  inflationReviewPacket,
  brokenInflationReviewPacket,
} from "@/lib/review-packet/fixtures";
import { evaluateOwnerDecision } from "./gate";
import type { OwnerDecisionGateResult } from "./types";

const MOCK_DECIDED_AT = "2026-06-25T09:00:00+09:00";
const MOCK_CREATED_AT = "2026-06-25T09:00:00+09:00";

/**
 * Gate result for an approved valid review packet.
 * Expected: canProceedToRender=true, blockerCodes=[].
 */
export const approvedGateResult: OwnerDecisionGateResult = evaluateOwnerDecision(
  inflationReviewPacket,
  {
    reviewPacketId: inflationReviewPacket.reviewPacketId,
    decision: "approved",
    notes: null,
    decidedAt: MOCK_DECIDED_AT,
  },
  { gateResultId: "gate-approved-inflation-30s", createdAt: MOCK_CREATED_AT },
);

/**
 * Gate result for a rejected review packet.
 * Expected: canProceedToRender=false, blockerCodes=["decision_rejected"].
 */
export const rejectedGateResult: OwnerDecisionGateResult = evaluateOwnerDecision(
  inflationReviewPacket,
  {
    reviewPacketId: inflationReviewPacket.reviewPacketId,
    decision: "rejected",
    notes: "내용이 충분하지 않습니다.",
    decidedAt: MOCK_DECIDED_AT,
  },
  { gateResultId: "gate-rejected-inflation-30s", createdAt: MOCK_CREATED_AT },
);

/**
 * Gate result for a revision-requested review packet.
 * Expected: canProceedToRender=false, blockerCodes=["decision_revision_requested"].
 */
export const revisionRequestedGateResult: OwnerDecisionGateResult = evaluateOwnerDecision(
  inflationReviewPacket,
  {
    reviewPacketId: inflationReviewPacket.reviewPacketId,
    decision: "revision_requested",
    notes: "CTA 문구를 수정해 주세요.",
    decidedAt: MOCK_DECIDED_AT,
  },
  { gateResultId: "gate-revision-inflation-30s", createdAt: MOCK_CREATED_AT },
);

/**
 * Gate result when the Owner has not yet decided (pending).
 * Expected: canProceedToRender=false, blockerCodes=["decision_pending"].
 */
export const pendingGateResult: OwnerDecisionGateResult = evaluateOwnerDecision(
  inflationReviewPacket,
  {
    reviewPacketId: inflationReviewPacket.reviewPacketId,
    decision: null,
    notes: null,
  },
  { gateResultId: "gate-pending-inflation-30s", createdAt: MOCK_CREATED_AT },
);

/**
 * Gate result when the review packet is approved but the QA / risk is blocked.
 * Expected: canProceedToRender=false, blockerCodes includes "qa_not_ready" and "risk_blocked".
 */
export const approvedButBlockedGateResult: OwnerDecisionGateResult = evaluateOwnerDecision(
  brokenInflationReviewPacket,
  {
    reviewPacketId: brokenInflationReviewPacket.reviewPacketId,
    decision: "approved",
    notes: null,
    decidedAt: MOCK_DECIDED_AT,
  },
  { gateResultId: "gate-approved-blocked-30s", createdAt: MOCK_CREATED_AT },
);
