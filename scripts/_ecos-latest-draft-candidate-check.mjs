// ECOS latest live draft candidate check — read-only, no file writes.
//
// Mirrors lib/source-facts/ecos-latest-candidate.ts + ecos-source-date.ts +
// ecos-latest-period.ts so it can run under plain node (no tsx). It runs the
// full 4-step path:
//   1. Fetch ECOS base-rate latest window (fixed end period, no Date.now()).
//   2. Select latest period + nearest previous (current-first sort).
//   3. Verify BOK publishedDate by VALUE MATCHING (never derive from ECOS period).
//   4. Simulate normalizeEcosBaseRateRows() + generateCandidateFromSnapshot()
//      and report the resulting draft candidate fields.
//
// Source-first guarantees:
// - No Jan2025 fixture fallback.
// - publishedDate is the official BOK decision date, NOT the ECOS period.
// - candidate isMock=false, isPublishable=false (draft only).
// - publishable is never set true here.
//
// Secret safety:
// - API key read from process.env, never printed.
// - Secret-bearing ECOS URL never printed.
// - env key missing → BLOCKED, no fake success.
//
// Usage:
//   node --env-file=.env.local scripts/_ecos-latest-draft-candidate-check.mjs

const ECOS_API_BASE = "https://ecos.bok.or.kr/api/StatisticSearch";
const ECOS_ROW_START = 1;
const ECOS_ROW_END = 14; // 12 months + 2 buffer
const ENV_NAMES = ["ECOS_API_KEY", "BOK_ECOS_API_KEY"];

const STAT_CODE = "722Y001";
const ITEM_CODE = "0101000";
const CYCLE = "M";

// Caller-supplied end period. No Date.now().
const END_PERIOD = "202606";
const WINDOW_MONTHS = 12;

// BOK official base-rate decision history (most-recent first).
// Mirrors BOK_BASE_RATE_DECISIONS in lib/source-facts/ecos-source-date.ts.
const BOK_DECISIONS = [
  { decisionDate: "2025-05-29", value: 2.5 },
  { decisionDate: "2025-02-25", value: 2.75 },
  { decisionDate: "2024-11-28", value: 3.0 },
  { decisionDate: "2024-10-11", value: 3.25 },
  { decisionDate: "2023-01-13", value: 3.5 },
];

const ECOS_LIVE_PROVIDER_ID = "provider-ecos-live";
const ECOS_BASE_RATE_SOURCE_NAME = "한국은행 ECOS — 기준금리";
const ECOS_BASE_RATE_SOURCE_PAGE_URL = "https://ecos.bok.or.kr/#/Short/722Y001";

// ── Helpers (mirrors lib functions) ───────────────────────────────────────────

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
    r && typeof r === "object" &&
    typeof r.STAT_CODE === "string" &&
    typeof r.ITEM_CODE1 === "string" &&
    typeof r.ITEM_NAME1 === "string" &&
    typeof r.TIME === "string" &&
    typeof r.DATA_VALUE === "string" &&
    typeof r.UNIT_NAME === "string"
  );
}

function parseRows(json) {
  const rows = json?.StatisticSearch?.row;
  if (!Array.isArray(rows)) return null;
  const valid = rows.filter(isStatRow);
  return valid.length > 0 ? valid : null;
}

function ecosTimeToDataPeriod(time) {
  if (/^\d{6}$/.test(time)) {
    return `${time.slice(0, 4)}년 ${String(parseInt(time.slice(4, 6), 10))}월`;
  }
  return time;
}

