import type {
  ApprovedRenderIntegrationSessionSnapshot,
  PlatformPublishPackage,
  PublishDeduplicationKey,
  PublishExpectedDestinationIdentity,
  PublishMetadataDraft,
  PublishObservedDestinationIdentity,
  PublishPackage,
  PublishPlatformId,
  PublishScheduleIntent,
  PublishValidationIssue,
} from "./contracts";
import { comparePublishDestinationIdentity } from "./publish-identity";

export interface BuildPublishPackageInput {
  readonly approvedRenderIntegration: ApprovedRenderIntegrationSessionSnapshot;
  readonly selectedPlatforms: readonly PublishPlatformId[];
  readonly expectedDestinationIdentities: readonly PublishExpectedDestinationIdentity[];
  readonly observedDestinationIdentities: readonly PublishObservedDestinationIdentity[];
  readonly platformMetadata: readonly PublishMetadataDraft[];
  readonly scheduleIntent: PublishScheduleIntent;
  readonly rightsResolvedForPlanning: boolean;
  readonly paidPossible: boolean;
  readonly paidPossibleOwnerConfirmation: boolean;
  readonly createdFromSessionIdentity: string;
}

function stableSerialize(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableSerialize).join(",")}]`;
  const record = value as Readonly<Record<string, unknown>>;
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableSerialize(record[key])}`).join(",")}}`;
}

function deterministicHash(value: unknown): string {
  const text = stableSerialize(value);
  let first = 0x811c9dc5;
  let second = 0x9e3779b9;
  for (let index = 0; index < text.length; index += 1) {
    const code = text.charCodeAt(index);
    first ^= code;
    first = Math.imul(first, 0x01000193) >>> 0;
    second ^= code + index;
    second = Math.imul(second, 0x85ebca6b) >>> 0;
  }
  const left = first.toString(16).padStart(8, "0");
  const right = second.toString(16).padStart(8, "0");
  return `${left}${right}${right}${left}`;
}

function placeholderExpected(platformId: PublishPlatformId): PublishExpectedDestinationIdentity {
  return { platformId, stableDestinationId: "", displayLabel: "", ownerConfirmation: false, identityPolicyVersion: "publish-identity-policy-v1" };
}

function placeholderObserved(platformId: PublishPlatformId): PublishObservedDestinationIdentity {
  return { platformId, stableDestinationId: "", displayLabel: "", observationLevel: "manual_unverified", observedBy: "", observedAtIso: "", sourceDescription: "" };
}

function placeholderMetadata(platformId: PublishPlatformId): PublishMetadataDraft {
  const visibilityIntent: PublishMetadataDraft["visibilityIntent"] = platformId === "instagram_reels" ? "public" : "private";
  const sourceDisclosure = { disclosureVersion: "publish-source-disclosure-v1" as const, statement: "", sources: [], sourceExistenceVerified: false as const };
  const coverPlan = { selectedSceneId: "", titleOverlay: "", logicalUri: "cover://missing", metadataOnly: true as const, actualCoverCreated: false as const };
  const base = {
    platformId,
    title: "",
    description: "",
    caption: "",
    hashtags: { rawHashtags: [], normalizedHashtags: [], duplicateCount: 0 },
    sourceDisclosure,
    coverPlan,
    accessibilityDescription: "",
    visibilityIntent,
    policy: { policyVersion: "publish-metadata-policy-v1" as const, authority: "internal_planning_only" as const, actualCurrentPlatformLimitsVerified: false as const, lengthPolicy: "conservative_warning_only" as const },
  };
  return { ...base, metadataHash: deterministicHash(base) };
}

function buildPlatformDedupeKey(
  platformId: PublishPlatformId,
  stableDestinationId: string,
  renderManifestHash: string,
  metadata: PublishMetadataDraft,
): PublishDeduplicationKey {
  const coverPlanHash = deterministicHash(metadata.coverPlan);
  const components = {
    platformId,
    stableDestinationId: stableDestinationId.trim(),
    renderManifestHash,
    metadataHash: metadata.metadataHash,
    visibilityIntent: metadata.visibilityIntent,
    coverPlanHash,
  };
  return { keyVersion: "publish-dedupe-key-v1", ...components, value: deterministicHash(components) };
}

export function buildPublishPackage(input: BuildPublishPackageInput): PublishPackage {
  const selectedPlatforms = [...new Set(input.selectedPlatforms)];
  const renderManifestHash = input.approvedRenderIntegration.renderManifest.manifestHash;
  const platformPackages = selectedPlatforms.map((platformId): PlatformPublishPackage => {
    const expected = input.expectedDestinationIdentities.find((identity) => identity.platformId === platformId) ?? placeholderExpected(platformId);
    const observed = input.observedDestinationIdentities.find((identity) => identity.platformId === platformId) ?? placeholderObserved(platformId);
    const metadata = input.platformMetadata.find((entry) => entry.platformId === platformId) ?? placeholderMetadata(platformId);
    const identityComparison = comparePublishDestinationIdentity(expected, observed);
    const blockingIssues = [...identityComparison.blockingReasons];
    if (!input.platformMetadata.some((entry) => entry.platformId === platformId)) blockingIssues.push("platform_metadata_missing");
    const renderLogicalUri = `render://${renderManifestHash}/${platformId}`;
    const coverLogicalUri = metadata.coverPlan.logicalUri;
    return {
      platformId,
      expectedDestinationIdentity: { ...expected },
      observedDestinationIdentity: { ...observed },
      identityComparison: { ...identityComparison, blockingReasons: [...identityComparison.blockingReasons] },
      metadata: cloneMetadata(metadata),
      coverPlan: { ...metadata.coverPlan },
      visibilityIntent: metadata.visibilityIntent,
      renderLogicalUri,
      coverLogicalUri,
      dedupeKey: buildPlatformDedupeKey(platformId, expected.stableDestinationId, renderManifestHash, metadata),
      blockingIssues,
      warnings: ["manual_account_observation_only", "remote_duplicate_status_unknown", "actual_upload_unavailable"],
    };
  });
  const sourceDisclosure = platformPackages[0]?.metadata.sourceDisclosure ?? placeholderMetadata("instagram_reels").sourceDisclosure;
  const packageBase = {
    packageVersion: "publish-package-v1" as const,
    renderIntegrationIdentity: deterministicHash({ renderManifestHash, approvalState: input.approvedRenderIntegration.approvalState }),
    renderManifestHash,
    finalProfileIdentity: `${input.approvedRenderIntegration.renderManifest.profile.profileId}:${input.approvedRenderIntegration.renderManifest.profile.width}x${input.approvedRenderIntegration.renderManifest.profile.height}`,
    platformPackages,
    metadataPolicyVersion: "publish-metadata-policy-v1" as const,
    sourceDisclosure: { ...sourceDisclosure, sources: sourceDisclosure.sources.map((source) => ({ ...source })) },
    rightsSummary: { planningState: "planning_review_only" as const, unresolved: !input.rightsResolvedForPlanning },
    costSummary: { classification: input.approvedRenderIntegration.voicePlan.costEstimateClass, paidPossible: input.paidPossible, ownerConfirmation: input.paidPossibleOwnerConfirmation },
    executionIntent: input.scheduleIntent.executionIntent,
    scheduleIntent: { ...input.scheduleIntent },
    createdFromSessionIdentity: input.createdFromSessionIdentity,
    executionRequested: false as const,
    externalCallExecuted: false as const,
    uploadExecuted: false as const,
    publicationExecuted: false as const,
    durableLedgerAvailable: false as const,
    executionReady: false as const,
  };
  return clonePublishPackage({ ...packageBase, packageId: `publish-package-${deterministicHash(packageBase)}` });
}

