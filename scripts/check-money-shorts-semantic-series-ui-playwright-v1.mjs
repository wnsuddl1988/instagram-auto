#!/usr/bin/env node
/** Read-only localhost Playwright check for semantic-series UI state. */

import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { chromium } from "playwright";

const TOPIC_ID = "gen-finance-editorial-v2-investing_assets-reversal-01";
const BASE_URL = process.env.MONEY_SHORTS_BASE_URL ?? "http://localhost:3000";
const pageUrl = `${BASE_URL}/money-shorts?resumeTopicId=${encodeURIComponent(TOPIC_ID)}`;
const evidenceDir = path.join(
  "C:\\tmp\\money-shorts-os\\semantic-series-ui-playwright-v1",
  `${new Date().toISOString().replace(/[:.]/g, "-")}-${randomUUID().slice(0, 8)}`,
);
fs.mkdirSync(evidenceDir, { recursive: true });

let browser;
try {
  browser = await chromium.launch({ channel: "chrome", headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, locale: "ko-KR" });
  const page = await context.newPage();
  const consoleErrors = [];
  const externalRequests = [];
  page.on("console", (message) => { if (message.type() === "error") consoleErrors.push(message.text()); });
  page.on("pageerror", (error) => consoleErrors.push(error.message));
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (!['localhost', '127.0.0.1'].includes(url.hostname)) externalRequests.push(request.url());
  });

  const mediaResponsePromise = page.waitForResponse((response) =>
    response.url().includes("/api/money-shorts/operator") &&
    response.request().method() === "POST" &&
    String(response.request().postData() ?? "").includes("realMediaStatus"),
  { timeout: 60_000 });
  const response = await page.goto(pageUrl, { waitUntil: "networkidle", timeout: 60_000 });
  if (!response || response.status() !== 200) throw new Error(`money-shorts HTTP ${response?.status() ?? "none"}`);
  const mediaResponse = await mediaResponsePromise;
  const mediaPayload = await mediaResponse.json();
  const media = mediaPayload?.raw?.media;
  if (
    mediaPayload?.status !== "success" ||
    media?.production?.mode !== "two_part" ||
    media?.production?.totalParts !== 2 ||
    media?.realImages?.expectedCount !== 15 ||
    media?.parts?.[0]?.realImages?.expectedCount !== 8 ||
    media?.parts?.[1]?.realImages?.expectedCount !== 7
  ) {
    throw new Error(`unexpected semantic-series media state: ${JSON.stringify(mediaPayload)}`);
  }
  const desktopProductionText = page.getByText(/영상 2개, 총 15장면의 흐름/).first();
  await desktopProductionText.waitFor({ state: "visible", timeout: 30_000 });
  await page.getByText(/최종 mp4 2개로 합성/).first().waitFor({ state: "visible", timeout: 30_000 });
  const desktopLayout = await page.evaluate(() => ({
    viewportWidth: window.innerWidth,
    documentWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth,
  }));
  if (desktopLayout.documentWidth > desktopLayout.viewportWidth + 1 || desktopLayout.bodyWidth > desktopLayout.viewportWidth + 1) {
    throw new Error(`desktop horizontal overflow: ${JSON.stringify(desktopLayout)}`);
  }
  await page.screenshot({ path: path.join(evidenceDir, "desktop-top.png"), fullPage: false });
  await desktopProductionText.scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(evidenceDir, "desktop-production.png"), fullPage: false });

  const mobile = await context.newPage();
  await mobile.setViewportSize({ width: 390, height: 844 });
  await mobile.goto(pageUrl, { waitUntil: "networkidle", timeout: 60_000 });
  const mobileProductionText = mobile.getByText(/영상 2개, 총 15장면의 흐름/).first();
  await mobileProductionText.waitFor({ state: "visible", timeout: 30_000 });
  const mobileLayout = await mobile.evaluate(() => ({
    viewportWidth: window.innerWidth,
    documentWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth,
  }));
  if (mobileLayout.documentWidth > mobileLayout.viewportWidth + 1 || mobileLayout.bodyWidth > mobileLayout.viewportWidth + 1) {
    throw new Error(`mobile horizontal overflow: ${JSON.stringify(mobileLayout)}`);
  }
  await mobile.screenshot({ path: path.join(evidenceDir, "mobile-top.png"), fullPage: false });
  await mobileProductionText.scrollIntoViewIfNeeded();
  await mobile.screenshot({ path: path.join(evidenceDir, "mobile-production.png"), fullPage: false });
  await mobile.close();

  if (consoleErrors.length > 0) throw new Error(`console errors: ${consoleErrors.join(" | ")}`);
  if (externalRequests.length > 0) throw new Error(`external requests detected: ${externalRequests.join(" | ")}`);
  const evidence = {
    schemaVersion: "money_shorts_semantic_series_ui_playwright_v1",
    status: "PASS",
    topicId: TOPIC_ID,
    production: media.production,
    sceneCounts: media.parts.map((part) => ({ id: part.id, count: part.realImages.expectedCount })),
    mediaGateOk: media.mediaQualityGate.ok,
    desktopLayout,
    mobileLayout,
    consoleErrors,
    externalRequests,
    externalActionsInvoked: false,
    screenshots: {
      desktopTop: path.join(evidenceDir, "desktop-top.png"),
      desktopProduction: path.join(evidenceDir, "desktop-production.png"),
      mobileTop: path.join(evidenceDir, "mobile-top.png"),
      mobileProduction: path.join(evidenceDir, "mobile-production.png"),
    },
    generatedAt: new Date().toISOString(),
  };
  const evidencePath = path.join(evidenceDir, "evidence.json");
  fs.writeFileSync(evidencePath, JSON.stringify(evidence, null, 2), "utf8");
  console.log(`[semantic-series-ui-playwright] PASS: ${evidencePath}`);
} catch (error) {
  console.error(`[semantic-series-ui-playwright] FAIL: ${error instanceof Error ? error.stack : String(error)}`);
  process.exitCode = 1;
} finally {
  if (browser) await browser.close();
}
