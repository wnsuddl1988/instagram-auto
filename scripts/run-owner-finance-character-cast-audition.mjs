#!/usr/bin/env node

import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const args = process.argv.slice(2);

function getArg(name) {
  const index = args.indexOf(name);
  return index >= 0 && args[index + 1] ? args[index + 1] : null;
}

const castDataArg = getArg("--cast-data");
const characterId = getArg("--character-id");
const outDirArg = getArg("--out-dir");
const regenerateCandidatesArg = getArg("--regenerate-candidates");
const promptAuditOnly = args.includes("--prompt-audit-only");
if (!castDataArg || !characterId || !outDirArg) {
  console.error("Usage: node run-owner-finance-character-cast-audition.mjs --cast-data <json> --character-id <id> --out-dir <abs> [--prompt-audit-only]");
  process.exit(2);
}

const castDataPath = path.resolve(castDataArg);
const outDir = path.resolve(outDirArg);
const allowedOutputRoot = /^C:[\\/]+tmp[\\/]+money-shorts-os[\\/]+/i;
if (!allowedOutputRoot.test(outDir + path.sep) || outDir.startsWith(REPO_ROOT + path.sep)) {
  console.error("ABORT: --out-dir must be outside the repo under C:\\tmp\\money-shorts-os\\");
  process.exit(2);
}
if (!castDataPath.startsWith(path.join(REPO_ROOT, "lib") + path.sep) || path.basename(castDataPath) !== "finance-character-cast-data.json") {
  console.error("ABORT: --cast-data must be the repository finance-character-cast-data.json");
  process.exit(2);
}

let castData;
try {
  castData = JSON.parse(fs.readFileSync(castDataPath, "utf8"));
} catch (error) {
  console.error(`ABORT: cast data read failed: ${String(error?.message ?? error)}`);
  process.exit(2);
}

const character = Array.isArray(castData.characters)
  ? castData.characters.find((candidate) => candidate?.id === characterId)
  : null;
if (!character || !Array.isArray(character.candidateDirections) || character.candidateDirections.length !== castData.candidateCount) {
  console.error(`ABORT: unknown or incomplete character: ${characterId}`);
  process.exit(2);
}

const summaryPath = path.join(outDir, "cast-audition-summary.json");
const qaDir = path.join(outDir, "qa");
fs.mkdirSync(outDir, { recursive: true });
const regenerateCandidates = new Set();
if (regenerateCandidatesArg) {
  for (const token of regenerateCandidatesArg.split(",")) {
    const candidateNumber = Number(token.trim());
    if (!Number.isInteger(candidateNumber) || candidateNumber < 1 || candidateNumber > castData.candidateCount) {
      console.error(`ABORT: invalid --regenerate-candidates value: ${regenerateCandidatesArg}`);
      process.exit(2);
    }
    regenerateCandidates.add(candidateNumber);
  }
}

function buildPrompt(candidateNumber) {
  const direction = character.candidateDirections[candidateNumber - 1];
  return [
    "GENERATE ONE BRAND-NEW ORIGINAL TEXT-TO-IMAGE ASSET. Start from a blank canvas. Diagnostic draft only.",
    castData.sharedStyle,
    `Create an identity reference image for the recurring character ${character.name}.`,
    `Role: ${character.role}.`,
    `Fixed appearance: ${character.appearance}.`,
    `Fixed wardrobe: ${character.wardrobe}.`,
    `Candidate direction: ${direction}.`,
    "Show one and only one character as a clean vertical 9:16 identity board: one large full-body three-quarter view and two smaller consistent head-and-shoulder views in the same image.",
    "All three views must depict the exact same person, hairstyle, face proportions, age, body and outfit. Use a bright neutral studio-like environment with subtle lived-in depth, not a blank void.",
    "No labels, letters, numbers, captions, logos, split-screen borders, other people, duplicate bodies, bald or shaved hair, hairstyle changes, costume changes or photographic skin.",
  ].join(" ").replace(/\s+/g, " ").trim();
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function imageDimensions(buffer) {
  if (buffer.length >= 24 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20), contentType: "image/png" };
  }
  if (buffer.length >= 12 && buffer.slice(0, 4).toString("ascii") === "RIFF" && buffer.slice(8, 12).toString("ascii") === "WEBP") {
    return { width: null, height: null, contentType: "image/webp" };
  }
  if (buffer.length >= 4 && buffer[0] === 0xff && buffer[1] === 0xd8) {
    let offset = 2;
    while (offset + 9 < buffer.length) {
      if (buffer[offset] !== 0xff) { offset += 1; continue; }
      const marker = buffer[offset + 1];
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        return { width: buffer.readUInt16BE(offset + 7), height: buffer.readUInt16BE(offset + 5), contentType: "image/jpeg" };
      }
      offset += 2 + buffer.readUInt16BE(offset + 2);
    }
    return { width: null, height: null, contentType: "image/jpeg" };
  }
  return { width: null, height: null, contentType: "application/octet-stream" };
}

