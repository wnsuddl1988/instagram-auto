/**
 * Static guard: owner daily automation entrypoint integrity.
 * task: owner-usable-automation-entrypoint-no-live-v1
 *
 * Dependency-free. Reads only the entrypoint source text and (for a subset of
 * checks) runs the entrypoint itself via spawnSync/child_process (no network,
 * no external API, no env/secret access).
 *
 * Exit 0 = all PASS. Exit 1 = at least one FAIL.
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");

const ENTRYPOINT_PATH = resolve(__dirname, "run-owner-daily-automation-entrypoint.mjs");
const RUNBOOK_PATH = resolve(REPO_ROOT, "docs/owner-daily-automation-runbook.md");

let passed = 0;
let failed = 0;
function check(label, condition, detail) {
  if (condition) {
    console.log(`  PASS  ${label}`);
    passed++;
  } else {
    console.error(`  FAIL  ${label}${detail ? " — " + detail : ""}`);
    failed++;
  }
}

function codeLines(src) {
  return src
    .split("\n")
    .filter((l) => !/^\s*(\/\/|\*)/.test(l))
    .join("\n");
}

console.log("\nStatic guard check: owner daily automation entrypoint\n");

check("entrypoint file exists", existsSync(ENTRYPOINT_PATH));
const src = existsSync(ENTRYPOINT_PATH) ? readFileSync(ENTRYPOINT_PATH, "utf-8") : "";
const code = codeLines(src);

// ── forbidden: secret/env access ──────────────────────────────────────────────
console.log("[ forbidden: secret/env access ]");
check("no process.env access", !code.includes("process.env"));
check("no .env.local reference in executable code (comments may document the restriction)", !code.includes(".env.local"));
check("no .env reference in executable code outside comments", !code.includes(".env"));
check("no accessToken literal outside comments", !code.toLowerCase().includes("accesstoken"));
check("no refreshToken literal outside comments", !code.toLowerCase().includes("refreshtoken"));
check("no clientSecret literal outside comments", !code.toLowerCase().includes("clientsecret"));
check("no apiKey literal outside comments", !code.toLowerCase().includes("apikey"));
check(
  "no secret value shape (EAA/ya29/blob token) in source",
  !/(EAA[A-Za-z0-9]{20}|ya29\.[A-Za-z0-9_-]{20}|vercel_blob_rw_[A-Za-z0-9]{10})/.test(src),
);

// ── forbidden: external API/upload/deploy patterns ────────────────────────────
console.log("\n[ forbidden: external API/upload/deploy patterns ]");
check("no fetch(", !code.includes("fetch("));
check("no axios", !code.includes("axios"));
check("no googleapis", !code.toLowerCase().includes("googleapis"));
check("no youtube.videos.insert pattern", !/youtube\s*\.\s*videos\s*\.\s*insert/.test(code));
check("no graph.facebook.com / graph.instagram.com", !code.includes("graph.facebook.com") && !code.includes("graph.instagram.com"));
check("no @vercel/blob import", !code.includes("@vercel/blob"));
check("no Blob put(/list(/del(/head( call pattern", !/\b(put|list|del|head)\s*\(/.test(code));
check("no OAuth literal outside comments", !code.includes("OAuth"));
check("no npm install / pnpm add / dependency-changing commands", !/\b(npm install|pnpm add|yarn add)\b/.test(src));
check("no deploy/DNS keywords (vercel deploy, dns)", !/vercel\s+deploy/i.test(src) && !/\bdns\b/i.test(src));

// ── required: safe child-process usage ────────────────────────────────────────
console.log("\n[ required: safe child-process usage ]");
check("uses spawnSync (not exec/execSync)", src.includes("spawnSync"));
check("no exec( outside comments", !code.includes("exec("));
check("no execSync outside comments", !code.includes("execSync"));
check("no shell: true anywhere", !/shell\s*:\s*true/.test(code));
check("shell: false present at least once", /shell\s*:\s*false/.test(src));
check("spawnSync uses process.execPath (not raw shell string)", src.includes("spawnSync(process.execPath"));

// ── required: modes ────────────────────────────────────────────────────────────
console.log("\n[ required: modes ]");
check("--status mode present", src.includes('"--status"'));
check("--dry-run mode present", src.includes('"--dry-run"'));
check("--preflight mode present", src.includes('"--preflight"'));
check("--duplicate-guard-check mode present", src.includes('"--duplicate-guard-check"'));
check("runStatus function present", /function\s+runStatus/.test(src));
check("runDryRun function present", /function\s+runDryRun/.test(src));
check("runPreflight function present", /function\s+runPreflight/.test(src));
check("runDuplicateGuardCheck function present", /function\s+runDuplicateGuardCheck/.test(src));

// ── required: duplicate-guard-check safety contract ────────────────────────────
console.log("\n[ required: duplicate-guard-check safety contract ]");
check(
  "duplicate-guard-check calls runPreflightSummary before invoking --live",
  (() => {
    const fnStart = src.indexOf("function runDuplicateGuardCheck");
    const fnEnd = src.indexOf("\nfunction ", fnStart + 1);
    const fnBody = fnStart !== -1 ? src.slice(fnStart, fnEnd === -1 ? undefined : fnEnd) : "";
    const preflightCallIdx = fnBody.indexOf("runPreflightSummary(");
    const liveCallIdx = fnBody.indexOf('"--live"');
    return preflightCallIdx !== -1 && liveCallIdx !== -1 && preflightCallIdx < liveCallIdx;
  })(),
);
check(
  "duplicate-guard-check aborts (no --live call) when confirmed === false",
  (() => {
    const fnStart = src.indexOf("function runDuplicateGuardCheck");
    const fnEnd = src.indexOf("\nfunction ", fnStart + 1);
    const fnBody = fnStart !== -1 ? src.slice(fnStart, fnEnd === -1 ? undefined : fnEnd) : "";
    return /if\s*\(\s*!confirmed\s*\)\s*\{/.test(fnBody) && fnBody.includes("Refusing to invoke --live");
  })(),
);
check(
  "confirmed requires bothWillBeBlocked + expectedLiveStatus + guard-before-credential ordering",
  src.includes("dupBlock.bothWillBeBlocked === true") &&
    src.includes('dupBlock.expectedLiveStatus === "BLOCKED_DUPLICATE_ALREADY_PUBLISHED"') &&
    src.includes("summary.duplicateGuardEvaluatedBeforeCredentialResolution === true"),
);
check(
  "exit 3 / BLOCKED_DUPLICATE_ALREADY_PUBLISHED is never reported as publish success",
  src.includes("treatedAsPublishSuccess: false") && !/treatedAsPublishSuccess:\s*true/.test(src),
);
check(
  "isExpectedSafeBlock requires exit 3 AND BLOCKED_DUPLICATE_ALREADY_PUBLISHED status",
  /isExpectedSafeBlock\s*=\s*exitCode\s*===\s*3\s*&&\s*liveResult\?\.status\s*===\s*"BLOCKED_DUPLICATE_ALREADY_PUBLISHED"/.test(code),
);
check(
  "unexpected non-block result is explicitly flagged (isUnexpectedNonBlockResult)",
  src.includes("isUnexpectedNonBlockResult"),
);

// ── required: safe defaults / repo-outside output ──────────────────────────────
console.log("\n[ required: safe defaults ]");
check("default dry-run out-root is outside repo (C:\\\\tmp)", src.includes("C:\\\\tmp\\\\money-shorts-os"));
check(
  "dry-run mode enforces out-root outside repo root",
  src.includes("outRootAbs.startsWith(REPO_ROOT"),
);
check("references existing render-manifest-from-manifest runner (reuse, not reimplementation)", src.includes("run-local-money-shorts-from-render-manifest.mjs"));
check("references existing dual-platform orchestrator (reuse, not reimplementation)", src.includes("run-dual-platform-final-publish-orchestrator.mjs"));

// ── required: JSON summary schema fields ────────────────────────────────────────
console.log("\n[ required: JSON summary schema fields ]");
check("status summary schemaVersion present", src.includes("owner_daily_automation_entrypoint_status_v1"));
check("preflight summary schemaVersion present", src.includes("owner_daily_automation_entrypoint_preflight_summary_v1"));
check("duplicate-guard-check summary schemaVersion present", src.includes("owner_daily_automation_entrypoint_duplicate_guard_check_v1"));
check("existing evidence media_id 17916511431199303 referenced", src.includes("17916511431199303"));
check("existing evidence videoId r9jhckdpC9w referenced", src.includes("r9jhckdpC9w"));
check("envSecretValuesAccessedThisRun: false present", src.includes("envSecretValuesAccessedThisRun: false"));

// ── operator smoke: run each mode via child_process (no network) ───────────────
console.log("\n[ operator smoke: --status ]");
let statusOut = "";
let statusOk = false;
try {
  statusOut = execFileSync(process.execPath, [ENTRYPOINT_PATH, "--status"], { cwd: REPO_ROOT, encoding: "utf8", timeout: 20000 });
  statusOk = true;
} catch (e) {
  statusOut = String(e?.stdout || e?.message || e);
}
check("--status runs (exit 0)", statusOk);
const statusJsonMatch = statusOut.match(/\{[\s\S]*?\n\}/);
let statusParsed = null;
if (statusJsonMatch) {
  try { statusParsed = JSON.parse(statusJsonMatch[0]); } catch { statusParsed = null; }
}
check("--status stdout JSON parse", !!statusParsed);
check("--status schemaVersion correct", statusParsed?.schemaVersion === "owner_daily_automation_entrypoint_status_v1");
check("--status noLive === true", statusParsed?.noLive === true);
check("--status envSecretValuesAccessedThisRun === false", statusParsed?.envSecretValuesAccessedThisRun === false);
check("--status existingEvidence.instagramMediaId === 17916511431199303", statusParsed?.existingEvidence?.instagramMediaId === "17916511431199303");
check("--status existingEvidence.youtubeVideoId === r9jhckdpC9w", statusParsed?.existingEvidence?.youtubeVideoId === "r9jhckdpC9w");

console.log("\n[ operator smoke: --preflight ]");
let pfOut = "";
let pfExit = null;
try {
  pfOut = execFileSync(process.execPath, [ENTRYPOINT_PATH, "--preflight"], { cwd: REPO_ROOT, encoding: "utf8", timeout: 30000 });
  pfExit = 0;
} catch (e) {
  pfExit = typeof e?.status === "number" ? e.status : null;
  pfOut = String(e?.stdout || e?.message || e);
}
check("--preflight runs (exit 0, since orchestrator preflight passes)", pfExit === 0, `exit=${pfExit}`);
const pfJsonMatch = pfOut.match(/\{[\s\S]*?"currentContentDuplicateBlock"[\s\S]*?\n  \}\n\}/);
let pfParsed = null;
if (pfJsonMatch) {
  try { pfParsed = JSON.parse(pfJsonMatch[0]); } catch { pfParsed = null; }
}
check("--preflight stdout JSON parse", !!pfParsed);
check("--preflight schemaVersion correct", pfParsed?.schemaVersion === "owner_daily_automation_entrypoint_preflight_summary_v1");
check("--preflight armed === true", pfParsed?.armed === true);
check(
  "--preflight currentContentDuplicateBlock.bothWillBeBlocked === true",
  pfParsed?.currentContentDuplicateBlock?.bothWillBeBlocked === true,
);
check(
  "--preflight expectedLiveStatus === BLOCKED_DUPLICATE_ALREADY_PUBLISHED",
  pfParsed?.currentContentDuplicateBlock?.expectedLiveStatus === "BLOCKED_DUPLICATE_ALREADY_PUBLISHED",
);

console.log("\n[ operator smoke: --duplicate-guard-check ]");
let dgOut = "";
let dgExit = null;
try {
  dgOut = execFileSync(process.execPath, [ENTRYPOINT_PATH, "--duplicate-guard-check"], { cwd: REPO_ROOT, encoding: "utf8", timeout: 30000 });
  dgExit = 0;
} catch (e) {
  dgExit = typeof e?.status === "number" ? e.status : null;
  dgOut = String(e?.stdout || e?.message || e);
}
check("--duplicate-guard-check runs (exit 0 = expected safe block for current content)", dgExit === 0, `exit=${dgExit}`);
const dgJsonMatch = dgOut.match(/\{[\s\S]*?"existingEvidence"[\s\S]*?\n  \}\n\}/);
let dgParsed = null;
if (dgJsonMatch) {
  try { dgParsed = JSON.parse(dgJsonMatch[0]); } catch { dgParsed = null; }
}
check("--duplicate-guard-check stdout JSON parse", !!dgParsed);
check("--duplicate-guard-check schemaVersion correct", dgParsed?.schemaVersion === "owner_daily_automation_entrypoint_duplicate_guard_check_v1");
check("--duplicate-guard-check preflightConfirmedDuplicateBlock === true", dgParsed?.preflightConfirmedDuplicateBlock === true);
check("--duplicate-guard-check liveExitCode === 3", dgParsed?.liveExitCode === 3);
check("--duplicate-guard-check liveStatus === BLOCKED_DUPLICATE_ALREADY_PUBLISHED", dgParsed?.liveStatus === "BLOCKED_DUPLICATE_ALREADY_PUBLISHED");
check("--duplicate-guard-check isExpectedSafeBlock === true", dgParsed?.isExpectedSafeBlock === true);
check("--duplicate-guard-check treatedAsPublishSuccess === false", dgParsed?.treatedAsPublishSuccess === false);
check(
  "--duplicate-guard-check sideEffectCountersAllZero === true",
  dgParsed?.sideEffectCountersAllZero === true,
);
check("--duplicate-guard-check credentialResolutionReached === false", dgParsed?.credentialResolutionReached === false);
check("--duplicate-guard-check actualApiCallReached === false", dgParsed?.actualApiCallReached === false);
check("--duplicate-guard-check stdout has no secret value shape", !/(EAA[A-Za-z0-9]{20}|ya29\.[A-Za-z0-9_-]{20}|vercel_blob_rw_[A-Za-z0-9]{10})/.test(dgOut));

// ── required: runbook doc ───────────────────────────────────────────────────────
console.log("\n[ required: owner runbook doc ]");
check("runbook file exists", existsSync(RUNBOOK_PATH));
const runbookRaw = existsSync(RUNBOOK_PATH) ? readFileSync(RUNBOOK_PATH, "utf-8") : "";
check("runbook mentions --status/--dry-run/--preflight/--duplicate-guard-check", ["--status", "--dry-run", "--preflight", "--duplicate-guard-check"].every((m) => runbookRaw.includes(m)));
check("runbook explains why current content will not repost", /재게시되지 않는가|will not repost/i.test(runbookRaw));
check("runbook references Instagram media_id 17916511431199303", runbookRaw.includes("17916511431199303"));
check("runbook references YouTube videoId r9jhckdpC9w", runbookRaw.includes("r9jhckdpC9w"));
check("runbook explains .env.local is not read directly by this entrypoint", runbookRaw.includes(".env.local"));
check("runbook has no secret value shape", !/(EAA[A-Za-z0-9]{20}|ya29\.[A-Za-z0-9_-]{20}|vercel_blob_rw_[A-Za-z0-9]{10})/.test(runbookRaw));

console.log(`\n${passed + failed} checks — ${passed} PASS, ${failed} FAIL\n`);

if (failed > 0) {
  process.exit(1);
}
