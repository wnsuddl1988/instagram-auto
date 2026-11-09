/**
 * _lh9-fix-scene45-v2.mjs
 * scene 4/5 재교체 — 인물 없는 가정 냉장고 이미지
 * BAD_KW 강화: URL slug의 'man', 'woman', 'person' 단어 단위 감지
 * Pexels 최대 5회
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

const SRC_DIR = join(ROOT, "output/v2/paid_qa/lh9_hook_visual_fixed/images");
const OUT_DIR = join(ROOT, "output/v2/paid_qa/lh9_hook_visual_fixed_v2/images");
if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

// ── 절대 차단 URL ──
const BLOCKED_URLS = new Set([
  // scene 2 (중복 방지)
  "https://www.pexels.com/photo/white-eggs-beside-polaroid-film-3588035/",
  // scene 4 기존 (인물)
  "https://www.pexels.com/photo/a-man-looking-at-the-refrigirator-10379533/",
  // scene 5 기존 (러시아어 마트)
  "https://www.pexels.com/photo/bottles-in-refrigerator-3735169/",
  // 이전 시도들
  "https://www.pexels.com/photo/well-stocked-refrigerator-with-various-groceries-31485991/",
  "https://www.pexels.com/photo/bottle-of-wines-in-a-fridge-11021160/",
  "https://www.pexels.com/photo/opened-fridge-with-drinks-and-food-4061622/",
  "https://www.pexels.com/photo/bottles-inside-a-refrigerator-5498228/",
  "https://www.pexels.com/photo/evening-kitchen-neon-home-4058699/",
]);

/**
 * URL slug를 하이픈으로 분리한 단어 목록에서 금지 단어(단어 단위) 감지
 * 예: "a-man-looking-at-the-refrigirator" → ["a","man","looking",...] → "man" 감지
 */
const PERSON_WORDS = new Set([
  "man", "woman", "girl", "boy", "person", "people", "human",
  "model", "portrait", "face", "lady", "male", "female",
  "robe", "shirt", "socks", "legs", "leg",
]);
const CONTEXT_BAD_WORDS = new Set([
  "supermarket", "grocery", "store", "market", "mall", "commercial",
  "industrial", "hvac", "technician", "aircon", "neon", "lamp",
  "pendant", "beer", "wine", "alcohol", "coca", "cola",
]);

function extractSlugWords(url) {
  // URL에서 path 마지막 세그먼트 추출 후 하이픈 분리
  try {
    const path = new URL(url).pathname;
    const slug = path.split("/").filter(Boolean).pop() || "";
    return slug.toLowerCase().split("-").filter(Boolean);
  } catch {
    return url.toLowerCase().split(/[-/]/).filter(Boolean);
  }
}

function isPersonUrl(url) {
  const words = extractSlugWords(url);
  return words.some(w => PERSON_WORDS.has(w));
}

function isContextBad(url) {
  const words = extractSlugWords(url);
  return words.some(w => CONTEXT_BAD_WORDS.has(w));
}

function isBlocked(url) {
  if (BLOCKED_URLS.has(url)) return { blocked: true, reason: "blocked_url" };
  if (isPersonUrl(url)) return { blocked: true, reason: "person_detected" };
  if (isContextBad(url)) return { blocked: true, reason: "bad_context" };
  return { blocked: false };
}

let pexelsCalls = 0;
const rejectedCandidates = [];

