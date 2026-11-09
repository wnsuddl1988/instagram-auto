/**
 * Visual-only silent mp4 renderer from a RenderManifest JSON fixture.
 *
 * Usage:
 *   node scripts/render-visual-only-from-render-manifest.mjs \
 *     --manifest scripts/fixtures/provider-candidate-render-manifest.visual-only.json \
 *     --out-dir C:\tmp\money-shorts-os\visual-only-v1
 *
 * Security constraints enforced here:
 * - No shell: true. ffmpeg invoked via spawnSync args array only.
 * - No live API calls.
 * - No clipboard write.
 * - Output goes outside the repo (--out-dir must be outside repo root).
 * - No .money-shorts-local/ access.
 * - piq_diag_out.txt is never touched.
 */

import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");

// ── CLI args ────────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
function getArg(name) {
  const idx = args.indexOf(name);
  if (idx !== -1 && args[idx + 1]) return args[idx + 1];
  return null;
}

const manifestPath = getArg("--manifest");
const outDir = getArg("--out-dir");

if (!manifestPath || !outDir) {
  console.error("Usage: node render-visual-only-from-render-manifest.mjs --manifest <path> --out-dir <path>");
  process.exit(1);
}

const manifestAbsPath = resolve(REPO_ROOT, manifestPath);
const outDirAbs = resolve(outDir);

// Safety: out-dir must not be inside repo root
if (outDirAbs.startsWith(REPO_ROOT + "\\") || outDirAbs.startsWith(REPO_ROOT + "/")) {
  console.error(`ABORT: --out-dir must be outside the repo root.\n  repo: ${REPO_ROOT}\n  out-dir: ${outDirAbs}`);
  process.exit(1);
}

// Safety: .money-shorts-local forbidden
if (outDirAbs.includes(".money-shorts-local") || manifestAbsPath.includes(".money-shorts-local")) {
  console.error("ABORT: .money-shorts-local access forbidden.");
  process.exit(1);
}

console.log(`\n[render-visual-only] manifest: ${manifestAbsPath}`);
console.log(`[render-visual-only] out-dir:  ${outDirAbs}\n`);

// ── Load manifest ───────────────────────────────────────────────────────────────
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

// Target duration: prefer ffmpegPlan.estimatedDurationSec, fallback to imageInputs sum
const imageInputsTotal = imageInputs.reduce((s, i) => s + i.durationSec, 0);
const targetDurationSec = (ffmpegPlan?.estimatedDurationSec ?? imageInputsTotal);

console.log(`  manifestId:    ${manifestId}`);
console.log(`  scenes:        ${imageInputs.length}`);
console.log(`  dimensions:    ${widthPx}x${heightPx}`);
console.log(`  fps:           ${fps}`);
console.log(`  crf:           ${crf}`);
console.log(`  targetDuration: ${targetDurationSec}s`);
console.log(`  captions:      ${captionOverlays.length}`);
console.log();

// ── Prepare output dir ──────────────────────────────────────────────────────────
mkdirSync(outDirAbs, { recursive: true });

// ── Generate placeholder scene images (solid color + scene number) ─────────────
// We generate minimal color cards per scene using ffmpeg lavfi.
// Color palette: alternates between charcoal-navy (#1a2540) and off-white (#f5f0eb).
const SCENE_COLORS = [
  "#1a2540", // 1 hook — dark navy
  "#f0ede8", // 2 signal — off-white
  "#1a2540", // 3 why_expert — dark navy
  "#f0ede8", // 4 life_impact — off-white
  "#1a2540", // 5 outlook — dark navy
  "#f0ede8", // 6 closing — off-white
];

const sceneImagePaths = [];

console.log("[step 1/4] Generating placeholder scene images...");
for (let i = 0; i < imageInputs.length; i++) {
  const sceneNum = i + 1;
  const imgPath = join(outDirAbs, `scene-${sceneNum}.png`);
  sceneImagePaths.push(imgPath);
  const color = SCENE_COLORS[i] ?? "#1a2540";

  // ffmpeg -f lavfi -i color=c=<hex>:s=1080x1920:r=1 -frames:v 1 <output>
  const ffmpegArgs = [
    "-y",
    "-f", "lavfi",
    "-i", `color=c=${color}:s=${widthPx}x${heightPx}:r=1`,
    "-frames:v", "1",
    imgPath,
  ];

  const result = spawnSync("ffmpeg", ffmpegArgs, { encoding: "utf-8" });
  if (result.status !== 0) {
    console.error(`  FAIL scene-${sceneNum} image: exit ${result.status}`);
    if (result.stderr) console.error(result.stderr.slice(-500));
    process.exit(1);
  }
  console.log(`  scene-${sceneNum}: ${imgPath}`);
}
console.log();

