// ECOS live connector check — read-only, no file writes.
//
// Mirrors the algorithm in lib/source-facts/ecos-live-transport.ts and
// lib/source-facts/ecos-normalizer.ts so it can run under plain node (no tsx).
//
// Secret safety:
// - Reads the API key from process.env, never prints it.
// - Never prints the secret-bearing URL.
// - env key missing → reports BLOCKED, does not fake success.
//
// Usage:
//   ECOS_API_KEY=... node scripts/_ecos-live-check.mjs

const ECOS_API_BASE = "https://ecos.bok.or.kr/api/StatisticSearch";
const ECOS_ROW_START = 1;
const ECOS_ROW_END = 10;
const ENV_NAMES = ["ECOS_API_KEY", "BOK_ECOS_API_KEY"];

// Two-period base-rate request (Dec 2024 → Jan 2025), matching ECOS_BASE_RATE_REQUEST_2P.
const REQUEST = {
  statCode: "722Y001",
  cycle: "M",
  startDate: "202412",
  endDate: "202501",
  itemCode1: "0101000",
  publishedDate: "2025-01-16",
  sourcePageUrl: "https://ecos.bok.or.kr/#/Short/722Y001",
  sourceName: "한국은행 ECOS — 기준금리",
};

function resolveApiKey() {
  for (const name of ENV_NAMES) {
    const v = process.env[name];
    if (typeof v === "string" && v.trim().length > 0) return v.trim();
  }
  return null;
}

function buildUrl(apiKey, req) {
  return [
    ECOS_API_BASE,
    encodeURIComponent(apiKey),
    "json",
    "kr",
    String(ECOS_ROW_START),
    String(ECOS_ROW_END),
    encodeURIComponent(req.statCode),
    encodeURIComponent(req.cycle),
    encodeURIComponent(req.startDate),
    encodeURIComponent(req.endDate),
    encodeURIComponent(req.itemCode1),
  ].join("/");
}

function isStatRow(r) {
  return (
    r &&
    typeof r === "object" &&
    typeof r.STAT_CODE === "string" &&
    typeof r.STAT_NAME === "string" &&
    typeof r.ITEM_CODE1 === "string" &&
    typeof r.ITEM_NAME1 === "string" &&
    typeof r.TIME === "string" &&
    typeof r.DATA_VALUE === "string" &&
    typeof r.UNIT_NAME === "string"
  );
}

function parseRows(json) {
  const search = json?.StatisticSearch;
  const rows = search?.row;
  if (!Array.isArray(rows)) return null;
  const valid = rows.filter(isStatRow);
  return valid.length > 0 ? valid : null;
}

function parseEcosValue(val) {
  return parseFloat(String(val).replace(/,/g, ""));
}

function ecosTimeToDataPeriod(time) {
  if (/^\d{6}$/.test(time)) {
    const year = time.slice(0, 4);
    const month = String(parseInt(time.slice(4, 6), 10));
    return `${year}년 ${month}월`;
  }
  return time;
}

