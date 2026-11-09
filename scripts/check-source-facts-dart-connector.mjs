// DART(OpenDART) 공시검색 커넥터 검증 (네트워크 없음, mock transport)
//
// 검증 항목
//   1. tsc strict 타입체크
//   2. 요청 파라미터 검증(corpCode 8자리, 날짜 포맷, pageCount 상한)
//   3. YYYYMMDD → ISO 날짜 변환, 파싱 실패 시 null(날짜 날조 금지)
//   4. rcept_no 기반 canonical viewer URL 생성
//   5. 정상/빈 제목/빈 rcept_no 행 정규화(잘못된 행은 드롭, 전체 실패 아님)
//   6. mock transport 성공/실패 케이스
//   7. live transport: URL 빌더가 API 키를 secret-safe하게 다루는지, 응답 파싱(status=000/013/에러코드)

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

const CONNECTOR = "lib/source-facts/dart-connector.ts";
const LIVE_TRANSPORT = "lib/source-facts/dart-live-transport.ts";

check("connector file exists", () => {
  assert(existsSync(path.join(ROOT, CONNECTOR)), `missing ${CONNECTOR}`);
});
check("live transport file exists", () => {
  assert(existsSync(path.join(ROOT, LIVE_TRANSPORT)), `missing ${LIVE_TRANSPORT}`);
});

check("typecheck passes", () => {
  typecheck(ROOT, [CONNECTOR, LIVE_TRANSPORT]);
});

