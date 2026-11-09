#!/usr/bin/env node
/**
 * Read-only Part 2 Instagram recovery review preflight.
 *
 * This script has no armed/live branch. It reads local immutable evidence,
 * recomputes the current artifact binding, and emits a deterministic Owner
 * decision packet. It never reads env credentials, calls a network service,
 * writes evidence, retries, uploads, publishes, or changes the ledger.
 */

import { createHash } from "node:crypto";
import {
  existsSync,
  readFileSync,
  readdirSync,
  realpathSync,
  statSync,
} from "node:fs";
import {
  basename,
  dirname,
  isAbsolute,
  join,
  relative,
  resolve,
} from "node:path";
import { fileURLToPath } from "node:url";

import {
  fingerprintMoneyShortsPublishAttemptBinding,
  inspectMoneyShortsPublishAttemptEvidence,
} from "../lib/money-shorts-publish-attempt-journal.mjs";
import {
  MONEY_SHORTS_PART2_DUAL_PUBLISH_SAFE_TRANSITIONS,
  moneyShortsPart2DualPublishSafeEventPath,
  moneyShortsPart2DualPublishSafePaths,
  validateMoneyShortsPart2DualPublishSafePreflight,
} from "../lib/money-shorts-part2-dual-publish-safe.mjs";
import {
  classifyMoneyShortsPublishRecovery,
} from "../lib/money-shorts-publish-recovery.mjs";
import {
  inspectMoneyShortsPart2DualPublishSafeCurrentContext,
} from "./run-money-shorts-part2-only-dual-publish-safe-v1.mjs";

export const MONEY_SHORTS_PART2_INSTAGRAM_RECOVERY_PREFLIGHT_VERSION =
  "money_shorts_part2_instagram_recovery_preflight_v1";
export const MONEY_SHORTS_PART2_INSTAGRAM_RECOVERY_PREFLIGHT_INSPECTION =
  "INSPECT_PART2_INSTAGRAM_RECOVERY_EVIDENCE_V1";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const REPO_ROOT = resolve(dirname(SCRIPT_PATH), "..");
const CANONICAL_RESULT_FILENAME =
  "final-e2e-publish-result.json";
const CANONICAL_ATTEMPT_CLAIM_FILENAME =
  "final-e2e-publish-attempt-claim.json";
const CANONICAL_ATTEMPT_JOURNAL_DIRNAME =
  "final-e2e-publish-attempt-journal";
const GENERIC_PREFLIGHT_FILENAME =
  "final-e2e-publish-preflight.json";
const SHA256_RE = /^[a-f0-9]{64}$/;
const INSTAGRAM_ACCOUNT_ID_RE = /^[1-9][0-9]{5,31}$/;
const YOUTUBE_CHANNEL_ID_RE = /^UC[A-Za-z0-9_-]{22}$/;
const EXPECTED_TRANSITIONS =
  MONEY_SHORTS_PART2_DUAL_PUBLISH_SAFE_TRANSITIONS.slice(
    0,
    10,
  );
const VALUE_FLAGS = Object.freeze([
  "--inspection",
  "--content-unit",
  "--ledger",
  "--out-dir",
  "--expected-content-id",
  "--expected-manifest-sha256",
  "--expected-source-sha256",
  "--expected-publication-attempt-fingerprint",
  "--expected-instagram-account-id",
  "--expected-youtube-channel-id",
  "--expected-original-safe-preflight-fingerprint",
  "--expected-original-safe-claim-fingerprint",
  "--expected-original-safe-result-fingerprint",
  "--expected-original-canonical-result-fingerprint",
  "--expected-original-plan-fingerprint",
  "--expected-original-safe-preflight-file-sha256",
  "--expected-original-safe-claim-file-sha256",
  "--expected-original-safe-result-file-sha256",
  "--expected-original-safe-latest-event-sha256",
  "--expected-original-canonical-attempt-claim-file-sha256",
  "--expected-original-canonical-latest-event-sha256",
  "--expected-original-canonical-result-file-sha256",
  "--expected-original-ledger-sha256",
  "--expected-original-blob-url-sha256",
  "--expected-original-recovery-fingerprint",
]);

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function isPlainObject(value) {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function strictString(value) {
  return typeof value === "string" ? value : "";
}

function hasExactKeys(value, expectedKeys) {
  return (
    isPlainObject(value) &&
    JSON.stringify(Object.keys(value).sort()) ===
      JSON.stringify([...expectedKeys].sort())
  );
}

function validIso(value) {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    Number.isFinite(Date.parse(value))
  );
}

function fingerprinted(stable, field) {
  return {
    ...stable,
    [field]: sha256(JSON.stringify(stable)),
  };
}

function validFingerprint(value, field) {
  if (
    !isPlainObject(value) ||
    !SHA256_RE.test(strictString(value[field]))
  ) {
    return false;
  }
  const { [field]: actual, ...stable } = value;
  return actual === sha256(JSON.stringify(stable));
}

function pathInside(rootPath, candidatePath) {
  const rel = relative(
    resolve(rootPath).toLowerCase(),
    resolve(candidatePath).toLowerCase(),
  );
  return (
    rel === "" ||
    (!rel.startsWith("..") && !isAbsolute(rel))
  );
}

function outsideRepoExistingPath(path) {
  try {
    return !pathInside(REPO_ROOT, realpathSync(path));
  } catch {
    return false;
  }
}

function readJsonEvidence(path) {
  if (!existsSync(path)) {
    return {
      exists: false,
      parseOk: false,
      sha256: null,
      evidence: null,
      bytes: null,
    };
  }
  try {
    const bytes = readFileSync(path);
    return {
      exists: true,
      parseOk: true,
      sha256: sha256(bytes),
      evidence: JSON.parse(bytes.toString("utf8")),
      bytes,
    };
  } catch {
    return {
      exists: true,
      parseOk: false,
      sha256: null,
      evidence: null,
      bytes: null,
    };
  }
}

function exactStringArray(value, expected) {
  return (
    Array.isArray(value) &&
    value.length === expected.length &&
    value.every(
      (candidate, index) => candidate === expected[index],
    )
  );
}

export function zeroMoneyShortsPart2InstagramRecoveryPreflightCounters() {
  return {
    credentialReadCount: 0,
    credentialValuePrintCount: 0,
    networkRequestCount: 0,
    blobPutCount: 0,
    blobHeadCount: 0,
    instagramIdentityReadCount: 0,
    instagramContainerCreateCount: 0,
    instagramStatusPollCount: 0,
    instagramPublishCount: 0,
    youtubeIdentityReadCount: 0,
    youtubeInsertCount: 0,
    ledgerWriteCount: 0,
    databaseMutationCount: 0,
    evidenceWriteCount: 0,
    filesystemMutationCount: 0,
    part1ActionCount: 0,
    automaticRetryCount: 0,
  };
}

function validPart2Binding(value) {
  return (
    hasExactKeys(value, [
      "contentId",
      "version",
      "productionPartId",
      "contentUnitManifestPath",
      "contentUnitSha256",
      "instagramSourceSha256",
      "youtubeSourceSha256",
      "publishMetadataSha256",
      "finalVideoApprovalFingerprint",
    ]) &&
    strictString(value.contentId).endsWith("-part-2") &&
    strictString(value.version).length > 0 &&
    value.productionPartId === "part-2" &&
    strictString(value.contentUnitManifestPath).length > 0 &&
    SHA256_RE.test(strictString(value.contentUnitSha256)) &&
    SHA256_RE.test(
      strictString(value.instagramSourceSha256),
    ) &&
    value.instagramSourceSha256 ===
      value.youtubeSourceSha256 &&
    SHA256_RE.test(
      strictString(value.publishMetadataSha256),
    ) &&
    SHA256_RE.test(
      strictString(value.finalVideoApprovalFingerprint),
    )
  );
}

function validOriginalEvidence(value) {
  return (
    hasExactKeys(value, [
      "safePreflightFileSha256",
      "safePreflightFingerprint",
      "safeClaimFileSha256",
      "safeClaimFingerprint",
      "safeResultFileSha256",
      "safeResultFingerprint",
      "canonicalAttemptClaimFileSha256",
      "canonicalLatestEventSha256",
      "canonicalResultFileSha256",
      "canonicalResultFingerprint",
    ]) &&
    [
      "safePreflightFileSha256",
      "safePreflightFingerprint",
      "safeClaimFileSha256",
      "safeClaimFingerprint",
      "safeResultFileSha256",
      "safeResultFingerprint",
      "canonicalAttemptClaimFileSha256",
      "canonicalLatestEventSha256",
      "canonicalResultFileSha256",
      "canonicalResultFingerprint",
    ].every((name) =>
      SHA256_RE.test(strictString(value[name])),
    )
  );
}

function validFailureCounters(value) {
  return (
    hasExactKeys(value, [
      "blobPutCount",
      "blobHeadCount",
      "instagramContainerCreateCount",
      "instagramStatusPollCount",
      "instagramPublishCount",
      "youtubeInsertCount",
      "ledgerWriteCount",
      "databaseMutationCount",
      "part1ActionCount",
      "automaticRetryCount",
      "credentialValuePrintCount",
    ]) &&
    value.blobPutCount === 1 &&
    value.blobHeadCount === 1 &&
    value.instagramContainerCreateCount === 1 &&
    value.instagramStatusPollCount === 0 &&
    value.instagramPublishCount === 0 &&
    value.youtubeInsertCount === 0 &&
    value.ledgerWriteCount === 0 &&
    value.databaseMutationCount === 0 &&
    value.part1ActionCount === 0 &&
    value.automaticRetryCount === 0 &&
    value.credentialValuePrintCount === 0
  );
}

function validDiagnosticState(value) {
  if (value === "legacy_absent" || value === "unavailable") {
    return true;
  }
  return (
    hasExactKeys(value, [
      "state",
      "responseReceived",
      "httpStatus",
      "responseOk",
      "jsonParsed",
      "containerIdPresent",
      "providerError",
    ]) &&
    value.state === "available" &&
    typeof value.responseReceived === "boolean" &&
    (value.httpStatus === null ||
      (Number.isSafeInteger(value.httpStatus) &&
        value.httpStatus >= 100 &&
        value.httpStatus <= 599)) &&
    (value.responseOk === null ||
      typeof value.responseOk === "boolean") &&
    typeof value.jsonParsed === "boolean" &&
    typeof value.containerIdPresent === "boolean" &&
    hasExactKeys(value.providerError, [
      "code",
      "errorSubcode",
      "type",
      "isTransient",
    ]) &&
    (value.providerError.code === null ||
      (Number.isSafeInteger(value.providerError.code) &&
        value.providerError.code >= 0)) &&
    (value.providerError.errorSubcode === null ||
      (Number.isSafeInteger(
        value.providerError.errorSubcode,
      ) &&
        value.providerError.errorSubcode >= 0)) &&
    (value.providerError.type === null ||
      [
        "FacebookApiException",
        "GraphMethodException",
        "IGApiException",
        "OAuthException",
      ].includes(value.providerError.type)) &&
    (value.providerError.isTransient === null ||
      typeof value.providerError.isTransient === "boolean")
  );
}

