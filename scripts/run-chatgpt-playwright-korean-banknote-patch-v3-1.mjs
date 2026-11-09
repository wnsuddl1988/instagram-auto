/**
 * ChatGPT+Playwright Fresh Image Set Runner v3
 * task: golden-sample-chatgpt-playwright-korean-banknote-clarity-patch-v3-1
 *
 * v2 runner 대비 변경: v3 prompts fixture(완전 신규 9 beat 세트) 소비, 제출 하드캡 12,
 * 산출 디렉터리 분리(fresh-image-set-v3). 감지/저장 속도 규칙은 v2에서 실증된 로직 그대로:
 *   · 제출 후 25초 passive(중단 조건만 감시) → 1.8초 간격 active poll
 *   · page-wide estuary/oaiusercontent/blob 수집 (assistant-scope 신뢰 금지, user 첨부 제외)
 *   · 신규 후보 3회 연속 stable(같은 key+크기)이면 idle 대기 없이 즉시 저장
 *   · 150초 미감지: diagnostic screenshot/DOM summary + current-page recover 1회
 *     (무관한 sidebar/old conversation scan 금지)
 *   · 180초 회수 불가: TIMEOUT_BLOCKED 기록 후 다음 prompt 진행
 *   · latency 기록: submittedAt / firstCandidateAt / savedAt / detectionLatency
 *   · 가시 생성 후 저장 지연 >30초는 report에 필수 기록
 *
 * 재생성 정책: 품질 미달 이미지는 기존 파일을 `<이름>.rejected-rN.png`로 rename 후 재실행
 * 하면 해당 order만 다시 제출된다 (existing-file skip이 최종 파일명 기준). 자동 retry 루프
 * 없음 — 하드캡 12는 절대 초과 불가.
 *
 * 보안: ALLOW_CHATGPT_IMAGE=1 필수. OpenAI/FLUX2(BFL)/Gemini/Midjourney/유료 API 금지.
 * .env.local / .money-shorts-local / secret 접근 금지. fetch는 CDP/estuary 회수 용도만.
 */

import { chromium } from "playwright";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { fileURLToPath } from "url";

import {
  CDP_PORT_GPT1, USER_DATA_GPT1,
  hashText,
  ensureChrome, detectStop,
  typePrompt, checkSendEnabled,
  interceptRecover,
} from "./_chatgpt-image-core.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");

const PROMPTS_PATH = path.join(REPO_ROOT, "scripts", "fixtures", "chatgpt_playwright_image_prompts.t1_lifestyle_inflation.v3_1_banknote_patch.json");
const OUT_DIR_ABS = path.join(REPO_ROOT, "output", "money-shorts", "chatgpt-playwright-korean-banknote-patch-v3-1");

const SUBMISSION_HARD_CAP = 6;
let submissionCount = 0;

const PASSIVE_UNTIL_MS = 25000;   // 제출 후 25초까지 passive
const POLL_INTERVAL_MS = 1800;    // active poll 간격
const STABLE_POLLS = 3;           // 3회 연속 stable → 즉시 저장
const DIAG_AT_MS = 150000;        // 150초: 진단 + current-page recover
const HARD_TIMEOUT_MS = 180000;   // 180초: TIMEOUT_BLOCKED

function ts() { return new Date().toISOString().slice(11, 19); }
function log(m) { console.log(`[${ts()}][gpt-krw-patch-v3-1] ${m}`); }
function warn(m) { console.warn(`[WARN][gpt-krw-patch-v3-1] ${m}`); }

if (process.env.ALLOW_CHATGPT_IMAGE !== "1") {
  console.error("ABORT: ALLOW_CHATGPT_IMAGE=1 이 설정되지 않음 (generation contract readinessGate).");
  process.exit(1);
}

