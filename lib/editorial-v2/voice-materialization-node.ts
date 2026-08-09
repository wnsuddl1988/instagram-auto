import { execFile as execFileCallback } from "node:child_process";
import { createHash } from "node:crypto";
import { dirname } from "node:path";
import { promisify } from "node:util";

import type {
  ApprovedRenderIntegrationSessionSnapshot,
  EditorialV2ProjectSnapshot,
} from "./contracts";
import { buildLocalPreviewRenderInput } from "./local-preview-input";
import type { LocalPreviewSceneInput } from "./local-preview-contracts";
import { hashRenderManifest } from "./render-manifest";
import type {
  AudioMaterializationPackageBoundary,
  VoiceAudioProbeSummary,
  VoiceMaterializationExecutionResult,
  VoiceMaterializationExecutionMode,
  VoiceMaterializationPlan,
  VoiceMaterializationPlanComparison,
  VoiceMaterializationPlanPreview,
  VoiceMaterializationRuntimeOptions,
  SanitizedElevenLabsProviderError,
  VoiceMaterializationSceneEntry,
  VoiceMaterializationSet,
  VoiceSceneAudioMetadata,
} from "./voice-materialization-contracts";
import {
  ELEVENLABS_OUTPUT_FORMAT,
  PA4L_AUTOMATIC_RETRY_LIMIT,
  PA4L_FALLBACK_REQUEST_LIMIT,
  PA4L_MAX_EXTERNAL_GENERATION_REQUESTS,
  PA4L_MAX_NARRATION_CHARACTERS,
  PA4L_MAX_SCENES,
  PA4L_SINGLE_SCENE_LIVE_SMOKE_MODE,
  VOICE_MATERIALIZATION_MAX_TOTAL_AUDIO_BYTES,
  VOICE_MATERIALIZATION_PROVIDER_ID,
  VOICE_MATERIALIZATION_STANDARD_EXECUTION_MODE,
  isVoiceMaterializationIdentifier,
} from "./voice-materialization-contracts";
import {
  ElevenLabsProviderHttpError,
  requestElevenLabsTimestampTts,
} from "./elevenlabs-timestamp-tts-node";
import { buildAudioAlignedSubtitleTrack, validateAudioAlignedSubtitleTrack } from "./audio-alignment";
import {
  cleanupVoiceSceneAudioWorkspace,
  commitVoiceSceneAudio,
  createVoiceSceneAudioWorkspace,
  inspectVoiceSceneCache,
  readVoiceMaterializationSet,
  readVoiceSceneAudioDescriptor,
  stageVoiceSceneAudio,
  VoiceAudioStoreError,
  writeVoiceMaterializationSet,
} from "./voice-audio-store-node";
import { buildRetryMaterializationPlan } from "./voice-materialization-recovery";
import {
  validateAlignmentAudioDuration,
  validateVoiceAudioProbe,
  validateVoiceMaterializationPlan as validatePlanContract,
  validateVoiceMaterializationSet,
} from "./voice-materialization-validation";

const execFile = promisify(execFileCallback);

export interface BuildVoiceMaterializationPlanOptions {
  readonly voiceId: string;
  readonly modelId: string;
  readonly executionMode?: VoiceMaterializationExecutionMode;
}

