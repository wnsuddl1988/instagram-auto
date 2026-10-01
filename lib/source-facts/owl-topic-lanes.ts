// ── 부엉박사 소재 발굴 레인 + 쏠림 판정 ─────────────────────────────────────
//
// 2026-09-30 Owner 확정(CURRENT_STANDARDS 최우선 규칙 13): 부엉박사 소재 찾기도 황소특보와 같은 뼈대
// (매번 새로 탐색 · 후보 7~12개 추천순위 · 레인/영역/쏠림 표시)로 한다. 부엉박사는 생활·정책 경제라
// 레인을 생활 영역으로 나눈다. 이 모듈은 순수 데이터 + 판정 함수만 가진다(네트워크 없음).
// 판정은 "제안 전에 쏠림을 눈에 보이게 하는" 용도이고 최종 선택은 Owner 몫이다.
//
// 정부 제도명의 현재 운영 여부(청년내일채움공제 사고)와 전망치 가정 일치(국민연금 2056→2064 사고)는
// 자동 판정할 수 없다 — 후보 단계에서 공식 사이트·원문으로 사람이 확인한다.

export type OwlTopicLane =
  | "policy_countdown" // ① 제도 변경·시행 D-N
  | "money_calc" // ② 내 돈 계산법(대출·세금·연금)
  | "housing" // ③ 주거(월세·전세·청약·경매)
  | "income_jobs" // ④ 소득·일자리 지원
  | "living_costs" // ⑤ 생활물가·공공요금
  | "indicator" // ⑥ 지표 번역(ECOS/KOSIS)
  | "fraud_prevention" // ⑦ 금융사기·피해 예방
  | "deadline_benefit"; // ⑧ 신청 마감 임박 혜택

export interface OwlTopicLaneDefinition {
  readonly id: OwlTopicLane;
  readonly label: string;
  readonly seeks: string;
}

export const OWL_TOPIC_LANES: readonly OwlTopicLaneDefinition[] = [
  { id: "policy_countdown", label: "① 제도 변경·시행 D-N", seeks: "시행일이 정해진 제도 변경이 내 생활·지갑에 주는 영향" },
  { id: "money_calc", label: "② 내 돈 계산법", seeks: "대출 이자·세금·연금을 내 숫자로 계산해 보는 법" },
  { id: "housing", label: "③ 주거", seeks: "월세·전세·청약·경매·전세사기 제도와 대처" },
  { id: "income_jobs", label: "④ 소득·일자리 지원", seeks: "실업급여·근로장려금·청년·육아 지원 등 받을 수 있는 돈" },
  { id: "living_costs", label: "⑤ 생활물가·공공요금", seeks: "전기·가스·교통 요금, 물가 변화가 가계에 주는 영향" },
  { id: "indicator", label: "⑥ 지표 번역", seeks: "물가·고용·가계부채·금리 등 발표 지표를 내 생활로 번역(ECOS/KOSIS)" },
  { id: "fraud_prevention", label: "⑦ 금융사기·피해 예방", seeks: "보이스피싱·불법사금융·전세사기 신종 수법과 대처" },
  { id: "deadline_benefit", label: "⑧ 신청 마감 임박 혜택", seeks: "기한 안에 신청해야 받는 환급·지원금" },
];

export type OwlTopicDomain =
  | "loans_credit"
  | "housing"
  | "pension"
  | "jobs_income"
  | "tax"
  | "prices_utilities"
  | "investing_protection"
  | "savings_deposit"
  | "indicators"
  | "other";

/** 제목 문장 모양. 같은 모양을 연달아 쓰지 않는다(황소특보와 같은 분류). */
export type OwlTitleShape = "contrast" | "quote" | "countdown" | "question" | "declaration" | "metaphor" | "number" | "why";

export interface OwlEpisodeTopicRecord {
  readonly episode: number;
  readonly summary: string;
  readonly lane: OwlTopicLane;
  readonly domain: OwlTopicDomain;
  readonly titleShape?: OwlTitleShape;
  /** 제작만 하고 아직 게시 전이면 false(배포 순서대로 게시할 예정인 재고). */
  readonly published: boolean;
}

