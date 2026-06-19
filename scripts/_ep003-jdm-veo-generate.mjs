/**
 * ep003 자동문 면접 — Veo 생성 runner
 *
 * 역할: S1~S4 씬당 1회 Veo 제출. --dry-run으로 전송 없이 검증 가능.
 *
 * 안전 게이트:
 *   - ALLOW_VEO=true 미설정 시 실제 제출 ABORT
 *   - --dry-run: ref 첨부 + prompt 입력 + send enabled 확인 후 전송 없이 종료
 *   - S3 Boss Rule 하드 게이트: 5항목 모두 없으면 ABORT
 *   - preflight PASS JSON 존재 확인 (24h 초과 시 warning/ABORT)
 *   - prompt hash / ref hash preflight와 불일치 시 ABORT
 *   - TOTAL > 1 또는 VEO > 1 즉시 ABORT
 *   - G4 절대 금지. 자동 재시도 금지.
 *
 * 사용:
 *   node scripts/_ep003-jdm-veo-generate.mjs --scene S1 [--profile 1] [--dry-run]
 *   ALLOW_VEO=true node scripts/_ep003-jdm-veo-generate.mjs --scene S1 --profile 1
 *
 * 결과:
 *   output/v2/ep003_jdm/veo/s{N}_veo_raw.mp4
 */

import { chromium }        from "playwright";
import path                from "path";
import fs                  from "fs";
import crypto              from "crypto";
import { fileURLToPath }   from "url";

import {
  hashFile, ensureChrome,
  activateVideoTool, setVerticalMode, attachRef, typeAndVerify,
  checkSendEnabled, detectQuotaOrRefusal,
} from "./_gemini-veo-core.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT      = path.resolve(__dirname, "..");

// ── CLI 파라미터 ─────────────────────────────────────────────────────────────────
const DRY         = process.argv.includes("--dry-run");
const profileArg  = process.argv.indexOf("--profile");
const PROFILE_NUM = profileArg >= 0 ? parseInt(process.argv[profileArg + 1]) : 1;
const sceneArg    = process.argv.indexOf("--scene");
const SCENE_ID    = sceneArg >= 0 ? process.argv[sceneArg + 1].toUpperCase() : null;

if (!SCENE_ID || !["S1","S2","S3","S4"].includes(SCENE_ID)) {
  console.error("[ABORT] --scene S1|S2|S3|S4 필수");
  process.exit(1);
}
if (PROFILE_NUM === 4) { console.error("[ABORT] Profile 4 is forbidden."); process.exit(1); }
if (![1, 2, 3].includes(PROFILE_NUM)) { console.error("[ABORT] Profile must be 1, 2, or 3."); process.exit(1); }

const PROFILE_PORT    = { 1: 9223, 2: 9224, 3: 9225 };
const USER_DATA_ROOTS = {
  1: "C:/Users/PC/AppData/Local/Google/Chrome/User Data/AI-Gemini-1",
  2: "C:/Users/PC/AppData/Local/Google/Chrome/User Data/AI-Gemini-2",
  3: "C:/Users/PC/AppData/Local/Google/Chrome/User Data/AI-Gemini-3",
};
const CDP_PORT  = PROFILE_PORT[PROFILE_NUM];
const USER_DATA = USER_DATA_ROOTS[PROFILE_NUM];

// ── 경로 ─────────────────────────────────────────────────────────────────────────
const KF_DIR       = path.join(ROOT, "output/v2/ep003_jdm/keyframes");
const VEO_DIR      = path.join(ROOT, "output/v2/ep003_jdm/veo");
const PREFLIGHT_DIR= path.join(ROOT, "output/v2/ep003_jdm/qa/preflight_veo");
fs.mkdirSync(VEO_DIR, { recursive: true });

const REF_FILES = {
  S1: path.join(KF_DIR, "s1_kf_try1.png"),
  S2: path.join(KF_DIR, "s2_kf_qa_pass.png"),
  S3: path.join(KF_DIR, "s3_kf_try1.png"),
  S4: path.join(KF_DIR, "s4_kf_qa_pass.png"),
};

