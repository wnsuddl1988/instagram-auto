// KIS(한국투자증권) 국내주식 현재가 커넥터 검증 (네트워크 없음, mock transport)
//
// 검증 항목
//   1. tsc strict 타입체크
//   2. 종목코드 요청 검증(6자리 숫자)
//   3. 전일대비 부호(prdy_vrss_sign) 해석 — KIS는 부호 없는 절대값+별도 부호코드로
//      돌려주므로, 하락인데 양수로 잘못 정규화되면 사고임(실측 검증)
//   4. GLOBAL_QUOTE 스타일과 동일하게 changeRate를 소수 비율로 변환
//   5. 다중 종목 부분 실패 허용
//   6. mock transport 성공/실패 케이스
//   7. 토큰 캐시: 파일 없음/만료/서버모드 불일치 시 미사용 판정, 유효할 때만 재사용
//   8. live transport: URL/헤더가 API 키·토큰을 secret-safe하게 다루는지,
//      rt_cd 기반 에러 처리

import { existsSync, mkdtempSync, rmSync } from "node:fs";
import path from "node:path";
import os from "node:os";
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

const CONNECTOR = "lib/source-facts/kis-connector.ts";
const TOKEN_CACHE = "lib/source-facts/kis-token-cache.ts";
const LIVE_TRANSPORT = "lib/source-facts/kis-live-transport.ts";

for (const f of [CONNECTOR, TOKEN_CACHE, LIVE_TRANSPORT]) {
  check(`${f} exists`, () => {
    assert(existsSync(path.join(ROOT, f)), `missing ${f}`);
  });
}

check("typecheck passes", () => {
  typecheck(ROOT, [CONNECTOR, TOKEN_CACHE, LIVE_TRANSPORT]);
});

// A real temp dir outside the repo, used by the token-cache probe below so
// this check never touches the real C:\tmp\money-shorts-os\kis-token-cache.json.
const tmpCacheDir = mkdtempSync(path.join(os.tmpdir(), "kis-token-cache-check-"));
const tmpCachePathPosix = path.join(tmpCacheDir, "kis-token-cache.json").replace(/\\/g, "/");

