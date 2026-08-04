import type {
  ApprovedScenePlanningSessionSnapshot,
  CharacterComparisonScene,
  CharacterDirectionId,
  CharacterMotionIntensity,
  CharacterMotionPlan,
  CharacterRigMotionTag,
  SceneCardDraft,
  SceneCharacterMotionAssignment,
  SceneVisualPlan,
} from "./contracts";
import { getCharacterMotionDefinition } from "./character-motion";

export interface CharacterMotionPlanValidationIssue {
  readonly code: string;
  readonly sceneId: string | null;
  readonly message: string;
  readonly blocking: boolean;
}

export interface CharacterMotionPlanValidationResult {
  readonly valid: boolean;
  readonly blockingIssueCount: number;
  readonly warningCount: number;
  readonly issues: readonly CharacterMotionPlanValidationIssue[];
}

const DIRECTION_INTENSITY: Readonly<Record<CharacterDirectionId, CharacterMotionIntensity>> = {
  loop_signal_navigator: "medium",
  pin_field_finch: "low",
  moa_archive_sprite: "medium",
};

export function buildPlanningIdentity(snapshot: ApprovedScenePlanningSessionSnapshot): string {
  const sceneIdentity = snapshot.sceneCards
    .map((scene) => `${scene.sceneId}:${scene.provenance.sceneRevision.value}:${scene.enabled ? 1 : 0}`)
    .join("|");
  const visualIdentity = snapshot.visualPlan
    .map((visual) => `${visual.sceneId}:${visual.primaryStrategy}:${visual.sceneRevision.value}`)
    .join("|");
  return [
    snapshot.approvedScriptNormalizedHash,
    snapshot.evidenceIdentity,
    snapshot.selectedAngleId,
    sceneIdentity,
    visualIdentity,
  ].join("::");
}

function visualForScene(
  snapshot: ApprovedScenePlanningSessionSnapshot,
  sceneId: string,
): SceneVisualPlan | null {
  return snapshot.visualPlan.find((entry) => entry.sceneId === sceneId) ?? null;
}

function hasEvidence(scene: SceneCardDraft, visual: SceneVisualPlan): boolean {
  return scene.evidenceRefs.length > 0 || visual.evidenceRefs.length > 0 || visual.sourceRefs.length > 0;
}

function selectSemanticMotion(
  scene: SceneCardDraft,
  visual: SceneVisualPlan,
): CharacterRigMotionTag {
  if (scene.provenance.beatType === "next_signal_to_watch") return "next_signal_point";
  if (/warning|risk|caution|주의|경고|위험/i.test(scene.purpose) && hasEvidence(scene, visual)) return "warning_pulse";
  switch (visual.primaryStrategy) {
    case "number_text_motion":
      return visual.numberRefs.length > 0 ? "number_emphasis" : "idle_scan";
    case "chart_comparison":
      return visual.numberRefs.length >= 2 ? "compare_left_right" : visual.numberRefs.length > 0 ? "chart_assist" : "idle_scan";
    case "official_source_card":
      return visual.sourceRefs.length > 0 ? "source_scan" : "idle_scan";
    case "timeline":
    case "relationship_diagram":
      return hasEvidence(scene, visual) ? "cause_effect_link" : "idle_scan";
    case "map":
      return hasEvidence(scene, visual) ? "discovery_reveal" : "idle_scan";
    default:
      return hasEvidence(scene, visual) ? "signal_detect" : "idle_scan";
  }
}

function comparisonScene(
  scene: SceneCardDraft,
  visual: SceneVisualPlan,
): CharacterComparisonScene {
  return {
    sceneId: scene.sceneId,
    sceneOrder: scene.order,
    narration: scene.narration,
    keyCaption: scene.keyCaption,
    primaryVisualStrategy: visual.primaryStrategy,
    semanticMotionTag: selectSemanticMotion(scene, visual),
    evidenceRefs: [...visual.evidenceRefs],
    sourceRefs: [...visual.sourceRefs],
    numberRefs: [...visual.numberRefs],
  };
}

