/**
 * Scene-paced ElevenLabs TTS builder.
 * Generates one TTS audio per scene, normalizes to scene duration, then concats into a 30s timeline.
 *
 * Usage:
 *   node scripts/build-elevenlabs-scene-paced-tts-from-script.mjs \
 *     --tts-script scripts/fixtures/provider-candidate-tts-script.local-mock.json \
 *     --out-dir C:\tmp\money-shorts-os\elevenlabs-scene-paced-tts-v1
 *
 * Required env: ELEVENLABS_API_KEY, ELEVENLABS_VOICE_ID
 * Optional env: ELEVENLABS_MODEL_ID, ELEVENLABS_VOICE_LABEL
 *
 * Security constraints:
 * - API key/voice ID never logged or stored.
 * - Voice ID stored as masked form only.
 * - Max 6 ElevenLabs API calls (one per scene). No retry.
 * - No voices list endpoint.
 * - out-dir must be outside repo root.
 * - No .money-shorts-local/ access.
 * - No upload, no DB, no OAuth.
 * - shell: false on all spawnSync.
 * - piq_diag_out.txt never touched.
 */

import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");

// ── .env.local read-only loader ─────────────────────────────────────────────────
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
    "Usage: node build-elevenlabs-scene-paced-tts-from-script.mjs --tts-script <path> --out-dir <path>",
  );
  process.exit(1);
}

const ttsScriptAbsPath = resolve(REPO_ROOT, ttsScriptArg);
const outDirAbs = resolve(outDir);

if (outDirAbs.startsWith(REPO_ROOT + "\\") || outDirAbs.startsWith(REPO_ROOT + "/")) {
  console.error(`ABORT: --out-dir must be outside repo root.\n  repo: ${REPO_ROOT}\n  out-dir: ${outDirAbs}`);
  process.exit(1);
}

if ([ttsScriptAbsPath, outDirAbs].some((p) => p.includes(".money-shorts-local"))) {
  console.error("ABORT: .money-shorts-local access forbidden.");
  process.exit(1);
}

console.log(`\n[scene-paced-tts] tts-script: ${ttsScriptAbsPath}`);
console.log(`[scene-paced-tts] out-dir:    ${outDirAbs}\n`);

// ── Load TTS script ─────────────────────────────────────────────────────────────
let ttsScript;
try {
  ttsScript = JSON.parse(readFileSync(ttsScriptAbsPath, "utf-8"));
} catch (e) {
  console.error(`ABORT: Cannot read TTS script: ${e.message}`);
  process.exit(1);
}

const { scriptId, manifestId, targetDurationSec } = ttsScript;
const scenes = ttsScript.scenes;

if (!scenes || !Array.isArray(scenes) || scenes.length === 0) {
  console.error("ABORT: TTS script has no scenes.");
  process.exit(1);
}

const sortedScenes = [...scenes].sort((a, b) => a.sceneNumber - b.sceneNumber);
const totalSceneDurationSec = sortedScenes.reduce((s, sc) => s + sc.durationSec, 0);

console.log(`  scriptId:       ${scriptId}`);
console.log(`  manifestId:     ${manifestId}`);
console.log(`  scenes:         ${sortedScenes.length}`);
console.log(`  targetDuration: ${targetDurationSec}s`);
console.log(`  sceneTotal:     ${totalSceneDurationSec}s`);
console.log();

mkdirSync(outDirAbs, { recursive: true });

// ── Env readiness ────────────────────────────────────────────────────────────────
console.log("[step 1/5] Checking ElevenLabs env readiness...");
console.log(`  .env.local present: ${envLocalLoaded}`);

const apiKey = resolveEnv("ELEVENLABS_API_KEY", envLocal);
const voiceId = resolveEnv("ELEVENLABS_VOICE_ID", envLocal);
const modelId = resolveEnv("ELEVENLABS_MODEL_ID", envLocal) ?? "eleven_multilingual_v2";
const voiceLabel = resolveEnv("ELEVENLABS_VOICE_LABEL", envLocal) ?? null;

const apiKeyConfigured = !!(apiKey && apiKey.trim().length > 0);
const voiceIdConfigured = !!(voiceId && voiceId.trim().length > 0);

const apiKeySource = process.env.ELEVENLABS_API_KEY ? "process.env" : (envLocal.ELEVENLABS_API_KEY ? ".env.local" : "missing");
const voiceIdSource = process.env.ELEVENLABS_VOICE_ID ? "process.env" : (envLocal.ELEVENLABS_VOICE_ID ? ".env.local" : "missing");
const allSources = new Set([apiKeySource, voiceIdSource].filter((s) => s !== "missing"));
const envSource = allSources.size === 0 ? "missing" : allSources.size === 2 && apiKeySource !== voiceIdSource ? "mixed" : [...allSources][0];

