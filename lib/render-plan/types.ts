export const RENDER_PLAN_SCHEMA_VERSION = "money_shorts_render_plan_v1" as const;

/** Video resolution spec. */
export interface RenderDimensions {
  widthPx: number;
  heightPx: number;
}

export const DEFAULT_RENDER_DIMENSIONS: RenderDimensions = {
  widthPx: 1080,
  heightPx: 1920,
};

/** Codec/container settings for the planned output. */
export type RenderVideoCodec = "h264" | "h265" | "vp9";
export type RenderAudioCodec = "aac" | "opus";
export type RenderContainer = "mp4" | "webm";

export interface RenderOutputSpec {
  codec: RenderVideoCodec;
  audioCodec: RenderAudioCodec;
  container: RenderContainer;
  /** Target CRF value (quality factor — lower = higher quality). */
  crf: number;
  /** Target audio bitrate in kbps. */
  audioBitrateKbps: number;
  /** Frame rate. */
  fps: number;
  dimensions: RenderDimensions;
  /** Placeholder output path — not created; for plan reference only. */
  plannedOutputPath: string;
}

/**
 * A planned image asset input for one scene.
 * The file does not need to exist — path is a placeholder derived from scene ids.
 */
export interface PlannedImageInput {
  sceneId: string;
  sceneIndex: number;
  /** Placeholder asset path. Not read or created by this module. */
  assetPath: string;
  /** Source type that produced or will produce this image. */
  assetSourceType: "image_prompt_package" | "chart_card" | "placeholder";
  /** Image prompt package id that specifies this image, if applicable. */
  imagePromptPackageId: string | null;
  /** Scene image prompt id, if applicable. */
  sceneImagePromptId: string | null;
  /** Chart card package id, if applicable. */
  chartCardPackageId: string | null;
  durationSec: number;
  /** Motion type for Ken Burns / zoom effect (from Blueprint or default). */
  motionType: string;
}

/**
 * A planned audio input (TTS narration).
 * The file does not need to exist — path is a placeholder.
 */
export interface PlannedAudioInput {
  /** TTS script package id from voice-profiles module. */
  ttsPackageId: string;
  /** Voice profile id. */
  voiceProfileId: string;
  /** Provider that will generate audio (no call is made here). */
  provider: string;
  /** Placeholder audio path. Not read or created by this module. */
  assetPath: string;
  /** Planned audio duration from timeline measuredAudioDurationSec. */
  plannedDurationSec: number;
}

/** A caption overlay for one scene. Derived from existing caption text — no new text invented. */
export interface PlannedCaptionOverlay {
  sceneId: string;
  sceneIndex: number;
  /** Exact caption text from Script/Blueprint scene — nothing invented. */
  captionText: string;
  showAtSec: number;
  hideAtSec: number;
  /** Style class name (from Blueprint captionStyle or default). */
  captionStyle: string;
}

/** A source attribution overlay (shown at end or per-scene). */
export interface PlannedSourceOverlay {
  sourceName: string;
  sourceUrl: string;
  publishedDate: string;
  dataPeriod?: string;
  showAtSec: number;
  hideAtSec: number;
}

/**
 * A single planned ffmpeg filter/command fragment.
 * Stored as a data string — never passed to exec() by this module.
 */
export interface PlannedFfmpegFragment {
  label: string;
  /** Fragment type for grouping/ordering. */
  fragmentType:
    | "input_image"
    | "input_audio"
    | "concat_filter"
    | "caption_overlay"
    | "source_overlay"
    | "output_spec";
  /** The planned command fragment as a string. Data only — not executed. */
  commandFragment: string;
}

/** The full planned ffmpeg command. Data only — not executed. */
export interface PlannedFfmpegCommand {
  /** Joined command for reference. Not executed by this module. */
  fullCommand: string;
  fragments: PlannedFfmpegFragment[];
  /** Placeholder output path. Not created. */
  plannedOutputPath: string;
  /** Estimated total video duration from timeline. */
  estimatedDurationSec: number;
}

/** The complete render manifest for one video. */
export interface RenderManifest {
  schemaVersion: typeof RENDER_PLAN_SCHEMA_VERSION;
  manifestId: string;
  /** Originating Blueprint videoId or Script packageId. */
  sourceId: string;
  sourceType: "blueprint" | "script_package";
  /** Fact Card ids from the source. */
  factCardIds: string[];
  /** Citation ids from the source. */
  sourceCitationIds: string[];
  /** Timeline id from lib/timeline. */
  timelineId: string;
  /** TTS package id from lib/voice-profiles. */
  ttsPackageId: string;
  /** Image prompt package id from lib/image-prompts, if applicable. */
  imagePromptPackageId: string | null;
  /** Chart card package id from lib/chart-cards, if applicable. */
  chartCardPackageId: string | null;
  /** Risk level from the source package. */
  riskLevel: string;
  outputSpec: RenderOutputSpec;
  imageInputs: PlannedImageInput[];
  audioInput: PlannedAudioInput;
  captionOverlays: PlannedCaptionOverlay[];
  sourceOverlays: PlannedSourceOverlay[];
  ffmpegPlan: PlannedFfmpegCommand;
  createdAt?: string;
}

/** Validation error for a RenderManifest. */
export interface RenderPlanValidationError {
  field: string;
  code: string;
  message: string;
}

export interface RenderPlanValidationResult {
  ok: boolean;
  errors: RenderPlanValidationError[];
}
