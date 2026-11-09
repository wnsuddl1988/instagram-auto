import {
  MONEY_SHORTS_PART2_YOUTUBE_RECOVERY_EXECUTION_TRANSITIONS,
  buildMoneyShortsPart2YoutubeRecoveryExecutionClaim,
  validateMoneyShortsPart2YoutubeRecoveryExecutionClaim,
  validateMoneyShortsPart2YoutubeRecoveryExecutionEvent,
  validateMoneyShortsPart2YoutubeRecoveryExecutionPreflight,
  validateMoneyShortsPart2YoutubeRecoveryExecutionResult,
} from "./money-shorts-part2-youtube-recovery-execution.mjs";

export const MONEY_SHORTS_PART2_YOUTUBE_RECOVERY_OVERLAY_VERSION =
  "money_shorts_part2_youtube_recovery_overlay_v1";

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

function sameValue(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function validFile(file) {
  return (
    isPlainObject(file) &&
    file.exists === true &&
    file.parseOk === true &&
    SHA256_RE.test(
      typeof file.sha256 === "string" ? file.sha256 : "",
    ) &&
    isPlainObject(file.evidence)
  );
}

function absentSummary() {
  return {
    schemaVersion:
      MONEY_SHORTS_PART2_YOUTUBE_RECOVERY_OVERLAY_VERSION,
    present: false,
    valid: false,
    status: null,
    reason: "part2_youtube_recovery_evidence_absent",
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

export function emptyMoneyShortsPart2YoutubeRecoveryOverlaySummary() {
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
      MONEY_SHORTS_PART2_YOUTUBE_RECOVERY_OVERLAY_VERSION,
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

function invalidVerdict(reason, evidenceBundle) {
  return {
    applied: true,
    state: "invalid_evidence",
    reason,
    instagramMediaId: null,
    youtubeVideoId: null,
    summary: summaryFrom({
      valid: false,
      reason,
      claimFile: evidenceBundle?.claimFile,
      resultFile: evidenceBundle?.resultFile,
      eventCount: Array.isArray(evidenceBundle?.eventFiles)
        ? evidenceBundle.eventFiles.length
        : 0,
    }),
  };
}

function sourceBindingMatches({
  sourceRecovery,
  currentBinding,
  plan,
  claim,
  ledgerEvidence,
  instagramLedgerRecord,
}) {
  const instagramKey =
    `${currentBinding.contentId}/instagram_reels/${currentBinding.version}`;
  return (
    currentBinding?.productionPartId === "part-2" &&
    sameValue(sourceRecovery?.currentBinding, currentBinding) &&
    sameValue(plan?.currentBinding, currentBinding) &&
    sameValue(claim?.currentBinding, currentBinding) &&
    claim.planFingerprint === plan.planFingerprint &&
    claim.sourceReviewPreflightFingerprint ===
      plan.sourceReviewPreflightFingerprint &&
    claim.sourceReviewPlanFingerprint ===
      plan.sourceReviewPlanFingerprint &&
    sameValue(claim.instagram, plan.instagramRecovery) &&
    claim.youtubeBinding?.sourceSha256 ===
      plan.youtube?.sourceSha256 &&
    claim.youtubeBinding?.metadataSha256 ===
      plan.youtube?.metadataSha256 &&
    claim.youtubeBinding?.variantId ===
      plan.youtube?.variantId &&
    claim.youtubeBinding?.channelId ===
      plan.youtube?.expectedChannelId &&
    claim.ledgerBaselineSha256 === plan.ledger?.sha256 &&
    claim.expectedYoutubeLedgerKey ===
      plan.ledger?.expectedYoutubeKey &&
    ledgerEvidence?.readOk === true &&
    ledgerEvidence?.instagramAlreadyPublished === true &&
    ledgerEvidence.instagramPublishedIdReference ===
      claim.instagram?.mediaId &&
    hasExactKeys(instagramLedgerRecord, [
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
    instagramLedgerRecord.key === instagramKey &&
    instagramLedgerRecord.contentId ===
      currentBinding.contentId &&
    instagramLedgerRecord.platform === "instagram_reels" &&
    instagramLedgerRecord.version === currentBinding.version &&
    instagramLedgerRecord.variantId ===
      "instagram_reels_full_frame_1080x1920" &&
    instagramLedgerRecord.publishedId ===
      claim.instagram.mediaId &&
    instagramLedgerRecord.publishedUrl ===
      claim.instagram.permalink &&
    instagramLedgerRecord.status === "published" &&
    instagramLedgerRecord.publishedAtIso ===
      claim.instagram.publishedAtIso &&
    isPlainObject(instagramLedgerRecord.metadata) &&
    instagramLedgerRecord.metadata.sourceSha256 ===
      currentBinding.instagramSourceSha256 &&
    instagramLedgerRecord.metadata.accountId ===
      claim.instagram.accountId &&
    instagramLedgerRecord.metadata.recoveryPreflightFingerprint ===
      claim.instagram.preflightFingerprint &&
    instagramLedgerRecord.metadata.recoveryClaimFingerprint ===
      claim.instagram.claimFingerprint
  );
}

function validYoutubeLedgerRecord({
  record,
  claim,
  result,
}) {
  const youtube = result?.publicState?.youtube;
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
    record.key === claim.expectedYoutubeLedgerKey &&
    record.contentId === claim.currentBinding.contentId &&
    record.platform === "youtube_shorts" &&
    record.version === claim.currentBinding.version &&
    record.variantId === claim.youtubeBinding.variantId &&
    record.publishedId === youtube?.videoId &&
    record.publishedUrl === youtube?.url &&
    record.status === "published" &&
    record.publishedAtIso === youtube?.publishedAtIso &&
    isPlainObject(record.metadata) &&
    typeof record.metadata.sourceFileName === "string" &&
    record.metadata.sourceFileName.length > 0 &&
    record.metadata.sourceSha256 ===
      claim.youtubeBinding.sourceSha256 &&
    record.metadata.channelId ===
      claim.youtubeBinding.channelId
  );
}

export function classifyMoneyShortsPart2YoutubeRecoveryOverlay({
  sourceRecovery,
  currentBinding,
  ledgerEvidence,
  instagramLedgerRecord,
  youtubeLedgerRecord,
  evidenceBundle,
}) {
  if (evidenceBundle?.present !== true) {
    return {
      applied: false,
      state: null,
      reason: "part2_youtube_recovery_evidence_absent",
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
      "part2_youtube_recovery_discovery_invalid",
      evidenceBundle,
    );
  }

  const { preflightFile, claimFile, resultFile } =
    evidenceBundle;
  const eventFiles = Array.isArray(
    evidenceBundle.eventFiles,
  )
    ? evidenceBundle.eventFiles
    : [];
  if (
    !validFile(preflightFile) ||
    !validFile(claimFile) ||
    validateMoneyShortsPart2YoutubeRecoveryExecutionClaim(
      claimFile.evidence,
    ).valid !== true
  ) {
    return invalidVerdict(
      "part2_youtube_recovery_claim_or_preflight_invalid",
      evidenceBundle,
    );
  }

  const preflight = preflightFile.evidence;
  const plan = preflight.plan;
  const claim = claimFile.evidence;
  const rebuiltClaim =
    buildMoneyShortsPart2YoutubeRecoveryExecutionClaim({
      plan,
      executionPreflightFingerprint:
        claim.executionPreflightFingerprint,
      claimedAtIso: claim.claimedAtIso,
      claimId: claim.claimId,
    });
  if (
    validateMoneyShortsPart2YoutubeRecoveryExecutionPreflight({
      evidence: preflight,
      currentPlan: plan,
      expectedPreflightFingerprint:
        claim.executionPreflightFingerprint,
    }).valid !== true ||
    !sameValue(rebuiltClaim, claim) ||
    preflightFile.sha256 === claimFile.sha256 ||
    !sourceBindingMatches({
      sourceRecovery,
      currentBinding,
      plan,
      claim,
      ledgerEvidence,
      instagramLedgerRecord,
    })
  ) {
    return invalidVerdict(
      "part2_youtube_recovery_source_binding_invalid",
      evidenceBundle,
    );
  }
  if (
    eventFiles.length >
    MONEY_SHORTS_PART2_YOUTUBE_RECOVERY_EXECUTION_TRANSITIONS.length
  ) {
    return invalidVerdict(
      "part2_youtube_recovery_event_count_invalid",
      evidenceBundle,
    );
  }

  let previousEvidenceSha256 = claimFile.sha256;
  let previousTransition = null;
  for (let index = 0; index < eventFiles.length; index += 1) {
    const eventFile = eventFiles[index];
    const expectedTransition =
      MONEY_SHORTS_PART2_YOUTUBE_RECOVERY_EXECUTION_TRANSITIONS[
        index
      ];
    if (
      !validFile(eventFile) ||
      eventFile.transition !== expectedTransition ||
      eventFile.evidence.transition !== expectedTransition ||
      validateMoneyShortsPart2YoutubeRecoveryExecutionEvent({
        evidence: eventFile.evidence,
        claim,
        previousEvidenceSha256,
        previousTransition,
      }).valid !== true
    ) {
      return invalidVerdict(
        "part2_youtube_recovery_event_chain_invalid",
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
      reason: "part2_youtube_recovery_result_missing",
      instagramMediaId: claim.instagram.mediaId,
      youtubeVideoId: null,
      summary: summaryFrom({
        valid: true,
        reason: "part2_youtube_recovery_result_missing",
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
    validateMoneyShortsPart2YoutubeRecoveryExecutionResult({
      evidence: resultFile.evidence,
      claim,
      latestEvent: eventFiles.at(-1)?.evidence,
      latestEventFileSha256: eventFiles.at(-1)?.sha256,
    }).valid !== true ||
    resultFile.evidence.latestTransition !==
      previousTransition ||
    resultFile.evidence.latestEventSha256 !==
      previousEvidenceSha256
  ) {
    return invalidVerdict(
      "part2_youtube_recovery_result_or_chain_invalid",
      evidenceBundle,
    );
  }

  const result = resultFile.evidence;
  const youtube = result.publicState.youtube;
  const ledger = result.publicState.ledger;
  const commonSummary = {
    claimFile,
    resultFile,
    eventCount: eventFiles.length,
    latestTransition: previousTransition,
    latestEventSha256: previousEvidenceSha256,
    youtubeVideoId:
      typeof youtube?.videoId === "string"
        ? youtube.videoId
        : null,
    youtubeUrl:
      typeof youtube?.url === "string" ? youtube.url : null,
    writeLockReleased:
      typeof ledger?.writeLockReleased === "boolean"
        ? ledger.writeLockReleased
        : null,
  };

  if (result.status === "PART2_YOUTUBE_RECOVERY_OK") {
    const videoId = youtube?.videoId;
    const complete =
      eventFiles.length ===
        MONEY_SHORTS_PART2_YOUTUBE_RECOVERY_EXECUTION_TRANSITIONS.length &&
      previousTransition === "complete" &&
      ledger?.writeOk === true &&
      ledger?.readbackOk === true &&
      ledger?.recordedKey === claim.expectedYoutubeLedgerKey &&
      ledger?.publishedId === videoId &&
      ledgerEvidence?.readOk === true &&
      ledgerEvidence?.instagramAlreadyPublished === true &&
      ledgerEvidence?.youtubeAlreadyPublished === true &&
      ledgerEvidence.instagramPublishedIdReference ===
        claim.instagram.mediaId &&
      ledgerEvidence.youtubePublishedIdReference === videoId &&
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
        reason: "part2_youtube_recovery_success_ledger_mismatch",
        instagramMediaId: claim.instagram.mediaId,
        youtubeVideoId: null,
        summary: summaryFrom({
          valid: false,
          status: result.status,
          reason:
            "part2_youtube_recovery_success_ledger_mismatch",
          ...commonSummary,
        }),
      };
    }
    return {
      applied: true,
      state: "complete",
      reason:
        "part2_youtube_recovery_result_and_ledger_match",
      instagramMediaId: claim.instagram.mediaId,
      youtubeVideoId: videoId,
      summary: summaryFrom({
        valid: true,
        status: result.status,
        reason:
          "part2_youtube_recovery_result_and_ledger_match",
        ...commonSummary,
      }),
    };
  }

  const mapped =
    result.status === "FAILED_BEFORE_YOUTUBE_INSERT"
      ? {
          state: "no_external_failed",
          reason:
            "part2_youtube_recovery_failed_before_insert",
        }
      : result.status === "BOTH_PUBLISHED_LEDGER_MISSING"
        ? {
            state: "both_published_ledger_missing",
            reason:
              "part2_youtube_recovery_both_published_ledger_missing",
          }
        : {
            state: "ambiguous",
            reason:
              result.status ===
              "YOUTUBE_UPLOAD_OUTCOME_UNKNOWN"
                ? "part2_youtube_recovery_upload_outcome_unknown"
                : "part2_youtube_recovery_evidence_incomplete",
          };
  return {
    applied: true,
    state: mapped.state,
    reason: mapped.reason,
    instagramMediaId: claim.instagram.mediaId,
    youtubeVideoId:
      typeof youtube?.videoId === "string"
        ? youtube.videoId
        : null,
    summary: summaryFrom({
      valid: true,
      status: result.status,
      reason: mapped.reason,
      ...commonSummary,
    }),
  };
}

export function applyMoneyShortsPart2YoutubeRecoveryOverlay({
  sourceRecovery,
  currentBinding,
  ledgerEvidence,
  instagramLedgerRecord,
  youtubeLedgerRecord,
  evidenceBundle,
}) {
  const verdict =
    classifyMoneyShortsPart2YoutubeRecoveryOverlay({
      sourceRecovery,
      currentBinding,
      ledgerEvidence,
      instagramLedgerRecord,
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
          ledgerEvidence?.instagramAlreadyPublished === true,
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
