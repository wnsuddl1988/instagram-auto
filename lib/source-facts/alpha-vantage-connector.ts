import type { EconomicIndicator } from "./types";

// ── Alpha Vantage GLOBAL_QUOTE request specification ───────────────────────────
//
// Mirrors the ECOS/DART connector shape (request/response/transport/normalizer
// separation). See ecos-connector.ts and dart-connector.ts for the pattern.
//
// GLOBAL_QUOTE returns the latest daily quote for a single symbol — the
// simplest Alpha Vantage endpoint for "current value vs previous close",
// which is the shape 황소특보 needs for a quick market snapshot.

/**
 * A single symbol lookup. Alpha Vantage GLOBAL_QUOTE takes exactly one symbol
 * per request (no batch endpoint on the free tier), so batching happens at
 * the caller level via collectAlphaVantageQuotesForSymbols().
 */
export interface AlphaVantageQuoteRequest {
  /** Ticker symbol, e.g. "AAPL", "^GSPC" is NOT supported — Alpha Vantage uses "SPY" style ETF proxies for indices. */
  readonly symbol: string;
  /** Human-readable description of what this request retrieves (for logging only). */
  readonly description: string;
}

/**
 * Alpha Vantage (and most free-tier US market data APIs) does not serve raw
 * index tickers like "^GSPC"/"^IXIC"/"^DJI" — GLOBAL_QUOTE only works for
 * exchange-traded symbols. These liquid, tightly-tracking ETFs are the
 * standard proxy for "the index" in retail-facing content: SPY tracks the
 * S&P 500, QQQ tracks the Nasdaq-100 (not the full Composite, but this is
 * the conventional shorthand used across US financial media), DIA tracks
 * the Dow Jones Industrial Average.
 */
export const US_INDEX_ETF_PROXIES = Object.freeze({
  SPY: { symbol: "SPY", indicatorName: "S&P 500 (SPY ETF)" },
  QQQ: { symbol: "QQQ", indicatorName: "나스닥100 (QQQ ETF)" },
  DIA: { symbol: "DIA", indicatorName: "다우존스 (DIA ETF)" },
} as const);

export class AlphaVantageRequestError extends Error {
  constructor(message: string) {
    super(`alpha vantage request invalid: ${message}`);
    this.name = "AlphaVantageRequestError";
  }
}

const SYMBOL_RE = /^[A-Za-z0-9.\-^]{1,20}$/;

export function buildAlphaVantageQuoteRequest(
  symbol: string,
  description: string,
): AlphaVantageQuoteRequest {
  const trimmed = symbol.trim().toUpperCase();
  if (trimmed.length === 0) {
    throw new AlphaVantageRequestError("symbol must not be empty");
  }
  if (!SYMBOL_RE.test(trimmed)) {
    throw new AlphaVantageRequestError(`symbol has unexpected characters: "${symbol}"`);
  }
  if (description.trim().length === 0) {
    throw new AlphaVantageRequestError("description must not be empty");
  }
  return { symbol: trimmed, description };
}

// ── Alpha Vantage API response (as documented by the GLOBAL_QUOTE endpoint) ───

/**
 * Raw "Global Quote" object. Alpha Vantage returns every numeric field as a
 * string, and the change percent carries a trailing "%" that must be stripped
 * before parsing.
 */
export interface AlphaVantageGlobalQuoteRaw {
  readonly "01. symbol": string;
  readonly "02. open": string;
  readonly "03. high": string;
  readonly "04. low": string;
  readonly "05. price": string;
  readonly "06. volume": string;
  /** Trading date, format YYYY-MM-DD. */
  readonly "07. latest trading day": string;
  readonly "08. previous close": string;
  readonly "09. change": string;
  /** Includes a trailing "%", e.g. "1.2345%". */
  readonly "10. change percent": string;
}

export interface AlphaVantageGlobalQuoteResponse {
  readonly "Global Quote": AlphaVantageGlobalQuoteRaw;
}

export type AlphaVantageConnectorResult =
  | { readonly ok: true; readonly quote: AlphaVantageGlobalQuoteRaw; readonly fetchedAt: string }
  | { readonly ok: false; readonly error: string; readonly fetchedAt: string };

/**
 * Async transport interface for the Alpha Vantage connector (all calls are network I/O).
 * Mirrors DartAsyncTransport/EcosAsyncTransport: no process.env access at the interface level.
 */
export interface AlphaVantageAsyncTransport {
  readonly transportId: string;
  executeAsync(request: AlphaVantageQuoteRequest): Promise<AlphaVantageConnectorResult>;
}

// ── Numeric helpers ─────────────────────────────────────────────────────────────

function parseAlphaVantageNumber(raw: string): number {
  return Number.parseFloat(raw);
}

/** Strips a trailing "%" before parsing, e.g. "1.2345%" -> 1.2345. */
function parseAlphaVantageChangePercent(raw: string): number {
  return Number.parseFloat(raw.replace(/%$/, ""));
}