function sourceEvidenceBundle(facts) {
  return {
    currentBinding: facts.currentBinding,
    originalPublicationAttemptFingerprint:
      facts.originalPublicationAttemptFingerprint,
    originalPlanFingerprint:
      facts.originalPlanFingerprint,
    originalEvidence: { ...facts.originalEvidence },
    safeJournal: {
      eventCount: facts.safeJournal.eventCount,
      transitions: [...facts.safeJournal.transitions],
      latestEventSha256:
        facts.safeJournal.latestEventSha256,
    },
    canonicalJournal: {
      eventCount: facts.canonicalJournal.eventCount,
      transitions: [
        ...facts.canonicalJournal.transitions,
      ],
      latestEventSha256:
        facts.canonicalJournal.latestEventSha256,
    },
  };
}

/**
 * Builds a deterministic, no-action Owner review plan from strictly normalized
 * local evidence facts. This never upgrades an ambiguous provider outcome into
 * permission to retry.
 */
export function buildMoneyShortsPart2InstagramRecoveryReviewPlan(
  facts,
) {
  if (
    !isPlainObject(facts) ||
    !validPart2Binding(facts.currentBinding) ||
    !SHA256_RE.test(
      strictString(facts.originalPlanFingerprint),
    ) ||
    facts.originalPublicationAttemptFingerprint !==
      fingerprintMoneyShortsPublishAttemptBinding(
        facts.currentBinding,
      ) ||
    !INSTAGRAM_ACCOUNT_ID_RE.test(
      strictString(facts.expectedInstagramAccountId),
    ) ||
    !YOUTUBE_CHANNEL_ID_RE.test(
      strictString(facts.expectedYoutubeChannelId),
    )
  ) {
    return {
      ok: false,
      reason:
        "PART2_INSTAGRAM_RECOVERY_PREFLIGHT_BINDING_INVALID",
    };
  }
  if (
    !validOriginalEvidence(facts.originalEvidence) ||
    facts.safeEvidenceValid !== true ||
    facts.canonicalEvidenceValid !== true ||
    !isPlainObject(facts.safeJournal) ||
    !isPlainObject(facts.canonicalJournal) ||
    facts.safeJournal.valid !== true ||
    facts.canonicalJournal.valid !== true ||
    facts.safeJournal.eventCount !==
      EXPECTED_TRANSITIONS.length ||
    facts.canonicalJournal.eventCount !==
      EXPECTED_TRANSITIONS.length ||
    !exactStringArray(
      facts.safeJournal.transitions,
      EXPECTED_TRANSITIONS,
    ) ||
    !exactStringArray(
      facts.canonicalJournal.transitions,
      EXPECTED_TRANSITIONS,
    ) ||
    !SHA256_RE.test(
      strictString(facts.safeJournal.latestEventSha256),
    ) ||
    !SHA256_RE.test(
      strictString(
        facts.canonicalJournal.latestEventSha256,
      ),
    )
  ) {
    return {
      ok: false,
      reason:
        "PART2_INSTAGRAM_RECOVERY_PREFLIGHT_SOURCE_EVIDENCE_INVALID",
    };
  }
  if (
    !isPlainObject(facts.failure) ||
    facts.failure.safeStatus !==
      "INSTAGRAM_CONTAINER_OUTCOME_UNKNOWN" ||
    facts.failure.canonicalStatus !== "FAILED" ||
    facts.failure.safeBlockerCode !==
      "PART2_DUAL_SAFE_INSTAGRAM_CONTAINER_NO_ID" ||
    facts.failure.canonicalBlockerCode !==
      "PART2_DUAL_SAFE_INSTAGRAM_CONTAINER_NO_ID" ||
    facts.failure.instagramOutcome !== "unknown" ||
    facts.failure.instagramContainerId !== null ||
    facts.failure.instagramMediaId !== null ||
    facts.failure.youtubeOutcome !== "not_started" ||
    facts.failure.youtubeVideoId !== null ||
    facts.failure.publishIntentObserved !== false ||
    facts.failure.containerConfirmedObserved !== false ||
    !validFailureCounters(facts.failure.counters) ||
    !validDiagnosticState(facts.failure.diagnosticState) ||
    facts.priorAuthorizationConsumed !== true
  ) {
    return {
      ok: false,
      reason:
        "PART2_INSTAGRAM_RECOVERY_PREFLIGHT_FAILURE_BOUNDARY_INVALID",
    };
  }
  if (
    !isPlainObject(facts.ledger) ||
    facts.ledger.readOk !== true ||
    facts.ledger.clean !== true ||
    facts.ledger.instagramAlreadyPublished !== false ||
    facts.ledger.youtubeAlreadyPublished !== false ||
    !SHA256_RE.test(strictString(facts.ledger.sha256)) ||
    facts.ledger.sha256 !==
      facts.ledger.originalBaselineSha256
  ) {
    return {
      ok: false,
      reason:
        "PART2_INSTAGRAM_RECOVERY_PREFLIGHT_LEDGER_NOT_EXACTLY_CLEAN",
    };
  }
  if (
    !isPlainObject(facts.blob) ||
    facts.blob.evidenceConsistent !== true ||
    facts.blob.status !== "uploaded" ||
    strictString(facts.blob.pathname).length === 0 ||
    !SHA256_RE.test(strictString(facts.blob.urlSha256)) ||
    facts.blob.priorHeadStatus !== 200 ||
    !strictString(
      facts.blob.priorHeadContentType,
    ).startsWith("video/") ||
    facts.blob.liveHeadChecked !== false
  ) {
    return {
      ok: false,
      reason:
        "PART2_INSTAGRAM_RECOVERY_PREFLIGHT_BLOB_EVIDENCE_INVALID",
    };
  }
  if (
    !isPlainObject(facts.recovery) ||
    facts.recovery.state !== "ambiguous" ||
    facts.recovery.reason !==
      "instagram_publish_outcome_unknown" ||
    !SHA256_RE.test(
      strictString(facts.recovery.recoveryFingerprint),
    ) ||
    facts.recovery.recoverablePlatformCandidate !== null ||
    facts.recovery.automaticRetryAllowed !== false ||
    facts.recovery.externalRecoveryEnabled !== false
  ) {
    return {
      ok: false,
      reason:
        "PART2_INSTAGRAM_RECOVERY_PREFLIGHT_CLASSIFICATION_INVALID",
    };
  }

  const evidenceBundle = sourceEvidenceBundle(facts);
  const sourceEvidenceBundleFingerprint = sha256(
    JSON.stringify(evidenceBundle),
  );
  const stable = {
    schemaVersion:
      MONEY_SHORTS_PART2_INSTAGRAM_RECOVERY_PREFLIGHT_VERSION,
    mode: "code_only_dry_run",
    status: "LOCAL_RECOVERY_REVIEW_OK",
    armed: false,
    localEvidenceEligible: true,
    readyForOwnerReview: true,
    readyForActualExecution: false,
    ownerApprovalRequired: true,
    safeToRetry: false,
    safeToPublish: false,
    currentBinding: facts.currentBinding,
    expectedInstagramAccountId:
      facts.expectedInstagramAccountId,
    expectedYoutubeChannelId:
      facts.expectedYoutubeChannelId,
    sourceEvidenceBundleFingerprint,
    sourceAttemptEvidence: evidenceBundle,
    currentRecoveryClassification: {
      state: facts.recovery.state,
      reason: facts.recovery.reason,
      recoveryFingerprint:
        facts.recovery.recoveryFingerprint,
      recoverablePlatformCandidate: null,
      automaticRetryAllowed: false,
      externalRecoveryEnabled: false,
    },
    observedBoundary: {
      containerCreateAttempted: true,
      containerOutcome: "unknown",
      diagnosticState: facts.failure.diagnosticState,
      containerConfirmedObserved: false,
      publishIntentObserved: false,
      instagramMediaId: null,
      youtubeVideoId: null,
      counters: { ...facts.failure.counters },
    },
    duplicateSafety: {
      localLedgerClean: true,
      externalInstagramPublicationState: "unknown",
      freshExternalReconciliationPerformed: false,
      safeToRepublish: false,
    },
    priorAuthorization: {
      scope: "part2_dual_platform_publish_safe_v1",
      consumptionState: "consumed_by_armed_claim",
      consumed: true,
      consumedByAttemptClaimSha256:
        facts.originalEvidence
          .canonicalAttemptClaimFileSha256,
      consumedByPublicationAttemptFingerprint:
        facts.originalPublicationAttemptFingerprint,
      reusable: false,
      authorizesRetry: false,
      authorizesRecoveryExecution: false,
    },
    blob: {
      pathname: facts.blob.pathname,
      urlSha256: facts.blob.urlSha256,
      priorHeadStatus: facts.blob.priorHeadStatus,
      priorHeadContentType:
        facts.blob.priorHeadContentType,
      blobReadiness: "deferred",
      liveHeadChecked: false,
      futureHeadRevalidationRequired: true,
      blobPutAllowed: false,
    },
    ledger: {
      sha256: facts.ledger.sha256,
      clean: true,
      mutationAllowed: false,
    },
    pendingGates: [
      "live_instagram_reconciliation",
      "new_owner_mutation_approval",
      "actual_runner_implemented_and_validated",
    ],
    futureExecutionBoundary: {
      platform: "instagram_reels",
      recoveryRunnerImplemented: false,
      executionAuthorized: false,
      separateRecoveryOutDirRequired: true,
      blobPutAllowed: false,
      blobHeadAllowed: false,
      instagramIdentityReadAllowed: false,
      instagramContainerCreateAllowed: false,
      instagramStatusPollAllowed: false,
      instagramPublishAllowed: false,
      youtubeInsertAllowed: false,
      ledgerWriteAllowed: false,
      part1ActionAllowed: false,
      automaticRetryCount: 0,
    },
    sideEffectCounters:
      zeroMoneyShortsPart2InstagramRecoveryPreflightCounters(),
  };
  return {
    ok: true,
    plan: fingerprinted(stable, "recoveryPlanFingerprint"),
  };
}

