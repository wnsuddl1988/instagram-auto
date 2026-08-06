import type { RenderManifest, RenderRecoveryPlan } from "./contracts";

export interface RenderManifestComparison {
  readonly globalInvalidation: boolean;
  readonly globalReasons: readonly string[];
  readonly changedSceneIds: readonly string[];
  readonly reusableSceneIds: readonly string[];
  readonly removedSceneIds: readonly string[];
  readonly newSceneIds: readonly string[];
}

function same(valueA: unknown, valueB: unknown): boolean {
  return JSON.stringify(valueA) === JSON.stringify(valueB);
}

export function compareRenderManifests(
  previous: RenderManifest | null,
  current: RenderManifest,
): RenderManifestComparison {
  if (!previous) {
    return {
      globalInvalidation: true,
      globalReasons: ["no_previous_manifest"],
      changedSceneIds: [],
      reusableSceneIds: [],
      removedSceneIds: [],
      newSceneIds: current.scenes.filter((scene) => scene.enabled).map((scene) => scene.sceneId),
    };
  }
  const globalReasons: string[] = [];
  if (!same(previous.profile, current.profile)) globalReasons.push("render_profile_changed");
  if (previous.profile.framesPerSecond !== current.profile.framesPerSecond) globalReasons.push("fps_changed");
  if (previous.profile.width !== current.profile.width || previous.profile.height !== current.profile.height) globalReasons.push("canvas_changed");
  if (previous.globalSafeAreaPolicy !== current.globalSafeAreaPolicy) globalReasons.push("global_safe_area_changed");
  if (previous.selectedCharacterDirectionId !== current.selectedCharacterDirectionId) globalReasons.push("character_direction_changed");
  if (!same(
    {
      mode: previous.voicePlan.mode,
      provider: previous.voicePlan.provider,
      locale: previous.voicePlan.scenes[0]?.locale,
      voiceIdentity: previous.voicePlan.scenes[0]?.voiceIdentity,
    },
    {
      mode: current.voicePlan.mode,
      provider: current.voicePlan.provider,
      locale: current.voicePlan.scenes[0]?.locale,
      voiceIdentity: current.voicePlan.scenes[0]?.voiceIdentity,
    },
  )) globalReasons.push("voice_global_settings_changed");
  if (previous.subtitleTrack.locale !== current.subtitleTrack.locale || previous.subtitleTrack.safeZone !== current.subtitleTrack.safeZone) globalReasons.push("subtitle_global_style_changed");
  const previousMap = new Map(previous.scenes.map((scene) => [scene.sceneId, scene]));
  const currentMap = new Map(current.scenes.map((scene) => [scene.sceneId, scene]));
  const removedSceneIds = previous.scenes.filter((scene) => !currentMap.has(scene.sceneId)).map((scene) => scene.sceneId);
  const newSceneIds = current.scenes.filter((scene) => !previousMap.has(scene.sceneId)).map((scene) => scene.sceneId);
  const changedSceneIds = current.scenes
    .filter((scene) => previousMap.has(scene.sceneId) && previousMap.get(scene.sceneId)?.fingerprint.fingerprint !== scene.fingerprint.fingerprint)
    .map((scene) => scene.sceneId);
  const globalInvalidation = globalReasons.length > 0;
  const reusableSceneIds = globalInvalidation
    ? []
    : current.scenes
        .filter((scene) => scene.enabled && previousMap.get(scene.sceneId)?.enabled && previousMap.get(scene.sceneId)?.fingerprint.fingerprint === scene.fingerprint.fingerprint)
        .map((scene) => scene.sceneId);
  return { globalInvalidation, globalReasons, changedSceneIds, reusableSceneIds, removedSceneIds, newSceneIds };
}

export function buildRenderRecoveryPlan(
  previous: RenderManifest | null,
  current: RenderManifest,
): RenderRecoveryPlan {
  const comparison = compareRenderManifests(previous, current);
  const enabledIds = current.scenes.filter((scene) => scene.enabled).map((scene) => scene.sceneId);
  const blockedSceneIds = current.scenes
    .filter((scene) => scene.enabled && scene.unresolvedRequirements.length > 0)
    .map((scene) => scene.sceneId);
  const invalidatedIds = comparison.globalInvalidation
    ? enabledIds
    : [...new Set([...comparison.changedSceneIds, ...comparison.newSceneIds])].filter((sceneId) => enabledIds.includes(sceneId));
  return {
    planVersion: "render-recovery-plan-v1",
    globalInvalidation: comparison.globalInvalidation,
    globalReasons: [...comparison.globalReasons],
    changedSceneIds: [...comparison.changedSceneIds],
    reusableSceneIds: [...comparison.reusableSceneIds],
    removedSceneIds: [...comparison.removedSceneIds],
    newSceneIds: [...comparison.newSceneIds],
    retryableSceneIds: invalidatedIds.filter((sceneId) => !blockedSceneIds.includes(sceneId)),
    blockedSceneIds,
    previousOutputsAssumed: false,
    persistenceUsed: false,
  };
}

export function canReuseSceneRender(
  previous: RenderManifest | null,
  current: RenderManifest,
  sceneId: string,
): boolean {
  if (!previous) return false;
  const comparison = compareRenderManifests(previous, current);
  return !comparison.globalInvalidation && comparison.reusableSceneIds.includes(sceneId);
}
