import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  classifyMoneyShortsPublishRecovery,
  MONEY_SHORTS_PUBLISH_RECOVERY_VERSION,
} from "../lib/money-shorts-publish-recovery.mjs";
import {
  MONEY_SHORTS_PUBLISH_ATTEMPT_CLAIM_VERSION,
  fingerprintMoneyShortsPublishAttemptBinding,
} from "../lib/money-shorts-publish-attempt-journal.mjs";
import { buildMoneyShortsResumablePlan } from "../lib/money-shorts-resumable-orchestrator.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const runnerSource = readFileSync(
  join(ROOT, "scripts", "run-final-e2e-dual-platform-publish-once.mjs"),
  "utf8",
);
const routeSource = readFileSync(
  join(ROOT, "app", "api", "money-shorts", "operator", "route.ts"),
  "utf8",
);
const helperSource = readFileSync(
  join(ROOT, "lib", "owner-web-operator.ts"),
  "utf8",
);
const wizardSource = readFileSync(
  join(ROOT, "components", "VideoCreationWizard.tsx"),
  "utf8",
);
const readModelSource = readFileSync(
  join(ROOT, "lib", "money-shorts-automation-read-model.ts"),
  "utf8",
);

let passed = 0;
let failed = 0;

function check(name, condition, detail = "") {
  if (condition) {
    passed += 1;
    console.log(`PASS  ${name}`);
  } else {
    failed += 1;
    console.error(`FAIL  ${name}${detail ? ` - ${detail}` : ""}`);
  }
}

function minPresent(...indexes) {
  const present = indexes.filter((index) => index >= 0);
  return present.length > 0 ? Math.min(...present) : -1;
}

function sourceBlock(source, startToken, endToken = null) {
  const start = source.indexOf(startToken);
  if (start < 0) {
    return "";
  }
  if (endToken == null) {
    return source.slice(start);
  }
  const end = source.indexOf(endToken, start + startToken.length);
  return end > start ? source.slice(start, end) : source.slice(start);
}

const SHA = Object.freeze({
  contentUnit: "a".repeat(64),
  instagramSource: "b".repeat(64),
  youtubeSource: "c".repeat(64),
  publishMetadata: "d".repeat(64),
  finalApproval: "e".repeat(64),
  result: "f".repeat(64),
  alternate: "1".repeat(64),
});

const CURRENT_BINDING = Object.freeze({
  contentId: "wizard-finance-test",
  version: "wizard_finance_publish_v1",
  productionPartId: "single",
  contentUnitManifestPath:
    "C:\\tmp\\money-shorts-os\\wizard-publish\\finance-test\\content-unit.json",
  contentUnitSha256: SHA.contentUnit,
  instagramSourceSha256: SHA.instagramSource,
  youtubeSourceSha256: SHA.youtubeSource,
  publishMetadataSha256: SHA.publishMetadata,
  finalVideoApprovalFingerprint: SHA.finalApproval,
});

const ZERO_COUNTERS = Object.freeze({
  blobPutCount: 0,
  blobHeadCount: 0,
  instagramContainerCreateCount: 0,
  instagramStatusPollCount: 0,
  instagramPublishCount: 0,
  youtubeInsertCount: 0,
  ledgerWriteCount: 0,
  envSecretValuePrintCount: 0,
});

function makeEvidence({
  status = "FAILED",
  binding = CURRENT_BINDING,
  counters = {},
  instagram = {},
  youtube = {},
} = {}) {
  const publicationAttemptFingerprint = createHash("sha256")
    .update(
      JSON.stringify({
        contentId: binding.contentId,
        version: binding.version,
        wizardProductionPartId: binding.productionPartId,
        contentUnitManifestPath:
          binding.contentUnitManifestPath,
        contentUnitSha256: binding.contentUnitSha256,
        instagramSourceSha256:
          binding.instagramSourceSha256,
        youtubeSourceSha256:
          binding.youtubeSourceSha256,
        publishMetadataSha256:
          binding.publishMetadataSha256,
        finalVideoApprovalFingerprint:
          binding.finalVideoApprovalFingerprint,
      }),
    )
    .digest("hex");
  return {
    schemaVersion: "final_e2e_dual_platform_publish_result_v1",
    armed: true,
    status,
    envSecretValuesPrinted: false,
    dotEnvLocalDirectRead: false,
    contentId: binding.contentId,
    version: binding.version,
    wizardProductionPartId: binding.productionPartId,
    contentUnitManifestPath: binding.contentUnitManifestPath,
    contentUnitSha256: binding.contentUnitSha256,
    instagramSourceSha256: binding.instagramSourceSha256,
    youtubeSourceSha256: binding.youtubeSourceSha256,
    publishMetadataSha256: binding.publishMetadataSha256,
    finalVideoApprovalFingerprint:
      binding.finalVideoApprovalFingerprint,
    publicationAttemptFingerprint,
    sideEffectCounters: {
      ...ZERO_COUNTERS,
      ...counters,
    },
    executionResult: {
      instagram: {
        status: "pending",
        outcome: "not_started",
        mediaId: null,
        ...instagram,
      },
      youtube: {
        status: "pending",
        outcome: "not_started",
        videoId: null,
        ...youtube,
      },
    },
  };
}

