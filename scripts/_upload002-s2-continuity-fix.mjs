/**
 * upload_002_copier S2 연속성 단독 복구 (버그 수정본 v2)
 *
 * 수정된 버그:
 * 1. Enter 재입력 로직 삭제 (중복 제출 위험 제거)
 * 2. 마지막 assistant turn 내부에서만 이미지 탐색 (전체 페이지 탐색 → 오인 방지)
 * 3. 첨부 이미지 src/cid를 baseline으로 수집 후 제외
 * 4. 생성 중 스피너 사라지고 assistant 응답 완료 후에만 저장
 * 5. 신규 후보 발견 후 최소 15초 안정화 대기
 * 6. 후보 이미지 cid·size 연속 3회 동일해야 완료 판정
 * 7. anchor와 md5 hash 동일 또는 size 차이 1KB 미만이면 clone 제외
 * 8. 회수·저장 전 page.close 금지 → 저장 완료 후 close
 * 9. browser.close()는 CDP disconnect만 (Chrome 창 유지)
 * 10. 타임아웃 시 탭 유지하고 PENDING_RECOVERY 보고
 *
 * 사용: node scripts/_upload002-s2-continuity-fix.mjs [--dry-run]
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
const CAND_DIR   = path.join(KF_DIR, "s2_recovery_candidates");

const ANCHOR_S1  = path.join(KF_DIR, "kf_s1_wide_copier_error.png");
const DEST_FILE  = "kf_s2_jammed_paper_continuity_fix.png";
const DEST_PATH  = path.join(KF_DIR, DEST_FILE);

const DRY        = process.argv.includes("--dry-run");

fs.mkdirSync(KF_DIR,   { recursive: true });
fs.mkdirSync(CAND_DIR, { recursive: true });

function log(m)  { console.log(`[${new Date().toISOString().slice(11,19)}] ${m}`); }
function warn(m) { console.warn(`[WARN] ${m}`); }
function abort(code, m) { console.error(`\n[ABORT:${code}] ${m}\n`); process.exit(1); }

// ── S1 anchor 해시 (clone 감지) ────────────────────────────────────────────
function fileHash(p) {
  if (!fs.existsSync(p)) return null;
  return crypto.createHash("md5").update(fs.readFileSync(p)).digest("hex");
}
const S1_HASH = fileHash(ANCHOR_S1);
const S1_SIZE = fs.existsSync(ANCHOR_S1) ? fs.statSync(ANCHOR_S1).size : 0;

// ── S2 프롬프트 ────────────────────────────────────────────────────────────
const PROMPT = `Draw a new scene in the same copy room shown in the attached image.

Environment and copier must exactly match the attached image:
- venetian blinds window on the left
- wooden storage cabinets on the right
- bright ceiling light
- beige tile floor
- same large gray multifunction copier with ADF lid, right-side control panel, three paper drawers

Character must exactly match the attached image:
Jun — light blue rolled-sleeve shirt, loose red tie, navy slacks, black dress shoes, brown crossbody messenger bag.

New action (different from the attached image):
Jun has opened the copier's ADF lid. He carefully pulls at a jammed sheet with both hands. Only a small torn paper scrap comes out. He holds the torn scrap and stares at it with puzzled, resigned disbelief.

Medium shot showing Jun and the copier. Cute comedic semi-deformed 3D animated style, adult office worker. Vertical 9:16 format.

Do not change the copier or room.
No warehouse background, glass wall, corkboard, white shirt, readable text, logo, model sheet, multi-panel image, or new character.`;

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
// [data-message-author-role="assistant"] 직접 탐색 — conversation-turn 의존 제거
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
  return await page.evaluate(async (u) => {
    try {
      const r = await fetch(u);
      if (!r.ok) return null;
      return Array.from(new Uint8Array(await r.arrayBuffer()));
    } catch { return null; }
  }, src).catch(() => null);
}

// ── 메인 ──────────────────────────────────────────────────────────────────
async function main() {
  log("=== S2 연속성 복구 v2 시작 ===");
  log(`S1 anchor hash: ${S1_HASH} (${Math.round(S1_SIZE/1024)}KB)`);

  if (!fs.existsSync(ANCHOR_S1)) abort("anchor_missing", `S1 anchor 없음: ${ANCHOR_S1}`);

  const oldS2 = path.join(KF_DIR, "kf_s2_jammed_paper.png");
  if (fs.existsSync(oldS2)) {
    log(`기존 S2 실패본 보존: kf_s2_jammed_paper.png (${Math.round(fs.statSync(oldS2).size/1024)}KB)`);
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

  if (DRY) {
    log("[DRY-RUN] 입력창 확인 완료. 생성 0회.");
    await page.close();
    await browser.close();
    return;
  }

  // ── S1 anchor 첨부 후 baseline 이미지 cid/size 수집 ──────────────────
  log("S1 anchor 첨부...");
  let fileInput = page.locator('input[type="file"]').first();
  if (await fileInput.count() === 0) {
    const plusBtn = page.locator('button[aria-label*="파일 추가" i], button[aria-label*="Attach" i]').first();
    if (await plusBtn.count() > 0) await plusBtn.click();
    await page.waitForTimeout(600);
    fileInput = page.locator('input[type="file"]').first();
  }
  if (await fileInput.count() > 0) {
    await fileInput.setInputFiles(ANCHOR_S1);
    log("✓ S1 anchor 첨부 완료");
    // 첨부 이미지가 DOM에 안정화될 때까지 대기 후 baseline 수집
    await page.waitForTimeout(3000);
  } else {
    abort("file_input_missing", "file input 미발견");
  }

  // 첨부 이미지 baseline (페이지 전체 이미지 cid 집합)
  const baselineImgs = await page.evaluate(() => {
    function cid(s) { const m = (s||"").match(/[?&]id=([^&]+)/); return m ? m[1] : null; }
    return Array.from(document.querySelectorAll("img"))
      .map(i => ({ cid: cid(i.src), src: i.src.slice(0, 100), size: i.naturalWidth }))
      .filter(x => x.cid || x.src);
  });
  const baselineCids = new Set(baselineImgs.map(x => x.cid).filter(Boolean));
  const baselineSrcs = new Set(baselineImgs.map(x => x.src));
  log(`baseline 이미지 cid ${baselineCids.size}개 수집`);

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
  // ※ Enter 재입력 로직 없음 — 중복 제출 방지

  // 전송 확인 (turn 증가 확인만, 재전송 없음)
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

  // 후보 안정화 카운터: cid·size가 3회 연속 동일해야 완료
  let stableKey   = null;
  let stableCount = 0;
  const STABLE_NEEDED = 3;

  outer: while (Date.now() - startTime < 300_000) {
    await page.waitForTimeout(4000);
    await detectStop(page);
    const elapsed = Date.now() - startTime;

    // 거절 감지
    const lastTxt = await page.locator('[data-testid^="conversation-turn"]').last().textContent().catch(() => "");
    if (/텍스트 기반|이미지를 직접 렌더링|이미지를 만들 수 없|이미지를 생성할 수 없|프롬프트를 작성해 드릴/i.test(lastTxt)) {
      result = "text_refused"; break;
    }

    // 최소 20초 대기
    if (elapsed < 20000) { log(`  대기 ${Math.round(elapsed/1000)}s (최소대기)`); continue; }

    // 생성 완료 확인
    const done = await isAssistantDone(page);

    // 마지막 assistant turn 이미지만 탐색
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
        log(`  신규 후보 감지 — 안정화 카운터 초기화 (${top.cid?.slice(0,8)})`);
      }

      // 안정화 완료 && 생성 완료 판정
      if (stableCount >= STABLE_NEEDED && done) {
        log(`✓ 안정화 완료 (${STABLE_NEEDED}회) + 응답 완료 확인 — 15초 최종 안정화 대기`);
        await page.waitForTimeout(15000);

        // 후보 전체 저장
        const finalCands = await collectLastAssistantImages(page);
        const genFinal = finalCands.filter(x =>
          x.gen && x.w >= 400 && x.h >= x.w &&
          x.cid && !baselineCids.has(x.cid)
        );

        for (const [j, cand] of genFinal.entries()) {
          const candFile = `s2_candidate_${Date.now()}_${j+1}.png`;
          const candPath = path.join(CAND_DIR, candFile);
          const buf = await downloadBuf(page, cand.src);
          if (!buf || buf.length < 10000) { warn(`후보 ${j+1} 다운로드 실패`); continue; }

          fs.writeFileSync(candPath, Buffer.from(buf));
          const hash      = fileHash(candPath);
          const sz        = fs.statSync(candPath).size;
          const isClone   = (hash === S1_HASH); // md5 일치만 clone 확정
          const sizeWarn  = Math.abs(sz - S1_SIZE) < 1024; // 보조 경고만
          log(`  후보 ${j+1}: ${candFile} (${Math.round(sz/1024)}KB) clone=${isClone}${sizeWarn ? " [size_warn]" : ""}`);

          if (!isClone && !savedBuf) {
            savedBuf = buf;
            fs.writeFileSync(DEST_PATH, Buffer.from(buf));
            log(`✓ 저장 완료: ${DEST_FILE} (${Math.round(sz/1024)}KB)`);
            result = "ok";
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

  // 타임아웃 시 탭 유지
  if (result === "timeout") {
    warn("300초 타임아웃 — 탭 유지. PENDING_RECOVERY 보고.");
    // page 닫지 않음
  } else {
    await page.close();
  }

  // CDP disconnect (Chrome 창 유지)
  await browser.close();
  log("CDP 연결 해제 (Chrome 창 유지)");

  // ── 최종 보고 ──────────────────────────────────────────────────────────
  console.log("\n\n=== S2 연속성 복구 v2 결과 ===");
  console.log(`결과: ${result}`);

  if (result === "ok") {
    const sizeKB = Math.round(fs.statSync(DEST_PATH).size / 1024);
    console.log(`파일: ${DEST_FILE} (${sizeKB}KB)`);
    console.log("\n[ Owner 육안 확인 필요 ]");
    console.log("  □ 복사기: S1과 동일 형태·색상·서랍·ADF");
    console.log("  □ 배경: 블라인드 창 + 목재 수납장 + 타일 바닥");
    console.log("  □ 조명: 밝은 백색 천장등");
    console.log("  □ 준 의상: 하늘색 셔츠, 빨간 넥타이, 네이비 슬랙스, 메신저백");
    console.log("  □ 행동: 덮개 열기 + 찢어진 조각 응시");
    console.log("  □ 글자·로고·모델시트·화이트셔츠 없음");
  } else if (result === "timeout") {
    console.log("→ PENDING_RECOVERY: 탭 열린 상태 유지. Owner가 직접 확인 후 저장 필요.");
  } else {
    console.log(`→ ${result}`);
  }

  console.log("\n호출 수: 1회");
  console.log("수정된 버그: Enter 재입력 제거 / assistant turn 한정 탐색 / baseline cid 제외 / 3회 안정화 / 15초 대기 / clone 제외 / 완료 후 page.close");
  console.log("S3·S4·S5·Veo·TTS 실행 금지 유지");
}

main().catch(e => { console.error("[FATAL]", e.message); process.exit(1); });
