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
  | "weekly_checkpoint"; // ⑧ 주간 체크포인트

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
    seeks: "환율·금리·유가·금 움직임을 개인 체감으로 번역",
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
