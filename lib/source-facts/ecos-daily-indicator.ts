import type { RawDataSnapshot } from "./types";
import type { EcosStatRow, EcosStatSearchRequest } from "./ecos-connector";
import type { ManualFactCardAuthoringResult } from "./manual";
import { orderEcosRowsCurrentFirst } from "./ecos-connector";
import { ecosTimeToDataPeriod } from "./ecos-normalizer";
import { normalizeEcosGenericRows } from "./ecos-generic-normalizer";
import { generateCandidateFromSnapshot } from "./raw-snapshot-parser";
import { ecosGenericLiveParser } from "./ecos-generic-live-parser";
import { ECOS_LIVE_PROVIDER_ID } from "./candidates";

// ── Generic daily ECOS indicator (국고채, KOSPI, and any future same-day series) ─
//
// Same publishedDate logic as ecos-fx-source-date.ts: a daily market series
// (bond yield fixing, stock index close) is announced/observed the SAME day
// ECOS records it — there is no separate press-release lookup, unlike a
// monthly release (CPI) or a policy decision (base rate). This module
// parameterizes ecos-fx-latest-period.ts's pattern by statCode/itemCode so a
// new daily series can be added without duplicating the whole file — see
// DAILY_INDICATORS below for the registered set.
//
// No Date.now() is used here — the end date is always caller-supplied.

export interface EcosDailyIndicatorSpec {
  readonly statCode: string;
  readonly itemCode1: string;
  readonly sourceName: string;
  readonly sourcePageUrl: string;
}

/** Registered daily indicators — add a new one here after verifying statCode/itemCode1 live (see runbook). */
export const DAILY_INDICATORS = {
  fx_usd_krw: {
    statCode: "731Y001",
    itemCode1: "0000001",
    sourceName: "한국은행 ECOS — 원/달러 매매기준율",
    sourcePageUrl: "https://ecos.bok.or.kr/#/Short/731Y001",
  },
  treasury_bond_3y: {
    statCode: "817Y002",
    itemCode1: "010200000",
    sourceName: "한국은행 ECOS — 국고채(3년) 금리",
    sourcePageUrl: "https://ecos.bok.or.kr/#/Short/817Y002",
  },
  kospi: {
    statCode: "802Y001",
    itemCode1: "0001000",
    sourceName: "한국은행 ECOS — KOSPI지수",
    sourcePageUrl: "https://ecos.bok.or.kr/#/Short/802Y001",
  },
} as const satisfies Record<string, EcosDailyIndicatorSpec>;

export type DailyIndicatorKey = keyof typeof DAILY_INDICATORS;

export const ECOS_DAILY_LATEST_WINDOW_DAYS = 14;

export function isValidEcosDailyPeriod(period: string): boolean {
  if (!/^\d{8}$/.test(period)) return false;
  const month = parseInt(period.slice(4, 6), 10);
  const day = parseInt(period.slice(6, 8), 10);
  return month >= 1 && month <= 12 && day >= 1 && day <= 31;
}

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

export function buildEcosDailyLatestWindowRequest(
  indicator: DailyIndicatorKey,
  endPeriod: string,
  windowDays: number = ECOS_DAILY_LATEST_WINDOW_DAYS,
): EcosStatSearchRequest | null {
  if (!isValidEcosDailyPeriod(endPeriod)) return null;
  if (!Number.isInteger(windowDays) || windowDays < 1) return null;
  const spec = DAILY_INDICATORS[indicator];
  const startPeriod = subtractEcosDays(endPeriod, windowDays - 1);
  if (startPeriod === null) return null;

  return {
    statCode: spec.statCode,
    cycle: "D",
    startDate: startPeriod,
    endDate: endPeriod,
    itemCode1: spec.itemCode1,
    description: `${spec.sourceName} latest-period window (${startPeriod}~${endPeriod})`,
    publishedDate: "",
    sourcePageUrl: spec.sourcePageUrl,
    sourceName: spec.sourceName,
    rowStart: 1,
    rowEnd: windowDays + 2,
  };
}

export type EcosDailyPeriodResolution =
  | { readonly ok: false; readonly reason: "insufficient_rows"; readonly rowCount: number }
  | {
      readonly ok: true;
      readonly latestRow: EcosStatRow;
      readonly previousRow: EcosStatRow;
      readonly latestPeriod: string;
      readonly previousPeriod: string;
    };

export function resolveLatestEcosDailyPeriod(rows: readonly EcosStatRow[]): EcosDailyPeriodResolution {
  const ordered = orderEcosRowsCurrentFirst(rows);
  if (ordered.length < 2) return { ok: false, reason: "insufficient_rows", rowCount: ordered.length };
  return {
    ok: true,
    latestRow: ordered[0],
    previousRow: ordered[1],
    latestPeriod: ordered[0].TIME,
    previousPeriod: ordered[1].TIME,
  };
}

export type EcosDailySourceDateResolution =
  | { readonly ok: true; readonly verifiedPublishedDate: string }
  | { readonly ok: false; readonly reason: string; readonly code: "malformed_daily_time" };

