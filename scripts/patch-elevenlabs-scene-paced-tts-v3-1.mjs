/**
 * Scene-paced ElevenLabs TTS PATCH runner (v3.1).
 *
 * v3를 폐기하지 않고 Scene 4/6만 재호출한다. Scene 1/2/3/5는 v3 normalized audio를 재사용한다.
 * 6개 normalized audio를 concat해 v3.1 timeline을 만든 뒤 mux runner가 그대로 소비할 수 있는
 * summary(money_shorts_elevenlabs_scene_paced_tts_summary_v1)를 출력한다.
 *
 * Usage:
 *   node scripts/patch-elevenlabs-scene-paced-tts-v3-1.mjs \
 *     --tts-script scripts/fixtures/provider-candidate-tts-script.yohan-koo.ecos-live-draft.voice-v3-1.json \
 *     --voice-candidate yohan_koo \
 *     --voice-preset confident_v3 \
 *     --reuse-dir C:\tmp\money-shorts-os\selected-image-elevenlabs-scene-paced-tts-voice-v3 \
 *     --out-dir   C:\tmp\money-shorts-os\selected-image-elevenlabs-scene-paced-tts-voice-v3-1
 *
 * Security constraints (기존 scene-paced builder와 동일 계약):
 * - API key/voice ID never logged or stored. Voice ID stored as masked form only.
 * - PATCHED_SCENES(4,6)만 호출. API_CALL_BUDGET_MAX = 2. No retry.
 * - No voices list endpoint. No upload/DB/OAuth. shell:false on all spawnSync.
 * - out-dir/reuse-dir must be outside repo root. No .money-shorts-local access. piq_diag_out.txt never touched.
 */

import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, copyFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");

// ── PATCH scope ───────────────────────────────────────────────────────────────
const PATCHED_SCENES = [4, 6];
const REUSED_SCENES = [1, 2, 3, 5];
const API_CALL_BUDGET_MAX = 2;
let apiCallCount = 0;

