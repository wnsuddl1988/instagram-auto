import type {
  KisAsyncTransport,
  KisConnectorResult,
  KisIndexAsyncTransport,
  KisIndexConnectorResult,
  KisIndexQuoteRawOutput,
  KisIndexQuoteRequest,
  KisQuoteRawOutput,
  KisQuoteRequest,
} from "./kis-connector";
import type { KisCachedToken } from "./kis-token-cache";
import {
  isKisTokenUsable,
  readKisTokenCache,
  resolveKisTokenCachePath,
  writeKisTokenCache,
} from "./kis-token-cache";

// ── KIS(한국투자증권) live transport ───────────────────────────────────────────
//
// The only module in this connector that performs network I/O and reads
// environment variables. Mirrors dart-live-transport.ts / alpha-vantage-live-
// transport.ts, with one addition: KIS requires a short-lived OAuth token
// obtained via a separate endpoint before any quote request, so this module
// also owns the issue-or-reuse token flow (delegating persistence to
// kis-token-cache.ts).
//
// Secret safety:
// - App key/secret are sent as a JSON body (token issuance) or as headers
//   (quote requests) — never as URL query parameters, never logged.
// - The cached access token is a short-lived bearer credential, not the real
//   secret (the app key/secret are) — see kis-token-cache.ts's module doc.
// - Error messages describe the failure category only.

export const KIS_APP_KEY_ENV = "KIS_APP_KEY";
export const KIS_APP_SECRET_ENV = "KIS_APP_SECRET";
export const KIS_BASE_URL_ENV = "KIS_BASE_URL";
export const KIS_SERVER_MODE_ENV = "KIS_SERVER_MODE";

export const KIS_ENV_NAMES = [
  KIS_APP_KEY_ENV,
  KIS_APP_SECRET_ENV,
  KIS_BASE_URL_ENV,
  KIS_SERVER_MODE_ENV,
] as const;

/** KIS's two server domains — used only as a fallback when KIS_BASE_URL is unset. */
const KIS_DEFAULT_BASE_URL_BY_MODE: Readonly<Record<string, string>> = {
  live: "https://openapi.koreainvestment.com:9443",
  vts: "https://openapivts.koreainvestment.com:29443",
};

export interface KisCredentials {
  readonly appKey: string;
  readonly appSecret: string;
  readonly baseUrl: string;
  /** "live" (실전투자) or "vts" (모의투자) — determines which token cache entry applies. */
  readonly serverMode: string;
}

/**
 * Resolves KIS credentials from the environment without exposing secret
 * values. Returns null when appKey or appSecret is missing — callers must
 * report BLOCKED rather than attempt an unauthenticated call.
 *
 * baseUrl falls back to the documented KIS domain for serverMode when
 * KIS_BASE_URL is unset, so a minimal env (just app key/secret/mode) still
 * works.
 */
export function resolveKisCredentials(
  env: Readonly<Record<string, string | undefined>> = process.env,
): KisCredentials | null {
  const appKey = env[KIS_APP_KEY_ENV]?.trim();
  const appSecret = env[KIS_APP_SECRET_ENV]?.trim();
  if (!appKey || !appSecret) return null;

  const serverMode = env[KIS_SERVER_MODE_ENV]?.trim() || "live";
  const explicitBaseUrl = env[KIS_BASE_URL_ENV]?.trim();
  const baseUrl = explicitBaseUrl || KIS_DEFAULT_BASE_URL_BY_MODE[serverMode];
  if (!baseUrl) return null;

  return { appKey, appSecret, baseUrl: baseUrl.replace(/\/+$/, ""), serverMode };
}

export function hasKisCredentials(
  env: Readonly<Record<string, string | undefined>> = process.env,
): boolean {
  return resolveKisCredentials(env) !== null;
}

// ── Token issuance ───────────────────────────────────────────────────────────

interface KisTokenIssueRawResponse {
  readonly access_token?: string;
  readonly token_type?: string;
  /** Seconds until expiry, per KIS docs (typically 86400 = 24h). */
  readonly expires_in?: number;
  readonly error_code?: string;
  readonly error_description?: string;
}

