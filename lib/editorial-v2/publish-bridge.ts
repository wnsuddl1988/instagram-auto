import type {
  PublishBridgeCapability,
  PublishBridgePlan,
  PublishPackage,
  PublishRecoveryPlan,
  PublishValidationIssue,
} from "./contracts";

const BASE_CAPABILITIES: readonly PublishBridgeCapability["capabilityId"][] = [
  "destination_identity_read",
  "media_upload",
  "metadata_publish",
  "cover_publish",
  "publication_status_read",
  "publication_cancel",
  "duplicate_remote_check",
  "per_platform_retry",
  "durable_publication_ledger",
];

function capability(capabilityId: PublishBridgeCapability["capabilityId"]): PublishBridgeCapability {
  return { capabilityId, available: false, future: true };
}

export function buildPublishBridgePlan(
  publishPackage: PublishPackage,
  recoveryPlan: PublishRecoveryPlan,
): PublishBridgePlan {
  return {
    bridgeVersion: "publish-bridge-plan-v1",
    packageId: publishPackage.packageId,
    platformPlans: publishPackage.platformPackages.map((entry) => {
      const capabilityIds = [
        ...BASE_CAPABILITIES,
        publishPackage.executionIntent === "scheduled_future" ? "scheduled_publish" as const : "immediate_publish" as const,
      ];
      if (!recoveryPlan.retryablePlatformIds.includes(entry.platformId)) {
        capabilityIds.splice(capabilityIds.indexOf("per_platform_retry"), 1);
      }
      const requiredCapabilities = capabilityIds.map(capability);
      return {
        platformId: entry.platformId,
        logicalRenderUri: entry.renderLogicalUri,
        logicalCoverUri: entry.coverLogicalUri,
        expectedDestinationId: entry.expectedDestinationIdentity.stableDestinationId,
        observedManualDestinationId: entry.observedDestinationIdentity.stableDestinationId,
        metadataPackageIdentity: entry.metadata.metadataHash,
        scheduleIntent: { ...publishPackage.scheduleIntent },
        dedupeKey: entry.dedupeKey.value,
        requiredCapabilities,
        unavailableCapabilities: requiredCapabilities.map((entry) => entry.capabilityId),
      };
    }),
    missingCredentials: true,
    missingExternalIdentityVerification: true,
    missingDurableLedger: true,
    executionReady: false,
    executionCommand: null,
    externalRequest: null,
  };
}

export function validatePublishBridgePlan(
  plan: PublishBridgePlan,
  publishPackage: PublishPackage,
): readonly PublishValidationIssue[] {
  const issues: PublishValidationIssue[] = [];
  if (plan.packageId !== publishPackage.packageId) issues.push({ code: "publish_bridge_package_identity_mismatch", platformId: null, fieldPath: "bridge.packageId", message: "Bridge package identity가 다릅니다.", blocking: true });
  const runtimePlan = plan as unknown as Readonly<Record<string, unknown>>;
  if (runtimePlan.executionReady !== false || runtimePlan.executionCommand !== null || runtimePlan.externalRequest !== null) issues.push({ code: "publish_bridge_execution_state_forbidden", platformId: null, fieldPath: "bridge", message: "Bridge는 executionReady=false, command/request=null이어야 합니다.", blocking: true });
  if (runtimePlan.missingCredentials !== true || runtimePlan.missingExternalIdentityVerification !== true || runtimePlan.missingDurableLedger !== true) issues.push({ code: "publish_bridge_missing_requirement_hidden", platformId: null, fieldPath: "bridge", message: "credentials·외부 identity·durable ledger 부재를 숨길 수 없습니다.", blocking: true });
  for (const platformPlan of plan.platformPlans) {
    if (!platformPlan.logicalRenderUri.startsWith("render://") || !platformPlan.logicalCoverUri.startsWith("cover://")) issues.push({ code: "publish_bridge_logical_uri_invalid", platformId: platformPlan.platformId, fieldPath: "bridge.logicalUri", message: "render:// 및 cover:// logical URI만 허용됩니다.", blocking: true });
    if (/^(?:https?|file):\/\//iu.test(platformPlan.logicalRenderUri) || /^(?:https?|file):\/\//iu.test(platformPlan.logicalCoverUri) || /^[A-Za-z]:[\\/]/u.test(platformPlan.logicalRenderUri)) issues.push({ code: "publish_bridge_external_or_file_uri_forbidden", platformId: platformPlan.platformId, fieldPath: "bridge.logicalUri", message: "network URL과 file path는 허용되지 않습니다.", blocking: true });
    if (platformPlan.requiredCapabilities.some((entry) => entry.available !== false || entry.future !== true)) issues.push({ code: "publish_bridge_capability_false_claim", platformId: platformPlan.platformId, fieldPath: "bridge.requiredCapabilities", message: "모든 실제 capability는 unavailable/future여야 합니다.", blocking: true });
  }
  issues.push({ code: "publish_bridge_capabilities_unavailable", platformId: null, fieldPath: "bridge.requiredCapabilities", message: "Provider-independent plan만 정의됐으며 실제 capability는 모두 unavailable입니다.", blocking: false });
  return issues;
}