function makeResultFile(evidence, sha256 = SHA.result) {
  return {
    exists: true,
    parseOk: true,
    sha256,
    evidence,
  };
}

function makeAttemptFile(
  binding = CURRENT_BINDING,
  overrides = {},
) {
  const evidence = {
    schemaVersion:
      MONEY_SHORTS_PUBLISH_ATTEMPT_CLAIM_VERSION,
    armed: true,
    claimId: "claim-recovery-test",
    claimedAtIso: "2026-07-18T00:00:00.000Z",
    publicationAttemptFingerprint:
      fingerprintMoneyShortsPublishAttemptBinding(binding),
    binding: { ...binding },
    ...overrides,
  };
  return {
    exists: true,
    parseOk: true,
    sha256: createHash("sha256")
      .update(JSON.stringify(evidence))
      .digest("hex"),
    evidence,
  };
}

function makeLedger(overrides = {}) {
  return {
    readOk: true,
    instagramAlreadyPublished: false,
    youtubeAlreadyPublished: false,
    instagramPublishedIdReference: null,
    youtubePublishedIdReference: null,
    ...overrides,
  };
}

function classify({
  resultFile = { exists: false },
  attemptFile = { exists: false },
  currentBinding = CURRENT_BINDING,
  ledgerEvidence = makeLedger(),
} = {}) {
  return classifyMoneyShortsPublishRecovery({
    resultFile,
    attemptFile,
    currentBinding,
    ledgerEvidence,
  });
}

const plans = [];
function expectState(name, expectedState, input) {
  const plan = classify(input);
  plans.push(plan);
  check(
    name,
    plan.state === expectedState,
    `expected=${expectedState}, actual=${plan.state}, reason=${plan.reason}`,
  );
  return plan;
}

const notStarted = expectState(
  "clean ledger with no armed result is not_started",
  "not_started",
);
check(
  "not_started is the only state that leaves generic dual upload unblocked",
  notStarted.genericDualUploadBlocked === false &&
    notStarted.manualRecoveryRequired === false &&
    notStarted.recoveryFingerprint === null,
);

const claimWithoutResult = expectState(
  "exact armed claim without a result is ambiguous",
  "ambiguous",
  { attemptFile: makeAttemptFile() },
);
check(
  "claim-only evidence is visible and blocks every automatic retry",
  claimWithoutResult.reason ===
    "armed_attempt_claim_present_result_missing" &&
    claimWithoutResult.attemptEvidencePresent === true &&
    claimWithoutResult.attemptClaimSha256 !== null &&
    claimWithoutResult.genericDualUploadBlocked === true &&
    claimWithoutResult.automaticRetryAllowed === false,
);
const corruptClaim = expectState(
  "unreadable claim remains ambiguous instead of not_started",
  "ambiguous",
  {
    attemptFile: {
      exists: true,
      parseOk: false,
      sha256: SHA.alternate,
      evidence: null,
    },
  },
);
check(
  "unreadable claim has a dedicated fail-closed reason",
  corruptClaim.reason ===
    "attempt_journal_unreadable_or_unhashed",
);
const staleClaim = expectState(
  "claim bound to stale single topology is invalid evidence",
  "invalid_evidence",
  {
    attemptFile: makeAttemptFile(),
    currentBinding: {
      ...CURRENT_BINDING,
      productionPartId: "part-1",
    },
  },
);
check(
  "stale claim cannot disappear into a clean not_started state",
  staleClaim.reason ===
    "attempt_journal_schema_or_artifact_binding_invalid" &&
    staleClaim.genericDualUploadBlocked === true,
);
const dirtyLedgerClaim = expectState(
  "claim plus dirty ledger never implies automatic completion",
  "ambiguous",
  {
    attemptFile: makeAttemptFile(),
    ledgerEvidence: makeLedger({
      instagramAlreadyPublished: true,
      instagramPublishedIdReference: "ig-claim-only",
    }),
  },
);
check(
  "claim remains the manual-review boundary when result is missing",
  dirtyLedgerClaim.reason ===
    "armed_attempt_claim_present_result_missing",
);

