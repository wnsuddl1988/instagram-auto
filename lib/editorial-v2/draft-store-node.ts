import { Buffer } from "node:buffer";
import { createHash } from "node:crypto";
import {
  lstat,
  mkdir,
  open,
  readFile,
  rename,
  stat,
  unlink,
} from "node:fs/promises";
import { basename, dirname, join, parse, relative, resolve } from "node:path";

import type { EditorialV2LocalStoreConfiguration, EditorialV2ProjectSnapshot } from "./contracts";
import type {
  EditorialV2DraftConflict,
  EditorialV2DraftLoadResult,
  EditorialV2DraftRecoveryRequest,
  EditorialV2DraftRecoveryState,
  EditorialV2DraftSaveRequest,
  EditorialV2DraftSaveResult,
  EditorialV2FullDraftSnapshot,
} from "./draft-contracts";
import {
  EDITORIAL_V2_DRAFT_MAX_BYTES,
  EDITORIAL_V2_DRAFT_MAX_RAW_TEXT_BYTES,
} from "./draft-contracts";
import {
  buildEditorialV2FullDraftSnapshot,
  cloneEditorialV2FullDraftSnapshot,
  validateEditorialV2Draft,
} from "./draft-snapshot";
import { assertEditorialV2SafeDataRoot, isEditorialV2PathContained } from "./persistence-data-root";
import { isEditorialV2ProjectId } from "./project-snapshot";
import { readProject } from "./project-store-node";

const PROJECTS_DIRECTORY = "projects";
const DRAFT_FILE = "draft.json";
const DRAFT_LAST_KNOWN_GOOD_FILE = "draft.last-known-good.json";
const DRAFT_QUARANTINE_DIRECTORY = "draft-quarantine";
const DRAFT_WRITE_LOCK_FILE = ".draft.write.lock";

export type EditorialV2DraftStoreErrorStatus =
  | "disabled"
  | "not_found"
  | "draft_revision_conflict"
  | "base_project_conflict"
  | "integrity_conflict"
  | "schema_conflict"
  | "validation_error"
  | "io_error";

export class EditorialV2DraftStoreError extends Error {
  constructor(
    readonly status: EditorialV2DraftStoreErrorStatus,
    message: string,
  ) {
    super(message);
    this.name = "EditorialV2DraftStoreError";
  }
}

export interface EditorialV2DraftInspection {
  readonly state: EditorialV2DraftRecoveryState;
  readonly current: EditorialV2FullDraftSnapshot | null;
  readonly lastKnownGood: EditorialV2FullDraftSnapshot | null;
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}

async function exists(path: string): Promise<boolean> {
  try { await lstat(path); return true; } catch (error) { if (isNodeError(error) && error.code === "ENOENT") return false; throw error; }
}

async function assertNoSymlinkSegments(path: string): Promise<void> {
  const resolved = resolve(path);
  const root = parse(resolved).root;
  const segments = relative(root, resolved).split(/[\\/]+/u).filter(Boolean);
  let cursor = root;
  for (const segment of segments) {
    cursor = join(cursor, segment);
    if (!await exists(cursor)) continue;
    const info = await lstat(cursor);
    if (info.isSymbolicLink()) throw new EditorialV2DraftStoreError("validation_error", "DRAFT_SYMLINK_OR_JUNCTION_FORBIDDEN");
  }
}

function assertConfiguration(configuration: EditorialV2LocalStoreConfiguration): void {
  if (!configuration.enabled) throw new EditorialV2DraftStoreError("disabled", "LOCAL_PERSISTENCE_DISABLED");
  if (!configuration.localOnly || configuration.exposeDataRoot) throw new EditorialV2DraftStoreError("validation_error", "DRAFT_CONFIGURATION_BOUNDARY_INVALID");
  try { assertEditorialV2SafeDataRoot(configuration.dataRoot, process.cwd(), process.cwd()); } catch (error) {
    throw new EditorialV2DraftStoreError("validation_error", error instanceof Error ? error.message : "DATA_ROOT_INVALID");
  }
}

