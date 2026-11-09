import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

import {
  MONEY_SHORTS_PART2_YOUTUBE_RECOVERY_EXECUTION_TRANSITIONS,
  buildMoneyShortsPart2YoutubeRecoveryExecutionClaim,
  buildMoneyShortsPart2YoutubeRecoveryExecutionEvent,
  buildMoneyShortsPart2YoutubeRecoveryExecutionPlan,
  buildMoneyShortsPart2YoutubeRecoveryExecutionPreflight,
  buildMoneyShortsPart2YoutubeRecoveryExecutionResult,
  zeroMoneyShortsPart2YoutubeRecoveryExecutionCounters,
} from "../lib/money-shorts-part2-youtube-recovery-execution.mjs";
import {
  applyMoneyShortsPart2YoutubeRecoveryOverlay,
  classifyMoneyShortsPart2YoutubeRecoveryOverlay,
} from "../lib/money-shorts-part2-youtube-recovery-overlay.mjs";
import {
  buildMoneyShortsPart2YoutubeRecoveryPreflight,
  buildMoneyShortsPart2YoutubeRecoveryPreflightPlan,
} from "./run-money-shorts-part2-youtube-recovery-preflight-v1.mjs";

const sha256 = (value) =>
  createHash("sha256").update(value).digest("hex");
const hash = (character) => character.repeat(64);

function evidenceFile(evidence) {
  const bytes = `${JSON.stringify(evidence, null, 2)}\n`;
  return {
    exists: true,
    parseOk: true,
    sha256: sha256(bytes),
    evidence,
  };
}

function absentFile() {
  return {
    exists: false,
    parseOk: false,
    sha256: null,
    evidence: null,
  };
}

function must(value, label) {
  if (!value) throw new Error(`fixture_build_failed:${label}`);
  return value;
}

const currentBinding = {
  contentId: "wizard-salary-three-days-part-2",
  version: "v5",
  productionPartId: "part-2",
  contentUnitManifestPath:
    "X:\\fixtures\\part-2-content-unit.json",
  contentUnitSha256: hash("a"),
  instagramSourceSha256: hash("b"),
  youtubeSourceSha256: hash("b"),
  publishMetadataSha256: hash("c"),
  finalVideoApprovalFingerprint: hash("d"),
};
const instagram = {
  status: "PART2_INSTAGRAM_RECOVERY_OK",
  resultFileSha256: hash("e"),
  resultFingerprint: hash("f"),
  preflightFingerprint: hash("1"),
  claimFingerprint: hash("2"),
  planFingerprint: hash("3"),
  accountId: "178414000000001",
  mediaId: "17942576889054573",
  permalink:
    "https://www.instagram.com/reel/Part2Fixture/",
  publishedAtIso: "2026-07-22T00:00:00.000Z",
};
const channelId = `UC${"A".repeat(22)}`;
const youtubeVideoId = "Part2Vid_01";
const facts = {
  currentBinding,
  originalAttempt: {
    safeResultFileSha256: hash("4"),
    safeResultFingerprint: hash("5"),
    status: "INSTAGRAM_CONTAINER_OUTCOME_UNKNOWN",
    blockerCode: "PART2_DUAL_SAFE_INSTAGRAM_CONTAINER_NO_ID",
    youtubeOutcome: "not_started",
    youtubeInsertCount: 0,
  },
  instagramRecovery: instagram,
  youtube: {
    outcome: "confirmed_not_started",
    videoId: null,
    sourcePath: "X:\\fixtures\\part-2.mp4",
    sourceSha256: currentBinding.youtubeSourceSha256,
    sourceSizeBytes: 1_024_000,
    variantId: "youtube_shorts_letterbox_1080x1920",
    metadataSha256: currentBinding.publishMetadataSha256,
    metadata: {
      titleBase: "월급 3일 뒤 통장이 비는 이유",
      titleWithShortsSuffix: "월급 3일 뒤 통장 #Shorts",
      descriptionBase:
        "월급 직후 반복되는 지출 흐름을 점검하고 자동이체와 생활비 계좌를 분리하는 방법을 설명하는 재테크 정보 fixture입니다.",
      tags: ["재테크", "월급", "생활비"],
      categoryId: "27",
      defaultLanguage: "ko",
      privacyStatus: "public",
      selfDeclaredMadeForKids: false,
      containsSyntheticMedia: true,
    },
    expectedChannelId: channelId,
    actionAllowed: false,
  },
  ledger: {
    path: "X:\\fixtures\\publish-ledger.json",
    sha256: hash("6"),
    instagramRecordConfirmed: true,
    instagramRecordedKey:
      `${currentBinding.contentId}/instagram_reels/${currentBinding.version}`,
    instagramPublishedId: instagram.mediaId,
    youtubeRecordAbsent: true,
    expectedYoutubeKey:
      `${currentBinding.contentId}/youtube_shorts/${currentBinding.version}`,
  },
};

