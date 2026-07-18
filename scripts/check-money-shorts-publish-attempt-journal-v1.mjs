import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  appendMoneyShortsPublishAttemptJournal,
  claimMoneyShortsPublishAttempt,
  fingerprintMoneyShortsPublishAttemptBinding,
  inspectMoneyShortsPublishAttemptEvidence,
} from "../lib/money-shorts-publish-attempt-journal.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = readFileSync(
  join(ROOT, "lib", "money-shorts-publish-attempt-journal.mjs"),
  "utf8",
);

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

class FakeFs {
  constructor() {
    this.files = new Map();
    this.directories = new Set();
    this.fds = new Map();
    this.nextFd = 10;
    this.openCount = 0;
    this.writeCount = 0;
    this.renameCount = 0;
    this.failFsync = false;
    this.failRename = false;
    this.hideExists = false;
  }

  existsSync(path) {
    if (this.hideExists) return false;
    return this.files.has(path) || this.directories.has(path);
  }

  mkdirSync(path) {
    this.directories.add(path);
  }

  openSync(path, flag) {
    this.openCount += 1;
    if (flag !== "wx") throw new Error("fake_requires_wx");
    if (this.files.has(path)) {
      const error = new Error("exists");
      error.code = "EEXIST";
      throw error;
    }
    this.files.set(path, Buffer.alloc(0));
    const fd = this.nextFd++;
    this.fds.set(fd, path);
    return fd;
  }

  writeFileSync(fd, value) {
    this.writeCount += 1;
    const path = this.fds.get(fd);
    if (!path) throw new Error("fake_fd_invalid");
    this.files.set(path, Buffer.from(value));
  }

  fsyncSync() {
    if (this.failFsync) throw new Error("fake_fsync_failed");
  }

  closeSync(fd) {
    this.fds.delete(fd);
  }

  readFileSync(path) {
    if (!this.files.has(path)) throw new Error("fake_not_found");
    return Buffer.from(this.files.get(path));
  }

  renameSync(from, to) {
    this.renameCount += 1;
    if (this.failRename) throw new Error("fake_rename_failed");
    if (!this.files.has(from)) throw new Error("fake_not_found");
    this.files.set(to, this.files.get(from));
    this.files.delete(from);
  }

  readdirSync(path) {
    if (!this.directories.has(path)) {
      throw new Error("fake_directory_not_found");
    }
    return [...this.files.keys()]
      .filter((candidate) => dirname(candidate) === path)
      .map((candidate) => candidate.slice(path.length + 1));
  }
}

const BINDING = Object.freeze({
  contentId: "wizard-finance-attempt-test",
  version: "wizard_finance_publish_v1",
  productionPartId: "single",
  contentUnitManifestPath:
    "C:\\tmp\\money-shorts-os\\attempt-test\\content-unit.json",
  contentUnitSha256: "a".repeat(64),
  instagramSourceSha256: "b".repeat(64),
  youtubeSourceSha256: "c".repeat(64),
  publishMetadataSha256: "d".repeat(64),
  finalVideoApprovalFingerprint: "e".repeat(64),
});
const NOW = () => "2026-07-18T00:00:00.000Z";
const zeroState = {
  sideEffectCounters: {
    blobPutCount: 0,
    blobHeadCount: 0,
    instagramContainerCreateCount: 0,
    instagramStatusPollCount: 0,
    instagramPublishCount: 0,
    youtubeInsertCount: 0,
    ledgerWriteCount: 0,
    envSecretValuePrintCount: 0,
  },
  blob: { status: "pending", pathname: "instagram/reels/a.mp4" },
  instagram: { status: "pending", outcome: "not_started" },
  youtube: { status: "pending", outcome: "not_started" },
  ledger: { status: "pending", writeOk: false, recordedKeys: [] },
};

const expectedFingerprint = createHash("sha256")
  .update(
    JSON.stringify({
      contentId: BINDING.contentId,
      version: BINDING.version,
      wizardProductionPartId: BINDING.productionPartId,
      contentUnitManifestPath: BINDING.contentUnitManifestPath,
      contentUnitSha256: BINDING.contentUnitSha256,
      instagramSourceSha256: BINDING.instagramSourceSha256,
      youtubeSourceSha256: BINDING.youtubeSourceSha256,
      publishMetadataSha256: BINDING.publishMetadataSha256,
      finalVideoApprovalFingerprint:
        BINDING.finalVideoApprovalFingerprint,
    }),
  )
  .digest("hex");
