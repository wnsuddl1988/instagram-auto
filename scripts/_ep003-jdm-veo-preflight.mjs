/**
 * ep003 자동문 면접 — Veo Preflight
 *
 * 역할: S1~S4 Veo 생성 전 11단계 검증.
 *   - 실제 전송 0회 보장 (TOTAL_MESSAGE_SEND_COUNT=0, VEO_SUBMISSION_COUNT=0)
 *   - S3 Boss Rule 키워드 독립 게이트 포함
 *   - ref 파일 존재·크기·hash 4씬 전부 확인
 *   - PREFLIGHT_STALE: 이전 결과가 24h 이내면 재실행 안내
 *
 * 사용:
 *   node scripts/_ep003-jdm-veo-preflight.mjs [--profile 1|2|3] [--scene S1|S2|S3|S4]
 *   --scene 생략 시 S1 기준으로 preflight (ref/prompt 검사는 4씬 전부)
 *
 * G4 절대 금지. 전송 0회.
 */

import { chromium }        from "playwright";
import path                from "path";
import fs                  from "fs";
import crypto              from "crypto";
import { fileURLToPath }   from "url";

import {
  hashFile, isCDPOpen, ensureChrome,
  activateVideoTool, setVerticalMode, attachRef, typeAndVerify,
  checkSendEnabled, detectQuotaOrRefusal,
} from "./_gemini-veo-core.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT      = path.resolve(__dirname, "..");

// ── 출력 디렉토리 ────────────────────────────────────────────────────────────────
const QA_DIR = path.join(ROOT, "output/v2/ep003_jdm/qa/preflight_veo");
fs.mkdirSync(QA_DIR, { recursive: true });

// ── CLI 파라미터 ─────────────────────────────────────────────────────────────────
const profileArg  = process.argv.indexOf("--profile");
const PROFILE_NUM = profileArg >= 0 ? parseInt(process.argv[profileArg + 1]) : 1;

const sceneArg    = process.argv.indexOf("--scene");
const SCENE_ID    = sceneArg >= 0 ? process.argv[sceneArg + 1].toUpperCase() : "S1";

if (PROFILE_NUM === 4) { console.error("[ABORT] Profile 4 is forbidden."); process.exit(1); }
if (![1, 2, 3].includes(PROFILE_NUM)) { console.error("[ABORT] Profile must be 1, 2, or 3."); process.exit(1); }
if (!["S1","S2","S3","S4"].includes(SCENE_ID)) { console.error("[ABORT] --scene must be S1/S2/S3/S4."); process.exit(1); }

const PROFILE_PORT    = { 1: 9223, 2: 9224, 3: 9225 };
const USER_DATA_ROOTS = {
  1: "C:/Users/PC/AppData/Local/Google/Chrome/User Data/AI-Gemini-1",
  2: "C:/Users/PC/AppData/Local/Google/Chrome/User Data/AI-Gemini-2",
  3: "C:/Users/PC/AppData/Local/Google/Chrome/User Data/AI-Gemini-3",
};
const CDP_PORT  = PROFILE_PORT[PROFILE_NUM];
const USER_DATA = USER_DATA_ROOTS[PROFILE_NUM];

// ── 전송 카운터 (절대 0 유지) ────────────────────────────────────────────────────
let TOTAL_MESSAGE_SEND_COUNT = 0;
let VEO_SUBMISSION_COUNT     = 0;

// ── 씬별 ref 파일 ────────────────────────────────────────────────────────────────
const REF_FILES = {
  S1: path.join(ROOT, "output/v2/ep003_jdm/keyframes/s1_kf_try1.png"),
  S2: path.join(ROOT, "output/v2/ep003_jdm/keyframes/s2_kf_qa_pass.png"),
  S3: path.join(ROOT, "output/v2/ep003_jdm/keyframes/s3_bossfree_kf_try6.png"),
  S4: path.join(ROOT, "output/v2/ep003_jdm/keyframes/s4_kf_qa_pass.png"),
};

