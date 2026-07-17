import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildMoneyShortsAutomationQueueBatchPolicy,
  planMoneyShortsAutomationQueueRun,
  summarizeMoneyShortsAutomationQueueCapacity,
} from "../lib/money-shorts-automation-queue-planner.mjs";
import {
  MONEY_SHORTS_UNATTENDED_POLICY_VERSION,
  buildMoneyShortsUnattendedPolicyPreview,
} from "../lib/money-shorts-unattended-policy.mjs";

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

const runPreview = planMoneyShortsAutomationQueueRun({ jobs: [] });
const batchPolicy = buildMoneyShortsAutomationQueueBatchPolicy({ runPreview });
const capacitySummary = summarizeMoneyShortsAutomationQueueCapacity({ batchPolicy });
const preview = buildMoneyShortsUnattendedPolicyPreview({
  batchPolicy,
  capacitySummary,
});

check("policy schema is versioned", preview.schemaVersion === MONEY_SHORTS_UNATTENDED_POLICY_VERSION);
check("policy exposes the Owner-started bounded local mode", preview.mode === "owner_started_unattended_policy_status" && preview.currentMode === "owner_started_bounded_local" && preview.activationState === "bounded_local_no_submit_available" && preview.enabledProfileId === "bounded_local_no_submit");
check("three bounded policy options are visible", preview.options.length === 3 && preview.options.map((item) => item.profileId).join(",") === "bounded_local_no_submit,bounded_external_generation,autonomous_publish");
check("bounded local no-submit is the only enabled and recommended profile", preview.recommendedProfileId === "bounded_local_no_submit" && preview.options.filter((item) => item.recommended).length === 1 && preview.options.filter((item) => item.availability === "available_owner_started").map((item) => item.profileId).join(",") === "bounded_local_no_submit");
const local = preview.options.find((item) => item.profileId === "bounded_local_no_submit");
check("recommended profile keeps every external and Owner-judgment capability blocked", local?.localNoSubmitActionAllowed === true && local.maxActionsPerSession === 3 && local.maxConcurrentActions === 1 && local.automaticRetryLimit === 0 && local.paidTtsAllowed === false && local.imageGenerationAllowed === false && local.flowGenerationAllowed === false && local.ownerQaDecisionAllowed === false && local.uploadAllowed === false && local.publicationAllowed === false);
const publish = preview.options.find((item) => item.profileId === "autonomous_publish");
check("autonomous publication is visible only as a critical inactive candidate", publish?.riskLevel === "critical" && publish.recommended === false && publish.availability === "inactive_requires_exact_owner_approval");
check("current queue evidence is copied without an inferred schedule", preview.currentQueueEvidence.queueItemCount === 0 && preview.currentQueueEvidence.localSafeReadyCount === 0);
check("policy fingerprint is deterministic", /^[a-f0-9]{64}$/.test(preview.policyFingerprint) && preview.policyFingerprint === buildMoneyShortsUnattendedPolicyPreview({ batchPolicy, capacitySummary }).policyFingerprint);
check("activation decisions include paid caps, QA, and publication recovery", preview.requiredOwnerDecisionsBeforeActivation.length === 5 && preview.requiredOwnerDecisionsBeforeActivation.some((item) => item.includes("비용 상한")) && preview.requiredOwnerDecisionsBeforeActivation.some((item) => item.includes("품질 검수")) && preview.requiredOwnerDecisionsBeforeActivation.some((item) => item.includes("부분 게시 복구")));
check("status view enables only bounded local execution and no external side effects", preview.safety.viewOnly === true && preview.safety.boundedLocalRunEnabled === true && Object.entries(preview.safety).filter(([key]) => !["viewOnly", "boundedLocalRunEnabled"].includes(key)).every(([, value]) => value === false));

let invalidRejected = false;
try {
  buildMoneyShortsUnattendedPolicyPreview({
    batchPolicy: null,
    capacitySummary: null,
  });
} catch (error) {
  invalidRejected = error instanceof Error && error.message === "unattended_policy_preview_input_invalid";
}
check("invalid policy evidence fails closed", invalidRejected);

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = readFileSync(join(root, "lib", "money-shorts-unattended-policy.mjs"), "utf8");
check("policy module has no store, executor, process, network, timer, or activation path", !/node:fs|node:child_process|writeFile|executeMoneyShortsBoundedAutomationStep|runOperatorScript|\bfetch\s*\(|setTimeout|setInterval|actualUpload|flowMotionGenerate|realTtsCreate/u.test(source) && !/export function (?:activate|save|apply|enable)/u.test(source));

console.log(`\n${passed + failed} checks - ${passed} PASS, ${failed} FAIL`);
if (failed > 0) process.exit(1);
