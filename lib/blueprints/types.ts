import type { CtaPolicy, RiskLevel } from "@/lib/source-facts/types";

export const BLUEPRINT_SCHEMA_VERSION = "money_shorts_video_blueprint_v1" as const;

export type VideoBlueprintContentType =
  | "interest_rate"
  | "exchange_rate"
  | "inflation"
  | "employment"
  | "consumption"
  | "economic_indicator"
  | "disclosure_summary"
  | "earnings_summary"
  | "salary_management"
  | "spending_control"
  | "emergency_fund"
  | "investment_separation"
  | "money_leak"
  | "money_os_solution";

export type VideoBlueprintTemplateMode = "viral" | "trust" | "data_shorts";

export type VideoBlueprintTemplateKey =
  | "indicator_summary"
  | "rate_fx_change"
  | "disclosure_summary"
  | "earnings_numbers"
  | "money_os_support";

export type VideoBlueprintTargetAudience = "beginner" | "intermediate" | "expert";

export type VideoBlueprintSceneRole =
  | "hook"
  | "context"
  | "problem"
  | "reason"
  | "structure"
  | "solution"
  | "example"
  | "recap"
  | "money_os_cta";

export type VideoBlueprintVisualType =
  | "gpt_image"
  | "chart_card"
  | "number_card"
  | "veo_clip"
  | "static_background"
  | "cta_card";

export type VideoBlueprintMotionType =
  | "slow_zoom_in"
  | "subtle_pan"
  | "card_slide"
  | "chart_reveal"
  | "money_flow_animation"
  | "cut_transition"
  | "fade_to_cta";

export type VideoBlueprintTargetDuration = 15 | 30 | 60;

export type VideoBlueprintTone =
  | "balanced_premium_finance"
  | "trustworthy"
  | "clear"
  | "not_meme_like"
  | "not_too_heavy"
  | "not_ad_like";

export interface VideoBlueprintScene {
  sceneId: string;
  sceneIndex: number;
  sceneRole: VideoBlueprintSceneRole;
  estimatedStartTime: number;
  estimatedDuration: number;
  actualStartTime: null | number;
  actualDuration: null | number;
  narration: string;
  ttsScript: string;
  caption: string;
  visualDescription: string;
  visualType: VideoBlueprintVisualType;
  imagePrompt: null | string;
  videoPrompt: null | string;
  motionType: VideoBlueprintMotionType;
  captionStyle: string;
  audioEmphasis: string;
  /** Fact Card id that backs this scene's data, if applicable. */
  factCardId: null | string;
  sourceName: null | string;
  sourceUrl: null | string;
  publishedDate: null | string;
  dataPeriod: null | string;
  indicatorName: null | string;
  currentValue: null | string;
  previousValue: null | string;
  changeRate: null | string;
  interpretation: null | string;
  cautionNote: null | string;
  sourceNote: null | string;
  qaRules: string[];
}

export interface VideoBlueprint {
  schemaVersion: typeof BLUEPRINT_SCHEMA_VERSION;
  videoId: string;
  title: string;
  topic: string;
  targetDurationSec: VideoBlueprintTargetDuration;
  estimatedDurationSec: number;
  finalDurationSec: null | number;
  coreMessage: string;
  contentType: VideoBlueprintContentType;
  templateMode: VideoBlueprintTemplateMode;
  templateKey: VideoBlueprintTemplateKey;
  /** Fact Card ids this blueprint is sourced from. Must be non-empty. */
  factCardIds: string[];
  /** Citation ids referenced from the Fact Card(s). Must be non-empty. */
  sourceCitationIds: string[];
  sourceSummary: string;
  ctaPolicy: CtaPolicy;
  moneyOsCta: null | string;
  tone: VideoBlueprintTone[];
  targetAudience: VideoBlueprintTargetAudience;
  riskLevel: RiskLevel;
  sourceReferences: Array<{
    sourceName: string;
    sourceUrl: string;
    publishedDate: string;
    dataPeriod?: string;
  }>;
  voiceProfileId: string;
  scenes: VideoBlueprintScene[];
  createdAt?: string;
  updatedAt?: string;
}

export interface VideoBlueprintValidationError {
  field: string;
  code: string;
  message: string;
}

export interface VideoBlueprintValidationResult {
  ok: boolean;
  errors: VideoBlueprintValidationError[];
}
