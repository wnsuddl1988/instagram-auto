import type { EconomicIndicator } from "./types";

// ── 황소특보 소재 임계치 스캐너 ─────────────────────────────────────────────────
//
// Pure filtering logic over already-fetched EconomicIndicator values (from
// kis-connector.ts / alpha-vantage-connector.ts) — this module does no
// network I/O itself, it only decides "is this indicator's move big enough
// to be a topic candidate" per the thresholds confirmed in
// _ai/CURRENT_STANDARDS.md §3 "소재 선정 원칙" (2026-09-23).
//
// Design note: thresholds are deliberately NOT "1%/3%" style round numbers —
// Owner rejected an earlier draft at those levels as "too common to filter
// anything" (KOSPI/KOSDAQ routinely move 1-3% on an ordinary day). The
// confirmed thresholds are meant to be genuinely rare, not just "any move".

// ── Instrument classification ───────────────────────────────────────────────

export type BullInstrumentKind = "index_us" | "index_kr" | "stock_large_cap" | "stock_other";

/**
 * KOSPI200-tier Korean large caps and the handful of US mega-caps this
 * channel is allowed to name explicitly (_ai/CURRENT_STANDARDS.md §3
 * "종목명 언급 규칙"). This list governs BOTH threshold selection
 * (large-cap vs. other) AND whether the ticker may ever be named in a
 * script — see `isNameableStock()`.
 *
 * Deliberately a hand-maintained allowlist, not "anything in KOSPI200" —
 * the nameable-in-script set is meant to be much smaller and more
 * conservative than the large-cap threshold set (Owner: "삼성전자, 애플
 * 이런것도 굳이 언급할이유없으면 안해도돼" — being on this list only means
 * "permitted if truly necessary", never "default to naming it").
 */
export const BULL_NAMEABLE_STOCKS: ReadonlySet<string> = new Set([
  // KR — KOSPI200-tier mega caps only.
  "005930", // 삼성전자
  "000660", // SK하이닉스
  "005380", // 현대차
  // US — mega-cap tickers explicitly approved for naming.
  "AAPL", // Apple
  "TSLA", // Tesla
  "GOOGL", // Alphabet (Google)
]);

export function isNameableStock(indicatorCode: string): boolean {
  return BULL_NAMEABLE_STOCKS.has(indicatorCode.trim().toUpperCase()) ||
    BULL_NAMEABLE_STOCKS.has(indicatorCode.trim());
}

// ── Thresholds (fractional rate, matching EconomicIndicator.changeRate) ──────

export const BULL_TOPIC_THRESHOLDS = Object.freeze({
  /** 미국 지수(S&P500/나스닥/다우, Alpha Vantage ETF 프록시) 등락률 하한. */
  indexUs: 0.02,
  /** 국내 지수(코스피/코스닥, KIS) 등락률 하한 — 국내 지수 변동성이 상대적으로 낮아 미국보다 높게. */
  indexKr: 0.03,
  /** 대형주(코스피200급 국내 종목 / 미국 초대형주) 등락률 하한. */
  stockLargeCap: 0.05,
  /** 중소형주 등락률 하한 — 이 수치를 넘겨도 아래 issueConfirmed가 true여야 채택. */
  stockOther: 0.10,
} as const);

/**
 * Classifies an indicator by which threshold applies. `country`/`category`
 * come from the EconomicIndicator itself (set by the KIS/Alpha Vantage
 * normalizers); large-vs-other cap classification for stocks uses
 * BULL_NAMEABLE_STOCKS as the large-cap allowlist — anything not on that
 * list is treated as "other" for THRESHOLD purposes even if it happens to
 * be a well-known mid-cap, matching the confirmed rule that only the
 * allowlisted mega-caps get the looser 5-6% bar.
 */
