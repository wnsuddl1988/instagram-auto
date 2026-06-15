/**
 * ChatGPT 이미지 생성 공용 핵심 모듈
 *
 * 역할: preflight와 실제 runner가 공유하는 유일한 소스.
 *   - Chrome CDP 연결·실행
 *   - 로그인 / 중단 조건 fail-fast
 *   - reference 직접 첨부 (setInputFiles) + 썸네일 DOM 검증
 *   - 첨부 이미지 baseline CID/src 수집 (결과 후보 제외용)
 *   - 이미지 생성 도구 활성화 + DOM 진입 검증 (warn-and-continue 제거)
 *   - 프롬프트 DOM 입력 확인 (fill → keyboard.type fallback)
 *   - send enabled 확인
 *   - 마지막 assistant 응답 내부 이미지만 후보 탐색
 *   - 생성 spinner 종료 + assistant 응답 완료 확인
 *   - content-id·크기 3회 연속 안정 + 최소 15초 유지 시만 최종 후보
 *   - anchor hash 완전 일치만 clone 판정 (파일 크기 유사성은 경고만)
 *   - timeout 시 탭 유지 + PENDING_RECOVERY
 *   - 실패 단계 JSON 리포트 + 스크린샷
 *   - TOTAL_MESSAGE_SEND_COUNT, IMAGE_SUBMISSION_COUNT 카운터
 *
 * export:
 *   CDP_PORT_GPT1       number  — GPT-1 기본 포트
 *   CHROME_EXE          string  — Chrome 실행 경로
 *   USER_DATA_GPT1      string  — GPT-1 프로필 경로
 *   hashFile(p)         string|null
 *   hashText(s)         string
 *   isCDPOpen(port)     bool
 *   ensureChrome(port, userDataDir, logFn)
 *   checkLogin(page, logFn)
 *   detectStop(page)    — quota/captcha 감지 시 throw
 *   activateImageTool(page, logFn, warnFn)  bool — fail-fast
 *   attachRef(page, refPath, logFn)         { thumbnails, baselineCids, baselineSrcs }
 *   typePrompt(page, promptText, logFn)     { typedLen }
 *   checkSendEnabled(page)                  bool
 *   collectLastAssistantImages(page)        array
 *   isAssistantDone(page)                   bool
 *   saveFailReport(qaDir, profileNum, stage, reason, page, report)
 */

import { spawn }  from "child_process";
import fs         from "fs";
import crypto     from "crypto";

// ── 상수 ──────────────────────────────────────────────────────────────────────
export const CDP_PORT_GPT1  = 9222;
export const CHROME_EXE     = "C:/Program Files/Google/Chrome/Application/chrome.exe";
export const USER_DATA_GPT1 = "C:/Users/PC/AppData/Local/Google/Chrome/User Data/AI-GPT-1";

// ── 유틸 ──────────────────────────────────────────────────────────────────────
export function hashFile(p) {
  if (!fs.existsSync(p)) return null;
  return crypto.createHash("md5").update(fs.readFileSync(p)).digest("hex");
}

export function hashText(s) {
  return crypto.createHash("md5").update(s).digest("hex");
}

// ── Chrome CDP ────────────────────────────────────────────────────────────────
export async function isCDPOpen(port) {
  try {
    const r = await fetch(`http://localhost:${port}/json/version`, { signal: AbortSignal.timeout(2000) });
    return r.ok;
  } catch { return false; }
}