const zeroSideEffectEvidence = makeEvidence();
const zeroSideEffectBefore = JSON.stringify(zeroSideEffectEvidence);
const noExternalFailed = expectState(
  "armed failure with zero side effects is no_external_failed",
  "no_external_failed",
  { resultFile: makeResultFile(zeroSideEffectEvidence) },
);
check(
  "zero-side-effect evidence remains manual-only and is not mutated",
  noExternalFailed.manualRecoveryRequired === true &&
    noExternalFailed.automaticRetryAllowed === false &&
    JSON.stringify(zeroSideEffectEvidence) === zeroSideEffectBefore,
);
const matchingClaimResult = expectState(
  "matching result and claim preserve the existing recovery state",
  "no_external_failed",
  {
    resultFile: makeResultFile(zeroSideEffectEvidence),
    attemptFile: makeAttemptFile(),
  },
);
check(
  "matching result and claim are both bound into recovery evidence",
  matchingClaimResult.attemptEvidencePresent === true &&
    matchingClaimResult.attemptClaimSha256 !== null,
);
const conflictingBinding = {
  ...CURRENT_BINDING,
  contentId: "wizard-finance-other",
};
const conflictingResult = expectState(
  "result and exact claim binding conflict is invalid evidence",
  "invalid_evidence",
  {
    resultFile: makeResultFile(
      makeEvidence({ binding: conflictingBinding }),
    ),
    attemptFile: makeAttemptFile(),
  },
);
check(
  "result/claim conflict has a dedicated reason",
  conflictingResult.reason ===
    "result_and_attempt_journal_conflict",
);
for (const [label, malformedCounter] of [
  ["null", null],
  ["string zero", "0"],
  ["boolean false", false],
]) {
  expectState(
    `counter ${label} is invalid evidence instead of numeric zero`,
    "invalid_evidence",
    {
      resultFile: makeResultFile(
        makeEvidence({
          counters: { youtubeInsertCount: malformedCounter },
        }),
      ),
    },
  );
}
expectState(
  "published outcome without an ID cannot be classified as no_external_failed",
  "ambiguous",
  {
    resultFile: makeResultFile(
      makeEvidence({
        instagram: {
          status: "published",
          outcome: "confirmed_published",
        },
      }),
    ),
  },
);
expectState(
  "unknown platform status cannot be classified as no_external_failed",
  "ambiguous",
  {
    resultFile: makeResultFile(
      makeEvidence({
        instagram: {
          status: "garbage",
          outcome: "not_started",
        },
      }),
    ),
  },
);
for (const [label, malformedExecutionResult] of [
  ["array executionResult", []],
  ["string executionResult", "invalid"],
  [
    "array Instagram result",
    { instagram: [], youtube: { status: "pending" } },
  ],
]) {
  const malformedEvidence = makeEvidence();
  malformedEvidence.executionResult = malformedExecutionResult;
  expectState(
    `${label} is invalid evidence`,
    "invalid_evidence",
    {
      resultFile: makeResultFile(malformedEvidence),
    },
  );
}
for (const [label, evidencePatch] of [
  ["unknown top-level status", { status: "garbage" }],
  [
    "tampered publication attempt fingerprint",
    { publicationAttemptFingerprint: SHA.alternate },
  ],
  [
    "secret-print safety flag",
    { envSecretValuesPrinted: true },
  ],
  [
    "secret-print side-effect counter",
    {
      sideEffectCounters: {
        ...ZERO_COUNTERS,
        envSecretValuePrintCount: 1,
      },
    },
  ],
]) {
  expectState(
    `${label} is invalid evidence`,
    "invalid_evidence",
    {
      resultFile: makeResultFile({
        ...makeEvidence(),
        ...evidencePatch,
      }),
    },
  );
}