function draftPaths(configuration: EditorialV2LocalStoreConfiguration, projectId: string) {
  if (!isEditorialV2ProjectId(projectId)) throw new EditorialV2DraftStoreError("validation_error", "PROJECT_ID_INVALID");
  const projectsRoot = resolve(configuration.dataRoot, PROJECTS_DIRECTORY);
  const projectDirectory = resolve(projectsRoot, projectId);
  if (!isEditorialV2PathContained(projectsRoot, projectDirectory)) throw new EditorialV2DraftStoreError("validation_error", "DRAFT_PROJECT_PATH_ESCAPE_BLOCKED");
  return {
    projectDirectory,
    current: join(projectDirectory, DRAFT_FILE),
    lastKnownGood: join(projectDirectory, DRAFT_LAST_KNOWN_GOOD_FILE),
    quarantine: join(projectDirectory, DRAFT_QUARANTINE_DIRECTORY),
    lock: join(projectDirectory, DRAFT_WRITE_LOCK_FILE),
  };
}

async function assertProjectDirectorySafe(configuration: EditorialV2LocalStoreConfiguration, projectId: string): Promise<ReturnType<typeof draftPaths>> {
  assertConfiguration(configuration);
  const paths = draftPaths(configuration, projectId);
  await assertNoSymlinkSegments(configuration.dataRoot);
  await assertNoSymlinkSegments(resolve(configuration.dataRoot, PROJECTS_DIRECTORY));
  await assertNoSymlinkSegments(paths.projectDirectory);
  if (!await exists(paths.projectDirectory)) throw new EditorialV2DraftStoreError("not_found", "PROJECT_NOT_FOUND");
  return paths;
}

async function syncDirectory(path: string): Promise<void> {
  try {
    const handle = await open(path, "r");
    try { await handle.sync(); } finally { await handle.close(); }
  } catch {
    // Windows filesystems do not all expose directory fsync.
  }
}

async function atomicWriteText(path: string, text: string, revisionTag: string): Promise<void> {
  const directory = dirname(path);
  await mkdir(directory, { recursive: true });
  await assertNoSymlinkSegments(directory);
  const temporary = join(directory, `.${basename(path)}.tmp-${process.pid}-${revisionTag}`);
  let handle: Awaited<ReturnType<typeof open>> | null = null;
  try {
    handle = await open(temporary, "wx");
    await handle.writeFile(text, { encoding: "utf8" });
    await handle.sync();
    await handle.close();
    handle = null;
    await rename(temporary, path);
    await syncDirectory(directory);
  } catch (error) {
    if (handle) await handle.close().catch(() => undefined);
    await unlink(temporary).catch(() => undefined);
    throw error;
  }
}

function countStringBytes(value: unknown): number {
  if (typeof value === "string") return Buffer.byteLength(value, "utf8");
  if (!value || typeof value !== "object") return 0;
  if (Array.isArray(value)) return value.reduce<number>((total, entry) => total + countStringBytes(entry), 0);
  return Object.values(value as Readonly<Record<string, unknown>>).reduce<number>((total, entry) => total + countStringBytes(entry), 0);
}

function draftText(snapshot: EditorialV2FullDraftSnapshot): string {
  const text = `${JSON.stringify(snapshot, null, 2)}\n`;
  if (Buffer.byteLength(text, "utf8") > EDITORIAL_V2_DRAFT_MAX_BYTES) throw new EditorialV2DraftStoreError("validation_error", "DRAFT_SIZE_LIMIT_EXCEEDED");
  if (countStringBytes(snapshot.stageStates) > EDITORIAL_V2_DRAFT_MAX_RAW_TEXT_BYTES) throw new EditorialV2DraftStoreError("validation_error", "DRAFT_RAW_TEXT_AGGREGATE_LIMIT_EXCEEDED");
  return text;
}

async function parseDraftText(text: string): Promise<EditorialV2FullDraftSnapshot> {
  let parsed: unknown;
  try { parsed = JSON.parse(text); } catch { throw new EditorialV2DraftStoreError("integrity_conflict", "DRAFT_JSON_CORRUPTED"); }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new EditorialV2DraftStoreError("schema_conflict", "DRAFT_OBJECT_REQUIRED");
  const draft = parsed as EditorialV2FullDraftSnapshot;
  const validation = await validateEditorialV2Draft(draft);
  if (!validation.valid) {
    const integrity = validation.issues.some((issue) => issue.code.includes("integrity") || issue.code.includes("hash") || issue.code.includes("json"));
    const schema = validation.issues.some((issue) => issue.code.includes("schema") || issue.code.includes("namespace"));
    throw new EditorialV2DraftStoreError(integrity ? "integrity_conflict" : schema ? "schema_conflict" : "validation_error", validation.issues.map((issue) => issue.code).join(","));
  }
  return cloneEditorialV2FullDraftSnapshot(draft);
}

