#!/usr/bin/env node

import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  MONEY_SHORTS_PART2_YOUTUBE_RECOVERY_EXECUTION_TRANSITIONS,
  moneyShortsPart2YoutubeRecoveryExecutionEventPath,
  moneyShortsPart2YoutubeRecoveryExecutionPaths,
  validateMoneyShortsPart2YoutubeRecoveryExecutionClaim,
  validateMoneyShortsPart2YoutubeRecoveryExecutionEvent,
  validateMoneyShortsPart2YoutubeRecoveryExecutionResult,
} from "../lib/money-shorts-part2-youtube-recovery-execution.mjs";
import {
  parsePublishLedgerBytesReadOnly,
} from "../lib/publish-ledger-runtime.mjs";
import {
  MONEY_SHORTS_PART2_YOUTUBE_RECOVERY_PREFLIGHT_INSPECTION,
  buildMoneyShortsPart2YoutubeRecoveryPreflight,
  buildMoneyShortsPart2YoutubeRecoveryPreflightPlan,
} from "./run-money-shorts-part2-youtube-recovery-preflight-v1.mjs";
import {
  parseMoneyShortsPart2YoutubeRecoveryExecutionArgs,
  runMoneyShortsPart2YoutubeRecoveryExecution,
} from "./run-money-shorts-part2-youtube-recovery-execution-v1.mjs";

const APPROVAL =
  "APPROVE_PART2_YOUTUBE_RECOVERY_EXECUTION_V1";
const CHANNEL_ID = "UCR23z78qDtyhHIaV29rSB9A";
const ACCOUNT_ID = "17841414372742257";
const MEDIA_ID = "17900000000000001";
const VIDEO_ID = "Part2Video01";
const PUBLISHED_AT_ISO = "2026-07-22T01:00:00.000Z";
const FIXED_CLOCK_ISO = "2026-07-22T02:00:00.000Z";
const HASH = "a".repeat(64);

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

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function writeJson(path, value) {
  mkdirSync(join(path, ".."), { recursive: true });
  const bytes = Buffer.from(
    `${JSON.stringify(value, null, 2)}\n`,
    "utf8",
  );
  writeFileSync(path, bytes);
  return { bytes, sha256: sha256(bytes) };
}

function readJsonEvidence(path) {
  const bytes = readFileSync(path);
  return {
    bytes,
    sha256: sha256(bytes),
    evidence: JSON.parse(bytes.toString("utf8")),
  };
}

function clone(value) {
  return structuredClone(value);
}

