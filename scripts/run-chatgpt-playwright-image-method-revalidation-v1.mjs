/**
 * ChatGPT+Playwright Image Method Revalidation Runner v1
 * task: golden-sample-chatgpt-playwright-visual-only-candidate-v1
 *
 * 목적:
 *   chatgpt_playwright_image_prompts.t1_lifestyle_inflation.v1.json의 4개 프롬프트를
 *   기존 승인 live ChatGPT image path(Playwright + Chrome CDP, reference-free)로 생성해
 *   Golden Sample visual-only 후보의 소스 이미지 4장을 만든다.
 *
 * rate-freeze regen runner와의 차이:
 *   - 해상도 gate 미달이어도 중단하지 않는다. 941x1672 native는 알려진 특성이며,
 *     실측값을 있는 그대로 기록하고 viewer-frame QA로 판정한다 (contract 참조).
 *   - 이미지별 md5를 기록한다 (renderer 입력 무결성 대조용).
 *   - 이미 산출 파일이 있는 order는 skip — 재실행해도 총 제출 4회를 넘을 수 없다.
 *
 * 설계 원칙:
 *   - 프롬프트는 fixture에서만 읽는다. runner 하드코딩 금지.
 *   - order당 제출 1회. 자동 재시도 없음. 총 제출 하드캡 4 (SUBMISSION_HARD_CAP).
 *   - scripts/_chatgpt-image-core.mjs 공용 함수만 재사용 (core 무수정).
 *   - output/money-shorts/chatgpt-playwright-image-method-revalidation-v1/ 에만 저장.
 *
 * 보안 제약:
 *   - ALLOW_CHATGPT_IMAGE=1 없으면 즉시 중단.
 *   - .env.local / .money-shorts-local / secret 파일 접근 금지.
 *   - OpenAI/FLUX2(BFL)/Gemini/Midjourney API 호출 금지. fetch는 CDP/estuary 회수 용도만.
 *
 * 사용:
 *   node scripts/run-chatgpt-playwright-image-method-revalidation-v1.mjs --preflight-only
 *   node scripts/run-chatgpt-playwright-image-method-revalidation-v1.mjs
 *
 * exit: 0 = 요청 모드 성공 / 1 = 실행 실패(중단 조건 포함)
 */

import { chromium } from "playwright";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { fileURLToPath } from "url";

import {
  CDP_PORT_GPT1, USER_DATA_GPT1,
  hashText,
  ensureChrome, checkLogin, detectStop,
  typePrompt, checkSendEnabled,
  collectLastAssistantImages, isAssistantDone, interceptRecover,
} from "./_chatgpt-image-core.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");

const PROMPTS_PATH = path.join(REPO_ROOT, "scripts", "fixtures", "chatgpt_playwright_image_prompts.t1_lifestyle_inflation.v1.json");
const OUT_DIR_ABS = path.join(REPO_ROOT, "output", "money-shorts", "chatgpt-playwright-image-method-revalidation-v1");

const SUBMISSION_HARD_CAP = 4;
let submissionCount = 0;

const argv = process.argv.slice(2);
const PREFLIGHT_ONLY = argv.includes("--preflight-only");
// --recover-latest N : 프롬프트 재제출 없이(제출 0회) 가장 최근 대화에서 생성 이미지를
// 회수해 order N 산출물로 저장한다. 이미 제출된 대화의 결과 salvage 전용.
const recoverIdx = argv.indexOf("--recover-latest");
const RECOVER_LATEST = recoverIdx >= 0 ? parseInt(argv[recoverIdx + 1], 10) : null;
if (recoverIdx >= 0 && (!Number.isInteger(RECOVER_LATEST) || RECOVER_LATEST < 1 || RECOVER_LATEST > 4)) {
  console.error("ABORT: --recover-latest 값은 1~4");
  process.exit(1);
}

function ts() { return new Date().toISOString().slice(11, 19); }
function log(m) { console.log(`[${ts()}][gpt-reval] ${m}`); }
function warn(m) { console.warn(`[WARN][gpt-reval] ${m}`); }

