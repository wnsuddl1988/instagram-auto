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

import { readFileSync, existsSync, mkdtempSync, rmSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import os from "node:os";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");

const ENTRYPOINT_PATH = resolve(__dirname, "run-owner-daily-automation-entrypoint.mjs");
const RUNBOOK_PATH = resolve(REPO_ROOT, "docs/owner-daily-automation-runbook.md");
const PACKAGE_JSON_PATH = resolve(REPO_ROOT, "package.json");
const CONTENT_UNIT_SAMPLE_PATH = resolve(REPO_ROOT, "scripts/fixtures/dual_platform_content_unit.sample.v1.json");
const LOCAL_SUMMARY_SAMPLE_PATH = resolve(REPO_ROOT, "scripts/fixtures/dual_platform_content_unit_from_local_summary.sample.v1.json");
const LETTERBOX_PLAN_SAMPLE_PATH = resolve(REPO_ROOT, "scripts/fixtures/youtube_letterbox_source_plan_from_content_unit.sample.v1.json");
const LETTERBOX_RENDER_REQUEST_PLAN_SAMPLE_PATH = resolve(REPO_ROOT, "scripts/fixtures/youtube_letterbox_render_request_from_plan.sample.v1.json");
const READY_GOLDEN_SAMPLE_CONTENT_UNIT_PATH = resolve(REPO_ROOT, "scripts/fixtures/dual_platform_content_unit.t1_lifestyle_inflation.v3_2.ready.v1.json");
const READY_GOLDEN_SAMPLE_CONTENT_UNIT_RELATIVE = "scripts/fixtures/dual_platform_content_unit.t1_lifestyle_inflation.v3_2.ready.v1.json";

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

/**
 * 실제 import/호출 여부만 검사하기 위해 블록 주석 + 문자열 리터럴 본문을 지운다.
 * usage/문서 문자열 안의 "@vercel/blob"/"put()" 언급이 실제 import/호출로 오탐되는 것을 막는다.
 */
function stripBlockCommentsAndStrings(code) {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/"(?:[^"\\]|\\.)*"/g, '""')
    .replace(/'(?:[^'\\]|\\.)*'/g, "''")
    .replace(/`(?:[^`\\]|\\.)*`/g, "``");
}

// ── sanitized child env for credential-preflight present-probe ──────────────
// task: dual-platform-credential-preflight-review-fix-v1 (Codex finding B)
// present-probe는 parent env 전체를 복사하지 않는다(broad spread 금지 — 우발적 secret 상속 방지).
// child node 실행에 필요한 최소 non-secret OS 변수만 화이트리스트로 개별 상속하고, 그 위에
// 승인된 credential dummy key만 얹는다. .env/.env.local/dotenv/secret 파일은 읽지 않는다.
const SAFE_CHILD_OS_ENV_KEYS = [
  "SystemRoot", "windir", "SystemDrive", "PATH", "Path", "PATHEXT", "COMSPEC",
  "TEMP", "TMP", "NUMBER_OF_PROCESSORS", "PROCESSOR_ARCHITECTURE",
];
function buildSanitizedProbeEnv(dummyKeyNames, dummyValue) {
  const env = Object.create(null);
  for (const name of SAFE_CHILD_OS_ENV_KEYS) {
    const v = process.env[name];
    if (typeof v === "string") env[name] = v; // non-secret OS 변수만, 개별 상속(broad spread 아님)
  }
  for (const name of dummyKeyNames) env[name] = dummyValue;
  return env;
}

console.log("\nStatic guard check: owner daily automation entrypoint\n");

check("entrypoint file exists", existsSync(ENTRYPOINT_PATH));
const src = existsSync(ENTRYPOINT_PATH) ? readFileSync(ENTRYPOINT_PATH, "utf-8") : "";
const code = codeLines(src);
const codeNoStrings = stripBlockCommentsAndStrings(code);

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
check("no @vercel/blob import (actual import statement, not doc/string mentions)", !codeNoStrings.includes("@vercel/blob"));
check("no Blob put(/list(/del(/head( call pattern", !/\b(put|list|del|head)\s*\(/.test(codeNoStrings));
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
check("--build-content-unit mode present", src.includes('"--build-content-unit"'));
check("runStatus function present", /function\s+runStatus/.test(src));
check("runDryRun function present", /function\s+runDryRun/.test(src));
check("runPreflight function present", /function\s+runPreflight/.test(src));
check("runDuplicateGuardCheck function present", /function\s+runDuplicateGuardCheck/.test(src));
check("runBuildContentUnit function present", /function\s+runBuildContentUnit/.test(src));
check(
  "imports buildContentUnitFromLocalSummary from build-dual-platform-content-unit-from-local-summary.mjs",
  /import\s*\{\s*buildContentUnitFromLocalSummary\s*\}\s*from\s*"\.\/build-dual-platform-content-unit-from-local-summary\.mjs"/.test(src),
);

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
  "dry-run mode enforces out-root outside repo root via isRepoRootOrInside (not raw startsWith)",
  /isRepoRootOrInside\(outRootAbs,\s*REPO_ROOT\)/.test(codeNoStrings),
);
check("references existing render-manifest-from-manifest runner (reuse, not reimplementation)", src.includes("run-local-money-shorts-from-render-manifest.mjs"));
check("references existing dual-platform orchestrator (reuse, not reimplementation)", src.includes("run-dual-platform-final-publish-orchestrator.mjs"));

// ── required: repo-root/repo-inside output guard commonization ─────────────────
// task: owner-entrypoint-repo-root-outdir-guard-commonize-v1
console.log("\n[ required: repo-root output guard commonization ]");
check(
  "no remaining raw startsWith(REPO_ROOT + sep) output guard anywhere in owner entrypoint",
  !/\.startsWith\(\s*REPO_ROOT\s*\+/.test(codeNoStrings),
);
check(
  "owner entrypoint imports isRepoRootOrInside from prepare-instagram-blob-upload-from-request.mjs",
  /import\s*\{[^}]*isRepoRootOrInside[^}]*\}\s*from\s*["']\.\/prepare-instagram-blob-upload-from-request\.mjs["']/.test(code),
);
const isRepoRootOrInsideCallCount = (codeNoStrings.match(/isRepoRootOrInside\(/g) ?? []).length;
check(
  `isRepoRootOrInside used for every out-dir/out-root guard (found ${isRepoRootOrInsideCallCount} call sites, expect >= 6)`,
  isRepoRootOrInsideCallCount >= 6,
);

console.log("\n[ operator smoke: --out-dir . / --out-root . rejected as repo root itself ]");

// --dry-run --out-root . : local pipeline이 spawn되기 전에 fail-closed되어야 한다(무거운 pipeline 실행 없음).
{
  let dryRunRootExit = null;
  let dryRunRootOut = "";
  try {
    dryRunRootOut = execFileSync(process.execPath, [ENTRYPOINT_PATH, "--dry-run", "--out-root", "."], { cwd: REPO_ROOT, encoding: "utf8", timeout: 20000 });
    dryRunRootExit = 0;
  } catch (e) {
    dryRunRootExit = typeof e?.status === "number" ? e.status : null;
    dryRunRootOut = String(e?.stdout || e?.message || e);
  }
  check("--dry-run --out-root . (repo root itself) → exit != 0 (fail-closed)", dryRunRootExit !== 0, `exit=${dryRunRootExit}`);
  check(
    "--dry-run --out-root . did not create render-manifest-local-run-summary.local-mock.json at repo root",
    !existsSync(resolve(REPO_ROOT, "render-manifest-local-run-summary.local-mock.json")),
  );
  check("--dry-run --out-root . failed before spawning local pipeline runner (no runner-specific stdout)", !dryRunRootOut.includes("running local render-manifest dry-run pipeline") || dryRunRootExit !== 0);
}

// --build-content-unit --out-dir . : repo root 자체에 manifest가 생성되면 안 된다.
{
  let bcuRootExit = null;
  try {
    execFileSync(process.execPath, [ENTRYPOINT_PATH, "--build-content-unit", "--summary", LOCAL_SUMMARY_SAMPLE_PATH, "--out-dir", "."], { cwd: REPO_ROOT, encoding: "utf8", timeout: 20000 });
    bcuRootExit = 0;
  } catch (e) {
    bcuRootExit = typeof e?.status === "number" ? e.status : null;
  }
  check("--build-content-unit --out-dir . (repo root itself) → exit != 0 (fail-closed)", bcuRootExit !== 0, `exit=${bcuRootExit}`);
  check(
    "--build-content-unit --out-dir . did not create dual_platform_content_unit.generated.json at repo root",
    !existsSync(resolve(REPO_ROOT, "dual_platform_content_unit.generated.json")),
  );
}

// --plan-youtube-letterbox --out-dir . : repo root 자체에 plan JSON이 생성되면 안 된다.
{
  let plRootExit = null;
  try {
    execFileSync(process.execPath, [ENTRYPOINT_PATH, "--plan-youtube-letterbox", "--content-unit", LETTERBOX_PLAN_SAMPLE_PATH, "--out-dir", "."], { cwd: REPO_ROOT, encoding: "utf8", timeout: 20000 });
    plRootExit = 0;
  } catch (e) {
    plRootExit = typeof e?.status === "number" ? e.status : null;
  }
  check("--plan-youtube-letterbox --out-dir . (repo root itself) → exit != 0 (fail-closed)", plRootExit !== 0, `exit=${plRootExit}`);
  check(
    "--plan-youtube-letterbox --out-dir . did not create youtube-letterbox-source-plan.json at repo root",
    !existsSync(resolve(REPO_ROOT, "youtube-letterbox-source-plan.json")),
  );
}

// --prepare-youtube-letterbox-render --out-dir . : repo root 자체에 request JSON이 생성되면 안 된다.
{
  let prRootExit = null;
  try {
    execFileSync(process.execPath, [ENTRYPOINT_PATH, "--prepare-youtube-letterbox-render", "--plan", LETTERBOX_RENDER_REQUEST_PLAN_SAMPLE_PATH, "--out-dir", "."], { cwd: REPO_ROOT, encoding: "utf8", timeout: 20000 });
    prRootExit = 0;
  } catch (e) {
    prRootExit = typeof e?.status === "number" ? e.status : null;
  }
  check("--prepare-youtube-letterbox-render --out-dir . (repo root itself) → exit != 0 (fail-closed)", prRootExit !== 0, `exit=${prRootExit}`);
  check(
    "--prepare-youtube-letterbox-render --out-dir . did not create youtube-letterbox-render-request.json at repo root",
    !existsSync(resolve(REPO_ROOT, "youtube-letterbox-render-request.json")),
  );
}

// --plan-instagram-blob-upload --out-dir . : repo root 자체에 request JSON이 생성되면 안 된다.
{
  let pibuRootExit = null;
  try {
    execFileSync(process.execPath, [ENTRYPOINT_PATH, "--plan-instagram-blob-upload", "--content-unit", CONTENT_UNIT_SAMPLE_PATH, "--out-dir", "."], { cwd: REPO_ROOT, encoding: "utf8", timeout: 20000 });
    pibuRootExit = 0;
  } catch (e) {
    pibuRootExit = typeof e?.status === "number" ? e.status : null;
  }
  check("--plan-instagram-blob-upload --out-dir . (repo root itself) → exit != 0 (fail-closed)", pibuRootExit !== 0, `exit=${pibuRootExit}`);
  check(
    "--plan-instagram-blob-upload --out-dir . did not create instagram-blob-upload-request.json at repo root",
    !existsSync(resolve(REPO_ROOT, "instagram-blob-upload-request.json")),
  );
}

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

// ── required: content unit manifest parameterization (no-live) ──────────────────
// task: dual-platform-content-unit-manifest-parameterization-no-live-v1
console.log("\n[ required: content unit manifest parameterization ]");
check("entrypoint: --content-unit arg 지원", src.includes("--content-unit"));
check("entrypoint: runPreflightSummary가 contentUnitPath 인자를 orchestrator에 전달", /runPreflightSummary\s*\(\s*contentUnitPath/.test(src) || src.includes('["--preflight", "--content-unit", contentUnitPath]'));
check("entrypoint: --status가 미래 새 영상 content-unit 흐름을 안내", src.includes("futureNewVideoContentUnit") && src.includes("dual_platform_content_unit_v1"));
check("entrypoint: duplicate-guard-check가 custom(non-default) manifest에 --live를 호출하지 않음", src.includes("isDefaultContentUnit") && src.includes("never invokes --live for custom content"));
check(
  "entrypoint: confirmed가 isDefault를 요구(custom content는 --live 미호출)",
  /const\s+confirmed\s*=\s*\n?\s*isDefault\s*&&/.test(src),
);
check("content unit sample fixture 존재", existsSync(CONTENT_UNIT_SAMPLE_PATH));

console.log("\n[ operator smoke: --preflight --content-unit <sample> ]");
let cpfOut = "";
let cpfExit = null;
try {
  cpfOut = execFileSync(process.execPath, [ENTRYPOINT_PATH, "--preflight", "--content-unit", CONTENT_UNIT_SAMPLE_PATH], { cwd: REPO_ROOT, encoding: "utf8", timeout: 30000 });
  cpfExit = 0;
} catch (e) {
  cpfExit = typeof e?.status === "number" ? e.status : null;
  cpfOut = String(e?.stdout || e?.message || e);
}
// sample source 파일은 미존재이므로 preflightOk:false → entrypoint exit 1(정상 fail-closed).
check("--preflight --content-unit: exit 1 (sample source 미존재 → not ready, fail-closed)", cpfExit === 1, `exit=${cpfExit}`);
const cpfJsonMatch = cpfOut.match(/\{[\s\S]*?"currentContentDuplicateBlock"[\s\S]*?\n  \}\n\}/);
let cpfParsed = null;
if (cpfJsonMatch) { try { cpfParsed = JSON.parse(cpfJsonMatch[0]); } catch { cpfParsed = null; } }
check("--preflight --content-unit: JSON parse", !!cpfParsed);
check("--preflight --content-unit: isDefaultContentUnit === false", cpfParsed?.isDefaultContentUnit === false);
check("--preflight --content-unit: contentUnitKind === custom_manifest_content", cpfParsed?.contentUnitKind === "custom_manifest_content");
// task: dual-platform-custom-content-live-credential-gate-no-execute-v1
// orchestrator 계약 변경: custom content의 halt error는 옛 CUSTOM_CONTENT_LIVE_NOT_ENABLED_THIS_SLICE가
// 아니라 credential resolution stub(gate 5) 도달 후의 CREDENTIAL_RESOLUTION_NOT_WIRED_THIS_SLICE다.
// owner entrypoint는 이 값을 orchestrator preflight 출력에서 그대로 surface한다(하드코딩 없음).
check("--preflight --content-unit: customContentLiveHaltError === CREDENTIAL_RESOLUTION_NOT_WIRED_THIS_SLICE", cpfParsed?.customContentLiveHaltError === "CREDENTIAL_RESOLUTION_NOT_WIRED_THIS_SLICE");
check("--preflight --content-unit: stdout secret 값 형태 없음", !/(EAA[A-Za-z0-9]{20}|ya29\.[A-Za-z0-9_-]{20}|vercel_blob_rw_[A-Za-z0-9]{10})/.test(cpfOut));

console.log("\n[ operator smoke: --duplicate-guard-check --content-unit <sample> ]");
let cdgOut = "";
let cdgExit = null;
try {
  cdgOut = execFileSync(process.execPath, [ENTRYPOINT_PATH, "--duplicate-guard-check", "--content-unit", CONTENT_UNIT_SAMPLE_PATH], { cwd: REPO_ROOT, encoding: "utf8", timeout: 30000 });
  cdgExit = 0;
} catch (e) {
  cdgExit = typeof e?.status === "number" ? e.status : null;
  cdgOut = String(e?.stdout || e?.message || e);
}
// custom content는 --live를 호출하지 않고 fail-closed → exit 1.
check("--duplicate-guard-check --content-unit: exit 1 (custom content는 --live 미호출, fail-closed)", cdgExit === 1, `exit=${cdgExit}`);
const cdgJsonMatch = cdgOut.match(/\{[\s\S]*?"currentContentDuplicateBlock"[\s\S]*?\n  \}\n\}/);
let cdgParsed = null;
if (cdgJsonMatch) { try { cdgParsed = JSON.parse(cdgJsonMatch[0]); } catch { cdgParsed = null; } }
check("--duplicate-guard-check --content-unit: JSON parse", !!cdgParsed);
check("--duplicate-guard-check --content-unit: liveInvoked === false (custom content --live 미호출)", cdgParsed?.liveInvoked === false);
check("--duplicate-guard-check --content-unit: isDefaultContentUnit === false", cdgParsed?.isDefaultContentUnit === false);
check("--duplicate-guard-check --content-unit: preflightConfirmedDuplicateBlock === false", cdgParsed?.preflightConfirmedDuplicateBlock === false);
check("--duplicate-guard-check --content-unit: stdout secret 값 형태 없음", !/(EAA[A-Za-z0-9]{20}|ya29\.[A-Za-z0-9_-]{20}|vercel_blob_rw_[A-Za-z0-9]{10})/.test(cdgOut));

// ── required: local-pipeline → content-unit manifest bridge (no-live) ───────────
// task: local-pipeline-content-unit-manifest-bridge-no-live-v1
console.log("\n[ required: --build-content-unit bridge mode ]");
check("local summary sample fixture 존재", existsSync(LOCAL_SUMMARY_SAMPLE_PATH));
check("entrypoint: --status ownerNextSteps에 buildContentUnitFromDryRunSummary 안내", src.includes("buildContentUnitFromDryRunSummary"));
check("entrypoint: --dry-run이 생성된 summary path를 surface", src.includes("render-manifest-local-run-summary.local-mock.json") && /generatedSummaryPath/.test(src));

console.log("\n[ operator smoke: --build-content-unit --summary <sample> ]");
const bcuTmpDir = mkdtempSync(join(os.tmpdir(), "owner-entrypoint-build-content-unit-guard-"));
let bcuOut = "";
let bcuExit = null;
try {
  bcuOut = execFileSync(process.execPath, [ENTRYPOINT_PATH, "--build-content-unit", "--summary", LOCAL_SUMMARY_SAMPLE_PATH, "--out-dir", bcuTmpDir], { cwd: REPO_ROOT, encoding: "utf8", timeout: 30000 });
  bcuExit = 0;
} catch (e) {
  bcuExit = typeof e?.status === "number" ? e.status : null;
  bcuOut = String(e?.stdout || e?.message || e);
}
check("--build-content-unit --summary <sample>: exit 0", bcuExit === 0, `exit=${bcuExit}`);
const generatedManifestPath = join(bcuTmpDir, "dual_platform_content_unit.generated.json");
const generatedBuildSummaryPath = join(bcuTmpDir, "content-unit-build-summary.local-mock.json");
check("--build-content-unit: manifest 파일 생성됨", existsSync(generatedManifestPath));
check("--build-content-unit: build-summary 파일 생성됨", existsSync(generatedBuildSummaryPath));
let bcuBuildSummary = null;
if (existsSync(generatedBuildSummaryPath)) {
  try { bcuBuildSummary = JSON.parse(readFileSync(generatedBuildSummaryPath, "utf-8")); } catch { bcuBuildSummary = null; }
}
check("--build-content-unit: contentUnitPreflightExpectedReady === false (sample source 미완성)", bcuBuildSummary?.contentUnitPreflightExpectedReady === false);
check("--build-content-unit: noLive === true", bcuBuildSummary?.noLive === true);
check("--build-content-unit: stdout secret 값 형태 없음", !/(EAA[A-Za-z0-9]{20}|ya29\.[A-Za-z0-9_-]{20}|vercel_blob_rw_[A-Za-z0-9]{10})/.test(bcuOut));

// 생성된 manifest를 바로 --preflight --content-unit에 연결해도 안전하게 fail-closed 되는지 확인.
let bcuPfExit = null;
let bcuPfOut = "";
if (existsSync(generatedManifestPath)) {
  try {
    bcuPfOut = execFileSync(process.execPath, [ENTRYPOINT_PATH, "--preflight", "--content-unit", generatedManifestPath], { cwd: REPO_ROOT, encoding: "utf8", timeout: 30000 });
    bcuPfExit = 0;
  } catch (e) {
    bcuPfExit = typeof e?.status === "number" ? e.status : null;
    bcuPfOut = String(e?.stdout || e?.message || e);
  }
}
check("--build-content-unit이 만든 manifest → --preflight --content-unit 연결 시 exit 1(예상된 fail-closed)", bcuPfExit === 1, `exit=${bcuPfExit}`);
check("--build-content-unit이 만든 manifest → preflight stdout secret 값 형태 없음", !/(EAA[A-Za-z0-9]{20}|ya29\.[A-Za-z0-9_-]{20}|vercel_blob_rw_[A-Za-z0-9]{10})/.test(bcuPfOut));
try { rmSync(bcuTmpDir, { recursive: true, force: true }); } catch {}

// ── required: YouTube letterbox source planning bridge (no-live, no ffmpeg) ────
// task: owner-youtube-letterbox-source-plan-bridge-no-live-v1
console.log("\n[ required: --plan-youtube-letterbox bridge mode ]");
check("letterbox plan sample fixture 존재", existsSync(LETTERBOX_PLAN_SAMPLE_PATH));
check("entrypoint: --plan-youtube-letterbox MODES 목록에 존재", src.includes("--plan-youtube-letterbox"));
check("entrypoint: planYoutubeLetterboxSourceFromContentUnit import 존재", /import\s*\{\s*planYoutubeLetterboxSourceFromContentUnit\s*\}/.test(src));
check("entrypoint: runPlanYoutubeLetterbox 함수 존재", /function runPlanYoutubeLetterbox/.test(src));
check("entrypoint: --status ownerNextSteps에 planYoutubeLetterboxSource 안내", src.includes("planYoutubeLetterboxSource"));

console.log("\n[ operator smoke: --plan-youtube-letterbox --content-unit <sample> ]");
const plTmpDir = mkdtempSync(join(os.tmpdir(), "owner-entrypoint-plan-youtube-letterbox-guard-"));
let plOut = "";
let plExit = null;
try {
  plOut = execFileSync(process.execPath, [ENTRYPOINT_PATH, "--plan-youtube-letterbox", "--content-unit", LETTERBOX_PLAN_SAMPLE_PATH, "--out-dir", plTmpDir], { cwd: REPO_ROOT, encoding: "utf8", timeout: 30000 });
  plExit = 0;
} catch (e) {
  plExit = typeof e?.status === "number" ? e.status : null;
  plOut = String(e?.stdout || e?.message || e);
}
check("--plan-youtube-letterbox --content-unit <sample>: exit 0", plExit === 0, `exit=${plExit}`);
const generatedPlanPath = join(plTmpDir, "youtube-letterbox-source-plan.json");
check("--plan-youtube-letterbox: plan JSON 파일 생성됨", existsSync(generatedPlanPath));
let plPlan = null;
if (existsSync(generatedPlanPath)) {
  try { plPlan = JSON.parse(readFileSync(generatedPlanPath, "utf-8")); } catch { plPlan = null; }
}
check("--plan-youtube-letterbox: willExecuteFfmpeg === false", plPlan?.willExecuteFfmpeg === false);
check("--plan-youtube-letterbox: inputExists === false (sample instagramSourcePath 의도적 미존재)", plPlan?.inputExists === false);
check("--plan-youtube-letterbox: outputDirOutsideRepo === true", plPlan?.outputDirOutsideRepo === true);
check(
  "--plan-youtube-letterbox: sideEffectCounters 전부 0",
  plPlan?.sideEffectCounters?.ffmpegExecutionCount === 0 &&
    plPlan?.sideEffectCounters?.mediaFilesGeneratedCount === 0 &&
    plPlan?.sideEffectCounters?.apiCallCount === 0 &&
    plPlan?.sideEffectCounters?.envSecretReadCount === 0 &&
    plPlan?.sideEffectCounters?.contentUnitManifestMutationCount === 0,
);
check("--plan-youtube-letterbox: stdout secret 값 형태 없음", !/(EAA[A-Za-z0-9]{20}|ya29\.[A-Za-z0-9_-]{20}|vercel_blob_rw_[A-Za-z0-9]{10})/.test(plOut));
try { rmSync(plTmpDir, { recursive: true, force: true }); } catch {}

// out-dir이 repo 내부면 abort(fail-closed) — mutant 방어.
{
  let plMutantThrew = false;
  try {
    execFileSync(process.execPath, [
      ENTRYPOINT_PATH, "--plan-youtube-letterbox", "--content-unit", LETTERBOX_PLAN_SAMPLE_PATH,
      "--out-dir", resolve(REPO_ROOT, "scripts/fixtures/should-not-be-created-owner-letterbox-plan"),
    ], { cwd: REPO_ROOT, encoding: "utf8", timeout: 30000 });
  } catch (e) {
    plMutantThrew = (e.status ?? 1) !== 0;
  }
  check("--plan-youtube-letterbox: --out-dir이 repo 내부면 exit != 0(fail-closed)", plMutantThrew);
  check(
    "--plan-youtube-letterbox: repo 내부 out-dir 시도가 실제로 디렉터리를 만들지 않음",
    !existsSync(resolve(REPO_ROOT, "scripts/fixtures/should-not-be-created-owner-letterbox-plan")),
  );
}

// ── required: YouTube letterbox render-request preparer (no-execute) ───────────
// task: youtube-letterbox-render-execution-wiring-no-execute-v1
console.log("\n[ required: --prepare-youtube-letterbox-render bridge mode ]");
check("letterbox render-request plan sample fixture 존재", existsSync(LETTERBOX_RENDER_REQUEST_PLAN_SAMPLE_PATH));
check("entrypoint: --prepare-youtube-letterbox-render MODES 목록에 존재", src.includes("--prepare-youtube-letterbox-render"));
check("entrypoint: prepareYoutubeLetterboxRenderFromPlan import 존재", /import\s*\{\s*prepareYoutubeLetterboxRenderFromPlan/.test(src));
check("entrypoint: runPrepareYoutubeLetterboxRender 함수 존재", /function runPrepareYoutubeLetterboxRender/.test(src));
check("entrypoint: --status ownerNextSteps에 prepareYoutubeLetterboxRender 안내", src.includes("prepareYoutubeLetterboxRender"));

console.log("\n[ operator smoke: --prepare-youtube-letterbox-render --plan <sample> ]");
const prTmpDir = mkdtempSync(join(os.tmpdir(), "owner-entrypoint-prepare-youtube-letterbox-render-guard-"));
let prOut = "";
let prExit = null;
try {
  prOut = execFileSync(process.execPath, [ENTRYPOINT_PATH, "--prepare-youtube-letterbox-render", "--plan", LETTERBOX_RENDER_REQUEST_PLAN_SAMPLE_PATH, "--out-dir", prTmpDir], { cwd: REPO_ROOT, encoding: "utf8", timeout: 30000 });
  prExit = 0;
} catch (e) {
  prExit = typeof e?.status === "number" ? e.status : null;
  prOut = String(e?.stdout || e?.message || e);
}
check("--prepare-youtube-letterbox-render --plan <sample>: exit 0", prExit === 0, `exit=${prExit}`);
const generatedRequestPath = join(prTmpDir, "youtube-letterbox-render-request.json");
check("--prepare-youtube-letterbox-render: request JSON 파일 생성됨", existsSync(generatedRequestPath));
let prRequest = null;
if (existsSync(generatedRequestPath)) {
  try { prRequest = JSON.parse(readFileSync(generatedRequestPath, "utf-8")); } catch { prRequest = null; }
}
check("--prepare-youtube-letterbox-render: willExecuteFfmpeg === false", prRequest?.willExecuteFfmpeg === false);
check("--prepare-youtube-letterbox-render: executed === false", prRequest?.executed === false);
check("--prepare-youtube-letterbox-render: inputExists === false (sample instagramSourcePath 의도적 미존재)", prRequest?.inputExists === false);
check(
  "--prepare-youtube-letterbox-render: sideEffectCounters 전부 0",
  prRequest?.sideEffectCounters?.ffmpegExecutionCount === 0 &&
    prRequest?.sideEffectCounters?.mediaFilesGeneratedCount === 0 &&
    prRequest?.sideEffectCounters?.apiCallCount === 0 &&
    prRequest?.sideEffectCounters?.envSecretReadCount === 0 &&
    prRequest?.sideEffectCounters?.planMutationCount === 0,
);
check("--prepare-youtube-letterbox-render: stdout secret 값 형태 없음", !/(EAA[A-Za-z0-9]{20}|ya29\.[A-Za-z0-9_-]{20}|vercel_blob_rw_[A-Za-z0-9]{10})/.test(prOut));
try { rmSync(prTmpDir, { recursive: true, force: true }); } catch {}

// --run 플래그는 fail-closed(exit != 0) — mutant 방어.
{
  const prRunTmpDir = mkdtempSync(join(os.tmpdir(), "owner-entrypoint-prepare-youtube-letterbox-render-run-guard-"));
  let prRunThrew = false;
  try {
    execFileSync(process.execPath, [ENTRYPOINT_PATH, "--prepare-youtube-letterbox-render", "--plan", LETTERBOX_RENDER_REQUEST_PLAN_SAMPLE_PATH, "--out-dir", prRunTmpDir, "--run"], { cwd: REPO_ROOT, encoding: "utf8", timeout: 30000 });
  } catch (e) {
    prRunThrew = (e.status ?? 1) !== 0;
  }
  check("--prepare-youtube-letterbox-render --run: exit != 0(fail-closed)", prRunThrew);
  check(
    "--prepare-youtube-letterbox-render --run: request JSON이 생성되지 않음",
    !existsSync(join(prRunTmpDir, "youtube-letterbox-render-request.json")),
  );
  try { rmSync(prRunTmpDir, { recursive: true, force: true }); } catch {}
}

// out-dir이 repo 내부면 abort(fail-closed) — mutant 방어.
{
  let prMutantThrew = false;
  try {
    execFileSync(process.execPath, [
      ENTRYPOINT_PATH, "--prepare-youtube-letterbox-render", "--plan", LETTERBOX_RENDER_REQUEST_PLAN_SAMPLE_PATH,
      "--out-dir", resolve(REPO_ROOT, "scripts/fixtures/should-not-be-created-owner-render-request"),
    ], { cwd: REPO_ROOT, encoding: "utf8", timeout: 30000 });
  } catch (e) {
    prMutantThrew = (e.status ?? 1) !== 0;
  }
  check("--prepare-youtube-letterbox-render: --out-dir이 repo 내부면 exit != 0(fail-closed)", prMutantThrew);
  check(
    "--prepare-youtube-letterbox-render: repo 내부 out-dir 시도가 실제로 디렉터리를 만들지 않음",
    !existsSync(resolve(REPO_ROOT, "scripts/fixtures/should-not-be-created-owner-render-request")),
  );
}

// ── required: --render-youtube-letterbox-once approval-gated mode ──────────────
// task: youtube-letterbox-local-render-execution-once-v1
// NOTE: approval 없이 실행하는 fail-closed 경로만 검사한다 — 이 경로는 하위 runner에 도달하기
// 전에 abort하므로 ffmpeg를 절대 호출하지 않는다(렌더 재실행 아님).
console.log("\n[ required: --render-youtube-letterbox-once approval-gated mode ]");
check("entrypoint: --render-youtube-letterbox-once MODES 목록에 존재", src.includes("--render-youtube-letterbox-once"));
check("entrypoint: runRenderYoutubeLetterboxOnce 함수 존재", /function runRenderYoutubeLetterboxOnce/.test(src));
check("entrypoint: approval token 상수 = APPROVE_YOUTUBE_LETTERBOX_LOCAL_RENDER_EXECUTION_ONCE", src.includes("APPROVE_YOUTUBE_LETTERBOX_LOCAL_RENDER_EXECUTION_ONCE"));
check(
  "entrypoint: runRenderYoutubeLetterboxOnce에서 approval token 불일치면 runScript 호출 전에 abort",
  (() => {
    const fnStart = src.indexOf("function runRenderYoutubeLetterboxOnce");
    const fnEnd = src.indexOf("\n}\n", fnStart);
    const fnBody = src.slice(fnStart, fnEnd === -1 ? undefined : fnEnd);
    const abortIdx = fnBody.indexOf("ABORT: --render-youtube-letterbox-once requires the exact");
    const runIdx = fnBody.indexOf("runScript(");
    return abortIdx !== -1 && runIdx !== -1 && abortIdx < runIdx;
  })(),
);

{
  // approval 없이 → exit != 0 (하위 runner 미도달, ffmpeg 미실행).
  let noApprovalThrew = false;
  let noApprovalOut = "";
  try {
    noApprovalOut = execFileSync(process.execPath, [ENTRYPOINT_PATH, "--render-youtube-letterbox-once"], { cwd: REPO_ROOT, encoding: "utf8", timeout: 30000 });
  } catch (e) {
    noApprovalThrew = (e.status ?? 1) !== 0;
    noApprovalOut = String(e?.stdout || e?.message || e);
  }
  check("--render-youtube-letterbox-once: approval 없음 → exit != 0(fail-closed)", noApprovalThrew);
  check("--render-youtube-letterbox-once: approval 없음 → 하위 runner 위임 없이 ABORT 메시지", /requires the exact --approval/.test(noApprovalOut));
}
{
  // 잘못된 approval → exit != 0.
  let wrongApprovalThrew = false;
  try {
    execFileSync(process.execPath, [ENTRYPOINT_PATH, "--render-youtube-letterbox-once", "--approval", "WRONG_TOKEN"], { cwd: REPO_ROOT, encoding: "utf8", timeout: 30000 });
  } catch (e) {
    wrongApprovalThrew = (e.status ?? 1) !== 0;
  }
  check("--render-youtube-letterbox-once: 잘못된 approval → exit != 0(fail-closed)", wrongApprovalThrew);
}

// ── required: ready golden sample shortcuts (package scripts + status + smoke) ──
// task: owner-entrypoint-golden-ready-shortcuts-no-live-v1
console.log("\n[ required: ready golden sample fixture + package scripts ]");
check("ready golden sample fixture exists", existsSync(READY_GOLDEN_SAMPLE_CONTENT_UNIT_PATH));

const packageJsonRaw = existsSync(PACKAGE_JSON_PATH) ? readFileSync(PACKAGE_JSON_PATH, "utf-8") : "";
let packageJson = null;
try { packageJson = JSON.parse(packageJsonRaw); } catch { packageJson = null; }
check("package.json parses", packageJson != null);
const readyPreflightScript = packageJson?.scripts?.["owner:ready-preflight"];
const readyDupGuardScript = packageJson?.scripts?.["owner:ready-duplicate-guard-check"];
check(
  "package.json owner:ready-preflight script exists and uses the exact ready fixture path",
  typeof readyPreflightScript === "string" &&
    readyPreflightScript.includes("--preflight") &&
    readyPreflightScript.includes(READY_GOLDEN_SAMPLE_CONTENT_UNIT_RELATIVE),
);
check(
  "package.json owner:ready-duplicate-guard-check script exists and uses the exact ready fixture path",
  typeof readyDupGuardScript === "string" &&
    readyDupGuardScript.includes("--duplicate-guard-check") &&
    readyDupGuardScript.includes(READY_GOLDEN_SAMPLE_CONTENT_UNIT_RELATIVE),
);
const EXPECTED_DEPENDENCY_NAMES = [
  "@supabase/supabase-js", "@vercel/blob", "clsx", "googleapis", "lucide-react",
  "next", "openai", "react", "react-dom", "tailwind-merge", "zustand",
];
const EXPECTED_DEV_DEPENDENCY_NAMES = [
  "@tailwindcss/postcss", "@types/node", "@types/react", "@types/react-dom",
  "eslint", "eslint-config-next", "playwright", "tailwindcss", "typescript",
];
check(
  "package.json dependencies unchanged (exact same key set as before this task)",
  packageJson != null &&
    JSON.stringify(Object.keys(packageJson.dependencies ?? {}).sort()) === JSON.stringify([...EXPECTED_DEPENDENCY_NAMES].sort()),
);
check(
  "package.json devDependencies unchanged (exact same key set as before this task)",
  packageJson != null &&
    JSON.stringify(Object.keys(packageJson.devDependencies ?? {}).sort()) === JSON.stringify([...EXPECTED_DEV_DEPENDENCY_NAMES].sort()),
);

check(
  "entrypoint: READY_GOLDEN_SAMPLE_CONTENT_UNIT constant references the exact ready fixture path",
  src.includes("dual_platform_content_unit.t1_lifestyle_inflation.v3_2.ready.v1.json"),
);
check(
  "entrypoint: --status output includes readyGoldenSampleContentUnit block",
  src.includes("readyGoldenSampleContentUnit"),
);
check(
  "entrypoint: --status output mentions pnpm owner:ready-preflight",
  src.includes("pnpm owner:ready-preflight"),
);
check(
  "entrypoint: --status output mentions pnpm owner:ready-duplicate-guard-check",
  src.includes("pnpm owner:ready-duplicate-guard-check"),
);

console.log("\n[ operator smoke: --status includes ready fixture path/commands ]");
check("--status stdout includes ready fixture path", statusOut.includes(READY_GOLDEN_SAMPLE_CONTENT_UNIT_RELATIVE) || statusOut.includes(READY_GOLDEN_SAMPLE_CONTENT_UNIT_PATH));
check("--status stdout includes pnpm owner:ready-preflight", statusOut.includes("pnpm owner:ready-preflight"));
check("--status stdout includes pnpm owner:ready-duplicate-guard-check", statusOut.includes("pnpm owner:ready-duplicate-guard-check"));
check(
  "--status readyGoldenSampleContentUnit.path matches the exact ready fixture (JSON)",
  statusParsed?.readyGoldenSampleContentUnit?.path === READY_GOLDEN_SAMPLE_CONTENT_UNIT_PATH,
);

console.log("\n[ operator smoke: --preflight --content-unit <ready fixture> ]");
let readyPfOut = "";
let readyPfExit = null;
try {
  readyPfOut = execFileSync(process.execPath, [ENTRYPOINT_PATH, "--preflight", "--content-unit", READY_GOLDEN_SAMPLE_CONTENT_UNIT_PATH], { cwd: REPO_ROOT, encoding: "utf8", timeout: 30000 });
  readyPfExit = 0;
} catch (e) {
  readyPfExit = typeof e?.status === "number" ? e.status : null;
  readyPfOut = String(e?.stdout || e?.message || e);
}
check("--preflight --content-unit <ready fixture>: exit 0", readyPfExit === 0, `exit=${readyPfExit}`);
const readyPfJsonMatch = readyPfOut.match(/\{[\s\S]*?"currentContentDuplicateBlock"[\s\S]*?\n  \}\n\}/);
let readyPfParsed = null;
if (readyPfJsonMatch) { try { readyPfParsed = JSON.parse(readyPfJsonMatch[0]); } catch { readyPfParsed = null; } }
check("--preflight --content-unit <ready fixture>: JSON parse", !!readyPfParsed);
check("--preflight --content-unit <ready fixture>: preflightOk === true", readyPfParsed?.preflightOk === true);
check("--preflight --content-unit <ready fixture>: sourceFilesReady === true", readyPfParsed?.sourceFilesReady === true);
check("--preflight --content-unit <ready fixture>: stdout secret 값 형태 없음", !/(EAA[A-Za-z0-9]{20}|ya29\.[A-Za-z0-9_-]{20}|vercel_blob_rw_[A-Za-z0-9]{10})/.test(readyPfOut));

console.log("\n[ operator smoke: --duplicate-guard-check --content-unit <ready fixture> ]");
let readyDgOut = "";
let readyDgExit = null;
try {
  readyDgOut = execFileSync(process.execPath, [ENTRYPOINT_PATH, "--duplicate-guard-check", "--content-unit", READY_GOLDEN_SAMPLE_CONTENT_UNIT_PATH], { cwd: REPO_ROOT, encoding: "utf8", timeout: 30000 });
  readyDgExit = 0;
} catch (e) {
  readyDgExit = typeof e?.status === "number" ? e.status : null;
  readyDgOut = String(e?.stdout || e?.message || e);
}
check("--duplicate-guard-check --content-unit <ready fixture>: exit 0 (expected safe block)", readyDgExit === 0, `exit=${readyDgExit}`);
const readyDgJsonMatch = readyDgOut.match(/\{[\s\S]*?"existingEvidence"[\s\S]*?\n  \}\n\}/);
let readyDgParsed = null;
if (readyDgJsonMatch) { try { readyDgParsed = JSON.parse(readyDgJsonMatch[0]); } catch { readyDgParsed = null; } }
check("--duplicate-guard-check --content-unit <ready fixture>: JSON parse", !!readyDgParsed);
check("--duplicate-guard-check --content-unit <ready fixture>: isExpectedSafeBlock === true", readyDgParsed?.isExpectedSafeBlock === true);
check("--duplicate-guard-check --content-unit <ready fixture>: liveExitCode === 3", readyDgParsed?.liveExitCode === 3);
check("--duplicate-guard-check --content-unit <ready fixture>: liveStatus === BLOCKED_DUPLICATE_ALREADY_PUBLISHED", readyDgParsed?.liveStatus === "BLOCKED_DUPLICATE_ALREADY_PUBLISHED");
check("--duplicate-guard-check --content-unit <ready fixture>: treatedAsPublishSuccess === false", readyDgParsed?.treatedAsPublishSuccess === false);
check("--duplicate-guard-check --content-unit <ready fixture>: sideEffectCountersAllZero === true", readyDgParsed?.sideEffectCountersAllZero === true);
check("--duplicate-guard-check --content-unit <ready fixture>: stdout secret 값 형태 없음", !/(EAA[A-Za-z0-9]{20}|ya29\.[A-Za-z0-9_-]{20}|vercel_blob_rw_[A-Za-z0-9]{10})/.test(readyDgOut));

// ── required: --credential-preflight (redacted presence, no values) ──────────────
// task: dual-platform-credential-preflight-redacted-no-live-v1
console.log("\n[ required: --credential-preflight (redacted env key presence, no values) ]");
check("--credential-preflight mode present in MODES", src.includes('"--credential-preflight"'));
check("runCredentialPreflight handler present", src.includes("function runCredentialPreflight"));

let cpOut = "";
let cpExit = null;
try {
  cpOut = execFileSync(process.execPath, [ENTRYPOINT_PATH, "--credential-preflight"], { cwd: REPO_ROOT, encoding: "utf8", timeout: 30000 });
  cpExit = 0;
} catch (e) {
  cpExit = typeof e?.status === "number" ? e.status : null;
  cpOut = String(e?.stdout || e?.message || e);
}
check("--credential-preflight: exit 0 (status-style diagnostic)", cpExit === 0, `exit=${cpExit}`);
const cpJsonMatch = cpOut.match(/\{[\s\S]*"readyForCredentialResolution"[\s\S]*?\n\}/);
let cpParsed = null;
if (cpJsonMatch) { try { cpParsed = JSON.parse(cpJsonMatch[0]); } catch { cpParsed = null; } }
check("--credential-preflight: JSON summary parse", !!cpParsed);
check("--credential-preflight: mode === credential_preflight", cpParsed?.mode === "credential_preflight");
check("--credential-preflight: noLive === true", cpParsed?.noLive === true);
check("--credential-preflight: credentialValuesAccessed === false", cpParsed?.credentialValuesAccessed === false);
check("--credential-preflight: credentialValuesPrinted === false", cpParsed?.credentialValuesPrinted === false);
check("--credential-preflight: dotEnvLocalDirectAccess === false", cpParsed?.dotEnvLocalDirectAccess === false);
check("--credential-preflight: externalApiCallPerformed === false", cpParsed?.externalApiCallPerformed === false);
check("--credential-preflight: credentialResolutionWiredThisSlice === false (presence여도 publish 비활성)", cpParsed?.credentialResolutionWiredThisSlice === false);
// key 엔트리는 name+present 필드만 (값/길이/hash 필드 없음)
const cpEntries = [
  ...(cpParsed?.platforms?.instagram?.keys ?? []),
  ...(cpParsed?.platforms?.youtube?.keys ?? []),
  ...(cpParsed?.platforms?.vercelBlob?.keys ?? []),
];
check("--credential-preflight: 각 key 엔트리는 name+present 필드만(6개)", cpEntries.length === 6 && cpEntries.every((k) => JSON.stringify(Object.keys(k).sort()) === JSON.stringify(["name", "present"])));
check("--credential-preflight: 출력에 value length/hash/prefix/suffix/sample 필드 없음", !/"(valueLength|length|hash|prefix|suffix|sample|masked|redactedValue|firstChars|lastChars|tokenType)"\s*:/.test(cpOut));
check("--credential-preflight: 출력에 secret-shaped value 없음", !/(EAA[A-Za-z0-9]{10}|ya29\.[A-Za-z0-9_-]{10}|vercel_blob_rw_[A-Za-z0-9]{6})/.test(cpOut));

// present-probe: env에 더미값 주입 → present:true지만 값은 절대 출력에 나타나지 않음.
// sanitized child env를 쓴다(parent env 전체 spread 금지 — 우발적 secret 상속 방지).
const OWNER_CP_DUMMY = "owner_guard_dummy_zzz";
const ownerCpEnv = buildSanitizedProbeEnv(
  ["INSTAGRAM_BUSINESS_ACCOUNT_ID", "INSTAGRAM_ACCESS_TOKEN", "YOUTUBE_CLIENT_ID", "YOUTUBE_CLIENT_SECRET", "YOUTUBE_REFRESH_TOKEN", "BLOB_READ_WRITE_TOKEN"],
  OWNER_CP_DUMMY,
);
let ownerCpPresentOut = "";
let ownerCpPresentExit = null;
try {
  ownerCpPresentOut = execFileSync(process.execPath, [ENTRYPOINT_PATH, "--credential-preflight"], { cwd: REPO_ROOT, encoding: "utf8", timeout: 30000, env: ownerCpEnv });
  ownerCpPresentExit = 0;
} catch (e) {
  ownerCpPresentExit = typeof e?.status === "number" ? e.status : null;
  ownerCpPresentOut = String(e?.stdout || e?.message || e);
}
check("--credential-preflight present-probe: exit 0", ownerCpPresentExit === 0, `exit=${ownerCpPresentExit}`);
check("--credential-preflight present-probe: 더미 credential 값이 출력에 절대 나타나지 않음(값 미노출)", ownerCpPresentOut !== "" && !ownerCpPresentOut.includes(OWNER_CP_DUMMY));
{
  const m = ownerCpPresentOut.match(/\{[\s\S]*"readyForCredentialResolution"[\s\S]*?\n\}/);
  let p = null; if (m) { try { p = JSON.parse(m[0]); } catch { p = null; } }
  check("--credential-preflight present-probe: allRequiredKeysPresent === true + readyForCredentialResolution === true", p?.allRequiredKeysPresent === true && p?.readyForCredentialResolution === true);
}

// live behavior 회귀: default --duplicate-guard-check 여전히 exit 0 + liveExitCode 3 (credential-preflight 추가가 live 동작 불변)
check("--credential-preflight: entrypoint 소스가 여전히 process.env를 직접 접근하지 않음(orchestrator에 위임)", !code.includes("process.env"));

// ── required: runbook doc ───────────────────────────────────────────────────────
console.log("\n[ required: owner runbook doc ]");
check("runbook file exists", existsSync(RUNBOOK_PATH));
const runbookRaw = existsSync(RUNBOOK_PATH) ? readFileSync(RUNBOOK_PATH, "utf-8") : "";
check("runbook mentions --status/--dry-run/--preflight/--duplicate-guard-check", ["--status", "--dry-run", "--preflight", "--duplicate-guard-check"].every((m) => runbookRaw.includes(m)));
check("runbook explains why current content will not repost", /재게시되지 않는가|will not repost/i.test(runbookRaw));
check("runbook references Instagram media_id 17916511431199303", runbookRaw.includes("17916511431199303"));
check("runbook references YouTube videoId r9jhckdpC9w", runbookRaw.includes("r9jhckdpC9w"));
check("runbook explains .env.local is not read directly by this entrypoint", runbookRaw.includes(".env.local"));
check("runbook explains --content-unit for future new videos", runbookRaw.includes("--content-unit") && runbookRaw.includes("dual_platform_content_unit_v1"));
// task: dual-platform-credential-preflight-review-fix-v1 (Codex finding A)
// runbook은 옛 무조건 custom halt(CUSTOM_CONTENT_LIVE_NOT_ENABLED_THIS_SLICE/exit 5)가 아니라
// 현재 계약(gate 1~4 통과 시 credential stub 도달 → CREDENTIAL_RESOLUTION_NOT_WIRED_THIS_SLICE/exit 4)을
// 설명해야 한다. custom content 실제 halt 사유도 credential_resolution_not_wired_this_slice여야 한다.
check("runbook explains custom content credential-gate fail-closed (CREDENTIAL_RESOLUTION_NOT_WIRED_THIS_SLICE)", /CREDENTIAL_RESOLUTION_NOT_WIRED_THIS_SLICE/.test(runbookRaw));
check("runbook uses current custom block reason (credential_resolution_not_wired_this_slice)", /credential_resolution_not_wired_this_slice/.test(runbookRaw));
check("runbook explains custom ready content reaches credential gate 5 stub (exit 4)", /exit 4/.test(runbookRaw) && /gate 5|credential (resolution )?stub/i.test(runbookRaw));
// 옛 block reason(custom_content_live_not_enabled_this_slice)이 남으면 실패(active/historical 무관하게 이 소문자 토큰은 제거 대상).
check("runbook does NOT keep stale block reason (no custom_content_live_not_enabled_this_slice)", !/custom_content_live_not_enabled_this_slice/.test(runbookRaw));
// 옛 halt 상수(CUSTOM_CONTENT_LIVE_NOT_ENABLED_THIS_SLICE)는 "제거됐다"는 historical 문맥에서만 허용.
// 남아 있다면 반드시 인근에 "제거"/"옛"/"더 이상" 같은 historical marker가 있어야 한다.
check("runbook: any CUSTOM_CONTENT_LIVE_NOT_ENABLED_THIS_SLICE mention is historical-only (removed)",
  (() => {
    if (!/CUSTOM_CONTENT_LIVE_NOT_ENABLED_THIS_SLICE/.test(runbookRaw)) return true; // 아예 없으면 OK
    // 언급이 있으면 문서 전체에 "제거"/"옛"/"removed"/"no longer" historical marker가 함께 있어야 한다.
    return /(제거|옛 |removed|no longer|더 이상)/i.test(runbookRaw);
  })());
check("runbook has no secret value shape", !/(EAA[A-Za-z0-9]{20}|ya29\.[A-Za-z0-9_-]{20}|vercel_blob_rw_[A-Za-z0-9]{10})/.test(runbookRaw));
check("runbook mentions pnpm owner:ready-preflight", runbookRaw.includes("pnpm owner:ready-preflight"));
check("runbook mentions pnpm owner:ready-duplicate-guard-check", runbookRaw.includes("pnpm owner:ready-duplicate-guard-check"));
check(
  "runbook explains ready commands are no-live readiness / duplicate-safe block, not repost",
  /재게시가 아니|not.*repost|no-live/i.test(runbookRaw),
);

// ── self-regression: guard 소스에 parent env 전체 spread 없음 (Codex finding B) ──
// 실제 spread 문법(여는 괄호/중괄호/대괄호/콤마 뒤의 ...process.env)만 매치한다 — 주석/문자열/정규식
// 리터럴 안의 단독 "...process.env" 텍스트는 매치하지 않으므로 이 검증 자신을 오탐하지 않는다.
console.log("\n[ self-regression: no parent env broad spread in guards ]");
{
  const OWNER_GUARD_SELF = fileURLToPath(import.meta.url);
  const ORCH_GUARD_PATH = resolve(REPO_ROOT, "scripts/check-dual-platform-final-publish-orchestrator-static.mjs");
  const dropCommentLines = (s) => s.split("\n").filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l)).join("\n");
  const spreadSyntaxRe = /[{[(,]\s*\.\.\.\s*process\s*\.\s*env\b/; // 실제 spread 표현식만
  const ownerGuardCode = dropCommentLines(existsSync(OWNER_GUARD_SELF) ? readFileSync(OWNER_GUARD_SELF, "utf-8") : "");
  const orchGuardCode = dropCommentLines(existsSync(ORCH_GUARD_PATH) ? readFileSync(ORCH_GUARD_PATH, "utf-8") : "");
  check("owner guard 소스에 parent env 전체 spread 표현식 없음(sanitized child env만 사용)", !spreadSyntaxRe.test(ownerGuardCode));
  check("orchestrator guard 소스에 parent env 전체 spread 표현식 없음(sanitized child env만 사용)", orchGuardCode !== "" && !spreadSyntaxRe.test(orchGuardCode));
  check("owner guard present-probe가 sanitized child env helper(buildSanitizedProbeEnv) 사용", ownerGuardCode.includes("buildSanitizedProbeEnv"));
  // guard가 다룬 credential-preflight 출력에 secret-shaped value 없음(수집한 stdout 전체).
  check("owner guard: 수집한 credential-preflight 출력에 secret-shaped value 없음",
    [cpOut ?? "", ownerCpPresentOut ?? ""].every((s) => !/(EAA[A-Za-z0-9]{10}|ya29\.[A-Za-z0-9_-]{10}|vercel_blob_rw_[A-Za-z0-9]{6})/.test(s)));
}

console.log(`\n${passed + failed} checks — ${passed} PASS, ${failed} FAIL\n`);

if (failed > 0) {
  process.exit(1);
}
