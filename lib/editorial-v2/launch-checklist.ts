import type {
  LaunchReadinessCategory,
  LaunchReadinessChecklistItem,
  LaunchReadinessSummary,
  RelaunchValidationSummary,
  RepresentativeSampleValidationSummary,
} from "./contracts";

export interface LaunchReadinessContext {
  readonly representativeValidation: RepresentativeSampleValidationSummary;
  readonly relaunchValidation: RelaunchValidationSummary;
  readonly selectedProvisionalDirection: boolean;
  readonly allDirectionsReviewed: boolean;
  readonly actualProductionGapsAcknowledged: boolean;
  readonly controlTowerFinalApprovalAcknowledged: boolean;
}

const CATEGORIES: readonly LaunchReadinessCategory[] = [
  "content",
  "evidence",
  "brand",
  "character",
  "voice",
  "assets",
  "render",
  "account",
  "publishing",
  "persistence",
  "rights",
  "cost",
  "operations",
];

function item(
  itemId: string,
  category: LaunchReadinessCategory,
  label: string,
  status: LaunchReadinessChecklistItem["status"],
  blocking: boolean,
  evidence: readonly string[],
  requiredAction: string,
  responsibleRole: LaunchReadinessChecklistItem["responsibleRole"],
  externalActionRequired: boolean,
): LaunchReadinessChecklistItem {
  return { itemId, category, label, status, blocking, evidence: [...evidence], requiredAction, responsibleRole, externalActionRequired };
}

export function buildLaunchReadinessChecklist(
  context: LaunchReadinessContext,
): readonly LaunchReadinessChecklistItem[] {
  const sampleReady = context.representativeValidation.blockingIssueCount === 0;
  const relaunchReady = context.relaunchValidation.blockingIssueCount === 0;
  return [
    item("content-representative-sample", "content", "Representative sample package precheck", sampleReady ? "ready_for_scope_request" : "blocked", !sampleReady, [`blocking=${context.representativeValidation.blockingIssueCount}`], "Resolve representative sample structural blockers.", "Codex Main", false),
    item("evidence-source-disclosure", "evidence", "Source disclosure and provenance chain", relaunchReady ? "ready_for_scope_request" : "blocked", !relaunchReady, [`blocking=${context.relaunchValidation.blockingIssueCount}`], "Preserve source and as-of-date standards in Production Activation.", "Codex Main", false),
    item("brand-final-direction", "brand", "Final brand direction Owner approval", "blocked", true, ["three provisional directions only"], "Owner selects the final brand direction through Control Tower.", "Owner", true),
    item("brand-final-channel-name", "brand", "Final channel name approval", "blocked", true, ["display name candidate is provisional"], "Owner approves final channel display name.", "Owner", true),
    item("account-handle-availability", "account", "Actual handle availability", "not_verified", true, ["availabilityVerified=false"], "Check availability using approved account access.", "Production Activation implementation", true),
    item("account-identity-verification", "account", "Actual account identity verification", "not_verified", true, ["manual account observation only"], "Verify stable destination identities read-only before any write.", "Production Activation implementation", true),
    item("account-oauth", "account", "OAuth connection", "blocked", true, ["OAuth NOT_CONNECTED"], "Design and approve least-privilege OAuth flow.", "Production Activation implementation", true),
    item("voice-actual-audio", "voice", "External TTS or manual audio", "blocked", true, ["actualTts=false"], "Select approved voice path and obtain explicit paid/external approval.", "Owner", true),
    item("assets-actual-visuals", "assets", "Actual visual assets", "blocked", true, ["inline SVG preview only"], "Create and rights-review actual visual assets in a separately approved scope.", "Production Activation implementation", true),
    item("character-production-export", "character", "Production character export", "blocked", true, ["productionAssetCreated=false"], "Approve final character identity and export production assets.", "Owner", true),
    item("render-user-content", "render", "User-content production render", "blocked", true, ["syntheticOnly=true", "actualRenderExecuted=false"], "Implement and validate a production renderer adapter with approved user content.", "Production Activation implementation", true),
    item("render-subtitle-audio-alignment", "render", "Actual subtitle/audio alignment", "not_verified", true, ["estimated_not_audio_aligned"], "Align subtitle timing against approved final audio.", "Production Activation implementation", true),
    item("persistence-durable-store", "persistence", "Durable persistence", "blocked", true, ["sessionOnly=true"], "Approve persistence architecture, schema, migration, and retention.", "ChatGPT Control Tower", true),
    item("persistence-publication-ledger", "persistence", "Durable publication ledger", "blocked", true, ["durableLedgerAvailable=false"], "Implement durable idempotency and publication attempt ledger.", "Production Activation implementation", true),
    item("publishing-platform-policy", "publishing", "Real platform policy verification", "not_verified", true, ["currentPlatformLimitsVerified=false"], "Verify current official platform policy and limits.", "Production Activation implementation", true),
    item("publishing-actual-verification", "publishing", "Actual upload and publish verification", "blocked", true, ["uploadExecuted=false", "publicationExecuted=false"], "Run a separately approved private or unlisted smoke test before public publication.", "Owner", true),
    item("operations-rollback-runbook", "operations", "Rollback and operational runbook", "blocked", true, ["runbook NOT_IMPLEMENTED"], "Document abort, duplicate, withdrawal, rollback, and incident procedures.", "Production Activation implementation", false),
    item("rights-final-review", "rights", "Final rights review", "not_verified", true, ["planning_review_only"], "Complete rights and originality review for every production asset.", "Owner", true),
    item("cost-final-approval", "cost", "Final cost approval", "not_verified", true, ["cost estimates are unverified"], "Approve provider, per-item, and total production budget.", "Owner", true),
    item("operations-production-scope-request", "operations", "Production Activation scope request", sampleReady && relaunchReady && context.selectedProvisionalDirection && context.allDirectionsReviewed && context.actualProductionGapsAcknowledged && context.controlTowerFinalApprovalAcknowledged ? "ready_for_scope_request" : "blocked", !(sampleReady && relaunchReady && context.selectedProvisionalDirection && context.allDirectionsReviewed && context.actualProductionGapsAcknowledged && context.controlTowerFinalApprovalAcknowledged), ["publicLaunchReady=false", "Control Tower approval required"], "Send the finalized gaps and readiness packet to ChatGPT Control Tower.", "ChatGPT Control Tower", false),
  ];
}

export function summarizeLaunchReadiness(
  items: readonly LaunchReadinessChecklistItem[],
): LaunchReadinessSummary {
  const categoryCounts = CATEGORIES.map((category) => {
    const categoryItems = items.filter((entry) => entry.category === category);
    return { category, total: categoryItems.length, blocking: categoryItems.filter((entry) => entry.blocking).length };
  });
  const scopeRequest = items.find((entry) => entry.itemId === "operations-production-scope-request");
  const requiredFieldsPresent = items.every((entry) => entry.itemId.trim() && entry.label.trim() && entry.requiredAction.trim() && entry.evidence.length > 0);
  return {
    totalCount: items.length,
    blockingCount: items.filter((entry) => entry.blocking).length,
    notVerifiedCount: items.filter((entry) => entry.status === "not_verified").length,
    categoryCounts,
    canRequestProductionActivation: requiredFieldsPresent && scopeRequest?.status === "ready_for_scope_request",
    publicLaunchReady: false,
  };
}

export function canRequestProductionActivation(summary: LaunchReadinessSummary): boolean {
  return summary.canRequestProductionActivation
    && summary.publicLaunchReady === false
    && summary.totalCount > 0
    && summary.categoryCounts.length === CATEGORIES.length;
}