export interface MaterializeVoicePlanOptions extends VoiceMaterializationRuntimeOptions {
  readonly mode: "initial" | "retry";
  readonly executionMode?: VoiceMaterializationExecutionMode;
  readonly requestedSceneIds?: readonly string[];
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const record = value as Readonly<Record<string, unknown>>;
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(",")}}`;
}

function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function buildVoiceSceneAudioIdentity(input: Readonly<{
  narration: string;
  providerId: string;
  voiceId: string;
  modelId: string;
  outputFormat: string;
}>): string {
  return `tts-${sha256(stableStringify({
    narration: input.narration,
    providerId: input.providerId,
    voiceId: input.voiceId,
    modelId: input.modelId,
    outputFormat: input.outputFormat,
  }))}`;
}

function planHashInput(plan: VoiceMaterializationPlan): unknown {
  const { planHash: _planHash, ...rest } = plan;
  return rest;
}

export function hashVoiceMaterializationPlan(plan: VoiceMaterializationPlan): string {
  return sha256(stableStringify(planHashInput(clone(plan))));
}

function hasKoreanNarration(scene: LocalPreviewSceneInput): boolean {
  return /[\uAC00-\uD7A3]/u.test(scene.narration);
}

function hasNumberDateOrCurrencyEvidence(scene: LocalPreviewSceneInput): boolean {
  return scene.numberRefs.length > 0
    || scene.numbers.some((number) => number.currency !== null || Boolean(number.asOf));
}

function hasSourceEvidence(scene: LocalPreviewSceneInput): boolean {
  return scene.sourceRefs.length > 0 || scene.claimRefs.length > 0 || scene.numberRefs.length > 0;
}

export function selectPa4lSingleSmokeScene(
  scenes: readonly LocalPreviewSceneInput[],
): LocalPreviewSceneInput {
  const candidates = scenes.filter((scene) => {
    const characterCount = [...scene.narration].length;
    return scene.narration.length > 0 && characterCount <= PA4L_MAX_NARRATION_CHARACTERS;
  });
  if (candidates.length === 0) throw new Error("PA4L_SINGLE_SCENE_NOT_AVAILABLE");
  const middle = (scenes.length + 1) / 2;
  const ranked = candidates.slice().sort((left, right) => {
    const priority = [
      Number(hasKoreanNarration(right)) - Number(hasKoreanNarration(left)),
      Number([...right.narration].length >= 80) - Number([...left.narration].length >= 80),
      Number(hasNumberDateOrCurrencyEvidence(right)) - Number(hasNumberDateOrCurrencyEvidence(left)),
      Number(hasSourceEvidence(right)) - Number(hasSourceEvidence(left)),
      Math.abs(left.order - middle) - Math.abs(right.order - middle),
      left.order - right.order,
    ];
    return priority.find((value) => value !== 0) ?? left.sceneId.localeCompare(right.sceneId, "en");
  });
  return clone(ranked[0]!);
}

export function buildVoiceMaterializationPlan(
  projectSnapshot: EditorialV2ProjectSnapshot,
  options: BuildVoiceMaterializationPlanOptions,
): VoiceMaterializationPlan {
  if (!isVoiceMaterializationIdentifier(options.voiceId) || !isVoiceMaterializationIdentifier(options.modelId)) {
    throw new Error("VOICE_MATERIALIZATION_VOICE_OR_MODEL_INVALID");
  }
  const executionMode = options.executionMode ?? VOICE_MATERIALIZATION_STANDARD_EXECUTION_MODE;
  if (executionMode !== VOICE_MATERIALIZATION_STANDARD_EXECUTION_MODE
    && executionMode !== PA4L_SINGLE_SCENE_LIVE_SMOKE_MODE) {
    throw new Error("VOICE_MATERIALIZATION_EXECUTION_MODE_INVALID");
  }
  const input = buildLocalPreviewRenderInput(projectSnapshot);
  const requiredStageIds = new Set(["editorial_intelligence", "scene_planning", "render_integration"]);
  for (const stageId of requiredStageIds) {
    if (!projectSnapshot.approvedCheckpoints.some((entry) => entry.stageId === stageId)) {
      throw new Error(`VOICE_MATERIALIZATION_REQUIRED_CHECKPOINT_MISSING:${stageId}`);
    }
  }
  const renderCheckpoint = projectSnapshot.approvedCheckpoints.find((entry) => entry.stageId === "render_integration");
  if (!renderCheckpoint) throw new Error("VOICE_MATERIALIZATION_RENDER_CHECKPOINT_MISSING");
  const render = clone(renderCheckpoint.payload) as unknown as ApprovedRenderIntegrationSessionSnapshot;
  if (render.approvalState !== "approved"
    || render.validation?.valid !== true
    || render.renderManifest?.manifestHash !== hashRenderManifest(render.renderManifest)) {
    throw new Error("VOICE_MATERIALIZATION_RENDER_CHECKPOINT_INVALID");
  }
  const canonicalScenes = executionMode === PA4L_SINGLE_SCENE_LIVE_SMOKE_MODE
    ? [selectPa4lSingleSmokeScene(input.scenes)]
    : input.scenes;
  const scenes = canonicalScenes.map((scene) => {
    const characterCount = [...scene.narration].length;
    return {
      sceneId: scene.sceneId,
      sceneOrder: scene.order,
      narration: scene.narration,
      narrationHash: sha256(scene.narration),
      characterCount,
      keyCaption: scene.keyCaption,
      sceneAudioIdentity: buildVoiceSceneAudioIdentity({
        narration: scene.narration,
        providerId: VOICE_MATERIALIZATION_PROVIDER_ID,
        voiceId: options.voiceId,
        modelId: options.modelId,
        outputFormat: ELEVENLABS_OUTPUT_FORMAT,
      }),
    };
  });
  const materializationSetId = `voice-set-${sha256(stableStringify({
    projectId: projectSnapshot.projectId,
    projectRevision: projectSnapshot.revision,
    sourceRenderCheckpointHash: renderCheckpoint.payloadHash,
    renderManifestHash: render.renderManifest.manifestHash,
    providerId: VOICE_MATERIALIZATION_PROVIDER_ID,
    voiceId: options.voiceId,
    modelId: options.modelId,
    outputFormat: ELEVENLABS_OUTPUT_FORMAT,
    sceneAudioIdentities: scenes.map((scene) => scene.sceneAudioIdentity),
  }))}`;
  const base: VoiceMaterializationPlan = {
    schemaVersion: "voice-materialization-plan-v1",
    projectId: projectSnapshot.projectId,
    projectRevision: projectSnapshot.revision,
    projectIntegrityHash: projectSnapshot.integrity.canonicalHash,
    sourceRenderCheckpointHash: renderCheckpoint.payloadHash,
    renderManifestHash: render.renderManifest.manifestHash,
    providerId: VOICE_MATERIALIZATION_PROVIDER_ID,
    voiceId: options.voiceId,
    modelId: options.modelId,
    outputFormat: ELEVENLABS_OUTPUT_FORMAT,
    executionMode,
    sceneCount: scenes.length,
    plannedSceneCount: scenes.length,
    scenes,
    totalCharacters: scenes.reduce((total, scene) => total + scene.characterCount, 0),
    maximumExternalGenerationRequests: executionMode === PA4L_SINGLE_SCENE_LIVE_SMOKE_MODE
      ? PA4L_MAX_EXTERNAL_GENERATION_REQUESTS
      : scenes.length,
    automaticRetryLimit: PA4L_AUTOMATIC_RETRY_LIMIT,
    fallbackRequestLimit: PA4L_FALLBACK_REQUEST_LIMIT,
    materializationSetId,
    planHash: "0".repeat(64),
    externalCallRequired: true,
    externalCallExecuted: false,
    ownerConfirmationRequired: true,
    costAmountKnown: false,
    stopPolicy: "STOP_ON_FIRST_EXTERNAL_FAILURE",
  };
  const plan = { ...base, planHash: hashVoiceMaterializationPlan(base) };
  const issues = validatePlanContract(plan);
  if (issues.length > 0) throw new Error(`VOICE_MATERIALIZATION_PLAN_INVALID:${issues.join(",")}`);
  return clone(plan);
}

export function validateVoiceMaterializationPlan(plan: VoiceMaterializationPlan): readonly string[] {
  const issues = [...validatePlanContract(plan)];
  if (hashVoiceMaterializationPlan(plan) !== plan.planHash) issues.push("plan_hash_mismatch");
  return [...new Set(issues)];
}

export function assertPa4lSingleScenePlan(plan: VoiceMaterializationPlan): VoiceMaterializationPlan["scenes"][number] {
  const issues = validateVoiceMaterializationPlan(plan);
  if (issues.length > 0) throw new Error(`VOICE_MATERIALIZATION_PLAN_INVALID:${issues.join(",")}`);
  const scene = plan.scenes[0];
  if (plan.executionMode !== PA4L_SINGLE_SCENE_LIVE_SMOKE_MODE
    || plan.sceneCount !== PA4L_MAX_SCENES
    || plan.plannedSceneCount !== PA4L_MAX_SCENES
    || plan.scenes.length !== PA4L_MAX_SCENES
    || !scene
    || scene.characterCount > PA4L_MAX_NARRATION_CHARACTERS
    || plan.maximumExternalGenerationRequests !== PA4L_MAX_EXTERNAL_GENERATION_REQUESTS
    || plan.automaticRetryLimit !== PA4L_AUTOMATIC_RETRY_LIMIT
    || plan.fallbackRequestLimit !== PA4L_FALLBACK_REQUEST_LIMIT) {
    throw new Error("PA4L_SINGLE_SCENE_PLAN_INVARIANT_FAILED");
  }
  return scene;
}

export function assertPa4lRequestedSceneIds(
  plan: VoiceMaterializationPlan,
  requestedSceneIds: readonly string[] | undefined,
): VoiceMaterializationPlan["scenes"][number] {
  const scene = assertPa4lSingleScenePlan(plan);
  if (requestedSceneIds?.length !== PA4L_MAX_SCENES || requestedSceneIds[0] !== scene.sceneId) {
    throw new Error("PA4L_CANONICAL_SCENE_SELECTION_MISMATCH");
  }
  return scene;
}

export function compareVoiceMaterializationPlans(
  expected: VoiceMaterializationPlan,
  current: VoiceMaterializationPlan,
): VoiceMaterializationPlanComparison {
  const reasons: string[] = [];
  if (expected.projectId !== current.projectId) reasons.push("project_id_mismatch");
  if (expected.projectRevision !== current.projectRevision) reasons.push("project_revision_mismatch");
  if (expected.sourceRenderCheckpointHash !== current.sourceRenderCheckpointHash) reasons.push("render_checkpoint_hash_mismatch");
  if (expected.renderManifestHash !== current.renderManifestHash) reasons.push("render_manifest_hash_mismatch");
  if (expected.providerId !== current.providerId || expected.voiceId !== current.voiceId || expected.modelId !== current.modelId || expected.outputFormat !== current.outputFormat) reasons.push("provider_configuration_mismatch");
  if (expected.executionMode !== current.executionMode) reasons.push("execution_mode_mismatch");
  if (expected.materializationSetId !== current.materializationSetId) reasons.push("materialization_set_identity_mismatch");
  if (expected.planHash !== current.planHash || hashVoiceMaterializationPlan(expected) !== expected.planHash || hashVoiceMaterializationPlan(current) !== current.planHash) reasons.push("plan_hash_mismatch");
  return { matches: reasons.length === 0, stale: reasons.length > 0, reasons };
}

function childEnvironment(): NodeJS.ProcessEnv {
  const allowed = ["PATH", "PATHEXT", "SystemRoot", "SYSTEMROOT", "WINDIR", "COMSPEC", "TMP", "TEMP"];
  const env: NodeJS.ProcessEnv = { NODE_ENV: process.env.NODE_ENV ?? "production" };
  for (const key of allowed) if (process.env[key] !== undefined) env[key] = process.env[key];
  return env;
}

export async function probeVoiceAudioFile(audioPath: string): Promise<VoiceAudioProbeSummary> {
  let stdout: string;
  try {
    const result = await execFile("ffprobe", [
      "-v", "error",
      "-show_streams",
      "-show_format",
      "-of", "json",
      audioPath,
    ], {
      cwd: dirname(audioPath),
      windowsHide: true,
      timeout: 30_000,
      maxBuffer: 4 * 1024 * 1024,
      encoding: "utf8",
      env: childEnvironment(),
    });
    stdout = result.stdout;
  } catch {
    throw new Error("VOICE_AUDIO_FFPROBE_FAILED");
  }
  let payload: unknown;
  try { payload = JSON.parse(stdout); } catch { throw new Error("VOICE_AUDIO_FFPROBE_JSON_INVALID"); }
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw new Error("VOICE_AUDIO_FFPROBE_SHAPE_INVALID");
  const record = payload as Readonly<Record<string, unknown>>;
  const streams = Array.isArray(record.streams) ? record.streams.filter((entry): entry is Readonly<Record<string, unknown>> => Boolean(entry) && typeof entry === "object" && !Array.isArray(entry)) : [];
  const audio = streams.find((stream) => stream.codec_type === "audio");
  const video = streams.find((stream) => stream.codec_type === "video");
  const format = record.format && typeof record.format === "object" && !Array.isArray(record.format) ? record.format as Readonly<Record<string, unknown>> : {};
  const durationSeconds = Number(format.duration ?? audio?.duration ?? 0);
  return {
    audioStreamPresent: Boolean(audio),
    videoStreamPresent: Boolean(video),
    codecName: typeof audio?.codec_name === "string" ? audio.codec_name : "",
    formatName: typeof format.format_name === "string" ? format.format_name : "",
    durationMs: Math.round(durationSeconds * 1_000),
  };
}

export async function buildVoiceMaterializationPlanPreview(
  configuration: VoiceMaterializationRuntimeOptions["configuration"],
  plan: VoiceMaterializationPlan,
  capability: Readonly<{ featureEnabled: boolean; credentialConfigured: boolean }>,
): Promise<VoiceMaterializationPlanPreview> {
  const issues = validateVoiceMaterializationPlan(plan);
  if (issues.length > 0) throw new Error(`VOICE_MATERIALIZATION_PLAN_INVALID:${issues.join(",")}`);
  const cacheHitSceneIds: string[] = [];
  const missingSceneIds: string[] = [];
  for (const scene of plan.scenes) {
    const cache = await inspectVoiceSceneCache(configuration, plan, scene);
    (cache.hit ? cacheHitSceneIds : missingSceneIds).push(scene.sceneId);
  }
  if (plan.executionMode === PA4L_SINGLE_SCENE_LIVE_SMOKE_MODE && missingSceneIds.length > PA4L_MAX_EXTERNAL_GENERATION_REQUESTS) {
    throw new Error("PA4L_EXTERNAL_REQUEST_PREVIEW_CAP_EXCEEDED");
  }
  return {
    plan,
    featureEnabled: capability.featureEnabled,
    credentialConfigured: capability.credentialConfigured,
    cacheHitSceneIds,
    missingSceneIds,
    maximumExternalRequests: missingSceneIds.length,
    actualPrice: "UNKNOWN",
    providerPriceVerified: false,
    priceNotice: "실제 Provider 가격을 이 프로그램이 검증한 것이 아닙니다.",
    externalNetworkRequestsMade: 0,
  };
}

function pendingEntry(scene: VoiceMaterializationPlan["scenes"][number]): VoiceMaterializationSceneEntry {
  return {
    sceneId: scene.sceneId,
    sceneOrder: scene.sceneOrder,
    sceneAudioIdentity: scene.sceneAudioIdentity,
    narration: scene.narration,
    narrationHash: scene.narrationHash,
    characterCount: scene.characterCount,
    status: "pending",
    audioSha256: null,
    audioBytes: null,
    durationMs: null,
    alignmentStatus: "not_available",
    audioAlignmentUsable: false,
    subtitleCueCount: 0,
    failureCode: null,
    providerError: null,
    retryable: true,
  };
}

function completeEntry(
  scene: VoiceMaterializationPlan["scenes"][number],
  metadata: VoiceSceneAudioMetadata,
  status: "cache_hit" | "generated",
): VoiceMaterializationSceneEntry {
  return {
    sceneId: scene.sceneId,
    sceneOrder: scene.sceneOrder,
    sceneAudioIdentity: scene.sceneAudioIdentity,
    narration: scene.narration,
    narrationHash: scene.narrationHash,
    characterCount: scene.characterCount,
    status,
    audioSha256: metadata.audioSha256,
    audioBytes: metadata.audioBytes,
    durationMs: metadata.durationMs,
    alignmentStatus: "provider_character_timestamps_aligned",
    audioAlignmentUsable: true,
    subtitleCueCount: metadata.subtitleTrack.cues.length,
    failureCode: null,
    providerError: null,
    retryable: false,
  };
}

function sanitizedFailureCode(error: unknown): string {
  const raw = error instanceof VoiceAudioStoreError
    ? error.code
    : error instanceof Error
      ? error.message.split(":", 1)[0] ?? ""
      : "";
  return /^[A-Z][A-Z0-9_]{2,127}$/u.test(raw) ? raw : "VOICE_SCENE_MATERIALIZATION_FAILED";
}

function sanitizedProviderError(error: unknown): SanitizedElevenLabsProviderError | null {
  return error instanceof ElevenLabsProviderHttpError ? error.providerError : null;
}

function approvalBoundary(entries: readonly VoiceMaterializationSceneEntry[], checkpointIdentityCurrent = true): AudioMaterializationPackageBoundary {
  const complete = entries.length > 0 && entries.every((entry) => entry.status === "cache_hit" || entry.status === "generated");
  const aligned = complete && entries.every((entry) => entry.audioAlignmentUsable && entry.alignmentStatus === "provider_character_timestamps_aligned");
  const subtitles = aligned && entries.every((entry) => entry.subtitleCueCount > 0);
  return {
    packageType: "Audio Materialization Package",
    allEnabledScenesMaterialized: complete,
    allAudioIntegrityValid: complete,
    allProviderAlignmentsUsable: aligned,
    allAudioAlignedSubtitlePlansValid: subtitles,
    checkpointIdentityCurrent,
    productionVoiceQualityApproval: "NOT_APPROVED",
    finalRenderCreated: false,
    actualVisualAssetsCreated: false,
    pa3PreviewAudioMode: "SILENT_PLACEHOLDER",
  };
}

function buildSet(
  plan: VoiceMaterializationPlan,
  entries: readonly VoiceMaterializationSceneEntry[],
  externalRequestCount: number,
  createdAtIso: string,
  updatedAtIso: string,
): VoiceMaterializationSet {
  const completeSceneIds = entries.filter((entry) => entry.status === "cache_hit" || entry.status === "generated").map((entry) => entry.sceneId);
  const failedSceneIds = entries.filter((entry) => entry.status === "failed").map((entry) => entry.sceneId);
  const pendingSceneIds = entries.filter((entry) => entry.status === "pending").map((entry) => entry.sceneId);
  const boundary = approvalBoundary(entries);
  const approvalState = boundary.allEnabledScenesMaterialized && boundary.allAudioIntegrityValid && boundary.allProviderAlignmentsUsable && boundary.allAudioAlignedSubtitlePlansValid && boundary.checkpointIdentityCurrent
    ? "approved"
    : failedSceneIds.length > 0 ? "blocked" : "pending";
  return {
    schemaVersion: "voice-materialization-set-v1",
    materializationSetId: plan.materializationSetId,
    projectId: plan.projectId,
    projectRevision: plan.projectRevision,
    sourceRenderCheckpointHash: plan.sourceRenderCheckpointHash,
    renderManifestHash: plan.renderManifestHash,
    providerId: plan.providerId,
    voiceId: plan.voiceId,
    modelId: plan.modelId,
    outputFormat: plan.outputFormat,
    executionMode: plan.executionMode,
    maximumExternalGenerationRequests: plan.maximumExternalGenerationRequests,
    automaticRetryLimit: plan.automaticRetryLimit,
    fallbackRequestLimit: plan.fallbackRequestLimit,
    planHash: plan.planHash,
    sceneEntries: entries,
    completeSceneIds,
    failedSceneIds,
    pendingSceneIds,
    requestedCharacters: entries.reduce((total, entry) => total + entry.characterCount, 0),
    successfulCharacters: entries.filter((entry) => entry.status === "cache_hit" || entry.status === "generated").reduce((total, entry) => total + entry.characterCount, 0),
    externalRequestCount,
    createdAtIso,
    updatedAtIso,
    approvalState,
    approvalBoundary: boundary,
    automaticRetryCount: 0,
    costAmountStored: false,
  };
}

export async function materializeVoiceMaterializationPlan(
  plan: VoiceMaterializationPlan,
  options: MaterializeVoicePlanOptions,
): Promise<VoiceMaterializationExecutionResult> {
  const planIssues = validateVoiceMaterializationPlan(plan);
  if (planIssues.length > 0) throw new Error(`VOICE_MATERIALIZATION_PLAN_INVALID:${planIssues.join(",")}`);
  if (!options.apiKey) throw new Error("ELEVENLABS_CREDENTIAL_MISSING");
  const pa4lScene = plan.executionMode === PA4L_SINGLE_SCENE_LIVE_SMOKE_MODE
    ? assertPa4lRequestedSceneIds(plan, options.requestedSceneIds)
    : null;
  if (pa4lScene) {
    if (options.executionMode !== PA4L_SINGLE_SCENE_LIVE_SMOKE_MODE || options.mode !== "initial") {
      throw new Error("PA4L_EXECUTION_MODE_MISMATCH");
    }
  }
  const now = options.now ?? (() => new Date().toISOString());
  const existing = await readVoiceMaterializationSet(options.configuration, plan.projectId, plan.materializationSetId);
  if (existing && (existing.planHash !== plan.planHash || existing.projectRevision !== plan.projectRevision || existing.sourceRenderCheckpointHash !== plan.sourceRenderCheckpointHash)) {
    throw new Error("VOICE_MATERIALIZATION_EXISTING_SET_STALE");
  }
  if (options.mode === "initial" && existing && (existing.failedSceneIds.length > 0 || existing.pendingSceneIds.length > 0)) {
    throw new Error("VOICE_MATERIALIZATION_RETRY_ACTION_REQUIRED");
  }
  if (options.mode === "retry" && !existing) throw new Error("VOICE_MATERIALIZATION_RETRY_SET_MISSING");
  const retryPlan = options.mode === "retry" && existing
    ? buildRetryMaterializationPlan(plan, existing, options.requestedSceneIds)
    : null;
  const selectedSceneIds = new Set(pa4lScene ? [pa4lScene.sceneId] : retryPlan?.requestedSceneIds ?? plan.scenes.map((scene) => scene.sceneId));
  const entries = plan.scenes.map((scene) => existing?.sceneEntries.find((entry) => entry.sceneId === scene.sceneId) ?? pendingEntry(scene));
  const createdAtIso = existing?.createdAtIso ?? now();
  let externalRequestCount = existing?.externalRequestCount ?? 0;
  let externalRequestsThisRun = 0;
  let totalAudioBytes = entries.reduce((total, entry) => total + (entry.audioBytes ?? 0), 0);
  let stoppedOnFirstFailure = false;
  let currentSet = buildSet(plan, entries, externalRequestCount, createdAtIso, now());
  await writeVoiceMaterializationSet(options.configuration, currentSet);

  for (const [index, scene] of plan.scenes.entries()) {
    const previous = entries[index];
    if (!previous || !selectedSceneIds.has(scene.sceneId) || previous.status === "cache_hit" || previous.status === "generated") continue;
    let workspace: Awaited<ReturnType<typeof createVoiceSceneAudioWorkspace>> | null = null;
    try {
      const cache = await inspectVoiceSceneCache(options.configuration, plan, scene);
      if (cache.invalidExisting) throw new Error("VOICE_SCENE_INVALID_CACHE_CONFLICT");
      if (cache.hit && cache.metadata) {
        const descriptor = await readVoiceSceneAudioDescriptor(options.configuration, plan.projectId, scene.sceneAudioIdentity);
        const probe = await probeVoiceAudioFile(descriptor.mediaPath);
        const probeIssues = validateVoiceAudioProbe(probe, cache.metadata.audioBytes);
        if (probeIssues.length > 0 || Math.abs(probe.durationMs - cache.metadata.durationMs) > 1) throw new Error("VOICE_SCENE_CACHE_FFPROBE_MISMATCH");
        entries[index] = completeEntry(scene, cache.metadata, "cache_hit");
      } else {
        if (pa4lScene) {
          if (externalRequestsThisRun >= PA4L_MAX_EXTERNAL_GENERATION_REQUESTS) throw new Error("PA4L_EXTERNAL_REQUEST_BUDGET_EXHAUSTED");
          if (scene.sceneId !== pa4lScene.sceneId
            || scene.narrationHash !== sha256(scene.narration)
            || scene.characterCount !== [...scene.narration].length
            || scene.characterCount > PA4L_MAX_NARRATION_CHARACTERS) {
            throw new Error("PA4L_PROVIDER_ATTEMPT_INVARIANT_FAILED");
          }
        }
        externalRequestCount += 1;
        externalRequestsThisRun += 1;
        const provider = await requestElevenLabsTimestampTts({
          voiceId: plan.voiceId,
          modelId: plan.modelId,
          narration: scene.narration,
          apiKey: options.apiKey,
          fetchImpl: options.fetchImpl,
          timeoutMs: options.timeoutMs,
        });
        if (!provider.alignmentValidation.audioAlignmentUsable || !provider.alignmentValidation.alignment || !provider.alignmentValidation.alignmentHash) {
          throw new Error("ELEVENLABS_ALIGNMENT_CANONICAL_TEXT_MISMATCH");
        }
        if (totalAudioBytes + provider.audio.byteLength > VOICE_MATERIALIZATION_MAX_TOTAL_AUDIO_BYTES) throw new Error("VOICE_MATERIALIZATION_TOTAL_AUDIO_TOO_LARGE");
        workspace = await createVoiceSceneAudioWorkspace(options.configuration, plan.projectId, scene.sceneAudioIdentity);
        await stageVoiceSceneAudio(workspace, provider.audio);
        const probe = await probeVoiceAudioFile(workspace.stagedAudioPath);
        const probeIssues = validateVoiceAudioProbe(probe, provider.audio.byteLength);
        const durationIssues = validateAlignmentAudioDuration(provider.alignmentValidation.finalEndSeconds, probe.durationMs);
        if (probeIssues.length > 0 || durationIssues.length > 0) throw new Error(`VOICE_AUDIO_VALIDATION_FAILED:${[...probeIssues, ...durationIssues].join(",")}`);
        const track = buildAudioAlignedSubtitleTrack(plan.sourceRenderCheckpointHash, plan.materializationSetId, [{
          sceneId: scene.sceneId,
          sceneOrder: scene.sceneOrder,
          narration: scene.narration,
          keyCaption: scene.keyCaption,
          audioDurationMs: probe.durationMs,
          alignment: provider.alignmentValidation.alignment,
        }]);
        const trackIssues = validateAudioAlignedSubtitleTrack(track);
        if (trackIssues.length > 0) throw new Error(`VOICE_SUBTITLE_VALIDATION_FAILED:${trackIssues.join(",")}`);
        const audioSha256 = createHash("sha256").update(provider.audio).digest("hex");
        const metadata: VoiceSceneAudioMetadata = {
          schemaVersion: "voice-scene-audio-v1",
          sceneAudioIdentity: scene.sceneAudioIdentity,
          projectId: plan.projectId,
          projectRevision: plan.projectRevision,
          sourceRenderCheckpointHash: plan.sourceRenderCheckpointHash,
          providerId: plan.providerId,
          voiceId: plan.voiceId,
          modelId: plan.modelId,
          outputFormat: plan.outputFormat,
          sceneId: scene.sceneId,
          sceneOrder: scene.sceneOrder,
          narrationHash: scene.narrationHash,
          characterCount: scene.characterCount,
          audioSha256,
          audioBytes: provider.audio.byteLength,
          durationMs: probe.durationMs,
          codecName: probe.codecName,
          formatName: probe.formatName,
          alignmentHash: provider.alignmentValidation.alignmentHash,
          alignment: provider.alignmentValidation.alignment,
          alignmentStatus: "provider_character_timestamps_aligned",
          audioAlignmentUsable: true,
          subtitleTrack: track.scenePlans[0]!,
          createdAtIso: now(),
          immutableContentAddressed: true,
          productionVoiceQualityApproved: false,
        };
        const committed = await commitVoiceSceneAudio(options.configuration, workspace, metadata);
        entries[index] = completeEntry(scene, committed, "generated");
        totalAudioBytes += committed.audioBytes;
      }
    } catch (error) {
      const failureCode = sanitizedFailureCode(error);
      const providerError = sanitizedProviderError(error);
      entries[index] = {
        ...pendingEntry(scene),
        status: "failed",
        alignmentStatus: failureCode.includes("ALIGNMENT") ? "unusable" : "not_available",
        failureCode,
        providerError,
        retryable: true,
      };
      stoppedOnFirstFailure = true;
    } finally {
      if (workspace) await cleanupVoiceSceneAudioWorkspace(workspace).catch(() => undefined);
    }
    currentSet = buildSet(plan, entries, externalRequestCount, createdAtIso, now());
    const setIssues = validateVoiceMaterializationSet(currentSet);
    if (setIssues.length > 0) throw new Error(`VOICE_MATERIALIZATION_SET_INVALID:${setIssues.join(",")}`);
    await writeVoiceMaterializationSet(options.configuration, currentSet);
    if (stoppedOnFirstFailure) break;
  }

  currentSet = buildSet(plan, entries, externalRequestCount, createdAtIso, now());
  await writeVoiceMaterializationSet(options.configuration, currentSet);
  return {
    ok: currentSet.failedSceneIds.length === 0 && currentSet.pendingSceneIds.length === 0,
    set: currentSet,
    externalRequestsThisRun,
    stoppedOnFirstFailure,
    message: currentSet.approvalState === "approved" ? "VOICE_MATERIALIZATION_PACKAGE_APPROVED" : stoppedOnFirstFailure ? "VOICE_MATERIALIZATION_STOPPED_ON_FIRST_FAILURE" : "VOICE_MATERIALIZATION_PENDING",
  };
}
