import type {
  FactCard,
  SourceCitation,
  ComparisonType,
  ContentCategory,
} from "./types";
import { validateFactCard } from "./validation";
import type { FactCardValidationResult } from "./types";

/**
 * Owner-provided manual draft input.
 * Every field must be explicitly supplied — no inference or AI generation.
 * Missing required fields cause validation to fail rather than inventing values.
 */
export interface ManualFactCardDraft {
  /** Unique id for the resulting Fact Card. */
  id: string;
  /** Source provider id (e.g. "provider-kosis-manual"). */
  primarySourceProviderId: string;
  /** Display name of the source (e.g. "통계청 KOSIS"). */
  sourceName: string;
  /** Direct URL to the source page. Must start with https://. */
  sourceUrl: string;
  /** Official publish date. ISO date string: YYYY-MM-DD. */
  publishedDate: string;
  /** Data period the indicator covers (e.g. "2024년 12월"). */
  dataPeriod: string;
  /** Indicator or topic name shown in the short. */
  indicatorName: string;
  /**
   * Current value as display string exactly as the source shows it.
   * Do not format or round — copy verbatim from the source.
   */
  currentValue: string;
  /** Previous period value as display string. Use "N/A" if not applicable. */
  previousValue: string;
  /** Change value as display string. Use "N/A" if not applicable. */
  changeValue: string;
  /** Change rate as display string. Use "N/A" if not applicable. */
  changeRate: string;
  /** Unit string. Use "N/A" if not applicable. */
  unit: string;
  /** Optional numeric representations for chart generation. */
  currentNumericValue?: number;
  previousNumericValue?: number;
  changeNumericValue?: number;
  changeRateNumericValue?: number;
  comparisonType: ComparisonType;
  /**
   * One-sentence interpretation of the data in plain Korean.
   * Must be fact-only — no investment advice or prediction.
   */
  interpretation: string;
  /**
   * One-sentence caution note for the narrator.
   * Must acknowledge limitations or data scope.
   */
  cautionNote: string;
  /**
   * Explicit allowed factual claim strings.
   * At least one is required. Owner must supply these from the source.
   */
  allowedClaims: string[];
  /**
   * Expressions that must not appear in the generated script.
   * May be empty array if no specific blocks needed.
   */
  blockedClaims: string[];
  contentCategory: ContentCategory;
  /** At least one citation is required. Must reference the actual source. */
  citations: SourceCitation[];
  /** Mark false for production use; true only during local testing. */
  isMock: boolean;
  /** Leave false until the Owner confirms publish readiness. */
  isPublishable: boolean;
  /** Input timestamp (ISO datetime). Injected by caller — no new Date() inside helper. */
  createdAt?: string;
}

export interface ManualFactCardAuthoringResult {
  ok: boolean;
  factCard: FactCard | null;
  validation: FactCardValidationResult;
}

/**
 * Converts an Owner-provided ManualFactCardDraft into a validated FactCard.
 *
 * - Deterministic: no new Date(), no external calls, no AI generation.
 * - Refuses to invent missing fields: validation fails with useful codes instead.
 * - Returns { ok: false, factCard: null } when validation fails.
 */
export function authorManualFactCard(
  draft: ManualFactCardDraft,
): ManualFactCardAuthoringResult {
  // Build the candidate FactCard directly from draft — no field inference.
  const candidate: FactCard = {
    id: draft.id,
    isMock: draft.isMock,
    isPublishable: draft.isPublishable,
    primarySourceProviderId: draft.primarySourceProviderId,
    citations: draft.citations,
    sourceName: draft.sourceName,
    sourceUrl: draft.sourceUrl,
    publishedDate: draft.publishedDate,
    dataPeriod: draft.dataPeriod,
    indicatorName: draft.indicatorName,
    currentValue: draft.currentValue,
    previousValue: draft.previousValue,
    changeValue: draft.changeValue,
    changeRate: draft.changeRate,
    unit: draft.unit,
    comparisonType: draft.comparisonType,
    interpretation: draft.interpretation,
    cautionNote: draft.cautionNote,
    allowedClaims: draft.allowedClaims,
    blockedClaims: draft.blockedClaims,
    contentCategory: draft.contentCategory,
  };

  // Optional numeric fields — only set if provided.
  if (draft.currentNumericValue !== undefined)
    candidate.currentNumericValue = draft.currentNumericValue;
  if (draft.previousNumericValue !== undefined)
    candidate.previousNumericValue = draft.previousNumericValue;
  if (draft.changeNumericValue !== undefined)
    candidate.changeNumericValue = draft.changeNumericValue;
  if (draft.changeRateNumericValue !== undefined)
    candidate.changeRateNumericValue = draft.changeRateNumericValue;
  if (draft.createdAt !== undefined) candidate.createdAt = draft.createdAt;

  const validation = validateFactCard(candidate, { mode: "draft" });

  // Manual drafts always require at least one citation — enforce independently of
  // draft-mode semantics so the source-first contract is guaranteed at authoring time.
  const extraErrors: import("./types").FactCardValidationError[] = [];
  if (!Array.isArray(draft.citations) || draft.citations.length === 0) {
    extraErrors.push({
      field: "citations",
      code: "manual_citation_required",
      message: "Manual Fact Card drafts must include at least one citation.",
    });
  }

  const allErrors = [...validation.errors, ...extraErrors];
  const finalOk = allErrors.length === 0;

  return {
    ok: finalOk,
    factCard: finalOk ? candidate : null,
    validation: { ok: finalOk, errors: allErrors },
  };
}
