/**
 * Gemini Veo UI 탐색 — 이미지 첨부 + 다운로드 버튼 selector 확인
 * 실제 제출 0회 (프롬프트 입력 후 전송하지 않음)
 */
import { chromium } from "playwright";
import { spawn } from "child_process";
import fs from "fs";

const CHROME_EXE = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const USER_DATA = "C:\\Users\\PC\\AppData\\Local\\Google\\Chrome\\User Data\\AI-Gemini-1";
const PORT = 9223;
const REF_IMG = "C:\\Users\\PC\\jjy\\instagram-auto\\output\\v2\\3d_sitcom_prod_v1\\upload_002_copier\\keyframes\\kf_s1_wide_copier_error.png";

async function isCDP() {
  try { const r = await fetch(`http://localhost:${PORT}/json/version`, { signal: AbortSignal.timeout(2000) }); return r.ok; }
  catch { return false; }
}

if (!(await isCDP())) {
  console.log("Launching Chrome G1...");
  spawn(CHROME_EXE, [
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${USER_DATA}`,
    "--no-first-run", "--no-default-browser-check",
    "https://gemini.google.com/app"
  ], { detached: true, stdio: "ignore" }).unref();
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 500));
    if (await isCDP()) { console.log("CDP ready"); break; }
  }
} else { console.log("CDP already open"); }

const b = await chromium.connectOverCDP(`http://localhost:${PORT}`);
const ctx = b.contexts()[0];
const page = await ctx.newPage();
await page.goto("https://gemini.google.com/app", { waitUntil: "domcontentloaded", timeout: 25000 });
await page.waitForTimeout(3000);

console.log("=== STEP 1: 동영상 도구 활성화 ===");
const toolBtn = page.locator('button[aria-label="업로드 및 도구"]').first();
await toolBtn.click();
await page.waitForTimeout(1500);
await page.getByText("동영상", { exact: false }).first().click();
await page.waitForTimeout(2000);

// 사용해보기 닫기
const tryBtn = page.getByRole("button").filter({ hasText: /사용해 보기|Try it|Got it/i }).first();
if (await tryBtn.count() > 0) { await tryBtn.click(); await page.waitForTimeout(800); }

// 세로 9:16
const aspectBtn = page.locator('button[aria-label*="가로 모드"]').first();
if (await aspectBtn.count() > 0) {
  await aspectBtn.click(); await page.waitForTimeout(1000);
  const vert = page.getByText("세로 모드(9:16)").first();
  if (await vert.count() > 0) { await vert.click(); await page.waitForTimeout(800); console.log("9:16 set"); }
}

console.log("\n=== STEP 2: 이미지 첨부 시도 ===");
// "업로드 및 도구" → 이미지
await toolBtn.click();
await page.waitForTimeout(1200);

// 이미지 메뉴 항목 확인
const allTexts = await page.evaluate(() =>
  Array.from(document.querySelectorAll("div, span, li, button"))
    .map(el => el.textContent?.trim().slice(0, 60))
    .filter(t => t && t.length > 1 && t.length < 50)
    .filter((v, i, a) => a.indexOf(v) === i)
    .slice(0, 30)
);
console.log("Visible texts after tool menu:", allTexts);

const imgItem = page.getByText("이미지", { exact: false }).first();
console.log("이미지 item count:", await imgItem.count());

// filechooser 캡처 시도
const [fileChooser] = await Promise.all([
  page.waitForEvent("filechooser", { timeout: 4000 }).catch(() => null),
  imgItem.count() > 0 ? imgItem.click() : Promise.resolve(),
]);
console.log("filechooser captured:", !!fileChooser);
if (fileChooser) {
  await fileChooser.setFiles(REF_IMG);
  await page.waitForTimeout(2000);
  console.log("Image attached via filechooser ✅");
} else {
  console.log("No filechooser — checking file input after click...");
  await page.waitForTimeout(1000);
  const fi = await page.locator('input[type="file"]').count();
  console.log("file inputs:", fi);
}

console.log("\n=== STEP 3: 입력창 + 전송 버튼 확인 ===");
const ta = page.locator('rich-textarea, [contenteditable="true"], textarea').first();
console.log("textarea visible:", await ta.isVisible().catch(() => false));

// 전송 버튼 탐색
const sendBtns = await page.evaluate(() =>
  Array.from(document.querySelectorAll("button")).map(b => ({
    label: b.getAttribute("aria-label") || "",
    text: b.textContent?.trim().slice(0, 30) || "",
    disabled: b.disabled,
    testid: b.getAttribute("data-testid") || ""
  })).filter(b => /전송|send|submit/i.test(b.label + b.text + b.testid))
);
console.log("Send buttons:", JSON.stringify(sendBtns, null, 2));

// 첨부 후 파일 썸네일/미리보기 확인
const thumbs = await page.evaluate(() =>
  Array.from(document.querySelectorAll("img[src*='blob'], img[src*='data:'], [class*='thumb'], [class*='preview']"))
    .map(el => ({ tag: el.tagName, src: (el.getAttribute("src") || "").slice(0, 60) }))
);
console.log("Image thumbnails:", JSON.stringify(thumbs));

console.log("\n=== STEP 4: 다운로드 버튼 selector 후보 (미리 수집) ===");
// 현재 페이지의 모든 버튼 aria-label에서 다운로드 관련
const dlCandidates = await page.evaluate(() =>
  Array.from(document.querySelectorAll("button, a")).map(el => ({
    tag: el.tagName,
    label: el.getAttribute("aria-label") || "",
    text: el.textContent?.trim().slice(0, 40) || "",
    title: el.getAttribute("title") || "",
    href: el.getAttribute("href") || ""
  })).filter(b => /다운|download|저장|save/i.test(b.label + b.text + b.title))
);
console.log("Download candidates:", JSON.stringify(dlCandidates, null, 2));

console.log("\n[PROBE COMPLETE — 0 submissions]");
await page.close();
await b.close();
