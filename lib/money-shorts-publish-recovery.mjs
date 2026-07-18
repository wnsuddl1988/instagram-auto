import { createHash } from "node:crypto";

import {
  fingerprintMoneyShortsPublishAttemptBinding,
  normalizeMoneyShortsPublishAttemptBinding,
  validateMoneyShortsPublishAttemptClaimEvidence,
} from "./money-shorts-publish-attempt-journal.mjs";

export const MONEY_SHORTS_PUBLISH_RECOVERY_VERSION =
  "money_shorts_publish_recovery_classification_v1";

const RESULT_SCHEMA = "final_e2e_dual_platform_publish_result_v1";
const RESULT_STATUSES = new Set([
  "BLOCKED",
  "FAILED",
  "PUBLISHED_DUAL_PLATFORM_OK",
]);
const SHA256_RE = /^[a-f0-9]{64}$/;

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function strictString(value) {
  return typeof value === "string" ? value : "";
}

function isPlainObject(value) {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function normalizeBinding(value) {
  return {
    contentId: strictString(value?.contentId),
    version: strictString(value?.version),
    productionPartId: strictString(value?.productionPartId),
    contentUnitManifestPath: strictString(
      value?.contentUnitManifestPath,
    ),
    contentUnitSha256: strictString(value?.contentUnitSha256),
    instagramSourceSha256: strictString(
      value?.instagramSourceSha256,
    ),
    youtubeSourceSha256: strictString(
      value?.youtubeSourceSha256,
    ),
    publishMetadataSha256: strictString(
      value?.publishMetadataSha256,
    ),
    finalVideoApprovalFingerprint: strictString(
      value?.finalVideoApprovalFingerprint,
    ),
  };
}

function validBinding(binding) {
  return (
    binding.contentId.length > 0 &&
    binding.version.length > 0 &&
    /^(single|part-1|part-2)$/.test(binding.productionPartId) &&
    binding.contentUnitManifestPath.length > 0 &&
    SHA256_RE.test(binding.contentUnitSha256) &&
    SHA256_RE.test(binding.instagramSourceSha256) &&
    SHA256_RE.test(binding.youtubeSourceSha256) &&
    SHA256_RE.test(binding.publishMetadataSha256) &&
    SHA256_RE.test(binding.finalVideoApprovalFingerprint)
  );
}

function normalizeCounters(value) {
  const strictCounter = (candidate) =>
    typeof candidate === "number" ? candidate : Number.NaN;
  return {
    blobPutCount: strictCounter(value?.blobPutCount),
    blobHeadCount: strictCounter(value?.blobHeadCount),
    instagramContainerCreateCount: strictCounter(
      value?.instagramContainerCreateCount,
    ),
    instagramStatusPollCount: strictCounter(
      value?.instagramStatusPollCount,
    ),
    instagramPublishCount: strictCounter(
      value?.instagramPublishCount,
    ),
    youtubeInsertCount: strictCounter(value?.youtubeInsertCount),
    ledgerWriteCount: strictCounter(value?.ledgerWriteCount),
    envSecretValuePrintCount: strictCounter(
      value?.envSecretValuePrintCount,
    ),
  };
}

function validCounters(counters) {
  return Object.values(counters).every(
    (value) => Number.isSafeInteger(value) && value >= 0,
  );
}

function noSideEffects(counters) {
  return Object.values(counters).every((value) => value === 0);
}

function validLedgerEvidenceShape(value) {
  if (!isPlainObject(value)) return false;
  if (
    typeof value.readOk !== "boolean" ||
    typeof value.instagramAlreadyPublished !== "boolean" ||
    typeof value.youtubeAlreadyPublished !== "boolean"
  ) {
    return false;
  }
  const idMatchesState = (published, id) =>
    published
      ? typeof id === "string" && id.length > 0
      : id === null;
  return (
    idMatchesState(
      value.instagramAlreadyPublished,
      value.instagramPublishedIdReference,
    ) &&
    idMatchesState(
      value.youtubeAlreadyPublished,
      value.youtubePublishedIdReference,
    )
  );
}

function resultBinding(evidence) {
  return normalizeBinding({
    contentId: evidence?.contentId,
    version: evidence?.version,
    productionPartId: evidence?.wizardProductionPartId,
    contentUnitManifestPath: evidence?.contentUnitManifestPath,
    contentUnitSha256: evidence?.contentUnitSha256,
    instagramSourceSha256: evidence?.instagramSourceSha256,
    youtubeSourceSha256: evidence?.youtubeSourceSha256,
    publishMetadataSha256: evidence?.publishMetadataSha256,
    finalVideoApprovalFingerprint:
      evidence?.finalVideoApprovalFingerprint,
  });
}

function attemptFingerprint(binding) {
  return fingerprintMoneyShortsPublishAttemptBinding(binding);
}

function buildPlan({
  state,
  reason,
  resultSha256,
  currentBinding,
  instagramMediaId = null,
  youtubeVideoId = null,
  ledgerEvidence,
  attemptEvidencePresent = false,
  attemptClaimSha256 = null,
}) {
  const manualRecoveryRequired = ![
    "not_started",
    "complete",
  ].includes(state);
  const stable = {
    schemaVersion: MONEY_SHORTS_PUBLISH_RECOVERY_VERSION,
    state,
    reason,
    resultSha256:
      typeof resultSha256 === "string" &&
      SHA256_RE.test(resultSha256)
        ? resultSha256
        : null,
    attemptEvidencePresent,
    attemptClaimSha256:
      typeof attemptClaimSha256 === "string" &&
      SHA256_RE.test(attemptClaimSha256)
        ? attemptClaimSha256
        : null,
    currentBinding: normalizeBinding(currentBinding),
    instagramMediaId,
    youtubeVideoId,
    ledger: {
      readOk: ledgerEvidence?.readOk === true,
      instagramAlreadyPublished:
        ledgerEvidence?.instagramAlreadyPublished === true,
      youtubeAlreadyPublished:
        ledgerEvidence?.youtubeAlreadyPublished === true,
      instagramPublishedIdReference:
        typeof ledgerEvidence?.instagramPublishedIdReference === "string"
          ? ledgerEvidence.instagramPublishedIdReference
          : null,
      youtubePublishedIdReference:
        typeof ledgerEvidence?.youtubePublishedIdReference === "string"
          ? ledgerEvidence.youtubePublishedIdReference
          : null,
    },
    manualRecoveryRequired,
    genericDualUploadBlocked:
      state !== "not_started",
    automaticRetryAllowed: false,
    externalRecoveryEnabled: false,
    recoverablePlatformCandidate:
      state === "instagram_only"
        ? "youtube_shorts"
        : null,
  };
  return {
    ...stable,
    recoveryFingerprint:
      state === "not_started"
        ? null
        : sha256(JSON.stringify(stable)),
    safety: {
      blobMutationAllowed: false,
      instagramPublishAllowed: false,
      youtubePublishAllowed: false,
      ledgerMutationAllowed: false,
      automaticRetryCount: 0,
      externalActionCount: 0,
    },
  };
}

/**
 * Existing armed result + current full-hash binding + ledger truth -> a pure,
 * no-action recovery classification. It never reads files/env, writes state,
 * calls a network service, retries, uploads, or publishes.
 * @param {{resultFile: any, attemptFile?: any, currentBinding: any, ledgerEvidence: any}} input
 */
export function classifyMoneyShortsPublishRecovery(input) {
  const {
    resultFile,
    attemptFile = null,
    currentBinding,
    ledgerEvidence,
  } = input;
  const current = normalizeBinding(currentBinding);
  const attemptExists = attemptFile?.exists === true;
  const attemptClaimSha256 =
    typeof attemptFile?.sha256 === "string"
      ? attemptFile.sha256
      : null;
  const plan = (input) =>
    buildPlan({
      ...input,
      attemptEvidencePresent: attemptExists,
      attemptClaimSha256,
    });
  const ledgerShapeValid =
    validLedgerEvidenceShape(ledgerEvidence);
  const resultExists = resultFile?.exists === true;
  let attemptValidation = null;
  if (attemptExists) {
    if (
      attemptFile?.parseOk !== true ||
      !isPlainObject(attemptFile?.evidence) ||
      !SHA256_RE.test(String(attemptClaimSha256 ?? ""))
    ) {
      return plan({
        state: "ambiguous",
        reason: "attempt_journal_unreadable_or_unhashed",
        resultSha256: null,
        currentBinding: current,
        ledgerEvidence,
      });
    }
    attemptValidation =
      validateMoneyShortsPublishAttemptClaimEvidence({
        evidence: attemptFile.evidence,
        currentBinding: current,
      });
    if (attemptValidation.valid !== true) {
      return plan({
        state: "invalid_evidence",
        reason:
          "attempt_journal_schema_or_artifact_binding_invalid",
        resultSha256: null,
        currentBinding: current,
        ledgerEvidence,
      });
    }
  }
  if (!resultExists) {
    if (attemptExists) {
      return plan({
        state: "ambiguous",
        reason: "armed_attempt_claim_present_result_missing",
        resultSha256: null,
        currentBinding: current,
        ledgerEvidence,
      });
    }
    if (
      !ledgerShapeValid ||
      ledgerEvidence?.readOk !== true ||
      ledgerEvidence?.instagramAlreadyPublished === true ||
      ledgerEvidence?.youtubeAlreadyPublished === true
    ) {
      return plan({
        state: "ambiguous",
        reason: "result_missing_ledger_not_clean",
        resultSha256: null,
        currentBinding: current,
        ledgerEvidence,
      });
    }
    return plan({
      state: "not_started",
      reason: "no_armed_result_and_clean_ledger",
      resultSha256: null,
      currentBinding: current,
      ledgerEvidence,
    });
  }

  const resultSha256 =
    typeof resultFile?.sha256 === "string"
      ? resultFile.sha256
      : null;
  const evidence = resultFile?.evidence;
  if (
    resultFile?.parseOk !== true ||
    !evidence ||
    typeof evidence !== "object" ||
    Array.isArray(evidence) ||
    !SHA256_RE.test(String(resultSha256 ?? ""))
  ) {
    return plan({
      state: "ambiguous",
      reason: "armed_result_unreadable_or_unhashed",
      resultSha256,
      currentBinding: current,
      ledgerEvidence,
    });
  }

  const executionResult = evidence.executionResult;
  const instagramResult = isPlainObject(executionResult)
    ? executionResult.instagram
    : undefined;
  const youtubeResult = isPlainObject(executionResult)
    ? executionResult.youtube
    : undefined;
  const executionShapeValid =
    (executionResult === undefined ||
      isPlainObject(executionResult)) &&
    (instagramResult === undefined ||
      isPlainObject(instagramResult)) &&
    (youtubeResult === undefined ||
      isPlainObject(youtubeResult));
  const counters = normalizeCounters(evidence.sideEffectCounters);
  const bound = resultBinding(evidence);
  if (
    attemptValidation?.valid === true &&
    (evidence.publicationAttemptFingerprint !==
      attemptValidation.publicationAttemptFingerprint ||
      JSON.stringify(bound) !==
        JSON.stringify(
          normalizeMoneyShortsPublishAttemptBinding(
            attemptFile.evidence.binding,
          ),
        ))
  ) {
    return plan({
      state: "invalid_evidence",
      reason: "result_and_attempt_journal_conflict",
      resultSha256,
      currentBinding: current,
      ledgerEvidence,
    });
  }
  if (
    evidence.schemaVersion !== RESULT_SCHEMA ||
    evidence.armed !== true ||
    !RESULT_STATUSES.has(evidence.status) ||
    evidence.envSecretValuesPrinted !== false ||
    evidence.dotEnvLocalDirectRead !== false ||
    !validBinding(current) ||
    !validBinding(bound) ||
    JSON.stringify(bound) !== JSON.stringify(current) ||
    evidence.publicationAttemptFingerprint !==
      attemptFingerprint(bound) ||
    !executionShapeValid ||
    !validCounters(counters) ||
    counters.envSecretValuePrintCount !== 0
  ) {
    return plan({
      state: "invalid_evidence",
      reason: "armed_result_schema_or_artifact_binding_invalid",
      resultSha256,
      currentBinding: current,
      ledgerEvidence,
    });
  }

  if (!ledgerShapeValid || ledgerEvidence?.readOk !== true) {
    return plan({
      state: "ambiguous",
      reason: "publish_ledger_unreadable",
      resultSha256,
      currentBinding: current,
      ledgerEvidence,
    });
  }

  const instagram = instagramResult ?? {};
  const youtube = youtubeResult ?? {};
  const instagramMediaId =
    typeof instagram.mediaId === "string" &&
    instagram.mediaId.length > 0
      ? instagram.mediaId
      : null;
  const youtubeVideoId =
    typeof youtube.videoId === "string" &&
    youtube.videoId.length > 0
      ? youtube.videoId
      : null;
  const ledgerInstagramId =
    typeof ledgerEvidence.instagramPublishedIdReference === "string"
      ? ledgerEvidence.instagramPublishedIdReference
      : null;
  const ledgerYoutubeId =
    typeof ledgerEvidence.youtubePublishedIdReference === "string"
      ? ledgerEvidence.youtubePublishedIdReference
      : null;
  const ledgerIdConflict =
    (instagramMediaId &&
      ledgerInstagramId &&
      instagramMediaId !== ledgerInstagramId) ||
    (youtubeVideoId &&
      ledgerYoutubeId &&
      youtubeVideoId !== ledgerYoutubeId);
  if (ledgerIdConflict) {
    return plan({
      state: "invalid_evidence",
      reason: "result_and_ledger_public_id_conflict",
      resultSha256,
      currentBinding: current,
      instagramMediaId,
      youtubeVideoId,
      ledgerEvidence,
    });
  }

  const youtubeOutcomeUnknown =
    youtube.outcome === "unknown" ||
    (counters.youtubeInsertCount > 0 && !youtubeVideoId);
  const instagramOutcomeUnknown =
    instagram.outcome === "unknown" ||
    (counters.instagramPublishCount > 0 && !instagramMediaId);
  if (youtubeOutcomeUnknown || instagramOutcomeUnknown) {
    return plan({
      state: "ambiguous",
      reason: youtubeOutcomeUnknown
        ? "youtube_publish_outcome_unknown"
        : "instagram_publish_outcome_unknown",
      resultSha256,
      currentBinding: current,
      instagramMediaId,
      youtubeVideoId,
      ledgerEvidence,
    });
  }

  const bothPlatformsConfirmed = Boolean(
    instagram.status === "published" &&
    instagram.outcome === "confirmed_published" &&
    youtube.status === "uploaded" &&
    youtube.outcome === "confirmed_published" &&
    instagramMediaId &&
    youtubeVideoId
  );
  if (bothPlatformsConfirmed) {
    const dualLedger =
      ledgerEvidence.instagramAlreadyPublished === true &&
      ledgerEvidence.youtubeAlreadyPublished === true &&
      ledgerInstagramId === instagramMediaId &&
      ledgerYoutubeId === youtubeVideoId;
    if (
      evidence.status !== "PUBLISHED_DUAL_PLATFORM_OK" &&
      dualLedger
    ) {
      return plan({
        state: "ambiguous",
        reason:
          "dual_publish_ledger_matches_but_result_status_not_complete",
        resultSha256,
        currentBinding: current,
        instagramMediaId,
        youtubeVideoId,
        ledgerEvidence,
      });
    }
    return plan({
      state:
        evidence.status === "PUBLISHED_DUAL_PLATFORM_OK" &&
        dualLedger
        ? "complete"
        : "both_published_ledger_missing",
      reason:
        evidence.status === "PUBLISHED_DUAL_PLATFORM_OK" &&
        dualLedger
        ? "dual_publish_result_and_ledger_match"
        : "dual_publish_ids_exist_but_ledger_incomplete",
      resultSha256,
      currentBinding: current,
      instagramMediaId,
      youtubeVideoId,
      ledgerEvidence,
    });
  }

  const instagramOnly = Boolean(
    instagram.status === "published" &&
    instagram.outcome === "confirmed_published" &&
    instagramMediaId &&
    youtube.outcome === "confirmed_not_published" &&
    !youtubeVideoId &&
    ledgerEvidence.instagramAlreadyPublished === true &&
    ledgerInstagramId === instagramMediaId &&
    ledgerEvidence.youtubeAlreadyPublished !== true
  );
  if (instagramOnly) {
    return plan({
      state: "instagram_only",
      reason: "instagram_confirmed_youtube_confirmed_missing",
      resultSha256,
      currentBinding: current,
      instagramMediaId,
      ledgerEvidence,
    });
  }

  const cleanLedger =
    ledgerEvidence.instagramAlreadyPublished !== true &&
    ledgerEvidence.youtubeAlreadyPublished !== true;
  const instagramNeverStarted =
    (instagram.outcome === undefined ||
      instagram.outcome === "not_started") &&
    (instagram.status === undefined ||
      instagram.status === "pending");
  const youtubeNeverStarted =
    (youtube.outcome === undefined ||
      youtube.outcome === "not_started") &&
    (youtube.status === undefined ||
      youtube.status === "pending");
  if (
    noSideEffects(counters) &&
    !instagramMediaId &&
    !youtubeVideoId &&
    cleanLedger &&
    instagramNeverStarted &&
    youtubeNeverStarted &&
    evidence.status !== "PUBLISHED_DUAL_PLATFORM_OK"
  ) {
    return plan({
      state: "no_external_failed",
      reason: "armed_attempt_recorded_with_zero_side_effects",
      resultSha256,
      currentBinding: current,
      ledgerEvidence,
    });
  }

  return plan({
    state: "ambiguous",
    reason: "armed_result_does_not_prove_safe_recovery_state",
    resultSha256,
    currentBinding: current,
    instagramMediaId,
    youtubeVideoId,
    ledgerEvidence,
  });
}
