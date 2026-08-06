import type {
  PlatformPublicationState,
  PlatformPublishPackage,
  PublicationAttemptRecord,
  PublishDeduplicationKey,
  PublishDuplicateCheckResult,
  SessionPublicationLedger,
} from "./contracts";

function stableSerialize(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableSerialize).join(",")}]`;
  const record = value as Readonly<Record<string, unknown>>;
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableSerialize(record[key])}`).join(",")}}`;
}

function deterministicHash(value: unknown): string {
  const text = stableSerialize(value);
  let first = 0x811c9dc5;
  let second = 0x9e3779b9;
  for (let index = 0; index < text.length; index += 1) {
    const code = text.charCodeAt(index);
    first ^= code;
    first = Math.imul(first, 0x01000193) >>> 0;
    second ^= code + index;
    second = Math.imul(second, 0x85ebca6b) >>> 0;
  }
  const left = first.toString(16).padStart(8, "0");
  const right = second.toString(16).padStart(8, "0");
  return `${left}${right}${right}${left}`;
}

export function buildPublishDeduplicationKey(
  platformPackage: PlatformPublishPackage,
): PublishDeduplicationKey {
  const components = {
    platformId: platformPackage.platformId,
    stableDestinationId: platformPackage.expectedDestinationIdentity.stableDestinationId.trim(),
    renderManifestHash: platformPackage.dedupeKey.renderManifestHash,
    metadataHash: platformPackage.metadata.metadataHash,
    visibilityIntent: platformPackage.visibilityIntent,
    coverPlanHash: deterministicHash(platformPackage.coverPlan),
  };
  return { keyVersion: "publish-dedupe-key-v1", ...components, value: deterministicHash(components) };
}

export function checkSessionPublishDuplicate(
  key: PublishDeduplicationKey | string,
  ledger: SessionPublicationLedger,
): PublishDuplicateCheckResult {
  const value = typeof key === "string" ? key : key.value;
  const matches = ledger.attempts.filter((attempt) => attempt.dedupeKey === value);
  return {
    duplicate: matches.length > 0,
    blocking: matches.length > 0,
    matchedAttemptIds: matches.map((attempt) => attempt.attemptId),
    checkedSessionOnly: true,
    remotePlatformChecked: false,
    durableLedgerChecked: false,
  };
}

function derivePlatformStates(attempts: readonly PublicationAttemptRecord[]): readonly PlatformPublicationState[] {
  const platformIds = [...new Set(attempts.map((attempt) => attempt.platformId))];
  return platformIds.map((platformId) => {
    const platformAttempts = attempts.filter((attempt) => attempt.platformId === platformId).sort((left, right) => left.attemptOrdinal - right.attemptOrdinal);
    const latest = platformAttempts.at(-1) ?? null;
    return {
      platformId,
      dedupeKey: latest?.dedupeKey ?? "",
      latestAttemptId: latest?.attemptId ?? null,
      latestStatus: latest?.status ?? "not_attempted",
      successful: latest?.status === "dry_run_success",
      failed: latest?.status === "dry_run_failed",
      blocked: latest?.status === "blocked",
      retryable: latest?.status === "dry_run_failed" && latest.retryable && latest.identityMatchAtAttempt,
    };
  });
}

export function recordSessionPublicationAttempt(
  ledger: SessionPublicationLedger,
  attempt: PublicationAttemptRecord,
  recoveryAuthorized = false,
): SessionPublicationLedger {
  const sameKey = ledger.attempts.filter((entry) => entry.dedupeKey === attempt.dedupeKey);
  const latestSameKey = sameKey.slice().sort((left, right) => left.attemptOrdinal - right.attemptOrdinal).at(-1) ?? null;
  if (ledger.attempts.some((entry) => entry.attemptId === attempt.attemptId)) throw new Error("publication_attempt_id_duplicate");
  if (latestSameKey?.status === "dry_run_success" || latestSameKey?.status === "planned" || latestSameKey?.status === "dry_run_in_progress") throw new Error("publication_dedupe_key_blocked");
  if (latestSameKey?.status === "dry_run_failed" && !recoveryAuthorized) throw new Error("failed_publication_requires_recovery_plan");
  if (latestSameKey && attempt.attemptOrdinal !== latestSameKey.attemptOrdinal + 1) throw new Error("publication_attempt_ordinal_invalid");
  if (!latestSameKey && attempt.attemptOrdinal !== 1) throw new Error("publication_attempt_must_start_at_one");
  const attempts = [...ledger.attempts.map((entry) => ({ ...entry })), { ...attempt }];
  return {
    ledgerVersion: "session-publication-ledger-v1",
    sessionIdentity: ledger.sessionIdentity,
    attempts,
    platformStates: derivePlatformStates(attempts),
    durable: false,
    remoteSynchronized: false,
  };
}

export function cloneSessionPublicationLedger(
  ledger: SessionPublicationLedger,
): SessionPublicationLedger {
  return {
    ...ledger,
    attempts: ledger.attempts.map((attempt) => ({ ...attempt })),
    platformStates: ledger.platformStates.map((state) => ({ ...state })),
  };
}

export function validateSessionPublicationLedger(
  ledger: SessionPublicationLedger,
): readonly string[] {
  const issues: string[] = [];
  if (ledger.durable !== false) issues.push("session_ledger_durable_false_claim");
  if (ledger.remoteSynchronized !== false) issues.push("session_ledger_remote_sync_false_claim");
  if (!ledger.sessionIdentity.trim()) issues.push("session_ledger_identity_missing");
  const attemptIds = new Set<string>();
  for (const attempt of ledger.attempts) {
    if (attemptIds.has(attempt.attemptId)) issues.push("publication_attempt_id_duplicate");
    attemptIds.add(attempt.attemptId);
    if (!Number.isInteger(attempt.attemptOrdinal) || attempt.attemptOrdinal < 1) issues.push("publication_attempt_ordinal_invalid");
    if (!Number.isFinite(Date.parse(attempt.requestedAtIso))) issues.push("publication_attempt_timestamp_invalid");
    if (attempt.externalExecution !== false || attempt.dryRun !== true) issues.push("publication_attempt_external_state_forbidden");
    if (attempt.status === "dry_run_failed" && !attempt.failureCode) issues.push("publication_attempt_failure_code_missing");
    if (attempt.status === "dry_run_success" && attempt.failureCode) issues.push("publication_attempt_success_failure_code_conflict");
  }
  return issues;
}
