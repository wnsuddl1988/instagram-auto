/**
 * Rate Freeze Golden Sample — Live Image Regeneration Runner v1
 *
 * 목적:
 *   visual_director_prompts.rate_freeze.v1.json의 6개 프롬프트를 기존 승인된
 *   live ChatGPT image path(Playwright + Chrome CDP, reference-free)에 연결해
 *   금리 동결 Golden Sample 이미지 6장을 재생성한다.
 *   목표: 모든 이미지 1080x1920 이상 vertical 9:16 (image_generation_contract gate).
 *
 * 배경 (941x1672 blocker 분석):
 *   기존 선택 세트 6장 + retry 1장이 전부 정확히 941x1672.
 *   941*1672 = 1,573,352 px ≈ 1024*1536 = 1,572,864 px (오차 0.03%).
 *   → 모델이 고정 픽셀 예산(~1.57MP)을 9:16으로 재배분한 네이티브 크기일 가능성이 높다.
 *   이 runner는 (1) 기존 대화 asset의 진짜 원본 크기를 read-only로 정찰하고,
 *   (2) probe 1회로 오늘 기준 상한을 실측한 뒤, (3) 상한이 gate를 넘을 때만
 *   전체 6장을 생성한다. upscale/crop/placeholder로 gate를 우회하지 않는다.
 *
 * 설계 원칙 (기존 fullset runner와 동일):
 *   - 프롬프트를 runner에 하드코딩하지 않는다. fixture에서만 읽는다.
 *   - 각 scene당 생성 1회. 자동 재시도/자동 프롬프트 수정 루프 없음.
 *   - scripts/_chatgpt-image-core.mjs의 공용 함수만 재사용 (core 무수정).
 *   - output은 output/money-shorts/rate-freeze-golden-sample-regen-v1/ 아래에만 저장.
 *   - 기존 first-run 산출물(owner QA 통과 evidence)은 절대 덮어쓰지 않는다.
 *
 * 보안 제약:
 *   - ALLOW_CHATGPT_IMAGE=1 없으면 즉시 중단 (contract readinessGate).
 *   - .money-shorts-local / .env.local / piq_diag_out.txt 접근 금지.
 *   - OpenAI/Gemini API 직접 호출 금지. fetch는 CDP/estuary 회수 용도만.
 *
 * 사용:
 *   node scripts/run-money-shorts-rate-freeze-image-regeneration-v1.mjs --inspect-existing
 *       기존 대화의 생성 이미지 asset 실측 크기/URL 구조/다운로드 변형/composer 크기 옵션을
 *       read-only로 정찰한다. 프롬프트 전송 0회.
 *   node scripts/run-money-shorts-rate-freeze-image-regeneration-v1.mjs --preflight-only
 *       로그인/이미지툴/composer/send-enabled 게이트만 확인. 전송 0회.
 *   node scripts/run-money-shorts-rate-freeze-image-regeneration-v1.mjs --probe-one
 *       scene_1만 1회 생성해 실측 해상도 상한을 확인한다 (명시적 min-resolution 지시 포함).
 *   node scripts/run-money-shorts-rate-freeze-image-regeneration-v1.mjs [--from-scene N]
 *       scene N부터 6까지 생성 (기본 1). probe가 gate를 통과했을 때만 사용할 것.
 *
 * exit code: 0 = 요청 모드 성공(생성 모드는 전 이미지 gate pass)
 *            2 = 생성은 됐으나 gate 미달 (blocker evidence 확보)
 *            1 = 실행 실패
 */

import { chromium } from "playwright";
import path from "path";
import fs from "fs";
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

const PROMPTS_PATH = path.join(REPO_ROOT, "scripts", "fixtures", "visual_director_prompts.rate_freeze.v1.json");
const OUT_DIR_ABS = path.join(REPO_ROOT, "output", "money-shorts", "rate-freeze-golden-sample-regen-v1");

const GATE = { minWidthPx: 1080, minHeightPx: 1920 };

