// L3 스코어링 검증: live-topic-score (네트워크 없음, LLM 호출 없음)
//
// 검증 항목
//   1. tsc strict 타입체크
//   2. 각 S-01..S-10이 0/1/2점 경계를 정확히 구분하는가
//   3. S-03(manual_only)이 항상 null이고 합계에서 제외되는가
//   4. S-10(not_yet_determinable)이 항상 중립 1점 고정인가
//   5. hasLowConfidenceItems가 실제로 heuristic/manual/not_yet 항목 존재를 반영하는가
//   6. scoreAndRankCandidates가 총점 내림차순으로 정렬하는가
//   7. **실전 검증**: Owner의 실제 3회차 응답 5건을 채점해 합리적인 분포가 나오는가

import { existsSync, readFileSync } from "node:fs";
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

const TARGET = "lib/editorial-v2/live-topic-score.ts";

check("target file exists", () => {
  assert(existsSync(path.join(ROOT, TARGET)), `missing ${TARGET}`);
});

check("typecheck passes", () => {
  typecheck(ROOT, [TARGET]);
});

const ownerResponse = JSON.parse(
  readFileSync(path.join(ROOT, "scripts/_l3-owner-response-fixture.json"), "utf8"),
);

const probe = `
import { scoreCandidate, scoreAndRankCandidates } from "./live-topic-score.js";
import { loadCutlineConfig } from "./editorial-cutline.js";
import { loadSourceRegistry } from "./economic-source-registry.js";
import { buildEvidencePackFromLiveSources } from "./live-evidence-adapter.js";

const results: Record<string, any> = {};
const cutline = loadCutlineConfig();
const registry = loadSourceRegistry();

const news: any = {
  title: "가계부채 역대 최대 경신…리볼빙 잔액도 3개월 연속 증가",
  description: "요약", link: "https://n.news.naver.com/1",
  originallink: "https://www.yna.co.kr/view/AKR20260915",
  publishedAt: "2026-09-15T09:00:00.000Z",
  publisherTier: "T2", publisherName: "연합뉴스",
  canonicalUrl: "yna.co.kr/view/AKR20260915",
};
const card: any = {
  id: "fc-base-rate-202608", isMock: false, isPublishable: true,
  primarySourceProviderId: "provider-ecos-live",
  citations: [
    { id: "cit-1", sourceName: "한국은행 ECOS", sourceUrl: "https://ecos.bok.or.kr/#/Short/722Y001", publishedDate: "2026-08-27" },
  ],
  sourceName: "한국은행 ECOS — 기준금리", sourceUrl: "https://ecos.bok.or.kr/#/Short/722Y001",
  publishedDate: "2026-08-27", dataPeriod: "2026년 8월", indicatorName: "한국은행 기준금리",
  currentValue: "3.00%", previousValue: "2.75%", changeValue: "+0.25%p", changeRate: "+9.09%", unit: "%",
  currentNumericValue: 3.0, previousNumericValue: 2.75, changeNumericValue: 0.25,
  comparisonType: "previous_release",
  interpretation: "한국은행이 2026년 8월 기준금리를 2.75%에서 3.00%로 +0.25%p 조정했다.",
  cautionNote: "기준금리 변경은 발표 시점 기준이며, 향후 추가 변동 가능성은 이 수치에 반영되어 있지 않다.",
  allowedClaims: ["2026년 8월 기준금리는 3.00%다."],
  blockedClaims: ["금리 급등락"],
  contentCategory: "source_based_finance",
};
const adapted = buildEvidencePackFromLiveSources({
  projectId: "shorts-editorial-os-v2", newsItems: [news], factCards: [card], cutline,
  researchCutoffDate: "2026-09-16", domain: "생활금융·부채",
  audience: "30대 직장인", targetDurationSeconds: 45,
  rawHash: "raw-1", normalizedHash: "norm-1",
});
results.adapterOk = adapted.ok;
const pack = adapted.ok ? adapted.pack : null;

function makeBeat(scene: number, role: string, narration: string, sourceRefs: string[]): any {
  return { scene, role, narration, sceneVisualPrompt: "no visible text", sourceRefs };
}

if (pack) {
  const allSourceRefs = pack.sources.map((s: any) => s.sourceId);
  const allNumberRefs = pack.numbers.map((n: any) => n.numberId);

  // --- S-01 경계: 근거 없음 / 대략치 / 정확치 ---
  const base: any = {
    candidateId: "c", title: "최근 한국은행 기준금리 변화",
    hookType: "info_gap", hook: "훅",
    sourceRefs: allSourceRefs, numberRefs: [],
    beats: cutline.sceneStructure.map((s: any) => makeBeat(s.scene, s.role, "내레이션", allSourceRefs)),
    closingDisclaimer: cutline.disclaimerText,
  };

  const s01NoNumber = scoreCandidate({ ...base, numberRefs: [] }, pack, cutline, registry);
  results.s01NoNumber = s01NoNumber.items.find((i: any) => i.id === "S-01");

  const s01Vague = scoreCandidate({
    ...base, numberRefs: allNumberRefs,
    beats: base.beats.map((b: any, i: number) => i === 2 ? { ...b, narration: "수조 원 규모로 늘었다" } : b),
  }, pack, cutline, registry);
  results.s01Vague = s01Vague.items.find((i: any) => i.id === "S-01");

  const s01Precise = scoreCandidate({
    ...base, numberRefs: allNumberRefs,
    beats: base.beats.map((b: any, i: number) => i === 2 ? { ...b, narration: "기준금리가 3%로 올랐다" } : b),
  }, pack, cutline, registry);
  results.s01Precise = s01Precise.items.find((i: any) => i.id === "S-01");

  // "연%"는 ECOS 원자료 unit 표기다. 2026-09-16 라이브 실행에서 LLM이 이 표기를
  // 그대로 따라 정확히 인용했는데도 정밀치로 인식되지 않은 문제를 재현·검증.
  const s01PreciseAnnualPercent = scoreCandidate({
    ...base, numberRefs: allNumberRefs,
    beats: base.beats.map((b: any, i: number) => i === 2 ? { ...b, narration: "기준금리를 2.75연%에서 3연%로 조정했습니다" } : b),
  }, pack, cutline, registry);
  results.s01PreciseAnnualPercent = s01PreciseAnnualPercent.items.find((i: any) => i.id === "S-01");

  // --- S-02: hookType 매핑 ---
  const s02InfoGap = scoreCandidate({ ...base, hookType: "info_gap" }, pack, cutline, registry);
  results.s02InfoGap = s02InfoGap.items.find((i: any) => i.id === "S-02");
  const s02NamedMistake = scoreCandidate({ ...base, hookType: "named_mistake" }, pack, cutline, registry);
  results.s02NamedMistake = s02NamedMistake.items.find((i: any) => i.id === "S-02");
  const s02Unknown = scoreCandidate({ ...base, hookType: "완전히 이상한 값" }, pack, cutline, registry);
  results.s02Unknown = s02Unknown.items.find((i: any) => i.id === "S-02");

  // --- S-03: 항상 null, manual_only ---
  const s03 = scoreCandidate(base, pack, cutline, registry).items.find((i: any) => i.id === "S-03");
  results.s03 = s03;

  // --- S-04: loss_aversion 키워드 ---
  const withLossAversion = (text: string) => scoreCandidate({
    ...base,
    beats: base.beats.map((b: any) => b.role === "loss_aversion" ? { ...b, narration: text } : b),
  }, pack, cutline, registry).items.find((i: any) => i.id === "S-04");
  results.s04Strong = withLossAversion("모르고 지나치면 손해다");
  results.s04Weak = withLossAversion("주의가 필요하다");
  results.s04None = withLossAversion("그냥 평범한 문장이다");

  // --- S-05: 시의성 — 뉴스 신선도 ---
  results.s05Fresh = scoreCandidate(base, pack, cutline, registry).items.find((i: any) => i.id === "S-05");
  const staleNewsPack = { ...pack, sources: pack.sources.map((s: any) =>
    s.sourceId.startsWith("news") ? { ...s, publishedAt: "2026-08-01T00:00:00.000Z" } : s) };
  results.s05Stale = scoreCandidate(base, staleNewsPack, cutline, registry).items.find((i: any) => i.id === "S-05");
  const statOnlyCandidate = { ...base, sourceRefs: allSourceRefs.filter((id: string) => id.startsWith("stat")) };
  results.s05StatOnly = scoreCandidate(statOnlyCandidate, pack, cutline, registry).items.find((i: any) => i.id === "S-05");

  // --- S-06: 고유명사 인지도 ---
  results.s06T1 = scoreCandidate({ ...base, title: "오늘 한국은행 기준금리 변화" }, pack, cutline, registry)
    .items.find((i: any) => i.id === "S-06");
  results.s06None = scoreCandidate({ ...base, title: "오늘 금리 이야기" }, pack, cutline, registry)
    .items.find((i: any) => i.id === "S-06");

  // --- S-07: 실행 가능성 ---
  const withAction = (text: string) => scoreCandidate({
    ...base, beats: base.beats.map((b: any) => b.role === "action" ? { ...b, narration: text } : b),
  }, pack, cutline, registry).items.find((i: any) => i.id === "S-07");
  results.s07Immediate = withAction("오늘 1분만 투자해서 바로 확인해보자");
  results.s07Delayed = withAction("천천히 확인하자");
  // 2026-09-16 라이브 실행에서 "~를 확인하세요" 존댓말 명령형이 0점으로 잘못
  // 판정된 실제 사례를 재현 — 청유형뿐 아니라 존댓말 명령형도 인식해야 한다.
  results.s07PoliteImperative = withAction("보도 속 기준금리와 실제 상품 금리를 따로 확인하세요");
  results.s07None = withAction("평범한 문장");

  // --- S-08: 반전 ---
  const withTwist = (text: string) => scoreCandidate({
    ...base, beats: base.beats.map((b: any) => b.role === "twist" ? { ...b, narration: text } : b),
  }, pack, cutline, registry).items.find((i: any) => i.id === "S-08");
  results.s08Strong = withTwist("하지만 실제로는 다르다");
  results.s08Weak = withTwist("그런데 조금 다르다");
  results.s08None = withTwist("평범한 문장");

  // --- S-09: 시각화 가능성 ---
  results.s09TwoRefs = scoreCandidate(base, pack, cutline, registry).items.find((i: any) => i.id === "S-09");
  const noEvidenceCardRefs = { ...base,
    beats: base.beats.map((b: any) => b.role === "evidence_card" ? { ...b, sourceRefs: [] } : b) };
  results.s09NoRefs = scoreCandidate(noEvidenceCardRefs, pack, cutline, registry).items.find((i: any) => i.id === "S-09");

  // --- S-10: 항상 중립 1점 ---
  results.s10 = scoreCandidate(base, pack, cutline, registry).items.find((i: any) => i.id === "S-10");

  // --- 총합 / totalPossible / hasLowConfidenceItems ---
  const full = scoreCandidate(base, pack, cutline, registry);
  results.itemCount = full.items.length;
  results.totalPossible = full.totalPossible;
  results.hasLowConfidenceItems = full.hasLowConfidenceItems;
  results.passesThresholdField = full.passesThreshold;

  // Owner 결정(2026-09-16): totalPossible이 20 -> 18로 줄었어도 passThreshold는
  // 재조정 없이 14 그대로 유지한다. cutline.score.passThreshold 값 자체를 직접
  // 확인해 코드가 이걸 하드코딩하지 않고 설정에서 읽는지 검증한다.
  results.cutlinePassThreshold = cutline.score.passThreshold;
  results.thresholdAt14PassesJustBarely = 14 >= cutline.score.passThreshold; // true라면 14는 통과
  results.thresholdAt13Fails = 13 >= cutline.score.passThreshold === false; // 13은 탈락해야 함

  // --- 정렬 ---
  const weak: any = { ...base, candidateId: "weak", hookType: "완전히 이상한 값",
    numberRefs: [], sourceRefs: [] };
  const strong: any = { ...base, candidateId: "strong" };
  const ranked = scoreAndRankCandidates([weak, strong], pack, cutline, registry);
  results.rankedOrder = ranked.map((r: any) => r.candidateId);
  results.rankedDescending = ranked[0].total >= ranked[1].total;

  // --- 실전: Owner 3회차 응답 5건 채점 ---
  const ownerResponse = ${JSON.stringify(ownerResponse)};
  const ownerScores = scoreAndRankCandidates(ownerResponse.candidates, pack, cutline, registry);
  results.ownerScoreCount = ownerScores.length;
  results.ownerTotals = ownerScores.map((s: any) => ({ id: s.candidateId, total: s.total, possible: s.totalPossible }));
  results.ownerAllHaveLowConfidence = ownerScores.every((s: any) => s.hasLowConfidenceItems);
  results.ownerS01Scores = ownerScores.map((s: any) =>
    s.items.find((i: any) => i.id === "S-01").points);
}

process.stdout.write(JSON.stringify(results));
`;

