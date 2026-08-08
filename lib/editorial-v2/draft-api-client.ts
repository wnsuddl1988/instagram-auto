import type {
  EditorialV2DraftLoadResult,
  EditorialV2DraftRecoveryRequest,
  EditorialV2DraftSaveRequest,
  EditorialV2DraftSaveResult,
  EditorialV2FullDraftSnapshot,
} from "./draft-contracts";
import {
  EDITORIAL_V2_DRAFT_NAMESPACE,
  EDITORIAL_V2_DRAFT_SCHEMA_VERSION,
} from "./draft-contracts";

const DRAFT_API_SUFFIX = "/draft";
const DEFAULT_TIMEOUT_MS = 8_000;

export class EditorialV2DraftApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly details: Readonly<Record<string, unknown>> = {},
  ) {
    super(message);
    this.name = "EditorialV2DraftApiError";
  }
}

export interface EditorialV2DraftApiRequestOptions {
  readonly signal?: AbortSignal;
  readonly timeoutMs?: number;
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isSafeProjectId(value: string): boolean {
  return /^[a-z0-9](?:[a-z0-9-]{0,78}[a-z0-9])?$/u.test(value)
    && !/^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])$/iu.test(value);
}

function draftUrl(projectId: string): string {
  if (!isSafeProjectId(projectId)) throw new EditorialV2DraftApiError(0, "PROJECT_ID_INVALID", "Project ID가 올바르지 않습니다.");
  const path = `/api/editorial-v2/projects/${encodeURIComponent(projectId)}${DRAFT_API_SUFFIX}`;
  if (!path.startsWith("/api/editorial-v2/projects/") || path.includes("://") || path.startsWith("//")) throw new EditorialV2DraftApiError(0, "EXTERNAL_DRAFT_URL_FORBIDDEN", "Draft API는 same-origin relative path만 허용합니다.");
  return path;
}

function isDraft(value: unknown): value is EditorialV2FullDraftSnapshot {
  if (!isRecord(value) || value.namespace !== EDITORIAL_V2_DRAFT_NAMESPACE || value.schemaVersion !== "1.0.0" || value.draftSchemaVersion !== EDITORIAL_V2_DRAFT_SCHEMA_VERSION) return false;
  return typeof value.projectId === "string"
    && Number.isSafeInteger(value.draftRevision)
    && Number.isSafeInteger(value.baseProjectRevision)
    && typeof value.baseApprovedCheckpointHash === "string"
    && typeof value.savedAtIso === "string"
    && isRecord(value.stageStates)
    && Array.isArray(value.dirtyStageIds)
    && typeof value.draftHash === "string"
    && /^[a-f0-9]{64}$/u.test(value.draftHash)
    && isRecord(value.integrity)
    && value.integrity.algorithm === "sha256"
    && value.integrity.canonicalization === "stable-json-v1"
    && value.integrity.canonicalHash === value.draftHash;
}

function isSaveResult(value: unknown): value is EditorialV2DraftSaveResult {
  if (!isRecord(value) || typeof value.ok !== "boolean" || typeof value.status !== "string" || typeof value.message !== "string") return false;
  return (value.projectId === null || typeof value.projectId === "string")
    && (value.draftRevision === null || Number.isSafeInteger(value.draftRevision))
    && (value.draftHash === null || typeof value.draftHash === "string")
    && (value.conflict === null || isRecord(value.conflict));
}

