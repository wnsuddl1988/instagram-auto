/**
 * TAB 2 (대화 탭)에서 "파일" 메뉴 → 이미지 첨부 경로 탐색
 * 제출 0회 — 첨부 확인 후 전송하지 않음
 */
import { chromium } from "playwright";

const REF_IMG = "C:\\Users\\PC\\jjy\\instagram-auto\\output\\v2\\3d_sitcom_prod_v1\\upload_002_copier\\keyframes\\kf_s1_wide_copier_error.png";

const b = await chromium.connectOverCDP("http://localhost:9223");
const ctx = b.contexts()[0];
const pages = ctx.pages();
const tab2 = pages.find(pg => pg.url().includes("/app/84775b0d")) || pages[2];
console.log("TAB 2:", tab2.url());

// "업로드 및 도구" 클릭
const toolBtn = tab2.locator('button[aria-label="업로드 및 도구"]').first();
await toolBtn.click();
await tab2.waitForTimeout(1200);

// "파일" 메뉴 클릭 시도
const fileItem = tab2.getByText("파일", { exact: true }).first();
console.log("파일 item count:", await fileItem.count());

if (await fileItem.count() > 0) {
  const [fc] = await Promise.all([
    tab2.waitForEvent("filechooser", { timeout: 5000 }).catch(() => null),
    fileItem.click(),
  ]);
  console.log("filechooser after 파일 click:", !!fc);
  if (fc) {
    await fc.setFiles(REF_IMG);
    await tab2.waitForTimeout(2000);
    console.log("Image attached via 파일 filechooser ✅");
  } else {
    await tab2.waitForTimeout(1000);
    const fi = await tab2.locator('input[type="file"]').count();
    console.log("file inputs after 파일 click:", fi);
    if (fi > 0) {
      await tab2.locator('input[type="file"]').first().setInputFiles(REF_IMG);
      console.log("Attached via file input ✅");
    }
  }
}

// 첨부 후 상태 확인
await tab2.waitForTimeout(2000);
const body = await tab2.evaluate(() => document.body?.innerText?.slice(0, 400) || "");
console.log("\nBody after attach attempt:", body);

// 썸네일 확인
const thumbs = await tab2.evaluate(() =>
  Array.from(document.querySelectorAll("img[src*='blob'], img[src*='data:']"))
    .map(el => el.src?.slice(0, 60))
);
console.log("Thumbnails:", thumbs);

// 전송 버튼 상태
const sendBtn = tab2.locator('button[aria-label="메시지 보내기"]').first();
console.log("Send btn enabled:", await sendBtn.isEnabled().catch(() => false));

console.log("\n[NOT SENDING — 0 submissions]");
await b.close();
