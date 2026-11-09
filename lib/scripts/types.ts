import type { RiskLevel } from "@/lib/source-facts/types";

export const SCRIPT_PACKAGE_SCHEMA_VERSION = "money_shorts_script_package_v1" as const;

/** Visual type for a storyboard scene, matching MVP1 §6. */
export type ScriptSceneVisualType =
  | "number_card"
  | "chart"
  | "money_leak"
  | "money_structure"
  | "cta_card";

/** Scene goal used in the storyboard, corresponding to scene role in the Blueprint. */
export type ScriptSceneGoal =
  | "hook"
  | "context"
  | "problem"
  | "reason"
  | "structure"
  | "solution"
  | "example"
  | "recap"
  | "cta";

/** One row in the storyboard, modelled after MVP1 Content Package Spec §6. */
export interface ScriptScene {
  sceneIndex: number;
  durationSec: number;
  startTimeSec: number;
  sceneGoal: ScriptSceneGoal;
  visualType: ScriptSceneVisualType;
  /** One-line description of what the visual should show. */
  visualBrief: string;
  captionText: string;
  narrationText: string;
  /** Citation/source attribution line for this scene. Null only for CTA-only scenes. */
  sourceNote: string | null;
  /** Placeholder for a risk reviewer — null means unchecked, a string means a flag was raised. */
  riskNote: string | null;
  /** Fact Card id providing the data for this scene. Null for CTA-only scenes. */
  factCardId: string | null;
}

/** A duration-specific script with per-scene storyboard. */
export interface DurationScript {
  targetDurationSec: 15 | 30 | 60;
  /** Full narration joined from scenes, for TTS or text display. */
  fullNarration: string;
  scenes: ScriptScene[];
}

/** Source attribution footer, rendered at the end of a package. */
export interface ScriptSourceAttribution {
  sourceName: string;
  sourceUrl: string;
  publishedDate: string;
  dataPeriod?: string;
}

/** The complete script package generated from a VideoBlueprint. */
export interface GeneratedScriptPackage {
  schemaVersion: typeof SCRIPT_PACKAGE_SCHEMA_VERSION;
  packageId: string;
  /** Originating VideoBlueprint videoId. */
  blueprintVideoId: string;
  /** Fact Card ids this package depends on. */
  factCardIds: string[];
  /** Citation ids referenced from the Fact Card(s). */
  sourceCitationIds: string[];
  /** One-line source attribution. */
  sourceSummary: string;
  /** Attribution metadata for each source. */
  sourceAttributions: ScriptSourceAttribution[];
  topic: string;
  title: string;
  coreMessage: string;
  /** 15s / 30s / 60s duration scripts. May contain 1–3 entries depending on options. */
  scripts: DurationScript[];
  /** YouTube-friendly title. Generated from title + indicator + dataPeriod. */
  youtubeTitle: string;
  /** Instagram Reels caption text. */
  instagramCaption: string;
  /** Short description with source attribution for YouTube / Instagram. */
  description: string;
  /** Hashtags relevant to the indicator and category. */
  hashtags: string[];
  /** Money-OS CTA copy, or null when ctaPolicy is none. */
  moneyOsCta: string | null;
  /** Source-level risk flag. Unchecked means the package has not been risk-reviewed yet. */
  riskLevel: RiskLevel;
  createdAt?: string;
}

export interface ScriptPackageValidationError {
  field: string;
  code: string;
  message: string;
}

export interface ScriptPackageValidationResult {
  ok: boolean;
  errors: ScriptPackageValidationError[];
}
