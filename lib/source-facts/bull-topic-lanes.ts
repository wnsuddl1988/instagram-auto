// ── 황소특보 소재 발굴 레인 + 쏠림 판정 ─────────────────────────────────────
//
// 2026-09-30 Owner 결정: 소재가 반도체·급등 사건형에 쏠린다는 진단에 따라, 경제사냥꾼
// 쇼츠 제목 1,975개 분석(memory: project_bull_topic_lane_expansion_analysis_2026_09_30)을
// 근거로 소재 발굴 레인을 8개로 확장한다. 이 모듈은 순수 데이터 + 판정 함수만 가진다
// (네트워크·시각 의존 없음). 판정은 "제안 전에 쏠림을 눈에 보이게 하는" 용도이며,
// 최종 선택은 Owner 몫이다.
//
// 종목 실명·매수 암시 금지, 허용리스트 원칙은 이 모듈이 다루지 않는다(대본 단계 규칙).

export type BullTopicLane =
  | "cause_explainer" // ① 원인 해설(지수·업종 대비 홀로 빠지거나 안 오르는 것)
  | "figure_statement" // ② 인물·기관 발언 해석
  | "event_countdown" // ③ 이벤트 D-N(상장·회담·시행·실적·지표)
  | "policy_change" // ④ 시장 제도·정책 변경
  | "new_theme" // ⑤ 신테마 입문(개념+비유)
  | "macro_translation" // ⑥ 매크로 번역(환율·금리·유가·금)
  | "decoupling_flows" // ⑦ 한미 디커플링·수급 구조
  | "weekly_checkpoint" // ⑧ 주간 체크포인트
  | "corporate_catalyst" // ⑨ 기업 계약·호재(공시·수주 사실 기반, 2026-09-30 Owner 추가)
  | "sector_outlook"; // ⑩ 유망 섹터·미래 전망(출처 있는 전망, 2026-09-30 Owner 추가)

/** 1~9편처럼 레인 도입 전에 만든 편. */
export type BullLegacyLane = "legacy";

export interface BullTopicLaneDefinition {
  readonly id: BullTopicLane;
  readonly label: string;
  /** 이 레인이 찾는 소재. */
  readonly seeks: string;
  /** 발굴 소스(러너/문서). */
  readonly sources: string;
}

export const BULL_TOPIC_LANES: readonly BullTopicLaneDefinition[] = [
  {
    id: "cause_explainer",
    label: "① 원인 해설",
    seeks: "실적은 좋은데 주가가 빠지거나, 대장주만 안 오르는 등 겉보기와 다른 움직임의 원인",
    sources: "bull-topic-scan(상대 갭) + 뉴스 검색",
  },
  {
    id: "figure_statement",
    label: "② 인물·기관 발언 해석",
    seeks: "젠슨황·버핏·연준 인사 등의 발언이 가리키는 산업/자금 흐름(종목 추천이 아니라 지도)",
    sources: "bull-topic-lane-news-search(figure)",
  },
  {
    id: "event_countdown",
    label: "③ 이벤트 D-N",
    seeks: "상장·정상회담·제도 시행일·실적·경제지표 발표 전에 미리 읽는 포인트",
    sources: "bull-event-calendar + run-bull-topic-calendar-once",
  },
  {
    id: "policy_change",
    label: "④ 시장 제도·정책 변경",
    seeks: "거래 시간·세제·펀드·규제 변경이 내 계좌에 미치는 영향(시행일이 있는 것)",
    sources: "bull-topic-lane-news-search(policy)",
  },
  {
    id: "new_theme",
    label: "⑤ 신테마 입문",
    seeks: "로봇·양자·우주·희토류·AI 작동 원리 등 개념+비유로 풀 수 있는 새 주제",
    sources: "bull-topic-lane-news-search(theme)",
  },
  {
    id: "macro_translation",
    label: "⑥ 매크로 번역",
    seeks: "환율·금리·유가·금 움직임을 투자자 자산가격(주식·환율·금) 관점으로 번역 — 대출·예금 같은 생활 금융 각도는 부엉박사 소재",
    sources: "bull-topic-lane-news-search(macro)",
  },
  {
    id: "decoupling_flows",
    label: "⑦ 디커플링·수급 구조",
    seeks: "한미 증시 엇갈림, 외국인·개인·기관 수급 구조",
    sources: "bull-topic-lane-news-search(flows)",
  },
  {
    id: "weekly_checkpoint",
    label: "⑧ 주간 체크포인트",
    seeks: "다음 주 일정을 한 장으로 정리(주 1회 이하)",
    sources: "bull-event-calendar",
  },
  {
    id: "corporate_catalyst",
    label: "⑨ 기업 계약·호재",
    seeks: "공급계약·수주·신규 계약 공시처럼 '방금 확인된 사실'을 업종·밸류체인 구조로 풀기(종목 실명은 허용리스트만, 나머지는 업종명). 매수 추천·목표가 단정 금지",
    sources: "bull-topic-dart-scan(공시) + bull-topic-news-search(공급계약)",
  },
  {
    id: "sector_outlook",
    label: "⑩ 유망 섹터·미래 전망",
    seeks: "섹터·산업의 앞으로 전망을 '출처 있는 전망(증권사·기관)'과 '조건 체크(무엇이 유지되면 어떻게 읽나)'로 제시(자체 예측·종목 추천 금지)",
    sources: "bull-topic-sector-news-search + 인물·기관 발언",
  },
];

