#!/usr/bin/env node
/**
 * run-owner-real-scene-images-from-wizard-script-once.mjs
 * task: owner-web-real-script-voice-visual-generation-pipeline-v1
 *
 * 웹 위저드 확정 대본(script-final.json)의 6개 장면(visualCue) 기준으로
 * ChatGPT+Playwright(로그인된 CDP Chrome) 실제 장면 이미지를 생성한다.
 * 감지/저장 로직은 fresh-image-set-v3에서 실증된 방식 그대로:
 *   · 제출 후 25초 passive(중단 조건만 감시) → 1.8초 간격 active poll
 *   · page-wide estuary/oaiusercontent/blob 수집 (user 첨부 제외, baseline cid 제외)
 *   · 신규 후보 3회 연속 stable(같은 key+크기)이면 즉시 저장
 *   · 150초 미감지: current-page intercept 회수 1회 → 180초 회수 불가: TIMEOUT_BLOCKED
 *
 * fail-closed 계약:
 *   · ALLOW_CHATGPT_IMAGE=1 없으면 즉시 종료(exit 3, summary BLOCKED_GATE) — 어떤 브라우저도 열지 않음
 *   · ChatGPT 미로그인/세션 불가 → exit 3, summary BLOCKED_SESSION
 *   · 장면당 제출 1회, run당 하드캡 6 — 자동 retry 루프 없음
 *   · 이미 저장된 장면 파일은 건너뜀(재실행 시 모자란 장면만 생성)
 *
 * 보안: OpenAI/FLUX2/Gemini/Midjourney/유료 API 금지. .env.local/.money-shorts-local/secret 접근 금지.
 *       fetch는 CDP 확인/estuary 회수 용도만. 업로드/DB/OAuth 없음. out-dir은 repo 밖 필수.
 *
 * exit codes: 0 = 6/6 SAVED_OK · 1 = 일부 실패 · 2 = usage 오류 · 3 = gate/session 차단
 */

import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");

// ── CLI args ─────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
function getArg(name) {
  const idx = args.indexOf(name);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : null;
}
const scriptArg = getArg("--script");
const outDirArg = getArg("--out-dir");
if (!scriptArg || !outDirArg) {
  console.error("Usage: node run-owner-real-scene-images-from-wizard-script-once.mjs --script <script-final.json> --out-dir <abs>");
  process.exit(2);
}
const scriptAbs = path.resolve(scriptArg);
const OUT_DIR = path.resolve(outDirArg);

// 산출물 루트 강제 — repo 밖 아무 곳이 아니라 C:\tmp\money-shorts-os\ 하위만 허용(fail-closed).
// 브라우저/Playwright import 이전에 검사하므로 경로가 어긋나면 어떤 외부 접근도 일어나지 않는다.
const MEDIA_ROOT_RE = /^C:[\\/]+tmp[\\/]+money-shorts-os[\\/]+/i;
if (!MEDIA_ROOT_RE.test(OUT_DIR + path.sep)) {
  console.error(`ABORT: --out-dir must be under C:\\tmp\\money-shorts-os\\. out-dir: ${OUT_DIR}`);
  process.exit(2);
}
if (!MEDIA_ROOT_RE.test(scriptAbs) || !scriptAbs.toLowerCase().endsWith(".json")) {
  console.error(`ABORT: --script must be a .json under C:\\tmp\\money-shorts-os\\. script: ${scriptAbs}`);
  process.exit(2);
}
if (OUT_DIR.startsWith(REPO_ROOT + "\\") || OUT_DIR.startsWith(REPO_ROOT + "/")) {
  console.error(`ABORT: --out-dir must be outside repo root. out-dir: ${OUT_DIR}`);
  process.exit(2);
}
if ([scriptAbs, OUT_DIR].some((p) => p.includes(".money-shorts-local"))) {
  console.error("ABORT: .money-shorts-local access forbidden.");
  process.exit(2);
}

