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
  | "earnings_us" // 미국 주요 기업 실적 발표
  | "earnings_kr" // 한국 주요 기업 실적 발표(삼성전자 잠정실적 등)
  | "company_kpi" // 기업 월/분기 판매·인도량 등 KPI 발표
  | "kr_trade_data" // 한국 수출입동향 등 무역 통계
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
  /**
   * 날짜 확정 여부. 생략하면 "confirmed". 공식 공지 전이라 관행으로만 아는 날짜는
   * "tentative"로 넣고 공식 공지가 나오면 갱신한다(날짜 날조 금지 원칙 유지).
   */
  readonly status?: "confirmed" | "tentative";
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
  // ── 2026-09-30 추가: 이벤트 D-N 레인용(황소특보 소재 발굴 레인 ③) ───────────────
  // 아래 3건은 이번 세션에서 복수 보도/회사 공시로 날짜를 직접 확인했다.
  {
    id: "micron-fy2026-q4",
    category: "earnings_us",
    dateIso: "2026-10-01",
    displayName: "마이크론 FY2026 4분기 실적 발표(미국 현지 9/30 콘퍼런스콜 MT 14:30, 한국 10/1 05:30)",
    sourceNote:
      "Nasdaq/회사 보도자료 'Micron Technology to Report Fiscal Fourth Quarter Results on September 30, 2026'(2026-08-26); 지이뉴스 2026-09-26(한국시간 10/1 05:30)",
  },
  {
    id: "kr-trade-2026-09",
    category: "kr_trade_data",
    dateIso: "2026-10-01",
    displayName: "산업통상부 9월 수출입동향 발표",
    sourceNote:
      "산업통상부는 8월 동향을 2026-09-01에 발표(KDI EIEC 확인). 매월 1일 발표 관행이라 10/1 발표로 보되, 당일 공지 재확인 필요",
    status: "tentative",
  },
  {
    id: "tesla-2026-q3-deliveries",
    category: "company_kpi",
    dateIso: "2026-10-02",
    displayName: "테슬라 2026년 3분기 생산·인도량 발표(미국 현지 10/2)",
    sourceNote: "디지털투데이·지이뉴스 2026-09-29 보도('테슬라는 10월 2일 3분기 생산·인도량 발표')",
  },
  // ── 2026-10-01 추가(Owner "러너 보강"): 부엉 19편 소재 탐색 중 일정 러너에 빠진 것이 확인됨 ───────
  // 삼성전자 잠정실적은 13편 마지막 씬에서 "제일 먼저 들고 올게"라고 약속한 일정인데 목록에 없었다.
  {
    id: "kr-cpi-2026-09",
    category: "kr_cpi",
    dateIso: "2026-10-02",
    displayName: "9월 소비자물가동향 발표(통계청 08:00)",
    sourceNote: "검색 요약(2026-10-01)만 확인 — 통계청 공표일정 원문 미확인, 공식 일정 재확인 필요",
    status: "tentative",
  },
  {
    id: "samsung-2026-q3-prelim",
    category: "earnings_kr",
    dateIso: "2026-10-07",
    displayName:
      "삼성전자 2026년 3분기 잠정실적 공시(관행: 분기 종료 후 5번째 영업일 — 개천절 대체공휴일 10/5를 반영하면 10/8)",
    sourceNote:
      "삼성 뉴스룸(2분기 잠정은 2026-07-07 공시) + 시장 보도 '10월 7일 전후'(검색 요약 2026-10-01). 삼성은 사전 공지 없이 당일 공시 — 날짜 재확인 필요",
    status: "tentative",
  },
  {
    id: "kr-gdp-2026-q3",
    category: "other_macro",
    dateIso: "2026-10-27",
    displayName: "3분기 실질 GDP(속보) 발표(한국은행 08:00)",
    sourceNote: "bok.or.kr 월간통계 공표일정(2026-10-01 확인)",
  },
  {
    id: "bok-wavg-rate-2026-09",
    category: "other_macro",
    dateIso: "2026-10-29",
    displayName: "9월 금융기관 가중평균금리 발표(한국은행 12:00, 주담대·신용대출·예금 금리)",
    sourceNote: "bok.or.kr 월간통계 공표일정(2026-10-01 확인)",
  },
  {
    id: "samsung-2026-q3-final",
    category: "earnings_kr",
    dateIso: "2026-10-29",
    displayName: "삼성전자 3분기 확정실적·콘퍼런스콜(10/29~30 예정 보도)",
    sourceNote: "검색 요약(2026-10-01) — 회사 IR 공지 미확인",
    status: "tentative",
  },
  // TODO(공식 확정 공시 시 추가): SK하이닉스 3분기 실적(10/27 보도 있으나 회사 IR 공시 미확인),
  // 앤트로픽 나스닥 상장(11월 계획 보도만 있고 날짜 미확정). 규칙 계산으로 날짜를 만들지 않는다.
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
