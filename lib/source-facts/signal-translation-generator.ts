import type { ComparisonType, FactCard } from "./types";
import {
  CAPTION_SYSTEM_V1,
  SCENE_LABEL_BY_ROLE,
  validateSceneCardsForGeneration,
  validateSignalTranslationCitationIds,
} from "./signal-translation";
import type {
  AffectedMoneyArea,
  ImageTextPolicy,
  SceneCard,
  SceneCardGenerationValidationResult,
  SignalTranslationBrief,
} from "./signal-translation";

export type SignalTranslationTemplateId =
  | "exchange_rate_life_economy_v1"
  | "interest_rate_life_economy_v1"
  | "inflation_life_economy_v1"
  | "generic_indicator_life_economy_v1";

export type SignalTranslationCitationValidationResult =
  SceneCardGenerationValidationResult;

export interface MoneyShortsScenePackageGeneratorOptions {
  packageId?: string;
  briefId?: string;
  templateId?: SignalTranslationTemplateId;
  targetDurationSec?: 30;
}

export interface MoneyShortsScenePackage {
  id: string;
  factCardId: string;
  templateId: SignalTranslationTemplateId;
  targetDurationSec: 30;
  brief: SignalTranslationBrief;
  sceneCards: SceneCard[];
  sceneCardValidation: SceneCardGenerationValidationResult;
  citationValidation: SignalTranslationCitationValidationResult;
  warnings: string[];
}

const SCENE_DURATIONS_30 = [4, 5, 6, 6, 4, 5] as const;

const IMAGE_TEXT_POLICY_NO_IMAGE_TEXT: ImageTextPolicy = {
  allowedText: [],
  forbiddenText: [
    "unverified numbers",
    "investment return claims",
    "extra subtitles",
    "source text not backed by citation",
    "logos",
    "card numbers",
    "CTA text",
  ],
};

const COMPARISON_LABEL_BY_TYPE: Record<ComparisonType, string> = {
  previous_month: "전월 대비",
  previous_year: "전년 대비",
  previous_release: "이전 발표 대비",
  consensus: "전망치 대비",
  custom: "기준값 대비",
};

interface ChangeDirectionCopy {
  adjective: string;
  verb: string;
  signalNoun: string;
}

function getCitationIds(factCard: FactCard): string[] {
  return factCard.citations.map((citation) => citation.id);
}

function formatValueWithUnit(value: string, unit: string): string {
  if (unit === "N/A" || unit.trim().length === 0) {
    return value;
  }

  if (unit === "%") {
    return `${value}%`;
  }

  return `${value} ${unit}`;
}

function formatChangeSummary(factCard: FactCard): string {
  const comparisonLabel = COMPARISON_LABEL_BY_TYPE[factCard.comparisonType];

  if (factCard.changeValue === "N/A" && factCard.changeRate === "N/A") {
    return comparisonLabel;
  }

  if (factCard.changeRate === "N/A") {
    return `${comparisonLabel} ${formatValueWithUnit(factCard.changeValue, factCard.unit)}`;
  }

  if (factCard.changeValue === "N/A") {
    return `${comparisonLabel} ${factCard.changeRate}`;
  }

  return `${comparisonLabel} ${formatValueWithUnit(factCard.changeValue, factCard.unit)}(${factCard.changeRate})`;
}

function getChangeDirection(factCard: FactCard): ChangeDirectionCopy {
  const changeValue = factCard.changeNumericValue;

  if (typeof changeValue !== "number" || !Number.isFinite(changeValue)) {
    return {
      adjective: "변화한",
      verb: "움직인",
      signalNoun: "변화 신호",
    };
  }

  if (changeValue > 0) {
    return {
      adjective: "오른",
      verb: "올랐다는",
      signalNoun: "상승 신호",
    };
  }

  if (changeValue < 0) {
    return {
      adjective: "내린",
      verb: "내렸다는",
      signalNoun: "하락 신호",
    };
  }

  return {
    adjective: "유지된",
    verb: "유지됐다는",
    signalNoun: "유지 신호",
  };
}

function isExchangeRateFactCard(factCard: FactCard): boolean {
  const haystack = [
    factCard.indicatorName,
    factCard.unit,
    factCard.sourceName,
    factCard.primarySourceProviderId,
  ]
    .join(" ")
    .toLowerCase();

  return (
    haystack.includes("환율") ||
    haystack.includes("usd") ||
    haystack.includes("krw") ||
    haystack.includes("fx") ||
    haystack.includes("달러")
  );
}

function isInterestRateFactCard(factCard: FactCard): boolean {
  const haystack = [
    factCard.indicatorName,
    factCard.sourceName,
    factCard.primarySourceProviderId,
  ]
    .join(" ")
    .toLowerCase();

  return (
    haystack.includes("금리") ||
    haystack.includes("기준금리") ||
    haystack.includes("대출금리") ||
    haystack.includes("interest") ||
    haystack.includes("base rate") ||
    haystack.includes("policy rate") ||
    haystack.includes("loan rate")
  );
}

function isInflationFactCard(factCard: FactCard): boolean {
  const haystack = [
    factCard.indicatorName,
    factCard.sourceName,
    factCard.primarySourceProviderId,
  ]
    .join(" ")
    .toLowerCase();

  return (
    haystack.includes("물가") ||
    haystack.includes("소비자물가") ||
    haystack.includes("cpi") ||
    haystack.includes("inflation") ||
    haystack.includes("consumer price") ||
    haystack.includes("price index")
  );
}

export function resolveSignalTranslationTemplateId(
  factCard: FactCard,
  options: Pick<MoneyShortsScenePackageGeneratorOptions, "templateId"> = {},
): SignalTranslationTemplateId {
  if (options.templateId) {
    return options.templateId;
  }

  if (isExchangeRateFactCard(factCard)) {
    return "exchange_rate_life_economy_v1";
  }

  if (isInterestRateFactCard(factCard)) {
    return "interest_rate_life_economy_v1";
  }

  if (isInflationFactCard(factCard)) {
    return "inflation_life_economy_v1";
  }

  return "generic_indicator_life_economy_v1";
}