export function buildMoneyShortsPart2InstagramRecoveryPreflight({
  plan,
}) {
  if (
    !validFingerprint(plan, "recoveryPlanFingerprint") ||
    plan.schemaVersion !==
      MONEY_SHORTS_PART2_INSTAGRAM_RECOVERY_PREFLIGHT_VERSION ||
    plan.status !== "LOCAL_RECOVERY_REVIEW_OK" ||
    plan.armed !== false ||
    plan.readyForActualExecution !== false ||
    plan.ownerApprovalRequired !== true ||
    plan.safeToRetry !== false ||
    plan.safeToPublish !== false ||
    JSON.stringify(plan.sideEffectCounters) !==
      JSON.stringify(
        zeroMoneyShortsPart2InstagramRecoveryPreflightCounters(),
      )
  ) {
    return null;
  }
  const stable = {
    schemaVersion:
      MONEY_SHORTS_PART2_INSTAGRAM_RECOVERY_PREFLIGHT_VERSION,
    evidenceType: "preflight",
    status: "LOCAL_RECOVERY_REVIEW_OK",
    mode: "code_only_dry_run",
    armed: false,
    executionAuthorized: false,
    readyForOwnerReview: true,
    readyForActualExecution: false,
    ownerApprovalRequired: true,
    safeToRetry: false,
    safeToPublish: false,
    sourceEvidenceBundleFingerprint:
      plan.sourceEvidenceBundleFingerprint,
    recoveryPlanFingerprint:
      plan.recoveryPlanFingerprint,
    contentId: plan.currentBinding.contentId,
    sourceSha256:
      plan.currentBinding.instagramSourceSha256,
    expectedInstagramAccountId:
      plan.expectedInstagramAccountId,
    plan,
    sideEffectCounters:
      zeroMoneyShortsPart2InstagramRecoveryPreflightCounters(),
  };
  return fingerprinted(stable, "preflightFingerprint");
}

export function validateMoneyShortsPart2InstagramRecoveryPreflight({
  evidence,
  currentPlan,
  expectedPreflightFingerprint,
}) {
  const valid =
    validFingerprint(evidence, "preflightFingerprint") &&
    validFingerprint(
      currentPlan,
      "recoveryPlanFingerprint",
    ) &&
    evidence.schemaVersion ===
      MONEY_SHORTS_PART2_INSTAGRAM_RECOVERY_PREFLIGHT_VERSION &&
    evidence.evidenceType === "preflight" &&
    evidence.status === "LOCAL_RECOVERY_REVIEW_OK" &&
    evidence.mode === "code_only_dry_run" &&
    evidence.armed === false &&
    evidence.executionAuthorized === false &&
    evidence.readyForActualExecution === false &&
    evidence.ownerApprovalRequired === true &&
    evidence.safeToRetry === false &&
    evidence.safeToPublish === false &&
    evidence.preflightFingerprint ===
      expectedPreflightFingerprint &&
    evidence.recoveryPlanFingerprint ===
      currentPlan.recoveryPlanFingerprint &&
    evidence.sourceEvidenceBundleFingerprint ===
      currentPlan.sourceEvidenceBundleFingerprint &&
    JSON.stringify(evidence.plan) ===
      JSON.stringify(currentPlan) &&
    JSON.stringify(evidence.sideEffectCounters) ===
      JSON.stringify(
        zeroMoneyShortsPart2InstagramRecoveryPreflightCounters(),
      );
  return {
    valid,
    reason: valid
      ? "part2_instagram_recovery_preflight_valid"
      : "part2_instagram_recovery_preflight_invalid",
  };
}

export function parseMoneyShortsPart2InstagramRecoveryPreflightArgs(
  argv,
) {
  const values = Object.create(null);
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (
      token === "--arm" ||
      token === "--execute" ||
      token === "--retry"
    ) {
      return {
        ok: false,
        reason:
          "PART2_INSTAGRAM_RECOVERY_PREFLIGHT_LIVE_FLAG_FORBIDDEN",
      };
    }
    if (!VALUE_FLAGS.includes(token)) {
      return {
        ok: false,
        reason:
          "PART2_INSTAGRAM_RECOVERY_PREFLIGHT_UNKNOWN_ARGUMENT",
      };
    }
    const value = argv[index + 1];
    if (
      typeof value !== "string" ||
      value.length === 0 ||
      value.startsWith("--") ||
      Object.hasOwn(values, token)
    ) {
      return {
        ok: false,
        reason:
          "PART2_INSTAGRAM_RECOVERY_PREFLIGHT_ARGUMENT_VALUE_INVALID",
      };
    }
    values[token] = value;
    index += 1;
  }
  return {
    ok: true,
    inspection: values["--inspection"] ?? null,
    contentUnitPath: values["--content-unit"] ?? null,
    ledgerPath: values["--ledger"] ?? null,
    outDir: values["--out-dir"] ?? null,
    expectedContentId:
      values["--expected-content-id"] ?? null,
    expectedManifestSha256:
      values["--expected-manifest-sha256"] ?? null,
    expectedSourceSha256:
      values["--expected-source-sha256"] ?? null,
    expectedPublicationAttemptFingerprint:
      values[
        "--expected-publication-attempt-fingerprint"
      ] ?? null,
    expectedInstagramAccountId:
      values["--expected-instagram-account-id"] ?? null,
    expectedYoutubeChannelId:
      values["--expected-youtube-channel-id"] ?? null,
    expectedOriginalSafePreflightFingerprint:
      values[
        "--expected-original-safe-preflight-fingerprint"
      ] ?? null,
    expectedOriginalSafeClaimFingerprint:
      values[
        "--expected-original-safe-claim-fingerprint"
      ] ?? null,
    expectedOriginalSafeResultFingerprint:
      values[
        "--expected-original-safe-result-fingerprint"
      ] ?? null,
    expectedOriginalCanonicalResultFingerprint:
      values[
        "--expected-original-canonical-result-fingerprint"
      ] ?? null,
    expectedOriginalPlanFingerprint:
      values["--expected-original-plan-fingerprint"] ?? null,
    expectedOriginalSafePreflightFileSha256:
      values[
        "--expected-original-safe-preflight-file-sha256"
      ] ?? null,
    expectedOriginalSafeClaimFileSha256:
      values[
        "--expected-original-safe-claim-file-sha256"
      ] ?? null,
    expectedOriginalSafeResultFileSha256:
      values[
        "--expected-original-safe-result-file-sha256"
      ] ?? null,
    expectedOriginalSafeLatestEventSha256:
      values[
        "--expected-original-safe-latest-event-sha256"
      ] ?? null,
    expectedOriginalCanonicalAttemptClaimFileSha256:
      values[
        "--expected-original-canonical-attempt-claim-file-sha256"
      ] ?? null,
    expectedOriginalCanonicalLatestEventSha256:
      values[
        "--expected-original-canonical-latest-event-sha256"
      ] ?? null,
    expectedOriginalCanonicalResultFileSha256:
      values[
        "--expected-original-canonical-result-file-sha256"
      ] ?? null,
    expectedOriginalLedgerSha256:
      values["--expected-original-ledger-sha256"] ?? null,
    expectedOriginalBlobUrlSha256:
      values["--expected-original-blob-url-sha256"] ?? null,
    expectedOriginalRecoveryFingerprint:
      values[
        "--expected-original-recovery-fingerprint"
      ] ?? null,
  };
}

export function validateMoneyShortsPart2InstagramRecoveryInspection({
  parsed,
}) {
  const valid =
    parsed?.inspection ===
      MONEY_SHORTS_PART2_INSTAGRAM_RECOVERY_PREFLIGHT_INSPECTION &&
    strictString(parsed.expectedContentId).endsWith(
      "-part-2",
    ) &&
    SHA256_RE.test(
      strictString(parsed.expectedManifestSha256),
    ) &&
    SHA256_RE.test(
      strictString(parsed.expectedSourceSha256),
    ) &&
    SHA256_RE.test(
      strictString(
        parsed.expectedPublicationAttemptFingerprint,
      ),
    ) &&
    INSTAGRAM_ACCOUNT_ID_RE.test(
      strictString(parsed.expectedInstagramAccountId),
    ) &&
    YOUTUBE_CHANNEL_ID_RE.test(
      strictString(parsed.expectedYoutubeChannelId),
    ) &&
    [
      parsed.expectedOriginalSafePreflightFingerprint,
      parsed.expectedOriginalSafeClaimFingerprint,
      parsed.expectedOriginalSafeResultFingerprint,
      parsed.expectedOriginalCanonicalResultFingerprint,
      parsed.expectedOriginalPlanFingerprint,
      parsed.expectedOriginalSafePreflightFileSha256,
      parsed.expectedOriginalSafeClaimFileSha256,
      parsed.expectedOriginalSafeResultFileSha256,
      parsed.expectedOriginalSafeLatestEventSha256,
      parsed
        .expectedOriginalCanonicalAttemptClaimFileSha256,
      parsed.expectedOriginalCanonicalLatestEventSha256,
      parsed.expectedOriginalCanonicalResultFileSha256,
      parsed.expectedOriginalLedgerSha256,
      parsed.expectedOriginalBlobUrlSha256,
      parsed.expectedOriginalRecoveryFingerprint,
    ].every((value) => SHA256_RE.test(strictString(value)));
  return {
    ok: valid,
    reason: valid
      ? null
      : "PART2_INSTAGRAM_RECOVERY_PREFLIGHT_EXACT_INSPECTION_REQUIRED",
  };
}

function resolveInputPaths(parsed) {
  if (
    !parsed.contentUnitPath ||
    !parsed.ledgerPath ||
    !parsed.outDir ||
    !isAbsolute(parsed.contentUnitPath) ||
    !isAbsolute(parsed.ledgerPath) ||
    !isAbsolute(parsed.outDir)
  ) {
    return {
      ok: false,
      reason:
        "PART2_INSTAGRAM_RECOVERY_PREFLIGHT_ABSOLUTE_PATHS_REQUIRED",
    };
  }
  const paths = {
    contentUnitPath: resolve(parsed.contentUnitPath),
    ledgerPath: resolve(parsed.ledgerPath),
    outDir: resolve(parsed.outDir),
  };
  if (
    !outsideRepoExistingPath(paths.contentUnitPath) ||
    !outsideRepoExistingPath(paths.ledgerPath) ||
    !outsideRepoExistingPath(paths.outDir) ||
    !statSync(paths.outDir).isDirectory() ||
    dirname(paths.contentUnitPath).toLowerCase() !==
      paths.outDir.toLowerCase()
  ) {
    return {
      ok: false,
      reason:
        "PART2_INSTAGRAM_RECOVERY_PREFLIGHT_REAL_PATH_INVALID",
    };
  }
  return { ok: true, paths };
}

