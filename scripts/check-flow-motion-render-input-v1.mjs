import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  FLOW_MOTION_QA_EVIDENCE_CONTRACT_VERSION,
  FLOW_MOTION_RENDER_AUDIT_VERSION,
  HYBRID_MOTION_RENDERER_VERSION,
  buildVeoMotionSegmentFilter,
  resolveFlowMotionRenderInputs,
} from "./_flow-motion-render-input.mjs";

let passed = 0;
function check(name, fn) {
  fn();
  passed += 1;
  console.log(`PASS ${String(passed).padStart(2, "0")} ${name}`);
}

const root = "C:\\tmp\\money-shorts-os\\flow-render-input-guard-v1";
const imagesDir = path.join(root, "images");
const flowDir = path.join(root, "flow-motion-v1");
const jobDir = path.join(flowDir, "scene-02");
const statePath = path.join(flowDir, "flow-motion-state.json");
const referenceFile = path.join(imagesDir, "scene-02.png");
const videoPath = path.join(jobDir, "flow-motion-raw.mp4");
const evidencePath = path.join(jobDir, "qa-evidence.json");
for (const dir of [imagesDir, flowDir, jobDir]) mkdirSync(dir, { recursive: true });
writeFileSync(path.join(imagesDir, "scene-01.png"), "still-one-v1", "utf8");
writeFileSync(referenceFile, "reference-image-v1", "utf8");
writeFileSync(videoPath, "fake-veo-video-v1", "utf8");

const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const sha256File = (file) => sha256(readFileSync(file));
const referenceSha256 = sha256File(referenceFile);
const videoSha256 = sha256File(videoPath);
const promptSha256 = sha256("prompt-v1");
const jobId = "root-topic-single-scene-02";
const evidenceId = "owner-qa-scene-02-v1";

const record = {
  schemaVersion: "wizard_script_final_v1",
  topicId: "root-topic",
  localFingerprint: "script-fingerprint-v1",
  script: {
    scenes: [
      { id: "hook", mediaStrategy: "still", mediaStrategyContractVersion: "money_shorts_veo_scene_selection_v1" },
      { id: "habit", mediaStrategy: "veo_motion", mediaStrategyContractVersion: "money_shorts_veo_scene_selection_v1" },
    ],
  },
};

const validEvidence = () => ({
  schemaVersion: FLOW_MOTION_QA_EVIDENCE_CONTRACT_VERSION,
  evidenceId,
  jobId,
  sceneNumber: 2,
  videoSha256,
  verdict: "pass",
  reviewedBy: "owner",
  reviewedAt: "2026-07-15T02:00:00.000Z",
  checks: {
    trueArticulatedMotion: true,
    cameraOnlyMotionRejected: true,
    identityContinuity: true,
    sceneContinuity: true,
    brightWarmNonPhotoreal3D: true,
    forbiddenDarkFinanceImageryAbsent: true,
    technicalArtifactsAbsent: true,
  },
});

const validState = () => ({
  schemaVersion: "money_shorts_flow_motion_state_v1",
  topicId: "root-topic",
  productionPartId: "single",
  scriptFingerprint: record.localFingerprint,
  statePath,
  overallStatus: "render_ready",
  requiredSceneCount: 1,
  renderReadyCount: 1,
  jobs: [{
    contractVersion: "money_shorts_flow_motion_job_v1",
    jobId,
    topicId: "root-topic",
    productionPartId: "single",
    sceneNumber: 2,
    sceneId: "habit",
    status: "render_ready",
    referenceFile,
    referenceSha256,
    prompt: "prompt-v1",
    promptSha256,
    expectedVideoPath: videoPath,
    qaEvidencePath: evidencePath,
    providerTarget: {
      provider: "Google Flow",
      primaryProfile: "Gemini 2",
      fallbackProfiles: ["Gemini 3", "Gemini 4"],
      fallbackCondition: "explicit_quota_exhausted_only",
      videoModel: "Veo 3.1 - Fast",
      aspectRatio: "9:16",
      outputCount: 1,
    },
    approval: {
      required: true,
      ownerApprovalId: "owner-generation-approval-v1",
      approvedAt: "2026-07-15T01:00:00.000Z",
      requiredWording: `APPROVE_FLOW_MOTION_GENERATION: ${jobId} reference ${referenceSha256} prompt ${promptSha256} Gemini 2 Flow quota_exhausted`,
    },
    qa: { outputVideoSha256: videoSha256, evidenceId },
  }],
});

