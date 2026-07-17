import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { readFileSync } from "node:fs";

import {
  beginMoneyShortsSafeSessionAction,
  closeMoneyShortsSafeSession,
  finishMoneyShortsSafeSessionAction,
  readMoneyShortsSafeSessionCloseView,
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

const rootDir = mkdtempSync(join(tmpdir(), "money-shorts-safe-session-close-"));
const hash = (char) => char.repeat(64);

try {
  const started = startMoneyShortsSafeSession({
    sessionId: "close-ready-session",
    maxActionCount: 2,
    rootDir,
    now: () => "2026-07-17T11:00:00.000Z",
    mutationId: "close-ready-start",
  });
  const readyClose = readMoneyShortsSafeSessionCloseView(started);
  check("ready session cannot be archive-closed", readyClose.eligible === false && readyClose.reasonCode === "safe_session_not_terminal");

  let readyRejected = false;
  try {
    closeMoneyShortsSafeSession({
      sessionId: "close-ready-session",
      expectedCloseFingerprint: hash("a"),
      rootDir,
    });
  } catch (error) {
    readyRejected = error instanceof Error && error.message === "safe_session_not_terminal";
  }
  check("nonterminal close preserves the session", readyRejected && readMoneyShortsSafeSessionStore({ rootDir }).currentSession?.sessionId === "close-ready-session");

  const stopped = requestMoneyShortsSafeSessionStop({
    sessionId: "close-ready-session",
    rootDir,
    now: () => "2026-07-17T11:01:00.000Z",
    mutationId: "close-ready-stop",
  });
  const stopClose = readMoneyShortsSafeSessionCloseView(stopped);
  check("stopped no-claim session exposes a close fingerprint", stopClose.eligible === true && stopClose.closeReason === "stop_requested" && typeof stopClose.closeFingerprint === "string");

  let staleRejected = false;
  try {
    closeMoneyShortsSafeSession({
      sessionId: "close-ready-session",
      expectedCloseFingerprint: hash("b"),
      rootDir,
    });
  } catch (error) {
    staleRejected = error instanceof Error && error.message === "safe_session_close_evidence_mismatch";
  }
  check("stale close fingerprint leaves terminal session intact", staleRejected && readMoneyShortsSafeSessionStore({ rootDir }).currentSession?.status === "stop_requested");

  const closed = closeMoneyShortsSafeSession({
    sessionId: "close-ready-session",
    expectedCloseFingerprint: stopClose.closeFingerprint,
    rootDir,
    now: () => "2026-07-17T11:02:00.000Z",
    mutationId: "close-ready-close",
  });
  const archived = closed.history.at(-1);
  check("eligible stop archives a bounded terminal summary then clears current session", closed.currentSession === null && archived?.kind === "closed" && archived?.sessionId === "close-ready-session" && archived?.actionCount === 0 && archived?.closeReason === "stop_requested");

  const closedRepeat = closeMoneyShortsSafeSession({
    sessionId: "close-ready-session",
    expectedCloseFingerprint: stopClose.closeFingerprint,
    rootDir,
    mutationId: "close-ready-repeat",
  });
  check("same archive-close request is idempotent", closedRepeat.history.length === closed.history.length && closedRepeat.currentSession === null);

  const restarted = startMoneyShortsSafeSession({
    sessionId: "cap-close-session",
    maxActionCount: 1,
    rootDir,
    now: () => "2026-07-17T11:03:00.000Z",
    mutationId: "cap-close-start",
  });
  const claimed = beginMoneyShortsSafeSessionAction({
    sessionId: "cap-close-session",
    coordinatorFingerprint: hash("c"),
    queuePreviewFingerprint: hash("d"),
    claim: {
      previewFingerprint: hash("d"),
      jobId: "cap-close-job",
      topicId: "cap-close-topic",
      action: "wizardPreflight",
      planFingerprint: hash("e"),
    },
    rootDir,
    now: () => "2026-07-17T11:04:00.000Z",
    mutationId: "cap-close-claim",
  });
  const activeClose = readMoneyShortsSafeSessionCloseView(claimed);
  check("active claim cannot be archive-closed", activeClose.eligible === false && activeClose.reasonCode === "safe_session_action_in_flight");

  const terminal = finishMoneyShortsSafeSessionAction({
    sessionId: "cap-close-session",
    claimFingerprint: claimed.currentSession?.activeClaim?.claimFingerprint,
    resultStatus: "success",
    rootDir,
    now: () => "2026-07-17T11:05:00.000Z",
    mutationId: "cap-close-finish",
  });
  const capClose = readMoneyShortsSafeSessionCloseView(terminal);
  check("completed cap exposes archive-close view", capClose.eligible === true && capClose.closeReason === "action_cap_reached" && terminal.currentSession?.completedActionCount === 1);

  const capClosed = closeMoneyShortsSafeSession({
    sessionId: "cap-close-session",
    expectedCloseFingerprint: capClose.closeFingerprint,
    rootDir,
    now: () => "2026-07-17T11:06:00.000Z",
    mutationId: "cap-close-close",
  });
  check("cap close preserves terminal result summary", capClosed.currentSession === null && capClosed.history.at(-1)?.lastTerminalResult?.resultStatus === "success" && capClosed.history.at(-1)?.closeReason === "action_cap_reached");

  check("closed session permits a fresh bounded session", restarted.currentSession?.sessionId === "cap-close-session" && startMoneyShortsSafeSession({
    sessionId: "fresh-after-close",
    maxActionCount: 1,
    rootDir,
    mutationId: "fresh-after-close",
  }).currentSession?.sessionId === "fresh-after-close");
} finally {
  rmSync(rootDir, { recursive: true, force: true });
}

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = readFileSync(join(root, "lib", "money-shorts-safe-session-store.mjs"), "utf8");
check("archive close has no executor, network, timer, retry, or external action", source.includes("closeMoneyShortsSafeSession") && !/node:child_process|\bfetch\s*\(|setTimeout|setInterval|executeMoneyShortsBoundedAutomationStep|actualUpload|realTtsCreate|flowMotionGenerate/u.test(source));

console.log(`\n${passed + failed} checks - ${passed} PASS, ${failed} FAIL`);
if (failed > 0) process.exit(1);
