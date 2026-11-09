import type {
  ApprovedCharacterMotionSessionSnapshot,
  ApprovedScenePlanningSessionSnapshot,
  CharacterDirectionId,
  RenderManifest,
  RenderProfile,
  RenderProfileId,
  SceneRenderFingerprint,
  SceneRenderInput,
  SceneRenderLayer,
  SubtitleTrackPlan,
  VoiceRequestPlan,
} from "./contracts";

export const RENDER_PROFILES: readonly RenderProfile[] = [
  {
    profileId: "preview_540x960",
    label: "Preview 540×960 · local integration intent",
    width: 540,
    height: 960,
    framesPerSecond: 30,
    bitrateIntent: "low_preview",
    encodingIntent: "fast_preview",
    preview: true,
    final: false,
    executionAllowed: false,
    productionReady: false,
  },
  {
    profileId: "final_1080x1920",
    label: "Final 1080×1920 · production intent metadata only",
    width: 1080,
    height: 1920,
    framesPerSecond: 30,
    bitrateIntent: "production_intent_unverified",
    encodingIntent: "production_quality_intent",
    preview: false,
    final: true,
    executionAllowed: false,
    productionReady: false,
  },
] as const;

export interface BuildRenderManifestInput {
  readonly approvedPlanning: ApprovedScenePlanningSessionSnapshot;
  readonly approvedCharacterMotion: ApprovedCharacterMotionSessionSnapshot;
  readonly voicePlan: VoiceRequestPlan;
  readonly subtitleTrack: SubtitleTrackPlan;
  readonly profileId: RenderProfileId;
  readonly previousManifest?: RenderManifest | null;
}

