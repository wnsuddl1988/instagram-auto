export const CLIPBOARD_PAYLOAD_SCHEMA_VERSION =
  "money_shorts_clipboard_payload_v1" as const;

/** Machine-readable reason copy readiness is blocked. */
export type CopyBlockerCode =
  | "gate_not_approved"
  | "review_packet_id_mismatch"
  | "content_package_id_mismatch";

/** Script narration and captions for one duration variant. */
export interface CopyScriptSection {
  targetDurationSec: number;
  fullNarration: string;
  captionTexts: string[];
}

/** Source/citation attribution block for one citation. */
export interface CopySourceRef {
  citationId: string;
  sourceName: string;
  sourceUrl: string;
  publishedDate: string;
  /** Formatted single-line attribution for copy. Verbatim concat from ReviewPacket fields. */
  attributionLine: string;
}

/** QA/risk warning text for Owner visibility — surfaced even when copyReady=true. */
export interface CopyQaRiskWarning {
  readyForRender: boolean;
  isRiskBlocked: boolean;
  overallRiskLevel: string;
  findingCount: number;
  failedCheckCodes: string[];
}

/**
 * All copy sections derived from an approved ReviewPacket.
 *
 * - All text is verbatim from the ReviewPacket — no new content generated.
 * - Section labels ("YouTube 제목:", etc.) are metadata strings, not content.
 * - No OS clipboard access. The caller provides these strings to the UI copy button.
 */
export interface ClipboardCopySections {
  /** Content title verbatim from script package. */
  title: string;
  /** Topic string verbatim from script package. */
  topic: string;
  /** Core message verbatim from script package. */
  coreMessage: string;
  /** YouTube title verbatim. */
  youtubeTitle: string;
  /** Instagram Reels caption verbatim. */
  instagramCaption: string;
  /** Hashtags joined with spaces, verbatim from ReviewSocialCopy.hashtags (e.g. "#물가 #CPI #경제"). */
  hashtagsText: string;
  /** Money-OS CTA copy, or null when not present. */
  moneyOsCta: string | null;
  /** Per-duration narration and captions. */
  scripts: CopyScriptSection[];
  /** Source attribution blocks. */
  sourceRefs: CopySourceRef[];
}

/**
 * A clipboard payload prepared from an approved ReviewPacket + OwnerDecisionGateResult.
 *
 * - copyReady=true only when gate.canProceedToRender=true and ids match.
 * - No OS clipboard access anywhere in this module.
 * - No file export, render, or external call.
 */
export interface ClipboardPayload {
  schemaVersion: typeof CLIPBOARD_PAYLOAD_SCHEMA_VERSION;
  clipboardPayloadId: string;

  // Linkage ids preserved verbatim
  reviewPacketId: string;
  contentPackageId: string;
  factCardIds: string[];
  sourceCitationIds: string[];
  blueprintVideoId: string;
  scriptPackageId: string;
  gateResultId: string;

  /** True only when gate approved and all linkage ids match. */
  copyReady: boolean;
  blockerCodes: CopyBlockerCode[];

  /** Copy sections — populated only when copyReady=true; null otherwise. */
  sections: ClipboardCopySections | null;

  /** QA/risk warning always surfaced for Owner awareness. */
  qaRiskWarning: CopyQaRiskWarning;

  createdAt?: string;
}

/** Options for the clipboard payload builder. */
export interface ClipboardPayloadOptions {
  clipboardPayloadId?: string;
  createdAt?: string;
}
