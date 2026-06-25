// ECOS base-rate source-date resolver check — read-only, no file writes.
//
// Mirrors lib/source-facts/ecos-source-date.ts + ecos-latest-period.ts so it can
// run under plain node (no tsx). It:
//   1. Fetches the ECOS base-rate latest period window once (fixed end period).
//   2. Selects the latest period + nearest previous period (current-first).
//   3. Verifies the BOK publishedDate by VALUE MATCHING against the official BOK
//      decision history (transcribed from the official BOK page), never invents it.
//   4. Reports the readiness status the library would reach
//      (blocked_pending_source_date vs draft_ready), publishable always false.
//
// Source-first rules enforced here:
// - No fallback to the Jan2025 smoke fixture.
// - publishedDate is verified only when the latest ECOS value equals the most
//   recent official BOK decision value; otherwise unresolved.
// - publishable is never set true in this check.
//
// Secret safety:
// - Reads the API key from process.env, never prints it.
// - Never prints the secret-bearing URL.
// - env key missing → reports BLOCKED, does not fake success.
//
// Usage:
//   node --env-file=.env.local scripts/_ecos-source-date-check.mjs

const ECOS_API_BASE = "https://ecos.bok.or.kr/api/StatisticSearch";
const ECOS_ROW_START = 1;
const ECOS_ROW_END = 14; // 12 months + 2 buffer (matches buildEcosLatestWindowRequest)
const ENV_NAMES = ["ECOS_API_KEY", "BOK_ECOS_API_KEY"];

const STAT_CODE = "722Y001";
const ITEM_CODE = "0101000";
const CYCLE = "M";

// Caller-supplied end period (current project date basis). No Date.now().
const END_PERIOD = "202606";
const WINDOW_MONTHS = 12;

// Official BOK base-rate decision history, most-recent first.
// Transcribed from https://www.bok.or.kr/portal/singl/baseRate/list.do (2026-06-26).
// Mirrors BOK_BASE_RATE_DECISIONS in lib/source-facts/ecos-source-date.ts.
const BOK_DECISIONS = [
  { decisionDate: "2025-05-29", value: 2.5 },
  { decisionDate: "2025-02-25", value: 2.75 },
  { decisionDate: "2024-11-28", value: 3.0 },
  { decisionDate: "2024-10-11", value: 3.25 },
  { decisionDate: "2023-01-13", value: 3.5 },
];

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

function parseRateValue(raw) {
  const n = parseFloat(String(raw).replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

function valuesEqual(a, b) {
  return Math.abs(a - b) < 1e-9;
}

// Mirrors resolveEcosBaseRateSourceDate() in lib/source-facts/ecos-source-date.ts.
function resolveSourceDate(latestRow, decisions) {
  const latestValue = parseRateValue(latestRow.DATA_VALUE);
  if (latestValue === null) {
    return { ok: false, code: "unparsable_latest_value" };
  }
  if (decisions.length === 0) {
    return { ok: false, code: "no_decision_history" };
  }
  const mostRecent = decisions[0];
  if (!valuesEqual(latestValue, mostRecent.value)) {
    const existsElsewhere = decisions.some((d) => valuesEqual(d.value, latestValue));
    return {
      ok: false,
      code: existsElsewhere
        ? "latest_value_not_most_recent_decision"
        : "value_not_in_official_history",
    };
  }
  return {
    ok: true,
    verifiedPublishedDate: mostRecent.decisionDate,
    matchedValue: latestValue,
  };
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
  console.log(`indicatorName: ${latest.ITEM_NAME1}`);

  // Source-date verification by value matching against official BOK history.
  const sd = resolveSourceDate(latest, BOK_DECISIONS);

  console.log("--- source-date verification ---");
  console.log("officialSource: 한국은행 통화정책방향 결정회의 — 기준금리 변경 이력");
  console.log("officialSourceUrl: https://www.bok.or.kr/portal/singl/baseRate/list.do?dataSeCd=01&menuNo=200643");

  if (sd.ok) {
    console.log(`verifiedPublishedDate: ${sd.verifiedPublishedDate} (matched value ${sd.matchedValue}%)`);
    console.log("readinessStatus: draft_ready");
    console.log("publishable: false");
    console.log(
      `note: latest value (${sd.matchedValue}%) matches most-recent official BOK decision on ${sd.verifiedPublishedDate}; date is the official decision date, not the ECOS period.`,
    );
  } else {
    console.log("verifiedPublishedDate: UNRESOLVED");
    console.log(`unresolvedCode: ${sd.code}`);
    console.log("readinessStatus: blocked_pending_source_date");
    console.log("publishable: false");
    console.log("note: no official date could be tied to the latest value; not invented.");
  }
  process.exitCode = 0;
}

main();
