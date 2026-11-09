/**
 * One-shot Part 2 YouTube-only recovery.
 *
 * Dry-run writes one execution preflight and performs no credential read,
 * network call, upload, or ledger mutation. Armed execution requires the
 * exact execution-preflight fingerprint. It never calls Instagram/Blob/DB,
 * never touches Part 1, and never retries videos.insert.
 */

import { createHash } from "node:crypto";
import {
  existsSync,
  readFileSync,
  realpathSync,
  statSync,
} from "node:fs";
import {
  basename,
  dirname,
  isAbsolute,
  relative,
  resolve,
} from "node:path";
import { Readable } from "node:stream";
import { fileURLToPath } from "node:url";

import {
  buildPublishLedgerKey,
} from "../lib/publish-ledger-runtime.mjs";
import {
  recordPublishLedgerEntryRuntime,
  writePublishLedgerRuntime,
} from "../lib/publish-ledger-runtime-write.mjs";
import {
  acquireMoneyShortsPart2YoutubeRecoveryExecutionLock,
  buildMoneyShortsPart2YoutubeRecoveryExecutionClaim,
  buildMoneyShortsPart2YoutubeRecoveryExecutionEvent,
  buildMoneyShortsPart2YoutubeRecoveryExecutionPlan,
  buildMoneyShortsPart2YoutubeRecoveryExecutionPreflight,
  buildMoneyShortsPart2YoutubeRecoveryExecutionResult,
  moneyShortsPart2YoutubeRecoveryExecutionEventPath,
  moneyShortsPart2YoutubeRecoveryExecutionPaths,
  releaseMoneyShortsPart2YoutubeRecoveryExecutionLock,
  validateMoneyShortsPart2YoutubeRecoveryExecutionAuthorization,
  validateMoneyShortsPart2YoutubeRecoveryExecutionPreflight,
  writeMoneyShortsPart2YoutubeRecoveryExecutionEvidenceOnce,
  writeMoneyShortsPart2YoutubeRecoveryExecutionPreflight,
  zeroMoneyShortsPart2YoutubeRecoveryExecutionCounters,
} from "../lib/money-shorts-part2-youtube-recovery-execution.mjs";
import {
  parseMoneyShortsPart2YoutubeRecoveryPreflightArgs,
  runMoneyShortsPart2YoutubeRecoveryPreflight,
} from "./run-money-shorts-part2-youtube-recovery-preflight-v1.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const REPO_ROOT = resolve(dirname(SCRIPT_PATH), "..");
const REQUIRED_YOUTUBE_ENV_KEYS = Object.freeze([
  "YOUTUBE_CLIENT_ID",
  "YOUTUBE_CLIENT_SECRET",
  "YOUTUBE_REFRESH_TOKEN",
]);
const CONTROL_VALUE_FLAGS = Object.freeze([
  "--approval",
  "--recovery-out-dir",
  "--expected-review-preflight-fingerprint",
  "--expected-execution-preflight-fingerprint",
]);
const REVIEW_VALUE_FLAGS = Object.freeze([
  "--inspection",
  "--content-unit",
  "--ledger",
  "--original-out-dir",
  "--instagram-recovery-out-dir",
  "--expected-content-id",
  "--expected-manifest-sha256",
  "--expected-source-sha256",
  "--expected-publication-attempt-fingerprint",
  "--expected-instagram-account-id",
  "--expected-instagram-media-id",
  "--expected-youtube-channel-id",
  "--expected-original-safe-result-file-sha256",
  "--expected-original-safe-result-fingerprint",
  "--expected-instagram-recovery-preflight-fingerprint",
  "--expected-instagram-recovery-claim-fingerprint",
  "--expected-instagram-recovery-result-file-sha256",
  "--expected-instagram-recovery-result-fingerprint",
  "--expected-ledger-sha256",
]);
const ALL_VALUE_FLAGS = Object.freeze([
  ...CONTROL_VALUE_FLAGS,
  ...REVIEW_VALUE_FLAGS,
]);
const SHA256_RE = /^[a-f0-9]{64}$/;
const YOUTUBE_VIDEO_ID_RE = /^[A-Za-z0-9_-]{6,30}$/;

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function nowIso() {
  return new Date().toISOString();
}

