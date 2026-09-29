// L2~L3 통합 파이프라인 검증 (네트워크 없음, mock transport)
//
// 검증 항목
//   1. tsc strict 타입체크
//   2. generateTopicPrompt: 지표+뉴스 mock 수집 -> evidence pack -> 프롬프트 조립까지 전체 연결
//   3. 비활성 주제 영역(disabled topicDomain) 요청 시 명확한 사유로 거부
//   4. 지표 수집 실패 시 전체 파이프라인이 구조화된 사유로 중단(가짜 성공 없음)
//   5. draft FactCard는 기본적으로 evidence pack에 들어가지 않음(promoteFactCardsToPublishable 없이는)
//   6. verifyLlmResponse: 하드컷 판정 + 스코어링을 한 번에 묶어 recommended 후보를 추려내는가
//   7. **실전**: Owner의 실제 3회차 응답을 verifyLlmResponse에 넣어 recommended가 정확히 1건인지

import { existsSync } from "node:fs";
import path from "node:path";
import { readFileSync } from "node:fs";
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

const TARGET = "lib/editorial-v2/live-topic-pipeline.ts";

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
import { generateTopicPrompt, verifyLlmResponse } from "./live-topic-pipeline.js";
import { loadCutlineConfig } from "./editorial-cutline.js";
import { loadSourceRegistry } from "./economic-source-registry.js";
import { buildEvidencePackFromLiveSources } from "./live-evidence-adapter.js";

const results: Record<string, any> = {};
const cutline = loadCutlineConfig();
const registry = loadSourceRegistry();

