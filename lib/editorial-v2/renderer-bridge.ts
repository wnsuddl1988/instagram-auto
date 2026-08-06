import type { RenderManifest, RendererBridgeCapability, RendererBridgePlan } from "./contracts";

export interface RendererBridgeValidationIssue {
  readonly code: string;
  readonly fieldPath: string;
  readonly message: string;
  readonly blocking: boolean;
}

const CAPABILITY_IDS: readonly RendererBridgeCapability["capabilityId"][] = [
  "scene_concat",
  "profile_selection",
  "audio_placeholder",
  "subtitle_overlay",
  "character_overlay",
  "text_overlay",
  "transitions",
  "fingerprint_verification",
  "manifest_hash_verification",
  "ffprobe_verification",
];

export function buildRendererBridgePlan(manifest: RenderManifest): RendererBridgePlan {
  const unresolved = manifest.scenes.flatMap((scene) => scene.unresolvedRequirements.map((requirement) => `${scene.sceneId}:${requirement}`));
  const missingRequirements = [
    ...unresolved,
    "audio_track_not_created",
    "production_render_adapter_not_implemented",
    "runtime_frame_safe_area_not_verified",
  ];
  if (manifest.profile.final) missingRequirements.push("final_profile_execution_not_authorized");
  return {
    bridgeVersion: "renderer-bridge-plan-v1",
    manifestHash: manifest.manifestHash,
    profileId: manifest.profile.profileId,
    capabilities: CAPABILITY_IDS.map((capabilityId) => ({
      capabilityId,
      planned: true,
      implemented: false,
      externalExecutionRequired: capabilityId === "ffprobe_verification",
    })),
    sceneLogicalUris: manifest.scenes.flatMap((scene) => scene.layers.map((layer) => layer.logicalUri)),
    missingRequirements: [...new Set(missingRequirements)].sort(),
    executionReady: false,
    networkRequired: false,
    filesystemAccessDeclared: false,
    processExecutionDeclared: false,
    v1ImportsUsed: false,
  };
}

export function validateRendererBridgePlan(
  plan: RendererBridgePlan,
  manifest: RenderManifest,
): readonly RendererBridgeValidationIssue[] {
  const issues: RendererBridgeValidationIssue[] = [];
  const add = (code: string, fieldPath: string, message: string, blocking = true): void => {
    issues.push({ code, fieldPath, message, blocking });
  };
  if (plan.manifestHash !== manifest.manifestHash) add("bridge_manifest_hash_mismatch", "manifestHash", "Bridge와 render manifest hash가 다릅니다.");
  if (plan.profileId !== manifest.profile.profileId) add("bridge_profile_mismatch", "profileId", "Bridge와 manifest profile이 다릅니다.");
  if (plan.capabilities.length !== CAPABILITY_IDS.length || CAPABILITY_IDS.some((id) => !plan.capabilities.some((capability) => capability.capabilityId === id))) add("bridge_capability_missing", "capabilities", "필수 renderer bridge capability가 빠졌습니다.");
  if (plan.executionReady) add("bridge_execution_ready_false_claim", "executionReady", "실제 asset/audio가 없으므로 executionReady일 수 없습니다.");
  if (plan.networkRequired || plan.filesystemAccessDeclared || plan.processExecutionDeclared || plan.v1ImportsUsed) add("bridge_boundary_violation", "networkRequired", "Bridge plan은 network/fs/process/V1 경계를 선언할 수 없습니다.");
  plan.sceneLogicalUris.forEach((uri, index) => {
    if (!uri.startsWith("asset://")) add("bridge_logical_uri_invalid", `sceneLogicalUris/${index}`, "Bridge URI는 asset:// logical scheme이어야 합니다.");
    if (/^(?:https?|wss?|file):\/\//iu.test(uri) || /^[a-z]:[\\/]/iu.test(uri)) add("bridge_external_or_file_uri_forbidden", `sceneLogicalUris/${index}`, "외부 URL 또는 file path는 금지됩니다.");
  });
  if (!plan.missingRequirements.includes("audio_track_not_created")) add("bridge_missing_audio_requirement_hidden", "missingRequirements", "Audio 미생성 요구사항을 명시해야 합니다.");
  if (!plan.missingRequirements.includes("production_render_adapter_not_implemented")) add("bridge_missing_adapter_requirement_hidden", "missingRequirements", "Production renderer 미구현 상태를 명시해야 합니다.");
  return issues;
}
