import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  classifyMoneyShortsPublishRecovery,
} from "../lib/money-shorts-publish-recovery.mjs";
import {
  MONEY_SHORTS_PUBLISH_ATTEMPT_CLAIM_VERSION,
  fingerprintMoneyShortsPublishAttemptBinding,
} from "../lib/money-shorts-publish-attempt-journal.mjs";
import {
  MONEY_SHORTS_PUBLISH_OWNER_RECONCILIATION_CONFIRM_TEXT,
  MONEY_SHORTS_PUBLISH_OWNER_RECONCILIATION_DECISION,
  buildMoneyShortsPublishOwnerReconciliationEvidence,
  moneyShortsPublishOwnerReconciliationMatchesRequest,
  validateMoneyShortsPublishOwnerReconciliationEvidence,
} from "../lib/money-shorts-publish-owner-reconciliation.mjs";
import {
  writeMoneyShortsPublishOwnerReconciliationOnce,
} from "../lib/money-shorts-publish-owner-reconciliation-store.mjs";
import {
  buildMoneyShortsPublishReconciliationPacket,
} from "../lib/money-shorts-publish-reconciliation-packet.mjs";

const ROOT = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
);
const sources = {
  contract: readFileSync(
    join(
      ROOT,
      "lib",
      "money-shorts-publish-owner-reconciliation.mjs",
    ),
    "utf8",
  ),
  store: readFileSync(
    join(
      ROOT,
      "lib",
      "money-shorts-publish-owner-reconciliation-store.mjs",
    ),
    "utf8",
  ),
  helper: readFileSync(
    join(ROOT, "lib", "owner-web-operator.ts"),
    "utf8",
  ),
  route: readFileSync(
    join(
      ROOT,
      "app",
      "api",
      "money-shorts",
      "operator",
      "route.ts",
    ),
    "utf8",
  ),
  wizard: readFileSync(
    join(ROOT, "components", "VideoCreationWizard.tsx"),
    "utf8",
  ),
};

let passed = 0;
let failed = 0;
function check(name, condition, detail = "") {
  if (condition) {
    passed += 1;
    console.log(`PASS  ${name}`);
  } else {
    failed += 1;
    console.error(
      `FAIL  ${name}${detail ? ` - ${detail}` : ""}`,
    );
  }
}

function hash(value) {
  return createHash("sha256").update(value).digest("hex");
}

const TOPIC_ID =
  "gen-finance-owner_resolution-test";
const TOPIC_SLUG =
  "gen-finance-owner-resolution-test";
const CURRENT_BINDING = Object.freeze({
  contentId: `wizard-${TOPIC_SLUG}-part-1`,
  version: "v5",
  productionPartId: "part-1",
  contentUnitManifestPath:
    "C:\\tmp\\money-shorts-os\\owner-resolution-test\\content-unit.json",
  contentUnitSha256: "a".repeat(64),
  instagramSourceSha256: "b".repeat(64),
  youtubeSourceSha256: "b".repeat(64),
  publishMetadataSha256: "c".repeat(64),
  finalVideoApprovalFingerprint: "d".repeat(64),
});
const RESULT_SHA = "e".repeat(64);
const CLAIM_SHA = "f".repeat(64);
const JOURNAL_HEAD_SHA = "1".repeat(64);
const INSTAGRAM_MEDIA_ID = "17875557156526534";
const INSTAGRAM_PERMALINK =
  "https://www.instagram.com/economy/reel/OwnerTest01/";
const YOUTUBE_CHANNEL_ID = "UC1234567890123456789012";

