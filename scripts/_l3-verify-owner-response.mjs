// Owner가 실제로 L2-7 프롬프트에 넣어 받은 3회차 LLM 응답 전체(5개 후보)를
// L3 검증기에 그대로 통과시켜본다. 합성 픽스처가 아니라 실제 응답이 대상.

import { readFileSync } from "node:fs";
import { runTsProbe } from "./_editorial-v2-ts-probe.mjs";

const ROOT = process.cwd();
const ownerResponse = JSON.parse(
  readFileSync(new URL("./_l3-owner-response-fixture.json", import.meta.url), "utf8"),
);

const probe = `
import { verifyResponse } from "./live-topic-cutline-check.js";
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
  citations: [
    { id: "cit-1", sourceName: "한국은행 ECOS", sourceUrl: "https://ecos.bok.or.kr/#/Short/722Y001", publishedDate: "2026-08-27" },
    { id: "cit-2", sourceName: "한국은행 통화정책방향 결정회의 — 기준금리 변경 이력", sourceUrl: "https://www.bok.or.kr/portal/singl/baseRate/list.do?dataSeCd=01&menuNo=200643", publishedDate: "2026-08-27" },
  ],
  sourceName: "한국은행 ECOS — 기준금리", sourceUrl: "https://ecos.bok.or.kr/#/Short/722Y001",
  publishedDate: "2026-08-27", dataPeriod: "2026년 8월", indicatorName: "한국은행 기준금리",
  currentValue: "3.00%", previousValue: "2.75%", changeValue: "+0.25%p", changeRate: "+9.09%", unit: "%",
  currentNumericValue: 3.0, previousNumericValue: 2.75, changeNumericValue: 0.25,
  comparisonType: "previous_release",
  interpretation: "한국은행이 2026년 8월 기준금리를 2.75%에서 3.00%로 +0.25%p 조정했다.",
  cautionNote: "기준금리 변경은 발표 시점 기준이며, 향후 추가 변동 가능성은 이 수치에 반영되어 있지 않다.",
  allowedClaims: ["2026년 8월 기준금리는 3.00%다."],
  blockedClaims: ["금리 급등락", "폭등", "폭락", "지금 대출", "지금 투자", "금리 전망"],
  contentCategory: "source_based_finance",
};
const adapted = buildEvidencePackFromLiveSources({
  projectId: "shorts-editorial-os-v2", newsItems: [news], factCards: [card], cutline,
  researchCutoffDate: "2026-09-16", domain: "생활금융·부채",
  audience: "30대 직장인, 첫 신용대출·카드 사용 경험이 있는 시청자",
  targetDurationSeconds: 45, rawHash: "raw-hash-owner", normalizedHash: "normalized-hash-owner",
});

if (!adapted.ok) {
  process.stdout.write(JSON.stringify({ ok: false, reason: adapted.reason }));
} else {
  const ownerResponse = ${JSON.stringify(ownerResponse)};
  const verdict = verifyResponse(ownerResponse, adapted.pack, cutline, registry);
  process.stdout.write(JSON.stringify({ ok: true, verdict }));
}
`;

const result = runTsProbe({
  root: ROOT,
  probeDir: "lib/editorial-v2",
  probeSource: probe,
  extraJsFiles: ["live-topic-cutline-check.js", "live-evidence-adapter.js"],
});

if (!result.ok) {
  console.log(`BLOCKED: ${result.reason}`);
  process.exit(1);
}

const { verdict } = result;
console.log(`=== L3 verification of Owner's actual 3rd-round LLM response ===\n`);
console.log(`candidates: ${verdict.candidateCount}, passed: ${verdict.passedCount}\n`);
for (const v of verdict.verdicts) {
  console.log(`${v.passed ? "PASS" : "FAIL"}  ${v.candidateId}`);
  for (const violation of v.violations) console.log(`       - ${violation.id}: ${violation.detail}`);
  if (v.selfCheckMismatches.length > 0) {
    console.log(`       selfCheck mismatches: ${v.selfCheckMismatches.join(", ")}`);
  }
}
