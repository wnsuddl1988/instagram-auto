#!/usr/bin/env node
/** Local browser playback and canvas-pixel verification for the two-part pilot. */

import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { chromium } from "playwright";

const ROOT = "C:\\tmp\\money-shorts-os\\two-part-prehook-pilot-v1";
const INDEX_PATH = path.join(ROOT, "pilot-render-index.json");
if (!fs.existsSync(INDEX_PATH)) {
  console.error("ABORT: render index missing. Build the pilot first.");
  process.exit(2);
}
const index = JSON.parse(fs.readFileSync(INDEX_PATH, "utf8"));
if (index.status !== "RENDER_MUX_OK" || !Array.isArray(index.parts) || index.parts.length !== 2) {
  console.error("ABORT: two valid pilot parts are required.");
  process.exit(2);
}
const videoMap = new Map(index.parts.map((part) => [`/${part.id}.mp4`, path.resolve(part.path)]));
for (const file of videoMap.values()) {
  if (!file.startsWith(ROOT) || !fs.existsSync(file)) {
    console.error(`ABORT: untrusted or missing video: ${file}`);
    process.exit(2);
  }
}

function streamVideo(request, response, file) {
  const size = fs.statSync(file).size;
  const range = /^bytes=(\d*)-(\d*)$/i.exec(request.headers.range ?? "");
  if (!range) {
    response.writeHead(200, { "Content-Type": "video/mp4", "Content-Length": size, "Accept-Ranges": "bytes", "Cache-Control": "no-store" });
    fs.createReadStream(file).pipe(response);
    return;
  }
  const start = range[1] ? Number(range[1]) : 0;
  const end = range[2] ? Math.min(size - 1, Number(range[2])) : size - 1;
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start < 0 || end < start || start >= size) {
    response.writeHead(416, { "Content-Range": `bytes */${size}` });
    response.end();
    return;
  }
  response.writeHead(206, {
    "Content-Type": "video/mp4",
    "Content-Length": end - start + 1,
    "Content-Range": `bytes ${start}-${end}/${size}`,
    "Accept-Ranges": "bytes",
    "Cache-Control": "no-store",
  });
  fs.createReadStream(file, { start, end }).pipe(response);
}

const html = `<!doctype html><html lang="ko"><meta charset="utf-8"><title>Pilot QA</title><style>body{margin:0;background:#0a0c12;color:white;font-family:Arial,sans-serif}main{max-width:960px;margin:auto;padding:24px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:24px}video{width:100%;background:#000}h1{font-size:24px}@media(max-width:700px){.grid{grid-template-columns:1fr}}</style><main><h1>2편 파일럿 QA</h1><div class="grid"><video data-testid="part-1" controls muted playsinline preload="auto" src="/part-1.mp4"></video><video data-testid="part-2" controls muted playsinline preload="auto" src="/part-2.mp4"></video></div></main></html>`;
const server = http.createServer((request, response) => {
  const url = new URL(request.url ?? "/", "http://127.0.0.1");
  if (url.pathname === "/") {
    response.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
    response.end(html);
    return;
  }
  if (url.pathname === "/favicon.ico") {
    response.writeHead(204, { "Cache-Control": "no-store" });
    response.end();
    return;
  }
  const file = videoMap.get(url.pathname);
  if (file) return streamVideo(request, response, file);
  response.writeHead(404);
  response.end("not found");
});