const portraitProbe = () => ({ hasVideoStream: true, width: 1080, height: 1920, durationSec: 8 });
const writeValidFixture = () => {
  writeFileSync(referenceFile, "reference-image-v1", "utf8");
  writeFileSync(videoPath, "fake-veo-video-v1", "utf8");
  writeFileSync(evidencePath, JSON.stringify(validEvidence(), null, 2), "utf8");
  writeFileSync(statePath, JSON.stringify(validState(), null, 2), "utf8");
};
writeValidFixture();

check("hybrid renderer and QA evidence contracts are versioned", () => {
  assert.equal(HYBRID_MOTION_RENDERER_VERSION, "money_shorts_hybrid_motion_renderer_v1");
  assert.equal(FLOW_MOTION_RENDER_AUDIT_VERSION, "money_shorts_flow_motion_render_audit_v1");
  assert.equal(FLOW_MOTION_QA_EVIDENCE_CONTRACT_VERSION, "money_shorts_flow_motion_qa_evidence_v1");
});

check("Veo segment filter produces an exact portrait scene segment", () => {
  const output = path.join(root, "veo-filter-smoke.mp4");
  const render = spawnSync("ffmpeg", [
    "-y",
    "-f", "lavfi",
    "-i", "color=c=0x8ab7d4:s=720x1280:r=30:d=1",
    "-filter_complex", buildVeoMotionSegmentFilter(2),
    "-map", "[motionout]",
    "-frames:v", "60",
    "-c:v", "libx264",
    "-preset", "ultrafast",
    "-an",
    output,
  ], { encoding: "utf8", shell: false, timeout: 60_000 });
  assert.equal(render.status, 0, render.stderr?.slice(-800));
  const probe = spawnSync("ffprobe", [
    "-v", "error",
    "-show_streams",
    "-show_format",
    "-of", "json",
    output,
  ], { encoding: "utf8", shell: false, timeout: 30_000 });
  assert.equal(probe.status, 0, probe.stderr?.slice(-800));
  const parsed = JSON.parse(probe.stdout);
  const video = parsed.streams.find((stream) => stream.codec_type === "video");
  assert.equal(video.width, 1080);
  assert.equal(video.height, 1920);
  assert.ok(Math.abs(Number(parsed.format.duration) - 2) <= 0.1);
});

check("a script without Veo scenes needs no Flow state", () => {
  const stillRecord = {
    ...record,
    script: { scenes: record.script.scenes.map((scene) => ({ ...scene, mediaStrategy: "still" })) },
  };
  const result = resolveFlowMotionRenderInputs({
    record: stillRecord,
    imagesDir,
    statePath: path.join(flowDir, "missing-state.json"),
    probeVideo: portraitProbe,
  });
  assert.equal(result.ok, true);
  assert.equal(result.audit.noVeoMotionRequired, true);
  assert.deepEqual(result.assets.map((asset) => asset.source), ["layered_still", "layered_still"]);
});

check("a selected Veo scene consumes the render-ready MP4", () => {
  writeValidFixture();
  const result = resolveFlowMotionRenderInputs({ record, imagesDir, statePath, probeVideo: portraitProbe });
  assert.equal(result.ok, true);
  assert.deepEqual(result.assets.map((asset) => asset.source), ["layered_still", "veo_motion"]);
  assert.equal(result.assets[1].inputPath, videoPath);
  assert.equal(result.assets[1].trueArticulatedMotion, true);
  assert.equal(result.audit.ownerQaEvidenceCount, 1);
});

check("missing state fails closed for a selected Veo scene", () => {
  const result = resolveFlowMotionRenderInputs({
    record,
    imagesDir,
    statePath: path.join(flowDir, "missing-state.json"),
    probeVideo: portraitProbe,
  });
  assert.equal(result.ok, false);
  assert.equal(result.code, "FLOW_MOTION_STATE_REQUIRED");
});

check("approval-pending state cannot enter the renderer", () => {
  const state = validState();
  state.overallStatus = "approval_pending";
  state.jobs[0].status = "approval_pending";
  writeFileSync(statePath, JSON.stringify(state, null, 2), "utf8");
  const result = resolveFlowMotionRenderInputs({ record, imagesDir, statePath, probeVideo: portraitProbe });
  assert.equal(result.ok, false);
  assert.equal(result.code, "FLOW_MOTION_STATE_NOT_RENDER_READY");
});

check("a changed prompt or provider contract invalidates render-ready state", () => {
  const state = validState();
  state.jobs[0].prompt = "tampered-prompt";
  writeFileSync(statePath, JSON.stringify(state, null, 2), "utf8");
  const result = resolveFlowMotionRenderInputs({ record, imagesDir, statePath, probeVideo: portraitProbe });
  assert.equal(result.ok, false);
  assert.equal(result.code, "FLOW_MOTION_JOB_NOT_RENDER_READY");
});

