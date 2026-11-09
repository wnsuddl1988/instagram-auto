/**
 * Scene-paced ElevenLabs TTS builder.
 * Generates one TTS audio per scene, preserves its natural duration, adds a short tail breath,
 * then concatenates an audio-driven timeline for the final video.
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
 * - Max 10 ElevenLabs API calls (one per scene). No retry.
 * - No voices list endpoint.
 * - out-dir must be outside repo root.
 * - No .money-shorts-local/ access.
 * - No upload, no DB, no OAuth.
 * - shell: false on all spawnSync.
 * - piq_diag_out.txt never touched.
 */

import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
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
const voiceCandidateArg = getArg("--voice-candidate");
const voicePresetArg = getArg("--voice-preset");

if (!ttsScriptArg || !outDir) {
  console.error(
    "Usage: node build-elevenlabs-scene-paced-tts-from-script.mjs --tts-script <path> --out-dir <path> [--voice-candidate <id>]",
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
const API_CALL_BUDGET_MAX = 10;

if (sortedScenes.length > API_CALL_BUDGET_MAX) {
  console.error(`ABORT: TTS script has ${sortedScenes.length} scenes, but max supported is ${API_CALL_BUDGET_MAX}.`);
  process.exit(1);
}

console.log(`  scriptId:       ${scriptId}`);
console.log(`  manifestId:     ${manifestId}`);
console.log(`  scenes:         ${sortedScenes.length}`);
console.log(`  targetDuration: ${targetDurationSec}s`);
console.log(`  sceneTotal:     ${totalSceneDurationSec}s`);
console.log();

mkdirSync(outDirAbs, { recursive: true });

// ── Voice candidate resolution ───────────────────────────────────────────────────
// Supported candidates: hojin_lim, yohan_koo, gihong
// When --voice-candidate <id> is specified, look for candidate-specific env keys only.
// Fallback to ELEVENLABS_VOICE_ID is allowed only when ELEVENLABS_VOICE_LABEL exactly matches the candidate label.
const VOICE_CANDIDATES = {
  hojin_lim: {
    id: "hojin_lim",
    label: "Hojin Lim",
    envKeys: [
      "ELEVENLABS_HOJIN_LIM_VOICE_ID",
      "ELEVENLABS_VOICE_ID_HOJIN_LIM",
      "HOJIN_LIM_ELEVENLABS_VOICE_ID",
    ],
  },
  yohan_koo: {
    id: "yohan_koo",
    label: "Yohan Koo",
    envKeys: [
      "ELEVENLABS_YOHAN_KOO_VOICE_ID",
      "ELEVENLABS_VOICE_ID_YOHAN_KOO",
      "YOHAN_KOO_ELEVENLABS_VOICE_ID",
    ],
  },
  gihong: {
    id: "gihong",
    label: "Gihong",
    envKeys: [
      "ELEVENLABS_GIHONG_VOICE_ID",
      "ELEVENLABS_VOICE_ID_GIHONG",
      "GIHONG_ELEVENLABS_VOICE_ID",
    ],
  },
};

function resolveVoiceCandidate(candidateId, envLocal) {
  const candidate = VOICE_CANDIDATES[candidateId];
  if (!candidate) {
    return { resolved: false, candidateId, voiceId: null, source: "unknown_candidate", missingKeys: [] };
  }
  for (const key of candidate.envKeys) {
    const val = resolveEnv(key, envLocal);
    if (val && val.trim().length > 0) {
      const src = process.env[key] ? "process.env" : ".env.local";
      return { resolved: true, candidateId, candidateLabel: candidate.label, voiceId: val.trim(), source: `${key} (${src})`, missingKeys: [] };
    }
  }
  // Fallback: ELEVENLABS_VOICE_ID only when VOICE_LABEL exactly matches this candidate's label
  const voiceLabel = resolveEnv("ELEVENLABS_VOICE_LABEL", envLocal);
  if (voiceLabel && voiceLabel.trim() === candidate.label) {
    const fallbackId = resolveEnv("ELEVENLABS_VOICE_ID", envLocal);
    if (fallbackId && fallbackId.trim().length > 0) {
      const src = process.env.ELEVENLABS_VOICE_ID ? "process.env" : ".env.local";
      return { resolved: true, candidateId, candidateLabel: candidate.label, voiceId: fallbackId.trim(), source: `ELEVENLABS_VOICE_ID via VOICE_LABEL=${candidate.label} (${src})`, missingKeys: [] };
    }
  }
  return { resolved: false, candidateId, candidateLabel: candidate.label, voiceId: null, source: "missing", missingKeys: [...candidate.envKeys, `ELEVENLABS_VOICE_LABEL=${candidate.label} + ELEVENLABS_VOICE_ID`] };
}

// ── Env readiness ────────────────────────────────────────────────────────────────
console.log("[step 1/5] Checking ElevenLabs env readiness...");
console.log(`  .env.local present: ${envLocalLoaded}`);
if (voiceCandidateArg) console.log(`  --voice-candidate:  ${voiceCandidateArg}`);

const apiKey = resolveEnv("ELEVENLABS_API_KEY", envLocal);
const modelId = resolveEnv("ELEVENLABS_MODEL_ID", envLocal) ?? "eleven_multilingual_v2";
const voiceLabel = resolveEnv("ELEVENLABS_VOICE_LABEL", envLocal) ?? null;

// Resolve voice ID: candidate-first or default
let voiceId;
let voiceCandidateResult = null;
if (voiceCandidateArg) {
  voiceCandidateResult = resolveVoiceCandidate(voiceCandidateArg, envLocal);
  voiceId = voiceCandidateResult.resolved ? voiceCandidateResult.voiceId : null;
} else {
  voiceId = resolveEnv("ELEVENLABS_VOICE_ID", envLocal);
}

const apiKeyConfigured = !!(apiKey && apiKey.trim().length > 0);
const voiceIdConfigured = !!(voiceId && voiceId.trim().length > 0);

const apiKeySource = process.env.ELEVENLABS_API_KEY ? "process.env" : (envLocal.ELEVENLABS_API_KEY ? ".env.local" : "missing");
const voiceIdSource = voiceCandidateResult
  ? (voiceCandidateResult.resolved ? voiceCandidateResult.source : "missing")
  : (process.env.ELEVENLABS_VOICE_ID ? "process.env" : (envLocal.ELEVENLABS_VOICE_ID ? ".env.local" : "missing"));
const allSources = new Set([apiKeySource, voiceIdConfigured ? voiceIdSource : "missing"].filter((s) => s !== "missing"));
const envSource = allSources.size === 0 ? "missing" : allSources.size === 2 && apiKeySource !== voiceIdSource ? "mixed" : [...allSources][0];

console.log(`  ELEVENLABS_API_KEY configured:  ${apiKeyConfigured} (source: ${apiKeySource})`);
if (voiceCandidateResult) {
  console.log(`  Voice candidate [${voiceCandidateArg}] resolved: ${voiceCandidateResult.resolved} (source: ${voiceCandidateResult.source})`);
  if (!voiceCandidateResult.resolved) {
    console.log(`  Missing candidate env keys: ${voiceCandidateResult.missingKeys.join(", ")}`);
  }
} else {
  console.log(`  ELEVENLABS_VOICE_ID configured: ${voiceIdConfigured} (source: ${voiceIdSource})`);
}
console.log(`  ELEVENLABS_MODEL_ID:            ${modelId}`);
console.log();

if (!apiKeyConfigured || !voiceIdConfigured) {
  const missing = [];
  if (!apiKeyConfigured) missing.push("ELEVENLABS_API_KEY");
  if (!voiceIdConfigured) {
    if (voiceCandidateResult && !voiceCandidateResult.resolved) {
      missing.push(...voiceCandidateResult.missingKeys);
    } else {
      missing.push("ELEVENLABS_VOICE_ID");
    }
  }
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
    apiCallBudgetMax: API_CALL_BUDGET_MAX,
    sceneCount: sortedScenes.length,
    targetDurationSec,
    timelineAudioPath: null,
    timelineDurationSec: null,
    timelineAudioCodec: null,
    qualityAccepted: false,
    ownerListeningRequired: true,
    apiKeyConfigured,
    voiceIdConfigured: false,
    voiceIdMasked: null,
    voiceCandidateId: voiceCandidateArg ?? null,
    voiceCandidateLabel: voiceCandidateResult?.candidateLabel ?? null,
    voiceCandidateResolved: voiceCandidateResult ? false : null,
    voiceCandidateSource: voiceCandidateResult?.source ?? null,
    scenes: [],
    riskNotes: [
      "readiness_failure: missing required env — no API call was made.",
      voiceCandidateResult
        ? `Voice candidate '${voiceCandidateArg}' not resolved. Set one of: ${voiceCandidateResult.missingKeys.join(", ")}`
        : "Set ELEVENLABS_API_KEY and ELEVENLABS_VOICE_ID in .env.local or process env to proceed.",
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

// ── Scene TTS text selection / speech direction compilation ──────────────────────
function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function countSpeakableChars(text) {
  return String(text ?? "")
    .replace(/<[^>]+>/g, "")
    .replace(/\[[^\]]+\]/g, "")
    .replace(/\s+/g, "")
    .length;
}

function compileSpeechDirectionText(scene) {
  const direction = scene?.speechDirection;
  if (direction?.engineVersion !== "money_shorts_speech_direction_v1" || !Array.isArray(direction.segments)) return null;
  const segments = direction.segments
    .map((segment) => ({
      text: String(segment?.text ?? "").trim(),
      pauseAfterMs: clamp(Number(segment?.pauseAfterMs) || 0, 0, 600),
    }))
    .filter((segment) => segment.text.length > 0);
  if (segments.length === 0) return null;

  const isElevenV3 = /^eleven_v3(?:$|_)/.test(modelId);
  let text;
  let renderingMode;
  if (isElevenV3) {
    const requestedTag = String(direction.v3AudioTag ?? "").trim().toLowerCase();
    const safeTag = /^[a-z ]{3,32}$/.test(requestedTag) ? `[${requestedTag}] ` : "";
    text = `${safeTag}${segments.map((segment) => segment.text).join("\n")}`.trim();
    renderingMode = "eleven_v3_audio_tag";
  } else {
    text = segments.map((segment, index) => {
      if (index === segments.length - 1 || segment.pauseAfterMs <= 0) return segment.text;
      return `${segment.text} <break time="${(segment.pauseAfterMs / 1000).toFixed(2)}s" />`;
    }).join(" ");
    renderingMode = "v2_context_and_breaks";
  }

  const sourceText = String(scene.narration ?? scene.ttsText ?? direction.performanceText ?? "").trim();
  return {
    text,
    textSource: "speechDirection",
    sourceTextCharCount: countSpeakableChars(sourceText),
    sentTextCharCount: countSpeakableChars(text),
    transportTextCharCount: text.length,
    speechDirectionApplied: true,
    speechDirectionEngineVersion: direction.engineVersion,
    speechRenderingMode: renderingMode,
    delivery: direction.delivery ?? "unknown",
    emphasisWords: Array.isArray(direction.emphasisWords)
      ? direction.emphasisWords.filter((word) => typeof word === "string" && word.trim()).slice(0, 3)
      : [],
  };
}

// Priority: speechDirection → ttsText → spokenCaption → captionText → narration
function resolveSceneTtsText(scene) {
  const directed = compileSpeechDirectionText(scene);
  if (directed) return directed;
  const candidates = [
    { key: "ttsText", value: scene.ttsText },
    { key: "spokenCaption", value: scene.spokenCaption },
    { key: "captionText", value: scene.captionText },
    { key: "narration", value: scene.narration },
  ];
  for (const { key, value } of candidates) {
    if (value && String(value).trim()) {
      const text = String(value).trim();
      return {
        text,
        textSource: key,
        sourceTextCharCount: countSpeakableChars(text),
        sentTextCharCount: countSpeakableChars(text),
        transportTextCharCount: text.length,
        speechDirectionApplied: false,
        speechDirectionEngineVersion: null,
        speechRenderingMode: "plain_text_fallback",
        delivery: "unknown",
        emphasisWords: [],
      };
    }
  }
  return null;
}

// Korean TTS char budget constants calibrated from live ElevenLabs run results.
// Live data (6 scenes, eleven_multilingual_v2): observed ~7–8 chars/sec actual speaking rate.
// MIN=5: below this, silence padding becomes audibly long.
// TARGET=7: conservative upper bound matching observed speaking rate — above this, tail trim is likely.
// WARN=9: hard trim risk; text will almost certainly be cut off.
const TTS_CHARS_PER_SEC_MIN = 5;
const TTS_CHARS_PER_SEC_TARGET = 7;
const TTS_CHARS_PER_SEC_WARN = 9;

function calcDurationTextBudget(durationSec, charCount) {
  const minChars = Math.floor(durationSec * TTS_CHARS_PER_SEC_MIN);
  const maxChars = Math.floor(durationSec * TTS_CHARS_PER_SEC_TARGET);
  const warnChars = Math.floor(durationSec * TTS_CHARS_PER_SEC_WARN);
  let status;
  let warning = null;
  if (charCount < minChars) {
    status = "under_budget";
    warning = `under minimum: ${charCount} chars < ${minChars} (${TTS_CHARS_PER_SEC_MIN}chars/s × ${durationSec}s) — audio-driven timeline will shorten this scene`;
  } else if (charCount > warnChars) {
    status = "over_budget";
    warning = `over hard limit: ${charCount} chars > ${warnChars} (${TTS_CHARS_PER_SEC_WARN}chars/s × ${durationSec}s) — audio-driven timeline will expand this scene`;
  } else if (charCount > maxChars) {
    status = "over_budget";
    warning = `over target: ${charCount} chars > ${maxChars} (${TTS_CHARS_PER_SEC_TARGET}chars/s × ${durationSec}s) — audio-driven timeline will expand this scene`;
  } else {
    status = "within_budget";
  }
  return { durationTextBudgetMinChars: minChars, durationTextBudgetMaxChars: maxChars, durationTextBudgetStatus: status, durationTextBudgetWarning: warning };
}

const voiceIdMasked = maskVoiceId(voiceId);
console.log(`  voiceIdMasked: ${voiceIdMasked}`);
console.log();

// ── Per-scene TTS API calls ──────────────────────────────────────────────────────
console.log("[step 2/5] Calling ElevenLabs TTS per scene...");
let apiCallCount = 0;

const endpoint = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`;

// Voice setting presets. default = 기존 동작 보존. confident_v2 = 더 안정적/자신감 있는 톤
// (속삭임/말끝 흐림 완화 목적: stability↑, similarity_boost↑, style↓).
const VOICE_PRESETS = {
  default: { stability: 0.52, similarity_boost: 0.78, style: 0.1, use_speaker_boost: true },
  expressive_narration_v1: { stability: 0.48, similarity_boost: 0.84, style: 0.28, use_speaker_boost: true },
  confident_v2: { stability: 0.8, similarity_boost: 0.88, style: 0.03, use_speaker_boost: true },
  // confident_v3: v2가 지나치게 flat/속삭임이라 style을 올려 문장 종결을 단단하게, stability는 낮춰
  // 단조로움을 완화. speaker identity 유지를 위해 similarity_boost는 높게.
  confident_v3: { stability: 0.68, similarity_boost: 0.9, style: 0.22, use_speaker_boost: true },
  // 500개 재테크 공통 엔진이 쓰는 최신 기준. 기존 TTS script의 식별자가 default로
  // 조용히 fallback하지 않도록 준호 기준의 confident_v3와 같은 값을 명시한다.
  korean_confident_director_v2: { stability: 0.68, similarity_boost: 0.9, style: 0.22, use_speaker_boost: true },
};
// preset 우선순위: --voice-preset CLI > tts script voicePreset 필드 > default
const requestedPreset = voicePresetArg ?? ttsScript.voicePreset ?? "default";
const voicePresetId = VOICE_PRESETS[requestedPreset] ? requestedPreset : "default";
if (!VOICE_PRESETS[requestedPreset]) {
  console.warn(`  [WARN] unknown voice preset '${requestedPreset}', falling back to 'default'`);
}
const voiceSettings = VOICE_PRESETS[voicePresetId];
console.log(`  voicePreset: ${voicePresetId} (stability=${voiceSettings.stability}, similarity_boost=${voiceSettings.similarity_boost}, style=${voiceSettings.style}, use_speaker_boost=${voiceSettings.use_speaker_boost})`);

const sceneResults = [];
const timingBuildId = Date.now().toString(36);
const DEFAULT_NATURAL_TAIL_PAUSE_SEC = 0.22;
const NATURAL_TAIL_PAUSE_BY_ROLE = {
  hook: 0.16,
  problem: 0.18,
  recommendation: 0.28,
  save: 0.32,
};

function naturalTailPauseSec(sceneRole) {
  return NATURAL_TAIL_PAUSE_BY_ROLE[sceneRole] ?? DEFAULT_NATURAL_TAIL_PAUSE_SEC;
}

function resolveSceneVoiceSettings(scene) {
  const tuning = scene?.speechDirection?.voiceTuning;
  if (!tuning || scene?.speechDirection?.engineVersion !== "money_shorts_speech_direction_v1") return { ...voiceSettings };
  return {
    ...voiceSettings,
    stability: parseFloat(clamp(voiceSettings.stability + (Number(tuning.stabilityDelta) || 0), 0.3, 0.82).toFixed(2)),
    style: parseFloat(clamp(voiceSettings.style + (Number(tuning.styleDelta) || 0), 0, 0.45).toFixed(2)),
  };
}

function resolveSceneContextText(scene) {
  return String(scene?.narration ?? scene?.speechDirection?.performanceText ?? scene?.ttsText ?? "")
    .replace(/<[^>]+>/g, "")
    .replace(/\[[^\]]+\]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function buildSceneInputFingerprint({ text, previousText, nextText, sceneVoiceSettings, scene }) {
  return createHash("sha256").update(JSON.stringify({
    engineVersion: scene?.speechDirection?.engineVersion ?? "plain_text_v1",
    modelId,
    voiceIdentity: voiceCandidateArg ?? voiceLabel ?? voiceIdMasked,
    voicePresetId,
    sceneVoiceSettings,
    text,
    previousText,
    nextText,
  })).digest("hex").slice(0, 12);
}

function probeAudioFile(audioPath, sceneNum) {
  const probeResult = spawnSync("ffprobe", ["-v", "quiet", "-print_format", "json", "-show_format", "-show_streams", audioPath], {
    encoding: "utf-8", maxBuffer: 2 * 1024 * 1024, shell: false,
  });
  if ((probeResult.status ?? -1) !== 0) {
    console.error(`ABORT: ffprobe failed on scene ${sceneNum} audio.`);
    process.exit(1);
  }
  let audioProbe;
  try {
    audioProbe = JSON.parse(probeResult.stdout);
  } catch (e) {
    console.error(`ABORT: Cannot parse scene ${sceneNum} ffprobe output: ${e.message}`);
    process.exit(1);
  }
  const audioStream = (audioProbe.streams ?? []).find((s) => s.codec_type === "audio");
  const rawAudioDurationSec = parseFloat(audioProbe.format?.duration ?? "NaN");
  if (!audioStream || !Number.isFinite(rawAudioDurationSec) || rawAudioDurationSec <= 0) {
    console.error(`ABORT: Scene ${sceneNum} audio is invalid.`);
    process.exit(1);
  }
  return { rawAudioDurationSec, audioCodec: audioStream.codec_name ?? "unknown" };
}

for (let sceneIndex = 0; sceneIndex < sortedScenes.length; sceneIndex++) {
  const scene = sortedScenes[sceneIndex];
  const sceneNum = scene.sceneNumber;
  const sceneNumStr = String(sceneNum).padStart(2, "0");

  const resolved = resolveSceneTtsText(scene);
  if (!resolved) {
    console.error(`ABORT: Scene ${sceneNum} has no usable TTS text (ttsText/spokenCaption/captionText/narration all empty).`);
    process.exit(1);
  }
  const {
    text,
    textSource,
    sourceTextCharCount,
    sentTextCharCount,
    transportTextCharCount,
    speechDirectionApplied,
    speechDirectionEngineVersion,
    speechRenderingMode,
    delivery,
    emphasisWords,
  } = resolved;
  const previousText = sceneIndex > 0 ? resolveSceneContextText(sortedScenes[sceneIndex - 1]) : null;
  const nextText = sceneIndex < sortedScenes.length - 1 ? resolveSceneContextText(sortedScenes[sceneIndex + 1]) : null;
  const sceneVoiceSettings = resolveSceneVoiceSettings(scene);
  const inputFingerprint = buildSceneInputFingerprint({ text, previousText, nextText, sceneVoiceSettings, scene });
  const rawAudioPath = join(outDirAbs, `scene-${sceneNumStr}-elevenlabs-${inputFingerprint}.mp3`);
  const normalizedPath = join(outDirAbs, `scene-${sceneNumStr}-natural-${timingBuildId}.m4a`);

  const budget = calcDurationTextBudget(scene.durationSec, sentTextCharCount);
  if (budget.durationTextBudgetWarning) {
    console.warn(`  [WARN] scene ${sceneNumStr} text budget: ${budget.durationTextBudgetWarning}`);
  }

  let httpStatus = null;
  const reusedRawAudio = existsSync(rawAudioPath);
  if (reusedRawAudio) {
    console.log(`  [scene ${sceneNumStr}] reusing existing raw audio, no new API call`);
  } else {
    if (apiCallCount >= API_CALL_BUDGET_MAX) {
      console.error(`ABORT: API call budget exceeded (max ${API_CALL_BUDGET_MAX}). Stopping at scene ${sceneNum}.`);
      process.exit(1);
    }
    console.log(`  [scene ${sceneNumStr}] role: ${scene.sceneRole}, delivery: ${delivery}, planned: ${scene.durationSec}s, textSource: ${textSource}, chars: ${sentTextCharCount}, context: ${previousText?.length ?? 0}/${nextText?.length ?? 0}, budget: ${budget.durationTextBudgetStatus}`);
    let audioBuffer = null;
    try {
      apiCallCount++;
      const requestBody = {
        text,
        model_id: modelId,
        voice_settings: sceneVoiceSettings,
        ...(previousText ? { previous_text: previousText } : {}),
        ...(nextText ? { next_text: nextText } : {}),
      };
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
    writeFileSync(rawAudioPath, audioBuffer);
  }

  const { rawAudioDurationSec, audioCodec } = probeAudioFile(rawAudioPath, sceneNum);
  console.log(`    raw duration: ${rawAudioDurationSec.toFixed(3)}s, codec: ${audioCodec}`);

  // Preserve the complete narration and add only a short role-aware tail breath.
  const tailPauseSec = naturalTailPauseSec(scene.sceneRole);
  const resolvedSceneDurationSec = parseFloat((rawAudioDurationSec + tailPauseSec).toFixed(3));
  if (resolvedSceneDurationSec < 1 || resolvedSceneDurationSec > 15) {
    console.error(`ABORT: Scene ${sceneNum} natural duration ${resolvedSceneDurationSec}s is outside 1..15s.`);
    process.exit(1);
  }
  const normalizeArgs = [
    "-y", "-i", rawAudioPath,
    "-filter_complex", `[0:a]apad=pad_dur=${tailPauseSec}[aout]`,
    "-map", "[aout]", "-t", String(resolvedSceneDurationSec),
    "-c:a", "aac", "-b:a", "128k", normalizedPath,
  ];

  const normalizeResult = spawnSync("ffmpeg", normalizeArgs, {
    encoding: "utf-8", maxBuffer: 4 * 1024 * 1024, shell: false,
  });

  if ((normalizeResult.status ?? -1) !== 0) {
    console.error(`ABORT: ffmpeg normalize failed for scene ${sceneNum}`);
    if (normalizeResult.stderr) console.error(normalizeResult.stderr.slice(-300));
    process.exit(1);
  }

  const normalizeStatus = reusedRawAudio ? "reused_natural_fit" : "natural_fit";
  console.log(`    normalized: ${normalizeStatus} → ${resolvedSceneDurationSec}s (tail ${tailPauseSec}s) → ${normalizedPath}`);

  sceneResults.push({
    sceneNumber: sceneNum,
    sceneRole: scene.sceneRole ?? "unknown",
    plannedDurationSec: scene.durationSec,
    targetDurationSec: resolvedSceneDurationSec,
    textSource,
    sourceTextCharCount,
    sentTextCharCount,
    transportTextCharCount,
    speechDirectionApplied,
    speechDirectionEngineVersion,
    speechRenderingMode,
    delivery,
    emphasisWords,
    previousContextCharCount: previousText?.length ?? 0,
    nextContextCharCount: nextText?.length ?? 0,
    sceneVoiceSettingsSanitized: sceneVoiceSettings,
    inputFingerprint,
    durationTextBudgetMinChars: budget.durationTextBudgetMinChars,
    durationTextBudgetMaxChars: budget.durationTextBudgetMaxChars,
    durationTextBudgetStatus: budget.durationTextBudgetStatus,
    durationTextBudgetWarning: budget.durationTextBudgetWarning ?? null,
    rawAudioDurationSec,
    normalizedDurationSec: resolvedSceneDurationSec,
    naturalTailPauseSec: tailPauseSec,
    audioPath: rawAudioPath,
    normalizedAudioPath: normalizedPath,
    audioCodec,
    httpStatus,
    status: normalizeStatus,
    durationDeltaSec: parseFloat((resolvedSceneDurationSec - scene.durationSec).toFixed(3)),
    riskNotes: reusedRawAudio ? [`scene ${sceneNum} reused existing raw audio; no new ElevenLabs API call was made.`] : [],
  });
}

let resolvedCursorSec = 0;
for (const scene of sceneResults) {
  scene.startSec = parseFloat(resolvedCursorSec.toFixed(3));
  resolvedCursorSec += scene.normalizedDurationSec;
  scene.endSec = parseFloat(resolvedCursorSec.toFixed(3));
}
const resolvedTargetDurationSec = parseFloat(resolvedCursorSec.toFixed(3));

console.log(`\n  Total API calls: ${apiCallCount} / ${API_CALL_BUDGET_MAX}\n`);

// ── Step 3: Concat natural-fit scene audios into an audio-driven timeline ─────────
console.log("[step 3/5] Concatenating normalized scene audios into timeline...");

const concatListPath = join(outDirAbs, "concat-list.txt");
const concatListContent = sceneResults.map((sc) => `file '${sc.normalizedAudioPath.replace(/\\/g, "/")}'`).join("\n");
writeFileSync(concatListPath, concatListContent, "utf-8");

const timelineAudioPath = join(outDirAbs, `elevenlabs-scene-paced-timeline-natural-${timingBuildId}.m4a`);

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
console.log(`  timeline duration: ${timelineDurationSec.toFixed(3)}s (audio-driven target: ${resolvedTargetDurationSec}s, planned: ${targetDurationSec}s)`);
console.log(`  timeline codec: ${timelineAudioCodec}`);

const timelineDurationOk = Math.abs(timelineDurationSec - resolvedTargetDurationSec) <= 0.5;
if (!timelineDurationOk) {
  console.error(`WARN: Timeline duration ${timelineDurationSec.toFixed(3)}s deviates from audio-driven target ${resolvedTargetDurationSec}s by more than 0.5s.`);
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
  if (sc.durationTextBudgetWarning) riskNotes.push(`scene ${sc.sceneNumber} budget: ${sc.durationTextBudgetWarning}`);
}

if (!timelineDurationOk) {
  riskNotes.push(`Timeline duration ${timelineDurationSec.toFixed(3)}s deviates from audio-driven target ${resolvedTargetDurationSec}s by more than 0.5s.`);
}

const summary = {
  schemaVersion: "money_shorts_elevenlabs_scene_paced_tts_summary_v1",
  mode: "elevenlabs_scene_paced",
  provider: "elevenlabs",
  liveApiCallPerformed: true,
  newApiCallPerformed: apiCallCount > 0,
  readinessFailure: false,
  apiCallCount,
  apiCallBudgetMax: API_CALL_BUDGET_MAX,
  sceneCount: sortedScenes.length,
  timingPolicy: "audio_driven_natural_v1",
  prosodyPolicy: ttsScript.prosodyPolicy ?? "plain_text_fallback",
  speechDirectionEngineVersion: sceneResults.some((scene) => scene.speechDirectionApplied)
    ? "money_shorts_speech_direction_v1"
    : null,
  speechContextPolicy: "immediate_neighbor_scenes",
  plannedTargetDurationSec: targetDurationSec,
  targetDurationSec: resolvedTargetDurationSec,
  timelineAudioPath,
  timelineDurationSec,
  timelineAudioCodec,
  qualityAccepted: false,
  ownerListeningRequired: true,
  apiKeyConfigured: true,
  voiceIdConfigured: true,
  voiceIdMasked,
  voiceLabel: voiceLabel ?? null,
  voiceCandidateId: voiceCandidateArg ?? null,
  voiceCandidateLabel: voiceCandidateResult?.candidateLabel ?? null,
  voiceCandidateResolved: voiceCandidateResult ? true : null,
  voiceCandidateSource: voiceCandidateResult?.source ?? null,
  voicePresetId,
  voiceSettingsSanitized: { ...voiceSettings },
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
