/**
 * ChatGPT 이미지 생성 공용 Preflight
 *
 * 역할: 실제 이미지 생성 전 모든 준비 단계를 검증한다.
 *   - _chatgpt-image-core.mjs 공용 함수 사용
 *   - 10단계 fail-fast 검증
 *   - TOTAL_MESSAGE_SEND_COUNT=0, IMAGE_SUBMISSION_COUNT=0 보장
 *   - 실패 시 스크린샷 + 구조화 JSON 리포트 저장
 *
 * 사용:
 *   node scripts/_chatgpt-image-preflight.mjs [--ref <path>] [--prompt-file <path>]
 *
 * 메시지 전송·이미지 생성 0회.
 */

import { chromium } from "playwright";
import path         from "path";
import fs           from "fs";
import { fileURLToPath } from "url";

import {
  CDP_PORT_GPT1, CHROME_EXE, USER_DATA_GPT1,
  hashFile, hashText,
  isCDPOpen, ensureChrome, checkLogin, detectStop,
  activateImageTool, attachRef, typePrompt, checkSendEnabled,
  saveFailReport,
} from "./_chatgpt-image-core.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT      = path.resolve(__dirname, "..");

const QA_DIR = path.join(ROOT, "output/v2/3d_sitcom_prod_v1/upload_002_copier/qa/chatgpt_preflight");
fs.mkdirSync(QA_DIR, { recursive: true });

// ── CLI 파라미터 ────────────────────────────────────────────────────────────────
const refArg  = process.argv.indexOf("--ref");
const REF_IMG = refArg >= 0
  ? path.resolve(process.argv[refArg + 1])
  : path.join(ROOT, "output/v2/3d_sitcom_prod_v1/upload_002_copier/keyframes/kf_s3_tapping_relief_v2.png");

const promptFileArg = process.argv.indexOf("--prompt-file");
const PROMPT_TEXT   = promptFileArg >= 0
  ? fs.readFileSync(path.resolve(process.argv[promptFileArg + 1]), "utf8").trim()
  : `Draw a new scene in the same copy room shown in the attached image. Environment and copier must exactly match the attached image. Character must exactly match: Jun with round face, large brown eyes, black side-part hair, light-blue rolled-sleeve shirt, loose red tie, long navy slacks, black dress shoes, brown crossbody messenger bag. New scene: large pile of printed paper fills the output tray and spills onto the floor. Jun presses the stop button repeatedly. His posture is tense and tired. His expression is exhausted and flustered. Medium-wide shot. Cute comedic semi-deformed 3D animated style. Vertical 9:16 format. Do not change the copier, room, or Jun's costume. STRICT BANS: white shirt, paper flying or falling through the air, paper exploding outward.`;

// ── 전송 카운터 (절대 0 유지) ─────────────────────────────────────────────────
let TOTAL_MESSAGE_SEND_COUNT = 0;
let IMAGE_SUBMISSION_COUNT   = 0;

// ── 결과 추적 ──────────────────────────────────────────────────────────────────
const report = {
  port: CDP_PORT_GPT1,
  ref_img: REF_IMG,
  prompt_hash: hashText(PROMPT_TEXT),
  prompt_len: PROMPT_TEXT.length,
  started_at: new Date().toISOString(),
  total_send: 0,
  image_submit: 0,
  stages: {},
  result: null,
};

function ts()    { return new Date().toISOString().slice(11, 19); }
function log(m)  { console.log(`[${ts()}][GPT-1] ${m}`); }
function warn(m) { console.warn(`[WARN][GPT-1] ${m}`); }

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
  s.ms     = Date.now() - s.start;
  s.reason = reason;
  log(`❌ STAGE:${name} FAILED (${s.ms}ms) — ${reason}`);
  report.total_send  = TOTAL_MESSAGE_SEND_COUNT;
  report.image_submit = IMAGE_SUBMISSION_COUNT;
  const { ssPath, jsonPath } = await saveFailReport(QA_DIR, name, reason, page, report);
  log(`Screenshot: ${ssPath}`);
  log(`Report: ${jsonPath}`);
  process.exit(1);
}

async function saveReport() {
  report.finished_at  = new Date().toISOString();
  report.total_send   = TOTAL_MESSAGE_SEND_COUNT;
  report.image_submit = IMAGE_SUBMISSION_COUNT;
  const outPath = path.join(QA_DIR, "preflight_result.json");
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
  log(`Report: ${outPath}`);
}

