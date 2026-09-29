import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

export const FLOW_MOTION_STATE_CONTRACT_VERSION = "money_shorts_flow_motion_state_v1";
export const FLOW_MOTION_JOB_CONTRACT_VERSION = "money_shorts_flow_motion_job_v1";
export const FLOW_MOTION_QA_EVIDENCE_CONTRACT_VERSION = "money_shorts_flow_motion_qa_evidence_v1";
export const FLOW_MOTION_RENDER_AUDIT_VERSION = "money_shorts_flow_motion_render_audit_v1";
export const HYBRID_MOTION_RENDERER_VERSION = "money_shorts_hybrid_motion_renderer_v1";
export const VEO_SCENE_SELECTION_CONTRACT_VERSION = "money_shorts_veo_scene_selection_v2";
export const VEO_NATURAL_TIMELINE_ALLOCATION_VERSION = "money_shorts_veo_natural_timeline_allocation_v1";

const VEO_PREFERRED_TIMELINE_SEC = 7.5;
const STATIC_SCENE_MIN_TIMELINE_SEC = 1.8;

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
 * 음성·자막 timeline은 그대로 두고, Veo 장면의 시각 구간만 인접 정지 장면에서
 * 안전하게 빌려 원본 모션을 더 오래 보여준다. 마무리 2개 장면은 기존 음성 경계
 * 디졸브 계약을 보존하기 위해 재배분하지 않는다.
 */
export function buildNaturalVeoTimelineAllocation(audioDurations, assets) {
  const sourceDurations = Array.isArray(audioDurations)
    ? audioDurations.map((value) => Number(value))
    : [];
  const rows = Array.isArray(assets) ? assets : [];
  if (
    sourceDurations.length === 0 ||
    rows.length !== sourceDurations.length ||
    sourceDurations.some((value) => !Number.isFinite(value) || value <= 0)
  ) {
    throw new Error("veo_timeline_allocation_input_invalid");
  }
  const allocated = [...sourceDurations];
  const protectedClosingStart = Math.max(0, sourceDurations.length - 2);
  const allocations = [];

  const borrowFrom = (donorIndex, requested) => {
    if (
      donorIndex < 0 ||
      donorIndex >= protectedClosingStart ||
      rows[donorIndex]?.source === "veo_motion" ||
      requested <= 0
    ) return 0;
    const available = Math.max(0, allocated[donorIndex] - STATIC_SCENE_MIN_TIMELINE_SEC);
    const borrowed = Math.min(available, requested);
    allocated[donorIndex] -= borrowed;
    return borrowed;
  };

  for (let index = 0; index < rows.length; index += 1) {
    const asset = rows[index];
    if (asset?.source !== "veo_motion") continue;
    const inputDurationSec = Number(asset.inputDurationSec);
    const originalDurationSec = sourceDurations[index];
    const preferredDurationSec = Number.isFinite(inputDurationSec)
      ? Math.max(originalDurationSec, Math.min(inputDurationSec, VEO_PREFERRED_TIMELINE_SEC))
      : originalDurationSec;
    let remaining = Math.max(0, preferredDurationSec - allocated[index]);
    let borrowedBeforeSec = 0;
    let borrowedAfterSec = 0;

    if (index < protectedClosingStart && remaining > 0) {
      const firstHalf = remaining / 2;
      borrowedBeforeSec += borrowFrom(index - 1, firstHalf);
      borrowedAfterSec += borrowFrom(index + 1, firstHalf);
      remaining = Math.max(0, preferredDurationSec - allocated[index] - borrowedBeforeSec - borrowedAfterSec);
      if (remaining > 0) borrowedBeforeSec += borrowFrom(index - 1, remaining);
      remaining = Math.max(0, preferredDurationSec - allocated[index] - borrowedBeforeSec - borrowedAfterSec);
      if (remaining > 0) borrowedAfterSec += borrowFrom(index + 1, remaining);
    }
    allocated[index] += borrowedBeforeSec + borrowedAfterSec;
    const allocatedDurationSec = allocated[index];
    allocations.push({
      sceneNumber: index + 1,
      originalTimelineDurationSec: Number(originalDurationSec.toFixed(3)),
      inputDurationSec: Number.isFinite(inputDurationSec) ? Number(inputDurationSec.toFixed(3)) : null,
      preferredDurationSec: Number(preferredDurationSec.toFixed(3)),
      allocatedTimelineDurationSec: Number(allocatedDurationSec.toFixed(3)),
      borrowedBeforeSec: Number(borrowedBeforeSec.toFixed(3)),
      borrowedAfterSec: Number(borrowedAfterSec.toFixed(3)),
      sourceUtilizationRatio: Number.isFinite(inputDurationSec) && inputDurationSec > 0
        ? Number(Math.min(1, allocatedDurationSec / inputDurationSec).toFixed(3))
        : null,
      protectedClosingScene: index >= protectedClosingStart,
    });
  }

  const rounded = allocated.map((value) => Number(value.toFixed(3)));
  const sourceTotal = sourceDurations.reduce((sum, value) => sum + value, 0);
  const roundedTotal = rounded.reduce((sum, value) => sum + value, 0);
  const drift = Number((sourceTotal - roundedTotal).toFixed(3));
  if (drift !== 0) {
    const correctionIndex = rounded.findIndex((_, index) => rows[index]?.source !== "veo_motion");
    if (correctionIndex >= 0) rounded[correctionIndex] = Number((rounded[correctionIndex] + drift).toFixed(3));
  }
  const totalDurationPreserved =
    Math.abs(rounded.reduce((sum, value) => sum + value, 0) - sourceTotal) <= 0.002;
  const staticMinimumPreserved = rounded.every((value, index) =>
    rows[index]?.source === "veo_motion" || value + 0.001 >= STATIC_SCENE_MIN_TIMELINE_SEC);
  const sourceDurationNotExceeded = allocations.every((row) =>
    row.inputDurationSec == null || row.allocatedTimelineDurationSec <= row.inputDurationSec + 0.002);

  return {
    durations: rounded,
    audit: {
      version: VEO_NATURAL_TIMELINE_ALLOCATION_VERSION,
      applicable: allocations.length > 0,
      audioRetimed: false,
      captionsRetimed: false,
      preferredVeoDurationSec: VEO_PREFERRED_TIMELINE_SEC,
      minimumStaticSceneDurationSec: STATIC_SCENE_MIN_TIMELINE_SEC,
      protectedClosingSceneCount: Math.min(2, sourceDurations.length),
      totalDurationPreserved,
      staticMinimumPreserved,
      sourceDurationNotExceeded,
      allocations,
      passed: totalDurationPreserved && staticMinimumPreserved && sourceDurationNotExceeded,
    },
  };
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
    const imageScene = imageSceneRows.find((row) => row?.sceneIndex === sceneNumber);
    return imageScene?.presenceMode !== "character" ||
      imageScene?.visualModeId !== "VEO_FULL_CHARACTER" ||
      imageScene?.veoMotionEligibility !== "full_character";
  })) {
    return fail("FLOW_MOTION_FULL_CHARACTER_IMAGE_REQUIRED", "Veo 후보는 전신 캐릭터 기준 이미지 계약을 통과해야 합니다.");
  }
  const selectedScenes = scriptedVeoScenes;
  const excludedObjectOnlySceneNumbers = [];
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