async function readDraftPath(path: string): Promise<EditorialV2FullDraftSnapshot> {
  await assertNoSymlinkSegments(path);
  const info = await stat(path);
  if (!info.isFile() || info.size > EDITORIAL_V2_DRAFT_MAX_BYTES) throw new EditorialV2DraftStoreError("validation_error", "DRAFT_FILE_INVALID");
  return parseDraftText(await readFile(path, "utf8"));
}

function loadFailure(projectId: string, error: unknown): EditorialV2DraftLoadResult {
  if (error instanceof EditorialV2DraftStoreError) {
    const status = error.status === "integrity_conflict" ? "corrupted" : error.status === "draft_revision_conflict" || error.status === "base_project_conflict" ? "validation_error" : error.status;
    return { ok: false, status, projectId, draft: null, recoveryState: null, message: error.message };
  }
  return { ok: false, status: "io_error", projectId, draft: null, recoveryState: null, message: "DRAFT_READ_FAILED" };
}

function saveFailure(projectId: string | null, error: unknown): EditorialV2DraftSaveResult {
  if (error instanceof EditorialV2DraftStoreError) return { ok: false, status: error.status, projectId, draftRevision: null, draftHash: null, message: error.message, conflict: null };
  return { ok: false, status: "io_error", projectId, draftRevision: null, draftHash: null, message: "DRAFT_SAVE_FAILED", conflict: null };
}

async function readApprovedProject(configuration: EditorialV2LocalStoreConfiguration, projectId: string): Promise<EditorialV2ProjectSnapshot> {
  const result = await readProject(configuration, projectId);
  if (!result.ok || !result.snapshot) throw new EditorialV2DraftStoreError(result.status === "not_found" ? "not_found" : result.status === "integrity_conflict" ? "integrity_conflict" : "validation_error", result.message);
  if (result.snapshot.metadata.status === "archived") throw new EditorialV2DraftStoreError("validation_error", "ARCHIVED_PROJECT_IS_READ_ONLY");
  return result.snapshot;
}

function conflict(
  request: EditorialV2DraftSaveRequest,
  actualDraftRevision: number,
  actualBaseProjectRevision: number,
  code: EditorialV2DraftConflict["code"],
): EditorialV2DraftSaveResult {
  return {
    ok: false,
    status: code,
    projectId: request.projectId,
    draftRevision: actualDraftRevision,
    draftHash: null,
    message: code.toUpperCase(),
    conflict: {
      code,
      expectedDraftRevision: request.expectedDraftRevision,
      actualDraftRevision,
      expectedBaseProjectRevision: request.expectedBaseProjectRevision,
      actualBaseProjectRevision,
      autosavePaused: true,
      automaticMerge: false,
    },
  };
}

async function withDraftLock<T>(path: string, operation: () => Promise<T>): Promise<T> {
  let handle: Awaited<ReturnType<typeof open>>;
  try { handle = await open(path, "wx"); } catch (error) {
    if (isNodeError(error) && error.code === "EEXIST") throw new EditorialV2DraftStoreError("draft_revision_conflict", "DRAFT_WRITE_ALREADY_IN_PROGRESS");
    throw error;
  }
  try { return await operation(); } finally {
    await handle.close().catch(() => undefined);
    await unlink(path).catch(() => undefined);
  }
}

export async function readProjectDraft(
  configuration: EditorialV2LocalStoreConfiguration,
  projectId: string,
): Promise<EditorialV2DraftLoadResult> {
  try {
    const paths = await assertProjectDirectorySafe(configuration, projectId);
    await readApprovedProject(configuration, projectId);
    if (!await exists(paths.current)) return { ok: false, status: "not_found", projectId, draft: null, recoveryState: null, message: "DRAFT_NOT_FOUND" };
    const draft = await readDraftPath(paths.current);
    if (draft.projectId !== projectId) throw new EditorialV2DraftStoreError("integrity_conflict", "DRAFT_PROJECT_IDENTITY_MISMATCH");
    return { ok: true, status: "ready", projectId, draft, recoveryState: null, message: "DRAFT_READ" };
  } catch (error) {
    const failure = loadFailure(projectId, error);
    if (failure.status !== "corrupted") return failure;
    const inspection = await inspectProjectDraft(configuration, projectId).catch(() => null);
    return { ...failure, recoveryState: inspection?.state ?? null };
  }
}

