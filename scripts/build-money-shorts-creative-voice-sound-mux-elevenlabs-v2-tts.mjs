#!/usr/bin/env node
// ──────────────────────────────────────────────────────────────────────────
// build-money-shorts-creative-voice-sound-mux-elevenlabs-v2-tts.mjs
//
// MONEY SHORTS OS — ELEVENLABS SCENE-PACED TTS (atempo tail-preserving) v2
//
// v2 manifest의 ttsScript(scene별 sceneNumber/durationSec/ttsText)를 소비해:
//   1) scene별 ElevenLabs real TTS를 정확히 1회씩 호출 (max 6, no retry)
//   2) raw>target이면 -t hard trim이 아니라 atempo(=raw/target, tail-preserving)로 normalize
//        ratio > atempoRatioAbortThreshold(1.25)면 abort/보고 후 중단
//      raw<target이면 apad로 무음 패딩
//   3) normalized scene audio를 concat → 30s timeline (m4a/aac)
//   4) 기존 mux helper 호환 summary(money_shorts_elevenlabs_scene_paced_tts_summary_v1) 작성
//
// env는 read-only. secret 원문 미출력(voiceId masked만). Math.random 미사용.
// 자동 재시도/voice list endpoint/voice 실험/script 수정 루프 금지.
//
// 기존 build-elevenlabs-scene-paced-tts-from-script.mjs를 수정하지 않고,
// 그 검증된 패턴(env resolve, endpoint, budget, char budget, ffprobe)을 이식한다.
// 유일한 정책 차이: normalize를 atempo tail-preserving으로 한다.
// ──────────────────────────────────────────────────────────────────────────

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");

// ── CLI args ──────────────────────────────────────────────────────────────────
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
const atempoThresholdArg = getArg("--atempo-abort-threshold");

if (!ttsScriptArg || !outDir) {
  console.error("Usage: node build-money-shorts-creative-voice-sound-mux-elevenlabs-v2-tts.mjs --tts-script <path> --out-dir <path> [--voice-candidate <id>] [--voice-preset <id>]");
  process.exit(1);
}

const ttsScriptAbsPath = resolve(REPO_ROOT, ttsScriptArg);
const outDirAbs = resolve(outDir);

// ── Safety: out-dir outside repo, no .money-shorts-local ─────────────────────
if (outDirAbs === REPO_ROOT || outDirAbs.startsWith(REPO_ROOT + "\\") || outDirAbs.startsWith(REPO_ROOT + "/")) {
  console.error(`ABORT: --out-dir must be outside repo root.\n  repo: ${REPO_ROOT}\n  out-dir: ${outDirAbs}`);
  process.exit(1);
}
if ([ttsScriptAbsPath, outDirAbs].some((p) => p.includes(".money-shorts-local"))) {
  console.error("ABORT: .money-shorts-local access forbidden.");
  process.exit(1);
}
mkdirSync(outDirAbs, { recursive: true });

const ATEMPO_ABORT_THRESHOLD = Number(atempoThresholdArg ?? "1.25");

