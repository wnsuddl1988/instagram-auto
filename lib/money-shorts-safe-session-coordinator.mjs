import { createHash } from "node:crypto";

import { MONEY_SHORTS_SAFE_SESSION_STORE_VERSION } from "./money-shorts-safe-session-store.mjs";
import {
  MONEY_SHORTS_SAFE_SESSION_PLANNER_VERSION,
  planMoneyShortsSafeSessionDryRun,
} from "./money-shorts-safe-session-planner.mjs";

export const MONEY_SHORTS_SAFE_SESSION_COORDINATOR_VERSION = "money_shorts_safe_session_coordinator_v1";

function assertStore(sessionStore) {
  if (sessionStore?.schemaVersion !== MONEY_SHORTS_SAFE_SESSION_STORE_VERSION || !Array.isArray(sessionStore.history)) {
    throw new Error("safe_session_coordinator_store_invalid");
  }
  if (sessionStore.currentSession != null && sessionStore.currentSession.schemaVersion !== MONEY_SHORTS_SAFE_SESSION_STORE_VERSION) {
    throw new Error("safe_session_coordinator_current_session_invalid");
  }
}

function baseCoordinatorResult({ sessionStore, state, decision = null, reason }) {
  const result = {
    schemaVersion: MONEY_SHORTS_SAFE_SESSION_COORDINATOR_VERSION,
    mode: "session_coordinator_dry_run",
    state,
    reason,
    sessionStoreUpdatedAt: sessionStore.updatedAt ?? null,
    sessionId: sessionStore.currentSession?.sessionId ?? null,
    sessionDecisionFingerprint: decision?.decisionFingerprint ?? null,
    queuePreviewFingerprint: decision?.queuePreviewFingerprint ?? null,
    nextClaim: decision?.nextClaim ?? null,
    actionPlannedCount: decision?.plannedActionCount ?? 0,
    actionExecuted: false,
    executionReceiptCreated: false,
    queueStateWritten: false,
    sessionStateWritten: false,
    lockAcquired: false,
    automaticRetryCount: 0,
    safety: {
      timerEnabled: false,
      backgroundWorkerEnabled: false,
      paidActionEnabled: false,
      externalGenerationEnabled: false,
      ownerQaDecisionEnabled: false,
      uploadEnabled: false,
      publicationEnabled: false,
    },
  };
  return {
    ...result,
    coordinatorFingerprint: createHash("sha256").update(JSON.stringify({
      schemaVersion: result.schemaVersion,
      state: result.state,
      sessionStoreUpdatedAt: result.sessionStoreUpdatedAt,
      sessionId: result.sessionId,
      sessionDecisionFingerprint: result.sessionDecisionFingerprint,
      queuePreviewFingerprint: result.queuePreviewFingerprint,
      nextClaim: result.nextClaim,
    })).digest("hex"),
  };
}

/**
 * Combines a previously read durable session store and a previously computed queue preview.
 * It is pure: no session/queue state is read or written here, and no claim is executed.
 */
export function coordinateMoneyShortsSafeSessionDryRun({ sessionStore, runPreview } = {}) {
  assertStore(sessionStore);
  if (sessionStore.currentSession == null) {
    return baseCoordinatorResult({
      sessionStore,
      state: "inactive",
      reason: "Owner가 시작 의도를 기록한 안전 세션이 없습니다.",
    });
  }

  const decision = planMoneyShortsSafeSessionDryRun({
    session: sessionStore.currentSession,
    runPreview,
  });
  if (decision.schemaVersion !== MONEY_SHORTS_SAFE_SESSION_PLANNER_VERSION) {
    throw new Error("safe_session_coordinator_decision_invalid");
  }
  return baseCoordinatorResult({
    sessionStore,
    state: decision.state,
    decision,
    reason: decision.reason,
  });
}
