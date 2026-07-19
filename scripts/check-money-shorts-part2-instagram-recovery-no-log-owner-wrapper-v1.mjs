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
  "run-money-shorts-part2-instagram-recovery-execution-v1.mjs",
);
const PACKAGE_PATH = join(REPO_ROOT, "package.json");
const HASH = "a".repeat(64);
const FAKE_ACCOUNT_ID = "17841414370000001";
const EXPECTED_ACCOUNT_ID = "17841414372742257";
const EXPECTED_CHANNEL_ID =
  "UCR23z78qDtyhHIaV29rSB9A";
const CONTENT_ID =
  "wizard-gen-finance-editorial-v2-wrapper-check-part-2";
const FAKE_TOKEN =
  "wrapper_recovery_fake_instagram_token_zzz";
const FORBIDDEN_FAKE_SECRET =
  "wrapper_recovery_forbidden_secret_zzz";

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
  const values = [
    ["--env-path", envPath],
    ["--recovery-out-dir", join(root, "recovery-evidence")],
    [
      "--expected-review-preflight-fingerprint",
      HASH,
    ],
    ["--content-unit", join(root, "missing-content.json")],
    ["--ledger", join(root, "missing-ledger.json")],
    ["--out-dir", join(root, "missing-original-out")],
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
    [
      "--expected-youtube-channel-id",
      EXPECTED_CHANNEL_ID,
    ],
    [
      "--expected-original-safe-preflight-fingerprint",
      HASH,
    ],
    [
      "--expected-original-safe-claim-fingerprint",
      HASH,
    ],
    [
      "--expected-original-safe-result-fingerprint",
      HASH,
    ],
    [
      "--expected-original-canonical-result-fingerprint",
      HASH,
    ],
    ["--expected-original-plan-fingerprint", HASH],
    [
      "--expected-original-safe-preflight-file-sha256",
      HASH,
    ],
    [
      "--expected-original-safe-claim-file-sha256",
      HASH,
    ],
    [
      "--expected-original-safe-result-file-sha256",
      HASH,
    ],
    [
      "--expected-original-safe-latest-event-sha256",
      HASH,
    ],
    [
      "--expected-original-canonical-attempt-claim-file-sha256",
      HASH,
    ],
    [
      "--expected-original-canonical-latest-event-sha256",
      HASH,
    ],
    [
      "--expected-original-canonical-result-file-sha256",
      HASH,
    ],
    ["--expected-original-ledger-sha256", HASH],
    ["--expected-original-blob-url-sha256", HASH],
    [
      "--expected-original-recovery-fingerprint",
      HASH,
    ],
  ];
  if (includeExecutionFingerprint) {
    values.push([
      "--expected-execution-preflight-fingerprint",
      HASH,
    ]);
  }
  const args = [
    "part2-instagram-recovery-execution",
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

const wrapperSource = readFileSync(
  WRAPPER_PATH,
  "utf8",
);
const instagramEnvListMatch = wrapperSource.match(
  /const INSTAGRAM_ONLY_ENV_KEY_NAMES = Object\.freeze\(\[([\s\S]*?)\]\);/,
);
const instagramEnvKeys = Array.from(
  instagramEnvListMatch?.[1].matchAll(/"([^"]+)"/g) ??
    [],
  (match) => match[1],
);
const commandBlockStart = wrapperSource.indexOf(
  '"part2-instagram-recovery-execution": {',
);
const commandBlockEnd = wrapperSource.indexOf(
  "\n  },\n});",
  commandBlockStart,
);
const commandBlock =
  commandBlockStart >= 0 && commandBlockEnd >= 0
    ? wrapperSource.slice(
        commandBlockStart,
        commandBlockEnd,
      )
    : "";
const packageJson = JSON.parse(
  readFileSync(PACKAGE_PATH, "utf8"),
);
check(
  existsSync(RUNNER_PATH) &&
    wrapperSource.includes(
      "run-money-shorts-part2-instagram-recovery-execution-v1.mjs",
    ),
  "wrapper binds the exact recovery runner",
);
check(
  wrapperSource.includes(
    '"APPROVE_PART2_INSTAGRAM_RECOVERY_EXECUTION_V1"',
  ) &&
    wrapperSource.includes(
      '"INSPECT_PART2_INSTAGRAM_RECOVERY_EVIDENCE_V1"',
    ),
  "wrapper fixes approval and inspection literals",
);
check(
  commandBlock.includes(
    "PART2_INSTAGRAM_RECOVERY_EXECUTION_RUNNER_PATH",
  ) &&
    commandBlock.includes(
      "validatePart2InstagramRecoveryBeforeEnvAccess",
    ) &&
    commandBlock.includes(
      "envKeyNames: INSTAGRAM_ONLY_ENV_KEY_NAMES",
    ) &&
    commandBlock.includes("loadEnvInDryRun: false"),
  "wrapper command uses pre-env validation and no-env dry mode",
);
check(
  JSON.stringify(instagramEnvKeys) ===
    JSON.stringify([
      "INSTAGRAM_BUSINESS_ACCOUNT_ID",
      "INSTAGRAM_ACCESS_TOKEN",
    ]),
  "recovery env allowlist contains only the two Instagram keys",
);
check(
  packageJson.scripts[
    "owner:part2-instagram-recovery-execution"
  ] ===
    "node scripts/run-owner-command-with-local-env-no-log.mjs part2-instagram-recovery-execution",
  "package owner command targets the no-log wrapper",
);
check(
  packageJson.scripts[
    "check:part2-instagram-recovery-no-log-owner-wrapper-v1"
  ] ===
    "node scripts/check-money-shorts-part2-instagram-recovery-no-log-owner-wrapper-v1.mjs",
  "package exposes the targeted wrapper checker",
);