check(
  "binding fingerprint preserves the runner/classifier canonical shape",
  fingerprintMoneyShortsPublishAttemptBinding(BINDING) ===
    expectedFingerprint,
);
for (const field of Object.keys(BINDING)) {
  const changed = { ...BINDING, [field]: `${BINDING[field]}x` };
  check(
    `binding mutation changes fingerprint: ${field}`,
    fingerprintMoneyShortsPublishAttemptBinding(changed) !==
      expectedFingerprint,
  );
}

const invalidFs = new FakeFs();
let invalidRejected = false;
try {
  claimMoneyShortsPublishAttempt({
    outDir: "C:\\tmp\\invalid",
    binding: { ...BINDING, contentUnitSha256: "bad" },
    fsImpl: invalidFs,
    now: NOW,
    newId: () => "invalid-claim",
  });
} catch {
  invalidRejected = true;
}
check(
  "invalid binding is rejected before any filesystem write",
  invalidRejected &&
    invalidFs.openCount === 0 &&
    invalidFs.writeCount === 0,
);

const fs = new FakeFs();
const outDir = "C:\\tmp\\publish-attempt-test";
const claimed = claimMoneyShortsPublishAttempt({
  outDir,
  binding: BINDING,
  fsImpl: fs,
  now: NOW,
  newId: () => "claim-1",
});
check(
  "claim is acquired once through exclusive wx and survives",
  claimed.ok === true &&
    fs.openCount === 1 &&
    fs.files.has(claimed.handle.claimPath),
);
const openBeforeSecond = fs.openCount;
const second = claimMoneyShortsPublishAttempt({
  outDir,
  binding: BINDING,
  fsImpl: fs,
  now: NOW,
  newId: () => "claim-2",
});
check(
  "existing claim blocks a second attempt without overwriting",
  second.ok === false &&
    fs.openCount === openBeforeSecond &&
    fs.files.has(claimed.handle.claimPath),
);

fs.hideExists = true;
const raced = claimMoneyShortsPublishAttempt({
  outDir,
  binding: BINDING,
  fsImpl: fs,
  now: NOW,
  newId: () => "claim-race",
});
fs.hideExists = false;
check(
  "wx closes the concurrent pre-check race with exactly one winner",
  raced.ok === false &&
    raced.reason.includes("already_exists") &&
    fs.files.has(claimed.handle.claimPath),
);

let handle = claimed.handle;
let eventId = 0;
for (const transition of [
  "external_execution_ready",
  "blob_put_intent",
  "blob_put_confirmed",
]) {
  const appended = appendMoneyShortsPublishAttemptJournal({
    handle,
    transition,
    state: {
      ...zeroState,
      access_token: "must-never-persist",
      blob: {
        ...zeroState.blob,
        errorExcerpt: "vercel_blob_rw_must-never-persist",
      },
      ledger: {
        ...zeroState.ledger,
        recordedKeys: [
          "wizard-finance/instagram_reels/wizard_finance_publish_v1",
        ],
      },
    },
    fsImpl: fs,
    now: NOW,
    newId: () => `event-${++eventId}`,
  });
  handle = appended.handle;
}
const inspection = inspectMoneyShortsPublishAttemptEvidence({
  outDir,
  currentBinding: BINDING,
  fsImpl: fs,
});
const allSerialized = [...fs.files.values()]
  .map((value) => value.toString("utf8"))
  .join("\n");
check(
  "immutable revisions form a valid sequence and raw hash chain",
  inspection.valid === true &&
    inspection.events.length === 3 &&
    inspection.events[1].previousEventSha256 ===
      inspection.events[0].eventSha256,
);
check(
  "journal allowlist drops secret-like and free-form error fields",
  !allSerialized.includes("must-never-persist") &&
    !allSerialized.includes("errorExcerpt"),
);
check(
  "public ledger keys survive the journal allowlist",
  inspection.events.at(-1)?.state.ledger.recordedKeys[0] ===
    "wizard-finance/instagram_reels/wizard_finance_publish_v1",
);
check(
  "journal never renames over an existing canonical revision",
  fs.renameCount === 3 &&
    inspection.events.every(
      (event, index) => event.sequence === index + 1,
    ),
);
const renameBeforeCollision = fs.renameCount;
let collisionRejected = false;
try {
  appendMoneyShortsPublishAttemptJournal({
    handle: claimed.handle,
    transition: "external_execution_ready",
    state: zeroState,
    fsImpl: fs,
    now: NOW,
    newId: () => "event-1",
  });
} catch {
  collisionRejected = true;
}
check(
  "an event-path collision fails before rename or overwrite",
  collisionRejected &&
    fs.renameCount === renameBeforeCollision &&
    inspection.events.length === 3,
);

