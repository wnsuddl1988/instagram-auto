import type { DisclosureDocument } from "./types";

// ── DART (OpenDART) 공시검색 API request specification ────────────────────────
//
// Mirrors the ECOS connector shape (request/response/transport/normalizer
// separation). See ecos-connector.ts for the pattern this follows.

/**
 * Disclosure category filter (`pblntf_ty` in the DART API).
 * "A"=정기공시, "B"=주요사항보고, "C"=발행공시, "D"=지분공시,
 * "E"=기타공시, "F"=외부감사관련, "G"=펀드공시, "H"=자산유동화, "I"=거래소공시, "J"=공정위공시.
 * Kept as a narrow union so a typo cannot silently request the wrong category.
 */
export type DartDisclosureType =
  | "A"
  | "B"
  | "C"
  | "D"
  | "E"
  | "F"
  | "G"
  | "H"
  | "I"
  | "J";

/**
 * Parameters for a single DART list.json (공시검색) request.
 * Maps to the OpenDART Open API v1 list endpoint query parameters.
 */
export interface DartDisclosureSearchRequest {
  /**
   * 8-digit DART corporation code (고유번호), not the stock ticker. Omit to
   * search across ALL companies for the date range — DART's list.json treats
   * corp_code as optional (2026-09-23 확인: 특정 회사가 아니라 "오늘 시장
   * 전체에서 어떤 공시가 나왔는지" 스캔하려면 이 필드를 생략해야 한다 —
   * 황소특보 공급계약/수주 공시 감지가 정확히 이 용도).
   */
  readonly corpCode?: string;
  /** Search start date, DART format YYYYMMDD. */
  readonly beginDate: string;
  /** Search end date, DART format YYYYMMDD. */
  readonly endDate: string;
  /** Optional disclosure category filter. Omit to search all categories. */
  readonly disclosureType?: DartDisclosureType;
  /** Page number (1-based). Defaults to 1 when omitted. */
  readonly pageNo?: number;
  /** Rows per page (max 100 per DART limits). Defaults to 20 when omitted. */
  readonly pageCount?: number;
  /** Human-readable description of what this request retrieves (for logging only). */
  readonly description: string;
}

export class DartRequestError extends Error {
  constructor(message: string) {
    super(`dart request invalid: ${message}`);
    this.name = "DartRequestError";
  }
}

const DART_CORP_CODE_RE = /^\d{8}$/;
const DART_DATE_RE = /^\d{8}$/;
export const DART_PAGE_COUNT_MAX = 100;

export function buildDartDisclosureSearchRequest(
  input: Omit<DartDisclosureSearchRequest, "pageNo" | "pageCount"> & {
    pageNo?: number;
    pageCount?: number;
  },
): DartDisclosureSearchRequest {
  if (input.corpCode !== undefined && !DART_CORP_CODE_RE.test(input.corpCode)) {
    throw new DartRequestError("corpCode must be an 8-digit DART corp code (or omitted for an all-company scan)");
  }
  if (!DART_DATE_RE.test(input.beginDate)) {
    throw new DartRequestError("beginDate must be YYYYMMDD");
  }
  if (!DART_DATE_RE.test(input.endDate)) {
    throw new DartRequestError("endDate must be YYYYMMDD");
  }
  if (input.beginDate > input.endDate) {
    throw new DartRequestError("beginDate must not be after endDate");
  }
  const pageNo = input.pageNo ?? 1;
  const pageCount = input.pageCount ?? 20;
  if (!Number.isInteger(pageNo) || pageNo < 1) {
    throw new DartRequestError("pageNo must be a positive integer");
  }
  if (!Number.isInteger(pageCount) || pageCount < 1 || pageCount > DART_PAGE_COUNT_MAX) {
    throw new DartRequestError(`pageCount must be 1..${DART_PAGE_COUNT_MAX}`);
  }
  return {
    corpCode: input.corpCode,
    beginDate: input.beginDate,
    endDate: input.endDate,
    disclosureType: input.disclosureType,
    pageNo,
    pageCount,
    description: input.description,
  };
}

// ── DART API response row (as documented by the OpenDART list.json endpoint) ──

/**
 * A single row returned by the DART list.json (공시검색) API.
 * Field names mirror the DART JSON response schema exactly.
 */
export interface DartDisclosureRawItem {
  /** 법인구분: Y=유가, K=코스닥, N=코넥스, E=기타. */
  readonly corp_cls: string;
  readonly corp_name: string;
  /** 8-digit DART corp code. */
  readonly corp_code: string;
  /** Stock ticker, empty string when the entity is unlisted. */
  readonly stock_code: string;
  /** 공시 제목 (report title). */
  readonly report_nm: string;
  /** 접수번호 — used to build the canonical viewer URL. */
  readonly rcept_no: string;
  /** 공시 제출인. */
  readonly flr_nm: string;
  /** 접수일자, format YYYYMMDD. */
  readonly rcept_dt: string;
  /** "유" when the filing was later corrected/superseded. */
  readonly rm: string;
}

