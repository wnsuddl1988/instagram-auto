import type {
  EditorialV2ProjectIndexEntry,
  EditorialV2ProjectSnapshot,
  EditorialV2RecoveryResult,
  EditorialV2StoreWriteResult,
} from "./contracts";
import type {
  EditorialV2ArchiveRequest,
  EditorialV2CheckpointWriteRequest,
  EditorialV2ProjectCreateRequest,
  EditorialV2RecoveryRequest,
} from "./persistence-contracts";
import { EDITORIAL_V2_APPROVED_STAGE_ORDER } from "./persistence-contracts";

const API_ROOT = "/api/editorial-v2/projects";

export class EditorialV2ProjectApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: Readonly<Record<string, unknown>>;

  constructor(status: number, code: string, message: string, details: Readonly<Record<string, unknown>> = {}) {
    super(message);
    this.name = "EditorialV2ProjectApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export interface EditorialV2ApiRequestOptions {
  readonly timeoutMs?: number;
  readonly signal?: AbortSignal;
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isSafeProjectId(value: unknown): value is string {
  return typeof value === "string"
    && value.length >= 9
    && value.length <= 80
    && /^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(value)
    && !value.includes("..");
}

function isApprovedStage(value: unknown): boolean {
  return value === null || (typeof value === "string" && (EDITORIAL_V2_APPROVED_STAGE_ORDER as readonly string[]).includes(value));
}

function isProjectIndexEntry(value: unknown): value is EditorialV2ProjectIndexEntry {
  if (!isRecord(value)) return false;
  return isSafeProjectId(value.projectId)
    && typeof value.displayName === "string"
    && (value.status === "active" || value.status === "archived")
    && Number.isSafeInteger(value.revision)
    && isApprovedStage(value.lastApprovedStage)
    && typeof value.createdAtIso === "string"
    && typeof value.updatedAtIso === "string"
    && (value.archivedAtIso === null || typeof value.archivedAtIso === "string");
}

function isProjectSnapshot(value: unknown): value is EditorialV2ProjectSnapshot {
  if (!isRecord(value) || !isRecord(value.metadata) || !isRecord(value.integrity) || !isRecord(value.persistenceCapabilities)) return false;
  return value.namespace === "shorts-editorial-os-v2-project-store"
    && value.schemaVersion === "1.0.0"
    && isSafeProjectId(value.projectId)
    && Number.isSafeInteger(value.revision)
    && isApprovedStage(value.currentStage)
    && isApprovedStage(value.lastApprovedStage)
    && Array.isArray(value.approvedCheckpoints)
    && Array.isArray(value.rawArtifacts)
    && value.integrity.algorithm === "sha256"
    && typeof value.integrity.canonicalHash === "string"
    && value.persistenceCapabilities.approvedCheckpointPersistence === true
    && value.persistenceCapabilities.fullDraftAutosave === false
    && value.persistenceCapabilities.fullWorkbenchHydration === false;
}

function isStoreWriteResult(value: unknown): value is EditorialV2StoreWriteResult {
  return isRecord(value)
    && typeof value.ok === "boolean"
    && typeof value.operation === "string"
    && (value.projectId === null || isSafeProjectId(value.projectId))
    && (value.revision === null || Number.isSafeInteger(value.revision))
    && (value.integrityHash === null || typeof value.integrityHash === "string")
    && typeof value.status === "string"
    && typeof value.message === "string";
}

function assertRelativeApiUrl(url: string): void {
  if (!url.startsWith(`${API_ROOT}`) || url.startsWith("//") || url.includes("://")) throw new EditorialV2ProjectApiError(0, "EXTERNAL_URL_BLOCKED", "Same-origin relative project API URL만 허용됩니다.");
}

async function requestJson(
  url: string,
  init: RequestInit,
  options: EditorialV2ApiRequestOptions,
): Promise<Readonly<Record<string, unknown>>> {
  assertRelativeApiUrl(url);
  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort("EDITORIAL_V2_API_TIMEOUT"), options.timeoutMs ?? 10_000);
  const externalAbort = (): void => controller.abort(options.signal?.reason);
  options.signal?.addEventListener("abort", externalAbort, { once: true });
  try {
    const response = await fetch(url, { ...init, signal: controller.signal, headers: { Accept: "application/json", ...(init.body ? { "Content-Type": "application/json" } : {}), ...init.headers } });
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.toLowerCase().startsWith("application/json")) throw new EditorialV2ProjectApiError(response.status, "INVALID_RESPONSE_CONTENT_TYPE", "Project API 응답 형식이 올바르지 않습니다.");
    const payload: unknown = await response.json();
    if (!isRecord(payload) || typeof payload.ok !== "boolean") throw new EditorialV2ProjectApiError(response.status, "INVALID_RESPONSE_SHAPE", "Project API 응답 구조가 올바르지 않습니다.");
    if (!response.ok || payload.ok !== true) {
      const code = typeof payload.code === "string" ? payload.code : "PROJECT_API_REQUEST_FAILED";
      const message = typeof payload.message === "string" ? payload.message : "Project API 요청이 실패했습니다.";
      throw new EditorialV2ProjectApiError(response.status, code, message, payload);
    }
    return payload;
  } finally {
    globalThis.clearTimeout(timeout);
    options.signal?.removeEventListener("abort", externalAbort);
  }
}

