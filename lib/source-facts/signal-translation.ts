export const MONEY_SHORTS_SCENE_ROLES = [
  "hook",
  "signal",
  "why_expert_interpretation",
  "life_impact",
  "watch_scenario_outlook",
  "action_closing",
] as const;

export type MoneyShortsSceneRole = (typeof MONEY_SHORTS_SCENE_ROLES)[number];

export type AffectedMoneyArea =
  | "living_costs"
  | "loans"
  | "spending"
  | "savings"
  | "investment_judgment"
  | "foreign_exchange"
  | "card_bills"
  | "travel_costs"
  | "groceries"
  | "fixed_expenses"
  | "variable_expenses";

export type ActionUrgency =
  | "now"
  | "this_month"
  | "before_next_release"
  | "watch_only";

export type ScenarioOutlookDirection =
  | "rising"
  | "falling"
  | "stable"
  | "volatile";

export interface ScenarioBasedOutlook {
  direction: ScenarioOutlookDirection;
  condition: string;
  viewerMeaning: string;
}

export interface SignalTranslationBrief {
  id: string;
  factCardId: string;
  signalSummary: string;
  keyReasons: string[];
  expertInterpretation: string;
  affectedMoneyAreas: AffectedMoneyArea[];
  lifeImpact: string;
  volatilityWatch: string[];
  scenarioBasedOutlook: ScenarioBasedOutlook[];
  recommendedActions: string[];
  actionUrgency: ActionUrgency;
  audienceSituation: string;
  actionBoundaries: string[];
  doNotOverclaimActions: string[];
  viewerTakeaway: string;
  sourceCitationIds: string[];
  riskNotes: string[];
}

export interface CaptionBlock {
  startSec: number;
  endSec: number;
  text: string;
  emphasisWords: string[];
}

export type VisualTemplateId =
  | "signal_card"
  | "life_object"
  | "clue_cards"
  | "action_checklist";

export interface ImageTextPolicy {
  allowedText: string[];
  forbiddenText: string[];
}

export type VoicePace = "fast" | "normal" | "slow";

export interface VoiceTiming {
  pace: VoicePace;
  emphasisWords: string[];
  pauses: string[];
}

export interface CaptionSafeZone {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  fontPxMin?: number;
  fontPxMax?: number;
  maxLines?: number;
}

export interface LayoutSafeZone {
  hookTitle?: CaptionSafeZone;
  spokenCaption: CaptionSafeZone;
  sceneLabel: CaptionSafeZone;
  sourceNote?: CaptionSafeZone;
}

export interface CaptionSystemV1 {
  canvas: {
    width: 1080;
    height: 1920;
  };
  hookTitle: Required<CaptionSafeZone>;
  sceneLabel: CaptionSafeZone;
  spokenCaption: Required<CaptionSafeZone>;
  sourceNote: CaptionSafeZone;
  avoidZones: Array<{
    label: string;
    xMin: number;
    xMax: number;
    yMin: number;
    yMax: number;
  }>;
  fontFamily: "Pretendard or Noto Sans KR";
  accentColor: "amber_or_warm_yellow";
}

export const CAPTION_SYSTEM_V1: CaptionSystemV1 = {
  canvas: {
    width: 1080,
    height: 1920,
  },
  hookTitle: {
    xMin: 90,
    xMax: 990,
    yMin: 300,
    yMax: 620,
    fontPxMin: 74,
    fontPxMax: 88,
    maxLines: 2,
  },
  sceneLabel: {
    xMin: 80,
    xMax: 420,
    yMin: 180,
    yMax: 250,
    fontPxMin: 30,
    fontPxMax: 38,
  },
  spokenCaption: {
    xMin: 90,
    xMax: 880,
    yMin: 1180,
    yMax: 1480,
    fontPxMin: 52,
    fontPxMax: 64,
    maxLines: 2,
  },
  sourceNote: {
    xMin: 90,
    xMax: 760,
    yMin: 1500,
    yMax: 1560,
    fontPxMin: 24,
    fontPxMax: 30,
  },
  avoidZones: [
    { label: "top_platform_ui", xMin: 0, xMax: 1080, yMin: 0, yMax: 150 },
    { label: "bottom_platform_ui", xMin: 0, xMax: 1080, yMin: 1600, yMax: 1920 },
    { label: "right_platform_ui", xMin: 900, xMax: 1080, yMin: 0, yMax: 1920 },
  ],
  fontFamily: "Pretendard or Noto Sans KR",
  accentColor: "amber_or_warm_yellow",
};

