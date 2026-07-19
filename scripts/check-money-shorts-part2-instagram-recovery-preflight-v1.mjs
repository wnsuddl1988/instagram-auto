import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

import {
  fingerprintMoneyShortsPublishAttemptBinding,
} from "../lib/money-shorts-publish-attempt-journal.mjs";
import {
  buildMoneyShortsPart2InstagramRecoveryPreflight,
  buildMoneyShortsPart2InstagramRecoveryReviewPlan,
  MONEY_SHORTS_PART2_INSTAGRAM_RECOVERY_PREFLIGHT_INSPECTION,
  normalizeMoneyShortsPart2InstagramContainerDiagnosticPair,
  parseMoneyShortsPart2InstagramRecoveryPreflightArgs,
  runMoneyShortsPart2InstagramRecoveryPreflight,
  runMoneyShortsPart2InstagramRecoveryPreflightTestOnly,
  validateMoneyShortsPart2InstagramRecoveryPreflight,
  validateMoneyShortsPart2InstagramRecoveryFinalExecutionState,
  validateMoneyShortsPart2InstagramRecoveryIntentState,
  validateMoneyShortsPart2InstagramRecoveryResultEnvelopes,
  validateMoneyShortsPart2InstagramRecoverySafeClaimEnvelope,
  zeroMoneyShortsPart2InstagramRecoveryPreflightCounters,
} from "./run-money-shorts-part2-instagram-recovery-preflight-v1.mjs";

let passed = 0;
let failed = 0;

