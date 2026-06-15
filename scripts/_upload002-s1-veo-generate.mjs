/**
 * upload_002_copier S1 Veo 영상 생성
 *
 * - REFERENCE: kf_s1_wide_copier_error.png
 * - OUTPUT: output/v2/3d_sitcom_prod_v1/upload_002_copier/veo/s1_veo_raw.mp4
 * - 방식: Gemini 웹 VideoFX, profile 1→2→3 failover (4 금지)
 * - 종횡비: 세로 9:16 (생성 전 설정 필수)
 *
 * Owner 승인: ALLOW_VEO=true, S1 Veo 1회
 * - Gemini 웹 할당량 사용, 직접 API $0
 * - 자동 재제출 0회
 * - TTS 금지
 * - 타임아웃 시 PENDING_RECOVERY 보고
 *
 * 사용: node scripts/_upload002-s1-veo-generate.mjs [--profile 1|2|3] [--dry-run]
 */

import { chromium } from "playwright";
import { spawn }    from "child_process";
import path         from "path";
import fs           from "fs";
import crypto       from "crypto";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT      = path.resolve(__dirname, "..");

const KF_DIR  = path.join(ROOT, "output/v2/3d_sitcom_prod_v1/upload_002_copier/keyframes");
const VEO_DIR = path.join(ROOT, "output/v2/3d_sitcom_prod_v1/upload_002_copier/veo");
const REF_IMG = path.join(KF_DIR, "kf_s1_wide_copier_error.png");
const OUT_MP4 = path.join(VEO_DIR, "s1_veo_raw.mp4");

fs.mkdirSync(VEO_DIR, { recursive: true });

const DRY         = process.argv.includes("--dry-run");
const profileArg  = process.argv.indexOf("--profile");
const PROFILE_NUM = profileArg >= 0 ? parseInt(process.argv[profileArg+1]) : 1;

// profile 4 금지
if (PROFILE_NUM === 4) { console.error("[ABORT] Profile 4 is forbidden."); process.exit(1); }
if (![1,2,3].includes(PROFILE_NUM)) { console.error("[ABORT] Profile must be 1, 2, or 3."); process.exit(1); }

// profile → CDP 포트 매핑 (Gemini 전용 프로필)
const PROFILE_PORT = { 1: 9223, 2: 9224, 3: 9225 };
const CDP_PORT = PROFILE_PORT[PROFILE_NUM];

const CHROME_EXE  = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const USER_DATA_ROOTS = {
  1: "C:\\Users\\PC\\AppData\\Local\\Google\\Chrome\\User Data\\AI-Gemini-1",
  2: "C:\\Users\\PC\\AppData\\Local\\Google\\Chrome\\User Data\\AI-Gemini-2",
  3: "C:\\Users\\PC\\AppData\\Local\\Google\\Chrome\\User Data\\AI-Gemini-3",
};
const USER_DATA = USER_DATA_ROOTS[PROFILE_NUM];

function log(m)  { console.log(`[${new Date().toISOString().slice(11,19)}][P${PROFILE_NUM}] ${m}`); }
function warn(m) { console.warn(`[WARN][P${PROFILE_NUM}] ${m}`); }
function abort(code, m) { console.error(`\n[ABORT:${code}] ${m}\n`); process.exit(1); }

function fileHash(p) {
  if (!fs.existsSync(p)) return null;
  return crypto.createHash("md5").update(fs.readFileSync(p)).digest("hex");
}

// ── S1 행동 프롬프트 ────────────────────────────────────────────────────────
// NO CLOCK — CURRENT_CONTRACT.json 최우선
const PROMPT = `Animate this 3D scene. Keep the copy room, the gray multifunction copier, and the character (Jun) exactly as shown.

Continuous medium-wide shot — do NOT cut. Camera stays stable throughout.

Action sequence:
1. Jun walks in from the right side carrying one sheet of paper
2. Jun reaches the copier and presses the copy button
3. The copier's error indicator light turns red immediately
4. Jun reacts with a confused and frustrated expression — medium shot, no face closeup

Style: Cute semi-deformed 3D animated, adult office comedy. 9:16 vertical format.

STRICT RULES:
- No clock or watch visible anywhere in the frame
- No face closeup
- No internal copier mechanics shown
- No dialogue, lip-sync, subtitle, text, or logo
- No scene cuts or jump cuts
- No new characters
- No white shirt (Jun wears light-blue shirt)
- Stable camera throughout
- Silent (no audio required)`;

// ── CDP ────────────────────────────────────────────────────────────────────
async function isCDPOpen(port) {
  try {
    const r = await fetch(`http://localhost:${port}/json/version`, { signal: AbortSignal.timeout(2000) });
    return r.ok;
  } catch { return false; }
}

