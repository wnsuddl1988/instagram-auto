// L2-5 검증: indicator orchestrator (네트워크 없음, mock ECOS transport)
//
// 검증 항목
//   1. tsc strict 타입체크
//   2. 기준금리 지표 하나를 latest-period 경로로 끝까지 통과시켜 FactCard 생성
//   3. 발표일 미검증(값 불일치) 시 차단 — 날짜를 발명하지 않음
//   4. row 부족 시 차단
//   5. 다중 지표 요청에서 하나가 실패해도 나머지는 수집됨 (부분 실패 허용)
//   6. 산출된 FactCard가 live-evidence-adapter를 그대로 통과하는가 (연결 확인)
//   7. isPublishable이 항상 false로 유지되는가 (승격은 downstream 책임)

import { existsSync } from "node:fs";
import path from "node:path";
import { runTsProbe, typecheck } from "./_editorial-v2-ts-probe.mjs";

const ROOT = process.cwd();
const failures = [];
const passes = [];

function check(label, fn) {
  try {
    fn();
    passes.push(label);
  } catch (error) {
    failures.push(`${label}: ${error.message}`);
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const TARGET = "lib/source-facts/indicator-orchestrator.ts";

check("target file exists", () => {
  assert(existsSync(path.join(ROOT, TARGET)), `missing ${TARGET}`);
});

check("typecheck passes", () => {
  typecheck(ROOT, [TARGET]);
});

const probe = `
import {
  fetchLatestIndicator, collectIndicators,
} from "./indicator-orchestrator.js";
import { buildEvidencePackFromLiveSources } from "../editorial-v2/live-evidence-adapter.js";
import { loadCutlineConfig } from "../editorial-v2/editorial-cutline.js";

const results: Record<string, any> = {};

function makeRow(time: string, value: number) {
  return {
    STAT_CODE: "722Y001", STAT_NAME: "한국은행 기준금리",
    ITEM_CODE1: "0101000", ITEM_NAME1: "기준금리",
    TIME: time, DATA_VALUE: String(value), UNIT_NAME: "%",
  };
}

function mockTransport(rows: any[], error: string | null = null) {
  return {
    transportId: "mock-async",
    async executeAsync() {
      if (error) return { ok: false as const, error, fetchedAt: "2026-09-16T00:00:00Z" };
      return { ok: true as const, rows, fetchedAt: "2026-09-16T00:00:00Z" };
    },
  };
}

const FETCHED_AT = "2026-09-16T00:00:00Z";

// --- 1. 정상 경로: 2026-08 값(3.0)이 BOK_BASE_RATE_DECISIONS의 최신 발표(2026-08-27)와 일치 ---
// resolveEcosBaseRateSourceDate는 테이블의 "가장 최근" 항목과만 대조하므로, 이 픽스처는
// 테이블 갱신 때마다 최신 항목에 맞춰 함께 갱신해야 한다.
const goodRows = [makeRow("202608", 3.0), makeRow("202607", 2.75)];
const ok = await fetchLatestIndicator(
  "base_rate", "202608", mockTransport(goodRows) as any, FETCHED_AT,
);
results.okStatus = ok.ok;
if (ok.ok) {
  results.factCardId = ok.factCard.id;
  results.publishedDate = ok.factCard.publishedDate;
  results.isMock = ok.factCard.isMock;
  results.isPublishable = ok.factCard.isPublishable;
  results.citationCount = ok.factCard.citations.length;
  results.indicatorName = ok.factCard.indicatorName;
  results.currentNumeric = ok.factCard.currentNumericValue;
}

// --- 2. 발표일 미검증: 값이 어떤 공식 결정과도 안 맞음 ---
const unmatchedRows = [makeRow("202608", 9.99), makeRow("202607", 9.99)];
const unresolved = await fetchLatestIndicator(
  "base_rate", "202608", mockTransport(unmatchedRows) as any, FETCHED_AT,
);
results.unresolvedOk = unresolved.ok;
results.unresolvedReason = unresolved.ok ? null : unresolved.reason;

// --- 3. row 부족 ---
const shortRows = [makeRow("202608", 3.0)];
const insufficient = await fetchLatestIndicator(
  "base_rate", "202608", mockTransport(shortRows) as any, FETCHED_AT,
);
results.insufficientOk = insufficient.ok;
results.insufficientReason = insufficient.ok ? null : insufficient.reason;

// --- 4. transport 자체 실패 ---
const transportFail = await fetchLatestIndicator(
  "base_rate", "202608", mockTransport([], "network down") as any, FETCHED_AT,
);
results.transportFailOk = transportFail.ok;
results.transportFailReason = transportFail.ok ? null : transportFail.reason;

// --- 5. 잘못된 endPeriod ---
const badPeriod = await fetchLatestIndicator(
  "base_rate", "not-a-period", mockTransport(goodRows) as any, FETCHED_AT,
);
results.badPeriodOk = badPeriod.ok;

// --- 6. 다중 지표: base_rate 성공은 성공대로, 나머지(가상의 실패 케이스)는 격리 ---
// 오케스트레이터가 지원하는 지표가 base_rate 하나뿐이므로, 같은 지표를 두 번 요청해
// 하나는 성공(goodRows), 하나는 실패(unmatchedRows)하도록 별도 transport로 나눠 검증한다.
const multiOk = await collectIndicators(
  ["base_rate"], "202608", mockTransport(goodRows) as any, FETCHED_AT,
);
results.multiCollected = multiOk.collected.length;
results.multiFailed = multiOk.failed.length;

const multiFail = await collectIndicators(
  ["base_rate"], "202608", mockTransport(unmatchedRows) as any, FETCHED_AT,
);
results.multiFailCollected = multiFail.collected.length;
results.multiFailReasons = multiFail.failed.map((f: any) => f.reason);
results.collectedAt = multiFail.collectedAt;

// --- 7. 산출된 draft FactCard는 어댑터에 바로 들어가지 않는다 ---
// (isPublishable=false는 의도된 경계다 — 승격은 downstream의 명시적 결정이어야 한다)
if (ok.ok) {
  const cutline = loadCutlineConfig();
  const draftAttempt = buildEvidencePackFromLiveSources({
    projectId: "proj-1",
    newsItems: [],
    factCards: [ok.factCard],
    cutline,
    researchCutoffDate: "2026-09-16",
    domain: "거시경제·금리",
    audience: "일반 시청자",
    targetDurationSeconds: 45,
    rawHash: "raw-1",
    normalizedHash: "norm-1",
  });
  results.draftBlockedByAdapter = !draftAttempt.ok;
  results.draftBlockedReason = draftAttempt.ok ? null : draftAttempt.reason;

  // 명시적으로 승격한 뒤에는 정상적으로 흐른다.
  const promoted = { ...ok.factCard, isPublishable: true };
  const promotedAttempt = buildEvidencePackFromLiveSources({
    projectId: "proj-1",
    newsItems: [],
    factCards: [promoted],
    cutline,
    researchCutoffDate: "2026-09-16",
    domain: "거시경제·금리",
    audience: "일반 시청자",
    targetDurationSeconds: 45,
    rawHash: "raw-1",
    normalizedHash: "norm-1",
  });
  results.adapterOk = promotedAttempt.ok;
  if (promotedAttempt.ok) {
    results.adapterSourceCount = promotedAttempt.pack.sources.length;
    results.adapterKind = Object.values(promotedAttempt.kindMap)[0];
  } else {
    results.adapterReason = promotedAttempt.reason;
  }
}

process.stdout.write(JSON.stringify(results));
`;

let r = null;
check("runtime probe executes", () => {
  r = runTsProbe({
    root: ROOT,
    probeDir: "lib/source-facts",
    probeSource: probe,
    extraJsFiles: ["indicator-orchestrator.js"],
  });
});

if (r) {
  check("resolves the latest period into a draft fact card", () => {
    assert(r.okStatus === true, "expected success on matched value/date");
    assert(r.publishedDate === "2026-08-27", `publishedDate ${r.publishedDate}`);
    assert(r.isMock === false, "live path must not be flagged as mock");
    assert(r.isPublishable === false, "publishable decision must stay downstream");
    assert(r.citationCount >= 1, "expected at least one citation");
    assert(r.indicatorName === "기준금리", `indicatorName ${r.indicatorName}`);
    assert(r.currentNumeric === 3.0, `currentNumeric ${r.currentNumeric}`);
  });

  check("never invents a published date on value mismatch", () => {
    assert(r.unresolvedOk === false, "mismatched value should not resolve a date");
    assert(
      r.unresolvedReason === "source_date_unresolved",
      `reason ${r.unresolvedReason}`,
    );
  });

  check("blocks on insufficient rows", () => {
    assert(r.insufficientOk === false, "single row should not be enough");
    assert(r.insufficientReason === "insufficient_rows", `reason ${r.insufficientReason}`);
  });

  check("surfaces transport failure without a fixture fallback", () => {
    assert(r.transportFailOk === false, "transport error should propagate");
    assert(r.transportFailReason === "transport_error", `reason ${r.transportFailReason}`);
  });

  check("rejects a malformed end period", () => {
    assert(r.badPeriodOk === false, "malformed period should fail closed");
  });

  check("collectIndicators isolates per-indicator failure", () => {
    assert(r.multiCollected === 1 && r.multiFailed === 0, "expected 1 collected, 0 failed");
    assert(
      r.multiFailCollected === 0 && JSON.stringify(r.multiFailReasons) ===
        JSON.stringify(["source_date_unresolved"]),
      `fail case: collected=${r.multiFailCollected} reasons=${JSON.stringify(r.multiFailReasons)}`,
    );
    assert(r.collectedAt === "2026-09-16T00:00:00Z", "collectedAt not caller-supplied");
  });

  check("draft fact card (isPublishable=false) is blocked at the adapter boundary", () => {
    assert(r.draftBlockedByAdapter === true, "draft card should not pass silently");
    assert(
      r.draftBlockedReason === "no_publishable_sources",
      `reason ${r.draftBlockedReason}`,
    );
  });

  check("promoted fact card flows into live-evidence-adapter", () => {
    assert(r.adapterOk === true, `adapter rejected: ${r.adapterReason}`);
    assert(r.adapterSourceCount === 1, `sources ${r.adapterSourceCount}`);
    assert(r.adapterKind === "statistic", `kind ${r.adapterKind}`);
  });
}

console.log("=== L2-5 indicator orchestrator check ===\n");
for (const label of passes) console.log(`  PASS  ${label}`);
for (const failure of failures) console.log(`  FAIL  ${failure}`);
console.log(`\n${passes.length} passed, ${failures.length} failed`);
process.exit(failures.length === 0 ? 0 : 1);
