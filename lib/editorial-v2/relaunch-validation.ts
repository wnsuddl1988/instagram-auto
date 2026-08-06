import type {
  ChannelDescriptionPackage,
  ProvisionalChannelIdentityDraft,
  RelaunchAssetPlan,
  RelaunchDirectionDefinition,
  RelaunchValidationIssue,
  RelaunchValidationSummary,
} from "./contracts";

export interface RelaunchValidationContext {
  readonly selectedDirection: RelaunchDirectionDefinition | null;
  readonly descriptions: ChannelDescriptionPackage | null;
  readonly allDirectionsReviewed: boolean;
  readonly characterOriginalityStatePresent: boolean;
  readonly rightsStateResolvedForPlanning: boolean;
  readonly controlTowerFinalApprovalRequired: boolean;
}

const GUARANTEE_PATTERN = /(수익\s*보장|성공\s*보장|확정\s*수익|무조건\s*(?:오른다|상승|매수|매도)|guaranteed\s+(?:return|profit)|risk[- ]?free\s+profit)/iu;
const SECURITY_TRADE_PATTERN = /(종목\s*추천\s*(?:채널|정보)|(?:매수|매도)\s*신호\s*(?:제공|알림)|buy\s+this\s+stock|sell\s+this\s+stock)/iu;
const MONEY_OS_PATTERN = /(?:^|\s)money[- ]?os(?:\s|$)|머니\s*os/iu;

function add(
  issues: RelaunchValidationIssue[],
  code: string,
  fieldPath: string,
  message: string,
  blocking = true,
): void {
  issues.push({ code, fieldPath, message, blocking });
}

export function validateProvisionalChannelIdentity(
  draft: ProvisionalChannelIdentityDraft,
  context: RelaunchValidationContext,
): readonly RelaunchValidationIssue[] {
  const issues: RelaunchValidationIssue[] = [];
  const combined = [
    draft.channelDisplayNameCandidate,
    draft.oneLinePromise,
    draft.primaryAudience,
    draft.optionalTagline ?? "",
    ...(context.descriptions ? [
      context.descriptions.instagramBioDraft,
      context.descriptions.youtubeShortDescription,
      context.descriptions.youtubeFullDescription,
    ] : []),
  ].join(" ");
  const claimSurface = combined
    .replace(/(?:수익|성공)\s*보장(?:이|을)?\s*(?:아닙니다|하지\s*않습니다|금지합니다)/gu, "")
    .replace(/(?:매수|매도)\s*(?:권유|추천)(?:가|를)?\s*(?:아닙니다|하지\s*않습니다)/gu, "");

  if (!context.selectedDirection || draft.directionId !== context.selectedDirection.directionId) add(issues, "relaunch_direction_missing", "directionId", "Relaunch direction이 선택되지 않았습니다.");
  if (!draft.channelDisplayNameCandidate.trim()) add(issues, "relaunch_channel_name_missing", "channelDisplayNameCandidate", "임시 channel name candidate가 필요합니다.");
  if (MONEY_OS_PATTERN.test(draft.channelDisplayNameCandidate)) add(issues, "relaunch_money_os_confusion", "channelDisplayNameCandidate", "별도 프로젝트 Money OS와 혼동되는 이름은 사용할 수 없습니다.");
  if (GUARANTEE_PATTERN.test(claimSurface)) add(issues, "relaunch_financial_guarantee", "identityDraft", "수익 또는 성공 보장 표현은 금지됩니다.");
  if (SECURITY_TRADE_PATTERN.test(claimSurface)) add(issues, "relaunch_specific_security_trade_confusion", "identityDraft", "특정 종목 매매 채널로 오해될 표현은 금지됩니다.");
  if (!draft.oneLinePromise.trim()) add(issues, "relaunch_channel_promise_missing", "oneLinePromise", "One-line promise가 필요합니다.");
  if (!draft.primaryAudience.trim()) add(issues, "relaunch_primary_audience_missing", "primaryAudience", "Primary audience가 필요합니다.");
  if (draft.finalBrandApproved !== false || draft.provisionalOnly !== true) add(issues, "relaunch_final_brand_false_claim", "finalBrandApproved", "임시 draft를 최종 브랜드 승인으로 표시할 수 없습니다.");
  if (draft.finalHandleAvailabilityVerified !== false || draft.handleCandidates.some((entry) => entry.availabilityVerified !== false)) add(issues, "relaunch_handle_availability_false_claim", "handleCandidates", "Handle availability 검증 완료를 주장할 수 없습니다.");
  if (draft.actualAccountChanged !== false) add(issues, "relaunch_account_change_false_claim", "actualAccountChanged", "실제 계정 변경 완료를 주장할 수 없습니다.");
  if (draft.finalOwnerApprovalRequired !== true || context.controlTowerFinalApprovalRequired !== true) add(issues, "relaunch_control_tower_approval_bypassed", "finalOwnerApprovalRequired", "Control Tower와 Owner의 최종 승인이 필요합니다.");
  if (!context.descriptions?.sourceStandard.shortStatement.trim() || !context.descriptions.sourceStandard.fullStatement.trim()) add(issues, "relaunch_source_standard_missing", "descriptions.sourceStandard", "Source disclosure standard가 필요합니다.");
  if (!context.descriptions?.financialSafetyStandard.statement.trim()) add(issues, "relaunch_financial_safety_standard_missing", "descriptions.financialSafetyStandard", "Financial safety standard가 필요합니다.");
  if (context.descriptions?.performanceClaimsIncluded !== false || context.descriptions?.currentPlatformLimitsVerified !== false) add(issues, "relaunch_description_false_claim", "descriptions", "성과 또는 최신 플랫폼 제한 검증을 주장할 수 없습니다.");
  if (!context.allDirectionsReviewed) add(issues, "relaunch_directions_not_all_reviewed", "directions", "세 방향을 모두 검토해야 합니다.");
  if (!context.characterOriginalityStatePresent) add(issues, "relaunch_character_originality_missing", "characterOriginality", "Character originality 상태가 필요합니다.");
  if (!context.rightsStateResolvedForPlanning) add(issues, "relaunch_rights_state_unresolved", "rightsState", "Rights planning state가 미확정입니다.");

  add(issues, "relaunch_handle_availability_unverified", "handleCandidates", "Handle availability는 외부 검증되지 않았습니다.", false);
  add(issues, "relaunch_platform_limits_unverified", "descriptions", "실제 최신 플랫폼 제한은 검증되지 않았습니다.", false);
  add(issues, "relaunch_svg_preview_only", "assets", "Profile과 cover는 inline SVG preview only입니다.", false);
  add(issues, "relaunch_final_color_unapproved", "assets.color", "최종 color system은 확정되지 않았습니다.", false);
  add(issues, "relaunch_final_typography_unapproved", "assets.typography", "최종 typography는 확정되지 않았습니다.", false);
  add(issues, "relaunch_final_character_name_unapproved", "character", "최종 character name은 확정되지 않았습니다.", false);
  add(issues, "relaunch_account_identity_unverified", "account", "실제 account identity는 검증되지 않았습니다.", false);
  return issues;
}

