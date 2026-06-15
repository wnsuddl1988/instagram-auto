import { chromium } from "playwright";

const PORT = 9223;
const b = await chromium.connectOverCDP(`http://localhost:${PORT}`);
const ctx = b.contexts()[0];
const pages = ctx.pages();
const p = pages[0];

// 사이드바 열기
await p.goto("https://gemini.google.com/app", { waitUntil: "domcontentloaded", timeout: 20000 });
await p.waitForTimeout(2000);

// 사이드바/최근 버튼 클릭
const recentBtn = p.locator('button[aria-label="최근 전환"]').first();
if (await recentBtn.count() > 0) {
  await recentBtn.click();
  await p.waitForTimeout(1500);
}

const sidebarBody = await p.evaluate(() => document.body?.innerText?.slice(0, 1500) || "");
console.log("Sidebar/body after recent click:", sidebarBody);

// 대화 목록에서 Animate / 복사기 항목 찾기
const convItems = await p.evaluate(() =>
  Array.from(document.querySelectorAll("a, [role='listitem'], [class*='conversation'], [class*='history']"))
    .map(el => el.textContent?.trim().slice(0, 80))
    .filter(t => t && t.length > 5)
    .slice(0, 20)
);
console.log("\nConversation items:", convItems);

await b.close();
