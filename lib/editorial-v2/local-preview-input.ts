import { createHash } from "node:crypto";

import type {
  ApprovedCharacterMotionSessionSnapshot,
  ApprovedDetailedScriptSessionSnapshot,
  ApprovedRenderIntegrationSessionSnapshot,
  ApprovedScenePlanningSessionSnapshot,
  EditorialV2ApprovedCheckpoint,
  EditorialV2ProjectSnapshot,
  SceneRenderInput,
  SceneVisualPlan,
} from "./contracts";
import type {
  LocalPreviewRenderIdentity,
  LocalPreviewRenderInput,
  LocalPreviewSceneInput,
} from "./local-preview-contracts";
import { localPreviewProfile } from "./local-preview-contracts";
import { hashRenderManifest } from "./render-manifest";
import { validateEditorialV2ProjectSnapshot } from "./project-snapshot";

const REQUIRED_STAGES = ["editorial_intelligence", "scene_planning", "character_motion", "render_integration"] as const;

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const record = value as Readonly<Record<string, unknown>>;
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(",")}}`;
}

function deepClone<T>(value: T): T {
  const seen = new Set<object>();
  const assertSupported = (entry: unknown, path: string): void => {
    if (entry === null || typeof entry === "string" || typeof entry === "boolean") return;
    if (typeof entry === "number") {
      if (!Number.isFinite(entry)) throw new Error(`LOCAL_PREVIEW_UNSUPPORTED_NUMBER:${path}`);
      return;
    }
    if (typeof entry !== "object") throw new Error(`LOCAL_PREVIEW_UNSUPPORTED_VALUE:${path}`);
    if (seen.has(entry)) throw new Error(`LOCAL_PREVIEW_CYCLIC_VALUE:${path}`);
    seen.add(entry);
    if (Array.isArray(entry)) entry.forEach((item, index) => assertSupported(item, `${path}/${index}`));
    else {
      const prototype = Object.getPrototypeOf(entry);
      if (prototype !== Object.prototype && prototype !== null) throw new Error(`LOCAL_PREVIEW_NON_PLAIN_OBJECT:${path}`);
      Object.entries(entry as Readonly<Record<string, unknown>>).forEach(([key, item]) => assertSupported(item, `${path}/${key}`));
    }
    seen.delete(entry);
  };
  assertSupported(value, "$input");
  return JSON.parse(JSON.stringify(value)) as T;
}

function checkpoint(snapshot: EditorialV2ProjectSnapshot, stageId: typeof REQUIRED_STAGES[number]): EditorialV2ApprovedCheckpoint {
  const selected = snapshot.approvedCheckpoints.find((entry) => entry.stageId === stageId);
  if (!selected) throw new Error(`LOCAL_PREVIEW_REQUIRED_CHECKPOINT_MISSING:${stageId}`);
  return selected;
}

function assertCanonicalPayloads(
  script: ApprovedDetailedScriptSessionSnapshot,
  planning: ApprovedScenePlanningSessionSnapshot,
  character: ApprovedCharacterMotionSessionSnapshot,
  render: ApprovedRenderIntegrationSessionSnapshot,
): void {
  if (script?.approvalState !== "approved" || !script.approvedScript || !script.evidencePack) throw new Error("LOCAL_PREVIEW_SCRIPT_CHECKPOINT_INVALID");
  if (planning?.approvalState !== "approved" || planning.sceneValidation?.valid !== true || planning.visualProof?.valid !== true) throw new Error("LOCAL_PREVIEW_PLANNING_CHECKPOINT_INVALID");
  if (character?.provisionalApprovalState !== "provisionally_approved" || character.rightsReview?.blockingIssueCount !== 0 || character.accessibilityReview?.blockingIssueCount !== 0) throw new Error("LOCAL_PREVIEW_CHARACTER_CHECKPOINT_INVALID");
  if (render?.approvalState !== "approved" || render.validation?.valid !== true || render.renderManifest?.profile?.profileId !== "preview_540x960") throw new Error("LOCAL_PREVIEW_RENDER_CHECKPOINT_INVALID");
  if (render.renderManifest.manifestHash !== hashRenderManifest(render.renderManifest)) throw new Error("LOCAL_PREVIEW_RENDER_MANIFEST_HASH_MISMATCH");
  if (render.renderManifest.productionReady !== false || render.renderManifest.renderExecuted !== false || render.renderManifest.audioCreated !== false) throw new Error("LOCAL_PREVIEW_RENDER_BOUNDARY_INVALID");
  if (render.sourceDetailedScriptSnapshot.scriptNormalizedHash !== script.scriptNormalizedHash) throw new Error("LOCAL_PREVIEW_SCRIPT_IDENTITY_MISMATCH");
  if (render.sourceCharacterSnapshot.sourcePlanningIdentity !== character.sourcePlanningIdentity || render.renderManifest.sourcePlanningIdentity !== character.sourcePlanningIdentity) throw new Error("LOCAL_PREVIEW_PLANNING_IDENTITY_MISMATCH");
}

function unresolvedAssets(scene: SceneRenderInput, visual: SceneVisualPlan): readonly string[] {
  const unresolved = new Set(scene.unresolvedRequirements);
  if (visual.primaryStrategy === "map") unresolved.add("MAP_ASSET_UNAVAILABLE_IN_LOCAL_PREVIEW");
  if (["generated_image", "generated_video", "stock_video", "direct_upload"].includes(visual.primaryStrategy)) unresolved.add(`${visual.primaryStrategy.toUpperCase()}:NOT_GENERATED`);
  if (visual.acquisitionMode !== "deterministic_overlay") unresolved.add("PREVIEW_PLACEHOLDER_ONLY");
  return [...unresolved].sort();
}

function buildScene(
  script: ApprovedDetailedScriptSessionSnapshot,
  planning: ApprovedScenePlanningSessionSnapshot,
  character: ApprovedCharacterMotionSessionSnapshot,
  render: ApprovedRenderIntegrationSessionSnapshot,
  scene: SceneRenderInput,
): LocalPreviewSceneInput {
  const card = planning.sceneCards.find((entry) => entry.sceneId === scene.sceneId);
  const visual = planning.visualPlan.find((entry) => entry.sceneId === scene.sceneId);
  if (!card || !visual) throw new Error(`LOCAL_PREVIEW_SCENE_SOURCE_MISSING:${scene.sceneId}`);
  if (visual.blockingIssues.length > 0) throw new Error(`LOCAL_PREVIEW_VISUAL_STRUCTURAL_BLOCKER:${scene.sceneId}:${visual.blockingIssues.join(",")}`);
  const assignment = character.sceneMotionAssignments.find((entry) => entry.sceneId === scene.sceneId);
  if (!assignment || !assignment.enabled) throw new Error(`LOCAL_PREVIEW_CHARACTER_ASSIGNMENT_MISSING:${scene.sceneId}`);
  const subtitle = render.subtitleTrack.scenePlans.find((entry) => entry.sceneId === scene.sceneId);
  if (!subtitle || subtitle.alignmentStatus !== "estimated_not_audio_aligned") throw new Error(`LOCAL_PREVIEW_SUBTITLE_PLAN_MISSING:${scene.sceneId}`);
  const sourceMap = new Map(script.evidencePack.sources.map((entry) => [entry.sourceId, entry]));
  const numberMap = new Map(script.evidencePack.numbers.map((entry) => [entry.numberId, entry]));
  const sources = scene.sourceRefs.map((sourceRef) => {
    const source = sourceMap.get(sourceRef);
    if (!source) throw new Error(`LOCAL_PREVIEW_SOURCE_REF_UNRESOLVED:${scene.sceneId}:${sourceRef}`);
    return { sourceId: source.sourceId, publisher: source.publisher, title: source.title, publishedAt: source.publishedAt, eventDate: source.eventDate, urlText: source.url };
  });
  const numbers = scene.numberRefs.map((numberRef) => {
    const number = numberMap.get(numberRef);
    if (!number) throw new Error(`LOCAL_PREVIEW_NUMBER_REF_UNRESOLVED:${scene.sceneId}:${numberRef}`);
    return { numberId: number.numberId, value: number.value, unit: number.unit, currency: number.currency, asOf: number.asOf, context: number.context, sourceRefs: [...number.sourceRefs] };
  });
  const unresolved = unresolvedAssets(scene, visual);
  return {
    sceneId: scene.sceneId,
    order: scene.sceneOrder,
    durationMs: Math.round(scene.durationSeconds * 1000),
    beatType: card.provenance.beatType,
    purpose: card.purpose,
    narration: scene.narration,
    keyCaption: scene.keyCaption,
    sourceRefs: [...scene.sourceRefs],
    numberRefs: [...scene.numberRefs],
    claimRefs: [...card.provenance.claimRefs],
    sources,
    numbers,
    primaryVisualStrategy: visual.primaryStrategy,
    secondaryStrategies: [...visual.secondaryStrategies],
    chartLabels: [...(visual.chartPlan?.labels ?? [])],
    chartUnit: visual.chartPlan?.unit ?? null,
    timelineEntries: visual.timelinePlan?.entries.map((entry) => ({ ...entry })) ?? [],
    relationshipLabels: [...(visual.relationshipDiagramPlan?.labels ?? [])],
    characterDirection: character.selectedDirectionId,
    characterMotionTag: assignment.motionTag,
    reducedMotionTag: assignment.reducedMotionAlternative,
    estimatedSubtitleCues: subtitle.cues.map((cue) => ({ ...cue })),
    rightsState: visual.rightsReviewState,
    costClass: visual.costClass,
    unresolvedAssets: unresolved,
    assetResolution: unresolved.length === 0 ? "resolved_local_primitive" : "preview_placeholder_only",
    safeAreaState: scene.characterIntrudesPrimarySafeZone || scene.characterOverlapsSubtitleSafeZone || !scene.obstructionPolicySatisfied ? "structural_precheck_blocked" : "structural_precheck_pass",
    sceneRevision: card.provenance.sceneRevision.value,
    fingerprint: scene.fingerprint.fingerprint,
  };
}

export function buildLocalPreviewRenderInput(projectSnapshot: EditorialV2ProjectSnapshot): LocalPreviewRenderInput {
  const project = deepClone(projectSnapshot);
  const projectValidation = validateEditorialV2ProjectSnapshot(project);
  if (!projectValidation.valid) throw new Error(`LOCAL_PREVIEW_PROJECT_INTEGRITY_INVALID:${projectValidation.issues.map((issue) => issue.code).join(",")}`);
  if (project.metadata.status !== "active") throw new Error("LOCAL_PREVIEW_ARCHIVED_PROJECT_BLOCKED");
  const scriptCheckpoint = checkpoint(project, "editorial_intelligence");
  const planningCheckpoint = checkpoint(project, "scene_planning");
  const characterCheckpoint = checkpoint(project, "character_motion");
  const renderCheckpoint = checkpoint(project, "render_integration");
  const script = deepClone(scriptCheckpoint.payload) as unknown as ApprovedDetailedScriptSessionSnapshot;
  const planning = deepClone(planningCheckpoint.payload) as unknown as ApprovedScenePlanningSessionSnapshot;
  const character = deepClone(characterCheckpoint.payload) as unknown as ApprovedCharacterMotionSessionSnapshot;
  const render = deepClone(renderCheckpoint.payload) as unknown as ApprovedRenderIntegrationSessionSnapshot;
  assertCanonicalPayloads(script, planning, character, render);
  const scenes = render.renderManifest.scenes.filter((entry) => entry.enabled).slice().sort((left, right) => left.sceneOrder - right.sceneOrder).map((scene) => buildScene(script, planning, character, render, scene));
  if (scenes.length < 7 || scenes.length > 10) throw new Error("LOCAL_PREVIEW_ENABLED_SCENE_COUNT_INVALID");
  const warnings = new Set<string>([
    "PREVIEW_ONLY_NOT_FINAL_RENDER",
    "SILENT_PLACEHOLDER_AUDIO",
    "ESTIMATED_SUBTITLE_NOT_AUDIO_ALIGNED",
    "CHARACTER_MOTION_PREVIEW_PROXY",
    "NOT_PRODUCTION_READY",
  ]);
  if (scenes.some((scene) => scene.unresolvedAssets.length > 0)) warnings.add("UNRESOLVED_ASSET_PLACEHOLDERS_PRESENT");
  return deepClone({
    schemaVersion: "local-preview-input-v1",
    projectId: project.projectId,
    projectRevision: project.revision,
    projectIntegrityHash: project.integrity.canonicalHash,
    sourceCheckpointHashes: {
      editorialIntelligence: scriptCheckpoint.payloadHash,
      scenePlanning: planningCheckpoint.payloadHash,
      characterMotion: characterCheckpoint.payloadHash,
      renderIntegration: renderCheckpoint.payloadHash,
    },
    renderCheckpointHash: renderCheckpoint.payloadHash,
    profile: localPreviewProfile(),
    sceneCount: scenes.length,
    durationMs: scenes.reduce((total, scene) => total + scene.durationMs, 0),
    selectedCharacterDirection: character.selectedDirectionId,
    scenes,
    warnings: [...warnings].sort(),
    createdFromCanonicalApprovedCheckpoints: true,
  });
}

export function hashLocalPreviewRenderInput(input: LocalPreviewRenderInput): string {
  return createHash("sha256").update(stableStringify(deepClone(input)), "utf8").digest("hex");
}

export function validateLocalPreviewRenderInput(input: LocalPreviewRenderInput) {
  const issues: string[] = [];
  if (input.schemaVersion !== "local-preview-input-v1") issues.push("schema_invalid");
  if (input.profile.profileId !== "preview_540x960" || input.profile.width !== 540 || input.profile.height !== 960 || input.profile.fps !== 30) issues.push("profile_invalid");
  if (input.profile.actualFinal !== false || input.profile.productionReady !== false || input.profile.audioMode !== "silent_placeholder" || input.profile.subtitleAlignment !== "estimated_not_audio_aligned") issues.push("preview_boundary_invalid");
  if (input.createdFromCanonicalApprovedCheckpoints !== true) issues.push("canonical_authority_missing");
  if (input.sceneCount !== input.scenes.length || input.sceneCount < 7 || input.sceneCount > 10) issues.push("scene_count_invalid");
  if (input.durationMs !== input.scenes.reduce((total, scene) => total + scene.durationMs, 0)) issues.push("duration_mismatch");
  if (new Set(input.scenes.map((scene) => scene.sceneId)).size !== input.scenes.length) issues.push("scene_identity_duplicate");
  if (input.scenes.some((scene, index) => scene.order !== index + 1 || scene.durationMs <= 0 || !scene.primaryVisualStrategy || !scene.narration.trim())) issues.push("scene_shape_invalid");
  return { valid: issues.length === 0, issues } as const;
}

export function cloneLocalPreviewRenderInput(input: LocalPreviewRenderInput): LocalPreviewRenderInput {
  return deepClone(input);
}

export function buildLocalPreviewRenderIdentity(input: LocalPreviewRenderInput): LocalPreviewRenderIdentity {
  const renderInputHash = hashLocalPreviewRenderInput(input);
  return {
    renderId: `preview-${renderInputHash.slice(0, 40)}`,
    renderInputHash,
    projectId: input.projectId,
    projectRevision: input.projectRevision,
    renderCheckpointHash: input.renderCheckpointHash,
    profile: "preview_540x960",
  };
}
