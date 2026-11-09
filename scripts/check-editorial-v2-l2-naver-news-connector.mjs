// L2-2 검증: 네이버 뉴스 커넥터 (네트워크 없음, mock transport)
//
// 검증 항목
//   1. tsc strict 타입체크
//   2. 요청 파라미터 검증 (display/start 상한, start+display-1 <= 1000)
//   3. HTML 태그·엔티티 제거
//   4. RFC822 → ISO 변환, 파싱 실패 시 null (날짜 날조 금지)
//   5. URL 정규화 및 중복 제거
//   6. T1/T2/T3 분리 — T3는 evidence가 아닌 hint 버킷으로
//   7. 키워드 부분 실패 허용
//   8. 다중 키워드 병합 시 교차 중복 제거

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

const TARGET = "lib/source-facts/naver-news-connector.ts";

check("target file exists", () => {
  assert(existsSync(path.join(ROOT, TARGET)), `missing ${TARGET}`);
});

check("typecheck passes", () => {
  typecheck(ROOT, [TARGET]);
});

const probe = `
import {
  buildNaverNewsRequest, NaverNewsRequestError,
  stripNaverMarkup, parseRfc822ToIso, canonicalizeUrl,
  normalizeNaverNewsResponse, collectNaverNewsForKeywords,
  mergeNaverNewsResults, createNaverNewsMockTransport,
  NAVER_NEWS_ENV_NAMES,
} from "./naver-news-connector.js";
import { loadSourceRegistry } from "../editorial-v2/economic-source-registry.js";

const results: Record<string, any> = {};
const registry = loadSourceRegistry();

const tryCatch = (fn: () => unknown) => {
  try { fn(); return "NO_THROW"; } catch { return "THREW"; }
};

// --- request validation ---
results.envNames = [...NAVER_NEWS_ENV_NAMES];
results.defaultRequest = buildNaverNewsRequest("기준금리");
results.shortKeyword = tryCatch(() => buildNaverNewsRequest("금"));
results.blankKeyword = tryCatch(() => buildNaverNewsRequest("   "));
results.displayTooBig = tryCatch(() => buildNaverNewsRequest("금리", { display: 101 }));
results.displayZero = tryCatch(() => buildNaverNewsRequest("금리", { display: 0 }));
results.startTooBig = tryCatch(() => buildNaverNewsRequest("금리", { start: 1001 }));
results.windowOverflow = tryCatch(() =>
  buildNaverNewsRequest("금리", { display: 100, start: 950 }));
results.windowEdgeOk = tryCatch(() =>
  buildNaverNewsRequest("금리", { display: 100, start: 901 }));
results.trimsKeyword = buildNaverNewsRequest("  리볼빙  ").keyword;

// --- markup stripping ---
results.stripBold = stripNaverMarkup("<b>기준금리</b> 동결");
results.stripEntities = stripNaverMarkup("금리 &amp; 물가 &quot;인상&quot; &lt;속보&gt;");
results.stripNumeric = stripNaverMarkup("&#39;리볼빙&#39; 주의");
results.stripWhitespace = stripNaverMarkup("  여러   공백\\n줄바꿈  ");

// --- date parsing ---
results.rfc822Ok = parseRfc822ToIso("Mon, 15 Sep 2026 09:30:00 +0900");
results.rfc822Garbage = parseRfc822ToIso("어제쯤");
results.rfc822Empty = parseRfc822ToIso("   ");

// --- url canonicalization ---
results.canonBasic = canonicalizeUrl("https://www.yna.co.kr/view/AKR123");
results.canonTrailing = canonicalizeUrl("https://yna.co.kr/view/AKR123/");
results.canonQueryOrder1 = canonicalizeUrl("https://yna.co.kr/v?b=2&a=1");
results.canonQueryOrder2 = canonicalizeUrl("https://yna.co.kr/v?a=1&b=2");
results.canonFragment = canonicalizeUrl("https://yna.co.kr/view/AKR123#section");
results.canonBad = canonicalizeUrl("not a url");
results.canonScheme = canonicalizeUrl("ftp://yna.co.kr/x");

// --- normalization ---
const mkItem = (over: Record<string, string>) => ({
  title: "제목", originallink: "https://www.yna.co.kr/view/1",
  link: "https://n.news.naver.com/1", description: "요약",
  pubDate: "Mon, 15 Sep 2026 09:00:00 +0900", ...over,
});

const response = {
  total: 42, start: 1, display: 8,
  items: [
    mkItem({ title: "<b>기준금리</b> 동결", originallink: "https://www.yna.co.kr/view/1" }),
    mkItem({ title: "한국경제 기사", originallink: "https://www.hankyung.com/article/2" }),
    // 같은 기사, 쿼리 순서와 트레일링 슬래시만 다름
    mkItem({ title: "중복 기사", originallink: "https://yna.co.kr/view/1/" }),
    mkItem({ title: "블로그 글", originallink: "https://someone.tistory.com/9" }),
    mkItem({ title: "날짜 깨짐", originallink: "https://www.mk.co.kr/a/3", pubDate: "없음" }),
    mkItem({ title: "링크 없음", originallink: "", link: "" }),
    mkItem({ title: "", originallink: "https://www.mk.co.kr/a/4" }),
    mkItem({ title: "MBC 기사", originallink: "https://imnews.imbc.com/news/5" }),
  ],
};

const normalized = normalizeNaverNewsResponse(response as any, registry, "기준금리");
results.normItemCount = normalized.items.length;
results.normTiers = normalized.items.map((i: any) => i.publisherTier);
results.normPublishers = normalized.items.map((i: any) => i.publisherName);
results.normUntiered = normalized.untieredItems.map((i: any) => i.title);
results.normDropped = normalized.dropped.map((d: any) => d.reason).sort();
results.normTotal = normalized.totalReported;
results.normTitleClean = normalized.items[0].title;
results.normIsoDate = normalized.items[0].publishedAt;

// --- keyword-level partial failure ---
const fixtures = new Map<string, any>([
  ["기준금리", { ok: true, response }],
  ["리볼빙", { ok: false, reason: "rate limited" }],
]);
const transport = createNaverNewsMockTransport(fixtures);
const multi = await collectNaverNewsForKeywords(
  ["기준금리", "리볼빙", "없는키워드", "금"],
  transport, registry,
);
results.multiOkKeywords = multi.results.map((r: any) => r.keyword);
results.multiFailedKeywords = multi.failed.map((f: any) => f.keyword);

// --- merge dedupe across keywords ---
const merged = mergeNaverNewsResults([normalized, normalized]);
results.mergedCount = merged.items.length;
results.mergedUntiered = merged.untieredItems.length;
results.mergedSortedDesc = merged.items.every((item, index, arr) =>
  index === 0 || arr[index - 1].publishedAt >= item.publishedAt);

process.stdout.write(JSON.stringify(results));
`;

