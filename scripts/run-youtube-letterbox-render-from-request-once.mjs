/**
 * YouTube Shorts letterbox one-shot local render runner (executes ffmpeg EXACTLY ONCE, approval-gated).
 *
 * task: youtube-letterbox-local-render-execution-once-v1
 * approval token: APPROVE_YOUTUBE_LETTERBOX_LOCAL_RENDER_EXECUTION_ONCE
 *
 * Usage:
 *   node scripts/run-youtube-letterbox-render-from-request-once.mjs \
 *     --approval APPROVE_YOUTUBE_LETTERBOX_LOCAL_RENDER_EXECUTION_ONCE \
 *     [--request <youtube-letterbox-render-request.json>] \
 *     [--source <mp4>] [--output <mp4>] [--out-dir <outside-repo path>]
 *
 * Unlike scripts/create-youtube-shorts-letterbox-variant.mjs (a pure no-execute planner), THIS runner
 * actually runs a single ffmpeg conversion — but only when every precondition passes. It fails closed
 * (ffmpeg count 0) on any mismatch. It NEVER overwrites an existing output mp4, NEVER runs ffmpeg more
 * than once, and performs only read-only ffprobe for source/output verification.
 *
 * Security constraints:
 * - No process.env access.
 * - No .env/.env.local read.
 * - No fetch/axios/googleapis/@vercel/blob calls of any kind. No network access.
 * - Only two external binaries are ever spawned: ffprobe (read-only) and ffmpeg (exactly once).
 * - spawnSync(..., { shell: false }) only — never shell:true.
 * - Output mp4 must be repo-outside and end with .mp4, and must NOT already exist.
 * - Does not mutate the input request JSON.
 */

import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from "node:fs";
import { resolve, dirname, join, isAbsolute } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");

export const RESULT_SCHEMA_VERSION = "youtube_letterbox_render_result_v1";
export const APPROVAL_TOKEN = "APPROVE_YOUTUBE_LETTERBOX_LOCAL_RENDER_EXECUTION_ONCE";

// 승인된 source/output (HANDOFF_NOW.md source of truth와 정확히 일치해야 한다).
export const APPROVED_SOURCE_PATH =
  "C:\\tmp\\money-shorts-os\\golden-sample-chatgpt-playwright-v3-2-script-voice-mux-audit\\golden_sample_t1_lifestyle_inflation_tts_mux_v3_2.mp4";
export const APPROVED_SOURCE_SIZE_BYTES = 20294549;
export const APPROVED_OUTPUT_FOLDER =
  "C:\\tmp\\money-shorts-os\\youtube-letterbox-local-render-execution-once-v1";
export const APPROVED_OUTPUT_MP4 = join(
  APPROVED_OUTPUT_FOLDER,
  "golden_sample_t1_lifestyle_inflation_youtube_letterbox_v3_2_once.mp4",
);

// scripts/create-youtube-shorts-letterbox-variant.mjs PROFILE과 값이 일치해야 한다.
export const RENDER_PROFILE = {
  canvas: { widthPx: 1080, heightPx: 1920, backgroundColor: "black" },
  contentBox: { widthPx: 864, heightPx: 1536, centered: true },
  codec: { video: "h264", pixelFormat: "yuv420p", faststart: true, audio: "aac" },
};

const DURATION_DELTA_TOLERANCE_SECONDS = 1.0;

// ── CLI args ────────────────────────────────────────────────────────────────────
function getArg(args, name) {
  const idx = args.indexOf(name);
  if (idx !== -1 && args[idx + 1]) return args[idx + 1];
  return null;
}

function printUsage() {
  console.log(
    [
      "One-shot local YouTube letterbox render runner (executes ffmpeg exactly once, approval-gated).",
      "",
      "Usage:",
      "  node scripts/run-youtube-letterbox-render-from-request-once.mjs" +
        " --approval " + APPROVAL_TOKEN +
        " [--request <youtube-letterbox-render-request.json>]" +
        " [--source <mp4>] [--output <mp4>] [--out-dir <outside-repo path>]",
      "",
      "Requires the exact approval token. Fails closed (ffmpeg count 0) if any precondition fails.",
      "Never overwrites an existing output mp4. Never runs ffmpeg more than once.",
    ].join("\n"),
  );
}

