import type {
  ApprovedCharacterMotionSessionSnapshot,
  ApprovedScenePlanningSessionSnapshot,
  CharacterAccessibilityReview,
  CharacterComparisonResult,
  CharacterDirectionApprovalState,
  CharacterDirectionId,
  CharacterDirectionSelectionDraft,
  CharacterDirectionValidationIssue,
  CharacterDirectionValidationSummary,
  CharacterMotionIntensity,
  CharacterMotionSessionState,
  CharacterOriginalityCheck,
  CharacterOriginalityCheckId,
  CharacterRightsReview,
  CharacterRigMotionTag,
  SceneCharacterMotionAssignment,
} from "./contracts";
import { getCharacterDirections } from "./character-directions";
import {
  buildCharacterMotionPlan,
  buildPlanningIdentity,
  selectRepresentativeComparisonScene,
  validateCharacterMotionPlan,
} from "./character-motion-planner";
import { buildCharacterRig, cloneCharacterRig, validateCharacterRig } from "./character-rig";

const CHECK_LABELS: Readonly<Record<CharacterOriginalityCheckId, string>> = {
  not_money_face: "돈·동전·지폐 얼굴형이 아님",
  not_reference_silhouette: "참고 채널 실루엣 복제가 아님",
  not_reference_expression_prop_palette: "참고 채널 표정·소품·색 조합 복제가 아님",
  not_reference_signature_motion: "참고 채널 대표 동작 복제가 아님",
  no_external_svg_icon_font: "외부 SVG·아이콘·폰트 사용 없음",
  no_third_party_logo: "타사 로고·상표 없음",
  no_real_person_face: "실제 인물 얼굴 없음",
  evidence_first_priority: "evidence-first priority 유지",
  character_secondary_only: "character secondary-only",
  screen_occupancy_within_target: "screen occupancy 기준 충족",
  no_evidence_obstruction: "차트·숫자·source card 가림 없음",
  reduced_motion_supported: "reduced-motion 지원",
  no_rapid_flashing: "rapid flashing 없음",
  status_not_color_only: "색상 외에도 상태 구분 가능",
  internal_svg_rights_provenance: "rights provenance가 internal SVG primitives임",
};

const CHECK_IDS = Object.keys(CHECK_LABELS) as CharacterOriginalityCheckId[];

function initialChecks(): readonly CharacterOriginalityCheck[] {
  return CHECK_IDS.map((checkId) => ({ checkId, label: CHECK_LABELS[checkId], confirmed: false, blocking: true }));
}

function initialRightsReview(): CharacterRightsReview {
  return {
    sourceStatus: "OWNED_ORIGINAL",
    provenance: "internal_svg_primitives_only",
    externalAssetsUsed: false,
    thirdPartyMarksUsed: false,
    realPersonLikenessUsed: false,
    blockingIssueCount: 0,
  };
}

function initialAccessibilityReview(): CharacterAccessibilityReview {
  return {
    reducedMotionCompared: false,
    rapidFlashingAbsent: true,
    statusNotColorOnly: true,
    evidenceRemainsReadable: true,
    blockingIssueCount: 1,
  };
}

function cloneAssignment(assignment: SceneCharacterMotionAssignment): SceneCharacterMotionAssignment {
  return {
    ...assignment,
    evidenceRefs: [...assignment.evidenceRefs],
    sourceRefs: [...assignment.sourceRefs],
    numberRefs: [...assignment.numberRefs],
  };
}

export function cloneCharacterDirectionSelectionDraft(
  draft: CharacterDirectionSelectionDraft,
): CharacterDirectionSelectionDraft {
  return {
    ...draft,
    directions: draft.directions.map((entry) => ({
      ...entry,
      visualRoles: [...entry.visualRoles],
      motionVocabularyEmphasis: [...entry.motionVocabularyEmphasis],
      accessibilityConsiderations: [...entry.accessibilityConsiderations],
      similarityRisks: [...entry.similarityRisks],
      prohibitedMotifs: [...entry.prohibitedMotifs],
    })),
    rigs: draft.rigs.map(cloneCharacterRig),
    motionPlans: draft.motionPlans.map((plan) => ({
      ...plan,
      assignments: plan.assignments.map(cloneAssignment),
      reducedMotionAssignments: plan.reducedMotionAssignments.map(cloneAssignment),
    })),
    comparisonResult: draft.comparisonResult ? {
      ...draft.comparisonResult,
      scene: {
        ...draft.comparisonResult.scene,
        evidenceRefs: [...draft.comparisonResult.scene.evidenceRefs],
        sourceRefs: [...draft.comparisonResult.scene.sourceRefs],
        numberRefs: [...draft.comparisonResult.scene.numberRefs],
      },
      comparedDirectionIds: [...draft.comparisonResult.comparedDirectionIds],
    } : null,
    originalityChecks: draft.originalityChecks.map((entry) => ({ ...entry })),
    rightsReview: { ...draft.rightsReview },
    accessibilityReview: { ...draft.accessibilityReview },
  };
}

