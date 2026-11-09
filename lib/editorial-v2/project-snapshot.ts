import { createHash } from "node:crypto";

import type {
  EditorialV2ApprovedCheckpoint,
  EditorialV2ApprovedStageId,
  EditorialV2JsonValue,
  EditorialV2PersistenceValidationIssue,
  EditorialV2PersistenceValidationSummary,
  EditorialV2ProjectId,
  EditorialV2ProjectMetadata,
  EditorialV2ProjectSnapshot,
  EditorialV2RawArtifactRecord,
} from "./contracts";
import {
  EDITORIAL_V2_MAX_PROJECT_ID_LENGTH,
  EDITORIAL_V2_PERSISTENCE_NAMESPACE,
  EDITORIAL_V2_PERSISTENCE_SCHEMA_VERSION,
  getEditorialV2ApprovedStageIndex,
  getEditorialV2PersistenceCapability,
  isEditorialV2ApprovedStageId,
} from "./persistence-contracts";

const WINDOWS_RESERVED_NAME = /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])$/iu;

export interface BuildEditorialV2ProjectSnapshotInput {
  readonly projectId: EditorialV2ProjectId;
  readonly metadata: EditorialV2ProjectMetadata;
  readonly createdAtIso: string;
  readonly updatedAtIso: string;
  readonly revision: number;
  readonly approvedCheckpoints: readonly EditorialV2ApprovedCheckpoint[];
  readonly rawArtifacts: readonly EditorialV2RawArtifactRecord[];
  readonly currentStage?: EditorialV2ApprovedStageId | null;
}

function sha256Text(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function assertIsoTimestamp(value: string, field: string): void {
  if (!isCanonicalIsoTimestamp(value)) {
    throw new Error(`${field.toUpperCase()}_INVALID_ISO_TIMESTAMP`);
  }
}

function isCanonicalIsoTimestamp(value: unknown): value is string {
  if (typeof value !== "string" || !value) return false;
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString() === value;
}

function assertJsonValue(value: unknown, path: string, ancestors: Set<object>): asserts value is EditorialV2JsonValue {
  if (value === null || typeof value === "string" || typeof value === "boolean") return;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error(`JSON_NON_FINITE_NUMBER:${path}`);
    return;
  }
  if (typeof value !== "object") throw new Error(`JSON_UNSUPPORTED_VALUE:${path}`);
  if (ancestors.has(value)) throw new Error(`JSON_CYCLE:${path}`);
  const nextAncestors = new Set(ancestors);
  nextAncestors.add(value);
  if (Array.isArray(value)) {
    value.forEach((entry, index) => assertJsonValue(entry, `${path}[${index}]`, nextAncestors));
    return;
  }
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) throw new Error(`JSON_UNSUPPORTED_PROTOTYPE:${path}`);
  for (const [key, entry] of Object.entries(value)) assertJsonValue(entry, `${path}.${key}`, nextAncestors);
}

