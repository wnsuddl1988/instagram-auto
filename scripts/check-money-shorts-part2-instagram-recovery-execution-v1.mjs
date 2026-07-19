#!/usr/bin/env node

import { createHash } from "node:crypto";
import * as nodeFs from "node:fs";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import {
  MONEY_SHORTS_PART2_INSTAGRAM_RECOVERY_EXECUTION_APPROVAL,
  MONEY_SHORTS_PART2_INSTAGRAM_RECOVERY_EXECUTION_TRANSITIONS,
  buildMoneyShortsPart2InstagramRecoveryExecutionPlan,
  buildMoneyShortsPart2InstagramRecoveryExecutionResult,
  moneyShortsPart2InstagramRecoveryExecutionEventPath,
  moneyShortsPart2InstagramRecoveryExecutionPaths,
  validateMoneyShortsPart2InstagramRecoveryExecutionAuthorization,
  validateMoneyShortsPart2InstagramRecoveryExecutionClaim,
  validateMoneyShortsPart2InstagramRecoveryExecutionEvent,
  validateMoneyShortsPart2InstagramRecoveryExecutionResult,
} from "../lib/money-shorts-part2-instagram-recovery-execution.mjs";
import {
  parseMoneyShortsPart2InstagramRecoveryExecutionArgs,
  reconcileMoneyShortsPart2InstagramPublishedMedia,
  runMoneyShortsPart2InstagramRecoveryExecutionTestOnly,
} from "./run-money-shorts-part2-instagram-recovery-execution-v1.mjs";

const H = (value) =>
  createHash("sha256").update(value).digest("hex");
const ACCOUNT_ID = "17841414372742257";
const CHANNEL_ID = `UC${"A".repeat(22)}`;
const CONTENT_ID =
  "wizard-gen-finance-editorial-v2-test-part-2";
const VERSION = "v5";
const FIXED_ISO = "2026-07-19T12:00:00.000Z";
const BLOB_PATHNAME =
  `instagram/reels/${CONTENT_ID}/` +
  `instagram_reels_full_frame_1080x1920/${VERSION}/` +
  "source123456.mp4";
const BLOB_URL =
  `https://public.blob.example/${BLOB_PATHNAME}`;
const CAPTION = [
  "돈보다 먼저 사라지는 것은 시간입니다",
  "",
  "오늘의 선택이 은퇴 후 시간을 바꿉니다.",
  "",
  "저장하고 다음 편도 확인하세요.",
  "",
  "#재테크 #경제심리 #은퇴준비",
].join("\n");

let passed = 0;
let failed = 0;

function check(condition, name) {
  if (condition) {
    passed += 1;
    console.log(`PASS ${name}`);
  } else {
    failed += 1;
    console.error(`FAIL ${name}`);
  }
}

function fingerprint(stable, field) {
  return {
    ...stable,
    [field]: H(JSON.stringify(stable)),
  };
}

function makeBinding(contentUnitPath) {
  return {
    contentId: CONTENT_ID,
    version: VERSION,
    productionPartId: "part-2",
    contentUnitManifestPath: contentUnitPath,
    contentUnitSha256: H("manifest"),
    instagramSourceSha256: H("source"),
    youtubeSourceSha256: H("source"),
    publishMetadataSha256: H("metadata"),
    finalVideoApprovalFingerprint: H("owner-approval"),
  };
}

function makeReviewPreflight({
  binding,
  ledgerSha256,
}) {
  const recoveryPlanFingerprint = H("review-plan");
  const sourceEvidenceBundleFingerprint =
    H("source-evidence");
  const plan = {
    status: "LOCAL_RECOVERY_REVIEW_OK",
    mode: "code_only_dry_run",
    armed: false,
    readyForActualExecution: false,
    ownerApprovalRequired: true,
    safeToRetry: false,
    safeToPublish: false,
    recoveryPlanFingerprint,
    sourceEvidenceBundleFingerprint,
    currentBinding: binding,
    expectedInstagramAccountId: ACCOUNT_ID,
    expectedYoutubeChannelId: CHANNEL_ID,
    currentRecoveryClassification: {
      state: "ambiguous",
      reason: "instagram_publish_outcome_unknown",
      recoverablePlatformCandidate: null,
      automaticRetryAllowed: false,
      externalRecoveryEnabled: false,
    },
    observedBoundary: {
      containerCreateAttempted: true,
      containerOutcome: "unknown",
      containerConfirmedObserved: false,
      publishIntentObserved: false,
      instagramMediaId: null,
      youtubeVideoId: null,
    },
    duplicateSafety: {
      localLedgerClean: true,
      externalInstagramPublicationState: "unknown",
      freshExternalReconciliationPerformed: false,
      safeToRepublish: false,
    },
    priorAuthorization: {
      consumed: true,
      reusable: false,
      authorizesRetry: false,
      authorizesRecoveryExecution: false,
    },
    blob: {
      pathname: BLOB_PATHNAME,
      urlSha256: H(BLOB_URL),
    },
    ledger: {
      sha256: ledgerSha256,
    },
    pendingGates: [
      "live_instagram_reconciliation",
      "new_owner_mutation_approval",
      "actual_runner_implemented_and_validated",
    ],
    futureExecutionBoundary: {
      recoveryRunnerImplemented: false,
      executionAuthorized: false,
      separateRecoveryOutDirRequired: true,
      blobPutAllowed: false,
      instagramContainerCreateAllowed: false,
      instagramPublishAllowed: false,
      youtubeInsertAllowed: false,
      ledgerWriteAllowed: false,
      part1ActionAllowed: false,
      automaticRetryCount: 0,
    },
  };
  const stable = {
    schemaVersion:
      "money_shorts_part2_instagram_recovery_preflight_v1",
    evidenceType: "preflight",
    status: "LOCAL_RECOVERY_REVIEW_OK",
    armed: false,
    executionAuthorized: false,
    readyForActualExecution: false,
    ownerApprovalRequired: true,
    safeToRetry: false,
    safeToPublish: false,
    recoveryPlanFingerprint,
    sourceEvidenceBundleFingerprint,
    plan,
  };
  return fingerprint(stable, "preflightFingerprint");
}

