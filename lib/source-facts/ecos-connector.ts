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
   * Empty string ("") means "not yet verified"; the normalizer will refuse to
   * produce a snapshot in that case to prevent empty-publishedDate snapshots.
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
  /**
   * First row index to request from ECOS (1-based, inclusive). Defaults to 1 when omitted.
   * Callers that need more than the default 10-row cap (e.g. a 12-month latest-period
   * window) must set rowEnd to cover the full window.
   */
  readonly rowStart?: number;
  /**
   * Last row index to request from ECOS (1-based, inclusive). Defaults to 10 when omitted.
   * Set higher (e.g. 24) for latest-period window requests that span more than 10 months.
   */
  readonly rowEnd?: number;
  /**
   * Source provider ID to stamp on the normalized snapshot.
   * Defaults to "provider-ecos-mock" when omitted (preserves existing mock path).
   * Use "provider-ecos-live" for live/latest production requests so candidates
   * are not labeled as mock data.
   */
  readonly sourceProviderId?: string;
  /**
   * Display name of the authoritative source for the verified publishedDate.
   * Set by callers that run resolveEcosBaseRateSourceDate() before normalizing.
   * Example: "한국은행 통화정책방향 결정회의 — 기준금리 변경 이력"
   * When omitted the normalizer omits this provenance from rawPayload.
   */
  readonly sourceDateSourceName?: string;
  /**
   * Human-facing URL of the authoritative source for the verified publishedDate.
   * Set by callers that run resolveEcosBaseRateSourceDate() before normalizing.
   * Example: "https://www.bok.or.kr/portal/singl/baseRate/list.do?dataSeCd=01&menuNo=200643"
   * When omitted the normalizer omits this provenance from rawPayload.
   */
  readonly sourceDateSourceUrl?: string;
  /**
   * The ECOS numeric rate value that was matched against the official BOK decision.
   * Preserved in rawPayload for traceability (proves the date was not invented).
   * When omitted the normalizer omits this provenance from rawPayload.
   */
  readonly sourceDateMatchedValue?: number;
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

/**
 * Async transport interface for connectors that perform I/O (e.g. live HTTP).
 *
 * Separate from the synchronous EcosTransport so the existing mock scaffold and
 * its module-level candidate constants stay synchronous (never Promise-polluted).
 *
 * Implementors:
 * - EcosLiveTransport: calls the real ECOS API via fetch() (requires Owner approval)
 */
export interface EcosAsyncTransport {
  readonly transportId: string;
  executeAsync(request: EcosStatSearchRequest): Promise<EcosConnectorResult>;
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

/**
 * Two-period base-rate request (Dec 2024 → Jan 2025) for the live check.
 *
 * normalizeEcosBaseRateRows() needs two rows (current + previous) to derive
 * the change value, so the live request spans both periods. ECOS returns rows
 * in ascending TIME order; use orderEcosRowsCurrentFirst() before normalizing.
 * EcosLiveTransport.executeAsync() applies this ordering automatically so the
 * runEcosConnectorAsync(..., normalizeEcosBaseRateRows) primary path is safe.
 */
export const ECOS_BASE_RATE_REQUEST_2P: EcosStatSearchRequest = {
  statCode: "722Y001",
  cycle: "M",
  startDate: "202412",
  endDate: "202501",
  itemCode1: "0101000",
  description: "한국은행 기준금리 (ECOS 722Y001, 2024년 12월~2025년 1월)",
  publishedDate: "2025-01-16",
  sourcePageUrl: "https://ecos.bok.or.kr/#/Short/722Y001",
  sourceName: "한국은행 ECOS — 기준금리",
};

// ── Row ordering ─────────────────────────────────────────────────────────────

/**
 * Returns rows sorted current-first (descending by TIME string).
 *
 * ECOS StatisticSearch returns rows in ascending TIME order. The normalizer
 * expects rows[0] = current period, rows[1] = previous period, so any live or
 * test caller must order them before normalizing.
 *
 * Does not mutate the input array.
 */
export function orderEcosRowsCurrentFirst(
  rows: readonly EcosStatRow[],
): readonly EcosStatRow[] {
  return [...rows].sort((a, b) => b.TIME.localeCompare(a.TIME));
}

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

/**
 * Async variant of runEcosConnector for transports that perform I/O.
 *
 * Awaits the async transport, then normalizes the rows the same way the
 * synchronous helper does. The full request is passed to the normalizer so
 * it can use publishedDate and sourcePageUrl without inventing values.
 *
 * Returns null when the transport reports an error or rows are empty.
 */
export async function runEcosConnectorAsync(
  request: EcosStatSearchRequest,
  transport: EcosAsyncTransport,
  normalize: (
    rows: readonly EcosStatRow[],
    fetchedAt: string,
    request: EcosStatSearchRequest,
  ) => RawDataSnapshot | null,
): Promise<RawDataSnapshot | null> {
  const result = await transport.executeAsync(request);
  if (!result.ok) return null;
  if (result.rows.length === 0) return null;
  return normalize(result.rows, result.fetchedAt, request);
}