async function ensureChrome() {
  if (await isCDPOpen(CDP_PORT)) { log("Chrome CDP already open"); return; }
  log(`Launching Chrome profile ${PROFILE_NUM} on port ${CDP_PORT}...`);
  spawn(CHROME_EXE, [
    `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=${USER_DATA}`,
    "--no-first-run", "--no-default-browser-check",
    "https://gemini.google.com/"
  ], { detached: true, stdio: "ignore" }).unref();
  for (let i = 0; i < 40; i++) {
    await new Promise(r => setTimeout(r, 500));
    if (await isCDPOpen(CDP_PORT)) { log("Chrome CDP connected"); return; }
  }
  abort("cdp_timeout", `Chrome CDP not available on port ${CDP_PORT} after 20s`);
}

// ── 할당량/거부 감지 ────────────────────────────────────────────────────────
async function detectQuotaOrRefusal(page) {
  const bodyText = await page.evaluate(() => document.body.innerText || "").catch(() => "");
  const QUOTA_PATTERNS = ["한도가", "초기화됩니다", "동영상 한도", "video limit", "limit resets", "Try again"];
  const REFUSAL_PATTERNS = ["만들 수 없", "만들어 드릴 수 없", "I can't make", "I cannot create", "unable to create", "can't generate"];
  for (const p of QUOTA_PATTERNS) {
    if (bodyText.includes(p)) return { type: "quota", text: p };
  }
  for (const p of REFUSAL_PATTERNS) {
    if (bodyText.includes(p)) return { type: "refusal", text: p };
  }
  return null;
}

// ── 세로 9:16 모드 설정 ────────────────────────────────────────────────────
async function setVerticalMode(page) {
  // "가로 모드(16:9)" 버튼 클릭 → 메뉴 → "세로 모드(9:16)"
  const aspectBtn = page.locator('button[aria-label*="가로 모드"], button[aria-label*="16:9"], button[aria-label*="aspect"]').first();
  if (await aspectBtn.count() > 0) {
    log("Aspect ratio button found — clicking...");
    await aspectBtn.click();
    await page.waitForTimeout(1000);
    // Gemini menu items have no role="menuitem" — use getByText
    const vertByText = page.getByText("세로 모드(9:16)").first();
    const vertByRole = page.getByRole("menuitem").filter({ hasText: /세로|9:16|Portrait/i }).first();
    const vertItem = (await vertByText.count() > 0) ? vertByText : vertByRole;
    if (await vertItem.count() > 0) {
      await vertItem.click();
      await page.waitForTimeout(800);
      log("Vertical 9:16 mode set");
      return true;
    } else {
      warn("Vertical menu item not found — pressing Escape");
      await page.keyboard.press("Escape");
    }
  } else {
    warn("Aspect ratio button not found — will try to set via prompt");
  }
  return false;
}

// ── 동영상 도구 활성화 ─────────────────────────────────────────────────────
// 검증된 UI 패턴 (G1 탐색 결과):
//   "업로드 및 도구" → getByText("동영상") 클릭 → "close 동영상" 칩 활성
async function activateVideoTool(page) {
  const toolBtn = page.locator('button[aria-label="업로드 및 도구"]').first();
  if (await toolBtn.count() === 0) { warn("Tool button not found"); return false; }
  await toolBtn.click();
  await page.waitForTimeout(1500);

  // 할당량 선제 감지
  const quota = await detectQuotaOrRefusal(page);
  if (quota?.type === "quota") abort("quota_detected", `Profile ${PROFILE_NUM} quota: "${quota.text}"`);

  // "동영상" 텍스트 클릭 (role=menuitem이 없으므로 getByText 사용)
  const videoItem = page.getByText("동영상", { exact: false }).first();
  if (await videoItem.count() === 0) {
    warn("Video menu item not found");
    await page.keyboard.press("Escape");
    return false;
  }
  await videoItem.click();
  await page.waitForTimeout(2000);
  log("Video tool clicked");

  // "사용해 보기" 다이얼로그 닫기 (처음 실행 시에만 등장)
  const tryBtn = page.getByRole("button").filter({ hasText: /사용해 보기|Try it|Got it/i }).first();
  if (await tryBtn.count() > 0) {
    await tryBtn.click();
    await page.waitForTimeout(800);
    log("Intro dialog dismissed");
  }

  // 동영상 칩 확인: button[aria-label="close 동영상"]
  const chip = page.locator('button[aria-label="close 동영상"], button[aria-label*="close"]').first();
  if (await chip.count() > 0) {
    log("Video chip active (close btn found)");
  } else {
    log("Video chip close btn not found — continuing");
  }
  return true;
}

