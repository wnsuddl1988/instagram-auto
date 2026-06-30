/**
 * Local mock TTS audio mux: generates placeholder audio and muxes into a visual-only mp4.
 *
 * Usage:
 *   node scripts/mux-local-tts-audio-into-visual-mp4.mjs \
 *     --video         <visual-only mp4 path> \
 *     --script        <tts script JSON path> \
 *     --out-dir       <output directory (must be outside repo)> \
 *     [--audio-summary <local-mock-tts-audio-summary.json path>]
 *
 * When --audio-summary is provided, its audioPath is used directly (no lavfi generation).
 * When absent, local mock audio is generated internally (backward-compatible).
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
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve, dirname, join, basename } from "node:path";
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

const videoPath = getArg("--video");
const scriptPath = getArg("--script");
const outDir = getArg("--out-dir");
const audioSummaryPath = getArg("--audio-summary");

if (!videoPath || !scriptPath || !outDir) {
  console.error(
    "Usage: node mux-local-tts-audio-into-visual-mp4.mjs --video <path> --script <path> --out-dir <path> [--audio-summary <path>]",
  );
  process.exit(1);
}

const videoAbsPath = resolve(videoPath);
const scriptAbsPath = resolve(REPO_ROOT, scriptPath);
const outDirAbs = resolve(outDir);
const audioSummaryAbsPath = audioSummaryPath ? resolve(audioSummaryPath) : null;

// Safety: out-dir must not be inside repo root
if (outDirAbs.startsWith(REPO_ROOT + "\\") || outDirAbs.startsWith(REPO_ROOT + "/")) {
  console.error(`ABORT: --out-dir must be outside repo root.\n  repo: ${REPO_ROOT}\n  out-dir: ${outDirAbs}`);
  process.exit(1);
}

// Safety: .money-shorts-local forbidden
const pathsToCheck = [videoAbsPath, scriptAbsPath, outDirAbs];
if (audioSummaryAbsPath) pathsToCheck.push(audioSummaryAbsPath);
if (pathsToCheck.some((p) => p.includes(".money-shorts-local"))) {
  console.error("ABORT: .money-shorts-local access forbidden.");
  process.exit(1);
}

console.log(`\n[mux-local-tts] video:         ${videoAbsPath}`);
console.log(`[mux-local-tts] script:        ${scriptAbsPath}`);
console.log(`[mux-local-tts] out-dir:       ${outDirAbs}`);
if (audioSummaryAbsPath) {
  console.log(`[mux-local-tts] audio-summary: ${audioSummaryAbsPath}`);
}
console.log();

// ── Load TTS script ─────────────────────────────────────────────────────────────
let ttsScript;
try {
  ttsScript = JSON.parse(readFileSync(scriptAbsPath, "utf-8"));
} catch (e) {
  console.error(`ABORT: Cannot read TTS script: ${e.message}`);
  process.exit(1);
}

// ttsMode=local_mock enforced for inline mock generation only.
// When --audio-summary supplies an ElevenLabs live smoke summary, ttsMode check is deferred to summary validation below.

const { scriptId, manifestId, scenes, targetDurationSec } = ttsScript;
const totalSceneDurationSec = scenes.reduce((s, sc) => s + sc.durationSec, 0);

console.log(`  scriptId:        ${scriptId}`);
console.log(`  manifestId:      ${manifestId}`);
console.log(`  ttsMode:         ${ttsScript.ttsMode}`);
console.log(`  scenes:          ${scenes.length}`);
console.log(`  targetDuration:  ${targetDurationSec}s`);
console.log(`  sceneTotal:      ${totalSceneDurationSec}s`);
console.log();

// ── Prepare output dir ──────────────────────────────────────────────────────────
mkdirSync(outDirAbs, { recursive: true });

// ── Step 1: Get video duration via ffprobe ──────────────────────────────────────
console.log("[step 1/4] Probing source video...");
const probeVideoArgs = [
  "-v", "quiet",
  "-print_format", "json",
  "-show_format",
  "-show_streams",
  videoAbsPath,
];

const probeVideoResult = spawnSync("ffprobe", probeVideoArgs, {
  encoding: "utf-8",
  maxBuffer: 2 * 1024 * 1024,
});

if (probeVideoResult.status !== 0) {
  console.error(`ABORT: ffprobe failed on source video (exit ${probeVideoResult.status})`);
  if (probeVideoResult.stderr) console.error(probeVideoResult.stderr.slice(-300));
  process.exit(1);
}

let videoProbe;
try {
  videoProbe = JSON.parse(probeVideoResult.stdout);
} catch {
  console.error("ABORT: Cannot parse ffprobe output for source video.");
  process.exit(1);
}

const videoFmt = videoProbe.format;
const videoStreams = videoProbe.streams ?? [];
const videoStream = videoStreams.find((s) => s.codec_type === "video");
const videoDurationSec = parseFloat(videoFmt?.duration ?? "0");
const videoWidthPx = videoStream?.width ?? 0;
const videoHeightPx = videoStream?.height ?? 0;
const videoCodec = videoStream?.codec_name ?? "unknown";

console.log(`  source video duration: ${videoDurationSec}s`);
console.log(`  source resolution:     ${videoWidthPx}x${videoHeightPx}`);
console.log(`  source codec:          ${videoCodec}`);
console.log();

// ── Step 2: Resolve mock TTS audio ────────────────────────────────────────────
// If --audio-summary is supplied: use its audioPath (generated by build-local-mock-tts-audio-from-script.mjs).
// Otherwise: generate local mock audio inline via ffmpeg lavfi (backward-compatible).
let mockAudioPath;
let rawAudioDurationSec = totalSceneDurationSec;
/** Validated audio summary — set when --audio-summary is provided, null otherwise. */
let validatedAudioSummary = null;

