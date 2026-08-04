import type {
  ApprovedDetailedScriptSessionSnapshot,
  AssetAcquisitionMode,
  CharacterMotionTag,
  RightsReviewState,
  SceneCardDraft,
  SceneVisualPlan,
  VisualStrategyType,
} from "./contracts";
import { buildSceneCardDrafts, cloneSceneCardDrafts } from "./scene-cards";
import { buildVisualAssetPlan, createSceneVisualPlanForStrategy } from "./visual-planning";

const FORBIDDEN_KEYS = new Set(["__proto__", "prototype", "constructor"]);
const MANUAL_STRATEGIES = new Set<VisualStrategyType>(["generated_image", "generated_video", "stock_video", "direct_upload"]);

export interface SceneOverrideResult {
  readonly sceneCards: readonly SceneCardDraft[];
  readonly visualPlan: readonly SceneVisualPlan[];
}

type EditableSceneTextField =
  | "narration"
  | "keyCaption"
  | "visualizationType"
  | "characterMotion"
  | "cameraOrScreenMotion"
  | "transition"
  | "soundEffect"
  | "retentionBeat";

function safeSceneId(sceneId: string): boolean {
  return sceneId.length > 0 && !FORBIDDEN_KEYS.has(sceneId);
}

function revisedScene(scene: SceneCardDraft, patch: Partial<Pick<SceneCardDraft,
  | "narration"
  | "keyCaption"
  | "visualizationType"
  | "characterMotion"
  | "cameraOrScreenMotion"
  | "transition"
  | "soundEffect"
  | "retentionBeat"
  | "enabled"
>>): SceneCardDraft {
  return {
    ...scene,
    ...patch,
    evidenceRefs: [...scene.evidenceRefs],
    sourceRefs: [...scene.sourceRefs],
    provenance: {
      ...scene.provenance,
      claimRefs: [...scene.provenance.claimRefs],
      numberRefs: [...scene.provenance.numberRefs],
      sourceRefs: [...scene.provenance.sourceRefs],
      sceneRevision: {
        value: scene.provenance.sceneRevision.value + 1,
        origin: "user_override",
      },
    },
  };
}

export function editSceneCardText(
  sceneCards: readonly SceneCardDraft[],
  sceneId: string,
  field: EditableSceneTextField,
  value: string,
): readonly SceneCardDraft[] {
  if (!safeSceneId(sceneId)) return cloneSceneCardDrafts(sceneCards);
  return sceneCards.map((scene) => scene.sceneId === sceneId ? revisedScene(scene, { [field]: value }) : cloneSceneCardDrafts([scene])[0]);
}

export function editSceneNarration(sceneCards: readonly SceneCardDraft[], sceneId: string, value: string): readonly SceneCardDraft[] {
  return editSceneCardText(sceneCards, sceneId, "narration", value);
}

export function editSceneKeyCaption(sceneCards: readonly SceneCardDraft[], sceneId: string, value: string): readonly SceneCardDraft[] {
  return editSceneCardText(sceneCards, sceneId, "keyCaption", value);
}

export function editSceneVisualizationType(sceneCards: readonly SceneCardDraft[], sceneId: string, value: string): readonly SceneCardDraft[] {
  return editSceneCardText(sceneCards, sceneId, "visualizationType", value);
}

export function replaceSceneCharacterMotion(sceneCards: readonly SceneCardDraft[], sceneId: string, value: CharacterMotionTag): readonly SceneCardDraft[] {
  return editSceneCardText(sceneCards, sceneId, "characterMotion", value);
}

export function replaceSceneCameraMotion(sceneCards: readonly SceneCardDraft[], sceneId: string, value: string): readonly SceneCardDraft[] {
  return editSceneCardText(sceneCards, sceneId, "cameraOrScreenMotion", value);
}

export function replaceSceneTransition(sceneCards: readonly SceneCardDraft[], sceneId: string, value: string): readonly SceneCardDraft[] {
  return editSceneCardText(sceneCards, sceneId, "transition", value);
}

