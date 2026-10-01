// ── 부엉박사 제도 시행·통계 발표 일정 캘린더 ───────────────────────────────────
//
// 2026-10-01 신설(Owner "러너 보강"): 부엉박사 소재 탐색에는 황소특보의 일정 러너(bull-event-calendar.ts)에
// 해당하는 "곧 닥칠 제도 시행·신청 마감·통계 발표" 목록이 없어, 소재를 수동 웹 검색으로만 찾았다.
// 이 모듈은 순수 데이터 + 조회 함수만 가진다(네트워크 없음). 황소 일정표와 같은 원칙을 따른다:
// 날짜는 공식 일정·복수 보도로 확인한 것만 넣고, 관행으로만 아는 날짜는 status "tentative"로 표시한다.
// 규칙으로 날짜를 계산해 만들지 않는다(날짜 날조 금지).
//
// 유지보수: 새 제도 시행일·신청 기간·통계 공표일을 알게 되면 여기에 추가한다. 소재 탐색 때마다
// `node scripts/run-owl-topic-calendar-once.mjs`가 오케스트레이터에서 자동 실행되어 D-N으로 보여 준다.

export type OwlEventCategory =
  | "stat_release" // 통계·지표 발표(소비자물가, 가중평균금리, GDP 등)
  | "rate_decision" // 한국은행 금통위
  | "policy_effective" // 제도 시행일
  | "application_open" // 신청 시작
  | "policy_deadline" // 신청 마감·특례 종료
  | "legislation"; // 국회·정부 입법 일정

export interface OwlScheduledEvent {
  readonly id: string;
  readonly category: OwlEventCategory;
  /** 이벤트 날짜, ISO YYYY-MM-DD (한국 시간 기준). */
  readonly dateIso: string;
  readonly displayName: string;
  /** 날짜의 근거(공식 출처 또는 복수 보도) — 근거 없이 채워 넣지 않는다. */
  readonly sourceNote: string;
  /** 생략하면 "confirmed". 관행·추정이라 공식 확인 전이면 "tentative". */
  readonly status?: "confirmed" | "tentative";
}

