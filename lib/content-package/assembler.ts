import type { FactCard } from "@/lib/source-facts/types";
import { createBlueprintFromFactCard } from "@/lib/blueprints/generator";
import type { BlueprintGeneratorOptions } from "@/lib/blueprints/generator";
import { generateScriptPackage } from "@/lib/scripts/generator";
import { scanScriptPackage } from "@/lib/risk-review/scanner";
import { generateChartCardPackage } from "@/lib/chart-cards/generator";
import { generateImagePromptPackage } from "@/lib/image-prompts/generator";
import { DEFAULT_MONEY_SHORTS_VOICE_PROFILE } from "@/lib/voice-profiles/profiles";
import { formatScriptPackageForTts } from "@/lib/voice-profiles/formatter";
import { buildBlueprintTimelineInput, recalculateTimeline } from "@/lib/timeline/calculator";
import { buildRenderManifest } from "@/lib/render-plan/builder";
import { validateScriptPackage } from "@/lib/scripts/validation";
import { validateChartCardPackage } from "@/lib/chart-cards/validation";
import { validateImagePromptPackage } from "@/lib/image-prompts/validation";
import { validateVoiceProfile, validateTtsScriptPackage } from "@/lib/voice-profiles/validation";
import { validateTimeline } from "@/lib/timeline/validation";
import { validateRenderManifest } from "@/lib/render-plan/validation";
import { runFinalQa } from "@/lib/final-qa/checker";
import type { AssembledContentPackage, AssemblerOptions, ContentPackageSummary } from "./types";
import { CONTENT_PACKAGE_SCHEMA_VERSION } from "./types";

/**
 * Assembles a fully linked source-first content package from a single FactCard.
 *
 * All steps are deterministic and data-only:
 * - No external API calls.
 * - No media file generation or probing.
 * - No ffmpeg execution.
 * - measuredAudioDurationSec must be injected via options (mock or pre-measured).
 */
