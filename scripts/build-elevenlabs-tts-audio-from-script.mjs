/**
 * ElevenLabs live TTS smoke: generates real speech audio from a TTS script JSON.
 *
 * Usage:
 *   node scripts/build-elevenlabs-tts-audio-from-script.mjs \
 *     --tts-script scripts/fixtures/provider-candidate-tts-script.local-mock.json \
 *     --out-dir C:\tmp\money-shorts-os\elevenlabs-tts-live-smoke-v1
 *
 * Outputs:
 *   ${outDir}/elevenlabs-tts-live-smoke.mp3
 *   ${outDir}/elevenlabs-tts-live-smoke-summary.json
 *
 * Required env:
 *   ELEVENLABS_API_KEY    — ElevenLabs API key
 *   ELEVENLABS_VOICE_ID   — Target voice ID
 *
 * Optional env:
 *   ELEVENLABS_MODEL_ID   — Default: eleven_multilingual_v2
 *   ELEVENLABS_VOICE_LABEL — Human-readable label for summary only
 *
 * Security constraints:
 * - API key and voice ID are NEVER logged or stored in summary.
 * - voice ID is stored as masked form only.
 * - Only ElevenLabs text-to-speech endpoint is called — no other network calls.
 * - Exactly 1 API call. No retry.
 * - out-dir must be outside repo root.
 * - No .money-shorts-local/ access.
 * - No output artifacts inside repo.
 * - No mp4 mux, video render, upload, DB, clipboard, shell: true.
 * - piq_diag_out.txt never touched.
 */

import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");

// ── .env.local read-only loader ─────────────────────────────────────────────────
// Parses KEY=value / KEY="value" / KEY='value'. No dependencies.
function loadEnvLocal() {
  const envLocalPath = join(REPO_ROOT, ".env.local");
  if (!existsSync(envLocalPath)) return {};
  let content;
  try {
    content = readFileSync(envLocalPath, "utf-8");
  } catch {
    return {};
  }
  const result = {};
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (key) result[key] = val;
  }
  return result;
}

function resolveEnv(key, envLocal) {
  return process.env[key] ?? envLocal[key] ?? undefined;
}

const envLocal = loadEnvLocal();
const envLocalLoaded = existsSync(join(REPO_ROOT, ".env.local"));

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
    "Usage: node build-elevenlabs-tts-audio-from-script.mjs --tts-script <path> --out-dir <path>",
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

console.log(`\n[elevenlabs-tts-builder] tts-script: ${ttsScriptAbsPath}`);
console.log(`[elevenlabs-tts-builder] out-dir:    ${outDirAbs}\n`);

// ── Load TTS script ─────────────────────────────────────────────────────────────
let ttsScript;
try {
  ttsScript = JSON.parse(readFileSync(ttsScriptAbsPath, "utf-8"));
} catch (e) {
  console.error(`ABORT: Cannot read TTS script: ${e.message}`);
  process.exit(1);
}

const { scriptId, manifestId, scenes, targetDurationSec } = ttsScript;

if (!scenes || !Array.isArray(scenes) || scenes.length === 0) {
  console.error("ABORT: TTS script has no scenes.");
  process.exit(1);
}

// Combine all narration texts into a single script text
const combinedText = scenes
  .sort((a, b) => a.sceneNumber - b.sceneNumber)
  .map((sc) => sc.narration)
  .filter(Boolean)
  .join(" ");

if (!combinedText.trim()) {
  console.error("ABORT: Combined narration text is empty.");
  process.exit(1);
}

console.log(`  scriptId:         ${scriptId}`);
console.log(`  manifestId:       ${manifestId}`);
console.log(`  scenes:           ${scenes.length}`);
console.log(`  targetDuration:   ${targetDurationSec}s`);
console.log(`  textCharCount:    ${combinedText.length}`);
console.log();

mkdirSync(outDirAbs, { recursive: true });

// ── Step 1: Check env readiness ─────────────────────────────────────────────────
console.log("[step 1/4] Checking ElevenLabs env readiness...");
console.log(`  .env.local present:               ${envLocalLoaded}`);

const apiKey = resolveEnv("ELEVENLABS_API_KEY", envLocal);
const voiceId = resolveEnv("ELEVENLABS_VOICE_ID", envLocal);
const modelId = resolveEnv("ELEVENLABS_MODEL_ID", envLocal) ?? "eleven_multilingual_v2";
const voiceLabel = resolveEnv("ELEVENLABS_VOICE_LABEL", envLocal) ?? null;

const apiKeyConfigured = !!(apiKey && apiKey.trim().length > 0);
const voiceIdConfigured = !!(voiceId && voiceId.trim().length > 0);