export function validateRelaunchAssetPlan(
  plan: RelaunchAssetPlan,
  draft: ProvisionalChannelIdentityDraft,
): readonly RelaunchValidationIssue[] {
  const issues: RelaunchValidationIssue[] = [];
  if (!plan.profile.badgeText.trim() || !plan.profile.conceptDescription.trim()) add(issues, "relaunch_profile_plan_missing", "assetPlan.profile", "Profile plan이 필요합니다.");
  for (const [name, cover] of [["verticalCover", plan.verticalCover], ["youtubeBanner", plan.youtubeBanner], ["pinnedPostCover", plan.pinnedPostCover]] as const) {
    if (!cover.coverTitle.trim() || !cover.sourceFirstBadge.trim()) add(issues, "relaunch_cover_plan_missing", `assetPlan.${name}`, "Cover title과 source-first badge가 필요합니다.");
    if (cover.actualProductionAsset !== false || cover.inlineSvgPreviewOnly !== true || cover.thirdPartyAssetsUsed !== false) add(issues, "relaunch_actual_asset_false_claim", `assetPlan.${name}`, "SVG draft를 실제 production asset으로 표시할 수 없습니다.");
  }
  if (plan.profile.actualProductionAsset !== false || plan.profile.inlineSvgPreviewOnly !== true || plan.profile.thirdPartyAssetsUsed !== false || plan.actualAssetsCreated !== false) add(issues, "relaunch_profile_actual_asset_false_claim", "assetPlan.profile", "Profile SVG draft는 실제 asset이 아닙니다.");
  if (plan.characterOriginalityState !== "owned_original_planning_evidence") add(issues, "relaunch_character_originality_missing", "assetPlan.characterOriginalityState", "Character originality planning evidence가 없습니다.");
  if (plan.rightsState !== "planning_review_only") add(issues, "relaunch_rights_state_unresolved", "assetPlan.rightsState", "Rights state는 planning review only여야 합니다.");
  if (draft.finalBrandApproved !== false) add(issues, "relaunch_final_brand_false_claim", "identityDraft.finalBrandApproved", "최종 브랜드 승인 완료를 주장할 수 없습니다.");
  return issues;
}

export function summarizeRelaunchValidation(
  issues: readonly RelaunchValidationIssue[],
): RelaunchValidationSummary {
  const cloned = issues.map((issue) => ({ ...issue }));
  const blockingIssueCount = cloned.filter((issue) => issue.blocking).length;
  return {
    valid: blockingIssueCount === 0,
    blockingIssueCount,
    warningCount: cloned.length - blockingIssueCount,
    approvable: blockingIssueCount === 0,
    publicLaunchReady: false,
    issues: cloned,
  };
}

export function canApproveRelaunchReadiness(summary: RelaunchValidationSummary): boolean {
  return summary.valid
    && summary.approvable
    && summary.blockingIssueCount === 0
    && summary.publicLaunchReady === false;
}