// ── 메인 preflight ─────────────────────────────────────────────────────────────
async function runPreflight() {
  log(`=== ChatGPT Image Preflight (core v1) — GPT-1 (port ${CDP_PORT_GPT1}) ===`);
  log(`REF:          ${REF_IMG}`);
  log(`PROMPT_HASH:  ${report.prompt_hash}  (len=${PROMPT_TEXT.length})`);
  log(`TOTAL_SEND=${TOTAL_MESSAGE_SEND_COUNT}, IMAGE=${IMAGE_SUBMISSION_COUNT} (must stay 0)`);

  // ── STAGE 1: Chrome CDP ───────────────────────────────────────────────────
  stageStart("chrome_cdp");
  try {
    await ensureChrome(CDP_PORT_GPT1, USER_DATA_GPT1, log);
    stageDone("chrome_cdp");
  } catch (e) {
    await stageFail("chrome_cdp", e.message);
  }

  let browser, page;
  try {
    const { chromium: cr } = await import("playwright");
    browser = await cr.connectOverCDP(`http://localhost:${CDP_PORT_GPT1}`);
  } catch (e) {
    await stageFail("cdp_connect", e.message);
  }
  const ctx = browser.contexts()[0];
  if (!ctx) await stageFail("cdp_connect", "No browser context found");

  // ── STAGE 2: 로그인 확인 ─────────────────────────────────────────────────
  stageStart("login_check");
  page = await ctx.newPage();
  try {
    await checkLogin(page, log);
    stageDone("login_check", `url=${page.url().slice(0, 60)}`);
  } catch (e) {
    await stageFail("login_check", e.message, page);
  }

  // ── STAGE 3: 중단 조건 선제 감지 ─────────────────────────────────────────
  stageStart("stop_check");
  try {
    await detectStop(page);
    stageDone("stop_check");
  } catch (e) {
    await stageFail("stop_check", e.message, page);
  }

  // ── STAGE 4: reference 파일 존재·hash 확인 ───────────────────────────────
  stageStart("ref_file");
  if (!fs.existsSync(REF_IMG)) {
    await stageFail("ref_file", `File not found: ${REF_IMG}`, page);
  }
  const refStat = fs.statSync(REF_IMG);
  const refHash = hashFile(REF_IMG);
  report.ref_hash = refHash;
  stageDone("ref_file", `size=${Math.round(refStat.size/1024)}KB, hash=${refHash}`);

  // ── STAGE 5: reference 첨부 + baseline 수집 ──────────────────────────────
  stageStart("ref_attach");
  let baselineCids, baselineSrcs, thumbnails;
  try {
    const res = await attachRef(page, REF_IMG, log);
    thumbnails   = res.thumbnails;
    baselineCids = res.baselineCids;
    baselineSrcs = res.baselineSrcs;
    report.thumbnails   = thumbnails;
    report.baseline_cid_count = baselineCids.size;
    stageDone("ref_attach", `thumbnails=${thumbnails}, baseline_cids=${baselineCids.size}`);
  } catch (e) {
    await stageFail("ref_attach", e.message, page);
  }

  // ── STAGE 6: 이미지 생성 도구 활성화 (fail-fast) ─────────────────────────
  stageStart("image_tool");
  try {
    await activateImageTool(page, log, warn);
    stageDone("image_tool");
  } catch (e) {
    await stageFail("image_tool", e.message, page);
  }

  // ── STAGE 7: composer 탐색 (prompt-textarea 가시성) ──────────────────────
  stageStart("composer");
  const ta = page.locator("#prompt-textarea").first();
  const taVisible = await ta.isVisible({ timeout: 8000 }).catch(() => false);
  if (!taVisible) {
    await stageFail("composer", "#prompt-textarea not visible after image tool activation", page);
  }
  stageDone("composer");

  // ── STAGE 8: 프롬프트 입력 + DOM 확인 ────────────────────────────────────
  stageStart("prompt_input");
  let typedLen;
  try {
    const res = await typePrompt(page, PROMPT_TEXT, log);
    typedLen = res.typedLen;
    report.prompt_typed_len = typedLen;
    stageDone("prompt_input", `len=${typedLen}`);
  } catch (e) {
    await stageFail("prompt_input", e.message, page);
  }

  // ── STAGE 9: send enabled 확인 ───────────────────────────────────────────
  stageStart("send_enabled");
  const sendOk = await checkSendEnabled(page);
  if (!sendOk) {
    await stageFail("send_enabled", "Send button not found or disabled", page);
  }
  report.send_enabled = true;
  stageDone("send_enabled");

  // ── STAGE 10: 카운터 최종 확인 ───────────────────────────────────────────
  stageStart("counter_check");
  if (TOTAL_MESSAGE_SEND_COUNT !== 0 || IMAGE_SUBMISSION_COUNT !== 0) {
    await stageFail("counter_check",
      `Counter non-zero: TOTAL=${TOTAL_MESSAGE_SEND_COUNT}, IMAGE=${IMAGE_SUBMISSION_COUNT}`, page);
  }
  stageDone("counter_check", `TOTAL=${TOTAL_MESSAGE_SEND_COUNT}, IMAGE=${IMAGE_SUBMISSION_COUNT}`);

  // ── 최종 스크린샷 ────────────────────────────────────────────────────────
  const ssPath = path.join(QA_DIR, "preflight_pass.png");
  await page.screenshot({ path: ssPath, fullPage: false });
  report.screenshot = ssPath;
  log(`Screenshot: ${ssPath}`);

  await page.close();
  await browser.close();

  report.result = "PREFLIGHT_PASS";
  await saveReport();

  console.log("\n=== CHATGPT IMAGE PREFLIGHT RESULT ===");
  console.log(`Result:                PREFLIGHT_PASS ✅`);
  console.log(`Port:                  ${CDP_PORT_GPT1}`);
  console.log(`TOTAL_SEND:            ${TOTAL_MESSAGE_SEND_COUNT}`);
  console.log(`IMAGE_SUBMIT:          ${IMAGE_SUBMISSION_COUNT}`);
  console.log(`Prompt hash:           ${report.prompt_hash}`);
  console.log(`Ref hash:              ${report.ref_hash}`);
  console.log(`Thumbnails:            ${report.thumbnails}`);
  console.log(`Baseline CIDs:         ${report.baseline_cid_count}`);
  console.log(`Prompt typed len:      ${report.prompt_typed_len}`);
  console.log(`Send enabled:          ${report.send_enabled}`);
  console.log(`Screenshot:            ${ssPath}`);
  console.log(`\nReady for actual image generation (Owner approval required).`);
}

runPreflight().catch(e => {
  console.error("[FATAL]", e.message);
  report.result = "FATAL";
  report.error  = e.message;
  saveReport().catch(() => {});
  process.exit(1);
});