/**
 * 승인된 render profile을 사용해 ffmpeg 인자를 만든다.
 * NOTE: 절대 -y(overwrite)를 넣지 않는다. output 미존재를 사전 검증하고 덮어쓰지 않는다.
 */
export function buildFfmpegArgs(inputPath, outputPath) {
  const { canvas, contentBox, codec } = RENDER_PROFILE;
  const scaleFilter =
    `scale=w=${contentBox.widthPx}:h=${contentBox.heightPx}:force_original_aspect_ratio=decrease,` +
    `pad=w=${canvas.widthPx}:h=${canvas.heightPx}:x=(ow-iw)/2:y=(oh-ih)/2:color=${canvas.backgroundColor}`;
  return [
    "-i", inputPath,
    "-vf", scaleFilter,
    "-c:v", codec.video,
    "-pix_fmt", codec.pixelFormat,
    ...(codec.faststart ? ["-movflags", "+faststart"] : []),
    "-c:a", codec.audio,
    "-map", "0:v:0",
    "-map", "0:a:0?",
    outputPath,
  ];
}

/**
 * ffprobe read-only로 stream/format 정보를 JSON으로 얻는다. 실패 시 { ok:false }.
 */
function ffprobeReadOnly(mp4Path) {
  const args = [
    "-v", "error",
    "-print_format", "json",
    "-show_format",
    "-show_streams",
    mp4Path,
  ];
  const result = spawnSync("ffprobe", args, { encoding: "utf-8", maxBuffer: 20 * 1024 * 1024, shell: false });
  if (result.status !== 0 || !result.stdout) {
    return { ok: false, error: `ffprobe exit ${result.status}: ${String(result.stderr || "").slice(0, 500)}`, probe: null };
  }
  try {
    return { ok: true, error: null, probe: JSON.parse(result.stdout) };
  } catch (e) {
    return { ok: false, error: `ffprobe json parse failed: ${String(e?.message || e)}`, probe: null };
  }
}

function extractVideoStream(probe) {
  return (probe?.streams || []).find((s) => s.codec_type === "video") || null;
}
function extractAudioStream(probe) {
  return (probe?.streams || []).find((s) => s.codec_type === "audio") || null;
}
function probeDurationSeconds(probe) {
  const fmtDur = Number(probe?.format?.duration);
  if (Number.isFinite(fmtDur) && fmtDur > 0) return fmtDur;
  const v = extractVideoStream(probe);
  const vDur = Number(v?.duration);
  return Number.isFinite(vDur) && vDur > 0 ? vDur : null;
}

/**
 * request JSON이 주어지면 그로부터 source/output을 해석한다(읽기 전용).
 */
function resolveFromRequest(requestPath) {
  if (!existsSync(requestPath)) {
    return { ok: false, reason: "request_file_not_found", request: null };
  }
  let request;
  try {
    request = JSON.parse(readFileSync(requestPath, "utf-8"));
  } catch (e) {
    return { ok: false, reason: `request_json_parse_failed: ${String(e?.message || e)}`, request: null };
  }
  const source = request?.instagramSourcePath ?? request?.source ?? null;
  const output = request?.plannedYoutubeSourcePath ?? request?.output ?? null;
  return { ok: true, reason: null, request, source, output };
}

// ── main runner ─────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const approval = getArg(args, "--approval");
const requestPath = getArg(args, "--request");
let sourceArg = getArg(args, "--source");
let outputArg = getArg(args, "--output");
const outDirArg = getArg(args, "--out-dir");

// 항상 result 카운터 초기화 — 어떤 경로로 종료하든 side-effect 진실을 보고한다.
const sideEffectCounters = {
  ffmpegConversionCount: 0,
  ffprobeReadOnlyCount: 0,
  outputFilesWrittenCount: 0,
  apiCallCount: 0,
  uploadCount: 0,
  envSecretReadCount: 0,
  deployCount: 0,
  requestMutationCount: 0,
};