async function searchPexels(query) {
  if (pexelsCalls >= 5) return null; // 한도 초과
  pexelsCalls++;
  console.log(`  [Pexels #${pexelsCalls}] "${query}"`);
  await new Promise(r => setTimeout(r, 2000));
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=15&orientation=portrait`;
  const r = await fetch(url, { headers: { Authorization: KEY } });
  if (!r.ok) { console.log(`    HTTP ${r.status}`); return []; }
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
  console.log(`\n[scene ${padded}] 교체 시작 ──`);

  for (const query of queries) {
    if (pexelsCalls >= 5) {
      console.log("  ⚠️  Pexels 호출 한도 5회 도달");
      break;
    }
    const photos = await searchPexels(query);
    if (!photos) break;

    for (const p of photos) {
      const check = isBlocked(p.url);
      if (check.blocked) {
        rejectedCandidates.push({ scene: sceneNum, url: p.url, reason: check.reason, query });
        continue;
      }
      const imgUrl = p.src?.portrait || p.src?.large2x || p.src?.original;
      const bytes = await download(imgUrl, dest);
      if (bytes > 0) {
        BLOCKED_URLS.add(p.url);
        const kb = (bytes / 1024).toFixed(0);
        console.log(`  ✅ ${kb}KB 선택`);
        console.log(`     photographer: ${p.photographer}`);
        console.log(`     url: ${p.url}`);
        // slug 단어 확인용 출력
        const words = extractSlugWords(p.url);
        console.log(`     slug words: [${words.join(", ")}]`);
        return { success: true, query, photographer: p.photographer, sourceUrl: p.url, fileSizeKB: +(bytes/1024).toFixed(1) };
      }
    }
    console.log(`  ❌ "${query}" — 적합한 이미지 없음`);
  }

  // fallback: 기존 이미지 유지
  const src = join(SRC_DIR, `scene_${padded}.jpg`);
  if (existsSync(src)) {
    copyFileSync(src, dest);
    console.log(`  ⚠️  fallback: 기존 이미지 복사`);
  }
  return { success: false };
}

// ── 복사 대상 (1/2/3/6/7/8/9/10) ──
console.log("=== 기존 이미지 복사 (scene 1/2/3/6/7/8/9/10) ===");
for (const n of [1, 2, 3, 6, 7, 8, 9, 10]) {
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

// ── scene 4: 인물 없는 가정 냉장고 문/선반 ──
const s4 = await tryReplace(4, [
  "open home refrigerator door shelves",
  "inside refrigerator door shelves",
  "home fridge door shelves close up",
]);

// ── scene 5: 가정 냉장고 안쪽 선반/신선식품 ──
const s5 = await tryReplace(5, [
  "organized refrigerator shelf eggs milk",
  "fresh food inner refrigerator shelf",
  "home refrigerator shelf eggs dairy",
]);

// ── 최종 확인 ──
console.log("\n=== 최종 파일 확인 ===");
const fileLog = [];
for (let n = 1; n <= 10; n++) {
  const padded = String(n).padStart(2, "0");
  const fp = join(OUT_DIR, `scene_${padded}.jpg`);
  const exists = existsSync(fp);
  const kb = exists ? (statSync(fp).size / 1024).toFixed(0) : 0;
  console.log(`  scene ${padded}: ${exists ? `${kb}KB ✅` : "❌ 없음"}`);
  fileLog.push({ scene: n, exists, fileSizeKB: +kb });
}

// ── 재감지 검증: scene 4 인물 없음 확인 ──
if (s4.success) {
  const personCheck = isPersonUrl(s4.sourceUrl);
  const contextCheck = isContextBad(s4.sourceUrl);
  console.log(`\n[scene 4 검증]`);
  console.log(`  person detected: ${personCheck} (false여야 함)`);
  console.log(`  context bad: ${contextCheck} (false여야 함)`);
  console.log(`  slug words: [${extractSlugWords(s4.sourceUrl).join(", ")}]`);
}

// ── log 저장 ──
const log = {
  createdAt: new Date().toISOString(),
  pexelsCallsUsed: pexelsCalls,
  copiedScenes: [1, 2, 3, 6, 7, 8, 9, 10],
  replacedScenes: { 4: s4, 5: s5 },
  rejectedCandidatesCount: rejectedCandidates.length,
  rejectedCandidates,
  files: fileLog,
};
writeFileSync(
  join(ROOT, "output/v2/paid_qa/lh9_hook_visual_fixed_v2/image_fix_log.json"),
  JSON.stringify(log, null, 2),
  "utf8"
);
console.log(`\n✅ Pexels 호출 총 ${pexelsCalls}회`);
console.log("image_fix_log.json 저장 완료");
