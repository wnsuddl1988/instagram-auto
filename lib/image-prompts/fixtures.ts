import {
  inflationBlueprint30,
  exchangeRateBlueprint15,
  dartDisclosureBlueprint60,
} from "@/lib/blueprints/fixtures";
import { generateImagePromptPackage } from "./generator";
import type { ImagePromptPackage } from "./types";

const MOCK_CREATED_AT = "2026-06-25T00:00:00+09:00";

/** Mock image prompt package from the 30s inflation blueprint. */
export const inflationImagePromptPackage: ImagePromptPackage = generateImagePromptPackage(
  inflationBlueprint30,
  { packageId: "ipp-mock-inflation-30s", createdAt: MOCK_CREATED_AT },
);

/** Mock image prompt package from the 15s exchange rate blueprint. */
export const exchangeRateImagePromptPackage: ImagePromptPackage = generateImagePromptPackage(
  exchangeRateBlueprint15,
  { packageId: "ipp-mock-usd-krw-15s", createdAt: MOCK_CREATED_AT },
);

/** Mock image prompt package from the 60s DART disclosure blueprint (CTA enabled). */
export const dartDisclosureImagePromptPackage: ImagePromptPackage = generateImagePromptPackage(
  dartDisclosureBlueprint60,
  { packageId: "ipp-mock-dart-60s", createdAt: MOCK_CREATED_AT },
);

export const MOCK_IMAGE_PROMPT_PACKAGES: ImagePromptPackage[] = [
  inflationImagePromptPackage,
  exchangeRateImagePromptPackage,
  dartDisclosureImagePromptPackage,
];