export function createCharacterDirectionSelectionDraft(
  planningSnapshot: ApprovedScenePlanningSessionSnapshot,
): CharacterDirectionSelectionDraft {
  const directions = getCharacterDirections();
  const representativeScene = selectRepresentativeComparisonScene(planningSnapshot);
  const directionIds = directions.map((entry) => entry.directionId);
  const comparisonResult: CharacterComparisonResult | null = representativeScene ? {
    scene: representativeScene,
    comparedDirectionIds: [...directionIds],
    sameSceneIdentityConfirmed: true,
    sameSemanticMotionTagConfirmed: true,
    standardMotionReviewed: false,
    reducedMotionReviewed: false,
  } : null;
  return cloneCharacterDirectionSelectionDraft({
    directions,
    rigs: directionIds.map(buildCharacterRig),
    motionPlans: directionIds.map((directionId) => buildCharacterMotionPlan(planningSnapshot, directionId)),
    comparisonResult,
    selectedDirectionId: null,
    originalityChecks: initialChecks(),
    rightsReview: initialRightsReview(),
    accessibilityReview: initialAccessibilityReview(),
    approvalState: "not_approved",
    finalName: null,
    finalPalette: null,
    finalBrandIdentity: null,
  });
}

function invalidated(previous: CharacterDirectionApprovalState): CharacterDirectionApprovalState {
  return previous === "provisionally_approved" ? "invalidated" : "not_approved";
}

export function selectProvisionalCharacterDirection(
  draft: CharacterDirectionSelectionDraft,
  directionId: CharacterDirectionId,
): CharacterDirectionSelectionDraft {
  return cloneCharacterDirectionSelectionDraft({ ...draft, selectedDirectionId: directionId, approvalState: invalidated(draft.approvalState) });
}

export function setCharacterComparisonReview(
  draft: CharacterDirectionSelectionDraft,
  standardMotionReviewed: boolean,
  reducedMotionReviewed: boolean,
): CharacterDirectionSelectionDraft {
  return cloneCharacterDirectionSelectionDraft({
    ...draft,
    comparisonResult: draft.comparisonResult ? { ...draft.comparisonResult, standardMotionReviewed, reducedMotionReviewed } : null,
    accessibilityReview: {
      ...draft.accessibilityReview,
      reducedMotionCompared: reducedMotionReviewed,
      blockingIssueCount: reducedMotionReviewed ? 0 : 1,
    },
    approvalState: invalidated(draft.approvalState),
  });
}

export function setCharacterOriginalityCheck(
  draft: CharacterDirectionSelectionDraft,
  checkId: CharacterOriginalityCheckId,
  confirmed: boolean,
): CharacterDirectionSelectionDraft {
  return cloneCharacterDirectionSelectionDraft({
    ...draft,
    originalityChecks: draft.originalityChecks.map((entry) => entry.checkId === checkId ? { ...entry, confirmed } : entry),
    approvalState: invalidated(draft.approvalState),
  });
}