function makeArgv({
  paths,
  reviewFingerprint,
  executionFingerprint = null,
  approval =
    MONEY_SHORTS_PART2_INSTAGRAM_RECOVERY_EXECUTION_APPROVAL,
  armed = false,
}) {
  const exactHashes = {
    "--expected-manifest-sha256": H("manifest"),
    "--expected-source-sha256": H("source"),
    "--expected-publication-attempt-fingerprint":
      H("attempt"),
    "--expected-original-safe-preflight-fingerprint":
      H("safe-preflight-fp"),
    "--expected-original-safe-claim-fingerprint":
      H("safe-claim-fp"),
    "--expected-original-safe-result-fingerprint":
      H("safe-result-fp"),
    "--expected-original-canonical-result-fingerprint":
      H("canonical-result-fp"),
    "--expected-original-plan-fingerprint":
      H("original-plan"),
    "--expected-original-safe-preflight-file-sha256":
      H("safe-preflight-file"),
    "--expected-original-safe-claim-file-sha256":
      H("safe-claim-file"),
    "--expected-original-safe-result-file-sha256":
      H("safe-result-file"),
    "--expected-original-safe-latest-event-sha256":
      H("safe-event"),
    "--expected-original-canonical-attempt-claim-file-sha256":
      H("canonical-claim"),
    "--expected-original-canonical-latest-event-sha256":
      H("canonical-event"),
    "--expected-original-canonical-result-file-sha256":
      H("canonical-result-file"),
    "--expected-original-ledger-sha256":
      paths.ledgerSha256,
    "--expected-original-blob-url-sha256":
      H(BLOB_URL),
    "--expected-original-recovery-fingerprint":
      H("original-recovery"),
  };
  const argv = [
    "--approval",
    approval,
    "--recovery-out-dir",
    paths.recoveryOutDir,
    "--expected-review-preflight-fingerprint",
    reviewFingerprint,
    "--inspection",
    "INSPECT_PART2_INSTAGRAM_RECOVERY_EVIDENCE_V1",
    "--content-unit",
    paths.contentUnitPath,
    "--ledger",
    paths.ledgerPath,
    "--out-dir",
    paths.outDir,
    "--expected-content-id",
    CONTENT_ID,
    "--expected-instagram-account-id",
    ACCOUNT_ID,
    "--expected-youtube-channel-id",
    CHANNEL_ID,
  ];
  for (const [flag, value] of Object.entries(exactHashes)) {
    argv.push(flag, value);
  }
  if (armed) {
    argv.push(
      "--expected-execution-preflight-fingerprint",
      executionFingerprint,
      "--arm",
    );
  }
  return argv;
}

function makeScenario() {
  const root = mkdtempSync(
    join(tmpdir(), "ig-recovery-execution-check-"),
  );
  const outDir = join(root, "original-publish");
  const recoveryOutDir = join(root, "separate-recovery");
  mkdirSync(outDir, { recursive: true });
  const contentUnitPath = join(
    outDir,
    "content-unit.json",
  );
  const ledgerPath = join(outDir, "ledger.json");
  writeFileSync(contentUnitPath, "{}\n", "utf8");
  writeFileSync(
    ledgerPath,
    `${JSON.stringify(
      {
        schemaVersion: "publish_ledger_v1",
        records: [],
      },
      null,
      2,
    )}\n`,
    "utf8",
  );
  const ledgerSha256 = H(readFileSync(ledgerPath));
  const binding = makeBinding(contentUnitPath);
  const reviewPreflight = makeReviewPreflight({
    binding,
    ledgerSha256,
  });
  return {
    paths: {
      root,
      outDir,
      recoveryOutDir,
      contentUnitPath,
      ledgerPath,
      ledgerSha256,
    },
    binding,
    reviewPreflight,
    context: {
      ok: true,
      currentBinding: binding,
      ledger: {
        sha256: ledgerSha256,
      },
      instagramMetadata: {
        captionFirstLineHook:
          "돈보다 먼저 사라지는 것은 시간입니다",
        caption:
          "오늘의 선택이 은퇴 후 시간을 바꿉니다.",
        callToAction:
          "저장하고 다음 편도 확인하세요.",
        hashtags: [
          "재테크",
          "경제심리",
          "은퇴준비",
        ],
        shareToFeed: true,
      },
    },
    material: {
      ok: true,
      blobUrl: BLOB_URL,
      blobUrlSha256: H(BLOB_URL),
      blobPathname: BLOB_PATHNAME,
      caption: CAPTION,
      captionSha256: H(CAPTION),
      shareToFeed: true,
    },
  };
}

function makeDependencies({
  scenario,
  calls,
  adapterOverrides = {},
}) {
  const resolvedAdapterOverrides =
    typeof adapterOverrides === "function"
      ? adapterOverrides(calls)
      : adapterOverrides;
  return {
    reviewRunner: async () => {
      calls.review += 1;
      return {
        ok: true,
        status: "LOCAL_RECOVERY_REVIEW_OK",
        readyForActualExecution: false,
        safeToRetry: false,
        safeToPublish: false,
        preflightFingerprint:
          scenario.reviewPreflight.preflightFingerprint,
        preflight: scenario.reviewPreflight,
      };
    },
    contextInspector: () => {
      calls.context += 1;
      return scenario.context;
    },
    materialInspector: () => {
      calls.material += 1;
      return scenario.material;
    },
    credentialsProvider: () => {
      calls.credentials += 1;
      return {
        ok: true,
        accountId: ACCOUNT_ID,
        accessToken: "fake-test-token",
      };
    },
    adapterFactory: async () => {
      calls.adapterFactory += 1;
      return {
        async verifyIdentity() {
          calls.identity += 1;
          return { ok: true, accountId: ACCOUNT_ID };
        },
        async listPublishedMediaPage() {
          calls.mediaList += 1;
          return {
            ok: true,
            items: [],
            nextCursor: null,
          };
        },
        async headBlob() {
          calls.blobHead += 1;
          return {
            ok: true,
            status: 200,
            contentType: "video/mp4",
          };
        },
        async createContainer() {
          calls.container += 1;
          return {
            ok: true,
            containerId: "18000000000000001",
          };
        },
        async readContainer() {
          calls.poll += 1;
          return {
            ok: true,
            statusCode: "FINISHED",
          };
        },
        async publishContainer() {
          calls.publish += 1;
          return {
            ok: true,
            mediaId: "18000000000000002",
          };
        },
        async verifyPublishedMedia() {
          calls.mediaVerify += 1;
          return {
            ok: true,
            id: "18000000000000002",
            mediaType: "VIDEO",
            mediaProductType: "REELS",
            permalink:
              "https://www.instagram.com/reel/Abcde12345/",
            publishedAtIso: FIXED_ISO,
          };
        },
        async sleep() {
          calls.sleep += 1;
        },
        ...resolvedAdapterOverrides,
      };
    },
    ledgerWriter: (path, ledger) => {
      calls.ledgerWrite += 1;
      writeFileSync(
        path,
        `${JSON.stringify(ledger, null, 2)}\n`,
        "utf8",
      );
      return {
        ok: true,
        committed: true,
        lockReleased: true,
      };
    },
    clock: () => FIXED_ISO,
  };
}

