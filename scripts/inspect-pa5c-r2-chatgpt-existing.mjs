import { chromium } from "playwright";
import path from "path";
import { CDP_PORT_GPT1 } from "./_chatgpt-image-core.mjs";
import {
  readRecoveryRecord,
  persistRecoveryRecord,
  transitionForClassification,
  visibleConversationClassification,
} from "./_pa5c-r2-chatgpt-recovery-protocol.mjs";

const root = process.cwd();
const recordPath = path.resolve(process.argv[2] ?? "assets/editorial-v2/production-assets/pa5c-r2/recovery/REQUEST_02_SUBMITTED.json");
const record = readRecoveryRecord(recordPath);
if (!record.conversationUrl) throw new Error("COLLECTOR_CONVERSATION_URL_REQUIRED");

const browser = await chromium.connectOverCDP(`http://127.0.0.1:${CDP_PORT_GPT1}`);
const context = browser.contexts()[0];
let page = context.pages().find((candidate) => candidate.url().includes(record.conversationUrl.split("/c/")[1]));
if (!page) {
  page = await context.newPage();
  await page.goto(record.conversationUrl, { waitUntil: "domcontentloaded", timeout: 20000 });
}
await page.waitForTimeout(1000);
const snapshot = await page.evaluate((promptMarker) => {
  const compact = (value) => String(value || "").replace(/\s+/g, " ").trim();
  const visible = (element) => { const rect = element.getBoundingClientRect(); const style = getComputedStyle(element); return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none"; };
  const userMessagePresent = Array.from(document.querySelectorAll('[data-message-author-role="user"]')).some((node) => compact(node.textContent).includes(promptMarker));
  const assistantMessageCount = document.querySelectorAll('[data-message-author-role="assistant"]').length;
  const generatedImageCount = Array.from(document.images).filter((image) => image.naturalWidth >= 200 && /backend-api\/estuary\/content|oaiusercontent/i.test(image.currentSrc || image.src)).length;
  const texts = Array.from(document.querySelectorAll("body *")).filter(visible).map((node) => compact(node.textContent)).filter((text, index, all) => text && text.length < 220 && all.indexOf(text) === index);
  const visibleErrorText = texts.find((text) => /error|failed|try again|rate limit|오류|실패|한도/i.test(text)) ?? null;
  const pending = texts.some((text) => /generating|creating image|생성 중|만들고 있/i.test(text)) || Array.from(document.querySelectorAll("button")).filter(visible).some((button) => /stop generating|생성 중지/i.test(compact(`${button.getAttribute("aria-label") || ""} ${button.textContent || ""}`)));
  return { userMessagePresent, assistantMessageCount, generatedImageCount, visibleErrorText, pending, pageTitle: document.title };
}, record.prompt.slice(0, 120));
const classification = visibleConversationClassification({ ...snapshot, visibleError: Boolean(snapshot.visibleErrorText) });
const updated = transitionForClassification(record, classification, { classification, conversationUrl: page.url(), visibleErrorText: snapshot.visibleErrorText });
persistRecoveryRecord(recordPath, { ...updated, conversationUrl: page.url(), pageUrl: page.url(), lastSnapshot: snapshot });
console.log(JSON.stringify({ result: "INSPECT_EXISTING_NO_SEND", classification, state: updated.state, recordPath: path.relative(root, recordPath).replace(/\\/g, "/"), snapshot }));
// Never close externally launched Chrome or its conversation tab.
process.exit(0);
