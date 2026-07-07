#!/usr/bin/env node
/**
 * check-dual-platform-content-unit-final-readiness-static.mjs
 *
 * Static/readiness guard: verifies the real golden-sample content unit fixture
 * (t1_lifestyle_inflation/v3_2) and confirms orchestrator `--preflight` passes no-live.
 * task: golden-sample-content-unit-final-readiness-no-live-v1
 *
 * Dependency-free, no-live. This guard:
 * - parses the fixture JSON and the existing (already completed) evidence result JSONs read-only
 * - checks source mp4 existence/size with fs.existsSync/statSync only (no ffmpeg/ffprobe)
 * - validates metadata gate expectations against the fixture content
 * - runs `node scripts/run-dual-platform-final-publish-orchestrator.mjs --preflight --content-unit <fixture>`
 *   as a child process and asserts on its JSON stdout
 * - never runs --live/--arm, never calls any API/SDK, never touches env/secret values
 *
 * Exit 0 = all PASS. Exit 1 = at least one FAIL.
 */

import { readFileSync, existsSync, statSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");

const FIXTURE_PATH = resolve(__dirname, "fixtures", "dual_platform_content_unit.t1_lifestyle_inflation.v3_2.ready.v1.json");
const ORCHESTRATOR_PATH = resolve(__dirname, "run-dual-platform-final-publish-orchestrator.mjs");

const LIVENESS_RESULT_PATH = "C:\\tmp\\money-shorts-os\\instagram-existing-blob-liveness-no-arm-v1\\instagram-existing-blob-liveness-result.json";
const YOUTUBE_RENDER_RESULT_PATH = "C:\\tmp\\money-shorts-os\\youtube-letterbox-local-render-execution-once-v1\\youtube-letterbox-render-result.json";

const EXPECTED_INSTAGRAM_SIZE = 20294549;
const EXPECTED_YOUTUBE_SIZE = 7349425;

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

console.log("\nReadiness guard: golden-sample content unit final readiness (t1_lifestyle_inflation/v3_2, no-live)\n");

// ── 1. fixture JSON parse ────────────────────────────────────────────────────────
console.log("[ fixture JSON parse ]");
check("fixture file exists", existsSync(FIXTURE_PATH));
let fixture = null;
try {
  fixture = JSON.parse(readFileSync(FIXTURE_PATH, "utf-8"));
  console.log("  PASS  fixture JSON parses");
  passed++;
} catch (e) {
  console.error(`  FAIL  fixture JSON parses — ${String(e?.message ?? e)}`);
  failed++;
}

if (fixture) {
  check("schemaVersion === dual_platform_content_unit_v1", fixture.schemaVersion === "dual_platform_content_unit_v1");
  check("contentId === t1_lifestyle_inflation", fixture.contentId === "t1_lifestyle_inflation");
  check("version === v3_2", fixture.version === "v3_2");
  check("instagramSourcePath is a non-empty string", typeof fixture.instagramSourcePath === "string" && fixture.instagramSourcePath.length > 0);
  check("youtubeSourcePath is a non-empty string", typeof fixture.youtubeSourcePath === "string" && fixture.youtubeSourcePath.length > 0);
}

// ── 2. existing liveness result JSON (read-only parse) ──────────────────────────
console.log("\n[ existing Blob liveness result (read-only parse, no new network HEAD) ]");
check("liveness result file exists", existsSync(LIVENESS_RESULT_PATH));
let liveness = null;
if (existsSync(LIVENESS_RESULT_PATH)) {
  try {
    liveness = JSON.parse(readFileSync(LIVENESS_RESULT_PATH, "utf-8"));
    console.log("  PASS  liveness result JSON parses");
    passed++;
  } catch (e) {
    console.error(`  FAIL  liveness result JSON parses — ${String(e?.message ?? e)}`);
    failed++;
  }
}
if (liveness) {
  check("liveness status === LIVE_PUBLIC_URL_OK", liveness.status === "LIVE_PUBLIC_URL_OK");
  check("liveness headStatus === 200", liveness.headStatus === 200);
  check("liveness contentType === video/mp4", liveness.contentType === "video/mp4");
  check("liveness contentLength === 20294549", liveness.contentLength === 20294549);
  check("liveness livenessOk === true", liveness.livenessOk === true);
}

// ── 3. existing YouTube render result JSON (read-only parse) ────────────────────
console.log("\n[ existing YouTube letterbox render result (read-only parse, no ffmpeg re-run) ]");
check("youtube render result file exists", existsSync(YOUTUBE_RENDER_RESULT_PATH));
let ytRender = null;
if (existsSync(YOUTUBE_RENDER_RESULT_PATH)) {
  try {
    ytRender = JSON.parse(readFileSync(YOUTUBE_RENDER_RESULT_PATH, "utf-8"));
    console.log("  PASS  youtube render result JSON parses");
    passed++;
  } catch (e) {
    console.error(`  FAIL  youtube render result JSON parses — ${String(e?.message ?? e)}`);
    failed++;
  }
}
if (ytRender) {
  check("youtube render executed === true", ytRender.executed === true);
  check("youtube render allVerificationsPass === true", ytRender.allVerificationsPass === true);
  check("youtube render outputSizeBytes === 7349425", ytRender.outputSizeBytes === EXPECTED_YOUTUBE_SIZE);
  check(
    "fixture.youtubeSourcePath matches render result outputPath",
    fixture && typeof fixture.youtubeSourcePath === "string" && typeof ytRender.outputPath === "string" &&
      resolve(fixture.youtubeSourcePath) === resolve(ytRender.outputPath),
  );
}

// ── 4. source file existence + expected size (fs.existsSync/statSync only) ──────
console.log("\n[ source file presence + size (existsSync/statSync only — no ffprobe) ]");
if (fixture) {
  const igExists = typeof fixture.instagramSourcePath === "string" && existsSync(fixture.instagramSourcePath);
  check("instagram source mp4 exists", igExists);
  if (igExists) {
    const igSize = statSync(fixture.instagramSourcePath).size;
    check(`instagram source size === ${EXPECTED_INSTAGRAM_SIZE}`, igSize === EXPECTED_INSTAGRAM_SIZE, `actual=${igSize}`);
  }
  const ytExists = typeof fixture.youtubeSourcePath === "string" && existsSync(fixture.youtubeSourcePath);
  check("youtube source mp4 exists", ytExists);
  if (ytExists) {
    const ytSize = statSync(fixture.youtubeSourcePath).size;
    check(`youtube source size === ${EXPECTED_YOUTUBE_SIZE}`, ytSize === EXPECTED_YOUTUBE_SIZE, `actual=${ytSize}`);
  }
}

// ── 5. metadata gate expectations (fixture content only, no orchestrator import) ─
console.log("\n[ metadata gate expectations (fixture content) ]");
if (fixture) {
  const ig = fixture.instagramMetadata ?? {};
  const yt = fixture.youtubeMetadata ?? {};
  const igHashtags = Array.isArray(ig.hashtags) ? ig.hashtags : [];
  const ytTags = Array.isArray(yt.tags) ? yt.tags : [];
  const disallowedPattern = /(챌린지|viral|trend|밈|fyp|fypシ)/i;

  check("instagram captionFirstLineHook non-empty", typeof ig.captionFirstLineHook === "string" && ig.captionFirstLineHook.trim() !== "");
  check("instagram caption non-empty", typeof ig.caption === "string" && ig.caption.trim() !== "");
  check("instagram hashtags count in [8,12]", igHashtags.length >= 8 && igHashtags.length <= 12, `count=${igHashtags.length}`);
  check("instagram hashtags contain no disallowed trend tags", !igHashtags.some((t) => disallowedPattern.test(String(t))));
  check("instagram callToAction non-empty", typeof ig.callToAction === "string" && ig.callToAction.trim() !== "");
  check("instagram forbiddenUnrelatedTrendTags === true", ig.forbiddenUnrelatedTrendTags === true);

  check("youtube titleBase non-empty", typeof yt.titleBase === "string" && yt.titleBase.trim() !== "");
  check("youtube titleWithShortsSuffix non-empty", typeof yt.titleWithShortsSuffix === "string" && yt.titleWithShortsSuffix.trim() !== "");
  check("youtube descriptionBase non-empty", typeof yt.descriptionBase === "string" && yt.descriptionBase.trim() !== "");
  check("youtube tags non-empty", ytTags.length > 0);
  check("youtube tags contain no disallowed trend tags", !ytTags.some((t) => disallowedPattern.test(String(t))));
  check("youtube categoryId === 22", yt.categoryId === "22");
  check("youtube defaultLanguage === ko", yt.defaultLanguage === "ko");
  check("youtube privacyStatus === public", yt.privacyStatus === "public");
  check("youtube selfDeclaredMadeForKids === false", yt.selfDeclaredMadeForKids === false);

  const bl = fixture.blobPublicUrlLivenessEvidence ?? {};
  check("fixture blobPublicUrlLivenessEvidence.url is https vercel-storage mp4", typeof bl.url === "string" && bl.url.startsWith("https://") && bl.url.includes(".public.blob.vercel-storage.com/") && bl.url.endsWith(".mp4"));
  check("fixture blobPublicUrlLivenessEvidence.headStatus === 200", bl.headStatus === 200);
  check("fixture blobPublicUrlLivenessEvidence.contentType === video/mp4", bl.contentType === "video/mp4");
  check("fixture blobPublicUrlLivenessEvidence.contentLength === 20294549", bl.contentLength === EXPECTED_INSTAGRAM_SIZE);
}

// ── 6/7. run orchestrator --preflight --content-unit <fixture> (no --live/--arm) ─
console.log("\n[ orchestrator --preflight --content-unit <fixture> (no --live, no --arm) ]");
let preflightOut = null;
try {
  const stdout = execFileSync(
    process.execPath,
    [ORCHESTRATOR_PATH, "--preflight", "--content-unit", FIXTURE_PATH],
    { cwd: REPO_ROOT, encoding: "utf8", timeout: 30000 },
  );
  preflightOut = JSON.parse(stdout);
  console.log("  PASS  orchestrator --preflight ran and produced parseable JSON");
  passed++;
} catch (e) {
  console.error(`  FAIL  orchestrator --preflight ran and produced parseable JSON — ${String(e?.message ?? e)}`);
  failed++;
}

if (preflightOut) {
  const pf = preflightOut.preflight ?? {};
  check("preflightOk === true", pf.preflightOk === true);
  check("sourceFilesReady === true", pf.sourceFilesReady === true);
  check("blobPublicUrlLivenessEvidence.ok === true", pf.blobPublicUrlLivenessEvidence?.ok === true);
  check("contentUnit.blobLivenessEvidenceOk === true", pf.contentUnit?.blobLivenessEvidenceOk === true);
  check("metadataOptimizationGateOk === true", pf.metadataOptimizationGateOk === true);
  check("duplicateGuardUsesV3_2 === true", pf.duplicateGuardUsesV3_2 === true);
  check("duplicateGuardKeyFormatOk === true", pf.duplicateGuardKeyFormatOk === true);
  check("isDefaultContentUnit === true (matches DEFAULT_CONTENT_UNIT contentId/version)", preflightOut.isDefaultContentUnit === true);
  check(
    "plan.sideEffectCounters all zero",
    pf && preflightOut.plan?.sideEffectCounters && Object.values(preflightOut.plan.sideEffectCounters).every((v) => v === 0),
  );
  check("liveArm.actualApiCallPerformedThisRun === false", pf.liveArm?.actualApiCallPerformedThisRun === false);
  check("liveArm.credentialValuesAccessedThisRun === false", pf.liveArm?.credentialValuesAccessedThisRun === false);
  check("liveExecutionPlan.anyStepWillExecute === false (duplicate guard blocks current content)", pf.liveExecutionPlan?.anyStepWillExecute === false);
  check("liveExecutionPlan.anySideEffectPerformed === false", pf.liveExecutionPlan?.anySideEffectPerformed === false);
  check("requiredEnvKeyNamesPlan.envValuesAccessedThisRun === false", pf.requiredEnvKeyNamesPlan?.envValuesAccessedThisRun === false);
  check("both platforms already published (duplicate-guarded, no new publish)", pf.contentUnit?.bothPlatformsAlreadyPublished === true);
}

// ── guard source safety (this file never invokes --live/--arm) ──────────────────
// 이 검사는 "이 guard의 실행 코드가 무엇을 하는가"만 본다. 사람이 읽는 라벨/주석 문자열
// 안에 "--live"/"process.env"/"ffmpeg" 같은 단어가 설명 목적으로 등장하는 것은 오탐이므로,
// execFileSync 호출부의 실제 인자 배열만 파싱해 확인한다(정규식/라벨 텍스트는 대상에서 제외).
console.log("\n[ this guard's own safety ]");
const selfSrc = readFileSync(resolve(__dirname, "check-dual-platform-content-unit-final-readiness-static.mjs"), "utf-8");

const execFileSyncCallMatch = selfSrc.match(/execFileSync\(\s*process\.execPath,\s*\[([\s\S]*?)\]/);
const execArgsText = execFileSyncCallMatch ? execFileSyncCallMatch[1] : "";
check("this guard's execFileSync call to the orchestrator omits --live", !/["']--live["']/.test(execArgsText));
check("this guard's execFileSync call to the orchestrator omits --arm", !/["']--arm["']/.test(execArgsText));
check(
  "this guard's execFileSync call to the orchestrator is exactly [ORCHESTRATOR_PATH, --preflight, --content-unit, FIXTURE_PATH]",
  /ORCHESTRATOR_PATH,\s*"--preflight",\s*"--content-unit",\s*FIXTURE_PATH/.test(execArgsText),
);

// 실행 코드에서 process.env / 외부 API 토큰 직접 참조가 있는지 확인한다. 이 파일 자체가
// "no ffmpeg", "@vercel/blob import" 같은 사람이 읽는 설명 문구(라벨/주석)를 포함하므로,
// 그런 문자열/주석을 모두 지운 뒤 남는 실행 코드 토큰만 본다. 정규식 리터럴을 텍스트로
// 제거하는 방식은 인접한 리터럴끼리 뒤섞이는 취약점이 있어(관찰됨), 대신 이 파일 안의
// 모든 "이중따옴표 문자열"과 "줄 전체 주석"만 우선 제거해 라벨/설명을 없앤 뒤 검사한다.
function stripCommentsAndDoubleQuotedStrings(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, "") // block comments
    .split("\n").filter((l) => !/^\s*\/\//.test(l)).join("\n") // full-line comments
    .replace(/"(?:[^"\\]|\\.)*"/g, '""'); // double-quoted strings (this file's labels are all double-quoted)
}
const selfExecutable = stripCommentsAndDoubleQuotedStrings(selfSrc);
// process.env / ffmpeg / ffprobe / @vercel/blob / fetch( 자체가 이 검사 표현식 안에 리터럴로
// 나타나야 하므로, 그 표현식이 속한 이 check(...) 호출 한 줄만 대상에서 명시적으로 제외한다.
const selfExecutableExcludingThisCheck = selfExecutable
  .split("\n")
  .filter((l) => !l.includes("SELF_SAFETY_TOKEN_CHECK_LINE"))
  .join("\n");
check("this guard's executable code has no direct process.env reference", !/process\.env/.test(selfExecutableExcludingThisCheck));
check(
  "this guard's executable code has no @vercel/blob import / fetch( / ffmpeg / ffprobe token", // SELF_SAFETY_TOKEN_CHECK_LINE
  !/@vercel\/blob|(^|[^.\w])fetch\s*\(|ffmpeg|ffprobe/i.test(selfExecutableExcludingThisCheck), // SELF_SAFETY_TOKEN_CHECK_LINE
);

console.log(`\n${passed} PASS / ${failed} FAIL\n`);
process.exit(failed === 0 ? 0 : 1);