function zeroCalls() {
  return {
    review: 0,
    context: 0,
    material: 0,
    credentials: 0,
    adapterFactory: 0,
    identity: 0,
    mediaList: 0,
    blobHead: 0,
    container: 0,
    poll: 0,
    publish: 0,
    mediaVerify: 0,
    sleep: 0,
    ledgerWrite: 0,
  };
}

async function runScenario({
  adapterOverrides = {},
} = {}) {
  const scenario = makeScenario();
  const calls = zeroCalls();
  const deps = makeDependencies({
    scenario,
    calls,
    adapterOverrides,
  });
  const dryArgs = makeArgv({
    paths: scenario.paths,
    reviewFingerprint:
      scenario.reviewPreflight.preflightFingerprint,
  });
  const dry =
    await runMoneyShortsPart2InstagramRecoveryExecutionTestOnly(
      {
        argv: dryArgs,
        ...deps,
      },
    );
  const armedArgs = makeArgv({
    paths: scenario.paths,
    reviewFingerprint:
      scenario.reviewPreflight.preflightFingerprint,
    executionFingerprint:
      dry.preflightFingerprint,
    armed: true,
  });
  return {
    scenario,
    calls,
    deps,
    dry,
    armedArgs,
  };
}

function allFileText(root) {
  if (!statSync(root).isDirectory()) {
    return readFileSync(root, "utf8");
  }
  return readdirSync(root)
    .map((name) => allFileText(join(root, name)))
    .join("\n");
}

const authorization =
  validateMoneyShortsPart2InstagramRecoveryExecutionAuthorization(
    {
      armed: false,
      approval:
        MONEY_SHORTS_PART2_INSTAGRAM_RECOVERY_EXECUTION_APPROVAL,
      expectedReviewPreflightFingerprint: H("review"),
      expectedExecutionPreflightFingerprint: null,
    },
  );
check(
  authorization.ok === true &&
    authorization.orphanContainerRiskAcknowledgedByExactApproval ===
      false,
  "dry authorization does not acknowledge orphan risk",
);

const badAuthorization =
  validateMoneyShortsPart2InstagramRecoveryExecutionAuthorization(
    {
      armed: true,
      approval: "OLD_CONSUMED_APPROVAL",
      expectedReviewPreflightFingerprint: H("review"),
      expectedExecutionPreflightFingerprint: H("execution"),
    },
  );
check(
  badAuthorization.ok === false,
  "old approval cannot authorize execution",
);

const parserScenario = makeScenario();
const parser = parseMoneyShortsPart2InstagramRecoveryExecutionArgs(
  makeArgv({
    paths: parserScenario.paths,
    reviewFingerprint:
      parserScenario.reviewPreflight.preflightFingerprint,
  }),
);
check(
  parser.ok === true &&
    parser.armed === false &&
    parser.recoveryOutDir ===
      resolve(parserScenario.paths.recoveryOutDir),
  "exact dry-run arguments parse",
);
check(
  parseMoneyShortsPart2InstagramRecoveryExecutionArgs([
    ...makeArgv({
      paths: parserScenario.paths,
      reviewFingerprint:
        parserScenario.reviewPreflight.preflightFingerprint,
    }),
    "--retry",
  ]).ok === false,
  "retry flag is forbidden",
);

const earlyBlockScenario = makeScenario();
const earlyBlockCalls = zeroCalls();
const earlyBlockDeps = makeDependencies({
  scenario: earlyBlockScenario,
  calls: earlyBlockCalls,
});
const wrongApprovalRun =
  await runMoneyShortsPart2InstagramRecoveryExecutionTestOnly(
    {
      argv: makeArgv({
        paths: earlyBlockScenario.paths,
        reviewFingerprint:
          earlyBlockScenario.reviewPreflight
            .preflightFingerprint,
        approval: "CONSUMED_OLD_APPROVAL",
      }),
      ...earlyBlockDeps,
    },
  );
check(
  wrongApprovalRun.ok === false &&
    earlyBlockCalls.review === 0 &&
    earlyBlockCalls.credentials === 0,
  "wrong approval blocks before filesystem review and env",
);

const overlapPaths = {
  ...earlyBlockScenario.paths,
  recoveryOutDir: join(
    earlyBlockScenario.paths.outDir,
    "illegal-recovery",
  ),
};
const overlapRun =
  await runMoneyShortsPart2InstagramRecoveryExecutionTestOnly(
    {
      argv: makeArgv({
        paths: overlapPaths,
        reviewFingerprint:
          earlyBlockScenario.reviewPreflight
            .preflightFingerprint,
      }),
      ...earlyBlockDeps,
    },
  );
check(
  overlapRun.ok === false &&
    earlyBlockCalls.review === 0 &&
    earlyBlockCalls.credentials === 0,
  "recovery path overlap blocks before source review and env",
);

const junctionScenario = makeScenario();
const junctionCalls = zeroCalls();
const junctionDeps = makeDependencies({
  scenario: junctionScenario,
  calls: junctionCalls,
});
const originalOutDirAlias = join(
  junctionScenario.paths.root,
  "original-publish-junction",
);
symlinkSync(
  junctionScenario.paths.outDir,
  originalOutDirAlias,
  "junction",
);
const junctionOverlapRun =
  await runMoneyShortsPart2InstagramRecoveryExecutionTestOnly(
    {
      argv: makeArgv({
        paths: {
          ...junctionScenario.paths,
          recoveryOutDir: join(
            originalOutDirAlias,
            "aliased-recovery",
          ),
        },
        reviewFingerprint:
          junctionScenario.reviewPreflight
            .preflightFingerprint,
      }),
      ...junctionDeps,
    },
  );
check(
  junctionOverlapRun.ok === false &&
    junctionCalls.review === 0 &&
    junctionCalls.credentials === 0,
  "junction alias into the original tree is rejected before source review and env",
);

const stalePreflight = await runScenario();
const stalePreflightResult =
  await runMoneyShortsPart2InstagramRecoveryExecutionTestOnly(
    {
      argv: makeArgv({
        paths: stalePreflight.scenario.paths,
        reviewFingerprint:
          stalePreflight.scenario.reviewPreflight
            .preflightFingerprint,
        executionFingerprint:
          H("wrong-execution-preflight"),
        armed: true,
      }),
      ...stalePreflight.deps,
    },
  );
check(
  stalePreflightResult.ok === false &&
    stalePreflight.calls.credentials === 0 &&
    stalePreflight.calls.adapterFactory === 0,
  "wrong execution preflight blocks before credentials and adapters",
);

