import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import {
  MONEY_SHORTS_YOUTUBE_ONLY_RECOVERY_APPROVAL,
  acquireMoneyShortsYoutubeOnlyRecoveryLock,
  buildMoneyShortsYoutubeOnlyRecoveryClaim,
  buildMoneyShortsYoutubeOnlyRecoveryEvent,
  buildMoneyShortsYoutubeOnlyRecoveryPlan,
  buildMoneyShortsYoutubeOnlyRecoveryPreflight,
  buildMoneyShortsYoutubeOnlyRecoveryResult,
  releaseMoneyShortsYoutubeOnlyRecoveryLock,
  validateMoneyShortsYoutubeOnlyRecoveryAuthorization,
  validateMoneyShortsYoutubeOnlyRecoveryPreflight,
  writeMoneyShortsYoutubeOnlyRecoveryEvidenceOnce,
  writeMoneyShortsYoutubeOnlyRecoveryPreflight,
} from "../lib/money-shorts-youtube-only-recovery.mjs";
import {
  buildPublishLedgerKey,
} from "../lib/publish-ledger-runtime.mjs";
import {
  applyMoneyShortsYoutubeOnlyRecoveryOverlay,
  classifyMoneyShortsYoutubeOnlyRecoveryOverlay,
} from "../lib/money-shorts-youtube-only-recovery-overlay.mjs";
import {
  publishLedgerWriteLockPath,
  recordDualPlatformPublishRuntime,
  recordPublishLedgerEntryRuntime,
  writePublishLedgerRuntime,
} from "../lib/publish-ledger-runtime-write.mjs";
import {
  parseMoneyShortsYoutubeOnlyRecoveryArgs,
  runMoneyShortsYoutubeOnlyRecovery,
} from "./run-money-shorts-youtube-only-part1-recovery-v1.mjs";

let passed = 0;
let failed = 0;

function check(label, condition, detail = "") {
  if (condition) {
    passed += 1;
    console.log(`PASS ${label}`);
    return;
  }
  failed += 1;
  console.error(`FAIL ${label}${detail ? ` — ${detail}` : ""}`);
}

function hash(value) {
  return createHash("sha256").update(value).digest("hex");
}

function h(char) {
  return char.repeat(64);
}

function counters(overrides = {}) {
  return {
    youtubeChannelVerificationCount: 0,
    youtubeInsertCount: 0,
    instagramActionCount: 0,
    blobMutationCount: 0,
    ledgerWriteCount: 0,
    databaseMutationCount: 0,
    credentialReadCount: 0,
    youtubeApiInvocationCount: 0,
    recoveryEvidenceWriteCount: 0,
    credentialValuePrintCount: 0,
    ...overrides,
  };
}

const channelId = "UCR23z78qDtyhHIaV29rSB9A";
const binding = {
  contentId: "wizard-fixture-topic-part-1",
  version: "v5",
  productionPartId: "part-1",
  contentUnitManifestPath:
    "C:\\tmp\\fixture\\publish\\part-1\\content-unit.json",
  contentUnitSha256: h("1"),
  instagramSourceSha256: h("2"),
  youtubeSourceSha256: h("2"),
  publishMetadataSha256: h("3"),
  finalVideoApprovalFingerprint: h("4"),
};
const youtubeMetadata = {
  titleBase: "미래의 월급부터 만드는 사람",
  titleWithShortsSuffix:
    "미래의 월급부터 만드는 사람 1편 #Shorts",
  descriptionBase:
    "현재 소비보다 미래 현금흐름을 먼저 만드는 재테크 원칙을 설명합니다. 자산을 키우는 사람의 선택 기준과 경제심리를 함께 살펴봅니다.",
  tags: ["재테크", "경제심리", "미래현금흐름"],
  categoryId: "27",
  defaultLanguage: "ko",
  privacyStatus: "public",
  selfDeclaredMadeForKids: false,
  containsSyntheticMedia: true,
};
const attemptEvidence = {
  present: true,
  journalValid: true,
  claimSha256: h("6"),
  eventCount: 21,
  latestTransition: "youtube_insert_intent",
  latestRecordedAtIso: "2026-07-18T20:04:14.000Z",
  latestEventSha256: h("7"),
};
const evidencePaths = {
  sourcePublishDir: "C:\\tmp\\fixture\\publish\\part-1",
  recoveryOutDir: "C:\\tmp\\fixture\\recovery\\part-1",
  contentUnitManifestPath:
    binding.contentUnitManifestPath,
  originalResultPath:
    "C:\\tmp\\fixture\\publish\\part-1\\final-e2e-publish-result.json",
  originalAttemptClaimPath:
    "C:\\tmp\\fixture\\publish\\part-1\\final-e2e-publish-attempt-claim.json",
  originalAttemptJournalDir:
    "C:\\tmp\\fixture\\publish\\part-1\\final-e2e-publish-attempt-journal",
  ownerResolutionPath:
    "C:\\tmp\\fixture\\owner-reconciliation\\part-1.json",
  ledgerPath: "C:\\tmp\\fixture\\publish-ledger.json",
  instagramSourcePath: "C:\\tmp\\fixture\\final.mp4",
  youtubeSourcePath: "C:\\tmp\\fixture\\final.mp4",
};
const recoveryFingerprint = h("8");
const resolutionSha256 = h("9");
const recovery = {
  state: "instagram_only",
  reason:
    "owner_confirmed_instagram_published_youtube_not_published",
  resultSha256: h("a"),
  attemptEvidencePresent: true,
  attemptClaimSha256: attemptEvidence.claimSha256,
  currentBinding: binding,
  instagramMediaId: "17875557156526534",
  youtubeVideoId: null,
  recoveryFingerprint,
  recoverablePlatformCandidate: "youtube_shorts",
  genericDualUploadBlocked: true,
  automaticRetryAllowed: false,
  externalRecoveryEnabled: false,
  ledger: {
    readOk: true,
    instagramAlreadyPublished: false,
    youtubeAlreadyPublished: false,
  },
  ownerResolution: {
    present: true,
    valid: true,
    applied: true,
    sha256: resolutionSha256,
    resolutionFingerprint: h("b"),
    instagramPermalink:
      "https://www.instagram.com/example/reel/Da8mtd3iQ0w/",
    youtubeChannelId: channelId,
  },
  safety: {
    blobMutationAllowed: false,
    instagramPublishAllowed: false,
    youtubePublishAllowed: false,
    ledgerMutationAllowed: false,
    automaticRetryCount: 0,
    externalActionCount: 0,
  },
};
const contentUnit = {
  schemaVersion: "dual_platform_content_unit_v1",
  contentId: binding.contentId,
  version: binding.version,
  wizardProductionPartId: "part-1",
  instagramSourcePath: evidencePaths.instagramSourcePath,
  youtubeSourcePath: evidencePaths.youtubeSourcePath,
  youtubeMetadata,
  sourceIntegrity: {
    productionPartId: "part-1",
    finalVideoApprovalFingerprint:
      binding.finalVideoApprovalFingerprint,
    finalMp4Sha256: binding.youtubeSourceSha256,
    publishMetadataSha256:
      binding.publishMetadataSha256,
  },
};
const artifactFacts = {
  currentBinding: binding,
  sourceIntegrityValid: true,
  sourceSizeBytes: 14460572,
  youtubeVariantId:
    "youtube_shorts_letterbox_1080x1920",
  ledgerSha256: h("c"),
  evidencePaths,
};