function makeResultEvidence() {
  return {
    schemaVersion:
      "final_e2e_dual_platform_publish_result_v1",
    armed: true,
    status: "FAILED",
    blockerCode:
      "YOUTUBE_UPLOAD_FAILED_AFTER_INSTAGRAM_PUBLISHED",
    envSecretValuesPrinted: false,
    dotEnvLocalDirectRead: false,
    contentId: CURRENT_BINDING.contentId,
    version: CURRENT_BINDING.version,
    wizardProductionPartId:
      CURRENT_BINDING.productionPartId,
    contentUnitManifestPath:
      CURRENT_BINDING.contentUnitManifestPath,
    contentUnitSha256:
      CURRENT_BINDING.contentUnitSha256,
    instagramSourceSha256:
      CURRENT_BINDING.instagramSourceSha256,
    youtubeSourceSha256:
      CURRENT_BINDING.youtubeSourceSha256,
    publishMetadataSha256:
      CURRENT_BINDING.publishMetadataSha256,
    finalVideoApprovalFingerprint:
      CURRENT_BINDING.finalVideoApprovalFingerprint,
    publicationAttemptFingerprint:
      fingerprintMoneyShortsPublishAttemptBinding(
        CURRENT_BINDING,
      ),
    sideEffectCounters: {
      blobPutCount: 1,
      blobHeadCount: 1,
      instagramContainerCreateCount: 1,
      instagramStatusPollCount: 5,
      instagramPublishCount: 1,
      youtubeInsertCount: 1,
      ledgerWriteCount: 0,
      envSecretValuePrintCount: 0,
    },
    executionResult: {
      instagram: {
        status: "published",
        outcome: "confirmed_published",
        mediaId: INSTAGRAM_MEDIA_ID,
      },
      youtube: {
        status: "failed",
        outcome: "unknown",
        videoId: null,
      },
      ledger: {
        status: "pending",
        writeOk: false,
        recordedKeys: [],
      },
    },
    partialExternalState:
      "instagram_published_youtube_failed",
    ledgerNotWritten: true,
  };
}

function makeAttemptFile() {
  return {
    exists: true,
    parseOk: true,
    sha256: CLAIM_SHA,
    evidence: {
      schemaVersion:
        MONEY_SHORTS_PUBLISH_ATTEMPT_CLAIM_VERSION,
      armed: true,
      claimId: "claim-owner-resolution-test",
      claimedAtIso: "2026-07-19T00:00:00.000Z",
      publicationAttemptFingerprint:
        fingerprintMoneyShortsPublishAttemptBinding(
          CURRENT_BINDING,
        ),
      binding: { ...CURRENT_BINDING },
    },
  };
}

function makeAttemptEvidence(overrides = {}) {
  return {
    present: true,
    journalValid: true,
    reason: "publish_attempt_manual_review_required",
    claimSha256: CLAIM_SHA,
    eventCount: 21,
    latestTransition: "youtube_insert_intent",
    latestRecordedAtIso: "2026-07-19T00:01:00.000Z",
    latestEventSha256: JOURNAL_HEAD_SHA,
    ...overrides,
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
  resultSha256 = RESULT_SHA,
  attemptFile = makeAttemptFile(),
  attemptEvidence = makeAttemptEvidence(),
  currentBinding = CURRENT_BINDING,
  ledgerEvidence = makeLedger(),
  ownerResolutionFile = { exists: false },
} = {}) {
  return classifyMoneyShortsPublishRecovery({
    resultFile: {
      exists: true,
      parseOk: true,
      sha256: resultSha256,
      evidence: makeResultEvidence(),
    },
    attemptFile,
    attemptEvidence,
    ownerResolutionFile,
    currentBinding,
    ledgerEvidence,
  });
}

const unresolved = classify();
check(
  "real incident shape remains ambiguous before Owner resolution",
  unresolved.state === "ambiguous" &&
    unresolved.reason ===
      "youtube_publish_outcome_unknown" &&
    unresolved.instagramMediaId === INSTAGRAM_MEDIA_ID &&
    unresolved.youtubeVideoId === null,
);

const built =
  buildMoneyShortsPublishOwnerReconciliationEvidence({
    topicId: TOPIC_ID,
    productionPartId: "part-1",
    recovery: unresolved,
    attemptEvidence: makeAttemptEvidence(),
    decision:
      MONEY_SHORTS_PUBLISH_OWNER_RECONCILIATION_DECISION,
    confirmation:
      MONEY_SHORTS_PUBLISH_OWNER_RECONCILIATION_CONFIRM_TEXT,
    confirmInstagramPublished: true,
    confirmYoutubeNotPublished: true,
    instagramPermalink: INSTAGRAM_PERMALINK,
    youtubeChannelId: YOUTUBE_CHANNEL_ID,
    checkedAtIso: "2026-07-19T00:02:00.000Z",
  });
check(
  "exact Owner inputs build one full-hash-bound resolution",
  built.ok === true &&
    built.evidence?.resultSha256 === RESULT_SHA &&
    built.evidence?.sourceRecoveryFingerprint ===
      unresolved.recoveryFingerprint &&
    built.evidence?.attemptEvidence.claimSha256 ===
      CLAIM_SHA &&
    built.evidence?.attemptEvidence.latestEventSha256 ===
      JOURNAL_HEAD_SHA &&
    built.evidence?.instagram.mediaId ===
      INSTAGRAM_MEDIA_ID &&
    built.evidence?.instagram.permalink ===
      INSTAGRAM_PERMALINK &&
    built.evidence?.youtube.videoId === null,
);

