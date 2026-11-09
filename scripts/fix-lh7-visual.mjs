/**
 * fix-lh7-visual.mjs
 *
 * LH-7 무음 영상 visual fix:
 * 1. scene 7/8/10 Pexels 재검색 + 다운로드 (최대 3 API 호출)
 * 2. fixed render_plan.json 생성 (topTitle 수정 + localImagePath 패치)
 *
 * 실행:
 *   node --env-file=.env.local scripts/fix-lh7-visual.mjs
 */

import { readFileSync, mkdirSync, writeFileSync, copyFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// ── .env.local 수동 파싱 ────────────────────────────────────────────────────
function loadEnv(filePath) {
  if (!existsSync(filePath)) return;
  const lines = readFileSync(filePath, "utf8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = val;
  }
}
loadEnv(join(ROOT, ".env.local"));

// ── 유료 API 차단 확인 ────────────────────────────────────────────────────────
const PAID_API_ENABLED = process.env.PAID_API_ENABLED === "true";
if (PAID_API_ENABLED) {
  console.error("⛔ PAID_API_ENABLED=true — 유료 API가 꺼진 상태에서 실행해야 합니다.");
  process.exit(1);
}
console.log("✅ 유료 API 차단 확인 (PAID_API_ENABLED=false)\n");

const PEXELS_API_KEY = process.env.PEXELS_API_KEY || "";
if (!PEXELS_API_KEY) {
  console.error("⛔ PEXELS_API_KEY 없음 — .env.local에 추가하세요.");
  process.exit(1);
}
console.log("✅ PEXELS_API_KEY 존재 확인\n");

// ── 경로 설정 ──────────────────────────────────────────────────────────────────
const ORIG_IMAGES_DIR = join(ROOT, "output/v2/paid_qa/lh7_pexels_stock_images");
const ORIG_RENDER_PLAN = join(ROOT, "output/v2/paid_qa/lh7_silent_render/render_plan.json");
const FIXED_DIR = join(ROOT, "output/v2/paid_qa/lh7_silent_render_fixed");
const FIXED_IMAGES_DIR = join(FIXED_DIR, "images");
const FIXED_PLAN_PATH = join(FIXED_DIR, "render_plan.json");

mkdirSync(FIXED_IMAGES_DIR, { recursive: true });
mkdirSync(join(FIXED_DIR, "qa_frames"), { recursive: true });
console.log(`📁 출력 디렉토리 준비: ${FIXED_DIR}\n`);

// ── Pexels 검색 함수 ────────────────────────────────────────────────────────────
async function searchPexels(query, orientation = "portrait") {
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=8&orientation=${orientation}`;
  const res = await fetch(url, { headers: { Authorization: PEXELS_API_KEY } });
  if (!res.ok) throw new Error(`Pexels HTTP ${res.status}: "${query}"`);
  const data = await res.json();
  const photos = data.photos ?? [];
  if (photos.length === 0) return null;
  // 랜덤 선택 대신 첫 번째 (검색 관련도 높은 순)
  const photo = photos[0];
  return {
    imageUrl: photo.src.portrait || photo.src.large2x || photo.src.original,
    photographer: photo.photographer,
    sourceUrl: photo.url,
  };
}

async function downloadToFile(imageUrl, filePath) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);
  try {
    const res = await fetch(imageUrl, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
    });
    clearTimeout(timeoutId);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    writeFileSync(filePath, Buffer.from(await res.arrayBuffer()));
    return true;
  } catch (err) {
    clearTimeout(timeoutId);
    console.warn(`  ⚠️ 다운로드 실패: ${err instanceof Error ? err.message : err}`);
    return false;
  }
}

// ── 교체 대상 씬 정의 ────────────────────────────────────────────────────────────
// blocking (필수): scene 7, 8
// minor (선택): scene 10
// 총 최대 3 Pexels 호출
const REPLACE_TARGETS = [
  {
    sceneNum: 7,
    queries: [
      "white laundry drying in sunlight outdoor",
      "white shirt hanging clothesline sunlight",
      "white clothes drying outdoor sunlight",
    ],
    required: true,
    reason: "blocking: male portrait / red background",
  },
  {
    sceneNum: 8,
    queries: [
      "clean white folded shirt minimal background",
      "white shirt fabric close up clean",
      "white clothes neatly folded laundry",
    ],
    required: true,
    reason: "blocking: weight-loss pants/body image",
  },
  {
    sceneNum: 10,
    queries: [
      "folded white laundry clean minimal",
      "laundry care items white shirt table",
      "clean white shirt care minimal background",
    ],
    required: false,
    reason: "minor: travel bag / tattooed woman",
  },
];

// ── 원본 render_plan 로드 ───────────────────────────────────────────────────────
const origPlan = JSON.parse(readFileSync(ORIG_RENDER_PLAN, "utf8"));

// ── 기존 이미지 복사 (교체 불필요 씬) ────────────────────────────────────────────
console.log("📋 기존 이미지 복사 (교체 불필요 씬 1~6, 9)...");
const replaceSceneNums = new Set(REPLACE_TARGETS.map((t) => t.sceneNum));
for (let i = 1; i <= 10; i++) {
  if (replaceSceneNums.has(i)) continue;
  const padded = String(i).padStart(2, "0");
  const src = join(ORIG_IMAGES_DIR, `scene_${padded}.jpg`);
  const dst = join(FIXED_IMAGES_DIR, `scene_${padded}.jpg`);
  if (existsSync(src)) {
    copyFileSync(src, dst);
    process.stdout.write(`  scene_${padded}.jpg 복사 ✅\n`);
  } else {
    console.warn(`  ⚠️ 원본 없음: scene_${padded}.jpg`);
  }
}
console.log();

// ── Pexels 재검색 + 다운로드 ────────────────────────────────────────────────────
const fixLog = [];
let pexelsCallsUsed = 0;

for (const target of REPLACE_TARGETS) {
  const { sceneNum, queries, required, reason } = target;
  const padded = String(sceneNum).padStart(2, "0");
  const filePath = join(FIXED_IMAGES_DIR, `scene_${padded}.jpg`);

  console.log(`\n[scene ${padded}] ${required ? "🔴 blocking" : "🟡 minor"}: ${reason}`);

  let success = false;
  let usedQuery = null;
  let photographer = null;
  let sourceUrl = null;

  for (const query of queries) {
    process.stdout.write(`  query: "${query}" ... `);
    pexelsCallsUsed++;

    try {
      const found = await searchPexels(query);
      if (!found) {
        console.log("❌ 결과 없음");
        continue;
      }
      const ok = await downloadToFile(found.imageUrl, filePath);
      if (ok) {
        console.log(`✅ (${found.photographer})`);
        usedQuery = query;
        photographer = found.photographer;
        sourceUrl = found.sourceUrl;
        success = true;
        break;
      }
    } catch (err) {
      console.log(`❌ 오류: ${err instanceof Error ? err.message : err}`);
    }

    // API 호출 사이 간격
    await new Promise((r) => setTimeout(r, 400));
  }

  fixLog.push({
    sceneNumber: sceneNum,
    required,
    reason,
    success,
    usedQuery,
    photographer,
    sourceUrl,
    savedPath: success ? filePath : null,
  });

  if (!success && required) {
    console.warn(`  ⚠️ blocking 씬 ${sceneNum} 교체 실패 — 원본 유지`);
    // fallback: 원본 이미지 복사
    const srcFallback = join(ORIG_IMAGES_DIR, `scene_${padded}.jpg`);
    if (existsSync(srcFallback)) copyFileSync(srcFallback, filePath);
  }
}

console.log(`\n✅ Pexels API 총 호출 횟수: ${pexelsCallsUsed}\n`);

// ── fixed render_plan.json 생성 ────────────────────────────────────────────────
const fixedPlan = JSON.parse(JSON.stringify(origPlan)); // deep copy

// topTitle 수정: "주방 팁" → 세탁 주제
fixedPlan.topTitle = "흰 옷 세탁 핵심 팁";
// hashtags에서 주방 관련 제거
fixedPlan.hashtags = fixedPlan.hashtags.map((tag) =>
  tag === "주방꿀팁" ? "세탁꿀팁" : tag
);

// localImagePath 업데이트
for (const scene of fixedPlan.scenes) {
  const padded = String(scene.sceneNumber).padStart(2, "0");
  const fixedPath = join(FIXED_IMAGES_DIR, `scene_${padded}.jpg`);
  scene.localImagePath = fixedPath;
}

writeFileSync(FIXED_PLAN_PATH, JSON.stringify(fixedPlan, null, 2), "utf8");
console.log(`📄 fixed render_plan.json 저장: ${FIXED_PLAN_PATH}`);

// ── fix log JSON 저장 ──────────────────────────────────────────────────────────
const fixLogPath = join(FIXED_DIR, "fix_log.json");
writeFileSync(fixLogPath, JSON.stringify({
  fixedAt: new Date().toISOString(),
  pexelsCallsUsed,
  pexelsCallsMax: 5,
  noPaidApiUsed: true,
  noPollinationsUsed: true,
  fixes: fixLog,
}, null, 2), "utf8");
console.log(`📄 fix_log.json 저장: ${fixLogPath}`);

console.log("\n=== fix-lh7-visual 완료 ===");
console.log("다음 단계: python render_v2.py 로 재렌더 실행");
