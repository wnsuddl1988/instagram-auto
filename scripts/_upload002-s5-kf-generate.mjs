/**
 * upload_002_copier S5 키프레임 생성
 *
 * - ANCHOR: S4 PASS (kf_s4_paper_pile_button.png)
 * - DEST_FILE: kf_s5_boss_hand_finale.png
 * - CAND_DIR: s5_candidates
 * - PROMPT: S5 — 상사 소매 손만 프레임 오른쪽 끝에서 들어와 종이 한 장 집음
 *
 * CONTRACT 제약 (S5):
 * - boss_rule: "정장 소매 손(팔목~팔꿈치)만. 얼굴·전신 등장 시 FAIL — 재생성 0회"
 * - veo_max_attempts: 1
 *
 * Owner 승인: S5 GPT 이미지 1회
 * - GPT web image 생성: 정확히 1회
 * - 직접 유료 API 호출: $0
 * - 자동 재제출·Enter 재입력 없음
 * - 재생성 0회 (FAIL 시 즉시 continuity_fail 기록)
 * - Veo·TTS 금지
 * - 타임아웃 시 신규 탭 fallback 자동 실행
 *
 * 사용: node scripts/_upload002-s5-kf-generate.mjs [--dry-run]
 */

import { chromium } from "playwright";
import path         from "path";
import fs           from "fs";
import { fileURLToPath } from "url";

import {
  CDP_PORT_GPT1 as CDP_PORT, USER_DATA_GPT1 as USER_DATA,
  hashFile as fileHash,
  isCDPOpen as _isCDPOpen, ensureChrome as _ensureChrome,
  checkLogin, detectStop,
  activateImageTool, attachRef as _attachRef,
  typePrompt, checkSendEnabled,
  collectLastAssistantImages, isAssistantDone,
  interceptRecover as _interceptRecover,
} from "./_chatgpt-image-core.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT      = path.resolve(__dirname, "..");
const KF_DIR     = path.join(ROOT, "output/v2/3d_sitcom_prod_v1/upload_002_copier/keyframes");
const CAND_DIR   = path.join(KF_DIR, "s5_candidates");

const ANCHOR_S4  = path.join(KF_DIR, "kf_s4_paper_pile_button.png");
const DEST_FILE  = "kf_s5_boss_hand_finale.png";
const DEST_PATH  = path.join(KF_DIR, DEST_FILE);

const DRY        = process.argv.includes("--dry-run");

fs.mkdirSync(KF_DIR,   { recursive: true });
fs.mkdirSync(CAND_DIR, { recursive: true });

function log(m)  { console.log(`[${new Date().toISOString().slice(11,19)}] ${m}`); }
function warn(m) { console.warn(`[WARN] ${m}`); }
function abort(code, m) { console.error(`\n[ABORT:${code}] ${m}\n`); process.exit(1); }

// 전송 카운터
let TOTAL_MESSAGE_SEND_COUNT = 0;
let IMAGE_SUBMISSION_COUNT   = 0;
function recordSend(label) {
  TOTAL_MESSAGE_SEND_COUNT++;
  IMAGE_SUBMISSION_COUNT++;
  if (TOTAL_MESSAGE_SEND_COUNT > 1) abort("double_send", `TOTAL=${TOTAL_MESSAGE_SEND_COUNT} at "${label}"`);
  log(`[SEND #${TOTAL_MESSAGE_SEND_COUNT}] "${label}"`);
}

const ANCHOR_HASH = fileHash(ANCHOR_S4);
const ANCHOR_SIZE = fs.existsSync(ANCHOR_S4) ? fs.statSync(ANCHOR_S4).size : 0;