const reviewPlanResult =
  buildMoneyShortsPart2YoutubeRecoveryPreflightPlan({
    facts,
  });
const reviewPlan = must(
  reviewPlanResult.ok === true && reviewPlanResult.plan,
  "review_plan",
);
const reviewPreflight = must(
  buildMoneyShortsPart2YoutubeRecoveryPreflight({
    plan: reviewPlan,
  }),
  "review_preflight",
);
const executionPlanResult =
  buildMoneyShortsPart2YoutubeRecoveryExecutionPlan({
    reviewPreflight,
    expectedReviewPreflightFingerprint:
      reviewPreflight.preflightFingerprint,
  });
const executionPlan = must(
  executionPlanResult.ok === true &&
    executionPlanResult.plan,
  "execution_plan",
);
const executionPreflight = must(
  buildMoneyShortsPart2YoutubeRecoveryExecutionPreflight({
    plan: executionPlan,
    boundAtIso: "2026-07-22T00:01:00.000Z",
  }),
  "execution_preflight",
);
const claim = must(
  buildMoneyShortsPart2YoutubeRecoveryExecutionClaim({
    plan: executionPlan,
    executionPreflightFingerprint:
      executionPreflight.preflightFingerprint,
    claimedAtIso: "2026-07-22T00:02:00.000Z",
    claimId: "part2-youtube-recovery-fixture",
  }),
  "claim",
);
const preflightFile = evidenceFile(executionPreflight);
const claimFile = evidenceFile(claim);

function publicState({
  youtubeStatus,
  youtubeOutcome,
  published = false,
  ledgerConfirmed = false,
  writeLockReleased = null,
}) {
  return {
    instagram: {
      outcome: "confirmed_published",
      mediaId: instagram.mediaId,
      permalink: instagram.permalink,
      publishedAtIso: instagram.publishedAtIso,
      actionCount: 0,
    },
    youtube: {
      status: youtubeStatus,
      outcome: youtubeOutcome,
      videoId: published ? youtubeVideoId : null,
      url: published
        ? `https://www.youtube.com/shorts/${youtubeVideoId}`
        : null,
      channelId,
      publishedAtIso: published
        ? "2026-07-22T00:03:00.000Z"
        : null,
    },
    ledger: {
      writeOk: ledgerConfirmed,
      readbackOk: ledgerConfirmed,
      writeLockReleased,
      recordedKey: ledgerConfirmed
        ? claim.expectedYoutubeLedgerKey
        : null,
      publishedId: ledgerConfirmed ? youtubeVideoId : null,
      readbackSha256: ledgerConfirmed ? hash("7") : null,
    },
  };
}

function countersFor(index) {
  const counters =
    zeroMoneyShortsPart2YoutubeRecoveryExecutionCounters();
  counters.credentialReadCount = 3;
  counters.recoveryEvidenceWriteCount = index + 2;
  if (index >= 2) {
    counters.youtubeChannelVerificationCount = 1;
    counters.youtubeApiInvocationCount = 1;
  }
  if (index >= 4) counters.youtubeInsertCount = 1;
  if (index >= 4) counters.youtubeApiInvocationCount = 2;
  if (index >= 6) counters.ledgerWriteCount = 1;
  return counters;
}

