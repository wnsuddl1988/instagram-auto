#!/usr/bin/env node
/**
 * 부엉박사 소재 발굴 레인 뉴스 검색 — 수동 실행용(cron 없음). (2026-09-30, CURRENT_STANDARDS 최우선 규칙 13)
 *
 * 부엉박사 레인 8개(생활·정책 경제)의 고정 키워드로 네이버 뉴스를 한 번에 훑는다. 제목+링크만 모으고
 * 판단은 사람이 한다. ★ 정부 제도명은 현재 운영 여부를 공식 사이트로 확인하고(청년내일채움공제 사고),
 * 전망치는 같은 가정끼리만 비교한다(국민연금 2056→2064 사고). 제목 문구를 그대로 쓰지 않는다.
 *
 * 사용:
 *   node scripts/run-owner-command-with-local-env-no-log.mjs owl-topic-lane-news-search --arm
 */

import { runTsProbe } from "./_editorial-v2-ts-probe.mjs";

const ROOT = process.cwd();

if (!process.env.NAVER_CLIENT_ID || !process.env.NAVER_CLIENT_SECRET) {
  console.error("ABORT: 네이버 뉴스 자격증명이 없습니다(NAVER_CLIENT_ID/NAVER_CLIENT_SECRET). no-log 래퍼로 실행하세요.");
  process.exit(2);
}

// 키워드는 코드에 고정한다(래퍼가 임의 키워드를 주입할 통로를 만들지 않는다).
const LANE_KEYWORDS = Object.freeze({
  "① 제도 변경·시행": ["다음 달부터 달라지는", "내년부터 시행", "다음 달부터 바뀌는 제도", "시행령 개정 국민"],
  "② 내 돈 계산법": ["대출 금리인하요구권", "세액공제 확대", "연말정산 달라지는", "연금 수령액"],
  "③ 주거": ["전세대출 규제", "청약 제도 개편", "월세 세액공제", "전세사기 피해 지원"],
  "④ 소득·일자리 지원": ["청년 지원금 신청", "근로장려금", "육아휴직 급여", "실업급여 개편"],
  "⑤ 생활물가·공공요금": ["전기요금 인상", "가스요금 인상", "대중교통 요금 인상", "장바구니 물가"],
  // 2026-10-01 추가(Owner "러너 전부 돌려서 뽑은 거 맞아?" — 한국은행 9/30 금융기관 가중평균금리(주담대 4.66%·45개월 최고)가
  // 러너 결과에 거의 안 나와 수동 검색으로만 찾았다): 대출금리 통계·코픽스 키워드 4개.
  "⑥ 지표 번역": ["소비자물가 상승률 발표", "가계부채 증가", "고용동향 발표", "한국은행 기준금리 결정", "주담대 금리 상승", "신용대출 금리 최고", "코픽스 발표", "금융기관 가중평균금리"],
  "⑦ 금융사기·피해 예방": ["보이스피싱 신종 수법", "금감원 소비자경보", "불법사금융 피해", "전세사기 신종"],
  "⑧ 신청 마감 임박": ["신청 마감 임박", "이번 달까지 신청", "환급 신청 기한", "지원금 신청 마감"],
});

// ★ 영역 보강 그룹(2026-09-30 밤 Owner 지시: "처음 시작할 때 엄청 다양한 방면을 요청했다, 활용 못 한 러너는
// 다시 활용하라"). 위 레인 키워드 32개만으로는 보험·세금·육아·노후·청년·교통통신·자영업 같은 "누구나 피부로
// 와닿는" 방면이 아예 검색되지 않았다(15편 실업급여가 최고 반응 → 규칙 13 대상 폭·체감 크기 최우선).
// 황소 러너의 DOMAIN_KEYWORDS와 같은 방식으로, 끝에 영역별 건수를 요약한다(0건이면 ⚠).
const DOMAIN_KEYWORDS = Object.freeze({
  "[영역] 세금·연말정산": ["연말정산 달라지는", "종합부동산세 고지", "상속세 증여세 개편", "유류세 인하 연장", "자동차세 개편", "양도세 비과세 특례"],
  "[영역] 보험·의료비": ["실손보험 보험료 인상", "자동차보험료 인상", "건강보험료 인상", "의료비 본인부담 변경"],
  "[영역] 출산·육아·교육": ["부모급여 아동수당", "출산지원금 확대", "학자금 대출 금리", "육아기 근로시간 단축"],
  "[영역] 노후·연금": ["기초연금 인상", "국민연금 개혁 수령", "주택연금 가입", "노인 일자리 지원"],
  "[영역] 청년": ["청년도약계좌", "청년 월세 지원", "청년 주택드림 청약", "청년 전세대출"],
  "[영역] 교통·통신·생활": ["K-패스 환급", "기후동행카드", "알뜰폰 요금제", "택배비 인상", "배달앱 수수료"],
  "[영역] 예금·카드·신용": ["예금금리 인하", "파킹통장 금리", "카드 혜택 축소", "휴면예금 찾기", "신용점수 올리기", "주택담보대출 금리", "대출 이자 부담 증가", "정기예금 금리 인상"],
  "[영역] 자영업·소상공인": ["소상공인 지원금", "자영업자 대출 부담", "폐업 지원금", "소상공인 전기요금 지원"],
  "[영역] 내 집 마련": ["생애최초 주택 대출", "디딤돌대출 금리", "신생아 특례대출", "청약 가점 개편"],
  "[영역] 소비자 피해·디지털": ["개인정보 유출 보상", "스미싱 문자 주의", "구독료 인상", "소비자원 환불 피해", "서울시 소비자 피해 주의", "구독 서비스 환불 피해"],
  // 2026-09-30 밤 Owner가 다시 준 분야 목록(거시경제·금융지식·정부정책(학업·도시별)·법령변경·주요뉴스·환율)과 대조해 빈 곳 추가.
  "[영역] 거시경제·환율(생활)": ["경제성장률 전망", "수출입동향 발표", "환율 해외직구 여행", "물가 전망 한국은행"],
  "[영역] 금융 상식": ["금감원 금융꿀팁", "금융소비자 알아두면", "예금자보호 한도"],
  "[영역] 교육·학업": ["국가장학금 신청", "사교육비 조사", "교육부 발표 학부모"],
  "[영역] 지자체(도시별) 정책": ["서울시 지원 정책 시민", "경기도 지원금 신청", "지자체 지원금 신청"],
  "[영역] 법령 변경": ["국회 본회의 통과 법안", "국무회의 의결 개정안", "법 개정 시행 국민"],
  "[영역] 주요 경제 발표": ["기획재정부 발표", "금융위원회 발표", "국토교통부 발표", "보건복지부 발표", "고용노동부 발표"],
});

