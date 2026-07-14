#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const baseUrl = process.argv.find((arg) => arg.startsWith("--base-url="))?.slice("--base-url=".length) ?? "http://localhost:3000";
const outDir = "C:\\tmp\\money-shorts-os\\character-cast-ui-playwright-v1";
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
const consoleErrors = [];
const failedRequests = [];
page.on("console", (message) => {
  if (message.type() === "error") consoleErrors.push(message.text());
});
page.on("requestfailed", (request) => failedRequests.push(`${request.method()} ${request.url()} ${request.failure()?.errorText ?? ""}`));

try {
  await page.goto(`${baseUrl}/money-shorts`, { waitUntil: "networkidle", timeout: 60_000 });
  await page.getByText("주인공 이미지 검수", { exact: true }).waitFor({ state: "visible", timeout: 30_000 });

  const expectedCharacters = [
    ["하린 · 생활비와 소비", ["물가·생활비", "소비심리", "SNS비교"]],
    ["준호 · 월급과 실행습관", ["월급·소득", "불안·회피", "성공습관"]],
    ["서윤 · 부채와 생활안전", ["금리·빚", "집값·주거비", "위기·비상금"]],
    ["민재 · 경제와 장기자산", ["경제뉴스·돈공부", "투자·자산", "시간·노후"]],
  ];
  const characterChecks = [];
  for (const [heading, subtopics] of expectedCharacters) {
    const visible = await page.getByText(heading, { exact: true }).isVisible();
    const subtopicVisibility = [];
    for (const subtopic of subtopics) subtopicVisibility.push(await page.getByText(subtopic, { exact: true }).isVisible());
    characterChecks.push({ heading, visible, subtopics, subtopicVisibility });
  }

  const createButtons = page.getByRole("button", { name: /후보 이미지 2장 (?:다시 )?만들기/ });
  const selectButtons = page.getByRole("button", { name: /^[12]번 선택(?:됨)?$/ });
  const createButtonCount = await createButtons.count();
  const selectButtonCount = await selectButtons.count();
  const disabledSelectCount = await selectButtons.evaluateAll((buttons) => buttons.filter((button) => button.disabled).length);
  const candidateImages = page.getByRole("img", { name: /주인공 후보 [12]$/ });
  const readyCandidateCount = await candidateImages.count();
  const loadedCandidateCount = await candidateImages.evaluateAll((images) => images.filter((image) => image.complete && image.naturalWidth > 0).length);
  const placeholderCount = await page.getByText("후보 이미지 생성 전", { exact: true }).count();
  const sceneImageButtonDisabled = await page.getByTestId("wizard-action-real-images").isDisabled();
  const noVideoDuringCastReview = await page.getByText("이 단계에서는 영상을 만들지 않습니다.", { exact: false }).isVisible();

  const screenshotPath = path.join(outDir, readyCandidateCount === 8 ? "character-cast-ready-state.png" : "character-cast-partial-state.png");
  const characterStep = page.getByTestId("wizard-step-4");
  await characterStep.scrollIntoViewIfNeeded();
  await characterStep.screenshot({ path: screenshotPath });
  const cardScreenshotPaths = [];
  for (const [index, [heading]] of expectedCharacters.entries()) {
    const card = page.getByText(heading, { exact: true }).locator("xpath=ancestor::section[1]");
    const cardScreenshotPath = path.join(outDir, `character-card-${index + 1}.png`);
    await card.scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);
    await card.screenshot({ path: cardScreenshotPath, animations: "disabled", caret: "hide" });
    cardScreenshotPaths.push(cardScreenshotPath);
  }

  const passed =
    characterChecks.every((row) => row.visible && row.subtopicVisibility.every(Boolean)) &&
    createButtonCount === 4 &&
    selectButtonCount === 8 &&
    readyCandidateCount + placeholderCount === 8 &&
    loadedCandidateCount === readyCandidateCount &&
    disabledSelectCount === placeholderCount &&
    sceneImageButtonDisabled &&
    noVideoDuringCastReview &&
    consoleErrors.length === 0 &&
    failedRequests.length === 0;
  const evidence = {
    schemaVersion: "money_shorts_character_cast_ui_playwright_v1",
    baseUrl,
    passed,
    characterChecks,
    createButtonCount,
    selectButtonCount,
    disabledSelectCount,
    readyCandidateCount,
    loadedCandidateCount,
    placeholderCount,
    sceneImageButtonDisabled,
    noVideoDuringCastReview,
    consoleErrors,
    failedRequests,
    screenshotPath,
    cardScreenshotPaths,
  };
  const evidencePath = path.join(outDir, "playwright-evidence.json");
  fs.writeFileSync(evidencePath, JSON.stringify(evidence, null, 2), "utf8");
  console.log(JSON.stringify({ passed, evidencePath, screenshotPath, cardScreenshotPaths }, null, 2));
  process.exitCode = passed ? 0 : 1;
} finally {
  await browser.close();
}
