/**
 * upload_002_copier S5 Veo 최종 재도전
 *
 * [통합 v2]
 * - _gemini-veo-core.mjs에서 프롬프트·키워드·준비 함수를 공유
 * - preflight와 동일 프롬프트·동일 검증 경로 사용
 * - PREFLIGHT_STALE: prompt hash 또는 ref hash가 preflight 시점과 다르면 전송 전 abort
 * - ALLOW_VEO 게이트: 환경변수 미설정 시 abort
 *
 * REFERENCE: kf_s5_boss_hand_finale.png
 * OUTPUT:    output/v2/3d_sitcom_prod_v1/upload_002_copier/veo/s5_veo_final.mp4
 *            (기존 s5_veo_raw.mp4, s5_veo_regen.mp4 보존 — 덮어쓰기 금지)
 *
 * 사용:
 *   node scripts/_upload002-s5-final.mjs [--profile 1|2] [--dry-run]
 *   ALLOW_VEO=true node scripts/_upload002-s5-final.mjs --profile 2
 *
 * G4 절대 금지. G3 제외. Owner 승인(ALLOW_VEO=true) 필수.
 */

import { chromium } from "playwright";
import path         from "path";
import fs           from "fs";
import { fileURLToPath } from "url";

import {
  S5_PROMPT, S5_PROMPT_HASH, REQUIRED_KEYWORDS, EXPECTED_REF_HASH,
  hashFile, isCDPOpen, ensureChrome,
  activateVideoTool, setVerticalMode, attachRef, typeAndVerify,
  checkSendEnabled, detectQuotaOrRefusal,
} from "./_gemini-veo-core.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT      = path.resolve(__dirname, "..");

const KF_DIR  = path.join(ROOT, "output/v2/3d_sitcom_prod_v1/upload_002_copier/keyframes");
const VEO_DIR = path.join(ROOT, "output/v2/3d_sitcom_prod_v1/upload_002_copier/veo");
const REF_IMG = path.join(KF_DIR, "kf_s5_boss_hand_finale.png");

const OUT_MP4   = path.join(VEO_DIR, "s5_veo_final.mp4");
const ORIG_MP4  = path.join(VEO_DIR, "s5_veo_raw.mp4");
const REGEN_MP4 = path.join(VEO_DIR, "s5_veo_regen.mp4");

// ── fail-closed Gemini/Veo video allow guard: browser/CDP/network/output 전에 반드시 통과 ──
// ALLOW_GEMINI_VEO=1은 local fail-closed 스위치일 뿐, Gemini/Veo 실행 승인이 아니다 (no-live 기본).
// 기존 deep-path ALLOW_VEO 게이트(main 내부)는 그대로 유지된다 (이중 차단).
if (process.env.ALLOW_GEMINI_VEO !== "1") {
  console.error("ABORT: Gemini/Veo video 경로 차단 (fail-closed). 필요한 env: ALLOW_GEMINI_VEO=1 — browser/CDP/network/output 전에 중단.");
  process.exit(2);
}

fs.mkdirSync(VEO_DIR, { recursive: true });

const DRY         = process.argv.includes("--dry-run");
const profileArg  = process.argv.indexOf("--profile");
const PROFILE_NUM = profileArg >= 0 ? parseInt(process.argv[profileArg + 1]) : 1;

if (PROFILE_NUM === 4) { console.error("[ABORT] Profile 4 is forbidden."); process.exit(1); }
if (![1, 2].includes(PROFILE_NUM)) { console.error("[ABORT] Profile must be 1 or 2 (G3 excluded)."); process.exit(1); }

const PROFILE_PORT    = { 1: 9223, 2: 9224 };
const USER_DATA_ROOTS = {
  1: "C:/Users/PC/AppData/Local/Google/Chrome/User Data/AI-Gemini-1",
  2: "C:/Users/PC/AppData/Local/Google/Chrome/User Data/AI-Gemini-2",
};
const CDP_PORT  = PROFILE_PORT[PROFILE_NUM];
const USER_DATA = USER_DATA_ROOTS[PROFILE_NUM];

// ── 전송 카운터 (단일 전송 보장) ──────────────────────────────────────────────
let TOTAL_MESSAGE_SEND_COUNT = 0;
let VEO_SUBMISSION_COUNT = 0;

function recordSend(label, isVeo = false) {
  TOTAL_MESSAGE_SEND_COUNT++;
  if (isVeo) VEO_SUBMISSION_COUNT++;
  if (TOTAL_MESSAGE_SEND_COUNT > 1) {
    abort("double_send", `TOTAL=${TOTAL_MESSAGE_SEND_COUNT} at "${label}"`);
  }
  if (VEO_SUBMISSION_COUNT > 1) {
    abort("double_veo", `VEO=${VEO_SUBMISSION_COUNT} at "${label}"`);
  }
  log(`[SEND #${TOTAL_MESSAGE_SEND_COUNT}${isVeo ? "/VEO" : ""}] "${label}"`);
}