async function requestJson(
  url: string,
  init: RequestInit,
  options: EditorialV2DraftApiRequestOptions,
): Promise<Readonly<Record<string, unknown>>> {
  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort("DRAFT_API_TIMEOUT"), options.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  const forwardAbort = () => controller.abort(options.signal?.reason);
  options.signal?.addEventListener("abort", forwardAbort, { once: true });
  try {
    const response = await fetch(url, { ...init, signal: controller.signal, credentials: "same-origin", redirect: "error", cache: "no-store" });
    const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
    if (!contentType.startsWith("application/json")) throw new EditorialV2DraftApiError(response.status, "INVALID_DRAFT_API_CONTENT_TYPE", "Draft API가 JSON을 반환하지 않았습니다.");
    let payload: unknown;
    try { payload = await response.json(); } catch { throw new EditorialV2DraftApiError(response.status, "INVALID_DRAFT_API_JSON", "Draft API JSON을 읽지 못했습니다."); }
    if (!isRecord(payload)) throw new EditorialV2DraftApiError(response.status, "INVALID_DRAFT_API_RESPONSE", "Draft API 응답 형태가 올바르지 않습니다.");
    if (!response.ok || payload.ok !== true) {
      const code = typeof payload.code === "string" ? payload.code : typeof payload.status === "string" ? payload.status : "DRAFT_API_ERROR";
      const message = typeof payload.message === "string" ? payload.message : "Draft API 요청이 실패했습니다.";
      throw new EditorialV2DraftApiError(response.status, code, message, payload);
    }
    return payload;
  } catch (error) {
    if (error instanceof EditorialV2DraftApiError) throw error;
    if (controller.signal.aborted) throw new EditorialV2DraftApiError(0, "DRAFT_API_ABORTED", "Draft API 요청이 취소되거나 시간 초과됐습니다.");
    throw new EditorialV2DraftApiError(0, "DRAFT_API_NETWORK_ERROR", "Same-origin Draft API에 연결하지 못했습니다.");
  } finally {
    globalThis.clearTimeout(timeout);
    options.signal?.removeEventListener("abort", forwardAbort);
  }
}

export async function loadEditorialV2Draft(
  projectId: string,
  options: EditorialV2DraftApiRequestOptions = {},
): Promise<EditorialV2DraftLoadResult> {
  const payload = await requestJson(draftUrl(projectId), { method: "GET" }, options);
  if (payload.draft !== null && !isDraft(payload.draft)) throw new EditorialV2DraftApiError(200, "INVALID_DRAFT_LOAD_PAYLOAD", "Draft load payload가 올바르지 않습니다.");
  return {
    ok: true,
    status: payload.draft === null ? "not_found" : "ready",
    projectId,
    draft: payload.draft,
    recoveryState: isRecord(payload.recoveryState) ? payload.recoveryState as unknown as EditorialV2DraftLoadResult["recoveryState"] : null,
    message: typeof payload.message === "string" ? payload.message : payload.draft === null ? "DRAFT_NOT_FOUND" : "DRAFT_READ",
  };
}

export async function saveEditorialV2Draft(
  projectId: string,
  input: EditorialV2DraftSaveRequest,
  options: EditorialV2DraftApiRequestOptions = {},
): Promise<EditorialV2DraftSaveResult> {
  if (input.projectId !== projectId) throw new EditorialV2DraftApiError(0, "DRAFT_PROJECT_IDENTITY_MISMATCH", "URL과 draft request의 Project ID가 다릅니다.");
  const payload = await requestJson(draftUrl(projectId), { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "save_draft", ...input }) }, options);
  if (!isSaveResult(payload.result)) throw new EditorialV2DraftApiError(200, "INVALID_DRAFT_SAVE_RESULT", "Draft save 응답이 올바르지 않습니다.");
  return payload.result;
}

export async function recoverEditorialV2Draft(
  projectId: string,
  input: EditorialV2DraftRecoveryRequest,
  options: EditorialV2DraftApiRequestOptions = {},
): Promise<EditorialV2DraftSaveResult> {
  const payload = await requestJson(draftUrl(projectId), { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(input) }, options);
  if (!isSaveResult(payload.result)) throw new EditorialV2DraftApiError(200, "INVALID_DRAFT_RECOVERY_RESULT", "Draft recovery 응답이 올바르지 않습니다.");
  return payload.result;
}
