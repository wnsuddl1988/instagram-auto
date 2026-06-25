import { inflationReviewPacket, brokenInflationReviewPacket } from "@/lib/review-packet/fixtures";
import {
  approvedGateResult,
  pendingGateResult,
  rejectedGateResult,
  approvedButBlockedGateResult,
} from "@/lib/owner-decision/fixtures";
import { approvedClipboardPayload, pendingClipboardPayload, blockedClipboardPayload } from "@/lib/clipboard-payload/fixtures";
import {
  buildPackageListItem,
  buildPackageDetailModel,
  buildPackageWorkflowStatus,
  buildPackageCopyActionSummary,
} from "./builder";
import type {
  PackageListItem,
  PackageDetailModel,
  PackageWorkflowStatus,
  PackageCopyActionSummary,
  PackageViewInputs,
} from "./types";

const MOCK_CREATED_AT = "2026-06-25T09:00:00+09:00";

// --- Approved (copy-ready) package inputs ---

const approvedInputs: PackageViewInputs = {
  reviewPacket: inflationReviewPacket,
  gateResult: approvedGateResult,
  clipboardPayload: approvedClipboardPayload,
};

/**
 * List item for a fully approved, copy-ready package.
 * Expected: gateStatus="approved", copyReady=true, qaReady=true, riskBlocked=false.
 */
export const approvedListItem: PackageListItem = buildPackageListItem(approvedInputs, {
  createdAt: MOCK_CREATED_AT,
});

/**
 * Detail model for a fully approved, copy-ready package.
 * Expected: canProceedToRender=true, copyReady=true, gateBlockerCodes=[], copyBlockerCodes=[].
 */
export const approvedDetailModel: PackageDetailModel = buildPackageDetailModel(approvedInputs, {
  createdAt: MOCK_CREATED_AT,
});

/**
 * Workflow status for approved package.
 * Expected: hasClipboardPayload=true, hasGateResult=true, canProceedToRender=true.
 */
export const approvedWorkflowStatus: PackageWorkflowStatus =
  buildPackageWorkflowStatus(approvedInputs);

/**
 * Copy action summary for approved package.
 * Expected: copyReady=true, blockerLabels=[].
 */
export const approvedCopyActionSummary: PackageCopyActionSummary =
  buildPackageCopyActionSummary(approvedInputs);

// --- Pending (no gate decision yet) package inputs ---

const pendingInputs: PackageViewInputs = {
  reviewPacket: inflationReviewPacket,
  gateResult: pendingGateResult,
  clipboardPayload: pendingClipboardPayload,
};

/**
 * List item for a pending (not yet decided) package.
 * Expected: gateStatus="pending", copyReady=false.
 */
export const pendingListItem: PackageListItem = buildPackageListItem(pendingInputs, {
  createdAt: MOCK_CREATED_AT,
});

/**
 * Detail model for a pending package.
 * Expected: canProceedToRender=false, copyReady=false, gateBlockerCodes=["decision_pending"].
 */
export const pendingDetailModel: PackageDetailModel = buildPackageDetailModel(pendingInputs, {
  createdAt: MOCK_CREATED_AT,
});

/**
 * Workflow status for pending package.
 */
export const pendingWorkflowStatus: PackageWorkflowStatus =
  buildPackageWorkflowStatus(pendingInputs);

/**
 * Pending copy action summary.
 * Expected: copyReady=false, blockerLabels non-empty (decision_pending).
 */
export const pendingCopyActionSummary: PackageCopyActionSummary =
  buildPackageCopyActionSummary(pendingInputs);

// --- Rejected package inputs ---

const rejectedInputs: PackageViewInputs = {
  reviewPacket: inflationReviewPacket,
  gateResult: rejectedGateResult,
  clipboardPayload: null,
};

/**
 * List item for a rejected package.
 * Expected: gateStatus="rejected", copyReady=false.
 */
export const rejectedListItem: PackageListItem = buildPackageListItem(rejectedInputs, {
  createdAt: MOCK_CREATED_AT,
});

/**
 * Detail model for a rejected package.
 * Expected: canProceedToRender=false, copyReady=false, clipboardPayloadId=null.
 */
export const rejectedDetailModel: PackageDetailModel = buildPackageDetailModel(rejectedInputs, {
  createdAt: MOCK_CREATED_AT,
});

/**
 * Copy action summary for rejected package.
 * Expected: copyReady=false, blockerLabels non-empty (decision_rejected).
 */
export const rejectedCopyActionSummary: PackageCopyActionSummary =
  buildPackageCopyActionSummary(rejectedInputs);

// --- Approved-but-blocked (QA/risk blocked) package inputs ---

const blockedInputs: PackageViewInputs = {
  reviewPacket: brokenInflationReviewPacket,
  gateResult: approvedButBlockedGateResult,
  clipboardPayload: blockedClipboardPayload,
};

/**
 * List item for an approved-but-blocked package (QA/risk failed).
 * Expected: gateStatus="approved_but_blocked", copyReady=false, riskBlocked=true.
 */
export const blockedListItem: PackageListItem = buildPackageListItem(blockedInputs, {
  createdAt: MOCK_CREATED_AT,
});

/**
 * Detail model for an approved-but-blocked package.
 * Expected: canProceedToRender=false, copyReady=false, qa.readyForRender=false, risk.isBlocked=true.
 */
export const blockedDetailModel: PackageDetailModel = buildPackageDetailModel(blockedInputs, {
  createdAt: MOCK_CREATED_AT,
});

/**
 * Copy action summary for blocked package.
 * Expected: copyReady=false, blockerLabels non-empty.
 */
export const blockedCopyActionSummary: PackageCopyActionSummary =
  buildPackageCopyActionSummary(blockedInputs);

// --- No-gate/no-clipboard (initial state) package inputs ---

const noGateInputs: PackageViewInputs = {
  reviewPacket: inflationReviewPacket,
  gateResult: null,
  clipboardPayload: null,
};

/**
 * List item for initial state (no gate decision, no clipboard payload yet).
 * Expected: gateStatus="pending", copyReady=false, hasClipboardPayload=false.
 */
export const noGateListItem: PackageListItem = buildPackageListItem(noGateInputs, {
  createdAt: MOCK_CREATED_AT,
});

/**
 * Copy action summary for initial state (no gate decision).
 * Expected: copyReady=false, blockerLabels non-empty (synthesized decision_pending).
 */
export const noGateCopyActionSummary: PackageCopyActionSummary =
  buildPackageCopyActionSummary(noGateInputs);

/**
 * Workflow status for initial state.
 * Expected: hasGateResult=false, gateStatus="pending", copyReady=false.
 */
export const noGateWorkflowStatus: PackageWorkflowStatus =
  buildPackageWorkflowStatus(noGateInputs);