export interface BuildSceneRenderFingerprintInput {
  readonly scene: Omit<SceneRenderInput, "fingerprint">;
  readonly voicePlan: VoiceRequestPlan;
  readonly subtitleTrack: SubtitleTrackPlan;
  readonly characterDirectionId: CharacterDirectionId;
  readonly profile: RenderProfile;
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

function directionOccupancyTarget(directionId: CharacterDirectionId): number {
  if (directionId === "loop_signal_navigator") return 14;
  if (directionId === "pin_field_finch") return 12;
  return 15;
}

function layer(
  sceneId: string,
  layerType: SceneRenderLayer["layerType"],
  role: SceneRenderLayer["role"],
  zIndex: number,
  required: boolean,
  resolved: boolean,
  sourceRefs: readonly string[] = [],
  numberRefs: readonly string[] = [],
): SceneRenderLayer {
  return {
    layerId: `${sceneId}:${layerType}`,
    layerType,
    logicalUri: `asset://${encodeURIComponent(sceneId)}/${layerType}`,
    required,
    resolved,
    role,
    zIndex,
    sourceRefs: [...sourceRefs],
    numberRefs: [...numberRefs],
    rightsReviewState: "not_required",
    costClass: "none_estimate",
  };
}

export function buildSceneRenderFingerprint(
  input: BuildSceneRenderFingerprintInput,
): SceneRenderFingerprint {
  const voiceScene = input.voicePlan.scenes.find((scene) => scene.sceneId === input.scene.sceneId) ?? null;
  const subtitleScene = input.subtitleTrack.scenePlans.find((scene) => scene.sceneId === input.scene.sceneId) ?? null;
  const sceneContentHash = deterministicHash({
    sceneId: input.scene.sceneId,
    sceneOrder: input.scene.sceneOrder,
    enabled: input.scene.enabled,
    durationSeconds: input.scene.durationSeconds,
    primaryVisualStrategy: input.scene.primaryVisualStrategy,
    acquisitionMode: input.scene.acquisitionMode,
    narration: input.scene.narration,
    keyCaption: input.scene.keyCaption,
    sourceRefs: input.scene.sourceRefs,
    numberRefs: input.scene.numberRefs,
    layers: input.scene.layers,
    safeArea: input.scene.structuralSafeAreaPrecheck,
  });
  const voiceHash = deterministicHash(voiceScene);
  const subtitleHash = deterministicHash(subtitleScene);
  const characterHash = deterministicHash({
    directionId: input.characterDirectionId,
    assignment: input.scene.characterAssignment,
    occupancy: input.scene.characterOccupancyPercent,
    occupancyTarget: input.scene.characterOccupancyTargetPercent,
    obstructionPolicySatisfied: input.scene.obstructionPolicySatisfied,
  });
  const profileHash = deterministicHash(input.profile);
  return {
    sceneId: input.scene.sceneId,
    fingerprintVersion: "scene-render-fingerprint-v1",
    fingerprint: deterministicHash({ sceneContentHash, voiceHash, subtitleHash, characterHash, profileHash }),
    sceneContentHash,
    voiceHash,
    subtitleHash,
    characterHash,
    profileHash,
  };
}

export function hashRenderManifest(manifest: RenderManifest): string {
  return deterministicHash({ ...manifest, manifestHash: "" });
}

export function cloneRenderManifest(manifest: RenderManifest): RenderManifest {
  return {
    ...manifest,
    profile: { ...manifest.profile },
    voicePlan: {
      ...manifest.voicePlan,
      provider: manifest.voicePlan.provider ? { ...manifest.voicePlan.provider } : null,
      scenes: manifest.voicePlan.scenes.map((scene) => ({ ...scene })),
      usage: { ...manifest.voicePlan.usage },
    },
    subtitleTrack: {
      ...manifest.subtitleTrack,
      scenePlans: manifest.subtitleTrack.scenePlans.map((scene) => ({
        ...scene,
        cues: scene.cues.map((cue) => ({ ...cue })),
      })),
      cues: manifest.subtitleTrack.cues.map((cue) => ({ ...cue })),
    },
    scenes: manifest.scenes.map((scene) => ({
      ...scene,
      sourceRefs: [...scene.sourceRefs],
      numberRefs: [...scene.numberRefs],
      layers: scene.layers.map((entry) => ({ ...entry, sourceRefs: [...entry.sourceRefs], numberRefs: [...entry.numberRefs] })),
      characterAssignment: scene.characterAssignment ? { ...scene.characterAssignment, evidenceRefs: [...scene.characterAssignment.evidenceRefs], sourceRefs: [...scene.characterAssignment.sourceRefs], numberRefs: [...scene.characterAssignment.numberRefs] } : null,
      subtitleCueIds: [...scene.subtitleCueIds],
      unresolvedRequirements: [...scene.unresolvedRequirements],
      fingerprint: { ...scene.fingerprint },
    })),
  };
}

export function buildRenderManifest(input: BuildRenderManifestInput): RenderManifest {
  const profile = RENDER_PROFILES.find((entry) => entry.profileId === input.profileId) ?? RENDER_PROFILES[0];
  const visualByScene = new Map(input.approvedPlanning.visualPlan.map((entry) => [entry.sceneId, entry]));
  const characterByScene = new Map(input.approvedCharacterMotion.sceneMotionAssignments.map((entry) => [entry.sceneId, entry]));
  const targetOccupancy = directionOccupancyTarget(input.approvedCharacterMotion.selectedDirectionId);
  const scenes = input.approvedPlanning.sceneCards
    .slice()
    .sort((left, right) => left.order - right.order)
    .map((scene): SceneRenderInput => {
      const visual = visualByScene.get(scene.sceneId);
      const subtitleScene = input.subtitleTrack.scenePlans.find((entry) => entry.sceneId === scene.sceneId);
      const assignment = characterByScene.get(scene.sceneId) ?? null;
      const manualVisual = visual ? visual.acquisitionMode !== "deterministic_overlay" : true;
      const characterEnabled = assignment?.enabled === true;
      const occupancyPercent = characterEnabled ? (assignment?.screenOccupancyClass === "compact" ? Math.min(10, targetOccupancy) : targetOccupancy) : 0;
      const primaryResolved = Boolean(visual) && !manualVisual;
      const layers: readonly SceneRenderLayer[] = [
        layer(scene.sceneId, "base_placeholder", "guide", 0, true, true),
        layer(scene.sceneId, "primary_visual", "primary", 10, true, primaryResolved, scene.sourceRefs, scene.provenance.numberRefs),
        layer(scene.sceneId, "supporting_visual", "secondary", 20, false, true, scene.sourceRefs, scene.provenance.numberRefs),
        layer(scene.sceneId, "source_metadata", "overlay", 30, scene.sourceRefs.length > 0, scene.sourceRefs.length > 0, scene.sourceRefs),
        layer(scene.sceneId, "number_chart_metadata", "overlay", 35, scene.provenance.numberRefs.length > 0, scene.provenance.numberRefs.length > 0, [], scene.provenance.numberRefs),
        layer(scene.sceneId, "character", "secondary", 40, characterEnabled, characterEnabled),
        layer(scene.sceneId, "subtitle", "overlay", 50, true, Boolean(subtitleScene?.cues.length)),
        layer(scene.sceneId, "key_caption", "overlay", 60, Boolean(scene.keyCaption.trim()), Boolean(scene.keyCaption.trim())),
        layer(scene.sceneId, "safe_area", "guide", 100, true, true),
      ];
      const unresolvedRequirements = layers.filter((entry) => entry.required && !entry.resolved).map((entry) => `${entry.layerType}:unresolved`);
      if (visual?.requiresOwnerApproval && !visual.ownerApprovalConfirmed) unresolvedRequirements.push("paid_or_manual_visual:owner_approval_missing");
      if (visual?.requiresOwnerApproval && visual.rightsReviewState !== "reviewed_for_planning") unresolvedRequirements.push("manual_visual:rights_unresolved");
      if (assignment?.obstructionWarning) unresolvedRequirements.push("character:obstruction_warning");
      const withoutFingerprint: Omit<SceneRenderInput, "fingerprint"> = {
        sceneId: scene.sceneId,
        sceneOrder: scene.order,
        enabled: scene.enabled,
        durationSeconds: subtitleScene ? Math.round((subtitleScene.endSeconds - subtitleScene.startSeconds) * 1000) / 1000 : 0,
        primaryVisualStrategy: visual?.primaryStrategy ?? "number_text_motion",
        acquisitionMode: visual?.acquisitionMode ?? "deterministic_overlay",
        narration: scene.narration,
        keyCaption: scene.keyCaption,
        sourceRefs: [...scene.sourceRefs],
        numberRefs: [...scene.provenance.numberRefs],
        layers,
        characterAssignment: assignment ? { ...assignment, evidenceRefs: [...assignment.evidenceRefs], sourceRefs: [...assignment.sourceRefs], numberRefs: [...assignment.numberRefs] } : null,
        subtitleCueIds: subtitleScene?.cues.map((cue) => cue.cueId) ?? [],
        unresolvedRequirements,
        characterOccupancyPercent: occupancyPercent,
        characterOccupancyTargetPercent: targetOccupancy,
        characterOverlapsSubtitleSafeZone: false,
        characterIntrudesPrimarySafeZone: assignment?.obstructionWarning != null,
        obstructionPolicySatisfied: assignment?.obstructionWarning == null,
        characterIsPrimaryVisual: visual?.primaryStrategy === "character_motion",
        captionDensityClass: scene.keyCaption.length > 34 || (subtitleScene?.cues.some((cue) => cue.text.length > 32) ?? false) ? "dense" : "normal",
        evidenceDensityClass: scene.sourceRefs.length + scene.provenance.numberRefs.length >= 5 ? "dense" : "normal",
        structuralSafeAreaPrecheck: "STRUCTURAL_SAFE_AREA_PRECHECK",
      };
      return {
        ...withoutFingerprint,
        fingerprint: buildSceneRenderFingerprint({
          scene: withoutFingerprint,
          voicePlan: input.voicePlan,
          subtitleTrack: input.subtitleTrack,
          characterDirectionId: input.approvedCharacterMotion.selectedDirectionId,
          profile,
        }),
      };
    });
  const base: RenderManifest = {
    manifestVersion: "render-manifest-v1",
    sourcePlanningIdentity: input.approvedCharacterMotion.sourcePlanningIdentity,
    sourceScriptHash: input.approvedPlanning.approvedScriptNormalizedHash,
    selectedAngleId: input.approvedPlanning.selectedAngleId,
    selectedCharacterDirectionId: input.approvedCharacterMotion.selectedDirectionId,
    profile: { ...profile },
    voicePlan: { ...input.voicePlan, provider: input.voicePlan.provider ? { ...input.voicePlan.provider } : null, scenes: input.voicePlan.scenes.map((scene) => ({ ...scene })), usage: { ...input.voicePlan.usage } },
    subtitleTrack: { ...input.subtitleTrack, scenePlans: input.subtitleTrack.scenePlans.map((scene) => ({ ...scene, cues: scene.cues.map((cue) => ({ ...cue })) })), cues: input.subtitleTrack.cues.map((cue) => ({ ...cue })) },
    scenes,
    enabledSceneCount: scenes.filter((scene) => scene.enabled).length,
    totalDurationSeconds: Math.round(scenes.filter((scene) => scene.enabled).reduce((total, scene) => total + scene.durationSeconds, 0) * 1000) / 1000,
    globalSafeAreaPolicy: "evidence_first_no_obstruction",
    integrationReadiness: "INTEGRATION_PRECHECK_ONLY",
    manifestHash: "",
    renderExecuted: false,
    audioCreated: false,
    externalRequestsMade: false,
    productionReady: false,
  };
  return cloneRenderManifest({ ...base, manifestHash: hashRenderManifest(base) });
}