const instagramOnlyEvidence = makeEvidence({
  counters: {
    blobPutCount: 1,
    blobHeadCount: 1,
    instagramContainerCreateCount: 1,
    instagramStatusPollCount: 1,
    instagramPublishCount: 1,
  },
  instagram: {
    status: "published",
    outcome: "confirmed_published",
    mediaId: "ig-media-123",
  },
  youtube: {
    status: "failed",
    outcome: "confirmed_not_published",
  },
});
const instagramOnly = expectState(
  "confirmed Instagram-only evidence is classified without enabling recovery",
  "instagram_only",
  {
    resultFile: makeResultFile(instagramOnlyEvidence),
    ledgerEvidence: makeLedger({
      instagramAlreadyPublished: true,
      instagramPublishedIdReference: "ig-media-123",
    }),
  },
);
check(
  "Instagram-only is only a YouTube candidate, never execution authority",
  instagramOnly.recoverablePlatformCandidate === "youtube_shorts" &&
    instagramOnly.externalRecoveryEnabled === false &&
    instagramOnly.safety.youtubePublishAllowed === false,
);

const completeEvidence = makeEvidence({
  status: "PUBLISHED_DUAL_PLATFORM_OK",
  counters: {
    blobPutCount: 1,
    blobHeadCount: 1,
    instagramContainerCreateCount: 1,
    instagramStatusPollCount: 1,
    instagramPublishCount: 1,
    youtubeInsertCount: 1,
    ledgerWriteCount: 1,
  },
  instagram: {
    status: "published",
    outcome: "confirmed_published",
    mediaId: "ig-media-123",
  },
  youtube: {
    status: "uploaded",
    outcome: "confirmed_published",
    videoId: "yt-video-456",
  },
});
const complete = expectState(
  "matching dual result and ledger are complete",
  "complete",
  {
    resultFile: makeResultFile(completeEvidence),
    ledgerEvidence: makeLedger({
      instagramAlreadyPublished: true,
      youtubeAlreadyPublished: true,
      instagramPublishedIdReference: "ig-media-123",
      youtubePublishedIdReference: "yt-video-456",
    }),
  },
);
check(
  "complete remains blocked from generic duplicate upload",
  complete.genericDualUploadBlocked === true &&
    complete.manualRecoveryRequired === false,
);

expectState(
  "dual public IDs without complete ledger are both_published_ledger_missing",
  "both_published_ledger_missing",
  {
    resultFile: makeResultFile(completeEvidence),
    ledgerEvidence: makeLedger(),
  },
);
expectState(
  "ledger-write failure after both confirmed publications is both_published_ledger_missing",
  "both_published_ledger_missing",
  {
    resultFile: makeResultFile({
      ...completeEvidence,
      status: "FAILED",
      blockerCode: "LEDGER_FILE_WRITE_FAILED",
    }),
    ledgerEvidence: makeLedger(),
  },
);

expectState(
  "missing result with dirty ledger is ambiguous",
  "ambiguous",
  {
    resultFile: { exists: false },
    ledgerEvidence: makeLedger({
      instagramAlreadyPublished: true,
      instagramPublishedIdReference: "ig-ledger-only",
    }),
  },
);
expectState(
  "zero-side-effect result cannot hide an existing ledger publication",
  "ambiguous",
  {
    resultFile: makeResultFile(zeroSideEffectEvidence),
    ledgerEvidence: makeLedger({
      instagramAlreadyPublished: true,
      instagramPublishedIdReference: "ig-ledger-existing",
    }),
  },
);
expectState(
  "corrupt existing result is ambiguous, not retriable",
  "ambiguous",
  {
    resultFile: {
      exists: true,
      parseOk: false,
      sha256: SHA.result,
      evidence: null,
    },
  },
);
expectState(
  "unreadable ledger with an armed result is ambiguous",
  "ambiguous",
  {
    resultFile: makeResultFile(zeroSideEffectEvidence),
    ledgerEvidence: makeLedger({ readOk: false }),
  },
);
expectState(
  "malformed ledger booleans are ambiguous instead of clean",
  "ambiguous",
  {
    resultFile: makeResultFile(zeroSideEffectEvidence),
    ledgerEvidence: makeLedger({
      instagramAlreadyPublished: "false",
    }),
  },
);