const probe = `
import {
  buildDartDisclosureSearchRequest, DartRequestError,
  dartDateToIso, buildDartViewerUrl,
  normalizeDartDisclosureItem, normalizeDartDisclosureItems,
  collectDartDisclosures, createDartMockTransport,
} from "./dart-connector.js";
import {
  DART_API_KEY_ENV_NAMES, resolveDartApiKey, hasDartApiKey,
  buildDartListUrl, parseDartListResponse,
} from "./dart-live-transport.js";

const results: Record<string, any> = {};

const tryCatch = (fn: () => unknown) => {
  try { fn(); return "NO_THROW"; } catch { return "THREW"; }
};

// --- request validation ---
results.defaultRequest = buildDartDisclosureSearchRequest({
  corpCode: "00126380", beginDate: "20260101", endDate: "20260131",
  description: "test",
});
results.badCorpCode = tryCatch(() => buildDartDisclosureSearchRequest({
  corpCode: "abc", beginDate: "20260101", endDate: "20260131", description: "x",
}));
// 2026-09-23 신설: corpCode 생략 = 전체 시장 스캔(공급계약/수주 공시 전체
// 조회용). 필수였던 필드가 optional로 바뀌었으니 이 케이스를 명시적으로
// 검증한다 — 생략해도 요청이 만들어지고, live URL에는 corp_code 파라미터
// 자체가 빠져야 한다(DART가 그걸 "전체" 신호로 해석).
results.omittedCorpCodeRequest = buildDartDisclosureSearchRequest({
  beginDate: "20260101", endDate: "20260131", description: "market-wide scan",
});
results.badBeginDate = tryCatch(() => buildDartDisclosureSearchRequest({
  corpCode: "00126380", beginDate: "2026-01-01", endDate: "20260131", description: "x",
}));
results.beginAfterEnd = tryCatch(() => buildDartDisclosureSearchRequest({
  corpCode: "00126380", beginDate: "20260201", endDate: "20260101", description: "x",
}));
results.pageCountTooBig = tryCatch(() => buildDartDisclosureSearchRequest({
  corpCode: "00126380", beginDate: "20260101", endDate: "20260131", pageCount: 101, description: "x",
}));
results.pageCountOk = tryCatch(() => buildDartDisclosureSearchRequest({
  corpCode: "00126380", beginDate: "20260101", endDate: "20260131", pageCount: 100, description: "x",
}));

// --- date helper ---
results.isoOk = dartDateToIso("20260115");
results.isoGarbage = dartDateToIso("not-a-date");
results.isoTooShort = dartDateToIso("2026011");

// --- viewer url ---
results.viewerUrl = buildDartViewerUrl("20260115000123");

// --- normalization ---
const mkItem = (over: Record<string, string>) => ({
  corp_cls: "Y", corp_name: "삼성전자", corp_code: "00126380", stock_code: "005930",
  report_nm: "분기보고서", rcept_no: "20260115000123", flr_nm: "삼성전자",
  rcept_dt: "20260115", rm: "", ...over,
});

results.normalOk = normalizeDartDisclosureItem(mkItem({}), "provider-dart");
results.emptyTitle = normalizeDartDisclosureItem(mkItem({ report_nm: "" }), "provider-dart");
results.emptyRceptNo = normalizeDartDisclosureItem(mkItem({ rcept_no: "" }), "provider-dart");
results.badDate = normalizeDartDisclosureItem(mkItem({ rcept_dt: "garbage" }), "provider-dart");
results.unlisted = normalizeDartDisclosureItem(mkItem({ stock_code: "" }), "provider-dart");

const batch = normalizeDartDisclosureItems(
  [mkItem({ rcept_no: "1" }), mkItem({ report_nm: "", rcept_no: "2" }), mkItem({ rcept_no: "3" })],
  "provider-dart",
);
results.batchCount = batch.length;
results.batchIds = batch.map((d: any) => d.id);

// --- mock transport + collect runner ---
const fixtures = new Map<string, any>([
  ["00126380:20260101:20260131", {
    ok: true,
    items: [mkItem({ rcept_no: "20260115000123" })],
    fetchedAt: "2026-09-23T00:00:00.000Z",
  }],
  ["99999999:20260101:20260131", { ok: false, error: "no fixture", fetchedAt: "2026-09-23T00:00:00.000Z" }],
]);
const mockTransport = createDartMockTransport(fixtures);

const okOutcome = await collectDartDisclosures(
  buildDartDisclosureSearchRequest({ corpCode: "00126380", beginDate: "20260101", endDate: "20260131", description: "x" }),
  mockTransport, "provider-dart",
);
results.mockOk = okOutcome.ok;
results.mockDocCount = okOutcome.ok ? okOutcome.documents.length : -1;

const failOutcome = await collectDartDisclosures(
  buildDartDisclosureSearchRequest({ corpCode: "99999999", beginDate: "20260101", endDate: "20260131", description: "x" }),
  mockTransport, "provider-dart",
);
results.mockFail = failOutcome.ok;

// --- live transport: env + url + response parsing (no network) ---
// Never echo the resolved key value (this probe may run in an env that has a
// real DART_API_KEY set) — only report presence as a boolean.
results.envNames = [...DART_API_KEY_ENV_NAMES];
results.apiKeyResolvedIsStringOrNull = (() => {
  const v = resolveDartApiKey();
  return v === null || typeof v === "string";
})();
results.hasKeyMatchesResolve = hasDartApiKey() === (resolveDartApiKey() !== null);

const liveRequest = buildDartDisclosureSearchRequest({
  corpCode: "00126380", beginDate: "20260101", endDate: "20260131", description: "x",
});
const url = buildDartListUrl("SECRET_KEY_VALUE", liveRequest);
results.urlHasKey = url.includes("crtfc_key=SECRET_KEY_VALUE");
results.urlHasCorpCode = url.includes("corp_code=00126380");
results.urlHasDates = url.includes("bgn_de=20260101") && url.includes("end_de=20260131");

const omittedUrl = buildDartListUrl("SECRET_KEY_VALUE", results.omittedCorpCodeRequest);
results.omittedUrlHasNoCorpCode = !omittedUrl.includes("corp_code=");

results.parseSuccess = parseDartListResponse({
  status: "000", message: "정상", list: [mkItem({})],
});
results.parseNoResults = parseDartListResponse({ status: "013", message: "조회된 데이타가 없습니다." });
results.parseAuthError = parseDartListResponse({ status: "011", message: "등록되지 않은 키" });
results.parseMalformed = parseDartListResponse({ status: "000", message: "정상" });
results.parseNotObject = parseDartListResponse(null);

process.stdout.write(JSON.stringify(results));
`;

let r = null;
check("runtime probe executes", () => {
  r = runTsProbe({
    root: ROOT,
    probeDir: "lib/source-facts",
    probeSource: probe,
    extraJsFiles: ["dart-connector.js", "dart-live-transport.js"],
  });
});

