// Alpha Vantage GLOBAL_QUOTE 커넥터 검증 (네트워크 없음, mock transport)
//
// 검증 항목
//   1. tsc strict 타입체크
//   2. 심볼 요청 검증(공백 제거, 대문자화, 빈 값/이상한 문자 거부)
//   3. GLOBAL_QUOTE → EconomicIndicator 정규화(changePercent의 "%" 제거,
//      changeRate를 소수 비율로 변환), 숫자 파싱 실패 시 null(값 날조 금지)
//   4. 다중 심볼 부분 실패 허용(rate limit 등으로 일부 심볼만 실패해도 나머지는 유지)
//   5. mock transport 성공/실패 케이스
//   6. live transport: URL 빌더가 API 키를 secret-safe하게 다루는지,
//      Alpha Vantage 특유의 HTTP 200 + Error Message/Note/Information 처리

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

const CONNECTOR = "lib/source-facts/alpha-vantage-connector.ts";
const LIVE_TRANSPORT = "lib/source-facts/alpha-vantage-live-transport.ts";

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
  buildAlphaVantageQuoteRequest, AlphaVantageRequestError,
  normalizeAlphaVantageQuote, collectAlphaVantageQuote,
  collectAlphaVantageQuotesForSymbols, createAlphaVantageMockTransport,
  US_INDEX_ETF_PROXIES,
} from "./alpha-vantage-connector.js";
import {
  ALPHA_VANTAGE_API_KEY_ENV_NAMES, resolveAlphaVantageApiKey, hasAlphaVantageApiKey,
  buildAlphaVantageQuoteUrl, parseAlphaVantageQuoteResponse,
} from "./alpha-vantage-live-transport.js";

const results: Record<string, any> = {};

const tryCatch = (fn: () => unknown) => {
  try { fn(); return "NO_THROW"; } catch { return "THREW"; }
};

// --- US index ETF proxies ---
results.indexProxies = US_INDEX_ETF_PROXIES;
results.spyRequest = buildAlphaVantageQuoteRequest(US_INDEX_ETF_PROXIES.SPY.symbol, "S&P 500 proxy");

// --- request validation ---
results.defaultRequest = buildAlphaVantageQuoteRequest("aapl", "Apple quote");
results.emptySymbol = tryCatch(() => buildAlphaVantageQuoteRequest("   ", "x"));
results.emptyDescription = tryCatch(() => buildAlphaVantageQuoteRequest("AAPL", "  "));
results.badChars = tryCatch(() => buildAlphaVantageQuoteRequest("AAPL;DROP", "x"));
results.spyOk = tryCatch(() => buildAlphaVantageQuoteRequest("spy", "S&P 500 proxy ETF"));

// --- normalization ---
const mkQuote = (over: Record<string, string>) => ({
  "01. symbol": "AAPL", "02. open": "227.50", "03. high": "229.10", "04. low": "226.80",
  "05. price": "228.42", "06. volume": "48213900",
  "07. latest trading day": "2026-09-22",
  "08. previous close": "225.90", "09. change": "2.52", "10. change percent": "1.1156%",
  ...over,
});

results.normalOk = normalizeAlphaVantageQuote(mkQuote({}), "provider-alpha-vantage", "Apple Inc.");
results.emptySymbolQuote = normalizeAlphaVantageQuote(
  mkQuote({ "01. symbol": "" }), "provider-alpha-vantage", "Apple Inc.");
results.emptyTradingDay = normalizeAlphaVantageQuote(
  mkQuote({ "07. latest trading day": "" }), "provider-alpha-vantage", "Apple Inc.");
results.garbagePrice = normalizeAlphaVantageQuote(
  mkQuote({ "05. price": "not-a-number" }), "provider-alpha-vantage", "Apple Inc.");
results.negativeChange = normalizeAlphaVantageQuote(
  mkQuote({ "09. change": "-3.15", "10. change percent": "-1.3542%" }),
  "provider-alpha-vantage", "Apple Inc.");

// --- mock transport + collect runner ---
const fixtures = new Map<string, any>([
  ["AAPL", { ok: true, quote: mkQuote({}), fetchedAt: "2026-09-23T00:00:00.000Z" }],
  ["MSFT", { ok: false, error: "rate limited", fetchedAt: "2026-09-23T00:00:00.000Z" }],
]);
const mockTransport = createAlphaVantageMockTransport(fixtures);