expectState(
  "Instagram request with unknown outcome is ambiguous",
  "ambiguous",
  {
    resultFile: makeResultFile(
      makeEvidence({
        counters: {
          instagramContainerCreateCount: 1,
          instagramPublishCount: 1,
        },
        instagram: { outcome: "unknown" },
      }),
    ),
  },
);
expectState(
  "YouTube request with unknown outcome after Instagram success is ambiguous",
  "ambiguous",
  {
    resultFile: makeResultFile(
      makeEvidence({
        counters: {
          instagramPublishCount: 1,
          youtubeInsertCount: 1,
        },
        instagram: {
          status: "published",
          outcome: "confirmed_published",
          mediaId: "ig-media-123",
        },
        youtube: { outcome: "unknown" },
      }),
    ),
    ledgerEvidence: makeLedger({
      instagramAlreadyPublished: true,
      instagramPublishedIdReference: "ig-media-123",
    }),
  },
);

expectState(
  "legacy armed result without full artifact binding is invalid_evidence",
  "invalid_evidence",
  {
    resultFile: makeResultFile({
      ...makeEvidence(),
      contentUnitSha256: undefined,
      finalVideoApprovalFingerprint: undefined,
    }),
  },
);

const numericVersionCurrentBinding = {
  ...CURRENT_BINDING,
  version: "1",
};
const numericVersionEvidence = makeEvidence({
  binding: numericVersionCurrentBinding,
});
numericVersionEvidence.version = 1;
expectState(
  "numeric evidence fields are not coerced into matching strings",
  "invalid_evidence",
  {
    currentBinding: numericVersionCurrentBinding,
    resultFile: makeResultFile(numericVersionEvidence),
  },
);

const bindingMutations = [
  ["contentId", "wizard-finance-other"],
  ["version", "wizard_finance_publish_v2"],
  ["productionPartId", "part-1"],
  [
    "contentUnitManifestPath",
    "C:\\tmp\\money-shorts-os\\wizard-publish\\finance-test\\other.json",
  ],
  ["contentUnitSha256", SHA.alternate],
  ["instagramSourceSha256", SHA.alternate],
  ["youtubeSourceSha256", SHA.alternate],
  ["publishMetadataSha256", SHA.alternate],
  ["finalVideoApprovalFingerprint", SHA.alternate],
];
for (const [field, value] of bindingMutations) {
  expectState(
    `current artifact binding mutation is invalid: ${field}`,
    "invalid_evidence",
    {
      resultFile: makeResultFile(zeroSideEffectEvidence),
      currentBinding: {
        ...CURRENT_BINDING,
        [field]: value,
      },
    },
  );
}

expectState(
  "result and ledger public-ID conflict is invalid_evidence",
  "invalid_evidence",
  {
    resultFile: makeResultFile(completeEvidence),
    ledgerEvidence: makeLedger({
      instagramAlreadyPublished: true,
      youtubeAlreadyPublished: true,
      instagramPublishedIdReference: "ig-conflicting-id",
      youtubePublishedIdReference: "yt-video-456",
    }),
  },
);

const deterministicInput = {
  resultFile: makeResultFile(instagramOnlyEvidence),
  ledgerEvidence: makeLedger({
    instagramAlreadyPublished: true,
    instagramPublishedIdReference: "ig-media-123",
  }),
};
const deterministicA = classify(deterministicInput);
const deterministicB = classify(structuredClone(deterministicInput));
const deterministicDifferentResultHash = classify({
  ...deterministicInput,
  resultFile: {
    ...deterministicInput.resultFile,
    sha256: SHA.alternate,
  },
});
plans.push(deterministicA, deterministicB, deterministicDifferentResultHash);
check(
  "same evidence produces the same recovery fingerprint",
  /^[a-f0-9]{64}$/.test(deterministicA.recoveryFingerprint ?? "") &&
    deterministicA.recoveryFingerprint === deterministicB.recoveryFingerprint,
);
check(
  "result-file hash is part of the recovery fingerprint",
  deterministicA.state === deterministicDifferentResultHash.state &&
    deterministicA.recoveryFingerprint !==
      deterministicDifferentResultHash.recoveryFingerprint,
);

