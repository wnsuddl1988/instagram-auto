/**
 * ep003 S3 Boss-Free 키프레임 생성 v6 (1회 단독 실행)
 *
 * 승인: ALLOW_CHATGPT_IMAGE=true
 * 상한: 1회 / $0.05 이하
 *
 * ref 2개 (순서 중요):
 *   1) jun_identity_reference.png   — Jun 얼굴·복장 identity-only (배경·장면 없음)
 *   2) door_identity_reference.png  — 문·프레임·세로 PULL 손잡이 only (Jun 없음)
 *
 * 금지 ref: 전체 장면 키프레임 전부 (s1~s4 qa_pass / try* 모두 금지)
 *
 * SAFETY_GATE: 두 ref 모두 첨부 확인(썸네일 2개) 아니면 전송 ABORT
 * 자동 재제출 금지 / TOTAL_MAX=1
 *
 * 실패 이력:
 *   v1 d1affe2e action_fail  — S2 포즈 복제, 문 미열림
 *   v2 d1affe2e fail_clone   — 동일 세션 캐시 고착
 *   v3 d1affe2e fail_clone   — s2 ref 자체가 clone 원인
 *   v4 077ccba0 content_clone_fail — s4 전체 장면 ref → 구도/포즈/문개방 복제
 *   v5 758148c6 continuity_fail    — 가로 레버 손잡이(S2 세로 PULL 손잡이와 불일치)
 *
 * 실행:
 *   ALLOW_CHATGPT_IMAGE=true node scripts/_ep003-jdm-s3-bossfree-kf-v6.mjs
 */

import { chromium } from "playwright";
import fs           from "fs";
import path         from "path";
import crypto       from "crypto";
import { fileURLToPath } from "url";

import {
  CDP_PORT_GPT1, USER_DATA_GPT1,
  ensureChrome, checkLogin, detectStop,
  attachRef, typePrompt,
  isAssistantDone, collectLastAssistantImages,
} from "./_chatgpt-image-core.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT      = path.resolve(__dirname, "..");
const KF_DIR    = path.join(ROOT, "output/v2/ep003_jdm/keyframes");
const QA_DIR    = path.join(ROOT, "output/v2/ep003_jdm/qa/s3_bossfree");

fs.mkdirSync(KF_DIR, { recursive: true });
fs.mkdirSync(QA_DIR, { recursive: true });

// ── 안전장치 ──────────────────────────────────────────────────────────────────
if (!process.env.ALLOW_CHATGPT_IMAGE) {
  console.error("ABORT: ALLOW_CHATGPT_IMAGE 환경변수 없음. 승인 없이 실행 금지.");
  process.exit(1);
}

// ── 상한 카운터 (절대 1회 초과 금지) ─────────────────────────────────────────
let TOTAL_SEND = 0;
const TOTAL_MAX = 1;

// ── ref 이미지 (2개 모두 필수) ───────────────────────────────────────────────
const REF_CHAR = path.join(QA_DIR, "jun_identity_reference.png");   // 캐릭터
const REF_DOOR = path.join(QA_DIR, "door_identity_reference.png");  // 문 구조

for (const ref of [REF_CHAR, REF_DOOR]) {
  if (!fs.existsSync(ref)) {
    console.error(`ABORT: ref 이미지 없음 — ${ref}`);
    process.exit(1);
  }
}

// ── 금지 ref (전체 장면 키프레임 전부) ──────────────────────────────────────
const FORBIDDEN_REFS = [
  path.join(KF_DIR, "s1_kf_try1.png"),
  path.join(KF_DIR, "s2_kf_qa_pass.png"),
  path.join(KF_DIR, "s2_kf_try1.png"),
  path.join(KF_DIR, "s2_kf_3d_try1.png"),
  path.join(KF_DIR, "s3_kf_try1.png"),
  path.join(KF_DIR, "s3_bossfree_kf_try1.png"),
  path.join(KF_DIR, "s3_bossfree_kf_try4.png"),
  path.join(KF_DIR, "s3_bossfree_kf_try5.png"),
  path.join(KF_DIR, "s4_kf_qa_pass.png"),
  path.join(KF_DIR, "s4_kf_try1.png"),
  path.join(KF_DIR, "_FAIL_s3_bossfree_clone_md5_d1affe2e.png"),
];

