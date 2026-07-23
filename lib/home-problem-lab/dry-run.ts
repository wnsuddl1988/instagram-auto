import { HOME_PROBLEM_LAB_CONFIG } from "./config";
import { evaluateHomeProblemLabQuality } from "./quality";
import { createHomeProblemLabLumiMockPreflight } from "./tts-provider";
import type {
  HomeProblemLabAxis,
  HomeProblemLabContentDraft,
  HomeProblemLabMetadata,
  HomeProblemLabQualityEvidence,
} from "./types";

export const HOME_PROBLEM_LAB_DRY_RUN_TOPICS = [
  "방향제를 뿌려도 욕실 냄새가 나는 이유",
  "냉장고가 꽉 찼는데 먹을 게 없는 이유",
  "수납함을 샀는데 집이 더 지저분해지는 이유",
  "설거지가 오래 걸리는 집의 동선 문제",
  "식재료를 자꾸 버리는 집의 냉장고 구조",
] as const;

function axisForTopic(topic: string): HomeProblemLabAxis {
  return /냉장고|설거지|식재료/u.test(topic) ? "kitchen_food_time" : "cleaning_odor_storage";
}

function createMetadata(topic: string, axis: HomeProblemLabAxis): HomeProblemLabMetadata {
  const cta = "사기 전에 원인부터. 오늘은 이 한 가지만 바꿔 보세요.";
  const axisTag = axis === "kitchen_food_time" ? "주방정리" : "집안정리";
  return {
    title: `${topic} | 집안문제연구소`,
    description: `살림탐정 루미가 ${topic}의 원인과 0원 해결 순서를 정리합니다. ${cta}`,
    hashtags: ["집안문제연구소", "살림탐정루미", "사기전에원인부터", axisTag],
    cta,
    disclosure: {
      required: false,
      reason: "Phase 2 로컬 mock이며 실제 광고·제휴·협찬·공동구매가 아닙니다.",
      label: "테스트용·게시불가",
      affiliate: false,
      sponsored: false,
      groupPurchase: false,
    },
  };
}

function completeQualityEvidence(): HomeProblemLabQualityEvidence {
  return {
    topicFit: { axisAligned: true, problemSpecific: true, causeSpecific: true, freeSolutionRelevant: true, productNotPrimary: true },
    firstTwoSecondsHook: { withinTwoSeconds: true, problemNamed: true, causeOpenLoop: true, plainLanguage: true, nonClickbait: true },
    problemSolving: { threeCauses: true, freeSolutionFirst: true, orderedSteps: true, criteriaWhenNeeded: true, clearVerdict: true },
    naturalPurchaseConversion: { criteriaBeforeCard: true, cardOptional: true, lateProductCard: true, noAffiliate: true, noPurchasePressure: true },
    aiQualityConsistency: { lumiConsistency: true, neutralHouseholdProps: true, productOnlyInCard: true, noFakeProduct: true, noFakeTestimonial: true },
  };
}

export function createHomeProblemLabDryRunDraft(topic: string, includeMockProductCard = false): HomeProblemLabContentDraft {
  const axis = axisForTopic(topic);
  const scenes: HomeProblemLabContentDraft["scenes"] = [
    { role: "hook_problem", visualKind: "ai_home_reenactment", startSecond: 0, narration: `${topic}, 원인은 따로 있습니다.` },
    { role: "lumi_diagnosis", visualKind: "lumi_2_5d", startSecond: 3, narration: "살림탐정 루미가 먼저 원인부터 살펴볼게요." },
    { role: "cause_explanation", visualKind: "graphic_checklist_diagram", startSecond: 7, narration: "원인은 세 가지입니다. 위치, 습관, 그리고 관리 순서예요." },
    { role: "free_solution", visualKind: "ai_home_reenactment", startSecond: 14, narration: "먼저 집에 있는 물건과 순서만 바꿔 보세요." },
    { role: "product_criteria", visualKind: "graphic_checklist_diagram", startSecond: 20, narration: "그래도 도구가 필요하다면, 문제 원인에 맞는 기준부터 확인하세요." },
    ...(includeMockProductCard ? [{
      role: "product_card_optional" as const,
      visualKind: "product_card_mock" as const,
      startSecond: 28,
      narration: "이 장면은 테스트용 제품 카드입니다. 실제 판매나 추천이 아닙니다.",
      productCard: { isMock: true as const, isPublishable: false as const, label: "테스트용 제품 카드", disclosure: "테스트용·게시불가" as const, affiliateUrl: null, sourceUrl: null, imageOrigin: "no_product_image_in_phase_2" as const },
    }] : []),
    { role: "verdict_cta", visualKind: "lumi_2_5d", startSecond: 34, narration: "사기 전에 원인부터. 오늘은 이 한 가지만 바꿔 보세요." },
    { role: "next_case_teaser", visualKind: "ai_home_reenactment", startSecond: 40, narration: "다음 사건도 루미가 함께 해결해 볼게요." },
  ];
  return {
    engineId: HOME_PROBLEM_LAB_CONFIG.engineId,
    uploadProfile: HOME_PROBLEM_LAB_CONFIG.uploadProfile,
    topic,
    axis,
    scenes,
    metadata: createMetadata(topic, axis),
    qualityEvidence: completeQualityEvidence(),
    requiresAdvertisingDisclosure: false,
    advertisingDisclosurePresent: false,
    simulatedExternalCalls: 0,
    dryRun: true,
  };
}

export function createFiveHomeProblemLabDryRunSamples() {
  return HOME_PROBLEM_LAB_DRY_RUN_TOPICS.map((topic, index) => {
    const draft = createHomeProblemLabDryRunDraft(topic, index === 2);
    const dialogue = draft.scenes.map((scene) => scene.narration).join(" ");
    return {
      draft,
      quality: evaluateHomeProblemLabQuality(draft),
      lumiTts: createHomeProblemLabLumiMockPreflight(dialogue, `home_problem_lab_dry_run_${index + 1}`),
    };
  });
}
