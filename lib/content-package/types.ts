import type { FactCard } from "@/lib/source-facts/types";
import type { VideoBlueprint } from "@/lib/blueprints/types";
import type { GeneratedScriptPackage } from "@/lib/scripts/types";
import type { RiskReviewResult } from "@/lib/risk-review/types";
import type { ChartCardPackage } from "@/lib/chart-cards/types";
import type { ImagePromptPackage } from "@/lib/image-prompts/types";
import type { VoiceProfile, TtsScriptPackage } from "@/lib/voice-profiles/types";
import type { RecalculatedTimeline } from "@/lib/timeline/types";
import type { RenderManifest } from "@/lib/render-plan/types";
import type { FinalQaResult } from "@/lib/final-qa/types";

export const CONTENT_PACKAGE_SCHEMA_VERSION = "money_shorts_content_package_v1" as const;

/**
 * Stable id summary extracted from a fully assembled content package.
 * All linkage ids are propagated from the underlying modules.
 */
export interface ContentPackageSummary {
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
}

/**
 * A fully assembled source-first content package for one short.
 * All fields are derived from existing local module outputs — no new facts generated.
 */
export interface AssembledContentPackage {
  schemaVersion: typeof CONTENT_PACKAGE_SCHEMA_VERSION;
  contentPackageId: string;
  summary: ContentPackageSummary;
  factCard: FactCard;
  blueprint: VideoBlueprint;
  scriptPackage: GeneratedScriptPackage;
  riskReview: RiskReviewResult;
  chartCardPackage: ChartCardPackage;
  imagePromptPackage: ImagePromptPackage;
  voiceProfile: VoiceProfile;
  ttsPackage: TtsScriptPackage;
  timeline: RecalculatedTimeline;
  renderManifest: RenderManifest;
  finalQa: FinalQaResult;
  createdAt?: string;
}

/** Options for the assembler. All runtime-measured values must be injected here. */
export interface AssemblerOptions {
  contentPackageId?: string;
  qaRunId?: string;
  createdAt?: string;
  /** Mock or pre-measured audio duration in seconds. Required for timeline recalculation. */
  measuredAudioDurationSec: number;
}