function createExchangeRateBrief(
  factCard: FactCard,
  briefId: string,
): SignalTranslationBrief {
  const direction = getChangeDirection(factCard);
  const citationIds = getCitationIds(factCard);

  return {
    id: briefId,
    factCardId: factCard.id,
    signalSummary:
      `${factCard.indicatorName}이 ${formatChangeSummary(factCard)} ${direction.adjective} 출처 기반 경제 신호다.`,
    keyReasons: [
      "달러가 비싸지면 수입품과 해외결제 비용이 함께 움직일 수 있다.",
      "환율은 한 번의 숫자보다 높은 수준이 얼마나 오래 이어지는지가 중요하다.",
      factCard.interpretation,
    ],
    expertInterpretation:
      "환율 방향을 단정하기보다 수입 물가, 유가, 해외결제 비용에 이어지는 생활비 압력을 함께 봐야 한다.",
    affectedMoneyAreas: [
      "foreign_exchange",
      "travel_costs",
      "groceries",
      "card_bills",
      "variable_expenses",
    ],
    lifeImpact:
      "환율 변화는 해외여행 비용만이 아니라 수입식품, 기름값, 해외결제, 카드값 같은 변동비 체감으로 이어질 수 있다.",
    volatilityWatch: [
      `${factCard.indicatorName}이 높은 수준에서 얼마나 오래 유지되는지`,
      "수입 물가와 유가가 같이 움직이는지",
      "해외결제와 여행비 지출이 늘어나는지",
    ],
    scenarioBasedOutlook: [
      {
        direction: "rising",
        condition: "환율이 추가 상승하거나 높은 수준이 길어질 때",
        viewerMeaning: "해외결제, 여행비, 수입품 가격 부담을 먼저 점검해야 한다.",
      },
      {
        direction: "stable",
        condition: "환율이 높은 수준에서 유지될 때",
        viewerMeaning: "일회성 급등보다 변동비 부담이 누적되는지를 봐야 한다.",
      },
      {
        direction: "falling",
        condition: "환율이 안정적으로 내려갈 때",
        viewerMeaning: "해외결제와 수입 물가 부담이 완화되는지 확인할 수 있다.",
      },
    ],
    recommendedActions: [
      "이번 달 해외결제 내역을 먼저 확인한다.",
      "여행비나 직구 예정 지출은 결제 시점을 나눠 점검한다.",
      "장바구니와 기름값 같은 변동비 항목을 따로 본다.",
    ],
    actionUrgency: "this_month",
    audienceSituation:
      "해외결제, 여행, 직구, 수입식품 구매, 기름값 지출에 민감한 시청자",
    actionBoundaries: [
      "환율 방향을 확정적으로 예측하지 않는다.",
      "특정 자산 매수/매도 판단으로 연결하지 않는다.",
      "생활비 영향은 가능성으로 표현하고 개인 상황 차이를 남긴다.",
    ],
    doNotOverclaimActions: [
      "환율이 계속 오른다고 말하지 않는다.",
      "지금 달러를 사야 한다고 말하지 않는다.",
      "장바구니 물가가 반드시 오른다고 단정하지 않는다.",
    ],
    viewerTakeaway:
      "환율 신호는 여행비보다 먼저 해외결제와 변동비를 점검하라는 생활경제 단서다.",
    sourceCitationIds: citationIds,
    riskNotes: [
      "환율 전망 단정 금지.",
      "투자 권유 금지.",
      factCard.cautionNote,
    ],
  };
}

function createInflationBrief(
  factCard: FactCard,
  briefId: string,
): SignalTranslationBrief {
  const direction = getChangeDirection(factCard);
  const citationIds = getCitationIds(factCard);

  return {
    id: briefId,
    factCardId: factCard.id,
    signalSummary:
      `${factCard.indicatorName}이 ${formatChangeSummary(factCard)} ${direction.adjective} 출처 기반 물가 신호다.`,
    keyReasons: [
      "물가 상승률 숫자 하나보다 식품, 에너지, 서비스 가격이 각각 어떻게 움직이는지 봐야 한다.",
      "환율, 유가, 공급망 압력과 기저효과가 물가 방향에 복합적으로 작용할 수 있다.",
      factCard.interpretation,
    ],
    expertInterpretation:
      "물가 방향을 단정하기보다 장바구니, 외식비, 에너지비 같은 생활 체감 항목이 어떻게 움직이는지를 봐야 한다.",
    affectedMoneyAreas: [
      "groceries",
      "living_costs",
      "variable_expenses",
      "fixed_expenses",
      "savings",
      "spending",
    ],
    lifeImpact:
      "물가 신호는 장바구니, 외식비, 교통비, 구독/고정비, 저축 여력 같은 가계 지출 전반에 걸쳐 체감으로 이어질 수 있다.",
    volatilityWatch: [
      `${factCard.indicatorName} 흐름이 다음 발표에서도 같은 방향으로 이어지는지`,
      "식품과 에너지 가격이 서비스 물가와 같이 움직이는지",
      "가계 변동비 지출이 실제로 줄거나 늘어나는지",
    ],
    scenarioBasedOutlook: [
      {
        direction: "rising",
        condition: "물가 상승이 다시 가팔라지거나 둔화가 오래가지 않을 때",
        viewerMeaning: "장바구니와 변동비 예산을 더 보수적으로 점검해야 한다.",
      },
      {
        direction: "stable",
        condition: "물가 상승률이 현재 수준에서 유지될 때",
        viewerMeaning: "체감 부담이 낮아지기까지 시간이 필요할 수 있으니 지출 구조를 함께 확인한다.",
      },
      {
        direction: "falling",
        condition: "물가 상승률이 지속적으로 낮아질 때",
        viewerMeaning: "실제 장바구니 가격이 내려가는지 직접 확인하는 것이 필요하다.",
      },
    ],
    recommendedActions: [
      "이번 달 장바구니, 외식비, 교통비 지출을 따로 확인한다.",
      "구독비와 고정비 항목이 조정 없이 올라간 것이 있는지 점검한다.",
      "저축 여력에 변화가 생겼는지 가계 예산을 확인한다.",
    ],
    actionUrgency: "this_month",
    audienceSituation:
      "식비, 외식비, 교통비, 고정비 부담과 저축 여력에 민감한 시청자",
    actionBoundaries: [
      "물가 방향을 확정적으로 예측하지 않는다.",
      "투자 매수/매도 판단으로 연결하지 않는다.",
      "생활비 체감은 개인 상황과 품목에 따라 다를 수 있다.",
    ],
    doNotOverclaimActions: [
      "물가가 확실히 잡혔다고 단정하지 않는다.",
      "장바구니 가격이 바로 내릴 것이라고 말하지 않는다.",
      "특정 상품 구매 시점을 조언하지 않는다.",
    ],
    viewerTakeaway:
      "물가 신호는 예측보다 장바구니, 변동비, 가계 예산을 다시 점검하라는 생활경제 단서다.",
    sourceCitationIds: citationIds,
    riskNotes: [
      "물가 전망 단정 금지.",
      "투자 권유 금지.",
      factCard.cautionNote,
    ],
  };
}

