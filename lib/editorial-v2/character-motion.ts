import type {
  CharacterDirectionId,
  CharacterMotionDefinition,
  CharacterMotionKeyframe,
  CharacterRigLayerId,
  CharacterRigMotionTag,
  CharacterVisualRole,
} from "./contracts";

const ALL_DIRECTIONS: readonly CharacterDirectionId[] = [
  "loop_signal_navigator",
  "pin_field_finch",
  "moa_archive_sprite",
];

const BASE_KEYFRAMES: readonly CharacterMotionKeyframe[] = [
  { offset: 0, opacity: 0.84, scale: 1, rotationDegrees: 0, translateX: 0, translateY: 0 },
  { offset: 0.5, opacity: 1, scale: 1.04, rotationDegrees: 3, translateX: 3, translateY: -2 },
  { offset: 1, opacity: 0.92, scale: 1, rotationDegrees: 0, translateX: 0, translateY: 0 },
];

function motion(
  motionTag: CharacterRigMotionTag,
  semanticPurpose: string,
  affectedLayerIds: readonly CharacterRigLayerId[],
  affectedSemanticRoles: readonly CharacterVisualRole[],
  reducedMotionAlternative: string,
  loopPolicy: CharacterMotionDefinition["timing"]["loopPolicy"] = "none",
): CharacterMotionDefinition {
  return {
    motionTag,
    semanticPurpose,
    timing: {
      durationMs: loopPolicy === "ambient_pause" ? 1600 : 900,
      easingToken: "ease_in_out",
      loopPolicy,
    },
    keyframes: BASE_KEYFRAMES.map((entry) => ({ ...entry })),
    affectedLayerIds: [...affectedLayerIds],
    affectedSemanticRoles: [...affectedSemanticRoles],
    maximumScale: 1.06,
    maximumRotationDegrees: 6,
    maximumTranslation: 8,
    screenOccupancyConstraintPercent: 16,
    reducedMotionAlternative,
    evidenceObstructionPolicy: "never_cover_primary_evidence",
    allowedDirectionIds: [...ALL_DIRECTIONS],
    createsNewFact: false,
    rapidFlashAllowed: false,
  };
}

export const CHARACTER_MOTION_VOCABULARY: readonly CharacterMotionDefinition[] = [
  motion("idle_scan", "강한 근거 신호가 없을 때 정지 구간을 둔 주변 탐색", ["body", "focusMarker"], ["signal_navigation"], "focus marker opacity를 한 번만 소폭 변경", "ambient_pause"),
  motion("signal_detect", "실제 evidence ref가 있는 신호 발견을 표시", ["signalCore", "focusMarker"], ["signal_navigation"], "focus marker를 고정 위치에서 강조"),
  motion("source_scan", "검증된 source ref의 위치를 따라 안내", ["evidencePanel", "pointer"], ["source_navigation"], "source 방향 포인터를 고정 표시"),
  motion("number_emphasis", "실제 number ref가 있는 숫자만 강조", ["indicator", "focusMarker"], ["number_navigation"], "숫자 옆 focus marker opacity를 소폭 변경"),
  motion("compare_left_right", "동일 근거 기반 좌우 비교 지점을 차례로 안내", ["leftGuide", "rightGuide"], ["comparison_navigation"], "좌우 guide를 동시에 고정 표시"),
  motion("cause_effect_link", "명시된 evidence 관계 또는 시간 순서를 연결", ["leftGuide", "rightGuide", "focusMarker"], ["relationship_navigation", "timeline_navigation"], "연결선과 marker를 정적 표시"),
  motion("warning_pulse", "근거가 있는 경고 목적을 한 번만 절제해 표시", ["pointer", "focusMarker"], ["warning_navigation"], "warning marker를 고정 표시", "limited_2"),
  motion("discovery_reveal", "실제 evidence 또는 source가 있는 발견을 점진적으로 공개", ["evidencePanel", "accent"], ["source_navigation", "signal_navigation"], "evidence panel opacity를 한 번 변경"),
  motion("next_signal_point", "다음 신호 위치를 짧게 안내", ["pointer", "focusMarker"], ["signal_navigation"], "포인터를 다음 신호 방향에 고정"),
  motion("chart_assist", "차트가 primary인 장면에서 축 또는 비교 지점만 보조", ["indicator", "leftGuide", "rightGuide"], ["number_navigation", "comparison_navigation"], "차트 외부 guide를 정적으로 표시"),
  motion("source_card_assist", "source card를 가리지 않고 출처 위치를 보조", ["evidencePanel", "pointer"], ["source_navigation"], "source card 외부 포인터를 정적으로 표시"),
];

export function cloneCharacterMotionDefinition(
  definition: CharacterMotionDefinition,
): CharacterMotionDefinition {
  return {
    ...definition,
    timing: { ...definition.timing },
    keyframes: definition.keyframes.map((entry) => ({ ...entry })),
    affectedLayerIds: [...definition.affectedLayerIds],
    affectedSemanticRoles: [...definition.affectedSemanticRoles],
    allowedDirectionIds: [...definition.allowedDirectionIds],
  };
}

export function getCharacterMotionVocabulary(): readonly CharacterMotionDefinition[] {
  return CHARACTER_MOTION_VOCABULARY.map(cloneCharacterMotionDefinition);
}

export function getCharacterMotionDefinition(
  motionTag: CharacterRigMotionTag,
): CharacterMotionDefinition {
  const definition = CHARACTER_MOTION_VOCABULARY.find((entry) => entry.motionTag === motionTag);
  if (!definition) throw new Error(`Unsupported character motion: ${motionTag}`);
  return cloneCharacterMotionDefinition(definition);
}
