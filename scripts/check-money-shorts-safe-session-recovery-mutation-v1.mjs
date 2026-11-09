import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { fingerprintMoneyShortsAutomationPlan } from "../lib/money-shorts-automation-execution-store.mjs";
import { planMoneyShortsAutomationQueueRun } from "../lib/money-shorts-automation-queue-planner.mjs";
import { planMoneyShortsSafeSessionRecovery } from "../lib/money-shorts-safe-session-recovery.mjs";
import {
  beginMoneyShortsSafeSessionAction,
  readMoneyShortsSafeSessionStore,
  resolveMoneyShortsSafeSessionRecovery,
  startMoneyShortsSafeSession,
} from "../lib/money-shorts-safe-session-store.mjs";
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

function rejectsWith(name, expectedMessage, callback) {
  let matched = false;
  try {
    callback();
  } catch (error) {
    matched = error instanceof Error && error.message === expectedMessage;
  }
  check(name, matched);
}

function createFixture({ sessionId, maxActionCount = 2 } = {}) {
  const topicId = `${sessionId}-topic`;
  const jobId = `job-${topicId}`;
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
  const planBefore = buildMoneyShortsResumablePlan(base);
  const planAfter = buildMoneyShortsResumablePlan({
    ...base,
    flowState: "render_ready",
    flowReadyForRender: true,
  });
  const planBeforeFingerprint = fingerprintMoneyShortsAutomationPlan(planBefore);
  const planAfterFingerprint = fingerprintMoneyShortsAutomationPlan(planAfter);
  const availableGuard = { status: "available", receipt: null, recovery: { status: "none" } };
  const runPreview = planMoneyShortsAutomationQueueRun({ jobs: [{
    jobId,
    topicId,
    title: "Recovery mutation fixture",
    queueOrder: 1,
    createdAt: "2026-07-17T15:00:00.000Z",
    livePlan: planBefore,
    executionGuard: availableGuard,
    lifecycle: { status: "active" },
  }] });
  const rootDir = mkdtempSync(join(tmpdir(), "money-shorts-safe-session-recovery-mutation-"));
  startMoneyShortsSafeSession({
    sessionId,
    maxActionCount,
    rootDir,
    now: () => "2026-07-17T15:00:00.000Z",
    mutationId: `start-${sessionId}`,
  });
  beginMoneyShortsSafeSessionAction({
    sessionId,
    coordinatorFingerprint: "a".repeat(64),
    queuePreviewFingerprint: runPreview.previewFingerprint,
    claim: {
      previewFingerprint: runPreview.previewFingerprint,
      jobId,
      topicId,
      action: planBefore.next.action,
      planFingerprint: planBeforeFingerprint,
    },
    rootDir,
    now: () => "2026-07-17T15:01:00.000Z",
    mutationId: `begin-${sessionId}`,
  });
  return {
    sessionId,
    topicId,
    jobId,
    rootDir,
    planBefore,
    planAfter,
    planBeforeFingerprint,
    planAfterFingerprint,
    availableGuard,
    runPreview,
  };
}

function unstartedRecoveryPlan(fixture, sessionStore = readMoneyShortsSafeSessionStore({ rootDir: fixture.rootDir })) {
  return planMoneyShortsSafeSessionRecovery({
    sessionStore,
    currentPlan: fixture.planBefore,
    runPreview: fixture.runPreview,
    claimExecutionGuard: fixture.availableGuard,
  });
}

function terminalReceipt(fixture, overrides = {}) {
  return {
    executionId: `execution-${fixture.sessionId}`,
    topicId: fixture.topicId,
    action: fixture.planBefore.next.action,
    planFingerprint: fixture.planBeforeFingerprint,
    status: "terminal",
    resultStatus: "success",
    blockerCode: null,
    planAfterFingerprint: fixture.planAfterFingerprint,
    planBefore: { completedStageCount: fixture.planBefore.completedStageCount },
    manualRetryAllowed: false,
    ...overrides,
  };
}

