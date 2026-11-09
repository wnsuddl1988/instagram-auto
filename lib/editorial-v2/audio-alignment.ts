import { createHash } from "node:crypto";

import type {
  AudioAlignedSceneSubtitlePlan,
  AudioAlignedSubtitleCue,
  AudioAlignedSubtitleTrack,
  ProviderCharacterAlignment,
} from "./voice-materialization-contracts";

export interface AudioAlignmentSceneInput {
  readonly sceneId: string;
  readonly sceneOrder: number;
  readonly narration: string;
  readonly keyCaption: string;
  readonly audioDurationMs: number;
  readonly alignment: ProviderCharacterAlignment;
}

export interface NarrationCueMappingOptions {
  readonly sceneId: string;
  readonly sceneOrder: number;
  readonly keyCaption: string;
  readonly maxCharacterTarget?: number;
}

const PUNCTUATION_BOUNDARY = /[.!?。！？,，;；:：\n]/u;

function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function cueBoundaries(characters: readonly string[], maxCharacterTarget: number): readonly [number, number][] {
  const boundaries: [number, number][] = [];
  let start = 0;
  for (let index = 0; index < characters.length; index += 1) {
    const length = index - start + 1;
    const punctuation = PUNCTUATION_BOUNDARY.test(characters[index] ?? "");
    if ((punctuation && length >= 4) || length >= maxCharacterTarget) {
      boundaries.push([start, index + 1]);
      start = index + 1;
    }
  }
  if (start < characters.length) boundaries.push([start, characters.length]);
  return boundaries;
}

export function mapNarrationCharacterRangesToCues(
  narration: string,
  alignment: ProviderCharacterAlignment,
  options: NarrationCueMappingOptions,
): readonly AudioAlignedSubtitleCue[] {
  if (alignment.characters.join("").replace(/\r\n/gu, "\n") !== narration.replace(/\r\n/gu, "\n")) {
    throw new Error("AUDIO_ALIGNMENT_CANONICAL_TEXT_MISMATCH");
  }
  const maxCharacterTarget = options.maxCharacterTarget ?? 28;
  if (!Number.isSafeInteger(maxCharacterTarget) || maxCharacterTarget < 8 || maxCharacterTarget > 80) {
    throw new Error("AUDIO_ALIGNMENT_CUE_TARGET_INVALID");
  }
  return cueBoundaries(alignment.characters, maxCharacterTarget).map(([start, end], index) => {
    const text = alignment.characters.slice(start, end).join("").trim();
    if (!text) throw new Error("AUDIO_ALIGNMENT_EMPTY_CUE");
    return {
      cueId: `audio-cue-${options.sceneId}-${String(index + 1).padStart(2, "0")}-${sha256(`${start}:${end}:${text}`).slice(0, 12)}`,
      sceneId: options.sceneId,
      sceneOrder: options.sceneOrder,
      cueOrder: index + 1,
      text,
      characterStartIndex: start,
      characterEndIndexExclusive: end,
      startSeconds: alignment.characterStartTimesSeconds[start] ?? 0,
      endSeconds: alignment.characterEndTimesSeconds[end - 1] ?? 0,
      keyCaption: text === options.keyCaption.trim(),
      safeZone: "lower_safe_caption_zone",
      alignmentStatus: "provider_character_timestamps_aligned",
    };
  });
}

