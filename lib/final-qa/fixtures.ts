import { inflationScriptPackage30 } from "@/lib/scripts/fixtures";
import { validateScriptPackage } from "@/lib/scripts/validation";
import { scanScriptPackage } from "@/lib/risk-review/scanner";
import { RISKY_BLOCKED_PACKAGE } from "@/lib/risk-review/fixtures";
import { inflationChartCardPackage } from "@/lib/chart-cards/fixtures";
import { validateChartCardPackage } from "@/lib/chart-cards/validation";
import { inflationImagePromptPackage } from "@/lib/image-prompts/fixtures";
import { validateImagePromptPackage } from "@/lib/image-prompts/validation";
import { DEFAULT_MONEY_SHORTS_VOICE_PROFILE } from "@/lib/voice-profiles/profiles";
import { validateVoiceProfile, validateTtsScriptPackage } from "@/lib/voice-profiles/validation";
import { inflationTtsPackage30 } from "@/lib/voice-profiles/fixtures";
import { inflationBlueprintTimeline30 } from "@/lib/timeline/fixtures";
import { validateTimeline } from "@/lib/timeline/validation";
import { inflationRenderPlan30WithImagePrompts } from "@/lib/render-plan/fixtures";
import { validateRenderManifest } from "@/lib/render-plan/validation";
import { runFinalQa } from "./checker";
import type { FinalQaInput, FinalQaResult } from "./types";

const MOCK_CREATED_AT = "2026-06-25T00:00:00+09:00";

/** Complete valid QA input from the inflation 30s mock chain. */
export const inflationQaInput: FinalQaInput = (() => {
  const scriptVal = validateScriptPackage(inflationScriptPackage30);
  const riskResult = scanScriptPackage(inflationScriptPackage30);
  const chartVal = validateChartCardPackage(inflationChartCardPackage);
  const imageVal = validateImagePromptPackage(inflationImagePromptPackage);
  const voiceVal = validateVoiceProfile(DEFAULT_MONEY_SHORTS_VOICE_PROFILE);
  const ttsVal = validateTtsScriptPackage(inflationTtsPackage30);
  const timelineVal = validateTimeline(inflationBlueprintTimeline30);
  const renderVal = validateRenderManifest(inflationRenderPlan30WithImagePrompts);

  return {
    sourceId: inflationScriptPackage30.packageId,
    sourceType: "script_package",
    factCardIds: inflationScriptPackage30.factCardIds,
    sourceCitationIds: inflationScriptPackage30.sourceCitationIds,
    riskReview: {
      isBlocked: riskResult.isBlocked,
      overallRiskLevel: riskResult.overallRiskLevel,
      findings: riskResult.findings,
    },
    scriptValidation: scriptVal,
    chartCardValidation: chartVal,
    imagePromptValidation: imageVal,
    voiceProfileValidation: voiceVal,
    ttsValidation: ttsVal,
    timelineValidation: timelineVal,
    timelineMeasuredDurationSec: inflationBlueprintTimeline30.measuredAudioDurationSec,
    // Cross-package linkage fields.
    // Core sourceId is script packageId; blueprint videoId is the parent used by timeline/render.
    scriptPackageId: inflationScriptPackage30.packageId,
    blueprintVideoId: inflationBlueprintTimeline30.sourceId,
    timelineId: inflationBlueprintTimeline30.timelineId,
    timelineSourceId: inflationBlueprintTimeline30.sourceId,
    timelineFactCardIds: [...inflationBlueprintTimeline30.factCardIds],
    timelineSourceCitationIds: [...inflationBlueprintTimeline30.sourceCitationIds],
    renderManifestSourceId: inflationRenderPlan30WithImagePrompts.sourceId,
    renderManifestFactCardIds: [...inflationRenderPlan30WithImagePrompts.factCardIds],
    renderManifestSourceCitationIds: [...inflationRenderPlan30WithImagePrompts.sourceCitationIds],
    renderManifestTimelineId: inflationRenderPlan30WithImagePrompts.timelineId,
    renderManifestValidation: renderVal,
    renderManifestPlannedOutputPath: inflationRenderPlan30WithImagePrompts.outputSpec.plannedOutputPath,
    renderManifestEstimatedDurationSec: inflationRenderPlan30WithImagePrompts.ffmpegPlan.estimatedDurationSec,
    renderManifestCaptionCount: inflationRenderPlan30WithImagePrompts.captionOverlays.length,
  };
})();

/** Full QA run on the valid inflation chain. Expected: readyForRender=true. */
export const inflationQaResult: FinalQaResult = runFinalQa(inflationQaInput, {
  qaRunId: "qa-mock-inflation-30s",
  createdAt: MOCK_CREATED_AT,
});

/** QA input from the risky-blocked package. Expected: readyForRender=false, isRiskBlocked=true. */
export const blockedQaInput: FinalQaInput = (() => {
  const riskResult = scanScriptPackage(RISKY_BLOCKED_PACKAGE);
  return {
    sourceId: RISKY_BLOCKED_PACKAGE.packageId,
    sourceType: "script_package",
    factCardIds: RISKY_BLOCKED_PACKAGE.factCardIds,
    sourceCitationIds: RISKY_BLOCKED_PACKAGE.sourceCitationIds,
    riskReview: {
      isBlocked: riskResult.isBlocked,
      overallRiskLevel: riskResult.overallRiskLevel,
      findings: riskResult.findings,
    },
  };
})();

/** Full QA run on the blocked risk fixture. Expected: readyForRender=false, isRiskBlocked=true. */
export const blockedQaResult: FinalQaResult = runFinalQa(blockedQaInput, {
  qaRunId: "qa-mock-blocked",
  createdAt: MOCK_CREATED_AT,
});
