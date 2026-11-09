/**
 * upload_002_copier S3 recovery-save
 *
 * 새 이미지 생성 없음. 브라우저 탭 실패로 저장 못한 경우를 위한 복구 전용.
 * 기존 ChatGPT 대화의 마지막 assistant 이미지를 찾아 저장한다.
 *
 * URL 패턴 확장: oaiusercontent / estuary / files.oaiusercontent / blob:
 * gen 필터 완화: w>=400 && h>=w 이면 후보로 취급
 *
 * 사용: node scripts/_upload002-s3-recovery-save.mjs [--dry-run]
 */

import { chromium } from "playwright";
import { spawn }    from "child_process";
import path         from "path";
import fs           from "fs";
import crypto       from "crypto";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT      = path.resolve(__dirname, "..");

const CDP_PORT   = 9222;
const CHROME_EXE = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const USER_DATA  = "C:\\Users\\PC\\AppData\\Local\\Google\\Chrome\\User Data\\AI-GPT-1";
const KF_DIR     = path.join(ROOT, "output/v2/3d_sitcom_prod_v1/upload_002_copier/keyframes");
const CAND_DIR   = path.join(KF_DIR, "s3_v2_candidates");

const ANCHOR_S2  = path.join(KF_DIR, "kf_s1_wide_copier_error.png");  // v2: S1 anchor
const DEST_FILE  = "kf_s3_tapping_relief_v2.png";
const DEST_PATH  = path.join(KF_DIR, DEST_FILE);

const DRY        = process.argv.includes("--dry-run");

fs.mkdirSync(KF_DIR,   { recursive: true });
fs.mkdirSync(CAND_DIR, { recursive: true });

function log(m)  { console.log(`[${new Date().toISOString().slice(11,19)}] ${m}`); }
function warn(m) { console.warn(`[WARN] ${m}`); }
function abort(code, m) { console.error(`\n[ABORT:${code}] ${m}\n`); process.exit(1); }

function fileHash(p) {
  if (!fs.existsSync(p)) return null;
  return crypto.createHash("md5").update(fs.readFileSync(p)).digest("hex");
}
const ANCHOR_HASH = fileHash(ANCHOR_S2);
const ANCHOR_SIZE = fs.existsSync(ANCHOR_S2) ? fs.statSync(ANCHOR_S2).size : 0;

async function isCDPOpen() {
  try {
    const r = await fetch(`http://localhost:${CDP_PORT}/json/version`, { signal: AbortSignal.timeout(2000) });
    return r.ok;
  } catch { return false; }
}

async function ensureChrome() {
  if (await isCDPOpen()) { log("✓ Chrome CDP 이미 열려있음"); return; }
  log("Chrome 실행 중...");
  spawn(CHROME_EXE, [
    `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=${USER_DATA}`,
    "--no-first-run", "--no-default-browser-check",
    "https://chatgpt.com/"
  ], { detached: true, stdio: "ignore" }).unref();
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 500));
    if (await isCDPOpen()) { log("✓ Chrome CDP 연결"); return; }
  }
  abort("cdp_timeout", "Chrome CDP 연결 실패 (15초)");
}

// URL이 생성된 이미지인지 판별 — 패턴 확장
function isGenImg(src) {
  return /oaiusercontent|estuary\/content|files\.openai|dalle|gpt-image/i.test(src);
}

// 마지막 assistant 메시지의 모든 이미지 수집 (gen 필터 완화)
async function collectLastAssistantImages(page) {
  return await page.evaluate(() => {
    const msgs = Array.from(document.querySelectorAll('[data-message-author-role="assistant"]'));
    if (msgs.length === 0) return [];
    const lastMsg = msgs[msgs.length - 1];
    return Array.from(lastMsg.querySelectorAll("img"))
      .filter(i => i.naturalWidth >= 200)
      .map(i => ({
        src: i.src || i.currentSrc || i.getAttribute("data-src") || "",
        w: i.naturalWidth,
        h: i.naturalHeight,
      }))
      .filter(x => x.src && x.src.startsWith("http"));
  });
}