if (audioSummaryAbsPath) {
  console.log("[step 2/4] Loading audio from --audio-summary...");
  let audioSummary;
  try {
    audioSummary = JSON.parse(readFileSync(audioSummaryAbsPath, "utf-8"));
  } catch (e) {
    console.error(`ABORT: Cannot read audio summary: ${e.message}`);
    process.exit(1);
  }

  const ALLOWED_SCHEMAS = [
    "money_shorts_local_mock_tts_audio_summary_v1",
    "money_shorts_elevenlabs_tts_live_smoke_summary_v1",
    "money_shorts_elevenlabs_scene_paced_tts_summary_v1",
  ];
  if (!ALLOWED_SCHEMAS.includes(audioSummary.schemaVersion)) {
    console.error(
      `ABORT: audio summary schemaVersion not allowed. Got: ${audioSummary.schemaVersion}. Allowed: ${ALLOWED_SCHEMAS.join(", ")}`,
    );
    process.exit(1);
  }

  // Schema-specific validation
  if (audioSummary.schemaVersion === "money_shorts_local_mock_tts_audio_summary_v1") {
    if (audioSummary.mode !== "local_mock") {
      console.error(`ABORT: local_mock summary mode must be "local_mock". Got: ${audioSummary.mode}`);
      process.exit(1);
    }
    if (audioSummary.notRealSpeech !== true) {
      console.error("ABORT: local_mock summary notRealSpeech must be true.");
      process.exit(1);
    }
    if (!ttsScript.ttsMode || ttsScript.ttsMode !== "local_mock") {
      console.error(`ABORT: TTS script ttsMode must be local_mock when using local_mock audio summary. Got: ${ttsScript.ttsMode}`);
      process.exit(1);
    }
  } else if (audioSummary.schemaVersion === "money_shorts_elevenlabs_tts_live_smoke_summary_v1") {
    if (audioSummary.mode !== "elevenlabs_live_smoke") {
      console.error(`ABORT: ElevenLabs summary mode must be "elevenlabs_live_smoke". Got: ${audioSummary.mode}`);
      process.exit(1);
    }
    if (audioSummary.provider !== "elevenlabs") {
      console.error(`ABORT: ElevenLabs summary provider must be "elevenlabs". Got: ${audioSummary.provider}`);
      process.exit(1);
    }
    if (audioSummary.liveApiCallPerformed !== true) {
      console.error("ABORT: ElevenLabs summary liveApiCallPerformed must be true (readiness failure summaries not supported for mux).");
      process.exit(1);
    }
    if (audioSummary.qualityAccepted !== false) {
      console.error("ABORT: ElevenLabs summary qualityAccepted must be false (only unaccepted smoke audio is expected at this stage).");
      process.exit(1);
    }
    if (audioSummary.ownerListeningRequired !== true) {
      console.error("ABORT: ElevenLabs summary ownerListeningRequired must be true.");
      process.exit(1);
    }
    const audioStreamCount = audioSummary.audioStreamCount;
    if (typeof audioStreamCount !== "number") {
      console.error(`ABORT: ElevenLabs summary audioStreamCount must be a number. Got: ${typeof audioStreamCount}`);
      process.exit(1);
    }
    if (audioStreamCount < 1) {
      console.error(`ABORT: ElevenLabs summary audioStreamCount must be >= 1. Got: ${audioStreamCount}`);
      process.exit(1);
    }
    console.log("  [WARN] ElevenLabs live smoke audio: quality not yet accepted. Owner listening review required before upload.");
  } else if (audioSummary.schemaVersion === "money_shorts_elevenlabs_scene_paced_tts_summary_v1") {
    if (audioSummary.provider !== "elevenlabs") {
      console.error(`ABORT: scene-paced summary provider must be "elevenlabs". Got: ${audioSummary.provider}`);
      process.exit(1);
    }
    if (audioSummary.liveApiCallPerformed !== true) {
      console.error("ABORT: scene-paced summary liveApiCallPerformed must be true.");
      process.exit(1);
    }
    if (audioSummary.qualityAccepted !== false) {
      console.error("ABORT: scene-paced summary qualityAccepted must be false.");
      process.exit(1);
    }
    if (audioSummary.ownerListeningRequired !== true) {
      console.error("ABORT: scene-paced summary ownerListeningRequired must be true.");
      process.exit(1);
    }
    if (!audioSummary.timelineAudioPath) {
      console.error("ABORT: scene-paced summary missing timelineAudioPath field.");
      process.exit(1);
    }
    console.log("  [WARN] ElevenLabs scene-paced audio: quality not yet accepted. Owner listening review required before upload.");
  }

  // Resolve audio path: scene-paced uses timelineAudioPath, others use audioPath
  const rawAudioPathField =
    audioSummary.schemaVersion === "money_shorts_elevenlabs_scene_paced_tts_summary_v1"
      ? audioSummary.timelineAudioPath
      : audioSummary.audioPath;

  if (!rawAudioPathField) {
    console.error("ABORT: audio summary missing audioPath (or timelineAudioPath for scene-paced) field.");
    process.exit(1);
  }

  const resolvedAudioPath = resolve(rawAudioPathField);

  if (resolvedAudioPath.includes(".money-shorts-local")) {
    console.error("ABORT: audio summary audioPath contains .money-shorts-local — forbidden.");
    process.exit(1);
  }
  if (resolvedAudioPath.startsWith(REPO_ROOT + "\\") || resolvedAudioPath.startsWith(REPO_ROOT + "/")) {
    console.error(
      `ABORT: audio summary audioPath is inside repo root — output artifacts must be outside repo.\n  repo: ${REPO_ROOT}\n  audio: ${resolvedAudioPath}`,
    );
    process.exit(1);
  }
  if (!existsSync(resolvedAudioPath)) {
    console.error(`ABORT: audio file referenced in summary does not exist: ${resolvedAudioPath}`);
    process.exit(1);
  }

  // scene-paced TTS uses timelineDurationSec; single-file schemas use rawAudioDurationSec
  const summaryRawDuration =
    audioSummary.schemaVersion === "money_shorts_elevenlabs_scene_paced_tts_summary_v1"
      ? audioSummary.timelineDurationSec
      : audioSummary.rawAudioDurationSec;
  if (!Number.isFinite(summaryRawDuration) || summaryRawDuration <= 0) {
    console.error(
      `ABORT: audio summary rawAudioDurationSec is not a finite positive number: ${summaryRawDuration}`,
    );
    process.exit(1);
  }

  mockAudioPath = resolvedAudioPath;
  rawAudioDurationSec = summaryRawDuration;
  validatedAudioSummary = audioSummary;
  console.log(`  external audio: ${mockAudioPath}`);
  console.log(`  raw audio duration: ${rawAudioDurationSec}s`);
  console.log();
} else {
  console.log("[step 2/4] Generating local mock TTS audio (lavfi placeholder)...");
  mockAudioPath = join(outDirAbs, `${scriptId}-mock-audio.wav`);

  const mockAudioArgs = [
    "-y",
    "-f", "lavfi",
    "-i", `anoisesrc=colour=pink:amplitude=0.03:duration=${totalSceneDurationSec}`,
    "-ar", "44100",
    "-ac", "1",
    mockAudioPath,
  ];

  const mockAudioResult = spawnSync("ffmpeg", mockAudioArgs, {
    encoding: "utf-8",
    maxBuffer: 4 * 1024 * 1024,
  });

  if (mockAudioResult.status !== 0) {
    console.error(`ABORT: ffmpeg mock audio generation failed (exit ${mockAudioResult.status})`);
    if (mockAudioResult.stderr) console.error(mockAudioResult.stderr.slice(-500));
    process.exit(1);
  }
  console.log(`  mock audio: ${mockAudioPath}`);

  const probeAudioArgs = [
    "-v", "quiet",
    "-print_format", "json",
    "-show_format",
    mockAudioPath,
  ];
  const probeAudioResult = spawnSync("ffprobe", probeAudioArgs, {
    encoding: "utf-8",
    maxBuffer: 1 * 1024 * 1024,
  });

  if (probeAudioResult.status === 0) {
    try {
      const audioProbe = JSON.parse(probeAudioResult.stdout);
      rawAudioDurationSec = parseFloat(
        audioProbe.format?.duration ?? String(totalSceneDurationSec),
      );
    } catch {
      // keep fallback
    }
  }
  console.log(`  raw audio duration: ${rawAudioDurationSec}s`);
  console.log();
}

