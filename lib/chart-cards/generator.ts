import type { FactCard } from "@/lib/source-facts/types";
import type { VideoBlueprint } from "@/lib/blueprints/types";
import {
  CHART_CARD_SCHEMA_VERSION,
  DEFAULT_CARD_DIMENSIONS,
} from "./types";
import type {
  AnyCardProps,
  CardSourceAttribution,
  NumberCardProps,
  ComparisonCardProps,
  SourceCardProps,
  CtaCardProps,
  ChartCardPackage,
  CardDimensions,
} from "./types";

export interface ChartCardGeneratorOptions {
  packageId?: string;
  dimensions?: CardDimensions;
  includeCtaCard?: boolean;
  createdAt?: string;
}

function makeAttribution(card: FactCard): CardSourceAttribution {
  return {
    factCardId: card.id,
    sourceCitationIds: card.citations.map((c) => c.id),
    sourceName: card.sourceName,
    sourceUrl: card.sourceUrl,
    publishedDate: card.publishedDate,
    ...(card.dataPeriod ? { dataPeriod: card.dataPeriod } : {}),
  };
}

function deriveDirection(
  card: FactCard,
): "up" | "down" | "flat" | null {
  if (card.changeNumericValue !== undefined) {
    if (card.changeNumericValue > 0) return "up";
    if (card.changeNumericValue < 0) return "down";
    return "flat";
  }
  if (card.changeValue === "N/A") return null;
  const raw = parseFloat(card.changeValue.replace(/[^0-9.\-]/g, ""));
  if (isNaN(raw)) return null;
  if (raw > 0) return "up";
  if (raw < 0) return "down";
  return "flat";
}

function unit(card: FactCard): string {
  return card.unit === "N/A" ? "" : card.unit;
}

/**
 * Builds a NumberCardProps from a FactCard.
 * All values come directly from the FactCard — no interpolation.
 */
export function makeNumberCard(
  card: FactCard,
  cardId: string,
  options: ChartCardGeneratorOptions = {},
): NumberCardProps {
  const dims = options.dimensions ?? DEFAULT_CARD_DIMENSIONS;
  const result: NumberCardProps = {
    cardType: "number_card",
    cardId,
    title: card.indicatorName,
    value: card.currentValue,
    unit: unit(card),
    previousValue: card.previousValue === "N/A" ? null : card.previousValue,
    changeValue: card.changeValue === "N/A" ? null : card.changeValue,
    changeRate: card.changeRate === "N/A" ? null : card.changeRate,
    interpretationNote: card.interpretation,
    dimensions: dims,
    source: makeAttribution(card),
    riskLevel: "unchecked",
  };
  if (options.createdAt !== undefined) result.createdAt = options.createdAt;
  return result;
}

/**
 * Builds a ComparisonCardProps from a FactCard.
 * Left = previous period value, Right = current value.
 */
export function makeComparisonCard(
  card: FactCard,
  cardId: string,
  options: ChartCardGeneratorOptions = {},
): ComparisonCardProps {
  const dims = options.dimensions ?? DEFAULT_CARD_DIMENSIONS;
  const result: ComparisonCardProps = {
    cardType: "comparison_card",
    cardId,
    title: card.indicatorName,
    labelLeft: "이전",
    valueLeft: card.previousValue,
    labelRight: "현재",
    valueRight: card.currentValue,
    unit: unit(card),
    direction: deriveDirection(card),
    changeLabel:
      card.changeRate !== "N/A"
        ? card.changeRate
        : card.changeValue !== "N/A"
          ? card.changeValue
          : "",
    dimensions: dims,
    source: makeAttribution(card),
    riskLevel: "unchecked",
  };
  if (options.createdAt !== undefined) result.createdAt = options.createdAt;
  return result;
}

/**
 * Builds a SourceCardProps from a FactCard.
 */
export function makeSourceCard(
  card: FactCard,
  cardId: string,
  options: ChartCardGeneratorOptions = {},
): SourceCardProps {
  const dims = options.dimensions ?? DEFAULT_CARD_DIMENSIONS;
  const result: SourceCardProps = {
    cardType: "source_card",
    cardId,
    sourceName: card.sourceName,
    sourceUrl: card.sourceUrl,
    publishedDate: card.publishedDate,
    ...(card.dataPeriod ? { dataPeriod: card.dataPeriod } : {}),
    factCardId: card.id,
    sourceCitationIds: card.citations.map((c) => c.id),
    cautionNote: card.cautionNote,
    dimensions: dims,
  };
  if (options.createdAt !== undefined) result.createdAt = options.createdAt;
  return result;
}

/**
 * Builds a CtaCardProps from a VideoBlueprint (requires moneyOsCta to be set).
 */
export function makeCtaCard(
  blueprint: VideoBlueprint,
  cardId: string,
  options: ChartCardGeneratorOptions = {},
): CtaCardProps {
  const dims = options.dimensions ?? DEFAULT_CARD_DIMENSIONS;
  const result: CtaCardProps = {
    cardType: "cta_card",
    cardId,
    ctaText: blueprint.moneyOsCta ?? "Money Shorts OS에서 더 알아보세요",
    subText: null,
    dimensions: dims,
  };
  if (options.createdAt !== undefined) result.createdAt = options.createdAt;
  return result;
}

/**
 * Derives a full ChartCardPackage from a FactCard and optional VideoBlueprint.
 *
 * - All numeric values come from the FactCard only.
 * - CTA card is included only when `blueprint.moneyOsCta` is set and
 *   `options.includeCtaCard` is true.
 * - Fully deterministic: no `new Date()` inside; `createdAt` injected via options.
 */
export function generateChartCardPackage(
  card: FactCard,
  blueprint: VideoBlueprint | null,
  options: ChartCardGeneratorOptions = {},
): ChartCardPackage {
  const packageId =
    options.packageId ??
    `ccp-${card.id}-${blueprint?.videoId ?? "no-bp"}`;

  const idPrefix = `${card.id}-card`;

  const cards: AnyCardProps[] = [
    makeNumberCard(card, `${idPrefix}-number`, options),
    makeComparisonCard(card, `${idPrefix}-comparison`, options),
    makeSourceCard(card, `${idPrefix}-source`, options),
  ];

  if (
    options.includeCtaCard &&
    blueprint !== null &&
    blueprint.moneyOsCta !== null
  ) {
    cards.push(makeCtaCard(blueprint, `${idPrefix}-cta`, options));
  }

  const pkg: ChartCardPackage = {
    schemaVersion: CHART_CARD_SCHEMA_VERSION,
    packageId,
    factCardId: card.id,
    blueprintVideoId: blueprint?.videoId ?? null,
    sourceCitationIds: card.citations.map((c) => c.id),
    cards,
    riskLevel: "unchecked",
  };

  if (options.createdAt !== undefined) pkg.createdAt = options.createdAt;

  return pkg;
}
