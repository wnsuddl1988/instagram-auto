import type {
  DartAsyncTransport,
  DartConnectorResult,
  DartDisclosureRawItem,
  DartDisclosureSearchRequest,
} from "./dart-connector";

// ── DART (OpenDART) live transport ─────────────────────────────────────────────
//
// The only module in this connector that performs network I/O and reads an
// environment variable. Mirrors ecos-live-transport.ts.
//
// Secret safety:
// - The API key is a query parameter on the DART API (crtfc_key) — it is never
//   logged or embedded in error messages.
// - Error messages describe the failure category only.

const DART_API_BASE = "https://opendart.fss.or.kr/api/list.json";

/** Env var names checked in priority order. The first defined non-empty value is used. */
export const DART_API_KEY_ENV_NAMES = ["DART_API_KEY", "IROS_OPENDART_API_KEY"] as const;

/**
 * Resolves the DART API key from the environment without exposing its value.
 * Callers must never print or persist the returned value.
 */
export function resolveDartApiKey(): string | null {
  for (const name of DART_API_KEY_ENV_NAMES) {
    const value = process.env[name];
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }
  return null;
}

export function hasDartApiKey(): boolean {
  return resolveDartApiKey() !== null;
}

/**
 * Builds the DART list.json request URL.
 *
 * The API key is a query parameter (crtfc_key) — this URL is secret-bearing
 * and must never be logged or returned in errors. Keep it local to the fetch call.
 */
export function buildDartListUrl(
  apiKey: string,
  request: DartDisclosureSearchRequest,
): string {
  const url = new URL(DART_API_BASE);
  url.searchParams.set("crtfc_key", apiKey);
  // corp_code 생략 시 DART가 전체 회사 대상으로 검색한다(전체 시장 스캔용).
  if (request.corpCode) {
    url.searchParams.set("corp_code", request.corpCode);
  }
  url.searchParams.set("bgn_de", request.beginDate);
  url.searchParams.set("end_de", request.endDate);
  if (request.disclosureType) {
    url.searchParams.set("pblntf_ty", request.disclosureType);
  }
  url.searchParams.set("page_no", String(request.pageNo ?? 1));
  url.searchParams.set("page_count", String(request.pageCount ?? 20));
  return url.toString();
}

// ── Response shape guards ──────────────────────────────────────────────────────

function isDartDisclosureRawItem(row: unknown): row is DartDisclosureRawItem {
  if (typeof row !== "object" || row === null) return false;
  const r = row as Record<string, unknown>;
  return (
    typeof r.corp_cls === "string" &&
    typeof r.corp_name === "string" &&
    typeof r.corp_code === "string" &&
    typeof r.stock_code === "string" &&
    typeof r.report_nm === "string" &&
    typeof r.rcept_no === "string" &&
    typeof r.flr_nm === "string" &&
    typeof r.rcept_dt === "string" &&
    typeof r.rm === "string"
  );
}

/**
 * DART error status codes documented by OpenDART. "000" is success;
 * "013" specifically means "no matching results" (not a transport failure).
 */
const DART_STATUS_SUCCESS = "000";
const DART_STATUS_NO_RESULTS = "013";

function describeDartStatus(status: string, message: string): string {
  switch (status) {
    case "010":
      return "DART API error: registration required (unregistered API key)";
    case "011":
      return "DART API error: invalid API key";
    case "012":
      return "DART API error: no access permission for this key";
    case "020":
      return "DART API error: request limit exceeded";
    case "100":
      return "DART API error: missing required field";
    case "800":
      return "DART API error: service under maintenance";
    case "900":
    case "901":
      return "DART API error: internal server error";
    default:
      return `DART API error ${status}: ${message}`;
  }
}

/**
 * Parses the DART list.json response body. Returns items=[] with ok:true when
 * status="013" (no matching disclosures) since that is a valid empty result,
 * not a transport failure — callers should not treat it as an error.
 */
export function parseDartListResponse(
  json: unknown,
): { readonly ok: true; readonly items: readonly DartDisclosureRawItem[] } | { readonly ok: false; readonly error: string } {
  if (typeof json !== "object" || json === null) {
    return { ok: false, error: "DART live response: not a JSON object" };
  }
  const root = json as Record<string, unknown>;
  const status = typeof root.status === "string" ? root.status : "";
  const message = typeof root.message === "string" ? root.message : "";

  if (status === DART_STATUS_NO_RESULTS) {
    return { ok: true, items: [] };
  }
  if (status !== DART_STATUS_SUCCESS) {
    return { ok: false, error: describeDartStatus(status, message) };
  }
  if (!Array.isArray(root.list)) {
    return { ok: false, error: "DART live response: status=000 but list is missing" };
  }
  const valid = root.list.filter(isDartDisclosureRawItem);
  return { ok: true, items: valid };
}

// ── Live transport implementation ──────────────────────────────────────────────

/**
 * Live DART transport. Implements DartAsyncTransport.
 *
 * fetchedAt is supplied by the caller so the transport stays deterministic-friendly
 * and avoids Date.now() inside the library (mirrors ecos-live-transport.ts).
 */
export function createDartLiveTransport(
  fetchedAt: string,
  options: { readonly timeoutMs?: number } = {},
): DartAsyncTransport {
  const timeoutMs = options.timeoutMs ?? 10_000;

  return {
    transportId: "dart-live",
    async executeAsync(request: DartDisclosureSearchRequest): Promise<DartConnectorResult> {
      const apiKey = resolveDartApiKey();
      if (apiKey === null) {
        return {
          ok: false,
          error: `DART API key missing: set one of ${DART_API_KEY_ENV_NAMES.join(", ")}`,
          fetchedAt,
        };
      }

      const url = buildDartListUrl(apiKey, request);
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      let response: Response;
      try {
        response = await fetch(url, { signal: controller.signal });
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return { ok: false, error: `DART live request timed out after ${timeoutMs}ms`, fetchedAt };
        }
        // Deliberately not surfacing error.message: it can echo the request URL (carries the key).
        return { ok: false, error: "DART live request failed: network error", fetchedAt };
      } finally {
        clearTimeout(timer);
      }

      if (!response.ok) {
        return { ok: false, error: `DART live request failed: HTTP ${response.status}`, fetchedAt };
      }

      let json: unknown;
      try {
        json = await response.json();
      } catch {
        return { ok: false, error: "DART live request failed: invalid JSON", fetchedAt };
      }

      const parsed = parseDartListResponse(json);
      if (!parsed.ok) {
        return { ok: false, error: parsed.error, fetchedAt };
      }
      return { ok: true, items: parsed.items, fetchedAt };
    },
  };
}
