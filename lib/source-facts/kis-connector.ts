import type { EconomicIndicator } from "./types";

// ── KIS(한국투자증권) 국내주식 현재가 시세조회 request specification ──────────
//
// Mirrors the DART/Alpha Vantage connector shape (request/response/transport/
// normalizer separation). See dart-connector.ts and alpha-vantage-connector.ts
// for the pattern.
//
// Unlike DART/Alpha Vantage (a single static API key), KIS requires an OAuth
// access token obtained via a separate call before any quote request — that
// token lifecycle lives in kis-token-cache.ts / kis-live-transport.ts, kept
// out of this file so the request/response/normalizer shapes here stay free
// of auth concerns (same separation ecos-connector.ts keeps from
// ecos-live-transport.ts).

/**
 * A single stock quote lookup. KIS's 주식현재가 시세 endpoint
 * (FHKST01010100) takes one 6-digit ticker per request.
 */
export interface KisQuoteRequest {
  /** 시장 구분 코드: "J"=주식(코스피/코스닥 통합), KIS 문서 기준 고정값. */
  readonly marketDivCode: "J";
  /** 6-digit KRX ticker, e.g. "005930" for 삼성전자. */
  readonly stockCode: string;
  /** Human-readable description of what this request retrieves (for logging only). */
  readonly description: string;
}

export class KisRequestError extends Error {
  constructor(message: string) {
    super(`kis request invalid: ${message}`);
    this.name = "KisRequestError";
  }
}

const STOCK_CODE_RE = /^\d{6}$/;

export function buildKisQuoteRequest(
  stockCode: string,
  description: string,
): KisQuoteRequest {
  const trimmed = stockCode.trim();
  if (!STOCK_CODE_RE.test(trimmed)) {
    throw new KisRequestError(`stockCode must be a 6-digit KRX ticker, got "${stockCode}"`);
  }
  if (description.trim().length === 0) {
    throw new KisRequestError("description must not be empty");
  }
  return { marketDivCode: "J", stockCode: trimmed, description };
}

// ── KIS 국내업종(지수) 현재지수 시세조회 request specification ─────────────────
//
// A separate endpoint (FHPUP02100000) from the single-stock quote above — a
// different tr_id, URL path, and response field names, so this gets its own
// request/response/normalizer trio rather than being shoehorned into the
// stock-quote shape.

/** KIS 업종 코드: "0001"=코스피, "1001"=코스닥. Kept as a narrow union — a typo here would silently query the wrong index. */
export type KisIndexCode = "0001" | "1001";

export const KIS_INDEX_NAME_BY_CODE: Readonly<Record<KisIndexCode, string>> = {
  "0001": "코스피",
  "1001": "코스닥",
};

export interface KisIndexQuoteRequest {
  /** 시장 구분 코드: "U"=업종(지수), KIS 문서 기준 고정값. */
  readonly marketDivCode: "U";
  readonly indexCode: KisIndexCode;
  readonly description: string;
}

export function buildKisIndexQuoteRequest(
  indexCode: KisIndexCode,
  description: string,
): KisIndexQuoteRequest {
  if (description.trim().length === 0) {
    throw new KisRequestError("description must not be empty");
  }
  return { marketDivCode: "U", indexCode, description };
}

/**
 * Raw `output` object from FHPUP02100000. Same unsigned-magnitude +
 * sign-code quirk as the stock quote endpoint (bstp_nmix_prdy_vrss is
 * unsigned; direction comes from prdy_vrss_sign) — resolveKisSignedChange()
 * applies here too.
 */
/**
 * 2026-09-23 실측 확인: KIS FHPUP02100000 응답에는 "전일 지수(종가)"를 직접
 * 담은 필드가 없다(당초 추정했던 bstp_nmix_prdy_clpr는 존재하지 않음 — 실제
 * 필드 목록은 bstp_nmix_prpr/bstp_nmix_prdy_vrss/prdy_vrss_sign/
 * bstp_nmix_prdy_ctrt/acml_vol/prdy_vol/... 등 전혀 다른 이름들이었다). 전일
 * 종가는 normalizeKisIndexQuote()에서 latestValue - changeValue로 산술 도출한다
 * (이미 확보한 두 실측값의 계산이므로 날짜/값 날조 금지 원칙 위반이 아니다).
 */
