// ── KOSIS Open API 요청/응답 타입 ────────────────────────────────────────────
//
// ECOS(ecos-connector.ts)와 별개의 API·응답 스키마다. KOSIS는
// statisticsParameterData.do 엔드포인트가 배열을 바로 반환한다(ECOS처럼
// { StatisticSearch: { row } } 로 감싸지 않는다).

export interface KosisStatSearchRequest {
  /** KOSIS 기관 코드 (예: "101" = 국가데이터처). */
  readonly orgId: string;
  /** KOSIS 통계표 ID (예: "DT_1DA7004S" = 경제활동인구조사). */
  readonly tblId: string;
  /** 조회할 항목 ID. "ALL"이면 그 통계표의 모든 항목. */
  readonly itmId: string;
  /** 1차 분류 코드. "ALL" 또는 "00"(전국) 등. */
  readonly objL1: string;
  /** 주기: "M"=월, "Q"=분기, "A"=연. */
  readonly prdSe: "M" | "Q" | "A";
  readonly startPrdDe: string;
  readonly endPrdDe: string;
  readonly description: string;
  readonly publishedDate: string;
  readonly sourcePageUrl: string;
  readonly sourceName: string;
  readonly sourceProviderId?: string;
  readonly sourceDateSourceName?: string;
  readonly sourceDateSourceUrl?: string;
}

/** KOSIS statisticsParameterData.do 응답의 한 행. */
export interface KosisStatRow {
  readonly TBL_ID: string;
  readonly TBL_NM: string;
  readonly ITM_ID: string;
  readonly ITM_NM: string;
  readonly C1: string;
  readonly C1_NM: string;
  /** 데이터 기간(YYYYMM 등, PRD_SE에 따라 형식이 다름). */
  readonly PRD_DE: string;
  readonly PRD_SE: string;
  /** 실제 값(문자열, 소수 포함 가능). */
  readonly DT: string;
  readonly UNIT_NM: string;
  readonly ORG_ID: string;
}

function isKosisStatRow(row: unknown): row is KosisStatRow {
  if (typeof row !== "object" || row === null) return false;
  const r = row as Record<string, unknown>;
  return (
    typeof r.TBL_ID === "string" &&
    typeof r.ITM_ID === "string" &&
    typeof r.ITM_NM === "string" &&
    typeof r.PRD_DE === "string" &&
    typeof r.DT === "string" &&
    typeof r.UNIT_NM === "string"
  );
}

interface KosisErrorEnvelope {
  readonly err: string;
  readonly errMsg: string;
}

function isKosisErrorEnvelope(json: unknown): json is KosisErrorEnvelope {
  if (typeof json !== "object" || json === null) return false;
  const r = json as Record<string, unknown>;
  return typeof r.err === "string" && typeof r.errMsg === "string";
}

/** KOSIS 응답 JSON을 KosisStatRow[]로 파싱한다. 배열이 아니거나 유효 행이 없으면 null. */
export function parseKosisStatSearchRows(json: unknown): readonly KosisStatRow[] | null {
  if (isKosisErrorEnvelope(json)) return null;
  if (!Array.isArray(json)) return null;
  const valid = json.filter(isKosisStatRow);
  return valid.length > 0 ? valid : null;
}

export function parseKosisErrorMessage(json: unknown): string | null {
  if (isKosisErrorEnvelope(json)) return `KOSIS API error ${json.err}: ${json.errMsg}`;
  return null;
}

export type KosisConnectorResult =
  | { readonly ok: true; readonly rows: readonly KosisStatRow[]; readonly fetchedAt: string }
  | { readonly ok: false; readonly error: string; readonly fetchedAt: string };

export interface KosisAsyncTransport {
  readonly transportId: string;
  executeAsync(request: KosisStatSearchRequest): Promise<KosisConnectorResult>;
}

/** rows를 PRD_DE 내림차순(최신 우선)으로 정렬한다. 입력을 변형하지 않는다. */
export function orderKosisRowsCurrentFirst(
  rows: readonly KosisStatRow[],
): readonly KosisStatRow[] {
  return [...rows].sort((a, b) => b.PRD_DE.localeCompare(a.PRD_DE));
}
