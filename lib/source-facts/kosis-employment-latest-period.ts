import type { RawDataSnapshot } from "./types";
import type { KosisStatRow, KosisStatSearchRequest } from "./kosis-connector";
import { orderKosisRowsCurrentFirst } from "./kosis-connector";
import { normalizeKosisGenericRows } from "./kosis-generic-normalizer";

// ── KOSIS 고용률/실업률(DT_1DA7004S) latest-period resolver ────────────────────
// ecos-cpi-latest-period.ts와 같은 패턴. 같은 통계표의 두 item(T90=고용률,
// T80=실업률)을 함께 다룰 수 있도록 itmId를 파라미터로 받는다.

export const KOSIS_EMPLOYMENT_ORG_ID = "101";
export const KOSIS_EMPLOYMENT_TBL_ID = "DT_1DA7004S";
export const KOSIS_EMPLOYMENT_OBJ_L1 = "00"; // 전국
export const KOSIS_EMPLOYMENT_RATE_ITEM = "T90"; // 고용률
export const KOSIS_UNEMPLOYMENT_RATE_ITEM = "T80"; // 실업률
export const KOSIS_EMPLOYMENT_SOURCE_PAGE_URL =
  "https://kosis.kr/statHtml/statHtml.do?orgId=101&tblId=DT_1DA7004S";

export const KOSIS_EMPLOYMENT_WINDOW_MONTHS = 8;

/** 8자리 미만 자리는 채우고 YYYYMM 형식을 검증한다. */
export function isValidKosisMonthlyPeriod(period: string): boolean {
  if (!/^\d{6}$/.test(period)) return false;
  const month = parseInt(period.slice(4, 6), 10);
  return month >= 1 && month <= 12;
}

export function subtractKosisMonths(period: string, months: number): string | null {
  if (!isValidKosisMonthlyPeriod(period)) return null;
  const year = parseInt(period.slice(0, 4), 10);
  const month = parseInt(period.slice(4, 6), 10);
  const absolute = year * 12 + (month - 1) - months;
  if (absolute < 0) return null;
  const newYear = Math.floor(absolute / 12);
  const newMonth = (absolute % 12) + 1;
  return `${String(newYear).padStart(4, "0")}${String(newMonth).padStart(2, "0")}`;
}

export function buildKosisEmploymentLatestWindowRequest(
  endPeriod: string,
  windowMonths: number = KOSIS_EMPLOYMENT_WINDOW_MONTHS,
  itmId: string = KOSIS_EMPLOYMENT_RATE_ITEM,
  sourceName: string = "국가데이터처/KOSIS — 고용률",
): KosisStatSearchRequest | null {
  if (!isValidKosisMonthlyPeriod(endPeriod)) return null;
  if (!Number.isInteger(windowMonths) || windowMonths < 1) return null;
  const startPeriod = subtractKosisMonths(endPeriod, windowMonths - 1);
  if (startPeriod === null) return null;

  return {
    orgId: KOSIS_EMPLOYMENT_ORG_ID,
    tblId: KOSIS_EMPLOYMENT_TBL_ID,
    itmId,
    objL1: KOSIS_EMPLOYMENT_OBJ_L1,
    prdSe: "M",
    startPrdDe: startPeriod,
    endPrdDe: endPeriod,
    description: `${sourceName} latest-period window (KOSIS ${KOSIS_EMPLOYMENT_TBL_ID}/${itmId}, ${startPeriod}~${endPeriod})`,
    publishedDate: "",
    sourcePageUrl: KOSIS_EMPLOYMENT_SOURCE_PAGE_URL,
    sourceName,
  };
}

export function buildKosisUnemploymentLatestWindowRequest(
  endPeriod: string,
  windowMonths: number = KOSIS_EMPLOYMENT_WINDOW_MONTHS,
): KosisStatSearchRequest | null {
  return buildKosisEmploymentLatestWindowRequest(
    endPeriod, windowMonths, KOSIS_UNEMPLOYMENT_RATE_ITEM, "국가데이터처/KOSIS — 실업률",
  );
}