const resolutionBytes = `${JSON.stringify(
  built.evidence,
  null,
  2,
)}\n`;
const resolutionFile = {
  exists: true,
  parseOk: true,
  sha256: hash(resolutionBytes),
  evidence: built.evidence,
};
const resolved = classify({
  ownerResolutionFile: resolutionFile,
});
check(
  "valid Owner resolution creates only a YouTube recovery candidate",
  resolved.state === "instagram_only" &&
    resolved.reason ===
      "owner_confirmed_instagram_published_youtube_not_published" &&
    resolved.recoverablePlatformCandidate ===
      "youtube_shorts" &&
    resolved.genericDualUploadBlocked === true &&
    resolved.ownerResolution.applied === true,
);
const semanticRequest = {
  expectedRecoveryFingerprint:
    unresolved.recoveryFingerprint,
  decision:
    MONEY_SHORTS_PUBLISH_OWNER_RECONCILIATION_DECISION,
  confirmation:
    MONEY_SHORTS_PUBLISH_OWNER_RECONCILIATION_CONFIRM_TEXT,
  confirmInstagramPublished: true,
  confirmYoutubeNotPublished: true,
  instagramPermalink:
    INSTAGRAM_PERMALINK.replace(/\/$/, ""),
  youtubeChannelId: YOUTUBE_CHANNEL_ID,
};
check(
  "equivalent Instagram permalink remains semantically idempotent",
  moneyShortsPublishOwnerReconciliationMatchesRequest(
    resolved,
    semanticRequest,
  ) === true,
);
check(
  "resolution grants no platform, ledger, retry, or part-2 authority",
  resolved.externalRecoveryEnabled === false &&
    resolved.automaticRetryAllowed === false &&
    resolved.safety.instagramPublishAllowed === false &&
    resolved.safety.youtubePublishAllowed === false &&
    resolved.safety.ledgerMutationAllowed === false &&
    built.evidence?.safety.part2PublishAllowed === false &&
    built.evidence?.safety.externalActionCount === 0,
);
check(
  "original result and attempt evidence remain immutable",
  makeResultEvidence().executionResult.youtube.outcome ===
      "unknown" &&
    makeAttemptFile().sha256 === CLAIM_SHA,
);

const packet =
  buildMoneyShortsPublishReconciliationPacket({
    recovery: resolved,
    attemptEvidence: makeAttemptEvidence(),
  });
check(
  "Owner packet exposes applied resolution and keeps execution disabled",
  [
    "owner_reconciliation_applied",
    "owner_reconciliation_instagram_permalink",
    "owner_reconciliation_youtube_not_published",
  ].every((id) =>
    packet.confirmedFacts.some((fact) => fact.id === id),
  ) &&
    packet.safety.automaticRecoveryAllowed === false &&
    packet.safety.uploadAllowed === false,
);

for (const [label, override] of [
  [
    "stale result SHA",
    { resultSha256: "2".repeat(64) },
  ],
  [
    "stale attempt claim SHA",
    {
      attemptEvidence: makeAttemptEvidence({
        claimSha256: "3".repeat(64),
      }),
    },
  ],
  [
    "stale journal chain head",
    {
      attemptEvidence: makeAttemptEvidence({
        latestEventSha256: "4".repeat(64),
      }),
    },
  ],
  [
    "existing YouTube ledger publication",
    {
      ledgerEvidence: makeLedger({
        youtubeAlreadyPublished: true,
        youtubePublishedIdReference: "yt-existing",
      }),
    },
  ],
]) {
  const plan = classify({
    ...override,
    ownerResolutionFile: resolutionFile,
  });
  check(
    `${label} invalidates the Owner resolution`,
    plan.state === "invalid_evidence" &&
      plan.recoverablePlatformCandidate === null,
    `state=${plan.state}, reason=${plan.reason}`,
  );
}

const directValidationMismatch =
  validateMoneyShortsPublishOwnerReconciliationEvidence({
    evidence: built.evidence,
    fileSha256: resolutionFile.sha256,
    currentBinding: CURRENT_BINDING,
    resultSha256: RESULT_SHA,
    attemptEvidence: makeAttemptEvidence(),
    instagramMediaId: "different-instagram-id",
    expectedSourceRecoveryFingerprint:
      unresolved.recoveryFingerprint,
  });
