#!/usr/bin/env node

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

import {
  GEMINI_FLOW_TARGET,
  isExactGeminiFlowProjectRootUrl,
} from "./_gemini-flow-no-submit-contract.mjs";
import { classifyPriorFlowMotionGenerationSummary } from "./_flow-motion-generation-summary.mjs";
import { acquireFlowMotionExecutionLock } from "./_flow-motion-execution-lock.mjs";
import {
  parseExactFlowResultUrl,
  selectExactNewFlowResult,
} from "./_flow-motion-result-binding.mjs";
import { classifyComposerReferenceIdentity } from "./_flow-motion-reference-binding.mjs";

const classifySummary = (summary) => classifyPriorFlowMotionGenerationSummary(summary, 20);
const assertSummaryBlocked = (summary, reasonPattern) => {
  const result = classifySummary(summary);
  assert.equal(result.action, "block");
  if (reasonPattern) assert.match(result.reason, reasonPattern);
};

assert.deepEqual(classifySummary(null), {
  action: "none",
  reason: null,
  submissionCount: 0,
  approvalClickAttemptCount: 0,
});
assert.equal(classifySummary({
  status: "FAILED_NO_AUTOMATIC_RETRY",
  submissionCount: 0,
  expectedCreditsSpent: 0,
  makeClickAttemptCount: 0,
  approvalClickAttemptCount: 0,
}).action, "safe_new_attempt");
assertSummaryBlocked({
  status: "FAILED_NO_AUTOMATIC_RETRY",
  submissionCount: 0,
  expectedCreditsSpent: 0,
  ownerObservedSubmissionCount: 1,
  ownerObservedCreditsSpent: 20,
  makeClickAttemptCount: 0,
  approvalClickAttemptCount: 0,
}, /owner_observation_count_mismatch/);
assertSummaryBlocked({
  status: "CONFIRMATION_PENDING_NO_SUBMISSION",
  submissionCount: 0,
  expectedCreditsSpent: 0,
  ownerObservedCreditsSpent: 20,
  makeClickAttemptCount: 1,
  makeClickIntent: { clickIntentArmed: true, outcomeConfirmedNoSubmission: true },
  approvalClickAttemptCount: 0,
}, /owner_observation_count_mismatch/);
assert.equal(classifySummary({
  status: "SUBMITTED_PENDING_RESULT",
  submissionCount: 1,
  expectedCreditsSpent: 20,
  makeClickAttemptCount: 1,
  approvalClickAttemptCount: 1,
  submitEvidence: { clickDispatched: true },
}).action, "resume_submitted_result");
assert.equal(classifySummary({
  status: "SUBMITTED_RESULT_BOUND_PENDING_DOWNLOAD",
  submissionCount: 1,
  expectedCreditsSpent: 20,
  makeClickAttemptCount: 1,
  approvalClickAttemptCount: 1,
  submitEvidence: { clickDispatched: true },
}).action, "resume_submitted_result");
assert.equal(classifySummary({
  status: "SUBMITTED_RESULT_BOUND_PENDING_DOWNLOAD",
  attemptId: "22222222-2222-4222-8222-222222222222",
  jobId: "job-direct-result",
  referenceSha256: "d".repeat(64),
  promptSha256: "e".repeat(64),
  providerPromptSha256: "f".repeat(64),
  submissionCount: 1,
  expectedCreditsSpent: 20,
  makeClickAttemptCount: 1,
  makeClickIntent: { clickIntentArmed: true, dispatchObserved: true },
  approvalClickAttemptCount: 0,
  submitEvidence: {
    clickDispatched: false,
    observedBy: "exact_attempt_result_after_make_no_confirmation",
  },
  resultBinding: {
    schemaVersion: "money_shorts_flow_motion_result_binding_v1",
    attemptId: "22222222-2222-4222-8222-222222222222",
    jobId: "job-direct-result",
    referenceSha256: "d".repeat(64),
    promptSha256: "e".repeat(64),
    providerPromptSha256: "f".repeat(64),
  },
}).action, "resume_submitted_result");
assert.equal(classifySummary({
  status: "SUBMITTED_RESULT_BOUND_PENDING_DOWNLOAD",
  attemptId: "11111111-1111-4111-8111-111111111111",
  jobId: "job-reconciled",
  referenceSha256: "a".repeat(64),
  promptSha256: "b".repeat(64),
  providerPromptSha256: "c".repeat(64),
  submissionCount: 1,
  expectedCreditsSpent: 20,
  makeClickAttemptCount: 1,
  approvalClickAttemptCount: 1,
  submitEvidence: {
    clickDispatched: false,
    observedBy: "exact_attempt_result_recovered_after_uncertain_click",
  },
  resultBinding: {
    schemaVersion: "money_shorts_flow_motion_result_binding_v1",
    attemptId: "11111111-1111-4111-8111-111111111111",
    jobId: "job-reconciled",
    referenceSha256: "a".repeat(64),
    promptSha256: "b".repeat(64),
    providerPromptSha256: "c".repeat(64),
  },
}).action, "resume_submitted_result");
assertSummaryBlocked({
  status: "SUBMITTED_PENDING_RESULT",
  submissionCount: 1,
  expectedCreditsSpent: 20,
  makeClickAttemptCount: 1,
  makeClickIntent: { clickIntentArmed: true, outcomeConfirmedNoSubmission: true },
  approvalClickAttemptCount: 0,
  submitEvidence: {
    observedBy: "new_flow_edit_result_after_make_without_confirmation",
    newVideoEditHrefs: ["https://labs.google/fx/ko/tools/flow/project/example/edit/old-card"],
  },
}, /submission_evidence_unreliable/);
assert.equal(classifySummary({
  status: "APPROVAL_CLICK_OUTCOME_UNKNOWN",
  submissionCount: 0,
  expectedCreditsSpent: null,
  makeClickAttemptCount: 1,
  makeClickIntent: { clickIntentArmed: true, outcomeConfirmedNoSubmission: true },
  approvalClickAttemptCount: 1,
  approvalClickIntent: { clickIntentArmed: true },
}).action, "reconcile_uncertain_result");
assert.equal(classifySummary({
  status: "MAKE_CLICK_OUTCOME_UNKNOWN",
  submissionCount: 0,
  expectedCreditsSpent: null,
  makeClickAttemptCount: 1,
  makeClickIntent: { clickIntentArmed: true },
  approvalClickAttemptCount: 0,
}).action, "reconcile_uncertain_result");
assertSummaryBlocked({
  status: "APPROVAL_CLICK_OUTCOME_UNKNOWN",
  submissionCount: 0,
  expectedCreditsSpent: null,
  makeClickAttemptCount: 1,
  makeClickIntent: { clickIntentArmed: true },
  approvalClickAttemptCount: 1,
}, /click_outcome_requires_manual_review/);
assertSummaryBlocked({
  status: "FAILED_NO_AUTOMATIC_RETRY",
  submissionCount: 0,
  expectedCreditsSpent: 0,
  failure: "required_generation_confirmation_dialog_missing:baseline=1,current=0",
  makeClickAttemptCount: 1,
  approvalClickAttemptCount: 0,
}, /make_click_outcome_requires_manual_review/);
const confirmedNoSubmissionSummary = {
  status: "CONFIRMATION_PENDING_NO_SUBMISSION",
  submissionCount: 0,
  expectedCreditsSpent: 0,
  makeClickAttemptCount: 1,
  makeClickIntent: {
    clickIntentArmed: true,
    outcomeConfirmedNoSubmission: true,
  },
  approvalClickAttemptCount: 0,
};
assert.equal(classifySummary(confirmedNoSubmissionSummary).action, "safe_new_attempt");
for (const missingField of [
  "makeClickAttemptCount",
  "makeClickIntent.clickIntentArmed",
  "makeClickIntent.outcomeConfirmedNoSubmission",
  "approvalClickAttemptCount",
]) {
  const incomplete = structuredClone(confirmedNoSubmissionSummary);
  if (missingField.startsWith("makeClickIntent.")) {
    delete incomplete.makeClickIntent[missingField.split(".")[1]];
  } else {
    delete incomplete[missingField];
  }
  assertSummaryBlocked(incomplete);
}
assert.equal(classifySummary({
  status: "FAILED_NO_AUTOMATIC_RETRY",
  submissionCount: 0,
  expectedCreditsSpent: 0,
  failure: "required_generation_confirmation_dialog_missing:baseline=0,current=0",
  makeClickAttemptCount: 1,
  makeClickIntent: { clickIntentArmed: true, outcomeConfirmedNoSubmission: true },
  approvalClickAttemptCount: 0,
}).action, "safe_new_attempt");
assertSummaryBlocked({
  status: "SUBMITTED_PENDING_RESULT",
  submissionCount: 0,
  expectedCreditsSpent: 0,
  makeClickAttemptCount: 0,
  approvalClickAttemptCount: 0,
}, /zero_submission_status_invalid/);
assertSummaryBlocked({
  status: "FAILED_NO_AUTOMATIC_RETRY",
  submissionCount: 0,
  expectedCreditsSpent: 0,
  makeClickAttemptCount: 0,
  approvalClickAttemptCount: 0,
  submitEvidence: { clickDispatched: true },
}, /dispatch_count_mismatch/);
assertSummaryBlocked({
  status: "FAILED_NO_AUTOMATIC_RETRY",
  submissionCount: 0,
  expectedCreditsSpent: 0,
  makeClickAttemptCount: 0,
  approvalClickAttemptCount: 1,
}, /manual_review/);
assertSummaryBlocked({
  status: "FAILED_NO_AUTOMATIC_RETRY",
  submissionCount: 0,
  expectedCreditsSpent: 0,
  makeClickAttemptCount: 0,
  approvalClickAttemptCount: 0,
  approvalClickIntent: { clickIntentArmed: true },
}, /intent_attempt_mismatch/);
for (const invalidCount of ["0", -1, 0.5, 2, Number.NaN]) {
  assertSummaryBlocked({
    status: "FAILED_NO_AUTOMATIC_RETRY",
    submissionCount: invalidCount,
    expectedCreditsSpent: 0,
    makeClickAttemptCount: 0,
    approvalClickAttemptCount: 0,
  }, /submission_count_invalid/);
}
for (const invalidAttempt of ["0", -1, 0.5, 2, Number.NaN]) {
  assertSummaryBlocked({
    status: "FAILED_NO_AUTOMATIC_RETRY",
    submissionCount: 0,
    expectedCreditsSpent: 0,
    makeClickAttemptCount: 0,
    approvalClickAttemptCount: invalidAttempt,
  }, /approval_click_attempt_count_invalid/);
}
assertSummaryBlocked({
  status: "SUBMITTED_PENDING_RESULT",
  submissionCount: 1,
  expectedCreditsSpent: 0,
  makeClickAttemptCount: 1,
  approvalClickAttemptCount: 1,
}, /credit_mismatch/);

