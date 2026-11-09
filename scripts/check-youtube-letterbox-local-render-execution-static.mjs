#!/usr/bin/env node
/**
 * check-youtube-letterbox-local-render-execution-static.mjs
 *
 * task: youtube-letterbox-local-render-execution-once-v1
 *
 * scripts/run-youtube-letterbox-render-from-request-once.mjs 정적/결과 가드.
 * 이 guard는 절대 ffmpeg를 실행하지 않는다 — runner 소스 텍스트와, runner가 이미 생성한
 * result JSON(레포 밖 승인 output 폴더)만 read-only로 검사한다. 또한 fail-closed 경로
 * (approval 없음, 잘못된 source)만 실제로 실행해 ffmpeg 0회를 확인한다(렌더 재실행 아님).
 *
 * 검증:
 *  1) runner 소스: process.env 미접근, fetch/axios/googleapis/@vercel/blob 없음, shell:true 없음,
 *     approval token 상수 존재, output overwrite(-y) 미사용, output 존재 시 fail-closed 로직 존재,
 *     승인 source/size 상수 일치, render profile 값이 renderer와 정합.
 *  2) result JSON(있으면): ffmpegConversionCount === 1, allVerificationsPass === true,
 *     output 1080x1920 / h264-compat / yuv420p, duration delta <= 1.0s, audio 보존,
 *     side-effect counters(api/upload/env/deploy/mutation) 전부 0.
 *  3) 생성된 output mp4가 레포 밖 + .mp4 + size > 0 인지 확인(read-only stat).
 *  4) fail-closed: approval 없음 / 잘못된 source → exit != 0 + ffmpeg 0회(렌더 재실행 아님).
 */
import { readFileSync, existsSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { execFileSync } from "node:child_process";

const SELF = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SELF), "..");

const RUNNER_PATH = path.join(ROOT, "scripts", "run-youtube-letterbox-render-from-request-once.mjs");
const RENDERER_PATH = path.join(ROOT, "scripts", "create-youtube-shorts-letterbox-variant.mjs");

const APPROVED_OUTPUT_FOLDER = "C:\\tmp\\money-shorts-os\\youtube-letterbox-local-render-execution-once-v1";
const RESULT_JSON_PATH = path.join(APPROVED_OUTPUT_FOLDER, "youtube-letterbox-render-result.json");
const APPROVED_OUTPUT_MP4 = path.join(APPROVED_OUTPUT_FOLDER, "golden_sample_t1_lifestyle_inflation_youtube_letterbox_v3_2_once.mp4");

let passes = 0;
let failures = 0;
function check(name, ok, detail) {
  if (ok) { passes += 1; console.log(`PASS  ${name}`); }
  else { failures += 1; console.error(`FAIL  ${name}${detail ? " — " + detail : ""}`); }
}