// ── .env.local read-only loader (builder와 동일) ────────────────────────────────
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
function maskVoiceId(id) {
  if (!id || id.length < 6) return "***";
  return `${id.slice(0, 3)}***${id.slice(-3)}`;
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
const reuseDir = getArg("--reuse-dir");
const voiceCandidateArg = getArg("--voice-candidate");
const voicePresetArg = getArg("--voice-preset");
// no-live tail-preserving mode: patch scene(4/6) raw mp3를 기존 v3.1 산출물에서 읽고,
// ElevenLabs를 절대 호출하지 않는다. over-target moderate ratio는 hard trim 대신 atempo로 tempo-fit.
const reuseExistingRaw = args.includes("--reuse-existing-raw");
const rawDirArg = getArg("--raw-dir"); // no-live 모드에서 scene-0N-elevenlabs.mp3가 있는 디렉토리

if (!ttsScriptArg || !outDir || !reuseDir) {
  console.error("Usage: node patch-elevenlabs-scene-paced-tts-v3-1.mjs --tts-script <path> --reuse-dir <path> --out-dir <path> [--voice-candidate <id>] [--voice-preset <id>] [--reuse-existing-raw --raw-dir <path>]");
  process.exit(1);
}
if (reuseExistingRaw && !rawDirArg) {
  console.error("ABORT: --reuse-existing-raw requires --raw-dir <dir containing scene-0N-elevenlabs.mp3>.");
  process.exit(1);
}

const ttsScriptAbsPath = resolve(REPO_ROOT, ttsScriptArg);
const outDirAbs = resolve(outDir);
const reuseDirAbs = resolve(reuseDir);
const rawDirAbs = rawDirArg ? resolve(rawDirArg) : null;

if (outDirAbs.startsWith(REPO_ROOT + "\\") || outDirAbs.startsWith(REPO_ROOT + "/")) {
  console.error(`ABORT: --out-dir must be outside repo root.\n  repo: ${REPO_ROOT}\n  out-dir: ${outDirAbs}`);
  process.exit(1);
}
const pathsToCheck = [ttsScriptAbsPath, outDirAbs, reuseDirAbs];
if (rawDirAbs) pathsToCheck.push(rawDirAbs);
if (pathsToCheck.some((p) => p.includes(".money-shorts-local"))) {
  console.error("ABORT: .money-shorts-local access forbidden.");
  process.exit(1);
}

console.log(`\n[patch-v3.1] tts-script: ${ttsScriptAbsPath}`);
console.log(`[patch-v3.1] reuse-dir:  ${reuseDirAbs}`);
console.log(`[patch-v3.1] out-dir:    ${outDirAbs}`);
console.log(`[patch-v3.1] mode:       ${reuseExistingRaw ? "NO-LIVE tail-preserving (reuse existing raw, atempo tempo-fit, NO ElevenLabs call)" : "LIVE (ElevenLabs call for patched scenes)"}`);
if (reuseExistingRaw) console.log(`[patch-v3.1] raw-dir:    ${rawDirAbs}`);
console.log();

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
if (!scenes || !Array.isArray(scenes) || scenes.length !== 6) {
  console.error("ABORT: TTS script must have exactly 6 scenes.");
  process.exit(1);
}
const sortedScenes = [...scenes].sort((a, b) => a.sceneNumber - b.sceneNumber);
mkdirSync(outDirAbs, { recursive: true });

// ── Voice candidate resolution (builder와 동일 계약) ────────────────────────────
const VOICE_CANDIDATES = {
  hojin_lim: { id: "hojin_lim", label: "Hojin Lim", envKeys: ["ELEVENLABS_HOJIN_LIM_VOICE_ID", "ELEVENLABS_VOICE_ID_HOJIN_LIM", "HOJIN_LIM_ELEVENLABS_VOICE_ID"] },
  yohan_koo: { id: "yohan_koo", label: "Yohan Koo", envKeys: ["ELEVENLABS_YOHAN_KOO_VOICE_ID", "ELEVENLABS_VOICE_ID_YOHAN_KOO", "YOHAN_KOO_ELEVENLABS_VOICE_ID"] },
  gihong: { id: "gihong", label: "Gihong", envKeys: ["ELEVENLABS_GIHONG_VOICE_ID", "ELEVENLABS_VOICE_ID_GIHONG", "GIHONG_ELEVENLABS_VOICE_ID"] },
};
function resolveVoiceCandidate(candidateId, envLocal) {
  const candidate = VOICE_CANDIDATES[candidateId];
  if (!candidate) return { resolved: false, candidateId, voiceId: null, source: "unknown_candidate", missingKeys: [] };
  for (const key of candidate.envKeys) {
    const val = resolveEnv(key, envLocal);
    if (val && val.trim().length > 0) {
      const src = process.env[key] ? "process.env" : ".env.local";
      return { resolved: true, candidateId, candidateLabel: candidate.label, voiceId: val.trim(), source: `${key} (${src})`, missingKeys: [] };
    }
  }
  const voiceLabel = resolveEnv("ELEVENLABS_VOICE_LABEL", envLocal);
  if (voiceLabel && voiceLabel.trim() === candidate.label) {
    const fallbackId = resolveEnv("ELEVENLABS_VOICE_ID", envLocal);
    if (fallbackId && fallbackId.trim().length > 0) {
      const src = process.env.ELEVENLABS_VOICE_ID ? "process.env" : ".env.local";
      return { resolved: true, candidateId, candidateLabel: candidate.label, voiceId: fallbackId.trim(), source: `ELEVENLABS_VOICE_ID via VOICE_LABEL=${candidate.label} (${src})`, missingKeys: [] };
    }
  }
  return { resolved: false, candidateId, candidateLabel: candidate.label, voiceId: null, source: "missing", missingKeys: [...candidate.envKeys] };
}

// ── Voice presets (builder와 동일) ──────────────────────────────────────────────
const VOICE_PRESETS = {
  default: { stability: 0.52, similarity_boost: 0.78, style: 0.1, use_speaker_boost: true },
  confident_v2: { stability: 0.8, similarity_boost: 0.88, style: 0.03, use_speaker_boost: true },
  confident_v3: { stability: 0.68, similarity_boost: 0.9, style: 0.22, use_speaker_boost: true },
};
const requestedPreset = voicePresetArg ?? ttsScript.voicePreset ?? "default";
const voicePresetId = VOICE_PRESETS[requestedPreset] ? requestedPreset : "default";
const voiceSettings = VOICE_PRESETS[voicePresetId];

// ── Env readiness ────────────────────────────────────────────────────────────────
console.log("[step 1/5] Checking ElevenLabs env readiness...");
console.log(`  .env.local present: ${envLocalLoaded}`);
if (voiceCandidateArg) console.log(`  --voice-candidate:  ${voiceCandidateArg}`);

const apiKey = resolveEnv("ELEVENLABS_API_KEY", envLocal);
const modelId = resolveEnv("ELEVENLABS_MODEL_ID", envLocal) ?? "eleven_multilingual_v2";

let voiceId, voiceCandidateResult = null;
if (voiceCandidateArg) {
  voiceCandidateResult = resolveVoiceCandidate(voiceCandidateArg, envLocal);
  voiceId = voiceCandidateResult.resolved ? voiceCandidateResult.voiceId : null;
} else {
  voiceId = resolveEnv("ELEVENLABS_VOICE_ID", envLocal);
}
const apiKeyConfigured = !!(apiKey && apiKey.trim().length > 0);
const voiceIdConfigured = !!(voiceId && voiceId.trim().length > 0);
const apiKeySource = process.env.ELEVENLABS_API_KEY ? "process.env" : (envLocal.ELEVENLABS_API_KEY ? ".env.local" : "missing");

console.log(`  ELEVENLABS_API_KEY configured:  ${apiKeyConfigured} (source: ${apiKeySource})`);
if (voiceCandidateResult) console.log(`  Voice candidate [${voiceCandidateArg}] resolved: ${voiceCandidateResult.resolved} (source: ${voiceCandidateResult.source})`);
console.log(`  ELEVENLABS_MODEL_ID:            ${modelId}`);
console.log(`  voicePreset: ${voicePresetId} (stability=${voiceSettings.stability}, similarity_boost=${voiceSettings.similarity_boost}, style=${voiceSettings.style}, use_speaker_boost=${voiceSettings.use_speaker_boost})`);

// no-live tail-preserving mode: ElevenLabs를 호출하지 않으므로 env readiness를 요구하지 않는다.
if (!reuseExistingRaw && (!apiKeyConfigured || !voiceIdConfigured)) {
  const readinessSummary = {
    schemaVersion: "money_shorts_elevenlabs_scene_paced_tts_summary_v1",
    provider: "elevenlabs", mode: "elevenlabs_scene_paced_patch_v3_1",
    scriptId, manifestId,
    liveApiCallPerformed: false, readinessFailure: true,
    apiKeyConfigured, voiceIdConfigured,
    qualityAccepted: false, ownerListeningRequired: true,
    generatedAt: new Date().toISOString(),
    note: "READINESS FAILURE — env not ready. No API call performed.",
  };
  const failPath = join(outDirAbs, "elevenlabs-scene-paced-tts-summary.json");
  writeFileSync(failPath, JSON.stringify(readinessSummary, null, 2), "utf-8");
  console.error(`\nREADINESS FAILURE: apiKeyConfigured=${apiKeyConfigured}, voiceIdConfigured=${voiceIdConfigured}. No API call performed.`);
  console.error(`  summary: ${failPath}`);
  process.exit(1);
}
const voiceIdMasked = voiceIdConfigured ? maskVoiceId(voiceId) : null;
if (voiceIdMasked) console.log(`\n  voiceIdMasked: ${voiceIdMasked}\n`);

// endpoint는 live 모드에서만 사용. no-live 모드에서는 fetch를 하지 않는다.
const endpoint = (!reuseExistingRaw && voiceIdConfigured)
  ? `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`
  : null;

// ── Step 2: per-scene (reuse or patch) ──────────────────────────────────────────
console.log("[step 2/5] Resolving scene audios (reuse v3 for 1/2/3/5, ElevenLabs for 4/6)...");
const sceneResults = [];

for (const scene of sortedScenes) {
  const sceneNum = scene.sceneNumber;
  const sceneNumStr = String(sceneNum).padStart(2, "0");
  const targetSceneDurationSec = scene.durationSec;
  const normalizedPath = join(outDirAbs, `scene-${sceneNumStr}-normalized.m4a`);

  if (REUSED_SCENES.includes(sceneNum)) {
    // ── reuse from v3 ──
    const srcNormalized = join(reuseDirAbs, `scene-${sceneNumStr}-normalized.m4a`);
    if (!existsSync(srcNormalized)) {
      console.error(`ABORT: reuse source missing for scene ${sceneNum}: ${srcNormalized}`);
      process.exit(1);
    }
    copyFileSync(srcNormalized, normalizedPath);
    // ffprobe to record duration
    const probe = spawnSync("ffprobe", ["-v", "quiet", "-print_format", "json", "-show_format", normalizedPath], { encoding: "utf-8", maxBuffer: 2 * 1024 * 1024, shell: false });
    let dur = targetSceneDurationSec;
    try { dur = parseFloat(JSON.parse(probe.stdout).format?.duration ?? String(targetSceneDurationSec)); } catch { /* keep */ }
    console.log(`  [scene ${sceneNumStr}] REUSED from v3 → ${normalizedPath} (${dur.toFixed(3)}s)`);
    sceneResults.push({
      sceneNumber: sceneNum, sceneRole: scene.sceneRole ?? "unknown",
      targetDurationSec: targetSceneDurationSec, source: "reused_v3",
      rawAudioDurationSec: null, normalizedDurationSec: targetSceneDurationSec,
      normalizedAudioPath: normalizedPath, status: "reused", httpStatus: null,
      sentTextCharCount: (scene.ttsText || "").trim().length, riskNotes: [],
    });
    continue;
  }

  // ── patch scene 4/6: no-live(기존 raw 재사용) 또는 live(ElevenLabs 호출) ──
  const text = (scene.ttsText || "").trim();
  if (!text) {
    console.error(`ABORT: patched scene ${sceneNum} has no ttsText.`);
    process.exit(1);
  }

  const rawAudioPath = join(outDirAbs, `scene-${sceneNumStr}-elevenlabs.mp3`);
  let httpStatus = null;
  let audioSource = null;

  if (reuseExistingRaw) {
    // ── no-live: 기존 v3.1 raw mp3를 재사용. fetch/ElevenLabs 절대 호출 안 함. ──
    const srcRaw = join(rawDirAbs, `scene-${sceneNumStr}-elevenlabs.mp3`);
    if (!existsSync(srcRaw)) {
      console.error(`ABORT: --reuse-existing-raw source missing for scene ${sceneNum}: ${srcRaw}`);
      process.exit(1);
    }
    copyFileSync(srcRaw, rawAudioPath);
    audioSource = "reused_existing_raw_no_live";
    console.log(`  [scene ${sceneNumStr}] PATCH (no-live, reuse existing raw), role: ${scene.sceneRole}, target: ${targetSceneDurationSec}s, chars: ${text.length}`);
    console.log(`    reused raw: ${srcRaw}`);
  } else {
    // ── live: ElevenLabs 호출 ──
    if (apiCallCount >= API_CALL_BUDGET_MAX) {
      console.error(`ABORT: API call budget exceeded (max ${API_CALL_BUDGET_MAX}). Stopping at scene ${sceneNum}.`);
      process.exit(1);
    }
    console.log(`  [scene ${sceneNumStr}] PATCH (ElevenLabs), role: ${scene.sceneRole}, target: ${targetSceneDurationSec}s, chars: ${text.length}`);
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
        console.error(`ABORT: ElevenLabs API returned ${httpStatus} for scene ${sceneNum}.`);
        const errText = await response.text().catch(() => "(unreadable)");
        console.error(`  Error (truncated): ${errText.slice(0, 200)}`);
        process.exit(1);
      }
      audioBuffer = Buffer.from(await response.arrayBuffer());
      console.log(`    HTTP ${httpStatus}, size: ${audioBuffer.length} bytes`);
    } catch (e) {
      console.error(`ABORT: Fetch failed for scene ${sceneNum}: ${e.message}`);
      process.exit(1);
    }
    writeFileSync(rawAudioPath, audioBuffer);
    audioSource = "patched_elevenlabs";
  }

  const probeResult = spawnSync("ffprobe", ["-v", "quiet", "-print_format", "json", "-show_format", "-show_streams", rawAudioPath], { encoding: "utf-8", maxBuffer: 2 * 1024 * 1024, shell: false });
  if ((probeResult.status ?? -1) !== 0) {
    console.error(`ABORT: ffprobe failed on scene ${sceneNum} audio`);
    process.exit(1);
  }
  let audioProbe;
  try { audioProbe = JSON.parse(probeResult.stdout); } catch (e) {
    console.error(`ABORT: Cannot parse ffprobe output for scene ${sceneNum}: ${e.message}`);
    process.exit(1);
  }
  const audioStream = (audioProbe.streams ?? []).find((s) => s.codec_type === "audio");
  if (!audioStream) {
    console.error(`ABORT: no audio stream in scene ${sceneNum} mp3.`);
    process.exit(1);
  }
  const rawAudioDurationSec = parseFloat(audioProbe.format?.duration ?? "NaN");
  if (!Number.isFinite(rawAudioDurationSec) || rawAudioDurationSec <= 0) {
    console.error(`ABORT: invalid duration for scene ${sceneNum}: ${rawAudioDurationSec}`);
    process.exit(1);
  }
  const audioCodec = audioStream.codec_name ?? "unknown";
  console.log(`    raw duration: ${rawAudioDurationSec.toFixed(3)}s, codec: ${audioCodec}`);

  const durationDeltaSec = parseFloat((rawAudioDurationSec - targetSceneDurationSec).toFixed(3));
  const overTargetRatio = rawAudioDurationSec / targetSceneDurationSec;
  // tail-preserving 임계값: 이 값 이하면 atempo로 tempo-fit, 초과하면 자동 처리 금지(ABORT).
  const ATEMPO_MAX_RATIO = 1.18;
  let normalizeStatus = "fit", normalizeArgs;
  let atempoFactor = null;
  const sceneRiskNotes = [];

  if (rawAudioDurationSec > targetSceneDurationSec + 0.05) {
    // over-target: tail cut을 막기 위해 hard trim 대신 atempo tempo-fit.
    if (overTargetRatio > ATEMPO_MAX_RATIO) {
      console.error(`ABORT: scene ${sceneNum} over-target ratio ${overTargetRatio.toFixed(3)} exceeds ATEMPO_MAX_RATIO ${ATEMPO_MAX_RATIO}. Do NOT auto-process; report for manual review.`);
      process.exit(1);
    }
    normalizeStatus = "tempo_fit";
    atempoFactor = parseFloat(overTargetRatio.toFixed(6));
    sceneRiskNotes.push(`scene ${sceneNum} tempo_fit (tail-preserving): raw ${rawAudioDurationSec.toFixed(3)}s → target ${targetSceneDurationSec}s via atempo=${atempoFactor} (no tail cut)`);
    // atempo로 속도를 올려 target에 맞춘 뒤, 미세 오차는 -t로 정리. atempo는 pitch-preserving.
    normalizeArgs = ["-y", "-i", rawAudioPath, "-filter:a", `atempo=${atempoFactor}`, "-t", String(targetSceneDurationSec), "-c:a", "aac", "-b:a", "128k", normalizedPath];
  } else if (rawAudioDurationSec < targetSceneDurationSec - 0.05) {
    normalizeStatus = "padded";
    sceneRiskNotes.push(`scene ${sceneNum} padded: raw ${rawAudioDurationSec.toFixed(3)}s → target ${targetSceneDurationSec}s`);
    normalizeArgs = ["-y", "-i", rawAudioPath, "-filter_complex", `[0:a]apad=pad_dur=${targetSceneDurationSec}[aout]`, "-map", "[aout]", "-t", String(targetSceneDurationSec), "-c:a", "aac", "-b:a", "128k", normalizedPath];
  } else {
    normalizeStatus = "fit";
    normalizeArgs = ["-y", "-i", rawAudioPath, "-t", String(targetSceneDurationSec), "-c:a", "aac", "-b:a", "128k", normalizedPath];
  }
  const normalizeResult = spawnSync("ffmpeg", normalizeArgs, { encoding: "utf-8", maxBuffer: 4 * 1024 * 1024, shell: false });
  if ((normalizeResult.status ?? -1) !== 0) {
    console.error(`ABORT: ffmpeg normalize failed for scene ${sceneNum}`);
    if (normalizeResult.stderr) console.error(normalizeResult.stderr.slice(-300));
    process.exit(1);
  }
  // normalized 실제 길이 확인
  const normProbe = spawnSync("ffprobe", ["-v", "quiet", "-print_format", "json", "-show_format", normalizedPath], { encoding: "utf-8", maxBuffer: 2 * 1024 * 1024, shell: false });
  let normalizedActualSec = targetSceneDurationSec;
  try { normalizedActualSec = parseFloat(JSON.parse(normProbe.stdout).format?.duration ?? String(targetSceneDurationSec)); } catch { /* keep */ }
  console.log(`    normalized: ${normalizeStatus}${atempoFactor ? ` (atempo=${atempoFactor})` : ""} → ${normalizedActualSec.toFixed(3)}s → ${normalizedPath}`);

  sceneResults.push({
    sceneNumber: sceneNum, sceneRole: scene.sceneRole ?? "unknown",
    targetDurationSec: targetSceneDurationSec, source: audioSource,
    sentTextCharCount: text.length,
    rawAudioDurationSec, overTargetRatio: parseFloat(overTargetRatio.toFixed(4)),
    atempoFactor, normalizedDurationSec: parseFloat(normalizedActualSec.toFixed(3)),
    audioPath: rawAudioPath, normalizedAudioPath: normalizedPath, audioCodec,
    httpStatus, status: normalizeStatus, durationDeltaSec, riskNotes: sceneRiskNotes,
  });
}

