import { inflationBlueprintTimeline30, exchangeRateBlueprintTimeline15 } from "@/lib/timeline/fixtures";
import { inflationTtsPackage30, exchangeRateTtsPackage15 } from "@/lib/voice-profiles/fixtures";
import { inflationBlueprint30, exchangeRateBlueprint15 } from "@/lib/blueprints/fixtures";
import { inflationImagePromptPackage } from "@/lib/image-prompts/fixtures";
import { providerCandidateGeneratedSignalTranslationPackage } from "@/lib/source-facts/provider-candidates";
import { buildRenderManifest } from "./builder";
import { buildRenderManifestFromScenePackage } from "./scene-package-adapter";
import type { RenderManifest } from "./types";
import type { ScenePackageRenderManifestResult } from "./scene-package-adapter";

const MOCK_CREATED_AT = "2026-06-25T00:00:00+09:00";

/** Render plan from inflation 30s blueprint timeline + TTS package (no image prompt package). */
export const inflationRenderPlan30: RenderManifest = buildRenderManifest({
  timeline: inflationBlueprintTimeline30,
  ttsPackage: inflationTtsPackage30,
  riskLevel: "low",
  sourceReferences: inflationBlueprint30.sourceReferences,
  options: {
    manifestId: "rp-mock-inflation-bp-30s",
    createdAt: MOCK_CREATED_AT,
  },
});

/** Render plan from inflation 30s blueprint timeline + TTS package + image prompt package. */
export const inflationRenderPlan30WithImagePrompts: RenderManifest = buildRenderManifest({
  timeline: inflationBlueprintTimeline30,
  ttsPackage: inflationTtsPackage30,
  imagePromptPackage: inflationImagePromptPackage,
  riskLevel: "low",
  sourceReferences: inflationBlueprint30.sourceReferences,
  options: {
    manifestId: "rp-mock-inflation-bp-30s-with-prompts",
    createdAt: MOCK_CREATED_AT,
  },
});

/** Render plan from exchange rate 15s blueprint timeline + TTS package. */
export const exchangeRateRenderPlan15: RenderManifest = buildRenderManifest({
  timeline: exchangeRateBlueprintTimeline15,
  ttsPackage: exchangeRateTtsPackage15,
  riskLevel: "low",
  sourceReferences: exchangeRateBlueprint15.sourceReferences,
  options: {
    manifestId: "rp-mock-usd-krw-bp-15s",
    createdAt: MOCK_CREATED_AT,
  },
});

export const MOCK_RENDER_PLANS: RenderManifest[] = [
  inflationRenderPlan30,
  inflationRenderPlan30WithImagePrompts,
  exchangeRateRenderPlan15,
];

/**
 * Provider-driven render manifest: ecosBaseRateTopicCandidate → FactCard → ScenePackage → RenderManifest.
 * Proves the full SourceProviderCatalog → RenderManifest pipeline is connected.
 * riskLevel="unchecked" — structural QA status is in scenePackage.warnings (not here).
 */
export const providerCandidateRenderManifestResult: ScenePackageRenderManifestResult =
  buildRenderManifestFromScenePackage(
    providerCandidateGeneratedSignalTranslationPackage,
    {
      manifestId: "rp-provider-candidate-ecos-base-rate",
      createdAt: MOCK_CREATED_AT,
    },
  );

export const providerCandidateRenderManifest: RenderManifest =
  providerCandidateRenderManifestResult.renderManifest;
