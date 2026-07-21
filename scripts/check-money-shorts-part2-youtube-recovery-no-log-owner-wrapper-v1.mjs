#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import {
  dirname,
  join,
  resolve,
} from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, "..");
const WRAPPER_PATH = join(
  SCRIPT_DIR,
  "run-owner-command-with-local-env-no-log.mjs",
);
const RUNNER_PATH = join(
  SCRIPT_DIR,
  "run-money-shorts-part2-youtube-recovery-execution-v1.mjs",
);
const PACKAGE_PATH = join(REPO_ROOT, "package.json");
const HASH = "a".repeat(64);
const CONTENT_ID =
  "wizard-gen-finance-editorial-v2-wrapper-check-part-2";
const EXPECTED_ACCOUNT_ID = "17841414372742257";
const EXPECTED_MEDIA_ID = "17900000000000001";
const EXPECTED_CHANNEL_ID =
  "UCR23z78qDtyhHIaV29rSB9A";
const FAKE_CLIENT_ID =
  "wrapper_youtube_recovery_fake_client_id_zzz";
const FAKE_CLIENT_SECRET =
  "wrapper_youtube_recovery_fake_client_secret_zzz";
const FAKE_REFRESH_TOKEN =
  "wrapper_youtube_recovery_fake_refresh_token_zzz";
const FORBIDDEN_FAKE_SECRET =
  "wrapper_youtube_recovery_forbidden_secret_zzz";
const REQUIRED_PATH_FLAGS = Object.freeze([
  "--recovery-out-dir",
  "--content-unit",
  "--ledger",
  "--original-out-dir",
  "--instagram-recovery-out-dir",
]);
const REQUIRED_HASH_FLAGS = Object.freeze([
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
  "--expected-review-preflight-fingerprint",
]);
const REQUIRED_ID_FLAGS = Object.freeze([
  "--expected-content-id",
  "--expected-instagram-account-id",
  "--expected-instagram-media-id",
  "--expected-youtube-channel-id",
]);

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

function sanitizedParentEnv() {
  const allowed = [
    "SystemRoot",
    "windir",
    "SystemDrive",
    "PATH",
    "Path",
    "PATHEXT",
    "COMSPEC",
    "TEMP",
    "TMP",
    "NUMBER_OF_PROCESSORS",
    "PROCESSOR_ARCHITECTURE",
  ];
  const env = Object.create(null);
  for (const name of allowed) {
    if (typeof process.env[name] === "string") {
      env[name] = process.env[name];
    }
  }
  return env;
}

