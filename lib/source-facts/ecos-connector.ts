import type { RawDataSnapshot } from "./types";

// ── ECOS API request specification ────────────────────────────────────────────

/**
 * Parameters for a single ECOS StatisticSearch request.
 * Maps to the ECOS Open API v1 endpoint query parameters.
 * All fields are required constants — no live network in this slice.
 *
 * Source metadata (publishedDate, sourcePageUrl) is carried here so the
 * normalizer never needs to invent or fall back to derived dates.
 */
export interface EcosStatSearchRequest {
  /** ECOS statistical table code (e.g. "722Y001" for base rate). */
  readonly statCode: string;
  /** Cycle type: "A"=annual, "Q"=quarterly, "M"=monthly, "D"=daily. */
  readonly cycle: "A" | "Q" | "M" | "D";
  /** Start period in ECOS cycle format (e.g. "202501" for Jan 2025 monthly). */
  readonly startDate: string;
  /** End period — same format as startDate. Use same value for a single period. */
  readonly endDate: string;
  /** ECOS item code inside the table (e.g. "0101000" for base rate item). */
  readonly itemCode1: string;
  /** Human-readable description of what this request retrieves (for logging only). */
  readonly description: string;
  /**
   * Official source published date (ISO date YYYY-MM-DD).
   * Must be supplied by caller from known fixture/reference — do not derive or fallback.
   * Example: "2025-01-16" for the Jan 2025 BOK base-rate announcement.
   */
  readonly publishedDate: string;
  /**
   * Human-facing ECOS stat page URL — reviewable by Owner in the Fact Card/citation.
   * Distinct from the API endpoint URL, which belongs in rawPayload only.
   * Example: "https://ecos.bok.or.kr/#/Short/722Y001"
   */
  readonly sourcePageUrl: string;
  /**
   * Display name for the source, used in Fact Card sourceName.
   * Example: "한국은행 ECOS — 기준금리"
   */
  readonly sourceName: string;
}

// ── ECOS API response row ─────────────────────────────────────────────────────

/**
 * A single row returned by the ECOS StatisticSearch API.
 * Field names mirror the ECOS JSON response schema.
 * All numeric values arrive as strings from the API.
 */
export interface EcosStatRow {
  /** Statistical table code. */
  readonly STAT_CODE: string;
  /** Statistical table name (Korean). */
  readonly STAT_NAME: string;
  /** Item code level 1. */
  readonly ITEM_CODE1: string;
  /** Item name level 1 (Korean indicator name). */
  readonly ITEM_NAME1: string;
  /** Data period in ECOS format (e.g. "202501"). */
  readonly TIME: string;
  /** Data value as string (ECOS returns numbers as strings). */
  readonly DATA_VALUE: string;
  /** Unit of measure string (e.g. "%"). */
  readonly UNIT_NAME: string;
}

/**
 * Top-level ECOS API response envelope.
 * The actual rows are nested under StatisticSearch → row.
 */
export interface EcosApiResponse {
  readonly StatisticSearch: {
    readonly list_total_count: number;
    readonly row: readonly EcosStatRow[];
  };
}

// ── Transport boundary ────────────────────────────────────────────────────────

/**
 * Outcome of a single connector execute attempt.
 * ok=true: rows contains at least one row.
 * ok=false: rows is empty, error describes the reason.
 *
 * Transport is responsible for I/O; normalizer is responsible for
 * converting rows into RawDataSnapshot — keep the two concerns separate.
 */
export type EcosConnectorResult =
  | { readonly ok: true; readonly rows: readonly EcosStatRow[]; readonly fetchedAt: string }
  | { readonly ok: false; readonly error: string; readonly fetchedAt: string };

/**
 * Transport interface for ECOS connector.
 *
 * Implementors:
 * - EcosMockTransport: returns deterministic fixture data (this slice)
 * - EcosLiveTransport: calls the real ECOS API (requires explicit Owner approval)
 *
 * Uses `execute()` rather than `fetch()` to avoid collision with the global fetch API.
 * No process.env access at the interface level.
 */
export interface EcosTransport {
  readonly transportId: string;
  execute(request: EcosStatSearchRequest): EcosConnectorResult;
}

// ── Base-rate request constant ─────────────────────────────────────────────────

/**
 * ECOS StatSearch request spec for the Bank of Korea base rate (Jan 2025).
 * publishedDate and sourcePageUrl are explicit — normalizer must not derive them.
 */
export const ECOS_BASE_RATE_REQUEST_JAN2025: EcosStatSearchRequest = {
  statCode: "722Y001",
  cycle: "M",
  startDate: "202501",
  endDate: "202501",
  itemCode1: "0101000",
  description: "한국은행 기준금리 (ECOS 722Y001, 2025년 1월)",
  publishedDate: "2025-01-16",
  sourcePageUrl: "https://ecos.bok.or.kr/#/Short/722Y001",
  sourceName: "한국은행 ECOS — 기준금리",
};

// ── Mock transport factory ────────────────────────────────────────────────────

/**
 * Creates a mock transport that returns pre-defined fixture rows.
 * The fetchedAt timestamp is a caller-supplied constant (no Date.now).
 *
 * Usage:
 *   const transport = createEcosMockTransport(mockRows, "2026-06-25T00:00:00+09:00");
 *   const result = transport.execute(ECOS_BASE_RATE_REQUEST_JAN2025);
 */
export function createEcosMockTransport(
  rows: readonly EcosStatRow[],
  fetchedAt: string,
): EcosTransport {
  return {
    transportId: "mock",
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    execute(request: EcosStatSearchRequest): EcosConnectorResult {
      if (rows.length === 0) {
        return { ok: false, error: "mock transport: no rows configured", fetchedAt };
      }
      return { ok: true, rows, fetchedAt };
    },
  };
}

// ── Connector run helper ───────────────────────────────────────────────────────

/**
 * Runs a transport execute for the given request and normalizes the result
 * into a RawDataSnapshot using the supplied normalizer function.
 *
 * The full request is passed to the normalizer so it can use publishedDate
 * and sourcePageUrl without deriving or inventing values.
 *
 * Returns null when the transport reports an error or rows are empty.
 * Never throws — normalizer errors surface as null.
 */
export function runEcosConnector(
  request: EcosStatSearchRequest,
  transport: EcosTransport,
  normalize: (
    rows: readonly EcosStatRow[],
    fetchedAt: string,
    request: EcosStatSearchRequest,
  ) => RawDataSnapshot | null,
): RawDataSnapshot | null {
  const result = transport.execute(request);
  if (!result.ok) return null;
  if (result.rows.length === 0) return null;
  return normalize(result.rows, result.fetchedAt, request);
}
