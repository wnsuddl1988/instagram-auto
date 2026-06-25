import { inflationBlueprint30, exchangeRateBlueprint15, dartDisclosureBlueprint60 } from "@/lib/blueprints/fixtures";
import { inflationScriptPackage30, exchangeRateScriptPackage15 } from "@/lib/scripts/fixtures";
import { buildBlueprintTimelineInput, buildScriptTimelineInput, recalculateTimeline } from "./calculator";
import type { RecalculatedTimeline } from "./types";

const MOCK_CREATED_AT = "2026-06-25T00:00:00+09:00";

/**
 * Mock timeline for the inflation 30s Blueprint.
 * Simulates measured audio = 28.4s (slightly under target 30s).
 */
export const inflationBlueprintTimeline30: RecalculatedTimeline = recalculateTimeline(
  buildBlueprintTimelineInput({
    sourceId: inflationBlueprint30.videoId,
    factCardIds: inflationBlueprint30.factCardIds,
    sourceCitationIds: inflationBlueprint30.sourceCitationIds,
    targetDurationSec: inflationBlueprint30.targetDurationSec,
    estimatedDurationSec: inflationBlueprint30.estimatedDurationSec,
    measuredAudioDurationSec: 28.4,
    measuredAudioDurationSource: "mock",
    scenes: inflationBlueprint30.scenes.map((s) => ({
      sceneId: s.sceneId,
      sceneIndex: s.sceneIndex,
      estimatedDurationSec: s.estimatedDuration,
      captionText: s.caption,
    })),
  }),
  {
    timelineId: "tl-mock-inflation-bp-30s",
    createdAt: MOCK_CREATED_AT,
  },
);

/**
 * Mock timeline for the exchange rate 15s Blueprint.
 * Simulates measured audio = 14.2s (slightly under target 15s).
 */
export const exchangeRateBlueprintTimeline15: RecalculatedTimeline = recalculateTimeline(
  buildBlueprintTimelineInput({
    sourceId: exchangeRateBlueprint15.videoId,
    factCardIds: exchangeRateBlueprint15.factCardIds,
    sourceCitationIds: exchangeRateBlueprint15.sourceCitationIds,
    targetDurationSec: exchangeRateBlueprint15.targetDurationSec,
    estimatedDurationSec: exchangeRateBlueprint15.estimatedDurationSec,
    measuredAudioDurationSec: 14.2,
    measuredAudioDurationSource: "mock",
    scenes: exchangeRateBlueprint15.scenes.map((s) => ({
      sceneId: s.sceneId,
      sceneIndex: s.sceneIndex,
      estimatedDurationSec: s.estimatedDuration,
      captionText: s.caption,
    })),
  }),
  {
    timelineId: "tl-mock-usd-krw-bp-15s",
    createdAt: MOCK_CREATED_AT,
  },
);

/**
 * Mock timeline for the DART disclosure 60s Blueprint with CTA.
 * Simulates measured audio = 55.0s (under target 60s — common when TTS is concise).
 */
export const dartDisclosureBlueprintTimeline60: RecalculatedTimeline = recalculateTimeline(
  buildBlueprintTimelineInput({
    sourceId: dartDisclosureBlueprint60.videoId,
    factCardIds: dartDisclosureBlueprint60.factCardIds,
    sourceCitationIds: dartDisclosureBlueprint60.sourceCitationIds,
    targetDurationSec: dartDisclosureBlueprint60.targetDurationSec,
    estimatedDurationSec: dartDisclosureBlueprint60.estimatedDurationSec,
    measuredAudioDurationSec: 55.0,
    measuredAudioDurationSource: "mock",
    scenes: dartDisclosureBlueprint60.scenes.map((s) => ({
      sceneId: s.sceneId,
      sceneIndex: s.sceneIndex,
      estimatedDurationSec: s.estimatedDuration,
      captionText: s.caption,
    })),
  }),
  {
    timelineId: "tl-mock-dart-bp-60s",
    createdAt: MOCK_CREATED_AT,
  },
);

/**
 * Mock timeline from inflation 30s ScriptPackage.
 * Simulates measured audio = 27.8s.
 */
export const inflationScriptTimeline30: RecalculatedTimeline = (() => {
  const script = inflationScriptPackage30.scripts.find((s) => s.targetDurationSec === 30)
    ?? inflationScriptPackage30.scripts[0];
  const estimatedDurationSec = script.scenes.reduce((acc, s) => acc + s.durationSec, 0);
  return recalculateTimeline(
    buildScriptTimelineInput({
      sourceId: inflationScriptPackage30.packageId,
      factCardIds: inflationScriptPackage30.factCardIds,
      sourceCitationIds: inflationScriptPackage30.sourceCitationIds,
      targetDurationSec: 30,
      estimatedDurationSec,
      measuredAudioDurationSec: 27.8,
      measuredAudioDurationSource: "mock",
      scenes: script.scenes.map((s) => ({
        sceneIndex: s.sceneIndex,
        estimatedDurationSec: s.durationSec,
        captionText: s.captionText,
      })),
    }),
    {
      timelineId: "tl-mock-inflation-pkg-30s",
      createdAt: MOCK_CREATED_AT,
    },
  );
})();

/**
 * Mock timeline from exchange rate 15s ScriptPackage.
 * Simulates measured audio = 13.5s.
 */
export const exchangeRateScriptTimeline15: RecalculatedTimeline = (() => {
  const script = exchangeRateScriptPackage15.scripts.find((s) => s.targetDurationSec === 15)
    ?? exchangeRateScriptPackage15.scripts[0];
  const estimatedDurationSec = script.scenes.reduce((acc, s) => acc + s.durationSec, 0);
  return recalculateTimeline(
    buildScriptTimelineInput({
      sourceId: exchangeRateScriptPackage15.packageId,
      factCardIds: exchangeRateScriptPackage15.factCardIds,
      sourceCitationIds: exchangeRateScriptPackage15.sourceCitationIds,
      targetDurationSec: 15,
      estimatedDurationSec,
      measuredAudioDurationSec: 13.5,
      measuredAudioDurationSource: "mock",
      scenes: script.scenes.map((s) => ({
        sceneIndex: s.sceneIndex,
        estimatedDurationSec: s.durationSec,
        captionText: s.captionText,
      })),
    }),
    {
      timelineId: "tl-mock-usd-krw-pkg-15s",
      createdAt: MOCK_CREATED_AT,
    },
  );
})();

export const MOCK_TIMELINES: RecalculatedTimeline[] = [
  inflationBlueprintTimeline30,
  exchangeRateBlueprintTimeline15,
  dartDisclosureBlueprintTimeline60,
  inflationScriptTimeline30,
  exchangeRateScriptTimeline15,
];