function isPlainObject(value) {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function sameValue(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function pathInside(rootPath, candidatePath) {
  const rel = relative(
    resolve(rootPath).toLowerCase(),
    resolve(candidatePath).toLowerCase(),
  );
  return (
    rel === "" ||
    (!rel.startsWith("..") && !isAbsolute(rel))
  );
}

function outsideRepoExistingPath(path) {
  try {
    return !pathInside(REPO_ROOT, realpathSync(path));
  } catch {
    return false;
  }
}

function futurePathOutsideRepo(path) {
  let cursor = resolve(path);
  while (!existsSync(cursor)) {
    const parent = dirname(cursor);
    if (parent === cursor) return false;
    cursor = parent;
  }
  return outsideRepoExistingPath(cursor);
}

function readJsonFileEvidence(path) {
  if (!existsSync(path)) {
    return {
      exists: false,
      parseOk: false,
      sha256: null,
      evidence: null,
    };
  }
  try {
    const bytes = readFileSync(path);
    const fileSha256 = sha256(bytes);
    try {
      return {
        exists: true,
        parseOk: true,
        sha256: fileSha256,
        evidence: JSON.parse(bytes.toString("utf8")),
      };
    } catch {
      return {
        exists: true,
        parseOk: false,
        sha256: fileSha256,
        evidence: null,
      };
    }
  } catch {
    return {
      exists: true,
      parseOk: false,
      sha256: null,
      evidence: null,
    };
  }
}

export function parseMoneyShortsPart2YoutubeRecoveryExecutionArgs(
  argv,
) {
  const values = Object.create(null);
  let armed = false;
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--arm") {
      if (armed) {
        return {
          ok: false,
          reason:
            "PART2_YOUTUBE_RECOVERY_EXECUTION_DUPLICATE_ARM_FLAG",
        };
      }
      armed = true;
      continue;
    }
    if (
      !ALL_VALUE_FLAGS.includes(token) ||
      Object.hasOwn(values, token)
    ) {
      return {
        ok: false,
        reason:
          "PART2_YOUTUBE_RECOVERY_EXECUTION_UNKNOWN_OR_DUPLICATE_ARGUMENT",
      };
    }
    const value = argv[index + 1];
    if (
      typeof value !== "string" ||
      value.length === 0 ||
      value.startsWith("--")
    ) {
      return {
        ok: false,
        reason:
          "PART2_YOUTUBE_RECOVERY_EXECUTION_ARGUMENT_VALUE_INVALID",
      };
    }
    values[token] = value;
    index += 1;
  }

  if (
    !ALL_VALUE_FLAGS.filter(
      (flag) =>
        flag !==
        "--expected-execution-preflight-fingerprint",
    ).every((flag) => typeof values[flag] === "string") ||
    !isAbsolute(values["--recovery-out-dir"] ?? "") ||
    (armed
      ? !SHA256_RE.test(
          values[
            "--expected-execution-preflight-fingerprint"
          ] ?? "",
        )
      : values[
          "--expected-execution-preflight-fingerprint"
        ] !== undefined)
  ) {
    return {
      ok: false,
      reason:
        "PART2_YOUTUBE_RECOVERY_EXECUTION_EXACT_ARGUMENTS_REQUIRED",
    };
  }

  const reviewArgv = REVIEW_VALUE_FLAGS.flatMap((flag) => [
    flag,
    values[flag],
  ]);
  const reviewParsed =
    parseMoneyShortsPart2YoutubeRecoveryPreflightArgs(
      reviewArgv,
    );
  if (!reviewParsed.ok) {
    return {
      ok: false,
      reason:
        "PART2_YOUTUBE_RECOVERY_EXECUTION_REVIEW_ARGUMENTS_INVALID",
      detail: reviewParsed.reason,
    };
  }

  const recoveryOutDir = resolve(
    values["--recovery-out-dir"],
  );
  const sourcePaths = [
    reviewParsed.contentUnitPath,
    reviewParsed.ledgerPath,
    reviewParsed.originalOutDir,
    reviewParsed.instagramRecoveryOutDir,
  ].map((path) => resolve(path));
  if (
    pathInside(REPO_ROOT, recoveryOutDir) ||
    sourcePaths.some(
      (path) =>
        pathInside(path, recoveryOutDir) ||
        pathInside(recoveryOutDir, path),
    )
  ) {
    return {
      ok: false,
      reason:
        "PART2_YOUTUBE_RECOVERY_EXECUTION_RECOVERY_PATH_INVALID",
    };
  }

  return {
    ok: true,
    armed,
    approval: values["--approval"],
    inspection: values["--inspection"],
    recoveryOutDir,
    expectedReviewPreflightFingerprint:
      values[
        "--expected-review-preflight-fingerprint"
      ],
    expectedExecutionPreflightFingerprint:
      values[
        "--expected-execution-preflight-fingerprint"
      ] ?? null,
    reviewArgv,
    reviewParsed,
  };
}

