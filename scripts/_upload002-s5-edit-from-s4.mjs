/**
 * upload_002_copier S5 키프레임 — S4 기반 이미지 편집
 *
 * - BASE IMAGE: S4 PASS (kf_s4_paper_pile_button.png)
 * - DEST_FILE: kf_s5_boss_hand_finale.png (덮어씌우기)
 * - CAND_DIR: s5_edit_candidates
 * - 방식: GPT 웹 이미지 편집 1회 — S4를 업로드하고 편집 지시
 *
 * Owner 승인: S5 이미지 편집 특례 1회
 * - GPT web 편집: 정확히 1회
 * - 직접 유료 API: $0
 * - 자동 재제출: 0회
 * - 실패 시 추가 호출: 0회
 * - Veo·TTS·veo_max_attempts 수정 금지
 *
 * 사용: node scripts/_upload002-s5-edit-from-s4.mjs [--dry-run]
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
const CAND_DIR   = path.join(KF_DIR, "s5_edit_candidates");

const BASE_S4    = path.join(KF_DIR, "kf_s4_paper_pile_button.png");
const DEST_FILE  = "kf_s5_boss_hand_finale.png";
const DEST_PATH  = path.join(KF_DIR, DEST_FILE);

const DRY        = process.argv.includes("--dry-run");

// ── fail-closed ChatGPT image allow guard: output write/browser·CDP 전에 반드시 통과 ──
// Owner decision: image_script_allow_guard = add_allow_guard_to_all_paid_image_scripts.
// 이 guard 통과가 이미지 생성 실행 승인을 의미하지 않는다 (no-live 기본). --dry-run도 guard를 거친다.
if (process.env.ALLOW_CHATGPT_IMAGE !== "1") {
  console.error("ABORT: ChatGPT image 경로 차단 (fail-closed). 필요한 env: ALLOW_CHATGPT_IMAGE=1 — browser/CDP/output write 전에 중단.");
  process.exit(2);
}

fs.mkdirSync(KF_DIR,   { recursive: true });
fs.mkdirSync(CAND_DIR, { recursive: true });

function log(m)  { console.log(`[${new Date().toISOString().slice(11,19)}] ${m}`); }
function warn(m) { console.warn(`[WARN] ${m}`); }
function abort(code, m) { console.error(`\n[ABORT:${code}] ${m}\n`); process.exit(1); }

function fileHash(p) {
  if (!fs.existsSync(p)) return null;
  return crypto.createHash("md5").update(fs.readFileSync(p)).digest("hex");
}
const BASE_HASH = fileHash(BASE_S4);
const BASE_SIZE = fs.existsSync(BASE_S4) ? fs.statSync(BASE_S4).size : 0;

// ── S5 편집 프롬프트 ────────────────────────────────────────────────────────
// 핵심: S4를 "편집"하는 방식으로 요청 — 보존 우선, 변경은 2가지만
const PROMPT = `Edit the attached image while keeping absolutely everything the same — the room, the copier, the paper pile on the tray and floor, the camera angle, lighting, 3D art style, and Jun's identity and costume (light-blue rolled-sleeve shirt, loose red tie, navy slacks, black shoes, brown messenger bag).

Make exactly two changes only:

CHANGE 1 — Jun's posture:
Change Jun's posture so he is leaning exhaustedly against the copier, shoulders slightly drooped, arms limp, expression blank and drained — the look of someone who has completely given up. He should still be at the same position in the frame next to the copier.

CHANGE 2 — Boss hand entering from the right edge:
Add one suit-sleeved hand and a short partial forearm (wrist to just below elbow only) entering from the EXTREME RIGHT EDGE of the frame, reaching toward the top of the paper pile to pick up exactly one sheet of paper. The hand must be at the right edge, partially cut off.

CRITICAL BOSS RULES — any violation = reject:
- ONLY the hand and partial forearm (wrist to below-elbow) are visible
- The boss remains ENTIRELY outside the frame
- NO face, head, hair, neck, shoulder, chest, torso, full body, half body
- NO silhouette, shadow, or reflection of the boss
- NO second full person standing in the frame
- NO part of the boss beyond the elbow
- ONE hand only — no extra hands or arms
- No anatomical distortion of fingers, wrist, or forearm

Do NOT change: the room background, window blinds, storage cabinet, ceiling light, beige floor tiles, the gray multifunction copier model, the paper pile size and position, Jun's costume, the art style, or the camera angle.

Vertical 9:16 format. No text, logo, speech bubble, or watermark.`;

// ── CDP 연결 ───────────────────────────────────────────────────────────────
async function isCDPOpen() {
  try {
    const r = await fetch(`http://localhost:${CDP_PORT}/json/version`, { signal: AbortSignal.timeout(2000) });
    return r.ok;
  } catch { return false; }
}

async function ensureChrome() {
  if (await isCDPOpen()) { log("Chrome CDP already open"); return; }
  log("Launching Chrome...");
  spawn(CHROME_EXE, [
    `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=${USER_DATA}`,
    "--no-first-run", "--no-default-browser-check",
    "https://chatgpt.com/"
  ], { detached: true, stdio: "ignore" }).unref();
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 500));
    if (await isCDPOpen()) { log("Chrome CDP connected"); return; }
  }
  abort("cdp_timeout", "Chrome CDP connection failed (15s)");
}

async function collectLastAssistantImages(page) {
  return await page.evaluate(() => {
    const msgs = Array.from(document.querySelectorAll('[data-message-author-role="assistant"]'));
    if (msgs.length === 0) return [];
    const lastMsg = msgs[msgs.length - 1];
    function cid(s) { const m = (s||"").match(/[?&]id=([^&]+)/); return m ? m[1] : null; }
    return Array.from(lastMsg.querySelectorAll("img"))
      .filter(i => i.naturalWidth >= 200)
      .map(i => ({
        src: i.src || i.currentSrc || i.getAttribute("data-src") || "",
        cid: cid(i.src),
        w: i.naturalWidth,
        h: i.naturalHeight,
        gen: /backend-api\/estuary\/content|oaiusercontent/.test(i.src),
      }))
      .filter(x => x.src);
  });
}

async function isAssistantDone(page) {
  return await page.evaluate(() => {
    const spinners = document.querySelectorAll(
      '[data-testid="stop-button"], button[aria-label*="Stop"], button[aria-label*="stop"], ' +
      '.result-streaming, [class*="streaming"]'
    );
    if (spinners.length > 0) return false;
    const turns = document.querySelectorAll('[data-testid^="conversation-turn"]');
    if (turns.length === 0) return true;
    const last = turns[turns.length - 1].textContent || "";
    return !/Creating image|generating|working on it/i.test(last);
  });
}

async function detectStop(page) {
  const STOP = ["You've reached", "You've hit", "message limit", "rate limit",
                "Try again in", "Log in", "Sign in"];
  for (const ph of STOP) {
    const el = page.getByText(ph, { exact: false }).first();
    if (await el.isVisible({ timeout: 200 }).catch(() => false)) {
      const txt = await el.textContent().catch(() => ph);
      abort("limit_or_login", `Stop condition: "${txt.trim().slice(0, 80)}"`);
    }
  }
}

// ── 신규 탭 방식 이미지 회수 (가장 신뢰성 높음) ───────────────────────────
async function fetchViaNewTab(ctx, url) {
  const imgPage = await ctx.newPage();
  let captured = null;
  imgPage.on("response", async (res) => {
    if (res.url() === url && res.status() === 200) {
      try { captured = await res.body(); } catch {}
    }
  });
  try {
    await imgPage.goto(url, { waitUntil: "load", timeout: 15000 }).catch(() => {});
    await imgPage.waitForTimeout(2000);
  } finally {
    await imgPage.close().catch(() => {});
  }
  return captured;
}

// ── intercept + reload 방식 ────────────────────────────────────────────────
async function interceptRecover(page, convUrl) {
  log("intercept recover (route+reload)...");
  const intercepted = new Map();
  const genPattern  = /backend-api\/estuary\/content/;

  if (convUrl && page.url() !== convUrl) {
    await page.goto(convUrl, { waitUntil: "domcontentloaded", timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(3000);
  }

  await page.route("**/*", async (route) => {
    const req = route.request();
    if (genPattern.test(req.url()) && req.resourceType() === "image") {
      try {
        const resp = await route.fetch();
        const body = await resp.body();
        if (body && body.length > 10000) {
          intercepted.set(req.url(), body);
          log(`  intercept: ${req.url().slice(0, 80)} (${Math.round(body.length/1024)}KB)`);
        }
        await route.fulfill({ response: resp, body });
      } catch { await route.continue().catch(() => {}); }
    } else {
      await route.continue().catch(() => {});
    }
  });

  await page.reload({ waitUntil: "networkidle", timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(4000);
  log(`intercept collected: ${intercepted.size}`);
  await page.unroute("**/*").catch(() => {});
  return intercepted;
}

// ── 메인 ──────────────────────────────────────────────────────────────────
async function main() {
  log("=== S5 edit from S4 (1 attempt) ===");
  log(`S4 base hash: ${BASE_HASH} (${Math.round(BASE_SIZE/1024)}KB)`);
  log("BOSS RULE ACTIVE: face/body/shoulder = immediate FAIL, 0 retries");

  if (!fs.existsSync(BASE_S4)) abort("base_missing", `S4 base not found: ${BASE_S4}`);

  await ensureChrome();
  const browser = await chromium.connectOverCDP(`http://localhost:${CDP_PORT}`)
    .catch(e => abort("cdp_connect", e.message));

  const ctx = browser.contexts()[0];
  if (!ctx) abort("no_context", "No browser context");

  const page = await ctx.newPage();
  await page.goto("https://chatgpt.com/", { waitUntil: "domcontentloaded", timeout: 20000 });
  await page.waitForTimeout(1500);

  if (/auth|login/.test(page.url())) abort("login_required", "ChatGPT login required");
  await detectStop(page);

  const ta = page.locator("#prompt-textarea").first();
  await ta.waitFor({ state: "visible", timeout: 15000 })
    .catch(() => abort("selector_changed", "Input box not found"));
  log("Input box found");

  if (DRY) {
    log("[DRY-RUN] Input box OK. 0 submissions.");
    await page.close();
    await browser.close();
    return;
  }

  // ── S4 base 이미지 첨부 ────────────────────────────────────────────────
  log("Attaching S4 base image...");
  let fileInput = page.locator('input[type="file"]').first();
  if (await fileInput.count() === 0) {
    const plusBtn = page.locator('button[aria-label*="Attach" i], button[aria-label*="파일" i]').first();
    if (await plusBtn.count() > 0) await plusBtn.click();
    await page.waitForTimeout(600);
    fileInput = page.locator('input[type="file"]').first();
  }
  if (await fileInput.count() > 0) {
    await fileInput.setInputFiles(BASE_S4);
    log("S4 attached");
    await page.waitForTimeout(3000);
  } else {
    abort("file_input_missing", "file input not found");
  }

  // baseline
  const baselineImgs = await page.evaluate(() => {
    function cid(s) { const m = (s||"").match(/[?&]id=([^&]+)/); return m ? m[1] : null; }
    return Array.from(document.querySelectorAll("img"))
      .map(i => ({ cid: cid(i.src), src: i.src.slice(0, 100) }))
      .filter(x => x.cid || x.src);
  });
  const baselineCids = new Set(baselineImgs.map(x => x.cid).filter(Boolean));
  const baselineSrcs = new Set(baselineImgs.map(x => x.src));
  log(`baseline cids: ${baselineCids.size}`);

  // ── 이미지 생성 도구 활성화 ────────────────────────────────────────────
  log("Activating image tool...");
  const plus = page.locator('button[aria-label="파일 추가 및 기타"]').first();
  if (await plus.count() > 0) {
    await plus.click();
    await page.waitForTimeout(1000);
    const imgTool = page.getByRole("menuitemradio", { name: /이미지 만들기|Create image/i }).first();
    if (await imgTool.count() > 0) {
      await imgTool.click();
      await page.waitForTimeout(1000);
      log("Image tool activated");
    } else {
      warn("Image tool menu item not found — continuing");
      await page.keyboard.press("Escape");
      await page.waitForTimeout(500);
    }
  } else {
    warn("Plus button not found — continuing");
  }

  // ── 프롬프트 입력 ──────────────────────────────────────────────────────
  log("Entering prompt...");
  const oneLine = PROMPT.replace(/\s*\n\s*/g, " ").trim();
  await ta.click();
  await ta.fill(oneLine);
  await page.waitForTimeout(1000);
  let typed = (await ta.textContent().catch(() => "") || "").trim();
  if (typed.length < 10) {
    log("fill() failed — keyboard.type() fallback");
    await ta.click();
    await page.keyboard.type(oneLine, { delay: 1 });
    await page.waitForTimeout(1000);
    typed = (await ta.textContent().catch(() => "") || "").trim();
  }
  log(`Prompt length: ${typed.length} chars`);
  if (typed.length < 10) abort("input_failed", "Prompt input failed");

  await detectStop(page);

  // ── 전송 (정확히 1회) ──────────────────────────────────────────────────
  const beforeTurns = await page.locator('[data-testid^="conversation-turn"]').count();
  const sendBtn = page.locator(
    '#composer-submit-button, button[data-testid="send-button"], ' +
    'button[aria-label="Send message"], button[aria-label="메시지 보내기"]'
  ).first();
  if (await sendBtn.count() > 0 && await sendBtn.isEnabled().catch(() => false)) {
    await sendBtn.click();
    log("Send button clicked (1x)");
  } else {
    await ta.press("Enter");
    log("Enter sent (1x)");
  }

  let sent = false;
  for (let i = 0; i < 20; i++) {
    await page.waitForTimeout(500);
    if (await page.locator('[data-testid^="conversation-turn"]').count() > beforeTurns) {
      sent = true; break;
    }
  }
  if (!sent) abort("send_failed", "Send failed — no turn increment (no retry)");
  log("Send confirmed — waiting up to 300s");

  // ── 생성 완료 대기 + 안정화 ────────────────────────────────────────────
  let result   = "timeout";
  let convUrl  = null;
  const startTime = Date.now();
  let stableKey   = null;
  let stableCount = 0;
  const STABLE_NEEDED = 3;
  const savedCandidates = [];
  const pendingUrls = [];

  outer: while (Date.now() - startTime < 300_000) {
    await page.waitForTimeout(4000);
    await detectStop(page);
    const elapsed = Date.now() - startTime;

    const curUrl = page.url();
    if (curUrl.includes("/c/")) convUrl = curUrl;

    const lastTxt = await page.locator('[data-testid^="conversation-turn"]').last().textContent().catch(() => "");
    if (/cannot|unable|can't edit|I can't|텍스트 기반|이미지를 만들 수 없/i.test(lastTxt)) {
      result = "text_refused"; break;
    }

    if (elapsed < 20000) { log(`  waiting ${Math.round(elapsed/1000)}s (min wait)`); continue; }

    const done = await isAssistantDone(page);
    const assistantImgs = await collectLastAssistantImages(page);
    const newCands = assistantImgs.filter(x =>
      x.gen && x.w >= 400 && x.h >= x.w &&
      x.cid && !baselineCids.has(x.cid) &&
      !baselineSrcs.has(x.src.slice(0, 100))
    );

    if (newCands.length > 0) {
      for (const c of newCands) {
        if (!pendingUrls.includes(c.src)) pendingUrls.push(c.src);
      }

      const top = newCands[newCands.length - 1];
      const key = `${top.cid}|${top.w}|${top.h}`;
      if (key === stableKey) {
        stableCount++;
        log(`  stable ${stableCount}/${STABLE_NEEDED} (${top.cid?.slice(0,8)})`);
      } else {
        stableKey = key; stableCount = 1;
        log(`  new candidate (${top.cid?.slice(0,8)})`);
      }

      if (stableCount >= STABLE_NEEDED && done) {
        log("Stabilized + done — 15s final wait");
        await page.waitForTimeout(15000);

        const verifyImgs = await collectLastAssistantImages(page);
        const verifyCands = verifyImgs.filter(x =>
          x.gen && x.w >= 400 && x.h >= x.w && x.cid && !baselineCids.has(x.cid)
        );
        const verifyTop = verifyCands.length > 0 ? verifyCands[verifyCands.length - 1] : null;
        const verifyKey = verifyTop ? `${verifyTop.cid}|${verifyTop.w}|${verifyTop.h}` : null;

        if (verifyKey !== stableKey) {
          warn("15s re-check mismatch — re-stabilizing");
          stableCount = 0; stableKey = null;
          continue;
        }
        log(`15s re-check passed (${verifyTop.cid?.slice(0,8)})`);

        for (const [j, cand] of verifyCands.entries()) {
          const ts       = Date.now();
          const candFile = `s5_edit_${ts}_${j+1}.png`;
          const candPath = path.join(CAND_DIR, candFile);

          // 직접 fetch 시도
          const buf = await page.evaluate(async (u) => {
            try {
              const r = await fetch(u);
              if (!r.ok) return null;
              return Array.from(new Uint8Array(await r.arrayBuffer()));
            } catch { return null; }
          }, cand.src);

          if (!buf || buf.length < 10000) {
            warn(`Direct fetch failed [${j+1}] — new tab fallback`);
            const tabBuf = await fetchViaNewTab(ctx, cand.src);
            if (tabBuf && tabBuf.length > 10000) {
              fs.writeFileSync(candPath, tabBuf);
              const hash    = fileHash(candPath);
              const sz      = fs.statSync(candPath).size;
              const isClone = (hash === BASE_HASH);
              log(`  new-tab [${j+1}]: ${candFile} (${Math.round(sz/1024)}KB) hash=${hash?.slice(0,12)} clone=${isClone}`);
              savedCandidates.push({ file: candFile, path: candPath, hash, size: sz, isClone, method: "new_tab" });
              if (!isClone && result !== "candidate_saved") {
                fs.writeFileSync(DEST_PATH, tabBuf);
                log(`Saved: ${DEST_FILE} (${Math.round(sz/1024)}KB)`);
                result = "candidate_saved";
              }
            } else {
              warn(`New tab also failed — ${cand.src.slice(0,60)}`);
              result = "need_intercept";
              break outer;
            }
            continue;
          }

          fs.writeFileSync(candPath, Buffer.from(buf));
          const hash    = fileHash(candPath);
          const sz      = fs.statSync(candPath).size;
          const isClone = (hash === BASE_HASH);
          log(`  direct [${j+1}]: ${candFile} (${Math.round(sz/1024)}KB) hash=${hash?.slice(0,12)} clone=${isClone}`);
          savedCandidates.push({ file: candFile, path: candPath, hash, size: sz, isClone, method: "direct" });
          if (!isClone && result !== "candidate_saved") {
            fs.writeFileSync(DEST_PATH, Buffer.from(buf));
            log(`Saved: ${DEST_FILE} (${Math.round(sz/1024)}KB)`);
            result = "candidate_saved";
          }
        }
        if (result === "candidate_saved") break outer;
      }
    } else {
      stableCount = 0; stableKey = null;
    }

    const generating = /Creating image|generating|working/i.test(lastTxt);
    log(`  ${Math.round(elapsed/1000)}s | cands:${newCands.length} stable:${stableCount} done:${done}${generating ? " [gen]" : ""}`);
  }

  // ── fallback 1: 신규 탭 URL 회수 ──────────────────────────────────────
  if (result === "timeout" || result === "need_intercept") {
    log(`Result: ${result} — new tab recovery (${pendingUrls.length} URLs)...`);

    const liveImgs = await collectLastAssistantImages(page).catch(() => []);
    for (const img of liveImgs) {
      if (img.gen && img.src && !pendingUrls.includes(img.src)) pendingUrls.push(img.src);
    }
    log(`  Total fallback URLs: ${pendingUrls.length}`);

    for (const [j, url] of pendingUrls.entries()) {
      log(`  new-tab [${j+1}/${pendingUrls.length}]: ${url.slice(0, 70)}...`);
      const tabBuf = await fetchViaNewTab(ctx, url);
      if (!tabBuf || tabBuf.length < 10000) { warn(`  new-tab failed`); continue; }
      const ts       = Date.now();
      const candFile = `s5_newtab_${ts}_${j+1}.png`;
      const candPath = path.join(CAND_DIR, candFile);
      fs.writeFileSync(candPath, tabBuf);
      const hash    = fileHash(candPath);
      const sz      = fs.statSync(candPath).size;
      const isClone = (hash === BASE_HASH);
      log(`  new-tab recovered: ${candFile} (${Math.round(sz/1024)}KB) hash=${hash?.slice(0,12)} clone=${isClone}`);
      savedCandidates.push({ file: candFile, path: candPath, hash, size: sz, isClone, method: "new_tab_recovery" });
      if (!isClone && result !== "candidate_saved") {
        fs.writeFileSync(DEST_PATH, tabBuf);
        log(`Saved via new-tab: ${DEST_FILE} (${Math.round(sz/1024)}KB)`);
        result = "candidate_saved";
      }
    }
  }

  // ── fallback 2: intercept+reload ──────────────────────────────────────
  if (result === "timeout" || result === "need_intercept") {
    log("New tab recovery failed — intercept+reload final attempt...");
    convUrl = convUrl || page.url();
    const intercepted = await interceptRecover(page, convUrl);

    for (const [j, [src, body]] of [...intercepted.entries()].entries()) {
      const ts       = Date.now();
      const candFile = `s5_intercept_${ts}_${j+1}.png`;
      const candPath = path.join(CAND_DIR, candFile);
      fs.writeFileSync(candPath, body);
      const hash    = fileHash(candPath);
      const sz      = fs.statSync(candPath).size;
      const isClone = (hash === BASE_HASH);
      log(`  intercept [${j+1}]: ${candFile} (${Math.round(sz/1024)}KB) hash=${hash?.slice(0,12)} clone=${isClone}`);
      savedCandidates.push({ file: candFile, path: candPath, hash, size: sz, isClone, method: "intercept", src });
      if (!isClone && result !== "candidate_saved") {
        fs.writeFileSync(DEST_PATH, body);
        log(`Saved via intercept: ${DEST_FILE} (${Math.round(sz/1024)}KB)`);
        result = "candidate_saved";
      }
    }
    if (result !== "candidate_saved") warn("All fallbacks failed — PENDING_RECOVERY");
  }

  if (result !== "timeout" && result !== "pending_recovery") {
    await page.close().catch(() => {});
  }
  await browser.close();
  log("CDP disconnected");

  console.log("\n\n=== S5 EDIT RESULT ===");
  console.log(`Result: ${result}`);
  console.log(`GPT submissions: 1 (S4 base edit)`);

  if (result === "candidate_saved") {
    const sz = fs.existsSync(DEST_PATH) ? Math.round(fs.statSync(DEST_PATH).size/1024) : 0;
    console.log(`\nSaved: ${DEST_FILE} (${sz}KB)`);
    console.log(`Candidates: ${CAND_DIR}`);
    console.log("\n=== BOSS RULE QA (required before accepting) ===");
    console.log("FAIL if ANY of:");
    console.log("  x Boss face, head, hair, neck, shoulder, torso, body");
    console.log("  x Boss silhouette/shadow/reflection");
    console.log("  x Beyond elbow");
    console.log("  x Second person in frame");
    console.log("PASS requires ALL of:");
    console.log("  [] Same room/copier/paper pile/camera angle as S4");
    console.log("  [] Jun: exhausted lean against copier, same costume");
    console.log("  [] Right edge: suit-sleeved hand + partial forearm only");
    console.log("  [] Hand picking up one sheet from pile");
    console.log("  [] No anatomical distortion");
  } else if (result === "text_refused") {
    console.log("\n-> GPT refused to generate image. FAIL. 0 retries.");
  } else {
    console.log(`\n-> ${result}`);
  }

  console.log("\n=== Candidates ===");
  savedCandidates.forEach((c, i) =>
    console.log(`  [${i+1}] ${c.file} | ${Math.round(c.size/1024)}KB | ${c.hash} | clone=${c.isClone} | ${c.method}`)
  );
  console.log("\nDirect API calls: $0");
  console.log("Veo/TTS: none");
}

main().catch(e => { console.error("[FATAL]", e.message); process.exit(1); });