function createGenericIndicatorBrief(
  factCard: FactCard,
  briefId: string,
): SignalTranslationBrief {
  const direction = getChangeDirection(factCard);
  const citationIds = getCitationIds(factCard);
  const affectedMoneyAreas: AffectedMoneyArea[] = [
    "living_costs",
    "spending",
    "savings",
    "investment_judgment",
    "fixed_expenses",
    "variable_expenses",
  ];

  return {
    id: briefId,
    factCardId: factCard.id,
    signalSummary:
      `${factCard.indicatorName}이 ${formatChangeSummary(factCard)} ${direction.adjective} 출처 기반 경제 신호다.`,
    keyReasons: [
      "단일 숫자보다 이전 기준값과의 차이, 발표 기간, 다음 발표 흐름을 함께 봐야 한다.",
      factCard.interpretation,
    ],
    expertInterpretation:
      "이 신호는 방향을 단정하기보다 생활비, 소비 계획, 고정비 점검에 어떤 압력을 만드는지 확인하는 단서로 봐야 한다.",
    affectedMoneyAreas,
    lifeImpact:
      "경제지표 변화는 생활비, 소비 계획, 저축 여력, 고정비와 변동비 점검에 간접적으로 연결될 수 있다.",
    volatilityWatch: [
      `${factCard.indicatorName} 흐름이 다음 발표에서도 이어지는지`,
      "생활비와 소비 지표가 같은 방향으로 움직이는지",
      "개인 지출 구조에서 고정비와 변동비 부담이 커지는지",
    ],
    scenarioBasedOutlook: [
      {
        direction: "rising",
        condition: "지표가 다시 높아지거나 부담 신호가 강해질 때",
        viewerMeaning: "변동비와 고정비를 더 보수적으로 점검해야 한다.",
      },
      {
        direction: "stable",
        condition: "지표가 현재 수준에서 유지될 때",
        viewerMeaning: "급한 대응보다 다음 발표와 내 지출 흐름을 같이 확인한다.",
      },
      {
        direction: "falling",
        condition: "지표 부담이 완화될 때",
        viewerMeaning: "체감 비용이 실제로 줄어드는지 생활 지출에서 확인한다.",
      },
    ],
    recommendedActions: [
      "이번 달 고정비와 변동비를 나눠 확인한다.",
      "다음 발표 전까지 같은 지표의 흐름을 한 번 더 본다.",
      "투자 판단보다 생활 지출 점검을 먼저 한다.",
    ],
    actionUrgency: "this_month",
    audienceSituation:
      "경제지표가 내 생활비와 돈관리 판단에 어떤 의미인지 알고 싶은 시청자",
    actionBoundaries: [
      "원인을 하나로 단정하지 않는다.",
      "예측을 확정적으로 말하지 않는다.",
      "특정 투자 행동을 권유하지 않는다.",
    ],
    doNotOverclaimActions: [
      "지표 하나로 경기 방향을 확정하지 않는다.",
      "수익 또는 손실을 예단하지 않는다.",
      "생활비 변화가 모든 사람에게 같다고 말하지 않는다.",
    ],
    viewerTakeaway:
      "경제 신호는 예측보다 내 지출 구조를 점검하는 생활경제 단서로 봐야 한다.",
    sourceCitationIds: citationIds,
    riskNotes: [
      "Generic deterministic fallback이며 발행 전 주제별 문구 검토가 필요하다.",
      factCard.cautionNote,
    ],
  };
}

function createInterestRateBrief(
  factCard: FactCard,
  briefId: string,
): SignalTranslationBrief {
  const direction = getChangeDirection(factCard);
  const citationIds = getCitationIds(factCard);

  return {
    id: briefId,
    factCardId: factCard.id,
    signalSummary:
      `${factCard.indicatorName}이 ${formatChangeSummary(factCard)} ${direction.adjective} 출처 기반 금리 신호다.`,
    keyReasons: [
      "금리는 물가, 경기 흐름, 중앙은행 스탠스가 함께 반영되는 신호다.",
      "금리 수준은 대출 이자 부담과 예금 조건, 소비 여력에 다르게 작용할 수 있다.",
      factCard.interpretation,
    ],
    expertInterpretation:
      "금리 방향을 단정하기보다 물가와 경기 신호가 다음 금리 경로에 어떤 압력을 주는지 봐야 한다.",
    affectedMoneyAreas: [
      "loans",
      "savings",
      "spending",
      "fixed_expenses",
      "variable_expenses",
      "living_costs",
      "investment_judgment",
    ],
    lifeImpact:
      "금리 신호는 대출자에게는 이자 부담, 저축자에게는 예금 조건, 소비자에게는 현금흐름과 지출 여력 점검으로 연결될 수 있다.",
    volatilityWatch: [
      "다음 금리 결정에서 같은 수준이 유지되는지",
      "물가와 경기지표가 금리 경로에 어떤 압력을 주는지",
      "대출금리와 예금금리가 실제 생활 조건에서 어떻게 움직이는지",
    ],
    scenarioBasedOutlook: [
      {
        direction: "rising",
        condition: "금리 부담이 다시 커지거나 대출금리가 높아질 때",
        viewerMeaning: "대출 이자와 고정비 부담을 먼저 점검해야 한다.",
      },
      {
        direction: "stable",
        condition: "금리가 현재 수준에서 유지될 때",
        viewerMeaning: "급한 예측보다 내 대출 조건과 예금 만기 조건을 확인해야 한다.",
      },
      {
        direction: "falling",
        condition: "금리 부담이 완화되는 신호가 이어질 때",
        viewerMeaning: "이자 부담 완화가 실제 현금흐름에 반영되는지 확인할 수 있다.",
      },
    ],
    recommendedActions: [
      "내 대출금리와 다음 금리 변경 시점을 확인한다.",
      "예금과 적금 만기 조건을 함께 본다.",
      "이번 달 고정비와 변동비를 나눠 현금흐름을 점검한다.",
    ],
    actionUrgency: "this_month",
    audienceSituation:
      "대출 상환, 예금/적금 만기, 소비 계획, 고정비 부담에 민감한 시청자",
    actionBoundaries: [
      "다음 금리 결정을 확정적으로 예측하지 않는다.",
      "특정 예금, 대출, 투자 상품을 추천하지 않는다.",
      "개인별 대출 조건과 소득 상황 차이를 남긴다.",
    ],
    doNotOverclaimActions: [
      "금리가 곧 오른다거나 내린다고 단정하지 않는다.",
      "지금 대출을 갈아타야 한다고 말하지 않는다.",
      "특정 금융상품 가입을 권유하지 않는다.",
    ],
    viewerTakeaway:
      "금리 신호는 예측보다 내 대출 조건, 예금 만기, 현금흐름을 점검하라는 생활경제 단서다.",
    sourceCitationIds: citationIds,
    riskNotes: [
      "금리 경로 단정 금지.",
      "대출/예금/투자 상품 추천 금지.",
      factCard.cautionNote,
    ],
  };
}

export function createSignalTranslationBriefFromFactCard(
  factCard: FactCard,
  options: MoneyShortsScenePackageGeneratorOptions = {},
): SignalTranslationBrief {
  const templateId = resolveSignalTranslationTemplateId(factCard, options);
  const briefId = options.briefId ?? `signal-translation-brief-${factCard.id}`;

  if (templateId === "exchange_rate_life_economy_v1") {
    return createExchangeRateBrief(factCard, briefId);
  }

  if (templateId === "interest_rate_life_economy_v1") {
    return createInterestRateBrief(factCard, briefId);
  }

  if (templateId === "inflation_life_economy_v1") {
    return createInflationBrief(factCard, briefId);
  }

  return createGenericIndicatorBrief(factCard, briefId);
}

function createSourceNote(factCard: FactCard): string {
  return `출처: ${factCard.sourceName} (${factCard.dataPeriod})`;
}

function createLayoutSafeZone(includeHookTitle: boolean): SceneCard["layoutSafeZone"] {
  return {
    ...(includeHookTitle ? { hookTitle: CAPTION_SYSTEM_V1.hookTitle } : {}),
    spokenCaption: CAPTION_SYSTEM_V1.spokenCaption,
    sceneLabel: CAPTION_SYSTEM_V1.sceneLabel,
    sourceNote: CAPTION_SYSTEM_V1.sourceNote,
  };
}

function getSceneStartSec(sceneIndex: number): number {
  return SCENE_DURATIONS_30
    .slice(0, sceneIndex)
    .reduce<number>((total, durationSec) => total + durationSec, 0);
}

function createSceneCard(
  scene: Omit<
    SceneCard,
    | "captionBlocks"
    | "imageTextPolicy"
    | "layoutSafeZone"
    | "sourceCitationIds"
    | "sourceNote"
  > & {
    captionText: string;
    emphasisWords: string[];
    sourceCitationIds: string[];
    sourceNote: string;
  },
): SceneCard {
  const sceneIndex = scene.sceneNumber - 1;
  const startSec = getSceneStartSec(sceneIndex);
  const endSec = startSec + scene.durationSec;
  const { captionText, emphasisWords, ...sceneFields } = scene;

  return {
    ...sceneFields,
    captionBlocks: [
      {
        startSec,
        endSec,
        text: captionText,
        emphasisWords,
      },
    ],
    imageTextPolicy: IMAGE_TEXT_POLICY_NO_IMAGE_TEXT,
    layoutSafeZone: createLayoutSafeZone(scene.sceneNumber === 1),
  };
}

