#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const baseUrl = process.argv.find((arg) => arg.startsWith("--base-url="))?.slice("--base-url=".length) ?? "http://localhost:4319";
const summaryPath = "C:\\tmp\\money-shorts-os\\finance-character-voice-audition-v1\\voice-audition-summary.json";
const outputDir = "C:\\tmp\\money-shorts-os\\finance-character-voice-audition-playwright-v2";
fs.mkdirSync(outputDir, { recursive: true });
const summary = JSON.parse(fs.readFileSync(summaryPath, "utf8"));
if (summary.status !== "AUDITION_READY" || summary.rows.length !== 4) {
  throw new Error("AUDITION_READY summary with four rows required.");
}
const expected = summary.rows;

const browser = await chromium.launch({ headless: true, args: ["--autoplay-policy=no-user-gesture-required"] });
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
  for (const row of expected) {
    headings.push(await page.getByRole("heading", { name: `${row.characterName} · ${row.voiceLabel}`, exact: true }).isVisible());
  }
  const mediaState = await page.locator("audio").evaluateAll((audios) => audios.map((audio) => ({
    readyState: audio.readyState,
    durationSec: Number.isFinite(audio.duration) ? Number(audio.duration.toFixed(2)) : null,
    errorCode: audio.error?.code ?? null,
  })));
  const imageState = await page.locator("article img").evaluateAll((images) => images.map((image) => ({
    complete: image.complete,
    naturalWidth: image.naturalWidth,
    naturalHeight: image.naturalHeight,
  })));
  const playbackState = await page.locator("audio").evaluateAll(async (audios) => {
    const results = [];
    for (const audio of audios) {
      audio.currentTime = 0;
      await audio.play();
      await new Promise((resolve) => setTimeout(resolve, 900));
      results.push({ advancedSec: Number(audio.currentTime.toFixed(3)), pausedDuringCheck: audio.paused });
      audio.pause();
    }
    return results;
  });
  const screenshotPath = path.join(outputDir, "finance-character-voice-audition-jisoo-v1.png");
  await page.screenshot({ path: screenshotPath, fullPage: true, animations: "disabled", caret: "hide" });
  const expectedPlaybackAborts = failedRequests.filter((entry) => /\/audio\/[a-z0-9_-]+ net::ERR_ABORTED$/i.test(entry));
  const unexpectedFailedRequests = failedRequests.filter((entry) => !expectedPlaybackAborts.includes(entry));
  const passed =
    headings.every(Boolean) &&
    mediaState.length === 4 &&
    mediaState.every((row, index) => row.readyState >= 1 && row.errorCode == null && Math.abs(row.durationSec - expected[index].durationSec) <= 0.2) &&
    imageState.length === 4 && imageState.every((row) => row.complete && row.naturalWidth > 0 && row.naturalHeight > 0) &&
    playbackState.length === 4 && playbackState.every((row) => row.advancedSec >= 0.45 && row.pausedDuringCheck === false) &&
    consoleErrors.length === 0 && unexpectedFailedRequests.length === 0;
  const evidence = {
    schemaVersion: "money_shorts_finance_character_voice_audition_playwright_v2",
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
  const evidencePath = path.join(outputDir, "playwright-evidence.json");
  fs.writeFileSync(evidencePath, JSON.stringify(evidence, null, 2), "utf8");
  console.log(JSON.stringify({ passed, evidencePath, screenshotPath, playbackState }, null, 2));
  process.exitCode = passed ? 0 : 1;
} finally {
  await browser.close();
}
