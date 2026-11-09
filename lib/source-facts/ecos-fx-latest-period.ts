import type { RawDataSnapshot } from "./types";
import type { EcosStatRow, EcosStatSearchRequest } from "./ecos-connector";
import { orderEcosRowsCurrentFirst } from "./ecos-connector";
import { ecosTimeToDataPeriod } from "./ecos-normalizer";
import { normalizeEcosGenericRows } from "./ecos-generic-normalizer";

// ── ECOS 원/달러 매매기준율(731Y001) latest-period resolver ────────────────────
//
// A daily series: TIME is YYYYMMDD, not YYYYMM. publishedDate is resolved via
// ecos-fx-source-date.ts (same-day, no press-release lookup — see that module's
// header for why this is not a date invention).
//
// No Date.now() is used here — the end date is always caller-supplied.

export const ECOS_FX_STAT_CODE = "731Y001";
export const ECOS_FX_ITEM_CODE = "0000001";
export const ECOS_FX_SOURCE_NAME = "한국은행 ECOS — 원/달러 매매기준율";
export const ECOS_FX_SOURCE_PAGE_URL = "https://ecos.bok.or.kr/#/Short/731Y001";

/** Default rolling window span (days) for latest-period discovery — covers weekends/holidays. */
export const ECOS_FX_LATEST_WINDOW_DAYS = 14;

/** Validates a YYYYMMDD ECOS daily period string. */
export function isValidEcosDailyPeriod(period: string): boolean {
  if (!/^\d{8}$/.test(period)) return false;
  const month = parseInt(period.slice(4, 6), 10);
  const day = parseInt(period.slice(6, 8), 10);
  return month >= 1 && month <= 12 && day >= 1 && day <= 31;
}

/**
 * Subtracts a number of calendar days from a YYYYMMDD period string.
 * Uses UTC Date arithmetic purely on the caller-supplied string — no Date.now().
 */
export function subtractEcosDays(period: string, days: number): string | null {
  if (!isValidEcosDailyPeriod(period)) return null;
  const year = parseInt(period.slice(0, 4), 10);
  const month = parseInt(period.slice(4, 6), 10);
  const day = parseInt(period.slice(6, 8), 10);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() - days);
  const y = String(date.getUTCFullYear()).padStart(4, "0");
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

export function buildEcosFxLatestWindowRequest(
  endPeriod: string,
  windowDays: number = ECOS_FX_LATEST_WINDOW_DAYS,
): EcosStatSearchRequest | null {
  if (!isValidEcosDailyPeriod(endPeriod)) return null;
  if (!Number.isInteger(windowDays) || windowDays < 1) return null;

  const startPeriod = subtractEcosDays(endPeriod, windowDays - 1);
  if (startPeriod === null) return null;

  return {
    statCode: ECOS_FX_STAT_CODE,
    cycle: "D",
    startDate: startPeriod,
    endDate: endPeriod,
    itemCode1: ECOS_FX_ITEM_CODE,
    description: `원/달러 매매기준율 latest-period window (ECOS ${ECOS_FX_STAT_CODE}, ${startPeriod}~${endPeriod})`,
    publishedDate: "",
    sourcePageUrl: ECOS_FX_SOURCE_PAGE_URL,
    sourceName: ECOS_FX_SOURCE_NAME,
    rowStart: 1,
    rowEnd: windowDays + 2,
  };
}

export type EcosFxLatestPeriodResolution =
  | {
      readonly ok: false;
      readonly reason: "insufficient_rows";
      readonly rowCount: number;
    }
  | {
      readonly ok: true;
      readonly latestRow: EcosStatRow;
      readonly previousRow: EcosStatRow;
      readonly latestPeriod: string;
      readonly previousPeriod: string;
      readonly latestDataPeriod: string;
      readonly previousDataPeriod: string;
    };

