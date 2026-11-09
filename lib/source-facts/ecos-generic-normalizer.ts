import type { RawDataSnapshot } from "./types";
import type { EcosStatRow, EcosStatSearchRequest } from "./ecos-connector";
import { ecosTimeToDataPeriod } from "./ecos-normalizer";

// ── ECOS generic two-period normalizer (non-percent units) ────────────────────
//
// normalizeEcosBaseRateRows() (ecos-normalizer.ts) hardcodes "%" / "%p" suffixes
// on every display string — correct for the base rate and CPI's own YoY %, but
// wrong for an index level (CPI total index, unit "2020=100") or an FX rate
// (unit "원"). This function builds the same RawDataSnapshot shape but reads
// the unit suffix from the ECOS row's own UNIT_NAME instead of assuming "%".
//
// Deliberately a separate function — normalizeEcosBaseRateRows() is relied upon
// by the base-rate path and must not change.

function parseEcosValue(val: string): number {
  return parseFloat(val.replace(/,/g, ""));
}

/** Maps a raw ECOS UNIT_NAME to the display suffix appended after a value. */
function displaySuffixFor(unitName: string): string {
  if (unitName === "원") return "원";
  if (unitName === "%" || unitName === "연%") return "%";
  if (unitName.startsWith("백만달러")) return "백만달러";
  // Index levels ("2020=100" etc.) and anything else: no suffix, the index
  // is unitless in display (e.g. "120.05"), UNIT_NAME goes in payload.unit only.
  return "";
}

export function normalizeEcosGenericRows(
  rows: readonly EcosStatRow[],
  fetchedAt: string,
  request: EcosStatSearchRequest,
): RawDataSnapshot | null {
  if (rows.length < 2) return null;
  if (request.publishedDate.trim().length === 0) return null;

  const cur = rows[0];
  const prev = rows[1];

  const curVal = parseEcosValue(cur.DATA_VALUE);
  const prevVal = parseEcosValue(prev.DATA_VALUE);
  if (isNaN(curVal) || isNaN(prevVal)) return null;

  const chgVal = parseFloat((curVal - prevVal).toFixed(4));
  const chgRate = prevVal !== 0 ? chgVal / prevVal : 0;

  const curDecimals = (cur.DATA_VALUE.split(".")[1] ?? "").length;
  const prevDecimals = (prev.DATA_VALUE.split(".")[1] ?? "").length;
  const maxDecimals = Math.max(curDecimals, prevDecimals, 1);

  const suffix = displaySuffixFor(cur.UNIT_NAME);
  const changeSuffix = suffix === "%" ? "%p" : suffix;

  const currentValueText = `${curVal.toFixed(maxDecimals)}${suffix}`;
  const previousValueText = `${prevVal.toFixed(maxDecimals)}${suffix}`;
  const changeSign = chgVal > 0 ? "+" : "";
  const changeValueText = `${changeSign}${chgVal.toFixed(maxDecimals)}${changeSuffix}`;

  const dataPeriod = ecosTimeToDataPeriod(cur.TIME);
  const publishedDate = request.publishedDate;
  const snapshotId = `raw-ecos-${cur.STAT_CODE}-${cur.ITEM_CODE1}-${cur.TIME}`;
  const sourceProviderId = request.sourceProviderId ?? "provider-ecos-mock";

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
      statCode: cur.STAT_CODE,
      itemCode: cur.ITEM_CODE1,
      indicatorName: cur.ITEM_NAME1,
      unit: cur.UNIT_NAME,
      currentValue: curVal,
      previousValue: prevVal,
      changeValue: chgVal,
      currentValueText,
      previousValueText,
      changeValueText,
      dataPeriod,
      publishedDate,
      apiEndpointUrl: "https://ecos.bok.or.kr/api/StatisticSearch/",
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
