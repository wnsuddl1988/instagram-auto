#!/usr/bin/env node
/**
 * 황소특보 소재 발굴 레인 뉴스 검색 — 수동 실행용(cron 없음).
 *
 * 2026-09-30 Owner 확정 레인(memory: project_bull_topic_lane_expansion_analysis_2026_09_30)
 * 중 뉴스 검색으로 원재료를 모으는 레인을 한 번에 훑는다:
 *   ② 인물·기관 발언 / ④ 시장 제도·정책 변경 / ⑤ 신테마 입문 / ⑥ 매크로 번역 / ⑦ 디커플링·수급
 * (① 원인 해설은 bull-topic-scan의 상대 갭+뉴스, ③ 이벤트 D-N은 run-bull-topic-calendar-once가 담당.)
 *
 * ★종목명·등락률·발언 내용을 이 스크립트가 자동 추출하지 않는다★ — 제목+링크만 모으고 사람이
 * 원문을 읽고 판단한다(Owner 확정 원칙). 인물 발언 레인은 "발언 사실"만 다루고 "그러니 이 종목을
 * 사라"는 해석을 붙이지 않는다. 허용리스트 밖 종목 실명·매수 암시 금지는 대본 단계 규칙이다.
 *
 * 사용:
 *   node scripts/run-owner-command-with-local-env-no-log.mjs bull-topic-lane-news-search --arm
 */

import { runTsProbe } from "./_editorial-v2-ts-probe.mjs";

const ROOT = process.cwd();

if (!process.env.NAVER_CLIENT_ID || !process.env.NAVER_CLIENT_SECRET) {
  console.error("ABORT: 네이버 뉴스 자격증명이 없습니다(NAVER_CLIENT_ID/NAVER_CLIENT_SECRET). no-log 래퍼로 실행하세요.");
  process.exit(2);
}

// 키워드는 코드에 고정한다(래퍼가 임의 키워드를 주입할 통로를 만들지 않는다).
const LANE_KEYWORDS = Object.freeze({
  "② 인물·기관 발언": ["젠슨황 발언", "워런 버핏 발언", "연준 총재 발언", "연준 의장 발언", "빌게이츠 투자", "일론 머스크 발언", "이재용 회장 발언", "정의선 회장 발표", "최태원 회장 발언", "이재명 대통령 증시"],
  "④ 시장 제도·정책": ["금융위원회 발표 투자자", "금융당국 시행 예정 증시", "세제 개편 주식 투자자", "거래시간 변경 증시", "다음 달부터 시행 금융", "밸류업 정책", "ISA 개편"],
  "⑤ 신테마 입문": ["휴머노이드 로봇", "양자컴퓨터", "희토류 공급망", "우주 산업", "AI 데이터센터 전력", "소형모듈원전 SMR", "로보택시"],
  "⑥ 매크로 번역": ["국채금리 급등", "금값 하락", "유가 급등", "달러 강세 환율", "원화 강세 수출"],
  "⑦ 디커플링·수급": ["외국인 순매도 누적", "코스피 나스닥 디커플링", "개인 순매수 코스피", "연기금 순매수"],
});

const ALL_KEYWORDS = Object.values(LANE_KEYWORDS).flat();

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
console.log("=== 황소특보 소재 발굴 레인 뉴스 검색 결과 ===");
console.log(
  "★ 제목+링크만 모은 원재료입니다. 직접 읽고 판단하세요. 인물 발언은 '발언했다'는 사실만 다루고 " +
    "매수 해석을 붙이지 마세요. 제목 문구를 그대로 가져오지 말고(경제사냥꾼식 '진짜 이유/정체' 틀 금지) " +
    "우리 말투의 주제명을 새로 만드세요. ★",
);
console.log("");

const seen = new Set();
for (const [lane, keywords] of Object.entries(LANE_KEYWORDS)) {
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
}

if (result.failed.length > 0) {
  console.log(`키워드 검색 실패: ${result.failed.length}건`);
  for (const f of result.failed) {
    console.log(`  ${f.keyword}: ${f.reason}`);
  }
}