export function resolveLatestEcosFxPeriod(
  rows: readonly EcosStatRow[],
): EcosFxLatestPeriodResolution {
  const ordered = orderEcosRowsCurrentFirst(rows);
  if (ordered.length < 2) {
    return { ok: false, reason: "insufficient_rows", rowCount: ordered.length };
  }
  const latestRow = ordered[0];
  const previousRow = ordered[1];
  return {
    ok: true,
    latestRow,
    previousRow,
    latestPeriod: latestRow.TIME,
    previousPeriod: previousRow.TIME,
    latestDataPeriod: ecosDailyTimeToDataPeriod(latestRow.TIME),
    previousDataPeriod: ecosDailyTimeToDataPeriod(previousRow.TIME),
  };
}

function ecosDailyTimeToDataPeriod(time: string): string {
  if (/^\d{8}$/.test(time)) {
    return `${time.slice(0, 4)}년 ${parseInt(time.slice(4, 6), 10)}월 ${parseInt(time.slice(6, 8), 10)}일`;
  }
  return time;
}

export type EcosFxLatestCandidateStatus =
  | "blocked_insufficient_rows"
  | "blocked_pending_source_date"
  | "draft_ready";

export interface EcosFxLatestPeriodReadiness {
  readonly status: EcosFxLatestCandidateStatus;
  readonly reason: string;
  readonly latestPeriod: string | null;
  readonly previousPeriod: string | null;
  readonly snapshot: RawDataSnapshot | null;
  readonly publishable: boolean;
}

export function decideEcosFxLatestPeriodReadiness(
  rows: readonly EcosStatRow[],
  fetchedAt: string,
  verifiedPublishedDate: string | null,
): EcosFxLatestPeriodReadiness {
  const resolution = resolveLatestEcosFxPeriod(rows);

  if (!resolution.ok) {
    return {
      status: "blocked_insufficient_rows",
      reason: `최신 period 판정에 필요한 row가 부족합니다 (rows=${resolution.rowCount}).`,
      latestPeriod: null,
      previousPeriod: null,
      snapshot: null,
      publishable: false,
    };
  }

  if (verifiedPublishedDate === null || verifiedPublishedDate.trim().length === 0) {
    return {
      status: "blocked_pending_source_date",
      reason: `최신 period(${resolution.latestPeriod})는 확인됐지만, 검증된 publishedDate가 없어 publishable Fact Card로 만들 수 없습니다.`,
      latestPeriod: resolution.latestPeriod,
      previousPeriod: resolution.previousPeriod,
      snapshot: null,
      publishable: false,
    };
  }

  const draftRequest: EcosStatSearchRequest = {
    statCode: resolution.latestRow.STAT_CODE,
    cycle: "D",
    startDate: resolution.previousPeriod,
    endDate: resolution.latestPeriod,
    itemCode1: resolution.latestRow.ITEM_CODE1,
    description: `원/달러 매매기준율 latest draft (${resolution.previousPeriod}~${resolution.latestPeriod})`,
    publishedDate: verifiedPublishedDate,
    sourcePageUrl: ECOS_FX_SOURCE_PAGE_URL,
    sourceName: ECOS_FX_SOURCE_NAME,
  };

  const snapshot = normalizeEcosGenericRows(
    [resolution.latestRow, resolution.previousRow],
    fetchedAt,
    draftRequest,
  );

  if (snapshot === null) {
    return {
      status: "blocked_insufficient_rows",
      reason: "검증된 publishedDate가 있었지만 정규화에 실패했습니다 (DATA_VALUE 파싱 불가 등).",
      latestPeriod: resolution.latestPeriod,
      previousPeriod: resolution.previousPeriod,
      snapshot: null,
      publishable: false,
    };
  }

  return {
    status: "draft_ready",
    reason: `최신 period(${resolution.latestPeriod}) draft snapshot 생성 완료. publishable 여부는 downstream에서 결정합니다.`,
    latestPeriod: resolution.latestPeriod,
    previousPeriod: resolution.previousPeriod,
    snapshot,
    publishable: false,
  };
}