const probe = `
import {
  buildKisQuoteRequest, KisRequestError,
  resolveKisSignedChange, normalizeKisQuote,
  collectKisQuote, collectKisQuotesForStocks, createKisMockTransport,
  buildKisIndexQuoteRequest, normalizeKisIndexQuote,
  collectKisIndexQuote, collectKisIndicesForCodes, createKisIndexMockTransport,
  KIS_INDEX_NAME_BY_CODE,
} from "./kis-connector.js";
import {
  isKisTokenUsable, readKisTokenCache, writeKisTokenCache, resolveKisTokenCachePath,
} from "./kis-token-cache.js";
import {
  KIS_ENV_NAMES, resolveKisCredentials, hasKisCredentials,
  buildKisQuoteUrl, parseKisQuoteResponse,
  buildKisIndexQuoteUrl, parseKisIndexQuoteResponse,
} from "./kis-live-transport.js";

const results: Record<string, any> = {};

const tryCatch = (fn: () => unknown) => {
  try { fn(); return "NO_THROW"; } catch { return "THREW"; }
};

// --- request validation ---
results.defaultRequest = buildKisQuoteRequest("005930", "Samsung Electronics");
results.badLength = tryCatch(() => buildKisQuoteRequest("12345", "x"));
results.nonNumeric = tryCatch(() => buildKisQuoteRequest("ABCDEF", "x"));
results.emptyDescription = tryCatch(() => buildKisQuoteRequest("005930", "  "));

// --- signed-change resolution (the sign-code quirk) ---
results.signUp = resolveKisSignedChange("1500", "2");
results.signDown = resolveKisSignedChange("1500", "5");
results.signFlat = resolveKisSignedChange("0", "3");
results.signUpperLimit = resolveKisSignedChange("2000", "1");
results.signLowerLimit = resolveKisSignedChange("2000", "4");

// --- normalization ---
const mkOutput = (over: Record<string, string>) => ({
  stck_prpr: "71500", prdy_vrss: "1500", prdy_vrss_sign: "2",
  prdy_ctrt: "2.14", stck_sdpr: "70000", acml_vol: "12345678",
  hts_kor_isnm: "삼성전자", ...over,
});

results.normalOk = normalizeKisQuote(mkOutput({}), "provider-kis", "삼성전자", "2026-09-22", "005930");
results.normalOkNoStockCode = normalizeKisQuote(mkOutput({}), "provider-kis", "삼성전자", "2026-09-22");
results.normalDown = normalizeKisQuote(
  mkOutput({ prdy_vrss: "800", prdy_vrss_sign: "5", prdy_ctrt: "-1.12", stck_prpr: "70200" }),
  "provider-kis", "삼성전자", "2026-09-22",
);
results.emptyTradingDate = normalizeKisQuote(mkOutput({}), "provider-kis", "삼성전자", "");
results.garbagePrice = normalizeKisQuote(mkOutput({ stck_prpr: "not-a-number" }), "provider-kis", "삼성전자", "2026-09-22");

// --- mock transport + collect runner ---
const fixtures = new Map<string, any>([
  ["005930", { ok: true, output: mkOutput({}), fetchedAt: "2026-09-23T00:00:00.000Z" }],
  ["000660", { ok: false, error: "rate limited", fetchedAt: "2026-09-23T00:00:00.000Z" }],
]);
const mockTransport = createKisMockTransport(fixtures);

const okOutcome = await collectKisQuote(
  buildKisQuoteRequest("005930", "x"), mockTransport, "provider-kis", "삼성전자", "2026-09-22",
);
results.mockOk = okOutcome.ok;
results.mockValue = okOutcome.ok ? okOutcome.indicator.latestValue : null;
// collectKisQuote가 request.stockCode를 자동으로 normalizeKisQuote에 전달하는지
// end-to-end로 확인(정규화 함수 단위 테스트만으로는 collectKisQuote 배선 누락을 못 잡음).
results.mockIndicatorCode = okOutcome.ok ? okOutcome.indicator.indicatorCode : null;

const failOutcome = await collectKisQuote(
  buildKisQuoteRequest("000660", "x"), mockTransport, "provider-kis", "SK하이닉스", "2026-09-22",
);
results.mockFail = failOutcome.ok;

const batch = await collectKisQuotesForStocks(
  [
    { stockCode: "005930", description: "x", indicatorName: "삼성전자" },
    { stockCode: "000660", description: "x", indicatorName: "SK하이닉스" },
    { stockCode: "999999", description: "x", indicatorName: "없는종목" },
  ],
  mockTransport, "provider-kis", "2026-09-22",
);
results.batchOkStocks = batch.results.map((r: any) => r.indicatorName);
results.batchFailedStocks = batch.failed.map((f: any) => f.stockCode);

// --- index quote (KOSPI/KOSDAQ) ---
results.indexNameMap = KIS_INDEX_NAME_BY_CODE;
results.indexRequestKospi = buildKisIndexQuoteRequest("0001", "코스피 지수");

// 2026-09-23 실측 확인: KIS 응답에 bstp_nmix_prdy_clpr(전일종가) 필드가 없어
// previousValue는 normalizeKisIndexQuote 내부에서 latestValue-changeValue로
// 산술 도출한다 — 이 픽스처엔 그 필드를 넣지 않는다(실제 응답 구조와 일치시킴).
const mkIndexOutput = (over: Record<string, string>) => ({
  bstp_nmix_prpr: "2650.32", bstp_nmix_prdy_vrss: "12.45", prdy_vrss_sign: "2",
  bstp_nmix_prdy_ctrt: "0.47", ...over,
});

results.indexNormalOk = normalizeKisIndexQuote(mkIndexOutput({}), "provider-kis", "0001", "2026-09-22");
results.indexNormalDown = normalizeKisIndexQuote(
  mkIndexOutput({ bstp_nmix_prdy_vrss: "8.20", prdy_vrss_sign: "5", bstp_nmix_prdy_ctrt: "-0.31" }),
  "provider-kis", "1001", "2026-09-22",
);
results.indexEmptyTradingDate = normalizeKisIndexQuote(mkIndexOutput({}), "provider-kis", "0001", "");

const indexFixtures = new Map<"0001" | "1001", any>([
  ["0001", { ok: true, output: mkIndexOutput({}), fetchedAt: "2026-09-23T00:00:00.000Z" }],
  ["1001", { ok: false, error: "server error", fetchedAt: "2026-09-23T00:00:00.000Z" }],
]);
const indexMockTransport = createKisIndexMockTransport(indexFixtures);

const indexOkOutcome = await collectKisIndexQuote(
  buildKisIndexQuoteRequest("0001", "x"), indexMockTransport, "provider-kis", "2026-09-22",
);
results.indexMockOk = indexOkOutcome.ok;
results.indexMockValue = indexOkOutcome.ok ? indexOkOutcome.indicator.latestValue : null;
results.indexMockPeriod = indexOkOutcome.ok ? indexOkOutcome.indicator.latestPeriod : null;

const indexBatch = await collectKisIndicesForCodes(["0001", "1001"], indexMockTransport, "provider-kis", "2026-09-22");
results.indexBatchOk = indexBatch.results.map((r: any) => r.indicatorName);
results.indexBatchFailed = indexBatch.failed.map((f: any) => f.indexCode);

// --- token cache ---
const cachePath = ${JSON.stringify(tmpCachePathPosix)};
results.resolvedCachePath = resolveKisTokenCachePath(cachePath);
results.noCacheFile = readKisTokenCache(cachePath);
results.usableWithNoToken = isKisTokenUsable(null, "live", 1_000_000);

const freshToken = {
  accessToken: "tok-fresh", tokenType: "Bearer",
  expiresAtIso: new Date(1_000_000 + 60 * 60 * 1000).toISOString(),
  serverMode: "live",
};
results.usableFresh = isKisTokenUsable(freshToken, "live", 1_000_000);
results.usableWrongServerMode = isKisTokenUsable(freshToken, "vts", 1_000_000);

const nearExpiryToken = {
  accessToken: "tok-near", tokenType: "Bearer",
  // Expires in 2 minutes — inside the 5-minute safety margin, should be unusable.
  expiresAtIso: new Date(1_000_000 + 2 * 60 * 1000).toISOString(),
  serverMode: "live",
};
results.usableNearExpiry = isKisTokenUsable(nearExpiryToken, "live", 1_000_000);

const expiredToken = {
  accessToken: "tok-expired", tokenType: "Bearer",
  expiresAtIso: new Date(1_000_000 - 1000).toISOString(),
  serverMode: "live",
};
results.usableExpired = isKisTokenUsable(expiredToken, "live", 1_000_000);

const writeOk = writeKisTokenCache(freshToken, cachePath);
results.writeOk = writeOk;
const readBack = readKisTokenCache(cachePath);
results.readBackMatches = readBack !== null && readBack.accessToken === "tok-fresh";

// --- live transport: env + credentials + url + response parsing (no network) ---
results.envNames = [...KIS_ENV_NAMES];
results.noCredsWithEmptyEnv = resolveKisCredentials({});
results.credsWithFullEnv = resolveKisCredentials({
  KIS_APP_KEY: "secret-app-key", KIS_APP_SECRET: "secret-app-secret",
  KIS_BASE_URL: "https://openapi.koreainvestment.com:9443", KIS_SERVER_MODE: "live",
});
results.credsFallbackBaseUrl = resolveKisCredentials({
  KIS_APP_KEY: "k", KIS_APP_SECRET: "s", KIS_SERVER_MODE: "vts",
});
results.credsMissingSecret = resolveKisCredentials({ KIS_APP_KEY: "k" });
results.hasCredsFalse = hasKisCredentials({});
results.hasCredsTrue = hasKisCredentials({ KIS_APP_KEY: "k", KIS_APP_SECRET: "s" });

const quoteUrl = buildKisQuoteUrl("https://openapi.koreainvestment.com:9443",
  buildKisQuoteRequest("005930", "x"));
results.quoteUrlHasStockCode = quoteUrl.includes("FID_INPUT_ISCD=005930");
results.quoteUrlHasMarketDiv = quoteUrl.includes("FID_COND_MRKT_DIV_CODE=J");
// The quote URL must never carry the app key/secret/token — those are headers.
results.quoteUrlHasNoSecret = !quoteUrl.includes("secret") && !quoteUrl.includes("appkey");

results.parseSuccess = parseKisQuoteResponse({ rt_cd: "0", msg_cd: "MCA00000", msg1: "정상", output: mkOutput({}) });
results.parseError = parseKisQuoteResponse({ rt_cd: "1", msg_cd: "EGW00123", msg1: "토큰이 만료되었습니다" });
results.parseMissingOutput = parseKisQuoteResponse({ rt_cd: "0", msg_cd: "MCA00000", msg1: "정상" });
results.parseNotObject = parseKisQuoteResponse(null);

// --- index quote live transport: url + response parsing ---
const indexUrl = buildKisIndexQuoteUrl("https://openapi.koreainvestment.com:9443",
  buildKisIndexQuoteRequest("0001", "x"));
results.indexUrlHasIndexCode = indexUrl.includes("FID_INPUT_ISCD=0001");
results.indexUrlHasMarketDiv = indexUrl.includes("FID_COND_MRKT_DIV_CODE=U");
results.indexUrlHasNoSecret = !indexUrl.includes("secret") && !indexUrl.includes("appkey");

results.indexParseSuccess = parseKisIndexQuoteResponse({ rt_cd: "0", msg_cd: "MCA00000", msg1: "정상", output: mkIndexOutput({}) });
results.indexParseError = parseKisIndexQuoteResponse({ rt_cd: "1", msg_cd: "EGW00123", msg1: "토큰이 만료되었습니다" });
results.indexParseMissingOutput = parseKisIndexQuoteResponse({ rt_cd: "0", msg_cd: "MCA00000", msg1: "정상" });

process.stdout.write(JSON.stringify(results));
`;