function isKisTokenIssueSuccess(
  json: unknown,
): json is { access_token: string; token_type: string; expires_in: number } {
  if (typeof json !== "object" || json === null) return false;
  const r = json as KisTokenIssueRawResponse;
  return (
    typeof r.access_token === "string" &&
    r.access_token.length > 0 &&
    typeof r.token_type === "string" &&
    typeof r.expires_in === "number" &&
    Number.isFinite(r.expires_in)
  );
}

/**
 * Issues a fresh KIS OAuth access token via POST /oauth2/tokenP.
 *
 * Returns an error result (never throws) so the caller can decide whether to
 * fall back to a stale cached token or report BLOCKED. The app key/secret are
 * sent in the JSON body per KIS's documented flow — never in the URL.
 */
async function issueKisToken(
  credentials: KisCredentials,
  nowMs: number,
  timeoutMs: number,
): Promise<{ ok: true; token: KisCachedToken } | { ok: false; error: string }> {
  const url = `${credentials.baseUrl}/oauth2/tokenP`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  let response: Response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        grant_type: "client_credentials",
        appkey: credentials.appKey,
        appsecret: credentials.appSecret,
      }),
      signal: controller.signal,
    });
  } catch (error) {
    clearTimeout(timer);
    if (error instanceof Error && error.name === "AbortError") {
      return { ok: false, error: `KIS token issuance timed out after ${timeoutMs}ms` };
    }
    // Deliberately not surfacing error.message: some fetch failure messages
    // can echo the request URL or body.
    return { ok: false, error: "KIS token issuance failed: network error" };
  }
  clearTimeout(timer);

  if (!response.ok) {
    return { ok: false, error: `KIS token issuance failed: HTTP ${response.status}` };
  }

  let json: unknown;
  try {
    json = await response.json();
  } catch {
    return { ok: false, error: "KIS token issuance failed: invalid JSON" };
  }

  if (!isKisTokenIssueSuccess(json)) {
    const errJson = json as KisTokenIssueRawResponse;
    const detail =
      typeof errJson?.error_description === "string"
        ? errJson.error_description
        : "unexpected response shape";
    return { ok: false, error: `KIS token issuance failed: ${detail}` };
  }

  const expiresAtMs = nowMs + json.expires_in * 1000;
  return {
    ok: true,
    token: {
      accessToken: json.access_token,
      tokenType: json.token_type,
      expiresAtIso: new Date(expiresAtMs).toISOString(),
      serverMode: credentials.serverMode,
    },
  };
}

/**
 * Returns a usable KIS access token: reuses the file-cached token when it is
 * still valid for this server mode, otherwise issues a fresh one and caches
 * it. This is the only function outside kis-token-cache.ts that reads or
 * writes the cache file.
 */
export async function resolveKisAccessToken(
  credentials: KisCredentials,
  options: { readonly nowMs?: number; readonly cachePath?: string; readonly timeoutMs?: number } = {},
): Promise<{ ok: true; token: KisCachedToken } | { ok: false; error: string }> {
  const nowMs = options.nowMs ?? Date.now();
  const cachePath = resolveKisTokenCachePath(options.cachePath);
  const timeoutMs = options.timeoutMs ?? 10_000;

  const cached = readKisTokenCache(cachePath);
  if (isKisTokenUsable(cached, credentials.serverMode, nowMs)) {
    // Non-null asserted by isKisTokenUsable's null check.
    return { ok: true, token: cached as KisCachedToken };
  }

  const issued = await issueKisToken(credentials, nowMs, timeoutMs);
  if (!issued.ok) return issued;

  writeKisTokenCache(issued.token, cachePath);
  return { ok: true, token: issued.token };
}

// ── Quote request ─────────────────────────────────────────────────────────────

const KIS_QUOTE_TR_ID = "FHKST01010100";

function isKisQuoteRawOutput(value: unknown): value is KisQuoteRawOutput {
  if (typeof value !== "object" || value === null) return false;
  const r = value as Record<string, unknown>;
  return (
    typeof r.stck_prpr === "string" &&
    typeof r.prdy_vrss === "string" &&
    typeof r.prdy_vrss_sign === "string" &&
    typeof r.prdy_ctrt === "string" &&
    typeof r.stck_sdpr === "string" &&
    typeof r.acml_vol === "string"
  );
}