function successStateFor(index) {
  if (index === 0) {
    return publicState({
      youtubeStatus: "not_started",
      youtubeOutcome: "confirmed_not_published",
    });
  }
  if (index === 1) {
    return publicState({
      youtubeStatus: "checking",
      youtubeOutcome: "confirmed_not_published",
    });
  }
  if (index === 2) {
    return publicState({
      youtubeStatus: "checking",
      youtubeOutcome: "confirmed_not_published",
    });
  }
  if (index === 3) {
    return publicState({
      youtubeStatus: "uploading",
      youtubeOutcome: "confirmed_not_published",
    });
  }
  return publicState({
    youtubeStatus: "uploaded",
    youtubeOutcome: "confirmed_published",
    published: true,
    ledgerConfirmed: index >= 6,
    writeLockReleased: index >= 6 ? true : null,
  });
}

function buildEventFiles({
  transitionCount,
  stateForIndex,
  countersForIndex,
}) {
  let previousEvidenceSha256 = claimFile.sha256;
  let previousTransition = null;
  const eventFiles = [];
  for (let index = 0; index < transitionCount; index += 1) {
    const transition =
      MONEY_SHORTS_PART2_YOUTUBE_RECOVERY_EXECUTION_TRANSITIONS[
        index
      ];
    const evidence = must(
      buildMoneyShortsPart2YoutubeRecoveryExecutionEvent({
        claim,
        previousEvidenceSha256,
        previousTransition,
        transition,
        recordedAtIso: new Date(
          Date.parse("2026-07-22T00:02:10.000Z") +
            index * 1000,
        ).toISOString(),
        publicState: stateForIndex(index),
        sideEffectCounters: countersForIndex(index),
      }),
      `event_${transition}`,
    );
    const file = {
      transition,
      ...evidenceFile(evidence),
    };
    eventFiles.push(file);
    previousEvidenceSha256 = file.sha256;
    previousTransition = transition;
  }
  return eventFiles;
}

function buildBundle({
  transitionCount,
  stateForIndex,
  countersForIndex,
  status,
  blockerCode,
  resultState = null,
  resultCounters: suppliedResultCounters = null,
}) {
  const eventFiles = buildEventFiles({
    transitionCount,
    stateForIndex,
    countersForIndex,
  });
  const latest = eventFiles.at(-1);
  const resultCounters = suppliedResultCounters ??
    structuredClone(latest.evidence.sideEffectCounters);
  if (suppliedResultCounters === null) {
    resultCounters.recoveryEvidenceWriteCount += 1;
  }
  const result = must(
    buildMoneyShortsPart2YoutubeRecoveryExecutionResult({
      claim,
      latestEvent: latest.evidence,
      latestEventFileSha256: latest.sha256,
      latestEventSha256: latest.sha256,
      latestTransition: latest.transition,
      status,
      blockerCode,
      completedAtIso: "2026-07-22T00:04:00.000Z",
      publicState:
        resultState ?? latest.evidence.publicState,
      sideEffectCounters: resultCounters,
    }),
    `result_${status}`,
  );
  return {
    present: true,
    discoveryValid: true,
    candidateCount: 1,
    unknownFileCount: 0,
    preflightFile,
    claimFile,
    resultFile: evidenceFile(result),
    eventFiles,
  };
}

