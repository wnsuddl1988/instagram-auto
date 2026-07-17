import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  MONEY_SHORTS_SAFE_SESSION_BOUNDED_RUNNER_VERSION,
  executeMoneyShortsSafeSessionBoundedRun,
} from "../lib/money-shorts-safe-session-bounded-runner.mjs";

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

const sessionId = "owner-session-bounded-001";
const hash = (character) => character.repeat(64);

function createHarness({
  maxActionCount = 3,
  completedActionCount = 0,
  status = "ready",
  actionInFlight = false,
  gateAfterActionCount = null,
  hostStatuses = [],
  hostThrowsAt = null,
} = {}) {
  const state = {
    sessionId,
    mode: "owner_started_bounded_local",
    status,
    maxActionCount,
    completedActionCount,
    actionInFlight,
    activeClaim: actionInFlight ? { claimFingerprint: hash("f") } : null,
  };
  const calls = [];
  let hostCallCount = 0;

  const coordinateSession = () => {
    const index = state.completedActionCount;
    if (
      state.status !== "ready" ||
      state.actionInFlight ||
      state.completedActionCount >= state.maxActionCount
    ) {
      return {
        state: "halted",
        reason: "session halted",
        sessionId,
        actionPlannedCount: 0,
        coordinatorFingerprint: hash("a"),
        queuePreviewFingerprint: hash("b"),
        nextClaim: null,
      };
    }
    if (gateAfterActionCount != null && index >= gateAfterActionCount) {
      return {
        state: "halted",
        reason: "Owner approval gate",
        sessionId,
        actionPlannedCount: 0,
        coordinatorFingerprint: hash("a"),
        queuePreviewFingerprint: hash("b"),
        nextClaim: null,
      };
    }
    const coordinatorFingerprint = hash(["a", "c", "e"][index] ?? "a");
    const queuePreviewFingerprint = hash(["b", "d", "f"][index] ?? "b");
    return {
      state: "ready",
      reason: "local safe action ready",
      sessionId,
      actionPlannedCount: 1,
      coordinatorFingerprint,
      queuePreviewFingerprint,
      nextClaim: {
        topicId: `topic-${index + 1}`,
        action: index % 2 === 0 ? "flowMotionPrepare" : "wizardPreflight",
      },
    };
  };

  const dependencies = {
    readSessionStore: () => ({
      schemaVersion: "money_shorts_safe_session_store_v1",
      currentSession: { ...state },
      history: [],
    }),
    readQueueView: () => ({
      runPreview: { previewFingerprint: hash("9") },
    }),
    coordinateSession,
    executeHostStep: (input) => {
      hostCallCount += 1;
      calls.push(input);
      if (hostThrowsAt === hostCallCount) {
        throw new Error("host_failed");
      }
      const resultStatus = hostStatuses[hostCallCount - 1] ?? "success";
      state.completedActionCount += 1;
      return {
        action: "safeSessionRunNext",
        status: resultStatus,
        summary: `host ${resultStatus}`,
        blockerCode: resultStatus === "success" ? undefined : "HOST_STOP",
        raw: {
          session: {
            schemaVersion: "money_shorts_safe_session_store_v1",
            currentSession: { ...state },
            history: [],
          },
          execution: {
            actionCount: 1,
            sessionActionCountDelta: 1,
            chainedActionCount: 0,
            automaticRetryCount: 0,
            localRenderExecuted: hostCallCount === 2,
          },
        },
      };
    },
  };

  return {
    input: {
      expectedSessionId: sessionId,
      expectedCoordinatorFingerprint: hash("a"),
      expectedQueuePreviewFingerprint: hash("b"),
      dependencies,
    },
    calls,
    state,
  };
}

check(
  "bounded runner contract is versioned",
  MONEY_SHORTS_SAFE_SESSION_BOUNDED_RUNNER_VERSION ===
    "money_shorts_safe_session_bounded_runner_v1",
);

const threeHarness = createHarness();
const three = executeMoneyShortsSafeSessionBoundedRun(threeHarness.input);
check(
  "Owner-started runner executes at most three current local-safe steps",
  three.status === "success" &&
    threeHarness.calls.length === 3 &&
    three.raw.execution.actionCount === 3 &&
    three.raw.execution.sessionActionCountDelta === 3 &&
    three.raw.execution.chainedActionCount === 2 &&
    three.raw.stopReason === "bounded_runner_limit_reached",
);
check(
  "every chained step uses freshly coordinated fingerprints",
  threeHarness.calls.map((call) => call.expectedCoordinatorFingerprint).join(",") ===
    [hash("a"), hash("c"), hash("e")].join(",") &&
    threeHarness.calls.map((call) => call.expectedQueuePreviewFingerprint).join(",") ===
      [hash("b"), hash("d"), hash("f")].join(","),
);
check(
  "bounded result keeps external authority and automatic retry disabled",
  three.raw.execution.automaticRetryCount === 0 &&
    three.raw.execution.paidActionExecuted === false &&
    three.raw.execution.externalGenerationExecuted === false &&
    three.raw.execution.ownerQaDecisionExecuted === false &&
    three.raw.execution.uploadExecuted === false &&
    three.raw.execution.publicationExecuted === false &&
    Object.entries(three.raw.safety)
      .filter(([key]) => !["ownerStarted", "maxBoundedActions"].includes(key))
      .every(([, value]) => value === false),
);

