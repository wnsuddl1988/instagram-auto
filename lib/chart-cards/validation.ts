import type {
  AnyCardProps,
  ChartCardPackage,
  ChartCardValidationError,
  ChartCardValidationResult,
  NumberCardProps,
  ComparisonCardProps,
  SourceCardProps,
  CtaCardProps,
} from "./types";

const SUPPORTED_CARD_TYPES = new Set([
  "number_card",
  "comparison_card",
  "source_card",
  "cta_card",
]);

function err(
  field: string,
  code: string,
  message: string,
): ChartCardValidationError {
  return { field, code, message };
}

function validateDimensions(
  card: AnyCardProps,
  errors: ChartCardValidationError[],
): void {
  const { widthPx, heightPx } = card.dimensions;
  if (widthPx <= 0) {
    errors.push(err("dimensions.widthPx", "invalid_width", "widthPx must be > 0"));
  }
  if (heightPx <= 0) {
    errors.push(err("dimensions.heightPx", "invalid_height", "heightPx must be > 0"));
  }
  // Warn if not 9:16 ratio (not a hard failure, just flag)
  const ratio = heightPx / widthPx;
  if (ratio < 1.5 || ratio > 2.0) {
    errors.push(
      err(
        "dimensions",
        "non_vertical_ratio",
        `Card dimensions ${widthPx}×${heightPx} are not in a typical 9:16 range (ratio=${ratio.toFixed(2)})`,
      ),
    );
  }
}

function validateSource(
  source: { factCardId: string; sourceCitationIds: string[]; sourceName: string; sourceUrl: string; publishedDate: string },
  errors: ChartCardValidationError[],
): void {
  if (!source.factCardId) {
    errors.push(err("source.factCardId", "missing_fact_card_id", "source.factCardId is required"));
  }
  if (!source.sourceCitationIds || source.sourceCitationIds.length === 0) {
    errors.push(err("source.sourceCitationIds", "missing_citation_ids", "source.sourceCitationIds must be non-empty"));
  }
  if (!source.sourceName) {
    errors.push(err("source.sourceName", "missing_source_name", "source.sourceName is required"));
  }
  if (!source.sourceUrl) {
    errors.push(err("source.sourceUrl", "missing_source_url", "source.sourceUrl is required"));
  }
  if (!source.publishedDate) {
    errors.push(err("source.publishedDate", "missing_published_date", "source.publishedDate is required"));
  }
}

function validateNumberCard(
  card: NumberCardProps,
  errors: ChartCardValidationError[],
): void {
  if (!card.title) errors.push(err("title", "empty_title", "title is required"));
  if (!card.value) errors.push(err("value", "empty_value", "value is required"));
  validateDimensions(card, errors);
  validateSource(card.source, errors);
}

function validateComparisonCard(
  card: ComparisonCardProps,
  errors: ChartCardValidationError[],
): void {
  if (!card.title) errors.push(err("title", "empty_title", "title is required"));
  if (!card.valueLeft) errors.push(err("valueLeft", "empty_value", "valueLeft is required"));
  if (!card.valueRight) errors.push(err("valueRight", "empty_value", "valueRight is required"));
  validateDimensions(card, errors);
  validateSource(card.source, errors);
}

function validateSourceCard(
  card: SourceCardProps,
  errors: ChartCardValidationError[],
): void {
  if (!card.sourceName) errors.push(err("sourceName", "missing_source_name", "sourceName is required"));
  if (!card.sourceUrl) errors.push(err("sourceUrl", "missing_source_url", "sourceUrl is required"));
  if (!card.publishedDate) errors.push(err("publishedDate", "missing_published_date", "publishedDate is required"));
  if (!card.factCardId) errors.push(err("factCardId", "missing_fact_card_id", "factCardId is required"));
  if (!card.sourceCitationIds || card.sourceCitationIds.length === 0) {
    errors.push(err("sourceCitationIds", "missing_citation_ids", "sourceCitationIds must be non-empty"));
  }
  validateDimensions(card, errors);
}

function validateCtaCard(
  card: CtaCardProps,
  errors: ChartCardValidationError[],
): void {
  if (!card.ctaText) errors.push(err("ctaText", "empty_cta_text", "ctaText is required"));
  validateDimensions(card, errors);
}

function validateCard(
  card: AnyCardProps,
  index: number,
  errors: ChartCardValidationError[],
): void {
  if (!SUPPORTED_CARD_TYPES.has(card.cardType)) {
    errors.push(
      err(
        `cards[${index}].cardType`,
        "unsupported_card_type",
        `Unsupported card type: "${card.cardType}"`,
      ),
    );
    return;
  }
  if (!card.cardId) {
    errors.push(err(`cards[${index}].cardId`, "empty_card_id", "cardId is required"));
  }
  switch (card.cardType) {
    case "number_card":
      validateNumberCard(card, errors);
      break;
    case "comparison_card":
      validateComparisonCard(card, errors);
      break;
    case "source_card":
      validateSourceCard(card, errors);
      break;
    case "cta_card":
      validateCtaCard(card, errors);
      break;
  }
}

/** Validates a complete ChartCardPackage. */
export function validateChartCardPackage(
  pkg: ChartCardPackage,
): ChartCardValidationResult {
  const errors: ChartCardValidationError[] = [];

  if (!pkg.packageId) {
    errors.push(err("packageId", "empty_package_id", "packageId is required"));
  }
  if (!pkg.factCardId) {
    errors.push(err("factCardId", "missing_fact_card_id", "factCardId is required"));
  }
  if (!pkg.sourceCitationIds || pkg.sourceCitationIds.length === 0) {
    errors.push(
      err("sourceCitationIds", "missing_citation_ids", "sourceCitationIds must be non-empty"),
    );
  }
  if (!pkg.cards || pkg.cards.length === 0) {
    errors.push(err("cards", "empty_cards", "cards must be non-empty"));
  } else {
    pkg.cards.forEach((card, i) => validateCard(card, i, errors));
  }

  return { ok: errors.length === 0, errors };
}