const OUT_FILES = {
  S1: path.join(VEO_DIR, "s1_veo_raw.mp4"),
  S2: path.join(VEO_DIR, "s2_veo_raw.mp4"),
  S3: path.join(VEO_DIR, "s3_veo_raw.mp4"),
  S4: path.join(VEO_DIR, "s4_veo_raw.mp4"),
};

// ── 씬별 프롬프트 ────────────────────────────────────────────────────────────────
const PROMPTS = {
  S1: `Animate this 3D semi-deformed Pixar-style scene. The character Jun is standing in a modern office corridor facing a glass meeting room door. He waves his right hand in front of the door once, then again, expecting it to open automatically. The door does not open. His expression shifts from confident expectation to mild puzzlement. He then takes a slow step closer toward the door, still not touching the handle. Camera: fixed, slight natural push-in only. Duration: 8 seconds. STRICT BANS: door opening, Jun touching the handle, any sensor or electronic panel, any other character, white shirt, cut or jump in scene, camera panning away.`,

  S2: `Animate this 3D semi-deformed Pixar-style scene. Jun is pressing his palm against a glass office door, searching for a motion sensor. He slowly moves his hand left and right across the glass, then leans back to look at the top of the door frame, then steps closer again and runs his palm across the wall beside the door. His expression escalates from focused to embarrassed. The door remains closed throughout. The door handle is visible but Jun never looks at or touches it. Camera: fixed. Duration: 8 seconds. STRICT BANS: door opening, Jun touching or gripping the handle, Jun looking at the handle with recognition, any other character appearing, white shirt, internal cuts or scene jumps.`,

  S3: `Animate this 3D semi-deformed Pixar-style scene. The glass meeting room door begins to open from the inside. Only the off-screen boss's hand, wrist, and a very short business-suit sleeve are visible at the extreme edge of the frame. No elbow or anything above the elbow may appear. No face, head, neck, shoulder, torso, silhouette, or reflection in the glass. The hand grips the door handle (marked PULL) and pulls the door open. Jun, standing outside, freezes mid-motion with a shocked expression. As the door opens further, Jun slowly lowers his hand and his expression shifts from shock to embarrassment. Camera: completely fixed, do NOT pan or move toward the inside. Duration: 6 seconds. STRICT BANS: any part of Boss above the elbow (face, head, neck, shoulders, torso, reflected in glass), camera moving toward interior, door closing again, Jun gripping the handle, white shirt, internal cuts.`,

  S4: `Animate this 3D semi-deformed Pixar-style scene. Jun is standing alone in front of the now-open glass meeting room door. He slowly exhales, shoulders dropping slightly. He then gently raises his head to look forward with a resigned, slightly embarrassed expression — the look of someone accepting defeat gracefully. He holds this stable pose for the final 2 seconds, ready to deliver a closing line. No other characters appear. Camera: fixed. Duration: 3.5 seconds. STRICT BANS: door closing, any other character or body part appearing, Jun looking angry or laughing, white shirt, internal cuts.`,
};

// ── 프롬프트 키워드 (preflight와 동일) ──────────────────────────────────────────
const REQUIRED_KEYWORDS = {
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
    { key: "above the elbow",         label: "팔꿈치 이상 금지" },
    { key: "reflection in the glass", label: "유리 반사 금지" },
    { key: "completely fixed",        label: "카메라 완전 고정" },
    { key: "white shirt",             label: "white shirt BANS" },
  ],
  S4: [
    { key: "stable pose",             label: "마지막 정지 자세" },
    { key: "white shirt",             label: "white shirt BANS" },
    { key: "fixed",                   label: "카메라 고정" },
  ],
};

