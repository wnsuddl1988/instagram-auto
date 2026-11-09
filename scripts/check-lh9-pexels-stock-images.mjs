/**
 * check-lh9-pexels-stock-images.mjs
 *
 * QA-LH-9 story_fixed_v1 plan 기준 Pexels stock 이미지 검색/다운로드 검증 스크립트.
 * Pexels API 호출만 수행하며 OpenAI / Imagen / TTS / Pollinations 호출 없음.
 *
 * 실행:
 *   node scripts/check-lh9-pexels-stock-images.mjs
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

// ── Fixed plan 로드 ─────────────────────────────────────────────────────────────
const PLAN_PATH = "output/v2/paid_qa/gpt4o_mini_life_hacks_qa_lh9_plan_story_fixed_v1.json";
const plan = JSON.parse(readFileSync(join(ROOT, PLAN_PATH), "utf8"));
console.log(`=== LH-9 fixed plan: "${plan.title}" (${plan.scenes.length}씬) ===`);
console.log(`    topTitle: "${plan.topTitle}"\n`);

// ── 출력 디렉토리 준비 ────────────────────────────────────────────────────────
const outDir = join(ROOT, "output/v2/paid_qa/lh9_pexels_stock_images");
mkdirSync(outDir, { recursive: true });

// ── HVAC/오염 키워드 필터 ────────────────────────────────────────────────────
// 결과 URL/photographer에 이런 단어가 있으면 reject
const HVAC_REJECT_KEYWORDS = [
  "hvac", "air-condition", "air_condition", "aircon", "technician",
  "industrial", "factory", "workplace", "office", "compressor",
  "mechanic", "engineer-at-work", "shirts", "clothing", "t-shirt",
  "fashion", "apparel", "supermarket-aisle", "grocery-store", "mall"
];

function hasHvacRisk(photo) {
  const combined = [
    photo.url || "",
    photo.photographer || "",
    photo.alt || "",
  ].join(" ").toLowerCase();
  return HVAC_REJECT_KEYWORDS.some((kw) => combined.includes(kw));
}

// scene 4 대체 쿼리 순서
const SCENE4_FALLBACKS = [
  "open refrigerator door close up",
  "refrigerator door shelves close up",
  "condensation inside refrigerator door",
  "refrigerator thermometer inside fridge",
];

// scene 10 적합성 검사 키워드 (URL/alt에 하나라도 있으면 OK)
const SCENE10_OK_KEYWORDS = [
  "refrigerator", "fridge", "sauce", "condiment", "door-shelf",
  "kitchen", "food-storage", "pantry"
];

function isScene10Ok(photo) {
  const combined = [photo.url || "", photo.alt || ""].join(" ").toLowerCase();
  return SCENE10_OK_KEYWORDS.some((kw) => combined.includes(kw));
}

// ── Pexels search ──────────────────────────────────────────────────────────────
async function searchPexels(query, orientation = "portrait", perPage = 8) {
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=${orientation}`;
  const res = await fetch(url, { headers: { Authorization: PEXELS_API_KEY } });
  if (!res.ok) throw new Error(`Pexels search HTTP ${res.status}: query="${query}"`);
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

// ── 씬별 검증 ─────────────────────────────────────────────────────────────────
const results = [];
let successCount = 0;
let pexelsCallsTotal = 0;

for (let i = 0; i < plan.scenes.length; i++) {
  const scene = plan.scenes[i];
  const sceneNum = scene.sceneNumber ?? i + 1;
  const baseQuery =
    scene.fallbackSearchQuery ||
    (scene.imagePrompt ?? "").split(",")[0].trim().slice(0, 80) ||
    "household object kitchen";

  const padded = String(sceneNum).padStart(2, "0");
  const filePath = join(outDir, `scene_${padded}.jpg`);

  const result = {
    sceneNumber: sceneNum,
    query: baseQuery,
    actualQueryUsed: baseQuery,
    replacementUsed: false,
    replacementQueries: [],
    searchSuccess: false,
    downloadSuccess: false,
    fileSizeBytes: 0,
    imageUrl: null,
    photographer: null,
    sourceUrl: null,
    pexelsId: null,
    savedPath: null,
    error: null,
    rejectionReason: null,
    needsManualReview: false,
    reviewNote: null,
  };

  process.stdout.write(`[scene ${padded}] query: "${baseQuery}" ... `);

  try {
    // scene 4: HVAC 회피 로직 — 먼저 기본 쿼리로 시도, reject되면 대체 쿼리
    let photos = [];
    let chosenPhoto = null;
    let usedQuery = baseQuery;

    if (sceneNum === 4) {
      // scene 4: 기본 쿼리 시도
      photos = await searchPexels(baseQuery);
      pexelsCallsTotal++;
      // HVAC 필터: 첫 결과가 오염이면 reject
      const candidate = photos[0];
      if (candidate && hasHvacRisk(candidate)) {
        console.log(`\n  ⚠️ scene 4: HVAC 위험 감지 (${candidate.photographer}) — 대체 쿼리 시도`);
        result.rejectionReason = `HVAC/industrial risk: ${candidate.photographer}`;
        result.replacementUsed = true;
        for (const altQ of SCENE4_FALLBACKS) {
          const altPhotos = await searchPexels(altQ);
          pexelsCallsTotal++;
          result.replacementQueries.push(altQ);
          await new Promise((r) => setTimeout(r, 400));
          const altCandidate = altPhotos[0];
          if (altCandidate && !hasHvacRisk(altCandidate)) {
            chosenPhoto = altCandidate;
            usedQuery = altQ;
            console.log(`  ✅ scene 4 대체 쿼리 성공: "${altQ}" (${altCandidate.photographer})`);
            break;
          }
        }
        if (!chosenPhoto) {
          result.error = "HVAC 회피 실패: 모든 대체 쿼리에서 적합 이미지 없음";
          result.needsManualReview = true;
          result.reviewNote = "scene 4 HVAC 필터 통과 실패 — 수동 이미지 선정 필요";
          console.log(`  ❌ scene 4: 대체 쿼리 모두 실패`);
        }
      } else if (candidate) {
        chosenPhoto = candidate;
      }
    } else {
      photos = await searchPexels(baseQuery);
      pexelsCallsTotal++;
      chosenPhoto = photos[0] ?? null;
    }

    await new Promise((r) => setTimeout(r, 400));

    if (!chosenPhoto) {
      result.error = result.error ?? "검색 결과 없음";
      if (!result.needsManualReview) console.log("❌ 검색 결과 없음");
    } else {
      result.searchSuccess = true;
      result.actualQueryUsed = usedQuery;
      result.imageUrl = chosenPhoto.src?.portrait || chosenPhoto.src?.large2x || chosenPhoto.src?.original;
      result.photographer = chosenPhoto.photographer;
      result.sourceUrl = chosenPhoto.url;
      result.pexelsId = chosenPhoto.id;

      // scene 10 적합성 검사
      if (sceneNum === 10 && !isScene10Ok(chosenPhoto)) {
        result.needsManualReview = true;
        result.reviewNote = `scene 10: 소스류/냉장고 관련 키워드 미확인 (photographer: ${chosenPhoto.photographer}, url: ${chosenPhoto.url})`;
        console.log(`\n  ⚠️ scene 10: 적합성 불확실 — ${chosenPhoto.photographer}`);
      }

      const byteLen = await downloadToFile(result.imageUrl, filePath);
      if (byteLen > 0) {
        result.downloadSuccess = true;
        result.fileSizeBytes = byteLen;
        result.savedPath = filePath;
        successCount++;
        const kb = (byteLen / 1024).toFixed(0);
        const reviewTag = result.needsManualReview ? " ⚠️ needs_review" : "";
        const replaceTag = result.replacementUsed ? ` [대체쿼리: "${usedQuery}"]` : "";
        console.log(`✅ ${kb}KB (${chosenPhoto.photographer})${replaceTag}${reviewTag}`);
      } else {
        result.error = "다운로드 실패";
        console.log("❌ 다운로드 실패");
      }
    }
  } catch (err) {
    result.error = err instanceof Error ? err.message : String(err);
    console.log(`❌ 오류: ${result.error}`);
  }

  results.push(result);

  if (i < plan.scenes.length - 1) {
    await new Promise((r) => setTimeout(r, 400));
  }
}

// ── 이미지 기본 QA (0바이트 + 파일 크기) ─────────────────────────────────────
console.log("\n── 이미지 기본 QA ──");
for (const r of results) {
  if (!r.downloadSuccess) continue;
  try {
    const stat = statSync(r.savedPath);
    if (stat.size === 0) {
      r.error = "파일 0바이트";
      r.downloadSuccess = false;
      successCount--;
      console.log(`  ⚠️ scene ${r.sceneNumber}: 0바이트 파일 감지`);
    } else {
      const reviewTag = r.needsManualReview ? " ⚠️ 수동검토필요" : "";
      console.log(`  ✅ scene ${r.sceneNumber}: ${(stat.size / 1024).toFixed(0)}KB OK${reviewTag}`);
    }
  } catch {
    console.log(`  ⚠️ scene ${r.sceneNumber}: 파일 크기 확인 실패`);
  }
}

// ── scene 4/10 전용 리포트 ───────────────────────────────────────────────────
const s4 = results.find((r) => r.sceneNumber === 4);
const s10 = results.find((r) => r.sceneNumber === 10);

console.log("\n── scene 4 HVAC 회피 결과 ──");
if (s4) {
  console.log(`  query 원본: "${s4.query}"`);
  console.log(`  실제 사용: "${s4.actualQueryUsed}"`);
  console.log(`  대체쿼리 사용: ${s4.replacementUsed}`);
  if (s4.replacementQueries.length > 0) console.log(`  시도 쿼리: ${JSON.stringify(s4.replacementQueries)}`);
  console.log(`  결과: ${s4.downloadSuccess ? `✅ ${s4.photographer}` : `❌ ${s4.error}`}`);
  if (s4.rejectionReason) console.log(`  rejection: ${s4.rejectionReason}`);
}

console.log("\n── scene 10 주제 적합성 결과 ──");
if (s10) {
  console.log(`  query: "${s10.actualQueryUsed}"`);
  console.log(`  결과: ${s10.downloadSuccess ? `✅ ${s10.photographer}` : `❌ ${s10.error}`}`);
  console.log(`  sourceUrl: ${s10.sourceUrl ?? "없음"}`);
  console.log(`  needsManualReview: ${s10.needsManualReview}`);
  if (s10.reviewNote) console.log(`  reviewNote: ${s10.reviewNote}`);
}

// ── summary 저장 ──────────────────────────────────────────────────────────────
const needsManualReviewScenes = results
  .filter((r) => r.needsManualReview)
  .map((r) => ({ sceneNumber: r.sceneNumber, reviewNote: r.reviewNote }));

const summary = {
  checkedAt: new Date().toISOString(),
  planTitle: plan.title,
  planPath: PLAN_PATH,
  provider: "pexels",
  totalScenes: plan.scenes.length,
  successCount,
  pexelsCallsTotal,
  failedScenes: results
    .filter((r) => !r.downloadSuccess)
    .map((r) => ({ sceneNumber: r.sceneNumber, query: r.query, error: r.error })),
  needsManualReviewScenes,
  scene4Report: {
    originalQuery: s4?.query,
    actualQueryUsed: s4?.actualQueryUsed,
    replacementUsed: s4?.replacementUsed,
    replacementQueries: s4?.replacementQueries,
    rejectionReason: s4?.rejectionReason,
    photographer: s4?.photographer,
    sourceUrl: s4?.sourceUrl,
    downloadSuccess: s4?.downloadSuccess,
  },
  scene10Report: {
    query: s10?.actualQueryUsed,
    photographer: s10?.photographer,
    sourceUrl: s10?.sourceUrl,
    downloadSuccess: s10?.downloadSuccess,
    needsManualReview: s10?.needsManualReview,
    reviewNote: s10?.reviewNote,
  },
  perScene: results.map((r) => ({
    sceneNumber: r.sceneNumber,
    query: r.query,
    actualQueryUsed: r.actualQueryUsed,
    replacementUsed: r.replacementUsed,
    searchSuccess: r.searchSuccess,
    downloadSuccess: r.downloadSuccess,
    fileSizeKB: r.fileSizeBytes ? +(r.fileSizeBytes / 1024).toFixed(1) : 0,
    photographer: r.photographer,
    sourceUrl: r.sourceUrl,
    savedPath: r.savedPath,
    rejectionReason: r.rejectionReason,
    needsManualReview: r.needsManualReview,
    reviewNote: r.reviewNote,
    error: r.error,
  })),
  noPaidApiUsed: true,
  noPollinationsUsed: true,
  noOpenAiUsed: true,
};

const summaryPath = join(ROOT, "output/v2/paid_qa/lh9_pexels_stock_image_check.json");
writeFileSync(summaryPath, JSON.stringify(summary, null, 2), "utf8");

// ── 최종 출력 ─────────────────────────────────────────────────────────────────
console.log(`\n=== 결과 요약 ===`);
console.log(`  성공: ${successCount} / ${plan.scenes.length}씬`);
console.log(`  Pexels API 호출 총 횟수: ${pexelsCallsTotal}`);
if (needsManualReviewScenes.length > 0) {
  console.log(`  수동검토 필요:`);
  for (const m of needsManualReviewScenes) {
    console.log(`    scene ${m.sceneNumber}: ${m.reviewNote}`);
  }
}
if (summary.failedScenes.length > 0) {
  console.log(`  실패:`);
  for (const f of summary.failedScenes) {
    console.log(`    scene ${f.sceneNumber}: "${f.query}" → ${f.error}`);
  }
}
console.log(`  이미지 저장 폴더: ${outDir}`);
console.log(`  summary JSON: ${summaryPath}`);
console.log(`  noPaidApiUsed: ${summary.noPaidApiUsed}`);
console.log(`  noPollinationsUsed: ${summary.noPollinationsUsed}`);
console.log("\n=== 검증 완료 ===");
