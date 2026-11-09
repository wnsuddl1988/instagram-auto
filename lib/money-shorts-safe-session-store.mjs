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
import { createHash, randomUUID } from "node:crypto";
import { dirname, join } from "node:path";

import { MONEY_SHORTS_SAFE_SESSION_MAX_ACTIONS } from "./money-shorts-safe-session-planner.mjs";
import { isMoneyShortsSafeAutoAdvanceAction } from "./money-shorts-resumable-orchestrator.mjs";

export const MONEY_SHORTS_SAFE_SESSION_STORE_VERSION = "money_shorts_safe_session_store_v1";
export const MONEY_SHORTS_SAFE_SESSION_STORE_ROOT = "C:\\tmp\\money-shorts-os\\safe-session-v1";
const MAX_SAFE_SESSION_HISTORY = 20;
const SHA256_PATTERN = /^[a-f0-9]{64}$/;
const SAFE_EVIDENCE_ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9_.:-]{0,199}$/;
const SAFE_SESSION_DIRECT_RECOVERY_DECISIONS = new Set([
  "clear_unstarted_session_claim",
  "clear_session_claim_after_execution_recovery",
  "terminalize_session_from_receipt",
]);
const SAFE_SESSION_CHAIN_RECOVERY_DECISIONS = new Set([
  "resolve_execution_then_clear_session_claim",
  "resolve_execution_then_terminalize_session",
]);

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

function safeSha256(value, errorCode) {
  if (typeof value !== "string" || !SHA256_PATTERN.test(value)) {
    throw new Error(errorCode);
  }
  return value;
}

function safeEvidenceId(value, errorCode) {
  if (typeof value !== "string" || !SAFE_EVIDENCE_ID_PATTERN.test(value)) {
    throw new Error(errorCode);
  }
  return value;
}

function safeClaim(claim, queuePreviewFingerprint) {
  if (!claim || typeof claim !== "object") throw new Error("safe_session_claim_invalid");
  const previewFingerprint = safeSha256(claim.previewFingerprint, "safe_session_claim_preview_invalid");
  if (previewFingerprint !== queuePreviewFingerprint) throw new Error("safe_session_claim_preview_mismatch");
  if (!isMoneyShortsSafeAutoAdvanceAction(claim.action)) throw new Error("safe_session_claim_action_unsafe");
  return {
    previewFingerprint,
    jobId: safeEvidenceId(claim.jobId, "safe_session_claim_job_id_invalid"),
    topicId: safeEvidenceId(claim.topicId, "safe_session_claim_topic_id_invalid"),
    action: claim.action,
    planFingerprint: safeSha256(claim.planFingerprint, "safe_session_claim_plan_invalid"),
  };
}

