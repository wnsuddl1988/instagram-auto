import type { FactCard } from "./types";
import type { EcosAsyncTransport, EcosStatSearchRequest } from "./ecos-connector";
import { orderEcosRowsCurrentFirst } from "./ecos-connector";
import type { KosisAsyncTransport, KosisStatSearchRequest } from "./kosis-connector";
import { orderKosisRowsCurrentFirst } from "./kosis-connector";
import {
  buildEcosLatestWindowRequest,
  ECOS_LATEST_WINDOW_MONTHS,
} from "./ecos-latest-period";
import { buildEcosLatestDraftCandidate } from "./ecos-latest-candidate";
import { BOK_BASE_RATE_DECISIONS } from "./ecos-source-date";
import { buildEcosCpiLatestWindowRequest } from "./ecos-cpi-latest-period";
import { buildEcosCpiLatestDraftCandidate } from "./ecos-cpi-latest-candidate";
import { buildEcosFxLatestWindowRequest, ECOS_FX_LATEST_WINDOW_DAYS } from "./ecos-fx-latest-period";
import { buildEcosFxLatestDraftCandidate } from "./ecos-fx-latest-candidate";
import {
  buildEcosDailyLatestWindowRequest,
  buildEcosDailyLatestDraftCandidate,
  ECOS_DAILY_LATEST_WINDOW_DAYS,
} from "./ecos-daily-indicator";
import { buildEcosBopLatestWindowRequest, buildEcosTradeBalanceLatestWindowRequest } from "./ecos-bop-latest-period";
import { buildEcosBopLatestDraftCandidate, buildEcosTradeBalanceLatestDraftCandidate } from "./ecos-bop-latest-candidate";
import {
  buildKosisEmploymentLatestWindowRequest,
  buildKosisUnemploymentLatestWindowRequest,
  KOSIS_EMPLOYMENT_WINDOW_MONTHS,
} from "./kosis-employment-latest-period";
import {
  buildKosisEmploymentLatestDraftCandidate,
  buildKosisUnemploymentLatestDraftCandidate,
} from "./kosis-employment-latest-candidate";

// ── Indicator orchestrator ────────────────────────────────────────────────────
//
// Runs one or more ECOS indicators against a "latest period" pipeline
// (ecos-*-latest-period → ecos-*-source-date → ecos-normalizer → candidates).
//
// Each indicator needs its own verified published-date resolution path before
// it can be added here (base_rate: BOK_BASE_RATE_DECISIONS value-match;
// cpi_total: KOSTAT_CPI_ANNOUNCEMENTS data-period match; fx_usd_krw: same-day
// daily-fixing conversion) — that is a fact-finding task, never invented.
// Adding an indicator means adding a resolver + a draft-candidate builder
// (see ecos-cpi-*.ts / ecos-fx-*.ts for the pattern), not widening a switch
// statement with guessed logic.
//
// isPublishable stays false all the way through this module, matching the
// existing draft-candidate contract. Promoting a candidate to publishable is a
// deliberate downstream decision (Owner review / QA gate), not something the
// orchestrator does implicitly.

export type IndicatorId =
  | "base_rate"
  | "cpi_total"
  | "fx_usd_krw"
  | "treasury_bond_3y"
  | "kospi"
  | "current_account"
  | "trade_balance"
  | "employment_rate"
  | "unemployment_rate";

export type OrchestratorFailureReason =
  | "insufficient_rows"
  | "source_date_unresolved"
  | "normalize_failed"
  | "candidate_validation_failed"
  | "transport_error";

export type IndicatorFetchOutcome =
  | { readonly indicatorId: IndicatorId; readonly ok: true; readonly factCard: FactCard }
  | {
      readonly indicatorId: IndicatorId;
      readonly ok: false;
      readonly reason: OrchestratorFailureReason;
      readonly detail: string;
    };

