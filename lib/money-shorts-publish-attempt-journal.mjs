import { createHash, randomUUID } from "node:crypto";
import * as nodeFs from "node:fs";
import { join } from "node:path";

export const MONEY_SHORTS_PUBLISH_ATTEMPT_CLAIM_VERSION =
  "money_shorts_publish_attempt_claim_v1";
export const MONEY_SHORTS_PUBLISH_ATTEMPT_JOURNAL_VERSION =
  "money_shorts_publish_attempt_journal_v1";
export const MONEY_SHORTS_PUBLISH_ATTEMPT_CLAIM_FILENAME =
  "final-e2e-publish-attempt-claim.json";
export const MONEY_SHORTS_PUBLISH_ATTEMPT_JOURNAL_DIRNAME =
  "final-e2e-publish-attempt-journal";

const SHA256_RE = /^[a-f0-9]{64}$/;
const PART_ID_RE = /^(single|part-1|part-2)$/;
const PUBLIC_ID_RE = /^[A-Za-z0-9._:-]{1,240}$/;
const PUBLIC_REFERENCE_RE = /^[A-Za-z0-9._:/-]{1,500}$/;
const TRANSITIONS = new Set([
  "external_execution_ready",
  "blob_put_intent",
  "blob_put_confirmed",
  "blob_head_intent",
  "blob_head_confirmed",
  "instagram_container_intent",
  "instagram_container_confirmed",
  "instagram_poll_intent",
  "instagram_poll_observed",
  "instagram_poll_unknown",
  "instagram_container_ready",
  "instagram_publish_intent",
  "instagram_publish_confirmed",
  "youtube_insert_intent",
  "youtube_insert_confirmed",
  "ledger_write_intent",
  "ledger_write_confirmed",
  "complete",
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

export function normalizeMoneyShortsPublishAttemptBinding(value) {
  return {
    contentId: strictString(value?.contentId),
    version: strictString(value?.version),
    productionPartId: strictString(
      value?.productionPartId ??
        value?.wizardProductionPartId,
    ),
    contentUnitManifestPath: strictString(
      value?.contentUnitManifestPath,
    ),
    contentUnitSha256: strictString(value?.contentUnitSha256),
    instagramSourceSha256: strictString(
      value?.instagramSourceSha256,
    ),
    youtubeSourceSha256: strictString(
      value?.youtubeSourceSha256,
    ),
    publishMetadataSha256: strictString(
      value?.publishMetadataSha256,
    ),
    finalVideoApprovalFingerprint: strictString(
      value?.finalVideoApprovalFingerprint,
    ),
  };
}

function validBinding(binding) {
  return (
    binding.contentId.length > 0 &&
    binding.version.length > 0 &&
    PART_ID_RE.test(binding.productionPartId) &&
    binding.contentUnitManifestPath.length > 0 &&
    SHA256_RE.test(binding.contentUnitSha256) &&
    SHA256_RE.test(binding.instagramSourceSha256) &&
    SHA256_RE.test(binding.youtubeSourceSha256) &&
    SHA256_RE.test(binding.publishMetadataSha256) &&
    SHA256_RE.test(binding.finalVideoApprovalFingerprint)
  );
}

function canonicalFingerprintInput(binding) {
  const normalized =
    normalizeMoneyShortsPublishAttemptBinding(binding);
  return {
    contentId: normalized.contentId,
    version: normalized.version,
    wizardProductionPartId: normalized.productionPartId,
    contentUnitManifestPath:
      normalized.contentUnitManifestPath,
    contentUnitSha256: normalized.contentUnitSha256,
    instagramSourceSha256:
      normalized.instagramSourceSha256,
    youtubeSourceSha256: normalized.youtubeSourceSha256,
    publishMetadataSha256:
      normalized.publishMetadataSha256,
    finalVideoApprovalFingerprint:
      normalized.finalVideoApprovalFingerprint,
  };
}

export function fingerprintMoneyShortsPublishAttemptBinding(
  binding,
) {
  return sha256(
    JSON.stringify(canonicalFingerprintInput(binding)),
  );
}

function validIso(value) {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    Number.isFinite(Date.parse(value))
  );
}

export function validateMoneyShortsPublishAttemptClaimEvidence({
  evidence,
  currentBinding = null,
}) {
  if (!isPlainObject(evidence)) {
    return { valid: false, reason: "claim_not_object" };
  }
  const binding =
    normalizeMoneyShortsPublishAttemptBinding(evidence.binding);
  const publicationAttemptFingerprint =
    fingerprintMoneyShortsPublishAttemptBinding(binding);
  if (
    evidence.schemaVersion !==
      MONEY_SHORTS_PUBLISH_ATTEMPT_CLAIM_VERSION ||
    evidence.armed !== true ||
    typeof evidence.claimId !== "string" ||
    !PUBLIC_ID_RE.test(evidence.claimId) ||
    !validIso(evidence.claimedAtIso) ||
    !validBinding(binding) ||
    evidence.publicationAttemptFingerprint !==
      publicationAttemptFingerprint
  ) {
    return {
      valid: false,
      reason: "claim_schema_or_binding_invalid",
    };
  }
  if (currentBinding != null) {
    const current =
      normalizeMoneyShortsPublishAttemptBinding(currentBinding);
    if (
      !validBinding(current) ||
      JSON.stringify(binding) !== JSON.stringify(current)
    ) {
      return {
        valid: false,
        reason: "claim_current_binding_mismatch",
      };
    }
  }
  return {
    valid: true,
    reason: "claim_valid",
    binding,
    publicationAttemptFingerprint,
  };
}

function pathsFor(outDir) {
  if (typeof outDir !== "string" || outDir.length === 0) {
    throw new Error("publish_attempt_out_dir_invalid");
  }
  return {
    claimPath: join(
      outDir,
      MONEY_SHORTS_PUBLISH_ATTEMPT_CLAIM_FILENAME,
    ),
    journalDir: join(
      outDir,
      MONEY_SHORTS_PUBLISH_ATTEMPT_JOURNAL_DIRNAME,
    ),
  };
}

function closeIfOpen(fsImpl, fd) {
  if (fd == null) return;
  try {
    fsImpl.closeSync(fd);
  } catch {
    // A failed close leaves the exclusive evidence file in place.
  }
}

function readBytes(fsImpl, path) {
  const value = fsImpl.readFileSync(path);
  return Buffer.isBuffer(value) ? value : Buffer.from(value);
}

export function claimMoneyShortsPublishAttempt({
  outDir,
  binding,
  fsImpl = nodeFs,
  now = () => new Date().toISOString(),
  newId = () => randomUUID(),
}) {
  const paths = pathsFor(outDir);
  const normalizedBinding =
    normalizeMoneyShortsPublishAttemptBinding(binding);
  if (!validBinding(normalizedBinding)) {
    throw new Error("publish_attempt_binding_invalid");
  }
  if (
    fsImpl.existsSync(paths.claimPath) ||
    fsImpl.existsSync(paths.journalDir)
  ) {
    return {
      ok: false,
      reason:
        "publish_attempt_evidence_exists_manual_review_required",
    };
  }

  const claimId = strictString(newId());
  const claimedAtIso = strictString(now());
  const claim = {
    schemaVersion:
      MONEY_SHORTS_PUBLISH_ATTEMPT_CLAIM_VERSION,
    armed: true,
    claimId,
    claimedAtIso,
    publicationAttemptFingerprint:
      fingerprintMoneyShortsPublishAttemptBinding(
        normalizedBinding,
      ),
    binding: normalizedBinding,
  };
  if (
    validateMoneyShortsPublishAttemptClaimEvidence({
      evidence: claim,
      currentBinding: normalizedBinding,
    }).valid !== true
  ) {
    throw new Error("publish_attempt_claim_invalid");
  }

  fsImpl.mkdirSync(outDir, { recursive: true });
  const serialized = Buffer.from(
    `${JSON.stringify(claim, null, 2)}\n`,
    "utf8",
  );
  let fd = null;
  try {
    fd = fsImpl.openSync(paths.claimPath, "wx");
    fsImpl.writeFileSync(fd, serialized);
    fsImpl.fsyncSync(fd);
    fsImpl.closeSync(fd);
    fd = null;
    const readBack = readBytes(fsImpl, paths.claimPath);
    if (!readBack.equals(serialized)) {
      throw new Error("publish_attempt_claim_readback_mismatch");
    }
  } catch (error) {
    closeIfOpen(fsImpl, fd);
    if (
      error &&
      typeof error === "object" &&
      error.code === "EEXIST"
    ) {
      return {
        ok: false,
        reason:
          "publish_attempt_claim_already_exists_manual_review_required",
      };
    }
    throw error;
  }

  return {
    ok: true,
    claim,
    claimSha256: sha256(serialized),
    handle: {
      outDir,
      claimPath: paths.claimPath,
      journalDir: paths.journalDir,
      claimId,
      binding: normalizedBinding,
      publicationAttemptFingerprint:
        claim.publicationAttemptFingerprint,
      nextSequence: 1,
      previousEventSha256: null,
      terminal: false,
    },
  };
}

function counter(value) {
  return Number.isSafeInteger(value) && value >= 0
    ? value
    : 0;
}

function publicId(value) {
  return typeof value === "string" && PUBLIC_ID_RE.test(value)
    ? value
    : null;
}

function publicReference(value) {
  return (
    typeof value === "string" &&
    PUBLIC_REFERENCE_RE.test(value)
  )
    ? value
    : null;
}

function publicPathname(value) {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    value.length > 500 ||
    /[?#]/.test(value)
  ) {
    return null;
  }
  return value;
}

function status(value, allowed) {
  return allowed.has(value) ? value : null;
}

function normalizePublicState(value) {
  const counters = value?.sideEffectCounters ?? {};
  const blob = value?.blob ?? {};
  const instagram = value?.instagram ?? {};
  const youtube = value?.youtube ?? {};
  const ledger = value?.ledger ?? {};
  return {
    sideEffectCounters: {
      blobPutCount: counter(counters.blobPutCount),
      blobHeadCount: counter(counters.blobHeadCount),
      instagramContainerCreateCount: counter(
        counters.instagramContainerCreateCount,
      ),
      instagramStatusPollCount: counter(
        counters.instagramStatusPollCount,
      ),
      instagramPublishCount: counter(
        counters.instagramPublishCount,
      ),
      youtubeInsertCount: counter(
        counters.youtubeInsertCount,
      ),
      ledgerWriteCount: counter(counters.ledgerWriteCount),
      envSecretValuePrintCount: counter(
        counters.envSecretValuePrintCount,
      ),
    },
    blob: {
      status: status(
        blob.status,
        new Set(["pending", "uploaded", "failed"]),
      ),
      pathname: publicPathname(blob.pathname),
      headStatus:
        Number.isSafeInteger(blob.headStatus) &&
        blob.headStatus >= 100 &&
        blob.headStatus <= 599
          ? blob.headStatus
          : null,
    },
    instagram: {
      status: status(
        instagram.status,
        new Set(["pending", "failed", "published"]),
      ),
      outcome: status(
        instagram.outcome,
        new Set([
          "not_started",
          "unknown",
          "confirmed_published",
          "confirmed_not_published",
        ]),
      ),
      containerId: publicId(instagram.containerId),
      mediaId: publicId(instagram.mediaId),
      lastStatusCode: status(
        instagram.lastStatusCode,
        new Set([
          "IN_PROGRESS",
          "FINISHED",
          "ERROR",
          "EXPIRED",
          "UNKNOWN",
        ]),
      ),
    },
    youtube: {
      status: status(
        youtube.status,
        new Set(["pending", "failed", "uploaded"]),
      ),
      outcome: status(
        youtube.outcome,
        new Set([
          "not_started",
          "unknown",
          "confirmed_published",
          "confirmed_not_published",
        ]),
      ),
      videoId: publicId(youtube.videoId),
    },
    ledger: {
      status: status(
        ledger.status,
        new Set(["pending", "failed", "written"]),
      ),
      writeOk: ledger.writeOk === true,
      recordedKeys: Array.isArray(ledger.recordedKeys)
        ? ledger.recordedKeys
            .map(publicReference)
            .filter((item) => item != null)
        : [],
    },
  };
}

function validateHandle(handle) {
  return (
    isPlainObject(handle) &&
    typeof handle.outDir === "string" &&
    typeof handle.claimPath === "string" &&
    typeof handle.journalDir === "string" &&
    PUBLIC_ID_RE.test(String(handle.claimId ?? "")) &&
    validBinding(
      normalizeMoneyShortsPublishAttemptBinding(handle.binding),
    ) &&
    SHA256_RE.test(
      String(handle.publicationAttemptFingerprint ?? ""),
    ) &&
    Number.isSafeInteger(handle.nextSequence) &&
    handle.nextSequence >= 1 &&
    (handle.previousEventSha256 === null ||
      SHA256_RE.test(handle.previousEventSha256)) &&
    handle.terminal !== true
  );
}

export function appendMoneyShortsPublishAttemptJournal({
  handle,
  transition,
  state,
  fsImpl = nodeFs,
  now = () => new Date().toISOString(),
  newId = () => randomUUID(),
}) {
  if (!validateHandle(handle)) {
    throw new Error("publish_attempt_handle_invalid_or_terminal");
  }
  if (!TRANSITIONS.has(transition)) {
    throw new Error("publish_attempt_transition_invalid");
  }
  const eventId = strictString(newId());
  if (!PUBLIC_ID_RE.test(eventId)) {
    throw new Error("publish_attempt_event_id_invalid");
  }
  const sequence = handle.nextSequence;
  const event = {
    schemaVersion:
      MONEY_SHORTS_PUBLISH_ATTEMPT_JOURNAL_VERSION,
    claimId: handle.claimId,
    publicationAttemptFingerprint:
      handle.publicationAttemptFingerprint,
    sequence,
    previousEventSha256: handle.previousEventSha256,
    recordedAtIso: strictString(now()),
    transition,
    binding:
      normalizeMoneyShortsPublishAttemptBinding(handle.binding),
    state: normalizePublicState(state),
  };
  if (!validIso(event.recordedAtIso)) {
    throw new Error("publish_attempt_event_time_invalid");
  }
  const serialized = Buffer.from(
    `${JSON.stringify(event, null, 2)}\n`,
    "utf8",
  );
  const paddedSequence = String(sequence).padStart(6, "0");
  const finalPath = join(
    handle.journalDir,
    `${paddedSequence}-${eventId}.json`,
  );
  const tempPath = `${finalPath}.${eventId}.tmp`;

  fsImpl.mkdirSync(handle.journalDir, { recursive: true });
  if (
    fsImpl.existsSync(finalPath) ||
    fsImpl.existsSync(tempPath)
  ) {
    throw new Error("publish_attempt_event_path_collision");
  }
  let fd = null;
  try {
    fd = fsImpl.openSync(tempPath, "wx");
    fsImpl.writeFileSync(fd, serialized);
    fsImpl.fsyncSync(fd);
    fsImpl.closeSync(fd);
    fd = null;
    fsImpl.renameSync(tempPath, finalPath);
    const readBack = readBytes(fsImpl, finalPath);
    if (!readBack.equals(serialized)) {
      throw new Error("publish_attempt_event_readback_mismatch");
    }
  } catch (error) {
    closeIfOpen(fsImpl, fd);
    throw error;
  }

  const eventSha256 = sha256(serialized);
  return {
    ok: true,
    event,
    eventSha256,
    eventPath: finalPath,
    handle: {
      ...handle,
      nextSequence: sequence + 1,
      previousEventSha256: eventSha256,
      terminal: transition === "complete",
    },
  };
}

function claimFileEvidence(fsImpl, claimPath) {
  if (!fsImpl.existsSync(claimPath)) {
    return {
      exists: false,
      parseOk: false,
      sha256: null,
      evidence: null,
    };
  }
  try {
    const bytes = readBytes(fsImpl, claimPath);
    let evidence = null;
    let parseOk = false;
    try {
      evidence = JSON.parse(bytes.toString("utf8"));
      parseOk = true;
    } catch {
      parseOk = false;
    }
    return {
      exists: true,
      parseOk,
      sha256: sha256(bytes),
      evidence,
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

export function inspectMoneyShortsPublishAttemptEvidence({
  outDir,
  currentBinding = null,
  fsImpl = nodeFs,
}) {
  const paths = pathsFor(outDir);
  const claimFile = claimFileEvidence(
    fsImpl,
    paths.claimPath,
  );
  const journalExists = fsImpl.existsSync(paths.journalDir);
  if (!claimFile.exists && !journalExists) {
    return {
      exists: false,
      safeToClaim: true,
      valid: true,
      reason: "no_publish_attempt_evidence",
      claimFile,
      events: [],
    };
  }
  if (!claimFile.exists) {
    return {
      exists: true,
      safeToClaim: false,
      valid: false,
      reason: "journal_exists_without_claim",
      claimFile,
      events: [],
    };
  }
  if (!claimFile.parseOk || !SHA256_RE.test(claimFile.sha256)) {
    return {
      exists: true,
      safeToClaim: false,
      valid: false,
      reason: "claim_unreadable_or_unhashed",
      claimFile,
      events: [],
    };
  }
  const claimValidation =
    validateMoneyShortsPublishAttemptClaimEvidence({
      evidence: claimFile.evidence,
      currentBinding,
    });
  if (claimValidation.valid !== true) {
    return {
      exists: true,
      safeToClaim: false,
      valid: false,
      reason: claimValidation.reason,
      claimFile,
      events: [],
    };
  }

  let names = [];
  if (journalExists) {
    try {
      names = fsImpl.readdirSync(paths.journalDir);
    } catch {
      return {
        exists: true,
        safeToClaim: false,
        valid: false,
        reason: "journal_directory_unreadable",
        claimFile,
        events: [],
      };
    }
  }
  if (
    names.some(
      (name) =>
        typeof name !== "string" ||
        name.endsWith(".tmp") ||
        !/^\d{6}-[A-Za-z0-9._:-]+\.json$/.test(name),
    )
  ) {
    return {
      exists: true,
      safeToClaim: false,
      valid: false,
      reason: "journal_orphan_or_unknown_file_present",
      claimFile,
      events: [],
    };
  }

  const orderedNames = [...names].sort();
  const events = [];
  let previousEventSha256 = null;
  let terminalSeen = false;
  for (
    let index = 0;
    index < orderedNames.length;
    index += 1
  ) {
    const path = join(paths.journalDir, orderedNames[index]);
    let bytes;
    let event;
    try {
      bytes = readBytes(fsImpl, path);
      event = JSON.parse(bytes.toString("utf8"));
    } catch {
      return {
        exists: true,
        safeToClaim: false,
        valid: false,
        reason: "journal_event_unreadable",
        claimFile,
        events,
      };
    }
    const expectedSequence = index + 1;
    const eventBinding =
      normalizeMoneyShortsPublishAttemptBinding(event?.binding);
    const eventState = normalizePublicState(event?.state);
    if (
      !isPlainObject(event) ||
      event.schemaVersion !==
        MONEY_SHORTS_PUBLISH_ATTEMPT_JOURNAL_VERSION ||
      event.claimId !== claimFile.evidence.claimId ||
      event.publicationAttemptFingerprint !==
        claimValidation.publicationAttemptFingerprint ||
      event.sequence !== expectedSequence ||
      event.previousEventSha256 !== previousEventSha256 ||
      !validIso(event.recordedAtIso) ||
      !TRANSITIONS.has(event.transition) ||
      (expectedSequence === 1 &&
        event.transition !== "external_execution_ready") ||
      terminalSeen ||
      JSON.stringify(eventBinding) !==
        JSON.stringify(claimValidation.binding) ||
      !isPlainObject(event.state) ||
      JSON.stringify(event.state) !==
        JSON.stringify(eventState)
    ) {
      return {
        exists: true,
        safeToClaim: false,
        valid: false,
        reason: "journal_event_chain_invalid",
        claimFile,
        events,
      };
    }
    terminalSeen = event.transition === "complete";
    previousEventSha256 = sha256(bytes);
    events.push({
      ...event,
      eventSha256: previousEventSha256,
    });
  }
  return {
    exists: true,
    safeToClaim: false,
    valid: true,
    reason:
      events.at(-1)?.transition === "complete"
        ? "publish_attempt_complete_evidence_present"
        : "publish_attempt_manual_review_required",
    claimFile,
    events,
    latestEvent: events.at(-1) ?? null,
  };
}
