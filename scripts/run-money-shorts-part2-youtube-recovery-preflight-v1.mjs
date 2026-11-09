#!/usr/bin/env node
/**
 * Pure local review preflight for a future Part 2 YouTube-only recovery.
 *
 * This runner reads only immutable local evidence. It has no armed branch,
 * credential access, network transport, upload, ledger/evidence write, retry,
 * Instagram mutation, Blob mutation, Part 1, or database authority.
 */

import { createHash } from "node:crypto";
import * as nodeFs from "node:fs";
import {
  basename,
  dirname,
  isAbsolute,
  relative,
  resolve,
} from "node:path";
import { fileURLToPath } from "node:url";

import {
  fingerprintMoneyShortsPublishAttemptBinding,
} from "../lib/money-shorts-publish-attempt-journal.mjs";
import {
  validateMoneyShortsFinalVideoOwnerApprovalEvidence,
} from "../lib/money-shorts-final-video-owner-approval.mjs";
import {
  MONEY_SHORTS_PART2_INSTAGRAM_RECOVERY_EXECUTION_TRANSITIONS,
  moneyShortsPart2InstagramRecoveryExecutionEventPath,
  moneyShortsPart2InstagramRecoveryExecutionPaths,
  validateMoneyShortsPart2InstagramRecoveryExecutionEvent,
  validateMoneyShortsPart2InstagramRecoveryExecutionResult,
  zeroMoneyShortsPart2InstagramRecoveryExecutionCounters,
} from "../lib/money-shorts-part2-instagram-recovery-execution.mjs";
import {
  moneyShortsPart2DualPublishSafePaths,
} from "../lib/money-shorts-part2-dual-publish-safe.mjs";
import {
  buildPublishLedgerKey,
  parsePublishLedgerBytesReadOnly,
} from "../lib/publish-ledger-runtime.mjs";
import {
  buildDualPlatformPublishPlan,
} from "./run-dual-platform-final-publish-orchestrator.mjs";

export const MONEY_SHORTS_PART2_YOUTUBE_RECOVERY_PREFLIGHT_VERSION =
  "money_shorts_part2_youtube_recovery_preflight_v1";
export const MONEY_SHORTS_PART2_YOUTUBE_RECOVERY_PREFLIGHT_INSPECTION =
  "INSPECT_PART2_YOUTUBE_RECOVERY_EVIDENCE_V1";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const REPO_ROOT = resolve(dirname(SCRIPT_PATH), "..");
const REPO_ROOT_REAL =
  typeof nodeFs.realpathSync.native === "function"
    ? nodeFs.realpathSync.native(REPO_ROOT)
    : nodeFs.realpathSync(REPO_ROOT);
const INSTAGRAM_VARIANT_ID =
  "instagram_reels_full_frame_1080x1920";
const YOUTUBE_VARIANT_ID =
  "youtube_shorts_letterbox_1080x1920";
const SHA256_RE = /^[a-f0-9]{64}$/;
const INSTAGRAM_ACCOUNT_ID_RE = /^[1-9][0-9]{5,31}$/;
const INSTAGRAM_MEDIA_ID_RE = /^[1-9][0-9]{5,39}$/;
const YOUTUBE_CHANNEL_ID_RE = /^UC[A-Za-z0-9_-]{22}$/;
const CONTENT_ID_RE =
  /^[A-Za-z0-9._:-]{1,240}-part-2$/;

