// L3 검증: live-topic-cutline-check (네트워크 없음, LLM 호출 없음)
//
// 검증 항목
//   1. tsc strict 타입체크
//   2. 하드 컷 10개 각각이 실제로 위반을 탐지하는가 (개별 유닛)
//   3. 정상 후보는 위반 0건으로 통과하는가
//   4. selfCheck 불일치가 정확히 식별되는가
//   5. **실전 검증**: Owner가 L2-8에서 실제로 받은 응답 2건을 그대로 넣는다
//      - 1회차 응답(숫자 회피, selfCheck 전부 true): 실제로는 통과해야 한다
//        (사실을 숨긴 건 콘텐츠 품질 문제이지 하드 컷 위반은 아님 — 이 구분 자체가 검증 대상)
//      - 2회차 evidence pack 버그 수정 후 3회차 응답(숫자 인용 정상): 통과해야 한다

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

const TARGET = "lib/editorial-v2/live-topic-cutline-check.ts";

check("target file exists", () => {
  assert(existsSync(path.join(ROOT, TARGET)), `missing ${TARGET}`);
});

check("typecheck passes", () => {
  typecheck(ROOT, [TARGET]);
});

const probe = `
import { verifyCandidate, verifyResponse } from "./live-topic-cutline-check.js";
import { loadCutlineConfig } from "./editorial-cutline.js";
import { loadSourceRegistry } from "./economic-source-registry.js";
import { buildEvidencePackFromLiveSources } from "./live-evidence-adapter.js";

const results: Record<string, any> = {};
const cutline = loadCutlineConfig();
const registry = loadSourceRegistry();

// evidence pack: 기준금리 3%(직전 2.75%, 변동 0.25%p) + 연합뉴스 1건. L2-7 샘플과 동일 구조.
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
  targetDurationSeconds: 45, rawHash: "raw-hash-1", normalizedHash: "normalized-hash-1",
});
results.adapterOk = adapted.ok;
const pack = adapted.ok ? adapted.pack : null;

// numbers[].numberId 실제 값 확인 (테스트 픽스처가 실제 ID 형식과 일치하는지)
results.numberIds = pack ? pack.numbers.map((n: any) => n.numberId) : [];
results.sourceIds = pack ? pack.sources.map((s: any) => s.sourceId) : [];

function makeBeat(scene: number, role: string, narration: string, sourceRefs: string[] = pack!.sources.map((s: any) => s.sourceId)): any {
  return { scene, role, narration, sceneVisualPrompt: "Flat vector scene, no visible text", sourceRefs };
}

const validSourceRefs = pack ? pack.sources.map((s: any) => s.sourceId) : [];
const validNumberRefs = pack ? pack.numbers.map((n: any) => n.numberId) : [];

// --- 정상 후보 (Owner 3회차 응답을 단순화 재현) ---
const goodCandidate: any = {
  candidateId: "candidate-01",
  title: "최근 한국은행 기준금리, 현재값만 보면 놓치는 변화",
  hookType: "named_mistake",
  hook: "기준금리 현재값만 보는 게 첫 번째 실수",
  sourceRefs: validSourceRefs,
  numberRefs: validNumberRefs,
  beats: cutline.sceneStructure.map((s: any) =>
    makeBeat(s.scene, s.role,
      s.role === "evidence_card" ? "한국은행은 8월 27일 기준금리를 2.75%에서 3%로 조정했다."
      : s.role === "twist" ? "핵심은 현재 3%만이 아니라, 직전 2.75%에서 3%로 바뀌었고 변화값이 0.25%라는 점이다."
      : s.role === "closing_disclaimer" ? cutline.disclaimerText
      : "일반 내레이션 텍스트")),
  closingDisclaimer: cutline.disclaimerText,
  selfCheck: { "HC-01": true, "HC-02": true, "HC-03": true, "HC-04": true, "HC-05": true,
    "HC-06": true, "HC-07": true, "HC-08": true, "HC-09": true, "HC-10": true },
};

if (pack) {
  const goodVerdict = verifyCandidate(goodCandidate, pack, cutline, registry);
  results.goodPassed = goodVerdict.passed;
  results.goodViolations = goodVerdict.violations.map((v: any) => v.id);
  results.goodMismatches = goodVerdict.selfCheckMismatches;
}

// --- HC-01 위반: 시점 토큰 없는 제목 ---
if (pack) {
  const noTemporal = { ...goodCandidate, title: "한국은행 기준금리 변화 이해하기" };
  const v = verifyCandidate(noTemporal, pack, cutline, registry);
  results.hc01Detected = v.violations.some((x: any) => x.id === "HC-01");
}

// --- HC-02 위반: 고유명사 없는 제목 ---
if (pack) {
  const noProperNoun = { ...goodCandidate, title: "오늘 금리가 바뀐 진짜 이유" };
  const v = verifyCandidate(noProperNoun, pack, cutline, registry);
  results.hc02Detected = v.violations.some((x: any) => x.id === "HC-02");
}

// --- HC-03 위반: 훅이 너무 김 ---
if (pack) {
  const longHook = { ...goodCandidate,
    hook: "이것은 정말정말 매우 매우 길고 긴 훅 문장으로 단어 수가 열다섯 개를 훌쩍 넘어가는 그런 문장입니다 절대로 짧지 않습니다" };
  const v = verifyCandidate(longHook, pack, cutline, registry);
  results.hc03Detected = v.violations.some((x: any) => x.id === "HC-03");
}

// --- HC-04 위반: 존재하지 않는 sourceRef ---
if (pack) {
  const badRef = { ...goodCandidate, sourceRefs: ["does-not-exist"] };
  const v = verifyCandidate(badRef, pack, cutline, registry);
  results.hc04Detected = v.violations.some((x: any) => x.id === "HC-04");
}

// --- HC-08 위반 (참조): 존재하지 않는 numberRef ---
if (pack) {
  const badNumberRef = { ...goodCandidate, numberRefs: ["number:does-not-exist:9"] };
  const v = verifyCandidate(badNumberRef, pack, cutline, registry);
  results.hc08RefDetected = v.violations.some((x: any) => x.id === "HC-08");
}

// --- HC-08 위반 (본문 숫자 불일치): narration에 근거 없는 숫자 ---
if (pack) {
  const inventedNumber = { ...goodCandidate,
    beats: goodCandidate.beats.map((b: any, i: number) =>
      i === 2 ? { ...b, narration: "한국은행은 기준금리를 9.99%로 올렸다." } : b) };
  const v = verifyCandidate(inventedNumber, pack, cutline, registry);
  results.hc08NumeralDetected = v.violations.some((x: any) => x.id === "HC-08");
}

// --- HC-05 위반: stale 근거만 참조 ---
if (pack) {
  const staleOnlyPack = { ...pack, sources: pack.sources.map((s: any) => ({ ...s, freshness: "stale" })) };
  const v = verifyCandidate(goodCandidate, staleOnlyPack, cutline, registry);
  results.hc05Detected = v.violations.some((x: any) => x.id === "HC-05");
}

// --- HC-06 위반: 금칙어 ---
if (pack) {
  const banned = { ...goodCandidate,
    beats: goodCandidate.beats.map((b: any, i: number) =>
      i === 0 ? { ...b, narration: "지금 무조건 오릅니다" } : b) };
  const v = verifyCandidate(banned, pack, cutline, registry);
  results.hc06Detected = v.violations.some((x: any) => x.id === "HC-06");
}

// --- HC-07 위반: 매수 권유 ---
if (pack) {
  const buySignal = { ...goodCandidate,
    beats: goodCandidate.beats.map((b: any, i: number) =>
      i === 0 ? { ...b, narration: "지금 사세요" } : b) };
  const v = verifyCandidate(buySignal, pack, cutline, registry);
  results.hc07Detected = v.violations.some((x: any) => x.id === "HC-07");
}

// --- HC-09 위반: 고지 문구 다름 (requireDisclaimer가 켜진 cutline에서만 검사) ---
if (pack) {
  const disclaimerRequiredCutline = {
    ...cutline,
    hardCut: { ...cutline.hardCut, requireDisclaimer: true },
  };
  const badDisclaimer = { ...goodCandidate, closingDisclaimer: "투자 유의하세요" };
  const v = verifyCandidate(badDisclaimer, pack, disclaimerRequiredCutline, registry);
  results.hc09Detected = v.violations.some((x: any) => x.id === "HC-09");
}

// --- HC-10 위반: 텍스트 렌더 지시 ---
if (pack) {
  const bakedText = { ...goodCandidate,
    beats: goodCandidate.beats.map((b: any, i: number) =>
      i === 2 ? { ...b, sceneVisualPrompt: "화이트보드에 '3%'라는 숫자를 텍스트로 표시" } : b) };
  const v = verifyCandidate(bakedText, pack, cutline, registry);
  results.hc10Detected = v.violations.some((x: any) => x.id === "HC-10");
}

// --- 장면 구조 위반: 순서/개수 다름 ---
if (pack) {
  const wrongScenes = { ...goodCandidate, beats: goodCandidate.beats.slice(0, 6) };
  const v = verifyCandidate(wrongScenes, pack, cutline, registry);
  results.sceneStructureDetected = !v.passed;
}

// --- selfCheck 불일치 탐지: 실제로는 실패인데 모델이 true라고 주장 ---
if (pack) {
  const lyingSelfCheck = { ...goodCandidate, title: "한국은행 기준금리 변화 이해하기",
    selfCheck: { ...goodCandidate.selfCheck, "HC-01": true } };
  const v = verifyCandidate(lyingSelfCheck, pack, cutline, registry);
  results.mismatchDetected = v.selfCheckMismatches.includes("HC-01");
}

// --- hookType 정규화: 모델이 영문 코드 대신 프롬프트에 보여준 한글 라벨을 그대로 반환 ---
// 실제 Owner 3회차 응답 5건 전부가 "명명된 실수형" 같은 한글 라벨을 반환했다.
if (pack) {
  const koreanHookType = { ...goodCandidate, hookType: "정보 격차형" };
  const v = verifyCandidate(koreanHookType, pack, cutline, registry);
  results.koreanHookTypeAccepted = !v.violations.some((x: any) => x.id === "HC-06" && x.detail.includes("hookType"));
}
// 라벨이 아닌 임의의 한글 문자열은 여전히 거부돼야 한다 (느슨한 부분 문자열 매칭이 아님을 확인)
if (pack) {
  const fakeHookType = { ...goodCandidate, hookType: "아무말이나 정보 격차형처럼 보이는 문장" };
  const v = verifyCandidate(fakeHookType, pack, cutline, registry);
  results.fakeHookTypeRejected = v.violations.some((x: any) => x.id === "HC-06" && x.detail.includes("hookType"));
}

// --- 실제 Owner 1회차 응답 재현: 숫자를 회피했지만 selfCheck는 전부 true ---
// (title/hook/beats는 실제로 받은 응답을 단순화 재현. 숫자를 안 쓴 것 자체는 하드 컷
//  위반이 아니다 — "구체적 수치"는 S-01 점수 문제이지 HC가 아니다. 이 구분이 맞는지 확인.)
if (pack) {
  const avoidantCandidate: any = {
    candidateId: "candidate-avoidant",
    title: "최근 한국은행 기준금리, 숫자 하나만 보면 놓치는 변화",
    hookType: "real_reason",
    hook: "기준금리 숫자만 보면 안 되는 진짜 이유",
    sourceRefs: validSourceRefs,
    numberRefs: validNumberRefs,
    beats: cutline.sceneStructure.map((s: any) =>
      makeBeat(s.scene, s.role,
        s.role === "evidence_card" ? "한국은행은 팔월 이십칠일 기준금리를 3%로 결정했다."
        : s.role === "closing_disclaimer" ? cutline.disclaimerText
        : "일반 내레이션 텍스트, 숫자 없음")),
    closingDisclaimer: cutline.disclaimerText,
    selfCheck: { "HC-01": true, "HC-02": true, "HC-03": true, "HC-04": true, "HC-05": true,
      "HC-06": true, "HC-07": true, "HC-08": true, "HC-09": true, "HC-10": true },
  };
  const v = verifyCandidate(avoidantCandidate, pack, cutline, registry);
  results.avoidantPassed = v.passed;
  results.avoidantViolations = v.violations.map((x: any) => x.id);
}

// --- verifyResponse: 여러 후보 일괄 ---
if (pack) {
  const response = { candidates: [goodCandidate, { ...goodCandidate, candidateId: "candidate-02", title: "제목만 문제 있는 후보" }] };
  const responseVerdict = verifyResponse(response, pack, cutline, registry);
  results.responseCandidateCount = responseVerdict.candidateCount;
  results.responsePassedCount = responseVerdict.passedCount;
}

process.stdout.write(JSON.stringify(results));
`;