function failClosed(blockerStatus, detail) {
  console.error(`BLOCKED: ${blockerStatus}${detail ? " — " + detail : ""}`);
  console.error(`ffmpegConversionCount: ${sideEffectCounters.ffmpegConversionCount}`);
  process.exit(1);
}

if (approval !== APPROVAL_TOKEN) {
  printUsage();
  failClosed("MISSING_OR_INVALID_APPROVAL_TOKEN", `expected exact --approval ${APPROVAL_TOKEN}`);
}

// request가 주어지면 그로부터 source/output을 채운다(명시 --source/--output이 우선).
if (requestPath) {
  const r = resolveFromRequest(requestPath);
  if (!r.ok) failClosed("INVALID_REQUEST_JSON", r.reason);
  if (!sourceArg && r.source) sourceArg = r.source;
  if (!outputArg && r.output) outputArg = r.output;
}

// source/output 기본값(승인값) 적용.
const sourcePath = sourceArg ? resolve(sourceArg) : APPROVED_SOURCE_PATH;
let outputPath;
if (outputArg) {
  outputPath = isAbsolute(outputArg) ? outputArg : resolve(outputArg);
} else if (outDirArg) {
  const outDirAbs = resolve(outDirArg);
  outputPath = join(outDirAbs, "golden_sample_t1_lifestyle_inflation_youtube_letterbox_v3_2_once.mp4");
} else {
  outputPath = APPROVED_OUTPUT_MP4;
}

// ── precondition: source ──────────────────────────────────────────────────────
if (resolve(sourcePath) !== resolve(APPROVED_SOURCE_PATH)) {
  failClosed("SOURCE_PATH_NOT_APPROVED", `got ${sourcePath}`);
}
if (!existsSync(sourcePath)) {
  failClosed("SOURCE_FILE_NOT_FOUND", sourcePath);
}
const sourceSize = statSync(sourcePath).size;
if (sourceSize !== APPROVED_SOURCE_SIZE_BYTES) {
  failClosed("SOURCE_SIZE_MISMATCH", `expected ${APPROVED_SOURCE_SIZE_BYTES}, got ${sourceSize}`);
}

// ── precondition: output ──────────────────────────────────────────────────────
const outputAbs = resolve(outputPath);
if (!outputAbs.toLowerCase().endsWith(".mp4")) {
  failClosed("OUTPUT_NOT_MP4", outputAbs);
}
if (outputAbs.startsWith(REPO_ROOT + "\\") || outputAbs.startsWith(REPO_ROOT + "/")) {
  failClosed("OUTPUT_INSIDE_REPO", outputAbs);
}
if (outputAbs.includes(".money-shorts-local")) {
  failClosed("OUTPUT_FORBIDDEN_PATH", outputAbs);
}
if (existsSync(outputAbs)) {
  failClosed("BLOCKED_OUTPUT_ALREADY_EXISTS_NO_RENDER", outputAbs);
}

const outputDir = dirname(outputAbs);

console.log("\n╔══════════════════════════════════════════════════════════════╗");
console.log("║   YouTube Letterbox Local Render — one-shot (ffmpeg x1)        ║");
console.log("╚══════════════════════════════════════════════════════════════╝\n");
console.log(`  approval:  ${APPROVAL_TOKEN}`);
console.log(`  source:    ${sourcePath} (${sourceSize} bytes)`);
console.log(`  output:    ${outputAbs}`);
console.log("");

