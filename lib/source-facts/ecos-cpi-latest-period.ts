import type { RawDataSnapshot } from "./types";
import type { EcosStatRow, EcosStatSearchRequest } from "./ecos-connector";
import { orderEcosRowsCurrentFirst } from "./ecos-connector";
import {
  isValidEcosMonthlyPeriod,
  subtractEcosMonths,
  ECOS_LATEST_WINDOW_MONTHS,
} from "./ecos-latest-period";
import { ecosTimeToDataPeriod } from "./ecos-normalizer";
import { normalizeEcosGenericRows } from "./ecos-generic-normalizer";

// ── ECOS CPI(소비자물가지수 총지수) latest-period resolver ─────────────────────
//
// Mirrors ecos-latest-period.ts's base-rate resolver but targets the CPI total
// index (901Y009 / item "0"). publishedDate is NOT present in the ECOS row —
// callers must supply a verified date from resolveEcosCpiSourceDate() (see
// ecos-cpi-source-date.ts, which matches by exact data period, not by value —
// unlike the base rate, CPI changes every month so value-matching would not
// distinguish periods).
//
// No Date.now() is used here — the end period is always caller-supplied.

export const ECOS_CPI_STAT_CODE = "901Y009";
export const ECOS_CPI_ITEM_CODE = "0";
export const ECOS_CPI_SOURCE_NAME = "국가데이터처(구 통계청)/ECOS — 소비자물가지수(총지수)";
export const ECOS_CPI_SOURCE_PAGE_URL = "https://ecos.bok.or.kr/#/Short/901Y009";

export function buildEcosCpiLatestWindowRequest(
  endPeriod: string,
  windowMonths: number = ECOS_LATEST_WINDOW_MONTHS,
): EcosStatSearchRequest | null {
  if (!isValidEcosMonthlyPeriod(endPeriod)) return null;
  if (!Number.isInteger(windowMonths) || windowMonths < 1) return null;

  const startPeriod = subtractEcosMonths(endPeriod, windowMonths - 1);
  if (startPeriod === null) return null;

  return {
    statCode: ECOS_CPI_STAT_CODE,
    cycle: "M",
    startDate: startPeriod,
    endDate: endPeriod,
    itemCode1: ECOS_CPI_ITEM_CODE,
    description: `소비자물가지수(총지수) latest-period window (ECOS ${ECOS_CPI_STAT_CODE}, ${startPeriod}~${endPeriod})`,
    publishedDate: "",
    sourcePageUrl: ECOS_CPI_SOURCE_PAGE_URL,
    sourceName: ECOS_CPI_SOURCE_NAME,
    rowStart: 1,
    rowEnd: windowMonths + 2,
  };
}

export type EcosCpiLatestPeriodResolution =
  | {
      readonly ok: false;
      readonly reason: "insufficient_rows";
      readonly rowCount: number;
    }
  | {
      readonly ok: true;
      readonly latestRow: EcosStatRow;
      readonly previousRow: EcosStatRow;
      /** Same month one year earlier — needed for YoY % (전년동월비), the number people recognize. */
      readonly yearAgoRow: EcosStatRow | null;
      readonly latestPeriod: string;
      readonly previousPeriod: string;
      readonly latestDataPeriod: string;
      readonly previousDataPeriod: string;
    };

export function resolveLatestEcosCpiPeriod(
  rows: readonly EcosStatRow[],
): EcosCpiLatestPeriodResolution {
  const ordered = orderEcosRowsCurrentFirst(rows);
  if (ordered.length < 2) {
    return { ok: false, reason: "insufficient_rows", rowCount: ordered.length };
  }

  const latestRow = ordered[0];
  const previousRow = ordered[1];
  const yearAgoPeriod = subtractEcosMonths(latestRow.TIME, 12);
  const yearAgoRow = yearAgoPeriod
    ? ordered.find((r) => r.TIME === yearAgoPeriod) ?? null
    : null;

  return {
    ok: true,
    latestRow,
    previousRow,
    yearAgoRow,
    latestPeriod: latestRow.TIME,
    previousPeriod: previousRow.TIME,
    latestDataPeriod: ecosTimeToDataPeriod(latestRow.TIME),
    previousDataPeriod: ecosTimeToDataPeriod(previousRow.TIME),
  };
}

