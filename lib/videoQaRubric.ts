/**
 * videoQaRubric.ts
 * emotional_story 릴스 전용 수동 QA 평가 기준
 *
 * 사용법:
 *   const rubric = getQaRubric("emotional_story");
 *   const result = calculateManualQaScore(filledScores);
 *
 * 총점: 100점
 * 합격 기준: 70점 이상 (권장: 80점 이상)
 */

// ─────────────────────────────────────────────────────────────
// 타입 정의
// ─────────────────────────────────────────────────────────────

/** 개별 평가 항목 */
export interface QaItem {
  /** 항목 고유 ID */
  id: string;
  /** 평가 항목명 */
  label: string;
  /** 세부 설명 / 판단 기준 */
  description: string;
  /** 배점 (최대점) */
  maxScore: number;
  /** 평가 방법: "scale" = 0~maxScore 직접 입력, "checklist" = 항목 체크 */
  type: "scale" | "checklist";
  /** checklist 타입일 때 세부 체크 항목 (각 항목은 동점) */
  checkItems?: string[];
}

/** 평가 카테고리 */
export interface QaCategory {
  /** 카테고리 ID */
  id: string;
  /** 카테고리명 */
  name: string;
  /** 카테고리 배점 합계 */
  totalScore: number;
  /** 소속 평가 항목들 */
  items: QaItem[];
}

/** 전체 루브릭 */
export interface QaRubric {
  /** 적용 스타일 */
  referenceStyle: string;
  /** 버전 */
  version: string;
  /** 합격 기준 점수 */
  passingScore: number;
  /** 권장 합격 점수 */
  recommendedScore: number;
  /** 총점 */
  maxTotalScore: number;
  /** 평가 카테고리 목록 */
  categories: QaCategory[];
}

/** calculateManualQaScore 입력: 항목 ID → 실제 점수 */
export type QaScoreInput = Record<string, number>;

/** calculateManualQaScore 반환 */
export interface QaScoreResult {
  /** 항목별 점수 */
  itemScores: Record<string, { score: number; maxScore: number; ratio: number }>;
  /** 카테고리별 합산 점수 */
  categoryScores: Record<string, { score: number; maxScore: number; ratio: number }>;
  /** 총점 */
  totalScore: number;
  /** 총점 최대 */
  maxTotalScore: number;
  /** 합격 여부 */
  passed: boolean;
  /** 권장 합격 여부 */
  recommended: boolean;
  /** 등급 */
  grade: "S" | "A" | "B" | "C" | "F";
  /** 취약 카테고리 목록 (50% 미만) */
  weakCategories: string[];
  /** 비고 */
  notes: string[];
}

// ─────────────────────────────────────────────────────────────
// emotional_story 루브릭 정의
// ─────────────────────────────────────────────────────────────

