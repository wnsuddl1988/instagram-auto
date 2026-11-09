#!/usr/bin/env node
/**
 * Dedicated one-shot part-2 dual-platform publish runner.
 *
 * Dry-run is the default and never reads credentials or calls a network.
 * Armed execution requires the exact safe preflight fingerprint and verifies
 * the expected Instagram account and YouTube channel before the first Blob,
 * Instagram, or YouTube mutation. It never touches part-1.
 */

import { createHash } from "node:crypto";
import {
  existsSync,
  readdirSync,
  readFileSync,
  realpathSync,
  renameSync,
  statSync,
} from "node:fs";
import {
  basename,
  dirname,
  isAbsolute,
  join,
  relative,
  resolve,
} from "node:path";
import { Readable } from "node:stream";
import { fileURLToPath } from "node:url";

import {
  MONEY_SHORTS_PUBLISH_ATTEMPT_CLAIM_FILENAME,
  MONEY_SHORTS_PUBLISH_ATTEMPT_JOURNAL_DIRNAME,
  appendMoneyShortsPublishAttemptJournal,
  claimMoneyShortsPublishAttempt,
  fingerprintMoneyShortsPublishAttemptBinding,
} from "../lib/money-shorts-publish-attempt-journal.mjs";
import {
  validateMoneyShortsFinalVideoOwnerApprovalEvidence,
  validateMoneyShortsPublishPreflightBinding,
} from "../lib/money-shorts-final-video-owner-approval.mjs";
import {
  MONEY_SHORTS_PART2_DUAL_PUBLISH_SAFE_APPROVAL,
  acquireMoneyShortsPart2DualPublishSafeLock,
  buildMoneyShortsPart2DualPublishSafeClaim,
  buildMoneyShortsPart2DualPublishSafeEvent,
  buildMoneyShortsPart2DualPublishSafePlan,
  buildMoneyShortsPart2DualPublishSafePreflight,
  buildMoneyShortsPart2DualPublishSafeResult,
  moneyShortsPart2DualPublishSafeEventPath,
  moneyShortsPart2DualPublishSafePaths,
  releaseMoneyShortsPart2DualPublishSafeLock,
  validateMoneyShortsPart2DualPublishSafeAuthorization,
  validateMoneyShortsPart2DualPublishSafePreflight,
  writeMoneyShortsPart2DualPublishSafeEvidenceOnce,
  zeroMoneyShortsPart2DualPublishSafeCounters,
} from "../lib/money-shorts-part2-dual-publish-safe.mjs";
import {
  buildPublishLedgerKey,
  parsePublishLedgerBytesReadOnly,
} from "../lib/publish-ledger-runtime.mjs";
import {
  recordDualPlatformPublishRuntime,
  serializePublishLedgerRuntime,
  writePublishLedgerRuntime,
} from "../lib/publish-ledger-runtime-write.mjs";
import {
  buildDualPlatformPublishPlan,
} from "./run-dual-platform-final-publish-orchestrator.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const REPO_ROOT = resolve(dirname(SCRIPT_PATH), "..");
const CANONICAL_RESULT_FILENAME =
  "final-e2e-publish-result.json";
const GENERIC_PART2_HANDOFF_ARCHIVE_FILENAME =
  "final-e2e-publish-result.part2-safe-runner-required.handoff.json";
const GENERIC_PREFLIGHT_FILENAME =
  "final-e2e-publish-preflight.json";
const CANONICAL_RESULT_SCHEMA =
  "final_e2e_dual_platform_publish_result_v1";
const INSTAGRAM_VARIANT_ID =
  "instagram_reels_full_frame_1080x1920";
const YOUTUBE_VARIANT_ID =
  "youtube_shorts_letterbox_1080x1920";
const GRAPH_API_BASE =
  "https://graph.facebook.com/v25.0";
const BLOB_PATH_PREFIX = "instagram/reels";
const REQUIRED_ENV_KEYS = Object.freeze([
  "INSTAGRAM_BUSINESS_ACCOUNT_ID",
  "INSTAGRAM_ACCESS_TOKEN",
  "YOUTUBE_CLIENT_ID",
  "YOUTUBE_CLIENT_SECRET",
  "YOUTUBE_REFRESH_TOKEN",
  "BLOB_READ_WRITE_TOKEN",
]);
const VALUE_FLAGS = Object.freeze([
  "--approval",
  "--content-unit",
  "--ledger",
  "--out-dir",
  "--expected-content-id",
  "--expected-manifest-sha256",
  "--expected-source-sha256",
  "--expected-publication-attempt-fingerprint",
  "--expected-instagram-account-id",
  "--expected-youtube-channel-id",
  "--expected-preflight-fingerprint",
]);
const SHA256_RE = /^[a-f0-9]{64}$/;
const INSTAGRAM_PUBLIC_ID_RE = /^[1-9][0-9]{5,39}$/;
const YOUTUBE_VIDEO_ID_RE = /^[A-Za-z0-9_-]{6,30}$/;
const GRAPH_ERROR_TYPE_ALLOWLIST = new Set([
  "FacebookApiException",
  "GraphMethodException",
  "IGApiException",
  "OAuthException",
]);

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

function safeGraphErrorInteger(value) {
  return Number.isSafeInteger(value) && value >= 0
    ? value
    : null;
}

function safeGraphErrorType(value) {
  return typeof value === "string" &&
    GRAPH_ERROR_TYPE_ALLOWLIST.has(value)
    ? value
    : null;
}

function normalizeInstagramContainerCreateDiagnostic(value) {
  if (!isPlainObject(value)) return null;
  const providerError = isPlainObject(value.providerError)
    ? value.providerError
    : {};
  return {
    responseReceived: value.responseReceived === true,
    httpStatus:
      Number.isSafeInteger(value.httpStatus) &&
      value.httpStatus >= 100 &&
      value.httpStatus <= 599
        ? value.httpStatus
        : null,
    responseOk:
      typeof value.responseOk === "boolean"
        ? value.responseOk
        : null,
    jsonParsed: value.jsonParsed === true,
    containerIdPresent:
      value.containerIdPresent === true,
    providerError: {
      code: safeGraphErrorInteger(providerError.code),
      errorSubcode: safeGraphErrorInteger(
        providerError.errorSubcode,
      ),
      type: safeGraphErrorType(providerError.type),
      isTransient:
        typeof providerError.isTransient === "boolean"
          ? providerError.isTransient
          : null,
    },
  };
}

export async function createMoneyShortsInstagramContainerOnce({
  accountId,
  accessToken,
  videoUrl,
  caption,
  shareToFeed,
  fetchImpl = fetch,
}) {
  const body = new URLSearchParams({
    media_type: "REELS",
    video_url: videoUrl,
    caption,
    share_to_feed: shareToFeed ? "true" : "false",
  });
  const response = await fetchImpl(
    `${GRAPH_API_BASE}/${encodeURIComponent(accountId)}/media`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
      redirect: "error",
      signal: AbortSignal.timeout(30_000),
    },
  );
  let data = null;
  let jsonParsed = false;
  try {
    data = await response.json();
    jsonParsed = true;
  } catch {
    // A received non-JSON response is diagnostic evidence, not a retry signal.
  }
  const rawContainerId =
    jsonParsed && typeof data?.id === "string"
      ? data.id
      : null;
  const containerId =
    rawContainerId &&
    INSTAGRAM_PUBLIC_ID_RE.test(rawContainerId)
      ? rawContainerId
      : null;
  const rawProviderError =
    jsonParsed && isPlainObject(data?.error)
      ? data.error
      : {};
  const diagnostic =
    normalizeInstagramContainerCreateDiagnostic({
      responseReceived: true,
      httpStatus: response?.status,
      responseOk: response?.ok === true,
      jsonParsed,
      containerIdPresent:
        typeof rawContainerId === "string" &&
        rawContainerId.length > 0,
      providerError: {
        code: rawProviderError.code,
        errorSubcode: rawProviderError.error_subcode,
        type: rawProviderError.type,
        isTransient: rawProviderError.is_transient,
      },
    });
  return {
    ok: response?.ok === true && containerId !== null,
    containerId,
    diagnostic,
  };
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

function readJsonEvidence(path) {
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
    return {
      exists: true,
      parseOk: true,
      sha256: sha256(bytes),
      evidence: JSON.parse(bytes.toString("utf8")),
    };
  } catch {
    return {
      exists: true,
      parseOk: false,
      sha256: null,
      evidence: null,
    };
  }
}

function publishMetadataSha256(unit) {
  return sha256(
    JSON.stringify({
      discoveryMetadataContractVersion:
        unit.discoveryMetadataContractVersion,
      discoveryMetadataGate: unit.discoveryMetadataGate,
      instagramMetadata: unit.instagramMetadata,
      youtubeMetadata: unit.youtubeMetadata,
    }),
  );
}