// ── Step 3: Mux video + audio into final mp4 ───────────────────────────────────
// Duration policy: final mp4 is locked to video duration (videoDurationSec).
// -t videoDurationSec prevents audio from extending the output.
console.log("[step 3/4] Muxing video + audio...");

const outputBaseName = basename(videoAbsPath, ".mp4").replace(/-visual-only$/, "") + "-tts-mux.mp4";
const outputMp4Path = join(outDirAbs, outputBaseName);

// When audio is shorter than video, pad with silence to reach video duration.
// When audio is longer than video, -t + -shortest trims the audio.
const audioIsShorter = rawAudioDurationSec < videoDurationSec - 0.1;

let muxArgs;
if (audioIsShorter) {
  // Use apad filter to pad audio with silence up to video duration
  muxArgs = [
    "-y",
    "-i", videoAbsPath,
    "-i", mockAudioPath,
    "-filter_complex", `[1:a]apad=pad_dur=${videoDurationSec}[aout]`,
    "-map", "0:v:0",
    "-map", "[aout]",
    "-c:v", "copy",
    "-c:a", "aac",
    "-b:a", "128k",
    "-t", String(videoDurationSec),
    outputMp4Path,
  ];
} else {
  muxArgs = [
    "-y",
    // Input 1: visual-only video
    "-i", videoAbsPath,
    // Input 2: mock audio
    "-i", mockAudioPath,
    // Map video from input 0, audio from input 1
    "-map", "0:v:0",
    "-map", "1:a:0",
    // Video: stream copy (no re-encode needed)
    "-c:v", "copy",
    // Audio: encode to aac
    "-c:a", "aac",
    "-b:a", "128k",
    // Lock duration to video (prevents audio from extending output)
    "-t", String(videoDurationSec),
    "-shortest",
    outputMp4Path,
  ];
}