export interface KisIndexQuoteRawOutput {
  /** 업종 지수 현재가. */
  readonly bstp_nmix_prpr: string;
  /** 전일 대비 (unsigned magnitude). */
  readonly bstp_nmix_prdy_vrss: string;
  /** 전일 대비 부호: same codes as the stock endpoint. */
  readonly prdy_vrss_sign: string;
  /** 전일 대비율(%). */
  readonly bstp_nmix_prdy_ctrt: string;
}

export interface KisIndexQuoteRawResponse {
  readonly rt_cd: string;
  readonly msg_cd: string;
  readonly msg1: string;
  readonly output?: KisIndexQuoteRawOutput;
}

export type KisIndexConnectorResult =
  | { readonly ok: true; readonly output: KisIndexQuoteRawOutput; readonly fetchedAt: string }
  | { readonly ok: false; readonly error: string; readonly fetchedAt: string };

export interface KisIndexAsyncTransport {
  readonly transportId: string;
  executeAsync(request: KisIndexQuoteRequest): Promise<KisIndexConnectorResult>;
}

/**
 * Normalizes a raw KIS index quote output into an EconomicIndicator.
 * Same no-fabricated-date rule as normalizeKisQuote(): tradingDateIso must be
 * supplied by the caller since the endpoint itself does not return one.
 */
export function normalizeKisIndexQuote(
  output: KisIndexQuoteRawOutput,
  sourceProviderId: string,
  indexCode: KisIndexCode,
  tradingDateIso: string,
): EconomicIndicator | null {
  if (tradingDateIso.trim().length === 0) return null;

  const latestValue = parseKisNumber(output.bstp_nmix_prpr);
  const changeValue = resolveKisSignedChange(output.bstp_nmix_prdy_vrss, output.prdy_vrss_sign);
  const changeRatePercent = parseKisNumber(output.bstp_nmix_prdy_ctrt);

  if (
    !Number.isFinite(latestValue) ||
    !Number.isFinite(changeValue) ||
    !Number.isFinite(changeRatePercent)
  ) {
    return null;
  }
  // 전일 종가 = 현재가 - (부호 적용된) 전일 대비. API가 직접 주지 않는 값을
  // 이미 검증된 두 실측값으로 계산한다(날조 아님, 산술 도출).
  const previousValue = latestValue - changeValue;

  return {
    id: `kis-index-${indexCode}-${tradingDateIso}`,
    sourceProviderId,
    indicatorCode: indexCode,
    indicatorName: KIS_INDEX_NAME_BY_CODE[indexCode],
    category: "market_index",
    unit: "pt",
    country: "KR",
    frequency: "realtime",
    latestPeriod: tradingDateIso,
    latestValue,
    previousValue,
    changeValue,
    changeRate: changeRatePercent / 100,
  };
}

export type KisIndexCollectOutcome =
  | { readonly ok: true; readonly indicator: EconomicIndicator }
  | { readonly ok: false; readonly indexCode: KisIndexCode; readonly reason: string };

/**
 * `tradingDateIso` must be supplied by the caller, not derived from
 * `result.fetchedAt` — the fetch timestamp is when the request happened, not
 * necessarily the trading date the quote reflects (queries after market
 * close, on weekends, or on holidays would silently mislabel the period).
 * Same no-fabricated-dates rule collectKisQuote() already follows.
 */
export async function collectKisIndexQuote(
  request: KisIndexQuoteRequest,
  transport: KisIndexAsyncTransport,
  sourceProviderId: string,
  tradingDateIso: string,
): Promise<KisIndexCollectOutcome> {
  const result = await transport.executeAsync(request);
  if (!result.ok) return { ok: false, indexCode: request.indexCode, reason: result.error };
  const indicator = normalizeKisIndexQuote(result.output, sourceProviderId, request.indexCode, tradingDateIso);
  if (indicator === null) {
    return { ok: false, indexCode: request.indexCode, reason: "normalization failed: malformed index output" };
  }
  return { ok: true, indicator };
}

/** Looks up both KOSPI and KOSDAQ, tolerating per-index failure. */
export async function collectKisIndicesForCodes(
  indexCodes: readonly KisIndexCode[],
  transport: KisIndexAsyncTransport,
  sourceProviderId: string,
  tradingDateIso: string,
): Promise<{
  results: readonly EconomicIndicator[];
  failed: readonly { indexCode: KisIndexCode; reason: string }[];
}> {
  const results: EconomicIndicator[] = [];
  const failed: { indexCode: KisIndexCode; reason: string }[] = [];

  for (const indexCode of indexCodes) {
    const request = buildKisIndexQuoteRequest(indexCode, `${KIS_INDEX_NAME_BY_CODE[indexCode]} 지수`);
    const outcome = await collectKisIndexQuote(request, transport, sourceProviderId, tradingDateIso);
    if (outcome.ok) {
      results.push(outcome.indicator);
    } else {
      failed.push({ indexCode: outcome.indexCode, reason: outcome.reason });
    }
  }

  return { results, failed };
}

