#!/usr/bin/env node
/**
 * Flow 제출 직전까지 드라이런 (2026-10-12) — 참조 이미지 첨부 + 프롬프트 입력까지만 하고 "생성 시작"은 누르지 않는다.
 * 사용: node scripts/flow-dryrun.mjs <포트> <이미지경로> <프롬프트.txt> [스크린샷경로]
 */
import fs from "node:fs";
const [port, imagePath, promptFile, shot] = process.argv.slice(2);
if (!port || !imagePath || !promptFile) { console.error("사용: <포트> <이미지> <프롬프트.txt> [스크린샷]"); process.exit(2); }
if (!fs.existsSync(imagePath)) { console.error("이미지 없음", imagePath); process.exit(2); }
const prompt = fs.readFileSync(promptFile, "utf8").trim();
const { chromium } = await import("playwright");
const browser = await chromium.connectOverCDP(`http://127.0.0.1:${port}`);
const page = browser.contexts()[0].pages().find((p) => /flow\.google\.com\/project/.test(p.url()));
if (!page) { console.error("프로젝트 탭 없음"); process.exit(1); }
try {
  await page.locator('[aria-label="프롬프트 상자에 소재 추가"]').first().click({ timeout: 8000 });
  await page.waitForTimeout(1200);
  // '업로드' 탭을 먼저 연 뒤, 툴팁(div)이 아니라 실제 button의 "미디어 업로드"를 누른다.
  await page.locator('mat-list-item:has-text("업로드")').first().click({ timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(800);
  const [chooser] = await Promise.all([
    page.waitForEvent("filechooser", { timeout: 10000 }),
    page.locator('button:has-text("미디어 업로드")').first().click({ timeout: 8000 }),
  ]);
  await chooser.setFiles(imagePath);
  await page.waitForTimeout(6000);
  console.log("첨부 요청 완료");
  const box = page.locator('[contenteditable="true"], textarea').last();
  console.log("입력창 후보 수", await page.locator('[contenteditable="true"], textarea').count());
  await box.click({ timeout: 8000 });
  await page.keyboard.insertText(prompt);
  await page.waitForTimeout(1500);
  console.log("프롬프트 입력 완료(글자 수 " + prompt.length + ")");
  if (shot) await page.screenshot({ path: shot });
  const rows = await page.evaluate(() => [...document.querySelectorAll("button,[role=button]")].filter((e) => e.offsetParent !== null).map((e) => (e.getAttribute("aria-label") || (e.innerText || "").trim()).replace(/\s+/g, " ").slice(0, 40)).filter(Boolean));
  console.log("보이는 버튼:", rows.slice(-18).join(" | "));
} finally { await browser.close().catch(() => {}); }