export const OWL_SCHEDULED_EVENTS: readonly OwlScheduledEvent[] = [
  {
    id: "cpi-2026-09",
    category: "stat_release",
    dateIso: "2026-10-02",
    displayName: "9월 소비자물가동향 발표(통계청 08:00)",
    sourceNote: "검색 요약(2026-10-01)만 확인 — 통계청 공표일정 원문 미확인, 공식 일정 재확인 필요",
    status: "tentative",
  },
  {
    id: "youth-future-savings-2-open",
    category: "application_open",
    dateIso: "2026-10-07",
    displayName: "청년미래적금 2차 신청 시작(~10/16, 가입 유형 직접 선택)",
    sourceNote: "동아일보·한국일보 2026-09-30 (부엉 18편 소재)",
  },
  {
    id: "cofix-2026-09",
    category: "stat_release",
    dateIso: "2026-10-15",
    displayName: "9월분 신규취급액 코픽스 공시(은행연합회) — 변동금리 대출 기준",
    sourceNote: "8월분이 2026-09-15에 공시된 것을 뉴스핌·이투데이로 확인(매월 15일 관행). 10월분 날짜는 은행연합회에서 재확인",
    status: "tentative",
  },
  {
    id: "bok-2026-10",
    category: "rate_decision",
    dateIso: "2026-10-22",
    displayName: "한국은행 금융통화위원회 통화정책방향 결정회의(10월)",
    sourceNote: "bok.or.kr (황소특보 일정표와 동일)",
  },
  {
    id: "bok-gdp-2026-q3",
    category: "stat_release",
    dateIso: "2026-10-27",
    displayName: "3분기 실질 GDP(속보) 08:00 · 10월 소비자동향조사 06:00(한국은행)",
    sourceNote: "bok.or.kr 월간통계 공표일정(2026-10-01 확인)",
  },
  {
    id: "bok-wavg-rate-2026-09",
    category: "stat_release",
    dateIso: "2026-10-29",
    displayName: "9월 금융기관 가중평균금리 발표 12:00(주담대·신용대출·예금 금리, 한국은행)",
    sourceNote: "bok.or.kr 월간통계 공표일정(2026-10-01 확인) — 8월분은 9/30 발표(주담대 4.66%)",
  },
  {
    id: "jeonse-fraud-min-guarantee",
    category: "policy_effective",
    dateIso: "2026-11-13",
    displayName: "전세사기 최소보장제 시행",
    sourceNote: "부엉 17편 소재 기준일(owl-topic-lanes.ts 장부, 공식 공고 재확인 필요)",
  },
  {
    id: "bok-2026-11",
    category: "rate_decision",
    dateIso: "2026-11-26",
    displayName: "한국은행 금융통화위원회 통화정책방향 결정회의(11월)",
    sourceNote: "bok.or.kr (황소특보 일정표와 동일)",
  },
  {
    id: "tax-reform-2026-final",
    category: "legislation",
    dateIso: "2026-12-02",
    displayName: "정기국회 2026년 세제개편안 최종 확정 예정(인적용역 원천징수 3.3→2.2% 인하 등)",
    sourceNote: "재정경제부 세제개편 일정(정기국회 12/2까지 확정 예정, 검색 요약 2026-10-01)",
    status: "tentative",
  },
  {
    id: "sangsaeng-rent-special-end",
    category: "policy_deadline",
    dateIso: "2026-12-31",
    displayName: "상생임대주택 양도세 특례 올해 말 종료",
    sourceNote: "일시적 2주택 시행령 보도(아시아경제 2026-09-29)",
  },
  {
    id: "pension-credit-2027",
    category: "policy_effective",
    dateIso: "2027-01-01",
    displayName: "국민연금 군복무 전체 인정·둘째 출산 크레딧 12→15개월 시행(2027 제대자·출산부터)",
    sourceNote: "뉴시스·간호사신문 2026-10-01 — 시행일 표기가 매체별로 다름(공포 후 6개월 표기도 있음)",
    status: "tentative",
  },
  {
    id: "freelancer-withholding-2027",
    category: "policy_effective",
    dateIso: "2027-01-01",
    displayName: "인적용역 원천징수 소득세 3%→2% 적용 시작(지급분부터, 국회 통과 전제)",
    sourceNote: "한국경제 2026-08-21·택스넷(세제개편안 2026-08-03)",
    status: "tentative",
  },
];

export interface OwlUpcomingEventQuery {
  /** 조회 기준일, ISO YYYY-MM-DD. */
  readonly todayIso: string;
  /** 이 일수 이내(포함)의 예정 이벤트만 반환. 기본 30일. */
  readonly withinDays?: number;
}

export interface OwlUpcomingEvent extends OwlScheduledEvent {
  /** 0이면 당일, 양수면 D-N. */
  readonly daysUntil: number;
}

export function findUpcomingOwlEvents(query: OwlUpcomingEventQuery): readonly OwlUpcomingEvent[] {
  const todayMs = Date.parse(`${query.todayIso}T00:00:00Z`);
  if (!Number.isFinite(todayMs)) return [];
  const withinDays = query.withinDays ?? 30;

  const result: OwlUpcomingEvent[] = [];
  for (const event of OWL_SCHEDULED_EVENTS) {
    const eventMs = Date.parse(`${event.dateIso}T00:00:00Z`);
    if (!Number.isFinite(eventMs)) continue;
    const daysUntil = Math.round((eventMs - todayMs) / (24 * 60 * 60 * 1000));
    if (daysUntil < 0 || daysUntil > withinDays) continue;
    result.push({ ...event, daysUntil });
  }
  return result.sort((a, b) => a.daysUntil - b.daysUntil);
}