export function readLedgerSnapshot(
  path,
  contentId,
  version,
  readBytes = readFileSync,
) {
  if (!existsSync(path)) {
    return {
      ok: false,
      reason: "PART2_DUAL_SAFE_LEDGER_INVALID_OR_MISSING",
    };
  }
  let bytes;
  try {
    bytes = readBytes(path);
  } catch {
    return {
      ok: false,
      reason: "PART2_DUAL_SAFE_LEDGER_READ_FAILED",
    };
  }
  const read = parsePublishLedgerBytesReadOnly(bytes);
  if (read.ok !== true || read.existed !== true) {
    return {
      ok: false,
      reason: "PART2_DUAL_SAFE_LEDGER_INVALID_OR_MISSING",
    };
  }
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
  return {
    ok: true,
    ledger: read.ledger,
    sha256: sha256(bytes),
    instagramKey,
    youtubeKey,
    instagramRecord,
    youtubeRecord,
    clean:
      instagramRecord === null && youtubeRecord === null,
  };
}

export function parseMoneyShortsPart2DualPublishSafeArgs(argv) {
  const values = Object.create(null);
  let armed = false;
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--arm") {
      if (armed) {
        return {
          ok: false,
          reason: "PART2_DUAL_SAFE_DUPLICATE_ARM_FLAG",
        };
      }
      armed = true;
      continue;
    }
    if (
      !VALUE_FLAGS.includes(token) ||
      Object.hasOwn(values, token)
    ) {
      return {
        ok: false,
        reason:
          "PART2_DUAL_SAFE_UNKNOWN_OR_DUPLICATE_ARGUMENT",
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
        reason: "PART2_DUAL_SAFE_ARGUMENT_VALUE_INVALID",
      };
    }
    values[token] = value;
    index += 1;
  }
  return {
    ok: true,
    armed,
    approval: values["--approval"] ?? null,
    contentUnitPath: values["--content-unit"] ?? null,
    ledgerPath: values["--ledger"] ?? null,
    outDir: values["--out-dir"] ?? null,
    expectedContentId:
      values["--expected-content-id"] ?? null,
    expectedManifestSha256:
      values["--expected-manifest-sha256"] ?? null,
    expectedSourceSha256:
      values["--expected-source-sha256"] ?? null,
    expectedPublicationAttemptFingerprint:
      values[
        "--expected-publication-attempt-fingerprint"
      ] ?? null,
    expectedInstagramAccountId:
      values["--expected-instagram-account-id"] ?? null,
    expectedYoutubeChannelId:
      values["--expected-youtube-channel-id"] ?? null,
    expectedPreflightFingerprint:
      values["--expected-preflight-fingerprint"] ?? null,
  };
}

function resolveInputPaths(parsed) {
  if (
    !parsed.contentUnitPath ||
    !parsed.ledgerPath ||
    !parsed.outDir ||
    !isAbsolute(parsed.contentUnitPath) ||
    !isAbsolute(parsed.ledgerPath) ||
    !isAbsolute(parsed.outDir)
  ) {
    return {
      ok: false,
      reason: "PART2_DUAL_SAFE_ABSOLUTE_PATHS_REQUIRED",
    };
  }
  return {
    ok: true,
    paths: {
      contentUnitPath: resolve(parsed.contentUnitPath),
      ledgerPath: resolve(parsed.ledgerPath),
      outDir: resolve(parsed.outDir),
    },
  };
}

function inspectCurrentContext({ paths, authorization }) {
  try {
    if (
      !outsideRepoExistingPath(paths.contentUnitPath) ||
      !outsideRepoExistingPath(paths.ledgerPath) ||
      !outsideRepoExistingPath(paths.outDir) ||
      !statSync(paths.outDir).isDirectory()
    ) {
      return {
        ok: false,
        reason: "PART2_DUAL_SAFE_REAL_PATH_INVALID",
      };
    }
    const manifestFile =
      readJsonEvidence(paths.contentUnitPath);
    const unit = manifestFile.evidence;
    if (
      manifestFile.parseOk !== true ||
      !isPlainObject(unit) ||
      unit.schemaVersion !==
        "dual_platform_content_unit_v1" ||
      unit.wizardProductionPartId !== "part-2" ||
      unit.sourceIntegrity?.productionPartId !== "part-2" ||
      unit.series?.totalParts !== 2 ||
      unit.series?.partNumber !== 2 ||
      unit.contentId !== authorization.expectedContentId ||
      unit.version?.length < 1 ||
      manifestFile.sha256 !==
        authorization.expectedManifestSha256
    ) {
      return {
        ok: false,
        reason: "PART2_DUAL_SAFE_CONTENT_UNIT_NOT_EXACT_PART2",
      };
    }

    const instagramSourcePath = resolve(
      String(unit.instagramSourcePath ?? ""),
    );
    const youtubeSourcePath = resolve(
      String(unit.youtubeSourcePath ?? ""),
    );
    if (
      !outsideRepoExistingPath(instagramSourcePath) ||
      !outsideRepoExistingPath(youtubeSourcePath)
    ) {
      return {
        ok: false,
        reason: "PART2_DUAL_SAFE_SOURCE_PATH_INVALID",
      };
    }
    const instagramSourceBytes =
      readFileSync(instagramSourcePath);
    const youtubeSourceBytes =
      readFileSync(youtubeSourcePath);
    const instagramSourceSha256 =
      sha256(instagramSourceBytes);
    const youtubeSourceSha256 =
      sha256(youtubeSourceBytes);
    const instagramSourceSize =
      statSync(instagramSourcePath).size;
    const youtubeSourceSize =
      statSync(youtubeSourcePath).size;
    const metadataSha256 = publishMetadataSha256(unit);
    const sourceIntegrity = unit.sourceIntegrity ?? {};

    const ownerApproval =
      validateMoneyShortsFinalVideoOwnerApprovalEvidence({
        evidence: unit.ownerFinalVideoApproval,
        topicId: unit.wizardTopicId,
        expectedPartIds: ["part-1", "part-2"],
        currentPart: {
          partId: "part-2",
          wizardScriptFingerprint:
            sourceIntegrity.wizardScriptFingerprint,
          audioSha256: sourceIntegrity.audioSha256,
          imageSetSha256: sourceIntegrity.imageSetSha256,
          finalMp4Sha256: instagramSourceSha256,
          publishMetadataSha256: metadataSha256,
          durationSec: sourceIntegrity.durationSec,
          sizeBytes: sourceIntegrity.sizeBytes,
        },
      });
    const publishPlan = buildDualPlatformPublishPlan(unit);
    const instagramJob = publishPlan.jobs.find(
      (job) => job.id === "instagram_job",
    );
    const youtubeJob = publishPlan.jobs.find(
      (job) => job.id === "youtube_job",
    );
    const artifactChecks = {
      expectedSource:
        instagramSourceSha256 ===
        authorization.expectedSourceSha256,
      sourceHashesMatch:
        youtubeSourceSha256 === instagramSourceSha256,
      sourceSizesMatch:
        instagramSourceSize === youtubeSourceSize,
      declaredSizeMatches:
        sourceIntegrity.sizeBytes === instagramSourceSize,
      declaredSourceMatches:
        sourceIntegrity.finalMp4Sha256 ===
        instagramSourceSha256,
      metadataMatches:
        sourceIntegrity.publishMetadataSha256 ===
        metadataSha256,
      topicMatches:
        sourceIntegrity.rootTopicId === unit.wizardTopicId,
      ownerApprovalAccepted:
        ownerApproval.accepted === true,
      ownerApprovalFingerprintMatches:
        ownerApproval.finalVideoApprovalFingerprint ===
        sourceIntegrity.finalVideoApprovalFingerprint,
      instagramMetadataGate:
        instagramJob?.metadataOptimizationGate?.ok === true,
      youtubeMetadataGate:
        youtubeJob?.metadataOptimizationGate?.ok === true,
      instagramVariant:
        instagramJob?.variantId === INSTAGRAM_VARIANT_ID,
      youtubeVariant:
        youtubeJob?.variantId === YOUTUBE_VARIANT_ID,
    };
    const artifactsValid =
      Object.values(artifactChecks).every(
        (value) => value === true,
      );
    if (!artifactsValid) {
      return {
        ok: false,
        reason: "PART2_DUAL_SAFE_APPROVED_ARTIFACT_MISMATCH",
        artifactChecks,
        ownerApprovalReason:
          ownerApproval.reason ?? null,
        instagramGateReasons:
          instagramJob?.metadataOptimizationGate?.reasons ??
          [],
        youtubeGateReasons:
          youtubeJob?.metadataOptimizationGate?.reasons ??
          [],
      };
    }

    const currentBinding = {
      contentId: unit.contentId,
      version: unit.version,
      productionPartId: "part-2",
      contentUnitManifestPath: paths.contentUnitPath,
      contentUnitSha256: manifestFile.sha256,
      instagramSourceSha256,
      youtubeSourceSha256,
      publishMetadataSha256: metadataSha256,
      finalVideoApprovalFingerprint:
        sourceIntegrity.finalVideoApprovalFingerprint,
    };
    if (
      fingerprintMoneyShortsPublishAttemptBinding(
        currentBinding,
      ) !==
      authorization.expectedPublicationAttemptFingerprint
    ) {
      return {
        ok: false,
        reason:
          "PART2_DUAL_SAFE_PUBLICATION_FINGERPRINT_MISMATCH",
      };
    }

    const genericPreflightPath = join(
      paths.outDir,
      GENERIC_PREFLIGHT_FILENAME,
    );
    const genericPreflight =
      readJsonEvidence(genericPreflightPath);
    const genericValidation =
      validateMoneyShortsPublishPreflightBinding({
        evidence: genericPreflight.evidence,
        current: {
          contentUnitManifestPath: paths.contentUnitPath,
          contentUnitSha256: manifestFile.sha256,
          instagramSourceSha256,
          youtubeSourceSha256,
          publishMetadataSha256: metadataSha256,
          finalVideoApprovalFingerprint:
            sourceIntegrity.finalVideoApprovalFingerprint,
        },
      });
    if (
      genericPreflight.parseOk !== true ||
      genericValidation.valid !== true ||
      genericPreflight.evidence
        ?.publicationAttemptFingerprint !==
        authorization.expectedPublicationAttemptFingerprint ||
      !SHA256_RE.test(
        String(
          genericPreflight.evidence?.bindingFingerprint ?? "",
        ),
      )
    ) {
      return {
        ok: false,
        reason:
          "PART2_DUAL_SAFE_GENERIC_PREFLIGHT_STALE_OR_MISSING",
      };
    }

    const ledger = readLedgerSnapshot(
      paths.ledgerPath,
      unit.contentId,
      unit.version,
    );
    if (!ledger.ok || ledger.clean !== true) {
      return {
        ok: false,
        reason:
          "PART2_DUAL_SAFE_ALREADY_PUBLISHED_OR_LEDGER_INVALID",
      };
    }
    const blobPathname =
      `${BLOB_PATH_PREFIX}/${unit.contentId}/` +
      `${INSTAGRAM_VARIANT_ID}/${unit.version}/` +
      `${instagramSourceSha256.slice(0, 12)}.mp4`;
    const planResult =
      buildMoneyShortsPart2DualPublishSafePlan({
        currentBinding,
        expectedContentId: authorization.expectedContentId,
        expectedManifestSha256:
          authorization.expectedManifestSha256,
        expectedSourceSha256:
          authorization.expectedSourceSha256,
        expectedPublicationAttemptFingerprint:
          authorization.expectedPublicationAttemptFingerprint,
        expectedInstagramAccountId:
          authorization.expectedInstagramAccountId,
        expectedYoutubeChannelId:
          authorization.expectedYoutubeChannelId,
        genericPreflightBindingFingerprint:
          genericPreflight.evidence.bindingFingerprint,
        ledgerBaselineSha256: ledger.sha256,
        blobPathname,
      });
    if (!planResult.ok) return planResult;

    return {
      ok: true,
      paths,
      unit,
      plan: planResult.plan,
      currentBinding,
      ledger,
      instagramSourcePath,
      youtubeSourcePath,
      instagramSourceBytes,
      youtubeSourceBytes,
      instagramSourceSize,
      youtubeSourceSize,
      instagramMetadata: unit.instagramMetadata,
      youtubeMetadata: unit.youtubeMetadata,
    };
  } catch {
    return {
      ok: false,
      reason:
        "PART2_DUAL_SAFE_LOCAL_EVIDENCE_INSPECTION_FAILED",
    };
  }
}