function readLedger(path) {
  const file = readJsonFileEvidence(path);
  const records = file.evidence?.records;
  const validRecords =
    Array.isArray(records) &&
    records.every(
      (record) =>
        isPlainObject(record) &&
        typeof record.key === "string" &&
        record.key ===
          `${record.contentId}/${record.platform}/${record.version}` &&
        ["instagram_reels", "youtube_shorts"].includes(
          record.platform,
        ) &&
        typeof record.publishedId === "string" &&
        record.publishedId.length > 0 &&
        record.status === "published",
    ) &&
    new Set(records.map((record) => record.key)).size ===
      records.length;
  if (
    file.exists !== true ||
    file.parseOk !== true ||
    file.evidence?.schemaVersion !== "publish_ledger_v1" ||
    !validRecords
  ) {
    return {
      ok: false,
      reason:
        "PART2_YOUTUBE_RECOVERY_EXECUTION_LEDGER_INVALID",
      file,
    };
  }
  return { ok: true, file, ledger: file.evidence };
}

function readLedgerSnapshot(path, plan) {
  const read = readLedger(path);
  if (!read.ok) return read;
  const contentId = plan.currentBinding.contentId;
  const version = plan.currentBinding.version;
  const instagramKey = buildPublishLedgerKey(
    contentId,
    "instagram_reels",
    version,
  );
  const youtubeKey = buildPublishLedgerKey(
    contentId,
    "youtube_shorts",
    version,
  );
  const instagramRecord =
    read.ledger.records.find(
      (record) => record.key === instagramKey,
    ) ?? null;
  const youtubeRecord =
    read.ledger.records.find(
      (record) => record.key === youtubeKey,
    ) ?? null;
  const instagram = plan.instagramRecovery;
  const valid =
    read.file.sha256 === plan.ledger.sha256 &&
    instagramRecord?.publishedId === instagram.mediaId &&
    instagramRecord?.publishedUrl === instagram.permalink &&
    instagramRecord?.status === "published" &&
    youtubeRecord === null;
  return valid
    ? {
        ok: true,
        file: read.file,
        ledger: read.ledger,
        instagramRecord,
        youtubeRecord,
        instagramKey,
        youtubeKey,
      }
    : {
        ok: false,
        reason:
          "PART2_YOUTUBE_RECOVERY_EXECUTION_LEDGER_BINDING_CHANGED",
        file: read.file,
      };
}

async function loadCurrentExecutionPlan({
  parsed,
  reviewRunner,
}) {
  const review = await reviewRunner({
    argv: parsed.reviewArgv,
  });
  if (review?.ok !== true) {
    return {
      ok: false,
      reason:
        review?.reason ===
        "PART2_YOUTUBE_RECOVERY_PREFLIGHT_INPUT_PATH_UNRESOLVABLE"
          ? "PART2_YOUTUBE_RECOVERY_EXECUTION_INPUT_PATH_UNRESOLVABLE"
          : "PART2_YOUTUBE_RECOVERY_EXECUTION_REVIEW_PREFLIGHT_STALE",
    };
  }
  if (
    review.status !==
      "LOCAL_PART2_YOUTUBE_RECOVERY_PREFLIGHT_OK" ||
    review.readyForActualExecution !== false ||
    review.safeToUpload !== false ||
    review.preflightFingerprint !==
      parsed.expectedReviewPreflightFingerprint ||
    !isPlainObject(review.preflight)
  ) {
    return {
      ok: false,
      reason:
        "PART2_YOUTUBE_RECOVERY_EXECUTION_REVIEW_PREFLIGHT_STALE",
    };
  }
  return buildMoneyShortsPart2YoutubeRecoveryExecutionPlan({
    reviewPreflight: review.preflight,
    expectedReviewPreflightFingerprint:
      parsed.expectedReviewPreflightFingerprint,
  });
}

function executionNotStarted(paths) {
  return (
    !existsSync(paths.claimPath) &&
    !existsSync(paths.resultPath) &&
    !existsSync(paths.eventDir)
  );
}

function publicInstagram(plan) {
  return {
    outcome: "confirmed_published",
    mediaId: plan.instagramRecovery.mediaId,
    permalink: plan.instagramRecovery.permalink,
    publishedAtIso:
      plan.instagramRecovery.publishedAtIso,
    actionCount: 0,
  };
}

function initialYoutube(plan) {
  return {
    status: "not_started",
    outcome: "confirmed_not_published",
    videoId: null,
    url: null,
    channelId: plan.youtube.expectedChannelId,
    publishedAtIso: null,
  };
}

function initialLedger() {
  return {
    writeOk: false,
    readbackOk: false,
    writeLockReleased: null,
    recordedKey: null,
    publishedId: null,
    readbackSha256: null,
  };
}