/**
 * 부엉박사 편 장부(표시 번호 기준). 1~15편 게시 완료, 16~17편은 제작 완료·순서대로 게시 예정(2026-09-30 재배치).
 * 새 편을 만들면 끝에 추가하고, 게시하면 published를 true로 바꾼다. 레인·영역은 소재 기준 사후 분류다.
 */
export const OWL_EPISODE_LEDGER: readonly OwlEpisodeTopicRecord[] = [
  { episode: 1, summary: "기준금리 인상이 다음 달 카드값에 찍히는 구조", lane: "money_calc", domain: "loans_credit", titleShape: "question", published: true },
  { episode: 2, summary: "가계부채 목표 코앞인데 대출 규제는 그대로", lane: "indicator", domain: "loans_credit", titleShape: "question", published: true },
  { episode: 3, summary: "서울 집값 84주 상승과 전세난", lane: "housing", domain: "housing", titleShape: "question", published: true },
  { episode: 4, summary: "서울 초소형 아파트가 제일 많이 오름", lane: "housing", domain: "housing", titleShape: "contrast", published: true },
  { episode: 5, summary: "한국은행 11월 추가 인상 가능성", lane: "indicator", domain: "loans_credit", titleShape: "declaration", published: true },
  { episode: 6, summary: "IRP 안전자산 30% 규정을 주식형으로 채우기", lane: "money_calc", domain: "pension", titleShape: "declaration", published: true },
  { episode: 7, summary: "3배 레버리지 ETF에 1.1조 다시 몰림", lane: "indicator", domain: "investing_protection", titleShape: "number", published: true },
  { episode: 8, summary: "투자경고 종목 4건 중 1건 한 달 안 30% 급락", lane: "fraud_prevention", domain: "investing_protection", titleShape: "number", published: true },
  { episode: 9, summary: "한국은행이 다시 켠 집값 경고등", lane: "indicator", domain: "housing", titleShape: "contrast", published: true },
  { episode: 10, summary: "카드론·현금서비스가 신용점수를 깎는 구조", lane: "money_calc", domain: "loans_credit", titleShape: "declaration", published: true },
  { episode: 11, summary: "청약예금·부금 전환 기한 연장과 금리 계산법 변경", lane: "deadline_benefit", domain: "housing", titleShape: "question", published: true },
  { episode: 12, summary: "세입자 있는 집 입주를 최대 3년 3개월 유예", lane: "policy_countdown", domain: "housing", titleShape: "declaration", published: true },
  { episode: 13, summary: "고용률 역대 최고인데 체감 안 되는 이유와 지원금", lane: "indicator", domain: "jobs_income", titleShape: "contrast", published: true },
  { episode: 14, summary: "국민연금 보험료 올해에 이어 내년 1월 또 인상", lane: "policy_countdown", domain: "pension", titleShape: "declaration", published: true },
  { episode: 15, summary: "실업급여 22년 만의 개편(정부안)", lane: "policy_countdown", domain: "jobs_income", titleShape: "declaration", published: true },
  // 2026-09-30 Owner 재배치: 퇴직연금은 번호 없는 예비 재고(아래 OWL_UNNUMBERED_STOCK)로 빼고,
  // 최저임금이 16편, 전세사기가 17편이 된다. 파일·스펙 이름은 옛 번호(최저임금=ep17, 전세사기=ep18)를 그대로 쓴다.
  { episode: 16, summary: "최저임금 인상이 내 월급에 주는 영향(실업급여 하한액 연결, 파일 ep17)", lane: "income_jobs", domain: "jobs_income", titleShape: "question", published: true },
  { episode: 17, summary: "전세사기 최소보장제 11/13 시행(파일 ep18)", lane: "policy_countdown", domain: "housing", titleShape: "declaration", published: false },
  // 2026-10-01: 새 소재 첫 편. 배포 10/3 예정. 파일·스펙 이름은 ep19(ep18 파일은 전세사기가 사용 중).
  { episode: 18, summary: "청년미래적금 2차 신청 10/7~16(유형 직접 선택·도약계좌 갈아타기, 파일 ep19)", lane: "deadline_benefit", domain: "savings_deposit", titleShape: "countdown", published: false },
];

