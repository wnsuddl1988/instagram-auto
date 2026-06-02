import { NextRequest, NextResponse } from "next/server";
import { generateReelV2Plan, type GeneratedReelV2, type ReelV2Scene, type ReelV2Meta } from "@/lib/openai";
import { getReelCategory, categoryToV2Params, REEL_CATEGORIES, type ReferenceStyle } from "@/lib/reelCategories";
import { checkPaidApi, getPaidApiStatus } from "@/lib/paidApiGuard";
import {
  SEED_OBJECT_ENTRIES,
  matchSeedEntry as _matchSeedEntry,
  seedObjects as _seedObjects,
  seedSingleMap as _seedSingleMap,
  safeFallbackCaption as _safeFallbackCaption,
  isCaptionLike as _isCaptionLike,
  fixWeakCaption,
  rewriteEmotionalCaption,
} from "@/lib/captionSanitizer";

// ── 콘티 품질 자동 보정 ────────────────────────────────────────────────────────

export type WarnSeverity = "info" | "warning" | "fixed";

export interface PlanWarning {
  severity: WarnSeverity;
  sceneNumber: number;  // 0 = 플랜 전체
  message: string;
}

export interface QualityScore {
  score: number;          // 0~100
  grade: "pass" | "review" | "fail";  // ≥80 / 60~79 / <60
  breakdown: { label: string; earned: number; max: number; pass: boolean }[];
  /** 어떤 gate가 score를 캡했는지 (진단용) */
  capReasons?: string[];
}

/** 각 재시도 시도별 요약 (진단/비용 분석용) */
export interface AttemptSummary {
  attempt: number;
  score: number;
  grade: "pass" | "review" | "fail";
  sceneCount: number;
  warningCounts: { fixed: number; warning: number; info: number };
  failedBreakdownLabels: string[];
  capReasons: string[];
}

// ── emotional_story 소재 풀 (서버에서 직접 선택) ─────────────────────────────
// GPT 자유 선택 시 특정 소재로 수렴하는 문제를 방지하기 위해 서버에서 topic을 주입
// 택배상자·우산·신발은 과거에 반복 수렴된 소재이므로 풀에서 제외
const EMOTIONAL_STORY_TOPIC_POOL = [
  "엄마의 빈 도시락통",
  "병원 복도 빈 의자",
  "오래된 지갑 속 사진",
  "냉장고에 붙은 메모",
  "이웃이 두고 간 반찬통",
  "팔지 못한 오래된 집 열쇠",
  "아버지의 낡은 지갑",
  "할머니의 빈 밥그릇",
  "아무도 받지 않은 전화기",
  "오래된 가족사진 액자",
  "아버지 서랍 속 낡은 노트",
  "배우자가 남긴 작은 쪽지",
] as const;

/** emotional_story 요청마다 풀에서 균등 랜덤 선택 */
function pickStorySeedTopic(): string {
  const idx = Math.floor(Math.random() * EMOTIONAL_STORY_TOPIC_POOL.length);
  return EMOTIONAL_STORY_TOPIC_POOL[idx];
}

function expectedSceneCount(referenceStyle: ReferenceStyle, duration: 30 | 45 | 60): number {
  if (referenceStyle === "emotional_story") return duration <= 30 ? 9 : duration <= 45 ? 10 : 12;
  // living_tips: 10씬 고정 (훅1 + 실수2~3 + 해결4~7 + 보너스8~9 + CTA10)
  if (referenceStyle === "living_tips") return 10;
  return duration <= 30 ? 11 : duration <= 45 ? 14 : 18;
}

// ── 콘티 품질 점수 계산 ────────────────────────────────────────────────────────
function calcQualityScore(
  plan: GeneratedReelV2,
  warnings: PlanWarning[],
  referenceStyle: ReferenceStyle
): QualityScore {
  const scenes = plan.scenes;
  const total = scenes.length;

  const isEmotional = referenceStyle === "emotional_story";
  const isLivingTips = referenceStyle === "living_tips";

  const shortNarrationCount = warnings.filter(
    (w) =>
      w.severity === "warning" &&
      (w.message.includes("narration 짧음") || w.message.includes("narration 미완성"))
  ).length;

  // motion 위반: emotional_story는 character_talk도 위반, 일반은 hold만
  const motionViolationCount = warnings.filter(
    (w) => w.severity === "fixed" && w.message.includes("motion")
  ).length;

  // caption 품질 warning 집계: 짧음 + 추상 단어 (길이 초과 fixed는 자동보정되므로 제외)
  const captionShortCount = warnings.filter(
    (w) =>
      w.severity === "warning" &&
      (w.message.includes("caption 짧음") || w.message.includes("caption 추상 단어"))
  ).length;

  const imageInfoCount = warnings.filter(
    (w) => w.severity === "info" && w.message.includes("imagePrompt")
  ).length;
  // imagePrompt-narration 불일치 info 건수 (별도 집계 — gate용)
  const imageMismatchCount = warnings.filter(
    (w) => w.severity === "info" && w.message.includes("imagePrompt-narration 명사 불일치")
  ).length;
  // QA-26: scene 7~8 mismatch는 warning으로 격상됨 → 별도 집계
  const hasScene78Mismatch = isEmotional && warnings.some(
    (w) => w.severity === "warning" &&
      w.message.includes("imagePrompt-narration 명사 불일치") &&
      (w.sceneNumber === 7 || w.sceneNumber === 8)
  );

  // scene 8 깨달음 금지 위반 여부
  const hasScene8Realization = isEmotional && warnings.some(
    (w) => w.severity === "warning" && w.message.includes("scene 8 깨달음 금지")
  );
  // scene 8 반전 밀도 부족 (16자 미만 단문)
  const hasScene8ThinTwist = isEmotional && warnings.some(
    (w) => w.severity === "warning" && w.message.includes("scene 8 반전 밀도 부족")
  );
  // scene 9 closing formula 침범 여부
  const hasScene9ClosingFormula = isEmotional && warnings.some(
    (w) => w.severity === "warning" && w.message.includes("scene 9 closing formula 침범")
  );
  // scene 7/8 imagePrompt 날짜 단서 미반영 건수
  const imageDateClueCount = isEmotional ? warnings.filter(
    (w) => w.severity === "info" && w.message.includes("imagePrompt 날짜 단서 미반영")
  ).length : 0;
  // scene 10 generic closing ("사랑이었어요" 단독)
  const hasGenericClosing = isEmotional && warnings.some(
    (w) => w.severity === "info" && w.message.includes("scene 10 generic closing")
  );

  // ── living_tips 전용 판정 변수 ─────────────────────────────────────────────
  // scene 8~10 후반 정보 밀도 부족 건수
  const livingTipsLateSceneThinCount = isLivingTips ? warnings.filter(
    (w) => w.severity === "warning" && w.message.includes("후반 정보 밀도 부족")
  ).length : 0;
  // scene 10 CTA 핵심 요약 누락
  const hasLivingTipsThinCta = isLivingTips && warnings.some(
    (w) => w.severity === "warning" && w.message.includes("CTA 핵심 요약 누락")
  );

  const sceneCountWarningCount = warnings.filter(
    (w) => w.severity === "warning" && w.message.includes("씬 수 불일치")
  ).length;

  const hasCharacterPulseOnce =
    scenes.filter((s: ReelV2Scene) => s.motion === "character_pulse").length === 1;
  const lastSceneIsZoomOut =
    total > 0 && scenes[total - 1]?.motion === "slow_zoom_out";
  // 관계 명확: scenes 1~3 전체에서 검사 (scene 3까지는 허용)
  const storyTextRel = [
    plan.topTitle,
    plan.hook,
    ...scenes.slice(0, 3).map((s: ReelV2Scene) => `${s.caption} ${s.narration}`),
  ].join(" ");
  const hasRelationshipEarly =
    !isEmotional || /(엄마|어머니|아버지|아빠|부모|남편|아내|배우자|딸|아들|할머니|할아버지|이웃)/.test(storyTextRel);
  // 후킹: sanitizePlan에서 생성한 "초반 후킹 없음" warning 존재 여부로 판단
  // (패딩 전 원본 narration 기준이므로 패딩 오탐 없음)
  const hasNoHookWarning = warnings.some(
    (w) => w.severity === "warning" && w.message.includes("초반 후킹 없음")
  );
  const hasHookQuestion = !isEmotional || !hasNoHookWarning;

  // topic 다양성 감지: topTitle에 다양한 소재가 있는지 (≥ 2자리 한글 단어)
  const topicWords = (plan.topTitle ?? "").match(/[가-힣]{2,}/g) ?? [];
  const hasTopicVariety = topicWords.length >= 2;

  // 한국어 자연스러움 warning 집계 (어순 도치 + 조사 누락 + 감정형 caption)
  const koreanQualityWarningCount = warnings.filter(
    (w) =>
      w.severity === "warning" &&
      (w.message.includes("한국어") || w.message.includes("caption 감정형"))
  ).length;
  // 과거형 남발 집계 (info 레벨)
  const overPastCount = warnings.filter(
    (w) => w.severity === "info" && w.message.includes("과거형")
  ).length;
  const koreanNaturalnessPass = koreanQualityWarningCount === 0 && overPastCount <= 2;
  const koreanNaturalnessEarned = isEmotional
    ? koreanQualityWarningCount === 0 && overPastCount <= 2 ? 10
    : koreanQualityWarningCount <= 1 && overPastCount <= 3 ? 5
    : 0
    : 0;

  // 중복 narration 집계
  // ※ 완전 동일 narration 또는 마지막 2씬 반복은 별도 critical 처리 (아래 gate)
  const dupNarrationCount = warnings.filter(
    (w) =>
      w.severity === "warning" && w.message.includes("narration") &&
      (w.message.includes("중복") || w.message.includes("유사 반복"))
  ).length;
  // 완전 동일 narration이 있으면 critical flag
  const hasExactDup = warnings.some(
    (w) => w.severity === "warning" && w.message.includes("narration 완전 중복")
  );
  // 마지막 2씬 유사 반복
  const hasLastTwoDup = warnings.some(
    (w) => w.severity === "warning" && w.message.includes("마지막 2씬 유사 반복")
  );
  // 점수: 0건=10, 1건=7, 2건=5, 3건=2, 4건+=0
  // threshold 0.88로 상향 후 false-positive 감소 → 기준도 소폭 현실화
  const dupNarrationEarned = isEmotional
    ? dupNarrationCount === 0 ? 10
    : dupNarrationCount === 1 ? 7
    : dupNarrationCount === 2 ? 5
    : dupNarrationCount === 3 ? 2
    : 0
    : 0;

  // caption 구체성 이슈 집계
  // ※ severity "fixed"인 자동 보정 건은 포함하지 않음 (보정된 것은 합격 처리)
  const captionConcreteCount = warnings.filter(
    (w) =>
      w.severity === "warning" &&
      (w.message.includes("caption 추상 표현") ||
        w.message.includes("caption 수식어만") ||
        w.message.includes("caption 직접 발화") ||
        w.message.includes("caption 정보량 부족") ||
        w.message.includes("caption 수식어만 있고 명사 없음") ||
        w.message.includes("caption 감정형 수식어 금지") ||
        w.message.includes("caption 중복") ||
        // 보정 실패 통합 메시지 (새 패턴) — "caption 추상 표현 ("...") — 오브젝트+장소 조합으로 수정 권장"
        (w.message.startsWith("caption ") && w.message.includes("수정 권장")))
  ).length;
  const captionConcreteEarned = isEmotional
    ? captionConcreteCount === 0 ? 10 : captionConcreteCount === 1 ? 5 : 0
    : 0;

  // 결말 흐림 집계
  const vagueEndingCount = warnings.filter(
    (w) => w.severity === "warning" && w.message.includes("결말 흐림")
  ).length;

  // scene 10 현재행동 반복 closing 집계
  // - "fixed" severity면 자동 교체 완료 → 점수 차감 없음
  // - 만약 감지됐으나 fixed가 아닌 경우 대비해 warning도 체크 (향후 확장용)
  const closingActionFixed = warnings.some(
    (w) => w.severity === "fixed" && w.message.includes("scene 10 현재행동 반복 closing 자동 교체")
  );
  const closingActionWarning = warnings.some(
    (w) => w.severity === "warning" && w.message.includes("scene 10 현재행동 반복 closing")
  );
  // fixed면 교체 완료이므로 결말 구체성 점수는 정상 — 단, grade는 review 상한으로 cap
  // (자동 교체 품질이 완벽하지 않을 수 있으므로 human review 권장)
  const endingConcreteEarned = isEmotional
    ? (vagueEndingCount === 0 && !closingActionWarning) ? 10 : 0
    : 0;

  // 반전 구체성 집계: scene 7~9에서 추상어만 있는 반전 씬
  const abstractTwistCount = warnings.filter(
    (w) => w.severity === "warning" && w.message.includes("반전 추상")
  ).length;
  const twistConcreteEarned = isEmotional
    ? abstractTwistCount === 0 ? 10 : abstractTwistCount === 1 ? 5 : 0
    : 0;

  // 감정축 일치 집계: parents-children 계열에서 친구/제3자 drift
  const emotionalAxisDriftCount = warnings.filter(
    (w) => w.severity === "warning" && w.message.includes("감정축 drift")
  ).length;
  const emotionalAxisEarned = isEmotional
    ? emotionalAxisDriftCount === 0 ? 10 : 0
    : 0;

  // narration 가중치: emotional_story 30점, 일반 15점 (빠른 릴스는 짧은 narration이 정상)
  const narrationMax = isEmotional ? 30 : 15;
  const narrationEarned =
    shortNarrationCount === 0 ? narrationMax
    : shortNarrationCount === 1 ? Math.round(narrationMax * 0.5)
    : 0;

  const breakdown: QualityScore["breakdown"] = [
    {
      label: `narration 짧음 ${shortNarrationCount}건`,
      earned: narrationEarned,
      max: narrationMax,
      pass: shortNarrationCount === 0,
    },
    {
      label: "motion 위반 0건",
      earned: motionViolationCount === 0 ? 20 : 0,
      max: 20,
      pass: motionViolationCount === 0,
    },
    {
      label: "씬 수 정확",
      earned: sceneCountWarningCount === 0 ? 10 : 0,
      max: 10,
      pass: sceneCountWarningCount === 0,
    },
    {
      label: "character_pulse 정확히 1회",
      earned: isEmotional ? (hasCharacterPulseOnce ? 15 : 0) : 0,
      max: isEmotional ? 15 : 0,
      pass: isEmotional ? hasCharacterPulseOnce : true,
    },
    {
      label: "마지막 씬 slow_zoom_out",
      earned: lastSceneIsZoomOut ? 10 : 0,
      max: 10,
      pass: lastSceneIsZoomOut,
    },
    {
      label: "caption 품질 warning 2건 이하",
      earned: captionShortCount <= 2 ? 10 : 0,
      max: 10,
      pass: captionShortCount <= 2,
    },
    {
      label: "imagePrompt info 3건 이하",
      earned: imageInfoCount <= 3 ? 10 : 0,
      max: 10,
      pass: imageInfoCount <= 3,
    },
    {
      label: "topic 다양성",
      earned: hasTopicVariety ? 5 : 0,
      max: 5,
      pass: hasTopicVariety,
    },
    {
      label: "초반 관계 명확",
      earned: isEmotional ? (hasRelationshipEarly ? 5 : 0) : 0,
      max: isEmotional ? 5 : 0,
      pass: hasRelationshipEarly,
    },
    {
      label: "초반 후킹 질문",
      earned: isEmotional ? (hasHookQuestion ? 5 : 0) : 0,
      max: isEmotional ? 5 : 0,
      pass: hasHookQuestion,
    },
    {
      label: "한국어 자연스러움",
      earned: koreanNaturalnessEarned,
      max: isEmotional ? 10 : 0,
      pass: isEmotional ? koreanNaturalnessPass : true,
    },
    {
      label: "중복 장면 관리",
      earned: dupNarrationEarned,
      max: isEmotional ? 10 : 0,
      // pass: 3건 이하 + 완전 중복 없음 + 마지막 2씬 반복 없음
      pass: isEmotional ? (dupNarrationCount <= 3 && !hasExactDup && !hasLastTwoDup) : true,
    },
    {
      label: "caption 구체성",
      earned: captionConcreteEarned,
      max: isEmotional ? 10 : 0,
      pass: isEmotional ? captionConcreteCount === 0 : true,
    },
    {
      label: "결말 구체성",
      earned: endingConcreteEarned,
      max: isEmotional ? 10 : 0,
      pass: isEmotional ? vagueEndingCount === 0 : true,
    },
    {
      label: "반전 구체성",
      earned: twistConcreteEarned,
      max: isEmotional ? 10 : 0,
      pass: isEmotional ? abstractTwistCount === 0 : true,
    },
    {
      label: "감정축 일치",
      earned: emotionalAxisEarned,
      max: isEmotional ? 10 : 0,
      pass: isEmotional ? emotionalAxisDriftCount === 0 : true,
    },
    // ── QA-23 추가 항목 ─────────────────────────────────────────────────────
    {
      label: "scene 8 구체 반전",
      // scene 8이 깨달음 문장이면 fail — max 0으로 점수에는 영향 없지만 pass 여부로 gate 적용
      earned: isEmotional ? (hasScene8Realization ? 0 : 5) : 0,
      max: isEmotional ? 5 : 0,
      pass: isEmotional ? !hasScene8Realization : true,
    },
    {
      label: "scene 9 감정 반응",
      // scene 9에 closing formula 침범 시 fail
      earned: isEmotional ? (hasScene9ClosingFormula ? 0 : 5) : 0,
      max: isEmotional ? 5 : 0,
      pass: isEmotional ? !hasScene9ClosingFormula : true,
    },
    {
      label: "이미지-내레이션 매칭",
      // mismatch 0~2건: pass / 3건: partial / 4건+: fail
      earned: isEmotional
        ? imageMismatchCount === 0 ? 5
        : imageMismatchCount <= 2 ? 3
        : imageMismatchCount <= 3 ? 1
        : 0
        : 0,
      max: isEmotional ? 5 : 0,
      pass: isEmotional ? imageMismatchCount <= 3 : true,
    },
    // ── QA-24 추가 항목 ─────────────────────────────────────────────────────
    {
      label: "scene 8 반전 밀도",
      // 16자 미만 단문 반전은 감정 밀도 부족 — pass 기준: 16자 이상 또는 깨달음 아닌 구체 반전
      earned: isEmotional ? (hasScene8ThinTwist ? 0 : 5) : 0,
      max: isEmotional ? 5 : 0,
      pass: isEmotional ? !hasScene8ThinTwist : true,
    },
    {
      label: "scene 7~8 반전 시각화",
      // 날짜/뒷면 단서가 narration에 있는데 imagePrompt에 시각 단서 없는 씬 수
      earned: isEmotional ? (imageDateClueCount === 0 ? 5 : imageDateClueCount === 1 ? 3 : 0) : 0,
      max: isEmotional ? 5 : 0,
      pass: isEmotional ? imageDateClueCount === 0 : true,
    },
    // ── living_tips 전용 항목 (QA-LH-1 보강) ──────────────────────────────────
    {
      label: "후반 정보 밀도",
      // scene 8~10 중 generic 단문이 있으면 감점
      earned: isLivingTips ? (livingTipsLateSceneThinCount === 0 ? 10 : livingTipsLateSceneThinCount === 1 ? 5 : 0) : 0,
      max: isLivingTips ? 10 : 0,
      pass: isLivingTips ? livingTipsLateSceneThinCount <= 1 : true,
    },
    {
      label: "CTA 핵심 요약",
      // scene 10이 단순 CTA("저장해두세요" 단독)면 fail — 핵심 키워드 포함 필수
      earned: isLivingTips ? (hasLivingTipsThinCta ? 0 : 10) : 0,
      max: isLivingTips ? 10 : 0,
      pass: isLivingTips ? !hasLivingTipsThinCta : true,
    },
  ];

  const maxTotal = breakdown.reduce((a, b) => a + b.max, 0);
  const earnedTotal = breakdown.reduce((a, b) => a + b.earned, 0);
  let score = maxTotal > 0 ? Math.round((earnedTotal / maxTotal) * 100) : 100;

  // ── emotional_story critical gate ─────────────────────────────────────────
  // (A) 씬 수 불일치 — 가장 우선 순위가 높은 hard gate
  //     9씬 또는 11씬 → 최대 79 (review), 8씬 이하 또는 12씬 이상 → 최대 59 (fail)
  //     pass는 절대 불가 (씬 수가 정확해야만 pass 가능)
  const sceneCountMismatch = isEmotional && sceneCountWarningCount > 0;
  const sceneCountSevere = sceneCountMismatch && (total <= 8 || total >= 12);

  // (B) 콘텐츠 품질 critical 항목 — fail 수로 grade 상한 적용
  //     "중복 장면 관리"는 완전 중복/마지막 2씬 반복 시에만 critical로 처리
  //     QA-23 추가: "scene 8 구체 반전", "scene 9 감정 반응", "이미지-내레이션 매칭" 포함
  const CRITICAL_LABELS = [
    "중복 장면 관리", "caption 구체성", "결말 구체성", "반전 구체성",
    "감정축 일치", "한국어 자연스러움",
    "scene 8 구체 반전", "scene 9 감정 반응", "이미지-내레이션 매칭",
    "scene 8 반전 밀도", "scene 7~8 반전 시각화",
    // living_tips 전용
    "후반 정보 밀도", "CTA 핵심 요약",
  ] as const;
  const criticalFailCount = (isEmotional || isLivingTips)
    ? breakdown.filter((b) => CRITICAL_LABELS.includes(b.label as typeof CRITICAL_LABELS[number]) && !b.pass).length
    : 0;

  // (C) 완전 동일 narration 또는 마지막 2씬 반복은 단독으로도 즉시 fail 처리
  const hardDupFail = isEmotional && (hasExactDup || hasLastTwoDup);

  // (D) character_pulse 누락 또는 중복 — 반전 씬 motion 미준수
  const pulseCount = scenes.filter((s: ReelV2Scene) => s.motion === "character_pulse").length;
  const pulseMissing = isEmotional && pulseCount === 0;
  const pulseExcess = isEmotional && pulseCount >= 2;

  // ── Gate 적용 + capReasons 기록 ────────────────────────────────────────────
  const capReasons: string[] = [];

  if (sceneCountSevere) {
    score = Math.min(score, 59);
    capReasons.push(`(A) 씬 수 severe 불일치: ${total}씬 → fail 상한 59`);
  } else if (sceneCountMismatch) {
    score = Math.min(score, 79);
    capReasons.push(`(A) 씬 수 불일치: ${total}씬 → review 상한 79`);
  }

  if (hardDupFail) {
    score = Math.min(score, 59);
    capReasons.push(`(C) narration 완전 중복/마지막 2씬 반복 → fail 상한 59`);
  }

  if (pulseMissing || pulseExcess) {
    score = Math.min(score, 79);
    capReasons.push(`(D) character_pulse ${pulseCount}회 (1회여야 함) → review 상한 79`);
  }

  if (isEmotional && criticalFailCount >= 2) {
    score = Math.min(score, 59);
    const failedLabels = breakdown
      .filter((b) => CRITICAL_LABELS.includes(b.label as typeof CRITICAL_LABELS[number]) && !b.pass)
      .map((b) => b.label);
    capReasons.push(`(B) critical fail ${criticalFailCount}건 [${failedLabels.join(", ")}] → fail 상한 59`);
  } else if (isEmotional && criticalFailCount === 1) {
    score = Math.min(score, 79);
    const failedLabel = breakdown.find(
      (b) => CRITICAL_LABELS.includes(b.label as typeof CRITICAL_LABELS[number]) && !b.pass
    )?.label ?? "unknown";
    capReasons.push(`(B) critical fail 1건 [${failedLabel}] → review 상한 79`);
  }

  if (isEmotional && closingActionFixed) {
    score = Math.min(score, 79);
    capReasons.push("(E) scene 10 현재행동 자동 교체됨 → review 상한 79 (human review 필요)");
  }

  if (isEmotional && hasScene8Realization) {
    score = Math.min(score, 79);
    capReasons.push("(F) scene 8 깨달음 문장 감지 (구체 반전 없음) → review 상한 79");
  }

  if (isEmotional && hasScene9ClosingFormula) {
    score = Math.min(score, 79);
    capReasons.push("(G) scene 9 closing formula 침범 → review 상한 79");
  }

  if (isEmotional && imageMismatchCount >= 4) {
    score = Math.min(score, 79);
    capReasons.push(`(H) imagePrompt-narration mismatch ${imageMismatchCount}건 → review 상한 79`);
  }

  if (isEmotional && hasScene8ThinTwist) {
    score = Math.min(score, 79);
    capReasons.push("(I) scene 8 반전 밀도 부족 (16자 미만) → review 상한 79");
  }

  if (isEmotional && imageDateClueCount >= 2) {
    score = Math.min(score, 79);
    capReasons.push(`(J) scene 7~8 반전 시각화 누락 ${imageDateClueCount}건 → review 상한 79`);
  }

  // (K) QA-26: scene 7~8 imagePrompt-narration 명사 불일치 → review 상한 79
  if (hasScene78Mismatch) {
    score = Math.min(score, 79);
    capReasons.push("(K) scene 7 또는 8 imagePrompt-narration 명사 불일치 (구체 반전 시각화 필수) → review 상한 79");
  }

  // (L) QA-LH-1: living_tips scene 8~10 후반 정보 밀도 부족 → review 상한 79
  // scene 8~9 generic 2건 이상이거나 scene 10 CTA 핵심 요약 누락이면 review 상한
  if (isLivingTips && (livingTipsLateSceneThinCount >= 2 || hasLivingTipsThinCta)) {
    score = Math.min(score, 79);
    const reasons: string[] = [];
    if (livingTipsLateSceneThinCount >= 2) reasons.push(`scene 8~9 generic ${livingTipsLateSceneThinCount}건`);
    if (hasLivingTipsThinCta) reasons.push("scene 10 CTA 핵심 요약 누락");
    capReasons.push(`(L) living_tips 후반 밀도 부족 [${reasons.join(", ")}] → review 상한 79`);
  }

  // (M) QA-LH-2: living_tips narration 짧음 3건 이상 → review 상한 79
  // emotional_story는 이미 (B) critical fail gate에서 처리됨.
  // living_tips는 별도 gate: scene 2~10에서 짧은 narration이 많으면 정보 밀도 부족
  if (isLivingTips && shortNarrationCount >= 3) {
    score = Math.min(score, 79);
    capReasons.push(`(M) living_tips narration 짧음 ${shortNarrationCount}건 (3건 이상) → review 상한 79`);
  }

  const grade: QualityScore["grade"] =
    score >= 80 ? "pass" : score >= 60 ? "review" : "fail";

  return { score, grade, breakdown, capReasons };
}