const successBundle = buildBundle({
  transitionCount:
    MONEY_SHORTS_PART2_YOUTUBE_RECOVERY_EXECUTION_TRANSITIONS.length,
  stateForIndex: successStateFor,
  countersForIndex: countersFor,
  status: "PART2_YOUTUBE_RECOVERY_OK",
  blockerCode: null,
});
const instagramLedgerRecord = {
  key: `${currentBinding.contentId}/instagram_reels/${currentBinding.version}`,
  contentId: currentBinding.contentId,
  platform: "instagram_reels",
  version: currentBinding.version,
  variantId: "instagram_reels_full_frame_1080x1920",
  publishedId: instagram.mediaId,
  publishedUrl: instagram.permalink,
  status: "published",
  publishedAtIso: instagram.publishedAtIso,
  metadata: {
    blobPathname: "money-shorts/fixture.mp4",
    sourceSha256: currentBinding.instagramSourceSha256,
    accountId: instagram.accountId,
    reviewPreflightFingerprint: hash("8"),
    recoveryPreflightFingerprint:
      instagram.preflightFingerprint,
    recoveryClaimFingerprint: instagram.claimFingerprint,
  },
};
const youtubeLedgerRecord = {
  key: claim.expectedYoutubeLedgerKey,
  contentId: currentBinding.contentId,
  platform: "youtube_shorts",
  version: currentBinding.version,
  variantId: claim.youtubeBinding.variantId,
  publishedId: youtubeVideoId,
  publishedUrl:
    `https://www.youtube.com/shorts/${youtubeVideoId}`,
  status: "published",
  publishedAtIso: "2026-07-22T00:03:00.000Z",
  metadata: {
    sourceFileName: "part-2.mp4",
    sourceSha256: claim.youtubeBinding.sourceSha256,
    channelId: claim.youtubeBinding.channelId,
    reviewPreflightFingerprint:
      claim.sourceReviewPreflightFingerprint,
    recoveryPreflightFingerprint:
      claim.executionPreflightFingerprint,
    recoveryClaimFingerprint: claim.claimFingerprint,
  },
};
const sourceRecovery = {
  state: "ambiguous",
  reason: "source_result_needs_overlay",
  currentBinding,
  instagramMediaId: instagram.mediaId,
  youtubeVideoId: null,
};
const instagramOnlyLedgerEvidence = {
  readOk: true,
  instagramAlreadyPublished: true,
  youtubeAlreadyPublished: false,
  instagramPublishedIdReference: instagram.mediaId,
  youtubePublishedIdReference: null,
};
const completeLedgerEvidence = {
  ...instagramOnlyLedgerEvidence,
  youtubeAlreadyPublished: true,
  youtubePublishedIdReference: youtubeVideoId,
};
const successInput = {
  sourceRecovery,
  currentBinding,
  ledgerEvidence: completeLedgerEvidence,
  instagramLedgerRecord,
  youtubeLedgerRecord,
  evidenceBundle: successBundle,
};

let passed = 0;
let failed = 0;
function check(label, condition) {
  if (condition) {
    passed += 1;
    console.log(`PASS ${label}`);
  } else {
    failed += 1;
    console.error(`FAIL ${label}`);
  }
}

const complete =
  applyMoneyShortsPart2YoutubeRecoveryOverlay(
    successInput,
  );
check(
  "eight-event success becomes a complete read-only overlay",
  complete.applied === true &&
    complete.recovery.state === "complete" &&
    complete.recovery.instagramMediaId ===
      instagram.mediaId &&
    complete.recovery.youtubeVideoId === youtubeVideoId &&
    complete.youtubeOnlyRecovery.valid === true &&
    complete.youtubeOnlyRecovery.eventCount === 8 &&
    complete.youtubeOnlyRecovery.latestTransition ===
      "complete" &&
    complete.youtubeOnlyRecovery.writeLockReleased === true,
);
check(
  "complete overlay grants no upload, mutation, or retry authority",
  complete.recovery.genericDualUploadBlocked === true &&
    complete.recovery.automaticRetryAllowed === false &&
    complete.recovery.externalRecoveryEnabled === false &&
    complete.recovery.safety.instagramPublishAllowed ===
      false &&
    complete.recovery.safety.youtubePublishAllowed === false &&
    complete.recovery.safety.ledgerMutationAllowed === false &&
    complete.recovery.safety.externalActionCount === 0 &&
    complete.youtubeOnlyRecovery.externalActionAllowed ===
      false,
);