// ── readiness gate ────────────────────────────────────────────────────────────
if (process.env.ALLOW_CHATGPT_IMAGE !== "1") {
  console.error("ABORT: ALLOW_CHATGPT_IMAGE=1 이 설정되지 않음 (generation contract readinessGate).");
  process.exit(1);
}

// ── 프롬프트 fixture 로드 + 검증 ─────────────────────────────────────────────
const promptsDoc = JSON.parse(fs.readFileSync(PROMPTS_PATH, "utf8"));
if (promptsDoc.schemaVersion !== "chatgpt_playwright_image_prompts_v1") {
  console.error(`ABORT: prompts schemaVersion 불일치 — ${promptsDoc.schemaVersion}`);
  process.exit(1);
}
const prompts = (promptsDoc.prompts || []).slice().sort((a, b) => a.order - b.order);
if (prompts.length < 1 || prompts.length > 4) {
  console.error(`ABORT: prompts 1~4개 기대 — 실제 ${prompts.length}개`);
  process.exit(1);
}

fs.mkdirSync(OUT_DIR_ABS, { recursive: true });

// 해상도 요청 지시 — 결과는 실측으로만 기록 (941x1672 native 특성은 contract에 문서화됨)
const RESOLUTION_INSTRUCTION =
  " OUTPUT FORMAT REQUIREMENT: vertical 9:16 portrait canvas at the highest resolution available " +
  "(target at least 1080x1920 pixels). Do not add any text, letters, numbers or watermark to the image.";

const imageFileName = (p) => `img-${String(p.order).padStart(2, "0")}-${p.imageId}.png`;

// ── 이미지 바이너리 차원 sniff (PNG/JPEG/WebP, 의존성 없음) ──────────────────
function sniffImageDims(buf) {
  if (!buf || buf.length < 32) return null;
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    return { format: "png", w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
  }
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let p = 2;
    while (p + 9 < buf.length) {
      if (buf[p] !== 0xff) { p++; continue; }
      const marker = buf[p + 1];
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        return { format: "jpeg", w: buf.readUInt16BE(p + 7), h: buf.readUInt16BE(p + 5) };
      }
      p += 2 + buf.readUInt16BE(p + 2);
    }
    return { format: "jpeg", w: null, h: null };
  }
  if (buf.slice(0, 4).toString("ascii") === "RIFF" && buf.slice(8, 12).toString("ascii") === "WEBP") {
    const chunk = buf.slice(12, 16).toString("ascii");
    if (chunk === "VP8X") {
      const w = 1 + (buf[24] | (buf[25] << 8) | (buf[26] << 16));
      const h = 1 + (buf[27] | (buf[28] << 8) | (buf[29] << 16));
      return { format: "webp", w, h };
    }
    if (chunk === "VP8 ") return { format: "webp", w: buf.readUInt16LE(26) & 0x3fff, h: buf.readUInt16LE(28) & 0x3fff };
    if (chunk === "VP8L") {
      const b = buf.readUInt32LE(21);
      return { format: "webp", w: (b & 0x3fff) + 1, h: ((b >> 14) & 0x3fff) + 1 };
    }
    return { format: "webp", w: null, h: null };
  }
  return null;
}

// ── page 컨텍스트에서 URL 실측 (다운로드 없이) ───────────────────────────────
async function measureUrlInPage(page, url) {
  return await page.evaluate(async (u) => {
    try {
      const r = await fetch(u);
      if (!r.ok) return { ok: false, status: r.status };
      const blob = await r.blob();
      const bmp = await createImageBitmap(blob);
      const out = { ok: true, w: bmp.width, h: bmp.height, bytes: blob.size, type: blob.type };
      bmp.close();
      return out;
    } catch (e) {
      return { ok: false, error: String(e).slice(0, 120) };
    }
  }, url).catch((e) => ({ ok: false, error: String(e).slice(0, 120) }));
}

