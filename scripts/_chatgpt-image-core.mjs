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
 *   openFreshImageChat(page, logFn) — 사람의 초안을 건드리지 않는 이미지 전용 일반 새 대화
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

/** 임시 채팅은 이미지 만들기 메뉴가 없으므로 일반 새 대화 루트만 사용한다. */
export const CHATGPT_IMAGE_FRESH_CHAT_URL = "https://chatgpt.com/";
export const CHATGPT_IMAGE_AUTOMATION_PROMPT_PREFIX =
  "GENERATE ONE BRAND-NEW ORIGINAL TEXT-TO-IMAGE ASSET.";

/** 이미지 생성은 Work가 아니라 일반 Chat 모드에서만 허용한다. */
export async function ensureChatMode(page, logFn = console.log) {
  const deadline = Date.now() + 10_000;
  let chat = null;
  let work = null;
  do {
    chat = await firstVisibleExactLabelLocator([
      page.locator('[role="radio"]'),
      page.locator('[role="tab"]'),
      page.locator('button'),
    ], ["Chat"]);
    work = await firstVisibleExactLabelLocator([
      page.locator('[role="radio"]'),
      page.locator('[role="tab"]'),
      page.locator('button'),
    ], ["Work"]);
    if (chat && work) break;
    await page.waitForTimeout(300);
  } while (Date.now() < deadline);
  if (!chat || !work) {
    const diagnostics = await page.evaluate(() => Array.from(document.querySelectorAll('button, [role]'))
      .map((element) => ({
        tag: element.tagName.toLocaleLowerCase(),
        role: element.getAttribute("role"),
        text: String(element.textContent || "").replace(/\s+/g, " ").trim().slice(0, 60),
        ariaLabel: String(element.getAttribute("aria-label") || "").replace(/\s+/g, " ").trim().slice(0, 60),
        dataState: element.getAttribute("data-state"),
        ariaChecked: element.getAttribute("aria-checked"),
        ariaSelected: element.getAttribute("aria-selected"),
        ariaPressed: element.getAttribute("aria-pressed"),
      }))
      .filter((item) => /chat|work|채팅|작업/i.test(`${item.text} ${item.ariaLabel}`))
      .slice(0, 12));
    throw new Error(`IMAGE_TOOL_CHAT_MODE_SELECTOR_MISSING:${JSON.stringify(diagnostics)}`);
  }

  const selectionState = async (locator) => locator.evaluate((element) => {
    const attributes = {
      dataState: element.getAttribute("data-state"),
      ariaChecked: element.getAttribute("aria-checked"),
      ariaSelected: element.getAttribute("aria-selected"),
      ariaPressed: element.getAttribute("aria-pressed"),
      dataSelected: element.getAttribute("data-selected"),
    };
    const values = Object.values(attributes).filter(Boolean).map((value) => String(value).toLocaleLowerCase());
    return { attributes, active: values.some((value) => ["on", "true", "active", "selected"].includes(value)) };
  });

  let chatState = await selectionState(chat);
  if (!chatState.active) {
    await chat.click({ timeout: 5000 });
    await page.waitForTimeout(800);
  }
  chatState = await selectionState(chat);
  const workState = await selectionState(work);
  if (!chatState.active || workState.active) {
    throw new Error(`IMAGE_TOOL_CHAT_MODE_NOT_ACTIVE: chat=${JSON.stringify(chatState.attributes)}, work=${JSON.stringify(workState.attributes)}`);
  }
  logFn("Chat mode active (Work mode off)");
}