function stableSerialize(value: EditorialV2JsonValue): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableSerialize).join(",")}]`;
  const record = value as Readonly<Record<string, EditorialV2JsonValue>>;
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableSerialize(record[key])}`).join(",")}}`;
}

function cloneJsonValue(value: EditorialV2JsonValue): EditorialV2JsonValue {
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map(cloneJsonValue);
  return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, cloneJsonValue(entry)]));
}

export function buildEditorialV2ProjectId(requestedName: string, creationTimestampIso: string): EditorialV2ProjectId {
  assertIsoTimestamp(creationTimestampIso, "creationTimestampIso");
  const cleanName = requestedName.replace(/[\u0000-\u001F\u007F]/gu, " ").replace(/\s+/gu, " ").trim();
  if (!cleanName) throw new Error("PROJECT_NAME_REQUIRED");
  let slug = cleanName.normalize("NFKD").toLowerCase()
    .replace(/[\u0300-\u036f]/gu, "")
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/^-+|-+$/gu, "")
    .replace(/-+/gu, "-");
  if (!slug || WINDOWS_RESERVED_NAME.test(slug)) slug = "project";
  const suffix = sha256Text(`${cleanName}\0${creationTimestampIso}`).slice(0, 12);
  const maxSlug = EDITORIAL_V2_MAX_PROJECT_ID_LENGTH - suffix.length - 1;
  slug = slug.slice(0, maxSlug).replace(/-+$/gu, "") || "project";
  return `${slug}-${suffix}`;
}

export function isEditorialV2ProjectId(value: unknown): value is EditorialV2ProjectId {
  if (typeof value !== "string" || value.length < 9 || value.length > EDITORIAL_V2_MAX_PROJECT_ID_LENGTH) return false;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(value) || value.includes("..") || value.includes("/") || value.includes("\\")) return false;
  return !WINDOWS_RESERVED_NAME.test(value);
}

export function buildEditorialV2RawArtifactRecord(input: {
  readonly artifactId: string;
  readonly artifactKind: string;
  readonly sourceStage: EditorialV2ApprovedStageId;
  readonly rawText: string;
  readonly normalizedHash?: string | null;
  readonly importedAtIso: string;
  readonly providerLabel?: string | null;
  readonly modelLabel?: string | null;
  readonly promptVersion?: string | null;
}): EditorialV2RawArtifactRecord {
  assertIsoTimestamp(input.importedAtIso, "importedAtIso");
  if (!/^[a-z0-9][a-z0-9-]{2,79}$/u.test(input.artifactId)) throw new Error("RAW_ARTIFACT_ID_INVALID");
  if (!input.artifactKind.trim() || !isEditorialV2ApprovedStageId(input.sourceStage)) throw new Error("RAW_ARTIFACT_METADATA_INVALID");
  return {
    artifactId: input.artifactId,
    artifactKind: input.artifactKind.trim(),
    sourceStage: input.sourceStage,
    rawText: input.rawText,
    rawHash: sha256Text(input.rawText),
    normalizedHash: input.normalizedHash ?? null,
    importedAtIso: input.importedAtIso,
    providerLabel: input.providerLabel?.trim() || null,
    modelLabel: input.modelLabel?.trim() || null,
    promptVersion: input.promptVersion?.trim() || null,
    trust: "UNTRUSTED_DATA",
  };
}

export function buildEditorialV2ApprovedCheckpoint(input: {
  readonly stageId: EditorialV2ApprovedStageId;
  readonly approvedAtIso: string;
  readonly sourceIdentity: string;
  readonly payload: unknown;
}): EditorialV2ApprovedCheckpoint {
  assertIsoTimestamp(input.approvedAtIso, "approvedAtIso");
  if (!isEditorialV2ApprovedStageId(input.stageId) || !input.sourceIdentity.trim()) throw new Error("CHECKPOINT_METADATA_INVALID");
  assertJsonValue(input.payload, "payload", new Set());
  const payload = cloneJsonValue(input.payload);
  const payloadHash = sha256Text(stableSerialize(payload));
  return {
    checkpointId: `${input.stageId}-${payloadHash.slice(0, 16)}`,
    stageId: input.stageId,
    approvedAtIso: input.approvedAtIso,
    sourceIdentity: input.sourceIdentity.trim(),
    payloadHash,
    payload,
    approvedOnly: true,
    fullDraftIncluded: false,
  };
}

export function getLastApprovedStage(snapshot: Pick<EditorialV2ProjectSnapshot, "approvedCheckpoints">): EditorialV2ApprovedStageId | null {
  let selected: EditorialV2ApprovedStageId | null = null;
  for (const checkpoint of snapshot.approvedCheckpoints) {
    if (!selected || getEditorialV2ApprovedStageIndex(checkpoint.stageId) > getEditorialV2ApprovedStageIndex(selected)) selected = checkpoint.stageId;
  }
  return selected;
}

export function hashEditorialV2ProjectSnapshot(snapshot: EditorialV2ProjectSnapshot): string {
  const canonical = {
    ...snapshot,
    integrity: { ...snapshot.integrity, canonicalHash: "" },
  } as unknown as EditorialV2JsonValue;
  assertJsonValue(canonical, "snapshot", new Set());
  return sha256Text(stableSerialize(canonical));
}

export function cloneEditorialV2ProjectSnapshot(snapshot: EditorialV2ProjectSnapshot): EditorialV2ProjectSnapshot {
  const cloned = cloneJsonValue(snapshot as unknown as EditorialV2JsonValue);
  return cloned as unknown as EditorialV2ProjectSnapshot;
}

export function buildEditorialV2ProjectSnapshot(input: BuildEditorialV2ProjectSnapshotInput): EditorialV2ProjectSnapshot {
  if (!isEditorialV2ProjectId(input.projectId)) throw new Error("PROJECT_ID_INVALID");
  assertIsoTimestamp(input.createdAtIso, "createdAtIso");
  assertIsoTimestamp(input.updatedAtIso, "updatedAtIso");
  if (!Number.isSafeInteger(input.revision) || input.revision < 0) throw new Error("REVISION_INVALID");
  const checkpoints = input.approvedCheckpoints.map((checkpoint) => ({ ...checkpoint, payload: cloneJsonValue(checkpoint.payload) }));
  const rawArtifacts = input.rawArtifacts.map((record) => ({ ...record }));
  const lastApprovedStage = getLastApprovedStage({ approvedCheckpoints: checkpoints });
  const currentStage = input.currentStage ?? lastApprovedStage;
  const base: EditorialV2ProjectSnapshot = {
    namespace: EDITORIAL_V2_PERSISTENCE_NAMESPACE,
    schemaVersion: EDITORIAL_V2_PERSISTENCE_SCHEMA_VERSION,
    projectId: input.projectId,
    metadata: { ...input.metadata },
    currentStage,
    lastApprovedStage,
    createdAtIso: input.createdAtIso,
    updatedAtIso: input.updatedAtIso,
    revision: input.revision,
    approvedCheckpoints: checkpoints,
    rawArtifacts,
    integrity: { algorithm: "sha256", canonicalization: "stable-json-v1", canonicalHash: "" },
    migrationState: "V1_ISOLATED_NO_MIGRATION",
    persistenceCapabilities: getEditorialV2PersistenceCapability(),
  };
  const snapshot = { ...base, integrity: { ...base.integrity, canonicalHash: hashEditorialV2ProjectSnapshot(base) } };
  const validation = validateEditorialV2ProjectSnapshot(snapshot);
  if (!validation.valid) throw new Error(`SNAPSHOT_INVALID:${validation.issues.map((issue) => issue.code).join(",")}`);
  return cloneEditorialV2ProjectSnapshot(snapshot);
}

export function validateEditorialV2ProjectSnapshot(snapshot: EditorialV2ProjectSnapshot): EditorialV2PersistenceValidationSummary {
  const issues: EditorialV2PersistenceValidationIssue[] = [];
  const add = (code: string, fieldPath: string, message: string): void => {
    issues.push({ code, fieldPath, message, blocking: true });
  };
  if (snapshot.namespace !== EDITORIAL_V2_PERSISTENCE_NAMESPACE) add("snapshot_namespace_mismatch", "namespace", "V2 persistence namespace가 일치하지 않습니다.");
  if (snapshot.schemaVersion !== EDITORIAL_V2_PERSISTENCE_SCHEMA_VERSION) add("snapshot_schema_mismatch", "schemaVersion", "지원하지 않는 persistence schema입니다.");
  if (!isEditorialV2ProjectId(snapshot.projectId)) add("snapshot_project_id_invalid", "projectId", "Project ID가 안전한 canonical 형식이 아닙니다.");
  if (!Number.isSafeInteger(snapshot.revision) || snapshot.revision < 0) add("snapshot_revision_invalid", "revision", "Revision은 0 이상의 정수여야 합니다.");
  if (!snapshot.metadata || typeof snapshot.metadata.displayName !== "string" || !snapshot.metadata.displayName.trim() || snapshot.metadata.displayName.length > 120) add("snapshot_display_name_invalid", "metadata.displayName", "Project display name이 올바르지 않습니다.");
  if (snapshot.metadata?.status !== "active" && snapshot.metadata?.status !== "archived") add("snapshot_project_status_invalid", "metadata.status", "Project status가 올바르지 않습니다.");
  if (!isCanonicalIsoTimestamp(snapshot.createdAtIso) || !isCanonicalIsoTimestamp(snapshot.updatedAtIso)) add("snapshot_timestamp_invalid", "createdAtIso", "Snapshot timestamp가 canonical ISO 형식이 아닙니다.");
  if (snapshot.metadata?.createdAtIso !== snapshot.createdAtIso || snapshot.metadata?.updatedAtIso !== snapshot.updatedAtIso) add("snapshot_metadata_timestamp_mismatch", "metadata", "Metadata와 snapshot timestamp가 일치하지 않습니다.");
  if (isCanonicalIsoTimestamp(snapshot.createdAtIso) && isCanonicalIsoTimestamp(snapshot.updatedAtIso) && snapshot.updatedAtIso < snapshot.createdAtIso) add("snapshot_timestamp_order_invalid", "updatedAtIso", "Updated timestamp가 created timestamp보다 이를 수 없습니다.");
  if (snapshot.metadata?.status === "active" && snapshot.metadata.archivedAtIso !== null) add("snapshot_active_archive_timestamp_invalid", "metadata.archivedAtIso", "Active project는 archived timestamp를 가질 수 없습니다.");
  if (snapshot.metadata?.status === "archived" && !isCanonicalIsoTimestamp(snapshot.metadata.archivedAtIso)) add("snapshot_archived_timestamp_missing", "metadata.archivedAtIso", "Archived project는 canonical archive timestamp가 필요합니다.");
  const approvedCheckpoints = Array.isArray(snapshot.approvedCheckpoints) ? snapshot.approvedCheckpoints : [];
  const rawArtifacts = Array.isArray(snapshot.rawArtifacts) ? snapshot.rawArtifacts : [];
  if (!Array.isArray(snapshot.approvedCheckpoints)) add("snapshot_checkpoints_invalid", "approvedCheckpoints", "Approved checkpoints는 배열이어야 합니다.");
  if (!Array.isArray(snapshot.rawArtifacts)) add("snapshot_raw_artifacts_invalid", "rawArtifacts", "Raw artifacts는 배열이어야 합니다.");
  const stageIds = approvedCheckpoints.map((checkpoint) => checkpoint.stageId);
  if (new Set(stageIds).size !== stageIds.length) add("snapshot_duplicate_stage", "approvedCheckpoints", "승인 stage checkpoint가 중복됐습니다.");
  for (const [index, checkpoint] of approvedCheckpoints.entries()) {
    try {
      assertJsonValue(checkpoint.payload, `approvedCheckpoints.${index}.payload`, new Set());
      if (checkpoint.payloadHash !== sha256Text(stableSerialize(checkpoint.payload))) add("checkpoint_payload_hash_mismatch", `approvedCheckpoints.${index}.payloadHash`, "Checkpoint payload hash가 일치하지 않습니다.");
    } catch (error) {
      add("checkpoint_payload_unsupported", `approvedCheckpoints.${index}.payload`, error instanceof Error ? error.message : "지원하지 않는 payload입니다.");
    }
    if (!isEditorialV2ApprovedStageId(checkpoint.stageId) || checkpoint.approvedOnly !== true || checkpoint.fullDraftIncluded !== false) add("checkpoint_boundary_invalid", `approvedCheckpoints.${index}`, "승인 checkpoint와 draft 경계가 올바르지 않습니다.");
    if (!isCanonicalIsoTimestamp(checkpoint.approvedAtIso) || !checkpoint.sourceIdentity?.trim()) add("checkpoint_metadata_invalid", `approvedCheckpoints.${index}`, "Checkpoint timestamp 또는 source identity가 올바르지 않습니다.");
    if (checkpoint.checkpointId !== `${checkpoint.stageId}-${checkpoint.payloadHash.slice(0, 16)}`) add("checkpoint_identity_mismatch", `approvedCheckpoints.${index}.checkpointId`, "Checkpoint ID가 payload identity와 일치하지 않습니다.");
    if (index > 0 && getEditorialV2ApprovedStageIndex(approvedCheckpoints[index - 1].stageId) >= getEditorialV2ApprovedStageIndex(checkpoint.stageId)) add("checkpoint_stage_order_invalid", `approvedCheckpoints.${index}.stageId`, "Checkpoint 목록은 승인 stage 순서를 따라야 합니다.");
  }
  const rawIds = rawArtifacts.map((record) => record.artifactId);
  if (new Set(rawIds).size !== rawIds.length) add("raw_artifact_duplicate_id", "rawArtifacts", "Raw artifact ID가 중복됐습니다.");
  for (const [index, record] of rawArtifacts.entries()) {
    if (record.rawHash !== sha256Text(record.rawText)) add("raw_artifact_hash_mismatch", `rawArtifacts.${index}.rawHash`, "UTF-8 raw text hash가 일치하지 않습니다.");
    if (record.trust !== "UNTRUSTED_DATA") add("raw_artifact_trust_mismatch", `rawArtifacts.${index}.trust`, "Raw artifact는 untrusted data로 유지해야 합니다.");
    if (!/^[a-z0-9][a-z0-9-]{2,79}$/u.test(record.artifactId) || !record.artifactKind?.trim() || !isEditorialV2ApprovedStageId(record.sourceStage) || !isCanonicalIsoTimestamp(record.importedAtIso)) add("raw_artifact_metadata_invalid", `rawArtifacts.${index}`, "Raw artifact metadata가 올바르지 않습니다.");
    if (record.normalizedHash !== null && !/^[a-f0-9]{64}$/u.test(record.normalizedHash)) add("raw_artifact_normalized_hash_invalid", `rawArtifacts.${index}.normalizedHash`, "Normalized hash는 SHA-256 또는 null이어야 합니다.");
  }
  const calculatedLast = getLastApprovedStage({ approvedCheckpoints });
  if (snapshot.lastApprovedStage !== calculatedLast) add("snapshot_last_approved_stage_mismatch", "lastApprovedStage", "마지막 승인 stage가 checkpoint 목록과 일치하지 않습니다.");
  if (snapshot.currentStage !== null && !isEditorialV2ApprovedStageId(snapshot.currentStage)) add("snapshot_current_stage_invalid", "currentStage", "Current stage가 지원되는 승인 stage가 아닙니다.");
  if (snapshot.lastApprovedStage !== null && !isEditorialV2ApprovedStageId(snapshot.lastApprovedStage)) add("snapshot_last_stage_invalid", "lastApprovedStage", "Last approved stage가 지원되는 승인 stage가 아닙니다.");
  if (snapshot.currentStage !== null && isEditorialV2ApprovedStageId(snapshot.currentStage) && (calculatedLast === null || getEditorialV2ApprovedStageIndex(snapshot.currentStage) > getEditorialV2ApprovedStageIndex(calculatedLast))) add("snapshot_current_stage_ahead", "currentStage", "Current stage가 마지막 승인 stage보다 앞설 수 없습니다.");
  if (snapshot.persistenceCapabilities?.localOnly !== true || snapshot.persistenceCapabilities?.approvedCheckpointPersistence !== true || snapshot.persistenceCapabilities?.fullDraftAutosave !== false || snapshot.persistenceCapabilities?.fullWorkbenchHydration !== false || snapshot.persistenceCapabilities?.v1Migration !== false || snapshot.persistenceCapabilities?.cloudBackup !== false) add("snapshot_draft_capability_false_claim", "persistenceCapabilities", "PA-1 persistence capability 경계가 올바르지 않습니다.");
  if (snapshot.migrationState !== "V1_ISOLATED_NO_MIGRATION") add("snapshot_migration_state_invalid", "migrationState", "PA-1은 V1 migration을 나타낼 수 없습니다.");
  if (snapshot.integrity?.algorithm !== "sha256" || snapshot.integrity?.canonicalization !== "stable-json-v1") add("snapshot_integrity_contract_invalid", "integrity", "지원하지 않는 integrity contract입니다.");
  try {
    if (snapshot.integrity.canonicalHash !== hashEditorialV2ProjectSnapshot(snapshot)) add("snapshot_integrity_mismatch", "integrity.canonicalHash", "Snapshot integrity hash가 일치하지 않습니다.");
  } catch (error) {
    add("snapshot_json_unsupported", "snapshot", error instanceof Error ? error.message : "Snapshot JSON이 지원되지 않습니다.");
  }
  return { valid: issues.length === 0, blockingIssueCount: issues.length, warningCount: 0, issues };
}
