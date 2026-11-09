/**
 * Golden Sample Image Source Small Provider Test v1
 *
 * 목적:
 *   T2("월급이 3일 만에 사라지는 이유") 공통 프롬프트 4종으로
 *   (1) ChatGPT+Playwright control, (2) OpenAI gpt-image-2, (3) FLUX.2 [pro]의
 *   9:16 native 1080x1920+ gate 통과 여부와 주제 전달력 후보를 실측 비교한다.
 *   자동화 구현이 아니라 소량 실측 테스트다. render/TTS/mux/upload 없음.
 *
 * 안전 규칙:
 *   - secret 값은 절대 출력/기록하지 않는다 (존재 여부 boolean만).
 *   - .env.local은 읽기만 하고 수정하지 않는다.
 *   - paid provider당 최대 4장(+size fallback 1회), 총 8장, 비용 상한 $3 설계.
 *   - 재시도 루프 금지: size 거부 시 1088x1936 → 1088x1920 1회 fallback만.
 *   - Gemini/Midjourney 호출 없음. placeholder/upscale 없음.
 *
 * 사용:
 *   node scripts/run-golden-sample-image-source-test-v1.mjs --provider openai
 *   node scripts/run-golden-sample-image-source-test-v1.mjs --provider flux
 *   ALLOW_CHATGPT_IMAGE=1 node scripts/run-golden-sample-image-source-test-v1.mjs --provider chatgpt
 *
 * exit: 0 = provider 실행 완료(개별 이미지 실패 포함 가능, summary 참조), 1 = provider 자체 실행 불가
 */

import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const PROMPTS_PATH = path.join(REPO_ROOT, "scripts", "fixtures", "golden_sample_image_source_test_prompts.v1.json");
const OUT_DIR = path.join(REPO_ROOT, "output", "money-shorts", "golden-sample-image-source-test-v1");

const GATE = { minW: 1080, minH: 1920, aspectTarget: 0.5625, aspectTol: 0.01 };
const SIZE_PRIMARY = { w: 1088, h: 1936 };
const SIZE_FALLBACK = { w: 1088, h: 1920 };
const MAX_IMAGES_PER_PAID_PROVIDER = 4;

const argv = process.argv.slice(2);
function getArg(name) { const i = argv.indexOf(name); return i !== -1 && argv[i + 1] ? argv[i + 1] : null; }
const PROVIDER = getArg("--provider");
if (!["openai", "flux", "chatgpt"].includes(PROVIDER || "")) {
  console.error("ABORT: --provider openai|flux|chatgpt 필요");
  process.exit(1);
}

function ts() { return new Date().toISOString().slice(11, 19); }
function log(m) { console.log(`[${ts()}][img-src-test:${PROVIDER}] ${m}`); }
function warn(m) { console.warn(`[WARN][img-src-test:${PROVIDER}] ${m}`); }

// ── fail-closed paid image allow guard (secret read / browser / API 호출 전에 통과) ──
// PAID_API_ENABLED=true 하나만으로는 열리지 않는다. provider allow flag도 명시 true여야 한다.
// chatgpt는 별도로 browser/CDP 직전에 ALLOW_CHATGPT_IMAGE=1도 재확인한다.
// Owner decision: image_script_allow_guard = add_allow_guard_to_all_paid_image_scripts.
function assertProviderAllowed(provider) {
  const isTrue = (k) => String(process.env[k] ?? "").toLowerCase() === "true";
  if (provider === "chatgpt") {
    // ChatGPT/Playwright 경로는 유료 API가 아니라 browser 자동화. 전용 flag만 요구.
    if (process.env.ALLOW_CHATGPT_IMAGE !== "1") {
      console.error("ABORT: chatgpt 경로 차단 (fail-closed). 필요한 env: ALLOW_CHATGPT_IMAGE=1 — browser/CDP 실행 전에 중단.");
      process.exit(2);
    }
    return;
  }
  const providerFlagKey = provider === "openai" ? "ALLOW_OPENAI_IMAGE" : "ALLOW_BFL_FLUX2";
  const master = isTrue("PAID_API_ENABLED");
  const providerAllowed = isTrue(providerFlagKey);
  if (!master || !providerAllowed) {
    const need = [];
    if (!master) need.push("PAID_API_ENABLED=true");
    if (!providerAllowed) need.push(`${providerFlagKey}=true`);
    console.error(`ABORT: paid image 경로 차단 (fail-closed). 필요한 env: ${need.join(", ")} — secret/API 호출 전에 중단.`);
    process.exit(2);
  }
}
assertProviderAllowed(PROVIDER);

