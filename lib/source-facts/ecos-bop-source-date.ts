import type { EcosStatRow } from "./ecos-connector";

// ── 한국은행 국제수지(경상수지) publishedDate resolver ──────────────────────────
//
// The ECOS StatisticSearch payload for 경상수지(301Y013/000000) is a monthly
// time series where TIME=YYYYMM is the DATA PERIOD, not the announcement date.
// 한국은행 releases "YYYY년 M월 국제수지(잠정)" with roughly a 2-month lag (the
// May data period was announced 2026-07-08, June 2026-08-06, July 2026-09-04)
// — always in the first ~8 days of the month two months after the data period,
// but the exact date varies and must be verified against the official BOK
// press-release board, never derived from the ECOS period.
//
// This module verifies a publishedDate by DATA-PERIOD MATCHING, same approach
// as ecos-cpi-source-date.ts.

export interface BokBopAnnouncement {
  /** Data period the release covers, ECOS TIME format (YYYYMM). */
  readonly dataPeriod: string;
  /** ISO announcement date (YYYY-MM-DD) the press release was posted. */
  readonly announcedDate: string;
}

export const BOK_BOP_ANNOUNCEMENT_SOURCE_URL =
  "https://www.bok.or.kr/portal/bbs/B0000216/list.do?menuNo=200761";
export const BOK_BOP_ANNOUNCEMENT_SOURCE_NAME = "한국은행 보도자료 — 국제수지(잠정)";

/**
 * Official BOK 국제수지 press-release history, most-recent first.
 * Transcribed from search results against the official BOK press-release
 * board (read 2026-09-17). Only 3 entries verified so far — add more only
 * after reading the exact date off the official board for that period.
 */
export const BOK_BOP_ANNOUNCEMENTS: readonly BokBopAnnouncement[] = [
  { dataPeriod: "202607", announcedDate: "2026-09-04" },
  { dataPeriod: "202606", announcedDate: "2026-08-06" },
  { dataPeriod: "202605", announcedDate: "2026-07-08" },
];

export type EcosBopSourceDateResolution =
  | {
      readonly ok: true;
      readonly verifiedPublishedDate: string;
      readonly matchedDataPeriod: string;
      readonly sourceUrl: string;
      readonly sourceName: string;
    }
  | {
      readonly ok: false;
      readonly reason: string;
      readonly code: "period_not_in_official_history";
    };

export function resolveEcosBopSourceDate(
  latestRow: EcosStatRow,
  announcements: readonly BokBopAnnouncement[] = BOK_BOP_ANNOUNCEMENTS,
): EcosBopSourceDateResolution {
  const match = announcements.find((a) => a.dataPeriod === latestRow.TIME);
  if (!match) {
    return {
      ok: false,
      code: "period_not_in_official_history",
      reason: `ECOS 최신 데이터 기간(${latestRow.TIME})에 해당하는 공식 발표일이 BOK_BOP_ANNOUNCEMENTS에 없습니다. 한국은행 보도자료 게시판에서 전사 후 추가해야 합니다.`,
    };
  }
  return {
    ok: true,
    verifiedPublishedDate: match.announcedDate,
    matchedDataPeriod: match.dataPeriod,
    sourceUrl: BOK_BOP_ANNOUNCEMENT_SOURCE_URL,
    sourceName: BOK_BOP_ANNOUNCEMENT_SOURCE_NAME,
  };
}
