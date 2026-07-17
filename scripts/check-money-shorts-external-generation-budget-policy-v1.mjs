import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  MONEY_SHORTS_EXTERNAL_GENERATION_BUDGET_POLICY_VERSION,
  buildMoneyShortsExternalGenerationBudgetPolicyPreview,
} from "../lib/money-shorts-external-generation-budget-policy.mjs";

let passed = 0;
let failed = 0;
function check(name, condition) {
  if (condition) {
    passed += 1;
    console.log(`PASS  ${name}`);
  } else {
    failed += 1;
    console.error(`FAIL  ${name}`);
  }
}

const unattendedPolicy = {
  mode: "owner_started_unattended_policy_status",
  enabledProfileId: "bounded_local_no_submit",
  policyFingerprint: "a".repeat(64),
};
const preview = buildMoneyShortsExternalGenerationBudgetPolicyPreview({
  unattendedPolicy,
});

check(
  "external generation budget policy is versioned",
  preview.schemaVersion ===
    MONEY_SHORTS_EXTERNAL_GENERATION_BUDGET_POLICY_VERSION,
);
check(
  "policy is read-only and blocked until Owner limits exist",
  preview.mode === "read_only_external_generation_budget_policy" &&
    preview.currentProfileId === "owner_approval_each_submission" &&
    preview.recommendedProfileId === "bounded_per_topic_external_generation" &&
    preview.activationState === "blocked_missing_owner_limits" &&
    preview.activationReady === false,
);
check(
  "three operating choices are visible but only current per-submission approval is active",
  preview.options.map((option) => option.profileId).join(",") ===
    "owner_approval_each_submission,bounded_per_topic_external_generation,multi_topic_unattended_generation" &&
    preview.options.filter((option) => option.availability === "active_current_mode")
      .map((option) => option.profileId).join(",") ===
      "owner_approval_each_submission",
);

const tts = preview.providerBudgets.find(
  (provider) => provider.providerId === "elevenlabs_tts",
);
const images = preview.providerBudgets.find(
  (provider) => provider.providerId === "chatgpt_scene_images",
);
const flow = preview.providerBudgets.find(
  (provider) => provider.providerId === "google_flow_veo_fast",
);
check(
  "per-topic proposal matches the current two-part production boundaries",
  tts?.proposedPerTopicSubmissionCap === 4 &&
    images?.proposedPerTopicSubmissionCap === 15 &&
    flow?.proposedPerTopicSubmissionCap === 4,
);
check(
  "Flow proposal exposes the exact current credit unit and topic ceiling",
  flow?.estimatedCreditPerSubmission === 20 &&
    flow?.proposedPerTopicCreditCap === 80 &&
    flow?.primaryAccountAlias === "Gemini 2",
);
check(
  "every daily and monthly cap remains unset and therefore fail-closed",
  preview.providerBudgets.every(
    (provider) =>
      provider.proposedPerDaySubmissionCap == null &&
      provider.proposedPerMonthSubmissionCap == null,
  ) &&
    preview.missingOwnerDecisions.some((decision) => decision.includes("일일·월간")),
);
check(
  "all providers are single-flight with zero automatic retry",
  preview.providerBudgets.every(
    (provider) =>
      provider.maxConcurrentSubmissions === 1 &&
      provider.automaticRetryLimit === 0,
  ),
);
check(
  "account fallback is disabled until a separate exact decision",
  preview.providerBudgets.every(
    (provider) => provider.accountFallbackPolicy.startsWith("disabled"),
  ) &&
    preview.missingOwnerDecisions.some(
      (decision) => decision.includes("Gemini 3·4"),
    ),
);
check(
  "post-submit uncertainty locks evidence and never retries or changes account",
  preview.stopRules.some(
    (rule) =>
      rule.event === "post_submit_timeout_or_unknown_result" &&
      rule.disposition === "lock_for_manual_submission_evidence" &&
      rule.retryAllowed === false &&
      rule.accountFallbackAllowed === false,
  ),
);
check(
  "provider-specific human QA remains mandatory",
  preview.invariants.humanQaRequired === true &&
    preview.providerBudgets.every((provider) => provider.humanQaRequired === true),
);
check(
  "budget must be reserved before submit and terminalized before the next submit",
  preview.invariants.preSubmitBudgetReservationRequired === true &&
    preview.invariants.terminalReceiptRequiredBeforeNextSubmission === true &&
    preview.invariants.unknownSubmissionResultLocksBudget === true &&
    preview.invariants.maxConcurrentSubmissions === 1 &&
    preview.invariants.automaticRetryLimit === 0,
);
check(
  "preview reports no budget mutation, paid action, fallback, upload, or publication",
  preview.safety.viewOnly === true &&
    Object.entries(preview.safety)
      .filter(([key]) => key !== "viewOnly")
      .every(([, value]) => value === false),
);
check(
  "policy fingerprint is deterministic and bound to the local policy",
  /^[a-f0-9]{64}$/.test(preview.policyFingerprint) &&
    preview.sourcePolicyFingerprint === unattendedPolicy.policyFingerprint &&
    preview.policyFingerprint ===
      buildMoneyShortsExternalGenerationBudgetPolicyPreview({
        unattendedPolicy,
      }).policyFingerprint,
);

let invalidRejected = false;
try {
  buildMoneyShortsExternalGenerationBudgetPolicyPreview({
    unattendedPolicy: null,
  });
} catch (error) {
  invalidRejected =
    error instanceof Error &&
    error.message === "external_generation_budget_policy_input_invalid";
}
check("invalid source policy fails closed", invalidRejected);

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = readFileSync(
  join(root, "lib", "money-shorts-external-generation-budget-policy.mjs"),
  "utf8",
);
check(
  "policy module has no store, executor, network, timer, provider call, or activation export",
  !/node:fs|node:child_process|writeFile|executeMoneyShorts|\bfetch\s*\(|setTimeout|setInterval|runOperatorScript|ALLOW_FLOW_MOTION_GENERATION|ALLOW_CHATGPT_IMAGE/u.test(source) &&
    !/export function (?:activate|reserve|submit|execute|enable)/u.test(source),
);

console.log(`\n${passed + failed} checks - ${passed} PASS, ${failed} FAIL`);
if (failed > 0) process.exit(1);