// ── .env.local 로드 (값 미출력, 수정 없음, secret 최소화) ────────────────────
// 이 runner가 필요한 두 key만 메모리에 보관한다. 다른 env/secret은 파싱 즉시 버린다.
function loadEnvLocal() {
  const envPath = path.join(REPO_ROOT, ".env.local");
  const WANTED = new Set(["OPENAI_API_KEY", "BFL_API_KEY"]);
  const out = {};
  try {
    for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
      const m = line.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/);
      if (!m || !WANTED.has(m[1])) continue;
      let v = m[2].trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      out[m[1]] = v;
    }
  } catch { /* .env.local 없으면 process env만 사용 */ }
  return out;
}
const envLocal = loadEnvLocal();
const OPENAI_KEY = process.env.OPENAI_API_KEY || envLocal.OPENAI_API_KEY || null;
const BFL_KEY = process.env.BFL_API_KEY || envLocal.BFL_API_KEY || null;

// ── 프롬프트 fixture ─────────────────────────────────────────────────────────
const promptsDoc = JSON.parse(fs.readFileSync(PROMPTS_PATH, "utf8"));
if (promptsDoc.schemaVersion !== "money_shorts_image_source_test_prompts_v1" || (promptsDoc.prompts || []).length !== 4) {
  console.error("ABORT: prompts fixture 불일치");
  process.exit(1);
}
const prompts = promptsDoc.prompts.slice().sort((a, b) => a.order - b.order);
fs.mkdirSync(OUT_DIR, { recursive: true });

// ── 이미지 차원 sniff (PNG/JPEG/WebP) ────────────────────────────────────────
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
  }
  return null;
}

function gateEval(w, h) {
  if (!w || !h) return "FAIL_UNMEASURABLE";
  const aspect = w / h;
  const resOk = w >= GATE.minW && h >= GATE.minH;
  const aspectOk = Math.abs(aspect - GATE.aspectTarget) <= GATE.aspectTol;
  if (resOk && aspectOk) return "PASS_1080x1920_NATIVE";
  if (!resOk) return "FAIL_RESOLUTION";
  return "FAIL_ASPECT";
}

function saveResult(rec) { return rec; }

