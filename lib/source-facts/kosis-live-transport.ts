import type {
  KosisAsyncTransport,
  KosisConnectorResult,
  KosisStatSearchRequest,
} from "./kosis-connector";
import {
  orderKosisRowsCurrentFirst,
  parseKosisStatSearchRows,
  parseKosisErrorMessage,
} from "./kosis-connector";

// ── KOSIS live transport ────────────────────────────────────────────────────────
//
// ecos-live-transport.ts와 같은 안전 원칙: API 키는 절대 로그/반환/에러 메시지에
// 노출하지 않는다.

const KOSIS_API_BASE = "https://kosis.kr/openapi/Param/statisticsParameterData.do";

export const KOSIS_API_KEY_ENV_NAMES = ["KOSIS_API_KEY"] as const;

export function resolveKosisApiKey(): string | null {
  for (const name of KOSIS_API_KEY_ENV_NAMES) {
    const value = process.env[name];
    if (typeof value === "string" && value.trim().length > 0) return value.trim();
  }
  return null;
}

export function hasKosisApiKey(): boolean {
  return resolveKosisApiKey() !== null;
}

/** apiKey를 쿼리스트링에 담는다 — secret-bearing URL이므로 로그/에러에 노출 금지. */
export function buildKosisStatSearchUrl(apiKey: string, request: KosisStatSearchRequest): string {
  const params = new URLSearchParams({
    method: "getList",
    apiKey,
    itmId: request.itmId,
    objL1: request.objL1,
    objL2: "",
    objL3: "",
    objL4: "",
    format: "json",
    jsonVD: "Y",
    prdSe: request.prdSe,
    startPrdDe: request.startPrdDe,
    endPrdDe: request.endPrdDe,
    orgId: request.orgId,
    tblId: request.tblId,
  });
  return `${KOSIS_API_BASE}?${params.toString()}`;
}

export function createKosisLiveTransport(fetchedAt: string): KosisAsyncTransport {
  return {
    transportId: "live",
    async executeAsync(request: KosisStatSearchRequest): Promise<KosisConnectorResult> {
      const apiKey = resolveKosisApiKey();
      if (apiKey === null) {
        return {
          ok: false,
          error: `KOSIS API key missing: set one of ${KOSIS_API_KEY_ENV_NAMES.join(", ")}`,
          fetchedAt,
        };
      }

      const url = buildKosisStatSearchUrl(apiKey, request);

      let response: Response;
      try {
        response = await fetch(url);
      } catch {
        return { ok: false, error: "KOSIS live request failed: network error", fetchedAt };
      }

      if (!response.ok) {
        return { ok: false, error: `KOSIS live request failed: HTTP ${response.status}`, fetchedAt };
      }

      let json: unknown;
      try {
        json = await response.json();
      } catch {
        return { ok: false, error: "KOSIS live request failed: invalid JSON", fetchedAt };
      }

      const errorMessage = parseKosisErrorMessage(json);
      if (errorMessage !== null) {
        return { ok: false, error: errorMessage, fetchedAt };
      }

      const rows = parseKosisStatSearchRows(json);
      if (rows === null) {
        return { ok: false, error: "KOSIS live response: no usable rows", fetchedAt };
      }

      return { ok: true, rows: orderKosisRowsCurrentFirst(rows), fetchedAt };
    },
  };
}