export {
  inspectCurrentContext as inspectMoneyShortsPart2DualPublishSafeCurrentContext,
};

function evidenceAbsent(paths) {
  return (
    !existsSync(paths.claimPath) &&
    !existsSync(paths.eventDir) &&
    !existsSync(paths.resultPath)
  );
}

function normalizeEvidenceFileIdentity(stat) {
  return {
    dev: String(stat?.dev ?? ""),
    ino: String(stat?.ino ?? ""),
    size: String(stat?.size ?? ""),
    mtimeMs: String(stat?.mtimeMs ?? ""),
    ctimeMs: String(stat?.ctimeMs ?? ""),
  };
}

export function inspectSafeEvidenceDirectory({
  paths,
  preflightFingerprint = null,
  allowLock = false,
  expectedLockIdentity = null,
}) {
  if (!existsSync(paths.evidenceDir)) {
    return {
      ok: preflightFingerprint === null,
      reason:
        preflightFingerprint === null
          ? null
          : "PART2_DUAL_SAFE_EVIDENCE_DIRECTORY_MISSING",
    };
  }
  const allowedNames = new Set();
  if (preflightFingerprint !== null) {
    allowedNames.add(basename(paths.preflightPath));
    allowedNames.add(
      `${basename(paths.preflightPath)}.${preflightFingerprint}.committed-source`,
    );
  }
  if (allowLock) {
    allowedNames.add(basename(paths.lockPath));
  }
  let entries;
  try {
    entries = readdirSync(paths.evidenceDir, {
      withFileTypes: true,
    });
  } catch {
    return {
      ok: false,
      reason:
        "PART2_DUAL_SAFE_EVIDENCE_DIRECTORY_READ_FAILED",
    };
  }
  if (
    entries.some(
      (entry) =>
        !entry.isFile() || !allowedNames.has(entry.name),
    )
  ) {
    return {
      ok: false,
      reason:
        "PART2_DUAL_SAFE_EVIDENCE_ORPHAN_OR_UNKNOWN_ENTRY",
    };
  }
  if (preflightFingerprint === null) {
    return {
      ok: entries.length === 0,
      reason:
        entries.length === 0
          ? null
          : "PART2_DUAL_SAFE_EVIDENCE_ORPHAN_OR_UNKNOWN_ENTRY",
    };
  }
  if (allowLock) {
    if (
      !existsSync(paths.lockPath) ||
      !isPlainObject(expectedLockIdentity)
    ) {
      return {
        ok: false,
        reason:
          "PART2_DUAL_SAFE_EXECUTION_LOCK_MISSING_OR_CHANGED",
      };
    }
    try {
      const currentLockIdentity =
        normalizeEvidenceFileIdentity(
          statSync(paths.lockPath),
        );
      if (
        JSON.stringify(currentLockIdentity) !==
        JSON.stringify(expectedLockIdentity)
      ) {
        return {
          ok: false,
          reason:
            "PART2_DUAL_SAFE_EXECUTION_LOCK_MISSING_OR_CHANGED",
        };
      }
    } catch {
      return {
        ok: false,
        reason:
          "PART2_DUAL_SAFE_EXECUTION_LOCK_MISSING_OR_CHANGED",
      };
    }
  }
  const committedSourcePath =
    `${paths.preflightPath}.${preflightFingerprint}.committed-source`;
  if (
    !existsSync(paths.preflightPath) ||
    !existsSync(committedSourcePath)
  ) {
    return {
      ok: false,
      reason:
        "PART2_DUAL_SAFE_PREFLIGHT_COMMITTED_PAIR_MISSING",
    };
  }
  try {
    const canonicalBytes = readFileSync(paths.preflightPath);
    const committedBytes = readFileSync(committedSourcePath);
    if (!canonicalBytes.equals(committedBytes)) {
      return {
        ok: false,
        reason:
          "PART2_DUAL_SAFE_PREFLIGHT_COMMITTED_PAIR_MISMATCH",
      };
    }
  } catch {
    return {
      ok: false,
      reason:
        "PART2_DUAL_SAFE_PREFLIGHT_COMMITTED_PAIR_READ_FAILED",
    };
  }
  return { ok: true, reason: null };
}

const GENERIC_PART2_HANDOFF_HINT =
  "Use part2-only-dual-publish through the Owner no-log wrapper after its dedicated preflight.";

function exactZeroCanonicalCounters(value) {
  const fields = [
    "blobPutCount",
    "blobHeadCount",
    "instagramContainerCreateCount",
    "instagramStatusPollCount",
    "instagramPublishCount",
    "youtubeInsertCount",
    "ledgerWriteCount",
    "envSecretValuePrintCount",
  ];
  return (
    isPlainObject(value) &&
    Object.keys(value).length === fields.length &&
    fields.every((field) => value[field] === 0)
  );
}

function genericPart2HandoffMatchesCurrent(
  evidence,
  currentBinding,
) {
  return (
    isPlainObject(evidence) &&
    evidence.schemaVersion === CANONICAL_RESULT_SCHEMA &&
    evidence.approvalToken ===
      "APPROVE_FINAL_E2E_AUTOMATION_PUBLISH_ONE_NEW_CONTENT_UNIT" &&
    evidence.status === "BLOCKED" &&
    evidence.blockerCode === "PART2_SAFE_RUNNER_REQUIRED" &&
    evidence.armed === true &&
    evidence.contentId === currentBinding.contentId &&
    evidence.version === currentBinding.version &&
    evidence.wizardProductionPartId === "part-2" &&
    resolve(String(evidence.contentUnitManifestPath ?? "")) ===
      resolve(currentBinding.contentUnitManifestPath) &&
    evidence.contentUnitSha256 ===
      currentBinding.contentUnitSha256 &&
    evidence.instagramSourceSha256 ===
      currentBinding.instagramSourceSha256 &&
    evidence.youtubeSourceSha256 ===
      currentBinding.youtubeSourceSha256 &&
    evidence.publishMetadataSha256 ===
      currentBinding.publishMetadataSha256 &&
    evidence.finalVideoApprovalFingerprint ===
      currentBinding.finalVideoApprovalFingerprint &&
    evidence.publicationAttemptFingerprint ===
      fingerprintMoneyShortsPublishAttemptBinding(
        currentBinding,
      ) &&
    evidence.ownerRunHint === GENERIC_PART2_HANDOFF_HINT &&
    evidence.envSecretValuesPrinted === false &&
    evidence.dotEnvLocalDirectRead === false &&
    exactZeroCanonicalCounters(evidence.sideEffectCounters) &&
    evidence.executionResult === undefined &&
    evidence.partialExternalState === undefined
  );
}

