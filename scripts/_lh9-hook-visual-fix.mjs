/**
 * _lh9-hook-visual-fix.mjs
 * scene 4/5/8/10 Pexels 재교체 + 나머지 복사 → lh9_hook_visual_fixed/images/
 * Pexels 호출 최대 8회
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync, statSync } from "fs";
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

if (process.env.PAID_API_ENABLED === "true") {
  console.error("⛔ PAID_API_ENABLED=true — 중단");
  process.exit(1);
}
const KEY = process.env.PEXELS_API_KEY || "";
if (!KEY) { console.error("⛔ PEXELS_API_KEY 없음"); process.exit(1); }
console.log("✅ PEXELS_API_KEY 존재\n");

const SRC_DIR = join(ROOT, "output/v2/paid_qa/lh9_pexels_stock_images_fixed");
const OUT_DIR = join(ROOT, "output/v2/paid_qa/lh9_hook_visual_fixed/images");
if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

// 기존 사용 URL (중복 방지)
const BLOCKED_URLS = new Set([
  // scene 1
  "https://www.pexels.com/photo/opened-fridge-food-waste-symbol-8466649/",
  // scene 2 (달걀+Polaroid — scene 5 교체 후 scene 2와 중복 방지용)
  "https://www.pexels.com/photo/white-eggs-beside-polaroid-film-3588035/",
  // scene 3
  "https://www.pexels.com/photo/bottle-of-wines-in-a-fridge-11021160/",
  // scene 6
  "https://www.pexels.com/photo/brown-eggs-in-gray-round-bowl-7118750/",
  // scene 7
  "https://www.pexels.com/photo/bottles-of-soda-in-empty-fridge-9395975/",
  // scene 9
  "https://www.pexels.com/photo/opened-fridge-with-drinks-and-food-4061622/",
  // scene 10 기존 (카페 시럽)
  "https://www.pexels.com/photo/plastic-jars-with-syrups-in-cafe-5461614/",
  // scene 4 기존 (마트 진열대)
  "https://www.pexels.com/photo/bottles-inside-a-refrigerator-5498228/",
  // scene 8 기존 (맥주 냉장고)
  "https://www.pexels.com/photo/well-stocked-refrigerator-with-various-groceries-31485991/",
]);

const BAD_KW = [
  "supermarket", "grocery-store", "market", "mall", "hvac", "technician",
  "air-condition", "industrial", "beer", "wine", "alcohol", "neon", "lamp",
  "pendant", "legs", "socks", "person-standing", "woman-in", "man-in",
  "portrait-of", "coca-cola", "coke",
];

function isBad(url) {
  if (BLOCKED_URLS.has(url)) return true;
  const ul = url.toLowerCase();
  return BAD_KW.some(k => ul.includes(k));
}

let pexelsCalls = 0;

async function searchPexels(query) {
  pexelsCalls++;
  await new Promise(r => setTimeout(r, 2000));
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=12&orientation=portrait`;
  const r = await fetch(url, { headers: { Authorization: KEY } });
  if (!r.ok) { console.log(`  HTTP ${r.status} for "${query}"`); return []; }
  return (await r.json()).photos ?? [];
}

async function download(imgUrl, dest) {
  const ctrl = new AbortController();
  const tid = setTimeout(() => ctrl.abort(), 30000);
  try {
    const res = await fetch(imgUrl, {
      signal: ctrl.signal,
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
    });
    clearTimeout(tid);
    if (!res.ok) return 0;
    const buf = Buffer.from(await res.arrayBuffer());
    writeFileSync(dest, buf);
    return buf.length;
  } catch {
    clearTimeout(tid);
    return 0;
  }
}

async function tryReplace(sceneNum, queries) {
  const padded = String(sceneNum).padStart(2, "0");
  const dest = join(OUT_DIR, `scene_${padded}.jpg`);
  process.stdout.write(`[scene ${padded}] 교체 시도 ... `);

  for (const query of queries) {
    if (pexelsCalls >= 8) { console.log("⚠️  Pexels 호출 한도 8회 도달 — 스킵"); return null; }
    const photos = await searchPexels(query);
    for (const p of photos) {
      if (isBad(p.url)) continue;
      const imgUrl = p.src?.portrait || p.src?.large2x || p.src?.original;
      const bytes = await download(imgUrl, dest);
      if (bytes > 0) {
        BLOCKED_URLS.add(p.url);
        const kb = (bytes / 1024).toFixed(0);
        console.log(`✅ ${kb}KB [${query}]\n   photographer: ${p.photographer}\n   url: ${p.url}`);
        return { success: true, query, photographer: p.photographer, sourceUrl: p.url, fileSizeKB: +(bytes/1024).toFixed(1) };
      }
    }
  }
  console.log(`❌ 적합한 이미지 없음 — 기존 유지`);
  return { success: false };
}

// ── 복사 대상 (1/2/3/6/7/9) ──
console.log("=== 기존 이미지 복사 (scene 1/2/3/6/7/9) ===");
for (const n of [1, 2, 3, 6, 7, 9]) {
  const padded = String(n).padStart(2, "0");
  const src = join(SRC_DIR, `scene_${padded}.jpg`);
  const dst = join(OUT_DIR, `scene_${padded}.jpg`);
  if (existsSync(src)) {
    copyFileSync(src, dst);
    const kb = (statSync(dst).size / 1024).toFixed(0);
    console.log(`  scene ${padded}: 복사 완료 (${kb}KB)`);
  } else {
    console.log(`  scene ${padded}: ❌ 원본 없음`);
  }
}

console.log("\n=== Pexels 교체 (scene 4/5/8/10) ===\n");

// scene 4: 가정 냉장고 문 열림 / 온도 변화 암시
const s4 = await tryReplace(4, [
  "open home refrigerator door close up",
  "refrigerator door open kitchen",
  "inside home refrigerator door shelves",
]);

// scene 5: 신선식품 안쪽 칸 (scene 2와 다른 이미지)
const s5 = await tryReplace(5, [
  "eggs and dairy inside refrigerator shelf",
  "organized refrigerator shelf eggs milk",
  "fresh food on inner fridge shelf",
]);

// scene 8: 정리된 냉장고 내부 (맥주 없음)
const s8 = await tryReplace(8, [
  "organized refrigerator inner shelves fresh food",
  "fresh vegetables eggs dairy inside refrigerator",
  "organized home fridge shelves",
]);

// scene 10: 냉장고 문칸 소스류 (카페 시럽 아님)
const s10 = await tryReplace(10, [
  "refrigerator door shelf condiments",
  "condiments on fridge door shelf",
  "organized refrigerator door sauces",
]);

// 실패 시 기존 이미지 fallback 복사
for (const [n, res] of [[4,s4],[5,s5],[8,s8],[10,s10]]) {
  if (!res || !res.success) {
    const padded = String(n).padStart(2, "0");
    const src = join(SRC_DIR, `scene_${padded}.jpg`);
    const dst = join(OUT_DIR, `scene_${padded}.jpg`);
    if (existsSync(src) && !existsSync(dst)) {
      copyFileSync(src, dst);
      console.log(`  scene ${padded}: fallback 복사 (기존 유지)`);
    }
  }
}

// ── 최종 확인 ──
console.log("\n=== 최종 파일 확인 ===");
const fileLog = [];
for (let n=1; n<=10; n++) {
  const padded = String(n).padStart(2, "0");
  const fp = join(OUT_DIR, `scene_${padded}.jpg`);
  const exists = existsSync(fp);
  const kb = exists ? (statSync(fp).size / 1024).toFixed(0) : 0;
  console.log(`  scene ${padded}: ${exists ? `${kb}KB ✅` : "❌ 없음"}`);
  fileLog.push({ scene: n, exists, fileSizeKB: +kb });
}

// ── log 저장 ──
const log = {
  createdAt: new Date().toISOString(),
  pexelsCallsUsed: pexelsCalls,
  copiedScenes: [1, 2, 3, 6, 7, 9],
  replacedScenes: { 4: s4, 5: s5, 8: s8, 10: s10 },
  files: fileLog,
};
writeFileSync(join(ROOT, "output/v2/paid_qa/lh9_hook_visual_fixed/image_fix_log.json"), JSON.stringify(log, null, 2), "utf8");
console.log(`\n✅ Pexels 호출 총 ${pexelsCalls}회`);
console.log("image_fix_log.json 저장 완료");