// ── env loading (read-only) ──────────────────────────────────────────────────
function loadEnvLocal() {
  let content;
  try {
    content = readFileSync(join(REPO_ROOT, ".env.local"), "utf-8");
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

// ── TTS script load ──────────────────────────────────────────────────────────
let ttsScript;
try {
  ttsScript = JSON.parse(readFileSync(ttsScriptAbsPath, "utf-8"));
} catch (e) {
  console.error(`ABORT: Cannot read TTS script: ${e.message}`);
  process.exit(1);
}
if (ttsScript.audioMode !== "elevenlabs_real_tts" || ttsScript.notRealSpeech !== false) {
  console.error("ABORT: TTS script audioMode must be elevenlabs_real_tts and notRealSpeech must be false.");
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

console.log("── ELEVENLABS SCENE-PACED TTS (atempo tail-preserving) v2 ──");
console.log(`  scriptId:       ${scriptId}`);
console.log(`  manifestId:     ${manifestId}`);
console.log(`  scenes:         ${sortedScenes.length}`);
console.log(`  targetDuration: ${targetDurationSec}s`);
console.log(`  sceneTotal:     ${totalSceneDurationSec}s`);
console.log(`  atempoAbortThreshold: ${ATEMPO_ABORT_THRESHOLD}`);

// ── voice candidate → env voice id resolution (candidate-specific keys only) ─
const VOICE_CANDIDATES = {
  yohan_koo: {
    label: "Yohan Koo",
    envKeys: ["ELEVENLABS_YOHAN_KOO_VOICE_ID", "ELEVENLABS_VOICE_ID_YOHAN_KOO", "YOHAN_KOO_ELEVENLABS_VOICE_ID"],
  },
};
function resolveVoiceCandidate(candidateId) {
  const candidate = VOICE_CANDIDATES[candidateId];
  if (!candidate) {
    return { resolved: false, candidateId, candidateLabel: null, voiceId: null, source: "unknown_candidate", missingKeys: [] };
  }
  for (const key of candidate.envKeys) {
    const val = resolveEnv(key, envLocal);
    if (val && val.trim().length > 0) {
      const src = process.env[key] ? "process.env" : ".env.local";
      return { resolved: true, candidateId, candidateLabel: candidate.label, voiceId: val.trim(), source: `${key} (${src})`, missingKeys: [] };
    }
  }
  // Fallback: ELEVENLABS_VOICE_ID only when VOICE_LABEL exactly matches this candidate's label.
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

const requestedCandidate = voiceCandidateArg ?? ttsScript.voiceCandidateId ?? null;

const apiKey = resolveEnv("ELEVENLABS_API_KEY", envLocal);
const modelId = resolveEnv("ELEVENLABS_MODEL_ID", envLocal) ?? "eleven_multilingual_v2";
const voiceLabel = resolveEnv("ELEVENLABS_VOICE_LABEL", envLocal) ?? null;

let voiceId;
let voiceCandidateResult = null;
if (requestedCandidate) {
  voiceCandidateResult = resolveVoiceCandidate(requestedCandidate);
  voiceId = voiceCandidateResult.voiceId;
} else {
  voiceId = resolveEnv("ELEVENLABS_VOICE_ID", envLocal);
}

const apiKeyConfigured = !!(apiKey && apiKey.trim().length > 0);
const voiceIdConfigured = !!(voiceId && voiceId.trim().length > 0);
const apiKeySource = process.env.ELEVENLABS_API_KEY ? "process.env" : (envLocal.ELEVENLABS_API_KEY ? ".env.local" : "missing");
const voiceIdSource = voiceCandidateResult
  ? voiceCandidateResult.source
  : (process.env.ELEVENLABS_VOICE_ID ? "process.env" : (envLocal.ELEVENLABS_VOICE_ID ? ".env.local" : "missing"));

console.log(`  ELEVENLABS_API_KEY configured:  ${apiKeyConfigured} (source: ${apiKeySource})`);
console.log(`  voiceCandidate: ${requestedCandidate ?? "(none)"}  configured: ${voiceIdConfigured} (source: ${voiceIdSource})`);
console.log(`  ELEVENLABS_MODEL_ID:            ${modelId}`);

function maskVoiceId(id) {
  if (!id || id.length <= 6) return "***";
  return id.slice(0, 3) + "***" + id.slice(-3);
}

// ── readiness gate: missing env → graceful failure summary, no API call ──────
if (!apiKeyConfigured || !voiceIdConfigured) {
  const missing = [];
  if (!apiKeyConfigured) missing.push("ELEVENLABS_API_KEY");
  if (!voiceIdConfigured) missing.push(voiceCandidateResult ? `voice id for candidate '${requestedCandidate}'` : "ELEVENLABS_VOICE_ID");

  const failureSummary = {
    schemaVersion: "money_shorts_elevenlabs_scene_paced_tts_summary_v1",
    mode: "elevenlabs_scene_paced",
    provider: "elevenlabs",
    liveApiCallPerformed: false,
    readinessFailure: true,
    apiCallCount: 0,
    apiCallBudgetMax: 6,
    sceneCount: sortedScenes.length,
    targetDurationSec,
    timelineAudioPath: null,
    timelineDurationSec: null,
    qualityAccepted: false,
    ownerListeningRequired: true,
    apiKeyConfigured,
    voiceIdConfigured: false,
    voiceIdMasked: null,
    voiceCandidateId: requestedCandidate ?? null,
    scenes: [],
    riskNotes: [
      "readiness_failure: missing required env — no API call was made.",
      `Missing: ${missing.join(", ")}`,
    ],
  };
  const summaryPath = join(outDirAbs, "elevenlabs-scene-paced-tts-summary.json");
  try {
    writeFileSync(summaryPath, JSON.stringify(failureSummary, null, 2), "utf-8");
    console.error(`\n[readiness-failure] summary: ${summaryPath}`);
  } catch { /* best effort */ }
  console.error(`ABORT: ElevenLabs env missing/invalid — ${missing.join(", ")}. No API call performed.`);
  process.exit(1);
}

const voiceIdMasked = maskVoiceId(voiceId);
console.log(`  voiceIdMasked: ${voiceIdMasked}`);

// ── voice presets (identical to existing helper; default preserves behavior) ─
const VOICE_PRESETS = {
  default: { stability: 0.52, similarity_boost: 0.78, style: 0.1, use_speaker_boost: true },
  confident_v2: { stability: 0.8, similarity_boost: 0.88, style: 0.03, use_speaker_boost: true },
  confident_v3: { stability: 0.68, similarity_boost: 0.9, style: 0.22, use_speaker_boost: true },
};
const requestedPreset = voicePresetArg ?? ttsScript.voicePreset ?? "default";
const voicePresetId = VOICE_PRESETS[requestedPreset] ? requestedPreset : "default";
const voiceSettings = VOICE_PRESETS[voicePresetId];
console.log(`  voicePreset:    ${voicePresetId}`);

// ── Korean TTS char budget (calibrated, same constants as existing helper) ───
const TTS_CHARS_PER_SEC_MIN = 5;
const TTS_CHARS_PER_SEC_TARGET = 7;
const TTS_CHARS_PER_SEC_WARN = 9;
function calcDurationTextBudget(durationSec, charCount) {
  const minChars = Math.floor(durationSec * TTS_CHARS_PER_SEC_MIN);
  const maxChars = Math.floor(durationSec * TTS_CHARS_PER_SEC_TARGET);
  const warnChars = Math.floor(durationSec * TTS_CHARS_PER_SEC_WARN);
  let status = "within_budget";
  let warning = null;
  if (charCount < minChars) { status = "under_budget"; warning = `under minimum: ${charCount} < ${minChars} — silence padding likely`; }
  else if (charCount > warnChars) { status = "over_budget"; warning = `over hard limit: ${charCount} > ${warnChars} — atempo speedup risk`; }
  else if (charCount > maxChars) { status = "over_budget"; warning = `over target: ${charCount} > ${maxChars} — atempo speedup possible`; }
  return { durationTextBudgetMinChars: minChars, durationTextBudgetMaxChars: maxChars, durationTextBudgetStatus: status, durationTextBudgetWarning: warning };
}

function resolveSceneTtsText(scene) {
  const candidates = [
    { key: "ttsText", value: scene.ttsText },
    { key: "spokenCaption", value: scene.spokenCaption },
    { key: "captionText", value: scene.captionText },
    { key: "text", value: scene.text },
  ];
  for (const { key, value } of candidates) {
    if (value && String(value).trim()) {
      const t = String(value).trim();
      return { text: t, textSource: key, charCount: [...t].length };
    }
  }
  return null;
}

// ── Step 2: per-scene ElevenLabs API calls (max 6, no retry) ─────────────────
console.log("\n[step 2/5] Calling ElevenLabs TTS per scene (atempo normalize)...");
const API_CALL_BUDGET_MAX = 6;
let apiCallCount = 0;
const endpoint = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`;
const sceneResults = [];

for (const scene of sortedScenes) {
  const sceneNum = scene.sceneNumber;
  const sceneNumStr = String(sceneNum).padStart(2, "0");

  const resolved = resolveSceneTtsText(scene);
  if (!resolved) {
    console.error(`ABORT: Scene ${sceneNum} has no usable TTS text.`);
    process.exit(1);
  }
  const { text, textSource, charCount } = resolved;
  const budget = calcDurationTextBudget(scene.durationSec, charCount);
  if (budget.durationTextBudgetWarning) {
    console.warn(`  [WARN] scene ${sceneNumStr} text budget: ${budget.durationTextBudgetWarning}`);
  }

  if (apiCallCount >= API_CALL_BUDGET_MAX) {
    console.error(`ABORT: API call budget exceeded (max ${API_CALL_BUDGET_MAX}). Stopping at scene ${sceneNum}.`);
    process.exit(1);
  }

  console.log(`  [scene ${sceneNumStr}] role: ${scene.sceneRole ?? "unknown"}, target: ${scene.durationSec}s, textSource: ${textSource}, chars: ${charCount}, budget: ${budget.durationTextBudgetStatus}`);

  let httpStatus = null;
  let audioBuffer = null;
  try {
    apiCallCount++;
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "xi-api-key": apiKey, "Content-Type": "application/json", Accept: "audio/mpeg" },
      body: JSON.stringify({ text, model_id: modelId, voice_settings: voiceSettings }),
    });
    httpStatus = response.status;
    if (!response.ok) {
      const errText = await response.text().catch(() => "(unreadable)");
      console.error(`ABORT: ElevenLabs API returned ${httpStatus} for scene ${sceneNum}. (no retry)`);
      console.error(`  Error (truncated): ${errText.slice(0, 200)}`);
      process.exit(1);
    }
    const arrayBuffer = await response.arrayBuffer();
    audioBuffer = Buffer.from(arrayBuffer);
    console.log(`    HTTP ${httpStatus}, size: ${audioBuffer.length} bytes`);
  } catch (e) {
    console.error(`ABORT: Fetch failed for scene ${sceneNum}: ${e.message} (no retry)`);
    process.exit(1);
  }

  const rawAudioPath = join(outDirAbs, `scene-${sceneNumStr}-elevenlabs.mp3`);
  writeFileSync(rawAudioPath, audioBuffer);

  // ffprobe raw audio
  const probeResult = spawnSync("ffprobe", ["-v", "quiet", "-print_format", "json", "-show_format", "-show_streams", rawAudioPath], { encoding: "utf-8", maxBuffer: 2 * 1024 * 1024, shell: false });
  if ((probeResult.status ?? -1) !== 0) { console.error(`ABORT: ffprobe failed on scene ${sceneNum} audio.`); process.exit(1); }
  let audioProbe;
  try { audioProbe = JSON.parse(probeResult.stdout); } catch (e) { console.error(`ABORT: cannot parse ffprobe for scene ${sceneNum}: ${e.message}`); process.exit(1); }
  const audioStream = (audioProbe.streams ?? []).find((s) => s.codec_type === "audio");
  if (!audioStream) { console.error(`ABORT: no audio stream in scene ${sceneNum} mp3.`); process.exit(1); }
  const rawAudioDurationSec = parseFloat(audioProbe.format?.duration ?? "NaN");
  if (!Number.isFinite(rawAudioDurationSec) || rawAudioDurationSec <= 0) { console.error(`ABORT: invalid duration scene ${sceneNum}: ${rawAudioDurationSec}`); process.exit(1); }
  const audioCodec = audioStream.codec_name ?? "unknown";
  console.log(`    raw duration: ${rawAudioDurationSec.toFixed(3)}s, codec: ${audioCodec}`);

  // ── normalize to scene duration: tail-preserving (atempo speed-up + pad + verify) ──
  // 핵심 계약: 절대 tail을 자르지 않는다. 잘라서 맞추지 말고 "속도 조정 + 패딩 + 검증".
  //   raw > target : atempo=ratio 로 speed-up (-t hard trim 금지). atempo 후에도 target보다
  //                  길면 trim하지 말고 apad whole_dur로 맞추되, 과도 초과면 abort/report.
  //   raw < target : apad whole_dur 로 무음 패딩.
  //   |raw-target| 미세 : apad whole_dur 로 정확히 target에 맞춤(짧으면 패딩, 이미 맞으면 no-op).
  // apad=whole_dur=<target> 은 오디오를 target까지 무음으로 늘리기만 하며 절대 자르지 않는다.
  const targetSceneDurationSec = scene.durationSec;
  const durationDeltaSec = parseFloat((rawAudioDurationSec - targetSceneDurationSec).toFixed(3));
  const normalizedPath = join(outDirAbs, `scene-${sceneNumStr}-normalized.m4a`);
  const sceneRiskNotes = [];
  let normalizeStatus;
  let atempoRatio = null;

  // ffprobe helper for an audio file's duration (used to verify tail-preserving normalize).
  function probeDurationSec(path) {
    const p = spawnSync("ffprobe", ["-v", "quiet", "-print_format", "json", "-show_format", path], { encoding: "utf-8", maxBuffer: 2 * 1024 * 1024, shell: false });
    if ((p.status ?? -1) !== 0) return NaN;
    try { return parseFloat(JSON.parse(p.stdout).format?.duration ?? "NaN"); } catch { return NaN; }
  }

  // Step A: build the audio filter chain WITHOUT any -t hard trim.
  //   - over-target: atempo speed-up, then apad whole_dur to guarantee exact target length.
  //   - otherwise:   apad whole_dur to pad silence up to target (no-op if already exact).
  // apad=whole_dur only extends; it never truncates, so the speech tail is always preserved.
  let filterChain;
  if (rawAudioDurationSec > targetSceneDurationSec + 0.05) {
    atempoRatio = parseFloat((rawAudioDurationSec / targetSceneDurationSec).toFixed(4));
    if (atempoRatio > ATEMPO_ABORT_THRESHOLD) {
      console.error(`ABORT: scene ${sceneNum} atempo ratio ${atempoRatio} exceeds threshold ${ATEMPO_ABORT_THRESHOLD}. raw ${rawAudioDurationSec.toFixed(3)}s vs target ${targetSceneDurationSec}s. Not forcing; stop and report.`);
      process.exit(2);
    }
    normalizeStatus = "atempo_compressed";
    sceneRiskNotes.push(`scene ${sceneNum} atempo x${atempoRatio}: raw ${rawAudioDurationSec.toFixed(3)}s → target ${targetSceneDurationSec}s (tail-preserving speed-up + pad, no hard trim)`);
    // atempo supports 0.5–2.0 in one pass; our threshold (<=1.25) is well inside range.
    filterChain = `atempo=${atempoRatio},apad=whole_dur=${targetSceneDurationSec}`;
  } else if (rawAudioDurationSec < targetSceneDurationSec - 0.05) {
    normalizeStatus = "padded";
    sceneRiskNotes.push(`scene ${sceneNum} padded: raw ${rawAudioDurationSec.toFixed(3)}s → target ${targetSceneDurationSec}s`);
    filterChain = `apad=whole_dur=${targetSceneDurationSec}`;
  } else {
    normalizeStatus = "fit";
    filterChain = `apad=whole_dur=${targetSceneDurationSec}`;
  }

  // NOTE: no "-t" flag anywhere — length is set purely by apad whole_dur (extend-only).
  const normalizeArgs = ["-y", "-i", rawAudioPath, "-filter_complex", `[0:a]${filterChain}[aout]`, "-map", "[aout]", "-c:a", "aac", "-b:a", "128k", normalizedPath];

  const normalizeResult = spawnSync("ffmpeg", normalizeArgs, { encoding: "utf-8", maxBuffer: 4 * 1024 * 1024, shell: false });
  if ((normalizeResult.status ?? -1) !== 0) {
    console.error(`ABORT: ffmpeg normalize failed for scene ${sceneNum}`);
    if (normalizeResult.stderr) console.error(normalizeResult.stderr.slice(-300));
    process.exit(1);
  }

  // Step B: verify the normalized duration. Never trim to fix — if it overshoots the
  // window by more than tolerance, stop and report instead of cutting the tail.
  const normalizedDurationSec = probeDurationSec(normalizedPath);
  if (!Number.isFinite(normalizedDurationSec) || normalizedDurationSec <= 0) {
    console.error(`ABORT: cannot verify normalized duration for scene ${sceneNum}.`);
    process.exit(1);
  }
  const NORMALIZE_OVERSHOOT_TOLERANCE = 0.25;
  if (normalizedDurationSec > targetSceneDurationSec + NORMALIZE_OVERSHOOT_TOLERANCE) {
    console.error(`ABORT: scene ${sceneNum} normalized duration ${normalizedDurationSec.toFixed(3)}s exceeds target ${targetSceneDurationSec}s by > ${NORMALIZE_OVERSHOOT_TOLERANCE}s. Refusing to hard-trim the tail; stop and report.`);
    process.exit(2);
  }
  console.log(`    normalized: ${normalizeStatus}${atempoRatio ? ` (atempo x${atempoRatio})` : ""} → ${normalizedDurationSec.toFixed(3)}s (target ${targetSceneDurationSec}s, no hard trim)`);

  sceneResults.push({
    sceneNumber: sceneNum,
    sceneRole: scene.sceneRole ?? "unknown",
    targetDurationSec: targetSceneDurationSec,
    textSource,
    sentTextCharCount: charCount,
    durationTextBudgetStatus: budget.durationTextBudgetStatus,
    durationTextBudgetWarning: budget.durationTextBudgetWarning ?? null,
    rawAudioDurationSec,
    normalizedDurationSec: parseFloat(normalizedDurationSec.toFixed(3)),
    normalizeMethod: normalizeStatus === "atempo_compressed" ? "atempo" : "apad",
    atempoRatio,
    hardTrimApplied: false,
    audioPath: rawAudioPath,
    normalizedAudioPath: normalizedPath,
    audioCodec,
    httpStatus,
    status: normalizeStatus,
    durationDeltaSec,
    riskNotes: sceneRiskNotes,
  });
}

console.log(`\n  Total API calls: ${apiCallCount} / ${API_CALL_BUDGET_MAX}`);

// ── Step 3: concat normalized scenes → timeline ──────────────────────────────
console.log("\n[step 3/5] Concatenating normalized scene audios into timeline...");
const concatListPath = join(outDirAbs, "concat-list.txt");
writeFileSync(concatListPath, sceneResults.map((sc) => `file '${sc.normalizedAudioPath.replace(/\\/g, "/")}'`).join("\n"), "utf-8");
const timelineAudioPath = join(outDirAbs, "elevenlabs-scene-paced-timeline.m4a");
const concatResult = spawnSync("ffmpeg", ["-y", "-f", "concat", "-safe", "0", "-i", concatListPath, "-c", "copy", timelineAudioPath], { encoding: "utf-8", maxBuffer: 10 * 1024 * 1024, shell: false });
if ((concatResult.status ?? -1) !== 0) { console.error("ABORT: ffmpeg concat failed."); if (concatResult.stderr) console.error(concatResult.stderr.slice(-300)); process.exit(1); }

const tProbe = spawnSync("ffprobe", ["-v", "quiet", "-print_format", "json", "-show_format", "-show_streams", timelineAudioPath], { encoding: "utf-8", maxBuffer: 2 * 1024 * 1024, shell: false });
if ((tProbe.status ?? -1) !== 0) { console.error("ABORT: ffprobe failed on timeline audio."); process.exit(1); }
let timelineProbe;
try { timelineProbe = JSON.parse(tProbe.stdout); } catch (e) { console.error(`ABORT: cannot parse timeline ffprobe: ${e.message}`); process.exit(1); }
const timelineAudioStream = (timelineProbe.streams ?? []).find((s) => s.codec_type === "audio");
if (!timelineAudioStream) { console.error("ABORT: no audio stream in timeline."); process.exit(1); }
const timelineDurationSec = parseFloat(timelineProbe.format?.duration ?? "NaN");
if (!Number.isFinite(timelineDurationSec) || timelineDurationSec <= 0) { console.error(`ABORT: timeline invalid duration: ${timelineDurationSec}`); process.exit(1); }
const timelineAudioCodec = timelineAudioStream.codec_name ?? "unknown";
console.log(`  timeline duration: ${timelineDurationSec.toFixed(3)}s (target: ${targetDurationSec}s), codec: ${timelineAudioCodec}`);
const timelineDurationOk = Math.abs(timelineDurationSec - targetDurationSec) <= 0.5;
if (!timelineDurationOk) console.error(`WARN: timeline ${timelineDurationSec.toFixed(3)}s deviates from target ${targetDurationSec}s by > 0.5s.`);

// ── Step 4: write summary (mux-helper compatible schema) ─────────────────────
console.log("\n[step 4/5] Writing summary...");
const anyHardTrim = sceneResults.some((sc) => sc.hardTrimApplied === true);
const maxAtempoRatio = sceneResults.reduce((m, sc) => (sc.atempoRatio && sc.atempoRatio > m ? sc.atempoRatio : m), 0);
const riskNotes = [
  "ElevenLabs real TTS scene-paced first run — not final voice approval.",
  "Owner listening review required before upload.",
  "No upload performed.",
  "Audio generated outside repo.",
  "normalize=atempo tail-preserving; no -t hard trim.",
];
for (const sc of sceneResults) { for (const rn of sc.riskNotes) riskNotes.push(rn); }
if (!timelineDurationOk) riskNotes.push(`Timeline duration ${timelineDurationSec.toFixed(3)}s deviates from target ${targetDurationSec}s by more than 0.5s.`);

const summary = {
  schemaVersion: "money_shorts_elevenlabs_scene_paced_tts_summary_v1",
  mode: "elevenlabs_scene_paced",
  provider: "elevenlabs",
  liveApiCallPerformed: true,
  realTtsExecuted: true,
  readinessFailure: false,
  normalizeMethod: "atempo",
  hardTrimApplied: anyHardTrim,
  maxAtempoRatio,
  atempoAbortThreshold: ATEMPO_ABORT_THRESHOLD,
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
  voiceCandidateId: requestedCandidate ?? null,
  voiceCandidateLabel: voiceCandidateResult?.candidateLabel ?? null,
  voicePresetId,
  voiceSettingsSanitized: { ...voiceSettings },
  modelId,
  scriptId,
  manifestId,
  scenes: sceneResults,
  riskNotes,
};
const summaryPath = join(outDirAbs, "elevenlabs-scene-paced-tts-summary.json");
writeFileSync(summaryPath, JSON.stringify(summary, null, 2), "utf-8");
console.log(`  summary: ${summaryPath}`);

console.log("\n[step 5/5] Done.");
console.log(`  apiCallCount=${apiCallCount} maxAtempoRatio=${maxAtempoRatio} hardTrimApplied=${anyHardTrim}`);
console.log(`  timeline: ${timelineAudioPath} (${timelineDurationSec.toFixed(3)}s)`);
process.exit(0);
