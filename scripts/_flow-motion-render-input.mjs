import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export const FLOW_MOTION_STATE_CONTRACT_VERSION = "money_shorts_flow_motion_state_v1";
export const FLOW_MOTION_JOB_CONTRACT_VERSION = "money_shorts_flow_motion_job_v1";
export const FLOW_MOTION_QA_EVIDENCE_CONTRACT_VERSION = "money_shorts_flow_motion_qa_evidence_v1";
export const FLOW_MOTION_RENDER_AUDIT_VERSION = "money_shorts_flow_motion_render_audit_v1";
export const HYBRID_MOTION_RENDERER_VERSION = "money_shorts_hybrid_motion_renderer_v1";
export const VEO_SCENE_SELECTION_CONTRACT_VERSION = "money_shorts_veo_scene_selection_v1";

const MEDIA_ROOT_RE = /^C:[\\/]+tmp[\\/]+money-shorts-os[\\/]+/i;
const SHA256_RE = /^[a-f0-9]{64}$/;
const REQUIRED_QA_CHECKS = [
  "trueArticulatedMotion",
  "cameraOnlyMotionRejected",
  "identityContinuity",
  "sceneContinuity",
  "brightWarmNonPhotoreal3D",
  "forbiddenDarkFinanceImageryAbsent",
  "technicalArtifactsAbsent",
];

function fail(code, note) {
  return { ok: false, code, note };
}

function sha256File(filePath) {
  return createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function isInside(root, target) {
  const relativePath = path.relative(path.resolve(root), path.resolve(target));
  return relativePath !== "" && !relativePath.startsWith("..") && !path.isAbsolute(relativePath);
}

function isPortraitNineBySixteen(width, height) {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width < 540 || height < 960 || height <= width) return false;
  return Math.abs(width / height - 9 / 16) <= 0.02;
}

function expectedRootTopicId(record) {
  return record?.production?.rootTopicId ?? record?.topicId ?? null;
}