export type KosisEmploymentLatestPeriodResolution =
  | { readonly ok: false; readonly reason: "insufficient_rows"; readonly rowCount: number }
  | {
      readonly ok: true;
      readonly latestRow: KosisStatRow;
      readonly previousRow: KosisStatRow;
      readonly latestPeriod: string;
      readonly previousPeriod: string;
    };

export function resolveLatestKosisEmploymentPeriod(
  rows: readonly KosisStatRow[],
): KosisEmploymentLatestPeriodResolution {
  const ordered = orderKosisRowsCurrentFirst(rows);
  if (ordered.length < 2) return { ok: false, reason: "insufficient_rows", rowCount: ordered.length };
  return {
    ok: true,
    latestRow: ordered[0],
    previousRow: ordered[1],
    latestPeriod: ordered[0].PRD_DE,
    previousPeriod: ordered[1].PRD_DE,
  };
}

export type KosisEmploymentLatestCandidateStatus =
  | "blocked_insufficient_rows"
  | "blocked_pending_source_date"
  | "draft_ready";

export interface KosisEmploymentLatestPeriodReadiness {
  readonly status: KosisEmploymentLatestCandidateStatus;
  readonly reason: string;
  readonly latestPeriod: string | null;
  readonly previousPeriod: string | null;
  readonly snapshot: RawDataSnapshot | null;
  readonly publishable: boolean;
}

export function decideKosisEmploymentLatestPeriodReadiness(
  rows: readonly KosisStatRow[],
  fetchedAt: string,
  verifiedPublishedDate: string | null,
  sourceName: string = "국가데이터처/KOSIS — 고용률",
): KosisEmploymentLatestPeriodReadiness {
  const resolution = resolveLatestKosisEmploymentPeriod(rows);
  if (!resolution.ok) {
    return {
      status: "blocked_insufficient_rows",
      reason: `최신 period 판정에 필요한 row가 부족합니다 (rows=${resolution.rowCount}).`,
      latestPeriod: null,
      previousPeriod: null,
      snapshot: null,
      publishable: false,
    };
  }
  if (verifiedPublishedDate === null || verifiedPublishedDate.trim().length === 0) {
    return {
      status: "blocked_pending_source_date",
      reason: `최신 period(${resolution.latestPeriod})는 확인됐지만, 검증된 publishedDate가 없습니다.`,
      latestPeriod: resolution.latestPeriod,
      previousPeriod: resolution.previousPeriod,
      snapshot: null,
      publishable: false,
    };
  }

  const draftRequest: KosisStatSearchRequest = {
    orgId: resolution.latestRow.ORG_ID,
    tblId: resolution.latestRow.TBL_ID,
    itmId: resolution.latestRow.ITM_ID,
    objL1: KOSIS_EMPLOYMENT_OBJ_L1,
    prdSe: "M",
    startPrdDe: resolution.previousPeriod,
    endPrdDe: resolution.latestPeriod,
    description: `${sourceName} latest draft (${resolution.previousPeriod}~${resolution.latestPeriod})`,
    publishedDate: verifiedPublishedDate,
    sourcePageUrl: KOSIS_EMPLOYMENT_SOURCE_PAGE_URL,
    sourceName,
  };

  const snapshot = normalizeKosisGenericRows(
    [resolution.latestRow, resolution.previousRow],
    fetchedAt,
    draftRequest,
  );

  if (snapshot === null) {
    return {
      status: "blocked_insufficient_rows",
      reason: "검증된 publishedDate가 있었지만 정규화에 실패했습니다.",
      latestPeriod: resolution.latestPeriod,
      previousPeriod: resolution.previousPeriod,
      snapshot: null,
      publishable: false,
    };
  }

  return {
    status: "draft_ready",
    reason: `최신 period(${resolution.latestPeriod}) draft snapshot 생성 완료.`,
    latestPeriod: resolution.latestPeriod,
    previousPeriod: resolution.previousPeriod,
    snapshot,
    publishable: false,
  };
}