export type OrchestratorResult = {
  readonly collected: readonly FactCard[];
  readonly failed: readonly {
    readonly indicatorId: IndicatorId;
    readonly reason: OrchestratorFailureReason;
    readonly detail: string;
  }[];
  readonly collectedAt: string;
};

type DraftCandidateResult = {
  readonly status: string;
  readonly reason: string;
  readonly candidateResult: { readonly factCard?: FactCard | null } | null;
};

/** ECOS 지표 설정 — endPeriod 형식은 지표별로 다르다(YYYYMM 월별 vs YYYYMMDD 일별). */
const ECOS_INDICATOR_CONFIG = {
  base_rate: {
    defaultWindow: ECOS_LATEST_WINDOW_MONTHS,
    buildWindowRequest: buildEcosLatestWindowRequest,
    buildDraftCandidate: (rows: readonly ReturnType<typeof orderEcosRowsCurrentFirst>[number][], fetchedAt: string) =>
      buildEcosLatestDraftCandidate(rows, fetchedAt, BOK_BASE_RATE_DECISIONS),
  },
  cpi_total: {
    defaultWindow: ECOS_LATEST_WINDOW_MONTHS,
    buildWindowRequest: buildEcosCpiLatestWindowRequest,
    buildDraftCandidate: (rows: readonly ReturnType<typeof orderEcosRowsCurrentFirst>[number][], fetchedAt: string) =>
      buildEcosCpiLatestDraftCandidate(rows, fetchedAt),
  },
  fx_usd_krw: {
    defaultWindow: ECOS_FX_LATEST_WINDOW_DAYS,
    buildWindowRequest: buildEcosFxLatestWindowRequest,
    buildDraftCandidate: (rows: readonly ReturnType<typeof orderEcosRowsCurrentFirst>[number][], fetchedAt: string) =>
      buildEcosFxLatestDraftCandidate(rows, fetchedAt),
  },
  treasury_bond_3y: {
    defaultWindow: ECOS_DAILY_LATEST_WINDOW_DAYS,
    buildWindowRequest: (endPeriod: string, window: number) => buildEcosDailyLatestWindowRequest("treasury_bond_3y", endPeriod, window),
    buildDraftCandidate: (rows: readonly ReturnType<typeof orderEcosRowsCurrentFirst>[number][], fetchedAt: string) =>
      buildEcosDailyLatestDraftCandidate("treasury_bond_3y", rows, fetchedAt),
  },
  kospi: {
    defaultWindow: ECOS_DAILY_LATEST_WINDOW_DAYS,
    buildWindowRequest: (endPeriod: string, window: number) => buildEcosDailyLatestWindowRequest("kospi", endPeriod, window),
    buildDraftCandidate: (rows: readonly ReturnType<typeof orderEcosRowsCurrentFirst>[number][], fetchedAt: string) =>
      buildEcosDailyLatestDraftCandidate("kospi", rows, fetchedAt),
  },
  current_account: {
    defaultWindow: ECOS_LATEST_WINDOW_MONTHS,
    buildWindowRequest: buildEcosBopLatestWindowRequest,
    buildDraftCandidate: (rows: readonly ReturnType<typeof orderEcosRowsCurrentFirst>[number][], fetchedAt: string) =>
      buildEcosBopLatestDraftCandidate(rows, fetchedAt),
  },
  trade_balance: {
    defaultWindow: ECOS_LATEST_WINDOW_MONTHS,
    buildWindowRequest: buildEcosTradeBalanceLatestWindowRequest,
    buildDraftCandidate: (rows: readonly ReturnType<typeof orderEcosRowsCurrentFirst>[number][], fetchedAt: string) =>
      buildEcosTradeBalanceLatestDraftCandidate(rows, fetchedAt),
  },
} satisfies Record<string, {
  readonly defaultWindow: number;
  readonly buildWindowRequest: (endPeriod: string, window: number) => EcosStatSearchRequest | null;
  readonly buildDraftCandidate: (rows: readonly ReturnType<typeof orderEcosRowsCurrentFirst>[number][], fetchedAt: string) => DraftCandidateResult;
}>;

