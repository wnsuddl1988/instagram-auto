import { chromium } from "playwright";
import path from "path";
import {
  CDP_PORT_GPT1,
  USER_DATA_GPT1,
  ensureChrome,
  checkLogin,
  detectStop,
  openFreshImageChat,
  attachRef,
  activateImageTool,
  typePrompt,
  checkSendEnabled,
  sendPrompt,
} from "./_chatgpt-image-core.mjs";
import { readRecoveryRecord, persistRecoveryRecord, transition } from "./_pa5c-r2-chatgpt-recovery-protocol.mjs";

if (process.argv[2] !== "--owner-authorized-submit") {
  throw new Error("OWNER_AUTHORIZATION_FLAG_REQUIRED: submit command is deliberately inert without the exact flag");
}
const recordPath = path.resolve(process.argv[3] ?? "");
const record = readRecoveryRecord(recordPath);
if (record.state !== "PREPARED") throw new Error(`SUBMIT_ONCE_REQUIRES_PREPARED_STATE:${record.state}`);
if (!record.prompt || !record.masterAbsolutePath) throw new Error("PREPARED_RECORD_PROMPT_AND_MASTER_REQUIRED");
await ensureChrome(CDP_PORT_GPT1, USER_DATA_GPT1);
const browser = await chromium.connectOverCDP(`http://127.0.0.1:${CDP_PORT_GPT1}`);
const context = browser.contexts()[0];
const page = await context.newPage();
await checkLogin(page);
await openFreshImageChat(page);
await detectStop(page);
await attachRef(page, record.masterAbsolutePath);
await activateImageTool(page);
await typePrompt(page, record.prompt);
if (!(await checkSendEnabled(page))) throw new Error("SUBMIT_ONCE_SEND_DISABLED");
await sendPrompt(page);
await page.waitForTimeout(1000);
const confirmation = await page.evaluate((promptHash) => {
  const composerText = String(document.querySelector("#prompt-textarea")?.textContent || "").replace(/\s+/g, " ").trim();
  const userMessagePresent = Array.from(document.querySelectorAll('[data-message-author-role="user"]'))
    .some((node) => String(node.textContent || "").includes("GENERATE ONE BRAND-NEW ORIGINAL TEXT-TO-IMAGE ASSET."));
  return { composerCleared: !composerText.includes("GENERATE ONE BRAND-NEW ORIGINAL TEXT-TO-IMAGE ASSET."), userMessagePresent, promptHash };
}, record.promptHash);
if (!confirmation.composerCleared || !confirmation.userMessagePresent) throw new Error(`SUBMIT_ONCE_UNCONFIRMED_NO_RETRY:${JSON.stringify(confirmation)}`);
const submitted = transition(record, "SUBMITTED", { conversationUrl: page.url(), submissionTimestamp: new Date().toISOString(), confirmation });
persistRecoveryRecord(recordPath, { ...submitted, pageUrl: page.url(), conversationUrl: /\/c\//.test(page.url()) ? page.url() : null });
const bound = submitted.conversationUrl ? transition(submitted, "CONVERSATION_BOUND", { conversationUrl: submitted.conversationUrl }) : submitted;
if (bound !== submitted) persistRecoveryRecord(recordPath, bound);
console.log(JSON.stringify({ result: "SUBMIT_ONCE_COMPLETE", state: bound.state, conversationUrl: bound.conversationUrl }));
// Deliberately do not wait for a result and do not close the browser or page.
process.exit(0);