const clearFixture = createFixture({ sessionId: "clear-recovery-session" });
try {
  const preview = unstartedRecoveryPlan(clearFixture);
  let recomputeCount = 0;
  let lockSeenDuringRecompute = false;
  const cleared = resolveMoneyShortsSafeSessionRecovery({
    sessionId: clearFixture.sessionId,
    expectedRecoveryFingerprint: preview.recoveryFingerprint,
    decision: "clear_unstarted_session_claim",
    recomputeRecoveryPlan: (lockedStore) => {
      recomputeCount += 1;
      lockSeenDuringRecompute = existsSync(join(clearFixture.rootDir, "session-mutation.lock.json"));
      return unstartedRecoveryPlan(clearFixture, lockedStore);
    },
    rootDir: clearFixture.rootDir,
    now: () => "2026-07-17T15:02:00.000Z",
    mutationId: "resolve-clear",
  });
  check("recovery evidence is recomputed exactly once while mutation lock is held", recomputeCount === 1 && lockSeenDuringRecompute === true);
  check("proven unstarted claim clears without increment and forces halt", cleared.currentSession?.status === "stop_requested" && cleared.currentSession?.actionInFlight === false && cleared.currentSession?.activeClaim === null && cleared.currentSession?.completedActionCount === 0);
  check("clear recovery persists exact bounded evidence", cleared.currentSession?.lastRecoveryResult?.recoveryFingerprint === preview.recoveryFingerprint && cleared.currentSession?.lastRecoveryResult?.decision === "clear_unstarted_session_claim" && cleared.currentSession?.lastRecoveryResult?.actionCountDelta === 0 && cleared.currentSession?.lastRecoveryResult?.sessionDisposition === "halt_after_clear");
  check("clear recovery records a zero-count history event", cleared.history.at(-1)?.kind === "action_recovery_cleared" && cleared.history.at(-1)?.actionCount === 0);

  let repeatedRecomputeCalled = false;
  const repeated = resolveMoneyShortsSafeSessionRecovery({
    sessionId: clearFixture.sessionId,
    expectedRecoveryFingerprint: preview.recoveryFingerprint,
    decision: "clear_unstarted_session_claim",
    recomputeRecoveryPlan: () => {
      repeatedRecomputeCalled = true;
      throw new Error("should_not_recompute_after_exact_resolution");
    },
    rootDir: clearFixture.rootDir,
    mutationId: "resolve-clear-repeat",
  });
  check("exact repeated recovery is idempotent without recomputing stale evidence", repeatedRecomputeCalled === false && repeated.history.length === cleared.history.length && repeated.currentSession?.completedActionCount === 0);
  rejectsWith("same recovery fingerprint cannot be rewritten with another decision", "safe_session_recovery_result_mismatch", () => resolveMoneyShortsSafeSessionRecovery({
    sessionId: clearFixture.sessionId,
    expectedRecoveryFingerprint: preview.recoveryFingerprint,
    decision: "terminalize_session_from_receipt",
    recomputeRecoveryPlan: () => preview,
    rootDir: clearFixture.rootDir,
    mutationId: "resolve-clear-result-mismatch",
  }));
} finally {
  rmSync(clearFixture.rootDir, { recursive: true, force: true });
}

const terminalFixture = createFixture({ sessionId: "terminal-recovery-session", maxActionCount: 1 });
try {
  const recoveryInput = (sessionStore) => planMoneyShortsSafeSessionRecovery({
    sessionStore,
    currentPlan: terminalFixture.planAfter,
    claimExecutionGuard: {
      status: "identical_attempt_recorded",
      receipt: terminalReceipt(terminalFixture),
    },
  });
  const preview = recoveryInput(readMoneyShortsSafeSessionStore({ rootDir: terminalFixture.rootDir }));
  const resolved = resolveMoneyShortsSafeSessionRecovery({
    sessionId: terminalFixture.sessionId,
    expectedRecoveryFingerprint: preview.recoveryFingerprint,
    decision: "terminalize_session_from_receipt",
    recomputeRecoveryPlan: recoveryInput,
    rootDir: terminalFixture.rootDir,
    now: () => "2026-07-17T15:03:00.000Z",
    mutationId: "resolve-terminal",
  });
  check("matching terminal receipt increments exactly once and clears claim", resolved.currentSession?.completedActionCount === 1 && resolved.currentSession?.actionInFlight === false && resolved.currentSession?.activeClaim === null);
  check("terminal recovery preserves exact receipt result", resolved.currentSession?.lastTerminalResult?.resultStatus === "success" && resolved.currentSession?.lastTerminalResult?.actionCount === 1 && resolved.currentSession?.lastTerminalResult?.recoveryFingerprint === preview.recoveryFingerprint);
  check("terminal recovery records one-count bounded history", resolved.history.at(-1)?.kind === "action_recovery_terminalized" && resolved.history.at(-1)?.actionCount === 1);
  const repeated = resolveMoneyShortsSafeSessionRecovery({
    sessionId: terminalFixture.sessionId,
    expectedRecoveryFingerprint: preview.recoveryFingerprint,
    decision: "terminalize_session_from_receipt",
    recomputeRecoveryPlan: () => { throw new Error("should_not_recompute"); },
    rootDir: terminalFixture.rootDir,
    mutationId: "resolve-terminal-repeat",
  });
  check("terminal recovery retry cannot double count", repeated.currentSession?.completedActionCount === 1 && repeated.history.length === resolved.history.length);
} finally {
  rmSync(terminalFixture.rootDir, { recursive: true, force: true });
}

