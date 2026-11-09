import type { RawDataSnapshot } from "./types";
import type { ManualFactCardDraft } from "./manual";
import type { RawSnapshotParser } from "./raw-snapshot-parser";
import { ECOS_LIVE_PROVIDER_ID } from "./candidates";

// ── Generic ECOS live parser (non-base-rate indicators) ────────────────────────
//
// ecosBaseRateLiveParser (candidates.ts) hardcodes "기준금리를 ... 조정했다" in
// its interpretation/allowedClaims text — correct for base_rate, wrong for any
// other indicator (CPI showed "기준금리를 119.77%에서 120.05%로 조정했다" before
// this module existed, which is nonsensical: CPI is an index level, not a
// policy rate). This parser builds the same claim shape generically from
// rawPayload.indicatorName/unit instead of a hardcoded "기준금리" string, so it
// works for cpi_total, fx_usd_krw, and any future ECOS indicator that reuses
// normalizeEcosBaseRateRows()'s payload shape.
//
// Deliberately a SEPARATE parser rather than editing ecosBaseRateLiveParser —
// the base-rate path is verified/relied-upon elsewhere and must not change.

interface EcosGenericPayload {
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
  sourceDateSourceName?: string;
  sourceDateSourceUrl?: string;
}

function isEcosGenericPayload(raw: unknown): raw is EcosGenericPayload {
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

/**
 * ECOS statCode -> whether this indicator's claim text should use base-rate
 * phrasing. base_rate (722Y001) is intentionally excluded here — it stays on
 * ecosBaseRateLiveParser. Any statCode NOT in this exclusion list is treated
 * generically (index-level / rate-level phrasing driven by indicatorName).
 */
const BASE_RATE_STAT_CODE = "722Y001";

export const ecosGenericLiveParser: RawSnapshotParser = {
  sourceProviderId: ECOS_LIVE_PROVIDER_ID,
  parserName: "EcosGenericLiveParser",

  parse(snapshot: RawDataSnapshot): ManualFactCardDraft | null {
    if (snapshot.sourceProviderId !== this.sourceProviderId) return null;
    if (!isEcosGenericPayload(snapshot.rawPayload)) return null;
    const p = snapshot.rawPayload;
    // Defer to ecosBaseRateLiveParser for the base rate — this parser only
    // handles everything else, so the two never compete for the same snapshot.
    if (p.statCode === BASE_RATE_STAT_CODE) return null;

    const cur = p.currentValue;
    const prev = p.previousValue;
    const chg = p.changeValue;
    const chgRate = prev !== 0 ? chg / prev : 0;
    const changeRateSign = chgRate > 0 ? "+" : "";
    const name = p.indicatorName;

    const interpretation =
      chg === 0
        ? `${p.dataPeriod} ${name}은(는) ${p.currentValueText}로 직전과 동일했다. 직전 대비 변동은 ${p.changeValueText}다.`
        : `${p.dataPeriod} ${name}은(는) ${p.previousValueText}에서 ${p.currentValueText}로 ${p.changeValueText} 변경됐다.`;

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
      interpretation,
      cautionNote: `${name} 수치는 발표 시점 기준이며, 향후 추가 변동 가능성은 이 수치에 반영되어 있지 않다.`,
      allowedClaims:
        chg === 0
          ? [
              `${p.dataPeriod} ${name}은(는) ${p.currentValueText}다.`,
              `직전 대비 변동은 ${p.changeValueText}다.`,
              `${snapshot.sourceName}이(가) ${p.publishedDate} 이 수치를 발표했다.`,
            ]
          : [
              `${p.dataPeriod} ${name}은(는) ${p.currentValueText}다.`,
              `직전 대비 ${p.changeValueText} 변경됐다.`,
              `${snapshot.sourceName}이(가) ${p.publishedDate} 이 수치를 발표했다.`,
            ],
      blockedClaims: [
        "급등락",
        "폭등",
        "폭락",
        "지금 대출",
        "지금 투자",
        "전망",
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
        ...(p.sourceDateSourceName !== undefined && p.sourceDateSourceUrl !== undefined
          ? [
              {
                id: `citation-source-date-${snapshot.id}`,
                sourceName: p.sourceDateSourceName,
                sourceUrl: p.sourceDateSourceUrl,
                publishedDate: snapshot.publishedDate,
                citationLabel: `${p.sourceDateSourceName} — 발표일 근거`,
                licenseNote: "공식 발표 채널에서 확인",
                commercialUseStatus: "allowed" as const,
              },
            ]
          : []),
      ],
      isMock: false,
      isPublishable: false,
    };
  },
};