/** KOSIS 지표 설정 — ECOS와 별개 transport(KosisAsyncTransport)를 쓴다. */
const KOSIS_INDICATOR_CONFIG = {
  employment_rate: {
    defaultWindow: KOSIS_EMPLOYMENT_WINDOW_MONTHS,
    buildWindowRequest: buildKosisEmploymentLatestWindowRequest,
    buildDraftCandidate: (rows: readonly ReturnType<typeof orderKosisRowsCurrentFirst>[number][], fetchedAt: string) =>
      buildKosisEmploymentLatestDraftCandidate(rows, fetchedAt),
  },
  unemployment_rate: {
    defaultWindow: KOSIS_EMPLOYMENT_WINDOW_MONTHS,
    buildWindowRequest: buildKosisUnemploymentLatestWindowRequest,
    buildDraftCandidate: (rows: readonly ReturnType<typeof orderKosisRowsCurrentFirst>[number][], fetchedAt: string) =>
      buildKosisUnemploymentLatestDraftCandidate(rows, fetchedAt),
  },
} satisfies Record<string, {
  readonly defaultWindow: number;
  readonly buildWindowRequest: (endPeriod: string, window: number) => KosisStatSearchRequest | null;
  readonly buildDraftCandidate: (rows: readonly ReturnType<typeof orderKosisRowsCurrentFirst>[number][], fetchedAt: string) => DraftCandidateResult;
}>;

const ECOS_INDICATOR_IDS = new Set(Object.keys(ECOS_INDICATOR_CONFIG));
const KOSIS_INDICATOR_IDS = new Set(Object.keys(KOSIS_INDICATOR_CONFIG));

/**
 * Fetches the latest-period window for one indicator and turns it into a draft
 * Fact Card. Never falls back to a fixture or an invented date — every failure
 * mode from the underlying resolvers is surfaced as a structured reason.
 *
 * `endPeriod` format depends on the indicator: YYYYMM for base_rate/cpi_total/
 * current_account/trade_balance/employment_rate/unemployment_rate (monthly),
 * YYYYMMDD for fx_usd_krw/treasury_bond_3y/kospi (daily). `windowSize` is
 * months or days to match — pass the indicator's own default when unsure.
 *
 * `kosisTransport` is optional and only required when indicatorId is a KOSIS
 * indicator (employment_rate/unemployment_rate) — ECOS indicators never touch it.
 */