// 페이지 내 모든 이미지 수집 (후보가 없을 때 디버그용)
async function collectAllImages(page) {
  return await page.evaluate(() => {
    return Array.from(document.querySelectorAll("img"))
      .filter(i => i.naturalWidth >= 100)
      .map(i => ({
        src: (i.src || "").slice(0, 120),
        w: i.naturalWidth,
        h: i.naturalHeight,
      }))
      .filter(x => x.src);
  });
}

async function downloadBuf(page, src) {
  // 방법 1: Playwright API request (세션 쿠키 자동 포함, 브라우저 컨텍스트 사용)
  try {
    const apiReq = page.context().request;
    const resp = await apiReq.get(src);
    if (resp.ok()) {
      const bytes = Array.from(new Uint8Array(await resp.body()));
      if (bytes.length > 10000) { return bytes; }
    } else {
      console.warn(`  apiReq err: HTTP ${resp.status()} — ${src.slice(0,80)}`);
    }
  } catch (e) { console.warn(`  apiReq exception: ${e.message}`); }

  // 방법 2: 새 탭에서 이미지 URL 직접 navigate → response intercept
  try {
    const imgPage = await page.context().newPage();
    let captured = null;
    imgPage.on("response", async (res) => {
      if (res.url().startsWith(src.slice(0, 60)) && res.status() === 200) {
        try { captured = Array.from(new Uint8Array(await res.body())); } catch {}
      }
    });
    await imgPage.goto(src, { waitUntil: "load", timeout: 15000 }).catch(() => {});
    await imgPage.waitForTimeout(2000);
    await imgPage.close();
    if (captured && captured.length > 10000) return captured;
    console.warn(`  navigate method: captured=${captured?.length}`);
  } catch (e) { console.warn(`  navigate exception: ${e.message}`); }

  // 방법 3: page.evaluate fetch same-origin (no-cors)
  const result3 = await page.evaluate(async (u) => {
    try {
      const r = await fetch(u, { credentials: "include" });
      if (!r.ok) return { err: `HTTP ${r.status}` };
      const bytes = Array.from(new Uint8Array(await r.arrayBuffer()));
      return { bytes };
    } catch (e) { return { err: e.message }; }
  }, src);
  if (result3?.bytes?.length > 0) return result3.bytes;
  if (result3?.err) console.warn(`  fetch3 err: ${result3.err}`);
  return null;
}