export function assembleContentPackage(
  factCard: FactCard,
  blueprintOptions: BlueprintGeneratorOptions,
  options: AssemblerOptions,
): AssembledContentPackage {
  // ── 1. Blueprint ─────────────────────────────────────────────────────────────
  // Generate blueprint first so all downstream ids can be derived from
  // the actual blueprint.videoId (which may be auto-generated when
  // blueprintOptions.videoId is omitted).
  const blueprint = createBlueprintFromFactCard(factCard, {
    ...blueprintOptions,
    createdAt: options.createdAt,
  });

  // Stable id base derived from the real blueprint videoId — never "undefined".
  const idBase = blueprint.videoId;
  const contentPackageId = options.contentPackageId ?? `cp-${idBase}`;

  // ── 2. Script Package ────────────────────────────────────────────────────────
  const scriptPackage = generateScriptPackage(blueprint, {
    packageId: `pkg-${idBase}`,
    createdAt: options.createdAt,
  });

  // ── 3. Risk Review ───────────────────────────────────────────────────────────
  const riskReview = scanScriptPackage(scriptPackage);

  // ── 4. Chart Card Package ────────────────────────────────────────────────────
  const chartCardPackage = generateChartCardPackage(factCard, blueprint, {
    packageId: `ccp-${idBase}`,
    createdAt: options.createdAt,
  });

  // ── 5. Image Prompt Package ──────────────────────────────────────────────────
  const imagePromptPackage = generateImagePromptPackage(blueprint, {
    packageId: `ipp-${idBase}`,
    createdAt: options.createdAt,
  });

  // ── 6. Voice Profile + TTS Package ──────────────────────────────────────────
  const voiceProfile = DEFAULT_MONEY_SHORTS_VOICE_PROFILE;
  const ttsPackage = formatScriptPackageForTts(scriptPackage, voiceProfile, {
    ttsPackageId: `tts-${idBase}`,
    createdAt: options.createdAt,
  });

  // ── 7. Timeline ──────────────────────────────────────────────────────────────
  const timelineInput = buildBlueprintTimelineInput({
    sourceId: blueprint.videoId,
    factCardIds: blueprint.factCardIds,
    sourceCitationIds: blueprint.sourceCitationIds,
    targetDurationSec: blueprint.targetDurationSec,
    estimatedDurationSec: blueprint.estimatedDurationSec,
    measuredAudioDurationSec: options.measuredAudioDurationSec,
    measuredAudioDurationSource: "mock",
    scenes: blueprint.scenes.map((s) => ({
      sceneId: s.sceneId,
      sceneIndex: s.sceneIndex,
      estimatedDurationSec: s.estimatedDuration,
      captionText: s.caption,
    })),
  });
  const timeline = recalculateTimeline(timelineInput, {
    timelineId: `tl-${idBase}`,
    createdAt: options.createdAt,
  });

  // ── 8. Render Manifest ───────────────────────────────────────────────────────
  const renderManifest = buildRenderManifest({
    timeline,
    ttsPackage,
    imagePromptPackage,
    chartCardPackage,
    options: {
      manifestId: `rp-${idBase}`,
      createdAt: options.createdAt,
    },
  });

  // ── 9. Validation results ────────────────────────────────────────────────────
  const scriptVal = validateScriptPackage(scriptPackage);
  const chartVal = validateChartCardPackage(chartCardPackage);
  const imageVal = validateImagePromptPackage(imagePromptPackage);
  const voiceVal = validateVoiceProfile(voiceProfile);
  const ttsVal = validateTtsScriptPackage(ttsPackage);
  const timelineVal = validateTimeline(timeline);
  const renderVal = validateRenderManifest(renderManifest);

  // ── 10. Final QA ─────────────────────────────────────────────────────────────
  const finalQa = runFinalQa(
    {
      sourceId: scriptPackage.packageId,
      sourceType: "script_package",
      factCardIds: scriptPackage.factCardIds,
      sourceCitationIds: scriptPackage.sourceCitationIds,
      riskReview: {
        isBlocked: riskReview.isBlocked,
        overallRiskLevel: riskReview.overallRiskLevel,
        findings: riskReview.findings,
      },
      scriptValidation: scriptVal,
      chartCardValidation: chartVal,
      imagePromptValidation: imageVal,
      voiceProfileValidation: voiceVal,
      ttsValidation: ttsVal,
      timelineValidation: timelineVal,
      timelineMeasuredDurationSec: timeline.measuredAudioDurationSec,
      scriptPackageId: scriptPackage.packageId,
      blueprintVideoId: blueprint.videoId,
      timelineId: timeline.timelineId,
      timelineSourceId: timeline.sourceId,
      timelineFactCardIds: [...timeline.factCardIds],
      timelineSourceCitationIds: [...timeline.sourceCitationIds],
      renderManifestSourceId: renderManifest.sourceId,
      renderManifestFactCardIds: [...renderManifest.factCardIds],
      renderManifestSourceCitationIds: [...renderManifest.sourceCitationIds],
      renderManifestTimelineId: renderManifest.timelineId,
      renderManifestValidation: renderVal,
      renderManifestPlannedOutputPath: renderManifest.outputSpec.plannedOutputPath,
      renderManifestEstimatedDurationSec: renderManifest.ffmpegPlan.estimatedDurationSec,
      renderManifestCaptionCount: renderManifest.captionOverlays.length,
    },
    {
      qaRunId: options.qaRunId ?? `qa-${contentPackageId}`,
      createdAt: options.createdAt,
    },
  );

  // ── 11. Summary ──────────────────────────────────────────────────────────────
  const summary: ContentPackageSummary = {
    contentPackageId,
    factCardIds: [...scriptPackage.factCardIds],
    sourceCitationIds: [...scriptPackage.sourceCitationIds],
    blueprintVideoId: blueprint.videoId,
    scriptPackageId: scriptPackage.packageId,
    chartCardPackageId: chartCardPackage.packageId,
    imagePromptPackageId: imagePromptPackage.packageId,
    voiceProfileId: voiceProfile.profileId,
    ttsPackageId: ttsPackage.ttsPackageId,
    timelineId: timeline.timelineId,
    renderManifestId: renderManifest.manifestId,
  };

  const pkg: AssembledContentPackage = {
    schemaVersion: CONTENT_PACKAGE_SCHEMA_VERSION,
    contentPackageId,
    summary,
    factCard,
    blueprint,
    scriptPackage,
    riskReview,
    chartCardPackage,
    imagePromptPackage,
    voiceProfile,
    ttsPackage,
    timeline,
    renderManifest,
    finalQa,
  };
  if (options.createdAt !== undefined) pkg.createdAt = options.createdAt;
  return pkg;
}
