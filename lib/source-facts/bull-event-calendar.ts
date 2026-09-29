// ── 황소특보 주요 일정 캘린더 ────────────────────────────────────────────────
//
// 소재 유형 확장(2026-09-23, Owner 지적으로 재설계) — 수치 급변만이 아니라
// "예정된 매크로 이벤트"도 소재가 된다. FOMC/한국은행 금통위/주요 실적발표/
// 경제지표 발표일은 날짜가 미리 정해져 있으므로, 당일 몰아서 찾지 않고 미리
// 목록으로 관리해서 "D-1/D-day" 형태로 예고 소재를 준비할 수 있다.
//
// 이 모듈은 순수 데이터 + 조회 함수만 가진다(네트워크 없음). 날짜는 전부
// 공식 일정 발표를 근거로 손으로 채워 넣는다 — 추정하거나 "매달 셋째 주
// 목요일" 같은 규칙으로 계산하지 않는다(공휴일 등으로 실제 일정이 매번
// 조금씩 밀리는 이벤트가 많아, 규칙 기반 계산은 날짜를 날조하는 것과 같은
// 위험이 있다 — 이 repo의 "날짜/값 날조 금지" 원칙과 동일 이유).

export type BullEventCategory =
  | "fomc"
  | "bok_rate_decision"
  | "us_cpi"
  | "kr_cpi"
  | "earnings_season_start"
  | "other_macro";

export interface BullScheduledEvent {
  readonly id: string;
  readonly category: BullEventCategory;
  /** 이벤트 날짜, ISO YYYY-MM-DD (한국 시간 기준 발표/개최일). */
  readonly dateIso: string;
  /** 화면 표시용 이름, 예: "FOMC 정례회의(9월)". */
  readonly displayName: string;
  /** 이 날짜의 근거(공식 발표 출처) — 검증 없이 채워 넣지 않는다. */
  readonly sourceNote: string;
}

/**
 * 손으로 유지보수하는 일정 목록. 새 일정을 추가할 때는 반드시 공식 소스
 * (연준 FOMC 캘린더, 한국은행 통화정책방향 결정 일정, 회사 IR 공시 등)를
 * sourceNote에 남긴다. 지난 일정을 자동으로 지우지 않는다 — 목록이 길어지면
 * 다음 유지보수 때 정리한다.
 *
 * 2026-09-23 조사로 채움(별도 조사 에이전트가 federalreserve.gov/bok.or.kr
 * 공식 페이지를 직접 확인). FOMC 날짜는 미국 동부시간 발표를 한국시간 익일
 * 새벽으로 환산한 값. 2027년 FOMC는 연준 사이트 자체가 "tentative"로 표시한
 * 잠정 일정 — displayName에 [잠정] 표기 유지, 확정 발표되면 표기 제거할 것.
 * 2027년 상반기 금통위는 bok.or.kr에 아직 미게시라 목록에 넣지 않았다(날짜
 * 날조 금지 — 한국은행이 통상 전년도 10~11월에 익년 일정을 발표하므로
 * 2026년 10~11월경 재조사 필요).
 */
export const BULL_SCHEDULED_EVENTS: readonly BullScheduledEvent[] = [
  {
    id: "fomc-2026-09",
    category: "fomc",
    dateIso: "2026-09-17",
    displayName: "FOMC 정례회의(9월, 미국 현지 9/15~16)",
    sourceNote: "federalreserve.gov/monetarypolicy/fomccalendars.htm",
  },
  {
    id: "fomc-2026-10",
    category: "fomc",
    dateIso: "2026-10-29",
    displayName: "FOMC 정례회의(10월, 미국 현지 10/27~28)",
    sourceNote: "federalreserve.gov/monetarypolicy/fomccalendars.htm",
  },
  {
    id: "fomc-2026-12",
    category: "fomc",
    dateIso: "2026-12-10",
    displayName: "FOMC 정례회의(12월, 미국 현지 12/8~9, 경제전망요약 SEP 포함)",
    sourceNote: "federalreserve.gov/monetarypolicy/fomccalendars.htm",
  },
  {
    id: "fomc-2027-01",
    category: "fomc",
    dateIso: "2027-01-28",
    displayName: "FOMC 정례회의(1월, 미국 현지 1/26~27) [잠정]",
    sourceNote: "federalreserve.gov — 2027년 일정 tentative, 확정 발표 시 갱신 필요",
  },
  {
    id: "fomc-2027-03",
    category: "fomc",
    dateIso: "2027-03-18",
    displayName: "FOMC 정례회의(3월, 미국 현지 3/16~17, SEP 포함) [잠정]",
    sourceNote: "federalreserve.gov — tentative",
  },
  {
    id: "fomc-2027-04",
    category: "fomc",
    dateIso: "2027-04-29",
    displayName: "FOMC 정례회의(4월, 미국 현지 4/27~28) [잠정]",
    sourceNote: "federalreserve.gov — tentative",
  },
  {
    id: "fomc-2027-06",
    category: "fomc",
    dateIso: "2027-06-10",
    displayName: "FOMC 정례회의(6월, 미국 현지 6/8~9, SEP 포함) [잠정]",
    sourceNote: "federalreserve.gov — tentative",
  },
  {
    id: "bok-2026-10",
    category: "bok_rate_decision",
    dateIso: "2026-10-22",
    displayName: "한국은행 금융통화위원회 통화정책방향 결정회의(10월)",
    sourceNote: "bok.or.kr/portal/singl/crncyPolicyDrcMtg/listYear.do",
  },
  {
    id: "bok-2026-11",
    category: "bok_rate_decision",
    dateIso: "2026-11-26",
    displayName: "한국은행 금융통화위원회 통화정책방향 결정회의(11월)",
    sourceNote: "bok.or.kr/portal/singl/crncyPolicyDrcMtg/listYear.do",
  },
];

export interface BullUpcomingEventQuery {
  /** 조회 기준일, ISO YYYY-MM-DD. Date.now() 대신 호출자가 명시적으로 넘긴다. */
  readonly todayIso: string;
  /** 이 일수 이내(포함)의 예정 이벤트만 반환. 기본 7일. */
  readonly withinDays?: number;
}

export interface BullUpcomingEvent extends BullScheduledEvent {
  /** todayIso 기준 D-day 카운트. 0이면 당일, 양수면 D-N 며칠 전. */
  readonly daysUntil: number;
}

/**
 * 기준일로부터 withinDays 이내(과거는 제외, 오늘 포함)인 예정 이벤트를
 * daysUntil 오름차순(가까운 순)으로 반환한다.
 */
export function findUpcomingBullEvents(
  query: BullUpcomingEventQuery,
): readonly BullUpcomingEvent[] {
  const todayMs = Date.parse(`${query.todayIso}T00:00:00Z`);
  if (!Number.isFinite(todayMs)) return [];
  const withinDays = query.withinDays ?? 7;

  const result: BullUpcomingEvent[] = [];
  for (const event of BULL_SCHEDULED_EVENTS) {
    const eventMs = Date.parse(`${event.dateIso}T00:00:00Z`);
    if (!Number.isFinite(eventMs)) continue;
    const daysUntil = Math.round((eventMs - todayMs) / (24 * 60 * 60 * 1000));
    if (daysUntil < 0 || daysUntil > withinDays) continue;
    result.push({ ...event, daysUntil });
  }
  return result.sort((a, b) => a.daysUntil - b.daysUntil);
}
