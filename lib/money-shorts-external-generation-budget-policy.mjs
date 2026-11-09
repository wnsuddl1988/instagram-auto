import { createHash } from "node:crypto";

export const MONEY_SHORTS_EXTERNAL_GENERATION_BUDGET_POLICY_VERSION =
  "money_shorts_external_generation_budget_policy_v1";

const POLICY_OPTIONS = Object.freeze([
  Object.freeze({
    profileId: "owner_approval_each_submission",
    label: "매 제출 Owner 승인",
    riskLevel: "current",
    recommended: false,
    availability: "active_current_mode",
    description: "현재 방식입니다. 유료 또는 외부 전송마다 정확한 승인문과 현재 지문을 다시 확인합니다.",
  }),
  Object.freeze({
    profileId: "bounded_per_topic_external_generation",
    label: "주제별 상한형 외부 생성",
    riskLevel: "high",
    recommended: true,
    availability: "blocked_missing_owner_limits",
    description: "주제별 제출 상한 안에서만 생성하고 첫 실패·불명확한 전송·QA 단계에서 멈추는 추천 후보입니다.",
  }),
  Object.freeze({
    profileId: "multi_topic_unattended_generation",
    label: "여러 주제 무인 외부 생성",
    riskLevel: "critical",
    recommended: false,
    availability: "inactive_requires_separate_architecture",
    description: "여러 주제와 계정을 연속으로 사용하는 방식이며 비용·중복·복구 위험 때문에 현재 범위에서 제외합니다.",
  }),
]);

const PROVIDER_BUDGETS = Object.freeze([
  Object.freeze({
    providerId: "elevenlabs_tts",
    label: "ElevenLabs TTS",
    action: "realTtsCreate",
    budgetUnit: "provider_request",
    proposedPerTopicSubmissionCap: 4,
    proposedPerDaySubmissionCap: null,
    proposedPerMonthSubmissionCap: null,
    proposedPerTopicCreditCap: null,
    estimatedCreditPerSubmission: null,
    maxConcurrentSubmissions: 1,
    automaticRetryLimit: 0,
    accountFallbackPolicy: "disabled",
    humanQaRequired: true,
    humanQaGate: "listen_and_accept_voice_before_images_or_render",
  }),
  Object.freeze({
    providerId: "chatgpt_scene_images",
    label: "ChatGPT 장면 이미지",
    action: "realSceneImagesCreate",
    budgetUnit: "image_submission",
    proposedPerTopicSubmissionCap: 15,
    proposedPerDaySubmissionCap: null,
    proposedPerMonthSubmissionCap: null,
    proposedPerTopicCreditCap: null,
    estimatedCreditPerSubmission: null,
    maxConcurrentSubmissions: 1,
    automaticRetryLimit: 0,
    accountFallbackPolicy: "disabled",
    humanQaRequired: true,
    humanQaGate: "accept_complete_scene_set_before_flow_or_render",
  }),
  Object.freeze({
    providerId: "google_flow_veo_fast",
    label: "Google Flow · Veo 3.1 Fast",
    action: "flowMotionGenerate",
    budgetUnit: "credit",
    proposedPerTopicSubmissionCap: 4,
    proposedPerDaySubmissionCap: null,
    proposedPerMonthSubmissionCap: null,
    proposedPerTopicCreditCap: 80,
    estimatedCreditPerSubmission: 20,
    maxConcurrentSubmissions: 1,
    automaticRetryLimit: 0,
    primaryAccountAlias: "Gemini 2",
    accountFallbackPolicy: "disabled_until_exact_owner_approval",
    humanQaRequired: true,
    humanQaGate: "seven_point_owner_motion_qa_per_clip",
  }),
]);

