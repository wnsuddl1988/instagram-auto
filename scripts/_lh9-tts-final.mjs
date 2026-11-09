/**
 * _lh9-tts-final.mjs
 * LH-9 TTS 최종본 생성 스크립트
 *
 * - OpenAI TTS (gpt-4o-mini-tts, nova, speed 0.92) 1회 호출
 * - render_plan.json narration 전체 합쳐서 narration.mp3 생성
 * - render_v2.py로 유음 영상 렌더
 * - PAID_API_ENABLED / ALLOW_OPENAI_TTS 플래그 자동 관리
 *
 * 실행 조건:
 *   - .env.local에 PAID_API_ENABLED=true, ALLOW_OPENAI_TTS=true 가 설정된 상태에서 실행
 *   - 스크립트 완료 후 호출자가 플래그를 false로 원복해야 함
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// ── 환경변수 로드 ──────────────────────────────────────────────────────────────
function loadEnv(fp) {
  if (!existsSync(fp)) return;
  for (const line of readFileSync(fp, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    const k = t.slice(0, eq).trim();
    const v = t.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[k]) process.env[k] = v;
  }
}
loadEnv(join(ROOT, ".env.local"));

// ── 가드: 유료 API 플래그 확인 ───────────────────────────────────────────────
console.log("=== LH-9 TTS 최종본 생성 ===\n");

const PAID_ENABLED = process.env.PAID_API_ENABLED === "true";
const TTS_ALLOWED = process.env.ALLOW_OPENAI_TTS === "true";

if (!PAID_ENABLED) {
  console.error("⛔ PAID_API_ENABLED=false — 유료 TTS 차단됨.");
  console.error("   .env.local에서 PAID_API_ENABLED=true, ALLOW_OPENAI_TTS=true로 변경 후 재실행.");
  process.exit(1);
}
if (!TTS_ALLOWED) {
  console.error("⛔ ALLOW_OPENAI_TTS=false — TTS 차단됨.");
  console.error("   .env.local에서 ALLOW_OPENAI_TTS=true로 변경 후 재실행.");
  process.exit(1);
}

// 금지 API 플래그 확인
if (process.env.ALLOW_OPENAI_GENERATE === "true") {
  console.error("⛔ ALLOW_OPENAI_GENERATE=true — OpenAI generate는 이번 태스크에서 금지.");
  process.exit(1);
}
if (process.env.ALLOW_IMAGEN === "true") {
  console.error("⛔ ALLOW_IMAGEN=true — Imagen은 이번 태스크에서 금지.");
  process.exit(1);
}
if (process.env.ALLOW_ELEVENLABS === "true") {
  console.error("⛔ ALLOW_ELEVENLABS=true — ElevenLabs는 이번 태스크에서 금지.");
  process.exit(1);
}

const OPENAI_KEY = process.env.OPENAI_API_KEY || "";
if (!OPENAI_KEY) {
  console.error("⛔ OPENAI_API_KEY 없음");
  process.exit(1);
}
console.log("✅ PAID_API_ENABLED=true, ALLOW_OPENAI_TTS=true 확인");
console.log("✅ OPENAI_API_KEY 존재\n");

// ── 경로 설정 ───────────────────────────────────────────────────────────────
const PLAN_PATH = join(ROOT, "output/v2/paid_qa/lh9_hook_visual_fixed_v2/render_plan.json");
const OUT_DIR   = join(ROOT, "output/v2/lh9_tts_final");
const NAR_PATH  = join(OUT_DIR, "narration.mp3");
const PLAN_OUT  = join(OUT_DIR, "plan.json");
const VIDEO_OUT = join(OUT_DIR, "lh9_tts_final.mp4");
const SUMMARY_PATH = join(ROOT, "output/v2/paid_qa/lh9_tts_final_summary.json");

if (!existsSync(PLAN_PATH)) {
  console.error(`⛔ render_plan.json 없음: ${PLAN_PATH}`);
  process.exit(1);
}

if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

// ── render_plan 로드 ─────────────────────────────────────────────────────────
const plan = JSON.parse(readFileSync(PLAN_PATH, "utf8"));
const scenes = plan.scenes || [];

if (scenes.length === 0) {
  console.error("⛔ scenes 없음");
  process.exit(1);
}

// ── narration 텍스트 합성 ────────────────────────────────────────────────────
// living_tips: 쉼표로 구분 (emotional_story는 "... "으로 구분)
const scriptSeparator = ", ";
const narrationText = scenes
  .map((s) => (s.narration || "").trim())
  .filter(Boolean)
  .join(scriptSeparator);

console.log("=== Narration Text ===");
console.log(narrationText);
console.log(`\n글자 수: ${narrationText.length}자\n`);

// ── TTS 설정 ─────────────────────────────────────────────────────────────────
const TTS_MODEL = "gpt-4o-mini-tts";
const TTS_VOICE = "nova";
const TTS_SPEED = 0.92;

console.log(`TTS 모델: ${TTS_MODEL}`);
console.log(`음성: ${TTS_VOICE}, 속도: ${TTS_SPEED}`);
console.log("TTS 호출 중...\n");

// ── OpenAI TTS API 호출 ──────────────────────────────────────────────────────
const ttsResponse = await fetch("https://api.openai.com/v1/audio/speech", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${OPENAI_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: TTS_MODEL,
    input: narrationText,
    voice: TTS_VOICE,
    speed: TTS_SPEED,
  }),
});

if (!ttsResponse.ok) {
  const errText = await ttsResponse.text();
  console.error(`⛔ OpenAI TTS 실패: HTTP ${ttsResponse.status}`);
  console.error(errText);
  process.exit(1);
}

const audioBuffer = Buffer.from(await ttsResponse.arrayBuffer());
writeFileSync(NAR_PATH, audioBuffer);
const narSizeKB = (audioBuffer.length / 1024).toFixed(1);
console.log(`✅ narration.mp3 저장 완료: ${narSizeKB}KB`);
console.log(`   경로: ${NAR_PATH}\n`);

// ── plan.json 생성 (narrationPath 주입) ──────────────────────────────────────
const renderedPlan = {
  ...plan,
  narrationPath: NAR_PATH,
  _renderMeta: {
    ...(plan._renderMeta || {}),
    narrationPath: NAR_PATH,
    silentRender: false,
    ttsProvider: "openai",
    ttsModel: TTS_MODEL,
    ttsVoice: TTS_VOICE,
    ttsSpeed: TTS_SPEED,
    renderedAt: new Date().toISOString().slice(0, 10),
  },
};
writeFileSync(PLAN_OUT, JSON.stringify(renderedPlan, null, 2), "utf8");
console.log(`✅ plan.json 저장: ${PLAN_OUT}\n`);

// ── render_v2.py 실행 ────────────────────────────────────────────────────────
console.log("=== render_v2.py 실행 ===");
const pythonCmd = "python";
const scriptPath = join(ROOT, "python", "render_v2.py");

console.log(`python "${scriptPath}" "${PLAN_OUT}" "${VIDEO_OUT}"`);
console.log("렌더 중... (약 30~120초 소요)\n");

try {
  const result = execSync(
    `"${pythonCmd}" "${scriptPath}" "${PLAN_OUT}" "${VIDEO_OUT}"`,
    {
      cwd: ROOT,
      timeout: 300_000,
      encoding: "utf8",
    }
  );
  console.log(result);
} catch (e) {
  console.error("⛔ render_v2.py 실패:");
  console.error(e.stdout || "");
  console.error(e.stderr || "");
  process.exit(1);
}

if (!existsSync(VIDEO_OUT)) {
  console.error(`⛔ 출력 영상 없음: ${VIDEO_OUT}`);
  process.exit(1);
}

console.log(`✅ 영상 렌더 완료: ${VIDEO_OUT}\n`);

// ── ffprobe 검증 ─────────────────────────────────────────────────────────────
console.log("=== ffprobe 검증 ===");

function ffprobe(args) {
  try {
    return execSync(`ffprobe ${args}`, { encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] });
  } catch (e) {
    return (e.stdout || "") + (e.stderr || "");
  }
}

const probeJson = ffprobe(
  `-v quiet -print_format json -show_streams -show_format "${VIDEO_OUT}"`
);
let probeData = {};
try { probeData = JSON.parse(probeJson); } catch {}

const streams = probeData.streams || [];
const format  = probeData.format  || {};

const videoStream = streams.find((s) => s.codec_type === "video") || {};
const audioStream = streams.find((s) => s.codec_type === "audio") || {};

const videoW        = videoStream.width  || 0;
const videoH        = videoStream.height || 0;
const videoDuration = parseFloat(videoStream.duration || format.duration || "0");
const videoCodec    = videoStream.codec_name || "unknown";
const audioCodec    = audioStream.codec_name || "없음";
const audioDuration = parseFloat(audioStream.duration || "0");
const fileSizeMB    = parseFloat(((parseInt(format.size || "0") / 1024) / 1024).toFixed(2));

const syncDiff = Math.abs(videoDuration - audioDuration);

console.log(`  해상도:       ${videoW}x${videoH}`);
console.log(`  영상 길이:    ${videoDuration.toFixed(2)}s`);
console.log(`  영상 코덱:    ${videoCodec}`);
console.log(`  오디오 코덱:  ${audioCodec}`);
console.log(`  오디오 길이:  ${audioDuration.toFixed(2)}s`);
console.log(`  싱크 차이:    ${syncDiff.toFixed(2)}s`);
console.log(`  파일 크기:    ${fileSizeMB}MB`);
console.log(`  오디오 존재:  ${audioCodec !== "없음" ? "✅" : "❌"}`);

const syncOk = syncDiff < 3.0; // 3초 이내
console.log(`  싱크 상태:    ${syncOk ? "✅ OK" : "⚠️ 차이 큼"}`);

// narration.mp3 길이 확인
const narProbeJson = ffprobe(
  `-v quiet -print_format json -show_format "${NAR_PATH}"`
);
let narProbeData = {};
try { narProbeData = JSON.parse(narProbeJson); } catch {}
const narDuration = parseFloat(narProbeData.format?.duration || "0");
const narSizeMBCalc = parseFloat(((parseInt(narProbeData.format?.size || "0") / 1024) / 1024).toFixed(2));
console.log(`\n  narration.mp3 길이: ${narDuration.toFixed(2)}s`);
console.log(`  narration.mp3 크기: ${narSizeMBCalc}MB`);

// ── summary 저장 ──────────────────────────────────────────────────────────────
const summary = {
  qaId: "QA-LH-9-tts-final",
  createdAt: new Date().toISOString(),
  outputVideoPath: VIDEO_OUT,
  narrationPath: NAR_PATH,
  planPath: PLAN_OUT,
  metadata: {
    resolution: `${videoW}x${videoH}`,
    videoDurationSec: +videoDuration.toFixed(2),
    videoCodec,
    audioCodec,
    audioDurationSec: +audioDuration.toFixed(2),
    syncDiffSec: +syncDiff.toFixed(2),
    syncOk,
    fileSizeMB,
    narrationDurationSec: +narDuration.toFixed(2),
    narrationSizeMB: narSizeMBCalc,
  },
  ttsSettings: {
    provider: "openai",
    model: TTS_MODEL,
    voice: TTS_VOICE,
    speed: TTS_SPEED,
    narrationText,
    charCount: narrationText.length,
  },
  estimatedCost: {
    model: TTS_MODEL,
    charCount: narrationText.length,
    estimatedUSD: +(narrationText.length * 0.000015).toFixed(5),
    note: "gpt-4o-mini-tts: $15/1M chars",
  },
  paidApiUsed: "openai_tts_only",
  forbiddenApisCalled: false,
  flagsRestoredFalse: false, // 스크립트 내에서 원복하지 않음 — 호출 직후 원복 필요
  basedOnPlan: "output/v2/paid_qa/lh9_hook_visual_fixed_v2/render_plan.json",
  basedOnSilent: "output/v2/paid_qa/lh9_hook_visual_fixed_v2/lh9_silent_hook_visual_fixed_v2.mp4",
  previousQA: "QA-LH-9-hook-visual-v2 — accept_silent_sample, blocking: 0",
};

writeFileSync(SUMMARY_PATH, JSON.stringify(summary, null, 2), "utf8");
console.log(`\n✅ summary 저장: ${SUMMARY_PATH}`);

console.log("\n=== 완료 ===");
console.log("⚠️  중요: 호출 즉시 .env.local 원복 필요:");
console.log("   PAID_API_ENABLED=false");
console.log("   ALLOW_OPENAI_TTS=false");
