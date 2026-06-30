/**
 * Static guard: TTS audio source contract integrity.
 * Checks both build-local-mock-tts-audio-from-script.mjs and the mux --audio-summary addition.
 * No network, no API calls, no clipboard, no fs writes to repo.
 * Exit 0 = all PASS. Exit 1 = at least one FAIL.
 */

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const AUDIO_BUILDER_PATH = resolve(__dirname, "build-local-mock-tts-audio-from-script.mjs");
const MUX_PATH = resolve(__dirname, "mux-local-tts-audio-into-visual-mp4.mjs");
const PIPELINE_PATH = resolve(__dirname, "run-local-money-shorts-pipeline-dry-run.mjs");

const audioBuilderSrc = readFileSync(AUDIO_BUILDER_PATH, "utf-8");
const muxSrc = readFileSync(MUX_PATH, "utf-8");
const pipelineSrc = readFileSync(PIPELINE_PATH, "utf-8");

let passed = 0;
let failed = 0;

function check(label, condition) {
  if (condition) {
    console.log(`  PASS  ${label}`);
    passed++;
  } else {
    console.error(`  FAIL  ${label}`);
    failed++;
  }
}

function codeLines(src) {
  return src
    .split("\n")
    .filter((l) => !/^\s*(\/\/|\*)/.test(l))
    .join("\n");
}

console.log("\nStatic guard check: TTS audio source contract\n");

// ── Audio builder: forbidden patterns ──────────────────────────────────────────
console.log("[ build-local-mock-tts-audio-from-script.mjs — forbidden patterns ]");

check("no fetch(", !codeLines(audioBuilderSrc).includes("fetch("));
check("no axios outside comments", !codeLines(audioBuilderSrc).includes("axios"));
check(
  "no youtube.videos or googleapis.com",
  !codeLines(audioBuilderSrc).toLowerCase().includes("youtube.videos") &&
    !codeLines(audioBuilderSrc).includes("googleapis.com"),
);
check(
  "no graph.instagram or graph.facebook",
  !codeLines(audioBuilderSrc).includes("graph.instagram") &&
    !codeLines(audioBuilderSrc).includes("graph.facebook"),
);
check("no uploadVideo call", !codeLines(audioBuilderSrc).includes("uploadVideo"));
check("no OAuth outside comments", !codeLines(audioBuilderSrc).includes("OAuth"));
check("no accessToken outside comments", !codeLines(audioBuilderSrc).includes("accessToken"));
check("no refreshToken outside comments", !codeLines(audioBuilderSrc).includes("refreshToken"));
check("no process.env access", !codeLines(audioBuilderSrc).includes("process.env"));
check("no shell: true", !codeLines(audioBuilderSrc).match(/shell\s*:\s*true/));
check("no exec( outside comments", !codeLines(audioBuilderSrc).includes("exec("));
check("no execSync outside comments", !codeLines(audioBuilderSrc).includes("execSync"));
check(
  "no .money-shorts-local direct access (guard only)",
  audioBuilderSrc.includes(".money-shorts-local") && audioBuilderSrc.includes("forbidden"),
);

// ── Audio builder: required patterns ───────────────────────────────────────────
console.log("\n[ build-local-mock-tts-audio-from-script.mjs — required patterns ]");

check("ffmpeg lavfi anoisesrc used", audioBuilderSrc.includes("anoisesrc"));
check("shell: false present", audioBuilderSrc.includes("shell: false"));
check("out-dir repo guard present", audioBuilderSrc.includes("outDirAbs.startsWith(REPO_ROOT"));
check("--tts-script CLI arg present", audioBuilderSrc.includes('"--tts-script"'));
check("--out-dir CLI arg present", audioBuilderSrc.includes('"--out-dir"'));
check(
  "local-mock-tts-audio-summary.json output filename present",
  audioBuilderSrc.includes("local-mock-tts-audio-summary.json"),
);

// ── Audio builder: ffprobe fatal handling ──────────────────────────────────────
console.log("\n[ build-local-mock-tts-audio-from-script.mjs — ffprobe fatal handling ]");

check(
  "ffprobe exit != 0 is fatal (process.exit after ffprobeExitCode check)",
  audioBuilderSrc.includes("ffprobeExitCode !== 0") &&
    audioBuilderSrc.includes("process.exit(1)"),
);
check(
  "ffprobe JSON parse failure is fatal",
  audioBuilderSrc.includes("Cannot parse ffprobe output") &&
    audioBuilderSrc.includes("process.exit(1)"),
);
check(
  "no audio stream is fatal",
  audioBuilderSrc.includes("no audio stream") &&
    audioBuilderSrc.includes("process.exit(1)"),
);
check(
  "invalid duration is fatal (isFinite + positive check)",
  audioBuilderSrc.includes("Number.isFinite(rawAudioDurationSec)") &&
    audioBuilderSrc.includes("rawAudioDurationSec <= 0"),
);
check(
  "duration deviation guard present",
  audioBuilderSrc.includes("durationDelta") &&
    audioBuilderSrc.includes("process.exit(1)"),
);

