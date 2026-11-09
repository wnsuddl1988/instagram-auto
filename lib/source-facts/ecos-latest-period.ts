import type { RawDataSnapshot } from "./types";
import type { EcosStatRow, EcosStatSearchRequest } from "./ecos-connector";
import { orderEcosRowsCurrentFirst } from "./ecos-connector";
import { ecosTimeToDataPeriod, normalizeEcosBaseRateRows } from "./ecos-normalizer";

// ── ECOS base-rate latest-period resolver ──────────────────────────────────────
//
// Production video-production Fact Cards must use the latest available ECOS
// source period, NOT the Jan2025 historical smoke fixture. This module builds a
// bounded rolling monthly request window ending at an explicit caller-supplied
// period, selects the latest available row plus its nearest previous row, and
// decides whether the result can become a publishable Fact Card.
//
// publishedDate (the BOK announcement date) is NOT present in the ECOS
// StatisticSearch row payload. This module never invents it: a candidate stays
// non-publishable (blocked pending source-date review) unless the caller
// supplies a verified publishedDate for the resolved latest period.
//
// No Date.now() is used here — the end period is always caller-supplied.

/** Base-rate series identifiers (ECOS 722Y001 / item 0101000). */
export const ECOS_BASE_RATE_STAT_CODE = "722Y001";
export const ECOS_BASE_RATE_ITEM_CODE = "0101000";
export const ECOS_BASE_RATE_SOURCE_NAME = "한국은행 ECOS — 기준금리";
export const ECOS_BASE_RATE_SOURCE_PAGE_URL = "https://ecos.bok.or.kr/#/Short/722Y001";

/** Default rolling window span (months) for latest-period discovery. */
export const ECOS_LATEST_WINDOW_MONTHS = 12;

// ── Period arithmetic (string-based, no Date.now) ──────────────────────────────

/**
 * Validates a YYYYMM ECOS monthly period string.
 * Returns true only for well-formed 6-digit periods with month 01–12.
 */
export function isValidEcosMonthlyPeriod(period: string): boolean {
  if (!/^\d{6}$/.test(period)) return false;
  const month = parseInt(period.slice(4, 6), 10);
  return month >= 1 && month <= 12;
}

/**
 * Subtracts a number of months from a YYYYMM period string.
 * Pure string/integer arithmetic — no Date object, no Date.now().
 * Returns null when the input period is malformed.
 */
export function subtractEcosMonths(period: string, months: number): string | null {
  if (!isValidEcosMonthlyPeriod(period)) return null;
  const year = parseInt(period.slice(0, 4), 10);
  const month = parseInt(period.slice(4, 6), 10);
  // Convert to a zero-based absolute month index, subtract, convert back.
  const absolute = year * 12 + (month - 1) - months;
  if (absolute < 0) return null;
  const newYear = Math.floor(absolute / 12);
  const newMonth = (absolute % 12) + 1;
  return `${String(newYear).padStart(4, "0")}${String(newMonth).padStart(2, "0")}`;
}

// ── Bounded window request builder ─────────────────────────────────────────────

/**
 * Builds a bounded monthly ECOS request window ending at an explicit period.
 *
 * The window spans `windowMonths` months ending at `endPeriod` (inclusive).
 * The caller MUST supply `endPeriod` — this function never reads the clock.
 *
 * The request intentionally omits a verified publishedDate: the latest period
 * is unknown until the response is read, so a real announcement date cannot be
 * asserted here. The resolver keeps the candidate non-publishable until a
 * verified date is provided. The placeholder description records intent only.
 *
 * Returns null when endPeriod is malformed or the window underflows.
 */
export function buildEcosLatestWindowRequest(
  endPeriod: string,
  windowMonths: number = ECOS_LATEST_WINDOW_MONTHS,
): EcosStatSearchRequest | null {
  if (!isValidEcosMonthlyPeriod(endPeriod)) return null;
  if (!Number.isInteger(windowMonths) || windowMonths < 1) return null;

  const startPeriod = subtractEcosMonths(endPeriod, windowMonths - 1);
  if (startPeriod === null) return null;

  return {
    statCode: ECOS_BASE_RATE_STAT_CODE,
    cycle: "M",
    startDate: startPeriod,
    endDate: endPeriod,
    itemCode1: ECOS_BASE_RATE_ITEM_CODE,
    description: `한국은행 기준금리 latest-period window (ECOS ${ECOS_BASE_RATE_STAT_CODE}, ${startPeriod}~${endPeriod})`,
    // publishedDate is NOT known until the latest period is resolved and its
    // BOK announcement date is verified. This window-level value must never be
    // treated as the resolved candidate's published date. Resolver keeps the
    // candidate non-publishable until a verified date is supplied.
    // normalizeEcosBaseRateRows() will refuse to produce a snapshot when this is
    // empty — the empty string here acts as an explicit "not-yet-verified" signal.
    publishedDate: "",
    sourcePageUrl: ECOS_BASE_RATE_SOURCE_PAGE_URL,
    sourceName: ECOS_BASE_RATE_SOURCE_NAME,
    // Cover windowMonths + 2 buffer so the live transport never truncates rows.
    // Default row cap (10) is too small for a 12-month window (which returns 12 rows).
    rowStart: 1,
    rowEnd: windowMonths + 2,
  };
}