function ts() { return new Date().toISOString().slice(11, 19); }
function log(m) { console.log(`[${ts()}][wizard-scene-img] ${m}`); }
function warn(m) { console.warn(`[WARN][wizard-scene-img] ${m}`); }

fs.mkdirSync(OUT_DIR, { recursive: true });
const SUMMARY_PATH = path.join(OUT_DIR, "scene-images-summary.json");

function writeSummary(partial) {
  const summary = {
    schemaVersion: "wizard_scene_images_summary_v1",
    mode: "chatgpt_playwright",
    generatedAt: new Date().toISOString(),
    notUploaded: true,
    expectedCount: 6,
    ...partial,
  };
  fs.writeFileSync(SUMMARY_PATH, JSON.stringify(summary, null, 2), "utf8");
  return summary;
}

// ── gate 1: 명시 실행 마커 (없으면 브라우저/네트워크 어떤 것도 열지 않음) ──────
if (process.env.ALLOW_CHATGPT_IMAGE !== "1") {
  writeSummary({ allReady: false, blockerCode: "BLOCKED_GATE", scenes: [], submissionsUsed: 0,
    note: "ALLOW_CHATGPT_IMAGE=1 실행 마커 없음 — 브라우저를 열지 않고 종료(fail-closed)." });
  console.error("ABORT: ALLOW_CHATGPT_IMAGE=1 이 설정되지 않음 (fail-closed).");
  process.exit(3);
}

// ── 확정 대본 로드 ────────────────────────────────────────────────────────────
let record;
try {
  record = JSON.parse(fs.readFileSync(scriptAbs, "utf8"));
} catch (e) {
  console.error(`ABORT: script-final.json 읽기 실패: ${e.message}`);
  process.exit(2);
}
if (record.schemaVersion !== "wizard_script_final_v1" || !record.script || !Array.isArray(record.script.scenes)) {
  console.error("ABORT: wizard_script_final_v1 스키마가 아님.");
  process.exit(2);
}
const scenes = record.script.scenes;
if (scenes.length !== 6) {
  console.error(`ABORT: scenes 6개 기대 — 실제 ${scenes.length}개.`);
  process.exit(2);
}
const topicId = record.topicId ?? null;

// ── 스타일/해상도 지시 (fresh-v3 실증 문구 재사용) ─────────────────────────────
const STYLE_PREFIX =
  "Photo-realistic Korean daily-life scene, natural soft lighting, shallow depth of field, " +
  "vertical 9:16 smartphone lifestyle photography style. ";
const RESOLUTION_INSTRUCTION =
  " OUTPUT FORMAT REQUIREMENT: vertical 9:16 portrait canvas at the highest resolution available " +
  "(target at least 1080x1920 pixels). Do not add any text, letters, numbers or watermark to the image.";
function scenePrompt(scene) {
  const cue = String(scene.visualCue ?? "").trim();
  return `${STYLE_PREFIX}${cue}${RESOLUTION_INSTRUCTION}`;
}
const sceneFile = (i) => path.join(OUT_DIR, `scene-${String(i + 1).padStart(2, "0")}.png`);

// ── 이미지 바이너리 차원 sniff (png/jpeg/webp) ────────────────────────────────
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
    return { format: "webp", w: null, h: null };
  }
  return null;
}

const MIN_W = 900;
const MIN_H = 1200;
function dimsAcceptable(d) {
  return d && typeof d.w === "number" && typeof d.h === "number" && d.w >= MIN_W && d.h >= MIN_H && d.h >= Math.round(d.w * 1.2);
}

// ── 이미 저장된 장면은 건너뛴다(재실행 = 모자란 장면만) ────────────────────────
const sceneStates = scenes.map((s, i) => {
  const file = sceneFile(i);
  if (fs.existsSync(file)) {
    const dims = sniffImageDims(fs.readFileSync(file));
    if (dimsAcceptable(dims)) {
      return { sceneIndex: i + 1, file, width: dims.w, height: dims.h, status: "SAVED_OK", method: "existing_file_skip" };
    }
  }
  return { sceneIndex: i + 1, file, width: null, height: null, status: "PENDING", method: null };
});

