import {
  inflationFactCard,
  exchangeRateFactCard,
  dartDisclosureFactCard,
} from "@/lib/source-facts/fixtures";
import {
  inflationBlueprint30,
  dartDisclosureBlueprint60,
} from "@/lib/blueprints/fixtures";
import { generateChartCardPackage } from "./generator";
import type { ChartCardPackage } from "./types";

const MOCK_CREATED_AT = "2026-06-25T00:00:00+09:00";

/** Mock chart card package from the inflation Fact Card (30s blueprint, no CTA). */
export const inflationChartCardPackage: ChartCardPackage = generateChartCardPackage(
  inflationFactCard,
  inflationBlueprint30,
  { packageId: "ccp-mock-inflation-30s", createdAt: MOCK_CREATED_AT },
);

/** Mock chart card package from the exchange rate Fact Card (no blueprint). */
export const exchangeRateChartCardPackage: ChartCardPackage = generateChartCardPackage(
  exchangeRateFactCard,
  null,
  { packageId: "ccp-mock-usd-krw", createdAt: MOCK_CREATED_AT },
);

/** Mock chart card package from the DART disclosure Fact Card (CTA enabled). */
export const dartDisclosureChartCardPackage: ChartCardPackage = generateChartCardPackage(
  dartDisclosureFactCard,
  dartDisclosureBlueprint60,
  { packageId: "ccp-mock-dart-60s", createdAt: MOCK_CREATED_AT, includeCtaCard: true },
);

export const MOCK_CHART_CARD_PACKAGES: ChartCardPackage[] = [
  inflationChartCardPackage,
  exchangeRateChartCardPackage,
  dartDisclosureChartCardPackage,
];
