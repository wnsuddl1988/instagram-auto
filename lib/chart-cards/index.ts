export { CHART_CARD_SCHEMA_VERSION, DEFAULT_CARD_DIMENSIONS } from "./types";
export type {
  ChartCardType,
  CardDimensions,
  CardSourceAttribution,
  NumberCardProps,
  ComparisonCardProps,
  SourceCardProps,
  CtaCardProps,
  AnyCardProps,
  ChartCardPackage,
  ChartCardValidationError,
  ChartCardValidationResult,
} from "./types";

export {
  makeNumberCard,
  makeComparisonCard,
  makeSourceCard,
  makeCtaCard,
  generateChartCardPackage,
} from "./generator";
export type { ChartCardGeneratorOptions } from "./generator";

export { validateChartCardPackage } from "./validation";

export {
  inflationChartCardPackage,
  exchangeRateChartCardPackage,
  dartDisclosureChartCardPackage,
  MOCK_CHART_CARD_PACKAGES,
} from "./fixtures";
