/**
 * _lh10-visual-fix-v1.mjs
 * LH-10 visual fix — sc3/sc5/sc10(+sc8) 이미지 교체 + 무음 렌더 plan 생성
 *
 * - Pexels 우선, 실패 시 Pixabay fallback
 * - ALLOW_PIXABAY 임시 활성화 → 완료 후 false 원복
 * - OpenAI / ElevenLabs / TTS / Perplexity 호출 금지
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

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
  const updated = lines.map((l) => { if (pattern.test(l)) { found = true; return `${key}=${value}`; } return l; });
  if (!found) updated.push(`${key}=${value}`);
  writeFileSync(envPath, updated.join("\n"), "utf8");
}

const envMap = loadEnvMap();
const PEXELS_API_KEY = envMap.get("PEXELS_API_KEY") || "";
const PIXABAY_API_KEY = envMap.get("PIXABAY_API_KEY") || "";
const originalAllowPixabay = envMap.get("ALLOW_PIXABAY") || "false";

// ── 경로 설정 ─────────────────────────────────────────────────────────────
const PLAN_SRC = join(ROOT, "output/v2/lh10_elevenlabs_tts_test/plan.json");
const OUT_DIR  = join(ROOT, "output/v2/paid_qa/lh10_visual_fixed_v1");
const IMG_DIR  = join(OUT_DIR, "images");
mkdirSync(IMG_DIR, { recursive: true });

const RENDER_PLAN_PATH = join(OUT_DIR, "render_plan.json");

// ── 검색 쿼리 정의 ────────────────────────────────────────────────────────
const SCENE_FIXES = [
  {
    sceneNumber: 3,
    caption: "범인은 잔여물",
    narration: "남은 세제가 습기를 붙잡고, 그 틈에서 냄새균이 늘어요.",
    required: true,
    queries: [
      "laundry detergent residue towel close up",
      "soap residue washing machine drum",
      "detergent foam towel fabric",
      "dirty towel close up laundry",
    ],
    constraint: "인물 중심 아닌 오브젝트 클로즈업 필요",
  },
  {
    sceneNumber: 5,
    caption: "헹굼이 더 중요",
    narration: "냄새가 심한 날은 세제 추가보다 헹굼 한 번이 더 효과적이에요.",
    required: true,
    queries: [
      "home washing machine rinse cycle",
      "washing machine drum water close up",
      "laundry rinse cycle home appliance",
      "washing machine water laundry",
    ],
    constraint: "가정용 세탁기 톤",
  },
  {
    sceneNumber: 10,
    caption: "다음 세탁 때 확인",
    narration: "다음 세탁엔 세제 절반, 헹굼 한 번, 바로 건조만 기억하세요.",
    required: true,
    queries: [
      "clean folded white towels laundry basket",
      "fresh clean towels basket laundry",
      "folded white towels laundry room",
      "clean towels and detergent bottle",
    ],
    constraint: "clean/folded 느낌 필수. 뭉쳐진 빨래 아님",
  },
  {
    sceneNumber: 8,
    caption: "식초는 가끔만",
    narration: "식초는 냄새 잡는 데 도움 되지만, 매번 많이 넣는 건 피하세요.",
    required: false,
    queries: [
      "white vinegar bottle laundry towel",
      "vinegar and towels laundry",
      "cleaning vinegar bottle simple",
    ],
    constraint: "단순한 식초병 오브젝트 우선",
  },
];

// ── Pexels 검색 ───────────────────────────────────────────────────────────
async function searchPexels(query) {
  if (!PEXELS_API_KEY) return null;
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=5&orientation=portrait`;
  const res = await fetch(url, { headers: { Authorization: PEXELS_API_KEY } });
  if (!res.ok) return null;
  const data = await res.json();
  const photos = data.photos ?? [];
  if (photos.length === 0) return null;
  const photo = photos[0];
  return {
    imageUrl: photo.src.portrait || photo.src.large2x || photo.src.original,
    photographer: photo.photographer,
    sourceUrl: photo.url,
    provider: "pexels",
  };
}

// ── Pixabay 검색 ──────────────────────────────────────────────────────────
async function searchPixabay(query) {
  if (!PIXABAY_API_KEY) return null;
  const url = new URL("https://pixabay.com/api/");
  url.searchParams.set("key", PIXABAY_API_KEY);
  url.searchParams.set("q", query);
  url.searchParams.set("image_type", "photo");
  url.searchParams.set("orientation", "vertical");
  url.searchParams.set("per_page", "10");
  url.searchParams.set("safesearch", "true");
  url.searchParams.set("lang", "en");
  const res = await fetch(url.toString());
  if (!res.ok) return null;
  const data = await res.json();
  const hits = data.hits ?? [];
  if (hits.length === 0) return null;
  const sorted = [...hits].sort((a, b) => (b.imageHeight / (b.imageWidth || 1)) - (a.imageHeight / (a.imageWidth || 1)));
  const hit = sorted[0];
  return {
    imageUrl: hit.largeImageURL || hit.webformatURL,
    photographer: hit.user,
    sourceUrl: hit.pageURL,
    provider: "pixabay",
  };
}

// ── 이미지 다운로드 ───────────────────────────────────────────────────────
async function downloadImage(url, filePath) {
  const res = await fetch(url);
  if (!res.ok) return false;
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 10000) return false; // 10KB 미만 reject
  writeFileSync(filePath, buf);
  return true;
}

// ── ALLOW_PIXABAY 임시 활성화 ────────────────────────────────────────────
setEnvFlag("ALLOW_PIXABAY", "true");
console.log("ALLOW_PIXABAY=true (임시 활성화)");

// ── 교체 실행 ─────────────────────────────────────────────────────────────
const plan = JSON.parse(readFileSync(PLAN_SRC, "utf8"));
const replacements = [];
let totalCalls = 0;

for (const fix of SCENE_FIXES) {
  const sceneIdx = plan.scenes.findIndex(s => s.sceneNumber === fix.sceneNumber);
  if (sceneIdx === -1) { console.warn(`scene ${fix.sceneNumber} not found`); continue; }

  const imgPath = join(IMG_DIR, `scene_${String(fix.sceneNumber).padStart(2,"0")}.jpg`);
  let found = null;
  let usedQuery = null;

  console.log(`\n[Scene ${fix.sceneNumber}] "${fix.caption}" — 교체 시도`);

  for (const query of fix.queries) {
    console.log(`  Pexels: "${query}"`);
    totalCalls++;
    const pexelsResult = await searchPexels(query);
    if (pexelsResult) {
      const ok = await downloadImage(pexelsResult.imageUrl, imgPath);
      if (ok) {
        found = { ...pexelsResult, query };
        console.log(`  ✅ Pexels 성공: ${pexelsResult.sourceUrl}`);
        break;
      }
    }
    // Pexels 실패 → Pixabay fallback
    console.log(`  Pixabay fallback: "${query}"`);
    totalCalls++;
    const pixabayResult = await searchPixabay(query);
    if (pixabayResult) {
      const ok = await downloadImage(pixabayResult.imageUrl, imgPath);
      if (ok) {
        found = { ...pixabayResult, query };
        console.log(`  ✅ Pixabay 성공: ${pixabayResult.sourceUrl}`);
        break;
      }
    }
    await new Promise(r => setTimeout(r, 300));
  }

  if (found) {
    plan.scenes[sceneIdx].localImagePath = imgPath;
    replacements.push({ sceneNumber: fix.sceneNumber, ...found, savedPath: imgPath });
    console.log(`  → scene_${fix.sceneNumber} 교체 완료 (${found.provider})`);
  } else {
    const status = fix.required ? "⚠️ REQUIRED 실패 — 기존 이미지 유지" : "ℹ️ optional — 기존 유지";
    console.warn(`  ${status}`);
    replacements.push({ sceneNumber: fix.sceneNumber, status: "kept_original", required: fix.required });
  }
}

// ── ALLOW_PIXABAY 원복 ──────────────────────────────────────────────────
setEnvFlag("ALLOW_PIXABAY", originalAllowPixabay);
console.log(`\nALLOW_PIXABAY=${originalAllowPixabay} 원복 ✅`);

// ── 무음 render_plan 저장 ────────────────────────────────────────────────
plan.narrationPath = null;
plan._renderMeta = {
  ...plan._renderMeta,
  narrationPath: null,
  silentRender: true,
  fixVersion: "visual_fixed_v1",
  renderedAt: new Date().toISOString().slice(0, 10),
  replacements,
};
writeFileSync(RENDER_PLAN_PATH, JSON.stringify(plan, null, 2), "utf8");
console.log("\nrender_plan.json 저장:", RENDER_PLAN_PATH);

// ── 교체 결과 요약 ──────────────────────────────────────────────────────
console.log("\n=== 교체 결과 요약 ===");
console.log(`총 API 호출: ${totalCalls}`);
replacements.forEach(r => {
  if (r.status === "kept_original") {
    console.log(`  sc${r.sceneNumber}: 유지 (${r.required ? "required 실패!" : "optional"})`);
  } else {
    console.log(`  sc${r.sceneNumber}: [${r.provider}] query="${r.query}"`);
    console.log(`         source: ${r.sourceUrl}`);
  }
});

// summary 중간 저장
const summaryPath = join(OUT_DIR, "qa_summary.json");
writeFileSync(summaryPath, JSON.stringify({ replacements, totalCalls, renderPlanPath: RENDER_PLAN_PATH, allowPixabayRestored: originalAllowPixabay }, null, 2), "utf8");
console.log("중간 summary 저장:", summaryPath);
