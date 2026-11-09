import type { FactCard } from "@/lib/source-facts/types";
import type { LocalApprovalRecord } from "@/lib/owner-decision/local-approval-ledger";
import { evaluatePublishabilityDecision } from "@/lib/owner-decision/publishability";
import { assembleContentPackage } from "@/lib/content-package/assembler";
import { generateReviewPacket } from "@/lib/review-packet/generator";
import { evaluateOwnerDecision } from "@/lib/owner-decision/gate";
import { buildClipboardPayload } from "@/lib/clipboard-payload/builder";

// ── Types ────────────────────────────────────────────────────────────────────

export type LedgerOverlayInactiveReason =
  | "no_record"
  | "mock_blocked"
  | "ledger_stale_or_ineligible";

export type LedgerOverlayResult =
  | { active: false; reason: LedgerOverlayInactiveReason }
  | {
      active: true;
      overlayGate: ReturnType<typeof evaluateOwnerDecision>;
      overlayClipboard: ReturnType<typeof buildClipboardPayload>;
      approvalId: string;
    };

// ── Exhaustive inactive message map ──────────────────────────────────────────
// TypeScript enforces that all LedgerOverlayInactiveReason values are covered.

export const LEDGER_OVERLAY_INACTIVE_MESSAGES: Record<
  LedgerOverlayInactiveReason,
  string
> = {
  no_record:
    "Ledger 기록 없음 — 로컬 승인 기록 후 reload하면 overlay가 활성화됩니다.",
  mock_blocked:
    "Mock Fact Card — overlay 비활성화 (isMock=true Fact Card는 승인 불가).",
  ledger_stale_or_ineligible:
    "Ledger 기록이 있지만 현재 Fact Card와 불일치하거나 재검증 실패 — overlay 비활성화 (stale/hand-edited ledger 또는 현재 Fact Card eligibility 실패).",
};

// ── Options ───────────────────────────────────────────────────────────────────

export interface LedgerOverlayOptions {
  /** Deterministic IDs for the overlay pipeline artifacts. */
  overlayContentPackageId: string;
  overlayReviewPacketId: string;
  overlayGateResultId: string;
  mockVideoId: string;
  mockCreatedAt: string;
  mockAudioDurationSec: number;
}

// ── evaluateLedgerOverlay ─────────────────────────────────────────────────────
//
// Pure helper — no fs access, no DB, no clipboard, no Date.now().
// Safety invariants preserved:
//   Guard 1: no ledger record -> inactive no_record
//   Guard 2: factCard.isMock -> inactive mock_blocked
//   Guard 3: 10-field audit mismatch -> inactive ledger_stale_or_ineligible
//   Guard 4: evaluatePublishabilityDecision re-run fails -> inactive ledger_stale_or_ineligible
//   Active: memory-only clone { ...factCard, isPublishable: true }; original factCard NEVER mutated.

export function evaluateLedgerOverlay(
  factCard: FactCard,
  initialLedgerRecord: LocalApprovalRecord | null,
  options: LedgerOverlayOptions,
): LedgerOverlayResult {
  const {
    overlayContentPackageId,
    overlayReviewPacketId,
    overlayGateResultId,
    mockVideoId,
    mockCreatedAt,
    mockAudioDurationSec,
  } = options;

  // Guard 1 — no ledger record at all
  if (!initialLedgerRecord) return { active: false, reason: "no_record" };

  // Guard 2 — current server-side Fact Card must be non-mock
  if (factCard.isMock) return { active: false, reason: "mock_blocked" };

  // Guard 3 — ledger record must reference the current Fact Card exactly
  const rec = initialLedgerRecord;
  const auditMismatch =
    rec.factCardId !== factCard.id ||
    rec.decisionResult.factCardId !== factCard.id ||
    rec.decisionResult.ownerDecision !== "approved" ||
    !rec.decisionResult.canMarkPublishable ||
    rec.audit.isMock !== factCard.isMock ||
    rec.audit.sourceName !== factCard.sourceName ||
    rec.audit.sourceUrl !== factCard.sourceUrl ||
    rec.audit.primarySourceProviderId !== factCard.primarySourceProviderId ||
    rec.audit.citationCount !== factCard.citations.length ||
    rec.audit.publishedDate !== factCard.publishedDate ||
    rec.audit.dataPeriod !== factCard.dataPeriod;
  if (auditMismatch) return { active: false, reason: "ledger_stale_or_ineligible" };

  // Guard 4 — re-run evaluatePublishabilityDecision against current Fact Card
  const currentEligibility = evaluatePublishabilityDecision(
    factCard,
    {
      factCardId: factCard.id,
      decision: "approved",
      notes: `re-validation at overlay open — ledger approvalId: ${rec.approvalId}`,
    },
    {
      decisionResultId: `pub-overlay-revalidate-${factCard.id}`,
      createdAt: mockCreatedAt,
    },
  );
  if (!currentEligibility.canMarkPublishable) {
    return { active: false, reason: "ledger_stale_or_ineligible" };
  }

  // All guards passed — build memory-only publishable clone. Original factCard is NOT mutated.
  const overlayFactCard = { ...factCard, isPublishable: true };
  const overlayPkg = assembleContentPackage(
    overlayFactCard,
    { videoId: mockVideoId, createdAt: mockCreatedAt },
    {
      contentPackageId: overlayContentPackageId,
      createdAt: mockCreatedAt,
      measuredAudioDurationSec: mockAudioDurationSec,
    },
  );
  const overlayReview = generateReviewPacket(overlayPkg, {
    reviewPacketId: overlayReviewPacketId,
    createdAt: mockCreatedAt,
  });
  const overlayGate = evaluateOwnerDecision(
    overlayReview,
    {
      reviewPacketId: overlayReviewPacketId,
      decision: "approved",
      notes: `로컬 승인 ledger — approvalId: ${rec.approvalId}`,
      decidedAt: rec.recordedAt,
    },
    { gateResultId: overlayGateResultId, createdAt: mockCreatedAt },
  );
  const overlayClipboard = buildClipboardPayload(overlayReview, overlayGate, {
    createdAt: mockCreatedAt,
  });

  return {
    active: true,
    overlayGate,
    overlayClipboard,
    approvalId: rec.approvalId,
  };
}
