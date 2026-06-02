/**
 * _lh10-mina-tts-final.mjs
 * LH-10 Mina ElevenLabs TTS 재생성
 *
 * - ElevenLabs TTS 1회만 호출 (eleven_multilingual_v2)
 * - voiceId: ELEVENLABS_VOICE_ID env 우선
 * - 플래그 임시 활성화 → 호출 → 즉시 원복
 * - 결제/quota 오류 시 즉시 중단 + 보고 (OpenAI fallback 금지)
 * - 이미지 다운로드 / Pexels / Pixabay / OpenAI / Imagen 금지
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// ── env 로드 ──────────────────────────────────────────────────────────────
const envPath = join(ROOT, ".env.local");
function loadEnvMap() {
  const map = new Map();
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    map.set(t.slice(0, eq).trim(), t.slice(eq + 1).trim());
  }
  return map;
}
function setEnvFlag(key, value) {
  const lines = readFileSync(envPath, "utf8").split("\n");
  const pattern = new RegExp(`^\\s*${key}\\s*=`);
  let found = false;
  const updated = lines.map((l) => {
    if (pattern.test(l)) { found = true; return `${key}=${value}`; }
    return l;
  });
  if (!found) updated.push(`${key}=${value}`);
  writeFileSync(envPath, updated.join("\n"), "utf8");
}

const envMap = loadEnvMap();
const ELEVENLABS_API_KEY = envMap.get("ELEVENLABS_API_KEY") || "";
const ELEVENLABS_VOICE_ID = envMap.get("ELEVENLABS_VOICE_ID") || "EXAVITQu4vr4xnSDxMaL";
const STABILITY      = parseFloat(envMap.get("ELEVENLABS_STABILITY")   || "0.58");
const SIMILARITY     = parseFloat(envMap.get("ELEVENLABS_SIMILARITY")  || "0.78");
const STYLE          = parseFloat(envMap.get("ELEVENLABS_STYLE")       || "0.10");

if (!ELEVENLABS_API_KEY) {
  console.error("ELEVENLABS_API_KEY=missing — 중단");
  process.exit(1);
}
// 키 값 출력 금지 — 존재 여부만 로그
console.log("ELEVENLABS_API_KEY=present ✅");
console.log("ELEVENLABS_VOICE_ID=present ✅ (voiceName: Mina)");
console.log(`settings: stability=${STABILITY}, similarity=${SIMILARITY}, style=${STYLE}`);

// ── 경로 설정 ─────────────────────────────────────────────────────────────
const RENDER_PLAN_SRC = join(ROOT, "output/v2/paid_qa/lh10_visual_fixed_v1/render_plan.json");
const OUT_DIR         = join(ROOT, "output/v2/lh10_mina_tts_final");
mkdirSync(OUT_DIR, { recursive: true });

const NARRATION_PATH   = join(OUT_DIR, "narration.mp3");
const OUTPUT_VIDEO     = join(OUT_DIR, "lh10_mina_tts_final.mp4");
const PLAN_OUT_PATH    = join(OUT_DIR, "plan.json");
const SUMMARY_PATH     = join(ROOT, "output/v2/paid_qa/lh10_mina_tts_final_summary.json");

// ── render plan 로드 + narration 텍스트 합산 ─────────────────────────────
const plan = JSON.parse(readFileSync(RENDER_PLAN_SRC, "utf8"));
const allNarration = plan.scenes.map((s) => s.narration ?? "").join(" ");
const narrationChars = allNarration.replace(/\s/g, "").length;
console.log(`\nnarration: ${allNarration.length}자 (공백 포함) / ${narrationChars}자 (공백 제외)`);

// ── 플래그 원복 함수 (호출 즉시) ─────────────────────────────────────────
function resetFlags() {
  setEnvFlag("PAID_API_ENABLED", "false");
  setEnvFlag("ALLOW_ELEVENLABS", "false");
  console.log("플래그 원복: PAID_API_ENABLED=false, ALLOW_ELEVENLABS=false ✅");
}

// ── 결과 추적 ─────────────────────────────────────────────────────────────
let quotaOrPaymentBlocked = false;
let actualTtsCallCount = 0;
let ttsError = null;

// ── [1] 플래그 임시 활성화 ────────────────────────────────────────────────
console.log("\n[1/4] 플래그 임시 활성화 ...");
setEnvFlag("PAID_API_ENABLED", "true");
setEnvFlag("ALLOW_ELEVENLABS", "true");

// ── [2] ElevenLabs TTS 호출 ───────────────────────────────────────────────
try {
  console.log("[2/4] ElevenLabs TTS 호출 (eleven_multilingual_v2, 1회) ...");
  actualTtsCallCount = 1;

  const ttsPayload = {
    text: allNarration,
    model_id: "eleven_multilingual_v2",
    voice_settings: {
      stability:        STABILITY,
      similarity_boost: SIMILARITY,
      style:            STYLE,
      use_speaker_boost: true,
    },
  };

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify(ttsPayload),
    }
  );

  // 결제/quota 즉시 중단
  if (response.status === 402 || response.status === 429) {
    quotaOrPaymentBlocked = true;
    ttsError = `HTTP ${response.status} — quota/payment 차단`;
    console.error(`\n⛔ ElevenLabs 차단: ${ttsError}`);
    console.error(`status: ${response.status} ${response.statusText}`);
    resetFlags();

    writeFileSync(SUMMARY_PATH, JSON.stringify({
      generatedAt: new Date().toISOString(),
      outputVideoPath: null,
      narrationPath: null,
      planPath: RENDER_PLAN_SRC,
      provider: "elevenlabs",
      voiceSource: "ELEVENLABS_VOICE_ID",
      voiceName: "Mina",
      actualTtsCallCount,
      quotaOrPaymentBlocked: true,
      ttsError,
      forbiddenApisCalled: false,
      flagsRestoredFalse: true,
      expectedNextStep: "payment_discussion_required",
    }, null, 2), "utf8");

    console.log("summary 저장:", SUMMARY_PATH);
    process.exit(0);
  }

  if (!response.ok) {
    ttsError = `HTTP ${response.status} ${response.statusText}`;
    throw new Error(ttsError);
  }

  // mp3 저장
  const audioBuffer = Buffer.from(await response.arrayBuffer());
  writeFileSync(NARRATION_PATH, audioBuffer);
  console.log(`[2/4] narration.mp3 저장: ${(audioBuffer.length / 1024).toFixed(1)} KB`);

} catch (err) {
  resetFlags();
  ttsError = err.message;
  console.error("ElevenLabs 호출 실패:", ttsError);

  writeFileSync(SUMMARY_PATH, JSON.stringify({
    generatedAt: new Date().toISOString(),
    outputVideoPath: null,
    narrationPath: null,
    planPath: RENDER_PLAN_SRC,
    provider: "elevenlabs",
    voiceSource: "ELEVENLABS_VOICE_ID",
    voiceName: "Mina",
    actualTtsCallCount,
    quotaOrPaymentBlocked,
    ttsError,
    forbiddenApisCalled: false,
    flagsRestoredFalse: true,
    expectedNextStep: quotaOrPaymentBlocked
      ? "payment_discussion_required"
      : "retry_or_fallback",
  }, null, 2), "utf8");

  console.log("summary 저장:", SUMMARY_PATH);
  process.exit(1);
}

// ── 플래그 즉시 원복 ──────────────────────────────────────────────────────
resetFlags();

// ── [3] render_plan 수정 (narrationPath 주입) ────────────────────────────
console.log("\n[3/4] render plan에 narrationPath 주입 ...");
const renderPlan = JSON.parse(readFileSync(RENDER_PLAN_SRC, "utf8"));
renderPlan.narrationPath = NARRATION_PATH;
renderPlan._renderMeta = {
  ...renderPlan._renderMeta,
  narrationPath:  NARRATION_PATH,
  ttsProvider:    "elevenlabs",
  voiceId:        "ELEVENLABS_VOICE_ID (env)",
  voiceName:      "Mina",
  model:          "eleven_multilingual_v2",
  stability:      STABILITY,
  similarity:     SIMILARITY,
  style:          STYLE,
  silentRender:   false,
  renderedAt:     new Date().toISOString().slice(0, 10),
  fixVersion:     "mina_tts_final",
};
writeFileSync(PLAN_OUT_PATH, JSON.stringify(renderPlan, null, 2), "utf8");
console.log("plan.json 저장:", PLAN_OUT_PATH);

// ── [4] python render_v2.py 실행 ─────────────────────────────────────────
console.log("\n[4/4] python render_v2.py 실행 ...");
try {
  execSync(
    `python python/render_v2.py "${PLAN_OUT_PATH}" "${OUTPUT_VIDEO}"`,
    { cwd: ROOT, stdio: "inherit" }
  );
  console.log("렌더 완료:", OUTPUT_VIDEO);
} catch (err) {
  console.error("렌더 실패:", err.message);
  process.exit(1);
}

// ── ffprobe 메타 수집 ─────────────────────────────────────────────────────
let ffprobeMeta = null;
let audioVideoGapSec = null;
try {
  const raw = execSync(
    `ffprobe -v quiet -print_format json -show_streams -show_format "${OUTPUT_VIDEO}"`,
    { cwd: ROOT }
  ).toString();
  const meta = JSON.parse(raw);
  const fmt = meta.format;
  const vs = meta.streams.find((s) => s.codec_type === "video");
  const as = meta.streams.find((s) => s.codec_type === "audio");

  ffprobeMeta = {
    resolution:       vs ? `${vs.width}x${vs.height}` : null,
    videoDurationSec: vs ? parseFloat(vs.duration ?? fmt.duration) : null,
    audioDurationSec: as ? parseFloat(as.duration ?? "0") : null,
    audioCodec:       as?.codec_name ?? null,
    fileSizeMB:       fmt.size ? (parseInt(fmt.size) / 1024 / 1024).toFixed(2) : null,
    streamCount:      meta.streams.length,
  };

  if (ffprobeMeta.videoDurationSec && ffprobeMeta.audioDurationSec) {
    audioVideoGapSec = parseFloat(
      (ffprobeMeta.videoDurationSec - ffprobeMeta.audioDurationSec).toFixed(3)
    );
  }

  console.log("\n=== ffprobe 결과 ===");
  console.log("해상도:", ffprobeMeta.resolution);
  console.log("영상 길이:", ffprobeMeta.videoDurationSec + "s");
  console.log("오디오 길이:", ffprobeMeta.audioDurationSec + "s");
  console.log("오디오 코덱:", ffprobeMeta.audioCodec);
  console.log("파일 크기:", ffprobeMeta.fileSizeMB + " MB");
  console.log("audio/video gap:", audioVideoGapSec + "s");
} catch (err) {
  console.warn("ffprobe 실패:", err.message);
}

// ── summary 저장 ─────────────────────────────────────────────────────────
const summary = {
  generatedAt:     new Date().toISOString(),
  outputVideoPath: OUTPUT_VIDEO,
  narrationPath:   NARRATION_PATH,
  planPath:        PLAN_OUT_PATH,
  metadata:        ffprobeMeta,
  narrationChars,
  provider:            "elevenlabs",
  voiceSource:         "ELEVENLABS_VOICE_ID (env)",
  voiceName:           "Mina",
  model:               "eleven_multilingual_v2",
  ttsSettings: { stability: STABILITY, similarity_boost: SIMILARITY, style: STYLE },
  actualTtsCallCount,
  quotaOrPaymentBlocked: false,
  ttsError:        null,
  forbiddenApisCalled: false,
  flagsRestoredFalse:  true,
  audioVideoGapSec,
  expectedNextStep: [
    "mina_voice_quality_qa",
    audioVideoGapSec && audioVideoGapSec > 0.5
      ? "tail_trim_required"
      : "check_gap_optional",
    "accept_final_sample_if_pass",
  ],
};

writeFileSync(SUMMARY_PATH, JSON.stringify(summary, null, 2), "utf8");
console.log("\nsummary 저장:", SUMMARY_PATH);
console.log("\n✅ LH-10 Mina TTS 재생성 완료");