export function createKisIndexMockTransport(
  fixtures: ReadonlyMap<KisIndexCode, KisIndexConnectorResult>,
): KisIndexAsyncTransport {
  return {
    transportId: "kis-index-mock",
    executeAsync(request) {
      const fixture = fixtures.get(request.indexCode);
      return Promise.resolve(
        fixture ?? {
          ok: false,
          error: `no fixture for indexCode: ${request.indexCode}`,
          fetchedAt: "1970-01-01T00:00:00.000Z",
        },
      );
    },
  };
}

// ── KIS API response (as documented by the 주식현재가 시세 endpoint output) ───

/**
 * Raw `output` object from FHKST01010100. KIS returns every numeric field as
 * a string. Field names mirror the KIS response schema exactly (Korean
 * abbreviations, as documented by KIS — not renamed here so the raw payload
 * stays traceable against the official docs).
 */
export interface KisQuoteRawOutput {
  /** 주식 현재가. */
  readonly stck_prpr: string;
  /** 전일 대비. */
  readonly prdy_vrss: string;
  /** 전일 대비 부호: "1"=상한, "2"=상승, "3"=보합, "4"=하한, "5"=하락. */
  readonly prdy_vrss_sign: string;
  /** 전일 대비율(%), e.g. "1.23". */
  readonly prdy_ctrt: string;
  /** 전일 종가. */
  readonly stck_sdpr: string;
  /** 누적 거래량. */
  readonly acml_vol: string;
  /** 종목명 — 시세 조회 응답 자체에는 포함되지 않는 경우가 많아 optional로 둔다. */
  readonly hts_kor_isnm?: string;
}

export interface KisQuoteRawResponse {
  /** "0" = success. Any other code means the request failed. */
  readonly rt_cd: string;
  /** 응답 메세지 코드. */
  readonly msg_cd: string;
  /** 응답 메세지. */
  readonly msg1: string;
  readonly output?: KisQuoteRawOutput;
}

export type KisConnectorResult =
  | { readonly ok: true; readonly output: KisQuoteRawOutput; readonly fetchedAt: string }
  | { readonly ok: false; readonly error: string; readonly fetchedAt: string };

/**
 * Async transport interface for the KIS connector (all calls are network I/O
 * and require a live OAuth token). No process.env access at the interface level.
 */
export interface KisAsyncTransport {
  readonly transportId: string;
  executeAsync(request: KisQuoteRequest): Promise<KisConnectorResult>;
}

// ── Numeric helpers ─────────────────────────────────────────────────────────────

function parseKisNumber(raw: string): number {
  return Number.parseFloat(raw);
}

/**
 * KIS reports 전일대비 as an unsigned magnitude plus a separate sign code
 * (prdy_vrss_sign). This resolves the true signed change value — a naive
 * parseFloat(prdy_vrss) would silently report every decline as a gain.
 */
export function resolveKisSignedChange(prdyVrss: string, sign: string): number {
  const magnitude = Math.abs(parseKisNumber(prdyVrss));
  if (!Number.isFinite(magnitude)) return NaN;
  // "4"(하한) and "5"(하락) are the only negative-change sign codes.
  const isNegative = sign === "4" || sign === "5";
  return isNegative ? -magnitude : magnitude;
}

// ── Normalization ────────────────────────────────────────────────────────────

/**
 * Normalizes a raw KIS quote output into an EconomicIndicator.
 *
 * `dataPeriod`/`latestPeriod` come from the caller (fetchedAt-derived trading
 * date) since KIS's real-time quote endpoint does not itself return a trading
 * date field — inventing one here would violate the no-fabricated-dates rule
 * this repo's connectors all follow, so the caller must supply it explicitly.
 *
 * Returns null when any required numeric field fails to parse.
 */