export async function listEditorialV2Projects(
  options: EditorialV2ApiRequestOptions = {},
): Promise<readonly EditorialV2ProjectIndexEntry[]> {
  const payload = await requestJson(API_ROOT, { method: "GET" }, options);
  if (!Array.isArray(payload.projects) || !payload.projects.every(isProjectIndexEntry)) throw new EditorialV2ProjectApiError(200, "INVALID_PROJECT_LIST", "프로젝트 목록 응답이 올바르지 않습니다.");
  return payload.projects;
}

export async function createEditorialV2Project(
  input: EditorialV2ProjectCreateRequest,
  options: EditorialV2ApiRequestOptions = {},
): Promise<EditorialV2StoreWriteResult> {
  const payload = await requestJson(API_ROOT, { method: "POST", body: JSON.stringify({ action: "create", ...input }) }, options);
  if (!isStoreWriteResult(payload.result)) throw new EditorialV2ProjectApiError(200, "INVALID_CREATE_RESULT", "프로젝트 생성 응답이 올바르지 않습니다.");
  return payload.result;
}

export async function loadEditorialV2Project(
  projectId: string,
  options: EditorialV2ApiRequestOptions = {},
): Promise<EditorialV2ProjectSnapshot> {
  if (!isSafeProjectId(projectId)) throw new EditorialV2ProjectApiError(0, "PROJECT_ID_INVALID", "Project ID가 올바르지 않습니다.");
  const payload = await requestJson(`${API_ROOT}/${encodeURIComponent(projectId)}`, { method: "GET" }, options);
  if (!isProjectSnapshot(payload.snapshot)) throw new EditorialV2ProjectApiError(200, "INVALID_PROJECT_SNAPSHOT", "프로젝트 snapshot 응답이 올바르지 않습니다.");
  return payload.snapshot;
}

export async function saveEditorialV2ApprovedCheckpoint(
  projectId: string,
  input: EditorialV2CheckpointWriteRequest,
  options: EditorialV2ApiRequestOptions = {},
): Promise<EditorialV2StoreWriteResult> {
  if (!isSafeProjectId(projectId)) throw new EditorialV2ProjectApiError(0, "PROJECT_ID_INVALID", "Project ID가 올바르지 않습니다.");
  const payload = await requestJson(`${API_ROOT}/${encodeURIComponent(projectId)}`, { method: "PUT", body: JSON.stringify({ action: "save_approved_checkpoint", ...input }) }, options);
  if (!isStoreWriteResult(payload.result)) throw new EditorialV2ProjectApiError(200, "INVALID_SAVE_RESULT", "Checkpoint 저장 응답이 올바르지 않습니다.");
  return payload.result;
}

export async function archiveEditorialV2Project(
  projectId: string,
  input: EditorialV2ArchiveRequest,
  options: EditorialV2ApiRequestOptions = {},
): Promise<EditorialV2StoreWriteResult> {
  if (!isSafeProjectId(projectId)) throw new EditorialV2ProjectApiError(0, "PROJECT_ID_INVALID", "Project ID가 올바르지 않습니다.");
  const payload = await requestJson(`${API_ROOT}/${encodeURIComponent(projectId)}`, { method: "PATCH", body: JSON.stringify(input) }, options);
  if (!isStoreWriteResult(payload.result)) throw new EditorialV2ProjectApiError(200, "INVALID_ARCHIVE_RESULT", "Archive 응답이 올바르지 않습니다.");
  return payload.result;
}

export async function requestEditorialV2Recovery(
  projectId: string,
  input: EditorialV2RecoveryRequest,
  options: EditorialV2ApiRequestOptions = {},
): Promise<EditorialV2RecoveryResult> {
  if (!isSafeProjectId(projectId)) throw new EditorialV2ProjectApiError(0, "PROJECT_ID_INVALID", "Project ID가 올바르지 않습니다.");
  const payload = await requestJson(`${API_ROOT}/${encodeURIComponent(projectId)}`, { method: "PATCH", body: JSON.stringify(input) }, options);
  if (!isRecord(payload.result) || typeof payload.result.ok !== "boolean" || payload.result.projectId !== projectId || typeof payload.result.currentCorruptionPreserved !== "boolean" || typeof payload.result.ownerConfirmed !== "boolean" || typeof payload.result.status !== "string" || typeof payload.result.message !== "string") throw new EditorialV2ProjectApiError(200, "INVALID_RECOVERY_RESULT", "Recovery 응답이 올바르지 않습니다.");
  return payload.result as unknown as EditorialV2RecoveryResult;
}
