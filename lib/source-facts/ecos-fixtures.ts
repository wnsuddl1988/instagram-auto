import type { EcosStatRow, EcosApiResponse } from "./ecos-connector";

// ── ECOS base rate fixture (2025년 1월, BOK 발표 2025-01-16) ──────────────────

/**
 * Mock ECOS StatisticSearch row for the Bank of Korea base rate, Jan 2025.
 * Values are from the 2025-01-16 BOK announcement — no live network call.
 * All numeric values are strings as the real ECOS API returns them.
 */
export const ECOS_BASE_RATE_ROW_JAN2025: EcosStatRow = {
  STAT_CODE: "722Y001",
  STAT_NAME: "기준금리",
  ITEM_CODE1: "0101000",
  ITEM_NAME1: "한국은행 기준금리",
  TIME: "202501",
  DATA_VALUE: "3.00",
  UNIT_NAME: "%",
};

/**
 * Historical smoke fixture for the previous period (Dec 2024 = 3.00%).
 * Live ECOS 722Y001/0101000 returned 202412 DATA_VALUE as "3.00" —
 * the same value as Jan 2025 (no change between the two periods).
 * This pair is used to verify connector/normalizer behavior only.
 * Production content must select the latest available ECOS period
 * rather than defaulting to this Jan 2025 historical smoke request.
 */
export const ECOS_BASE_RATE_ROW_DEC2024: EcosStatRow = {
  STAT_CODE: "722Y001",
  STAT_NAME: "기준금리",
  ITEM_CODE1: "0101000",
  ITEM_NAME1: "한국은행 기준금리",
  TIME: "202412",
  DATA_VALUE: "3.00",
  UNIT_NAME: "%",
};

/**
 * Two-period row set: [current Jan2025, previous Dec2024].
 * The normalizer receives this pair to derive current/previous/change.
 */
export const ECOS_BASE_RATE_ROWS_JAN2025: readonly EcosStatRow[] = [
  ECOS_BASE_RATE_ROW_JAN2025,
  ECOS_BASE_RATE_ROW_DEC2024,
];

/**
 * Full mock ECOS API response envelope for the base rate two-period query.
 * Mirrors the real ECOS StatisticSearch JSON response structure.
 */
export const ECOS_BASE_RATE_MOCK_RESPONSE: EcosApiResponse = {
  StatisticSearch: {
    list_total_count: 2,
    row: ECOS_BASE_RATE_ROWS_JAN2025,
  },
};