// ── emotional_story caption 자동 보정 ─────────────────────────────────────────
// 로직은 lib/captionSanitizer.ts 로 분리됨.
// SEED_OBJECT_ENTRIES, _matchSeedEntry, _seedObjects, _seedSingleMap,
// _safeFallbackCaption, _isCaptionLike, fixWeakCaption 은 상단 import 참조.
// ─────────────────────────────────────────────────────────────────────────────
// hold motion을 대체할 기본 motion 결정
function _replaceHold(idx: number, total: number): ReelV2Scene["motion"] {
  if (idx === 0) return "alive";
  if (idx === total - 1) return "slow_zoom_out";
  return idx % 2 === 0 ? "slow_zoom_in" : "character_nod";
}

function sanitizeImagePromptForGeneration(prompt: string): { prompt: string; changed: boolean } {
  let next = prompt;

  next = next
    // ── 선제 중복 제거 (다른 치환 전에 먼저) ────────────────────────────────────
    .replace(/\bplain plain\b/gi, "plain")
    .replace(/\bblurred plain\b/gi, "plain")          // "blurred plain back" → "plain back"
    // ── 사진 뒷면 (복합 패턴 — 가장 먼저 처리해 중첩 치환 방지) ────────────────
    .replace(/\bback of (the |a )?(old |faded )?photo showing\b/gi, "plain back of the photo with blurred marks")
    .replace(/\bback of (the |a )?(old |faded )?photo (with|that has)\b/gi, "plain back of the photo with blurred marks,")
    // ── 필기·손글씨 ──────────────────────────────────────────────────────────
    .replace(/\bold handwritten letter\b/gi, "blank folded old letter")
    .replace(/\bhandwritten letter\b/gi, "blank folded letter")
    .replace(/\bold handwritten note\b/gi, "blank folded old note")
    .replace(/\bhandwritten note\b/gi, "blank folded note")
    .replace(/\bhandwritten (date|text|writing|inscription|words?|memo)\b/gi, "blurred handwritten trace")
    .replace(/\bhandwriting\b/gi, "blurred trace")
    .replace(/\bnote with (a )?(short )?phrase\b/gi, "small folded note with no visible writing")
    .replace(/\bnote that reads\b/gi, "small folded note with no visible writing")
    .replace(/\bphoto that reads\b/gi, "photo with blurred back")
    // ── 날짜·숫자·달력 (구체적 패턴을 먼저, 일반 패턴은 뒤에) ─────────────────
    .replace(/\bbirthday date\b/gi, "soft glowing keepsake")
    .replace(/\bcalendar marked with (special |specific )?dates?\b/gi, "plain surface with no markings")
    .replace(/\bcalendar page( with no numbers)?\b/gi, "blank reminder card")
    .replace(/\bshowing a date\b/gi, "showing indistinct marks")
    .replace(/\bshowing (the )?(date|numbers?|digits?|writing|text)\b/gi, "showing only faded blurs")
    .replace(/\bdate written\b/gi, "indistinct faded marks")
    .replace(/\bnumbers on (the )?(back of the |old |faded )?(photo|picture)\b/gi, "blurred marks on the back")
    .replace(/\b(?:a |the |specific |special |exact )?date\b/gi, "indistinct mark")
    // ── 메모·비문·문자 ───────────────────────────────────────────────────────
    .replace(/\breadable memo\b/gi, "blurred paper slip")
    .replace(/\binscription\b/gi, "faded surface marking")
    .replace(/\bthank you message\b/gi, "warm glowing heart-shaped keepsake")
    .replace(/\bmessage\b/gi, "keepsake")
    .replace(/\bphrase\b/gi, "memory cue")
    .replace(/\bwriting on (the )?(back|photo|picture|paper)\b/gi, "blurred marks on the back")
    // ── 사람 얼굴·신원 ───────────────────────────────────────────────────────
    .replace(/\bphoto frame of a mother\b/gi, "family photo frame turned away")
    .replace(/\bmother in the background\b/gi, "soft family memory in the background")
    .replace(/\s{2,}/g, " ")
    .trim();

  // ── 중복 단어/구문 정리 ──────────────────────────────────────────────────────
  // 치환 과정에서 "plain plain", "blurred marks indistinct markings" 등 중복이 생길 수 있음
  next = next
    // "plain plain" → "plain" (사진 뒷면 패턴 치환 연쇄로 발생)
    .replace(/\bplain plain\b/gi, "plain")
    // "blurred marks indistinct markings" → "soft blurred indistinct marks"
    .replace(/\bblurred marks\s+indistinct markings\b/gi, "soft blurred indistinct marks")
    // "blurred marks, blurred indistinct marks" → "soft blurred indistinct marks"
    .replace(/\bblurred marks,\s*blurred indistinct marks\b/gi, "soft blurred indistinct marks")
    // "blurred marks," 뒤에 다시 "blurred marks"가 오는 경우만 축약
    .replace(/\bblurred marks,\s*blurred marks\b/gi, "soft blurred marks")
    // 쉼표+공백 중복
    .replace(/,\s*,/g, ",")
    .replace(/\s{2,}/g, " ")
    .trim();

  const noWriting = /no (readable )?(text|writing|letters)/i.test(next);
  if (!noWriting) {
    next = `${next}, no readable writing, no letters`;
  }

  return { prompt: next, changed: next !== prompt };
}

// 카테고리별 narration 길이 기준
// emotional_story는 18자를 목표로 추적하되, 14자 미만만 강한 warning으로 본다.
// 14~17자는 자연스러운 짧은 여운 문장일 수 있으므로 info 처리한다.
function _narrationTargetLen(referenceStyle: ReferenceStyle): number {
  // emotional_story: 18자 이상 (감정 밀도 필요)
  // living_tips: 18자 이상 (정보 밀도 필요 — 팁 한 문장이 의미를 가져야 함)
  // 기타: 10자 이상
  return referenceStyle === "emotional_story" || referenceStyle === "living_tips" ? 18 : 10;
}