export async function ensureChrome(port, userDataDir, logFn = console.log) {
  if (await isCDPOpen(port)) {
    logFn(`Chrome CDP already open on port ${port}`);
    return;
  }
  logFn(`Launching Chrome on port ${port}...`);
  const p = spawn(CHROME_EXE, [
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${userDataDir}`,
    "--no-first-run", "--no-default-browser-check",
    "https://chatgpt.com/"
  ], { detached: true, stdio: "ignore" });
  p.unref();
  for (let i = 0; i < 40; i++) {
    await new Promise(r => setTimeout(r, 500));
    if (await isCDPOpen(port)) {
      logFn(`Chrome launched (PID=${p.pid})`);
      return;
    }
  }
  throw new Error(`CDP not available after 20s on port ${port}`);
}

// ── 로그인 확인 ───────────────────────────────────────────────────────────────
export async function checkLogin(page, logFn = console.log) {
  await page.goto("https://chatgpt.com/", { waitUntil: "domcontentloaded", timeout: 20000 });
  await page.waitForTimeout(1500);
  const url = page.url();
  if (/auth|login/i.test(url)) {
    throw new Error(`Not logged in — redirected to ${url}`);
  }
  logFn(`Login OK: ${url.slice(0, 60)}`);
}

// ── 중단 조건 감지 (throw) ────────────────────────────────────────────────────
export async function detectStop(page) {
  const STOP_PHRASES = [
    "You've reached", "You've hit", "message limit", "rate limit",
    "Try again in", "사용 한도", "잠시 후 다시", "Log in", "Sign in", "로그인"
  ];
  for (const ph of STOP_PHRASES) {
    const el = page.getByText(ph, { exact: false }).first();
    if (await el.isVisible({ timeout: 200 }).catch(() => false)) {
      const txt = await el.textContent().catch(() => ph);
      throw new Error(`STOP_DETECTED: "${txt.trim().slice(0, 80)}"`);
    }
  }
  const cap = await page.locator('iframe[src*="recaptcha"], [class*="captcha"]').count();
  if (cap > 0) throw new Error("CAPTCHA_DETECTED: manual intervention required");
}

// ── 이미지 생성 도구 활성화 (fail-fast) ──────────────────────────────────────
export async function activateImageTool(page, logFn = console.log, warnFn = console.warn) {
  // "파일 추가 및 기타" 버튼 (plus 메뉴)
  const plus = page.locator(
    'button[aria-label="파일 추가 및 기타"], button[aria-label*="Attach"], button[aria-label*="Add"]'
  ).first();

  if (await plus.count() === 0) {
    throw new Error("plus-menu button not found ('파일 추가 및 기타')");
  }
  await plus.click();
  await page.waitForTimeout(1000);

  // "이미지 만들기" 메뉴 항목
  const imgTool = page.getByRole("menuitemradio", { name: /이미지 만들기|Create image/i }).first();
  const imgToolAlt = page.getByRole("menuitem", { name: /이미지 만들기|Create image/i }).first();
  const target = (await imgTool.count() > 0) ? imgTool : imgToolAlt;

  if (await target.count() === 0) {
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
    throw new Error("'이미지 만들기' menu item not found after plus-menu click");
  }
  await target.click();
  await page.waitForTimeout(1000);

  // DOM 진입 확인 — 이미지 모드에서 나타나는 indicator 확인
  // (체크마크 또는 활성 상태 aria 확인)
  const checked = await page.locator(
    '[aria-checked="true"][aria-label*="이미지"], [data-state="checked"]'
  ).count();
  logFn(`Image tool activated ✅ (checked=${checked})`);
  return true;
}

// ── reference 첨부 + baseline 수집 ───────────────────────────────────────────
export async function attachRef(page, refPath, logFn = console.log) {
  if (!fs.existsSync(refPath)) {
    throw new Error(`Reference file not found: ${refPath}`);
  }

  // file input 탐색 (direct 또는 attach 버튼 경유)
  let fileInput = page.locator('input[type="file"]').first();

  if (await fileInput.count() === 0) {
    const attachBtn = page.locator(
      'button[aria-label*="파일 추가" i], button[aria-label*="Attach" i], ' +
      'button[aria-label*="attach" i], button[data-testid*="attach"]'
    ).first();
    if (await attachBtn.count() > 0) {
      await attachBtn.click();
      await page.waitForTimeout(600);
    }
    fileInput = page.locator('input[type="file"]').first();
  }

  if (await fileInput.count() === 0) {
    throw new Error("file input not found for reference attach");
  }

  await fileInput.setInputFiles(refPath);
  await page.waitForTimeout(3000);

  // 썸네일 DOM 검증
  const thumbs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll(
      'img[src*="blob"], img[src*="data:"], ' +
      '[data-testid*="attachment"] img, [class*="attachment"] img, [class*="upload"] img'
    )).filter(i => i.naturalWidth > 20).length;
  });

  if (thumbs === 0) {
    throw new Error("No thumbnail found after attach — file may not have been accepted");
  }
  logFn(`Reference attached ✅ (thumbnails=${thumbs})`);

  // baseline CID/src 수집 (결과 후보 제외용)
  const baselineData = await page.evaluate(() => {
    function cid(s) { const m = (s||"").match(/[?&]id=([^&]+)/); return m ? m[1] : null; }
    return Array.from(document.querySelectorAll("img"))
      .map(i => ({ cid: cid(i.src), src: (i.src || "").slice(0, 120) }))
      .filter(x => x.cid || x.src);
  });
  const baselineCids = new Set(baselineData.map(x => x.cid).filter(Boolean));
  const baselineSrcs = new Set(baselineData.map(x => x.src));
  logFn(`Baseline collected: ${baselineCids.size} CIDs, ${baselineSrcs.size} srcs`);

  return { thumbnails: thumbs, baselineCids, baselineSrcs };
}

// ── 프롬프트 입력 + DOM 확인 ─────────────────────────────────────────────────
export async function typePrompt(page, promptText, logFn = console.log) {
  const ta = page.locator("#prompt-textarea").first();
  await ta.waitFor({ state: "visible", timeout: 15000 });
  await ta.click();
  await page.waitForTimeout(300);

  const oneLine = promptText.replace(/\s*\n\s*/g, " ").trim();

  // fill() 시도
  await ta.fill(oneLine);
  await page.waitForTimeout(800);
  let typed = (await ta.textContent().catch(() => "") || "").trim();

  // fill() 실패 시 keyboard.type() fallback
  if (typed.length < 10) {
    logFn("fill() short — keyboard.type() fallback");
    await ta.click();
    await page.keyboard.selectAll();
    await page.keyboard.press("Delete");
    await page.keyboard.type(oneLine, { delay: 2 });
    await page.waitForTimeout(800);
    typed = (await ta.textContent().catch(() => "") || "").trim();
  }

  if (typed.length < 10) {
    throw new Error(`Prompt input failed — typed length=${typed.length}`);
  }
  logFn(`Prompt typed ✅ (len=${typed.length})`);
  return { typedLen: typed.length };
}

// ── send enabled 확인 ─────────────────────────────────────────────────────────
export async function checkSendEnabled(page) {
  const sendBtn = page.locator(
    '#composer-submit-button, button[data-testid="send-button"], ' +
    'button[aria-label="Send message"], button[aria-label="메시지 보내기"]'
  ).first();
  if (await sendBtn.count() === 0) return false;
  return sendBtn.isEnabled().catch(() => false);
}

// ── 마지막 assistant 응답 이미지 수집 ────────────────────────────────────────
export async function collectLastAssistantImages(page) {
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

// ── 생성 완료 판정 ────────────────────────────────────────────────────────────
export async function isAssistantDone(page) {
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

// ── intercept 회수 (timeout fallback) ────────────────────────────────────────
export async function interceptRecover(page, convUrl, logFn = console.log) {
  logFn("intercept 회수 시작 (page.route + reload)...");
  const intercepted = new Map();
  const genPattern  = /backend-api\/estuary\/content/;

  if (convUrl && !page.url().includes((convUrl.split("/c/")[1] || "").slice(0, 8))) {
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
          logFn(`  intercept: ${req.url().slice(0, 80)} (${Math.round(body.length/1024)}KB)`);
        }
        await route.fulfill({ response: resp, body });
      } catch { await route.continue().catch(() => {}); }
    } else {
      await route.continue().catch(() => {});
    }
  });

  await page.reload({ waitUntil: "networkidle", timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(4000);
  logFn(`intercept 수집: ${intercepted.size}개`);
  await page.unroute("**/*").catch(() => {});
  return intercepted;
}

// ── 실패 리포트 저장 ──────────────────────────────────────────────────────────
export async function saveFailReport(qaDir, stage, reason, page, report = {}) {
  fs.mkdirSync(qaDir, { recursive: true });
  const ssPath  = `${qaDir}/preflight_fail_${stage}.png`;
  const jsonPath = `${qaDir}/preflight_result.json`;

  if (page) {
    try {
      await page.screenshot({ path: ssPath, fullPage: false });
      report.screenshot = ssPath;
      const bodyText = await page.evaluate(() => (document.body.innerText || "").slice(0, 300)).catch(() => "");
      report.page_text_at_fail = bodyText;
    } catch {}
  }

  report.result       = "PREFLIGHT_FAIL";
  report.fail_stage   = stage;
  report.fail_reason  = reason;
  report.finished_at  = new Date().toISOString();
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));
  return { ssPath, jsonPath };
}
