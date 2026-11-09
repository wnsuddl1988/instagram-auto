/**
 * Veo 이미지 첨부 경로 탐색
 * TAB 1 (동영상 칩 활성 상태)에서 이미지를 첨부하는 방법 탐색
 * 제출 0회
 */
import { chromium } from "playwright";
import fs from "fs";

const REF_IMG = "C:\\Users\\PC\\jjy\\instagram-auto\\output\\v2\\3d_sitcom_prod_v1\\upload_002_copier\\keyframes\\kf_s1_wide_copier_error.png";

const b = await chromium.connectOverCDP("http://localhost:9223");
const ctx = b.contexts()[0];
// TAB 1 — 동영상 칩 활성
const pages = ctx.pages();
const p = pages.find(pg => pg.url() === "https://gemini.google.com/app") || pages[1];
console.log("Using tab:", p.url());

// 현재 상태 확인
const body = await p.evaluate(() => document.body?.innerText?.slice(0, 600) || "");
console.log("Current body:", body);

// "업로드 및 도구" 버튼 클릭 → 메뉴 전체 탐색
const toolBtn = p.locator('button[aria-label="업로드 및 도구"]').first();
await toolBtn.click();
await p.waitForTimeout(1500);

// 메뉴에 나타나는 모든 텍스트
const menuTexts = await p.evaluate(() =>
  Array.from(document.querySelectorAll("mat-menu-content *, [class*='menu'] *, [class*='popup'] *"))
    .map(el => el.textContent?.trim().slice(0, 60)).filter(t => t && t.length > 1)
    .filter((v,i,a) => a.indexOf(v)===i).slice(0,30)
);
console.log("\nMenu contents:", menuTexts);

// 모든 메뉴 항목 클릭 가능 요소
const clickables = await p.evaluate(() =>
  Array.from(document.querySelectorAll("mat-menu-content button, mat-menu-content a, mat-menu-content [role='menuitem']"))
    .map(el => ({
      tag: el.tagName,
      text: el.textContent?.trim().slice(0,60) || "",
      label: el.getAttribute("aria-label") || ""
    }))
);
console.log("Clickable menu items:", JSON.stringify(clickables, null, 2));

// "이미지 업로드" 또는 파일 관련 텍스트 탐색
const imgUpload = p.getByText(/이미지 업로드|사진 업로드|이미지 첨부|Upload image|Add image|파일/i).first();
console.log("Image upload text count:", await imgUpload.count());

// input[type=file] 현재 상태
const fi = await p.locator('input[type="file"]').count();
console.log("file inputs:", fi);

// 모든 input 요소
const inputs = await p.evaluate(() =>
  Array.from(document.querySelectorAll("input")).map(i => ({
    type: i.type, accept: i.accept, id: i.id, name: i.name
  }))
);
console.log("All inputs:", JSON.stringify(inputs));

// Escape
await p.keyboard.press("Escape").catch(()=>{});

// "동영상" 칩 활성 상태에서 드래그앤드롭으로 이미지 첨부 가능한지 — drop zone 확인
const dropZones = await p.evaluate(() =>
  Array.from(document.querySelectorAll("[dropzone], [class*='drop'], [class*='upload-area']"))
    .map(el => ({ tag: el.tagName, class: el.className?.slice(0,60), drop: el.getAttribute("dropzone") }))
);
console.log("\nDrop zones:", JSON.stringify(dropZones));

// Gemini Veo에서 이미지 첨부하는 TAB 2의 현재 UI 확인 (대화가 있는 탭)
const tab2 = pages.find(pg => pg.url().includes("/app/84775b0d"));
if (tab2) {
  console.log("\n=== TAB 2 (conversation) upload zone ===");
  const t2btns = await tab2.evaluate(() =>
    Array.from(document.querySelectorAll("button")).map(b => ({
      label: b.getAttribute("aria-label") || "", text: b.textContent?.trim().slice(0,40) || ""
    })).filter(b => b.label || b.text)
  );
  console.log("TAB 2 buttons:", t2btns.map(b => b.label || b.text).filter(Boolean));

  // TAB 2 file input
  const t2fi = await tab2.locator('input[type="file"]').count();
  console.log("TAB 2 file inputs:", t2fi);

  // TAB 2 "업로드 및 도구" 클릭
  const t2tool = tab2.locator('button[aria-label="업로드 및 도구"]').first();
  if (await t2tool.count() > 0) {
    await t2tool.click();
    await tab2.waitForTimeout(1200);
    const t2menu = await tab2.evaluate(() =>
      Array.from(document.querySelectorAll("mat-menu-content *, [class*='menu'] *"))
        .map(el => el.textContent?.trim().slice(0,60)).filter(t => t && t.length > 1)
        .filter((v,i,a)=>a.indexOf(v)===i).slice(0,20)
    );
    console.log("TAB 2 menu after tool click:", t2menu);
    const t2fi2 = await tab2.locator('input[type="file"]').count();
    console.log("TAB 2 file inputs after menu:", t2fi2);
    await tab2.keyboard.press("Escape").catch(()=>{});
  }
}

console.log("\n[0 submissions]");
await b.close();
