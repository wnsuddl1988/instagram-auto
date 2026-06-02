/**
 * _fix-lh9-patch2.mjs
 * scene 4/6/10 재교체 패치 2차 — 2초 간격, 단순 쿼리
 */
import { readFileSync, existsSync, writeFileSync, statSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

function loadEnv(fp) {
  if (!existsSync(fp)) return;
  for (const line of readFileSync(fp, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    const k = t.slice(0, eq).trim();
    const v = t.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[k]) process.env[k] = v;
  }
}
loadEnv(join(ROOT, ".env.local"));

if (process.env.PAID_API_ENABLED === "true") { console.error("⛔ PAID_API_ENABLED=true"); process.exit(1); }
const KEY = process.env.PEXELS_API_KEY || "";
if (!KEY) { console.error("⛔ PEXELS_API_KEY 없음"); process.exit(1); }
console.log("✅ PEXELS_API_KEY 존재 확인\n");

const OUT_DIR = join(ROOT, "output/v2/paid_qa/lh9_pexels_stock_images_fixed");

// 현재 사용 중인 URL (중복 방지)
const BLOCKED_URLS = new Set([
  "https://www.pexels.com/photo/white-eggs-beside-polaroid-film-3588035/",
  "https://www.pexels.com/photo/well-stocked-refrigerator-with-various-groceries-31485991/",
  "https://www.pexels.com/photo/bottle-of-wines-in-a-fridge-11021160/", // scene 3
  "https://www.pexels.com/photo/opened-fridge-with-drinks-and-food-4061622/", // scene 9
  "https://www.pexels.com/photo/evening-kitchen-neon-home-4058699/", // bad scene 4
  "https://www.pexels.com/photo/legs-in-socks-in-fridge-16392191/", // bad scene 6
  "https://www.pexels.com/photo/close-up-photograph-of-beer-bottles-13104312/", // bad scene 10
]);

// 절대 안 되는 URL 패턴
const BAD_URL_PATTERNS = ["legs", "socks", "neon", "lamp", "pendant", "beer", "portrait-of"];

async function searchPexels(query, perPage = 10) {
  await new Promise(r => setTimeout(r, 2000)); // 2초 대기
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=portrait`;
  const r = await fetch(url, { headers: { Authorization: KEY } });
  if (!r.ok) {
    console.log(`  Pexels HTTP ${r.status} for "${query}"`);
    return [];
  }
  return (await r.json()).photos ?? [];
}

async function downloadToFile(imageUrl, filePath) {
  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), 30000);
  try {
    const res = await fetch(imageUrl, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" },
    });
    clearTimeout(tid);
    if (!res.ok) return 0;
    const buf = Buffer.from(await res.arrayBuffer());
    writeFileSync(filePath, buf);
    return buf.length;
  } catch {
    clearTimeout(tid);
    return 0;
  }
}

function isPhotoOk(photo, extraRejectPatterns = []) {
  if (BLOCKED_URLS.has(photo.url)) return false;
  const ul = photo.url.toLowerCase();
  const allBad = [...BAD_URL_PATTERNS, ...extraRejectPatterns];
  if (allBad.some(k => ul.includes(k))) return false;
  return true;
}

async function tryFix(sceneNum, queries, extraRejectPatterns = []) {
  const padded = String(sceneNum).padStart(2, "0");
  const destPath = join(OUT_DIR, `scene_${padded}.jpg`);
  process.stdout.write(`[scene ${padded}] 재교체 ... `);

  for (const query of queries) {
    const photos = await searchPexels(query);
    for (const p of photos) {
      if (!isPhotoOk(p, extraRejectPatterns)) continue;
      const imgUrl = p.src?.portrait || p.src?.large2x || p.src?.original;
      const bytes = await downloadToFile(imgUrl, destPath);
      if (bytes > 0) {
        BLOCKED_URLS.add(p.url);
        const kb = (bytes / 1024).toFixed(0);
        console.log(`✅ ${kb}KB [${query}] (${p.photographer})`);
        console.log(`    URL: ${p.url}`);
        return { success: true, query, photographer: p.photographer, sourceUrl: p.url, fileSizeKB: +(bytes/1024).toFixed(1) };
      }
    }
  }
  console.log(`❌ 실패 — 기존 유지`);
  return { success: false };
}

console.log("=== LH-9 Patch 2차: scene 4/6/10 재교체 ===\n");

// scene 4: 냉장고 문/내부 (단순 쿼리, 사람/램프 제외)
const s4 = await tryFix(4, [
  "refrigerator",
  "fridge food storage",
  "food inside fridge",
], ["woman", "man", "person"]);

// scene 6: 달걀/냉장고 (사람/양말/다리 제외)
const s6 = await tryFix(6, [
  "raw eggs kitchen",
  "egg carton food",
  "white eggs close up",
], ["woman", "man", "person", "legs"]);

// scene 10: 소스/조미료 (맥주/음료 제외, 사람 제외)
const s10 = await tryFix(10, [
  "sauce bottle food",
  "ketchup mustard food",
  "condiment jar food",
  "salad dressing bottle",
], ["woman", "man", "person", "beer", "alcohol"]);

// 결과 최종 확인
console.log("\n── 최종 파일 확인 ──");
[4, 6, 10].forEach(n => {
  const padded = String(n).padStart(2, "0");
  const fp = join(OUT_DIR, `scene_${padded}.jpg`);
  if (existsSync(fp)) {
    const kb = (statSync(fp).size / 1024).toFixed(0);
    console.log(`  scene ${padded}: ${kb}KB OK`);
  } else {
    console.log(`  scene ${padded}: 파일 없음 ❌`);
  }
});

// patch2 log 저장
const log = { patch2At: new Date().toISOString(), scene4: s4, scene6: s6, scene10: s10 };
writeFileSync(join(OUT_DIR, "patch2_log.json"), JSON.stringify(log, null, 2), "utf8");
console.log(`\npatch2 log 저장 완료`);
console.log("=== Patch 2차 완료 ===");