/** 유형: 사건형은 전체의 약 1/3 이하로 유지한다. */
export type BullTopicKind = "event" | "schedule" | "structure" | "concept";

export type BullTopicDomain =
  | "semiconductor"
  | "flows_structure"
  | "dividend_policy"
  | "bio"
  | "energy"
  | "macro"
  | "mobility"
  | "theme_new"
  | "platform_consumer"
  | "industrial" // 방산·조선·풍력·건설기계 등 산업재(2026-09-30 추가)
  | "other";

/** 제목 문장 모양. 같은 모양을 연달아 쓰지 않는다. */
export type BullTitleShape =
  | "contrast" // 대비형: A인데 B
  | "quote" // 인용형
  | "countdown" // 카운트다운형
  | "question" // 질문형
  | "declaration" // 선언형
  | "metaphor" // 비유·장면형
  | "number" // 숫자형
  | "why"; // 원인형(~이유)

export interface BullEpisodeTopicRecord {
  readonly episode: number;
  /** 소재 요약(정확한 게시 제목이 아니라 소재 설명). */
  readonly summary: string;
  readonly lane: BullTopicLane | BullLegacyLane;
  readonly kind: BullTopicKind;
  readonly domain: BullTopicDomain;
  /** 삼성전자·SK하이닉스·반도체 밸류체인을 핵심으로 다뤘으면 true. */
  readonly semiconductorRelated: boolean;
  readonly titleShape?: BullTitleShape;
}

/**
 * 게시 완료 편 장부. 새 편이 배포되면 끝에 추가한다. 1~7편은 레인 도입 전이라
 * lane="legacy"이고 제목 모양은 기록하지 않았다.
 */
