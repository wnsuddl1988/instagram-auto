export const EDITORIAL_V2_NAMESPACE = "shorts-editorial-os-v2" as const;

export const EDITORIAL_V2_SCHEMA_VERSION = "2.0.0-alpha.1" as const;

export const EDITORIAL_V2_FEATURE_FLAG_ENV = "SHORTS_EDITORIAL_OS_V2_ENABLED" as const;

export type EditorialV2Namespace = typeof EDITORIAL_V2_NAMESPACE;
export type EditorialV2SchemaVersion = typeof EDITORIAL_V2_SCHEMA_VERSION;

export interface EditorialV2SchemaIdentity {
  readonly namespace: EditorialV2Namespace;
  readonly schemaVersion: EditorialV2SchemaVersion;
}