// ── S3 Boss-Free v6 프롬프트 ─────────────────────────────────────────────────
// 핵심 변경: ref 2개 분리 + 세로 PULL 손잡이 명시 + 가로 레버 금지
const S3_PROMPT = `3D semi-deformed Pixar-style office comedy still, vertical 9:16.
TWO REFERENCE IMAGES — use each reference ONLY for its designated purpose:
Reference 1 (character): Use ONLY for Jun's exact face shape, hair color, shirt color, tie color, and bag color. Do not copy any pose, background, or scene from reference 1.
Reference 2 (door): Use ONLY for the glass office door architecture — the same long vertical metal pull handle, the black metal door frame, and the glass panel structure. The door handle in this scene MUST match reference 2 exactly: a long vertical metal pull bar. Do not replace it with a horizontal lever handle, round doorknob, or push bar.
Do not copy any background from either reference. Create a completely new scene.
Scene contract: The glass meeting room door has already swung inward — the door is open only 15 to 25 cm, a narrow gap. Jun stands in the corridor half a step back from the door. His body is upright and slightly stiff, frozen in place with surprise. Jun's head is turned toward the gap, wide-eyed with shock and embarrassment. This is the moment he realizes the door was never automatic.
Jun remains outside the room. Jun is not stepping through the doorway. He has not moved — his feet are flat on the corridor floor, not crossing the threshold. His head is NOT bowed down. His hands are NOT in his pockets.
Both of Jun's hands are away from the glass: left hand hanging loosely at hip level, right arm loosely at his side. Neither hand touches the door, glass, or handle.
No other person is visible. No human hands, no body part, no sleeve, no silhouette, no shadow or reflection of anyone through the glass. Only the door moving implies someone inside opened it.
Jun wears light blue rolled-sleeve shirt, loose red tie, navy slacks, black dress shoes, brown crossbody messenger bag. Bright office corridor lighting.
DOOR HANDLE REQUIREMENT: same long vertical metal pull handle as the door reference. Do not replace it with a horizontal lever handle, round doorknob, or push bar. Use the character reference only for Jun's identity. Use the door reference only for the door architecture.
STRICT BANS: realistic human photo, white shirt, boss hand, boss sleeve, any second person, reflection of a person in glass, silhouette, text captions, logo, palm on glass, hand touching glass, Jun entering through doorway, Jun stepping through doorway, Jun walking into room, door fully open, door fully closed, Jun grabbing handle, head bowed down in resignation, hands in pockets, defeated slouch, horizontal lever handle, round doorknob, push bar.`;

// ── 프롬프트 정합성 키워드 ────────────────────────────────────────────────────
const REQUIRED_KEYWORDS = [
  "no human hands",
  "only the door moving",
  "no other person is visible",
  "jun remains outside the room",
  "jun is not stepping through the doorway",
  "the door is open only 15 to 25 cm",
  "both of jun's hands are away from the glass",
  "jun's head is turned toward the gap",
  "wide-eyed",
  "same long vertical metal pull handle as the door reference",
  "do not replace it with a horizontal lever handle",
  "use the character reference only for jun's identity",
  "use the door reference only for the door architecture",
];
const BANNED_IN_DESCRIPTION = [
  "boss sleeve",
  "boss wrist",
  "boss hand",
  "boss arm",
  "palm pressed on glass",
  "jun entering through the doorway",
  "jun steps through the doorway",
  "jun walks into the room",
  "door fully open",
  "head bowed down",
  "hands in pocket",
];

