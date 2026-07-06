/**
 * YouTube Shorts letterbox variant — one-shot render test runner (fail-closed, no-live).
 *
 * Usage:
 *   node scripts/run-youtube-shorts-letterbox-render-test-once.mjs --approval APPROVE_PLATFORM_VARIANT_RENDER_TEST
 *
 * Converts exactly ONE approved local source mp4 into a YouTube Shorts letterbox
 * variant (1080x1920 black canvas, 864x1536 centered content) using exactly ONE
 * ffmpeg execution. All parameters (source path, source size, output folder) are
 * hardcoded to the Owner-approved values in _ai/HANDOFF_NOW.md — this is not a
 * general-purpose CLI.
 *
 * Fail-closed guards:
 * - Requires the exact CLI approval token.
 * - Source path/size must match the approved values exactly.
 * - Output path must be inside the approved output subfolder.
 * - Refuses to run if the output mp4 already exists (prevents a second ffmpeg conversion).
 * - Exactly one ffmpeg conversion process; ffprobe is used only for read-only verification
 *   (before and after), never for frame extraction/blackdetect/screenshot.
 *
 * Security constraints:
 * - Node built-ins only (node:fs, node:path, node:url, node:child_process).
 * - No network/fetch/API calls.
 * - No environment variable or secret reads.
 * - No writes outside output/youtube-shorts-letterbox-render-test-v1/.
 */

import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");

// ── Hardcoded Owner-approved parameters (from _ai/HANDOFF_NOW.md) ───────────
const REQUIRED_APPROVAL_TOKEN = "APPROVE_PLATFORM_VARIANT_RENDER_TEST";

const APPROVED_SOURCE_PATH =
  "C:\\tmp\\money-shorts-os\\golden-sample-chatgpt-playwright-v3-2-script-voice-mux-audit\\golden_sample_t1_lifestyle_inflation_tts_mux_v3_2.mp4";
const APPROVED_SOURCE_SIZE_BYTES = 20294549;

const APPROVED_OUTPUT_DIR = resolve(REPO_ROOT, "output", "youtube-shorts-letterbox-render-test-v1");
const APPROVED_OUTPUT_MP4 = join(
  APPROVED_OUTPUT_DIR,
  "golden_sample_t1_lifestyle_inflation_youtube_letterbox_v1.mp4",
);
const RESULT_JSON_PATH = join(APPROVED_OUTPUT_DIR, "render-test-result.json");
const SOURCE_PROBE_JSON_PATH = join(APPROVED_OUTPUT_DIR, "source-ffprobe.json");
const OUTPUT_PROBE_JSON_PATH = join(APPROVED_OUTPUT_DIR, "output-ffprobe.json");

const PROFILE = {
  canvas: { widthPx: 1080, heightPx: 1920, backgroundColor: "black" },
  contentBox: { widthPx: 864, heightPx: 1536 },
  codec: { video: "h264", pixelFormat: "yuv420p", faststart: true, audio: "aac" },
};

// ── CLI args ─────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
function getArg(name) {
  const idx = args.indexOf(name);
  if (idx !== -1 && args[idx + 1]) return args[idx + 1];
  return null;
}

const approvalToken = getArg("--approval");
if (approvalToken !== REQUIRED_APPROVAL_TOKEN) {
  console.error(
    `ABORT: missing or incorrect --approval token. Required: --approval ${REQUIRED_APPROVAL_TOKEN}`,
  );
  process.exit(1);
}

console.log("\n[render-test] approval token OK:", approvalToken);

// ── Guard 1: source path/size fail-closed ────────────────────────────────────
if (!existsSync(APPROVED_SOURCE_PATH)) {
  console.error(`ABORT: approved source file does not exist: ${APPROVED_SOURCE_PATH}`);
  process.exit(1);
}
const sourceStat = statSync(APPROVED_SOURCE_PATH);
if (sourceStat.size !== APPROVED_SOURCE_SIZE_BYTES) {
  console.error(
    `ABORT: source file size mismatch. Expected ${APPROVED_SOURCE_SIZE_BYTES}, got ${sourceStat.size}. Refusing to convert an unapproved source.`,
  );
  process.exit(1);
}
console.log(`[render-test] source path OK: ${APPROVED_SOURCE_PATH}`);
console.log(`[render-test] source size OK: ${sourceStat.size} bytes`);