console.log(`  output: ${outputMp4Path}`);
console.log(`  ffmpeg args: ${muxArgs.join(" ")}\n`);

const muxResult = spawnSync("ffmpeg", muxArgs, {
  encoding: "utf-8",
  maxBuffer: 10 * 1024 * 1024,
});

const ffmpegExitCode = muxResult.status ?? -1;

if (ffmpegExitCode !== 0) {
  console.error(`\nFFMPEG MUX FAILED (exit ${ffmpegExitCode})`);
  if (muxResult.stderr) {
    const lines = muxResult.stderr.split("\n");
    console.error(lines.slice(-30).join("\n"));
  }
  process.exit(1);
}

if (muxResult.stderr) {
  const lines = muxResult.stderr.split("\n").filter((l) => l.trim());
  console.log("  ffmpeg output (tail):");
  lines.slice(-6).forEach((l) => console.log("    " + l));
}
console.log();

// ── Step 4: Verify muxed mp4 with ffprobe ─────────────────────────────────────
console.log("[step 4/4] Verifying muxed mp4 with ffprobe...");
const probeMuxArgs = [
  "-v", "quiet",
  "-print_format", "json",
  "-show_format",
  "-show_streams",
  outputMp4Path,
];

const probeMuxResult = spawnSync("ffprobe", probeMuxArgs, {
  encoding: "utf-8",
  maxBuffer: 2 * 1024 * 1024,
});