// Determine source of each credential (boolean only, never value)
const apiKeySource = process.env.ELEVENLABS_API_KEY ? "process.env" : (envLocal.ELEVENLABS_API_KEY ? ".env.local" : "missing");
const voiceIdSource = process.env.ELEVENLABS_VOICE_ID ? "process.env" : (envLocal.ELEVENLABS_VOICE_ID ? ".env.local" : "missing");
const allSources = new Set([apiKeySource, voiceIdSource].filter((s) => s !== "missing"));
const envSource = allSources.size === 0 ? "missing" : allSources.size === 2 && apiKeySource !== voiceIdSource ? "mixed" : [...allSources][0];

console.log(`  ELEVENLABS_API_KEY configured:    ${apiKeyConfigured} (source: ${apiKeySource})`);
console.log(`  ELEVENLABS_VOICE_ID configured:   ${voiceIdConfigured} (source: ${voiceIdSource})`);
console.log(`  ELEVENLABS_MODEL_ID:              ${modelId}`);
if (voiceLabel) {
  console.log(`  ELEVENLABS_VOICE_LABEL:           configured`);
}
console.log();

if (!apiKeyConfigured || !voiceIdConfigured) {
  const missing = [];
  if (!apiKeyConfigured) missing.push("ELEVENLABS_API_KEY");
  if (!voiceIdConfigured) missing.push("ELEVENLABS_VOICE_ID");

  console.error(`READINESS FAILURE: Missing env: ${missing.join(", ")}`);
  console.error("No ElevenLabs API call was made.");

  const failureSummary = {
    schemaVersion: "money_shorts_elevenlabs_tts_live_smoke_summary_v1",
    mode: "elevenlabs_live_smoke",
    provider: "elevenlabs",
    liveApiCallPerformed: false,
    readinessFailure: true,
    missingEnv: missing,
    envSource: "missing",
    sourceScriptPath: ttsScriptAbsPath,
    audioPath: null,
    textCharCount: combinedText.length,
    sceneCount: scenes.length,
    targetDurationSec,
    rawAudioDurationSec: null,
    durationDeltaSec: null,
    audioCodec: null,
    audioStreamCount: null,
    ffprobeExitCode: null,
    httpStatus: null,
    modelId,
    voiceIdConfigured: false,
    voiceIdMasked: null,
    apiKeyConfigured: false,
    notRealSpeech: true,
    qualityAccepted: false,
    ownerListeningRequired: true,
    riskNotes: [
      "readiness_failure: missing required env — no API call was made.",
      "Set ELEVENLABS_API_KEY and ELEVENLABS_VOICE_ID in .env.local or process env to proceed.",
      "No audio generated. No upload performed.",
      "audio generated outside repo (if it had succeeded)",
      ".env.local is never committed — it is in .gitignore",
    ],
  };

  const summaryPath = join(outDirAbs, "elevenlabs-tts-live-smoke-summary.json");
  try {
    writeFileSync(summaryPath, JSON.stringify(failureSummary, null, 2), "utf-8");
    console.error(`\n[readiness-failure] summary: ${summaryPath}`);
  } catch {
    // best effort
  }

  process.exit(1);
}

// ── Mask voice ID for logging/summary ──────────────────────────────────────────
function maskVoiceId(id) {
  if (!id || id.length <= 6) return "***";
  return id.slice(0, 3) + "***" + id.slice(-3);
}

const voiceIdMasked = maskVoiceId(voiceId);
console.log(`  voiceIdMasked:    ${voiceIdMasked}`);
console.log();

// ── Step 2: Call ElevenLabs TTS endpoint (exactly once) ─────────────────────────
console.log("[step 2/4] Calling ElevenLabs text-to-speech endpoint (1 call)...");

