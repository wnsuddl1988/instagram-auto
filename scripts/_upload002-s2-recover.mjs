/**
 * S2 생성 결과 회수 스크립트
 * - 신규 제출 0회
 * - GPT-1 최근 대화에서 마지막 assistant turn 이미지만 수집
 * - S1 anchor와 픽셀 비교로 clone 제외
 * - page.close / browser.close 전 완료 대기
 *
 * 사용: node scripts/_upload002-s2-recover.mjs
 */

import { chromium } from "playwright";
import path         from "path";
import fs           from "fs";
import { fileURLToPath } from "url";
import crypto       from "crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT      = path.resolve(__dirname, "..");

const CDP_PORT  = 9222;
const KF_DIR    = path.join(ROOT, "output/v2/3d_sitcom_prod_v1/upload_002_copier/keyframes");
const REC_DIR   = path.join(KF_DIR, "s2_recovery_candidates");
const ANCHOR_S1 = path.join(KF_DIR, "kf_s1_wide_copier_error.png");
const DEST_FILE = "kf_s2_jammed_paper_continuity_fix_recovered.png";
const DEST_PATH = path.join(KF_DIR, DEST_FILE);
const LOG_PATH  = path.join(KF_DIR, "recovery_log.json");

fs.mkdirSync(REC_DIR, { recursive: true });

function log(m)  { console.log(`[${new Date().toISOString().slice(11,19)}] ${m}`); }
function warn(m) { console.warn(`[WARN] ${m}`); }

// ── S1 anchor 파일 해시 (clone 감지 기준) ─────────────────────────────────
function fileHash(p) {
  if (!fs.existsSync(p)) return null;
  return crypto.createHash("md5").update(fs.readFileSync(p)).digest("hex");
}
const S1_HASH = fileHash(ANCHOR_S1);
const S1_SIZE = fs.existsSync(ANCHOR_S1) ? fs.statSync(ANCHOR_S1).size : 0;
log(`S1 anchor hash: ${S1_HASH} (${Math.round(S1_SIZE/1024)}KB)`);

// ── CDP 연결 확인 ──────────────────────────────────────────────────────────
async function isCDPOpen() {
  try {
    const r = await fetch(`http://localhost:${CDP_PORT}/json/version`, { signal: AbortSignal.timeout(2000) });
    return r.ok;
  } catch { return false; }
}

// ── 마지막 assistant 메시지 내부 이미지만 수집 ────────────────────────────
// [data-message-author-role="assistant"] 직접 탐색 — conversation-turn 의존 제거
async function collectAssistantImages(page) {
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
        alt: i.alt || "",
      }))
      .filter(x => x.src);
  });
}

// ── 생성 완료 판정: 스피너/생성중 메시지 없음 ─────────────────────────────
async function isAssistantDone(page) {
  return await page.evaluate(() => {
    // 스피너 또는 생성 중 표시 확인
    const spinners = document.querySelectorAll(
      '[data-testid="stop-button"], ' +
      'button[aria-label*="Stop"], button[aria-label*="중지"], ' +
      '.result-streaming, [class*="streaming"]'
    );
    if (spinners.length > 0) return false;
    // 마지막 turn 텍스트에서 생성 중 문자열 확인
    const turns = document.querySelectorAll('[data-testid^="conversation-turn"]');
    if (turns.length === 0) return true;
    const last = turns[turns.length - 1].textContent || "";
    return !/생성하고 있습니다|만들고 있습니다|Creating image|생성 중|잠시만|이미지를 만드는 중/i.test(last);
  });
}

// ── 이미지 다운로드 ────────────────────────────────────────────────────────
async function downloadImage(page, src, destPath) {
  const buf = await page.evaluate(async (u) => {
    try {
      const r = await fetch(u);
      if (!r.ok) return null;
      const ab = await r.arrayBuffer();
      return Array.from(new Uint8Array(ab));
    } catch { return null; }
  }, src).catch(() => null);
  if (!buf || buf.length < 10000) return false;
  fs.writeFileSync(destPath, Buffer.from(buf));
  return true;
}

