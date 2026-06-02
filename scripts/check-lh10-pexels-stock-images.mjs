/**
 * check-lh10-pexels-stock-images.mjs
 *
 * QA-LH-10 story_fixed_v1 plan 기준 Pexels stock 이미지 검색/다운로드 검증 스크립트.
 * Pexels API 호출만 수행하며 OpenAI / Imagen / TTS / Pollinations 호출 없음.
 *
 * 실행:
 *   pnpm node scripts/check-lh10-pexels-stock-images.mjs
 */

import { readFileSync, mkdirSync, writeFileSync, existsSync, statSync } from "fs";
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

// ── 유료 API 호출 차단 확인 ───────────────────────────────────────────────────
const PAID_API_ENABLED = process.env.PAID_API_ENABLED === "true";
if (PAID_API_ENABLED) {
  console.error("⛔ PAID_API_ENABLED=true — 이 스크립트는 유료 API가 꺼진 상태에서 실행해야 합니다.");
  process.exit(1);
}
console.log("✅ 유료 API 차단 확인:");
console.log(`   PAID_API_ENABLED=${process.env.PAID_API_ENABLED ?? "미설정(=false)"}`);
console.log(`   ALLOW_OPENAI_GENERATE=${process.env.ALLOW_OPENAI_GENERATE ?? "미설정"}`);
console.log(`   ALLOW_OPENAI_TTS=${process.env.ALLOW_OPENAI_TTS ?? "미설정"}`);
console.log(`   ALLOW_IMAGEN=${process.env.ALLOW_IMAGEN ?? "미설정"}`);
console.log(`   ALLOW_ELEVENLABS=${process.env.ALLOW_ELEVENLABS ?? "미설정"}`);
console.log();

const PEXELS_API_KEY = process.env.PEXELS_API_KEY || "";
if (!PEXELS_API_KEY) {
  console.error("⛔ PEXELS_API_KEY 없음 — .env.local에 PEXELS_API_KEY를 추가하세요.");
  process.exit(1);
}
console.log("✅ PEXELS_API_KEY 존재 확인 (값 비노출)\n");

// ── plan 로드 ──────────────────────────────────────────────────────────────────
const PLAN_PATH = join(ROOT, "output/v2/paid_qa/gpt4o_mini_life_hacks_qa_lh10_plan_story_fixed_v1.json");
const plan = JSON.parse(readFileSync(PLAN_PATH, "utf8"));
console.log(`=== LH-10 fixed plan: "${plan.topTitle}" (${plan.scenes.length}씬) ===\n`);

// ── Pre-fix: scene 7 motion character_pulse → slow_zoom_in ────────────────────
const MOTION_SAFE_PATH = join(ROOT, "output/v2/paid_qa/gpt4o_mini_life_hacks_qa_lh10_plan_story_fixed_v1_motion_safe.json");
const motionSafePlan = JSON.parse(JSON.stringify(plan)); // deep copy
let motionFixed = false;
motionSafePlan.scenes.forEach((s) => {
  if (s.sceneNumber === 7 && s.motion === "character_pulse") {
    s.motion = "slow_zoom_in";
    motionFixed = true;
  }
});
if (motionFixed) {
  motionSafePlan._meta = {
    ...motionSafePlan._meta,
    motionSafeAt: "2026-05-30",
    motionSafeNote: "scene 7 character_pulse → slow_zoom_in (living_tips 호환)",
  };
  writeFileSync(MOTION_SAFE_PATH, JSON.stringify(motionSafePlan, null, 2), "utf8");
  console.log("🔧 motion_safe plan 저장 완료:");
  console.log(`   scene 7 motion: character_pulse → slow_zoom_in`);
  console.log(`   경로: ${MOTION_SAFE_PATH}\n`);
} else {
  console.log("ℹ️  scene 7 motion이 이미 slow_zoom_in — motion_safe 변경 불필요\n");
  writeFileSync(MOTION_SAFE_PATH, JSON.stringify(motionSafePlan, null, 2), "utf8");
}

// ── 출력 디렉토리 준비 ────────────────────────────────────────────────────────
const OUT_DIR = join(ROOT, "output/v2/paid_qa/lh10_pexels_stock_images");
mkdirSync(OUT_DIR, { recursive: true });

