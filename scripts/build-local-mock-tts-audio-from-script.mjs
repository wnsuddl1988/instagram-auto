/**
 * Generates a local_mock TTS audio placeholder from a TTS script JSON.
 *
 * Usage:
 *   node scripts/build-local-mock-tts-audio-from-script.mjs \
 *     --tts-script <tts script JSON path> \
 *     --out-dir    <output directory (must be outside repo)>
 *
 * Outputs:
 *   ${outDir}/${scriptId}-mock-audio.wav
 *   ${outDir}/local-mock-tts-audio-summary.json
 *
 * Security constraints:
 * - No shell: true. All processes via spawnSync args array only.
 * - No exec/execSync. No shell string command.
 * - No network/fetch/API calls (OpenAI, ElevenLabs, Google, Azure, etc.).
 * - out-dir must be outside repo root.
 * - No .money-shorts-local/ access.
 * - No output artifacts inside repo.
 * - piq_diag_out.txt never touched.
 *
 * TTS mode: local_mock — ffmpeg lavfi anoisesrc placeholder audio (not real speech).
 * Final voice quality must be validated with ElevenLabs in a separate task.
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

const ttsScriptArg = getArg("--tts-script");
const outDir = getArg("--out-dir");

if (!ttsScriptArg || !outDir) {
  console.error(
    "Usage: node build-local-mock-tts-audio-from-script.mjs --tts-script <path> --out-dir <path>",
  );
  process.exit(1);
}

const ttsScriptAbsPath = resolve(REPO_ROOT, ttsScriptArg);
const outDirAbs = resolve(outDir);

// Safety: out-dir must not be inside repo root
if (outDirAbs.startsWith(REPO_ROOT + "\\") || outDirAbs.startsWith(REPO_ROOT + "/")) {
  console.error(
    `ABORT: --out-dir must be outside repo root.\n  repo: ${REPO_ROOT}\n  out-dir: ${outDirAbs}`,
  );
  process.exit(1);
}

// Safety: .money-shorts-local forbidden
if ([ttsScriptAbsPath, outDirAbs].some((p) => p.includes(".money-shorts-local"))) {
  console.error("ABORT: .money-shorts-local access forbidden.");
  process.exit(1);
}

console.log(`\n[tts-audio-builder] tts-script: ${ttsScriptAbsPath}`);
console.log(`[tts-audio-builder] out-dir:    ${outDirAbs}\n`);

// ── Load TTS script ─────────────────────────────────────────────────────────────
let ttsScript;
try {
  ttsScript = JSON.parse(readFileSync(ttsScriptAbsPath, "utf-8"));
} catch (e) {
  console.error(`ABORT: Cannot read TTS script: ${e.message}`);
  process.exit(1);
}

if (ttsScript.ttsMode !== "local_mock") {
  console.error(
    `ABORT: Only ttsMode=local_mock is supported in this builder. Got: ${ttsScript.ttsMode}`,
  );
  process.exit(1);
}

const { scriptId, manifestId, scenes, targetDurationSec } = ttsScript;
const totalSceneDurationSec = scenes.reduce((s, sc) => s + sc.durationSec, 0);

console.log(`  scriptId:         ${scriptId}`);
console.log(`  manifestId:       ${manifestId}`);
console.log(`  ttsMode:          ${ttsScript.ttsMode}`);
console.log(`  scenes:           ${scenes.length}`);
console.log(`  targetDuration:   ${targetDurationSec}s`);
console.log(`  sceneTotal:       ${totalSceneDurationSec}s`);
console.log();

mkdirSync(outDirAbs, { recursive: true });

// ── Step 1: Generate local mock TTS audio via ffmpeg lavfi ─────────────────────
// local_mock: ffmpeg lavfi anoisesrc (pink noise) at low amplitude for duration.
// This is NOT real speech — it is a pipeline validation placeholder.
console.log("[step 1/2] Generating local mock TTS audio (lavfi placeholder)...");

const audioPath = join(outDirAbs, `${scriptId}-mock-audio.wav`);

const ffmpegArgs = [
  "-y",
  "-f", "lavfi",
  "-i", `anoisesrc=colour=pink:amplitude=0.03:duration=${totalSceneDurationSec}`,
  "-ar", "44100",
  "-ac", "1",
  audioPath,
];

const ffmpegResult = spawnSync("ffmpeg", ffmpegArgs, {
  encoding: "utf-8",
  maxBuffer: 4 * 1024 * 1024,
  shell: false,
});

const ffmpegExitCode = ffmpegResult.status ?? -1;

if (ffmpegExitCode !== 0) {
  console.error(`ABORT: ffmpeg mock audio generation failed (exit ${ffmpegExitCode})`);
  if (ffmpegResult.stderr) console.error(ffmpegResult.stderr.slice(-500));
  process.exit(1);
}
console.log(`  audio path: ${audioPath}`);

// ── Step 2: Probe generated audio ─────────────────────────────────────────────
console.log("[step 2/2] Probing generated audio...");

const probeAudioArgs = [
  "-v", "quiet",
  "-print_format", "json",
  "-show_format",
  "-show_streams",
  audioPath,
];

const probeAudioResult = spawnSync("ffprobe", probeAudioArgs, {
  encoding: "utf-8",
  maxBuffer: 1 * 1024 * 1024,
  shell: false,
});

const ffprobeExitCode = probeAudioResult.status ?? -1;

if (ffprobeExitCode !== 0) {
  console.error(`ABORT: ffprobe failed on generated audio (exit ${ffprobeExitCode})`);
  if (probeAudioResult.stderr) console.error(probeAudioResult.stderr.slice(-300));
  process.exit(1);
}

let audioProbe;
try {
  audioProbe = JSON.parse(probeAudioResult.stdout);
} catch (e) {
  console.error(`ABORT: Cannot parse ffprobe output for generated audio: ${e.message}`);
  process.exit(1);
}

const audioStream = (audioProbe.streams ?? []).find((s) => s.codec_type === "audio");
if (!audioStream) {
  console.error("ABORT: ffprobe found no audio stream in generated wav file.");
  process.exit(1);
}

const rawAudioDurationSec = parseFloat(audioProbe.format?.duration ?? "NaN");
if (!Number.isFinite(rawAudioDurationSec) || rawAudioDurationSec <= 0) {
  console.error(`ABORT: ffprobe returned invalid duration: ${audioProbe.format?.duration}`);
  process.exit(1);
}

const durationDelta = Math.abs(rawAudioDurationSec - totalSceneDurationSec);
if (durationDelta > 2.0) {
  console.error(
    `ABORT: generated audio duration (${rawAudioDurationSec}s) deviates more than 2s from expected (${totalSceneDurationSec}s).`,
  );
  process.exit(1);
}

const audioCodec = audioStream.codec_name ?? "unknown";

console.log(`  raw audio duration: ${rawAudioDurationSec}s`);
console.log(`  audio codec:        ${audioCodec}`);
console.log();

// ── Write local-mock-tts-audio-summary.json ────────────────────────────────────
const summaryPath = join(outDirAbs, "local-mock-tts-audio-summary.json");
const summary = {
  schemaVersion: "money_shorts_local_mock_tts_audio_summary_v1",
  mode: "local_mock",
  scriptId,
  manifestId,
  sourceScriptPath: ttsScriptAbsPath,
  audioPath,
  rawAudioDurationSec,
  targetDurationSec,
  audioCodec,
  ffmpegExitCode,
  ffprobeExitCode,
  generatedAt: new Date().toISOString(),
  notRealSpeech: true,
  riskNotes: [
    "local_mock: pink noise placeholder audio — NOT real speech.",
    "Real narration text is stored in the TTS script fixture for ElevenLabs final-pass.",
    "notRealSpeech=true: this audio must never be used for public upload.",
    "ElevenLabs or OpenAI TTS final-pass required before real upload.",
  ],
};

writeFileSync(summaryPath, JSON.stringify(summary, null, 2), "utf-8");

console.log(`[done] local-mock-tts-audio-summary.json: ${summaryPath}`);
console.log(`[done] Audio path: ${audioPath}`);
console.log(`[done] rawAudioDurationSec: ${rawAudioDurationSec}s\n`);
