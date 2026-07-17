import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  MONEY_SHORTS_SAFE_SESSION_STORE_VERSION,
  beginMoneyShortsSafeSessionAction,
  fingerprintMoneyShortsSafeSessionClaim,
  finishMoneyShortsSafeSessionAction,
  readMoneyShortsSafeSessionStore,
  requestMoneyShortsSafeSessionStop,
  startMoneyShortsSafeSession,
} from "../lib/money-shorts-safe-session-store.mjs";

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

const coordinatorFingerprint = "a".repeat(64);
const queuePreviewFingerprint = "b".repeat(64);
const planFingerprint = "c".repeat(64);
const claim = {
  previewFingerprint: queuePreviewFingerprint,
  jobId: "job-session-topic-001",
  topicId: "session-topic-001",
  action: "flowMotionPrepare",
  planFingerprint,
};

function begin(rootDir, sessionId = "owner-session-001", overrides = {}) {
  return beginMoneyShortsSafeSessionAction({
    sessionId,
    coordinatorFingerprint,
    queuePreviewFingerprint,
    claim,
    rootDir,
    now: () => "2026-07-17T13:01:00.000Z",
    mutationId: "begin-action",
    ...overrides,
  });
}

const legacyRoot = mkdtempSync(join(tmpdir(), "money-shorts-safe-session-legacy-"));
try {
  writeFileSync(join(legacyRoot, "session.json"), `${JSON.stringify({
    schemaVersion: MONEY_SHORTS_SAFE_SESSION_STORE_VERSION,
    updatedAt: "2026-07-17T12:00:00.000Z",
    currentSession: {
      schemaVersion: MONEY_SHORTS_SAFE_SESSION_STORE_VERSION,
      sessionId: "legacy-session",
      mode: "owner_started_bounded_local",
      status: "ready",
      maxActionCount: 2,
      completedActionCount: 0,
      actionInFlight: false,
      startedAt: "2026-07-17T12:00:00.000Z",
      updatedAt: "2026-07-17T12:00:00.000Z",
      stopRequestedAt: null,
    },
    history: [],
  }, null, 2)}\n`, "utf8");
  const legacy = readMoneyShortsSafeSessionStore({ rootDir: legacyRoot });
  check("legacy v1 session normalizes missing lifecycle evidence", legacy.currentSession?.activeClaim === null && legacy.currentSession?.lastTerminalResult === null);
} finally {
  rmSync(legacyRoot, { recursive: true, force: true });
}

const rootDir = mkdtempSync(join(tmpdir(), "money-shorts-safe-session-lifecycle-"));
const sessionId = "owner-session-001";
try {
  const started = startMoneyShortsSafeSession({
    sessionId,
    maxActionCount: 2,
    rootDir,
    now: () => "2026-07-17T13:00:00.000Z",
    mutationId: "start-session",
  });
  check("new session initializes empty lifecycle evidence", started.currentSession?.activeClaim === null && started.currentSession?.lastTerminalResult === null);

  const expectedClaimFingerprint = fingerprintMoneyShortsSafeSessionClaim({
    sessionId,
    coordinatorFingerprint,
    queuePreviewFingerprint,
    claim,
  });
  const begun = begin(rootDir);
  check("begin atomically records the exact claim evidence", begun.currentSession?.actionInFlight === true && begun.currentSession?.activeClaim?.claimFingerprint === expectedClaimFingerprint && begun.currentSession?.activeClaim?.previewFingerprint === queuePreviewFingerprint && begun.currentSession?.activeClaim?.planFingerprint === planFingerprint);
  check("begin history records no completed action", begun.history.at(-1)?.kind === "action_started" && begun.history.at(-1)?.actionCount === 0);

  rejectsWith("a second begin is blocked while one claim is active", "safe_session_action_in_flight", () => begin(rootDir, sessionId, { mutationId: "begin-again" }));
  const afterSecondBegin = readMoneyShortsSafeSessionStore({ rootDir });
  check("blocked second begin preserves the original claim", afterSecondBegin.currentSession?.activeClaim?.claimFingerprint === expectedClaimFingerprint && afterSecondBegin.currentSession?.completedActionCount === 0);

  const stopped = requestMoneyShortsSafeSessionStop({
    sessionId,
    rootDir,
    now: () => "2026-07-17T13:02:00.000Z",
    mutationId: "stop-during-action",
  });
  check("Owner stop during an action preserves the active claim", stopped.currentSession?.status === "stop_requested" && stopped.currentSession?.actionInFlight === true && stopped.currentSession?.activeClaim?.claimFingerprint === expectedClaimFingerprint);

  const finished = finishMoneyShortsSafeSessionAction({
    sessionId,
    claimFingerprint: expectedClaimFingerprint,
    resultStatus: "success",
    blockerCode: null,
    actionCount: 1,
    rootDir,
    now: () => "2026-07-17T13:03:00.000Z",
    mutationId: "finish-action",
  });
  check("matching finish increments exactly once and clears the claim", finished.currentSession?.completedActionCount === 1 && finished.currentSession?.actionInFlight === false && finished.currentSession?.activeClaim === null);
  check("finish preserves a stop requested during the action", finished.currentSession?.status === "stop_requested" && finished.currentSession?.stopRequestedAt === "2026-07-17T13:02:00.000Z");
  check("terminal evidence records one attempted action", finished.currentSession?.lastTerminalResult?.claimFingerprint === expectedClaimFingerprint && finished.currentSession?.lastTerminalResult?.resultStatus === "success" && finished.currentSession?.lastTerminalResult?.actionCount === 1 && finished.history.at(-1)?.actionCount === 1);

  const repeated = finishMoneyShortsSafeSessionAction({
    sessionId,
    claimFingerprint: expectedClaimFingerprint,
    resultStatus: "success",
    actionCount: 1,
    rootDir,
    now: () => "2026-07-17T13:04:00.000Z",
    mutationId: "finish-repeat",
  });
  check("exact repeated finish is idempotent", repeated.currentSession?.completedActionCount === 1 && repeated.history.length === finished.history.length && repeated.updatedAt === finished.updatedAt);
  rejectsWith("same claim cannot be rewritten with a different terminal result", "safe_session_terminal_result_mismatch", () => finishMoneyShortsSafeSessionAction({
    sessionId,
    claimFingerprint: expectedClaimFingerprint,
    resultStatus: "blocked",
    blockerCode: "different_result",
    rootDir,
    mutationId: "finish-mismatch-after-terminal",
  }));
} finally {
  rmSync(rootDir, { recursive: true, force: true });
}