export function normalizeKisQuote(
  output: KisQuoteRawOutput,
  sourceProviderId: string,
  indicatorName: string,
  tradingDateIso: string,
  stockCode?: string,
): EconomicIndicator | null {
  if (tradingDateIso.trim().length === 0) return null;

  const latestValue = parseKisNumber(output.stck_prpr);
  const previousValue = parseKisNumber(output.stck_sdpr);
  const changeValue = resolveKisSignedChange(output.prdy_vrss, output.prdy_vrss_sign);
  const changeRatePercent = parseKisNumber(output.prdy_ctrt);

  if (
    !Number.isFinite(latestValue) ||
    !Number.isFinite(previousValue) ||
    !Number.isFinite(changeValue) ||
    !Number.isFinite(changeRatePercent)
  ) {
    return null;
  }

  return {
    id: `kis-quote-${tradingDateIso}`,
    sourceProviderId,
    // stockCode가 없으면 bull-topic-threshold-scanner의 classifyBullInstrument가
    // "" ?? "" 로 처리해 항상 stock_other로 잘못 분류한다(2026-09-23 실측으로
    // 발견한 버그 — 005930/000660/005380조차 large-cap 판정이 안 됐었음).
    // 반드시 stockCode를 넘겨야 nameable/large-cap 판정이 정상 작동한다.
    indicatorCode: stockCode,
    indicatorName,
    category: "market_quote",
    unit: "KRW",
    country: "KR",
    frequency: "realtime",
    latestPeriod: tradingDateIso,
    latestValue,
    previousValue,
    changeValue,
    // KIS's prdy_ctrt is already a percentage number (1.23 means 1.23%),
    // divide by 100 to match this repo's changeRate convention of a
    // fractional rate — same convention as normalizeAlphaVantageQuote().
    changeRate: changeRatePercent / 100,
  };
}

// ── Runner ────────────────────────────────────────────────────────────────────

export type KisCollectOutcome =
  | { readonly ok: true; readonly indicator: EconomicIndicator }
  | { readonly ok: false; readonly stockCode: string; readonly reason: string };

export async function collectKisQuote(
  request: KisQuoteRequest,
  transport: KisAsyncTransport,
  sourceProviderId: string,
  indicatorName: string,
  tradingDateIso: string,
): Promise<KisCollectOutcome> {
  const result = await transport.executeAsync(request);
  if (!result.ok) return { ok: false, stockCode: request.stockCode, reason: result.error };
  const indicator = normalizeKisQuote(result.output, sourceProviderId, indicatorName, tradingDateIso, request.stockCode);
  if (indicator === null) {
    return { ok: false, stockCode: request.stockCode, reason: "normalization failed: malformed quote output" };
  }
  return { ok: true, indicator };
}

/**
 * Looks up multiple tickers sequentially and tolerates per-ticker failure —
 * one dead/rate-limited ticker must not blank out an entire batch (mirrors
 * collectAlphaVantageQuotesForSymbols()).
 */
export async function collectKisQuotesForStocks(
  stocks: readonly { readonly stockCode: string; readonly description: string; readonly indicatorName: string }[],
  transport: KisAsyncTransport,
  sourceProviderId: string,
  tradingDateIso: string,
): Promise<{
  results: readonly EconomicIndicator[];
  failed: readonly { stockCode: string; reason: string }[];
}> {
  const results: EconomicIndicator[] = [];
  const failed: { stockCode: string; reason: string }[] = [];

  for (const entry of stocks) {
    let request: KisQuoteRequest;
    try {
      request = buildKisQuoteRequest(entry.stockCode, entry.description);
    } catch (error) {
      failed.push({
        stockCode: entry.stockCode,
        reason: error instanceof Error ? error.message : String(error),
      });
      continue;
    }
    const outcome = await collectKisQuote(
      request,
      transport,
      sourceProviderId,
      entry.indicatorName,
      tradingDateIso,
    );
    if (outcome.ok) {
      results.push(outcome.indicator);
    } else {
      failed.push({ stockCode: outcome.stockCode, reason: outcome.reason });
    }
  }

  return { results, failed };
}

// ── Mock transport ────────────────────────────────────────────────────────────

export function createKisMockTransport(
  fixtures: ReadonlyMap<string, KisConnectorResult>,
): KisAsyncTransport {
  return {
    transportId: "kis-mock",
    executeAsync(request) {
      const fixture = fixtures.get(request.stockCode);
      return Promise.resolve(
        fixture ?? {
          ok: false,
          error: `no fixture for stockCode: ${request.stockCode}`,
          fetchedAt: "1970-01-01T00:00:00.000Z",
        },
      );
    },
  };
}
