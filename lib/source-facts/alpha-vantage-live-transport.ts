import type {
  AlphaVantageAsyncTransport,
  AlphaVantageConnectorResult,
  AlphaVantageGlobalQuoteRaw,
  AlphaVantageQuoteRequest,
} from "./alpha-vantage-connector";

// ── Alpha Vantage live transport ───────────────────────────────────────────────
//
// The only module in this connector that performs network I/O and reads an
// environment variable. Mirrors ecos-live-transport.ts / dart-live-transport.ts.
//
// Secret safety:
// - The API key is a query parameter (apikey) — never logged or embedded in
//   error messages.
// - Error messages describe the failure category only.
//
// Alpha Vantage quirk: rate-limit and "premium endpoint" notices arrive as
// HTTP 200 with a "Note" or "Information" field instead of a non-2xx status —
// these must be detected explicitly or they will silently normalize to
// garbage (no "Global Quote" key present).

const ALPHA_VANTAGE_API_BASE = "https://www.alphavantage.co/query";
const ALPHA_VANTAGE_FUNCTION = "GLOBAL_QUOTE";

export const ALPHA_VANTAGE_API_KEY_ENV_NAMES = ["ALPHA_VANTAGE_API_KEY"] as const;

export function resolveAlphaVantageApiKey(): string | null {
  for (const name of ALPHA_VANTAGE_API_KEY_ENV_NAMES) {
    const value = process.env[name];
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }
  return null;
}

export function hasAlphaVantageApiKey(): boolean {
  return resolveAlphaVantageApiKey() !== null;
}

/**
 * Builds the Alpha Vantage GLOBAL_QUOTE request URL.
 *
 * The API key is a query parameter (apikey) — this URL is secret-bearing and
 * must never be logged or returned in errors. Keep it local to the fetch call.
 */
export function buildAlphaVantageQuoteUrl(
  apiKey: string,
  request: AlphaVantageQuoteRequest,
): string {
  const url = new URL(ALPHA_VANTAGE_API_BASE);
  url.searchParams.set("function", ALPHA_VANTAGE_FUNCTION);
  url.searchParams.set("symbol", request.symbol);
  url.searchParams.set("apikey", apiKey);
  return url.toString();
}

// ── Response shape guards ──────────────────────────────────────────────────────

function isAlphaVantageGlobalQuoteRaw(value: unknown): value is AlphaVantageGlobalQuoteRaw {
  if (typeof value !== "object" || value === null) return false;
  const r = value as Record<string, unknown>;
  return (
    typeof r["01. symbol"] === "string" &&
    typeof r["05. price"] === "string" &&
    typeof r["07. latest trading day"] === "string" &&
    typeof r["08. previous close"] === "string" &&
    typeof r["09. change"] === "string" &&
    typeof r["10. change percent"] === "string"
  );
}

/**
 * Parses the Alpha Vantage GLOBAL_QUOTE response body.
 *
 * Handles three distinct "successful HTTP request, unusable body" shapes that
 * Alpha Vantage returns with HTTP 200:
 *   - "Error Message": invalid symbol or malformed request.
 *   - "Note": rate limit hit (legacy free-tier message).
 *   - "Information": rate limit / premium-endpoint notice (current free-tier message).
 *   - {"Global Quote": {}}: valid but empty — symbol has no data for the day
 *     (e.g. market not yet opened, delisted ticker).
 */
export function parseAlphaVantageQuoteResponse(
  json: unknown,
): { readonly ok: true; readonly quote: AlphaVantageGlobalQuoteRaw } | { readonly ok: false; readonly error: string } {
  if (typeof json !== "object" || json === null) {
    return { ok: false, error: "Alpha Vantage live response: not a JSON object" };
  }
  const root = json as Record<string, unknown>;

  if (typeof root["Error Message"] === "string") {
    // Error Message는 보통 "Invalid API call" 류의 심볼/파라미터 오류만 담고
    // 키 값을 포함하지 않는 것으로 관찰되지만(2026-09-23 기준), 확신할 근거는
    // 없으므로 이 필드도 그대로 이어붙이지 않는다 — 길이만 제한해 노출한다.
    return { ok: false, error: `Alpha Vantage error: ${root["Error Message"].slice(0, 200)}` };
  }
  if (typeof root["Note"] === "string") {
    return { ok: false, error: "Alpha Vantage rate limit hit (Note field present)" };
  }
  if (typeof root["Information"] === "string") {
    // 2026-09-23 실측 확인(보안 사고): Alpha Vantage의 rate-limit "Information"
    // 필드는 "We have detected your API key as <KEY>..." 형식으로 API 키 값을
    // 그대로 되돌려준다. 이 필드 내용을 절대 에러 메시지에 이어붙이지 않는다 —
    // 카테고리만 보고한다(daily vs per-second인지도 구분하지 않는다, 문구에
    // 의존하면 다시 값이 샐 위험이 있어 고정 문자열로만 응답).
    return { ok: false, error: "Alpha Vantage rate limit or plan restriction (see provider dashboard for detail)" };
  }

  const globalQuote = root["Global Quote"];
  if (typeof globalQuote !== "object" || globalQuote === null) {
    return { ok: false, error: "Alpha Vantage live response: missing Global Quote" };
  }
  if (Object.keys(globalQuote).length === 0) {
    return { ok: false, error: "Alpha Vantage live response: Global Quote is empty (no data for symbol)" };
  }
  if (!isAlphaVantageGlobalQuoteRaw(globalQuote)) {
    return { ok: false, error: "Alpha Vantage live response: Global Quote shape did not match expectations" };
  }
  return { ok: true, quote: globalQuote };
}

// ── Live transport implementation ──────────────────────────────────────────────

/**
 * Live Alpha Vantage transport. Implements AlphaVantageAsyncTransport.
 *
 * fetchedAt is supplied by the caller so the transport stays
 * deterministic-friendly and avoids Date.now() inside the library.
 */
export function createAlphaVantageLiveTransport(
  fetchedAt: string,
  options: { readonly timeoutMs?: number } = {},
): AlphaVantageAsyncTransport {
  const timeoutMs = options.timeoutMs ?? 10_000;

  return {
    transportId: "alpha-vantage-live",
    async executeAsync(request: AlphaVantageQuoteRequest): Promise<AlphaVantageConnectorResult> {
      const apiKey = resolveAlphaVantageApiKey();
      if (apiKey === null) {
        return {
          ok: false,
          error: `Alpha Vantage API key missing: set ${ALPHA_VANTAGE_API_KEY_ENV_NAMES.join(", ")}`,
          fetchedAt,
        };
      }

      const url = buildAlphaVantageQuoteUrl(apiKey, request);
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      let response: Response;
      try {
        response = await fetch(url, { signal: controller.signal });
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return { ok: false, error: `Alpha Vantage live request timed out after ${timeoutMs}ms`, fetchedAt };
        }
        // Deliberately not surfacing error.message: it can echo the request URL (carries the key).
        return { ok: false, error: "Alpha Vantage live request failed: network error", fetchedAt };
      } finally {
        clearTimeout(timer);
      }

      if (!response.ok) {
        return { ok: false, error: `Alpha Vantage live request failed: HTTP ${response.status}`, fetchedAt };
      }

      let json: unknown;
      try {
        json = await response.json();
      } catch {
        return { ok: false, error: "Alpha Vantage live request failed: invalid JSON", fetchedAt };
      }

      const parsed = parseAlphaVantageQuoteResponse(json);
      if (!parsed.ok) {
        return { ok: false, error: parsed.error, fetchedAt };
      }
      return { ok: true, quote: parsed.quote, fetchedAt };
    },
  };
}
