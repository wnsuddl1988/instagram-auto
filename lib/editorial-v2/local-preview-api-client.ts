import type {
  LocalPreviewExecutionResult,
  LocalPreviewRenderMetadata,
  LocalPreviewRenderRequest,
} from "./local-preview-contracts";

const API_ROOT = "/api/editorial-v2/projects";
const DEFAULT_TIMEOUT_MS = 150_000;

export class LocalPreviewApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details: Readonly<Record<string, unknown>> = {},
  ) {
    super(message);
    this.name = "LocalPreviewApiError";
  }
}

export interface LocalPreviewApiOptions {
  readonly signal?: AbortSignal;
  readonly timeoutMs?: number;
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isProjectId(value: string): boolean {
  return /^[a-z0-9](?:[a-z0-9-]{0,78}[a-z0-9])?$/u.test(value) && !value.includes("..");
}

function isRenderId(value: string): boolean {
  return /^preview-[a-f0-9]{40}$/u.test(value);
}

function previewUrl(projectId: string, renderId?: string, media = false): string {
  if (!isProjectId(projectId)) throw new LocalPreviewApiError(0, "PROJECT_ID_INVALID", "Project ID가 올바르지 않습니다.");
  if (renderId !== undefined && !isRenderId(renderId)) throw new LocalPreviewApiError(0, "PREVIEW_RENDER_ID_INVALID", "Preview render ID가 올바르지 않습니다.");
  const base = `${API_ROOT}/${encodeURIComponent(projectId)}/preview-render`;
  const query = renderId ? `?renderId=${encodeURIComponent(renderId)}${media ? "&media=1" : ""}` : "";
  const url = `${base}${query}`;
  if (!url.startsWith("/api/editorial-v2/projects/") || url.startsWith("//") || url.includes("://")) throw new LocalPreviewApiError(0, "EXTERNAL_PREVIEW_URL_FORBIDDEN", "Same-origin relative preview URL만 허용됩니다.");
  return url;
}

function isMetadata(value: unknown): value is LocalPreviewRenderMetadata {
  if (!isRecord(value) || !isRecord(value.probe) || !isRecord(value.sourceCheckpointHashes)) return false;
  return value.schemaVersion === "local-preview-metadata-v1"
    && value.status === "completed"
    && typeof value.renderId === "string" && isRenderId(value.renderId)
    && typeof value.projectId === "string" && isProjectId(value.projectId)
    && Number.isSafeInteger(value.projectRevision)
    && typeof value.renderInputHash === "string" && /^[a-f0-9]{64}$/u.test(value.renderInputHash)
    && value.profile === "preview_540x960"
    && Number.isSafeInteger(value.sceneCount)
    && Number.isSafeInteger(value.durationMs)
    && value.width === 540 && value.height === 960 && value.fps === 30
    && value.audioMode === "silent_placeholder"
    && value.subtitleAlignment === "estimated_not_audio_aligned"
    && value.characterMotionProxy === true
    && value.productionAnimation === false
    && value.productionReady === false
    && typeof value.outputSha256 === "string" && /^[a-f0-9]{64}$/u.test(value.outputSha256)
    && typeof value.outputBytes === "number" && value.outputBytes > 0
    && Array.isArray(value.placeholderSceneIds)
    && Array.isArray(value.warnings);
}

async function withTimeout<T>(options: LocalPreviewApiOptions, task: (signal: AbortSignal) => Promise<T>): Promise<T> {
  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort("LOCAL_PREVIEW_API_TIMEOUT"), options.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  const forwardAbort = () => controller.abort(options.signal?.reason);
  options.signal?.addEventListener("abort", forwardAbort, { once: true });
  try { return await task(controller.signal); }
  catch (error) {
    if (error instanceof LocalPreviewApiError) throw error;
    if (controller.signal.aborted) throw new LocalPreviewApiError(0, "LOCAL_PREVIEW_API_ABORTED", "Preview 요청이 취소되거나 시간 초과됐습니다.");
    throw new LocalPreviewApiError(0, "LOCAL_PREVIEW_API_NETWORK_ERROR", "Same-origin preview API에 연결하지 못했습니다.");
  } finally {
    globalThis.clearTimeout(timeout);
    options.signal?.removeEventListener("abort", forwardAbort);
  }
}

async function requestJson(url: string, init: RequestInit, options: LocalPreviewApiOptions): Promise<Readonly<Record<string, unknown>>> {
  return withTimeout(options, async (signal) => {
    const response = await fetch(url, { ...init, signal, credentials: "same-origin", redirect: "error", cache: "no-store" });
    const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
    if (!contentType.startsWith("application/json")) throw new LocalPreviewApiError(response.status, "INVALID_PREVIEW_API_CONTENT_TYPE", "Preview API JSON 응답이 필요합니다.");
    let payload: unknown;
    try { payload = await response.json(); } catch { throw new LocalPreviewApiError(response.status, "INVALID_PREVIEW_API_JSON", "Preview API JSON을 읽지 못했습니다."); }
    if (!isRecord(payload)) throw new LocalPreviewApiError(response.status, "INVALID_PREVIEW_API_RESPONSE", "Preview API 응답 구조가 올바르지 않습니다.");
    if (!response.ok || payload.ok !== true) throw new LocalPreviewApiError(response.status, typeof payload.code === "string" ? payload.code : "LOCAL_PREVIEW_API_ERROR", typeof payload.message === "string" ? payload.message : "Preview API 요청이 실패했습니다.", payload);
    return payload;
  });
}

export async function requestLocalProjectPreview(
  projectId: string,
  request: LocalPreviewRenderRequest,
  options: LocalPreviewApiOptions = {},
): Promise<LocalPreviewExecutionResult> {
  const payload = await requestJson(previewUrl(projectId), { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(request) }, options);
  if (!isMetadata(payload.metadata) || !isRecord(payload.identity) || typeof payload.status !== "string" || typeof payload.cacheStatus !== "string" || typeof payload.ffmpegExecuted !== "boolean") throw new LocalPreviewApiError(200, "INVALID_PREVIEW_RENDER_RESULT", "Preview render 응답이 올바르지 않습니다.");
  return {
    ok: true,
    status: payload.status as LocalPreviewExecutionResult["status"],
    identity: payload.identity as unknown as NonNullable<LocalPreviewExecutionResult["identity"]>,
    metadata: payload.metadata,
    cacheStatus: payload.cacheStatus as LocalPreviewExecutionResult["cacheStatus"],
    ffmpegExecuted: payload.ffmpegExecuted,
    message: typeof payload.message === "string" ? payload.message : "LOCAL_PREVIEW_RENDER_READY",
  };
}

export async function getLocalProjectPreviewMetadata(
  projectId: string,
  renderId?: string,
  options: LocalPreviewApiOptions = {},
): Promise<LocalPreviewRenderMetadata> {
  const payload = await requestJson(previewUrl(projectId, renderId), { method: "GET" }, options);
  if (!isMetadata(payload.metadata)) throw new LocalPreviewApiError(200, "INVALID_PREVIEW_METADATA", "Preview metadata 응답이 올바르지 않습니다.");
  return payload.metadata;
}

export async function fetchLocalProjectPreviewBlob(
  projectId: string,
  renderId: string,
  options: LocalPreviewApiOptions = {},
): Promise<Blob> {
  return withTimeout(options, async (signal) => {
    const response = await fetch(previewUrl(projectId, renderId, true), { method: "GET", signal, credentials: "same-origin", redirect: "error", cache: "no-store" });
    if (!response.ok) {
      let details: unknown = null;
      try { details = await response.json(); } catch { /* Media errors may not be JSON in every runtime. */ }
      const record = isRecord(details) ? details : {};
      throw new LocalPreviewApiError(response.status, typeof record.code === "string" ? record.code : "LOCAL_PREVIEW_MEDIA_ERROR", typeof record.message === "string" ? record.message : "Preview media를 읽지 못했습니다.", record);
    }
    const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
    if (!contentType.startsWith("video/mp4")) throw new LocalPreviewApiError(response.status, "INVALID_PREVIEW_MEDIA_TYPE", "Preview media는 video/mp4여야 합니다.");
    const blob = await response.blob();
    if (blob.size <= 0 || blob.size > 100 * 1024 * 1024 || !blob.type.toLowerCase().startsWith("video/mp4")) throw new LocalPreviewApiError(response.status, "INVALID_PREVIEW_MEDIA_BLOB", "Preview media blob이 유효하지 않습니다.");
    return blob;
  });
}