// ── 씬별 Veo 프롬프트 ────────────────────────────────────────────────────────────
const PROMPTS = {
  S1: `Animate this 3D semi-deformed Pixar-style scene. The character Jun is standing in a modern office corridor facing a glass meeting room door. He waves his right hand in front of the door once, then again, expecting it to open automatically. The door does not open. His expression shifts from confident expectation to mild puzzlement. He then takes a slow step closer toward the door, still not touching the handle. Camera: fixed, slight natural push-in only. Duration: 8 seconds. STRICT BANS: door opening, Jun touching the handle, any sensor or electronic panel, any other character, white shirt, cut or jump in scene, camera panning away.`,

  S2: `Animate this 3D semi-deformed Pixar-style scene. Jun is pressing his palm against a glass office door, searching for a motion sensor. He slowly moves his hand left and right across the glass, then leans back to look at the top of the door frame, then steps closer again and runs his palm across the wall beside the door. His expression escalates from focused to embarrassed. The door remains closed throughout. The door handle is visible but Jun never looks at or touches it. Camera: fixed. Duration: 8 seconds. STRICT BANS: door opening, Jun touching or gripping the handle, Jun looking at the handle with recognition, any other character appearing, white shirt, internal cuts or scene jumps.`,

  S3: `Animate this 3D semi-deformed Pixar-style scene. The glass meeting room door is already slightly open — an empty doorway gap of about 15 to 25 cm. The door drifts open a few centimetres more on its own; the interior beyond the gap is empty and dim. Jun remains outside in the corridor, completely still. He stares at the moving door with wide eyes, then blinks once, and his expression shifts from shock to embarrassed resignation. Jun does not step forward. Jun's hands stay at his sides throughout and never touch the door, handle, or glass. The same long vertical pull handle and black door frame remain visible. The door must not fully open. Camera: completely fixed, do NOT move toward the interior. Duration: 6 seconds. No new person appears at any point. BANS: Jun entering the doorway, Jun touching the handle or glass, door fully opening, door closing again, any additional character, white shirt, internal cuts.`,

  S4: `Animate this 3D semi-deformed Pixar-style scene. Jun is standing alone in front of the now-open glass meeting room door. He slowly exhales, shoulders dropping slightly. He then gently raises his head to look forward with a resigned, slightly embarrassed expression — the look of someone accepting defeat gracefully. He holds this stable pose for the final 2 seconds, ready to deliver a closing line. No other characters appear. Camera: fixed. Duration: 3.5 seconds. STRICT BANS: door closing, any other character or body part appearing, Jun looking angry or laughing, white shirt, internal cuts.`,
};

// ── S3 Empty-Doorway 게이트 키워드 (prompt 내 존재 확인) ────────────────────────
const S3_GATE_KEYWORDS = [
  { key: "empty doorway gap",                          label: "빈 문틈" },
  { key: "Jun remains outside",                        label: "Jun 복도 밖 유지" },
  { key: "same long vertical pull handle",             label: "세로 PULL 손잡이 유지" },
  { key: "door must not fully open",                   label: "문 완전 개방 금지" },
  { key: "No new person appears",                      label: "신규 인물 없음" },
  { key: "completely fixed",                           label: "카메라 완전 고정" },
];

// ── 씬별 공통 필수 키워드 (prompt 내 존재 확인) ─────────────────────────────────
const COMMON_REQUIRED = {
  S1: [
    { key: "door does not open",      label: "문 불반응" },
    { key: "white shirt",             label: "white shirt BANS" },
    { key: "fixed",                   label: "카메라 고정" },
  ],
  S2: [
    { key: "door remains closed",     label: "문 닫힘 유지" },
    { key: "white shirt",             label: "white shirt BANS" },
    { key: "fixed",                   label: "카메라 고정" },
  ],
  S3: [
    { key: "empty doorway gap",              label: "빈 문틈" },
    { key: "Jun remains outside",            label: "Jun 복도 밖" },
    { key: "same long vertical pull handle", label: "세로 PULL 손잡이" },
    { key: "door must not fully open",       label: "문 완전 개방 금지" },
    { key: "No new person appears",          label: "신규 인물 없음" },
    { key: "completely fixed",               label: "카메라 완전 고정" },
    { key: "white shirt",                    label: "white shirt BANS" },
  ],
  S4: [
    { key: "stable pose",             label: "마지막 정지 자세" },
    { key: "white shirt",             label: "white shirt BANS" },
    { key: "fixed",                   label: "카메라 고정" },
  ],
};

// ── PREFLIGHT_STALE 게이트 (24h) ─────────────────────────────────────────────────
const FORCE      = process.argv.includes("--force");
const STALE_HOURS = 24;
const prevReport  = path.join(QA_DIR, `preflight_p${PROFILE_NUM}_${SCENE_ID}_result.json`);
if (!FORCE && fs.existsSync(prevReport)) {
  const prev = JSON.parse(fs.readFileSync(prevReport, "utf-8"));
  if (prev.result === "PREFLIGHT_PASS" && prev.finished_at) {
    const ageMs = Date.now() - new Date(prev.finished_at).getTime();
    if (ageMs < STALE_HOURS * 3600 * 1000) {
      console.log(`[PREFLIGHT_STALE] 이전 PASS 결과가 ${Math.round(ageMs/60000)}분 전으로, ${STALE_HOURS}h 이내.`);
      console.log(`재실행하려면 ${prevReport} 를 삭제하거나 --force 플래그를 사용하세요.`);
      process.exit(0);
    }
  }
}