// ── Guard 2: output path fail-closed (must be inside approved subfolder) ────
if (!APPROVED_OUTPUT_MP4.startsWith(APPROVED_OUTPUT_DIR + "\\") && !APPROVED_OUTPUT_MP4.startsWith(APPROVED_OUTPUT_DIR + "/")) {
  console.error(`ABORT: output path is outside approved subfolder: ${APPROVED_OUTPUT_DIR}`);
  process.exit(1);
}

// ── Guard 3: refuse if output mp4 already exists (prevents a second ffmpeg run) ─
if (existsSync(APPROVED_OUTPUT_MP4)) {
  console.error(
    `ABORT: output mp4 already exists — refusing to run ffmpeg a second time.\n  existing: ${APPROVED_OUTPUT_MP4}\n  Delete it manually (outside this script) if a fresh single-conversion test is intended.`,
  );
  process.exit(1);
}

mkdirSync(APPROVED_OUTPUT_DIR, { recursive: true });

// ── Step 1: ffprobe source (read-only verification, not a conversion) ───────
console.log("\n[step 1/3] ffprobe source (read-only)...");
const probeSourceResult = spawnSync(
  "ffprobe",
  ["-v", "quiet", "-print_format", "json", "-show_format", "-show_streams", APPROVED_SOURCE_PATH],
  { encoding: "utf-8", maxBuffer: 4 * 1024 * 1024 },
);
if (probeSourceResult.status !== 0) {
  console.error(`ABORT: ffprobe failed on source (exit ${probeSourceResult.status})`);
  process.exit(1);
}
let sourceProbe;
try {
  sourceProbe = JSON.parse(probeSourceResult.stdout);
} catch {
  console.error("ABORT: cannot parse source ffprobe output.");
  process.exit(1);
}
writeFileSync(SOURCE_PROBE_JSON_PATH, JSON.stringify(sourceProbe, null, 2), "utf-8");

const srcVideoStream = (sourceProbe.streams ?? []).find((s) => s.codec_type === "video");
const srcAudioStream = (sourceProbe.streams ?? []).find((s) => s.codec_type === "audio");
const srcDurationSec = parseFloat(sourceProbe.format?.duration ?? "0");
const srcHasAudio = !!srcAudioStream;

console.log(`  source: ${srcVideoStream?.width}x${srcVideoStream?.height}, duration=${srcDurationSec}s, audio=${srcHasAudio}`);

// ── Step 2: exactly ONE ffmpeg conversion ────────────────────────────────────
console.log("\n[step 2/3] ffmpeg conversion (exactly one execution)...");

const scaleFilter =
  `scale=w=${PROFILE.contentBox.widthPx}:h=${PROFILE.contentBox.heightPx}:force_original_aspect_ratio=decrease,` +
  `pad=w=${PROFILE.canvas.widthPx}:h=${PROFILE.canvas.heightPx}:x=(ow-iw)/2:y=(oh-ih)/2:color=${PROFILE.canvas.backgroundColor}`;

const ffmpegArgs = [
  "-y",
  "-i", APPROVED_SOURCE_PATH,
  "-vf", scaleFilter,
  "-c:v", PROFILE.codec.video,
  "-pix_fmt", PROFILE.codec.pixelFormat,
  ...(PROFILE.codec.faststart ? ["-movflags", "+faststart"] : []),
  ...(srcHasAudio ? ["-c:a", PROFILE.codec.audio, "-map", "0:v:0", "-map", "0:a:0"] : ["-an", "-map", "0:v:0"]),
  APPROVED_OUTPUT_MP4,
];

console.log(`  ffmpeg ${ffmpegArgs.join(" ")}\n`);

let ffmpegConversionCount = 0;
const ffmpegResult = spawnSync("ffmpeg", ffmpegArgs, { encoding: "utf-8", maxBuffer: 20 * 1024 * 1024 });
ffmpegConversionCount += 1;

if (ffmpegResult.status !== 0) {
  console.error(`ABORT: ffmpeg conversion FAILED (exit ${ffmpegResult.status})`);
  if (ffmpegResult.stderr) console.error(ffmpegResult.stderr.split("\n").slice(-30).join("\n"));
  process.exit(1);
}
console.log("  ffmpeg conversion succeeded.");