async function readComposerUserText(page, { ignoreStandaloneToolLabel = false } = {}) {
  const ta = page.locator("#prompt-textarea").first();
  await ta.waitFor({ state: "visible", timeout: 15000 });
  const normalizedText = await ta.evaluate((element, automationPrefix) => {
    const clone = element.cloneNode(true);
    clone.querySelectorAll("[data-inline-selection-pill]").forEach((pill) => pill.remove());
    clone.querySelectorAll('[data-id="picture_v2"], [data-system-hint-type="picture_v2"]').forEach((pill) => pill.remove());
    clone.querySelectorAll('[contenteditable="false"], button, [role="button"]').forEach((candidate) => {
      const text = String(candidate.textContent || "").replace(/\s+/g, " ").trim().toLocaleLowerCase();
      const aria = String(candidate.getAttribute("aria-label") || "").replace(/\s+/g, " ").trim().toLocaleLowerCase();
      if ([text, aria].some((value) => value === "이미지 만들기" || value === "create image")) candidate.remove();
    });
    const normalized = String(clone.textContent || "").replace(/\s+/g, " ").trim();
    const withoutToolLabel = normalized.replace(/^(?:이미지 만들기|create image)\s*/i, "");
    return withoutToolLabel.startsWith(automationPrefix) ? withoutToolLabel : normalized;
  }, CHATGPT_IMAGE_AUTOMATION_PROMPT_PREFIX);
  if (ignoreStandaloneToolLabel && /^(?:이미지 만들기|create image)$/i.test(normalizedText)) {
    return "";
  }
  return normalizedText;
}

