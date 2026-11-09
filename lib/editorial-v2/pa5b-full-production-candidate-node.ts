import { createHash } from "node:crypto";

import { buildAudioAlignedSubtitleTrack, validateAudioAlignedSubtitleTrack } from "./audio-alignment";
import type { EditorialV2LocalStoreConfiguration } from "./contracts";
import { readProject } from "./project-store-node";
import type { VoiceMaterializationScenePlan } from "./voice-materialization-contracts";
import { buildVoiceMaterializationPlan, validateVoiceMaterializationPlan } from "./voice-materialization-node";
import { readLatestVoiceMaterializationSet, readVoiceSceneAudioDescriptor, readVoiceSceneAudioMetadata } from "./voice-audio-store-node";

export const PA5B_FULL_PRODUCTION_CLASSIFICATION = "PA5B_FULL_8_SCENE_LOCAL_PRODUCTION_CANDIDATE" as const;
export const PA5B_WIDTH = 1080;
export const PA5B_HEIGHT = 1920;
export const PA5B_FPS = 30;
export const PA5B_SCENE_COUNT = 8;
export const PA5B_MAX_NARRATION_CHARACTERS = 180;
export const PA5B_PER_SCENE_TTS_REQUEST_MAX = 1;
export const PA5B_AUTOMATIC_RETRY_LIMIT = 0;
export const PA5B_FALLBACK_LIMIT = 0;

export interface Pa5bScenePreflight {
  readonly sceneId: string;
  readonly sceneOrder: number;
  readonly narration: string;
  readonly characterCount: number;
  readonly audioStatus: "existing_verified" | "tts_required";
  readonly timestampAlignmentStatus: "provider_character_timestamps_aligned" | "tts_required";
  readonly visualImplementationStatus: "original_evidence_graphic_planned";
  readonly subtitleStatus: "provider_timestamp_ready" | "blocked_until_tts";
  readonly renderability: "render_ready" | "blocked_tts_required";
  readonly blockers: readonly string[];
  readonly sceneAudioIdentity: string;
}

export interface Pa5bFullProductionPreflight {
  readonly classification: typeof PA5B_FULL_PRODUCTION_CLASSIFICATION;
  readonly projectId: string;
  readonly projectRevision: number;
  readonly renderCheckpointHash: string;
  readonly voiceId: string;
  readonly modelId: string;
  readonly outputFormat: string;
  readonly planHash: string;
  readonly scenes: readonly Pa5bScenePreflight[];
  readonly existingAudioSceneIds: readonly string[];
  readonly newTtsSceneIds: readonly string[];
  readonly totalCanonicalCharacters: number;
  readonly totalNewTtsCharacters: number;
  readonly expectedMaximumTtsRequests: number;
  readonly perSceneTtsRequestMaximum: 1;
  readonly automaticRetryLimit: 0;
  readonly fallbackLimit: 0;
  readonly externalRequestsMade: 0;
  readonly fullLocalRenderBlockedUntilAllAudioValid: boolean;
  readonly preflightHash: string;
}

export interface Pa5bFullCandidateRenderPlan {
  readonly classification: typeof PA5B_FULL_PRODUCTION_CLASSIFICATION;
  readonly width: 1080;
  readonly height: 1920;
  readonly fps: 30;
  readonly sceneCount: 8;
  readonly productionReady: false;
  readonly publicLaunchReady: false;
  readonly renderExecutionAllowed: boolean;
  readonly blockedSceneIds: readonly string[];
  readonly scenes: readonly { readonly sceneId: string; readonly sceneOrder: number; readonly visualMode: "original_evidence_first_information_graphic"; readonly subtitleAuthority: "provider_character_timestamps_required"; readonly transition: "timeline_progress_cut" }[];
  readonly renderPlanHash: string;
}

function stable(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stable(record[key])}`).join(",")}}`;
}
function hash(value: unknown): string { return createHash("sha256").update(stable(value), "utf8").digest("hex"); }