const promptsDoc = JSON.parse(fs.readFileSync(PROMPTS_PATH, "utf8"));
if (promptsDoc.schemaVersion !== "chatgpt_playwright_image_prompts_v3_1_banknote_patch") {
  console.error(`ABORT: prompts schemaVersion 불일치 — ${promptsDoc.schemaVersion}`);
  process.exit(1);
}
const prompts = (promptsDoc.prompts || []).slice().sort((a, b) => a.order - b.order);
if (prompts.length < 1 || prompts.length > 6) {
  console.error(`ABORT: prompts 1~6개 기대 — 실제 ${prompts.length}개`);
  process.exit(1);
}
fs.mkdirSync(OUT_DIR_ABS, { recursive: true });

const RESOLUTION_INSTRUCTION =
  " OUTPUT FORMAT REQUIREMENT: vertical 9:16 portrait canvas at the highest resolution available " +
  "(target at least 1080x1920 pixels). Do not add any text, letters, numbers or watermark to the image.";

const imageFileName = (p) => `img-${String(p.order).padStart(2, "0")}-${p.imageId}.png`;

// ── 이미지 바이너리 차원 sniff ───────────────────────────────────────────────
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
    } catch (e) { return { ok: false, error: String(e).slice(0, 120) }; }
  }, url).catch((e) => ({ ok: false, error: String(e).slice(0, 120) }));
}

// page-wide 생성 이미지 수집 (user 첨부 제외)
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