const referenceIdentityEvidence = {
  referenceFileName: "reference-0123456789abcdef.png",
  attachmentAlt: "",
  selectedMediaSourceSha256: "picker-source",
  composerAttachmentSourceSha256: "composer-source",
  baselineAttachmentCount: 0,
  selectedOptionCount: 1,
  attachmentCount: 1,
};
assert.equal(
  classifyComposerReferenceIdentity(referenceIdentityEvidence),
  "controlled_single_attachment_transition",
);
assert.equal(classifyComposerReferenceIdentity({
  ...referenceIdentityEvidence,
  attachmentAlt: referenceIdentityEvidence.referenceFileName,
}), "exact_alias_alt");
assert.equal(classifyComposerReferenceIdentity({
  ...referenceIdentityEvidence,
  composerAttachmentSourceSha256: referenceIdentityEvidence.selectedMediaSourceSha256,
}), "exact_media_source");
for (const unsafeEvidence of [
  { baselineAttachmentCount: 1 },
  { selectedOptionCount: 0 },
  { selectedOptionCount: 2 },
  { attachmentCount: 0 },
  { attachmentCount: 2 },
]) {
  assert.equal(classifyComposerReferenceIdentity({
    ...referenceIdentityEvidence,
    ...unsafeEvidence,
  }), null);
}