// ── 생성 이미지 후보 심층 수집 (page-wide) ───────────────────────────────────
// 현행 ChatGPT UI는 생성 이미지를 assistant role 요소 밖 컨테이너에 렌더링한다
// (2026-07-03 DOM 진단 실측: inAssistant=false, image-gen-overlay-* testid).
// 따라서 assistant-scope가 아니라 페이지 전체에서 estuary/oaiusercontent img를 수집하고,
// user 메시지 내부(첨부)만 제외한다.
async function collectCandidateUrlsDeep(page) {
  return await page.evaluate(() => {
    function cid(s) { const m = (s || "").match(/[?&]id=([^&]+)/); return m ? m[1] : null; }
    const out = [];
    const seen = new Set();
    for (const img of Array.from(document.querySelectorAll("img"))) {
      if (img.naturalWidth < 200) continue;
      if (img.closest('[data-message-author-role="user"]')) continue; // 사용자 첨부 제외
      const src = img.src || img.currentSrc || "";
      if (!src) continue;
      const gen = /backend-api\/estuary\/content|backend-api\/files|oaiusercontent/.test(src);
      if (!gen && !src.startsWith("blob:")) continue;
      const key = cid(src) || src.slice(0, 100);
      if (seen.has(key)) continue;
      seen.add(key);
      const urls = [{ url: src, kind: "src" }];
      for (const entry of (img.srcset || "").split(",")) {
        const u = entry.trim().split(/\s+/)[0];
        if (u && u !== src) urls.push({ url: u, kind: "srcset" });
      }
      const a = img.closest("a");
      if (a && a.href && a.href !== src) urls.push({ url: a.href, kind: "anchor" });
      out.push({ cid: cid(src), gen, naturalW: img.naturalWidth, naturalH: img.naturalHeight, urls });
    }
    return out;
  });
}

// ── 생성 이미지 간이 수집 (page-wide, 폴링용) ────────────────────────────────
async function collectGenImagesPageWide(page) {
  return await page.evaluate(() => {
    function cid(s) { const m = (s || "").match(/[?&]id=([^&]+)/); return m ? m[1] : null; }
    return Array.from(document.querySelectorAll("img"))
      .filter(i => i.naturalWidth >= 200 && !i.closest('[data-message-author-role="user"]'))
      .map(i => ({
        src: (i.src || i.currentSrc || ""), cid: cid(i.src),
        w: i.naturalWidth, h: i.naturalHeight,
        gen: /backend-api\/estuary\/content|backend-api\/files|oaiusercontent/.test(i.src || ""),
      }))
      .filter(x => x.gen || x.src.startsWith("blob:"));
  });
}

function redactUrl(u) {
  try {
    const url = new URL(u);
    const keys = Array.from(url.searchParams.keys());
    return `${url.origin}${url.pathname}?${keys.map(k => `${k}=…`).join("&")}`;
  } catch { return (u || "").slice(0, 80); }
}

// ── 최고 해상도 후보 저장 ────────────────────────────────────────────────────
async function saveBestImage(page, destPath, baselineCids) {
  const groups = await collectCandidateUrlsDeep(page);
  // gen(estuary/oaiusercontent) 우선, 없으면 baseline에 없던 신규 대형 이미지(blob: 포함)도 인정
  const freshGen = groups.filter(g => g.gen && (!g.cid || !baselineCids.has(g.cid)));
  const freshAny = groups.filter(g => g.naturalW >= 400 && (!g.cid || !baselineCids.has(g.cid)));
  const usable = freshGen.length > 0 ? freshGen : (freshAny.length > 0 ? freshAny : groups.filter(g => g.gen));
  const evidence = [];
  let best = null;

  for (const g of usable) {
    for (const cand of g.urls) {
      const m = await measureUrlInPage(page, cand.url);
      evidence.push({ kind: cand.kind, url: redactUrl(cand.url), measured: m });
      if (m.ok && (!best || m.w * m.h > best.m.w * best.m.h)) best = { url: cand.url, kind: cand.kind, m };
    }
  }

  if (best) {
    const buf = await page.evaluate(async (u) => {
      try {
        const r = await fetch(u);
        const ab = await r.arrayBuffer();
        return Array.from(new Uint8Array(ab));
      } catch { return null; }
    }, best.url).catch(() => null);
    if (buf && buf.length > 10000) {
      const b = Buffer.from(buf);
      fs.writeFileSync(destPath, b);
      const dims = sniffImageDims(b);
      return { ok: true, method: `best_candidate_${best.kind}`, w: dims?.w ?? best.m.w, h: dims?.h ?? best.m.h, format: dims?.format, bytes: b.length, evidence };
    }
  }

  // intercept fallback
  const intercepted = await interceptRecover(page, page.url(), log);
  let biggest = null;
  for (const [, body] of intercepted) {
    const dims = sniffImageDims(body);
    if (!dims) continue;
    if (!biggest || dims.w * dims.h > biggest.dims.w * biggest.dims.h) biggest = { body, dims };
  }
  if (biggest && biggest.body.length > 10000) {
    fs.writeFileSync(destPath, biggest.body);
    return { ok: true, method: "intercept_reload", w: biggest.dims.w, h: biggest.dims.h, format: biggest.dims.format, bytes: biggest.body.length, evidence };
  }
  return { ok: false, method: "none", evidence };
}

