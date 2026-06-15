/**
 * _upload002-tts-generate.mjs
 * upload_002_copier — ElevenLabs TTS 생성 (정확히 2회)
 *
 * [호출 계약]
 * - Jun / Hyun (70DeQK5Ztp7WmEGGysLT) 1회
 * - Boss / Theo (CxErO97xpQgQXYmapDKX) 1회
 * - 자동 재생성 금지, 2회 초과 금지
 * - final mux 금지 (TTS raw 생성 + duration 측정까지만)
 *
 * [실행]
 * node scripts/env-safe.mjs run-with-env scripts/_upload002-tts-generate.mjs
 */

import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { createHash } from "crypto";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";

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

const envMap = loadEnvMap();
const ELEVENLABS_API_KEY = envMap.get("ELEVENLABS_API_KEY") || "";

if (!ELEVENLABS_API_KEY) {
  console.error("[ABORT] ELEVENLABS_API_KEY missing");
  process.exit(1);
}
console.log("[OK] ELEVENLABS_API_KEY=present");

// ── 호출 카운터 (2회 초과 금지) ──────────────────────────────────────────
let TTS_CALL_COUNT = 0;
const MAX_TTS_CALLS = 2;

// ── 경로 설정 ─────────────────────────────────────────────────────────────
const AUDIO_DIR = join(ROOT, "output/v2/3d_sitcom_prod_v1/upload_002_copier/audio");
mkdirSync(AUDIO_DIR, { recursive: true });

const JUN_OUT  = join(AUDIO_DIR, "jun_hyun_tts_raw.mp3");
const BOSS_OUT = join(AUDIO_DIR, "boss_theo_tts_raw.mp3");

// ── voice 설정 ────────────────────────────────────────────────────────────
const JUN_VOICE_ID  = "70DeQK5Ztp7WmEGGysLT"; // Hyun
const BOSS_VOICE_ID = "CxErO97xpQgQXYmapDKX"; // 테오

// Episode 001 검증 세팅 그대로 적용 (stability0.5/sim0.8/style0.08/speaker_boost/speed0.9)
const JUN_SETTINGS = {
  stability: 0.50,
  similarity_boost: 0.80,
  style: 0.08,
  use_speaker_boost: true,
  speed: 0.90,
};

// Boss: 권위적이고 여유로운 톤 — 약간 안정적으로
const BOSS_SETTINGS = {
  stability: 0.60,
  similarity_boost: 0.80,
  style: 0.05,
  use_speaker_boost: true,
  speed: 0.92,
};

// ── TTS 텍스트 ────────────────────────────────────────────────────────────
const JUN_TEXT = `한 장만. 진짜 딱 한 장만.
화 안 낼게. 우리 오늘 좋게 끝내자.
그래. 그렇지.
근데 왜 계속 나오지?
한 장이라고.
우리 좋게 끝내기로 했잖아.
제 열정 말고, 용지가요.`;

const BOSS_TEXT = `준 씨, 열정이 넘치네요.`;