export const BULL_EPISODE_LEDGER: readonly BullEpisodeTopicRecord[] = [
  { episode: 1, summary: "간밤 미국 반도체 급등이 국내 반도체 중소형 장비주까지 번짐", lane: "legacy", kind: "event", domain: "semiconductor", semiconductorRelated: true },
  { episode: 2, summary: "레버리지 ETF에서 개인이 던진 물량을 외국인·기관이 받음", lane: "legacy", kind: "structure", domain: "flows_structure", semiconductorRelated: true },
  { episode: 3, summary: "외국인이 삼성전자는 사고 SK하이닉스는 파는 엇갈린 베팅", lane: "legacy", kind: "structure", domain: "flows_structure", semiconductorRelated: true },
  { episode: 4, summary: "삼성전자보다 더 오른 기판주(MLCC 품절·증설)", lane: "legacy", kind: "concept", domain: "semiconductor", semiconductorRelated: true },
  { episode: 5, summary: "스마트폰 AI 앱이 흔든 반도체 순위(CPU·기판)", lane: "legacy", kind: "concept", domain: "semiconductor", semiconductorRelated: true },
  { episode: 6, summary: "삼성전자 3분기 배당 마지막 매수일", lane: "event_countdown", kind: "schedule", domain: "dividend_policy", semiconductorRelated: false },
  { episode: 7, summary: "국내 바이오사 FDA 첫 승인 상한가", lane: "legacy", kind: "event", domain: "bio", semiconductorRelated: false },
  { episode: 8, summary: "삼성전자 -5%인 날 태양광만 +14%(미국 최저수입가격)", lane: "cause_explainer", kind: "event", domain: "energy", semiconductorRelated: false, titleShape: "contrast" },
  { episode: 9, summary: "오픈AI 신모델 취소 × 마이크론 실적 D-1", lane: "event_countdown", kind: "schedule", domain: "semiconductor", semiconductorRelated: true, titleShape: "question" },
  { episode: 10, summary: "11/2 저PBR 기업 공표 × 10/22 공시 마감(PBR 개념·시각차)", lane: "policy_change", kind: "schedule", domain: "dividend_policy", semiconductorRelated: false, titleShape: "declaration" },
  { episode: 11, summary: "조선주 고점 대비 -44~51%인데 조선 3사 이익 전망은 올해 9.8조→내년 11.8조(수주 시차·새 주문 점유율·환율)", lane: "cause_explainer", kind: "structure", domain: "industrial", semiconductorRelated: false, titleShape: "contrast" },
  // 2026-10-01: 제작 중(배포 전)부터 등록 — 다음 소재 제안에서 같은 소재·쏠림을 잡기 위함(규칙 11). 배포 후에도 그대로 둔다.
  { episode: 12, summary: "서학개미 추석 연휴 미국주식 순매수(메타·샌디스크·KORU 등 예탁결제원 집계 9/24~25)와 파킹형 ETF(SGOV) 순매도", lane: "decoupling_flows", kind: "structure", domain: "other", semiconductorRelated: false, titleShape: "question" },
  // 2026-10-01 배포 완료(13편)
  { episode: 13, summary: "외국인 코스피 5개월 135조 순매도(9월 21조, 삼성전자·SK하이닉스 76.6%)와 복귀 조건(호실적 확인+내년 이익 전망 상향)·삼성전자 3분기 잠정실적 연결, 개인 양손투자", lane: "decoupling_flows", kind: "structure", domain: "flows_structure", semiconductorRelated: true, titleShape: "question" },
  { episode: 14, summary: "마이크론 역대급 실적(매출 542억 달러·1년 전 4.8배)인데 주가는 발표 직후 내렸다가 2% 올랐다 — 이익률 전망 87→86.3%(CFO 성과급 확대) vs 수요 기대(CEO 내년·내후년 수급 빠듯), 한국 반응(코스피 1.95%·삼성 2.8%·SK하이닉스 3.2%)·삼성·SK 3분기 영업이익 전망 연결(9편 후속)", lane: "cause_explainer", kind: "event", domain: "semiconductor", semiconductorRelated: true, titleShape: "question" },
  { episode: 15, summary: "현대차 미국 9월 판매 역대 최대(77,439대·+9%, 하이브리드 +39%·팰리세이드 +52%, 아이오닉5 -65%는 작년 9월 세액공제 일몰 직전 몰림 기저효과)인데 같은 달 세계 판매는 307,998대로 -16.0%(국내 -25.7%·해외 -13.9%, 회사 설명 추석 연휴 영업일 감소, 1~9월 누적 -7.0%) — 현대차그룹 미국 3분기 약 50만 6천 대 첫 50만 돌파, 월 하나·지역 하나로 현대차 전체를 읽지 말 것", lane: "cause_explainer", kind: "event", domain: "mobility", semiconductorRelated: false, titleShape: "contrast" },
  // 2026-10-03 배포 완료(16편): 릴스 DeA5B2dCPA0, 유튜브 i5K_ik3-F8Y
  { episode: 16, summary: "삼성전자 15조 자사주 매입 종료(10/6, 당초 11/21) 임박 — 공시 5,328만 주 100.96% 채우고 금액 한도 14.16조까지 계속, 10/2 기타법인 순매수 1조 4,886억(삼성·SK 자사주), 목적은 임직원 주식 보상(주가 방어 아님), 수급 하나가 빠지고 그 빈자리는 3분기 잠정실적(눈높이 113조→109조대)이 채워야 함·SK하이닉스 76%", lane: "event_countdown", kind: "schedule", domain: "semiconductor", semiconductorRelated: true, titleShape: "declaration" },
  // 2026-10-03: 제작 중(배포 전)부터 등록 — 같은 소재·쏠림 방지(규칙 11). 17=외국인 비반도체 순매수(2026-10-03 배포 완료 → 커버 문구 교체로 Owner가 삭제 후 재배포: 릴스 DeBuTfKo3yJ, 유튜브 beZeuN-uplc), 18=시총 상폐 규정 법원 제동(2026-10-04 배포 완료: 릴스 DeDfxdUiObV, 유튜브 6BhhvurEWzU).
  { episode: 17, summary: "외국인은 팔기만 한 게 아니다 — 1~9월 한 달도 안 빠지고 순매수한 신세계·달바글로벌·KCC(9개월), 8개월 셀트리온·에이피알·대한항공 등 12곳, 화장품 수출 111억 달러 +31%·환율 1,300원대, 반도체 제외 코스피200 내년 이익 전망 +15%(반도체 대형주 상향 폭의 약 3배)", lane: "decoupling_flows", kind: "structure", domain: "platform_consumer", semiconductorRelated: false, titleShape: "declaration" },
  { episode: 18, summary: "시가총액 미달 상장폐지 규정에 법원 제동 — 10/2 서울남부지법 주연테크(코스피)·케이엠제약(코스닥) 상장폐지 결정 효력·정리매매 정지 가처분 인용(본안 확정까지), 기준 적용 시기 앞당긴 규정·소명 기회 배제가 쟁점, 임시 판단이라 본안 남음·같은 소송 신청 이어짐", lane: "policy_change", kind: "event", domain: "other", semiconductorRelated: false, titleShape: "declaration" },
  // 2026-10-04: 제작 중(배포 전)부터 등록 — 같은 소재·쏠림 방지(규칙 11). 19=10/4 저녁 예정이었으나 누락돼 2026-10-05 늦게 배포 완료(릴스 DeGI_W5jUQ3, 유튜브 lefyytPG7N0, 스토리), 20=10/5 오전(2026-10-05 배포 완료: 릴스 DeGFqelAV4R, 유튜브 Q3JJduBB2po), 21=10/5 저녁 게시 예정(Owner 지시).
  { episode: 19, summary: "S&P500 구성 종목 약 80% 하락(평균 -5%)인데 나스닥100은 +3%·지수는 사상 최고(9월, WSJ) — 기술·커뮤니케이션서비스 2개 업종만 상승, 시총 상위 100개 중 41개 vs 하위 100개 중 10개 상승, 10년물 4.7→5.3%·저신용 가산금리 +1%p, 10/2 고용 부진으로 금리 인상 우려 완화, AI 쏠림 신호", lane: "decoupling_flows", kind: "structure", domain: "other", semiconductorRelated: false, titleShape: "contrast" },
  { episode: 20, summary: "엔비디아 5,000억 달러 칩(GPU) 담보 대출 구상(로이터 10/1) — 수명 엔비디아 최대 10년 vs 은행 감가상각 3~4년, 은행·펀드 보증 확대 요구, 코어위브 85억 달러, 네이버 GPU 사업도 금융권이 교체주기 따져 대출 규모 산정, AI 붐의 돈줄", lane: "new_theme", kind: "concept", domain: "theme_new", semiconductorRelated: true, titleShape: "contrast" },
  { episode: 21, summary: "메모리 가격 상승 둔화(D램 월 상승률 7월 14.29→8월 4.17→9월 4%, 낸드 4월 36.29→8월 1.42·9월 보합)인데 가격은 사상 최고, 트렌드포스 4분기 D램 +10~15%·낸드 +15~20% 전망·마이크론 CEO 수요 초과, 삼성전자 3분기 영업이익 전망 하향·잠정실적 10/8 예상(미확정)", lane: "event_countdown", kind: "schedule", domain: "semiconductor", semiconductorRelated: true, titleShape: "declaration" },
];

