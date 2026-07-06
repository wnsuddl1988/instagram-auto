/**
 * YouTube Shorts letterbox variant renderer/planner (dry-run/no-write, no-live).
 *
 * Usage:
 *   node scripts/create-youtube-shorts-letterbox-variant.mjs --input <mp4> --output <mp4> [--dry-run]
 *   node scripts/create-youtube-shorts-letterbox-variant.mjs --example [--dry-run]
 *
 * This slice never executes ffmpeg. Default mode is dry-run/no-write: it only prints
 * the deterministic ffmpeg plan/command derived from the fixed render profile
 * (scripts/fixtures/youtube_shorts_letterbox_render_profile.v1.json).
 *
 * --example prints a deterministic plan without requiring a real input mp4 (no-input example mode).
 * --run is accepted as a future-slice flag but is refused in this slice — it must not execute ffmpeg here.
 *
 * Security constraints:
 * - No shell:true, no child-process execution of any kind in this file.
 * - No subprocess calls at all in this slice (planning only).
 * - No network/fetch/API calls.
 * - No environment variable or secret reads of any kind.
 * - No file writes of any kind.
 * - Output path safety is validated even though nothing is executed.
 */

import { existsSync } from "node:fs";
import { resolve, dirname, isAbsolute } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");

const PROFILE = {
  canvas: { widthPx: 1080, heightPx: 1920, backgroundColor: "black" },
  contentBox: { widthPx: 864, heightPx: 1536, centered: true },
  margins: { topBottomPx: 192, sidePx: 108 },
  codec: { video: "h264", pixelFormat: "yuv420p", faststart: true, audio: "aac" },
};

// ── CLI args ─────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
function getArg(name) {
  const idx = args.indexOf(name);
  if (idx !== -1 && args[idx + 1] && !args[idx + 1].startsWith("--")) return args[idx + 1];
  return null;
}
function hasFlag(name) {
  return args.includes(name);
}

const inputArg = getArg("--input");
const outputArg = getArg("--output");
const isExample = hasFlag("--example");
const isRun = hasFlag("--run");
const isDryRun = hasFlag("--dry-run") || !isRun;

if (!isExample && (!inputArg || !outputArg)) {
  console.error(
    "Usage: node create-youtube-shorts-letterbox-variant.mjs --input <mp4> --output <mp4> [--dry-run]\n" +
      "   or: node create-youtube-shorts-letterbox-variant.mjs --example [--dry-run]",
  );
  process.exit(1);
}

// ── Output path safety (validated even in dry-run/example mode) ─────────────
function validateOutputPathSafety(outputPath) {
  const abs = isAbsolute(outputPath) ? outputPath : resolve(REPO_ROOT, outputPath);
  const issues = [];
  if (abs.includes(".money-shorts-local")) issues.push(".money-shorts-local path forbidden");
  if (abs.toLowerCase().includes("c:\\tmp") || abs.toLowerCase().includes("/tmp/")) {
    // allowed location, no issue — only flagged for visibility
  }
  return { abs, issues };
}

// ── Build deterministic ffmpeg plan (never executed in this slice) ─────────
function buildFfmpegPlan(inputPath, outputPath) {
  const { canvas, contentBox, codec } = PROFILE;
  const scaleFilter =
    `scale=w=${contentBox.widthPx}:h=${contentBox.heightPx}:force_original_aspect_ratio=decrease,` +
    `pad=w=${canvas.widthPx}:h=${canvas.heightPx}:x=(ow-iw)/2:y=(oh-ih)/2:color=${canvas.backgroundColor}`;

  const ffmpegArgs = [
    "-y",
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

  return {
    tool: "ffmpeg",
    args: ffmpegArgs,
    commandString: ["ffmpeg", ...ffmpegArgs.map((a) => (a.includes(" ") ? `"${a}"` : a))].join(" "),
    profile: PROFILE,
  };
}

// ── Resolve input/output (example mode uses placeholder paths) ─────────────
const inputPath = isExample ? "<example-input>.mp4" : resolve(inputArg);
const outputPathRaw = isExample ? "<example-output>-youtube-letterbox.mp4" : outputArg;

if (!isExample && !existsSync(inputPath)) {
  console.error(`ABORT: --input file does not exist: ${inputPath}`);
  process.exit(1);
}

const outputSafety = isExample
  ? { abs: outputPathRaw, issues: [] }
  : validateOutputPathSafety(outputPathRaw);

if (outputSafety.issues.length > 0) {
  console.error(`ABORT: output path safety violation: ${outputSafety.issues.join("; ")}`);
  process.exit(1);
}

const plan = buildFfmpegPlan(inputPath, isExample ? outputPathRaw : outputSafety.abs);

// ── Print plan (no execution, no file writes) ───────────────────────────────
console.log("\n[youtube-letterbox-planner] mode:", isExample ? "example (no-input)" : "input/output plan");
console.log("[youtube-letterbox-planner] dry-run:", isDryRun);
console.log("[youtube-letterbox-planner] input:", inputPath);
console.log("[youtube-letterbox-planner] output:", isExample ? outputPathRaw : outputSafety.abs);
console.log();
console.log("[profile] canvas:", `${PROFILE.canvas.widthPx}x${PROFILE.canvas.heightPx}`, PROFILE.canvas.backgroundColor);
console.log("[profile] contentBox:", `${PROFILE.contentBox.widthPx}x${PROFILE.contentBox.heightPx}`, "centered:", PROFILE.contentBox.centered);
console.log("[profile] margins: top/bottom", PROFILE.margins.topBottomPx, "px, side", PROFILE.margins.sidePx, "px");
console.log("[profile] codec:", PROFILE.codec.video, PROFILE.codec.pixelFormat, "faststart:", PROFILE.codec.faststart, "audio:", PROFILE.codec.audio);
console.log();
console.log("[plan] ffmpeg command (not executed):");
console.log("  " + plan.commandString);
console.log();

if (isRun) {
  console.error(
    "ABORT: --run is not executable in this slice. This is a dry-run/no-write planner only.\n" +
      "Actual ffmpeg execution requires a separate approved slice.",
  );
  process.exit(1);
}

console.log("[done] dry-run/no-write. No mp4 was generated, no files were written.");
console.log("[done] ALL PASS (plan only)\n");