export interface DartDisclosureRawResponse {
  /** "000" = success. Any other code means the request failed (see DART error codes). */
  readonly status: string;
  readonly message: string;
  readonly page_no?: number;
  readonly page_count?: number;
  readonly total_count?: number;
  readonly total_page?: number;
  readonly list?: readonly DartDisclosureRawItem[];
}

export type DartConnectorResult =
  | { readonly ok: true; readonly items: readonly DartDisclosureRawItem[]; readonly fetchedAt: string }
  | { readonly ok: false; readonly error: string; readonly fetchedAt: string };

/**
 * Async transport interface for the DART connector (all DART calls are network I/O).
 * Mirrors EcosAsyncTransport: no process.env access at the interface level.
 */
export interface DartAsyncTransport {
  readonly transportId: string;
  executeAsync(request: DartDisclosureSearchRequest): Promise<DartConnectorResult>;
}

// ── Canonical viewer URL ────────────────────────────────────────────────────────

/** DART's public disclosure viewer, keyed by rcept_no — always resolvable without an API key. */
export function buildDartViewerUrl(rceptNo: string): string {
  return `https://dart.fss.or.kr/dsaf001/main.do?rcpNo=${encodeURIComponent(rceptNo)}`;
}

// ── Date helper ───────────────────────────────────────────────────────────────

/** Converts a DART YYYYMMDD date string to ISO YYYY-MM-DD. Returns null when malformed. */
export function dartDateToIso(raw: string): string | null {
  if (!DART_DATE_RE.test(raw)) return null;
  return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
}

// ── Normalization ────────────────────────────────────────────────────────────

/**
 * Normalizes a single DART disclosure row into a DisclosureDocument.
 * Returns null when the row's rcept_dt cannot be parsed — an invented
 * publish date would silently defeat downstream freshness checks.
 */
export function normalizeDartDisclosureItem(
  item: DartDisclosureRawItem,
  sourceProviderId: string,
): DisclosureDocument | null {
  const publishedAt = dartDateToIso(item.rcept_dt);
  if (publishedAt === null) return null;
  if (item.report_nm.trim().length === 0) return null;
  if (item.rcept_no.trim().length === 0) return null;

  return {
    id: `dart-${item.rcept_no}`,
    sourceProviderId,
    companyName: item.corp_name,
    stockCode: item.stock_code.trim().length > 0 ? item.stock_code : undefined,
    documentTitle: item.report_nm,
    documentType: item.corp_cls,
    publishedAt,
    sourceUrl: buildDartViewerUrl(item.rcept_no),
    rawSnapshotId: item.rcept_no,
  };
}

/**
 * Normalizes a full DART response into DisclosureDocument[], dropping rows
 * that fail validation rather than throwing — one malformed row must not
 * blank out an entire day's disclosure list.
 */
export function normalizeDartDisclosureItems(
  items: readonly DartDisclosureRawItem[],
  sourceProviderId: string,
): readonly DisclosureDocument[] {
  const out: DisclosureDocument[] = [];
  for (const item of items) {
    const doc = normalizeDartDisclosureItem(item, sourceProviderId);
    if (doc !== null) out.push(doc);
  }
  return out;
}

// ── Runner ────────────────────────────────────────────────────────────────────

export type DartCollectOutcome =
  | { readonly ok: true; readonly documents: readonly DisclosureDocument[] }
  | { readonly ok: false; readonly reason: string };

export async function collectDartDisclosures(
  request: DartDisclosureSearchRequest,
  transport: DartAsyncTransport,
  sourceProviderId: string,
): Promise<DartCollectOutcome> {
  const result = await transport.executeAsync(request);
  if (!result.ok) return { ok: false, reason: result.error };
  return {
    ok: true,
    documents: normalizeDartDisclosureItems(result.items, sourceProviderId),
  };
}

// ── Mock transport ────────────────────────────────────────────────────────────

export function createDartMockTransport(
  fixtures: ReadonlyMap<string, DartConnectorResult>,
  keyFn: (request: DartDisclosureSearchRequest) => string = (r) =>
    `${r.corpCode}:${r.beginDate}:${r.endDate}`,
): DartAsyncTransport {
  return {
    transportId: "dart-mock",
    executeAsync(request) {
      const key = keyFn(request);
      const fixture = fixtures.get(key);
      return Promise.resolve(
        fixture ?? {
          ok: false,
          error: `no fixture for request: ${key}`,
          fetchedAt: "1970-01-01T00:00:00.000Z",
        },
      );
    },
  };
}
