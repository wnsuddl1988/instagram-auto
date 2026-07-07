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
const CONTENT_UNIT_SAMPLE_PATH = resolve(REPO_ROOT, "scripts/fixtures/dual_platform_content_unit.sample.v1.json");
const LOCAL_SUMMARY_SAMPLE_PATH = resolve(REPO_ROOT, "scripts/fixtures/dual_platform_content_unit_from_local_summary.sample.v1.json");
const LETTERBOX_PLAN_SAMPLE_PATH = resolve(REPO_ROOT, "scripts/fixtures/youtube_letterbox_source_plan_from_content_unit.sample.v1.json");
const LETTERBOX_RENDER_REQUEST_PLAN_SAMPLE_PATH = resolve(REPO_ROOT, "scripts/fixtures/youtube_letterbox_render_request_from_plan.sample.v1.json");

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
check("--preflight --content-unit: customContentLiveHaltError === CUSTOM_CONTENT_LIVE_NOT_ENABLED_THIS_SLICE", cpfParsed?.customContentLiveHaltError === "CUSTOM_CONTENT_LIVE_NOT_ENABLED_THIS_SLICE");
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
check("runbook explains custom content live is fail-closed this slice", /CUSTOM_CONTENT_LIVE_NOT_ENABLED_THIS_SLICE/.test(runbookRaw));
check("runbook has no secret value shape", !/(EAA[A-Za-z0-9]{20}|ya29\.[A-Za-z0-9_-]{20}|vercel_blob_rw_[A-Za-z0-9]{10})/.test(runbookRaw));

console.log(`\n${passed + failed} checks — ${passed} PASS, ${failed} FAIL\n`);

if (failed > 0) {
  process.exit(1);
}