function createExchangeRateSceneCards(
  factCard: FactCard,
  brief: SignalTranslationBrief,
): SceneCard[] {
  const sourceNote = createSourceNote(factCard);
  const direction = getChangeDirection(factCard);
  const sourceCitationIds = brief.sourceCitationIds;

  return [
    createSceneCard({
      sceneNumber: 1,
      sceneRole: "hook",
      sceneGoal: "환율 신호를 해외여행 비용보다 넓은 생활비 질문으로 열기.",
      narration: "환율이 오르면 해외여행만 비싸질까요?",
      spokenCaption: "환율 오르면 여행비만 비쌀까?",
      hookTitle: "환율 오르면 여행비만?",
      sceneLabel: SCENE_LABEL_BY_ROLE.hook,
      screenText: ["환율", "여행비", "카드값"],
      captionText: "환율 오르면 여행비만 비쌀까?",
      emphasisWords: ["환율"],
      imagePrompt:
        "Vertical 9:16 editorial life-economy report style, travel suitcase, credit card statement, USD/KRW signal card, off-white and charcoal navy palette, warm yellow accent, clue-like composition with connection lines, clean space for Korean hook title overlay, no text or numbers inside image.",
      visualTemplateId: "signal_card",
      visualObjects: ["travel suitcase", "credit card statement", "USD/KRW signal card"],
      sourceCitationIds,
      voiceTiming: {
        pace: "fast",
        emphasisWords: ["환율", "해외여행"],
        pauses: ["환율이 오르면"],
      },
      durationSec: SCENE_DURATIONS_30[0],
      sourceNote,
      riskNotes: ["Hook must not imply guaranteed price increases."],
    }),
    createSceneCard({
      sceneNumber: 2,
      sceneRole: "signal",
      sceneGoal: "Fact Card 범위 안에서 환율 신호와 출처를 제시하기.",
      narration:
        `이번 신호는 ${factCard.indicatorName}이 ${formatChangeSummary(factCard)} ${direction.verb} 출처 기반 데이터에서 시작합니다.`,
      spokenCaption: `${factCard.indicatorName} ${direction.signalNoun}입니다`,
      sceneLabel: SCENE_LABEL_BY_ROLE.signal,
      screenText: [
        factCard.indicatorName,
        formatValueWithUnit(factCard.currentValue, factCard.unit),
      ],
      captionText: `${factCard.indicatorName} ${direction.signalNoun}입니다`,
      emphasisWords: ["환율"],
      imagePrompt:
        "Vertical 9:16 editorial life-economy report style, clean economic signal card, exchange rate dashboard object, source card placeholder without readable text, off-white background, charcoal navy card, warm yellow accent, no unverified text or numbers inside image.",
      visualTemplateId: "signal_card",
      visualObjects: ["economic signal card", "exchange rate dashboard object"],
      sourceCitationIds,
      voiceTiming: {
        pace: "normal",
        emphasisWords: [factCard.indicatorName, "출처 기반 데이터"],
        pauses: ["이번 신호는"],
      },
      durationSec: SCENE_DURATIONS_30[1],
      sourceNote,
      riskNotes: ["Use only Fact Card-backed exchange-rate values."],
    }),
    createSceneCard({
      sceneNumber: 3,
      sceneRole: "why_expert_interpretation",
      sceneGoal: "환율 숫자 하나보다 유지 기간과 연결 비용을 봐야 한다는 해석 제시.",
      narration:
        "지금 봐야 할 건 환율 숫자 하나가 아니라, 높은 수준이 얼마나 오래 이어지는지입니다.",
      spokenCaption: "숫자 하나보다 지속 기간을 봐야 합니다",
      sceneLabel: SCENE_LABEL_BY_ROLE.why_expert_interpretation,
      screenText: ["지속 기간", "수입 물가", "해외결제"],
      captionText: "숫자 하나보다 지속 기간을 봐야 합니다",
      emphasisWords: ["지속 기간"],
      imagePrompt:
        "Vertical 9:16 editorial life-economy report style, clue cards connected by thin lines, exchange rate level, imported goods, overseas payment icons as abstract objects, charcoal navy and light gray, warm yellow check marks, no text or numbers inside image.",
      visualTemplateId: "clue_cards",
      visualObjects: ["clue cards", "connection lines", "overseas payment object"],
      sourceCitationIds,
      voiceTiming: {
        pace: "normal",
        emphasisWords: ["높은 수준", "얼마나 오래"],
        pauses: ["지금 봐야 할 건"],
      },
      durationSec: SCENE_DURATIONS_30[2],
      sourceNote,
      riskNotes: ["No deterministic FX forecast."],
    }),
    createSceneCard({
      sceneNumber: 4,
      sceneRole: "life_impact",
      sceneGoal: "환율 신호를 장바구니, 기름값, 해외결제, 카드값과 연결하기.",
      narration:
        "달러가 비싸지면 수입식품, 기름값, 해외결제 비용이 같이 움직일 수 있습니다.",
      spokenCaption: "장바구니와 카드값도 흔들릴 수 있습니다",
      sceneLabel: SCENE_LABEL_BY_ROLE.life_impact,
      screenText: ["장바구니", "기름값", "카드값"],
      captionText: "장바구니와 카드값도 흔들릴 수 있습니다",
      emphasisWords: ["카드값"],
      imagePrompt:
        "Vertical 9:16 editorial life-economy report style, grocery basket, gas receipt, overseas card payment notification, economic signal card in the same scene, off-white background, charcoal navy cards, warm yellow accent, no text or numbers inside image.",
      visualTemplateId: "life_object",
      visualObjects: ["grocery basket", "gas receipt", "card payment notification"],
      sourceCitationIds,
      voiceTiming: {
        pace: "normal",
        emphasisWords: ["수입식품", "해외결제 비용"],
        pauses: ["달러가 비싸지면"],
      },
      durationSec: SCENE_DURATIONS_30[3],
      sourceNote,
      riskNotes: ["Life impact must remain a possibility, not a guaranteed outcome."],
    }),
    createSceneCard({
      sceneNumber: 5,
      sceneRole: "watch_scenario_outlook",
      sceneGoal: "전망 단정 대신 높은 수준 지속 여부를 관찰 포인트로 제시하기.",
      narration:
        "환율이 높은 수준에서 오래 머물면 변동비 부담이 누적되는지 봐야 합니다.",
      spokenCaption: "높은 수준이 오래 가는지 봐야 합니다",
      sceneLabel: SCENE_LABEL_BY_ROLE.watch_scenario_outlook,
      screenText: ["관찰", "지속 기간", "변동비"],
      captionText: "높은 수준이 오래 가는지 봐야 합니다",
      emphasisWords: ["오래"],
      imagePrompt:
        "Vertical 9:16 editorial life-economy report style, calendar watch card, volatility clue cards, variable expense checklist, blue-gray support color, charcoal navy text card space, warm yellow accent, no text or numbers inside image.",
      visualTemplateId: "clue_cards",
      visualObjects: ["calendar", "volatility clue cards", "variable expense checklist"],
      sourceCitationIds,
      voiceTiming: {
        pace: "normal",
        emphasisWords: ["높은 수준", "변동비"],
        pauses: ["오래 머물면"],
      },
      durationSec: SCENE_DURATIONS_30[4],
      sourceNote,
      riskNotes: ["Scenario outlook must not become deterministic forecast."],
    }),
    createSceneCard({
      sceneNumber: 6,
      sceneRole: "action_closing",
      sceneGoal: "투자 권유 없이 해외결제와 변동비 점검 행동으로 마무리하기.",
      narration: "이번 달은 해외결제와 변동비를 먼저 점검해보세요.",
      spokenCaption: "이번 달은 변동비부터 점검하세요",
      sceneLabel: SCENE_LABEL_BY_ROLE.action_closing,
      screenText: ["해외결제", "변동비", "점검"],
      captionText: "이번 달은 변동비부터 점검하세요",
      emphasisWords: ["변동비"],
      imagePrompt:
        "Vertical 9:16 editorial life-economy report style, action checklist, card statement, variable expense notes, calm practical closing scene, off-white and charcoal navy, warm yellow check marks, no text or numbers inside image.",
      visualTemplateId: "action_checklist",
      visualObjects: ["action checklist", "card statement", "variable expense notes"],
      sourceCitationIds,
      voiceTiming: {
        pace: "slow",
        emphasisWords: ["해외결제", "변동비"],
        pauses: ["이번 달은"],
      },
      durationSec: SCENE_DURATIONS_30[5],
      sourceNote,
      riskNotes: ["Action must remain a spending check, not investment advice."],
    }),
  ];
}