export function replaceSceneSoundEffect(sceneCards: readonly SceneCardDraft[], sceneId: string, value: string): readonly SceneCardDraft[] {
  return editSceneCardText(sceneCards, sceneId, "soundEffect", value);
}

export function editSceneRetentionBeat(sceneCards: readonly SceneCardDraft[], sceneId: string, value: string): readonly SceneCardDraft[] {
  return editSceneCardText(sceneCards, sceneId, "retentionBeat", value);
}

export function toggleSceneEnabled(sceneCards: readonly SceneCardDraft[], sceneId: string): readonly SceneCardDraft[] {
  if (!safeSceneId(sceneId)) return cloneSceneCardDrafts(sceneCards);
  return sceneCards.map((scene) => scene.sceneId === sceneId ? revisedScene(scene, { enabled: !scene.enabled }) : cloneSceneCardDrafts([scene])[0]);
}

function replaceSceneAndPlan(
  sceneCards: readonly SceneCardDraft[],
  visualPlan: readonly SceneVisualPlan[],
  snapshot: ApprovedDetailedScriptSessionSnapshot,
  sceneId: string,
  update: (scene: SceneCardDraft, previous: SceneVisualPlan | undefined) => SceneVisualPlan,
): SceneOverrideResult {
  if (!safeSceneId(sceneId)) return { sceneCards: cloneSceneCardDrafts(sceneCards), visualPlan: visualPlan.map((entry) => ({ ...entry })) };
  const nextCards = sceneCards.map((scene) => scene.sceneId === sceneId ? revisedScene(scene, {}) : cloneSceneCardDrafts([scene])[0]);
  const changedScene = nextCards.find((scene) => scene.sceneId === sceneId);
  if (!changedScene) return { sceneCards: nextCards, visualPlan: visualPlan.map((entry) => ({ ...entry })) };
  const previous = visualPlan.find((entry) => entry.sceneId === sceneId);
  const replacement = update(changedScene, previous);
  return {
    sceneCards: nextCards,
    visualPlan: visualPlan.map((entry) => entry.sceneId === sceneId ? replacement : { ...entry }),
  };
}

function carryForwardVisualPlan(
  scene: SceneCardDraft,
  snapshot: ApprovedDetailedScriptSessionSnapshot,
  previous: SceneVisualPlan | undefined,
): SceneVisualPlan {
  const base = createSceneVisualPlanForStrategy(scene, snapshot, previous?.primaryStrategy ?? "official_source_card", previous);
  if (!previous) return base;
  return {
    ...previous,
    sceneRevision: { ...scene.provenance.sceneRevision },
    secondaryStrategies: [...previous.secondaryStrategies],
    evidenceRefs: [...base.evidenceRefs],
    sourceRefs: [...base.sourceRefs],
    numberRefs: [...base.numberRefs],
    chartPlan: previous.chartPlan ? { ...previous.chartPlan, numberRefs: [...previous.chartPlan.numberRefs], labels: [...previous.chartPlan.labels] } : null,
    sourceCardPlan: previous.sourceCardPlan ? { ...previous.sourceCardPlan, sourceRefs: [...previous.sourceCardPlan.sourceRefs], publisherLabels: [...previous.sourceCardPlan.publisherLabels] } : null,
    timelinePlan: previous.timelinePlan ? { entries: previous.timelinePlan.entries.map((entry) => ({ ...entry })) } : null,
    relationshipDiagramPlan: previous.relationshipDiagramPlan ? { ...previous.relationshipDiagramPlan, labels: [...previous.relationshipDiagramPlan.labels], evidenceRefs: [...previous.relationshipDiagramPlan.evidenceRefs] } : null,
    generatedImagePlan: previous.generatedImagePlan ? { ...previous.generatedImagePlan } : null,
    generatedVideoPlan: previous.generatedVideoPlan ? { ...previous.generatedVideoPlan } : null,
    stockVideoPlan: previous.stockVideoPlan ? { ...previous.stockVideoPlan } : null,
    directUploadPlan: previous.directUploadPlan ? { ...previous.directUploadPlan } : null,
    characterMotionTag: base.characterMotionTag,
    cameraMotion: base.cameraMotion,
    warnings: [...previous.warnings],
    blockingIssues: [...previous.blockingIssues],
  };
}

