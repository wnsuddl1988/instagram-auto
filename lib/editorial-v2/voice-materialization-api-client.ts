import type {
  VoiceMaterializationExecutionResult,
  VoiceMaterializationExecutionMode,
  VoiceMaterializationPlan,
  VoiceMaterializationPlanPreview,
  VoiceMaterializationRecoveryPlan,
  VoiceMaterializationRequest,
  VoiceMaterializationSet,
} from "./voice-materialization-contracts";
import {
  PA4L_MAX_EXTERNAL_GENERATION_REQUESTS,
  PA4L_MAX_NARRATION_CHARACTERS,
  PA4L_MAX_SCENES,
  PA4L_SINGLE_SCENE_LIVE_SMOKE_MODE,
  isMaterializationSetId,
  isVoiceMaterializationIdentifier,
} from "./voice-materialization-contracts";

const API_ROOT = "/api/editorial-v2/projects";
const DEFAULT_TIMEOUT_MS = 180_000;

export class VoiceMaterializationApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details: Readonly<Record<string, unknown>> = {},
  ) {
    super(message);
    this.name = "VoiceMaterializationApiError";
  }
}

export interface VoiceMaterializationApiOptions {
  readonly signal?: AbortSignal;
  readonly timeoutMs?: number;
}

export interface VoiceMaterializationPlanPreviewOptions extends VoiceMaterializationApiOptions {
  readonly executionMode?: VoiceMaterializationExecutionMode;
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isProjectId(value: string): boolean {
  return /^[a-z0-9](?:[a-z0-9-]{0,78}[a-z0-9])?$/u.test(value) && !value.includes("..");
}

function isSceneId(value: string): boolean {
  return /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/u.test(value);
}

function routeRoot(projectId: string): string {
  if (!isProjectId(projectId)) throw new VoiceMaterializationApiError(0, "PROJECT_ID_INVALID", "Project ID가 올바르지 않습니다.");
  const url = `${API_ROOT}/${encodeURIComponent(projectId)}/voice-materialization`;
  if (!url.startsWith("/api/editorial-v2/projects/") || url.startsWith("//") || url.includes("://")) throw new VoiceMaterializationApiError(0, "EXTERNAL_VOICE_URL_FORBIDDEN", "Same-origin relative URL만 허용됩니다.");
  return url;
}

function queryUrl(projectId: string, values: Readonly<Record<string, string>>): string {
  const query = new URLSearchParams(values).toString();
  return `${routeRoot(projectId)}?${query}`;
}

function isPlan(value: unknown): value is VoiceMaterializationPlan {
  return isRecord(value)
    && value.schemaVersion === "voice-materialization-plan-v1"
    && typeof value.projectId === "string"
    && Number.isSafeInteger(value.projectRevision)
    && typeof value.sourceRenderCheckpointHash === "string" && /^[a-f0-9]{64}$/u.test(value.sourceRenderCheckpointHash)
    && typeof value.planHash === "string" && /^[a-f0-9]{64}$/u.test(value.planHash)
    && typeof value.materializationSetId === "string" && isMaterializationSetId(value.materializationSetId)
    && value.providerId === "elevenlabs_tts_with_timestamps"
    && value.outputFormat === "mp3_44100_128"
    && value.executionMode === PA4L_SINGLE_SCENE_LIVE_SMOKE_MODE
    && value.sceneCount === PA4L_MAX_SCENES
    && value.plannedSceneCount === PA4L_MAX_SCENES
    && value.maximumExternalGenerationRequests === PA4L_MAX_EXTERNAL_GENERATION_REQUESTS
    && value.automaticRetryLimit === 0
    && value.fallbackRequestLimit === 0
    && Array.isArray(value.scenes)
    && value.scenes.length === PA4L_MAX_SCENES
    && value.scenes.every((scene) => isRecord(scene)
      && typeof scene.sceneId === "string"
      && typeof scene.narration === "string"
      && Number.isSafeInteger(scene.characterCount)
      && Number(scene.characterCount) <= PA4L_MAX_NARRATION_CHARACTERS);
}

function isPreview(value: unknown): value is VoiceMaterializationPlanPreview {
  return isRecord(value)
    && isPlan(value.plan)
    && typeof value.featureEnabled === "boolean"
    && typeof value.credentialConfigured === "boolean"
    && Array.isArray(value.cacheHitSceneIds)
    && Array.isArray(value.missingSceneIds)
    && Number.isSafeInteger(value.maximumExternalRequests)
    && Number(value.maximumExternalRequests) <= PA4L_MAX_EXTERNAL_GENERATION_REQUESTS
    && value.cacheHitSceneIds.length + value.missingSceneIds.length === PA4L_MAX_SCENES
    && value.actualPrice === "UNKNOWN"
    && value.providerPriceVerified === false
    && value.externalNetworkRequestsMade === 0;
}

function isSet(value: unknown): value is VoiceMaterializationSet {
  return isRecord(value)
    && value.schemaVersion === "voice-materialization-set-v1"
    && typeof value.materializationSetId === "string" && isMaterializationSetId(value.materializationSetId)
    && typeof value.projectId === "string"
    && Number.isSafeInteger(value.projectRevision)
    && value.executionMode === PA4L_SINGLE_SCENE_LIVE_SMOKE_MODE
    && value.maximumExternalGenerationRequests === PA4L_MAX_EXTERNAL_GENERATION_REQUESTS
    && value.automaticRetryLimit === 0
    && value.fallbackRequestLimit === 0
    && Array.isArray(value.sceneEntries)
    && value.sceneEntries.length === PA4L_MAX_SCENES
    && value.sceneEntries.every((scene) => isRecord(scene) && typeof scene.sceneId === "string" && typeof scene.status === "string")
    && Number.isSafeInteger(value.externalRequestCount)
    && Number(value.externalRequestCount) <= PA4L_MAX_EXTERNAL_GENERATION_REQUESTS
    && Array.isArray(value.completeSceneIds)
    && Array.isArray(value.failedSceneIds)
    && Array.isArray(value.pendingSceneIds)
    && isRecord(value.approvalBoundary);
}

async function withTimeout<T>(options: VoiceMaterializationApiOptions, task: (signal: AbortSignal) => Promise<T>): Promise<T> {
  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort("VOICE_MATERIALIZATION_API_TIMEOUT"), options.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  const forwardAbort = () => controller.abort(options.signal?.reason);
  options.signal?.addEventListener("abort", forwardAbort, { once: true });
  try { return await task(controller.signal); }
  catch (error) {
    if (error instanceof VoiceMaterializationApiError) throw error;
    if (controller.signal.aborted) throw new VoiceMaterializationApiError(0, "VOICE_MATERIALIZATION_API_ABORTED", "Voice 요청이 취소되거나 시간 초과됐습니다.");
    throw new VoiceMaterializationApiError(0, "VOICE_MATERIALIZATION_API_NETWORK_ERROR", "Same-origin voice API에 연결하지 못했습니다.");
  } finally {
    globalThis.clearTimeout(timeout);
    options.signal?.removeEventListener("abort", forwardAbort);
  }
}

async function requestJson(url: string, init: RequestInit, options: VoiceMaterializationApiOptions): Promise<Readonly<Record<string, unknown>>> {
  return withTimeout(options, async (signal) => {
    const response = await fetch(url, { ...init, signal, credentials: "same-origin", redirect: "error", cache: "no-store" });
    const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
    if (!contentType.startsWith("application/json")) throw new VoiceMaterializationApiError(response.status, "VOICE_API_CONTENT_TYPE_INVALID", "Voice API JSON 응답이 필요합니다.");
    let payload: unknown;
    try { payload = await response.json(); } catch { throw new VoiceMaterializationApiError(response.status, "VOICE_API_JSON_INVALID", "Voice API JSON을 읽지 못했습니다."); }
    if (!isRecord(payload)) throw new VoiceMaterializationApiError(response.status, "VOICE_API_RESPONSE_INVALID", "Voice API 응답 구조가 올바르지 않습니다.");
    if (!response.ok || payload.ok !== true) throw new VoiceMaterializationApiError(response.status, typeof payload.code === "string" ? payload.code : "VOICE_API_ERROR", typeof payload.message === "string" ? payload.message : "Voice API 요청이 실패했습니다.", payload);
    return payload;
  });
}

export async function previewVoiceMaterializationPlan(
  projectId: string,
  voiceId: string,
  modelId: string,
  options: VoiceMaterializationPlanPreviewOptions = {},
): Promise<VoiceMaterializationPlanPreview> {
  if (!isVoiceMaterializationIdentifier(voiceId) || !isVoiceMaterializationIdentifier(modelId)) throw new VoiceMaterializationApiError(0, "VOICE_OR_MODEL_ID_INVALID", "Voice ID와 model ID가 올바르지 않습니다.");
  const executionMode = options.executionMode ?? PA4L_SINGLE_SCENE_LIVE_SMOKE_MODE;
  if (executionMode !== PA4L_SINGLE_SCENE_LIVE_SMOKE_MODE) throw new VoiceMaterializationApiError(0, "LIVE_FULL_MATERIALIZATION_NOT_ACTIVATED", "PA-4L single-scene plan만 허용됩니다.");
  const payload = await requestJson(queryUrl(projectId, { mode: "plan", voiceId, modelId, executionMode }), { method: "GET" }, options);
  if (!isPreview(payload.preview)) throw new VoiceMaterializationApiError(200, "VOICE_PLAN_PREVIEW_INVALID", "Voice plan preview 응답이 올바르지 않습니다.");
  return payload.preview;
}

async function execute(
  projectId: string,
  request: VoiceMaterializationRequest,
  options: VoiceMaterializationApiOptions,
): Promise<VoiceMaterializationExecutionResult> {
  const payload = await requestJson(routeRoot(projectId), {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(request),
  }, options);
  if (!isRecord(payload.result) || !isSet(payload.result.set) || typeof payload.result.externalRequestsThisRun !== "number" || typeof payload.result.stoppedOnFirstFailure !== "boolean") throw new VoiceMaterializationApiError(200, "VOICE_EXECUTION_RESULT_INVALID", "Voice materialization 결과가 올바르지 않습니다.");
  return payload.result as unknown as VoiceMaterializationExecutionResult;
}

export async function requestVoiceMaterialization(
  projectId: string,
  request: Omit<VoiceMaterializationRequest, "action" | "requestedSceneIds">,
  options: VoiceMaterializationApiOptions = {},
): Promise<VoiceMaterializationExecutionResult> {
  return execute(projectId, { ...request, action: "materialize" }, options);
}

export async function requestPa4lSingleSceneMaterialization(
  projectId: string,
  request: Omit<VoiceMaterializationRequest, "action" | "executionMode"> & { readonly requestedSceneIds: readonly [string] },
  options: VoiceMaterializationApiOptions = {},
): Promise<VoiceMaterializationExecutionResult> {
  if (request.requestedSceneIds.length !== PA4L_MAX_SCENES || !isSceneId(request.requestedSceneIds[0])) {
    throw new VoiceMaterializationApiError(0, "PA4L_REQUESTED_SCENE_INVALID", "PA-4L canonical scene ID 하나가 필요합니다.");
  }
  return execute(projectId, {
    ...request,
    action: "materialize",
    executionMode: PA4L_SINGLE_SCENE_LIVE_SMOKE_MODE,
  }, options);
}

export async function retryVoiceMaterialization(
  projectId: string,
  request: Omit<VoiceMaterializationRequest, "action"> & { readonly requestedSceneIds: readonly string[] },
  options: VoiceMaterializationApiOptions = {},
): Promise<VoiceMaterializationExecutionResult> {
  return execute(projectId, { ...request, action: "retry_failed" }, options);
}

export async function getVoiceMaterializationStatus(
  projectId: string,
  materializationSetId?: string,
  options: VoiceMaterializationApiOptions = {},
): Promise<{ readonly set: VoiceMaterializationSet; readonly recovery: VoiceMaterializationRecoveryPlan }> {
  if (materializationSetId !== undefined && !isMaterializationSetId(materializationSetId)) throw new VoiceMaterializationApiError(0, "MATERIALIZATION_SET_ID_INVALID", "Materialization set ID가 올바르지 않습니다.");
  const values: Record<string, string> = { mode: "status" };
  if (materializationSetId) values.materializationSetId = materializationSetId;
  const payload = await requestJson(queryUrl(projectId, values), { method: "GET" }, options);
  if (!isSet(payload.set) || !isRecord(payload.recovery) || !Array.isArray(payload.recovery.retryableSceneIds)) throw new VoiceMaterializationApiError(200, "VOICE_STATUS_INVALID", "Voice materialization status 응답이 올바르지 않습니다.");
  return { set: payload.set, recovery: payload.recovery as unknown as VoiceMaterializationRecoveryPlan };
}

export async function fetchMaterializedSceneAudio(
  projectId: string,
  materializationSetId: string,
  sceneId: string,
  options: VoiceMaterializationApiOptions = {},
): Promise<Blob> {
  if (!isMaterializationSetId(materializationSetId) || !isSceneId(sceneId)) throw new VoiceMaterializationApiError(0, "VOICE_AUDIO_IDENTITY_INVALID", "Scene audio identity가 올바르지 않습니다.");
  return withTimeout(options, async (signal) => {
    const response = await fetch(queryUrl(projectId, { mode: "audio", materializationSetId, sceneId }), { method: "GET", signal, credentials: "same-origin", redirect: "error", cache: "no-store" });
    if (!response.ok) {
      let details: unknown = null;
      try { details = await response.json(); } catch { /* Audio error response may not be JSON. */ }
      const record = isRecord(details) ? details : {};
      throw new VoiceMaterializationApiError(response.status, typeof record.code === "string" ? record.code : "VOICE_AUDIO_ERROR", typeof record.message === "string" ? record.message : "Scene audio를 읽지 못했습니다.", record);
    }
    const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
    if (!contentType.startsWith("audio/mpeg")) throw new VoiceMaterializationApiError(response.status, "VOICE_AUDIO_CONTENT_TYPE_INVALID", "Scene audio는 audio/mpeg여야 합니다.");
    const blob = await response.blob();
    if (blob.size <= 0 || blob.size > 20 * 1024 * 1024) throw new VoiceMaterializationApiError(response.status, "VOICE_AUDIO_BLOB_INVALID", "Scene audio blob이 유효하지 않습니다.");
    return blob;
  });
}
