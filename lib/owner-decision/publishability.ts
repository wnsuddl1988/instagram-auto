import type { FactCard } from "@/lib/source-facts/types";

export const PUBLISHABILITY_DECISION_SCHEMA_VERSION =
  "money_shorts_publishability_decision_v1" as const;

/**
 * Owner input for a publishability decision.
 * All fields must come from the Owner — no inference or generation.
 */
export interface PublishabilityDecisionInput {
  /** Must match the Fact Card being evaluated. */
  factCardId: string;
  decision: "approved" | "rejected" | "revision_requested" | null;
  /** Verbatim notes from the Owner. Null when no notes provided. */
  notes: string | null;
  /** ISO datetime injected by caller. No new Date() inside helper. */
  decidedAt?: string;
}

/** Machine-readable reason a publishability decision blocked `canMarkPublishable`. */
export type PublishabilityBlockerCode =
  | "decision_pending"
  | "decision_rejected"
  | "decision_revision_requested"
  | "fact_card_id_mismatch"
  | "mock_fact_card"
  | "missing_citations"
  | "source_url_missing"
  | "already_publishable";

/**
 * The result of evaluating whether an Owner decision would allow marking
 * a Fact Card publishable.
 *
 * This helper never mutates the input FactCard, never sets isPublishable=true,
 * and never persists anything. It only reports eligibility.
 */
export interface PublishabilityDecisionResult {
  schemaVersion: typeof PUBLISHABILITY_DECISION_SCHEMA_VERSION;
  decisionResultId: string;

  // Linkage
  factCardId: string;

  // Decision echo
  ownerDecision: PublishabilityDecisionInput["decision"];
  ownerNotes: string | null;
  decidedAt?: string;

  // Outcome
  /** True only when all pass conditions are met. Does NOT mutate the FactCard. */
  canMarkPublishable: boolean;
  blockerCodes: PublishabilityBlockerCode[];

  // Audit summary derived from the Fact Card (verbatim, no new facts)
  isMock: boolean;
  isAlreadyPublishable: boolean;
  citationCount: number;
  sourceName: string;
  sourceUrl: string;

  createdAt?: string;
}

export interface PublishabilityDecisionOptions {
  decisionResultId?: string;
  createdAt?: string;
}

/**
 * Evaluates whether an Owner decision would allow marking a Fact Card publishable.
 *
 * Pass conditions (all must be true for canMarkPublishable=true):
 * 1. decision is "approved"
 * 2. factCardId matches
 * 3. factCard is not mock (isMock=false)
 * 4. factCard has at least one citation
 * 5. sourceUrl exists and starts with "https://"
 * 6. factCard is not already publishable
 *
 * This helper is deterministic: no Date.now(), no Math.random(), no external calls.
 * It does not mutate the input FactCard or set isPublishable=true anywhere.
 */
export function evaluatePublishabilityDecision(
  factCard: FactCard,
  input: PublishabilityDecisionInput,
  options: PublishabilityDecisionOptions = {},
): PublishabilityDecisionResult {
  const decisionResultId =
    options.decisionResultId ?? `pub-decision-${factCard.id}`;

  const blockerCodes: PublishabilityBlockerCode[] = [];

  // 1. Decision state
  if (input.decision === null) {
    blockerCodes.push("decision_pending");
  } else if (input.decision === "rejected") {
    blockerCodes.push("decision_rejected");
  } else if (input.decision === "revision_requested") {
    blockerCodes.push("decision_revision_requested");
  }
  // "approved" adds no blocker from this check

  // 2. Fact Card ID must match
  if (input.factCardId !== factCard.id) {
    blockerCodes.push("fact_card_id_mismatch");
  }

  // 3. Must not be a mock Fact Card
  if (factCard.isMock) {
    blockerCodes.push("mock_fact_card");
  }

  // 4. Must have at least one citation
  if (factCard.citations.length === 0) {
    blockerCodes.push("missing_citations");
  }

  // 5. sourceUrl must exist and start with https://
  if (!factCard.sourceUrl || !factCard.sourceUrl.startsWith("https://")) {
    blockerCodes.push("source_url_missing");
  }

  // 6. Must not already be publishable
  if (factCard.isPublishable) {
    blockerCodes.push("already_publishable");
  }

  const canMarkPublishable = blockerCodes.length === 0;

  return {
    schemaVersion: PUBLISHABILITY_DECISION_SCHEMA_VERSION,
    decisionResultId,
    factCardId: factCard.id,
    ownerDecision: input.decision,
    ownerNotes: input.notes,
    decidedAt: input.decidedAt,
    canMarkPublishable,
    blockerCodes,
    isMock: factCard.isMock,
    isAlreadyPublishable: factCard.isPublishable,
    citationCount: factCard.citations.length,
    sourceName: factCard.sourceName,
    sourceUrl: factCard.sourceUrl,
    createdAt: options.createdAt,
  };
}