export function buildKisQuoteUrl(baseUrl: string, request: KisQuoteRequest): string {
  const url = new URL(`${baseUrl}/uapi/domestic-stock/v1/quotations/inquire-price`);
  url.searchParams.set("FID_COND_MRKT_DIV_CODE", request.marketDivCode);
  url.searchParams.set("FID_INPUT_ISCD", request.stockCode);
  return url.toString();
}

/**
 * Parses the KIS quote response body. rt_cd "0" is success; any other code
 * (KIS returns a numeric-string code plus msg1) is treated as an error,
 * carrying msg1 (never the auth headers) in the description.
 */
export function parseKisQuoteResponse(
  json: unknown,
): { readonly ok: true; readonly output: KisQuoteRawOutput } | { readonly ok: false; readonly error: string } {
  if (typeof json !== "object" || json === null) {
    return { ok: false, error: "KIS live response: not a JSON object" };
  }
  const root = json as Record<string, unknown>;
  const rtCd = typeof root.rt_cd === "string" ? root.rt_cd : "";
  const msg1 = typeof root.msg1 === "string" ? root.msg1 : "";

  if (rtCd !== "0") {
    return { ok: false, error: `KIS API error (rt_cd=${rtCd || "?"}): ${msg1 || "unknown error"}` };
  }
  if (!isKisQuoteRawOutput(root.output)) {
    return { ok: false, error: "KIS live response: rt_cd=0 but output shape did not match expectations" };
  }
  return { ok: true, output: root.output };
}

// ── Index quote request ───────────────────────────────────────────────────────

const KIS_INDEX_QUOTE_TR_ID = "FHPUP02100000";

function isKisIndexQuoteRawOutput(value: unknown): value is KisIndexQuoteRawOutput {
  if (typeof value !== "object" || value === null) return false;
  const r = value as Record<string, unknown>;
  return (
    typeof r.bstp_nmix_prpr === "string" &&
    typeof r.bstp_nmix_prdy_vrss === "string" &&
    typeof r.prdy_vrss_sign === "string" &&
    typeof r.bstp_nmix_prdy_ctrt === "string"
  );
}

export function buildKisIndexQuoteUrl(baseUrl: string, request: KisIndexQuoteRequest): string {
  const url = new URL(`${baseUrl}/uapi/domestic-stock/v1/quotations/inquire-index-price`);
  url.searchParams.set("FID_COND_MRKT_DIV_CODE", request.marketDivCode);
  url.searchParams.set("FID_INPUT_ISCD", request.indexCode);
  return url.toString();
}

export function parseKisIndexQuoteResponse(
  json: unknown,
): { readonly ok: true; readonly output: KisIndexQuoteRawOutput } | { readonly ok: false; readonly error: string } {
  if (typeof json !== "object" || json === null) {
    return { ok: false, error: "KIS live response: not a JSON object" };
  }
  const root = json as Record<string, unknown>;
  const rtCd = typeof root.rt_cd === "string" ? root.rt_cd : "";
  const msg1 = typeof root.msg1 === "string" ? root.msg1 : "";

  if (rtCd !== "0") {
    return { ok: false, error: `KIS API error (rt_cd=${rtCd || "?"}): ${msg1 || "unknown error"}` };
  }
  if (!isKisIndexQuoteRawOutput(root.output)) {
    return { ok: false, error: "KIS live response: rt_cd=0 but output shape did not match expectations" };
  }
  return { ok: true, output: root.output };
}

/**
 * Live KIS index-quote transport. Implements KisIndexAsyncTransport.
 * Shares the same token-resolution flow as createKisLiveTransport() — see
 * that function's doc for the caching behavior.
 */