// ── S5 프롬프트 ────────────────────────────────────────────────────────────
// 핵심: 상사는 절대 화면에 등장하지 않음. 손+팔꿈치 아래만.
const PROMPT = `Draw the next scene in the same copy room shown in the attached image.

Environment and copier must exactly match the attached image:
- venetian blinds window on the left
- wooden storage cabinets on the right
- bright ceiling light
- beige tile floor
- same large gray multifunction copier with ADF lid, right-side control panel, three paper drawers
- same large pile of printed paper on the output tray and floor

Character must exactly match the attached image:
Jun — round face, large brown eyes, black side-part hair, light-blue rolled-sleeve shirt, loose red tie, long navy slacks, black dress shoes, brown crossbody messenger bag. Jun is standing beside the copier, looking exhausted and defeated, leaning against the copier with no energy left.

New scene — CRITICAL BOSS HAND RULE:
From the extreme RIGHT EDGE of the frame, ONLY a suit-sleeved hand and a short section of forearm (from wrist to elbow only) enter the frame. This hand reaches toward the paper pile and picks up a single sheet of paper from the pile.

ABSOLUTE REQUIREMENT: The boss exists entirely OUTSIDE the frame. ONLY the suit sleeve, wrist, and partial forearm are visible — nothing else of the boss. The boss character must NOT appear in the image in any form.

IMMEDIATE FAIL conditions — if ANY of these appear, the image is rejected:
- Boss face (any part)
- Boss head or hair
- Boss neck
- Boss shoulder
- Boss chest or torso
- Boss full body or half body
- Boss silhouette, shadow, or reflection
- Any part of the boss beyond the elbow
- A second standing figure visible anywhere in the frame
- The boss entering from anywhere other than the extreme right edge

The composition should show: Jun leaning exhaustedly against the copier on the left side, the large paper pile on the output tray and floor in the center, and ONLY the boss's suit-sleeved hand and forearm entering from the extreme right edge to pick up one sheet.

Cute comedic semi-deformed 3D animated style, adult office worker. Vertical 9:16 format.

Do not change the copier, room, or Jun's costume.
STRICT BANS: white shirt, boss face, boss body, boss silhouette, second full character in frame, glass partition, corkboard, readable text, logo, speech bubble, model sheet, multi-panel image, horizontal format.`;

// ── ensureChrome wrapper ────────────────────────────────────────────────────
async function ensureChrome() {
  await _ensureChrome(CDP_PORT, USER_DATA, log)
    .catch(e => abort("cdp_timeout", e.message));
}

// ── 신규 탭 방식 이미지 회수 (PRIMARY fallback) ────────────────────────────
// 브라우저 캐시로 reload intercept가 실패할 때 가장 신뢰성 높은 방식
async function fetchViaNewTab(ctx, url) {
  const imgPage = await ctx.newPage();
  let captured = null;
  imgPage.on("response", async (res) => {
    if (res.url() === url && res.status() === 200) {
      try { captured = await res.body(); } catch {}
    }
  });
  try {
    await imgPage.goto(url, { waitUntil: "load", timeout: 15000 }).catch(() => {});
    await imgPage.waitForTimeout(2000);
  } finally {
    await imgPage.close().catch(() => {});
  }
  return captured;
}

// intercept fallback — 공용 모듈 위임
async function interceptRecover(page, convUrl) {
  return _interceptRecover(page, convUrl, log);
}

