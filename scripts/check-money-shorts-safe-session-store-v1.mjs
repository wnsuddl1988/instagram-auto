import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

import {
  MONEY_SHORTS_SAFE_SESSION_STORE_VERSION,
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

const rootDir = mkdtempSync(join(tmpdir(), "money-shorts-safe-session-"));
const sessionId = "owner-session-001";

try {
  check("session store schema is versioned", MONEY_SHORTS_SAFE_SESSION_STORE_VERSION === "money_shorts_safe_session_store_v1");
  const empty = readMoneyShortsSafeSessionStore({ rootDir });
  check("missing session store reconstructs empty state", empty.currentSession == null && empty.history.length === 0 && empty.updatedAt == null);

  const started = startMoneyShortsSafeSession({
    sessionId,
    maxActionCount: 2,
    rootDir,
    now: () => "2026-07-17T10:00:00.000Z",
    mutationId: "start-session",
  });
  check("Owner start persists bounded ready state only", started.currentSession?.sessionId === sessionId && started.currentSession?.status === "ready" && started.currentSession?.maxActionCount === 2 && started.currentSession?.completedActionCount === 0 && started.currentSession?.actionInFlight === false);
  check("start history records zero actions", started.history.at(-1)?.kind === "started" && started.history.at(-1)?.actionCount === 0);
  check("session mutation lock is released after start", !existsSync(join(rootDir, "session-mutation.lock.json")));

  const restarted = readMoneyShortsSafeSessionStore({ rootDir });
  check("session state survives a restart read", restarted.currentSession?.sessionId === sessionId && restarted.history.length === 1);

  const stopped = requestMoneyShortsSafeSessionStop({
    sessionId,
    rootDir,
    now: () => "2026-07-17T10:01:00.000Z",
    mutationId: "stop-session",
  });
  check("Owner stop request persists stop-after-current-action intent", stopped.currentSession?.status === "stop_requested" && stopped.currentSession?.stopRequestedAt === "2026-07-17T10:01:00.000Z");
  check("stop request records zero-action history", stopped.history.at(-1)?.kind === "stop_requested" && stopped.history.at(-1)?.actionCount === 0);
  const stoppedAgain = requestMoneyShortsSafeSessionStop({ sessionId, rootDir, mutationId: "stop-session-repeat" });
  check("repeated stop is idempotent and does not add history", stoppedAgain.history.length === stopped.history.length && stoppedAgain.currentSession?.status === "stop_requested");

  const raw = JSON.parse(readFileSync(join(rootDir, "session.json"), "utf8"));
  check("durable state contains no runner, receipt, timer, or schedule fields", !("nextClaim" in raw.currentSession) && !("receipt" in raw.currentSession) && !("runAt" in raw.currentSession) && !("timer" in raw.currentSession) && !("worker" in raw.currentSession));

  let duplicateRejected = false;
  try {
    startMoneyShortsSafeSession({ sessionId: "another-session", rootDir });
  } catch (error) {
    duplicateRejected = error instanceof Error && error.message === "safe_session_already_active";
  }
  check("another session cannot replace the active session", duplicateRejected);

  const capRoot = mkdtempSync(join(tmpdir(), "money-shorts-safe-session-cap-"));
  let capRejected = false;
  try {
    startMoneyShortsSafeSession({ sessionId: "cap-session", maxActionCount: 4, rootDir: capRoot });
  } catch (error) {
    capRejected = error instanceof Error && error.message === "safe_session_action_cap_invalid";
  } finally {
    rmSync(capRoot, { recursive: true, force: true });
  }
  check("cap above three is rejected", capRejected);

  const lockRoot = mkdtempSync(join(tmpdir(), "money-shorts-safe-session-lock-"));
  writeFileSync(join(lockRoot, "session-mutation.lock.json"), "{}\n", "utf8");
  let lockRejected = false;
  try {
    startMoneyShortsSafeSession({ sessionId: "locked-session", rootDir: lockRoot });
  } catch (error) {
    lockRejected = error instanceof Error && error.message === "safe_session_mutation_in_flight";
  }
  check("existing mutation lock fails closed", lockRejected);
  rmSync(lockRoot, { recursive: true, force: true });
} finally {
  rmSync(rootDir, { recursive: true, force: true });
}

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = readFileSync(join(root, "lib", "money-shorts-safe-session-store.mjs"), "utf8");
check("session store has no executor, network, timer, or schedule", !/node:child_process|\bfetch\s*\(|setTimeout|setInterval|runOneSafeAutomationAction|actualUpload|realTtsCreate|flowMotionGenerate/u.test(source));

console.log(`\n${passed + failed} checks - ${passed} PASS, ${failed} FAIL`);
if (failed > 0) process.exit(1);