// ── Normalization ────────────────────────────────────────────────────────────

/**
 * Normalizes a raw GLOBAL_QUOTE payload into an EconomicIndicator.
 * Returns null when any required numeric field fails to parse, or when the
 * trading day is missing — an invented date/value would silently defeat
 * downstream freshness/accuracy checks.
 */
export function normalizeAlphaVantageQuote(
  quote: AlphaVantageGlobalQuoteRaw,
  sourceProviderId: string,
  indicatorName: string,
): EconomicIndicator | null {
  const symbol = quote["01. symbol"]?.trim();
  const latestPeriod = quote["07. latest trading day"]?.trim();
  if (!symbol || symbol.length === 0) return null;
  if (!latestPeriod || latestPeriod.length === 0) return null;

  const latestValue = parseAlphaVantageNumber(quote["05. price"]);
  const previousValue = parseAlphaVantageNumber(quote["08. previous close"]);
  const changeValue = parseAlphaVantageNumber(quote["09. change"]);
  const changeRate = parseAlphaVantageChangePercent(quote["10. change percent"]);

  if (
    !Number.isFinite(latestValue) ||
    !Number.isFinite(previousValue) ||
    !Number.isFinite(changeValue) ||
    !Number.isFinite(changeRate)
  ) {
    return null;
  }

  return {
    id: `alpha-vantage-${symbol}-${latestPeriod}`,
    sourceProviderId,
    indicatorCode: symbol,
    indicatorName,
    category: "market_quote",
    unit: "USD",
    country: "US",
    frequency: "daily",
    latestPeriod,
    latestValue,
    previousValue,
    changeValue,
    // Alpha Vantage's changePercent is already a percentage number (1.23 means
    // 1.23%), so divide by 100 to match this repo's changeRate convention of a
    // fractional rate (0.0123) — consistent with normalizeEcosBaseRateRows().
    changeRate: changeRate / 100,
  };
}

// ── Runner ────────────────────────────────────────────────────────────────────

export type AlphaVantageCollectOutcome =
  | { readonly ok: true; readonly indicator: EconomicIndicator }
  | { readonly ok: false; readonly symbol: string; readonly reason: string };

export async function collectAlphaVantageQuote(
  request: AlphaVantageQuoteRequest,
  transport: AlphaVantageAsyncTransport,
  sourceProviderId: string,
  indicatorName: string,
): Promise<AlphaVantageCollectOutcome> {
  const result = await transport.executeAsync(request);
  if (!result.ok) return { ok: false, symbol: request.symbol, reason: result.error };
  const indicator = normalizeAlphaVantageQuote(result.quote, sourceProviderId, indicatorName);
  if (indicator === null) {
    return { ok: false, symbol: request.symbol, reason: "normalization failed: malformed quote payload" };
  }
  return { ok: true, indicator };
}

/**
 * Looks up multiple symbols sequentially and tolerates per-symbol failure —
 * one dead/rate-limited symbol must not blank out an entire batch (mirrors
 * collectNaverNewsForKeywords()). Alpha Vantage's free tier is rate-limited
 * (5 req/min, 25/day as of this writing), so callers driving a batch of
 * several symbols must expect partial failure to be the common case, not the
 * exception.
 */
export async function collectAlphaVantageQuotesForSymbols(
  symbols: readonly { readonly symbol: string; readonly description: string; readonly indicatorName: string }[],
  transport: AlphaVantageAsyncTransport,
  sourceProviderId: string,
): Promise<{
  results: readonly EconomicIndicator[];
  failed: readonly { symbol: string; reason: string }[];
}> {
  const results: EconomicIndicator[] = [];
  const failed: { symbol: string; reason: string }[] = [];

  for (const entry of symbols) {
    let request: AlphaVantageQuoteRequest;
    try {
      request = buildAlphaVantageQuoteRequest(entry.symbol, entry.description);
    } catch (error) {
      failed.push({
        symbol: entry.symbol,
        reason: error instanceof Error ? error.message : String(error),
      });
      continue;
    }
    const outcome = await collectAlphaVantageQuote(request, transport, sourceProviderId, entry.indicatorName);
    if (outcome.ok) {
      results.push(outcome.indicator);
    } else {
      failed.push({ symbol: outcome.symbol, reason: outcome.reason });
    }
  }

  return { results, failed };
}

// ── Mock transport ────────────────────────────────────────────────────────────

export function createAlphaVantageMockTransport(
  fixtures: ReadonlyMap<string, AlphaVantageConnectorResult>,
): AlphaVantageAsyncTransport {
  return {
    transportId: "alpha-vantage-mock",
    executeAsync(request) {
      const fixture = fixtures.get(request.symbol);
      return Promise.resolve(
        fixture ?? {
          ok: false,
          error: `no fixture for symbol: ${request.symbol}`,
          fetchedAt: "1970-01-01T00:00:00.000Z",
        },
      );
    },
  };
}
