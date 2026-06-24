import type { FactCard } from "@/lib/source-facts/types";
import { BLUEPRINT_SCHEMA_VERSION } from "./types";
import type {
  VideoBlueprint,
  VideoBlueprintContentType,
  VideoBlueprintScene,
  VideoBlueprintSceneRole,
  VideoBlueprintTargetDuration,
  VideoBlueprintTemplateKey,
  VideoBlueprintTemplateMode,
} from "./types";

export interface BlueprintGeneratorOptions {
  videoId?: string;
  targetDurationSec?: VideoBlueprintTargetDuration;
  templateMode?: VideoBlueprintTemplateMode;
  ctaEnabled?: boolean;
  /** ISO datetime string. Must be injected from outside for deterministic output. */
  createdAt?: string;
}

function deriveContentType(card: FactCard): VideoBlueprintContentType {
  const name = card.indicatorName.toLowerCase();
  if (name.includes("물가") || name.includes("cpi") || name.includes("인플레")) return "inflation";
  if (name.includes("환율") || name.includes("usd") || name.includes("krw")) return "exchange_rate";
  if (name.includes("금리") || name.includes("기준금리")) return "interest_rate";
  if (name.includes("고용") || name.includes("실업")) return "employment";
  if (name.includes("소비")) return "consumption";
  if (name.includes("영업이익") || name.includes("매출") || name.includes("순이익")) return "earnings_summary";
  if (card.contentCategory === "money_os_money_management") return "salary_management";
  return "economic_indicator";
}

function deriveTemplateKey(contentType: VideoBlueprintContentType): VideoBlueprintTemplateKey {
  if (contentType === "exchange_rate" || contentType === "interest_rate") return "rate_fx_change";
  if (contentType === "disclosure_summary") return "disclosure_summary";
  if (contentType === "earnings_summary") return "earnings_numbers";
  if (
    contentType === "salary_management" ||
    contentType === "spending_control" ||
    contentType === "emergency_fund" ||
    contentType === "investment_separation" ||
    contentType === "money_leak" ||
    contentType === "money_os_solution"
  ) return "money_os_support";
  return "indicator_summary";
}

function unitSuffix(card: FactCard): string {
  return card.unit !== "N/A" ? ` ${card.unit}` : "";
}

function makeScene(
  sceneId: string,
  sceneIndex: number,
  sceneRole: VideoBlueprintSceneRole,
  estimatedStartTime: number,
  estimatedDuration: number,
  narration: string,
  caption: string,
  visualDescription: string,
  audioEmphasis: string,
  factCardId: string | null,
  sourceNote: string | null,
  card: FactCard | null,
): VideoBlueprintScene {
  return {
    sceneId,
    sceneIndex,
    sceneRole,
    estimatedStartTime,
    estimatedDuration,
    actualStartTime: null,
    actualDuration: null,
    narration,
    ttsScript: narration,
    caption,
    visualDescription,
    visualType: sceneRole === "money_os_cta" ? "cta_card" : "number_card",
    imagePrompt: null,
    videoPrompt: null,
    motionType: sceneRole === "money_os_cta" ? "fade_to_cta" : "card_slide",
    captionStyle: "bold_short_center_lower",
    audioEmphasis,
    factCardId,
    sourceName: card?.sourceName ?? null,
    sourceUrl: card?.sourceUrl ?? null,
    publishedDate: card?.publishedDate ?? null,
    dataPeriod: card?.dataPeriod ?? null,
    indicatorName: card?.indicatorName ?? null,
    currentValue: card?.currentValue ?? null,
    previousValue: card?.previousValue ?? null,
    changeRate: card?.changeRate ?? null,
    interpretation: card?.interpretation ?? null,
    cautionNote: card?.cautionNote ?? null,
    sourceNote,
    qaRules: ["caption_max_two_lines", "no_investment_advice", "no_text_inside_generated_image"],
  };
}

/**
 * 15s layout: 3 scenes totalling exactly 15s.
 * Scene durations: s1=3, s2=5, s3=7
 */
