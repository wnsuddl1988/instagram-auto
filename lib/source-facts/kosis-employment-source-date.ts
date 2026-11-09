import type { KosisStatRow } from "./kosis-connector";

// ── 국가데이터처(구 통계청) 고용동향 publishedDate resolver ─────────────────────
//
// KOSIS DT_1DA7004S(경제활동인구조사)의 PRD_DE(YYYYMM)는 데이터 기간이지 발표일이
// 아니다. 국가데이터처는 "YYYY년 M월 고용동향"을 매월 다른 날짜(대략 익월 9~18일
// 사이, 정형화된 고정일 아님)에 발표한다 — ecos-cpi-source-date.ts와 동일한
// 데이터-기간 매칭 방식을 쓴다.

export interface KostatEmploymentAnnouncement {
  readonly dataPeriod: string; // YYYYMM
  readonly announcedDate: string; // ISO YYYY-MM-DD
}

export const KOSTAT_EMPLOYMENT_ANNOUNCEMENT_SOURCE_URL =
  "https://mods.go.kr/board.es?mid=a10301030200&bid=210";
export const KOSTAT_EMPLOYMENT_ANNOUNCEMENT_SOURCE_NAME =
  "국가데이터처(구 통계청) 보도자료 — 고용동향";

/**
 * 공식 국가데이터처 고용동향 발표 이력(최신순). 게시판(위 URL, 2026-09-17 조회)에서
 * 직접 전사. 이 목록에 없는 데이터 기간은 발표일을 검증할 수 없어 차단된다.
 */
export const KOSTAT_EMPLOYMENT_ANNOUNCEMENTS: readonly KostatEmploymentAnnouncement[] = [
  { dataPeriod: "202608", announcedDate: "2026-09-09" },
  { dataPeriod: "202607", announcedDate: "2026-08-12" },
  { dataPeriod: "202606", announcedDate: "2026-07-15" },
  { dataPeriod: "202605", announcedDate: "2026-06-11" },
  { dataPeriod: "202604", announcedDate: "2026-05-13" },
  { dataPeriod: "202603", announcedDate: "2026-04-15" },
  { dataPeriod: "202602", announcedDate: "2026-03-18" },
  { dataPeriod: "202601", announcedDate: "2026-02-11" },
];

export type KosisEmploymentSourceDateResolution =
  | {
      readonly ok: true;
      readonly verifiedPublishedDate: string;
      readonly matchedDataPeriod: string;
      readonly sourceUrl: string;
      readonly sourceName: string;
    }
  | { readonly ok: false; readonly reason: string; readonly code: "period_not_in_official_history" };

export function resolveKosisEmploymentSourceDate(
  latestRow: KosisStatRow,
  announcements: readonly KostatEmploymentAnnouncement[] = KOSTAT_EMPLOYMENT_ANNOUNCEMENTS,
): KosisEmploymentSourceDateResolution {
  const match = announcements.find((a) => a.dataPeriod === latestRow.PRD_DE);
  if (!match) {
    return {
      ok: false,
      code: "period_not_in_official_history",
      reason: `KOSIS 최신 데이터 기간(${latestRow.PRD_DE})에 해당하는 공식 발표일이 KOSTAT_EMPLOYMENT_ANNOUNCEMENTS에 없습니다.`,
    };
  }
  return {
    ok: true,
    verifiedPublishedDate: match.announcedDate,
    matchedDataPeriod: match.dataPeriod,
    sourceUrl: KOSTAT_EMPLOYMENT_ANNOUNCEMENT_SOURCE_URL,
    sourceName: KOSTAT_EMPLOYMENT_ANNOUNCEMENT_SOURCE_NAME,
  };
}