function _narrationWarningLen(referenceStyle: ReferenceStyle): number {
  return referenceStyle === "emotional_story" || referenceStyle === "living_tips" ? 14 : 10;
}

function sanitizePlan(
  plan: GeneratedReelV2,
  referenceStyle: ReferenceStyle,
  storySeedTopic?: string
): { plan: GeneratedReelV2; warnings: PlanWarning[]; qualityScore: QualityScore } {
  const warnings: PlanWarning[] = [];
  const total = plan.scenes.length;
  const expectedTotal = expectedSceneCount(
    referenceStyle,
    (plan.estimatedDuration === 30 || plan.estimatedDuration === 60 ? plan.estimatedDuration : 45) as 30 | 45 | 60
  );
  const narrationTarget = _narrationTargetLen(referenceStyle);
  const narrationWarning = _narrationWarningLen(referenceStyle);

  if (total !== expectedTotal) {
    warnings.push({
      severity: "warning",
      sceneNumber: 0,
      message: `씬 수 불일치 — ${expectedTotal}씬 필요, 실제 ${total}씬. 재생성 권장`,
    });
  }

  // ── emotional_story 초반 후킹 질문 검사 (패딩 전 원본 기준) ───────────────────
  // scenes 1~2(인덱스 0~1)의 원본 narration에 hook 키워드가 없으면 warning.
  // 자동 패딩은 narration이 짧을 때 ", 그땐 몰랐었죠." 를 붙이므로
  // 패딩 결과를 기준으로 하면 오탐이 생김 → 패딩 전 원본으로만 검사.
  if (referenceStyle === "emotional_story" && total >= 2) {
    const earlyNarrations = [
      plan.hook ?? "",
      plan.scenes[0]?.narration ?? "",
      plan.scenes[1]?.narration ?? "",
    ].join(" ");
    const HOOK_RE = /왜|매일|아무도|말하지|숨긴|몰래|기다렸|버리지|주문한 적|몰랐|한 번도|한번도/;
    if (!HOOK_RE.test(earlyNarrations)) {
      warnings.push({
        severity: "warning",
        sceneNumber: 0,
        message: `초반 후킹 없음 — scene 1~2 narration에 hook 키워드(왜/매일/아무도/몰랐/한 번도 등) 없음. scene 2에서 "왜 그 [object]을 매일 [action]하셨는지, 몰랐어요." 형태의 의문 narration 권장`,
      });
    }
  }

  // ── emotional_story 감정축 drift 검사 ────────────────────────────────────────
  // subTopicId가 "parents-children"이거나 seedTopic에 부모 키워드가 있을 때:
  // 반전 씬(character_pulse 씬) 또는 scenes 7~9에서 제3자가 반전 중심이면 fail.
  if (referenceStyle === "emotional_story" && total >= 7) {
    const isParentChildTopic =
      plan._meta?.subTopicId === "parents-children" ||
      /아버지|어머니|엄마|아빠|부모|할머니|할아버지/.test(storySeedTopic ?? "");

    if (isParentChildTopic) {
      // ① character_pulse 씬(반전 씬)의 narration 개별 검사
      // ② scenes 7~9 (인덱스 6~8) narration 합산 검사 (fallback)
      const twistScenes = plan.scenes.filter((s: ReelV2Scene) => s.motion === "character_pulse");
      const twistPulseText = twistScenes.map((s: ReelV2Scene) => s.narration ?? "").join(" ");
      const twistRangeText = plan.scenes
        .slice(6, Math.min(9, total))
        .map((s: ReelV2Scene) => s.narration ?? "")
        .join(" ");

      // 제3자가 반전 핵심인 강한 패턴 (부모-자녀 관계와 무관한 인물이 반전 중심)
      const THIRD_PARTY_TWIST_RE =
        /(?:세상을\s*떠난\s*(?:친구|동료|지인|동창)|(?:친구|동창|동료|지인)[와과][의]?\s*마지막|(?:친구|동창|동료|지인)[을를]\s*그리워|(?:친구|동창|동료|지인)에게\s*(?:보낸|전한|남긴|쓴)|옛\s*(?:친구|연인|사랑|동창)[이가와]\s*(?:떠났|세상|사진|보낸)|이웃[이가]\s*(?:중심|반전|핵심|주인공)|낯선\s*(?:사람이|누군가가)\s*(?:나타났|등장))/;

      // 기존 패턴: 친구/제3자 단순 등장
      const THIRD_PARTY_RE =
        /(?:친구[가는이와을에게를]|동창[이가를]|동료[가는이를]|지인[이가를])/;

      // 자녀/나 가 반전 핵심 수신자인 신호
      const CHILD_AXIS_RE =
        /(?:나[는가]|나에게|나한테|내가|내게|딸[이가]|아들[이가]|자녀[가에게]|우리[에게]|자식[이가]|나를|내[가의])/;

      // 검사 1: 반전 씬(character_pulse)에서 강한 제3자 drift 패턴
      const pulseDrift = THIRD_PARTY_TWIST_RE.test(twistPulseText);

      // 검사 2: 반전 씬에 친구 등장 + 자녀/나 부재
      const pulseHasThirdParty = THIRD_PARTY_RE.test(twistPulseText);
      const pulseHasChildAxis = CHILD_AXIS_RE.test(twistPulseText);
      const pulseMissingChild = pulseHasThirdParty && !pulseHasChildAxis && twistPulseText.length > 0;

      // 검사 3: scenes 7~9 합산에서 친구 등장 + 자녀/나 부재 (기존 로직 유지)
      const rangeHasThirdParty = THIRD_PARTY_RE.test(twistRangeText);
      const rangeHasChildAxis = CHILD_AXIS_RE.test(twistRangeText);
      const rangeDrift = rangeHasThirdParty && !rangeHasChildAxis;

      // 검사 4: scenes 7~9 개별 씬 검사
      // 각 씬에 강한 제3자 반전 패턴이 있으면 해당 씬 단독으로 drift 판정
      // (자녀가 다른 씬에 있어도 해당 씬 자체가 제3자 중심이면 fail)
      const perSceneDriftIdx = plan.scenes
        .slice(6, Math.min(9, total))
        .findIndex((s: ReelV2Scene) => THIRD_PARTY_TWIST_RE.test(s.narration ?? ""));
      const perSceneDrift = perSceneDriftIdx >= 0;
      const perSceneDriftSceneNum = perSceneDrift ? 7 + perSceneDriftIdx : -1;

      if (pulseDrift || pulseMissingChild || rangeDrift || perSceneDrift) {
        const cause = pulseDrift
          ? "반전 씬에 '세상을 떠난 친구 / 친구와 마지막' 등 제3자 중심 반전 패턴 감지"
          : pulseMissingChild
          ? "반전 씬(character_pulse)에 친구/제3자가 등장하고 자녀(나/딸/아들) 언급이 없음"
          : perSceneDrift
          ? `scene ${perSceneDriftSceneNum}에 '세상을 떠난 친구 / 친구와 마지막' 등 제3자 중심 반전 패턴 감지`
          : "scenes 7~9에 친구/제3자가 등장하고 자녀(나/딸/아들) 언급이 없음";

        warnings.push({
          severity: "warning",
          sceneNumber: perSceneDrift ? perSceneDriftSceneNum : 0,
          message: `감정축 drift — 제3자 중심 반전. ${cause}. "부모→자녀" 감정축 유지 필요: 반전은 부모가 자녀에게 말하지 못한 사랑/걱정/희생이어야 함`,
        });
      }
    }
  }

  // emotional_story caption rewrite용 중복 추적 set (map 클로저에서 공유)
  const _usedRewriteCaptions = new Set<string>();

  const fixedScenes = plan.scenes.map((scene: ReelV2Scene, idx: number) => {
    let { caption, emphasis, motion, imagePrompt, narration } = scene;
    const sceneNumber = idx + 1;

    const captionNorm = (caption ?? "").replace(/\s/g, "");
    const wordCount = (caption ?? "").trim().split(/\s+/).filter(Boolean).length;
    const ABSTRACT_NOUNS = new Set([
      "걱정", "기억", "그때", "기다림", "울컥", "따뜻함", "그날", "그마음",
      "사랑", "희망", "슬픔", "그리움", "외로움", "아픔", "두려움", "행복",
      "후회", "설렘", "위로", "고마움", "미안함", "부끄러움", "마음",
      "순간", "감정", "느낌", "여운", "추억",
    ]);
    const vagueCaptionPhrases = ["마음의여운", "감정의파도", "따뜻한순간", "이상한느낌", "그리운마음"];
    // 마지막 단어 추출: 공백 기준 마지막 token
    const captionLastWord = (caption ?? "").trim().split(/\s+/).pop() ?? "";
    const TRAILING_ABSTRACT = new Set([
      "마음", "의문", "느낌", "감정", "추억", "기억", "걱정", "여운",
      "그리움", "아픔", "슬픔", "외로움", "사랑", "희망", "후회",
      "설렘", "위로", "내용", "이야기", "모습", "손길",
      "일상", "고단함", "외로움", "쓸쓸함", "따뜻함", "그리움",
      "마음씨", "정성", "인정", "온기", "흔적들", "이야기들",
    ]);
    const isAbstractCaption =
      referenceStyle === "emotional_story" &&
      ((wordCount === 1 && ABSTRACT_NOUNS.has(captionNorm)) ||
        vagueCaptionPhrases.includes(captionNorm) ||
        // 2단어 복합어에서 마지막 단어가 추상명사: "할머니 마음", "반찬통 의문", "닦는 손길"
        (wordCount === 2 && TRAILING_ABSTRACT.has(captionLastWord)));

    // ── 1. caption 길이 검사 ────────────────────────────────────────────────
    const captionLen = (caption ?? "").replace(/\s/g, "").length;

    if (captionLen > 12) {
      // 12자 초과 → 앞 10자로 단축 (fixed)
      const trimmed = caption.replace(/\s/g, "").slice(0, 10);
      warnings.push({
        severity: "fixed",
        sceneNumber,
        message: `caption 너무 김(${captionLen}자) → "${trimmed}"로 단축`,
      });
      caption = trimmed;
    } else if (captionLen > 10) {
      // 10~12자: 경고만 (warning)
      warnings.push({
        severity: "warning",
        sceneNumber,
        message: `caption ${captionLen}자 — 10자 이내 권장 ("${caption}")`,
      });
    } else if (captionLen < 4 && captionLen > 0) {
      // 짧은 caption은 needsFix 블록에서 자동 보정 우선 시도
      // wordCount >= 2인 "문 앞" 등은 info로 완화, 단일 단어는 needsFix로 처리
      if (wordCount >= 2 && !isAbstractCaption) {
        warnings.push({
          severity: "info",
          sceneNumber,
          message: `caption 짧음(공백제거 ${captionLen}자) — 4자 이상 권장 ("${caption}")`,
        });
      }
      // wordCount === 1 짧은 단독 명사는 needsFix 블록에서 처리 (warning 중복 방지)
    } else if (captionLen === 0) {
      warnings.push({
        severity: "warning",
        sceneNumber,
        message: "caption이 비어 있습니다",
      });
    }

    // ── 1-b-0. emotional_story caption rewrite (template 기반) ──────────────────
    // GPT caption을 고치는 대신, seedTopic+sceneIndex 기반 template으로 재작성.
    // template이 있는 seedTopic이면 항상 시도 — GPT 원본보다 template이 우선.
    // rewrite 성공 → _captionWasRewritten=true, 아래 fixWeakCaption 보정 블록 완전 skip.
    let _captionWasRewritten = false;
    if (referenceStyle === "emotional_story") {
      const rewritten = rewriteEmotionalCaption(idx, storySeedTopic, _usedRewriteCaptions);
      if (rewritten && rewritten !== caption) {
        warnings.push({
          severity: "fixed",
          sceneNumber,
          message: `caption template 재작성: "${caption}" → "${rewritten}"`,
        });
        caption = rewritten;
        _captionWasRewritten = true;
      }
      // 사용된 caption 등록 (rewrite 여부 관계없이)
      if (caption) _usedRewriteCaptions.add(caption);
    }

    // ── 1-b & 1-c. emotional_story caption 구체성 자동 보정 ────────────────────
    // 전략: warning만 내지 않고 fixWeakCaption()으로 먼저 보정 시도
    //       보정 성공 → severity "fixed" 기록, caption 치환
    //       보정 불가 → 기존대로 "warning" 기록 (captionConcreteCount에 반영)
    // ※ template rewrite 성공 시(_captionWasRewritten=true) 이 블록 전체 skip.
    if (referenceStyle === "emotional_story" && !_captionWasRewritten) {
      // (i) 수식어만 있고 명사 없는 caption
      // 형용사 단독: "낡은", "빈", "오래된" — wordCount=1이고 형용사어미로 끝남
      const adjectiveAlonePattern = /^[가-힣]+(ㄴ|은|는|던|됩|쌓인|진)$/;
      // "아무도 받지 않는", "아무도 받지 않은": 부정 동사구 단독
      const verbModifierOnlyPattern = /^(아무도\s+)?[가-힣\s]+(지\s*않는|지\s*않은|지\s*않았|않은|않는|않았)\s*$/;
      // "매일 닦은", "혼자 먹은", "항상 앉던": 부사(1~4자)+동사관형형 (명사 없음, wordCount=2)
      const adverbVerbModPattern = /^[가-힣]{1,4}\s+[가-힣]+(은|는|던|ㄴ)\s*$/;
      const isAdjectiveOnly = (
        (wordCount === 1 && adjectiveAlonePattern.test((caption ?? "").trim())) ||
        verbModifierOnlyPattern.test((caption ?? "").trim()) ||
        (wordCount === 2 && adverbVerbModPattern.test((caption ?? "").trim()))
      )
        && !/(?:운동화|신발|의자|상자|열쇠|사진|편지|쪽지|밥그릇|자물쇠|지갑|도시락|창문|복도|현관|서랍|반찬통|액자|노트|전화기|수화기|가죽|나무|종이|쇠|금속|유리)/.test(captionNorm);

      // (i-b) FORBIDDEN 감정형 수식어 + 명사 조합: "따뜻한 반찬통", "그리운 지갑" 등
      // 감정 형용사가 caption 앞에 오면 오브젝트 단독 caption보다 약함 → 보정 대상
      const EMOTION_ADJECTIVE_RE = /^(따뜻한|그리운|슬픈|외로운|아픈|감동적인|훈훈한|안타까운|울적한|쓸쓸한|포근한|그립고)\s+/;
      const startsWithEmotionAdj = EMOTION_ADJECTIVE_RE.test((caption ?? "").trim()) && wordCount === 2;

      // (ii) 직접 발화/문구형 caption
      const DIRECT_SPEECH = new Set([
        "사랑한다", "기다릴게", "고마워", "미안해", "보고싶어", "잘있어", "잘가",
        "사랑해", "그리워", "사랑했어", "미안했어", "괜찮아", "잊지마", "기억해",
        "고마웠어", "행복해", "행복했어",
      ]);

      // (iii) 단독 사용 시 정보량 부족 (관계어/질문형/짧은 추상명사/단일 오브젝트)
      const TOO_GENERIC_2 = new Set([
        "문앞", "그날", "순간", "기억", "마음", "그때",
        "같은자리", "궁금증", "글씨", "메모", "흔적", "빛",
        "소리", "냄새", "향기", "눈물", "웃음", "미소",
        "아버지", "어머니", "엄마", "아빠", "할머니", "할아버지",
        "이웃", "배우자", "남편", "아내",
        "왜", "왜?", "의문", "의문?", "의아함",
        "손때", "때", "먼지", "향", "빛깔", "색", "무게", "결",
        // 단일 구체 명사지만 수식어 없이 홀로 사용 시 너무 짧음
        "쪽지", "메모", "반찬통", "열쇠", "사진", "노트", "밥그릇", "도시락",
        "의자", "지갑", "액자", "손글씨", "목요일", "작업실", "기다림",
        // 단일 오브젝트 (seedTopic 핵심어지만 수식어 없이 홀로 쓰면 약함)
        "전화기", "수화기", "도시락통", "가족사진", "열쇠고리", "밥그릇", "반찬", "쪽지봉투",
        // 단독 장소 (수식어/오브젝트 없이 쓰면 약함)
        "서재", "부엌", "식탁", "방안", "방", "거실", "현관", "복도",
        // 단독 그릇류
        "그릇", "접시", "식기",
      ]);

      // (iv) 동사형/문장형으로 끝나는 caption — _isCaptionLike()로 판별
      const isVerbEnding = !_isCaptionLike(caption ?? "");

      // (v) 추상 연결어 조합 — "마음의 연결", "기억의 온기", "사랑의 의미" 등
      // "A의 B" 패턴에서 B가 추상명사일 때 → 릴스 자막으로 약함
      const ABSTRACT_CONNECTOR_TAIL = new Set([
        "연결", "의미", "온기", "여운", "감동", "끈", "연대", "공감",
        "울림", "흔적들", "이야기들", "기억들", "추억들",
      ]);
      const isAbstractConnector = wordCount === 2
        && /의$/.test((caption ?? "").trim().split(/\s+/)[0] ?? "")   // 첫 단어가 "~의"
        && ABSTRACT_CONNECTOR_TAIL.has(captionLastWord);

      // (vi) "추상어+속의+명사" 조합 — "마음속의 사진", "기억속의 지갑" 등
      // 실물 오브젝트가 있어도 앞에 추상 수식어가 붙으면 caption 강도 약화
      const ABSTRACT_SOKI_PREFIX = /^(마음속의|기억속의|추억속의|그리움속의|사랑속의)\s+/;
      const isAbstractSoki = ABSTRACT_SOKI_PREFIX.test((caption ?? "").trim());

      const needsFix = isAbstractCaption || isAdjectiveOnly || startsWithEmotionAdj
        || isVerbEnding
        || isAbstractConnector
        || isAbstractSoki
        || DIRECT_SPEECH.has(captionNorm)
        || (TOO_GENERIC_2.has(captionNorm))
        // 4자 미만 단일 명사도 singleMap 보정 시도
        || (captionLen > 0 && captionLen < 4 && wordCount === 1);

      if (needsFix) {
        const fixed = fixWeakCaption(caption, narration ?? undefined, storySeedTopic);
        if (fixed && fixed !== caption) {
          // 보정 성공: caption 치환 + fixed 기록 (captionConcreteCount 집계에서 제외)
          warnings.push({
            severity: "fixed",
            sceneNumber,
            message: `caption 자동 보정: "${caption}" → "${fixed}" (storySeedTopic 기반)`,
          });
          caption = fixed;
        } else {
          // 보정 불가: warning 기록 (captionConcreteCount 집계에 포함)
          const reason = isAbstractCaption ? "추상 표현"
            : isAdjectiveOnly ? "수식어만 있고 명사 없음"
            : startsWithEmotionAdj ? "감정형 수식어 금지"
            : isVerbEnding ? "동사/문장형 어미 금지"
            : DIRECT_SPEECH.has(captionNorm) ? "직접 발화 금지"
            : captionLen < 4 ? "너무 짧음(4자 미만)"
            : "정보량 부족";
          warnings.push({
            severity: "warning",
            sceneNumber,
            message: `caption ${reason} ("${caption}") — 오브젝트+장소 조합으로 수정 권장`,
          });
        }
      }
    }

    // ── 2. emphasis ↔ caption 불일치 보정 ───────────────────────────────────
    if (emphasis && caption && !caption.includes(emphasis)) {
      const firstWord = caption.split(/[\s,，·]/)[0] || caption.slice(0, 4);
      warnings.push({
        severity: "fixed",
        sceneNumber,
        message: `emphasis("${emphasis}")가 caption("${caption}")에 없음 → "${firstWord}"로 보정`,
      });
      emphasis = firstWord;
    }

    // ── 3. hold motion 금지 → 자동 교체 ────────────────────────────────────
    if (motion === "hold") {
      const replacement = _replaceHold(idx, total);
      warnings.push({
        severity: "fixed",
        sceneNumber,
        message: `hold 사용 금지 → "${replacement}"로 교체`,
      });
      motion = replacement;
    }

    // ── 4. emotional_story → character_talk 금지 ───────────────────────────
    if (referenceStyle === "emotional_story" && motion === "character_talk") {
      const replacement: ReelV2Scene["motion"] = idx % 2 === 0 ? "character_nod" : "slow_zoom_in";
      warnings.push({
        severity: "fixed",
        sceneNumber,
        message: `emotional_story에서 character_talk 금지 → "${replacement}"로 교체`,
      });
      motion = replacement;
    }

    // ── 4-b. living_tips scene 10 → slow_zoom_out 강제 보정 ─────────────────
    // QA-LH-2: GPT가 scene 10에 pan_left/pan_right를 배정하는 경향 → 자동 보정
    // ※ severity는 "fixed"이지만 message에 "motion"을 포함하지 않음 →
    //   motionViolationCount 집계에서 제외됨 (hold 금지와 다르게 점수 차감 없음)
    if (referenceStyle === "living_tips" && sceneNumber === total && motion !== "slow_zoom_out") {
      warnings.push({
        severity: "fixed",
        sceneNumber,
        message: `living_tips CTA씬 "${motion}" → "slow_zoom_out" 자동 보정 (마지막 씬은 slow_zoom_out 필수)`,
      });
      motion = "slow_zoom_out";
    }

    // ── 5. narration 길이 검사 (공백 제거 기준 12자 미만 = 짧음) ─────────────
    const normalizedNarration = (narration ?? "")
      .replace(/([,，])\s*/g, "$1 ")
      .replace(/\s{2,}/g, " ")
      .trim();
    if (normalizedNarration !== narration) {
      warnings.push({
        severity: "info",
        sceneNumber,
        message: "narration 쉼표/공백 정규화",
      });
      narration = normalizedNarration;
    }

    const narrationLen = (narration ?? "").replace(/\s/g, "").length;
    // 미완성 문장 패턴:
    // (A) 조사/쉼표 단독으로 문장 끝 (기존)
    // (B) "명사+조사+마침표" — 서술어 없이 체언으로 끝남: "모습이.", "생각이.", "마음이.", "아버지가."
    //     단, "요."·"죠."·"어요."·"습니다."·"었어요." 등 정상 어미는 제외
    const DANGLING_SUFFIX_RE =
      /([,，]\s*|(?:은|는|이|가|을|를|에|의|과|와|도|만|부터|까지|속에|끝에|덕분에))$|(?<![요죠])(?:이|가|은|는|을|를|의|과|와)[.。]$/;
    const endsAsDanglingClause =
      referenceStyle === "emotional_story" &&
      DANGLING_SUFFIX_RE.test((narration ?? "").trim());
    if (endsAsDanglingClause) {
      // 미완성 문장 자동 보정: 서술어 없는 dangling clause → 자연스러운 완성 문장으로 수정
      const danglingOrig = (narration ?? "").trim();
      const danglingBase = danglingOrig.replace(/[.。,，\s]+$/, "").trim();

      // 패턴별 보정 규칙 (우선순위 순)
      let fixedDangling: string | null = null;

      // "~이유는" / "~까닭은" → "왜 그러셨는지, 그땐 몰랐어요."
      if (/이유는$|까닭은$/.test(danglingBase)) {
        const core = danglingBase.replace(/이유는$|까닭은$/, "").trim().replace(/,\s*$/, "");
        fixedDangling = core
          ? `${core}, 왜 그러셨는지 몰랐어요.`
          : "왜 그러셨는지, 그땐 몰랐어요.";
      }
      // "~것은" / "~사실은" → "~것을, 그땐 몰랐어요."
      else if (/것은$|사실은$/.test(danglingBase)) {
        const core = danglingBase.replace(/것은$|사실은$/, "").trim().replace(/,\s*$/, "");
        fixedDangling = core
          ? `${core} 것을, 그때는 몰랐어요.`
          : "그 사실을, 그때는 몰랐어요.";
      }
      // "~은/는/이/가/을/를/의" 단독 조사로 끝나는 경우
      else if (/(?:은|는|이|가|을|를|의)[.。]?$/.test(danglingBase)) {
        fixedDangling = `${danglingBase.replace(/(?:은|는|이|가|을|를|의)[.。]?$/, "").trim()}, 그땐 몰랐었죠.`;
      }
      // 쉼표/공백으로 끝나는 dangling (조사 없이)
      else {
        fixedDangling = `${danglingBase}, 그땐 알지 못했어요.`;
      }

      if (fixedDangling) {
        // 너무 길어지면 truncate
        const fixedClean = fixedDangling.replace(/\s{2,}/g, " ").trim();
        warnings.push({
          severity: "fixed",
          sceneNumber,
          message: `narration 미완성 문장 자동 보정: "${danglingOrig}" → "${fixedClean}"`,
        });
        narration = fixedClean;
      } else {
        warnings.push({
          severity: "warning",
          sceneNumber,
          message: `narration 미완성 문장 — 서술어 없이 조사/명사로 끝남 ("${narration}")`,
        });
      }
    }

    // ── 질문형 약문 감지: 오브젝트 없이 질문만 있는 narration ──────────────────
    // 조건: emotional_story + 14자 미만 + "?/까요/걸까/누가/왜" 포함 + 핵심 오브젝트 없음
    if (
      referenceStyle === "emotional_story" &&
      narrationLen > 0 && narrationLen < 15 &&
      /[?？]|까요|걸까|누가|왜\s|왜$/.test(narration ?? "")
    ) {
      warnings.push({
        severity: "warning",
        sceneNumber,
        message: `narration 질문형 약문(${narrationLen}자) — 오브젝트/상황 없이 질문만 존재 ("${narration}") — 구체 오브젝트 포함 필요`,
      });
    }

    // ── emotional_story 짧은 narration 자동 패딩 ─────────────────────────────
    // 14자 미만이면 자연스러운 suffix를 추가해 TTS 리듬을 보정
    // 패딩 전략:
    //   1. 이미 "몰랐어요/알았어요/궁금했어요" 로 끝나면 → 앞에 "왜 그랬는지, " 삽입 (원문 보존)
    //   2. 단순 서술형 단문 → 뒤에 ", 그땐 몰랐었죠." 추가
    //   3. 질문형("까요/걸까/?") → "왜 그랬는지, " + 원문 → 14자 이상이면 완료
    //   4. 그 외 → ", 그땐 알지 못했어요." 추가
    if (referenceStyle === "emotional_story" && narrationLen > 0 && narrationLen < narrationWarning) {
      const orig = narration ?? "";
      let padded = orig;
      const trimmed = orig.trim().replace(/[.。]$/, "");

      if (/[?？]|까요$|걸까$|걸까요$/.test(trimmed)) {
        // 질문형: "왜 그랬는지, " + 원문 → 의미 있는 문장으로 전환
        padded = `왜 그랬는지, ${trimmed.replace(/[?？]$/, "")}는지, 그땐 몰랐어요.`;
        // 너무 길어지면 단순 suffix만
        if (padded.replace(/\s/g, "").length > 28) {
          padded = `${trimmed}, 이유는 몰랐어요.`;
        }
      } else if (/몰랐어요$|몰랐죠$|몰랐었어요$|몰랐었죠$/.test(trimmed)) {
        // "그땐 몰랐죠" 류 → 앞에 컨텍스트 삽입
        padded = `왜 그랬는지, ${trimmed}.`;
      } else if (/궁금했어요$|궁금했죠$/.test(trimmed)) {
        // "궁금했어요" → 왜 그랬는지 컨텍스트
        padded = `왜 그랬는지, 오래 ${trimmed}.`;
      } else if (/알았어요$|알게됐어요$|알게 됐어요$|알았죠$/.test(trimmed)) {
        padded = `${trimmed}, 그제야 알았어요.`;
      } else {
        // 일반 단문: 뒤에 ", 그땐 몰랐었죠." 추가
        padded = `${trimmed}, 그땐 몰랐었죠.`;
      }

      const paddedLen = padded.replace(/\s/g, "").length;
      if (paddedLen >= narrationWarning && padded !== orig) {
        warnings.push({
          severity: "fixed",
          sceneNumber,
          message: `narration 자동 패딩(${narrationLen}자→${paddedLen}자): "${orig}" → "${padded}"`,
        });
        narration = padded;
      }
    }

    // 패딩 후 재계산
    let narrationLenAfterPad = (narration ?? "").replace(/\s/g, "").length;

    // ── 5-a-lt. living_tips 전용: scene 2~10 narration 자동 보강 ────────────────
    // scene 2~7: 14자 미만이면 직전/다음 scene에서 위치·이유 단어를 추출해 prefix/suffix로 결합
    // scene 8~9: 14자 미만이면 직전 scene 오브젝트를 앞에 결합
    // scene 10: 단순 CTA 단독이면 caption의 핵심 키워드를 narration에 결합
    if (referenceStyle === "living_tips" && narrationLenAfterPad > 0) {
      const captionText = (caption ?? "").trim();
      const origNar = (narration ?? "").trim();

      // ── scene 2~7 중반부 얇은 문장 보강 ──────────────────────────────────────
      // 질문형 약문 우선 처리 → 위치/이유 단어 fallback 순
      if (sceneNumber >= 2 && sceneNumber <= 7 && narrationLenAfterPad < narrationWarning) {
        const prevNar = (plan.scenes[idx - 1]?.narration ?? "").trim();
        const nextNar = (plan.scenes[idx + 1]?.narration ?? "").trim();

        let boosted: string | null = null;

        // ① 질문형 약문 처리: "죠?/나요?/까요?" 패턴 → caption 기반 정보형 변환
        // caption에 구체 오브젝트/행동이 있으면 "caption은/는 origNar의 서술형" 으로 변환
        const QUESTION_ENDING_RE = /(?:죠|나요|을까요|ㄹ까요|까요)[?？]?\s*$/;
        const isQuestionForm = QUESTION_ENDING_RE.test(origNar) && narrationLenAfterPad < narrationWarning;
        if (isQuestionForm) {
          const captionCore = captionText.replace(/[?！!.。]$/, "").trim();
          const captionCoreLen = captionCore.replace(/\s/g, "").length;
          if (captionCoreLen >= 3) {
            // caption에서 조사 끝 오브젝트 추출: "기름때 쌓임" → "기름때"
            const captionNounMatch = captionCore.match(/^([가-힣]{2,})/);
            const captionNoun = captionNounMatch ? captionNounMatch[1] : captionCore;
            // 받침 유무로 "이/가" 선택
            const lastCode = captionNoun.charCodeAt(captionNoun.length - 1);
            const nounJosa = (lastCode - 0xAC00) % 28 !== 0 ? "이" : "가";
            // 핵심 부사/동사 추출: 다음 scene narration에서 방치/방법 단서
            const nextKeyMatch = nextNar.match(/([가-힣]{2,}(?:하면|하지|되면|될수록|될수|않으면))/);
            const candidate = nextKeyMatch
              ? `${captionNoun}은 방치하면 더 닦기 어려워집니다.`
              : `${captionNoun}${nounJosa} 쌓이면 청소가 더 힘들어져요.`;
            const candidateLen = candidate.replace(/\s/g, "").length;
            if (candidateLen >= narrationWarning && candidateLen <= 35) {
              boosted = candidate;
            }
          }
        }

        // ② 위치 단어 prefix (냉장고 보관 주제 전용)
        if (!boosted) {
          const LOCATION_RE = /(?:안쪽\s*칸|문칸|냉동실|냉장실|상온|서늘한\s*곳|그늘진\s*곳|통풍이\s*잘\s*되는)/;
          const locationMatch = prevNar.match(LOCATION_RE) ?? nextNar.match(LOCATION_RE);
          if (locationMatch) {
            const loc = locationMatch[0].trim();
            const candidate = `${loc}은 ${origNar}`;
            const candidateLen = candidate.replace(/\s/g, "").length;
            if (candidateLen >= narrationWarning && candidateLen <= 30) {
              boosted = candidate;
            }
          }
        }

        // ③ 이유 단서 suffix (온도/습기 등)
        if (!boosted) {
          const REASON_RE = /(?:온도\s*변화|온도\s*차이|습기|냄새|세균|에틸렌|산화)/;
          const reasonMatch = nextNar.match(REASON_RE);
          const reasonWord = reasonMatch ? reasonMatch[0].trim() : null;
          if (reasonWord) {
            const candidate = `${origNar.replace(/[.。]$/, "")}, ${reasonWord}가 심해요.`;
            const candidateLen = candidate.replace(/\s/g, "").length;
            if (candidateLen >= narrationWarning && candidateLen <= 30) {
              boosted = candidate;
            }
          }
        }

        if (boosted) {
          const boostedLen = boosted.replace(/\s/g, "").length;
          warnings.push({
            severity: "fixed",
            sceneNumber,
            message: `living_tips narration 보강(${narrationLenAfterPad}자→${boostedLen}자): "${origNar}" → "${boosted}"`,
          });
          narration = boosted;
          narrationLenAfterPad = boostedLen;
        }
      }

      // scene 8~9 얇은 문장 보강
      if ((sceneNumber === 8 || sceneNumber === 9) && narrationLenAfterPad < narrationWarning) {
        // caption이 3자 이상이고 narration과 내용이 겹치지 않으면 결합
        const captionLen = captionText.replace(/\s/g, "").length;
        if (captionLen >= 3 && !origNar.includes(captionText.replace(/[!.。]$/, ""))) {
          const prevNar = (plan.scenes[idx - 1]?.narration ?? "").trim();
          // 냉장고 보관 소주제 여부: subTopicId 또는 직전/현재 나레이션 키워드로 판단
          const FOOD_STORAGE_CONTEXT_RE = /냉장고|냉동|냉장실|냉동실|보관|신선도|에틸렌|산화|산패/;
          const ltSubTopicId: string = plan._meta?.subTopicId ?? plan._subTopicId ?? "";
          const isFoodStorageContext =
            ltSubTopicId.includes("food-storage") ||
            ltSubTopicId.includes("fridge") ||
            FOOD_STORAGE_CONTEXT_RE.test(prevNar) ||
            FOOD_STORAGE_CONTEXT_RE.test(origNar);

          let boosted: string | null = null;

          if (isFoodStorageContext) {
            // 음식 보관 맥락: 직전 명사 + "을/를 함께 두면" 패턴
            const objectMatch = prevNar.match(/([가-힣]{2,})(?:와|과|은|는|이|가|을|를|에서|으로)/);
            if (objectMatch) {
              const hasJongseong =
                (objectMatch[1].charCodeAt(objectMatch[1].length - 1) - 0xAC00) % 28 !== 0;
              const josa = hasJongseong ? "을" : "를";
              const candidate = `${objectMatch[1]}${josa} 함께 두면 ${origNar}`;
              const candidateLen = candidate.replace(/\s/g, "").length;
              if (candidateLen >= narrationWarning && candidateLen <= 30) boosted = candidate;
            }
          } else {
            // 비음식 맥락(세탁·의류·청소 등): caption 첫 한글 단어 + "은/는 {origNar}" 패턴
            const captionCore = captionText.replace(/[!.。]$/, "").trim();
            // 공백 없는 한글 연속 첫 단어 추출 (e.g. "삭 줄이기" → "삭", "손세탁이" → "손세탁이")
            const captionNounMatch = captionCore.match(/^([가-힣]+)/);
            // 첫 단어가 2자 이상인 단일 단어(공백 없음)일 때만 topic 활용, 아니면 fallback
            const captionFirstWord = captionNounMatch?.[1] ?? "";
            if (captionFirstWord.length >= 2 && !captionCore.includes(" ")) {
              const lastCode = captionFirstWord.charCodeAt(captionFirstWord.length - 1);
              const hasJong = (lastCode - 0xAC00) % 28 !== 0;
              const topic = hasJong ? `${captionFirstWord}은` : `${captionFirstWord}는`;
              const candidate = `${topic} ${origNar}`;
              const candidateLen = candidate.replace(/\s/g, "").length;
              if (candidateLen >= narrationWarning && candidateLen <= 30) boosted = candidate;
            }
            // fallback: "이 방법으로 {origNar}" 패턴
            if (!boosted) {
              const candidate = `이 방법으로 ${origNar}`;
              const candidateLen = candidate.replace(/\s/g, "").length;
              if (candidateLen >= narrationWarning && candidateLen <= 30) boosted = candidate;
            }
          }

          if (boosted) {
            const boostedLen = boosted.replace(/\s/g, "").length;
            warnings.push({
              severity: "fixed",
              sceneNumber,
              message: `living_tips narration 보강(${narrationLenAfterPad}자→${boostedLen}자): "${origNar}" → "${boosted}"`,
            });
            narration = boosted;
            narrationLenAfterPad = boostedLen;
          }
        }
      }

      // scene 10 CTA 단독 보강: caption 또는 scene 6~9 요약으로 핵심 정보 결합
      if (sceneNumber === total) {
        const THIN_CTA_RE =
          /^(?:저장해\s*두(?:세요|면\s*유용해요|면\s*좋아요|고\s*보세요)|공유해\s*주세요|팔로우해\s*주세요|이\s*방법을\s*기억하세요|기억해\s*두세요)[!.。]?\s*$/;
        const CTA_SUMMARY_RE = /보관|냉장|상온|신선|방법|팁|활용|절약|씻|감싸|놓아|관리|오래가|오래\s*가/;
        const isThinCta =
          THIN_CTA_RE.test(origNar) ||
          (!CTA_SUMMARY_RE.test(origNar) && narrationLenAfterPad < 14);

        if (isThinCta) {
          // caption 추상 판정: "유용한 팁", "꿀팁", "저장" 처럼 핵심 정보가 없는 경우
          const ABSTRACT_CAPTION_RE = /^(?:유용한?\s*팁|꿀팁|저장|공유|팔로우|기억|정보|방법|팁)[!.。]?\s*$/;
          const captionIsAbstract =
            ABSTRACT_CAPTION_RE.test(captionText) ||
            captionText.replace(/\s/g, "").length < 5;

          let boosted: string | null = null;

          if (!captionIsAbstract) {
            // caption에 구체 정보가 있으면 기존 방식: "caption 두세요, 저장해두면 유용해요."
            const captionCore = captionText.replace(/[!.。]$/, "").trim();
            const candidate = `${captionCore} 두세요, 저장해두면 유용해요.`;
            const candidateLen = candidate.replace(/\s/g, "").length;
            if (candidateLen >= 14 && candidateLen <= 35) boosted = candidate;
          }

          if (!boosted) {
            // caption이 추상적이면 scene 6~9 narration에서 핵심 재료(도구+동작) 추출
            // 우선순위: 수치/재료 단서(scene 6 이전) → 결과 단서(scene 8~9)
            const lateSummaryNars = plan.scenes.slice(5, 9)  // scene 6~9 (idx 5~8)
              .map((s: ReelV2Scene) => (s.narration ?? "").trim())
              .filter((n: string) => n.length > 0);

            // 재료/수치 단어 추출: "식초", "베이킹소다", "5분", "1:1" 등
            const INGREDIENT_RE = /(?:식초|베이킹소다|소금|레몬|알코올|세제|[0-9]+분|[0-9]+:[0-9]+|[0-9]+배)/;
            // 핵심 오브젝트: "기름때", "냄새", "찌든 때" 등
            const OBJECT_RE = /(?:기름때|찌든\s*때|냄새|녹|얼룩|물때|세균)/;

            let ingredientWord: string | null = null;
            let objectWord: string | null = null;
            for (const n of lateSummaryNars) {
              if (!ingredientWord) {
                const m = n.match(INGREDIENT_RE);
                if (m) ingredientWord = m[0];
              }
              if (!objectWord) {
                const m = n.match(OBJECT_RE);
                if (m) objectWord = m[0];
              }
            }

            if (ingredientWord && objectWord) {
              const candidate = `${objectWord}엔 ${ingredientWord}이 효과적이에요, 저장해두면 유용해요.`;
              const candidateLen = candidate.replace(/\s/g, "").length;
              if (candidateLen >= 14 && candidateLen <= 40) boosted = candidate;
            } else if (ingredientWord) {
              const candidate = `${ingredientWord} 방법, 저장해두면 유용해요.`;
              const candidateLen = candidate.replace(/\s/g, "").length;
              if (candidateLen >= 14 && candidateLen <= 35) boosted = candidate;
            } else if (objectWord) {
              const candidate = `${objectWord} 제거엔 이 방법을 기억하세요.`;
              const candidateLen = candidate.replace(/\s/g, "").length;
              if (candidateLen >= 14 && candidateLen <= 35) boosted = candidate;
            }
          }

          if (boosted) {
            const boostedLen = boosted.replace(/\s/g, "").length;
            warnings.push({
              severity: "fixed",
              sceneNumber,
              message: `living_tips CTA 보강(${narrationLenAfterPad}자→${boostedLen}자): "${origNar}" → "${boosted}"`,
            });
            narration = boosted;
            narrationLenAfterPad = boostedLen;
          }
        }
      }
    }

    if (narrationLenAfterPad > 0 && narrationLenAfterPad < narrationWarning) {
      warnings.push({
        severity: "warning",
        sceneNumber,
        message: `narration 짧음(${narrationLenAfterPad}자) — TTS 리듬 저하 가능 (최소 ${narrationWarning}자, 목표 ${narrationTarget}자)`,
      });
    } else if (
      referenceStyle === "emotional_story" &&
      narrationLenAfterPad > 0 &&
      narrationLenAfterPad < narrationTarget &&
      sceneNumber !== total
    ) {
      warnings.push({
        severity: "info",
        sceneNumber,
        message: `narration 목표보다 짧음(${narrationLenAfterPad}자) — 목표 ${narrationTarget}자`,
      });
    }

    // ── 5-b. emotional_story 한국어 자연스러움 검사 ────────────────────────────
    if (referenceStyle === "emotional_story") {
      const narText = narration ?? "";

      // (a) 번역체 도치: 동사 뒤에 장소/시간 부사구 ("했었어요, 서랍 속에서")
      const invertedOrder = /(?:했어요|했었어요|있었어요|없었어요|몰랐어요|봤어요|됐어요|셨어요|셨죠|었죠|였죠)[^\n]*[,，]\s*[^ ]+\s*(?:속에서|안에서|위에서|앞에서|뒤에서|곁에서|밖에서|쪽에서)/.test(narText);
      if (invertedOrder) {
        warnings.push({
          severity: "warning",
          sceneNumber,
          message: `한국어 어순 어색 — 동사 뒤 장소구 도치 ("${narText.slice(0, 30)}…")`,
        });
      }

      // (b) 조사 누락: 명사 바로 뒤에 동사가 오는 경우 (은/는/이/가/을/를 없음)
      // 패턴: "아버지 기다렸" "엄마 모르셨" — 주요 체언 + 공백 + 용언 어간
      const missingParticle = /(?:아버지|어머니|엄마|아빠|남편|아내|이웃|할머니|할아버지|딸|아들)\s+(?:기다렸|모르셨|몰랐|버리셨|남기셨|주셨|하셨|보셨|오셨|가셨)/.test(narText);
      if (missingParticle) {
        warnings.push({
          severity: "warning",
          sceneNumber,
          message: `한국어 조사 누락 가능 — 주어/목적어에 조사 없음 ("${narText.slice(0, 30)}…")`,
        });
      }

      // (c) 과거형 남발: "했었어요" 또는 "였었죠"가 포함된 씬 개수는 plan-level에서 집계
      // 씬별로는 info만 — plan-level summary에서 2회 초과 시 warning으로 올림
      if (/했었어요|였었죠|됐었어요|셨었죠/.test(narText)) {
        warnings.push({
          severity: "info",
          sceneNumber,
          message: `과거형 "했었어요/였었죠" 사용 — 전체 12씬 중 2회 이하 권장`,
        });
      }

      // (d) caption 감정형 수식어 금지 ("훈훈한", "따뜻한", "그리운" + 명사 형태)
      const EMOTIONAL_ADJECTIVES = /^(훈훈한|따뜻한|그리운|슬픈|외로운|아픈|감동적인|뭉클한|애틋한)/;
      if (EMOTIONAL_ADJECTIVES.test(captionNorm)) {
        warnings.push({
          severity: "warning",
          sceneNumber,
          message: `caption 감정형 수식어 금지 ("${caption}") — 구체 명사만 사용 권장 (예: "낡은 운동화")`,
        });
      }

      // (e-0) 반전 씬(scene 7~9) narration 추상어만 있고 구체 단서 없는 경우 감지
      // 10씬 구조 기준: scene 7(반전 단서), scene 8(반전/발견), scene 9(감정 정리)
      // 12씬 구조 기준: scene 8~11도 반전 구간
      const isTwistRange = total >= 9 && sceneNumber >= 7 && sceneNumber <= Math.min(9, total - 1);
      if (isTwistRange) {
        // 구체 단서 키워드: 날짜/장소/약속/이름/사실/행동 등
        const CONCRETE_CLUE_RE = /날짜|장소|약속|이름|뒷면|처음|마지막으로|마지막\s*사진|태어난|숨긴|숨겨|비밀이\s*있|사실은|알고\s*보니|알고보니|알게\s*됐|알게됐|실은|알았어요[^.]*(?:사진|지갑|메모|노트|쪽지|열쇠|의자|도시락)|(?:사진|메모|노트|쪽지)[^.]*날|처음\s*만난|기다리던\s*날|한\s*번도\s*말하지|한번도\s*말하지|병원에서|함께\s*찍은/;
        // 추상어만으로 끝나는 반전 패턴 (구체 단서 없음)
        const ABSTRACT_TWIST_RE = /(?:비밀[이은]?\s*(?:곧|다가왔|전해졌|알려졌)|비밀[^.]{0,10}(?:다가왔|전해졌|알려졌)|마음[을이]?\s*(?:알았|담았|느꼈|깨달았)|사랑[이을]?\s*(?:담겨|알게|느꼈|전해|담았)|기억[이을]?\s*(?:떠올랐|났어요|담겨)|마음이\s*(?:뭉클|따뜻|아팠|전해)|함께\s*찍었음을\s*알게\s*되었어요|그제야\s*(?:마음|이해|알았)|함께했던\s*시간이\s*(?:떠올랐|기억났|생각났)|인물과\s*함께했던\s*시간)/;
        if (ABSTRACT_TWIST_RE.test(narText) && !CONCRETE_CLUE_RE.test(narText)) {
          warnings.push({
            severity: "warning",
            sceneNumber,
            message: `반전 추상 — scene ${sceneNumber} 반전이 추상어만 있고 구체 단서 없음 ("${narText.slice(0, 35)}…"). 날짜·장소·약속·이름·사진 뒷면 등 구체 단서 추가 권장`,
          });
        }
      }

      // (e-1) scene 9 현재행동 단독 금지 (10씬 구조 한정)
      // scene 9 = 반전을 들은 화자의 "깨달음/감정 해석" — 현재 지속 행동("지금도/넣고 다녀요")은 scene 10 역할
      if (referenceStyle === "emotional_story" && total === 10 && sceneNumber === 9) {
        const SCENE9_CURRENT_ACTION_RE =
          /(?:지금도|아직도|여전히|넣고\s*다녀요|간직하고\s*있어요|품고\s*다녀요|지니고\s*다녀요|꺼내\s*보고\s*있어요|들고\s*다녀요)/;
        if (SCENE9_CURRENT_ACTION_RE.test(narText)) {
          warnings.push({
            severity: "warning",
            sceneNumber,
            message: `scene 9 현재행동 금지 — scene 9는 "깨달음/감정 해석"만 허용. 현재 지속 행동("지금도/넣고 다녀요" 등)은 scene 10 closing line으로 이동 권장. ("${narText.slice(0, 35)}…")`,
          });
        }

        // scene 9에 closing formula(scene 10 역할)가 침범한 경우 감지
        // QA-23 사례: scene 9 = "그 사진은 오래된 종이가 아니라, 아버지가 남긴 마음이었어요." → scene 10 역할 침범
        const SCENE9_CLOSING_FORMULA_RE =
          /(?:낡은\s*물건이\s*아니라|오래된\s*(?:종이|물건|사진)가?\s*아니라|남긴\s*마음이었어요|남긴\s*사랑이었어요|평생의\s*마음을\s*남겨)/;
        if (SCENE9_CLOSING_FORMULA_RE.test(narText)) {
          warnings.push({
            severity: "warning",
            sceneNumber,
            message: `scene 9 closing formula 침범 — scene 9는 감정 반응/해석만 허용. "낡은 물건이 아니라…/남긴 마음이었어요" 류 closing formula는 scene 10 전용. ("${narText.slice(0, 45)}…")`,
          });
        }
      }

      // (e-1b) scene 8 깨달음/해석 문장 금지 (10씬 구조 한정)
      // scene 8 = 구체적 반전 사실 1문장 (character_pulse) — "그제야 알..." 류 깨달음은 scene 9 역할
      // QA-23 사례: scene 8 = "그제야 알 것 같았어요, 아버지가 왜 그 사진을 꺼내 보셨는지." → 구체 반전 없음
      if (referenceStyle === "emotional_story" && total === 10 && sceneNumber === 8) {
        const SCENE8_REALIZATION_RE =
          /(?:그제야\s*알|이제야\s*알|처음으로\s*알|알\s*것\s*같았어요|알게\s*됐어요|이해가\s*됐어요|알\s*것\s*같아요|깨달았어요|이해됐어요|왜\s*.{0,20}(?:보셨는지|하셨는지|그러셨는지))/;
        if (SCENE8_REALIZATION_RE.test(narText)) {
          warnings.push({
            severity: "warning",
            sceneNumber,
            message: `scene 8 깨달음 금지 — scene 8(character_pulse)은 구체적 반전 사실 1문장이어야 함. "그제야 알…/이제야 알…" 류 깨달음은 scene 9 역할. scene 8은 날짜·이름·메모·사실 등 구체 정보를 포함해야 함. ("${narText.slice(0, 45)}…")`,
          });
        }
      }

      // (e-1c) scene 8 반전 감정 밀도 부족 — 16자 미만 단문 (10씬 구조 한정)
      // QA-24 사례: "그 날짜는, 나의 생일이었어요." (14자) → 구체 반전이나 감정 밀도 부족
      // scene 8은 18자 이상의 감정 있는 구체 반전 문장이어야 함
      if (referenceStyle === "emotional_story" && total === 10 && sceneNumber === 8) {
        const narLen = narText.replace(/\s/g, "").length;
        if (narLen > 0 && narLen < 16) {
          warnings.push({
            severity: "warning",
            sceneNumber,
            message: `scene 8 반전 밀도 부족 — scene 8(character_pulse) narration이 ${narLen}자로 너무 짧음. 18자 이상의 구체 반전 사실 문장 권장. 예: "사진 뒤 작은 날짜가, 내 생일과 같았어요." ("${narText.slice(0, 35)}…")`,
          });
        }
      }

      // (e-1d) scene 7/8 imagePrompt — 날짜/뒷면 단서 시각화 부족
      // narration에 날짜/뒷면/메모/생일이 언급됐는데 imagePrompt에 시각적 단서가 없으면 info
      if (referenceStyle === "emotional_story" && total === 10 && (sceneNumber === 7 || sceneNumber === 8)) {
        const narHasDateClue = /날짜|뒷면|메모|생일|적혀|기록|쪽지|이름이\s*적|날이\s*적/.test(narText);
        if (narHasDateClue) {
          const imgLower = (imagePrompt ?? "").toLowerCase();
          // 시각적 단서: 사진 뒷면 / 흐릿한 흔적 / 손끝 포인팅 / 동그라미
          const HAS_DATE_VISUAL = /back of (the |a |old |faded )?photo|plain back|blurred (marks?|trace|indistinct)|fingertip|finger.*point|circled|faded date|soft mark|indistinct mark/.test(imgLower);
          if (!HAS_DATE_VISUAL) {
            warnings.push({
              severity: "info",
              sceneNumber,
              message: `scene ${sceneNumber} imagePrompt 날짜 단서 미반영 — narration에 날짜/뒷면/메모 단서가 있으나 imagePrompt에 "back of photo/blurred marks/fingertip" 등 시각 단서 없음. ("${narText.slice(0, 35)}…")`,
            });
          }
        }
      }

      // (e) 마지막 씬 narration 결말 흐림 감지 (씬 12 = 여운 씬)
      if (sceneNumber === total) {
        // 구체적 오브젝트/행동 없이 감정 설명만 있는 결말 패턴
        const VAGUE_ENDING = /(?:마음을\s*알았어요|의미가\s*남았어요|추억이\s*떠올라요|생각이\s*났어요|느낌이\s*들었어요|기억이\s*났어요|마음이\s*뭉클|눈물이\s*났어요|그제야\s*알았어요|무언가를?\s*깨달았어요|마음이\s*따뜻|마음이\s*아팠어요)/;
        if (VAGUE_ENDING.test(narText)) {
          warnings.push({
            severity: "warning",
            sceneNumber,
            message: `결말 흐림 — 감정 설명만 있고 구체적 오브젝트/사실 없음 ("${narText.slice(0, 35)}…"). 중심 오브젝트와 구체적 행동/사실로 마무리 권장`,
          });
        }

        // (e-closing) scene 10 generic closing 감지 — "사랑이었어요/마음이었어요" 단독 결말
        // QA-24 사례: "아버지가 남긴 사랑이었어요." → 너무 일반적, 구체 연결 없음
        if (referenceStyle === "emotional_story" && total === 10) {
          const GENERIC_CLOSING_RE = /(?:남긴\s*(?:사랑|마음|추억|그리움)이었어요\s*$|남긴\s*(?:사랑|마음|추억)이었습니다\s*$)/;
          // 구체 연결어 없이 단독으로 끝나는 경우만 감지 (오브젝트 + 구체 감정 조합이면 통과)
          // "끝까지 붙잡고 있던 나였어요" 같은 구체형은 통과
          const HAS_CONCRETE_ANCHOR = /끝까지|매일\s*꺼내|하루도|손에서\s*놓지|평생/.test(narText);
          if (GENERIC_CLOSING_RE.test(narText) && !HAS_CONCRETE_ANCHOR) {
            warnings.push({
              severity: "info",
              sceneNumber,
              message: `scene 10 generic closing — "남긴 사랑/마음이었어요" 단독 결말은 여운이 약함. 구체 연결: "끝까지 붙잡고 있던 나였어요" / "매일 꺼내 본 나였어요" 등 권장. ("${narText.slice(0, 45)}…")`,
            });
          }
        }
      }

      // (e-2) scene 10 현재행동 반복 closing 감지 — hard gate
      // 10씬 emotional_story 전용: scene 10 closing line은 "여운/의미 해석" 이어야 함.
      // "지금도 지갑에 넣고 다녀요" 류 현재 지속 행동만 있는 경우 → 자동 교체(fixed).
      // QA-23 실패 사례: "그 사진을, 나는 지금도 지갑 안에 넣고 다녀요." → pass 100 통과
      if (referenceStyle === "emotional_story" && total === 10 && sceneNumber === 10) {
        const CLOSING_ACTION_RE =
          /(?:지금도|아직도|여전히).*(?:지갑\s*안에?\s*넣고|넣고\s*다녀요|간직하고\s*있어요|품고\s*다녀요|지니고\s*다녀요|보관하고\s*있어요|들고\s*다녀요)|(?:넣고\s*다녀요|간직하고\s*있어요|지갑\s*안에?\s*넣고)/;

        if (CLOSING_ACTION_RE.test(narText)) {
          // seedTopic에서 오브젝트 추출해 여운 문장 생성
          const seedObjs = _seedObjects(storySeedTopic);
          const coreObj = seedObjs[0] ?? "그 사진";

          // seedTopic에서 관계자 추출 (아버지/엄마/할머니 등)
          const RELATION_RE = /아버지|아빠|엄마|어머니|할머니|할아버지|부모|남편|아내/;
          const relationMatch = (storySeedTopic ?? "").match(RELATION_RE);
          const relation = relationMatch ? relationMatch[0] : "그분";

          // 한국어 조사 선택: 마지막 글자 받침 유무로 "이/가" 결정
          // 받침 있으면 "이" (남편이), 받침 없으면 "가" (아버지가, 엄마가, 할머니가)
          const lastChar = relation.charCodeAt(relation.length - 1);
          const hasFinalConsonant = (lastChar - 0xAC00) % 28 !== 0;
          const subjectParticle = hasFinalConsonant ? "이" : "가";

          // 여운 있는 closing line 두 후보 — seedTopic 있으면 구체화, 없으면 범용
          const closingLine = storySeedTopic
            ? `${coreObj}은 낡은 물건이 아니라, ${relation}${subjectParticle} 남긴 마음이었어요.`
            : "그 사진은 오래된 종이가 아니라, 아버지가 남긴 마음이었어요.";

          // narration을 직접 교체
          scene.narration = closingLine;
          narration = closingLine;

          warnings.push({
            severity: "fixed",
            sceneNumber,
            message: `scene 10 현재행동 반복 closing 자동 교체 — "지금도/지갑에 넣고 다녀요" 류 현재행동은 여운 문장으로 대체됨. 원문: "${narText.slice(0, 45)}…" → 교체: "${closingLine}"`,
          });
        }
      }
    }

    // ── 6. imagePrompt 글자/얼굴 생성 위험어 보정 (severity: info — 빈번하므로 노이즈 낮춤) ──
    const sanitizedImage = sanitizeImagePromptForGeneration(imagePrompt ?? "");
    if (sanitizedImage.changed) {
      warnings.push({
        severity: "info",
        sceneNumber,
        message: "imagePrompt 글자 생성 위험 표현 자동 보정",
      });
      imagePrompt = sanitizedImage.prompt;
    }

    // ── 6-b. imagePrompt ↔ narration 핵심 명사 불일치 감지 (emotional_story 한정) ──
    // narration에서 중심 오브젝트 명사를 추출해 imagePrompt에 등장하는지 확인.
    // 완전 불일치면 info 경고 (GPT 판단 여지 있으므로 warning이 아닌 info).
    const narTextForMatch = narration ?? "";
    if (referenceStyle === "emotional_story" && narTextForMatch && imagePrompt) {
      // 감동사연 빈출 핵심 명사 후보 (한국어 → 영어 매핑 포함)
      const KEY_NOUN_PAIRS: Array<[RegExp, string[]]> = [
        [/사진/, ["photo", "picture", "photograph", "wallet"]],
        [/지갑/, ["wallet", "pocket"]],
        [/편지|쪽지|메모/, ["letter", "note", "message", "paper"]],
        [/뒷면|뒷장/, ["back", "reverse", "behind"]],
        [/날짜/, ["date", "year", "number"]],
        [/병원/, ["hospital", "medical", "clinic"]],
        [/도시락/, ["lunchbox", "bento", "lunch box"]],
        [/사탕|과자/, ["candy", "snack", "sweet"]],
        [/일기/, ["diary", "journal"]],
        [/반지/, ["ring"]],
        [/목걸이/, ["necklace"]],
        [/꽃/, ["flower", "bouquet", "bloom"]],
        [/열쇠/, ["key"]],
        [/노트|공책/, ["notebook", "journal"]],
        [/의자/, ["chair", "seat"]],
        [/창문|창가/, ["window"]],
        [/계단/, ["stairs", "steps"]],
        [/손/, ["hand", "hands", "palm"]],
        [/눈물/, ["tear", "tears", "crying"]],
        [/엄마|어머니/, ["mother", "mom", "woman", "elderly woman"]],
        [/아버지|아빠/, ["father", "dad", "man", "elderly man"]],
      ];

      const imgLower = (imagePrompt ?? "").toLowerCase();
      let matchedAny = false;

      for (const [narRe, imgKeywords] of KEY_NOUN_PAIRS) {
        if (narRe.test(narTextForMatch)) {
          // narration에 이 명사가 등장 — imagePrompt에 해당 영단어 있는지 확인
          if (imgKeywords.some((kw) => imgLower.includes(kw))) {
            matchedAny = true;
            break;
          }
        }
      }

      // narration에 핵심 명사가 하나도 없는 경우(순수 감정묘사)는 체크 대상 아님
      const narHasKeyNoun = KEY_NOUN_PAIRS.some(([narRe]) => narRe.test(narTextForMatch));

      if (narHasKeyNoun && !matchedAny) {
        // QA-26: scene 7~8은 구체 반전 시각화 필수 → warning으로 격상
        const mismatchSeverity: "warning" | "info" =
          (sceneNumber === 7 || sceneNumber === 8) ? "warning" : "info";
        warnings.push({
          severity: mismatchSeverity,
          sceneNumber,
          message: `imagePrompt-narration 명사 불일치 가능성 — narration의 핵심 오브젝트가 imagePrompt에 반영되지 않았을 수 있습니다. narration: "${narTextForMatch.slice(0, 40)}…" / imagePrompt: "${(imagePrompt ?? "").slice(0, 40)}…"`,
        });
      }
    }

    // ── 6-c. emotional_story scene 4~10 imagePrompt scene-role visual cue 자동 보강 ──
    // narration 핵심 명사가 imagePrompt에 없을 때, scene role에 맞는 시각 단서를 prefix 삽입
    if (referenceStyle === "emotional_story" && sceneNumber >= 4 && sceneNumber <= 10 && imagePrompt) {
      const imgL = imagePrompt.toLowerCase();
      const narT = narration ?? "";

      // scene별 role cue 정의 (narration 핵심어 → 삽입할 영문 prefix)
      const SCENE_ROLE_PATCHES: Array<{
        scene: number;
        narRe: RegExp;
        missingImgRe: RegExp;
        patch: string;
      }> = [
        // scene 4: 지갑 속 사진을 매일 꺼내 본 이유 — 지갑+사진 필수
        { scene: 4, narRe: /사진|지갑/, missingImgRe: /photo|wallet/, patch: "worn leather wallet with old photo peeking out, " },
        // scene 5: 사진 모서리/희미한 흔적
        { scene: 5, narRe: /모서리|희미|지워|닳|흔적/, missingImgRe: /corner|fade|worn|blur|edge/, patch: "close-up of faded worn photo corner, soft blurred edges, " },
        // scene 6: 아버지 손/지갑에서 꺼내는 사진
        { scene: 6, narRe: /꺼내|보셨|손/, missingImgRe: /hand|pull|wallet|pocket/, patch: "adult hands gently pulling old photo from wallet, " },
        // scene 7: 사진 속 어린 자녀/부자
        { scene: 7, narRe: /사진\s*속|어릴\s*적|내가\s*있/, missingImgRe: /child|photo|young|baby/, patch: "faded old photo showing a young child, hands holding photo gently, " },
        // scene 8: 사진 뒷면/날짜/메모
        { scene: 8, narRe: /뒷면|날짜|메모|적혀|생일/, missingImgRe: /back|date|mark|fingert|reverse/, patch: "plain back of old photo, soft blurred handwritten marks, fingertips touching the back, " },
        // scene 9: 지갑과 사진 바라보며 감정 이해
        { scene: 9, narRe: /이해|마음|알|느|슬/, missingImgRe: /wallet|photo|table|hand/, patch: "worn leather wallet and old photo on wooden table, soft morning light, " },
        // scene 10: 오래된 사진과 지갑이 남긴 여운
        { scene: 10, narRe: /사진|지갑|아버지|나였어요/, missingImgRe: /wallet|photo|wooden|light/, patch: "worn leather wallet and old photo beside coat on wooden table, warm golden light, " },
      ];

      for (const { scene, narRe, missingImgRe, patch } of SCENE_ROLE_PATCHES) {
        if (scene === sceneNumber && narRe.test(narT) && !missingImgRe.test(imgL)) {
          imagePrompt = patch + imagePrompt;
          warnings.push({
            severity: "fixed",
            sceneNumber,
            message: `scene ${sceneNumber} imagePrompt scene-role visual cue 자동 보강 — narration 핵심어 매칭 시각 단서 prefix 삽입: "${patch.trim()}"`,
          });
          break;
        }
      }
    }

    // ── emotional_story visualAnchorId 강제 보정 ────────────────────────────
    // GPT가 잘못 배정하거나 누락해도 sceneNumber 기준으로 강제 지정
    let visualAnchorId = (scene as ReelV2Scene & { visualAnchorId?: string }).visualAnchorId;
    if (referenceStyle === "emotional_story") {
      // 5-anchor 체계 (QA-21: hand-drawn 스타일 전환 — 씬별 독립 이미지 권장)
      // reuseAnchorImages 기본 false이므로 이 맵은 메타 정보용으로만 사용됨
      const ANCHOR_MAP: Record<number, string> = {
        1: "wallet_photo_anchor", 2: "wallet_photo_anchor", 3: "wallet_photo_anchor",
        4: "photo_back_anchor",   5: "photo_back_anchor",
        6: "memory_table_anchor", 7: "memory_table_anchor",
        8: "hands_closeup_anchor",
        9: "present_wallet_anchor", 10: "present_wallet_anchor",
      };
      const expectedAnchor = ANCHOR_MAP[sceneNumber];
      if (expectedAnchor) {
        if (!visualAnchorId) {
          warnings.push({
            severity: "fixed",
            sceneNumber,
            message: `visualAnchorId 누락 → "${expectedAnchor}" 자동 보정`,
          });
          visualAnchorId = expectedAnchor;
        } else if (visualAnchorId !== expectedAnchor) {
          warnings.push({
            severity: "fixed",
            sceneNumber,
            message: `visualAnchorId 불일치 (GPT: "${visualAnchorId}") → "${expectedAnchor}" 강제 보정`,
          });
          visualAnchorId = expectedAnchor;
        }
      }
    }

    return { ...scene, caption, emphasis, motion, imagePrompt, narration, visualAnchorId };
  });

  // ── 6-b. emotional_story 연속 씬 narration 중복/유사 감지 ─────────────────
  // 씬 루프 후 fixedScenes 전체를 한번 더 순회
  if (referenceStyle === "emotional_story") {
    // 중심 오브젝트 키워드(스토리 전체에서 반복되는 명사)는 비교 전 제거
    // → 같은 소재를 다루는 씬들이 의미 없이 "유사"로 잡히지 않도록
    // 기본 stopword + seedTopic별 핵심어를 동적으로 합산
    const SEED_STOPWORD_MAP: Record<string, string[]> = {
      "전화기":   ["전화기", "전화", "수화기", "메모", "할머니", "할아버지"],
      "냉장고":   ["냉장고", "메모", "쪽지", "엄마", "아버지"],
      "메모":     ["메모", "냉장고", "쪽지"],
      "열쇠":     ["열쇠", "자물쇠", "작업실", "아버지", "집"],
      "병원":     ["병원", "의자", "복도", "아버지", "어머니", "봉투"],
      "의자":     ["의자", "병원", "복도", "봉투"],
      "반찬통":   ["반찬통", "반찬", "이웃", "할머니", "가방", "쪽지"],
      "이웃":     ["이웃", "반찬통", "가방", "쪽지", "할머니"],
      "사진":     ["사진", "액자", "지갑", "아버지", "가족"],
      "지갑":     ["지갑", "사진", "아버지", "가족"],
      "도시락":   ["도시락", "도시락통", "엄마", "반찬", "쪽지"],
      "노트":     ["노트", "서랍", "아버지", "글씨"],
      "쪽지":     ["쪽지", "봉투", "배우자", "메모"],
      "밥그릇":   ["밥그릇", "할머니", "상"],
      "액자":     ["액자", "사진", "가족", "아버지", "어머니"],
    };
    // seedTopic에서 매칭되는 추가 stopword 수집
    const extraStopwords: string[] = [];
    if (storySeedTopic) {
      for (const [key, words] of Object.entries(SEED_STOPWORD_MAP)) {
        if (storySeedTopic.includes(key)) {
          extraStopwords.push(...words);
          break;  // 가장 먼저 매칭된 것만 사용
        }
      }
    }
    // 기본 stopword + 동적 추가 stopword → 정규식 생성
    const BASE_STOPWORDS = "우산|신발|운동화|슬리퍼|구두|열쇠|자물쇠|도시락|도시락통|사진|편지|쪽지|상자|의자|지갑|우편|택배|수건|앞치마|안경|라디오|일기장|반찬통|메모|노트|밥그릇|빈병|자전거|책상|서랍|엄마|어머니|아버지|아빠|할머니|할아버지|배우자|이웃|현관|문앞|문\\s*앞|복도|병원|방|집|가족|전화기|전화|수화기|액자|봉투|작업실|수화기";
    const allStopwords = extraStopwords.length > 0
      ? `${BASE_STOPWORDS}|${[...new Set(extraStopwords)].join("|")}`
      : BASE_STOPWORDS;
    const STORY_OBJECT_RE = new RegExp(allStopwords, "g");

    // ── 어절 기반 Jaccard 유사도 계산 ─────────────────────────────────────────
    // character-level overlapRatio 대비 개선점:
    //   - 어절 단위로 분리 → 조사/어미 변화가 다르면 다른 토큰으로 처리
    //   - stopword 제거 후 실제 서술 내용만 비교
    //   - Jaccard = |intersection| / |union| (set 기반이라 순서 무관)
    //   - 같은 오브젝트/인물 단어가 반복돼도 stopword에 포함되면 무시 → false-positive 감소
    function tokenize(text: string): Set<string> {
      const cleaned = text
        .replace(STORY_OBJECT_RE, " ")        // 중심 오브젝트/인물 제거
        .replace(/[.,!?…。、，,·~"'""''()\[\]]/g, " ")  // 구두점 제거
        .replace(/\s+/g, " ")
        .trim();
      const tokens = cleaned.split(" ").filter((t) => t.length >= 2);  // 1글자 제거
      return new Set(tokens);
    }

    function jaccardSimilarity(a: string, b: string): number {
      const setA = tokenize(a);
      const setB = tokenize(b);
      if (setA.size === 0 || setB.size === 0) return 0;
      let intersect = 0;
      for (const tok of setA) {
        if (setB.has(tok)) intersect++;
      }
      const union = setA.size + setB.size - intersect;
      return union === 0 ? 0 : intersect / union;
    }

    const lastPairIdx = fixedScenes.length - 1; // 마지막 씬 인덱스

    for (let j = 1; j < fixedScenes.length; j++) {
      const prev = fixedScenes[j - 1].narration ?? "";
      const curr = fixedScenes[j].narration ?? "";
      // 완전 동일 (공백 정규화 후)
      const prevNorm = prev.replace(/\s/g, "");
      const currNorm = curr.replace(/\s/g, "");
      if (prevNorm && currNorm && prevNorm === currNorm) {
        warnings.push({
          severity: "warning",
          sceneNumber: j + 1,
          message: `narration 완전 중복 — 씬 ${j}와 씬 ${j + 1}이 동일 ("${curr.slice(0, 25)}…"). 재생성 권장`,
        });
        continue;
      }
      // 어절 기반 Jaccard ≥ 0.72
      const ratio = jaccardSimilarity(prev, curr);
      if (ratio >= 0.72) {
        // 마지막 pair(씬 N-1 ↔ 씬 N)는 전용 메시지로 발행 → hasLastTwoDup 집계에 반영
        if (j === lastPairIdx) {
          warnings.push({
            severity: "warning",
            sceneNumber: j + 1,
            message: `마지막 2씬 유사 반복(${Math.round(ratio * 100)}%) — 여운 씬이 결론 씬을 어절 단위 의미 반복. "깨달음 → 현재 행동"으로 분리 필요. 재생성 권장`,
          });
        } else {
          warnings.push({
            severity: "warning",
            sceneNumber: j + 1,
            message: `narration 어절 유사 반복(${Math.round(ratio * 100)}%) — 씬 ${j}↔씬 ${j + 1} 같은 beat 반복. 재생성 권장`,
          });
        }
      }
    }
    // 마지막 2씬 특별 추가 검사 (0.55~0.72 구간 — Jaccard 미달이지만 행동어 반복)
    if (fixedScenes.length >= 2) {
      const last = fixedScenes[fixedScenes.length - 1].narration ?? "";
      const secondLast = fixedScenes[fixedScenes.length - 2].narration ?? "";
      const lastNorm = last.replace(/\s/g, "");
      const secondLastNorm = secondLast.replace(/\s/g, "");
      if (lastNorm && secondLastNorm && lastNorm !== secondLastNorm) {
        const lastRatio = jaccardSimilarity(last, secondLast);
        // 0.55~0.72 구간: 마지막 씬 전용 경고
        if (lastRatio >= 0.55 && lastRatio < 0.72) {
          warnings.push({
            severity: "warning",
            sceneNumber: fixedScenes.length,
            message: `마지막 2씬 유사 반복(${Math.round(lastRatio * 100)}%) — 여운 씬이 결론 씬을 어절 단위 의미 반복. "깨달음 → 현재 행동"으로 분리 필요. 재생성 권장`,
          });
        }
        // 행동어 직접 중복 검사: "지금도/넣고 다녀요/간직하고 있어요" 등 핵심 행동어가 양쪽에 있으면 중복
        if (lastRatio < 0.72) {
          const ACTION_DUP_RE = /(?:지금도|아직도|여전히|간직하고|넣고\s*다녀요|품고\s*다녀요|지니고\s*다녀요)/;
          if (ACTION_DUP_RE.test(last) && ACTION_DUP_RE.test(secondLast)) {
            warnings.push({
              severity: "warning",
              sceneNumber: fixedScenes.length,
              message: `마지막 2씬 유사 반복 — 양쪽 씬에 동일한 현재 행동어(지금도/넣고 다녀요 등)가 반복됨. scene ${fixedScenes.length - 1}은 "깨달음/감정 해석", scene ${fixedScenes.length}은 "현재 행동/여운"으로 분리 필요. 재생성 권장`,
            });
          }
        }
      }
    }
  }

  // ── 6-b. 마지막 2씬 caption × seedTopic 오브젝트 일관성 체크 ─────────────────
  // seedTopic 핵심 키워드가 마지막 2씬 caption에 하나도 없으면 경고
  if (storySeedTopic && fixedScenes.length >= 2) {
    const topicKeywords = storySeedTopic
      .replace(/[의\s]/g, " ")
      .split(/\s+/)
      .filter((k) => k.length >= 2);

    const lastTwo = fixedScenes.slice(-2);
    const lastTwoCaptions = lastTwo.map((s) => (s.caption ?? "").replace(/\s/g, ""));

    const anyMatch = topicKeywords.some((kw) =>
      lastTwoCaptions.some((c) => c.includes(kw))
    );

    if (!anyMatch) {
      warnings.push({
        severity: "warning",
        sceneNumber: fixedScenes.length,
        message: `마지막 2씬 caption이 seedTopic("${storySeedTopic}")의 핵심 오브젝트를 벗어남 — caption: [${lastTwoCaptions.join(", ")}]. seedTopic 오브젝트로 마무리 권장`,
      });
    }
  }

  // ── 6-c. caption 중복 감지 (동일/유사 caption이 3씬 이상 반복) ───────────────
  if (referenceStyle === "emotional_story") {
    const captionCounts: Record<string, number[]> = {};
    fixedScenes.forEach((s, idx) => {
      const norm = (s.caption ?? "").replace(/\s/g, "");
      if (!norm) return;
      if (!captionCounts[norm]) captionCounts[norm] = [];
      captionCounts[norm].push(idx + 1);
    });
    for (const [cap, scenes] of Object.entries(captionCounts)) {
      if (scenes.length >= 2) {
        warnings.push({
          severity: "warning",
          sceneNumber: scenes[scenes.length - 1],
          message: `caption 중복 — "${cap.slice(0, 10)}" 씬 [${scenes.join(",")}]에서 반복. 각 씬은 고유 caption 필요`,
        });
      }
    }
  }

  // ── 6-d. living_tips scene 8~10 후반 정보 밀도 경고 생성 ─────────────────────
  // scene 8(before/after 효과), scene 9(추가 팁), scene 10(CTA)가
  // 구체 정보 없이 일반 문장으로만 끝나면 "후반 정보 밀도 부족" warning 발행.
  // calcQualityScore에서 이 warning을 집계해 breakdown 점수 및 gate cap에 반영.
  if (referenceStyle === "living_tips" && fixedScenes.length >= 10) {
    // 일반형(generic) 패턴: 정보 없이 "기억하세요 / 유용해요" 류만 있는 경우
    const LIVING_TIPS_GENERIC_LATE_RE =
      /(?:이렇게\s*하면|이\s*방법(?:을|이)|기억하세요|기억해\s*두세요|상하지\s*않아요|신선해요|신선하게\s*유지|오래\s*갑니다|오래\s*가요|유용해요|도움이\s*돼요|도움이\s*됩니다|써보세요|해보세요)\s*[!.。]?\s*$/;

    // scene 8: before/after 효과 — 구체적 수치/오브젝트 없으면 generic 판정
    // scene 9: 추가 팁 — 구체 조건/방법 없으면 generic 판정
    // scene 10은 CTA 특화 검사(별도 regex)
    const lateScenes = [
      { idx: 7, sceneNum: 8 },   // scene 8
      { idx: 8, sceneNum: 9 },   // scene 9
    ];

    for (const { idx, sceneNum } of lateScenes) {
      const nar = (fixedScenes[idx]?.narration ?? "").trim();
      if (!nar) continue;
      const narLen = nar.replace(/\s/g, "").length;

      // 조건 1: narration이 15자 미만 (구체 정보 담기엔 너무 짧음)
      // 조건 2: generic 패턴과 매칭
      const isGeneric = narLen < 15 || LIVING_TIPS_GENERIC_LATE_RE.test(nar);
      if (isGeneric) {
        warnings.push({
          severity: "warning",
          sceneNumber: sceneNum,
          message: `후반 정보 밀도 부족 — scene ${sceneNum} narration이 구체 정보 없이 일반 문장으로만 구성됨 ("${nar.slice(0, 30)}…"). ${sceneNum === 8 ? "before/after 효과 또는 구체 수치(예: '일주일도 신선해요', '3배 더 오래')" : "추가 주의사항 또는 상황별 팁(예: '여름엔 더 서늘한 곳', '뚜껑 없는 용기')"}으로 교체 권장`,
        });
      }
    }

    // scene 10: CTA + 핵심 요약 누락 검사
    // 단순 "저장해두세요 / 팔로우해 주세요" 만 있고 핵심 키워드(오브젝트/행동) 없으면 경고
    const LIVING_TIPS_THIN_CTA_RE =
      /^(?:저장해\s*두(?:세요|면\s*유용해요|면\s*좋아요)|저장해\s*두고\s*보세요|공유해\s*주세요|팔로우해\s*주세요|팔로우하고\s*더\s*보세요|구독해\s*주세요|좋아요\s*눌러\s*주세요)[!.。]?\s*$/;
    // 핵심 내용 요약 키워드: 오브젝트나 행동 동사가 포함된 경우는 pass
    // "두면"은 "저장해두면"의 "두면"과 충돌하므로 제외 — THIN_CTA_RE에서 명시 처리
    const CTA_HAS_SUMMARY_RE = /보관|냉장|상온|신선|방법|팁|활용|절약|씻|감싸|놓아|관리|오래가|오래\s*가/;

    const scene10Nar = (fixedScenes[9]?.narration ?? "").trim();
    if (scene10Nar) {
      const isThinCta =
        LIVING_TIPS_THIN_CTA_RE.test(scene10Nar) ||
        (!CTA_HAS_SUMMARY_RE.test(scene10Nar) && scene10Nar.replace(/\s/g, "").length < 14);

      if (isThinCta) {
        warnings.push({
          severity: "warning",
          sceneNumber: 10,
          message: `CTA 핵심 요약 누락 — scene 10 narration이 단순 CTA 동사만 있고 핵심 팁 요약이 없음 ("${scene10Nar.slice(0, 30)}…"). "저장해두면 [핵심 팁] 나중에 유용해요!" 형태로 교체 권장`,
        });
      }
    }
  }

  // ── 7. 전체 플랜 레벨 summary ──────────────────────────────────────────────
  const fixedCount = warnings.filter((w) => w.severity === "fixed").length;
  const shortNarrationCount = warnings.filter(
    (w) =>
      w.severity === "warning" &&
      (w.message.includes("narration 짧음") || w.message.includes("narration 미완성") || w.message.includes("narration 질문형 약문"))
  ).length;

  // narration 짧음/질문형 약문이 2개 이상이면 plan-level warning 추가
  if (shortNarrationCount >= 2) {
    warnings.unshift({
      severity: "warning",
      sceneNumber: 0,
      message: `narration 약문 ${shortNarrationCount}건 — 짧거나 오브젝트 없는 질문형 narration. 재생성 권장`,
    });
  }

  // 과거형 "했었어요/였었죠" 남발: 2회 초과 시 plan-level warning
  if (referenceStyle === "emotional_story") {
    const overPastCount = warnings.filter(
      (w) => w.severity === "info" && w.message.includes("과거형")
    ).length;
    if (overPastCount > 2) {
      warnings.unshift({
        severity: "warning",
        sceneNumber: 0,
        message: `과거형 남발 ${overPastCount}건 — "했었어요/였었죠" 2건 이하 권장. 재생성 권장`,
      });
    }

    // 한국어 자연스러움 warning 집계 (어순·조사 누락·감정형 caption)
    const koreanQualityCount = warnings.filter(
      (w) =>
        w.severity === "warning" &&
        (w.message.includes("한국어") || w.message.includes("caption 감정형"))
    ).length;
    if (koreanQualityCount >= 2) {
      warnings.unshift({
        severity: "warning",
        sceneNumber: 0,
        message: `한국어 자연스러움 이슈 ${koreanQualityCount}건 — 어순/조사/caption 수정 권장`,
      });
    }

    // narration 중복/유사 반복 집계
    const dupNarrationCount = warnings.filter(
      (w) => w.severity === "warning" && w.message.includes("narration") &&
        (w.message.includes("중복") || w.message.includes("유사 반복"))
    ).length;
    if (dupNarrationCount >= 1) {
      warnings.unshift({
        severity: "warning",
        sceneNumber: 0,
        message: `narration 중복/유사 반복 ${dupNarrationCount}건 — 장면 다양성 저하. 재생성 권장`,
      });
    }

    // caption 구체성 이슈 집계 (직접발화 + 수식어only + 정보량부족)
    const captionConcreteCount = warnings.filter(
      (w) =>
        w.severity === "warning" &&
        (w.message.includes("caption 직접 발화") ||
          w.message.includes("caption 수식어만") ||
          w.message.includes("caption 정보량 부족"))
    ).length;
    if (captionConcreteCount >= 2) {
      warnings.unshift({
        severity: "warning",
        sceneNumber: 0,
        message: `caption 구체성 이슈 ${captionConcreteCount}건 — 직접발화/수식어only/정보부족 caption. 재생성 권장`,
      });
    }

    // 결말 흐림 집계
    const vagueEndingCount = warnings.filter(
      (w) => w.severity === "warning" && w.message.includes("결말 흐림")
    ).length;
    if (vagueEndingCount >= 1) {
      warnings.unshift({
        severity: "warning",
        sceneNumber: 0,
        message: `결말 흐림 감지 — 마지막 씬이 감정 설명만 있음. 오브젝트+구체 사실로 재생성 권장`,
      });
    }
  }

  if (fixedCount > 0) {
    warnings.unshift({
      severity: "info",
      sceneNumber: 0,
      message: `총 ${fixedCount}건 자동 보정 (emphasis/caption/motion)`,
    });
  }

  const finalPlan = { ...plan, scenes: fixedScenes };
  const qualityScore = calcQualityScore(finalPlan, warnings, referenceStyle);
  return { plan: finalPlan, warnings, qualityScore };
}

export async function POST(req: NextRequest) {
  try {
    // ── 유료 API 가드 (OpenAI 콘티 생성) ────────────────────────────────────────
    // POST는 실제 GPT 호출이 발생하므로 body 파싱 전에 차단
    const guard = checkPaidApi("openai-generate", "generate-v2");
    if (!guard.allowed) {
      return NextResponse.json(guard.blockedResponse, { status: 403 });
    }

    const body = await req.json();

    // categoryId가 있으면 reelCategories 프로필에서 파라미터를 자동 로드
    // 개별 파라미터가 있으면 프로필 값을 덮어쓴다.
    let baseParams: {
      categoryName: string;
      targetAudience: string;
      duration: 30 | 45 | 60;
      tone: string;
      referenceStyle: ReferenceStyle;
    } = {
      categoryName: "생활꿀팁",
      targetAudience: "인스타그램과 유튜브 쇼츠를 보는 30~60대 한국 시청자",
      duration: 45,
      tone: "차분하지만 몰입감 있게",
      referenceStyle: "ai_character_tips",
    };

    let cat = body.categoryId ? getReelCategory(body.categoryId) : undefined;
    if (body.categoryId && !cat) {
      return NextResponse.json(
        {
          error: `알 수 없는 categoryId: "${body.categoryId}"`,
          availableIds: REEL_CATEGORIES.map((c) => c.id),
        },
        { status: 400 }
      );
    }
    if (cat) {
      baseParams = { ...baseParams, ...categoryToV2Params(cat) };
    }

    const categoryName: string = body.categoryName ?? baseParams.categoryName;
    const duration: 30 | 45 | 60 = body.duration ?? baseParams.duration;
    const referenceStyle: ReferenceStyle = body.referenceStyle ?? baseParams.referenceStyle;

    // 운영 프리셋 파싱 — 클라이언트에서 직렬화한 AccountPreset 일부
    const accountPreset = body.accountPreset as {
      id?: string;
      name?: string;
      description?: string;
      targetAudience?: string;
      toneMemo?: string;
      bannedTopics?: string[];
      preferredSubTopicIds?: string[];
    } | undefined;

    // accountPreset이 있으면 targetAudience/tone 우선 적용
    const targetAudience: string =
      accountPreset?.targetAudience || body.targetAudience || baseParams.targetAudience;
    const tone: string =
      accountPreset?.toneMemo || body.tone || baseParams.tone;

    // ── 주제 모드 처리 ──────────────────────────────────────────────────────────
    // topicMode: "preset" | "custom" | "random"
    // - "custom": customTopic 직접 입력값 최우선 사용
    // - "preset": categoryId + subTopicId 기반으로 subTopic 정보를 프롬프트에 주입
    // - "random": 기존 랜덤 선택 동작 (테스트 전용)
    // - 미지정 시: customTopic이 있으면 custom, subTopicId가 있으면 preset, 없으면 random
    const topicMode: "preset" | "custom" | "random" =
      body.topicMode ??
      (body.customTopic ? "custom" : body.subTopicId ? "preset" : "random");

    // subTopic 조회
    const subTopic = body.subTopicId && cat?.subTopics
      ? cat.subTopics.find((st: { id: string }) => st.id === body.subTopicId)
      : undefined;

    // concreteTopic 결정
    // 1순위: customTopic (topicMode=custom 또는 직접 입력)
    // 2순위: subTopic seedExamples 중 랜덤 1개 (topicMode=preset)
    // 3순위: undefined (random — storySeedTopic/기존 풀 사용)
    let concreteTopic: string | undefined;
    let variationContext: string | undefined;

    if (topicMode === "custom" && body.customTopic) {
      concreteTopic = String(body.customTopic).trim();
    } else if (topicMode === "preset" && subTopic) {
      // seedExamples 중 랜덤 1개 선택 (같은 소주제 반복 시 변주)
      const examples = subTopic.seedExamples as string[];
      concreteTopic = examples[Math.floor(Math.random() * examples.length)];
      // variationContext: contentAngles + targetSituations 조합으로 소재 고갈 방지
      const angles = subTopic.contentAngles as string[];
      const situations = subTopic.targetSituations as string[];
      const hooks = subTopic.hookTemplates as string[];
      const angle = angles[Math.floor(Math.random() * angles.length)];
      const situation = situations[Math.floor(Math.random() * situations.length)];
      const hook = hooks[Math.floor(Math.random() * hooks.length)];
      variationContext = [
        `Subtopic: "${subTopic.name}" — ${subTopic.description}`,
        `Content angle: "${angle}"`,
        `Target situation: "${situation}"`,
        `Hook style: "${hook}"`,
        `Available seed examples for reference (do NOT copy verbatim): ${examples.join(" / ")}`,
        `Available content angles (pick the one above or a fresh variant): ${angles.join(" / ")}`,
      ].join("\n  ");
    }

    // emotional_story: storySeedTopic 결정
    // - customTopic / subTopic이 있으면 concreteTopic을 storySeedTopic으로도 활용
    // - body.storySeedTopic 직접 지정 시 최우선
    // - 그 외 풀에서 랜덤 선택
    const storySeedTopic: string | undefined =
      referenceStyle === "emotional_story"
        ? (body.storySeedTopic as string | undefined)
          ?? (concreteTopic)          // customTopic / preset 소주제 기반 seedExample
          ?? pickStorySeedTopic()     // 완전 랜덤 (topicMode=random)
        : undefined;

    // emotional_story에서 concreteTopic과 storySeedTopic이 같으면 중복 방지
    // (storySeedTopic이 qualityBar에 주입되므로 concreteTopicBlock과 충돌 방지)
    const effectiveConcreteTopic =
      referenceStyle === "emotional_story" && concreteTopic === storySeedTopic
        ? undefined  // emotional_story는 storySeedTopic이 qualityBar에서 처리
        : concreteTopic;

    const expectedScenes = expectedSceneCount(referenceStyle, duration);
    let bestResult: { plan: GeneratedReelV2; warnings: PlanWarning[]; qualityScore: QualityScore } | null = null;

    // maxAttempts: body 옵션으로 제어 가능 (1~3). QA/비용 제어용.
    // Codex QA에서는 maxAttempts:1 로 호출해 단일 시도 + 진단 결과만 확인.
    const defaultMaxAttempts = referenceStyle === "emotional_story" ? 3 : 2;
    const bodyMaxAttempts = typeof body.maxAttempts === "number"
      ? Math.max(1, Math.min(3, Math.round(body.maxAttempts)))
      : defaultMaxAttempts;
    const maxAttempts = bodyMaxAttempts;

    // emotional_story: 10씬 결과 우선 선택 — 씬 수가 맞는 결과 중 score 최고 우선
    type ResultType = { plan: GeneratedReelV2; warnings: PlanWarning[]; qualityScore: QualityScore };
    let bestSceneCorrectResult: ResultType | null = null;
    const attemptSummaries: AttemptSummary[] = [];
    let attemptsUsed = 0;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      attemptsUsed = attempt;
      const rawPlan = await generateReelV2Plan({
        categoryName,
        targetAudience,
        duration,
        tone,
        referenceStyle,
        storySeedTopic,
        concreteTopic: effectiveConcreteTopic,
        variationContext,
        accountPresetName: accountPreset?.name,
        accountTargetAudience: accountPreset?.targetAudience,
        accountToneMemo: accountPreset?.toneMemo,
        bannedTopics: accountPreset?.bannedTopics,
      });

      const result = sanitizePlan(rawPlan, referenceStyle, storySeedTopic);
      const sceneCountOk = rawPlan.scenes.length === expectedScenes;
      const { qualityScore, warnings: attemptWarnings } = result;

      // 시도별 요약 기록 (진단/비용 분석용)
      attemptSummaries.push({
        attempt,
        score: qualityScore.score,
        grade: qualityScore.grade,
        sceneCount: rawPlan.scenes.length,
        warningCounts: {
          fixed:   attemptWarnings.filter((w) => w.severity === "fixed").length,
          warning: attemptWarnings.filter((w) => w.severity === "warning").length,
          info:    attemptWarnings.filter((w) => w.severity === "info").length,
        },
        failedBreakdownLabels: qualityScore.breakdown
          .filter((b) => b.max > 0 && !b.pass)
          .map((b) => b.label),
        capReasons: qualityScore.capReasons ?? [],
      });

      // 씬 수 정확한 결과 → 별도 추적 (씬 수 불일치 결과보다 항상 우선)
      if (sceneCountOk) {
        if (!bestSceneCorrectResult || qualityScore.score > bestSceneCorrectResult.qualityScore.score) {
          bestSceneCorrectResult = result;
        }
      }

      // 전체 bestResult는 여전히 score 기준 (씬 수 불일치여도 최선을 보존)
      if (!bestResult || qualityScore.score > bestResult.qualityScore.score) {
        bestResult = result;
      }

      const qualityOk =
        referenceStyle !== "emotional_story" || qualityScore.grade === "pass";
      if (sceneCountOk && qualityOk) break;

      console.warn(
        `[generate-v2] 콘티 품질 재시도 ${attempt}/${maxAttempts}: scenes=${rawPlan.scenes.length}/${expectedScenes}, score=${qualityScore.score}, grade=${qualityScore.grade}, capReasons=${(qualityScore.capReasons ?? []).join(" | ")}`
      );
    }

    // 씬 수 정확한 결과가 하나라도 있으면 그 중 최고 score를 최종 결과로 사용
    if (bestSceneCorrectResult) {
      bestResult = bestSceneCorrectResult;
    }

    if (!bestResult) {
      throw new Error("v2 콘티 생성 결과가 없습니다.");
    }

    const { plan, warnings, qualityScore } = bestResult;
    if (referenceStyle === "emotional_story" && qualityScore.grade !== "pass") {
      // 씬 수 불일치 결과만 남은 경우 → 더 명확한 메시지
      const sceneMismatchWarning = warnings.find(
        (w) => w.sceneNumber === 0 && w.message.includes("씬 수 불일치")
      );
      if (!bestSceneCorrectResult && sceneMismatchWarning) {
        warnings.unshift({
          severity: "warning",
          sceneNumber: 0,
          message: `${maxAttempts}회 재시도 후에도 ${expectedScenes}씬 결과를 얻지 못했습니다. 실제 씬 수: ${plan.scenes.length}씬. grade=${qualityScore.grade} — 재생성 필요`,
        });
      } else {
        warnings.unshift({
          severity: "warning",
          sceneNumber: 0,
          message: `자동 재시도 후에도 qualityScore ${qualityScore.score}/${qualityScore.grade} — 콘티 검토 또는 재생성 권장`,
        });
      }
    }
    // _referenceStyle, _storySeedTopic, _concreteTopic, _topicMode, _subTopicId를 plan에 포함
    // render-v2에서 fallback prompt 전략 결정 및 디버깅에 활용
    const meta: ReelV2Meta = {
      categoryId: body.categoryId ?? "",
      categoryName,
      ...(body.subTopicId ? { subTopicId: body.subTopicId as string } : {}),
      ...(subTopic?.name ? { subTopicName: subTopic.name as string } : {}),
      topicMode,
      // emotional_story에서 effectiveConcreteTopic이 undefined여도
      // customTopic/concreteTopic 원본은 _meta에 보존한다 (분석/히스토리 추적용)
      ...(effectiveConcreteTopic
        ? { concreteTopic: effectiveConcreteTopic }
        : concreteTopic
          ? { concreteTopic }   // emotional_story에서 storySeedTopic과 동일해 prompt 생략됐어도 기록
          : {}),
      ...(topicMode === "custom" && body.customTopic
        ? { customTopic: String(body.customTopic).trim() }
        : {}),
      ...(storySeedTopic ? { storySeedTopic } : {}),
      ...(variationContext ? { variationContext } : {}),
      accountPreset: accountPreset
        ? {
            id: accountPreset.id ?? "",
            name: accountPreset.name ?? "",
            description: accountPreset.description ?? "",
            targetAudience: accountPreset.targetAudience ?? "",
            toneMemo: accountPreset.toneMemo ?? "",
            bannedTopics: accountPreset.bannedTopics ?? [],
            preferredSubTopicIds: accountPreset.preferredSubTopicIds ?? [],
          }
        : null,
      generatedAt: new Date().toISOString(),
    };

    const planWithMeta = {
      ...plan,
      _meta: meta,
      // 하위 호환 필드 유지 (render-v2 등에서 참조)
      _referenceStyle: referenceStyle,
      ...(storySeedTopic ? { _storySeedTopic: storySeedTopic } : {}),
      ...(concreteTopic ? { _concreteTopic: concreteTopic } : {}),
      _topicMode: topicMode,
      ...(body.subTopicId ? { _subTopicId: body.subTopicId } : {}),
      ...(body.categoryId ? { _categoryId: body.categoryId } : {}),
    };

    return NextResponse.json({
      success: true,
      plan: planWithMeta,
      warnings,
      qualityScore,
      /** 총 실제 OpenAI 호출 횟수 (비용 파악용) */
      attemptsUsed,
      /** 각 시도별 품질 요약 (실패 원인 진단용) */
      attemptSummaries,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("[/api/generate-v2 오류]:", message, error);
    return NextResponse.json(
      { error: `v2 콘티 생성 오류: ${message}` },
      { status: 500 }
    );
  }
}

// GET: 사용 가능한 카테고리 목록 반환 (subTopics + 유료 API 상태 포함) — 무료
export async function GET() {
  return NextResponse.json({
    categories: REEL_CATEGORIES.map(({ id, name, emoji, description, duration, ttsProvider, openaiVoice, openaiModel, openaiSpeed, openaiInstructions, subTopics }) => ({
      id, name, emoji, description, duration, ttsProvider, openaiVoice, openaiModel, openaiSpeed, openaiInstructions,
      // subTopics: UI 표시용 필드만 노출 (seedExamples/contentAngles/hookTemplates 포함)
      subTopics: subTopics?.map(({ id: stId, name: stName, description: stDesc, seedExamples, contentAngles, targetSituations, hookTemplates }) => ({
        id: stId, name: stName, description: stDesc, seedExamples, contentAngles, targetSituations, hookTemplates,
      })) ?? [],
    })),
    // 유료 API 허용 상태 — UI에서 사전 안내용
    paidApiStatus: getPaidApiStatus(),
    // 현재 콘티 생성 모델 (민감 정보 아님, 운영 확인용)
    planModel: process.env.OPENAI_PLAN_MODEL || "gpt-4o",
  });
}
