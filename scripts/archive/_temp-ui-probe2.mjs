/**
 * Gemini Veo UI 탐색 2 — 프롬프트 입력 후 전송 버튼 + 생성 중 UI 확인
 * 실제 전송 1회 (짧은 테스트 프롬프트)
 * NOTE: 이 스크립트는 실제 Veo 생성 1회를 사용합니다
 */
import { chromium } from "playwright";
import { spawn } from "child_process";

const CHROME_EXE = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const USER_DATA = "C:\\Users\\PC\\AppData\\Local\\Google\\Chrome\\User Data\\AI-Gemini-1";
const PORT = 9223;

async function isCDP() {
  try { const r = await fetch(`http://localhost:${PORT}/json/version`, { signal: AbortSignal.timeout(2000) }); return r.ok; }
  catch { return false; }
}

if (!(await isCDP())) {
  spawn(CHROME_EXE, [
    `--remote-debugging-port=${PORT}`, `--user-data-dir=${USER_DATA}`,
    "--no-first-run", "--no-default-browser-check", "https://gemini.google.com/app"
  ], { detached: true, stdio: "ignore" }).unref();
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 500));
    if (await isCDP()) break;
  }
}

const b = await chromium.connectOverCDP(`http://localhost:${PORT}`);
const ctx = b.contexts()[0];
const page = await ctx.newPage();
await page.goto("https://gemini.google.com/app", { waitUntil: "domcontentloaded", timeout: 25000 });
await page.waitForTimeout(3000);

// 동영상 도구 활성화
const toolBtn = page.locator('button[aria-label="업로드 및 도구"]').first();
await toolBtn.click();
await page.waitForTimeout(1500);
await page.getByText("동영상", { exact: false }).first().click();
await page.waitForTimeout(2000);
const tryBtn = page.getByRole("button").filter({ hasText: /사용해 보기|Try it|Got it/i }).first();
if (await tryBtn.count() > 0) { await tryBtn.click(); await page.waitForTimeout(800); }

// 세로 9:16
const aspectBtn = page.locator('button[aria-label*="가로 모드"]').first();
if (await aspectBtn.count() > 0) {
  await aspectBtn.click(); await page.waitForTimeout(1000);
  await page.getByText("세로 모드(9:16)").first().click().catch(() => {});
  await page.waitForTimeout(800);
}

// 프롬프트 입력 — rich-textarea 내부 contenteditable 자식 사용
const ta = page.locator('rich-textarea .ql-editor, rich-textarea [contenteditable="true"]').first();
const taFallback = page.locator('[contenteditable="true"]').first();
const input = (await ta.count() > 0) ? ta : taFallback;
await input.waitFor({ state: "visible", timeout: 10000 });
await input.click();
await page.waitForTimeout(500);

const TEST_PROMPT = "A simple office room. A man walks to a copier and presses a button. The copier shows an error light. 9:16 vertical format.";
// keyboard.type 사용 (contenteditable은 fill 불가)
await page.keyboard.type(TEST_PROMPT, { delay: 5 });
await page.waitForTimeout(1000);

const typed = await input.textContent().catch(() => "");
console.log("Typed chars:", typed?.length, "| preview:", typed?.slice(0, 50));

// 입력 후 전송 버튼 재탐색
const allBtns = await page.evaluate(() =>
  Array.from(document.querySelectorAll("button")).map(b => ({
    label: b.getAttribute("aria-label") || "",
    text: b.textContent?.trim().slice(0, 40) || "",
    disabled: b.disabled,
    class: b.className?.slice(0, 60) || ""
  })).filter(b => b.label || b.text)
);
console.log("\nAll buttons after text input:");
allBtns.forEach(b => console.log(JSON.stringify(b)));

// Enter 키로 전송 가능한지 확인 (실제 전송 전 상태 기록)
console.log("\n[NOT SENDING — probe only, 0 submissions]");
await page.close();
await b.close();
