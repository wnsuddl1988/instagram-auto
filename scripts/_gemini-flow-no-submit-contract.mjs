export const GEMINI_FLOW_NO_SUBMIT_CONTRACT_VERSION = "gemini_flow_no_submit_contract_v1";

export const GEMINI_FLOW_TARGET = Object.freeze({
  profileId: 2,
  cdpPort: 9224,
  projectId: "2b12c31a-4493-405b-aedf-2268abb10422",
  projectUrl: "https://labs.google/fx/ko/tools/flow/project/2b12c31a-4493-405b-aedf-2268abb10422",
  model: "Veo 3.1 - Fast",
  aspectRatio: "9:16",
  outputCount: 1,
  creditSpendApprovalPolicy: "always",
  expectedCreditsPerGeneration: 20,
  minimumCreditBalance: 20,
  creditCostSource: "https://support.google.com/flow/answer/16526234?hl=en",
});

export const GEMINI_FLOW_NO_SUBMIT_POLICY = Object.freeze({
  allowBrowserLaunch: false,
  allowProjectCreation: false,
  allowSettingsMutation: false,
  allowPromptTyping: false,
  allowReferenceAttach: false,
  allowGenerationSubmit: false,
  allowAccountMutation: false,
  submissionCount: 0,
});

function normalized(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

export function evaluateGeminiFlowObservation(observation) {
  const failures = [];
  const selectedVideoTabs = (observation?.selectedVideoTabs ?? []).map(normalized);
  const availableVideoModels = (observation?.availableVideoModels ?? []).map(normalized);

  if (observation?.profileId !== GEMINI_FLOW_TARGET.profileId) failures.push("profile_mismatch");
  if (observation?.currentHost !== "labs.google") failures.push("flow_host_mismatch");
  if (observation?.projectId !== GEMINI_FLOW_TARGET.projectId) failures.push("project_mismatch");
  if (observation?.authenticated !== true) failures.push("authentication_unconfirmed");
  if (observation?.proBadgeVisible !== true) failures.push("pro_plan_unconfirmed");
  if (observation?.projectEmpty !== true) failures.push("project_not_empty");
  if (observation?.onboardingDialogVisible !== false) failures.push("onboarding_blocks_readonly_probe");
  if (observation?.settingsOpened !== true) failures.push("settings_unavailable");
  if (observation?.confirmBeforeGeneration !== GEMINI_FLOW_TARGET.creditSpendApprovalPolicy) failures.push("credit_approval_policy_mismatch");
  if (!selectedVideoTabs.some((value) => value === GEMINI_FLOW_TARGET.aspectRatio || value.endsWith(` ${GEMINI_FLOW_TARGET.aspectRatio}`))) failures.push("aspect_ratio_mismatch");
  if (!selectedVideoTabs.some((value) => value === `${GEMINI_FLOW_TARGET.outputCount}x` || value.endsWith(` ${GEMINI_FLOW_TARGET.outputCount}x`))) failures.push("output_count_mismatch");
  if (normalized(observation?.videoModel) !== GEMINI_FLOW_TARGET.model) failures.push("video_model_mismatch");
  if (!availableVideoModels.includes(GEMINI_FLOW_TARGET.model)) failures.push("target_model_option_missing");
  if (!Number.isInteger(observation?.creditBalance) || observation.creditBalance < GEMINI_FLOW_TARGET.minimumCreditBalance) failures.push("insufficient_or_unknown_credit_balance");
  if ((observation?.blockedNetworkMutations ?? []).length > 0) failures.push("network_mutation_attempt_blocked");

  const mutationFlags = [
    "browserLaunched",
    "newProjectCreated",
    "settingsSaved",
    "promptTyped",
    "referenceAttached",
    "generationSubmitted",
    "accountChanged",
  ];
  for (const flag of mutationFlags) {
    if (observation?.[flag] !== false) failures.push(`${flag}_must_be_false`);
  }
  if (observation?.submissionCount !== GEMINI_FLOW_NO_SUBMIT_POLICY.submissionCount) failures.push("submission_count_mismatch");

  return {
    passed: failures.length === 0,
    readyForOwnerUploadDecision: failures.length === 0,
    readyForPaidGeneration: false,
    failures,
  };
}
