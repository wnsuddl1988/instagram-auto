/**
 * _lh10-elevenlabs-tts.mjs
 * LH-10 ElevenLabs TTS 샘플 생성
 *
 * - ElevenLabs TTS 1회 호출 (단일 합산 narration)
 * - 플래그 임시 활성화 → 호출 → 즉시 원복
 * - 결제/quota 오류 시 즉시 중단 + 보고
 * - OpenAI / Imagen / Pexels / Pixabay / Perplexity 호출 금지
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
const ELEVENLABS_VOICE_ID = envMap.get("ELEVENLABS_VOICE_ID") || "EXAVITQu4vr4xnSDxMaL"; // Sarah (기본값)

if (!ELEVENLABS_API_KEY) {
  console.error("ELEVENLABS_API_KEY=missing — 중단");
  process.exit(1);
}
console.log("ELEVENLABS_API_KEY=present ✅");
console.log(`voiceId: ${ELEVENLABS_VOICE_ID} (env 미설정 시 기본값 Sarah)`);

// ── 경로 설정 ─────────────────────────────────────────────────────────────
const RENDER_PLAN_PATH = join(ROOT, "output/v2/paid_qa/lh10_silent_render/render_plan.json");
const OUT_DIR = join(ROOT, "output/v2/lh10_elevenlabs_tts_test");
mkdirSync(OUT_DIR, { recursive: true });

const NARRATION_PATH = join(OUT_DIR, "narration.mp3");
const OUTPUT_VIDEO_PATH = join(OUT_DIR, "lh10_elevenlabs_tts_test.mp4");
const PLAN_OUT_PATH = join(OUT_DIR, "plan.json");
const SUMMARY_PATH = join(ROOT, "output/v2/paid_qa/lh10_elevenlabs_tts_test_summary.json");

// ── render plan 로드 ───────────────────────────────────────────────────────
const plan = JSON.parse(readFileSync(RENDER_PLAN_PATH, "utf8"));
const allNarration = plan.scenes.map((s) => s.narration ?? "").join(" ");
const narrationChars = allNarration.replace(/\s/g, "").length;
console.log(`\nnarartion 합산: ${allNarration.length}자 (공백 포함) / ${narrationChars}자 (공백 제외)`);

// ── 결과 추적 ─────────────────────────────────────────────────────────────
let quotaOrPaymentBlocked = false;
let actualTtsCallCount = 0;
let ttsError = null;

// ── 플래그 원복 함수 ──────────────────────────────────────────────────────
function resetFlags() {
  setEnvFlag("PAID_API_ENABLED", "false");
  setEnvFlag("ALLOW_ELEVENLABS", "false");
  console.log("플래그 원복: PAID_API_ENABLED=false, ALLOW_ELEVENLABS=false ✅");
}

// ── ElevenLabs TTS 호출 ───────────────────────────────────────────────────
console.log("\n[1/4] 플래그 임시 활성화...");
setEnvFlag("PAID_API_ENABLED", "true");
setEnvFlag("ALLOW_ELEVENLABS", "true");

try {
  console.log("[2/4] ElevenLabs TTS 호출 (eleven_multilingual_v2, 1회)...");
  actualTtsCallCount = 1;

  const ttsPayload = {
    text: allNarration,
    model_id: "eleven_multilingual_v2",
    voice_settings: {
      stability: 0.45,
      similarity_boost: 0.68,
      style: 0.18,
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

  // 결제/quota 오류 즉시 중단
  if (response.status === 402 || response.status === 429) {
    quotaOrPaymentBlocked = true;
    const errText = await response.text().catch(() => "(응답 파싱 실패)");
    ttsError = `HTTP ${response.status} — quota/payment 차단`;
    console.error(`\n⛔ ElevenLabs 차단: ${ttsError}`);
    console.error("응답 요약 (값 비공개):", response.status, response.statusText);
    resetFlags();

    writeFileSync(SUMMARY_PATH, JSON.stringify({
      generatedAt: new Date().toISOString(),
      outputVideoPath: null,
      narrationPath: null,
      planPath: RENDER_PLAN_PATH,
      provider: "elevenlabs",
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
  console.log(`[2/4] narration.mp3 저장: ${NARRATION_PATH} (${(audioBuffer.length / 1024).toFixed(1)} KB)`);

} catch (err) {
  resetFlags();
  ttsError = err.message;
  console.error("ElevenLabs 호출 실패:", ttsError);

  writeFileSync(SUMMARY_PATH, JSON.stringify({
    generatedAt: new Date().toISOString(),
    outputVideoPath: null,
    narrationPath: null,
    planPath: RENDER_PLAN_PATH,
    provider: "elevenlabs",
    actualTtsCallCount,
    quotaOrPaymentBlocked,
    ttsError,
    forbiddenApisCalled: false,
    flagsRestoredFalse: true,
    expectedNextStep: quotaOrPaymentBlocked ? "payment_discussion_required" : "retry_or_fallback",
  }, null, 2), "utf8");

  console.log("summary 저장:", SUMMARY_PATH);
  process.exit(1);
}

// ── 플래그 즉시 원복 ──────────────────────────────────────────────────────
resetFlags();

// ── render plan 수정 (narrationPath 주입) ────────────────────────────────
console.log("\n[3/4] render plan에 narrationPath 주입...");
const renderPlan = JSON.parse(readFileSync(RENDER_PLAN_PATH, "utf8"));
renderPlan.narrationPath = NARRATION_PATH;
renderPlan._renderMeta = {
  ...renderPlan._renderMeta,
  narrationPath: NARRATION_PATH,
  ttsProvider: "elevenlabs",
  voiceId: ELEVENLABS_VOICE_ID,
  silentRender: false,
  renderedAt: new Date().toISOString().slice(0, 10),
};
writeFileSync(PLAN_OUT_PATH, JSON.stringify(renderPlan, null, 2), "utf8");
console.log("plan.json 저장:", PLAN_OUT_PATH);

// ── python render_v2.py 실행 ─────────────────────────────────────────────
console.log("\n[4/4] python render_v2.py 실행...");
try {
  execSync(
    `python python/render_v2.py "${PLAN_OUT_PATH}" "${OUTPUT_VIDEO_PATH}"`,
    { cwd: ROOT, stdio: "inherit" }
  );
  console.log("렌더 완료:", OUTPUT_VIDEO_PATH);
} catch (err) {
  console.error("렌더 실패:", err.message);
  process.exit(1);
}

// ── ffprobe 메타 수집 ─────────────────────────────────────────────────────
let ffprobeMeta = null;
let audioVideoGapSec = null;
try {
  const ffprobeOut = execSync(
    `ffprobe -v quiet -print_format json -show_streams -show_format "${OUTPUT_VIDEO_PATH}"`,
    { cwd: ROOT }
  ).toString();
  const meta = JSON.parse(ffprobeOut);
  const fmt = meta.format;
  const videoStream = meta.streams.find((s) => s.codec_type === "video");
  const audioStream = meta.streams.find((s) => s.codec_type === "audio");

  ffprobeMeta = {
    resolution: videoStream ? `${videoStream.width}x${videoStream.height}` : null,
    videoDurationSec: videoStream ? parseFloat(videoStream.duration ?? fmt.duration) : null,
    audioDurationSec: audioStream ? parseFloat(audioStream.duration ?? "0") : null,
    audioCodec: audioStream?.codec_name ?? null,
    fileSizeMB: fmt.size ? (parseInt(fmt.size) / 1024 / 1024).toFixed(2) : null,
    streamCount: meta.streams.length,
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
  console.log("파일 크기:", ffprobeMeta.fileSizeMB + "MB");
  console.log("audio/video gap:", audioVideoGapSec + "s");
} catch (err) {
  console.warn("ffprobe 실패:", err.message);
}

// ── summary 저장 ─────────────────────────────────────────────────────────
const summary = {
  generatedAt: new Date().toISOString(),
  outputVideoPath: OUTPUT_VIDEO_PATH,
  narrationPath: NARRATION_PATH,
  planPath: PLAN_OUT_PATH,
  metadata: ffprobeMeta,
  narrationChars,
  provider: "elevenlabs",
  voiceId: ELEVENLABS_VOICE_ID,
  model: "eleven_multilingual_v2",
  actualTtsCallCount,
  quotaOrPaymentBlocked: false,
  ttsError: null,
  forbiddenApisCalled: false,
  flagsRestoredFalse: true,
  audioVideoGapSec,
  expectedNextStep: [
    "elevenlabs_quality_qa",
    audioVideoGapSec && audioVideoGapSec > 1 ? "tail_trim_required" : "tail_trim_check",
  ],
};

writeFileSync(SUMMARY_PATH, JSON.stringify(summary, null, 2), "utf8");
console.log("\nsummary 저장:", SUMMARY_PATH);
console.log("\n✅ LH-10 ElevenLabs TTS 샘플 생성 완료");