function buildScenes15(card: FactCard): VideoBlueprintScene[] {
  const sourceNote = `출처: ${card.sourceName} (${card.dataPeriod})`;
  const u = unitSuffix(card);
  return [
    makeScene("s1", 1, "hook",     0,  3, `${card.indicatorName} 주요 수치를 확인하세요.`, card.indicatorName, "핵심 숫자 카드", "strong_hook", card.id, sourceNote, card),
    makeScene("s2", 2, "reason",   3,  5, `${card.currentValue}${u}. ${card.interpretation}`, `${card.currentValue}${u}`, "현재값 카드", "normal", card.id, sourceNote, card),
    makeScene("s3", 3, "solution", 8,  7, card.allowedClaims[0] ?? `${card.indicatorName} 변화를 맥락과 함께 이해하는 것이 중요합니다.`, "핵심 포인트", "정리 카드", "normal", card.id, sourceNote, card),
  ];
}

/**
 * 30s layout: 4 scenes (no CTA) or 5 scenes (CTA) totalling exactly 30s.
 * No CTA — scene durations: s1=2, s2=6, s3=11, s4=11  (sum=30)
 * With CTA — scene durations: s1=2, s2=6, s3=11, s4=6, s5=5  (sum=30)
 */
function buildScenes30(card: FactCard, ctaEnabled: boolean): VideoBlueprintScene[] {
  const sourceNote = `출처: ${card.sourceName} (${card.dataPeriod})`;
  const u = unitSuffix(card);

  const hookNarration = `${card.indicatorName}이 ${card.dataPeriod} 기준으로 변화가 있었습니다.`;
  const problemNarration = `현재 ${card.indicatorName}은 ${card.currentValue}${u}입니다. 이전 값은 ${card.previousValue}${u}였습니다.`;
  const reasonNarration = card.interpretation;
  const solutionNarration = card.allowedClaims[0] ?? `${card.indicatorName} 변화를 맥락과 함께 이해하는 것이 중요합니다.`;

  if (ctaEnabled) {
    // s1=2, s2=6, s3=11, s4=6, s5=5 → total=30
    return [
      makeScene("s1", 1, "hook",        0,  2, hookNarration,    card.indicatorName,                     `${card.indicatorName} 핵심 숫자 카드`,  "strong_hook", card.id, sourceNote, card),
      makeScene("s2", 2, "problem",     2,  6, problemNarration, `${card.currentValue}${u}`,             "현재값과 이전값 비교 숫자 카드",          "normal",      card.id, sourceNote, card),
      makeScene("s3", 3, "reason",      8, 11, reasonNarration,  card.cautionNote.slice(0, 20),         "데이터 맥락 설명 배경",                  "normal",      card.id, sourceNote, card),
      makeScene("s4", 4, "solution",   19,  6, solutionNarration, card.allowedClaims[0]?.slice(0, 20) ?? "핵심 포인트", "정리 카드",              "normal",      card.id, sourceNote, card),
      makeScene("s5", 5, "money_os_cta", 25, 5, "자세한 내용은 Money-OS에서 확인하세요.", "Money-OS 무료 진단", "Money-OS CTA 카드",               "cta",         null,    null,       null),
    ];
  }

  // s1=2, s2=6, s3=11, s4=11 → total=30
  return [
    makeScene("s1", 1, "hook",     0,  2, hookNarration,    card.indicatorName,                     `${card.indicatorName} 핵심 숫자 카드`,  "strong_hook", card.id, sourceNote, card),
    makeScene("s2", 2, "problem",  2,  6, problemNarration, `${card.currentValue}${u}`,             "현재값과 이전값 비교 숫자 카드",          "normal",      card.id, sourceNote, card),
    makeScene("s3", 3, "reason",   8, 11, reasonNarration,  card.cautionNote.slice(0, 20),         "데이터 맥락 설명 배경",                  "normal",      card.id, sourceNote, card),
    makeScene("s4", 4, "solution", 19, 11, solutionNarration, card.allowedClaims[0]?.slice(0, 20) ?? "핵심 포인트", "정리 카드",              "normal",      card.id, sourceNote, card),
  ];
}

