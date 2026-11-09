#!/usr/bin/env node
/**
 * 황소특보 소재 후보 스캔 — 수동 실행용(cron/예약 없음, Owner가 필요할 때 직접 돌림).
 *
 * KIS(국내 지수+대형주)와 Alpha Vantage(미국 지수 ETF 프록시+대형주)에서 오늘 시세를
 * 가져와 lib/source-facts/bull-topic-threshold-scanner.ts의 확정 임계치로 걸러
 * "오늘 소재가 될 만한 게 있는지"만 콘솔에 보여준다.
 *
 * 이 repo에 tsx/ts-node가 없어(scripts/_editorial-v2-ts-probe.mjs 참고) TS 소스를
 * 직접 실행할 수 없다 — Node 네이티브 TS 지원도 확장자 없는 상대 import(번들러
 * 기준으로 작성된 이 repo의 lib/source-facts/*.ts 관례)를 해석하지 못해 그대로는
 * 안 된다. 그래서 이 파일은 runTsProbe() 패턴(scripts/_indicator-orchestrator-
 * live-check.mjs와 동일)을 그대로 써서, 실제 조회 로직은 TS 프로브 문자열로 만들어
 * 임시 컴파일 후 실행한다.
 *
 * 이 스크립트는 대본을 쓰지 않는다 — 후보 목록만 보여주고 끝난다. 실제 대본
 * 작성·이미지/영상 생성은 별도 단계(사람 또는 다른 스크립트)에서 진행한다.
 * 중소형주(stock_other)는 이 스캐너 자체가 issueConfirmed 없이는 무조건 거부하므로,
 * 이 스크립트도 issueConfirmed를 넘기지 않는다(기본 false) — 중소형주 급등락은
 * 여기서는 다루지 않고, 뉴스/공시로 이슈를 확인하는 건 사람이 한다.
 *
 * 사용:
 *   node scripts/run-owner-command-with-local-env-no-log.mjs bull-topic-scan --arm
 *
 * Alpha Vantage 무료 티어는 하루 25건/초당 1건 제한이다(2026-09-23 실측 확인 —
 * 이전에 다른 작업에서 이미 호출을 소진해 rate limit에 걸린 적 있음). 이 스크립트
 * 한 번 실행에 미국 지수 ETF 3건+미국 대형주 3건=6건을 쓴다. 하루 여러 번 돌리면
 * 25건 상한에 금방 도달하므로, 급하지 않으면 하루 1~2회로 제한해서 쓸 것.
 */

import { runTsProbe } from "./_editorial-v2-ts-probe.mjs";

const ROOT = process.cwd();

if (!process.env.KIS_APP_KEY || !process.env.KIS_APP_SECRET) {
  console.error("ABORT: KIS 자격증명이 없습니다(KIS_APP_KEY/KIS_APP_SECRET). no-log 래퍼로 실행하세요.");
  process.exit(2);
}
if (!process.env.ALPHA_VANTAGE_API_KEY) {
  console.error("ABORT: Alpha Vantage API 키가 없습니다(ALPHA_VANTAGE_API_KEY). no-log 래퍼로 실행하세요.");
  process.exit(2);
}

const fetchedAt = new Date().toISOString();

