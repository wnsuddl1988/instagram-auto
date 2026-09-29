#!/usr/bin/env node
/**
 * 황소특보 중소형주 소재 후보 뉴스 검색 — 수동 실행용(cron 없음).
 *
 * KIS/Alpha Vantage는 종목코드를 미리 알아야 조회할 수 있어 "오늘 어떤 중소형주가
 * 급등했는지" 자체는 찾아주지 못한다(scripts/run-bull-topic-scan-once.mjs는 허용
 * 리스트 대형주+지수만 다룬다). 이 스크립트는 네이버뉴스에서 "급등", "상한가" 같은
 * 키워드로 최근 기사를 검색해 제목+링크만 모아서 보여준다.
 *
 * ★중요: 종목명·등락률을 이 스크립트가 자동으로 추출하지 않는다★ — 뉴스 제목은
 * 자유형식 텍스트라 기계적으로 종목명을 뽑으면 오인식 위험이 크다(Owner 확정,
 * 2026-09-23). 사람이 제목을 직접 읽고 실제 종목·등락률·이슈(테마/공급계약 등)를
 * 판단한 뒤, 확인되면 bull-topic-threshold-scanner.ts의 evaluateBullTopicCandidate를
 * issueConfirmed:true로 수동 호출하는 다음 단계로 넘어간다(아직 그 자동화는 없음
 * — 이 스크립트는 "후보 원재료"만 보여준다).
 *
 * 사용:
 *   node scripts/run-owner-command-with-local-env-no-log.mjs bull-topic-news-search --arm
 */

import { runTsProbe } from "./_editorial-v2-ts-probe.mjs";

const ROOT = process.cwd();

if (!process.env.NAVER_CLIENT_ID || !process.env.NAVER_CLIENT_SECRET) {
  console.error("ABORT: 네이버 뉴스 자격증명이 없습니다(NAVER_CLIENT_ID/NAVER_CLIENT_SECRET). no-log 래퍼로 실행하세요.");
  process.exit(2);
}

// 급등/급락/이슈성 키워드 — 종목명은 넣지 않는다(특정 종목을 미리 정해두고
// 찾는 게 아니라, "오늘 뭐가 이슈인지"를 거꾸로 찾는 게 목적).
const SEARCH_KEYWORDS = [
  "급등",
  "상한가",
  "급락",
  "하한가",
  "공급계약",
  "테마주",
];

const probe = `
import { collectNaverNewsForKeywords } from "./naver-news-connector.js";
import { createNaverNewsLiveTransport, resolveNaverCredentials } from "./naver-news-live-transport.js";
import { loadSourceRegistry } from "../editorial-v2/economic-source-registry.js";

const keywords = ${JSON.stringify(SEARCH_KEYWORDS)};
const credentials = resolveNaverCredentials();
if (!credentials) {
  process.stdout.write(JSON.stringify({ status: "BLOCKED", reason: "missing_naver_credentials" }));
  process.exit(0);
}

const transport = createNaverNewsLiveTransport({ credentials });
const registry = loadSourceRegistry();
const { results, failed } = await collectNaverNewsForKeywords(keywords, transport, registry, { display: 15 });

const flattened = results.flatMap((r) =>
  r.items.map((item) => ({
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
console.log("=== 황소특보 중소형주 소재 후보 뉴스 검색 결과 ===");
console.log(`검색 키워드: ${SEARCH_KEYWORDS.join(", ")}`);
console.log("");
console.log(
  "★ 아래는 제목+링크만 모은 원재료입니다. 종목명·등락률·이슈는 자동 추출하지 않으니 직접 " +
    "제목을 읽고 판단하세요. 소재로 확정되면 evaluateBullTopicCandidate를 issueConfirmed:true로 " +
    "수동 호출해서 임계치(10%+)를 넘는지 확인한 뒤 다음 단계로 넘어가세요. ★",
);
console.log("");

if (result.items.length === 0) {
  console.log("검색 결과가 없습니다.");
} else {
  // 최신순 정렬(이미 collectNaverNewsForKeywords가 date 정렬된 결과를 주지만,
  // 여러 키워드 결과를 합친 뒤라 다시 한번 정렬).
  const sorted = [...result.items].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  for (const item of sorted) {
    console.log(`[${item.keyword}] ${item.title}`);
    console.log(`  발행: ${item.publishedAt} | ${item.publisherName ?? "출처 미상"} (${item.publisherTier})`);
    console.log(`  링크: ${item.link}`);
    console.log("");
  }
}

if (result.failed.length > 0) {
  console.log(`키워드 검색 실패: ${result.failed.length}건`);
  for (const f of result.failed) {
    console.log(`  ${f.keyword}: ${f.reason}`);
  }
}