export function overrideSceneCharacterMotion(
  draft: CharacterDirectionSelectionDraft,
  sceneId: string,
  motionTag: CharacterRigMotionTag,
  intensity: CharacterMotionIntensity,
  enabled: boolean,
): CharacterDirectionSelectionDraft {
  const motionPlans = draft.motionPlans.map((plan) => ({
    ...plan,
    assignments: plan.assignments.map((entry) => entry.sceneId === sceneId ? { ...entry, motionTag, intensity, enabled, userOverride: true } : entry),
    reducedMotionAssignments: plan.reducedMotionAssignments.map((entry) => entry.sceneId === sceneId ? { ...entry, motionTag, intensity: "low" as const, enabled, userOverride: true } : entry),
  }));
  const comparisonChanged = draft.comparisonResult?.scene.sceneId === sceneId;
  return cloneCharacterDirectionSelectionDraft({
    ...draft,
    motionPlans,
    comparisonResult: comparisonChanged && draft.comparisonResult ? {
      ...draft.comparisonResult,
      scene: { ...draft.comparisonResult.scene, semanticMotionTag: motionTag },
      standardMotionReviewed: false,
      reducedMotionReviewed: false,
    } : draft.comparisonResult,
    accessibilityReview: comparisonChanged ? {
      ...draft.accessibilityReview,
      reducedMotionCompared: false,
      blockingIssueCount: 1,
    } : draft.accessibilityReview,
    approvalState: invalidated(draft.approvalState),
  });
}

export function summarizeCharacterDirectionValidation(
  issues: readonly CharacterDirectionValidationIssue[],
): CharacterDirectionValidationSummary {
  const blockingIssueCount = issues.filter((entry) => entry.blocking).length;
  return {
    valid: blockingIssueCount === 0,
    blockingIssueCount,
    warningCount: issues.length - blockingIssueCount,
    issues: issues.map((entry) => ({ ...entry })),
  };
}