const mismatchRoot = mkdtempSync(join(tmpdir(), "money-shorts-safe-session-mismatch-"));
try {
  startMoneyShortsSafeSession({ sessionId: "mismatch-session", maxActionCount: 1, rootDir: mismatchRoot, mutationId: "start-mismatch" });
  const begun = begin(mismatchRoot, "mismatch-session", { mutationId: "begin-mismatch" });
  rejectsWith("mismatched finish evidence fails closed", "safe_session_claim_mismatch", () => finishMoneyShortsSafeSessionAction({
    sessionId: "mismatch-session",
    claimFingerprint: "d".repeat(64),
    resultStatus: "error",
    blockerCode: "handler_failed",
    rootDir: mismatchRoot,
    mutationId: "finish-wrong-claim",
  }));
  const afterMismatch = readMoneyShortsSafeSessionStore({ rootDir: mismatchRoot });
  check("mismatched finish keeps the action locked without counting it", afterMismatch.currentSession?.actionInFlight === true && afterMismatch.currentSession?.activeClaim?.claimFingerprint === begun.currentSession?.activeClaim?.claimFingerprint && afterMismatch.currentSession?.completedActionCount === 0);
  rejectsWith("zero-action terminal evidence cannot finish a claim", "safe_session_terminal_action_count_invalid", () => finishMoneyShortsSafeSessionAction({
    sessionId: "mismatch-session",
    claimFingerprint: begun.currentSession.activeClaim.claimFingerprint,
    resultStatus: "success",
    actionCount: 0,
    rootDir: mismatchRoot,
    mutationId: "finish-zero-action",
  }));
} finally {
  rmSync(mismatchRoot, { recursive: true, force: true });
}

const capRoot = mkdtempSync(join(tmpdir(), "money-shorts-safe-session-lifecycle-cap-"));
try {
  startMoneyShortsSafeSession({ sessionId: "cap-session", maxActionCount: 1, rootDir: capRoot, mutationId: "start-cap" });
  const begun = begin(capRoot, "cap-session", { mutationId: "begin-cap" });
  finishMoneyShortsSafeSessionAction({
    sessionId: "cap-session",
    claimFingerprint: begun.currentSession.activeClaim.claimFingerprint,
    resultStatus: "blocked",
    blockerCode: "execution_guard_blocked",
    rootDir: capRoot,
    mutationId: "finish-cap",
  });
  rejectsWith("session cap blocks another claim", "safe_session_action_cap_reached", () => begin(capRoot, "cap-session", { mutationId: "begin-over-cap" }));
} finally {
  rmSync(capRoot, { recursive: true, force: true });
}

const validationRoot = mkdtempSync(join(tmpdir(), "money-shorts-safe-session-validation-"));
try {
  startMoneyShortsSafeSession({ sessionId: "validation-session", rootDir: validationRoot, mutationId: "start-validation" });
  rejectsWith("unsafe actions are rejected before persistence", "safe_session_claim_action_unsafe", () => begin(validationRoot, "validation-session", {
    claim: { ...claim, action: "flowMotionGenerate" },
    mutationId: "unsafe-action",
  }));
  rejectsWith("invalid coordinator hashes are rejected", "safe_session_coordinator_fingerprint_invalid", () => begin(validationRoot, "validation-session", {
    coordinatorFingerprint: "not-a-hash",
    mutationId: "invalid-coordinator",
  }));
  rejectsWith("claim and queue preview hashes must match", "safe_session_claim_preview_mismatch", () => begin(validationRoot, "validation-session", {
    claim: { ...claim, previewFingerprint: "e".repeat(64) },
    mutationId: "preview-mismatch",
  }));
  const untouched = readMoneyShortsSafeSessionStore({ rootDir: validationRoot });
  check("validation failures leave session intent untouched", untouched.currentSession?.actionInFlight === false && untouched.currentSession?.completedActionCount === 0 && untouched.history.length === 1);
} finally {
  rmSync(validationRoot, { recursive: true, force: true });
}

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = readFileSync(join(root, "lib", "money-shorts-safe-session-store.mjs"), "utf8");
check("lifecycle store cannot execute, network, retry, schedule, or publish", !/node:child_process|\bfetch\s*\(|setTimeout|setInterval|executeMoneyShortsBoundedAutomationStep|dispatchMoneyShortsSafeAutomationAction|beginMoneyShortsAutomationExecution|finishMoneyShortsAutomationExecution|syncMoneyShortsAutomationJob|actualUpload|realTtsCreate|realSceneImagesCreate|flowMotionGenerate/u.test(source));

console.log(`\n${passed + failed} checks - ${passed} PASS, ${failed} FAIL`);
if (failed > 0) process.exit(1);