// ── 결과 추적 ────────────────────────────────────────────────────────────────────
const report = {
  episode:          "ep003_자동문면접",
  profile:          PROFILE_NUM,
  port:             CDP_PORT,
  scene_preflight:  SCENE_ID,
  ref_checks:       {},
  prompt_checks:    {},
  s3_boss_rule:     {},
  started_at:       new Date().toISOString(),
  total_send:       0,
  veo_submit:       0,
  stages:           {},
  result:           null,
  error:            null,
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
  report.stages[name] = s;
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
    } catch {}
  }
  await saveReport();
  process.exit(1);
}

async function saveReport() {
  report.finished_at = new Date().toISOString();
  report.total_send  = TOTAL_MESSAGE_SEND_COUNT;
  report.veo_submit  = VEO_SUBMISSION_COUNT;
  const outPath = path.join(QA_DIR, `preflight_p${PROFILE_NUM}_${SCENE_ID}_result.json`);
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));
  log(`Report: ${outPath}`);
}

// ── 메인 preflight ───────────────────────────────────────────────────────────────
async function runPreflight() {
  log(`=== ep003 자동문면접 Veo Preflight — Profile ${PROFILE_NUM} (port ${CDP_PORT}) ===`);
  log(`Scene preflight: ${SCENE_ID}`);
  log(`TOTAL_SEND=${TOTAL_MESSAGE_SEND_COUNT}, VEO=${VEO_SUBMISSION_COUNT} (must stay 0)`);

  // ── STAGE 0: ref 파일 4씬 전체 존재·크기·hash 확인 (브라우저 열기 전) ─────────
  stageStart("ref_files_all");
  for (const [sid, fp] of Object.entries(REF_FILES)) {
    if (!fs.existsSync(fp)) {
      await stageFail("ref_files_all", `${sid} ref not found: ${fp}`);
    }
    const stat = fs.statSync(fp);
    const hash = hashFile(fp);
    report.ref_checks[sid] = { path: fp, size: stat.size, hash };
    log(`  ${sid}: size=${Math.round(stat.size/1024)}KB hash=${hash}`);
    if (stat.size < 100_000) {
      await stageFail("ref_files_all", `${sid} ref too small (${stat.size} bytes) — 손상 의심`);
    }
  }
  stageDone("ref_files_all", "4씬 전부 존재·크기 OK");

  // ── STAGE 1: 프롬프트 키워드 4씬 정적 검사 (브라우저 열기 전) ────────────────
  stageStart("prompt_static_check");
  for (const [sid, prompt] of Object.entries(PROMPTS)) {
    const promptHash = crypto.createHash("md5").update(prompt).digest("hex");
    report.prompt_checks[sid] = { hash: promptHash, len: prompt.length, missing: [] };
    const required = COMMON_REQUIRED[sid] || [];
    for (const { key, label } of required) {
      if (!prompt.includes(key)) {
        report.prompt_checks[sid].missing.push(label);
      }
    }
    if (report.prompt_checks[sid].missing.length > 0) {
      await stageFail("prompt_static_check",
        `${sid} 프롬프트 필수 키워드 누락: ${report.prompt_checks[sid].missing.join(" / ")}`);
    }
    log(`  ${sid}: hash=${promptHash} len=${prompt.length} keywords=OK`);
  }
  stageDone("prompt_static_check", "4씬 키워드 전부 확인");

  // ── STAGE 2: S3 Empty-Doorway 독립 게이트 ──────────────────────────────────────
  stageStart("s3_boss_rule_gate");
  const s3p = PROMPTS.S3;
  const bossRuleFails = [];
  for (const { key, label } of S3_GATE_KEYWORDS) {
    const present = s3p.includes(key);
    report.s3_boss_rule[label] = present ? "PASS" : "FAIL";
    if (!present) bossRuleFails.push(label);
  }
  if (bossRuleFails.length > 0) {
    await stageFail("s3_boss_rule_gate",
      `S3 Empty-Doorway 필수 키워드 누락: ${bossRuleFails.join(" / ")}`);
  }
  stageDone("s3_boss_rule_gate", `Empty-Doorway 게이트 ${S3_GATE_KEYWORDS.length}/${S3_GATE_KEYWORDS.length} PASS`);

  // ── STAGE 3: Chrome CDP 연결 ──────────────────────────────────────────────────
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

  // ── STAGE 4: 로그인 확인 ─────────────────────────────────────────────────────
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

  // ── STAGE 5: 쿼터/거부 감지 ─────────────────────────────────────────────────
  stageStart("quota_check");
  const quotaBlocked = await detectQuotaOrRefusal(page);
  if (quotaBlocked) {
    await stageFail("quota_check", "rate limit / quota / refusal detected", page);
  }
  stageDone("quota_check");

  // ── STAGE 6: Veo 도구 활성화 ─────────────────────────────────────────────────
  stageStart("veo_activate");
  try {
    await activateVideoTool(page, log, warn);
    stageDone("veo_activate");
  } catch (e) {
    await stageFail("veo_activate", e.message, page);
  }

  // ── STAGE 7: 9:16 세로 모드 ──────────────────────────────────────────────────
  stageStart("vertical_mode");
  const vertOk = await setVerticalMode(page, log, warn);
  if (!vertOk) {
    await stageFail("vertical_mode", "9:16 mode not confirmed after selection", page);
  }
  stageDone("vertical_mode");

  // ── STAGE 8: ref 첨부 (SCENE_ID 기준) ────────────────────────────────────────
  stageStart("ref_attach");
  const refForScene = REF_FILES[SCENE_ID];
  let thumbCount;
  try {
    const res = await attachRef(page, refForScene, log, warn);
    thumbCount = res.thumbnails;
    report.thumbnails = thumbCount;
    stageDone("ref_attach", `scene=${SCENE_ID} thumbnails=${thumbCount}`);
  } catch (e) {
    await stageFail("ref_attach", e.message, page);
  }

  // ── STAGE 9: 프롬프트 입력 + 키워드 DOM 검증 (SCENE_ID 기준) ────────────────
  stageStart("prompt_input");
  const promptForScene   = PROMPTS[SCENE_ID];
  const keywordsForScene = COMMON_REQUIRED[SCENE_ID] || [];
  let typedLen;
  try {
    const res = await typeAndVerify(page, promptForScene, keywordsForScene, log);
    typedLen = res.typedLen;
    report.prompt_typed_len = typedLen;
    stageDone("prompt_input", `scene=${SCENE_ID} len=${typedLen}`);
  } catch (e) {
    await stageFail("prompt_input", e.message, page);
  }

  // ── STAGE 10: send enabled 확인 ──────────────────────────────────────────────
  stageStart("send_enabled");
  const sendOk = await checkSendEnabled(page);
  if (!sendOk) {
    await stageFail("send_enabled", "Send button not found or disabled", page);
  }
  report.send_enabled = true;
  stageDone("send_enabled");

  // ── STAGE 11: 카운터 최종 확인 ───────────────────────────────────────────────
  stageStart("counter_check");
  if (TOTAL_MESSAGE_SEND_COUNT !== 0 || VEO_SUBMISSION_COUNT !== 0) {
    await stageFail("counter_check",
      `Counter non-zero: TOTAL=${TOTAL_MESSAGE_SEND_COUNT}, VEO=${VEO_SUBMISSION_COUNT}`, page);
  }
  stageDone("counter_check", `TOTAL=${TOTAL_MESSAGE_SEND_COUNT}, VEO=${VEO_SUBMISSION_COUNT}`);

  // ── 최종 스크린샷 ────────────────────────────────────────────────────────────
  const ssPath = path.join(QA_DIR, `preflight_p${PROFILE_NUM}_${SCENE_ID}_pass.png`);
  await page.screenshot({ path: ssPath, fullPage: false });
  report.screenshot = ssPath;
  log(`Screenshot: ${ssPath}`);

  await page.close();
  await browser.close();

  report.result = "PREFLIGHT_PASS";
  await saveReport();

  console.log("\n=== PREFLIGHT RESULT ===");
  console.log(`Result:               PREFLIGHT_PASS ✅`);
  console.log(`Episode:              ep003 자동문면접`);
  console.log(`Profile:              ${PROFILE_NUM} (port ${CDP_PORT})`);
  console.log(`Scene preflight:      ${SCENE_ID}`);
  console.log(`TOTAL_SEND:           ${TOTAL_MESSAGE_SEND_COUNT}`);
  console.log(`VEO_SUBMIT:           ${VEO_SUBMISSION_COUNT}`);
  console.log(`Ref files (4씬):      ALL FOUND ✅`);
  console.log(`Prompt keywords:      ALL PASS ✅`);
  console.log(`S3 Empty-Doorway gate: ${S3_GATE_KEYWORDS.length}/${S3_GATE_KEYWORDS.length} PASS ✅`);
  console.log(`Thumbnails:           ${report.thumbnails}`);
  console.log(`Prompt typed len:     ${report.prompt_typed_len}`);
  console.log(`Send enabled:         ${report.send_enabled}`);
  console.log(`Screenshot:           ${ssPath}`);
  console.log(`\nReady for: ALLOW_VEO=true node scripts/_ep003-jdm-veo-generate.mjs --profile ${PROFILE_NUM}`);
}

runPreflight().catch(e => {
  console.error("[FATAL]", e.message);
  report.result = "FATAL";
  report.error  = e.message;
  saveReport().catch(() => {});
  process.exit(1);
});