const root = `C:/tmp/money-shorts-os/flow-motion-runner-contract-check-v1-${process.pid}`;
const statePath = path.join(root, "flow-motion-state.json");
const jobId = "runner-contract-topic-single-scene-02";
const prompt = "Animate one bright warm Korean adult scene with true restrained articulated hand motion; camera-only motion is insufficient.";
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const referenceFile = path.join(root, "images", "scene-02.png");

const oldResult = `${GEMINI_FLOW_TARGET.projectUrl}/edit/11111111-1111-1111-1111-111111111111`;
const exactResult = `${GEMINI_FLOW_TARGET.projectUrl}/edit/22222222-2222-2222-2222-222222222222`;
const unrelatedResult = `${GEMINI_FLOW_TARGET.projectUrl}/edit/33333333-3333-3333-3333-333333333333`;
assert.equal(parseExactFlowResultUrl(exactResult, GEMINI_FLOW_TARGET.projectUrl)?.providerResultId,
  "22222222-2222-2222-2222-222222222222");
assert.equal(parseExactFlowResultUrl("https://example.com/edit/wrong-result", GEMINI_FLOW_TARGET.projectUrl), null);
assert.equal(parseExactFlowResultUrl(`${exactResult}/unexpected`, GEMINI_FLOW_TARGET.projectUrl), null);
assert.equal(parseExactFlowResultUrl(`${exactResult}?tab=history`, GEMINI_FLOW_TARGET.projectUrl), null);
assert.equal(parseExactFlowResultUrl(`${exactResult}#old-result`, GEMINI_FLOW_TARGET.projectUrl), null);
assert.deepEqual(selectExactNewFlowResult([
  { href: oldResult, exactPromptMatches: true, scopeLinkCount: 1, videoCount: 1 },
  { href: unrelatedResult, exactPromptMatches: false, scopeLinkCount: 1, videoCount: 1 },
  { href: exactResult, exactPromptMatches: true, scopeLinkCount: 1, videoCount: 1 },
], [oldResult], GEMINI_FLOW_TARGET.projectUrl), {
  state: "ready",
  binding: {
    schemaVersion: "money_shorts_flow_motion_result_binding_v1",
    editUrl: exactResult,
    providerResultId: "22222222-2222-2222-2222-222222222222",
    observedBy: "exact_prompt_card_new_link",
  },
});
assert.equal(selectExactNewFlowResult([
  { href: oldResult, exactPromptMatches: true, scopeLinkCount: 1, videoCount: 1 },
], [oldResult], GEMINI_FLOW_TARGET.projectUrl).state, "waiting");
assert.equal(selectExactNewFlowResult([
  { href: exactResult, exactPromptMatches: true, scopeLinkCount: 1, videoCount: 1 },
  { href: unrelatedResult, exactPromptMatches: true, scopeLinkCount: 1, videoCount: 1 },
], [], GEMINI_FLOW_TARGET.projectUrl).state, "ambiguous");