// ── 알려진 중복/FAIL md5 ─────────────────────────────────────────────────────
const KNOWN_DUP_MD5 = new Set([
  "8bdb9b66", // s2_kf_qa_pass.png
  "4a69bed3", // s4_kf_qa_pass.png
  "e9f6acf2", // s3_kf_try1.png
  "d1affe2e", // v1~v3 fail_clone
  "077ccba0", // v4 content_clone_fail
  "758148c6", // v5 continuity_fail (가로 레버 손잡이)
]);

// ── 유틸 ──────────────────────────────────────────────────────────────────────
function ts()   { return new Date().toISOString().slice(11, 19); }
function log(m) { console.log(`[${ts()}][S3-BF-v6] ${m}`); }
function warn(m){ console.warn(`[WARN][S3-BF-v6] ${m}`); }
function md5short(buf) {
  return crypto.createHash("md5").update(buf).digest("hex").slice(0, 8);
}

// ── intercept 기반 이미지 수집 ────────────────────────────────────────────────
async function collectFromIntercept(interceptBufs, refSizeKBs, savePath) {
  const candidates = [...interceptBufs.values()]
    .filter(buf => {
      const kb = Math.round(buf.length / 1024);
      const isRef = refSizeKBs.some(r => Math.abs(kb - r) / r < 0.10);
      return buf.length > 100_000 && !isRef;
    })
    .sort((a, b) => b.length - a.length);
  if (candidates.length === 0) return null;
  fs.writeFileSync(savePath, candidates[0]);
  return candidates[0];
}

// ── DOM fallback ──────────────────────────────────────────────────────────────
async function downloadImageFallback(page, savePath) {
  const imgs  = await collectLastAssistantImages(page);
  const large = imgs.filter(i => i.w >= 400).sort((a, b) => b.w - a.w);
  if (large.length === 0) return null;
  for (const img of large) {
    try {
      const resp = await page.evaluate(async (src) => {
        const r = await fetch(src, { credentials: "include" });
        if (!r.ok) return null;
        const buf = await r.arrayBuffer();
        return Array.from(new Uint8Array(buf));
      }, img.src);
      if (resp && resp.length > 100_000) {
        const buf = Buffer.from(resp);
        fs.writeFileSync(savePath, buf);
        return buf;
      }
    } catch {}
  }
  return null;
}

// ── 이미지 도구 활성화 ────────────────────────────────────────────────────────
async function activateImageTool(page) {
  const chip = page.getByRole("button", { name: /^이미지 만들기$|^Create image$/i }).first();
  if (await chip.count() > 0 && await chip.isVisible().catch(() => false)) {
    await chip.click();
    await page.waitForTimeout(1200);
    log("이미지 만들기 칩 ✅");
    return;
  }
  const plus = page.locator(
    'button[aria-label="파일 등 추가"], button[aria-label="파일 추가 및 기타"], ' +
    'button[aria-label*="Attach"], button[aria-label*="Add"]'
  ).first();
  if (await plus.count() === 0) throw new Error("이미지 도구 진입 불가");
  await plus.click();
  await page.waitForTimeout(1000);
  const item    = page.getByRole("menuitemradio", { name: /이미지 만들기|Create image/i }).first();
  const itemAlt = page.getByRole("menuitem",      { name: /이미지 만들기|Create image/i }).first();
  const target  = (await item.count() > 0) ? item : itemAlt;
  if (await target.count() === 0) { await page.keyboard.press("Escape"); throw new Error("이미지 만들기 메뉴 없음"); }
  await target.click();
  await page.waitForTimeout(1000);
  log("plus → 이미지 만들기 ✅");
}

