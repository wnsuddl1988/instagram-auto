import type { RawDataSnapshot } from "./types";
import type { EcosStatRow, EcosStatSearchRequest } from "./ecos-connector";
import { orderEcosRowsCurrentFirst } from "./ecos-connector";
import {
  isValidEcosMonthlyPeriod,
  subtractEcosMonths,
  ECOS_LATEST_WINDOW_MONTHS,
} from "./ecos-latest-period";
import { ecosTimeToDataPeriod } from "./ecos-normalizer";
import { normalizeEcosGenericRows } from "./ecos-generic-normalizer";

// ── ECOS 경상수지(301Y013) latest-period resolver ───────────────────────────────
// Mirrors ecos-cpi-latest-period.ts. publishedDate comes from
// resolveEcosBopSourceDate() (ecos-bop-source-date.ts, data-period match).

export const ECOS_BOP_STAT_CODE = "301Y013";
export const ECOS_BOP_ITEM_CODE = "000000";
export const ECOS_BOP_SOURCE_NAME = "한국은행 ECOS — 경상수지";
export const ECOS_BOP_SOURCE_PAGE_URL = "https://ecos.bok.or.kr/#/Short/301Y013";

/**
 * 상품수지(=무역수지, 수출-수입) — 같은 통계표(301Y013)의 다른 item. 같은
 * 보도자료("국제수지(잠정)")에서 경상수지와 함께 발표되므로 발표일 이력
 * (ecos-bop-source-date.ts)을 그대로 재사용한다. sourcePageUrl은 경상수지와
 * 다르게 쿼리스트링으로 item을 구분해야 한다 — evidence adapter가 URL로
 * 중복 소스를 걸러내는데, 같은 #/Short/301Y013 URL을 공유하면 경상수지·
 * 무역수지 중 하나가 "duplicate_url"로 유실된다(2026-09-17 실측 발견:
 * 7개 지표를 함께 수집하면 6개만 evidence pack에 남는 버그였음).
 */
export const ECOS_TRADE_BALANCE_ITEM_CODE = "100000";
export const ECOS_TRADE_BALANCE_SOURCE_NAME = "한국은행 ECOS — 상품수지(무역수지)";
export const ECOS_TRADE_BALANCE_SOURCE_PAGE_URL = "https://ecos.bok.or.kr/#/Short/301Y013?item=100000";

export function buildEcosBopLatestWindowRequest(
  endPeriod: string,
  windowMonths: number = ECOS_LATEST_WINDOW_MONTHS,
  itemCode1: string = ECOS_BOP_ITEM_CODE,
  sourceName: string = ECOS_BOP_SOURCE_NAME,
  sourcePageUrl: string = ECOS_BOP_SOURCE_PAGE_URL,
): EcosStatSearchRequest | null {
  if (!isValidEcosMonthlyPeriod(endPeriod)) return null;
  if (!Number.isInteger(windowMonths) || windowMonths < 1) return null;
  const startPeriod = subtractEcosMonths(endPeriod, windowMonths - 1);
  if (startPeriod === null) return null;

  return {
    statCode: ECOS_BOP_STAT_CODE,
    cycle: "M",
    startDate: startPeriod,
    endDate: endPeriod,
    itemCode1,
    description: `${sourceName} latest-period window (ECOS ${ECOS_BOP_STAT_CODE}, ${startPeriod}~${endPeriod})`,
    publishedDate: "",
    sourcePageUrl,
    sourceName,
    rowStart: 1,
    rowEnd: windowMonths + 2,
  };
}

export function buildEcosTradeBalanceLatestWindowRequest(
  endPeriod: string,
  windowMonths: number = ECOS_LATEST_WINDOW_MONTHS,
): EcosStatSearchRequest | null {
  return buildEcosBopLatestWindowRequest(
    endPeriod, windowMonths, ECOS_TRADE_BALANCE_ITEM_CODE, ECOS_TRADE_BALANCE_SOURCE_NAME, ECOS_TRADE_BALANCE_SOURCE_PAGE_URL,
  );
}

export type EcosBopLatestPeriodResolution =
  | { readonly ok: false; readonly reason: "insufficient_rows"; readonly rowCount: number }
  | {
      readonly ok: true;
      readonly latestRow: EcosStatRow;
      readonly previousRow: EcosStatRow;
      readonly latestPeriod: string;
      readonly previousPeriod: string;
    };

export function resolveLatestEcosBopPeriod(rows: readonly EcosStatRow[]): EcosBopLatestPeriodResolution {
  const ordered = orderEcosRowsCurrentFirst(rows);
  if (ordered.length < 2) return { ok: false, reason: "insufficient_rows", rowCount: ordered.length };
  return {
    ok: true,
    latestRow: ordered[0],
    previousRow: ordered[1],
    latestPeriod: ordered[0].TIME,
    previousPeriod: ordered[1].TIME,
  };
}

export type EcosBopLatestCandidateStatus =
  | "blocked_insufficient_rows"
  | "blocked_pending_source_date"
  | "draft_ready";

export interface EcosBopLatestPeriodReadiness {
  readonly status: EcosBopLatestCandidateStatus;
  readonly reason: string;
  readonly latestPeriod: string | null;
  readonly previousPeriod: string | null;
  readonly snapshot: RawDataSnapshot | null;
  readonly publishable: boolean;
}

export function decideEcosBopLatestPeriodReadiness(
  rows: readonly EcosStatRow[],
  fetchedAt: string,
  verifiedPublishedDate: string | null,
): EcosBopLatestPeriodReadiness {
  const resolution = resolveLatestEcosBopPeriod(rows);
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
      reason: `최신 period(${resolution.latestPeriod})는 확인됐지만, 검증된 publishedDate가 없어 publishable Fact Card로 만들 수 없습니다.`,
      latestPeriod: resolution.latestPeriod,
      previousPeriod: resolution.previousPeriod,
      snapshot: null,
      publishable: false,
    };
  }

  const draftRequest: EcosStatSearchRequest = {
    statCode: resolution.latestRow.STAT_CODE,
    cycle: "M",
    startDate: resolution.previousPeriod,
    endDate: resolution.latestPeriod,
    itemCode1: resolution.latestRow.ITEM_CODE1,
    description: `경상수지 latest draft (${resolution.previousPeriod}~${resolution.latestPeriod})`,
    publishedDate: verifiedPublishedDate,
    sourcePageUrl: ECOS_BOP_SOURCE_PAGE_URL,
    sourceName: ECOS_BOP_SOURCE_NAME,
  };

  const snapshot = normalizeEcosGenericRows(
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

export { ecosTimeToDataPeriod };