// ── 이미지 도구 활성화 (현행 UI 기준, rate-freeze runner 검증 경로) ──────────
async function activateImageToolCurrentUI(page) {
  const directBtn = page.getByRole("button", { name: /^이미지 만들기$|^Create image$/i }).first();
  if (await directBtn.count() > 0 && await directBtn.isVisible({ timeout: 1200 }).catch(() => false)) {
    await directBtn.click();
    await page.waitForTimeout(1200);
    log("image tool activated ✅ (direct button)");
    return true;
  }
  const plus = page.locator(
    'button[data-testid="composer-plus-btn"], button[aria-label="파일 등 추가"], ' +
    'button[aria-label="파일 추가 및 기타"], button[aria-label*="Add" i]'
  ).first();
  if (await plus.count() === 0) throw new Error("image_tool: composer plus button not found");
  for (let attempt = 0; attempt < 3; attempt++) {
    await plus.click();
    await page.waitForTimeout(1200);
    const menuItem = page.getByText(/이미지 만들기/).filter({ hasNotText: "무엇을" }).first();
    if (await menuItem.count() > 0 && await menuItem.isVisible({ timeout: 1500 }).catch(() => false)) {
      await menuItem.click();
      await page.waitForTimeout(1200);
      log("image tool activated ✅ (plus-menu → 이미지 만들기)");
      return true;
    }
    await page.keyboard.press("Escape").catch(() => {});
    await page.waitForTimeout(600);
  }
  throw new Error("image_tool: '이미지 만들기' menu item not found after plus-menu (3 attempts)");
}

// ── 새 대화 + 이미지 모드 + 프롬프트 입력 ────────────────────────────────────
async function prepComposer(ctx, finalPrompt) {
  const page = await ctx.newPage();
  await page.goto("https://chatgpt.com/", { waitUntil: "domcontentloaded", timeout: 20000 });
  await page.waitForTimeout(1500);
  if (/auth|login/i.test(page.url())) throw new Error("login_required: ChatGPT 로그인 필요");
  await detectStop(page);
  await activateImageToolCurrentUI(page);
  const ta = page.locator("#prompt-textarea").first();
  const taVisible = await ta.isVisible({ timeout: 8000 }).catch(() => false);
  if (!taVisible) throw new Error("composer: #prompt-textarea not visible");
  await typePrompt(page, finalPrompt, log);
  const sendOk = await checkSendEnabled(page);
  if (!sendOk) throw new Error("send_enabled: send button not found/disabled");
  return page;
}