const VALUE_FLAGS = Object.freeze([
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

const HASH_FLAGS = Object.freeze([
  "--expected-manifest-sha256",
  "--expected-source-sha256",
  "--expected-publication-attempt-fingerprint",
  "--expected-original-safe-result-file-sha256",
  "--expected-original-safe-result-fingerprint",
  "--expected-instagram-recovery-preflight-fingerprint",
  "--expected-instagram-recovery-claim-fingerprint",
  "--expected-instagram-recovery-result-file-sha256",
  "--expected-instagram-recovery-result-fingerprint",
  "--expected-ledger-sha256",
]);

const PATH_FLAGS = Object.freeze([
  "--content-unit",
  "--ledger",
  "--original-out-dir",
  "--instagram-recovery-out-dir",
]);

const SIDE_EFFECT_COUNTER_NAMES = Object.freeze([
  "credentialReadCount",
  "credentialValuePrintCount",
  "networkRequestCount",
  "youtubeChannelReadCount",
  "youtubeInsertCount",
  "instagramActionCount",
  "blobMutationCount",
  "ledgerWriteCount",
  "evidenceWriteCount",
  "filesystemMutationCount",
  "databaseMutationCount",
  "part1ActionCount",
  "automaticRetryCount",
]);

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function isPlainObject(value) {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function strictString(value) {
  return typeof value === "string" ? value : "";
}

function validIso(value) {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    Number.isFinite(Date.parse(value))
  );
}

function validInstagramPermalink(value) {
  if (typeof value !== "string") return false;
  try {
    const parsed = new URL(value);
    const segments = parsed.pathname
      .split("/")
      .filter(Boolean);
    return (
      parsed.protocol === "https:" &&
      parsed.hostname === "www.instagram.com" &&
      parsed.username === "" &&
      parsed.password === "" &&
      parsed.port === "" &&
      parsed.search === "" &&
      parsed.hash === "" &&
      segments.length === 2 &&
      segments[0] === "reel" &&
      /^[A-Za-z0-9_-]{5,80}$/.test(segments[1]) &&
      value ===
        `https://www.instagram.com/${segments.join("/")}/`
    );
  } catch {
    return false;
  }
}

function validYoutubeMetadata(value) {
  return (
    isPlainObject(value) &&
    strictString(value.titleBase).length > 0 &&
    strictString(value.titleWithShortsSuffix).length > 0 &&
    value.titleWithShortsSuffix.length <= 100 &&
    value.titleWithShortsSuffix.includes("#Shorts") &&
    strictString(value.descriptionBase).length >= 60 &&
    strictString(value.descriptionBase).length <= 5_000 &&
    Array.isArray(value.tags) &&
    value.tags.length >= 3 &&
    value.tags.length <= 8 &&
    new Set(value.tags).size === value.tags.length &&
    value.tags.every(
      (tag) =>
        typeof tag === "string" &&
        tag.length > 0 &&
        tag.length <= 500,
    ) &&
    value.categoryId === "27" &&
    value.defaultLanguage === "ko" &&
    value.privacyStatus === "public" &&
    value.selfDeclaredMadeForKids === false &&
    value.containsSyntheticMedia === true
  );
}

function fingerprinted(stable, field) {
  return {
    ...stable,
    [field]: sha256(JSON.stringify(stable)),
  };
}

function validSelfFingerprint(value, field) {
  if (
    !isPlainObject(value) ||
    !SHA256_RE.test(strictString(value[field]))
  ) {
    return false;
  }
  const { [field]: actual, ...stable } = value;
  return actual === sha256(JSON.stringify(stable));
}

function zeroSideEffectCounters() {
  return Object.fromEntries(
    SIDE_EFFECT_COUNTER_NAMES.map((name) => [name, 0]),
  );
}

function hasZeroSideEffectCounters(value) {
  return (
    isPlainObject(value) &&
    Object.keys(value).length ===
      SIDE_EFFECT_COUNTER_NAMES.length &&
    SIDE_EFFECT_COUNTER_NAMES.every(
      (name) => value[name] === 0,
    )
  );
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

function realExistingPath(candidatePath, fsImpl = nodeFs) {
  const absolute = resolve(candidatePath);
  if (!fsImpl.existsSync(absolute)) {
    throw new Error("existing_path_missing");
  }
  return resolve(
    typeof fsImpl.realpathSync.native === "function"
      ? fsImpl.realpathSync.native(absolute)
      : fsImpl.realpathSync(absolute),
  );
}

function outsideRepo(path) {
  return !pathInside(REPO_ROOT_REAL, path);
}

function readJsonEvidence(path, fsImpl = nodeFs) {
  try {
    const bytes = Buffer.from(fsImpl.readFileSync(path));
    const evidence = JSON.parse(bytes.toString("utf8"));
    return {
      ok: isPlainObject(evidence),
      evidence,
      bytes,
      sha256: sha256(bytes),
    };
  } catch {
    return {
      ok: false,
      evidence: null,
      bytes: null,
      sha256: null,
    };
  }
}

function committedSourcePath(path, fingerprint) {
  return `${path}.${fingerprint}.committed-source`;
}

function readCommittedPair({
  path,
  fingerprintField,
  expectedFingerprint,
  expectedFileSha256 = null,
  fsImpl = nodeFs,
}) {
  const canonical = readJsonEvidence(path, fsImpl);
  if (
    canonical.ok !== true ||
    canonical.evidence?.[fingerprintField] !==
      expectedFingerprint ||
    validSelfFingerprint(
      canonical.evidence,
      fingerprintField,
    ) !== true ||
    (expectedFileSha256 !== null &&
      canonical.sha256 !== expectedFileSha256)
  ) {
    return {
      ok: false,
      reason:
        "PART2_YOUTUBE_RECOVERY_PREFLIGHT_CANONICAL_EVIDENCE_INVALID",
    };
  }
  const expectedCommittedPath = committedSourcePath(
    path,
    expectedFingerprint,
  );
  const committed = readJsonEvidence(
    expectedCommittedPath,
    fsImpl,
  );
  let siblings;
  try {
    const prefix = `${basename(path)}.`;
    siblings = fsImpl
      .readdirSync(dirname(path))
      .filter(
        (name) =>
          name.startsWith(prefix) &&
          name.endsWith(".committed-source"),
      );
  } catch {
    siblings = null;
  }
  if (
    committed.ok !== true ||
    committed.sha256 !== canonical.sha256 ||
    !committed.bytes.equals(canonical.bytes) ||
    !Array.isArray(siblings) ||
    siblings.length !== 1 ||
    siblings[0] !== basename(expectedCommittedPath)
  ) {
    return {
      ok: false,
      reason:
        "PART2_YOUTUBE_RECOVERY_PREFLIGHT_COMMITTED_PAIR_INVALID",
    };
  }
  return {
    ok: true,
    path,
    committedPath: expectedCommittedPath,
    evidence: canonical.evidence,
    bytes: canonical.bytes,
    sha256: canonical.sha256,
  };
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

export function parseMoneyShortsPart2YoutubeRecoveryPreflightArgs(
  argv,
) {
  const values = Object.create(null);
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (
      token === "--arm" ||
      token === "--execute" ||
      token === "--retry"
    ) {
      return {
        ok: false,
        reason:
          "PART2_YOUTUBE_RECOVERY_PREFLIGHT_LIVE_FLAG_FORBIDDEN",
      };
    }
    if (
      !VALUE_FLAGS.includes(token) ||
      Object.hasOwn(values, token)
    ) {
      return {
        ok: false,
        reason:
          "PART2_YOUTUBE_RECOVERY_PREFLIGHT_UNKNOWN_OR_DUPLICATE_ARGUMENT",
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
          "PART2_YOUTUBE_RECOVERY_PREFLIGHT_ARGUMENT_VALUE_INVALID",
      };
    }
    values[token] = value;
    index += 1;
  }
  if (
    !VALUE_FLAGS.every(
      (flag) => typeof values[flag] === "string",
    ) ||
    values["--inspection"] !==
      MONEY_SHORTS_PART2_YOUTUBE_RECOVERY_PREFLIGHT_INSPECTION ||
    !PATH_FLAGS.every((flag) =>
      isAbsolute(values[flag] ?? ""),
    ) ||
    !HASH_FLAGS.every((flag) =>
      SHA256_RE.test(values[flag] ?? ""),
    ) ||
    !CONTENT_ID_RE.test(
      values["--expected-content-id"] ?? "",
    ) ||
    !INSTAGRAM_ACCOUNT_ID_RE.test(
      values["--expected-instagram-account-id"] ?? "",
    ) ||
    !INSTAGRAM_MEDIA_ID_RE.test(
      values["--expected-instagram-media-id"] ?? "",
    ) ||
    !YOUTUBE_CHANNEL_ID_RE.test(
      values["--expected-youtube-channel-id"] ?? "",
    )
  ) {
    return {
      ok: false,
      reason:
        "PART2_YOUTUBE_RECOVERY_PREFLIGHT_EXACT_ARGUMENTS_REQUIRED",
    };
  }
  return {
    ok: true,
    inspection: values["--inspection"],
    contentUnitPath: values["--content-unit"],
    ledgerPath: values["--ledger"],
    originalOutDir: values["--original-out-dir"],
    instagramRecoveryOutDir:
      values["--instagram-recovery-out-dir"],
    expectedContentId:
      values["--expected-content-id"],
    expectedManifestSha256:
      values["--expected-manifest-sha256"],
    expectedSourceSha256:
      values["--expected-source-sha256"],
    expectedPublicationAttemptFingerprint:
      values[
        "--expected-publication-attempt-fingerprint"
      ],
    expectedInstagramAccountId:
      values["--expected-instagram-account-id"],
    expectedInstagramMediaId:
      values["--expected-instagram-media-id"],
    expectedYoutubeChannelId:
      values["--expected-youtube-channel-id"],
    expectedOriginalSafeResultFileSha256:
      values[
        "--expected-original-safe-result-file-sha256"
      ],
    expectedOriginalSafeResultFingerprint:
      values[
        "--expected-original-safe-result-fingerprint"
      ],
    expectedInstagramRecoveryPreflightFingerprint:
      values[
        "--expected-instagram-recovery-preflight-fingerprint"
      ],
    expectedInstagramRecoveryClaimFingerprint:
      values[
        "--expected-instagram-recovery-claim-fingerprint"
      ],
    expectedInstagramRecoveryResultFileSha256:
      values[
        "--expected-instagram-recovery-result-file-sha256"
      ],
    expectedInstagramRecoveryResultFingerprint:
      values[
        "--expected-instagram-recovery-result-fingerprint"
      ],
    expectedLedgerSha256:
      values["--expected-ledger-sha256"],
  };
}

function resolveInputPaths(parsed, fsImpl = nodeFs) {
  try {
    const paths = {
      contentUnitPath: realExistingPath(
        parsed.contentUnitPath,
        fsImpl,
      ),
      ledgerPath: realExistingPath(
        parsed.ledgerPath,
        fsImpl,
      ),
      originalOutDir: realExistingPath(
        parsed.originalOutDir,
        fsImpl,
      ),
      instagramRecoveryOutDir: realExistingPath(
        parsed.instagramRecoveryOutDir,
        fsImpl,
      ),
    };
    if (
      !Object.values(paths).every(outsideRepo) ||
      !fsImpl.statSync(paths.originalOutDir).isDirectory() ||
      !fsImpl
        .statSync(paths.instagramRecoveryOutDir)
        .isDirectory() ||
      dirname(paths.contentUnitPath).toLowerCase() !==
        paths.originalOutDir.toLowerCase() ||
      pathInside(
        paths.originalOutDir,
        paths.instagramRecoveryOutDir,
      ) ||
      pathInside(
        paths.instagramRecoveryOutDir,
        paths.originalOutDir,
      ) ||
      pathInside(
        paths.instagramRecoveryOutDir,
        paths.contentUnitPath,
      ) ||
      pathInside(
        paths.instagramRecoveryOutDir,
        paths.ledgerPath,
      )
    ) {
      return {
        ok: false,
        reason:
          "PART2_YOUTUBE_RECOVERY_PREFLIGHT_REAL_PATH_INVALID",
      };
    }
    return { ok: true, paths };
  } catch {
    return {
      ok: false,
      reason:
        "PART2_YOUTUBE_RECOVERY_PREFLIGHT_INPUT_PATH_UNRESOLVABLE",
    };
  }
}

function inspectContentUnit({
  paths,
  parsed,
  fsImpl = nodeFs,
}) {
  const manifest = readJsonEvidence(
    paths.contentUnitPath,
    fsImpl,
  );
  const unit = manifest.evidence;
  if (
    manifest.ok !== true ||
    unit?.schemaVersion !==
      "dual_platform_content_unit_v1" ||
    unit.wizardProductionPartId !== "part-2" ||
    unit.sourceIntegrity?.productionPartId !== "part-2" ||
    unit.series?.totalParts !== 2 ||
    unit.series?.partNumber !== 2 ||
    unit.contentId !== parsed.expectedContentId ||
    strictString(unit.version).length === 0 ||
    manifest.sha256 !== parsed.expectedManifestSha256
  ) {
    return {
      ok: false,
      reason:
        "PART2_YOUTUBE_RECOVERY_PREFLIGHT_CONTENT_UNIT_INVALID",
    };
  }
  let instagramSourcePath;
  let youtubeSourcePath;
  try {
    instagramSourcePath = realExistingPath(
      unit.instagramSourcePath,
      fsImpl,
    );
    youtubeSourcePath = realExistingPath(
      unit.youtubeSourcePath,
      fsImpl,
    );
  } catch {
    return {
      ok: false,
      reason:
        "PART2_YOUTUBE_RECOVERY_PREFLIGHT_SOURCE_PATH_INVALID",
    };
  }
  if (
    !outsideRepo(instagramSourcePath) ||
    !outsideRepo(youtubeSourcePath)
  ) {
    return {
      ok: false,
      reason:
        "PART2_YOUTUBE_RECOVERY_PREFLIGHT_SOURCE_PATH_INVALID",
    };
  }
  const instagramSourceBytes = Buffer.from(
    fsImpl.readFileSync(instagramSourcePath),
  );
  const youtubeSourceBytes = Buffer.from(
    fsImpl.readFileSync(youtubeSourcePath),
  );
  const instagramSourceSha256 = sha256(
    instagramSourceBytes,
  );
  const youtubeSourceSha256 = sha256(youtubeSourceBytes);
  const instagramSourceSize =
    fsImpl.statSync(instagramSourcePath).size;
  const youtubeSourceSize =
    fsImpl.statSync(youtubeSourcePath).size;
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
  const youtubeJob = publishPlan.jobs.find(
    (job) => job.id === "youtube_job",
  );
  const currentBinding = {
    contentId: unit.contentId,
    version: unit.version,
    productionPartId: "part-2",
    contentUnitManifestPath: paths.contentUnitPath,
    contentUnitSha256: manifest.sha256,
    instagramSourceSha256,
    youtubeSourceSha256,
    publishMetadataSha256: metadataSha256,
    finalVideoApprovalFingerprint:
      sourceIntegrity.finalVideoApprovalFingerprint,
  };
  const metadata = unit.youtubeMetadata;
  if (
    instagramSourceSha256 !== parsed.expectedSourceSha256 ||
    youtubeSourceSha256 !== instagramSourceSha256 ||
    instagramSourceSize !== youtubeSourceSize ||
    sourceIntegrity.sizeBytes !== instagramSourceSize ||
    sourceIntegrity.finalMp4Sha256 !==
      instagramSourceSha256 ||
    sourceIntegrity.publishMetadataSha256 !== metadataSha256 ||
    sourceIntegrity.rootTopicId !== unit.wizardTopicId ||
    ownerApproval.accepted !== true ||
    ownerApproval.finalVideoApprovalFingerprint !==
      sourceIntegrity.finalVideoApprovalFingerprint ||
    fingerprintMoneyShortsPublishAttemptBinding(
      currentBinding,
    ) !== parsed.expectedPublicationAttemptFingerprint ||
    youtubeJob?.metadataOptimizationGate?.ok !== true ||
    youtubeJob.variantId !== YOUTUBE_VARIANT_ID ||
    youtubeJob.sourcePath !== unit.youtubeSourcePath ||
    JSON.stringify(youtubeJob.metadata) !==
      JSON.stringify(metadata) ||
    metadata?.privacyStatus !== "public" ||
    metadata?.categoryId !== "27" ||
    metadata?.defaultLanguage !== "ko" ||
    metadata?.selfDeclaredMadeForKids !== false ||
    metadata?.containsSyntheticMedia !== true
  ) {
    return {
      ok: false,
      reason:
        "PART2_YOUTUBE_RECOVERY_PREFLIGHT_APPROVED_ARTIFACT_MISMATCH",
    };
  }
  return {
    ok: true,
    unit,
    currentBinding,
    instagramSourcePath,
    youtubeSourcePath,
    youtubeSourceSize,
    youtubeMetadata: metadata,
    youtubeVariantId: youtubeJob.variantId,
  };
}

function inspectOriginalSafeResult({
  paths,
  parsed,
  fsImpl = nodeFs,
}) {
  const safePaths = moneyShortsPart2DualPublishSafePaths(
    paths.originalOutDir,
  );
  const result = readCommittedPair({
    path: safePaths.resultPath,
    fingerprintField: "resultFingerprint",
    expectedFingerprint:
      parsed.expectedOriginalSafeResultFingerprint,
    expectedFileSha256:
      parsed.expectedOriginalSafeResultFileSha256,
    fsImpl,
  });
  const evidence = result.evidence;
  if (
    result.ok !== true ||
    evidence.status !==
      "INSTAGRAM_CONTAINER_OUTCOME_UNKNOWN" ||
    evidence.blockerCode !==
      "PART2_DUAL_SAFE_INSTAGRAM_CONTAINER_NO_ID" ||
    evidence.publicState?.instagram?.outcome !== "unknown" ||
    evidence.publicState?.instagram?.mediaId !== null ||
    evidence.publicState?.youtube?.outcome !== "not_started" ||
    evidence.publicState?.youtube?.videoId !== null ||
    evidence.sideEffectCounters?.youtubeInsertCount !== 0 ||
    evidence.sideEffectCounters?.instagramPublishCount !== 0 ||
    evidence.sideEffectCounters?.ledgerWriteCount !== 0 ||
    evidence.automaticRetryAllowed !== false ||
    evidence.externalRecoveryEnabled !== false ||
    evidence.part1ActionAllowed !== false
  ) {
    return {
      ok: false,
      reason:
        "PART2_YOUTUBE_RECOVERY_PREFLIGHT_ORIGINAL_YOUTUBE_STATE_INVALID",
    };
  }
  return {
    ok: true,
    result,
    evidence,
  };
}

function inspectInstagramRecovery({
  paths,
  parsed,
  fsImpl = nodeFs,
}) {
  const recoveryPaths =
    moneyShortsPart2InstagramRecoveryExecutionPaths(
      paths.instagramRecoveryOutDir,
    );
  if (
    fsImpl.existsSync(recoveryPaths.lockPath) ||
    !fsImpl.existsSync(recoveryPaths.eventDir)
  ) {
    return {
      ok: false,
      reason:
        "PART2_YOUTUBE_RECOVERY_PREFLIGHT_INSTAGRAM_RECOVERY_LAYOUT_INVALID",
    };
  }
  const preflight = readCommittedPair({
    path: recoveryPaths.preflightPath,
    fingerprintField: "preflightFingerprint",
    expectedFingerprint:
      parsed.expectedInstagramRecoveryPreflightFingerprint,
    fsImpl,
  });
  const claim = readCommittedPair({
    path: recoveryPaths.claimPath,
    fingerprintField: "claimFingerprint",
    expectedFingerprint:
      parsed.expectedInstagramRecoveryClaimFingerprint,
    fsImpl,
  });
  if (
    preflight.ok !== true ||
    claim.ok !== true ||
    preflight.evidence.status !== "PREFLIGHT_ONLY_OK" ||
    preflight.evidence.armed !== false ||
    preflight.evidence.executionAuthorized !== false ||
    JSON.stringify(preflight.evidence.sideEffectCounters) !==
      JSON.stringify(
        zeroMoneyShortsPart2InstagramRecoveryExecutionCounters(),
      ) ||
    claim.evidence.armed !== true ||
    claim.evidence.preflightFingerprint !==
      parsed.expectedInstagramRecoveryPreflightFingerprint ||
    claim.evidence.currentBinding?.contentId !==
      parsed.expectedContentId ||
    claim.evidence.currentBinding?.contentUnitSha256 !==
      parsed.expectedManifestSha256 ||
    claim.evidence.currentBinding?.instagramSourceSha256 !==
      parsed.expectedSourceSha256 ||
    claim.evidence.currentBinding?.youtubeSourceSha256 !==
      parsed.expectedSourceSha256 ||
    claim.evidence.expectedInstagramAccountId !==
      parsed.expectedInstagramAccountId ||
    claim.evidence.expectedYoutubeChannelId !==
      parsed.expectedYoutubeChannelId
  ) {
    return {
      ok: false,
      reason:
        "PART2_YOUTUBE_RECOVERY_PREFLIGHT_INSTAGRAM_CLAIM_INVALID",
    };
  }

  let previousEvidenceSha256 = claim.sha256;
  let previousTransition = null;
  let latestEvent = null;
  let latestEventFileSha256 = null;
  const expectedEventNames = new Set();
  for (const transition of
    MONEY_SHORTS_PART2_INSTAGRAM_RECOVERY_EXECUTION_TRANSITIONS) {
    const eventPath =
      moneyShortsPart2InstagramRecoveryExecutionEventPath(
        recoveryPaths.eventDir,
        transition,
      );
    const canonical = readJsonEvidence(eventPath, fsImpl);
    if (
      canonical.ok !== true ||
      !SHA256_RE.test(
        strictString(canonical.evidence?.eventFingerprint),
      )
    ) {
      return {
        ok: false,
        reason:
          "PART2_YOUTUBE_RECOVERY_PREFLIGHT_INSTAGRAM_EVENT_MISSING",
      };
    }
    const eventPair = readCommittedPair({
      path: eventPath,
      fingerprintField: "eventFingerprint",
      expectedFingerprint:
        canonical.evidence.eventFingerprint,
      fsImpl,
    });
    const validation =
      validateMoneyShortsPart2InstagramRecoveryExecutionEvent(
        {
          evidence: eventPair.evidence,
          claim: claim.evidence,
          previousEvidenceSha256,
          previousTransition,
        },
      );
    if (
      eventPair.ok !== true ||
      validation.valid !== true ||
      eventPair.evidence.transition !== transition
    ) {
      return {
        ok: false,
        reason:
          "PART2_YOUTUBE_RECOVERY_PREFLIGHT_INSTAGRAM_EVENT_CHAIN_INVALID",
      };
    }
    expectedEventNames.add(basename(eventPath));
    expectedEventNames.add(
      basename(eventPair.committedPath),
    );
    previousEvidenceSha256 = eventPair.sha256;
    previousTransition = transition;
    latestEvent = eventPair.evidence;
    latestEventFileSha256 = eventPair.sha256;
  }
  let actualEventNames;
  try {
    actualEventNames = new Set(
      fsImpl.readdirSync(recoveryPaths.eventDir),
    );
  } catch {
    actualEventNames = null;
  }
  if (
    !(actualEventNames instanceof Set) ||
    actualEventNames.size !== expectedEventNames.size ||
    [...actualEventNames].some(
      (name) => !expectedEventNames.has(name),
    )
  ) {
    return {
      ok: false,
      reason:
        "PART2_YOUTUBE_RECOVERY_PREFLIGHT_INSTAGRAM_EVENT_LAYOUT_INVALID",
    };
  }

  const result = readCommittedPair({
    path: recoveryPaths.resultPath,
    fingerprintField: "resultFingerprint",
    expectedFingerprint:
      parsed.expectedInstagramRecoveryResultFingerprint,
    expectedFileSha256:
      parsed.expectedInstagramRecoveryResultFileSha256,
    fsImpl,
  });
  const resultValidation =
    validateMoneyShortsPart2InstagramRecoveryExecutionResult(
      {
        evidence: result.evidence,
        claim: claim.evidence,
        latestEvent,
        latestEventFileSha256,
      },
    );
  const evidence = result.evidence;
  if (
    result.ok !== true ||
    resultValidation.valid !== true ||
    evidence.status !== "PART2_INSTAGRAM_RECOVERY_OK" ||
    evidence.blockerCode !== null ||
    evidence.preflightFingerprint !==
      parsed.expectedInstagramRecoveryPreflightFingerprint ||
    evidence.claimFingerprint !==
      parsed.expectedInstagramRecoveryClaimFingerprint ||
    evidence.currentBinding?.contentId !==
      parsed.expectedContentId ||
    evidence.currentBinding?.contentUnitSha256 !==
      parsed.expectedManifestSha256 ||
    evidence.currentBinding?.instagramSourceSha256 !==
      parsed.expectedSourceSha256 ||
    evidence.currentBinding?.youtubeSourceSha256 !==
      parsed.expectedSourceSha256 ||
    evidence.expectedInstagramAccountId !==
      parsed.expectedInstagramAccountId ||
    evidence.expectedYoutubeChannelId !==
      parsed.expectedYoutubeChannelId ||
    evidence.publicState?.instagram?.publishOutcome !==
      "confirmed_published" ||
    evidence.publicState?.instagram?.mediaVerified !== true ||
    evidence.publicState?.instagram?.mediaId !==
      parsed.expectedInstagramMediaId ||
    !validIso(
      evidence.publicState?.instagram?.publishedAtIso,
    ) ||
    evidence.sideEffectCounters?.youtubeActionCount !== 0 ||
    evidence.publicState?.forbidden?.youtubeActionCount !== 0 ||
    evidence.sideEffectCounters?.blobPutCount !== 0 ||
    evidence.sideEffectCounters?.part1ActionCount !== 0 ||
    evidence.sideEffectCounters?.databaseMutationCount !== 0 ||
    evidence.sideEffectCounters?.automaticRetryCount !== 0 ||
    evidence.sideEffectCounters?.credentialValuePrintCount !== 0 ||
    evidence.safety?.automaticRetryAllowed !== false ||
    evidence.safety?.youtubeActionAllowed !== false ||
    evidence.safety?.part1ActionAllowed !== false ||
    evidence.safety?.databaseMutationAllowed !== false
  ) {
    return {
      ok: false,
      reason:
        "PART2_YOUTUBE_RECOVERY_PREFLIGHT_INSTAGRAM_RESULT_INVALID",
    };
  }
  let evidenceEntries;
  let recoveryRootEntries;
  try {
    evidenceEntries = new Set(
      fsImpl.readdirSync(recoveryPaths.evidenceDir),
    );
    recoveryRootEntries = new Set(
      fsImpl.readdirSync(paths.instagramRecoveryOutDir),
    );
  } catch {
    evidenceEntries = null;
    recoveryRootEntries = null;
  }
  const expectedEvidenceEntries = new Set([
    basename(recoveryPaths.preflightPath),
    basename(preflight.committedPath),
    basename(recoveryPaths.claimPath),
    basename(claim.committedPath),
    basename(recoveryPaths.resultPath),
    basename(result.committedPath),
    basename(recoveryPaths.eventDir),
  ]);
  if (
    !(evidenceEntries instanceof Set) ||
    evidenceEntries.size !== expectedEvidenceEntries.size ||
    [...evidenceEntries].some(
      (name) => !expectedEvidenceEntries.has(name),
    ) ||
    !(recoveryRootEntries instanceof Set) ||
    recoveryRootEntries.size !== 1 ||
    !recoveryRootEntries.has(
      basename(recoveryPaths.evidenceDir),
    )
  ) {
    return {
      ok: false,
      reason:
        "PART2_YOUTUBE_RECOVERY_PREFLIGHT_INSTAGRAM_RECOVERY_LAYOUT_INVALID",
    };
  }
  return {
    ok: true,
    recoveryPaths,
    preflight,
    claim,
    result,
    evidence,
  };
}

function inspectLedger({
  paths,
  parsed,
  content,
  instagramRecovery,
  fsImpl = nodeFs,
}) {
  let bytes;
  try {
    bytes = Buffer.from(
      fsImpl.readFileSync(paths.ledgerPath),
    );
  } catch {
    return {
      ok: false,
      reason:
        "PART2_YOUTUBE_RECOVERY_PREFLIGHT_LEDGER_READ_FAILED",
    };
  }
  const ledgerSha256 = sha256(bytes);
  const parsedLedger =
    parsePublishLedgerBytesReadOnly(bytes);
  if (
    parsedLedger.ok !== true ||
    parsedLedger.existed !== true ||
    ledgerSha256 !== parsed.expectedLedgerSha256
  ) {
    return {
      ok: false,
      reason:
        "PART2_YOUTUBE_RECOVERY_PREFLIGHT_LEDGER_INVALID",
    };
  }
  const instagramKey = buildPublishLedgerKey(
    parsed.expectedContentId,
    "instagram_reels",
    content.unit.version,
  );
  const youtubeKey = buildPublishLedgerKey(
    parsed.expectedContentId,
    "youtube_shorts",
    content.unit.version,
  );
  const matchingRecords =
    parsedLedger.ledger.records.filter(
      (record) =>
        record.contentId === parsed.expectedContentId,
    );
  const instagramRecord =
    matchingRecords.find(
      (record) => record.key === instagramKey,
    ) ?? null;
  const youtubeRecord =
    matchingRecords.find(
      (record) => record.key === youtubeKey,
    ) ?? null;
  const instagramState =
    instagramRecovery.evidence.publicState.instagram;
  if (
    matchingRecords.length !== 1 ||
    instagramRecord === null ||
    youtubeRecord !== null ||
    instagramRecord.platform !== "instagram_reels" ||
    instagramRecord.version !== content.unit.version ||
    instagramRecord.variantId !== INSTAGRAM_VARIANT_ID ||
    instagramRecord.publishedId !==
      parsed.expectedInstagramMediaId ||
    instagramRecord.publishedUrl !==
      instagramState.permalink ||
    instagramRecord.status !== "published" ||
    !validIso(instagramRecord.publishedAtIso) ||
    Date.parse(instagramRecord.publishedAtIso) !==
      Date.parse(instagramState.publishedAtIso) ||
    instagramRecord.metadata?.sourceSha256 !==
      parsed.expectedSourceSha256 ||
    instagramRecord.metadata?.accountId !==
      parsed.expectedInstagramAccountId ||
    instagramRecord.metadata
      ?.recoveryPreflightFingerprint !==
      parsed.expectedInstagramRecoveryPreflightFingerprint ||
    instagramRecord.metadata?.recoveryClaimFingerprint !==
      parsed.expectedInstagramRecoveryClaimFingerprint ||
    instagramRecovery.evidence.publicState?.ledger
      ?.currentSha256 !== ledgerSha256 ||
    instagramRecovery.evidence.publicState?.ledger
      ?.recordedKey !== instagramKey ||
    instagramRecovery.evidence.publicState?.ledger
      ?.publishedId !== parsed.expectedInstagramMediaId ||
    instagramRecovery.evidence.publicState?.ledger
      ?.writeOk !== true ||
    instagramRecovery.evidence.publicState?.ledger
      ?.readbackOk !== true
  ) {
    return {
      ok: false,
      reason:
        "PART2_YOUTUBE_RECOVERY_PREFLIGHT_LEDGER_BINDING_INVALID",
    };
  }
  return {
    ok: true,
    ledger: parsedLedger.ledger,
    sha256: ledgerSha256,
    instagramKey,
    youtubeKey,
    instagramRecord,
    youtubeRecord,
  };
}

function validFacts(facts) {
  return (
    isPlainObject(facts) &&
    isPlainObject(facts.currentBinding) &&
    facts.currentBinding.productionPartId === "part-2" &&
    CONTENT_ID_RE.test(facts.currentBinding.contentId) &&
    SHA256_RE.test(facts.currentBinding.contentUnitSha256) &&
    SHA256_RE.test(
      facts.currentBinding.youtubeSourceSha256,
    ) &&
    strictString(facts.currentBinding.version).length > 0 &&
    strictString(
      facts.currentBinding.contentUnitManifestPath,
    ).length > 0 &&
    SHA256_RE.test(
      facts.currentBinding.publishMetadataSha256,
    ) &&
    SHA256_RE.test(
      facts.currentBinding.finalVideoApprovalFingerprint,
    ) &&
    facts.currentBinding.youtubeSourceSha256 ===
      facts.currentBinding.instagramSourceSha256 &&
    isPlainObject(facts.originalAttempt) &&
    facts.originalAttempt.status ===
      "INSTAGRAM_CONTAINER_OUTCOME_UNKNOWN" &&
    facts.originalAttempt.blockerCode ===
      "PART2_DUAL_SAFE_INSTAGRAM_CONTAINER_NO_ID" &&
    facts.originalAttempt.youtubeOutcome === "not_started" &&
    facts.originalAttempt.youtubeInsertCount === 0 &&
    SHA256_RE.test(
      facts.originalAttempt.safeResultFileSha256,
    ) &&
    SHA256_RE.test(
      facts.originalAttempt.safeResultFingerprint,
    ) &&
    isPlainObject(facts.instagramRecovery) &&
    facts.instagramRecovery.status ===
      "PART2_INSTAGRAM_RECOVERY_OK" &&
    INSTAGRAM_ACCOUNT_ID_RE.test(
      facts.instagramRecovery.accountId,
    ) &&
    INSTAGRAM_MEDIA_ID_RE.test(
      facts.instagramRecovery.mediaId,
    ) &&
    validInstagramPermalink(
      facts.instagramRecovery.permalink,
    ) &&
    validIso(facts.instagramRecovery.publishedAtIso) &&
    SHA256_RE.test(
      facts.instagramRecovery.resultFileSha256,
    ) &&
    SHA256_RE.test(
      facts.instagramRecovery.resultFingerprint,
    ) &&
    SHA256_RE.test(
      facts.instagramRecovery.preflightFingerprint,
    ) &&
    SHA256_RE.test(
      facts.instagramRecovery.claimFingerprint,
    ) &&
    SHA256_RE.test(
      facts.instagramRecovery.planFingerprint,
    ) &&
    isPlainObject(facts.youtube) &&
    facts.youtube.outcome === "confirmed_not_started" &&
    facts.youtube.videoId === null &&
    facts.youtube.variantId === YOUTUBE_VARIANT_ID &&
    strictString(facts.youtube.sourcePath).length > 0 &&
    facts.youtube.sourceSha256 ===
      facts.currentBinding.youtubeSourceSha256 &&
    Number.isSafeInteger(facts.youtube.sourceSizeBytes) &&
    facts.youtube.sourceSizeBytes > 0 &&
    facts.youtube.metadataSha256 ===
      facts.currentBinding.publishMetadataSha256 &&
    validYoutubeMetadata(facts.youtube.metadata) &&
    YOUTUBE_CHANNEL_ID_RE.test(
      facts.youtube.expectedChannelId,
    ) &&
    facts.youtube.actionAllowed === false &&
    isPlainObject(facts.ledger) &&
    SHA256_RE.test(facts.ledger.sha256) &&
    strictString(facts.ledger.path).length > 0 &&
    facts.ledger.instagramRecordConfirmed === true &&
    strictString(facts.ledger.instagramRecordedKey) ===
      `${facts.currentBinding.contentId}/instagram_reels/${facts.currentBinding.version}` &&
    facts.ledger.instagramPublishedId ===
      facts.instagramRecovery.mediaId &&
    facts.ledger.youtubeRecordAbsent === true &&
    strictString(facts.ledger.expectedYoutubeKey) ===
      `${facts.currentBinding.contentId}/youtube_shorts/${facts.currentBinding.version}`
  );
}

export function buildMoneyShortsPart2YoutubeRecoveryPreflightPlan({
  facts,
}) {
  if (!validFacts(facts)) {
    return {
      ok: false,
      reason:
        "PART2_YOUTUBE_RECOVERY_PREFLIGHT_FACTS_INVALID",
    };
  }
  const stable = {
    schemaVersion:
      MONEY_SHORTS_PART2_YOUTUBE_RECOVERY_PREFLIGHT_VERSION,
    mode: "part2_youtube_only_recovery_review",
    currentBinding: structuredClone(facts.currentBinding),
    originalAttempt: structuredClone(
      facts.originalAttempt,
    ),
    instagramRecovery: structuredClone(
      facts.instagramRecovery,
    ),
    youtube: structuredClone(facts.youtube),
    ledger: structuredClone(facts.ledger),
    safety: {
      readyForActualExecution: false,
      ownerApprovalRequired: true,
      actualUploadAllowed: false,
      credentialAccessAllowed: false,
      networkAllowed: false,
      youtubeActionAllowed: false,
      instagramActionAllowed: false,
      blobMutationAllowed: false,
      ledgerMutationAllowed: false,
      evidenceWriteAllowed: false,
      filesystemMutationAllowed: false,
      databaseMutationAllowed: false,
      part1ActionAllowed: false,
      automaticRetryAllowed: false,
    },
  };
  return {
    ok: true,
    plan: fingerprinted(stable, "planFingerprint"),
  };
}

export function buildMoneyShortsPart2YoutubeRecoveryPreflight({
  plan,
}) {
  if (
    !isPlainObject(plan) ||
    !validSelfFingerprint(plan, "planFingerprint")
  ) {
    return null;
  }
  const stable = {
    schemaVersion:
      MONEY_SHORTS_PART2_YOUTUBE_RECOVERY_PREFLIGHT_VERSION,
    evidenceType: "review_preflight",
    status:
      "LOCAL_PART2_YOUTUBE_RECOVERY_PREFLIGHT_OK",
    readyForActualExecution: false,
    safeToUpload: false,
    ownerApprovalRequired: true,
    plan: structuredClone(plan),
    sideEffectCounters: zeroSideEffectCounters(),
  };
  return fingerprinted(stable, "preflightFingerprint");
}

export function validateMoneyShortsPart2YoutubeRecoveryPreflight({
  evidence,
  currentPlan,
  expectedPreflightFingerprint,
}) {
  const rebuilt =
    buildMoneyShortsPart2YoutubeRecoveryPreflight({
      plan: currentPlan,
    });
  const valid =
    rebuilt !== null &&
    SHA256_RE.test(expectedPreflightFingerprint) &&
    rebuilt.preflightFingerprint ===
      expectedPreflightFingerprint &&
    JSON.stringify(rebuilt) === JSON.stringify(evidence) &&
    hasZeroSideEffectCounters(
      evidence.sideEffectCounters,
    );
  return {
    valid,
    reason: valid
      ? "part2_youtube_recovery_preflight_valid"
      : "part2_youtube_recovery_preflight_invalid",
  };
}

export function inspectMoneyShortsPart2YoutubeRecoveryEvidence({
  parsed,
  fsImpl = nodeFs,
}) {
  const resolved = resolveInputPaths(parsed, fsImpl);
  if (!resolved.ok) return resolved;
  const content = inspectContentUnit({
    paths: resolved.paths,
    parsed,
    fsImpl,
  });
  if (!content.ok) return content;
  const originalAttempt = inspectOriginalSafeResult({
    paths: resolved.paths,
    parsed,
    fsImpl,
  });
  if (!originalAttempt.ok) return originalAttempt;
  const instagramRecovery = inspectInstagramRecovery({
    paths: resolved.paths,
    parsed,
    fsImpl,
  });
  if (!instagramRecovery.ok) return instagramRecovery;
  if (
    JSON.stringify(
      instagramRecovery.evidence.currentBinding,
    ) !== JSON.stringify(content.currentBinding)
  ) {
    return {
      ok: false,
      reason:
        "PART2_YOUTUBE_RECOVERY_PREFLIGHT_CURRENT_BINDING_DRIFT",
    };
  }
  const ledger = inspectLedger({
    paths: resolved.paths,
    parsed,
    content,
    instagramRecovery,
    fsImpl,
  });
  if (!ledger.ok) return ledger;
  return {
    ok: true,
    facts: {
      currentBinding: content.currentBinding,
      originalAttempt: {
        safeResultFileSha256:
          originalAttempt.result.sha256,
        safeResultFingerprint:
          originalAttempt.evidence.resultFingerprint,
        status: originalAttempt.evidence.status,
        blockerCode:
          originalAttempt.evidence.blockerCode,
        youtubeOutcome: "not_started",
        youtubeInsertCount: 0,
      },
      instagramRecovery: {
        status: instagramRecovery.evidence.status,
        resultFileSha256:
          instagramRecovery.result.sha256,
        resultFingerprint:
          instagramRecovery.evidence.resultFingerprint,
        preflightFingerprint:
          instagramRecovery.evidence.preflightFingerprint,
        claimFingerprint:
          instagramRecovery.evidence.claimFingerprint,
        planFingerprint:
          instagramRecovery.evidence.planFingerprint,
        accountId:
          instagramRecovery.evidence
            .expectedInstagramAccountId,
        mediaId:
          instagramRecovery.evidence.publicState.instagram
            .mediaId,
        permalink:
          instagramRecovery.evidence.publicState.instagram
            .permalink,
        publishedAtIso:
          instagramRecovery.evidence.publicState.instagram
            .publishedAtIso,
      },
      youtube: {
        outcome: "confirmed_not_started",
        videoId: null,
        sourcePath: content.youtubeSourcePath,
        sourceSha256:
          content.currentBinding.youtubeSourceSha256,
        sourceSizeBytes: content.youtubeSourceSize,
        variantId: content.youtubeVariantId,
        metadataSha256:
          content.currentBinding.publishMetadataSha256,
        metadata: structuredClone(
          content.youtubeMetadata,
        ),
        expectedChannelId:
          parsed.expectedYoutubeChannelId,
        actionAllowed: false,
      },
      ledger: {
        path: resolved.paths.ledgerPath,
        sha256: ledger.sha256,
        instagramRecordConfirmed: true,
        instagramRecordedKey: ledger.instagramKey,
        instagramPublishedId:
          ledger.instagramRecord.publishedId,
        youtubeRecordAbsent: true,
        expectedYoutubeKey: ledger.youtubeKey,
      },
    },
  };
}

async function runWithInspector({
  argv,
  inspector,
}) {
  const parsed =
    parseMoneyShortsPart2YoutubeRecoveryPreflightArgs(
      argv,
    );
  if (!parsed.ok) return parsed;
  const firstInspection = await inspector({ parsed });
  if (!firstInspection?.ok) {
    return (
      firstInspection ?? {
        ok: false,
        reason:
          "PART2_YOUTUBE_RECOVERY_PREFLIGHT_INSPECTION_FAILED",
      }
    );
  }
  const secondInspection = await inspector({ parsed });
  if (!secondInspection?.ok) {
    return (
      secondInspection ?? {
        ok: false,
        reason:
          "PART2_YOUTUBE_RECOVERY_PREFLIGHT_INSPECTION_FAILED",
      }
    );
  }
  if (
    JSON.stringify(firstInspection.facts) !==
    JSON.stringify(secondInspection.facts)
  ) {
    return {
      ok: false,
      reason:
        "PART2_YOUTUBE_RECOVERY_PREFLIGHT_SOURCE_DRIFT_DETECTED",
    };
  }
  const planResult =
    buildMoneyShortsPart2YoutubeRecoveryPreflightPlan({
      facts: secondInspection.facts,
    });
  if (!planResult.ok) return planResult;
  const preflight =
    buildMoneyShortsPart2YoutubeRecoveryPreflight({
      plan: planResult.plan,
    });
  if (!preflight) {
    return {
      ok: false,
      reason:
        "PART2_YOUTUBE_RECOVERY_PREFLIGHT_BUILD_FAILED",
    };
  }
  return {
    ok: true,
    status: preflight.status,
    readyForActualExecution: false,
    safeToUpload: false,
    ownerApprovalRequired: true,
    contentId:
      preflight.plan.currentBinding.contentId,
    sourceSha256:
      preflight.plan.currentBinding.youtubeSourceSha256,
    instagramMediaId:
      preflight.plan.instagramRecovery.mediaId,
    youtubeOutcome:
      preflight.plan.youtube.outcome,
    expectedYoutubeChannelId:
      preflight.plan.youtube.expectedChannelId,
    ledgerSha256: preflight.plan.ledger.sha256,
    planFingerprint:
      preflight.plan.planFingerprint,
    preflightFingerprint:
      preflight.preflightFingerprint,
    preflight,
    sideEffectCounters:
      preflight.sideEffectCounters,
  };
}

export async function runMoneyShortsPart2YoutubeRecoveryPreflight({
  argv,
}) {
  return runWithInspector({
    argv,
    inspector: ({ parsed }) =>
      inspectMoneyShortsPart2YoutubeRecoveryEvidence({
        parsed,
      }),
  });
}

export async function runMoneyShortsPart2YoutubeRecoveryPreflightTestOnly({
  argv,
  inspector,
}) {
  return runWithInspector({
    argv,
    inspector,
  });
}

async function main() {
  const result =
    await runMoneyShortsPart2YoutubeRecoveryPreflight({
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