// ── 메인 ──────────────────────────────────────────────────────────────────
async function main() {
  log("=== S5 키프레임 생성 시작 (S4 reference) ===");
  log(`S4 anchor hash: ${ANCHOR_HASH} (${Math.round(ANCHOR_SIZE/1024)}KB)`);
  log("⚠  BOSS RULE ACTIVE: 얼굴·전신·머리·어깨 등장 시 즉시 FAIL, 재생성 0회");

  if (!fs.existsSync(ANCHOR_S4)) abort("anchor_missing", `S4 anchor 없음: ${ANCHOR_S4}`);

  await ensureChrome();
  const browser = await chromium.connectOverCDP(`http://localhost:${CDP_PORT}`)
    .catch(e => abort("cdp_connect", e.message));

  const ctx = browser.contexts()[0];
  if (!ctx) abort("no_context", "브라우저 컨텍스트 없음");

  const page = await ctx.newPage();

  // ── 로그인 확인 (공용 core) ───────────────────────────────────────────────
  await checkLogin(page, log).catch(e => abort("login_required", e.message));
  await detectStop(page).catch(e => abort("stop_detected", e.message));

  // ── S4 anchor 첨부 + baseline 수집 (공용 core) ──────────────────────────
  const { baselineCids, baselineSrcs } = await _attachRef(page, ANCHOR_S4, log)
    .catch(e => abort("attach_failed", e.message));

  // ── 이미지 생성 도구 활성화 (공용 core — fail-fast) ──────────────────────
  await activateImageTool(page, log, warn)
    .catch(e => abort("image_tool_failed", e.message));

  // ── 프롬프트 입력 + DOM 확인 (공용 core) ────────────────────────────────
  const { typedLen } = await typePrompt(page, PROMPT, log)
    .catch(e => abort("input_failed", e.message));

  await detectStop(page).catch(e => abort("stop_detected", e.message));

  // ── send enabled 확인 ────────────────────────────────────────────────────
  const sendEnabled = await checkSendEnabled(page);
  log(`Preflight: baseline_cids=${baselineCids.size}, prompt_len=${typedLen}, send_enabled=${sendEnabled}`);
  log(`Counters: TOTAL=${TOTAL_MESSAGE_SEND_COUNT}, IMAGE=${IMAGE_SUBMISSION_COUNT}`);

  // ── DRY-RUN: 전체 준비 단계 완료 후 중단 ──────────────────────────────────
  if (DRY) {
    log(`\n[DRY-RUN] 전체 준비 단계 PASS ✅`);
    log(`[DRY-RUN] TOTAL=${TOTAL_MESSAGE_SEND_COUNT}, IMAGE=${IMAGE_SUBMISSION_COUNT}`);
    log(`[DRY-RUN] Anchor hash: ${ANCHOR_HASH}`);
    log(`[DRY-RUN] 전송 없음. 탭 유지.`);
    await page.close();
    await browser.close();
    return;
  }

  // ── 전송 (정확히 1회) ──────────────────────────────────────────────────
  recordSend("S5 KF 이미지 생성");
  const beforeTurns = await page.locator('[data-testid^="conversation-turn"]').count();
  const sendBtn = page.locator(
    '#composer-submit-button, button[data-testid="send-button"], ' +
    'button[aria-label="Send message"], button[aria-label="메시지 보내기"]'
  ).first();
  const ta = page.locator("#prompt-textarea").first();
  if (await sendBtn.count() > 0 && await sendBtn.isEnabled().catch(() => false)) {
    await sendBtn.click();
    log("✓ 전송 버튼 클릭 (TOTAL=1, IMAGE=1)");
  } else {
    await ta.press("Enter");
    log("✓ Enter 전송 (TOTAL=1, IMAGE=1)");
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
  const pendingUrls = [];   // fallback용 URL 수집

  outer: while (Date.now() - startTime < 300_000) {
    await page.waitForTimeout(4000);
    await detectStop(page).catch(e => { result = "stop_detected"; warn(e.message); });
    if (result === "stop_detected") break;
    const elapsed = Date.now() - startTime;

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
      // fallback용 URL 누적
      for (const c of newCands) {
        if (!pendingUrls.includes(c.src)) pendingUrls.push(c.src);
      }

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
          const candFile = `s5_candidate_${ts}_${j+1}.png`;
          const candPath = path.join(CAND_DIR, candFile);
          const buf = await page.evaluate(async (u) => {
            try {
              const r = await fetch(u);
              if (!r.ok) return null;
              return Array.from(new Uint8Array(await r.arrayBuffer()));
            } catch { return null; }
          }, cand.src);

          if (!buf || buf.length < 10000) {
            warn(`후보 ${j+1} 직접 fetch 실패 — 신규 탭 fallback 시도`);
            // 즉시 신규 탭 방식 시도
            const tabBuf = await fetchViaNewTab(ctx, cand.src);
            if (tabBuf && tabBuf.length > 10000) {
              fs.writeFileSync(candPath, tabBuf);
              const hash    = fileHash(candPath);
              const sz      = fs.statSync(candPath).size;
              const isClone = (hash === ANCHOR_HASH);
              log(`  신규탭 후보 ${j+1}: ${candFile} (${Math.round(sz/1024)}KB) hash=${hash?.slice(0,12)} clone=${isClone}`);
              savedCandidates.push({ file: candFile, path: candPath, hash, size: sz, isClone, method: "new_tab" });
              if (!isClone && result !== "candidate_saved") {
                fs.writeFileSync(DEST_PATH, tabBuf);
                log(`✓ 신규탭 저장: ${DEST_FILE} (${Math.round(sz/1024)}KB)`);
                result = "candidate_saved";
              }
            } else {
              warn(`신규탭 fallback도 실패 — ${cand.src.slice(0, 60)}`);
              result = "need_intercept";
              break outer;
            }
            continue;
          }

          fs.writeFileSync(candPath, Buffer.from(buf));
          const hash    = fileHash(candPath);
          const sz      = fs.statSync(candPath).size;
          const isClone = (hash === ANCHOR_HASH);
          log(`  후보 ${j+1}: ${candFile} (${Math.round(sz/1024)}KB) hash=${hash?.slice(0,12)} clone=${isClone}`);
          savedCandidates.push({ file: candFile, path: candPath, hash, size: sz, isClone, method: "direct_fetch" });
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

  // ── fallback 1: 신규 탭으로 pendingUrls 직접 회수 ─────────────────────
  if (result === "timeout" || result === "need_intercept") {
    log(`결과: ${result} → 신규 탭 fallback 시작 (${pendingUrls.length}개 URL)...`);

    // DOM에서 최신 URL 재수집 (타임아웃 이후에도)
    const liveImgs = await collectLastAssistantImages(page).catch(() => []);
    for (const img of liveImgs) {
      if (img.gen && img.src && !pendingUrls.includes(img.src)) pendingUrls.push(img.src);
    }
    log(`  총 fallback URL: ${pendingUrls.length}개`);

    for (const [j, url] of pendingUrls.entries()) {
      log(`  신규탭 회수 [${j+1}/${pendingUrls.length}]: ${url.slice(0, 70)}...`);
      const tabBuf = await fetchViaNewTab(ctx, url);
      if (!tabBuf || tabBuf.length < 10000) {
        warn(`  신규탭 실패 (${Math.round((tabBuf?.length||0)/1024)}KB)`);
        continue;
      }
      const ts       = Date.now();
      const candFile = `s5_newtab_${ts}_${j+1}.png`;
      const candPath = path.join(CAND_DIR, candFile);
      fs.writeFileSync(candPath, tabBuf);
      const hash    = fileHash(candPath);
      const sz      = fs.statSync(candPath).size;
      const isClone = (hash === ANCHOR_HASH);
      log(`  신규탭 후보 ${j+1}: ${candFile} (${Math.round(sz/1024)}KB) hash=${hash?.slice(0,12)} clone=${isClone}`);
      savedCandidates.push({ file: candFile, path: candPath, hash, size: sz, isClone, method: "new_tab_recovery" });
      if (!isClone && result !== "candidate_saved") {
        fs.writeFileSync(DEST_PATH, tabBuf);
        log(`✓ 신규탭 회수 저장: ${DEST_FILE} (${Math.round(sz/1024)}KB)`);
        result = "candidate_saved";
      }
    }
  }

  // ── fallback 2: intercept+reload (신규 탭도 실패 시) ──────────────────
  if (result === "timeout" || result === "need_intercept") {
    log("신규 탭 fallback도 실패 → intercept+reload 최종 시도...");
    convUrl = convUrl || page.url();
    const intercepted = await interceptRecover(page, convUrl);

    for (const [j, [src, body]] of [...intercepted.entries()].entries()) {
      const ts       = Date.now();
      const candFile = `s5_intercept_${ts}_${j+1}.png`;
      const candPath = path.join(CAND_DIR, candFile);
      fs.writeFileSync(candPath, body);
      const hash    = fileHash(candPath);
      const sz      = fs.statSync(candPath).size;
      const isClone = (hash === ANCHOR_HASH);
      log(`  intercept 후보 ${j+1}: ${candFile} (${Math.round(sz/1024)}KB) hash=${hash?.slice(0,12)} clone=${isClone}`);
      savedCandidates.push({ file: candFile, path: candPath, hash, size: sz, isClone, method: "intercept", src });
      if (!isClone && result !== "candidate_saved") {
        fs.writeFileSync(DEST_PATH, body);
        log(`✓ intercept 저장: ${DEST_FILE} (${Math.round(sz/1024)}KB)`);
        result = "candidate_saved";
      }
    }
    if (result !== "candidate_saved") warn("모든 fallback 실패 — PENDING_RECOVERY");
  }

  if (result !== "timeout" && result !== "pending_recovery") {
    await page.close().catch(() => {});
  }
  await browser.close();
  log("CDP 연결 해제");

  // ── 최종 보고 ──────────────────────────────────────────────────────────
  console.log("\n\n=== S5 키프레임 생성 결과 ===");
  console.log(`결과: ${result}`);
  console.log(`GPT image 제출 횟수: 1회 (S4 reference)`);

  if (result === "candidate_saved") {
    const sz = fs.existsSync(DEST_PATH) ? Math.round(fs.statSync(DEST_PATH).size/1024) : 0;
    console.log(`\n저장 파일: ${DEST_FILE} (${sz}KB)`);
    console.log(`후보 디렉토리: ${CAND_DIR}`);
    console.log("\n=== [ Owner 육안 PASS/FAIL QA 필요 ] ===");
    console.log("\n⚠  BOSS RULE — 이하 항목 하나라도 보이면 즉시 FAIL (재생성 없음):");
    console.log("  ✗ 상사 얼굴 (어떤 부분이든)");
    console.log("  ✗ 상사 머리/머리카락");
    console.log("  ✗ 상사 목");
    console.log("  ✗ 상사 어깨");
    console.log("  ✗ 상사 가슴·몸통");
    console.log("  ✗ 상사 전신 또는 반신");
    console.log("  ✗ 상사 실루엣·그림자·반사");
    console.log("  ✗ 팔꿈치 너머 신체");
    console.log("  ✗ 프레임 안에 두 번째 인물");
    console.log("\nPASS 조건 (전체 충족 필수):");
    console.log("  □ 복사기·배경: S1~S4와 동일 복사실, 동일 MFC");
    console.log("  □ 준 의상: 하늘색 셔츠, 빨간 넥타이, 네이비 슬랙스, 검정 구두, 갈색 가방");
    console.log("  □ 준: 지쳐서 복사기에 기댄 자세, 무기력한 표정");
    console.log("  □ 종이 더미: 트레이+바닥에 쌓여있음");
    console.log("  □ 상사: 오른쪽 끝에서 정장 소매+손목~팔꿈치 구간만 등장");
    console.log("  □ 그 손이 종이 한 장을 집는 자세");
    console.log("  □ 무음으로 보스 등장이 즉시 읽힘");
    console.log("  □ 세로 9:16, 텍스트·로고·말풍선 없음");
  } else if (result === "text_refused") {
    console.log("\n→ GPT가 이미지 생성을 거부하고 텍스트만 반환. FAIL.");
  } else {
    console.log(`\n→ ${result}`);
    if (result === "timeout") console.log("  탭 열린 상태 유지. 모든 fallback 시도 완료.");
  }

  console.log("\n=== 후보 목록 ===");
  savedCandidates.forEach((c, i) =>
    console.log(`  [${i+1}] ${c.file} | ${Math.round(c.size/1024)}KB | hash=${c.hash} | clone=${c.isClone} | method=${c.method}`)
  );
  console.log("\n호출 수: 1회 (GPT web subscription quota 소비)");
  console.log("직접 유료 API 호출: $0");
  console.log("Veo·TTS 실행: 없음");
}

main().catch(e => { console.error("[FATAL]", e.message); process.exit(1); });
