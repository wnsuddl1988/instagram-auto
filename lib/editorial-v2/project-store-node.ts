import { Buffer } from "node:buffer";
import { constants as fsConstants } from "node:fs";
import {
  access,
  lstat,
  mkdir,
  open,
  readFile,
  readdir,
  rename,
  stat,
  unlink,
  writeFile,
} from "node:fs/promises";
import { basename, dirname, join, parse, relative, resolve } from "node:path";

import type {
  EditorialV2LocalStoreConfiguration,
  EditorialV2PersistenceStatus,
  EditorialV2ProjectIndex,
  EditorialV2ProjectIndexEntry,
  EditorialV2ProjectSnapshot,
  EditorialV2StoreReadResult,
  EditorialV2StoreWriteResult,
} from "./contracts";
import type {
  EditorialV2CheckpointWriteRequest,
  EditorialV2ProjectCreateRequest,
} from "./persistence-contracts";
import {
  EDITORIAL_V2_MAX_SNAPSHOT_BYTES,
  EDITORIAL_V2_PERSISTENCE_NAMESPACE,
  EDITORIAL_V2_PERSISTENCE_SCHEMA_VERSION,
  getEditorialV2ApprovedStageIndex,
} from "./persistence-contracts";
import {
  assertEditorialV2SafeDataRoot,
  isEditorialV2PathContained,
} from "./persistence-data-root";
import {
  buildEditorialV2ApprovedCheckpoint,
  buildEditorialV2ProjectId,
  buildEditorialV2ProjectSnapshot,
  buildEditorialV2RawArtifactRecord,
  cloneEditorialV2ProjectSnapshot,
  isEditorialV2ProjectId,
  validateEditorialV2ProjectSnapshot,
} from "./project-snapshot";
import {
  validateEditorialV2CheckpointWriteRequest,
  validateEditorialV2LocalStoreConfiguration,
  validateEditorialV2ProjectCreateRequest,
  validateEditorialV2SnapshotForStore,
} from "./project-store-validation";

const INDEX_FILE = "index.json";
const PROJECTS_DIRECTORY = "projects";
const SNAPSHOT_FILE = "snapshot.json";
const LAST_KNOWN_GOOD_FILE = "snapshot.last-known-good.json";
const HISTORY_DIRECTORY = "history";
const QUARANTINE_DIRECTORY = "quarantine";

export class EditorialV2StoreError extends Error {
  readonly status: EditorialV2PersistenceStatus;

  constructor(status: EditorialV2PersistenceStatus, message: string) {
    super(message);
    this.name = "EditorialV2StoreError";
    this.status = status;
  }
}

export interface EditorialV2ProjectCandidateInspection {
  readonly current: EditorialV2ProjectSnapshot | null;
  readonly currentValid: boolean;
  readonly currentCorrupted: boolean;
  readonly lastKnownGood: EditorialV2ProjectSnapshot | null;
  readonly validHistory: readonly EditorialV2ProjectSnapshot[];
  readonly indexEntry: EditorialV2ProjectIndexEntry | null;
}

function makeIndex(projects: readonly EditorialV2ProjectIndexEntry[]): EditorialV2ProjectIndex {
  return {
    namespace: EDITORIAL_V2_PERSISTENCE_NAMESPACE,
    schemaVersion: EDITORIAL_V2_PERSISTENCE_SCHEMA_VERSION,
    indexVersion: 1,
    projects: projects.map((entry) => ({ ...entry })),
  };
}

function resultError(
  operation: EditorialV2StoreWriteResult["operation"],
  error: unknown,
  projectId: string | null = null,
): EditorialV2StoreWriteResult {
  const status = error instanceof EditorialV2StoreError ? error.status : "storage_error";
  return { ok: false, operation, projectId, revision: null, integrityHash: null, status, message: error instanceof Error ? error.message : "LOCAL_STORE_OPERATION_FAILED" };
}

function readError(error: unknown, projectId: string | null): EditorialV2StoreReadResult {
  const status = error instanceof EditorialV2StoreError ? error.status : "storage_error";
  return { ok: false, projectId, snapshot: null, status, message: error instanceof Error ? error.message : "LOCAL_STORE_READ_FAILED" };
}