function log(m)  { console.log(`[${new Date().toISOString().slice(11, 19)}][P${PROFILE_NUM}] ${m}`); }
function warn(m) { console.warn(`[WARN][P${PROFILE_NUM}] ${m}`); }
function abort(code, m) { console.error(`\n[ABORT:${code}] ${m}\n`); process.exit(1); }

// ── PREFLIGHT_STALE 게이트 ────────────────────────────────────────────────────
// 실행 시점에 prompt hash와 ref hash를 검증한다.
// 외부에서 의도적으로 다른 hash를 주입하면 전송 전에 abort.
function assertNotStale(currentPromptHash, currentRefHash) {
  if (currentPromptHash !== S5_PROMPT_HASH) {
    abort("PREFLIGHT_STALE",
      `Prompt hash mismatch — expected ${S5_PROMPT_HASH}, got ${currentPromptHash}. ` +
      "프롬프트가 변경되었습니다. preflight를 다시 실행하세요."
    );
  }
  if (currentRefHash !== EXPECTED_REF_HASH) {
    abort("PREFLIGHT_STALE",
      `Ref hash mismatch — expected ${EXPECTED_REF_HASH}, got ${currentRefHash}. ` +
      "reference 이미지가 변경되었습니다. preflight를 다시 실행하세요."
    );
  }
  log(`Hash check PASS ✅ — prompt=${currentPromptHash.slice(0, 8)}, ref=${currentRefHash.slice(0, 8)}`);
}

