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
  approvalClickAttemptCount: 0,
}).action, "safe_new_attempt");
assert.equal(classifySummary({
  status: "SUBMITTED_PENDING_RESULT",
  submissionCount: 1,
  expectedCreditsSpent: 20,
  approvalClickAttemptCount: 1,
  submitEvidence: { clickDispatched: true },
}).action, "resume_submitted_result");
assertSummaryBlocked({
  status: "APPROVAL_CLICK_OUTCOME_UNKNOWN",
  submissionCount: 0,
  expectedCreditsSpent: null,
  approvalClickAttemptCount: 1,
}, /manual_review/);
assertSummaryBlocked({
  status: "SUBMITTED_PENDING_RESULT",
  submissionCount: 0,
  expectedCreditsSpent: 0,
  approvalClickAttemptCount: 0,
}, /zero_submission_status_invalid/);
assertSummaryBlocked({
  status: "FAILED_NO_AUTOMATIC_RETRY",
  submissionCount: 0,
  expectedCreditsSpent: 0,
  approvalClickAttemptCount: 0,
  submitEvidence: { clickDispatched: true },
}, /dispatch_count_mismatch/);
assertSummaryBlocked({
  status: "FAILED_NO_AUTOMATIC_RETRY",
  submissionCount: 0,
  expectedCreditsSpent: 0,
  approvalClickAttemptCount: 1,
}, /manual_review/);
assertSummaryBlocked({
  status: "FAILED_NO_AUTOMATIC_RETRY",
  submissionCount: 0,
  expectedCreditsSpent: 0,
  approvalClickAttemptCount: 0,
  approvalClickIntent: { clickIntentArmed: true },
}, /intent_attempt_mismatch/);
for (const invalidCount of ["0", -1, 0.5, 2, Number.NaN]) {
  assertSummaryBlocked({
    status: "FAILED_NO_AUTOMATIC_RETRY",
    submissionCount: invalidCount,
    expectedCreditsSpent: 0,
    approvalClickAttemptCount: 0,
  }, /submission_count_invalid/);
}
for (const invalidAttempt of ["0", -1, 0.5, 2, Number.NaN]) {
  assertSummaryBlocked({
    status: "FAILED_NO_AUTOMATIC_RETRY",
    submissionCount: 0,
    expectedCreditsSpent: 0,
    approvalClickAttemptCount: invalidAttempt,
  }, /approval_click_attempt_count_invalid/);
}
assertSummaryBlocked({
  status: "SUBMITTED_PENDING_RESULT",
  submissionCount: 1,
  expectedCreditsSpent: 0,
  approvalClickAttemptCount: 1,
}, /credit_mismatch/);

const root = `C:/tmp/money-shorts-os/flow-motion-runner-contract-check-v1-${process.pid}`;
const jobRoot = path.join(root, "scene-02");
const referenceFile = path.join(jobRoot, "reference.png");
const packetPath = path.join(jobRoot, "approval-packet.json");
const statePath = path.join(root, "flow-motion-state.json");
const expectedVideoPath = path.join(jobRoot, "flow-motion-raw.mp4");
const qaEvidencePath = path.join(jobRoot, "qa-evidence.json");
const jobId = "runner-contract-topic-single-scene-02";
const prompt = "Animate one bright warm Korean adult scene with true restrained articulated hand motion; camera-only motion is insufficient.";
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

assert.equal(isExactGeminiFlowProjectRootUrl(GEMINI_FLOW_TARGET.projectUrl), true);
assert.equal(isExactGeminiFlowProjectRootUrl(`${GEMINI_FLOW_TARGET.projectUrl}/`), true);
assert.equal(isExactGeminiFlowProjectRootUrl(`${GEMINI_FLOW_TARGET.projectUrl}?tab=media`), true);
assert.equal(isExactGeminiFlowProjectRootUrl(`${GEMINI_FLOW_TARGET.projectUrl}/edit/result-id`), false);
assert.equal(isExactGeminiFlowProjectRootUrl("https://example.com/fx/ko/tools/flow/project/2b12c31a-4493-405b-aedf-2268abb10422"), false);
assert.equal(isExactGeminiFlowProjectRootUrl(`https://labs.google/extra${new URL(GEMINI_FLOW_TARGET.projectUrl).pathname}`), false);