function createInflationSceneCards(
  factCard: FactCard,
  brief: SignalTranslationBrief,
): SceneCard[] {
  const sourceNote = createSourceNote(factCard);
  const direction = getChangeDirection(factCard);
  const sourceCitationIds = brief.sourceCitationIds;

  return [
    createSceneCard({
      sceneNumber: 1,
      sceneRole: "hook",
      sceneGoal: "물가 둔화 신호를 생활 체감 질문으로 열기.",
      narration: "물가 상승률이 낮아졌다고 장바구니 가격도 바로 내릴까요?",
      spokenCaption: "물가 낮아졌는데 왜 체감은 그대로일까?",
      hookTitle: "물가 낮아졌는데\n체감이 그대로인 이유",
      sceneLabel: SCENE_LABEL_BY_ROLE.hook,
      screenText: ["물가", "장바구니", "생활비"],
      captionText: "물가 낮아졌는데 왜 체감은 그대로일까?",
      emphasisWords: ["물가", "체감"],
      imagePrompt:
        "Vertical 9:16 editorial life-economy report style, grocery basket with receipt, household expense note, CPI signal card, off-white and charcoal navy palette, warm yellow accent, clue-like composition with connection lines, clean space for Korean hook title overlay, no text or numbers inside image.",
      visualTemplateId: "signal_card",
      visualObjects: ["grocery basket", "household expense note", "CPI signal card"],
      sourceCitationIds,
      voiceTiming: {
        pace: "fast",
        emphasisWords: ["물가", "장바구니", "체감"],
        pauses: ["물가 상승률이 낮아졌다고"],
      },
      durationSec: SCENE_DURATIONS_30[0],
      sourceNote,
      riskNotes: ["Hook must not imply guaranteed price decreases."],
    }),
    createSceneCard({
      sceneNumber: 2,
      sceneRole: "signal",
      sceneGoal: "Fact Card 범위 안에서 소비자물가 신호와 출처를 제시하기.",
      narration:
        `이번 신호는 ${factCard.sourceName}의 ${factCard.indicatorName}이 ${formatChangeSummary(factCard)} ${direction.verb} 출처 기반 데이터에서 시작합니다.`,
      spokenCaption: `${factCard.indicatorName} ${direction.signalNoun}입니다`,
      sceneLabel: SCENE_LABEL_BY_ROLE.signal,
      screenText: [
        factCard.indicatorName,
        formatValueWithUnit(factCard.currentValue, factCard.unit),
      ],
      captionText: `${factCard.indicatorName} ${direction.signalNoun}입니다`,
      emphasisWords: ["소비자물가"],
      imagePrompt:
        "Vertical 9:16 editorial life-economy report style, clean economic signal card, CPI source evidence card placeholder without readable text, light gray background, charcoal navy card, warm yellow accent, no readable text or numbers inside image.",
      visualTemplateId: "signal_card",
      visualObjects: ["CPI signal card", "source evidence card"],
      sourceCitationIds,
      voiceTiming: {
        pace: "normal",
        emphasisWords: [factCard.indicatorName, "출처"],
        pauses: ["이번 신호는"],
      },
      durationSec: SCENE_DURATIONS_30[1],
      sourceNote,
      riskNotes: ["Use only Fact Card-backed CPI values."],
    }),
    createSceneCard({
      sceneNumber: 3,
      sceneRole: "why_expert_interpretation",
      sceneGoal: "식품/에너지/서비스 가격과 환율·기저효과를 원인 후보로만 제시하고 단정하지 않기.",
      narration:
        "물가는 식품, 에너지, 서비스 가격이 각각 다르게 움직이고, 환율과 기저효과도 영향을 줄 수 있습니다.",
      spokenCaption: "식품·에너지·서비스 가격이 각각 다릅니다",
      sceneLabel: SCENE_LABEL_BY_ROLE.why_expert_interpretation,
      screenText: ["식품", "에너지", "서비스 물가"],
      captionText: "식품·에너지·서비스 가격이 각각 다릅니다",
      emphasisWords: ["식품", "에너지"],
      imagePrompt:
        "Vertical 9:16 editorial life-economy report style, clue cards for food prices, energy prices, service costs, thin connection lines, charcoal navy and light gray, warm yellow check marks, no text or numbers inside image.",
      visualTemplateId: "clue_cards",
      visualObjects: ["food price clue card", "energy clue card", "service cost clue card"],
      sourceCitationIds,
      voiceTiming: {
        pace: "normal",
        emphasisWords: ["식품", "에너지", "서비스"],
        pauses: ["물가는"],
      },
      durationSec: SCENE_DURATIONS_30[2],
      sourceNote,
      riskNotes: ["No single-cause inflation claim."],
    }),
    createSceneCard({
      sceneNumber: 4,
      sceneRole: "life_impact",
      sceneGoal: "물가 신호를 장바구니, 외식비, 교통비, 고정비/변동비, 저축 여력과 연결하기.",
      narration:
        "장바구니, 외식비, 교통비가 먼저 체감으로 이어지고, 구독비와 고정비도 같이 확인해야 합니다.",
      spokenCaption: "장바구니와 고정비도 같이 봐야 합니다",
      sceneLabel: SCENE_LABEL_BY_ROLE.life_impact,
      screenText: ["장바구니", "외식비", "고정비"],
      captionText: "장바구니와 고정비도 같이 봐야 합니다",
      emphasisWords: ["장바구니", "고정비"],
      imagePrompt:
        "Vertical 9:16 editorial life-economy report style, grocery receipt, restaurant bill, subscription expense note, household budget checklist, off-white background, charcoal navy cards, warm yellow accent, no text or numbers inside image.",
      visualTemplateId: "life_object",
      visualObjects: ["grocery receipt", "restaurant bill", "subscription expense note"],
      sourceCitationIds,
      voiceTiming: {
        pace: "normal",
        emphasisWords: ["장바구니", "외식비", "고정비"],
        pauses: ["장바구니", "교통비가"],
      },
      durationSec: SCENE_DURATIONS_30[3],
      sourceNote,
      riskNotes: ["Life impact must remain conditional and individual-situation-aware."],
    }),
    createSceneCard({
      sceneNumber: 5,
      sceneRole: "watch_scenario_outlook",
      sceneGoal: "확정 전망 대신 다음 발표와 식품·에너지·서비스 물가 관찰 포인트 제시하기.",
      narration:
        "다음에는 식품과 에너지 가격이 같이 낮아지는지, 아니면 서비스 물가가 버티는지를 봐야 합니다.",
      spokenCaption: "식품과 서비스 물가 흐름을 확인하세요",
      sceneLabel: SCENE_LABEL_BY_ROLE.watch_scenario_outlook,
      screenText: ["식품 물가", "서비스 물가", "다음 발표"],
      captionText: "식품과 서비스 물가 흐름을 확인하세요",
      emphasisWords: ["식품", "서비스 물가"],
      imagePrompt:
        "Vertical 9:16 editorial life-economy report style, scenario cards, calendar watch card, food and service price clue cards, blue-gray support color, charcoal navy card space, warm yellow accent, no text or numbers inside image.",
      visualTemplateId: "clue_cards",
      visualObjects: ["scenario cards", "calendar watch card", "food price clue card"],
      sourceCitationIds,
      voiceTiming: {
        pace: "normal",
        emphasisWords: ["식품", "서비스 물가"],
        pauses: ["다음에는"],
      },
      durationSec: SCENE_DURATIONS_30[4],
      sourceNote,
      riskNotes: ["Scenario outlook must not become a deterministic inflation forecast."],
    }),
    createSceneCard({
      sceneNumber: 6,
      sceneRole: "action_closing",
      sceneGoal: "투자 권유 없이 장바구니·변동비·가계 예산 점검 행동으로 마무리하기.",
      narration:
        "이번 달은 장바구니, 외식비, 구독비를 나눠 가계 예산부터 점검해보세요.",
      spokenCaption: "이번 달은 가계 예산부터 점검하세요",
      sceneLabel: SCENE_LABEL_BY_ROLE.action_closing,
      screenText: ["장바구니", "구독비", "가계 예산"],
      captionText: "이번 달은 가계 예산부터 점검하세요",
      emphasisWords: ["가계 예산"],
      imagePrompt:
        "Vertical 9:16 editorial life-economy report style, action checklist, grocery list, subscription list, household budget note, calm practical closing scene, off-white and charcoal navy, warm yellow check marks, no text or numbers inside image.",
      visualTemplateId: "action_checklist",
      visualObjects: ["action checklist", "grocery list", "subscription list"],
      sourceCitationIds,
      voiceTiming: {
        pace: "slow",
        emphasisWords: ["장바구니", "구독비", "가계 예산"],
        pauses: ["이번 달은"],
      },
      durationSec: SCENE_DURATIONS_30[5],
      sourceNote,
      riskNotes: ["Action must remain a household budget check, not investment advice."],
    }),
  ];
}

