import type {
  ApprovedDetailedScriptSessionSnapshot,
  EvidencePackDraft,
  SceneCardDraft,
  SceneCardValidationSummary,
  ScenePlanningSessionState,
  SceneVisualPlan,
  VisualProofSummary,
} from "./contracts";
import { cloneSceneCardDrafts } from "./scene-cards";

export type ScenePlanningSessionEvent =
  | { readonly type: "approved_script_changed"; readonly snapshot: ApprovedDetailedScriptSessionSnapshot | null }
  | { readonly type: "scene_cards_regenerated"; readonly sceneCards: readonly SceneCardDraft[]; readonly validation: SceneCardValidationSummary }
  | { readonly type: "scene_cards_changed"; readonly sceneCards: readonly SceneCardDraft[]; readonly validation: SceneCardValidationSummary }
  | { readonly type: "scene_cards_approved" }
  | { readonly type: "scene_cards_approval_cancelled" }
  | { readonly type: "visual_plan_generated"; readonly visualPlan: readonly SceneVisualPlan[]; readonly visualProof: VisualProofSummary }
  | { readonly type: "visual_plan_changed"; readonly sceneCards: readonly SceneCardDraft[]; readonly sceneValidation: SceneCardValidationSummary; readonly visualPlan: readonly SceneVisualPlan[]; readonly visualProof: VisualProofSummary }
  | { readonly type: "planning_approved" }
  | { readonly type: "planning_approval_cancelled" }
  | { readonly type: "reset_all" };

function cloneEvidencePack(evidencePack: EvidencePackDraft): EvidencePackDraft {
  return {
    ...evidencePack,
    provenance: { ...evidencePack.provenance },
    sources: evidencePack.sources.map((entry) => ({ ...entry })),
    claims: evidencePack.claims.map((entry) => ({
      ...entry,
      sourceRefs: [...entry.sourceRefs],
      numberRefs: [...entry.numberRefs],
    })),
    numbers: evidencePack.numbers.map((entry) => ({ ...entry, sourceRefs: [...entry.sourceRefs] })),
    coverage: {
      ...evidencePack.coverage,
      signalCoverage: evidencePack.coverage.signalCoverage.map((entry) => ({ ...entry })),
      warnings: [...evidencePack.coverage.warnings],
    },
  };
}

export function cloneApprovedDetailedScriptSnapshot(
  snapshot: ApprovedDetailedScriptSessionSnapshot,
): ApprovedDetailedScriptSessionSnapshot {
  return {
    ...snapshot,
    approvedScript: {
      ...snapshot.approvedScript,
      beats: snapshot.approvedScript.beats.map((beat) => ({
        ...beat,
        claimRefs: [...beat.claimRefs],
        sourceRefs: [...beat.sourceRefs],
        numberRefs: [...beat.numberRefs],
      })),
    },
    evidencePack: cloneEvidencePack(snapshot.evidencePack),
    selectedAngle: {
      ...snapshot.selectedAngle,
      sourceRefs: [...snapshot.selectedAngle.sourceRefs],
      claimRefs: [...snapshot.selectedAngle.claimRefs],
      numberRefs: [...snapshot.selectedAngle.numberRefs],
    },
    validation: {
      ...snapshot.validation,
      issues: snapshot.validation.issues.map((entry) => ({ ...entry })),
    },
  };
}

function cloneSceneValidation(summary: SceneCardValidationSummary): SceneCardValidationSummary {
  return { ...summary, issues: summary.issues.map((entry) => ({ ...entry })) };
}