const expectedStates = [
  "ambiguous",
  "both_published_ledger_missing",
  "complete",
  "instagram_only",
  "invalid_evidence",
  "no_external_failed",
  "not_started",
];
const observedStates = [...new Set(plans.map((plan) => plan.state))].sort();
check(
  "behavior fixtures cover all seven recovery states",
  JSON.stringify(observedStates) === JSON.stringify(expectedStates),
  `observed=${observedStates.join(",")}`,
);
check(
  "every classification keeps all mutation/publication safety authority disabled",
  plans.every(
    (plan) =>
      plan.schemaVersion === MONEY_SHORTS_PUBLISH_RECOVERY_VERSION &&
      plan.automaticRetryAllowed === false &&
      plan.externalRecoveryEnabled === false &&
      plan.safety.blobMutationAllowed === false &&
      plan.safety.instagramPublishAllowed === false &&
      plan.safety.youtubePublishAllowed === false &&
      plan.safety.ledgerMutationAllowed === false &&
      plan.safety.automaticRetryCount === 0 &&
      plan.safety.externalActionCount === 0,
  ),
);

// Wiring checks below are deliberately narrow static order checks. They prove
// fail-closed placement in source, not an external API, filesystem, DB, or UI E2E.
const bindingIndex = runnerSource.indexOf("resultArtifactBinding = {");
const firstRunnerMutationIndex = minPresent(
  runnerSource.indexOf("sideEffectCounters.blobPutCount += 1"),
  runnerSource.indexOf(
    "sideEffectCounters.instagramContainerCreateCount += 1",
  ),
  runnerSource.indexOf("sideEffectCounters.youtubeInsertCount += 1"),
);
check(
  "runner binds exact artifacts before its first external mutation counter",
  bindingIndex >= 0 &&
    firstRunnerMutationIndex >= 0 &&
    bindingIndex < firstRunnerMutationIndex &&
    [
      "contentUnitSha256",
      "instagramSourceSha256",
      "youtubeSourceSha256",
      "publishMetadataSha256",
      "finalVideoApprovalFingerprint",
    ].every((field) =>
      runnerSource.slice(bindingIndex, firstRunnerMutationIndex).includes(field),
    ),
);
const resultWriterBlock = sourceBlock(
  runnerSource,
  "function writeResultJson(",
  "function writeEvidenceJson(",
);
check(
  "runner includes the current artifact binding in every result record",
  resultWriterBlock.includes("...(resultArtifactBinding ?? {})"),
);

const instagramUnknownIndex = runnerSource.indexOf(
  'executionResult.instagram.outcome = "unknown"',
);
const instagramCounterIndex = runnerSource.indexOf(
  "sideEffectCounters.instagramContainerCreateCount += 1",
);
const instagramConfirmedIndex = runnerSource.indexOf(
  'executionResult.instagram.outcome = "confirmed_published"',
);
check(
  "runner records Instagram unknown before request and confirms only after an ID",
  instagramUnknownIndex >= 0 &&
    instagramCounterIndex > instagramUnknownIndex &&
    instagramConfirmedIndex > instagramCounterIndex &&
    runnerSource
      .slice(instagramCounterIndex, instagramConfirmedIndex)
      .includes("igMediaId"),
);
const youtubeUnknownIndex = runnerSource.indexOf(
  'executionResult.youtube.outcome = "unknown"',
);
const youtubeCounterIndex = runnerSource.indexOf(
  "sideEffectCounters.youtubeInsertCount += 1",
);
const youtubeConfirmedIndex = runnerSource.indexOf(
  'executionResult.youtube.outcome = "confirmed_published"',
);
check(
  "runner records YouTube unknown before insert and confirms only after an ID",
  youtubeUnknownIndex >= 0 &&
    youtubeCounterIndex > youtubeUnknownIndex &&
    youtubeConfirmedIndex > youtubeCounterIndex &&
    runnerSource
      .slice(youtubeCounterIndex, youtubeConfirmedIndex)
      .includes("ytVideoId"),
);