check(
  "different Instagram public ID is rejected",
  directValidationMismatch.valid === false,
);

const whitespaceDriftPlan = classify({
  ownerResolutionFile: {
    exists: true,
    parseOk: true,
    sha256: hash(JSON.stringify(built.evidence)),
    evidence: built.evidence,
  },
});
check(
  "non-canonical JSON byte drift invalidates the resolution",
  whitespaceDriftPlan.state === "invalid_evidence" &&
    whitespaceDriftPlan.recoverablePlatformCandidate ===
      null,
);

const extraKeyEvidence = {
  ...built.evidence,
  unexpected: "drift",
};
const extraKeyPlan = classify({
  ownerResolutionFile: {
    exists: true,
    parseOk: true,
    sha256: hash(
      `${JSON.stringify(extraKeyEvidence, null, 2)}\n`,
    ),
    evidence: extraKeyEvidence,
  },
});
check(
  "extra JSON keys invalidate the strict immutable evidence",
  extraKeyPlan.state === "invalid_evidence" &&
    extraKeyPlan.recoverablePlatformCandidate === null,
);

for (const [label, overrides] of [
  [
    "invalid Instagram permalink",
    { instagramPermalink: "https://example.com/reel/x" },
  ],
  [
    "wrong confirmation text",
    { confirmation: "확인" },
  ],
  [
    "part-2 request",
    { productionPartId: "part-2" },
  ],
  [
    "invalid attempt journal",
    {
      attemptEvidence: makeAttemptEvidence({
        journalValid: false,
      }),
    },
  ],
]) {
  const rejected =
    buildMoneyShortsPublishOwnerReconciliationEvidence({
      topicId: TOPIC_ID,
      productionPartId: "part-1",
      recovery: unresolved,
      attemptEvidence: makeAttemptEvidence(),
      decision:
        MONEY_SHORTS_PUBLISH_OWNER_RECONCILIATION_DECISION,
      confirmation:
        MONEY_SHORTS_PUBLISH_OWNER_RECONCILIATION_CONFIRM_TEXT,
      confirmInstagramPublished: true,
      confirmYoutubeNotPublished: true,
      instagramPermalink: INSTAGRAM_PERMALINK,
      youtubeChannelId: YOUTUBE_CHANNEL_ID,
      checkedAtIso: "2026-07-19T00:02:00.000Z",
      ...overrides,
    });
  check(`${label} is blocked before write`, rejected.ok === false);
}

class FakeFs {
  constructor({
    failWrite = false,
    failFsync = false,
  } = {}) {
    this.files = new Map();
    this.handles = new Map();
    this.nextFd = 10;
    this.failWrite = failWrite;
    this.failFsync = failFsync;
  }
  existsSync(path) {
    return this.files.has(path);
  }
  mkdirSync() {}
  readdirSync(directory) {
    return [...this.files.keys()]
      .filter((path) => dirname(path) === directory)
      .map((path) => basename(path));
  }
  openSync(path, flag) {
    if (flag !== "wx") throw new Error("unexpected_flag");
    if (this.files.has(path)) {
      const error = new Error("exists");
      error.code = "EEXIST";
      throw error;
    }
    const fd = this.nextFd++;
    this.files.set(path, Buffer.alloc(0));
    this.handles.set(fd, path);
    return fd;
  }
  writeFileSync(fd, value) {
    if (this.failWrite) throw new Error("injected_write_failure");
    const path = this.handles.get(fd);
    this.files.set(path, Buffer.from(String(value), "utf8"));
  }
  fsyncSync(fd) {
    if (!this.handles.has(fd)) throw new Error("bad_fd");
    if (this.failFsync) throw new Error("injected_fsync_failure");
  }
  closeSync(fd) {
    this.handles.delete(fd);
  }
  readFileSync(path) {
    if (!this.files.has(path)) throw new Error("missing");
    return this.files.get(path);
  }
  linkSync(source, destination) {
    if (this.files.has(destination)) {
      const error = new Error("exists");
      error.code = "EEXIST";
      throw error;
    }
    if (!this.files.has(source)) throw new Error("missing_source");
    this.files.set(
      destination,
      Buffer.from(this.files.get(source)),
    );
  }
  renameSync(source, destination) {
    if (!this.files.has(source)) throw new Error("missing_source");
    if (this.files.has(destination)) throw new Error("destination_exists");
    this.files.set(destination, this.files.get(source));
    this.files.delete(source);
  }
}