const terminal = appendMoneyShortsPublishAttemptJournal({
  handle,
  transition: "complete",
  state: zeroState,
  fsImpl: fs,
  now: NOW,
  newId: () => "event-terminal",
});
let terminalRejected = false;
try {
  appendMoneyShortsPublishAttemptJournal({
    handle: terminal.handle,
    transition: "complete",
    state: zeroState,
    fsImpl: fs,
    now: NOW,
    newId: () => "event-after-terminal",
  });
} catch {
  terminalRejected = true;
}
check(
  "terminal evidence cannot be appended or released for retry",
  terminalRejected && terminal.handle.terminal === true,
);

const orphanFs = new FakeFs();
const orphanClaim = claimMoneyShortsPublishAttempt({
  outDir: "C:\\tmp\\orphan-test",
  binding: BINDING,
  fsImpl: orphanFs,
  now: NOW,
  newId: () => "claim-orphan",
});
orphanFs.failRename = true;
let renameFailed = false;
try {
  appendMoneyShortsPublishAttemptJournal({
    handle: orphanClaim.handle,
    transition: "external_execution_ready",
    state: zeroState,
    fsImpl: orphanFs,
    now: NOW,
    newId: () => "event-orphan",
  });
} catch {
  renameFailed = true;
}
orphanFs.failRename = false;
const orphanInspection =
  inspectMoneyShortsPublishAttemptEvidence({
    outDir: "C:\\tmp\\orphan-test",
    currentBinding: BINDING,
    fsImpl: orphanFs,
  });
check(
  "rename failure preserves orphan tmp and inspect fails closed",
  renameFailed &&
    orphanInspection.valid === false &&
    orphanInspection.reason ===
      "journal_orphan_or_unknown_file_present",
);

const partialFs = new FakeFs();
partialFs.failFsync = true;
let fsyncFailed = false;
try {
  claimMoneyShortsPublishAttempt({
    outDir: "C:\\tmp\\partial-claim",
    binding: BINDING,
    fsImpl: partialFs,
    now: NOW,
    newId: () => "claim-partial",
  });
} catch {
  fsyncFailed = true;
}
partialFs.failFsync = false;
check(
  "claim fsync failure leaves durable blocking evidence",
  fsyncFailed && partialFs.files.size === 1,
);

const corruptFs = new FakeFs();
const corruptClaim = claimMoneyShortsPublishAttempt({
  outDir: "C:\\tmp\\corrupt-claim",
  binding: BINDING,
  fsImpl: corruptFs,
  now: NOW,
  newId: () => "claim-corrupt",
});
corruptFs.files.set(
  corruptClaim.handle.claimPath,
  Buffer.from("{broken"),
);
const corruptInspection =
  inspectMoneyShortsPublishAttemptEvidence({
    outDir: "C:\\tmp\\corrupt-claim",
    currentBinding: BINDING,
    fsImpl: corruptFs,
  });
check(
  "corrupt claim remains manual-review evidence",
  corruptInspection.exists === true &&
    corruptInspection.safeToClaim === false &&
    corruptInspection.valid === false,
);

check(
  "module has no network, env, delete, release, or retry activation path",
  !/\bfetch\s*\(|process\.env|rmSync|unlinkSync|remove|release|clear|setTimeout|setInterval/.test(
    source,
  ),
);
check(
  "production implementation explicitly uses wx, fsync, immutable rename, and readback",
  source.includes('openSync(paths.claimPath, "wx")') &&
    source.includes('openSync(tempPath, "wx")') &&
    source.includes("fsyncSync(fd)") &&
    source.includes("renameSync(tempPath, finalPath)") &&
    source.includes("readBack.equals(serialized)"),
);

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
