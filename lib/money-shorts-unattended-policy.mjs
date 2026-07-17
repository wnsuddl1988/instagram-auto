import { createHash } from "node:crypto";

export const MONEY_SHORTS_UNATTENDED_POLICY_VERSION =
  "money_shorts_unattended_policy_v2";

const POLICY_OPTIONS = Object.freeze([
  Object.freeze({
    profileId: "bounded_local_no_submit",
    label: "로컬 안전 작업만 제한 자동화",
    riskLevel: "low",
    recommended: true,
    availability: "available_owner_started",
    description: "Owner가 시작한 1~3회 세션 안에서 무전송 로컬 작업만 이어가는 후보입니다.",
    localNoSubmitActionAllowed: true,
    paidTtsAllowed: false,
    imageGenerationAllowed: false,
    flowGenerationAllowed: false,
    ownerQaDecisionAllowed: false,
    uploadAllowed: false,
    publicationAllowed: false,
    maxActionsPerSession: 3,
    maxConcurrentActions: 1,
    automaticRetryLimit: 0,
  }),
  Object.freeze({
    profileId: "bounded_external_generation",
    label: "유료 생성까지 상한형 자동화",
    riskLevel: "high",
    recommended: false,
    availability: "inactive_requires_exact_owner_approval",
    description: "TTS·이미지·Flow의 계정별 비용 상한과 중복 방지를 별도로 승인한 뒤 검토할 후보입니다.",
    localNoSubmitActionAllowed: true,
    paidTtsAllowed: true,
    imageGenerationAllowed: true,
    flowGenerationAllowed: true,
    ownerQaDecisionAllowed: false,
    uploadAllowed: false,
    publicationAllowed: false,
    maxActionsPerSession: null,
    maxConcurrentActions: 1,
    automaticRetryLimit: 0,
  }),
  Object.freeze({
    profileId: "autonomous_publish",
    label: "실제 게시까지 무인 자동화",
    riskLevel: "critical",
    recommended: false,
    availability: "inactive_requires_exact_owner_approval",
    description: "계정·중복 게시·플랫폼 오류·부분 게시 복구 정책이 모두 승인되기 전에는 선택할 수 없는 후보입니다.",
    localNoSubmitActionAllowed: true,
    paidTtsAllowed: true,
    imageGenerationAllowed: true,
    flowGenerationAllowed: true,
    ownerQaDecisionAllowed: false,
    uploadAllowed: true,
    publicationAllowed: true,
    maxActionsPerSession: null,
    maxConcurrentActions: 1,
    automaticRetryLimit: 0,
  }),
]);

function policyFingerprint({ batchPolicy, capacitySummary }) {
  const evidence = {
    schemaVersion: MONEY_SHORTS_UNATTENDED_POLICY_VERSION,
    currentMode: "owner_started_bounded_local",
    enabledProfileId: "bounded_local_no_submit",
    recommendedProfileId: "bounded_local_no_submit",
    queueItemCount: capacitySummary.queueItemCount,
    batchItemCount: batchPolicy.itemCount,
    localSafeReadyCount: capacitySummary.localSafeReadyCount,
    localSafeWaitingCount: capacitySummary.localSafeWaitingCount,
    paidGenerationApprovalCount: capacitySummary.paidGenerationApprovalCount,
    ownerQualityCheckCount: capacitySummary.ownerQualityCheckCount,
    publicationApprovalCount: capacitySummary.publicationApprovalCount,
    options: POLICY_OPTIONS.map((option) => ({
      profileId: option.profileId,
      riskLevel: option.riskLevel,
      availability: option.availability,
      localNoSubmitActionAllowed: option.localNoSubmitActionAllowed,
      paidTtsAllowed: option.paidTtsAllowed,
      imageGenerationAllowed: option.imageGenerationAllowed,
      flowGenerationAllowed: option.flowGenerationAllowed,
      ownerQaDecisionAllowed: option.ownerQaDecisionAllowed,
      uploadAllowed: option.uploadAllowed,
      publicationAllowed: option.publicationAllowed,
      maxActionsPerSession: option.maxActionsPerSession,
      maxConcurrentActions: option.maxConcurrentActions,
      automaticRetryLimit: option.automaticRetryLimit,
    })),
  };
  return createHash("sha256").update(JSON.stringify(evidence)).digest("hex");
}

/**
 * Builds a read-only Owner policy status card from already computed queue views.
 * The bounded local capability is compiled into the explicit safe-session route;
 * this view writes no state and cannot enable an external profile.
 */
export function buildMoneyShortsUnattendedPolicyPreview({
  batchPolicy,
  capacitySummary,
} = {}) {
  if (
    batchPolicy?.mode !== "no_submit_batch_policy_preview" ||
    capacitySummary?.mode !== "no_submit_capacity_summary" ||
    !Array.isArray(batchPolicy.entries) ||
    batchPolicy.itemCount !== capacitySummary.queueItemCount
  ) {
    throw new Error("unattended_policy_preview_input_invalid");
  }

  return {
    schemaVersion: MONEY_SHORTS_UNATTENDED_POLICY_VERSION,
    mode: "owner_started_unattended_policy_status",
    currentMode: "owner_started_bounded_local",
    activationState: "bounded_local_no_submit_available",
    enabledProfileId: "bounded_local_no_submit",
    recommendedProfileId: "bounded_local_no_submit",
    policyFingerprint: policyFingerprint({ batchPolicy, capacitySummary }),
    reason: "Owner가 시작한 세션에서 로컬 무전송 작업을 최대 3회까지 이어갈 수 있습니다. 외부·유료·QA·게시 단계에서는 즉시 멈춥니다.",
    options: POLICY_OPTIONS.map((option) => ({ ...option })),
    currentQueueEvidence: {
      queueItemCount: capacitySummary.queueItemCount,
      localSafeReadyCount: capacitySummary.localSafeReadyCount,
      localSafeWaitingCount: capacitySummary.localSafeWaitingCount,
      paidGenerationApprovalCount: capacitySummary.paidGenerationApprovalCount,
      ownerQualityCheckCount: capacitySummary.ownerQualityCheckCount,
      publicationApprovalCount: capacitySummary.publicationApprovalCount,
      ownerDecisionCount: capacitySummary.ownerDecisionCount,
      recoveryOrBlockedCount: capacitySummary.recoveryOrBlockedCount,
    },
    requiredOwnerDecisionsBeforeActivation: [
      "허용할 프로필과 최대 작업 수",
      "유료 서비스별 월·일·작업당 비용 상한",
      "이미지·Flow 생성 실패와 불명확한 전송 결과의 중단 기준",
      "사람 품질 검수를 자동 판정으로 대체할지 여부",
      "실제 게시 계정·빈도·중복·부분 게시 복구 기준",
    ],
    safety: {
      viewOnly: true,
      boundedLocalRunEnabled: true,
      policyStateWritten: false,
      activationChanged: false,
      actionExecuted: false,
      executionReceiptCreated: false,
      timerEnabled: false,
      backgroundWorkerEnabled: false,
      automaticRetryEnabled: false,
      paidActionEnabled: false,
      externalGenerationEnabled: false,
      ownerQaDecisionEnabled: false,
      uploadEnabled: false,
      publicationEnabled: false,
    },
  };
}