export function classifyBullInstrument(indicator: EconomicIndicator): BullInstrumentKind {
  if (indicator.category === "market_index") {
    return indicator.country === "US" ? "index_us" : "index_kr";
  }
  const code = indicator.indicatorCode ?? "";
  return isNameableStock(code) ? "stock_large_cap" : "stock_other";
}

function thresholdFor(kind: BullInstrumentKind): number {
  switch (kind) {
    case "index_us":
      return BULL_TOPIC_THRESHOLDS.indexUs;
    case "index_kr":
      return BULL_TOPIC_THRESHOLDS.indexKr;
    case "stock_large_cap":
      return BULL_TOPIC_THRESHOLDS.stockLargeCap;
    case "stock_other":
      return BULL_TOPIC_THRESHOLDS.stockOther;
  }
}

// ── Candidate evaluation ─────────────────────────────────────────────────────

export type BullTopicRejectReason =
  | "below_threshold"
  | "small_cap_move_without_confirmed_issue";

export type BullTopicCandidateEvaluation =
  | {
      readonly accepted: true;
      readonly indicator: EconomicIndicator;
      readonly instrumentKind: BullInstrumentKind;
      readonly absChangeRate: number;
      readonly nameable: boolean;
    }
  | {
      readonly accepted: false;
      readonly indicator: EconomicIndicator;
      readonly instrumentKind: BullInstrumentKind;
      readonly absChangeRate: number;
      readonly reason: BullTopicRejectReason;
    };

/**
 * Evaluates one indicator against the confirmed thresholds.
 *
 * `issueConfirmed` must be supplied by the caller (true only when a news/
 * disclosure search has actually confirmed a theme/supply-contract-style
 * reason for the move) — this function never infers "there must be a
 * reason" from the magnitude alone. A stock_other move past 10% with
 * issueConfirmed left false (the safe default) is rejected, matching the
 * confirmed rule "단순 급등락 수치만으로는 채택 안 함".
 */
export function evaluateBullTopicCandidate(
  indicator: EconomicIndicator,
  options: { readonly issueConfirmed?: boolean } = {},
): BullTopicCandidateEvaluation {
  const instrumentKind = classifyBullInstrument(indicator);
  const absChangeRate = Math.abs(indicator.changeRate ?? 0);
  const threshold = thresholdFor(instrumentKind);

  if (absChangeRate < threshold) {
    return { accepted: false, indicator, instrumentKind, absChangeRate, reason: "below_threshold" };
  }

  if (instrumentKind === "stock_other" && options.issueConfirmed !== true) {
    return {
      accepted: false,
      indicator,
      instrumentKind,
      absChangeRate,
      reason: "small_cap_move_without_confirmed_issue",
    };
  }

  const nameable = instrumentKind !== "stock_other" && isNameableStock(indicator.indicatorCode ?? "");
  return { accepted: true, indicator, instrumentKind, absChangeRate, nameable };
}

/**
 * Scans a batch of indicators and returns accepted/rejected buckets. Order
 * of `accepted` is preserved from input order — callers that want
 * "largest move first" should sort before or after calling this, this
 * function does not impose a ranking.
 */
export function scanBullTopicCandidates(
  indicators: readonly EconomicIndicator[],
  issueConfirmedByIndicatorId: ReadonlyMap<string, boolean> = new Map(),
): {
  readonly accepted: readonly Extract<BullTopicCandidateEvaluation, { accepted: true }>[];
  readonly rejected: readonly Extract<BullTopicCandidateEvaluation, { accepted: false }>[];
} {
  const accepted: Extract<BullTopicCandidateEvaluation, { accepted: true }>[] = [];
  const rejected: Extract<BullTopicCandidateEvaluation, { accepted: false }>[] = [];

  for (const indicator of indicators) {
    const evaluation = evaluateBullTopicCandidate(indicator, {
      issueConfirmed: issueConfirmedByIndicatorId.get(indicator.id) ?? false,
    });
    if (evaluation.accepted) accepted.push(evaluation);
    else rejected.push(evaluation);
  }

  return { accepted, rejected };
}