function cloneVisualPlan(plan: readonly SceneVisualPlan[]): readonly SceneVisualPlan[] {
  return plan.map((entry) => ({
    ...entry,
    sceneRevision: { ...entry.sceneRevision },
    secondaryStrategies: [...entry.secondaryStrategies],
    evidenceRefs: [...entry.evidenceRefs],
    sourceRefs: [...entry.sourceRefs],
    numberRefs: [...entry.numberRefs],
    chartPlan: entry.chartPlan ? { ...entry.chartPlan, numberRefs: [...entry.chartPlan.numberRefs], labels: [...entry.chartPlan.labels] } : null,
    sourceCardPlan: entry.sourceCardPlan ? { ...entry.sourceCardPlan, sourceRefs: [...entry.sourceCardPlan.sourceRefs], publisherLabels: [...entry.sourceCardPlan.publisherLabels] } : null,
    timelinePlan: entry.timelinePlan ? { entries: entry.timelinePlan.entries.map((item) => ({ ...item })) } : null,
    relationshipDiagramPlan: entry.relationshipDiagramPlan ? { ...entry.relationshipDiagramPlan, labels: [...entry.relationshipDiagramPlan.labels], evidenceRefs: [...entry.relationshipDiagramPlan.evidenceRefs] } : null,
    generatedImagePlan: entry.generatedImagePlan ? { ...entry.generatedImagePlan } : null,
    generatedVideoPlan: entry.generatedVideoPlan ? { ...entry.generatedVideoPlan } : null,
    stockVideoPlan: entry.stockVideoPlan ? { ...entry.stockVideoPlan } : null,
    directUploadPlan: entry.directUploadPlan ? { ...entry.directUploadPlan } : null,
    warnings: [...entry.warnings],
    blockingIssues: [...entry.blockingIssues],
  }));
}

function cloneVisualProof(summary: VisualProofSummary): VisualProofSummary {
  return { ...summary, issues: summary.issues.map((entry) => ({ ...entry })) };
}

export function createInitialScenePlanningSession(
  approvedScript: ApprovedDetailedScriptSessionSnapshot | null = null,
): ScenePlanningSessionState {
  return {
    approvedScript: approvedScript ? cloneApprovedDetailedScriptSnapshot(approvedScript) : null,
    sceneCards: [],
    sceneValidation: null,
    sceneCardApproval: "not_approved",
    visualPlan: [],
    visualProof: null,
    planningApproval: "not_approved",
  };
}

function invalidated(previous: "not_approved" | "approved" | "invalidated"): "not_approved" | "invalidated" {
  return previous === "approved" ? "invalidated" : "not_approved";
}

export function reduceScenePlanningSession(
  state: ScenePlanningSessionState,
  event: ScenePlanningSessionEvent,
): ScenePlanningSessionState {
  switch (event.type) {
    case "approved_script_changed":
      return createInitialScenePlanningSession(event.snapshot);
    case "scene_cards_regenerated":
      return {
        ...state,
        sceneCards: cloneSceneCardDrafts(event.sceneCards),
        sceneValidation: cloneSceneValidation(event.validation),
        sceneCardApproval: invalidated(state.sceneCardApproval),
        visualPlan: [],
        visualProof: null,
        planningApproval: invalidated(state.planningApproval),
      };
    case "scene_cards_changed":
      return {
        ...state,
        sceneCards: cloneSceneCardDrafts(event.sceneCards),
        sceneValidation: cloneSceneValidation(event.validation),
        sceneCardApproval: invalidated(state.sceneCardApproval),
        visualPlan: [],
        visualProof: null,
        planningApproval: invalidated(state.planningApproval),
      };
    case "scene_cards_approved":
      return { ...state, sceneCardApproval: "approved", planningApproval: "not_approved" };
    case "scene_cards_approval_cancelled":
      return { ...state, sceneCardApproval: "invalidated", planningApproval: invalidated(state.planningApproval) };
    case "visual_plan_generated":
      return {
        ...state,
        visualPlan: cloneVisualPlan(event.visualPlan),
        visualProof: cloneVisualProof(event.visualProof),
        planningApproval: invalidated(state.planningApproval),
      };
    case "visual_plan_changed":
      return {
        ...state,
        sceneCards: cloneSceneCardDrafts(event.sceneCards),
        sceneValidation: cloneSceneValidation(event.sceneValidation),
        sceneCardApproval: invalidated(state.sceneCardApproval),
        visualPlan: cloneVisualPlan(event.visualPlan),
        visualProof: cloneVisualProof(event.visualProof),
        planningApproval: invalidated(state.planningApproval),
      };
    case "planning_approved":
      return { ...state, planningApproval: "approved" };
    case "planning_approval_cancelled":
      return { ...state, planningApproval: "invalidated" };
    case "reset_all":
      return createInitialScenePlanningSession(state.approvedScript);
  }
}

export function canApproveScenePlanning(state: ScenePlanningSessionState): boolean {
  return state.sceneCardApproval === "approved"
    && state.sceneValidation?.valid === true
    && state.visualProof?.valid === true
    && state.visualProof.blockingIssueCount === 0;
}