// ── S3 Boss Rule 하드 게이트 키워드 ─────────────────────────────────────────────
const S3_BOSS_RULE_KEYWORDS = [
  "above the elbow",
  "reflection in the glass",
  "do NOT pan or move toward the inside",
  "No face, head, neck, shoulder, torso",
  "silhouette",
];

// ── 전송 카운터 (단일 전송 보장) ─────────────────────────────────────────────────
let TOTAL_MESSAGE_SEND_COUNT = 0;
let VEO_SUBMISSION_COUNT     = 0;

function ts()    { return new Date().toISOString().slice(11, 19); }
function log(m)  { console.log(`[${ts()}][P${PROFILE_NUM}][${SCENE_ID}] ${m}`); }
function warn(m) { console.warn(`[WARN][P${PROFILE_NUM}][${SCENE_ID}] ${m}`); }
function abort(code, m) { console.error(`\n[ABORT:${code}] ${m}\n`); process.exit(1); }

function recordSend(label) {
  TOTAL_MESSAGE_SEND_COUNT++;
  VEO_SUBMISSION_COUNT++;
  if (TOTAL_MESSAGE_SEND_COUNT > 1) abort("double_send", `TOTAL=${TOTAL_MESSAGE_SEND_COUNT} at "${label}"`);
  if (VEO_SUBMISSION_COUNT > 1)     abort("double_veo",  `VEO=${VEO_SUBMISSION_COUNT} at "${label}"`);
  log(`[SEND #${TOTAL_MESSAGE_SEND_COUNT}/VEO] "${label}"`);
}

// ── 프롬프트 hash 계산 ───────────────────────────────────────────────────────────
function hashText(s) {
  return crypto.createHash("md5").update(s).digest("hex");
}

// ── preflight JSON 검증 ──────────────────────────────────────────────────────────
function checkPreflight(promptHash, refHash) {
  const pfPath = path.join(PREFLIGHT_DIR, `preflight_p${PROFILE_NUM}_${SCENE_ID}_result.json`);
  if (!fs.existsSync(pfPath)) {
    abort("no_preflight",
      `${SCENE_ID} preflight 결과 없음: ${pfPath}\n` +
      `먼저 실행: node scripts/_ep003-jdm-veo-preflight.mjs --profile ${PROFILE_NUM} --scene ${SCENE_ID}`);
  }
  const pf = JSON.parse(fs.readFileSync(pfPath, "utf-8"));
  if (pf.result !== "PREFLIGHT_PASS") {
    abort("preflight_not_pass", `${SCENE_ID} preflight result=${pf.result} — PREFLIGHT_PASS 아님`);
  }
  // prompt hash 일치 확인
  if (pf.prompt_checks && pf.prompt_checks[SCENE_ID]) {
    const pfHash = pf.prompt_checks[SCENE_ID].hash;
    if (pfHash && pfHash !== promptHash) {
      abort("PREFLIGHT_STALE",
        `${SCENE_ID} prompt hash 불일치 — preflight:${pfHash.slice(0,8)} vs now:${promptHash.slice(0,8)}\n` +
        "프롬프트가 변경됨. preflight를 다시 실행하세요.");
    }
  }
  // ref hash 일치 확인
  if (pf.ref_checks && pf.ref_checks[SCENE_ID]) {
    const pfRef = pf.ref_checks[SCENE_ID].hash;
    if (pfRef && pfRef !== refHash) {
      abort("PREFLIGHT_STALE",
        `${SCENE_ID} ref hash 불일치 — preflight:${pfRef.slice(0,8)} vs now:${refHash.slice(0,8)}\n` +
        "ref 파일이 변경됨. preflight를 다시 실행하세요.");
    }
  }
  // 24h STALE 체크
  if (pf.finished_at) {
    const ageMs = Date.now() - new Date(pf.finished_at).getTime();
    const ageH  = Math.round(ageMs / 3600000 * 10) / 10;
    if (ageMs > 24 * 3600_000) {
      if (!DRY) {
        abort("preflight_stale",
          `${SCENE_ID} preflight ${ageH}h 경과 — 24h 초과. dry-run 재확인 후 Owner 재승인 필요.`);
      }
      warn(`preflight ${ageH}h 경과 (24h 초과) — dry-run이라 warning으로 처리`);
    } else {
      log(`Preflight age: ${ageH}h ✅`);
    }
  }
  log(`Preflight check PASS ✅ — result=PREFLIGHT_PASS, hash match`);
}