const endpoint = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`;

const requestBody = {
  text: combinedText,
  model_id: modelId,
  voice_settings: {
    stability: 0.52,
    similarity_boost: 0.78,
    style: 0.1,
    use_speaker_boost: true,
  },
};

let httpStatus = null;
let httpStatusText = null;
let audioBuffer = null;

try {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify(requestBody),
  });

  httpStatus = response.status;
  httpStatusText = response.statusText;

  console.log(`  HTTP status: ${httpStatus} ${httpStatusText}`);

  if (!response.ok) {
    console.error(`ABORT: ElevenLabs API returned non-2xx status: ${httpStatus} ${httpStatusText}`);
    const errText = await response.text().catch(() => "(unreadable)");
    console.error(`  Error (truncated): ${errText.slice(0, 200)}`);
    process.exit(1);
  }

  const arrayBuffer = await response.arrayBuffer();
  audioBuffer = Buffer.from(arrayBuffer);
  console.log(`  Response size: ${audioBuffer.length} bytes`);
} catch (e) {
  console.error(`ABORT: ElevenLabs fetch failed: ${e.message}`);
  process.exit(1);
}

// ── Step 3: Save audio file ────────────────────────────────────────────────────
console.log("[step 3/4] Saving audio file...");

const audioPath = join(outDirAbs, "elevenlabs-tts-live-smoke.mp3");
try {
  writeFileSync(audioPath, audioBuffer);
  console.log(`  audio saved: ${audioPath}`);
  console.log(`  file size:   ${audioBuffer.length} bytes`);
} catch (e) {
  console.error(`ABORT: Cannot write audio file: ${e.message}`);
  process.exit(1);
}

// ── Step 4: ffprobe verification ───────────────────────────────────────────────
console.log("[step 4/4] Probing audio with ffprobe...");

const probeArgs = [
  "-v", "quiet",
  "-print_format", "json",
  "-show_format",
  "-show_streams",
  audioPath,
];

const probeResult = spawnSync("ffprobe", probeArgs, {
  encoding: "utf-8",
  maxBuffer: 2 * 1024 * 1024,
  shell: false,
});

const ffprobeExitCode = probeResult.status ?? -1;

if (ffprobeExitCode !== 0) {
  console.error(`ABORT: ffprobe failed on audio file (exit ${ffprobeExitCode})`);
  if (probeResult.stderr) console.error(probeResult.stderr.slice(-300));
  process.exit(1);
}

let audioProbe;
try {
  audioProbe = JSON.parse(probeResult.stdout);
} catch (e) {
  console.error(`ABORT: Cannot parse ffprobe output: ${e.message}`);
  process.exit(1);
}

const audioStream = (audioProbe.streams ?? []).find((s) => s.codec_type === "audio");
if (!audioStream) {
  console.error("ABORT: ffprobe found no audio stream in generated mp3.");
  process.exit(1);
}

const rawAudioDurationSec = parseFloat(audioProbe.format?.duration ?? "NaN");
if (!Number.isFinite(rawAudioDurationSec) || rawAudioDurationSec <= 0) {
  console.error(`ABORT: ffprobe returned invalid duration: ${audioProbe.format?.duration}`);
  process.exit(1);
}

const audioCodec = audioStream.codec_name ?? "unknown";
const audioStreamCount = (audioProbe.streams ?? []).filter((s) => s.codec_type === "audio").length;
const durationDeltaSec = parseFloat((rawAudioDurationSec - targetDurationSec).toFixed(3));

console.log(`  duration:       ${rawAudioDurationSec}s  (target: ${targetDurationSec}s, delta: ${durationDeltaSec > 0 ? "+" : ""}${durationDeltaSec}s)`);
console.log(`  codec:          ${audioCodec}`);
console.log(`  audio streams:  ${audioStreamCount}`);
console.log();

// ── Write summary JSON ─────────────────────────────────────────────────────────
const summaryPath = join(outDirAbs, "elevenlabs-tts-live-smoke-summary.json");
const summary = {
  schemaVersion: "money_shorts_elevenlabs_tts_live_smoke_summary_v1",
  mode: "elevenlabs_live_smoke",
  provider: "elevenlabs",
  liveApiCallPerformed: true,
  readinessFailure: false,
  envSource,
  sourceScriptPath: ttsScriptAbsPath,
  audioPath,
  textCharCount: combinedText.length,
  sceneCount: scenes.length,
  targetDurationSec,
  rawAudioDurationSec,
  durationDeltaSec,
  audioCodec,
  audioStreamCount,
  ffprobeExitCode,
  httpStatus,
  modelId,
  voiceIdConfigured: true,
  voiceIdMasked,
  voiceLabel: voiceLabel ?? null,
  apiKeyConfigured: true,
  notRealSpeech: false,
  qualityAccepted: false,
  ownerListeningRequired: true,
  generatedAt: new Date().toISOString(),
  riskNotes: [
    "elevenlabs_live_smoke only — not final voice quality approval.",
    "Owner listening review required before any upload.",
    "pronunciation/intonation/speed not yet accepted by Owner.",
    "no upload performed — audio is smoke artifact only.",
    "audio generated outside repo (C:\\tmp\\...)",
    ".env.local is never committed — it is in .gitignore",
    `durationDelta: ${durationDeltaSec > 0 ? "+" : ""}${durationDeltaSec}s vs target ${targetDurationSec}s — Owner review required.`,
  ],
};

writeFileSync(summaryPath, JSON.stringify(summary, null, 2), "utf-8");

console.log(`[done] elevenlabs-tts-live-smoke-summary.json: ${summaryPath}`);
console.log(`[done] Audio path: ${audioPath}`);
console.log(`[done] Duration: ${rawAudioDurationSec}s (target: ${targetDurationSec}s)`);
console.log(`[done] liveApiCallPerformed: true`);
console.log(`[done] qualityAccepted: false — Owner listening review required\n`);