export const SCENE_LABEL_BY_ROLE: Record<MoneyShortsSceneRole, string> = {
  hook: "후킹",
  signal: "신호",
  why_expert_interpretation: "원인",
  life_impact: "생활영향",
  watch_scenario_outlook: "관찰",
  action_closing: "대응",
};

export interface SceneCard {
  sceneNumber: number;
  sceneRole: MoneyShortsSceneRole;
  sceneGoal: string;
  narration: string;
  spokenCaption: string;
  hookTitle?: string;
  sceneLabel: string;
  screenText: string[];
  captionBlocks: CaptionBlock[];
  imagePrompt: string;
  visualTemplateId: VisualTemplateId;
  visualObjects: string[];
  sourceCitationIds: string[];
  imageTextPolicy: ImageTextPolicy;
  voiceTiming: VoiceTiming;
  layoutSafeZone: LayoutSafeZone;
  durationSec: number;
  sourceNote?: string;
  riskNotes: string[];
}

export interface SceneCardSequenceValidationResult {
  ok: boolean;
  errors: Array<{
    field: string;
    code: string;
    message: string;
  }>;
}

export interface SceneCardValidationIssue {
  field: string;
  code: string;
  message: string;
}

export interface SceneCardGenerationValidationResult {
  isValid: boolean;
  errors: SceneCardValidationIssue[];
  warnings: SceneCardValidationIssue[];
}

export function getSceneRoleForNumber(sceneNumber: number): MoneyShortsSceneRole | null {
  return MONEY_SHORTS_SCENE_ROLES[sceneNumber - 1] ?? null;
}

export function validateFixedSixSceneCards(
  scenes: readonly Pick<SceneCard, "sceneNumber" | "sceneRole">[],
): SceneCardSequenceValidationResult {
  const errors: SceneCardSequenceValidationResult["errors"] = [];

  if (scenes.length !== MONEY_SHORTS_SCENE_ROLES.length) {
    errors.push({
      field: "scenes",
      code: "invalid_scene_count",
      message: "Money Shorts OS MVP requires exactly 6 Scene Cards.",
    });
  }

  MONEY_SHORTS_SCENE_ROLES.forEach((expectedRole, index) => {
    const expectedSceneNumber = index + 1;
    const actual = scenes[index];

    if (!actual) {
      errors.push({
        field: `scenes.${index}`,
        code: "missing_scene",
        message: `Scene ${expectedSceneNumber} must be ${expectedRole}.`,
      });
      return;
    }

    if (actual.sceneNumber !== expectedSceneNumber) {
      errors.push({
        field: `scenes.${index}.sceneNumber`,
        code: "invalid_scene_number",
        message: `Scene at index ${index} must use sceneNumber ${expectedSceneNumber}.`,
      });
    }

    if (actual.sceneRole !== expectedRole) {
      errors.push({
        field: `scenes.${index}.sceneRole`,
        code: "invalid_scene_role",
        message: `Scene ${expectedSceneNumber} must use role ${expectedRole}.`,
      });
    }
  });

  return {
    ok: errors.length === 0,
    errors,
  };
}

function isNonEmptyText(value: string): boolean {
  return value.trim().length > 0;
}

function pushRequiredTextError(
  errors: SceneCardValidationIssue[],
  field: string,
  value: string,
): void {
  if (isNonEmptyText(value)) {
    return;
  }

  errors.push({
    field,
    code: "required_text_empty",
    message: `${field} must be a non-empty string.`,
  });
}