/**
 * generic runner가 외부 호출 0회로 남긴 정확한 part-2 handoff sentinel만
 * 전용 runner가 승계한다. 다른 result/claim/journal은 전부 기존 시도로 본다.
 */
function inspectCanonicalAttemptState(outDir, currentBinding) {
  const resultPath = join(
    outDir,
    CANONICAL_RESULT_FILENAME,
  );
  const archivePath = join(
    outDir,
    GENERIC_PART2_HANDOFF_ARCHIVE_FILENAME,
  );
  const claimExists = existsSync(
    join(
      outDir,
      MONEY_SHORTS_PUBLISH_ATTEMPT_CLAIM_FILENAME,
    ),
  );
  const journalExists = existsSync(
    join(
      outDir,
      MONEY_SHORTS_PUBLISH_ATTEMPT_JOURNAL_DIRNAME,
    ),
  );
  if (claimExists || journalExists) {
    return {
      ok: false,
      reason: "PART2_DUAL_SAFE_CANONICAL_ATTEMPT_EXISTS",
      mode: "attempt_exists",
      resultPath,
      archivePath,
    };
  }

  const result = readJsonEvidence(resultPath);
  const archive = readJsonEvidence(archivePath);
  const resultExists = result.exists === true;
  const archiveExists = archive.exists === true;
  if (!resultExists && !archiveExists) {
    return {
      ok: true,
      reason: null,
      mode: "absent",
      resultPath,
      archivePath,
    };
  }
  if (resultExists && archiveExists) {
    return {
      ok: false,
      reason:
        "PART2_DUAL_SAFE_CANONICAL_HANDOFF_DUPLICATED",
      mode: "ambiguous",
      resultPath,
      archivePath,
    };
  }
  const candidate = resultExists ? result : archive;
  if (
    candidate.parseOk !== true ||
    !genericPart2HandoffMatchesCurrent(
      candidate.evidence,
      currentBinding,
    )
  ) {
    return {
      ok: false,
      reason: "PART2_DUAL_SAFE_CANONICAL_ATTEMPT_EXISTS",
      mode: "attempt_exists",
      resultPath,
      archivePath,
    };
  }
  return {
    ok: true,
    reason: null,
    mode: resultExists
      ? "generic_part2_handoff"
      : "generic_part2_handoff_archived",
    resultPath,
    archivePath,
    handoffSha256: candidate.sha256,
  };
}

function archiveGenericPart2Handoff(state) {
  if (state.mode !== "generic_part2_handoff") {
    return state.mode ===
      "generic_part2_handoff_archived"
      ? { ok: true, archivedNow: false }
      : { ok: true, archivedNow: false };
  }
  try {
    renameSync(state.resultPath, state.archivePath);
    return { ok: true, archivedNow: true };
  } catch {
    return {
      ok: false,
      reason:
        "PART2_DUAL_SAFE_CANONICAL_HANDOFF_ARCHIVE_FAILED",
    };
  }
}

function canonicalCounters(counters) {
  return {
    blobPutCount: counters.blobPutCount,
    blobHeadCount: counters.blobHeadCount,
    instagramContainerCreateCount:
      counters.instagramContainerCreateCount,
    instagramStatusPollCount:
      counters.instagramStatusPollCount,
    instagramPublishCount: counters.instagramPublishCount,
    youtubeInsertCount: counters.youtubeInsertCount,
    ledgerWriteCount: counters.ledgerWriteCount,
    envSecretValuePrintCount:
      counters.credentialValuePrintCount,
  };
}

function fingerprintObject(value, field) {
  const stable = { ...value };
  return {
    ...stable,
    [field]: sha256(JSON.stringify(stable)),
  };
}

