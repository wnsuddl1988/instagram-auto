/**
 * One-shot YouTube-only recovery for the Owner-confirmed part-1 incident.
 *
 * Dry-run is the default. It recomputes and binds all local evidence, writes
 * only one preflight JSON, and performs zero credential reads/network calls/
 * recovery journal writes/ledger writes.
 *
 * Armed execution requires a second exact approval boundary:
 *   --arm
 *   --expected-preflight-fingerprint <sha256>
 *
 * This runner never imports or calls Instagram, Blob, Supabase, DB, render,
 * TTS, image, Veo, or part-2 code. It never retries videos.insert.
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
  join,
  relative,
  resolve,
} from "node:path";
import { Readable } from "node:stream";
import { fileURLToPath } from "node:url";

import {
  MONEY_SHORTS_PUBLISH_ATTEMPT_CLAIM_FILENAME,
  MONEY_SHORTS_PUBLISH_ATTEMPT_JOURNAL_DIRNAME,
  inspectMoneyShortsPublishAttemptEvidence,
} from "../lib/money-shorts-publish-attempt-journal.mjs";
import {
  validateMoneyShortsFinalVideoOwnerApprovalEvidence,
} from "../lib/money-shorts-final-video-owner-approval.mjs";
import {
  classifyMoneyShortsPublishRecovery,
} from "../lib/money-shorts-publish-recovery.mjs";
import {
  buildPublishLedgerKey,
} from "../lib/publish-ledger-runtime.mjs";
import {
  recordPublishLedgerEntryRuntime,
  writePublishLedgerRuntime,
} from "../lib/publish-ledger-runtime-write.mjs";
import {
  acquireMoneyShortsYoutubeOnlyRecoveryLock,
  buildMoneyShortsYoutubeOnlyRecoveryClaim,
  buildMoneyShortsYoutubeOnlyRecoveryEvent,
  buildMoneyShortsYoutubeOnlyRecoveryPlan,
  buildMoneyShortsYoutubeOnlyRecoveryPreflight,
  buildMoneyShortsYoutubeOnlyRecoveryResult,
  moneyShortsYoutubeOnlyRecoveryEventPath,
  moneyShortsYoutubeOnlyRecoveryPaths,
  releaseMoneyShortsYoutubeOnlyRecoveryLock,
  validateMoneyShortsYoutubeOnlyRecoveryAuthorization,
  validateMoneyShortsYoutubeOnlyRecoveryPreflight,
  writeMoneyShortsYoutubeOnlyRecoveryEvidenceOnce,
  writeMoneyShortsYoutubeOnlyRecoveryPreflight,
} from "../lib/money-shorts-youtube-only-recovery.mjs";
import {
  buildDualPlatformPublishPlan,
} from "./run-dual-platform-final-publish-orchestrator.mjs";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const REPO_ROOT = resolve(dirname(SCRIPT_PATH), "..");
const ORIGINAL_RESULT_FILENAME =
  "final-e2e-publish-result.json";
const YOUTUBE_VARIANT_ID =
  "youtube_shorts_letterbox_1080x1920";
const REQUIRED_YOUTUBE_ENV_KEYS = Object.freeze([
  "YOUTUBE_CLIENT_ID",
  "YOUTUBE_CLIENT_SECRET",
  "YOUTUBE_REFRESH_TOKEN",
]);
const VALUE_FLAGS = Object.freeze([
  "--approval",
  "--source-publish-dir",
  "--recovery-out-dir",
  "--content-unit",
  "--owner-resolution",
  "--ledger",
  "--expected-recovery-fingerprint",
  "--expected-resolution-sha256",
  "--expected-channel-id",
  "--expected-preflight-fingerprint",
]);
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

function outsideRepoPath(path) {
  try {
    const real = realpathSync(path);
    return !pathInside(REPO_ROOT, real);
  } catch {
    return false;
  }
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

function zeroCounters() {
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
  };
}

function summarizeAttemptEvidence(inspection) {
  const events = Array.isArray(inspection?.events)
    ? inspection.events
    : [];
  return {
    present: inspection?.exists === true,
    journalValid: inspection?.valid === true,
    reason:
      typeof inspection?.reason === "string"
        ? inspection.reason
        : "attempt_journal_inspection_failed",
    claimSha256:
      typeof inspection?.claimFile?.sha256 === "string"
        ? inspection.claimFile.sha256
        : null,
    eventCount: events.length,
    latestTransition:
      typeof inspection?.latestEvent?.transition === "string"
        ? inspection.latestEvent.transition
        : null,
    latestRecordedAtIso:
      typeof inspection?.latestEvent?.recordedAtIso === "string"
        ? inspection.latestEvent.recordedAtIso
        : null,
    latestEventSha256:
      typeof inspection?.latestEvent?.eventSha256 === "string"
        ? inspection.latestEvent.eventSha256
        : null,
  };
}

export function parseMoneyShortsYoutubeOnlyRecoveryArgs(argv) {
  const values = Object.create(null);
  let armed = false;
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--arm") {
      if (armed) {
        return {
          ok: false,
          reason: "YOUTUBE_ONLY_RECOVERY_DUPLICATE_ARM_FLAG",
        };
      }
      armed = true;
      continue;
    }
    if (!VALUE_FLAGS.includes(token)) {
      return {
        ok: false,
        reason: "YOUTUBE_ONLY_RECOVERY_UNKNOWN_ARGUMENT",
      };
    }
    const value = argv[index + 1];
    if (
      typeof value !== "string" ||
      value.length === 0 ||
      value.startsWith("--") ||
      Object.hasOwn(values, token)
    ) {
      return {
        ok: false,
        reason:
          "YOUTUBE_ONLY_RECOVERY_ARGUMENT_VALUE_INVALID",
      };
    }
    values[token] = value;
    index += 1;
  }
  return {
    ok: true,
    armed,
    approval: values["--approval"] ?? null,
    sourcePublishDir:
      values["--source-publish-dir"] ?? null,
    recoveryOutDir:
      values["--recovery-out-dir"] ?? null,
    contentUnitPath: values["--content-unit"] ?? null,
    ownerResolutionPath:
      values["--owner-resolution"] ?? null,
    ledgerPath: values["--ledger"] ?? null,
    expectedRecoveryFingerprint:
      values["--expected-recovery-fingerprint"] ?? null,
    expectedResolutionSha256:
      values["--expected-resolution-sha256"] ?? null,
    expectedChannelId:
      values["--expected-channel-id"] ?? null,
    expectedPreflightFingerprint:
      values["--expected-preflight-fingerprint"] ?? null,
  };
}

function resolvedInputs(parsed) {
  if (
    !parsed.sourcePublishDir ||
    !parsed.recoveryOutDir ||
    !parsed.contentUnitPath ||
    !parsed.ownerResolutionPath ||
    !parsed.ledgerPath
  ) {
    return {
      ok: false,
      reason: "YOUTUBE_ONLY_RECOVERY_REQUIRED_PATH_MISSING",
    };
  }
  const paths = {
    sourcePublishDir: resolve(parsed.sourcePublishDir),
    recoveryOutDir: resolve(parsed.recoveryOutDir),
    contentUnitPath: resolve(parsed.contentUnitPath),
    ownerResolutionPath: resolve(parsed.ownerResolutionPath),
    ledgerPath: resolve(parsed.ledgerPath),
  };
  if (
    pathInside(REPO_ROOT, paths.sourcePublishDir) ||
    pathInside(REPO_ROOT, paths.recoveryOutDir) ||
    pathInside(REPO_ROOT, paths.contentUnitPath) ||
    pathInside(REPO_ROOT, paths.ownerResolutionPath) ||
    pathInside(REPO_ROOT, paths.ledgerPath)
  ) {
    return {
      ok: false,
      reason: "YOUTUBE_ONLY_RECOVERY_PATH_INSIDE_REPO",
    };
  }
  if (
    dirname(paths.contentUnitPath).toLowerCase() !==
      paths.sourcePublishDir.toLowerCase() ||
    paths.recoveryOutDir.toLowerCase() ===
      paths.sourcePublishDir.toLowerCase() ||
    basename(paths.ownerResolutionPath) !== "part-1.json"
  ) {
    return {
      ok: false,
      reason: "YOUTUBE_ONLY_RECOVERY_PATH_BINDING_INVALID",
    };
  }
  return { ok: true, paths };
}

function futurePathOutsideRepo(path) {
  let cursor = resolve(path);
  while (!existsSync(cursor)) {
    const parent = dirname(cursor);
    if (parent === cursor) return false;
    cursor = parent;
  }
  return outsideRepoPath(cursor);
}

function metadataSha256(unit) {
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

function readLedgerObject(path) {
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
        typeof record.contentId === "string" &&
        record.contentId.length > 0 &&
        ["instagram_reels", "youtube_shorts"].includes(
          record.platform,
        ) &&
        typeof record.version === "string" &&
        record.version.length > 0 &&
        typeof record.publishedId === "string" &&
        record.publishedId.length > 0 &&
        record.status === "published" &&
        typeof record.publishedAtIso === "string" &&
        record.publishedAtIso.length > 0,
    ) &&
    new Set(records.map((record) => record.key)).size ===
      records.length;
  if (
    file.exists !== true ||
    file.parseOk !== true ||
    !isPlainObject(file.evidence) ||
    file.evidence.schemaVersion !== "publish_ledger_v1" ||
    !validRecords
  ) {
    return {
      ok: false,
      reason: "YOUTUBE_ONLY_RECOVERY_LEDGER_INVALID",
      file,
    };
  }
  return { ok: true, file, ledger: file.evidence };
}

function readLedgerSnapshot(path, contentId, version) {
  const read = readLedgerObject(path);
  if (!read.ok) {
    return {
      ok: false,
      reason: read.reason,
      file: read.file,
      ledger: null,
      evidence: {
        readOk: false,
        instagramAlreadyPublished: false,
        youtubeAlreadyPublished: false,
        instagramPublishedIdReference: null,
        youtubePublishedIdReference: null,
      },
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
    file: read.file,
    ledger: read.ledger,
    evidence: {
      readOk: true,
      instagramAlreadyPublished:
        instagramRecord !== null,
      youtubeAlreadyPublished: youtubeRecord !== null,
      instagramPublishedIdReference:
        instagramRecord?.publishedId ?? null,
      youtubePublishedIdReference:
        youtubeRecord?.publishedId ?? null,
    },
  };
}

function inspectCurrentRecoveryContext({
  paths,
  expectedRecoveryFingerprint,
  expectedResolutionSha256,
  expectedChannelId,
}) {
  try {
    if (
      !outsideRepoPath(paths.sourcePublishDir) ||
      !futurePathOutsideRepo(paths.recoveryOutDir) ||
      !outsideRepoPath(paths.contentUnitPath) ||
      !outsideRepoPath(paths.ownerResolutionPath) ||
      !outsideRepoPath(paths.ledgerPath) ||
      !statSync(paths.sourcePublishDir).isDirectory()
    ) {
      return {
        ok: false,
        reason: "YOUTUBE_ONLY_RECOVERY_REAL_PATH_INVALID",
      };
    }

    const contentUnitFile =
      readJsonFileEvidence(paths.contentUnitPath);
    if (
      contentUnitFile.exists !== true ||
      contentUnitFile.parseOk !== true ||
      !isPlainObject(contentUnitFile.evidence)
    ) {
      return {
        ok: false,
        reason: "YOUTUBE_ONLY_RECOVERY_CONTENT_UNIT_INVALID",
      };
    }
    const unit = contentUnitFile.evidence;
    if (
      unit.schemaVersion !== "dual_platform_content_unit_v1" ||
      unit.wizardProductionPartId !== "part-1" ||
      unit.sourceIntegrity?.productionPartId !== "part-1" ||
      unit.series?.totalParts !== 2 ||
      unit.series?.partNumber !== 1 ||
      typeof unit.contentId !== "string" ||
      unit.contentId.length === 0 ||
      typeof unit.version !== "string" ||
      unit.version.length === 0
    ) {
      return {
        ok: false,
        reason:
          "YOUTUBE_ONLY_RECOVERY_CONTENT_UNIT_NOT_PART1",
      };
    }

    const instagramSourcePath = resolve(
      String(unit.instagramSourcePath ?? ""),
    );
    const youtubeSourcePath = resolve(
      String(unit.youtubeSourcePath ?? ""),
    );
    if (
      !outsideRepoPath(instagramSourcePath) ||
      !outsideRepoPath(youtubeSourcePath)
    ) {
      return {
        ok: false,
        reason:
          "YOUTUBE_ONLY_RECOVERY_SOURCE_PATH_INVALID",
      };
    }
    const instagramSourceBytes =
      readFileSync(instagramSourcePath);
    const youtubeSourceBytes = readFileSync(youtubeSourcePath);
    const instagramSourceSha256 =
      sha256(instagramSourceBytes);
    const youtubeSourceSha256 = sha256(youtubeSourceBytes);
    const instagramSourceSize =
      statSync(instagramSourcePath).size;
    const youtubeSourceSize =
      statSync(youtubeSourcePath).size;
    const publishMetadataSha256 = metadataSha256(unit);

    const publishPlan = buildDualPlatformPublishPlan(unit);
    const youtubeJob = publishPlan.jobs.find(
      (job) => job.id === "youtube_job",
    );
    const youtubeMetadataGateOk =
      youtubeJob?.metadataOptimizationGate?.ok === true &&
      youtubeJob?.variantId === YOUTUBE_VARIANT_ID &&
      youtubeJob?.sourcePath === unit.youtubeSourcePath &&
      JSON.stringify(youtubeJob?.metadata) ===
        JSON.stringify(unit.youtubeMetadata);

    const sourceIntegrity = unit.sourceIntegrity ?? {};
    const ownerApprovalValidation =
      validateMoneyShortsFinalVideoOwnerApprovalEvidence({
        evidence: unit.ownerFinalVideoApproval,
        topicId: unit.wizardTopicId,
        expectedPartIds: ["part-1", "part-2"],
        currentPart: {
          partId: "part-1",
          wizardScriptFingerprint:
            sourceIntegrity.wizardScriptFingerprint,
          audioSha256: sourceIntegrity.audioSha256,
          imageSetSha256: sourceIntegrity.imageSetSha256,
          finalMp4Sha256: instagramSourceSha256,
          publishMetadataSha256,
          durationSec: sourceIntegrity.durationSec,
          sizeBytes: sourceIntegrity.sizeBytes,
        },
      });
    const sourceIntegrityValid =
      ownerApprovalValidation.accepted === true &&
      ownerApprovalValidation.finalVideoApprovalFingerprint ===
        sourceIntegrity.finalVideoApprovalFingerprint &&
      sourceIntegrity.rootTopicId === unit.wizardTopicId &&
      sourceIntegrity.finalMp4Sha256 ===
        instagramSourceSha256 &&
      instagramSourceSha256 === youtubeSourceSha256 &&
      sourceIntegrity.publishMetadataSha256 ===
        publishMetadataSha256 &&
      sourceIntegrity.sizeBytes === instagramSourceSize &&
      sourceIntegrity.sizeBytes === youtubeSourceSize;
    if (!sourceIntegrityValid || !youtubeMetadataGateOk) {
      return {
        ok: false,
        reason:
          "YOUTUBE_ONLY_RECOVERY_APPROVED_ARTIFACT_MISMATCH",
      };
    }

    const currentBinding = {
      contentId: unit.contentId,
      version: unit.version,
      productionPartId: "part-1",
      contentUnitManifestPath: paths.contentUnitPath,
      contentUnitSha256: contentUnitFile.sha256,
      instagramSourceSha256,
      youtubeSourceSha256,
      publishMetadataSha256,
      finalVideoApprovalFingerprint:
        sourceIntegrity.finalVideoApprovalFingerprint,
    };
    const resultPath = join(
      paths.sourcePublishDir,
      ORIGINAL_RESULT_FILENAME,
    );
    const resultFile = readJsonFileEvidence(resultPath);
    const ownerResolutionFile =
      readJsonFileEvidence(paths.ownerResolutionPath);
    const attemptInspection =
      inspectMoneyShortsPublishAttemptEvidence({
        outDir: paths.sourcePublishDir,
        currentBinding,
      });
    const attemptEvidence =
      summarizeAttemptEvidence(attemptInspection);
    const ledgerRead = readLedgerSnapshot(
      paths.ledgerPath,
      unit.contentId,
      unit.version,
    );
    if (!ledgerRead.ok) return ledgerRead;
    const ledgerEvidence = ledgerRead.evidence;
    const recovery = classifyMoneyShortsPublishRecovery({
      resultFile,
      attemptFile: attemptInspection.claimFile,
      attemptEvidence,
      ownerResolutionFile,
      currentBinding,
      ledgerEvidence,
    });
    const instagramConfirmedEvents =
      attemptInspection.events.filter(
        (event) =>
          event?.transition ===
          "instagram_publish_confirmed",
      );
    const instagramConfirmedEvent =
      instagramConfirmedEvents.length === 1
        ? instagramConfirmedEvents[0]
        : null;
    if (
      !instagramConfirmedEvent ||
      instagramConfirmedEvent.state?.instagram?.mediaId !==
        recovery.instagramMediaId
    ) {
      return {
        ok: false,
        reason:
          "YOUTUBE_ONLY_RECOVERY_INSTAGRAM_EVENT_INVALID",
      };
    }

    const planResult =
      buildMoneyShortsYoutubeOnlyRecoveryPlan({
        recovery,
        contentUnit: unit,
        attemptEvidence,
        artifactFacts: {
          currentBinding,
          sourceIntegrityValid,
          sourceSizeBytes: youtubeSourceSize,
          youtubeVariantId: youtubeJob.variantId,
          ledgerSha256: ledgerRead.file.sha256,
          evidencePaths: {
            sourcePublishDir: paths.sourcePublishDir,
            recoveryOutDir: paths.recoveryOutDir,
            contentUnitManifestPath: paths.contentUnitPath,
            originalResultPath: resultPath,
            originalAttemptClaimPath: join(
              paths.sourcePublishDir,
              MONEY_SHORTS_PUBLISH_ATTEMPT_CLAIM_FILENAME,
            ),
            originalAttemptJournalDir: join(
              paths.sourcePublishDir,
              MONEY_SHORTS_PUBLISH_ATTEMPT_JOURNAL_DIRNAME,
            ),
            ownerResolutionPath: paths.ownerResolutionPath,
            ledgerPath: paths.ledgerPath,
            instagramSourcePath,
            youtubeSourcePath,
          },
        },
        metadataGateOk: youtubeMetadataGateOk,
        instagramPublishedAtIso:
          instagramConfirmedEvent.recordedAtIso,
        expectedRecoveryFingerprint,
        expectedResolutionSha256,
        expectedChannelId,
      });
    if (!planResult.ok) return planResult;

    return {
      ok: true,
      paths,
      unit,
      plan: planResult.plan,
      recovery,
      attemptEvidence,
      ledger: ledgerRead.ledger,
      ledgerFileSha256: ledgerRead.file.sha256,
      youtubeSourceBytes,
      youtubeSourcePath,
    };
  } catch {
    return {
      ok: false,
      reason:
        "YOUTUBE_ONLY_RECOVERY_LOCAL_EVIDENCE_INSPECTION_FAILED",
    };
  }
}

function recoveryEvidenceAbsent(recoveryPaths) {
  return (
    !existsSync(recoveryPaths.recoveryDir) &&
    !existsSync(recoveryPaths.claimPath) &&
    !existsSync(recoveryPaths.resultPath)
  );
}

function publicInstagram(plan) {
  return {
    outcome: "confirmed_published",
    mediaId: plan.instagram.mediaId,
    permalink: plan.instagram.permalink,
    publishedAtIso: plan.instagram.publishedAtIso,
    actionCount: 0,
  };
}

function readbackLedgerResult(context, expectedVideoId) {
  const ledgerRead = readLedgerSnapshot(
    context.paths.ledgerPath,
    context.unit.contentId,
    context.unit.version,
  );
  const evidence = ledgerRead.evidence;
  const ok =
    ledgerRead.ok === true &&
    evidence.readOk === true &&
    evidence.youtubeAlreadyPublished === true &&
    evidence.youtubePublishedIdReference === expectedVideoId;
  return {
    ok,
    sha256:
      ledgerRead.ok === true
        ? ledgerRead.file.sha256
        : null,
    evidence,
  };
}

async function executeArmed({
  context,
  recoveryPaths,
  expectedPreflightFingerprint,
  envProvider,
}) {
  const counters = zeroCounters();
  const lockPath =
    `${context.paths.ledgerPath}.youtube-only-part1-recovery.lock`;
  const lock =
    acquireMoneyShortsYoutubeOnlyRecoveryLock({ lockPath });
  if (!lock.ok) {
    return {
      ok: false,
      status: "BLOCKED",
      blockerCode: lock.reason,
      sideEffectCounters: counters,
    };
  }

  let claim = null;
  let latestEvidenceSha256 = null;
  let latestTransition = null;
  let resultWritten = false;
  let youtube = {
    status: "not_started",
    outcome: "confirmed_not_published",
    videoId: null,
    url: null,
    channelId: context.plan.expectedChannelId,
    publishedAtIso: null,
  };
  let ledger = {
    writeOk: false,
    readbackOk: false,
    writeLockReleased: null,
    recordedKey: null,
    publishedId: null,
    readbackSha256: null,
  };

  const appendEvent = (transition) => {
    counters.recoveryEvidenceWriteCount += 1;
    const event =
      buildMoneyShortsYoutubeOnlyRecoveryEvent({
        claim,
        previousEvidenceSha256: latestEvidenceSha256,
        previousTransition: latestTransition,
        transition,
        recordedAtIso: nowIso(),
        publicState: {
          instagram: publicInstagram(context.plan),
          youtube,
          ledger,
        },
        sideEffectCounters: counters,
      });
    if (!event) {
      throw new Error("recovery_event_build_failed");
    }
    const eventPath =
      moneyShortsYoutubeOnlyRecoveryEventPath(
        recoveryPaths.recoveryDir,
        transition,
      );
    const written =
      writeMoneyShortsYoutubeOnlyRecoveryEvidenceOnce({
        path: eventPath,
        evidence: event,
        fingerprintField: "eventFingerprint",
      });
    if (!written.ok) {
      throw new Error("recovery_event_write_failed");
    }
    latestEvidenceSha256 = written.sha256;
    latestTransition = transition;
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
      } else if (ledger.writeOk === true) {
        status =
          "YOUTUBE_AND_LEDGER_CONFIRMED_RECOVERY_EVIDENCE_INCOMPLETE";
      } else {
        status = "BOTH_PUBLISHED_LEDGER_MISSING";
      }
    }
    counters.recoveryEvidenceWriteCount += 1;
    const result =
      buildMoneyShortsYoutubeOnlyRecoveryResult({
        claim,
        latestEventSha256,
        latestTransition,
        status,
        blockerCode,
        completedAtIso: nowIso(),
        instagram: publicInstagram(context.plan),
        youtube,
        ledger,
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
      writeMoneyShortsYoutubeOnlyRecoveryEvidenceOnce({
        path: recoveryPaths.resultPath,
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

  let returnValue = null;
  try {
    const lockedContext = inspectCurrentRecoveryContext({
      paths: context.paths,
      expectedRecoveryFingerprint:
        context.plan.recoveryFingerprint,
      expectedResolutionSha256:
        context.plan.ownerResolutionSha256,
      expectedChannelId: context.plan.expectedChannelId,
    });
    if (
      !lockedContext.ok ||
      lockedContext.plan.planFingerprint !==
        context.plan.planFingerprint ||
      !recoveryEvidenceAbsent(recoveryPaths)
    ) {
      returnValue = {
        ok: false,
        status: "BLOCKED",
        blockerCode:
          "YOUTUBE_ONLY_RECOVERY_EVIDENCE_CHANGED_AFTER_LOCK",
        sideEffectCounters: counters,
      };
      return returnValue;
    }

    const preflightFile =
      readJsonFileEvidence(recoveryPaths.preflightPath);
    const preflightValidation =
      validateMoneyShortsYoutubeOnlyRecoveryPreflight({
        evidence: preflightFile.evidence,
        currentPlan: lockedContext.plan,
        expectedPreflightFingerprint,
      });
    if (
      preflightFile.parseOk !== true ||
      preflightValidation.valid !== true
    ) {
      returnValue = {
        ok: false,
        status: "BLOCKED",
        blockerCode:
          "YOUTUBE_ONLY_RECOVERY_PREFLIGHT_STALE_AFTER_LOCK",
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
          "YOUTUBE_ONLY_RECOVERY_CREDENTIALS_MISSING",
        credentialPresence,
        sideEffectCounters: counters,
      };
      return returnValue;
    }

    claim = buildMoneyShortsYoutubeOnlyRecoveryClaim({
      plan: lockedContext.plan,
      preflightFingerprint:
        expectedPreflightFingerprint,
      claimedAtIso: nowIso(),
    });
    if (!claim) {
      throw new Error("recovery_claim_build_failed");
    }
    const claimWrite =
      writeMoneyShortsYoutubeOnlyRecoveryEvidenceOnce({
        path: recoveryPaths.claimPath,
        evidence: claim,
        fingerprintField: "claimFingerprint",
      });
    if (!claimWrite.ok) {
      throw new Error("recovery_claim_write_failed");
    }
    counters.recoveryEvidenceWriteCount = 1;
    latestEvidenceSha256 = claimWrite.sha256;
    appendEvent("external_execution_ready");

    const { google } = await import("googleapis");
    const oauth2 = new google.auth.OAuth2(
      credentials.YOUTUBE_CLIENT_ID,
      credentials.YOUTUBE_CLIENT_SECRET,
      "http://localhost:3000/api/auth/youtube/callback",
    );
    oauth2.setCredentials({
      refresh_token: credentials.YOUTUBE_REFRESH_TOKEN,
    });
    for (const name of REQUIRED_YOUTUBE_ENV_KEYS) {
      delete credentials[name];
    }
    const youtubeClient = google.youtube({
      version: "v3",
      auth: oauth2,
    });

    appendEvent("youtube_channel_verify_intent");
    counters.youtubeChannelVerificationCount += 1;
    counters.youtubeApiInvocationCount += 1;
    const channelResponse =
      await youtubeClient.channels.list({
        part: ["id"],
        mine: true,
        maxResults: 50,
      }, {
        retry: false,
      });
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
      channelIds[0] !== lockedContext.plan.expectedChannelId
    ) {
      returnValue = finalizeFailure(
        "YOUTUBE_ONLY_RECOVERY_CHANNEL_MISMATCH",
      );
      return returnValue;
    }
    appendEvent("youtube_channel_verify_confirmed");

    const beforeInsertLedger =
      readLedgerSnapshot(
        lockedContext.paths.ledgerPath,
        lockedContext.unit.contentId,
        lockedContext.unit.version,
      );
    if (
      !beforeInsertLedger.ok ||
      beforeInsertLedger.file.sha256 !==
        lockedContext.plan.ledger.sha256 ||
      beforeInsertLedger.evidence.readOk !== true ||
      beforeInsertLedger.evidence
        .youtubeAlreadyPublished === true
    ) {
      returnValue = finalizeFailure(
        "YOUTUBE_ONLY_RECOVERY_LEDGER_CHANGED_BEFORE_INSERT",
      );
      return returnValue;
    }

    appendEvent("youtube_insert_intent");
    counters.youtubeInsertCount += 1;
    counters.youtubeApiInvocationCount += 1;
    const metadata = lockedContext.plan.youtube.metadata;
    let uploadResponse;
    try {
      uploadResponse =
        await youtubeClient.videos.insert({
          part: ["snippet", "status"],
          requestBody: {
            snippet: {
              title:
                metadata.titleWithShortsSuffix,
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
            body: Readable.from([
              lockedContext.youtubeSourceBytes,
            ]),
          },
        }, {
          retry: false,
        });
    } catch {
      returnValue = finalizeFailure(
        "YOUTUBE_ONLY_RECOVERY_INSERT_OUTCOME_UNKNOWN",
      );
      return returnValue;
    }
    const videoId = uploadResponse?.data?.id;
    if (
      typeof videoId !== "string" ||
      !YOUTUBE_VIDEO_ID_RE.test(videoId)
    ) {
      returnValue = finalizeFailure(
        "YOUTUBE_ONLY_RECOVERY_INSERT_NO_VALID_ID",
      );
      return returnValue;
    }
    const publishedAtIso = nowIso();
    youtube = {
      status: "uploaded",
      outcome: "confirmed_published",
      videoId,
      url: `https://www.youtube.com/shorts/${videoId}`,
      channelId: lockedContext.plan.expectedChannelId,
      publishedAtIso,
    };
    appendEvent("youtube_insert_confirmed");

    const beforeLedger =
      readLedgerSnapshot(
        lockedContext.paths.ledgerPath,
        lockedContext.unit.contentId,
        lockedContext.unit.version,
      );
    if (
      beforeLedger.ok !== true ||
      beforeLedger.file.sha256 !==
        lockedContext.plan.ledger.sha256 ||
      beforeLedger.evidence.readOk !== true ||
      beforeLedger.evidence.youtubeAlreadyPublished === true
    ) {
      returnValue = finalizeFailure(
        "YOUTUBE_ONLY_RECOVERY_LEDGER_CHANGED_BEFORE_WRITE",
      );
      return returnValue;
    }
    const recordedKey = buildPublishLedgerKey(
      lockedContext.unit.contentId,
      "youtube_shorts",
      lockedContext.unit.version,
    );
    const recordResult =
      recordPublishLedgerEntryRuntime(
        beforeLedger.ledger,
        {
          key: recordedKey,
          contentId: lockedContext.unit.contentId,
          platform: "youtube_shorts",
          version: lockedContext.unit.version,
          variantId: lockedContext.plan.youtube.variantId,
          publishedId: videoId,
          publishedUrl:
            `https://www.youtube.com/shorts/${videoId}`,
          status: "published",
          publishedAtIso,
          metadata: {
            sourceFileName: basename(
              lockedContext.youtubeSourcePath,
            ),
            sourceSha256:
              lockedContext.plan.youtube.sourceSha256,
            recoveryFingerprint:
              lockedContext.plan.recoveryFingerprint,
            originalResultSha256:
              lockedContext.plan.originalResultSha256,
            ownerResolutionSha256:
              lockedContext.plan.ownerResolutionSha256,
            channelId:
              lockedContext.plan.expectedChannelId,
          },
        },
      );
    if (!recordResult.ok) {
      returnValue = finalizeFailure(
        "YOUTUBE_ONLY_RECOVERY_LEDGER_RECORD_REFUSED",
      );
      return returnValue;
    }

    appendEvent("ledger_write_intent");
    counters.ledgerWriteCount += 1;
    const ledgerWrite = writePublishLedgerRuntime(
      lockedContext.paths.ledgerPath,
      recordResult.ledger,
      {
        expectedCurrentSha256:
          beforeLedger.file.sha256,
      },
    );
    if (ledgerWrite.committed !== true) {
      ledger = {
        ...ledger,
        writeLockReleased:
          ledgerWrite.lockReleased === true,
      };
      returnValue = finalizeFailure(
        "YOUTUBE_ONLY_RECOVERY_LEDGER_WRITE_FAILED",
      );
      return returnValue;
    }
    const ledgerReadback =
      readbackLedgerResult(lockedContext, videoId);
    if (!ledgerReadback.ok) {
      ledger = {
        ...ledger,
        writeLockReleased:
          ledgerWrite.lockReleased === true,
      };
      returnValue = finalizeFailure(
        "YOUTUBE_ONLY_RECOVERY_LEDGER_READBACK_FAILED",
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
      readbackSha256: ledgerReadback.sha256,
    };
    appendEvent("ledger_write_confirmed");
    appendEvent("complete");

    counters.recoveryEvidenceWriteCount += 1;
    const result =
      buildMoneyShortsYoutubeOnlyRecoveryResult({
        claim,
        latestEventSha256,
        latestTransition,
        status: "YOUTUBE_ONLY_RECOVERY_OK",
        blockerCode: null,
        completedAtIso: nowIso(),
        instagram: publicInstagram(lockedContext.plan),
        youtube,
        ledger,
        sideEffectCounters: counters,
      });
    if (!result) {
      returnValue = finalizeFailure(
        "YOUTUBE_ONLY_RECOVERY_RESULT_BUILD_FAILED",
      );
      return returnValue;
    }
    const resultWrite =
      writeMoneyShortsYoutubeOnlyRecoveryEvidenceOnce({
        path: recoveryPaths.resultPath,
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
          "YOUTUBE_ONLY_RECOVERY_RESULT_WRITE_FAILED",
        sideEffectCounters: counters,
      };
      return returnValue;
    }
    returnValue = {
      ok: true,
      status: "YOUTUBE_ONLY_RECOVERY_OK",
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
      "YOUTUBE_ONLY_RECOVERY_ARMED_EXECUTION_FAILED",
    );
    return returnValue;
  } finally {
    const release =
      releaseMoneyShortsYoutubeOnlyRecoveryLock({ lock });
    if (!release.ok) {
      if (returnValue) {
        returnValue.lockCleanupFailed = true;
        returnValue.ok = false;
      }
    }
  }
}

export async function runMoneyShortsYoutubeOnlyRecovery({
  argv,
  envProvider = () => process.env,
}) {
  const parsed =
    parseMoneyShortsYoutubeOnlyRecoveryArgs(argv);
  if (!parsed.ok) return parsed;

  // This authorization gate intentionally precedes every filesystem/env/network
  // operation. Path resolution and local evidence reads happen only after it.
  const authorization =
    validateMoneyShortsYoutubeOnlyRecoveryAuthorization({
      armed: parsed.armed,
      approval: parsed.approval,
      expectedRecoveryFingerprint:
        parsed.expectedRecoveryFingerprint,
      expectedResolutionSha256:
        parsed.expectedResolutionSha256,
      expectedChannelId: parsed.expectedChannelId,
      expectedPreflightFingerprint:
        parsed.expectedPreflightFingerprint,
    });
  if (!authorization.ok) return authorization;

  const input = resolvedInputs(parsed);
  if (!input.ok) return input;
  const context = inspectCurrentRecoveryContext({
    paths: input.paths,
    expectedRecoveryFingerprint:
      authorization.expectedRecoveryFingerprint,
    expectedResolutionSha256:
      authorization.expectedResolutionSha256,
    expectedChannelId: authorization.expectedChannelId,
  });
  if (!context.ok) return context;

  const recoveryPaths =
    moneyShortsYoutubeOnlyRecoveryPaths(
      context.paths.recoveryOutDir,
    );
  if (!recoveryEvidenceAbsent(recoveryPaths)) {
    return {
      ok: false,
      reason:
        "YOUTUBE_ONLY_RECOVERY_EVIDENCE_ALREADY_EXISTS_MANUAL_REVIEW_REQUIRED",
    };
  }

  if (!authorization.armed) {
    const preflight =
      buildMoneyShortsYoutubeOnlyRecoveryPreflight({
        plan: context.plan,
        boundAtIso: nowIso(),
      });
    if (!preflight) {
      return {
        ok: false,
        reason:
          "YOUTUBE_ONLY_RECOVERY_PREFLIGHT_BUILD_FAILED",
      };
    }
    const written =
      writeMoneyShortsYoutubeOnlyRecoveryPreflight({
        path: recoveryPaths.preflightPath,
        evidence: preflight,
      });
    if (!written.ok) {
      return {
        ok: false,
        reason:
          written.reason ??
          "YOUTUBE_ONLY_RECOVERY_PREFLIGHT_WRITE_FAILED",
        preflightPath: recoveryPaths.preflightPath,
        preparedPath: written.preparedPath,
      };
    }
    return {
      ok: true,
      status: "PREFLIGHT_ONLY_OK",
      armed: false,
      contentId: context.unit.contentId,
      version: context.unit.version,
      productionPartId: "part-1",
      recoveryFingerprint:
        context.plan.recoveryFingerprint,
      ownerResolutionSha256:
        context.plan.ownerResolutionSha256,
      expectedChannelId:
        context.plan.expectedChannelId,
      planFingerprint: context.plan.planFingerprint,
      preflightFingerprint:
        preflight.preflightFingerprint,
      preflightPath: recoveryPaths.preflightPath,
      preflightWriteCount: 1,
      sideEffectCounters: preflight.sideEffectCounters,
      noLiveActions: true,
    };
  }

  const preflightFile =
    readJsonFileEvidence(recoveryPaths.preflightPath);
  const validation =
    validateMoneyShortsYoutubeOnlyRecoveryPreflight({
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
        "YOUTUBE_ONLY_RECOVERY_PREFLIGHT_STALE_OR_MISSING",
    };
  }

  return executeArmed({
    context,
    recoveryPaths,
    expectedPreflightFingerprint:
      authorization.expectedPreflightFingerprint,
    envProvider,
  });
}

async function main() {
  const result =
    await runMoneyShortsYoutubeOnlyRecovery({
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
