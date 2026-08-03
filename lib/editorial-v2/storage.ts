import type { ArtifactEnvelope } from "./contracts";
import {
  EDITORIAL_V2_NAMESPACE,
  EDITORIAL_V2_SCHEMA_VERSION,
  type EditorialV2Namespace,
  type EditorialV2SchemaVersion,
} from "./schema-version";

export interface EditorialV2ProjectSnapshot {
  readonly namespace: EditorialV2Namespace;
  readonly schemaVersion: EditorialV2SchemaVersion;
  readonly projectId: string;
  readonly revision: number;
  readonly updatedAt: string;
  readonly artifacts: readonly ArtifactEnvelope[];
}

export interface EditorialV2ProjectSummary {
  readonly projectId: string;
  readonly revision: number;
  readonly updatedAt: string;
}

export interface EditorialV2Storage {
  load(projectId: string): Promise<EditorialV2ProjectSnapshot | null>;
  list(): Promise<readonly EditorialV2ProjectSummary[]>;
  save(snapshot: EditorialV2ProjectSnapshot): Promise<void>;
}

export const EDITORIAL_V2_STORAGE_ERROR_CODES = [
  "not_found",
  "namespace_mismatch",
  "schema_version_mismatch",
  "conflict",
  "unavailable",
] as const;

export type EditorialV2StorageErrorCode = (typeof EDITORIAL_V2_STORAGE_ERROR_CODES)[number];

export interface EditorialV2StorageError {
  readonly code: EditorialV2StorageErrorCode;
  readonly message: string;
  readonly retryable: boolean;
}

function encodeKeySegment(value: string): string {
  return encodeURIComponent(value.trim());
}

export function buildEditorialV2StorageKey(projectId: string, artifactId?: string): string {
  const projectKey = `${EDITORIAL_V2_NAMESPACE}:${EDITORIAL_V2_SCHEMA_VERSION}:project:${encodeKeySegment(projectId)}`;
  return artifactId ? `${projectKey}:artifact:${encodeKeySegment(artifactId)}` : projectKey;
}