function buildPlan(overrides = {}) {
  return buildMoneyShortsYoutubeOnlyRecoveryPlan({
    recovery:
      overrides.recovery ?? structuredClone(recovery),
    contentUnit:
      overrides.contentUnit ?? structuredClone(contentUnit),
    artifactFacts:
      overrides.artifactFacts ??
      structuredClone(artifactFacts),
    attemptEvidence:
      overrides.attemptEvidence ??
      structuredClone(attemptEvidence),
    metadataGateOk:
      overrides.metadataGateOk ?? true,
    instagramPublishedAtIso:
      "2026-07-18T20:04:13.376Z",
    expectedRecoveryFingerprint:
      overrides.expectedRecoveryFingerprint ??
      recoveryFingerprint,
    expectedResolutionSha256:
      overrides.expectedResolutionSha256 ??
      resolutionSha256,
    expectedChannelId:
      overrides.expectedChannelId ?? channelId,
  });
}

const authDry =
  validateMoneyShortsYoutubeOnlyRecoveryAuthorization({
    armed: false,
    approval:
      MONEY_SHORTS_YOUTUBE_ONLY_RECOVERY_APPROVAL,
    expectedRecoveryFingerprint: recoveryFingerprint,
    expectedResolutionSha256: resolutionSha256,
    expectedChannelId: channelId,
  });
check("exact dry-run authorization accepted", authDry.ok === true);
check(
  "wrong approval rejected",
  validateMoneyShortsYoutubeOnlyRecoveryAuthorization({
    armed: false,
    approval: "APPROVE_SOMETHING_ELSE",
    expectedRecoveryFingerprint: recoveryFingerprint,
    expectedResolutionSha256: resolutionSha256,
    expectedChannelId: channelId,
  }).ok === false,
);
check(
  "armed authorization requires exact preflight fingerprint",
  validateMoneyShortsYoutubeOnlyRecoveryAuthorization({
    armed: true,
    approval:
      MONEY_SHORTS_YOUTUBE_ONLY_RECOVERY_APPROVAL,
    expectedRecoveryFingerprint: recoveryFingerprint,
    expectedResolutionSha256: resolutionSha256,
    expectedChannelId: channelId,
  }).ok === false,
);

const planResult = buildPlan();
check("eligible exact evidence builds plan", planResult.ok === true);
const plan = planResult.plan;
check(
  "plan binds original result, attempt head, resolution and ledger",
  plan.originalResultSha256 === recovery.resultSha256 &&
    plan.originalAttemptJournal.latestEventSha256 ===
      attemptEvidence.latestEventSha256 &&
    plan.ownerResolutionSha256 === resolutionSha256 &&
    plan.ledger.sha256 === artifactFacts.ledgerSha256,
);
const staleRecovery = structuredClone(recovery);
staleRecovery.recoveryFingerprint = h("d");
check(
  "stale recovery fingerprint rejected",
  buildPlan({ recovery: staleRecovery }).ok === false,
);
const duplicateRecovery = structuredClone(recovery);
duplicateRecovery.ledger.youtubeAlreadyPublished = true;
check(
  "youtube ledger duplicate rejected",
  buildPlan({ recovery: duplicateRecovery }).ok === false,
);
const metadataTamper = structuredClone(contentUnit);
metadataTamper.youtubeMetadata.categoryId = "22";
check(
  "metadata policy tamper rejected",
  buildPlan({ contentUnit: metadataTamper }).ok === false,
);
const titleTamper = structuredClone(contentUnit);
titleTamper.youtubeMetadata.titleWithShortsSuffix = "";
check(
  "empty Shorts title cannot fall back to a different upload title",
  buildPlan({ contentUnit: titleTamper }).ok === false,
);
const pathTamper = structuredClone(artifactFacts);
delete pathTamper.evidencePaths.ownerResolutionPath;
check(
  "missing evidence path rejected",
  buildPlan({ artifactFacts: pathTamper }).ok === false,
);
const sourceTamper = structuredClone(artifactFacts);
sourceTamper.currentBinding.youtubeSourceSha256 = h("e");
check(
  "source binding mismatch rejected",
  buildPlan({ artifactFacts: sourceTamper }).ok === false,
);

const preflight =
  buildMoneyShortsYoutubeOnlyRecoveryPreflight({
    plan,
    boundAtIso: "2026-07-19T01:00:00.000Z",
  });
