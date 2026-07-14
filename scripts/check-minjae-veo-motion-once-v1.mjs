#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import fs from "node:fs";

const runnerPath = "scripts/run-minjae-veo-motion-once-v1.mjs";
const packetPath = "C:/tmp/money-shorts-os/gemini-veo/minjae-horizon-motion-pilot-v1/approval-packet.json";
const correctionPath = "C:/tmp/money-shorts-os/gemini-veo/minjae-horizon-motion-pilot-v1/motion-qa-correction.json";
const source = fs.readFileSync(runnerPath, "utf8");
const packet = JSON.parse(fs.readFileSync(packetPath, "utf8"));
const correction = JSON.parse(fs.readFileSync(correctionPath, "utf8"));
const result = spawnSync(process.execPath, [
  runnerPath,
  "--contract-check",
  "--approved-prompt-sha256", packet.scene.promptSha256,
  "--approved-reference-sha256", packet.character.referenceSha256,
], { encoding: "utf8" });
const contract = result.status === 0 ? JSON.parse(result.stdout) : null;

let passed = 0;
let failed = 0;
function check(label, condition) {
  if (condition) {
    passed += 1;
    console.log(`PASS ${label}`);
  } else {
    failed += 1;
    console.error(`FAIL ${label}`);
  }
}

check("contract check is local-only and validates both approved hashes", result.status === 0 && contract?.passed === true && contract?.promptSha256 === packet.scene.promptSha256 && contract?.referenceSha256 === packet.character.referenceSha256 && contract?.browserLaunched === false);
check("current rejected download is proven identical to the preexisting copier S5 artifact", correction.status === "REJECTED_PAST_ARTIFACT" && contract?.existingOutputProvenance?.downloadedSha256 === correction.rejectedOutputSha256 && contract?.existingOutputProvenance?.duplicatePath === correction.duplicateExistingArtifact);
check("execute mode requires both exact one-submit CLI gates", /--owner-approved-once/.test(source) && /--allow-one-submit/.test(source));
check("fresh matching no-submit preflight is required before execution", /fresh no-submit preflight is required/.test(source) && /freshConversationConfirmed/.test(source) && /30 \* 60_000/.test(source));
check("profile traversal uses shared Owner chain and quota-only advance policy", /for \(const profile of GEMINI_VEO_PROFILE_CHAIN\)/.test(source) && /canAdvanceToNextGeminiProfile\(state\)/.test(source));
check("prompt and reference use SHA-256 and are rechecked immediately before intent", /approvedPromptSha256/.test(source) && /approvedReferenceSha256/.test(source) && /changed immediately before submission intent/.test(source));
check("prompt DOM must exactly match packet instead of keyword length only", /typed !== prompt/.test(source) && /sha256\(typed\) !== approvedPromptSha256/.test(source));
check("attachment requires new composer evidence and pre-attach reference rehash", /afterThumbnails <= beforeThumbnails && afterRemove <= beforeRemove/.test(source) && /reference_hash_changed_before_attach/.test(source));
check("each attempt starts from a verified blank conversation with no prior response or media", /ensureFreshConversation\(page\)/.test(source) && /fresh_chat_contains_prior_response_or_media/.test(source) && /prior_media_appeared_before_send/.test(source));
check("send button is unique visible enabled and trial-clicked", /visible\.length !== 1/.test(source) && /click\(\{ trial: true \}\)/.test(source));
check("submission intent is exclusive and written before the only send click", source.indexOf('flag: "wx"') >= 0 && source.indexOf("fs.writeFileSync(intentPath") < source.indexOf("await prepared.sendButton.click()"));
check("Enter fallback and browser-wide close are absent", !/press\(["']Enter|keyboard\.press\(["']Enter|browser\.close\(/.test(source));
check("post-submit quota cannot trigger profile fallback or retry", /POST_SUBMIT_QUOTA_NO_FALLBACK/.test(source) && /fallbackAfterSubmitPerformed: false/.test(source) && /automaticRetryPerformed: false/.test(source));
check("download is scoped to a new model response with no global newest-button fallback", /findNewResponseScope\(prepared\.page, prepared\.conversationBaseline\)/.test(source) && /scopedResponse\.response\.locator\(DOWNLOAD_SELECTOR\)/.test(source) && !/downloadCandidates\.at\(-1\)/.test(source));
check("download keeps partial MP4 integrity validation before any final rename", /partialVideo/.test(source) && /includes\(Buffer\.from\("ftyp"\)\)/.test(source) && source.indexOf("findPreexistingVideoDuplicate(partialVideo)") < source.indexOf("fs.renameSync(partialVideo, outputVideo)"));
check("preexisting video hash duplicate blocks final acceptance and keeps evidence", /DOWNLOAD_MATCHES_PREEXISTING_ARTIFACT_NO_RETRY/.test(source) && /duplicateExistingArtifact/.test(source) && /rejectedPartialVideo = partialVideo/.test(source));
check("unconfirmed provenance fails closed and failure leaves the page open", /DOWNLOAD_PROVENANCE_UNCONFIRMED_NO_RETRY/.test(source) && /pageKeptOpenForRecovery: !downloaded/.test(source) && /if \(downloaded\) await prepared\.page\.close/.test(source));
check("output and execution ledger stay outside repository under C tmp", /^C:[\\/]+tmp[\\/]+money-shorts-os[\\/]/i.test(packet.outputPlan.root + "/") && /submission-intent\.json/.test(source) && /execution-result\.json/.test(source));

console.log(JSON.stringify({ passed: failed === 0, passedCount: passed, totalCount: passed + failed, failedCount: failed }, null, 2));
process.exit(failed === 0 ? 0 : 1);
