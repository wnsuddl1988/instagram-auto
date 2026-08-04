import type { CharacterDirectionDefinition, CharacterDirectionId } from "./contracts";

const SHARED_PROHIBITED_MOTIFS = [
  "money_coin_banknote_face",
  "reference_channel_silhouette",
  "reference_channel_expression_prop_palette",
  "reference_channel_signature_motion",
  "third_party_logo_or_trademark",
  "external_character_svg_or_icon",
  "real_person_face",
  "character_over_primary_evidence",
  "character_as_primary_evidence",
] as const;

export const CHARACTER_DIRECTIONS: readonly CharacterDirectionDefinition[] = [
  {
    directionId: "loop_signal_navigator",
    temporaryDisplayName: "Loop — Signal Navigator (비교용)",
    status: "comparison_only",
    silhouetteClass: "asymmetric_open_signal_ring",
    silhouetteDescription: "열린 비대칭 신호 링에 센서 노치와 방향 포인터를 결합한 기능형 실루엣",
    visualRoles: ["signal_navigation", "source_navigation", "number_navigation"],
    personality: "차분하게 신호를 발견하고 다음 근거로 안내하는 분석형 내비게이터",
    motionVocabularyEmphasis: ["signal_detect", "number_emphasis", "next_signal_point"],
    implementationComplexity: "medium",
    maintenanceComplexity: "low",
    accessibilityConsiderations: ["열린 링 형태를 유지", "상태를 색상만으로 구분하지 않음", "감속 시 포인터 위치로 의미 유지"],
    screenOccupancyTargetPercent: 14,
    evidencePriorityRule: "character_secondary_evidence_first",
    rightsProvenance: "internal_svg_primitives_only",
    similarityRisks: ["완전한 원은 동전으로 오인될 수 있음", "과도한 눈·입 추가 시 마스코트 복제로 보일 수 있음"],
    prohibitedMotifs: [...SHARED_PROHIBITED_MOTIFS, "closed_coin_circle", "coin_face"],
    reducedMotionBehavior: "링 회전 대신 센서 노치의 작은 이동과 opacity 변화로 신호를 표시",
    finalIdentityApproved: false,
  },
  {
    directionId: "pin_field_finch",
    temporaryDisplayName: "Pin — Field Finch (비교용)",
    status: "comparison_only",
    silhouetteClass: "direction_pin_with_information_wings",
    silhouetteDescription: "작은 방향 핀 양옆에 정보 패널을 날개처럼 배치한 기능형 안내 장치",
    visualRoles: ["source_navigation", "comparison_navigation", "warning_navigation"],
    personality: "근거 위치와 비교 지점을 민첩하게 짚되 과장하지 않는 현장 안내형",
    motionVocabularyEmphasis: ["source_scan", "compare_left_right", "warning_pulse"],
    implementationComplexity: "medium",
    maintenanceComplexity: "medium",
    accessibilityConsiderations: ["새의 얼굴·부리 표현을 사용하지 않음", "좌우 패널은 텍스트 흐름과 분리", "감속 시 포인터와 패널 위치 유지"],
    screenOccupancyTargetPercent: 12,
    evidencePriorityRule: "character_secondary_evidence_first",
    rightsProvenance: "internal_svg_primitives_only",
    similarityRisks: ["실제 새 캐릭터로 읽힐 위험", "날개 동작이 타 캐릭터의 대표 동작과 유사해질 위험"],
    prohibitedMotifs: [...SHARED_PROHIBITED_MOTIFS, "literal_bird_face", "mascot_beak_or_eyes"],
    reducedMotionBehavior: "비행·바운스 대신 포인터의 짧은 이동과 패널 강조선으로 위치를 안내",
    finalIdentityApproved: false,
  },
  {
    directionId: "moa_archive_sprite",
    temporaryDisplayName: "Moa — Archive Sprite (비교용)",
    status: "comparison_only",
    silhouetteClass: "layered_archive_tabs",
    silhouetteDescription: "겹친 archive tab과 움직이는 데이터 슬롯으로 근거 묶음을 여는 시각 장치",
    visualRoles: ["source_navigation", "timeline_navigation", "relationship_navigation"],
    personality: "자료 묶음을 정돈해 시간 순서와 연결 관계를 보여 주는 기록 보조형",
    motionVocabularyEmphasis: ["source_card_assist", "cause_effect_link", "discovery_reveal"],
    implementationComplexity: "low",
    maintenanceComplexity: "low",
    accessibilityConsiderations: ["문서·지폐 얼굴 표현을 사용하지 않음", "겹침 순서를 명암 외 윤곽으로 구분", "감속 시 탭 간 간격으로 구조 유지"],
    screenOccupancyTargetPercent: 15,
    evidencePriorityRule: "character_secondary_evidence_first",
    rightsProvenance: "internal_svg_primitives_only",
    similarityRisks: ["문서 마스코트로 오인될 위험", "슬롯 형태가 지폐나 카드 얼굴처럼 보일 위험"],
    prohibitedMotifs: [...SHARED_PROHIBITED_MOTIFS, "document_face", "banknote_face"],
    reducedMotionBehavior: "슬롯 연속 이동 대신 탭 간 작은 간격 변화와 focus marker opacity로 연결을 표시",
    finalIdentityApproved: false,
  },
];

export function cloneCharacterDirection(
  direction: CharacterDirectionDefinition,
): CharacterDirectionDefinition {
  return {
    ...direction,
    visualRoles: [...direction.visualRoles],
    motionVocabularyEmphasis: [...direction.motionVocabularyEmphasis],
    accessibilityConsiderations: [...direction.accessibilityConsiderations],
    similarityRisks: [...direction.similarityRisks],
    prohibitedMotifs: [...direction.prohibitedMotifs],
  };
}

export function getCharacterDirections(): readonly CharacterDirectionDefinition[] {
  return CHARACTER_DIRECTIONS.map(cloneCharacterDirection);
}

export function getCharacterDirection(
  directionId: CharacterDirectionId,
): CharacterDirectionDefinition {
  const direction = CHARACTER_DIRECTIONS.find((entry) => entry.directionId === directionId);
  if (!direction) throw new Error(`Unsupported character direction: ${directionId}`);
  return cloneCharacterDirection(direction);
}