let r = null;
check("runtime probe executes", () => {
  r = runTsProbe({
    root: ROOT,
    probeDir: "lib/source-facts",
    probeSource: probe,
    extraJsFiles: ["naver-news-connector.js"],
  });
});

if (r) {
  check("env var names are declared, not read", () => {
    assert(
      JSON.stringify(r.envNames) ===
        JSON.stringify(["NAVER_CLIENT_ID", "NAVER_CLIENT_SECRET"]),
      `got ${JSON.stringify(r.envNames)}`,
    );
  });

  check("request defaults and trimming", () => {
    assert(r.defaultRequest.display === 30, `display ${r.defaultRequest.display}`);
    assert(r.defaultRequest.start === 1, `start ${r.defaultRequest.start}`);
    assert(r.trimsKeyword === "리볼빙", `keyword "${r.trimsKeyword}"`);
  });

  check("request validation rejects out-of-range values", () => {
    for (const key of [
      "shortKeyword", "blankKeyword", "displayTooBig",
      "displayZero", "startTooBig", "windowOverflow",
    ]) {
      assert(r[key] === "THREW", `${key} = ${r[key]}`);
    }
    assert(r.windowEdgeOk === "NO_THROW", "start=901 display=100 should be allowed");
  });

  check("html markup and entities are stripped", () => {
    assert(r.stripBold === "기준금리 동결", `got "${r.stripBold}"`);
    assert(r.stripEntities === '금리 & 물가 "인상" <속보>', `got "${r.stripEntities}"`);
    assert(r.stripNumeric === "'리볼빙' 주의", `got "${r.stripNumeric}"`);
    assert(r.stripWhitespace === "여러 공백 줄바꿈", `got "${r.stripWhitespace}"`);
  });

  check("date parsing refuses to invent dates", () => {
    assert(r.rfc822Ok === "2026-09-15T00:30:00.000Z", `got ${r.rfc822Ok}`);
    assert(r.rfc822Garbage === null, `garbage date returned ${r.rfc822Garbage}`);
    assert(r.rfc822Empty === null, `empty date returned ${r.rfc822Empty}`);
  });

  check("url canonicalization ignores cosmetic differences", () => {
    assert(r.canonBasic === "yna.co.kr/view/AKR123", `got ${r.canonBasic}`);
    assert(r.canonTrailing === r.canonBasic, "trailing slash not normalized");
    assert(r.canonFragment === r.canonBasic, "fragment not stripped");
    assert(r.canonQueryOrder1 === r.canonQueryOrder2, "query order not normalized");
    assert(r.canonBad === null, `malformed url returned ${r.canonBad}`);
    assert(r.canonScheme === null, `non-http scheme returned ${r.canonScheme}`);
  });

  check("normalization keeps only tiered, dated, linked items", () => {
    assert(r.normItemCount === 3, `expected 3 evidence items, got ${r.normItemCount}`);
    assert(
      JSON.stringify(r.normTiers) === JSON.stringify(["T2", "T2", "T2"]),
      `tiers ${JSON.stringify(r.normTiers)}`,
    );
    assert(r.normPublishers.includes("연합뉴스"), "연합뉴스 not resolved");
    assert(r.normPublishers.includes("MBC"), "MBC subdomain not resolved");
    assert(r.normTotal === 42, `totalReported ${r.normTotal}`);
    assert(r.normTitleClean === "기준금리 동결", `title "${r.normTitleClean}"`);
    assert(r.normIsoDate.endsWith("Z"), `not ISO UTC: ${r.normIsoDate}`);
  });

  check("T3 goes to hint bucket, not evidence", () => {
    assert(
      JSON.stringify(r.normUntiered) === JSON.stringify(["블로그 글"]),
      `untiered ${JSON.stringify(r.normUntiered)}`,
    );
  });

  check("bad items are dropped with reasons", () => {
    assert(
      JSON.stringify(r.normDropped) ===
        JSON.stringify(["duplicate", "empty_title", "missing_link", "unparsable_date"]),
      `dropped ${JSON.stringify(r.normDropped)}`,
    );
  });

  check("keyword failure is isolated", () => {
    assert(
      JSON.stringify(r.multiOkKeywords) === JSON.stringify(["기준금리"]),
      `ok ${JSON.stringify(r.multiOkKeywords)}`,
    );
    assert(
      JSON.stringify(r.multiFailedKeywords) ===
        JSON.stringify(["리볼빙", "없는키워드", "금"]),
      `failed ${JSON.stringify(r.multiFailedKeywords)}`,
    );
  });

  check("merge dedupes across keywords and sorts newest first", () => {
    assert(r.mergedCount === 3, `merged ${r.mergedCount}, expected 3`);
    assert(r.mergedUntiered === 1, `merged untiered ${r.mergedUntiered}`);
    assert(r.mergedSortedDesc === true, "not sorted newest first");
  });
}

console.log("=== L2-2 naver news connector check ===\n");
for (const label of passes) console.log(`  PASS  ${label}`);
for (const failure of failures) console.log(`  FAIL  ${failure}`);
console.log(`\n${passes.length} passed, ${failures.length} failed`);
process.exit(failures.length === 0 ? 0 : 1);
