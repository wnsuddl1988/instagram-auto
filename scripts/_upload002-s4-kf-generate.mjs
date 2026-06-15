/**
 * upload_002_copier S4 키프레임 생성
 *
 * - ANCHOR: S3 v2 PASS (kf_s3_tapping_relief_v2.png)
 * - DEST_FILE: kf_s4_paper_pile_button.png
 * - CAND_DIR: s4_candidates
 * - PROMPT: S4 — 이미 종이가 쌓인 채로 준이 정지 버튼 반복 누름
 *
 * CONTRACT 제약 (S4):
 * - paper_pile: 시작부터 이미 종이 쌓여있음. 실시간 폭발·낙하 생성 금지.
 *
 * Owner 승인: S4 GPT 이미지 1회
 * - GPT web image 생성: 정확히 1회
 * - 직접 유료 API 호출: $0
 * - 자동 재제출·Enter 재입력 없음
 * - S5·Veo·TTS 금지
 * - 타임아웃 시 탭 유지 + intercept 회수 시도 → PENDING_RECOVERY 보고
 *
 * 사용: node scripts/_upload002-s4-kf-generate.mjs [--dry-run]
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
const CAND_DIR   = path.join(KF_DIR, "s4_candidates");

const ANCHOR_S3  = path.join(KF_DIR, "kf_s3_tapping_relief_v2.png");
const DEST_FILE  = "kf_s4_paper_pile_button.png";
const DEST_PATH  = path.join(KF_DIR, DEST_FILE);

const DRY        = process.argv.includes("--dry-run");

fs.mkdirSync(KF_DIR,   { recursive: true });
fs.mkdirSync(CAND_DIR, { recursive: true });

function log(m)  { console.log(`[${new Date().toISOString().slice(11,19)}] ${m}`); }
function warn(m) { console.warn(`[WARN] ${m}`); }
function abort(code, m) { console.error(`\n[ABORT:${code}] ${m}\n`); process.exit(1); }

function fileHash(p) {
  if (!fs.existsSync(p)) return null;
  return crypto.createHash("md5").update(fs.readFileSync(p)).digest("hex");
}
const ANCHOR_HASH = fileHash(ANCHOR_S3);
const ANCHOR_SIZE = fs.existsSync(ANCHOR_S3) ? fs.statSync(ANCHOR_S3).size : 0;

// ── S4 프롬프트 ────────────────────────────────────────────────────────────
const PROMPT = `Draw a new scene in the same copy room shown in the attached image.

Environment and copier must exactly match the attached image:
- venetian blinds window on the left
- wooden storage cabinets on the right
- bright ceiling light
- beige tile floor
- same large gray multifunction copier with ADF lid, right-side control panel, three paper drawers

Character must exactly match the attached image:
Jun — round face, large brown eyes, black side-part hair, light-blue rolled-sleeve shirt, loose red tie, long navy slacks, black dress shoes, brown crossbody messenger bag.

New scene — follow exactly:
A large pile of printed paper already fills the output tray and spills onto the floor beside the copier. The pile is thick and clearly visible. The copier is still actively printing, feeding out one more sheet. Jun is standing at the right side of the copier, pressing the stop button on the control panel repeatedly with his index finger. His posture is tense and tired, leaning slightly toward the panel. His expression is exhausted and flustered — not angry, just overwhelmed and confused.

The paper pile must already be there from the start of the scene — it is NOT falling from the air, NOT exploding outward, NOT a sudden burst. It simply exists as a large static pile on the tray and floor. The viewer must understand the situation immediately without sound.

Medium-wide shot showing Jun, the copier, and the paper pile clearly. Cute comedic semi-deformed 3D animated style, adult office worker. Vertical 9:16 format.

Do not change the copier, room, or Jun's costume.
STRICT BANS: white shirt, paper flying or falling through the air, paper exploding outward, empty floor, paper pile that appears to be mid-motion, glass partition, corkboard, readable text, logo, speech bubble, model sheet, multi-panel image, new character, horizontal format.`;

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

// ── 마지막 assistant 메시지 이미지 수집 ────────────────────────────────────
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

// ── intercept 방식 회수 (타임아웃 fallback) ────────────────────────────────
async function interceptRecover(page, convUrl) {
  log("intercept 회수 시작 (page.route + reload)...");
  const intercepted = new Map();
  const genPattern  = /backend-api\/estuary\/content/;

  // 대화 URL로 이동 (이미 있으면 유지)
  if (convUrl && !page.url().includes(convUrl.split("/c/")[1]?.slice(0, 8) || "")) {
    log(`대화 URL로 이동: ${convUrl}`);
    await page.goto(convUrl, { waitUntil: "domcontentloaded", timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(3000);
  }

  await page.route("**/*", async (route) => {
    const req = route.request();
    if (genPattern.test(req.url()) && req.resourceType() === "image") {
      try {
        const resp = await route.fetch();
        const body = await resp.body();
        if (body && body.length > 10000) {
          intercepted.set(req.url(), body);
          log(`  intercept: ${req.url().slice(0, 80)} (${Math.round(body.length/1024)}KB)`);
        }
        await route.fulfill({ response: resp, body });
      } catch { await route.continue().catch(() => {}); }
    } else {
      await route.continue().catch(() => {});
    }
  });

  await page.reload({ waitUntil: "networkidle", timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(4000);
  log(`intercept 수집: ${intercepted.size}개`);
  await page.unroute("**/*").catch(() => {});
  return intercepted;
}

// ── 메인 ──────────────────────────────────────────────────────────────────
async function main() {
  log("=== S4 키프레임 생성 시작 (S3 v2 reference) ===");
  log(`S3 anchor hash: ${ANCHOR_HASH} (${Math.round(ANCHOR_SIZE/1024)}KB)`);

  if (!fs.existsSync(ANCHOR_S3)) abort("anchor_missing", `S3 v2 anchor 없음: ${ANCHOR_S3}`);

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

  if (DRY) {
    log("[DRY-RUN] 입력창 확인 완료. 생성 0회.");
    await page.close();
    await browser.close();
    return;
  }

  // ── S3 anchor 첨부 ────────────────────────────────────────────────────
  log("S3 v2 anchor 첨부...");
  let fileInput = page.locator('input[type="file"]').first();
  if (await fileInput.count() === 0) {
    const plusBtn = page.locator('button[aria-label*="파일 추가" i], button[aria-label*="Attach" i]').first();
    if (await plusBtn.count() > 0) await plusBtn.click();
    await page.waitForTimeout(600);
    fileInput = page.locator('input[type="file"]').first();
  }
  if (await fileInput.count() > 0) {
    await fileInput.setInputFiles(ANCHOR_S3);
    log("✓ S3 v2 anchor 첨부 완료");
    await page.waitForTimeout(3000);
  } else {
    abort("file_input_missing", "file input 미발견");
  }

  // baseline cid 수집
  const baselineImgs = await page.evaluate(() => {
    function cid(s) { const m = (s||"").match(/[?&]id=([^&]+)/); return m ? m[1] : null; }
    return Array.from(document.querySelectorAll("img"))
      .map(i => ({ cid: cid(i.src), src: i.src.slice(0, 100) }))
      .filter(x => x.cid || x.src);
  });
  const baselineCids = new Set(baselineImgs.map(x => x.cid).filter(Boolean));
  const baselineSrcs = new Set(baselineImgs.map(x => x.src));
  log(`baseline cid ${baselineCids.size}개`);

  // ── 이미지 생성 도구 활성화 ────────────────────────────────────────────
  log("이미지 생성 도구 활성화...");
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

  await detectStop(page);

  // ── 전송 (정확히 1회) ──────────────────────────────────────────────────
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

  let sent = false;
  for (let i = 0; i < 20; i++) {
    await page.waitForTimeout(500);
    if (await page.locator('[data-testid^="conversation-turn"]').count() > beforeTurns) {
      sent = true; break;
    }
  }
  if (!sent) abort("send_failed", "전송 실패 — turn 증가 없음 (재전송 없음)");
  log("✓ 전송 확인 — 생성 대기 (최대 300초)");

  // ── 생성 완료 대기 + 안정화 ────────────────────────────────────────────
  let result   = "timeout";
  let convUrl  = null;
  const startTime = Date.now();
  let stableKey   = null;
  let stableCount = 0;
  const STABLE_NEEDED = 3;
  const savedCandidates = [];

  outer: while (Date.now() - startTime < 300_000) {
    await page.waitForTimeout(4000);
    await detectStop(page);
    const elapsed = Date.now() - startTime;

    // 현재 대화 URL 추적
    const curUrl = page.url();
    if (curUrl.includes("/c/")) convUrl = curUrl;

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
        stableKey = key; stableCount = 1;
        log(`  신규 후보 감지 (${top.cid?.slice(0,8)})`);
      }

      if (stableCount >= STABLE_NEEDED && done) {
        log(`✓ 안정화 완료 + 응답 완료 — 15초 최종 대기`);
        await page.waitForTimeout(15000);

        const verifyImgs = await collectLastAssistantImages(page);
        const verifyCands = verifyImgs.filter(x =>
          x.gen && x.w >= 400 && x.h >= x.w && x.cid && !baselineCids.has(x.cid)
        );
        const verifyTop  = verifyCands.length > 0 ? verifyCands[verifyCands.length - 1] : null;
        const verifyKey  = verifyTop ? `${verifyTop.cid}|${verifyTop.w}|${verifyTop.h}` : null;

        if (verifyKey !== stableKey) {
          warn("15초 후 후보 불일치 — 안정화 재개");
          stableCount = 0; stableKey = null;
          continue;
        }
        log(`✓ 15초 후 재검증 통과 (${verifyTop.cid?.slice(0,8)})`);

        for (const [j, cand] of verifyCands.entries()) {
          const ts       = Date.now();
          const candFile = `s4_candidate_${ts}_${j+1}.png`;
          const candPath = path.join(CAND_DIR, candFile);
          const buf = await page.evaluate(async (u) => {
            try {
              const r = await fetch(u);
              if (!r.ok) return null;
              return Array.from(new Uint8Array(await r.arrayBuffer()));
            } catch { return null; }
          }, cand.src);

          if (!buf || buf.length < 10000) {
            warn(`후보 ${j+1} 직접 fetch 실패 — intercept fallback 필요`);
            result = "need_intercept";
            break outer;
          }
          fs.writeFileSync(candPath, Buffer.from(buf));
          const hash    = fileHash(candPath);
          const sz      = fs.statSync(candPath).size;
          const isClone = (hash === ANCHOR_HASH);
          log(`  후보 ${j+1}: ${candFile} (${Math.round(sz/1024)}KB) hash=${hash?.slice(0,12)} clone=${isClone}`);
          savedCandidates.push({ file: candFile, path: candPath, hash, size: sz, isClone });
          if (!isClone && result !== "candidate_saved") {
            fs.writeFileSync(DEST_PATH, Buffer.from(buf));
            log(`✓ 저장: ${DEST_FILE} (${Math.round(sz/1024)}KB)`);
            result = "candidate_saved";
          }
        }
        if (result === "candidate_saved") break outer;
      }
    } else {
      stableCount = 0; stableKey = null;
    }

    const generating = /생성하고 있습니다|만들고 있습니다|Creating image|생성 중|잠시만|이미지를 만드는 중/i.test(lastTxt);
    log(`  ${Math.round(elapsed/1000)}s | 후보:${newCands.length} stable:${stableCount} done:${done}${generating ? " [생성중]" : ""}`);
  }

  // ── intercept fallback ─────────────────────────────────────────────────
  if (result === "timeout" || result === "need_intercept") {
    log(`결과: ${result} → intercept 방식 회수 시도`);
    convUrl = convUrl || page.url();
    const intercepted = await interceptRecover(page, convUrl);

    for (const [j, [src, body]] of [...intercepted.entries()].entries()) {
      const ts       = Date.now();
      const candFile = `s4_intercept_${ts}_${j+1}.png`;
      const candPath = path.join(CAND_DIR, candFile);
      fs.writeFileSync(candPath, body);
      const hash    = fileHash(candPath);
      const sz      = fs.statSync(candPath).size;
      const isClone = (hash === ANCHOR_HASH);
      log(`  intercept 후보 ${j+1}: ${candFile} (${Math.round(sz/1024)}KB) hash=${hash?.slice(0,12)} clone=${isClone}`);
      savedCandidates.push({ file: candFile, path: candPath, hash, size: sz, isClone, src });
      if (!isClone && result !== "candidate_saved") {
        fs.writeFileSync(DEST_PATH, body);
        log(`✓ intercept 저장: ${DEST_FILE} (${Math.round(sz/1024)}KB)`);
        result = "candidate_saved";
      }
    }
    if (result !== "candidate_saved") warn("intercept도 실패 — PENDING_RECOVERY");
  }

  if (result !== "timeout") {
    await page.close().catch(() => {});
  }
  await browser.close();
  log("CDP 연결 해제");

  // ── 최종 보고 ──────────────────────────────────────────────────────────
  console.log("\n\n=== S4 키프레임 생성 결과 ===");
  console.log(`결과: ${result}`);
  console.log(`GPT image 제출 횟수: 1회 (S3 v2 reference)`);

  if (result === "candidate_saved") {
    const sz = fs.existsSync(DEST_PATH) ? Math.round(fs.statSync(DEST_PATH).size/1024) : 0;
    console.log(`\n저장 파일: ${DEST_FILE} (${sz}KB)`);
    console.log(`후보 디렉토리: ${CAND_DIR}`);
    console.log("\n=== [ Owner 육안 PASS/FAIL QA 필요 ] ===");
    console.log("PASS 조건 (전체 충족 필수):");
    console.log("  □ 복사기·배경: S1~S3와 동일 복사실, 동일 MFC");
    console.log("  □ 준 의상: 하늘색 셔츠(흰 셔츠 즉시 FAIL), 빨간 넥타이, 네이비 슬랙스, 검정 구두, 갈색 가방");
    console.log("  □ 종이 더미: 이미 쌓여있음 (트레이+바닥), 폭발·낙하 중 아님");
    console.log("  □ 복사기 출력 중: 용지 한 장 나오고 있음");
    console.log("  □ 준 행동: 정지 버튼 누르는 자세 (손가락이 패널에 닿거나 향함)");
    console.log("  □ 표정: 지침+당황, 과장 없음");
    console.log("  □ 무음으로도 상황 즉시 파악 가능");
    console.log("  □ 세로 9:16, 텍스트·로고·말풍선 없음");
    console.log("즉시 FAIL:");
    console.log("  ✗ 흰 셔츠");
    console.log("  ✗ 종이가 공중에 날거나 폭발");
    console.log("  ✗ 바닥이 비어있거나 종이 거의 없음");
    console.log("  ✗ 다른 배경·복사기");
  } else {
    console.log(`\n→ ${result}`);
    if (result === "timeout") console.log("  탭 열린 상태 유지. PENDING_RECOVERY.");
  }

  console.log("\n=== 후보 목록 ===");
  savedCandidates.forEach((c, i) =>
    console.log(`  [${i+1}] ${c.file} | ${Math.round(c.size/1024)}KB | hash=${c.hash} | clone=${c.isClone}`)
  );
  console.log("\n호출 수: 1회 (GPT web subscription quota 소비)");
  console.log("직접 유료 API 호출: $0");
  console.log("S5·Veo·TTS 실행: 없음");
}

main().catch(e => { console.error("[FATAL]", e.message); process.exit(1); });
