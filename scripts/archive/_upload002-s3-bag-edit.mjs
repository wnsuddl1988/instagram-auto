/**
 * upload_002_copier S3 가방 추가 편집
 *
 * 목적: kf_s3_tapping_relief_v2.png (가방 누락 FAIL)에서
 *       모든 요소를 유지한 채 갈색 크로스바디 메신저백만 추가한다.
 *
 * Owner 승인 경계:
 * - GPT web image 편집: 정확히 1회
 * - 직접 유료 API 호출: $0
 * - 자동 재제출·Enter 재입력: 0회
 * - S4·S5·Veo·TTS 등 다른 외부 호출 없음
 * - 실패 시 추가 호출 없이 종료
 *
 * 사용: node scripts/_upload002-s3-bag-edit.mjs [--dry-run]
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
const CAND_DIR   = path.join(KF_DIR, "s3_bag_edit_candidates");
const QA_DIR     = path.join(ROOT, "output/v2/3d_sitcom_prod_v1/upload_002_copier/qa/bag_continuity");

// Base: 현재 S3 v2 이미지 자체를 편집 대상으로 사용 (S2 reference 사용 안 함)
const BASE_IMG   = path.join(KF_DIR, "kf_s3_tapping_relief_v2.png");
const DEST_FILE  = "kf_s3_tapping_relief_v3_bag.png";
const DEST_PATH  = path.join(KF_DIR, DEST_FILE);

const DRY        = process.argv.includes("--dry-run");

fs.mkdirSync(KF_DIR,   { recursive: true });
fs.mkdirSync(CAND_DIR, { recursive: true });
fs.mkdirSync(QA_DIR,   { recursive: true });

function log(m)  { console.log(`[${new Date().toISOString().slice(11,19)}] ${m}`); }
function warn(m) { console.warn(`[WARN] ${m}`); }
function abort(code, m) { console.error(`\n[ABORT:${code}] ${m}\n`); process.exit(1); }

function fileHash(p) {
  if (!fs.existsSync(p)) return null;
  return crypto.createHash("md5").update(fs.readFileSync(p)).digest("hex");
}
const BASE_HASH = fileHash(BASE_IMG);
const BASE_SIZE = fs.existsSync(BASE_IMG) ? fs.statSync(BASE_IMG).size : 0;

// ── 편집 프롬프트 ─────────────────────────────────────────────────────────
// "Edit" 지시로 기존 이미지를 base로 최소 변경
const PROMPT = `Edit this image to add only a brown crossbody messenger bag to the character named Jun. Change absolutely nothing else.

Specific addition:
- A brown leather crossbody messenger bag
- Its strap crosses Jun's torso diagonally from his left shoulder down to his right hip
- The bag body rests beside his right hip
- The bag must not cover his right hand (which is touching the copier side panel) or his left hand (which hangs empty)

Preserve everything else exactly as-is:
- Jun's face, hair, expression (slight relief mixed with puzzled confusion)
- Jun's costume (light-blue rolled-sleeve shirt, red tie, navy slacks, black dress shoes)
- Jun's pose and action (right hand just finished tapping the copier side panel)
- The sheet of paper coming out of the output tray
- The copier (large gray multifunction copier with ADF lid, right-side control panel, three paper drawers)
- The room (venetian blinds window on left, wooden storage cabinets on right, bright ceiling light, beige tile floor)
- Camera angle, lighting, 3D style, 9:16 vertical format

Strictly forbidden changes:
- White shirt (Jun must keep light-blue shirt)
- Any change to hands, arms, face, expression, or pose
- Any change to the copier, paper, or background
- Any new objects, characters, text, logo, speech bubble, or subtitle
- Any distortion of anatomy or the bag strap`;

// ── CDP 연결 ───────────────────────────────────────────────────────────────
async function isCDPOpen() {
  try {
    const r = await fetch(`http://localhost:${CDP_PORT}/json/version`, { signal: AbortSignal.timeout(2000) });
    return r.ok;
  } catch { return false; }
}

async function ensureChrome() {
  if (await isCDPOpen()) { log("✓ Chrome CDP 이미 열려있음"); return; }
  log("Chrome 실행 중...");
  spawn(CHROME_EXE, [
    `--remote-debugging-port=${CDP_PORT}`,
    `--user-data-dir=${USER_DATA}`,
    "--no-first-run", "--no-default-browser-check",
    "https://chatgpt.com/"
  ], { detached: true, stdio: "ignore" }).unref();
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 500));
    if (await isCDPOpen()) { log("✓ Chrome CDP 연결"); return; }
  }
  abort("cdp_timeout", "Chrome CDP 연결 실패 (15초)");
}

// ── 마지막 assistant 메시지 내부 이미지만 수집 ────────────────────────────
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

// ── 생성 완료 판정 ─────────────────────────────────────────────────────────
async function isAssistantDone(page) {
  return await page.evaluate(() => {
    const spinners = document.querySelectorAll(
      '[data-testid="stop-button"], button[aria-label*="Stop"], button[aria-label*="중지"], ' +
      '.result-streaming, [class*="streaming"]'
    );
    if (spinners.length > 0) return false;
    const turns = document.querySelectorAll('[data-testid^="conversation-turn"]');
    if (turns.length === 0) return true;
    const last = turns[turns.length - 1].textContent || "";
    return !/생성하고 있습니다|만들고 있습니다|Creating image|생성 중|잠시만|이미지를 만드는 중/i.test(last);
  });
}

// ── 중단 조건 감지 ─────────────────────────────────────────────────────────
async function detectStop(page) {
  const STOP = ["You've reached", "You've hit", "message limit", "rate limit",
                "Try again in", "사용 한도", "잠시 후 다시", "Log in", "Sign in", "로그인"];
  for (const ph of STOP) {
    const el = page.getByText(ph, { exact: false }).first();
    if (await el.isVisible({ timeout: 200 }).catch(() => false)) {
      const txt = await el.textContent().catch(() => ph);
      abort("limit_or_login", `중단 조건: "${txt.trim().slice(0, 80)}"`);
    }
  }
  const cap = await page.locator('iframe[src*="recaptcha"], [class*="captcha"]').count();
  if (cap > 0) abort("captcha", "CAPTCHA 감지 — 수동 해제 필요");
}

// ── 이미지 다운로드 ────────────────────────────────────────────────────────
async function downloadBuf(page, src) {
  // 방법 1: Playwright API request (세션 쿠키 자동 포함)
  try {
    const apiReq = page.context().request;
    const resp = await apiReq.get(src);
    if (resp.ok()) {
      const bytes = Array.from(new Uint8Array(await resp.body()));
      if (bytes.length > 10000) return bytes;
    }
  } catch {}

  // 방법 2: page.route intercept + reload
  try {
    const intercepted = [];
    const genPattern = /backend-api\/estuary\/content/;
    await page.route("**/*", async (route) => {
      const req = route.request();
      if (genPattern.test(req.url()) && req.url().includes(src.slice(-30))) {
        try {
          const resp2 = await route.fetch();
          const body = await resp2.body();
          if (body && body.length > 10000) intercepted.push(Array.from(new Uint8Array(body)));
          await route.fulfill({ response: resp2, body });
        } catch { await route.continue().catch(() => {}); }
      } else { await route.continue().catch(() => {}); }
    });
    await page.reload({ waitUntil: "networkidle", timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(2000);
    await page.unroute("**/*").catch(() => {});
    if (intercepted.length > 0) return intercepted[0];
  } catch {}

  // 방법 3: page.evaluate fetch
  const result3 = await page.evaluate(async (u) => {
    try {
      const r = await fetch(u, { credentials: "include" });
      if (!r.ok) return { err: `HTTP ${r.status}` };
      return { bytes: Array.from(new Uint8Array(await r.arrayBuffer())) };
    } catch (e) { return { err: e.message }; }
  }, src).catch(() => null);
  if (result3?.bytes?.length > 0) return result3.bytes;

  return null;
}