export function validateCharacterDirectionSelection(
  draft: CharacterDirectionSelectionDraft,
  planningSnapshot: ApprovedScenePlanningSessionSnapshot,
): CharacterDirectionValidationSummary {
  const issues: CharacterDirectionValidationIssue[] = [];
  const directionIds = draft.directions.map((entry) => entry.directionId);
  if (directionIds.length !== 3) issues.push({ code: "DIRECTION_COUNT", fieldPath: "directions", message: "Exactly three comparison directions are required.", blocking: true });
  if (new Set(directionIds).size !== directionIds.length) issues.push({ code: "DUPLICATE_DIRECTION_ID", fieldPath: "directions", message: "Direction IDs must be unique.", blocking: true });
  if (draft.directions.some((entry) => entry.status !== "comparison_only" || entry.finalIdentityApproved)) issues.push({ code: "FINAL_IDENTITY_PROHIBITED", fieldPath: "directions", message: "Directions must remain comparison-only and provisional.", blocking: true });
  if (!draft.selectedDirectionId || !directionIds.includes(draft.selectedDirectionId)) issues.push({ code: "SELECTED_DIRECTION_REQUIRED", fieldPath: "selectedDirectionId", message: "Select one existing provisional direction.", blocking: true });
  if (!draft.comparisonResult) issues.push({ code: "REPRESENTATIVE_SCENE_REQUIRED", fieldPath: "comparisonResult", message: "A deterministic representative scene is required.", blocking: true });
  if (draft.comparisonResult) {
    if (draft.comparisonResult.comparedDirectionIds.length !== 3 || new Set(draft.comparisonResult.comparedDirectionIds).size !== 3) issues.push({ code: "ALL_DIRECTIONS_NOT_COMPARED", fieldPath: "comparisonResult.comparedDirectionIds", message: "All three directions must use the same comparison scene.", blocking: true });
    if (!draft.comparisonResult.sameSceneIdentityConfirmed || !draft.comparisonResult.sameSemanticMotionTagConfirmed) issues.push({ code: "COMPARISON_FAIRNESS", fieldPath: "comparisonResult", message: "Comparison must preserve scene identity and semantic motion tag.", blocking: true });
    if (!draft.comparisonResult.standardMotionReviewed || !draft.comparisonResult.reducedMotionReviewed) issues.push({ code: "COMPARISON_REVIEW_REQUIRED", fieldPath: "comparisonResult", message: "Standard and reduced-motion comparisons must both be reviewed.", blocking: true });
    const sourceScene = planningSnapshot.sceneCards.find((scene) => scene.sceneId === draft.comparisonResult?.scene.sceneId);
    if (!sourceScene || sourceScene.narration !== draft.comparisonResult.scene.narration || sourceScene.keyCaption !== draft.comparisonResult.scene.keyCaption) issues.push({ code: "COMPARISON_SCENE_IDENTITY_MISMATCH", fieldPath: "comparisonResult.scene", message: "Comparison scene must preserve approved narration and caption.", blocking: true });
    const motionTags = draft.motionPlans.map((plan) => plan.assignments.find((entry) => entry.sceneId === draft.comparisonResult?.scene.sceneId)?.motionTag);
    if (motionTags.some((entry) => !entry) || new Set(motionTags).size !== 1) issues.push({ code: "SEMANTIC_MOTION_MISMATCH", fieldPath: "motionPlans", message: "All directions must use the same semantic motion tag for comparison.", blocking: true });
    if (motionTags[0] !== draft.comparisonResult.scene.semanticMotionTag) issues.push({ code: "COMPARISON_MOTION_SNAPSHOT_MISMATCH", fieldPath: "comparisonResult.scene.semanticMotionTag", message: "Comparison snapshot must match the active semantic motion tag.", blocking: true });
  }
  draft.rigs.forEach((rig) => validateCharacterRig(rig).issues.forEach((issue) => issues.push({ code: `RIG_${issue.code}`, fieldPath: `rigs.${rig.directionId}`, message: issue.message, blocking: issue.blocking })));
  draft.motionPlans.forEach((plan) => validateCharacterMotionPlan(plan, planningSnapshot).issues.forEach((issue) => issues.push({ code: `MOTION_${issue.code}`, fieldPath: `motionPlans.${plan.directionId}`, message: issue.message, blocking: issue.blocking })));
  draft.originalityChecks.filter((entry) => entry.blocking && !entry.confirmed).forEach((entry) => issues.push({ code: "ORIGINALITY_CONFIRMATION_REQUIRED", fieldPath: `originalityChecks.${entry.checkId}`, message: entry.label, blocking: true }));
  if (draft.rightsReview.blockingIssueCount !== 0 || draft.rightsReview.externalAssetsUsed || draft.rightsReview.thirdPartyMarksUsed || draft.rightsReview.realPersonLikenessUsed) issues.push({ code: "RIGHTS_REVIEW_BLOCKED", fieldPath: "rightsReview", message: "Rights review must confirm internal primitives and no third-party assets or likeness.", blocking: true });
  if (draft.accessibilityReview.blockingIssueCount !== 0 || !draft.accessibilityReview.reducedMotionCompared || !draft.accessibilityReview.rapidFlashingAbsent || !draft.accessibilityReview.statusNotColorOnly || !draft.accessibilityReview.evidenceRemainsReadable) issues.push({ code: "ACCESSIBILITY_REVIEW_BLOCKED", fieldPath: "accessibilityReview", message: "Accessibility review has unresolved blocking items.", blocking: true });
  if (draft.finalName !== null || draft.finalPalette !== null || draft.finalBrandIdentity !== null) issues.push({ code: "FINAL_BRAND_FIELD_PROHIBITED", fieldPath: "finalIdentity", message: "Final name, palette, and brand identity are outside Slice 5.", blocking: true });
  if (draft.motionPlans.some((plan) => plan.sourcePlanningIdentity !== buildPlanningIdentity(planningSnapshot))) issues.push({ code: "SOURCE_PLANNING_MISMATCH", fieldPath: "motionPlans", message: "Motion plans must originate from the current approved planning snapshot.", blocking: true });
  return summarizeCharacterDirectionValidation(issues);
}

export function canApproveCharacterDirection(
  summary: CharacterDirectionValidationSummary | null,
): boolean {
  return summary?.valid === true && summary.blockingIssueCount === 0;
}

