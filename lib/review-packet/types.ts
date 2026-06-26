export const REVIEW_PACKET_SCHEMA_VERSION = "money_shorts_review_packet_v1" as const;

/** Owner approval decision for a review packet. Initialized to pending/null at creation. */
export type OwnerDecision = "approved" | "rejected" | "revision_requested" | null;

/** Compact source/citation reference extracted from the assembled package. */
export interface ReviewSourceRef {
  citationId: string;
  sourceName: string;
  sourceUrl: string;
  publishedDate: string;
}

/** Compact Fact Card summary for the review packet. */
export interface ReviewFactCardSummary {
  factCardId: string;
  indicatorName: string;
  dataPeriod: string;
  currentValue: string;
  interpretation: string;
  cautionNote: string;
  allowedClaimsCount: number;
  blockedClaimsCount: number;
  /** Propagated directly from FactCard.isPublishable. False for all draft candidates. */
  isPublishable: boolean;
}

/** Compact blueprint summary. */
export interface ReviewBlueprintSummary {
  blueprintVideoId: string;
  templateKey: string;
  targetDurationSec: number;
  sceneCount: number;
}

/** Compact script summary for one duration variant. */
export interface ReviewScriptSummary {
  targetDurationSec: number;
  sceneCount: number;
  /** Full narration text — verbatim from existing package; no new content generated. */
  fullNarration: string;
  captionTexts: string[];
}

/** Compact risk review summary. */
export interface ReviewRiskSummary {
  overallRiskLevel: string;
  isBlocked: boolean;
  findingCount: number;
  /** Short codes from each finding. Empty when no findings. */
  findingCodes: string[];
}

/** Compact QA summary. */
export interface ReviewQaSummary {
  readyForRender: boolean;
  isRiskBlocked: boolean;
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  blockersFailed: number;
  /** Check codes of all failed checks. */
  failedCheckCodes: string[];
}

/** Compact render/timeline summary. */
export interface ReviewRenderSummary {
  timelineId: string;
  renderManifestId: string;
  plannedDurationSec: number;
  measuredAudioDurationSec: number;
  sceneCount: number;
}

/** Social copy summary extracted verbatim from the script package. */
export interface ReviewSocialCopy {
  title: string;
  topic: string;
  coreMessage: string;
  youtubeTitle: string;
  instagramCaption: string;
  /** Hashtag strings verbatim from script package (e.g. ["#물가", "#CPI"]). */
  hashtags: string[];
  /** Convenience count — always equals hashtags.length. */
  hashtagCount: number;
  moneyOsCta: string | null;
}

/**
 * A compact Owner review packet derived from an AssembledContentPackage.
 *
 * - All text fields are copied verbatim from the existing package — no new content.
 * - Owner decision fields are initialized to null/pending at creation.
 * - No external calls, no DB writes, no file exports.
 */
export interface ReviewPacket {
  schemaVersion: typeof REVIEW_PACKET_SCHEMA_VERSION;
  reviewPacketId: string;
  contentPackageId: string;

  // Package-level id linkage
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

  // Summaries
  sourceRefs: ReviewSourceRef[];
  factCard: ReviewFactCardSummary;
  blueprint: ReviewBlueprintSummary;
  /** Summary per duration variant present in the script package. */
  scripts: ReviewScriptSummary[];
  socialCopy: ReviewSocialCopy;
  risk: ReviewRiskSummary;
  qa: ReviewQaSummary;
  render: ReviewRenderSummary;

  // Owner decision — initialized to null/pending; not modified by this module.
  needsOwnerApproval: true;
  ownerDecision: OwnerDecision;
  ownerNotes: string | null;

  createdAt?: string;
}

/** Options for the review packet generator. */
export interface ReviewPacketOptions {
  reviewPacketId?: string;
  createdAt?: string;
}