check(
  "preflight builds with all counters exactly zero",
  preflight &&
    Object.values(preflight.sideEffectCounters).every(
      (value) => value === 0,
    ) &&
    Object.keys(preflight.sideEffectCounters).length === 10,
);
check(
  "exact preflight validates",
  validateMoneyShortsYoutubeOnlyRecoveryPreflight({
    evidence: preflight,
    currentPlan: plan,
    expectedPreflightFingerprint:
      preflight.preflightFingerprint,
  }).valid === true,
);
const missingCounter = structuredClone(preflight);
delete missingCounter.sideEffectCounters.credentialReadCount;
{
  const stable = { ...missingCounter };
  delete stable.preflightFingerprint;
  missingCounter.preflightFingerprint = hash(
    JSON.stringify(stable),
  );
}
check(
  "preflight missing counter rejected even with recomputed fingerprint",
  validateMoneyShortsYoutubeOnlyRecoveryPreflight({
    evidence: missingCounter,
    currentPlan: plan,
    expectedPreflightFingerprint:
      missingCounter.preflightFingerprint,
  }).valid === false,
);

const claim = buildMoneyShortsYoutubeOnlyRecoveryClaim({
  plan,
  preflightFingerprint: preflight.preflightFingerprint,
  claimedAtIso: "2026-07-19T01:01:00.000Z",
  claimId: "fixture-claim-id",
});
check("strict claim builds from strict plan", claim !== null);
const fakePlanStable = { foo: "bar" };
check(
  "self-hashed but noncanonical plan cannot build claim",
  buildMoneyShortsYoutubeOnlyRecoveryClaim({
    plan: {
      ...fakePlanStable,
      planFingerprint: hash(JSON.stringify(fakePlanStable)),
    },
    preflightFingerprint:
      preflight.preflightFingerprint,
    claimedAtIso: "2026-07-19T01:01:00.000Z",
    claimId: "fake",
  }) === null,
);

const initialPublicState = {
  instagram: {
    outcome: "confirmed_published",
    mediaId: recovery.instagramMediaId,
    permalink:
      recovery.ownerResolution.instagramPermalink,
    publishedAtIso: "2026-07-18T20:04:13.376Z",
    actionCount: 0,
  },
  youtube: {
    status: "not_started",
    outcome: "confirmed_not_published",
    videoId: null,
    url: null,
    channelId,
    publishedAtIso: null,
  },
  ledger: {
    writeOk: false,
    readbackOk: false,
    writeLockReleased: null,
    recordedKey: null,
    publishedId: null,
    readbackSha256: null,
  },
};
const firstEvent =
  buildMoneyShortsYoutubeOnlyRecoveryEvent({
    claim,
    previousEvidenceSha256: h("f"),
    previousTransition: null,
    transition: "external_execution_ready",
    recordedAtIso: "2026-07-19T01:02:00.000Z",
    publicState: initialPublicState,
    sideEffectCounters: counters({
      recoveryEvidenceWriteCount: 2,
    }),
  });
check("first canonical event builds", firstEvent !== null);
check(
  "event cannot skip transition order",
  buildMoneyShortsYoutubeOnlyRecoveryEvent({
    claim,
    previousEvidenceSha256: h("f"),
    previousTransition: null,
    transition: "youtube_insert_confirmed",
    recordedAtIso: "2026-07-19T01:02:00.000Z",
    publicState: initialPublicState,
    sideEffectCounters: counters(),
  }) === null,
);
check(
  "negative counter is rejected, never normalized to zero",
  buildMoneyShortsYoutubeOnlyRecoveryEvent({
    claim,
    previousEvidenceSha256: h("f"),
    previousTransition: null,
    transition: "external_execution_ready",
    recordedAtIso: "2026-07-19T01:02:00.000Z",
    publicState: initialPublicState,
    sideEffectCounters: counters({
      instagramActionCount: -1,
    }),
  }) === null,
);
check(
  "public event state rejects secret-bearing extra object",
  buildMoneyShortsYoutubeOnlyRecoveryEvent({
    claim,
    previousEvidenceSha256: h("f"),
    previousTransition: null,
    transition: "external_execution_ready",
    recordedAtIso: "2026-07-19T01:02:00.000Z",
    publicState: {
      ...initialPublicState,
      oauth: { refresh_token: "must-not-persist" },
    },
    sideEffectCounters: counters(),
  }) === null,
);
const fakeClaimStable = {
  expectedChannelId: channelId,
  currentBinding: binding,
};
const fakeClaim = {
  ...fakeClaimStable,
  claimFingerprint: hash(JSON.stringify(fakeClaimStable)),
};
check(
  "self-hashed noncanonical claim cannot build event",
  buildMoneyShortsYoutubeOnlyRecoveryEvent({
    claim: fakeClaim,
    previousEvidenceSha256: h("f"),
    previousTransition: null,
    transition: "external_execution_ready",
    recordedAtIso: "2026-07-19T01:02:00.000Z",
    publicState: initialPublicState,
    sideEffectCounters: counters(),
  }) === null,
);

const videoId = "AbCdEf12345";
const youtubePublished = {
  status: "uploaded",
  outcome: "confirmed_published",
  videoId,
  url: `https://www.youtube.com/shorts/${videoId}`,
  channelId,
  publishedAtIso: "2026-07-19T01:03:00.000Z",
};
const recordedKey = buildPublishLedgerKey(
  binding.contentId,
  "youtube_shorts",
  binding.version,
);
const ledgerPublished = {
  writeOk: true,
  readbackOk: true,
  writeLockReleased: true,
  recordedKey,
  publishedId: videoId,
  readbackSha256: h("1"),
};
const successResult =
  buildMoneyShortsYoutubeOnlyRecoveryResult({
    claim,
    latestEventSha256: h("2"),
    latestTransition: "complete",
    status: "YOUTUBE_ONLY_RECOVERY_OK",
    blockerCode: null,
    completedAtIso: "2026-07-19T01:04:00.000Z",
    instagram: initialPublicState.instagram,
    youtube: youtubePublished,
    ledger: ledgerPublished,
    sideEffectCounters: counters({
      youtubeChannelVerificationCount: 1,
      youtubeInsertCount: 1,
      ledgerWriteCount: 1,
      credentialReadCount: 3,
      youtubeApiInvocationCount: 2,
      recoveryEvidenceWriteCount: 10,
    }),
  });
