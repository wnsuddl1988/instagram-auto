/**
 * Visual-only silent mp4 renderer — SELECTED IMAGE render manifest v1 consumer.
 *
 * 핵심 차이 (기존 render-visual-only-from-render-manifest.mjs 대비):
 *   기존 렌더러는 imageInputs.assetPath를 읽지 않고 ffmpeg lavfi로 placeholder
 *   단색 카드를 새로 생성했다. 이 렌더러는 실제 selected image PNG 6장을
 *   assetPath 그대로 읽어 ffmpeg concat 입력으로 사용한다. placeholder 이미지
 *   생성 코드는 이 파일에 존재하지 않는다.
 *
 * Usage:
 *   node scripts/render-premium-editorial-selected-image-visual-only-v1.mjs \
 *     --manifest scripts/fixtures/premium-editorial-selected-image-render-manifest.v1.json \
 *     --out-dir C:\tmp\money-shorts-os\selected-image-visual-only-v1
 *
 * Security constraints enforced here:
 * - No shell: true. ffmpeg/ffprobe invoked via spawnSync args array only.
 * - No live API calls, no network.
 * - Output goes outside the repo (--out-dir must be outside repo root).
 * - No .money-shorts-local/ access.
 * - piq_diag_out.txt is never touched.
 * - Silent mp4 only (-an). No audio mux.
 */

import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");

// ── CLI args ────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
function getArg(name) {
  const idx = args.indexOf(name);
  if (idx !== -1 && args[idx + 1]) return args[idx + 1];
  return null;
}

const manifestPath = getArg("--manifest");
const outDir = getArg("--out-dir");

if (!manifestPath || !outDir) {
  console.error("Usage: node render-premium-editorial-selected-image-visual-only-v1.mjs --manifest <path> --out-dir <path>");
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

console.log(`\n[render-selected-image] manifest: ${manifestAbsPath}`);
console.log(`[render-selected-image] out-dir:  ${outDirAbs}\n`);

// ── Load manifest ─────────────────────────────────────────────────────────
let manifest;
try {
  manifest = JSON.parse(readFileSync(manifestAbsPath, "utf-8"));
} catch (e) {
  console.error(`ABORT: Cannot read manifest: ${e.message}`);
  process.exit(1);
}

if (manifest.schemaVersion !== "money_shorts_selected_image_render_manifest_v1") {
  console.error(`ABORT: manifest schemaVersion 불일치 — ${manifest.schemaVersion}`);
  process.exit(1);
}

const { outputSpec, imageInputs, captionOverlays } = manifest;
const { widthPx, heightPx } = outputSpec.dimensions;
const fps = outputSpec.fps ?? 30;
const crf = outputSpec.crf ?? 23;
// caption font size: manifest outputSpec.captionFontSize 우선, 없으면 기존 default 72.
const captionFontSize = Number.isFinite(outputSpec.captionFontSize) ? outputSpec.captionFontSize : 72;

const targetDurationSec = imageInputs.reduce((s, i) => s + i.durationSec, 0);

console.log(`  scenes:        ${imageInputs.length}`);
console.log(`  dimensions:    ${widthPx}x${heightPx}`);
console.log(`  fps:           ${fps}`);
console.log(`  crf:           ${crf}`);
console.log(`  targetDuration: ${targetDurationSec}s`);
console.log(`  captions:      ${captionOverlays.length}`);
console.log();

// ── Prepare output dir ──────────────────────────────────────────────────────
mkdirSync(outDirAbs, { recursive: true });

// ── Resolve ACTUAL selected image PNG paths (assetPath from manifest, NOT placeholders) ──
console.log("[step 1/3] Resolving actual selected image assetPaths (no image generation)...");
const sceneImagePaths = [];
for (const input of imageInputs) {
  const absAssetPath = resolve(REPO_ROOT, input.assetPath);
  if (!existsSync(absAssetPath)) {
    console.error(`ABORT: assetPath not found on disk — scene ${input.sceneIndex}: ${absAssetPath}`);
    process.exit(1);
  }
  sceneImagePaths.push(absAssetPath);
  console.log(`  scene ${input.sceneIndex} (${input.sceneRole}, ${input.sourceRun}): ${absAssetPath}`);
}
console.log();

// ── Build ASS subtitle file ─────────────────────────────────────────────────
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
  `Style: Caption,Arial,${captionFontSize},&H00FFFFFF,&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,4,2,2,60,60,120,1`,
  "",
  "[Events]",
  "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
];