export async function fetchLatestIndicator(
  indicatorId: IndicatorId,
  endPeriod: string,
  transport: EcosAsyncTransport,
  fetchedAt: string,
  windowSize?: number,
  kosisTransport?: KosisAsyncTransport,
): Promise<IndicatorFetchOutcome> {
  const reasonMap: Record<string, OrchestratorFailureReason> = {
    blocked_insufficient_rows: "insufficient_rows",
    blocked_source_date_unresolved: "source_date_unresolved",
    blocked_normalize_failed: "normalize_failed",
    blocked_candidate_validation_failed: "candidate_validation_failed",
  };

  if (KOSIS_INDICATOR_IDS.has(indicatorId)) {
    if (!kosisTransport) {
      return { indicatorId, ok: false, reason: "transport_error", detail: `indicator "${indicatorId}" requires a kosisTransport` };
    }
    const config = KOSIS_INDICATOR_CONFIG[indicatorId as keyof typeof KOSIS_INDICATOR_CONFIG];
    const window = windowSize ?? config.defaultWindow;
    const windowRequest = config.buildWindowRequest(endPeriod, window);
    if (!windowRequest) {
      return { indicatorId, ok: false, reason: "insufficient_rows", detail: `malformed endPeriod "${endPeriod}" or window ${window}` };
    }
    const transportResult = await kosisTransport.executeAsync(windowRequest);
    if (!transportResult.ok) {
      return { indicatorId, ok: false, reason: "transport_error", detail: transportResult.error };
    }
    const rows = orderKosisRowsCurrentFirst(transportResult.rows);
    const draft = config.buildDraftCandidate(rows, fetchedAt);
    if (draft.status !== "draft_ready" || !draft.candidateResult?.factCard) {
      return { indicatorId, ok: false, reason: reasonMap[draft.status] ?? "candidate_validation_failed", detail: draft.reason };
    }
    return { indicatorId, ok: true, factCard: draft.candidateResult.factCard };
  }

  const config = ECOS_INDICATOR_CONFIG[indicatorId as keyof typeof ECOS_INDICATOR_CONFIG];
  const window = windowSize ?? config.defaultWindow;
  const windowRequest = config.buildWindowRequest(endPeriod, window);
  if (!windowRequest) {
    return {
      indicatorId,
      ok: false,
      reason: "insufficient_rows",
      detail: `malformed endPeriod "${endPeriod}" or window ${window}`,
    };
  }

  const transportResult = await transport.executeAsync(windowRequest);
  if (!transportResult.ok) {
    return {
      indicatorId,
      ok: false,
      reason: "transport_error",
      detail: transportResult.error,
    };
  }

  const rows = orderEcosRowsCurrentFirst(transportResult.rows);
  const draft = config.buildDraftCandidate(rows, fetchedAt);

  if (draft.status !== "draft_ready" || !draft.candidateResult?.factCard) {
    return {
      indicatorId,
      ok: false,
      reason: reasonMap[draft.status] ?? "candidate_validation_failed",
      detail: draft.reason,
    };
  }

  return { indicatorId, ok: true, factCard: draft.candidateResult.factCard };
}

/**
 * Runs several indicators against the same end period. One indicator's failure
 * never blocks the others — a topic domain with three indicators should still
 * get evidence from the two that succeeded.
 *
 * `endPeriod` accepts either a single string (applied to every indicator — the
 * historical shape, still correct when all indicators share the monthly
 * YYYYMM format like base_rate/cpi_total) or a per-indicator map (needed once
 * a daily indicator like fx_usd_krw, which uses YYYYMMDD, is mixed in with
 * monthly ones). A missing map entry fails that one indicator closed rather
 * than guessing a format.
 *
 * A bounded concurrency of 3 avoids hammering ECOS when the indicator list
 * grows; today's single indicator makes this a formality, not a requirement.
 */
export async function collectIndicators(
  indicatorIds: readonly IndicatorId[],
  endPeriod: string | Readonly<Partial<Record<IndicatorId, string>>>,
  transport: EcosAsyncTransport,
  fetchedAt: string,
  options: { windowMonths?: number; concurrency?: number; kosisTransport?: KosisAsyncTransport } = {},
): Promise<OrchestratorResult> {
  const concurrency = Math.max(1, options.concurrency ?? 3);
  const collected: FactCard[] = [];
  const failed: { indicatorId: IndicatorId; reason: OrchestratorFailureReason; detail: string }[] =
    [];

  const queue = [...indicatorIds];
  async function worker() {
    while (queue.length > 0) {
      const indicatorId = queue.shift();
      if (!indicatorId) break;
      const resolvedEndPeriod = typeof endPeriod === "string" ? endPeriod : endPeriod[indicatorId];
      if (resolvedEndPeriod === undefined) {
        failed.push({
          indicatorId,
          reason: "insufficient_rows",
          detail: `no endPeriod supplied for indicator "${indicatorId}" (per-indicator endPeriod map is missing this key)`,
        });
        continue;
      }
      const outcome = await fetchLatestIndicator(
        indicatorId,
        resolvedEndPeriod,
        transport,
        fetchedAt,
        options.windowMonths,
        options.kosisTransport,
      );
      if (outcome.ok) {
        collected.push(outcome.factCard);
      } else {
        failed.push({
          indicatorId: outcome.indicatorId,
          reason: outcome.reason,
          detail: outcome.detail,
        });
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, queue.length) }, worker));

  return { collected, failed, collectedAt: fetchedAt };
}