function readCommittedPair({
  path,
  fingerprintField,
  expectedFingerprint,
}) {
  const canonical = readJsonEvidence(path);
  if (
    canonical.parseOk !== true ||
    !validFingerprint(
      canonical.evidence,
      fingerprintField,
    ) ||
    canonical.evidence[fingerprintField] !==
      expectedFingerprint
  ) {
    return {
      ok: false,
      reason:
        "PART2_INSTAGRAM_RECOVERY_PREFLIGHT_FINGERPRINTED_EVIDENCE_INVALID",
    };
  }
  const committedPath =
    `${path}.${expectedFingerprint}.committed-source`;
  if (!existsSync(committedPath)) {
    return {
      ok: false,
      reason:
        "PART2_INSTAGRAM_RECOVERY_PREFLIGHT_COMMITTED_PAIR_MISSING",
    };
  }
  try {
    const committedBytes = readFileSync(committedPath);
    if (!canonical.bytes.equals(committedBytes)) {
      return {
        ok: false,
        reason:
          "PART2_INSTAGRAM_RECOVERY_PREFLIGHT_COMMITTED_PAIR_MISMATCH",
      };
    }
  } catch {
    return {
      ok: false,
      reason:
        "PART2_INSTAGRAM_RECOVERY_PREFLIGHT_COMMITTED_PAIR_UNREADABLE",
    };
  }
  return {
    ok: true,
    ...canonical,
    path,
    committedPath,
  };
}

function inspectSafePostRunEvidence({
  outDir,
  currentPlan,
  expected,
}) {
  const paths = moneyShortsPart2DualPublishSafePaths(outDir);
  const preflight = readCommittedPair({
    path: paths.preflightPath,
    fingerprintField: "preflightFingerprint",
    expectedFingerprint: expected.preflightFingerprint,
  });
  const claim = readCommittedPair({
    path: paths.claimPath,
    fingerprintField: "claimFingerprint",
    expectedFingerprint: expected.claimFingerprint,
  });
  const result = readCommittedPair({
    path: paths.resultPath,
    fingerprintField: "resultFingerprint",
    expectedFingerprint: expected.resultFingerprint,
  });
  if (!preflight.ok || !claim.ok || !result.ok) {
    return {
      ok: false,
      reason:
        preflight.reason ?? claim.reason ?? result.reason,
    };
  }
  const preflightValidation =
    validateMoneyShortsPart2DualPublishSafePreflight({
      evidence: preflight.evidence,
      currentPlan,
      expectedPreflightFingerprint:
        expected.preflightFingerprint,
    });
  const claimEvidence = claim.evidence;
  const resultEvidence = result.evidence;
  const claimValidation =
    validateMoneyShortsPart2InstagramRecoverySafeClaimEnvelope(
      {
        claim: claimEvidence,
        currentPlan,
        expectedClaimFingerprint:
          expected.claimFingerprint,
        expectedPreflightFingerprint:
          expected.preflightFingerprint,
      },
    );
  if (
    preflightValidation.valid !== true ||
    claimValidation.valid !== true ||
    resultEvidence.claimFingerprint !==
      expected.claimFingerprint ||
    resultEvidence.planFingerprint !==
      currentPlan.planFingerprint ||
    resultEvidence.preflightFingerprint !==
      expected.preflightFingerprint
  ) {
    return {
      ok: false,
      reason:
        "PART2_INSTAGRAM_RECOVERY_PREFLIGHT_SAFE_BINDING_INVALID",
    };
  }

  const expectedRootNames = new Set([
    basename(paths.preflightPath),
    `${basename(paths.preflightPath)}.${expected.preflightFingerprint}.committed-source`,
    basename(paths.claimPath),
    `${basename(paths.claimPath)}.${expected.claimFingerprint}.committed-source`,
    basename(paths.resultPath),
    `${basename(paths.resultPath)}.${expected.resultFingerprint}.committed-source`,
    basename(paths.eventDir),
  ]);
  let rootEntries;
  try {
    rootEntries = readdirSync(paths.evidenceDir, {
      withFileTypes: true,
    });
  } catch {
    return {
      ok: false,
      reason:
        "PART2_INSTAGRAM_RECOVERY_PREFLIGHT_SAFE_DIRECTORY_UNREADABLE",
    };
  }
  if (
    rootEntries.length !== expectedRootNames.size ||
    rootEntries.some(
      (entry) =>
        !expectedRootNames.has(entry.name) ||
        (entry.name === basename(paths.eventDir)
          ? !entry.isDirectory()
          : !entry.isFile()),
    )
  ) {
    return {
      ok: false,
      reason:
        "PART2_INSTAGRAM_RECOVERY_PREFLIGHT_SAFE_DIRECTORY_NOT_EXACT",
    };
  }

  let eventEntries;
  try {
    eventEntries = readdirSync(paths.eventDir, {
      withFileTypes: true,
    });
  } catch {
    return {
      ok: false,
      reason:
        "PART2_INSTAGRAM_RECOVERY_PREFLIGHT_SAFE_EVENTS_UNREADABLE",
    };
  }
  const eventNames = EXPECTED_TRANSITIONS.map(
    (transition, index) =>
      `${String(index + 1).padStart(2, "0")}-${transition}.json`,
  );
  const eventPairs = [];
  let previousEvidenceSha256 = claim.sha256;
  for (
    let index = 0;
    index < EXPECTED_TRANSITIONS.length;
    index += 1
  ) {
    const path = moneyShortsPart2DualPublishSafeEventPath(
      paths.eventDir,
      EXPECTED_TRANSITIONS[index],
    );
    const event = readJsonEvidence(path);
    const eventFingerprint =
      event.evidence?.eventFingerprint;
    if (
      event.parseOk !== true ||
      !validFingerprint(
        event.evidence,
        "eventFingerprint",
      ) ||
      !SHA256_RE.test(strictString(eventFingerprint))
    ) {
      return {
        ok: false,
        reason:
          "PART2_INSTAGRAM_RECOVERY_PREFLIGHT_SAFE_EVENT_INVALID",
      };
    }
    const pair = readCommittedPair({
      path,
      fingerprintField: "eventFingerprint",
      expectedFingerprint: eventFingerprint,
    });
    const expectedPreviousTransition =
      index === 0
        ? null
        : EXPECTED_TRANSITIONS[index - 1];
    if (
      !pair.ok ||
      event.evidence.claimFingerprint !==
        expected.claimFingerprint ||
      event.evidence.transition !==
        EXPECTED_TRANSITIONS[index] ||
      event.evidence.previousTransition !==
        expectedPreviousTransition ||
      event.evidence.previousEvidenceSha256 !==
        previousEvidenceSha256 ||
      !validIso(event.evidence.recordedAtIso)
    ) {
      return {
        ok: false,
        reason:
          "PART2_INSTAGRAM_RECOVERY_PREFLIGHT_SAFE_EVENT_CHAIN_INVALID",
      };
    }
    eventPairs.push(pair);
    previousEvidenceSha256 = pair.sha256;
  }
  const allowedEventNames = new Set(
    eventPairs.flatMap((pair, index) => [
      eventNames[index],
      `${eventNames[index]}.${pair.evidence.eventFingerprint}.committed-source`,
    ]),
  );
  if (
    eventEntries.length !== allowedEventNames.size ||
    eventEntries.some(
      (entry) =>
        !entry.isFile() ||
        !allowedEventNames.has(entry.name),
    )
  ) {
    return {
      ok: false,
      reason:
        "PART2_INSTAGRAM_RECOVERY_PREFLIGHT_SAFE_EVENT_DIRECTORY_NOT_EXACT",
    };
  }
  if (
    resultEvidence.latestTransition !==
      EXPECTED_TRANSITIONS.at(-1) ||
    resultEvidence.latestEventSha256 !==
      previousEvidenceSha256
  ) {
    return {
      ok: false,
      reason:
        "PART2_INSTAGRAM_RECOVERY_PREFLIGHT_SAFE_RESULT_HEAD_INVALID",
    };
  }
  return {
    ok: true,
    paths,
    preflight,
    claim,
    result,
    eventPairs,
    eventCount: eventPairs.length,
    transitions: [...EXPECTED_TRANSITIONS],
    latestEventSha256: previousEvidenceSha256,
  };
}

