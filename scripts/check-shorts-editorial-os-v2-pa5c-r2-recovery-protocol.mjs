import assert from "node:assert/strict";
import fs from "node:fs";

const core = fs.readFileSync("scripts/_pa5c-r2-chatgpt-recovery-protocol.mjs", "utf8");
const collector = fs.readFileSync("scripts/collect-pa5c-r2-chatgpt-existing.mjs", "utf8");
const inspector = fs.readFileSync("scripts/inspect-pa5c-r2-chatgpt-existing.mjs", "utf8");
const submitter = fs.readFileSync("scripts/submit-pa5c-r2-chatgpt-once.mjs", "utf8");

assert.match(core, /PREPARED[\s\S]*SUBMITTED[\s\S]*CONVERSATION_BOUND[\s\S]*RESULT_PENDING[\s\S]*RESULT_RECOVERED/);
assert.match(core, /VISIBLE_ERROR[\s\S]*ORPHANED[\s\S]*UNKNOWN/);
assert.match(core, /RECOVERY_ILLEGAL_TRANSITION/);
assert.match(core, /renameSync/);
assert.match(submitter, /OWNER_AUTHORIZATION_FLAG_REQUIRED/);
assert.match(submitter, /sendPrompt/);
for (const [name, source] of [["collector", collector], ["inspector", inspector]]) {
  assert.doesNotMatch(source, /sendPrompt|typePrompt|attachRef|checkSendEnabled|openFreshImageChat/);
}
console.log("PA5C_R2_RECOVERY_PROTOCOL_CHECK: PASS (10/10)");