const argv = process.argv.slice(2);
const INSPECT_EXISTING = argv.includes("--inspect-existing");
const PREFLIGHT_ONLY = argv.includes("--preflight-only");
const PROBE_ONE = argv.includes("--probe-one");

function getArg(name) {
  const i = argv.indexOf(name);
  if (i !== -1 && argv[i + 1]) return argv[i + 1];
  return null;
}
const FROM_SCENE = parseInt(getArg("--from-scene") || "1", 10);
if (!Number.isInteger(FROM_SCENE) || FROM_SCENE < 1 || FROM_SCENE > 6) {
  console.error(`ABORT: --from-scene 값은 1~6이어야 함 — 받은 값: ${getArg("--from-scene")}`);
  process.exit(1);
}

function ts() { return new Date().toISOString().slice(11, 19); }
function log(m) { console.log(`[${ts()}][rate-freeze-regen] ${m}`); }
function warn(m) { console.warn(`[WARN][rate-freeze-regen] ${m}`); }

// ── readiness gate: ALLOW_CHATGPT_IMAGE ──────────────────────────────────────
if (process.env.ALLOW_CHATGPT_IMAGE !== "1") {
  console.error("ABORT: ALLOW_CHATGPT_IMAGE=1 이 설정되지 않음 (image_generation_contract readinessGate).");
  process.exit(1);
}

// ── 프롬프트 fixture 로드 + 검증 ─────────────────────────────────────────────
const promptsDoc = JSON.parse(fs.readFileSync(PROMPTS_PATH, "utf8"));
if (promptsDoc.schemaVersion !== "money_shorts_visual_director_prompts_v1") {
  console.error(`ABORT: prompts schemaVersion 불일치 — ${promptsDoc.schemaVersion}`);
  process.exit(1);
}
const prompts = (promptsDoc.prompts || []).slice().sort((a, b) => a.order - b.order);
if (prompts.length !== 6 || JSON.stringify(prompts.map(p => p.order)) !== JSON.stringify([1, 2, 3, 4, 5, 6])) {
  console.error(`ABORT: prompts 6개(order 1..6) 기대 — 실제 ${prompts.length}개 [${prompts.map(p => p.order).join(",")}]`);
  process.exit(1);
}

const genTargets = PROBE_ONE
  ? prompts.filter(p => p.order === 1)
  : prompts.filter(p => p.order >= FROM_SCENE);

fs.mkdirSync(OUT_DIR_ABS, { recursive: true });

// ── 해상도 gate 명시 지시 (프롬프트 뒤 append) ──────────────────────────────
// 프롬프트 텍스트로 캔버스 크기를 바꿀 수 있는지 자체가 검증 대상이다.
// upscale이 아니라 "생성 캔버스 최소 크기" 요청이며, 결과는 실측으로만 판정한다.
const RESOLUTION_INSTRUCTION =
  " OUTPUT RESOLUTION REQUIREMENT: Generate this image at the highest resolution available. " +
  "The output canvas must be a vertical 9:16 frame of at least 1080x1920 pixels " +
  "(minimum width 1080 px, minimum height 1920 px). Do not produce a smaller canvas.";

function buildPromptForTarget(p) {
  return p.finalPrompt + RESOLUTION_INSTRUCTION;
}

function sceneFileName(p) {
  return `scene-${String(p.order).padStart(2, "0")}-${p.sceneRole}.png`;
}

// ── 이미지 바이너리 차원 sniff (PNG/JPEG/WebP, 의존성 없음) ──────────────────
function sniffImageDims(buf) {
  if (!buf || buf.length < 32) return null;
  // PNG
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    return { format: "png", w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
  }
  // JPEG
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
  // WebP
  if (buf.slice(0, 4).toString("ascii") === "RIFF" && buf.slice(8, 12).toString("ascii") === "WEBP") {
    const chunk = buf.slice(12, 16).toString("ascii");
    if (chunk === "VP8X") {
      const w = 1 + (buf[24] | (buf[25] << 8) | (buf[26] << 16));
      const h = 1 + (buf[27] | (buf[28] << 8) | (buf[29] << 16));
      return { format: "webp", w, h };
    }
    if (chunk === "VP8 ") {
      const w = buf.readUInt16LE(26) & 0x3fff;
      const h = buf.readUInt16LE(28) & 0x3fff;
      return { format: "webp", w, h };
    }
    if (chunk === "VP8L") {
      const b = buf.readUInt32LE(21);
      const w = (b & 0x3fff) + 1;
      const h = ((b >> 14) & 0x3fff) + 1;
      return { format: "webp", w, h };
    }
    return { format: "webp", w: null, h: null };
  }
  return null;
}

