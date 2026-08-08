import type {
  RetryVoiceMaterializationPlan,
  VoiceMaterializationPlan,
  VoiceMaterializationRecoveryPlan,
  VoiceMaterializationSceneEntry,
  VoiceMaterializationSet,
} from "./voice-materialization-contracts";

export function buildVoiceMaterializationRecoveryPlan(
  set: VoiceMaterializationSet,
  currentPlan: VoiceMaterializationPlan,
): VoiceMaterializationRecoveryPlan {
  const staleReasons: string[] = [];
  if (set.projectId !== currentPlan.projectId) staleReasons.push("project_id_changed");
  if (set.projectRevision !== currentPlan.projectRevision) staleReasons.push("project_revision_changed");
  if (set.sourceRenderCheckpointHash !== currentPlan.sourceRenderCheckpointHash) staleReasons.push("render_checkpoint_changed");
  if (set.renderManifestHash !== currentPlan.renderManifestHash) staleReasons.push("render_manifest_changed");
  if (set.providerId !== currentPlan.providerId || set.voiceId !== currentPlan.voiceId || set.modelId !== currentPlan.modelId || set.outputFormat !== currentPlan.outputFormat) staleReasons.push("provider_configuration_changed");
  if (set.materializationSetId !== currentPlan.materializationSetId || set.planHash !== currentPlan.planHash) staleReasons.push("materialization_plan_changed");
  const failedSceneIds = set.sceneEntries.filter((scene) => scene.status === "failed").map((scene) => scene.sceneId);
  const pendingSceneIds = set.sceneEntries.filter((scene) => scene.status === "pending").map((scene) => scene.sceneId);
  const reusableSceneIds = set.sceneEntries.filter((scene) => scene.status === "generated" || scene.status === "cache_hit").map((scene) => scene.sceneId);
  const stale = staleReasons.length > 0;
  return {
    schemaVersion: "voice-materialization-recovery-plan-v1",
    materializationSetId: set.materializationSetId,
    stale,
    staleReasons,
    reusableSceneIds,
    retryableSceneIds: stale ? [] : [...failedSceneIds, ...pendingSceneIds],
    failedSceneIds,
    pendingSceneIds,
    blockedSceneIds: stale ? set.sceneEntries.map((scene) => scene.sceneId) : reusableSceneIds,
    automaticRetry: false,
    ownerConfirmationRequired: true,
  };
}

export function canRetryVoiceScene(
  scene: VoiceMaterializationSceneEntry,
  recoveryPlan: VoiceMaterializationRecoveryPlan,
): boolean {
  return !recoveryPlan.stale
    && recoveryPlan.retryableSceneIds.includes(scene.sceneId)
    && (scene.status === "failed" || scene.status === "pending");
}

export function buildRetryMaterializationPlan(
  plan: VoiceMaterializationPlan,
  set: VoiceMaterializationSet,
  requestedSceneIds?: readonly string[],
): RetryVoiceMaterializationPlan {
  const recovery = buildVoiceMaterializationRecoveryPlan(set, plan);
  if (recovery.stale) throw new Error(`VOICE_MATERIALIZATION_SET_STALE:${recovery.staleReasons.join(",")}`);
  const requested = requestedSceneIds ?? recovery.retryableSceneIds;
  if (requested.length === 0 || new Set(requested).size !== requested.length) throw new Error("VOICE_RETRY_SCENE_SELECTION_INVALID");
  if (requested.some((sceneId) => !recovery.retryableSceneIds.includes(sceneId))) throw new Error("VOICE_RETRY_SUCCESS_OR_UNKNOWN_SCENE_FORBIDDEN");
  return {
    basePlan: plan,
    requestedSceneIds: plan.scenes.map((scene) => scene.sceneId).filter((sceneId) => requested.includes(sceneId)),
    maximumExternalRequests: requested.length,
    automaticRetry: false,
    ownerConfirmationRequired: true,
  };
}
