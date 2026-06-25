// ECOS latest-period resolver check — read-only, no file writes.
//
// Mirrors lib/source-facts/ecos-latest-period.ts so it can run under plain node
// (no tsx). Builds a bounded monthly window ending at a fixed caller-supplied
// end period (202606), fetches ECOS rows once, selects the latest period plus
// nearest previous period, and reports publishability status.
//
// Source-first rules enforced here:
// - No fallback to the Jan2025 smoke fixture.
// - publishedDate is NOT in the ECOS row payload, so it is never invented:
//   the candidate stays blocked_pending_source_date.
//
// Secret safety:
// - Reads the API key from process.env, never prints it.
// - Never prints the secret-bearing URL.
// - env key missing → reports BLOCKED, does not fake success.
//
// Usage:
//   node --env-file=.env.local scripts/_ecos-latest-period-check.mjs

const ECOS_API_BASE = "https://ecos.bok.or.kr/api/StatisticSearch";
const ECOS_ROW_START = 1;
// Cover WINDOW_MONTHS + 2 buffer, matching buildEcosLatestWindowRequest rowEnd logic.
const ECOS_ROW_END = 14; // 12 months + 2 buffer
const ENV_NAMES = ["ECOS_API_KEY", "BOK_ECOS_API_KEY"];

const STAT_CODE = "722Y001";
const ITEM_CODE = "0101000";
const CYCLE = "M";

// Caller-supplied end period (current project date basis). No Date.now().
const END_PERIOD = "202606";
const WINDOW_MONTHS = 12;

function isValidMonthlyPeriod(period) {
  if (!/^\d{6}$/.test(period)) return false;
  const month = parseInt(period.slice(4, 6), 10);
  return month >= 1 && month <= 12;
}

function subtractMonths(period, months) {
  if (!isValidMonthlyPeriod(period)) return null;
  const year = parseInt(period.slice(0, 4), 10);
  const month = parseInt(period.slice(4, 6), 10);
  const absolute = year * 12 + (month - 1) - months;
  if (absolute < 0) return null;
  const newYear = Math.floor(absolute / 12);
  const newMonth = (absolute % 12) + 1;
  return `${String(newYear).padStart(4, "0")}${String(newMonth).padStart(2, "0")}`;
}

function resolveApiKey() {
  for (const name of ENV_NAMES) {
    const v = process.env[name];
    if (typeof v === "string" && v.trim().length > 0) return v.trim();
  }
  return null;
}

function buildUrl(apiKey, startPeriod, endPeriod) {
  return [
    ECOS_API_BASE,
    encodeURIComponent(apiKey),
    "json",
    "kr",
    String(ECOS_ROW_START),
    String(ECOS_ROW_END),
    encodeURIComponent(STAT_CODE),
    encodeURIComponent(CYCLE),
    encodeURIComponent(startPeriod),
    encodeURIComponent(endPeriod),
    encodeURIComponent(ITEM_CODE),
  ].join("/");
}

function isStatRow(r) {
  return (
    r &&
    typeof r === "object" &&
    typeof r.STAT_CODE === "string" &&
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

function timeToDataPeriod(time) {
  if (/^\d{6}$/.test(time)) {
    const year = time.slice(0, 4);
    const month = String(parseInt(time.slice(4, 6), 10));
    return `${year}년 ${month}월`;
  }
  return time;
}

async function main() {
  const startPeriod = subtractMonths(END_PERIOD, WINDOW_MONTHS - 1);
  if (startPeriod === null) {
    console.log("RESULT: BLOCKED");
    console.log("reason: window underflow — bad END_PERIOD");
    process.exitCode = 1;
    return;
  }

  const apiKey = resolveApiKey();
  if (apiKey === null) {
    console.log("RESULT: BLOCKED");
    console.log(`reason: ECOS API key missing — set one of ${ENV_NAMES.join(", ")}`);
    console.log("note: live verification not run; no fake success.");
    process.exitCode = 0;
    return;
  }

  console.log("RESULT: env key present (value not shown)");
  console.log(`window: ${startPeriod}~${END_PERIOD} (${WINDOW_MONTHS} months)`);

  const url = buildUrl(apiKey, startPeriod, END_PERIOD);

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

  // Order current-first (descending TIME), then select latest + nearest previous.
  const ordered = [...rows].sort((a, b) => b.TIME.localeCompare(a.TIME));

  if (ordered.length < 2) {
    console.log("RESULT: BLOCKED_INSUFFICIENT_ROWS");
    console.log(`reason: fewer than 2 rows in window (rows=${ordered.length}); no fixture fallback.`);
    process.exitCode = 0;
    return;
  }

  const latest = ordered[0];
  const previous = ordered[1];

  console.log("RESULT: LIVE_OK");
  console.log(`rows fetched: ${rows.length}`);
  console.log(`latestPeriod: ${latest.TIME} (${timeToDataPeriod(latest.TIME)})`);
  console.log(`previousPeriod: ${previous.TIME} (${timeToDataPeriod(previous.TIME)})`);
  console.log(`latestValue: ${latest.DATA_VALUE}${latest.UNIT_NAME}`);
  console.log(`previousValue: ${previous.DATA_VALUE}${previous.UNIT_NAME}`);
  console.log(`indicatorName: ${latest.ITEM_NAME1}`);
  // publishedDate is NOT in the ECOS row payload — never invented.
  console.log("publishedDate: UNKNOWN (not in ECOS row payload)");
  console.log("candidateStatus: blocked_pending_source_date");
  console.log("publishable: false");
  console.log("note: latest period resolved; not publishable until source date is verified.");
  process.exitCode = 0;
}

main();