check("success result requires complete exact evidence", successResult !== null);
check(
  "success result preserves ledger commit truth when lock cleanup needs attention",
  buildMoneyShortsYoutubeOnlyRecoveryResult({
    claim,
    latestEventSha256: h("2"),
    latestTransition: "complete",
    status: "YOUTUBE_ONLY_RECOVERY_OK",
    blockerCode: null,
    completedAtIso: "2026-07-19T01:04:00.000Z",
    instagram: initialPublicState.instagram,
    youtube: youtubePublished,
    ledger: {
      ...ledgerPublished,
      writeLockReleased: false,
    },
    sideEffectCounters: counters({
      youtubeChannelVerificationCount: 1,
      youtubeInsertCount: 1,
      ledgerWriteCount: 1,
      credentialReadCount: 3,
      youtubeApiInvocationCount: 2,
      recoveryEvidenceWriteCount: 10,
    }),
  }) !== null,
);
check(
  "success result rejects arbitrary ledger key",
  buildMoneyShortsYoutubeOnlyRecoveryResult({
    claim,
    latestEventSha256: h("2"),
    latestTransition: "complete",
    status: "YOUTUBE_ONLY_RECOVERY_OK",
    blockerCode: null,
    completedAtIso: "2026-07-19T01:04:00.000Z",
    instagram: initialPublicState.instagram,
    youtube: youtubePublished,
    ledger: {
      ...ledgerPublished,
      recordedKey: "wrong/key",
    },
    sideEffectCounters: counters({
      youtubeChannelVerificationCount: 1,
      youtubeInsertCount: 1,
      ledgerWriteCount: 1,
      credentialReadCount: 3,
      youtubeApiInvocationCount: 2,
      recoveryEvidenceWriteCount: 10,
    }),
  }) === null,
);
check(
  "success result rejects blocker code",
  buildMoneyShortsYoutubeOnlyRecoveryResult({
    claim,
    latestEventSha256: h("2"),
    latestTransition: "complete",
    status: "YOUTUBE_ONLY_RECOVERY_OK",
    blockerCode: "SHOULD_BE_NULL",
    completedAtIso: "2026-07-19T01:04:00.000Z",
    instagram: initialPublicState.instagram,
    youtube: youtubePublished,
    ledger: ledgerPublished,
    sideEffectCounters: counters({
      youtubeChannelVerificationCount: 1,
      youtubeInsertCount: 1,
      ledgerWriteCount: 1,
      credentialReadCount: 3,
      youtubeApiInvocationCount: 2,
      recoveryEvidenceWriteCount: 10,
    }),
  }) === null,
);
check(
  "self-hashed noncanonical claim cannot build success result",
  buildMoneyShortsYoutubeOnlyRecoveryResult({
    claim: fakeClaim,
    latestEventSha256: h("2"),
    latestTransition: "complete",
    status: "YOUTUBE_ONLY_RECOVERY_OK",
    blockerCode: null,
    completedAtIso: "2026-07-19T01:04:00.000Z",
    instagram: initialPublicState.instagram,
    youtube: youtubePublished,
    ledger: ledgerPublished,
    sideEffectCounters: counters({
      youtubeChannelVerificationCount: 1,
      youtubeInsertCount: 1,
      ledgerWriteCount: 1,
      credentialReadCount: 3,
      youtubeApiInvocationCount: 2,
      recoveryEvidenceWriteCount: 10,
    }),
  }) === null,
);

const overlayFile = (evidence) => {
  const bytes = Buffer.from(
    `${JSON.stringify(evidence, null, 2)}\n`,
    "utf8",
  );
  return {
    exists: true,
    parseOk: true,
    sha256: hash(bytes),
    evidence,
  };
};
const overlayClaimFile = overlayFile(claim);
const overlayEventSpecs = [
  {
    transition: "external_execution_ready",
    publicState: initialPublicState,
    sideEffectCounters: counters({
      credentialReadCount: 3,
      recoveryEvidenceWriteCount: 2,
    }),
  },
  {
    transition: "youtube_channel_verify_intent",
    publicState: initialPublicState,
    sideEffectCounters: counters({
      credentialReadCount: 3,
      recoveryEvidenceWriteCount: 3,
    }),
  },
  {
    transition: "youtube_channel_verify_confirmed",
    publicState: initialPublicState,
    sideEffectCounters: counters({
      youtubeChannelVerificationCount: 1,
      credentialReadCount: 3,
      youtubeApiInvocationCount: 1,
      recoveryEvidenceWriteCount: 4,
    }),
  },
  {
    transition: "youtube_insert_intent",
    publicState: initialPublicState,
    sideEffectCounters: counters({
      youtubeChannelVerificationCount: 1,
      credentialReadCount: 3,
      youtubeApiInvocationCount: 1,
      recoveryEvidenceWriteCount: 5,
    }),
  },
  {
    transition: "youtube_insert_confirmed",
    publicState: {
      instagram: initialPublicState.instagram,
      youtube: youtubePublished,
      ledger: initialPublicState.ledger,
    },
    sideEffectCounters: counters({
      youtubeChannelVerificationCount: 1,
      youtubeInsertCount: 1,
      credentialReadCount: 3,
      youtubeApiInvocationCount: 2,
      recoveryEvidenceWriteCount: 6,
    }),
  },
  {
    transition: "ledger_write_intent",
    publicState: {
      instagram: initialPublicState.instagram,
      youtube: youtubePublished,
      ledger: initialPublicState.ledger,
    },
    sideEffectCounters: counters({
      youtubeChannelVerificationCount: 1,
      youtubeInsertCount: 1,
      credentialReadCount: 3,
      youtubeApiInvocationCount: 2,
      recoveryEvidenceWriteCount: 7,
    }),
  },
  {
    transition: "ledger_write_confirmed",
    publicState: {
      instagram: initialPublicState.instagram,
      youtube: youtubePublished,
      ledger: ledgerPublished,
    },
    sideEffectCounters: counters({
      youtubeChannelVerificationCount: 1,
      youtubeInsertCount: 1,
      ledgerWriteCount: 1,
      credentialReadCount: 3,
      youtubeApiInvocationCount: 2,
      recoveryEvidenceWriteCount: 8,
    }),
  },
  {
    transition: "complete",
    publicState: {
      instagram: initialPublicState.instagram,
      youtube: youtubePublished,
      ledger: ledgerPublished,
    },
    sideEffectCounters: counters({
      youtubeChannelVerificationCount: 1,
      youtubeInsertCount: 1,
      ledgerWriteCount: 1,
      credentialReadCount: 3,
      youtubeApiInvocationCount: 2,
      recoveryEvidenceWriteCount: 9,
    }),
  },
];
const overlayEventFiles = [];
let overlayPreviousEvidenceSha256 =
  overlayClaimFile.sha256;