function safeTerminalResult(resultStatus, blockerCode) {
  if (!new Set(["success", "blocked", "error"]).has(resultStatus)) {
    throw new Error("safe_session_terminal_status_invalid");
  }
  if (resultStatus === "success") {
    if (blockerCode != null) throw new Error("safe_session_terminal_blocker_invalid");
    return { resultStatus, blockerCode: null };
  }
  return {
    resultStatus,
    blockerCode: safeEvidenceId(blockerCode, "safe_session_terminal_blocker_invalid"),
  };
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
  const currentSession = store.currentSession == null
    ? null
    : {
      ...store.currentSession,
      activeClaim: store.currentSession.activeClaim ?? null,
      lastTerminalResult: store.currentSession.lastTerminalResult ?? null,
      lastRecoveryResult: store.currentSession.lastRecoveryResult ?? null,
    };
  return {
    ...store,
    currentSession,
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

function closeEligibilityForStore(store) {
  const current = store.currentSession;
  if (current == null) {
    return {
      eligible: false,
      reasonCode: "safe_session_absent",
      reason: "현재 닫을 안전 세션이 없습니다.",
      sessionId: null,
      closeReason: null,
    };
  }
  if (current.actionInFlight === true) {
    return {
      eligible: false,
      reasonCode: "safe_session_action_in_flight",
      reason: "진행 중인 claim이 있어 세션을 보관 종료할 수 없습니다.",
      sessionId: current.sessionId,
      closeReason: null,
    };
  }
  if (current.activeClaim != null) {
    return {
      eligible: false,
      reasonCode: "safe_session_active_claim_present",
      reason: "claim 증거가 남아 있어 복구 확인 전에는 세션을 보관 종료할 수 없습니다.",
      sessionId: current.sessionId,
      closeReason: null,
    };
  }
  const stopRequested = current.status === "stop_requested";
  const capReached = current.completedActionCount >= current.maxActionCount;
  if (!stopRequested && !capReached) {
    return {
      eligible: false,
      reasonCode: "safe_session_not_terminal",
      reason: "중지 요청 또는 실행 상한 도달 뒤에만 세션을 보관 종료할 수 있습니다.",
      sessionId: current.sessionId,
      closeReason: null,
    };
  }
  return {
    eligible: true,
    reasonCode: "safe_session_close_ready",
    reason: stopRequested && capReached
      ? "중지 요청과 실행 상한 도달이 모두 확인되어 세션을 보관 종료할 수 있습니다."
      : stopRequested
        ? "중지 요청이 확인되어 세션을 보관 종료할 수 있습니다."
        : "실행 상한 도달이 확인되어 세션을 보관 종료할 수 있습니다.",
    sessionId: current.sessionId,
    closeReason: stopRequested && capReached
      ? "stop_requested_and_action_cap_reached"
      : stopRequested
        ? "stop_requested"
        : "action_cap_reached",
  };
}

function closeFingerprintForCurrentSession(current, closeReason) {
  return createHash("sha256").update(JSON.stringify({
    schemaVersion: MONEY_SHORTS_SAFE_SESSION_STORE_VERSION,
    sessionId: current.sessionId,
    status: current.status,
    maxActionCount: current.maxActionCount,
    completedActionCount: current.completedActionCount,
    actionInFlight: current.actionInFlight,
    activeClaimFingerprint: current.activeClaim?.claimFingerprint ?? null,
    lastTerminalClaimFingerprint: current.lastTerminalResult?.claimFingerprint ?? null,
    lastTerminalFinishedAt: current.lastTerminalResult?.finishedAt ?? null,
    lastRecoveryFingerprint: current.lastRecoveryResult?.recoveryFingerprint ?? null,
    updatedAt: current.updatedAt,
    closeReason,
  })).digest("hex");
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
      activeClaim: null,
      lastTerminalResult: null,
      lastRecoveryResult: null,
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
        actionCount: current.completedActionCount,
      }),
    };
  });
}

/**
 * Returns the exact current-session evidence required before an Owner can archive-close it.
 * Reading this view never changes the store, starts work, or releases a claim.
 */
export function readMoneyShortsSafeSessionCloseView(
  sessionStore = readMoneyShortsSafeSessionStore(),
) {
  const eligibility = closeEligibilityForStore(sessionStore);
  const current = sessionStore.currentSession;
  return {
    schemaVersion: MONEY_SHORTS_SAFE_SESSION_STORE_VERSION,
    mode: "owner_confirmed_archive_close_view",
    ...eligibility,
    closeFingerprint: eligibility.eligible && current != null
      ? closeFingerprintForCurrentSession(current, eligibility.closeReason)
      : null,
    actionExecuted: false,
    executionReceiptCreated: false,
    sessionStateWritten: false,
    automaticRetryCount: 0,
    paidActionExecuted: false,
    externalGenerationExecuted: false,
    renderExecuted: false,
    uploadExecuted: false,
    publicationExecuted: false,
  };
}

/**
 * Atomically archives the terminal summary and clears only an eligible bounded session.
 * The caller must present the exact close fingerprint that was displayed to the Owner.
 */