export function validateAudioAlignedSceneSubtitlePlan(plan: AudioAlignedSceneSubtitlePlan): readonly string[] {
  const issues: string[] = [];
  if (!plan.sceneId || !Number.isSafeInteger(plan.sceneOrder) || plan.sceneOrder < 1) issues.push("scene_identity_invalid");
  if (!plan.narration || !plan.keyCaption || plan.audioDurationMs <= 0) issues.push("scene_content_invalid");
  if (plan.alignmentStatus !== "provider_character_timestamps_aligned" || plan.audioAlignmentPerformed !== true) issues.push("alignment_status_invalid");
  if (plan.cues.length === 0) issues.push("cue_missing");
  let nextCharacterIndex = 0;
  let previousEnd = -1;
  for (const [index, cue] of plan.cues.entries()) {
    if (cue.cueOrder !== index + 1 || cue.sceneId !== plan.sceneId || cue.sceneOrder !== plan.sceneOrder) issues.push("cue_identity_invalid");
    if (!cue.text || cue.characterStartIndex !== nextCharacterIndex || cue.characterEndIndexExclusive <= cue.characterStartIndex) issues.push("cue_character_coverage_invalid");
    if (!Number.isFinite(cue.startSeconds) || !Number.isFinite(cue.endSeconds) || cue.startSeconds < 0 || cue.startSeconds > cue.endSeconds) issues.push("cue_time_invalid");
    if (cue.startSeconds < previousEnd) issues.push("cue_overlap");
    if (cue.endSeconds * 1_000 > plan.audioDurationMs + 1) issues.push("cue_exceeds_audio_duration");
    if (cue.alignmentStatus !== "provider_character_timestamps_aligned") issues.push("estimated_alignment_mislabeled");
    nextCharacterIndex = cue.characterEndIndexExclusive;
    previousEnd = cue.endSeconds;
  }
  if (nextCharacterIndex !== [...plan.narration].length && nextCharacterIndex !== plan.narration.length) issues.push("narration_coverage_invalid");
  return [...new Set(issues)];
}

export function buildAudioAlignedSubtitleTrack(
  sourceRenderCheckpointHash: string,
  materializationSetId: string,
  scenes: readonly AudioAlignmentSceneInput[],
): AudioAlignedSubtitleTrack {
  const scenePlans = scenes.slice().sort((left, right) => left.sceneOrder - right.sceneOrder).map((scene): AudioAlignedSceneSubtitlePlan => {
    const cues = mapNarrationCharacterRangesToCues(scene.narration, scene.alignment, {
      sceneId: scene.sceneId,
      sceneOrder: scene.sceneOrder,
      keyCaption: scene.keyCaption,
    });
    const plan: AudioAlignedSceneSubtitlePlan = {
      sceneId: scene.sceneId,
      sceneOrder: scene.sceneOrder,
      narration: scene.narration,
      keyCaption: scene.keyCaption,
      audioDurationMs: scene.audioDurationMs,
      cues,
      alignmentStatus: "provider_character_timestamps_aligned",
      audioAlignmentPerformed: true,
    };
    const issues = validateAudioAlignedSceneSubtitlePlan(plan);
    if (issues.length > 0) throw new Error(`AUDIO_ALIGNED_SUBTITLE_INVALID:${issues.join(",")}`);
    return plan;
  });
  return {
    trackVersion: "audio-aligned-subtitle-track-v1",
    sourceRenderCheckpointHash,
    materializationSetId,
    scenePlans,
    cues: scenePlans.flatMap((scene) => scene.cues),
    safeZone: "lower_safe_caption_zone",
    alignmentStatus: "provider_character_timestamps_aligned",
    audioAlignmentPerformed: true,
    estimatedFallbackUsed: false,
  };
}

export function validateAudioAlignedSubtitleTrack(track: AudioAlignedSubtitleTrack): readonly string[] {
  const issues: string[] = [];
  if (!/^[a-f0-9]{64}$/u.test(track.sourceRenderCheckpointHash)) issues.push("source_checkpoint_hash_invalid");
  if (!/^voice-set-[a-f0-9]{64}$/u.test(track.materializationSetId)) issues.push("materialization_set_id_invalid");
  if (track.alignmentStatus !== "provider_character_timestamps_aligned" || track.audioAlignmentPerformed !== true || track.estimatedFallbackUsed !== false) issues.push("track_alignment_claim_invalid");
  if (track.scenePlans.length === 0 || track.cues.length !== track.scenePlans.reduce((total, scene) => total + scene.cues.length, 0)) issues.push("track_cue_count_invalid");
  for (const scene of track.scenePlans) issues.push(...validateAudioAlignedSceneSubtitlePlan(scene).map((entry) => `${scene.sceneId}:${entry}`));
  return [...new Set(issues)];
}