const EMOTIONAL_STORY_RUBRIC: QaRubric = {
  referenceStyle: "emotional_story",
  version: "1.0.0",
  passingScore: 70,
  recommendedScore: 80,
  maxTotalScore: 100,

  categories: [
    // ── 1. 이야기 명확성 (20점) ───────────────────────────────
    {
      id: "narrative_clarity",
      name: "이야기 명확성",
      totalScore: 20,
      items: [
        {
          id: "hook_3sec",
          label: "첫 3초 후킹",
          description:
            "영상 시작 후 3초 안에 시청자가 '무슨 이야기인지' 궁금해지는 장면/자막이 있는지. " +
            "너무 밋밋한 오브젝트 컷이나 설명적 도입부는 감점.",
          maxScore: 5,
          type: "scale",
        },
        {
          id: "story_structure",
          label: "상황→갈등→반전→여운 구조",
          description:
            "10씬이 '상황 설정(1~3) → 갈등/위기(4~6) → 반전/감정 절정(7~8) → 여운/깨달음(9~10)' 흐름을 따르는지. " +
            "씬이 제자리를 맴돌거나 갑작스럽게 비약하면 감점.",
          maxScore: 10,
          type: "scale",
        },
        {
          id: "closing_line",
          label: "마지막 한 줄 여운",
          description:
            "씬 10(또는 마지막 자막)이 시청자의 감정을 마무리하는 '여운 문장'인지. " +
            "행동 유도(좋아요/댓글) 문구로 끝나면 -2점.",
          maxScore: 5,
          type: "scale",
        },
      ],
    },

    // ── 2. 이미지 적합도 (30점) ───────────────────────────────
    {
      id: "image_relevance",
      name: "이미지 적합도",
      totalScore: 30,
      items: [
        {
          id: "scene_image_match",
          label: "씬-이미지 연관성",
          description:
            "각 씬의 이미지가 해당 씬의 narration/caption 내용과 직접 관련이 있는지. " +
            "무관한 이미지(예: 꽃다발, 화병, 엉뚱한 소품)가 등장하면 씬당 -1점.",
          maxScore: 10,
          type: "scale",
        },
        {
          id: "core_object_consistency",
          label: "핵심 오브젝트 유지",
          description:
            "낡은 지갑, 바랜 사진, 구형 코트 등 스토리의 핵심 소품이 등장해야 할 씬에서 " +
            "빠지거나 전혀 다른 오브젝트로 대체되지 않는지.",
          maxScore: 8,
          type: "scale",
        },
        {
          id: "style_consistency",
          label: "손그림/수채화 톤 일관성",
          description:
            "10장 이미지 전체에서 손그림 수채화 감성이 유지되는지. " +
            "한두 장이라도 3D 렌더링/사진풍/디지털 hard-edge 스타일이 섞이면 -3점.",
          maxScore: 7,
          type: "scale",
        },
        {
          id: "no_irrelevant_props",
          label: "불필요한 소품 없음",
          description:
            "스토리와 무관한 소품(화병, 시계, 꽃, 음식 등)이 메인 오브젝트보다 눈에 띄게 배치되지 않는지.",
          maxScore: 5,
          type: "scale",
        },
      ],
    },

    // ── 3. 영상 생동감 (15점) ─────────────────────────────────
    {
      id: "visual_vitality",
      name: "영상 생동감",
      totalScore: 15,
      items: [
        {
          id: "motion_appropriateness",
          label: "모션 적절성",
          description:
            "과한 흔들림/빠른 줌이 없고, slow zoom/pulse가 장면 감정과 맞는지. " +
            "정지 화면이 3초 이상 이어지면 감점.",
          maxScore: 8,
          type: "scale",
        },
        {
          id: "transition_smoothness",
          label: "씬 전환 자연스러움",
          description:
            "씬 간 전환이 갑작스럽지 않고 감정 흐름을 끊지 않는지. " +
            "너무 빠른 컷 혹은 공백이 0.5초 이상 발생하면 감점.",
          maxScore: 7,
          type: "scale",
        },
      ],
    },

    // ── 4. 음성/감정 (15점) ───────────────────────────────────
    {
      id: "voice_emotion",
      name: "음성/감정",
      totalScore: 15,
      items: [
        {
          id: "voice_tone",
          label: "낭독 톤 (설명조 ❌ 감정 ✅)",
          description:
            "TTS가 뉴스 아나운서 톤이 아니라 감정적 낭독에 가까운지. " +
            "단조로운 기계음 느낌이 강하면 -3점.",
          maxScore: 7,
          type: "scale",
        },
        {
          id: "breathing_pause",
          label: "쉼/호흡 자연스러움",
          description:
            "문장 사이 쉼이 어색하지 않고 자연스러운지. " +
            "너무 빠르게 이어지거나 중간에 어색한 공백이 생기면 감점.",
          maxScore: 5,
          type: "scale",
        },
        {
          id: "volume_balance",
          label: "BGM·TTS 볼륨 밸런스",
          description:
            "BGM이 TTS를 덮지 않는지. TTS 볼륨이 전반부/후반부 일정한지.",
          maxScore: 3,
          type: "scale",
        },
      ],
    },

    // ── 5. 자막/싱크 (10점) ───────────────────────────────────
    {
      id: "subtitle_sync",
      name: "자막/싱크",
      totalScore: 10,
      items: [
        {
          id: "sync_accuracy",
          label: "음성-자막 타이밍 일치",
          description:
            "자막이 TTS 발화 시점보다 0.5초 이상 앞서거나 뒤처지는 씬이 없는지. " +
            "3씬 이상 어긋나면 -5점.",
          maxScore: 6,
          type: "scale",
        },
        {
          id: "subtitle_readability",
          label: "자막 가독성",
          description:
            "자막이 너무 짧아서 읽기 전에 사라지거나 (1초 미만), 배경과 겹쳐 안 보이거나, " +
            "한 화면에 너무 많은 텍스트가 표시되지 않는지.",
          maxScore: 4,
          type: "scale",
        },
      ],
    },

    // ── 6. 릴스 완성도 (10점) ─────────────────────────────────
    {
      id: "reel_completeness",
      name: "릴스 완성도",
      totalScore: 10,
      items: [
        {
          id: "hook_retention",
          label: "1~2초 이탈 방어",
          description:
            "영상 첫 1~2초가 충분히 매력적이어서 스크롤 넘김을 방어하는지. " +
            "검은 화면 시작, 오프닝 로고, 긴 배경음 페이드인은 감점.",
          maxScore: 4,
          type: "scale",
        },
        {
          id: "shareable_feel",
          label: "저장/공유 욕구",
          description:
            "영상을 다 보고 나서 '저장하고 싶다' 또는 '누군가에게 보내고 싶다'는 감정이 드는지. " +
            "주관적 판단이지만 핵심 지표.",
          maxScore: 4,
          type: "scale",
        },
        {
          id: "duration_fit",
          label: "전체 길이 적절성",
          description:
            "총 영상 길이가 25~45초 사이인지. 20초 미만은 너무 짧고 55초 초과는 이탈 위험.",
          maxScore: 2,
          type: "scale",
        },
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────
// Helper: getQaRubric
// ─────────────────────────────────────────────────────────────

/**
 * 스타일별 QA 루브릭 반환.
 * 현재는 "emotional_story"만 지원.
 */
export function getQaRubric(referenceStyle: string): QaRubric {
  if (referenceStyle === "emotional_story") return EMOTIONAL_STORY_RUBRIC;
  throw new Error(`[videoQaRubric] 지원하지 않는 referenceStyle: "${referenceStyle}"`);
}

// ─────────────────────────────────────────────────────────────
// Helper: calculateManualQaScore
// ─────────────────────────────────────────────────────────────

/**
 * 사람이 직접 입력한 항목별 점수를 집계해 최종 QA 결과를 반환.
 *
 * @param input    항목 ID → 부여 점수 (예: { hook_3sec: 4, story_structure: 8, ... })
 * @param rubric   사용할 루브릭 (기본: emotional_story)
 */
export function calculateManualQaScore(
  input: QaScoreInput,
  rubric: QaRubric = EMOTIONAL_STORY_RUBRIC,
): QaScoreResult {
  // ── 항목별 처리 ──────────────────────────────────────────
  const itemScores: QaScoreResult["itemScores"] = {};
  const categoryScores: QaScoreResult["categoryScores"] = {};

  let totalScore = 0;
  const weakCategories: string[] = [];
  const notes: string[] = [];

  for (const category of rubric.categories) {
    let catScore = 0;

    for (const item of category.items) {
      const raw = input[item.id] ?? 0;
      // 0 ~ maxScore 범위 clamp
      const clamped = Math.max(0, Math.min(item.maxScore, raw));
      const ratio = item.maxScore > 0 ? clamped / item.maxScore : 0;

      itemScores[item.id] = { score: clamped, maxScore: item.maxScore, ratio };
      catScore += clamped;
    }

    const catRatio = category.totalScore > 0 ? catScore / category.totalScore : 0;
    categoryScores[category.id] = {
      score: catScore,
      maxScore: category.totalScore,
      ratio: catRatio,
    };

    if (catRatio < 0.5) {
      weakCategories.push(category.name);
    }

    totalScore += catScore;
  }

  // ── 등급 산정 ──────────────────────────────────────────
  let grade: QaScoreResult["grade"];
  if (totalScore >= 90) grade = "S";
  else if (totalScore >= 80) grade = "A";
  else if (totalScore >= 70) grade = "B";
  else if (totalScore >= 60) grade = "C";
  else grade = "F";

  // ── 자동 비고 ──────────────────────────────────────────
  if (weakCategories.length > 0) {
    notes.push(`취약 카테고리(50% 미만): ${weakCategories.join(", ")}`);
  }
  if (grade === "F") {
    notes.push("총점 60점 미만 — 릴스 공개 전 반드시 재렌더 필요");
  }
  if ((input["style_consistency"] ?? 0) < 4) {
    notes.push("손그림 스타일 일관성 낮음 — Imagen/Pollinations 프롬프트 재조정 권장");
  }
  if ((input["hook_3sec"] ?? 0) < 3) {
    notes.push("첫 3초 후킹 약함 — 씬 1 imagePrompt 또는 caption 재검토 권장");
  }

  return {
    itemScores,
    categoryScores,
    totalScore,
    maxTotalScore: rubric.maxTotalScore,
    passed: totalScore >= rubric.passingScore,
    recommended: totalScore >= rubric.recommendedScore,
    grade,
    weakCategories,
    notes,
  };
}

// ─────────────────────────────────────────────────────────────
// Helper: formatQaScoreReport
// ─────────────────────────────────────────────────────────────

/**
 * QA 결과를 콘솔/로그용 텍스트로 포맷.
 */
export function formatQaScoreReport(result: QaScoreResult, rubric: QaRubric): string {
  const lines: string[] = [];
  lines.push(`\n${"─".repeat(50)}`);
  lines.push(`📋 QA 점수 리포트 — ${rubric.referenceStyle} v${rubric.version}`);
  lines.push(`${"─".repeat(50)}`);

  for (const category of rubric.categories) {
    const cat = result.categoryScores[category.id];
    const pct = Math.round(cat.ratio * 100);
    const bar = "█".repeat(Math.round(cat.ratio * 10)) + "░".repeat(10 - Math.round(cat.ratio * 10));
    lines.push(`\n[${category.name}]  ${cat.score}/${cat.maxScore}점  (${pct}%)  ${bar}`);

    for (const item of category.items) {
      const it = result.itemScores[item.id];
      lines.push(`  • ${item.label.padEnd(28)} ${it.score}/${it.maxScore}점`);
    }
  }

  lines.push(`\n${"─".repeat(50)}`);
  lines.push(`총점: ${result.totalScore} / ${result.maxTotalScore}점  [${result.grade}등급]`);
  lines.push(`합격: ${result.passed ? "✅ PASS" : "❌ FAIL"}  /  권장: ${result.recommended ? "✅" : "⚠️ 미달"}`);
  if (result.notes.length > 0) {
    lines.push("\n📌 비고:");
    result.notes.forEach((n) => lines.push(`  - ${n}`));
  }
  lines.push(`${"─".repeat(50)}\n`);

  return lines.join("\n");
}