const ffprobeExitCode = probeMuxResult.status ?? -1;

if (ffprobeExitCode !== 0) {
  console.error("ABORT: ffprobe verification FAILED — cannot validate muxed output.");
  if (probeMuxResult.stderr) console.error(probeMuxResult.stderr.slice(-300));
  process.exit(1);
}

let muxProbe;
try {
  muxProbe = JSON.parse(probeMuxResult.stdout);
} catch {
  console.error("ABORT: Cannot parse ffprobe output for muxed mp4.");
  process.exit(1);
}

const muxFmt = muxProbe.format;
const muxStreams = muxProbe.streams ?? [];
const muxVideoStream = muxStreams.find((s) => s.codec_type === "video");
const muxAudioStreams = muxStreams.filter((s) => s.codec_type === "audio");
const muxedDurationSec = parseFloat(muxFmt?.duration ?? "0");
const muxFileSizeBytes = parseInt(muxFmt?.size ?? "0", 10);
const muxedVideoCodec = muxVideoStream?.codec_name ?? "unknown";
const muxedAudioCodec = muxAudioStreams[0]?.codec_name ?? "none";

console.log(`  format:        ${muxFmt?.format_name}`);
console.log(`  duration:      ${muxedDurationSec}s  (video: ${videoDurationSec}s, target: ${targetDurationSec}s)`);
console.log(`  size:          ${Math.round(muxFileSizeBytes / 1024)}KB`);
console.log(`  video codec:   ${muxedVideoCodec}`);
console.log(`  resolution:    ${muxVideoStream?.width}x${muxVideoStream?.height}`);
console.log(`  audio streams: ${muxAudioStreams.length}`);
console.log(`  audio codec:   ${muxedAudioCodec}`);

// Duration tolerance: ± 0.5s from targetDurationSec
const durationLo = targetDurationSec - 0.5;
const durationHi = targetDurationSec + 0.5;
const durationDeltaSec = parseFloat((rawAudioDurationSec - videoDurationSec).toFixed(4));