function createGenericIndicatorSceneCards(
  factCard: FactCard,
  brief: SignalTranslationBrief,
): SceneCard[] {
  const sourceNote = createSourceNote(factCard);
  const direction = getChangeDirection(factCard);
  const sourceCitationIds = brief.sourceCitationIds;

  return [
    createSceneCard({
      sceneNumber: 1,
      sceneRole: "hook",
      sceneGoal: "경제지표를 내 생활 돈관리 질문으로 열기.",
      narration: `${factCard.indicatorName}, 내 돈과 무슨 관련이 있을까요?`,
      spokenCaption: `${factCard.indicatorName}, 내 돈과 관련 있을까?`,
      hookTitle: `${factCard.indicatorName}, 내 돈과?`,
      sceneLabel: SCENE_LABEL_BY_ROLE.hook,
      screenText: [factCard.indicatorName, "생활비", "돈관리"],
      captionText: `${factCard.indicatorName}, 내 돈과 관련 있을까?`,
      emphasisWords: [factCard.indicatorName],
      imagePrompt:
        "Vertical 9:16 editorial life-economy report style, everyday wallet, household expense note, economic signal card, clue-like connection lines, off-white and charcoal navy palette, warm yellow accent, no text or numbers inside image.",
      visualTemplateId: "signal_card",
      visualObjects: ["wallet", "household expense note", "economic signal card"],
      sourceCitationIds,
      voiceTiming: {
        pace: "fast",
        emphasisWords: [factCard.indicatorName],
        pauses: [factCard.indicatorName],
      },
      durationSec: SCENE_DURATIONS_30[0],
      sourceNote,
      riskNotes: ["Hook must connect to real body content without exaggeration."],
    }),
    createSceneCard({
      sceneNumber: 2,
      sceneRole: "signal",
      sceneGoal: "Fact Card 범위 안에서 경제 신호와 출처를 제시하기.",
      narration:
        `이번 신호는 ${factCard.sourceName}의 ${factCard.indicatorName}이 ${formatChangeSummary(factCard)} ${direction.verb} 데이터에서 시작합니다.`,
      spokenCaption: `${factCard.indicatorName} ${direction.signalNoun}입니다`,
      sceneLabel: SCENE_LABEL_BY_ROLE.signal,
      screenText: [
        factCard.indicatorName,
        formatValueWithUnit(factCard.currentValue, factCard.unit),
      ],
      captionText: `${factCard.indicatorName} ${direction.signalNoun}입니다`,
      emphasisWords: [factCard.indicatorName],
      imagePrompt:
        "Vertical 9:16 editorial life-economy report style, clean economic signal card, source evidence card placeholder, light gray background, charcoal navy card, warm yellow accent, no readable text or numbers inside image.",
      visualTemplateId: "signal_card",
      visualObjects: ["economic signal card", "source evidence card"],
      sourceCitationIds,
      voiceTiming: {
        pace: "normal",
        emphasisWords: [factCard.indicatorName, "출처"],
        pauses: ["이번 신호는"],
      },
      durationSec: SCENE_DURATIONS_30[1],
      sourceNote,
      riskNotes: ["Use only Fact Card-backed values."],
    }),
    createSceneCard({
      sceneNumber: 3,
      sceneRole: "why_expert_interpretation",
      sceneGoal: "단일 숫자보다 지표의 맥락과 다음 관찰 포인트를 제시하기.",
      narration:
        "지금은 숫자 하나로 단정하기보다, 이 변화가 다음 발표에서도 이어지는지를 봐야 합니다.",
      spokenCaption: "숫자보다 다음 흐름을 봐야 합니다",
      sceneLabel: SCENE_LABEL_BY_ROLE.why_expert_interpretation,
      screenText: ["맥락", "다음 발표", "관찰"],
      captionText: "숫자보다 다음 흐름을 봐야 합니다",
      emphasisWords: ["다음 흐름"],
      imagePrompt:
        "Vertical 9:16 editorial life-economy report style, clue cards connected by thin lines, calendar marker, economic signal object, charcoal navy and light gray, warm yellow check marks, no text or numbers inside image.",
      visualTemplateId: "clue_cards",
      visualObjects: ["clue cards", "calendar marker", "economic signal object"],
      sourceCitationIds,
      voiceTiming: {
        pace: "normal",
        emphasisWords: ["숫자 하나", "다음 발표"],
        pauses: ["지금은"],
      },
      durationSec: SCENE_DURATIONS_30[2],
      sourceNote,
      riskNotes: ["No single-cause claim."],
    }),
    createSceneCard({
      sceneNumber: 4,
      sceneRole: "life_impact",
      sceneGoal: "경제 신호를 생활비, 소비, 저축, 고정비/변동비 점검과 연결하기.",
      narration:
        "이 신호는 생활비, 소비 계획, 고정비와 변동비 점검에 영향을 줄 수 있습니다.",
      spokenCaption: "생활비와 지출 구조를 같이 봐야 합니다",
      sceneLabel: SCENE_LABEL_BY_ROLE.life_impact,
      screenText: ["생활비", "고정비", "변동비"],
      captionText: "생활비와 지출 구조를 같이 봐야 합니다",
      emphasisWords: ["생활비"],
      imagePrompt:
        "Vertical 9:16 editorial life-economy report style, grocery receipt, fixed expense checklist, variable expense notes, economic signal card in the same scene, off-white background, charcoal navy cards, warm yellow accent, no text or numbers inside image.",
      visualTemplateId: "life_object",
      visualObjects: ["grocery receipt", "fixed expense checklist", "variable expense notes"],
      sourceCitationIds,
      voiceTiming: {
        pace: "normal",
        emphasisWords: ["생활비", "변동비"],
        pauses: ["이 신호는"],
      },
      durationSec: SCENE_DURATIONS_30[3],
      sourceNote,
      riskNotes: ["Life impact must remain conditional and situation-aware."],
    }),
    createSceneCard({
      sceneNumber: 5,
      sceneRole: "watch_scenario_outlook",
      sceneGoal: "확정 예측 대신 다음 발표와 변동성 관찰 포인트 제시하기.",
      narration:
        "다음에는 이 흐름이 이어지는지, 아니면 다시 완화되는지를 함께 확인해야 합니다.",
      spokenCaption: "다음 발표에서 흐름을 확인하세요",
      sceneLabel: SCENE_LABEL_BY_ROLE.watch_scenario_outlook,
      screenText: ["다음 발표", "유지", "완화"],
      captionText: "다음 발표에서 흐름을 확인하세요",
      emphasisWords: ["다음 발표"],
      imagePrompt:
        "Vertical 9:16 editorial life-economy report style, scenario cards, calendar watch card, volatility clue cards, blue-gray support color, charcoal navy card space, warm yellow accent, no text or numbers inside image.",
      visualTemplateId: "clue_cards",
      visualObjects: ["scenario cards", "calendar watch card", "volatility clue cards"],
      sourceCitationIds,
      voiceTiming: {
        pace: "normal",
        emphasisWords: ["이어지는지", "완화되는지"],
        pauses: ["다음에는"],
      },
      durationSec: SCENE_DURATIONS_30[4],
      sourceNote,
      riskNotes: ["Scenario outlook must not become deterministic forecast."],
    }),
    createSceneCard({
      sceneNumber: 6,
      sceneRole: "action_closing",
      sceneGoal: "투자 권유 없이 생활 지출 점검 행동으로 마무리하기.",
      narration: "이번 달은 예측보다 내 고정비와 변동비를 먼저 점검해보세요.",
      spokenCaption: "이번 달은 지출 구조부터 점검하세요",
      sceneLabel: SCENE_LABEL_BY_ROLE.action_closing,
      screenText: ["고정비", "변동비", "점검"],
      captionText: "이번 달은 지출 구조부터 점검하세요",
      emphasisWords: ["지출 구조"],
      imagePrompt:
        "Vertical 9:16 editorial life-economy report style, action checklist, monthly expense notes, calm practical closing scene, off-white and charcoal navy, warm yellow check marks, no text or numbers inside image.",
      visualTemplateId: "action_checklist",
      visualObjects: ["action checklist", "monthly expense notes", "budget check"],
      sourceCitationIds,
      voiceTiming: {
        pace: "slow",
        emphasisWords: ["고정비", "변동비"],
        pauses: ["이번 달은"],
      },
      durationSec: SCENE_DURATIONS_30[5],
      sourceNote,
      riskNotes: ["Action must remain a spending check, not investment advice."],
    }),
  ];
}