for (const cap of captionOverlays) {
  // one-line caption 강제: 실제 개행 또는 ASS 강제 줄바꿈(\N, \n)이 있으면 ABORT.
  if (/[\r\n]/.test(cap.captionText) || /\\N|\\n/.test(cap.captionText)) {
    console.error(`ABORT: caption for scene ${cap.sceneIndex} contains a forced line break (newline or \\N). Captions must be single-line.`);
    process.exit(1);
  }
  const start = secToAssTime(cap.showAtSec);
  const end = secToAssTime(cap.hideAtSec);
  const text = cap.captionText.replace(/\\/g, "\\\\").replace(/\{/g, "\\{").replace(/\}/g, "\\}");
  assLines.push(`Dialogue: 0,${start},${end},Caption,,0,0,0,,${text}`);
}

const assContent = assLines.join("\n") + "\n";
const assPath = join(outDirAbs, "captions.ass");
writeFileSync(assPath, assContent, "utf-8");

console.log(`[step 2/3] ASS subtitle file written: ${assPath}`);
console.log(`  ${captionOverlays.length} caption events, fontSize=${captionFontSize}, one-line enforced`);
console.log();

// ── Concatenation list file (actual selected image PNGs) ───────────────────
const concatLines = [];
for (let i = 0; i < imageInputs.length; i++) {
  concatLines.push(`file '${sceneImagePaths[i].replace(/\\/g, "/")}'`);
  concatLines.push(`duration ${imageInputs[i].durationSec}`);
}
// Repeat last entry without duration to avoid last-frame decode issue
concatLines.push(`file '${sceneImagePaths[sceneImagePaths.length - 1].replace(/\\/g, "/")}'`);

const concatListPath = join(outDirAbs, "concat.txt");
writeFileSync(concatListPath, concatLines.join("\n") + "\n", "utf-8");
console.log(`  Concat list written (actual assetPath images): ${concatListPath}`);
console.log();

// ── Run ffmpeg: concat ACTUAL images + burn ASS subtitles → silent mp4 ─────
const outputFileName = "premium-editorial-selected-image-visual-only-v1.mp4";
const outputPath = join(outDirAbs, outputFileName);

console.log(`[step 3/3] Running ffmpeg (actual selected images, no placeholder generation)...`);
console.log(`  output: ${outputPath}`);

const ffmpegRenderArgs = [
  "-y",
  "-f", "concat",
  "-safe", "0",
  "-i", concatListPath,
  "-vf", `scale=${widthPx}:${heightPx}:force_original_aspect_ratio=decrease,pad=${widthPx}:${heightPx}:(ow-iw)/2:(oh-ih)/2,ass='${assPath.replace(/\\/g, "/").replace(/^([A-Za-z]):/, "$1\\:")}'`,
  "-c:v", "libx264",
  "-crf", String(crf),
  "-preset", "fast",
  "-pix_fmt", "yuv420p",
  "-r", String(fps),
  "-an",
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

if (renderResult.stderr) {
  const lines = renderResult.stderr.split("\n");
  const tail = lines.slice(-10).filter((l) => l.trim().length > 0);
  console.log("  ffmpeg output (tail):");
  tail.forEach((l) => console.log("    " + l));
}
console.log();

// ── Verify with ffprobe ──────────────────────────────────────────────────────
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

// ── Write output summary JSON (repo 밖 out-dir에만 저장) ────────────────────
const summaryPath = join(outDirAbs, "render-summary.json");

const summary = {
  manifestSchemaVersion: manifest.schemaVersion,
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
  usedActualSelectedImages: true,
  placeholderImagesUsed: false,
  assetPathsUsed: imageInputs.map((i) => ({ sceneIndex: i.sceneIndex, sceneRole: i.sceneRole, sourceRun: i.sourceRun, assetPath: i.assetPath })),
  captionOverlayCount: captionOverlays.length,
  subtitleMode: "ass",
  ffmpegExitCode: renderResult.status,
  fileSizeBytes,
  audioStreamCount: audioStreams.length,
  audioMode: "silent_visual_only",
  audioMuxPerformed: false,
  uploadPerformed: false,
  status: "success",
};
writeFileSync(summaryPath, JSON.stringify(summary, null, 2), "utf-8");

console.log(`\n[done] render-summary.json: ${summaryPath}`);
console.log(`[done] Output mp4: ${outputPath}`);
console.log(`[done] ALL PASS — actual selected images used, no placeholder generation\n`);