// ── source ffprobe (read-only) ────────────────────────────────────────────────
const sourceProbe = ffprobeReadOnly(sourcePath);
sideEffectCounters.ffprobeReadOnlyCount += 1;
if (!sourceProbe.ok) {
  failClosed("SOURCE_FFPROBE_FAILED", sourceProbe.error);
}
const sourceVideo = extractVideoStream(sourceProbe.probe);
const sourceAudio = extractAudioStream(sourceProbe.probe);
const sourceDuration = probeDurationSeconds(sourceProbe.probe);
if (!sourceVideo) {
  failClosed("SOURCE_HAS_NO_VIDEO_STREAM", sourcePath);
}
const sourceHasAudio = sourceAudio != null;
console.log(`  [source ffprobe] video ${sourceVideo.width}x${sourceVideo.height} ${sourceVideo.codec_name}, audio: ${sourceHasAudio ? sourceAudio.codec_name : "none"}, duration: ${sourceDuration}s`);

// ── ffmpeg conversion (EXACTLY ONCE) ──────────────────────────────────────────
mkdirSync(outputDir, { recursive: true });
const ffmpegArgs = buildFfmpegArgs(sourcePath, outputAbs);
console.log("");
console.log(`  [ffmpeg] running exactly once (no -y overwrite flag)...`);
console.log(`  [ffmpeg] ffmpeg ${ffmpegArgs.map((a) => (a.includes(" ") ? `"${a}"` : a)).join(" ")}`);

const ffmpegResult = spawnSync("ffmpeg", ffmpegArgs, { encoding: "utf-8", maxBuffer: 40 * 1024 * 1024, shell: false });
sideEffectCounters.ffmpegConversionCount += 1;

if (ffmpegResult.status !== 0) {
  // ffmpeg가 부분 출력물을 남겼을 수 있으나, 이 slice에서는 삭제/재실행하지 않는다(overwrite/second-run 금지).
  failClosed("FFMPEG_CONVERSION_FAILED", `exit ${ffmpegResult.status}: ${String(ffmpegResult.stderr || "").slice(-800)}`);
}
if (!existsSync(outputAbs)) {
  failClosed("FFMPEG_PRODUCED_NO_OUTPUT", outputAbs);
}
sideEffectCounters.outputFilesWrittenCount += 1;
const outputSize = statSync(outputAbs).size;
console.log(`  [ffmpeg] done. output size: ${outputSize} bytes`);

// ── output ffprobe (read-only) + verification ─────────────────────────────────
const outputProbe = ffprobeReadOnly(outputAbs);
sideEffectCounters.ffprobeReadOnlyCount += 1;

const verification = {
  outputExists: existsSync(outputAbs),
  outputSizePositive: outputSize > 0,
  outputProbeOk: outputProbe.ok,
  outputWidth: null,
  outputHeight: null,
  outputResolutionCorrect: false,
  outputCodec: null,
  outputCodecH264Compatible: false,
  outputPixelFormat: null,
  outputPixelFormatYuv420p: false,
  sourceDurationSeconds: sourceDuration,
  outputDurationSeconds: null,
  durationDeltaSeconds: null,
  durationWithinTolerance: false,
  sourceHasAudio,
  outputHasAudio: false,
  audioPreservedIfSourceHadAudio: false,
};

if (outputProbe.ok) {
  const outVideo = extractVideoStream(outputProbe.probe);
  const outAudio = extractAudioStream(outputProbe.probe);
  const outDuration = probeDurationSeconds(outputProbe.probe);
  verification.outputWidth = outVideo?.width ?? null;
  verification.outputHeight = outVideo?.height ?? null;
  verification.outputResolutionCorrect = outVideo?.width === 1080 && outVideo?.height === 1920;
  verification.outputCodec = outVideo?.codec_name ?? null;
  // h264 계열 호환(codec_name h264 또는 avc1 태그).
  verification.outputCodecH264Compatible =
    outVideo?.codec_name === "h264" || String(outVideo?.codec_tag_string || "").toLowerCase().includes("avc");
  verification.outputPixelFormat = outVideo?.pix_fmt ?? null;
  verification.outputPixelFormatYuv420p = outVideo?.pix_fmt === "yuv420p";
  verification.outputDurationSeconds = outDuration;
  if (Number.isFinite(sourceDuration) && Number.isFinite(outDuration)) {
    verification.durationDeltaSeconds = Math.abs(sourceDuration - outDuration);
    verification.durationWithinTolerance = verification.durationDeltaSeconds <= DURATION_DELTA_TOLERANCE_SECONDS;
  }
  verification.outputHasAudio = outAudio != null;
  verification.audioPreservedIfSourceHadAudio = sourceHasAudio ? outAudio != null : true;
}