export type EcosCpiLatestCandidateStatus =
  | "blocked_insufficient_rows"
  | "blocked_pending_source_date"
  | "draft_ready";

export interface EcosCpiLatestPeriodReadiness {
  readonly status: EcosCpiLatestCandidateStatus;
  readonly reason: string;
  readonly latestPeriod: string | null;
  readonly previousPeriod: string | null;
  /** 전년동월비 %, computed from latestRow vs yearAgoRow when both are present. */
  readonly yoyChangePercent: number | null;
  readonly snapshot: RawDataSnapshot | null;
  readonly publishable: boolean;
}

/**
 * Decides readiness for the latest ECOS CPI period. Mirrors
 * decideEcosLatestPeriodReadiness() (base rate) but never invents a
 * publishedDate from the period — callers must pass one verified via
 * resolveEcosCpiSourceDate().
 */
export function decideEcosCpiLatestPeriodReadiness(
  rows: readonly EcosStatRow[],
  fetchedAt: string,
  verifiedPublishedDate: string | null,
): EcosCpiLatestPeriodReadiness {
  const resolution = resolveLatestEcosCpiPeriod(rows);

  if (!resolution.ok) {
    return {
      status: "blocked_insufficient_rows",
      reason: `최신 period 판정에 필요한 row가 부족합니다 (rows=${resolution.rowCount}).`,
      latestPeriod: null,
      previousPeriod: null,
      yoyChangePercent: null,
      snapshot: null,
      publishable: false,
    };
  }

  if (verifiedPublishedDate === null || verifiedPublishedDate.trim().length === 0) {
    return {
      status: "blocked_pending_source_date",
      reason: `최신 period(${resolution.latestPeriod})는 확인됐지만, 검증된 publishedDate가 없어 publishable Fact Card로 만들 수 없습니다. resolveEcosCpiSourceDate()로 국가데이터처 발표일을 먼저 확인하세요.`,
      latestPeriod: resolution.latestPeriod,
      previousPeriod: resolution.previousPeriod,
      yoyChangePercent: null,
      snapshot: null,
      publishable: false,
    };
  }

  const draftRequest: EcosStatSearchRequest = {
    statCode: resolution.latestRow.STAT_CODE,
    cycle: "M",
    startDate: resolution.previousPeriod,
    endDate: resolution.latestPeriod,
    itemCode1: resolution.latestRow.ITEM_CODE1,
    description: `소비자물가지수(총지수) latest draft (${resolution.previousPeriod}~${resolution.latestPeriod})`,
    publishedDate: verifiedPublishedDate,
    sourcePageUrl: ECOS_CPI_SOURCE_PAGE_URL,
    sourceName: ECOS_CPI_SOURCE_NAME,
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
      yoyChangePercent: null,
      snapshot: null,
      publishable: false,
    };
  }

  const yoyChangePercent =
    resolution.yearAgoRow !== null
      ? computeYoyPercent(resolution.latestRow.DATA_VALUE, resolution.yearAgoRow.DATA_VALUE)
      : null;

  return {
    status: "draft_ready",
    reason: `최신 period(${resolution.latestPeriod}) draft snapshot 생성 완료. publishable 여부는 downstream에서 결정합니다.`,
    latestPeriod: resolution.latestPeriod,
    previousPeriod: resolution.previousPeriod,
    yoyChangePercent,
    snapshot,
    publishable: false,
  };
}

function computeYoyPercent(currentRaw: string, yearAgoRaw: string): number | null {
  const current = parseFloat(currentRaw.replace(/,/g, ""));
  const yearAgo = parseFloat(yearAgoRaw.replace(/,/g, ""));
  if (!Number.isFinite(current) || !Number.isFinite(yearAgo) || yearAgo === 0) return null;
  return parseFloat((((current - yearAgo) / yearAgo) * 100).toFixed(2));
}