export function closeMoneyShortsSafeSession({
  sessionId = "",
  expectedCloseFingerprint = "",
  rootDir = MONEY_SHORTS_SAFE_SESSION_STORE_ROOT,
  now = () => new Date().toISOString(),
  mutationId = randomUUID(),
} = {}) {
  const safeId = safeSessionId(sessionId);
  const safeCloseFingerprint = safeSha256(
    expectedCloseFingerprint,
    "safe_session_close_fingerprint_invalid",
  );
  const timestamp = now();

  return withSessionMutation({ rootDir, now, mutationId }, (store) => {
    const current = store.currentSession;
    if (current == null) {
      const previous = store.history.at(-1);
      if (previous?.kind === "closed" &&
        previous.sessionId === safeId &&
        previous.closeFingerprint === safeCloseFingerprint) {
        return store;
      }
      throw new Error("safe_session_not_found");
    }
    if (current.sessionId !== safeId) throw new Error("safe_session_not_found");

    const closeView = readMoneyShortsSafeSessionCloseView(store);
    if (!closeView.eligible) throw new Error(closeView.reasonCode);
    if (closeView.closeFingerprint !== safeCloseFingerprint) {
      throw new Error("safe_session_close_evidence_mismatch");
    }

    const archivedSummary = {
      at: timestamp,
      kind: "closed",
      sessionId: safeId,
      closeFingerprint: safeCloseFingerprint,
      closeReason: closeView.closeReason,
      priorStatus: current.status,
      maxActionCount: current.maxActionCount,
      actionCount: current.completedActionCount,
      startedAt: current.startedAt,
      stopRequestedAt: current.stopRequestedAt,
      lastTerminalResult: current.lastTerminalResult == null
        ? null
        : {
          claimFingerprint: current.lastTerminalResult.claimFingerprint,
          resultStatus: current.lastTerminalResult.resultStatus,
          blockerCode: current.lastTerminalResult.blockerCode,
          finishedAt: current.lastTerminalResult.finishedAt,
        },
      lastRecoveryResult: current.lastRecoveryResult == null
        ? null
        : {
          recoveryFingerprint: current.lastRecoveryResult.recoveryFingerprint,
          decision: current.lastRecoveryResult.decision,
          resolvedAt: current.lastRecoveryResult.resolvedAt,
        },
    };
    return {
      ...store,
      updatedAt: timestamp,
      currentSession: null,
      history: appendHistory(store, archivedSummary),
    };
  });
}

export function fingerprintMoneyShortsSafeSessionClaim({
  sessionId,
  coordinatorFingerprint,
  queuePreviewFingerprint,
  claim,
} = {}) {
  const safeId = safeSessionId(sessionId);
  const safeCoordinatorFingerprint = safeSha256(coordinatorFingerprint, "safe_session_coordinator_fingerprint_invalid");
  const safeQueuePreviewFingerprint = safeSha256(queuePreviewFingerprint, "safe_session_queue_preview_fingerprint_invalid");
  const normalizedClaim = safeClaim(claim, safeQueuePreviewFingerprint);
  return createHash("sha256").update(JSON.stringify({
    schemaVersion: MONEY_SHORTS_SAFE_SESSION_STORE_VERSION,
    sessionId: safeId,
    coordinatorFingerprint: safeCoordinatorFingerprint,
    queuePreviewFingerprint: safeQueuePreviewFingerprint,
    jobId: normalizedClaim.jobId,
    topicId: normalizedClaim.topicId,
    action: normalizedClaim.action,
    planFingerprint: normalizedClaim.planFingerprint,
  })).digest("hex");
}

/**
 * Atomically claims one already-planned local-safe action for a bounded session.
 * It records evidence only and never dispatches the action or creates an execution receipt.
 */
