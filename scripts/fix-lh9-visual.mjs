/**
 * fix-lh9-visual.mjs
 *
 * QA-LH-9 Pexels 이미지 minor fix 스크립트.
 * scene 3/4/5/6/9/10 대체 이미지 재검색 (최대 6회) 후
 * lh9_pexels_stock_images_fixed/ 폴더에 10장 완성본 생성.
 *
 * 실행:
 *   node scripts/fix-lh9-visual.mjs
 */

import { readFileSync, mkdirSync, writeFileSync, existsSync, copyFileSync, statSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// ── .env.local 로드 ────────────────────────────────────────────────────────────
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

// ── 유료 API 차단 확인 ─────────────────────────────────────────────────────────
const PAID_API_ENABLED = process.env.PAID_API_ENABLED === "true";
if (PAID_API_ENABLED) {
  console.error("⛔ PAID_API_ENABLED=true — 유료 API가 꺼진 상태에서 실행해야 합니다.");
  process.exit(1);
}
console.log("✅ 유료 API 차단 확인:");
console.log(`   PAID_API_ENABLED=${process.env.PAID_API_ENABLED ?? "미설정(=false)"}`);
console.log(`   ALLOW_OPENAI_GENERATE=${process.env.ALLOW_OPENAI_GENERATE ?? "미설정"}`);
console.log(`   ALLOW_OPENAI_TTS=${process.env.ALLOW_OPENAI_TTS ?? "미설정"}`);
console.log(`   ALLOW_IMAGEN=${process.env.ALLOW_IMAGEN ?? "미설정"}`);
console.log();

const PEXELS_API_KEY = process.env.PEXELS_API_KEY || "";
if (!PEXELS_API_KEY) {
  console.error("⛔ PEXELS_API_KEY 없음");
  process.exit(1);
}
console.log("✅ PEXELS_API_KEY 존재 확인 (값 비노출)\n");

// ── 경로 설정 ──────────────────────────────────────────────────────────────────
const SRC_DIR = join(ROOT, "output/v2/paid_qa/lh9_pexels_stock_images");
const OUT_DIR = join(ROOT, "output/v2/paid_qa/lh9_pexels_stock_images_fixed");
mkdirSync(OUT_DIR, { recursive: true });

// ── HVAC/오염 키워드 필터 ────────────────────────────────────────────────────
const HVAC_REJECT_KEYWORDS = [
  "hvac", "air-condition", "air_condition", "aircon", "technician",
  "industrial", "factory", "compressor", "mechanic", "engineer-at-work",
  "shirts", "clothing", "t-shirt", "fashion", "apparel",
  "supermarket-aisle", "grocery-store", "mall"
];
function hasHvacRisk(photo) {
  const combined = [photo.url || "", photo.photographer || "", photo.alt || ""].join(" ").toLowerCase();
  return HVAC_REJECT_KEYWORDS.some((kw) => combined.includes(kw));
}

// scene 10 적합성 — 냉장고/소스류 키워드
const SCENE10_OK_KEYWORDS = ["refrigerator", "fridge", "sauce", "condiment", "door-shelf", "kitchen", "food-storage"];
function isScene10Ok(photo) {
  const combined = [photo.url || "", photo.alt || ""].join(" ").toLowerCase();
  return SCENE10_OK_KEYWORDS.some((kw) => combined.includes(kw));
}

// 사람 노출 위험 URL 키워드
const PERSON_RISK_KEYWORDS = ["woman", "man", "person", "people", "portrait", "face", "model"];
function hasPersonRisk(photo) {
  const urlLower = (photo.url || "").toLowerCase();
  return PERSON_RISK_KEYWORDS.some((kw) => urlLower.includes(kw));
}

// ── Pexels search ──────────────────────────────────────────────────────────────
async function searchPexels(query, orientation = "portrait", perPage = 8) {
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=${orientation}`;
  const res = await fetch(url, { headers: { Authorization: PEXELS_API_KEY } });
  if (!res.ok) throw new Error(`Pexels HTTP ${res.status}: "${query}"`);
  const data = await res.json();
  return data.photos ?? [];
}

// ── 다운로드 ──────────────────────────────────────────────────────────────────
async function downloadToFile(imageUrl, filePath) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);
  try {
    const res = await fetch(imageUrl, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
    });
    clearTimeout(timeoutId);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buffer = Buffer.from(await res.arrayBuffer());
    writeFileSync(filePath, buffer);
    return buffer.length;
  } catch (err) {
    clearTimeout(timeoutId);
    return 0;
  }
}

// ── fix 대상 정의 (최대 6회 Pexels 호출) ─────────────────────────────────────
// 각 씬에 쿼리 우선순위 배열. 첫 번째로 OK인 사진 선택.
const FIX_TARGETS = {
  3: {
    narration: "문칸은 온도 변화가 커서 위험한 자리예요.",
    queries: [
      "refrigerator door shelf close up",
      "open refrigerator door shelves close up",
      "condensation inside refrigerator door",
    ],
    avoidHvac: true,
  },
  4: {
    narration: "하루에 10번 열렸다 닫히면, 온도 4도에서 10도까지.",
    queries: [
      "open refrigerator door close up",
      "refrigerator thermometer inside fridge",
      "fridge temperature thermometer",
    ],
    avoidHvac: true,
  },
  5: {
    narration: "신선식품은 냉장고 안쪽 칸에 두고, 소스류는 문칸에 보관하세요.",
    queries: [
      "eggs and dairy on refrigerator shelf",
      "organized fridge shelf dairy eggs",
      "refrigerator inner shelf fresh food dairy",
    ],
    avoidHvac: false,
  },
  6: {
    narration: "달걀을 안쪽으로 옮겼더니 유통기한이 1주일 늘어났어요.",
    queries: [
      "egg carton inside refrigerator shelf",
      "eggs on refrigerator inner shelf",
      "fresh eggs in fridge shelf",
    ],
    avoidHvac: false,
  },
  9: {
    narration: "규칙은 간단해요, 신선식품은 안쪽 칸입니다.",
    queries: [
      "fresh food inside refrigerator shelf",
      "organized fridge vegetables eggs dairy",
      "organized refrigerator inner shelf fresh food",
    ],
    avoidHvac: false,
  },
  10: {
    narration: "오늘 냉장고 문칸에서 달걀과 우유부터 옮겨보세요.",
    queries: [
      "condiments on refrigerator door shelf",
      "refrigerator door shelf sauces only",
      "sauce bottles refrigerator door",
    ],
    avoidHvac: false,
    requireScene10Ok: true,
    avoidPerson: true,
  },
};

// ── 씬별 fix 실행 ─────────────────────────────────────────────────────────────
const fixLog = [];
let pexelsCallsUsed = 0;
const replacedScenes = [];
const keptScenes = [];

// 현재 이미지 URL 목록 (중복 방지용)
const usedSourceUrls = new Set();

// 이미 사용 중인 URL — 기존 keep 씬 기준으로 초기화할 것이므로 나중에 채움
// (fix 대상 씬은 교체하므로 기존 URL을 allow에서 제외)

console.log("=== LH-9 Visual Fix 시작 ===\n");
console.log(`fix 대상 씬: ${Object.keys(FIX_TARGETS).join(", ")}\n`);

for (const [sceneNumStr, target] of Object.entries(FIX_TARGETS)) {
  const sceneNum = Number(sceneNumStr);
  const padded = String(sceneNum).padStart(2, "0");
  const destPath = join(OUT_DIR, `scene_${padded}.jpg`);

  process.stdout.write(`[scene ${padded}] fix 시도 — narration: "${target.narration.slice(0, 30)}..." `);

  let succeeded = false;
  let chosenPhoto = null;
  let usedQuery = null;

  for (const query of target.queries) {
    if (pexelsCallsUsed >= 6) {
      console.log(`\n  ⚠️ Pexels 호출 한도(6회) 도달 — 기존 이미지 유지`);
      break;
    }

    const photos = await searchPexels(query);
    pexelsCallsUsed++;

    await new Promise((r) => setTimeout(r, 400));

    // 후보 필터링 — 중복 URL 제외
    const candidates = photos.filter((p) => !usedSourceUrls.has(p.url));

    for (const photo of candidates) {
      // HVAC 필터
      if (target.avoidHvac && hasHvacRisk(photo)) continue;
      // scene 10 소스류 적합성
      if (target.requireScene10Ok && !isScene10Ok(photo)) continue;
      // scene 10 사람 회피
      if (target.avoidPerson && hasPersonRisk(photo)) continue;

      chosenPhoto = photo;
      usedQuery = query;
      break;
    }

    if (chosenPhoto) break;
  }

  if (!chosenPhoto) {
    // 교체 실패 — 기존 이미지 복사
    const srcPath = join(SRC_DIR, `scene_${padded}.jpg`);
    if (existsSync(srcPath)) {
      copyFileSync(srcPath, destPath);
      console.log(`❌ 교체 실패 → 기존 이미지 유지`);
      fixLog.push({
        sceneNumber: sceneNum,
        action: "kept_original",
        reason: "Pexels 재검색 실패 또는 적합 이미지 없음",
        pexelsCallsUsed,
      });
      keptScenes.push(sceneNum);
    } else {
      console.log(`❌ 기존 이미지도 없음 — 스킵`);
    }
    continue;
  }

  // 다운로드
  const imageUrl = chosenPhoto.src?.portrait || chosenPhoto.src?.large2x || chosenPhoto.src?.original;
  const byteLen = await downloadToFile(imageUrl, destPath);

  if (byteLen > 0) {
    usedSourceUrls.add(chosenPhoto.url);
    replacedScenes.push(sceneNum);
    const kb = (byteLen / 1024).toFixed(0);
    console.log(`✅ ${kb}KB [${usedQuery}] (${chosenPhoto.photographer})`);
    fixLog.push({
      sceneNumber: sceneNum,
      action: "replaced",
      usedQuery,
      photographer: chosenPhoto.photographer,
      sourceUrl: chosenPhoto.url,
      pexelsId: chosenPhoto.id,
      fileSizeKB: +(byteLen / 1024).toFixed(1),
      savedPath: destPath,
    });
  } else {
    // 다운로드 실패 — 기존 이미지 유지
    const srcPath = join(SRC_DIR, `scene_${padded}.jpg`);
    if (existsSync(srcPath)) copyFileSync(srcPath, destPath);
    console.log(`❌ 다운로드 실패 → 기존 이미지 유지`);
    fixLog.push({
      sceneNumber: sceneNum,
      action: "kept_original",
      reason: "다운로드 실패",
    });
    keptScenes.push(sceneNum);
  }
}

// ── 비대상 씬 복사 (1/2/7/8) ─────────────────────────────────────────────────
console.log("\n── 비대상 씬 복사 ──");
const ALL_SCENES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const FIX_SCENE_NUMS = Object.keys(FIX_TARGETS).map(Number);
const KEEP_SCENE_NUMS = ALL_SCENES.filter((n) => !FIX_SCENE_NUMS.includes(n));

for (const sceneNum of KEEP_SCENE_NUMS) {
  const padded = String(sceneNum).padStart(2, "0");
  const srcPath = join(SRC_DIR, `scene_${padded}.jpg`);
  const destPath = join(OUT_DIR, `scene_${padded}.jpg`);

  if (existsSync(destPath)) {
    // fix 시도 중 이미 kept_original로 복사된 경우
    keptScenes.push(sceneNum);
    console.log(`  scene ${padded}: 이미 복사됨 (fix 실패 fallback)`);
    continue;
  }

  if (existsSync(srcPath)) {
    copyFileSync(srcPath, destPath);
    const kb = (statSync(destPath).size / 1024).toFixed(0);
    keptScenes.push(sceneNum);
    console.log(`  scene ${padded}: 복사 완료 (${kb}KB)`);
  } else {
    console.log(`  scene ${padded}: 원본 없음 — 스킵`);
  }
}

// ── 기본 이미지 QA ─────────────────────────────────────────────────────────────
console.log("\n── 이미지 기본 QA ──");
const perScene = [];
const fixedSourceUrls = [];
let qaFail = 0;

for (let i = 1; i <= 10; i++) {
  const padded = String(i).padStart(2, "0");
  const filePath = join(OUT_DIR, `scene_${padded}.jpg`);
  const log = fixLog.find((f) => f.sceneNumber === i);
  const replaced = replacedScenes.includes(i);

  const entry = {
    sceneNumber: i,
    action: replaced ? "replaced" : "kept",
    filePath,
    fileSizeKB: 0,
    photographer: null,
    sourceUrl: null,
    usedQuery: null,
    ok: false,
    note: null,
  };

  if (log && log.action === "replaced") {
    entry.photographer = log.photographer;
    entry.sourceUrl = log.sourceUrl;
    entry.usedQuery = log.usedQuery;
  }

  if (!existsSync(filePath)) {
    console.log(`  ❌ scene ${padded}: 파일 없음`);
    qaFail++;
    perScene.push(entry);
    continue;
  }

  const stat = statSync(filePath);
  if (stat.size === 0) {
    console.log(`  ❌ scene ${padded}: 0바이트`);
    qaFail++;
    perScene.push(entry);
    continue;
  }

  entry.fileSizeKB = +(stat.size / 1024).toFixed(1);
  entry.ok = true;

  const reviewTag = replaced ? ` [교체됨: ${log?.usedQuery ?? ""}]` : " [유지]";
  console.log(`  ✅ scene ${padded}: ${entry.fileSizeKB}KB OK${reviewTag}`);
  perScene.push(entry);
}

// ── 중복 sourceUrl 확인 ────────────────────────────────────────────────────────
console.log("\n── 중복 sourceUrl 확인 ──");
const seenUrls = {};
for (const f of fixLog) {
  if (f.sourceUrl) {
    if (seenUrls[f.sourceUrl]) {
      console.log(`  ⚠️ 중복 URL: scene ${seenUrls[f.sourceUrl]} & scene ${f.sceneNumber} — ${f.sourceUrl}`);
    } else {
      seenUrls[f.sourceUrl] = f.sceneNumber;
    }
  }
}
if (Object.keys(seenUrls).length === replacedScenes.length) {
  console.log("  ✅ 교체 씬 sourceUrl 중복 없음");
}

// ── scene 3/4 HVAC 리포트 ────────────────────────────────────────────────────
console.log("\n── scene 3/4 HVAC 회피 확인 ──");
const s3log = fixLog.find((f) => f.sceneNumber === 3);
const s4log = fixLog.find((f) => f.sceneNumber === 4);
console.log(`  scene 3: ${s3log?.action === "replaced" ? `✅ 교체됨 — ${s3log.sourceUrl}` : "⚠️ 기존 유지"}`);
console.log(`  scene 4: ${s4log?.action === "replaced" ? `✅ 교체됨 — ${s4log.sourceUrl}` : "⚠️ 기존 유지"}`);

// ── scene 10 적합성 리포트 ────────────────────────────────────────────────────
console.log("\n── scene 10 적합성 확인 ──");
const s10log = fixLog.find((f) => f.sceneNumber === 10);
if (s10log?.action === "replaced") {
  console.log(`  ✅ scene 10 교체됨 — ${s10log.sourceUrl}`);
  console.log(`  photographer: ${s10log.photographer}`);
} else {
  console.log(`  ⚠️ scene 10 교체 실패 — 기존 이미지(woman-in-white-sweater) 유지. 수동 검토 필요.`);
}

// ── fixed summary 저장 ──────────────────────────────────────────────────────────
const fixedSummary = {
  fixedAt: new Date().toISOString(),
  planPath: "output/v2/paid_qa/gpt4o_mini_life_hacks_qa_lh9_plan_story_fixed_v1.json",
  srcImagesDir: "output/v2/paid_qa/lh9_pexels_stock_images",
  fixedImagesDir: "output/v2/paid_qa/lh9_pexels_stock_images_fixed",
  pexelsCallsUsed,
  replacedScenes,
  keptScenes: ALL_SCENES.filter((n) => !replacedScenes.includes(n)),
  qaFail,
  fixLog,
  perScene,
  knownRisks: [
    replacedScenes.includes(10)
      ? null
      : "scene 10 교체 실패 — 기존 이미지에 사람 등장 가능성. 무음 렌더 후 프레임 QA에서 확인 필요.",
  ].filter(Boolean),
  noPaidApiUsed: true,
  noPollinationsUsed: true,
  noOpenAiUsed: true,
};

const summaryPath = join(ROOT, "output/v2/paid_qa/lh9_pexels_stock_image_check_fixed.json");
writeFileSync(summaryPath, JSON.stringify(fixedSummary, null, 2), "utf8");

const fixLogPath = join(OUT_DIR, "fix_log.json");
writeFileSync(fixLogPath, JSON.stringify(fixLog, null, 2), "utf8");

// ── 최종 출력 ─────────────────────────────────────────────────────────────────
console.log(`\n=== Fix 결과 요약 ===`);
console.log(`  Pexels 호출: ${pexelsCallsUsed}회`);
console.log(`  교체 성공: scene ${replacedScenes.join(", ") || "없음"}`);
console.log(`  기존 유지: scene ${ALL_SCENES.filter((n) => !replacedScenes.includes(n)).join(", ")}`);
console.log(`  QA 실패: ${qaFail}건`);
console.log(`  fixed 이미지 폴더: ${OUT_DIR}`);
console.log(`  fixed summary: ${summaryPath}`);
console.log(`  fix log: ${fixLogPath}`);
console.log(`  noPaidApiUsed: true`);
console.log("\n=== Fix 완료 ===");
