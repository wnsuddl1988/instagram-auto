import type {
  EditorialV2ApprovedCheckpoint,
  EditorialV2ApprovedStageId,
  EditorialV2JsonValue,
  EditorialV2PersistenceCapability,
  EditorialV2ProjectSnapshot,
  EditorialV2RawArtifactRecord,
} from "./contracts";

export const EDITORIAL_V2_PERSISTENCE_NAMESPACE = "shorts-editorial-os-v2-project-store" as const;
export const EDITORIAL_V2_PERSISTENCE_SCHEMA_VERSION = "1.0.0" as const;
export const SHORTS_EDITORIAL_OS_V2_LOCAL_PERSISTENCE_ENABLED = "SHORTS_EDITORIAL_OS_V2_LOCAL_PERSISTENCE_ENABLED" as const;
export const SHORTS_EDITORIAL_OS_V2_DATA_ROOT = "SHORTS_EDITORIAL_OS_V2_DATA_ROOT" as const;

export const EDITORIAL_V2_APPROVED_STAGE_ORDER = [
  "trend_brief_import",
  "editorial_intelligence",
  "scene_planning",
  "character_motion",
  "render_integration",
  "publish_integration",
  "relaunch_readiness",
] as const satisfies readonly EditorialV2ApprovedStageId[];

export const EDITORIAL_V2_MAX_PROJECT_ID_LENGTH = 80;
export const EDITORIAL_V2_MAX_REQUEST_BYTES = 1_048_576;
export const EDITORIAL_V2_MAX_SNAPSHOT_BYTES = 4_194_304;
export const EDITORIAL_V2_MAX_RAW_ARTIFACT_BYTES = 524_288;
export const EDITORIAL_V2_MAX_RAW_ARTIFACT_TOTAL_BYTES = 2_097_152;

export interface EditorialV2ApprovedCheckpointDraft {
  readonly stageId: EditorialV2ApprovedStageId;
  readonly approvedAtIso: string;
  readonly sourceIdentity: string;
  readonly payload: EditorialV2JsonValue;
}

export interface EditorialV2RawArtifactDraft {
  readonly artifactId: string;
  readonly artifactKind: string;
  readonly sourceStage: EditorialV2ApprovedStageId;
  readonly rawText: string;
  readonly normalizedHash?: string | null;
  readonly importedAtIso: string;
  readonly providerLabel?: string | null;
  readonly modelLabel?: string | null;
  readonly promptVersion?: string | null;
}

export interface EditorialV2CheckpointWriteRequest {
  readonly ownerConfirmed: boolean;
  readonly checkpoint: EditorialV2ApprovedCheckpointDraft;
  readonly rawArtifacts: readonly EditorialV2RawArtifactDraft[];
}

export interface EditorialV2ApprovedCheckpointOption {
  readonly stageId: EditorialV2ApprovedStageId;
  readonly label: string;
  readonly sourceIdentity: string;
  readonly payload: EditorialV2JsonValue;
}

export interface EditorialV2ProjectCreateRequest {
  readonly displayName: string;
  readonly creationTimestampIso: string;
}

export interface EditorialV2ArchiveRequest {
  readonly action: "archive";
  readonly ownerConfirmed: boolean;
  readonly archivedAtIso: string;
}

export interface EditorialV2RecoveryRequest {
  readonly action: "recover";
  readonly ownerConfirmed: boolean;
  readonly candidate: "last_known_good" | "latest_valid_history";
  readonly approvedAtIso: string;
}

export function parseEditorialV2LocalPersistenceEnabled(value: unknown): boolean {
  return value === "1" || value === "true";
}

export function isEditorialV2LocalPersistenceEnabled(
  env: Readonly<Record<string, string | undefined>>,
): boolean {
  return parseEditorialV2LocalPersistenceEnabled(env[SHORTS_EDITORIAL_OS_V2_LOCAL_PERSISTENCE_ENABLED]);
}

export function getEditorialV2PersistenceCapability(): EditorialV2PersistenceCapability {
  return {
    localOnly: true,
    approvedCheckpointPersistence: true,
    fullDraftAutosave: false,
    fullWorkbenchHydration: false,
    v1Migration: false,
    cloudBackup: false,
  };
}

export function getEditorialV2ApprovedStageIndex(stageId: EditorialV2ApprovedStageId): number {
  return EDITORIAL_V2_APPROVED_STAGE_ORDER.indexOf(stageId);
}

export function isEditorialV2ApprovedStageId(value: unknown): value is EditorialV2ApprovedStageId {
  return typeof value === "string"
    && (EDITORIAL_V2_APPROVED_STAGE_ORDER as readonly string[]).includes(value);
}

export function cloneEditorialV2Checkpoint(checkpoint: EditorialV2ApprovedCheckpoint): EditorialV2ApprovedCheckpoint {
  return JSON.parse(JSON.stringify(checkpoint)) as EditorialV2ApprovedCheckpoint;
}

export function cloneEditorialV2RawArtifact(record: EditorialV2RawArtifactRecord): EditorialV2RawArtifactRecord {
  return { ...record };
}

export function snapshotSummary(snapshot: EditorialV2ProjectSnapshot): Readonly<Record<string, string | number | null>> {
  return {
    projectId: snapshot.projectId,
    displayName: snapshot.metadata.displayName,
    revision: snapshot.revision,
    currentStage: snapshot.currentStage,
    lastApprovedStage: snapshot.lastApprovedStage,
    approvedCheckpointCount: snapshot.approvedCheckpoints.length,
    rawArtifactCount: snapshot.rawArtifacts.length,
    integrityHashPrefix: snapshot.integrity.canonicalHash.slice(0, 12),
  };
}