fs.mkdirSync(jobRoot, { recursive: true });
fs.writeFileSync(referenceFile, Buffer.from("flow-motion-runner-reference-v1"));
if (fs.existsSync(expectedVideoPath)) throw new Error("contract_check_output_must_not_exist");
const referenceSha256 = sha256(fs.readFileSync(referenceFile));
const promptSha256 = sha256(prompt);
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
assert.match(source, /ALLOW_FLOW_MOTION_GENERATION/);
assert.match(source, /ownerApproval !== job\?\.approval\?\.requiredWording/);
assert.match(source, /required_generation_confirmation_dialog_missing/);
assert.match(source, /generation_cost_or_output_facts_unconfirmed/);
assert.match(source, /quota_exhausted_after_submission_no_fallback/);
assert.match(source, /initialVideoEditHrefs/);
assert.match(source, /ffprobe/);
assert.match(source, /recovered_prior_upload/);
assert.match(source, /uploaded_hash_alias/);
assert.match(source, /waitForUploadedReferenceDialog/);
assert.match(source, /60_000/);
assert.match(source, /const assetPicker = await waitForFirstVisible/);
assert.match(source, /add_2\\s\*\(\?:만들기\|Create\)/);
assert.match(source, /mediaUniqueSourceCount/);
assert.match(source, /reference_media_option_not_selected/);
assert.match(source, /role=\"option\".*:has\(img\[alt=/);
assert.match(source, /aria-selected=\"true\"/);
assert.match(source, /mediaOption\.click\(\{ force: true, timeout: 5_000 \}\)/);
assert.match(source, /!addToPrompt \|\| !\(await addToPrompt\.isEnabled/);
assert.match(source, /미디어 업로드\|Upload media\|프롬프트에 추가\|Add to prompt/);
assert.match(source, /closeStaleAgentPanel/);
assert.match(source, /ensureAgentPanelOpen/);
assert.match(source, /flow_agent_panel_not_open/);
assert.match(source, /collectGenerationConfirmationCandidates/);
assert.match(source, /baseline\.approvalElementCount/);
assert.match(source, /bind the confirmation to that exact prompt/);
assert.doesNotMatch(source, /waitForRequiredGenerationConfirmation\(page, job, baseline\.approvalElementCount\)/);
assert.match(source, /generation_make_button_unavailable_in_current_composer/);
assert.match(source, /240_000/);
assert.match(confirmationDomSource, /confirmation_already_acknowledged_no_resubmit/);
assert.match(confirmationDomSource, /findCurrentComposerMakeButton/);
assert.match(confirmationDomSource, /clickRequiredGenerationConfirmationAtomic/);
assert.match(confirmationDomSource, /dom_capture_click_event/);
assert.match(confirmationDomSource, /handle\.click\(\{ trial: true/);
assert.match(confirmationDomSource, /handle\.click\(\{ noWaitAfter: true/);
assert.doesNotMatch(confirmationDomSource, /approvalOptions\.nth\(selected\.index\)/);
assert.match(approvalSelectionSource, /active_approval_card_ambiguous/);
assert.match(source, /isApprovalAcknowledged/);
assert.match(source, /confirmation_click_not_acknowledged/);
assert.match(source, /recordApprovalClickDispatched/);
assert.match(confirmationDomSource, /clickDispatched: true/);
assert.match(source, /expected_credits_mismatch/);
assert.match(source, /pageOpenedByRunner/);
assert.match(source, /page && pageOpenedByRunner/);
assert.match(source, /isExactGeminiFlowProjectRootUrl/);
assert.match(source, /dedicated exact-root page/);
assert.match(source, /recordApprovalClickIntentArmed/);
assert.match(source, /APPROVAL_CLICK_OUTCOME_UNKNOWN/);
assert.match(source, /prior_approval_click_outcome_requires_manual_review/);
assert.match(source, /approvalClickAttemptCount/);
const armedCallbackIndex = confirmationDomSource.indexOf("callbacks.onClickArmed");
const exactHandleClickIndex = confirmationDomSource.indexOf("await handle.click({ noWaitAfter: true");
assert.ok(armedCallbackIndex >= 0 && exactHandleClickIndex > armedCallbackIndex);
assert.match(source, /SUBMITTED_PENDING_RESULT/);
assert.match(source, /SUBMITTED_RESULT_RECOVERY_REQUIRED/);
assert.match(source, /resumeSubmittedResult/);
assert.match(source, /!resumeSubmittedResult && !pendingConfirmation/);
assert.match(source, /generated_video_prompt_mismatch/);
assert.match(source, /findPromptBoundGeneratedVideoEditUrl/);
assert.match(source, /generated_video_prompt_match_ambiguous/);
assert.match(source, /GENERATED_RESULT_CANDIDATE_LIMIT\s*=\s*8/);
assert.doesNotMatch(source, /newVideoEditHrefs\.length !== 1/);
assert.match(source, /waitForGeneratedVideoPageEvidence/);
assert.match(source, /currentPageEditHref/);
assert.match(source, /prior_submission_requires_new_owner_approval/);
assert.doesNotMatch(source, /ensureChrome|--remote-debugging-port/);

console.log("Flow motion runner contract: PASS");
