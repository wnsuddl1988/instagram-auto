/**
 * _fix-lh9-patch.mjs
 * scene 4/6/10 재교체 패치 — Pexels 추가 검색 3회
 */
import { readFileSync, existsSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

function loadEnv(filePath) {
  if (!existsSync(filePath)) return;
  const lines = readFileSync(filePath, "utf8").split("\n");
  for (const line of lines) {
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

const OUT_DIR = join(ROOT, "output/v2/paid_qa/lh9_pexels_stock_images_fixed");

// 이미 사용 중인 sourceUrl (scene 8 URL 포함)
const BLOCKED_URLS = new Set([
  "https://www.pexels.com/photo/white-eggs-beside-polaroid-film-3588035/",
  "https://www.pexels.com/photo/well-stocked-refrigerator-with-various-groceries-31485991/",
  "https://www.pexels.com/photo/bottle-of-wines-in-a-fridge-11021160/", // scene 3
  "https://www.pexels.com/photo/opened-fridge-with-drinks-and-food-4061622/", // scene 9
]);

const PERSON_KW = ["woman", "man", "person", "people", "portrait", "face", "model", "robe", "shirt"];
function hasPersonRisk(url) {
  return PERSON_KW.some((k) => url.toLowerCase().includes(k));
}

async function search(query) {
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=10&orientation=portrait`;
  const r = await fetch(url, { headers: { Authorization: KEY } });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const d = await r.json();
  return d.photos ?? [];
}

async function downloadToFile(imageUrl, filePath) {
  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), 30000);
  try {
    const res = await fetch(imageUrl, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    clearTimeout(tid);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    writeFileSync(filePath, buf);
    return buf.length;
  } catch (e) {
    clearTimeout(tid);
    return 0;
  }
}

async function findAndDownload(queries, avoidPerson, destPath) {
  for (const q of queries) {
    const photos = await search(q);
    await new Promise((r) => setTimeout(r, 400));
    for (const p of photos) {
      if (BLOCKED_URLS.has(p.url)) continue;
      if (avoidPerson && hasPersonRisk(p.url)) continue;
      const imgUrl = p.src?.portrait || p.src?.large2x || p.src?.original;
      const bytes = await downloadToFile(imgUrl, destPath);
      if (bytes > 0) {
        BLOCKED_URLS.add(p.url); // 사용 후 블록
        return { query: q, photographer: p.photographer, sourceUrl: p.url, fileSizeKB: +(bytes / 1024).toFixed(1) };
      }
    }
  }
  return null;
}

let pexelsCalls = 0;
const patchLog = [];

console.log("=== LH-9 Patch: scene 4/6/10 재교체 ===\n");

// scene 4: 냉장고 문 열림 내부 (pendant lamp 아닌 것)
process.stdout.write("[scene 04] 재교체 시도 ... ");
{
  const dest = join(OUT_DIR, "scene_04.jpg");
  const result = await findAndDownload([
    "refrigerator door open interior shelves",
    "open fridge door cold inside",
    "refrigerator interior open door vegetables",
  ], false, dest);
  pexelsCalls += 3;
  if (result) {
    console.log(`✅ ${result.fileSizeKB}KB [${result.query}] (${result.photographer})`);
    patchLog.push({ sceneNumber: 4, ...result, action: "patched" });
  } else {
    console.log("❌ 실패 — 기존 유지 (pendant lamp)");
    patchLog.push({ sceneNumber: 4, action: "patch_failed", note: "pendant lamp 이미지 유지됨 — 수동 교체 필요" });
  }
}

// scene 6: 달걀/냉장고 선반 (사람 없는 것)
process.stdout.write("[scene 06] 재교체 시도 ... ");
{
  const dest = join(OUT_DIR, "scene_06.jpg");
  const result = await findAndDownload([
    "eggs in open refrigerator inside",
    "egg carton refrigerator shelf close",
    "refrigerator eggs inside close up",
  ], true, dest);
  pexelsCalls += 3;
  if (result) {
    console.log(`✅ ${result.fileSizeKB}KB [${result.query}] (${result.photographer})`);
    patchLog.push({ sceneNumber: 6, ...result, action: "patched" });
  } else {
    console.log("❌ 실패 — 기존 유지 (woman robe)");
    patchLog.push({ sceneNumber: 6, action: "patch_failed", note: "woman-in-robe 이미지 유지됨 — 수동 교체 필요" });
  }
}

// scene 10: 문칸 소스류 (scene 8 중복 아닌 것, 사람 없는 것)
process.stdout.write("[scene 10] 재교체 시도 ... ");
{
  const dest = join(OUT_DIR, "scene_10.jpg");
  const result = await findAndDownload([
    "condiments refrigerator door shelf close up",
    "sauce bottles fridge door shelf",
    "mustard ketchup refrigerator door",
    "salad dressing bottles refrigerator door",
  ], true, dest);
  pexelsCalls += 4;
  if (result) {
    console.log(`✅ ${result.fileSizeKB}KB [${result.query}] (${result.photographer})`);
    patchLog.push({ sceneNumber: 10, ...result, action: "patched" });
  } else {
    console.log("❌ 실패 — 기존 유지 (scene 8 중복)");
    patchLog.push({ sceneNumber: 10, action: "patch_failed", note: "scene 8과 동일 URL(well-stocked-refrigerator) 유지됨" });
  }
}

console.log(`\nPexels 추가 호출: ${pexelsCalls}회 (fix 6회 + patch ${pexelsCalls}회)`);
const patchLogPath = join(OUT_DIR, "patch_log.json");
writeFileSync(patchLogPath, JSON.stringify(patchLog, null, 2), "utf8");
console.log(`patch log: ${patchLogPath}`);
console.log("\n=== Patch 완료 ===");
