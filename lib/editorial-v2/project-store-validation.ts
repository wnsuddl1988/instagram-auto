import { Buffer } from "node:buffer";

import type {
  EditorialV2LocalStoreConfiguration,
  EditorialV2PersistenceValidationIssue,
  EditorialV2PersistenceValidationSummary,
  EditorialV2ProjectSnapshot,
} from "./contracts";
import type {
  EditorialV2CheckpointWriteRequest,
  EditorialV2ProjectCreateRequest,
} from "./persistence-contracts";
import {
  EDITORIAL_V2_MAX_RAW_ARTIFACT_BYTES,
  EDITORIAL_V2_MAX_RAW_ARTIFACT_TOTAL_BYTES,
  EDITORIAL_V2_MAX_SNAPSHOT_BYTES,
  EDITORIAL_V2_PERSISTENCE_NAMESPACE,
  EDITORIAL_V2_PERSISTENCE_SCHEMA_VERSION,
  isEditorialV2ApprovedStageId,
} from "./persistence-contracts";
import { isEditorialV2ProjectId, validateEditorialV2ProjectSnapshot } from "./project-snapshot";

function summary(issues: readonly EditorialV2PersistenceValidationIssue[]): EditorialV2PersistenceValidationSummary {
  return { valid: issues.every((issue) => !issue.blocking), blockingIssueCount: issues.filter((issue) => issue.blocking).length, warningCount: issues.filter((issue) => !issue.blocking).length, issues };
}

function isIso(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date.toISOString() === value;
}

export function validateEditorialV2ProjectCreateRequest(input: EditorialV2ProjectCreateRequest): EditorialV2PersistenceValidationSummary {
  const issues: EditorialV2PersistenceValidationIssue[] = [];
  if (typeof input.displayName !== "string" || input.displayName.trim().length < 1 || input.displayName.trim().length > 120) issues.push({ code: "project_display_name_invalid", fieldPath: "displayName", message: "프로젝트 이름은 1~120자여야 합니다.", blocking: true });
  if (!isIso(input.creationTimestampIso)) issues.push({ code: "project_creation_timestamp_invalid", fieldPath: "creationTimestampIso", message: "명시적 ISO creation timestamp가 필요합니다.", blocking: true });
  return summary(issues);
}

export function validateEditorialV2CheckpointWriteRequest(input: EditorialV2CheckpointWriteRequest): EditorialV2PersistenceValidationSummary {
  const issues: EditorialV2PersistenceValidationIssue[] = [];
  if (input.ownerConfirmed !== true) issues.push({ code: "checkpoint_owner_confirmation_required", fieldPath: "ownerConfirmed", message: "승인 checkpoint 저장 전 Owner 확인이 필요합니다.", blocking: true });
  if (!input.checkpoint || !isEditorialV2ApprovedStageId(input.checkpoint.stageId)) issues.push({ code: "checkpoint_stage_invalid", fieldPath: "checkpoint.stageId", message: "지원하지 않는 승인 stage입니다.", blocking: true });
  if (!input.checkpoint || !isIso(input.checkpoint.approvedAtIso)) issues.push({ code: "checkpoint_timestamp_invalid", fieldPath: "checkpoint.approvedAtIso", message: "승인 시각은 canonical ISO 형식이어야 합니다.", blocking: true });
  if (!input.checkpoint || typeof input.checkpoint.sourceIdentity !== "string" || !input.checkpoint.sourceIdentity.trim()) issues.push({ code: "checkpoint_source_identity_missing", fieldPath: "checkpoint.sourceIdentity", message: "승인 source identity가 필요합니다.", blocking: true });
  const rawArtifacts = Array.isArray(input.rawArtifacts) ? input.rawArtifacts : [];
  let totalRawBytes = 0;
  for (const [index, artifact] of rawArtifacts.entries()) {
    const bytes = typeof artifact.rawText === "string" ? Buffer.byteLength(artifact.rawText, "utf8") : EDITORIAL_V2_MAX_RAW_ARTIFACT_BYTES + 1;
    totalRawBytes += bytes;
    if (bytes > EDITORIAL_V2_MAX_RAW_ARTIFACT_BYTES) issues.push({ code: "raw_artifact_too_large", fieldPath: `rawArtifacts.${index}.rawText`, message: "Raw artifact 크기 제한을 초과했습니다.", blocking: true });
    if (!isEditorialV2ApprovedStageId(artifact.sourceStage)) issues.push({ code: "raw_artifact_stage_invalid", fieldPath: `rawArtifacts.${index}.sourceStage`, message: "Raw artifact source stage가 잘못됐습니다.", blocking: true });
    if (!isIso(artifact.importedAtIso)) issues.push({ code: "raw_artifact_timestamp_invalid", fieldPath: `rawArtifacts.${index}.importedAtIso`, message: "Raw artifact import 시각이 잘못됐습니다.", blocking: true });
  }
  if (totalRawBytes > EDITORIAL_V2_MAX_RAW_ARTIFACT_TOTAL_BYTES) issues.push({ code: "raw_artifact_total_too_large", fieldPath: "rawArtifacts", message: "Raw artifact 총량 제한을 초과했습니다.", blocking: true });
  return summary(issues);
}

export function validateEditorialV2LocalStoreConfiguration(configuration: EditorialV2LocalStoreConfiguration): EditorialV2PersistenceValidationSummary {
  const issues: EditorialV2PersistenceValidationIssue[] = [];
  if (!configuration.enabled) issues.push({ code: "persistence_disabled", fieldPath: "enabled", message: "Local persistence feature flag가 꺼져 있습니다.", blocking: true });
  if (configuration.namespace !== EDITORIAL_V2_PERSISTENCE_NAMESPACE) issues.push({ code: "configuration_namespace_mismatch", fieldPath: "namespace", message: "Persistence namespace가 일치하지 않습니다.", blocking: true });
  if (configuration.schemaVersion !== EDITORIAL_V2_PERSISTENCE_SCHEMA_VERSION) issues.push({ code: "configuration_schema_mismatch", fieldPath: "schemaVersion", message: "Persistence schema가 일치하지 않습니다.", blocking: true });
  if (!configuration.dataRoot || configuration.exposeDataRoot !== false || configuration.localOnly !== true) issues.push({ code: "configuration_boundary_invalid", fieldPath: "dataRoot", message: "Local-only data root boundary가 잘못됐습니다.", blocking: true });
  return summary(issues);
}

export function validateEditorialV2SnapshotForStore(snapshot: EditorialV2ProjectSnapshot): EditorialV2PersistenceValidationSummary {
  const issues = [...validateEditorialV2ProjectSnapshot(snapshot).issues];
  if (!isEditorialV2ProjectId(snapshot.projectId)) issues.push({ code: "store_project_id_invalid", fieldPath: "projectId", message: "Store project ID가 안전하지 않습니다.", blocking: true });
  const bytes = Buffer.byteLength(JSON.stringify(snapshot), "utf8");
  if (bytes > EDITORIAL_V2_MAX_SNAPSHOT_BYTES) issues.push({ code: "snapshot_too_large", fieldPath: "snapshot", message: "Snapshot 크기 제한을 초과했습니다.", blocking: true });
  return summary(issues);
}
