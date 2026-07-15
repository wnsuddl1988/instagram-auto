#!/usr/bin/env node

import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = "C:/tmp/money-shorts-os/flow-motion-runner-contract-check-v1";
const jobRoot = path.join(root, "scene-02");
const referenceFile = path.join(jobRoot, "reference.png");
const packetPath = path.join(jobRoot, "approval-packet.json");
const statePath = path.join(root, "flow-motion-state.json");
const expectedVideoPath = path.join(jobRoot, "flow-motion-raw.mp4");
const qaEvidencePath = path.join(jobRoot, "qa-evidence.json");
const jobId = "runner-contract-topic-single-scene-02";
const prompt = "Animate one bright warm Korean adult scene with true restrained articulated hand motion; camera-only motion is insufficient.";
const sha256 = (value) => createHash("sha256").update(value).digest("hex");

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

const source = fs.readFileSync(runnerPath, "utf8");
assert.match(source, /ALLOW_FLOW_MOTION_GENERATION/);
assert.match(source, /ownerApproval !== job\?\.approval\?\.requiredWording/);
assert.match(source, /required_generation_confirmation_dialog_missing/);
assert.match(source, /generation_credit_cost_unconfirmed/);
assert.match(source, /quota_exhausted_after_submission_no_fallback/);
assert.match(source, /initialVideoEditHrefs/);
assert.match(source, /ffprobe/);
assert.match(source, /recovered_prior_upload/);
assert.match(source, /uploaded_hash_alias/);
assert.match(source, /mediaUniqueSourceCount/);
assert.match(source, /reference_media_option_not_selected/);
assert.match(source, /role=\"option\".*:has\(img\[alt=/);
assert.match(source, /aria-selected=\"true\"/);
assert.match(source, /mediaOption\.click\(\{ force: true, timeout: 5_000 \}\)/);
assert.match(source, /!addToPrompt \|\| !\(await addToPrompt\.isEnabled/);
assert.match(source, /미디어 업로드\|Upload media\|프롬프트에 추가\|Add to prompt/);
assert.match(source, /closeStaleAgentPanel/);
assert.match(source, /generation_make_button_unavailable/);
assert.match(source, /confirmation_approve_option_missing/);
assert.match(source, /120_000/);
assert.match(source, /confirmation_already_acknowledged_no_resubmit/);
assert.match(source, /selectCurrentApprovalCandidate/);
assert.match(source, /isApprovalAcknowledged/);
assert.match(source, /confirmation_click_not_acknowledged/);
assert.match(source, /SUBMITTED_PENDING_RESULT/);
assert.match(source, /SUBMITTED_RESULT_RECOVERY_REQUIRED/);
assert.match(source, /resumeSubmittedResult/);
assert.match(source, /!resumeSubmittedResult && !pendingConfirmation/);
assert.match(source, /generated_video_prompt_mismatch/);
assert.match(source, /prior_submission_requires_new_owner_approval/);
assert.doesNotMatch(source, /ensureChrome|--remote-debugging-port/);

console.log("Flow motion runner: 30/30 PASS");