export interface BullTopicProposal {
  readonly title: string;
  readonly lane: BullTopicLane;
  readonly kind: BullTopicKind;
  readonly domain: BullTopicDomain;
  readonly semiconductorRelated: boolean;
  readonly titleShape?: BullTitleShape;
}

export interface BullTopicAssessmentOptions {
  /** 이번 제안을 포함해 보는 최근 편 수. 기본 5. */
  readonly windowSize?: number;
  /** 창 안에서 허용하는 반도체 계열 편 수. 기본 2. */
  readonly maxSemiconductor?: number;
}

export interface BullTopicAssessment {
  readonly ok: boolean;
  readonly warnings: readonly string[];
  readonly windowSize: number;
  /** 이번 제안을 포함한 창 안의 반도체 계열 편 수. */
  readonly semiconductorCount: number;
  /** 이번 제안을 포함한 창 안의 사건형 편 수. */
  readonly eventCount: number;
}

/** 경제사냥꾼식 제목 틀 — 그대로 반복하지 않는다(Owner 2026-09-30). */
export const BULL_BANNED_TITLE_PATTERNS: readonly RegExp[] = [/진짜\s*이유/u, /정체/u];

/**
 * 제안을 최근 (windowSize-1)편과 합쳐 쏠림을 점검한다. 경고가 없어도 "좋은 소재"라는
 * 뜻이 아니라 "쏠림 기준에는 걸리지 않는다"는 뜻이다.
 */