// ── 단일 이미지 생성 (제출 1회, 자동 재시도 없음) ────────────────────────────
async function generateImage(ctx, p) {
  const fileName = imageFileName(p);
  const destPath = path.join(OUT_DIR_ABS, fileName);

  if (fs.existsSync(destPath)) {
    log(`order ${p.order} (${p.imageId}) — 기존 산출물 존재, 재제출 skip (하드캡 보호)`);
    const b = fs.readFileSync(destPath);
    const dims = sniffImageDims(b);
    return {
      order: p.order, imageId: p.imageId, scenes: p.scenes, imagePath: destPath,
      width: dims?.w, height: dims?.h, format: dims?.format, bytes: b.length,
      md5: crypto.createHash("md5").update(b).digest("hex"),
      saveMethod: "existing_file_skip", promptHash: hashText(p.finalPrompt), submitted: false,
    };
  }

  if (submissionCount >= SUBMISSION_HARD_CAP) {
    throw new Error(`SUBMISSION_HARD_CAP(${SUBMISSION_HARD_CAP}) 도달 — order ${p.order} 제출 불가`);
  }

  log(`=== order ${p.order} (${p.imageId}) 생성 시작 → ${fileName} ===`);
  const promptText = p.finalPrompt + RESOLUTION_INSTRUCTION;
  const page = await prepComposer(ctx, promptText);

  const baseImgs = await collectLastAssistantImages(page);
  const baselineCids = new Set(baseImgs.map(x => x.cid).filter(Boolean));

  const sendBtn = page.locator(
    '#composer-submit-button, button[data-testid="send-button"], ' +
    'button[aria-label="Send message"], button[aria-label="메시지 보내기"]'
  ).first();
  await sendBtn.click();
  submissionCount++;
  log(`order ${p.order} 전송 완료 (submission ${submissionCount}/${SUBMISSION_HARD_CAP}) — 생성 대기 중...`);

  // 완료 감지: spinner/streaming 부재 + 마지막 assistant 메시지에 신규 대형 이미지
  // (estuary/oaiusercontent 또는 blob: — 현행 UI는 blob:로 먼저 노출될 수 있음)
  const maxPolls = 80; // 1.5s × 80 = 120s
  let done = false;
  const t0 = Date.now();
  for (let i = 0; i < maxPolls; i++) {
    await page.waitForTimeout(1500);
    const idle = await isAssistantDone(page);
    const imgs = await collectGenImagesPageWide(page);
    const freshBig = imgs.filter(x => x.w >= 400 && (!x.cid || !baselineCids.has(x.cid)));
    if (i % 6 === 5 || (idle && freshBig.length > 0)) {
      log(`  poll ${i + 1} (${Math.round((Date.now() - t0) / 1000)}s): idle=${idle} genImgs=${imgs.length} fresh>=400px=${freshBig.length}` +
        (imgs[0] ? ` [${imgs.map(x => `${x.w}x${x.h}${x.gen ? ":gen" : ":blob"}`).join(", ")}]` : ""));
    }
    if (idle && freshBig.length > 0) {
      await page.waitForTimeout(1200);
      done = true;
      break;
    }
  }
  if (!done) warn(`order ${p.order}: 생성 완료 감지 timeout(120s) — 후보 수집/intercept fallback 시도`);

  const saveRes = await saveBestImage(page, destPath, baselineCids);
  await page.close().catch(() => {});

  if (!saveRes.ok) throw new Error(`order ${p.order} (${p.imageId}): 이미지 저장 실패 (${saveRes.method})`);

  const b = fs.readFileSync(destPath);
  const md5 = crypto.createHash("md5").update(b).digest("hex");
  log(`order ${p.order} 저장 ✅ ${destPath}`);
  log(`  실측: ${saveRes.w}x${saveRes.h} ${saveRes.format || "?"} (${Math.round((saveRes.bytes || 0) / 1024)}KB, ${saveRes.method}) md5=${md5}`);
  return {
    order: p.order, imageId: p.imageId, scenes: p.scenes, imagePath: destPath,
    width: saveRes.w, height: saveRes.h, format: saveRes.format, bytes: saveRes.bytes,
    md5, saveMethod: saveRes.method, candidateEvidence: saveRes.evidence,
    promptHash: hashText(p.finalPrompt), submitted: true,
  };
}

