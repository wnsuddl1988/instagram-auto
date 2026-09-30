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
  "⑥ 지표 번역": ["소비자물가 상승률 발표", "가계부채 증가", "고용동향 발표", "한국은행 기준금리 결정"],
  "⑦ 금융사기·피해 예방": ["보이스피싱 신종 수법", "금감원 소비자경보", "불법사금융 피해", "전세사기 신종"],
  "⑧ 신청 마감 임박": ["신청 마감 임박", "이번 달까지 신청", "환급 신청 기한", "지원금 신청 마감"],
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
console.log("=== 부엉박사 소재 발굴 레인 뉴스 검색 결과 ===");
console.log(
  "★ 제목+링크만 모은 원재료입니다. 직접 읽고 판단하세요. 정부 제도명은 현재 운영 여부를 공식 사이트로 확인하세요. " +
    "제목 문구를 그대로 가져오지 말고(경제사냥꾼식 '진짜 이유/정체' 틀 금지) " +
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