const fakeFs = new FakeFs();
const fakePath =
  "C:\\tmp\\owner-reconciliation\\part-1.json";
const firstWrite =
  writeMoneyShortsPublishOwnerReconciliationOnce({
    path: fakePath,
    evidence: built.evidence,
    fsImpl: fakeFs,
  });
const secondWrite =
  writeMoneyShortsPublishOwnerReconciliationOnce({
    path: fakePath,
    evidence: built.evidence,
    fsImpl: fakeFs,
  });
check(
  "immutable store writes once and repeats idempotently",
  firstWrite.ok === true &&
    firstWrite.alreadyExists === false &&
    secondWrite.ok === true &&
    secondWrite.alreadyExists === true &&
    fakeFs.files.has(fakePath) &&
    fakeFs.files.size === 2,
);

const conflictingEvidence = {
  ...built.evidence,
  resolutionFingerprint: "9".repeat(64),
};
const conflictWrite =
  writeMoneyShortsPublishOwnerReconciliationOnce({
    path: fakePath,
    evidence: conflictingEvidence,
    fsImpl: fakeFs,
  });
check(
  "existing resolution is never overwritten by a conflict",
  conflictWrite.ok === false &&
    conflictWrite.reason ===
      "owner_reconciliation_existing_conflict" &&
    fakeFs.files.get(fakePath).toString("utf8") ===
      resolutionBytes,
);

const concurrentBuilt =
  buildMoneyShortsPublishOwnerReconciliationEvidence({
    topicId: TOPIC_ID,
    productionPartId: "part-1",
    recovery: unresolved,
    attemptEvidence: makeAttemptEvidence(),
    decision:
      MONEY_SHORTS_PUBLISH_OWNER_RECONCILIATION_DECISION,
    confirmation:
      MONEY_SHORTS_PUBLISH_OWNER_RECONCILIATION_CONFIRM_TEXT,
    confirmInstagramPublished: true,
    confirmYoutubeNotPublished: true,
    instagramPermalink:
      INSTAGRAM_PERMALINK.replace(/\/$/, ""),
    youtubeChannelId: YOUTUBE_CHANNEL_ID,
    checkedAtIso: "2026-07-19T00:02:01.000Z",
  });
const concurrentWrite =
  writeMoneyShortsPublishOwnerReconciliationOnce({
    path: fakePath,
    evidence: concurrentBuilt.evidence,
    fsImpl: fakeFs,
  });
const canonicalAfterConcurrentConflict = classify({
  ownerResolutionFile: {
    exists: true,
    parseOk: true,
    sha256: hash(fakeFs.files.get(fakePath)),
    evidence: JSON.parse(
      fakeFs.files.get(fakePath).toString("utf8"),
    ),
  },
});
check(
  "concurrent semantic duplicate converges through canonical evidence",
  concurrentBuilt.ok === true &&
    concurrentWrite.ok === false &&
    concurrentWrite.reason ===
      "owner_reconciliation_existing_conflict" &&
    moneyShortsPublishOwnerReconciliationMatchesRequest(
      canonicalAfterConcurrentConflict,
      semanticRequest,
    ) === true,
);

const failingFs = new FakeFs({ failWrite: true });
const failedWrite =
  writeMoneyShortsPublishOwnerReconciliationOnce({
    path: fakePath,
    evidence: built.evidence,
    fsImpl: failingFs,
  });
const failedFilePlan = classify({
  ownerResolutionFile: {
    exists: failingFs.existsSync(fakePath),
    parseOk: false,
    sha256: null,
    evidence: null,
  },
});
check(
  "write failure never publishes a canonical resolution or candidate",
  failedWrite.ok === false &&
    !failingFs.existsSync(fakePath) &&
    failedFilePlan.state === "ambiguous" &&
    failedFilePlan.recoverablePlatformCandidate === null,
);

const fsyncFailingFs = new FakeFs({ failFsync: true });
const fsyncFailedWrite =
  writeMoneyShortsPublishOwnerReconciliationOnce({
    path: fakePath,
    evidence: built.evidence,
    fsImpl: fsyncFailingFs,
  });
check(
  "fsync failure preserves prepared evidence but never canonicalizes it",
  fsyncFailedWrite.ok === false &&
    !fsyncFailingFs.existsSync(fakePath) &&
    [...fsyncFailingFs.files.keys()].some((path) =>
      path.endsWith(".prepared"),
    ),
);