async function collectCandidateUrlsDeep(page) {
  return await page.evaluate(() => {
    function cid(s) { const m = (s || "").match(/[?&]id=([^&]+)/); return m ? m[1] : null; }
    const out = [];
    const seen = new Set();
    for (const img of Array.from(document.querySelectorAll("img"))) {
      if (img.naturalWidth < 200) continue;
      if (img.closest('[data-message-author-role="user"]')) continue;
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

function redactUrl(u) {
  try {
    const url = new URL(u);
    const keys = Array.from(url.searchParams.keys());
    return `${url.origin}${url.pathname}?${keys.map(k => `${k}=…`).join("&")}`;
  } catch { return (u || "").slice(0, 80); }
}

async function saveBestImage(page, destPath, baselineCids) {
  const groups = await collectCandidateUrlsDeep(page);
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
  // current-page intercept recover (sidebar scan 없음)
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

// ── 단일 이미지 생성 (속도 규칙 적용) ────────────────────────────────────────
async function generateImage(ctx, p, latencyEntries) {
  const fileName = imageFileName(p);
  const destPath = path.join(OUT_DIR_ABS, fileName);

  if (fs.existsSync(destPath)) {
    log(`order ${p.order} (${p.imageId}) — 기존 산출물 존재, 재제출 skip (하드캡 보호)`);
    const b = fs.readFileSync(destPath);
    const dims = sniffImageDims(b);
    return {
      order: p.order, imageId: p.imageId, beat: p.beat, imagePath: destPath,
      width: dims?.w, height: dims?.h, format: dims?.format, bytes: b.length,
      md5: crypto.createHash("md5").update(b).digest("hex"),
      saveMethod: "existing_file_skip", promptHash: hashText(p.finalPrompt), submitted: false,
    };
  }
  if (submissionCount >= SUBMISSION_HARD_CAP) {
    throw new Error(`SUBMISSION_HARD_CAP(${SUBMISSION_HARD_CAP}) 도달 — order ${p.order} 제출 불가`);
  }

  log(`=== order ${p.order} (${p.imageId}) 생성 시작 → ${fileName} ===`);
  const page = await prepComposer(ctx, p.finalPrompt + RESOLUTION_INSTRUCTION);
  const baseImgs = await collectGenImagesPageWide(page);
  const baselineCids = new Set(baseImgs.map(x => x.cid).filter(Boolean));

  const sendBtn = page.locator(
    '#composer-submit-button, button[data-testid="send-button"], ' +
    'button[aria-label="Send message"], button[aria-label="메시지 보내기"]'
  ).first();
  await sendBtn.click();
  submissionCount++;
  const submittedAt = Date.now();
  const lat = { order: p.order, imageId: p.imageId, submittedAtIso: new Date(submittedAt).toISOString(), firstCandidateSec: null, savedSec: null, detectionLatencySec: null, delayedSaveOver30s: false, result: null };
  latencyEntries.push(lat);
  log(`order ${p.order} 전송 완료 (submission ${submissionCount}/${SUBMISSION_HARD_CAP}) — passive 25s 후 active poll`);

  // passive 구간 (중단 조건만)
  while (Date.now() - submittedAt < PASSIVE_UNTIL_MS) {
    await page.waitForTimeout(5000);
    await detectStop(page).catch(e => { throw e; });
  }

  // active poll: stable 3회 → 즉시 저장
  let stableKey = null, stableCount = 0, diagDone = false, saveRes = null;
  while (Date.now() - submittedAt < HARD_TIMEOUT_MS) {
    await page.waitForTimeout(POLL_INTERVAL_MS);
    const elapsed = Math.round((Date.now() - submittedAt) / 1000);
    const imgs = await collectGenImagesPageWide(page);
    const fresh = imgs.filter(x => x.w >= 400 && (!x.cid || !baselineCids.has(x.cid)));
    if (fresh.length > 0 && lat.firstCandidateSec === null) {
      lat.firstCandidateSec = elapsed;
      log(`  first candidate detected at ${elapsed}s (${fresh[0].w}x${fresh[0].h})`);
    }
    if (fresh.length > 0) {
      const f = fresh[0];
      const key = `${f.cid || f.src.slice(0, 80)}|${f.w}x${f.h}`;
      if (key === stableKey) stableCount++;
      else { stableKey = key; stableCount = 1; }
      if (stableCount >= STABLE_POLLS) {
        log(`  stable x${STABLE_POLLS} at ${elapsed}s — 즉시 저장 시도`);
        saveRes = await saveBestImage(page, destPath, baselineCids);
        if (saveRes.ok) break;
        warn(`  저장 실패(${saveRes.method}) — 계속 폴링`);
        stableCount = 0;
      }
    } else if (elapsed % 15 < 2) {
      log(`  poll ${elapsed}s: fresh 후보 없음 (genImgs=${imgs.length})`);
    }
    // 150초 진단 + current-page recover 1회
    if (!diagDone && Date.now() - submittedAt >= DIAG_AT_MS) {
      diagDone = true;
      warn(`  ${Math.round(DIAG_AT_MS / 1000)}s 미감지 — diagnostic + current-page recover 시도`);
      const diagPng = path.join(OUT_DIR_ABS, `diag_order${p.order}_150s.png`);
      await page.screenshot({ path: diagPng, fullPage: false }).catch(() => {});
      const domSummary = await page.evaluate(() => ({
        url: location.href.split("?")[0],
        imgCount: document.images.length,
        bodyHead: (document.body.innerText || "").slice(0, 200),
      })).catch(() => ({}));
      fs.writeFileSync(path.join(OUT_DIR_ABS, `diag_order${p.order}_150s.json`), JSON.stringify(domSummary, null, 2));
      saveRes = await saveBestImage(page, destPath, baselineCids); // 내부에 current-page intercept 포함
      if (saveRes.ok) break;
    }
  }

  if (!saveRes || !saveRes.ok) {
    // 180초 최종: 마지막 1회 회수 시도 후 TIMEOUT_BLOCKED
    saveRes = await saveBestImage(page, destPath, baselineCids);
  }
  await page.close().catch(() => {});

  if (!saveRes.ok) {
    lat.result = "TIMEOUT_BLOCKED";
    warn(`order ${p.order}: TIMEOUT_BLOCKED (180s) — 다음 prompt 진행`);
    return { order: p.order, imageId: p.imageId, beat: p.beat, result: "TIMEOUT_BLOCKED", submitted: true };
  }

  lat.savedSec = Math.round((Date.now() - submittedAt) / 1000);
  lat.detectionLatencySec = lat.firstCandidateSec !== null ? lat.savedSec - lat.firstCandidateSec : null;
  lat.delayedSaveOver30s = lat.detectionLatencySec !== null && lat.detectionLatencySec > 30;
  lat.result = "SAVED";
  if (lat.delayedSaveOver30s) warn(`order ${p.order}: 가시 생성 후 저장 지연 ${lat.detectionLatencySec}s (>30s) — report 기록`);

  const b = fs.readFileSync(destPath);
  const md5 = crypto.createHash("md5").update(b).digest("hex");
  log(`order ${p.order} 저장 ✅ ${destPath}`);
  log(`  실측: ${saveRes.w}x${saveRes.h} ${saveRes.format || "?"} (${Math.round((saveRes.bytes || 0) / 1024)}KB, ${saveRes.method}) md5=${md5}`);
  log(`  latency: submitted→first ${lat.firstCandidateSec}s, submitted→saved ${lat.savedSec}s`);
  return {
    order: p.order, imageId: p.imageId, beat: p.beat, imagePath: destPath,
    width: saveRes.w, height: saveRes.h, format: saveRes.format, bytes: saveRes.bytes,
    md5, saveMethod: saveRes.method, promptHash: hashText(p.finalPrompt), submitted: true,
  };
}

function writeSummary(generated, latencyEntries, fatalError = null) {
  const summary = {
    schemaVersion: "chatgpt_playwright_korean_banknote_patch_summary_v3_1",
    taskId: "golden-sample-chatgpt-playwright-korean-banknote-clarity-patch-v3-1",
    sourcePrompts: "scripts/fixtures/chatgpt_playwright_image_prompts.t1_lifestyle_inflation.v3_1_banknote_patch.json",
    createdAt: new Date().toISOString(),
    submissionCount,
    submissionHardCap: SUBMISSION_HARD_CAP,
    generatedImages: generated,
    autoRetryPerformed: false,
    upscaleUsed: false,
    placeholderUsed: false,
    costUsd: 0,
    risks: fatalError ? [`fatal: ${fatalError}`] : [],
  };
  fs.writeFileSync(path.join(OUT_DIR_ABS, "image-generation-summary.v3_1.json"), JSON.stringify(summary, null, 2));
  const latReport = {
    schemaVersion: "chatgpt_generation_latency_report_v1",
    taskId: "golden-sample-chatgpt-playwright-korean-banknote-clarity-patch-v3-1",
    createdAt: new Date().toISOString(),
    rules: { passiveUntilSec: 25, pollIntervalSec: 1.8, stablePolls: 3, diagAtSec: 150, hardTimeoutSec: 180 },
    entries: latencyEntries,
  };
  fs.writeFileSync(path.join(OUT_DIR_ABS, "generation-latency-report.v3_1.json"), JSON.stringify(latReport, null, 2));
  log(`summary + latency report 저장 (${OUT_DIR_ABS})`);
  return summary;
}

async function main() {
  log("=== v3.1 korean banknote patch generation ===");
  log(`prompts: ${PROMPTS_PATH}`);
  log(`out-dir: ${OUT_DIR_ABS}`);
  await ensureChrome(CDP_PORT_GPT1, USER_DATA_GPT1, log);
  const browser = await chromium.connectOverCDP(`http://localhost:${CDP_PORT_GPT1}`);
  const ctx = browser.contexts()[0];
  if (!ctx) { console.error("ABORT: no browser context"); process.exit(1); }

  const generated = [];
  const latencyEntries = [];
  for (const p of prompts) {
    try {
      const res = await generateImage(ctx, p, latencyEntries);
      generated.push(res);
    } catch (e) {
      warn(`order ${p.order} 실패 — 자동 재시도 없이 멈추고 보고: ${e.message}`);
      writeSummary(generated, latencyEntries, e.message);
      await browser.close().catch(() => {});
      process.exit(1);
    }
  }
  writeSummary(generated, latencyEntries);
  await browser.close().catch(() => {});
  const blocked = generated.filter(g => g.result === "TIMEOUT_BLOCKED").length;
  log(`완료 — ${generated.length - blocked}/${generated.length} 저장 (신규 제출 ${submissionCount}회, 하드캡 ${SUBMISSION_HARD_CAP})`);
  if (blocked > 0) process.exit(2);
}

main().catch((e) => {
  console.error("[FATAL][gpt-krw-patch-v3-1]", e.message);
  process.exit(1);
});
