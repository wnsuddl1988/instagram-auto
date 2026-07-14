import { createHash } from "node:crypto";
import { isAbsolute, join, relative, resolve } from "node:path";

import { VEO_SCENE_SELECTION_CONTRACT_VERSION, type SceneMediaStrategy } from "./veo-scene-selector";

export const FLOW_MOTION_JOB_CONTRACT_VERSION = "money_shorts_flow_motion_job_v1" as const;
export const FLOW_MOTION_STATE_CONTRACT_VERSION = "money_shorts_flow_motion_state_v1" as const;
export const FLOW_MOTION_QA_EVIDENCE_CONTRACT_VERSION = "money_shorts_flow_motion_qa_evidence_v1" as const;
export const FLOW_MOTION_RENDER_AUDIT_VERSION = "money_shorts_flow_motion_render_audit_v1" as const;

export const FLOW_MOTION_PROVIDER_TARGET = Object.freeze({
  provider: "Google Flow",
  primaryProfile: "Gemini 2",
  fallbackProfiles: ["Gemini 3", "Gemini 4"] as const,
  fallbackCondition: "explicit_quota_exhausted_only",
  projectId: "2b12c31a-4493-405b-aedf-2268abb10422",
  videoModel: "Veo 3.1 - Fast",
  aspectRatio: "9:16",
  outputCount: 1,
  expectedCreditsPerGeneration: 20,
  confirmBeforeGeneration: "always",
});

export type FlowMotionJobStatus =
  | "approval_pending"
  | "generating"
  | "qa_pass"
  | "qa_failed"
  | "render_ready";

export type FlowMotionOverallStatus =
  | "not_required"
  | "approval_pending"
  | "generating"
  | "qa_pass"
  | "qa_failed"
  | "render_ready";

export type FlowMotionSceneInput = {
  sceneNumber: number;
  sceneId: string;
  sceneLabel: string;
  narration: string;
  visualCue: string;
  visibleAction?: string;
  motionPlan?: string;
  mediaStrategy: SceneMediaStrategy;
  mediaStrategyContractVersion?: string;
  referenceFile: string;
  referenceSha256: string;
};

export type FlowMotionJob = {
  contractVersion: typeof FLOW_MOTION_JOB_CONTRACT_VERSION;
  jobId: string;
  topicId: string;
  productionPartId: string;
  sceneNumber: number;
  sceneId: string;
  sceneLabel: string;
  status: FlowMotionJobStatus;
  referenceFile: string;
  referenceSha256: string;
  prompt: string;
  promptSha256: string;
  packetPath: string;
  expectedVideoPath: string;
  qaEvidencePath: string;
  providerTarget: typeof FLOW_MOTION_PROVIDER_TARGET;
  approval: {
    required: true;
    ownerApprovalId: string | null;
    approvedAt: string | null;
    requiredWording: string;
  };
  qa: {
    outputVideoSha256: string | null;
    evidenceId: string | null;
    note: string | null;
  };
  transitionHistory: Array<{
    from: FlowMotionJobStatus | "created";
    to: FlowMotionJobStatus;
    at: string;
    evidenceId: string | null;
  }>;
  liveBoundary: {
    browserOpenedNow: false;
    referenceUploadedNow: false;
    promptTypedNow: false;
    generationSubmittedNow: false;
    creditsSpentNow: false;
    externalActionRequiresSeparateOwnerApproval: true;
  };
};

export type FlowMotionState = {
  schemaVersion: typeof FLOW_MOTION_STATE_CONTRACT_VERSION;
  topicId: string;
  productionPartId: string;
  scriptFingerprint: string;
  statePath: string;
  generatedAt: string;
  overallStatus: FlowMotionOverallStatus;
  requiredSceneCount: number;
  renderReadyCount: number;
  jobs: FlowMotionJob[];
  noSubmitBoundary: {
    externalActionPerformed: false;
    browserOpened: false;
    uploadCount: 0;
    promptSubmitCount: 0;
    generationSubmitCount: 0;
    creditsSpent: 0;
  };
};

export type FlowMotionTransition = {
  to: FlowMotionJobStatus;
  at: string;
  ownerApprovalId?: string;
  outputVideoSha256?: string;
  qaEvidenceId?: string;
  note?: string;
};

