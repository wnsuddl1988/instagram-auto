import { chromium } from "playwright";

const b = await chromium.connectOverCDP("http://localhost:9223");
const ctx = b.contexts()[0];
const pages = ctx.pages();
// TAB 2 — 고유 URL
const p = pages.find(pg => pg.url().includes("/app/84775b0d") || pg.url().includes("/app/8477")) || pages[2];
console.log("Target tab URL:", p?.url());

const body = await p.evaluate(() => document.body?.innerText || "");
console.log("FULL BODY:\n", body.slice(0, 3000));

// 비디오 요소
const vids = await p.evaluate(() =>
  Array.from(document.querySelectorAll("video")).map(v => ({
    src: (v.src || v.currentSrc || "").slice(0, 120),
    w: v.videoWidth, h: v.videoHeight, duration: v.duration
  }))
);
console.log("\nVideos:", JSON.stringify(vids));

// 모든 버튼 aria-label
const btns = await p.evaluate(() =>
  Array.from(document.querySelectorAll("button")).map(b => b.getAttribute("aria-label") || b.textContent?.trim().slice(0,40) || "").filter(Boolean)
);
console.log("\nAll button labels:", btns);

// model-response 요소
const resp = await p.evaluate(() =>
  Array.from(document.querySelectorAll("model-response, [data-chunk], .model-response-text, .response-content"))
    .map(el => el.textContent?.trim().slice(0, 300)).filter(Boolean)
);
console.log("\nModel response elements:", resp);

await b.close();
