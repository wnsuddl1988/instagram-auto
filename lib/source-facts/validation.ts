import type {
  CommercialUseStatus,
  FactCard,
  FactCardValidationError,
  FactCardValidationOptions,
  FactCardValidationResult,
  SourceCitation,
} from "./types";

const HTTP_URL_PATTERN = /^https?:\/\//i;

const COMMERCIAL_USE_STATUSES: CommercialUseStatus[] = [
  "unknown",
  "allowed",
  "restricted",
  "needs_review",
];

const NUMERIC_FIELDS: Array<keyof FactCard> = [
  "currentNumericValue",
  "previousNumericValue",
  "changeNumericValue",
  "changeRateNumericValue",
];

const REQUIRED_STRING_FIELDS: Array<keyof FactCard> = [
  "primarySourceProviderId",
  "sourceName",
  "sourceUrl",
  "publishedDate",
  "dataPeriod",
  "indicatorName",
  "currentValue",
  "previousValue",
  "changeValue",
  "changeRate",
  "unit",
  "comparisonType",
  "interpretation",
  "cautionNote",
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isHttpUrl(value: unknown): value is string {
  return isNonEmptyString(value) && HTTP_URL_PATTERN.test(value);
}

function pushError(
  errors: FactCardValidationError[],
  field: string,
  code: string,
  message: string,
) {
  errors.push({ field, code, message });
}

function validateCommercialUseStatus(
  value: unknown,
  field: string,
  errors: FactCardValidationError[],
) {
  if (value === undefined) return;
  if (!COMMERCIAL_USE_STATUSES.includes(value as CommercialUseStatus)) {
    pushError(
      errors,
      field,
      "invalid_commercial_use_status",
      "commercialUseStatus must be one of unknown, allowed, restricted, needs_review.",
    );
  }
}

function validateCitation(
  citation: unknown,
  index: number,
  errors: FactCardValidationError[],
) {
  const base = `citations[${index}]`;
  if (!isRecord(citation)) {
    pushError(errors, base, "invalid_citation", "Citation must be an object.");
    return;
  }

  if (!isNonEmptyString(citation.sourceName)) {
    pushError(
      errors,
      `${base}.sourceName`,
      "required",
      "Citation sourceName is required when a citation is provided.",
    );
  }

  if (!isHttpUrl(citation.sourceUrl)) {
    pushError(
      errors,
      `${base}.sourceUrl`,
      "invalid_url",
      "Citation sourceUrl must start with http:// or https://.",
    );
  }

  if (!isNonEmptyString(citation.publishedDate)) {
    pushError(
      errors,
      `${base}.publishedDate`,
      "required",
      "Citation publishedDate is required when a citation is provided.",
    );
  }

  validateCommercialUseStatus(
    citation.commercialUseStatus,
    `${base}.commercialUseStatus`,
    errors,
  );
}

function validatePublishableCitations(
  citations: SourceCitation[],
  errors: FactCardValidationError[],
) {
  if (citations.length === 0) {
    pushError(
      errors,
      "citations",
      "publish_citation_required",
      "Publishable Fact Cards require at least one citation.",
    );
    return;
  }

  citations.forEach((citation, index) => {
    if (citation.commercialUseStatus !== "allowed") {
      pushError(
        errors,
        `citations[${index}].commercialUseStatus`,
        "publish_commercial_use_not_allowed",
        "Publishable citations must have commercialUseStatus set to allowed.",
      );
    }
  });
}

export function validateFactCard(
  card: Partial<FactCard>,
  options: FactCardValidationOptions = {},
): FactCardValidationResult {
  const mode = options.mode ?? "draft";
  const errors: FactCardValidationError[] = [];

  for (const field of REQUIRED_STRING_FIELDS) {
    if (!isNonEmptyString(card[field])) {
      pushError(
        errors,
        String(field),
        "required",
        `${String(field)} is required.`,
      );
    }
  }

  if (!isHttpUrl(card.sourceUrl)) {
    pushError(
      errors,
      "sourceUrl",
      "invalid_url",
      "sourceUrl must start with http:// or https://.",
    );
  }

  if (typeof card.isMock !== "boolean") {
    pushError(errors, "isMock", "required_boolean", "isMock must be a boolean.");
  }

  if (typeof card.isPublishable !== "boolean") {
    pushError(
      errors,
      "isPublishable",
      "required_boolean",
      "isPublishable must be a boolean.",
    );
  }

  if (card.isMock === true && card.isPublishable === true) {
    pushError(
      errors,
      "isPublishable",
      "mock_publishable_conflict",
      "Mock Fact Cards cannot be publishable.",
    );
  }

  if (!Array.isArray(card.allowedClaims) || card.allowedClaims.length === 0) {
    pushError(
      errors,
      "allowedClaims",
      "required_non_empty_array",
      "allowedClaims must contain at least one claim.",
    );
  } else {
    card.allowedClaims.forEach((claim, index) => {
      if (!isNonEmptyString(claim)) {
        pushError(
          errors,
          `allowedClaims[${index}]`,
          "invalid_claim",
          "allowedClaims entries must be non-empty strings.",
        );
      }
    });
  }

  if (!Array.isArray(card.blockedClaims)) {
    pushError(
      errors,
      "blockedClaims",
      "required_array",
      "blockedClaims must be an array.",
    );
  } else {
    card.blockedClaims.forEach((claim, index) => {
      if (!isNonEmptyString(claim)) {
        pushError(
          errors,
          `blockedClaims[${index}]`,
          "invalid_claim",
          "blockedClaims entries must be non-empty strings when present.",
        );
      }
    });
  }

  for (const field of NUMERIC_FIELDS) {
    const value = card[field];
    if (value !== undefined) {
      if (typeof value !== "number" || !Number.isFinite(value)) {
        pushError(
          errors,
          String(field),
          "invalid_number",
          `${String(field)} must be a finite number when provided.`,
        );
      }
    }
  }

  if (!Array.isArray(card.citations)) {
    pushError(
      errors,
      "citations",
      "required_array",
      "citations must be an array.",
    );
  } else {
    card.citations.forEach((citation, index) => {
      validateCitation(citation, index, errors);
    });
  }

  if (mode === "publish") {
    if (card.isMock === true) {
      pushError(
        errors,
        "isMock",
        "publish_mock_forbidden",
        "Mock Fact Cards cannot pass publish validation.",
      );
    }

    if (card.isPublishable !== true) {
      pushError(
        errors,
        "isPublishable",
        "publish_not_enabled",
        "Publish validation requires isPublishable to be true.",
      );
    }

    if (Array.isArray(card.citations)) {
      validatePublishableCitations(card.citations, errors);
    }
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}

export function validatePublishableFactCard(
  card: Partial<FactCard>,
): FactCardValidationResult {
  return validateFactCard(card, { mode: "publish" });
}
