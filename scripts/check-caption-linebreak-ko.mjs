#!/usr/bin/env node
/**
 * 한국어 자막 줄바꿈 회귀 테스트 — scripts/_caption-linebreak-ko.mjs.
 *
 * 사례는 실제로 잘못 끊겼던 자막(황소특보 10편 등)과 Owner 지적에서 가져왔다.
 * Owner가 자막 줄바꿈 수정을 요청하면 **그 사례를 여기에 한 줄 추가**하고 규칙을 고친다
 * — 같은 실수가 다시 나오지 않게 하고, 수정도 빨라진다.
 *
 * 사용: node scripts/check-caption-linebreak-ko.mjs
 */

import { splitPenalty, wrapToLines, wrapToLinesScored, segmentWordsIntoBlocks, textWidthRatio } from "./_caption-linebreak-ko.mjs";

const FONT = 84; // 조립기 CAPTION_FONT_SIZE(배치 v2)
const WIDTH = 760; // 조립기 CAPTION_MAX_WIDTH_PX(배치 v2)

let passed = 0;
let failed = 0;
function check(name, fn) {
  try {
    fn();
    passed += 1;
    console.log(`  PASS  ${name}`);
  } catch (error) {
    failed += 1;
    console.log(`  FAIL  ${name}: ${error.message}`);
  }
}
function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

// 1) 절대 끊으면 안 되는 자리 (왼쪽 어절, 오른쪽 어절)
const FORBIDDEN_PAIRS = [
  ["11월", "2일부터"],      // 10편 s1: "다들, 11월 / 2일부터"
  ["10월", "22일까지"],
  ["5천", "원이"],          // 10편 s6: "주가가 5천 / 원이 되면"
  ["1만", "원"],
  ["3", "년"],
  ["결론이", "아니라"],     // 10편 s12: "결국 태그는 결론이 / 아니라"
  ["한", "달"],             // 8편: "한 / 달 이후"
  ["못", "받게"],           // 15편: "못 / 받게"
  ["걸리는", "게"],         // Owner 예시: "오래걸리는 / 게"
  ["할", "수"],
  ["6만", "8천480원이야"], // 금박사 10편: "하루 6만 / 8천480원이야"(한 숫자가 갈림)
  ["우리", "지갑을"],       // 부엉박사 CTA: "다음 편엔 우리 / 지갑을"
  ["내", "지갑"],
  ["늘고", "있는지"],       // 보조용언 앞은 금지는 아니지만 강한 벌점(아래 3번에서 확인)
];
for (const [l, r] of FORBIDDEN_PAIRS.slice(0, -1)) {
  check(`금지: "${l} / ${r}"`, () => assert(!Number.isFinite(splitPenalty(l, r)), `penalty=${splitPenalty(l, r)}`));
}

// 2) 끊기 좋은 자리가 맨 명사 뒤보다 벌점이 낮아야 함
check("쉼표 뒤 < 맨 명사 뒤", () => assert(splitPenalty("다들,", "11월") < splitPenalty("자본", "효율"), "order"));
check("전환어 앞 < 맨 명사 뒤", () => assert(splitPenalty("모르면", "그래서") < splitPenalty("업종", "안의"), "order"));
check("연결어미 뒤(-면) < 맨 명사 뒤", () => assert(splitPenalty("공시하면", "1년간") < splitPenalty("기업가치", "제고"), "order"));
check("대등 연결 '쉽고 / 빠르게'는 조사 뒤보다 나쁨", () => assert(splitPenalty("쉽고", "빠르게") > splitPenalty("소식을", "쉽고"), "order"));

// 2-1) 오판 방지: '줄다'의 '줄'은 의존명사가 아니다(10편 "전환사채 발행은 / 줄 거라는")
check("허용: \"발행은 / 줄\"(줄다)", () => assert(Number.isFinite(splitPenalty("발행은", "줄")), "forbidden"));

// 3) 보조용언 앞은 강한 벌점
check("보조용언 앞 '늘고 / 있는지' 벌점 ≥ 20", () => assert(splitPenalty("늘고", "있는지") >= 20, `${splitPenalty("늘고", "있는지")}`));