export function selectRepresentativeComparisonScene(
  planningSnapshot: ApprovedScenePlanningSessionSnapshot,
): CharacterComparisonScene | null {
  const enabled = planningSnapshot.sceneCards.filter((scene) => scene.enabled);
  if (enabled.length === 0) return null;
  const middle = (Math.min(...enabled.map((scene) => scene.order)) + Math.max(...enabled.map((scene) => scene.order))) / 2;
  const ranked = enabled
    .map((scene) => ({ scene, visual: visualForScene(planningSnapshot, scene.sceneId) }))
    .filter((entry): entry is { scene: SceneCardDraft; visual: SceneVisualPlan } => entry.visual !== null)
    .sort((left, right) => {
      const leftEvidenceFirst = left.visual.primaryStrategyClass === "evidence_first" ? 1 : 0;
      const rightEvidenceFirst = right.visual.primaryStrategyClass === "evidence_first" ? 1 : 0;
      if (leftEvidenceFirst !== rightEvidenceFirst) return rightEvidenceFirst - leftEvidenceFirst;
      const leftRefs = left.visual.numberRefs.length + left.visual.sourceRefs.length > 0 ? 1 : 0;
      const rightRefs = right.visual.numberRefs.length + right.visual.sourceRefs.length > 0 ? 1 : 0;
      if (leftRefs !== rightRefs) return rightRefs - leftRefs;
      const distance = Math.abs(left.scene.order - middle) - Math.abs(right.scene.order - middle);
      return distance !== 0 ? distance : left.scene.order - right.scene.order;
    });
  const selected = ranked[0];
  return selected ? comparisonScene(selected.scene, selected.visual) : null;
}

function assignmentFor(
  scene: SceneCardDraft,
  visual: SceneVisualPlan,
  directionId: CharacterDirectionId,
  reducedMotion: boolean,
): SceneCharacterMotionAssignment {
  const motionTag = selectSemanticMotion(scene, visual);
  const motionDefinition = getCharacterMotionDefinition(motionTag);
  return {
    sceneId: scene.sceneId,
    sceneOrder: scene.order,
    directionId,
    motionTag,
    intensity: reducedMotion ? "low" : DIRECTION_INTENSITY[directionId],
    enabled: scene.enabled,
    characterRole: "secondary_evidence_navigation",
    reducedMotionAlternative: motionDefinition.reducedMotionAlternative,
    screenOccupancyClass: "compact",
    primaryVisualStrategy: visual.primaryStrategy,
    evidenceRefs: [...visual.evidenceRefs],
    sourceRefs: [...visual.sourceRefs],
    numberRefs: [...visual.numberRefs],
    obstructionWarning: null,
    userOverride: false,
  };
}

export function buildSceneCharacterMotionAssignments(
  planningSnapshot: ApprovedScenePlanningSessionSnapshot,
  directionId: CharacterDirectionId,
  reducedMotion = false,
): readonly SceneCharacterMotionAssignment[] {
  return planningSnapshot.sceneCards
    .filter((scene) => scene.enabled)
    .map((scene) => {
      const visual = visualForScene(planningSnapshot, scene.sceneId);
      if (!visual) throw new Error(`Missing visual plan for enabled scene: ${scene.sceneId}`);
      return assignmentFor(scene, visual, directionId, reducedMotion);
    });
}

export function buildCharacterMotionPlan(
  planningSnapshot: ApprovedScenePlanningSessionSnapshot,
  directionId: CharacterDirectionId,
): CharacterMotionPlan {
  return {
    planVersion: "character-motion-plan-v1",
    vocabularyVersion: "character-motion-v1",
    directionId,
    sourcePlanningIdentity: buildPlanningIdentity(planningSnapshot),
    assignments: buildSceneCharacterMotionAssignments(planningSnapshot, directionId),
    reducedMotionAssignments: buildSceneCharacterMotionAssignments(planningSnapshot, directionId, true),
    productionRendered: false,
  };
}

function sameRefs(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((entry, index) => entry === right[index]);
}