const okOutcome = await collectAlphaVantageQuote(
  buildAlphaVantageQuoteRequest("AAPL", "x"), mockTransport, "provider-alpha-vantage", "Apple Inc.",
);
results.mockOk = okOutcome.ok;
results.mockIndicatorValue = okOutcome.ok ? okOutcome.indicator.latestValue : null;
results.mockChangeRate = okOutcome.ok ? okOutcome.indicator.changeRate : null;

const failOutcome = await collectAlphaVantageQuote(
  buildAlphaVantageQuoteRequest("MSFT", "x"), mockTransport, "provider-alpha-vantage", "Microsoft",
);
results.mockFail = failOutcome.ok;

// --- batch partial failure ---
const batch = await collectAlphaVantageQuotesForSymbols(
  [
    { symbol: "AAPL", description: "x", indicatorName: "Apple Inc." },
    { symbol: "MSFT", description: "x", indicatorName: "Microsoft" },
    { symbol: "NOFIXTURE", description: "x", indicatorName: "Unknown" },
  ],
  mockTransport, "provider-alpha-vantage",
);
results.batchOkSymbols = batch.results.map((r: any) => r.indicatorCode);
results.batchFailedSymbols = batch.failed.map((f: any) => f.symbol);

// --- live transport: env + url + response parsing (no network) ---
results.envNames = [...ALPHA_VANTAGE_API_KEY_ENV_NAMES];
results.apiKeyResolvedIsStringOrNull = (() => {
  const v = resolveAlphaVantageApiKey();
  return v === null || typeof v === "string";
})();
results.hasKeyMatchesResolve = hasAlphaVantageApiKey() === (resolveAlphaVantageApiKey() !== null);

const liveRequest = buildAlphaVantageQuoteRequest("AAPL", "x");
const url = buildAlphaVantageQuoteUrl("SECRET_KEY_VALUE", liveRequest);
results.urlHasKey = url.includes("apikey=SECRET_KEY_VALUE");
results.urlHasSymbol = url.includes("symbol=AAPL");
results.urlHasFunction = url.includes("function=GLOBAL_QUOTE");

results.parseSuccess = parseAlphaVantageQuoteResponse({ "Global Quote": mkQuote({}) });
results.parseErrorMessage = parseAlphaVantageQuoteResponse({ "Error Message": "Invalid API call" });
results.parseNote = parseAlphaVantageQuoteResponse({ "Note": "Thank you for using Alpha Vantage! ..." });
results.parseInformation = parseAlphaVantageQuoteResponse({ "Information": "rate limit reached" });
// 2026-09-23 실측 보안 사고 재발 방지: Alpha Vantage의 실제 rate-limit
// 메시지는 "We have detected your API key as SECRETVALUE123..." 형태로 키
// 값을 그대로 담아 온다 — 이 필드 내용이 에러 메시지에 절대 노출되면 안 된다.
results.parseInformationLeakCheck = parseAlphaVantageQuoteResponse({
  "Information": "We have detected your API key as SECRETVALUE123 and our standard API rate limit is 25 requests per day.",
});
results.parseEmptyQuote = parseAlphaVantageQuoteResponse({ "Global Quote": {} });
results.parseMissingQuote = parseAlphaVantageQuoteResponse({ "foo": "bar" });
results.parseNotObject = parseAlphaVantageQuoteResponse(null);