export async function writeProjectDraft(
  configuration: EditorialV2LocalStoreConfiguration,
  request: EditorialV2DraftSaveRequest,
): Promise<EditorialV2DraftSaveResult> {
  try {
    if (!isEditorialV2ProjectId(request.projectId)) throw new EditorialV2DraftStoreError("validation_error", "PROJECT_ID_INVALID");
    const paths = await assertProjectDirectorySafe(configuration, request.projectId);
    return await withDraftLock(paths.lock, async () => {
      const approved = await readApprovedProject(configuration, request.projectId);
      let current: EditorialV2FullDraftSnapshot | null = null;
      if (await exists(paths.current)) current = await readDraftPath(paths.current);
      const actualDraftRevision = current?.draftRevision ?? 0;
      if (request.expectedDraftRevision !== actualDraftRevision) return conflict(request, actualDraftRevision, approved.revision, "draft_revision_conflict");
      if (request.expectedBaseProjectRevision !== approved.revision
        || request.draft.baseProjectRevision !== approved.revision
        || request.draft.baseApprovedCheckpointHash !== approved.integrity.canonicalHash
        || request.draft.baseApprovedStage !== approved.lastApprovedStage) {
        return conflict(request, actualDraftRevision, approved.revision, "base_project_conflict");
      }
      if (request.draft.projectId !== request.projectId || request.draft.draftRevision !== request.expectedDraftRevision) throw new EditorialV2DraftStoreError("validation_error", "DRAFT_REQUEST_IDENTITY_MISMATCH");
      const validation = await validateEditorialV2Draft(request.draft);
      if (!validation.valid) throw new EditorialV2DraftStoreError("integrity_conflict", validation.issues.map((issue) => issue.code).join(","));
      const next = await buildEditorialV2FullDraftSnapshot({
        projectId: request.projectId,
        draftRevision: actualDraftRevision + 1,
        baseProjectRevision: approved.revision,
        baseApprovedStage: approved.lastApprovedStage,
        baseApprovedCheckpointHash: approved.integrity.canonicalHash,
        savedAtIso: request.draft.savedAtIso,
        stageStates: request.draft.stageStates,
        dirtyStageIds: request.draft.dirtyStageIds,
      });
      const nextText = draftText(next);
      if (current) await atomicWriteText(paths.lastKnownGood, draftText(current), `lkg-${String(next.draftRevision).padStart(6, "0")}`);
      await atomicWriteText(paths.current, nextText, `draft-${String(next.draftRevision).padStart(6, "0")}`);
      const verified = await readDraftPath(paths.current);
      return { ok: true, status: "saved", projectId: request.projectId, draftRevision: verified.draftRevision, draftHash: verified.draftHash, message: "DRAFT_SAVED", conflict: null };
    });
  } catch (error) {
    if (error instanceof EditorialV2DraftStoreError && error.status === "draft_revision_conflict") {
      return conflict(request, request.expectedDraftRevision, request.expectedBaseProjectRevision, "draft_revision_conflict");
    }
    return saveFailure(request.projectId, error);
  }
}

export async function verifyProjectDraftIntegrity(
  configuration: EditorialV2LocalStoreConfiguration,
  projectId: string,
): Promise<{ readonly valid: boolean; readonly draftRevision: number | null; readonly draftHash: string | null; readonly issues: readonly string[] }> {
  const result = await readProjectDraft(configuration, projectId);
  if (!result.ok || !result.draft) return { valid: false, draftRevision: null, draftHash: null, issues: [result.status, result.message] };
  const validation = await validateEditorialV2Draft(result.draft);
  return { valid: validation.valid, draftRevision: result.draft.draftRevision, draftHash: result.draft.draftHash, issues: validation.issues.map((issue) => issue.code) };
}

async function optionalDraft(path: string): Promise<EditorialV2FullDraftSnapshot | null> {
  if (!await exists(path)) return null;
  try { return await readDraftPath(path); } catch { return null; }
}

