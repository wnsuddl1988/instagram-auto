import type { EcosStatRow } from "./ecos-connector";

// ── BOK base-rate source-date resolver ──────────────────────────────────────────
//
// The ECOS StatisticSearch payload for the base rate (722Y001 / 0101000) is a
// monthly time series: every month carries the rate that is in effect, NOT the
// date the rate was decided. So the latest ECOS period (e.g. 202605 = 2.5%) does
// NOT mean "a 2.5% decision was announced in May 2026" — it means "the rate that
// was last changed to 2.5% is still in effect as of May 2026".
//
// The real publishedDate is the official Bank of Korea Monetary Policy Board
// decision date on which the *current value* was last changed. That date lives on
// the BOK monetary-policy page, never inside the ECOS row payload.
//
// This module verifies a publishedDate by VALUE MATCHING, not by date invention:
//
//   1. It holds a small table of official BOK base-rate decisions (date + value),
//      each entry transcribed from the official BOK page and recorded with the
//      exact source URL it came from.
//   2. Given the ECOS latest row, it matches the row's numeric value against the
//      most recent BOK decision whose value equals it.
//   3. If — and only if — the latest ECOS value equals the value of the most
//      recent official decision, the decision's date is returned as the verified
//      publishedDate. Otherwise it returns unresolved. The date is never derived
//      from the ECOS period itself.
//
// No Date.now(), no clock reads — every date is a transcribed official constant.

/** A single official BOK base-rate decision (transcribed from the BOK page). */
export interface BokBaseRateDecision {
  /** ISO decision date (YYYY-MM-DD) of the Monetary Policy Board decision. */
  readonly decisionDate: string;
  /** Base-rate value set by this decision, as an annual percentage number. */
  readonly value: number;
}

/**
 * Official BOK source page for the base-rate decision history.
 * Human-facing, reviewable by the Owner. Distinct from the ECOS API endpoint.
 *
 * Title (as shown on the page): "통화정책방향 결정회의 일정 및 자료".
 */
export const BOK_BASE_RATE_DECISION_SOURCE_URL =
  "https://www.bok.or.kr/portal/singl/baseRate/list.do?dataSeCd=01&menuNo=200643";

export const BOK_BASE_RATE_DECISION_SOURCE_NAME =
  "한국은행 통화정책방향 결정회의 — 기준금리 변경 이력";

/**
 * Official BOK base-rate decision history, most-recent first.
 *
 * Each entry is transcribed from the official BOK monetary-policy page
 * (BOK_BASE_RATE_DECISION_SOURCE_URL), verified on 2026-06-26.
 * These are decision dates (the day the Monetary Policy Board changed the rate),
 * not ECOS data periods. Do not add a date here unless it was read off the
 * official BOK source for that exact decision.
 */
export const BOK_BASE_RATE_DECISIONS: readonly BokBaseRateDecision[] = [
  { decisionDate: "2025-05-29", value: 2.5 },
  { decisionDate: "2025-02-25", value: 2.75 },
  { decisionDate: "2024-11-28", value: 3.0 },
  { decisionDate: "2024-10-11", value: 3.25 },
  { decisionDate: "2023-01-13", value: 3.5 },
];

// ── Numeric helper ───────────────────────────────────────────────────────────

/**
 * Parses an ECOS DATA_VALUE string into a number, stripping thousands commas.
 * Returns null when the value is not a finite number.
 */
function parseRateValue(raw: string): number | null {
  const n = parseFloat(raw.replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

/** Compares two annual-rate values within a tolerance (avoids float noise). */
function valuesEqual(a: number, b: number): boolean {
  return Math.abs(a - b) < 1e-9;
}

// ── Source-date resolution ─────────────────────────────────────────────────────

export type EcosSourceDateResolution =
  | {
      readonly ok: true;
      /** Verified BOK decision date (ISO YYYY-MM-DD) for the latest value. */
      readonly verifiedPublishedDate: string;
      /** The ECOS latest value (annual %) that was matched. */
      readonly matchedValue: number;
      /** Official source the date was read from. */
      readonly sourceUrl: string;
      readonly sourceName: string;
    }
  | {
      readonly ok: false;
      /** Why no verified date could be tied to the latest value. */
      readonly reason: string;
      /** Machine-readable unresolved code for callers/checkers. */
      readonly code:
        | "unparsable_latest_value"
        | "no_decision_history"
        | "value_not_in_official_history"
        | "latest_value_not_most_recent_decision";
    };

/**
 * Resolves the official BOK publishedDate for the latest ECOS base-rate row.
 *
 * Verification contract (no date invention):
 * - The latest ECOS value must parse to a number.
 * - The official decision history must be non-empty.
 * - The latest ECOS value must equal the value of the MOST RECENT official
 *   decision. The base-rate series only changes when the Monetary Policy Board
 *   changes it, so the current in-effect value must correspond to the latest
 *   decision. If the latest ECOS value does not equal the most recent official
 *   decision's value, the history is stale or the row is unexpected — return
 *   unresolved rather than guessing an older decision date.
 * - Only then is the most recent decision's date returned as the verified date.
 *
 * The returned date is always an official transcribed BOK decision date, never
 * derived from the ECOS period.
 */
export function resolveEcosBaseRateSourceDate(
  latestRow: EcosStatRow,
  decisions: readonly BokBaseRateDecision[] = BOK_BASE_RATE_DECISIONS,
): EcosSourceDateResolution {
  const latestValue = parseRateValue(latestRow.DATA_VALUE);
  if (latestValue === null) {
    return {
      ok: false,
      code: "unparsable_latest_value",
      reason: `ECOS latest DATA_VALUE("${latestRow.DATA_VALUE}")를 숫자로 해석할 수 없습니다.`,
    };
  }

  if (decisions.length === 0) {
    return {
      ok: false,
      code: "no_decision_history",
      reason: "공식 BOK 기준금리 변경 이력이 비어 있어 발표일을 검증할 수 없습니다.",
    };
  }

  const mostRecent = decisions[0];

  // The current in-effect base-rate value must equal the most recent official
  // decision's value. If it doesn't, do not fall back to an older decision date.
  if (!valuesEqual(latestValue, mostRecent.value)) {
    // Distinguish "value appears somewhere in history but not as the latest
    // decision" from "value never officially decided" for clearer reporting.
    const existsElsewhere = decisions.some((d) => valuesEqual(d.value, latestValue));
    if (existsElsewhere) {
      return {
        ok: false,
        code: "latest_value_not_most_recent_decision",
        reason: `ECOS 최신 값(${latestValue}%)이 공식 이력에 존재하지만 가장 최근 결정(${mostRecent.decisionDate}, ${mostRecent.value}%)과 일치하지 않습니다. 이력이 최신이 아닐 수 있어 발표일을 발명하지 않고 차단합니다.`,
      };
    }
    return {
      ok: false,
      code: "value_not_in_official_history",
      reason: `ECOS 최신 값(${latestValue}%)이 공식 BOK 변경 이력에 없습니다. 발표일을 발명하지 않고 차단합니다.`,
    };
  }

  return {
    ok: true,
    verifiedPublishedDate: mostRecent.decisionDate,
    matchedValue: latestValue,
    sourceUrl: BOK_BASE_RATE_DECISION_SOURCE_URL,
    sourceName: BOK_BASE_RATE_DECISION_SOURCE_NAME,
  };
}
