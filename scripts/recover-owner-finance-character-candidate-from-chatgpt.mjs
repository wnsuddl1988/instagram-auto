#!/usr/bin/env node

import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import {
  CDP_PORT_GPT1,
  USER_DATA_GPT1,
  ensureChrome,
} from "./_chatgpt-image-core.mjs";

const characterId = process.argv.find((arg) => arg.startsWith("--character="))?.slice("--character=".length) ?? "";
const candidateNumber = Number(process.argv.find((arg) => arg.startsWith("--candidate="))?.slice("--candidate=".length));
const castData = JSON.parse(fs.readFileSync("lib/finance-character-cast-data.json", "utf8"));
const character = castData.characters.find((item) => item.id === characterId);
if (!character || !Number.isInteger(candidateNumber) || candidateNumber < 1 || candidateNumber > castData.candidateCount) {
  console.error("Usage: node recover-owner-finance-character-candidate-from-chatgpt.mjs --character=<id> --candidate=<number>");
  process.exit(2);
}

const outDir = `C:\\tmp\\money-shorts-os\\web-wizard-create-v1\\character-cast-v1\\${characterId}`;
const summaryPath = path.join(outDir, "cast-audition-summary.json");
if (!fs.existsSync(summaryPath)) {
  console.error("ABORT: no prior audition summary to recover");
  process.exit(2);
}
const summary = JSON.parse(fs.readFileSync(summaryPath, "utf8"));
const priorRow = summary.candidates?.find((row) => row.candidateNumber === candidateNumber);
if (!priorRow || priorRow.status !== "BLOCKED") {
  console.error("ABORT: recovery is allowed only for a previously blocked candidate");
  process.exit(2);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function imageDimensions(buffer) {
  if (buffer.length >= 24 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20), contentType: "image/png" };
  }
  if (buffer[0] === 0xff && buffer[1] === 0xd8) {
    let offset = 2;
    while (offset + 9 < buffer.length) {
      if (buffer[offset] !== 0xff) { offset += 1; continue; }
      const marker = buffer[offset + 1];
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        return { width: buffer.readUInt16BE(offset + 7), height: buffer.readUInt16BE(offset + 5), contentType: "image/jpeg" };
      }
      offset += 2 + buffer.readUInt16BE(offset + 2);
    }
  }
  return { width: null, height: null, contentType: "application/octet-stream" };
}

async function collectGeneratedImages(page) {
  return page.evaluate(() => Array.from(document.querySelectorAll("img"))
    .filter((image) => image.naturalWidth >= 200 && !image.closest('[data-message-author-role="user"]'))
    .map((image) => ({ src: image.src || image.currentSrc || "", width: image.naturalWidth, height: image.naturalHeight }))
    .filter((image) => /backend-api\/estuary\/content|backend-api\/files|oaiusercontent|^blob:/.test(image.src)));
}

await ensureChrome(CDP_PORT_GPT1, USER_DATA_GPT1, () => {});
const browser = await chromium.connectOverCDP(`http://localhost:${CDP_PORT_GPT1}`);
const context = browser.contexts()[0];
const page = await context.newPage();
try {
  await page.goto("https://chatgpt.com/", { waitUntil: "domcontentloaded", timeout: 30_000 });
  await page.waitForTimeout(2000);
  const historyTitle = `${character.name} 캐릭터 디자인`;
  const historyItem = page.getByText(historyTitle, { exact: true }).first();
  if (!(await historyItem.isVisible({ timeout: 10_000 }).catch(() => false))) {
    throw new Error(`RECOVERY_CHAT_NOT_FOUND:${historyTitle}`);
  }
  await historyItem.click();
  await page.waitForTimeout(4000);
  const images = await collectGeneratedImages(page);
  const image = [...images].sort((left, right) => right.width * right.height - left.width * left.height)[0];
  if (!image) throw new Error("RECOVERY_IMAGE_NOT_FOUND");
  const bytes = await page.evaluate(async (source) => {
    const response = await fetch(source);
    if (!response.ok) return null;
    return Array.from(new Uint8Array(await response.arrayBuffer()));
  }, image.src);
  if (!Array.isArray(bytes) || bytes.length < 10_000) throw new Error("RECOVERY_IMAGE_DOWNLOAD_FAILED");
  const buffer = Buffer.from(bytes);
  const dimensions = imageDimensions(buffer);
  if (dimensions.width !== null && dimensions.height !== null && dimensions.height < dimensions.width) {
    throw new Error("RECOVERY_IMAGE_NOT_PORTRAIT");
  }
  fs.mkdirSync(outDir, { recursive: true });
  const file = path.join(outDir, `candidate-${candidateNumber}.png`);
  fs.writeFileSync(file, buffer);
  const recoveredRow = {
    ...priorRow,
    file,
    status: "SAVED_OK",
    width: dimensions.width,
    height: dimensions.height,
    contentType: dimensions.contentType,
    imageSha256: sha256(buffer),
    method: "owned_chat_history_recovery",
  };
  summary.candidates = summary.candidates.map((row) => row.candidateNumber === candidateNumber ? recoveredRow : row);
  summary.allReady = summary.candidates.length === summary.expectedCount && summary.candidates.every((row) => row.status === "SAVED_OK");
  summary.blockerCode = null;
  summary.generatedAt = new Date().toISOString();
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2), "utf8");
  console.log(JSON.stringify({ recovered: true, characterId, candidateNumber, file, width: dimensions.width, height: dimensions.height }, null, 2));
} finally {
  await page.close().catch(() => {});
  await browser.close().catch(() => {});
}
