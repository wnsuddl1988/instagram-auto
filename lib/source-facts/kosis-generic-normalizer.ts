import type { RawDataSnapshot } from "./types";
import type { KosisStatRow, KosisStatSearchRequest } from "./kosis-connector";

// ── KOSIS generic two-period normalizer ────────────────────────────────────────
// ecos-generic-normalizer.ts와 같은 패턴, KosisStatRow 필드명(PRD_DE/DT/UNIT_NM
// 등)에 맞춘 버전.

function parseKosisValue(val: string): number {
  return parseFloat(val.replace(/,/g, ""));
}

function displaySuffixFor(unitName: string): string {
  if (unitName === "%") return "%";
  if (unitName === "천명" || unitName === "명") return unitName;
  return "";
}

function kosisPeriodToDataPeriod(prdDe: string): string {
  if (/^\d{6}$/.test(prdDe)) {
    const year = prdDe.slice(0, 4);
    const month = String(parseInt(prdDe.slice(4, 6), 10));
    return `${year}년 ${month}월`;
  }
  return prdDe;
}

export function normalizeKosisGenericRows(
  rows: readonly KosisStatRow[],
  fetchedAt: string,
  request: KosisStatSearchRequest,
): RawDataSnapshot | null {
  if (rows.length < 2) return null;
  if (request.publishedDate.trim().length === 0) return null;

  const cur = rows[0];
  const prev = rows[1];

  const curVal = parseKosisValue(cur.DT);
  const prevVal = parseKosisValue(prev.DT);
  if (isNaN(curVal) || isNaN(prevVal)) return null;

  const chgVal = parseFloat((curVal - prevVal).toFixed(4));
  const chgRate = prevVal !== 0 ? chgVal / prevVal : 0;

  const curDecimals = (cur.DT.split(".")[1] ?? "").length;
  const prevDecimals = (prev.DT.split(".")[1] ?? "").length;
  const maxDecimals = Math.max(curDecimals, prevDecimals, 1);

  const suffix = displaySuffixFor(cur.UNIT_NM);
  const changeSuffix = suffix === "%" ? "%p" : suffix;

  const currentValueText = `${curVal.toFixed(maxDecimals)}${suffix}`;
  const previousValueText = `${prevVal.toFixed(maxDecimals)}${suffix}`;
  const changeSign = chgVal > 0 ? "+" : "";
  const changeValueText = `${changeSign}${chgVal.toFixed(maxDecimals)}${changeSuffix}`;

  const dataPeriod = kosisPeriodToDataPeriod(cur.PRD_DE);
  const publishedDate = request.publishedDate;
  const snapshotId = `raw-kosis-${cur.TBL_ID}-${cur.ITM_ID}-${cur.PRD_DE}`;
  const sourceProviderId = request.sourceProviderId ?? "provider-kosis-mock";

  return {
    id: snapshotId,
    sourceProviderId,
    sourceName: request.sourceName,
    sourceUrl: request.sourcePageUrl,
    fetchedAt,
    publishedDate,
    dataPeriod,
    collectionMethod: "api",
    rawPayload: {
      statCode: cur.TBL_ID,
      itemCode: cur.ITM_ID,
      indicatorName: cur.ITM_NM,
      unit: cur.UNIT_NM,
      currentValue: curVal,
      previousValue: prevVal,
      changeValue: chgVal,
      currentValueText,
      previousValueText,
      changeValueText,
      dataPeriod,
      publishedDate,
      apiEndpointUrl: "https://kosis.kr/openapi/Param/statisticsParameterData.do",
      sourceUrl: request.sourcePageUrl,
      citationLabel: `${request.sourceName} ${dataPeriod}`,
      changeRateNumericValue: parseFloat((chgRate * 100).toFixed(4)),
      ...(request.sourceDateSourceName !== undefined && {
        sourceDateSourceName: request.sourceDateSourceName,
        sourceDateSourceUrl: request.sourceDateSourceUrl,
      }),
    },
  };
}
