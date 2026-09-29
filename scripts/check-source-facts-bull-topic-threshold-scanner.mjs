// 황소특보 소재 임계치 스캐너 검증 (네트워크 없음, 순수 함수)
//
// 검증 항목
//   1. tsc strict 타입체크
//   2. 계측 분류(instrument classification): 지수 US/KR, 대형주/중소형주 구분
//   3. 임계치 판정: 지수 US 2%, 지수 KR 3%, 대형주 5%, 중소형주 10%
//   4. 중소형주는 임계치를 넘어도 issueConfirmed가 없으면 거부(단순 급등락만으론 채택 안 함)
//   5. nameable 플래그: 허용리스트 종목만 true, 그 외(대형주 포함)는 false
//   6. 배치 스캔이 accepted/rejected를 정확히 분리

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

const TARGET = "lib/source-facts/bull-topic-threshold-scanner.ts";

check("target file exists", () => {
  assert(existsSync(path.join(ROOT, TARGET)), `missing ${TARGET}`);
});

check("typecheck passes", () => {
  typecheck(ROOT, [TARGET]);
});

const probe = `
import {
  BULL_TOPIC_THRESHOLDS, BULL_NAMEABLE_STOCKS, isNameableStock,
  classifyBullInstrument, evaluateBullTopicCandidate, scanBullTopicCandidates,
} from "./bull-topic-threshold-scanner.js";

const results: Record<string, any> = {};

const mkIndicator = (over: Record<string, any>) => ({
  id: "test-id", sourceProviderId: "provider-test", indicatorName: "test",
  unit: "pt", latestValue: 100, previousValue: 100, changeValue: 0, changeRate: 0,
  ...over,
});

// --- thresholds ---
results.thresholds = BULL_TOPIC_THRESHOLDS;

// --- classification ---
results.classifyIndexUs = classifyBullInstrument(mkIndicator({
  category: "market_index", country: "US",
}));
results.classifyIndexKr = classifyBullInstrument(mkIndicator({
  category: "market_index", country: "KR",
}));
results.classifyStockLarge = classifyBullInstrument(mkIndicator({
  category: "market_quote", indicatorCode: "005930",
}));
results.classifyStockOther = classifyBullInstrument(mkIndicator({
  category: "market_quote", indicatorCode: "999999",
}));

// --- nameable list ---
results.nameableSamsung = isNameableStock("005930");
results.nameableApple = isNameableStock("AAPL");
results.nameableAppleLower = isNameableStock("aapl");
results.nameableRandom = isNameableStock("999999");

// --- threshold evaluation: index US (2%) ---
results.indexUsBelow = evaluateBullTopicCandidate(
  mkIndicator({ category: "market_index", country: "US", changeRate: 0.019 }),
);
results.indexUsAt = evaluateBullTopicCandidate(
  mkIndicator({ category: "market_index", country: "US", changeRate: 0.02 }),
);
results.indexUsAbove = evaluateBullTopicCandidate(
  mkIndicator({ category: "market_index", country: "US", changeRate: 0.025 }),
);
// negative move (decline) should use absolute value
results.indexUsNegative = evaluateBullTopicCandidate(
  mkIndicator({ category: "market_index", country: "US", changeRate: -0.03 }),
);

// --- threshold evaluation: index KR (3%) ---
results.indexKrBelow = evaluateBullTopicCandidate(
  mkIndicator({ category: "market_index", country: "KR", changeRate: 0.025 }),
);
results.indexKrAbove = evaluateBullTopicCandidate(
  mkIndicator({ category: "market_index", country: "KR", changeRate: 0.035 }),
);
// same 2.5% move would have passed the US threshold but not KR — cross-check.
results.indexKrWouldPassUsThreshold = evaluateBullTopicCandidate(
  mkIndicator({ category: "market_index", country: "KR", changeRate: 0.022 }),
);

// --- threshold evaluation: large-cap stock (5%) ---
results.largeCapBelow = evaluateBullTopicCandidate(
  mkIndicator({ category: "market_quote", indicatorCode: "005930", changeRate: 0.04 }),
);
results.largeCapAbove = evaluateBullTopicCandidate(
  mkIndicator({ category: "market_quote", indicatorCode: "005930", changeRate: 0.06 }),
);

// --- threshold evaluation: other stock (10% + issue confirmed) ---
results.otherStockAboveNoIssue = evaluateBullTopicCandidate(
  mkIndicator({ category: "market_quote", indicatorCode: "999999", changeRate: 0.12 }),
  { issueConfirmed: false },
);
results.otherStockAboveDefaultNoIssue = evaluateBullTopicCandidate(
  mkIndicator({ category: "market_quote", indicatorCode: "999999", changeRate: 0.12 }),
  // issueConfirmed omitted entirely — must default to rejecting, not accepting.
);
results.otherStockAboveWithIssue = evaluateBullTopicCandidate(
  mkIndicator({ category: "market_quote", indicatorCode: "999999", changeRate: 0.12 }),
  { issueConfirmed: true },
);
results.otherStockBelowWithIssue = evaluateBullTopicCandidate(
  mkIndicator({ category: "market_quote", indicatorCode: "999999", changeRate: 0.08 }),
  { issueConfirmed: true },
);

// --- nameable flag on accepted large-cap vs. accepted-with-issue small-cap ---
results.largeCapNameableFlag = evaluateBullTopicCandidate(
  mkIndicator({ category: "market_quote", indicatorCode: "AAPL", changeRate: 0.07 }),
);
results.otherStockNameableFlag = evaluateBullTopicCandidate(
  mkIndicator({ category: "market_quote", indicatorCode: "999999", changeRate: 0.15 }),
  { issueConfirmed: true },
);

// --- batch scan ---
const batchIndicators = [
  mkIndicator({ id: "idx-us-big", category: "market_index", country: "US", changeRate: 0.03 }),
  mkIndicator({ id: "idx-us-small", category: "market_index", country: "US", changeRate: 0.01 }),
  mkIndicator({ id: "idx-kr-big", category: "market_index", country: "KR", changeRate: 0.04 }),
  mkIndicator({ id: "stock-large-big", category: "market_quote", indicatorCode: "005930", changeRate: 0.06 }),
  mkIndicator({ id: "stock-other-big-no-issue", category: "market_quote", indicatorCode: "888888", changeRate: 0.14 }),
  mkIndicator({ id: "stock-other-big-with-issue", category: "market_quote", indicatorCode: "777777", changeRate: 0.14 }),
];
const issueMap = new Map([["stock-other-big-with-issue", true]]);
const batch = scanBullTopicCandidates(batchIndicators, issueMap);
results.batchAcceptedIds = batch.accepted.map((a: any) => a.indicator.id);
results.batchRejectedIds = batch.rejected.map((r: any) => r.indicator.id);
results.batchRejectedReasons = Object.fromEntries(
  batch.rejected.map((r: any) => [r.indicator.id, r.reason]),
);

process.stdout.write(JSON.stringify(results));
`;

