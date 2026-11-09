#!/usr/bin/env node
/**
 * 공식 지표 스냅샷 — 한국은행 ECOS 7개 + 통계청 KOSIS 2개의 최신값을 한 번에 조회한다. (2026-09-30 밤)
 *
 * 배경: Owner 지시 — 처음 만든 공식 지표 파이프라인(run-editorial-v2-live-topic-pipeline.mjs)을 소재 탐색에서
 * 쓰지 않았고, 그 파이프라인은 .env.local을 직접 읽어 현행 규칙(no-log 래퍼로만 자격증명 주입)상 실행할 수 없었다.
 * 이 러너는 .env.local을 읽지 않고 래퍼가 주입한 환경변수만 쓴다. 키 값은 출력하지 않는다.
 *
 * 지표: 기준금리·소비자물가·원/달러 환율·국고채 3년·코스피·경상수지·상품수지(ECOS), 고용률·실업률(KOSIS).
 * 공식 발표값·기준 시점·출처만 모은다(해석은 사람이 한다). 부엉·황소 소재 탐색 오케스트레이터가 부른다.
 *
 * 사용:
 *   node scripts/run-owner-command-with-local-env-no-log.mjs owl-indicator-snapshot --arm
 */

import { runTsProbe } from "./_editorial-v2-ts-probe.mjs";

const ROOT = process.cwd();

// 월별 지표는 YYYYMM, 일별 지표는 YYYYMMDD. 오늘(KST) 기준으로 잡고, 최신 발표가 없으면 커넥터가 창 안에서 찾는다.
const nowKst = new Date(Date.now() + 9 * 3600 * 1000);
const ym = nowKst.toISOString().slice(0, 7).replace("-", "");
const ymd = nowKst.toISOString().slice(0, 10).replace(/-/g, "");

const probe = `
import { collectIndicators, type IndicatorId } from "./indicator-orchestrator.js";
import { createEcosLiveTransport, resolveEcosApiKey } from "./ecos-live-transport.js";
import { createKosisLiveTransport, resolveKosisApiKey } from "./kosis-live-transport.js";

const hasEcos = resolveEcosApiKey() !== null;
const hasKosis = resolveKosisApiKey() !== null;
if (!hasEcos) {
  process.stdout.write(JSON.stringify({ status: "BLOCKED", reason: "missing_ecos_key", hasKosis }));
  process.exit(0);
}
const fetchedAt = new Date().toISOString();
const ecos = createEcosLiveTransport(fetchedAt);
const kosis = hasKosis ? createKosisLiveTransport(fetchedAt) : undefined;
const ids: IndicatorId[] = ["base_rate", "cpi_total", "fx_usd_krw", "treasury_bond_3y", "kospi", "current_account", "trade_balance",
  ...(hasKosis ? (["employment_rate", "unemployment_rate"] as IndicatorId[]) : [])];
const endPeriod = {
  base_rate: ${JSON.stringify(ym)}, cpi_total: ${JSON.stringify(ym)}, current_account: ${JSON.stringify(ym)},
  trade_balance: ${JSON.stringify(ym)}, employment_rate: ${JSON.stringify(ym)}, unemployment_rate: ${JSON.stringify(ym)},
  fx_usd_krw: ${JSON.stringify(ymd)}, treasury_bond_3y: ${JSON.stringify(ymd)}, kospi: ${JSON.stringify(ymd)},
};
const result = await collectIndicators(ids, endPeriod, ecos, fetchedAt, { kosisTransport: kosis });
process.stdout.write(JSON.stringify({
  status: "OK",
  hasKosis,
  collected: result.collected.map((fc: any) => ({
    name: fc.indicatorName, current: fc.currentValue, previous: fc.previousValue, change: fc.changeValue,
    unit: fc.unit, period: fc.dataPeriod, published: fc.publishedDate, source: fc.sourceName, url: fc.sourceUrl,
    caution: fc.cautionNote,
  })),
  failed: result.failed,
}));
`;

let result;
try {
  result = runTsProbe({
    root: ROOT,
    probeDir: "lib/source-facts",
    probeSource: probe,
    extraJsFiles: ["indicator-orchestrator.js", "ecos-live-transport.js", "kosis-live-transport.js"],
  });
} catch (error) {
  console.error(`ABORT: ${error.message}`);
  process.exit(1);
}

if (result.status === "BLOCKED") {
  console.error(`ABORT: ECOS 키가 없습니다(래퍼 주입 확인). KOSIS 키: ${result.hasKosis ? "있음" : "없음"}`);
  process.exit(2);
}

console.log("");
console.log(`=== 공식 지표 스냅샷(ECOS·KOSIS) — 조회 ${new Date().toISOString()} ===`);
console.log("★ 공식 발표값·기준 시점만. 대본에 쓸 때는 기준 시점(period)과 발표일을 같이 적는다. ★\n");
for (const c of result.collected) {
  console.log(`■ ${c.name}: ${c.current}${c.unit ? ` ${c.unit}` : ""} (직전 ${c.previous ?? "-"}, 변화 ${c.change ?? "-"})`);
  console.log(`  기준 ${c.period} · 발표 ${c.published ?? "-"} · ${c.source}`);
  if (c.caution) console.log(`  주의: ${c.caution}`);
}
if (!result.hasKosis) console.log("\n⚠ KOSIS 키 없음 — 고용률·실업률 제외");
if (result.failed.length) {
  console.log(`\n조회 실패 ${result.failed.length}건`);
  for (const f of result.failed) console.log(`  ${f.indicatorId}: ${f.reason} — ${String(f.detail).slice(0, 160)}`);
}
console.log(`\n지표 ${result.collected.length}개 조회 성공`);
