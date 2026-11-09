/**
 * Data-card visual-only renderer.
 * Reads a render manifest + pre-built PNG asset directory,
 * concatenates scene images with ASS captions → silent h264 mp4.
 *
 * Usage:
 *   node scripts/render-data-card-visual-from-assets.mjs \
 *     --manifest scripts/fixtures/provider-candidate-render-manifest.ecos-live-yohan-koo.data-card.json \
 *     --assets-dir C:\tmp\money-shorts-os\ecos-live-yohan-koo-data-card-visual-v1\assets \
 *     --out-dir C:\tmp\money-shorts-os\ecos-live-yohan-koo-data-card-visual-v1\visual-only
 *
 * Security constraints:
 * - No shell: true. All processes via spawnSync args array only.
 * - No fetch/network calls.
 * - No .money-shorts-local/ access.
 * - No .env.local read.
 * - piq_diag_out.txt never touched.
 * - out-dir must be outside repo root.
 */

import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");

// ── CLI args ───────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
function getArg(name) {
  const idx = args.indexOf(name);
  if (idx !== -1 && args[idx + 1]) return args[idx + 1];
  return null;
}

const manifestPath = getArg("--manifest");
const assetsDir = getArg("--assets-dir");
const outDir = getArg("--out-dir");

if (!manifestPath || !assetsDir || !outDir) {
  console.error(
    "Usage: node render-data-card-visual-from-assets.mjs --manifest <path> --assets-dir <path> --out-dir <path>",
  );
  process.exit(1);
}

const manifestAbsPath = resolve(REPO_ROOT, manifestPath);
const assetsDirAbs = resolve(assetsDir);
const outDirAbs = resolve(outDir);

// Safety: out-dir must not be inside repo root
if (outDirAbs.startsWith(REPO_ROOT + "\\") || outDirAbs.startsWith(REPO_ROOT + "/")) {
  console.error(`ABORT: --out-dir must be outside the repo root.\n  repo: ${REPO_ROOT}\n  out-dir: ${outDirAbs}`);
  process.exit(1);
}

// Safety: .money-shorts-local forbidden
for (const p of [outDirAbs, assetsDirAbs, manifestAbsPath]) {
  if (p.includes(".money-shorts-local")) {
    console.error("ABORT: .money-shorts-local access forbidden.");
    process.exit(1);
  }
}

console.log(`\n[render-data-card] manifest:   ${manifestAbsPath}`);
console.log(`[render-data-card] assets-dir: ${assetsDirAbs}`);
console.log(`[render-data-card] out-dir:    ${outDirAbs}\n`);

// ── Load manifest ──────────────────────────────────────────────────────────────
let manifest;
try {
  manifest = JSON.parse(readFileSync(manifestAbsPath, "utf-8"));
} catch (e) {
  console.error(`ABORT: Cannot read manifest: ${e.message}`);
  process.exit(1);
}

const { manifestId, outputSpec, imageInputs, captionOverlays, ffmpegPlan } = manifest;
const { widthPx, heightPx } = outputSpec.dimensions;
const fps = outputSpec.fps ?? 30;
const crf = outputSpec.crf ?? 23;
const imageInputsTotal = imageInputs.reduce((s, i) => s + i.durationSec, 0);
const targetDurationSec = ffmpegPlan?.estimatedDurationSec ?? imageInputsTotal;

console.log(`  manifestId:     ${manifestId}`);
console.log(`  scenes:         ${imageInputs.length}`);
console.log(`  dimensions:     ${widthPx}x${heightPx}`);
console.log(`  fps:            ${fps}`);
console.log(`  crf:            ${crf}`);
console.log(`  targetDuration: ${targetDurationSec}s`);
console.log(`  captions:       ${captionOverlays.length}`);
console.log();

mkdirSync(outDirAbs, { recursive: true });

// ── Step 1: Resolve asset paths ────────────────────────────────────────────────
console.log("[step 1/4] Resolving scene asset paths...");
const sceneImagePaths = [];

