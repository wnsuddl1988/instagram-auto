/**
 * S2 Veo 직접 첨부 탐색
 * gemini.google.com/app 루트 탭에서:
 *   1) Veo 활성화 (동영상 클릭)
 *   2) "파일" 메뉴로 이미지 첨부
 *   3) 프롬프트 입력
 *   ※ 전송 없음
 */
import { chromium } from "playwright";
import { spawn } from "child_process";

const PORT = 9223;
const CHROME_EXE = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const USER_DATA = "C:\\Users\\PC\\AppData\\Local\\Google\\Chrome\\User Data\\AI-Gemini-1";
const REF_IMG = "C:\\Users\\PC\\jjy\\instagram-auto\\output\\v2\\3d_sitcom_prod_v1\\upload_002_copier\\keyframes\\kf_s2_jammed_paper_continuity_fix.png";

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
const page = await ctx.newPage();
await page.goto("https://gemini.google.com/app", { waitUntil: "domcontentloaded", timeout: 25000 });
await page.waitForTimeout(2000);
console.log("URL:", page.url());

// Step 1: 동영상 도구 활성화
const toolBtn = page.locator('button[aria-label="업로드 및 도구"]').first();
await toolBtn.click();
await page.waitForTimeout(1200);

const videoItem = page.getByText("동영상", { exact: false }).first();
console.log("동영상 item:", await videoItem.count());
await videoItem.click();
await page.waitForTimeout(2000);

// 사용해 보기 다이얼로그
const tryBtn = page.getByRole("button").filter({ hasText: /사용해 보기|Try it|Got it/i }).first();
if (await tryBtn.count() > 0) { await tryBtn.click(); await page.waitForTimeout(800); console.log("dialog dismissed"); }

// 9:16 설정
const aspectBtn = page.locator('button[aria-label*="가로 모드"]').first();
if (await aspectBtn.count() > 0) {
  await aspectBtn.click();
  await page.waitForTimeout(800);
  const vert = page.getByText("세로 모드(9:16)").first();
  if (await vert.count() > 0) { await vert.click(); await page.waitForTimeout(600); console.log("9:16 set"); }
  else { await page.keyboard.press("Escape"); console.log("9:16 item not found"); }
}

// Step 2: "업로드 및 도구" → "파일" 메뉴로 첨부 시도 (Veo 활성 상태)
console.log("\n--- Trying 파일 menu after Veo activated ---");
await toolBtn.click();
await page.waitForTimeout(1200);

const menuTextsAfterVeo = await page.evaluate(() =>
  Array.from(document.querySelectorAll("mat-menu-content *, [class*='menu'] *"))
    .map(el => el.textContent?.trim()).filter(t => t && t.length > 1 && t.length < 40)
    .filter((v, i, a) => a.indexOf(v) === i)
);
console.log("Menu after Veo:", menuTextsAfterVeo);

const hasFileMenu = menuTextsAfterVeo.some(t => /^파일$/.test(t));
console.log("Has 파일 menu after Veo:", hasFileMenu);

if (hasFileMenu) {
  const fileItem = page.getByText("파일", { exact: true }).first();
  const [fc] = await Promise.all([
    page.waitForEvent("filechooser", { timeout: 5000 }).catch(() => null),
    fileItem.click(),
  ]);
  console.log("filechooser opened:", !!fc);
  if (fc) {
    await fc.setFiles(REF_IMG);
    await page.waitForTimeout(2000);
    const thumbs = await page.evaluate(() =>
      Array.from(document.querySelectorAll("img[src*='blob'], img[src*='data:']")).map(e => e.src?.slice(0, 60))
    );
    console.log("Thumbnails after attach:", thumbs.length);
    if (thumbs.length > 0) {
      console.log("\n✅ DIRECT ATTACH POSSIBLE — 트리거 없이 파일 첨부 가능!");
    } else {
      console.log("No thumbnail — may not be attached");
    }
  }
} else {
  await page.keyboard.press("Escape");
  console.log("파일 menu not available after Veo — trigger still needed");
}

console.log("\nFinal URL:", page.url());
console.log("[0 messages sent, 0 Veo submissions]");
await b.close();