console.log(`\n  Total API calls: ${apiCallCount} / ${API_CALL_BUDGET_MAX}\n`);

// ── Step 3: concat 6 normalized audios into v3.1 timeline ───────────────────────
console.log("[step 3/5] Concatenating 6 normalized scene audios into v3.1 timeline...");
const concatListPath = join(outDirAbs, "concat-list.txt");
const concatListContent = sceneResults.map((sc) => `file '${sc.normalizedAudioPath.replace(/\\/g, "/")}'`).join("\n");
writeFileSync(concatListPath, concatListContent, "utf-8");

const timelineAudioPath = join(outDirAbs, "elevenlabs-scene-paced-timeline.m4a");
const concatResult = spawnSync("ffmpeg", ["-y", "-f", "concat", "-safe", "0", "-i", concatListPath, "-c", "copy", timelineAudioPath], { encoding: "utf-8", maxBuffer: 10 * 1024 * 1024, shell: false });
if ((concatResult.status ?? -1) !== 0) {
  console.error("ABORT: ffmpeg concat failed.");
  if (concatResult.stderr) console.error(concatResult.stderr.slice(-300));
  process.exit(1);
}

// timeline ffprobe
const timelineProbeResult = spawnSync("ffprobe", ["-v", "quiet", "-print_format", "json", "-show_format", "-show_streams", timelineAudioPath], { encoding: "utf-8", maxBuffer: 2 * 1024 * 1024, shell: false });
let timelineDurationSec = targetDurationSec, timelineAudioCodec = "aac";
try {
  const tp = JSON.parse(timelineProbeResult.stdout);
  timelineDurationSec = parseFloat(tp.format?.duration ?? String(targetDurationSec));
  timelineAudioCodec = (tp.streams ?? []).find((s) => s.codec_type === "audio")?.codec_name ?? "aac";
} catch { /* keep */ }
const timelineDurationOk = Math.abs(timelineDurationSec - targetDurationSec) <= 0.5;
console.log(`  timeline audio: ${timelineAudioPath}`);
console.log(`  timeline duration: ${timelineDurationSec.toFixed(3)}s (target: ${targetDurationSec}s, ok: ${timelineDurationOk})`);
console.log(`  timeline codec: ${timelineAudioCodec}\n`);

