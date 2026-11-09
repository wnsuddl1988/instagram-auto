import type {
  TimelineInput,
  RecalculatedTimeline,
  TimelineSceneSlot,
  CaptionTimingBlock,
} from "./types";
import { TIMELINE_SCHEMA_VERSION } from "./types";

export interface TimelineCalculatorOptions {
  timelineId?: string;
  createdAt?: string;
  /**
   * Minimum scene duration in seconds after proportional resize.
   * Prevents a scene from collapsing to near-zero.
   * Default: 0.5
   */
  minSceneDurationSec?: number;
}

/**
 * Recalculates scene start/end/duration values proportionally so that the
 * total video duration matches `measuredAudioDurationSec`.
 *
 * Strategy:
 * - Each scene's weight = estimatedDurationSec / sum(all estimatedDurationSec).
 * - New duration = weight * measuredAudioDurationSec (floored to 2 decimal places).
 * - Last scene absorbs rounding remainder to guarantee exact total.
 * - start_sec is cumulative; end_sec = start + duration.
 * - Caption timing mirrors the scene slot exactly (show at start, hide at end).
 *
 * No new facts or text are invented — captionText comes directly from the input scene.
 */
export function recalculateTimeline(
  input: TimelineInput,
  options: TimelineCalculatorOptions = {},
): RecalculatedTimeline {
  const minDur = options.minSceneDurationSec ?? 0.5;
  const measured = input.measuredAudioDurationSec;
  const totalEstimated = input.estimatedDurationSec;

  // Proportional resize: distribute measuredAudioDurationSec across scenes
  const rawDurations = input.scenes.map((scene) => {
    const weight = totalEstimated > 0 ? scene.estimatedDurationSec / totalEstimated : 1 / input.scenes.length;
    const raw = Math.round(weight * measured * 100) / 100;
    return Math.max(raw, minDur);
  });

  // Last scene absorbs rounding so total == measured exactly
  const durSum = rawDurations.slice(0, -1).reduce((a, b) => a + b, 0);
  const finalDurations = rawDurations.length > 0
    ? [...rawDurations.slice(0, -1), Math.max(Math.round((measured - durSum) * 100) / 100, minDur)]
    : [];

  const scenes: TimelineSceneSlot[] = [];
  const captions: CaptionTimingBlock[] = [];
  let cursor = 0;

  for (let i = 0; i < input.scenes.length; i++) {
    const scene = input.scenes[i];
    const dur = finalDurations[i] ?? minDur;
    const startSec = Math.round(cursor * 100) / 100;
    const endSec = Math.round((cursor + dur) * 100) / 100;

    scenes.push({
      sceneId: scene.sceneId,
      sceneIndex: scene.sceneIndex,
      startSec,
      endSec,
      durationSec: Math.round(dur * 100) / 100,
    });

    captions.push({
      sceneId: scene.sceneId,
      sceneIndex: scene.sceneIndex,
      captionText: scene.captionText,
      showAtSec: startSec,
      hideAtSec: endSec,
    });

    cursor = endSec;
  }

  const timelineId =
    options.timelineId ?? `tl-${input.sourceId}-${input.measuredAudioDurationSec}s`;

  const result: RecalculatedTimeline = {
    schemaVersion: TIMELINE_SCHEMA_VERSION,
    timelineId,
    sourceType: input.sourceType,
    sourceId: input.sourceId,
    factCardIds: input.factCardIds,
    sourceCitationIds: input.sourceCitationIds,
    targetDurationSec: input.targetDurationSec,
    estimatedDurationSec: input.estimatedDurationSec,
    measuredAudioDurationSec: measured,
    measuredAudioDurationSource: input.measuredAudioDurationSource,
    totalVideoDurationSec: measured,
    scenes,
    captions,
  };
  if (options.createdAt !== undefined) result.createdAt = options.createdAt;
  return result;
}

/**
 * Builds a BlueprintTimelineInput from raw Blueprint scene data.
 * Accepts only the fields needed — caller supplies measuredAudioDurationSec.
 */
export function buildBlueprintTimelineInput(params: {
  sourceId: string;
  factCardIds: string[];
  sourceCitationIds: string[];
  targetDurationSec: 15 | 30 | 60;
  estimatedDurationSec: number;
  measuredAudioDurationSec: number;
  measuredAudioDurationSource?: "mock" | "measured";
  scenes: Array<{
    sceneId: string;
    sceneIndex: number;
    estimatedDurationSec: number;
    captionText: string;
  }>;
}): TimelineInput {
  return {
    sourceType: "blueprint",
    sourceId: params.sourceId,
    factCardIds: params.factCardIds,
    sourceCitationIds: params.sourceCitationIds,
    targetDurationSec: params.targetDurationSec,
    estimatedDurationSec: params.estimatedDurationSec,
    measuredAudioDurationSec: params.measuredAudioDurationSec,
    measuredAudioDurationSource: params.measuredAudioDurationSource ?? "mock",
    scenes: params.scenes,
  };
}

/**
 * Builds a ScriptTimelineInput from raw ScriptPackage scene data.
 * Accepts only the fields needed — caller supplies measuredAudioDurationSec.
 */
export function buildScriptTimelineInput(params: {
  sourceId: string;
  factCardIds: string[];
  sourceCitationIds: string[];
  targetDurationSec: 15 | 30 | 60;
  estimatedDurationSec: number;
  measuredAudioDurationSec: number;
  measuredAudioDurationSource?: "mock" | "measured";
  scenes: Array<{
    sceneIndex: number;
    estimatedDurationSec: number;
    captionText: string;
  }>;
}): TimelineInput {
  return {
    sourceType: "script_package",
    sourceId: params.sourceId,
    factCardIds: params.factCardIds,
    sourceCitationIds: params.sourceCitationIds,
    targetDurationSec: params.targetDurationSec,
    estimatedDurationSec: params.estimatedDurationSec,
    measuredAudioDurationSec: params.measuredAudioDurationSec,
    measuredAudioDurationSource: params.measuredAudioDurationSource ?? "mock",
    scenes: params.scenes.map((s) => ({
      sceneId: `scene-${s.sceneIndex}`,
      sceneIndex: s.sceneIndex,
      estimatedDurationSec: s.estimatedDurationSec,
      captionText: s.captionText,
    })),
  };
}
