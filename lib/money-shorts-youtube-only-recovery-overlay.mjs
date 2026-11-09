import {
  MONEY_SHORTS_YOUTUBE_ONLY_RECOVERY_EVENT_TRANSITIONS,
  validateMoneyShortsYoutubeOnlyRecoveryClaimEvidence,
  validateMoneyShortsYoutubeOnlyRecoveryEventEvidence,
  validateMoneyShortsYoutubeOnlyRecoveryPreflightForClaim,
  validateMoneyShortsYoutubeOnlyRecoveryResultEvidence,
} from "./money-shorts-youtube-only-recovery.mjs";

export const MONEY_SHORTS_YOUTUBE_ONLY_RECOVERY_OVERLAY_VERSION =
  "money_shorts_youtube_only_recovery_overlay_v1";

const SHA256_RE = /^[a-f0-9]{64}$/;
const YOUTUBE_VIDEO_ID_RE = /^[A-Za-z0-9_-]{6,30}$/;

function isPlainObject(value) {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function hasExactKeys(value, keys) {
  if (!isPlainObject(value)) return false;
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  return (
    actual.length === expected.length &&
    actual.every((key, index) => key === expected[index])
  );
}

function validFile(file) {
  return (
    isPlainObject(file) &&
    file.exists === true &&
    file.parseOk === true &&
    SHA256_RE.test(
      typeof file.sha256 === "string"
        ? file.sha256
        : "",
    ) &&
    isPlainObject(file.evidence)
  );
}

function sameValue(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function absentSummary() {
  return {
    schemaVersion:
      MONEY_SHORTS_YOUTUBE_ONLY_RECOVERY_OVERLAY_VERSION,
    present: false,
    valid: false,
    status: null,
    reason: "youtube_only_recovery_evidence_absent",
    claimSha256: null,
    resultSha256: null,
    resultFingerprint: null,
    eventCount: 0,
    latestTransition: null,
    latestEventSha256: null,
    youtubeVideoId: null,
    youtubeUrl: null,
    writeLockReleased: null,
    automaticRetryAllowed: false,
    externalActionAllowed: false,
  };
}

export function emptyMoneyShortsYoutubeOnlyRecoveryOverlaySummary() {
  return absentSummary();
}

function summaryFrom({
  valid,
  status = null,
  reason,
  claimFile = null,
  resultFile = null,
  eventCount = 0,
  latestTransition = null,
  latestEventSha256 = null,
  youtubeVideoId = null,
  youtubeUrl = null,
  writeLockReleased = null,
}) {
  return {
    schemaVersion:
      MONEY_SHORTS_YOUTUBE_ONLY_RECOVERY_OVERLAY_VERSION,
    present: true,
    valid,
    status,
    reason,
    claimSha256:
      typeof claimFile?.sha256 === "string"
        ? claimFile.sha256
        : null,
    resultSha256:
      typeof resultFile?.sha256 === "string"
        ? resultFile.sha256
        : null,
    resultFingerprint:
      typeof resultFile?.evidence?.resultFingerprint ===
        "string"
        ? resultFile.evidence.resultFingerprint
        : null,
    eventCount,
    latestTransition,
    latestEventSha256,
    youtubeVideoId,
    youtubeUrl,
    writeLockReleased,
    automaticRetryAllowed: false,
    externalActionAllowed: false,
  };
}

function sourceRecoveryMatchesClaim(
  sourceRecovery,
  currentBinding,
  claim,
) {
  return (
    isPlainObject(sourceRecovery) &&
    sourceRecovery.state === "instagram_only" &&
    sourceRecovery.reason ===
      "owner_confirmed_instagram_published_youtube_not_published" &&
    sourceRecovery.ownerResolution?.valid === true &&
    sourceRecovery.ownerResolution?.applied === true &&
    sameValue(
      sourceRecovery.currentBinding,
      currentBinding,
    ) &&
    sameValue(claim.currentBinding, currentBinding) &&
    claim.recoveryFingerprint ===
      sourceRecovery.recoveryFingerprint &&
    claim.ownerResolutionSha256 ===
      sourceRecovery.ownerResolution.sha256 &&
    claim.ownerResolutionFingerprint ===
      sourceRecovery.ownerResolution
        .resolutionFingerprint &&
    claim.originalResultSha256 ===
      sourceRecovery.resultSha256 &&
    claim.originalAttemptClaimSha256 ===
      sourceRecovery.attemptClaimSha256 &&
    claim.expectedChannelId ===
      sourceRecovery.ownerResolution.youtubeChannelId &&
    claim.instagram?.mediaId ===
      sourceRecovery.instagramMediaId &&
    claim.instagram?.permalink ===
      sourceRecovery.ownerResolution.instagramPermalink
  );
}

function validYoutubeLedgerRecord({
  record,
  claim,
  result,
}) {
  const videoId = result?.youtube?.videoId;
  const expectedKey =
    `${claim.currentBinding.contentId}/youtube_shorts/${claim.currentBinding.version}`;
  return (
    hasExactKeys(record, [
      "key",
      "contentId",
      "platform",
      "version",
      "variantId",
      "publishedId",
      "publishedUrl",
      "status",
      "publishedAtIso",
      "metadata",
    ]) &&
    hasExactKeys(record?.metadata, [
      "sourceFileName",
      "sourceSha256",
      "recoveryFingerprint",
      "originalResultSha256",
      "ownerResolutionSha256",
      "channelId",
    ]) &&
    record.key === expectedKey &&
    record.contentId ===
      claim.currentBinding.contentId &&
    record.platform === "youtube_shorts" &&
    record.version === claim.currentBinding.version &&
    record.variantId === claim.youtubeBinding.variantId &&
    record.publishedId === videoId &&
    record.publishedUrl ===
      `https://www.youtube.com/shorts/${videoId}` &&
    record.status === "published" &&
    record.publishedAtIso ===
      result.youtube.publishedAtIso &&
    typeof record.metadata.sourceFileName === "string" &&
    record.metadata.sourceFileName.length > 0 &&
    record.metadata.sourceSha256 ===
      claim.youtubeBinding.sourceSha256 &&
    record.metadata.recoveryFingerprint ===
      claim.recoveryFingerprint &&
    record.metadata.originalResultSha256 ===
      claim.originalResultSha256 &&
    record.metadata.ownerResolutionSha256 ===
      claim.ownerResolutionSha256 &&
    record.metadata.channelId ===
      claim.expectedChannelId
  );
}

function invalidVerdict(reason, bundle) {
  return {
    applied: true,
    state: "invalid_evidence",
    reason,
    instagramMediaId: null,
    youtubeVideoId: null,
    summary: summaryFrom({
      valid: false,
      reason,
      claimFile: bundle?.claimFile,
      resultFile: bundle?.resultFile,
      eventCount: Array.isArray(bundle?.eventFiles)
        ? bundle.eventFiles.length
        : 0,
    }),
  };
}

export function classifyMoneyShortsYoutubeOnlyRecoveryOverlay({
  sourceRecovery,
  currentBinding,
  ledgerEvidence,
  youtubeLedgerRecord,
  evidenceBundle,
}) {
  if (evidenceBundle?.present !== true) {
    return {
      applied: false,
      state: null,
      reason: "youtube_only_recovery_evidence_absent",
      instagramMediaId: null,
      youtubeVideoId: null,
      summary: absentSummary(),
    };
  }
  if (
    evidenceBundle.discoveryValid !== true ||
    evidenceBundle.candidateCount !== 1 ||
    evidenceBundle.unknownFileCount !== 0
  ) {
    return invalidVerdict(
      "youtube_only_recovery_discovery_invalid",
      evidenceBundle,
    );
  }
  const {
    preflightFile,
    claimFile,
    resultFile,
  } = evidenceBundle;
  const eventFiles = Array.isArray(
    evidenceBundle.eventFiles,
  )
    ? evidenceBundle.eventFiles
    : [];
  if (
    !validFile(preflightFile) ||
    !validFile(claimFile) ||
    validateMoneyShortsYoutubeOnlyRecoveryClaimEvidence(
      claimFile.evidence,
    ).valid !== true
  ) {
    return invalidVerdict(
      "youtube_only_recovery_claim_or_preflight_invalid",
      evidenceBundle,
    );
  }
  const claim = claimFile.evidence;
  if (
    !sourceRecoveryMatchesClaim(
      sourceRecovery,
      currentBinding,
      claim,
    ) ||
    validateMoneyShortsYoutubeOnlyRecoveryPreflightForClaim({
      evidence: preflightFile.evidence,
      claim,
    }).valid !== true
  ) {
    return invalidVerdict(
      "youtube_only_recovery_source_binding_invalid",
      evidenceBundle,
    );
  }
  if (
    eventFiles.length >
    MONEY_SHORTS_YOUTUBE_ONLY_RECOVERY_EVENT_TRANSITIONS.length
  ) {
    return invalidVerdict(
      "youtube_only_recovery_event_count_invalid",
      evidenceBundle,
    );
  }

  let previousEvidenceSha256 = claimFile.sha256;
  let previousTransition = null;
  for (let index = 0; index < eventFiles.length; index += 1) {
    const eventFile = eventFiles[index];
    const expectedTransition =
      MONEY_SHORTS_YOUTUBE_ONLY_RECOVERY_EVENT_TRANSITIONS[
        index
      ];
    if (
      !validFile(eventFile) ||
      eventFile.transition !== expectedTransition ||
      eventFile.evidence.transition !==
        expectedTransition ||
      validateMoneyShortsYoutubeOnlyRecoveryEventEvidence({
        evidence: eventFile.evidence,
        claim,
        previousEvidenceSha256,
        previousTransition,
      }).valid !== true
    ) {
      return invalidVerdict(
        "youtube_only_recovery_event_chain_invalid",
        evidenceBundle,
      );
    }
    previousEvidenceSha256 = eventFile.sha256;
    previousTransition = expectedTransition;
  }

  if (resultFile?.exists !== true) {
    return {
      applied: true,
      state: "ambiguous",
      reason: "youtube_only_recovery_result_missing",
      instagramMediaId:
        sourceRecovery.instagramMediaId,
      youtubeVideoId: null,
      summary: summaryFrom({
        valid: true,
        reason: "youtube_only_recovery_result_missing",
        claimFile,
        eventCount: eventFiles.length,
        latestTransition: previousTransition,
        latestEventSha256:
          eventFiles.length > 0
            ? previousEvidenceSha256
            : null,
      }),
    };
  }
  if (
    eventFiles.length === 0 ||
    !validFile(resultFile) ||
    validateMoneyShortsYoutubeOnlyRecoveryResultEvidence({
      evidence: resultFile.evidence,
      claim,
    }).valid !== true ||
    resultFile.evidence.latestTransition !==
      previousTransition ||
    resultFile.evidence.latestEventSha256 !==
      previousEvidenceSha256
  ) {
    return invalidVerdict(
      "youtube_only_recovery_result_or_chain_invalid",
      evidenceBundle,
    );
  }

  const result = resultFile.evidence;
  const commonSummary = {
    claimFile,
    resultFile,
    eventCount: eventFiles.length,
    latestTransition: previousTransition,
    latestEventSha256: previousEvidenceSha256,
    youtubeVideoId:
      typeof result.youtube?.videoId === "string"
        ? result.youtube.videoId
        : null,
    youtubeUrl:
      typeof result.youtube?.url === "string"
        ? result.youtube.url
        : null,
    writeLockReleased:
      typeof result.ledger?.writeLockReleased ===
      "boolean"
        ? result.ledger.writeLockReleased
        : null,
  };

  if (result.status === "YOUTUBE_ONLY_RECOVERY_OK") {
    const videoId = result.youtube?.videoId;
    const instagramLedgerCompatible =
      ledgerEvidence?.instagramAlreadyPublished !== true ||
      ledgerEvidence.instagramPublishedIdReference ===
        result.instagram.mediaId;
    const complete =
      eventFiles.length ===
        MONEY_SHORTS_YOUTUBE_ONLY_RECOVERY_EVENT_TRANSITIONS.length &&
      previousTransition === "complete" &&
      ledgerEvidence?.readOk === true &&
      ledgerEvidence?.youtubeAlreadyPublished === true &&
      ledgerEvidence.youtubePublishedIdReference === videoId &&
      instagramLedgerCompatible &&
      YOUTUBE_VIDEO_ID_RE.test(
        typeof videoId === "string" ? videoId : "",
      ) &&
      validYoutubeLedgerRecord({
        record: youtubeLedgerRecord,
        claim,
        result,
      });
    if (!complete) {
      return {
        applied: true,
        state: "invalid_evidence",
        reason:
          "youtube_only_recovery_success_ledger_mismatch",
        instagramMediaId:
          sourceRecovery.instagramMediaId,
        youtubeVideoId: null,
        summary: summaryFrom({
          valid: false,
          status: result.status,
          reason:
            "youtube_only_recovery_success_ledger_mismatch",
          ...commonSummary,
        }),
      };
    }
    return {
      applied: true,
      state: "complete",
      reason:
        "youtube_only_recovery_result_and_ledger_match",
      instagramMediaId: result.instagram.mediaId,
      youtubeVideoId: videoId,
      summary: summaryFrom({
        valid: true,
        status: result.status,
        reason:
          "youtube_only_recovery_result_and_ledger_match",
        ...commonSummary,
      }),
    };
  }

  const mapped =
    result.status === "BOTH_PUBLISHED_LEDGER_MISSING"
      ? {
          state: "both_published_ledger_missing",
          reason:
            "youtube_only_recovery_both_published_ledger_missing",
        }
      : {
          state: "ambiguous",
          reason:
            result.status ===
            "YOUTUBE_UPLOAD_OUTCOME_UNKNOWN"
              ? "youtube_only_recovery_upload_outcome_unknown"
              : result.status ===
                  "FAILED_BEFORE_YOUTUBE_INSERT"
                ? "youtube_only_recovery_failed_before_insert"
                : "youtube_only_recovery_evidence_incomplete",
        };
  return {
    applied: true,
    state: mapped.state,
    reason: mapped.reason,
    instagramMediaId:
      sourceRecovery.instagramMediaId,
    youtubeVideoId:
      typeof result.youtube?.videoId === "string"
        ? result.youtube.videoId
        : null,
    summary: summaryFrom({
      valid: true,
      status: result.status,
      reason: mapped.reason,
      ...commonSummary,
    }),
  };
}

export function applyMoneyShortsYoutubeOnlyRecoveryOverlay({
  sourceRecovery,
  currentBinding,
  ledgerEvidence,
  youtubeLedgerRecord,
  evidenceBundle,
}) {
  const verdict =
    classifyMoneyShortsYoutubeOnlyRecoveryOverlay({
      sourceRecovery,
      currentBinding,
      ledgerEvidence,
      youtubeLedgerRecord,
      evidenceBundle,
    });
  if (!verdict.applied) {
    return {
      applied: false,
      recovery: sourceRecovery,
      youtubeOnlyRecovery: verdict.summary,
    };
  }
  const complete = verdict.state === "complete";
  return {
    applied: true,
    recovery: {
      ...sourceRecovery,
      state: verdict.state,
      reason: verdict.reason,
      instagramMediaId:
        verdict.instagramMediaId ??
        sourceRecovery.instagramMediaId,
      youtubeVideoId: verdict.youtubeVideoId,
      ledger: {
        readOk: ledgerEvidence?.readOk === true,
        instagramAlreadyPublished:
          ledgerEvidence?.instagramAlreadyPublished ===
          true,
        youtubeAlreadyPublished:
          ledgerEvidence?.youtubeAlreadyPublished === true,
        instagramPublishedIdReference:
          typeof ledgerEvidence
            ?.instagramPublishedIdReference === "string"
            ? ledgerEvidence.instagramPublishedIdReference
            : null,
        youtubePublishedIdReference:
          typeof ledgerEvidence
            ?.youtubePublishedIdReference === "string"
            ? ledgerEvidence.youtubePublishedIdReference
            : null,
      },
      manualRecoveryRequired: !complete,
      genericDualUploadBlocked: true,
      automaticRetryAllowed: false,
      externalRecoveryEnabled: false,
      recoverablePlatformCandidate: null,
      safety: {
        blobMutationAllowed: false,
        instagramPublishAllowed: false,
        youtubePublishAllowed: false,
        ledgerMutationAllowed: false,
        automaticRetryCount: 0,
        externalActionCount: 0,
      },
    },
    youtubeOnlyRecovery: verdict.summary,
  };
}
