/**
 * upload_002_copier S5 Veo 재생성 — 오검출 교정 버전
 *
 * [오검출 원인 (2026-06-15 확인)]
 * 기존 s5_veo_raw.mp4: 상사 손이 전 구간 부재.
 * 0~2.5s 종이를 집은 손은 준 자신의 손.
 * 오른쪽 35% crop만으로 판정 → 오검출.
 *
 * [교정 포인트]
 * 1. 준의 두 손 위치를 프롬프트에서 명시적으로 고정
 * 2. 상사 손과 준의 손을 신체 연결 관계로 완전 분리
 * 3. "Jun never picks up, touches, or holds any paper" 명시
 * 4. 상사 손은 extreme right edge 바깥 신체와 연결됨을 명시
 * 5. 준의 양손은 내려져 있고 종이를 만지지 않음을 명시
 *
 * [QA 교정 — 오검출 방지]
 * 1. 준의 양손 위치를 전체 프레임에서 추적
 * 2. 종이 집는 손이 준 신체와 연결되는지 확인
 * 3. 상사 손은 extreme right edge 바깥으로 연결되어야 함
 * 4. 전체 프레임과 오른쪽 확대 화면 동시 비교
 * 5. 애매하면 FAIL
 *
 * REFERENCE: kf_s5_boss_hand_finale.png (continuity_pass)
 * OUTPUT:    output/v2/3d_sitcom_prod_v1/upload_002_copier/veo/s5_veo_regen.mp4
 *            (기존 s5_veo_raw.mp4 보존 — 덮어쓰기 금지)
 *
 * Owner 승인: ALLOW_VEO=true, S5 특례 재생성 1회
 * 사용: node scripts/_upload002-s5-veo-regen.mjs [--profile 1|2|3] [--dry-run]
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
const REF_IMG = path.join(KF_DIR, "kf_s5_boss_hand_finale.png");

// 기존 raw 보존 — 새 파일로 저장
const OUT_MP4 = path.join(VEO_DIR, "s5_veo_regen.mp4");
const ORIG_MP4 = path.join(VEO_DIR, "s5_veo_raw.mp4");

// ── fail-closed Gemini/Veo video allow guard: browser/CDP/network/output 전에 반드시 통과 ──
// ALLOW_GEMINI_VEO=1은 local fail-closed 스위치일 뿐, Gemini/Veo 실행 승인이 아니다 (no-live 기본).
if (process.env.ALLOW_GEMINI_VEO !== "1") {
  console.error("ABORT: Gemini/Veo video 경로 차단 (fail-closed). 필요한 env: ALLOW_GEMINI_VEO=1 — browser/CDP/network/output 전에 중단.");
  process.exit(2);
}

fs.mkdirSync(VEO_DIR, { recursive: true });

const DRY         = process.argv.includes("--dry-run");
const profileArg  = process.argv.indexOf("--profile");
const PROFILE_NUM = profileArg >= 0 ? parseInt(process.argv[profileArg + 1]) : 3;

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

// ── 전송 카운터 (단일 전송 보장) ──────────────────────────────────────────────
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

// ── S5 재생성 프롬프트 (오검출 교정 버전) ─────────────────────────────────────
//
// 핵심 교정:
// A. 준의 두 손을 명시적으로 고정 (내려진 채 종이 미접촉)
// B. 상사 손 = 화면 오른쪽 가장자리 바깥에서 연결된 별도 인물의 손
// C. 준의 손 ≠ 상사의 손 — 두 손을 혼동하지 않도록 별도 문단으로 분리
// D. 상사 손에 종이 1장이 이미 쥐어진 채 퇴장 — 준은 개입 없음
//
const PROMPT = `Animate this 3D scene. Keep the copy room, the gray multifunction copier, and Jun exactly as shown in the reference image.

Continuous medium-wide shot — do NOT cut. Camera stays stable throughout.

STARTING STATE — exactly as in the reference:
There are TWO separate hands visible in this scene. This distinction is critical:

HAND A (Jun's hands): Jun stands beside the copier in an exhausted, slumped posture with his head bowed. Jun's own two hands hang loosely at his sides — they do NOT hold, touch, or approach any paper, at any point in the video.

HAND B (Boss's hand): A suit-sleeved hand and a short partial forearm are already visible at the extreme right edge of the frame. This hand belongs to an unseen second person standing completely off-screen to the right. The boss's suited hand is already holding exactly one sheet of paper. This hand and forearm are NOT connected to Jun's body — they extend from beyond the right frame edge.

ACTION SEQUENCE:
1. The boss's suited hand (HAND B) holds the single sheet for one to two seconds, still and matter-of-fact.
2. The boss's suited hand (HAND B) slowly and smoothly retreats back out through the right edge of the frame, taking the single sheet with it.
3. Jun (HAND A) remains slumped throughout — no reaction, no movement of his hands, no looking up.
4. The large paper pile on the floor and tray stays unchanged. The copier is quiet.
5. The scene ends with Jun standing alone, still slumped, both his hands at his sides, in the quiet copy room.

Style: Cute semi-deformed 3D animated, adult office comedy. 9:16 vertical format.

ABSOLUTE BOSS RULE:
Only the already-visible suit-sleeved hand and short partial forearm (HAND B) may appear. The unseen boss's body remains completely outside the frame at all times.
NEVER reveal or generate: a face, head, hair, neck, shoulder, chest, torso, body, silhouette, reflection, or shadow of the boss.
The camera must NOT pan, zoom out, or widen toward the right edge.
No additional hand, arm, or person entering the frame.

STRICT SEPARATION — THE MOST IMPORTANT RULE:
The suited hand (HAND B) at the right edge is NOT Jun's hand. Jun never picks up, touches, holds, or moves toward any paper for the entire duration. Keep a clearly visible spatial gap between Jun's body and the suited forearm at the right edge. If Jun's hand appears to be near or touching a paper, that is a generation error.

ADDITIONAL STRICT RULES:
- No paper explosion, burst, shower, or additional printing
- No scene cuts or internal montage
- No different space, copier, or costume
- No face closeup of Jun
- No text, subtitle, logo
- No white shirt (Jun wears light-blue shirt, red tie, navy slacks)
- Jun does NOT walk away, jump, or reach toward anything
- Stable camera throughout
- Silent (no audio required)
- Jun's brown crossbody messenger bag must remain visible — strap crossing torso, bag at right hip`;

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

// ── dry-run 키워드 검증 ────────────────────────────────────────────────────────
function verifyPromptKeywords(typed) {
  const checks = [
    { key: "HAND A",                    label: "준 손 레이블 분리" },
    { key: "HAND B",                    label: "상사 손 레이블 분리" },
    { key: "Jun never picks up",        label: "준 손 금지 명시" },
    { key: "NOT connected to Jun",      label: "신체 연결 분리 명시" },
    { key: "NEVER reveal or generate",  label: "BOSS RULE 금지 명시" },
    { key: "camera must NOT pan",       label: "카메라 이동 금지" },
    { key: "brown crossbody messenger bag", label: "가방 연속성" },
    { key: "already holding exactly one sheet", label: "시작 상태 종이 1장" },
    { key: "HAND B) slowly and smoothly retreats", label: "상사 손 퇴장 행동" },
    { key: "both his hands at his sides", label: "준 양손 내려진 상태 결말" },
  ];
  let allPass = true;
  for (const c of checks) {
    const pass = typed.includes(c.key);
    console.log(`  ${pass ? "✅" : "❌"} ${c.label}: "${c.key.slice(0, 40)}"`);
    if (!pass) allPass = false;
  }
  return allPass;
}

// ── 메인 ──────────────────────────────────────────────────────────────────────
async function main() {
  log(`=== S5 Veo 재생성 — 오검출 교정 버전 (profile ${PROFILE_NUM}, port ${CDP_PORT}) ===`);
  log(`Reference: ${REF_IMG}`);
  log(`Output:    ${OUT_MP4}  (기존 ${ORIG_MP4} 보존)`);
  log(`⚠️  BOSS RULE ACTIVE + 준 손/상사 손 분리 강화`);
  if (DRY) log("[DRY-RUN MODE] — 전송 없음, TOTAL=0, VEO=0");

  // 기존 raw 보존 확인
  if (fs.existsSync(ORIG_MP4)) {
    log(`기존 s5_veo_raw.mp4 보존 확인 ✅ (${Math.round(fs.statSync(ORIG_MP4).size / 1024)}KB)`);
  }

  if (!fs.existsSync(REF_IMG)) abort("ref_missing", `S5 keyframe not found: ${REF_IMG}`);
  const refHash = fileHash(REF_IMG);
  const EXPECTED_HASH = "141b348a370374fbe0750fee67a32770";
  log(`S5 ref hash: ${refHash} (${Math.round(fs.statSync(REF_IMG).size / 1024)}KB)`);
  if (refHash !== EXPECTED_HASH) {
    warn(`Hash mismatch: expected ${EXPECTED_HASH}, got ${refHash}`);
  } else {
    log(`S5 ref hash verified ✅`);
  }

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

  // Veo 도구 활성화
  const toolOk = await activateVideoTool(page);
  if (!toolOk) abort("tool_failed", "Video tool activation failed");

  // 세로 9:16 설정
  await setVerticalMode(page);

  // 파일 직접 첨부 (파일 메뉴 방식 — S2~S5 검증된 패턴)
  log("Opening 업로드 및 도구 → 파일 for direct attach...");
  const toolBtn2 = page.locator('button[aria-label="업로드 및 도구"]').first();
  await toolBtn2.click();
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
  else log("S5 reference image attached ✅");

  // 프롬프트 입력
  const ta   = page.locator('rich-textarea .ql-editor, rich-textarea [contenteditable="true"]').first();
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

  // Preflight
  const sendBtnPre = page.locator('button[aria-label="메시지 보내기"], button[aria-label*="전송"], button[aria-label*="Send"]').first();
  const sendEnabled = await sendBtnPre.isEnabled().catch(() => false);
  log(`Preflight: thumb=${thumbs.length}, prompt_len=${typed.length}, send_enabled=${sendEnabled}`);
  log(`Counters before send: TOTAL=${TOTAL_MESSAGE_SEND_COUNT}, VEO=${VEO_SUBMISSION_COUNT}`);

  if (DRY) {
    log("\n[DRY-RUN] 키워드 검증:");
    const kwPass = verifyPromptKeywords(typed);
    log(`\n[DRY-RUN] 키워드 검증: ${kwPass ? "ALL PASS ✅" : "SOME FAIL ❌"}`);
    log(`[DRY-RUN] 전송 없음. TOTAL=${TOTAL_MESSAGE_SEND_COUNT}, VEO=${VEO_SUBMISSION_COUNT}`);
    log(`[DRY-RUN] 기존 s5_veo_raw.mp4 보존: ${fs.existsSync(ORIG_MP4) ? "YES ✅" : "확인 필요"}`);
    log(`[DRY-RUN] 출력 경로 (실제 실행 시): ${OUT_MP4}`);
    if (!kwPass) { await page.close(); await browser.close(); process.exit(1); }
    await page.close();
    await browser.close();
    return;
  }

  // 최종 전송 (정확히 1회)
  recordSend("S5 Veo 재생성 특례 제출", true);  // TOTAL=1, VEO=1

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
          if (fs.existsSync(OUT_MP4)) { savedPath = OUT_MP4; result = "saved"; }
          else { warn("Download path not found"); result = "download_failed"; }
        }
      } catch (e) { warn(`Download error: ${e.message}`); result = "download_failed"; }
      break;
    }

    const vidCount = await page.locator("video").count();
    const generating = /생성|만드는 중|Generating|Creating/i.test(
      await page.evaluate(() => (document.body.innerText || "").slice(0, 300)).catch(() => "")
    );
    log(`  ${elapsed}s | generating:${generating} | video:${vidCount} | dlBtn:${dlVisible}`);
  }

  if (result !== "timeout") await page.close().catch(() => {});
  await browser.close();
  log("CDP disconnected");

  console.log("\n=== S5 VEO 재생성 RESULT ===");
  console.log(`Result:                   ${result}`);
  console.log(`Profile:                  ${PROFILE_NUM} (port ${CDP_PORT})`);
  console.log(`TOTAL_MESSAGE_SEND_COUNT: ${TOTAL_MESSAGE_SEND_COUNT}`);
  console.log(`VEO_SUBMISSION_COUNT:     ${VEO_SUBMISSION_COUNT}`);
  console.log(`Direct API cost:          $0`);
  console.log(`기존 s5_veo_raw.mp4:      보존 (${fs.existsSync(ORIG_MP4) ? "OK" : "확인 필요"})`);

  if (result === "saved" && savedPath) {
    const sz  = fs.statSync(savedPath).size;
    const md5 = fileHash(savedPath);
    console.log(`\nFile: ${savedPath}`);
    console.log(`Size: ${Math.round(sz / 1024)}KB`);
    console.log(`MD5:  ${md5}`);
    console.log("\n=== QA 필수 (오검출 교정 강화) ===");
    console.log("1. ffprobe: 720x1280, fps=24, duration≈10s, h264");
    console.log("2. 2fps 전체 프레임 추출 (20장)");
    console.log("3. 준의 양손 위치 추적 — 모든 프레임에서 종이 미접촉 확인");
    console.log("4. 상사 손 위치 확인 — 오른쪽 가장자리 외부와 연결, 준 신체와 명확히 분리됨");
    console.log("5. 오른쪽 35% crop과 전체 프레임 동시 비교");
    console.log("6. BOSS RULE: 얼굴·머리·목·어깨·전신·실루엣·그림자 부재 확인");
    console.log("7. 상사 손 퇴장 방향: 오른쪽 바깥으로 ✅");
    console.log("8. 애매한 프레임 → 즉시 FAIL");
    console.log("9. 무음 결말 이해: 상사 손 등장+퇴장 → 준 혼자 탈력");
  } else if (result === "refusal") {
    console.log("\n-> Gemini refused. FAIL. 재시도 없음.");
  } else if (result === "quota_mid") {
    console.log("\n-> Quota hit mid. 다른 프로파일 시도 필요.");
  } else {
    console.log(`\n-> ${result}. 탭 확인 필요.`);
  }
}

main().catch(e => { console.error("[FATAL]", e.message); process.exit(1); });
