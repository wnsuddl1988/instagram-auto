import { inflationContentPackage30 } from "@/lib/content-package/fixtures";
import { runFinalQa } from "@/lib/final-qa/checker";
import { generateReviewPacket } from "./generator";
import type { ReviewPacket } from "./types";

const MOCK_CREATED_AT = "2026-06-25T00:00:00+09:00";

/**
 * Review packet for the valid inflation 30s package.
 * Expected: qa.readyForRender=true, ownerDecision=null.
 */
export const inflationReviewPacket: ReviewPacket = generateReviewPacket(
  inflationContentPackage30,
  {
    reviewPacketId: "rp-mock-inflation-30s",
    createdAt: MOCK_CREATED_AT,
  },
);

/**
 * Review packet derived from a not-ready package.
 * The assembled package is cloned with a forced-broken finalQa (risk blocked).
 * Expected: qa.readyForRender=false, qa.failedCheckCodes includes risk-related code.
 */
const brokenFinalQa = runFinalQa(
  {
    sourceId: inflationContentPackage30.summary.blueprintVideoId,
    sourceType: "blueprint",
    factCardIds: inflationContentPackage30.summary.factCardIds,
    sourceCitationIds: inflationContentPackage30.summary.sourceCitationIds,
    riskReview: {
      isBlocked: true,
      overallRiskLevel: "blocked",
      findings: [{ code: "investment_buy_recommendation" }],
    },
  },
  { qaRunId: "qa-broken-inflation-30s", createdAt: MOCK_CREATED_AT },
);

const brokenPackage = {
  ...inflationContentPackage30,
  finalQa: brokenFinalQa,
  riskReview: {
    ...inflationContentPackage30.riskReview,
    isBlocked: true,
    overallRiskLevel: "blocked" as const,
    findings: [
      {
        field: "scripts[0].coreMessage",
        code: "investment_buy_recommendation",
        riskLevel: "blocked" as const,
        matchedText: "지금 사세요",
        message: "직접 매수 권유는 금지됩니다.",
        saferWording: null,
      },
    ],
  },
};

export const brokenInflationReviewPacket: ReviewPacket = generateReviewPacket(brokenPackage, {
  reviewPacketId: "rp-broken-inflation-30s",
  createdAt: MOCK_CREATED_AT,
});
