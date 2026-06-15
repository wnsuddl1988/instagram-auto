/**
 * _upload002-tts-generate-v2.mjs
 * upload_002_copier — ElevenLabs TTS 재생성 v2 (감정 연기 강화)
 *
 * [변경점 vs v1]
 * - Jun: stability 0.50→0.30, style 0.08→0.25, speed 0.90→0.85 (단일톤 낭독 탈피)
 * - Boss: stability 0.60→0.75, style 0.05→0.03, speed 0.92→0.82 (중후 부장님 톤)
 * - 출력: jun_hyun_tts_v2.mp3, boss_theo_tts_v2.mp3 (v1 보존)
 *
 * [호출 계약]
 * - Jun / Hyun 1회
 * - Boss / Theo 1회
 * - 합계 정확히 2회 — 자동 재생성 금지
 *
 * [실행]
 * node scripts/_upload002-tts-generate-v2.mjs
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

// ── 호출 카운터 ──────────────────────────────────────────────────────────
let TTS_CALL_COUNT = 0;
const MAX_TTS_CALLS = 2;

// ── 경로 설정 ─────────────────────────────────────────────────────────────
const AUDIO_DIR = join(ROOT, "output/v2/3d_sitcom_prod_v1/upload_002_copier/audio");
mkdirSync(AUDIO_DIR, { recursive: true });

// v1 파일은 보존, v2는 별도 파일명
const JUN_OUT  = join(AUDIO_DIR, "jun_hyun_tts_v2.mp3");
const BOSS_OUT = join(AUDIO_DIR, "boss_theo_tts_v2.mp3");

// ── voice ID ──────────────────────────────────────────────────────────────
const JUN_VOICE_ID  = "70DeQK5Ztp7WmEGGysLT"; // Hyun
const BOSS_VOICE_ID = "CxErO97xpQgQXYmapDKX"; // 테오

// ── 파라미터 v2 ───────────────────────────────────────────────────────────
// Jun: 감정 변동폭 확대 — 당황/안도/짜증/체념이 억양에 드러나야 함
const JUN_SETTINGS = {
  stability: 0.30,        // v1 0.50 → 낮춰서 감정 변동폭 확대
  similarity_boost: 0.75, // v1 0.80
  style: 0.25,            // v1 0.08 → 높여서 감정 스타일 강화
  use_speaker_boost: true,
  speed: 0.85,            // v1 0.90 → 체념/탈력 느낌
};

// Boss: 중후하고 느린 부장님 톤 — "웃고 있지만 눈치 주는" 압박감
const BOSS_SETTINGS = {
  stability: 0.75,        // v1 0.60 → 올려서 중후함 강화
  similarity_boost: 0.85, // v1 0.80
  style: 0.03,            // v1 0.05 → 낮춰서 과장 없는 부장님
  use_speaker_boost: true,
  speed: 0.82,            // v1 0.92 → 느리게 — 여유롭고 압박감 있음
};

// ── TTS 텍스트 ────────────────────────────────────────────────────────────
// Jun: 7문장 (라인 구분 → ElevenLabs 포즈 유도)
// J1: 달래는 척 초조함, J2: 안도→즉시 의심, J3: 안도, J4: 의심/당황, J5: 짜증
// J6: 체념/호소, J7: 탈력 반박 펀치라인
const JUN_TEXT = `한 장만. 진짜 딱 한 장만.
화 안 낼게. 우리 오늘 좋게 끝내자.
그래. 그렇지.
근데 왜 계속 나오지?
한 장이라고.
우리 좋게 끝내기로 했잖아.
제 열정 말고, 용지가요.`;

// Boss: 단일 문장 — 중후하고 은근한 압박
const BOSS_TEXT = `준 씨, 열정이 넘치네요.`;

// ── ElevenLabs TTS 호출 ───────────────────────────────────────────────────
async function callElevenLabs(voiceId, text, settings, outPath, label) {
  if (TTS_CALL_COUNT >= MAX_TTS_CALLS) {
    console.error(`[ABORT] TTS 호출 횟수 초과 — ${TTS_CALL_COUNT}/${MAX_TTS_CALLS}`);
    process.exit(1);
  }

  TTS_CALL_COUNT++;
  console.log(`\n[TTS ${TTS_CALL_COUNT}/${MAX_TTS_CALLS}] ${label}`);
  console.log(`  voiceId: ${voiceId}`);
  console.log(`  text: ${text.slice(0, 60).replace(/\n/g, " / ")}...`);
  console.log(`  settings: stability=${settings.stability} style=${settings.style} speed=${settings.speed}`);

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
    console.error("[INFO] 자동 재생성 금지 — 원인 분석 후 Owner 판단");
    process.exit(1);
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  writeFileSync(outPath, buffer);
  console.log(`  saved: ${outPath}`);
  console.log(`  size: ${buffer.length} bytes (${(buffer.length / 1024).toFixed(1)} KB)`);
  return buffer;
}

function md5(buf) {
  return createHash("md5").update(buf).digest("hex");
}

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

// ── 실행 ─────────────────────────────────────────────────────────────────
console.log("\n=== upload_002_copier TTS 재생성 v2 ===");
console.log("승인: ALLOW_ELEVENLABS=true, Audio recovery TTS 2회 승인");
console.log("목적: 감정 연기 강화 (Jun 당황/짜증/체념, Boss 중후 부장님 톤)");
console.log(`출력: ${AUDIO_DIR}\n`);

// Step 1: Jun TTS v2
const junBuf = await callElevenLabs(
  JUN_VOICE_ID, JUN_TEXT, JUN_SETTINGS, JUN_OUT,
  "Jun/Hyun v2 — 감정 억양 강화 (stability↓ style↑ speed↓)"
);

// Step 2: Boss TTS v2
const bossBuf = await callElevenLabs(
  BOSS_VOICE_ID, BOSS_TEXT, BOSS_SETTINGS, BOSS_OUT,
  "Boss/Theo v2 — 중후 부장님 톤 (stability↑ speed↓)"
);

console.log(`\n[CHECK] 총 TTS 호출: ${TTS_CALL_COUNT}/${MAX_TTS_CALLS} ✅`);

// Step 3: duration 측정
console.log("\n[Step 3] Duration...");
const junDur  = probeDuration(JUN_OUT);
const bossDur = probeDuration(BOSS_OUT);
console.log(`  Jun v2:  ${junDur.toFixed(3)}s`);
console.log(`  Boss v2: ${bossDur.toFixed(3)}s`);

// Step 4: MD5
const junMd5  = md5(junBuf);
const bossMd5 = md5(bossBuf);
console.log("\n[Step 4] MD5");
console.log(`  Jun v2:  ${junMd5}`);
console.log(`  Boss v2: ${bossMd5}`);

// Step 5: offset v3 호환성 예비 검사
console.log("\n[Step 5] Offset v3 예비 검사...");
const OFFSETS_V3 = [0.20, 2.63, 6.20, 8.67, 10.13, 15.50, 32.55];
const BOSS_OFF   = 30.00;
const TOTAL_S    = 36.50;

const bossEnd = BOSS_OFF + bossDur;
const avgLineDur = junDur / 7;
console.log(`  Jun 평균 문장 길이: ${avgLineDur.toFixed(2)}s`);

let prevEnd = 0;
let warnCount = 0;
for (let i = 0; i < 7; i++) {
  const off = OFFSETS_V3[i];
  const estEnd = off + avgLineDur;
  const gap = off - prevEnd;
  if (gap < 0) {
    console.log(`  ⚠️  J${i+1}: offset ${off}s — 평균 길이 기준 overlap (gap=${gap.toFixed(2)}s)`);
    warnCount++;
  } else {
    console.log(`  J${i+1}: ${off}s → ~${estEnd.toFixed(2)}s gap=${gap.toFixed(2)}s ✅`);
  }
  prevEnd = estEnd;
}
const tail = TOTAL_S - Math.max(prevEnd, bossEnd);
console.log(`  Boss: ${BOSS_OFF}s → ${bossEnd.toFixed(3)}s ✅`);
console.log(`  Tail: ~${tail.toFixed(2)}s ${tail >= 0.3 ? "✅" : "⚠️"}`);
if (warnCount > 0) {
  console.log(`\n  ⚠️  평균 기준 ${warnCount}개 경고 — 실측 silencedetect 후 assemble 단계에서 재확인`);
} else {
  console.log("\n  ✅ 평균 기준 overlap 없음 — assemble 진행 가능");
}

console.log("\n=== 결과 요약 ===");
console.log(`Jun v2:  ${JUN_OUT}`);
console.log(`  size=${junBuf.length}B  dur=${junDur.toFixed(3)}s  md5=${junMd5}`);
console.log(`Boss v2: ${BOSS_OUT}`);
console.log(`  size=${bossBuf.length}B  dur=${bossDur.toFixed(3)}s  md5=${bossMd5}`);
console.log(`\nElevenLabs 호출: ${TTS_CALL_COUNT}회 ✅`);
console.log("\n[DONE] TTS v2 생성 완료 — 다음: _upload002-tts-assemble-v3.mjs");
