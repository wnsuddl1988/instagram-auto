import type { RawDataSnapshot } from "./types";
import type { ManualFactCardDraft } from "./manual";
import type { RawSnapshotParser } from "./raw-snapshot-parser";
import { generateCandidateFromSnapshot } from "./raw-snapshot-parser";

// ── Mock raw snapshot: 한국은행 기준금리 (ECOS 계열, mock) ─────────────────────

/**
 * Simulates what an ECOS API response would look like after being stored
 * as a RawDataSnapshot. rawPayload mirrors a simplified ECOS stat row.
 * No live network call — all values are hardcoded from the 2025-01-16 BOK release.
 */
export const mockEcosBaseRateSnapshot: RawDataSnapshot = {
  id: "raw-ecos-base-rate-2025-01",
  sourceProviderId: "provider-ecos-mock",
  sourceName: "한국은행 ECOS — 기준금리",
  sourceUrl: "https://ecos.bok.or.kr/api/StatisticSearch/",
  fetchedAt: "2026-06-25T00:00:00+09:00",
  publishedDate: "2025-01-16",
  dataPeriod: "2025년 1월",
  collectionMethod: "api",
  rawPayload: {
    statCode: "722Y001",
    itemCode: "0101000",
    indicatorName: "기준금리",
    unit: "%",
    currentValue: 3.0,
    previousValue: 3.25,
    changeValue: -0.25,
    currentValueText: "3.0%",
    previousValueText: "3.25%",
    changeValueText: "-0.25%p",
    dataPeriod: "2025년 1월",
    publishedDate: "2025-01-16",
    sourceUrl: "https://ecos.bok.or.kr/#/Short/722Y001",
    citationLabel: "한국은행 ECOS — 기준금리 통계 2025.01",
  },
};

// ── ECOS 기준금리 parser ────────────────────────────────────────────────────────

interface EcosBaseRatePayload {
  statCode: string;
  indicatorName: string;
  unit: string;
  currentValue: number;
  previousValue: number;
  changeValue: number;
  currentValueText: string;
  previousValueText: string;
  changeValueText: string;
  dataPeriod: string;
  publishedDate: string;
  sourceUrl: string;
  citationLabel: string;
}

function isEcosBaseRatePayload(raw: unknown): raw is EcosBaseRatePayload {
  if (typeof raw !== "object" || raw === null) return false;
  const r = raw as Record<string, unknown>;
  return (
    typeof r.statCode === "string" &&
    typeof r.indicatorName === "string" &&
    typeof r.unit === "string" &&
    typeof r.currentValue === "number" &&
    typeof r.previousValue === "number" &&
    typeof r.changeValue === "number" &&
    typeof r.currentValueText === "string" &&
    typeof r.previousValueText === "string" &&
    typeof r.changeValueText === "string" &&
    typeof r.dataPeriod === "string" &&
    typeof r.publishedDate === "string" &&
    typeof r.sourceUrl === "string" &&
    typeof r.citationLabel === "string"
  );
}

export const ecosBaseRateParser: RawSnapshotParser = {
  sourceProviderId: "provider-ecos-mock",
  parserName: "EcosBaseRateParser",

  parse(snapshot: RawDataSnapshot): ManualFactCardDraft | null {
    if (snapshot.sourceProviderId !== this.sourceProviderId) return null;
    if (!isEcosBaseRatePayload(snapshot.rawPayload)) return null;

    const p = snapshot.rawPayload;
    const cur = p.currentValue;
    const prev = p.previousValue;
    const chg = p.changeValue;
    const chgRate = prev !== 0 ? chg / prev : 0;

    const changeRateSign = chgRate > 0 ? "+" : "";

    return {
      id: `fact-card-generated-${snapshot.id}`,
      primarySourceProviderId: snapshot.sourceProviderId,
      sourceName: snapshot.sourceName,
      sourceUrl: snapshot.sourceUrl,
      publishedDate: snapshot.publishedDate,
      dataPeriod: p.dataPeriod,
      indicatorName: p.indicatorName,
      currentValue: p.currentValueText,
      previousValue: p.previousValueText,
      changeValue: p.changeValueText,
      changeRate: `${changeRateSign}${(chgRate * 100).toFixed(2)}%`,
      unit: p.unit,
      currentNumericValue: cur,
      previousNumericValue: prev,
      changeNumericValue: chg,
      changeRateNumericValue: parseFloat((chgRate * 100).toFixed(4)),
      comparisonType: "previous_release",
      interpretation: `한국은행이 ${p.dataPeriod} 기준금리를 ${p.previousValueText}에서 ${p.currentValueText}로 ${p.changeValueText} 조정했다.`,
      cautionNote: "기준금리 변경은 발표 시점 기준이며, 향후 추가 변동 가능성은 이 수치에 반영되어 있지 않다.",
      allowedClaims: [
        `${p.dataPeriod} 기준금리는 ${p.currentValueText}다.`,
        `직전 기준금리 대비 ${p.changeValueText} 변경됐다.`,
        `한국은행이 ${p.publishedDate} 기준금리를 결정했다.`,
      ],
      blockedClaims: [
        "금리 급등락",
        "폭등",
        "폭락",
        "지금 대출",
        "지금 투자",
        "금리 전망",
      ],
      contentCategory: "source_based_finance",
      citations: [
        {
          id: `citation-generated-${snapshot.id}`,
          sourceProviderId: snapshot.sourceProviderId,
          sourceName: snapshot.sourceName,
          sourceUrl: p.sourceUrl,
          publishedDate: snapshot.publishedDate,
          dataPeriod: p.dataPeriod,
          citationLabel: p.citationLabel,
          commercialUseStatus: "allowed",
        },
      ],
      isMock: true,
      isPublishable: false,
    };
  },
};

// ── Generated candidate result ─────────────────────────────────────────────────

/**
 * Auto-generated Fact Card candidate from the mock ECOS base rate snapshot.
 * Uses authorManualFactCard() + validation — no field invention.
 * Expected: ok=true, isMock=true, isPublishable=false.
 */
export const generatedBaseRateResult = generateCandidateFromSnapshot(
  ecosBaseRateParser,
  mockEcosBaseRateSnapshot,
);