async function defaultYoutubeClientFactory(credentials) {
  const { google } = await import("googleapis");
  const oauth2 = new google.auth.OAuth2(
    credentials.YOUTUBE_CLIENT_ID,
    credentials.YOUTUBE_CLIENT_SECRET,
    "http://localhost:3000/api/auth/youtube/callback",
  );
  oauth2.setCredentials({
    refresh_token: credentials.YOUTUBE_REFRESH_TOKEN,
  });
  return google.youtube({ version: "v3", auth: oauth2 });
}

async function executeArmed({
  parsed,
  unlockedPlan,
  paths,
  envProvider,
  youtubeClientFactory,
  reviewRunner,
  clock,
}) {
  const counters =
    zeroMoneyShortsPart2YoutubeRecoveryExecutionCounters();
  const lock =
    acquireMoneyShortsPart2YoutubeRecoveryExecutionLock({
      lockPath: paths.lockPath,
    });
  if (!lock.ok) {
    return {
      ok: false,
      status: "BLOCKED",
      blockerCode: lock.reason,
      sideEffectCounters: counters,
    };
  }

  let claim = null;
  let latestEvent = null;
  let latestEvidenceSha256 = null;
  let latestTransition = null;
  let resultWritten = false;
  let youtube = initialYoutube(unlockedPlan);
  let ledger = initialLedger();
  let returnValue = null;

  const appendEvent = (transition) => {
    counters.recoveryEvidenceWriteCount += 1;
    const event =
      buildMoneyShortsPart2YoutubeRecoveryExecutionEvent({
        claim,
        previousEvidenceSha256: latestEvidenceSha256,
        previousTransition: latestTransition,
        transition,
        recordedAtIso: clock(),
        publicState: {
          instagram: publicInstagram(unlockedPlan),
          youtube,
          ledger,
        },
        sideEffectCounters: counters,
      });
    if (!event) throw new Error("event_build_failed");
    const eventPath =
      moneyShortsPart2YoutubeRecoveryExecutionEventPath(
        paths.eventDir,
        transition,
      );
    const written =
      writeMoneyShortsPart2YoutubeRecoveryExecutionEvidenceOnce({
        path: eventPath,
        evidence: event,
        fingerprintField: "eventFingerprint",
      });
    if (!written.ok) throw new Error("event_write_failed");
    latestEvidenceSha256 = written.sha256;
    latestTransition = transition;
    latestEvent = event;
  };

  const finalizeFailure = (blockerCode) => {
    if (!claim || !latestTransition || resultWritten) {
      return {
        ok: false,
        status: "RECOVERY_EVIDENCE_INCOMPLETE",
        blockerCode,
        sideEffectCounters: counters,
      };
    }
    let status = "FAILED_BEFORE_YOUTUBE_INSERT";
    if (counters.youtubeInsertCount === 1) {
      if (latestTransition === "youtube_insert_intent") {
        status = "YOUTUBE_UPLOAD_OUTCOME_UNKNOWN";
        youtube = {
          ...youtube,
          status: "unknown",
          outcome: "unknown",
          videoId: null,
          url: null,
          publishedAtIso: null,
        };
      } else if (
        ledger.writeOk === true &&
        ledger.readbackOk === true
      ) {
        status =
          "YOUTUBE_AND_LEDGER_CONFIRMED_RECOVERY_EVIDENCE_INCOMPLETE";
      } else {
        status = "BOTH_PUBLISHED_LEDGER_MISSING";
      }
    }
    counters.recoveryEvidenceWriteCount += 1;
    const result =
      buildMoneyShortsPart2YoutubeRecoveryExecutionResult({
        claim,
        latestEvent,
        latestEventFileSha256: latestEvidenceSha256,
        latestEventSha256: latestEvidenceSha256,
        latestTransition,
        status,
        blockerCode,
        completedAtIso: clock(),
        publicState: {
          instagram: publicInstagram(unlockedPlan),
          youtube,
          ledger,
        },
        sideEffectCounters: counters,
      });
    if (!result) {
      return {
        ok: false,
        status: "RECOVERY_RESULT_BUILD_FAILED",
        blockerCode,
        sideEffectCounters: counters,
      };
    }
    const written =
      writeMoneyShortsPart2YoutubeRecoveryExecutionEvidenceOnce({
        path: paths.resultPath,
        evidence: result,
        fingerprintField: "resultFingerprint",
      });
    resultWritten = written.ok === true;
    return {
      ok: false,
      status,
      blockerCode,
      resultSaved: resultWritten,
      resultFingerprint: result.resultFingerprint,
      sideEffectCounters: counters,
    };
  };

  try {
    const lockedPlanResult = await loadCurrentExecutionPlan({
      parsed,
      reviewRunner,
    });
    if (
      !lockedPlanResult.ok ||
      !sameValue(lockedPlanResult.plan, unlockedPlan) ||
      !executionNotStarted(paths)
    ) {
      returnValue = {
        ok: false,
        status: "BLOCKED",
        blockerCode:
          "PART2_YOUTUBE_RECOVERY_EXECUTION_EVIDENCE_CHANGED_AFTER_LOCK",
        sideEffectCounters: counters,
      };
      return returnValue;
    }
    const lockedPlan = lockedPlanResult.plan;
    const preflightFile = readJsonFileEvidence(
      paths.preflightPath,
    );
    const preflightValidation =
      validateMoneyShortsPart2YoutubeRecoveryExecutionPreflight({
        evidence: preflightFile.evidence,
        currentPlan: lockedPlan,
        expectedPreflightFingerprint:
          parsed.expectedExecutionPreflightFingerprint,
      });
    if (
      preflightFile.parseOk !== true ||
      preflightValidation.valid !== true
    ) {
      returnValue = {
        ok: false,
        status: "BLOCKED",
        blockerCode:
          "PART2_YOUTUBE_RECOVERY_EXECUTION_PREFLIGHT_STALE_AFTER_LOCK",
        sideEffectCounters: counters,
      };
      return returnValue;
    }

    if (
      !outsideRepoExistingPath(
        lockedPlan.youtube.sourcePath,
      ) ||
      !outsideRepoExistingPath(
        parsed.reviewParsed.ledgerPath,
      )
    ) {
      returnValue = {
        ok: false,
        status: "BLOCKED",
        blockerCode:
          "PART2_YOUTUBE_RECOVERY_EXECUTION_REAL_PATH_INVALID",
        sideEffectCounters: counters,
      };
      return returnValue;
    }
    const sourceBytes = readFileSync(
      lockedPlan.youtube.sourcePath,
    );
    if (
      sha256(sourceBytes) !==
        lockedPlan.youtube.sourceSha256 ||
      statSync(lockedPlan.youtube.sourcePath).size !==
        lockedPlan.youtube.sourceSizeBytes
    ) {
      returnValue = {
        ok: false,
        status: "BLOCKED",
        blockerCode:
          "PART2_YOUTUBE_RECOVERY_EXECUTION_SOURCE_CHANGED_AFTER_LOCK",
        sideEffectCounters: counters,
      };
      return returnValue;
    }
    const ledgerBeforeCredentials = readLedgerSnapshot(
      parsed.reviewParsed.ledgerPath,
      lockedPlan,
    );
    if (!ledgerBeforeCredentials.ok) {
      returnValue = {
        ok: false,
        status: "BLOCKED",
        blockerCode:
          "PART2_YOUTUBE_RECOVERY_EXECUTION_LEDGER_CHANGED_AFTER_LOCK",
        sideEffectCounters: counters,
      };
      return returnValue;
    }

    const runtimeEnv = envProvider();
    const credentialPresence = Object.create(null);
    const credentials = Object.create(null);
    for (const name of REQUIRED_YOUTUBE_ENV_KEYS) {
      counters.credentialReadCount += 1;
      const value = runtimeEnv?.[name];
      credentialPresence[name] =
        typeof value === "string" && value.length > 0;
      if (credentialPresence[name]) credentials[name] = value;
    }
    if (
      !REQUIRED_YOUTUBE_ENV_KEYS.every(
        (name) => credentialPresence[name] === true,
      )
    ) {
      for (const name of REQUIRED_YOUTUBE_ENV_KEYS) {
        delete credentials[name];
      }
      returnValue = {
        ok: false,
        status: "BLOCKED",
        blockerCode:
          "PART2_YOUTUBE_RECOVERY_EXECUTION_CREDENTIALS_MISSING",
        credentialPresence,
        sideEffectCounters: counters,
      };
      return returnValue;
    }

    claim =
      buildMoneyShortsPart2YoutubeRecoveryExecutionClaim({
        plan: lockedPlan,
        executionPreflightFingerprint:
          parsed.expectedExecutionPreflightFingerprint,
        claimedAtIso: clock(),
      });
    if (!claim) throw new Error("claim_build_failed");
    const claimWrite =
      writeMoneyShortsPart2YoutubeRecoveryExecutionEvidenceOnce({
        path: paths.claimPath,
        evidence: claim,
        fingerprintField: "claimFingerprint",
      });
    if (!claimWrite.ok) throw new Error("claim_write_failed");
    counters.recoveryEvidenceWriteCount = 1;
    latestEvidenceSha256 = claimWrite.sha256;
    appendEvent("external_execution_ready");

    const youtubeClient = await youtubeClientFactory(
      credentials,
    );
    for (const name of REQUIRED_YOUTUBE_ENV_KEYS) {
      delete credentials[name];
    }

    youtube = { ...youtube, status: "checking" };
    appendEvent("youtube_channel_verify_intent");
    counters.youtubeChannelVerificationCount += 1;
    counters.youtubeApiInvocationCount += 1;
    const channelResponse =
      await youtubeClient.channels.list(
        {
          part: ["id"],
          mine: true,
          maxResults: 50,
        },
        { retry: false },
      );
    const channelIds = Array.isArray(
      channelResponse?.data?.items,
    )
      ? [
          ...new Set(
            channelResponse.data.items
              .map((item) => item?.id)
              .filter(
                (id) =>
                  typeof id === "string" &&
                  id.length > 0,
              ),
          ),
        ]
      : [];
    if (
      channelIds.length !== 1 ||
      channelIds[0] !==
        lockedPlan.youtube.expectedChannelId
    ) {
      returnValue = finalizeFailure(
        "PART2_YOUTUBE_RECOVERY_EXECUTION_CHANNEL_MISMATCH",
      );
      return returnValue;
    }
    appendEvent("youtube_channel_verify_confirmed");

    const beforeInsert = readLedgerSnapshot(
      parsed.reviewParsed.ledgerPath,
      lockedPlan,
    );
    if (!beforeInsert.ok) {
      returnValue = finalizeFailure(
        "PART2_YOUTUBE_RECOVERY_EXECUTION_LEDGER_CHANGED_BEFORE_INSERT",
      );
      return returnValue;
    }

    youtube = { ...youtube, status: "uploading" };
    appendEvent("youtube_insert_intent");
    counters.youtubeInsertCount += 1;
    counters.youtubeApiInvocationCount += 1;
    const metadata = lockedPlan.youtube.metadata;
    let uploadResponse;
    try {
      uploadResponse = await youtubeClient.videos.insert(
        {
          part: ["snippet", "status"],
          requestBody: {
            snippet: {
              title: metadata.titleWithShortsSuffix,
              description: metadata.descriptionBase,
              tags: metadata.tags,
              categoryId: metadata.categoryId,
              defaultLanguage: metadata.defaultLanguage,
            },
            status: {
              privacyStatus: metadata.privacyStatus,
              selfDeclaredMadeForKids:
                metadata.selfDeclaredMadeForKids,
              containsSyntheticMedia:
                metadata.containsSyntheticMedia,
            },
          },
          media: {
            mimeType: "video/mp4",
            body: Readable.from([sourceBytes]),
          },
        },
        { retry: false },
      );
    } catch {
      returnValue = finalizeFailure(
        "PART2_YOUTUBE_RECOVERY_EXECUTION_INSERT_OUTCOME_UNKNOWN",
      );
      return returnValue;
    }
    const videoId = uploadResponse?.data?.id;
    if (
      typeof videoId !== "string" ||
      !YOUTUBE_VIDEO_ID_RE.test(videoId)
    ) {
      returnValue = finalizeFailure(
        "PART2_YOUTUBE_RECOVERY_EXECUTION_INSERT_NO_VALID_ID",
      );
      return returnValue;
    }
    const publishedAtIso = clock();
    youtube = {
      status: "uploaded",
      outcome: "confirmed_published",
      videoId,
      url: `https://www.youtube.com/shorts/${videoId}`,
      channelId: lockedPlan.youtube.expectedChannelId,
      publishedAtIso,
    };
    appendEvent("youtube_insert_confirmed");

    const beforeLedger = readLedgerSnapshot(
      parsed.reviewParsed.ledgerPath,
      lockedPlan,
    );
    if (!beforeLedger.ok) {
      returnValue = finalizeFailure(
        "PART2_YOUTUBE_RECOVERY_EXECUTION_LEDGER_CHANGED_BEFORE_WRITE",
      );
      return returnValue;
    }
    const recordedKey =
      lockedPlan.ledger.expectedYoutubeKey;
    const recordResult = recordPublishLedgerEntryRuntime(
      beforeLedger.ledger,
      {
        key: recordedKey,
        contentId: lockedPlan.currentBinding.contentId,
        platform: "youtube_shorts",
        version: lockedPlan.currentBinding.version,
        variantId: lockedPlan.youtube.variantId,
        publishedId: videoId,
        publishedUrl:
          `https://www.youtube.com/shorts/${videoId}`,
        status: "published",
        publishedAtIso,
        metadata: {
          sourceFileName: basename(
            lockedPlan.youtube.sourcePath,
          ),
          sourceSha256: lockedPlan.youtube.sourceSha256,
          channelId: lockedPlan.youtube.expectedChannelId,
          sourceReviewPreflightFingerprint:
            lockedPlan.sourceReviewPreflightFingerprint,
          executionPlanFingerprint:
            lockedPlan.planFingerprint,
          executionClaimFingerprint:
            claim.claimFingerprint,
        },
      },
    );
    if (!recordResult.ok) {
      returnValue = finalizeFailure(
        "PART2_YOUTUBE_RECOVERY_EXECUTION_LEDGER_RECORD_REFUSED",
      );
      return returnValue;
    }

    appendEvent("ledger_write_intent");
    counters.ledgerWriteCount += 1;
    const ledgerWrite = writePublishLedgerRuntime(
      parsed.reviewParsed.ledgerPath,
      recordResult.ledger,
      {
        expectedCurrentSha256: beforeLedger.file.sha256,
      },
    );
    if (ledgerWrite.committed !== true) {
      ledger = {
        ...ledger,
        writeLockReleased:
          ledgerWrite.lockReleased === true,
      };
      returnValue = finalizeFailure(
        "PART2_YOUTUBE_RECOVERY_EXECUTION_LEDGER_WRITE_FAILED",
      );
      return returnValue;
    }

    const readback = readLedger(
      parsed.reviewParsed.ledgerPath,
    );
    const readbackRecord = readback.ok
      ? readback.ledger.records.find(
          (record) => record.key === recordedKey,
        ) ?? null
      : null;
    if (
      !readback.ok ||
      readbackRecord?.publishedId !== videoId ||
      readbackRecord?.publishedUrl !==
        `https://www.youtube.com/shorts/${videoId}`
    ) {
      ledger = {
        ...ledger,
        writeLockReleased:
          ledgerWrite.lockReleased === true,
      };
      returnValue = finalizeFailure(
        "PART2_YOUTUBE_RECOVERY_EXECUTION_LEDGER_READBACK_FAILED",
      );
      return returnValue;
    }
    ledger = {
      writeOk: true,
      readbackOk: true,
      writeLockReleased:
        ledgerWrite.lockReleased === true,
      recordedKey,
      publishedId: videoId,
      readbackSha256: readback.file.sha256,
    };
    appendEvent("ledger_write_confirmed");
    appendEvent("complete");

    counters.recoveryEvidenceWriteCount += 1;
    const result =
      buildMoneyShortsPart2YoutubeRecoveryExecutionResult({
        claim,
        latestEvent,
        latestEventFileSha256: latestEvidenceSha256,
        latestEventSha256: latestEvidenceSha256,
        latestTransition,
        status: "PART2_YOUTUBE_RECOVERY_OK",
        blockerCode: null,
        completedAtIso: clock(),
        publicState: {
          instagram: publicInstagram(lockedPlan),
          youtube,
          ledger,
        },
        sideEffectCounters: counters,
      });
    if (!result) {
      returnValue = finalizeFailure(
        "PART2_YOUTUBE_RECOVERY_EXECUTION_RESULT_BUILD_FAILED",
      );
      return returnValue;
    }
    const resultWrite =
      writeMoneyShortsPart2YoutubeRecoveryExecutionEvidenceOnce({
        path: paths.resultPath,
        evidence: result,
        fingerprintField: "resultFingerprint",
      });
    resultWritten = resultWrite.ok === true;
    if (!resultWritten) {
      returnValue = {
        ok: false,
        status:
          "YOUTUBE_AND_LEDGER_CONFIRMED_RECOVERY_EVIDENCE_INCOMPLETE",
        blockerCode:
          "PART2_YOUTUBE_RECOVERY_EXECUTION_RESULT_WRITE_FAILED",
        sideEffectCounters: counters,
      };
      return returnValue;
    }
    returnValue = {
      ok: true,
      status: "PART2_YOUTUBE_RECOVERY_OK",
      youtubeVideoId: videoId,
      youtubeUrl:
        `https://www.youtube.com/shorts/${videoId}`,
      ledgerRecordedKey: recordedKey,
      ledgerWriteLockReleased:
        ledger.writeLockReleased,
      resultFingerprint: result.resultFingerprint,
      sideEffectCounters: counters,
    };
    return returnValue;
  } catch {
    returnValue = finalizeFailure(
      "PART2_YOUTUBE_RECOVERY_EXECUTION_ARMED_FAILED",
    );
    return returnValue;
  } finally {
    const release =
      releaseMoneyShortsPart2YoutubeRecoveryExecutionLock({
        lock,
      });
    if (!release.ok && returnValue) {
      returnValue.ok = false;
      returnValue.lockCleanupFailed = true;
    }
  }
}

