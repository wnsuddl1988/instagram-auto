/**
 * ep003 S3 Boss-Free v4 — intercept recover
 *
 * v4 생성은 완료됐으나 isAssistantDone() 타임아웃으로 이미지 미저장.
 * 현재 ChatGPT 탭에서 page.route intercept + reload로 이미지를 회수한다.
 *
 * 조건:
 *   - Chrome CDP port 9222에 이미 ChatGPT 탭이 열려 있어야 함
 *   - 결과 탭에 v4 생성 이미지가 남아 있어야 함 (세션 유지 상태)
 *   - ALLOW_CHATGPT_IMAGE=true (읽기/저장만, 재생성 없음)
 *
 * 실행:
 *   ALLOW_CHATGPT_IMAGE=true node scripts/_ep003-jdm-s3-recover.mjs
 */

import { chromium } from "playwright";
import fs           from "fs";
import path         from "path";
import crypto       from "crypto";
import { fileURLToPath } from "url";

import {
  CDP_PORT_GPT1,
  ensureChrome,
  USER_DATA_GPT1,
  collectLastAssistantImages,
  interceptRecover,
} from "./_chatgpt-image-core.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT      = path.resolve(__dirname, "..");
const KF_DIR    = path.join(ROOT, "output/v2/ep003_jdm/keyframes");
const QA_DIR    = path.join(ROOT, "output/v2/ep003_jdm/qa/s3_bossfree");

if (!process.env.ALLOW_CHATGPT_IMAGE) {
  console.error("ABORT: ALLOW_CHATGPT_IMAGE 환경변수 없음");
  process.exit(1);
}

const SAVE_PATH  = path.join(KF_DIR, "s3_bossfree_kf_try4.png");
const REF_MD5_PREFIX = "4a69bed3"; // s4_kf_qa_pass.png
const FAIL_MD5 = new Set(["d1affe2e", "4a69bed3"]);

function md5short(buf) {
  return crypto.createHash("md5").update(buf).digest("hex").slice(0, 8);
}
function ts() { return new Date().toISOString().slice(11, 19); }
function log(m) { console.log(`[${ts()}][RECOVER] ${m}`); }
function warn(m) { console.warn(`[WARN][RECOVER] ${m}`); }

async function run() {
  log("=== S3 v4 intercept recover 시작 ===");

  if (fs.existsSync(SAVE_PATH)) {
    warn(`이미 파일 존재: ${SAVE_PATH} — 덮어쓰지 않음. 스크립트 종료.`);
    process.exit(0);
  }

  await ensureChrome(CDP_PORT_GPT1, USER_DATA_GPT1, log);
  const browser = await chromium.connectOverCDP(`http://localhost:${CDP_PORT_GPT1}`);
  const ctx     = browser.contexts()[0];

  // 기존 탭 중 chatgpt.com 탭 찾기
  const pages = ctx.pages();
  log(`열린 탭 수: ${pages.length}`);
  let page = pages.find(p => /chatgpt\.com/.test(p.url()));
  if (!page) {
    warn("chatgpt.com 탭 없음 — 새 탭 열기");
    page = await ctx.newPage();
    await page.goto("https://chatgpt.com/", { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(3000);
  } else {
    log(`chatgpt.com 탭 사용: ${page.url().slice(0, 80)}`);
  }

  // 현재 URL (대화 ID 보존)
  const convUrl = page.url();
  log(`현재 URL: ${convUrl.slice(0, 80)}`);

  await page.screenshot({ path: `${QA_DIR}/recover_before.png`, fullPage: false }).catch(() => {});

  // ── 방법 1: DOM에서 직접 이미지 src 수집 ─────────────────────────────────────
  log("방법 1 — DOM 이미지 직접 수집");
  const domImgs = await collectLastAssistantImages(page);
  log(`DOM 이미지 후보: ${domImgs.length}개`);

  let buf = null;

  for (const img of domImgs.filter(i => i.w >= 400)) {
    log(`  시도: ${img.src.slice(0, 80)} (${img.w}×${img.h})`);
    try {
      const resp = await page.evaluate(async (src) => {
        const r = await fetch(src, { credentials: "include" });
        if (!r.ok) return null;
        const b = await r.arrayBuffer();
        return Array.from(new Uint8Array(b));
      }, img.src);
      if (resp && resp.length > 50_000) {
        buf = Buffer.from(resp);
        log(`  DOM fetch 성공: ${Math.round(buf.length / 1024)}KB`);
        break;
      }
    } catch (e) {
      warn(`  fetch 실패: ${e.message}`);
    }
  }

  // ── 방법 2: intercept + reload ────────────────────────────────────────────────
  if (!buf) {
    log("방법 2 — intercept + reload");
    const intercepted = await interceptRecover(page, convUrl, log);
    const refSizeKB = Math.round(
      fs.statSync(path.join(KF_DIR, "s4_kf_qa_pass.png")).size / 1024
    );
    const candidates = [...intercepted.values()]
      .filter(b => {
        const kb = Math.round(b.length / 1024);
        const isRef = Math.abs(kb - refSizeKB) / refSizeKB < 0.10;
        return b.length > 50_000 && !isRef;
      })
      .sort((a, b_) => b_.length - a.length);
    if (candidates.length > 0) {
      buf = candidates[0];
      log(`intercept 회수 성공: ${Math.round(buf.length / 1024)}KB`);
    }
  }

  await page.screenshot({ path: `${QA_DIR}/recover_after.png`, fullPage: false }).catch(() => {});
  await browser.close().catch(() => {});

  if (!buf) {
    warn("이미지 회수 실패 (DOM + intercept 모두)");
    process.exit(1);
  }

  const hash = md5short(buf);
  const kb   = Math.round(buf.length / 1024);
  log(`회수 이미지: ${kb}KB, md5=${hash}`);

  if (FAIL_MD5.has(hash)) {
    warn(`CLONE_DETECTED: md5=${hash} — FAIL 처리`);
    const failPath = path.join(KF_DIR, `_FAIL_s3_bossfree_clone_md5_${hash}_recover.png`);
    fs.writeFileSync(failPath, buf);
    log(`저장(FAIL): ${failPath}`);
    process.exit(1);
  }

  fs.writeFileSync(SAVE_PATH, buf);
  log(`저장 완료: ${SAVE_PATH} (${kb}KB, md5=${hash})`);

  // report 갱신
  const reportPath = `${QA_DIR}/report.json`;
  let report = {};
  try { report = JSON.parse(fs.readFileSync(reportPath, "utf-8")); } catch {}
  report.status       = "candidate_owner_qa_pending";
  report.file         = SAVE_PATH;
  report.size_kb      = kb;
  report.md5          = hash;
  report.recovered_at = new Date().toISOString();
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  log("=== recover 완료 — Owner 육안 QA 필요 ===");
  log(`QA 스크린샷: ${QA_DIR}/recover_after.png`);
}

run().catch(e => {
  console.error(`[FATAL] ${e.message}`);
  process.exit(1);
});