const sourceDrift = await runScenario();
let sourceDriftContextReads = 0;
sourceDrift.deps.contextInspector = () => {
  sourceDrift.calls.context += 1;
  sourceDriftContextReads += 1;
  if (sourceDriftContextReads === 1) {
    return sourceDrift.scenario.context;
  }
  return {
    ...sourceDrift.scenario.context,
    currentBinding: {
      ...sourceDrift.scenario.context.currentBinding,
      instagramSourceSha256:
        H("post-lock-source-drift"),
    },
  };
};
const sourceDriftResult =
  await runMoneyShortsPart2InstagramRecoveryExecutionTestOnly(
    {
      argv: sourceDrift.armedArgs,
      ...sourceDrift.deps,
    },
  );
check(
  sourceDriftResult.ok === false &&
    sourceDriftResult.status ===
      "BLOCKED_BEFORE_CLAIM" &&
    sourceDrift.calls.credentials === 0 &&
    sourceDrift.calls.adapterFactory === 0,
  "post-lock source drift blocks before credentials and claim",
);

const noMatch =
  await reconcileMoneyShortsPart2InstagramPublishedMedia({
    expectedCaption: CAPTION,
    listPage: async ({ after }) =>
      after === null
        ? {
            ok: true,
            items: [
              {
                id: "18000000000000010",
                caption: "different",
                media_type: "VIDEO",
                media_product_type: "REELS",
              },
            ],
            nextCursor: "next-1",
          }
        : {
            ok: true,
            items: [],
            nextCursor: null,
          },
  });
check(
  noMatch.ok === true &&
    noMatch.coverageComplete === true &&
    noMatch.pagesScanned === 2,
  "cursor reconciliation proves bounded complete no-match",
);

const duplicateMediaIdAcrossPages =
  await reconcileMoneyShortsPart2InstagramPublishedMedia({
    expectedCaption: CAPTION,
    listPage: async ({ after }) => ({
      ok: true,
      items: [
        {
          id: "18000000000000014",
          caption: "different",
          media_type: "VIDEO",
          media_product_type: "REELS",
        },
      ],
      nextCursor:
        after === null ? "duplicate-id-page" : null,
    }),
  });
check(
  duplicateMediaIdAcrossPages.ok === false &&
    duplicateMediaIdAcrossPages.coverageComplete ===
      false &&
    duplicateMediaIdAcrossPages.candidateCount === null &&
    duplicateMediaIdAcrossPages.reason.endsWith(
      "DUPLICATE_MEDIA_ID",
    ),
  "duplicate media id across cursor pages fails closed",
);

const candidate =
  await reconcileMoneyShortsPart2InstagramPublishedMedia({
    expectedCaption: CAPTION,
    listPage: async () => ({
      ok: true,
      items: [
        {
          id: "18000000000000011",
          caption: CAPTION,
          media_type: "VIDEO",
          media_product_type: "REELS",
          permalink:
            "https://www.instagram.com/reel/Existing1/",
        },
      ],
      nextCursor: null,
    }),
  });
check(
  candidate.ok === false &&
    candidate.candidateCount === 1 &&
    candidate.reason.endsWith(
      "PUBLISHED_CANDIDATE_FOUND",
    ),
  "published candidate blocks recovery mutation",
);

const invalidExactCaptionMediaItems = [
  {
    name:
      "media item missing caption fails closed",
    item: {
      id: "18000000000000019",
      media_type: "VIDEO",
      media_product_type: "REELS",
    },
  },
  {
    name:
      "media item with null caption fails closed",
    item: {
      id: "18000000000000018",
      caption: null,
      media_type: "VIDEO",
      media_product_type: "REELS",
    },
  },
  {
    name:
      "media item with non-string caption fails closed",
    item: {
      id: "18000000000000017",
      caption: 123,
      media_type: "VIDEO",
      media_product_type: "REELS",
    },
  },
  {
    name:
      "exact-caption item missing media_type fails closed",
    item: {
      id: "18000000000000020",
      caption: CAPTION,
      media_product_type: "REELS",
    },
  },
  {
    name:
      "exact-caption item with unknown media_type fails closed",
    item: {
      id: "18000000000000021",
      caption: CAPTION,
      media_type: "UNKNOWN_MEDIA_TYPE",
      media_product_type: "REELS",
    },
  },
  {
    name:
      "exact-caption item missing media_product_type fails closed",
    item: {
      id: "18000000000000022",
      caption: CAPTION,
      media_type: "VIDEO",
    },
  },
  {
    name:
      "exact-caption item with unknown media_product_type fails closed",
    item: {
      id: "18000000000000023",
      caption: CAPTION,
      media_type: "VIDEO",
      media_product_type: "UNKNOWN_PRODUCT",
    },
  },
];
for (const testCase of invalidExactCaptionMediaItems) {
  const result =
    await reconcileMoneyShortsPart2InstagramPublishedMedia({
      expectedCaption: CAPTION,
      listPage: async () => ({
        ok: true,
        items: [testCase.item],
        nextCursor: null,
      }),
    });
  check(
    result.ok === false &&
      result.coverageComplete === false &&
      result.candidateCount === null &&
      result.reason ===
        "PART2_INSTAGRAM_RECOVERY_EXECUTION_RECONCILIATION_ITEM_INVALID",
    testCase.name,
  );
}

const incomplete =
  await reconcileMoneyShortsPart2InstagramPublishedMedia({
    expectedCaption: CAPTION,
    maxPages: 1,
    listPage: async () => ({
      ok: true,
      items: [],
      nextCursor: "still-more",
    }),
  });
check(
  incomplete.ok === false &&
    incomplete.coverageComplete === false &&
    incomplete.reason.endsWith("PAGE_LIMIT"),
  "incomplete pagination fails closed",
);

const success = await runScenario();
check(
  success.dry.ok === true &&
    success.dry.status === "PREFLIGHT_ONLY_OK" &&
    success.dry.preflightWriteCount === 1,
  "local execution preflight is created",
);
check(
  success.calls.credentials === 0 &&
    success.calls.adapterFactory === 0,
  "dry-run does not read credentials or load adapters",
);
const dryAgain =
  await runMoneyShortsPart2InstagramRecoveryExecutionTestOnly(
    {
      argv: makeArgv({
        paths: success.scenario.paths,
        reviewFingerprint:
          success.scenario.reviewPreflight
            .preflightFingerprint,
      }),
      ...success.deps,
    },
  );
