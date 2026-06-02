/**
 * check-lh8-pexels-stock-images.mjs
 *
 * LH-8 caption_natural_v1 plan 기준 Pexels stock 이미지 검색/다운로드 검증 스크립트.
 * Pexels API 호출만 수행하며 OpenAI / Imagen / TTS / Pollinations 호출 없음.
 *
 * 실행:
 *   node scripts/check-lh8-pexels-stock-images.mjs
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

// ── LH-8 caption_natural_v1 plan 로드 ─────────────────────────────────────────
const PLAN_PATH = "output/v2/paid_qa/gpt4o_mini_life_hacks_qa_lh8_plan_caption_natural_v1.json";
const plan = JSON.parse(readFileSync(join(ROOT, PLAN_PATH), "utf8"));
console.log(`=== LH-8 plan: "${plan.title}" (${plan.scenes.length}씬) ===\n`);

// ── 출력 디렉토리 준비 ────────────────────────────────────────────────────────
const outDir = join(ROOT, "output/v2/paid_qa/lh8_pexels_stock_images");
mkdirSync(outDir, { recursive: true });

// ── Pexels search ──────────────────────────────────────────────────────────────
async function searchPexels(query, orientation = "portrait") {
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=8&orientation=${orientation}`;
  const res = await fetch(url, { headers: { Authorization: PEXELS_API_KEY } });
  if (!res.ok) throw new Error(`Pexels search HTTP ${res.status}: query="${query}"`);
  const data = await res.json();
  const photos = data.photos ?? [];
  if (photos.length === 0) return null;
  const photo = photos[0]; // 첫 번째 결과 사용 (가장 관련도 높음)
  return {
    imageUrl: photo.src.portrait || photo.src.large2x || photo.src.original,
    photographer: photo.photographer,
    sourceUrl: photo.url,
    pexelsId: photo.id,
    width: photo.width,
    height: photo.height,
  };
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
    console.warn(`  ⚠️ 다운로드 실패: ${err instanceof Error ? err.message : err}`);
    return 0;
  }
}

// ── 씬별 검증 ─────────────────────────────────────────────────────────────────
const results = [];
let successCount = 0;

for (let i = 0; i < plan.scenes.length; i++) {
  const scene = plan.scenes[i];
  const sceneNum = scene.sceneNumber ?? i + 1;
  const query =
    scene.fallbackSearchQuery ||
    (scene.imagePrompt ?? "").split(",")[0].trim().slice(0, 80) ||
    "household object kitchen";

  process.stdout.write(`[scene ${String(sceneNum).padStart(2, "0")}] query: "${query}" ... `);

  const padded = String(sceneNum).padStart(2, "0");
  const filePath = join(outDir, `scene_${padded}.jpg`);
  const result = {
    sceneNumber: sceneNum,
    query,
    searchSuccess: false,
    downloadSuccess: false,
    fileSizeBytes: 0,
    imageUrl: null,
    photographer: null,
    sourceUrl: null,
    pexelsId: null,
    savedPath: null,
    error: null,
  };

  try {
    const found = await searchPexels(query);
    if (!found) {
      result.error = "검색 결과 없음";
      console.log("❌ 검색 결과 없음");
    } else {
      result.searchSuccess = true;
      result.imageUrl = found.imageUrl;
      result.photographer = found.photographer;
      result.sourceUrl = found.sourceUrl;
      result.pexelsId = found.pexelsId;

      const byteLen = await downloadToFile(found.imageUrl, filePath);
      if (byteLen > 0) {
        result.downloadSuccess = true;
        result.fileSizeBytes = byteLen;
        result.savedPath = filePath;
        successCount++;
        const kb = (byteLen / 1024).toFixed(0);
        console.log(`✅ ${kb}KB (${found.photographer})`);
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

  // Pexels rate limit 대비 씬 사이 간격
  if (i < plan.scenes.length - 1) {
    await new Promise((r) => setTimeout(r, 400));
  }
}

// ── 이미지 기본 QA (0바이트 체크) ────────────────────────────────────────────
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
      console.log(`  ✅ scene ${r.sceneNumber}: ${(stat.size / 1024).toFixed(0)}KB OK`);
    }
  } catch {
    console.log(`  ⚠️ scene ${r.sceneNumber}: 파일 크기 확인 실패`);
  }
}

// ── summary 저장 ──────────────────────────────────────────────────────────────
const summary = {
  checkedAt: new Date().toISOString(),
  planTitle: plan.title,
  planPath: PLAN_PATH,
  provider: "pexels",
  totalScenes: plan.scenes.length,
  successCount,
  failedScenes: results
    .filter((r) => !r.downloadSuccess)
    .map((r) => ({ sceneNumber: r.sceneNumber, query: r.query, error: r.error })),
  perScene: results.map((r) => ({
    sceneNumber: r.sceneNumber,
    query: r.query,
    searchSuccess: r.searchSuccess,
    downloadSuccess: r.downloadSuccess,
    fileSizeKB: r.fileSizeBytes ? +(r.fileSizeBytes / 1024).toFixed(1) : 0,
    photographer: r.photographer,
    sourceUrl: r.sourceUrl,
    savedPath: r.savedPath,
    error: r.error,
  })),
  noPaidApiUsed: true,
  noPollinationsUsed: true,
};

const summaryPath = join(ROOT, "output/v2/paid_qa/lh8_pexels_stock_image_check.json");
writeFileSync(summaryPath, JSON.stringify(summary, null, 2), "utf8");

// ── 최종 출력 ─────────────────────────────────────────────────────────────────
console.log(`\n=== 결과 요약 ===`);
console.log(`  성공: ${successCount} / ${plan.scenes.length}씬`);
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