const listen = () => new Promise((resolve, reject) => {
  server.once("error", reject);
  server.listen(0, "127.0.0.1", () => resolve(server.address()));
});
const evidenceDir = path.join(ROOT, "playwright-evidence", `${new Date().toISOString().replace(/[:.]/g, "-")}-${randomUUID().slice(0, 8)}`);
fs.mkdirSync(evidenceDir, { recursive: true });
let browser;
try {
  const address = await listen();
  const baseUrl = `http://127.0.0.1:${address.port}`;
  browser = await chromium.launch({ channel: "chrome", headless: true });
  const context = await browser.newContext({ viewport: { width: 1365, height: 900 }, locale: "ko-KR" });
  const page = await context.newPage();
  const consoleErrors = [];
  page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
  page.on("pageerror", (error) => consoleErrors.push(error.message));
  const response = await page.goto(baseUrl, { waitUntil: "networkidle", timeout: 60_000 });
  if (!response || response.status() !== 200) throw new Error(`preview HTTP ${response?.status() ?? "none"}`);

  const playback = {};
  for (const part of ["part-1", "part-2"]) {
    const video = page.getByTestId(part);
    await video.waitFor({ state: "visible", timeout: 30_000 });
    playback[part] = await video.evaluate(async (element) => {
      const waitFor = (event, timeout = 20_000) => new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(`${event} timeout`)), timeout);
        element.addEventListener(event, () => { clearTimeout(timer); resolve(); }, { once: true });
      });
      if (element.readyState < 1) await waitFor("loadedmetadata");
      element.muted = true;
      await element.play();
      const started = Date.now();
      while (element.currentTime < 0.45 && Date.now() - started < 15_000) await new Promise((resolve) => setTimeout(resolve, 120));
      element.pause();
      element.currentTime = Math.min(element.duration - 0.3, element.duration * 0.48);
      if (element.seeking) await waitFor("seeked");
      const canvas = document.createElement("canvas");
      canvas.width = 54;
      canvas.height = 96;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      context.drawImage(element, 0, 0, canvas.width, canvas.height);
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
      let nonBlack = 0;
      const buckets = new Set();
      for (let index = 0; index < pixels.length; index += 4) {
        const r = pixels[index];
        const g = pixels[index + 1];
        const b = pixels[index + 2];
        if (r + g + b > 45) nonBlack += 1;
        buckets.add(`${r >> 4}-${g >> 4}-${b >> 4}`);
      }
      return {
        readyState: element.readyState,
        duration: element.duration,
        currentTime: element.currentTime,
        videoWidth: element.videoWidth,
        videoHeight: element.videoHeight,
        errorCode: element.error?.code ?? null,
        nonBlackRatio: nonBlack / (canvas.width * canvas.height),
        colorBucketCount: buckets.size,
      };
    });
    const item = playback[part];
    if (item.readyState < 3 || item.currentTime < 0.4 || item.videoWidth !== 1080 || item.videoHeight !== 1920 || item.errorCode != null || item.nonBlackRatio < 0.35 || item.colorBucketCount < 24) {
      throw new Error(`${part} playback/pixel audit failed: ${JSON.stringify(item)}`);
    }
  }
  await page.screenshot({ path: path.join(evidenceDir, "desktop-playback.png"), fullPage: true });
  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  await mobile.goto(baseUrl, { waitUntil: "networkidle", timeout: 60_000 });
  await mobile.screenshot({ path: path.join(evidenceDir, "mobile-layout.png"), fullPage: true });
  await mobile.close();
  const evidence = {
    schemaVersion: "money_shorts_two_part_prehook_pilot_playwright_v1",
    status: "PASS",
    playback,
    consoleErrors,
    desktopScreenshot: path.join(evidenceDir, "desktop-playback.png"),
    mobileScreenshot: path.join(evidenceDir, "mobile-layout.png"),
    externalPublishInvoked: false,
    generatedAt: new Date().toISOString(),
  };
  if (consoleErrors.length > 0) throw new Error(`browser console errors: ${consoleErrors.join(" | ")}`);
  fs.writeFileSync(path.join(evidenceDir, "playwright-evidence.json"), JSON.stringify(evidence, null, 2), "utf8");
  console.log(`[pilot-playwright] PASS: ${path.join(evidenceDir, "playwright-evidence.json")}`);
} catch (error) {
  console.error(`[pilot-playwright] FAIL: ${error instanceof Error ? error.stack : String(error)}`);
  process.exitCode = 1;
} finally {
  if (browser) await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