function cloneMetadata(metadata: PublishMetadataDraft): PublishMetadataDraft {
  return {
    ...metadata,
    hashtags: { ...metadata.hashtags, rawHashtags: [...metadata.hashtags.rawHashtags], normalizedHashtags: [...metadata.hashtags.normalizedHashtags] },
    sourceDisclosure: { ...metadata.sourceDisclosure, sources: metadata.sourceDisclosure.sources.map((source) => ({ ...source })) },
    coverPlan: { ...metadata.coverPlan },
    policy: { ...metadata.policy },
  };
}

export function clonePublishPackage(publishPackage: PublishPackage): PublishPackage {
  return {
    ...publishPackage,
    platformPackages: publishPackage.platformPackages.map((entry) => ({
      ...entry,
      expectedDestinationIdentity: { ...entry.expectedDestinationIdentity },
      observedDestinationIdentity: { ...entry.observedDestinationIdentity },
      identityComparison: { ...entry.identityComparison, blockingReasons: [...entry.identityComparison.blockingReasons] },
      metadata: cloneMetadata(entry.metadata),
      coverPlan: { ...entry.coverPlan },
      dedupeKey: { ...entry.dedupeKey },
      blockingIssues: [...entry.blockingIssues],
      warnings: [...entry.warnings],
    })),
    sourceDisclosure: { ...publishPackage.sourceDisclosure, sources: publishPackage.sourceDisclosure.sources.map((source) => ({ ...source })) },
    rightsSummary: { ...publishPackage.rightsSummary },
    costSummary: { ...publishPackage.costSummary },
    scheduleIntent: { ...publishPackage.scheduleIntent },
  };
}