const allVerificationsPass =
  verification.outputExists &&
  verification.outputSizePositive &&
  verification.outputProbeOk &&
  verification.outputResolutionCorrect &&
  verification.outputCodecH264Compatible &&
  verification.outputPixelFormatYuv420p &&
  verification.durationWithinTolerance &&
  verification.audioPreservedIfSourceHadAudio;

// ── result JSON ───────────────────────────────────────────────────────────────
const result = {
  schemaVersion: RESULT_SCHEMA_VERSION,
  mode: "local_render_once",
  approvalToken: APPROVAL_TOKEN,
  noLive: true,
  executed: true,
  envSecretValuesAccessedThisRun: false,
  sourcePath: resolve(sourcePath),
  sourceSizeBytes: sourceSize,
  outputPath: outputAbs,
  outputSizeBytes: outputSize,
  renderProfile: {
    canvas: `${RENDER_PROFILE.canvas.widthPx}x${RENDER_PROFILE.canvas.heightPx}`,
    backgroundColor: RENDER_PROFILE.canvas.backgroundColor,
    contentBox: `${RENDER_PROFILE.contentBox.widthPx}x${RENDER_PROFILE.contentBox.heightPx}`,
    centered: RENDER_PROFILE.contentBox.centered,
    codec: RENDER_PROFILE.codec,
  },
  ffmpegConversionCount: sideEffectCounters.ffmpegConversionCount,
  ffprobeReadOnlyCount: sideEffectCounters.ffprobeReadOnlyCount,
  verification,
  allVerificationsPass,
  sideEffectCounters,
  nextStep:
    "Attach the generated mp4 as the content unit youtubeSourcePath: rebuild the content unit with " +
    `--youtube-source "${outputAbs}" and re-run --preflight --content-unit <manifest>.`,
};

const resultPath = join(outputDir, "youtube-letterbox-render-result.json");
const sourceProbePath = join(outputDir, "source-ffprobe.json");
const outputProbePath = join(outputDir, "output-ffprobe.json");
writeFileSync(resultPath, JSON.stringify(result, null, 2), "utf-8");
writeFileSync(sourceProbePath, JSON.stringify(sourceProbe.probe, null, 2), "utf-8");
writeFileSync(outputProbePath, JSON.stringify(outputProbe.probe ?? { error: outputProbe.error }, null, 2), "utf-8");

console.log("");
console.log("── verification ───────────────────────────────────────────────");
console.log(`  outputExists:                ${verification.outputExists}`);
console.log(`  outputSize > 0:              ${verification.outputSizePositive} (${outputSize})`);
console.log(`  output resolution 1080x1920: ${verification.outputResolutionCorrect} (${verification.outputWidth}x${verification.outputHeight})`);
console.log(`  output codec h264-compat:    ${verification.outputCodecH264Compatible} (${verification.outputCodec})`);
console.log(`  output pix_fmt yuv420p:       ${verification.outputPixelFormatYuv420p} (${verification.outputPixelFormat})`);
console.log(`  duration delta <= 1.0s:       ${verification.durationWithinTolerance} (Δ${verification.durationDeltaSeconds}s)`);
console.log(`  audio preserved:              ${verification.audioPreservedIfSourceHadAudio} (source:${sourceHasAudio} → output:${verification.outputHasAudio})`);
console.log("");
console.log(`  ffmpegConversionCount:        ${result.ffmpegConversionCount}`);
console.log(`  allVerificationsPass:         ${allVerificationsPass}`);
console.log("");
console.log(`  result: ${resultPath}`);
console.log(`  next:   attach --youtube-source "${outputAbs}" to a content unit manifest`);
console.log("");

process.exit(allVerificationsPass ? 0 : 2);