console.log(`  ELEVENLABS_API_KEY configured:  ${apiKeyConfigured} (source: ${apiKeySource})`);
console.log(`  ELEVENLABS_VOICE_ID configured: ${voiceIdConfigured} (source: ${voiceIdSource})`);
console.log(`  ELEVENLABS_MODEL_ID:            ${modelId}`);
console.log();

if (!apiKeyConfigured || !voiceIdConfigured) {
  const missing = [];
  if (!apiKeyConfigured) missing.push("ELEVENLABS_API_KEY");
  if (!voiceIdConfigured) missing.push("ELEVENLABS_VOICE_ID");
  console.error(`READINESS FAILURE: Missing env: ${missing.join(", ")}`);
  console.error("No ElevenLabs API call was made.");

  const failureSummary = {
    schemaVersion: "money_shorts_elevenlabs_scene_paced_tts_summary_v1",
    mode: "elevenlabs_scene_paced",
    provider: "elevenlabs",
    liveApiCallPerformed: false,
    readinessFailure: true,
    missingEnv: missing,
    envSource: "missing",
    apiCallCount: 0,
    apiCallBudgetMax: 6,
    sceneCount: sortedScenes.length,
    targetDurationSec,
    timelineAudioPath: null,
    timelineDurationSec: null,
    timelineAudioCodec: null,
    qualityAccepted: false,
    ownerListeningRequired: true,
    apiKeyConfigured: false,
    voiceIdConfigured: false,
    voiceIdMasked: null,
    scenes: [],
    riskNotes: [
      "readiness_failure: missing required env — no API call was made.",
      "Set ELEVENLABS_API_KEY and ELEVENLABS_VOICE_ID in .env.local or process env to proceed.",
    ],
  };

  const summaryPath = join(outDirAbs, "elevenlabs-scene-paced-tts-summary.json");
  try {
    writeFileSync(summaryPath, JSON.stringify(failureSummary, null, 2), "utf-8");
    console.error(`\n[readiness-failure] summary: ${summaryPath}`);
  } catch { /* best effort */ }
  process.exit(1);
}

function maskVoiceId(id) {
  if (!id || id.length <= 6) return "***";
  return id.slice(0, 3) + "***" + id.slice(-3);
}

const voiceIdMasked = maskVoiceId(voiceId);
console.log(`  voiceIdMasked: ${voiceIdMasked}`);
console.log();

// ── Per-scene TTS API calls ──────────────────────────────────────────────────────
console.log("[step 2/5] Calling ElevenLabs TTS per scene...");
const API_CALL_BUDGET_MAX = 6;
let apiCallCount = 0;