function candidateFile(candidateNumber) {
  return path.join(outDir, `candidate-${candidateNumber}.png`);
}

function candidateRow(candidateNumber, status, extra = {}) {
  const prompt = buildPrompt(candidateNumber);
  return {
    candidateNumber,
    direction: character.candidateDirections[candidateNumber - 1],
    promptFingerprint: sha256(prompt).slice(0, 16),
    file: candidateFile(candidateNumber),
    status,
    ...extra,
  };
}

function writeSummary(rows, blockerCode = null) {
  const summary = {
    schemaVersion: "money_shorts_character_cast_audition_summary_v1",
    castVersion: castData.version,
    visualStyle: castData.visualStyle,
    characterId,
    characterName: character.name,
    expectedCount: castData.candidateCount,
    allReady: rows.length === castData.candidateCount && rows.every((row) => row.status === "SAVED_OK"),
    blockerCode,
    notUploaded: true,
    generatedAt: new Date().toISOString(),
    candidates: rows,
  };
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2), "utf8");
  return summary;
}

const prompts = Array.from({ length: castData.candidateCount }, (_, index) => buildPrompt(index + 1));
if (promptAuditOnly) {
  const rows = prompts.map((prompt, index) => ({
    candidateNumber: index + 1,
    promptFingerprint: sha256(prompt).slice(0, 16),
    prompt,
  }));
  const passed = rows.every((row) =>
    /warm cinematic storybook 3D animation/i.test(row.prompt) &&
    /exact same person, hairstyle, face proportions, age, body and outfit/i.test(row.prompt) &&
    /without copying any studio, franchise, film or known character/i.test(row.prompt) &&
    !/Disney/i.test(row.prompt));
  const auditPath = path.join(outDir, "prompt-audit.json");
  fs.writeFileSync(auditPath, JSON.stringify({ passed, externalActionPerformed: false, characterId, rows }, null, 2), "utf8");
  console.log(JSON.stringify({
    passed,
    auditPath,
    rows: rows.map((row) => ({
      candidateNumber: row.candidateNumber,
      promptFingerprint: row.promptFingerprint,
    })),
  }, null, 2));
  process.exit(passed ? 0 : 1);
}

if (process.env.ALLOW_CHATGPT_IMAGE !== "1") {
  writeSummary([], "BLOCKED_GATE");
  console.error("ABORT: ALLOW_CHATGPT_IMAGE=1 is required");
  process.exit(3);
}

const previous = fs.existsSync(summaryPath)
  ? (() => { try { return JSON.parse(fs.readFileSync(summaryPath, "utf8")); } catch { return null; } })()
  : null;
