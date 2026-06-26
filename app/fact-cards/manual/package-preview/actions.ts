"use server";

/**
 * Server Actions for package-preview local approval ledger.
 *
 * Safety:
 * - recordApproval() calls recordLocalPublishabilityApproval() which internally
 *   calls evaluatePublishabilityDecision() — refuses if not eligible.
 * - factCard is bound from the Server Component; client cannot supply its own.
 * - No FactCard mutation. No isPublishable=true set. No DB/Supabase/env call.
 * - No render/export/upload/clipboard triggered.
 * - recordedAt is injected server-side as a static constant (no Date.now()).
 */

import type { FactCard } from "@/lib/source-facts/types";
import {
  recordLocalPublishabilityApproval,
  getLocalPublishabilityApproval,
  type RecordApprovalResult,
  type LocalApprovalRecord,
} from "@/lib/owner-decision/local-approval-ledger";

// Static recordedAt — deterministic, no Date.now()
const ACTION_RECORDED_AT = "2026-06-26T09:00:00+09:00";
const ACTION_CREATED_AT = "2026-06-26T09:00:00+09:00";

/**
 * Record a publishability approval for the given Fact Card.
 * factCard is server-bound and must not be supplied by the client.
 * Returns the result of the ledger write attempt.
 */
export async function recordApproval(
  factCard: FactCard,
  notes: string | null,
): Promise<RecordApprovalResult> {
  return recordLocalPublishabilityApproval(
    factCard,
    {
      factCardId: factCard.id,
      decision: "approved",
      notes,
      decidedAt: ACTION_RECORDED_AT,
    },
    {
      approvalId: `approval-action-${factCard.id}`,
      decisionResultId: `pub-decision-action-${factCard.id}`,
      recordedAt: ACTION_RECORDED_AT,
      createdAt: ACTION_CREATED_AT,
    },
  );
}

/**
 * Read the current ledger record for a Fact Card (server-side, no mutation).
 */
export async function getLedgerRecord(
  factCardId: string,
): Promise<LocalApprovalRecord | null> {
  return getLocalPublishabilityApproval(factCardId);
}