check(
  dryAgain.ok === true &&
    dryAgain.preflightWriteCount === 0 &&
    success.calls.credentials === 0,
  "identical local preflight is read-only and idempotent",
);
const armedSuccess =
  await runMoneyShortsPart2InstagramRecoveryExecutionTestOnly(
    {
      argv: success.armedArgs,
      ...success.deps,
    },
  );
check(
  armedSuccess.ok === true &&
    armedSuccess.status ===
      "PART2_INSTAGRAM_RECOVERY_OK",
  "armed fake execution completes once",
);
check(
  success.calls.identity === 1 &&
    success.calls.mediaList === 2 &&
    success.calls.blobHead === 1 &&
    success.calls.container === 1 &&
    success.calls.poll === 1 &&
    success.calls.publish === 1 &&
    success.calls.mediaVerify === 1 &&
    success.calls.ledgerWrite === 1,
  "success call counts match one-shot boundary",
);
check(
  armedSuccess.sideEffectCounters.blobPutCount === 0 &&
    armedSuccess.sideEffectCounters.youtubeActionCount === 0 &&
    armedSuccess.sideEffectCounters.part1ActionCount === 0 &&
    armedSuccess.sideEffectCounters.databaseMutationCount === 0 &&
    armedSuccess.sideEffectCounters.automaticRetryCount === 0,
  "forbidden side effects remain zero",
);
const ledgerAfter = JSON.parse(
  readFileSync(
    success.scenario.paths.ledgerPath,
    "utf8",
  ),
);
check(
  ledgerAfter.records.length === 1 &&
    ledgerAfter.records[0].platform ===
      "instagram_reels" &&
    ledgerAfter.records.every(
      (record) => record.platform !== "youtube_shorts",
    ),
  "ledger adds only the Part 2 Instagram record",
);
check(
  readFileSync(
    success.scenario.paths.contentUnitPath,
    "utf8",
  ) === "{}\n",
  "original content-unit evidence remains byte-identical",
);
const recoveryEvidenceText = allFileText(
  success.scenario.paths.recoveryOutDir,
);
check(
  !recoveryEvidenceText.includes("fake-test-token") &&
    !recoveryEvidenceText.includes("Authorization") &&
    !recoveryEvidenceText.includes("raw provider"),
  "durable recovery evidence contains no credential or raw provider data",
);

const successEvidencePaths =
  moneyShortsPart2InstagramRecoveryExecutionPaths(
    success.scenario.paths.recoveryOutDir,
  );
const successExecutionPlanResult =
  buildMoneyShortsPart2InstagramRecoveryExecutionPlan({
    reviewPreflight: success.scenario.reviewPreflight,
    expectedReviewPreflightFingerprint:
      success.scenario.reviewPreflight
        .preflightFingerprint,
    recoveryOutDir:
      success.scenario.paths.recoveryOutDir,
    currentBinding: success.scenario.binding,
    expectedInstagramAccountId: ACCOUNT_ID,
    expectedYoutubeChannelId: CHANNEL_ID,
    blobPathname: success.scenario.material.blobPathname,
    blobUrlSha256:
      success.scenario.material.blobUrlSha256,
    captionSha256:
      success.scenario.material.captionSha256,
    shareToFeed: success.scenario.material.shareToFeed,
    ledgerBaselineSha256:
      success.scenario.paths.ledgerSha256,
  });
const successClaimBytes = readFileSync(
  successEvidencePaths.claimPath,
);
const successClaim = JSON.parse(
  successClaimBytes,
);
const successResult = JSON.parse(
  readFileSync(successEvidencePaths.resultPath, "utf8"),
);
const successClaimValidation =
  validateMoneyShortsPart2InstagramRecoveryExecutionClaim(
    {
      evidence: successClaim,
      currentPlan: successExecutionPlanResult.plan,
      expectedPreflightFingerprint:
        successResult.preflightFingerprint,
    },
  );
let successChainValid =
  successExecutionPlanResult.ok === true &&
  successClaimValidation.valid === true;
let previousEvidenceSha256 = H(successClaimBytes);
let previousTransition = null;
let chainLatestEvent = null;
let chainLatestEventFileSha256 = null;
for (const transition of
  MONEY_SHORTS_PART2_INSTAGRAM_RECOVERY_EXECUTION_TRANSITIONS) {
  const eventPath =
    moneyShortsPart2InstagramRecoveryExecutionEventPath(
      successEvidencePaths.eventDir,
      transition,
    );
  const eventBytes = readFileSync(eventPath);
  const event = JSON.parse(eventBytes);
  const eventValidation =
    validateMoneyShortsPart2InstagramRecoveryExecutionEvent(
      {
        evidence: event,
        claim: successClaim,
        previousEvidenceSha256,
        previousTransition,
      },
    );
  successChainValid =
    successChainValid &&
    eventValidation.valid === true;
  previousEvidenceSha256 = H(eventBytes);
  previousTransition = transition;
  chainLatestEvent = event;
  chainLatestEventFileSha256 =
    previousEvidenceSha256;
}
const successResultValidation =
  validateMoneyShortsPart2InstagramRecoveryExecutionResult(
    {
      evidence: successResult,
      claim: successClaim,
      latestEvent: chainLatestEvent,
      latestEventFileSha256:
        chainLatestEventFileSha256,
    },
  );
check(
  successChainValid &&
    successResultValidation.valid === true &&
    successResult.latestTransition === "complete",
  "durable claim-event-result chain validates every hash link",
);
const actualLatestEventPath =
  moneyShortsPart2InstagramRecoveryExecutionEventPath(
    successEvidencePaths.eventDir,
    successResult.latestTransition,
  );
const actualLatestEventBytes = readFileSync(
  actualLatestEventPath,
);
const actualLatestEvent = JSON.parse(
  actualLatestEventBytes,
);
const priorAllowedTransition =
  "ledger_write_confirmed";
const priorAllowedEventPath =
  moneyShortsPart2InstagramRecoveryExecutionEventPath(
    successEvidencePaths.eventDir,
    priorAllowedTransition,
  );
const priorAllowedEventBytes = readFileSync(
  priorAllowedEventPath,
);
const priorAllowedEvent = JSON.parse(
  priorAllowedEventBytes,
);
const priorResultCounters = {
  ...successResult.sideEffectCounters,
  evidenceWriteCount:
    successResult.sideEffectCounters.evidenceWriteCount - 1,
};
const resultBoundToPriorEvent =
  buildMoneyShortsPart2InstagramRecoveryExecutionResult({
    claim: successClaim,
    latestEvent: priorAllowedEvent,
    latestEventFileSha256: H(priorAllowedEventBytes),
    status:
      "INSTAGRAM_AND_LEDGER_CONFIRMED_RECOVERY_EVIDENCE_INCOMPLETE",
    blockerCode:
      "PART2_INSTAGRAM_RECOVERY_EXECUTION_TEST_PRIOR_TRANSITION",
    completedAtIso: successResult.completedAtIso,
    publicState: priorAllowedEvent.publicState,
    sideEffectCounters: priorResultCounters,
  });