const reusable = new Map();
for (const row of Array.isArray(previous?.candidates) ? previous.candidates : []) {
  if (regenerateCandidates.has(row.candidateNumber)) continue;
  const expectedPromptFingerprint = sha256(buildPrompt(row.candidateNumber)).slice(0, 16);
  if (
    previous.castVersion === castData.version &&
    row.status === "SAVED_OK" &&
    row.promptFingerprint === expectedPromptFingerprint &&
    typeof row.file === "string" &&
    fs.existsSync(row.file) &&
    typeof row.imageSha256 === "string" &&
    sha256(fs.readFileSync(row.file)) === row.imageSha256
  ) reusable.set(row.candidateNumber, row);
}

if (reusable.size === castData.candidateCount) {
  const rows = Array.from({ length: castData.candidateCount }, (_, index) => ({
    ...reusable.get(index + 1),
    method: "existing_file_skip",
  }));
  const summary = writeSummary(rows, null);
  console.log(JSON.stringify({
    status: "CHARACTER_CANDIDATES_READY",
    characterId,
    allReady: summary.allReady,
    reused: true,
    summaryPath,
  }, null, 2));
  process.exit(0);
}

const { chromium } = await import("playwright");
const {
  CDP_PORT_GPT1,
  USER_DATA_GPT1,
  ensureChrome,
  openFreshImageChat,
  detectStop,
  activateImageTool,
  verifyImageToolActive,
  typePrompt,
  checkSendEnabled,
  sendPrompt,
  collectLastAssistantImages,
  isAssistantDone,
  interceptRecover,
  saveFailReport,
} = await import("./_chatgpt-image-core.mjs");

async function fetchImageBuffer(page, url) {
  const bytes = await page.evaluate(async (source) => {
    try {
      const response = await fetch(source);
      if (!response.ok) return null;
      return Array.from(new Uint8Array(await response.arrayBuffer()));
    } catch { return null; }
  }, url).catch(() => null);
  return Array.isArray(bytes) && bytes.length > 10_000 ? Buffer.from(bytes) : null;
}

async function collectGeneratedImagesPageWide(page) {
  return page.evaluate(() => Array.from(document.querySelectorAll("img"))
    .filter((image) => image.naturalWidth >= 200 && !image.closest('[data-message-author-role="user"]'))
    .map((image) => ({
      src: image.src || image.currentSrc || image.getAttribute("data-src") || "",
      w: image.naturalWidth,
      h: image.naturalHeight,
    }))
    .filter((image) => /backend-api\/estuary\/content|backend-api\/files|oaiusercontent|^blob:/.test(image.src)));
}

async function saveGeneratedImage(page, destination) {
  const lastAssistantImages = await collectLastAssistantImages(page);
  const pageWideImages = await collectGeneratedImagesPageWide(page);
  const ranked = [...lastAssistantImages, ...pageWideImages]
    .filter((image, index, rows) => rows.findIndex((candidate) => candidate.src === image.src) === index)
    .sort((left, right) => (right.w * right.h) - (left.w * left.h));
  for (const image of ranked) {
    const buffer = await fetchImageBuffer(page, image.src);
    if (!buffer) continue;
    fs.writeFileSync(destination, buffer);
    return { buffer, method: "last_assistant_image" };
  }
  const recovered = await interceptRecover(page, page.url(), () => {});
  const buffers = [...recovered.values()].filter((buffer) => buffer.length > 10_000).sort((a, b) => b.length - a.length);
  if (buffers[0]) {
    fs.writeFileSync(destination, buffers[0]);
    return { buffer: buffers[0], method: "intercept_recovery" };
  }
  return null;
}