function createInterestRateSceneCards(
  factCard: FactCard,
  brief: SignalTranslationBrief,
): SceneCard[] {
  const sourceNote = createSourceNote(factCard);
  const direction = getChangeDirection(factCard);
  const sourceCitationIds = brief.sourceCitationIds;

  return [
    createSceneCard({
      sceneNumber: 1,
      sceneRole: "hook",
      sceneGoal: "금리 신호를 단순 호재가 아니라 내 대출과 저축 질문으로 열기.",
      narration: "금리 동결, 진짜 좋은 소식일까요?",
      spokenCaption: "금리 동결, 진짜 좋은 소식일까?",
      hookTitle: "금리 동결,\n좋은 소식일까?",
      sceneLabel: SCENE_LABEL_BY_ROLE.hook,
      screenText: ["금리", "대출", "저축"],
      captionText: "금리 동결, 진짜 좋은 소식일까?",
      emphasisWords: ["금리"],
      imagePrompt:
        "Vertical 9:16 editorial life-economy report style, loan document, savings passbook, household budget note, interest rate signal card, clue-like connection lines, off-white and charcoal navy palette, warm yellow accent, no text or numbers inside image.",
      visualTemplateId: "signal_card",
      visualObjects: ["loan document", "savings passbook", "interest rate signal card"],
      sourceCitationIds,
      voiceTiming: {
        pace: "fast",
        emphasisWords: ["금리 동결", "좋은 소식"],
        pauses: ["금리 동결"],
      },
      durationSec: SCENE_DURATIONS_30[0],
      sourceNote,
      riskNotes: ["Hook must not imply that rate hold is universally good."],
    }),
    createSceneCard({
      sceneNumber: 2,
      sceneRole: "signal",
      sceneGoal: "Fact Card 범위 안에서 기준금리 신호와 출처를 제시하기.",
      narration:
        `이번 신호는 ${factCard.sourceName}의 ${factCard.indicatorName}이 ${formatValueWithUnit(factCard.currentValue, factCard.unit)} 수준에서 ${direction.verb} 데이터에서 시작합니다.`,
      spokenCaption: `${factCard.indicatorName} ${direction.signalNoun}입니다`,
      sceneLabel: SCENE_LABEL_BY_ROLE.signal,
      screenText: [
        factCard.indicatorName,
        formatValueWithUnit(factCard.currentValue, factCard.unit),
      ],
      captionText: `${factCard.indicatorName} ${direction.signalNoun}입니다`,
      emphasisWords: ["기준금리"],
      imagePrompt:
        "Vertical 9:16 editorial life-economy report style, clean interest rate signal card, central bank source card placeholder without readable text, loan and savings objects, light gray background, charcoal navy card, warm yellow accent, no text or numbers inside image.",
      visualTemplateId: "signal_card",
      visualObjects: ["interest rate signal card", "loan object", "savings object"],
      sourceCitationIds,
      voiceTiming: {
        pace: "normal",
        emphasisWords: [factCard.indicatorName, "출처"],
        pauses: ["이번 신호는"],
      },
      durationSec: SCENE_DURATIONS_30[1],
      sourceNote,
      riskNotes: ["Use only Fact Card-backed interest-rate values."],
    }),
    createSceneCard({
      sceneNumber: 3,
      sceneRole: "why_expert_interpretation",
      sceneGoal: "물가, 경기, 중앙은행 스탠스를 원인 후보로만 제시하고 단정하지 않기.",
      narration:
        "지금 봐야 할 건 다음 금리 방향 단정이 아니라, 물가와 경기 신호가 어떻게 바뀌는지입니다.",
      spokenCaption: "방향보다 물가와 경기를 봐야 합니다",
      sceneLabel: SCENE_LABEL_BY_ROLE.why_expert_interpretation,
      screenText: ["물가", "경기", "중앙은행"],
      captionText: "방향보다 물가와 경기를 봐야 합니다",
      emphasisWords: ["물가", "경기"],
      imagePrompt:
        "Vertical 9:16 editorial life-economy report style, clue cards for inflation, economic activity, central bank stance, thin connection lines, charcoal navy and light gray, warm yellow check marks, no text or numbers inside image.",
      visualTemplateId: "clue_cards",
      visualObjects: ["inflation clue card", "economy clue card", "central bank clue card"],
      sourceCitationIds,
      voiceTiming: {
        pace: "normal",
        emphasisWords: ["단정", "물가", "경기"],
        pauses: ["지금 봐야 할 건"],
      },
      durationSec: SCENE_DURATIONS_30[2],
      sourceNote,
      riskNotes: ["No single-cause claim about rate decisions."],
    }),
    createSceneCard({
      sceneNumber: 4,
      sceneRole: "life_impact",
      sceneGoal: "금리 신호를 대출자, 예금자, 소비자의 다른 생활 영향으로 연결하기.",
      narration:
        "대출자는 이자 부담을, 저축자는 예금 조건을, 소비자는 현금흐름을 다르게 봐야 합니다.",
      spokenCaption: "대출자와 예금자는 다르게 봐야 합니다",
      sceneLabel: SCENE_LABEL_BY_ROLE.life_impact,
      screenText: ["대출", "예금", "현금흐름"],
      captionText: "대출자와 예금자는 다르게 봐야 합니다",
      emphasisWords: ["대출자", "예금자"],
      imagePrompt:
        "Vertical 9:16 editorial life-economy report style, loan repayment notice, savings maturity note, monthly cash flow checklist, economic signal card in the same scene, off-white background, charcoal navy cards, warm yellow accent, no text or numbers inside image.",
      visualTemplateId: "life_object",
      visualObjects: ["loan repayment notice", "savings maturity note", "cash flow checklist"],
      sourceCitationIds,
      voiceTiming: {
        pace: "normal",
        emphasisWords: ["이자 부담", "예금 조건", "현금흐름"],
        pauses: ["대출자는"],
      },
      durationSec: SCENE_DURATIONS_30[3],
      sourceNote,
      riskNotes: ["Life impact must not imply the same effect for every viewer."],
    }),
    createSceneCard({
      sceneNumber: 5,
      sceneRole: "watch_scenario_outlook",
      sceneGoal: "다음 금리 경로를 확정하지 않고 물가, 경기지표, 대출금리 관찰 포인트 제시하기.",
      narration:
        "다음에는 금리 자체보다 물가, 경기지표, 실제 대출금리가 같이 움직이는지를 봐야 합니다.",
      spokenCaption: "다음은 물가와 대출금리를 보세요",
      sceneLabel: SCENE_LABEL_BY_ROLE.watch_scenario_outlook,
      screenText: ["물가", "경기지표", "대출금리"],
      captionText: "다음은 물가와 대출금리를 보세요",
      emphasisWords: ["대출금리"],
      imagePrompt:
        "Vertical 9:16 editorial life-economy report style, calendar watch card, inflation and loan-rate clue cards, scenario cards, blue-gray support color, charcoal navy card space, warm yellow accent, no text or numbers inside image.",
      visualTemplateId: "clue_cards",
      visualObjects: ["calendar watch card", "loan-rate clue card", "scenario cards"],
      sourceCitationIds,
      voiceTiming: {
        pace: "normal",
        emphasisWords: ["물가", "경기지표", "대출금리"],
        pauses: ["다음에는"],
      },
      durationSec: SCENE_DURATIONS_30[4],
      sourceNote,
      riskNotes: ["Scenario outlook must not become a rate forecast."],
    }),
    createSceneCard({
      sceneNumber: 6,
      sceneRole: "action_closing",
      sceneGoal: "투자 권유 없이 대출 조건, 고정비/변동비, 현금흐름 점검으로 마무리하기.",
      narration:
        "이번 달은 대출 조건과 고정비, 변동비를 나눠 현금흐름부터 점검해보세요.",
      spokenCaption: "이번 달은 현금흐름부터 점검하세요",
      sceneLabel: SCENE_LABEL_BY_ROLE.action_closing,
      screenText: ["대출 조건", "고정비", "현금흐름"],
      captionText: "이번 달은 현금흐름부터 점검하세요",
      emphasisWords: ["현금흐름"],
      imagePrompt:
        "Vertical 9:16 editorial life-economy report style, action checklist, loan condition note, fixed and variable expense notes, calm practical closing scene, off-white and charcoal navy, warm yellow check marks, no text or numbers inside image.",
      visualTemplateId: "action_checklist",
      visualObjects: ["action checklist", "loan condition note", "expense notes"],
      sourceCitationIds,
      voiceTiming: {
        pace: "slow",
        emphasisWords: ["대출 조건", "현금흐름"],
        pauses: ["이번 달은"],
      },
      durationSec: SCENE_DURATIONS_30[5],
      sourceNote,
      riskNotes: ["Action must remain a financial check, not a loan or product recommendation."],
    }),
  ];
}