function createFixture(root, name) {
  const fixtureRoot = join(root, name);
  const sourceRoot = join(fixtureRoot, "source");
  const sourcePath = join(sourceRoot, "part-2.mp4");
  const contentUnitPath = join(sourceRoot, "content-unit.json");
  const ledgerPath = join(sourceRoot, "publish-ledger.json");
  const originalOutDir = join(sourceRoot, "original-publish");
  const instagramRecoveryOutDir = join(
    sourceRoot,
    "instagram-recovery",
  );
  const recoveryOutDir = join(
    fixtureRoot,
    "youtube-recovery",
  );
  mkdirSync(originalOutDir, { recursive: true });
  mkdirSync(instagramRecoveryOutDir, { recursive: true });

  const sourceBytes = Buffer.from(
    `fake-part-2-mp4-${name}`,
    "utf8",
  );
  writeFileSync(sourcePath, sourceBytes);
  const sourceSha256 = sha256(sourceBytes);
  const contentUnitWrite = writeJson(contentUnitPath, {
    schemaVersion: "checker_content_unit_v1",
    fixture: name,
  });
  const contentId = `checker-${name}-part-2`;
  const version = "v1";
  const instagramKey =
    `${contentId}/instagram_reels/${version}`;
  const youtubeKey =
    `${contentId}/youtube_shorts/${version}`;
  const permalink =
    `https://www.instagram.com/reel/${MEDIA_ID}/`;
  const ledger = {
    schemaVersion: "publish_ledger_v1",
    records: [
      {
        key: instagramKey,
        contentId,
        platform: "instagram_reels",
        version,
        variantId:
          "instagram_reels_full_frame_1080x1920",
        publishedId: MEDIA_ID,
        publishedUrl: permalink,
        status: "published",
        publishedAtIso: PUBLISHED_AT_ISO,
        metadata: { fixture: name },
      },
    ],
  };
  const ledgerWrite = writeJson(ledgerPath, ledger);
  const metadata = {
    titleBase: "월급 3일 만에 사라지는 이유",
    titleWithShortsSuffix: "월급 3일 만에 사라지는 이유 #Shorts",
    descriptionBase:
      "월급이 빠르게 사라지는 구조를 고정비와 변동비 관점에서 설명하고, 오늘 바로 확인할 수 있는 지출 점검 순서를 안내합니다.",
    tags: ["재테크", "월급", "Shorts"],
    categoryId: "27",
    defaultLanguage: "ko",
    privacyStatus: "public",
    selfDeclaredMadeForKids: false,
    containsSyntheticMedia: true,
  };
  const metadataSha256 = sha256(
    JSON.stringify(metadata),
  );
  const publicationAttemptFingerprint =
    sha256(`publication-${name}`);
  const originalSafeResultFileSha256 =
    sha256(`original-safe-file-${name}`);
  const originalSafeResultFingerprint =
    sha256(`original-safe-result-${name}`);
  const instagramRecoveryPreflightFingerprint =
    sha256(`instagram-preflight-${name}`);
  const instagramRecoveryClaimFingerprint =
    sha256(`instagram-claim-${name}`);
  const instagramRecoveryResultFileSha256 =
    sha256(`instagram-result-file-${name}`);
  const instagramRecoveryResultFingerprint =
    sha256(`instagram-result-${name}`);

  const facts = {
    currentBinding: {
      contentId,
      version,
      productionPartId: "part-2",
      contentUnitManifestPath: contentUnitPath,
      contentUnitSha256: contentUnitWrite.sha256,
      instagramSourceSha256: sourceSha256,
      youtubeSourceSha256: sourceSha256,
      publishMetadataSha256: metadataSha256,
      finalVideoApprovalFingerprint:
        sha256(`final-approval-${name}`),
    },
    originalAttempt: {
      safeResultFileSha256:
        originalSafeResultFileSha256,
      safeResultFingerprint:
        originalSafeResultFingerprint,
      status: "INSTAGRAM_CONTAINER_OUTCOME_UNKNOWN",
      blockerCode:
        "PART2_DUAL_SAFE_INSTAGRAM_CONTAINER_NO_ID",
      youtubeOutcome: "not_started",
      youtubeInsertCount: 0,
    },
    instagramRecovery: {
      status: "PART2_INSTAGRAM_RECOVERY_OK",
      resultFileSha256:
        instagramRecoveryResultFileSha256,
      resultFingerprint:
        instagramRecoveryResultFingerprint,
      preflightFingerprint:
        instagramRecoveryPreflightFingerprint,
      claimFingerprint:
        instagramRecoveryClaimFingerprint,
      planFingerprint:
        sha256(`instagram-plan-${name}`),
      accountId: ACCOUNT_ID,
      mediaId: MEDIA_ID,
      permalink,
      publishedAtIso: PUBLISHED_AT_ISO,
    },
    youtube: {
      outcome: "confirmed_not_started",
      videoId: null,
      sourcePath,
      sourceSha256,
      sourceSizeBytes: sourceBytes.length,
      variantId:
        "youtube_shorts_letterbox_1080x1920",
      metadataSha256,
      metadata,
      expectedChannelId: CHANNEL_ID,
      actionAllowed: false,
    },
    ledger: {
      path: ledgerPath,
      sha256: ledgerWrite.sha256,
      instagramRecordConfirmed: true,
      instagramRecordedKey: instagramKey,
      instagramPublishedId: MEDIA_ID,
      youtubeRecordAbsent: true,
      expectedYoutubeKey: youtubeKey,
    },
  };
  const reviewPlanResult =
    buildMoneyShortsPart2YoutubeRecoveryPreflightPlan({
      facts,
    });
  if (!reviewPlanResult.ok) {
    throw new Error(reviewPlanResult.reason);
  }
  const reviewPreflight =
    buildMoneyShortsPart2YoutubeRecoveryPreflight({
      plan: reviewPlanResult.plan,
    });
  if (!reviewPreflight) {
    throw new Error("review_preflight_build_failed");
  }
  const reviewResult = {
    ok: true,
    status:
      "LOCAL_PART2_YOUTUBE_RECOVERY_PREFLIGHT_OK",
    readyForActualExecution: false,
    safeToUpload: false,
    ownerApprovalRequired: true,
    contentId,
    sourceSha256,
    instagramMediaId: MEDIA_ID,
    youtubeOutcome: "confirmed_not_started",
    expectedYoutubeChannelId: CHANNEL_ID,
    ledgerSha256: ledgerWrite.sha256,
    planFingerprint: reviewPlanResult.plan.planFingerprint,
    preflightFingerprint:
      reviewPreflight.preflightFingerprint,
    preflight: reviewPreflight,
    sideEffectCounters:
      reviewPreflight.sideEffectCounters,
  };
  const dryArgs = [
    "--approval",
    APPROVAL,
    "--recovery-out-dir",
    recoveryOutDir,
    "--expected-review-preflight-fingerprint",
    reviewPreflight.preflightFingerprint,
    "--inspection",
    MONEY_SHORTS_PART2_YOUTUBE_RECOVERY_PREFLIGHT_INSPECTION,
    "--content-unit",
    contentUnitPath,
    "--ledger",
    ledgerPath,
    "--original-out-dir",
    originalOutDir,
    "--instagram-recovery-out-dir",
    instagramRecoveryOutDir,
    "--expected-content-id",
    contentId,
    "--expected-manifest-sha256",
    contentUnitWrite.sha256,
    "--expected-source-sha256",
    sourceSha256,
    "--expected-publication-attempt-fingerprint",
    publicationAttemptFingerprint,
    "--expected-instagram-account-id",
    ACCOUNT_ID,
    "--expected-instagram-media-id",
    MEDIA_ID,
    "--expected-youtube-channel-id",
    CHANNEL_ID,
    "--expected-original-safe-result-file-sha256",
    originalSafeResultFileSha256,
    "--expected-original-safe-result-fingerprint",
    originalSafeResultFingerprint,
    "--expected-instagram-recovery-preflight-fingerprint",
    instagramRecoveryPreflightFingerprint,
    "--expected-instagram-recovery-claim-fingerprint",
    instagramRecoveryClaimFingerprint,
    "--expected-instagram-recovery-result-file-sha256",
    instagramRecoveryResultFileSha256,
    "--expected-instagram-recovery-result-fingerprint",
    instagramRecoveryResultFingerprint,
    "--expected-ledger-sha256",
    ledgerWrite.sha256,
  ];

  return {
    root: fixtureRoot,
    contentId,
    ledgerPath,
    ledgerBaselineBytes: ledgerWrite.bytes,
    youtubeKey,
    reviewResult,
    dryArgs,
    recoveryPaths:
      moneyShortsPart2YoutubeRecoveryExecutionPaths(
        recoveryOutDir,
      ),
  };
}