// ── 최근 대화에서 이미지 회수 (제출 0회 — 이미 제출된 생성분 salvage 전용) ───
async function recoverLatest(ctx, order) {
  const p = prompts.find(x => x.order === order);
  if (!p) throw new Error(`order ${order} 프롬프트 없음`);
  const destPath = path.join(OUT_DIR_ABS, imageFileName(p));
  if (fs.existsSync(destPath)) {
    log(`order ${order} 산출물 이미 존재 — recover 불필요`);
    return null;
  }
  const page = await ctx.newPage();
  await page.goto("https://chatgpt.com/", { waitUntil: "domcontentloaded", timeout: 20000 });
  await page.waitForTimeout(2000);
  if (/auth|login/i.test(page.url())) throw new Error("login_required");
  const convs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a[href^="/c/"]')).slice(0, 8)
      .map(a => ({ href: a.href, title: (a.textContent || "").trim().slice(0, 60) }));
  });
  if (!convs.length) throw new Error("사이드바 대화 링크를 찾지 못함");
  // 우리 프롬프트의 식별 문구로 해당 생성 대화를 특정 (다른 대화 오염 방지)
  const frag = p.finalPrompt.slice(0, 70).toLowerCase();
  let matched = null;
  for (const conv of convs) {
    log(`대화 확인: ${conv.title}`);
    await page.goto(conv.href, { waitUntil: "domcontentloaded", timeout: 20000 });
    await page.waitForTimeout(3500);
    // 렌더 타이밍 flake 대응: 메시지 요소가 뜰 때까지 최대 6초 추가 대기
    await page.waitForSelector('[data-message-author-role="user"]', { timeout: 6000 }).catch(() => {});
    const info = await page.evaluate((fragIn) => {
      const users = Array.from(document.querySelectorAll('[data-message-author-role="user"]'));
      const promptMatch = users.some(u => (u.textContent || "").toLowerCase().includes(fragIn));
      const gens = Array.from(document.querySelectorAll("img"))
        .filter(i => i.naturalWidth >= 400 && !i.closest('[data-message-author-role="user"]') &&
          /estuary\/content|oaiusercontent|backend-api\/files/.test(i.src || "")).length;
      return { promptMatch, gens };
    }, frag);
    log(`  promptMatch=${info.promptMatch} assistantImgs=${info.gens}`);
    if (info.promptMatch) { matched = conv; break; }
  }
  if (!matched) throw new Error("프롬프트 일치 대화를 찾지 못함 (상위 8개 스캔)");
  log(`매칭 대화에서 회수: ${matched.title}`);
  // lazy-load 대응: 맨 아래로 스크롤 + 최대 24초 폴링으로 이미지 로드 대기 (page-wide)
  for (let i = 0; i < 16; i++) {
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
      const main = document.querySelector("main");
      if (main) main.scrollTo(0, main.scrollHeight);
    });
    const imgs = await collectGenImagesPageWide(page);
    const big = imgs.filter(x => x.w >= 400).length;
    if (i % 4 === 3 || big > 0) log(`  img poll ${i + 1}: genImgs=${imgs.length} big=${big}`);
    if (big > 0) break;
    await page.waitForTimeout(1500);
  }
  const saveRes = await saveBestImage(page, destPath, new Set());
  await page.close().catch(() => {});
  if (!saveRes.ok) throw new Error(`recover 실패 (${saveRes.method})`);
  const b = fs.readFileSync(destPath);
  const md5 = crypto.createHash("md5").update(b).digest("hex");
  log(`order ${order} 회수 저장 ✅ ${destPath}`);
  log(`  실측: ${saveRes.w}x${saveRes.h} ${saveRes.format || "?"} (${Math.round((saveRes.bytes || 0) / 1024)}KB, ${saveRes.method}) md5=${md5}`);
  return {
    order: p.order, imageId: p.imageId, scenes: p.scenes, imagePath: destPath,
    width: saveRes.w, height: saveRes.h, format: saveRes.format, bytes: saveRes.bytes,
    md5, saveMethod: `recover_latest_${saveRes.method}`, promptHash: hashText(p.finalPrompt), submitted: false,
  };
}

// ── summary ──────────────────────────────────────────────────────────────────
function writeSummary(mode, preflight, generated, fatalError = null) {
  const summary = {
    schemaVersion: "chatgpt_playwright_image_method_revalidation_summary_v1",
    taskId: "golden-sample-chatgpt-playwright-visual-only-candidate-v1",
    sourcePrompts: "scripts/fixtures/chatgpt_playwright_image_prompts.t1_lifestyle_inflation.v1.json",
    contract: "scripts/fixtures/chatgpt_playwright_image_generation_contract.v1.json",
    createdAt: new Date().toISOString(),
    mode,
    submissionCount,
    submissionHardCap: SUBMISSION_HARD_CAP,
    generatedImages: generated,
    nativeResolutionNote: "실측값 그대로 기록 — 941x1672 native는 알려진 픽셀 예산 특성. viewer-frame QA에서 최종 판정.",
    preflightResult: preflight,
    autoRetryPerformed: false,
    upscaleUsed: false,
    placeholderUsed: false,
    costUsd: 0,
    risks: [],
  };
  if (fatalError) summary.risks.push(`fatal: ${fatalError}`);
  const sp = path.join(OUT_DIR_ABS, "image-generation-summary.v1.json");
  fs.writeFileSync(sp, JSON.stringify(summary, null, 2));
  log(`summary: ${sp}`);
  return summary;
}

