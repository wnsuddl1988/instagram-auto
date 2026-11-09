#!/usr/bin/env node

import { createHash } from "node:crypto";
import {
  readFileSync,
  readdirSync,
  statSync,
} from "node:fs";
import { join } from "node:path";

import {
  buildMoneyShortsPart2YoutubeRecoveryPreflight,
  buildMoneyShortsPart2YoutubeRecoveryPreflightPlan,
  parseMoneyShortsPart2YoutubeRecoveryPreflightArgs,
  runMoneyShortsPart2YoutubeRecoveryPreflight,
  runMoneyShortsPart2YoutubeRecoveryPreflightTestOnly,
  validateMoneyShortsPart2YoutubeRecoveryPreflight,
} from "./run-money-shorts-part2-youtube-recovery-preflight-v1.mjs";

const RUNNER_PATH = new URL(
  "./run-money-shorts-part2-youtube-recovery-preflight-v1.mjs",
  import.meta.url,
);
const CONTENT_ID =
  "wizard-gen-finance-editorial-v2-time-retirement-wealth-standard-05-part-2";
const CONTENT_UNIT_PATH =
  "C:\\tmp\\money-shorts-os\\web-wizard-create-v1\\" +
  "gen-finance-editorial-v2-time-retirement-wealth-standard-05\\" +
  "publish\\v5\\part-2\\dual_platform_content_unit." +
  `${CONTENT_ID}.v5.json`;
const LEDGER_PATH =
  "C:\\tmp\\money-shorts-os\\" +
  "final-e2e-ready-content-unit-and-publish-one-v1\\" +
  "publish-ledger.json";
const ORIGINAL_OUT_DIR =
  "C:\\tmp\\money-shorts-os\\web-wizard-create-v1\\" +
  "gen-finance-editorial-v2-time-retirement-wealth-standard-05\\" +
  "publish\\v5\\part-2";
const INSTAGRAM_RECOVERY_OUT_DIR =
  "C:\\tmp\\money-shorts-os\\" +
  "part2-instagram-recovery-execution-v1\\" +
  `${CONTENT_ID}\\bd9286b24f6463ae`;
const SAFE_RESULT_DIR = join(
  ORIGINAL_OUT_DIR,
  "part2-dual-platform-publish-safe-v1",
);
const HASH = "a".repeat(64);

const ACTUAL_ARGS = [
  "--inspection",
  "INSPECT_PART2_YOUTUBE_RECOVERY_EVIDENCE_V1",
  "--content-unit",
  CONTENT_UNIT_PATH,
  "--ledger",
  LEDGER_PATH,
  "--original-out-dir",
  ORIGINAL_OUT_DIR,
  "--instagram-recovery-out-dir",
  INSTAGRAM_RECOVERY_OUT_DIR,
  "--expected-content-id",
  CONTENT_ID,
  "--expected-manifest-sha256",
  "f71e8f303cdeb22c06af0f7998a619d91d1b0f24c90a7b9d1c3846144c6bf099",
  "--expected-source-sha256",
  "bd9286b24f6463ae4a876e2c6414d49083b350c3759e9e33c60d27e0ca9a9d98",
  "--expected-publication-attempt-fingerprint",
  "67c80571d55409dc0dd792b2a121bc89b0ecab8f785174fae3a36a8231bfdeb3",
  "--expected-instagram-account-id",
  "17841414372742257",
  "--expected-instagram-media-id",
  "17942576889054573",
  "--expected-youtube-channel-id",
  "UCR23z78qDtyhHIaV29rSB9A",
  "--expected-original-safe-result-file-sha256",
  "79279801e323224c8ce0b350cb06f3dbde0dd197587ffab6f855fd8ce6ed01fa",
  "--expected-original-safe-result-fingerprint",
  "7f4dbcd3cb23d81fae0d64d175f0ff273996a19e23befd13405604ff466c9ce8",
  "--expected-instagram-recovery-preflight-fingerprint",
  "53251b303d8ee584ad7c648f86dfd4cf7d001ff5e490b031bb158a406a590081",
  "--expected-instagram-recovery-claim-fingerprint",
  "562f67e33af13d58a55f081d62dd247abf307f50a9def5fbce2f04fbadd7ed1c",
  "--expected-instagram-recovery-result-file-sha256",
  "de78cbb292efd4a5dec333683a5f1531d5d61414b98e71b94b2cc569b9c8cb9a",
  "--expected-instagram-recovery-result-fingerprint",
  "8c36cf4bed4730731a61757f6ce6f4ee40aa77625ed980e89beb29cb481f5277",
  "--expected-ledger-sha256",
  "dc67b683361eacd658c6e27383da15863f78bdf9e85a4d6ac212fd540ae3a8c4",
];

