import { authorManualFactCard } from "./manual";
import type { ManualFactCardDraft, ManualFactCardAuthoringResult } from "./manual";

const MOCK_CREATED_AT = "2026-06-25T00:00:00+09:00";

/**
 * Valid manual draft: 2024년 12월 가계 부채 증가 (예시 소재).
 * All fields supplied by Owner — no inference.
 */
export const validHouseholdDebtDraft: ManualFactCardDraft = {
  id: "fact-card-manual-household-debt-2024-12",
  primarySourceProviderId: "provider-kosis-manual",
  sourceName: "한국은행 가계신용",
  sourceUrl: "https://www.bok.or.kr/portal/singl/pressRelease/view.do?nttId=10085030&menuNo=200690",
  publishedDate: "2025-02-25",
  dataPeriod: "2024년 4분기",
  indicatorName: "가계부채 잔액",
  currentValue: "1,896.2조 원",
  previousValue: "1,875.6조 원",
  changeValue: "+20.6조 원",
  changeRate: "+1.1%",
  unit: "조 원",
  currentNumericValue: 1896.2,
  previousNumericValue: 1875.6,
  changeNumericValue: 20.6,
  changeRateNumericValue: 1.1,
  comparisonType: "previous_release",
  interpretation: "2024년 4분기 기준 가계부채 잔액이 전분기 대비 20.6조 원 증가해 1,896.2조 원을 기록했다.",
  cautionNote: "가계부채 규모는 GDP 대비 비율 등 맥락 없이 단독 수치만 제시하면 오해를 유발할 수 있다.",
  allowedClaims: [
    "2024년 4분기 가계부채 잔액은 1,896.2조 원이다.",
    "전분기 대비 20.6조 원 증가했다.",
    "증가율은 1.1%다.",
  ],
  blockedClaims: [
    "가계부채가 위험 수준이다",
    "부채 폭등",
    "위기 임박",
    "지금 대출받아야",
  ],
  contentCategory: "source_based_finance",
  citations: [
    {
      id: "citation-manual-household-debt-bok-2025-02",
      sourceProviderId: "provider-kosis-manual",
      sourceName: "한국은행 가계신용",
      sourceUrl: "https://www.bok.or.kr/portal/singl/pressRelease/view.do?nttId=10085030&menuNo=200690",
      publishedDate: "2025-02-25",
      dataPeriod: "2024년 4분기",
      citationLabel: "한국은행 보도자료 — 가계신용(잠정) 2024년 4분기",
      commercialUseStatus: "allowed",
    },
  ],
  isMock: true,
  isPublishable: false,
  createdAt: MOCK_CREATED_AT,
};

/** Authoring result for the valid draft. Expected: ok=true, factCard non-null. */
export const validHouseholdDebtResult: ManualFactCardAuthoringResult =
  authorManualFactCard(validHouseholdDebtDraft);

/**
 * Broken draft: missing sourceName, sourceUrl, currentValue, and citations.
 * Expected: ok=false, multiple validation errors.
 */
export const brokenMissingFieldsDraft: ManualFactCardDraft = {
  id: "fact-card-manual-broken-missing-fields",
  primarySourceProviderId: "provider-kosis-manual",
  sourceName: "",           // BROKEN: empty
  sourceUrl: "not-a-url",   // BROKEN: not http(s)
  publishedDate: "2025-02-25",
  dataPeriod: "2024년 4분기",
  indicatorName: "가계부채",
  currentValue: "",         // BROKEN: empty
  previousValue: "N/A",
  changeValue: "N/A",
  changeRate: "N/A",
  unit: "조 원",
  comparisonType: "previous_release",
  interpretation: "테스트용 해석문.",
  cautionNote: "테스트용 주의사항.",
  allowedClaims: ["테스트 claim"],
  blockedClaims: [],
  contentCategory: "source_based_finance",
  citations: [],            // BROKEN: empty citations
  isMock: true,
  isPublishable: false,
  createdAt: MOCK_CREATED_AT,
};

/** Authoring result for the broken draft. Expected: ok=false, factCard=null. */
export const brokenMissingFieldsResult: ManualFactCardAuthoringResult =
  authorManualFactCard(brokenMissingFieldsDraft);
