#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const baseUrl = process.argv.find((arg) => arg.startsWith("--base-url="))?.slice("--base-url=".length) ?? "http://localhost:4317";
const outDir = "C:\\tmp\\money-shorts-os\\finance-character-voice-audition-playwright-v1";
fs.mkdirSync(outDir, { recursive: true });

const expected = [
  { name: "하린 · JiYoung", durationSec: 29.68 },
  { name: "준호 · Yohan Koo", durationSec: 21.68 },
  { name: "서윤 · Jian.K", durationSec: 22.48 },
  { name: "민재 · Hojin Lim", durationSec: 27.12 },
];

const browser = await chromium.launch({
  headless: true,
  args: ["--autoplay-policy=no-user-gesture-required"],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
const consoleErrors = [];
const failedRequests = [];
page.on("console", (message) => {
  if (message.type() === "error") consoleErrors.push(message.text());
});
page.on("requestfailed", (request) => failedRequests.push(`${request.method()} ${request.url()} ${request.failure()?.errorText ?? ""}`));

try {
  await page.goto(baseUrl, { waitUntil: "networkidle", timeout: 60_000 });
  await page.getByRole("heading", { name: "주인공 보이스 오디션", exact: true }).waitFor({ state: "visible", timeout: 30_000 });

  const headings = [];
  for (const item of expected) headings.push(await page.getByRole("heading", { name: item.name, exact: true }).isVisible());

  const mediaState = await page.locator("audio").evaluateAll((audios) => audios.map((audio) => ({
    readyState: audio.readyState,
    networkState: audio.networkState,
    durationSec: Number.isFinite(audio.duration) ? Number(audio.duration.toFixed(2)) : null,
    errorCode: audio.error?.code ?? null,
    currentSrc: audio.currentSrc,
  })));
  const imageState = await page.locator("article img").evaluateAll((images) => images.map((image) => ({
    alt: image.alt,
    complete: image.complete,
    naturalWidth: image.naturalWidth,
    naturalHeight: image.naturalHeight,
  })));
  const playbackState = await page.locator("audio").evaluateAll(async (audios) => {
    const results = [];
    for (const audio of audios) {
      audio.currentTime = 0;
      await audio.play();
      await new Promise((resolve) => setTimeout(resolve, 1000));
      results.push({ advancedSec: Number(audio.currentTime.toFixed(3)), pausedDuringCheck: audio.paused });
      audio.pause();
    }
    return results;
  });

  const screenshotPath = path.join(outDir, "voice-audition-v2.png");
  await page.screenshot({ path: screenshotPath, fullPage: true, animations: "disabled", caret: "hide" });
  const expectedPlaybackAborts = failedRequests.filter((entry) => /\/audio\/[a-z0-9_-]+ net::ERR_ABORTED$/i.test(entry));
  const unexpectedFailedRequests = failedRequests.filter((entry) => !expectedPlaybackAborts.includes(entry));

  const passed =
    headings.every(Boolean) &&
    mediaState.length === 4 &&
    mediaState.every((row, index) => row.readyState >= 1 && row.errorCode == null && Math.abs(row.durationSec - expected[index].durationSec) <= 0.15) &&
    imageState.length === 4 &&
    imageState.every((row) => row.complete && row.naturalWidth > 0 && row.naturalHeight > 0) &&
    playbackState.length === 4 &&
    playbackState.every((row) => row.advancedSec >= 0.5 && row.pausedDuringCheck === false) &&
    consoleErrors.length === 0 &&
    unexpectedFailedRequests.length === 0;
  const evidence = {
    schemaVersion: "money_shorts_finance_character_voice_audition_playwright_v1",
    passed,
    baseUrl,
    headings,
    mediaState,
    imageState,
    playbackState,
    consoleErrors,
    failedRequests,
    expectedPlaybackAborts,
    unexpectedFailedRequests,
    screenshotPath,
  };
  const evidencePath = path.join(outDir, "playwright-evidence.json");
  fs.writeFileSync(evidencePath, JSON.stringify(evidence, null, 2), "utf8");
  console.log(JSON.stringify({ passed, evidencePath, screenshotPath, playbackState }, null, 2));
  process.exitCode = passed ? 0 : 1;
} finally {
  await browser.close();
}