for (let i = 0; i < imageInputs.length; i++) {
  const sceneNum = i + 1;
  // Asset naming: scene-01.png ... scene-06.png
  const paddedNum = String(sceneNum).padStart(2, "0");
  const imgPath = join(assetsDirAbs, `scene-${paddedNum}.png`);

  if (!existsSync(imgPath)) {
    console.error(`ABORT: scene asset not found: ${imgPath}`);
    process.exit(1);
  }
  sceneImagePaths.push(imgPath);
  console.log(`  scene-${sceneNum}: ${imgPath} ✓`);
}
console.log();

// ── Step 2: Build ASS subtitle file ────────────────────────────────────────────
function secToAssTime(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  const cs = Math.round((sec - Math.floor(sec)) * 100);
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(cs).padStart(2, "00")}`;
}

const assLines = [
  "[Script Info]",
  "ScriptType: v4.00+",
  "PlayResX: 1080",
  "PlayResY: 1920",
  "ScaledBorderAndShadow: yes",
  "",
  "[V4+ Styles]",
  "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
  "Style: Caption,Arial,72,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,4,2,2,60,60,120,1",
  "",
  "[Events]",
  "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
];

for (const cap of captionOverlays) {
  const start = secToAssTime(cap.showAtSec);
  const end = secToAssTime(cap.hideAtSec);
  const text = cap.captionText.replace(/\\/g, "\\\\").replace(/\{/g, "\\{").replace(/\}/g, "\\}");
  assLines.push(`Dialogue: 0,${start},${end},Caption,,0,0,0,,${text}`);
}

const assPath = join(outDirAbs, "captions.ass");
writeFileSync(assPath, assLines.join("\n") + "\n", "utf-8");
console.log(`[step 2/4] ASS subtitle file written: ${assPath}`);
console.log(`  ${captionOverlays.length} caption events`);
console.log();

// ── Step 3: Build concat list ──────────────────────────────────────────────────
const concatLines = [];
for (let i = 0; i < imageInputs.length; i++) {
  concatLines.push(`file '${sceneImagePaths[i].replace(/\\/g, "/")}'`);
  concatLines.push(`duration ${imageInputs[i].durationSec}`);
}
// Repeat last entry to avoid last-frame padding
concatLines.push(`file '${sceneImagePaths[sceneImagePaths.length - 1].replace(/\\/g, "/")}'`);

const concatListPath = join(outDirAbs, "concat.txt");
writeFileSync(concatListPath, concatLines.join("\n") + "\n", "utf-8");
console.log(`[step 3/4] Concat list written: ${concatListPath}`);
console.log();

// ── Step 4: ffmpeg render ──────────────────────────────────────────────────────
const outputFileName = `${manifestId}-data-card-visual-only.mp4`;
const outputPath = join(outDirAbs, outputFileName);

console.log("[step 4/4] Running ffmpeg...");
console.log(`  output: ${outputPath}`);

const assPathFfmpeg = assPath.replace(/\\/g, "/").replace(/^([A-Za-z]):/, "$1\\:");

const ffmpegArgs = [
  "-y",
  "-f", "concat",
  "-safe", "0",
  "-i", concatListPath,
  "-vf", `scale=${widthPx}:${heightPx}:force_original_aspect_ratio=decrease,pad=${widthPx}:${heightPx}:(ow-iw)/2:(oh-ih)/2,ass='${assPathFfmpeg}'`,
  "-c:v", "libx264",
  "-crf", String(crf),
  "-preset", "fast",
  "-pix_fmt", "yuv420p",
  "-r", String(fps),
  "-an",
  "-t", String(targetDurationSec),
  outputPath,
];

console.log(`  ffmpeg args: ${ffmpegArgs.join(" ")}\n`);

const renderResult = spawnSync("ffmpeg", ffmpegArgs, {
  encoding: "utf-8",
  maxBuffer: 10 * 1024 * 1024,
});

if (renderResult.status !== 0) {
  console.error(`\nFFMPEG FAILED (exit ${renderResult.status})`);
  if (renderResult.stderr) {
    const lines = renderResult.stderr.split("\n");
    console.error(lines.slice(-30).join("\n"));
  }
  process.exit(1);
}

if (renderResult.stderr) {
  const lines = renderResult.stderr.split("\n");
  const tail = lines.slice(-10).filter((l) => l.trim().length > 0);
  console.log("  ffmpeg output (tail):");
  tail.forEach((l) => console.log("    " + l));
}
console.log();

// ── Verify with ffprobe ────────────────────────────────────────────────────────
console.log("[verify] Running ffprobe...");
const probeResult = spawnSync(
  "ffprobe",
  ["-v", "quiet", "-print_format", "json", "-show_format", "-show_streams", outputPath],
  { encoding: "utf-8", maxBuffer: 2 * 1024 * 1024 },
);

if (probeResult.status !== 0) {
  console.error("ffprobe FAILED");
  if (probeResult.stderr) console.error(probeResult.stderr.slice(-500));
  process.exit(1);
}

let probe;
try {
  probe = JSON.parse(probeResult.stdout);
} catch {
  console.error("ffprobe output parse error.");
  process.exit(1);
}

const fmt = probe.format;
const streams = probe.streams ?? [];
const videoStream = streams.find((s) => s.codec_type === "video");
const audioStreams = streams.filter((s) => s.codec_type === "audio");

const actualDuration = Math.round(parseFloat(fmt?.duration ?? "0"));
const fileSizeBytes = parseInt(fmt?.size ?? "0", 10);
const videoCodec = videoStream?.codec_name ?? "unknown";
const vidWidth = videoStream?.width ?? 0;
const vidHeight = videoStream?.height ?? 0;

console.log(`  format:       ${fmt?.format_name}`);
console.log(`  duration:     ${actualDuration}s  (target: ${targetDurationSec}s)`);
console.log(`  size:         ${Math.round(fileSizeBytes / 1024)}KB  (${fileSizeBytes} bytes)`);
console.log(`  video codec:  ${videoCodec}`);
console.log(`  resolution:   ${vidWidth}x${vidHeight}`);
console.log(`  audio:        ${audioStreams.length === 0 ? "NONE (silent, expected)" : audioStreams.length + " stream(s)"}`);
console.log();

const passes = [];
const fails = [];

function check(label, pass) {
  if (pass) passes.push(label);
  else fails.push(label);
  console.log(`  ${pass ? "PASS" : "FAIL"}  ${label}`);
}

check("format is mp4", (fmt?.format_name ?? "").includes("mp4"));
check("video codec h264", videoCodec === "h264");
check("width 1080", vidWidth === 1080);
check("height 1920", vidHeight === 1920);
check("pix_fmt yuv420p", videoStream?.pix_fmt === "yuv420p");
check("no audio stream (visual-only)", audioStreams.length === 0);
check(`duration ${targetDurationSec}s ± 0.5s`, Math.abs(actualDuration - targetDurationSec) <= 0.5);

console.log();

if (fails.length > 0) {
  console.error(`[verify] FAIL: ${fails.join(", ")}`);
  process.exit(1);
}

// ── Write summary ──────────────────────────────────────────────────────────────
const summary = {
  schemaVersion: "money_shorts_data_card_render_summary_v1",
  manifestId,
  outputPath,
  durationSec: actualDuration,
  targetDurationSec,
  widthPx: vidWidth,
  heightPx: vidHeight,
  videoCodec,
  audioStreamCount: audioStreams.length,
  fileSizeBytes,
  ffmpegExitCode: renderResult.status,
  riskNotes: [
    "Data-card visual-only render: uses pre-built PNG assets, no external API calls.",
    "Korean glyph rendering depends on system fonts for ASS captions overlay.",
    "ASS captions embedded: data-card PNG already has Korean text baked in — captions are supplemental.",
  ],
};

const summaryPath = join(outDirAbs, "render-summary.json");
writeFileSync(summaryPath, JSON.stringify(summary, null, 2), "utf-8");

console.log(`[done] render-summary.json: ${summaryPath}`);
console.log(`[done] Output mp4: ${outputPath}`);
console.log("[done] ALL PASS");