const probe = `
import {
  buildKisIndexQuoteRequest,
  buildKisQuoteRequest,
  collectKisIndexQuote,
  collectKisQuote,
  KIS_INDEX_NAME_BY_CODE,
} from "./kis-connector.js";
import {
  createKisIndexLiveTransport,
  createKisLiveTransport,
  hasKisCredentials,
} from "./kis-live-transport.js";
import {
  buildAlphaVantageQuoteRequest,
  collectAlphaVantageQuote,
  US_INDEX_ETF_PROXIES,
} from "./alpha-vantage-connector.js";
import {
  createAlphaVantageLiveTransport,
  hasAlphaVantageApiKey,
} from "./alpha-vantage-live-transport.js";
import type { KisIndexCode } from "./kis-connector.js";
import {
  BULL_NAMEABLE_STOCKS,
  evaluateBullTopicCandidate,
} from "./bull-topic-threshold-scanner.js";

const fetchedAt = ${JSON.stringify(fetchedAt)};
const tradingDateIso = fetchedAt.slice(0, 10);

const results: { evaluations: any[]; failures: { label: string; reason: string }[] } = {
  evaluations: [],
  failures: [],
};

if (!hasKisCredentials()) {
  process.stdout.write(JSON.stringify({ status: "BLOCKED", reason: "missing_kis_credentials" }));
  process.exit(0);
}
if (!hasAlphaVantageApiKey()) {
  process.stdout.write(JSON.stringify({ status: "BLOCKED", reason: "missing_alpha_vantage_key" }));
  process.exit(0);
}

const krLargeCapCodes = [...BULL_NAMEABLE_STOCKS].filter((code) => /^\\d{6}$/.test(code));
const usLargeCapSymbols = [...BULL_NAMEABLE_STOCKS].filter((code) => !/^\\d{6}$/.test(code));

const kisIndexTransport = createKisIndexLiveTransport(fetchedAt);
const kisQuoteTransport = createKisLiveTransport(fetchedAt);
const avTransport = createAlphaVantageLiveTransport(fetchedAt);

const indexCodes: KisIndexCode[] = ["0001", "1001"];
for (const indexCode of indexCodes) {
  const outcome = await collectKisIndexQuote(
    buildKisIndexQuoteRequest(indexCode, KIS_INDEX_NAME_BY_CODE[indexCode] + " 지수"),
    kisIndexTransport, "provider-kis", tradingDateIso,
  );
  if (outcome.ok) results.evaluations.push(evaluateBullTopicCandidate(outcome.indicator));
  else results.failures.push({ label: KIS_INDEX_NAME_BY_CODE[indexCode], reason: outcome.reason });
}

for (const stockCode of krLargeCapCodes) {
  const outcome = await collectKisQuote(
    buildKisQuoteRequest(stockCode, "종목 " + stockCode),
    kisQuoteTransport, "provider-kis", stockCode, tradingDateIso,
  );
  if (outcome.ok) results.evaluations.push(evaluateBullTopicCandidate(outcome.indicator));
  else results.failures.push({ label: stockCode, reason: outcome.reason });
}

// Alpha Vantage 무료 티어는 초당 1건 제한이라(하루 25건 상한도 있음), 연속
// 호출 사이에 지연을 둔다 — 1.2초면 초당 1건 제한 안에서 여유 있게 통과한다.
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
let avCallCount = 0;
async function collectAlphaVantageWithThrottle(symbol: string, indicatorName: string) {
  if (avCallCount > 0) await sleep(1200);
  avCallCount += 1;
  return collectAlphaVantageQuote(
    buildAlphaVantageQuoteRequest(symbol, indicatorName),
    avTransport, "provider-alpha-vantage", indicatorName,
  );
}

for (const proxy of Object.values(US_INDEX_ETF_PROXIES)) {
  const outcome = await collectAlphaVantageWithThrottle(proxy.symbol, proxy.indicatorName);
  if (outcome.ok) {
    const indexIndicator = { ...outcome.indicator, category: "market_index", country: "US" };
    results.evaluations.push(evaluateBullTopicCandidate(indexIndicator));
  } else {
    results.failures.push({ label: proxy.indicatorName, reason: outcome.reason });
  }
}

for (const symbol of usLargeCapSymbols) {
  const outcome = await collectAlphaVantageWithThrottle(symbol, symbol);
  if (outcome.ok) results.evaluations.push(evaluateBullTopicCandidate(outcome.indicator));
  else results.failures.push({ label: symbol, reason: outcome.reason });
}

process.stdout.write(JSON.stringify({ status: "OK", ...results }));
`;

let result;
try {
  result = runTsProbe({
    root: ROOT,
    probeDir: "lib/source-facts",
    probeSource: probe,
    extraJsFiles: [
      "kis-connector.js",
      "kis-token-cache.js",
      "kis-live-transport.js",
      "alpha-vantage-connector.js",
      "alpha-vantage-live-transport.js",
      "bull-topic-threshold-scanner.js",
    ],
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
console.log("=== 황소특보 소재 후보 스캔 결과 ===");
console.log(`조회 시각: ${fetchedAt}`);
console.log("");

const accepted = result.evaluations.filter((e) => e.accepted);
const rejected = result.evaluations.filter((e) => !e.accepted);

if (accepted.length === 0) {
  console.log("오늘은 임계치를 넘긴 소재 후보가 없습니다.");
} else {
  console.log(`★ 소재 후보 ${accepted.length}건 ★`);
  for (const e of accepted) {
    const pct = (e.absChangeRate * 100).toFixed(2);
    const nameTag = e.nameable ? "(실명 언급 가능)" : "(섹터/테마명으로만 언급)";
    console.log(`  [${e.instrumentKind}] ${e.indicator.indicatorName} — 등락률 ${pct}% ${nameTag}`);
  }
}

console.log("");
console.log(`임계치 미달/조건 미충족: ${rejected.length}건`);
for (const e of rejected) {
  const pct = (e.absChangeRate * 100).toFixed(2);
  console.log(`  [${e.instrumentKind}] ${e.indicator.indicatorName} — ${pct}% (${e.reason})`);
}

if (result.failures.length > 0) {
  console.log("");
  console.log(`조회 실패: ${result.failures.length}건`);
  for (const f of result.failures) {
    console.log(`  ${f.label}: ${f.reason}`);
  }
}

console.log("");
console.log(
  "참고: 중소형주(stock_other)는 이 스캔에 포함되지 않습니다 — 허용리스트 밖 종목은 뉴스/공시 기반" +
    " 수동 확인이 필요합니다(임계치 10%+ + 테마·공급계약 등 이슈 동반 필수).",
);