/** Same-day conversion — see module header for why this is not a date invention. */
export function resolveEcosDailySourceDate(latestRow: EcosStatRow): EcosDailySourceDateResolution {
  const time = latestRow.TIME;
  if (!/^\d{8}$/.test(time)) {
    return { ok: false, code: "malformed_daily_time", reason: `ECOS 일별 TIME("${time}")이 YYYYMMDD 형식이 아닙니다.` };
  }
  return { ok: true, verifiedPublishedDate: `${time.slice(0, 4)}-${time.slice(4, 6)}-${time.slice(6, 8)}` };
}

export type EcosDailyDraftCandidateStatus =
  | "blocked_insufficient_rows"
  | "blocked_source_date_unresolved"
  | "blocked_normalize_failed"
  | "blocked_candidate_validation_failed"
  | "draft_ready";

export interface EcosDailyDraftCandidateResult {
  readonly status: EcosDailyDraftCandidateStatus;
  readonly reason: string;
  readonly latestPeriod: string | null;
  readonly previousPeriod: string | null;
  readonly verifiedPublishedDate: string | null;
  readonly candidateResult: (ManualFactCardAuthoringResult & { parserName: string; snapshotId: string }) | null;
  readonly publishable: false;
}

export function buildEcosDailyLatestDraftCandidate(
  indicator: DailyIndicatorKey,
  rows: readonly EcosStatRow[],
  fetchedAt: string,
): EcosDailyDraftCandidateResult {
  const spec = DAILY_INDICATORS[indicator];
  const periodResolution = resolveLatestEcosDailyPeriod(rows);
  if (!periodResolution.ok) {
    return {
      status: "blocked_insufficient_rows",
      reason: `최신 period 판정에 필요한 row가 부족합니다 (rows=${periodResolution.rowCount}).`,
      latestPeriod: null,
      previousPeriod: null,
      verifiedPublishedDate: null,
      candidateResult: null,
      publishable: false,
    };
  }

  const sourceDateResolution = resolveEcosDailySourceDate(periodResolution.latestRow);
  if (!sourceDateResolution.ok) {
    return {
      status: "blocked_source_date_unresolved",
      reason: `최신 ${spec.sourceName} 값(${periodResolution.latestPeriod})의 발표일을 검증할 수 없습니다 (code=${sourceDateResolution.code}).`,
      latestPeriod: periodResolution.latestPeriod,
      previousPeriod: periodResolution.previousPeriod,
      verifiedPublishedDate: null,
      candidateResult: null,
      publishable: false,
    };
  }

  const draftRequest: EcosStatSearchRequest = {
    statCode: periodResolution.latestRow.STAT_CODE,
    cycle: "D",
    startDate: periodResolution.previousPeriod,
    endDate: periodResolution.latestPeriod,
    itemCode1: periodResolution.latestRow.ITEM_CODE1,
    description: `${spec.sourceName} latest live draft (${periodResolution.previousPeriod}~${periodResolution.latestPeriod})`,
    publishedDate: sourceDateResolution.verifiedPublishedDate,
    sourcePageUrl: spec.sourcePageUrl,
    sourceName: spec.sourceName,
    sourceProviderId: ECOS_LIVE_PROVIDER_ID,
  };

  const snapshot = normalizeEcosGenericRows(
    [periodResolution.latestRow, periodResolution.previousRow],
    fetchedAt,
    draftRequest,
  );

  if (snapshot === null) {
    return {
      status: "blocked_normalize_failed",
      reason: `검증된 publishedDate(${sourceDateResolution.verifiedPublishedDate})가 있었지만 정규화에 실패했습니다.`,
      latestPeriod: periodResolution.latestPeriod,
      previousPeriod: periodResolution.previousPeriod,
      verifiedPublishedDate: sourceDateResolution.verifiedPublishedDate,
      candidateResult: null,
      publishable: false,
    };
  }

  const candidateResult = generateCandidateFromSnapshot(ecosGenericLiveParser, snapshot);
  if (!candidateResult.ok || candidateResult.factCard === null) {
    const firstError = candidateResult.validation.errors[0];
    const errorSummary = firstError ? `field=${firstError.field} code=${firstError.code}` : "unknown validation error";
    return {
      status: "blocked_candidate_validation_failed",
      reason: `generateCandidateFromSnapshot 검증 실패 (${errorSummary}).`,
      latestPeriod: periodResolution.latestPeriod,
      previousPeriod: periodResolution.previousPeriod,
      verifiedPublishedDate: sourceDateResolution.verifiedPublishedDate,
      candidateResult,
      publishable: false,
    };
  }

  return {
    status: "draft_ready",
    reason: `최신 period(${periodResolution.latestPeriod}) draft Fact Card candidate 생성 완료.`,
    latestPeriod: periodResolution.latestPeriod,
    previousPeriod: periodResolution.previousPeriod,
    verifiedPublishedDate: sourceDateResolution.verifiedPublishedDate,
    candidateResult,
    publishable: false,
  };
}

// Re-exported for callers that want the human-readable "YYYY년 M월 D일" form.
export { ecosTimeToDataPeriod };
