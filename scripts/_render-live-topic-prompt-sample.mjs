// L2-7 샘플 출력: 실제 라이브 FactCard(기준금리 3.00%, 2026-08-27 발표)로
// buildLiveTopicPrompt가 만드는 프롬프트 전문을 파일로 저장한다.
// 뉴스 근거는 L2-3에서 확인한 실제 응답 구조를 반영한 대표 예시 1건이며,
// 자동 연결(수집→조립)은 L2-8 통합 리허설에서 확인 예정.

import { writeFileSync } from "node:fs";
import { runTsProbe } from "./_editorial-v2-ts-probe.mjs";

const ROOT = process.cwd();

const probe = `
import { buildLiveTopicPrompt } from "./live-topic-prompt.js";
import { loadCutlineConfig } from "./editorial-cutline.js";
import { buildEvidencePackFromLiveSources } from "./live-evidence-adapter.js";

const cutline = loadCutlineConfig();

const news: any = {
  title: "가계부채 역대 최대 경신…리볼빙 잔액도 3개월 연속 증가",
  description: "요약",
  link: "https://n.news.naver.com/1",
  originallink: "https://www.yna.co.kr/view/AKR20260915",
  publishedAt: "2026-09-15T09:00:00.000Z",
  publisherTier: "T2",
  publisherName: "연합뉴스",
  canonicalUrl: "yna.co.kr/view/AKR20260915",
};

const card: any = {
  id: "fc-base-rate-202608",
  isMock: false,
  isPublishable: true,
  primarySourceProviderId: "provider-ecos-live",
  citations: [
    {
      id: "cit-1", sourceName: "한국은행 ECOS",
      sourceUrl: "https://ecos.bok.or.kr/#/Short/722Y001",
      publishedDate: "2026-08-27",
    },
    {
      id: "cit-2", sourceName: "한국은행 통화정책방향 결정회의 — 기준금리 변경 이력",
      sourceUrl: "https://www.bok.or.kr/portal/singl/baseRate/list.do?dataSeCd=01&menuNo=200643",
      publishedDate: "2026-08-27",
    },
  ],
  sourceName: "한국은행 ECOS — 기준금리",
  sourceUrl: "https://ecos.bok.or.kr/#/Short/722Y001",
  publishedDate: "2026-08-27",
  dataPeriod: "2026년 8월",
  indicatorName: "한국은행 기준금리",
  currentValue: "3.00%", previousValue: "2.75%",
  changeValue: "+0.25%p", changeRate: "+9.09%", unit: "%",
  currentNumericValue: 3.0,
  previousNumericValue: 2.75,
  changeNumericValue: 0.25,
  comparisonType: "previous_release",
  interpretation: "한국은행이 2026년 8월 기준금리를 2.75%에서 3.00%로 +0.25%p 조정했다.",
  cautionNote: "기준금리 변경은 발표 시점 기준이며, 향후 추가 변동 가능성은 이 수치에 반영되어 있지 않다.",
  allowedClaims: [
    "2026년 8월 기준금리는 3.00%다.",
    "직전 기준금리 대비 +0.25%p 변경됐다.",
    "한국은행이 2026-08-27 기준금리를 결정했다.",
  ],
  blockedClaims: ["금리 급등락", "폭등", "폭락", "지금 대출", "지금 투자", "금리 전망"],
  contentCategory: "source_based_finance",
};

const adapted = buildEvidencePackFromLiveSources({
  projectId: "shorts-editorial-os-v2",
  newsItems: [news],
  factCards: [card],
  cutline,
  researchCutoffDate: "2026-09-16",
  domain: "생활금융·부채",
  audience: "30대 직장인, 첫 신용대출·카드 사용 경험이 있는 시청자",
  targetDurationSeconds: 45,
  rawHash: "sample-raw-hash",
  normalizedHash: "sample-normalized-hash-202608",
});

if (!adapted.ok) {
  process.stdout.write(JSON.stringify({ ok: false, reason: adapted.reason, detail: adapted.detail }));
} else {
  const pkg = buildLiveTopicPrompt({
    projectId: "shorts-editorial-os-v2",
    evidencePack: adapted.pack,
    cutline,
    blockedClaims: adapted.blockedClaims,
    candidateCount: 5,
    audience: "30대 직장인, 첫 신용대출·카드 사용 경험이 있는 시청자",
  });
  process.stdout.write(JSON.stringify({ ok: true, packageId: pkg.packageId, instructions: pkg.instructions }));
}
`;

const result = runTsProbe({
  root: ROOT,
  probeDir: "lib/editorial-v2",
  probeSource: probe,
  extraJsFiles: ["live-topic-prompt.js", "live-evidence-adapter.js"],
});

if (!result.ok) {
  console.log(`BLOCKED: ${result.reason} — ${result.detail}`);
  process.exit(1);
}

const outPath = ROOT + "/_ai/SHORTS_EDITORIAL_OS_V2_L2_7_SAMPLE_PROMPT.md";
const content = [
  "# L2-7 — live-topic-prompt 샘플 출력",
  "",
  "Updated: 2026-09-16 KST",
  `packageId: \`${result.packageId}\``,
  "",
  "실제 라이브 ECOS 데이터(기준금리 3.00%, 2026-08-27 발표)와 예시 뉴스 1건으로",
  "`buildLiveTopicPrompt`가 생성한 프롬프트 전문. 이 텍스트를 그대로 LLM에 복사해 사용한다.",
  "",
  "뉴스 근거는 L2-3에서 확인한 실제 응답 구조를 반영한 대표 예시이며, 자동 연결(수집→조립)은",
  "`L2-8` 통합 리허설에서 확인 예정.",
  "",
  "---",
  "",
  "```text",
  result.instructions,
  "```",
].join("\n");
writeFileSync(outPath, content, "utf8");
console.log(`OK — saved to ${outPath}`);