export function validateSceneCardsForGeneration(
  scenes: readonly SceneCard[],
): SceneCardGenerationValidationResult {
  const errors: SceneCardValidationIssue[] = [];
  const warnings: SceneCardValidationIssue[] = [];

  const sequenceResult = validateFixedSixSceneCards(scenes);
  sequenceResult.errors.forEach((error) => errors.push(error));

  let sceneStartSec = 0;

  scenes.forEach((scene, index) => {
    const fieldPrefix = `scenes.${index}`;

    pushRequiredTextError(errors, `${fieldPrefix}.sceneGoal`, scene.sceneGoal);
    pushRequiredTextError(errors, `${fieldPrefix}.narration`, scene.narration);
    pushRequiredTextError(errors, `${fieldPrefix}.spokenCaption`, scene.spokenCaption);
    pushRequiredTextError(errors, `${fieldPrefix}.imagePrompt`, scene.imagePrompt);
    pushRequiredTextError(errors, `${fieldPrefix}.sceneLabel`, scene.sceneLabel);

    const hasValidDuration =
      Number.isFinite(scene.durationSec) && scene.durationSec > 0;
    const sceneEndSec = hasValidDuration
      ? sceneStartSec + scene.durationSec
      : sceneStartSec;

    if (!hasValidDuration) {
      errors.push({
        field: `${fieldPrefix}.durationSec`,
        code: "invalid_duration",
        message: "durationSec must be a positive finite number.",
      });
    }

    if (scene.captionBlocks.length === 0) {
      warnings.push({
        field: `${fieldPrefix}.captionBlocks`,
        code: "missing_caption_blocks",
        message: "Scene has no captionBlocks for generation.",
      });
    }

    scene.captionBlocks.forEach((captionBlock, captionIndex) => {
      const captionFieldPrefix = `${fieldPrefix}.captionBlocks.${captionIndex}`;

      pushRequiredTextError(errors, `${captionFieldPrefix}.text`, captionBlock.text);

      if (!Number.isFinite(captionBlock.startSec)) {
        errors.push({
          field: `${captionFieldPrefix}.startSec`,
          code: "invalid_caption_start",
          message: "captionBlock.startSec must be a finite number.",
        });
      }

      if (!Number.isFinite(captionBlock.endSec)) {
        errors.push({
          field: `${captionFieldPrefix}.endSec`,
          code: "invalid_caption_end",
          message: "captionBlock.endSec must be a finite number.",
        });
      }

      if (captionBlock.startSec >= captionBlock.endSec) {
        errors.push({
          field: captionFieldPrefix,
          code: "invalid_caption_range",
          message: "captionBlock.startSec must be less than captionBlock.endSec.",
        });
      }

      if (
        hasValidDuration &&
        (captionBlock.startSec < sceneStartSec || captionBlock.endSec > sceneEndSec)
      ) {
        errors.push({
          field: captionFieldPrefix,
          code: "caption_outside_scene_time_range",
          message: `captionBlock must stay inside scene absolute timeline range ${sceneStartSec}-${sceneEndSec}s.`,
        });
      }
    });

    sceneStartSec = sceneEndSec;
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

function validateCitationIdList(
  errors: SceneCardValidationIssue[],
  warnings: SceneCardValidationIssue[],
  fieldPrefix: string,
  citationIds: readonly string[],
  allowedCitationIds: ReadonlySet<string>,
  options: {
    requireAtLeastOne: boolean;
  },
): void {
  if (citationIds.length === 0) {
    const issue = {
      field: fieldPrefix,
      code: "missing_source_citation_ids",
      message: `${fieldPrefix} should reference at least one Fact Card citation id.`,
    };

    if (options.requireAtLeastOne) {
      errors.push(issue);
    } else {
      warnings.push(issue);
    }

    return;
  }

  const seen = new Set<string>();

  citationIds.forEach((citationId, index) => {
    const field = `${fieldPrefix}.${index}`;

    if (!isNonEmptyText(citationId)) {
      errors.push({
        field,
        code: "empty_source_citation_id",
        message: "sourceCitationIds entries must be non-empty strings.",
      });
      return;
    }

    if (!allowedCitationIds.has(citationId)) {
      errors.push({
        field,
        code: "source_citation_id_not_in_fact_card",
        message: `sourceCitationId ${citationId} is not present in the allowed Fact Card citation ids.`,
      });
    }

    if (seen.has(citationId)) {
      warnings.push({
        field,
        code: "duplicate_source_citation_id",
        message: `sourceCitationId ${citationId} is duplicated.`,
      });
    }

    seen.add(citationId);
  });
}

export function validateSignalTranslationCitationIds(
  brief: Pick<SignalTranslationBrief, "sourceCitationIds">,
  sceneCards: readonly Pick<SceneCard, "sceneNumber" | "sourceCitationIds">[],
  allowedCitationIds: readonly string[],
): SceneCardGenerationValidationResult {
  const errors: SceneCardValidationIssue[] = [];
  const warnings: SceneCardValidationIssue[] = [];
  const allowedCitationIdSet = new Set(allowedCitationIds);

  if (allowedCitationIdSet.size === 0) {
    warnings.push({
      field: "allowedCitationIds",
      code: "empty_allowed_citation_ids",
      message: "No allowed Fact Card citation ids were provided.",
    });
  }

  validateCitationIdList(
    errors,
    warnings,
    "brief.sourceCitationIds",
    brief.sourceCitationIds,
    allowedCitationIdSet,
    { requireAtLeastOne: true },
  );

  sceneCards.forEach((sceneCard, index) => {
    validateCitationIdList(
      errors,
      warnings,
      `sceneCards.${index}.sourceCitationIds`,
      sceneCard.sourceCitationIds,
      allowedCitationIdSet,
      { requireAtLeastOne: false },
    );
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