export function createKisIndexLiveTransport(
  fetchedAt: string,
  options: { readonly timeoutMs?: number; readonly cachePath?: string } = {},
): KisIndexAsyncTransport {
  const timeoutMs = options.timeoutMs ?? 10_000;

  return {
    transportId: "kis-index-live",
    async executeAsync(request: KisIndexQuoteRequest): Promise<KisIndexConnectorResult> {
      const credentials = resolveKisCredentials();
      if (credentials === null) {
        return {
          ok: false,
          error: `KIS credentials missing: set ${KIS_APP_KEY_ENV} and ${KIS_APP_SECRET_ENV}`,
          fetchedAt,
        };
      }

      const tokenResult = await resolveKisAccessToken(credentials, {
        cachePath: options.cachePath,
        timeoutMs,
      });
      if (!tokenResult.ok) {
        return { ok: false, error: tokenResult.error, fetchedAt };
      }

      const url = buildKisIndexQuoteUrl(credentials.baseUrl, request);
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      let response: Response;
      try {
        response = await fetch(url, {
          method: "GET",
          headers: {
            "content-type": "application/json; charset=utf-8",
            authorization: `Bearer ${tokenResult.token.accessToken}`,
            appkey: credentials.appKey,
            appsecret: credentials.appSecret,
            tr_id: KIS_INDEX_QUOTE_TR_ID,
            custtype: "P",
          },
          signal: controller.signal,
        });
      } catch (error) {
        clearTimeout(timer);
        if (error instanceof Error && error.name === "AbortError") {
          return { ok: false, error: `KIS live request timed out after ${timeoutMs}ms`, fetchedAt };
        }
        return { ok: false, error: "KIS live request failed: network error", fetchedAt };
      }
      clearTimeout(timer);

      if (!response.ok) {
        return { ok: false, error: `KIS live request failed: HTTP ${response.status}`, fetchedAt };
      }

      let json: unknown;
      try {
        json = await response.json();
      } catch {
        return { ok: false, error: "KIS live request failed: invalid JSON", fetchedAt };
      }

      const parsed = parseKisIndexQuoteResponse(json);
      if (!parsed.ok) {
        return { ok: false, error: parsed.error, fetchedAt };
      }
      return { ok: true, output: parsed.output, fetchedAt };
    },
  };
}

// ── Live transport implementation ──────────────────────────────────────────────

/**
 * Live KIS transport. Implements KisAsyncTransport.
 *
 * Resolves (issuing or reusing) an access token on every call — cheap when
 * cached, since resolveKisAccessToken() only re-issues when the cache is
 * missing/expired/for-a-different-server-mode.
 *
 * fetchedAt is supplied by the caller so the transport stays
 * deterministic-friendly and avoids Date.now() inside the library, except for
 * the token cache's own expiry check which necessarily needs a real clock —
 * that is isolated to resolveKisAccessToken()'s internal nowMs default.
 */
export function createKisLiveTransport(
  fetchedAt: string,
  options: { readonly timeoutMs?: number; readonly cachePath?: string } = {},
): KisAsyncTransport {
  const timeoutMs = options.timeoutMs ?? 10_000;

  return {
    transportId: "kis-live",
    async executeAsync(request: KisQuoteRequest): Promise<KisConnectorResult> {
      const credentials = resolveKisCredentials();
      if (credentials === null) {
        return {
          ok: false,
          error: `KIS credentials missing: set ${KIS_APP_KEY_ENV} and ${KIS_APP_SECRET_ENV}`,
          fetchedAt,
        };
      }

      const tokenResult = await resolveKisAccessToken(credentials, {
        cachePath: options.cachePath,
        timeoutMs,
      });
      if (!tokenResult.ok) {
        return { ok: false, error: tokenResult.error, fetchedAt };
      }

      const url = buildKisQuoteUrl(credentials.baseUrl, request);
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      let response: Response;
      try {
        response = await fetch(url, {
          method: "GET",
          headers: {
            "content-type": "application/json; charset=utf-8",
            authorization: `Bearer ${tokenResult.token.accessToken}`,
            appkey: credentials.appKey,
            appsecret: credentials.appSecret,
            tr_id: KIS_QUOTE_TR_ID,
            custtype: "P",
          },
          signal: controller.signal,
        });
      } catch (error) {
        clearTimeout(timer);
        if (error instanceof Error && error.name === "AbortError") {
          return { ok: false, error: `KIS live request timed out after ${timeoutMs}ms`, fetchedAt };
        }
        return { ok: false, error: "KIS live request failed: network error", fetchedAt };
      }
      clearTimeout(timer);

      if (!response.ok) {
        return { ok: false, error: `KIS live request failed: HTTP ${response.status}`, fetchedAt };
      }

      let json: unknown;
      try {
        json = await response.json();
      } catch {
        return { ok: false, error: "KIS live request failed: invalid JSON", fetchedAt };
      }

      const parsed = parseKisQuoteResponse(json);
      if (!parsed.ok) {
        return { ok: false, error: parsed.error, fetchedAt };
      }
      return { ok: true, output: parsed.output, fetchedAt };
    },
  };
}