// ══════════════════════════════════════════════════════════════════════════════
// OpenAI gpt-image-2
// ══════════════════════════════════════════════════════════════════════════════
async function runOpenAI() {
  if (!OPENAI_KEY) {
    return { provider: "openai_gpt_image_2", status: "SKIPPED_KEY_MISSING", results: [] };
  }
  log("OPENAI_API_KEY 존재 확인 (값 미출력) — gpt-image-2 테스트 시작");
  const results = [];
  let model = "gpt-image-2";
  let size = `${SIZE_PRIMARY.w}x${SIZE_PRIMARY.h}`;
  let sizeFallbackUsed = false;
  let modelFallbackUsed = false;
  let paidCalls = 0;

  for (const p of prompts) {
    if (results.filter(r => r.generated).length >= MAX_IMAGES_PER_PAID_PROVIDER) break;
    const rec = { order: p.order, sceneRole: p.sceneRole, attempted: true, generated: false };
    let attemptsForThisImage = 0;
    while (attemptsForThisImage < 2) { // 최대 1회 fallback (size 또는 model)
      attemptsForThisImage++;
      paidCalls++;
      if (paidCalls > MAX_IMAGES_PER_PAID_PROVIDER + 2) { rec.error = "paid_call_cap_reached"; break; }
      try {
        log(`scene ${p.order} (${p.sceneRole}) 생성 요청 — model=${model} size=${size}`);
        const resp = await fetch("https://api.openai.com/v1/images/generations", {
          method: "POST",
          headers: { "Authorization": `Bearer ${OPENAI_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({ model, prompt: p.finalPrompt, size, quality: "high", n: 1 }),
          signal: AbortSignal.timeout(180000),
        });
        const bodyText = await resp.text();
        if (!resp.ok) {
          let errMsg = "";
          try { errMsg = JSON.parse(bodyText)?.error?.message || bodyText.slice(0, 200); } catch { errMsg = bodyText.slice(0, 200); }
          // size 거부 → 1회 fallback
          if (/size/i.test(errMsg) && !sizeFallbackUsed) {
            sizeFallbackUsed = true;
            size = `${SIZE_FALLBACK.w}x${SIZE_FALLBACK.h}`;
            warn(`size 거부 감지 → fallback ${size} 로 1회 재시도: ${errMsg.slice(0, 120)}`);
            continue;
          }
          // model 미존재 → dated variant 1회 fallback
          if (/model/i.test(errMsg) && /not|invalid|unknown/i.test(errMsg) && !modelFallbackUsed) {
            modelFallbackUsed = true;
            model = "gpt-image-2-2026-04-21";
            warn(`model 거부 감지 → fallback ${model} 로 1회 재시도: ${errMsg.slice(0, 120)}`);
            continue;
          }
          rec.error = `http_${resp.status}: ${errMsg.slice(0, 200)}`;
          rec.gate = "FAIL_PROVIDER_BLOCKED";
          break;
        }
        const data = JSON.parse(bodyText);
        const item = data?.data?.[0];
        let buf = null;
        if (item?.b64_json) buf = Buffer.from(item.b64_json, "base64");
        else if (item?.url) {
          const ir = await fetch(item.url, { signal: AbortSignal.timeout(120000) });
          buf = Buffer.from(await ir.arrayBuffer());
        }
        if (!buf || buf.length < 10000) { rec.error = "empty_image_payload"; rec.gate = "FAIL_PROVIDER_BLOCKED"; break; }
        const dims = sniffImageDims(buf) || {};
        const file = path.join(OUT_DIR, `openai-scene-${String(p.order).padStart(2, "0")}-${p.sceneRole}.png`);
        fs.writeFileSync(file, buf);
        rec.generated = true;
        rec.imagePath = file;
        rec.width = dims.w; rec.height = dims.h; rec.format = dims.format;
        rec.aspect = dims.w && dims.h ? Math.round((dims.w / dims.h) * 10000) / 10000 : null;
        rec.fileSizeBytes = buf.length;
        rec.requestedSize = size;
        rec.modelUsed = model;
        rec.gate = gateEval(dims.w, dims.h);
        rec.usage = data?.usage ?? null; // cost evidence (API 응답)
        log(`scene ${p.order} 저장 ✅ ${dims.w}x${dims.h} ${rec.gate} (${Math.round(buf.length / 1024)}KB)`);
        break;
      } catch (e) {
        rec.error = String(e?.message || e).slice(0, 200);
        rec.gate = "FAIL_PROVIDER_BLOCKED";
        break;
      }
    }
    results.push(saveResult(rec));
  }
  return { provider: "openai_gpt_image_2", status: "RAN", modelFinal: model, sizeFinal: size, sizeFallbackUsed, modelFallbackUsed, paidCalls, results };
}

// ══════════════════════════════════════════════════════════════════════════════
// FLUX.2 [pro] (BFL 공식 API)
// ══════════════════════════════════════════════════════════════════════════════
async function runFlux() {
  if (!BFL_KEY) {
    return { provider: "flux_2_pro_bfl", status: "SKIPPED_KEY_MISSING", results: [] };
  }
  log("BFL_API_KEY 존재 확인 (값 미출력) — FLUX.2 [pro] 테스트 시작");
  const results = [];
  const FLUX_ENDPOINT = "https://api.bfl.ai/v1/flux-2-pro"; // 공식 문서 기준 단일 endpoint (fallback 없음)
  let sizeW = SIZE_PRIMARY.w, sizeH = SIZE_PRIMARY.h;
  let sizeFallbackUsed = false;
  let paidCalls = 0;

  async function createTask(prompt) {
    const resp = await fetch(FLUX_ENDPOINT, {
      method: "POST",
      headers: { "x-key": BFL_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, width: sizeW, height: sizeH }),
      signal: AbortSignal.timeout(60000),
    });
    return resp;
  }

  for (const p of prompts) {
    if (results.filter(r => r.generated).length >= MAX_IMAGES_PER_PAID_PROVIDER) break;
    const rec = { order: p.order, sceneRole: p.sceneRole, attempted: true, generated: false };
    let attemptsForThisImage = 0;
    while (attemptsForThisImage < 2) { // size fallback 1회만 허용
      attemptsForThisImage++;
      paidCalls++;
      if (paidCalls > MAX_IMAGES_PER_PAID_PROVIDER + 2) { rec.error = "paid_call_cap_reached"; break; }
      try {
        log(`scene ${p.order} (${p.sceneRole}) task 생성 — ${FLUX_ENDPOINT} ${sizeW}x${sizeH}`);
        const resp = await createTask(p.finalPrompt);
        const bodyText = await resp.text();
        if (!resp.ok) {
          let errMsg = bodyText.slice(0, 250);
          if (/width|height|size|dimension|pixel/i.test(errMsg) && !sizeFallbackUsed) {
            sizeFallbackUsed = true;
            sizeW = SIZE_FALLBACK.w; sizeH = SIZE_FALLBACK.h;
            warn(`size 거부 감지 → fallback ${sizeW}x${sizeH} 로 1회 재시도: ${errMsg.slice(0, 120)}`);
            continue;
          }
          rec.error = `http_${resp.status}: ${errMsg}`;
          rec.gate = "FAIL_PROVIDER_BLOCKED";
          break;
        }
        const task = JSON.parse(bodyText);
        const pollUrl = task.polling_url || `https://api.bfl.ai/v1/get_result?id=${task.id}`;
        // 폴링 (최대 180s)
        let sampleUrl = null; let lastStatus = "";
        for (let i = 0; i < 90; i++) {
          await new Promise(r => setTimeout(r, 2000));
          const pr = await fetch(pollUrl, { headers: { "x-key": BFL_KEY }, signal: AbortSignal.timeout(30000) });
          const pj = await pr.json().catch(() => null);
          lastStatus = pj?.status || `http_${pr.status}`;
          if (lastStatus === "Ready") { sampleUrl = pj?.result?.sample || null; break; }
          if (/Error|Failed|Moderated|Not Found/i.test(lastStatus)) break;
        }
        if (!sampleUrl) { rec.error = `poll_end_status=${lastStatus}`; rec.gate = "FAIL_PROVIDER_BLOCKED"; break; }
        const ir = await fetch(sampleUrl, { signal: AbortSignal.timeout(120000) });
        const buf = Buffer.from(await ir.arrayBuffer());
        if (!buf || buf.length < 10000) { rec.error = "empty_sample_download"; rec.gate = "FAIL_PROVIDER_BLOCKED"; break; }
        const dims = sniffImageDims(buf) || {};
        const ext = dims.format === "jpeg" ? "jpg" : (dims.format || "png");
        const file = path.join(OUT_DIR, `flux-scene-${String(p.order).padStart(2, "0")}-${p.sceneRole}.${ext}`);
        fs.writeFileSync(file, buf);
        rec.generated = true;
        rec.imagePath = file;
        rec.width = dims.w; rec.height = dims.h; rec.format = dims.format;
        rec.aspect = dims.w && dims.h ? Math.round((dims.w / dims.h) * 10000) / 10000 : null;
        rec.fileSizeBytes = buf.length;
        rec.requestedSize = `${sizeW}x${sizeH}`;
        rec.gate = gateEval(dims.w, dims.h);
        log(`scene ${p.order} 저장 ✅ ${dims.w}x${dims.h} ${rec.gate} (${Math.round(buf.length / 1024)}KB)`);
        break;
      } catch (e) {
        rec.error = String(e?.message || e).slice(0, 200);
        rec.gate = "FAIL_PROVIDER_BLOCKED";
        break;
      }
    }
    results.push(saveResult(rec));
  }
  return { provider: "flux_2_pro_bfl", status: "RAN", endpoint: FLUX_ENDPOINT, sizeFallbackUsed, paidCalls, results };
}

// ══════════════════════════════════════════════════════════════════════════════
// ChatGPT + Playwright control (기존 승인 경로 재사용, 무료)
// ══════════════════════════════════════════════════════════════════════════════
async function runChatGPT() {
  if (process.env.ALLOW_CHATGPT_IMAGE !== "1") {
    return { provider: "chatgpt_playwright_control", status: "SKIPPED_ALLOW_FLAG_MISSING", results: [] };
  }
  const { chromium } = await import("playwright");
  const core = await import("./_chatgpt-image-core.mjs");
  const { CDP_PORT_GPT1, USER_DATA_GPT1, ensureChrome, detectStop, typePrompt, checkSendEnabled, collectLastAssistantImages, isAssistantDone, interceptRecover } = core;

  await ensureChrome(CDP_PORT_GPT1, USER_DATA_GPT1, log);
  const browser = await chromium.connectOverCDP(`http://localhost:${CDP_PORT_GPT1}`);
  const ctx = browser.contexts()[0];
  if (!ctx) return { provider: "chatgpt_playwright_control", status: "FAIL_NO_BROWSER_CONTEXT", results: [] };

  async function activateImageTool(page) {
    const directBtn = page.getByRole("button", { name: /^이미지 만들기$|^Create image$/i }).first();
    if (await directBtn.count() > 0 && await directBtn.isVisible({ timeout: 1200 }).catch(() => false)) {
      await directBtn.click(); await page.waitForTimeout(1200); return true;
    }
    const plus = page.locator('button[data-testid="composer-plus-btn"], button[aria-label="파일 등 추가"], button[aria-label="파일 추가 및 기타"], button[aria-label*="Add" i]').first();
    if (await plus.count() === 0) throw new Error("composer plus button not found");
    for (let a = 0; a < 3; a++) {
      await plus.click(); await page.waitForTimeout(1200);
      const mi = page.getByText(/이미지 만들기/).filter({ hasNotText: "무엇을" }).first();
      if (await mi.count() > 0 && await mi.isVisible({ timeout: 1500 }).catch(() => false)) { await mi.click(); await page.waitForTimeout(1200); return true; }
      await page.keyboard.press("Escape").catch(() => {});
      await page.waitForTimeout(600);
    }
    throw new Error("'이미지 만들기' menu not found");
  }

  const results = [];
  for (const p of prompts) {
    const rec = { order: p.order, sceneRole: p.sceneRole, attempted: true, generated: false };
    let page = null;
    try {
      page = await ctx.newPage();
      await page.goto("https://chatgpt.com/", { waitUntil: "domcontentloaded", timeout: 20000 });
      await page.waitForTimeout(1500);
      if (/auth|login/i.test(page.url())) throw new Error("login_required");
      await detectStop(page);
      await activateImageTool(page);
      const ta = page.locator("#prompt-textarea").first();
      if (!await ta.isVisible({ timeout: 8000 }).catch(() => false)) throw new Error("composer not visible");
      await typePrompt(page, p.finalPrompt, log);
      if (!await checkSendEnabled(page)) throw new Error("send disabled");
      const baseImgs = await collectLastAssistantImages(page);
      const baselineCids = new Set(baseImgs.map(x => x.cid).filter(Boolean));
      await page.locator('#composer-submit-button, button[data-testid="send-button"], button[aria-label="Send message"], button[aria-label="메시지 보내기"]').first().click();
      log(`scene ${p.order} 전송 — 대기 중...`);
      let done = false;
      for (let i = 0; i < 110; i++) {
        await page.waitForTimeout(2000);
        if (await isAssistantDone(page)) {
          await page.waitForTimeout(3000);
          const imgs = await collectLastAssistantImages(page);
          if (imgs.some(x => x.gen)) { done = true; break; }
        }
      }
      if (!done) warn(`scene ${p.order}: 완료 감지 timeout — intercept fallback`);
      // 저장: estuary fetch → intercept fallback
      const imgs = await collectLastAssistantImages(page);
      const fresh = imgs.filter(x => x.gen && (!x.cid || !baselineCids.has(x.cid)));
      const cand = (fresh.length > 0 ? fresh : imgs.filter(x => x.gen)).sort((a, b) => (b.w * b.h) - (a.w * a.h))[0];
      let buf = null;
      if (cand?.src) {
        const arr = await page.evaluate(async (u) => {
          try { const r = await fetch(u); const ab = await r.arrayBuffer(); return Array.from(new Uint8Array(ab)); } catch { return null; }
        }, cand.src).catch(() => null);
        if (arr && arr.length > 10000) buf = Buffer.from(arr);
      }
      if (!buf) {
        const intercepted = await interceptRecover(page, page.url(), log);
        let biggest = null;
        for (const [, body] of intercepted) if (!biggest || body.length > biggest.length) biggest = body;
        if (biggest && biggest.length > 10000) buf = biggest;
      }
      if (!buf) throw new Error("image_save_failed");
      const dims = sniffImageDims(buf) || {};
      const file = path.join(OUT_DIR, `chatgpt-scene-${String(p.order).padStart(2, "0")}-${p.sceneRole}.png`);
      fs.writeFileSync(file, buf);
      rec.generated = true;
      rec.imagePath = file;
      rec.width = dims.w; rec.height = dims.h; rec.format = dims.format;
      rec.aspect = dims.w && dims.h ? Math.round((dims.w / dims.h) * 10000) / 10000 : null;
      rec.fileSizeBytes = buf.length;
      rec.gate = gateEval(dims.w, dims.h);
      log(`scene ${p.order} 저장 ✅ ${dims.w}x${dims.h} ${rec.gate} (${Math.round(buf.length / 1024)}KB)`);
    } catch (e) {
      rec.error = String(e?.message || e).slice(0, 200);
      rec.gate = "FAIL_PROVIDER_BLOCKED";
      warn(`scene ${p.order} 실패: ${rec.error}`);
    } finally {
      await page?.close().catch(() => {});
    }
    results.push(rec);
  }
  await browser.close().catch(() => {});
  return { provider: "chatgpt_playwright_control", status: "RAN", results };
}

// ── 메인 ─────────────────────────────────────────────────────────────────────
async function main() {
  log(`=== image source small test — provider: ${PROVIDER} ===`);
  log(`out-dir: ${OUT_DIR}`);
  let summary;
  if (PROVIDER === "openai") summary = await runOpenAI();
  else if (PROVIDER === "flux") summary = await runFlux();
  else summary = await runChatGPT();

  summary.schemaVersion = "money_shorts_image_source_test_summary_v1";
  summary.taskId = "creative-v2-image-source-small-provider-test-v1";
  summary.topic = promptsDoc.topic;
  summary.gateRule = GATE;
  summary.createdAt = new Date().toISOString();
  summary.secretValuesLogged = false;

  const outPath = path.join(OUT_DIR, `summary-${PROVIDER}.json`);
  fs.writeFileSync(outPath, JSON.stringify(summary, null, 2) + "\n", "utf8");
  log(`summary: ${outPath}`);

  const gen = (summary.results || []).filter(r => r.generated);
  const pass = gen.filter(r => r.gate === "PASS_1080x1920_NATIVE");
  log(`완료 — status=${summary.status} generated=${gen.length}/${(summary.results || []).length} gatePass=${pass.length}`);
}

main().catch((e) => {
  console.error(`[FATAL][img-src-test:${PROVIDER}]`, String(e?.message || e).slice(0, 300));
  process.exit(1);
});