let r = null;
check("runtime probe executes", () => {
  r = runTsProbe({
    root: ROOT,
    probeDir: "lib/editorial-v2",
    probeSource: probe,
    extraJsFiles: [
      "live-topic-score.js",
      "live-topic-cutline-check.js",
      "live-evidence-adapter.js",
      "live-topic-prompt.js",
    ],
  });
});

if (r) {
  check("evidence pack builds for the fixture", () => {
    assert(r.adapterOk === true, "fixture pack failed to build");
  });

  check("S-01 distinguishes no-number / vague / precise", () => {
    assert(r.s01NoNumber.points === 0, `no-number ${r.s01NoNumber.points}`);
    assert(r.s01Vague.points === 1, `vague ${r.s01Vague.points}`);
    assert(r.s01Precise.points === 2, `precise ${r.s01Precise.points}`);
    assert(r.s01Precise.confidence === "structural", `confidence ${r.s01Precise.confidence}`);
  });

  check("S-01 recognizes the 연% (ECOS annual-rate) unit form (2026-09-16 live finding)", () => {
    assert(r.s01PreciseAnnualPercent.points === 2, `연% form ${r.s01PreciseAnnualPercent.points}, expected 2`);
  });

  check("S-02 maps hook types to curiosity-gap strength", () => {
    assert(r.s02InfoGap.points === 2, `info_gap ${r.s02InfoGap.points}`);
    assert(r.s02NamedMistake.points === 1, `named_mistake ${r.s02NamedMistake.points}`);
    assert(r.s02Unknown.points === 0, `unknown ${r.s02Unknown.points}`);
    assert(r.s02InfoGap.confidence === "heuristic", "S-02 must be labeled heuristic");
  });

  check("S-03 is always null and manual_only", () => {
    assert(r.s03.points === null, `points ${r.s03.points}`);
    assert(r.s03.confidence === "manual_only", `confidence ${r.s03.confidence}`);
  });

  check("S-04 distinguishes strong / weak / no loss-aversion language", () => {
    assert(r.s04Strong.points === 2, `strong ${r.s04Strong.points}`);
    assert(r.s04Weak.points === 1, `weak ${r.s04Weak.points}`);
    assert(r.s04None.points === 0, `none ${r.s04None.points}`);
  });

  check("S-05 distinguishes fresh news / stale news / statistic-only", () => {
    assert(r.s05Fresh.points === 2, `fresh ${r.s05Fresh.points}`);
    assert(r.s05Stale.points === 0, `stale ${r.s05Stale.points}`);
    assert(r.s05StatOnly.points === 1, `stat-only ${r.s05StatOnly.points} (cap should apply)`);
  });

  check("S-06 distinguishes T1 mention from no registered name", () => {
    assert(r.s06T1.points === 2, `T1 mention ${r.s06T1.points}`);
    assert(r.s06None.points === 0, `no mention ${r.s06None.points}`);
  });

  check("S-07 distinguishes immediate / delayed / no action", () => {
    assert(r.s07Immediate.points === 2, `immediate ${r.s07Immediate.points}`);
    assert(r.s07Delayed.points === 1, `delayed ${r.s07Delayed.points}`);
    assert(r.s07None.points === 0, `none ${r.s07None.points}`);
  });

  check("S-07 recognizes polite-imperative action phrasing (2026-09-16 live finding)", () => {
    assert(r.s07PoliteImperative.points === 1, `polite imperative ${r.s07PoliteImperative.points}`);
  });

  check("S-08 distinguishes strong / weak / no twist language", () => {
    assert(r.s08Strong.points === 2, `strong ${r.s08Strong.points}`);
    assert(r.s08Weak.points === 1, `weak ${r.s08Weak.points}`);
    assert(r.s08None.points === 0, `none ${r.s08None.points}`);
  });

  check("S-09 distinguishes evidence_card ref counts", () => {
    assert(r.s09TwoRefs.points === 2, `two refs ${r.s09TwoRefs.points}`);
    assert(r.s09NoRefs.points === 0, `no refs ${r.s09NoRefs.points}`);
  });

  check("S-10 is fixed neutral and labeled not_yet_determinable", () => {
    assert(r.s10.points === 1, `points ${r.s10.points}`);
    assert(r.s10.confidence === "not_yet_determinable", `confidence ${r.s10.confidence}`);
  });

  check("aggregate totals exclude S-03's null from totalPossible", () => {
    assert(r.itemCount === 10, `item count ${r.itemCount}`);
    assert(r.totalPossible === 18, `totalPossible ${r.totalPossible} (expected 9 scored items * 2)`);
    assert(r.hasLowConfidenceItems === true, "S-02/S-04/S-07/S-08/S-10 should trip the low-confidence flag");
  });

  check("passThreshold stays 14 against the 18-point scale (Owner decision, not rescaled)", () => {
    assert(r.cutlinePassThreshold === 14, `cutline.score.passThreshold ${r.cutlinePassThreshold}, expected 14`);
    assert(r.thresholdAt14PassesJustBarely === true, "14 should clear the threshold");
    assert(r.thresholdAt13Fails === true, "13 should not clear the threshold");
  });

  check("scoreAndRankCandidates sorts descending by total", () => {
    assert(r.rankedOrder[0] === "strong", `order ${JSON.stringify(r.rankedOrder)}`);
    assert(r.rankedDescending === true, "not sorted descending");
  });

  check("REAL CASE: Owner's 5 actual candidates score plausibly", () => {
    assert(r.ownerScoreCount === 5, `count ${r.ownerScoreCount}`);
    assert(r.ownerAllHaveLowConfidence === true, "every real candidate should trip low-confidence (heuristic items present)");
    // 5개 전부 twist 장면에서 "3%만 보면... 실제 비교는/핵심은" 식으로 비교값을 명시했으므로
    // numberRefs가 3개 다 해석 가능하고 narration에 정확한 %가 있어 S-01은 전부 2점이어야 한다.
    assert(
      r.ownerS01Scores.every((p) => p === 2),
      `S-01 scores ${JSON.stringify(r.ownerS01Scores)}, expected all 2`,
    );
    // 총점이 전부 0보다 크고 totalPossible(18) 이하인 정상 범위인지만 확인 — 이 곡선의 절대값이
    // 아니라, "구조가 깨지지 않고 실제로 순위를 만들어낸다"는 것이 이 실전 테스트의 목적.
    for (const { id, total, possible } of r.ownerTotals) {
      assert(total > 0 && total <= possible, `${id}: total ${total} out of range (0, ${possible}]`);
    }
  });
}

console.log("=== L3 score check ===\n");
for (const label of passes) console.log(`  PASS  ${label}`);
for (const failure of failures) console.log(`  FAIL  ${failure}`);
console.log(`\n${passes.length} passed, ${failures.length} failed`);
process.exit(failures.length === 0 ? 0 : 1);