function makeReviewRunner(reviewResult, mode = "stable") {
  const state = { calls: 0 };
  return {
    state,
    runner: async () => {
      state.calls += 1;
      if (mode === "drift" && state.calls === 2) {
        return {
          ...clone(reviewResult),
          preflightFingerprint: "b".repeat(64),
        };
      }
      return clone(reviewResult);
    },
  };
}

function makeEnvHarness() {
  const state = { calls: 0 };
  return {
    state,
    provider: () => {
      state.calls += 1;
      return {
        YOUTUBE_CLIENT_ID: "fake-client-id",
        YOUTUBE_CLIENT_SECRET: "fake-client-secret",
        YOUTUBE_REFRESH_TOKEN: "fake-refresh-token",
      };
    },
  };
}

function makeYoutubeHarness({ throwOnInsert = false } = {}) {
  const state = {
    factoryCalls: 0,
    channelCalls: 0,
    insertCalls: 0,
    channelRetryValues: [],
    insertRetryValues: [],
    credentialKeys: [],
  };
  return {
    state,
    factory: async (credentials) => {
      state.factoryCalls += 1;
      state.credentialKeys = Object.keys(credentials).sort();
      return {
        channels: {
          list: async (_request, options) => {
            state.channelCalls += 1;
            state.channelRetryValues.push(options?.retry);
            return {
              data: { items: [{ id: CHANNEL_ID }] },
            };
          },
        },
        videos: {
          insert: async (_request, options) => {
            state.insertCalls += 1;
            state.insertRetryValues.push(options?.retry);
            if (throwOnInsert) {
              throw new Error("fake_insert_timeout");
            }
            return { data: { id: VIDEO_ID } };
          },
        },
      };
    },
  };
}