export function normalizeMoneyShortsPart2InstagramContainerDiagnosticPair({
  safeInstagram,
  canonicalInstagram,
}) {
  const safeHas = Object.hasOwn(
    safeInstagram ?? {},
    "containerCreateDiagnostic",
  );
  const canonicalHas = Object.hasOwn(
    canonicalInstagram ?? {},
    "containerCreateDiagnostic",
  );
  if (!safeHas && !canonicalHas) {
    return { ok: true, value: "legacy_absent" };
  }
  if (safeHas !== canonicalHas) {
    return { ok: false, value: null };
  }
  const safeValue =
    safeInstagram.containerCreateDiagnostic;
  const canonicalValue =
    canonicalInstagram.containerCreateDiagnostic;
  if (safeValue === null && canonicalValue === null) {
    return { ok: true, value: "unavailable" };
  }
  if (
    !isPlainObject(safeValue) ||
    JSON.stringify(safeValue) !==
      JSON.stringify(canonicalValue)
  ) {
    return { ok: false, value: null };
  }
  const provider = safeValue.providerError;
  const allowedRoot = [
    "responseReceived",
    "httpStatus",
    "responseOk",
    "jsonParsed",
    "containerIdPresent",
    "providerError",
  ].sort();
  const allowedProvider = [
    "code",
    "errorSubcode",
    "type",
    "isTransient",
  ].sort();
  if (
    JSON.stringify(Object.keys(safeValue).sort()) !==
      JSON.stringify(allowedRoot) ||
    !isPlainObject(provider) ||
    JSON.stringify(Object.keys(provider).sort()) !==
      JSON.stringify(allowedProvider)
  ) {
    return { ok: false, value: null };
  }
  if (
    typeof safeValue.responseReceived !== "boolean" ||
    (safeValue.httpStatus !== null &&
      (!Number.isSafeInteger(safeValue.httpStatus) ||
        safeValue.httpStatus < 100 ||
        safeValue.httpStatus > 599)) ||
    (safeValue.responseOk !== null &&
      typeof safeValue.responseOk !== "boolean") ||
    typeof safeValue.jsonParsed !== "boolean" ||
    typeof safeValue.containerIdPresent !== "boolean" ||
    (provider.code !== null &&
      (!Number.isSafeInteger(provider.code) ||
        provider.code < 0)) ||
    (provider.errorSubcode !== null &&
      (!Number.isSafeInteger(provider.errorSubcode) ||
        provider.errorSubcode < 0)) ||
    (provider.type !== null &&
      ![
        "FacebookApiException",
        "GraphMethodException",
        "IGApiException",
        "OAuthException",
      ].includes(provider.type)) ||
    (provider.isTransient !== null &&
      typeof provider.isTransient !== "boolean")
  ) {
    return { ok: false, value: null };
  }
  const normalized = {
    state: "available",
    responseReceived: safeValue.responseReceived,
    httpStatus: safeValue.httpStatus,
    responseOk: safeValue.responseOk,
    jsonParsed: safeValue.jsonParsed,
    containerIdPresent: safeValue.containerIdPresent,
    providerError: {
      code: provider.code,
      errorSubcode: provider.errorSubcode,
      type: provider.type,
      isTransient: provider.isTransient,
    },
  };
  return validDiagnosticState(normalized)
    ? { ok: true, value: normalized }
    : { ok: false, value: null };
}

function safeHttpsBlobEvidence(value) {
  try {
    const url = new URL(value);
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      url.search ||
      url.hash
    ) {
      return null;
    }
    return {
      pathname: decodeURIComponent(url.pathname).replace(
        /^\/+/,
        "",
      ),
      urlSha256: sha256(value),
    };
  } catch {
    return null;
  }
}

function exactRecord(value, expected) {
  return (
    hasExactKeys(value, Object.keys(expected)) &&
    Object.entries(expected).every(
      ([key, expectedValue]) =>
        JSON.stringify(value[key]) ===
        JSON.stringify(expectedValue),
    )
  );
}

function validConfirmedIdentities(
  value,
  expectedInstagramAccountId,
  expectedYoutubeChannelId,
) {
  return (
    hasExactKeys(value, ["instagram", "youtube"]) &&
    exactRecord(value.instagram, {
      status: "confirmed",
      accountId: expectedInstagramAccountId,
    }) &&
    exactRecord(value.youtube, {
      status: "confirmed",
      channelId: expectedYoutubeChannelId,
    })
  );
}

function validFullBlobState(value, expectedBlobPathname) {
  const safeUrl = safeHttpsBlobEvidence(value?.url);
  return (
    hasExactKeys(value, [
      "status",
      "pathname",
      "url",
      "headStatus",
      "headContentType",
    ]) &&
    value.status === "uploaded" &&
    value.pathname === expectedBlobPathname &&
    safeUrl?.pathname === expectedBlobPathname &&
    value.headStatus === 200 &&
    typeof value.headContentType === "string" &&
    value.headContentType.startsWith("video/")
  );
}

function validPendingInstagramState(
  value,
  expectedOutcome,
  allowDiagnostic,
) {
  const keys = [
    "status",
    "outcome",
    "mediaId",
    "containerId",
    "lastStatusCode",
  ];
  const hasDiagnostic = Object.hasOwn(
    value ?? {},
    "containerCreateDiagnostic",
  );
  if (hasDiagnostic) keys.push("containerCreateDiagnostic");
  return (
    hasExactKeys(value, keys) &&
    (!hasDiagnostic || allowDiagnostic === true) &&
    value.status === "pending" &&
    value.outcome === expectedOutcome &&
    value.mediaId === null &&
    value.containerId === null &&
    value.lastStatusCode === null
  );
}

function validPendingYoutubeState(value, includeUrl) {
  const expected = {
    status: "pending",
    outcome: "not_started",
    videoId: null,
  };
  if (includeUrl) expected.url = null;
  return exactRecord(value, expected);
}

function validFullPendingLedgerState(
  value,
  expectedLedgerPath,
) {
  return exactRecord(value, {
    status: "pending",
    path: expectedLedgerPath,
    recordedKeys: [],
    writeOk: false,
    readbackOk: false,
    writeLockReleased: null,
  });
}

/**
 * Validates the exact post-container-no-id public result shared by the safe
 * and canonical evidence files. No "published" or ledger-written state can
 * coexist with the ambiguous outcome.
 */
export function validateMoneyShortsPart2InstagramRecoveryFinalExecutionState({
  safePublicState,
  canonicalExecutionResult,
  expectedInstagramAccountId,
  expectedYoutubeChannelId,
  expectedLedgerPath,
  expectedBlobPathname,
}) {
  const valid =
    JSON.stringify(safePublicState) ===
      JSON.stringify(canonicalExecutionResult) &&
    hasExactKeys(safePublicState, [
      "identities",
      "blob",
      "instagram",
      "youtube",
      "ledger",
    ]) &&
    validConfirmedIdentities(
      safePublicState.identities,
      expectedInstagramAccountId,
      expectedYoutubeChannelId,
    ) &&
    validFullBlobState(
      safePublicState.blob,
      expectedBlobPathname,
    ) &&
    validPendingInstagramState(
      safePublicState.instagram,
      "unknown",
      true,
    ) &&
    validPendingYoutubeState(
      safePublicState.youtube,
      true,
    ) &&
    validFullPendingLedgerState(
      safePublicState.ledger,
      expectedLedgerPath,
    );
  return {
    valid,
    reason: valid
      ? "part2_instagram_recovery_final_state_valid"
      : "part2_instagram_recovery_final_state_invalid",
  };
}

/**
 * Validates the last immutable intent event. At this point the container call
 * has not yet been counted, so both journals must still show not_started.
 */
export function validateMoneyShortsPart2InstagramRecoveryIntentState({
  safeEvent,
  canonicalEvent,
  expectedInstagramAccountId,
  expectedYoutubeChannelId,
  expectedLedgerPath,
  expectedBlobPathname,
}) {
  const safePublicState = safeEvent?.publicState;
  const canonicalState = canonicalEvent?.state;
  const safeCounters = safeEvent?.sideEffectCounters;
  const canonicalCounters =
    canonicalState?.sideEffectCounters;
  const valid =
    hasExactKeys(safePublicState, [
      "identities",
      "blob",
      "instagram",
      "youtube",
      "ledger",
    ]) &&
    validConfirmedIdentities(
      safePublicState.identities,
      expectedInstagramAccountId,
      expectedYoutubeChannelId,
    ) &&
    validFullBlobState(
      safePublicState.blob,
      expectedBlobPathname,
    ) &&
    validPendingInstagramState(
      safePublicState.instagram,
      "not_started",
      false,
    ) &&
    validPendingYoutubeState(
      safePublicState.youtube,
      true,
    ) &&
    validFullPendingLedgerState(
      safePublicState.ledger,
      expectedLedgerPath,
    ) &&
    exactRecord(safeCounters, {
      instagramIdentityVerificationCount: 1,
      youtubeChannelVerificationCount: 1,
      blobPutCount: 1,
      blobHeadCount: 1,
      instagramContainerCreateCount: 0,
      instagramStatusPollCount: 0,
      instagramPublishCount: 0,
      youtubeInsertCount: 0,
      ledgerWriteCount: 0,
      credentialReadCount: 6,
      externalApiInvocationCount: 4,
      evidenceWriteCount: 12,
      databaseMutationCount: 0,
      part1ActionCount: 0,
      automaticRetryCount: 0,
      credentialValuePrintCount: 0,
    }) &&
    hasExactKeys(canonicalState, [
      "sideEffectCounters",
      "blob",
      "instagram",
      "youtube",
      "ledger",
    ]) &&
    exactRecord(canonicalCounters, {
      blobPutCount: 1,
      blobHeadCount: 1,
      instagramContainerCreateCount: 0,
      instagramStatusPollCount: 0,
      instagramPublishCount: 0,
      youtubeInsertCount: 0,
      ledgerWriteCount: 0,
      envSecretValuePrintCount: 0,
    }) &&
    exactRecord(canonicalState.blob, {
      status: "uploaded",
      pathname: expectedBlobPathname,
      headStatus: 200,
    }) &&
    validPendingInstagramState(
      canonicalState.instagram,
      "not_started",
      false,
    ) &&
    validPendingYoutubeState(
      canonicalState.youtube,
      false,
    ) &&
    exactRecord(canonicalState.ledger, {
      status: "pending",
      writeOk: false,
      recordedKeys: [],
    });
  return {
    valid,
    reason: valid
      ? "part2_instagram_recovery_intent_state_valid"
      : "part2_instagram_recovery_intent_state_invalid",
  };
}

/**
 * Validates the exact immutable envelopes around the safe and canonical
 * results. In particular, an ambiguous no-id failure cannot coexist with a
 * partial external id or a widened authorization object.
 */