// ── Build ASS subtitle file ─────────────────────────────────────────────────────
// ASS format supports Korean (UTF-8) and is guaranteed by libass in this ffmpeg build.
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
  // White bold text, black outline, lower-center position (alignment 2 = bottom center)
  "Style: Caption,Arial,72,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,4,2,2,60,60,120,1",
  "",
  "[Events]",
  "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
];

for (const cap of captionOverlays) {
  const start = secToAssTime(cap.showAtSec);
  const end = secToAssTime(cap.hideAtSec);
  // Escape special ASS chars: { } \
  const text = cap.captionText.replace(/\\/g, "\\\\").replace(/\{/g, "\\{").replace(/\}/g, "\\}");
  assLines.push(`Dialogue: 0,${start},${end},Caption,,0,0,0,,${text}`);
}

const assContent = assLines.join("\n") + "\n";
const assPath = join(outDirAbs, "captions.ass");
writeFileSync(assPath, assContent, "utf-8");

console.log(`[step 2/4] ASS subtitle file written: ${assPath}`);
console.log(`  ${captionOverlays.length} caption events`);
console.log();

// ── Concatenation list file ─────────────────────────────────────────────────────
// ffmpeg concat demuxer: one "file + duration" entry per scene image.
const concatLines = [];
for (let i = 0; i < imageInputs.length; i++) {
  // Use forward slashes inside the concat list (ffmpeg on Windows handles both)
  concatLines.push(`file '${sceneImagePaths[i].replace(/\\/g, "/")}'`);
  concatLines.push(`duration ${imageInputs[i].durationSec}`);
}
// Repeat last entry without duration to avoid last-frame decode issue
concatLines.push(`file '${sceneImagePaths[sceneImagePaths.length - 1].replace(/\\/g, "/")}'`);

const concatListPath = join(outDirAbs, "concat.txt");
writeFileSync(concatListPath, concatLines.join("\n") + "\n", "utf-8");
console.log(`[step 3/4] Concat list written: ${concatListPath}`);
console.log();

// ── Run ffmpeg: concat images + burn ASS subtitles → silent mp4 ────────────────
const outputFileName = `${manifestId}-visual-only.mp4`;
const outputPath = join(outDirAbs, outputFileName);

console.log(`[step 4/4] Running ffmpeg...`);
console.log(`  output: ${outputPath}`);

// Args array — no shell: true, no shell string command
const ffmpegRenderArgs = [
  "-y",
  // Input: image concat
  "-f", "concat",
  "-safe", "0",
  "-i", concatListPath,
  // Filter: scale to exact 1080×1920, burn ASS subtitles via libass
  // ffmpeg ass filter on Windows: escape drive-letter colon as \: and wrap in single quotes
  "-vf", `scale=${widthPx}:${heightPx}:force_original_aspect_ratio=decrease,pad=${widthPx}:${heightPx}:(ow-iw)/2:(oh-ih)/2,ass='${assPath.replace(/\\/g, "/").replace(/^([A-Za-z]):/, "$1\\:")}'`,
  // Video encode
  "-c:v", "libx264",
  "-crf", String(crf),
  "-preset", "fast",
  "-pix_fmt", "yuv420p",
  "-r", String(fps),
  // No audio (-an = visual only, silent)
  "-an",
  // Trim to target duration to prevent concat demuxer last-frame padding
  "-t", String(targetDurationSec),
  outputPath,
];

console.log(`  ffmpeg args: ${ffmpegRenderArgs.join(" ")}\n`);