async function scenePreflight(
  configuration: EditorialV2LocalStoreConfiguration,
  projectId: string,
  sourceRenderCheckpointHash: string,
  materializationSetId: string,
  scene: VoiceMaterializationScenePlan,
): Promise<Pa5bScenePreflight> {
  try {
    const [descriptor, metadata] = await Promise.all([
      readVoiceSceneAudioDescriptor(configuration, projectId, scene.sceneAudioIdentity),
      readVoiceSceneAudioMetadata(configuration, projectId, scene.sceneAudioIdentity),
    ]);
    if (!metadata
      || metadata.sceneId !== scene.sceneId
      || metadata.sceneOrder !== scene.sceneOrder
      || metadata.narrationHash !== scene.narrationHash
      || metadata.sourceRenderCheckpointHash !== sourceRenderCheckpointHash
      || metadata.audioSha256 !== descriptor.audioSha256
      || metadata.alignmentStatus !== "provider_character_timestamps_aligned"
      || metadata.audioAlignmentUsable !== true) throw new Error("PA5B_EXISTING_AUDIO_IDENTITY_INVALID");
    const track = buildAudioAlignedSubtitleTrack(sourceRenderCheckpointHash, materializationSetId, [{ sceneId: scene.sceneId, sceneOrder: scene.sceneOrder, narration: scene.narration, keyCaption: scene.keyCaption, audioDurationMs: metadata.durationMs, alignment: metadata.alignment }]);
    if (validateAudioAlignedSubtitleTrack(track).length !== 0 || track.cues.length === 0) throw new Error("PA5B_EXISTING_SUBTITLE_TRACK_INVALID");
    return { sceneId: scene.sceneId, sceneOrder: scene.sceneOrder, narration: scene.narration, characterCount: scene.characterCount, audioStatus: "existing_verified", timestampAlignmentStatus: "provider_character_timestamps_aligned", visualImplementationStatus: "original_evidence_graphic_planned", subtitleStatus: "provider_timestamp_ready", renderability: "render_ready", blockers: [], sceneAudioIdentity: scene.sceneAudioIdentity };
  } catch {
    return { sceneId: scene.sceneId, sceneOrder: scene.sceneOrder, narration: scene.narration, characterCount: scene.characterCount, audioStatus: "tts_required", timestampAlignmentStatus: "tts_required", visualImplementationStatus: "original_evidence_graphic_planned", subtitleStatus: "blocked_until_tts", renderability: "blocked_tts_required", blockers: ["TTS_REQUIRED", "PROVIDER_TIMESTAMP_REQUIRED"], sceneAudioIdentity: scene.sceneAudioIdentity };
  }
}

export function validatePa5bFullProductionPreflight(preflight: Pa5bFullProductionPreflight): readonly string[] {
  const issues: string[] = [];
  if (preflight.classification !== PA5B_FULL_PRODUCTION_CLASSIFICATION || preflight.projectRevision !== 6 || !/^[a-f0-9]{64}$/u.test(preflight.renderCheckpointHash) || !/^[a-f0-9]{64}$/u.test(preflight.planHash) || !/^[a-f0-9]{64}$/u.test(preflight.preflightHash)) issues.push("PA5B_IDENTITY_INVALID");
  if (preflight.scenes.length !== PA5B_SCENE_COUNT || preflight.scenes.some((scene, index) => scene.sceneOrder !== index + 1 || scene.characterCount <= 0 || scene.characterCount > PA5B_MAX_NARRATION_CHARACTERS)) issues.push("PA5B_SCENE_CONTRACT_INVALID");
  const existing = preflight.scenes.filter((scene) => scene.audioStatus === "existing_verified");
  const missing = preflight.scenes.filter((scene) => scene.audioStatus === "tts_required");
  if (preflight.existingAudioSceneIds.join("|") !== existing.map((scene) => scene.sceneId).join("|") || preflight.newTtsSceneIds.join("|") !== missing.map((scene) => scene.sceneId).join("|")) issues.push("PA5B_AUDIO_MATRIX_INVALID");
  if (preflight.expectedMaximumTtsRequests !== missing.length || preflight.perSceneTtsRequestMaximum !== PA5B_PER_SCENE_TTS_REQUEST_MAX || preflight.automaticRetryLimit !== PA5B_AUTOMATIC_RETRY_LIMIT || preflight.fallbackLimit !== PA5B_FALLBACK_LIMIT || preflight.externalRequestsMade !== 0) issues.push("PA5B_TTS_BUDGET_INVALID");
  if (preflight.totalCanonicalCharacters !== preflight.scenes.reduce((total, scene) => total + scene.characterCount, 0) || preflight.totalNewTtsCharacters !== missing.reduce((total, scene) => total + scene.characterCount, 0)) issues.push("PA5B_CHARACTER_TOTAL_INVALID");
  if (preflight.fullLocalRenderBlockedUntilAllAudioValid !== (missing.length > 0) || hash({ ...preflight, preflightHash: "0".repeat(64) }) !== preflight.preflightHash) issues.push("PA5B_PRELIGHT_HASH_INVALID");
  return [...new Set(issues)];
}

