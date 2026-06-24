import { inflationFactCard, exchangeRateFactCard, dartDisclosureFactCard } from "@/lib/source-facts/fixtures";
import { createBlueprintFromFactCard } from "./generator";
import type { VideoBlueprint } from "./types";

/** Mock 30s blueprint from the inflation Fact Card fixture. */
export const inflationBlueprint30: VideoBlueprint = createBlueprintFromFactCard(
  inflationFactCard,
  { videoId: "bp-mock-inflation-30s", targetDurationSec: 30 },
);

/** Mock 15s blueprint from the exchange rate Fact Card fixture. */
export const exchangeRateBlueprint15: VideoBlueprint = createBlueprintFromFactCard(
  exchangeRateFactCard,
  { videoId: "bp-mock-usd-krw-15s", targetDurationSec: 15 },
);

/** Mock 60s blueprint from the disclosure Fact Card fixture, CTA enabled. */
export const dartDisclosureBlueprint60: VideoBlueprint = createBlueprintFromFactCard(
  dartDisclosureFactCard,
  { videoId: "bp-mock-dart-60s", targetDurationSec: 60, ctaEnabled: true },
);

export const MOCK_BLUEPRINTS: VideoBlueprint[] = [
  inflationBlueprint30,
  exchangeRateBlueprint15,
  dartDisclosureBlueprint60,
];
