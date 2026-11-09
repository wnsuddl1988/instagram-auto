import type {
  EcosAsyncTransport,
  EcosConnectorResult,
  EcosStatRow,
  EcosStatSearchRequest,
} from "./ecos-connector";
import { orderEcosRowsCurrentFirst } from "./ecos-connector";

// ── ECOS live transport ────────────────────────────────────────────────────────
//
// This is the ONLY module in the source-facts library that performs live network
// I/O and reads an environment variable. It implements the async transport
// boundary so the synchronous mock scaffold stays untouched.
//
// Secret safety:
// - The API key is read from process.env and never logged, returned, or embedded
//   in error messages.
// - Error messages describe the failure category only, never the URL with the key.

const ECOS_API_BASE = "https://ecos.bok.or.kr/api/StatisticSearch";

/** Default row range when the request does not specify rowStart/rowEnd. */
const DEFAULT_ROW_START = 1;
const DEFAULT_ROW_END = 10;

/**
 * Env var names checked in priority order. The first defined non-empty value
 * is used. Values are never printed.
 */
export const ECOS_API_KEY_ENV_NAMES = ["ECOS_API_KEY", "BOK_ECOS_API_KEY"] as const;

/**
 * Resolves the ECOS API key from the environment without exposing its value.
 * Returns the key string when found, or null when no env var is set.
 *
 * Callers must never print or persist the returned value.
 */
export function resolveEcosApiKey(): string | null {
  for (const name of ECOS_API_KEY_ENV_NAMES) {
    const value = process.env[name];
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }
  return null;
}

/**
 * Reports whether an ECOS API key env var is present, without revealing it.
 * Useful for live-check gating and reporting "blocked by missing env var".
 */
export function hasEcosApiKey(): boolean {
  return resolveEcosApiKey() !== null;
}

/**
 * Builds the ECOS StatisticSearch request URL.
 *
 * The API key is a path segment in the ECOS scheme, so this URL is secret-bearing
 * and must never be logged or returned in errors. Keep it local to the fetch call.
 *
 * ECOS URL shape:
 *   {base}/{apiKey}/json/kr/{start}/{end}/{statCode}/{cycle}/{startPeriod}/{endPeriod}/{itemCode1}
 */
export function buildEcosStatSearchUrl(
  apiKey: string,
  request: EcosStatSearchRequest,
): string {
  const rowStart = request.rowStart ?? DEFAULT_ROW_START;
  const rowEnd = request.rowEnd ?? DEFAULT_ROW_END;
  const segments = [
    ECOS_API_BASE,
    encodeURIComponent(apiKey),
    "json",
    "kr",
    String(rowStart),
    String(rowEnd),
    encodeURIComponent(request.statCode),
    encodeURIComponent(request.cycle),
    encodeURIComponent(request.startDate),
    encodeURIComponent(request.endDate),
    encodeURIComponent(request.itemCode1),
  ];
  return segments.join("/");
}

// ── Response shape guards ──────────────────────────────────────────────────────

interface EcosErrorEnvelope {
  RESULT: { CODE: string; MESSAGE: string };
}

function isEcosErrorEnvelope(json: unknown): json is EcosErrorEnvelope {
  if (typeof json !== "object" || json === null) return false;
  const r = (json as Record<string, unknown>).RESULT;
  if (typeof r !== "object" || r === null) return false;
  const rr = r as Record<string, unknown>;
  return typeof rr.CODE === "string" && typeof rr.MESSAGE === "string";
}

function isEcosStatRow(row: unknown): row is EcosStatRow {
  if (typeof row !== "object" || row === null) return false;
  const r = row as Record<string, unknown>;
  return (
    typeof r.STAT_CODE === "string" &&
    typeof r.STAT_NAME === "string" &&
    typeof r.ITEM_CODE1 === "string" &&
    typeof r.ITEM_NAME1 === "string" &&
    typeof r.TIME === "string" &&
    typeof r.DATA_VALUE === "string" &&
    typeof r.UNIT_NAME === "string"
  );
}

/**
 * Parses a successful ECOS StatisticSearch JSON body into EcosStatRow[].
 * Returns null when the expected nested rows are missing or malformed.
 *
 * Does not echo the API key or the request URL.
 */
export function parseEcosStatSearchRows(json: unknown): readonly EcosStatRow[] | null {
  if (typeof json !== "object" || json === null) return null;
  const search = (json as Record<string, unknown>).StatisticSearch;
  if (typeof search !== "object" || search === null) return null;
  const rows = (search as Record<string, unknown>).row;
  if (!Array.isArray(rows)) return null;
  const valid = rows.filter(isEcosStatRow);
  return valid.length > 0 ? valid : null;
}

// ── Live transport implementation ──────────────────────────────────────────────

/**
 * Live ECOS transport. Implements EcosAsyncTransport.
 *
 * - Reads the API key from process.env via resolveEcosApiKey().
 * - Performs exactly one fetch() per executeAsync call.
 * - Never logs, returns, or embeds the API key or secret-bearing URL.
 * - Error results carry a category description only.
 *
 * fetchedAt is supplied by the caller so the transport stays deterministic-friendly
 * and avoids Date.now() inside the library.
 */
export function createEcosLiveTransport(fetchedAt: string): EcosAsyncTransport {
  return {
    transportId: "live",
    async executeAsync(
      request: EcosStatSearchRequest,
    ): Promise<EcosConnectorResult> {
      const apiKey = resolveEcosApiKey();
      if (apiKey === null) {
        return {
          ok: false,
          error: `ECOS API key missing: set one of ${ECOS_API_KEY_ENV_NAMES.join(", ")}`,
          fetchedAt,
        };
      }

      const url = buildEcosStatSearchUrl(apiKey, request);

      let response: Response;
      try {
        response = await fetch(url);
      } catch {
        // Do not include the URL (it carries the key) in the error.
        return { ok: false, error: "ECOS live request failed: network error", fetchedAt };
      }

      if (!response.ok) {
        return {
          ok: false,
          error: `ECOS live request failed: HTTP ${response.status}`,
          fetchedAt,
        };
      }

      let json: unknown;
      try {
        json = await response.json();
      } catch {
        return { ok: false, error: "ECOS live request failed: invalid JSON", fetchedAt };
      }

      if (isEcosErrorEnvelope(json)) {
        // ECOS error MESSAGE is safe (no key), but keep it concise.
        return {
          ok: false,
          error: `ECOS API error ${json.RESULT.CODE}: ${json.RESULT.MESSAGE}`,
          fetchedAt,
        };
      }

      const rows = parseEcosStatSearchRows(json);
      if (rows === null) {
        return {
          ok: false,
          error: "ECOS live response: no usable rows in StatisticSearch",
          fetchedAt,
        };
      }

      // ECOS returns rows in ascending TIME order; normalizer expects current-first.
      return { ok: true, rows: orderEcosRowsCurrentFirst(rows), fetchedAt };
    },
  };
}