if (r) {
  check("env var names are declared, not read", () => {
    assert(
      JSON.stringify(r.envNames) === JSON.stringify(["DART_API_KEY", "IROS_OPENDART_API_KEY"]),
      `got ${JSON.stringify(r.envNames)}`,
    );
  });

  check("api key resolution is type-safe and internally consistent", () => {
    // Deliberately does not assert null/false here: this probe may run in an
    // environment that has a real DART_API_KEY set (e.g. this project's own
    // .env.local), and asserting "no key" would be an environment-dependent
    // flake, not a real behavior check.
    assert(r.apiKeyResolvedIsStringOrNull === true, "resolveDartApiKey must return string|null");
    assert(r.hasKeyMatchesResolve === true, "hasDartApiKey must agree with resolveDartApiKey");
  });

  check("request defaults and validation", () => {
    assert(r.defaultRequest.pageNo === 1, `pageNo ${r.defaultRequest.pageNo}`);
    assert(r.defaultRequest.pageCount === 20, `pageCount ${r.defaultRequest.pageCount}`);
  });

  check("request validation rejects malformed input", () => {
    for (const key of ["badCorpCode", "badBeginDate", "beginAfterEnd", "pageCountTooBig"]) {
      assert(r[key] === "THREW", `${key} = ${r[key]}`);
    }
    assert(r.pageCountOk === "NO_THROW", "pageCount=100 should be allowed (at max)");
  });

  check("omitting corpCode builds a market-wide scan request with no corp_code param", () => {
    assert(r.omittedCorpCodeRequest.corpCode === undefined, `corpCode ${r.omittedCorpCodeRequest.corpCode}`);
    assert(r.omittedUrlHasNoCorpCode === true, "URL must not carry corp_code when corpCode is omitted");
  });

  check("date parsing refuses to invent dates", () => {
    assert(r.isoOk === "2026-01-15", `got ${r.isoOk}`);
    assert(r.isoGarbage === null, `garbage date returned ${r.isoGarbage}`);
    assert(r.isoTooShort === null, `short date returned ${r.isoTooShort}`);
  });

  check("viewer url is built from rcept_no without an api key", () => {
    assert(
      r.viewerUrl === "https://dart.fss.or.kr/dsaf001/main.do?rcpNo=20260115000123",
      `got ${r.viewerUrl}`,
    );
  });

  check("normalization keeps valid rows, drops invalid ones", () => {
    assert(r.normalOk !== null, "valid item should normalize");
    assert(r.normalOk.id === "dart-20260115000123", `id ${r.normalOk.id}`);
    assert(r.normalOk.companyName === "삼성전자", `companyName ${r.normalOk.companyName}`);
    assert(r.normalOk.stockCode === "005930", `stockCode ${r.normalOk.stockCode}`);
    assert(r.normalOk.publishedAt === "2026-01-15", `publishedAt ${r.normalOk.publishedAt}`);
    assert(r.emptyTitle === null, "empty report_nm should drop the row");
    assert(r.emptyRceptNo === null, "empty rcept_no should drop the row");
    assert(r.badDate === null, "unparsable rcept_dt should drop the row");
    assert(r.unlisted.stockCode === undefined, `unlisted stockCode should be undefined, got ${r.unlisted.stockCode}`);
  });

  check("batch normalization drops bad rows without failing the whole batch", () => {
    assert(r.batchCount === 2, `batch count ${r.batchCount}, expected 2 (one dropped)`);
    assert(
      JSON.stringify(r.batchIds) === JSON.stringify(["dart-1", "dart-3"]),
      `batch ids ${JSON.stringify(r.batchIds)}`,
    );
  });

  check("mock transport success and failure paths", () => {
    assert(r.mockOk === true, "expected mock success");
    assert(r.mockDocCount === 1, `mock doc count ${r.mockDocCount}`);
    assert(r.mockFail === false, "expected mock failure for unfixtured key");
  });

  check("live url is secret-bearing and carries required params", () => {
    assert(r.urlHasKey === true, "url should contain crtfc_key");
    assert(r.urlHasCorpCode === true, "url should contain corp_code");
    assert(r.urlHasDates === true, "url should contain bgn_de/end_de");
  });

  check("response parsing handles success, empty-results, and error codes", () => {
    assert(r.parseSuccess.ok === true, "status=000 with list should parse ok");
    assert(r.parseSuccess.items.length === 1, `parsed items ${r.parseSuccess.items.length}`);
    assert(r.parseNoResults.ok === true, "status=013 should be ok with empty items");
    assert(r.parseNoResults.items.length === 0, "status=013 should yield zero items");
    assert(r.parseAuthError.ok === false, "status=011 should be an error");
    assert(r.parseMalformed.ok === false, "status=000 without list should be an error");
    assert(r.parseNotObject.ok === false, "non-object payload should be an error");
  });
}

console.log("=== DART connector check ===\n");
for (const label of passes) console.log(`  PASS  ${label}`);
for (const failure of failures) console.log(`  FAIL  ${failure}`);
console.log(`\n${passes.length} passed, ${failures.length} failed`);
process.exit(failures.length === 0 ? 0 : 1);