const lockAttentionBundle = buildBundle({
  transitionCount:
    MONEY_SHORTS_PART2_YOUTUBE_RECOVERY_EXECUTION_TRANSITIONS.length,
  stateForIndex: (index) => {
    const state = successStateFor(index);
    return index >= 6
      ? {
          ...state,
          ledger: {
            ...state.ledger,
            writeLockReleased: false,
          },
        }
      : state;
  },
  countersForIndex: countersFor,
  status: "PART2_YOUTUBE_RECOVERY_OK",
  blockerCode: null,
});
const lockAttention =
  applyMoneyShortsPart2YoutubeRecoveryOverlay({
    ...successInput,
    evidenceBundle: lockAttentionBundle,
  });
check(
  "confirmed publish remains complete while exposing ledger lock cleanup attention",
  lockAttention.recovery.state === "complete" &&
    lockAttention.youtubeOnlyRecovery.valid === true &&
    lockAttention.youtubeOnlyRecovery.writeLockReleased === false,
);

const absent =
  applyMoneyShortsPart2YoutubeRecoveryOverlay({
    ...successInput,
    evidenceBundle: {
      present: false,
      discoveryValid: true,
      candidateCount: 0,
      unknownFileCount: 0,
      preflightFile: absentFile(),
      claimFile: absentFile(),
      resultFile: absentFile(),
      eventFiles: [],
    },
  });
check(
  "absent evidence leaves the source recovery untouched",
  absent.applied === false &&
    absent.recovery === sourceRecovery &&
    absent.youtubeOnlyRecovery.present === false,
);

const tamperedEventBundle = structuredClone(successBundle);
tamperedEventBundle.eventFiles[2].evidence.recordedAtIso =
  "2026-07-22T03:00:00.000Z";
const tamperedEvent =
  classifyMoneyShortsPart2YoutubeRecoveryOverlay({
    ...successInput,
    evidenceBundle: tamperedEventBundle,
  });
check(
  "tampered event fingerprint chain is invalid evidence",
  tamperedEvent.state === "invalid_evidence" &&
    tamperedEvent.reason ===
      "part2_youtube_recovery_event_chain_invalid",
);

const tamperedLedger = structuredClone(
  youtubeLedgerRecord,
);
tamperedLedger.metadata.sourceSha256 = hash("9");
const ledgerMismatch =
  classifyMoneyShortsPart2YoutubeRecoveryOverlay({
    ...successInput,
    youtubeLedgerRecord: tamperedLedger,
  });
check(
  "success result with a tampered canonical ledger record is invalid",
  ledgerMismatch.state === "invalid_evidence" &&
    ledgerMismatch.reason ===
      "part2_youtube_recovery_success_ledger_mismatch",
);

const wrongBinding =
  classifyMoneyShortsPart2YoutubeRecoveryOverlay({
    ...successInput,
    currentBinding: {
      ...currentBinding,
      productionPartId: "part-1",
    },
  });
check(
  "Part 1 binding cannot consume the Part 2 overlay",
  wrongBinding.state === "invalid_evidence" &&
    wrongBinding.reason ===
      "part2_youtube_recovery_source_binding_invalid",
);

const unknownLayout =
  classifyMoneyShortsPart2YoutubeRecoveryOverlay({
    ...successInput,
    evidenceBundle: {
      ...successBundle,
      discoveryValid: false,
      unknownFileCount: 1,
    },
  });
check(
  "unknown files, locks, and prepared markers fail discovery",
  unknownLayout.state === "invalid_evidence" &&
    unknownLayout.reason ===
      "part2_youtube_recovery_discovery_invalid",
);