function runWrapper(args) {
  try {
    const stdout = execFileSync(
      process.execPath,
      [WRAPPER_PATH, ...args],
      {
        cwd: REPO_ROOT,
        encoding: "utf8",
        timeout: 30_000,
        env: sanitizedParentEnv(),
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    return {
      exitCode: 0,
      output: stdout,
    };
  } catch (error) {
    return {
      exitCode:
        typeof error?.status === "number"
          ? error.status
          : null,
      output:
        String(error?.stdout ?? "") +
        String(error?.stderr ?? ""),
    };
  }
}

function recoveryArgs({
  root,
  envPath,
  armed = false,
  includeExecutionFingerprint = armed,
}) {
  const sourceRoot = join(root, "missing-source-evidence");
  const values = [
    ["--env-path", envPath],
    [
      "--recovery-out-dir",
      join(root, "youtube-recovery-evidence"),
    ],
    ["--content-unit", join(sourceRoot, "content.json")],
    ["--ledger", join(sourceRoot, "ledger.json")],
    ["--original-out-dir", join(sourceRoot, "original")],
    [
      "--instagram-recovery-out-dir",
      join(sourceRoot, "instagram-recovery"),
    ],
    ["--expected-content-id", CONTENT_ID],
    ["--expected-manifest-sha256", HASH],
    ["--expected-source-sha256", HASH],
    [
      "--expected-publication-attempt-fingerprint",
      HASH,
    ],
    [
      "--expected-instagram-account-id",
      EXPECTED_ACCOUNT_ID,
    ],
    ["--expected-instagram-media-id", EXPECTED_MEDIA_ID],
    [
      "--expected-youtube-channel-id",
      EXPECTED_CHANNEL_ID,
    ],
    [
      "--expected-original-safe-result-file-sha256",
      HASH,
    ],
    ["--expected-original-safe-result-fingerprint", HASH],
    [
      "--expected-instagram-recovery-preflight-fingerprint",
      HASH,
    ],
    [
      "--expected-instagram-recovery-claim-fingerprint",
      HASH,
    ],
    [
      "--expected-instagram-recovery-result-file-sha256",
      HASH,
    ],
    [
      "--expected-instagram-recovery-result-fingerprint",
      HASH,
    ],
    ["--expected-ledger-sha256", HASH],
    ["--expected-review-preflight-fingerprint", HASH],
  ];
  if (includeExecutionFingerprint) {
    values.push([
      "--expected-execution-preflight-fingerprint",
      HASH,
    ]);
  }
  const args = [
    "part2-youtube-recovery-execution",
    ...values.flat(),
  ];
  if (armed) args.push("--arm");
  return args;
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

function blockedBeforeEnv(result) {
  return (
    result.exitCode === 2 &&
    result.output.includes("ABORT:") &&
    !result.output.includes("[owner-env-no-log]") &&
    !result.output.includes(FAKE_CLIENT_ID) &&
    !result.output.includes(FAKE_CLIENT_SECRET) &&
    !result.output.includes(FAKE_REFRESH_TOKEN) &&
    !result.output.includes(FORBIDDEN_FAKE_SECRET)
  );
}

const wrapperSource = readFileSync(WRAPPER_PATH, "utf8");
const youtubeEnvListMatch = wrapperSource.match(
  /const YOUTUBE_ONLY_ENV_KEY_NAMES = Object\.freeze\(\[([\s\S]*?)\]\);/,
);
const youtubeEnvKeys = Array.from(
  youtubeEnvListMatch?.[1].matchAll(/"([^"]+)"/g) ?? [],
  (match) => match[1],
);
const commandBlockStart = wrapperSource.indexOf(
  '"part2-youtube-recovery-execution": {',
);
const commandBlockEnd = wrapperSource.indexOf(
  "\n  },\n});",
  commandBlockStart,
);
const commandBlock =
  commandBlockStart >= 0 && commandBlockEnd >= 0
    ? wrapperSource.slice(commandBlockStart, commandBlockEnd)
    : "";
const packageJson = JSON.parse(
  readFileSync(PACKAGE_PATH, "utf8"),
);

check(
  existsSync(RUNNER_PATH) &&
    wrapperSource.includes(
      "run-money-shorts-part2-youtube-recovery-execution-v1.mjs",
    ),
  "wrapper binds the exact Part 2 YouTube recovery runner",
);
check(
  commandBlock.includes(
    '"APPROVE_PART2_YOUTUBE_RECOVERY_EXECUTION_V1"',
  ) &&
    commandBlock.includes(
      '"INSPECT_PART2_YOUTUBE_RECOVERY_EVIDENCE_V1"',
    ),
  "wrapper fixes approval and inspection literals",
);
check(
  commandBlock.includes(
    "PART2_YOUTUBE_RECOVERY_EXECUTION_RUNNER_PATH",
  ) &&
    commandBlock.includes(
      "validatePart2YoutubeRecoveryBeforeEnvAccess",
    ) &&
    commandBlock.includes(
      "envKeyNames: YOUTUBE_ONLY_ENV_KEY_NAMES",
    ) &&
    commandBlock.includes("loadEnvInDryRun: false"),
  "wrapper command uses pre-env validation and no-env dry mode",
);
check(
  JSON.stringify(youtubeEnvKeys) ===
    JSON.stringify([
      "YOUTUBE_CLIENT_ID",
      "YOUTUBE_CLIENT_SECRET",
      "YOUTUBE_REFRESH_TOKEN",
    ]),
  "recovery env allowlist contains only the three YouTube keys",
);
check(
  !commandBlock.includes("INSTAGRAM_ACCESS_TOKEN") &&
    !commandBlock.includes("BLOB_READ_WRITE_TOKEN"),
  "command block excludes Instagram and Blob credentials",
);
check(
  packageJson.scripts[
    "owner:part2-youtube-recovery-execution"
  ] ===
    "node scripts/run-owner-command-with-local-env-no-log.mjs part2-youtube-recovery-execution",
  "package owner command targets the no-log wrapper",
);
check(
  packageJson.scripts[
    "check:part2-youtube-recovery-no-log-owner-wrapper-v1"
  ] ===
    "node scripts/check-money-shorts-part2-youtube-recovery-no-log-owner-wrapper-v1.mjs",
  "package exposes the targeted wrapper checker",
);

let tempRoot = null;
try {
  tempRoot = mkdtempSync(
    join(tmpdir(), "youtube-recovery-wrapper-check-"),
  );
  const fakeEnvPath = join(tempRoot, "fake.env");
  writeFileSync(
    fakeEnvPath,
    [
      `YOUTUBE_CLIENT_ID=${FAKE_CLIENT_ID}`,
      `YOUTUBE_CLIENT_SECRET=${FAKE_CLIENT_SECRET}`,
      `YOUTUBE_REFRESH_TOKEN=${FAKE_REFRESH_TOKEN}`,
      `INSTAGRAM_BUSINESS_ACCOUNT_ID=${FORBIDDEN_FAKE_SECRET}`,
      `INSTAGRAM_ACCESS_TOKEN=${FORBIDDEN_FAKE_SECRET}`,
      `BLOB_READ_WRITE_TOKEN=${FORBIDDEN_FAKE_SECRET}`,
      "",
    ].join("\n"),
    "utf8",
  );

  const dryArgs = recoveryArgs({
    root: tempRoot,
    envPath: fakeEnvPath,
  });
  const armedArgs = recoveryArgs({
    root: tempRoot,
    envPath: fakeEnvPath,
    armed: true,
  });
  const recoveryOutDir = dryArgs[
    dryArgs.indexOf("--recovery-out-dir") + 1
  ];

  const dryRun = runWrapper(dryArgs);
  check(
    dryRun.exitCode !== 0 &&
      dryRun.output.includes(
        "dry-run: credential env file was not accessed",
      ) &&
      dryRun.output.includes("approved keys present: 0/3") &&
      dryRun.output.includes(
        "PART2_YOUTUBE_RECOVERY_EXECUTION_INPUT_PATH_UNRESOLVABLE",
      ),
    "dry wrapper skips env access and child fails closed on missing input",
  );
  check(
    !dryRun.output.includes(FAKE_CLIENT_ID) &&
      !dryRun.output.includes(FAKE_CLIENT_SECRET) &&
      !dryRun.output.includes(FAKE_REFRESH_TOKEN) &&
      !dryRun.output.includes(FORBIDDEN_FAKE_SECRET),
    "dry wrapper and child expose no fake credential value",
  );

  const armedRun = runWrapper(armedArgs);
  check(
    armedRun.exitCode !== 0 &&
      armedRun.output.includes("approved keys present: 3/3") &&
      armedRun.output.includes("YOUTUBE_CLIENT_ID: true") &&
      armedRun.output.includes("YOUTUBE_CLIENT_SECRET: true") &&
      armedRun.output.includes("YOUTUBE_REFRESH_TOKEN: true") &&
      armedRun.output.includes(
        "PART2_YOUTUBE_RECOVERY_EXECUTION_INPUT_PATH_UNRESOLVABLE",
      ),
    "syntax-valid armed wrapper loads only three fake YouTube keys then fails closed",
  );
  check(
    !armedRun.output.includes("INSTAGRAM_ACCESS_TOKEN") &&
      !armedRun.output.includes("BLOB_READ_WRITE_TOKEN") &&
      !armedRun.output.includes(FAKE_CLIENT_ID) &&
      !armedRun.output.includes(FAKE_CLIENT_SECRET) &&
      !armedRun.output.includes(FAKE_REFRESH_TOKEN) &&
      !armedRun.output.includes(FORBIDDEN_FAKE_SECRET),
    "armed wrapper excludes non-YouTube keys and prints no fake values",
  );
  check(
    !existsSync(recoveryOutDir),
    "missing-input probes create no recovery evidence",
  );

  const invalidCases = [
    {
      name: "armed request without execution fingerprint",
      args: recoveryArgs({
        root: tempRoot,
        envPath: fakeEnvPath,
        armed: true,
        includeExecutionFingerprint: false,
      }),
    },
    {
      name: "dry request with execution fingerprint",
      args: recoveryArgs({
        root: tempRoot,
        envPath: fakeEnvPath,
        includeExecutionFingerprint: true,
      }),
    },
    {
      name: "user approval override",
      args: [
        ...dryArgs,
        "--approval",
        "APPROVE_PART2_YOUTUBE_RECOVERY_EXECUTION_V1",
      ],
    },
    {
      name: "user inspection override",
      args: [
        ...dryArgs,
        "--inspection",
        "INSPECT_PART2_YOUTUBE_RECOVERY_EVIDENCE_V1",
      ],
    },
    {
      name: "forbidden retry flag",
      args: [...dryArgs, "--retry"],
    },
    {
      name: "forbidden execute flag",
      args: [...dryArgs, "--execute"],
    },
    {
      name: "duplicate arm flag",
      args: [...armedArgs, "--arm"],
    },
    {
      name: "unknown flag",
      args: [...dryArgs, "--unknown", "value"],
    },
    {
      name: "duplicate value flag",
      args: [
        ...dryArgs,
        "--expected-content-id",
        CONTENT_ID,
      ],
    },
    {
      name: "relative env path",
      args: replaceFlagValue(
        dryArgs,
        "--env-path",
        "relative.env",
      ),
    },
    {
      name: "invalid Part 2 content id",
      args: replaceFlagValue(
        dryArgs,
        "--expected-content-id",
        "not-part-two",
      ),
    },
    {
      name: "invalid Instagram account id",
      args: replaceFlagValue(
        dryArgs,
        "--expected-instagram-account-id",
        "000000",
      ),
    },
    {
      name: "invalid Instagram media id",
      args: replaceFlagValue(
        dryArgs,
        "--expected-instagram-media-id",
        "000000",
      ),
    },
    {
      name: "invalid YouTube channel id",
      args: replaceFlagValue(
        dryArgs,
        "--expected-youtube-channel-id",
        "not-a-channel",
      ),
    },
    {
      name: "recovery directory inside repository",
      args: replaceFlagValue(
        dryArgs,
        "--recovery-out-dir",
        join(REPO_ROOT, "output", "forbidden-recovery"),
      ),
    },
    {
      name: "recovery directory nested in original evidence",
      args: replaceFlagValue(
        dryArgs,
        "--recovery-out-dir",
        join(
          dryArgs[dryArgs.indexOf("--original-out-dir") + 1],
          "nested-recovery",
        ),
      ),
    },
    {
      name: "original evidence nested in recovery directory",
      args: replaceFlagValue(
        dryArgs,
        "--original-out-dir",
        join(recoveryOutDir, "nested-original"),
      ),
    },
    {
      name: "recovery directory contains content unit",
      args: replaceFlagValue(
        dryArgs,
        "--content-unit",
        join(recoveryOutDir, "content.json"),
      ),
    },
    {
      name: "recovery directory contains ledger",
      args: replaceFlagValue(
        dryArgs,
        "--ledger",
        join(recoveryOutDir, "ledger.json"),
      ),
    },
    {
      name:
        "recovery directory nested in Instagram recovery evidence",
      args: replaceFlagValue(
        dryArgs,
        "--recovery-out-dir",
        join(
          dryArgs[
            dryArgs.indexOf(
              "--instagram-recovery-out-dir",
            ) + 1
          ],
          "nested-recovery",
        ),
      ),
    },
    {
      name:
        "Instagram recovery evidence nested in recovery directory",
      args: replaceFlagValue(
        dryArgs,
        "--instagram-recovery-out-dir",
        join(recoveryOutDir, "nested-instagram-recovery"),
      ),
    },
  ];

  for (const flag of REQUIRED_PATH_FLAGS) {
    invalidCases.push({
      name: `missing required path ${flag}`,
      args: removeFlag(dryArgs, flag),
    });
    invalidCases.push({
      name: `relative required path ${flag}`,
      args: replaceFlagValue(dryArgs, flag, "relative-path"),
    });
  }
  for (const flag of REQUIRED_HASH_FLAGS) {
    invalidCases.push({
      name: `missing required hash ${flag}`,
      args: removeFlag(dryArgs, flag),
    });
    invalidCases.push({
      name: `invalid required hash ${flag}`,
      args: replaceFlagValue(dryArgs, flag, "not-a-sha256"),
    });
  }
  for (const flag of REQUIRED_ID_FLAGS) {
    invalidCases.push({
      name: `missing required binding ${flag}`,
      args: removeFlag(dryArgs, flag),
    });
  }

  for (const testCase of invalidCases) {
    const result = runWrapper(testCase.args);
    check(
      blockedBeforeEnv(result),
      `${testCase.name} blocks before env access`,
    );
  }
  check(
    !existsSync(recoveryOutDir),
    "pre-env rejection matrix creates no recovery evidence",
  );
} finally {
  if (
    typeof tempRoot === "string" &&
    tempRoot.startsWith(tmpdir())
  ) {
    rmSync(tempRoot, {
      recursive: true,
      force: true,
    });
  }
}

console.log(
  JSON.stringify(
    {
      passed,
      failed,
      realCredentialReads: 0,
      externalCalls: 0,
      productionLedgerWrites: 0,
    },
    null,
    2,
  ),
);

if (failed > 0) {
  process.exitCode = 1;
}
