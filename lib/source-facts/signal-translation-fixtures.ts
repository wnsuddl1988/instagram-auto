import { exchangeRateFactCard, inflationFactCard, interestRateFactCard } from "./fixtures";
import { createMoneyShortsScenePackageFromFactCard } from "./signal-translation-generator";
import { buildMoneyShortsScenePackageQaReport } from "./signal-translation-package-qa";
import {
  CAPTION_SYSTEM_V1,
  SCENE_LABEL_BY_ROLE,
  validateFixedSixSceneCards,
  validateSceneCardsForGeneration,
  validateSignalTranslationCitationIds,
} from "./signal-translation";
import type {
  SceneCard,
  SignalTranslationBrief,
} from "./signal-translation";

const exchangeRateCitationIds = exchangeRateFactCard.citations.map((citation) => citation.id);

export const exchangeRateSignalTranslationBrief: SignalTranslationBrief = {
  id: "signal-translation-brief-mock-usd-krw",
  factCardId: exchangeRateFactCard.id,
  signalSummary:
    "원/달러 환율이 이전 기준값보다 오른 mock 경제 신호다.",
  keyReasons: [
    "달러가 비싸지면 수입품과 해외결제 비용이 함께 움직일 수 있다.",
    "환율은 한 번의 숫자보다 높은 수준이 얼마나 오래 이어지는지가 중요하다.",
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
    "환율 상승은 해외여행 비용만이 아니라 수입식품, 기름값, 해외결제, 카드값 같은 변동비 체감으로 이어질 수 있다.",
  volatilityWatch: [
    "원/달러 환율이 높은 수준에서 얼마나 오래 유지되는지",
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
  sourceCitationIds: exchangeRateCitationIds,
  riskNotes: [
    "Mock fixture 예시값이며 실제 발행용이 아님.",
    "환율 전망 단정과 투자 권유 금지.",
  ],
};

const defaultImageTextPolicy = {
  allowedText: [],
  forbiddenText: [
    "unverified numbers",
    "investment return claims",
    "extra subtitles",
    "source text not backed by citation",
  ],
};

const sourceNote = `출처: ${exchangeRateFactCard.sourceName} (${exchangeRateFactCard.dataPeriod})`;

export const exchangeRateSceneCards30: SceneCard[] = [
  {
    sceneNumber: 1,
    sceneRole: "hook",
    sceneGoal: "환율 신호를 해외여행 비용보다 넓은 생활비 질문으로 열기.",
    narration: "환율이 오르면 해외여행만 비싸질까요?",
    spokenCaption: "환율 오르면 여행비만 비쌀까?",
    hookTitle: "환율 오르면 여행비만?",
    sceneLabel: SCENE_LABEL_BY_ROLE.hook,
    screenText: ["환율", "여행비", "카드값"],
    captionBlocks: [
      {
        startSec: 0,
        endSec: 4,
        text: "환율 오르면 여행비만 비쌀까?",
        emphasisWords: ["환율"],
      },
    ],
    imagePrompt:
      "Vertical 9:16 editorial life-economy report style, travel suitcase, credit card statement, USD/KRW signal card, off-white and charcoal navy palette, warm yellow accent, clean space for Korean hook title overlay, no text inside image.",
    visualTemplateId: "signal_card",
    visualObjects: ["travel suitcase", "credit card statement", "USD/KRW signal card"],
    sourceCitationIds: exchangeRateCitationIds,
    imageTextPolicy: defaultImageTextPolicy,
    voiceTiming: {
      pace: "fast",
      emphasisWords: ["환율", "해외여행"],
      pauses: ["환율이 오르면"],
    },
    layoutSafeZone: {
      hookTitle: CAPTION_SYSTEM_V1.hookTitle,
      spokenCaption: CAPTION_SYSTEM_V1.spokenCaption,
      sourceNote: CAPTION_SYSTEM_V1.sourceNote,
    },
    durationSec: 4,
    sourceNote,
    riskNotes: ["Hook must not imply guaranteed price increases."],
  },
  {
    sceneNumber: 2,
    sceneRole: "signal",
    sceneGoal: "Fact Card 범위 안에서 환율 상승 신호와 출처를 제시하기.",
    narration:
      "이번 신호는 원달러 환율이 이전 기준값보다 오른 예시 데이터에서 시작합니다.",
    spokenCaption: "원달러 환율이 오른 신호입니다",
    sceneLabel: SCENE_LABEL_BY_ROLE.signal,
    screenText: [exchangeRateFactCard.indicatorName, exchangeRateFactCard.currentValue],
    captionBlocks: [
      {
        startSec: 4,
        endSec: 9,
        text: "원달러 환율이 오른 신호입니다",
        emphasisWords: ["환율"],
      },
    ],
    imagePrompt:
      "Vertical 9:16 editorial life-economy report style, clean economic signal card, exchange rate dashboard object, source card placeholder without readable text, off-white background, charcoal navy card, warm yellow accent, no unverified text or numbers inside image.",
    visualTemplateId: "signal_card",
    visualObjects: ["economic signal card", "exchange rate dashboard object"],
    sourceCitationIds: exchangeRateCitationIds,
    imageTextPolicy: defaultImageTextPolicy,
    voiceTiming: {
      pace: "normal",
      emphasisWords: ["원달러 환율", "예시 데이터"],
      pauses: ["이번 신호는"],
    },
    layoutSafeZone: {
      spokenCaption: CAPTION_SYSTEM_V1.spokenCaption,
      sourceNote: CAPTION_SYSTEM_V1.sourceNote,
    },
    durationSec: 5,
    sourceNote,
    riskNotes: ["Use only Fact Card-backed exchange-rate values."],
  },
  {
    sceneNumber: 3,
    sceneRole: "why_expert_interpretation",
    sceneGoal: "환율 숫자 하나보다 유지 기간과 연결 비용을 봐야 한다는 해석 제시.",
    narration:
      "지금 봐야 할 건 환율 숫자 하나가 아니라, 높은 수준이 얼마나 오래 이어지는지입니다.",
    spokenCaption: "숫자 하나보다 지속 기간을 봐야 합니다",
    sceneLabel: SCENE_LABEL_BY_ROLE.why_expert_interpretation,
    screenText: ["지속 기간", "수입 물가", "해외결제"],
    captionBlocks: [
      {
        startSec: 9,
        endSec: 15,
        text: "숫자 하나보다 지속 기간을 봐야 합니다",
        emphasisWords: ["지속 기간"],
      },
    ],
    imagePrompt:
      "Vertical 9:16 editorial life-economy report style, clue cards connected by thin lines, exchange rate level, imported goods, overseas payment icons as abstract objects, charcoal navy and light gray, warm yellow check marks, no text inside image.",
    visualTemplateId: "clue_cards",
    visualObjects: ["clue cards", "connection lines", "overseas payment object"],
    sourceCitationIds: exchangeRateCitationIds,
    imageTextPolicy: defaultImageTextPolicy,
    voiceTiming: {
      pace: "normal",
      emphasisWords: ["높은 수준", "얼마나 오래"],
      pauses: ["지금 봐야 할 건"],
    },
    layoutSafeZone: {
      spokenCaption: CAPTION_SYSTEM_V1.spokenCaption,
      sourceNote: CAPTION_SYSTEM_V1.sourceNote,
    },
    durationSec: 6,
    sourceNote,
    riskNotes: ["No deterministic FX forecast."],
  },
  {
    sceneNumber: 4,
    sceneRole: "life_impact",
    sceneGoal: "환율 신호를 장바구니, 기름값, 해외결제, 카드값과 연결하기.",
    narration:
      "달러가 비싸지면 수입식품, 기름값, 해외결제 비용이 같이 움직일 수 있습니다.",
    spokenCaption: "장바구니와 카드값도 흔들릴 수 있습니다",
    sceneLabel: SCENE_LABEL_BY_ROLE.life_impact,
    screenText: ["장바구니", "기름값", "카드값"],
    captionBlocks: [
      {
        startSec: 15,
        endSec: 21,
        text: "장바구니와 카드값도 흔들릴 수 있습니다",
        emphasisWords: ["카드값"],
      },
    ],
    imagePrompt:
      "Vertical 9:16 editorial life-economy report style, grocery basket, gas receipt, overseas card payment notification, economic signal card in the same scene, off-white background, charcoal navy cards, warm yellow accent, no text or numbers inside image.",
    visualTemplateId: "life_object",
    visualObjects: ["grocery basket", "gas receipt", "card payment notification"],
    sourceCitationIds: exchangeRateCitationIds,
    imageTextPolicy: defaultImageTextPolicy,
    voiceTiming: {
      pace: "normal",
      emphasisWords: ["수입식품", "해외결제 비용"],
      pauses: ["달러가 비싸지면"],
    },
    layoutSafeZone: {
      spokenCaption: CAPTION_SYSTEM_V1.spokenCaption,
      sourceNote: CAPTION_SYSTEM_V1.sourceNote,
    },
    durationSec: 6,
    sourceNote,
    riskNotes: ["Life impact must remain a possibility, not a guaranteed outcome."],
  },
  {
    sceneNumber: 5,
    sceneRole: "watch_scenario_outlook",
    sceneGoal: "전망 단정 대신 높은 수준 지속 여부를 관찰 포인트로 제시하기.",
    narration:
      "환율이 높은 수준에서 오래 머물면 변동비 부담이 누적되는지 봐야 합니다.",
    spokenCaption: "높은 수준이 오래 가는지 봐야 합니다",
    sceneLabel: SCENE_LABEL_BY_ROLE.watch_scenario_outlook,
    screenText: ["관찰", "지속 기간", "변동비"],
    captionBlocks: [
      {
        startSec: 21,
        endSec: 25,
        text: "높은 수준이 오래 가는지 봐야 합니다",
        emphasisWords: ["오래"],
      },
    ],
    imagePrompt:
      "Vertical 9:16 editorial life-economy report style, calendar watch card, volatility clue cards, variable expense checklist, blue-gray support color, charcoal navy text card space, warm yellow accent, no text inside image.",
    visualTemplateId: "clue_cards",
    visualObjects: ["calendar", "volatility clue cards", "variable expense checklist"],
    sourceCitationIds: exchangeRateCitationIds,
    imageTextPolicy: defaultImageTextPolicy,
    voiceTiming: {
      pace: "normal",
      emphasisWords: ["높은 수준", "변동비"],
      pauses: ["오래 머물면"],
    },
    layoutSafeZone: {
      spokenCaption: CAPTION_SYSTEM_V1.spokenCaption,
      sourceNote: CAPTION_SYSTEM_V1.sourceNote,
    },
    durationSec: 4,
    sourceNote,
    riskNotes: ["Scenario outlook must not become deterministic forecast."],
  },
  {
    sceneNumber: 6,
    sceneRole: "action_closing",
    sceneGoal: "투자 권유 없이 해외결제와 변동비 점검 행동으로 마무리하기.",
    narration: "이번 달은 해외결제와 변동비를 먼저 점검해보세요.",
    spokenCaption: "이번 달은 변동비부터 점검하세요",
    sceneLabel: SCENE_LABEL_BY_ROLE.action_closing,
    screenText: ["해외결제", "변동비", "점검"],
    captionBlocks: [
      {
        startSec: 25,
        endSec: 30,
        text: "이번 달은 변동비부터 점검하세요",
        emphasisWords: ["변동비"],
      },
    ],
    imagePrompt:
      "Vertical 9:16 editorial life-economy report style, action checklist, card statement, variable expense notes, calm practical closing scene, off-white and charcoal navy, warm yellow check marks, no text or numbers inside image.",
    visualTemplateId: "action_checklist",
    visualObjects: ["action checklist", "card statement", "variable expense notes"],
    sourceCitationIds: exchangeRateCitationIds,
    imageTextPolicy: defaultImageTextPolicy,
    voiceTiming: {
      pace: "slow",
      emphasisWords: ["해외결제", "변동비"],
      pauses: ["이번 달은"],
    },
    layoutSafeZone: {
      spokenCaption: CAPTION_SYSTEM_V1.spokenCaption,
      sourceNote: CAPTION_SYSTEM_V1.sourceNote,
    },
    durationSec: 5,
    sourceNote,
    riskNotes: ["Action must remain a spending check, not investment advice."],
  },
];

export const exchangeRateSceneCardSequenceValidation =
  validateFixedSixSceneCards(exchangeRateSceneCards30);

export const exchangeRateSceneCardGenerationValidation =
  validateSceneCardsForGeneration(exchangeRateSceneCards30);

export const exchangeRateSignalTranslationCitationValidation =
  validateSignalTranslationCitationIds(
    exchangeRateSignalTranslationBrief,
    exchangeRateSceneCards30,
    exchangeRateCitationIds,
  );

export const exchangeRateGeneratedSignalTranslationPackage =
  createMoneyShortsScenePackageFromFactCard(exchangeRateFactCard);

export const interestRateGeneratedSignalTranslationPackage =
  createMoneyShortsScenePackageFromFactCard(interestRateFactCard);

export const inflationGeneratedSignalTranslationPackage =
  createMoneyShortsScenePackageFromFactCard(inflationFactCard);

export const exchangeRateGeneratedSignalTranslationPackageQaReport =
  buildMoneyShortsScenePackageQaReport(exchangeRateGeneratedSignalTranslationPackage);

export const interestRateGeneratedSignalTranslationPackageQaReport =
  buildMoneyShortsScenePackageQaReport(interestRateGeneratedSignalTranslationPackage);

export const inflationGeneratedSignalTranslationPackageQaReport =
  buildMoneyShortsScenePackageQaReport(inflationGeneratedSignalTranslationPackage);

export const MOCK_SIGNAL_TRANSLATION_BRIEFS: SignalTranslationBrief[] = [
  exchangeRateSignalTranslationBrief,
  exchangeRateGeneratedSignalTranslationPackage.brief,
  interestRateGeneratedSignalTranslationPackage.brief,
  inflationGeneratedSignalTranslationPackage.brief,
];

export const MOCK_SCENE_CARD_SETS: SceneCard[][] = [
  exchangeRateSceneCards30,
  exchangeRateGeneratedSignalTranslationPackage.sceneCards,
  interestRateGeneratedSignalTranslationPackage.sceneCards,
  inflationGeneratedSignalTranslationPackage.sceneCards,
];