const resultWithTransitionNotBoundToActualLatestEvent =
  buildMoneyShortsPart2InstagramRecoveryExecutionResult({
    claim: successClaim,
    latestEvent: priorAllowedEvent,
    latestEventFileSha256: H(actualLatestEventBytes),
    status:
      "INSTAGRAM_AND_LEDGER_CONFIRMED_RECOVERY_EVIDENCE_INCOMPLETE",
    blockerCode:
      "PART2_INSTAGRAM_RECOVERY_EXECUTION_TEST_PRIOR_TRANSITION",
    completedAtIso: successResult.completedAtIso,
    publicState: priorAllowedEvent.publicState,
    sideEffectCounters: priorResultCounters,
  });
const resultWithImpossibleEvidenceWriteCount =
  buildMoneyShortsPart2InstagramRecoveryExecutionResult({
    claim: successClaim,
    latestEvent: priorAllowedEvent,
    latestEventFileSha256: H(priorAllowedEventBytes),
    status:
      "INSTAGRAM_AND_LEDGER_CONFIRMED_RECOVERY_EVIDENCE_INCOMPLETE",
    blockerCode:
      "PART2_INSTAGRAM_RECOVERY_EXECUTION_TEST_PRIOR_TRANSITION",
    completedAtIso: successResult.completedAtIso,
    publicState: priorAllowedEvent.publicState,
    sideEffectCounters: {
      ...priorResultCounters,
      evidenceWriteCount: 999,
    },
  });
check(
  actualLatestEvent.transition === "complete" &&
    successResult.latestEventSha256 ===
      H(actualLatestEventBytes) &&
    resultBoundToPriorEvent !== null &&
    resultBoundToPriorEvent.latestTransition ===
      priorAllowedTransition &&
    resultWithTransitionNotBoundToActualLatestEvent ===
      null &&
    resultWithImpossibleEvidenceWriteCount === null,
  "result rejects an unbound allowed transition and impossible evidence counter",
);

const callsBeforeRerun = {
  ...success.calls,
};
const rerun =
  await runMoneyShortsPart2InstagramRecoveryExecutionTestOnly(
    {
      argv: success.armedArgs,
      ...success.deps,
    },
  );
check(
  rerun.ok === false &&
    success.calls.credentials ===
      callsBeforeRerun.credentials &&
    success.calls.adapterFactory ===
      callsBeforeRerun.adapterFactory,
  "rerun blocks before credential or adapter access",
);

const invalidCredentials = await runScenario();
const validCredentialsProvider =
  invalidCredentials.deps.credentialsProvider;
invalidCredentials.deps.credentialsProvider = () => {
  invalidCredentials.calls.credentials += 1;
  return {
    ok: true,
    accountId: ACCOUNT_ID,
    accessToken: "",
  };
};
const invalidCredentialsResult =
  await runMoneyShortsPart2InstagramRecoveryExecutionTestOnly(
    {
      argv: invalidCredentials.armedArgs,
      ...invalidCredentials.deps,
    },
  );
const invalidCredentialEvidencePaths =
  moneyShortsPart2InstagramRecoveryExecutionPaths(
    invalidCredentials.scenario.paths.recoveryOutDir,
  );
check(
  invalidCredentialsResult.ok === false &&
    invalidCredentialsResult.status ===
      "BLOCKED_BEFORE_CLAIM" &&
    invalidCredentialsResult.blockerCode ===
      "PART2_INSTAGRAM_RECOVERY_EXECUTION_CREDENTIALS_INVALID" &&
    invalidCredentialsResult.ownerApprovalConsumed ===
      false &&
    invalidCredentials.calls.adapterFactory === 0 &&
    !existsSync(invalidCredentialEvidencePaths.claimPath),
  "invalid credentials block before claim and leave approval unconsumed",
);
invalidCredentials.deps.credentialsProvider =
  validCredentialsProvider;
const validRetryAfterInvalidCredentials =
  await runMoneyShortsPart2InstagramRecoveryExecutionTestOnly(
    {
      argv: invalidCredentials.armedArgs,
      ...invalidCredentials.deps,
    },
  );
check(
  validRetryAfterInvalidCredentials.ok === true &&
    validRetryAfterInvalidCredentials.status ===
      "PART2_INSTAGRAM_RECOVERY_OK",
  "same approval remains usable after pre-claim credential rejection",
);

const claimOnlyOrphan = await runScenario();
const claimOnlyOrphanPaths =
  moneyShortsPart2InstagramRecoveryExecutionPaths(
    claimOnlyOrphan.scenario.paths.recoveryOutDir,
  );
const externalReadyEventPath =
  moneyShortsPart2InstagramRecoveryExecutionEventPath(
    claimOnlyOrphanPaths.eventDir,
    "external_execution_ready",
  );
const claimOnlyFailureFs = {
  ...nodeFs,
  linkSync(source, destination) {
    if (
      resolve(destination) ===
      resolve(externalReadyEventPath)
    ) {
      throw new Error(
        "simulated first event commit failure",
      );
    }
    return nodeFs.linkSync(source, destination);
  },
};
const claimOnlyOrphanResult =
  await runMoneyShortsPart2InstagramRecoveryExecutionTestOnly(
    {
      argv: claimOnlyOrphan.armedArgs,
      ...claimOnlyOrphan.deps,
      fsImpl: claimOnlyFailureFs,
    },
  );
const callsBeforeClaimOrphanRerun = {
  ...claimOnlyOrphan.calls,
};
const claimOnlyOrphanRerun =
  await runMoneyShortsPart2InstagramRecoveryExecutionTestOnly(
    {
      argv: claimOnlyOrphan.armedArgs,
      ...claimOnlyOrphan.deps,
    },
  );
check(
  claimOnlyOrphanResult.ok === false &&
    existsSync(claimOnlyOrphanPaths.claimPath) &&
    claimOnlyOrphan.calls.credentials ===
      callsBeforeClaimOrphanRerun.credentials &&
    claimOnlyOrphan.calls.adapterFactory ===
      callsBeforeClaimOrphanRerun.adapterFactory &&
    claimOnlyOrphan.calls.identity === 0 &&
    claimOnlyOrphan.calls.container === 0 &&
    claimOnlyOrphanRerun.ok === false,
  "claim-only orphan blocks rerun before credentials and every external action",
);