const pendingCount = sceneStates.filter((s) => s.status === "PENDING").length;
log(`scenes: 6, 이미 저장됨: ${6 - pendingCount}, 생성 대상: ${pendingCount}`);
if (pendingCount === 0) {
  writeSummary({ topicId, allReady: true, blockerCode: null, scenes: sceneStates, submissionsUsed: 0 });
  log("모든 장면 이미지가 이미 준비됨 — 생성 없이 종료.");
  process.exit(0);
}

// ── Playwright + ChatGPT (여기서부터만 브라우저 접근) ─────────────────────────
const { chromium } = await import("playwright");
const { CDP_PORT_GPT1, USER_DATA_GPT1, ensureChrome, detectStop, typePrompt, checkSendEnabled, interceptRecover } =
  await import("./_chatgpt-image-core.mjs");

const SUBMISSION_HARD_CAP = 6;
let submissionCount = 0;

const PASSIVE_UNTIL_MS = 25000;
const POLL_INTERVAL_MS = 1800;
const STABLE_POLLS = 3;
const DIAG_AT_MS = 150000;
const HARD_TIMEOUT_MS = 180000;

// page-wide 생성 이미지 수집 (user 첨부 제외) — fresh-v3 실증 로직
async function collectGenImagesPageWide(page) {
  return await page.evaluate(() => {
    function cid(s) { const m = (s || "").match(/[?&]id=([^&]+)/); return m ? m[1] : null; }
    return Array.from(document.querySelectorAll("img"))
      .filter((i) => i.naturalWidth >= 200 && !i.closest('[data-message-author-role="user"]'))
      .map((i) => ({
        src: i.src || i.currentSrc || "", cid: cid(i.src),
        w: i.naturalWidth, h: i.naturalHeight,
        gen: /backend-api\/estuary\/content|backend-api\/files|oaiusercontent/.test(i.src || ""),
      }))
      .filter((x) => x.gen || x.src.startsWith("blob:"));
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

async function measureUrlInPage(page, url) {
  return await page.evaluate(async (u) => {
    try {
      const r = await fetch(u);
      if (!r.ok) return { ok: false, status: r.status };
      const blob = await r.blob();
      const bmp = await createImageBitmap(blob);
      const out = { ok: true, w: bmp.width, h: bmp.height, bytes: blob.size };
      bmp.close();
      return out;
    } catch (e) { return { ok: false, error: String(e).slice(0, 120) }; }
  }, url).catch((e) => ({ ok: false, error: String(e).slice(0, 120) }));
}

async function saveBestImage(page, destPath, baselineCids) {
  const groups = await collectCandidateUrlsDeep(page);
  const freshGen = groups.filter((g) => g.gen && (!g.cid || !baselineCids.has(g.cid)));
  const freshAny = groups.filter((g) => g.naturalW >= 400 && (!g.cid || !baselineCids.has(g.cid)));
  const usable = freshGen.length > 0 ? freshGen : freshAny.length > 0 ? freshAny : groups.filter((g) => g.gen);
  let best = null;
  for (const g of usable) {
    for (const cand of g.urls) {
      const m = await measureUrlInPage(page, cand.url);
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
      return { ok: true, method: `best_candidate_${best.kind}`, w: dims?.w ?? best.m.w, h: dims?.h ?? best.m.h, bytes: b.length };
    }
  }
  // current-page intercept 회수 (sidebar/old conversation 스캔 금지)
  const intercepted = await interceptRecover(page, page.url(), log);
  let biggest = null;
  for (const [, body] of intercepted) {
    const dims = sniffImageDims(body);
    if (!dims) continue;
    if (!biggest || dims.w * dims.h > biggest.dims.w * biggest.dims.h) biggest = { body, dims };
  }
  if (biggest && biggest.body.length > 10000) {
    fs.writeFileSync(destPath, biggest.body);
    return { ok: true, method: "intercept_reload", w: biggest.dims.w, h: biggest.dims.h, bytes: biggest.body.length };
  }
  return { ok: false, method: "none" };
}

async function activateImageToolCurrentUI(page) {
  const directBtn = page.getByRole("button", { name: /^이미지 만들기$|^Create image$/i }).first();
  if ((await directBtn.count()) > 0 && (await directBtn.isVisible({ timeout: 1200 }).catch(() => false))) {
    await directBtn.click();
    await page.waitForTimeout(1200);
    return true;
  }
  const plus = page.locator(
    'button[data-testid="composer-plus-btn"], button[aria-label="파일 등 추가"], ' +
    'button[aria-label="파일 추가 및 기타"], button[aria-label*="Add" i]'
  ).first();
  if ((await plus.count()) === 0) throw new Error("image_tool: composer plus button not found");
  for (let attempt = 0; attempt < 3; attempt++) {
    await plus.click();
    await page.waitForTimeout(1200);
    const menuItem = page.getByText(/이미지 만들기/).filter({ hasNotText: "무엇을" }).first();
    if ((await menuItem.count()) > 0 && (await menuItem.isVisible({ timeout: 1500 }).catch(() => false))) {
      await menuItem.click();
      await page.waitForTimeout(1200);
      return true;
    }
    await page.keyboard.press("Escape").catch(() => {});
    await page.waitForTimeout(600);
  }
  throw new Error("image_tool: '이미지 만들기' menu item not found");
}

function stableKey(img) {
  return `${img.cid || String(img.src).slice(0, 80)}|${img.w}x${img.h}`;
}

async function generateOneScene(ctx, sceneIdx, prompt, destPath) {
  const page = await ctx.newPage();
  try {
    await page.goto("https://chatgpt.com/", { waitUntil: "domcontentloaded", timeout: 20000 });
    await page.waitForTimeout(1500);
    if (/auth|login/i.test(page.url())) throw new Error("LOGIN_REQUIRED");
    await detectStop(page);
    await activateImageToolCurrentUI(page);
    await typePrompt(page, prompt, log);
    if (!(await checkSendEnabled(page))) throw new Error("send button disabled");

    const baseline = new Set((await collectGenImagesPageWide(page)).map((x) => x.cid).filter(Boolean));
    if (submissionCount >= SUBMISSION_HARD_CAP) throw new Error(`SUBMISSION_HARD_CAP(${SUBMISSION_HARD_CAP}) 도달`);
    submissionCount += 1;
    await page.keyboard.press("Enter");
    const submittedAt = Date.now();
    log(`scene-${sceneIdx + 1} 제출 (${submissionCount}/${SUBMISSION_HARD_CAP}) — passive ${PASSIVE_UNTIL_MS / 1000}s`);

    let stable = { key: null, count: 0 };
    let diagDone = false;
    while (Date.now() - submittedAt < HARD_TIMEOUT_MS) {
      const elapsed = Date.now() - submittedAt;
      await page.waitForTimeout(elapsed < PASSIVE_UNTIL_MS ? 2500 : POLL_INTERVAL_MS);
      await detectStop(page);
      if (Date.now() - submittedAt < PASSIVE_UNTIL_MS) continue;

      const fresh = (await collectGenImagesPageWide(page)).filter((x) => x.w >= 400 && (!x.cid || !baseline.has(x.cid)));
      if (fresh.length > 0) {
        const key = stableKey(fresh[fresh.length - 1]);
        stable = stable.key === key ? { key, count: stable.count + 1 } : { key, count: 1 };
        if (stable.count >= STABLE_POLLS) {
          const saved = await saveBestImage(page, destPath, baseline);
          if (saved.ok) return { ok: true, ...saved, latencyMs: Date.now() - submittedAt };
          stable = { key: null, count: 0 }; // 저장 실패 — 계속 관찰
        }
      } else if (!diagDone && elapsed >= DIAG_AT_MS) {
        diagDone = true;
        warn(`scene-${sceneIdx + 1} ${DIAG_AT_MS / 1000}s 미감지 — current-page intercept 회수 시도`);
        const saved = await saveBestImage(page, destPath, baseline);
        if (saved.ok) return { ok: true, ...saved, latencyMs: Date.now() - submittedAt };
      }
    }
    // 마지막 회수 시도 후 타임아웃 처리
    const lastTry = await saveBestImage(page, destPath, baseline);
    if (lastTry.ok) return { ok: true, ...lastTry, latencyMs: Date.now() - submittedAt };
    return { ok: false, method: "timeout", error: "TIMEOUT_BLOCKED" };
  } finally {
    await page.close().catch(() => {});
  }
}

// ── 실행 ─────────────────────────────────────────────────────────────────────
let browser = null;
let blockerCode = null;
try {
  await ensureChrome(CDP_PORT_GPT1, USER_DATA_GPT1, log);
  browser = await chromium.connectOverCDP(`http://localhost:${CDP_PORT_GPT1}`);
  const ctx = browser.contexts()[0] ?? (await browser.newContext());

  for (let i = 0; i < 6; i++) {
    const st = sceneStates[i];
    if (st.status === "SAVED_OK") continue;
    const prompt = scenePrompt(scenes[i]);
    try {
      const r = await generateOneScene(ctx, i, prompt, st.file);
      if (r.ok) {
        const dims = { w: r.w ?? null, h: r.h ?? null };
        st.width = dims.w;
        st.height = dims.h;
        st.method = r.method;
        st.status = dimsAcceptable(dims) ? "SAVED_OK" : "SAVED_LOW_QUALITY";
        log(`scene-${i + 1} 저장: ${st.status} ${dims.w}x${dims.h} (${r.method}, ${(r.latencyMs / 1000).toFixed(1)}s)`);
      } else {
        st.status = "TIMEOUT_BLOCKED";
        warn(`scene-${i + 1} 실패: ${r.error ?? r.method}`);
      }
    } catch (e) {
      const msg = String(e?.message ?? e);
      if (/LOGIN_REQUIRED|Not logged in/i.test(msg)) {
        blockerCode = "BLOCKED_SESSION";
        st.status = "BLOCKED_SESSION";
        warn(`scene-${i + 1}: ChatGPT 로그인 필요 — 이후 장면 생성 중단(fail-closed)`);
        break;
      }
      if (/STOP_DETECTED|CAPTCHA_DETECTED/.test(msg)) {
        blockerCode = "BLOCKED_RATE_OR_CAPTCHA";
        st.status = "BLOCKED_RATE_OR_CAPTCHA";
        warn(`scene-${i + 1}: ${msg.slice(0, 100)} — 이후 장면 생성 중단`);
        break;
      }
      st.status = "ERROR";
      st.method = msg.slice(0, 120);
      warn(`scene-${i + 1} 오류: ${msg.slice(0, 160)}`);
    }
  }
} catch (e) {
  const msg = String(e?.message ?? e);
  blockerCode = blockerCode ?? (/CDP not available/i.test(msg) ? "BLOCKED_SESSION" : "RUNNER_ERROR");
  warn(`runner 오류: ${msg.slice(0, 200)}`);
} finally {
  // CDP attach만 끊는다 — Owner의 Chrome 자체는 닫지 않는다.
  if (browser) await browser.close().catch(() => {});
}

const allReady = sceneStates.every((s) => s.status === "SAVED_OK");
if (!allReady && !blockerCode) blockerCode = "PARTIAL_GENERATION";
const summary = writeSummary({
  topicId,
  allReady,
  blockerCode: allReady ? null : blockerCode,
  scenes: sceneStates,
  submissionsUsed: submissionCount,
});
log(`summary: ${SUMMARY_PATH}`);
log(`결과: ${sceneStates.filter((s) => s.status === "SAVED_OK").length}/6 SAVED_OK, allReady=${summary.allReady}`);
process.exit(allReady ? 0 : blockerCode === "BLOCKED_GATE" || blockerCode === "BLOCKED_SESSION" ? 3 : 1);
