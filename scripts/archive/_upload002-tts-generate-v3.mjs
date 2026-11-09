/**
 * _upload002-tts-generate-v3.mjs
 * upload_002_copier — ElevenLabs TTS 재생성 v3 (Contract v3 파라미터)
 *
 * [호출 계약]
 * - Jun / Hyun / 70DeQK5Ztp7WmEGGysLT / 1회
 * - Boss / Theo / CxErO97xpQgQXYmapDKX / 1회
 * - 합계 정확히 2회 — 재시도 절대 금지
 *
 * [v3 변경점 vs v2]
 * - Jun: stability 0.22(평균) / style 0.35 / speed 0.82 — 당황→짜증→체념 억양 강화
 * - Boss: stability 0.80 / style 0.02 / speed 0.76 — 부장님 톤 (v2 0.75/0.82보다 중후)
 * - 출력: jun_hyun_tts_v3.mp3, boss_theo_tts_v3.mp3 (v1/v2 보존)
 *
 * [Stop-Loss]
 * - 실패 시 즉시 ABORT + 보고
 * - 재시도 없음
 *
 * [실행]
 * ALLOW_TTS_V3=true node scripts/_upload002-tts-generate-v3.mjs
 */

import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { createHash } from "crypto";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// ── Stop-Loss Gate ────────────────────────────────────────────────────────────
if (process.env.ALLOW_TTS_V3 !== "true") {
  console.error("[ABORT] ALLOW_TTS_V3=true 없이 실행 불가");
  console.error("  실행: ALLOW_TTS_V3=true node scripts/_upload002-tts-generate-v3.mjs");
  process.exit(1);
}

// ── env 로드 ──────────────────────────────────────────────────────────────────
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
  console.error("[ABORT] ELEVENLABS_API_KEY 없음 — .env.local 확인");
  process.exit(1);
}
console.log("[OK] ELEVENLABS_API_KEY=present");

// ── 호출 카운터 (상한 2회 하드코딩) ──────────────────────────────────────────
let TTS_CALL_COUNT = 0;
const MAX_TTS_CALLS = 2;

// ── 경로 설정 ─────────────────────────────────────────────────────────────────
const AUDIO_DIR = join(ROOT, "output/v2/3d_sitcom_prod_v1/upload_002_copier/audio");
mkdirSync(AUDIO_DIR, { recursive: true });

const JUN_OUT  = join(AUDIO_DIR, "jun_hyun_tts_v3.mp3");
const BOSS_OUT = join(AUDIO_DIR, "boss_theo_tts_v3.mp3");

// ── Voice ID (Contract v3 확정) ───────────────────────────────────────────────
const JUN_VOICE_ID  = "70DeQK5Ztp7WmEGGysLT"; // Hyun
const BOSS_VOICE_ID = "CxErO97xpQgQXYmapDKX"; // Theo

// ── 파라미터 v3 (Contract v3 기준) ───────────────────────────────────────────
// Jun: 단계별 감정 (당황→짜증→체념). 단일 호출이므로 stability 낮게, style 높게.
const JUN_SETTINGS = {
  stability: 0.22,
  similarity_boost: 0.75,
  style: 0.35,
  use_speaker_boost: true,
  speed: 0.82,
};

// Boss: 중후하고 느린 부장님 톤. 고막남친 금지. stability 높게, speed 낮게.
const BOSS_SETTINGS = {
  stability: 0.80,
  similarity_boost: 0.85,
  style: 0.02,
  use_speaker_boost: true,
  speed: 0.76,
};

// ── TTS 텍스트 (Contract v3 대사 순서) ───────────────────────────────────────
// J1(당황 간청) → J2(억지 평정) → J3(안도) → J4(재당황) → J5(짜증 단호)
// → J6(짜증 최고조) → J7(체념 탈력 반박)
const JUN_TEXT = `한 장만. 진짜 딱 한 장만.
화 안 낼게. 우리 오늘 좋게 끝내자.
그래. 그렇지.
근데 왜 계속 나오지?
한 장이라고.
우리 좋게 끝내기로 했잖아.
제 열정 말고, 용지가요.`;