// ── scene별 대체 쿼리 맵 ──────────────────────────────────────────────────────
const FALLBACK_QUERIES = {
  1: ["white towel stack bathroom", "clean towel folded", "fresh towel texture"],
  2: ["laundry detergent bottle", "detergent pouring laundry", "liquid detergent bottle"],
  3: ["washing machine detergent residue", "laundry detergent foam towel", "dirty towel close up"],
  4: ["laundry detergent measuring", "detergent scoop half", "detergent cup measurement"],
  5: ["washing machine water rinse", "laundry machine water", "washing machine cycle"],
  6: ["towel hanging drying rack", "wet towel rack laundry", "towel air dry indoor"],
  7: ["clean white towel stack", "fluffy bath towels", "soft towel texture close up"],
  8: ["white vinegar bottle", "vinegar laundry cleaning", "cleaning bottle towel laundry"],
  9: ["towel sunlight drying", "towel outdoor hanging", "laundry drying sunlight"],
  10: ["folded towels laundry room", "clean towels washing machine", "laundry basket towels"],
};

// ── 거부 키워드 필터 ──────────────────────────────────────────────────────────
const REJECT_KEYWORDS = [
  "person-washing", "woman-washing", "man-doing-laundry",
  "food", "kitchen-food", "vegetable", "fruit", "salad",
  "industrial", "factory", "office", "mechanic",
  "fashion", "clothing-store", "apparel", "supermarket",
];

function hasRejectRisk(photo) {
  const combined = [photo.url || "", photo.photographer || "", photo.alt || ""]
    .join(" ").toLowerCase();
  return REJECT_KEYWORDS.some((kw) => combined.includes(kw));
}

// scene 8 식초: 음식/주방 결과 거부
function isVinegarFoodRisk(photo) {
  const combined = [photo.url || "", photo.alt || ""].join(" ").toLowerCase();
  const FOOD_VINEGAR = ["salad", "cooking", "food", "recipe", "sauce", "dressing", "pickle"];
  return FOOD_VINEGAR.some((kw) => combined.includes(kw));
}