// ── Latest-period selection ────────────────────────────────────────────────────

export type EcosLatestPeriodResolution =
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

/**
 * Selects the latest available ECOS row by TIME plus its nearest previous row.
 *
 * Rows are ordered current-first (descending TIME) via orderEcosRowsCurrentFirst.
 * Requires at least two valid rows; otherwise reports insufficient_rows so the
 * caller blocks rather than falling back to stale fixture data.
 *
 * Selection is purely from the supplied rows — no fixture fallback, no Jan2025.
 */
export function resolveLatestEcosBaseRatePeriod(
  rows: readonly EcosStatRow[],
): EcosLatestPeriodResolution {
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
    latestDataPeriod: ecosTimeToDataPeriod(latestRow.TIME),
    previousDataPeriod: ecosTimeToDataPeriod(previousRow.TIME),
  };
}

// ── Publishability decision ────────────────────────────────────────────────────

export type EcosLatestCandidateStatus =
  | "blocked_insufficient_rows"
  | "blocked_pending_source_date"
  | "draft_ready";

export interface EcosLatestPeriodReadiness {
  /** Overall status for the resolved latest period. */
  readonly status: EcosLatestCandidateStatus;
  /** Human-readable reason for the status. */
  readonly reason: string;
  /** Resolved latest period (YYYYMM) when rows were sufficient. */
  readonly latestPeriod: string | null;
  /** Resolved previous period (YYYYMM) when rows were sufficient. */
  readonly previousPeriod: string | null;
  /**
   * Normalized snapshot — only produced when a verified publishedDate is
   * supplied. Null while blocked or while only a draft-level snapshot exists.
   */
  readonly snapshot: RawDataSnapshot | null;
  /** Whether the candidate may be marked publishable. Always false here unless verifiedPublishedDate was given. */
  readonly publishable: boolean;
}

/**
 * Decides readiness for the latest ECOS base-rate period.
 *
 * Source-first contract:
 * - Fewer than 2 rows → blocked_insufficient_rows (no fixture fallback).
 * - No verified publishedDate → blocked_pending_source_date. The ECOS row
 *   payload does not carry the BOK announcement date, so it cannot be invented.
 * - A verified publishedDate (caller-supplied, from a checked source) →
 *   draft_ready, with a normalized snapshot. Even then `publishable` stays
 *   false: marking a Fact Card publishable is a downstream decision, not this
 *   resolver's. This module only confirms the data boundary is satisfied.
 *
 * `fetchedAt` and `verifiedPublishedDate` are caller-supplied — no Date.now().
 */
export function decideEcosLatestPeriodReadiness(
  rows: readonly EcosStatRow[],
  fetchedAt: string,
  verifiedPublishedDate: string | null,
): EcosLatestPeriodReadiness {
  const resolution = resolveLatestEcosBaseRatePeriod(rows);

  if (!resolution.ok) {
    return {
      status: "blocked_insufficient_rows",
      reason: `최신 period 판정에 필요한 row가 부족합니다 (rows=${resolution.rowCount}). 스모크 fixture로 fallback하지 않고 차단합니다.`,
      latestPeriod: null,
      previousPeriod: null,
      snapshot: null,
      publishable: false,
    };
  }

  if (verifiedPublishedDate === null || verifiedPublishedDate.trim().length === 0) {
    return {
      status: "blocked_pending_source_date",
      reason: `최신 period(${resolution.latestPeriod})와 직전 period(${resolution.previousPeriod})는 확인됐지만, 검증된 publishedDate가 없어 publishable Fact Card로 만들 수 없습니다. 발표일은 ECOS row에 없으므로 발명하지 않습니다.`,
      latestPeriod: resolution.latestPeriod,
      previousPeriod: resolution.previousPeriod,
      snapshot: null,
      publishable: false,
    };
  }

  // A verified date was supplied — build a normalized snapshot for draft use.
  // The request carries the verified date explicitly so the normalizer never
  // derives it. Source page metadata reuses the known base-rate stat page.
  const draftRequest: EcosStatSearchRequest = {
    statCode: resolution.latestRow.STAT_CODE,
    cycle: "M",
    startDate: resolution.previousPeriod,
    endDate: resolution.latestPeriod,
    itemCode1: resolution.latestRow.ITEM_CODE1,
    description: `한국은행 기준금리 latest draft (${resolution.previousPeriod}~${resolution.latestPeriod})`,
    publishedDate: verifiedPublishedDate,
    sourcePageUrl: ECOS_BASE_RATE_SOURCE_PAGE_URL,
    sourceName: ECOS_BASE_RATE_SOURCE_NAME,
  };

  const snapshot = normalizeEcosBaseRateRows(
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