// ── 메인 ─────────────────────────────────────────────────────────────────────────
async function main() {
  log(`=== ep003 자동문면접 Veo 생성 — ${SCENE_ID} (profile ${PROFILE_NUM}, port ${CDP_PORT}) ===`);
  if (DRY) log("[DRY-RUN MODE] 전송 없음");

  const PROMPT  = PROMPTS[SCENE_ID];
  const REF_IMG = REF_FILES[SCENE_ID];
  const OUT_MP4 = OUT_FILES[SCENE_ID];

  // ── S3 Boss Rule 하드 게이트 (전송 전 최우선) ──────────────────────────────
  if (SCENE_ID === "S3") {
    const missing = S3_BOSS_RULE_KEYWORDS.filter(kw => !PROMPT.includes(kw));
    if (missing.length > 0) {
      abort("s3_boss_rule_fail",
        `S3 Boss Rule 필수 키워드 누락: ${missing.join(" / ")}\n` +
        "프롬프트를 수정하고 preflight를 다시 실행하세요.");
    }
    log(`S3 Boss Rule 게이트: ${S3_BOSS_RULE_KEYWORDS.length}/${S3_BOSS_RULE_KEYWORDS.length} PASS ✅`);
  }

  // ── ref 파일 확인 ────────────────────────────────────────────────────────
  if (!fs.existsSync(REF_IMG)) abort("ref_missing", `ref not found: ${REF_IMG}`);
  const refHash    = hashFile(REF_IMG);
  const promptHash = hashText(PROMPT);
  log(`Ref:    ${REF_IMG} (${Math.round(fs.statSync(REF_IMG).size/1024)}KB, hash=${refHash.slice(0,8)})`);
  log(`Prompt: ${PROMPT.length} chars (hash=${promptHash.slice(0,8)})`);

  // ── preflight 검증 ───────────────────────────────────────────────────────
  checkPreflight(promptHash, refHash);

  // ── 출력 파일 덮어쓰기 방지 (실제 실행 시) ───────────────────────────────
  if (!DRY && fs.existsSync(OUT_MP4)) {
    abort("output_exists",
      `${OUT_MP4} 이미 존재. 덮어쓰기 방지. 파일을 이동 후 재시도.`);
  }

  // ── Chrome CDP 연결 ──────────────────────────────────────────────────────
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
  log(`Gemini loaded: ${page.url().slice(0, 60)}`);

  // ── Veo 활성화 + 9:16 ───────────────────────────────────────────────────
  await activateVideoTool(page, log, warn).catch(e => abort("tool_failed", e.message));
  const vertOk = await setVerticalMode(page, log, warn);
  if (!vertOk) abort("vertical_failed", "9:16 mode not confirmed");

  // ── ref 첨부 ────────────────────────────────────────────────────────────
  const { thumbnails } = await attachRef(page, REF_IMG, log, warn)
    .catch(e => abort("attach_failed", e.message));
  if (thumbnails === 0) abort("no_thumbnail", "Reference image not attached");
  log(`Ref attached ✅ (thumbnails=${thumbnails})`);

  // ── 프롬프트 입력 + 키워드 DOM 검증 ────────────────────────────────────
  const { typedLen } = await typeAndVerify(page, PROMPT, REQUIRED_KEYWORDS[SCENE_ID], log)
    .catch(e => abort("prompt_failed", e.message));
  log(`Prompt typed ✅ (len=${typedLen})`);

  // ── send enabled 확인 ───────────────────────────────────────────────────
  const sendOk = await checkSendEnabled(page);
  log(`Send enabled: ${sendOk}`);
  if (!sendOk) abort("send_disabled", "Send button not enabled");

  log(`카운터: TOTAL=${TOTAL_MESSAGE_SEND_COUNT}, VEO=${VEO_SUBMISSION_COUNT}`);

  // ── DRY-RUN 종료 ────────────────────────────────────────────────────────
  if (DRY) {
    log(`\n[DRY-RUN PASS ✅] 전송 없음`);
    log(`  Ref hash:    ${refHash.slice(0,8)}`);
    log(`  Prompt hash: ${promptHash.slice(0,8)}`);
    log(`  Thumbnails:  ${thumbnails}`);
    log(`  Prompt len:  ${typedLen}`);
    log(`  Send enabled:${sendOk}`);
    log(`  TOTAL=${TOTAL_MESSAGE_SEND_COUNT}, VEO=${VEO_SUBMISSION_COUNT}`);
    await page.close();
    await browser.close();
    return;
  }

  // ── ALLOW_VEO 게이트 ────────────────────────────────────────────────────
  if (!process.env.ALLOW_VEO) {
    abort("allow_veo_missing",
      "ALLOW_VEO 환경변수 미설정 — Owner 승인 후 ALLOW_VEO=true로 실행하세요.");
  }

  // ── 전송 직전 hash 재확인 ───────────────────────────────────────────────
  const refHashNow = hashFile(REF_IMG);
  if (refHashNow !== refHash) abort("ref_changed", `ref hash changed before send: ${refHashNow}`);
  log("전송 직전 hash 재확인 PASS ✅");

  // ── 실제 전송 (정확히 1회, send button click만 허용) ───────────────────
  const sendBtn = page.locator(
    'button[aria-label="메시지 보내기"], button[aria-label*="전송"], button[aria-label*="Send"]'
  ).first();
  if (await sendBtn.count() === 0 || !(await sendBtn.isEnabled().catch(() => false))) {
    abort("send_btn_missing", "Send button not found or disabled at submit time — Enter fallback 금지");
  }
  recordSend(`${SCENE_ID} Veo 제출`);
  await sendBtn.click();
  log("Send button clicked — ACTUAL VEO SUBMISSION");

  // ── 영상 생성 대기 + 다운로드 ───────────────────────────────────────────
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
        } else {
          await download.saveAs(OUT_MP4);
          if (fs.existsSync(OUT_MP4)) { savedPath = OUT_MP4; result = "saved"; }
          else { warn("Download path empty"); result = "download_failed"; }
        }
      } catch (e) { warn(`Download error: ${e.message}`); result = "download_failed"; }
      break;
    }

    const bodySnip   = await page.evaluate(() => (document.body.innerText || "").slice(0, 300)).catch(() => "");
    const generating = /생성|만드는 중|Generating|Creating/i.test(bodySnip);
    log(`  ${elapsed}s | generating:${generating} | dlBtn:${dlVisible}`);
  }

  // ── 결과 보고 ────────────────────────────────────────────────────────────
  await page.close();
  await browser.close();

  console.log(`\n=== ${SCENE_ID} Veo 결과 ===`);
  console.log(`result:        ${result}`);
  console.log(`saved:         ${savedPath || "없음"}`);
  console.log(`size:          ${savedPath ? Math.round(fs.statSync(savedPath).size/1024) + "KB" : "-"}`);
  console.log(`TOTAL_SEND:    ${TOTAL_MESSAGE_SEND_COUNT}`);
  console.log(`VEO_SUBMIT:    ${VEO_SUBMISSION_COUNT}`);

  if (result !== "saved") {
    console.error(`\n[FAIL] result=${result} — Codex 보고 후 Owner 재승인 필요. 자동 재시도 금지.`);
    process.exit(1);
  }
}

main().catch(e => {
  console.error("[FATAL]", e.message);
  process.exit(1);
});