let overlayPreviousTransition = null;
for (const spec of overlayEventSpecs) {
  const event =
    buildMoneyShortsYoutubeOnlyRecoveryEvent({
      claim,
      previousEvidenceSha256:
        overlayPreviousEvidenceSha256,
      previousTransition:
        overlayPreviousTransition,
      transition: spec.transition,
      recordedAtIso:
        `2026-07-19T01:0${overlayEventFiles.length + 2}:00.000Z`,
      publicState: spec.publicState,
      sideEffectCounters: spec.sideEffectCounters,
    });
  const file = overlayFile(event);
  overlayEventFiles.push({
    transition: spec.transition,
    ...file,
  });
  overlayPreviousEvidenceSha256 = file.sha256;
  overlayPreviousTransition = spec.transition;
}
const overlayResult = buildMoneyShortsYoutubeOnlyRecoveryResult({
  claim,
  latestEventSha256:
    overlayPreviousEvidenceSha256,
  latestTransition: "complete",
  status: "YOUTUBE_ONLY_RECOVERY_OK",
  blockerCode: null,
  completedAtIso: "2026-07-19T01:11:00.000Z",
  instagram: initialPublicState.instagram,
  youtube: youtubePublished,
  ledger: ledgerPublished,
  sideEffectCounters: counters({
    youtubeChannelVerificationCount: 1,
    youtubeInsertCount: 1,
    ledgerWriteCount: 1,
    credentialReadCount: 3,
    youtubeApiInvocationCount: 2,
    recoveryEvidenceWriteCount: 10,
  }),
});
const overlayBundle = {
  present: true,
  discoveryValid: true,
  candidateCount: 1,
  unknownFileCount: 0,
  preflightFile: overlayFile(preflight),
  claimFile: overlayClaimFile,
  resultFile: overlayFile(overlayResult),
  eventFiles: overlayEventFiles,
};
const overlayLedgerRecord = {
  key: recordedKey,
  contentId: binding.contentId,
  platform: "youtube_shorts",
  version: binding.version,
  variantId:
    "youtube_shorts_letterbox_1080x1920",
  publishedId: videoId,
  publishedUrl:
    `https://www.youtube.com/shorts/${videoId}`,
  status: "published",
  publishedAtIso: youtubePublished.publishedAtIso,
  metadata: {
    sourceFileName: "final.mp4",
    sourceSha256: binding.youtubeSourceSha256,
    recoveryFingerprint,
    originalResultSha256: recovery.resultSha256,
    ownerResolutionSha256: resolutionSha256,
    channelId,
  },
};
const overlayLedgerEvidence = {
  readOk: true,
  instagramAlreadyPublished: false,
  youtubeAlreadyPublished: true,
  instagramPublishedIdReference: null,
  youtubePublishedIdReference: videoId,
};
const completeOverlay =
  classifyMoneyShortsYoutubeOnlyRecoveryOverlay({
    sourceRecovery: recovery,
    currentBinding: binding,
    ledgerEvidence: overlayLedgerEvidence,
    youtubeLedgerRecord: overlayLedgerRecord,
    evidenceBundle: overlayBundle,
  });
check(
  "strict recovery overlay promotes only exact result and ledger to complete",
  completeOverlay.applied === true &&
    completeOverlay.state === "complete" &&
    completeOverlay.youtubeVideoId === videoId &&
    completeOverlay.summary.valid === true &&
    completeOverlay.summary.eventCount === 8,
);
const appliedCompleteOverlay =
  applyMoneyShortsYoutubeOnlyRecoveryOverlay({
    sourceRecovery: recovery,
    currentBinding: binding,
    ledgerEvidence: overlayLedgerEvidence,
    youtubeLedgerRecord: overlayLedgerRecord,
    evidenceBundle: overlayBundle,
  });
check(
  "applied complete overlay remains duplicate-blocked with no recovery authority",
  appliedCompleteOverlay.recovery.state ===
      "complete" &&
    appliedCompleteOverlay.recovery
      .manualRecoveryRequired === false &&
    appliedCompleteOverlay.recovery
      .genericDualUploadBlocked === true &&
    appliedCompleteOverlay.recovery
      .recoverablePlatformCandidate === null &&
    appliedCompleteOverlay.recovery.safety
      .youtubePublishAllowed === false,
);
check(
  "success overlay rejects a missing current YouTube ledger record",
  classifyMoneyShortsYoutubeOnlyRecoveryOverlay({
    sourceRecovery: recovery,
    currentBinding: binding,
    ledgerEvidence: {
      ...overlayLedgerEvidence,
      youtubeAlreadyPublished: false,
      youtubePublishedIdReference: null,
    },
    youtubeLedgerRecord: null,
    evidenceBundle: overlayBundle,
  }).state === "invalid_evidence",
);
const tamperedOverlayBundle =
  structuredClone(overlayBundle);
