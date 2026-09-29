#!/usr/bin/env node
/**
 * 황소특보 위험고지·투자심리 계열 소재 후보 뉴스 검색 — 수동 실행용(cron 없음).
 *
 * 2026-09-23 소재 유형 2차 확장(Owner 지적: "전수조사 해서 더 추가할거 있음
 * 하라고 했는데 내가 말한거만 딱 추가햇네??" — 1차 확장 때 수치/공시/섹터/
 * 일정 4개만 만들고 끝낸 걸 재지적받음). 전수조사 에이전트가 확인한 증시
 * 각도기TV 등 인기 투자 채널의 실제 반응 좋은 소재 유형 중, 위험도가 낮다고
 * 판단된 5개를 여기에 담는다:
 *   - 레버리지/신용거래 경고
 *   - 투자심리·행동경제학 경고(단타/물타기/손절 타이밍)
 *   - 자금이동/대체투자 비교(부동산↔증시)
 *   - 시장구조/공정성 비판(개인 vs 외국인)
 *   - 밸류에이션/거시지표 교육형(EPS·PER·금리-주가 상관관계)
 * 이 5개는 전부 "경고/교육/구조 설명" 성격이라 매수 추천으로 읽힐 위험이
 * 거의 없음(오히려 리스크 고지에 가까움) — Owner 확정.
 *
 * ★기관·연기금 수급 해석, 투자철학/성공사례 2개는 "조건부"로 별도 취급★ —
 * 해석 톤에 따라 매수 유도로 읽힐 수 있어(예: "국민연금 매도, 오히려 매수
 * 힌트" 같은 해석형 제목) 이 스크립트에서도 검색은 하되, 결과에 명시적
 * 경고 주석을 붙인다. 전문가 종목추천형·정치연계형은 소재에서 완전히
 * 제외(매수 추천 금지 원칙, 정치적 편향 리스크와 직접 충돌 — Owner 확정).
 *
 * ★종목명·수치를 이 스크립트가 자동으로 추출하지 않는다★ — 제목+링크만 모으고
 * 사람이 직접 읽고 판단한다(Owner 확정 원칙).
 *
 * 사용:
 *   node scripts/run-owner-command-with-local-env-no-log.mjs bull-topic-risk-awareness-news-search --arm
 */

import { runTsProbe } from "./_editorial-v2-ts-probe.mjs";

const ROOT = process.cwd();

if (!process.env.NAVER_CLIENT_ID || !process.env.NAVER_CLIENT_SECRET) {
  console.error("ABORT: 네이버 뉴스 자격증명이 없습니다(NAVER_CLIENT_ID/NAVER_CLIENT_SECRET). no-log 래퍼로 실행하세요.");
  process.exit(2);
}

// 위험도 낮음 — 바로 채택(경고/교육/구조 설명 성격).
const SAFE_KEYWORDS = [
  "레버리지 경고",
  "신용거래 위험",
  "단타 손실",
  "물타기 위험",
  "부동산 증시 자금이동",
  "외국인 매도",
  "개인투자자 손실",
  "PER 저평가",
  "금리 주가 상관관계",
];

// 조건부 — 검색은 하되 해석 톤 주의(매수 유도로 읽힐 위험).
const CONDITIONAL_KEYWORDS = [
  "국민연금 매도",
  "연기금 순매수",
];

const ALL_KEYWORDS = [...SAFE_KEYWORDS, ...CONDITIONAL_KEYWORDS];

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

const conditionalSet = new Set(CONDITIONAL_KEYWORDS);

console.log("");
console.log("=== 황소특보 위험고지·투자심리 소재 후보 뉴스 검색 결과 ===");
console.log(`안전 키워드: ${SAFE_KEYWORDS.join(", ")}`);
console.log(`조건부 키워드(해석 톤 주의): ${CONDITIONAL_KEYWORDS.join(", ")}`);
console.log("");
console.log(
  "★ 제목+링크만 모은 원재료입니다. 직접 읽고 판단하세요. 조건부 항목(국민연금/연기금)은 " +
    "'매도했다/매수했다'는 팩트만 전달하고 '그러니 사야 한다/팔아야 한다'는 해석을 붙이지 " +
    "마세요 — 매수 유도로 읽힐 위험이 있습니다(Owner 확정 원칙). ★",
);
console.log("");

if (result.items.length === 0) {
  console.log("검색 결과가 없습니다.");
} else {
  const sorted = [...result.items].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  for (const item of sorted) {
    const tag = conditionalSet.has(item.keyword) ? "[조건부]" : "[안전]";
    console.log(`${tag} [${item.keyword}] ${item.title}`);
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