export function overridePrimaryStrategy(
  sceneCards: readonly SceneCardDraft[],
  visualPlan: readonly SceneVisualPlan[],
  snapshot: ApprovedDetailedScriptSessionSnapshot,
  sceneId: string,
  strategy: VisualStrategyType,
): SceneOverrideResult {
  return replaceSceneAndPlan(sceneCards, visualPlan, snapshot, sceneId, (scene, previous) =>
    createSceneVisualPlanForStrategy(scene, snapshot, strategy, previous));
}

export function overrideSecondaryStrategies(
  sceneCards: readonly SceneCardDraft[],
  visualPlan: readonly SceneVisualPlan[],
  snapshot: ApprovedDetailedScriptSessionSnapshot,
  sceneId: string,
  strategies: readonly VisualStrategyType[],
): SceneOverrideResult {
  return replaceSceneAndPlan(sceneCards, visualPlan, snapshot, sceneId, (scene, previous) => {
    const base = createSceneVisualPlanForStrategy(scene, snapshot, previous?.primaryStrategy ?? "official_source_card", previous);
    const secondaryStrategies = [...new Set(strategies.filter((entry) => entry !== base.primaryStrategy))];
    const manualStrategy = secondaryStrategies.find((entry) => MANUAL_STRATEGIES.has(entry));
    if (!manualStrategy) return { ...base, secondaryStrategies };
    const manualSupport = createSceneVisualPlanForStrategy(scene, snapshot, manualStrategy, previous);
    return {
      ...base,
      secondaryStrategies,
      acquisitionMode: manualSupport.acquisitionMode,
      generatedImagePlan: manualSupport.generatedImagePlan,
      generatedVideoPlan: manualSupport.generatedVideoPlan,
      stockVideoPlan: manualSupport.stockVideoPlan,
      directUploadPlan: manualSupport.directUploadPlan,
      generationPromptDraft: manualSupport.generationPromptDraft,
      stockContextRequirement: manualSupport.stockContextRequirement,
      directUploadRequirement: manualSupport.directUploadRequirement,
      costClass: manualSupport.costClass,
      requiresOwnerApproval: true,
      ownerApprovalConfirmed: previous?.ownerApprovalConfirmed ?? false,
      rightsReviewState: previous?.rightsReviewState === "reviewed_for_planning" ? "reviewed_for_planning" : "pending_manual_review",
    };
  });
}

export function editGenerationPromptDraft(
  sceneCards: readonly SceneCardDraft[],
  visualPlan: readonly SceneVisualPlan[],
  snapshot: ApprovedDetailedScriptSessionSnapshot,
  sceneId: string,
  promptDraft: string,
): SceneOverrideResult {
  return replaceSceneAndPlan(sceneCards, visualPlan, snapshot, sceneId, (scene, previous) => {
    const base = createSceneVisualPlanForStrategy(scene, snapshot, previous?.primaryStrategy ?? "generated_image", previous);
    return {
      ...base,
      generationPromptDraft: promptDraft,
      generatedImagePlan: base.generatedImagePlan ? { ...base.generatedImagePlan, promptDraft } : null,
      generatedVideoPlan: base.generatedVideoPlan ? { ...base.generatedVideoPlan, promptDraft } : null,
    };
  });
}

