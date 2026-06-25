import type { RawDataSnapshot } from "./types";
import type { EcosStatRow, EcosStatSearchRequest } from "./ecos-connector";
import {
  ECOS_BASE_RATE_REQUEST_JAN2025,
  createEcosMockTransport,
  runEcosConnector,
} from "./ecos-connector";
import { ECOS_BASE_RATE_ROWS_JAN2025 } from "./ecos-fixtures";
import { ecosBaseRateParser, generatedBaseRateResult as _existingResult } from "./candidates";
import { generateCandidateFromSnapshot } from "./raw-snapshot-parser";

// ── ECOS TIME string helper ────────────────────────────────────────────────────

/**
 * Converts an ECOS TIME string to a human-readable data period.
 * Monthly cycle only (YYYYMM → "YYYY년 M월").
 * Returns the raw string unchanged for unrecognised formats.
 */
export function ecosTimeToDataPeriod(time: string): string {
  if (/^\d{6}$/.test(time)) {
    const year = time.slice(0, 4);
    const month = String(parseInt(time.slice(4, 6), 10));
    return `${year}년 ${month}월`;
  }
  return time;
}

// ── Numeric helper ─────────────────────────────────────────────────────────────

function parseEcosValue(val: string): number {
  return parseFloat(val.replace(/,/g, ""));
}

// ── ECOS base-rate two-period normalizer ──────────────────────────────────────

/**
 * Normalizes a two-period ECOS base-rate row array into a RawDataSnapshot.
 *
 * Expects rows[0] = current period, rows[1] = previous period.
 * Returns null when fewer than 2 rows or DATA_VALUE cannot be parsed.
 *
 * publishedDate and sourcePageUrl come from the request spec — never derived
 * or computed inside this function. The resulting snapshot is compatible with
 * ecosBaseRateParser and generateCandidateFromSnapshot() without modification.
 */
export function normalizeEcosBaseRateRows(
  rows: readonly EcosStatRow[],
  fetchedAt: string,
  request: EcosStatSearchRequest,
): RawDataSnapshot | null {
  if (rows.length < 2) return null;

  const cur = rows[0];
  const prev = rows[1];

  const curVal = parseEcosValue(cur.DATA_VALUE);
  const prevVal = parseEcosValue(prev.DATA_VALUE);

  if (isNaN(curVal) || isNaN(prevVal)) return null;

  const chgVal = parseFloat((curVal - prevVal).toFixed(4));
  const chgRate = prevVal !== 0 ? chgVal / prevVal : 0;

  // Display strings: preserve decimal precision from the source value strings.
  const curDecimals = (cur.DATA_VALUE.split(".")[1] ?? "").length;
  const prevDecimals = (prev.DATA_VALUE.split(".")[1] ?? "").length;
  const maxDecimals = Math.max(curDecimals, prevDecimals, 1);

  const currentValueText = `${curVal.toFixed(maxDecimals)}%`;
  const previousValueText = `${prevVal.toFixed(maxDecimals)}%`;
  const changeSign = chgVal > 0 ? "+" : "";
  const changeValueText = `${changeSign}${chgVal.toFixed(maxDecimals)}%p`;

  const dataPeriod = ecosTimeToDataPeriod(cur.TIME);

  // publishedDate and sourcePageUrl are explicit from the request — never derived.
  const publishedDate = request.publishedDate;
  const snapshotId = `raw-ecos-${cur.STAT_CODE}-${cur.ITEM_CODE1}-${cur.TIME}`;

  return {
    id: snapshotId,
    sourceProviderId: "provider-ecos-mock",
    sourceName: request.sourceName,
    // Human-facing stat page URL — reviewable by Owner.
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
      // API endpoint preserved in rawPayload for traceability.
      apiEndpointUrl: "https://ecos.bok.or.kr/api/StatisticSearch/",
      sourceUrl: request.sourcePageUrl,
      citationLabel: `${request.sourceName} ${dataPeriod}`,
      changeRateNumericValue: parseFloat((chgRate * 100).toFixed(4)),
    },
  };
}

// ── Re-export existing candidate for comparison ────────────────────────────────
export { _existingResult as existingBaseRateResult };

// ── Connector scaffold: mock transport → snapshot → candidate ─────────────────

const MOCK_FETCHED_AT = "2026-06-25T00:00:00+09:00";

const mockTransport = createEcosMockTransport(
  ECOS_BASE_RATE_ROWS_JAN2025,
  MOCK_FETCHED_AT,
);

/**
 * Snapshot produced by running the ECOS connector scaffold end-to-end:
 *   mock transport → normalizeEcosBaseRateRows → RawDataSnapshot
 *
 * publishedDate = "2025-01-16" (from ECOS_BASE_RATE_REQUEST_JAN2025, not derived).
 * sourceUrl = "https://ecos.bok.or.kr/#/Short/722Y001" (human-facing stat page).
 */
export const scaffoldEcosBaseRateSnapshot: RawDataSnapshot | null = runEcosConnector(
  ECOS_BASE_RATE_REQUEST_JAN2025,
  mockTransport,
  normalizeEcosBaseRateRows,
);

/**
 * Fact Card candidate generated from the scaffold snapshot.
 * Expected: ok=true, isMock=true, isPublishable=false.
 * publishedDate in factCard and citation = "2025-01-16".
 * Null when scaffoldEcosBaseRateSnapshot is null (normalizer failure).
 */
export const scaffoldEcosBaseRateCandidate =
  scaffoldEcosBaseRateSnapshot !== null
    ? generateCandidateFromSnapshot(ecosBaseRateParser, scaffoldEcosBaseRateSnapshot)
    : null;