export function validateMoneyShortsPart2InstagramRecoveryResultEnvelopes({
  safeResult,
  canonicalResult,
  currentBinding,
  plan,
  paths,
  expected,
}) {
  const safeAuthorization =
    canonicalResult?.safeAuthorization;
  const valid =
    hasExactKeys(safeResult, [
      "schemaVersion",
      "evidenceType",
      "status",
      "blockerCode",
      "completedAtIso",
      "claimFingerprint",
      "planFingerprint",
      "preflightFingerprint",
      "latestEventSha256",
      "latestTransition",
      "expectedInstagramAccountId",
      "expectedYoutubeChannelId",
      "publicState",
      "sideEffectCounters",
      "automaticRetryAllowed",
      "externalRecoveryEnabled",
      "part1ActionAllowed",
      "resultFingerprint",
    ]) &&
    safeResult.schemaVersion ===
      "money_shorts_part2_dual_platform_publish_safe_v1" &&
    safeResult.evidenceType === "result" &&
    safeResult.status ===
      "INSTAGRAM_CONTAINER_OUTCOME_UNKNOWN" &&
    safeResult.blockerCode ===
      "PART2_DUAL_SAFE_INSTAGRAM_CONTAINER_NO_ID" &&
    validIso(safeResult.completedAtIso) &&
    safeResult.claimFingerprint ===
      expected.safeClaimFingerprint &&
    safeResult.planFingerprint === plan.planFingerprint &&
    safeResult.preflightFingerprint ===
      expected.safePreflightFingerprint &&
    safeResult.latestEventSha256 ===
      expected.safeLatestEventSha256 &&
    safeResult.latestTransition ===
      "instagram_container_intent" &&
    safeResult.expectedInstagramAccountId ===
      plan.expectedInstagramAccountId &&
    safeResult.expectedYoutubeChannelId ===
      plan.expectedYoutubeChannelId &&
    safeResult.automaticRetryAllowed === false &&
    safeResult.externalRecoveryEnabled === false &&
    safeResult.part1ActionAllowed === false &&
    safeResult.resultFingerprint ===
      expected.safeResultFingerprint &&
    hasExactKeys(canonicalResult, [
      "schemaVersion",
      "approvalToken",
      "status",
      "blockerCode",
      "armed",
      "finishedAtIso",
      "contentUnitManifestPath",
      "ledgerPath",
      "envSecretValuesPrinted",
      "dotEnvLocalDirectRead",
      "sideEffectCounters",
      "contentId",
      "version",
      "wizardProductionPartId",
      "contentUnitSha256",
      "instagramSourceSha256",
      "youtubeSourceSha256",
      "publishMetadataSha256",
      "finalVideoApprovalFingerprint",
      "publicationAttemptFingerprint",
      "executionResult",
      "partialExternalState",
      "safeAuthorization",
      "resultFingerprint",
    ]) &&
    canonicalResult.schemaVersion ===
      "final_e2e_dual_platform_publish_result_v1" &&
    canonicalResult.approvalToken ===
      "APPROVE_MONEY_SHORTS_PART2_DUAL_PLATFORM_PUBLISH_SAFE_V1" &&
    canonicalResult.status === "FAILED" &&
    canonicalResult.blockerCode ===
      "PART2_DUAL_SAFE_INSTAGRAM_CONTAINER_NO_ID" &&
    canonicalResult.armed === true &&
    validIso(canonicalResult.finishedAtIso) &&
    canonicalResult.contentUnitManifestPath ===
      paths.contentUnitPath &&
    canonicalResult.ledgerPath === paths.ledgerPath &&
    canonicalResult.envSecretValuesPrinted === false &&
    canonicalResult.dotEnvLocalDirectRead === false &&
    canonicalResult.contentId === currentBinding.contentId &&
    canonicalResult.version === currentBinding.version &&
    canonicalResult.wizardProductionPartId === "part-2" &&
    canonicalResult.contentUnitSha256 ===
      currentBinding.contentUnitSha256 &&
    canonicalResult.instagramSourceSha256 ===
      currentBinding.instagramSourceSha256 &&
    canonicalResult.youtubeSourceSha256 ===
      currentBinding.youtubeSourceSha256 &&
    canonicalResult.publishMetadataSha256 ===
      currentBinding.publishMetadataSha256 &&
    canonicalResult.finalVideoApprovalFingerprint ===
      currentBinding.finalVideoApprovalFingerprint &&
    canonicalResult.publicationAttemptFingerprint ===
      plan.publicationAttemptFingerprint &&
    canonicalResult.partialExternalState === null &&
    exactRecord(safeAuthorization, {
      planFingerprint: plan.planFingerprint,
      preflightFingerprint:
        expected.safePreflightFingerprint,
      expectedInstagramAccountId:
        plan.expectedInstagramAccountId,
      expectedYoutubeChannelId:
        plan.expectedYoutubeChannelId,
      identityVerifiedBeforeMutation: true,
      blobSdkRetryCount: 0,
      youtubeRetryDisabled: true,
      automaticRetryCount: 0,
      part1ActionCount: 0,
    }) &&
    canonicalResult.resultFingerprint ===
      expected.canonicalResultFingerprint;
  return {
    valid,
    reason: valid
      ? "part2_instagram_recovery_result_envelopes_valid"
      : "part2_instagram_recovery_result_envelopes_invalid",
  };
}

export function validateMoneyShortsPart2InstagramRecoverySafeClaimEnvelope({
  claim,
  currentPlan,
  expectedClaimFingerprint,
  expectedPreflightFingerprint,
}) {
  const valid =
    hasExactKeys(claim, [
      "schemaVersion",
      "evidenceType",
      "armed",
      "claimId",
      "claimedAtIso",
      "planFingerprint",
      "preflightFingerprint",
      "currentBinding",
      "publicationAttemptFingerprint",
      "expectedInstagramAccountId",
      "expectedYoutubeChannelId",
      "ledgerBaselineSha256",
      "safety",
      "claimFingerprint",
    ]) &&
    claim.schemaVersion ===
      "money_shorts_part2_dual_platform_publish_safe_v1" &&
    claim.evidenceType === "claim" &&
    claim.armed === true &&
    /^[A-Za-z0-9._:-]{1,240}$/.test(
      strictString(claim.claimId),
    ) &&
    validIso(claim.claimedAtIso) &&
    claim.planFingerprint === currentPlan.planFingerprint &&
    claim.preflightFingerprint ===
      expectedPreflightFingerprint &&
    JSON.stringify(claim.currentBinding) ===
      JSON.stringify(currentPlan.currentBinding) &&
    claim.publicationAttemptFingerprint ===
      currentPlan.publicationAttemptFingerprint &&
    claim.expectedInstagramAccountId ===
      currentPlan.expectedInstagramAccountId &&
    claim.expectedYoutubeChannelId ===
      currentPlan.expectedYoutubeChannelId &&
    claim.ledgerBaselineSha256 ===
      currentPlan.ledgerBaselineSha256 &&
    JSON.stringify(claim.safety) ===
      JSON.stringify(currentPlan.safety) &&
    claim.claimFingerprint === expectedClaimFingerprint;
  return {
    valid,
    reason: valid
      ? "part2_instagram_recovery_safe_claim_envelope_valid"
      : "part2_instagram_recovery_safe_claim_envelope_invalid",
  };
}

function exactFailureCounters({
  safeCounters,
  canonicalCounters,
}) {
  if (
    !exactRecord(safeCounters, {
      instagramIdentityVerificationCount: 1,
      youtubeChannelVerificationCount: 1,
      blobPutCount: 1,
      blobHeadCount: 1,
      instagramContainerCreateCount: 1,
      instagramStatusPollCount: 0,
      instagramPublishCount: 0,
      youtubeInsertCount: 0,
      ledgerWriteCount: 0,
      credentialReadCount: 6,
      externalApiInvocationCount: 5,
      evidenceWriteCount: 13,
      databaseMutationCount: 0,
      part1ActionCount: 0,
      automaticRetryCount: 0,
      credentialValuePrintCount: 0,
    }) ||
    !exactRecord(canonicalCounters, {
      blobPutCount: 1,
      blobHeadCount: 1,
      instagramContainerCreateCount: 1,
      instagramStatusPollCount: 0,
      instagramPublishCount: 0,
      youtubeInsertCount: 0,
      ledgerWriteCount: 0,
      envSecretValuePrintCount: 0,
    })
  ) {
    return null;
  }
  const normalized = {
    blobPutCount: safeCounters?.blobPutCount,
    blobHeadCount: safeCounters?.blobHeadCount,
    instagramContainerCreateCount:
      safeCounters?.instagramContainerCreateCount,
    instagramStatusPollCount:
      safeCounters?.instagramStatusPollCount,
    instagramPublishCount:
      safeCounters?.instagramPublishCount,
    youtubeInsertCount:
      safeCounters?.youtubeInsertCount,
    ledgerWriteCount: safeCounters?.ledgerWriteCount,
    databaseMutationCount:
      safeCounters?.databaseMutationCount,
    part1ActionCount: safeCounters?.part1ActionCount,
    automaticRetryCount:
      safeCounters?.automaticRetryCount,
    credentialValuePrintCount:
      safeCounters?.credentialValuePrintCount,
  };
  return validFailureCounters(normalized)
    ? normalized
    : null;
}

function exactOutDirLayout({
  paths,
  canonicalResultFingerprint,
}) {
  const allowed = new Set([
    basename(paths.contentUnitPath),
    GENERIC_PREFLIGHT_FILENAME,
    CANONICAL_ATTEMPT_CLAIM_FILENAME,
    CANONICAL_ATTEMPT_JOURNAL_DIRNAME,
    CANONICAL_RESULT_FILENAME,
    `${CANONICAL_RESULT_FILENAME}.${canonicalResultFingerprint}.committed-source`,
    basename(
      moneyShortsPart2DualPublishSafePaths(
        paths.outDir,
      ).evidenceDir,
    ),
  ]);
  try {
    const entries = readdirSync(paths.outDir, {
      withFileTypes: true,
    });
    return (
      entries.length === allowed.size &&
      entries.every((entry) => {
        if (!allowed.has(entry.name)) return false;
        return [
          CANONICAL_ATTEMPT_JOURNAL_DIRNAME,
          basename(
            moneyShortsPart2DualPublishSafePaths(
              paths.outDir,
            ).evidenceDir,
          ),
        ].includes(entry.name)
          ? entry.isDirectory()
          : entry.isFile();
      })
    );
  } catch {
    return false;
  }
}