const endpoint = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`;
const voiceSettings = { stability: 0.52, similarity_boost: 0.78, style: 0.1, use_speaker_boost: true };

const sceneResults = [];

for (const scene of sortedScenes) {
  const sceneNum = scene.sceneNumber;
  const sceneNumStr = String(sceneNum).padStart(2, "0");
  const text = scene.narration ?? "";

  if (!text.trim()) {
    console.error(`ABORT: Scene ${sceneNum} has empty narration.`);
    process.exit(1);
  }

  if (apiCallCount >= API_CALL_BUDGET_MAX) {
    console.error(`ABORT: API call budget exceeded (max ${API_CALL_BUDGET_MAX}). Stopping at scene ${sceneNum}.`);
    process.exit(1);
  }

  console.log(`  [scene ${sceneNumStr}] role: ${scene.sceneRole}, target: ${scene.durationSec}s, chars: ${text.length}`);

  let httpStatus = null;
  let audioBuffer = null;

  try {
    apiCallCount++;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({ text, model_id: modelId, voice_settings: voiceSettings }),
    });

    httpStatus = response.status;

    if (!response.ok) {
      console.error(`ABORT: ElevenLabs API returned ${httpStatus} for scene ${sceneNum}.`);
      const errText = await response.text().catch(() => "(unreadable)");
      console.error(`  Error (truncated): ${errText.slice(0, 200)}`);
      process.exit(1);
    }

    const arrayBuffer = await response.arrayBuffer();
    audioBuffer = Buffer.from(arrayBuffer);
    console.log(`    HTTP ${httpStatus}, size: ${audioBuffer.length} bytes`);
  } catch (e) {
    console.error(`ABORT: Fetch failed for scene ${sceneNum}: ${e.message}`);
    process.exit(1);
  }

  const rawAudioPath = join(outDirAbs, `scene-${sceneNumStr}-elevenlabs.mp3`);
  writeFileSync(rawAudioPath, audioBuffer);

  // ffprobe raw audio
  const probeResult = spawnSync("ffprobe", ["-v", "quiet", "-print_format", "json", "-show_format", "-show_streams", rawAudioPath], {
    encoding: "utf-8", maxBuffer: 2 * 1024 * 1024, shell: false,
  });

  const ffprobeExitCode = probeResult.status ?? -1;
  if (ffprobeExitCode !== 0) {
    console.error(`ABORT: ffprobe failed on scene ${sceneNum} audio (exit ${ffprobeExitCode})`);
    process.exit(1);
  }

  let audioProbe;
  try {
    audioProbe = JSON.parse(probeResult.stdout);
  } catch (e) {
    console.error(`ABORT: Cannot parse ffprobe output for scene ${sceneNum}: ${e.message}`);
    process.exit(1);
  }

  const audioStream = (audioProbe.streams ?? []).find((s) => s.codec_type === "audio");
  if (!audioStream) {
    console.error(`ABORT: ffprobe found no audio stream in scene ${sceneNum} mp3.`);
    process.exit(1);
  }

  const rawAudioDurationSec = parseFloat(audioProbe.format?.duration ?? "NaN");
  if (!Number.isFinite(rawAudioDurationSec) || rawAudioDurationSec <= 0) {
    console.error(`ABORT: ffprobe invalid duration for scene ${sceneNum}: ${rawAudioDurationSec}`);
    process.exit(1);
  }

  const audioCodec = audioStream.codec_name ?? "unknown";
  console.log(`    raw duration: ${rawAudioDurationSec.toFixed(3)}s, codec: ${audioCodec}`);

  // Normalize to scene duration
  const targetSceneDurationSec = scene.durationSec;
  const durationDeltaSec = parseFloat((rawAudioDurationSec - targetSceneDurationSec).toFixed(3));
  const normalizedPath = join(outDirAbs, `scene-${sceneNumStr}-normalized.m4a`);

  let normalizeStatus = "fit";
  const sceneRiskNotes = [];
  let normalizeArgs;

  if (rawAudioDurationSec > targetSceneDurationSec + 0.05) {
    normalizeStatus = "trimmed";
    sceneRiskNotes.push(`scene ${sceneNum} trimmed: raw ${rawAudioDurationSec.toFixed(3)}s → target ${targetSceneDurationSec}s`);
    normalizeArgs = ["-y", "-i", rawAudioPath, "-t", String(targetSceneDurationSec), "-c:a", "aac", "-b:a", "128k", normalizedPath];
  } else if (rawAudioDurationSec < targetSceneDurationSec - 0.05) {
    normalizeStatus = "padded";
    sceneRiskNotes.push(`scene ${sceneNum} padded: raw ${rawAudioDurationSec.toFixed(3)}s → target ${targetSceneDurationSec}s`);
    normalizeArgs = ["-y", "-i", rawAudioPath, "-filter_complex", `[0:a]apad=pad_dur=${targetSceneDurationSec}[aout]`, "-map", "[aout]", "-t", String(targetSceneDurationSec), "-c:a", "aac", "-b:a", "128k", normalizedPath];
  } else {
    normalizeStatus = "fit";
    normalizeArgs = ["-y", "-i", rawAudioPath, "-t", String(targetSceneDurationSec), "-c:a", "aac", "-b:a", "128k", normalizedPath];
  }

  const normalizeResult = spawnSync("ffmpeg", normalizeArgs, {
    encoding: "utf-8", maxBuffer: 4 * 1024 * 1024, shell: false,
  });

  if ((normalizeResult.status ?? -1) !== 0) {
    console.error(`ABORT: ffmpeg normalize failed for scene ${sceneNum}`);
    if (normalizeResult.stderr) console.error(normalizeResult.stderr.slice(-300));
    process.exit(1);
  }

  console.log(`    normalized: ${normalizeStatus} → ${targetSceneDurationSec}s → ${normalizedPath}`);

  sceneResults.push({
    sceneNumber: sceneNum,
    sceneRole: scene.sceneRole ?? "unknown",
    targetDurationSec: targetSceneDurationSec,
    rawAudioDurationSec,
    normalizedDurationSec: targetSceneDurationSec,
    audioPath: rawAudioPath,
    normalizedAudioPath: normalizedPath,
    audioCodec,
    httpStatus,
    status: normalizeStatus,
    durationDeltaSec,
    riskNotes: sceneRiskNotes,
  });
}

console.log(`\n  Total API calls: ${apiCallCount} / ${API_CALL_BUDGET_MAX}\n`);

// ── Step 3: Concat normalized scene audios into 30s timeline ─────────────────────
console.log("[step 3/5] Concatenating normalized scene audios into timeline...");

const concatListPath = join(outDirAbs, "concat-list.txt");
const concatListContent = sceneResults.map((sc) => `file '${sc.normalizedAudioPath.replace(/\\/g, "/")}'`).join("\n");
writeFileSync(concatListPath, concatListContent, "utf-8");

const timelineAudioPath = join(outDirAbs, "elevenlabs-scene-paced-timeline.m4a");

const concatResult = spawnSync("ffmpeg", [
  "-y",
  "-f", "concat",
  "-safe", "0",
  "-i", concatListPath,
  "-c", "copy",
  timelineAudioPath,
], { encoding: "utf-8", maxBuffer: 10 * 1024 * 1024, shell: false });

if ((concatResult.status ?? -1) !== 0) {
  console.error("ABORT: ffmpeg concat failed.");
  if (concatResult.stderr) console.error(concatResult.stderr.slice(-300));
  process.exit(1);
}

console.log(`  timeline audio: ${timelineAudioPath}`);

// ffprobe timeline
const timelineProbeResult = spawnSync("ffprobe", ["-v", "quiet", "-print_format", "json", "-show_format", "-show_streams", timelineAudioPath], {
  encoding: "utf-8", maxBuffer: 2 * 1024 * 1024, shell: false,
});

if ((timelineProbeResult.status ?? -1) !== 0) {
  console.error("ABORT: ffprobe failed on timeline audio.");
  process.exit(1);
}

let timelineProbe;
try {
  timelineProbe = JSON.parse(timelineProbeResult.stdout);
} catch (e) {
  console.error(`ABORT: Cannot parse timeline ffprobe output: ${e.message}`);
  process.exit(1);
}

const timelineAudioStream = (timelineProbe.streams ?? []).find((s) => s.codec_type === "audio");
if (!timelineAudioStream) {
  console.error("ABORT: No audio stream in timeline audio.");
  process.exit(1);
}

const timelineDurationSec = parseFloat(timelineProbe.format?.duration ?? "NaN");
if (!Number.isFinite(timelineDurationSec) || timelineDurationSec <= 0) {
  console.error(`ABORT: Timeline audio invalid duration: ${timelineDurationSec}`);
  process.exit(1);
}

const timelineAudioCodec = timelineAudioStream.codec_name ?? "unknown";
console.log(`  timeline duration: ${timelineDurationSec.toFixed(3)}s (target: ${targetDurationSec}s)`);
console.log(`  timeline codec: ${timelineAudioCodec}`);

const timelineDurationOk = Math.abs(timelineDurationSec - targetDurationSec) <= 0.5;
if (!timelineDurationOk) {
  console.error(`WARN: Timeline duration ${timelineDurationSec.toFixed(3)}s deviates from target ${targetDurationSec}s by more than 0.5s.`);
}
console.log();

// ── Step 4: Write summary JSON ────────────────────────────────────────────────────
console.log("[step 4/5] Writing summary...");

const riskNotes = [
  "Scene-paced TTS smoke only, not final voice approval.",
  "Owner listening review required.",
  "No upload performed.",
  "Audio generated outside repo.",
];

for (const sc of sceneResults) {
  for (const rn of sc.riskNotes) riskNotes.push(rn);
}

if (!timelineDurationOk) {
  riskNotes.push(`Timeline duration ${timelineDurationSec.toFixed(3)}s deviates from target ${targetDurationSec}s by more than 0.5s.`);
}

const summary = {
  schemaVersion: "money_shorts_elevenlabs_scene_paced_tts_summary_v1",
  mode: "elevenlabs_scene_paced",
  provider: "elevenlabs",
  liveApiCallPerformed: true,
  readinessFailure: false,
  apiCallCount,
  apiCallBudgetMax: API_CALL_BUDGET_MAX,
  sceneCount: sortedScenes.length,
  targetDurationSec,
  timelineAudioPath,
  timelineDurationSec,
  timelineAudioCodec,
  qualityAccepted: false,
  ownerListeningRequired: true,
  apiKeyConfigured: true,
  voiceIdConfigured: true,
  voiceIdMasked,
  voiceLabel: voiceLabel ?? null,
  envSource,
  modelId,
  generatedAt: new Date().toISOString(),
  scenes: sceneResults,
  riskNotes,
};

const summaryPath = join(outDirAbs, "elevenlabs-scene-paced-tts-summary.json");
writeFileSync(summaryPath, JSON.stringify(summary, null, 2), "utf-8");
console.log(`  summary: ${summaryPath}`);
console.log();

// ── Step 5: Final report ──────────────────────────────────────────────────────────
console.log("[step 5/5] Scene-paced TTS build complete.");
console.log(`  apiCallCount:      ${apiCallCount} / ${API_CALL_BUDGET_MAX}`);
console.log(`  timelineAudio:     ${timelineAudioPath}`);
console.log(`  timelineDuration:  ${timelineDurationSec.toFixed(3)}s`);
console.log(`  qualityAccepted:   false — Owner listening review required`);
console.log(`  liveApiCallPerformed: true\n`);
