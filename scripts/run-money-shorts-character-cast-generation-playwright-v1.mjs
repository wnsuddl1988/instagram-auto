#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const characterId = process.argv.find((arg) => arg.startsWith("--character="))?.slice("--character=".length) ?? "";
const baseUrl = process.argv.find((arg) => arg.startsWith("--base-url="))?.slice("--base-url=".length) ?? "http://localhost:3000";
const regenerate = process.argv.includes("--regenerate");
const allowed = new Set(["harin_daily", "junho_cashflow", "seoyun_safety", "minjae_horizon"]);
if (!allowed.has(characterId)) {
  console.error("Usage: node run-money-shorts-character-cast-generation-playwright-v1.mjs --character=<character-id> [--base-url=http://localhost:3000]");
  process.exit(2);
}

const outDir = `C:\\tmp\\money-shorts-os\\character-cast-generation-playwright-v1\\${characterId}`;
fs.mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const consoleErrors = [];
page.on("console", (message) => {
  if (message.type() === "error") consoleErrors.push(message.text());
});

try {
  await page.goto(`${baseUrl}/money-shorts`, { waitUntil: "networkidle", timeout: 60_000 });
  const button = page.getByTestId(`wizard-character-create-${characterId}`);
  await button.scrollIntoViewIfNeeded();
  const responsePromise = page.waitForResponse((response) => {
    if (!response.url().endsWith("/api/money-shorts/operator") || response.request().method() !== "POST") return false;
    try {
      const body = response.request().postDataJSON();
      return body?.action === "characterCastCreate" && body?.characterId === characterId;
    } catch {
      return false;
    }
  }, { timeout: 500_000 });
  if (regenerate) {
    await page.evaluate(async ({ requestedCharacterId }) => {
      await fetch("/api/money-shorts/operator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "characterCastCreate", characterId: requestedCharacterId, regenerate: true }),
      });
    }, { requestedCharacterId: characterId });
  } else {
    await button.click();
  }
  const response = await responsePromise;
  const payload = await response.json();
  await page.waitForTimeout(1200);
  const screenshotPath = path.join(outDir, "result.png");
  await page.getByTestId("wizard-step-4").screenshot({ path: screenshotPath });
  const evidence = {
    schemaVersion: "money_shorts_character_cast_generation_playwright_v1",
    characterId,
    httpStatus: response.status(),
    resultStatus: payload.status ?? null,
    summary: payload.summary ?? null,
    blockerCode: payload.blockerCode ?? null,
    consoleErrors,
    externalImageGenerationRequested: true,
    externalUploadPerformed: false,
    screenshotPath,
  };
  const evidencePath = path.join(outDir, "evidence.json");
  fs.writeFileSync(evidencePath, JSON.stringify(evidence, null, 2), "utf8");
  console.log(JSON.stringify({ ...evidence, evidencePath }, null, 2));
  process.exitCode = payload.status === "success" && consoleErrors.length === 0 ? 0 : 1;
} finally {
  await browser.close();
}