tamperedOverlayBundle.eventFiles[2].evidence.recordedAtIso =
  "2026-07-19T09:00:00.000Z";
check(
  "recovery overlay rejects a tampered event chain",
  classifyMoneyShortsYoutubeOnlyRecoveryOverlay({
    sourceRecovery: recovery,
    currentBinding: binding,
    ledgerEvidence: overlayLedgerEvidence,
    youtubeLedgerRecord: overlayLedgerRecord,
    evidenceBundle: tamperedOverlayBundle,
  }).reason ===
    "youtube_only_recovery_event_chain_invalid",
);
check(
  "claim without final result remains ambiguous and never retriable",
  classifyMoneyShortsYoutubeOnlyRecoveryOverlay({
    sourceRecovery: recovery,
    currentBinding: binding,
    ledgerEvidence: {
      ...overlayLedgerEvidence,
      youtubeAlreadyPublished: false,
      youtubePublishedIdReference: null,
    },
    youtubeLedgerRecord: null,
    evidenceBundle: {
      ...overlayBundle,
      resultFile: {
        exists: false,
        parseOk: false,
        sha256: null,
        evidence: null,
      },
    },
  }).state === "ambiguous",
);
check(
  "preflight-only absence does not change the source recovery state",
  applyMoneyShortsYoutubeOnlyRecoveryOverlay({
    sourceRecovery: recovery,
    currentBinding: binding,
    ledgerEvidence: recovery.ledger,
    youtubeLedgerRecord: null,
    evidenceBundle: { present: false },
  }).recovery === recovery,
);

const emptyLedger = {
  schemaVersion: "publish_ledger_v1",
  records: [],
};
const ledgerEntry = {
  key: recordedKey,
  contentId: binding.contentId,
  platform: "youtube_shorts",
  version: binding.version,
  variantId:
    "youtube_shorts_letterbox_1080x1920",
  publishedId: videoId,
  publishedUrl:
    `https://www.youtube.com/shorts/${videoId}`,
  status: "published",
  publishedAtIso: "2026-07-19T01:03:00.000Z",
  metadata: { sourceSha256: binding.youtubeSourceSha256 },
};
const inserted =
  recordPublishLedgerEntryRuntime(emptyLedger, ledgerEntry);
check(
  "single ledger helper inserts YouTube only",
  inserted.ok === true &&
    inserted.ledger.records.length === 1 &&
    inserted.ledger.records[0].platform ===
      "youtube_shorts",
);
check(
  "single ledger helper blocks duplicate",
  recordPublishLedgerEntryRuntime(
    inserted.ledger,
    ledgerEntry,
  ).duplicateBlocked === true,
);
check(
  "single ledger helper rejects corrupt existing ledger",
  recordPublishLedgerEntryRuntime(
    {
      schemaVersion: "publish_ledger_v1",
      records: [{ key: "corrupt" }],
    },
    ledgerEntry,
  ).ok === false,
);
check(
  "single ledger helper rejects invalid ISO",
  recordPublishLedgerEntryRuntime(emptyLedger, {
    ...ledgerEntry,
    publishedAtIso: "not-an-iso-time",
  }).ok === false,
);
const legacyLedger = {
  schemaVersion: "publish_ledger_v1",
  records: [
    {
      key: "legacy/instagram_reels/v1",
      contentId: "legacy",
      platform: "instagram_reels",
      version: "v1",
      publishedId: "legacy-public-id",
      status: "published",
      publishedAtIso: "legacy-nonempty-time",
    },
  ],
};
const dualFromLegacy =
  recordDualPlatformPublishRuntime(legacyLedger, {
    contentId: "new-content",
    version: "v1",
    instagram: {
      variantId: "instagram-variant",
      publishedId: "ig-new-id",
      publishedAtIso: "2026-07-19T01:05:00.000Z",
      metadata: {},
    },
    youtube: {
      variantId: "youtube-variant",
      publishedId: "yt-new-id",
      publishedAtIso: "2026-07-19T01:05:00.000Z",
      metadata: {},
    },
  });
check(
  "legacy read-valid ledger remains intact in dual runtime path",
  dualFromLegacy.ok === true &&
    dualFromLegacy.ledger.records.length === 3 &&
    dualFromLegacy.ledger.records[0].key ===
      legacyLedger.records[0].key,
);
const corruptLedger = {
  schemaVersion: "publish_ledger_v1",
  records: [{ key: "corrupt" }],
};
const dualCorrupt =
  recordDualPlatformPublishRuntime(corruptLedger, {
    contentId: "new-content",
    version: "v1",
    instagram: {
      variantId: "instagram-variant",
      publishedId: "ig-new-id",
      publishedAtIso: "2026-07-19T01:05:00.000Z",
      metadata: {},
    },
    youtube: {
      variantId: "youtube-variant",
      publishedId: "yt-new-id",
      publishedAtIso: "2026-07-19T01:05:00.000Z",
      metadata: {},
    },
  });
check(
  "dual runtime path fails closed without empty-ledger replacement",
  dualCorrupt.ok === false &&
    dualCorrupt.ledger === corruptLedger,
);

