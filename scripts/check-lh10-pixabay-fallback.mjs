/**
 * check-lh10-pixabay-fallback.mjs
 * LH-10 plan의 fallbackSearchQuery 기준 Pixabay 검색 동작 검증
 *
 * Usage: node scripts/check-lh10-pixabay-fallback.mjs
 *
 * - API 호출: Pixabay만, 최대 10회
 * - OpenAI / Pexels / ElevenLabs / Perplexity / Imagen 호출 금지
 * - ALLOW_PIXABAY 스크립트 내부에서 임시 true → 완료 후 원복
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// ── 환경변수 로드 (.env.local) ─────────────────────────────────────────
const envPath = join(ROOT, ".env.local");
const envRaw = readFileSync(envPath, "utf8");
const envMap = new Map();
for (const line of envRaw.split("\n")) {
  const t = line.trim();
  if (!t || t.startsWith("#")) continue;
  const eq = t.indexOf("=");
  if (eq === -1) continue;
  envMap.set(t.slice(0, eq).trim(), t.slice(eq + 1).trim());
}

// ── 보안: 키 존재 여부만 확인, 값 출력 금지 ──────────────────────────────
const PIXABAY_API_KEY = envMap.get("PIXABAY_API_KEY") || "";
const originalAllowPixabay = envMap.get("ALLOW_PIXABAY") || "false";

if (!PIXABAY_API_KEY) {
  console.error("PIXABAY_API_KEY=missing — 스크립트 중단");
  process.exit(1);
}
console.log("PIXABAY_API_KEY=present ✅");
console.log(`ALLOW_PIXABAY 원래 값: ${originalAllowPixabay}`);

// ── ALLOW_PIXABAY 임시 활성화 ────────────────────────────────────────────
function setEnvFlag(key, value) {
  const lines = readFileSync(envPath, "utf8").split("\n");
  const pattern = new RegExp(`^\\s*${key}\\s*=`);
  let found = false;
  const updated = lines.map((line) => {
    if (pattern.test(line)) { found = true; return `${key}=${value}`; }
    return line;
  });
  if (!found) updated.push(`${key}=${value}`);
  writeFileSync(envPath, updated.join("\n"), "utf8");
}

setEnvFlag("ALLOW_PIXABAY", "true");
console.log("ALLOW_PIXABAY=true (임시 활성화)");

// ── 플랜 로드 ────────────────────────────────────────────────────────────
const PLAN_PATH = join(ROOT, "output/v2/paid_qa/gpt4o_mini_life_hacks_qa_lh10_plan_story_fixed_v1_motion_safe.json");
const plan = JSON.parse(readFileSync(PLAN_PATH, "utf8"));
const scenes = plan.scenes;

// ── Pixabay 검색 함수 (lib/pixabay.ts 로직 인라인 — import 없이 독립 실행) ──
async function searchPixabay(query) {
  const url = new URL("https://pixabay.com/api/");
  url.searchParams.set("key", PIXABAY_API_KEY);
  url.searchParams.set("q", query);
  url.searchParams.set("image_type", "photo");
  url.searchParams.set("orientation", "vertical");
  url.searchParams.set("per_page", "10");
  url.searchParams.set("safesearch", "true");
  url.searchParams.set("lang", "en");

  const response = await fetch(url.toString());
  if (!response.ok) return { ok: false, status: response.status, result: null };
  const data = await response.json();
  const hits = data.hits ?? [];
  if (hits.length === 0) return { ok: false, status: 200, result: null };

  // 세로 비율 높은 순 정렬
  const sorted = [...hits].sort((a, b) => {
    const rA = a.imageHeight / (a.imageWidth || 1);
    const rB = b.imageHeight / (b.imageWidth || 1);
    return rB - rA;
  });

  const hit = sorted[0];
  return {
    ok: true,
    status: 200,
    result: {
      imageUrl: hit.largeImageURL || hit.webformatURL,
      photographer: hit.user,
      sourceUrl: hit.pageURL,
      dimensions: `${hit.imageWidth}x${hit.imageHeight}`,
      totalHits: data.totalHits,
    },
  };
}

// ── 검증 실행 (최대 10씬) ──────────────────────────────────────────────
const OUT_DIR = join(ROOT, "output/v2/paid_qa");
mkdirSync(OUT_DIR, { recursive: true });

const results = [];
let successCount = 0;
let callCount = 0;
const MAX_CALLS = 10;

console.log("\n=== Pixabay 검색 검증 시작 ===");

for (const scene of scenes) {
  if (callCount >= MAX_CALLS) {
    console.log(`[call limit] 최대 ${MAX_CALLS}회 도달 — 나머지 씬 skip`);
    results.push({
      sceneNumber: scene.sceneNumber,
      caption: scene.caption,
      query: scene.fallbackSearchQuery || "(없음)",
      status: "skipped_call_limit",
      result: null,
    });
    continue;
  }

  const query = scene.fallbackSearchQuery || scene.imagePrompt?.split(",")[0]?.trim() || "household object";
  console.log(`\nScene ${scene.sceneNumber}: "${scene.caption}" → query="${query}"`);

  let searchResult;
  try {
    callCount++;
    searchResult = await searchPixabay(query);
  } catch (err) {
    console.error(`  ERROR: ${err.message}`);
    results.push({
      sceneNumber: scene.sceneNumber,
      caption: scene.caption,
      query,
      status: "error",
      error: err.message,
      result: null,
    });
    continue;
  }

  if (searchResult.ok && searchResult.result) {
    successCount++;
    console.log(`  ✅ 성공: ${searchResult.result.sourceUrl}`);
    console.log(`     photographer: ${searchResult.result.photographer}`);
    console.log(`     dimensions: ${searchResult.result.dimensions}`);
    results.push({
      sceneNumber: scene.sceneNumber,
      caption: scene.caption,
      query,
      status: "success",
      result: {
        sourceUrl: searchResult.result.sourceUrl,
        photographer: searchResult.result.photographer,
        dimensions: searchResult.result.dimensions,
        totalHits: searchResult.result.totalHits,
        // imageUrl은 저장하지 않음 (필요 시 sourceUrl에서 재검색)
      },
    });
  } else {
    console.warn(`  ❌ 실패: status=${searchResult.status}, hits=0`);
    results.push({
      sceneNumber: scene.sceneNumber,
      caption: scene.caption,
      query,
      status: "not_found",
      httpStatus: searchResult.status,
      result: null,
    });
  }

  // 연속 호출 간 짧은 딜레이 (rate limit 대응)
  await new Promise((r) => setTimeout(r, 300));
}

// ── ALLOW_PIXABAY 원복 ──────────────────────────────────────────────────
setEnvFlag("ALLOW_PIXABAY", originalAllowPixabay);
console.log(`\nALLOW_PIXABAY=${originalAllowPixabay} (원복 완료) ✅`);

// ── summary 저장 ─────────────────────────────────────────────────────────
const summary = {
  generatedAt: new Date().toISOString(),
  plan: PLAN_PATH,
  totalScenes: scenes.length,
  testedScenes: callCount,
  skippedScenes: scenes.length - callCount,
  successCount,
  failCount: callCount - successCount,
  successRate: `${Math.round((successCount / Math.max(callCount, 1)) * 100)}%`,
  allowPixabayRestored: originalAllowPixabay,
  scenes: results,
  notes: [
    "imageUrl은 보안상 summary에 저장하지 않음 — sourceUrl에서 재검색 가능",
    "Pixabay largeImageURL은 portrait 비율 우선 정렬 후 최상위 hit 사용",
    "OpenAI / Pexels / ElevenLabs / Perplexity / Imagen 호출 없음",
  ],
};

const outPath = join(OUT_DIR, "lh10_pixabay_fallback_check.json");
writeFileSync(outPath, JSON.stringify(summary, null, 2), "utf8");

console.log("\n=== 결과 요약 ===");
console.log(`총 씬: ${scenes.length} | 테스트: ${callCount} | 성공: ${successCount} | 실패: ${callCount - successCount}`);
console.log(`성공률: ${summary.successRate}`);
console.log(`summary 저장: ${outPath}`);