export type FlowMotionQaEvidence = {
  schemaVersion: typeof FLOW_MOTION_QA_EVIDENCE_CONTRACT_VERSION;
  evidenceId: string;
  jobId: string;
  sceneNumber: number;
  videoSha256: string;
  verdict: "pass";
  reviewedBy: "owner";
  reviewedAt: string;
  checks: {
    trueArticulatedMotion: true;
    cameraOnlyMotionRejected: true;
    identityContinuity: true;
    sceneContinuity: true;
    brightWarmNonPhotoreal3D: true;
    forbiddenDarkFinanceImageryAbsent: true;
    technicalArtifactsAbsent: true;
  };
};

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function assertSha256(value: string, code: string): void {
  if (!/^[a-f0-9]{64}$/.test(value)) throw new Error(code);
}

function assertOutputRoot(outputRoot: string): void {
  const normalized = resolve(outputRoot).replace(/\\/g, "/");
  if (!/^C:\/tmp\/money-shorts-os\//i.test(`${normalized}/`)) {
    throw new Error("flow_motion_output_root_forbidden");
  }
}

function assertInsideRoot(filePath: string, root: string): void {
  const rel = relative(resolve(root), resolve(filePath));
  if (rel.startsWith("..") || isAbsolute(rel)) throw new Error("flow_motion_path_outside_root");
}

function compact(value: string, max: number): string {
  const normalized = String(value ?? "").replace(/\s+/g, " ").trim();
  return normalized.length <= max ? normalized : `${normalized.slice(0, max).trimEnd()}...`;
}

export function buildFlowMotionPrompt(scene: FlowMotionSceneInput): string {
  return [
    "Animate the attached reference image into one original vertical 9:16 non-photoreal family-feature-quality cinematic 3D clip without copying any studio, franchise, film or known character.",
    "Treat the reference image as the exact visual source: preserve the same Korean adult identity, age, face, hairstyle, fixed wardrobe, room, props, bright warm palette, daylight direction, camera height and composition.",
    `Scene meaning: ${compact(scene.narration, 260)}.`,
    `Required visible action: ${compact(scene.visibleAction || scene.motionPlan || scene.visualCue, 360)}.`,
    `Motion direction: ${compact(scene.motionPlan || "use one restrained gaze, hand or object-state action that completes the narration's exact event", 420)}.`,
    "Use one continuous shot with no cut. Show true restrained articulated character, hand or story-object motion; camera drift, zoom, parallax, hair movement or fabric movement alone is not sufficient.",
    "Keep feet and hands physically grounded, hand-object grip plausible, shoulders relaxed and facial acting subtle. Preserve foreground, character plane and background depth without changing the authored scene.",
    "No new person, duplicate character, identity drift, wardrobe change, altered room layout, deformed hands, presenter pose, heroic stance, lunge, reach toward camera or exaggerated market reaction.",
    "No readable text, numbers, UI, logos, brands, watermark, recognizable currency, laboratory, vault, factory, machine room, black-metal architecture, dark finance imagery, gloomy grade, photography or live action.",
  ].join(" ");
}

function overallStatus(jobs: readonly FlowMotionJob[]): FlowMotionOverallStatus {
  if (jobs.length === 0) return "not_required";
  if (jobs.every((job) => job.status === "render_ready")) return "render_ready";
  if (jobs.some((job) => job.status === "qa_failed")) return "qa_failed";
  if (jobs.some((job) => job.status === "generating")) return "generating";
  if (jobs.some((job) => job.status === "qa_pass")) return "qa_pass";
  return "approval_pending";
}

function sameJobContract(left: FlowMotionJob, right: FlowMotionJob): boolean {
  return left.jobId === right.jobId &&
    left.referenceSha256 === right.referenceSha256 &&
    left.promptSha256 === right.promptSha256 &&
    left.expectedVideoPath === right.expectedVideoPath;
}

