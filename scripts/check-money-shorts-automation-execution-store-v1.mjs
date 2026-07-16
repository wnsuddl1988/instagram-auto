import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  MONEY_SHORTS_AUTOMATION_EXECUTION_STORE_VERSION,
  beginMoneyShortsAutomationExecution,
  fingerprintMoneyShortsAutomationPlan,
  finishMoneyShortsAutomationExecution,
  inspectMoneyShortsAutomationExecution,
} from "../lib/money-shorts-automation-execution-store.mjs";
import { buildMoneyShortsResumablePlan } from "../lib/money-shorts-resumable-orchestrator.mjs";

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

const topicId = "automation-execution-test-topic";
const base = {
  topicId,
  scriptReady: true,
  characterReady: true,
  realTtsReady: true,
  generatedImageCount: 8,
  expectedImageCount: 8,
  realImagesReady: true,
  flowState: "not_prepared",
  flowReadyForRender: false,
  finalVideoReady: false,
  mediaQualityGateOk: false,
  publishPreflightReady: false,
  publishedAllParts: false,
};
const planA = buildMoneyShortsResumablePlan(base);
const planB = buildMoneyShortsResumablePlan({ ...base, flowState: "render_ready", flowReadyForRender: true });
const rootDir = mkdtempSync(join(tmpdir(), "money-shorts-execution-store-"));

try {
  check("store schema is versioned", MONEY_SHORTS_AUTOMATION_EXECUTION_STORE_VERSION === "money_shorts_automation_execution_store_v1");
  check("plan fingerprint is deterministic", fingerprintMoneyShortsAutomationPlan(planA) === fingerprintMoneyShortsAutomationPlan(structuredClone(planA)));
  check("different durable plan state changes fingerprint", fingerprintMoneyShortsAutomationPlan(planA) !== fingerprintMoneyShortsAutomationPlan(planB));

  const first = beginMoneyShortsAutomationExecution({
    topicId,
    action: "flowMotionPrepare",
    plan: planA,
    rootDir,
    executionId: "execution-a",
    now: () => "2026-07-17T01:00:00.000Z",
  });
  check("first safe execution acquires durable lock", first.ok === true && existsSync(first.handle.lockPath));
  check("in-progress receipt exists before action", first.ok === true && existsSync(first.handle.receiptPath));
  const inProgress = first.ok ? JSON.parse(readFileSync(first.handle.receiptPath, "utf8")) : null;
  check("receipt binds topic action and plan fingerprint", inProgress?.status === "in_progress" && inProgress.topicId === topicId && inProgress.action === "flowMotionPrepare" && inProgress.planFingerprint === fingerprintMoneyShortsAutomationPlan(planA));

  const sameWhileActive = beginMoneyShortsAutomationExecution({ topicId, action: "flowMotionPrepare", plan: planA, rootDir });
  check("same in-progress attempt requires manual review", sameWhileActive.ok === false && sameWhileActive.reason === "automation_execution_previous_attempt_requires_manual_review");
  const otherWhileActive = beginMoneyShortsAutomationExecution({ topicId, action: "finalVideoCreate", plan: planB, rootDir });
  check("different action for same topic is blocked by one topic lock", otherWhileActive.ok === false && otherWhileActive.reason === "automation_execution_topic_in_flight");

  const terminal = first.ok ? finishMoneyShortsAutomationExecution({
    handle: first.handle,
    resultStatus: "success",
    planAfter: planB,
    now: () => "2026-07-17T01:01:00.000Z",
  }) : null;
  check("terminal receipt is written before lock release", terminal?.status === "terminal" && terminal.resultStatus === "success" && first.ok && !existsSync(first.handle.lockPath));
  check("terminal receipt records recomputed plan fingerprint", terminal?.planAfterFingerprint === fingerprintMoneyShortsAutomationPlan(planB));

  const sameAfterSuccess = beginMoneyShortsAutomationExecution({ topicId, action: "flowMotionPrepare", plan: planA, rootDir });
  check("identical completed attempt never reruns", sameAfterSuccess.ok === false && sameAfterSuccess.reason === "automation_execution_identical_attempt_already_recorded");
  const inspection = inspectMoneyShortsAutomationExecution({ topicId, action: "flowMotionPrepare", plan: planA, rootDir });
  check("restart inspection sees terminal receipt", inspection.status === "identical_attempt_recorded" && inspection.receipt?.executionId === "execution-a");

  const nextPlan = beginMoneyShortsAutomationExecution({
    topicId,
    action: "finalVideoCreate",
    plan: planB,
    rootDir,
    executionId: "execution-b",
  });
  check("new plan fingerprint may acquire the released topic lock", nextPlan.ok === true);
  if (nextPlan.ok) {
    const blockedTerminal = finishMoneyShortsAutomationExecution({
      handle: nextPlan.handle,
      resultStatus: "blocked",
      blockerCode: "TEST_BLOCKER",
      planAfter: planB,
    });
    check("blocked result is terminal and content-addressed", blockedTerminal.resultStatus === "blocked" && blockedTerminal.blockerCode === "TEST_BLOCKER");
  }

  let unsafeRejected = false;
  try {
    beginMoneyShortsAutomationExecution({ topicId, action: "actualUpload", plan: planA, rootDir });
  } catch (error) {
    unsafeRejected = error instanceof Error && error.message === "automation_execution_action_not_safe";
  }
  check("paid or publication action cannot enter the store", unsafeRejected);
} finally {
  rmSync(rootDir, { recursive: true, force: true });
}

console.log(`\n${passed + failed} checks - ${passed} PASS, ${failed} FAIL`);
if (failed > 0) process.exit(1);