export function changeAcquisitionMode(
  sceneCards: readonly SceneCardDraft[],
  visualPlan: readonly SceneVisualPlan[],
  snapshot: ApprovedDetailedScriptSessionSnapshot,
  sceneId: string,
  acquisitionMode: AssetAcquisitionMode,
): SceneOverrideResult {
  const strategyByMode: Readonly<Record<Exclude<AssetAcquisitionMode, "deterministic_overlay">, VisualStrategyType>> = {
    manual_ai_image: "generated_image",
    manual_ai_video: "generated_video",
    manual_stock: "stock_video",
    direct_upload_required: "direct_upload",
  };
  return replaceSceneAndPlan(sceneCards, visualPlan, snapshot, sceneId, (scene, previous) => {
    const previousStrategy = previous?.primaryStrategy ?? "official_source_card";
    const strategy = acquisitionMode === "deterministic_overlay"
      ? MANUAL_STRATEGIES.has(previousStrategy) ? "official_source_card" : previousStrategy
      : strategyByMode[acquisitionMode];
    return createSceneVisualPlanForStrategy(scene, snapshot, strategy, previous);
  });
}

export function setDirectUploadRequired(
  sceneCards: readonly SceneCardDraft[],
  visualPlan: readonly SceneVisualPlan[],
  snapshot: ApprovedDetailedScriptSessionSnapshot,
  sceneId: string,
  required: boolean,
): SceneOverrideResult {
  if (required) return overridePrimaryStrategy(sceneCards, visualPlan, snapshot, sceneId, "direct_upload");
  const defaults = buildVisualAssetPlan(sceneCards, snapshot);
  const defaultPlan = defaults.find((entry) => entry.sceneId === sceneId);
  return overridePrimaryStrategy(sceneCards, visualPlan, snapshot, sceneId, defaultPlan?.primaryStrategy ?? "official_source_card");
}

export function setVisualRightsReviewState(
  sceneCards: readonly SceneCardDraft[],
  visualPlan: readonly SceneVisualPlan[],
  snapshot: ApprovedDetailedScriptSessionSnapshot,
  sceneId: string,
  rightsReviewState: RightsReviewState,
): SceneOverrideResult {
  return replaceSceneAndPlan(sceneCards, visualPlan, snapshot, sceneId, (scene, previous) => ({
    ...carryForwardVisualPlan(scene, snapshot, previous),
    rightsReviewState,
  }));
}

export function setVisualOwnerApproval(
  sceneCards: readonly SceneCardDraft[],
  visualPlan: readonly SceneVisualPlan[],
  snapshot: ApprovedDetailedScriptSessionSnapshot,
  sceneId: string,
  ownerApprovalConfirmed: boolean,
): SceneOverrideResult {
  return replaceSceneAndPlan(sceneCards, visualPlan, snapshot, sceneId, (scene, previous) => ({
    ...carryForwardVisualPlan(scene, snapshot, previous),
    ownerApprovalConfirmed,
  }));
}

export function resetOneSceneToDeterministicDefault(
  sceneCards: readonly SceneCardDraft[],
  visualPlan: readonly SceneVisualPlan[],
  snapshot: ApprovedDetailedScriptSessionSnapshot,
  sceneId: string,
): SceneOverrideResult {
  if (!safeSceneId(sceneId)) return { sceneCards: cloneSceneCardDrafts(sceneCards), visualPlan: visualPlan.map((entry) => ({ ...entry })) };
  const defaultCards = buildSceneCardDrafts(snapshot);
  const defaultScene = defaultCards.find((entry) => entry.sceneId === sceneId);
  if (!defaultScene) return { sceneCards: cloneSceneCardDrafts(sceneCards), visualPlan: visualPlan.map((entry) => ({ ...entry })) };
  const resetScene = revisedScene(defaultScene, {});
  const resetPlan = createSceneVisualPlanForStrategy(resetScene, snapshot, buildVisualAssetPlan([resetScene], snapshot)[0]?.primaryStrategy ?? "official_source_card");
  return {
    sceneCards: sceneCards.map((entry) => entry.sceneId === sceneId ? resetScene : cloneSceneCardDrafts([entry])[0]),
    visualPlan: visualPlan.map((entry) => entry.sceneId === sceneId ? resetPlan : { ...entry }),
  };
}
