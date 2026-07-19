import { createHash, randomUUID } from "node:crypto";
import * as nodeFs from "node:fs";
import { join } from "node:path";

import {
  fingerprintMoneyShortsPublishAttemptBinding,
  normalizeMoneyShortsPublishAttemptBinding,
} from "./money-shorts-publish-attempt-journal.mjs";
import {
  acquireMoneyShortsYoutubeOnlyRecoveryLock,
  releaseMoneyShortsYoutubeOnlyRecoveryLock,
  writeMoneyShortsYoutubeOnlyRecoveryEvidenceOnce,
} from "./money-shorts-youtube-only-recovery.mjs";

export const MONEY_SHORTS_PART2_DUAL_PUBLISH_SAFE_VERSION =
  "money_shorts_part2_dual_platform_publish_safe_v1";
export const MONEY_SHORTS_PART2_DUAL_PUBLISH_SAFE_APPROVAL =
  "APPROVE_MONEY_SHORTS_PART2_DUAL_PLATFORM_PUBLISH_SAFE_V1";
export const MONEY_SHORTS_PART2_DUAL_PUBLISH_SAFE_DIRNAME =
  "part2-dual-platform-publish-safe-v1";
export const MONEY_SHORTS_PART2_DUAL_PUBLISH_SAFE_PREFLIGHT_FILENAME =
  "preflight.json";
export const MONEY_SHORTS_PART2_DUAL_PUBLISH_SAFE_CLAIM_FILENAME =
  "claim.json";
export const MONEY_SHORTS_PART2_DUAL_PUBLISH_SAFE_RESULT_FILENAME =
  "result.json";
export const MONEY_SHORTS_PART2_DUAL_PUBLISH_SAFE_EVENT_DIRNAME =
  "events";

export const MONEY_SHORTS_PART2_DUAL_PUBLISH_SAFE_TRANSITIONS =
  Object.freeze([
    "external_execution_ready",
    "instagram_identity_verify_intent",
    "instagram_identity_verify_confirmed",
    "youtube_identity_verify_intent",
    "youtube_identity_verify_confirmed",
    "blob_put_intent",
    "blob_put_confirmed",
    "blob_head_intent",
    "blob_head_confirmed",
    "instagram_container_intent",
    "instagram_container_confirmed",
    "instagram_poll_intent",
    "instagram_poll_observed",
    "instagram_container_ready",
    "instagram_publish_intent",
    "instagram_publish_confirmed",
    "youtube_insert_intent",
    "youtube_insert_confirmed",
    "ledger_write_intent",
    "ledger_write_confirmed",
    "complete",
  ]);

const SHA256_RE = /^[a-f0-9]{64}$/;
const INSTAGRAM_ACCOUNT_ID_RE = /^[0-9]{5,32}$/;
const YOUTUBE_CHANNEL_ID_RE = /^UC[A-Za-z0-9_-]{22}$/;
const PUBLIC_ID_RE = /^[A-Za-z0-9._:-]{1,240}$/;

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

function fingerprinted(stable, field) {
  return {
    ...stable,
    [field]: sha256(JSON.stringify(stable)),
  };
}

function validFingerprint(value, field) {
  if (
    !isPlainObject(value) ||
    !SHA256_RE.test(strictString(value[field]))
  ) {
    return false;
  }
  const { [field]: actual, ...stable } = value;
  return actual === sha256(JSON.stringify(stable));
}

function validPart2Binding(value) {
  const binding =
    normalizeMoneyShortsPublishAttemptBinding(value);
  return (
    binding.productionPartId === "part-2" &&
    binding.contentId.endsWith("-part-2") &&
    binding.version.length > 0 &&
    binding.contentUnitManifestPath.length > 0 &&
    SHA256_RE.test(binding.contentUnitSha256) &&
    SHA256_RE.test(binding.instagramSourceSha256) &&
    SHA256_RE.test(binding.youtubeSourceSha256) &&
    binding.instagramSourceSha256 ===
      binding.youtubeSourceSha256 &&
    SHA256_RE.test(binding.publishMetadataSha256) &&
    SHA256_RE.test(binding.finalVideoApprovalFingerprint)
  )
    ? binding
    : null;
}

