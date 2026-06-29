/**
 * signal-translation-copy-payload.ts
 *
 * Pure deterministic helper — no external API, no DB, no filesystem, no clipboard.
 * Converts MoneyShortsScenePackage into a display-only copy payload for Owner inspection.
 */
import type {
  CaptionBlock,
  ImageTextPolicy,
  LayoutSafeZone,
  MoneyShortsSceneRole,
  VisualTemplateId,
  VoiceTiming,
} from "./signal-translation";
import type {
  MoneyShortsScenePackage,
  SignalTranslationTemplateId,
} from "./signal-translation-generator";
import {
  buildMoneyShortsScenePackageQaReport,
} from "./signal-translation-package-qa";
import type { MoneyShortsScenePackageQaReport } from "./signal-translation-package-qa";

export const MONEY_SHORTS_GENERATED_COPY_PAYLOAD_SCHEMA_VERSION =
  "money_shorts_generated_copy_payload_v1" as const;

export interface MoneyShortsGeneratedCopyPayloadScene {
  sceneNumber: number;
  sceneRole: MoneyShortsSceneRole;
  sceneLabel: string;
  sceneGoal: string;
  narration: string;
  spokenCaption: string;
  hookTitle?: string;
  screenText: string[];
  captionBlocks: CaptionBlock[];
  imagePrompt: string;
  visualTemplateId: VisualTemplateId;
  visualObjects: string[];
  voiceTiming: VoiceTiming;
  layoutSafeZone: LayoutSafeZone;
  imageTextPolicy: ImageTextPolicy;
  sourceNote?: string;
  sourceCitationIds: string[];
  riskNotes: string[];
}

export interface MoneyShortsGeneratedCopyPayload {
  schemaVersion: typeof MONEY_SHORTS_GENERATED_COPY_PAYLOAD_SCHEMA_VERSION;
  packageId: string;
  factCardId: string;
  templateId: SignalTranslationTemplateId;
  viewerTakeaway: string;
  recommendedActions: readonly string[];
  actionBoundaries: readonly string[];
  doNotOverclaimActions: readonly string[];
  validation: {
    sceneCardValid: boolean;
    citationValid: boolean;
    sceneErrors: number;
    sceneWarnings: number;
    citationErrors: number;
    citationWarnings: number;
  };
  scenePackageQaReport: MoneyShortsScenePackageQaReport;
  scenes: MoneyShortsGeneratedCopyPayloadScene[];
  warnings: string[];
}

export function buildMoneyShortsGeneratedCopyPayload(
  scenePackage: MoneyShortsScenePackage,
): MoneyShortsGeneratedCopyPayload {
  const { brief, sceneCardValidation, citationValidation } = scenePackage;
  const scenePackageQaReport = buildMoneyShortsScenePackageQaReport(scenePackage);

  const scenes: MoneyShortsGeneratedCopyPayloadScene[] = scenePackage.sceneCards.map((s) => ({
    sceneNumber: s.sceneNumber,
    sceneRole: s.sceneRole,
    sceneLabel: s.sceneLabel,
    sceneGoal: s.sceneGoal,
    narration: s.narration,
    spokenCaption: s.spokenCaption,
    ...(s.hookTitle !== undefined ? { hookTitle: s.hookTitle } : {}),
    screenText: [...s.screenText],
    captionBlocks: s.captionBlocks.map((b) => ({
      startSec: b.startSec,
      endSec: b.endSec,
      text: b.text,
      emphasisWords: [...b.emphasisWords],
    })),
    imagePrompt: s.imagePrompt,
    visualTemplateId: s.visualTemplateId,
    visualObjects: [...s.visualObjects],
    voiceTiming: {
      pace: s.voiceTiming.pace,
      emphasisWords: [...s.voiceTiming.emphasisWords],
      pauses: [...s.voiceTiming.pauses],
    },
    layoutSafeZone: {
      ...(s.layoutSafeZone.hookTitle ? { hookTitle: { ...s.layoutSafeZone.hookTitle } } : {}),
      spokenCaption: { ...s.layoutSafeZone.spokenCaption },
      ...(s.layoutSafeZone.sourceNote ? { sourceNote: { ...s.layoutSafeZone.sourceNote } } : {}),
    },
    imageTextPolicy: {
      allowedText: [...s.imageTextPolicy.allowedText],
      forbiddenText: [...s.imageTextPolicy.forbiddenText],
    },
    ...(s.sourceNote !== undefined ? { sourceNote: s.sourceNote } : {}),
    sourceCitationIds: [...s.sourceCitationIds],
    riskNotes: [...s.riskNotes],
  }));

  return {
    schemaVersion: MONEY_SHORTS_GENERATED_COPY_PAYLOAD_SCHEMA_VERSION,
    packageId: scenePackage.id,
    factCardId: scenePackage.factCardId,
    templateId: scenePackage.templateId,
    viewerTakeaway: brief.viewerTakeaway,
    recommendedActions: brief.recommendedActions,
    actionBoundaries: brief.actionBoundaries,
    doNotOverclaimActions: brief.doNotOverclaimActions,
    validation: {
      sceneCardValid: sceneCardValidation.isValid,
      citationValid: citationValidation.isValid,
      sceneErrors: sceneCardValidation.errors.length,
      sceneWarnings: sceneCardValidation.warnings.length,
      citationErrors: citationValidation.errors.length,
      citationWarnings: citationValidation.warnings.length,
    },
    scenePackageQaReport,
    scenes,
    warnings: [...scenePackage.warnings],
  };
}

export function stringifyMoneyShortsGeneratedCopyPayload(
  payload: MoneyShortsGeneratedCopyPayload,
): string {
  return JSON.stringify(payload, null, 2);
}