// ── 프롬프트 정합성 검증 ──────────────────────────────────────────────────────
function validatePrompt(prompt) {
  const promptLower = prompt.toLowerCase();
  const descOnly    = prompt.split(/STRICT BANS:/i)[0].toLowerCase();
  const missing  = REQUIRED_KEYWORDS.filter(kw => !promptLower.includes(kw.toLowerCase()));
  if (missing.length > 0) {
    return `PROMPT_MISMATCH — 필수 키워드 누락: ${missing.join(" / ")}`;
  }
  const found = BANNED_IN_DESCRIPTION.filter(kw => descOnly.includes(kw.toLowerCase()));
  if (found.length > 0) {
    return `PROMPT_BANNED_KEYWORD — 묘사 영역에 금지 키워드: ${found.join(" / ")}`;
  }
  return null;
}

// ── 썸네일 수 확인 ────────────────────────────────────────────────────────────
async function countAttachThumbnails(page) {
  return page.evaluate(() =>
    document.querySelectorAll(
      'img[src*="blob"], img[src*="data:"], ' +
      '[data-testid*="attach"] img, [class*="attach"] img, ' +
      '[class*="upload"] img, [class*="file"] img, ' +
      '[class*="thumb"] img, [role="img"][class*="file"], ' +
      'div[class*="FilePreview"], div[class*="file-pill"], ' +
      'span[class*="attachment"]'
    ).length
  ).catch(() => 0);
}

// ── 생성 완료 대기 ────────────────────────────────────────────────────────────
async function waitForDone(page, timeoutMs = 120000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await isAssistantDone(page)) return true;
    await page.waitForTimeout(2000);
  }
  return false;
}