const noId = await runScenario({
  adapterOverrides: {
    async createContainer() {
      return {
        ok: false,
        containerId: null,
      };
    },
  },
});
const noIdResult =
  await runMoneyShortsPart2InstagramRecoveryExecutionTestOnly(
    {
      argv: noId.armedArgs,
      ...noId.deps,
    },
  );
check(
  noIdResult.ok === false &&
    noIdResult.status ===
      "INSTAGRAM_CONTAINER_OUTCOME_UNKNOWN",
  "container no-id is preserved as unknown outcome",
);
check(
  noId.calls.publish === 0 &&
    noId.calls.mediaVerify === 0 &&
    noId.calls.ledgerWrite === 0,
  "container no-id blocks poll, publish, verify, and ledger",
);

const duplicate = await runScenario({
  adapterOverrides: {
    async listPublishedMediaPage() {
      return {
        ok: true,
        items: [
          {
            id: "18000000000000012",
            caption: CAPTION,
            media_type: "VIDEO",
            media_product_type: "REELS",
          },
        ],
        nextCursor: null,
      };
    },
  },
});
const duplicateResult =
  await runMoneyShortsPart2InstagramRecoveryExecutionTestOnly(
    {
      argv: duplicate.armedArgs,
      ...duplicate.deps,
    },
  );
check(
  duplicateResult.ok === false &&
    duplicate.calls.container === 0 &&
    duplicate.calls.publish === 0 &&
    duplicate.calls.ledgerWrite === 0,
  "live published candidate blocks all recovery mutation",
);

const prePublishDuplicate = await runScenario({
  adapterOverrides: (calls) => ({
    async listPublishedMediaPage() {
      calls.mediaList += 1;
      return calls.mediaList === 1
        ? {
            ok: true,
            items: [],
            nextCursor: null,
          }
        : {
            ok: true,
            items: [
              {
                id: "18000000000000013",
                caption: CAPTION,
                media_type: "VIDEO",
                media_product_type: "REELS",
              },
            ],
            nextCursor: null,
          };
    },
  }),
});
const prePublishDuplicateResult =
  await runMoneyShortsPart2InstagramRecoveryExecutionTestOnly(
    {
      argv: prePublishDuplicate.armedArgs,
      ...prePublishDuplicate.deps,
    },
  );
check(
  prePublishDuplicateResult.ok === false &&
    prePublishDuplicate.calls.mediaList === 2 &&
    prePublishDuplicate.calls.container === 1 &&
    prePublishDuplicate.calls.publish === 0 &&
    prePublishDuplicate.calls.ledgerWrite === 0,
  "candidate found only in pre-publish reconciliation blocks publish and ledger",
);

const identityMismatch = await runScenario({
  adapterOverrides: {
    async verifyIdentity() {
      return {
        ok: true,
        accountId: "17841414372742258",
      };
    },
  },
});
const identityMismatchResult =
  await runMoneyShortsPart2InstagramRecoveryExecutionTestOnly(
    {
      argv: identityMismatch.armedArgs,
      ...identityMismatch.deps,
    },
  );
check(
  identityMismatchResult.ok === false &&
    identityMismatch.calls.mediaList === 0 &&
    identityMismatch.calls.blobHead === 0 &&
    identityMismatch.calls.container === 0,
  "identity mismatch blocks reconciliation, Blob, and mutation",
);

const reconciliationThrow = await runScenario({
  adapterOverrides: {
    async listPublishedMediaPage() {
      throw new Error("redacted-provider-failure");
    },
  },
});
const reconciliationThrowResult =
  await runMoneyShortsPart2InstagramRecoveryExecutionTestOnly(
    {
      argv: reconciliationThrow.armedArgs,
      ...reconciliationThrow.deps,
    },
  );
check(
  reconciliationThrowResult.ok === false &&
    reconciliationThrow.calls.blobHead === 0 &&
    reconciliationThrow.calls.container === 0 &&
    reconciliationThrow.calls.publish === 0,
  "reconciliation exception fails closed before Blob and mutation",
);

const blobFailure = await runScenario({
  adapterOverrides: {
    async headBlob() {
      return {
        ok: false,
        status: 404,
        contentType: "text/html",
      };
    },
  },
});
const blobFailureResult =
  await runMoneyShortsPart2InstagramRecoveryExecutionTestOnly(
    {
      argv: blobFailure.armedArgs,
      ...blobFailure.deps,
    },
  );
check(
  blobFailureResult.ok === false &&
    blobFailure.calls.container === 0 &&
    blobFailure.calls.publish === 0,
  "Blob HEAD failure blocks container and publish",
);

const pollTimeout = await runScenario({
  adapterOverrides: (calls) => ({
    async readContainer() {
      calls.poll += 1;
      return {
        ok: true,
        statusCode: "IN_PROGRESS",
      };
    },
    async sleep() {
      calls.sleep += 1;
    },
  }),
});
const pollTimeoutResult =
  await runMoneyShortsPart2InstagramRecoveryExecutionTestOnly(
    {
      argv: pollTimeout.armedArgs,
      ...pollTimeout.deps,
    },
  );
check(
  pollTimeoutResult.ok === false &&
    pollTimeout.calls.poll === 24 &&
    pollTimeout.calls.sleep === 23 &&
    pollTimeout.calls.publish === 0 &&
    pollTimeout.calls.ledgerWrite === 0,
  "24-poll timeout is bounded and never publishes",
);

const publishNoId = await runScenario({
  adapterOverrides: (calls) => ({
    async publishContainer() {
      calls.publish += 1;
      return { ok: true, mediaId: null };
    },
  }),
});
const publishNoIdResult =
  await runMoneyShortsPart2InstagramRecoveryExecutionTestOnly(
    {
      argv: publishNoId.armedArgs,
      ...publishNoId.deps,
    },
  );
check(
  publishNoIdResult.ok === false &&
    publishNoIdResult.status ===
      "INSTAGRAM_PUBLISH_OUTCOME_UNKNOWN" &&
    publishNoId.calls.publish === 1 &&
    publishNoId.calls.mediaVerify === 0 &&
    publishNoId.calls.ledgerWrite === 0,
  "publish no-id stays unknown with no verify or ledger",
);

const publishTransportUnknown = await runScenario({
  adapterOverrides: (calls) => ({
    async publishContainer() {
      calls.publish += 1;
      throw new Error(
        "simulated redacted publish transport failure",
      );
    },
  }),
});
const publishTransportUnknownResult =
  await runMoneyShortsPart2InstagramRecoveryExecutionTestOnly(
    {
      argv: publishTransportUnknown.armedArgs,
      ...publishTransportUnknown.deps,
    },
  );
