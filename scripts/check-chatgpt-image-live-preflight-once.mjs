#!/usr/bin/env node

/**
 * AI-GPT-1 실제 Chrome에서 이미지 모드와 프롬프트 입력까지만 검증한다.
 * 메시지 전송 함수는 가져오지 않으며, 검증 탭을 닫아 초안을 폐기한다.
 */

import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import {
  CDP_PORT_GPT1,
  USER_DATA_GPT1,
  ensureChrome,
  openFreshImageChat,
  activateImageTool,
  verifyImageToolActive,
  typePrompt,
  checkSendEnabled,
} from "./_chatgpt-image-core.mjs";

const APPROVAL = "--allow-no-send";
if (!process.argv.includes(APPROVAL)) {
  console.error(`BLOCKED: ${APPROVAL} is required`);
  process.exit(2);
}

const OUT_DIR = "C:/tmp/money-shorts-os/diagnostics/chatgpt-image-live-preflight";
const SUMMARY_PATH = path.join(OUT_DIR, "summary.json");
const SCREENSHOT_PATH = path.join(OUT_DIR, "ready-before-send.png");
const DIAGNOSTIC_PROMPT =
  "GENERATE ONE BRAND-NEW ORIGINAL TEXT-TO-IMAGE ASSET. Start from a blank canvas. " +
  "No-send diagnostic: a simple vertical editorial still life with one blue notebook and one silver coin, no text.";

fs.mkdirSync(OUT_DIR, { recursive: true });

let browser = null;
let page = null;
let result = {
  schemaVersion: "chatgpt_image_live_preflight_v1",
  checkedAt: new Date().toISOString(),
  submitted: false,
  imageToolActive: false,
  imageRoute: null,
  promptTyped: false,
  sendEnabled: false,
  screenshot: null,
  status: "ERROR",
  error: null,
};

try {
  await ensureChrome(CDP_PORT_GPT1, USER_DATA_GPT1, () => {});
  browser = await chromium.connectOverCDP(`http://localhost:${CDP_PORT_GPT1}`);
  const context = browser.contexts()[0];
  if (!context) throw new Error("CHATGPT_CONTEXT_MISSING");
  page = await context.newPage();

  await openFreshImageChat(page, () => {});
  const imageToolActivation = await activateImageTool(page, () => {}, () => {});
  result.imageRoute = imageToolActivation?.mode ?? null;
  result.imageToolActive = result.imageRoute === "explicit-tool" && await verifyImageToolActive(page);
  if (!result.imageRoute) throw new Error("IMAGE_TOOL_ROUTE_MISSING_AFTER_ACTIVATION");

  const typed = await typePrompt(page, DIAGNOSTIC_PROMPT, () => {});
  result.promptTyped = typed.typedLen === DIAGNOSTIC_PROMPT.length;
  if (!result.promptTyped) throw new Error(`PROMPT_LENGTH_MISMATCH:${typed.typedLen}`);

  result.sendEnabled = await checkSendEnabled(page);
  if (!result.sendEnabled) throw new Error("SEND_BUTTON_NOT_ENABLED");

  await page.screenshot({ path: SCREENSHOT_PATH, fullPage: false });
  result.screenshot = SCREENSHOT_PATH;
  result.status = "READY_BEFORE_SEND";
} catch (error) {
  result.error = String(error?.message ?? error).slice(0, 300);
} finally {
  // 전송하지 않은 진단 초안은 탭과 함께 폐기한다.
  if (page) await page.close().catch(() => {});
  if (browser) await browser.close().catch(() => {});
  fs.writeFileSync(SUMMARY_PATH, JSON.stringify(result, null, 2) + "\n", "utf8");
}

console.log(JSON.stringify({ ...result, summary: SUMMARY_PATH }, null, 2));
process.exit(result.status === "READY_BEFORE_SEND" ? 0 : 1);
