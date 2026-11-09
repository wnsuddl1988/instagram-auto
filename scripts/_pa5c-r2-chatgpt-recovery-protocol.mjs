import crypto from "crypto";
import fs from "fs";
import path from "path";

export const RECOVERY_STATES = Object.freeze([
  "PREPARED",
  "SUBMITTED",
  "CONVERSATION_BOUND",
  "RESULT_PENDING",
  "RESULT_RECOVERED",
  "VISIBLE_ERROR",
  "ORPHANED",
  "UNKNOWN",
]);

const NEXT_STATES = Object.freeze({
  PREPARED: new Set(["SUBMITTED", "UNKNOWN"]),
  SUBMITTED: new Set(["CONVERSATION_BOUND", "UNKNOWN"]),
  CONVERSATION_BOUND: new Set(["RESULT_PENDING", "RESULT_RECOVERED", "VISIBLE_ERROR", "ORPHANED", "UNKNOWN"]),
  RESULT_PENDING: new Set(["RESULT_RECOVERED", "VISIBLE_ERROR", "ORPHANED", "UNKNOWN"]),
  RESULT_RECOVERED: new Set(),
  VISIBLE_ERROR: new Set(),
  ORPHANED: new Set(),
  UNKNOWN: new Set(),
});

export function sha256(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function readRecoveryRecord(recordPath) {
  const record = JSON.parse(fs.readFileSync(recordPath, "utf8"));
  const state = record.state ?? (record.status === "SUBMITTED" ? "SUBMITTED" : null);
  if (!RECOVERY_STATES.includes(state)) throw new Error(`RECOVERY_STATE_INVALID:${state}`);
  return { ...record, state, stateHistory: Array.isArray(record.stateHistory) ? record.stateHistory : [] };
}

export function transition(record, nextState, observation = {}) {
  if (!RECOVERY_STATES.includes(nextState)) throw new Error(`RECOVERY_NEXT_STATE_INVALID:${nextState}`);
  if (record.state !== nextState && !NEXT_STATES[record.state]?.has(nextState)) {
    throw new Error(`RECOVERY_ILLEGAL_TRANSITION:${record.state}->${nextState}`);
  }
  const observedAt = new Date().toISOString();
  return {
    ...record,
    state: nextState,
    status: nextState,
    lastObservedAt: observedAt,
    stateHistory: [...record.stateHistory, { state: nextState, observedAt, ...observation }],
  };
}

export function persistRecoveryRecord(recordPath, record) {
  const directory = path.dirname(recordPath);
  fs.mkdirSync(directory, { recursive: true });
  const tempPath = `${recordPath}.${process.pid}.tmp`;
  fs.writeFileSync(tempPath, `${JSON.stringify(record, null, 2)}\n`, "utf8");
  fs.renameSync(tempPath, recordPath);
}

export function visibleConversationClassification(snapshot) {
  if (!snapshot.userMessagePresent) return "USER_MESSAGE_NOT_PRESENT";
  if (snapshot.generatedImageCount > 0) return "RESULT_COMPLETE";
  if (snapshot.visibleError) return "VISIBLE_ERROR";
  if (snapshot.pending) return "GENERATION_STILL_PENDING";
  if (snapshot.assistantMessageCount === 0) return "USER_MESSAGE_ONLY_NO_ASSISTANT_RESULT";
  return "UNKNOWN";
}

export function transitionForClassification(record, classification, observation) {
  let next = record;
  if (next.state === "SUBMITTED") next = transition(next, "CONVERSATION_BOUND", observation);
  if (classification === "RESULT_COMPLETE") return transition(next, "RESULT_RECOVERED", observation);
  if (classification === "VISIBLE_ERROR") return transition(next, "VISIBLE_ERROR", observation);
  if (classification === "USER_MESSAGE_ONLY_NO_ASSISTANT_RESULT") {
    if (next.state === "CONVERSATION_BOUND") next = transition(next, "RESULT_PENDING", observation);
    return transition(next, "ORPHANED", observation);
  }
  if (classification === "GENERATION_STILL_PENDING") {
    return next.state === "CONVERSATION_BOUND" ? transition(next, "RESULT_PENDING", observation) : next;
  }
  return transition(next, "UNKNOWN", observation);
}