export function buildFlowMotionState(input: {
  topicId: string;
  productionPartId: string;
  scriptFingerprint: string;
  outputRoot: string;
  scenes: readonly FlowMotionSceneInput[];
  generatedAt: string;
  previous?: FlowMotionState | null;
}): FlowMotionState {
  assertOutputRoot(input.outputRoot);
  if (!input.topicId || !input.productionPartId || !input.scriptFingerprint) {
    throw new Error("flow_motion_identity_invalid");
  }
  const selectedScenes = input.scenes.filter((scene) => scene.mediaStrategy === "veo_motion");
  const duplicateSceneNumbers = selectedScenes.length !== new Set(selectedScenes.map((scene) => scene.sceneNumber)).size;
  if (duplicateSceneNumbers) throw new Error("flow_motion_scene_numbers_duplicate");

  const jobs = selectedScenes.map((scene): FlowMotionJob => {
    if (scene.mediaStrategyContractVersion !== VEO_SCENE_SELECTION_CONTRACT_VERSION) {
      throw new Error(`flow_motion_scene_selection_contract_invalid:${scene.sceneNumber}`);
    }
    assertSha256(scene.referenceSha256, `flow_motion_reference_hash_invalid:${scene.sceneNumber}`);
    const jobId = `${input.topicId}-${input.productionPartId}-scene-${String(scene.sceneNumber).padStart(2, "0")}`;
    const jobRoot = join(input.outputRoot, `scene-${String(scene.sceneNumber).padStart(2, "0")}`);
    const prompt = buildFlowMotionPrompt(scene);
    const promptSha256 = sha256(prompt);
    const packetPath = join(jobRoot, "approval-packet.json");
    const expectedVideoPath = join(jobRoot, "flow-motion-raw.mp4");
    const qaEvidencePath = join(jobRoot, "qa-evidence.json");
    for (const path of [packetPath, expectedVideoPath, qaEvidencePath]) assertInsideRoot(path, input.outputRoot);
    const requiredWording = [
      `APPROVE_FLOW_MOTION_GENERATION: ${jobId}`,
      `— reference hash ${scene.referenceSha256} 및 prompt hash ${promptSha256}로`,
      `${FLOW_MOTION_PROVIDER_TARGET.primaryProfile} Flow에서 Veo 3.1 Fast 9:16 1개 생성 전송을 승인함;`,
      "명시적 quota_exhausted일 때만 Gemini 3/4 fallback 허용",
    ].join(" ");
    const fresh: FlowMotionJob = {
      contractVersion: FLOW_MOTION_JOB_CONTRACT_VERSION,
      jobId,
      topicId: input.topicId,
      productionPartId: input.productionPartId,
      sceneNumber: scene.sceneNumber,
      sceneId: scene.sceneId,
      sceneLabel: scene.sceneLabel,
      status: "approval_pending",
      referenceFile: scene.referenceFile,
      referenceSha256: scene.referenceSha256,
      prompt,
      promptSha256,
      packetPath,
      expectedVideoPath,
      qaEvidencePath,
      providerTarget: FLOW_MOTION_PROVIDER_TARGET,
      approval: {
        required: true,
        ownerApprovalId: null,
        approvedAt: null,
        requiredWording,
      },
      qa: { outputVideoSha256: null, evidenceId: null, note: null },
      transitionHistory: [{ from: "created", to: "approval_pending", at: input.generatedAt, evidenceId: null }],
      liveBoundary: {
        browserOpenedNow: false,
        referenceUploadedNow: false,
        promptTypedNow: false,
        generationSubmittedNow: false,
        creditsSpentNow: false,
        externalActionRequiresSeparateOwnerApproval: true,
      },
    };
    const previousJob = input.previous?.scriptFingerprint === input.scriptFingerprint
      ? input.previous.jobs.find((candidate) => candidate.sceneNumber === scene.sceneNumber)
      : null;
    return previousJob && sameJobContract(previousJob, fresh)
      ? { ...fresh, status: previousJob.status, approval: previousJob.approval, qa: previousJob.qa, transitionHistory: previousJob.transitionHistory }
      : fresh;
  });
  const statePath = join(input.outputRoot, "flow-motion-state.json");
  assertInsideRoot(statePath, input.outputRoot);
  return {
    schemaVersion: FLOW_MOTION_STATE_CONTRACT_VERSION,
    topicId: input.topicId,
    productionPartId: input.productionPartId,
    scriptFingerprint: input.scriptFingerprint,
    statePath,
    generatedAt: input.generatedAt,
    overallStatus: overallStatus(jobs),
    requiredSceneCount: jobs.length,
    renderReadyCount: jobs.filter((job) => job.status === "render_ready").length,
    jobs,
    noSubmitBoundary: {
      externalActionPerformed: false,
      browserOpened: false,
      uploadCount: 0,
      promptSubmitCount: 0,
      generationSubmitCount: 0,
      creditsSpent: 0,
    },
  };
}

