/**
 * Gemini Veo 공용 Preflight
 *
 * 역할: 실제 Veo 제출 전 모든 준비 단계를 검증한다.
 *   - _gemini-veo-core.mjs의 공용 함수·프롬프트·키워드 사용
 *   - 11단계 fail-fast 검증
 *   - TOTAL_MESSAGE_SEND_COUNT=0, VEO_SUBMISSION_COUNT=0 보장
 *   - 실패 시 스크린샷 + 구조화 JSON 리포트 저장
 *
 * 사용:
 *   node scripts/_gemini-veo-preflight.mjs [--profile 2] [--ref <path>]
 *
 * G4 절대 금지. 메시지·Veo 제출 0회.
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

const QA_DIR = path.join(ROOT, "output/v2/3d_sitcom_prod_v1/upload_002_copier/qa/preflight");
fs.mkdirSync(QA_DIR, { recursive: true });

// ── CLI 파라미터 ────────────────────────────────────────────────────────────────
const profileArg  = process.argv.indexOf("--profile");
const PROFILE_NUM = profileArg >= 0 ? parseInt(process.argv[profileArg + 1]) : 2;

const refArg  = process.argv.indexOf("--ref");
const REF_IMG = refArg >= 0
  ? path.resolve(process.argv[refArg + 1])
  : path.join(ROOT, "output/v2/3d_sitcom_prod_v1/upload_002_copier/keyframes/kf_s5_boss_hand_finale.png");

if (PROFILE_NUM === 4) { console.error("[ABORT] Profile 4 is forbidden."); process.exit(1); }
if (![1, 2, 3].includes(PROFILE_NUM)) { console.error("[ABORT] Profile must be 1, 2, or 3."); process.exit(1); }

const PROFILE_PORT     = { 1: 9223, 2: 9224, 3: 9225 };
const USER_DATA_ROOTS  = {
  1: "C:/Users/PC/AppData/Local/Google/Chrome/User Data/AI-Gemini-1",
  2: "C:/Users/PC/AppData/Local/Google/Chrome/User Data/AI-Gemini-2",
  3: "C:/Users/PC/AppData/Local/Google/Chrome/User Data/AI-Gemini-3",
};
const CDP_PORT   = PROFILE_PORT[PROFILE_NUM];
const USER_DATA  = USER_DATA_ROOTS[PROFILE_NUM];

// ── 전송 카운터 (절대 0 유지) ─────────────────────────────────────────────────
let TOTAL_MESSAGE_SEND_COUNT = 0;
let VEO_SUBMISSION_COUNT = 0;

// ── 결과 추적 ──────────────────────────────────────────────────────────────────
const report = {
  profile: PROFILE_NUM,
  port: CDP_PORT,
  ref_img: REF_IMG,
  prompt_hash: S5_PROMPT_HASH,
  prompt_len: S5_PROMPT.length,
  started_at: new Date().toISOString(),
  total_send: 0,
  veo_submit: 0,
  stages: {},
  result: null,
  error: null,
};

function ts()    { return new Date().toISOString().slice(11, 19); }
function log(m)  { console.log(`[${ts()}][P${PROFILE_NUM}] ${m}`); }
function warn(m) { console.warn(`[WARN][P${PROFILE_NUM}] ${m}`); }

function stageStart(name) {
  report.stages[name] = { start: Date.now(), status: "running" };
  log(`▶ STAGE:${name}`);
}

function stageDone(name, info = "") {
  const s = report.stages[name];
  s.status = "pass";
  s.ms = Date.now() - s.start;
  log(`✅ STAGE:${name} (${s.ms}ms)${info ? " — " + info : ""}`);
}

async function stageFail(name, reason, page = null) {
  const s = report.stages[name] || { start: Date.now() };
  s.status = "fail";
  s.ms = Date.now() - s.start;
  s.reason = reason;
  report.result = "PREFLIGHT_FAIL";
  report.error  = `${name}: ${reason}`;
  log(`❌ STAGE:${name} FAILED (${s.ms}ms) — ${reason}`);
  if (page) {
    try {
      const ssPath = path.join(QA_DIR, `preflight_fail_p${PROFILE_NUM}_${name}.png`);
      await page.screenshot({ path: ssPath, fullPage: false });
      report.screenshot = ssPath;
      log(`Screenshot: ${ssPath}`);
      const bodyText = await page.evaluate(() => (document.body.innerText || "").slice(0, 300)).catch(() => "");
      report.page_text_at_fail = bodyText;
      log(`Page text (300): ${bodyText.slice(0, 150)}`);
    } catch {}
  }
  await saveReport();
  process.exit(1);
}

async function saveReport() {
  report.finished_at = new Date().toISOString();
  report.total_send  = TOTAL_MESSAGE_SEND_COUNT;
  report.veo_submit  = VEO_SUBMISSION_COUNT;
  const outPath = path.join(QA_DIR, `preflight_p${PROFILE_NUM}_result.json`);
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
  log(`Report: ${outPath}`);
}

// ── 메인 preflight ─────────────────────────────────────────────────────────────
async function runPreflight() {
  log(`=== Gemini Veo Preflight (core v2) — Profile ${PROFILE_NUM} (port ${CDP_PORT}) ===`);
  log(`REF:          ${REF_IMG}`);
  log(`PROMPT_HASH:  ${S5_PROMPT_HASH}  (len=${S5_PROMPT.length})`);
  log(`TOTAL_SEND=${TOTAL_MESSAGE_SEND_COUNT}, VEO=${VEO_SUBMISSION_COUNT} (must stay 0)`);

  // ── STAGE 1: Chrome CDP ───────────────────────────────────────────────────
  stageStart("chrome_cdp");
  try {
    await ensureChrome(CDP_PORT, USER_DATA, log);
    stageDone("chrome_cdp");
  } catch (e) {
    await stageFail("chrome_cdp", e.message);
  }

  let browser, page;
  try {
    browser = await chromium.connectOverCDP(`http://localhost:${CDP_PORT}`);
  } catch (e) {
    await stageFail("cdp_connect", e.message);
  }
  const ctx = browser.contexts()[0];
  if (!ctx) await stageFail("cdp_connect", "No browser context found");

  // ── STAGE 2: 로그인 확인 ─────────────────────────────────────────────────
  stageStart("login_check");
  page = await ctx.newPage();
  await page.goto("https://gemini.google.com/app", { waitUntil: "domcontentloaded", timeout: 30000 })
    .catch(e => stageFail("login_check", "goto failed: " + e.message, page));
  await page.waitForTimeout(2000);
  const currentUrl = page.url();
  if (/accounts\.google|signin/i.test(currentUrl)) {
    await stageFail("login_check", `Not logged in — redirected to ${currentUrl}`, page);
  }
  stageDone("login_check", `url=${currentUrl.slice(0, 60)}`);

  // ── STAGE 3: reference 파일 존재·hash 확인 ───────────────────────────────
  stageStart("ref_file");
  if (!fs.existsSync(REF_IMG)) {
    await stageFail("ref_file", `File not found: ${REF_IMG}`, page);
  }
  const refStat = fs.statSync(REF_IMG);
  const refHash = hashFile(REF_IMG);
  const hashMatch = refHash === EXPECTED_REF_HASH;
  report.ref_hash       = refHash;
  report.ref_hash_match = hashMatch;
  stageDone("ref_file", `size=${Math.round(refStat.size/1024)}KB, hash=${refHash}, match=${hashMatch}`);

  // ── STAGE 4: "업로드 및 도구" 버튼 ──────────────────────────────────────
  stageStart("tool_button");
  const toolBtn = page.locator('button[aria-label="업로드 및 도구"]').first();
  await toolBtn.waitFor({ state: "visible", timeout: 10000 })
    .catch(() => stageFail("tool_button", "업로드 및 도구 button not visible after 10s", page));
  stageDone("tool_button");

  // ── STAGE 5: Veo compositor 활성화 ───────────────────────────────────────
  stageStart("veo_activate");
  try {
    await activateVideoTool(page, log, warn);
    stageDone("veo_activate");
  } catch (e) {
    await stageFail("veo_activate", e.message, page);
  }

  // ── STAGE 6: 9:16 세로 모드 ─────────────────────────────────────────────
  stageStart("vertical_mode");
  const vertOk = await setVerticalMode(page, log, warn);
  if (!vertOk) {
    await stageFail("vertical_mode", "9:16 mode not confirmed after selection", page);
  }
  stageDone("vertical_mode");

  // ── STAGE 7: reference 첨부 ──────────────────────────────────────────────
  stageStart("ref_attach");
  let thumbCount;
  try {
    const attachResult = await attachRef(page, REF_IMG, log, warn);
    thumbCount = attachResult.thumbnails;
    report.thumbnails = thumbCount;
    stageDone("ref_attach", `thumbnails=${thumbCount}`);
  } catch (e) {
    await stageFail("ref_attach", e.message, page);
  }

  // ── STAGE 8+9: 프롬프트 입력 + DOM 검증 ─────────────────────────────────
  stageStart("prompt_input");
  let typedLen;
  try {
    const res = await typeAndVerify(page, S5_PROMPT, REQUIRED_KEYWORDS, log);
    typedLen = res.typedLen;
    report.prompt_typed_len = typedLen;
    stageDone("prompt_input", `len=${typedLen}`);
  } catch (e) {
    await stageFail("prompt_input", e.message, page);
  }

  // ── STAGE 10: send enabled 확인 ──────────────────────────────────────────
  stageStart("send_enabled");
  const sendOk = await checkSendEnabled(page);
  if (!sendOk) {
    await stageFail("send_enabled", "Send button not found or disabled", page);
  }
  report.send_enabled = true;
  stageDone("send_enabled");

  // ── STAGE 11: 카운터 최종 확인 ───────────────────────────────────────────
  stageStart("counter_check");
  if (TOTAL_MESSAGE_SEND_COUNT !== 0 || VEO_SUBMISSION_COUNT !== 0) {
    await stageFail("counter_check",
      `Counter non-zero: TOTAL=${TOTAL_MESSAGE_SEND_COUNT}, VEO=${VEO_SUBMISSION_COUNT}`, page);
  }
  stageDone("counter_check", `TOTAL=${TOTAL_MESSAGE_SEND_COUNT}, VEO=${VEO_SUBMISSION_COUNT}`);

  // ── 최종 스크린샷 ────────────────────────────────────────────────────────
  const ssPath = path.join(QA_DIR, `preflight_p${PROFILE_NUM}_pass.png`);
  await page.screenshot({ path: ssPath, fullPage: false });
  report.screenshot = ssPath;
  log(`Screenshot: ${ssPath}`);

  await page.close();
  await browser.close();

  report.result = "PREFLIGHT_PASS";
  await saveReport();

  console.log("\n=== PREFLIGHT RESULT ===");
  console.log(`Result:               PREFLIGHT_PASS ✅`);
  console.log(`Profile:              ${PROFILE_NUM} (port ${CDP_PORT})`);
  console.log(`TOTAL_SEND:           ${TOTAL_MESSAGE_SEND_COUNT}`);
  console.log(`VEO_SUBMIT:           ${VEO_SUBMISSION_COUNT}`);
  console.log(`Prompt hash:          ${S5_PROMPT_HASH}`);
  console.log(`Ref hash:             ${report.ref_hash} (match=${report.ref_hash_match})`);
  console.log(`Thumbnails:           ${report.thumbnails}`);
  console.log(`Prompt typed len:     ${report.prompt_typed_len}`);
  console.log(`Keywords:             ${REQUIRED_KEYWORDS.length}/${REQUIRED_KEYWORDS.length}`);
  console.log(`Send enabled:         ${report.send_enabled}`);
  console.log(`Screenshot:           ${ssPath}`);
  console.log(`\nReady for: ALLOW_VEO=true node scripts/_upload002-s5-final.mjs --profile ${PROFILE_NUM}`);
}

runPreflight().catch(e => {
  console.error("[FATAL]", e.message);
  report.result = "FATAL";
  report.error  = e.message;
  saveReport().catch(() => {});
  process.exit(1);
});