/**
 * 60s layout: 7 scenes (no CTA) or 8 scenes (CTA) totalling exactly 60s.
 * No CTA — durations: s1=3, s2=6, s3=8, s4=9, s5=10, s6=9, s7=15  (sum=60)
 * With CTA — durations: s1=3, s2=6, s3=8, s4=9, s5=10, s6=9, s7=8, s8=7  (sum=60)
 */
function buildScenes60(card: FactCard, ctaEnabled: boolean): VideoBlueprintScene[] {
  const sourceNote = `출처: ${card.sourceName} (${card.dataPeriod})`;
  const u = unitSuffix(card);

  if (ctaEnabled) {
    // s1–s7 end at 53, s8=7s CTA → total=60
    return [
      makeScene("s1", 1, "hook",         0,  3, `${card.indicatorName}에 대해 지금 알아야 할 것이 있습니다.`,                                                         card.indicatorName,                      "핵심 숫자 카드",    "strong_hook", card.id, sourceNote, card),
      makeScene("s2", 2, "context",      3,  6, `${card.dataPeriod} 기준 ${card.indicatorName}은 ${card.currentValue}${u}입니다.`,                                    `${card.currentValue}${u}`,              "현재값 숫자 카드",  "normal",      card.id, sourceNote, card),
      makeScene("s3", 3, "problem",      9,  8, `이전값은 ${card.previousValue}${u}로 변화율은 ${card.changeRate}입니다.`,                                             `변화율 ${card.changeRate}`,             "비교 숫자 카드",    "normal",      card.id, sourceNote, card),
      makeScene("s4", 4, "reason",      17,  9, card.interpretation,                                                                                                   "왜 이런 변화가?",                       "해석 배경 이미지",  "normal",      card.id, sourceNote, card),
      makeScene("s5", 5, "solution",    26, 10, card.allowedClaims[0] ?? `${card.indicatorName} 변화를 맥락과 함께 이해하는 것이 중요합니다.`,                        "핵심 포인트",                           "정리 카드",         "normal",      card.id, sourceNote, card),
      makeScene("s6", 6, "example",     36,  9, card.allowedClaims[1] ?? card.allowedClaims[0] ?? `${card.indicatorName} 변화를 맥락과 함께 이해하는 것이 중요합니다.`, "추가 맥락",                           "예시 카드",         "normal",      card.id, sourceNote, card),
      makeScene("s7", 7, "recap",       45,  8, `${card.indicatorName} ${card.currentValue}${u}. ${card.cautionNote}`,                                                 "핵심 정리",                             "요약 카드",         "normal",      card.id, sourceNote, card),
      makeScene("s8", 8, "money_os_cta", 53, 7, "더 알고 싶다면 Money-OS 무료 진단을 받아보세요.",                                                                    "Money-OS 무료 진단",                    "Money-OS CTA 카드", "cta",         null,    null,       null),
    ];
  }

  // s1–s7, s7 gets the remaining 15s → total=60
  return [
    makeScene("s1", 1, "hook",     0,  3, `${card.indicatorName}에 대해 지금 알아야 할 것이 있습니다.`,                                                         card.indicatorName,                      "핵심 숫자 카드",   "strong_hook", card.id, sourceNote, card),
    makeScene("s2", 2, "context",  3,  6, `${card.dataPeriod} 기준 ${card.indicatorName}은 ${card.currentValue}${u}입니다.`,                                    `${card.currentValue}${u}`,              "현재값 숫자 카드", "normal",      card.id, sourceNote, card),
    makeScene("s3", 3, "problem",  9,  8, `이전값은 ${card.previousValue}${u}로 변화율은 ${card.changeRate}입니다.`,                                             `변화율 ${card.changeRate}`,             "비교 숫자 카드",   "normal",      card.id, sourceNote, card),
    makeScene("s4", 4, "reason",  17,  9, card.interpretation,                                                                                                   "왜 이런 변화가?",                       "해석 배경 이미지", "normal",      card.id, sourceNote, card),
    makeScene("s5", 5, "solution", 26, 10, card.allowedClaims[0] ?? `${card.indicatorName} 변화를 맥락과 함께 이해하는 것이 중요합니다.`,                        "핵심 포인트",                           "정리 카드",        "normal",      card.id, sourceNote, card),
    makeScene("s6", 6, "example",  36,  9, card.allowedClaims[1] ?? card.allowedClaims[0] ?? `${card.indicatorName} 변화를 맥락과 함께 이해하는 것이 중요합니다.`, "추가 맥락",                           "예시 카드",        "normal",      card.id, sourceNote, card),
    makeScene("s7", 7, "recap",   45, 15, `${card.indicatorName} ${card.currentValue}${u}. ${card.cautionNote}`,                                                 "핵심 정리",                             "요약 카드",        "normal",      card.id, sourceNote, card),
  ];
}