let r = null;
check("runtime probe executes", () => {
  r = runTsProbe({
    root: ROOT,
    probeDir: "lib/source-facts",
    probeSource: probe,
    extraJsFiles: ["bull-topic-threshold-scanner.js"],
  });
});

if (r) {
  check("confirmed thresholds match _ai/CURRENT_STANDARDS.md §3", () => {
    assert(r.thresholds.indexUs === 0.02, `indexUs ${r.thresholds.indexUs}`);
    assert(r.thresholds.indexKr === 0.03, `indexKr ${r.thresholds.indexKr}`);
    assert(r.thresholds.stockLargeCap === 0.05, `stockLargeCap ${r.thresholds.stockLargeCap}`);
    assert(r.thresholds.stockOther === 0.10, `stockOther ${r.thresholds.stockOther}`);
  });

  check("instrument classification", () => {
    assert(r.classifyIndexUs === "index_us", `classifyIndexUs ${r.classifyIndexUs}`);
    assert(r.classifyIndexKr === "index_kr", `classifyIndexKr ${r.classifyIndexKr}`);
    assert(r.classifyStockLarge === "stock_large_cap", `classifyStockLarge ${r.classifyStockLarge}`);
    assert(r.classifyStockOther === "stock_other", `classifyStockOther ${r.classifyStockOther}`);
  });

  check("nameable stock allowlist is case-insensitive for US tickers", () => {
    assert(r.nameableSamsung === true, "005930 should be nameable");
    assert(r.nameableApple === true, "AAPL should be nameable");
    assert(r.nameableAppleLower === true, "lowercase aapl should still resolve nameable");
    assert(r.nameableRandom === false, "random ticker should not be nameable");
  });

  check("index US threshold is exactly 2% (inclusive)", () => {
    assert(r.indexUsBelow.accepted === false, "1.9% should be below US index threshold");
    assert(r.indexUsAt.accepted === true, "exactly 2% should be accepted (inclusive)");
    assert(r.indexUsAbove.accepted === true, "2.5% should be accepted");
    assert(r.indexUsNegative.accepted === true, "a -3% decline should use absolute value and be accepted");
  });

  check("index KR threshold is 3%, stricter than US", () => {
    assert(r.indexKrBelow.accepted === false, "2.5% should be below KR index threshold");
    assert(r.indexKrAbove.accepted === true, "3.5% should be accepted");
    assert(
      r.indexKrWouldPassUsThreshold.accepted === false,
      "2.2% would pass the US 2% bar but must fail the stricter KR 3% bar",
    );
  });

  check("large-cap stock threshold is 5%", () => {
    assert(r.largeCapBelow.accepted === false, "4% should be below large-cap threshold");
    assert(r.largeCapAbove.accepted === true, "6% should be accepted");
  });

  check("other-stock moves require BOTH 10%+ AND a confirmed issue", () => {
    assert(r.otherStockAboveNoIssue.accepted === false, "12% with issueConfirmed:false must be rejected");
    assert(
      r.otherStockAboveNoIssue.reason === "small_cap_move_without_confirmed_issue",
      `reason ${r.otherStockAboveNoIssue.reason}`,
    );
    assert(
      r.otherStockAboveDefaultNoIssue.accepted === false,
      "omitting issueConfirmed must default to rejecting, not accepting",
    );
    assert(r.otherStockAboveWithIssue.accepted === true, "12% with issueConfirmed:true should be accepted");
    assert(r.otherStockBelowWithIssue.accepted === false, "8% is below 10% even with issueConfirmed:true");
  });

  check("nameable flag: only allowlisted large-caps are nameable, small-caps never are", () => {
    assert(r.largeCapNameableFlag.accepted === true, "AAPL 7% should be accepted");
    assert(r.largeCapNameableFlag.nameable === true, "AAPL should be nameable");
    assert(r.otherStockNameableFlag.accepted === true, "small-cap 15% with issue should be accepted");
    assert(r.otherStockNameableFlag.nameable === false, "small-cap must never be nameable, regardless of move size");
  });

  check("batch scan separates accepted/rejected and preserves per-item reasons", () => {
    assert(
      JSON.stringify(r.batchAcceptedIds.sort()) ===
        JSON.stringify(["idx-kr-big", "idx-us-big", "stock-large-big", "stock-other-big-with-issue"].sort()),
      `accepted ${JSON.stringify(r.batchAcceptedIds)}`,
    );
    assert(
      JSON.stringify(r.batchRejectedIds.sort()) ===
        JSON.stringify(["idx-us-small", "stock-other-big-no-issue"].sort()),
      `rejected ${JSON.stringify(r.batchRejectedIds)}`,
    );
    assert(r.batchRejectedReasons["idx-us-small"] === "below_threshold", "idx-us-small reason mismatch");
    assert(
      r.batchRejectedReasons["stock-other-big-no-issue"] === "small_cap_move_without_confirmed_issue",
      "stock-other-big-no-issue reason mismatch",
    );
  });
}

console.log("=== Bull topic threshold scanner check ===\n");
for (const label of passes) console.log(`  PASS  ${label}`);
for (const failure of failures) console.log(`  FAIL  ${failure}`);
console.log(`\n${passes.length} passed, ${failures.length} failed`);
process.exit(failures.length === 0 ? 0 : 1);