const BOSS_TEXT = `준 씨, 열정이 넘치네요.`;

// ── ElevenLabs 호출 함수 ─────────────────────────────────────────────────────
async function callElevenLabs(voiceId, text, settings, outPath, label) {
  if (TTS_CALL_COUNT >= MAX_TTS_CALLS) {
    console.error(`[ABORT] TTS 호출 상한 초과 — ${TTS_CALL_COUNT}/${MAX_TTS_CALLS}`);
    process.exit(1);
  }

  TTS_CALL_COUNT++;
  console.log(`\n[TTS ${TTS_CALL_COUNT}/${MAX_TTS_CALLS}] ${label}`);
  console.log(`  voiceId: ${voiceId}`);
  console.log(`  text preview: ${text.slice(0, 60).replace(/\n/g, " / ")}...`);
  console.log(`  stability=${settings.stability} style=${settings.style} speed=${settings.speed}`);

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
    console.error(`[ABORT] ElevenLabs ${res.status}: ${errText.slice(0, 200)}`);
    console.error("  재시도 금지 — 원인 분석 후 Codex 보고");
    process.exit(1);
  }

  const buffer = Buffer.from(await res.arrayBuffer());
  writeFileSync(outPath, buffer);

  const md5 = createHash("md5").update(buffer).digest("hex");
  console.log(`  saved: ${outPath}`);
  console.log(`  size:  ${buffer.length} bytes (${(buffer.length / 1024).toFixed(1)} KB)`);
  console.log(`  md5:   ${md5}`);
  return { buffer, md5, size: buffer.length };
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

// ── Preflight: TTS 호출 전 timing feasibility check ─────────────────────────
// v2 TTS 실측값 기반 보수 추정 (×1.20) — ElevenLabs 호출 없이 사전 검증
// 근거: jun_hyun_tts_v2.mp3 silencedetect 실측 J7=0.986s, Boss=2.276s
console.log("\n=== Timing Preflight (TTS 호출 전 검증) ===");

const PREFLIGHT = {
  TOTAL_S:    36.5,
  TAIL_MIN:   0.3,
  GAP_MIN:    0.25,
  J7_DUR_EST:   0.986 * 1.20,  // 보수 추정 1.183s
  BOSS_DUR_EST: 2.276 * 1.20,  // 보수 추정 2.731s
  BOSS_OFFSET:  31.5,           // ★ 수정된 offset
  J7_OFFSET:    34.7,           // ★ 수정된 offset
};

const bossEnd = PREFLIGHT.BOSS_OFFSET + PREFLIGHT.BOSS_DUR_EST;
const j7End   = PREFLIGHT.J7_OFFSET   + PREFLIGHT.J7_DUR_EST;
const gap     = PREFLIGHT.J7_OFFSET   - bossEnd;
const tail    = PREFLIGHT.TOTAL_S     - j7End;

console.log(`  Boss: ${PREFLIGHT.BOSS_OFFSET}s + ${PREFLIGHT.BOSS_DUR_EST.toFixed(3)}s = ${bossEnd.toFixed(3)}s`);
console.log(`  J7:   ${PREFLIGHT.J7_OFFSET}s + ${PREFLIGHT.J7_DUR_EST.toFixed(3)}s = ${j7End.toFixed(3)}s`);
console.log(`  gap(Boss→J7): ${gap.toFixed(3)}s ${gap >= PREFLIGHT.GAP_MIN ? "✅" : "❌"}`);
console.log(`  tail:         ${tail.toFixed(3)}s ${tail >= PREFLIGHT.TAIL_MIN ? "✅" : "❌"}`);

if (gap < PREFLIGHT.GAP_MIN || tail < PREFLIGHT.TAIL_MIN) {
  console.error("\n[ABORT] Timing preflight FAIL — TTS 호출 없이 종료");
  console.error("  ElevenLabs 0회 소비. offset 재조정 후 재실행.");
  process.exit(1);
}
console.log("  [preflight_pass] ✅ TTS 호출 진행\n");

