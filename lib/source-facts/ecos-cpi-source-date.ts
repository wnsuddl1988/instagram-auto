import type { EcosStatRow } from "./ecos-connector";

// ── KOSIS/국가데이터처 소비자물가동향 publishedDate resolver ──────────────────
//
// The ECOS StatisticSearch payload for CPI total index (901Y009 / item "0") is a
// monthly time series where TIME=YYYYMM is the DATA PERIOD (the month the index
// describes), not the announcement date. The 국가데이터처(옛 통계청) publishes
// "YYYY년 M월 소비자물가동향" on a near-fixed monthly schedule (~2nd business
// day of the following month), but the exact date varies and must be verified
// against the official press-release board, never derived from the ECOS period.
//
// This module verifies a publishedDate by DATA-PERIOD MATCHING (not value
// matching, unlike the base rate): given the ECOS latest row's TIME (YYYYMM),
// it looks up the transcribed announcement date for that exact period. If the
// period is not in the table, resolution is unresolved — never invented.

/** One official 국가데이터처 CPI press-release entry (transcribed from the board). */
export interface KostatCpiAnnouncement {
  /** Data period the release covers, ECOS TIME format (YYYYMM). */
  readonly dataPeriod: string;
  /** ISO announcement date (YYYY-MM-DD) the press release was posted. */
  readonly announcedDate: string;
}

/**
 * Official 국가데이터처(구 통계청) 보도자료 게시판 — 소비자물가조사.
 * Human-facing, reviewable by the Owner.
 */
export const KOSTAT_CPI_ANNOUNCEMENT_SOURCE_URL =
  "https://mods.go.kr/board.es?mid=a10301040200&bid=213";

export const KOSTAT_CPI_ANNOUNCEMENT_SOURCE_NAME =
  "국가데이터처(구 통계청) 보도자료 — 소비자물가동향";

/**
 * Official 국가데이터처 CPI press-release history, most-recent first.
 *
 * Each entry is transcribed from the official 국가데이터처 press-release board
 * (KOSTAT_CPI_ANNOUNCEMENT_SOURCE_URL, board list read on 2026-09-17). The
 * 2026-01 period was announced 2026-03-06 alongside the 2026-02 period — an
 * atypical delay that coincided with "2025년 소비자물가지수 개편"(index
 * rebasing, announced 2026-07-07) — do not treat that gap as the normal
 * schedule when adding future entries.
 *
 * Do not add an entry here unless it was read off the official board for that
 * exact data period.
 */
export const KOSTAT_CPI_ANNOUNCEMENTS: readonly KostatCpiAnnouncement[] = [
  { dataPeriod: "202608", announcedDate: "2026-09-02" },
  { dataPeriod: "202607", announcedDate: "2026-08-04" },
  { dataPeriod: "202606", announcedDate: "2026-07-02" },
  { dataPeriod: "202605", announcedDate: "2026-06-02" },
  { dataPeriod: "202604", announcedDate: "2026-05-06" },
  { dataPeriod: "202603", announcedDate: "2026-04-02" },
  { dataPeriod: "202602", announcedDate: "2026-03-06" },
  { dataPeriod: "202601", announcedDate: "2026-03-06" },
];

// ── Source-date resolution ─────────────────────────────────────────────────────

export type EcosCpiSourceDateResolution =
  | {
      readonly ok: true;
      /** Verified 국가데이터처 announcement date (ISO YYYY-MM-DD) for this data period. */
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

/**
 * Resolves the official 국가데이터처 publishedDate for the latest ECOS CPI row,
 * by exact data-period match against the transcribed announcement history.
 *
 * Never derives a date from the ECOS TIME period arithmetically — only a
 * transcribed official entry for that exact period is accepted.
 */
export function resolveEcosCpiSourceDate(
  latestRow: EcosStatRow,
  announcements: readonly KostatCpiAnnouncement[] = KOSTAT_CPI_ANNOUNCEMENTS,
): EcosCpiSourceDateResolution {
  const match = announcements.find((a) => a.dataPeriod === latestRow.TIME);
  if (!match) {
    return {
      ok: false,
      code: "period_not_in_official_history",
      reason: `ECOS 최신 데이터 기간(${latestRow.TIME})에 해당하는 공식 발표일이 KOSTAT_CPI_ANNOUNCEMENTS에 없습니다. 국가데이터처 보도자료 게시판에서 전사 후 추가해야 합니다.`,
    };
  }
  return {
    ok: true,
    verifiedPublishedDate: match.announcedDate,
    matchedDataPeriod: match.dataPeriod,
    sourceUrl: KOSTAT_CPI_ANNOUNCEMENT_SOURCE_URL,
    sourceName: KOSTAT_CPI_ANNOUNCEMENT_SOURCE_NAME,
  };
}