// Mirror of normalizeEcosBaseRateRows (current-first ordering required).
function normalizeBaseRate(rows, fetchedAt, req) {
  if (rows.length < 2) return null;
  const cur = rows[0];
  const prev = rows[1];
  const curVal = parseEcosValue(cur.DATA_VALUE);
  const prevVal = parseEcosValue(prev.DATA_VALUE);
  if (isNaN(curVal) || isNaN(prevVal)) return null;
  const chgVal = parseFloat((curVal - prevVal).toFixed(4));
  const chgRate = prevVal !== 0 ? chgVal / prevVal : 0;
  const curDec = (cur.DATA_VALUE.split(".")[1] ?? "").length;
  const prevDec = (prev.DATA_VALUE.split(".")[1] ?? "").length;
  const maxDec = Math.max(curDec, prevDec, 1);
  const currentValueText = `${curVal.toFixed(maxDec)}%`;
  const previousValueText = `${prevVal.toFixed(maxDec)}%`;
  const sign = chgVal > 0 ? "+" : "";
  const changeValueText = `${sign}${chgVal.toFixed(maxDec)}%p`;
  const dataPeriod = ecosTimeToDataPeriod(cur.TIME);
  return {
    id: `raw-ecos-${cur.STAT_CODE}-${cur.ITEM_CODE1}-${cur.TIME}`,
    sourceProviderId: "provider-ecos-mock",
    sourceName: req.sourceName,
    sourceUrl: req.sourcePageUrl,
    fetchedAt,
    publishedDate: req.publishedDate,
    dataPeriod,
    collectionMethod: "api",
    rawPayload: {
      indicatorName: cur.ITEM_NAME1,
      unit: cur.UNIT_NAME,
      currentValueText,
      previousValueText,
      changeValueText,
      changeRateNumericValue: parseFloat((chgRate * 100).toFixed(4)),
    },
  };
}

async function main() {
  const apiKey = resolveApiKey();
  if (apiKey === null) {
    console.log("RESULT: BLOCKED");
    console.log(`reason: ECOS API key missing — set one of ${ENV_NAMES.join(", ")}`);
    console.log("note: live verification not run; no fake success.");
    process.exitCode = 0;
    return;
  }

  console.log("RESULT: env key present (value not shown)");
  const fetchedAt = new Date().toISOString();
  const url = buildUrl(apiKey, REQUEST);

  let response;
  try {
    response = await fetch(url);
  } catch {
    console.log("RESULT: LIVE_FAIL");
    console.log("reason: network error (URL withheld — contains key)");
    process.exitCode = 1;
    return;
  }

  if (!response.ok) {
    console.log("RESULT: LIVE_FAIL");
    console.log(`reason: HTTP ${response.status}`);
    process.exitCode = 1;
    return;
  }

  let json;
  try {
    json = await response.json();
  } catch {
    console.log("RESULT: LIVE_FAIL");
    console.log("reason: invalid JSON");
    process.exitCode = 1;
    return;
  }

  if (json?.RESULT?.CODE) {
    console.log("RESULT: LIVE_FAIL");
    console.log(`reason: ECOS API error ${json.RESULT.CODE}: ${json.RESULT.MESSAGE}`);
    process.exitCode = 1;
    return;
  }

  const rows = parseRows(json);
  if (rows === null) {
    console.log("RESULT: LIVE_FAIL");
    console.log("reason: no usable rows in StatisticSearch");
    process.exitCode = 1;
    return;
  }

  // ECOS returns ascending TIME; reorder current-first (mirrors orderEcosRowsCurrentFirst
  // in ecos-connector.ts, which the live transport also applies automatically).
  const ordered = [...rows].sort((a, b) => b.TIME.localeCompare(a.TIME));
  const snapshot = normalizeBaseRate(ordered, fetchedAt, REQUEST);
  if (snapshot === null) {
    console.log("RESULT: LIVE_FAIL");
    console.log(`reason: normalize failed (rows=${rows.length})`);
    process.exitCode = 1;
    return;
  }

  console.log("RESULT: LIVE_OK");
  console.log(`rows fetched: ${rows.length}`);
  console.log(`snapshot.id: ${snapshot.id}`);
  console.log(`indicatorName: ${snapshot.rawPayload.indicatorName}`);
  console.log(`dataPeriod: ${snapshot.dataPeriod}`);
  console.log(`publishedDate: ${snapshot.publishedDate}`);
  console.log(`sourceUrl: ${snapshot.sourceUrl}`);
  console.log(`currentValueText: ${snapshot.rawPayload.currentValueText}`);
  console.log(`previousValueText: ${snapshot.rawPayload.previousValueText}`);
  console.log(`changeValueText: ${snapshot.rawPayload.changeValueText}`);
  process.exitCode = 0;
}

main();