// ── Step 4: write summary (mux-compatible schema) ───────────────────────────────
console.log("[step 4/5] Writing summary...");
const riskNotes = [...(ttsScript.riskNotes ?? [])];
if (!timelineDurationOk) riskNotes.push(`timeline duration ${timelineDurationSec.toFixed(3)}s outside ±0.5s of target ${targetDurationSec}s`);
if (reuseExistingRaw) {
  riskNotes.push("no-live tail-preserving run: no ElevenLabs API call this run (apiCallCountThisRun=0). Scene 4/6 raw audio reused from prior v3.1 live output; over-target scenes tempo-fitted via atempo (no tail cut).");
}

const summary = {
  schemaVersion: "money_shorts_elevenlabs_scene_paced_tts_summary_v1",
  provider: "elevenlabs",
  mode: reuseExistingRaw ? "elevenlabs_scene_paced_patch_v3_1_tailfit_no_live" : "elevenlabs_scene_paced_patch_v3_1",
  scriptId, manifestId,
  patchInfo: { reusedScenes: REUSED_SCENES, patchedScenes: PATCHED_SCENES, reuseDir: reuseDirAbs, apiCallBudgetMax: API_CALL_BUDGET_MAX, rawDir: rawDirAbs ?? null, tailPreservingTempoFit: reuseExistingRaw },
  // audio provenance: Scene 4/6 raw는 prior v3.1 live ElevenLabs 생성물. no-live run은 그 raw를 재사용하므로 provenance는 live.
  liveApiCallPerformed: true,
  // 이번 run의 실제 ElevenLabs 호출 수 (no-live면 0). readiness/placeholder 여부와 구분되는 정직한 기록.
  apiCallCountThisRun: apiCallCount,
  noLiveTailPreservingRun: reuseExistingRaw,
  readinessFailure: false,
  apiCallCount,
  apiCallBudgetMax: API_CALL_BUDGET_MAX,
  sceneCount: sceneResults.length,
  voiceCandidateResolved: voiceCandidateResult ? voiceCandidateResult.resolved : null,
  voiceCandidateSource: voiceCandidateResult?.source ?? null,
  voiceCandidateId: voiceCandidateResult?.candidateId ?? null,
  voiceCandidateLabel: voiceCandidateResult?.candidateLabel ?? null,
  voicePresetId,
  voiceSettingsSanitized: { ...voiceSettings },
  voiceIdMasked,
  modelId,
  apiKeyConfigured: true,
  voiceIdConfigured: true,
  timelineAudioPath,
  timelineDurationSec,
  timelineAudioCodec,
  targetDurationSec,
  qualityAccepted: false,
  ownerListeningRequired: true,
  generatedAt: new Date().toISOString(),
  scenes: sceneResults,
  riskNotes,
};
const summaryPath = join(outDirAbs, "elevenlabs-scene-paced-tts-summary.json");
writeFileSync(summaryPath, JSON.stringify(summary, null, 2), "utf-8");
console.log(`  summary: ${summaryPath}\n`);

console.log(`[step 5/5] v3.1 patch TTS build complete.${reuseExistingRaw ? " (NO-LIVE tail-preserving)" : ""}`);
console.log(`  apiCallCount (this run): ${apiCallCount} / ${API_CALL_BUDGET_MAX}${reuseExistingRaw ? "  (no-live: ElevenLabs NOT called)" : ""}`);
console.log(`  reused scenes:     ${REUSED_SCENES.join(", ")}`);
console.log(`  patched scenes:    ${PATCHED_SCENES.join(", ")}${reuseExistingRaw ? " (raw reused, atempo tempo-fit)" : ""}`);
console.log(`  timelineAudio:     ${timelineAudioPath}`);
console.log(`  timelineDuration:  ${timelineDurationSec.toFixed(3)}s`);
console.log(`  qualityAccepted:   false — Owner listening review required`);
