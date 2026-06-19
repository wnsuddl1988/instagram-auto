/**
 * ep003 S3 Boss-Free v4 — intercept recover v2
 *
 * 최근 ChatGPT 대화 URL들을 순회하며 이미지를 찾아 회수한다.
 * 신규 메시지 전송·재생성 없음. 읽기/저장만.
 */

import { chromium } from "playwright";
import fs           from "fs";
import path         from "path";
import crypto       from "crypto";
import { fileURLToPath } from "url";

import {
  CDP_PORT_GPT1,
  USER_DATA_GPT1,
  ensureChrome,
  collectLastAssistantImages,
} from "./_chatgpt-image-core.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT      = path.resolve(__dirname, "..");
const KF_DIR    = path.join(ROOT, "output/v2/ep003_jdm/keyframes");
const QA_DIR    = path.join(ROOT, "output/v2/ep003_jdm/qa/s3_bossfree");

if (!process.env.ALLOW_CHATGPT_IMAGE) {
  console.error("ABORT: ALLOW_CHATGPT_IMAGE 환경변수 없음");
  process.exit(1);
}

const SAVE_PATH = path.join(KF_DIR, "s3_bossfree_kf_try4.png");
const FAIL_MD5  = new Set(["d1affe2e", "4a69bed3"]);

// 최근 대화 URL (History UUID 엄격 파싱, 최신순)
const CANDIDATE_URLS = [
  "https://chatgpt.com/c/6a3556fa-70f0-83ee-9d97-956b81c48481",
  "https://chatgpt.com/c/6a355192-d2bc-83e8-8a7c-c7fc6888330b",
  "https://chatgpt.com/c/6a3553b0-3324-83e8-b788-5a0bb8242e74",
  "https://chatgpt.com/c/6a354915-37d0-83ee-ab80-b52bc7e048b8",
  "https://chatgpt.com/c/6a353a38-9eec-83ee-972a-3b6a5e7ee0be",
  "https://chatgpt.com/c/6a34c405-229c-83e8-adb3-a5306b97e31f",
  "https://chatgpt.com/c/6a34c3b4-b85c-83ee-9c24-aa1339bddf45",
  "https://chatgpt.com/c/6a30f47c-4560-83e8-814a-553dc1a1ce44",
];

function md5short(buf) {
  return crypto.createHash("md5").update(buf).digest("hex").slice(0, 8);
}
function ts()  { return new Date().toISOString().slice(11, 19); }
function log(m){ console.log(`[${ts()}][RECOVER2] ${m}`); }
function warn(m){ console.warn(`[WARN][RECOVER2] ${m}`); }

async function tryFetchImgFromPage(page) {
  const imgs = await collectLastAssistantImages(page);
  log(`  DOM 이미지 후보: ${imgs.length}개`);
  for (const img of imgs.filter(i => i.w >= 400).sort((a, b) => b.w - a.w)) {
    log(`  fetch 시도: ${img.src.slice(0, 80)} (${img.w}×${img.h})`);
    try {
      const resp = await page.evaluate(async (src) => {
        const r = await fetch(src, { credentials: "include" });
        if (!r.ok) return null;
        const b = await r.arrayBuffer();
        return Array.from(new Uint8Array(b));
      }, img.src);
      if (resp && resp.length > 50_000) {
        return Buffer.from(resp);
      }
    } catch (e) {
      warn(`  fetch 오류: ${e.message}`);
    }
  }
  return null;
}