check("a changed reference image invalidates the approved packet", () => {
  writeValidFixture();
  writeFileSync(referenceFile, "tampered-reference", "utf8");
  const result = resolveFlowMotionRenderInputs({ record, imagesDir, statePath, probeVideo: portraitProbe });
  assert.equal(result.ok, false);
  assert.equal(result.code, "FLOW_MOTION_REFERENCE_HASH_MISMATCH");
});

check("a changed Veo file after QA is rejected", () => {
  writeValidFixture();
  writeFileSync(videoPath, "tampered-video", "utf8");
  const result = resolveFlowMotionRenderInputs({ record, imagesDir, statePath, probeVideo: portraitProbe });
  assert.equal(result.ok, false);
  assert.equal(result.code, "FLOW_MOTION_VIDEO_HASH_MISMATCH");
});

check("camera-only or incomplete Owner QA cannot pass", () => {
  writeValidFixture();
  const evidence = validEvidence();
  evidence.checks.cameraOnlyMotionRejected = false;
  writeFileSync(evidencePath, JSON.stringify(evidence, null, 2), "utf8");
  const result = resolveFlowMotionRenderInputs({ record, imagesDir, statePath, probeVideo: portraitProbe });
  assert.equal(result.ok, false);
  assert.equal(result.code, "FLOW_MOTION_QA_EVIDENCE_INVALID");
});

check("a landscape or invalid video stream is rejected", () => {
  writeValidFixture();
  const result = resolveFlowMotionRenderInputs({
    record,
    imagesDir,
    statePath,
    probeVideo: () => ({ hasVideoStream: true, width: 1920, height: 1080, durationSec: 8 }),
  });
  assert.equal(result.ok, false);
  assert.equal(result.code, "FLOW_MOTION_VIDEO_PROBE_INVALID");
});

check("Flow state outside the approved local media root is rejected", () => {
  const result = resolveFlowMotionRenderInputs({
    record,
    imagesDir,
    statePath: "C:\\Users\\PC\\Desktop\\flow-motion-state.json",
    probeVideo: portraitProbe,
  });
  assert.equal(result.ok, false);
  assert.equal(result.code, "FLOW_MOTION_PATH_FORBIDDEN");
});

writeValidFixture();
const runnerSource = readFileSync(new URL("./run-owner-real-video-from-wizard-assets-once.mjs", import.meta.url), "utf8");
const helperSource = readFileSync(new URL("../lib/owner-web-operator.ts", import.meta.url), "utf8");
const wizardSource = readFileSync(new URL("../components/VideoCreationWizard.tsx", import.meta.url), "utf8");
const flowStateSource = readFileSync(new URL("../lib/flow-motion-jobs.ts", import.meta.url), "utf8");

check("final renderer receives the fixed Flow state path and consumes Veo input", () => {
  assert.match(helperSource, /"--flow-motion-state",\s*flowMotionStatePath\(part\)/);
  assert.match(runnerSource, /visualAsset\?\.source === "veo_motion"/);
  assert.match(runnerSource, /"-i", visualAsset\.inputPath/);
  assert.match(runnerSource, /HYBRID_MOTION_RENDERER_VERSION/);
});

check("operator and UI fail closed until every selected scene is render-ready", () => {
  assert.match(helperSource, /flow_motion_render_ready_required:/);
  assert.match(helperSource, /partFlowMotion\.jobs\.some\(\(job\) => job\.status !== "render_ready"\)/);
  assert.match(wizardSource, /disabled=\{!runnable[^}]*!flowMotionReadyForRender\}/);
  assert.match(wizardSource, /검수 완료 Veo 모션/);
});

check("read-only UI status rechecks the current clip hash and Owner QA file", () => {
  assert.match(helperSource, /function flowMotionRenderAssetIsReady/);
  assert.match(helperSource, /videoSha256 !== job\.qa\.outputVideoSha256/);
  assert.match(helperSource, /FLOW_MOTION_QA_EVIDENCE_CONTRACT_VERSION/);
  assert.match(helperSource, /renderAssetReady: flowMotionRenderAssetIsReady\(job\)/);
  assert.match(wizardSource, /검수 파일 불일치/);
});

check("TypeScript and runtime contracts use the same QA versions", () => {
  assert.match(flowStateSource, /money_shorts_flow_motion_qa_evidence_v1/);
  assert.match(flowStateSource, /money_shorts_flow_motion_render_audit_v1/);
});

check("render-input resolver has no browser, network, upload or account action", () => {
  const source = readFileSync(new URL("./_flow-motion-render-input.mjs", import.meta.url), "utf8");
  assert.doesNotMatch(source, /playwright|puppeteer|fetch\s*\(|https?:\/\/|upload|credit|process\.env|child_process/i);
});

console.log(`\nFlow motion render input: ${passed}/${passed} PASS`);