export function validateCharacterMotionPlan(
  plan: CharacterMotionPlan,
  planningSnapshot: ApprovedScenePlanningSessionSnapshot,
): CharacterMotionPlanValidationResult {
  const issues: CharacterMotionPlanValidationIssue[] = [];
  const sceneById = new Map(planningSnapshot.sceneCards.map((scene) => [scene.sceneId, scene]));
  const visualById = new Map(planningSnapshot.visualPlan.map((visual) => [visual.sceneId, visual]));
  const enabledIds = planningSnapshot.sceneCards.filter((scene) => scene.enabled).map((scene) => scene.sceneId);
  const assignmentIds = plan.assignments.map((entry) => entry.sceneId);

  if (plan.sourcePlanningIdentity !== buildPlanningIdentity(planningSnapshot)) issues.push({ code: "PLANNING_IDENTITY_MISMATCH", sceneId: null, message: "Motion plan does not match the approved planning snapshot.", blocking: true });
  if (new Set(assignmentIds).size !== assignmentIds.length) issues.push({ code: "DUPLICATE_SCENE_ASSIGNMENT", sceneId: null, message: "Each enabled scene may have one assignment.", blocking: true });
  if (!sameRefs(assignmentIds, enabledIds)) issues.push({ code: "ENABLED_SCENE_SET_MISMATCH", sceneId: null, message: "Assignments must preserve enabled scene order exactly.", blocking: true });
  if (plan.reducedMotionAssignments.length !== plan.assignments.length) issues.push({ code: "REDUCED_MOTION_SET_MISMATCH", sceneId: null, message: "Every assignment needs a reduced-motion alternative.", blocking: true });

  for (const assignment of plan.assignments) {
    const scene = sceneById.get(assignment.sceneId);
    const visual = visualById.get(assignment.sceneId);
    if (!scene || !visual) {
      issues.push({ code: "UNSUPPORTED_SCENE_REF", sceneId: assignment.sceneId, message: "Assignment references an unknown scene or visual plan.", blocking: true });
      continue;
    }
    if (!scene.enabled && assignment.enabled) issues.push({ code: "DISABLED_SCENE_ACTIVE", sceneId: assignment.sceneId, message: "Disabled scenes cannot receive active motion.", blocking: true });
    if (assignment.directionId !== plan.directionId) issues.push({ code: "DIRECTION_MISMATCH", sceneId: assignment.sceneId, message: "Assignment direction must match the plan.", blocking: true });
    if (assignment.characterRole !== "secondary_evidence_navigation") issues.push({ code: "CHARACTER_PRIMARY_ROLE", sceneId: assignment.sceneId, message: "Character must remain a secondary evidence-navigation layer.", blocking: true });
    if (assignment.primaryVisualStrategy !== visual.primaryStrategy) issues.push({ code: "PRIMARY_STRATEGY_MUTATED", sceneId: assignment.sceneId, message: "Character planning cannot change the primary visual strategy.", blocking: true });
    if (assignment.motionTag === "number_emphasis" && assignment.numberRefs.length === 0) issues.push({ code: "NUMBER_REF_REQUIRED", sceneId: assignment.sceneId, message: "Number emphasis requires a real number ref.", blocking: true });
    if (["source_scan", "source_card_assist"].includes(assignment.motionTag) && assignment.sourceRefs.length === 0) issues.push({ code: "SOURCE_REF_REQUIRED", sceneId: assignment.sceneId, message: "Source motion requires a real source ref.", blocking: true });
    if (assignment.obstructionWarning) issues.push({ code: "EVIDENCE_OBSTRUCTION", sceneId: assignment.sceneId, message: assignment.obstructionWarning, blocking: true });
  }

  plan.reducedMotionAssignments.forEach((entry, index) => {
    const standard = plan.assignments[index];
    if (!standard || entry.sceneId !== standard.sceneId || entry.motionTag !== standard.motionTag || entry.intensity !== "low") issues.push({ code: "INVALID_REDUCED_MOTION_ASSIGNMENT", sceneId: entry.sceneId, message: "Reduced motion must preserve scene and semantic tag with low intensity.", blocking: true });
  });

  const blockingIssueCount = issues.filter((entry) => entry.blocking).length;
  return { valid: blockingIssueCount === 0, blockingIssueCount, warningCount: issues.length - blockingIssueCount, issues };
}