// ── 메인 ──────────────────────────────────────────────────────────────────
async function main() {
  log(`=== S1 Veo generation (profile ${PROFILE_NUM}, port ${CDP_PORT}) ===`);
  log(`Reference: ${REF_IMG}`);
  log(`Output: ${OUT_MP4}`);

  if (!fs.existsSync(REF_IMG)) abort("ref_missing", `S1 keyframe not found: ${REF_IMG}`);
  const refHash = fileHash(REF_IMG);
  log(`S1 ref hash: ${refHash} (${Math.round(fs.statSync(REF_IMG).size/1024)}KB)`);

  await ensureChrome();
  const browser = await chromium.connectOverCDP(`http://localhost:${CDP_PORT}`)
    .catch(e => abort("cdp_connect", e.message));

  const ctx = browser.contexts()[0];
  if (!ctx) abort("no_context", "No browser context");

  const page = await ctx.newPage();
  await page.goto("https://gemini.google.com/", { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(2000);

  if (/accounts\.google|signin/i.test(page.url())) {
    abort("login_required", `Profile ${PROFILE_NUM} not logged in to Gemini`);
  }
  log("Gemini loaded");

  if (DRY) {
    log("[DRY-RUN] Page loaded. 0 submissions.");
    await page.close();
    await browser.close();
    return;
  }

  // ── 동영상 도구 활성화 ───────────────────────────────────────────────
  const toolOk = await activateVideoTool(page);
  if (!toolOk) abort("tool_failed", "Video tool activation failed");

  // ── 세로 9:16 설정 ──────────────────────────────────────────────────
  await setVerticalMode(page);

  // ── STEP 1: 짧은 트리거 메시지 전송 → 대화 탭 생성 ──────────────────
  // Gemini Veo: 신규 탭에는 "파일" 메뉴 없음 → 트리거 전송 후 응답 탭에서 이미지 첨부
  const ta = page.locator('rich-textarea .ql-editor, rich-textarea [contenteditable="true"]').first();
  const taFallback = page.locator('[contenteditable="true"]').first();
  const input = (await ta.count() > 0) ? ta : taFallback;
  await input.waitFor({ state: "visible", timeout: 15000 })
    .catch(() => abort("input_missing", "Input textarea not found"));
  log("Input found — sending trigger to open conversation tab...");

  await input.click();
  await page.waitForTimeout(300);
  await page.keyboard.type("Please generate the video. I will attach the reference image next.", { delay: 3 });
  await page.waitForTimeout(500);

  const triggerBtn = page.locator('button[aria-label="메시지 보내기"], button[aria-label*="전송"], button[aria-label*="Send"]').first();
  if (await triggerBtn.count() > 0 && await triggerBtn.isEnabled().catch(() => false)) {
    await triggerBtn.click();
  } else {
    await input.press("Enter");
  }
  log("Trigger sent — waiting for conversation URL...");

  // 대화 탭 URL이 /app/<id> 형태로 바뀔 때까지 대기
  await page.waitForURL(/\/app\/[a-f0-9]+/, { timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(3000);
  log(`Conversation tab URL: ${page.url()}`);

  const preQuota = await detectQuotaOrRefusal(page);
  if (preQuota?.type === "quota") abort("pre_send_quota", `Quota: "${preQuota.text}"`);

  // ── STEP 2: 대화 탭에서 "파일" → 이미지 첨부 후 실제 프롬프트 전송 ──
  log("Attaching S1 reference via 파일 menu...");
  const toolBtn2 = page.locator('button[aria-label="업로드 및 도구"]').first();
  await toolBtn2.click();
  await page.waitForTimeout(1200);

  const fileItem = page.getByText("파일", { exact: true }).first();
  if (await fileItem.count() === 0) abort("file_menu_missing", "파일 menu item not found in conversation tab");

  const [fileChooser] = await Promise.all([
    page.waitForEvent("filechooser", { timeout: 5000 }).catch(() => null),
    fileItem.click(),
  ]);
  if (!fileChooser) abort("filechooser_missing", "File chooser did not open");
  await fileChooser.setFiles(REF_IMG);
  await page.waitForTimeout(2000);
  log("S1 reference image attached ✅");

  // 썸네일 확인
  const thumbs = await page.evaluate(() =>
    Array.from(document.querySelectorAll("img[src*='blob'], img[src*='data:']")).map(el => el.src?.slice(0,60))
  );
  log(`Thumbnails: ${thumbs.length} (${thumbs[0]?.slice(0,40) || "none"})`);

  // 실제 프롬프트 입력
  const input2 = page.locator('rich-textarea .ql-editor, rich-textarea [contenteditable="true"], [contenteditable="true"]').first();
  await input2.click();
  await page.waitForTimeout(300);
  const oneLine = PROMPT.replace(/\s*\n\s*/g, " ").trim();
  await page.keyboard.type(oneLine, { delay: 3 });
  await page.waitForTimeout(800);
  const typed = (await input2.textContent().catch(() => "") || "").trim();
  log(`Prompt: ${typed.length} chars`);
  if (typed.length < 10) abort("input_failed", "Prompt input failed");

  // ── STEP 3: 전송 (정확히 1회) ────────────────────────────────────────
  const sendBtn = page.locator('button[aria-label="메시지 보내기"], button[aria-label*="전송"], button[aria-label*="Send"]').first();
  if (await sendBtn.count() > 0 && await sendBtn.isEnabled().catch(() => false)) {
    await sendBtn.click();
    log("Send button clicked (1x) — ACTUAL VEO SUBMISSION");
  } else {
    await input2.press("Enter");
    log("Enter sent (1x) — ACTUAL VEO SUBMISSION");
  }

  log("Waiting for video generation (up to 360s)...");
  let result = "timeout";
  let savedPath = null;
  const startTime = Date.now();

  while (Date.now() - startTime < 360_000) {
    await page.waitForTimeout(5000);
    const elapsed = Math.round((Date.now() - startTime) / 1000);

    const check = await detectQuotaOrRefusal(page);
    if (check?.type === "refusal") { result = "refusal"; break; }
    if (check?.type === "quota")   { result = "quota_mid"; break; }

    // 다운로드 버튼 — aria-label 다양한 후보 포함
    const dlBtn = page.locator(
      'button[aria-label*="다운로드"], button[aria-label*="Download"], button[title*="다운로드"], a[download]'
    ).first();
    const dlVisible = await dlBtn.isVisible({ timeout: 500 }).catch(() => false);

    if (dlVisible) {
      log(`Download button visible at ${elapsed}s — downloading...`);
      try {
        const [download] = await Promise.all([
          page.waitForEvent("download", { timeout: 60000 }),
          dlBtn.click(),
        ]);
        const tmpPath = await download.path();
        if (tmpPath && fs.existsSync(tmpPath)) {
          fs.copyFileSync(tmpPath, OUT_MP4);
          savedPath = OUT_MP4;
          result = "saved";
          log(`Saved: ${OUT_MP4} (${Math.round(fs.statSync(OUT_MP4).size/1024)}KB)`);
        } else {
          await download.saveAs(OUT_MP4);
          if (fs.existsSync(OUT_MP4)) {
            savedPath = OUT_MP4;
            result = "saved";
            log(`Saved via saveAs: ${OUT_MP4}`);
          } else {
            warn(`Download path not found`);
            result = "download_failed";
          }
        }
      } catch (e) {
        warn(`Download error: ${e.message}`);
        result = "download_failed";
      }
      break;
    }

    const bodySnip = await page.evaluate(() => (document.body.innerText||"").slice(0,300)).catch(() => "");
    const generating = /생성|만드는 중|Generating|Creating|working/i.test(bodySnip);

    // 비디오 요소 감지 (다운로드 버튼보다 먼저 나타날 수 있음)
    const vidCount = await page.locator("video").count();
    if (vidCount > 0 && !dlVisible) {
      log(`  ${elapsed}s | video_element_found:${vidCount} — waiting for download btn`);
    } else {
      log(`  ${elapsed}s | generating:${generating} | dlBtn:${dlVisible}`);
    }
  }

  if (result !== "timeout") await page.close().catch(() => {});
  await browser.close();
  log("CDP disconnected");

  // ── 결과 보고 ──────────────────────────────────────────────────────
  console.log("\n\n=== S1 VEO RESULT ===");
  console.log(`Result: ${result}`);
  console.log(`Profile: ${PROFILE_NUM} (port ${CDP_PORT})`);
  console.log(`Submissions: 1`);
  console.log(`Direct API cost: $0`);

  if (result === "saved" && savedPath) {
    const sz = fs.statSync(savedPath).size;
    const md5 = fileHash(savedPath);
    console.log(`\nFile: ${savedPath}`);
    console.log(`Size: ${Math.round(sz/1024)}KB`);
    console.log(`MD5: ${md5}`);
    console.log("\n=== QA REQUIRED ===");
    console.log("Run: ffprobe -v quiet -print_format json -show_streams -show_format <file>");
    console.log("Check: resolution 720x1280 (9:16), fps, duration, codec");
    console.log("Check: action sequence, no clock, no face closeup, no cuts");
  } else if (result === "refusal") {
    console.log("\n-> Gemini refused content policy. FAIL. 0 retries.");
  } else if (result === "quota_mid") {
    console.log("\n-> Quota hit mid-generation. Try next profile (2 or 3).");
  } else if (result === "download_failed") {
    console.log("\n-> Generation succeeded but download failed. Tab kept open.");
    console.log("   Manual: open Gemini tab, click download button.");
  } else {
    console.log("\n-> TIMEOUT. Tab kept open. PENDING_RECOVERY.");
  }
}

main().catch(e => { console.error("[FATAL]", e.message); process.exit(1); });
