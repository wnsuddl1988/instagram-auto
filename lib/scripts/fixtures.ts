import {
  inflationBlueprint30,
  exchangeRateBlueprint15,
  dartDisclosureBlueprint60,
} from "@/lib/blueprints/fixtures";
import { generateScriptPackage } from "./generator";
import type { GeneratedScriptPackage } from "./types";

/** Mock 30s script package from the inflation Blueprint fixture. */
export const inflationScriptPackage30: GeneratedScriptPackage = generateScriptPackage(
  inflationBlueprint30,
  { packageId: "pkg-mock-inflation-30s", createdAt: "2026-06-25T00:00:00+09:00" },
);

/** Mock 15s script package from the exchange rate Blueprint fixture. */
export const exchangeRateScriptPackage15: GeneratedScriptPackage = generateScriptPackage(
  exchangeRateBlueprint15,
  { packageId: "pkg-mock-usd-krw-15s", createdAt: "2026-06-25T00:00:00+09:00" },
);

/** Mock 60s script package from the disclosure Blueprint fixture (CTA enabled). */
export const dartDisclosureScriptPackage60: GeneratedScriptPackage = generateScriptPackage(
  dartDisclosureBlueprint60,
  { packageId: "pkg-mock-dart-60s", createdAt: "2026-06-25T00:00:00+09:00" },
);

export const MOCK_SCRIPT_PACKAGES: GeneratedScriptPackage[] = [
  inflationScriptPackage30,
  exchangeRateScriptPackage15,
  dartDisclosureScriptPackage60,
];