let r = null;
check("runtime probe executes", () => {
  r = runTsProbe({
    root: ROOT,
    probeDir: "lib/editorial-v2",
    probeSource: probe,
    extraJsFiles: ["live-topic-cutline-check.js", "live-evidence-adapter.js", "live-topic-prompt.js"],
  });
});

if (r) {
  check("evidence pack builds successfully for the fixture", () => {
    assert(r.adapterOk === true, "fixture evidence pack failed to build");
    assert(r.numberIds.length === 3, `expected 3 number ids, got ${r.numberIds.length}`);
  });

  check("a well-formed candidate passes with zero violations", () => {
    assert(r.goodPassed === true, `violations: ${JSON.stringify(r.goodViolations)}`);
    assert(r.goodMismatches.length === 0, `unexpected mismatches: ${JSON.stringify(r.goodMismatches)}`);
  });

  check("HC-01 detects missing temporal token", () => {
    assert(r.hc01Detected === true, "did not flag a title with no temporal token");
  });

  check("HC-02 detects missing proper noun", () => {
    assert(r.hc02Detected === true, "did not flag a title with no proper noun");
  });

  check("HC-03 detects an overlong hook", () => {
    assert(r.hc03Detected === true, "did not flag a hook over the word/char limit");
  });

  check("HC-04 detects a dangling sourceRef", () => {
    assert(r.hc04Detected === true, "did not flag a sourceRef absent from the evidence pack");
  });

  check("HC-08 detects a dangling numberRef", () => {
    assert(r.hc08RefDetected === true, "did not flag a numberRef absent from the evidence pack");
  });

  check("HC-08 detects an invented numeral not backed by numbers[]", () => {
    assert(r.hc08NumeralDetected === true, "did not flag a narration numeral absent from evidence");
  });

  check("HC-05 detects when every referenced source is stale", () => {
    assert(r.hc05Detected === true, "did not flag an all-stale reference set");
  });

  check("HC-06 detects a banned phrase", () => {
    assert(r.hc06Detected === true, "did not flag banned phrase usage");
  });

  check("HC-07 detects a buy-signal directive", () => {
    assert(r.hc07Detected === true, "did not flag a buy directive");
  });

  check("HC-09 detects a mismatched disclaimer", () => {
    assert(r.hc09Detected === true, "did not flag a disclaimer that doesn't match verbatim");
  });

  check("HC-10 detects a baked-in text rendering instruction", () => {
    assert(r.hc10Detected === true, "did not flag a scene prompt requesting rendered text");
  });

  check("scene structure mismatch is detected", () => {
    assert(r.sceneStructureDetected === true, "did not flag a beat count mismatch");
  });

  check("hookType accepts the exact Korean label the prompt showed the model", () => {
    assert(r.koreanHookTypeAccepted === true, "Korean label prefix was rejected");
  });

  check("hookType rejects text that merely resembles a label", () => {
    assert(r.fakeHookTypeRejected === true, "loose match accepted a non-label string");
  });

  check("selfCheck mismatch is identified when the model lies", () => {
    assert(r.mismatchDetected === true, "did not detect a false selfCheck claim");
  });

  check("REAL CASE: number-avoidant candidate passes hard cuts (a content-quality issue, not a violation)", () => {
    assert(
      r.avoidantPassed === true,
      `expected pass, got violations: ${JSON.stringify(r.avoidantViolations)}`,
    );
  });

  check("verifyResponse aggregates multiple candidates", () => {
    assert(r.responseCandidateCount === 2, `count ${r.responseCandidateCount}`);
    assert(r.responsePassedCount === 1, `passed ${r.responsePassedCount}, expected 1`);
  });
}

console.log("=== L3 cutline verifier check ===\n");
for (const label of passes) console.log(`  PASS  ${label}`);
for (const failure of failures) console.log(`  FAIL  ${failure}`);
console.log(`\n${passes.length} passed, ${failures.length} failed`);
process.exit(failures.length === 0 ? 0 : 1);