// ── 메인 ──────────────────────────────────────────────────────────────────────
async function run() {
  log("=== S3 Boss-Free v6 키프레임 생성 시작 ===");
  log(`ref[1] 캐릭터: ${path.basename(REF_CHAR)}`);
  log(`ref[2] 문 구조: ${path.basename(REF_DOOR)}`);
  log("금지 ref: 전체 장면 키프레임 s1~s5 전부 로드 안 함");

  // §0 프롬프트 정합성 검증
  const promptError = validatePrompt(S3_PROMPT);
  if (promptError) {
    console.error(`ABORT — ${promptError}`);
    process.exit(1);
  }
  log("프롬프트 정합성 ✅");

  // 상한 체크
  if (TOTAL_SEND >= TOTAL_MAX) {
    console.error(`ABORT: 상한 ${TOTAL_MAX}회 이미 도달`);
    process.exit(1);
  }

  // 출력 파일 중복 체크
  const savePath = path.join(KF_DIR, "s3_bossfree_kf_try6.png");
  if (fs.existsSync(savePath)) {
    console.error(`ABORT: 출력 파일 이미 존재 — ${savePath}`);
    process.exit(1);
  }

  // Chrome 연결
  await ensureChrome(CDP_PORT_GPT1, USER_DATA_GPT1, log);
  const browser = await chromium.connectOverCDP(`http://localhost:${CDP_PORT_GPT1}`);
  const ctx     = browser.contexts()[0];
  const page    = await ctx.newPage();

  const report = {
    started_at: new Date().toISOString(),
    refs: [path.basename(REF_CHAR), path.basename(REF_DOOR)],
    forbidden_ref_used: false,
    new_chat_forced: false,
    total_send: 0,
    status: "pending",
  };

  // ── 새 채팅 강제 시작 ─────────────────────────────────────────────────────────
  log("새 채팅 강제 시작 — chatgpt.com 루트 이동");
  try {
    await page.goto("https://chatgpt.com/", { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(3000);

    const newChatBtn = page.locator(
      'a[href="/"], button[aria-label*="새 채팅"], button[aria-label*="New chat"], ' +
      'a[aria-label*="New chat"], [data-testid="create-new-chat-button"]'
    ).first();
    if (await newChatBtn.count() > 0 && await newChatBtn.isVisible().catch(() => false)) {
      await newChatBtn.click();
      await page.waitForTimeout(2000);
      log("새 채팅 버튼 클릭 ✅");
    } else {
      log("이미 새 채팅 상태 ✅");
    }

    const currentUrl = page.url();
    const hasConvId  = /\/c\/[a-f0-9-]{8,}/.test(currentUrl);
    if (hasConvId) {
      warn(`새 채팅 강제 실패 — URL에 대화 ID 포함: ${currentUrl}`);
      await page.screenshot({ path: `${QA_DIR}/v6_new_chat_fail.png` }).catch(() => {});
      await page.close();
      await browser.close().catch(() => {});
      console.error("ABORT: 기존 대화 컨텍스트 초기화 실패 — 전송 차단");
      process.exit(1);
    }
    log(`새 채팅 확인: ${currentUrl} ✅`);
    report.new_chat_forced = true;
  } catch (e) {
    warn(`새 채팅 강제 중 오류: ${e.message}`);
    await page.screenshot({ path: `${QA_DIR}/v6_new_chat_error.png` }).catch(() => {});
    await page.close();
    await browser.close().catch(() => {});
    console.error("ABORT: 새 채팅 강제 실패");
    process.exit(1);
  }

  try {
    await checkLogin(page, log);
    await detectStop(page);
  } catch (e) {
    warn(`로그인/중단 체크: ${e.message}`);
    await page.close();
    await browser.close().catch(() => {});
    process.exit(1);
  }

  // composer 하이드레이션 대기
  try {
    await page.locator(
      'button[aria-label="파일 등 추가"], button[aria-label="파일 추가 및 기타"], ' +
      'button[aria-label*="Attach"], button[aria-label*="Add"]'
    ).first().waitFor({ state: "visible", timeout: 20000 });
  } catch {
    warn("composer 하이드레이션 대기 타임아웃");
    await page.screenshot({ path: `${QA_DIR}/v6_no_plus_btn.png` }).catch(() => {});
  }

  // 이미지 도구 활성화
  try {
    await activateImageTool(page);
  } catch (e) {
    warn(`이미지 도구 활성화 실패: ${e.message}`);
    await page.screenshot({ path: `${QA_DIR}/v6_tool_fail.png` }).catch(() => {});
    await page.close();
    await browser.close().catch(() => {});
    process.exit(1);
  }

  await page.waitForTimeout(2000);

  // ── ref[1] 캐릭터 첨부 ───────────────────────────────────────────────────────
  let charAttached = false;
  try {
    await attachRef(page, REF_CHAR, log);
    charAttached = true;
    log(`ref[1] 캐릭터 첨부: ${path.basename(REF_CHAR)} ✅`);
  } catch (e) {
    warn(`ref[1] attachRef 실패: ${e.message} — wide selector 재확인`);
    const n = await countAttachThumbnails(page);
    if (n >= 1) {
      charAttached = true;
      log(`ref[1] 첨부 확인 (wide selector ${n}개) ✅`);
    }
  }

  await page.waitForTimeout(1500);

  // ── ref[2] 문 구조 첨부 ──────────────────────────────────────────────────────
  let doorAttached = false;
  try {
    await attachRef(page, REF_DOOR, log);
    doorAttached = true;
    log(`ref[2] 문 구조 첨부: ${path.basename(REF_DOOR)} ✅`);
  } catch (e) {
    warn(`ref[2] attachRef 실패: ${e.message} — wide selector 재확인`);
    const n = await countAttachThumbnails(page);
    if (n >= 2) {
      doorAttached = true;
      log(`ref[2] 첨부 확인 (wide selector ${n}개 ≥ 2) ✅`);
    }
  }

  await page.waitForTimeout(1000);

  // ── SAFETY_GATE: 썸네일 2개 확인 ─────────────────────────────────────────────
  const thumbCount = await countAttachThumbnails(page);
  log(`첨부 썸네일 수: ${thumbCount}`);

  if (!charAttached || !doorAttached) {
    warn(`SAFETY_GATE ABORT: charAttached=${charAttached}, doorAttached=${doorAttached}`);
    await page.screenshot({ path: `${QA_DIR}/v6_ref_fail.png` }).catch(() => {});
    await page.close();
    await browser.close().catch(() => {});
    report.status = "ref_attach_fail";
    fs.writeFileSync(`${QA_DIR}/report_v6.json`, JSON.stringify(report, null, 2));
    console.error("ABORT: ref 첨부 2개 미충족 — 전송 차단");
    process.exit(1);
  }

  if (thumbCount < 2) {
    warn(`SAFETY_GATE ABORT: 썸네일 ${thumbCount}개 < 2 — 전송 차단`);
    await page.screenshot({ path: `${QA_DIR}/v6_thumb_fail.png` }).catch(() => {});
    await page.close();
    await browser.close().catch(() => {});
    report.status = "thumb_count_fail";
    fs.writeFileSync(`${QA_DIR}/report_v6.json`, JSON.stringify(report, null, 2));
    console.error(`ABORT: 썸네일 ${thumbCount}개 확인 — 2개 필요`);
    process.exit(1);
  }

  log(`SAFETY_GATE PASS: charAttached=true, doorAttached=true, thumbs=${thumbCount} ✅`);

  // intercept 설정
  const interceptBufs = new Map();
  await page.route("**/*", async (route) => {
    const req = route.request();
    const url = req.url();
    if (/oaiusercontent|backend-api.*estuary|dalle/.test(url) && req.resourceType() === "image") {
      try {
        const resp = await route.fetch();
        const body = await resp.body();
        if (body && body.length > 50_000) interceptBufs.set(url, body);
        await route.fulfill({ response: resp, body });
      } catch { await route.continue().catch(() => {}); }
    } else {
      await route.continue().catch(() => {});
    }
  });

  // 프롬프트 입력
  await typePrompt(page, S3_PROMPT, log);

  // 전송 버튼 확인
  const sendBtn = page.locator(
    '#composer-submit-button, button[data-testid="send-button"], ' +
    'button[aria-label="Send message"], button[aria-label="메시지 보내기"]'
  ).first();

  if (!(await sendBtn.isEnabled().catch(() => false))) {
    warn("전송 버튼 비활성 — 전송 차단");
    await page.unroute("**/*").catch(() => {});
    await page.screenshot({ path: `${QA_DIR}/v6_send_disabled.png` }).catch(() => {});
    await page.close();
    await browser.close().catch(() => {});
    process.exit(1);
  }

  // 전송 (1회)
  TOTAL_SEND++;
  report.total_send = TOTAL_SEND;
  log(`전송 ${TOTAL_SEND}/${TOTAL_MAX} — S3 Boss-Free v6 (refs: ${path.basename(REF_CHAR)} + ${path.basename(REF_DOOR)} ✅)`);
  await sendBtn.click();
  log("전송 클릭 — 생성 대기 (최대 120s)...");

  // 생성 완료 대기
  const done = await waitForDone(page, 120000);
  await page.waitForTimeout(2000);

  if (!done) {
    warn("S3 v6 생성 타임아웃 120s — 탭 유지, PENDING_RECOVERY 보고");
    await page.screenshot({ path: `${QA_DIR}/v6_timeout.png` }).catch(() => {});
    await page.unroute("**/*").catch(() => {});
    // 탭 유지 (recover2 스크립트로 회수 가능)
    await browser.close().catch(() => {});
    report.status = "timeout_pending_recovery";
    report.recover_note = "isAssistantDone 120s 타임아웃 — recover2 스크립트로 회수 필요";
    fs.writeFileSync(`${QA_DIR}/report_v6.json`, JSON.stringify(report, null, 2));
    console.error("PENDING_RECOVERY: 타임아웃 — 탭 유지됨. recover2로 회수 필요.");
    process.exit(1);
  }

  await page.unroute("**/*").catch(() => {});

  // 이미지 수집
  const refSizeKBs = [REF_CHAR, REF_DOOR].map(p => Math.round(fs.statSync(p).size / 1024));
  log(`intercept 수집: ${interceptBufs.size}개`);
  let buf = await collectFromIntercept(interceptBufs, refSizeKBs, savePath);

  if (!buf) {
    log("intercept 미수집 — DOM fallback 시도");
    buf = await downloadImageFallback(page, savePath);
  }

  await page.screenshot({ path: `${QA_DIR}/v6_result.png`, fullPage: false }).catch(() => {});

  if (!buf) {
    warn("이미지 수집 실패 (intercept + DOM 모두)");
    await page.close();
    await browser.close().catch(() => {});
    report.status = "no_image";
    fs.writeFileSync(`${QA_DIR}/report_v6.json`, JSON.stringify(report, null, 2));
    process.exit(1);
  }

  const kb   = Math.round(buf.length / 1024);
  const hash = md5short(buf);
  log(`저장: ${path.basename(savePath)} (${kb}KB, md5=${hash})`);

  // MD5 clone 가드
  if (KNOWN_DUP_MD5.has(hash)) {
    warn(`CLONE_DETECTED: md5=${hash} — 알려진 중복(v1~v5). FAIL 처리.`);
    const failPath = path.join(KF_DIR, `_FAIL_s3_bossfree_clone_md5_${hash}_v6.png`);
    fs.renameSync(savePath, failPath);
    report.status  = "fail_clone";
    report.file    = failPath;
    report.size_kb = kb;
    report.md5     = hash;
    await page.close();
    await browser.close().catch(() => {});
    fs.writeFileSync(`${QA_DIR}/report_v6.json`, JSON.stringify(report, null, 2));
    log("자동 재제출 금지 — Owner 판단 대기");
    process.exit(1);
  }

  report.status  = "candidate_owner_qa_pending";
  report.file    = savePath;
  report.size_kb = kb;
  report.md5     = hash;
  report.qa_criteria = {
    PASS: [
      "3D semi-deformed Jun IP 유지",
      "하늘색 셔츠/빨간 넥타이/네이비 슬랙스/갈색 가방",
      "유리문이 15~25cm만 열림 (좁은 틈)",
      "세로형 긴 금속 PULL 손잡이 (S2와 동일 구조)",
      "Jun 고개가 열린 틈을 향하고 눈이 커진 놀람 표정",
      "Jun 몸이 복도에 직립·정지, 문 통과 없음",
      "Boss 신체/손/소매/실루엣/반사 없음",
      "실사 아님, white shirt 아님",
      "9:16 세로",
    ],
    FAIL_MD5: ["d1affe2e", "4a69bed3", "077ccba0", "8bdb9b66", "e9f6acf2", "758148c6"],
    FAIL_CONTENT: [
      "가로 레버 손잡이 또는 원형 손잡이 (S2 세로 PULL 불일치)",
      "S4와 동일한 고개 숙인 체념 자세",
      "양손 주머니",
      "문이 거의 완전히 열림",
      "S4와 동일한 카메라 구도·배경",
      "S2 손바닥 유리 탐색 자세",
      "Boss 신체/손/소매/실루엣 어느 것이라도 보임",
      "실사 인물 / white shirt",
      "Jun이 문을 통과하거나 진입 중",
    ],
  };

  report.finished_at = new Date().toISOString();
  fs.writeFileSync(`${QA_DIR}/report_v6.json`, JSON.stringify(report, null, 2));

  log("\n=== v6 완료 ===");
  log(`파일: ${path.basename(savePath)} (${kb}KB, md5=${hash})`);
  log(`ref[1]: ${path.basename(REF_CHAR)} (캐릭터 identity)`);
  log(`ref[2]: ${path.basename(REF_DOOR)} (문 구조 identity)`);
  log(`총 전송: ${TOTAL_SEND}/${TOTAL_MAX}`);
  log("⚠️  Owner 육안 QA 필수 — 세로 PULL 손잡이 연속성 우선 확인");
  log(`QA 스크린샷: ${QA_DIR}/v6_result.png`);

  await page.close();
  await browser.close().catch(() => {});
}

run().catch(e => {
  console.error(`[FATAL] ${e.message}`);
  process.exit(1);
});
