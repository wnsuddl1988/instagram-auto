export type SourceProviderType =
  | "ecos"
  | "kosis"
  | "opendart"
  | "fred"
  | "public_finance"
  | "company_ir"
  | "manual";

export type CollectionMethod = "manual" | "api" | "upload";

export type ContentCategory =
  | "source_based_finance"
  | "money_os_money_management";

export type ComparisonType =
  | "previous_month"
  | "previous_year"
  | "previous_release"
  | "consensus"
  | "custom";

export type RiskLevel = "unchecked" | "low" | "medium" | "high" | "blocked";

export type CtaPolicy = "none" | "soft" | "direct";

export type CommercialUseStatus =
  | "unknown"
  | "allowed"
  | "restricted"
  | "needs_review";

export interface SourceProvider {
  id: string;
  name: string;
  providerType: SourceProviderType;
  baseUrl?: string;
  licenseNote?: string;
  commercialUseStatus?: CommercialUseStatus;
  requiresApiKey?: boolean;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface RawDataSnapshot {
  id: string;
  sourceProviderId: string;
  sourceName: string;
  sourceUrl: string;
  fetchedAt?: string;
  publishedDate: string;
  dataPeriod: string;
  rawPayload?: unknown;
  checksum?: string;
  collectionMethod: CollectionMethod;
}

export interface EconomicIndicator {
  id: string;
  sourceProviderId: string;
  indicatorCode?: string;
  indicatorName: string;
  category?: string;
  unit: string;
  country?: string;
  frequency?: string;
  latestPeriod?: string;
  latestValue?: number;
  previousValue?: number;
  changeValue?: number;
  changeRate?: number;
  updatedAt?: string;
}

export interface DisclosureDocument {
  id: string;
  sourceProviderId: string;
  companyName: string;
  stockCode?: string;
  documentTitle: string;
  documentType: string;
  publishedAt: string;
  sourceUrl: string;
  summary?: string;
  keyNumbers?: Record<string, string | number>;
  rawSnapshotId?: string;
}

export interface SourceCitation {
  id: string;
  sourceProviderId?: string;
  sourceName: string;
  sourceUrl: string;
  /** Official publish date. ISO date string recommended: YYYY-MM-DD. */
  publishedDate: string;
  dataPeriod?: string;
  citationLabel?: string;
  licenseNote?: string;
  commercialUseStatus?: CommercialUseStatus;
}

export interface FactCard {
  id: string;
  isMock: boolean;
  isPublishable: boolean;
  primarySourceProviderId: string;
  citations: SourceCitation[];
  sourceName: string;
  sourceUrl: string;
  /** Official publish date. ISO date string recommended: YYYY-MM-DD. */
  publishedDate: string;
  dataPeriod: string;
  /** App retrieval/input timestamp. ISO datetime string recommended. */
  retrievedAt?: string;
  indicatorName: string;
  currentValue: string;
  previousValue: string;
  /** Use "N/A" when the change value is not applicable, such as some disclosures. */
  changeValue: string;
  /** Use "N/A" when the change rate is not applicable or not meaningful. */
  changeRate: string;
  /** Use "N/A" when a unit is not applicable. */
  unit: string;
  currentNumericValue?: number;
  previousNumericValue?: number;
  changeNumericValue?: number;
  changeRateNumericValue?: number;
  comparisonType: ComparisonType;
  interpretation: string;
  cautionNote: string;
  allowedClaims: string[];
  blockedClaims: string[];
  contentCategory: ContentCategory;
  createdAt?: string;
  updatedAt?: string;
}

export type GeneratedScriptDuration = 15 | 30 | 60;

export interface GeneratedScript {
  id: string;
  factCardId: string;
  blueprintId?: string;
  durationSec: GeneratedScriptDuration;
  narration: string;
  captions: string[];
  description?: string;
  riskStatus: RiskLevel;
  createdAt?: string;
}

export interface GeneratedChart {
  id: string;
  factCardId: string;
  chartType: "number_card" | "line_chart" | "bar_chart" | "comparison_card";
  title: string;
  dataPayload: Record<string, unknown>;
  imageUrl?: string;
  sourceCitationId?: string;
  createdAt?: string;
}

export type RiskReviewTargetType =
  | "fact_card"
  | "script"
  | "caption"
  | "chart"
  | "description"
  | "cta";

export interface RiskFinding {
  id: string;
  field?: string;
  code: string;
  message: string;
  matchedText?: string;
}

export interface RiskReview {
  id: string;
  factCardId: string;
  targetType: RiskReviewTargetType;
  targetId?: string;
  dataRiskLevel: RiskLevel;
  expressionRiskLevel: RiskLevel;
  dataRiskFindings: RiskFinding[];
  expressionRiskFindings: RiskFinding[];
  suggestedReplacements: string[];
  status: "open" | "resolved" | "ignored";
  createdAt?: string;
}

export interface VideoBlueprintSourceLink {
  factCardId: string;
  sourceCitationIds: string[];
  sourceSummary: string;
  dataConfidence: RiskLevel;
  ctaPolicy: CtaPolicy;
  allowedClaims: string[];
  blockedClaims: string[];
}

export type FactCardValidationMode = "draft" | "publish";

export interface FactCardValidationOptions {
  mode?: FactCardValidationMode;
}

export interface FactCardValidationError {
  field: string;
  code: string;
  message: string;
}

export interface FactCardValidationResult {
  ok: boolean;
  errors: FactCardValidationError[];
}