async function main() {
  log("=== S3 recovery-save 시작 (새 생성 없음) ===");
  log(`S2 anchor hash: ${ANCHOR_HASH} (${Math.round(ANCHOR_SIZE/1024)}KB)`);

  if (!fs.existsSync(ANCHOR_S2)) abort("anchor_missing", `S2 anchor 없음: ${ANCHOR_S2}`);

  await ensureChrome();
  const browser = await chromium.connectOverCDP(`http://localhost:${CDP_PORT}`)
    .catch(e => abort("cdp_connect", e.message));

  const ctx = browser.contexts()[0];
  if (!ctx) abort("no_context", "브라우저 컨텍스트 없음");

  // 기존 탭 중 chatgpt.com 탭 찾기
  const pages = ctx.pages();
  log(`열린 탭: ${pages.length}개`);
  let page = pages.find(p => /chatgpt\.com/.test(p.url()));
  if (!page) {
    log("chatgpt.com 탭 없음 — 새 탭 열기");
    page = await ctx.newPage();
    await page.goto("https://chatgpt.com/", { waitUntil: "domcontentloaded", timeout: 20000 });
    await page.waitForTimeout(3000);
  } else {
    log(`✓ 기존 chatgpt.com 탭 발견: ${page.url().slice(0, 80)}`);
    await page.bringToFront();
    await page.waitForTimeout(2000);
  }

  if (/auth|login/.test(page.url())) abort("login_required", "ChatGPT 로그인 필요");

  // S3 생성 대화로 이동
  const S3_CONV_URL = "https://chatgpt.com/c/6a2f827e-d33c-83ee-ab2a-0ddaef33149d";
  if (!page.url().includes("6a2f827e")) {
    log(`대화 URL로 이동: ${S3_CONV_URL}`);
    await page.goto(S3_CONV_URL, { waitUntil: "domcontentloaded", timeout: 20000 });
    await page.waitForTimeout(4000);
  }
  log(`현재 URL: ${page.url().slice(0, 80)}`);

  // 현재 페이지 이미지 디버그
  const allImgs = await collectAllImages(page);
  log(`페이지 내 img 요소: ${allImgs.length}개`);
  allImgs.slice(0, 10).forEach((x, i) => log(`  [${i}] ${x.w}x${x.h} ${x.src}`));

  if (DRY) {
    log("[DRY-RUN] 이미지 목록 확인 완료. 저장 없음.");
    await browser.close();
    return;
  }

  // ── intercept 방식: 페이지 reload 시 estuary 응답을 낚아채 저장 ─────────
  // CDP 컨텍스트는 쿠키를 공유하지 않아 직접 fetch가 403 → Chrome이 직접 요청하는 응답을 intercept
  const intercepted = new Map(); // src → Buffer
  const genPattern  = /backend-api\/estuary\/content/;

  await page.route("**/*", async (route) => {
    const req = route.request();
    if (genPattern.test(req.url()) && req.resourceType() === "image") {
      try {
        const resp = await route.fetch();
        const body = await resp.body();
        if (body && body.length > 10000) {
          intercepted.set(req.url(), body);
          log(`  intercept 저장: ${req.url().slice(0, 80)} (${Math.round(body.length/1024)}KB)`);
        }
        await route.fulfill({ response: resp, body });
      } catch (e) {
        await route.continue().catch(() => {});
      }
    } else {
      await route.continue().catch(() => {});
    }
  });

  log("페이지 reload (intercept 활성)...");
  await page.reload({ waitUntil: "networkidle", timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(3000);
  log(`intercept 수집: ${intercepted.size}개`);

  // intercept된 이미지를 후보로 변환
  const interceptImgs = Array.from(intercepted.entries()).map(([src, body]) => ({ src, body }));

  // 마지막 assistant 이미지 수집 (reload 후 재시도)
  const assistantImgs = await collectLastAssistantImages(page);
  log(`마지막 assistant 이미지: ${assistantImgs.length}개`);
  assistantImgs.forEach((x, i) => log(`  [${i}] ${x.w}x${x.h} ${x.src.slice(0, 100)}`));

  const savedCandidates = [];
  let savedBuf = null;

  // intercept 우선 처리
  for (const [j, item] of interceptImgs.entries()) {
    const ts = Date.now();
    const candFile = `s3_candidate_intercept_${ts}_${j+1}.png`;
    const candPath = path.join(CAND_DIR, candFile);
    fs.writeFileSync(candPath, item.body);
    const hash    = fileHash(candPath);
    const sz      = fs.statSync(candPath).size;
    const isClone = (hash === ANCHOR_HASH);
    log(`  intercept 후보 ${j+1}: ${candFile} (${Math.round(sz/1024)}KB) hash=${hash?.slice(0,12)} clone=${isClone}`);
    savedCandidates.push({ file: candFile, path: candPath, hash, size: sz, isClone });
    if (!isClone && !savedBuf) {
      savedBuf = item.body;
      fs.writeFileSync(DEST_PATH, item.body);
      log(`✓ 저장 완료: ${DEST_FILE} (${Math.round(sz/1024)}KB) — human QA 대기`);
    }
  }

  // intercept가 없으면 기존 fallback (fetch)
  if (savedCandidates.length === 0) {
    const sourceImgs = assistantImgs.length > 0 ? assistantImgs : allImgs;
    if (assistantImgs.length === 0) log("fallback: 전체 이미지에서 수집");
    const candidates = sourceImgs.filter(x => isGenImg(x.src) || (x.h > 0 && x.h >= x.w * 1.2));
    log(`fallback 후보: ${candidates.length}개`);
    for (const [j, cand] of candidates.entries()) {
      const ts = Date.now();
      const candFile = `s3_candidate_fallback_${ts}_${j+1}.png`;
      const candPath = path.join(CAND_DIR, candFile);
      const buf = await downloadBuf(page, cand.src);
      if (!buf || buf.length < 10000) { warn(`fallback 후보 ${j+1} 다운로드 실패`); continue; }
      fs.writeFileSync(candPath, Buffer.from(buf));
      const hash = fileHash(candPath);
      const sz = fs.statSync(candPath).size;
      const isClone = (hash === ANCHOR_HASH);
      log(`  fallback ${j+1}: ${candFile} (${Math.round(sz/1024)}KB) clone=${isClone}`);
      savedCandidates.push({ file: candFile, path: candPath, hash, size: sz, isClone });
      if (!isClone && !savedBuf) {
        savedBuf = Buffer.from(buf);
        fs.writeFileSync(DEST_PATH, Buffer.from(buf));
        log(`✓ 저장 완료: ${DEST_FILE} (${Math.round(sz/1024)}KB) — human QA 대기`);
      }
    }
  }

  await page.unroute("**/*").catch(() => {});
  await page.close().catch(() => {});
  await browser.close();
  log("CDP 연결 해제");

  console.log("\n\n=== S3 recovery-save 결과 ===");
  const result = savedCandidates.length > 0 ? "candidate_saved" : "no_candidates";
  console.log(`결과: ${result}`);
  console.log(`GPT image 제출 횟수: 0 (recovery-only, 기존 대화에서 수집)`);

  if (result === "candidate_saved") {
    const sizeKB = fs.existsSync(DEST_PATH) ? Math.round(fs.statSync(DEST_PATH).size / 1024) : 0;
    console.log(`\n저장된 복구 후보: ${DEST_FILE} (${sizeKB}KB)`);
    console.log(`후보 디렉토리: ${CAND_DIR}`);
    console.log("\n=== [ Owner 육안 PASS/FAIL QA 필요 ] ===");
    console.log("PASS 조건:");
    console.log("  □ 복사기: S1/S2와 동일 — 대형 회색 MFC, ADF 덮개, 오른쪽 컨트롤 패널, 3단 서랍");
    console.log("  □ 배경: 블라인드 창(왼쪽) + 목재 수납장(오른쪽) + 밝은 천장 조명 + 베이지 타일 바닥");
    console.log("  □ 준 의상: 하늘색 셔츠, 빨간 넥타이, 네이비 슬랙스, 검정 구두, 갈색 메신저백");
    console.log("  □ 흰 셔츠 즉시 FAIL");
    console.log("  □ 행동: 손바닥으로 복사기 옆면 두드리기, 복사기 작동 중(용지 출력), 안도+황당 표정");
    console.log("  □ 세로 9:16, 텍스트/로고/말풍선 없음");
    console.log("  □ anchor hash 다름 (clone 아님)");
  } else {
    console.log("\n→ no_candidates: 기존 대화에서 생성 이미지 미발견.");
    console.log("  원인: 브라우저 탭이 ChatGPT 대화가 없는 상태이거나 이미지 URL 만료.");
    console.log("  → exec-plan 규칙에 따라 재제출 없음. PENDING_RECOVERY 상태로 보고.");
  }

  console.log("\n=== 후보 목록 ===");
  savedCandidates.forEach((c, i) => {
    console.log(`  [${i+1}] ${c.file} | ${Math.round(c.size/1024)}KB | hash=${c.hash} | clone=${c.isClone}`);
  });

  console.log("\n호출 수: 0회 (recovery-save, 새 생성 없음)");
  console.log("직접 유료 API 호출: $0");
}

main().catch(e => { console.error("[FATAL]", e.message); process.exit(1); });