// ── Step 3: ffprobe output (read-only verification, not a second conversion) ─
console.log("\n[step 3/3] ffprobe output (read-only)...");
const probeOutputResult = spawnSync(
  "ffprobe",
  ["-v", "quiet", "-print_format", "json", "-show_format", "-show_streams", APPROVED_OUTPUT_MP4],
  { encoding: "utf-8", maxBuffer: 4 * 1024 * 1024 },
);
if (probeOutputResult.status !== 0) {
  console.error(`ABORT: ffprobe failed on output (exit ${probeOutputResult.status})`);
  process.exit(1);
}
let outputProbe;
try {
  outputProbe = JSON.parse(probeOutputResult.stdout);
} catch {
  console.error("ABORT: cannot parse output ffprobe output.");
  process.exit(1);
}
writeFileSync(OUTPUT_PROBE_JSON_PATH, JSON.stringify(outputProbe, null, 2), "utf-8");

const outVideoStream = (outputProbe.streams ?? []).find((s) => s.codec_type === "video");
const outAudioStream = (outputProbe.streams ?? []).find((s) => s.codec_type === "audio");
const outDurationSec = parseFloat(outputProbe.format?.duration ?? "0");
const outFileSizeBytes = parseInt(outputProbe.format?.size ?? "0", 10);

console.log(`  output: ${outVideoStream?.width}x${outVideoStream?.height}, duration=${outDurationSec}s, audio=${!!outAudioStream}`);

// ── Verification checks ──────────────────────────────────────────────────────
const durationDeltaSec = Math.abs(outDurationSec - srcDurationSec);
const checks = [
  ["output width 1080", outVideoStream?.width === 1080],
  ["output height 1920", outVideoStream?.height === 1920],
  ["output video codec h264-compatible", outVideoStream?.codec_name === "h264"],
  ["output pixel format yuv420p", outVideoStream?.pix_fmt === "yuv420p"],
  ["output duration close to source (± 1.0s)", durationDeltaSec <= 1.0],
  ["output audio preserved if source has audio", !srcHasAudio || !!outAudioStream],
  ["ffmpeg conversion count is exactly 1", ffmpegConversionCount === 1],
];

console.log();
let allPass = true;
for (const [label, ok] of checks) {
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}`);
  if (!ok) allPass = false;
}

// deterministic letterbox margin calculation (no extra ffmpeg call)
const marginTopBottomPx = Math.round((PROFILE.canvas.heightPx - PROFILE.contentBox.heightPx) / 2);
const marginSidePx = Math.round((PROFILE.canvas.widthPx - PROFILE.contentBox.widthPx) / 2);

const result = {
  schemaVersion: "youtube_shorts_letterbox_render_test_result_v1",
  taskId: "youtube-shorts-letterbox-variant-render-test-v1",
  status: allPass ? "RENDER_TEST_PASS" : "RENDER_TEST_FAIL",
  approvalToken,
  sourcePath: APPROVED_SOURCE_PATH,
  sourceSizeBytes: sourceStat.size,
  outputPath: APPROVED_OUTPUT_MP4,
  outputSizeBytes: outFileSizeBytes,
  ffmpegConversionCount,
  ffmpegArgs,
  scaleFilter,
  profile: PROFILE,
  marginTopBottomPx,
  marginSidePx,
  source: {
    widthPx: srcVideoStream?.width ?? null,
    heightPx: srcVideoStream?.height ?? null,
    durationSec: srcDurationSec,
    hasAudio: srcHasAudio,
  },
  output: {
    widthPx: outVideoStream?.width ?? null,
    heightPx: outVideoStream?.height ?? null,
    codecName: outVideoStream?.codec_name ?? null,
    pixFmt: outVideoStream?.pix_fmt ?? null,
    durationSec: outDurationSec,
    hasAudio: !!outAudioStream,
  },
  durationDeltaSec,
  checks: checks.map(([label, ok]) => ({ label, pass: ok })),
  allChecksPass: allPass,
  requiresPublicBlobUrl: false,
  youtubeUsesBlobUrl: false,
  uploadPerformed: false,
  renderedAt: new Date().toISOString(),
};

writeFileSync(RESULT_JSON_PATH, JSON.stringify(result, null, 2), "utf-8");

console.log(`\n[done] source ffprobe: ${SOURCE_PROBE_JSON_PATH}`);
console.log(`[done] output ffprobe: ${OUTPUT_PROBE_JSON_PATH}`);
console.log(`[done] result json:    ${RESULT_JSON_PATH}`);
console.log(`[done] output mp4:     ${APPROVED_OUTPUT_MP4}`);
console.log(`[done] ffmpeg conversion count: ${ffmpegConversionCount}`);
console.log(`[done] ${allPass ? "ALL PASS" : "SOME CHECKS FAILED"}\n`);

if (!allPass) process.exit(1);