async function generateCandidate(context, candidateNumber) {
  const page = await context.newPage();
  const prompt = buildPrompt(candidateNumber);
  const destination = candidateFile(candidateNumber);
  try {
    await openFreshImageChat(page, () => {});
    await detectStop(page);
    await activateImageTool(page, () => {}, () => {});
    if (!(await verifyImageToolActive(page))) throw new Error("IMAGE_TOOL_NOT_ACTIVE");
    await typePrompt(page, prompt, () => {});
    if (!(await checkSendEnabled(page))) throw new Error("SEND_BUTTON_DISABLED");
    await sendPrompt(page);

    const startedAt = Date.now();
    let stableKey = "";
    let stableCount = 0;
    while (Date.now() - startedAt < 180_000) {
      await page.waitForTimeout(2500);
      await detectStop(page);
      const images = await collectGeneratedImagesPageWide(page);
      const last = images.at(-1);
      const key = last ? `${last.cid ?? last.src.slice(0, 100)}:${last.w}x${last.h}` : "";
      stableCount = key && key === stableKey ? stableCount + 1 : key ? 1 : 0;
      stableKey = key;
      if (stableCount < 3 || !(await isAssistantDone(page))) continue;
      const saved = await saveGeneratedImage(page, destination);
      if (!saved) continue;
      const dimensions = imageDimensions(saved.buffer);
      if (dimensions.width !== null && dimensions.height !== null && dimensions.height < dimensions.width) {
        throw new Error("LANDSCAPE_IMAGE_REJECTED");
      }
      return candidateRow(candidateNumber, "SAVED_OK", {
        width: dimensions.width,
        height: dimensions.height,
        contentType: dimensions.contentType,
        imageSha256: sha256(saved.buffer),
        method: saved.method,
      });
    }
    const finalSaved = await saveGeneratedImage(page, destination);
    if (finalSaved) {
      const dimensions = imageDimensions(finalSaved.buffer);
      if (dimensions.width !== null && dimensions.height !== null && dimensions.height < dimensions.width) {
        throw new Error("LANDSCAPE_IMAGE_REJECTED");
      }
      return candidateRow(candidateNumber, "SAVED_OK", {
        width: dimensions.width,
        height: dimensions.height,
        contentType: dimensions.contentType,
        imageSha256: sha256(finalSaved.buffer),
        method: `timeout_final_${finalSaved.method}`,
      });
    }
    throw new Error("TIMEOUT_BLOCKED");
  } catch (error) {
    const reason = String(error?.message ?? error).slice(0, 240);
    await saveFailReport(qaDir, `candidate-${candidateNumber}`, reason, page, { characterId, candidateNumber });
    return candidateRow(candidateNumber, "BLOCKED", { reason });
  } finally {
    await page.close().catch(() => {});
  }
}

let browser = null;
const rows = [];
let blockerCode = null;
try {
  await ensureChrome(CDP_PORT_GPT1, USER_DATA_GPT1, () => {});
  browser = await chromium.connectOverCDP(`http://localhost:${CDP_PORT_GPT1}`);
  const context = browser.contexts()[0];
  if (!context) throw new Error("BLOCKED_SESSION");
  for (let candidateNumber = 1; candidateNumber <= castData.candidateCount; candidateNumber += 1) {
    const existing = reusable.get(candidateNumber);
    if (existing) {
      rows.push({ ...existing, method: "existing_file_skip" });
      continue;
    }
    const row = await generateCandidate(context, candidateNumber);
    rows.push(row);
    if (row.status !== "SAVED_OK") {
      blockerCode = /STOP_DETECTED|CAPTCHA/.test(row.reason ?? "")
        ? "BLOCKED_RATE_OR_CAPTCHA"
        : /LOGIN|SESSION/.test(row.reason ?? "")
          ? "BLOCKED_SESSION"
          : "BLOCKED_IMAGE_TOOL";
      break;
    }
  }
} catch (error) {
  blockerCode = /SESSION|LOGIN/i.test(String(error?.message ?? error)) ? "BLOCKED_SESSION" : "RUNNER_ERROR";
} finally {
  if (browser) await browser.close().catch(() => {});
}

const summary = writeSummary(rows, blockerCode);
console.log(JSON.stringify({
  status: summary.allReady ? "CHARACTER_CANDIDATES_READY" : "CHARACTER_CANDIDATES_INCOMPLETE",
  characterId,
  allReady: summary.allReady,
  blockerCode: summary.blockerCode,
  summaryPath,
}, null, 2));
process.exit(summary.allReady ? 0 : blockerCode?.startsWith("BLOCKED_") ? 3 : 1);