check(
  publishTransportUnknownResult.ok === false &&
    publishTransportUnknownResult.status ===
      "INSTAGRAM_PUBLISH_OUTCOME_UNKNOWN" &&
    publishTransportUnknown.calls.publish === 1 &&
    publishTransportUnknown.calls.mediaVerify === 0 &&
    publishTransportUnknown.calls.ledgerWrite === 0,
  "publish transport uncertainty records unknown and never verifies or writes ledger",
);

const verifyFailure = await runScenario({
  adapterOverrides: (calls) => ({
    async verifyPublishedMedia() {
      calls.mediaVerify += 1;
      return {
        ok: false,
        id: null,
      };
    },
  }),
});
const verifyFailureResult =
  await runMoneyShortsPart2InstagramRecoveryExecutionTestOnly(
    {
      argv: verifyFailure.armedArgs,
      ...verifyFailure.deps,
    },
  );
check(
  verifyFailureResult.ok === false &&
    verifyFailureResult.status ===
      "INSTAGRAM_PUBLISHED_LEDGER_MISSING" &&
    verifyFailure.calls.publish === 1 &&
    verifyFailure.calls.ledgerWrite === 0,
  "media verify failure preserves published-ledger-missing state",
);

const ledgerUnknown = await runScenario();
ledgerUnknown.deps.ledgerWriter = () => ({
  ok: false,
  committed: true,
  lockReleased: false,
});
const ledgerUnknownResult =
  await runMoneyShortsPart2InstagramRecoveryExecutionTestOnly(
    {
      argv: ledgerUnknown.armedArgs,
      ...ledgerUnknown.deps,
    },
  );
check(
  ledgerUnknownResult.ok === false &&
    ledgerUnknownResult.status ===
      "INSTAGRAM_PUBLISHED_LEDGER_COMMIT_OUTCOME_UNKNOWN" &&
    ledgerUnknown.calls.publish === 1,
  "committed ledger uncertainty never retries publication",
);

const unreleasedLedgerLock = await runScenario();
const committedLedgerWriter =
  unreleasedLedgerLock.deps.ledgerWriter;
unreleasedLedgerLock.deps.ledgerWriter = (
  path,
  ledger,
  options,
) => ({
  ...committedLedgerWriter(path, ledger, options),
  ok: true,
  committed: true,
  lockReleased: false,
});
const unreleasedLedgerLockResult =
  await runMoneyShortsPart2InstagramRecoveryExecutionTestOnly(
    {
      argv: unreleasedLedgerLock.armedArgs,
      ...unreleasedLedgerLock.deps,
    },
  );
const callsBeforeCommittedUnknownRerun = {
  ...unreleasedLedgerLock.calls,
};
const committedUnknownRerun =
  await runMoneyShortsPart2InstagramRecoveryExecutionTestOnly(
    {
      argv: unreleasedLedgerLock.armedArgs,
      ...unreleasedLedgerLock.deps,
    },
  );
check(
  unreleasedLedgerLockResult.ok === false &&
    unreleasedLedgerLockResult.status ===
      "INSTAGRAM_PUBLISHED_LEDGER_COMMIT_OUTCOME_UNKNOWN" &&
    callsBeforeCommittedUnknownRerun.ledgerWrite === 1 &&
    committedUnknownRerun.ok === false &&
    unreleasedLedgerLock.calls.credentials ===
      callsBeforeCommittedUnknownRerun.credentials &&
    unreleasedLedgerLock.calls.publish ===
      callsBeforeCommittedUnknownRerun.publish &&
    unreleasedLedgerLock.calls.ledgerWrite ===
      callsBeforeCommittedUnknownRerun.ledgerWrite,
  "committed ledger with an unreleased lock cannot succeed or republish on rerun",
);

const recoveryLockUnlinkFailure = await runScenario();
const recoveryLockFailurePaths =
  moneyShortsPart2InstagramRecoveryExecutionPaths(
    recoveryLockUnlinkFailure.scenario.paths
      .recoveryOutDir,
  );
const unlinkFailureFs = {
  ...nodeFs,
  unlinkSync(path) {
    if (
      resolve(path) ===
      resolve(recoveryLockFailurePaths.lockPath)
    ) {
      throw new Error("simulated recovery lock unlink failure");
    }
    return nodeFs.unlinkSync(path);
  },
};
const recoveryLockUnlinkFailureResult =
  await runMoneyShortsPart2InstagramRecoveryExecutionTestOnly(
    {
      argv: recoveryLockUnlinkFailure.armedArgs,
      ...recoveryLockUnlinkFailure.deps,
      fsImpl: unlinkFailureFs,
    },
  );
const recoveryLockFailureDurableResult =
  existsSync(recoveryLockFailurePaths.resultPath)
    ? JSON.parse(
        readFileSync(
          recoveryLockFailurePaths.resultPath,
          "utf8",
        ),
      )
    : null;
check(
  recoveryLockUnlinkFailureResult.ok === false &&
    recoveryLockUnlinkFailureResult.lockCleanupFailed ===
      true &&
    recoveryLockUnlinkFailureResult.successResultWritten ===
      false &&
    recoveryLockFailureDurableResult?.status !==
      "PART2_INSTAGRAM_RECOVERY_OK",
  "recovery lock unlink failure cannot record a success result",
);

const runnerSource = readFileSync(
  new URL(
    "./run-money-shorts-part2-instagram-recovery-execution-v1.mjs",
    import.meta.url,
  ),
  "utf8",
);
check(
  runnerSource.includes(
    "https://graph.facebook.com/v25.0",
  ) &&
    runnerSource.includes("redirect: \"error\""),
  "Graph v25 calls reject redirects",
);
check(
  !runnerSource.includes("BLOB_READ_WRITE_TOKEN") &&
    !runnerSource.includes("YOUTUBE_REFRESH_TOKEN") &&
    !runnerSource.includes("googleapis") &&
    !runnerSource.includes("supabase"),
  "runner has no Blob-write, YouTube, or database credentials",
);
check(
  runnerSource.includes(
    "process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID",
  ) &&
    runnerSource.includes(
      "process.env.INSTAGRAM_ACCESS_TOKEN",
    ) &&
    !runnerSource.includes(".env.local"),
  "production reads only the two injected Instagram env keys",
);

console.log(
  JSON.stringify(
    {
      passed,
      failed,
      externalCalls: 0,
      realCredentialReads: 0,
      protectedFileWrites: 0,
    },
    null,
    2,
  ),
);

if (failed > 0) {
  process.exitCode = 1;
}