async function exists(path: string): Promise<boolean> {
  try {
    await access(path, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
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
    if (info.isSymbolicLink()) throw new EditorialV2StoreError("validation_error", "SYMLINK_OR_JUNCTION_PATH_FORBIDDEN");
  }
}

function assertConfiguration(configuration: EditorialV2LocalStoreConfiguration): void {
  const validation = validateEditorialV2LocalStoreConfiguration(configuration);
  if (!validation.valid) {
    const disabled = validation.issues.some((issue) => issue.code === "persistence_disabled");
    throw new EditorialV2StoreError(disabled ? "disabled" : "validation_error", validation.issues.map((issue) => issue.code).join(","));
  }
  try {
    assertEditorialV2SafeDataRoot(configuration.dataRoot, process.cwd(), process.cwd());
  } catch (error) {
    throw new EditorialV2StoreError("validation_error", error instanceof Error ? error.message : "DATA_ROOT_INVALID");
  }
}

async function ensureStoreRoot(configuration: EditorialV2LocalStoreConfiguration): Promise<void> {
  assertConfiguration(configuration);
  await assertNoSymlinkSegments(configuration.dataRoot);
  await mkdir(join(configuration.dataRoot, PROJECTS_DIRECTORY), { recursive: true });
  await assertNoSymlinkSegments(configuration.dataRoot);
  await assertNoSymlinkSegments(join(configuration.dataRoot, PROJECTS_DIRECTORY));
}

function projectPaths(configuration: EditorialV2LocalStoreConfiguration, projectId: string) {
  if (!isEditorialV2ProjectId(projectId)) throw new EditorialV2StoreError("validation_error", "PROJECT_ID_INVALID");
  const projectDirectory = resolve(configuration.dataRoot, PROJECTS_DIRECTORY, projectId);
  if (!isEditorialV2PathContained(join(configuration.dataRoot, PROJECTS_DIRECTORY), projectDirectory)) throw new EditorialV2StoreError("validation_error", "PROJECT_PATH_ESCAPE_BLOCKED");
  return {
    projectDirectory,
    snapshot: join(projectDirectory, SNAPSHOT_FILE),
    lastKnownGood: join(projectDirectory, LAST_KNOWN_GOOD_FILE),
    history: join(projectDirectory, HISTORY_DIRECTORY),
    quarantine: join(projectDirectory, QUARANTINE_DIRECTORY),
  };
}

async function syncDirectory(path: string): Promise<void> {
  try {
    const handle = await open(path, "r");
    try { await handle.sync(); } finally { await handle.close(); }
  } catch {
    // Directory fsync is not available on every supported Windows filesystem.
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

function snapshotText(snapshot: EditorialV2ProjectSnapshot): string {
  const text = `${JSON.stringify(snapshot, null, 2)}\n`;
  if (Buffer.byteLength(text, "utf8") > EDITORIAL_V2_MAX_SNAPSHOT_BYTES) throw new EditorialV2StoreError("validation_error", "SNAPSHOT_SIZE_LIMIT_EXCEEDED");
  return text;
}

function indexEntry(snapshot: EditorialV2ProjectSnapshot): EditorialV2ProjectIndexEntry {
  return {
    projectId: snapshot.projectId,
    displayName: snapshot.metadata.displayName,
    status: snapshot.metadata.status,
    revision: snapshot.revision,
    lastApprovedStage: snapshot.lastApprovedStage,
    createdAtIso: snapshot.createdAtIso,
    updatedAtIso: snapshot.updatedAtIso,
    archivedAtIso: snapshot.metadata.archivedAtIso,
  };
}

async function readIndex(configuration: EditorialV2LocalStoreConfiguration): Promise<EditorialV2ProjectIndex> {
  const path = join(configuration.dataRoot, INDEX_FILE);
  if (!await exists(path)) return makeIndex([]);
  await assertNoSymlinkSegments(path);
  let parsed: unknown;
  try { parsed = JSON.parse(await readFile(path, "utf8")); } catch { throw new EditorialV2StoreError("integrity_conflict", "PROJECT_INDEX_CORRUPTED"); }
  if (!parsed || typeof parsed !== "object") throw new EditorialV2StoreError("schema_conflict", "PROJECT_INDEX_SCHEMA_INVALID");
  const candidate = parsed as Partial<EditorialV2ProjectIndex>;
  if (candidate.namespace !== EDITORIAL_V2_PERSISTENCE_NAMESPACE || candidate.schemaVersion !== EDITORIAL_V2_PERSISTENCE_SCHEMA_VERSION || candidate.indexVersion !== 1 || !Array.isArray(candidate.projects)) throw new EditorialV2StoreError("schema_conflict", "PROJECT_INDEX_SCHEMA_MISMATCH");
  for (const entry of candidate.projects) {
    if (!entry || typeof entry !== "object" || !isEditorialV2ProjectId(entry.projectId) || typeof entry.displayName !== "string" || (entry.status !== "active" && entry.status !== "archived") || !Number.isSafeInteger(entry.revision)) throw new EditorialV2StoreError("integrity_conflict", "PROJECT_INDEX_ENTRY_INVALID");
  }
  return makeIndex(candidate.projects);
}

async function writeIndex(configuration: EditorialV2LocalStoreConfiguration, index: EditorialV2ProjectIndex, revisionTag: string): Promise<void> {
  await atomicWriteText(join(configuration.dataRoot, INDEX_FILE), `${JSON.stringify(index, null, 2)}\n`, `index-${revisionTag}`);
}

function parseSnapshot(text: string): EditorialV2ProjectSnapshot {
  let parsed: unknown;
  try { parsed = JSON.parse(text); } catch { throw new EditorialV2StoreError("integrity_conflict", "PROJECT_SNAPSHOT_CORRUPTED"); }
  const snapshot = parsed as EditorialV2ProjectSnapshot;
  if (snapshot.namespace !== EDITORIAL_V2_PERSISTENCE_NAMESPACE || snapshot.schemaVersion !== EDITORIAL_V2_PERSISTENCE_SCHEMA_VERSION) throw new EditorialV2StoreError("schema_conflict", "PROJECT_SNAPSHOT_SCHEMA_MISMATCH");
  const validation = validateEditorialV2SnapshotForStore(snapshot);
  if (!validation.valid) {
    const integrity = validation.issues.some((issue) => issue.code.includes("hash") || issue.code.includes("integrity"));
    throw new EditorialV2StoreError(integrity ? "integrity_conflict" : "validation_error", validation.issues.map((issue) => issue.code).join(","));
  }
  return cloneEditorialV2ProjectSnapshot(snapshot);
}

async function readSnapshotPath(path: string): Promise<EditorialV2ProjectSnapshot> {
  await assertNoSymlinkSegments(path);
  const info = await stat(path);
  if (!info.isFile() || info.size > EDITORIAL_V2_MAX_SNAPSHOT_BYTES) throw new EditorialV2StoreError("validation_error", "SNAPSHOT_FILE_INVALID");
  return parseSnapshot(await readFile(path, "utf8"));
}

async function writeSnapshotTransaction(
  configuration: EditorialV2LocalStoreConfiguration,
  previous: EditorialV2ProjectSnapshot,
  next: EditorialV2ProjectSnapshot,
  nextIndex: EditorialV2ProjectIndex,
): Promise<void> {
  const paths = projectPaths(configuration, next.projectId);
  const previousText = snapshotText(previous);
  const nextText = snapshotText(next);
  const revisionTag = String(next.revision).padStart(6, "0");
  let currentReplaced = false;
  await atomicWriteText(paths.lastKnownGood, previousText, `lkg-${revisionTag}`);
  await atomicWriteText(join(paths.history, `revision-${revisionTag}.json`), nextText, `history-${revisionTag}`);
  try {
    await atomicWriteText(paths.snapshot, nextText, `snapshot-${revisionTag}`);
    currentReplaced = true;
    await writeIndex(configuration, nextIndex, revisionTag);
  } catch (error) {
    if (currentReplaced) await atomicWriteText(paths.snapshot, previousText, `rollback-${revisionTag}`).catch(() => undefined);
    throw error;
  }
}

export async function createProject(
  configuration: EditorialV2LocalStoreConfiguration,
  input: EditorialV2ProjectCreateRequest,
): Promise<EditorialV2StoreWriteResult> {
  try {
    await ensureStoreRoot(configuration);
    const requestValidation = validateEditorialV2ProjectCreateRequest(input);
    if (!requestValidation.valid) throw new EditorialV2StoreError("validation_error", requestValidation.issues.map((issue) => issue.code).join(","));
    const projectId = buildEditorialV2ProjectId(input.displayName, input.creationTimestampIso);
    const index = await readIndex(configuration);
    const paths = projectPaths(configuration, projectId);
    if (index.projects.some((entry) => entry.projectId === projectId) || await exists(paths.projectDirectory)) throw new EditorialV2StoreError("validation_error", "PROJECT_ID_ALREADY_EXISTS");
    await mkdir(paths.history, { recursive: true });
    await mkdir(paths.quarantine, { recursive: true });
    await assertNoSymlinkSegments(paths.projectDirectory);
    const metadata = {
      displayName: input.displayName.trim(),
      status: "active" as const,
      createdAtIso: input.creationTimestampIso,
      updatedAtIso: input.creationTimestampIso,
      archivedAtIso: null,
    };
    const snapshot = buildEditorialV2ProjectSnapshot({ projectId, metadata, createdAtIso: input.creationTimestampIso, updatedAtIso: input.creationTimestampIso, revision: 0, approvedCheckpoints: [], rawArtifacts: [], currentStage: null });
    const text = snapshotText(snapshot);
    await atomicWriteText(join(paths.history, "revision-000000.json"), text, "create-history");
    await atomicWriteText(paths.lastKnownGood, text, "create-lkg");
    await atomicWriteText(paths.snapshot, text, "create-current");
    await writeIndex(configuration, makeIndex([...index.projects, indexEntry(snapshot)]), "create");
    return { ok: true, operation: "create", projectId, revision: 0, integrityHash: snapshot.integrity.canonicalHash, status: "ready", message: "PROJECT_CREATED" };
  } catch (error) {
    return resultError("create", error);
  }
}

export async function listProjects(
  configuration: EditorialV2LocalStoreConfiguration,
  options: { readonly includeArchived?: boolean } = {},
): Promise<readonly EditorialV2ProjectIndexEntry[]> {
  await ensureStoreRoot(configuration);
  const index = await readIndex(configuration);
  return index.projects.filter((entry) => options.includeArchived || entry.status !== "archived").map((entry) => ({ ...entry }));
}

export async function readProject(
  configuration: EditorialV2LocalStoreConfiguration,
  projectId: string,
): Promise<EditorialV2StoreReadResult> {
  try {
    await ensureStoreRoot(configuration);
    const paths = projectPaths(configuration, projectId);
    if (!await exists(paths.snapshot)) throw new EditorialV2StoreError("not_found", "PROJECT_NOT_FOUND");
    const snapshot = await readSnapshotPath(paths.snapshot);
    if (snapshot.projectId !== projectId) throw new EditorialV2StoreError("integrity_conflict", "PROJECT_IDENTITY_MISMATCH");
    return { ok: true, projectId, snapshot, status: "ready", message: "PROJECT_READ" };
  } catch (error) {
    return readError(error, projectId);
  }
}

export async function writeProjectCheckpoint(
  configuration: EditorialV2LocalStoreConfiguration,
  projectId: string,
  input: EditorialV2CheckpointWriteRequest,
): Promise<EditorialV2StoreWriteResult> {
  try {
    await ensureStoreRoot(configuration);
    const requestValidation = validateEditorialV2CheckpointWriteRequest(input);
    if (!requestValidation.valid) throw new EditorialV2StoreError("validation_error", requestValidation.issues.map((issue) => issue.code).join(","));
    const currentResult = await readProject(configuration, projectId);
    if (!currentResult.ok || !currentResult.snapshot) throw new EditorialV2StoreError(currentResult.status, currentResult.message);
    const current = currentResult.snapshot;
    if (current.metadata.status === "archived") throw new EditorialV2StoreError("validation_error", "ARCHIVED_PROJECT_IS_READ_ONLY");
    const currentStageIndex = current.lastApprovedStage === null ? -1 : getEditorialV2ApprovedStageIndex(current.lastApprovedStage);
    const requestedStageIndex = getEditorialV2ApprovedStageIndex(input.checkpoint.stageId);
    if (requestedStageIndex < currentStageIndex || requestedStageIndex > currentStageIndex + 1) throw new EditorialV2StoreError("validation_error", "CHECKPOINT_STAGE_ORDER_INVALID");
    const checkpoint = buildEditorialV2ApprovedCheckpoint(input.checkpoint);
    const checkpoints = current.approvedCheckpoints.filter((entry) => entry.stageId !== checkpoint.stageId).map((entry) => ({ ...entry, payload: entry.payload }));
    checkpoints.push(checkpoint);
    checkpoints.sort((left, right) => getEditorialV2ApprovedStageIndex(left.stageId) - getEditorialV2ApprovedStageIndex(right.stageId));
    const rawById = new Map(current.rawArtifacts.map((entry) => [entry.artifactId, { ...entry }]));
    for (const draft of input.rawArtifacts) {
      const record = buildEditorialV2RawArtifactRecord(draft);
      const existing = rawById.get(record.artifactId);
      if (existing && existing.rawHash !== record.rawHash) throw new EditorialV2StoreError("integrity_conflict", "RAW_ARTIFACT_ID_CONFLICT");
      rawById.set(record.artifactId, record);
    }
    const updatedAtIso = input.checkpoint.approvedAtIso;
    const next = buildEditorialV2ProjectSnapshot({
      projectId,
      metadata: { ...current.metadata, updatedAtIso },
      createdAtIso: current.createdAtIso,
      updatedAtIso,
      revision: current.revision + 1,
      approvedCheckpoints: checkpoints,
      rawArtifacts: [...rawById.values()],
      currentStage: checkpoint.stageId,
    });
    const index = await readIndex(configuration);
    const nextIndex = makeIndex([...index.projects.filter((entry) => entry.projectId !== projectId), indexEntry(next)]);
    await writeSnapshotTransaction(configuration, current, next, nextIndex);
    return { ok: true, operation: "checkpoint", projectId, revision: next.revision, integrityHash: next.integrity.canonicalHash, status: "ready", message: "APPROVED_CHECKPOINT_SAVED" };
  } catch (error) {
    return resultError("checkpoint", error, projectId);
  }
}

export async function archiveProject(
  configuration: EditorialV2LocalStoreConfiguration,
  projectId: string,
  input: { readonly ownerConfirmed: boolean; readonly archivedAtIso: string },
): Promise<EditorialV2StoreWriteResult> {
  try {
    if (input.ownerConfirmed !== true) throw new EditorialV2StoreError("validation_error", "ARCHIVE_OWNER_CONFIRMATION_REQUIRED");
    const currentResult = await readProject(configuration, projectId);
    if (!currentResult.ok || !currentResult.snapshot) throw new EditorialV2StoreError(currentResult.status, currentResult.message);
    const current = currentResult.snapshot;
    const date = new Date(input.archivedAtIso);
    if (Number.isNaN(date.getTime()) || date.toISOString() !== input.archivedAtIso) throw new EditorialV2StoreError("validation_error", "ARCHIVE_TIMESTAMP_INVALID");
    const next = buildEditorialV2ProjectSnapshot({
      projectId,
      metadata: { ...current.metadata, status: "archived", updatedAtIso: input.archivedAtIso, archivedAtIso: input.archivedAtIso },
      createdAtIso: current.createdAtIso,
      updatedAtIso: input.archivedAtIso,
      revision: current.revision + 1,
      approvedCheckpoints: current.approvedCheckpoints,
      rawArtifacts: current.rawArtifacts,
      currentStage: current.currentStage,
    });
    const index = await readIndex(configuration);
    await writeSnapshotTransaction(configuration, current, next, makeIndex([...index.projects.filter((entry) => entry.projectId !== projectId), indexEntry(next)]));
    return { ok: true, operation: "archive", projectId, revision: next.revision, integrityHash: next.integrity.canonicalHash, status: "ready", message: "PROJECT_ARCHIVED_WITHOUT_DELETE" };
  } catch (error) {
    return resultError("archive", error, projectId);
  }
}

export async function verifyProjectIntegrity(
  configuration: EditorialV2LocalStoreConfiguration,
  projectId: string,
): Promise<ReturnType<typeof validateEditorialV2ProjectSnapshot>> {
  const result = await readProject(configuration, projectId);
  if (!result.ok || !result.snapshot) return { valid: false, blockingIssueCount: 1, warningCount: 0, issues: [{ code: result.status, fieldPath: "snapshot", message: result.message, blocking: true }] };
  return validateEditorialV2ProjectSnapshot(result.snapshot);
}

async function readOptionalValidSnapshot(path: string): Promise<EditorialV2ProjectSnapshot | null> {
  if (!await exists(path)) return null;
  try { return await readSnapshotPath(path); } catch { return null; }
}

export async function inspectEditorialV2ProjectCandidates(
  configuration: EditorialV2LocalStoreConfiguration,
  projectId: string,
): Promise<EditorialV2ProjectCandidateInspection> {
  await ensureStoreRoot(configuration);
  const paths = projectPaths(configuration, projectId);
  const currentExists = await exists(paths.snapshot);
  const current = await readOptionalValidSnapshot(paths.snapshot);
  const lastKnownGood = await readOptionalValidSnapshot(paths.lastKnownGood);
  const validHistory: EditorialV2ProjectSnapshot[] = [];
  if (await exists(paths.history)) {
    const names = (await readdir(paths.history)).filter((name) => /^revision-\d{6}\.json$/u.test(name)).sort().reverse();
    for (const name of names) {
      const candidate = await readOptionalValidSnapshot(join(paths.history, name));
      if (candidate) validHistory.push(candidate);
    }
  }
  const index = await readIndex(configuration);
  return {
    current,
    currentValid: current !== null,
    currentCorrupted: currentExists && current === null,
    lastKnownGood,
    validHistory,
    indexEntry: index.projects.find((entry) => entry.projectId === projectId) ?? null,
  };
}

export async function restoreEditorialV2ProjectCandidate(
  configuration: EditorialV2LocalStoreConfiguration,
  projectId: string,
  candidate: EditorialV2ProjectSnapshot,
  approvedAtIso: string,
): Promise<EditorialV2StoreWriteResult> {
  try {
    await ensureStoreRoot(configuration);
    if (candidate.projectId !== projectId || !validateEditorialV2ProjectSnapshot(candidate).valid) throw new EditorialV2StoreError("integrity_conflict", "RECOVERY_CANDIDATE_INVALID");
    const inspection = await inspectEditorialV2ProjectCandidates(configuration, projectId);
    const baseRevision = Math.max(candidate.revision, inspection.indexEntry?.revision ?? 0);
    const next = buildEditorialV2ProjectSnapshot({
      projectId,
      metadata: { ...candidate.metadata, updatedAtIso: approvedAtIso },
      createdAtIso: candidate.createdAtIso,
      updatedAtIso: approvedAtIso,
      revision: baseRevision + 1,
      approvedCheckpoints: candidate.approvedCheckpoints,
      rawArtifacts: candidate.rawArtifacts,
      currentStage: candidate.currentStage,
    });
    const paths = projectPaths(configuration, projectId);
    if (await exists(paths.snapshot)) {
      await mkdir(paths.quarantine, { recursive: true });
      const corruptedText = await readFile(paths.snapshot, "utf8");
      await atomicWriteText(join(paths.quarantine, `corrupt-before-recovery-${String(next.revision).padStart(6, "0")}.json`), corruptedText, `quarantine-${next.revision}`);
    }
    const nextText = snapshotText(next);
    await atomicWriteText(join(paths.history, `revision-${String(next.revision).padStart(6, "0")}.json`), nextText, `recovery-history-${next.revision}`);
    await atomicWriteText(paths.snapshot, nextText, `recovery-current-${next.revision}`);
    const index = await readIndex(configuration);
    await writeIndex(configuration, makeIndex([...index.projects.filter((entry) => entry.projectId !== projectId), indexEntry(next)]), `recovery-${next.revision}`);
    return { ok: true, operation: "recovery", projectId, revision: next.revision, integrityHash: next.integrity.canonicalHash, status: "ready", message: "RECOVERY_COMPLETED_CORRUPTED_CURRENT_PRESERVED" };
  } catch (error) {
    return resultError("recovery", error, projectId);
  }
}