const claimIndex = runnerSource.indexOf(
  "claimMoneyShortsPublishAttempt({",
);
const readyJournalIndex = runnerSource.indexOf(
  'recordPublishAttemptTransition("external_execution_ready")',
);
const blobIntentIndex = runnerSource.indexOf(
  'recordPublishAttemptTransition("blob_put_intent")',
);
const blobCounterIndex = runnerSource.indexOf(
  "sideEffectCounters.blobPutCount += 1",
);
const blobCallIndex = runnerSource.indexOf(
  "await blobPut(blobPathname",
);
check(
  "runner acquires and journals a durable attempt before the first external mutation",
  claimIndex >= 0 &&
    readyJournalIndex > claimIndex &&
    blobIntentIndex > readyJournalIndex &&
    blobCounterIndex > blobIntentIndex &&
    blobCallIndex > blobCounterIndex,
);
for (const [label, intent, counterToken, callToken] of [
  [
    "Instagram container",
    "instagram_container_intent",
    "sideEffectCounters.instagramContainerCreateCount += 1",
    "await fetch(`${GRAPH_API_BASE}/${IG_ACCOUNT_ID}/media`",
  ],
  [
    "Instagram publish",
    "instagram_publish_intent",
    "sideEffectCounters.instagramPublishCount += 1",
    "await fetch(`${GRAPH_API_BASE}/${IG_ACCOUNT_ID}/media_publish`",
  ],
  [
    "YouTube insert",
    "youtube_insert_intent",
    "sideEffectCounters.youtubeInsertCount += 1",
    "await youtube.videos.insert({",
  ],
  [
    "ledger write",
    "ledger_write_intent",
    "sideEffectCounters.ledgerWriteCount += 1",
    "writePublishLedgerRuntime(ledgerAbs",
  ],
]) {
  const intentIndex = runnerSource.indexOf(
    `recordPublishAttemptTransition("${intent}")`,
  );
  const counterIndex = runnerSource.indexOf(counterToken);
  const callIndex = runnerSource.indexOf(callToken);
  check(
    `${label} intent is durable before its counter and call`,
    intentIndex >= 0 &&
      counterIndex > intentIndex &&
      callIndex > counterIndex,
  );
}
check(
  "runner blocks existing claim or journal evidence before command work",
  runnerSource.includes(
    "PUBLISH_ATTEMPT_EVIDENCE_ALREADY_EXISTS",
  ) &&
    runnerSource.includes(
      "MONEY_SHORTS_PUBLISH_ATTEMPT_CLAIM_FILENAME",
    ) &&
    runnerSource.includes(
      "MONEY_SHORTS_PUBLISH_ATTEMPT_JOURNAL_DIRNAME",
    ),
);
check(
  "operator recovery reader hashes the immutable claim and treats a journal directory as evidence",
  helperSource.includes(
    "MONEY_SHORTS_PUBLISH_ATTEMPT_CLAIM_FILENAME",
  ) &&
    helperSource.includes(
      "MONEY_SHORTS_PUBLISH_ATTEMPT_JOURNAL_DIRNAME",
    ) &&
    helperSource.includes("attemptFile.sha256") &&
    helperSource.includes("attemptFile,"),
);

const actualUploadBlock = sourceBlock(
  routeSource,
  'if (action === "actualUpload")',
);
const routeRecoveryIndex = actualUploadBlock.indexOf(
  "readWizardTopicPublishRecoveryStates",
);
const routeBuildIndex = actualUploadBlock.indexOf(
  "buildWizardContentUnitsForTopic",
);
const routeRunnerIndex = actualUploadBlock.indexOf("runOperatorScript(");
const routeArmIndex = actualUploadBlock.indexOf("allowArm: true");
check(
  "actualUpload checks topic recovery state before command construction, runner, and arm",
  routeRecoveryIndex >= 0 &&
    routeBuildIndex > routeRecoveryIndex &&
    routeRunnerIndex > routeRecoveryIndex &&
    routeArmIndex > routeRecoveryIndex,
);
check(
  "actualUpload exposes a dedicated manual-recovery blocker",
  actualUploadBlock.includes("PUBLISH_RECOVERY_MANUAL_REVIEW_REQUIRED") &&
    actualUploadBlock.includes("noLive: true"),
);
check(
  "post-run success requires exact recovery classification and ledger evidence",
  actualUploadBlock.includes("readWizardPublishRecoveryState(") &&
    actualUploadBlock.includes(
      'recovery.state === "complete"',
    ),
);

const commandBuilderBlock = sourceBlock(
  helperSource,
  "export function buildOperatorCommand(",
  "export function ",
);
check(
  "command builder has a second per-part recovery fail-closed guard",
  commandBuilderBlock.includes("readWizardPublishRecoveryState") &&
    commandBuilderBlock.includes(
      "publish_recovery_manual_review_required",
    ),
);