const firstEventWithTamperedInstagram =
  buildMoneyShortsPart2YoutubeRecoveryExecutionEvent({
    claim,
    previousEvidenceSha256: claimFile.sha256,
    previousTransition: null,
    transition: "external_execution_ready",
    recordedAtIso: "2026-07-22T00:02:10.000Z",
    publicState: {
      ...successStateFor(0),
      instagram: {
        ...successStateFor(0).instagram,
        permalink:
          "https://www.instagram.com/reel/Tampered/",
      },
    },
    sideEffectCounters: countersFor(0),
  });
check(
  "event rejects Instagram permalink drift from the claim",
  firstEventWithTamperedInstagram === null,
);

const completeEvent = successBundle.eventFiles.at(-1);
const invalidResultCounters = structuredClone(
  completeEvent.evidence.sideEffectCounters,
);
const resultWithoutEvidenceCounterAdvance =
  buildMoneyShortsPart2YoutubeRecoveryExecutionResult({
    claim,
    latestEvent: completeEvent.evidence,
    latestEventFileSha256: completeEvent.sha256,
    latestEventSha256: completeEvent.sha256,
    latestTransition: completeEvent.transition,
    status: "PART2_YOUTUBE_RECOVERY_OK",
    blockerCode: null,
    completedAtIso: "2026-07-22T00:04:00.000Z",
    publicState: completeEvent.evidence.publicState,
    sideEffectCounters: invalidResultCounters,
  });
check(
  "result requires the exact latest-event counter delta",
  resultWithoutEvidenceCounterAdvance === null,
);

const channelConfirmedEvent = successBundle.eventFiles[2];
const failedBeforeInsertCounters = structuredClone(
  channelConfirmedEvent.evidence.sideEffectCounters,
);
failedBeforeInsertCounters.recoveryEvidenceWriteCount += 1;
const unknownMisclassifiedBeforeInsert =
  buildMoneyShortsPart2YoutubeRecoveryExecutionResult({
    claim,
    latestEvent: channelConfirmedEvent.evidence,
    latestEventFileSha256: channelConfirmedEvent.sha256,
    latestEventSha256: channelConfirmedEvent.sha256,
    latestTransition: channelConfirmedEvent.transition,
    status: "FAILED_BEFORE_YOUTUBE_INSERT",
    blockerCode: "FIXTURE_UNKNOWN_MISCLASSIFICATION",
    completedAtIso: "2026-07-22T00:04:00.000Z",
    publicState: publicState({
      youtubeStatus: "unknown",
      youtubeOutcome: "unknown",
    }),
    sideEffectCounters: failedBeforeInsertCounters,
  });
check(
  "unknown YouTube outcome cannot be labeled failed-before-insert",
  unknownMisclassifiedBeforeInsert === null,
);

function terminalVerdict({
  transitionCount,
  status,
  expectedState,
  expectedReason,
  state,
  counters,
  ledgerEvidence = instagramOnlyLedgerEvidence,
  youtubeRecord = null,
}) {
  const bundle = buildBundle({
    transitionCount,
    stateForIndex: successStateFor,
    countersForIndex: countersFor,
    status,
    blockerCode: `FIXTURE_${status}`,
    resultState: state,
    resultCounters: counters,
  });
  const verdict =
    classifyMoneyShortsPart2YoutubeRecoveryOverlay({
      sourceRecovery,
      currentBinding,
      ledgerEvidence,
      instagramLedgerRecord,
      youtubeLedgerRecord: youtubeRecord,
      evidenceBundle: bundle,
    });
  check(
    `${status} maps to ${expectedState}`,
    verdict.state === expectedState &&
      verdict.reason === expectedReason &&
      verdict.summary.valid === true &&
      verdict.summary.status === status,
  );
}

terminalVerdict({
  transitionCount: 3,
  status: "FAILED_BEFORE_YOUTUBE_INSERT",
  expectedState: "no_external_failed",
  expectedReason:
    "part2_youtube_recovery_failed_before_insert",
  state: publicState({
    youtubeStatus: "checking",
    youtubeOutcome: "confirmed_not_published",
  }),
  counters: {
    ...countersFor(2),
    recoveryEvidenceWriteCount:
      countersFor(2).recoveryEvidenceWriteCount + 1,
  },
});