// ── Pexels search ──────────────────────────────────────────────────────────────
async function searchPexels(query, perPage = 8, orientation = "portrait") {
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=${orientation}`;
  const res = await fetch(url, { headers: { Authorization: PEXELS_API_KEY } });
  if (!res.ok) throw new Error(`Pexels HTTP ${res.status}: "${query}"`);
  const data = await res.json();
  return data.photos ?? [];
}

// ── 이미지 다운로드 ───────────────────────────────────────────────────────────
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

// ── 중복 감지 (Pexels ID 기준) ───────────────────────────────────────────────
const usedPexelsIds = new Set();

// ── 씬별 처리 ─────────────────────────────────────────────────────────────────
const results = [];
let successCount = 0;
let pexelsCallCount = 0;

for (let i = 0; i < plan.scenes.length; i++) {
  const scene = plan.scenes[i];
  const sceneNum = scene.sceneNumber ?? i + 1;
  const baseQuery = scene.fallbackSearchQuery || "household object laundry";
  const padded = String(sceneNum).padStart(2, "0");
  const filePath = join(OUT_DIR, `scene_${padded}.jpg`);

  const result = {
    sceneNumber: sceneNum,
    caption: scene.caption,
    narration: scene.narration,
    queryUsed: baseQuery,
    replacementUsed: false,
    replacementQueriesTried: [],
    imageUrl: null,
    photographer: null,
    sourceUrl: null,
    pexelsId: null,
    downloadedPath: null,
    fileSize: 0,
    duplicateOf: null,
    visualAssessment: "fail",
    notes: "",
    error: null,
  };

  process.stdout.write(`[scene ${padded}] "${baseQuery}" ... `);

  try {
    let photos = await searchPexels(baseQuery);
    pexelsCallCount++;
    await new Promise((r) => setTimeout(r, 350));

    // scene별 커스텀 필터
    const filterFn = sceneNum === 8
      ? (p) => !hasRejectRisk(p) && !isVinegarFoodRisk(p)
      : (p) => !hasRejectRisk(p);

    // 중복/거부 제외하고 첫 번째 후보 선택
    let chosenPhoto = photos.find((p) => filterFn(p) && !usedPexelsIds.has(p.id));

    // 후보 없으면 대체 쿼리 순차 시도
    if (!chosenPhoto) {
      const altQueries = FALLBACK_QUERIES[sceneNum] ?? [];
      for (const altQ of altQueries) {
        if (pexelsCallCount >= 15) break; // 총 호출 제한 방어
        result.replacementUsed = true;
        result.replacementQueriesTried.push(altQ);
        console.log(`\n  → 대체 쿼리: "${altQ}"`);
        const altPhotos = await searchPexels(altQ);
        pexelsCallCount++;
        await new Promise((r) => setTimeout(r, 350));
        chosenPhoto = altPhotos.find((p) => filterFn(p) && !usedPexelsIds.has(p.id));
        if (chosenPhoto) {
          result.queryUsed = altQ;
          console.log(`  ✅ 대체 성공: "${altQ}" (${chosenPhoto.photographer})`);
          break;
        }
      }
    }

    if (!chosenPhoto) {
      result.error = "적합 이미지 없음 (모든 대체 쿼리 소진)";
      result.visualAssessment = "fail";
      result.notes = "Pexels 결과 없거나 전부 거부됨";
      console.log("⛔ 실패");
      results.push(result);
      continue;
    }

    // 중복 체크
    if (usedPexelsIds.has(chosenPhoto.id)) {
      result.duplicateOf = chosenPhoto.id;
      result.notes += `중복 pexels ID ${chosenPhoto.id} 감지. `;
    }
    usedPexelsIds.add(chosenPhoto.id);

    // 다운로드
    const imgUrl = chosenPhoto.src?.portrait || chosenPhoto.src?.large2x || chosenPhoto.src?.large;
    const fileSize = await downloadToFile(imgUrl, filePath);

    result.imageUrl = imgUrl;
    result.photographer = chosenPhoto.photographer;
    result.sourceUrl = chosenPhoto.url;
    result.pexelsId = chosenPhoto.id;

    if (fileSize > 0) {
      result.downloadedPath = filePath;
      result.fileSize = fileSize;
      successCount++;

      // visual assessment
      const alt = (chosenPhoto.alt || "").toLowerCase();
      const url = (chosenPhoto.url || "").toLowerCase();

      // scene별 pass 기준 키워드
      const SCENE_OK_KEYWORDS = {
        1: ["towel", "laundry", "wash", "textile", "fabric"],
        2: ["detergent", "laundry", "bottle", "liquid", "wash"],
        3: ["washing", "machine", "laundry", "detergent", "towel", "fabric", "dirty"],
        4: ["detergent", "measure", "laundry", "bottle", "cup", "scoop"],
        5: ["washing", "machine", "water", "rinse", "laundry"],
        6: ["towel", "drying", "rack", "laundry", "hang", "dry"],
        7: ["towel", "clean", "soft", "fluffy", "fresh", "textile", "bathroom"],
        8: ["vinegar", "bottle", "laundry", "cleaning", "towel"],
        9: ["towel", "sunlight", "drying", "laundry", "outdoor", "hanging"],
        10: ["towel", "laundry", "basket", "folded", "clean", "washing"],
      };

      const okKws = SCENE_OK_KEYWORDS[sceneNum] ?? [];
      const combined = `${alt} ${url}`;
      const matchCount = okKws.filter((kw) => combined.includes(kw)).length;

      if (matchCount >= 2) {
        result.visualAssessment = "pass";
        result.notes += `OK (${matchCount}개 키워드 매칭)`;
      } else if (matchCount === 1) {
        result.visualAssessment = "minor";
        result.notes += `minor risk (${matchCount}개 키워드 매칭만) — human 확인 권장`;
      } else {
        result.visualAssessment = "minor";
        result.notes += `키워드 매칭 0 — alt/url 기준. 다운로드 성공, human 확인 권장`;
      }

      console.log(`✅ ${fileSize.toLocaleString()}B (${result.visualAssessment}) — ${chosenPhoto.photographer}`);
    } else {
      result.error = "다운로드 실패 (0 bytes)";
      result.visualAssessment = "fail";
      result.notes = "이미지 URL 접근 불가";
      console.log("⛔ 다운로드 실패");
    }
  } catch (err) {
    result.error = err.message;
    result.visualAssessment = "fail";
    result.notes = `오류: ${err.message}`;
    console.log(`⛔ 오류: ${err.message}`);
  }

  results.push(result);
}

// ── 중복 씬 2차 탐지 (같은 pexels ID 쌍) ─────────────────────────────────────
const idToScenes = {};
results.forEach((r) => {
  if (r.pexelsId) {
    if (!idToScenes[r.pexelsId]) idToScenes[r.pexelsId] = [];
    idToScenes[r.pexelsId].push(r.sceneNumber);
  }
});
Object.entries(idToScenes).forEach(([id, scenes]) => {
  if (scenes.length > 1) {
    scenes.forEach((sn) => {
      const r = results.find((x) => x.sceneNumber === sn);
      if (r) {
        r.duplicateOf = scenes.filter((x) => x !== sn)[0];
        r.visualAssessment = r.visualAssessment === "pass" ? "minor" : r.visualAssessment;
        r.notes += ` [중복 pexels ID ${id} — scene ${scenes.join(",")}]`;
      }
    });
  }
});

// ── summary 저장 ──────────────────────────────────────────────────────────────
const failedScenes = results.filter((r) => r.visualAssessment === "fail").map((r) => r.sceneNumber);
const minorScenes = results.filter((r) => r.visualAssessment === "minor").map((r) => r.sceneNumber);
const dupScenes = results.filter((r) => r.duplicateOf != null).map((r) => r.sceneNumber);

let recommendedNextStep;
if (failedScenes.length === 0 && minorScenes.length <= 2) {
  recommendedNextStep = "render_silent";
} else if (failedScenes.length > 0 || minorScenes.length > 2) {
  recommendedNextStep = "fix_queries_first";
} else {
  recommendedNextStep = "fix_queries_first";
}

const summary = {
  planFile: "gpt4o_mini_life_hacks_qa_lh10_plan_story_fixed_v1.json",
  motionSafeFile: "gpt4o_mini_life_hacks_qa_lh10_plan_story_fixed_v1_motion_safe.json",
  motionFixed,
  checkedAt: "2026-05-30",
  totalScenes: plan.scenes.length,
  successCount,
  failedScenes,
  minorRiskScenes: minorScenes,
  duplicateScenes: dupScenes,
  pexelsCallCount,
  provider: "pexels",
  noPaidApiUsed: true,
  forbiddenApisCalled: false,
  imageFolder: OUT_DIR,
  recommendedNextStep,
  scenes: results,
};

const SUMMARY_PATH = join(ROOT, "output/v2/paid_qa/lh10_pexels_stock_image_check.json");
writeFileSync(SUMMARY_PATH, JSON.stringify(summary, null, 2), "utf8");

// ── 콘솔 리포트 ────────────────────────────────────────────────────────────────
console.log("\n══════════════════════════════════════════");
console.log("QA-LH-10 Pexels 이미지 검증 결과");
console.log("══════════════════════════════════════════\n");

console.log(`📊 결과: ${successCount}/${plan.scenes.length} 성공`);
console.log(`   pexels API 호출 수: ${pexelsCallCount}회\n`);

console.log("🎬 씬별 요약:");
results.forEach((r) => {
  const icon = r.visualAssessment === "pass" ? "✅" : r.visualAssessment === "minor" ? "⚠️" : "⛔";
  const dup = r.duplicateOf ? ` [dup:scene${r.duplicateOf}]` : "";
  const alt = r.replacementUsed ? " [alt]" : "";
  console.log(`  ${icon} Scene ${String(r.sceneNumber).padStart(2, "0")} | "${r.queryUsed}"${alt}${dup}`);
  console.log(`         ${r.photographer ?? "N/A"} | ${(r.fileSize / 1024).toFixed(0)}KB | ${r.notes || r.error || ""}`);
});

if (failedScenes.length) {
  console.log(`\n⛔ 실패 씬: ${failedScenes.join(", ")}`);
}
if (minorScenes.length) {
  console.log(`⚠️  minor 씬: ${minorScenes.join(", ")}`);
}
if (dupScenes.length) {
  console.log(`🔁 중복 씬: ${dupScenes.join(", ")}`);
}

console.log(`\n🚦 권장 다음 단계: ${recommendedNextStep}`);
console.log(`\n📁 이미지 폴더: ${OUT_DIR}`);
console.log(`📄 summary: ${SUMMARY_PATH}`);
console.log("\n✅ 유료/금지 API 호출 없음 (Pexels만 사용)");
