#!/usr/bin/env node
/**
 * _topic-pool.mjs 자체 테스트(네트워크·비밀값 없음). 사용: node scripts/check-topic-pool-selftest.mjs [실제 뉴스 결과 파일 경로]
 * 실제 파일을 주면 파싱 건수가 기사 블록 수와 일치하는지도 확인한다(스모크).
 */
import fs from "node:fs";
import { buildPoolMarkdown, dedupeItems, parseNewsRunnerText } from "./_topic-pool.mjs";

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

const SAMPLE = `헤더 줄
──────── ① 제도 변경·시행 ────────
[다음 달부터 달라지는] 첫 번째 기사 제목
  발행: 2026-10-01T09:50:00.000Z | 파이낸셜뉴스 (T2)
  링크: https://example.com/a?x=1

[시행령 개정 국민] 두 번째 | 파이프 포함
  발행: 2026-09-01T09:50:00.000Z | 국민일보 (T2)
  링크: https://example.com/b

──────── ② 내 돈 계산법 ────────
[세액공제 확대] 첫 번째 기사 제목
  발행: 2026-10-01T09:50:00.000Z | 파이낸셜뉴스 (T2)
  링크: https://example.com/a?x=2

[연금 수령액] 날짜 없는 기사
  발행: invalid | 매체 (T2)
  링크: https://example.com/c
`;

const items = parseNewsRunnerText(SAMPLE, "sample");
check("기사 4건 파싱, 그룹·검색어·매체·링크가 붙는다", () => {
  assert(items.length === 4, `items ${items.length}`);
  assert(items[0].group === "① 제도 변경·시행" && items[0].keyword === "다음 달부터 달라지는", JSON.stringify(items[0]));
  assert(items[0].outlet === "파이낸셜뉴스" && items[0].link === "https://example.com/a?x=1", JSON.stringify(items[0]));
  assert(items[2].group === "② 내 돈 계산법", items[2].group);
});
check("같은 링크(쿼리 제외)·같은 제목은 하나로 합치고 검색어를 모은다", () => {
  const d = dedupeItems(items);
  assert(d.length === 3, `dedupe ${d.length}`);
  assert(d[0].keywords.size === 2, `keywords ${[...d[0].keywords]}`);
});
check("풀 표: 건수 요약·오래됨 표시·파이프 이스케이프·날짜 불명 처리", () => {
  const nowMs = Date.parse("2026-10-01T12:00:00Z");
  const { md, count, buckets } = buildPoolMarkdown({ items, nowMs, title: "테스트" });
  assert(count === 3, `count ${count}`);
  assert(buckets.today === 1 && buckets.old === 1 && buckets.unknown === 1, JSON.stringify(buckets));
  assert(md.includes("⚠오래됨") && md.includes("두 번째 / 파이프 포함"), md);
  assert(md.indexOf("첫 번째 기사 제목") < md.indexOf("두 번째"), "날짜 내림차순이어야 함");
});

const real = process.argv[2];
if (real && fs.existsSync(real)) {
  check(`실제 파일 스모크(${real}): 기사 블록 수 = 파싱 건수`, () => {
    const text = fs.readFileSync(real, "utf8");
    const blocks = (text.match(/^\[[^\]]+\]\s+.+\n\s+발행:/gm) ?? []).length;
    const parsed = parseNewsRunnerText(text, "real").length;
    assert(blocks > 0 && blocks === parsed, `blocks ${blocks} parsed ${parsed}`);
    console.log(`        (기사 ${parsed}건, 중복 제외 ${dedupeItems(parseNewsRunnerText(text, "real")).length}건)`);
  });
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