export function buildApprovedCharacterMotionSnapshot(
  draft: CharacterDirectionSelectionDraft,
  planningSnapshot: ApprovedScenePlanningSessionSnapshot,
): ApprovedCharacterMotionSessionSnapshot {
  const validation = validateCharacterDirectionSelection(draft, planningSnapshot);
  if (draft.approvalState !== "provisionally_approved" || !canApproveCharacterDirection(validation) || !draft.selectedDirectionId || !draft.comparisonResult) throw new Error("Character direction requires explicit provisional approval with no blocking issues.");
  const direction = draft.directions.find((entry) => entry.directionId === draft.selectedDirectionId);
  const plan = draft.motionPlans.find((entry) => entry.directionId === draft.selectedDirectionId);
  if (!direction || !plan) throw new Error("Selected direction is missing its direction or motion plan.");
  return {
    selectedDirectionId: direction.directionId,
    temporaryDisplayName: direction.temporaryDisplayName,
    rigVersion: "character-rig-v1",
    motionVocabularyVersion: "character-motion-v1",
    comparisonSceneId: draft.comparisonResult.scene.sceneId,
    sceneMotionAssignments: plan.assignments.map(cloneAssignment),
    reducedMotionAssignments: plan.reducedMotionAssignments.map(cloneAssignment),
    originalityReview: draft.originalityChecks.map((entry) => ({ ...entry })),
    rightsReview: { ...draft.rightsReview },
    accessibilityReview: { ...draft.accessibilityReview },
    provisionalApprovalState: "provisionally_approved",
    sourcePlanningIdentity: buildPlanningIdentity(planningSnapshot),
    sessionOnly: true,
    finalIdentityApproved: false,
    productionAssetCreated: false,
  };
}

export type CharacterMotionSessionEvent =
  | { readonly type: "approved_planning_changed"; readonly snapshot: ApprovedScenePlanningSessionSnapshot | null }
  | { readonly type: "selection_changed"; readonly selection: CharacterDirectionSelectionDraft }
  | { readonly type: "playback_changed"; readonly playbackState: "playing" | "paused" }
  | { readonly type: "preview_speed_changed"; readonly previewSpeed: 0.75 | 1 | 1.25 }
  | { readonly type: "reduced_motion_changed"; readonly reducedMotion: boolean }
  | { readonly type: "provisional_approval_requested" }
  | { readonly type: "approval_cancelled" }
  | { readonly type: "reset" };

export function createInitialCharacterMotionSession(
  approvedPlanning: ApprovedScenePlanningSessionSnapshot | null,
): CharacterMotionSessionState {
  if (!approvedPlanning) return { approvedPlanning: null, representativeScene: null, selection: null, validation: null, approvedSnapshot: null, playbackState: "paused", previewSpeed: 1, reducedMotion: false };
  const selection = createCharacterDirectionSelectionDraft(approvedPlanning);
  return {
    approvedPlanning,
    representativeScene: selection.comparisonResult?.scene ?? null,
    selection,
    validation: validateCharacterDirectionSelection(selection, approvedPlanning),
    approvedSnapshot: null,
    playbackState: "paused",
    previewSpeed: 1,
    reducedMotion: false,
  };
}

export function reduceCharacterMotionSession(
  state: CharacterMotionSessionState,
  event: CharacterMotionSessionEvent,
): CharacterMotionSessionState {
  switch (event.type) {
    case "approved_planning_changed":
      return createInitialCharacterMotionSession(event.snapshot);
    case "selection_changed": {
      if (!state.approvedPlanning) return state;
      const previousApproval = state.selection?.approvalState ?? event.selection.approvalState;
      const selection = cloneCharacterDirectionSelectionDraft({ ...event.selection, approvalState: invalidated(previousApproval) });
      return { ...state, selection, representativeScene: selection.comparisonResult?.scene ?? null, validation: validateCharacterDirectionSelection(selection, state.approvedPlanning), approvedSnapshot: null };
    }
    case "playback_changed":
      return { ...state, playbackState: event.playbackState };
    case "preview_speed_changed":
      return { ...state, previewSpeed: event.previewSpeed };
    case "reduced_motion_changed":
      return { ...state, reducedMotion: event.reducedMotion, approvedSnapshot: null, selection: state.selection ? { ...state.selection, approvalState: invalidated(state.selection.approvalState) } : null };
    case "provisional_approval_requested": {
      if (!state.approvedPlanning || !state.selection || !canApproveCharacterDirection(state.validation)) return state;
      const selection = cloneCharacterDirectionSelectionDraft({ ...state.selection, approvalState: "provisionally_approved" });
      return { ...state, selection, approvedSnapshot: buildApprovedCharacterMotionSnapshot(selection, state.approvedPlanning) };
    }
    case "approval_cancelled":
      return { ...state, selection: state.selection ? { ...state.selection, approvalState: "invalidated" } : null, approvedSnapshot: null };
    case "reset":
      return createInitialCharacterMotionSession(state.approvedPlanning);
  }
}