const ALLOWED_TRANSITIONS: Readonly<Record<FlowMotionJobStatus, readonly FlowMotionJobStatus[]>> = {
  approval_pending: ["generating"],
  generating: ["qa_pass", "qa_failed"],
  qa_pass: ["render_ready"],
  qa_failed: ["approval_pending"],
  render_ready: [],
};

export function transitionFlowMotionJob(
  state: FlowMotionState,
  jobId: string,
  transition: FlowMotionTransition,
): FlowMotionState {
  const job = state.jobs.find((candidate) => candidate.jobId === jobId);
  if (!job) throw new Error("flow_motion_job_not_found");
  if (!ALLOWED_TRANSITIONS[job.status].includes(transition.to)) {
    throw new Error(`flow_motion_transition_forbidden:${job.status}:${transition.to}`);
  }
  if (job.status === "approval_pending" && transition.to === "generating" && !transition.ownerApprovalId?.trim()) {
    throw new Error("flow_motion_owner_approval_required");
  }
  if (job.status === "generating" && transition.to === "qa_pass") {
    assertSha256(transition.outputVideoSha256 ?? "", "flow_motion_output_hash_required");
  }
  if (job.status === "qa_pass" && transition.to === "render_ready" && !transition.qaEvidenceId?.trim()) {
    throw new Error("flow_motion_qa_evidence_required");
  }
  const jobs = state.jobs.map((candidate): FlowMotionJob => {
    if (candidate.jobId !== jobId) return candidate;
    return {
      ...candidate,
      status: transition.to,
      approval: transition.ownerApprovalId
        ? { ...candidate.approval, ownerApprovalId: transition.ownerApprovalId.trim(), approvedAt: transition.at }
        : candidate.approval,
      qa: {
        outputVideoSha256: transition.outputVideoSha256 ?? candidate.qa.outputVideoSha256,
        evidenceId: transition.qaEvidenceId ?? candidate.qa.evidenceId,
        note: transition.note ?? candidate.qa.note,
      },
      transitionHistory: [
        ...candidate.transitionHistory,
        { from: candidate.status, to: transition.to, at: transition.at, evidenceId: transition.qaEvidenceId ?? transition.ownerApprovalId ?? null },
      ],
    };
  });
  return {
    ...state,
    generatedAt: transition.at,
    overallStatus: overallStatus(jobs),
    renderReadyCount: jobs.filter((candidate) => candidate.status === "render_ready").length,
    jobs,
  };
}

export function flowMotionStateIsValid(state: unknown): state is FlowMotionState {
  if (!state || typeof state !== "object") return false;
  const candidate = state as Partial<FlowMotionState>;
  if (candidate.schemaVersion !== FLOW_MOTION_STATE_CONTRACT_VERSION || !Array.isArray(candidate.jobs)) return false;
  if (candidate.requiredSceneCount !== candidate.jobs.length) return false;
  if (candidate.renderReadyCount !== candidate.jobs.filter((job) => job.status === "render_ready").length) return false;
  if (!candidate.noSubmitBoundary ||
      candidate.noSubmitBoundary.externalActionPerformed !== false ||
      candidate.noSubmitBoundary.browserOpened !== false ||
      candidate.noSubmitBoundary.uploadCount !== 0 ||
      candidate.noSubmitBoundary.promptSubmitCount !== 0 ||
      candidate.noSubmitBoundary.generationSubmitCount !== 0 ||
      candidate.noSubmitBoundary.creditsSpent !== 0) return false;
  const validStatuses: readonly FlowMotionJobStatus[] = ["approval_pending", "generating", "qa_pass", "qa_failed", "render_ready"];
  return candidate.jobs.every((job) =>
    job.contractVersion === FLOW_MOTION_JOB_CONTRACT_VERSION &&
    validStatuses.includes(job.status) &&
    /^[a-f0-9]{64}$/.test(job.referenceSha256) &&
    /^[a-f0-9]{64}$/.test(job.promptSha256) &&
    job.providerTarget?.provider === FLOW_MOTION_PROVIDER_TARGET.provider &&
    job.approval?.required === true &&
    job.liveBoundary?.externalActionRequiresSeparateOwnerApproval === true &&
    job.liveBoundary?.browserOpenedNow === false &&
    job.liveBoundary?.referenceUploadedNow === false &&
    job.liveBoundary?.promptTypedNow === false &&
    job.liveBoundary?.generationSubmittedNow === false &&
    job.liveBoundary?.creditsSpentNow === false
  );
}