// ── 메인 ─────────────────────────────────────────────────────────────────────
async function main() {
  const mode = PREFLIGHT_ONLY ? "preflight_only" : "generate";
  log(`=== ChatGPT+Playwright image method revalidation — mode: ${mode} ===`);
  log(`prompts: ${PROMPTS_PATH}`);
  log(`out-dir: ${OUT_DIR_ABS}`);

  await ensureChrome(CDP_PORT_GPT1, USER_DATA_GPT1, log);
  const browser = await chromium.connectOverCDP(`http://localhost:${CDP_PORT_GPT1}`);
  const ctx = browser.contexts()[0];
  if (!ctx) { console.error("ABORT: no browser context"); process.exit(1); }

  if (RECOVER_LATEST !== null) {
    try {
      const res = await recoverLatest(ctx, RECOVER_LATEST);
      if (res) writeSummary("recover_latest", { result: "N/A_RECOVER" }, [res]);
      await browser.close().catch(() => {});
      return;
    } catch (e) {
      console.error("[FATAL][gpt-reval] recover:", e.message);
      await browser.close().catch(() => {});
      process.exit(1);
    }
  }

  // preflight (전송 0회)
  const preflight = { result: null, stages: {} };
  {
    const page = await ctx.newPage();
    try {
      await checkLogin(page, log);
      preflight.stages.login = "pass";
      await detectStop(page);
      preflight.stages.stop_check = "pass";
      await activateImageToolCurrentUI(page);
      preflight.stages.image_tool = "pass";
      const ta = page.locator("#prompt-textarea").first();
      const taVisible = await ta.isVisible({ timeout: 8000 }).catch(() => false);
      preflight.stages.composer = taVisible ? "pass" : "fail";
      if (!taVisible) throw new Error("composer not visible");
      await typePrompt(page, prompts[0].finalPrompt + RESOLUTION_INSTRUCTION, log);
      const sendOk = await checkSendEnabled(page);
      preflight.stages.send_enabled = sendOk ? "pass" : "fail";
      if (!sendOk) throw new Error("send button disabled");
      preflight.result = "PREFLIGHT_PASS";
      log("PREFLIGHT_PASS ✅");
    } catch (e) {
      preflight.result = "PREFLIGHT_FAIL";
      preflight.error = e.message;
      log(`PREFLIGHT_FAIL ❌ — ${e.message}`);
    } finally {
      await page.close().catch(() => {});
    }
  }

  if (preflight.result !== "PREFLIGHT_PASS" || PREFLIGHT_ONLY) {
    writeSummary(mode, preflight, []);
    await browser.close().catch(() => {});
    if (preflight.result !== "PREFLIGHT_PASS") process.exit(1);
    log("preflight-only 모드 — 생성 생략, 종료");
    return;
  }

  const generated = [];
  for (const p of prompts) {
    try {
      const res = await generateImage(ctx, p);
      generated.push(res);
    } catch (e) {
      warn(`order ${p.order} 실패 — 자동 재시도 없이 멈추고 보고: ${e.message}`);
      writeSummary(mode, preflight, generated, e.message);
      await browser.close().catch(() => {});
      process.exit(1);
    }
  }

  writeSummary(mode, preflight, generated);
  await browser.close().catch(() => {});
  log(`완료 — ${generated.length}개 확보 (신규 제출 ${submissionCount}회, 하드캡 ${SUBMISSION_HARD_CAP})`);
}

main().catch((e) => {
  console.error("[FATAL][gpt-reval]", e.message);
  process.exit(1);
});