const mismatchFixture = createFixture({ sessionId: "mismatch-recovery-session" });
try {
  const actualPlan = unstartedRecoveryPlan(mismatchFixture);
  rejectsWith("stale expected recovery fingerprint leaves claim locked", "safe_session_recovery_evidence_or_decision_mismatch", () => resolveMoneyShortsSafeSessionRecovery({
    sessionId: mismatchFixture.sessionId,
    expectedRecoveryFingerprint: "f".repeat(64),
    decision: "clear_unstarted_session_claim",
    recomputeRecoveryPlan: (lockedStore) => unstartedRecoveryPlan(mismatchFixture, lockedStore),
    rootDir: mismatchFixture.rootDir,
    mutationId: "resolve-wrong-fingerprint",
  }));
  const afterWrongFingerprint = readMoneyShortsSafeSessionStore({ rootDir: mismatchFixture.rootDir });
  check("fingerprint mismatch preserves active claim and zero count", afterWrongFingerprint.currentSession?.actionInFlight === true && afterWrongFingerprint.currentSession?.activeClaim != null && afterWrongFingerprint.currentSession?.completedActionCount === 0);

  rejectsWith("evidence drift discovered under lock leaves claim locked", "safe_session_recovery_evidence_or_decision_mismatch", () => resolveMoneyShortsSafeSessionRecovery({
    sessionId: mismatchFixture.sessionId,
    expectedRecoveryFingerprint: actualPlan.recoveryFingerprint,
    decision: "clear_unstarted_session_claim",
    recomputeRecoveryPlan: (lockedStore) => planMoneyShortsSafeSessionRecovery({
      sessionStore: lockedStore,
      currentPlan: mismatchFixture.planBefore,
      runPreview: planMoneyShortsAutomationQueueRun({ jobs: [] }),
      claimExecutionGuard: mismatchFixture.availableGuard,
    }),
    rootDir: mismatchFixture.rootDir,
    mutationId: "resolve-drift-under-lock",
  }));
  const afterDrift = readMoneyShortsSafeSessionStore({ rootDir: mismatchFixture.rootDir });
  check("drift rejection releases mutation lock but keeps action fail-closed", !existsSync(join(mismatchFixture.rootDir, "session-mutation.lock.json")) && afterDrift.currentSession?.actionInFlight === true && afterDrift.currentSession?.completedActionCount === 0);
} finally {
  rmSync(mismatchFixture.rootDir, { recursive: true, force: true });
}

const chainFixture = createFixture({ sessionId: "chain-recovery-session" });
try {
  const activeStore = readMoneyShortsSafeSessionStore({ rootDir: chainFixture.rootDir });
  const inProgressReceipt = terminalReceipt(chainFixture, {
    status: "in_progress",
    resultStatus: null,
    planAfterFingerprint: null,
  });
  const chainPlan = planMoneyShortsSafeSessionRecovery({
    sessionStore: activeStore,
    currentPlan: chainFixture.planBefore,
    claimExecutionGuard: { status: "manual_review_required", receipt: inProgressReceipt },
    executionRecovery: {
      status: "decision_required",
      comparison: "current_plan_unchanged",
      allowedDecision: "clear_for_manual_retry",
      currentPlanFingerprint: chainFixture.planBeforeFingerprint,
      beforeCompletedStageCount: chainFixture.planBefore.completedStageCount,
      currentCompletedStageCount: chainFixture.planBefore.completedStageCount,
      receipt: inProgressReceipt,
    },
  });
  rejectsWith("chain recovery must resolve execution receipt before session mutation", "safe_session_recovery_execution_resolution_required", () => resolveMoneyShortsSafeSessionRecovery({
    sessionId: chainFixture.sessionId,
    expectedRecoveryFingerprint: chainPlan.recoveryFingerprint,
    decision: "resolve_execution_then_clear_session_claim",
    recomputeRecoveryPlan: () => chainPlan,
    rootDir: chainFixture.rootDir,
    mutationId: "resolve-chain-directly",
  }));
  rejectsWith("a direct decision cannot bypass a pending execution recovery", "safe_session_recovery_evidence_or_decision_mismatch", () => resolveMoneyShortsSafeSessionRecovery({
    sessionId: chainFixture.sessionId,
    expectedRecoveryFingerprint: chainPlan.recoveryFingerprint,
    decision: "clear_unstarted_session_claim",
    recomputeRecoveryPlan: () => chainPlan,
    rootDir: chainFixture.rootDir,
    mutationId: "resolve-chain-bypass",
  }));
  const unchanged = readMoneyShortsSafeSessionStore({ rootDir: chainFixture.rootDir });
  check("pending execution recovery never mutates session count or claim", unchanged.currentSession?.actionInFlight === true && unchanged.currentSession?.activeClaim != null && unchanged.currentSession?.completedActionCount === 0 && unchanged.currentSession?.lastRecoveryResult == null);
} finally {
  rmSync(chainFixture.rootDir, { recursive: true, force: true });
}

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = readFileSync(join(root, "lib", "money-shorts-safe-session-store.mjs"), "utf8");
check("atomic recovery mutation has no dispatcher, network, timer, retry, paid action, render, upload, or publication path", source.includes("resolveMoneyShortsSafeSessionRecovery") && source.includes("recomputeRecoveryPlan(structuredClone(store))") && !/node:child_process|\bfetch\s*\(|setTimeout|setInterval|executeMoneyShortsBoundedAutomationStep|dispatchMoneyShortsSafeAutomationAction|beginMoneyShortsAutomationExecution|finishMoneyShortsAutomationExecution|resolveMoneyShortsAutomationRecovery|realTtsCreate|realSceneImagesCreate|flowMotionGenerate|finalVideoCreate|actualUpload/u.test(source));

console.log(`\n${passed + failed} checks - ${passed} PASS, ${failed} FAIL`);
if (failed > 0) process.exit(1);