export function buildPa5bFullCandidateRenderPlan(preflight: Pa5bFullProductionPreflight): Pa5bFullCandidateRenderPlan {
  const issues = validatePa5bFullProductionPreflight(preflight);
  if (issues.length > 0) throw new Error(`PA5B_PREFLIGHT_INVALID:${issues.join(",")}`);
  const base = {
    classification: PA5B_FULL_PRODUCTION_CLASSIFICATION,
    width: 1080 as const,
    height: 1920 as const,
    fps: 30 as const,
    sceneCount: 8 as const,
    productionReady: false as const,
    publicLaunchReady: false as const,
    renderExecutionAllowed: preflight.newTtsSceneIds.length === 0,
    blockedSceneIds: [...preflight.newTtsSceneIds],
    scenes: preflight.scenes.map((scene) => ({ sceneId: scene.sceneId, sceneOrder: scene.sceneOrder, visualMode: "original_evidence_first_information_graphic" as const, subtitleAuthority: "provider_character_timestamps_required" as const, transition: "timeline_progress_cut" as const })),
    renderPlanHash: "0".repeat(64),
  };
  return { ...base, renderPlanHash: hash(base) } as Pa5bFullCandidateRenderPlan;
}

export async function buildPa5bFullProductionPreflight(
  configuration: EditorialV2LocalStoreConfiguration,
  projectId: string,
): Promise<Pa5bFullProductionPreflight> {
  if (!configuration.enabled || !configuration.localOnly || configuration.exposeDataRoot) throw new Error("PA5B_LOCAL_PERSISTENCE_REQUIRED");
  const projectResult = await readProject(configuration, projectId);
  if (!projectResult.ok || !projectResult.snapshot) throw new Error(`PA5B_PROJECT_UNAVAILABLE:${projectResult.status}`);
  const project = projectResult.snapshot;
  if (project.revision !== 6 || project.metadata.status !== "active") throw new Error("PA5B_CANONICAL_PROJECT_REVISION_INVALID");
  const sourceSet = await readLatestVoiceMaterializationSet(configuration, projectId);
  if (!sourceSet || sourceSet.projectRevision !== project.revision || sourceSet.failedSceneIds.length !== 0 || sourceSet.pendingSceneIds.length !== 0) throw new Error("PA5B_VOICE_CONFIGURATION_UNAVAILABLE");
  const plan = buildVoiceMaterializationPlan(project, { voiceId: sourceSet.voiceId, modelId: sourceSet.modelId });
  if (validateVoiceMaterializationPlan(plan).length !== 0 || plan.sceneCount !== PA5B_SCENE_COUNT || plan.scenes.some((scene) => scene.characterCount > PA5B_MAX_NARRATION_CHARACTERS)) throw new Error("PA5B_CANONICAL_PLAN_INVALID");
  const scenes = await Promise.all(plan.scenes.map((scene) => scenePreflight(configuration, projectId, plan.sourceRenderCheckpointHash, sourceSet.materializationSetId, scene)));
  const base = {
    classification: PA5B_FULL_PRODUCTION_CLASSIFICATION,
    projectId,
    projectRevision: project.revision,
    renderCheckpointHash: plan.sourceRenderCheckpointHash,
    voiceId: plan.voiceId,
    modelId: plan.modelId,
    outputFormat: plan.outputFormat,
    planHash: plan.planHash,
    scenes,
    existingAudioSceneIds: scenes.filter((scene) => scene.audioStatus === "existing_verified").map((scene) => scene.sceneId),
    newTtsSceneIds: scenes.filter((scene) => scene.audioStatus === "tts_required").map((scene) => scene.sceneId),
    totalCanonicalCharacters: plan.totalCharacters,
    totalNewTtsCharacters: scenes.filter((scene) => scene.audioStatus === "tts_required").reduce((total, scene) => total + scene.characterCount, 0),
    expectedMaximumTtsRequests: scenes.filter((scene) => scene.audioStatus === "tts_required").length,
    perSceneTtsRequestMaximum: 1 as const,
    automaticRetryLimit: 0 as const,
    fallbackLimit: 0 as const,
    externalRequestsMade: 0 as const,
    fullLocalRenderBlockedUntilAllAudioValid: scenes.some((scene) => scene.audioStatus !== "existing_verified"),
    preflightHash: "0".repeat(64),
  };
  const preflight = { ...base, preflightHash: hash(base) } as Pa5bFullProductionPreflight;
  const issues = validatePa5bFullProductionPreflight(preflight);
  if (issues.length > 0) throw new Error(`PA5B_PREFLIGHT_INVALID:${issues.join(",")}`);
  return preflight;
}