const laterBuilt =
  buildMoneyShortsPublishOwnerReconciliationEvidence({
    topicId: TOPIC_ID,
    productionPartId: "part-1",
    recovery: unresolved,
    attemptEvidence: makeAttemptEvidence(),
    decision:
      MONEY_SHORTS_PUBLISH_OWNER_RECONCILIATION_DECISION,
    confirmation:
      MONEY_SHORTS_PUBLISH_OWNER_RECONCILIATION_CONFIRM_TEXT,
    confirmInstagramPublished: true,
    confirmYoutubeNotPublished: true,
    instagramPermalink: INSTAGRAM_PERMALINK,
    youtubeChannelId: YOUTUBE_CHANNEL_ID,
    checkedAtIso: "2026-07-19T00:03:00.000Z",
  });
const laterAfterOldPrepared =
  writeMoneyShortsPublishOwnerReconciliationOnce({
    path: fakePath,
    evidence: laterBuilt.evidence,
    fsImpl: fsyncFailingFs,
  });
check(
  "new fingerprints cannot bypass an older prepared orphan",
  laterBuilt.ok === true &&
    laterAfterOldPrepared.ok === false &&
    laterAfterOldPrepared.reason ===
      "owner_reconciliation_prepared_orphan_requires_manual_review" &&
    !fsyncFailingFs.existsSync(fakePath),
);

const missingCanonicalFs = new FakeFs();
const initialCommittedWrite =
  writeMoneyShortsPublishOwnerReconciliationOnce({
    path: fakePath,
    evidence: built.evidence,
    fsImpl: missingCanonicalFs,
  });
missingCanonicalFs.files.delete(fakePath);
const laterAfterMissingCanonical =
  writeMoneyShortsPublishOwnerReconciliationOnce({
    path: fakePath,
    evidence: laterBuilt.evidence,
    fsImpl: missingCanonicalFs,
  });
check(
  "committed source blocks recreation when canonical evidence disappears",
  initialCommittedWrite.ok === true &&
    laterAfterMissingCanonical.ok === false &&
    laterAfterMissingCanonical.reason ===
      "owner_reconciliation_prepared_orphan_requires_manual_review" &&
    !missingCanonicalFs.existsSync(fakePath),
);

const routeBlock = sources.route.slice(
  sources.route.indexOf(
    'if (action === "publishOwnerReconciliationResolve")',
  ),
  sources.route.indexOf(
    'if (action === "actualUpload")',
    sources.route.indexOf(
      'if (action === "publishOwnerReconciliationResolve")',
    ),
  ),
);
check(
  "action is allowlisted, local-only, and wired through the resolver",
  sources.helper.includes(
    '"publishOwnerReconciliationResolve"',
  ) &&
    sources.route.includes(
      '"publishOwnerReconciliationResolve"',
    ) &&
    sources.route.includes(
      "resolveWizardPublishOwnerReconciliation",
    ),
);
const resolverWriteFailureBlock = sources.helper.slice(
  sources.helper.indexOf(
    "const written =\n    writeMoneyShortsPublishOwnerReconciliationOnce",
  ),
  sources.helper.indexOf(
    "const successfulWrite = written as",
  ),
);
check(
  "write conflict rereads canonical evidence before returning failure",
  resolverWriteFailureBlock.includes(
    "const raced = readWizardPublishRecoveryState",
  ) &&
    resolverWriteFailureBlock.includes(
      "wizardPublishOwnerReconciliationMatchesRequest",
    ),
);
check(
  "resolution route contains no runner, arm, network, Blob, or platform call",
  routeBlock.length > 0 &&
    !/runOperatorScript|allowArm|fetch\s*\(|googleapis|@vercel\/blob|media_publish|videos\.insert/.test(
      routeBlock,
    ),
);
check(
  "UI exposes the mutation only for the exact part-1 ambiguous incident",
  sources.wizard.includes(
    'recovery.partId === "part-1"',
  ) &&
    sources.wizard.includes(
      'recovery.state === "ambiguous"',
    ) &&
    sources.wizard.includes(
      '"youtube_publish_outcome_unknown"',
    ) &&
    sources.wizard.includes(
      "wizard-action-publish-owner-reconciliation",
    ),
);
check(
  "resolution contract/store have no env, child process, network, or external API authority",
  !/process\.env|node:child_process|\bfetch\s*\(|googleapis|@vercel\/blob|media_publish|videos\.insert/.test(
    `${sources.contract}\n${sources.store}`,
  ),
);

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