export function hashPublishPackage(publishPackage: PublishPackage): string {
  return deterministicHash({ ...publishPackage, packageId: "" });
}

export function validatePublishPackageShape(publishPackage: PublishPackage): readonly PublishValidationIssue[] {
  const issues: PublishValidationIssue[] = [];
  if (!publishPackage.renderManifestHash.trim()) issues.push({ code: "render_manifest_hash_missing", platformId: null, fieldPath: "renderManifestHash", message: "Render Manifest hash가 없습니다.", blocking: true });
  if (publishPackage.platformPackages.length === 0) issues.push({ code: "selected_platform_missing", platformId: null, fieldPath: "platformPackages", message: "최소 한 플랫폼이 필요합니다.", blocking: true });
  if (!publishPackage.createdFromSessionIdentity.trim()) issues.push({ code: "publish_session_identity_missing", platformId: null, fieldPath: "createdFromSessionIdentity", message: "session identity가 없습니다.", blocking: true });
  for (const platformPackage of publishPackage.platformPackages) {
    if (!platformPackage.renderLogicalUri.startsWith("render://")) issues.push({ code: "publish_render_logical_uri_invalid", platformId: platformPackage.platformId, fieldPath: "renderLogicalUri", message: "render:// logical URI만 허용됩니다.", blocking: true });
    if (!platformPackage.coverLogicalUri.startsWith("cover://")) issues.push({ code: "publish_cover_logical_uri_invalid", platformId: platformPackage.platformId, fieldPath: "coverLogicalUri", message: "cover:// logical URI만 허용됩니다.", blocking: true });
    for (const code of platformPackage.blockingIssues) issues.push({ code, platformId: platformPackage.platformId, fieldPath: "platformPackages", message: `플랫폼 package 차단: ${code}`, blocking: true });
  }
  const runtimeFlags = publishPackage as unknown as Readonly<Record<string, unknown>>;
  for (const field of ["executionRequested", "externalCallExecuted", "uploadExecuted", "publicationExecuted", "executionReady"]) {
    if (runtimeFlags[field] !== false) issues.push({ code: "publish_execution_state_forbidden", platformId: null, fieldPath: field, message: `${field}는 Slice 7에서 false여야 합니다.`, blocking: true });
  }
  if (runtimeFlags.durableLedgerAvailable !== false) issues.push({ code: "durable_ledger_false_claim", platformId: null, fieldPath: "durableLedgerAvailable", message: "durable ledger 사용 가능으로 표시할 수 없습니다.", blocking: true });
  return issues;
}