function check(label, condition, detail = "") {
  if (condition) {
    passed += 1;
    console.log(`PASS ${label}`);
  } else {
    failed += 1;
    console.error(
      `FAIL ${label}${detail ? ` — ${detail}` : ""}`,
    );
  }
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function hash(label) {
  return sha256(Buffer.from(`fixture:${label}`, "utf8"));
}

const transitions = [
  "external_execution_ready",
  "instagram_identity_verify_intent",
  "instagram_identity_verify_confirmed",
  "youtube_identity_verify_intent",
  "youtube_identity_verify_confirmed",
  "blob_put_intent",
  "blob_put_confirmed",
  "blob_head_intent",
  "blob_head_confirmed",
  "instagram_container_intent",
];

function baseFacts({
  diagnosticState = "legacy_absent",
} = {}) {
  const currentBinding = {
    contentId: "wizard-finance-fixture-part-2",
    version: "v5",
    productionPartId: "part-2",
    contentUnitManifestPath:
      "C:\\tmp\\fixture\\dual-platform-unit.json",
    contentUnitSha256: hash("manifest"),
    instagramSourceSha256: hash("source"),
    youtubeSourceSha256: hash("source"),
    publishMetadataSha256: hash("metadata"),
    finalVideoApprovalFingerprint: hash("approval"),
  };
  return {
    currentBinding,
    originalPlanFingerprint: hash("original-plan"),
    originalPublicationAttemptFingerprint:
      fingerprintMoneyShortsPublishAttemptBinding(
        currentBinding,
      ),
    expectedInstagramAccountId: "17841414372742257",
    expectedYoutubeChannelId:
      "UCR23z78qDtyhHIaV29rSB9A",
    originalEvidence: {
      safePreflightFileSha256:
        hash("safe-preflight-file"),
      safePreflightFingerprint:
        hash("safe-preflight-fingerprint"),
      safeClaimFileSha256: hash("safe-claim-file"),
      safeClaimFingerprint:
        hash("safe-claim-fingerprint"),
      safeResultFileSha256: hash("safe-result-file"),
      safeResultFingerprint:
        hash("safe-result-fingerprint"),
      canonicalAttemptClaimFileSha256:
        hash("canonical-attempt-claim-file"),
      canonicalLatestEventSha256:
        hash("canonical-latest-event"),
      canonicalResultFileSha256:
        hash("canonical-result-file"),
      canonicalResultFingerprint:
        hash("canonical-result-fingerprint"),
    },
    safeEvidenceValid: true,
    canonicalEvidenceValid: true,
    safeJournal: {
      valid: true,
      eventCount: transitions.length,
      transitions: [...transitions],
      latestEventSha256: hash("safe-latest-event"),
    },
    canonicalJournal: {
      valid: true,
      eventCount: transitions.length,
      transitions: [...transitions],
      latestEventSha256:
        hash("canonical-latest-event"),
    },
    failure: {
      safeStatus: "INSTAGRAM_CONTAINER_OUTCOME_UNKNOWN",
      canonicalStatus: "FAILED",
      safeBlockerCode:
        "PART2_DUAL_SAFE_INSTAGRAM_CONTAINER_NO_ID",
      canonicalBlockerCode:
        "PART2_DUAL_SAFE_INSTAGRAM_CONTAINER_NO_ID",
      instagramOutcome: "unknown",
      instagramContainerId: null,
      instagramMediaId: null,
      youtubeOutcome: "not_started",
      youtubeVideoId: null,
      publishIntentObserved: false,
      containerConfirmedObserved: false,
      diagnosticState,
      counters: {
        blobPutCount: 1,
        blobHeadCount: 1,
        instagramContainerCreateCount: 1,
        instagramStatusPollCount: 0,
        instagramPublishCount: 0,
        youtubeInsertCount: 0,
        ledgerWriteCount: 0,
        databaseMutationCount: 0,
        part1ActionCount: 0,
        automaticRetryCount: 0,
        credentialValuePrintCount: 0,
      },
    },
    priorAuthorizationConsumed: true,
    ledger: {
      readOk: true,
      clean: true,
      instagramAlreadyPublished: false,
      youtubeAlreadyPublished: false,
      sha256: hash("ledger"),
      originalBaselineSha256: hash("ledger"),
    },
    blob: {
      evidenceConsistent: true,
      status: "uploaded",
      pathname:
        "instagram/reels/fixture/v5/source.mp4",
      urlSha256: hash("blob-url"),
      priorHeadStatus: 200,
      priorHeadContentType: "video/mp4",
      liveHeadChecked: false,
    },
    recovery: {
      state: "ambiguous",
      reason: "instagram_publish_outcome_unknown",
      recoveryFingerprint: hash("recovery"),
      recoverablePlatformCandidate: null,
      automaticRetryAllowed: false,
      externalRecoveryEnabled: false,
    },
  };
}

function mutateFacts(mutator) {
  const facts = baseFacts();
  mutator(facts);
  return facts;
}

function expectedArgs(facts = baseFacts()) {
  return [
    "--inspection",
    MONEY_SHORTS_PART2_INSTAGRAM_RECOVERY_PREFLIGHT_INSPECTION,
    "--content-unit",
    "C:\\tmp\\fixture\\dual-platform-unit.json",
    "--ledger",
    "C:\\tmp\\fixture\\publish-ledger.json",
    "--out-dir",
    "C:\\tmp\\fixture",
    "--expected-content-id",
    facts.currentBinding.contentId,
    "--expected-manifest-sha256",
    facts.currentBinding.contentUnitSha256,
    "--expected-source-sha256",
    facts.currentBinding.instagramSourceSha256,
    "--expected-publication-attempt-fingerprint",
    facts.originalPublicationAttemptFingerprint,
    "--expected-instagram-account-id",
    facts.expectedInstagramAccountId,
    "--expected-youtube-channel-id",
    facts.expectedYoutubeChannelId,
    "--expected-original-safe-preflight-fingerprint",
    facts.originalEvidence.safePreflightFingerprint,
    "--expected-original-safe-claim-fingerprint",
    facts.originalEvidence.safeClaimFingerprint,
    "--expected-original-safe-result-fingerprint",
    facts.originalEvidence.safeResultFingerprint,
    "--expected-original-canonical-result-fingerprint",
    facts.originalEvidence.canonicalResultFingerprint,
    "--expected-original-plan-fingerprint",
    facts.originalPlanFingerprint,
    "--expected-original-safe-preflight-file-sha256",
    facts.originalEvidence.safePreflightFileSha256,
    "--expected-original-safe-claim-file-sha256",
    facts.originalEvidence.safeClaimFileSha256,
    "--expected-original-safe-result-file-sha256",
    facts.originalEvidence.safeResultFileSha256,
    "--expected-original-safe-latest-event-sha256",
    facts.safeJournal.latestEventSha256,
    "--expected-original-canonical-attempt-claim-file-sha256",
    facts.originalEvidence
      .canonicalAttemptClaimFileSha256,
    "--expected-original-canonical-latest-event-sha256",
    facts.canonicalJournal.latestEventSha256,
    "--expected-original-canonical-result-file-sha256",
    facts.originalEvidence.canonicalResultFileSha256,
    "--expected-original-ledger-sha256",
    facts.ledger.sha256,
    "--expected-original-blob-url-sha256",
    facts.blob.urlSha256,
    "--expected-original-recovery-fingerprint",
    facts.recovery.recoveryFingerprint,
  ];
}

function fullPendingState({
  instagramOutcome = "unknown",
} = {}) {
  return {
    identities: {
      instagram: {
        status: "confirmed",
        accountId: "17841414372742257",
      },
      youtube: {
        status: "confirmed",
        channelId: "UCR23z78qDtyhHIaV29rSB9A",
      },
    },
    blob: {
      status: "uploaded",
      pathname: "instagram/reels/fixture/v5/source.mp4",
      url:
        "https://fixture.public.blob.vercel-storage.com/" +
        "instagram/reels/fixture/v5/source.mp4",
      headStatus: 200,
      headContentType: "video/mp4",
    },
    instagram: {
      status: "pending",
      outcome: instagramOutcome,
      mediaId: null,
      containerId: null,
      lastStatusCode: null,
    },
    youtube: {
      status: "pending",
      outcome: "not_started",
      videoId: null,
      url: null,
    },
    ledger: {
      status: "pending",
      path: "C:\\tmp\\fixture\\publish-ledger.json",
      recordedKeys: [],
      writeOk: false,
      readbackOk: false,
      writeLockReleased: null,
    },
  };
}

function finalStateValidation(
  safePublicState,
  canonicalExecutionResult,
) {
  return validateMoneyShortsPart2InstagramRecoveryFinalExecutionState(
    {
      safePublicState,
      canonicalExecutionResult,
      expectedInstagramAccountId: "17841414372742257",
      expectedYoutubeChannelId:
        "UCR23z78qDtyhHIaV29rSB9A",
      expectedLedgerPath:
        "C:\\tmp\\fixture\\publish-ledger.json",
      expectedBlobPathname:
        "instagram/reels/fixture/v5/source.mp4",
    },
  );
}

function intentStateFixture() {
  const safePublicState = fullPendingState({
    instagramOutcome: "not_started",
  });
  return {
    safeEvent: {
      publicState: safePublicState,
      sideEffectCounters: {
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
      },
    },
    canonicalEvent: {
      state: {
        sideEffectCounters: {
          blobPutCount: 1,
          blobHeadCount: 1,
          instagramContainerCreateCount: 0,
          instagramStatusPollCount: 0,
          instagramPublishCount: 0,
          youtubeInsertCount: 0,
          ledgerWriteCount: 0,
          envSecretValuePrintCount: 0,
        },
        blob: {
          status: "uploaded",
          pathname:
            "instagram/reels/fixture/v5/source.mp4",
          headStatus: 200,
        },
        instagram: {
          status: "pending",
          outcome: "not_started",
          containerId: null,
          mediaId: null,
          lastStatusCode: null,
        },
        youtube: {
          status: "pending",
          outcome: "not_started",
          videoId: null,
        },
        ledger: {
          status: "pending",
          writeOk: false,
          recordedKeys: [],
        },
      },
    },
  };
}

function intentStateValidation(fixture) {
  return validateMoneyShortsPart2InstagramRecoveryIntentState(
    {
      ...fixture,
      expectedInstagramAccountId: "17841414372742257",
      expectedYoutubeChannelId:
        "UCR23z78qDtyhHIaV29rSB9A",
      expectedLedgerPath:
        "C:\\tmp\\fixture\\publish-ledger.json",
      expectedBlobPathname:
        "instagram/reels/fixture/v5/source.mp4",
    },
  );
}

function safeClaimEnvelopeFixture(plan) {
  return {
    schemaVersion:
      "money_shorts_part2_dual_platform_publish_safe_v1",
    evidenceType: "claim",
    armed: true,
    claimId: "fixture-claim-id",
    claimedAtIso: "2026-07-19T00:00:00.000Z",
    planFingerprint: plan.planFingerprint,
    preflightFingerprint: hash("safe-preflight-fingerprint"),
    currentBinding: structuredClone(plan.currentBinding),
    publicationAttemptFingerprint:
      plan.publicationAttemptFingerprint,
    expectedInstagramAccountId:
      plan.expectedInstagramAccountId,
    expectedYoutubeChannelId:
      plan.expectedYoutubeChannelId,
    ledgerBaselineSha256: plan.ledgerBaselineSha256,
    safety: structuredClone(plan.safety),
    claimFingerprint: hash("safe-claim-fingerprint"),
  };
}

function resultEnvelopeFixture(plan) {
  const currentBinding = plan.currentBinding;
  const paths = {
    contentUnitPath: currentBinding.contentUnitManifestPath,
    ledgerPath: "C:\\tmp\\fixture\\publish-ledger.json",
  };
  const expected = {
    safeClaimFingerprint: hash("safe-claim-fingerprint"),
    safePreflightFingerprint:
      hash("safe-preflight-fingerprint"),
    safeLatestEventSha256: hash("safe-latest-event"),
    safeResultFingerprint: hash("safe-result-fingerprint"),
    canonicalResultFingerprint:
      hash("canonical-result-fingerprint"),
  };
  const safeResult = {
    schemaVersion:
      "money_shorts_part2_dual_platform_publish_safe_v1",
    evidenceType: "result",
    status: "INSTAGRAM_CONTAINER_OUTCOME_UNKNOWN",
    blockerCode:
      "PART2_DUAL_SAFE_INSTAGRAM_CONTAINER_NO_ID",
    completedAtIso: "2026-07-19T00:00:01.000Z",
    claimFingerprint: expected.safeClaimFingerprint,
    planFingerprint: plan.planFingerprint,
    preflightFingerprint:
      expected.safePreflightFingerprint,
    latestEventSha256: expected.safeLatestEventSha256,
    latestTransition: "instagram_container_intent",
    expectedInstagramAccountId:
      plan.expectedInstagramAccountId,
    expectedYoutubeChannelId:
      plan.expectedYoutubeChannelId,
    publicState: {},
    sideEffectCounters: {},
    automaticRetryAllowed: false,
    externalRecoveryEnabled: false,
    part1ActionAllowed: false,
    resultFingerprint: expected.safeResultFingerprint,
  };
  const canonicalResult = {
    schemaVersion:
      "final_e2e_dual_platform_publish_result_v1",
    approvalToken:
      "APPROVE_MONEY_SHORTS_PART2_DUAL_PLATFORM_PUBLISH_SAFE_V1",
    status: "FAILED",
    blockerCode:
      "PART2_DUAL_SAFE_INSTAGRAM_CONTAINER_NO_ID",
    armed: true,
    finishedAtIso: "2026-07-19T00:00:01.000Z",
    contentUnitManifestPath: paths.contentUnitPath,
    ledgerPath: paths.ledgerPath,
    envSecretValuesPrinted: false,
    dotEnvLocalDirectRead: false,
    sideEffectCounters: {},
    contentId: currentBinding.contentId,
    version: currentBinding.version,
    wizardProductionPartId: "part-2",
    contentUnitSha256: currentBinding.contentUnitSha256,
    instagramSourceSha256:
      currentBinding.instagramSourceSha256,
    youtubeSourceSha256:
      currentBinding.youtubeSourceSha256,
    publishMetadataSha256:
      currentBinding.publishMetadataSha256,
    finalVideoApprovalFingerprint:
      currentBinding.finalVideoApprovalFingerprint,
    publicationAttemptFingerprint:
      plan.publicationAttemptFingerprint,
    executionResult: {},
    partialExternalState: null,
    safeAuthorization: {
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
    },
    resultFingerprint:
      expected.canonicalResultFingerprint,
  };
  return {
    safeResult,
    canonicalResult,
    currentBinding,
    plan,
    paths,
    expected,
  };
}

function originalSafePlanFixture(facts = baseFacts()) {
  return {
    planFingerprint: facts.originalPlanFingerprint,
    currentBinding: structuredClone(facts.currentBinding),
    publicationAttemptFingerprint:
      facts.originalPublicationAttemptFingerprint,
    expectedInstagramAccountId:
      facts.expectedInstagramAccountId,
    expectedYoutubeChannelId:
      facts.expectedYoutubeChannelId,
    ledgerBaselineSha256: facts.ledger.sha256,
    safety: {
      productionPartId: "part-2",
      part1ActionAllowed: false,
      automaticRetryAllowed: false,
      blobOverwriteAllowed: false,
      accountIdentityVerificationRequiredBeforeMutation:
        true,
      youtubeRetryDisabled: true,
      blobSdkRetryCount: 0,
    },
  };
}

const baselineFacts = baseFacts();
const baselinePlanResult =
  buildMoneyShortsPart2InstagramRecoveryReviewPlan(
    baselineFacts,
  );
check("baseline review plan builds", baselinePlanResult.ok);
check(
  "review status is not execution readiness",
  baselinePlanResult.plan?.status ===
    "LOCAL_RECOVERY_REVIEW_OK" &&
    baselinePlanResult.plan?.readyForOwnerReview === true &&
    baselinePlanResult.plan?.readyForActualExecution ===
      false,
);
check(
  "review explicitly requires new Owner approval",
  baselinePlanResult.plan?.ownerApprovalRequired === true &&
    baselinePlanResult.plan?.priorAuthorization?.consumed ===
      true &&
    baselinePlanResult.plan?.priorAuthorization?.reusable ===
      false,
);
check(
  "review remains unsafe to retry or publish",
  baselinePlanResult.plan?.safeToRetry === false &&
    baselinePlanResult.plan?.safeToPublish === false &&
    baselinePlanResult.plan?.duplicateSafety
      ?.safeToRepublish === false,
);
check(
  "external publication state remains unknown",
  baselinePlanResult.plan?.duplicateSafety
    ?.externalInstagramPublicationState === "unknown" &&
    baselinePlanResult.plan?.duplicateSafety
      ?.freshExternalReconciliationPerformed === false,
);
check(
  "pending gates remain exact",
  JSON.stringify(baselinePlanResult.plan?.pendingGates) ===
    JSON.stringify([
      "live_instagram_reconciliation",
      "new_owner_mutation_approval",
      "actual_runner_implemented_and_validated",
    ]),
);
check(
  "future execution boundary authorizes no mutation",
  baselinePlanResult.plan?.futureExecutionBoundary
    ?.executionAuthorized === false &&
    baselinePlanResult.plan?.futureExecutionBoundary
      ?.instagramContainerCreateAllowed === false &&
    baselinePlanResult.plan?.futureExecutionBoundary
      ?.instagramPublishAllowed === false &&
    baselinePlanResult.plan?.futureExecutionBoundary
      ?.youtubeInsertAllowed === false &&
    baselinePlanResult.plan?.futureExecutionBoundary
      ?.ledgerWriteAllowed === false,
);
check(
  "review plan is deterministic",
  JSON.stringify(baselinePlanResult) ===
    JSON.stringify(
      buildMoneyShortsPart2InstagramRecoveryReviewPlan(
        structuredClone(baselineFacts),
      ),
    ),
);

const preflight =
  buildMoneyShortsPart2InstagramRecoveryPreflight({
    plan: baselinePlanResult.plan,
  });
check("preflight builds", preflight != null);
check(
  "preflight validates against exact fingerprint",
  validateMoneyShortsPart2InstagramRecoveryPreflight({
    evidence: preflight,
    currentPlan: baselinePlanResult.plan,
    expectedPreflightFingerprint:
      preflight?.preflightFingerprint,
  }).valid === true,
);
const tamperedPreflight = structuredClone(preflight);
tamperedPreflight.safeToRetry = true;
check(
  "tampered preflight fails closed",
  validateMoneyShortsPart2InstagramRecoveryPreflight({
    evidence: tamperedPreflight,
    currentPlan: baselinePlanResult.plan,
    expectedPreflightFingerprint:
      preflight?.preflightFingerprint,
  }).valid === false,
);
check(
  "zero counters cover every mutation class",
  Object.values(
    zeroMoneyShortsPart2InstagramRecoveryPreflightCounters(),
  ).every((value) => value === 0),
);

const finalSafeState = fullPendingState();
const finalCanonicalState =
  structuredClone(finalSafeState);
check(
  "exact final ambiguous public state is valid",
  finalStateValidation(
    finalSafeState,
    finalCanonicalState,
  ).valid === true,
);
const contradictoryFinalStates = [
  [
    "Instagram published status",
    (state) => {
      state.instagram.status = "published";
    },
  ],
  [
    "YouTube uploaded status",
    (state) => {
      state.youtube.status = "uploaded";
    },
  ],
  [
    "Instagram last status code",
    (state) => {
      state.instagram.lastStatusCode = "FINISHED";
    },
  ],
  [
    "ledger written status",
    (state) => {
      state.ledger.status = "written";
    },
  ],
  [
    "ledger write success",
    (state) => {
      state.ledger.writeOk = true;
    },
  ],
  [
    "ledger recorded key",
    (state) => {
      state.ledger.recordedKeys = ["unexpected-key"];
    },
  ],
];
for (const [label, mutate] of contradictoryFinalStates) {
  const safeState = fullPendingState();
  const canonicalState = structuredClone(safeState);
  mutate(safeState);
  mutate(canonicalState);
  check(
    `${label} is incompatible with unknown outcome`,
    finalStateValidation(
      safeState,
      canonicalState,
    ).valid === false,
  );
}
const divergentCanonicalState =
  structuredClone(finalCanonicalState);
divergentCanonicalState.instagram.status = "published";
check(
  "safe and canonical final state divergence fails closed",
  finalStateValidation(
    finalSafeState,
    divergentCanonicalState,
  ).valid === false,
);

const exactIntentState = intentStateFixture();
check(
  "exact pre-call container intent state is valid",
  intentStateValidation(exactIntentState).valid === true,
);
const driftedIntentOutcome = intentStateFixture();
driftedIntentOutcome.safeEvent.publicState.instagram.outcome =
  "unknown";
check(
  "intent event cannot claim a post-call unknown outcome",
  intentStateValidation(driftedIntentOutcome).valid === false,
);
const driftedIntentCounter = intentStateFixture();
driftedIntentCounter.canonicalEvent.state.sideEffectCounters
  .instagramContainerCreateCount = 1;
check(
  "intent event cannot count the container call early",
  intentStateValidation(driftedIntentCounter).valid === false,
);
const expandedIntentState = intentStateFixture();
expandedIntentState.safeEvent.publicState.instagram.rawMessage =
  "provider payload";
check(
  "intent state extra provider field fails closed",
  intentStateValidation(expandedIntentState).valid === false,
);

const originalSafePlan = originalSafePlanFixture();
const exactSafeClaim =
  safeClaimEnvelopeFixture(originalSafePlan);
check(
  "exact safe claim envelope is valid",
  validateMoneyShortsPart2InstagramRecoverySafeClaimEnvelope(
    {
      claim: exactSafeClaim,
      currentPlan: originalSafePlan,
      expectedClaimFingerprint:
        exactSafeClaim.claimFingerprint,
      expectedPreflightFingerprint:
        exactSafeClaim.preflightFingerprint,
    },
  ).valid === true,
);
const widenedClaimSafety = structuredClone(exactSafeClaim);
widenedClaimSafety.safety.automaticRetryAllowed = true;
check(
  "widened safe claim retry authorization fails closed",
  validateMoneyShortsPart2InstagramRecoverySafeClaimEnvelope(
    {
      claim: widenedClaimSafety,
      currentPlan: originalSafePlan,
      expectedClaimFingerprint:
        exactSafeClaim.claimFingerprint,
      expectedPreflightFingerprint:
        exactSafeClaim.preflightFingerprint,
    },
  ).valid === false,
);
const expandedSafeClaim = structuredClone(exactSafeClaim);
expandedSafeClaim.rawApproval = "must-not-pass";
check(
  "safe claim top-level extra field fails closed",
  validateMoneyShortsPart2InstagramRecoverySafeClaimEnvelope(
    {
      claim: expandedSafeClaim,
      currentPlan: originalSafePlan,
      expectedClaimFingerprint:
        exactSafeClaim.claimFingerprint,
      expectedPreflightFingerprint:
        exactSafeClaim.preflightFingerprint,
    },
  ).valid === false,
);

const exactResultEnvelopes =
  resultEnvelopeFixture(originalSafePlan);
check(
  "exact safe and canonical result envelopes are valid",
  validateMoneyShortsPart2InstagramRecoveryResultEnvelopes(
    exactResultEnvelopes,
  ).valid === true,
);
const partialExternalId = structuredClone(
  exactResultEnvelopes,
);
partialExternalId.canonicalResult.partialExternalState = {
  instagramContainerId: "unexpected-external-id",
};
check(
  "partial external id cannot coexist with unknown outcome",
  validateMoneyShortsPart2InstagramRecoveryResultEnvelopes(
    partialExternalId,
  ).valid === false,
);
const widenedSafeAuthorization = structuredClone(
  exactResultEnvelopes,
);
widenedSafeAuthorization.canonicalResult.safeAuthorization
  .blobSdkRetryCount = 1;
check(
  "canonical retry authorization drift fails closed",
  validateMoneyShortsPart2InstagramRecoveryResultEnvelopes(
    widenedSafeAuthorization,
  ).valid === false,
);
const wrongSafeAccount = structuredClone(
  exactResultEnvelopes,
);
wrongSafeAccount.safeResult.expectedInstagramAccountId =
  "17841400000000001";
check(
  "safe result account drift fails closed",
  validateMoneyShortsPart2InstagramRecoveryResultEnvelopes(
    wrongSafeAccount,
  ).valid === false,
);
const expandedCanonicalResult = structuredClone(
  exactResultEnvelopes,
);
expandedCanonicalResult.canonicalResult.rawProviderMessage =
  "must-not-pass";
check(
  "canonical result top-level extra field fails closed",
  validateMoneyShortsPart2InstagramRecoveryResultEnvelopes(
    expandedCanonicalResult,
  ).valid === false,
);
const wrongApprovalToken = structuredClone(
  exactResultEnvelopes,
);
wrongApprovalToken.canonicalResult.approvalToken =
  "WRONG_APPROVAL";
check(
  "canonical approval token drift fails closed",
  validateMoneyShortsPart2InstagramRecoveryResultEnvelopes(
    wrongApprovalToken,
  ).valid === false,
);

const wrongPart = mutateFacts((facts) => {
  facts.currentBinding.contentId =
    "wizard-finance-fixture-part-1";
  facts.currentBinding.productionPartId = "part-1";
});
check(
  "wrong part binding fails closed",
  buildMoneyShortsPart2InstagramRecoveryReviewPlan(
    wrongPart,
  ).reason ===
    "PART2_INSTAGRAM_RECOVERY_PREFLIGHT_BINDING_INVALID",
);
const expandedBinding = mutateFacts((facts) => {
  facts.currentBinding.rawToken = "must-not-pass";
});
check(
  "binding extra field fails closed without leaking",
  buildMoneyShortsPart2InstagramRecoveryReviewPlan(
    expandedBinding,
  ).reason ===
    "PART2_INSTAGRAM_RECOVERY_PREFLIGHT_BINDING_INVALID",
);
const expandedOriginalEvidence = mutateFacts((facts) => {
  facts.originalEvidence.rawMessage =
    "must-not-enter-preflight";
});
check(
  "original evidence extra field fails closed",
  buildMoneyShortsPart2InstagramRecoveryReviewPlan(
    expandedOriginalEvidence,
  ).reason ===
    "PART2_INSTAGRAM_RECOVERY_PREFLIGHT_SOURCE_EVIDENCE_INVALID",
);
const expandedFailureCounters = mutateFacts((facts) => {
  facts.failure.counters.unexpectedMutationCount = 0;
});
check(
  "failure counter extra field fails closed",
  buildMoneyShortsPart2InstagramRecoveryReviewPlan(
    expandedFailureCounters,
  ).reason ===
    "PART2_INSTAGRAM_RECOVERY_PREFLIGHT_FAILURE_BOUNDARY_INVALID",
);
const expandedNormalizedDiagnostic = mutateFacts((facts) => {
  facts.failure.diagnosticState = {
    state: "available",
    responseReceived: true,
    httpStatus: 400,
    responseOk: false,
    jsonParsed: true,
    containerIdPresent: false,
    providerError: {
      code: 100,
      errorSubcode: null,
      type: "IGApiException",
      isTransient: false,
    },
    rawMessage: "must-not-enter-preflight",
  };
});
check(
  "normalized diagnostic extra field fails closed",
  buildMoneyShortsPart2InstagramRecoveryReviewPlan(
    expandedNormalizedDiagnostic,
  ).reason ===
    "PART2_INSTAGRAM_RECOVERY_PREFLIGHT_FAILURE_BOUNDARY_INVALID",
);
const reorderedChain = mutateFacts((facts) => {
  [
    facts.safeJournal.transitions[8],
    facts.safeJournal.transitions[9],
  ] = [
    facts.safeJournal.transitions[9],
    facts.safeJournal.transitions[8],
  ];
});
check(
  "reordered transition chain fails closed",
  buildMoneyShortsPart2InstagramRecoveryReviewPlan(
    reorderedChain,
  ).reason ===
    "PART2_INSTAGRAM_RECOVERY_PREFLIGHT_SOURCE_EVIDENCE_INVALID",
);
const downstreamAction = mutateFacts((facts) => {
  facts.failure.counters.instagramPublishCount = 1;
});
check(
  "downstream Instagram publish activity fails closed",
  buildMoneyShortsPart2InstagramRecoveryReviewPlan(
    downstreamAction,
  ).reason ===
    "PART2_INSTAGRAM_RECOVERY_PREFLIGHT_FAILURE_BOUNDARY_INVALID",
);
const youtubeAction = mutateFacts((facts) => {
  facts.failure.counters.youtubeInsertCount = 1;
});
check(
  "YouTube activity fails closed",
  buildMoneyShortsPart2InstagramRecoveryReviewPlan(
    youtubeAction,
  ).reason ===
    "PART2_INSTAGRAM_RECOVERY_PREFLIGHT_FAILURE_BOUNDARY_INVALID",
);
const dirtyLedger = mutateFacts((facts) => {
  facts.ledger.clean = false;
});
check(
  "dirty ledger fails closed",
  buildMoneyShortsPart2InstagramRecoveryReviewPlan(
    dirtyLedger,
  ).reason ===
    "PART2_INSTAGRAM_RECOVERY_PREFLIGHT_LEDGER_NOT_EXACTLY_CLEAN",
);
const driftedLedger = mutateFacts((facts) => {
  facts.ledger.sha256 = hash("drifted-ledger");
});
check(
  "ledger hash drift fails closed",
  buildMoneyShortsPart2InstagramRecoveryReviewPlan(
    driftedLedger,
  ).reason ===
    "PART2_INSTAGRAM_RECOVERY_PREFLIGHT_LEDGER_NOT_EXACTLY_CLEAN",
);
const liveBlobHead = mutateFacts((facts) => {
  facts.blob.liveHeadChecked = true;
});
check(
  "unexpected live Blob check fails closed",
  buildMoneyShortsPart2InstagramRecoveryReviewPlan(
    liveBlobHead,
  ).reason ===
    "PART2_INSTAGRAM_RECOVERY_PREFLIGHT_BLOB_EVIDENCE_INVALID",
);
const recoveryUpgrade = mutateFacts((facts) => {
  facts.recovery.state = "recoverable";
  facts.recovery.recoverablePlatformCandidate =
    "instagram_reels";
});
check(
  "ambiguous recovery cannot be upgraded locally",
  buildMoneyShortsPart2InstagramRecoveryReviewPlan(
    recoveryUpgrade,
  ).reason ===
    "PART2_INSTAGRAM_RECOVERY_PREFLIGHT_CLASSIFICATION_INVALID",
);
const reusableApproval = mutateFacts((facts) => {
  facts.priorAuthorizationConsumed = false;
});
check(
  "unconsumed old approval assertion fails closed",
  buildMoneyShortsPart2InstagramRecoveryReviewPlan(
    reusableApproval,
  ).reason ===
    "PART2_INSTAGRAM_RECOVERY_PREFLIGHT_FAILURE_BOUNDARY_INVALID",
);

const rawDiagnostic = {
  responseReceived: true,
  httpStatus: 400,
  responseOk: false,
  jsonParsed: true,
  containerIdPresent: false,
  providerError: {
    code: 100,
    errorSubcode: null,
    type: "IGApiException",
    isTransient: false,
  },
};
check(
  "legacy diagnostic absence is represented without inference",
  normalizeMoneyShortsPart2InstagramContainerDiagnosticPair(
    {
      safeInstagram: {},
      canonicalInstagram: {},
    },
  ).value === "legacy_absent",
);
check(
  "exact matching allowlisted diagnostic is accepted",
  normalizeMoneyShortsPart2InstagramContainerDiagnosticPair(
    {
      safeInstagram: {
        containerCreateDiagnostic: rawDiagnostic,
      },
      canonicalInstagram: {
        containerCreateDiagnostic:
          structuredClone(rawDiagnostic),
      },
    },
  ).value?.state === "available",
);
const malformedDiagnostic = structuredClone(rawDiagnostic);
malformedDiagnostic.responseReceived = "true";
check(
  "malformed diagnostic scalar fails closed",
  normalizeMoneyShortsPart2InstagramContainerDiagnosticPair(
    {
      safeInstagram: {
        containerCreateDiagnostic: malformedDiagnostic,
      },
      canonicalInstagram: {
        containerCreateDiagnostic:
          structuredClone(malformedDiagnostic),
      },
    },
  ).ok === false,
);
const expandedDiagnostic = structuredClone(rawDiagnostic);
expandedDiagnostic.rawResponse = "secret-or-provider-payload";
check(
  "diagnostic extra field fails closed",
  normalizeMoneyShortsPart2InstagramContainerDiagnosticPair(
    {
      safeInstagram: {
        containerCreateDiagnostic: expandedDiagnostic,
      },
      canonicalInstagram: {
        containerCreateDiagnostic:
          structuredClone(expandedDiagnostic),
      },
    },
  ).ok === false,
);
check(
  "mismatched diagnostic pair fails closed",
  normalizeMoneyShortsPart2InstagramContainerDiagnosticPair(
    {
      safeInstagram: {
        containerCreateDiagnostic: rawDiagnostic,
      },
      canonicalInstagram: {
        containerCreateDiagnostic: null,
      },
    },
  ).ok === false,
);

const argv = expectedArgs();
check(
  "exact argument set parses",
  parseMoneyShortsPart2InstagramRecoveryPreflightArgs(
    argv,
  ).ok === true,
);
check(
  "armed flag is structurally forbidden",
  parseMoneyShortsPart2InstagramRecoveryPreflightArgs([
    "--arm",
  ]).reason ===
    "PART2_INSTAGRAM_RECOVERY_PREFLIGHT_LIVE_FLAG_FORBIDDEN",
);
check(
  "unknown argument fails closed",
  parseMoneyShortsPart2InstagramRecoveryPreflightArgs([
    "--unknown",
    "value",
  ]).reason ===
    "PART2_INSTAGRAM_RECOVERY_PREFLIGHT_UNKNOWN_ARGUMENT",
);
check(
  "duplicate argument fails closed",
  parseMoneyShortsPart2InstagramRecoveryPreflightArgs([
    ...argv,
    "--expected-content-id",
    baselineFacts.currentBinding.contentId,
  ]).reason ===
    "PART2_INSTAGRAM_RECOVERY_PREFLIGHT_ARGUMENT_VALUE_INVALID",
);

let pathCalls = 0;
let contextCalls = 0;
let factsCalls = 0;
const injectedRun =
  await runMoneyShortsPart2InstagramRecoveryPreflightTestOnly({
    argv,
    pathsResolver() {
      pathCalls += 1;
      return {
        ok: true,
        paths: {
          contentUnitPath: "fixture-content-unit",
          ledgerPath: "fixture-ledger",
          outDir: "fixture-out-dir",
        },
      };
    },
    contextInspector() {
      contextCalls += 1;
      return { ok: true };
    },
    factsInspector() {
      factsCalls += 1;
      return {
        ok: true,
        facts: structuredClone(baselineFacts),
      };
    },
  });
check(
  "injected local run succeeds without a live branch",
  injectedRun.ok === true &&
    injectedRun.status === "LOCAL_RECOVERY_REVIEW_OK" &&
    injectedRun.readyForActualExecution === false &&
    injectedRun.ownerApprovalRequired === true &&
    injectedRun.safeToRetry === false &&
    injectedRun.safeToPublish === false &&
    injectedRun.noLiveActions === true,
);
check(
  "injected run performs a stable two-pass inspection",
  pathCalls === 1 && contextCalls === 2 && factsCalls === 2,
);
check(
  "injected run reports only zero side effects",
  Object.values(injectedRun.sideEffectCounters).every(
    (value) => value === 0,
  ),
);

pathCalls = 0;
contextCalls = 0;
factsCalls = 0;
const wrongInspectionArgv = [...argv];
wrongInspectionArgv[
  wrongInspectionArgv.indexOf("--inspection") + 1
] = "WRONG_INSPECTION";
const wrongInspectionRun =
  await runMoneyShortsPart2InstagramRecoveryPreflightTestOnly({
    argv: wrongInspectionArgv,
    pathsResolver() {
      pathCalls += 1;
      return { ok: false, reason: "unexpected" };
    },
    contextInspector() {
      contextCalls += 1;
      return { ok: false, reason: "unexpected" };
    },
    factsInspector() {
      factsCalls += 1;
      return { ok: false, reason: "unexpected" };
    },
  });
check(
  "wrong inspection is rejected before filesystem inspection",
  wrongInspectionRun.reason ===
    "PART2_INSTAGRAM_RECOVERY_PREFLIGHT_EXACT_INSPECTION_REQUIRED" &&
    pathCalls === 0 &&
    contextCalls === 0 &&
    factsCalls === 0,
);

const mismatchedSnapshotArgv = [...argv];
mismatchedSnapshotArgv[
  mismatchedSnapshotArgv.indexOf(
    "--expected-original-ledger-sha256",
  ) + 1
] = hash("other-ledger");
const mismatchedSnapshotRun =
  await runMoneyShortsPart2InstagramRecoveryPreflightTestOnly({
    argv: mismatchedSnapshotArgv,
    pathsResolver() {
      return {
        ok: true,
        paths: {
          contentUnitPath: "fixture-content-unit",
          ledgerPath: "fixture-ledger",
          outDir: "fixture-out-dir",
        },
      };
    },
    contextInspector() {
      return { ok: true };
    },
    factsInspector() {
      return {
        ok: true,
        facts: structuredClone(baselineFacts),
      };
    },
  });
check(
  "exact source snapshot mismatch fails closed",
  mismatchedSnapshotRun.reason ===
    "PART2_INSTAGRAM_RECOVERY_PREFLIGHT_SOURCE_SNAPSHOT_MISMATCH",
);

let driftingFactReadCount = 0;
const driftingInspectionRun =
  await runMoneyShortsPart2InstagramRecoveryPreflightTestOnly({
    argv,
    pathsResolver() {
      return {
        ok: true,
        paths: {
          contentUnitPath: "fixture-content-unit",
          ledgerPath: "fixture-ledger",
          outDir: "fixture-out-dir",
        },
      };
    },
    contextInspector() {
      return { ok: true };
    },
    factsInspector() {
      driftingFactReadCount += 1;
      const facts = structuredClone(baselineFacts);
      if (driftingFactReadCount === 2) {
        facts.safeJournal.latestEventSha256 =
          hash("mid-inspection-drift");
      }
      return { ok: true, facts };
    },
  });
check(
  "two-pass inspection rejects mid-run source drift",
  driftingInspectionRun.reason ===
    "PART2_INSTAGRAM_RECOVERY_PREFLIGHT_SOURCE_DRIFT_DETECTED" &&
    driftingFactReadCount === 2,
);

const actualRecoveryArgs = [
  "--inspection",
  "INSPECT_PART2_INSTAGRAM_RECOVERY_EVIDENCE_V1",
  "--content-unit",
  "C:\\tmp\\money-shorts-os\\web-wizard-create-v1\\" +
    "gen-finance-editorial-v2-time-retirement-wealth-standard-05\\" +
    "publish\\v5\\part-2\\" +
    "dual_platform_content_unit." +
    "wizard-gen-finance-editorial-v2-time-retirement-wealth-" +
    "standard-05-part-2.v5.json",
  "--ledger",
  "C:\\tmp\\money-shorts-os\\" +
    "final-e2e-ready-content-unit-and-publish-one-v1\\" +
    "publish-ledger.json",
  "--out-dir",
  "C:\\tmp\\money-shorts-os\\web-wizard-create-v1\\" +
    "gen-finance-editorial-v2-time-retirement-wealth-standard-05\\" +
    "publish\\v5\\part-2",
  "--expected-content-id",
  "wizard-gen-finance-editorial-v2-time-retirement-wealth-" +
    "standard-05-part-2",
  "--expected-manifest-sha256",
  "f71e8f303cdeb22c06af0f7998a619d91d1b0f24c90a7b9d1c3846144c6bf099",
  "--expected-source-sha256",
  "bd9286b24f6463ae4a876e2c6414d49083b350c3759e9e33c60d27e0ca9a9d98",
  "--expected-publication-attempt-fingerprint",
  "67c80571d55409dc0dd792b2a121bc89b0ecab8f785174fae3a36a8231bfdeb3",
  "--expected-instagram-account-id",
  "17841414372742257",
  "--expected-youtube-channel-id",
  "UCR23z78qDtyhHIaV29rSB9A",
  "--expected-original-safe-preflight-fingerprint",
  "cfbd5ad7ecc0598f26202af1f91e1c53660bcee9d664929fc8b929e61caa0a05",
  "--expected-original-safe-claim-fingerprint",
  "096b6422ed695caf8cfb46007a77136b762d449765bf68a71c490e3b470e8436",
  "--expected-original-safe-result-fingerprint",
  "7f4dbcd3cb23d81fae0d64d175f0ff273996a19e23befd13405604ff466c9ce8",
  "--expected-original-canonical-result-fingerprint",
  "fa7615fb8150181760a1b00bdd02ddc0215c1ceb9d5e96e20b96f0c63481862c",
  "--expected-original-plan-fingerprint",
  "31451300ef8fa74d2e94798c18cbbc764457cdefa52cc2fc8f48a174ab9d115a",
  "--expected-original-safe-preflight-file-sha256",
  "9f110deca01864f96f9c21136fa078268ddbeab9a0c09d0f9bbf05fc1598cbb3",
  "--expected-original-safe-claim-file-sha256",
  "67d8adbd4b4b4a8414a6757b4c4b68d3b92d8f00b73949f79f2bb30a6739975a",
  "--expected-original-safe-result-file-sha256",
  "79279801e323224c8ce0b350cb06f3dbde0dd197587ffab6f855fd8ce6ed01fa",
  "--expected-original-safe-latest-event-sha256",
  "27a513d3e10d27d5c59511daf62db6433a3176359c3f3719691d67e4e517d5c7",
  "--expected-original-canonical-attempt-claim-file-sha256",
  "9ae8150a888445f9e7ffec5169ce14e1d68312aced803f61847b441b3dc8283f",
  "--expected-original-canonical-latest-event-sha256",
  "8721d9dc58c1dfe07d003d8bf264fb96273013274047d6b9984cdd2b15be1e80",
  "--expected-original-canonical-result-file-sha256",
  "f28ff3a441dc3c40cc00242975aace78f9c7a3742e18e67f3f33b90e7125be6c",
  "--expected-original-ledger-sha256",
  "7c21604d088d085cc99c2a1c2d39c037edaabc4f884d247601f187b7646174e5",
  "--expected-original-blob-url-sha256",
  "d697f83c913ab98776865060c069f569dc063b818761fb0cebd498a37134a505",
  "--expected-original-recovery-fingerprint",
  "090e48b642ec6ad823193640a65a44ef616782e4845bc0e4597cc9ba8373cad8",
];
const actualProductionRun =
  await runMoneyShortsPart2InstagramRecoveryPreflight({
    argv: actualRecoveryArgs,
  });
check(
  "default production inspectors validate the immutable real evidence",
  actualProductionRun.ok === true &&
    actualProductionRun.status ===
      "LOCAL_RECOVERY_REVIEW_OK" &&
    actualProductionRun.recoveryPlanFingerprint ===
      "d67b8f0447cc94aa5fd22869c436c1f4015e1c928951eaa62ef068c91e994cc1" &&
    actualProductionRun.preflightFingerprint ===
      "4f6939509c387cb35af0e8d6f2401a26d2629e12f8ec55f80ee484a1da787876" &&
    Object.values(
      actualProductionRun.sideEffectCounters,
    ).every((value) => value === 0),
  actualProductionRun.reason ?? "",
);

const runnerSource = readFileSync(
  new URL(
    "./run-money-shorts-part2-instagram-recovery-preflight-v1.mjs",
    import.meta.url,
  ),
  "utf8",
);
const forbiddenSourcePatterns = [
  ["env access", /process\.env/],
  [
    "network transport",
    /\bfetch\s*\(|\b(?:http|https)\.request\s*\(|\baxios\b|\bundici\b|\bXMLHttpRequest\b|\bWebSocket\b|\b(?:net|tls)\.connect\s*\(/,
  ],
  ["child process", /node:child_process/],
  [
    "filesystem write",
    /\b(?:writeFile|appendFile|createWriteStream|openSync|renameSync|copyFileSync|truncate|mkdirSync|symlinkSync|linkSync)\b/,
  ],
  [
    "filesystem delete",
    /\b(?:rmSync|unlinkSync|rmdirSync)\b/,
  ],
  ["Blob SDK", /@vercel\/blob/],
  ["Google SDK", /\bgoogleapis\b/],
  ["secret key name", /INSTAGRAM_ACCESS_TOKEN/],
  ["wall-clock timestamp", /\bDate\.now\b|\bnew Date\s*\(/],
  ["random identifier", /\brandomUUID\b/],
];
for (const [label, pattern] of forbiddenSourcePatterns) {
  check(
    `runner source has no ${label}`,
    !pattern.test(runnerSource),
  );
}

console.log(`RESULT ${passed} passed, ${failed} failed`);
if (failed > 0) process.exitCode = 1;