export function zeroMoneyShortsPart2DualPublishSafeCounters() {
  return {
    instagramIdentityVerificationCount: 0,
    youtubeChannelVerificationCount: 0,
    blobPutCount: 0,
    blobHeadCount: 0,
    instagramContainerCreateCount: 0,
    instagramStatusPollCount: 0,
    instagramPublishCount: 0,
    youtubeInsertCount: 0,
    ledgerWriteCount: 0,
    credentialReadCount: 0,
    externalApiInvocationCount: 0,
    evidenceWriteCount: 0,
    databaseMutationCount: 0,
    part1ActionCount: 0,
    automaticRetryCount: 0,
    credentialValuePrintCount: 0,
  };
}

function validCounters(value) {
  const expected =
    zeroMoneyShortsPart2DualPublishSafeCounters();
  return (
    isPlainObject(value) &&
    Object.keys(expected).every(
      (name) =>
        Number.isSafeInteger(value[name]) &&
        value[name] >= 0,
    )
  );
}

export function buildMoneyShortsPart2DualPublishSafePlan({
  currentBinding,
  expectedContentId,
  expectedManifestSha256,
  expectedSourceSha256,
  expectedPublicationAttemptFingerprint,
  expectedInstagramAccountId,
  expectedYoutubeChannelId,
  genericPreflightBindingFingerprint,
  ledgerBaselineSha256,
  blobPathname,
}) {
  const binding = validPart2Binding(currentBinding);
  if (
    !binding ||
    strictString(expectedContentId) !== binding.contentId ||
    strictString(expectedManifestSha256) !==
      binding.contentUnitSha256 ||
    strictString(expectedSourceSha256) !==
      binding.instagramSourceSha256 ||
    strictString(expectedPublicationAttemptFingerprint) !==
      fingerprintMoneyShortsPublishAttemptBinding(binding) ||
    !INSTAGRAM_ACCOUNT_ID_RE.test(
      strictString(expectedInstagramAccountId),
    ) ||
    !YOUTUBE_CHANNEL_ID_RE.test(
      strictString(expectedYoutubeChannelId),
    ) ||
    !SHA256_RE.test(
      strictString(genericPreflightBindingFingerprint),
    ) ||
    !SHA256_RE.test(strictString(ledgerBaselineSha256)) ||
    typeof blobPathname !== "string" ||
    blobPathname.length === 0 ||
    /[?#]/.test(blobPathname)
  ) {
    return {
      ok: false,
      reason: "PART2_DUAL_SAFE_PLAN_INPUT_INVALID",
    };
  }
  const stable = {
    schemaVersion:
      MONEY_SHORTS_PART2_DUAL_PUBLISH_SAFE_VERSION,
    mode: "part2_only_dual_platform_publish",
    currentBinding: binding,
    publicationAttemptFingerprint:
      fingerprintMoneyShortsPublishAttemptBinding(binding),
    expectedContentId: binding.contentId,
    expectedManifestSha256: binding.contentUnitSha256,
    expectedSourceSha256: binding.instagramSourceSha256,
    expectedInstagramAccountId,
    expectedYoutubeChannelId,
    genericPreflightBindingFingerprint,
    ledgerBaselineSha256,
    blobPathname,
    safety: {
      productionPartId: "part-2",
      part1ActionAllowed: false,
      automaticRetryAllowed: false,
      blobOverwriteAllowed: false,
      accountIdentityVerificationRequiredBeforeMutation: true,
      youtubeRetryDisabled: true,
      blobSdkRetryCount: 0,
    },
  };
  return {
    ok: true,
    plan: fingerprinted(stable, "planFingerprint"),
  };
}

export function validateMoneyShortsPart2DualPublishSafeAuthorization({
  armed,
  approval,
  expectedContentId,
  expectedManifestSha256,
  expectedSourceSha256,
  expectedPublicationAttemptFingerprint,
  expectedInstagramAccountId,
  expectedYoutubeChannelId,
  expectedPreflightFingerprint,
}) {
  const commonValid =
    approval === MONEY_SHORTS_PART2_DUAL_PUBLISH_SAFE_APPROVAL &&
    typeof expectedContentId === "string" &&
    expectedContentId.endsWith("-part-2") &&
    SHA256_RE.test(strictString(expectedManifestSha256)) &&
    SHA256_RE.test(strictString(expectedSourceSha256)) &&
    SHA256_RE.test(
      strictString(expectedPublicationAttemptFingerprint),
    ) &&
    INSTAGRAM_ACCOUNT_ID_RE.test(
      strictString(expectedInstagramAccountId),
    ) &&
    YOUTUBE_CHANNEL_ID_RE.test(
      strictString(expectedYoutubeChannelId),
    );
  if (!commonValid) {
    return {
      ok: false,
      reason: "PART2_DUAL_SAFE_AUTHORIZATION_INVALID",
    };
  }
  if (
    armed === true &&
    !SHA256_RE.test(strictString(expectedPreflightFingerprint))
  ) {
    return {
      ok: false,
      reason:
        "PART2_DUAL_SAFE_PREFLIGHT_FINGERPRINT_REQUIRED",
    };
  }
  return {
    ok: true,
    armed: armed === true,
    expectedContentId,
    expectedManifestSha256,
    expectedSourceSha256,
    expectedPublicationAttemptFingerprint,
    expectedInstagramAccountId,
    expectedYoutubeChannelId,
    expectedPreflightFingerprint:
      armed === true ? expectedPreflightFingerprint : null,
  };
}

export function buildMoneyShortsPart2DualPublishSafePreflight({
  plan,
  boundAtIso,
}) {
  if (
    !validFingerprint(plan, "planFingerprint") ||
    plan.schemaVersion !==
      MONEY_SHORTS_PART2_DUAL_PUBLISH_SAFE_VERSION ||
    !validIso(boundAtIso)
  ) {
    return null;
  }
  const stable = {
    schemaVersion:
      MONEY_SHORTS_PART2_DUAL_PUBLISH_SAFE_VERSION,
    evidenceType: "preflight",
    status: "PREFLIGHT_ONLY_OK",
    armed: false,
    boundAtIso,
    plan,
    sideEffectCounters:
      zeroMoneyShortsPart2DualPublishSafeCounters(),
  };
  return fingerprinted(stable, "preflightFingerprint");
}

export function validateMoneyShortsPart2DualPublishSafePreflight({
  evidence,
  currentPlan,
  expectedPreflightFingerprint,
}) {
  const valid =
    validFingerprint(evidence, "preflightFingerprint") &&
    evidence.schemaVersion ===
      MONEY_SHORTS_PART2_DUAL_PUBLISH_SAFE_VERSION &&
    evidence.evidenceType === "preflight" &&
    evidence.status === "PREFLIGHT_ONLY_OK" &&
    evidence.armed === false &&
    validIso(evidence.boundAtIso) &&
    validFingerprint(evidence.plan, "planFingerprint") &&
    evidence.plan.planFingerprint ===
      currentPlan?.planFingerprint &&
    evidence.preflightFingerprint ===
      expectedPreflightFingerprint &&
    validCounters(evidence.sideEffectCounters) &&
    Object.values(evidence.sideEffectCounters).every(
      (value) => value === 0,
    );
  return {
    valid,
    reason: valid
      ? "part2_dual_safe_preflight_valid"
      : "part2_dual_safe_preflight_invalid",
  };
}

export function buildMoneyShortsPart2DualPublishSafeClaim({
  plan,
  preflightFingerprint,
  claimedAtIso,
  claimId = randomUUID(),
}) {
  if (
    !validFingerprint(plan, "planFingerprint") ||
    !SHA256_RE.test(strictString(preflightFingerprint)) ||
    !validIso(claimedAtIso) ||
    !PUBLIC_ID_RE.test(strictString(claimId))
  ) {
    return null;
  }
  const stable = {
    schemaVersion:
      MONEY_SHORTS_PART2_DUAL_PUBLISH_SAFE_VERSION,
    evidenceType: "claim",
    armed: true,
    claimId,
    claimedAtIso,
    planFingerprint: plan.planFingerprint,
    preflightFingerprint,
    currentBinding: plan.currentBinding,
    publicationAttemptFingerprint:
      plan.publicationAttemptFingerprint,
    expectedInstagramAccountId:
      plan.expectedInstagramAccountId,
    expectedYoutubeChannelId:
      plan.expectedYoutubeChannelId,
    ledgerBaselineSha256: plan.ledgerBaselineSha256,
    safety: plan.safety,
  };
  return fingerprinted(stable, "claimFingerprint");
}

export function buildMoneyShortsPart2DualPublishSafeEvent({
  claim,
  transition,
  previousTransition,
  previousEvidenceSha256,
  recordedAtIso,
  publicState,
  sideEffectCounters,
}) {
  if (
    !validFingerprint(claim, "claimFingerprint") ||
    !validIso(recordedAtIso) ||
    !validCounters(sideEffectCounters)
  ) {
    return null;
  }
  const index =
    MONEY_SHORTS_PART2_DUAL_PUBLISH_SAFE_TRANSITIONS.indexOf(
      transition,
    );
  if (index < 0) return null;
  const expectedPrevious =
    index === 0
      ? null
      : MONEY_SHORTS_PART2_DUAL_PUBLISH_SAFE_TRANSITIONS[
          index - 1
        ];
  if (
    previousTransition !== expectedPrevious ||
    !SHA256_RE.test(
      strictString(previousEvidenceSha256),
    )
  ) {
    return null;
  }
  const stable = {
    schemaVersion:
      MONEY_SHORTS_PART2_DUAL_PUBLISH_SAFE_VERSION,
    evidenceType: "event",
    claimFingerprint: claim.claimFingerprint,
    transition,
    previousTransition,
    previousEvidenceSha256,
    recordedAtIso,
    publicState,
    sideEffectCounters: { ...sideEffectCounters },
  };
  return fingerprinted(stable, "eventFingerprint");
}

export function buildMoneyShortsPart2DualPublishSafeResult({
  claim,
  latestEventSha256,
  latestTransition,
  status,
  blockerCode,
  completedAtIso,
  publicState,
  sideEffectCounters,
}) {
  if (
    !validFingerprint(claim, "claimFingerprint") ||
    !SHA256_RE.test(strictString(latestEventSha256)) ||
    typeof latestTransition !== "string" ||
    !MONEY_SHORTS_PART2_DUAL_PUBLISH_SAFE_TRANSITIONS.includes(
      latestTransition,
    ) ||
    typeof status !== "string" ||
    !validIso(completedAtIso) ||
    !validCounters(sideEffectCounters)
  ) {
    return null;
  }
  const stable = {
    schemaVersion:
      MONEY_SHORTS_PART2_DUAL_PUBLISH_SAFE_VERSION,
    evidenceType: "result",
    status,
    blockerCode:
      typeof blockerCode === "string" ? blockerCode : null,
    completedAtIso,
    claimFingerprint: claim.claimFingerprint,
    planFingerprint: claim.planFingerprint,
    preflightFingerprint: claim.preflightFingerprint,
    latestEventSha256,
    latestTransition,
    expectedInstagramAccountId:
      claim.expectedInstagramAccountId,
    expectedYoutubeChannelId:
      claim.expectedYoutubeChannelId,
    publicState,
    sideEffectCounters: { ...sideEffectCounters },
    automaticRetryAllowed: false,
    externalRecoveryEnabled: false,
    part1ActionAllowed: false,
  };
  return fingerprinted(stable, "resultFingerprint");
}

export function moneyShortsPart2DualPublishSafePaths(outDir) {
  const evidenceDir = join(
    outDir,
    MONEY_SHORTS_PART2_DUAL_PUBLISH_SAFE_DIRNAME,
  );
  return {
    evidenceDir,
    preflightPath: join(
      evidenceDir,
      MONEY_SHORTS_PART2_DUAL_PUBLISH_SAFE_PREFLIGHT_FILENAME,
    ),
    claimPath: join(
      evidenceDir,
      MONEY_SHORTS_PART2_DUAL_PUBLISH_SAFE_CLAIM_FILENAME,
    ),
    eventDir: join(
      evidenceDir,
      MONEY_SHORTS_PART2_DUAL_PUBLISH_SAFE_EVENT_DIRNAME,
    ),
    resultPath: join(
      evidenceDir,
      MONEY_SHORTS_PART2_DUAL_PUBLISH_SAFE_RESULT_FILENAME,
    ),
    lockPath: join(
      evidenceDir,
      "execution.lock",
    ),
  };
}

export function moneyShortsPart2DualPublishSafeEventPath(
  eventDir,
  transition,
) {
  const index =
    MONEY_SHORTS_PART2_DUAL_PUBLISH_SAFE_TRANSITIONS.indexOf(
      transition,
    );
  if (index < 0) {
    throw new Error("part2_dual_safe_transition_invalid");
  }
  return join(
    eventDir,
    `${String(index + 1).padStart(2, "0")}-${transition}.json`,
  );
}

export function writeMoneyShortsPart2DualPublishSafeEvidenceOnce(
  input,
) {
  const written =
    writeMoneyShortsYoutubeOnlyRecoveryEvidenceOnce(input);
  if (written.ok !== true) {
    return written;
  }
  const fingerprint =
    strictString(input?.evidence?.[input?.fingerprintField]);
  const path = strictString(input?.path);
  const fsImpl = input?.fsImpl ?? nodeFs;
  const preparedPath =
    `${path}.${fingerprint}.prepared`;
  const committedSourcePath =
    `${path}.${fingerprint}.committed-source`;
  try {
    if (
      !SHA256_RE.test(fingerprint) ||
      fsImpl.existsSync(preparedPath) ||
      !fsImpl.existsSync(committedSourcePath)
    ) {
      return {
        ok: false,
        reason:
          "part2_dual_safe_evidence_commit_incomplete",
        evidenceSaved: fsImpl.existsSync(path),
      };
    }
    const canonicalBytes = Buffer.from(
      fsImpl.readFileSync(path),
    );
    const committedBytes = Buffer.from(
      fsImpl.readFileSync(committedSourcePath),
    );
    if (!canonicalBytes.equals(committedBytes)) {
      return {
        ok: false,
        reason:
          "part2_dual_safe_evidence_commit_mismatch",
        evidenceSaved: true,
      };
    }
  } catch {
    return {
      ok: false,
      reason:
        "part2_dual_safe_evidence_commit_readback_failed",
      evidenceSaved: fsImpl.existsSync(path),
    };
  }
  return written;
}

export function acquireMoneyShortsPart2DualPublishSafeLock({
  lockPath,
  fsImpl,
}) {
  return acquireMoneyShortsYoutubeOnlyRecoveryLock({
    lockPath,
    ...(fsImpl ? { fsImpl } : {}),
  });
}

export function releaseMoneyShortsPart2DualPublishSafeLock({
  lock,
  fsImpl,
}) {
  return releaseMoneyShortsYoutubeOnlyRecoveryLock({
    lock,
    ...(fsImpl ? { fsImpl } : {}),
  });
}
