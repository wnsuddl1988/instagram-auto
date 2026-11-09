// L2-4 검증: live-evidence-adapter (네트워크 없음)
//
// 이 어댑터는 lib/source-facts(뉴스+통계)와 lib/editorial-v2(EvidencePackDraft)를
// 잇는 유일한 다리다. 가장 중요한 두 가지를 집중 검증한다:
//   - mock 데이터가 프로덕션 근거로 새지 않는가
//   - 근거 종류별 freshness 창이 실제로 다르게 적용되는가
//     (기존 buildEvidencePackDraft는 단일 창만 지원 → 통계가 전부 stale이 되는 문제)

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

const TARGET = "lib/editorial-v2/live-evidence-adapter.ts";

check("target file exists", () => {
  assert(existsSync(path.join(ROOT, TARGET)), `missing ${TARGET}`);
});

check("typecheck passes", () => {
  typecheck(ROOT, [TARGET]);
});

const probe = `
import { buildEvidencePackFromLiveSources } from "./live-evidence-adapter.js";
import { loadCutlineConfig } from "./editorial-cutline.js";
import { validateEvidencePackDraft } from "./evidence-pack.js";

const results: Record<string, any> = {};
const cutline = loadCutlineConfig();
const CUTOFF = "2026-09-15";

const news = (over: Record<string, any> = {}): any => ({
  title: "가계부채 증가세 지속",
  description: "요약",
  link: "https://n.news.naver.com/1",
  originallink: "https://www.yna.co.kr/view/AKR1",
  publishedAt: "2026-09-14T09:00:00.000Z",
  publisherTier: "T2",
  publisherName: "연합뉴스",
  canonicalUrl: "yna.co.kr/view/AKR1",
  ...over,
});

const card = (over: Record<string, any> = {}): any => ({
  id: "fc-base-rate",
  isMock: false,
  isPublishable: true,
  primarySourceProviderId: "provider-ecos-live",
  citations: [{
    id: "cit-1", sourceName: "한국은행 ECOS",
    sourceUrl: "https://ecos.bok.or.kr/#/Short/722Y001",
    publishedDate: "2026-07-10",
  }],
  sourceName: "한국은행 ECOS",
  sourceUrl: "https://ecos.bok.or.kr/#/Short/722Y001",
  publishedDate: "2026-07-10",
  dataPeriod: "2026-07",
  indicatorName: "기준금리",
  currentValue: "3.50%", previousValue: "3.50%",
  changeValue: "0.00", changeRate: "0.0%", unit: "%",
  currentNumericValue: 3.5,
  comparisonType: "previous_month",
  interpretation: "기준금리는 3개월째 동결 상태다",
  cautionNote: "금통위 발표 기준",
  allowedClaims: ["금리가 동결됐다"],
  blockedClaims: ["금리가 곧 내린다"],
  contentCategory: "source_based_finance",
  ...over,
});

const base = {
  projectId: "proj-1",
  cutline,
  researchCutoffDate: CUTOFF,
  domain: "생활금융·부채",
  audience: "30대 직장인",
  targetDurationSeconds: 45 as const,
  rawHash: "raw-hash-1",
  normalizedHash: "normalized-hash-1",
};

// --- 1. 기본 조립 ---
const ok = buildEvidencePackFromLiveSources({
  ...base, newsItems: [news()], factCards: [card()],
});
results.okStatus = ok.ok;
if (ok.ok) {
  results.sourceCount = ok.pack.sources.length;
  results.claimCount = ok.pack.claims.length;
  results.numberCount = ok.pack.numbers.length;
  results.numberValue = ok.pack.numbers[0]?.value;
  results.kindMapValues = Object.values(ok.kindMap).sort();
  results.blockedClaims = [...ok.blockedClaims];
  results.containsMock = ok.containsMockData;
  results.verification = ok.pack.verificationLevel;
  results.provenanceHash = ok.pack.provenance.normalizedHash;

  // 근거 종류별 freshness: 뉴스(1일 전)=fresh, 통계(67일 전)=fresh
  const byKind: Record<string, string> = {};
  for (const s of ok.pack.sources) byKind[ok.kindMap[s.sourceId]] = s.freshness;
  results.freshnessByKind = byKind;
  results.freshSourceCount = ok.pack.coverage.freshSourceCount;

  // 기존 validator를 그대로 통과하는지 (dangling ref / fresh source 검사 포함)
  const review = validateEvidencePackDraft(ok.pack);
  results.reviewBlocking = [...review.blockingIssues];
}

// --- 2. mock 차단 ---
const mockBlocked = buildEvidencePackFromLiveSources({
  ...base, newsItems: [news()], factCards: [card({ isMock: true })],
});
results.mockBlockedOk = mockBlocked.ok;
results.mockBlockedReason = mockBlocked.ok ? null : mockBlocked.reason;
results.mockSkipReasons = mockBlocked.skipped.map((s: any) => s.reason);

// --- 3. mock 명시 허용 시 플래그 ---
const mockAllowed = buildEvidencePackFromLiveSources({
  ...base, newsItems: [news()], factCards: [card({ isMock: true })], allowMock: true,
});
results.mockAllowedOk = mockAllowed.ok;
results.mockAllowedFlag = mockAllowed.ok ? mockAllowed.containsMockData : null;

// --- 4. 통계 freshness 창이 실제로 다른가 ---
// 통계 400일 창 밖(500일 전) → stale
const staleStat = buildEvidencePackFromLiveSources({
  ...base, newsItems: [news()], factCards: [card({ publishedDate: "2025-01-10" })],
});
if (staleStat.ok) {
  const statSource = staleStat.pack.sources.find(
    (s: any) => staleStat.kindMap[s.sourceId] === "statistic");
  results.staleStatFreshness = statSource?.freshness;
}
// 뉴스 7일 창 밖(30일 전) → stale. 같은 날짜를 통계에 주면 fresh여야 함
const oldNews = buildEvidencePackFromLiveSources({
  ...base,
  newsItems: [news({ publishedAt: "2026-08-15T09:00:00.000Z" })],
  factCards: [card({ publishedDate: "2026-08-15" })],
});
if (oldNews.ok) {
  const map: Record<string, string> = {};
  for (const s of oldNews.pack.sources) map[oldNews.kindMap[s.sourceId]] = s.freshness;
  results.sameDateDifferentWindow = map;
}

// --- 5. 불량 소스 제외 ---
const filtered = buildEvidencePackFromLiveSources({
  ...base,
  newsItems: [
    news(),
    news({ publisherTier: "T3", publisherName: null, canonicalUrl: "blog.kr/1",
           title: "블로그", originallink: "https://blog.kr/1" }),
    news({ publisherName: null, canonicalUrl: "unknown.kr/1", title: "무명",
           originallink: "https://unknown.kr/1" }),
    news({ publishedAt: "깨진날짜", canonicalUrl: "yna.co.kr/view/AKR9",
           title: "날짜불량", originallink: "https://www.yna.co.kr/view/AKR9" }),
    news({ title: "중복" }),
  ],
  factCards: [
    card(),
    card({ id: "fc-2", isPublishable: false, indicatorName: "비공개지표" }),
    card({ id: "fc-3", citations: [], indicatorName: "출처없음",
           sourceUrl: "https://ecos.bok.or.kr/x" }),
  ],
});
results.filteredOk = filtered.ok;
results.filteredSkipReasons = filtered.skipped.map((s: any) => s.reason).sort();
if (filtered.ok) results.filteredSourceCount = filtered.pack.sources.length;

// --- 6. 거부 케이스 ---
const noSources = buildEvidencePackFromLiveSources({
  ...base, newsItems: [], factCards: [],
});
results.noSourcesReason = noSources.ok ? "NO_REJECT" : noSources.reason;

const newsOnly = buildEvidencePackFromLiveSources({
  ...base, newsItems: [news()], factCards: [],
});
results.newsOnlyReason = newsOnly.ok ? "NO_REJECT" : newsOnly.reason;

const badCutoff = buildEvidencePackFromLiveSources({
  ...base, newsItems: [news()], factCards: [card()], researchCutoffDate: "2026/09/15",
});
results.badCutoffReason = badCutoff.ok ? "NO_REJECT" : badCutoff.reason;

// --- 7. 수치 없는 통계도 살아남는가 ---
const noNumeric = buildEvidencePackFromLiveSources({
  ...base, newsItems: [news()],
  factCards: [card({ currentNumericValue: undefined })],
});
results.noNumericOk = noNumeric.ok;
if (noNumeric.ok) {
  results.noNumericNumbers = noNumeric.pack.numbers.length;
  results.noNumericWarnings = noNumeric.pack.coverage.warnings.length;
}

// --- 8. previous/change 수치도 numbers[]에 각각 들어가는가 ---
// L2-8 리허설에서 LLM이 "2.75%에서 3.00%로"를 narration에 썼지만 "2.75"가
// numbers[]에 citable하게 없어 HC-08 self-check를 스스로 false로 표시한 문제를 재현·검증.
const comparison = buildEvidencePackFromLiveSources({
  ...base, newsItems: [news()],
  factCards: [card({
    id: "fc-base-rate-202608",
    currentValue: "3.00%", previousValue: "2.75%", changeValue: "+0.25%p",
    currentNumericValue: 3.0, previousNumericValue: 2.75, changeNumericValue: 0.25,
    interpretation: "한국은행이 2026년 8월 기준금리를 2.75%에서 3.00%로 +0.25%p 조정했다",
  })],
});
results.comparisonOk = comparison.ok;
if (comparison.ok) {
  results.comparisonNumberCount = comparison.pack.numbers.length;
  results.comparisonValues = comparison.pack.numbers.map((n) => n.value).sort((a, b) => a - b);
}

// --- 9. 제목 관련성 필터 — 라이브 실행(2026-09-16)에서 재현된 실제 문제 ---
// "대출금리" 검색이 무관 기사(장관 후보자 논란, 미 국채금리)까지 끌고 와서
// 전부 기준금리 signal의 "보강 근거"로 붙어버렸다. newsRelevanceKeywords로 걸러낸다.
const mixedNews = [
  news({
    title: "오늘 대출금리 인상 소식",
    originallink: "https://www.yna.co.kr/relevant",
    canonicalUrl: "yna.co.kr/relevant",
  }),
  news({
    title: "이형일 후보자 '비거주 1주택' 논란",
    originallink: "https://www.joongang.co.kr/irrelevant-1",
    canonicalUrl: "joongang.co.kr/irrelevant-1",
    publisherName: "중앙일보",
  }),
  news({
    title: "미 10년물 국채금리 5% 돌파",
    originallink: "https://news.kbs.co.kr/irrelevant-2",
    canonicalUrl: "news.kbs.co.kr/irrelevant-2",
    publisherName: "KBS",
  }),
];
const relevanceFiltered = buildEvidencePackFromLiveSources({
  ...base, newsItems: mixedNews, factCards: [card()],
  newsRelevanceKeywords: ["대출금리", "리볼빙", "카드론", "가계부채", "전세대출"],
});
results.filteredRelevanceOk = relevanceFiltered.ok;
if (relevanceFiltered.ok) {
  results.filteredRelevanceSourceCount = relevanceFiltered.pack.sources.length; // stat 1 + news 1
  results.filteredRelevanceNewsTitles = relevanceFiltered.pack.sources
    .filter((s) => s.sourceId.startsWith("news"))
    .map((s) => s.title);
}
results.filteredRelevanceSkipReasons = relevanceFiltered.ok
  ? relevanceFiltered.skipped.filter((s) => s.reason === "title_not_relevant").length
  : null;

// --- 10. 필터 미지정 시(undefined/빈 배열) 기존 동작 그대로(회귀 없음) ---
const noFilter = buildEvidencePackFromLiveSources({
  ...base, newsItems: mixedNews, factCards: [card()],
});
results.noFilterSourceCount = noFilter.ok ? noFilter.pack.sources.length : null; // stat 1 + news 3

process.stdout.write(JSON.stringify(results));
`;

