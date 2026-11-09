/**
 * _upload002-voice-list.mjs
 * ElevenLabs 저장된 voice 목록 조회 (메타데이터만, TTS 생성 0회)
 *
 * 목적: Boss/Theo에 적합한 한국어 남성 목소리 후보 확인
 *
 * 실행: node scripts/env-safe.mjs run-with-env scripts/_upload002-voice-list.mjs
 */

import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// ── env 로드 (키 값 출력 금지) ──────────────────────────────────────────────
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
console.log("[INFO] TTS 생성 호출: 0회 — voice list metadata 조회만 수행\n");

// ── GET /v1/voices (저장된 voice 목록) ─────────────────────────────────────
const res = await fetch("https://api.elevenlabs.io/v1/voices", {
  headers: {
    "xi-api-key": ELEVENLABS_API_KEY,
    "Content-Type": "application/json",
  },
});

if (!res.ok) {
  const body = await res.text();
  console.error(`[FAIL] voices API ${res.status}: ${body}`);
  process.exit(1);
}

const data = await res.json();
const voices = data.voices || [];

console.log(`[OK] 총 ${voices.length}개 voice 조회됨\n`);
console.log("=== 전체 Voice 목록 ===");

// 알려진 Hyun ID
const HYUN_ID = "70DeQK5Ztp7WmEGGysLT";

for (const v of voices) {
  const labels = v.labels || {};
  const gender = labels.gender || "?";
  const accent = labels.accent || "?";
  const age = labels.age || "?";
  const useCase = labels.use_case || labels.useCase || "?";
  const description = labels.description || "";
  const isHyun = v.voice_id === HYUN_ID ? " ← [현재 Jun/Hyun]" : "";

  console.log(`  [${v.voice_id}] ${v.name}${isHyun}`);
  console.log(`    gender=${gender} | accent=${accent} | age=${age} | use_case=${useCase}`);
  if (description) console.log(`    desc: ${description}`);
}

console.log("\n=== Boss/Theo 후보 필터 (male / middle-aged / authoritative) ===");

const maleCandidates = voices.filter((v) => {
  const labels = v.labels || {};
  const gender = (labels.gender || "").toLowerCase();
  const age = (labels.age || "").toLowerCase();
  const desc = (labels.description || "").toLowerCase();
  const name = (v.name || "").toLowerCase();
  // 남성 + (중년 또는 권위적 톤 키워드)
  return (
    gender === "male" &&
    (age.includes("middle") || age.includes("old") || age.includes("senior") ||
     desc.includes("authoritative") || desc.includes("deep") ||
     desc.includes("mature") || desc.includes("boss") ||
     name.includes("theo"))
  );
});

if (maleCandidates.length === 0) {
  console.log("  → 자동 필터 결과 없음. 전체 male 목록:");
  const allMale = voices.filter((v) => (v.labels?.gender || "").toLowerCase() === "male");
  for (const v of allMale) {
    const labels = v.labels || {};
    console.log(`    [${v.voice_id}] ${v.name} | age=${labels.age || "?"} | ${labels.description || ""}`);
  }
} else {
  for (const v of maleCandidates) {
    const labels = v.labels || {};
    console.log(`  [${v.voice_id}] ${v.name}`);
    console.log(`    age=${labels.age || "?"} | desc=${labels.description || "?"}`);
  }
}

console.log("\n[DONE] voice list 조회 완료 — TTS 생성 호출 0회");