const checks = [
  ["format is mp4", muxFmt?.format_name?.includes("mp4")],
  ["video codec h264", muxedVideoCodec === "h264"],
  ["width 1080", muxVideoStream?.width === 1080],
  ["height 1920", muxVideoStream?.height === 1920],
  [`duration ${targetDurationSec}s ± 0.5s`, muxedDurationSec >= durationLo && muxedDurationSec <= durationHi],
  ["audio stream count >= 1", muxAudioStreams.length >= 1],
  ["audio codec aac", muxedAudioCodec === "aac"],
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

// ── Build risk notes ───────────────────────────────────────────────────────────
const riskNotes = [...(ttsScript.riskNotes ?? [])];

// ElevenLabs risks — use already-validated summary (no re-read).
const isElevenLabsSchema =
  validatedAudioSummary?.schemaVersion === "money_shorts_elevenlabs_tts_live_smoke_summary_v1" ||
  validatedAudioSummary?.schemaVersion === "money_shorts_elevenlabs_scene_paced_tts_summary_v1";

if (isElevenLabsSchema) {
  riskNotes.push("ElevenLabs live smoke audio is not quality accepted yet.");
  riskNotes.push("Owner listening review required.");
  if (validatedAudioSummary.voiceIdMasked) {
    riskNotes.push(`voiceIdMasked: ${validatedAudioSummary.voiceIdMasked}`);
  }
  if (validatedAudioSummary?.schemaVersion === "money_shorts_elevenlabs_scene_paced_tts_summary_v1") {
    riskNotes.push(`scene-paced TTS: ${validatedAudioSummary.apiCallCount} API calls, ${validatedAudioSummary.sceneCount} scenes.`);
  }
}

const audioDelta = rawAudioDurationSec - videoDurationSec;
if (audioDelta < -1.0) {
  riskNotes.push(`audio padded: raw audio (${rawAudioDurationSec.toFixed(3)}s) is ${Math.abs(audioDelta).toFixed(3)}s shorter than video (${videoDurationSec.toFixed(3)}s). Silence padding applied.`);
} else if (audioDelta > 1.0) {
  riskNotes.push(`audio trimmed: raw audio (${rawAudioDurationSec.toFixed(3)}s) is ${audioDelta.toFixed(3)}s longer than video (${videoDurationSec.toFixed(3)}s). Narration tail may be cut.`);
}

// ── Write tts-mux-summary.json ─────────────────────────────────────────────────
const summaryPath = join(outDirAbs, "tts-mux-summary.json");
const muxMode =
  validatedAudioSummary?.schemaVersion === "money_shorts_elevenlabs_scene_paced_tts_summary_v1"
    ? "elevenlabs_scene_paced"
    : validatedAudioSummary?.schemaVersion === "money_shorts_elevenlabs_tts_live_smoke_summary_v1"
      ? "elevenlabs_live_smoke"
      : "local_mock";

const summary = {
  schemaVersion: "money_shorts_tts_mux_summary_v1",
  mode: muxMode,
  scriptId,
  manifestId,
  sourceVideoPath: videoAbsPath,
  mockAudioPath,
  audioSummaryPath: audioSummaryAbsPath ?? null,
  outputMp4Path,
  ttsScriptPath: scriptAbsPath,
  targetDurationSec,
  videoDurationSec,
  rawAudioDurationSec,
  muxedDurationSec,
  durationDeltaSec,
  widthPx: muxVideoStream?.width ?? 0,
  heightPx: muxVideoStream?.height ?? 0,
  videoCodec: muxedVideoCodec,
  audioCodec: muxedAudioCodec,
  audioStreamCount: muxAudioStreams.length,
  fileSizeBytes: muxFileSizeBytes,
  ffmpegExitCode,
  ffprobeExitCode,
  renderedAt: new Date().toISOString(),
  riskNotes,
  status: "success",
};

writeFileSync(summaryPath, JSON.stringify(summary, null, 2), "utf-8");

console.log(`\n[done] tts-mux-summary.json: ${summaryPath}`);
console.log(`[done] Output mp4: ${outputMp4Path}`);
console.log(`[done] ALL PASS\n`);