let r = null;
check("runtime probe executes", () => {
  r = runTsProbe({
    root: ROOT,
    probeDir: "lib/source-facts",
    probeSource: probe,
    extraJsFiles: ["kis-connector.js", "kis-token-cache.js", "kis-live-transport.js"],
  });
});

try {
  rmSync(tmpCacheDir, { recursive: true, force: true });
} catch {
  // best-effort cleanup, not part of the pass/fail contract
}

if (r) {
  check("env var names are declared, not read", () => {
    assert(
      JSON.stringify(r.envNames) ===
        JSON.stringify(["KIS_APP_KEY", "KIS_APP_SECRET", "KIS_BASE_URL", "KIS_SERVER_MODE"]),
      `got ${JSON.stringify(r.envNames)}`,
    );
  });

  check("request validation", () => {
    assert(r.defaultRequest.stockCode === "005930", `stockCode ${r.defaultRequest.stockCode}`);
    assert(r.defaultRequest.marketDivCode === "J", `marketDivCode ${r.defaultRequest.marketDivCode}`);
    for (const key of ["badLength", "nonNumeric", "emptyDescription"]) {
      assert(r[key] === "THREW", `${key} = ${r[key]}`);
    }
  });

  check("signed-change resolution handles KIS's unsigned-magnitude + sign-code quirk", () => {
    assert(r.signUp === 1500, `signUp ${r.signUp}`);
    assert(r.signDown === -1500, `signDown ${r.signDown} — a decline must be negative`);
    assert(r.signFlat === 0, `signFlat ${r.signFlat}`);
    assert(r.signUpperLimit === 2000, `signUpperLimit ${r.signUpperLimit}`);
    assert(r.signLowerLimit === -2000, `signLowerLimit ${r.signLowerLimit} — 하한 must be negative`);
  });

  check("normalization converts fields and preserves sign", () => {
    assert(r.normalOk !== null, "valid output should normalize");
    assert(r.normalOk.latestValue === 71500, `latestValue ${r.normalOk.latestValue}`);
    assert(r.normalOk.changeValue === 1500, `changeValue ${r.normalOk.changeValue}`);
    assert(Math.abs(r.normalOk.changeRate - 0.0214) < 1e-9, `changeRate ${r.normalOk.changeRate}`);
    assert(r.normalOk.unit === "KRW", `unit ${r.normalOk.unit}`);
    assert(r.normalOk.country === "KR", `country ${r.normalOk.country}`);
    // 2026-09-23 실측으로 발견한 버그 재발 방지: stockCode를 넘기면 반드시
    // indicatorCode에 실려야 bull-topic-threshold-scanner의 large-cap 분류가
    // 작동한다(이 필드가 비어 삼성전자조차 stock_other로 오분류됐던 사고).
    assert(r.normalOk.indicatorCode === "005930", `indicatorCode ${r.normalOk.indicatorCode}`);
    assert(
      r.normalOkNoStockCode.indicatorCode === undefined,
      `indicatorCode should be undefined when stockCode is omitted, got ${r.normalOkNoStockCode.indicatorCode}`,
    );

    assert(r.normalDown !== null, "declining output should normalize");
    assert(r.normalDown.changeValue === -800, `down changeValue ${r.normalDown.changeValue}`);
    assert(r.normalDown.changeRate < 0, `down changeRate should be negative, got ${r.normalDown.changeRate}`);
  });

  check("normalization refuses to invent missing/malformed data", () => {
    assert(r.emptyTradingDate === null, "empty trading date should fail normalization");
    assert(r.garbagePrice === null, "unparsable price should fail normalization");
  });

  check("mock transport success and failure paths", () => {
    assert(r.mockOk === true, "expected mock success");
    assert(r.mockValue === 71500, `mock value ${r.mockValue}`);
    assert(
      r.mockIndicatorCode === "005930",
      `collectKisQuote must wire request.stockCode into indicatorCode, got ${r.mockIndicatorCode}`,
    );
    assert(r.mockFail === false, "expected mock failure for rate-limited fixture");
  });

  check("batch collection isolates per-stock failure", () => {
    assert(
      JSON.stringify(r.batchOkStocks) === JSON.stringify(["삼성전자"]),
      `ok stocks ${JSON.stringify(r.batchOkStocks)}`,
    );
    assert(
      JSON.stringify(r.batchFailedStocks) === JSON.stringify(["000660", "999999"]),
      `failed stocks ${JSON.stringify(r.batchFailedStocks)}`,
    );
  });

  check("index code/name map and request builder", () => {
    assert(r.indexNameMap["0001"] === "코스피", `0001 -> ${r.indexNameMap["0001"]}`);
    assert(r.indexNameMap["1001"] === "코스닥", `1001 -> ${r.indexNameMap["1001"]}`);
    assert(r.indexRequestKospi.marketDivCode === "U", `marketDivCode ${r.indexRequestKospi.marketDivCode}`);
    assert(r.indexRequestKospi.indexCode === "0001", `indexCode ${r.indexRequestKospi.indexCode}`);
  });

  check("index normalization converts fields, preserves sign, refuses fabricated dates", () => {
    assert(r.indexNormalOk !== null, "valid index output should normalize");
    assert(r.indexNormalOk.latestValue === 2650.32, `latestValue ${r.indexNormalOk.latestValue}`);
    assert(r.indexNormalOk.changeValue === 12.45, `changeValue ${r.indexNormalOk.changeValue}`);
    // previousValue는 API가 직접 안 줘서 latestValue-changeValue로 산술 도출한다.
    assert(
      Math.abs(r.indexNormalOk.previousValue - 2637.87) < 1e-9,
      `previousValue ${r.indexNormalOk.previousValue} (expected 2650.32-12.45=2637.87)`,
    );
    assert(r.indexNormalOk.unit === "pt", `unit ${r.indexNormalOk.unit}`);
    assert(r.indexNormalOk.indicatorName === "코스피", `indicatorName ${r.indexNormalOk.indicatorName}`);

    assert(r.indexNormalDown !== null, "declining index output should normalize");
    assert(r.indexNormalDown.changeValue === -8.20, `down changeValue ${r.indexNormalDown.changeValue}`);
    assert(r.indexNormalDown.indicatorName === "코스닥", `indicatorName ${r.indexNormalDown.indicatorName}`);
    // 하락 케이스: previousValue = latestValue - (음수 changeValue) = latestValue + |change|
    assert(
      Math.abs(r.indexNormalDown.previousValue - (2650.32 + 8.20)) < 1e-9,
      `down previousValue ${r.indexNormalDown.previousValue}`,
    );

    assert(r.indexEmptyTradingDate === null, "empty trading date should fail index normalization");
  });

  check("index mock transport and batch collection", () => {
    assert(r.indexMockOk === true, "expected index mock success");
    assert(r.indexMockValue === 2650.32, `index mock value ${r.indexMockValue}`);
    assert(r.indexMockPeriod === "2026-09-22", `index mock period ${r.indexMockPeriod}`);
    assert(
      JSON.stringify(r.indexBatchOk) === JSON.stringify(["코스피"]),
      `index batch ok ${JSON.stringify(r.indexBatchOk)}`,
    );
    assert(
      JSON.stringify(r.indexBatchFailed) === JSON.stringify(["1001"]),
      `index batch failed ${JSON.stringify(r.indexBatchFailed)}`,
    );
  });

  check("token cache: missing file and null token are both unusable", () => {
    assert(r.noCacheFile === null, "no cache file should read as null");
    assert(r.usableWithNoToken === false, "null token should never be usable");
  });

  check("token cache: expiry and server-mode matching", () => {
    assert(r.usableFresh === true, "fresh token should be usable");
    assert(r.usableWrongServerMode === false, "token for a different server mode must not be reused");
    assert(r.usableNearExpiry === false, "token inside the safety margin should be treated as unusable");
    assert(r.usableExpired === false, "expired token should be unusable");
  });

  check("token cache: write then read round-trips", () => {
    assert(r.writeOk === true, "write should succeed to a writable temp path");
    assert(r.readBackMatches === true, "read-back token should match what was written");
  });

  check("credentials resolution: presence, fallback base url, missing fields", () => {
    assert(r.noCredsWithEmptyEnv === null, "empty env should resolve to null credentials");
    assert(r.credsWithFullEnv !== null, "full env should resolve credentials");
    assert(r.credsWithFullEnv.serverMode === "live", `serverMode ${r.credsWithFullEnv?.serverMode}`);
    assert(
      r.credsFallbackBaseUrl?.baseUrl === "https://openapivts.koreainvestment.com:29443",
      `fallback baseUrl ${r.credsFallbackBaseUrl?.baseUrl}`,
    );
    assert(r.credsMissingSecret === null, "missing appSecret should resolve to null credentials");
    assert(r.hasCredsFalse === false, "hasKisCredentials should be false for empty env");
    assert(r.hasCredsTrue === true, "hasKisCredentials should be true when both key and secret are set");
  });

  check("quote url carries required query params, never the secret", () => {
    assert(r.quoteUrlHasStockCode === true, "url should contain FID_INPUT_ISCD");
    assert(r.quoteUrlHasMarketDiv === true, "url should contain FID_COND_MRKT_DIV_CODE=J");
    assert(r.quoteUrlHasNoSecret === true, "url must never carry the app key/secret — those are headers");
  });

  check("response parsing handles rt_cd success/error and malformed shapes", () => {
    assert(r.parseSuccess.ok === true, "rt_cd=0 with output should parse ok");
    assert(r.parseError.ok === false, "non-zero rt_cd should be an error");
    assert(r.parseMissingOutput.ok === false, "rt_cd=0 without output should be an error");
    assert(r.parseNotObject.ok === false, "non-object payload should be an error");
  });

  check("index quote url carries required query params, never the secret", () => {
    assert(r.indexUrlHasIndexCode === true, "url should contain FID_INPUT_ISCD");
    assert(r.indexUrlHasMarketDiv === true, "url should contain FID_COND_MRKT_DIV_CODE=U");
    assert(r.indexUrlHasNoSecret === true, "index url must never carry the app key/secret");
  });

  check("index response parsing handles rt_cd success/error/malformed shapes", () => {
    assert(r.indexParseSuccess.ok === true, "rt_cd=0 with output should parse ok");
    assert(r.indexParseError.ok === false, "non-zero rt_cd should be an error");
    assert(r.indexParseMissingOutput.ok === false, "rt_cd=0 without output should be an error");
  });
}

console.log("=== KIS connector check ===\n");
for (const label of passes) console.log(`  PASS  ${label}`);
for (const failure of failures) console.log(`  FAIL  ${failure}`);
console.log(`\n${passes.length} passed, ${failures.length} failed`);
process.exit(failures.length === 0 ? 0 : 1);