const lockRoot = path.join(root, "execution-lock");
const firstLock = await acquireFlowMotionExecutionLock(lockRoot, { attemptId: "attempt-a", jobId: "job-a" });
await assert.rejects(
  () => acquireFlowMotionExecutionLock(lockRoot, { attemptId: "attempt-b", jobId: "job-b" }),
  /flow_motion_execution_lock_active:job-a/,
);
await firstLock.release();
const secondLock = await acquireFlowMotionExecutionLock(lockRoot, { attemptId: "attempt-b", jobId: "job-b" });
await secondLock.release();

const lostOwnershipRoot = path.join(root, "lost-ownership-execution-lock");
const lostOwnershipLock = await acquireFlowMotionExecutionLock(
  lostOwnershipRoot,
  { attemptId: "attempt-owner", jobId: "job-owner" },
);
fs.writeFileSync(lostOwnershipLock.lockPath, '{"token":"different-owner"}\n');
await assert.rejects(
  () => lostOwnershipLock.release(),
  /flow_motion_execution_lock_ownership_lost/,
);
const lockAfterLostOwnership = await acquireFlowMotionExecutionLock(
  lostOwnershipRoot,
  { attemptId: "attempt-next", jobId: "job-next" },
);
await lockAfterLostOwnership.release();

const lockFileName = "flow-motion-global-execution.lock.json";
const freshEmptyLockRoot = path.join(root, "fresh-empty-execution-lock");
fs.mkdirSync(freshEmptyLockRoot, { recursive: true });
fs.writeFileSync(path.join(freshEmptyLockRoot, lockFileName), "");
const recoveredFreshMetadata = await acquireFlowMotionExecutionLock(
  freshEmptyLockRoot,
  { attemptId: "attempt-fresh", jobId: "job-fresh" },
);
assert.equal(
  JSON.parse(fs.readFileSync(recoveredFreshMetadata.lockPath, "utf8")).schemaVersion,
  "money_shorts_flow_motion_execution_lock_v2",
);
await recoveredFreshMetadata.release();

const staleEmptyLockRoot = path.join(root, "stale-empty-execution-lock");
const staleEmptyLockPath = path.join(staleEmptyLockRoot, lockFileName);
fs.mkdirSync(staleEmptyLockRoot, { recursive: true });
fs.writeFileSync(staleEmptyLockPath, "");
const recoveredStaleEmptyLock = await acquireFlowMotionExecutionLock(
  staleEmptyLockRoot,
  { attemptId: "attempt-stale-empty", jobId: "job-stale-empty" },
);
await recoveredStaleEmptyLock.release();

const rebootStaleLockRoot = path.join(root, "reboot-stale-execution-lock");
const rebootStaleLockPath = path.join(rebootStaleLockRoot, lockFileName);
fs.mkdirSync(rebootStaleLockRoot, { recursive: true });
fs.writeFileSync(rebootStaleLockPath, `${JSON.stringify({
  schemaVersion: "money_shorts_flow_motion_execution_lock_v1",
  token: "previous-boot-token",
  attemptId: "attempt-previous-boot",
  jobId: "job-previous-boot",
  pid: process.pid,
  bootTimeMs: 0,
  acquiredAt: new Date().toISOString(),
})}\n`);
const recoveredRebootLock = await acquireFlowMotionExecutionLock(
  rebootStaleLockRoot,
  { attemptId: "attempt-current-boot", jobId: "job-current-boot" },
);
await recoveredRebootLock.release();

assert.equal(isExactGeminiFlowProjectRootUrl(GEMINI_FLOW_TARGET.projectUrl), true);
assert.equal(isExactGeminiFlowProjectRootUrl(`${GEMINI_FLOW_TARGET.projectUrl}/`), true);
assert.equal(isExactGeminiFlowProjectRootUrl(`${GEMINI_FLOW_TARGET.projectUrl}?tab=media`), true);
assert.equal(isExactGeminiFlowProjectRootUrl(`${GEMINI_FLOW_TARGET.projectUrl}/edit/result-id`), false);
assert.equal(isExactGeminiFlowProjectRootUrl("https://example.com/fx/ko/tools/flow/project/2b12c31a-4493-405b-aedf-2268abb10422"), false);
assert.equal(isExactGeminiFlowProjectRootUrl(`https://labs.google/extra${new URL(GEMINI_FLOW_TARGET.projectUrl).pathname}`), false);