export async function inspectProjectDraft(
  configuration: EditorialV2LocalStoreConfiguration,
  projectId: string,
): Promise<EditorialV2DraftInspection> {
  const paths = await assertProjectDirectorySafe(configuration, projectId);
  await readApprovedProject(configuration, projectId);
  const currentExists = await exists(paths.current);
  const lastKnownGoodExists = await exists(paths.lastKnownGood);
  const current = await optionalDraft(paths.current);
  const lastKnownGood = await optionalDraft(paths.lastKnownGood);
  return {
    state: {
      projectId,
      currentExists,
      currentValid: current !== null,
      currentDraftRevision: current?.draftRevision ?? null,
      lastKnownGoodExists,
      lastKnownGoodValid: lastKnownGood !== null,
      lastKnownGoodDraftRevision: lastKnownGood?.draftRevision ?? null,
      corruptionPreserved: currentExists && current === null,
      automaticRecoveryAllowed: false,
      ownerConfirmationRequired: true,
    },
    current,
    lastKnownGood,
  };
}

export async function recoverProjectDraftFromLastKnownGood(
  configuration: EditorialV2LocalStoreConfiguration,
  projectId: string,
  request: EditorialV2DraftRecoveryRequest,
): Promise<EditorialV2DraftSaveResult & { readonly corruptedCurrentPreserved: boolean; readonly approvedSnapshotUnchanged: boolean }> {
  try {
    if (request.action !== "recover_draft" || request.ownerConfirmed !== true) throw new EditorialV2DraftStoreError("validation_error", "DRAFT_RECOVERY_OWNER_CONFIRMATION_REQUIRED");
    if (!Number.isFinite(Date.parse(request.approvedAtIso)) || new Date(request.approvedAtIso).toISOString() !== request.approvedAtIso) throw new EditorialV2DraftStoreError("validation_error", "DRAFT_RECOVERY_TIMESTAMP_INVALID");
    const paths = await assertProjectDirectorySafe(configuration, projectId);
    return await withDraftLock(paths.lock, async () => {
      const approvedBefore = await readApprovedProject(configuration, projectId);
      const inspection = await inspectProjectDraft(configuration, projectId);
      if (!inspection.state.currentExists || inspection.state.currentValid || !inspection.lastKnownGood) throw new EditorialV2DraftStoreError("validation_error", "DRAFT_RECOVERY_NOT_REQUIRED_OR_UNAVAILABLE");
      if (request.expectedCorruptedRevision !== null && inspection.state.currentDraftRevision !== request.expectedCorruptedRevision) throw new EditorialV2DraftStoreError("draft_revision_conflict", "DRAFT_RECOVERY_REVISION_CONFLICT");
      await mkdir(paths.quarantine, { recursive: true });
      await assertNoSymlinkSegments(paths.quarantine);
      const quarantineIdentity = createHash("sha256").update(`${projectId}\0${request.approvedAtIso}`, "utf8").digest("hex").slice(0, 16);
      const quarantinePath = join(paths.quarantine, `draft-corrupted-${quarantineIdentity}.json`);
      if (await exists(quarantinePath)) throw new EditorialV2DraftStoreError("validation_error", "DRAFT_QUARANTINE_COLLISION");
      await rename(paths.current, quarantinePath);
      await syncDirectory(paths.projectDirectory);
      await atomicWriteText(paths.current, draftText(inspection.lastKnownGood), `recovery-${inspection.lastKnownGood.draftRevision}`);
      const verified = await readDraftPath(paths.current);
      const approvedAfter = await readApprovedProject(configuration, projectId);
      const approvedSnapshotUnchanged = approvedBefore.integrity.canonicalHash === approvedAfter.integrity.canonicalHash && approvedBefore.revision === approvedAfter.revision;
      if (!approvedSnapshotUnchanged) throw new EditorialV2DraftStoreError("integrity_conflict", "APPROVED_SNAPSHOT_CHANGED_DURING_DRAFT_RECOVERY");
      return { ok: true, status: "saved", projectId, draftRevision: verified.draftRevision, draftHash: verified.draftHash, message: "DRAFT_RECOVERED_FROM_LAST_KNOWN_GOOD", conflict: null, corruptedCurrentPreserved: true, approvedSnapshotUnchanged };
    });
  } catch (error) {
    const failed = saveFailure(projectId, error);
    return { ...failed, corruptedCurrentPreserved: false, approvedSnapshotUnchanged: false };
  }
}
