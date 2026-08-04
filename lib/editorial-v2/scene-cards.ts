import type {
  ApprovedDetailedScriptSessionSnapshot,
  CharacterMotionTag,
  DetailedScriptBeatType,
  SceneCardDraft,
} from "./contracts";

const CHARACTER_MOTION_BY_BEAT: Readonly<Record<DetailedScriptBeatType, CharacterMotionTag>> = {
  anomaly_or_problem: "point_to_source",
  common_interpretation_crack: "trace_relationship",
  evidence_and_number: "highlight_number",
  hidden_cause_or_connection: "trace_relationship",
  audience_life_impact: "point_to_source",
  misread_correction: "trace_relationship",
  practical_check_or_action: "point_to_source",
  next_signal_to_watch: "watch_timeline",
};

const CAMERA_MOTION_BY_BEAT: Readonly<Record<DetailedScriptBeatType, string>> = {
  anomaly_or_problem: "screen_push_in",
  common_interpretation_crack: "split_screen_reveal",
  evidence_and_number: "data_focus_hold",
  hidden_cause_or_connection: "diagram_trace",
  audience_life_impact: "caption_focus_hold",
  misread_correction: "before_after_wipe",
  practical_check_or_action: "checklist_step_down",
  next_signal_to_watch: "timeline_pan",
};

const TRANSITION_BY_BEAT: Readonly<Record<DetailedScriptBeatType, string>> = {
  anomaly_or_problem: "hard_cut",
  common_interpretation_crack: "contrast_wipe",
  evidence_and_number: "data_snap",
  hidden_cause_or_connection: "line_trace",
  audience_life_impact: "soft_push",
  misread_correction: "correction_flip",
  practical_check_or_action: "checklist_tick",
  next_signal_to_watch: "signal_fade",
};

const SOUND_BY_BEAT: Readonly<Record<DetailedScriptBeatType, string>> = {
  anomaly_or_problem: "soft_alert",
  common_interpretation_crack: "contrast_click",
  evidence_and_number: "data_tick",
  hidden_cause_or_connection: "line_draw",
  audience_life_impact: "soft_emphasis",
  misread_correction: "correction_click",
  practical_check_or_action: "check_tick",
  next_signal_to_watch: "watch_ping",
};

function unique(values: readonly string[]): readonly string[] {
  return [...new Set(values)];
}

function numberLabel(snapshot: ApprovedDetailedScriptSessionSnapshot, numberId: string): string | null {
  const record = snapshot.evidencePack.numbers.find((entry) => entry.numberId === numberId);
  if (!record) return null;
  const currency = record.currency ? ` ${record.currency}` : "";
  const unit = record.unit ? ` ${record.unit}` : "";
  return `${record.value}${unit}${currency}`;
}

function visualizationType(snapshot: ApprovedDetailedScriptSessionSnapshot, numberRefs: readonly string[]): string {
  const records = numberRefs
    .map((numberId) => snapshot.evidencePack.numbers.find((entry) => entry.numberId === numberId))
    .filter((entry) => entry !== undefined);
  const comparable = records.length >= 2
    && records.every((entry) => entry.unit === records[0]?.unit && entry.currency === records[0]?.currency);
  if (comparable) return "chart_comparison";
  if (records.length > 0) return "number_text_motion";
  return "official_source_card";
}

export function buildSceneCardDrafts(
  approvedScriptSnapshot: ApprovedDetailedScriptSessionSnapshot,
): readonly SceneCardDraft[] {
  return approvedScriptSnapshot.approvedScript.beats.map((beat, index) => {
    const sceneRevision = { value: 1, origin: "deterministic_default" as const };
    const numberLabels = beat.numberRefs
      .map((numberId) => numberLabel(approvedScriptSnapshot, numberId))
      .filter((entry): entry is string => entry !== null);
    return {
      sceneId: `${approvedScriptSnapshot.approvedScript.selectedAngleId}:scene:${String(index + 1).padStart(2, "0")}`,
      order: index + 1,
      purpose: beat.purpose,
      narration: beat.narration,
      keyCaption: beat.keyCaption,
      evidenceRefs: unique([...beat.claimRefs, ...beat.numberRefs]),
      numberOrComparison: numberLabels.length > 0 ? numberLabels.join(" vs ") : null,
      visualizationType: visualizationType(approvedScriptSnapshot, beat.numberRefs),
      characterMotion: CHARACTER_MOTION_BY_BEAT[beat.beatType],
      cameraOrScreenMotion: CAMERA_MOTION_BY_BEAT[beat.beatType],
      transition: TRANSITION_BY_BEAT[beat.beatType],
      soundEffect: SOUND_BY_BEAT[beat.beatType],
      retentionBeat: beat.retentionDevice,
      sourceRefs: [...beat.sourceRefs],
      enabled: true,
      provenance: {
        beatId: beat.beatId,
        beatType: beat.beatType,
        sourceSignalId: approvedScriptSnapshot.selectedAngle.sourceSignalId,
        claimRefs: [...beat.claimRefs],
        numberRefs: [...beat.numberRefs],
        sourceRefs: [...beat.sourceRefs],
        selectedAngleId: approvedScriptSnapshot.selectedAngle.selectedAngleId,
        scriptPackageIdentity: approvedScriptSnapshot.scriptNormalizedHash,
        sceneRevision,
      },
    };
  });
}

export function cloneSceneCardDrafts(sceneCards: readonly SceneCardDraft[]): readonly SceneCardDraft[] {
  return sceneCards.map((scene) => ({
    ...scene,
    evidenceRefs: [...scene.evidenceRefs],
    sourceRefs: [...scene.sourceRefs],
    provenance: {
      ...scene.provenance,
      claimRefs: [...scene.provenance.claimRefs],
      numberRefs: [...scene.provenance.numberRefs],
      sourceRefs: [...scene.provenance.sourceRefs],
      sceneRevision: { ...scene.provenance.sceneRevision },
    },
  }));
}