fs.mkdirSync(path.dirname(referenceFile), { recursive: true });
fs.writeFileSync(referenceFile, Buffer.from("flow-motion-runner-reference-v1"));
const referenceSha256 = sha256(fs.readFileSync(referenceFile));
const promptSha256 = sha256(prompt);
const jobRoot = path.join(
  root,
  "scene-02",
  `contract-${referenceSha256.slice(0, 16)}-${promptSha256.slice(0, 16)}`,
);
const packetPath = path.join(jobRoot, "approval-packet.json");
const expectedVideoPath = path.join(jobRoot, "flow-motion-raw.mp4");
const qaEvidencePath = path.join(jobRoot, "qa-evidence.json");
fs.mkdirSync(jobRoot, { recursive: true });
if (fs.existsSync(expectedVideoPath)) throw new Error("contract_check_output_must_not_exist");
const requiredWording = `APPROVE_FLOW_MOTION_GENERATION: ${jobId} — reference hash ${referenceSha256} 및 prompt hash ${promptSha256}로 Gemini 2 Flow에서 Veo 3.1 Fast 9:16 1개 생성 전송을 승인함; 명시적 quota_exhausted일 때만 Gemini 3/4 fallback 허용`;
const job = {
  contractVersion: "money_shorts_flow_motion_job_v1",
  jobId,
  topicId: "runner-contract-topic",
  productionPartId: "single",
  sceneNumber: 2,
  sceneId: "scene-02",
  sceneLabel: "행동 장면",
  status: "generating",
  referenceFile,
  referenceSha256,
  prompt,
  promptSha256,
  packetPath,
  expectedVideoPath,
  qaEvidencePath,
  providerTarget: {
    provider: "Google Flow",
    primaryProfile: "Gemini 2",
    fallbackProfiles: ["Gemini 3", "Gemini 4"],
    fallbackCondition: "explicit_quota_exhausted_only",
    projectId: "2b12c31a-4493-405b-aedf-2268abb10422",
    videoModel: "Veo 3.1 - Fast",
    aspectRatio: "9:16",
    outputCount: 1,
    expectedCreditsPerGeneration: 20,
    confirmBeforeGeneration: "always",
  },
  approval: { required: true, ownerApprovalId: "owner-contract-check", approvedAt: new Date().toISOString(), requiredWording },
  qa: { outputVideoSha256: null, evidenceId: null, note: null },
  transitionHistory: [],
  liveBoundary: {
    browserOpenedNow: false,
    referenceUploadedNow: false,
    promptTypedNow: false,
    generationSubmittedNow: false,
    creditsSpentNow: false,
    externalActionRequiresSeparateOwnerApproval: true,
  },
};
const noSubmitBoundary = {
  externalActionPerformed: false,
  browserOpened: false,
  uploadCount: 0,
  promptSubmitCount: 0,
  generationSubmitCount: 0,
  creditsSpent: 0,
};
fs.writeFileSync(packetPath, `${JSON.stringify({
  schemaVersion: "money_shorts_flow_motion_approval_packet_v1",
  job,
  statePath,
  status: "generating",
  noSubmitBoundary,
}, null, 2)}\n`);
fs.writeFileSync(statePath, `${JSON.stringify({
  schemaVersion: "money_shorts_flow_motion_state_v1",
  topicId: job.topicId,
  productionPartId: job.productionPartId,
  scriptFingerprint: "runner-contract-fingerprint",
  statePath,
  generatedAt: new Date().toISOString(),
  overallStatus: "generating",
  requiredSceneCount: 1,
  renderReadyCount: 0,
  jobs: [job],
  noSubmitBoundary,
}, null, 2)}\n`);

const runnerPath = path.resolve("scripts/run-flow-motion-job-playwright-v1.mjs");
const result = spawnSync(process.execPath, [runnerPath,
  "--contract-check",
  "--packet-path", packetPath,
  "--state-path", statePath,
  "--job-id", jobId,
], { shell: false, encoding: "utf8", timeout: 30_000 });
assert.equal(result.status, 0, result.stderr || result.stdout);
const output = JSON.parse(result.stdout);
assert.equal(output.mode, "contract_check_no_browser");
assert.equal(output.submissionCount, 0);
assert.equal(output.creditsSpent, 0);
assert.equal(output.browserImported, false);

