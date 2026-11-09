/**
 * S2 탭 확보 방법 탐색 — 메시지 전송 0회
 * "새 채팅" 버튼 또는 사이드바 New chat → /app/<id> URL 확보 후
 * Veo 모드 + 파일 첨부 가능 여부 확인
 * 전송 없음.
 */
import { chromium } from "playwright";
import { spawn } from "child_process";

const PORT = 9223;
const CHROME_EXE = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const USER_DATA = "C:\\Users\\PC\\AppData\\Local\\Google\\Chrome\\User Data\\AI-Gemini-1";

async function isCDP() {
  try { const r = await fetch(`http://localhost:${PORT}/json/version`, { signal: AbortSignal.timeout(2000) }); return r.ok; }
  catch { return false; }
}

if (!(await isCDP())) {
  spawn(CHROME_EXE, [
    `--remote-debugging-port=${PORT}`, `--user-data-dir=${USER_DATA}`,
    "--no-first-run", "--no-default-browser-check", "https://gemini.google.com/"
  ], { detached: true, stdio: "ignore" }).unref();
  for (let i = 0; i < 40; i++) {
    await new Promise(r => setTimeout(r, 500));
    if (await isCDP()) break;
  }
}

const b = await chromium.connectOverCDP(`http://localhost:${PORT}`);
const ctx = b.contexts()[0];

// 기존 탭 목록
const pages = ctx.pages();
console.log("Existing tabs:", pages.map(p => p.url()));

// 새 탭 열기 → gemini.google.com
const page = await ctx.newPage();
await page.goto("https://gemini.google.com/", { waitUntil: "domcontentloaded", timeout: 25000 });
await page.waitForTimeout(2000);
console.log("Current URL:", page.url());

// "새 채팅" 버튼 탐색 (사이드바)
const newChatBtns = await page.evaluate(() =>
  Array.from(document.querySelectorAll("button, a"))
    .filter(el => /새 채팅|New chat|새 대화|compose/i.test(el.textContent || el.getAttribute("aria-label") || ""))
    .map(el => ({ tag: el.tagName, text: el.textContent?.trim().slice(0, 40), label: el.getAttribute("aria-label") }))
);
console.log("\nNew chat buttons:", JSON.stringify(newChatBtns, null, 2));

// 현재 URL이 이미 /app/<id>인지 확인
console.log("\nURL after load:", page.url());
const isConvTab = /\/app\/[a-f0-9]+/.test(page.url());
console.log("Is conversation tab:", isConvTab);

// "업로드 및 도구" 클릭 → 파일 메뉴 있는지
const toolBtn = page.locator('button[aria-label="업로드 및 도구"]').first();
if (await toolBtn.count() > 0) {
  await toolBtn.click();
  await page.waitForTimeout(1200);
  const menuTexts = await page.evaluate(() =>
    Array.from(document.querySelectorAll("mat-menu-content *, [class*='menu'] *"))
      .map(el => el.textContent?.trim()).filter(t => t && t.length > 1 && t.length < 40)
      .filter((v, i, a) => a.indexOf(v) === i)
  );
  console.log("\nMenu texts (root tab):", menuTexts);
  const hasFile = menuTexts.some(t => /파일|File/i.test(t));
  console.log("Has 파일 menu:", hasFile);
  await page.keyboard.press("Escape");
} else {
  console.log("\n업로드 및 도구 button NOT found");
}

// 사이드바 "새 채팅" 클릭 후 URL 변화 관찰
const newChatByText = page.getByText(/새 채팅|New chat/i).first();
const newChatByLabel = page.locator('[aria-label*="새 채팅"], [aria-label*="New chat"]').first();
const newChatBtn2 = (await newChatByText.count() > 0) ? newChatByText : newChatByLabel;
console.log("\nNew chat element count:", await newChatBtn2.count());

if (await newChatBtn2.count() > 0) {
  await newChatBtn2.click();
  await page.waitForTimeout(2000);
  console.log("URL after new chat click:", page.url());
  // /app/<id> URL로 바뀌면 트리거 없이 대화 탭 확보 가능
  const newIsConv = /\/app\/[a-f0-9]+/.test(page.url());
  console.log("Is conversation tab after new chat:", newIsConv);

  // 파일 메뉴 재확인
  if (newIsConv) {
    await page.waitForTimeout(1000);
    // Veo 활성화 먼저
    const tb = page.locator('button[aria-label="업로드 및 도구"]').first();
    if (await tb.count() > 0) {
      await tb.click();
      await page.waitForTimeout(1200);
      const m2 = await page.evaluate(() =>
        Array.from(document.querySelectorAll("mat-menu-content *, [class*='menu'] *"))
          .map(el => el.textContent?.trim()).filter(t => t && t.length > 1 && t.length < 40)
          .filter((v, i, a) => a.indexOf(v) === i)
      );
      console.log("Menu texts (new conv tab):", m2);
      await page.keyboard.press("Escape");
    }
  }
}

console.log("\n[0 messages sent, 0 Veo submissions]");
await b.close();