function armedArgs(fixture, executionFingerprint) {
  return [
    ...fixture.dryArgs,
    "--expected-execution-preflight-fingerprint",
    executionFingerprint,
    "--arm",
  ];
}

function inspectExecutionEvidence(
  fixture,
  expectedTransitions,
) {
  const claimFile = readJsonEvidence(
    fixture.recoveryPaths.claimPath,
  );
  const claimValid =
    validateMoneyShortsPart2YoutubeRecoveryExecutionClaim(
      claimFile.evidence,
    ).valid;
  let previousEvidenceSha256 = claimFile.sha256;
  let previousTransition = null;
  let latestEvent = null;
  let latestEventFileSha256 = null;
  let eventsValid = true;
  for (const transition of expectedTransitions) {
    const path =
      moneyShortsPart2YoutubeRecoveryExecutionEventPath(
        fixture.recoveryPaths.eventDir,
        transition,
      );
    const eventFile = readJsonEvidence(path);
    const validation =
      validateMoneyShortsPart2YoutubeRecoveryExecutionEvent(
        {
          evidence: eventFile.evidence,
          claim: claimFile.evidence,
          previousEvidenceSha256,
          previousTransition,
        },
      );
    eventsValid = eventsValid && validation.valid;
    previousEvidenceSha256 = eventFile.sha256;
    previousTransition = transition;
    latestEvent = eventFile.evidence;
    latestEventFileSha256 = eventFile.sha256;
  }
  const resultFile = readJsonEvidence(
    fixture.recoveryPaths.resultPath,
  );
  const resultValidation =
    validateMoneyShortsPart2YoutubeRecoveryExecutionResult({
      evidence: resultFile.evidence,
      claim: claimFile.evidence,
      latestEvent,
      latestEventFileSha256,
    });
  const canonicalEventFiles = readdirSync(
    fixture.recoveryPaths.eventDir,
  ).filter((name) => /^\d{2}-[a-z_]+\.json$/.test(name));
  return {
    claimValid,
    eventsValid,
    resultValid: resultValidation.valid,
    result: resultFile.evidence,
    canonicalEventFiles,
  };
}

const tempRoot = mkdtempSync(
  join(tmpdir(), "part2-youtube-recovery-execution-check-"),
);
const normalizedTempRoot = tempRoot
  .replaceAll("/", "\\")
  .toLowerCase();
if (
  normalizedTempRoot === "c:\\tmp" ||
  normalizedTempRoot.startsWith("c:\\tmp\\")
) {
  throw new Error("checker_c_tmp_path_forbidden");
}