function makeEcosRow(time: string, value: number) {
  return {
    STAT_CODE: "722Y001", STAT_NAME: "한국은행 기준금리",
    ITEM_CODE1: "0101000", ITEM_NAME1: "기준금리",
    TIME: time, DATA_VALUE: String(value), UNIT_NAME: "%",
  };
}
function mockEcosTransport(rows: any[], error: string | null = null) {
  return {
    transportId: "mock-ecos",
    async executeAsync() {
      if (error) return { ok: false as const, error, fetchedAt: "2026-09-16T00:00:00Z" };
      return { ok: true as const, rows, fetchedAt: "2026-09-16T00:00:00Z" };
    },
  };
}
function mockNaverResponse(keyword: string) {
  return {
    ok: true as const,
    response: {
      total: 1, start: 1, display: 1,
      items: [{
        title: \`\${keyword} 관련 오늘 보도\`, description: "요약",
        link: "https://n.news.naver.com/1", originallink: "https://www.yna.co.kr/view/AKR1",
        pubDate: "Tue, 15 Sep 2026 09:00:00 +0900",
      }],
    },
  };
}
function mockNaverTransport(okKeywords: string[]) {
  return {
    transportId: "mock-naver",
    async executeAsync(request: any) {
      if (okKeywords.includes(request.keyword)) return mockNaverResponse(request.keyword);
      return { ok: false as const, reason: "no fixture" };
    },
  };
}

// --- 1. 정상 경로: 기준금리 지표(값 대조 성공) + 뉴스 키워드 일부 성공 ---
const goodRows = [makeEcosRow("202608", 3.0), makeEcosRow("202607", 2.75)];
const domain = registry.topicDomains.find((d: any) => d.id === "living_finance")!;

const good = await generateTopicPrompt({
  projectId: "proj-1", topicDomainId: "living_finance", registry, cutline,
  researchCutoffDate: "2026-09-16", audience: "30대 직장인", targetDurationSeconds: 45,
  candidateCount: 5, rawHash: "raw-1", normalizedHash: "norm-1",
  ecosTransport: mockEcosTransport(goodRows), ecosEndPeriod: "202608",
  ecosIndicatorIds: ["base_rate"],
  naverTransport: mockNaverTransport([domain.newsKeywords[0]]),
  promoteFactCardsToPublishable: true,
});
results.goodOk = good.ok;
if (good.ok) {
  results.hasPromptPackage = typeof good.promptPackage.instructions === "string";
  results.indicatorsCollected = good.indicatorsCollected;
  results.newsCollected = good.newsCollected;
  results.newsFailureCount = good.newsFailures.length;
  results.promptMentionsHardCuts = good.promptPackage.instructions.includes("HC-01");
}

// --- 2. 비활성 주제 영역 거부 ---
const disabled = await generateTopicPrompt({
  projectId: "proj-1", topicDomainId: "insurance", registry, cutline,
  researchCutoffDate: "2026-09-16", audience: "30대 직장인", targetDurationSeconds: 45,
  candidateCount: 5, rawHash: "raw-1", normalizedHash: "norm-1",
  ecosTransport: mockEcosTransport(goodRows), ecosEndPeriod: "202608",
  ecosIndicatorIds: ["base_rate"],
  naverTransport: mockNaverTransport([]),
});
results.disabledOk = disabled.ok;
results.disabledReasonStage = disabled.ok ? null : disabled.reason.stage;
results.disabledMentionsBlockedReason = disabled.ok ? null :
  (disabled.reason.stage === "evidence" ? disabled.reason.result.detail.includes("disabled") : false);

// --- 3. 지표 수집 전체 실패 ---
const indicatorFail = await generateTopicPrompt({
  projectId: "proj-1", topicDomainId: "living_finance", registry, cutline,
  researchCutoffDate: "2026-09-16", audience: "30대 직장인", targetDurationSeconds: 45,
  candidateCount: 5, rawHash: "raw-1", normalizedHash: "norm-1",
  ecosTransport: mockEcosTransport([], "network down"), ecosEndPeriod: "202608",
  ecosIndicatorIds: ["base_rate"],
  naverTransport: mockNaverTransport([domain.newsKeywords[0]]),
});
results.indicatorFailOk = indicatorFail.ok;
results.indicatorFailStage = indicatorFail.ok ? null : indicatorFail.reason.stage;

// --- 4. 승격 없이는 draft FactCard가 조용히 evidence pack에 안 들어간다 ---
const noPromote = await generateTopicPrompt({
  projectId: "proj-1", topicDomainId: "living_finance", registry, cutline,
  researchCutoffDate: "2026-09-16", audience: "30대 직장인", targetDurationSeconds: 45,
  candidateCount: 5, rawHash: "raw-1", normalizedHash: "norm-1",
  ecosTransport: mockEcosTransport(goodRows), ecosEndPeriod: "202608",
  ecosIndicatorIds: ["base_rate"],
  naverTransport: mockNaverTransport([domain.newsKeywords[0]]),
  // promoteFactCardsToPublishable 생략 — 기본값(false/undefined)
});
results.noPromoteOk = noPromote.ok;
results.noPromoteReasonStage = noPromote.ok ? null : noPromote.reason.stage;
results.noPromoteEvidenceReason = (!noPromote.ok && noPromote.reason.stage === "evidence")
  ? noPromote.reason.result.reason : null;
// draft(비publishable) fact card는 statSources 변환 단계에서 not_publishable로
// 스킵되고, 뉴스만 남는다. 뉴스만으로는 signal(=근거 있는 주장)이 안 만들어지므로
// (buildSignals는 fact card 기반으로만 signal을 만듦 — L2-4 설계) 최종 사유는
// no_publishable_sources가 아니라 no_signals다. 둘 다 draft가 조용히 새지 않는다는
// 결론은 같지만, 정확한 사유 코드를 확인해 skipped[] 내역도 함께 검증한다.
results.noPromoteSkippedHasNotPublishable = noPromote.ok ? null :
  (noPromote.reason.stage === "evidence" &&
   noPromote.reason.result.skipped.some((s) => s.reason === "not_publishable"));

// --- 5. verifyLlmResponse: 하드컷 + 스코어링을 한 번에 ---
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
  citations: [{ id: "cit-1", sourceName: "한국은행 ECOS", sourceUrl: "https://ecos.bok.or.kr/#/Short/722Y001", publishedDate: "2026-08-27" }],
  sourceName: "한국은행 ECOS — 기준금리", sourceUrl: "https://ecos.bok.or.kr/#/Short/722Y001",
  publishedDate: "2026-08-27", dataPeriod: "2026년 8월", indicatorName: "한국은행 기준금리",
  currentValue: "3.00%", previousValue: "2.75%", changeValue: "+0.25%p", changeRate: "+9.09%", unit: "%",
  currentNumericValue: 3.0, previousNumericValue: 2.75, changeNumericValue: 0.25,
  comparisonType: "previous_release",
  interpretation: "한국은행이 2026년 8월 기준금리를 2.75%에서 3.00%로 +0.25%p 조정했다.",
  cautionNote: "기준금리 변경은 발표 시점 기준이며, 향후 추가 변동 가능성은 이 수치에 반영되어 있지 않다.",
  allowedClaims: ["2026년 8월 기준금리는 3.00%다."], blockedClaims: [],
  contentCategory: "source_based_finance",
};
const adapted = buildEvidencePackFromLiveSources({
  projectId: "shorts-editorial-os-v2", newsItems: [news], factCards: [card], cutline,
  researchCutoffDate: "2026-09-16", domain: "생활금융·부채", audience: "30대 직장인",
  targetDurationSeconds: 45, rawHash: "raw", normalizedHash: "norm",
});

if (adapted.ok) {
  const ownerResponse = ${JSON.stringify(ownerResponse)};
  const combined = verifyLlmResponse(ownerResponse, adapted.pack, cutline, registry);
  results.combinedCandidateCount = combined.verdict.candidateCount;
  results.combinedPassedCount = combined.verdict.passedCount;
  results.combinedScoreCount = combined.scores.length;
  results.combinedRecommendedIds = combined.recommended.map((r: any) => r.candidateId);
  results.combinedRecommendedTop = combined.recommended[0]?.score.total ?? null;
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
      "live-topic-pipeline.js",
      "live-evidence-adapter.js",
      "live-topic-prompt.js",
      "live-topic-cutline-check.js",
      "live-topic-score.js",
    ],
  });
});

if (r) {
  check("generateTopicPrompt wires indicators + news + prompt end to end", () => {
    assert(r.goodOk === true, "expected success on the happy path");
    assert(r.hasPromptPackage === true, "prompt package missing");
    assert(r.indicatorsCollected === 1, `indicators ${r.indicatorsCollected}`);
    assert(r.newsCollected === 1, `news collected ${r.newsCollected}`);
    assert(r.promptMentionsHardCuts === true, "generated prompt does not state hard cuts");
  });

  check("disabled topic domain is rejected with a clear reason", () => {
    assert(r.disabledOk === false, "insurance domain should be disabled");
    assert(r.disabledReasonStage === "evidence", `stage ${r.disabledReasonStage}`);
    assert(r.disabledMentionsBlockedReason === true, "rejection reason does not mention disabled");
  });

  check("total indicator collection failure stops the pipeline with a structured reason", () => {
    assert(r.indicatorFailOk === false, "should fail when ECOS transport errors");
    assert(r.indicatorFailStage === "indicators", `stage ${r.indicatorFailStage}`);
  });

  check("draft fact cards are not silently promoted without explicit opt-in", () => {
    assert(r.noPromoteOk === false, "draft fact card should block the pipeline by default");
    assert(r.noPromoteReasonStage === "evidence", `stage ${r.noPromoteReasonStage}`);
    // draft card -> not_publishable skip -> only news sources remain -> no
    // fact-card-backed signal can be built -> no_signals (see comment above).
    assert(r.noPromoteEvidenceReason === "no_signals", `reason ${r.noPromoteEvidenceReason}`);
    assert(
      r.noPromoteSkippedHasNotPublishable === true,
      "skipped[] should record why the draft card was excluded",
    );
  });

  check("REAL CASE: verifyLlmResponse recommends exactly the candidate that clears both gates", () => {
    assert(r.combinedCandidateCount === 5, `count ${r.combinedCandidateCount}`);
    assert(r.combinedPassedCount === 5, `passed ${r.combinedPassedCount} (all 5 clear hard cuts)`);
    assert(r.combinedScoreCount === 5, `scores ${r.combinedScoreCount}`);
    assert(
      JSON.stringify(r.combinedRecommendedIds) === JSON.stringify(["candidate-01"]),
      `recommended ${JSON.stringify(r.combinedRecommendedIds)}, expected exactly candidate-01`,
    );
    assert(r.combinedRecommendedTop === 14, `top score ${r.combinedRecommendedTop}`);
  });
}

console.log("=== L2~L3 pipeline check ===\n");
for (const label of passes) console.log(`  PASS  ${label}`);
for (const failure of failures) console.log(`  FAIL  ${failure}`);
console.log(`\n${passes.length} passed, ${failures.length} failed`);
process.exit(failures.length === 0 ? 0 : 1);