// ── 실행 ─────────────────────────────────────────────────────────────────────
console.log("=== upload_002_copier TTS v3 ===");
console.log("승인: Contract v3 조건부 승인 / ALLOW_TTS_V3=true");
console.log("목적: audio recovery final test — 감정 연기 + 부장님 톤");
console.log(`출력: ${AUDIO_DIR}\n`);

// Step 1: Jun TTS v3
const jun = await callElevenLabs(
  JUN_VOICE_ID, JUN_TEXT, JUN_SETTINGS, JUN_OUT,
  "Jun/Hyun v3 — 당황→짜증→체념 감정 단계 강화"
);

// Step 2: Boss TTS v3
const boss = await callElevenLabs(
  BOSS_VOICE_ID, BOSS_TEXT, BOSS_SETTINGS, BOSS_OUT,
  "Boss/Theo v3 — 중후 부장님 톤 stability 0.80 speed 0.76"
);

console.log(`\n[CHECK] 총 TTS 호출: ${TTS_CALL_COUNT}/${MAX_TTS_CALLS} ✅`);

// Step 3: duration 측정
console.log("\n[Step 3] Duration 측정...");
const junDur  = probeDuration(JUN_OUT);
const bossDur = probeDuration(BOSS_OUT);
console.log(`  Jun v3:  ${junDur.toFixed(3)}s`);
console.log(`  Boss v3: ${bossDur.toFixed(3)}s`);

// Step 4: Contract v3 offset 예비 검사
// (실측 silencedetect는 assemble-v3.mjs에서 진행)
console.log("\n[Step 4] Contract v3 offset 예비 검사...");

// Contract v3 대사 시작 기준 (Event Contract 중간값, ★ preflight 수정값과 동일)
const OFFSETS_V3 = [5.5, 12.0, 18.5, 21.5, 24.5, 28.0, 34.7];
const BOSS_OFF   = 31.5;
const TOTAL_S    = 36.5;

const avgLineDur = junDur / 7;
console.log(`  Jun 평균 문장 길이 추정: ${avgLineDur.toFixed(2)}s`);

let prevEnd = 0;
let warnCount = 0;
for (let i = 0; i < 7; i++) {
  const off    = OFFSETS_V3[i];
  const estEnd = off + avgLineDur;
  const gap    = off - prevEnd;
  const gapOk  = gap >= 0;
  const endOk  = estEnd <= TOTAL_S;
  if (!gapOk) warnCount++;
  console.log(`  J${i + 1}: ${off}s → ~${estEnd.toFixed(2)}s  gap=${gap.toFixed(2)}s ${gapOk && endOk ? "✅" : "⚠️"}`);
  prevEnd = estEnd;
}
const bossEnd4 = BOSS_OFF + bossDur;
const tail4    = TOTAL_S - Math.max(prevEnd, bossEnd4);
console.log(`  Boss: ${BOSS_OFF}s → ${bossEnd4.toFixed(3)}s ✅`);
console.log(`  Tail: ~${tail4.toFixed(2)}s ${tail4 >= 0.3 ? "✅" : "⚠️"}`);

if (warnCount > 0) {
  console.log(`\n  ⚠️  평균 기준 ${warnCount}개 경고 — assemble 단계에서 silencedetect 후 재확인`);
} else {
  console.log("\n  ✅ 평균 기준 overlap 없음");
}

// ── 최종 요약 ─────────────────────────────────────────────────────────────────
console.log("\n=== 결과 요약 ===");
console.log(`Jun v3:  ${JUN_OUT}`);
console.log(`  size=${jun.size}B  dur=${junDur.toFixed(3)}s  md5=${jun.md5}`);
console.log(`Boss v3: ${BOSS_OUT}`);
console.log(`  size=${boss.size}B  dur=${bossDur.toFixed(3)}s  md5=${boss.md5}`);
console.log(`\nElevenLabs 호출: ${TTS_CALL_COUNT}회 ✅`);
console.log("\n[DONE] TTS v3 완료 — 다음: ALLOW_ASSEMBLE_V3=true node scripts/_upload002-tts-assemble-v3-final.mjs");
