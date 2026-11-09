import type { OwnerDecision } from "@/lib/review-packet/types";

export const OWNER_DECISION_GATE_SCHEMA_VERSION =
  "money_shorts_owner_decision_gate_v1" as const;

/**
 * Explicit Owner decision input supplied when evaluating a review packet.
 * All fields must come from the Owner — no inference or generation.
 */
export interface OwnerDecisionInput {
  /** Must match the review packet being evaluated. */
  reviewPacketId: string;
  decision: OwnerDecision;
  /** Verbatim notes from the Owner. Null when no notes provided. */
  notes: string | null;
  /** ISO datetime injected by caller. No new Date() inside gate helper. */
  decidedAt?: string;
}

/** Machine-readable reason a gate evaluation blocked `canProceedToRender`. */
export type GateBlockerCode =
  | "decision_pending"
  | "decision_rejected"
  | "unsupported_decision"
  | "decision_revision_requested"
  | "qa_not_ready"
  | "risk_blocked"
  | "review_packet_id_mismatch"
  | "fact_card_not_publishable";

/** The result of evaluating an Owner decision against a review packet. */
export interface OwnerDecisionGateResult {
  schemaVersion: typeof OWNER_DECISION_GATE_SCHEMA_VERSION;
  gateResultId: string;

  // Linkage ids preserved verbatim from the review packet
  reviewPacketId: string;
  contentPackageId: string;
  factCardIds: string[];
  sourceCitationIds: string[];
  blueprintVideoId: string;
  scriptPackageId: string;
  chartCardPackageId: string;
  imagePromptPackageId: string;
  voiceProfileId: string;
  ttsPackageId: string;
  timelineId: string;
  renderManifestId: string;

  // Decision echo
  ownerDecision: OwnerDecision;
  ownerNotes: string | null;

  // Gate outcome
  /** True only when decision=approved AND qa.readyForRender=true AND risk.isBlocked=false. */
  canProceedToRender: boolean;
  blockerCodes: GateBlockerCode[];

  // Summaries forwarded from review packet
  qa: {
    readyForRender: boolean;
    isRiskBlocked: boolean;
    blockersFailed: number;
    failedCheckCodes: string[];
  };
  risk: {
    overallRiskLevel: string;
    isBlocked: boolean;
    findingCount: number;
  };

  decidedAt?: string;
  createdAt?: string;
}

/** Options for the gate evaluator. */
export interface OwnerDecisionGateOptions {
  gateResultId?: string;
  createdAt?: string;
}
