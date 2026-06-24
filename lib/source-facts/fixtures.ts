import type { FactCard, SourceProvider } from "./types";

export const MOCK_SOURCE_PROVIDERS: SourceProvider[] = [
  {
    id: "provider-kosis-mock",
    name: "통계청/KOSIS 예시",
    providerType: "kosis",
    baseUrl: "https://kosis.kr",
    licenseNote: "Mock fixture only. Verify official terms before commercial use.",
    commercialUseStatus: "needs_review",
    requiresApiKey: false,
    isActive: true,
  },
  {
    id: "provider-fx-manual-mock",
    name: "수동 입력 환율 예시",
    providerType: "manual",
    baseUrl: "https://example.com",
    licenseNote: "Mock fixture only. Replace with a verified official source.",
    commercialUseStatus: "needs_review",
    requiresApiKey: false,
    isActive: true,
  },
  {
    id: "provider-opendart-mock",
    name: "OpenDART 예시",
    providerType: "opendart",
    baseUrl: "https://opendart.fss.or.kr",
    licenseNote: "Mock fixture only. Verify OpenDART terms before commercial use.",
    commercialUseStatus: "needs_review",
    requiresApiKey: true,
    isActive: true,
  },
];

export const inflationFactCard: FactCard = {
  id: "fact-card-mock-inflation-cpi",
  isMock: true,
  isPublishable: false,
  primarySourceProviderId: "provider-kosis-mock",
  citations: [
    {
      id: "citation-mock-inflation-kosis",
      sourceProviderId: "provider-kosis-mock",
      sourceName: "통계청/KOSIS 예시",
      sourceUrl: "https://kosis.kr",
      publishedDate: "2026-06-01",
      dataPeriod: "2026-05",
      citationLabel: "KOSIS 소비자물가 상승률 예시",
      licenseNote: "Mock citation. Verify official terms before use.",
      commercialUseStatus: "needs_review",
    },
  ],
  sourceName: "통계청/KOSIS 예시",
  sourceUrl: "https://kosis.kr",
  publishedDate: "2026-06-01",
  dataPeriod: "2026-05",
  retrievedAt: "2026-06-25T00:00:00+09:00",
  indicatorName: "소비자물가 상승률",
  currentValue: "2.7",
  previousValue: "2.9",
  changeValue: "-0.2",
  changeRate: "-6.9%",
  unit: "%",
  currentNumericValue: 2.7,
  previousNumericValue: 2.9,
  changeNumericValue: -0.2,
  changeRateNumericValue: -6.9,
  comparisonType: "previous_month",
  interpretation:
    "물가 상승률은 전월보다 둔화된 예시 상황이지만 생활비 부담은 여전히 남아 있을 수 있다.",
  cautionNote:
    "Mock fixture 예시값이며 실제 발행용이 아님. 공식 원자료 확인 전 콘텐츠에 사용하지 말 것.",
  allowedClaims: [
    "물가 상승률이 전월 대비 둔화된 예시 Fact Card다.",
    "생활비 부담은 개인 상황에 따라 다르게 체감될 수 있다.",
  ],
  blockedClaims: [
    "물가가 확실히 잡혔다고 단정하지 않는다.",
    "투자 매수/매도 판단으로 연결하지 않는다.",
  ],
  contentCategory: "source_based_finance",
};

export const exchangeRateFactCard: FactCard = {
  id: "fact-card-mock-usd-krw",
  isMock: true,
  isPublishable: false,
  primarySourceProviderId: "provider-fx-manual-mock",
  citations: [
    {
      id: "citation-mock-usd-krw",
      sourceProviderId: "provider-fx-manual-mock",
      sourceName: "수동 입력 환율 예시",
      sourceUrl: "https://example.com/fx/usd-krw",
      publishedDate: "2026-06-20",
      dataPeriod: "2026-06-20",
      citationLabel: "원/달러 환율 예시",
      licenseNote: "Mock citation. Replace with a verified market data source.",
      commercialUseStatus: "needs_review",
    },
  ],
  sourceName: "수동 입력 환율 예시",
  sourceUrl: "https://example.com/fx/usd-krw",
  publishedDate: "2026-06-20",
  dataPeriod: "2026-06-20",
  retrievedAt: "2026-06-25T00:00:00+09:00",
  indicatorName: "원/달러 환율",
  currentValue: "1390",
  previousValue: "1365",
  changeValue: "25",
  changeRate: "1.8%",
  unit: "KRW/USD",
  currentNumericValue: 1390,
  previousNumericValue: 1365,
  changeNumericValue: 25,
  changeRateNumericValue: 1.8,
  comparisonType: "previous_release",
  interpretation:
    "원/달러 환율이 이전 기준값보다 오른 예시 상황으로, 수입 물가와 여행비 부담을 설명할 수 있다.",
  cautionNote:
    "Mock fixture 예시값이며 실제 발행용이 아님. 공식/검증된 환율 데이터 확인 전 콘텐츠에 사용하지 말 것.",
  allowedClaims: [
    "환율 상승은 수입 물가와 해외 결제 부담에 영향을 줄 수 있다.",
  ],
  blockedClaims: [
    "환율 방향을 확정적으로 예측하지 않는다.",
    "특정 자산 매수 권유로 연결하지 않는다.",
  ],
  contentCategory: "source_based_finance",
};

export const dartDisclosureFactCard: FactCard = {
  id: "fact-card-mock-dart-earnings",
  isMock: true,
  isPublishable: false,
  primarySourceProviderId: "provider-opendart-mock",
  citations: [
    {
      id: "citation-mock-dart-earnings",
      sourceProviderId: "provider-opendart-mock",
      sourceName: "OpenDART 예시",
      sourceUrl: "https://opendart.fss.or.kr",
      publishedDate: "2026-05-15",
      dataPeriod: "2026 Q1",
      citationLabel: "분기보고서 실적 예시",
      licenseNote: "Mock citation. Verify OpenDART terms before commercial use.",
      commercialUseStatus: "needs_review",
    },
  ],
  sourceName: "OpenDART 예시",
  sourceUrl: "https://opendart.fss.or.kr",
  publishedDate: "2026-05-15",
  dataPeriod: "2026 Q1",
  retrievedAt: "2026-06-25T00:00:00+09:00",
  indicatorName: "영업이익",
  currentValue: "1.2조",
  previousValue: "1.0조",
  changeValue: "0.2조",
  changeRate: "20.0%",
  unit: "KRW",
  currentNumericValue: 1_200_000_000_000,
  previousNumericValue: 1_000_000_000_000,
  changeNumericValue: 200_000_000_000,
  changeRateNumericValue: 20,
  comparisonType: "previous_year",
  interpretation:
    "영업이익이 전년 동기 대비 증가한 예시 상황으로, 매출 구조와 비용 변화를 함께 확인해야 한다.",
  cautionNote:
    "Mock fixture 예시값이며 실제 발행용이 아님. 실제 공시 원문과 재무제표 확인 전 콘텐츠에 사용하지 말 것.",
  allowedClaims: [
    "영업이익 변화는 기업 실적을 볼 때 확인할 핵심 숫자 중 하나다.",
  ],
  blockedClaims: [
    "실적 증가만으로 주가 상승을 단정하지 않는다.",
    "특정 종목 매수를 권유하지 않는다.",
  ],
  contentCategory: "source_based_finance",
};

export const MOCK_FACT_CARDS: FactCard[] = [
  inflationFactCard,
  exchangeRateFactCard,
  dartDisclosureFactCard,
];