/**
 * 번호 없는 예비 재고(2026-09-30 Owner 결정): 배포할 소재가 없는 날 쓰고, 그때 다음 번호를 받는다.
 * 배포 전에는 편 장부(쏠림 창)에 넣지 않는다. 파일·스펙: `_owl-v2-ep16-*`, `C:/tmp/owl-v2-ep16-final-v3`.
 */
export const OWL_UNNUMBERED_STOCK: readonly Omit<OwlEpisodeTopicRecord, "episode">[] = [
  { summary: "퇴직연금 회사 옮겨도 상품 그대로 이전(파일 ep16)", lane: "policy_countdown", domain: "pension", titleShape: "question", published: false },
];

export interface OwlTopicProposal {
  readonly title: string;
  readonly lane: OwlTopicLane;
  readonly domain: OwlTopicDomain;
  readonly titleShape?: OwlTitleShape;
}

export interface OwlTopicAssessment {
  readonly ok: boolean;
  readonly warnings: readonly string[];
  readonly windowSize: number;
  /** 이번 제안을 포함한 창 안의 같은 영역 편 수. */
  readonly sameDomainCount: number;
  /** 이번 제안을 포함한 창 안의 같은 레인 편 수. */
  readonly sameLaneCount: number;
}

export const OWL_BANNED_TITLE_PATTERNS: readonly RegExp[] = [/진짜\s*이유/u, /정체/u];

/**
 * 제안을 최근 (windowSize-1)편(게시 예정 재고 포함 — 시청자는 그 순서로 보게 된다)과 합쳐 쏠림을 점검한다.
 * 기준: 같은 영역 ≤2, 같은 레인 ≤2, 직전 편과 같은 레인·같은 제목 모양 연속 금지, 금지 제목 틀.
 */
export function assessOwlTopicProposal(
  proposal: OwlTopicProposal,
  ledger: readonly OwlEpisodeTopicRecord[] = OWL_EPISODE_LEDGER,
  options: { readonly windowSize?: number; readonly maxSameDomain?: number; readonly maxSameLane?: number } = {},
): OwlTopicAssessment {
  const windowSize = Math.max(2, options.windowSize ?? 5);
  const maxSameDomain = options.maxSameDomain ?? 2;
  const maxSameLane = options.maxSameLane ?? 2;
  const sorted = [...ledger].sort((a, b) => a.episode - b.episode);
  const recent = sorted.slice(Math.max(0, sorted.length - (windowSize - 1)));
  const last = sorted.at(-1);
  const warnings: string[] = [];

  const sameDomainCount = recent.filter((e) => e.domain === proposal.domain).length + 1;
  if (sameDomainCount > maxSameDomain) {
    warnings.push(`같은 영역(${proposal.domain}) 쏠림: 이번 제안 포함 최근 ${windowSize}편 중 ${sameDomainCount}편(기준 ${maxSameDomain}편 이하)`);
  }
  const sameLaneCount = recent.filter((e) => e.lane === proposal.lane).length + 1;
  if (sameLaneCount > maxSameLane) {
    warnings.push(`같은 레인(${proposal.lane}) 쏠림: 이번 제안 포함 최근 ${windowSize}편 중 ${sameLaneCount}편(기준 ${maxSameLane}편 이하)`);
  }
  if (last && last.lane === proposal.lane) warnings.push(`직전 ${last.episode}편과 같은 레인(${proposal.lane}) 연속`);
  if (last?.titleShape && proposal.titleShape && last.titleShape === proposal.titleShape) {
    warnings.push(`직전 ${last.episode}편과 같은 제목 모양(${proposal.titleShape}) 연속`);
  }
  for (const pattern of OWL_BANNED_TITLE_PATTERNS) {
    if (pattern.test(proposal.title)) warnings.push(`벤치마크 채널식 제목 틀 반복 금지: "${proposal.title}"에 ${pattern.source} 포함`);
  }
  return { ok: warnings.length === 0, warnings, windowSize, sameDomainCount, sameLaneCount };
}
