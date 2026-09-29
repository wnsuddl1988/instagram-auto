#!/usr/bin/env node
/**
 * 황소특보 섹터/테마 주목도 + 향후전망/실적발표 뉴스 검색 — 수동 실행용(cron 없음).
 *
 * 네이버뉴스에서 섹터/테마 키워드("반도체", "2차전지", "AI" 등)와 전망/실적
 * 키워드("목표가", "실적 전망", "어닝서프라이즈" 등)로 최근 기사를 검색해
 * 제목+링크만 모아서 보여준다. run-bull-topic-news-search-once.mjs(중소형주
 * 급등락 감지용)와 목적이 다르므로 별도 스크립트로 둔다 — 검색 키워드 성격이
 * 달라(이슈성 vs 섹터/전망성) 결과를 섞으면 오히려 구분이 어려워진다.
 *
 * ★종목명·수치를 이 스크립트가 자동으로 추출하지 않는다★ — 제목+링크만 모으고
 * 사람이 직접 읽고 판단한다(Owner 확정 원칙, 2026-09-23).
 *
 * 사용:
 *   node scripts/run-owner-command-with-local-env-no-log.mjs bull-topic-sector-news-search --arm
 */

import { runTsProbe } from "./_editorial-v2-ts-probe.mjs";

const ROOT = process.cwd();

if (!process.env.NAVER_CLIENT_ID || !process.env.NAVER_CLIENT_SECRET) {
  console.error("ABORT: 네이버 뉴스 자격증명이 없습니다(NAVER_CLIENT_ID/NAVER_CLIENT_SECRET). no-log 래퍼로 실행하세요.");
  process.exit(2);
}

// 섹터/테마 키워드 — 특정 종목이 아니라 업종 단위 흐름을 찾는다.
const SECTOR_KEYWORDS = [
  "반도체 강세",
  "2차전지 주가",
  "AI 관련주",
  "바이오 랠리",
  "조선주",
  "방산주",
];

// 향후전망/실적 키워드 — 애널리스트 리포트, 실적 시즌 관련.
const OUTLOOK_KEYWORDS = [
  "목표주가",
  "실적 전망",
  "어닝서프라이즈",
  "어닝쇼크",
];

const ALL_KEYWORDS = [...SECTOR_KEYWORDS, ...OUTLOOK_KEYWORDS];

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
const { results, failed } = await collectNaverNewsForKeywords(keywords, transport, registry, { display: 10 });

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
console.log("=== 황소특보 섹터/테마 + 향후전망 소재 후보 뉴스 검색 결과 ===");
console.log(`섹터/테마 키워드: ${SECTOR_KEYWORDS.join(", ")}`);
console.log(`전망/실적 키워드: ${OUTLOOK_KEYWORDS.join(", ")}`);
console.log("");
console.log(
  "★ 제목+링크만 모은 원재료입니다. 직접 읽고 판단하세요. 특정 종목이 아니라 " +
    "섹터/테마 단위 소재로 쓰는 게 원칙입니다(종목명 언급 제한, Owner 확정). ★",
);
console.log("");

if (result.items.length === 0) {
  console.log("검색 결과가 없습니다.");
} else {
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