const parsed = parseMoneyShortsYoutubeOnlyRecoveryArgs([
  "--approval",
  MONEY_SHORTS_YOUTUBE_ONLY_RECOVERY_APPROVAL,
  "--source-publish-dir",
  "C:\\tmp\\fixture\\publish",
  "--recovery-out-dir",
  "C:\\tmp\\fixture\\recovery",
  "--content-unit",
  "C:\\tmp\\fixture\\publish\\content.json",
  "--owner-resolution",
  "C:\\tmp\\fixture\\owner\\part-1.json",
  "--ledger",
  "C:\\tmp\\fixture\\ledger.json",
  "--expected-recovery-fingerprint",
  recoveryFingerprint,
  "--expected-resolution-sha256",
  resolutionSha256,
  "--expected-channel-id",
  channelId,
]);
check("runner parser accepts exact dry-run args", parsed.ok === true);
check(
  "runner parser rejects unknown flags",
  parseMoneyShortsYoutubeOnlyRecoveryArgs([
    "--unknown",
    "value",
  ]).ok === false,
);
let envProviderCalled = false;
const badAuthorizationRun =
  await runMoneyShortsYoutubeOnlyRecovery({
    argv: [
      "--approval",
      "WRONG",
      "--expected-recovery-fingerprint",
      recoveryFingerprint,
      "--expected-resolution-sha256",
      resolutionSha256,
      "--expected-channel-id",
      channelId,
    ],
    envProvider: () => {
      envProviderCalled = true;
      throw new Error("must_not_run");
    },
  });
check(
  "authorization blocks before filesystem/env provider",
  badAuthorizationRun.ok === false &&
    envProviderCalled === false,
);