const uploadReadyHelperBlock = sourceBlock(
  helperSource,
  "export function listWizardUploadReadyItems(",
  "// ══════════════════════════════════════════════════════════════════════════════",
);
check(
  "a mixed complete/not-started multi-part topic stays in needs_attention",
  uploadReadyHelperBlock.includes("allPublished") &&
    uploadReadyHelperBlock.includes(
      "recovery.genericDualUploadBlocked === true",
    ),
);
const topicRecoveryReaderBlock = sourceBlock(
  helperSource,
  "export function readWizardTopicPublishRecoveryStates(",
  "/**\n * 최종 영상은 만들었지만",
);
check(
  "topic recovery scans all allowed part ids so stale topology evidence cannot disappear",
  topicRecoveryReaderBlock.includes("WIZARD_PUBLISH_PART_IDS") &&
    topicRecoveryReaderBlock.includes(
      'recovery.state !== "not_started"',
    ),
);

const uploadEnabledBlock = sourceBlock(
  wizardSource,
  "const uploadEnabled =",
  "// 주제(또는 카테고리)가 바뀌면",
);
const uploadLibraryBlock = sourceBlock(
  wizardSource,
  "filteredUploadReadyItems.map((item)",
  "{/* 1. 카테고리 선택 */}",
);
check(
  "wizard disables generic dual upload when publish recovery is required",
  uploadEnabledBlock.includes("!publishRecoveryRequired"),
);
check(
  "needs_attention items remain loadable for evidence inspection",
  uploadLibraryBlock.includes('item.status === "needs_attention"') &&
    uploadLibraryBlock.includes("disabled={!runnable}") &&
    !uploadLibraryBlock.includes("disabled={blocked || !runnable}"),
);
check(
  "wizard renders per-part recovery evidence with zero automatic retry",
  uploadLibraryBlock.includes(
    "<PublishRecoveryEvidence states={item.recoveryStates ?? []}",
  ) &&
    wizardSource.includes("자동 재시도 0회 · 일반 양쪽 업로드 차단"),
);
const actualUploadUiHandler = sourceBlock(
  wizardSource,
  "const runActualUpload = useCallback(",
  "// ── 렌더",
);
check(
  "wizard refreshes recovery evidence after success, failure, timeout, or lost response",
  actualUploadUiHandler.includes("finally") &&
    actualUploadUiHandler.includes("refreshUploadReadyList()") &&
    actualUploadUiHandler.includes(
      "refreshAutomationPlan(selectedTopicId)",
    ),
);

check(
  "read model derives publication state from recovery classification",
  /readWizard(?:Topic)?PublishRecoveryState/u.test(readModelSource) &&
    readModelSource.includes("publishRecoveryRequired") &&
    readModelSource.includes('state === "complete"') &&
    readModelSource.includes("genericDualUploadBlocked === true"),
);

const recoveryReadyBase = {
  topicId: "publish-recovery-orchestrator-test",
  scriptReady: true,
  characterReady: true,
  realTtsReady: true,
  generatedImageCount: 8,
  expectedImageCount: 8,
  realImagesReviewable: true,
  realImagesReady: true,
  flowState: "render_ready",
  flowReadyForRender: true,
  finalVideoReady: true,
  finalVideoOwnerApproved: true,
  mediaQualityGateOk: true,
  publishPreflightReady: true,
  publishedAllParts: false,
  publishRecoveryRequired: true,
};
const recoveryPlan = buildMoneyShortsResumablePlan(recoveryReadyBase);
check(
  "orchestrator presents manual recovery and never another actualUpload",
  recoveryPlan.status === "manual_recovery_required" &&
    recoveryPlan.next?.gate === "manual_recovery" &&
    recoveryPlan.next?.action === null &&
    recoveryPlan.safeAutoAdvanceActions.length === 0,
);
const staleRecoveryPlan = buildMoneyShortsResumablePlan({
  ...recoveryReadyBase,
  scriptReady: false,
  finalVideoReady: false,
  mediaQualityGateOk: false,
  publishPreflightReady: false,
});
check(
  "external publish evidence outranks stale local media in the resumable plan",
  staleRecoveryPlan.status === "manual_recovery_required" &&
    staleRecoveryPlan.next?.stageId === "publication" &&
    staleRecoveryPlan.next?.action === null,
);

console.log(`\nResult: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exitCode = 1;
}
