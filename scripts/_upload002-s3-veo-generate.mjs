/**
 * upload_002_copier S3 Veo 영상 생성
 *
 * REFERENCE: kf_s3_tapping_relief_v3_bag.png (가방 복구 PASS)
 * OUTPUT:    output/v2/3d_sitcom_prod_v1/upload_002_copier/veo/s3_veo_raw.mp4
 * 방식:      Gemini 웹 VideoFX, profile 1→2→3 (4 금지)
 * 종횡비:   세로 9:16
 *
 * Owner 승인: ALLOW_VEO=true, S3 Veo 1회 (매번 명시 필요)
 * - Gemini 웹 할당량 사용, 직접 API $0
 * - 자동 재제출 0회 / TTS 금지
 *
 * 핵심 인과관계: 두드리기 → 복사기 작동 시작
 * - 두드리기 전 출력 금지
 * - 두드리기는 옆면 열린 손바닥 1회 (버튼 누르기 대체 금지)
 *
 * 전송 횟수 설계 (S2에서 검증됨):
 *   - gemini.google.com/app 루트에서 Veo 활성 후 "파일" 메뉴로 직접 첨부
 *   - TOTAL_MESSAGE_SEND_COUNT: 최대 1 (위반 시 즉시 abort)
 *   - VEO_SUBMISSION_COUNT: 최대 1 (위반 시 즉시 abort)
 *
 * 사용: node scripts/_upload002-s3-veo-generate.mjs [--profile 1|2|3] [--dry-run]
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
const REF_IMG = path.join(KF_DIR, "kf_s3_tapping_relief_v3_bag.png");
const OUT_MP4 = path.join(VEO_DIR, "s3_veo_raw.mp4");

// ── fail-closed Gemini/Veo video allow guard: browser/CDP/network/output 전에 반드시 통과 ──
// ALLOW_GEMINI_VEO=1은 local fail-closed 스위치일 뿐, Gemini/Veo 실행 승인이 아니다 (no-live 기본).
if (process.env.ALLOW_GEMINI_VEO !== "1") {
  console.error("ABORT: Gemini/Veo video 경로 차단 (fail-closed). 필요한 env: ALLOW_GEMINI_VEO=1 — browser/CDP/network/output 전에 중단.");
  process.exit(2);
}

fs.mkdirSync(VEO_DIR, { recursive: true });

const DRY         = process.argv.includes("--dry-run");
const profileArg  = process.argv.indexOf("--profile");
const PROFILE_NUM = profileArg >= 0 ? parseInt(process.argv[profileArg + 1]) : 1;

if (PROFILE_NUM === 4) { console.error("[ABORT] Profile 4 is forbidden."); process.exit(1); }
if (![1, 2, 3].includes(PROFILE_NUM)) { console.error("[ABORT] Profile must be 1, 2, or 3."); process.exit(1); }

const PROFILE_PORT = { 1: 9223, 2: 9224, 3: 9225 };
const CDP_PORT = PROFILE_PORT[PROFILE_NUM];

const CHROME_EXE = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const USER_DATA_ROOTS = {
  1: "C:\\Users\\PC\\AppData\\Local\\Google\\Chrome\\User Data\\AI-Gemini-1",
  2: "C:\\Users\\PC\\AppData\\Local\\Google\\Chrome\\User Data\\AI-Gemini-2",
  3: "C:\\Users\\PC\\AppData\\Local\\Google\\Chrome\\User Data\\AI-Gemini-3",
};
const USER_DATA = USER_DATA_ROOTS[PROFILE_NUM];

// ── 전송 카운터 ───────────────────────────────────────────────────────────────
let TOTAL_MESSAGE_SEND_COUNT = 0;
let VEO_SUBMISSION_COUNT = 0;

function recordSend(label, isVeo = false) {
  TOTAL_MESSAGE_SEND_COUNT++;
  if (isVeo) VEO_SUBMISSION_COUNT++;
  if (TOTAL_MESSAGE_SEND_COUNT > 1) {
    console.error(`[ABORT:double_send] TOTAL=${TOTAL_MESSAGE_SEND_COUNT} at "${label}". 즉시 종료.`);
    process.exit(1);
  }
  if (VEO_SUBMISSION_COUNT > 1) {
    console.error(`[ABORT:double_veo] VEO=${VEO_SUBMISSION_COUNT} at "${label}". 즉시 종료.`);
    process.exit(1);
  }
  log(`[SEND #${TOTAL_MESSAGE_SEND_COUNT}${isVeo ? "/VEO" : ""}] "${label}"`);
}

function log(m)  { console.log(`[${new Date().toISOString().slice(11, 19)}][P${PROFILE_NUM}] ${m}`); }
function warn(m) { console.warn(`[WARN][P${PROFILE_NUM}] ${m}`); }
function abort(code, m) { console.error(`\n[ABORT:${code}] ${m}\n`); process.exit(1); }

function fileHash(p) {
  if (!fs.existsSync(p)) return null;
  return crypto.createHash("md5").update(fs.readFileSync(p)).digest("hex");
}

// ── S3 행동 프롬프트 ────────────────────────────────────────────────────────
// 교정 근거 (2026-06-15):
//   kf_s3_tapping_relief_v2.png의 시작 상태:
//     - 오른손이 복사기 제어판 근처에서 두드리기 완료 직후 포즈
//     - 출력 트레이에 종이 절반 이미 배출 중
//     - 복사기 이미 작동 중
//   따라서 "빈 트레이/완전 정지/두드리기 전" 조건은 reference와 충돌 → 제거
//   접근 A 채택: 두드리기 완료 직후 장면에서 자연스럽게 이어지는 행동으로 교정
const PROMPT = `Animate this 3D scene. Keep the copy room, the gray multifunction copier, and the character (Jun) exactly as shown in the reference image.

Continuous medium-wide shot — do NOT cut. Camera stays stable throughout.

ACTION SEQUENCE — starting exactly from the reference image pose:
1. The scene opens with Jun's right hand just finishing a gentle tap on the side panel of the copier. The first sheet of paper is already beginning to slide out of the output tray. The copier has just started running.
2. Jun's right hand lowers back naturally to his side. His left hand stays empty at his side throughout.
3. The first sheet of paper slides fully out of the output tray.
4. Jun's shoulders drop slightly as he exhales a brief moment of relief.
5. A second sheet begins to emerge from the output tray.
6. Jun tilts his head slightly and looks at the tray with a mildly puzzled expression — as if surprised that it is printing more.

Style: Cute semi-deformed 3D animated, adult office comedy. 9:16 vertical format.

STRICT RULES:
- Jun's right hand must complete its downward return in the first few frames — no repeated tapping
- Jun's left hand stays empty and relaxed at his side throughout
- No button pressing
- No picking up torn paper scraps
- No scene cuts or internal montage
- No different space, copier, or costume change
- No face closeup
- No new characters
- No text, subtitle, logo
- No white shirt (Jun wears light-blue shirt)
- Stable camera throughout
- Silent (no audio required)
- Jun's brown crossbody messenger bag must remain visible throughout — strap crossing torso, bag at right hip`;

// ── CDP ──────────────────────────────────────────────────────────────────────
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

async function detectQuotaOrRefusal(page) {
  const bodyText = await page.evaluate(() => document.body.innerText || "").catch(() => "");
  const QUOTA_PAT   = ["한도가", "초기화됩니다", "동영상 한도", "video limit", "limit resets", "Try again"];
  const REFUSAL_PAT = ["만들 수 없", "만들어 드릴 수 없", "I can't make", "I cannot create", "unable to create", "can't generate"];
  for (const p of QUOTA_PAT)   if (bodyText.includes(p)) return { type: "quota",   text: p };
  for (const p of REFUSAL_PAT) if (bodyText.includes(p)) return { type: "refusal", text: p };
  return null;
}

async function setVerticalMode(page) {
  const aspectBtn = page.locator('button[aria-label*="가로 모드"], button[aria-label*="16:9"], button[aria-label*="aspect"]').first();
  if (await aspectBtn.count() > 0) {
    log("Aspect ratio button found — clicking...");
    await aspectBtn.click();
    await page.waitForTimeout(1000);
    const vertByText = page.getByText("세로 모드(9:16)").first();
    const vertByRole = page.getByRole("menuitem").filter({ hasText: /세로|9:16|Portrait/i }).first();
    const vertItem   = (await vertByText.count() > 0) ? vertByText : vertByRole;
    if (await vertItem.count() > 0) {
      await vertItem.click();
      await page.waitForTimeout(800);
      log("Vertical 9:16 mode set ✅");
      return true;
    }
    warn("Vertical menu item not found — pressing Escape");
    await page.keyboard.press("Escape");
  } else {
    warn("Aspect ratio button not found");
  }
  return false;
}

async function activateVideoTool(page) {
  const toolBtn = page.locator('button[aria-label="업로드 및 도구"]').first();
  if (await toolBtn.count() === 0) { warn("Tool button not found"); return false; }
  await toolBtn.click();
  await page.waitForTimeout(1500);

  const quota = await detectQuotaOrRefusal(page);
  if (quota?.type === "quota") abort("quota_detected", `Profile ${PROFILE_NUM} quota: "${quota.text}"`);

  const videoItem = page.getByText("동영상", { exact: false }).first();
  if (await videoItem.count() === 0) {
    warn("Video menu item not found");
    await page.keyboard.press("Escape");
    return false;
  }
  await videoItem.click();
  await page.waitForTimeout(2000);
  log("Video tool activated");

  const tryBtn = page.getByRole("button").filter({ hasText: /사용해 보기|Try it|Got it/i }).first();
  if (await tryBtn.count() > 0) {
    await tryBtn.click();
    await page.waitForTimeout(800);
    log("Intro dialog dismissed");
  }
  return true;
}

// ── 메인 ──────────────────────────────────────────────────────────────────────
async function main() {
  log(`=== S3 Veo generation (profile ${PROFILE_NUM}, port ${CDP_PORT}) ===`);
  log(`Reference: ${REF_IMG}`);
  log(`Output:    ${OUT_MP4}`);
  if (DRY) log("[DRY-RUN MODE] — 전송 없음, TOTAL=0, VEO=0");

  if (!fs.existsSync(REF_IMG)) abort("ref_missing", `S3 keyframe not found: ${REF_IMG}`);
  const refHash = fileHash(REF_IMG);
  log(`S3 ref hash: ${refHash} (${Math.round(fs.statSync(REF_IMG).size / 1024)}KB)`);

  await ensureChrome();
  const browser = await chromium.connectOverCDP(`http://localhost:${CDP_PORT}`)
    .catch(e => abort("cdp_connect", e.message));
  const ctx = browser.contexts()[0];
  if (!ctx) abort("no_context", "No browser context");

  const page = await ctx.newPage();
  await page.goto("https://gemini.google.com/app", { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(2000);

  if (/accounts\.google|signin/i.test(page.url())) {
    abort("login_required", `Profile ${PROFILE_NUM} not logged in to Gemini`);
  }
  log(`Gemini loaded: ${page.url()}`);

  // ── Veo 도구 활성화 ──────────────────────────────────────────────────────
  const toolOk = await activateVideoTool(page);
  if (!toolOk) abort("tool_failed", "Video tool activation failed");

  // ── 세로 9:16 설정 ────────────────────────────────────────────────────────
  await setVerticalMode(page);

  // ── 파일 직접 첨부 (트리거 없음 — S2에서 검증된 패턴) ────────────────────
  log("Opening 업로드 및 도구 → 파일 for direct attach...");
  const toolBtn = page.locator('button[aria-label="업로드 및 도구"]').first();
  await toolBtn.click();
  await page.waitForTimeout(1200);

  const fileItem = page.getByText("파일", { exact: true }).first();
  if (await fileItem.count() === 0) abort("file_menu_missing", "파일 menu not found");

  const [fileChooser] = await Promise.all([
    page.waitForEvent("filechooser", { timeout: 5000 }).catch(() => null),
    fileItem.click(),
  ]);
  if (!fileChooser) abort("filechooser_missing", "File chooser did not open");
  await fileChooser.setFiles(REF_IMG);
  await page.waitForTimeout(2000);

  const thumbs = await page.evaluate(() =>
    Array.from(document.querySelectorAll("img[src*='blob'], img[src*='data:']")).map(el => el.src?.slice(0, 60))
  );
  log(`Thumbnails: ${thumbs.length}`);
  if (thumbs.length === 0) warn("No thumbnail — image may not be attached");
  else log("S3 reference image attached ✅");

  // ── 프롬프트 입력 ─────────────────────────────────────────────────────────
  const ta = page.locator('rich-textarea .ql-editor, rich-textarea [contenteditable="true"]').first();
  const taFb = page.locator('[contenteditable="true"]').first();
  const input = (await ta.count() > 0) ? ta : taFb;
  await input.waitFor({ state: "visible", timeout: 15000 })
    .catch(() => abort("input_missing", "Input textarea not found"));
  await input.click();
  await page.waitForTimeout(300);
  const oneLine = PROMPT.replace(/\s*\n\s*/g, " ").trim();
  await page.keyboard.type(oneLine, { delay: 3 });
  await page.waitForTimeout(800);
  const typed = (await input.textContent().catch(() => "") || "").trim();
  log(`Prompt typed: ${typed.length} chars`);
  if (typed.length < 10) abort("input_failed", "Prompt input failed");

  // ── Preflight ─────────────────────────────────────────────────────────────
  const sendBtnPre = page.locator('button[aria-label="메시지 보내기"], button[aria-label*="전송"], button[aria-label*="Send"]').first();
  const sendEnabled = await sendBtnPre.isEnabled().catch(() => false);
  log(`Preflight: thumb=${thumbs.length}, prompt_len=${typed.length}, send_enabled=${sendEnabled}`);
  log(`Counters before send: TOTAL=${TOTAL_MESSAGE_SEND_COUNT}, VEO=${VEO_SUBMISSION_COUNT}`);

  if (DRY) {
    log("\n[DRY-RUN] Preflight complete. 전송 없음.");
    log(`  TOTAL_MESSAGE_SEND_COUNT = ${TOTAL_MESSAGE_SEND_COUNT} ✅ (expected 0)`);
    log(`  VEO_SUBMISSION_COUNT     = ${VEO_SUBMISSION_COUNT} ✅ (expected 0)`);
    log(`  Reference attached: ${thumbs.length > 0 ? "YES" : "NO — check"}`);
    log(`  Prompt (first 80): "${typed.slice(0, 80)}"`);
    log(`  Causal keyword present: ${typed.includes("just finishing a gentle tap") ? "YES ✅" : "NO ⚠️"}`);
    log(`  Send button enabled: ${sendEnabled}`);
    await page.close();
    await browser.close();
    return;
  }

  // ── 최종 전송 (정확히 1회) ────────────────────────────────────────────────
  recordSend("S3 Veo 최종 제출", true);  // TOTAL=1, VEO=1

  const sendBtn = page.locator('button[aria-label="메시지 보내기"], button[aria-label*="전송"], button[aria-label*="Send"]').first();
  if (await sendBtn.count() > 0 && await sendBtn.isEnabled().catch(() => false)) {
    await sendBtn.click();
    log("Send button clicked — ACTUAL VEO SUBMISSION (TOTAL=1, VEO=1)");
  } else {
    await input.press("Enter");
    log("Enter pressed — ACTUAL VEO SUBMISSION (TOTAL=1, VEO=1)");
  }

  log("Waiting for video generation (up to 360s)...");
  let result = "timeout";
  let savedPath = null;
  const startTime = Date.now();

  while (Date.now() - startTime < 360_000) {
    await page.waitForTimeout(5000);
    const elapsed = Math.round((Date.now() - startTime) / 1000);

    const check = await detectQuotaOrRefusal(page);
    if (check?.type === "refusal")  { result = "refusal";   break; }
    if (check?.type === "quota")    { result = "quota_mid"; break; }

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
          log(`Saved: ${OUT_MP4} (${Math.round(fs.statSync(OUT_MP4).size / 1024)}KB)`);
        } else {
          await download.saveAs(OUT_MP4);
          if (fs.existsSync(OUT_MP4)) {
            savedPath = OUT_MP4;
            result = "saved";
            log(`Saved via saveAs: ${OUT_MP4}`);
          } else {
            warn("Download path not found");
            result = "download_failed";
          }
        }
      } catch (e) {
        warn(`Download error: ${e.message}`);
        result = "download_failed";
      }
      break;
    }

    const bodySnip = await page.evaluate(() => (document.body.innerText || "").slice(0, 300)).catch(() => "");
    const generating = /생성|만드는 중|Generating|Creating|working/i.test(bodySnip);
    const vidCount = await page.locator("video").count();
    if (vidCount > 0) {
      log(`  ${elapsed}s | video_element_found:${vidCount} — waiting for download btn`);
    } else {
      log(`  ${elapsed}s | generating:${generating} | dlBtn:${dlVisible}`);
    }
  }

  if (result !== "timeout") await page.close().catch(() => {});
  await browser.close();
  log("CDP disconnected");

  console.log("\n=== S3 VEO RESULT ===");
  console.log(`Result:                   ${result}`);
  console.log(`Profile:                  ${PROFILE_NUM} (port ${CDP_PORT})`);
  console.log(`TOTAL_MESSAGE_SEND_COUNT: ${TOTAL_MESSAGE_SEND_COUNT}`);
  console.log(`VEO_SUBMISSION_COUNT:     ${VEO_SUBMISSION_COUNT}`);
  console.log(`Direct API cost:          $0`);

  if (result === "saved" && savedPath) {
    const sz  = fs.statSync(savedPath).size;
    const md5 = fileHash(savedPath);
    console.log(`\nFile: ${savedPath}`);
    console.log(`Size: ${Math.round(sz / 1024)}KB`);
    console.log(`MD5:  ${md5}`);
    console.log("\n=== QA REQUIRED ===");
    console.log("ffprobe -v quiet -print_format json -show_streams -show_format <file>");
    console.log("Check: 720x1280 (9:16), fps=24, duration=10s, h264");
    console.log("Check causal sequence: stopped→tap side panel→copier starts→paper out→relief→2nd paper→puzzled");
    console.log("Check: copier NOT printing before tap, tap is side-panel open-palm once");
  } else if (result === "refusal") {
    console.log("\n-> Gemini refused. FAIL. 0 retries.");
  } else if (result === "quota_mid") {
    console.log("\n-> Quota hit. Try --profile 2 or 3.");
  } else if (result === "download_failed") {
    console.log("\n-> Generation OK but download failed. Open Gemini tab manually.");
  } else {
    console.log("\n-> TIMEOUT. Tab kept open. PENDING_RECOVERY.");
  }
}

main().catch(e => { console.error("[FATAL]", e.message); process.exit(1); });