const unknownCounters = {
  ...countersFor(3),
  youtubeInsertCount: 1,
  youtubeApiInvocationCount: 2,
  recoveryEvidenceWriteCount:
    countersFor(3).recoveryEvidenceWriteCount + 1,
};
terminalVerdict({
  transitionCount: 4,
  status: "YOUTUBE_UPLOAD_OUTCOME_UNKNOWN",
  expectedState: "ambiguous",
  expectedReason:
    "part2_youtube_recovery_upload_outcome_unknown",
  state: publicState({
    youtubeStatus: "unknown",
    youtubeOutcome: "unknown",
  }),
  counters: unknownCounters,
});

terminalVerdict({
  transitionCount: 5,
  status: "BOTH_PUBLISHED_LEDGER_MISSING",
  expectedState: "both_published_ledger_missing",
  expectedReason:
    "part2_youtube_recovery_both_published_ledger_missing",
  state: publicState({
    youtubeStatus: "uploaded",
    youtubeOutcome: "confirmed_published",
    published: true,
  }),
  counters: {
    ...countersFor(4),
    recoveryEvidenceWriteCount:
      countersFor(4).recoveryEvidenceWriteCount + 1,
  },
});

terminalVerdict({
  transitionCount: 7,
  status:
    "YOUTUBE_AND_LEDGER_CONFIRMED_RECOVERY_EVIDENCE_INCOMPLETE",
  expectedState: "ambiguous",
  expectedReason:
    "part2_youtube_recovery_evidence_incomplete",
  state: publicState({
    youtubeStatus: "uploaded",
    youtubeOutcome: "confirmed_published",
    published: true,
    ledgerConfirmed: true,
    writeLockReleased: true,
  }),
  counters: {
    ...countersFor(6),
    recoveryEvidenceWriteCount:
      countersFor(6).recoveryEvidenceWriteCount + 1,
  },
  ledgerEvidence: completeLedgerEvidence,
  youtubeRecord: youtubeLedgerRecord,
});

const overlaySource = readFileSync(
  "lib/money-shorts-part2-youtube-recovery-overlay.mjs",
  "utf8",
);
const operatorSource = readFileSync(
  "lib/owner-web-operator.ts",
  "utf8",
);
check(
  "overlay module is pure read-model code",
  !/\bfetch\s*\(|process\.env|writeFile|renameSync|unlinkSync|rmSync|spawn/u.test(
    overlaySource,
  ),
);
check(
  "operator keeps separate Part 1 and Part 2 roots and overlays",
  operatorSource.includes(
    'WIZARD_YOUTUBE_ONLY_RECOVERY_ROOT =\n  "C:\\\\tmp\\\\money-shorts-os\\\\youtube-only-part1-recovery-v1"',
  ) &&
    operatorSource.includes(
      'WIZARD_PART2_YOUTUBE_RECOVERY_ROOT =\n  "C:\\\\tmp\\\\money-shorts-os\\\\part2-youtube-recovery-execution-v1"',
    ) &&
    operatorSource.includes(
      'productionPartId === "part-2"',
    ) &&
    operatorSource.includes(
      "applyMoneyShortsYoutubeOnlyRecoveryOverlay",
    ) &&
    operatorSource.includes(
      "applyMoneyShortsPart2YoutubeRecoveryOverlay",
    ),
);
check(
  "operator rejects non-canonical Part 2 layout and byte-different sidecars",
  operatorSource.includes(
    "inspectWizardPart2YoutubeRecoveryCandidate",
  ) &&
    operatorSource.includes(".committed-source") &&
    operatorSource.includes(
      "sidecar.sha256 !== expectedSha256",
    ) &&
    operatorSource.includes(
      "실행 lock, .prepared 및 그 밖의 파일/폴더",
    ),
);

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exitCode = 1;