let tempRoot = null;
try {
  tempRoot = mkdtempSync(
    join(tmpdir(), "ig-recovery-wrapper-check-"),
  );
  const fakeEnvPath = join(tempRoot, "fake.env");
  writeFileSync(
    fakeEnvPath,
    [
      `INSTAGRAM_BUSINESS_ACCOUNT_ID=${FAKE_ACCOUNT_ID}`,
      `INSTAGRAM_ACCESS_TOKEN=${FAKE_TOKEN}`,
      `YOUTUBE_CLIENT_ID=${FORBIDDEN_FAKE_SECRET}`,
      `YOUTUBE_CLIENT_SECRET=${FORBIDDEN_FAKE_SECRET}`,
      `YOUTUBE_REFRESH_TOKEN=${FORBIDDEN_FAKE_SECRET}`,
      `BLOB_READ_WRITE_TOKEN=${FORBIDDEN_FAKE_SECRET}`,
      "",
    ].join("\n"),
    "utf8",
  );

  const dryArgs = recoveryArgs({
    root: tempRoot,
    envPath: fakeEnvPath,
  });
  const dryRun = runWrapper(dryArgs);
  check(
    dryRun.exitCode !== 0 &&
      dryRun.output.includes(
        "dry-run: credential env file was not accessed",
      ) &&
      dryRun.output.includes(
        "approved keys present: 0/2",
      ),
    "dry wrapper skips the env file and reaches the child fail-closed path",
  );
  check(
    dryRun.output.includes(
      "PART2_INSTAGRAM_RECOVERY_EXECUTION_INPUT_PATH_UNRESOLVABLE",
    ) &&
      !dryRun.output.includes(FAKE_TOKEN) &&
      !dryRun.output.includes(FORBIDDEN_FAKE_SECRET),
    "dry child forwarding exposes no fake credential value",
  );

  const armedArgs = recoveryArgs({
    root: tempRoot,
    envPath: fakeEnvPath,
    armed: true,
  });
  const armedNoInputRun = runWrapper(armedArgs);
  check(
    armedNoInputRun.exitCode !== 0 &&
      armedNoInputRun.output.includes(
        "approved keys present: 2/2",
      ) &&
      armedNoInputRun.output.includes(
        "INSTAGRAM_BUSINESS_ACCOUNT_ID: true",
      ) &&
      armedNoInputRun.output.includes(
        "INSTAGRAM_ACCESS_TOKEN: true",
      ),
    "syntax-valid armed wrapper loads only the two Instagram keys",
  );
  check(
    armedNoInputRun.output.includes(
      "PART2_INSTAGRAM_RECOVERY_EXECUTION_INPUT_PATH_UNRESOLVABLE",
    ) &&
      !armedNoInputRun.output.includes(
        "YOUTUBE_CLIENT_ID",
      ) &&
      !armedNoInputRun.output.includes(
        "BLOB_READ_WRITE_TOKEN",
      ) &&
      !armedNoInputRun.output.includes(FAKE_TOKEN) &&
      !armedNoInputRun.output.includes(
        FORBIDDEN_FAKE_SECRET,
      ),
    "armed wrapper stops before network and excludes non-Instagram credentials",
  );
  check(
    !existsSync(join(tempRoot, "recovery-evidence")),
    "missing-input probes create no recovery evidence",
  );

  const invalidCases = [
    {
      name:
        "armed request without execution fingerprint",
      args: recoveryArgs({
        root: tempRoot,
        envPath: fakeEnvPath,
        armed: true,
        includeExecutionFingerprint: false,
      }),
    },
    {
      name: "missing required original ledger hash",
      args: (() => {
        const args = [...dryArgs];
        const index = args.indexOf(
          "--expected-original-ledger-sha256",
        );
        args.splice(index, 2);
        return args;
      })(),
    },
    {
      name:
        "dry request with execution fingerprint",
      args: recoveryArgs({
        root: tempRoot,
        envPath: fakeEnvPath,
        includeExecutionFingerprint: true,
      }),
    },
    {
      name: "user inspection override",
      args: [
        ...dryArgs,
        "--inspection",
        "INSPECT_PART2_INSTAGRAM_RECOVERY_EVIDENCE_V1",
      ],
    },
    {
      name: "user approval override",
      args: [
        ...dryArgs,
        "--approval",
        "APPROVE_PART2_INSTAGRAM_RECOVERY_EXECUTION_V1",
      ],
    },
    {
      name: "forbidden retry flag",
      args: [...dryArgs, "--retry"],
    },
    {
      name: "duplicate arm flag",
      args: [...armedArgs, "--arm"],
    },
    {
      name: "relative recovery path",
      args: replaceFlagValue(
        dryArgs,
        "--recovery-out-dir",
        "relative-recovery",
      ),
    },
    {
      name: "invalid review fingerprint",
      args: replaceFlagValue(
        dryArgs,
        "--expected-review-preflight-fingerprint",
        "not-a-sha256",
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
      name: "invalid YouTube binding id",
      args: replaceFlagValue(
        dryArgs,
        "--expected-youtube-channel-id",
        "not-a-channel",
      ),
    },
    {
      name: "recovery path overlaps original out dir",
      args: replaceFlagValue(
        dryArgs,
        "--recovery-out-dir",
        join(
          tempRoot,
          "missing-original-out",
          "nested-recovery",
        ),
      ),
    },
  ];
  for (const testCase of invalidCases) {
    const result = runWrapper(testCase.args);
    check(
      result.exitCode === 2 &&
        result.output.includes("ABORT:") &&
        !result.output.includes("[owner-env-no-log]") &&
        !result.output.includes(FAKE_TOKEN) &&
        !result.output.includes(FORBIDDEN_FAKE_SECRET),
      `${testCase.name} blocks before env access`,
    );
  }
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