// ── Audio builder: summary schema ──────────────────────────────────────────────
console.log("\n[ build-local-mock-tts-audio-from-script.mjs — summary schema ]");

check(
  "schemaVersion money_shorts_local_mock_tts_audio_summary_v1",
  audioBuilderSrc.includes("money_shorts_local_mock_tts_audio_summary_v1"),
);
check("mode: local_mock present", audioBuilderSrc.includes('"local_mock"'));
check("sourceScriptPath field present", audioBuilderSrc.includes("sourceScriptPath"));
check("audioPath field present", audioBuilderSrc.includes("audioPath"));
check("rawAudioDurationSec field present", audioBuilderSrc.includes("rawAudioDurationSec"));
check("targetDurationSec field present", audioBuilderSrc.includes("targetDurationSec"));
check("audioCodec field present", audioBuilderSrc.includes("audioCodec"));
check("ffmpegExitCode field present", audioBuilderSrc.includes("ffmpegExitCode"));
check("ffprobeExitCode field present", audioBuilderSrc.includes("ffprobeExitCode"));
check("notRealSpeech: true present", audioBuilderSrc.includes("notRealSpeech: true"));
check("riskNotes present", audioBuilderSrc.includes("riskNotes"));

// ── Mux: --audio-summary support ───────────────────────────────────────────────
console.log("\n[ mux-local-tts-audio-into-visual-mp4.mjs — --audio-summary support ]");

check("--audio-summary arg parsed", muxSrc.includes('"--audio-summary"'));
check(
  "audioSummaryAbsPath variable present",
  muxSrc.includes("audioSummaryAbsPath"),
);
check(
  "audio-summary branch: audioPath used from summary",
  muxSrc.includes("audioSummary.audioPath"),
);
check(
  "audio-summary branch: rawAudioDurationSec used from summary",
  muxSrc.includes("audioSummary.rawAudioDurationSec"),
);
check(
  "backward compat: lavfi path still present when no audio-summary",
  muxSrc.includes("anoisesrc"),
);
check(
  "audioSummaryPath field added to tts-mux-summary.json",
  muxSrc.includes("audioSummaryPath: audioSummaryAbsPath"),
);

// ── Mux: audio-summary schema/mode/notRealSpeech validation ───────────────────
console.log("\n[ mux-local-tts-audio-into-visual-mp4.mjs — audio-summary schema guard ]");

check(
  "schemaVersion check: money_shorts_local_mock_tts_audio_summary_v1",
  muxSrc.includes("money_shorts_local_mock_tts_audio_summary_v1") &&
    muxSrc.includes("audioSummary.schemaVersion"),
);
check(
  "mode check: local_mock",
  muxSrc.includes("audioSummary.mode") &&
    muxSrc.includes('"local_mock"'),
);
check(
  "notRealSpeech check: must be true",
  muxSrc.includes("audioSummary.notRealSpeech") &&
    muxSrc.includes("!== true"),
);
check(
  "resolvedAudioPath used (resolve applied to audioPath)",
  muxSrc.includes("resolvedAudioPath") &&
    muxSrc.includes("resolve(audioSummary.audioPath)"),
);
check(
  ".money-shorts-local guard on resolvedAudioPath",
  muxSrc.includes("resolvedAudioPath.includes(\".money-shorts-local\")"),
);
check(
  "repo-inside guard on resolvedAudioPath",
  muxSrc.includes("resolvedAudioPath.startsWith(REPO_ROOT"),
);
check(
  "audio file existence check (existsSync)",
  muxSrc.includes("existsSync(resolvedAudioPath)"),
);
check(
  "rawAudioDurationSec finite positive check on summary value",
  muxSrc.includes("Number.isFinite(summaryRawDuration)") &&
    muxSrc.includes("summaryRawDuration <= 0"),
);

// ── Pipeline runner: 5-step structure ──────────────────────────────────────────
console.log("\n[ run-local-money-shorts-pipeline-dry-run.mjs — 5-step structure ]");

check(
  "tts-audio-source step dir present",
  pipelineSrc.includes("tts-audio-source"),
);
check(
  "local_mock_tts_audio step name present",
  pipelineSrc.includes("local_mock_tts_audio"),
);
check(
  "build-local-mock-tts-audio-from-script.mjs called",
  pipelineSrc.includes("build-local-mock-tts-audio-from-script.mjs"),
);
check(
  "local-mock-tts-audio-summary.json resolved after audio step",
  pipelineSrc.includes("local-mock-tts-audio-summary.json"),
);
check(
  "--audio-summary passed to mux step",
  pipelineSrc.includes("--audio-summary") && pipelineSrc.includes("ttsAudioSummaryPath"),
);
check(
  "ttsAudioSource in artifacts map",
  pipelineSrc.includes("ttsAudioSource"),
);
check(
  "all 5 steps PASS message",
  pipelineSrc.includes("all 5 steps PASS"),
);

console.log(`\n${passed + failed} checks — ${passed} PASS, ${failed} FAIL\n`);

if (failed > 0) {
  process.exit(1);
}