const wrongCreditsJob = structuredClone(job);
wrongCreditsJob.providerTarget.expectedCreditsPerGeneration = 200;
fs.writeFileSync(packetPath, `${JSON.stringify({
  schemaVersion: "money_shorts_flow_motion_approval_packet_v1",
  job: wrongCreditsJob,
  statePath,
  status: "generating",
  noSubmitBoundary,
}, null, 2)}\n`);
fs.writeFileSync(statePath, `${JSON.stringify({
  schemaVersion: "money_shorts_flow_motion_state_v1",
  topicId: wrongCreditsJob.topicId,
  productionPartId: wrongCreditsJob.productionPartId,
  scriptFingerprint: "runner-contract-fingerprint",
  statePath,
  generatedAt: new Date().toISOString(),
  overallStatus: "generating",
  requiredSceneCount: 1,
  renderReadyCount: 0,
  jobs: [wrongCreditsJob],
  noSubmitBoundary,
}, null, 2)}\n`);
const wrongCreditsResult = spawnSync(process.execPath, [runnerPath,
  "--contract-check",
  "--packet-path", packetPath,
  "--state-path", statePath,
  "--job-id", jobId,
], { shell: false, encoding: "utf8", timeout: 30_000 });
assert.equal(wrongCreditsResult.status, 2);
assert.match(wrongCreditsResult.stderr, /expected_credits_mismatch/);

