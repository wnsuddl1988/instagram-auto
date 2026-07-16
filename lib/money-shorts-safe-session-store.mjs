import {
  closeSync,
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { randomUUID } from "node:crypto";
import { dirname, join } from "node:path";

import { MONEY_SHORTS_SAFE_SESSION_MAX_ACTIONS } from "./money-shorts-safe-session-planner.mjs";

export const MONEY_SHORTS_SAFE_SESSION_STORE_VERSION = "money_shorts_safe_session_store_v1";
export const MONEY_SHORTS_SAFE_SESSION_STORE_ROOT = "C:\\tmp\\money-shorts-os\\safe-session-v1";
const MAX_SAFE_SESSION_HISTORY = 20;

function safeSessionId(sessionId) {
  if (typeof sessionId !== "string" || !/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,79}$/.test(sessionId)) {
    throw new Error("safe_session_id_invalid");
  }
  return sessionId;
}

function safeActionCap(maxActionCount) {
  if (!Number.isInteger(maxActionCount) || maxActionCount < 1 || maxActionCount > MONEY_SHORTS_SAFE_SESSION_MAX_ACTIONS) {
    throw new Error("safe_session_action_cap_invalid");
  }
  return maxActionCount;
}

function pathsFor(rootDir) {
  return {
    statePath: join(rootDir, "session.json"),
    lockPath: join(rootDir, "session-mutation.lock.json"),
  };
}

function emptyStore() {
  return {
    schemaVersion: MONEY_SHORTS_SAFE_SESSION_STORE_VERSION,
    updatedAt: null,
    currentSession: null,
    history: [],
  };
}

function normalizeStore(store) {
  return {
    ...store,
    currentSession: store.currentSession ?? null,
    history: Array.isArray(store.history) ? store.history.slice(-MAX_SAFE_SESSION_HISTORY) : [],
  };
}

function readStoreFile(statePath) {
  if (!existsSync(statePath)) return emptyStore();
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(statePath, "utf8"));
  } catch {
    throw new Error("safe_session_store_corrupt");
  }
  if (parsed?.schemaVersion !== MONEY_SHORTS_SAFE_SESSION_STORE_VERSION) {
    throw new Error("safe_session_store_schema_invalid");
  }
  return normalizeStore(parsed);
}

function writeJsonAtomic(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  const tempPath = `${path}.${randomUUID()}.tmp`;
  writeFileSync(tempPath, `${JSON.stringify(value, null, 2)}\n`, { encoding: "utf8", flag: "wx" });
  renameSync(tempPath, path);
}

function appendHistory(store, event) {
  return [...store.history, event].slice(-MAX_SAFE_SESSION_HISTORY);
}

function withSessionMutation({ rootDir, now, mutationId }, mutate) {
  const paths = pathsFor(rootDir);
  mkdirSync(rootDir, { recursive: true });
  let lockFd = null;
  try {
    lockFd = openSync(paths.lockPath, "wx");
    writeFileSync(lockFd, `${JSON.stringify({
      schemaVersion: MONEY_SHORTS_SAFE_SESSION_STORE_VERSION,
      mutationId,
      startedAt: now(),
    }, null, 2)}\n`, "utf8");
    closeSync(lockFd);
    lockFd = null;
  } catch (error) {
    if (lockFd != null) closeSync(lockFd);
    if (error && typeof error === "object" && error.code === "EEXIST") {
      throw new Error("safe_session_mutation_in_flight");
    }
    throw error;
  }

  try {
    const current = readStoreFile(paths.statePath);
    const updated = mutate(current);
    writeJsonAtomic(paths.statePath, updated);
    return updated;
  } finally {
    rmSync(paths.lockPath, { force: true });
  }
}

export function readMoneyShortsSafeSessionStore({
  rootDir = MONEY_SHORTS_SAFE_SESSION_STORE_ROOT,
} = {}) {
  return structuredClone(readStoreFile(pathsFor(rootDir).statePath));
}

/**
 * Persists Owner intent to begin one bounded local-safe session.
 * It starts no process, timer, queue action, or execution receipt.
 */
export function startMoneyShortsSafeSession({
  sessionId = `safe-session-${randomUUID()}`,
  maxActionCount = MONEY_SHORTS_SAFE_SESSION_MAX_ACTIONS,
  rootDir = MONEY_SHORTS_SAFE_SESSION_STORE_ROOT,
  now = () => new Date().toISOString(),
  mutationId = randomUUID(),
} = {}) {
  const safeId = safeSessionId(sessionId);
  const safeCap = safeActionCap(maxActionCount);
  const timestamp = now();
  return withSessionMutation({ rootDir, now, mutationId }, (store) => {
    if (store.currentSession != null) throw new Error("safe_session_already_active");
    const currentSession = {
      schemaVersion: MONEY_SHORTS_SAFE_SESSION_STORE_VERSION,
      sessionId: safeId,
      mode: "owner_started_bounded_local",
      status: "ready",
      maxActionCount: safeCap,
      completedActionCount: 0,
      actionInFlight: false,
      startedAt: timestamp,
      updatedAt: timestamp,
      stopRequestedAt: null,
    };
    return {
      schemaVersion: MONEY_SHORTS_SAFE_SESSION_STORE_VERSION,
      updatedAt: timestamp,
      currentSession,
      history: appendHistory(store, {
        at: timestamp,
        kind: "started",
        sessionId: safeId,
        maxActionCount: safeCap,
        actionCount: 0,
      }),
    };
  });
}

/**
 * Persists an Owner stop request. A later worker must stop after any current action;
 * this store itself never runs or interrupts an action.
 */
export function requestMoneyShortsSafeSessionStop({
  sessionId = "",
  rootDir = MONEY_SHORTS_SAFE_SESSION_STORE_ROOT,
  now = () => new Date().toISOString(),
  mutationId = randomUUID(),
} = {}) {
  const safeId = safeSessionId(sessionId);
  const timestamp = now();
  return withSessionMutation({ rootDir, now, mutationId }, (store) => {
    const current = store.currentSession;
    if (current == null || current.sessionId !== safeId) throw new Error("safe_session_not_found");
    if (current.status === "stop_requested") return store;
    const currentSession = {
      ...current,
      status: "stop_requested",
      updatedAt: timestamp,
      stopRequestedAt: timestamp,
    };
    return {
      ...store,
      updatedAt: timestamp,
      currentSession,
      history: appendHistory(store, {
        at: timestamp,
        kind: "stop_requested",
        sessionId: safeId,
        maxActionCount: current.maxActionCount,
        actionCount: 0,
      }),
    };
  });
}