export async function runMoneyShortsPart2YoutubeRecoveryExecution({
  argv,
  envProvider = () => process.env,
  youtubeClientFactory = defaultYoutubeClientFactory,
  reviewRunner =
    runMoneyShortsPart2YoutubeRecoveryPreflight,
  clock = nowIso,
}) {
  const parsed =
    parseMoneyShortsPart2YoutubeRecoveryExecutionArgs(argv);
  if (!parsed.ok) return parsed;

  // Pure authorization must precede every filesystem/env/network action.
  const authorization =
    validateMoneyShortsPart2YoutubeRecoveryExecutionAuthorization({
      armed: parsed.armed,
      approval: parsed.approval,
      inspection: parsed.inspection,
      expectedReviewPreflightFingerprint:
        parsed.expectedReviewPreflightFingerprint,
      expectedExecutionPreflightFingerprint:
        parsed.expectedExecutionPreflightFingerprint,
    });
  if (!authorization.ok) return authorization;

  if (!futurePathOutsideRepo(parsed.recoveryOutDir)) {
    return {
      ok: false,
      reason:
        "PART2_YOUTUBE_RECOVERY_EXECUTION_RECOVERY_PATH_UNRESOLVABLE",
    };
  }
  const planResult = await loadCurrentExecutionPlan({
    parsed,
    reviewRunner,
  });
  if (!planResult.ok) return planResult;
  const plan = planResult.plan;
  const paths =
    moneyShortsPart2YoutubeRecoveryExecutionPaths(
      parsed.recoveryOutDir,
    );

  if (!parsed.armed) {
    if (
      existsSync(paths.evidenceDir) ||
      existsSync(paths.lockPath)
    ) {
      return {
        ok: false,
        reason:
          "PART2_YOUTUBE_RECOVERY_EXECUTION_EVIDENCE_ALREADY_EXISTS",
      };
    }
    const preflight =
      buildMoneyShortsPart2YoutubeRecoveryExecutionPreflight({
        plan,
        boundAtIso: clock(),
      });
    if (!preflight) {
      return {
        ok: false,
        reason:
          "PART2_YOUTUBE_RECOVERY_EXECUTION_PREFLIGHT_BUILD_FAILED",
      };
    }
    const written =
      writeMoneyShortsPart2YoutubeRecoveryExecutionPreflight({
        path: paths.preflightPath,
        evidence: preflight,
      });
    if (!written.ok) {
      return {
        ok: false,
        reason: written.reason,
        preflightPath: paths.preflightPath,
      };
    }
    return {
      ok: true,
      status:
        "PART2_YOUTUBE_RECOVERY_EXECUTION_PREFLIGHT_OK",
      armed: false,
      contentId: plan.currentBinding.contentId,
      productionPartId: "part-2",
      expectedYoutubeChannelId:
        plan.youtube.expectedChannelId,
      sourceReviewPreflightFingerprint:
        plan.sourceReviewPreflightFingerprint,
      planFingerprint: plan.planFingerprint,
      executionPreflightFingerprint:
        preflight.preflightFingerprint,
      preflightPath: paths.preflightPath,
      preflightWriteCount: 1,
      sideEffectCounters: preflight.sideEffectCounters,
      noLiveActions: true,
    };
  }

  const preflightFile = readJsonFileEvidence(
    paths.preflightPath,
  );
  const validation =
    validateMoneyShortsPart2YoutubeRecoveryExecutionPreflight({
      evidence: preflightFile.evidence,
      currentPlan: plan,
      expectedPreflightFingerprint:
        authorization.expectedExecutionPreflightFingerprint,
    });
  if (
    preflightFile.parseOk !== true ||
    validation.valid !== true ||
    !executionNotStarted(paths)
  ) {
    return {
      ok: false,
      reason:
        "PART2_YOUTUBE_RECOVERY_EXECUTION_PREFLIGHT_STALE_OR_STARTED",
    };
  }

  return executeArmed({
    parsed,
    unlockedPlan: plan,
    paths,
    envProvider,
    youtubeClientFactory,
    reviewRunner,
    clock,
  });
}

async function main() {
  const result =
    await runMoneyShortsPart2YoutubeRecoveryExecution({
      argv: process.argv.slice(2),
    });
  console.log(JSON.stringify(result, null, 2));
  process.exitCode = result.ok === true ? 0 : 1;
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === resolve(SCRIPT_PATH)
) {
  await main();
}
