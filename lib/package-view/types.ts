export const PACKAGE_VIEW_SCHEMA_VERSION = "money_shorts_package_view_v1" as const;

/**
 * Status of an Owner gate decision for UI display.
 * Derived from OwnerDecisionGateResult.canProceedToRender and ownerDecision.
 */
export type PackageGateStatus =
  | "approved"
  | "pending"
  | "rejected"
  | "revision_requested"
  | "approved_but_blocked";

/** Compact risk summary for UI. */
export interface PackageViewRiskSummary {
  overallRiskLevel: string;
  isBlocked: boolean;
  findingCount: number;
}

/** Compact QA summary for UI. */
export interface PackageViewQaSummary {
  readyForRender: boolean;
  isRiskBlocked: boolean;
  blockersFailed: number;
  failedCheckCodes: string[];
}

/** Source attribution for UI display. */
export interface PackageViewSourceRef {
  citationId: string;
  sourceName: string;
  sourceUrl: string;
  publishedDate: string;
}

/** Fact Card summary for UI display. */
export interface PackageViewFactCard {
  factCardId: string;
  indicatorName: string;
  dataPeriod: string;
  currentValue: string;
}

/** Compact counts for UI badges. */
export interface PackageViewCounts {
  scenes: number;
  scripts: number;
  sources: number;
  hashtags: number;
}

/**
 * A compact list item view model for the Package Library screen.
 * Contains only the fields needed to render a row/card in a list.
 */
export interface PackageListItem {
  schemaVersion: typeof PACKAGE_VIEW_SCHEMA_VERSION;

  // Primary ids
  contentPackageId: string;
  reviewPacketId: string;
  clipboardPayloadId: string | null;
  gateResultId: string | null;

  // Display fields
  topic: string;
  title: string;
  coreMessage: string;

  // Source info (first source)
  primarySourceName: string;
  primarySourceDate: string;

  // Fact card indicator
  indicatorName: string;
  currentValue: string;
  dataPeriod: string;

  // Status flags
  gateStatus: PackageGateStatus;
  copyReady: boolean;
  qaReady: boolean;
  riskBlocked: boolean;

  // Compact counts
  counts: PackageViewCounts;

  createdAt?: string;
}

/**
 * A full detail view model for the Package Detail screen.
 * Contains all fields needed to render the full review + copy UI.
 */
export interface PackageDetailModel {
  schemaVersion: typeof PACKAGE_VIEW_SCHEMA_VERSION;

  // Primary ids
  contentPackageId: string;
  reviewPacketId: string;
  clipboardPayloadId: string | null;
  gateResultId: string | null;

  // Linkage ids preserved verbatim
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

  // Content
  topic: string;
  title: string;
  coreMessage: string;
  youtubeTitle: string;
  instagramCaption: string;
  hashtagsText: string;
  moneyOsCta: string | null;

  // Fact card
  factCard: PackageViewFactCard;

  // Sources
  sourceRefs: PackageViewSourceRef[];

  // Risk and QA
  risk: PackageViewRiskSummary;
  qa: PackageViewQaSummary;

  // Gate / Owner decision
  gateStatus: PackageGateStatus;
  ownerNotes: string | null;
  canProceedToRender: boolean;

  // Copy availability
  copyReady: boolean;
  /** Gate blockers (from OwnerDecisionGateResult.blockerCodes), empty when approved. */
  gateBlockerCodes: string[];
  /** Copy blockers (from ClipboardPayload.blockerCodes), empty when copyReady. */
  copyBlockerCodes: string[];

  // Compact counts
  counts: PackageViewCounts;

  createdAt?: string;
}

/** Summary of workflow/status for the workflow status bar UI. */
export interface PackageWorkflowStatus {
  schemaVersion: typeof PACKAGE_VIEW_SCHEMA_VERSION;
  contentPackageId: string;
  reviewPacketId: string;

  hasClipboardPayload: boolean;
  hasGateResult: boolean;

  gateStatus: PackageGateStatus;
  copyReady: boolean;
  qaReady: boolean;
  riskBlocked: boolean;
  canProceedToRender: boolean;
}

/** Summary of copy/action availability for the action bar UI. */
export interface PackageCopyActionSummary {
  schemaVersion: typeof PACKAGE_VIEW_SCHEMA_VERSION;
  clipboardPayloadId: string | null;
  copyReady: boolean;
  /** Short labels for each blocker, for display in the UI. */
  blockerLabels: string[];
}

/** Input types accepted by the view model builder. */
export interface PackageViewInputs {
  reviewPacket: {
    schemaVersion: string;
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
    sourceRefs: Array<{
      citationId: string;
      sourceName: string;
      sourceUrl: string;
      publishedDate: string;
    }>;
    factCard: {
      factCardId: string;
      indicatorName: string;
      dataPeriod: string;
      currentValue: string;
      interpretation: string;
      cautionNote: string;
      allowedClaimsCount: number;
      blockedClaimsCount: number;
    };
    blueprint: {
      blueprintVideoId: string;
      templateKey: string;
      targetDurationSec: number;
      sceneCount: number;
    };
    scripts: Array<{
      targetDurationSec: number;
      sceneCount: number;
      fullNarration: string;
      captionTexts: string[];
    }>;
    socialCopy: {
      title: string;
      topic: string;
      coreMessage: string;
      youtubeTitle: string;
      instagramCaption: string;
      hashtags: string[];
      hashtagCount: number;
      moneyOsCta: string | null;
    };
    risk: {
      overallRiskLevel: string;
      isBlocked: boolean;
      findingCount: number;
      findingCodes: string[];
    };
    qa: {
      readyForRender: boolean;
      isRiskBlocked: boolean;
      totalChecks: number;
      passedChecks: number;
      failedChecks: number;
      blockersFailed: number;
      failedCheckCodes: string[];
    };
    render: {
      timelineId: string;
      renderManifestId: string;
      plannedDurationSec: number;
      measuredAudioDurationSec: number;
      sceneCount: number;
    };
    ownerDecision: string | null;
    ownerNotes: string | null;
    createdAt?: string;
  };
  gateResult: {
    gateResultId: string;
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
    ownerDecision: string | null;
    ownerNotes: string | null;
    canProceedToRender: boolean;
    blockerCodes: string[];
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
    createdAt?: string;
  } | null;
  clipboardPayload: {
    clipboardPayloadId: string;
    reviewPacketId: string;
    contentPackageId: string;
    copyReady: boolean;
    blockerCodes: string[];
    qaRiskWarning: {
      readyForRender: boolean;
      isRiskBlocked: boolean;
      overallRiskLevel: string;
      findingCount: number;
      failedCheckCodes: string[];
    };
    createdAt?: string;
  } | null;
}

/** Options for the view model builder. */
export interface PackageViewBuilderOptions {
  createdAt?: string;
}
