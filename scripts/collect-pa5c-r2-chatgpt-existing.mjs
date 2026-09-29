import { chromium } from "playwright";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { CDP_PORT_GPT1 } from "./_chatgpt-image-core.mjs";
import { readRecoveryRecord, persistRecoveryRecord } from "./_pa5c-r2-chatgpt-recovery-protocol.mjs";

const root = process.cwd();
const recordPath = path.resolve(process.argv[2] ?? "assets/editorial-v2/production-assets/pa5c-r2/recovery/REQUEST_02_SUBMITTED.json");
const record = readRecoveryRecord(recordPath);
if (record.state !== "RESULT_RECOVERED") throw new Error(`COLLECT_EXISTING_REQUIRES_RESULT_RECOVERED:${record.state}`);
if (!record.conversationUrl) throw new Error("COLLECT_EXISTING_CONVERSATION_URL_REQUIRED");

const browser = await chromium.connectOverCDP(`http://127.0.0.1:${CDP_PORT_GPT1}`);
const page = browser.contexts()[0].pages().find((candidate) => candidate.url().includes(record.conversationUrl.split("/c/")[1]));
if (!page) throw new Error("COLLECT_EXISTING_CONVERSATION_TAB_NOT_FOUND");
const generated = await page.evaluate(() => Array.from(document.images)
  .filter((image) => image.naturalWidth >= 200 && /backend-api\/estuary\/content|oaiusercontent/i.test(image.currentSrc || image.src))
  .map((image) => ({ src: image.currentSrc || image.src, width: image.naturalWidth, height: image.naturalHeight, alt: image.alt || "" }))
  .filter((image) => /생성된 이미지|generated image/i.test(image.alt))
  .find(Boolean) ?? null);
if (!generated) throw new Error("COLLECT_EXISTING_GENERATED_IMAGE_NOT_FOUND");
const payload = await page.evaluate(async (src) => {
  const response = await fetch(src);
  if (!response.ok) throw new Error(`RESULT_FETCH_HTTP_${response.status}`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 0x8000) binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  return { contentType: response.headers.get("content-type") || "", base64: btoa(binary) };
}, generated.src);
const extension = /png/i.test(payload.contentType) ? "png" : /webp/i.test(payload.contentType) ? "webp" : "jpg";
const safeAssetId = String(record.assetId ?? `REQUEST_${record.requestNumber}_RESULT`).replace(/[^A-Z0-9_-]/gi, "_");
const outputPath = path.join(root, "assets/editorial-v2/production-assets/pa5c-r2/generated", `${safeAssetId}_REQUEST_${record.requestNumber}.${extension}`);
const bytes = Buffer.from(payload.base64, "base64");
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, bytes);
const updated = {
  ...record,
  recoveredResult: {
    assetPath: path.relative(root, outputPath).replace(/\\/g, "/"),
    sha256: crypto.createHash("sha256").update(bytes).digest("hex"),
    bytes: bytes.length,
    width: generated.width,
    height: generated.height,
    contentType: payload.contentType,
    recoveredAt: new Date().toISOString(),
  },
};
persistRecoveryRecord(recordPath, updated);
console.log(JSON.stringify({ result: "COLLECT_EXISTING_RESULT_RECOVERED_NO_SEND", ...updated.recoveredResult }));
// Structural boundary: this process only reads an existing bound conversation.
// It intentionally contains no ChatGPT composer, attachment, or submission imports.
process.exit(0);