let passed = 0;
let failed = 0;

function check(name, condition, detail = "") {
  if (condition) {
    passed += 1;
    console.log(`PASS ${name}`);
  } else {
    failed += 1;
    console.error(
      `FAIL ${name}${detail ? `: ${detail}` : ""}`,
    );
  }
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function fileSha256(path) {
  return sha256(readFileSync(path));
}

function treeSnapshot(root) {
  const entries = [];
  function walk(directory, prefix = "") {
    for (const name of readdirSync(directory).sort()) {
      const path = join(directory, name);
      const relativePath = prefix
        ? `${prefix}/${name}`
        : name;
      const stat = statSync(path);
      if (stat.isDirectory()) {
        entries.push(`dir:${relativePath}`);
        walk(path, relativePath);
      } else {
        entries.push(
          `file:${relativePath}:${stat.size}:${fileSha256(path)}`,
        );
      }
    }
  }
  walk(root);
  return entries;
}

function replaceFlagValue(args, flag, value) {
  const updated = [...args];
  const index = updated.indexOf(flag);
  if (index >= 0) updated[index + 1] = value;
  return updated;
}

function removeFlag(args, flag) {
  const updated = [...args];
  const index = updated.indexOf(flag);
  if (index >= 0) updated.splice(index, 2);
  return updated;
}

const parsed =
  parseMoneyShortsPart2YoutubeRecoveryPreflightArgs(
    ACTUAL_ARGS,
  );
check("exact arguments parse", parsed.ok === true);
check(
  "armed flag is structurally forbidden",
  parseMoneyShortsPart2YoutubeRecoveryPreflightArgs([
    ...ACTUAL_ARGS,
    "--arm",
  ]).reason ===
    "PART2_YOUTUBE_RECOVERY_PREFLIGHT_LIVE_FLAG_FORBIDDEN",
);
check(
  "execute flag is structurally forbidden",
  parseMoneyShortsPart2YoutubeRecoveryPreflightArgs([
    ...ACTUAL_ARGS,
    "--execute",
  ]).reason ===
    "PART2_YOUTUBE_RECOVERY_PREFLIGHT_LIVE_FLAG_FORBIDDEN",
);
check(
  "retry flag is structurally forbidden",
  parseMoneyShortsPart2YoutubeRecoveryPreflightArgs([
    ...ACTUAL_ARGS,
    "--retry",
  ]).reason ===
    "PART2_YOUTUBE_RECOVERY_PREFLIGHT_LIVE_FLAG_FORBIDDEN",
);
check(
  "unknown argument fails closed",
  parseMoneyShortsPart2YoutubeRecoveryPreflightArgs([
    ...ACTUAL_ARGS,
    "--unknown",
    "value",
  ]).reason ===
    "PART2_YOUTUBE_RECOVERY_PREFLIGHT_UNKNOWN_OR_DUPLICATE_ARGUMENT",
);
check(
  "duplicate argument fails closed",
  parseMoneyShortsPart2YoutubeRecoveryPreflightArgs([
    ...ACTUAL_ARGS,
    "--expected-ledger-sha256",
    HASH,
  ]).reason ===
    "PART2_YOUTUBE_RECOVERY_PREFLIGHT_UNKNOWN_OR_DUPLICATE_ARGUMENT",
);
check(
  "missing required binding fails closed",
  parseMoneyShortsPart2YoutubeRecoveryPreflightArgs(
    removeFlag(ACTUAL_ARGS, "--expected-ledger-sha256"),
  ).reason ===
    "PART2_YOUTUBE_RECOVERY_PREFLIGHT_EXACT_ARGUMENTS_REQUIRED",
);
check(
  "relative path fails closed",
  parseMoneyShortsPart2YoutubeRecoveryPreflightArgs(
    replaceFlagValue(
      ACTUAL_ARGS,
      "--instagram-recovery-out-dir",
      "relative-path",
    ),
  ).reason ===
    "PART2_YOUTUBE_RECOVERY_PREFLIGHT_EXACT_ARGUMENTS_REQUIRED",
);
check(
  "invalid hash fails closed",
  parseMoneyShortsPart2YoutubeRecoveryPreflightArgs(
    replaceFlagValue(
      ACTUAL_ARGS,
      "--expected-ledger-sha256",
      "not-a-hash",
    ),
  ).reason ===
    "PART2_YOUTUBE_RECOVERY_PREFLIGHT_EXACT_ARGUMENTS_REQUIRED",
);
check(
  "invalid Part 2 content id fails closed",
  parseMoneyShortsPart2YoutubeRecoveryPreflightArgs(
    replaceFlagValue(
      ACTUAL_ARGS,
      "--expected-content-id",
      "wrong-part-1",
    ),
  ).reason ===
    "PART2_YOUTUBE_RECOVERY_PREFLIGHT_EXACT_ARGUMENTS_REQUIRED",
);

const before = {
  ledger: fileSha256(LEDGER_PATH),
  contentUnit: fileSha256(CONTENT_UNIT_PATH),
  safeResultTree: treeSnapshot(SAFE_RESULT_DIR),
  instagramRecoveryTree: treeSnapshot(
    INSTAGRAM_RECOVERY_OUT_DIR,
  ),
};

const actualRun =
  await runMoneyShortsPart2YoutubeRecoveryPreflight({
    argv: ACTUAL_ARGS,
  });
check(
  "immutable real evidence validates",
  actualRun.ok === true &&
    actualRun.status ===
      "LOCAL_PART2_YOUTUBE_RECOVERY_PREFLIGHT_OK",
  actualRun.reason ?? "",
);
check(
  "real preflight remains review-only",
  actualRun.readyForActualExecution === false &&
    actualRun.safeToUpload === false &&
    actualRun.ownerApprovalRequired === true,
);
check(
  "real binding targets exact Part 2 source and channel",
  actualRun.contentId === CONTENT_ID &&
    actualRun.sourceSha256 ===
      "bd9286b24f6463ae4a876e2c6414d49083b350c3759e9e33c60d27e0ca9a9d98" &&
    actualRun.instagramMediaId ===
      "17942576889054573" &&
    actualRun.expectedYoutubeChannelId ===
      "UCR23z78qDtyhHIaV29rSB9A",
);
check(
  "real YouTube outcome is confirmed not started",
  actualRun.youtubeOutcome ===
    "confirmed_not_started" &&
    actualRun.preflight.plan.originalAttempt
      .youtubeInsertCount === 0 &&
    actualRun.preflight.plan.youtube.videoId === null,
);
check(
  "real ledger binds one Instagram record and no YouTube record",
  actualRun.preflight.plan.ledger
    .instagramRecordConfirmed === true &&
    actualRun.preflight.plan.ledger
      .instagramPublishedId === "17942576889054573" &&
    actualRun.preflight.plan.ledger
      .youtubeRecordAbsent === true,
);
check(
  "all real preflight side effects are zero",
  Object.values(actualRun.sideEffectCounters).every(
    (value) => value === 0,
  ),
);
check(
  "real plan and preflight fingerprints are deterministic",
  actualRun.planFingerprint ===
      "e97cabd3eae6448cfe9c237eb2040aa6840cb554c411d2f2896f429b966414a5" &&
    actualRun.preflightFingerprint ===
      "03c6478633c6133753b7781bf1db7c3689ac71256fdb96ad01b38b4835d3d618",
);

const facts = {
  currentBinding: structuredClone(
    actualRun.preflight.plan.currentBinding,
  ),
  originalAttempt: structuredClone(
    actualRun.preflight.plan.originalAttempt,
  ),
  instagramRecovery: structuredClone(
    actualRun.preflight.plan.instagramRecovery,
  ),
  youtube: structuredClone(
    actualRun.preflight.plan.youtube,
  ),
  ledger: structuredClone(
    actualRun.preflight.plan.ledger,
  ),
};
const planResult =
  buildMoneyShortsPart2YoutubeRecoveryPreflightPlan({
    facts,
  });
const builtPreflight =
  buildMoneyShortsPart2YoutubeRecoveryPreflight({
    plan: planResult.plan,
  });
check(
  "pure facts build the exact current plan",
  planResult.ok === true &&
    planResult.plan.planFingerprint ===
      actualRun.planFingerprint,
);
check(
  "pure plan builds the exact current preflight",
  builtPreflight?.preflightFingerprint ===
    actualRun.preflightFingerprint,
);
check(
  "exact preflight validates",
  validateMoneyShortsPart2YoutubeRecoveryPreflight({
    evidence: builtPreflight,
    currentPlan: planResult.plan,
    expectedPreflightFingerprint:
      builtPreflight.preflightFingerprint,
  }).valid === true,
);

const tamperedPreflight = structuredClone(builtPreflight);
tamperedPreflight.safeToUpload = true;
check(
  "tampered preflight fails validation",
  validateMoneyShortsPart2YoutubeRecoveryPreflight({
    evidence: tamperedPreflight,
    currentPlan: planResult.plan,
    expectedPreflightFingerprint:
      builtPreflight.preflightFingerprint,
  }).valid === false,
);

for (const [name, mutate] of [
  [
    "fake facts reject prior YouTube insert",
    (value) => {
      value.originalAttempt.youtubeInsertCount = 1;
    },
  ],
  [
    "fake facts reject failed Instagram recovery",
    (value) => {
      value.instagramRecovery.status = "FAILED";
    },
  ],
  [
    "fake facts reject a YouTube ledger record",
    (value) => {
      value.ledger.youtubeRecordAbsent = false;
    },
  ],
  [
    "fake facts reject non-public metadata",
    (value) => {
      value.youtube.metadata.privacyStatus = "unlisted";
    },
  ],
  [
    "fake facts reject a Part 1 binding",
    (value) => {
      value.currentBinding.productionPartId = "part-1";
    },
  ],
]) {
  const candidate = structuredClone(facts);
  mutate(candidate);
  check(
    name,
    buildMoneyShortsPart2YoutubeRecoveryPreflightPlan({
      facts: candidate,
    }).ok === false,
  );
}

let injectedReads = 0;
const injectedRun =
  await runMoneyShortsPart2YoutubeRecoveryPreflightTestOnly(
    {
      argv: ACTUAL_ARGS,
      inspector: async () => {
        injectedReads += 1;
        return {
          ok: true,
          facts: structuredClone(facts),
        };
      },
    },
  );
check(
  "fake inspector runs a stable two-pass review",
  injectedRun.ok === true && injectedReads === 2,
);

let driftingReads = 0;
const driftingRun =
  await runMoneyShortsPart2YoutubeRecoveryPreflightTestOnly(
    {
      argv: ACTUAL_ARGS,
      inspector: async () => {
        driftingReads += 1;
        const candidate = structuredClone(facts);
        if (driftingReads === 2) {
          candidate.ledger.sha256 = HASH;
        }
        return { ok: true, facts: candidate };
      },
    },
  );
check(
  "two-pass review rejects mid-run source drift",
  driftingRun.reason ===
      "PART2_YOUTUBE_RECOVERY_PREFLIGHT_SOURCE_DRIFT_DETECTED" &&
    driftingReads === 2,
);

const wrongLedgerRun =
  await runMoneyShortsPart2YoutubeRecoveryPreflight({
    argv: replaceFlagValue(
      ACTUAL_ARGS,
      "--expected-ledger-sha256",
      HASH,
    ),
  });
check(
  "current ledger hash drift fails closed",
  wrongLedgerRun.reason ===
    "PART2_YOUTUBE_RECOVERY_PREFLIGHT_LEDGER_INVALID",
);
const wrongOriginalResultRun =
  await runMoneyShortsPart2YoutubeRecoveryPreflight({
    argv: replaceFlagValue(
      ACTUAL_ARGS,
      "--expected-original-safe-result-file-sha256",
      HASH,
    ),
  });
check(
  "original safe result drift fails closed",
  wrongOriginalResultRun.reason ===
    "PART2_YOUTUBE_RECOVERY_PREFLIGHT_ORIGINAL_YOUTUBE_STATE_INVALID",
  wrongOriginalResultRun.reason,
);
const wrongRecoveryResultRun =
  await runMoneyShortsPart2YoutubeRecoveryPreflight({
    argv: replaceFlagValue(
      ACTUAL_ARGS,
      "--expected-instagram-recovery-result-file-sha256",
      HASH,
    ),
  });
check(
  "Instagram recovery result drift fails closed",
  wrongRecoveryResultRun.reason ===
    "PART2_YOUTUBE_RECOVERY_PREFLIGHT_INSTAGRAM_RESULT_INVALID",
  wrongRecoveryResultRun.reason,
);

const repeatedRun =
  await runMoneyShortsPart2YoutubeRecoveryPreflight({
    argv: ACTUAL_ARGS,
  });
check(
  "identical real review is deterministic",
  repeatedRun.ok === true &&
    repeatedRun.preflightFingerprint ===
      actualRun.preflightFingerprint &&
    JSON.stringify(repeatedRun.preflight) ===
      JSON.stringify(actualRun.preflight),
);

const after = {
  ledger: fileSha256(LEDGER_PATH),
  contentUnit: fileSha256(CONTENT_UNIT_PATH),
  safeResultTree: treeSnapshot(SAFE_RESULT_DIR),
  instagramRecoveryTree: treeSnapshot(
    INSTAGRAM_RECOVERY_OUT_DIR,
  ),
};
check(
  "all inspected real evidence remains byte-identical",
  JSON.stringify(after) === JSON.stringify(before),
);

const runnerSource = readFileSync(RUNNER_PATH, "utf8");
const forbiddenSourcePatterns = [
  /process\.env/,
  /\bfetch\s*\(/,
  /googleapis/,
  /videos\.insert/,
  /channels\.list/,
  /writeFileSync/,
  /appendFileSync/,
  /renameSync/,
  /unlinkSync/,
  /rmSync/,
  /child_process/,
  /https?\.request/,
  /new Date\s*\(/,
  /Date\.now\s*\(/,
  /randomUUID/,
];
check(
  "runner source has no env, network, mutation, clock, or random authority",
  forbiddenSourcePatterns.every(
    (pattern) => !pattern.test(runnerSource),
  ),
);
check(
  "runner exposes no armed production branch",
  !runnerSource.includes("--expected-preflight-fingerprint") &&
    !runnerSource.includes("videos.insert"),
);

console.log(
  JSON.stringify(
    {
      passed,
      failed,
      realCredentialReads: 0,
      externalCalls: 0,
      youtubeUploads: 0,
      productionLedgerWrites: 0,
      productionEvidenceWrites: 0,
      actualPlanFingerprint:
        actualRun.planFingerprint ?? null,
      actualPreflightFingerprint:
        actualRun.preflightFingerprint ?? null,
    },
    null,
    2,
  ),
);

if (failed > 0) {
  process.exitCode = 1;
}