export function assessBullTopicProposal(
  proposal: BullTopicProposal,
  ledger: readonly BullEpisodeTopicRecord[] = BULL_EPISODE_LEDGER,
  options: BullTopicAssessmentOptions = {},
): BullTopicAssessment {
  const windowSize = Math.max(2, options.windowSize ?? 5);
  const maxSemiconductor = options.maxSemiconductor ?? 2;
  const sorted = [...ledger].sort((a, b) => a.episode - b.episode);
  const recent = sorted.slice(Math.max(0, sorted.length - (windowSize - 1)));
  const last = sorted.length > 0 ? sorted[sorted.length - 1] : undefined;

  const warnings: string[] = [];

  const semiconductorCount =
    recent.filter((e) => e.semiconductorRelated).length + (proposal.semiconductorRelated ? 1 : 0);
  if (semiconductorCount > maxSemiconductor) {
    warnings.push(
      `반도체 계열 쏠림: 이번 제안 포함 최근 ${windowSize}편 중 ${semiconductorCount}편(기준 ${maxSemiconductor}편 이하)`,
    );
  }

  const eventCount = recent.filter((e) => e.kind === "event").length + (proposal.kind === "event" ? 1 : 0);
  const eventLimit = Math.ceil(windowSize / 3);
  if (eventCount > eventLimit) {
    warnings.push(
      `사건형 쏠림: 이번 제안 포함 최근 ${windowSize}편 중 ${eventCount}편(기준 ${eventLimit}편 이하, 약 1/3)`,
    );
  }

  if (last && last.lane !== "legacy" && last.lane === proposal.lane) {
    warnings.push(`직전 ${last.episode}편과 같은 레인(${proposal.lane}) 연속`);
  }

  if (last && last.titleShape && proposal.titleShape && last.titleShape === proposal.titleShape) {
    warnings.push(`직전 ${last.episode}편과 같은 제목 모양(${proposal.titleShape}) 연속`);
  }

  for (const pattern of BULL_BANNED_TITLE_PATTERNS) {
    if (pattern.test(proposal.title)) {
      warnings.push(`벤치마크 채널식 제목 틀 반복 금지: "${proposal.title}"에 ${pattern.source} 포함`);
    }
  }

  return { ok: warnings.length === 0, warnings, windowSize, semiconductorCount, eventCount };
}
