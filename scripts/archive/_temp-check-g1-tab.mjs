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
  console.log("Launching Chrome...");
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

await new Promise(r => setTimeout(r, 3000));
const b = await chromium.connectOverCDP(`http://localhost:${PORT}`);
const ctx = b.contexts()[0];
const pages = ctx.pages();
console.log("tabs:", pages.length);

for (let i = 0; i < pages.length; i++) {
  const p = pages[i];
  const url = p.url();
  const body = await p.evaluate(() => document.body?.innerText?.slice(0,800) || "").catch(() => "err");
  const btns = await p.evaluate(() =>
    Array.from(document.querySelectorAll("button")).map(b => ({
      label: b.getAttribute("aria-label") || "", text: b.textContent?.trim().slice(0,50) || ""
    })).filter(b => b.label || b.text)
  ).catch(() => []);
  const vids = await p.evaluate(() =>
    Array.from(document.querySelectorAll("video")).map(v => ({
      dur: v.duration, w: v.videoWidth, h: v.videoHeight,
      src: (v.src || v.currentSrc || "").slice(0, 120)
    }))
  ).catch(() => []);
  console.log(`\n[TAB ${i}] ${url}`);
  console.log("body:", body);
  console.log("btns:", btns.map(b => b.label || b.text).filter(Boolean).join(" | "));
  if (vids.length > 0) console.log("videos:", JSON.stringify(vids));
}
await b.close();