const remainingHarness = createHarness({
  maxActionCount: 2,
  completedActionCount: 1,
});
const remaining = executeMoneyShortsSafeSessionBoundedRun({
  ...remainingHarness.input,
  expectedCoordinatorFingerprint: hash("c"),
  expectedQueuePreviewFingerprint: hash("d"),
});
check(
  "existing session cap limits the run to its exact remaining count",
  remaining.status === "success" &&
    remainingHarness.calls.length === 1 &&
    remaining.raw.execution.actionCount === 1 &&
    remaining.raw.stopReason === "session_cap_reached",
);

const gateHarness = createHarness({ gateAfterActionCount: 1 });
const gate = executeMoneyShortsSafeSessionBoundedRun(gateHarness.input);
check(
  "Owner gate after a success stops without calling a second host step",
  gate.status === "success" &&
    gateHarness.calls.length === 1 &&
    gate.raw.execution.actionCount === 1 &&
    gate.raw.stopReason === "halted",
);

const blockedHarness = createHarness({
  hostStatuses: ["success", "blocked", "success"],
});
const blocked = executeMoneyShortsSafeSessionBoundedRun(blockedHarness.input);
check(
  "first non-success result stops the bounded run with no retry",
  blocked.status === "blocked" &&
    blockedHarness.calls.length === 2 &&
    blocked.raw.execution.actionCount === 2 &&
    blocked.raw.execution.chainedActionCount === 1 &&
    blocked.raw.execution.automaticRetryCount === 0 &&
    blocked.blockerCode === "HOST_STOP",
);

const driftHarness = createHarness();
const drift = executeMoneyShortsSafeSessionBoundedRun({
  ...driftHarness.input,
  expectedCoordinatorFingerprint: hash("8"),
});
check(
  "stale first displayed fingerprint stops before any host call",
  drift.status === "blocked" &&
    drift.blockerCode === "SAFE_SESSION_BOUNDED_FIRST_PLAN_DRIFTED" &&
    driftHarness.calls.length === 0 &&
    drift.raw.execution.actionCount === 0,
);

const inFlightHarness = createHarness({ actionInFlight: true });
const inFlight = executeMoneyShortsSafeSessionBoundedRun(inFlightHarness.input);
check(
  "in-flight or recovery claim blocks concurrent bounded execution",
  inFlight.status === "blocked" &&
    inFlight.blockerCode === "SAFE_SESSION_BOUNDED_SESSION_NOT_READY" &&
    inFlightHarness.calls.length === 0,
);

const thrownHarness = createHarness({ hostThrowsAt: 1 });
const thrown = executeMoneyShortsSafeSessionBoundedRun(thrownHarness.input);
check(
  "unexpected host failure stops without automatic retry",
  thrown.status === "error" &&
    thrown.blockerCode === "SAFE_SESSION_BOUNDED_HOST_THROWN" &&
    thrownHarness.calls.length === 1 &&
    thrown.raw.execution.actionCount === 0 &&
    thrown.raw.execution.automaticRetryCount === 0,
);

const invalid = executeMoneyShortsSafeSessionBoundedRun();
check(
  "invalid or missing Owner claim fails closed",
  invalid.status === "blocked" &&
    invalid.blockerCode === "SAFE_SESSION_BOUNDED_INPUT_INVALID" &&
    invalid.raw.execution.actionCount === 0,
);

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = readFileSync(
  join(root, "lib", "money-shorts-safe-session-bounded-runner.mjs"),
  "utf8",
);
check(
  "source has a hard three-step bound and no timer, worker, network, or retry API",
  source.includes("const MAX_BOUNDED_ACTIONS = 3") &&
    source.includes("stepIndex < MAX_BOUNDED_ACTIONS") &&
    !/setTimeout|setInterval|worker_threads|node:child_process|\bfetch\s*\(|automaticRetryCount:\s*[1-9]/u.test(source),
);

console.log(`\n${passed + failed} checks - ${passed} PASS, ${failed} FAIL`);
if (failed > 0) process.exit(1);