export function beginMoneyShortsSafeSessionAction({
  sessionId = "",
  coordinatorFingerprint = "",
  queuePreviewFingerprint = "",
  claim = null,
  rootDir = MONEY_SHORTS_SAFE_SESSION_STORE_ROOT,
  now = () => new Date().toISOString(),
  mutationId = randomUUID(),
} = {}) {
  const safeId = safeSessionId(sessionId);
  const safeCoordinatorFingerprint = safeSha256(coordinatorFingerprint, "safe_session_coordinator_fingerprint_invalid");
  const safeQueuePreviewFingerprint = safeSha256(queuePreviewFingerprint, "safe_session_queue_preview_fingerprint_invalid");
  const normalizedClaim = safeClaim(claim, safeQueuePreviewFingerprint);
  const claimFingerprint = fingerprintMoneyShortsSafeSessionClaim({
    sessionId: safeId,
    coordinatorFingerprint: safeCoordinatorFingerprint,
    queuePreviewFingerprint: safeQueuePreviewFingerprint,
    claim: normalizedClaim,
  });
  const timestamp = now();

  return withSessionMutation({ rootDir, now, mutationId }, (store) => {
    const current = store.currentSession;
    if (current == null || current.sessionId !== safeId) throw new Error("safe_session_not_found");
    if (current.status === "stop_requested") throw new Error("safe_session_stop_requested");
    if (current.status !== "ready") throw new Error("safe_session_status_invalid");
    if (current.actionInFlight || current.activeClaim != null) throw new Error("safe_session_action_in_flight");
    if (current.completedActionCount >= current.maxActionCount) throw new Error("safe_session_action_cap_reached");

    const activeClaim = {
      ...normalizedClaim,
      coordinatorFingerprint: safeCoordinatorFingerprint,
      queuePreviewFingerprint: safeQueuePreviewFingerprint,
      claimFingerprint,
      startedAt: timestamp,
    };
    const currentSession = {
      ...current,
      actionInFlight: true,
      activeClaim,
      updatedAt: timestamp,
    };
    return {
      ...store,
      updatedAt: timestamp,
      currentSession,
      history: appendHistory(store, {
        at: timestamp,
        kind: "action_started",
        sessionId: safeId,
        topicId: activeClaim.topicId,
        action: activeClaim.action,
        claimFingerprint,
        maxActionCount: current.maxActionCount,
        actionCount: current.completedActionCount,
      }),
    };
  });
}

/**
 * Atomically terminalizes the exact active claim. Exact repeated terminal evidence is
 * idempotent; mismatched evidence leaves the in-flight claim locked for Owner recovery.
 */
export function finishMoneyShortsSafeSessionAction({
  sessionId = "",
  claimFingerprint = "",
  resultStatus = "",
  blockerCode = null,
  actionCount = 1,
  rootDir = MONEY_SHORTS_SAFE_SESSION_STORE_ROOT,
  now = () => new Date().toISOString(),
  mutationId = randomUUID(),
} = {}) {
  const safeId = safeSessionId(sessionId);
  const safeClaimFingerprint = safeSha256(claimFingerprint, "safe_session_claim_fingerprint_invalid");
  const terminal = safeTerminalResult(resultStatus, blockerCode);
  if (actionCount !== 1) throw new Error("safe_session_terminal_action_count_invalid");
  const timestamp = now();

  return withSessionMutation({ rootDir, now, mutationId }, (store) => {
    const current = store.currentSession;
    if (current == null || current.sessionId !== safeId) throw new Error("safe_session_not_found");

    if (!current.actionInFlight || current.activeClaim == null) {
      const previous = current.lastTerminalResult;
      if (previous?.claimFingerprint === safeClaimFingerprint) {
        if (
          previous.resultStatus === terminal.resultStatus &&
          previous.blockerCode === terminal.blockerCode &&
          previous.actionCount === 1
        ) {
          return store;
        }
        throw new Error("safe_session_terminal_result_mismatch");
      }
      throw new Error("safe_session_action_not_in_flight");
    }
    if (current.activeClaim.claimFingerprint !== safeClaimFingerprint) {
      throw new Error("safe_session_claim_mismatch");
    }
    if (current.completedActionCount >= current.maxActionCount) {
      throw new Error("safe_session_completed_count_invalid");
    }

    const completedActionCount = current.completedActionCount + 1;
    const lastTerminalResult = {
      claimFingerprint: safeClaimFingerprint,
      resultStatus: terminal.resultStatus,
      blockerCode: terminal.blockerCode,
      actionCount: 1,
      finishedAt: timestamp,
    };
    const currentSession = {
      ...current,
      completedActionCount,
      actionInFlight: false,
      activeClaim: null,
      lastTerminalResult,
      updatedAt: timestamp,
    };
    return {
      ...store,
      updatedAt: timestamp,
      currentSession,
      history: appendHistory(store, {
        at: timestamp,
        kind: "action_finished",
        sessionId: safeId,
        topicId: current.activeClaim.topicId,
        action: current.activeClaim.action,
        claimFingerprint: safeClaimFingerprint,
        resultStatus: terminal.resultStatus,
        blockerCode: terminal.blockerCode,
        maxActionCount: current.maxActionCount,
        actionCount: completedActionCount,
      }),
    };
  });
}