process.stdout.write(JSON.stringify(results));
`;

let r = null;
check("runtime probe executes", () => {
  r = runTsProbe({
    root: ROOT,
    probeDir: "lib/source-facts",
    probeSource: probe,
    extraJsFiles: ["alpha-vantage-connector.js", "alpha-vantage-live-transport.js"],
  });
});

if (r) {
  check("env var names are declared, not read", () => {
    assert(
      JSON.stringify(r.envNames) === JSON.stringify(["ALPHA_VANTAGE_API_KEY"]),
      `got ${JSON.stringify(r.envNames)}`,
    );
  });

  check("api key resolution is type-safe and internally consistent", () => {
    assert(r.apiKeyResolvedIsStringOrNull === true, "resolveAlphaVantageApiKey must return string|null");
    assert(r.hasKeyMatchesResolve === true, "hasAlphaVantageApiKey must agree with resolveAlphaVantageApiKey");
  });

  check("US index ETF proxies cover S&P 500 / Nasdaq-100 / Dow", () => {
    assert(r.indexProxies.SPY.symbol === "SPY", `SPY symbol ${r.indexProxies.SPY.symbol}`);
    assert(r.indexProxies.QQQ.symbol === "QQQ", `QQQ symbol ${r.indexProxies.QQQ.symbol}`);
    assert(r.indexProxies.DIA.symbol === "DIA", `DIA symbol ${r.indexProxies.DIA.symbol}`);
    assert(r.spyRequest.symbol === "SPY", `spyRequest.symbol ${r.spyRequest.symbol}`);
  });

  check("request builder trims/uppercases and validates", () => {
    assert(r.defaultRequest.symbol === "AAPL", `symbol ${r.defaultRequest.symbol}`);
    assert(r.spyOk === "NO_THROW", "SPY symbol should be accepted");
  });

  check("request validation rejects malformed input", () => {
    for (const key of ["emptySymbol", "emptyDescription", "badChars"]) {
      assert(r[key] === "THREW", `${key} = ${r[key]}`);
    }
  });

  check("normalization converts and validates fields", () => {
    assert(r.normalOk !== null, "valid quote should normalize");
    assert(r.normalOk.indicatorCode === "AAPL", `indicatorCode ${r.normalOk.indicatorCode}`);
    assert(r.normalOk.latestPeriod === "2026-09-22", `latestPeriod ${r.normalOk.latestPeriod}`);
    assert(r.normalOk.latestValue === 228.42, `latestValue ${r.normalOk.latestValue}`);
    assert(r.normalOk.previousValue === 225.90, `previousValue ${r.normalOk.previousValue}`);
    assert(r.normalOk.changeValue === 2.52, `changeValue ${r.normalOk.changeValue}`);
    // 1.1156% -> 0.011156 fractional rate
    assert(Math.abs(r.normalOk.changeRate - 0.011156) < 1e-9, `changeRate ${r.normalOk.changeRate}`);
    assert(r.normalOk.unit === "USD", `unit ${r.normalOk.unit}`);
  });

  check("negative change is preserved, not clamped", () => {
    assert(r.negativeChange !== null, "negative change should still normalize");
    assert(r.negativeChange.changeValue === -3.15, `changeValue ${r.negativeChange.changeValue}`);
    assert(r.negativeChange.changeRate < 0, `changeRate should be negative, got ${r.negativeChange.changeRate}`);
  });

  check("normalization refuses to invent missing/malformed data", () => {
    assert(r.emptySymbolQuote === null, "empty symbol should fail normalization");
    assert(r.emptyTradingDay === null, "empty trading day should fail normalization");
    assert(r.garbagePrice === null, "unparsable price should fail normalization");
  });

  check("mock transport success and failure paths", () => {
    assert(r.mockOk === true, "expected mock success");
    assert(r.mockIndicatorValue === 228.42, `mock indicator value ${r.mockIndicatorValue}`);
    assert(r.mockFail === false, "expected mock failure for rate-limited fixture");
  });

  check("batch collection isolates per-symbol failure", () => {
    assert(
      JSON.stringify(r.batchOkSymbols) === JSON.stringify(["AAPL"]),
      `ok symbols ${JSON.stringify(r.batchOkSymbols)}`,
    );
    assert(
      JSON.stringify(r.batchFailedSymbols) === JSON.stringify(["MSFT", "NOFIXTURE"]),
      `failed symbols ${JSON.stringify(r.batchFailedSymbols)}`,
    );
  });

  check("live url is secret-bearing and carries required params", () => {
    assert(r.urlHasKey === true, "url should contain apikey");
    assert(r.urlHasSymbol === true, "url should contain symbol");
    assert(r.urlHasFunction === true, "url should contain function=GLOBAL_QUOTE");
  });

  check("response parsing handles Alpha Vantage's HTTP-200 error shapes", () => {
    assert(r.parseSuccess.ok === true, "well-formed Global Quote should parse ok");
    assert(r.parseErrorMessage.ok === false, "Error Message field should be an error");
    assert(r.parseNote.ok === false, "Note field (rate limit) should be an error");
    assert(r.parseInformation.ok === false, "Information field (rate limit) should be an error");
    assert(
      !JSON.stringify(r.parseInformationLeakCheck).includes("SECRETVALUE123"),
      "SECURITY: Alpha Vantage's Information field (which echoes the API key on rate limit) must never appear in the error message",
    );
    assert(r.parseEmptyQuote.ok === false, "empty Global Quote object should be an error");
    assert(r.parseMissingQuote.ok === false, "missing Global Quote key should be an error");
    assert(r.parseNotObject.ok === false, "non-object payload should be an error");
  });
}

console.log("=== Alpha Vantage connector check ===\n");
for (const label of passes) console.log(`  PASS  ${label}`);
for (const failure of failures) console.log(`  FAIL  ${failure}`);
console.log(`\n${passes.length} passed, ${failures.length} failed`);
process.exit(failures.length === 0 ? 0 : 1);