// ── 메인 ──────────────────────────────────────────────────────────────────
async function main() {
  log("=== S2 결과 회수 시작 (신규 제출 0회) ===");

  if (!await isCDPOpen()) {
    console.error("[ABORT] Chrome CDP 열려있지 않음 — Chrome을 먼저 실행하세요.");
    process.exit(1);
  }

  const browser = await chromium.connectOverCDP(`http://localhost:${CDP_PORT}`)
    .catch(e => { console.error("[ABORT:cdp]", e.message); process.exit(1); });

  const ctx = browser.contexts()[0];
  if (!ctx) { console.error("[ABORT] 브라우저 컨텍스트 없음"); process.exit(1); }

  const pages = ctx.pages();
  log(`열린 탭 수: ${pages.length}`);

  // chatgpt.com 탭 중 가장 최근 것 사용
  const gptPages = pages.filter(p => /chatgpt\.com/.test(p.url()));
  log(`ChatGPT 탭: ${gptPages.length}개`);

  if (gptPages.length === 0) {
    console.error("[ABORT] ChatGPT 탭 없음");
    await browser.close();
    process.exit(1);
  }

  const results = [];

  for (const [i, page] of gptPages.entries()) {
    log(`\n--- 탭 ${i+1}: ${page.url().slice(0, 80)} ---`);

    // 생성 완료까지 대기 (최대 120초)
    let done = false;
    for (let w = 0; w < 30; w++) {
      if (await isAssistantDone(page)) { done = true; break; }
      log(`  생성 대기 ${(w+1)*4}s...`);
      await page.waitForTimeout(4000);
    }
    if (!done) {
      warn(`탭 ${i+1} — 120초 후에도 생성 중. 현재 상태로 회수 시도.`);
    } else {
      log(`  ✓ assistant 응답 완료 확인`);
    }

    // 안정화 대기 15초
    log("  안정화 대기 15초...");
    await page.waitForTimeout(15000);

    // 마지막 assistant turn 이미지 수집
    const imgs = await collectAssistantImages(page);
    log(`  마지막 assistant turn 이미지: ${imgs.length}개`);

    // 세로형 이미지 전체 (gen 필터 제거 — o3 모델은 다른 URL 패턴 사용)
    const genImgs = imgs.filter(x => x.w >= 300 && x.h >= x.w);
    log(`  생성 후보 (세로형, gen): ${genImgs.length}개`);

    for (const [j, img] of genImgs.entries()) {
      const candFile = `s2_candidate_tab${i+1}_img${j+1}.png`;
      const candPath = path.join(REC_DIR, candFile);

      const ok = await downloadImage(page, img.src, candPath);
      if (!ok) { warn(`  후보 ${j+1} 다운로드 실패`); continue; }

      const size  = fs.statSync(candPath).size;
      const hash  = fileHash(candPath);
      const isS1Clone = (hash === S1_HASH) || (Math.abs(size - S1_SIZE) < 1024);

      log(`  후보 ${j+1}: ${candFile} (${Math.round(size/1024)}KB) hash=${hash?.slice(0,8)} clone=${isS1Clone}`);
      results.push({ tab: i+1, img: j+1, file: candFile, size, hash, isS1Clone, src: img.src.slice(0, 80) });
    }
  }

  // ── 회수 판정 ──────────────────────────────────────────────────────────
  console.log("\n=== 회수 결과 ===");
  const nonClone = results.filter(r => !r.isS1Clone);
  const clones   = results.filter(r => r.isS1Clone);

  log(`전체 후보: ${results.length}개`);
  log(`S1 clone 제외: ${clones.length}개`);
  log(`실제 신규 후보: ${nonClone.length}개`);

  let finalResult = "RECOVERY_FAILED";

  if (nonClone.length > 0) {
    // 가장 큰 파일을 최종 후보로 선택
    nonClone.sort((a, b) => b.size - a.size);
    const best = nonClone[0];
    const srcPath = path.join(REC_DIR, best.file);
    fs.copyFileSync(srcPath, DEST_PATH);
    log(`✓ 회수 성공: ${best.file} → ${DEST_FILE} (${Math.round(best.size/1024)}KB)`);
    finalResult = "RECOVERED";
  } else {
    log("실제 S2 생성 이미지 없음 → RECOVERY_FAILED");
  }

  // ── recovery_log.json 저장 ─────────────────────────────────────────────
  const logData = {
    recovered_at: new Date().toISOString().slice(0, 19),
    new_submissions: 0,
    s1_hash: S1_HASH,
    s1_size_kb: Math.round(S1_SIZE / 1024),
    candidates_total: results.length,
    s1_clones_excluded: clones.length,
    non_clone_candidates: nonClone.length,
    final_result: finalResult,
    dest_file: finalResult === "RECOVERED" ? DEST_FILE : null,
    candidates: results,
  };
  fs.writeFileSync(LOG_PATH, JSON.stringify(logData, null, 2));
  log(`recovery_log.json 저장: ${LOG_PATH}`);

  // CDP disconnect only (Chrome 창 종료 안 함)
  await browser.close();
  log("CDP 연결 해제 (Chrome 창 유지)");

  console.log("\n=== 최종 보고 ===");
  console.log(`신규 제출 횟수: 0회`);
  console.log(`회수 결과: ${finalResult}`);
  console.log(`S1 clone 제외: ${clones.length}개`);
  console.log(`실제 신규 후보: ${nonClone.length}개`);
  if (finalResult === "RECOVERED") {
    console.log(`저장 파일: ${DEST_FILE}`);
    console.log("\n[ Owner 육안 확인 필요 ]");
    console.log("  □ 복사기: S1과 동일 형태·색상·서랍·ADF");
    console.log("  □ 배경: 블라인드 창 + 목재 수납장 + 타일 바닥");
    console.log("  □ 준 의상: 하늘색 셔츠, 빨간 넥타이, 네이비 슬랙스, 메신저백");
    console.log("  □ 행동: 덮개 열기 + 찢어진 조각 응시");
    console.log("  □ 글자·로고·모델시트·화이트셔츠 없음");
  } else {
    console.log("→ 실제 S2 생성 이미지 없음. 재생성 시 Owner 승인 필요.");
  }
  console.log("\nS3·S4·S5·Veo·TTS 실행 금지 유지");
}

main().catch(e => { console.error("[FATAL]", e.message); process.exit(1); });