let r = null;
check("runtime probe executes", () => {
  r = runTsProbe({
    root: ROOT,
    probeDir: "lib/editorial-v2",
    probeSource: probe,
    extraJsFiles: ["live-evidence-adapter.js"],
  });
});

if (r) {
  check("assembles a pack from news + statistics", () => {
    assert(r.okStatus === true, "adapter rejected a valid input");
    assert(r.sourceCount === 2, `sources ${r.sourceCount}, expected 2`);
    assert(r.claimCount === 1, `claims ${r.claimCount}, expected 1`);
    assert(r.numberCount === 1, `numbers ${r.numberCount}, expected 1`);
    assert(r.numberValue === 3.5, `number value ${r.numberValue}`);
    assert(r.verification === "structural_only", `verification ${r.verification}`);
    assert(r.provenanceHash === "normalized-hash-1", "normalizedHash not carried through");
  });

  check("kind map tags both source types", () => {
    assert(
      JSON.stringify(r.kindMapValues) === JSON.stringify(["news", "statistic"]),
      `kinds ${JSON.stringify(r.kindMapValues)}`,
    );
  });

  check("blocked claims are surfaced, not silently dropped", () => {
    assert(
      JSON.stringify(r.blockedClaims) === JSON.stringify(["금리가 곧 내린다"]),
      `blockedClaims ${JSON.stringify(r.blockedClaims)}`,
    );
  });

  check("per-kind freshness windows are applied", () => {
    assert(r.freshnessByKind.news === "fresh", `news ${r.freshnessByKind.news}`);
    // 통계는 67일 전이라 기존 30d 창이면 stale이 됐을 것
    assert(
      r.freshnessByKind.statistic === "fresh",
      `statistic ${r.freshnessByKind.statistic} — 400-day window not applied`,
    );
    assert(r.freshSourceCount === 2, `freshSourceCount ${r.freshSourceCount}`);
  });

  check("same date resolves differently per kind", () => {
    const m = r.sameDateDifferentWindow;
    assert(m.news === "stale", `30-day-old news should be stale, got ${m.news}`);
    assert(m.statistic === "fresh", `30-day-old statistic should be fresh, got ${m.statistic}`);
  });

  check("statistics outside the 400-day cap go stale", () => {
    assert(r.staleStatFreshness === "stale", `got ${r.staleStatFreshness}`);
  });

  check("pack passes the existing validator", () => {
    assert(
      JSON.stringify(r.reviewBlocking) === "[]",
      `blockingIssues ${JSON.stringify(r.reviewBlocking)}`,
    );
  });

  check("mock data is blocked by default", () => {
    assert(r.mockBlockedOk === false, "mock fact card produced a pack");
    assert(r.mockBlockedReason === "no_signals", `reason ${r.mockBlockedReason}`);
    assert(
      r.mockSkipReasons.includes("mock_data"),
      `skip reasons ${JSON.stringify(r.mockSkipReasons)}`,
    );
  });

  check("mock requires explicit opt-in and is flagged", () => {
    assert(r.mockAllowedOk === true, "allowMock did not permit assembly");
    assert(r.mockAllowedFlag === true, "containsMockData not set under allowMock");
  });

  check("unusable sources are skipped with reasons", () => {
    assert(r.filteredOk === true, "valid subset was rejected");
    assert(r.filteredSourceCount === 2, `kept ${r.filteredSourceCount}, expected 2`);
    const expected = [
      "duplicate_url", "missing_published_date", "missing_publisher",
      "no_citations", "not_publishable", "untiered_publisher",
    ];
    assert(
      JSON.stringify(r.filteredSkipReasons) === JSON.stringify(expected),
      `skip reasons ${JSON.stringify(r.filteredSkipReasons)}`,
    );
  });

  check("rejects with structured reasons", () => {
    assert(r.noSourcesReason === "no_publishable_sources", `got ${r.noSourcesReason}`);
    assert(r.newsOnlyReason === "no_signals", `news-only got ${r.newsOnlyReason}`);
    assert(r.badCutoffReason === "invalid_cutoff_date", `got ${r.badCutoffReason}`);
  });

  check("statistic without a numeric value still yields a claim", () => {
    assert(r.noNumericOk === true, "non-numeric fact card was rejected");
    assert(r.noNumericNumbers === 0, `numbers ${r.noNumericNumbers}`);
    assert(r.noNumericWarnings >= 1, "expected a coverage warning");
  });

  check("current/previous/change values each become a citable number record", () => {
    assert(r.comparisonOk === true, "comparison fact card was rejected");
    assert(r.comparisonNumberCount === 3, `numbers ${r.comparisonNumberCount}, expected 3`);
    assert(
      JSON.stringify(r.comparisonValues) === JSON.stringify([0.25, 2.75, 3]),
      `values ${JSON.stringify(r.comparisonValues)} — "이전 값" must be independently citable`,
    );
  });

  check("newsRelevanceKeywords filters out title-irrelevant articles (2026-09-16 live finding)", () => {
    assert(r.filteredRelevanceOk === true, "pack should still build with 1 relevant article + 1 stat");
    assert(r.filteredRelevanceSourceCount === 2, `sources ${r.filteredRelevanceSourceCount}, expected 2 (1 stat + 1 relevant news)`);
    assert(
      JSON.stringify(r.filteredRelevanceNewsTitles) === JSON.stringify(["오늘 대출금리 인상 소식"]),
      `kept titles ${JSON.stringify(r.filteredRelevanceNewsTitles)}`,
    );
    assert(r.filteredRelevanceSkipReasons === 2, `title_not_relevant skips ${r.filteredRelevanceSkipReasons}, expected 2`);
  });

  check("omitting newsRelevanceKeywords keeps prior behavior (no filtering)", () => {
    assert(r.noFilterSourceCount === 4, `sources ${r.noFilterSourceCount}, expected 4 (1 stat + 3 news, unfiltered)`);
  });
}

console.log("=== L2-4 live evidence adapter check ===\n");
for (const label of passes) console.log(`  PASS  ${label}`);
for (const failure of failures) console.log(`  FAIL  ${failure}`);
console.log(`\n${passes.length} passed, ${failures.length} failed`);
process.exit(failures.length === 0 ? 0 : 1);