const renderResult = spawnSync("ffmpeg", ffmpegRenderArgs, {
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

// Print last few lines of ffmpeg output for confirmation
if (renderResult.stderr) {
  const lines = renderResult.stderr.split("\n");
  const tail = lines.slice(-10).filter((l) => l.trim().length > 0);
  console.log("  ffmpeg output (tail):");
  tail.forEach((l) => console.log("    " + l));
}
console.log();

// ── Verify with ffprobe ─────────────────────────────────────────────────────────
console.log("[verify] Running ffprobe...");
const probeArgs = [
  "-v", "quiet",
  "-print_format", "json",
  "-show_format",
  "-show_streams",
  outputPath,
];

const probeResult = spawnSync("ffprobe", probeArgs, {
  encoding: "utf-8",
  maxBuffer: 2 * 1024 * 1024,
});

if (probeResult.status !== 0) {
  console.error("ffprobe FAILED — duration/audio validation required. Cannot proceed.");
  if (probeResult.stderr) console.error(probeResult.stderr.slice(-500));
  process.exit(1);
}

let probe;
try {
  probe = JSON.parse(probeResult.stdout);
} catch {
  console.error("ffprobe output parse error — cannot validate.");
  process.exit(1);
}

const fmt = probe.format;
const streams = probe.streams ?? [];
const videoStream = streams.find((s) => s.codec_type === "video");
const audioStreams = streams.filter((s) => s.codec_type === "audio");
const actualDurationSec = parseFloat(fmt?.duration ?? "0");
const fileSizeBytes = parseInt(fmt?.size ?? "0", 10);

console.log(`  format:       ${fmt?.format_name}`);
console.log(`  duration:     ${actualDurationSec}s  (target: ${targetDurationSec}s)`);
console.log(`  size:         ${Math.round(fileSizeBytes / 1024)}KB  (${fileSizeBytes} bytes)`);
console.log(`  video codec:  ${videoStream?.codec_name ?? "NONE"}`);
console.log(`  resolution:   ${videoStream?.width}x${videoStream?.height}`);
console.log(`  fps:          ${videoStream?.r_frame_rate}`);
console.log(`  pix_fmt:      ${videoStream?.pix_fmt}`);
console.log(`  audio:        ${audioStreams.length === 0 ? "NONE (silent, expected)" : audioStreams.map((s) => s.codec_name).join(", ")}`);

// Validation: targetDurationSec ± 0.5s
const durationLo = targetDurationSec - 0.5;
const durationHi = targetDurationSec + 0.5;
const checks = [
  ["format is mp4", fmt?.format_name?.includes("mp4")],
  ["video codec h264", videoStream?.codec_name === "h264"],
  ["width 1080", videoStream?.width === widthPx],
  ["height 1920", videoStream?.height === heightPx],
  ["pix_fmt yuv420p", videoStream?.pix_fmt === "yuv420p"],
  ["no audio stream (visual-only)", audioStreams.length === 0],
  [`duration ${targetDurationSec}s ± 0.5s`, actualDurationSec >= durationLo && actualDurationSec <= durationHi],
];

console.log();
let allPass = true;
for (const [label, ok] of checks) {
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}`);
  if (!ok) allPass = false;
}

if (!allPass) {
  console.error("\nSome validation checks FAILED.");
  process.exit(1);
}

// ── Write output summary JSON ───────────────────────────────────────────────────
const summaryPath = join(outDirAbs, "render-summary.json");

// Windows Arial font is used for ASS subtitles.
// Korean glyphs are rendered via Windows DirectWrite/GDI font fallback.
// Visual glyph inspection not performed — confirm Korean caption rendering manually.
const subtitleRiskNotes = [
  "Font: Arial (Windows DirectWrite/GDI fallback for Korean). Explicit Korean font not specified.",
  "Visual glyph inspection not performed — confirm Korean caption rendering manually before TTS mux.",
];

const summary = {
  manifestId,
  renderedAt: new Date().toISOString(),
  outputFile: outputFileName,
  outputPath,
  outDir: outDirAbs,
  targetDurationSec,
  durationSec: actualDurationSec,
  widthPx,
  heightPx,
  fps,
  crf,
  sceneCount: imageInputs.length,
  captionOverlayCount: captionOverlays.length,
  subtitleMode: "ass",
  ffmpegExitCode: renderResult.status,
  fileSizeBytes,
  audioStreamCount: audioStreams.length,
  audioMode: "silent_visual_only",
  subtitleRiskNotes,
  status: "success",
};
writeFileSync(summaryPath, JSON.stringify(summary, null, 2), "utf-8");

console.log(`\n[done] render-summary.json: ${summaryPath}`);
console.log(`[done] Output mp4: ${outputPath}`);
console.log(`[done] ALL PASS\n`);