export async function openFreshImageChat(page, logFn = console.log) {
  try {
    await page.goto(CHATGPT_IMAGE_FRESH_CHAT_URL, { waitUntil: "domcontentloaded", timeout: 20000 });
  } catch (error) {
    throw new Error(`IMAGE_TOOL_CHAT_OPEN_FAILED: ${String(error?.message ?? error).slice(0, 100)}`);
  }
  await page.waitForTimeout(1500);
  if (/auth|login/i.test(page.url())) throw new Error("LOGIN_REQUIRED");
  if (/temporary-chat=true/i.test(page.url())) {
    throw new Error("IMAGE_TOOL_TEMPORARY_CHAT_UNSUPPORTED");
  }
  await ensureChatMode(page, logFn);
  const existingUserText = await readComposerUserText(page);
  if (existingUserText) {
    if (!existingUserText.startsWith(CHATGPT_IMAGE_AUTOMATION_PROMPT_PREFIX)) {
      throw new Error(`IMAGE_TOOL_OWNER_DRAFT_PRESENT: existing draft length=${existingUserText.length}`);
    }
    const ta = page.locator("#prompt-textarea").first();
    await ta.fill("");
    await page.waitForTimeout(300);
    let remainingAutomationText = await readComposerUserText(page, { ignoreStandaloneToolLabel: true });
    if (remainingAutomationText) {
      await ta.click();
      await page.keyboard.press("Control+A");
      await page.keyboard.press("Backspace");
      await page.waitForTimeout(300);
      remainingAutomationText = await readComposerUserText(page, { ignoreStandaloneToolLabel: true });
    }
    if (remainingAutomationText) {
      throw new Error(`IMAGE_TOOL_AUTOMATION_DRAFT_CLEAR_FAILED: remaining length=${remainingAutomationText.length}`);
    }
    logFn("Cleared stale automation-owned image draft");
  }
  logFn("Fresh regular image chat ready (Owner draft preserved)");
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
async function firstVisibleLocator(candidates) {
  for (const candidate of candidates) {
    const count = await candidate.count();
    for (let i = 0; i < count; i += 1) {
      const item = candidate.nth(i);
      if (await item.isVisible({ timeout: 350 }).catch(() => false)) return item;
    }
  }
  return null;
}

async function firstVisibleExactLabelLocator(candidates, labels) {
  const normalizedLabels = labels.map((label) => label.toLocaleLowerCase());
  for (const candidate of candidates) {
    const count = await candidate.count();
    for (let i = 0; i < count; i += 1) {
      const item = candidate.nth(i);
      if (!(await item.isVisible({ timeout: 350 }).catch(() => false))) continue;
      const values = await item.evaluate((element) => [
        String(element.textContent || "").replace(/\s+/g, " ").trim(),
        String(element.getAttribute("aria-label") || "").replace(/\s+/g, " ").trim(),
      ]).catch(() => []);
      if (values.some((value) => normalizedLabels.includes(value.toLocaleLowerCase()))) return item;
    }
  }
  return null;
}

/** 내부 picture_v2 ID 또는 작성창 전체에 표시된 정확한 이미지 도구 칩 라벨로 활성 상태를 확인한다. */
export async function verifyImageToolActive(page) {
  const prompt = page.locator("#prompt-textarea").first();
  const composer = prompt.locator('xpath=ancestor::*[self::form or @data-type="unified-composer"][1]');
  const activeChip = await firstVisibleLocator([
    page.locator('#prompt-textarea [data-inline-selection-pill][data-id="picture_v2"]'),
    page.locator('#prompt-textarea [data-inline-selection-pill][data-system-hint-type="picture_v2"]'),
    composer.locator('[data-inline-selection-pill][data-id="picture_v2"]'),
    composer.locator('[data-inline-selection-pill][data-system-hint-type="picture_v2"]'),
    composer.locator('[data-id="picture_v2"]'),
    composer.locator('[data-system-hint-type="picture_v2"]'),
  ]);
  if (activeChip) return true;

  // 현재 UI는 이미지 칩을 #prompt-textarea의 형제 요소로 렌더링할 수 있다.
  // 내부 ID가 바뀌어도 작성창 컨테이너 안의 정확한 라벨만 보조 신호로 인정한다.
  const labeledChip = await firstVisibleExactLabelLocator([
    page.locator('#prompt-textarea [data-inline-selection-pill]'),
    page.locator('#prompt-textarea [contenteditable="false"]'),
    composer.locator('[data-inline-selection-pill]'),
    composer.locator('[contenteditable="false"]'),
    composer.locator('button'),
    composer.locator('[role="button"]'),
  ], ["이미지 만들기", "Create image"]);
  return labeledChip !== null;
}

export async function waitForImageToolActive(page, timeoutMs = 5000) {
  const deadline = Date.now() + timeoutMs;
  do {
    if (await verifyImageToolActive(page)) return true;
    const remaining = deadline - Date.now();
    if (remaining <= 0) break;
    await page.waitForTimeout(Math.min(250, remaining));
  } while (Date.now() < deadline);
  return false;
}

async function waitForDirectImageEntry(page, timeoutMs = 3500) {
  const deadline = Date.now() + timeoutMs;
  do {
    const target = await firstVisibleLocator([
      page.locator("button").filter({ hasText: /^이미지 만들기$/ }),
      page.locator("button").filter({ hasText: /^Create image$/i }),
    ]);
    if (target) return target;
    const remaining = deadline - Date.now();
    if (remaining <= 0) break;
    await page.waitForTimeout(Math.min(250, remaining));
  } while (Date.now() < deadline);
  return null;
}

async function activateDirectImageEntry(page, target, logFn, source) {
  await target.click({ timeout: 5000 }).catch((error) => {
    throw new Error(`IMAGE_TOOL_ENTRY_UNUSABLE: direct create-image button click failed (${String(error?.message ?? error).slice(0, 80)})`);
  });
  if (!(await waitForImageToolActive(page, 8000))) {
    throw new Error("IMAGE_TOOL_NOT_ACTIVE: direct create-image button did not create a picture_v2 chip");
  }
  logFn(`Image tool activated (${source}, composer chip verified)`);
  return true;
}

export async function activateImageTool(page, logFn = console.log, warnFn = console.warn) {
  if (await verifyImageToolActive(page)) {
    logFn("Image tool already active (composer chip verified)");
    return true;
  }

  // 빈 일반 채팅의 현재 UI는 이미지 만들기를 + 메뉴가 아닌 홈 화면 직접 버튼으로 제공한다.
  // 오버레이를 열기 전에 정확한 버튼을 먼저 사용해야 가려진 버튼 클릭/메뉴 오탐이 없다.
  const directTarget = await waitForDirectImageEntry(page);
  if (directTarget) {
    return activateDirectImageEntry(page, directTarget, logFn, "direct home button");
  }

  const plus = await firstVisibleLocator([
    page.locator('button[data-testid="composer-plus-btn"]'),
    page.locator('button[aria-label="파일 등 추가"]'),
    page.locator('button[aria-label="파일 추가 및 기타"]'),
    page.locator('button[aria-label*="Attach" i]'),
    page.locator('button[aria-label*="Add" i]'),
  ]);
  if (!plus) throw new Error("IMAGE_TOOL_ENTRY_MISSING: composer plus button not found");

  await plus.click({ timeout: 5000 }).catch((error) => {
    throw new Error(`IMAGE_TOOL_ENTRY_UNUSABLE: plus button click failed (${String(error?.message ?? error).slice(0, 80)})`);
  });
  await page.waitForTimeout(500);

  const target = await firstVisibleLocator([
    page.getByRole("menuitemradio", { name: /^이미지 만들기$|^Create image$/i }),
    page.getByRole("menuitem", { name: /^이미지 만들기$|^Create image$/i }),
  ]);
  if (!target) {
    await page.keyboard.press("Escape").catch(() => {});
    // 최신 홈 UI의 직접 버튼은 composer보다 늦게 hydrate될 수 있다. + 메뉴에 없으면
    // 오버레이를 닫고 직접 버튼을 한 번 더 기다려 초기 로딩 경쟁 조건을 흡수한다.
    const delayedDirectTarget = await waitForDirectImageEntry(page, 7000);
    if (delayedDirectTarget) {
      return activateDirectImageEntry(page, delayedDirectTarget, logFn, "delayed direct home button");
    }
    throw new Error("IMAGE_TOOL_ENTRY_MISSING: exact create-image menu item not found");
  }

  await target.click({ timeout: 5000 }).catch((error) => {
    throw new Error(`IMAGE_TOOL_ENTRY_UNUSABLE: create-image menu click failed (${String(error?.message ?? error).slice(0, 80)})`);
  });
  if (!(await waitForImageToolActive(page, 5000))) {
    warnFn("Create-image menu was clicked, but no active composer chip appeared.");
    throw new Error("IMAGE_TOOL_NOT_ACTIVE: composer activation marker missing");
  }

  logFn("Image tool activated (composer chip verified)");
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
  const oneLine = promptText.replace(/\s*\n\s*/g, " ").trim();
  const imageToolActive = await verifyImageToolActive(page);

  if (imageToolActive) {
    // contenteditable fill()은 picture_v2 inline pill까지 통째로 지운다.
    // 활성 칩 뒤에 키보드 입력만 추가해 React의 이미지 생성 상태를 보존한다.
    const existingUserText = await readComposerUserText(page, { ignoreStandaloneToolLabel: true });
    if (existingUserText) throw new Error(`PROMPT_NOT_EMPTY: existing draft length=${existingUserText.length}`);
    await ta.click();
    await page.keyboard.press("End");
    await page.keyboard.type(oneLine, { delay: 2 });
    await page.waitForTimeout(500);
    const typed = await readComposerUserText(page, { ignoreStandaloneToolLabel: true });
    if (typed !== oneLine) throw new Error(`Prompt input mismatch — expected=${oneLine.length}, typed=${typed.length}`);
    if (!(await verifyImageToolActive(page))) {
      throw new Error("IMAGE_TOOL_NOT_ACTIVE: picture_v2 pill disappeared while typing");
    }
    logFn(`Prompt typed with image pill preserved ✅ (len=${typed.length})`);
    return { typedLen: typed.length, imageToolPreserved: true };
  }

  await ta.click();
  await page.waitForTimeout(300);

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
    'button[aria-label="Send message"], button[aria-label="메시지 보내기"], ' +
    'button[aria-label="프롬프트 보내기"]'
  ).first();
  if (await sendBtn.count() === 0) return false;
  return sendBtn.isEnabled().catch(() => false);
}

export async function sendPrompt(page) {
  const sendBtn = page.locator(
    '#composer-submit-button, button[data-testid="send-button"], ' +
    'button[aria-label="Send message"], button[aria-label="메시지 보내기"], ' +
    'button[aria-label="프롬프트 보내기"]'
  ).first();
  if (await sendBtn.count() === 0) throw new Error("SEND_BUTTON_MISSING");
  if (!(await sendBtn.isEnabled().catch(() => false))) throw new Error("SEND_BUTTON_DISABLED");
  await sendBtn.click();
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