try {
  const success = createFixture(tempRoot, "success");

  check(
    parseMoneyShortsPart2YoutubeRecoveryExecutionArgs(
      success.dryArgs,
    ).ok === true,
    "exact dry arguments parse",
  );
  check(
    parseMoneyShortsPart2YoutubeRecoveryExecutionArgs([
      ...success.dryArgs,
      "--expected-execution-preflight-fingerprint",
      HASH,
    ]).ok === false &&
      parseMoneyShortsPart2YoutubeRecoveryExecutionArgs([
        ...success.dryArgs,
        "--arm",
      ]).ok === false &&
      parseMoneyShortsPart2YoutubeRecoveryExecutionArgs([
        ...success.dryArgs,
        "--retry",
      ]).ok === false,
    "execution fingerprint and unknown retry syntax fail closed",
  );

  const authReview = makeReviewRunner(success.reviewResult);
  const authEnv = makeEnvHarness();
  const authYoutube = makeYoutubeHarness();
  const wrongApproval = [...success.dryArgs];
  wrongApproval[
    wrongApproval.indexOf("--approval") + 1
  ] = "WRONG_APPROVAL";
  const authResult =
    await runMoneyShortsPart2YoutubeRecoveryExecution({
      argv: wrongApproval,
      reviewRunner: authReview.runner,
      envProvider: authEnv.provider,
      youtubeClientFactory: authYoutube.factory,
      clock: () => FIXED_CLOCK_ISO,
    });
  check(
    authResult.ok === false &&
      authResult.reason ===
        "PART2_YOUTUBE_RECOVERY_EXECUTION_AUTHORIZATION_INVALID" &&
      authReview.state.calls === 0 &&
      authEnv.state.calls === 0 &&
      authYoutube.state.factoryCalls === 0,
    "authorization blocks before review, env, and client factory",
  );

  const dryReview = makeReviewRunner(success.reviewResult);
  const dryEnv = makeEnvHarness();
  const dryYoutube = makeYoutubeHarness();
  const dryLedgerBefore = readFileSync(success.ledgerPath);
  const dryResult =
    await runMoneyShortsPart2YoutubeRecoveryExecution({
      argv: success.dryArgs,
      reviewRunner: dryReview.runner,
      envProvider: dryEnv.provider,
      youtubeClientFactory: dryYoutube.factory,
      clock: () => FIXED_CLOCK_ISO,
    });
  const dryCanonicalFiles = readdirSync(
    success.recoveryPaths.evidenceDir,
  ).filter((name) => name.endsWith(".json"));
  check(
    dryResult.ok === true &&
      dryResult.status ===
        "PART2_YOUTUBE_RECOVERY_EXECUTION_PREFLIGHT_OK" &&
      dryResult.preflightWriteCount === 1 &&
      dryEnv.state.calls === 0 &&
      dryYoutube.state.factoryCalls === 0 &&
      dryReview.state.calls === 1 &&
      readFileSync(success.ledgerPath).equals(
        dryLedgerBefore,
      ),
    "dry-run writes preflight with zero env, network, and ledger mutation",
  );
  check(
    JSON.stringify(dryCanonicalFiles) ===
      JSON.stringify(["execution-preflight.json"]) &&
      !existsSync(success.recoveryPaths.claimPath) &&
      !existsSync(success.recoveryPaths.eventDir) &&
      !existsSync(success.recoveryPaths.resultPath) &&
      !existsSync(success.recoveryPaths.lockPath),
    "dry-run creates exactly one logical preflight and no execution evidence",
  );

  const duplicateDryReview = makeReviewRunner(
    success.reviewResult,
  );
  const duplicateDryEnv = makeEnvHarness();
  const duplicateDryYoutube = makeYoutubeHarness();
  const duplicateDry =
    await runMoneyShortsPart2YoutubeRecoveryExecution({
      argv: success.dryArgs,
      reviewRunner: duplicateDryReview.runner,
      envProvider: duplicateDryEnv.provider,
      youtubeClientFactory: duplicateDryYoutube.factory,
      clock: () => FIXED_CLOCK_ISO,
    });
  check(
    duplicateDry.ok === false &&
      duplicateDry.reason ===
        "PART2_YOUTUBE_RECOVERY_EXECUTION_EVIDENCE_ALREADY_EXISTS" &&
      duplicateDryEnv.state.calls === 0 &&
      duplicateDryYoutube.state.factoryCalls === 0,
    "duplicate dry-run evidence blocks without env or network",
  );

  const successReview = makeReviewRunner(
    success.reviewResult,
  );
  const successEnv = makeEnvHarness();
  const successYoutube = makeYoutubeHarness();
  const successResult =
    await runMoneyShortsPart2YoutubeRecoveryExecution({
      argv: armedArgs(
        success,
        dryResult.executionPreflightFingerprint,
      ),
      reviewRunner: successReview.runner,
      envProvider: successEnv.provider,
      youtubeClientFactory: successYoutube.factory,
      clock: () => FIXED_CLOCK_ISO,
    });
  check(
    successResult.ok === true &&
      successResult.status ===
        "PART2_YOUTUBE_RECOVERY_OK" &&
      successReview.state.calls === 2 &&
      successEnv.state.calls === 1 &&
      successYoutube.state.factoryCalls === 1 &&
      successYoutube.state.channelCalls === 1 &&
      successYoutube.state.insertCalls === 1 &&
      successYoutube.state.channelRetryValues[0] === false &&
      successYoutube.state.insertRetryValues[0] === false,
    "armed execution performs one channel read and one non-retrying insert",
  );
  check(
    JSON.stringify(successYoutube.state.credentialKeys) ===
      JSON.stringify([
        "YOUTUBE_CLIENT_ID",
        "YOUTUBE_CLIENT_SECRET",
        "YOUTUBE_REFRESH_TOKEN",
      ]) &&
      successResult.sideEffectCounters.instagramActionCount === 0 &&
      successResult.sideEffectCounters.blobMutationCount === 0 &&
      successResult.sideEffectCounters.databaseMutationCount === 0,
    "armed client receives only three YouTube keys and forbidden counters stay zero",
  );
  const successLedger = parsePublishLedgerBytesReadOnly(
    readFileSync(success.ledgerPath),
  );
  const successYoutubeRecord = successLedger.ok
    ? successLedger.ledger.records.find(
        (record) => record.key === success.youtubeKey,
      )
    : null;
  check(
    successLedger.ok === true &&
      successYoutubeRecord?.publishedId === VIDEO_ID &&
      successYoutubeRecord?.publishedUrl ===
        `https://www.youtube.com/shorts/${VIDEO_ID}` &&
      successResult.sideEffectCounters.ledgerWriteCount === 1 &&
      successResult.ledgerWriteLockReleased === true,
    "temp ledger CAS append and exact readback succeed",
  );
  const successEvidence = inspectExecutionEvidence(
    success,
    MONEY_SHORTS_PART2_YOUTUBE_RECOVERY_EXECUTION_TRANSITIONS,
  );
  check(
    successEvidence.claimValid &&
      successEvidence.eventsValid &&
      successEvidence.resultValid &&
      successEvidence.result.status ===
        "PART2_YOUTUBE_RECOVERY_OK" &&
      successEvidence.canonicalEventFiles.length === 8 &&
      !existsSync(success.recoveryPaths.lockPath),
    "claim, eight-event chain, result, and lock cleanup validate",
  );

  const duplicateArmReview = makeReviewRunner(
    success.reviewResult,
  );
  const duplicateArmEnv = makeEnvHarness();
  const duplicateArmYoutube = makeYoutubeHarness();
  const duplicateArm =
    await runMoneyShortsPart2YoutubeRecoveryExecution({
      argv: armedArgs(
        success,
        dryResult.executionPreflightFingerprint,
      ),
      reviewRunner: duplicateArmReview.runner,
      envProvider: duplicateArmEnv.provider,
      youtubeClientFactory: duplicateArmYoutube.factory,
      clock: () => FIXED_CLOCK_ISO,
    });
  check(
    duplicateArm.ok === false &&
      duplicateArm.reason ===
        "PART2_YOUTUBE_RECOVERY_EXECUTION_PREFLIGHT_STALE_OR_STARTED" &&
      duplicateArmEnv.state.calls === 0 &&
      duplicateArmYoutube.state.channelCalls === 0 &&
      duplicateArmYoutube.state.insertCalls === 0,
    "duplicate armed execution blocks before env and YouTube",
  );

  const unknown = createFixture(tempRoot, "unknown");
  const unknownDryReview = makeReviewRunner(
    unknown.reviewResult,
  );
  const unknownDry =
    await runMoneyShortsPart2YoutubeRecoveryExecution({
      argv: unknown.dryArgs,
      reviewRunner: unknownDryReview.runner,
      envProvider: () => {
        throw new Error("dry_env_forbidden");
      },
      youtubeClientFactory: async () => {
        throw new Error("dry_client_forbidden");
      },
      clock: () => FIXED_CLOCK_ISO,
    });
  const unknownReview = makeReviewRunner(
    unknown.reviewResult,
  );
  const unknownEnv = makeEnvHarness();
  const unknownYoutube = makeYoutubeHarness({
    throwOnInsert: true,
  });
  const unknownLedgerBefore = readFileSync(
    unknown.ledgerPath,
  );
  const unknownResult =
    await runMoneyShortsPart2YoutubeRecoveryExecution({
      argv: armedArgs(
        unknown,
        unknownDry.executionPreflightFingerprint,
      ),
      reviewRunner: unknownReview.runner,
      envProvider: unknownEnv.provider,
      youtubeClientFactory: unknownYoutube.factory,
      clock: () => FIXED_CLOCK_ISO,
    });
  check(
    unknownResult.ok === false &&
      unknownResult.status ===
        "YOUTUBE_UPLOAD_OUTCOME_UNKNOWN" &&
      unknownResult.resultSaved === true &&
      unknownYoutube.state.channelCalls === 1 &&
      unknownYoutube.state.insertCalls === 1 &&
      unknownYoutube.state.insertRetryValues[0] === false &&
      readFileSync(unknown.ledgerPath).equals(
        unknownLedgerBefore,
      ),
    "insert throw records unknown outcome with no retry or ledger mutation",
  );
  const unknownEvidence = inspectExecutionEvidence(
    unknown,
    MONEY_SHORTS_PART2_YOUTUBE_RECOVERY_EXECUTION_TRANSITIONS.slice(
      0,
      4,
    ),
  );
  check(
    unknownEvidence.claimValid &&
      unknownEvidence.eventsValid &&
      unknownEvidence.resultValid &&
      unknownEvidence.result.status ===
        "YOUTUBE_UPLOAD_OUTCOME_UNKNOWN" &&
      unknownEvidence.canonicalEventFiles.length === 4 &&
      !existsSync(unknown.recoveryPaths.lockPath),
    "unknown result is bound to the latest insert-intent event",
  );

  const drift = createFixture(tempRoot, "drift");
  const driftDryReview = makeReviewRunner(drift.reviewResult);
  const driftDry =
    await runMoneyShortsPart2YoutubeRecoveryExecution({
      argv: drift.dryArgs,
      reviewRunner: driftDryReview.runner,
      envProvider: () => {
        throw new Error("dry_env_forbidden");
      },
      youtubeClientFactory: async () => {
        throw new Error("dry_client_forbidden");
      },
      clock: () => FIXED_CLOCK_ISO,
    });
  const driftReview = makeReviewRunner(
    drift.reviewResult,
    "drift",
  );
  const driftEnv = makeEnvHarness();
  const driftYoutube = makeYoutubeHarness();
  const driftLedgerBefore = readFileSync(drift.ledgerPath);
  const driftResult =
    await runMoneyShortsPart2YoutubeRecoveryExecution({
      argv: armedArgs(
        drift,
        driftDry.executionPreflightFingerprint,
      ),
      reviewRunner: driftReview.runner,
      envProvider: driftEnv.provider,
      youtubeClientFactory: driftYoutube.factory,
      clock: () => FIXED_CLOCK_ISO,
    });
  check(
    driftResult.ok === false &&
      driftResult.blockerCode ===
        "PART2_YOUTUBE_RECOVERY_EXECUTION_EVIDENCE_CHANGED_AFTER_LOCK" &&
      driftReview.state.calls === 2 &&
      driftEnv.state.calls === 0 &&
      driftYoutube.state.factoryCalls === 0 &&
      readFileSync(drift.ledgerPath).equals(
        driftLedgerBefore,
      ) &&
      !existsSync(drift.recoveryPaths.claimPath) &&
      !existsSync(drift.recoveryPaths.lockPath),
    "review drift after lock blocks before env, network, claim, and ledger",
  );
} finally {
  if (tempRoot.startsWith(tmpdir())) {
    rmSync(tempRoot, { recursive: true, force: true });
  }
}

console.log(
  JSON.stringify(
    {
      passed,
      failed,
      realEnvReads: 0,
      realNetworkCalls: 0,
      cTmpAccesses: 0,
      productionLedgerWrites: 0,
    },
    null,
    2,
  ),
);

if (failed > 0) {
  process.exitCode = 1;
}