// ── page 컨텍스트에서 URL의 실제 디코드 크기 측정 (다운로드 없이) ────────────
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

// ── 마지막 assistant 이미지 후보 심층 수집 (src + srcset + anchor href) ──────
async function collectCandidateUrlsDeep(page) {
  return await page.evaluate(() => {
    const msgs = Array.from(document.querySelectorAll('[data-message-author-role="assistant"]'));
    if (msgs.length === 0) return [];
    const lastMsg = msgs[msgs.length - 1];
    function cid(s) { const m = (s || "").match(/[?&]id=([^&]+)/); return m ? m[1] : null; }
    const out = [];
    for (const img of Array.from(lastMsg.querySelectorAll("img"))) {
      if (img.naturalWidth < 200) continue;
      const src = img.src || img.currentSrc || "";
      if (!src) continue;
      const gen = /backend-api\/estuary\/content|backend-api\/files|oaiusercontent/.test(src);
      const urls = [{ url: src, kind: "src" }];
      const srcset = img.srcset || "";
      for (const entry of srcset.split(",")) {
        const u = entry.trim().split(/\s+/)[0];
        if (u && u !== src) urls.push({ url: u, kind: "srcset" });
      }
      const a = img.closest("a");
      if (a && a.href && a.href !== src) urls.push({ url: a.href, kind: "anchor" });
      out.push({
        cid: cid(src), gen,
        naturalW: img.naturalWidth, naturalH: img.naturalHeight,
        urls,
      });
    }
    return out;
  });
}

// ── URL 요약 (서명 파라미터 노출 방지) ───────────────────────────────────────
function redactUrl(u) {
  try {
    const url = new URL(u);
    const keys = Array.from(url.searchParams.keys());
    return `${url.origin}${url.pathname}?${keys.map(k => `${k}=…`).join("&")}`;
  } catch { return (u || "").slice(0, 80); }
}

