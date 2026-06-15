/**
 * upload_002_copier S3 연속성 단독 복구
 *
 * 기반: _upload002-s2-continuity-fix.mjs v2 (검증된 버그 수정본)
 * 주요 변경:
 * - ANCHOR: S2 continuity-fix (kf_s2_jammed_paper_continuity_fix.png) 기준
 * - DEST_FILE: kf_s3_tapping_relief_continuity_fix.png
 * - CAND_DIR: s3_recovery_candidates
 * - PROMPT: S3 액션 — Jun이 복사기 옆면을 손바닥으로 가볍게 두드림, 복사기 작동 중, 안도+약간 황당
 *
 * Owner 승인 경계:
 * - GPT web image 생성: 정확히 1회
 * - 직접 유료 API 호출: $0
 * - S4/S5/Veo/TTS 등 다른 외부 호출 없음
 * - 자동 재제출 없음
 * - 타임아웃 시 탭 유지 + PENDING_RECOVERY 보고
 *
 * 사용: node scripts/_upload002-s3-continuity-fix.mjs [--dry-run]
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
const CAND_DIR   = path.join(KF_DIR, "s3_recovery_candidates");

// S3 복구의 anchor는 S2 continuity-fix PASS 이미지
const ANCHOR_S2  = path.join(KF_DIR, "kf_s2_jammed_paper_continuity_fix.png");
const DEST_FILE  = "kf_s3_tapping_relief_continuity_fix.png";
const DEST_PATH  = path.join(KF_DIR, DEST_FILE);

const DRY        = process.argv.includes("--dry-run");

fs.mkdirSync(KF_DIR,   { recursive: true });
fs.mkdirSync(CAND_DIR, { recursive: true });

function log(m)  { console.log(`[${new Date().toISOString().slice(11,19)}] ${m}`); }
function warn(m) { console.warn(`[WARN] ${m}`); }
function abort(code, m) { console.error(`\n[ABORT:${code}] ${m}\n`); process.exit(1); }

// ── anchor 해시 (clone 감지) ───────────────────────────────────────────────
function fileHash(p) {
  if (!fs.existsSync(p)) return null;
  return crypto.createHash("md5").update(fs.readFileSync(p)).digest("hex");
}
const ANCHOR_HASH = fileHash(ANCHOR_S2);
const ANCHOR_SIZE = fs.existsSync(ANCHOR_S2) ? fs.statSync(ANCHOR_S2).size : 0;

// ── S3 프롬프트 ────────────────────────────────────────────────────────────
// S2 continuity-fix 이미지를 reference로 첨부 → 복사기·배경·캐릭터 동일 확보
const PROMPT = `Draw a new scene in the same copy room shown in the attached image.

Environment and copier must exactly match the attached image:
- venetian blinds window on the left
- wooden storage cabinets on the right
- bright ceiling light
- beige tile floor
- same large gray multifunction copier with ADF lid, right-side control panel, three paper drawers

Character must exactly match the attached image:
Jun — round face, large brown eyes, black side-part hair, light-blue rolled-sleeve shirt, loose red tie, long navy slacks, black dress shoes, brown crossbody messenger bag.

New action (different from the attached image):
The copier is now running again. One sheet is coming out of the output tray and a second sheet begins to feed. Jun lightly taps the side of the copier with his open palm. His shoulders relax slightly in relief, but his expression shows a hint of puzzled confusion — not fully sure why tapping worked.

Medium shot showing Jun and the copier from the front. Cute comedic semi-deformed 3D animated style, adult office worker. Vertical 9:16 format.

Do not change the copier or room.
No warehouse background, glass partition, corkboard, white shirt, readable text, logo, model sheet, multi-panel image, or new character.`;

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
  log("=== S3 연속성 복구 시작 ===");
  log(`S2 anchor hash: ${ANCHOR_HASH} (${Math.round(ANCHOR_SIZE/1024)}KB)`);

  if (!fs.existsSync(ANCHOR_S2)) abort("anchor_missing", `S2 continuity anchor 없음: ${ANCHOR_S2}`);

  // 기존 S3 실패본 보존 (덮어쓰지 않음)
  const oldS3 = path.join(KF_DIR, "kf_s3_tapping_relief.png");
  if (fs.existsSync(oldS3)) {
    log(`기존 S3 실패본 보존: kf_s3_tapping_relief.png (${Math.round(fs.statSync(oldS3).size/1024)}KB)`);
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

  // ── S2 anchor 첨부 후 baseline 이미지 cid/size 수집 ──────────────────
  log("S2 continuity anchor 첨부...");
  let fileInput = page.locator('input[type="file"]').first();
  if (await fileInput.count() === 0) {
    const plusBtn = page.locator('button[aria-label*="파일 추가" i], button[aria-label*="Attach" i]').first();
    if (await plusBtn.count() > 0) await plusBtn.click();
    await page.waitForTimeout(600);
    fileInput = page.locator('input[type="file"]').first();
  }
  if (await fileInput.count() > 0) {
    await fileInput.setInputFiles(ANCHOR_S2);
    log("✓ S2 continuity anchor 첨부 완료");
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

  const savedCandidates = [];

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

        // 15초 후 재수집 — stableKey의 cid·dimensions가 여전히 존재하는지 검증
        const verifyImgs = await collectLastAssistantImages(page);
        const verifyCands = verifyImgs.filter(x =>
          x.gen && x.w >= 400 && x.h >= x.w &&
          x.cid && !baselineCids.has(x.cid)
        );
        const verifyTop = verifyCands.length > 0 ? verifyCands[verifyCands.length - 1] : null;
        const verifyKey = verifyTop ? `${verifyTop.cid}|${verifyTop.w}|${verifyTop.h}` : null;

        if (verifyKey !== stableKey) {
          warn(`15초 후 후보 불일치 — 안정화 재개 (기대: ${stableKey?.slice(0,20)} 실제: ${verifyKey?.slice(0,20)})`);
          // stableKey는 유지하되 카운터를 낮춰 루프를 계속하되 재제출은 없음
          stableCount = 0;
          stableKey = null;
          continue;
        }
        log(`✓ 15초 후 재검증 통과 — cid·dimensions 일치 (${verifyTop.cid?.slice(0,8)})`);

        // 후보 전체 저장
        const finalCands = verifyCands;

        for (const [j, cand] of finalCands.entries()) {
          const ts = Date.now();
          const candFile = `s3_candidate_${ts}_${j+1}.png`;
          const candPath = path.join(CAND_DIR, candFile);
          const buf = await downloadBuf(page, cand.src);
          if (!buf || buf.length < 10000) { warn(`후보 ${j+1} 다운로드 실패`); continue; }

          fs.writeFileSync(candPath, Buffer.from(buf));
          const hash    = fileHash(candPath);
          const sz      = fs.statSync(candPath).size;
          const isClone = (hash === ANCHOR_HASH);
          const sizeWarn = Math.abs(sz - ANCHOR_SIZE) < 1024;
          log(`  후보 ${j+1}: ${candFile} (${Math.round(sz/1024)}KB) hash=${hash?.slice(0,12)} clone=${isClone}${sizeWarn ? " [size_warn]" : ""}`);

          savedCandidates.push({ file: candFile, path: candPath, hash, size: sz, isClone });

          // 첫 번째 비-clone 후보를 복구 파일로 승격 (human QA 전까지 PASS 표시 안 함)
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
  console.log("\n\n=== S3 연속성 복구 결과 ===");
  console.log(`결과: ${result}`);
  console.log(`GPT image 제출 횟수: 1회`);

  if (result === "candidate_saved") {
    const sizeKB = Math.round(fs.statSync(DEST_PATH).size / 1024);
    console.log(`\n저장된 복구 후보: ${DEST_FILE} (${sizeKB}KB)`);
    console.log(`후보 디렉토리: ${CAND_DIR}`);
    console.log("\n=== [ Owner 육안 PASS/FAIL QA 필요 ] ===");
    console.log("PASS 조건 — 아래 항목 모두 충족 시에만 PASS:");
    console.log("  □ 복사기: S1/S2와 동일 — 대형 회색 MFC, ADF 덮개, 오른쪽 컨트롤 패널, 3단 서랍");
    console.log("  □ 배경: 블라인드 창(왼쪽) + 목재 수납장(오른쪽) + 밝은 천장 조명 + 베이지 타일 바닥");
    console.log("  □ 준 의상: 하늘색 셔츠, 빨간 넥타이, 네이비 슬랙스, 검정 구두, 갈색 메신저백");
    console.log("  □ 흰 셔츠 착용 시 즉시 FAIL");
    console.log("  □ 행동: 손바닥으로 복사기 옆면 두드리기, 복사기 작동 중(용지 출력), 안도+황당 표정");
    console.log("  □ 형식: 세로 9:16, 텍스트·로고·말풍선·자막·모델시트 없음, 시각 변형 없음");
    console.log("  □ anchor와 md5 hash 다름 (clone 아님)");
    console.log("\nFAIL 조건 (하나라도 해당 시 FAIL):");
    console.log("  ✗ 복사기·배경 달라짐 (유리 파티션, 코르크보드, 창고 배경 등)");
    console.log("  ✗ 흰 셔츠 착용");
    console.log("  ✗ 행동 불명확 (손바닥 두드리기 아님, 복사기 멈춘 상태)");
    console.log("  ✗ 가로 포맷, 텍스트/로고 삽입, 시각 변형");
  } else if (result === "timeout") {
    console.log("\n→ PENDING_RECOVERY: 탭 열린 상태 유지. Owner가 직접 확인 후 저장 필요.");
    console.log(`  후보 저장 경로: ${CAND_DIR}`);
  } else {
    console.log(`\n→ ${result}`);
  }

  console.log("\n=== 후보 목록 ===");
  savedCandidates.forEach((c, i) => {
    console.log(`  [${i+1}] ${c.file} | ${Math.round(c.size/1024)}KB | hash=${c.hash} | clone=${c.isClone}`);
  });

  console.log("\n호출 수: 1회 (GPT web subscription quota 소비)");
  console.log("직접 유료 API 호출: $0");
  console.log("S4·S5·Veo·TTS 실행: 없음");
}

main().catch(e => { console.error("[FATAL]", e.message); process.exit(1); });