function buildInstagramCaption(metadata) {
  return [
    metadata?.captionFirstLineHook ?? "",
    "",
    metadata?.caption ?? "",
    "",
    metadata?.callToAction ?? "",
    "",
    (Array.isArray(metadata?.hashtags)
      ? metadata.hashtags
      : []
    )
      .map((tag) => `#${tag}`)
      .join(" "),
  ]
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function buildDefaultAdapters({
  credentials,
  expectedInstagramAccountId,
  expectedYoutubeChannelId,
}) {
  const { google } = await import("googleapis");
  const oauth2 = new google.auth.OAuth2(
    credentials.YOUTUBE_CLIENT_ID,
    credentials.YOUTUBE_CLIENT_SECRET,
    "http://localhost:3000/api/auth/youtube/callback",
  );
  oauth2.setCredentials({
    refresh_token: credentials.YOUTUBE_REFRESH_TOKEN,
  });
  const youtube = google.youtube({
    version: "v3",
    auth: oauth2,
  });
  const instagramHeaders = {
    Authorization:
      `Bearer ${credentials.INSTAGRAM_ACCESS_TOKEN}`,
  };
  const graphUrl = (path) =>
    `${GRAPH_API_BASE}/${encodeURIComponent(path)}`;
  return {
    async verifyInstagramAccount() {
      const response = await fetch(
        `${graphUrl(expectedInstagramAccountId)}?fields=id`,
        {
          headers: instagramHeaders,
          redirect: "error",
          signal: AbortSignal.timeout(30_000),
        },
      );
      const data = await response.json();
      return {
        ok: response.ok === true,
        accountId:
          typeof data?.id === "string" ? data.id : null,
      };
    },
    async verifyYoutubeChannel() {
      const response = await youtube.channels.list(
        {
          part: ["id"],
          mine: true,
          maxResults: 50,
        },
        { retry: false },
      );
      const ids = Array.isArray(response?.data?.items)
        ? [
            ...new Set(
              response.data.items
                .map((item) => item?.id)
                .filter(
                  (id) =>
                    typeof id === "string" &&
                    id.length > 0,
                ),
            ),
          ]
        : [];
      return {
        ok:
          ids.length === 1 &&
          ids[0] === expectedYoutubeChannelId,
        channelId: ids.length === 1 ? ids[0] : null,
      };
    },
    async putBlob(pathname, bytes) {
      process.env.VERCEL_BLOB_RETRIES = "0";
      const { put } = await import("@vercel/blob");
      return put(pathname, bytes, {
        access: "public",
        addRandomSuffix: false,
        allowOverwrite: false,
        multipart: false,
        contentType: "video/mp4",
        token: credentials.BLOB_READ_WRITE_TOKEN,
      });
    },
    async headBlob(url) {
      return fetch(url, {
        method: "HEAD",
        redirect: "error",
        signal: AbortSignal.timeout(30_000),
      });
    },
    async createInstagramContainer({
      videoUrl,
      caption,
      shareToFeed,
    }) {
      return createMoneyShortsInstagramContainerOnce({
        accountId: expectedInstagramAccountId,
        accessToken:
          credentials.INSTAGRAM_ACCESS_TOKEN,
        videoUrl,
        caption,
        shareToFeed,
      });
    },
    async readInstagramContainer(containerId) {
      const response = await fetch(
        `${graphUrl(containerId)}?fields=status_code,status`,
        {
          headers: instagramHeaders,
          redirect: "error",
          signal: AbortSignal.timeout(30_000),
        },
      );
      const data = await response.json();
      return {
        ok: response.ok === true,
        statusCode:
          typeof data?.status_code === "string"
            ? data.status_code
            : "UNKNOWN",
      };
    },
    async publishInstagram(containerId) {
      const body = new URLSearchParams({
        creation_id: containerId,
      });
      const response = await fetch(
        `${graphUrl(expectedInstagramAccountId)}/media_publish`,
        {
          method: "POST",
          headers: {
            ...instagramHeaders,
            "Content-Type":
              "application/x-www-form-urlencoded",
          },
          body,
          redirect: "error",
          signal: AbortSignal.timeout(30_000),
        },
      );
      const data = await response.json();
      return {
        ok: response.ok === true,
        mediaId:
          typeof data?.id === "string" ? data.id : null,
      };
    },
    async insertYoutube(metadata, bytes) {
      return youtube.videos.insert(
        {
          part: ["snippet", "status"],
          requestBody: {
            snippet: {
              title:
                metadata.titleWithShortsSuffix ??
                metadata.titleBase,
              description: metadata.descriptionBase ?? "",
              tags: Array.isArray(metadata.tags)
                ? metadata.tags
                : [],
              categoryId: metadata.categoryId ?? "27",
              defaultLanguage:
                metadata.defaultLanguage ?? "ko",
            },
            status: {
              privacyStatus:
                metadata.privacyStatus ?? "public",
              selfDeclaredMadeForKids:
                metadata.selfDeclaredMadeForKids === true,
              containsSyntheticMedia:
                metadata.containsSyntheticMedia === true,
            },
          },
          media: {
            mimeType: "video/mp4",
            body: Readable.from([bytes]),
          },
        },
        { retry: false },
      );
    },
    async sleep(ms) {
      await new Promise((resolveSleep) =>
        setTimeout(resolveSleep, ms),
      );
    },
  };
}

async function executeArmed({
  context,
  evidencePaths,
  authorization,
  envProvider,
  adapterFactory,
  ledgerWriter,
}) {
  const counters =
    zeroMoneyShortsPart2DualPublishSafeCounters();
  const lock =
    acquireMoneyShortsPart2DualPublishSafeLock({
      lockPath: evidencePaths.lockPath,
    });
  if (!lock.ok) {
    return {
      ok: false,
      status: "BLOCKED",
      blockerCode:
        "PART2_DUAL_SAFE_EXECUTION_LOCK_ACTIVE",
      sideEffectCounters: counters,
    };
  }

  let safeClaim = null;
  let canonicalHandle = null;
  let latestSafeEvidenceSha256 = null;
  let latestSafeTransition = null;
  let safeResultWritten = false;
  let canonicalResultWritten = false;
  let executionResult = {
    identities: {
      instagram: {
        status: "not_started",
        accountId: null,
      },
      youtube: {
        status: "not_started",
        channelId: null,
      },
    },
    blob: {
      status: "pending",
      pathname: context.plan.blobPathname,
      url: null,
      headStatus: null,
      headContentType: null,
    },
    instagram: {
      status: "pending",
      outcome: "not_started",
      mediaId: null,
      containerId: null,
      containerCreateDiagnostic: null,
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
      path: context.paths.ledgerPath,
      recordedKeys: [],
      writeOk: false,
      readbackOk: false,
      writeLockReleased: null,
    },
  };

  const publicState = () => structuredClone(executionResult);
  const appendTransition = (transition) => {
    if (!safeClaim || !canonicalHandle) {
      throw new Error("part2_dual_safe_claim_missing");
    }
    counters.evidenceWriteCount += 1;
    const event =
      buildMoneyShortsPart2DualPublishSafeEvent({
        claim: safeClaim,
        transition,
        previousTransition: latestSafeTransition,
        previousEvidenceSha256:
          latestSafeEvidenceSha256,
        recordedAtIso: nowIso(),
        publicState: publicState(),
        sideEffectCounters: counters,
      });
    if (!event) {
      throw new Error("part2_dual_safe_event_invalid");
    }
    const eventWrite =
      writeMoneyShortsPart2DualPublishSafeEvidenceOnce({
        path: moneyShortsPart2DualPublishSafeEventPath(
          evidencePaths.eventDir,
          transition,
        ),
        evidence: event,
        fingerprintField: "eventFingerprint",
      });
    if (!eventWrite.ok) {
      throw new Error("part2_dual_safe_event_write_failed");
    }
    const appended = appendMoneyShortsPublishAttemptJournal({
      handle: canonicalHandle,
      transition,
      state: {
        sideEffectCounters: canonicalCounters(counters),
        ...executionResult,
      },
    });
    canonicalHandle = appended.handle;
    latestSafeEvidenceSha256 = eventWrite.sha256;
    latestSafeTransition = transition;
  };

  const writeCanonicalResult = ({
    status,
    blockerCode,
    partialExternalState = null,
  }) => {
    const stable = {
      schemaVersion: CANONICAL_RESULT_SCHEMA,
      approvalToken:
        MONEY_SHORTS_PART2_DUAL_PUBLISH_SAFE_APPROVAL,
      status,
      blockerCode,
      armed: true,
      finishedAtIso: nowIso(),
      contentUnitManifestPath:
        context.paths.contentUnitPath,
      ledgerPath: context.paths.ledgerPath,
      envSecretValuesPrinted: false,
      dotEnvLocalDirectRead: false,
      sideEffectCounters: canonicalCounters(counters),
      contentId: context.unit.contentId,
      version: context.unit.version,
      wizardProductionPartId: "part-2",
      contentUnitSha256:
        context.currentBinding.contentUnitSha256,
      instagramSourceSha256:
        context.currentBinding.instagramSourceSha256,
      youtubeSourceSha256:
        context.currentBinding.youtubeSourceSha256,
      publishMetadataSha256:
        context.currentBinding.publishMetadataSha256,
      finalVideoApprovalFingerprint:
        context.currentBinding
          .finalVideoApprovalFingerprint,
      publicationAttemptFingerprint:
        context.plan.publicationAttemptFingerprint,
      executionResult,
      partialExternalState,
      safeAuthorization: {
        planFingerprint: context.plan.planFingerprint,
        preflightFingerprint:
          authorization.expectedPreflightFingerprint,
        expectedInstagramAccountId:
          context.plan.expectedInstagramAccountId,
        expectedYoutubeChannelId:
          context.plan.expectedYoutubeChannelId,
        identityVerifiedBeforeMutation:
          executionResult.identities.instagram.status ===
            "confirmed" &&
          executionResult.identities.youtube.status ===
            "confirmed",
        blobSdkRetryCount: 0,
        youtubeRetryDisabled: true,
        automaticRetryCount: 0,
        part1ActionCount: 0,
      },
    };
    const evidence =
      fingerprintObject(stable, "resultFingerprint");
    const written =
      writeMoneyShortsPart2DualPublishSafeEvidenceOnce({
        path: join(
          context.paths.outDir,
          CANONICAL_RESULT_FILENAME,
        ),
        evidence,
        fingerprintField: "resultFingerprint",
      });
    canonicalResultWritten = written.ok === true;
    return canonicalResultWritten;
  };

  const finalize = ({
    ok,
    status,
    blockerCode,
    canonicalStatus,
    partialExternalState = null,
  }) => {
    if (
      safeClaim &&
      latestSafeEvidenceSha256 &&
      latestSafeTransition &&
      !safeResultWritten
    ) {
      counters.evidenceWriteCount += 1;
      const result =
        buildMoneyShortsPart2DualPublishSafeResult({
          claim: safeClaim,
          latestEventSha256:
            latestSafeEvidenceSha256,
          latestTransition: latestSafeTransition,
          status,
          blockerCode,
          completedAtIso: nowIso(),
          publicState: publicState(),
          sideEffectCounters: counters,
        });
      if (result) {
        const written =
          writeMoneyShortsPart2DualPublishSafeEvidenceOnce({
            path: evidencePaths.resultPath,
            evidence: result,
            fingerprintField: "resultFingerprint",
          });
        safeResultWritten = written.ok === true;
      }
    }
    if (!canonicalResultWritten && canonicalHandle) {
      writeCanonicalResult({
        status: canonicalStatus,
        blockerCode,
        partialExternalState,
      });
    }
    const evidenceComplete =
      safeResultWritten === true &&
      canonicalResultWritten === true;
    const finalOk = ok === true && evidenceComplete;
    return {
      ok: finalOk,
      status:
        ok === true && !evidenceComplete
          ? "PART2_DUAL_SAFE_RESULT_EVIDENCE_INCOMPLETE"
          : status,
      blockerCode:
        ok === true && !evidenceComplete
          ? "PART2_DUAL_SAFE_RESULT_WRITE_FAILED"
          : blockerCode,
      partialExternalState,
      safeResultWritten,
      canonicalResultWritten,
      instagramMediaId:
        executionResult.instagram.mediaId,
      youtubeVideoId: executionResult.youtube.videoId,
      youtubeUrl: executionResult.youtube.url,
      ledgerRecordedKeys:
        executionResult.ledger.recordedKeys,
      sideEffectCounters: counters,
    };
  };

  let returnValue = null;
  try {
    const lockedContext = inspectCurrentContext({
      paths: context.paths,
      authorization,
    });
    const lockedEvidenceHygiene =
      inspectSafeEvidenceDirectory({
        paths: evidencePaths,
        preflightFingerprint:
          authorization.expectedPreflightFingerprint,
        allowLock: true,
        expectedLockIdentity: lock.fileIdentity,
      });
    const lockedCanonicalState =
      lockedContext.ok === true
        ? inspectCanonicalAttemptState(
            context.paths.outDir,
            lockedContext.currentBinding,
          )
        : {
            ok: false,
            reason:
              "PART2_DUAL_SAFE_LOCAL_EVIDENCE_INSPECTION_FAILED",
          };
    if (
      !lockedContext.ok ||
      lockedContext.plan.planFingerprint !==
        context.plan.planFingerprint ||
      lockedEvidenceHygiene.ok !== true ||
      !evidenceAbsent(evidencePaths) ||
      lockedCanonicalState.ok !== true
    ) {
      returnValue = {
        ok: false,
        status: "BLOCKED",
        blockerCode:
          "PART2_DUAL_SAFE_EVIDENCE_CHANGED_AFTER_LOCK",
        sideEffectCounters: counters,
      };
      return returnValue;
    }
    const archivedHandoff =
      archiveGenericPart2Handoff(lockedCanonicalState);
    if (archivedHandoff.ok !== true) {
      returnValue = {
        ok: false,
        status: "BLOCKED",
        blockerCode: archivedHandoff.reason,
        sideEffectCounters: counters,
      };
      return returnValue;
    }
    const canonicalAfterArchive =
      inspectCanonicalAttemptState(
        context.paths.outDir,
        lockedContext.currentBinding,
      );
    if (
      canonicalAfterArchive.ok !== true ||
      ![
        "absent",
        "generic_part2_handoff_archived",
      ].includes(canonicalAfterArchive.mode)
    ) {
      returnValue = {
        ok: false,
        status: "BLOCKED",
        blockerCode:
          "PART2_DUAL_SAFE_CANONICAL_HANDOFF_ARCHIVE_NOT_VERIFIED",
        sideEffectCounters: counters,
      };
      return returnValue;
    }
    const preflightFile =
      readJsonEvidence(evidencePaths.preflightPath);
    const preflightValidation =
      validateMoneyShortsPart2DualPublishSafePreflight({
        evidence: preflightFile.evidence,
        currentPlan: lockedContext.plan,
        expectedPreflightFingerprint:
          authorization.expectedPreflightFingerprint,
      });
    if (
      preflightFile.parseOk !== true ||
      preflightValidation.valid !== true
    ) {
      returnValue = {
        ok: false,
        status: "BLOCKED",
        blockerCode:
          "PART2_DUAL_SAFE_PREFLIGHT_STALE_AFTER_LOCK",
        sideEffectCounters: counters,
      };
      return returnValue;
    }

    const runtimeEnv = envProvider();
    const credentials = Object.create(null);
    const credentialPresence = Object.create(null);
    for (const name of REQUIRED_ENV_KEYS) {
      counters.credentialReadCount += 1;
      const value = runtimeEnv?.[name];
      credentialPresence[name] =
        typeof value === "string" && value.length > 0;
      if (credentialPresence[name]) {
        credentials[name] = value;
      }
    }
    if (
      !REQUIRED_ENV_KEYS.every(
        (name) => credentialPresence[name] === true,
      ) ||
      credentials.INSTAGRAM_BUSINESS_ACCOUNT_ID !==
        lockedContext.plan.expectedInstagramAccountId
    ) {
      for (const name of REQUIRED_ENV_KEYS) {
        delete credentials[name];
      }
      returnValue = {
        ok: false,
        status: "BLOCKED",
        blockerCode:
          "PART2_DUAL_SAFE_CREDENTIAL_OR_INSTAGRAM_ID_MISMATCH",
        credentialPresence,
        sideEffectCounters: counters,
      };
      return returnValue;
    }

    const canonicalClaim = claimMoneyShortsPublishAttempt({
      outDir: context.paths.outDir,
      binding: lockedContext.currentBinding,
    });
    if (!canonicalClaim.ok) {
      returnValue = {
        ok: false,
        status: "BLOCKED",
        blockerCode:
          "PART2_DUAL_SAFE_CANONICAL_ATTEMPT_EXISTS",
        sideEffectCounters: counters,
      };
      return returnValue;
    }
    canonicalHandle = canonicalClaim.handle;
    safeClaim =
      buildMoneyShortsPart2DualPublishSafeClaim({
        plan: lockedContext.plan,
        preflightFingerprint:
          authorization.expectedPreflightFingerprint,
        claimedAtIso: nowIso(),
      });
    if (!safeClaim) {
      throw new Error("part2_dual_safe_claim_invalid");
    }
    const safeClaimWrite =
      writeMoneyShortsPart2DualPublishSafeEvidenceOnce({
        path: evidencePaths.claimPath,
        evidence: safeClaim,
        fingerprintField: "claimFingerprint",
      });
    if (!safeClaimWrite.ok) {
      throw new Error("part2_dual_safe_claim_write_failed");
    }
    counters.evidenceWriteCount = 2;
    latestSafeEvidenceSha256 =
      safeClaimWrite.sha256;
    appendTransition("external_execution_ready");

    const adapters = await adapterFactory({
      credentials,
      expectedInstagramAccountId:
        lockedContext.plan.expectedInstagramAccountId,
      expectedYoutubeChannelId:
        lockedContext.plan.expectedYoutubeChannelId,
    });

    appendTransition(
      "instagram_identity_verify_intent",
    );
    counters.instagramIdentityVerificationCount += 1;
    counters.externalApiInvocationCount += 1;
    const instagramIdentity =
      await adapters.verifyInstagramAccount();
    if (
      instagramIdentity?.ok !== true ||
      instagramIdentity.accountId !==
        lockedContext.plan.expectedInstagramAccountId
    ) {
      executionResult.identities.instagram.status =
        "mismatch";
      returnValue = finalize({
        ok: false,
        status: "FAILED_BEFORE_ANY_MUTATION",
        blockerCode:
          "PART2_DUAL_SAFE_INSTAGRAM_IDENTITY_MISMATCH",
        canonicalStatus: "FAILED",
      });
      return returnValue;
    }
    executionResult.identities.instagram = {
      status: "confirmed",
      accountId: instagramIdentity.accountId,
    };
    appendTransition(
      "instagram_identity_verify_confirmed",
    );

    appendTransition("youtube_identity_verify_intent");
    counters.youtubeChannelVerificationCount += 1;
    counters.externalApiInvocationCount += 1;
    const youtubeIdentity =
      await adapters.verifyYoutubeChannel();
    if (
      youtubeIdentity?.ok !== true ||
      youtubeIdentity.channelId !==
        lockedContext.plan.expectedYoutubeChannelId
    ) {
      executionResult.identities.youtube.status =
        "mismatch";
      returnValue = finalize({
        ok: false,
        status: "FAILED_BEFORE_ANY_MUTATION",
        blockerCode:
          "PART2_DUAL_SAFE_YOUTUBE_IDENTITY_MISMATCH",
        canonicalStatus: "FAILED",
      });
      return returnValue;
    }
    executionResult.identities.youtube = {
      status: "confirmed",
      channelId: youtubeIdentity.channelId,
    };
    appendTransition(
      "youtube_identity_verify_confirmed",
    );

    const beforeMutationLedger = readLedgerSnapshot(
      lockedContext.paths.ledgerPath,
      lockedContext.unit.contentId,
      lockedContext.unit.version,
    );
    if (
      !beforeMutationLedger.ok ||
      beforeMutationLedger.clean !== true ||
      beforeMutationLedger.sha256 !==
        lockedContext.plan.ledgerBaselineSha256
    ) {
      returnValue = finalize({
        ok: false,
        status: "FAILED_BEFORE_ANY_MUTATION",
        blockerCode:
          "PART2_DUAL_SAFE_LEDGER_CHANGED_BEFORE_MUTATION",
        canonicalStatus: "FAILED",
      });
      return returnValue;
    }

    appendTransition("blob_put_intent");
    counters.blobPutCount += 1;
    counters.externalApiInvocationCount += 1;
    let blobResponse;
    try {
      blobResponse = await adapters.putBlob(
        lockedContext.plan.blobPathname,
        lockedContext.instagramSourceBytes,
      );
    } catch {
      executionResult.blob.status = "failed";
      returnValue = finalize({
        ok: false,
        status: "BLOB_PUT_OUTCOME_UNKNOWN",
        blockerCode:
          "PART2_DUAL_SAFE_BLOB_PUT_OUTCOME_UNKNOWN",
        canonicalStatus: "FAILED",
      });
      return returnValue;
    }
    const blobUrl = blobResponse?.url;
    if (
      typeof blobUrl !== "string" ||
      !blobUrl.startsWith("https://")
    ) {
      executionResult.blob.status = "failed";
      returnValue = finalize({
        ok: false,
        status: "BLOB_PUT_OUTCOME_UNKNOWN",
        blockerCode:
          "PART2_DUAL_SAFE_BLOB_PUT_NO_URL",
        canonicalStatus: "FAILED",
      });
      return returnValue;
    }
    executionResult.blob.status = "uploaded";
    executionResult.blob.url = blobUrl;
    appendTransition("blob_put_confirmed");

    appendTransition("blob_head_intent");
    counters.blobHeadCount += 1;
    counters.externalApiInvocationCount += 1;
    const headResponse = await adapters.headBlob(blobUrl);
    executionResult.blob.headStatus =
      Number(headResponse?.status ?? 0);
    executionResult.blob.headContentType =
      headResponse?.headers?.get?.("content-type") ?? null;
    if (
      !headResponse?.ok ||
      !String(
        executionResult.blob.headContentType ?? "",
      ).startsWith("video/")
    ) {
      returnValue = finalize({
        ok: false,
        status: "FAILED_AFTER_BLOB_PUT",
        blockerCode:
          "PART2_DUAL_SAFE_BLOB_HEAD_FAILED",
        canonicalStatus: "FAILED",
      });
      return returnValue;
    }
    appendTransition("blob_head_confirmed");

    appendTransition("instagram_container_intent");
    counters.instagramContainerCreateCount += 1;
    counters.externalApiInvocationCount += 1;
    executionResult.instagram.outcome = "unknown";
    let containerResponse;
    try {
      containerResponse =
        await adapters.createInstagramContainer({
          videoUrl: blobUrl,
          caption: buildInstagramCaption(
            lockedContext.instagramMetadata,
          ),
          shareToFeed:
            lockedContext.instagramMetadata
              ?.shareToFeed === true,
        });
    } catch {
      returnValue = finalize({
        ok: false,
        status: "INSTAGRAM_CONTAINER_OUTCOME_UNKNOWN",
        blockerCode:
          "PART2_DUAL_SAFE_INSTAGRAM_CONTAINER_UNKNOWN",
        canonicalStatus: "FAILED",
      });
      return returnValue;
    }
    executionResult.instagram.containerCreateDiagnostic =
      normalizeInstagramContainerCreateDiagnostic(
        containerResponse?.diagnostic,
      );
    const containerId =
      typeof containerResponse?.containerId === "string" &&
      INSTAGRAM_PUBLIC_ID_RE.test(
        containerResponse.containerId,
      )
        ? containerResponse.containerId
        : null;
    if (
      containerResponse?.ok !== true ||
      typeof containerId !== "string" ||
      !INSTAGRAM_PUBLIC_ID_RE.test(containerId)
    ) {
      returnValue = finalize({
        ok: false,
        status: "INSTAGRAM_CONTAINER_OUTCOME_UNKNOWN",
        blockerCode:
          "PART2_DUAL_SAFE_INSTAGRAM_CONTAINER_NO_ID",
        canonicalStatus: "FAILED",
      });
      return returnValue;
    }
    executionResult.instagram.containerId = containerId;
    appendTransition("instagram_container_confirmed");

    appendTransition("instagram_poll_intent");
    let finalInstagramStatus = "UNKNOWN";
    for (let pollIndex = 0; pollIndex < 24; pollIndex += 1) {
      counters.instagramStatusPollCount += 1;
      counters.externalApiInvocationCount += 1;
      const statusResponse =
        await adapters.readInstagramContainer(containerId);
      finalInstagramStatus =
        typeof statusResponse?.statusCode === "string"
          ? statusResponse.statusCode
          : "UNKNOWN";
      executionResult.instagram.lastStatusCode =
        finalInstagramStatus;
      if (finalInstagramStatus === "FINISHED") break;
      if (
        ["ERROR", "EXPIRED", "UNKNOWN"].includes(
          finalInstagramStatus,
        )
      ) {
        break;
      }
      if (pollIndex < 23) {
        await adapters.sleep(5_000);
      }
    }
    appendTransition("instagram_poll_observed");
    if (finalInstagramStatus !== "FINISHED") {
      returnValue = finalize({
        ok: false,
        status: "FAILED_BEFORE_INSTAGRAM_PUBLISH",
        blockerCode:
          "PART2_DUAL_SAFE_INSTAGRAM_CONTAINER_NOT_READY",
        canonicalStatus: "FAILED",
      });
      return returnValue;
    }
    appendTransition("instagram_container_ready");

    appendTransition("instagram_publish_intent");
    counters.instagramPublishCount += 1;
    counters.externalApiInvocationCount += 1;
    let instagramPublish;
    try {
      instagramPublish =
        await adapters.publishInstagram(containerId);
    } catch {
      returnValue = finalize({
        ok: false,
        status: "INSTAGRAM_PUBLISH_OUTCOME_UNKNOWN",
        blockerCode:
          "PART2_DUAL_SAFE_INSTAGRAM_PUBLISH_UNKNOWN",
        canonicalStatus: "FAILED",
      });
      return returnValue;
    }
    const instagramMediaId =
      instagramPublish?.mediaId;
    if (
      instagramPublish?.ok !== true ||
      typeof instagramMediaId !== "string" ||
      !INSTAGRAM_PUBLIC_ID_RE.test(instagramMediaId)
    ) {
      returnValue = finalize({
        ok: false,
        status: "INSTAGRAM_PUBLISH_OUTCOME_UNKNOWN",
        blockerCode:
          "PART2_DUAL_SAFE_INSTAGRAM_PUBLISH_NO_ID",
        canonicalStatus: "FAILED",
      });
      return returnValue;
    }
    executionResult.instagram = {
      ...executionResult.instagram,
      status: "published",
      outcome: "confirmed_published",
      mediaId: instagramMediaId,
    };
    appendTransition("instagram_publish_confirmed");

    const beforeYoutubeLedger = readLedgerSnapshot(
      lockedContext.paths.ledgerPath,
      lockedContext.unit.contentId,
      lockedContext.unit.version,
    );
    if (
      !beforeYoutubeLedger.ok ||
      beforeYoutubeLedger.clean !== true ||
      beforeYoutubeLedger.sha256 !==
        lockedContext.plan.ledgerBaselineSha256
    ) {
      returnValue = finalize({
        ok: false,
        status:
          "INSTAGRAM_PUBLISHED_YOUTUBE_NOT_STARTED",
        blockerCode:
          "PART2_DUAL_SAFE_LEDGER_CHANGED_BEFORE_YOUTUBE",
        canonicalStatus: "FAILED",
        partialExternalState:
          "instagram_published_youtube_not_started",
      });
      return returnValue;
    }

    appendTransition("youtube_insert_intent");
    counters.youtubeInsertCount += 1;
    counters.externalApiInvocationCount += 1;
    executionResult.youtube.outcome = "unknown";
    let youtubeResponse;
    try {
      youtubeResponse = await adapters.insertYoutube(
        lockedContext.youtubeMetadata,
        lockedContext.youtubeSourceBytes,
      );
    } catch {
      returnValue = finalize({
        ok: false,
        status:
          "INSTAGRAM_PUBLISHED_YOUTUBE_OUTCOME_UNKNOWN",
        blockerCode:
          "PART2_DUAL_SAFE_YOUTUBE_INSERT_UNKNOWN",
        canonicalStatus: "FAILED",
        partialExternalState:
          "instagram_published_youtube_failed",
      });
      return returnValue;
    }
    const youtubeVideoId = youtubeResponse?.data?.id;
    if (
      typeof youtubeVideoId !== "string" ||
      !YOUTUBE_VIDEO_ID_RE.test(youtubeVideoId)
    ) {
      returnValue = finalize({
        ok: false,
        status:
          "INSTAGRAM_PUBLISHED_YOUTUBE_OUTCOME_UNKNOWN",
        blockerCode:
          "PART2_DUAL_SAFE_YOUTUBE_INSERT_NO_ID",
        canonicalStatus: "FAILED",
        partialExternalState:
          "instagram_published_youtube_failed",
      });
      return returnValue;
    }
    const publishedAtIso = nowIso();
    executionResult.youtube = {
      status: "uploaded",
      outcome: "confirmed_published",
      videoId: youtubeVideoId,
      url:
        `https://www.youtube.com/shorts/${youtubeVideoId}`,
    };
    appendTransition("youtube_insert_confirmed");

    const beforeLedger = readLedgerSnapshot(
      lockedContext.paths.ledgerPath,
      lockedContext.unit.contentId,
      lockedContext.unit.version,
    );
    if (
      !beforeLedger.ok ||
      beforeLedger.clean !== true ||
      beforeLedger.sha256 !==
        lockedContext.plan.ledgerBaselineSha256
    ) {
      returnValue = finalize({
        ok: false,
        status: "BOTH_PUBLISHED_LEDGER_MISSING",
        blockerCode:
          "PART2_DUAL_SAFE_LEDGER_CHANGED_BEFORE_WRITE",
        canonicalStatus: "FAILED",
        partialExternalState:
          "both_published_ledger_missing",
      });
      return returnValue;
    }
    const recordResult =
      recordDualPlatformPublishRuntime(
        beforeLedger.ledger,
        {
          contentId: lockedContext.unit.contentId,
          version: lockedContext.unit.version,
          instagram: {
            publishedId: instagramMediaId,
            variantId: INSTAGRAM_VARIANT_ID,
            publishedAtIso,
            metadata: {
              blobPathname:
                lockedContext.plan.blobPathname,
              sourceSha256:
                lockedContext.currentBinding
                  .instagramSourceSha256,
              accountId:
                lockedContext.plan
                  .expectedInstagramAccountId,
              safePreflightFingerprint:
                authorization
                  .expectedPreflightFingerprint,
            },
          },
          youtube: {
            publishedId: youtubeVideoId,
            publishedUrl:
              `https://www.youtube.com/shorts/${youtubeVideoId}`,
            variantId: YOUTUBE_VARIANT_ID,
            publishedAtIso,
            metadata: {
              sourceFileName: basename(
                lockedContext.youtubeSourcePath,
              ),
              sourceSha256:
                lockedContext.currentBinding
                  .youtubeSourceSha256,
              channelId:
                lockedContext.plan
                  .expectedYoutubeChannelId,
              safePreflightFingerprint:
                authorization
                  .expectedPreflightFingerprint,
            },
          },
        },
      );
    if (!recordResult.ok) {
      returnValue = finalize({
        ok: false,
        status: "BOTH_PUBLISHED_LEDGER_MISSING",
        blockerCode:
          "PART2_DUAL_SAFE_LEDGER_RECORD_REFUSED",
        canonicalStatus: "FAILED",
        partialExternalState:
          "both_published_ledger_missing",
      });
      return returnValue;
    }
    appendTransition("ledger_write_intent");
    const expectedLedgerBytes =
      serializePublishLedgerRuntime(recordResult.ledger);
    if (!expectedLedgerBytes) {
      returnValue = finalize({
        ok: false,
        status: "BOTH_PUBLISHED_LEDGER_MISSING",
        blockerCode:
          "PART2_DUAL_SAFE_LEDGER_SERIALIZATION_FAILED",
        canonicalStatus: "FAILED",
        partialExternalState:
          "both_published_ledger_missing",
      });
      return returnValue;
    }
    const expectedLedgerSha256 = sha256(
      expectedLedgerBytes,
    );
    counters.ledgerWriteCount += 1;
    const ledgerWrite = ledgerWriter(
      lockedContext.paths.ledgerPath,
      recordResult.ledger,
      {
        expectedCurrentSha256: beforeLedger.sha256,
      },
    );
    executionResult.ledger.writeLockReleased =
      ledgerWrite.lockReleased === true;
    if (
      ledgerWrite.ok !== true ||
      ledgerWrite.committed !== true
    ) {
      returnValue = finalize({
        ok: false,
        status: "BOTH_PUBLISHED_LEDGER_MISSING",
        blockerCode:
          "PART2_DUAL_SAFE_LEDGER_WRITE_FAILED",
        canonicalStatus: "FAILED",
        partialExternalState:
          "both_published_ledger_missing",
      });
      return returnValue;
    }
    const ledgerReadback = readLedgerSnapshot(
      lockedContext.paths.ledgerPath,
      lockedContext.unit.contentId,
      lockedContext.unit.version,
    );
    if (
      !ledgerReadback.ok ||
      ledgerReadback.sha256 !== expectedLedgerSha256 ||
      ledgerReadback.instagramRecord?.publishedId !==
        instagramMediaId ||
      ledgerReadback.youtubeRecord?.publishedId !==
        youtubeVideoId
    ) {
      returnValue = finalize({
        ok: false,
        status:
          "BOTH_PUBLISHED_LEDGER_COMMITTED_EVIDENCE_INCOMPLETE",
        blockerCode:
          "PART2_DUAL_SAFE_LEDGER_READBACK_FAILED",
        canonicalStatus: "FAILED",
        partialExternalState:
          "both_published_ledger_committed_result_incomplete",
      });
      return returnValue;
    }
    executionResult.ledger = {
      ...executionResult.ledger,
      status: "written",
      writeOk: true,
      readbackOk: true,
      recordedKeys: [
        recordResult.instagram.key,
        recordResult.youtube.key,
      ],
    };
    appendTransition("ledger_write_confirmed");
    appendTransition("complete");

    returnValue = finalize({
      ok: true,
      status: "PART2_DUAL_PUBLISH_OK",
      blockerCode: null,
      canonicalStatus: "PUBLISHED_DUAL_PLATFORM_OK",
    });
    return returnValue;
  } catch {
    returnValue = finalize({
      ok: false,
      status: "PART2_DUAL_SAFE_EXECUTION_FAILED",
      blockerCode:
        "PART2_DUAL_SAFE_UNEXPECTED_EXECUTION_FAILURE",
      canonicalStatus: "FAILED",
    });
    return returnValue;
  } finally {
    const release =
      releaseMoneyShortsPart2DualPublishSafeLock({ lock });
    if (!release.ok && returnValue) {
      returnValue.ok = false;
      returnValue.lockCleanupFailed = true;
    }
  }
}

export async function runMoneyShortsPart2DualPublishSafe({
  argv,
  envProvider = () => process.env,
  adapterFactory = buildDefaultAdapters,
  ledgerWriter = writePublishLedgerRuntime,
}) {
  const parsed =
    parseMoneyShortsPart2DualPublishSafeArgs(argv);
  if (!parsed.ok) return parsed;

  // Authorization intentionally precedes filesystem, env, and network.
  const authorization =
    validateMoneyShortsPart2DualPublishSafeAuthorization({
      armed: parsed.armed,
      approval: parsed.approval,
      expectedContentId: parsed.expectedContentId,
      expectedManifestSha256:
        parsed.expectedManifestSha256,
      expectedSourceSha256: parsed.expectedSourceSha256,
      expectedPublicationAttemptFingerprint:
        parsed.expectedPublicationAttemptFingerprint,
      expectedInstagramAccountId:
        parsed.expectedInstagramAccountId,
      expectedYoutubeChannelId:
        parsed.expectedYoutubeChannelId,
      expectedPreflightFingerprint:
        parsed.expectedPreflightFingerprint,
    });
  if (!authorization.ok) return authorization;

  const resolved = resolveInputPaths(parsed);
  if (!resolved.ok) return resolved;
  const context = inspectCurrentContext({
    paths: resolved.paths,
    authorization,
  });
  if (!context.ok) return context;
  const evidencePaths =
    moneyShortsPart2DualPublishSafePaths(
      context.paths.outDir,
    );
  const canonicalState = inspectCanonicalAttemptState(
    context.paths.outDir,
    context.currentBinding,
  );
  if (canonicalState.ok !== true) {
    return canonicalState;
  }

  if (!authorization.armed) {
    if (
      existsSync(evidencePaths.claimPath) ||
      existsSync(evidencePaths.eventDir) ||
      existsSync(evidencePaths.resultPath)
    ) {
      return {
        ok: false,
        reason:
          "PART2_DUAL_SAFE_ARMED_EVIDENCE_ALREADY_EXISTS",
      };
    }
    const existing =
      readJsonEvidence(evidencePaths.preflightPath);
    if (existing.parseOk === true) {
      const validation =
        validateMoneyShortsPart2DualPublishSafePreflight({
          evidence: existing.evidence,
          currentPlan: context.plan,
          expectedPreflightFingerprint:
            existing.evidence?.preflightFingerprint,
        });
      if (validation.valid === true) {
        const hygiene =
          inspectSafeEvidenceDirectory({
            paths: evidencePaths,
            preflightFingerprint:
              existing.evidence.preflightFingerprint,
          });
        if (hygiene.ok !== true) {
          return {
            ok: false,
            reason: hygiene.reason,
          };
        }
        return {
          ok: true,
          status: "PREFLIGHT_ONLY_OK",
          armed: false,
          alreadyPrepared: true,
          contentId: context.unit.contentId,
          version: context.unit.version,
          productionPartId: "part-2",
          planFingerprint: context.plan.planFingerprint,
          preflightFingerprint:
            existing.evidence.preflightFingerprint,
          preflightPath: evidencePaths.preflightPath,
          sideEffectCounters:
            existing.evidence.sideEffectCounters,
          canonicalHandoffState: canonicalState.mode,
          noLiveActions: true,
        };
      }
      return {
        ok: false,
        reason:
          "PART2_DUAL_SAFE_EXISTING_PREFLIGHT_STALE",
      };
    }
    const emptyEvidenceHygiene =
      inspectSafeEvidenceDirectory({
        paths: evidencePaths,
      });
    if (emptyEvidenceHygiene.ok !== true) {
      return {
        ok: false,
        reason: emptyEvidenceHygiene.reason,
      };
    }
    if (
      pathInside(
        REPO_ROOT,
        resolve(evidencePaths.preflightPath),
      )
    ) {
      return {
        ok: false,
        reason:
          "PART2_DUAL_SAFE_PREFLIGHT_PATH_INVALID",
      };
    }
    const preflight =
      buildMoneyShortsPart2DualPublishSafePreflight({
        plan: context.plan,
        boundAtIso: nowIso(),
      });
    if (!preflight) {
      return {
        ok: false,
        reason:
          "PART2_DUAL_SAFE_PREFLIGHT_BUILD_FAILED",
      };
    }
    const written =
      writeMoneyShortsPart2DualPublishSafeEvidenceOnce({
        path: evidencePaths.preflightPath,
        evidence: preflight,
        fingerprintField: "preflightFingerprint",
      });
    if (!written.ok) {
      return {
        ok: false,
        reason:
          "PART2_DUAL_SAFE_PREFLIGHT_WRITE_FAILED",
        preparedPath: written.preparedPath,
      };
    }
    const writtenEvidenceHygiene =
      inspectSafeEvidenceDirectory({
        paths: evidencePaths,
        preflightFingerprint:
          preflight.preflightFingerprint,
      });
    if (writtenEvidenceHygiene.ok !== true) {
      return {
        ok: false,
        reason:
          writtenEvidenceHygiene.reason ??
          "PART2_DUAL_SAFE_PREFLIGHT_EVIDENCE_INCOMPLETE",
      };
    }
    return {
      ok: true,
      status: "PREFLIGHT_ONLY_OK",
      armed: false,
      alreadyPrepared: false,
      contentId: context.unit.contentId,
      version: context.unit.version,
      productionPartId: "part-2",
      planFingerprint: context.plan.planFingerprint,
      preflightFingerprint:
        preflight.preflightFingerprint,
      preflightPath: evidencePaths.preflightPath,
      sideEffectCounters:
        preflight.sideEffectCounters,
      canonicalHandoffState: canonicalState.mode,
      noLiveActions: true,
    };
  }

  if (
    !evidenceAbsent(evidencePaths) ||
    canonicalState.ok !== true
  ) {
    return {
      ok: false,
      reason:
        "PART2_DUAL_SAFE_ATTEMPT_EVIDENCE_ALREADY_EXISTS",
    };
  }
  const preflightFile =
    readJsonEvidence(evidencePaths.preflightPath);
  const validation =
    validateMoneyShortsPart2DualPublishSafePreflight({
      evidence: preflightFile.evidence,
      currentPlan: context.plan,
      expectedPreflightFingerprint:
        authorization.expectedPreflightFingerprint,
    });
  if (
    preflightFile.parseOk !== true ||
    validation.valid !== true
  ) {
    return {
      ok: false,
      reason:
        "PART2_DUAL_SAFE_PREFLIGHT_STALE_OR_MISSING",
      };
  }
  const evidenceHygiene =
    inspectSafeEvidenceDirectory({
      paths: evidencePaths,
      preflightFingerprint:
        authorization.expectedPreflightFingerprint,
    });
  if (evidenceHygiene.ok !== true) {
    return {
      ok: false,
      reason: evidenceHygiene.reason,
    };
  }
  return executeArmed({
    context,
    evidencePaths,
    authorization,
    envProvider,
    adapterFactory,
    ledgerWriter,
  });
}

async function main() {
  const result =
    await runMoneyShortsPart2DualPublishSafe({
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