// 4) 실제 자막 줄바꿈 결과 (2줄 이내, 기대하는 두 줄)
const WRAP_CASES = [
  // [원문, 금지 경계들(이 두 어절 사이에서 줄이 나뉘면 실패)]
  ["다들, 11월 2일부터 증권앱에", [["11월", "2일부터"]]],
  ["주가가 5천 원이 되면 1배야", [["5천", "원이"]]],
  ["저PBR은 업종 안의 순위로 정해", [["업종", "안의"]]],
  ["사업 흐름은 실적이 늘고 있는지", [["늘고", "있는지"]]],
  ["10월 22일까지 PBR 개선계획을 담은", [["10월", "22일까지"]]],
  ["다음 편엔 우리 지갑을", [["우리", "지갑을"]]],
];
for (const [text, bad] of WRAP_CASES) {
  check(`줄바꿈: "${text}"`, () => {
    const lines = wrapToLines(text, FONT, WIDTH);
    assert(lines, "폭 안에 들어가는 2줄 분할이 없음(null)");
    assert(lines.length <= 2, `3줄 이상: ${JSON.stringify(lines)}`);
    for (const line of lines) {
      assert(textWidthRatio(line) * FONT <= WIDTH, `폭 초과 ${Math.round(textWidthRatio(line) * FONT)}px: ${line}`);
    }
    if (lines.length === 2) {
      const leftLast = lines[0].split(" ").at(-1);
      const rightFirst = lines[1].split(" ")[0];
      for (const [l, r] of bad) {
        assert(!(leftLast === l && rightFirst === r), `금지 경계에서 끊김: ${JSON.stringify(lines)}`);
      }
    }
  });
}

// 5) 폭을 넘는 긴 자막의 블록 분할
const blockScore = (slice) => wrapToLinesScored(slice.join(" "), FONT, WIDTH)?.score ?? null;
const SEGMENT_CASES = [
  ["안녕, 투자 소식을 쉽고 빠르게 정리해주는 황소특보야", [["쉽고", "빠르게"]]],
  ["그래서 회사들이 자본 효율 계획을 서두르고", [["자본", "효율"]]],
  ["결국 태그는 결론이 아니라 질문이야", [["결론이", "아니라"]]],
  ["회사 쪽 절차도 있어 10월 22일까지 PBR 개선계획을 담은 기업가치 제고 계획을 공시하면 1년간 빠져", [["10월", "22일까지"], ["기업가치", "제고"]]],
  ["다만 6년 내내 하위권이었던 회사는 공시를 했더라도 명단에 올라", [["6년", "내내"]]],
];
for (const [text, bad] of SEGMENT_CASES) {
  check(`블록 분할: "${text}"`, () => {
    const words = text.split(" ");
    const ranges = segmentWordsIntoBlocks(words, blockScore);
    assert(ranges, "분할 불가");
    const blocks = ranges.map(([a, b]) => words.slice(a, b));
    for (const block of blocks) assert(block.length >= 2 || words.length === 1, `한 어절짜리 블록: ${JSON.stringify(blocks)}`);
    for (let i = 1; i < ranges.length; i += 1) {
      const l = words[ranges[i][0] - 1];
      const r = words[ranges[i][0]];
      for (const [bl, br] of bad) assert(!(l === bl && r === br), `금지 경계에서 블록이 나뉨: ${JSON.stringify(blocks.map((b) => b.join(" ")))}`);
    }
    // 블록 안 줄바꿈도 금지 경계를 지키는지
    for (const block of blocks) {
      const lines = wrapToLines(block.join(" "), FONT, WIDTH);
      if (lines && lines.length === 2) {
        const leftLast = lines[0].split(" ").at(-1);
        const rightFirst = lines[1].split(" ")[0];
        for (const [bl, br] of bad) assert(!(leftLast === bl && rightFirst === br), `블록 안에서 금지 경계: ${JSON.stringify(lines)}`);
      }
    }
    console.log(`         → ${blocks.map((b) => (wrapToLines(b.join(" "), FONT, WIDTH) ?? [b.join(" ")]).join(" / ")).join("  ||  ")}`);
  });
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