const STOP_RULES = Object.freeze([
  Object.freeze({
    event: "pre_submit_auth_session_or_ui_not_ready",
    disposition: "stop_before_submission",
    retryAllowed: false,
    accountFallbackAllowed: false,
    evidenceRequired: "local_preflight_and_visible_provider_state",
  }),
  Object.freeze({
    event: "pre_submit_quota_exhausted",
    disposition: "stop_for_owner_account_decision",
    retryAllowed: false,
    accountFallbackAllowed: false,
    evidenceRequired: "explicit_quota_exhausted",
  }),
  Object.freeze({
    event: "post_submit_timeout_or_unknown_result",
    disposition: "lock_for_manual_submission_evidence",
    retryAllowed: false,
    accountFallbackAllowed: false,
    evidenceRequired: "provider_history_or_new_result_identity",
  }),
  Object.freeze({
    event: "provider_error_or_download_binding_failure",
    disposition: "stop_and_preserve_artifacts",
    retryAllowed: false,
    accountFallbackAllowed: false,
    evidenceRequired: "terminal_receipt_and_local_artifact_audit",
  }),
  Object.freeze({
    event: "human_qa_required_or_failed",
    disposition: "stop_for_owner_qa",
    retryAllowed: false,
    accountFallbackAllowed: false,
    evidenceRequired: "provider_specific_owner_acceptance",
  }),
]);

function fingerprint({ unattendedPolicy }) {
  const evidence = {
    schemaVersion: MONEY_SHORTS_EXTERNAL_GENERATION_BUDGET_POLICY_VERSION,
    sourcePolicyFingerprint: unattendedPolicy.policyFingerprint,
    currentProfileId: "owner_approval_each_submission",
    recommendedProfileId: "bounded_per_topic_external_generation",
    options: POLICY_OPTIONS,
    providers: PROVIDER_BUDGETS,
    stopRules: STOP_RULES,
  };
  return createHash("sha256").update(JSON.stringify(evidence)).digest("hex");
}

/**
 * Builds a read-only decision contract for future paid/external automation.
 * Missing daily/monthly limits deliberately keep the candidate unactivatable.
 */
export function buildMoneyShortsExternalGenerationBudgetPolicyPreview({
  unattendedPolicy,
} = {}) {
  if (
    unattendedPolicy?.mode !== "owner_started_unattended_policy_status" ||
    unattendedPolicy?.enabledProfileId !== "bounded_local_no_submit" ||
    !/^[a-f0-9]{64}$/.test(unattendedPolicy?.policyFingerprint ?? "")
  ) {
    throw new Error("external_generation_budget_policy_input_invalid");
  }

  const missingOwnerDecisions = [
    "ElevenLabs 일일·월간 요청 또는 문자 상한",
    "ChatGPT 이미지 일일·월간 제출 상한",
    "Flow 일일·월간 제출 및 크레딧 상한",
    "Gemini 2 한도 소진 시 Gemini 3·4 계정 fallback 허용 여부",
    "TTS·전체 이미지·Flow 장면별 사람 품질 검수 유지 여부",
  ];

  return {
    schemaVersion: MONEY_SHORTS_EXTERNAL_GENERATION_BUDGET_POLICY_VERSION,
    mode: "read_only_external_generation_budget_policy",
    currentProfileId: "owner_approval_each_submission",
    recommendedProfileId: "bounded_per_topic_external_generation",
    activationState: "blocked_missing_owner_limits",
    activationReady: false,
    policyFingerprint: fingerprint({ unattendedPolicy }),
    sourcePolicyFingerprint: unattendedPolicy.policyFingerprint,
    reason: "주제별 제출 상한은 제안됐지만 일일·월간 한도와 계정 fallback 기준이 정해지지 않아 외부 자동 생성은 활성화할 수 없습니다.",
    options: POLICY_OPTIONS.map((option) => ({ ...option })),
    providerBudgets: PROVIDER_BUDGETS.map((provider) => ({ ...provider })),
    stopRules: STOP_RULES.map((rule) => ({ ...rule })),
    missingOwnerDecisions,
    invariants: {
      exactInputFingerprintRequired: true,
      preSubmitBudgetReservationRequired: true,
      terminalReceiptRequiredBeforeNextSubmission: true,
      unknownSubmissionResultLocksBudget: true,
      providerHistoryEvidenceRequiredBeforeClear: true,
      humanQaRequired: true,
      maxConcurrentSubmissions: 1,
      automaticRetryLimit: 0,
    },
    safety: {
      viewOnly: true,
      budgetStateWritten: false,
      budgetReserved: false,
      activationChanged: false,
      actionExecuted: false,
      executionReceiptCreated: false,
      timerEnabled: false,
      backgroundWorkerEnabled: false,
      automaticRetryEnabled: false,
      paidActionEnabled: false,
      externalGenerationEnabled: false,
      accountFallbackEnabled: false,
      ownerQaDecisionEnabled: false,
      uploadEnabled: false,
      publicationEnabled: false,
    },
  };
}