// ── 최고 해상도 후보 선택 + 저장 ─────────────────────────────────────────────
async function saveBestImage(page, destPath, baselineCids) {
  const groups = await collectCandidateUrlsDeep(page);
  const fresh = groups.filter(g => g.gen && (!g.cid || !baselineCids.has(g.cid)));
  const usable = fresh.length > 0 ? fresh : groups.filter(g => g.gen);
  const evidence = [];
  let best = null;

  for (const g of usable) {
    for (const cand of g.urls) {
      const m = await measureUrlInPage(page, cand.url);
      evidence.push({ kind: cand.kind, url: redactUrl(cand.url), naturalW: g.naturalW, naturalH: g.naturalH, measured: m });
      if (m.ok && (!best || m.w * m.h > best.m.w * best.m.h)) {
        best = { url: cand.url, kind: cand.kind, m };
      }
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
      fs.writeFileSync(destPath, Buffer.from(buf));
      const dims = sniffImageDims(Buffer.from(buf));
      return { ok: true, method: `best_candidate_${best.kind}`, w: dims?.w ?? best.m.w, h: dims?.h ?? best.m.h, format: dims?.format, bytes: buf.length, evidence };
    }
  }

  // intercept fallback (first-run에서 실제 주력이었던 경로)
  const convUrl = page.url();
  const intercepted = await interceptRecover(page, convUrl, log);
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

// ── 이미지 도구 활성화 (기존 fullset runner와 동일 검증 경로) ────────────────
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

// ── composer 주변 크기/비율 옵션 UI 정찰 (read-only) ─────────────────────────
async function auditComposerSizeOptions(page) {
  return await page.evaluate(() => {
    const form = document.querySelector("form") || document.body;
    const texts = [];
    for (const el of Array.from(form.querySelectorAll("button, [role='button'], [role='combobox'], select, [aria-haspopup]"))) {
      const t = (el.getAttribute("aria-label") || el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 60);
      if (t) texts.push(t);
    }
    const uniq = Array.from(new Set(texts));
    const sizeRelated = uniq.filter(t => /비율|크기|해상도|aspect|ratio|size|resolution|1:1|2:3|3:2|9:16|16:9/i.test(t));
    return { composerControls: uniq.slice(0, 40), sizeRelated };
  }).catch(() => ({ composerControls: [], sizeRelated: [] }));
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

// ── 단일 scene 생성 (1회, 자동 재시도 없음) ──────────────────────────────────
async function generateScene(ctx, p) {
  const fileName = sceneFileName(p);
  log(`=== scene ${p.order} (${p.sceneRole}) 생성 시작 → ${fileName} ===`);
  const destPath = path.join(OUT_DIR_ABS, fileName);
  const promptText = buildPromptForTarget(p);
  const page = await prepComposer(ctx, promptText);

  const baseImgs = await collectLastAssistantImages(page);
  const baselineCids = new Set(baseImgs.map(x => x.cid).filter(Boolean));

  const sendBtn = page.locator(
    '#composer-submit-button, button[data-testid="send-button"], ' +
    'button[aria-label="Send message"], button[aria-label="메시지 보내기"]'
  ).first();
  await sendBtn.click();
  log(`scene ${p.order} 전송 완료 — 생성 대기 중...`);

  const maxPolls = 120; // 240s
  let done = false;
  for (let i = 0; i < maxPolls; i++) {
    await page.waitForTimeout(2000);
    if (await isAssistantDone(page)) {
      await page.waitForTimeout(3000);
      const imgs = await collectLastAssistantImages(page);
      if (imgs.some(x => x.gen)) { done = true; break; }
    }
  }
  if (!done) warn(`scene ${p.order}: 생성 완료 감지 timeout — 후보 수집/intercept fallback 시도`);

  const saveRes = await saveBestImage(page, destPath, baselineCids);
  await page.close().catch(() => {});

  if (!saveRes.ok) throw new Error(`scene ${p.order} (${p.sceneRole}): 이미지 저장 실패 (${saveRes.method})`);

  const gatePass = saveRes.w >= GATE.minWidthPx && saveRes.h >= GATE.minHeightPx;
  log(`scene ${p.order} 저장 ✅ ${destPath}`);
  log(`  실측: ${saveRes.w}x${saveRes.h} ${saveRes.format || "?"} (${Math.round((saveRes.bytes || 0) / 1024)}KB, ${saveRes.method}) gate=${gatePass ? "PASS" : "FAIL"}`);
  return {
    order: p.order, sceneId: p.sceneId, sceneRole: p.sceneRole,
    imagePath: destPath, width: saveRes.w, height: saveRes.h, format: saveRes.format,
    bytes: saveRes.bytes, saveMethod: saveRes.method, gatePass,
    candidateEvidence: saveRes.evidence,
    promptHash: hashText(p.finalPrompt),
    resolutionInstructionAppended: true,
  };
}

// ── 기존 대화 asset read-only 정찰 ───────────────────────────────────────────
async function inspectExistingAssets(ctx) {
  log("=== INSPECT-EXISTING (read-only, 전송 0회) ===");
  const page = await ctx.newPage();
  await checkLogin(page, log);
  await detectStop(page);

  // 사이드바 최근 대화 링크 수집
  const convLinks = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a[href^="/c/"]'))
      .slice(0, 10)
      .map(a => ({ href: a.href, title: (a.textContent || "").trim().slice(0, 60) }));
  });
  log(`사이드바 대화 ${convLinks.length}개 발견`);

  const inspected = [];
  let imagesSeen = 0;
  for (const conv of convLinks) {
    if (imagesSeen >= 4) break; // 이미지 4개 표본이면 충분
    await page.goto(conv.href, { waitUntil: "domcontentloaded", timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(3500);
    const groups = await page.evaluate(() => {
      function cid(s) { const m = (s || "").match(/[?&]id=([^&]+)/); return m ? m[1] : null; }
      const out = [];
      for (const img of Array.from(document.querySelectorAll('[data-message-author-role="assistant"] img'))) {
        if (img.naturalWidth < 200) continue;
        const src = img.src || img.currentSrc || "";
        if (!/backend-api\/estuary\/content|backend-api\/files|oaiusercontent/.test(src)) continue;
        const urls = [{ url: src, kind: "src" }];
        for (const entry of (img.srcset || "").split(",")) {
          const u = entry.trim().split(/\s+/)[0];
          if (u && u !== src) urls.push({ url: u, kind: "srcset" });
        }
        const a = img.closest("a");
        if (a && a.href && a.href !== src) urls.push({ url: a.href, kind: "anchor" });
        out.push({ cid: cid(src), naturalW: img.naturalWidth, naturalH: img.naturalHeight, urls, srcsetRaw: (img.srcset || "").slice(0, 200) });
      }
      return out;
    });
    for (const g of groups.slice(0, 2)) {
      const measured = [];
      for (const cand of g.urls) {
        const m = await measureUrlInPage(page, cand.url);
        measured.push({ kind: cand.kind, url: redactUrl(cand.url), result: m });
        log(`  [${conv.title || "무제"}] ${cand.kind}: ${m.ok ? `${m.w}x${m.h} (${Math.round(m.bytes / 1024)}KB ${m.type})` : `실패 ${m.status || m.error}`}`);
      }
      inspected.push({ conversation: conv.title, naturalW: g.naturalW, naturalH: g.naturalH, srcsetRaw: g.srcsetRaw, measured });
      imagesSeen++;
    }
  }

  // composer 크기 옵션 정찰 (새 대화, 이미지 도구 활성화 후 — 전송 없음)
  let composerAudit = { composerControls: [], sizeRelated: [] };
  try {
    await page.goto("https://chatgpt.com/", { waitUntil: "domcontentloaded", timeout: 20000 });
    await page.waitForTimeout(1500);
    await activateImageToolCurrentUI(page);
    composerAudit = await auditComposerSizeOptions(page);
    log(`composer 컨트롤 ${composerAudit.composerControls.length}개, 크기/비율 관련: ${JSON.stringify(composerAudit.sizeRelated)}`);
  } catch (e) {
    warn(`composer 옵션 정찰 실패: ${e.message}`);
  }
  await page.close().catch(() => {});

  const maxFound = inspected.flatMap(i => i.measured).filter(m => m.result?.ok)
    .reduce((mx, m) => Math.max(mx, m.result.w * m.result.h), 0);
  const recon = {
    schemaVersion: "money_shorts_rate_freeze_regen_recon_v1",
    createdAt: new Date().toISOString(),
    mode: "inspect_existing_read_only",
    promptSendCount: 0,
    inspectedImageCount: inspected.length,
    inspected,
    composerAudit,
    maxMeasuredPixels: maxFound,
    gateNeededPixels: GATE.minWidthPx * GATE.minHeightPx,
    note: "기존 대화 assistant 이미지의 src/srcset/anchor 후보를 페이지 내 fetch+createImageBitmap으로 실측. 서명 URL 파라미터 값은 기록하지 않음.",
  };
  const rp = path.join(OUT_DIR_ABS, "recon-existing-assets.v1.json");
  fs.writeFileSync(rp, JSON.stringify(recon, null, 2));
  log(`recon 저장: ${rp}`);
  return recon;
}

// ── summary ──────────────────────────────────────────────────────────────────
function writeSummary(mode, preflight, generated, fatalError = null) {
  const allPass = generated.length > 0 && generated.every(g => g.gatePass);
  const summary = {
    schemaVersion: "money_shorts_rate_freeze_regen_summary_v1",
    taskId: "creative-v2-rate-freeze-live-image-regeneration-v1",
    sourcePrompts: "scripts/fixtures/visual_director_prompts.rate_freeze.v1.json",
    createdAt: new Date().toISOString(),
    mode,
    imageQualityGate: GATE,
    generatedScenes: generated,
    allGeneratedPassGate: allPass,
    preflightResult: preflight,
    autoRegenerationPerformed: false,
    upscaleUsed: false,
    placeholderUsed: false,
    notes: [
      "reference-free ChatGPT image generation, visual_director_prompts.rate_freeze.v1 consumer.",
      "각 scene 1회 생성, 자동 재시도 없음. RESOLUTION_INSTRUCTION을 finalPrompt 뒤에 append.",
      "저장 후보는 src/srcset/anchor 전부 실측해 최대 해상도만 저장. upscale/crop 없음.",
      "실측 해상도는 저장 파일의 바이너리 헤더 기준 (sniffImageDims).",
    ],
    risks: [],
  };
  if (fatalError) summary.risks.push(`fatal: ${fatalError}`);
  const name = mode === "probe_one" ? "probe-one-summary.json" : "regen-summary.json";
  const sp = path.join(OUT_DIR_ABS, name);
  fs.writeFileSync(sp, JSON.stringify(summary, null, 2));
  log(`summary: ${sp}`);
  return summary;
}

// ── 메인 ─────────────────────────────────────────────────────────────────────
async function main() {
  const mode = INSPECT_EXISTING ? "inspect_existing" : PREFLIGHT_ONLY ? "preflight_only" : PROBE_ONE ? "probe_one" : "generate";
  log(`=== Rate Freeze image regeneration — mode: ${mode} ===`);
  log(`prompts: ${PROMPTS_PATH}`);
  log(`out-dir: ${OUT_DIR_ABS}`);

  await ensureChrome(CDP_PORT_GPT1, USER_DATA_GPT1, log);
  const browser = await chromium.connectOverCDP(`http://localhost:${CDP_PORT_GPT1}`);
  const ctx = browser.contexts()[0];
  if (!ctx) { console.error("ABORT: no browser context"); process.exit(1); }

  if (INSPECT_EXISTING) {
    await inspectExistingAssets(ctx);
    await browser.close().catch(() => {});
    return;
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
      await typePrompt(page, buildPromptForTarget(genTargets[0]), log);
      const sendOk = await checkSendEnabled(page);
      preflight.stages.send_enabled = sendOk ? "pass" : "fail";
      if (!sendOk) throw new Error("send button disabled");
      preflight.composerSizeOptions = await auditComposerSizeOptions(page);
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
  for (const p of genTargets) {
    try {
      const res = await generateScene(ctx, p);
      generated.push(res);
      // probe/generate 공통: gate 미달이 확인되면 남은 scene 생성을 멈추고 blocker 보고
      // (동일 픽셀 예산이면 나머지도 미달 — 생성 낭비 방지)
      if (!res.gatePass) {
        warn(`scene ${p.order} gate 미달 (${res.width}x${res.height} < ${GATE.minWidthPx}x${GATE.minHeightPx}) — 남은 생성 중단, blocker 보고`);
        break;
      }
    } catch (e) {
      warn(`scene ${p.order} 실패 — 자동 재시도 없이 멈추고 보고: ${e.message}`);
      writeSummary(mode, preflight, generated, e.message);
      await browser.close().catch(() => {});
      process.exit(1);
    }
  }

  const summary = writeSummary(mode, preflight, generated);
  await browser.close().catch(() => {});
  const failCount = generated.filter(g => !g.gatePass).length;
  log(`완료 — ${generated.length}개 생성, gate pass ${generated.length - failCount}/${generated.length}`);
  if (failCount > 0) process.exit(2);
}

main().catch((e) => {
  console.error("[FATAL][rate-freeze-regen]", e.message);
  process.exit(1);
});