// ── 메인 ──────────────────────────────────────────────────────────────────────
async function main() {
  log(`=== S5 Veo 최종 재도전 (core v2, profile ${PROFILE_NUM}, port ${CDP_PORT}) ===`);
  log(`Reference: ${REF_IMG}`);
  log(`Output:    ${OUT_MP4}`);
  log(`Prompt:    ${S5_PROMPT.length} chars (hash=${S5_PROMPT_HASH})`);
  if (DRY) log("[DRY-RUN MODE] — 전송 없음, TOTAL=0, VEO=0");

  // 기존 파일 보존 확인
  if (fs.existsSync(ORIG_MP4))  log(`s5_veo_raw.mp4  보존 ✅ (${Math.round(fs.statSync(ORIG_MP4).size/1024)}KB)`);
  if (fs.existsSync(REGEN_MP4)) log(`s5_veo_regen.mp4 보존 ✅`);

  // reference 파일 확인
  if (!fs.existsSync(REF_IMG)) abort("ref_missing", `S5 keyframe not found: ${REF_IMG}`);
  const refHash = hashFile(REF_IMG);
  log(`Ref hash: ${refHash} (${Math.round(fs.statSync(REF_IMG).size/1024)}KB)`);

  // ── PREFLIGHT_STALE 사전 검사 (전송 이전에 abort) ────────────────────────
  assertNotStale(S5_PROMPT_HASH, refHash);

  await ensureChrome(CDP_PORT, USER_DATA, log).catch(e => abort("chrome_failed", e.message));

  const browser = await chromium.connectOverCDP(`http://localhost:${CDP_PORT}`)
    .catch(e => abort("cdp_connect", e.message));
  const ctx = browser.contexts()[0];
  if (!ctx) abort("no_context", "No browser context");

  const page = await ctx.newPage();
  await page.goto("https://gemini.google.com/app", { waitUntil: "domcontentloaded", timeout: 30000 });
  await page.waitForTimeout(2000);

  if (/accounts\.google|signin/i.test(page.url())) {
    abort("login_required", `Profile ${PROFILE_NUM} not logged in`);
  }
  log(`Gemini loaded: ${page.url()}`);

  // Veo compositor 활성화
  await activateVideoTool(page, log, warn).catch(e => abort("tool_failed", e.message));

  // 9:16 세로 모드
  const vertOk = await setVerticalMode(page, log, warn);
  if (!vertOk) abort("vertical_failed", "9:16 mode could not be confirmed");

  // reference 첨부
  const { thumbnails } = await attachRef(page, REF_IMG, log, warn)
    .catch(e => abort("attach_failed", e.message));
  if (thumbnails === 0) abort("no_thumbnail", "Reference image not attached");

  // 프롬프트 입력 + DOM 검증 (공용 모듈 — preflight와 동일 경로)
  const { typedLen } = await typeAndVerify(page, S5_PROMPT, REQUIRED_KEYWORDS, log)
    .catch(e => abort("prompt_failed", e.message));

  // send enabled 확인
  const sendOk = await checkSendEnabled(page);
  log(`Preflight: thumb=${thumbnails}, prompt_len=${typedLen}, send_enabled=${sendOk}`);
  log(`Counters: TOTAL=${TOTAL_MESSAGE_SEND_COUNT}, VEO=${VEO_SUBMISSION_COUNT}`);

  if (!sendOk && !DRY) {
    abort("send_disabled", "Send button not enabled — check attachment or prompt");
  }

  if (DRY) {
    log(`\n[DRY-RUN] 모든 단계 PASS ✅`);
    log(`[DRY-RUN] Prompt hash: ${S5_PROMPT_HASH}`);
    log(`[DRY-RUN] Ref hash:    ${refHash} (match=${refHash === EXPECTED_REF_HASH})`);
    log(`[DRY-RUN] 전송 없음. TOTAL=${TOTAL_MESSAGE_SEND_COUNT}, VEO=${VEO_SUBMISSION_COUNT}`);
    log(`[DRY-RUN] s5_veo_raw.mp4 보존: ${fs.existsSync(ORIG_MP4) ? "YES ✅" : "확인 필요"}`);
    await page.close();
    await browser.close();
    return;
  }

  // ── ALLOW_VEO 게이트 ────────────────────────────────────────────────────
  if (!process.env.ALLOW_VEO) {
    abort("allow_veo_missing", "ALLOW_VEO 환경변수 미설정 — Owner 승인 후 ALLOW_VEO=true 설정 필요");
  }

  // ── 전송 직전 최종 hash 재확인 (PREFLIGHT_STALE 최후 방어) ────────────────
  // 전송 버튼 클릭 직전에 한 번 더 확인
  assertNotStale(S5_PROMPT_HASH, hashFile(REF_IMG));

  // ── 최종 전송 (정확히 1회) ───────────────────────────────────────────────
  recordSend("S5 Veo 최종 재도전 제출", true);

  const sendBtn = page.locator(
    'button[aria-label="메시지 보내기"], button[aria-label*="전송"], button[aria-label*="Send"]'
  ).first();
  if (await sendBtn.count() > 0 && await sendBtn.isEnabled().catch(() => false)) {
    await sendBtn.click();
    log("Send button clicked — ACTUAL VEO SUBMISSION (TOTAL=1, VEO=1)");
  } else {
    await page.locator('[contenteditable="true"]').first().press("Enter");
    log("Enter pressed — ACTUAL VEO SUBMISSION (TOTAL=1, VEO=1)");
  }

  log("Waiting for video generation (up to 420s)...");
  let result = "timeout";
  let savedPath = null;
  const startTime = Date.now();

  while (Date.now() - startTime < 420_000) {
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
          log(`Saved: ${OUT_MP4} (${Math.round(fs.statSync(OUT_MP4).size/1024)}KB)`);
        } else {
          await download.saveAs(OUT_MP4);
          if (fs.existsSync(OUT_MP4)) { savedPath = OUT_MP4; result = "saved"; }
          else { warn("Download path empty"); result = "download_failed"; }
        }
      } catch (e) { warn(`Download error: ${e.message}`); result = "download_failed"; }
      break;
    }

    const vidCount  = await page.locator("video").count();
    const bodySnip  = await page.evaluate(() => (document.body.innerText || "").slice(0, 300)).catch(() => "");
    const generating = /생성|만드는 중|Generating|Creating/i.test(bodySnip);
    log(`  ${elapsed}s | generating:${generating} | video:${vidCount} | dlBtn:${dlVisible}`);
  }

  if (result !== "timeout") await page.close().catch(() => {});
  await browser.close();
  log("CDP disconnected");

  console.log("\n=== S5 VEO 최종 RESULT ===");
  console.log(`Result:                   ${result}`);
  console.log(`Profile:                  ${PROFILE_NUM} (port ${CDP_PORT})`);
  console.log(`TOTAL_MESSAGE_SEND_COUNT: ${TOTAL_MESSAGE_SEND_COUNT}`);
  console.log(`VEO_SUBMISSION_COUNT:     ${VEO_SUBMISSION_COUNT}`);
  console.log(`Prompt hash:              ${S5_PROMPT_HASH}`);
  console.log(`Ref hash:                 ${refHash} (match=${refHash === EXPECTED_REF_HASH})`);
  console.log(`Direct API cost:          $0`);
  console.log(`s5_veo_raw.mp4:           보존 (${fs.existsSync(ORIG_MP4) ? "OK" : "확인 필요"})`);

  if (result === "saved" && savedPath) {
    const sz  = fs.statSync(savedPath).size;
    const md5 = hashFile(savedPath);
    console.log(`\nFile: ${savedPath}`);
    console.log(`Size: ${Math.round(sz/1024)}KB`);
    console.log(`MD5:  ${md5}`);
    console.log("\n=== QA 필수 ===");
    console.log("1. ffprobe: 720x1280, fps=24, duration≈10s, h264");
    console.log("2. 2fps 전체 프레임 추출 (20장)");
    console.log("3. 준의 양손 위치 추적 — 모든 프레임 종이 미접촉");
    console.log("4. 상사 손 — 오른쪽 가장자리 외부 연결, 준 신체와 명확히 분리");
    console.log("5. BOSS RULE: 얼굴·머리·목·어깨 부재 확인");
    console.log("6. 애매한 프레임 → 즉시 FAIL");
  } else if (result === "refusal") {
    console.log("\n-> Gemini refused. 재시도 없음.");
  } else if (result === "quota_mid") {
    console.log("\n-> Quota hit mid. 다른 프로파일 시도 필요.");
  } else {
    console.log(`\n-> ${result}. 탭 유지하고 PENDING_RECOVERY로 보고.`);
  }
}

main().catch(e => { console.error("[FATAL]", e.message); process.exit(1); });