function stripCommentsAndStrings(src) {
  if (!src) return "";
  const codeLines = [];
  let inBlock = false;
  for (const raw of src.split("\n")) {
    let line = raw;
    const trimmed = line.trim();
    if (inBlock) {
      const end = line.indexOf("*/");
      if (end === -1) continue;
      line = line.slice(end + 2);
      inBlock = false;
    }
    if (trimmed.startsWith("*") || trimmed.startsWith("//")) continue;
    const blockStart = line.indexOf("/*");
    if (blockStart !== -1) {
      const blockEnd = line.indexOf("*/", blockStart + 2);
      if (blockEnd === -1) { line = line.slice(0, blockStart); inBlock = true; }
      else { line = line.slice(0, blockStart) + line.slice(blockEnd + 2); }
    }
    const lineCommentIdx = line.indexOf("//");
    if (lineCommentIdx !== -1) line = line.slice(0, lineCommentIdx);
    line = line.replace(/"(?:[^"\\]|\\.)*"/g, '""');
    line = line.replace(/'(?:[^'\\]|\\.)*'/g, "''");
    line = line.replace(/`(?:[^`\\]|\\.)*`/g, "``");
    codeLines.push(line);
  }
  return codeLines.join("\n");
}

// ── 1) runner 소스 정적 검증 ─────────────────────────────────────────────────
const runnerRawSrc = readFileSync(RUNNER_PATH, "utf8");
const runnerCode = stripCommentsAndStrings(runnerRawSrc);

check("runner: process.env 접근 없음", !/process\.env/.test(runnerCode));
check("runner: fetch/axios/googleapis/@vercel/blob 호출 없음", !/\bfetch\(|axios|googleapis|@vercel\/blob/.test(runnerCode));
check("runner: shell:true 없음", !/shell:\s*true/.test(runnerCode));
check("runner: APPROVAL_TOKEN = APPROVE_YOUTUBE_LETTERBOX_LOCAL_RENDER_EXECUTION_ONCE", /APPROVAL_TOKEN\s*=\s*"APPROVE_YOUTUBE_LETTERBOX_LOCAL_RENDER_EXECUTION_ONCE"/.test(runnerRawSrc));
check("runner: 승인 source path 상수 존재", /golden_sample_t1_lifestyle_inflation_tts_mux_v3_2\.mp4/.test(runnerRawSrc));
check("runner: 승인 source size = 20294549", /APPROVED_SOURCE_SIZE_BYTES\s*=\s*20294549/.test(runnerRawSrc));
check("runner: ffmpeg 인자에 -y(overwrite) 플래그 없음", (() => {
  const fnStart = runnerRawSrc.indexOf("export function buildFfmpegArgs");
  const fnEnd = runnerRawSrc.indexOf("\n}", fnStart);
  const fnBody = runnerRawSrc.slice(fnStart, fnEnd);
  return !/"-y"/.test(fnBody);
})());
check("runner: output 이미 존재 시 BLOCKED_OUTPUT_ALREADY_EXISTS_NO_RENDER로 fail-closed", /BLOCKED_OUTPUT_ALREADY_EXISTS_NO_RENDER/.test(runnerRawSrc) && /existsSync\(outputAbs\)/.test(runnerCode));
check("runner: output repo-내부면 fail-closed", /OUTPUT_INSIDE_REPO/.test(runnerRawSrc) && /outputAbs\.startsWith/.test(runnerCode));
check("runner: output .mp4 아니면 fail-closed", /OUTPUT_NOT_MP4/.test(runnerRawSrc));
check("runner: source size mismatch fail-closed", /SOURCE_SIZE_MISMATCH/.test(runnerRawSrc));
check("runner: ffmpegConversionCount는 spawnSync ffmpeg 이후 정확히 1 증가(단일 지점)", (() => {
  const incs = runnerCode.match(/sideEffectCounters\.ffmpegConversionCount\s*\+=\s*1/g) || [];
  return incs.length === 1;
})());
check("runner: ffmpeg spawnSync 호출이 소스에 정확히 1개(단일 변환 지점)", (() => {
  const calls = runnerCode.match(/spawnSync\(\s*""ffmpeg""|spawnSync\("ffmpeg"/g) || [];
  // strip 후 문자열이 ""로 치환되므로 원문에서 직접 센다.
  const rawCalls = runnerRawSrc.match(/spawnSync\("ffmpeg"/g) || [];
  return rawCalls.length === 1;
})());

// render profile 값이 renderer와 정합(1080/1920/864/1536).
const rendererRawSrc = readFileSync(RENDERER_PATH, "utf8");
function profileNums(src, constName) {
  const m = src.match(new RegExp(`${constName}\\s*=\\s*\\{[\\s\\S]*?\\n\\};`));
  if (!m) return null;
  // canvas widthPx/heightPx + contentBox widthPx/heightPx = 핵심 4개 숫자만 비교한다.
  // renderer PROFILE에는 margins(192/108)가 있고 runner RENDER_PROFILE에는 없어
  // 뒤쪽 숫자 순서가 다르므로, 렌더 계약을 결정하는 앞 4개만 정합성 검증한다.
  const nums = (m[0].match(/\d+/g) || []).slice(0, 4);
  return nums.join(",");
}
check(
  "runner: RENDER_PROFILE canvas/contentBox 숫자가 renderer PROFILE과 일치(1080/1920/864/1536)",
  (() => {
    const rn = profileNums(runnerRawSrc, "RENDER_PROFILE");
    const rd = profileNums(rendererRawSrc, "PROFILE");
    return rn != null && rd != null && rn === rd;
  })(),
);
check("runner: filter가 정확히 scale+pad+black 계약", /scale=w=\$\{contentBox\.widthPx\}:h=\$\{contentBox\.heightPx\}:force_original_aspect_ratio=decrease/.test(runnerRawSrc) && /pad=w=\$\{canvas\.widthPx\}:h=\$\{canvas\.heightPx\}/.test(runnerRawSrc));

// ── 2) result JSON 검증(있으면) ───────────────────────────────────────────────
if (existsSync(RESULT_JSON_PATH)) {
  let result = null;
  try { result = JSON.parse(readFileSync(RESULT_JSON_PATH, "utf8")); } catch {}
  check("result JSON parse 성공", result != null);
  check("result JSON: schemaVersion === youtube_letterbox_render_result_v1", result?.schemaVersion === "youtube_letterbox_render_result_v1");
  check("result JSON: ffmpegConversionCount === 1", result?.ffmpegConversionCount === 1);
  check("result JSON: allVerificationsPass === true", result?.allVerificationsPass === true);
  check("result JSON: executed === true + envSecretValuesAccessedThisRun === false", result?.executed === true && result?.envSecretValuesAccessedThisRun === false);
  check(
    "result JSON: output 1080x1920 + h264-compat + yuv420p",
    result?.verification?.outputResolutionCorrect === true &&
      result?.verification?.outputCodecH264Compatible === true &&
      result?.verification?.outputPixelFormatYuv420p === true,
  );
  check(
    "result JSON: duration delta <= 1.0s(durationWithinTolerance === true)",
    result?.verification?.durationWithinTolerance === true &&
      typeof result?.verification?.durationDeltaSeconds === "number" &&
      result.verification.durationDeltaSeconds <= 1.0,
  );
  check(
    "result JSON: source audio 있으면 output audio도 있음(audioPreservedIfSourceHadAudio === true)",
    result?.verification?.audioPreservedIfSourceHadAudio === true,
  );
  check(
    "result JSON: side-effect counters api/upload/env/deploy/mutation 전부 0",
    result?.sideEffectCounters?.apiCallCount === 0 &&
      result?.sideEffectCounters?.uploadCount === 0 &&
      result?.sideEffectCounters?.envSecretReadCount === 0 &&
      result?.sideEffectCounters?.deployCount === 0 &&
      result?.sideEffectCounters?.requestMutationCount === 0,
  );
  check("result JSON: outputSizeBytes > 0", typeof result?.outputSizeBytes === "number" && result.outputSizeBytes > 0);
  check("result JSON: sourceSizeBytes === 20294549", result?.sourceSizeBytes === 20294549);
  check("result JSON에 secret 값 형태 없음", !/(EAA[A-Za-z0-9]{20}|ya29\.[A-Za-z0-9_-]{20}|vercel_blob_rw_[A-Za-z0-9]{10})/.test(readFileSync(RESULT_JSON_PATH, "utf8")));

  // ── 3) 생성된 output mp4 read-only stat ──────────────────────────────────
  check("output mp4 존재 + 레포 밖 + .mp4 + size > 0", (() => {
    if (!existsSync(APPROVED_OUTPUT_MP4)) return false;
    if (!APPROVED_OUTPUT_MP4.toLowerCase().endsWith(".mp4")) return false;
    if (APPROVED_OUTPUT_MP4.startsWith(ROOT + path.sep)) return false;
    return statSync(APPROVED_OUTPUT_MP4).size > 0;
  })());
} else {
  console.log("SKIP  result JSON 미존재 — runner가 아직 실행되지 않았거나 output 폴더가 없음(정적 검증만 수행)");
}

// ── 4) fail-closed: approval 없음 / 잘못된 source → exit != 0 + ffmpeg 0회 ────
// (렌더 재실행 아님 — 이 경로들은 절대 ffmpeg를 호출하지 않는다.)
{
  let threw = false;
  let out = "";
  try {
    out = execFileSync(process.execPath, [RUNNER_PATH], { cwd: ROOT, encoding: "utf8", timeout: 15000 });
  } catch (e) {
    threw = (e.status ?? 1) !== 0;
    out = String(e?.stdout || "") + String(e?.stderr || "");
  }
  check("fail-closed: approval token 없음 → exit != 0", threw);
  check("fail-closed: approval token 없음 → ffmpegConversionCount 0 보고", /ffmpegConversionCount:\s*0/.test(out));
}
{
  let threw = false;
  let out = "";
  try {
    out = execFileSync(process.execPath, [
      RUNNER_PATH, "--approval", "APPROVE_YOUTUBE_LETTERBOX_LOCAL_RENDER_EXECUTION_ONCE", "--source", "C:\\tmp\\definitely-not-approved.mp4",
    ], { cwd: ROOT, encoding: "utf8", timeout: 15000 });
  } catch (e) {
    threw = (e.status ?? 1) !== 0;
    out = String(e?.stdout || "") + String(e?.stderr || "");
  }
  check("fail-closed: 잘못된 source → exit != 0 + SOURCE_PATH_NOT_APPROVED", threw && /SOURCE_PATH_NOT_APPROVED/.test(out));
  check("fail-closed: 잘못된 source → ffmpegConversionCount 0 보고", /ffmpegConversionCount:\s*0/.test(out));
}

// ── 결과 ──────────────────────────────────────────────────────────────────
console.log(`\n${passes} PASS / ${failures} FAIL`);
if (failures > 0) process.exit(1);
