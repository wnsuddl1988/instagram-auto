import {
  approvedListItem,
  approvedDetailModel,
  approvedWorkflowStatus,
  approvedCopyActionSummary,
  pendingListItem,
  pendingDetailModel,
  pendingWorkflowStatus,
  pendingCopyActionSummary,
  rejectedListItem,
  rejectedDetailModel,
  rejectedCopyActionSummary,
  blockedListItem,
  blockedDetailModel,
  blockedCopyActionSummary,
  noGateListItem,
  noGateCopyActionSummary,
  noGateWorkflowStatus,
} from "@/lib/package-view/fixtures";
import {
  buildPackageDetailModel,
  buildPackageWorkflowStatus,
} from "@/lib/package-view/builder";
import { inflationReviewPacket, brokenInflationReviewPacket } from "@/lib/review-packet/fixtures";
import {
  rejectedGateResult,
  approvedButBlockedGateResult,
} from "@/lib/owner-decision/fixtures";
import { blockedClipboardPayload } from "@/lib/clipboard-payload/fixtures";
import type {
  PackageListItem,
  PackageDetailModel,
  PackageCopyActionSummary,
  PackageWorkflowStatus,
} from "@/lib/package-view/types";
import PackageLibraryView from "./PackageLibraryClient";

const MOCK_CREATED_AT = "2026-06-25T09:00:00+09:00";

const noGateDetailModel = buildPackageDetailModel(
  { reviewPacket: inflationReviewPacket, gateResult: null, clipboardPayload: null },
  { createdAt: MOCK_CREATED_AT },
);

const rejectedWorkflowStatus = buildPackageWorkflowStatus({
  reviewPacket: inflationReviewPacket,
  gateResult: rejectedGateResult,
  clipboardPayload: null,
});

const blockedWorkflowStatus = buildPackageWorkflowStatus({
  reviewPacket: brokenInflationReviewPacket,
  gateResult: approvedButBlockedGateResult,
  clipboardPayload: blockedClipboardPayload,
});

export interface PackageEntry {
  listItem: PackageListItem;
  detailModel: PackageDetailModel;
  copyActionSummary: PackageCopyActionSummary;
  workflowStatus: PackageWorkflowStatus | null;
}

const PACKAGES: PackageEntry[] = [
  {
    listItem: approvedListItem,
    detailModel: approvedDetailModel,
    copyActionSummary: approvedCopyActionSummary,
    workflowStatus: approvedWorkflowStatus,
  },
  {
    listItem: pendingListItem,
    detailModel: pendingDetailModel,
    copyActionSummary: pendingCopyActionSummary,
    workflowStatus: pendingWorkflowStatus,
  },
  {
    listItem: rejectedListItem,
    detailModel: rejectedDetailModel,
    copyActionSummary: rejectedCopyActionSummary,
    workflowStatus: rejectedWorkflowStatus,
  },
  {
    listItem: blockedListItem,
    detailModel: blockedDetailModel,
    copyActionSummary: blockedCopyActionSummary,
    workflowStatus: blockedWorkflowStatus,
  },
  {
    listItem: noGateListItem,
    detailModel: noGateDetailModel,
    copyActionSummary: noGateCopyActionSummary,
    workflowStatus: noGateWorkflowStatus,
  },
];

export default async function PackagesPage({
  searchParams,
}: {
  searchParams: Promise<{ selected?: string }>;
}) {
  const params = await searchParams;
  const raw = parseInt(params.selected ?? "0", 10);
  const selectedIndex = Number.isFinite(raw) && raw >= 0 && raw < PACKAGES.length ? raw : 0;

  return (
    <PackageLibraryView
      packages={PACKAGES}
      selectedIndex={selectedIndex}
    />
  );
}