function parseRateValue(raw) {
  const n = parseFloat(String(raw).replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

function valuesEqual(a, b) { return Math.abs(a - b) < 1e-9; }

// Mirrors resolveEcosBaseRateSourceDate()
function resolveSourceDate(latestRow, decisions) {
  const v = parseRateValue(latestRow.DATA_VALUE);
  if (v === null) return { ok: false, code: "unparsable_latest_value" };
  if (decisions.length === 0) return { ok: false, code: "no_decision_history" };
  const most = decisions[0];
  if (!valuesEqual(v, most.value)) {
    const elsewhere = decisions.some((d) => valuesEqual(d.value, v));
    return { ok: false, code: elsewhere ? "latest_value_not_most_recent_decision" : "value_not_in_official_history" };
  }
  return { ok: true, verifiedPublishedDate: most.decisionDate, matchedValue: v };
}

// Mirrors normalizeEcosBaseRateRows() relevant output fields
function simulateNormalize(latestRow, previousRow, publishedDate) {
  const curVal = parseRateValue(latestRow.DATA_VALUE);
  const prevVal = parseRateValue(previousRow.DATA_VALUE);
  if (curVal === null || prevVal === null) return null;
  if (publishedDate.trim().length === 0) return null; // empty guard

  const chgVal = parseFloat((curVal - prevVal).toFixed(4));
  const chgRate = prevVal !== 0 ? chgVal / prevVal : 0;
  const curDec = (latestRow.DATA_VALUE.split(".")[1] ?? "").length;
  const prevDec = (previousRow.DATA_VALUE.split(".")[1] ?? "").length;
  const dec = Math.max(curDec, prevDec, 1);
  const sign = chgVal > 0 ? "+" : "";

  const dataPeriod = ecosTimeToDataPeriod(latestRow.TIME);
  const snapshotId = `raw-ecos-${latestRow.STAT_CODE}-${latestRow.ITEM_CODE1}-${latestRow.TIME}`;

  return {
    id: snapshotId,
    sourceProviderId: ECOS_LIVE_PROVIDER_ID,
    sourceName: ECOS_BASE_RATE_SOURCE_NAME,
    sourceUrl: ECOS_BASE_RATE_SOURCE_PAGE_URL,
    publishedDate,
    dataPeriod,
    currentValueText: `${curVal.toFixed(dec)}%`,
    previousValueText: `${prevVal.toFixed(dec)}%`,
    changeValueText: `${sign}${chgVal.toFixed(dec)}%p`,
    changeRateNumericValue: parseFloat((chgRate * 100).toFixed(4)),
    indicatorName: latestRow.ITEM_NAME1,
    unit: latestRow.UNIT_NAME,
    currentValue: curVal,
    previousValue: prevVal,
    changeValue: chgVal,
    citationLabel: `${ECOS_BASE_RATE_SOURCE_NAME} ${dataPeriod}`,
  };
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const startPeriod = subtractMonths(END_PERIOD, WINDOW_MONTHS - 1);
  if (startPeriod === null) {
    console.log("RESULT: BLOCKED — window underflow");
    process.exitCode = 1; return;
  }

  const apiKey = resolveApiKey();
  if (apiKey === null) {
    console.log("RESULT: BLOCKED");
    console.log(`reason: ECOS API key missing — set one of ${ENV_NAMES.join(", ")}`);
    process.exitCode = 0; return;
  }

  console.log("env key: present (value not shown)");
  console.log(`window: ${startPeriod}~${END_PERIOD} (${WINDOW_MONTHS} months)`);

  let response;
  try {
    response = await fetch(buildUrl(apiKey, startPeriod, END_PERIOD));
  } catch {
    console.log("RESULT: LIVE_FAIL — network error (URL withheld — contains key)");
    process.exitCode = 1; return;
  }
  if (!response.ok) {
    console.log(`RESULT: LIVE_FAIL — HTTP ${response.status}`);
    process.exitCode = 1; return;
  }

  let json;
  try { json = await response.json(); } catch {
    console.log("RESULT: LIVE_FAIL — invalid JSON");
    process.exitCode = 1; return;
  }
  if (json?.RESULT?.CODE) {
    console.log(`RESULT: LIVE_FAIL — ECOS API error ${json.RESULT.CODE}: ${json.RESULT.MESSAGE}`);
    process.exitCode = 1; return;
  }

  const rows = parseRows(json);
  if (rows === null) {
    console.log("RESULT: LIVE_FAIL — no usable rows");
    process.exitCode = 1; return;
  }

  // Step 1: current-first, select latest + previous
  const ordered = [...rows].sort((a, b) => b.TIME.localeCompare(a.TIME));
  if (ordered.length < 2) {
    console.log(`RESULT: BLOCKED — insufficient_rows (rows=${ordered.length})`);
    process.exitCode = 0; return;
  }
  const latest = ordered[0];
  const previous = ordered[1];

  console.log("---");
  console.log(`latestPeriod: ${latest.TIME} (${ecosTimeToDataPeriod(latest.TIME)})`);
  console.log(`previousPeriod: ${previous.TIME} (${ecosTimeToDataPeriod(previous.TIME)})`);
  console.log(`latestValue: ${latest.DATA_VALUE}${latest.UNIT_NAME}`);
  console.log(`previousValue: ${previous.DATA_VALUE}${previous.UNIT_NAME}`);

  // Step 2: verify BOK source date
  const sd = resolveSourceDate(latest, BOK_DECISIONS);
  if (!sd.ok) {
    console.log(`RESULT: BLOCKED — blocked_source_date_unresolved (code=${sd.code})`);
    console.log("publishedDate: UNRESOLVED — not invented");
    process.exitCode = 0; return;
  }

  console.log(`verifiedPublishedDate: ${sd.verifiedPublishedDate} (official BOK decision date, not ECOS period)`);

  // Step 3: simulate normalize (fetchedAt is not needed for the reported draft fields)
  const norm = simulateNormalize(latest, previous, sd.verifiedPublishedDate);
  if (norm === null) {
    console.log("RESULT: BLOCKED — blocked_normalize_failed");
    process.exitCode = 0; return;
  }

  // Step 4: report draft candidate fields
  console.log("---");
  console.log("RESULT: draft_ready");
  console.log(`snapshotId: ${norm.id}`);
  console.log(`sourceProviderId: ${norm.sourceProviderId}`);
  console.log(`isMock: false`);
  console.log(`isPublishable: false`);
  console.log(`publishedDate: ${norm.publishedDate}`);
  console.log(`dataPeriod: ${norm.dataPeriod}`);
  console.log(`indicatorName: ${norm.indicatorName}`);
  console.log(`currentValueText: ${norm.currentValueText}`);
  console.log(`previousValueText: ${norm.previousValueText}`);
  console.log(`changeValueText: ${norm.changeValueText}`);
  console.log(`sourceName: ${norm.sourceName}`);
  console.log(`sourceUrl: ${norm.sourceUrl}`);
  console.log("---");
  console.log("source-date provenance:");
  console.log(`  publishedDate(${norm.publishedDate}) = official BOK decision date for value ${norm.currentValueText}`);
  console.log(`  NOT derived from ECOS period ${latest.TIME}`);
  console.log("  officialSourceUrl: https://www.bok.or.kr/portal/singl/baseRate/list.do?dataSeCd=01&menuNo=200643");

  process.exitCode = 0;
}

main();