const ALL_GROUPS = Object.freeze({ ...LANE_KEYWORDS, ...DOMAIN_KEYWORDS });
const ALL_KEYWORDS = Object.values(ALL_GROUPS).flat();

const probe = `
import { collectNaverNewsForKeywords } from "./naver-news-connector.js";
import { createNaverNewsLiveTransport, resolveNaverCredentials } from "./naver-news-live-transport.js";
import { loadSourceRegistry } from "../editorial-v2/economic-source-registry.js";

const keywords = ${JSON.stringify(ALL_KEYWORDS)};
const credentials = resolveNaverCredentials();
if (!credentials) {
  process.stdout.write(JSON.stringify({ status: "BLOCKED", reason: "missing_naver_credentials" }));
  process.exit(0);
}

const transport = createNaverNewsLiveTransport({ credentials });
const registry = loadSourceRegistry();

// 키워드가 30개 이상이라 연속 호출하면 HTTP 429(rate limited)가 난다(2026-09-30 실측: 35개 중
// 16개 실패). 공유 커넥터는 건드리지 않고 여기서 키워드마다 간격을 두고, 429면 잠시 쉬었다 재시도한다.
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const results: any[] = [];
const failed: { keyword: string; reason: string }[] = [];
for (const keyword of keywords) {
  let lastReason = "";
  let done = false;
  for (let attempt = 0; attempt < 3 && !done; attempt += 1) {
    if (attempt > 0) await sleep(2500 * attempt);
    const one = await collectNaverNewsForKeywords([keyword], transport, registry, { display: 8 });
    if (one.results.length > 0) {
      results.push(...one.results);
      done = true;
    } else {
      lastReason = one.failed[0]?.reason ?? "no result";
      if (!/rate limited/.test(lastReason)) break;
    }
  }
  if (!done) failed.push({ keyword, reason: lastReason });
  await sleep(700);
}

const flattened = results.flatMap((r: any) =>
  r.items.map((item: any) => ({
    keyword: r.keyword,
    title: item.title,
    publishedAt: item.publishedAt,
    publisherName: item.publisherName,
    publisherTier: item.publisherTier,
    link: item.originallink || item.link,
  })),
);

process.stdout.write(JSON.stringify({ status: "OK", items: flattened, failed }));
`;

let result;
try {
  result = runTsProbe({
    root: ROOT,
    probeDir: "lib/source-facts",
    probeSource: probe,
    extraJsFiles: ["naver-news-connector.js", "naver-news-live-transport.js"],
  });
} catch (error) {
  console.error(`ABORT: ${error.message}`);
  process.exit(1);
}

if (result.status === "BLOCKED") {
  console.error(`ABORT: ${result.reason}`);
  process.exit(2);
}

console.log("");
console.log("=== 부엉박사 소재 발굴 레인 뉴스 검색 결과 ===");
console.log(
  "★ 제목+링크만 모은 원재료입니다. 직접 읽고 판단하세요. 정부 제도명은 현재 운영 여부를 공식 사이트로 확인하세요. " +
    "제목 문구를 그대로 가져오지 말고(경제사냥꾼식 '진짜 이유/정체' 틀 금지) " +
    "우리 말투의 주제명을 새로 만드세요. ★",
);
console.log("");

const seen = new Set();
const groupCounts = [];
for (const [lane, keywords] of Object.entries(ALL_GROUPS)) {
  console.log(`──────── ${lane} ────────`);
  const items = result.items
    .filter((item) => keywords.includes(item.keyword))
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  let printed = 0;
  for (const item of items) {
    if (seen.has(item.link)) continue;
    seen.add(item.link);
    printed += 1;
    console.log(`[${item.keyword}] ${item.title}`);
    console.log(`  발행: ${item.publishedAt} | ${item.publisherName ?? "출처 미상"} (${item.publisherTier})`);
    console.log(`  링크: ${item.link}`);
    console.log("");
  }
  if (printed === 0) console.log("(결과 없음)\n");
  groupCounts.push([lane, printed]);
}

console.log("──────── 그룹별 건수 요약(레인 8 + 영역 16) ────────");
for (const [group, n] of groupCounts) console.log(`${n === 0 ? "⚠" : " "} ${group}: ${n}건`);
console.log(`키워드 ${ALL_KEYWORDS.length}개 검색`);

if (result.failed.length > 0) {
  console.log(`키워드 검색 실패: ${result.failed.length}건`);
  for (const f of result.failed) {
    console.log(`  ${f.keyword}: ${f.reason}`);
  }
}