// ── 메인 ──────────────────────────────────────────────────────────────────
async function main() {
  log("=== S3 가방 편집 시작 ===");
  log(`base hash: ${BASE_HASH} (${Math.round(BASE_SIZE/1024)}KB)`);
  log(`프롬프트 길이: ${PROMPT.length}자`);
  log(`포함 확인: ${PROMPT.includes("brown crossbody messenger bag")}`);

  if (!fs.existsSync(BASE_IMG)) abort("base_missing", `S3 base 이미지 없음: ${BASE_IMG}`);

  if (DRY) {
    log("[DRY-RUN] 사전 검증 완료.");
    log(`  base: ${BASE_IMG}`);
    log(`  dest: ${DEST_PATH}`);
    log(`  cand: ${CAND_DIR}`);
    log(`  프롬프트: "${PROMPT.slice(0, 100)}..."`);
    log("[DRY-RUN] 외부 호출 0회. 종료.");
    return;
  }

  await ensureChrome();
  const browser = await chromium.connectOverCDP(`http://localhost:${CDP_PORT}`)
    .catch(e => abort("cdp_connect", e.message));

  const ctx = browser.contexts()[0];
  if (!ctx) abort("no_context", "브라우저 컨텍스트 없음");

  const page = await ctx.newPage();
  await page.goto("https://chatgpt.com/", { waitUntil: "domcontentloaded", timeout: 20000 });
  await page.waitForTimeout(1500);

  if (/auth|login/.test(page.url())) abort("login_required", "ChatGPT 로그인 필요");
  await detectStop(page);

  const ta = page.locator("#prompt-textarea").first();
  await ta.waitFor({ state: "visible", timeout: 15000 })
    .catch(() => abort("selector_changed", "입력창 미발견"));
  log("✓ 입력창 확인");

  // ── S3 base 이미지 첨부 ───────────────────────────────────────────────
  log("S3 base 이미지 첨부...");
  let fileInput = page.locator('input[type="file"]').first();
  if (await fileInput.count() === 0) {
    const plusBtn = page.locator('button[aria-label*="파일 추가" i], button[aria-label*="Attach" i]').first();
    if (await plusBtn.count() > 0) await plusBtn.click();
    await page.waitForTimeout(600);
    fileInput = page.locator('input[type="file"]').first();
  }
  if (await fileInput.count() > 0) {
    await fileInput.setInputFiles(BASE_IMG);
    log("✓ S3 base 이미지 첨부 완료");
    await page.waitForTimeout(3000);
  } else {
    abort("file_input_missing", "file input 미발견");
  }

  // baseline 이미지 cid 수집
  const baselineImgs = await page.evaluate(() => {
    function cid(s) { const m = (s||"").match(/[?&]id=([^&]+)/); return m ? m[1] : null; }
    return Array.from(document.querySelectorAll("img"))
      .map(i => ({ cid: cid(i.src), src: i.src.slice(0, 100) }))
      .filter(x => x.cid || x.src);
  });
  const baselineCids = new Set(baselineImgs.map(x => x.cid).filter(Boolean));
  const baselineSrcs = new Set(baselineImgs.map(x => x.src));
  log(`baseline 이미지 cid ${baselineCids.size}개 수집`);

  // ── 이미지 편집 도구 활성화 ───────────────────────────────────────────
  log("이미지 편집 도구 활성화 시도...");
  const plus = page.locator('button[aria-label="파일 추가 및 기타"]').first();
  if (await plus.count() > 0) {
    await plus.click();
    await page.waitForTimeout(1000);
    const imgTool = page.getByRole("menuitemradio", { name: /이미지 만들기|Create image/i }).first();
    if (await imgTool.count() > 0) {
      await imgTool.click();
      await page.waitForTimeout(1000);
      log("✓ 이미지 도구 활성화");
    } else {
      warn("'이미지 만들기' 항목 미발견 — 계속 진행");
      await page.keyboard.press("Escape");
      await page.waitForTimeout(500);
    }
  } else {
    warn("'파일 추가 및 기타' 버튼 미발견 — 계속 진행");
  }

  // ── 프롬프트 입력 ──────────────────────────────────────────────────────
  log("프롬프트 입력...");
  const oneLine = PROMPT.replace(/\s*\n\s*/g, " ").trim();
  await ta.click();
  await ta.fill(oneLine);
  await page.waitForTimeout(1000);
  let typed = (await ta.textContent().catch(() => "") || "").trim();
  if (typed.length < 10) {
    log("fill() 실패 — keyboard.type() 재시도");
    await ta.click();
    await page.keyboard.type(oneLine, { delay: 1 });
    await page.waitForTimeout(1000);
    typed = (await ta.textContent().catch(() => "") || "").trim();
  }
  log(`입력 확인: ${typed.length}자`);
  if (typed.length < 10) abort("input_failed", "프롬프트 입력 실패");
  if (!typed.includes("brown crossbody messenger bag")) abort("prompt_check_failed", "프롬프트 핵심 문구 누락");

  await detectStop(page);

  // ── 전송 (정확히 1회, Enter 재입력 없음) ──────────────────────────────
  const beforeTurns = await page.locator('[data-testid^="conversation-turn"]').count();
  const sendBtn = page.locator(
    '#composer-submit-button, button[data-testid="send-button"], ' +
    'button[aria-label="Send message"], button[aria-label="메시지 보내기"]'
  ).first();
  if (await sendBtn.count() > 0 && await sendBtn.isEnabled().catch(() => false)) {
    await sendBtn.click();
    log("✓ 전송 버튼 클릭 (1회)");
  } else {
    await ta.press("Enter");
    log("✓ Enter 전송 (1회)");
  }
  // ※ 재전송 로직 없음

  let sent = false;
  for (let i = 0; i < 20; i++) {
    await page.waitForTimeout(500);
    if (await page.locator('[data-testid^="conversation-turn"]').count() > beforeTurns) {
      sent = true; break;
    }
  }
  if (!sent) abort("send_failed", "전송 실패 — turn 증가 없음 (재전송 없음)");
  log("✓ 전송 확인 — 생성 대기 (최대 300초)");

  // ── 생성 완료 대기 + 안정화 판정 ──────────────────────────────────────
  let result   = "timeout";
  let savedBuf = null;
  const startTime = Date.now();

  let stableKey   = null;
  let stableCount = 0;
  const STABLE_NEEDED = 3;
  const savedCandidates = [];

  outer: while (Date.now() - startTime < 300_000) {
    await page.waitForTimeout(4000);
    await detectStop(page);
    const elapsed = Date.now() - startTime;

    const lastTxt = await page.locator('[data-testid^="conversation-turn"]').last().textContent().catch(() => "");
    if (/텍스트 기반|이미지를 직접 렌더링|이미지를 만들 수 없|이미지를 생성할 수 없|프롬프트를 작성해 드릴/i.test(lastTxt)) {
      result = "text_refused"; break;
    }

    if (elapsed < 20000) { log(`  대기 ${Math.round(elapsed/1000)}s (최소대기)`); continue; }

    const done = await isAssistantDone(page);
    const assistantImgs = await collectLastAssistantImages(page);
    const newCands = assistantImgs.filter(x =>
      x.gen && x.w >= 400 && x.h >= x.w &&
      x.cid && !baselineCids.has(x.cid) &&
      !baselineSrcs.has(x.src.slice(0, 100))
    );

    if (newCands.length > 0) {
      const top = newCands[newCands.length - 1];
      const key = `${top.cid}|${top.w}|${top.h}`;

      if (key === stableKey) {
        stableCount++;
        log(`  후보 안정화 ${stableCount}/${STABLE_NEEDED} (${top.cid?.slice(0,8)})`);
      } else {
        stableKey   = key;
        stableCount = 1;
        log(`  신규 후보 감지 (${top.cid?.slice(0,8)}) — 카운터 초기화`);
      }

      if (stableCount >= STABLE_NEEDED && done) {
        log(`✓ 안정화 완료 + 응답 완료 — 15초 최종 대기`);
        await page.waitForTimeout(15000);

        const verifyImgs = await collectLastAssistantImages(page);
        const verifyCands = verifyImgs.filter(x =>
          x.gen && x.w >= 400 && x.h >= x.w && x.cid && !baselineCids.has(x.cid)
        );
        const verifyTop = verifyCands.length > 0 ? verifyCands[verifyCands.length - 1] : null;
        const verifyKey = verifyTop ? `${verifyTop.cid}|${verifyTop.w}|${verifyTop.h}` : null;

        if (verifyKey !== stableKey) {
          warn(`15초 후 후보 불일치 — 안정화 재개`);
          stableCount = 0; stableKey = null;
          continue;
        }
        log(`✓ 15초 재검증 통과 (${verifyTop.cid?.slice(0,8)})`);

        for (const [j, cand] of verifyCands.entries()) {
          const ts = Date.now();
          const candFile = `s3_bag_edit_${ts}_${j+1}.png`;
          const candPath = path.join(CAND_DIR, candFile);
          const buf = await downloadBuf(page, cand.src);
          if (!buf || buf.length < 10000) { warn(`후보 ${j+1} 다운로드 실패`); continue; }

          fs.writeFileSync(candPath, Buffer.from(buf));
          const hash    = fileHash(candPath);
          const sz      = fs.statSync(candPath).size;
          const isClone = (hash === BASE_HASH);
          log(`  후보 ${j+1}: ${candFile} (${Math.round(sz/1024)}KB) hash=${hash?.slice(0,12)} clone=${isClone}`);

          savedCandidates.push({ file: candFile, path: candPath, hash, size: sz, isClone });

          if (!isClone && !savedBuf) {
            savedBuf = buf;
            fs.writeFileSync(DEST_PATH, Buffer.from(buf));
            log(`✓ 저장 완료: ${DEST_FILE} (${Math.round(sz/1024)}KB) — human QA 대기`);
            result = "candidate_saved";
          }
        }
        break outer;
      }
    } else {
      stableCount = 0; stableKey = null;
    }

    const generating = /생성하고 있습니다|만들고 있습니다|Creating image|생성 중|잠시만|이미지를 만드는 중/i.test(lastTxt);
    log(`  ${Math.round(elapsed/1000)}s | 후보:${newCands.length} stable:${stableCount} done:${done}${generating ? " [생성중]" : ""}`);
  }

  if (result === "timeout") {
    warn("300초 타임아웃 — 탭 유지. PENDING_RECOVERY 보고.");
  } else {
    await page.close();
  }

  await browser.close();
  log("CDP 연결 해제");

  // ── QA detail sheet 생성 (PASS 후보가 있을 때만) ──────────────────────
  if (result === "candidate_saved" && fs.existsSync(DEST_PATH) && fs.existsSync(BASE_IMG)) {
    log("비교 detail sheet 생성 중...");
    const { execSync } = await import("child_process");
    const sheetPath = path.join(QA_DIR, "s3_bag_edit_comparison.png");
    try {
      execSync(
        `ffmpeg -y -i "${BASE_IMG}" -i "${DEST_PATH}" ` +
        `-filter_complex "[0:v]scale=540:-1,drawtext=text='BEFORE (v2 no bag)':x=10:y=10:fontsize=28:fontcolor=white:box=1:boxcolor=black@0.5[l];` +
        `[1:v]scale=540:-1,drawtext=text='AFTER (v3 bag added)':x=10:y=10:fontsize=28:fontcolor=white:box=1:boxcolor=black@0.5[r];` +
        `[l][r]hstack" "${sheetPath}"`,
        { stdio: "pipe" }
      );
      log(`✓ 비교 sheet: ${sheetPath}`);
    } catch (e) {
      warn(`detail sheet 생성 실패: ${e.message?.slice(0,80)}`);
    }
  }

  // ── 최종 보고 ──────────────────────────────────────────────────────────
  console.log("\n\n=== S3 가방 편집 결과 ===");
  console.log(`결과: ${result}`);
  console.log(`GPT image 제출 횟수: 1회`);
  console.log(`직접 비용: $0 (웹 구독 quota 소비)`);

  if (result === "candidate_saved") {
    const sizeKB = Math.round(fs.statSync(DEST_PATH).size / 1024);
    const destHash = fileHash(DEST_PATH);
    console.log(`\n저장 파일: ${DEST_FILE} (${sizeKB}KB)`);
    console.log(`MD5: ${destHash}`);
    console.log(`후보 디렉토리: ${CAND_DIR}`);
    console.log(`비교 sheet: ${path.join(QA_DIR, "s3_bag_edit_comparison.png")}`);
    console.log("\n=== [ Owner 육안 QA 필요 ] ===");
    console.log("PASS 조건 (모두 충족 시에만):");
    console.log("  □ 갈색 크로스바디 메신저백 — 어깨에서 반대쪽 허리 방향 스트랩, 오른쪽 엉덩이 옆 본체");
    console.log("  □ 오른손 복사기 두드리기 행동 보존 (가방이 가리지 않음)");
    console.log("  □ 왼손 빈 상태 보존");
    console.log("  □ 출력 중인 용지 보존");
    console.log("  □ 의상: 하늘색 셔츠, 빨간 넥타이, 네이비 슬랙스 보존 (흰 셔츠 즉시 FAIL)");
    console.log("  □ 얼굴·표정·헤어 보존");
    console.log("  □ 복사기·배경·조명·구도 변경 없음");
    console.log("  □ 세로 9:16, 텍스트·로고 없음");
    console.log("  □ base hash 다름 (clone 아님)");
    console.log("\nFAIL 조건 (하나라도 해당 시 FAIL):");
    console.log("  ✗ 흰 셔츠");
    console.log("  ✗ 오른손 행동 변경 또는 가방이 손을 가림");
    console.log("  ✗ 배경·복사기·카메라 변경");
    console.log("  ✗ 스트랩 왜곡·가방 형태 비정상");
    console.log("  ✗ base와 동일 hash (clone)");
  } else if (result === "timeout") {
    console.log("\n→ PENDING_RECOVERY: 탭 열린 상태 유지.");
    console.log(`  후보 경로: ${CAND_DIR}`);
  } else if (result === "text_refused") {
    console.log("\n→ TEXT_REFUSED: GPT가 이미지 편집 거절. 추가 호출 없음.");
  }

  console.log("\n=== 후보 목록 ===");
  savedCandidates.forEach((c, i) => {
    console.log(`  [${i+1}] ${c.file} | ${Math.round(c.size/1024)}KB | hash=${c.hash} | clone=${c.isClone}`);
  });

  console.log(`\nS4·S5·Veo·TTS 실행: 없음`);
}

main().catch(e => { console.error("[FATAL]", e.message); process.exit(1); });