export function createFixedSixSceneCardsFromSignalTranslationBrief(
  brief: SignalTranslationBrief,
  factCard: FactCard,
  options: MoneyShortsScenePackageGeneratorOptions = {},
): SceneCard[] {
  const templateId = resolveSignalTranslationTemplateId(factCard, options);

  if (templateId === "exchange_rate_life_economy_v1") {
    return createExchangeRateSceneCards(factCard, brief);
  }

  if (templateId === "interest_rate_life_economy_v1") {
    return createInterestRateSceneCards(factCard, brief);
  }

  if (templateId === "inflation_life_economy_v1") {
    return createInflationSceneCards(factCard, brief);
  }

  return createGenericIndicatorSceneCards(factCard, brief);
}

export function createMoneyShortsScenePackageFromFactCard(
  factCard: FactCard,
  options: MoneyShortsScenePackageGeneratorOptions = {},
): MoneyShortsScenePackage {
  const templateId = resolveSignalTranslationTemplateId(factCard, options);
  const brief = createSignalTranslationBriefFromFactCard(factCard, {
    ...options,
    templateId,
  });
  const sceneCards = createFixedSixSceneCardsFromSignalTranslationBrief(
    brief,
    factCard,
    { ...options, templateId },
  );
  const allowedCitationIds = getCitationIds(factCard);
  const sceneCardValidation = validateSceneCardsForGeneration(sceneCards);
  const citationValidation = validateSignalTranslationCitationIds(
    brief,
    sceneCards,
    allowedCitationIds,
  );

  return {
    id: options.packageId ?? `money-shorts-scene-package-${factCard.id}`,
    factCardId: factCard.id,
    templateId,
    targetDurationSec: options.targetDurationSec ?? 30,
    brief,
    sceneCards,
    sceneCardValidation,
    citationValidation,
    warnings:
      templateId === "generic_indicator_life_economy_v1"
        ? ["Generic indicator fallback. Owner review required before publication."]
        : [],
  };
}