/**
 * Creates a deterministic mock VideoBlueprint from a FactCard.
 *
 * - All numeric facts in scenes come exclusively from the FactCard.
 * - No external API or AI is called.
 * - Fact Card id and citation ids are preserved in root fields and per-scene references.
 * - `new Date()` is never called inside this function; pass `options.createdAt` for a timestamp.
 */
export function createBlueprintFromFactCard(
  card: FactCard,
  options: BlueprintGeneratorOptions = {},
): VideoBlueprint {
  const targetDurationSec: VideoBlueprintTargetDuration = options.targetDurationSec ?? 30;
  const templateMode: VideoBlueprintTemplateMode = options.templateMode ?? "data_shorts";
  const ctaEnabled = options.ctaEnabled ?? false;
  const videoId = options.videoId ?? `bp-${card.id}-${targetDurationSec}s`;

  const contentType = deriveContentType(card);
  const templateKey = deriveTemplateKey(contentType);

  const citationIds = card.citations.map((c) => c.id);
  const u = unitSuffix(card);
  const sourceSummary = `${card.sourceName} (${card.dataPeriod}) — ${card.indicatorName} ${card.currentValue}${u}`;

  let scenes: VideoBlueprintScene[];
  if (targetDurationSec === 15) {
    scenes = buildScenes15(card);
  } else if (targetDurationSec === 60) {
    scenes = buildScenes60(card, ctaEnabled);
  } else {
    scenes = buildScenes30(card, ctaEnabled);
  }

  const estimatedDurationSec = scenes.reduce((acc, s) => acc + s.estimatedDuration, 0);

  const blueprint: VideoBlueprint = {
    schemaVersion: BLUEPRINT_SCHEMA_VERSION,
    videoId,
    title: `${card.indicatorName} ${card.dataPeriod} 주요 변화`,
    topic: card.indicatorName,
    targetDurationSec,
    estimatedDurationSec,
    finalDurationSec: null,
    coreMessage: card.interpretation,
    contentType,
    templateMode,
    templateKey,
    factCardIds: [card.id],
    sourceCitationIds: citationIds,
    sourceSummary,
    ctaPolicy: ctaEnabled ? "soft" : "none",
    moneyOsCta: ctaEnabled ? "Money-OS 무료 진단을 받아보세요." : null,
    tone: [
      "balanced_premium_finance",
      "trustworthy",
      "clear",
      "not_meme_like",
      "not_too_heavy",
      "not_ad_like",
    ],
    targetAudience: "beginner",
    riskLevel: "unchecked",
    sourceReferences: card.citations.map((c) => ({
      sourceName: c.sourceName,
      sourceUrl: c.sourceUrl,
      publishedDate: c.publishedDate,
      dataPeriod: c.dataPeriod,
    })),
    voiceProfileId: "money_architect_voice",
    scenes,
  };

  if (options.createdAt !== undefined) {
    blueprint.createdAt = options.createdAt;
  }

  return blueprint;
}
