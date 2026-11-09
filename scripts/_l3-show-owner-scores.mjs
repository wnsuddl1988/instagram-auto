import { readFileSync, writeFileSync } from "node:fs";
import { runTsProbe } from "./_editorial-v2-ts-probe.mjs";

const ROOT = process.cwd();
const ownerResponse = JSON.parse(readFileSync(new URL("./_l3-owner-response-fixture.json", import.meta.url), "utf8"));

const probe = `
import { scoreAndRankCandidates } from "./live-topic-score.js";
import { loadCutlineConfig } from "./editorial-cutline.js";
import { loadSourceRegistry } from "./economic-source-registry.js";
import { buildEvidencePackFromLiveSources } from "./live-evidence-adapter.js";

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
if (!adapted.ok) {
  process.stdout.write(JSON.stringify({ error: adapted.reason }));
} else {
  const ownerResponse = ${JSON.stringify(ownerResponse)};
  const scores = scoreAndRankCandidates(ownerResponse.candidates, adapted.pack, cutline, registry);
  process.stdout.write(JSON.stringify(scores));
}
`;

const scores = runTsProbe({
  root: ROOT, probeDir: "lib/editorial-v2", probeSource: probe,
  extraJsFiles: ["live-topic-score.js", "live-topic-cutline-check.js", "live-evidence-adapter.js", "live-topic-prompt.js"],
});

console.log("=== Owner 3회차 응답 5건 채점 결과 (내림차순) ===\n");
for (const s of scores) {
  console.log(`${s.candidateId}  총점 ${s.total}/${s.totalPossible}  (저신뢰 항목 포함: ${s.hasLowConfidenceItems})`);
  for (const item of s.items) {
    const pts = item.points === null ? "—" : item.points;
    console.log(`  ${item.id} [${pts}] (${item.confidence})  ${item.rationale}`);
  }
  console.log();
}