const repoRoot = resolve(import.meta.dirname, "..");
const runnerSource = readFileSync(
  join(
    repoRoot,
    "scripts",
    "run-money-shorts-youtube-only-part1-recovery-v1.mjs",
  ),
  "utf8",
);
const wrapperSource = readFileSync(
  join(
    repoRoot,
    "scripts",
    "run-owner-command-with-local-env-no-log.mjs",
  ),
  "utf8",
);
check(
  "runner has no Instagram/Blob/DB service authority",
  !/from\s+["'][^"']*lib\/instagram/u.test(runnerSource) &&
    !/@vercel\/blob|graph\.facebook|supabase|BLOB_READ_WRITE_TOKEN|INSTAGRAM_ACCESS_TOKEN/u.test(
      runnerSource,
    ) &&
    !/\bfetch\s*\(/u.test(runnerSource),
);
check(
  "runner contains exactly one videos.insert invocation",
  (
    runnerSource.match(
      /youtubeClient\.videos\.insert\s*\(/gu,
    ) ?? []
  ).length === 1,
);
check(
  "both Google API calls explicitly disable library retries",
  (
    runnerSource.match(/retry:\s*false/gu) ?? []
  ).length === 2 &&
    !/retry:\s*true/u.test(runnerSource),
);
check(
  "channel intent is durable before channels.list",
  runnerSource.indexOf(
    'appendEvent("youtube_channel_verify_intent")',
  ) <
    runnerSource.indexOf("youtubeClient.channels.list"),
);
check(
  "insert intent is durable before videos.insert",
  runnerSource.indexOf(
    'appendEvent("youtube_insert_intent")',
  ) <
    runnerSource.indexOf("youtubeClient.videos.insert"),
);
check(
  "ledger intent is durable before ledger writer",
  runnerSource.lastIndexOf(
    'appendEvent("ledger_write_intent")',
  ) <
    runnerSource.lastIndexOf("writePublishLedgerRuntime("),
);
check(
  "runner distinguishes committed ledger truth from writer cleanup status",
  runnerSource.includes(
    "ledgerWrite.committed !== true",
  ) &&
    runnerSource.includes(
      "ledgerWrite.lockReleased === true",
    ) &&
    runnerSource.indexOf(
      "ledgerWrite.committed !== true",
    ) <
      runnerSource.indexOf(
        "readbackLedgerResult(lockedContext, videoId)",
      ),
);
check(
  "result builders bind the latest durable event file SHA",
  (
    runnerSource.match(
      /latestEventSha256:\s*latestEvidenceSha256/gu,
    ) ?? []
  ).length === 2,
);
check(
  "wrapper command uses exact three-key YouTube allowlist",
  wrapperSource.includes(
    '"youtube-only-part1-recovery"',
  ) &&
    wrapperSource.includes(
      "envKeyNames: YOUTUBE_ONLY_ENV_KEY_NAMES",
    ) &&
    wrapperSource.includes("loadEnvInDryRun: false"),
);
check(
  "wrapper validates armed evidence before env-file loader",
  wrapperSource.indexOf("const preEnvValidation") <
    wrapperSource.indexOf(
      "loadApprovedKeysFromEnvFile(",
      wrapperSource.indexOf("function main()"),
    ) &&
    wrapperSource.includes(
      "validateYoutubeOnlyRecoveryBeforeEnvAccess",
    ),
);
const wrapperPath = join(
  repoRoot,
  "scripts",
  "run-owner-command-with-local-env-no-log.mjs",
);
const safeChildEnv = Object.fromEntries(
  [
    "SystemRoot",
    "windir",
    "SystemDrive",
    "PATH",
    "Path",
    "PATHEXT",
    "COMSPEC",
    "TEMP",
    "TMP",
  ]
    .filter(
      (name) => typeof process.env[name] === "string",
    )
    .map((name) => [name, process.env[name]]),
);
const missingArmedEvidence = spawnSync(
  process.execPath,
  [
    wrapperPath,
    "youtube-only-part1-recovery",
    "--arm",
    "--env-path",
    "C:\\tmp\\must-not-be-accessed.env",
  ],
  {
    cwd: repoRoot,
    env: safeChildEnv,
    encoding: "utf8",
    shell: false,
  },
);
const missingArmedOutput =
  `${missingArmedEvidence.stdout ?? ""}${missingArmedEvidence.stderr ?? ""}`;
check(
  "invalid armed wrapper request fails before any env diagnostic/access",
  missingArmedEvidence.status === 2 &&
    missingArmedOutput.includes(
      "youtube_recovery_required_evidence_invalid",
    ) &&
    !missingArmedOutput.includes("[owner-env-no-log]"),
);

const tempRoot = mkdtempSync(
  join(tmpdir(), "youtube-recovery-check-"),
);
try {
  const preflightPath = join(
    tempRoot,
    "preflight.json",
  );
  const preflightWrite =
    writeMoneyShortsYoutubeOnlyRecoveryPreflight({
      path: preflightPath,
      evidence: preflight,
    });
  check(
    "preflight writer persists exact validated evidence",
    preflightWrite.ok === true &&
      existsSync(preflightPath) &&
      JSON.parse(
        readFileSync(preflightPath, "utf8"),
      ).preflightFingerprint ===
        preflight.preflightFingerprint,
  );
  const olderPreparedPath =
    `${preflightPath}.${h("f")}.prepared`;
  writeFileSync(olderPreparedPath, "orphan", "utf8");
  const newerPreflight =
    buildMoneyShortsYoutubeOnlyRecoveryPreflight({
      plan,
      boundAtIso: "2026-07-19T01:10:00.000Z",
    });
  const orphanBlocked =
    writeMoneyShortsYoutubeOnlyRecoveryPreflight({
      path: preflightPath,
      evidence: newerPreflight,
    });
  check(
    "older prepared preflight orphan blocks a new fingerprint",
    orphanBlocked.ok === false &&
      existsSync(olderPreparedPath),
  );

  const ledgerPath = join(tempRoot, "ledger.json");
  const ledgerBytes =
    `${JSON.stringify(emptyLedger, null, 2)}\n`;
  writeFileSync(ledgerPath, ledgerBytes, "utf8");
  const guardedMismatch = writePublishLedgerRuntime(
    ledgerPath,
    inserted.ledger,
    { expectedCurrentSha256: h("0") },
  );
  check(
    "ledger writer CAS mismatch preserves current snapshot",
    guardedMismatch.ok === false &&
      guardedMismatch.committed === false &&
      guardedMismatch.lockReleased === true &&
      JSON.parse(readFileSync(ledgerPath, "utf8")).records
        .length === 0,
  );
  const guardedSuccess = writePublishLedgerRuntime(
    ledgerPath,
    inserted.ledger,
    {
      expectedCurrentSha256: hash(
        Buffer.from(ledgerBytes, "utf8"),
      ),
    },
  );
  check(
    "ledger writer CAS match commits with exact readback",
    guardedSuccess.ok === true &&
      guardedSuccess.committed === true &&
      guardedSuccess.lockReleased === true &&
      JSON.parse(readFileSync(ledgerPath, "utf8")).records
        .length === 1,
  );
  const staleEntry = {
    ...ledgerEntry,
    key: buildPublishLedgerKey(
      "stale-other-content",
      "youtube_shorts",
      binding.version,
    ),
    contentId: "stale-other-content",
    publishedId: "staleOther1",
    publishedUrl:
      "https://www.youtube.com/shorts/staleOther1",
  };
  const staleProposal =
    recordPublishLedgerEntryRuntime(
      emptyLedger,
      staleEntry,
    );
  const staleWrite = writePublishLedgerRuntime(
    ledgerPath,
    staleProposal.ledger,
  );
  const afterStaleWrite = JSON.parse(
    readFileSync(ledgerPath, "utf8"),
  );
  check(
    "shared writer rejects stale append proposal without losing current records",
    staleProposal.ok === true &&
      staleWrite.ok === false &&
      staleWrite.committed === false &&
      staleWrite.lockReleased === true &&
      staleWrite.reason ===
        "ledger_non_append_only_update" &&
      afterStaleWrite.records.length === 1 &&
      afterStaleWrite.records[0].key ===
        ledgerEntry.key,
  );
  const sharedLockPath =
    publishLedgerWriteLockPath(ledgerPath);
  writeFileSync(sharedLockPath, "foreign-lock", "utf8");
  const activeLockWrite = writePublishLedgerRuntime(
    ledgerPath,
    inserted.ledger,
  );
  check(
    "shared canonical ledger lock blocks and preserves a foreign writer",
    activeLockWrite.ok === false &&
      activeLockWrite.committed === false &&
      activeLockWrite.lockReleased === false &&
      activeLockWrite.reason ===
        "ledger_write_lock_active_or_orphaned" &&
      existsSync(sharedLockPath),
  );
  rmSync(sharedLockPath, { force: true });

  const claimPath = join(tempRoot, "claim.json");
  const firstClaimWrite =
    writeMoneyShortsYoutubeOnlyRecoveryEvidenceOnce({
      path: claimPath,
      evidence: claim,
      fingerprintField: "claimFingerprint",
    });
  const duplicateClaimWrite =
    writeMoneyShortsYoutubeOnlyRecoveryEvidenceOnce({
      path: claimPath,
      evidence: claim,
      fingerprintField: "claimFingerprint",
    });
  check(
    "immutable evidence writer is write-once",
    firstClaimWrite.ok === true &&
      duplicateClaimWrite.ok === false,
  );

  const ownedLockPath = join(tempRoot, "owned.lock");
  const ownedLock =
    acquireMoneyShortsYoutubeOnlyRecoveryLock({
      lockPath: ownedLockPath,
    });
  const release =
    releaseMoneyShortsYoutubeOnlyRecoveryLock({
      lock: ownedLock,
    });
  check(
    "owned exclusive lock releases only its own identity",
    ownedLock.ok === true &&
      release.ok === true &&
      !existsSync(ownedLockPath),
  );

  const foreignLockPath = join(tempRoot, "foreign.lock");
  writeFileSync(foreignLockPath, "foreign", "utf8");
  const foreignAttempt =
    acquireMoneyShortsYoutubeOnlyRecoveryLock({
      lockPath: foreignLockPath,
    });
  check(
    "pre-existing foreign lock is blocked and preserved",
    foreignAttempt.ok === false &&
      existsSync(foreignLockPath) &&
      readFileSync(foreignLockPath, "utf8") === "foreign",
  );
} finally {
  rmSync(tempRoot, { recursive: true, force: true });
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exitCode = 1;
