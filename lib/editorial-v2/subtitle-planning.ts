import type {
  ApprovedScenePlanningSessionSnapshot,
  SubtitleCue,
  SubtitleTrackPlan,
  SubtitleValidationIssue,
  SubtitleValidationSummary,
} from "./contracts";

const MIN_SCENE_DURATION_SECONDS = 1.5;
const MAX_CUE_CHARACTERS = 28;

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function normalizedText(value: string): string {
  return value.replace(/\s+/gu, "").trim();
}

function visibleLength(value: string): number {
  return [...value.replace(/\s+/gu, "")].length;
}

function splitLongSegment(segment: string): readonly string[] {
  if ([...segment].length <= MAX_CUE_CHARACTERS) return [segment.trim()];
  const words = segment.trim().split(/\s+/u);
  if (words.length === 1) {
    const characters = [...segment.trim()];
    const chunks: string[] = [];
    for (let index = 0; index < characters.length; index += MAX_CUE_CHARACTERS) {
      chunks.push(characters.slice(index, index + MAX_CUE_CHARACTERS).join(""));
    }
    return chunks;
  }
  const chunks: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if ([...candidate].length > MAX_CUE_CHARACTERS && current) {
      chunks.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

function splitNarration(narration: string): readonly string[] {
  const punctuationSegments = narration.match(/[^.!?。！？]+[.!?。！？]?/gu)?.map((value) => value.trim()).filter(Boolean) ?? [];
  const source = punctuationSegments.length > 0 ? punctuationSegments : [narration.trim()];
  return source.flatMap(splitLongSegment).filter(Boolean);
}

function allocateDurations(weights: readonly number[], targetSeconds: number, minimumSeconds: number): readonly number[] {
  if (weights.length === 0) return [];
  const safeTarget = Math.max(targetSeconds, minimumSeconds * weights.length);
  const remainder = safeTarget - minimumSeconds * weights.length;
  const weightTotal = weights.reduce((total, weight) => total + Math.max(1, weight), 0);
  const durations = weights.map((weight) => round(minimumSeconds + remainder * Math.max(1, weight) / weightTotal));
  const correction = round(safeTarget - durations.reduce((total, value) => total + value, 0));
  return durations.map((value, index) => index === durations.length - 1 ? round(value + correction) : value);
}

export function buildSubtitleTrackPlan(
  planning: ApprovedScenePlanningSessionSnapshot,
  targetDurationSeconds: number,
  locale = "ko-KR",
): SubtitleTrackPlan {
  const scenes = planning.sceneCards.filter((scene) => scene.enabled).sort((left, right) => left.order - right.order);
  const sceneDurations = allocateDurations(
    scenes.map((scene) => visibleLength(scene.narration)),
    targetDurationSeconds,
    MIN_SCENE_DURATION_SECONDS,
  );
  let sceneCursor = 0;
  const scenePlans = scenes.map((scene, sceneIndex) => {
    const duration = sceneDurations[sceneIndex] ?? MIN_SCENE_DURATION_SECONDS;
    const startSeconds = round(sceneCursor);
    const endSeconds = round(startSeconds + duration);
    sceneCursor = endSeconds;
    const cueTexts = splitNarration(scene.narration);
    const cueDurations = allocateDurations(cueTexts.map(visibleLength), duration, Math.min(0.45, duration / Math.max(1, cueTexts.length)));
    let cueCursor = startSeconds;
    const cues: readonly SubtitleCue[] = cueTexts.map((text, cueIndex) => {
      const cueStart = round(cueCursor);
      const cueEnd = cueIndex === cueTexts.length - 1 ? endSeconds : round(cueStart + (cueDurations[cueIndex] ?? 0.45));
      cueCursor = cueEnd;
      return {
        cueId: `${scene.sceneId}:cue:${String(cueIndex + 1).padStart(2, "0")}`,
        sceneId: scene.sceneId,
        sceneOrder: scene.order,
        cueOrder: cueIndex + 1,
        text,
        startSeconds: cueStart,
        endSeconds: cueEnd,
        keyCaption: cueIndex === 0 && scene.keyCaption.trim().length > 0,
        safeZone: "lower_safe_caption_zone",
        alignmentStatus: "estimated_not_audio_aligned",
      };
    });
    return {
      sceneId: scene.sceneId,
      sceneOrder: scene.order,
      narration: scene.narration,
      keyCaption: scene.keyCaption,
      startSeconds,
      endSeconds,
      cues,
      alignmentStatus: "estimated_not_audio_aligned" as const,
    };
  });
  const cues = scenePlans.flatMap((scene) => scene.cues.map((cue) => ({ ...cue })));
  return {
    trackVersion: "subtitle-track-plan-v1",
    sourceScriptHash: planning.approvedScriptNormalizedHash,
    locale,
    targetDurationSeconds: round(sceneCursor),
    scenePlans,
    cues,
    safeZone: "lower_safe_caption_zone",
    alignmentStatus: "estimated_not_audio_aligned",
    audioAlignmentPerformed: false,
    productionReady: false,
  };
}

export function validateSubtitleTrackPlan(
  track: SubtitleTrackPlan,
  planning: ApprovedScenePlanningSessionSnapshot,
): readonly SubtitleValidationIssue[] {
  const issues: SubtitleValidationIssue[] = [];
  const add = (code: string, sceneId: string | null, fieldPath: string, message: string, blocking = true): void => {
    issues.push({ code, sceneId, fieldPath, message, blocking });
  };
  const enabledScenes = planning.sceneCards.filter((scene) => scene.enabled).sort((left, right) => left.order - right.order);
  if (track.alignmentStatus !== "estimated_not_audio_aligned" || track.audioAlignmentPerformed) add("subtitle_alignment_false_claim", null, "alignmentStatus", "Audio alignment을 수행한 것으로 표시할 수 없습니다.");
  if (track.scenePlans.length !== enabledScenes.length) add("subtitle_scene_coverage_mismatch", null, "scenePlans", "활성 장면과 subtitle scene 수가 다릅니다.");
  if (track.scenePlans.length !== 8) add("subtitle_expected_eight_scene_order", null, "scenePlans", "Slice 6 기본 editorial flow는 8개 장면 순서를 기대합니다.", false);
  let previousEnd = 0;
  track.scenePlans.forEach((scenePlan, sceneIndex) => {
    const path = `scenePlans/${sceneIndex}`;
    const sourceScene = enabledScenes[sceneIndex];
    if (!sourceScene || sourceScene.sceneId !== scenePlan.sceneId) add("subtitle_scene_order_mismatch", scenePlan.sceneId, `${path}/sceneId`, "Subtitle scene 순서가 approved scene 순서와 다릅니다.");
    if (scenePlan.startSeconds < 0 || scenePlan.endSeconds < 0) add("subtitle_negative_time", scenePlan.sceneId, path, "Subtitle 시간은 음수가 될 수 없습니다.");
    if (scenePlan.startSeconds >= scenePlan.endSeconds) add("subtitle_scene_time_invalid", scenePlan.sceneId, path, "Subtitle scene 시작은 종료보다 빨라야 합니다.");
    if (Math.abs(scenePlan.startSeconds - previousEnd) > 0.002) add("subtitle_scene_gap_or_overlap", scenePlan.sceneId, `${path}/startSeconds`, "장면 subtitle 경계에 gap 또는 overlap이 있습니다.");
    previousEnd = scenePlan.endSeconds;
    if (sourceScene && normalizedText(scenePlan.narration) !== normalizedText(sourceScene.narration)) add("subtitle_narration_mismatch", scenePlan.sceneId, `${path}/narration`, "Subtitle narration이 approved narration과 다릅니다.");
    if (sourceScene && scenePlan.keyCaption !== sourceScene.keyCaption) add("subtitle_key_caption_mismatch", scenePlan.sceneId, `${path}/keyCaption`, "Key caption metadata가 approved scene과 다릅니다.");
    let cuePreviousEnd = scenePlan.startSeconds;
    scenePlan.cues.forEach((cue, cueIndex) => {
      const cuePath = `${path}/cues/${cueIndex}`;
      if (cue.startSeconds < 0 || cue.endSeconds < 0 || cue.startSeconds >= cue.endSeconds) add("subtitle_cue_time_invalid", cue.sceneId, cuePath, "Cue 시작·종료 시간이 유효하지 않습니다.");
      if (Math.abs(cue.startSeconds - cuePreviousEnd) > 0.002) add("subtitle_cue_gap_or_overlap", cue.sceneId, `${cuePath}/startSeconds`, "Cue 사이에 gap 또는 overlap이 있습니다.");
      if (cue.endSeconds > scenePlan.endSeconds + 0.002) add("subtitle_cue_outside_scene", cue.sceneId, `${cuePath}/endSeconds`, "Cue가 scene 경계를 벗어납니다.");
      if (!cue.text.trim()) add("subtitle_cue_text_missing", cue.sceneId, `${cuePath}/text`, "Cue text가 비어 있습니다.");
      if ([...cue.text].length > 36) add("subtitle_cue_too_long", cue.sceneId, `${cuePath}/text`, "Cue가 화면 읽기 기준보다 깁니다.", false);
      if (cue.endSeconds - cue.startSeconds < 0.45) add("subtitle_cue_too_short", cue.sceneId, cuePath, "Cue 노출 시간이 짧습니다.", false);
      if (cue.alignmentStatus !== "estimated_not_audio_aligned") add("subtitle_cue_alignment_false_claim", cue.sceneId, `${cuePath}/alignmentStatus`, "Cue는 audio-aligned로 표시할 수 없습니다.");
      cuePreviousEnd = cue.endSeconds;
    });
    if (Math.abs(cuePreviousEnd - scenePlan.endSeconds) > 0.002) add("subtitle_cue_scene_coverage_gap", scenePlan.sceneId, `${path}/cues`, "Cue가 scene 전체 예상 구간을 덮지 못합니다.");
    if (normalizedText(scenePlan.cues.map((cue) => cue.text).join("")) !== normalizedText(scenePlan.narration)) add("subtitle_cue_narration_coverage_mismatch", scenePlan.sceneId, `${path}/cues`, "Cue text가 narration 전체를 보존하지 않습니다.");
  });
  if (Math.abs(previousEnd - track.targetDurationSeconds) > 0.002) add("subtitle_target_duration_mismatch", null, "targetDurationSeconds", "마지막 cue 경계와 target duration이 다릅니다.");
  add("subtitle_estimate_only_warning", null, "alignmentStatus", "Subtitle timing은 narration 길이 기반 추정이며 audio-aligned가 아닙니다.", false);
  return issues;
}

export function summarizeSubtitleValidation(
  issues: readonly SubtitleValidationIssue[],
): SubtitleValidationSummary {
  const blockingIssueCount = issues.filter((issue) => issue.blocking).length;
  return {
    valid: blockingIssueCount === 0,
    blockingIssueCount,
    warningCount: issues.length - blockingIssueCount,
    issues: issues.map((issue) => ({ ...issue })),
  };
}
