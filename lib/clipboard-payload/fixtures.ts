import { inflationReviewPacket, brokenInflationReviewPacket } from "@/lib/review-packet/fixtures";
import { approvedGateResult, pendingGateResult, approvedButBlockedGateResult } from "@/lib/owner-decision/fixtures";
import { buildClipboardPayload } from "./builder";
import type { ClipboardPayload } from "./types";

const MOCK_CREATED_AT = "2026-06-25T09:00:00+09:00";

/**
 * Clipboard payload for the approved valid inflation package.
 * Expected: copyReady=true, sections populated.
 */
export const approvedClipboardPayload: ClipboardPayload = buildClipboardPayload(
  inflationReviewPacket,
  approvedGateResult,
  { clipboardPayloadId: "cp-payload-inflation-30s", createdAt: MOCK_CREATED_AT },
);

/**
 * Clipboard payload when gate is pending (not yet approved).
 * Expected: copyReady=false, blockerCodes=["gate_not_approved"], sections=null.
 */
export const pendingClipboardPayload: ClipboardPayload = buildClipboardPayload(
  inflationReviewPacket,
  pendingGateResult,
  { clipboardPayloadId: "cp-payload-inflation-pending", createdAt: MOCK_CREATED_AT },
);

/**
 * Clipboard payload when gate approved but QA/risk is blocked.
 * Expected: copyReady=false, blockerCodes=["gate_not_approved"], sections=null.
 */
export const blockedClipboardPayload: ClipboardPayload = buildClipboardPayload(
  brokenInflationReviewPacket,
  approvedButBlockedGateResult,
  { clipboardPayloadId: "cp-payload-inflation-blocked", createdAt: MOCK_CREATED_AT },
);