async function tryInterceptReload(page, url) {
  log(`  intercept + reload: ${url.slice(0, 60)}`);
  const intercepted = new Map();
  await page.route("**/*", async (route) => {
    const req = route.request();
    const u   = req.url();
    if (/oaiusercontent|backend-api.*estuary|dalle/.test(u) && req.resourceType() === "image") {
      try {
        const res = await route.fetch();
        const body = await res.body();
        if (body && body.length > 50_000) intercepted.set(u, body);
        await route.fulfill({ response: res, body });
      } catch { await route.continue().catch(() => {}); }
    } else {
      await route.continue().catch(() => {});
    }
  });

  await page.goto(url, { waitUntil: "networkidle", timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(5000);
  await page.unroute("**/*").catch(() => {});
  log(`  intercept 수집: ${intercepted.size}개`);

  if (intercepted.size === 0) return null;

  const refSizeKB = Math.round(fs.statSync(path.join(KF_DIR, "s4_kf_qa_pass.png")).size / 1024);
  const cands = [...intercepted.values()]
    .filter(b => {
      const kb = Math.round(b.length / 1024);
      return b.length > 100_000 && Math.abs(kb - refSizeKB) / refSizeKB > 0.10;
    })
    .sort((a, b_) => b_.length - a.length);
  return cands.length > 0 ? cands[0] : null;
}

async function run() {
  log("=== S3 v4 recover v2 시작 ===");

  if (fs.existsSync(SAVE_PATH)) {
    warn(`이미 파일 존재: ${SAVE_PATH} — 종료`);
    process.exit(0);
  }

  await ensureChrome(CDP_PORT_GPT1, USER_DATA_GPT1, log);
  const browser = await chromium.connectOverCDP(`http://localhost:${CDP_PORT_GPT1}`);
  const ctx     = browser.contexts()[0];

  let page = ctx.pages().find(p => /chatgpt\.com/.test(p.url()));
  if (!page) {
    page = await ctx.newPage();
  }

  let buf = null;

  for (const url of CANDIDATE_URLS) {
    log(`\n--- 대화 시도: ${url.slice(0, 70)} ---`);

    // intercept 설정 후 navigate
    const intercepted = new Map();
    await page.route("**/*", async (route) => {
      const req = route.request();
      const u   = req.url();
      if (/oaiusercontent|backend-api.*estuary|dalle/.test(u) && req.resourceType() === "image") {
        try {
          const res = await route.fetch();
          const body = await res.body();
          if (body && body.length > 50_000) {
            intercepted.set(u, body);
            log(`  intercept: ${u.slice(0, 70)} (${Math.round(body.length/1024)}KB)`);
          }
          await route.fulfill({ response: res, body });
        } catch { await route.continue().catch(() => {}); }
      } else {
        await route.continue().catch(() => {});
      }
    });

    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 25000 });
      await page.waitForTimeout(5000);
    } catch (e) {
      warn(`  navigate 오류: ${e.message}`);
      await page.unroute("**/*").catch(() => {});
      continue;
    }

    await page.unroute("**/*").catch(() => {});

    // 스크린샷
    await page.screenshot({
      path: `${QA_DIR}/recover2_${url.split("/c/")[1]?.slice(0, 8) || "x"}.png`,
      fullPage: false,
    }).catch(() => {});

    // 방법 1: intercept
    const refSizeKB = Math.round(fs.statSync(path.join(KF_DIR, "s4_kf_qa_pass.png")).size / 1024);
    const icCands = [...intercepted.values()]
      .filter(b => {
        const kb = Math.round(b.length / 1024);
        return b.length > 100_000 && Math.abs(kb - refSizeKB) / refSizeKB > 0.10;
      })
      .sort((a, b_) => b_.length - a.length);

    if (icCands.length > 0) {
      buf = icCands[0];
      log(`intercept 회수 성공: ${Math.round(buf.length/1024)}KB`);
      break;
    }

    // 방법 2: DOM fetch
    buf = await tryFetchImgFromPage(page);
    if (buf) {
      log(`DOM fetch 회수 성공: ${Math.round(buf.length/1024)}KB`);
      break;
    }

    log(`  이 대화에서 이미지 없음`);
  }

  await page.screenshot({ path: `${QA_DIR}/recover2_final.png`, fullPage: false }).catch(() => {});
  await browser.close().catch(() => {});

  if (!buf) {
    warn("모든 대화 URL 순회 후 이미지 회수 실패 → PENDING_RECOVERY");
    const reportPath = `${QA_DIR}/report.json`;
    let report = {};
    try { report = JSON.parse(fs.readFileSync(reportPath, "utf-8")); } catch {}
    report.status = "PENDING_RECOVERY";
    report.recover_note = "대화 URL 순회 실패 — 수동 회수 필요";
    report.recover2_at  = new Date().toISOString();
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    process.exit(1);
  }

  const hash = md5short(buf);
  const kb   = Math.round(buf.length / 1024);
  log(`회수 이미지: ${kb}KB, md5=${hash}`);

  if (FAIL_MD5.has(hash)) {
    warn(`CLONE_DETECTED: md5=${hash} — FAIL`);
    const failPath = path.join(KF_DIR, `_FAIL_s3_bossfree_clone_md5_${hash}_recover.png`);
    fs.writeFileSync(failPath, buf);
    const reportPath = `${QA_DIR}/report.json`;
    let report = {};
    try { report = JSON.parse(fs.readFileSync(reportPath, "utf-8")); } catch {}
    report.status = "fail_clone_recover";
    report.md5    = hash;
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    process.exit(1);
  }

  fs.writeFileSync(SAVE_PATH, buf);
  log(`저장 완료: ${SAVE_PATH}`);

  const reportPath = `${QA_DIR}/report.json`;
  let report = {};
  try { report = JSON.parse(fs.readFileSync(reportPath, "utf-8")); } catch {}
  report.status       = "candidate_owner_qa_pending";
  report.file         = SAVE_PATH;
  report.size_kb      = kb;
  report.md5          = hash;
  report.recovered_at = new Date().toISOString();
  report.recover_method = "intercept_or_dom";
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  log("=== recover v2 완료 ===");
  log(`파일: ${SAVE_PATH} (${kb}KB, md5=${hash})`);
  log("신규 메시지 전송: 0회");
  log("⚠️  Owner 육안 QA 필요");
}

run().catch(e => {
  console.error(`[FATAL] ${e.message}`);
  process.exit(1);
});
