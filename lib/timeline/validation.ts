import type { RecalculatedTimeline, TimelineInput, TimelineValidationError, TimelineValidationResult } from "./types";

const MAX_DURATION_MISMATCH_SEC = 0.05; // 50ms tolerance for floating-point rounding

/**
 * Validates a RecalculatedTimeline:
 * - missing source id / factCardIds / sourceCitationIds
 * - invalid or non-positive measured/total duration
 * - target vs measured duration mismatch beyond a practical tolerance
 * - empty scenes
 * - non-ordered scene start/end times
 * - scene end/start gap (end of scene[i] must equal start of scene[i+1])
 * - empty caption text
 */
export function validateTimeline(timeline: RecalculatedTimeline): TimelineValidationResult {
  const errors: TimelineValidationError[] = [];

  if (!timeline.sourceId) {
    errors.push({ field: "sourceId", code: "missing_source_id", message: "sourceId is required" });
  }
  if (!timeline.factCardIds || timeline.factCardIds.length === 0) {
    errors.push({ field: "factCardIds", code: "missing_fact_card_ids", message: "factCardIds must be non-empty" });
  }
  if (!timeline.sourceCitationIds || timeline.sourceCitationIds.length === 0) {
    errors.push({ field: "sourceCitationIds", code: "missing_citation_ids", message: "sourceCitationIds must be non-empty" });
  }

  if (timeline.measuredAudioDurationSec <= 0) {
    errors.push({ field: "measuredAudioDurationSec", code: "invalid_duration", message: "measuredAudioDurationSec must be > 0" });
  }
  if (timeline.totalVideoDurationSec <= 0) {
    errors.push({ field: "totalVideoDurationSec", code: "invalid_duration", message: "totalVideoDurationSec must be > 0" });
  }

  // Measured vs total mismatch (should always match by construction)
  const totalMismatch = Math.abs(timeline.measuredAudioDurationSec - timeline.totalVideoDurationSec);
  if (totalMismatch > MAX_DURATION_MISMATCH_SEC) {
    errors.push({
      field: "totalVideoDurationSec",
      code: "duration_mismatch",
      message: `totalVideoDurationSec (${timeline.totalVideoDurationSec}) deviates from measuredAudioDurationSec (${timeline.measuredAudioDurationSec}) by ${totalMismatch.toFixed(3)}s`,
    });
  }

  if (!timeline.scenes || timeline.scenes.length === 0) {
    errors.push({ field: "scenes", code: "empty_scenes", message: "scenes must be non-empty" });
  } else {
    // Check scene sum == totalVideoDurationSec
    const sceneSum = timeline.scenes.reduce((acc, s) => acc + s.durationSec, 0);
    const sceneSumMismatch = Math.abs(sceneSum - timeline.totalVideoDurationSec);
    if (sceneSumMismatch > MAX_DURATION_MISMATCH_SEC) {
      errors.push({
        field: "scenes",
        code: "scene_sum_mismatch",
        message: `scene duration sum (${sceneSum.toFixed(3)}) deviates from totalVideoDurationSec (${timeline.totalVideoDurationSec}) by ${sceneSumMismatch.toFixed(3)}s`,
      });
    }

    for (let i = 0; i < timeline.scenes.length; i++) {
      const scene = timeline.scenes[i];

      if (scene.durationSec <= 0) {
        errors.push({
          field: `scenes[${i}].durationSec`,
          code: "invalid_scene_duration",
          message: `scene ${scene.sceneId} has non-positive duration (${scene.durationSec}s)`,
        });
      }
      if (scene.endSec <= scene.startSec) {
        errors.push({
          field: `scenes[${i}]`,
          code: "scene_times_not_ordered",
          message: `scene ${scene.sceneId} end (${scene.endSec}) is not after start (${scene.startSec})`,
        });
      }

      // Continuity: end of previous must equal start of current
      if (i > 0) {
        const prev = timeline.scenes[i - 1];
        const gap = Math.abs(scene.startSec - prev.endSec);
        if (gap > MAX_DURATION_MISMATCH_SEC) {
          errors.push({
            field: `scenes[${i}].startSec`,
            code: "scene_gap",
            message: `gap between scene ${prev.sceneId} end (${prev.endSec}) and scene ${scene.sceneId} start (${scene.startSec}) = ${gap.toFixed(3)}s`,
          });
        }
      }
    }
  }

  // Caption checks
  if (timeline.captions) {
    for (let i = 0; i < timeline.captions.length; i++) {
      const cap = timeline.captions[i];
      if (!cap.captionText || cap.captionText.trim().length === 0) {
        errors.push({
          field: `captions[${i}].captionText`,
          code: "empty_caption_text",
          message: `caption for scene ${cap.sceneId} has empty captionText`,
        });
      }
      if (cap.hideAtSec <= cap.showAtSec) {
        errors.push({
          field: `captions[${i}]`,
          code: "caption_times_not_ordered",
          message: `caption for scene ${cap.sceneId} hideAtSec (${cap.hideAtSec}) is not after showAtSec (${cap.showAtSec})`,
        });
      }
    }
  }

  return { ok: errors.length === 0, errors };
}

/**
 * Validates a TimelineInput before calculation:
 * - missing sourceId / factCardIds / sourceCitationIds
 * - non-positive measuredAudioDurationSec
 * - empty scenes
 * - non-positive scene estimatedDurationSec
 */
export function validateTimelineInput(input: TimelineInput): TimelineValidationResult {
  const errors: TimelineValidationError[] = [];

  if (!input.sourceId) {
    errors.push({ field: "sourceId", code: "missing_source_id", message: "sourceId is required" });
  }
  if (!input.factCardIds || input.factCardIds.length === 0) {
    errors.push({ field: "factCardIds", code: "missing_fact_card_ids", message: "factCardIds must be non-empty" });
  }
  if (!input.sourceCitationIds || input.sourceCitationIds.length === 0) {
    errors.push({ field: "sourceCitationIds", code: "missing_citation_ids", message: "sourceCitationIds must be non-empty" });
  }
  if (input.measuredAudioDurationSec <= 0) {
    errors.push({ field: "measuredAudioDurationSec", code: "invalid_duration", message: "measuredAudioDurationSec must be > 0" });
  }
  if (!input.scenes || input.scenes.length === 0) {
    errors.push({ field: "scenes", code: "empty_scenes", message: "scenes must be non-empty" });
  } else {
    for (let i = 0; i < input.scenes.length; i++) {
      const scene = input.scenes[i];
      if (scene.estimatedDurationSec <= 0) {
        errors.push({
          field: `scenes[${i}].estimatedDurationSec`,
          code: "invalid_scene_estimated_duration",
          message: `scene ${scene.sceneId} estimatedDurationSec must be > 0`,
        });
      }
    }
  }

  return { ok: errors.length === 0, errors };
}
