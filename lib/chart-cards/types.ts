import type { RiskLevel } from "@/lib/source-facts/types";

export const CHART_CARD_SCHEMA_VERSION = "money_shorts_chart_card_v1" as const;

/** Supported card types for 9:16 finance shorts. */
export type ChartCardType =
  | "number_card"
  | "comparison_card"
  | "source_card"
  | "cta_card";

/** Canvas dimensions in pixels for 9:16 vertical format. */
export interface CardDimensions {
  widthPx: number;
  heightPx: number;
}

/** Default 9:16 full-scene dimensions. */
export const DEFAULT_CARD_DIMENSIONS: CardDimensions = {
  widthPx: 1080,
  heightPx: 1920,
};

/** Source attribution preserved on every card (no invented values). */
export interface CardSourceAttribution {
  factCardId: string;
  sourceCitationIds: string[];
  sourceName: string;
  sourceUrl: string;
  publishedDate: string;
  dataPeriod?: string;
}

/**
 * Number card — displays a single key indicator value with context.
 * All string values must come from FactCard or VideoBlueprint fields.
 */
export interface NumberCardProps {
  cardType: "number_card";
  cardId: string;
  title: string;
  /** The primary display value exactly as it appears in FactCard.currentValue. */
  value: string;
  unit: string;
  /** Optional previous value for context (FactCard.previousValue). */
  previousValue: string | null;
  /** Optional change value (FactCard.changeValue). */
  changeValue: string | null;
  /** Optional change rate (FactCard.changeRate). */
  changeRate: string | null;
  /** Short interpretation text from FactCard.interpretation. */
  interpretationNote: string;
  dimensions: CardDimensions;
  source: CardSourceAttribution;
  riskLevel: RiskLevel;
  createdAt?: string;
}

/**
 * Comparison card — two values side-by-side (current vs previous period).
 * Values come directly from FactCard; no interpolation.
 */
export interface ComparisonCardProps {
  cardType: "comparison_card";
  cardId: string;
  title: string;
  labelLeft: string;
  valueLeft: string;
  labelRight: string;
  valueRight: string;
  unit: string;
  /** Arrow direction based on sign of FactCard.changeNumericValue. null = unknown. */
  direction: "up" | "down" | "flat" | null;
  changeLabel: string;
  dimensions: CardDimensions;
  source: CardSourceAttribution;
  riskLevel: RiskLevel;
  createdAt?: string;
}

/**
 * Source card — displays provenance / citation information.
 * Used as a closing or overlay card to show where data comes from.
 */
export interface SourceCardProps {
  cardType: "source_card";
  cardId: string;
  sourceName: string;
  sourceUrl: string;
  publishedDate: string;
  dataPeriod?: string;
  factCardId: string;
  sourceCitationIds: string[];
  cautionNote: string;
  dimensions: CardDimensions;
  createdAt?: string;
}

/**
 * CTA card — call-to-action overlay card.
 * Text must come from Blueprint.moneyOsCta or a fixed policy string.
 */
export interface CtaCardProps {
  cardType: "cta_card";
  cardId: string;
  ctaText: string;
  subText: string | null;
  dimensions: CardDimensions;
  createdAt?: string;
}

/** Discriminated union of all card prop types. */
export type AnyCardProps =
  | NumberCardProps
  | ComparisonCardProps
  | SourceCardProps
  | CtaCardProps;

/** A complete set of cards derived from a single FactCard/Blueprint pair. */
export interface ChartCardPackage {
  schemaVersion: typeof CHART_CARD_SCHEMA_VERSION;
  packageId: string;
  factCardId: string;
  blueprintVideoId: string | null;
  sourceCitationIds: string[];
  cards: AnyCardProps[];
  riskLevel: RiskLevel;
  createdAt?: string;
}

/** Validation result for a ChartCardPackage or individual card. */
export interface ChartCardValidationError {
  field: string;
  code: string;
  message: string;
}

export interface ChartCardValidationResult {
  ok: boolean;
  errors: ChartCardValidationError[];
}