/**
 * Recomputes recovery evidence while holding the session mutation lock, then applies
 * only a direct evidence-matched Owner decision. Decisions that still require execution
 * receipt recovery are rejected without changing session state.
 */
export function resolveMoneyShortsSafeSessionRecovery({
  sessionId = "",
  expectedRecoveryFingerprint = "",
  decision = "",
  recomputeRecoveryPlan = null,
  rootDir = MONEY_SHORTS_SAFE_SESSION_STORE_ROOT,
  now = () => new Date().toISOString(),
  mutationId = randomUUID(),
} = {}) {
  const safeId = safeSessionId(sessionId);
  const safeRecoveryFingerprint = safeSha256(expectedRecoveryFingerprint, "safe_session_recovery_fingerprint_invalid");
  if (SAFE_SESSION_CHAIN_RECOVERY_DECISIONS.has(decision)) {
    throw new Error("safe_session_recovery_execution_resolution_required");
  }
  if (!SAFE_SESSION_DIRECT_RECOVERY_DECISIONS.has(decision)) {
    throw new Error("safe_session_recovery_decision_invalid");
  }
  if (typeof recomputeRecoveryPlan !== "function") {
    throw new Error("safe_session_recovery_recompute_required");
  }
  const timestamp = now();

  return withSessionMutation({ rootDir, now, mutationId }, (store) => {
    const current = store.currentSession;
    if (current == null || current.sessionId !== safeId) throw new Error("safe_session_not_found");

    if (!current.actionInFlight || current.activeClaim == null) {
      const previous = current.lastRecoveryResult;
      if (previous?.recoveryFingerprint === safeRecoveryFingerprint) {
        if (previous.decision === decision) return store;
        throw new Error("safe_session_recovery_result_mismatch");
      }
      throw new Error("safe_session_action_not_in_flight");
    }

    const recoveryPlan = recomputeRecoveryPlan(structuredClone(store));
    if (
      recoveryPlan?.schemaVersion !== "money_shorts_safe_session_recovery_v1" ||
      recoveryPlan?.mode !== "evidence_only_recovery_plan" ||
      recoveryPlan?.state !== "decision_required" ||
      recoveryPlan?.ownerConfirmationRequired !== true ||
      recoveryPlan?.recoveryFingerprint !== safeRecoveryFingerprint ||
      recoveryPlan?.allowedDecision !== decision ||
      recoveryPlan?.claimFingerprint !== current.activeClaim.claimFingerprint ||
      recoveryPlan?.executionRecoveryDecision != null ||
      recoveryPlan?.actionExecuted !== false ||
      recoveryPlan?.executionReceiptCreated !== false ||
      recoveryPlan?.executionReceiptMutated !== false ||
      recoveryPlan?.sessionStateWritten !== false ||
      recoveryPlan?.automaticRetryCount !== 0 ||
      recoveryPlan?.paidActionExecuted !== false ||
      recoveryPlan?.externalGenerationExecuted !== false ||
      recoveryPlan?.renderExecuted !== false ||
      recoveryPlan?.uploadExecuted !== false ||
      recoveryPlan?.publicationExecuted !== false
    ) {
      throw new Error("safe_session_recovery_evidence_or_decision_mismatch");
    }

    const activeClaim = current.activeClaim;
    const clearDecision = decision === "clear_unstarted_session_claim" ||
      decision === "clear_session_claim_after_execution_recovery";
    let completedActionCount = current.completedActionCount;
    let lastTerminalResult = current.lastTerminalResult;
    let historyKind;

    if (clearDecision) {
      if (
        recoveryPlan.actionCountDelta !== 0 ||
        recoveryPlan.terminalResult != null ||
        recoveryPlan.sessionDisposition !== "halt_after_clear"
      ) {
        throw new Error("safe_session_recovery_clear_contract_invalid");
      }
      historyKind = "action_recovery_cleared";
    } else {
      if (
        recoveryPlan.actionCountDelta !== 1 ||
        recoveryPlan.terminalResult?.actionCount !== 1 ||
        recoveryPlan.sessionDisposition !== "terminalize_matching_claim"
      ) {
        throw new Error("safe_session_recovery_terminal_contract_invalid");
      }
      const terminal = safeTerminalResult(
        recoveryPlan.terminalResult.resultStatus,
        recoveryPlan.terminalResult.blockerCode,
      );
      if (current.completedActionCount >= current.maxActionCount) {
        throw new Error("safe_session_completed_count_invalid");
      }
      completedActionCount += 1;
      lastTerminalResult = {
        claimFingerprint: activeClaim.claimFingerprint,
        recoveryFingerprint: safeRecoveryFingerprint,
        resultStatus: terminal.resultStatus,
        blockerCode: terminal.blockerCode,
        actionCount: 1,
        finishedAt: timestamp,
      };
      historyKind = "action_recovery_terminalized";
    }

    const lastRecoveryResult = {
      recoveryFingerprint: safeRecoveryFingerprint,
      claimFingerprint: activeClaim.claimFingerprint,
      decision,
      terminalResult: recoveryPlan.terminalResult == null
        ? null
        : {
          resultStatus: lastTerminalResult.resultStatus,
          blockerCode: lastTerminalResult.blockerCode,
          actionCount: 1,
        },
      actionCountDelta: recoveryPlan.actionCountDelta,
      sessionDisposition: recoveryPlan.sessionDisposition,
      resolvedAt: timestamp,
    };
    const currentSession = {
      ...current,
      status: clearDecision ? "stop_requested" : current.status,
      completedActionCount,
      actionInFlight: false,
      activeClaim: null,
      lastTerminalResult,
      lastRecoveryResult,
      updatedAt: timestamp,
      stopRequestedAt: clearDecision ? (current.stopRequestedAt ?? timestamp) : current.stopRequestedAt,
    };
    return {
      ...store,
      updatedAt: timestamp,
      currentSession,
      history: appendHistory(store, {
        at: timestamp,
        kind: historyKind,
        sessionId: safeId,
        topicId: activeClaim.topicId,
        action: activeClaim.action,
        claimFingerprint: activeClaim.claimFingerprint,
        recoveryFingerprint: safeRecoveryFingerprint,
        decision,
        resultStatus: lastRecoveryResult.terminalResult?.resultStatus ?? null,
        blockerCode: lastRecoveryResult.terminalResult?.blockerCode ?? null,
        maxActionCount: current.maxActionCount,
        actionCount: completedActionCount,
      }),
    };
  });
}