const source = fs.readFileSync(runnerPath, "utf8");
const confirmationDomSource = fs.readFileSync(path.join(process.cwd(), "scripts", "_flow-motion-confirmation-dom.mjs"), "utf8");
const approvalSelectionSource = fs.readFileSync(path.join(process.cwd(), "scripts", "_flow-motion-approval-selection.mjs"), "utf8");
const resultBindingSource = fs.readFileSync(path.join(process.cwd(), "scripts", "_flow-motion-result-binding.mjs"), "utf8");
const postMakeOutcomeSource = fs.readFileSync(path.join(process.cwd(), "scripts", "_flow-motion-post-make-outcome.mjs"), "utf8");
assert.match(source, /ALLOW_FLOW_MOTION_GENERATION/);
assert.match(source, /ownerApproval !== job\?\.approval\?\.requiredWording/);
assert.match(source, /required_generation_confirmation_dialog_missing/);
assert.match(source, /generation_cost_or_output_facts_unconfirmed/);
assert.match(source, /quota_exhausted_after_submission_no_fallback/);
assert.match(source, /initialVideoEditHrefs/);
assert.match(source, /ffprobe/);
assert.match(source, /function stripProviderAudio/);
assert.match(source, /"-map", "0:v:0", "-c:v", "copy", "-an"/);
assert.match(source, /flow-motion-provider-original/);
assert.match(source, /providerAudioRemoved/);
assert.match(source, /outputProbe\.audioStreamCount !== 0/);
assert.match(source, /recovered_prior_upload/);
assert.match(source, /uploaded_hash_alias/);
assert.match(source, /waitForUploadedReferenceDialog/);
assert.match(source, /60_000/);
assert.match(source, /const assetPicker = await waitForFirstVisible/);
assert.match(source, /add_2\\s\*\(\?:만들기\|Create\)/);
assert.match(source, /mediaUniqueSourceCount/);
assert.match(source, /reference_media_option_not_selected/);
assert.match(source, /reference_media_selection_count_invalid/);
assert.match(source, /role=\"option\".*:has\(img\[alt=/);
assert.match(source, /aria-selected=\"true\"/);
assert.match(source, /prompt_composer_not_empty_before_reference/);
assert.doesNotMatch(source, /baselineComposer\.promptText\s*\|\|/);
assert.match(source, /classifyComposerReferenceIdentity/);
assert.match(source, /mediaOption\.click\(\{ force: true, timeout: 5_000 \}\)/);
assert.match(source, /!addToPrompt \|\| !\(await addToPrompt\.isEnabled/);
assert.match(source, /미디어 업로드\|Upload media\|프롬프트에 추가\|Add to prompt/);
assert.match(source, /closeStaleAgentPanel/);
assert.match(source, /ensureAgentPanelOpen/);
assert.match(source, /flow_agent_panel_not_open/);
assert.match(source, /collectGenerationConfirmationCandidates/);
assert.match(source, /captureGenerationConfirmationBaseline/);
assert.match(source, /baselineSnapshot\.approvalElementCount/);
assert.match(postMakeOutcomeSource, /A unique attempt-marker result is stronger evidence/);
assert.doesNotMatch(source, /waitForRequiredGenerationConfirmation\(page, job, baseline\.approvalElementCount\)/);
assert.match(confirmationDomSource, /generation_make_button_unavailable_in_current_composer/);
assert.match(postMakeOutcomeSource, /options\.timeoutMs \?\? 600_000/);
assert.match(confirmationDomSource, /confirmation_already_acknowledged_no_resubmit/);
assert.match(confirmationDomSource, /findCurrentComposerMakeButton/);
assert.match(confirmationDomSource, /clickCurrentComposerMakeAtomic/);
assert.match(confirmationDomSource, /composer_make_dom_capture_click_event/);
assert.match(confirmationDomSource, /clickRequiredGenerationConfirmationAtomic/);
assert.match(confirmationDomSource, /dom_capture_click_event/);
assert.match(confirmationDomSource, /handle\.click\(\{ trial: true/);
assert.match(confirmationDomSource, /handle\.click\(\{ noWaitAfter: true/);
assert.doesNotMatch(confirmationDomSource, /approvalOptions\.nth\(selected\.index\)/);
assert.match(approvalSelectionSource, /active_approval_card_ambiguous/);
assert.doesNotMatch(source, /isApprovalAcknowledged/);
assert.doesNotMatch(source, /approvalAcknowledgementCount/);
assert.doesNotMatch(source, /confirmation_click_not_acknowledged/);
assert.match(source, /recordApprovalClickDispatched/);
assert.match(confirmationDomSource, /clickDispatched: true/);
assert.match(source, /expected_credits_mismatch/);
assert.match(source, /pageOpenedByRunner/);
assert.match(source, /page && pageOpenedByRunner/);
assert.match(source, /isExactGeminiFlowProjectRootUrl/);
assert.match(source, /new dedicated project-root page/);
assert.match(source, /recordApprovalClickIntentArmed/);
assert.match(source, /recordMakeClickIntentArmed/);
assert.match(source, /recordMakeClickDispatched/);
assert.match(source, /MAKE_CLICK_OUTCOME_UNKNOWN/);
assert.doesNotMatch(source, /required_credit_confirmation_absent/);
assert.doesNotMatch(source, /new_flow_edit_result_after_make_without_confirmation/);
assert.doesNotMatch(source, /recordMakeClickAutoSubmitted/);
assert.match(source, /waitForPostMakeOutcome/);
assert.match(source, /exact_attempt_result_after_make_no_confirmation/);
assert.match(source, /capturePostMakeFailureEvidence/);
assert.match(postMakeOutcomeSource, /post-make-evidence-/);
assert.match(source, /APPROVAL_CLICK_OUTCOME_UNKNOWN/);
assert.match(source, /prior_approval_click_outcome_requires_manual_review/);
assert.match(source, /approvalClickAttemptCount/);
const armedCallbackIndex = confirmationDomSource.indexOf("callbacks.onClickArmed");
const exactHandleClickIndex = confirmationDomSource.indexOf("await handle.click({ noWaitAfter: true");
assert.ok(armedCallbackIndex >= 0 && exactHandleClickIndex > armedCallbackIndex);
assert.match(source, /SUBMITTED_PENDING_RESULT/);
assert.match(source, /SUBMITTED_RESULT_RECOVERY_REQUIRED/);
assert.match(source, /resumeSubmittedResult/);
assert.match(source, /function isAttemptId\(value\)/);
assert.match(source, /4\[a-f0-9\]\{3\}-\[89ab\]\[a-f0-9\]\{3\}/);
assert.match(source, /const attemptId = resumeExistingResult \? priorSummary\.attemptId : randomUUID\(\)/);
assert.match(source, /--recover-existing-only/);
assert.match(source, /recovery_only_requires_existing_attempt/);
assert.match(source, /existing_attempt_requires_recovery_only/);
assert.match(source, /const resumeExistingResult = recoverExistingOnly && \(resumeSubmittedResult \|\| reconcileUncertainResult\)/);
assert.match(source, /if \(recoverExistingOnly && !resumeSubmittedResult && !reconcileUncertainResult\)/);
assert.match(source, /const finalizeExistingOutput = resumeSubmittedResult &&/);
assert.match(source, /priorSummary\?\.resultBinding != null &&/);
assert.match(source, /fs\.existsSync\(contract\.expectedVideoPath\)/);
const existingOutputFinalizeIndex = source.indexOf("if (finalizeExistingOutput)");
const playwrightImportIndex = source.indexOf('const { chromium } = await import("playwright")');
assert.ok(existingOutputFinalizeIndex >= 0 && playwrightImportIndex > existingOutputFinalizeIndex);
const existingOutputFinalizeSource = source.slice(existingOutputFinalizeIndex, playwrightImportIndex);
assert.match(existingOutputFinalizeSource, /probeVideo\(contract\.expectedVideoPath\)/);
assert.match(existingOutputFinalizeSource, /existingProbe\.audioStreamCount !== 0/);
assert.match(existingOutputFinalizeSource, /existing_output_audio_not_stripped/);
assert.match(existingOutputFinalizeSource, /summary = generationSummary\("OWNER_QA_REQUIRED"/);
assert.match(existingOutputFinalizeSource, /outputVideoSha256: sha256\(fs\.readFileSync\(contract\.expectedVideoPath\)\)/);
assert.match(existingOutputFinalizeSource, /recoveredExistingOutput: true/);
assert.doesNotMatch(existingOutputFinalizeSource, /import\("playwright"\)|ensureChrome|connectOverCDP|newPage\(/);
assert.match(source, /reconcile_uncertain_result/);
assert.match(source, /exact_attempt_result_recovered_after_uncertain_click/);
assert.match(source, /FLOW_ATTEMPT_ID_\$\{attemptId\}/);
assert.match(source, /Automation metadata only; do not depict, speak, caption, or render this identifier/);
assert.match(source, /providerPromptMarker: providerPrompt\.marker/);
assert.match(source, /providerPromptSha256/);
assert.match(source, /semanticPromptSha256: contract\.job\.promptSha256/);
assert.match(source, /const safeNewAttempt = priorSummaryClassification\.action === "safe_new_attempt"/);
assert.match(source, /makeClickAttemptCount = safeNewAttempt \? 0/);
assert.doesNotMatch(source, /pendingConfirmation/);
assert.match(source, /generated_video_prompt_mismatch/);
assert.match(source, /waitForExactFlowResultBinding/);
assert.match(source, /inspectExactAttemptMarkerResultCandidates/);
assert.match(resultBindingSource, /maxNewCandidates \?\? 4/);
assert.match(resultBindingSource, /flow_result_marker_probe_candidate_limit/);
assert.match(resultBindingSource, /exact_attempt_edit_page_probe/);
assert.match(source, /selectExactNewFlowResult/);
assert.match(source, /flow_result_binding_ambiguous/);
assert.match(source, /flow_result_binding_timeout_no_search/);
assert.doesNotMatch(source, /findPromptBoundGeneratedVideoEditUrl/);
assert.doesNotMatch(source, /GENERATED_RESULT_CANDIDATE_LIMIT/);
assert.doesNotMatch(source, /for \(const editUrl of/);
assert.match(source, /Exactly one job-bound URL is selected before this single navigation/);
assert.match(resultBindingSource, /baseline\.has\(parsed\.editUrl\)/);
assert.match(resultBindingSource, /bindings\.length > 1/);
const resultBindingRecorder = source.slice(
  source.indexOf("function recordResultBinding"),
  source.indexOf("try {", source.indexOf("function recordResultBinding")),
);
assert.match(resultBindingRecorder, /attemptId/);
assert.match(resultBindingRecorder, /jobId/);
assert.match(resultBindingRecorder, /referenceSha256/);
assert.match(resultBindingRecorder, /promptSha256/);
assert.match(resultBindingRecorder, /providerPromptSha256/);
assert.match(source, /priorSummary\.resultBinding\.attemptId === priorSummary\.attemptId/);
assert.match(source, /priorSummary\.resultBinding\.jobId === jobId/);
assert.match(source, /priorSummary\.resultBinding\.referenceSha256 === contract\.job\.referenceSha256/);
assert.match(source, /priorSummary\.resultBinding\.promptSha256 === contract\.job\.promptSha256/);
assert.match(source, /priorSummary\.resultBinding\.providerPromptSha256 === priorSummary\.providerPromptSha256/);
assert.match(source, /function writeJsonAtomic\(filePath, value, token\)/);
assert.match(source, /fs\.openSync\(tempPath, "wx"\)/);
assert.match(source, /fs\.fsyncSync\(descriptor\)/);
assert.match(source, /fs\.renameSync\(tempPath, filePath\)/);
assert.doesNotMatch(source, /fs\.writeFileSync\(summaryPath/);
assert.match(source, /writeJsonAtomic\(summaryPath, generationSummary\(status, overrides\), attemptId\)/);
assert.match(source, /writeJsonAtomic\(summaryPath, summary, attemptId\)/);
assert.match(source, /waitForGeneratedVideoPageEvidence/);
assert.match(source, /acquireFlowMotionExecutionLock/);
assert.ok(source.indexOf("await acquireFlowMotionExecutionLock") < source.indexOf("const priorSummary ="));
assert.ok(source.lastIndexOf("writeJsonAtomic(summaryPath, summary, attemptId)") < source.lastIndexOf("await executionLock.release()"));
assert.match(source, /new dedicated project-root page/);
assert.doesNotMatch(source, /recovered_pending_confirmation/);
assert.match(source, /prior_submission_requires_new_owner_approval/);
assert.match(source, /classifyVeoBody, ensureChrome, isCDPOpen/);
assert.match(source, /await ensureChrome\(profile\.cdpPort, profile\.userDataDir/);
assert.ok(source.indexOf("if (!live)") < source.indexOf("await ensureChrome"));
assert.doesNotMatch(source, /--remote-debugging-port/);

console.log("Flow motion runner contract: PASS");
