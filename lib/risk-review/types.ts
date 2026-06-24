import type { RiskLevel } from "@/lib/source-facts/types";

export const RISK_REVIEW_SCHEMA_VERSION = "money_shorts_risk_review_v1" as const;

/** Which field of the package contained the match. */
export type RiskFindingField =
  | "title"
  | "youtubeTitle"
  | "instagramCaption"
  | "description"
  | "hashtags"
  | "moneyOsCta"
  | "coreMessage"
  | `scripts[${number}].fullNarration`
  | `scripts[${number}].scenes[${number}].narrationText`
  | `scripts[${number}].scenes[${number}].captionText`;

export interface RiskFinding {
  /** Dotted path to the field that triggered the finding. */
  field: string;
  /** Short rule code, e.g. "investment_buy_recommendation". */
  code: string;
  riskLevel: Exclude<RiskLevel, "unchecked">;
  /** Excerpt of the matched text (the problematic phrase). */
  matchedText: string;
  /** Human-readable explanation of the risk. */
  message: string;
  /** A safer alternative wording when a drop-in replacement is practical. */
  saferWording: string | null;
}

export interface RiskReviewResult {
  schemaVersion: typeof RISK_REVIEW_SCHEMA_VERSION;
  packageId: string;
  /** Highest risk level across all findings. "low" when no findings. */
  overallRiskLevel: RiskLevel;
  findings: RiskFinding[];
  /** True when overallRiskLevel is "blocked" and the package must not be published. */
  isBlocked: boolean;
  reviewedAt?: string;
}