// ── ElevenLabs TTS 호출 함수 ─────────────────────────────────────────────
async function callElevenLabs(voiceId, text, settings, outPath, label) {
  if (TTS_CALL_COUNT >= MAX_TTS_CALLS) {
    console.error(`[ABORT] TTS 호출 횟수 초과 — ${TTS_CALL_COUNT}/${MAX_TTS_CALLS}`);
    process.exit(1);
  }

  TTS_CALL_COUNT++;
  console.log(`\n[TTS ${TTS_CALL_COUNT}/${MAX_TTS_CALLS}] ${label}`);
  console.log(`  voiceId: ${voiceId}`);
  console.log(`  text length: ${text.length}자`);

  const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
  const body = {
    text,
    model_id: "eleven_multilingual_v2",
    voice_settings: settings,
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "xi-api-key": ELEVENLABS_API_KEY,
      "Content-Type": "application/json",
      Accept: "audio/mpeg",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error(`[FAIL] ElevenLabs ${res.status}: ${errText}`);
    console.error(`[INFO] 자동 재생성 금지 — 원인 분석 후 Owner 판단 필요`);
    process.exit(1);
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  writeFileSync(outPath, buffer);
  console.log(`  saved: ${outPath}`);
  console.log(`  size: ${buffer.length} bytes (${(buffer.length / 1024).toFixed(1)} KB)`);

  return buffer;
}

// ── MD5 계산 ──────────────────────────────────────────────────────────────
function md5(buf) {
  return createHash("md5").update(buf).digest("hex");
}

// ── ffprobe duration 측정 ─────────────────────────────────────────────────
function probeDuration(filePath) {
  const r = spawnSync(
    "ffprobe",
    ["-v", "quiet", "-select_streams", "a:0",
     "-show_entries", "stream=duration",
     "-of", "csv=p=0", filePath],
    { encoding: "utf8" }
  );
  return parseFloat(r.stdout.trim()) || 0;
}

// ── 실행 시작 ─────────────────────────────────────────────────────────────
console.log("\n=== upload_002_copier ElevenLabs TTS 생성 ===");
console.log("승인: ALLOW_ELEVENLABS=true, TTS 정확히 2회 승인, BOSS_VOICE_ID=CxErO97xpQgQXYmapDKX");
console.log(`출력 디렉토리: ${AUDIO_DIR}\n`);

// Step 1: Jun TTS 생성
const junBuf = await callElevenLabs(JUN_VOICE_ID, JUN_TEXT, JUN_SETTINGS, JUN_OUT, "Jun / Hyun — 7문장 연속 트랙");

// Step 2: Boss TTS 생성
const bossBuf = await callElevenLabs(BOSS_VOICE_ID, BOSS_TEXT, BOSS_SETTINGS, BOSS_OUT, "Boss / Theo — 단일 대사");

console.log(`\n[CHECK] 총 TTS 호출: ${TTS_CALL_COUNT}회 (상한 ${MAX_TTS_CALLS}회) ✅`);

// Step 3: duration 측정
console.log("\n[Step 3] Audio duration 측정...");
const junDur  = probeDuration(JUN_OUT);
const bossDur = probeDuration(BOSS_OUT);
console.log(`  Jun:  ${junDur.toFixed(3)}s`);
console.log(`  Boss: ${bossDur.toFixed(3)}s`);

// Step 4: MD5
const junMd5  = md5(junBuf);
const bossMd5 = md5(bossBuf);
console.log("\n[Step 4] MD5");
console.log(`  Jun:  ${junMd5}`);
console.log(`  Boss: ${bossMd5}`);

// Step 5: Offset plan v2 계산
console.log("\n[Step 5] Offset plan v2 계산...");

const TOTAL_S = 36.500;
const TAIL_MIN = 0.30;

// Plan v1 offsets
const V1_JUN_OFFSETS = [0.20, 2.40, 6.20, 8.00, 10.20, 14.80, 33.00];
const V1_BOSS_OFFSET = 30.00;

// Boss 위치: S5 시작(29.5s) + 0.5s = 30.0s (v1 유지)
const bossOffset = V1_BOSS_OFFSET;
const bossEnd = bossOffset + bossDur;

// J7 (Jun 펀치라인): Boss 종료 후 0.5~0.8s
const j7OffsetV2 = parseFloat((bossEnd + 0.60).toFixed(2));
const j7DurEst = junDur > 0 ? null : 2.0; // 실제 구간 분리는 assemble 단계에서

console.log(`  Boss offset: ${bossOffset}s → end: ${bossEnd.toFixed(3)}s`);
console.log(`  J7 v2 offset: ${j7OffsetV2}s (Boss end + 0.60s)`);

const j7EndEst = j7OffsetV2 + 2.0; // 예상 2.0s
const tailEst = TOTAL_S - Math.max(bossEnd, j7EndEst);
console.log(`  J7 예상 종료: ~${j7EndEst.toFixed(2)}s`);
console.log(`  예상 tail: ~${tailEst.toFixed(2)}s ${tailEst >= TAIL_MIN ? "✅" : "⚠️"}`);

// J1~J6 오프셋은 Jun TTS 실제 길이 기반으로 조정 필요 여부 판단
// Jun 전체 트랙 길이로 각 구간 배분 추정
// (정확한 silencedetect 분리는 assemble 단계)
const junPerLine = junDur / 7;
console.log(`\n  Jun 전체 ${junDur.toFixed(3)}s / 7문장 = 평균 ${junPerLine.toFixed(2)}s/문장`);

// v1 offsets 충돌 검사
console.log("\n  V1 offset 충돌 검사 (Jun 평균 길이 기준):");
let prevEnd = 0;
let overlapFound = false;
for (let i = 0; i < 6; i++) {
  const offset = V1_JUN_OFFSETS[i];
  const estEnd = offset + junPerLine;
  const gap = offset - prevEnd;
  const ok = gap >= 0;
  if (!ok) overlapFound = true;
  console.log(`    J${i+1}: ${offset}s → ~${estEnd.toFixed(2)}s | gap=${gap.toFixed(2)}s ${ok ? "✅" : "❌ overlap"}`);
  prevEnd = estEnd;
}
// J7 (v2 offset)
{
  const offset = j7OffsetV2;
  const estEnd = offset + junPerLine;
  const gap = offset - prevEnd;
  const ok = gap >= 0;
  if (!ok) overlapFound = true;
  console.log(`    J7: ${offset}s → ~${estEnd.toFixed(2)}s | gap=${gap.toFixed(2)}s ${ok ? "✅" : "❌ overlap"}`);
}

if (overlapFound) {
  console.log("\n  ⚠️  일부 offset에서 평균 길이 기준 잠재 overlap — assemble 단계 silencedetect로 실측 후 조정");
} else {
  console.log("\n  ✅ 평균 길이 기준 overlap 없음");
}

// Step 6: 결과 요약
console.log("\n=== 결과 요약 ===");
console.log(`Jun raw:  ${JUN_OUT}`);
console.log(`  크기: ${junBuf.length} bytes (${(junBuf.length/1024).toFixed(1)} KB)`);
console.log(`  MD5:  ${junMd5}`);
console.log(`  duration: ${junDur.toFixed(3)}s`);
console.log(`Boss raw: ${BOSS_OUT}`);
console.log(`  크기: ${bossBuf.length} bytes (${(bossBuf.length/1024).toFixed(1)} KB)`);
console.log(`  MD5:  ${bossMd5}`);
console.log(`  duration: ${bossDur.toFixed(3)}s`);
console.log(`\nElevenLabs TTS 호출: ${TTS_CALL_COUNT}회 ✅`);
console.log(`\nOffset plan v2:`);
console.log(`  J1~J6: v1 유지 (0.20, 2.40, 6.20, 8.00, 10.20, 14.80)`);
console.log(`  Boss:  30.00s → end ${bossEnd.toFixed(3)}s`);
console.log(`  J7:    ${j7OffsetV2}s (Boss end ${bossEnd.toFixed(3)}s + 0.60s)`);
console.log(`\n[DONE] TTS raw 생성 완료 — final mux는 별도 assemble 단계`);