export function inspectMoneyShortsPart2InstagramRecoveryFacts({
  paths,
  context,
  expected,
}) {
  try {
    if (
      !exactOutDirLayout({
        paths,
        canonicalResultFingerprint:
          expected.canonicalResultFingerprint,
      })
    ) {
      return {
        ok: false,
        reason:
          "PART2_INSTAGRAM_RECOVERY_PREFLIGHT_OUTDIR_NOT_EXACT",
      };
    }
    const safe = inspectSafePostRunEvidence({
      outDir: paths.outDir,
      currentPlan: context.plan,
      expected: {
        preflightFingerprint:
          expected.safePreflightFingerprint,
        claimFingerprint: expected.safeClaimFingerprint,
        resultFingerprint:
          expected.safeResultFingerprint,
      },
    });
    if (!safe.ok) return safe;

    const canonicalResultPath = join(
      paths.outDir,
      CANONICAL_RESULT_FILENAME,
    );
    const canonicalResult = readCommittedPair({
      path: canonicalResultPath,
      fingerprintField: "resultFingerprint",
      expectedFingerprint:
        expected.canonicalResultFingerprint,
    });
    if (!canonicalResult.ok) return canonicalResult;
    const canonicalAttempt =
      inspectMoneyShortsPublishAttemptEvidence({
        outDir: paths.outDir,
        currentBinding: context.currentBinding,
      });
    const canonicalTransitions = canonicalAttempt.events.map(
      (event) => event.transition,
    );
    if (
      canonicalAttempt.exists !== true ||
      canonicalAttempt.valid !== true ||
      canonicalAttempt.safeToClaim !== false ||
      canonicalAttempt.reason !==
        "publish_attempt_manual_review_required" ||
      canonicalAttempt.events.length !==
        EXPECTED_TRANSITIONS.length ||
      !exactStringArray(
        canonicalTransitions,
        EXPECTED_TRANSITIONS,
      ) ||
      !SHA256_RE.test(
        strictString(
          canonicalAttempt.latestEvent?.eventSha256,
        ),
      )
    ) {
      return {
        ok: false,
        reason:
          "PART2_INSTAGRAM_RECOVERY_PREFLIGHT_CANONICAL_JOURNAL_INVALID",
      };
    }

    const canonical = canonicalResult.evidence;
    const safeResult = safe.result.evidence;
    const safeInstagram =
      safeResult.publicState?.instagram;
    const canonicalInstagram =
      canonical.executionResult?.instagram;
    const safeYoutube = safeResult.publicState?.youtube;
    const canonicalYoutube =
      canonical.executionResult?.youtube;
    const finalExecutionState =
      validateMoneyShortsPart2InstagramRecoveryFinalExecutionState(
        {
          safePublicState: safeResult.publicState,
          canonicalExecutionResult:
            canonical.executionResult,
          expectedInstagramAccountId:
            context.plan.expectedInstagramAccountId,
          expectedYoutubeChannelId:
            context.plan.expectedYoutubeChannelId,
          expectedLedgerPath: paths.ledgerPath,
          expectedBlobPathname:
            context.plan.blobPathname,
        },
      );
    const intentState =
      validateMoneyShortsPart2InstagramRecoveryIntentState(
        {
          safeEvent: safe.eventPairs.at(-1)?.evidence,
          canonicalEvent:
            canonicalAttempt.latestEvent,
          expectedInstagramAccountId:
            context.plan.expectedInstagramAccountId,
          expectedYoutubeChannelId:
            context.plan.expectedYoutubeChannelId,
          expectedLedgerPath: paths.ledgerPath,
          expectedBlobPathname:
            context.plan.blobPathname,
        },
      );
    const resultEnvelopes =
      validateMoneyShortsPart2InstagramRecoveryResultEnvelopes(
        {
          safeResult,
          canonicalResult: canonical,
          currentBinding: context.currentBinding,
          plan: context.plan,
          paths,
          expected: {
            ...expected,
            safeClaimFingerprint:
              expected.safeClaimFingerprint,
            safeLatestEventSha256:
              safe.latestEventSha256,
          },
        },
      );
    const diagnostic =
      normalizeMoneyShortsPart2InstagramContainerDiagnosticPair(
        {
          safeInstagram,
          canonicalInstagram,
        },
      );
    const counters = exactFailureCounters({
      safeCounters: safeResult.sideEffectCounters,
      canonicalCounters: canonical.sideEffectCounters,
    });
    const publishIntentObserved =
      canonicalTransitions.includes(
        "instagram_publish_intent",
      ) ||
      safe.transitions.includes(
        "instagram_publish_intent",
      );
    const containerConfirmedObserved =
      canonicalTransitions.includes(
        "instagram_container_confirmed",
      ) ||
      safe.transitions.includes(
        "instagram_container_confirmed",
      );
    if (
      canonical.schemaVersion !==
        "final_e2e_dual_platform_publish_result_v1" ||
      canonical.armed !== true ||
      canonical.contentId !==
        context.currentBinding.contentId ||
      canonical.version !== context.currentBinding.version ||
      canonical.wizardProductionPartId !== "part-2" ||
      canonical.publicationAttemptFingerprint !==
        context.plan.publicationAttemptFingerprint ||
      canonical.resultFingerprint !==
        expected.canonicalResultFingerprint ||
      canonical.envSecretValuesPrinted !== false ||
      canonical.dotEnvLocalDirectRead !== false ||
      canonical.safeAuthorization
        ?.identityVerifiedBeforeMutation !== true ||
      canonical.safeAuthorization?.automaticRetryCount !==
        0 ||
      canonical.safeAuthorization?.part1ActionCount !== 0 ||
      safeResult.automaticRetryAllowed !== false ||
      safeResult.externalRecoveryEnabled !== false ||
      safeResult.part1ActionAllowed !== false ||
      finalExecutionState.valid !== true ||
      intentState.valid !== true ||
      resultEnvelopes.valid !== true ||
      safeResult.status !==
        "INSTAGRAM_CONTAINER_OUTCOME_UNKNOWN" ||
      safeResult.blockerCode !==
        "PART2_DUAL_SAFE_INSTAGRAM_CONTAINER_NO_ID" ||
      canonical.status !== "FAILED" ||
      canonical.blockerCode !==
        "PART2_DUAL_SAFE_INSTAGRAM_CONTAINER_NO_ID" ||
      safeInstagram?.outcome !== "unknown" ||
      canonicalInstagram?.outcome !== "unknown" ||
      safeInstagram?.containerId !== null ||
      canonicalInstagram?.containerId !== null ||
      safeInstagram?.mediaId !== null ||
      canonicalInstagram?.mediaId !== null ||
      safeYoutube?.outcome !== "not_started" ||
      canonicalYoutube?.outcome !== "not_started" ||
      safeYoutube?.videoId !== null ||
      canonicalYoutube?.videoId !== null ||
      publishIntentObserved ||
      containerConfirmedObserved ||
      counters === null ||
      diagnostic.ok !== true
    ) {
      return {
        ok: false,
        reason:
          "PART2_INSTAGRAM_RECOVERY_PREFLIGHT_EXACT_FAILURE_BOUNDARY_INVALID",
      };
    }

    const safeBlob = safeResult.publicState?.blob;
    const canonicalBlob = canonical.executionResult?.blob;
    const blobUrl = safeHttpsBlobEvidence(safeBlob?.url);
    if (
      !blobUrl ||
      JSON.stringify(safeBlob) !==
        JSON.stringify(canonicalBlob) ||
      safeBlob.status !== "uploaded" ||
      safeBlob.pathname !== context.plan.blobPathname ||
      blobUrl.pathname !== context.plan.blobPathname ||
      safeBlob.headStatus !== 200 ||
      !strictString(safeBlob.headContentType).startsWith(
        "video/",
      )
    ) {
      return {
        ok: false,
        reason:
          "PART2_INSTAGRAM_RECOVERY_PREFLIGHT_BLOB_MISMATCH",
      };
    }

    const attemptEvidence = {
      present: true,
      journalValid: true,
      claimSha256:
        canonicalAttempt.claimFile.sha256,
      eventCount: canonicalAttempt.events.length,
      latestTransition:
        canonicalAttempt.latestEvent.transition,
      latestEventSha256:
        canonicalAttempt.latestEvent.eventSha256,
    };
    const recovery =
      classifyMoneyShortsPublishRecovery({
        resultFile: {
          exists: true,
          parseOk: true,
          sha256: canonicalResult.sha256,
          evidence: canonical,
        },
        attemptFile: canonicalAttempt.claimFile,
        attemptEvidence,
        currentBinding: context.currentBinding,
        ledgerEvidence: {
          readOk: context.ledger.ok === true,
          instagramAlreadyPublished:
            context.ledger.instagramRecord !== null,
          youtubeAlreadyPublished:
            context.ledger.youtubeRecord !== null,
          instagramPublishedIdReference:
            context.ledger.instagramRecord?.publishedId ??
            null,
          youtubePublishedIdReference:
            context.ledger.youtubeRecord?.publishedId ??
            null,
        },
      });
    if (
      context.ledger.clean !== true ||
      context.ledger.sha256 !==
        context.plan.ledgerBaselineSha256 ||
      recovery.state !== "ambiguous" ||
      recovery.reason !==
        "instagram_publish_outcome_unknown" ||
      recovery.recoverablePlatformCandidate !== null ||
      recovery.automaticRetryAllowed !== false ||
      recovery.externalRecoveryEnabled !== false
    ) {
      return {
        ok: false,
        reason:
          "PART2_INSTAGRAM_RECOVERY_PREFLIGHT_RECOVERY_STATE_INVALID",
      };
    }

    const facts = {
      currentBinding: context.currentBinding,
      originalPlanFingerprint:
        context.plan.planFingerprint,
      originalPublicationAttemptFingerprint:
        context.plan.publicationAttemptFingerprint,
      expectedInstagramAccountId:
        context.plan.expectedInstagramAccountId,
      expectedYoutubeChannelId:
        context.plan.expectedYoutubeChannelId,
      originalEvidence: {
        safePreflightFileSha256:
          safe.preflight.sha256,
        safePreflightFingerprint:
          safe.preflight.evidence.preflightFingerprint,
        safeClaimFileSha256: safe.claim.sha256,
        safeClaimFingerprint:
          safe.claim.evidence.claimFingerprint,
        safeResultFileSha256: safe.result.sha256,
        safeResultFingerprint:
          safe.result.evidence.resultFingerprint,
        canonicalAttemptClaimFileSha256:
          canonicalAttempt.claimFile.sha256,
        canonicalLatestEventSha256:
          canonicalAttempt.latestEvent.eventSha256,
        canonicalResultFileSha256:
          canonicalResult.sha256,
        canonicalResultFingerprint:
          canonical.resultFingerprint,
      },
      safeEvidenceValid: true,
      canonicalEvidenceValid: true,
      safeJournal: {
        valid: true,
        eventCount: safe.eventCount,
        transitions: safe.transitions,
        latestEventSha256:
          safe.latestEventSha256,
      },
      canonicalJournal: {
        valid: true,
        eventCount: canonicalAttempt.events.length,
        transitions: canonicalTransitions,
        latestEventSha256:
          canonicalAttempt.latestEvent.eventSha256,
      },
      failure: {
        safeStatus: safeResult.status,
        canonicalStatus: canonical.status,
        safeBlockerCode: safeResult.blockerCode,
        canonicalBlockerCode: canonical.blockerCode,
        instagramOutcome:
          canonicalInstagram.outcome,
        instagramContainerId:
          canonicalInstagram.containerId,
        instagramMediaId:
          canonicalInstagram.mediaId,
        youtubeOutcome: canonicalYoutube.outcome,
        youtubeVideoId: canonicalYoutube.videoId,
        publishIntentObserved,
        containerConfirmedObserved,
        diagnosticState: diagnostic.value,
        counters,
      },
      priorAuthorizationConsumed: true,
      ledger: {
        readOk: true,
        clean: true,
        instagramAlreadyPublished: false,
        youtubeAlreadyPublished: false,
        sha256: context.ledger.sha256,
        originalBaselineSha256:
          context.plan.ledgerBaselineSha256,
      },
      blob: {
        evidenceConsistent: true,
        status: safeBlob.status,
        pathname: safeBlob.pathname,
        urlSha256: blobUrl.urlSha256,
        priorHeadStatus: safeBlob.headStatus,
        priorHeadContentType:
          safeBlob.headContentType,
        liveHeadChecked: false,
      },
      recovery: {
        state: recovery.state,
        reason: recovery.reason,
        recoveryFingerprint:
          recovery.recoveryFingerprint,
        recoverablePlatformCandidate:
          recovery.recoverablePlatformCandidate,
        automaticRetryAllowed:
          recovery.automaticRetryAllowed,
        externalRecoveryEnabled:
          recovery.externalRecoveryEnabled,
      },
    };
    return { ok: true, facts };
  } catch {
    return {
      ok: false,
      reason:
        "PART2_INSTAGRAM_RECOVERY_PREFLIGHT_LOCAL_INSPECTION_FAILED",
    };
  }
}