function expectedProductionPartId(record) {
  return record?.production?.partId ?? "single";
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

/** Veo 입력을 TTS 장면 길이에 맞춘다. 짧으면 마지막 프레임을 유지하고, 길면 자른다. */
export function buildVeoMotionSegmentFilter(durationSec) {
  const duration = Math.max(1, Number(durationSec)).toFixed(3);
  return [
    "[0:v]fps=30",
    "scale=1080:1920:force_original_aspect_ratio=increase",
    "crop=1080:1920",
    "setsar=1",
    `trim=start=0:duration=${duration}`,
    "setpts=PTS-STARTPTS",
    `tpad=stop_mode=clone:stop_duration=${duration}`,
    `trim=duration=${duration}`,
    "format=yuv420p[motionout]",
  ].join(",");
}

/**
 * 확정 대본의 mediaStrategy와 Flow 상태·클립·Owner QA 증거를 하나의 렌더 입력으로 결합한다.
 * 외부 실행은 없으며, 현재 파일의 SHA-256과 ffprobe 결과가 모두 일치해야 Veo 장면을 반환한다.
 */
export function resolveFlowMotionRenderInputs({ record, imagesDir, statePath, probeVideo }) {
  const scenes = Array.isArray(record?.script?.scenes) ? record.script.scenes : [];
  if (scenes.length === 0) return fail("FLOW_MOTION_SCRIPT_SCENES_INVALID", "확정 대본 장면을 찾지 못했습니다.");
  const resolvedImagesDir = path.resolve(imagesDir);
  const resolvedStatePath = path.resolve(statePath);
  if (!MEDIA_ROOT_RE.test(`${resolvedImagesDir}${path.sep}`) || !MEDIA_ROOT_RE.test(`${resolvedStatePath}${path.sep}`)) {
    return fail("FLOW_MOTION_PATH_FORBIDDEN", "Flow 입력은 C:\\tmp\\money-shorts-os 아래에 있어야 합니다.");
  }

  const scriptedVeoScenes = scenes
    .map((scene, index) => ({ scene, sceneNumber: index + 1 }))
    .filter(({ scene }) => scene?.mediaStrategy === "veo_motion");
  const imageSummary = readJson(path.join(resolvedImagesDir, "scene-images-summary.json"));
  const imageSceneRows = Array.isArray(imageSummary?.scenes) ? imageSummary.scenes : [];
  if (scriptedVeoScenes.some(({ sceneNumber }) => {
    const presenceMode = imageSceneRows.find((row) => row?.sceneIndex === sceneNumber)?.presenceMode;
    return presenceMode !== "character" && presenceMode !== "hands" && presenceMode !== "none";
  })) {
    return fail("FLOW_MOTION_IMAGE_PRESENCE_INVALID", "Veo 후보 장면의 이미지 인물·손 존재 계약을 확인하지 못했습니다.");
  }
  const selectedScenes = scriptedVeoScenes.filter(({ sceneNumber }) =>
    imageSceneRows.find((row) => row?.sceneIndex === sceneNumber)?.presenceMode !== "none"
  );
  const excludedObjectOnlySceneNumbers = scriptedVeoScenes
    .filter(({ sceneNumber }) => imageSceneRows.find((row) => row?.sceneIndex === sceneNumber)?.presenceMode === "none")
    .map(({ sceneNumber }) => sceneNumber);
  const baseAssets = scenes.map((_, index) => ({
    sceneNumber: index + 1,
    source: "layered_still",
    inputPath: path.join(resolvedImagesDir, `scene-${String(index + 1).padStart(2, "0")}.png`),
  }));

  if (selectedScenes.length === 0) {
    return {
      ok: true,
      assets: baseAssets,
      audit: {
        version: FLOW_MOTION_RENDER_AUDIT_VERSION,
        requiredSceneNumbers: [],
        requiredSceneCount: 0,
        renderReadySceneCount: 0,
        ownerQaEvidenceCount: 0,
        videoHashCoveragePass: true,
        portraitVideoCoveragePass: true,
        ownerQaCoveragePass: true,
        noVeoMotionRequired: true,
        excludedObjectOnlySceneNumbers,
        passed: true,
      },
    };
  }

  if (selectedScenes.some(({ scene }) => scene?.mediaStrategyContractVersion !== VEO_SCENE_SELECTION_CONTRACT_VERSION)) {
    return fail("FLOW_MOTION_SELECTION_CONTRACT_INVALID", "Veo 장면 선택 계약이 현재 버전과 일치하지 않습니다.");
  }
  if (!fs.existsSync(resolvedStatePath)) {
    return fail("FLOW_MOTION_STATE_REQUIRED", "선정된 Veo 장면의 상태 파일이 없습니다. Flow 모션 준비와 검수를 먼저 완료해 주세요.");
  }
  const state = readJson(resolvedStatePath);
  const expectedTopicId = expectedRootTopicId(record);
  const expectedPartId = expectedProductionPartId(record);
  if (
    !state ||
    state.schemaVersion !== FLOW_MOTION_STATE_CONTRACT_VERSION ||
    state.topicId !== expectedTopicId ||
    state.productionPartId !== expectedPartId ||
    state.scriptFingerprint !== record.localFingerprint ||
    path.resolve(state.statePath ?? "") !== resolvedStatePath ||
    state.overallStatus !== "render_ready" ||
    state.requiredSceneCount !== selectedScenes.length ||
    state.renderReadyCount !== selectedScenes.length ||
    !Array.isArray(state.jobs) ||
    state.jobs.length !== selectedScenes.length
  ) {
    return fail("FLOW_MOTION_STATE_NOT_RENDER_READY", "현재 대본과 일치하는 render_ready Flow 상태가 필요합니다.");
  }

  const stateDir = path.dirname(resolvedStatePath);
  const jobsByScene = new Map();
  for (const job of state.jobs) {
    if (!Number.isInteger(job?.sceneNumber) || jobsByScene.has(job.sceneNumber)) {
      return fail("FLOW_MOTION_JOB_DUPLICATE", "Flow 장면 번호가 중복되거나 잘못됐습니다.");
    }
    jobsByScene.set(job.sceneNumber, job);
  }

  const assets = [...baseAssets];
  const evidenceIds = [];
  for (const { scene, sceneNumber } of selectedScenes) {
    const job = jobsByScene.get(sceneNumber);
    const expectedReferencePath = path.join(resolvedImagesDir, `scene-${String(sceneNumber).padStart(2, "0")}.png`);
    if (
      !job ||
      job.contractVersion !== FLOW_MOTION_JOB_CONTRACT_VERSION ||
      job.sceneId !== scene.id ||
      job.status !== "render_ready" ||
      job.topicId !== expectedTopicId ||
      job.productionPartId !== expectedPartId ||
      path.resolve(job.referenceFile ?? "") !== path.resolve(expectedReferencePath) ||
      !SHA256_RE.test(job.referenceSha256 ?? "") ||
      !SHA256_RE.test(job.promptSha256 ?? "") ||
      createHash("sha256").update(String(job.prompt ?? "")).digest("hex") !== job.promptSha256 ||
      job.providerTarget?.provider !== "Google Flow" ||
      job.providerTarget?.primaryProfile !== "Gemini 2" ||
      !Array.isArray(job.providerTarget?.fallbackProfiles) ||
      job.providerTarget.fallbackProfiles.join("|") !== "Gemini 3|Gemini 4" ||
      job.providerTarget?.fallbackCondition !== "explicit_quota_exhausted_only" ||
      job.providerTarget?.videoModel !== "Veo 3.1 - Fast" ||
      job.providerTarget?.aspectRatio !== "9:16" ||
      job.providerTarget?.outputCount !== 1 ||
      job.approval?.required !== true ||
      typeof job.approval?.ownerApprovalId !== "string" ||
      job.approval.ownerApprovalId.trim() === "" ||
      typeof job.approval?.approvedAt !== "string" ||
      job.approval.approvedAt.trim() === "" ||
      !String(job.approval?.requiredWording ?? "").includes(job.referenceSha256) ||
      !String(job.approval?.requiredWording ?? "").includes(job.promptSha256) ||
      !String(job.approval?.requiredWording ?? "").includes(job.jobId) ||
      !String(job.approval?.requiredWording ?? "").includes("Gemini 2 Flow") ||
      !String(job.approval?.requiredWording ?? "").includes("quota_exhausted")
    ) {
      return fail("FLOW_MOTION_JOB_NOT_RENDER_READY", `장면 ${sceneNumber}의 승인·제공자·해시 계약이 일치하지 않습니다.`);
    }
    if (!fs.existsSync(expectedReferencePath) || sha256File(expectedReferencePath) !== job.referenceSha256) {
      return fail("FLOW_MOTION_REFERENCE_HASH_MISMATCH", `장면 ${sceneNumber}의 기준 이미지가 승인 패킷 이후 변경됐습니다.`);
    }

    const videoPath = path.resolve(job.expectedVideoPath ?? "");
    const evidencePath = path.resolve(job.qaEvidencePath ?? "");
    if (!isInside(stateDir, videoPath) || !isInside(stateDir, evidencePath) || path.extname(videoPath).toLowerCase() !== ".mp4") {
      return fail("FLOW_MOTION_ASSET_PATH_FORBIDDEN", `장면 ${sceneNumber}의 영상 또는 QA 증거 경로가 Flow 작업 폴더 밖입니다.`);
    }
    if (!fs.existsSync(videoPath) || !SHA256_RE.test(job.qa?.outputVideoSha256 ?? "")) {
      return fail("FLOW_MOTION_VIDEO_REQUIRED", `장면 ${sceneNumber}의 검수 대상 Veo MP4가 없습니다.`);
    }
    const videoSha256 = sha256File(videoPath);
    if (videoSha256 !== job.qa.outputVideoSha256) {
      return fail("FLOW_MOTION_VIDEO_HASH_MISMATCH", `장면 ${sceneNumber}의 Veo MP4가 검수 이후 변경됐습니다.`);
    }
    if (!fs.existsSync(evidencePath)) {
      return fail("FLOW_MOTION_QA_EVIDENCE_REQUIRED", `장면 ${sceneNumber}의 Owner QA 증거 파일이 없습니다.`);
    }
    const evidence = readJson(evidencePath);
    if (
      !evidence ||
      evidence.schemaVersion !== FLOW_MOTION_QA_EVIDENCE_CONTRACT_VERSION ||
      evidence.evidenceId !== job.qa.evidenceId ||
      evidence.jobId !== job.jobId ||
      evidence.sceneNumber !== sceneNumber ||
      evidence.videoSha256 !== videoSha256 ||
      evidence.verdict !== "pass" ||
      evidence.reviewedBy !== "owner" ||
      typeof evidence.reviewedAt !== "string" ||
      evidence.reviewedAt.trim() === "" ||
      REQUIRED_QA_CHECKS.some((check) => evidence.checks?.[check] !== true)
    ) {
      return fail("FLOW_MOTION_QA_EVIDENCE_INVALID", `장면 ${sceneNumber}의 true-motion Owner QA 계약이 완전하지 않습니다.`);
    }

    const probe = typeof probeVideo === "function" ? probeVideo(videoPath) : null;
    if (
      !probe ||
      probe.hasVideoStream !== true ||
      !Number.isFinite(probe.durationSec) ||
      probe.durationSec < 1 ||
      probe.durationSec > 20 ||
      !isPortraitNineBySixteen(probe.width, probe.height)
    ) {
      return fail("FLOW_MOTION_VIDEO_PROBE_INVALID", `장면 ${sceneNumber}의 Veo MP4가 세로형 영상 계약을 통과하지 못했습니다.`);
    }
    evidenceIds.push(evidence.evidenceId);
    assets[sceneNumber - 1] = {
      sceneNumber,
      source: "veo_motion",
      inputPath: videoPath,
      inputVideoSha256: videoSha256,
      inputDurationSec: probe.durationSec,
      qaEvidenceId: evidence.evidenceId,
      trueArticulatedMotion: true,
    };
  }

  const requiredSceneNumbers = selectedScenes.map(({ sceneNumber }) => sceneNumber);
  return {
    ok: true,
    assets,
    audit: {
      version: FLOW_MOTION_RENDER_AUDIT_VERSION,
      requiredSceneNumbers,
      requiredSceneCount: requiredSceneNumbers.length,
      renderReadySceneCount: requiredSceneNumbers.length,
      ownerQaEvidenceCount: evidenceIds.length,
      ownerQaEvidenceIds: evidenceIds,
      videoHashCoveragePass: true,
      portraitVideoCoveragePass: true,
      ownerQaCoveragePass: true,
      noVeoMotionRequired: false,
      excludedObjectOnlySceneNumbers,
      passed: true,
    },
  };
}
