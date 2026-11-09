export const TIMELINE_SCHEMA_VERSION = "money_shorts_timeline_v1" as const;

/**
 * Source of the measured duration value.
 * "mock" = fixture/test value; "measured" = supplied externally after audio generation.
 */
export type MeasuredDurationSource = "mock" | "measured";

/** A single scene's recalculated timing slot. */
export interface TimelineSceneSlot {
  /** Original scene id from Blueprint scene, or `scene-N` for Script/TTS scenes. */
  sceneId: string;
  sceneIndex: number;
  /** Start time in seconds within the video. */
  startSec: number;
  /** End time in seconds (exclusive). */
  endSec: number;
  /** Duration of this scene in seconds. */
  durationSec: number;
}

/** A caption timing block derived from an existing caption/narration text. No new text is invented. */
export interface CaptionTimingBlock {
  /** Scene id this caption belongs to. */
  sceneId: string;
  sceneIndex: number;
  /** Exact text from captionText (ScriptScene) or ttsText (TtsSceneBlock). */
  captionText: string;
  /** Start time in seconds when caption should appear. */
  showAtSec: number;
  /** End time in seconds when caption should disappear. */
  hideAtSec: number;
}

/** Input for a timeline recalculation from a Blueprint source. */
export interface BlueprintTimelineInput {
  sourceType: "blueprint";
  /** Blueprint videoId. */
  sourceId: string;
  /** Blueprint factCard ids. */
  factCardIds: string[];
  /** Blueprint citation ids. */
  sourceCitationIds: string[];
  /** Target duration from Blueprint (15 | 30 | 60). */
  targetDurationSec: 15 | 30 | 60;
  /** Estimated duration derived from Blueprint scene sum. */
  estimatedDurationSec: number;
  /**
   * Externally supplied or mock-measured audio duration in seconds.
   * Must not be measured from a real file inside this module.
   */
  measuredAudioDurationSec: number;
  measuredAudioDurationSource: MeasuredDurationSource;
  /** Per-scene inputs derived from Blueprint scenes. */
  scenes: Array<{
    sceneId: string;
    sceneIndex: number;
    /** Estimated duration from Blueprint (used to compute proportional weights). */
    estimatedDurationSec: number;
    captionText: string;
  }>;
}

/** Input for a timeline recalculation from a ScriptPackage + TtsScriptPackage source. */
export interface ScriptTimelineInput {
  sourceType: "script_package";
  /** GeneratedScriptPackage packageId. */
  sourceId: string;
  /** GeneratedScriptPackage factCardIds. */
  factCardIds: string[];
  /** GeneratedScriptPackage sourceCitationIds. */
  sourceCitationIds: string[];
  /** Target duration from DurationScript. */
  targetDurationSec: 15 | 30 | 60;
  /** Sum of ScriptScene.durationSec from the selected DurationScript. */
  estimatedDurationSec: number;
  /**
   * Externally supplied or mock-measured audio duration in seconds.
   * Must not be measured from a real file inside this module.
   */
  measuredAudioDurationSec: number;
  measuredAudioDurationSource: MeasuredDurationSource;
  /** Per-scene inputs derived from ScriptScene + TtsSceneBlock. */
  scenes: Array<{
    /** `scene-${sceneIndex}` (deterministic — ScriptScene has no sceneId). */
    sceneId: string;
    sceneIndex: number;
    /** ScriptScene.durationSec (used to compute proportional weights). */
    estimatedDurationSec: number;
    /** ScriptScene.captionText. */
    captionText: string;
  }>;
}

export type TimelineInput = BlueprintTimelineInput | ScriptTimelineInput;

/** The recalculated timeline output. */
export interface RecalculatedTimeline {
  schemaVersion: typeof TIMELINE_SCHEMA_VERSION;
  /** Unique id for this recalculation result. */
  timelineId: string;
  sourceType: "blueprint" | "script_package";
  sourceId: string;
  /** Fact Card ids from the source. */
  factCardIds: string[];
  /** Citation ids from the source. */
  sourceCitationIds: string[];
  targetDurationSec: 15 | 30 | 60;
  estimatedDurationSec: number;
  measuredAudioDurationSec: number;
  measuredAudioDurationSource: MeasuredDurationSource;
  /** Total video duration = measuredAudioDurationSec (scenes fill exactly this length). */
  totalVideoDurationSec: number;
  scenes: TimelineSceneSlot[];
  captions: CaptionTimingBlock[];
  createdAt?: string;
}

/** Validation error for a RecalculatedTimeline or TimelineInput. */
export interface TimelineValidationError {
  field: string;
  code: string;
  message: string;
}

export interface TimelineValidationResult {
  ok: boolean;
  errors: TimelineValidationError[];
}