function sourceSnapshotFromFacts(facts) {
  return {
    originalPlanFingerprint:
      facts?.originalPlanFingerprint,
    safePreflightFileSha256:
      facts?.originalEvidence?.safePreflightFileSha256,
    safeClaimFileSha256:
      facts?.originalEvidence?.safeClaimFileSha256,
    safeResultFileSha256:
      facts?.originalEvidence?.safeResultFileSha256,
    safeLatestEventSha256:
      facts?.safeJournal?.latestEventSha256,
    canonicalAttemptClaimFileSha256:
      facts?.originalEvidence
        ?.canonicalAttemptClaimFileSha256,
    canonicalLatestEventSha256:
      facts?.canonicalJournal?.latestEventSha256,
    canonicalResultFileSha256:
      facts?.originalEvidence?.canonicalResultFileSha256,
    ledgerSha256: facts?.ledger?.sha256,
    blobUrlSha256: facts?.blob?.urlSha256,
    recoveryFingerprint:
      facts?.recovery?.recoveryFingerprint,
  };
}

function expectedSourceSnapshotFromParsed(parsed) {
  return {
    originalPlanFingerprint:
      parsed.expectedOriginalPlanFingerprint,
    safePreflightFileSha256:
      parsed.expectedOriginalSafePreflightFileSha256,
    safeClaimFileSha256:
      parsed.expectedOriginalSafeClaimFileSha256,
    safeResultFileSha256:
      parsed.expectedOriginalSafeResultFileSha256,
    safeLatestEventSha256:
      parsed.expectedOriginalSafeLatestEventSha256,
    canonicalAttemptClaimFileSha256:
      parsed
        .expectedOriginalCanonicalAttemptClaimFileSha256,
    canonicalLatestEventSha256:
      parsed.expectedOriginalCanonicalLatestEventSha256,
    canonicalResultFileSha256:
      parsed.expectedOriginalCanonicalResultFileSha256,
    ledgerSha256: parsed.expectedOriginalLedgerSha256,
    blobUrlSha256: parsed.expectedOriginalBlobUrlSha256,
    recoveryFingerprint:
      parsed.expectedOriginalRecoveryFingerprint,
  };
}

function stableInspectionSnapshot(context, facts) {
  return {
    currentBinding: context?.currentBinding,
    plan: context?.plan,
    ledger: {
      sha256: context?.ledger?.sha256,
      clean: context?.ledger?.clean,
      instagramRecord:
        context?.ledger?.instagramRecord ?? null,
      youtubeRecord:
        context?.ledger?.youtubeRecord ?? null,
    },
    facts,
  };
}

async function runMoneyShortsPart2InstagramRecoveryPreflightWithDependencies({
  argv,
  pathsResolver,
  contextInspector,
  factsInspector,
}) {
  const parsed =
    parseMoneyShortsPart2InstagramRecoveryPreflightArgs(
      argv,
    );
  if (!parsed.ok) return parsed;
  const inspection =
    validateMoneyShortsPart2InstagramRecoveryInspection({
      parsed,
    });
  if (!inspection.ok) return inspection;
  const resolved = pathsResolver(parsed);
  if (!resolved.ok) return resolved;

  const authorization = {
    expectedContentId: parsed.expectedContentId,
    expectedManifestSha256:
      parsed.expectedManifestSha256,
    expectedSourceSha256: parsed.expectedSourceSha256,
    expectedPublicationAttemptFingerprint:
      parsed.expectedPublicationAttemptFingerprint,
    expectedInstagramAccountId:
      parsed.expectedInstagramAccountId,
    expectedYoutubeChannelId:
      parsed.expectedYoutubeChannelId,
  };
  const context = contextInspector({
    paths: resolved.paths,
    authorization,
  });
  if (!context.ok) return context;
  const inspected = factsInspector({
    paths: resolved.paths,
    context,
    expected: {
      safePreflightFingerprint:
        parsed.expectedOriginalSafePreflightFingerprint,
      safeClaimFingerprint:
        parsed.expectedOriginalSafeClaimFingerprint,
      safeResultFingerprint:
        parsed.expectedOriginalSafeResultFingerprint,
      canonicalResultFingerprint:
        parsed.expectedOriginalCanonicalResultFingerprint,
    },
  });
  if (!inspected.ok) return inspected;
  const exactSourceSnapshot =
    sourceSnapshotFromFacts(inspected.facts);
  const expectedSourceSnapshot =
    expectedSourceSnapshotFromParsed(parsed);
  if (
    JSON.stringify(exactSourceSnapshot) !==
    JSON.stringify(expectedSourceSnapshot)
  ) {
    return {
      ok: false,
      reason:
        "PART2_INSTAGRAM_RECOVERY_PREFLIGHT_SOURCE_SNAPSHOT_MISMATCH",
    };
  }

  const stableContext = contextInspector({
    paths: resolved.paths,
    authorization,
  });
  if (!stableContext.ok) {
    return {
      ok: false,
      reason:
        "PART2_INSTAGRAM_RECOVERY_PREFLIGHT_SOURCE_DRIFT_DETECTED",
    };
  }
  const stableInspected = factsInspector({
    paths: resolved.paths,
    context: stableContext,
    expected: {
      safePreflightFingerprint:
        parsed.expectedOriginalSafePreflightFingerprint,
      safeClaimFingerprint:
        parsed.expectedOriginalSafeClaimFingerprint,
      safeResultFingerprint:
        parsed.expectedOriginalSafeResultFingerprint,
      canonicalResultFingerprint:
        parsed.expectedOriginalCanonicalResultFingerprint,
    },
  });
  if (
    !stableInspected.ok ||
    JSON.stringify(
      stableInspectionSnapshot(context, inspected.facts),
    ) !==
      JSON.stringify(
        stableInspectionSnapshot(
          stableContext,
          stableInspected.facts,
        ),
      ) ||
    JSON.stringify(
      sourceSnapshotFromFacts(stableInspected.facts),
    ) !== JSON.stringify(expectedSourceSnapshot)
  ) {
    return {
      ok: false,
      reason:
        "PART2_INSTAGRAM_RECOVERY_PREFLIGHT_SOURCE_DRIFT_DETECTED",
    };
  }
  const planResult =
    buildMoneyShortsPart2InstagramRecoveryReviewPlan(
      stableInspected.facts,
    );
  if (!planResult.ok) return planResult;
  const preflight =
    buildMoneyShortsPart2InstagramRecoveryPreflight({
      plan: planResult.plan,
    });
  if (!preflight) {
    return {
      ok: false,
      reason:
        "PART2_INSTAGRAM_RECOVERY_PREFLIGHT_BUILD_FAILED",
    };
  }
  return {
    ok: true,
    status: "LOCAL_RECOVERY_REVIEW_OK",
    mode: "code_only_dry_run",
    armed: false,
    localEvidenceEligible: true,
    readyForOwnerReview: true,
    readyForActualExecution: false,
    ownerApprovalRequired: true,
    safeToRetry: false,
    safeToPublish: false,
    contentId:
      planResult.plan.currentBinding.contentId,
    sourceSha256:
      planResult.plan.currentBinding
        .instagramSourceSha256,
    expectedInstagramAccountId:
      planResult.plan.expectedInstagramAccountId,
    sourceEvidenceBundleFingerprint:
      planResult.plan.sourceEvidenceBundleFingerprint,
    recoveryPlanFingerprint:
      planResult.plan.recoveryPlanFingerprint,
    preflightFingerprint:
      preflight.preflightFingerprint,
    pendingGates: [...planResult.plan.pendingGates],
    sideEffectCounters:
      preflight.sideEffectCounters,
    noLiveActions: true,
    preflight,
  };
}

/**
 * Production entry: the read-only filesystem inspectors are fixed and cannot
 * be replaced by callers.
 */
export async function runMoneyShortsPart2InstagramRecoveryPreflight({
  argv,
}) {
  return runMoneyShortsPart2InstagramRecoveryPreflightWithDependencies(
    {
      argv,
      pathsResolver: resolveInputPaths,
      contextInspector:
        inspectMoneyShortsPart2DualPublishSafeCurrentContext,
      factsInspector:
        inspectMoneyShortsPart2InstagramRecoveryFacts,
    },
  );
}

/**
 * Test-only orchestration seam. Production code and CLI never call this.
 */
export async function runMoneyShortsPart2InstagramRecoveryPreflightTestOnly({
  argv,
  pathsResolver,
  contextInspector,
  factsInspector,
}) {
  return runMoneyShortsPart2InstagramRecoveryPreflightWithDependencies(
    {
      argv,
      pathsResolver,
      contextInspector,
      factsInspector,
    },
  );
}

async function main() {
  const result =
    await runMoneyShortsPart2InstagramRecoveryPreflight({
      argv: process.argv.slice(2),
    });
  console.log(JSON.stringify(result, null, 2));
  process.exitCode = result.ok === true ? 0 : 1;
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === resolve(SCRIPT_PATH)
) {
  await main();
}
