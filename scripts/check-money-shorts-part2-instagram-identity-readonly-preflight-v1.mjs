import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import {
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  MONEY_SHORTS_PART2_INSTAGRAM_IDENTITY_APPROVAL,
  buildMoneyShortsInstagramIdentityFetchAdapter,
  runMoneyShortsPart2InstagramIdentityPreflight,
  validateMoneyShortsPart2InstagramIdentityAuthorization,
} from "./run-money-shorts-part2-instagram-identity-readonly-preflight-v1.mjs";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = dirname(SCRIPT_DIR);
const WRAPPER_PATH = join(
  SCRIPT_DIR,
  "run-owner-command-with-local-env-no-log.mjs",
);
const EXPECTED_ACCOUNT_ID = "17841400000000001";
const DUMMY_TOKEN =
  "identity_preflight_secret_token_never_print";

let passed = 0;
let failed = 0;

function check(label, condition, detail = "") {
  if (condition) {
    passed += 1;
    console.log(`PASS ${label}`);
  } else {
    failed += 1;
    console.error(
      `FAIL ${label}${detail ? ` — ${detail}` : ""}`,
    );
  }
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function createFixture(label) {
  const root = mkdtempSync(
    join(tmpdir(), `part2-instagram-identity-${label}-`),
  );
  const sourcePath = join(root, "part-2.mp4");
  const sourceBytes = Buffer.from(
    `part2-instagram-identity-source-${label}`,
    "utf8",
  );
  writeFileSync(sourcePath, sourceBytes);
  const sourceSha256 = sha256(sourceBytes);
  const contentId =
    `wizard-finance-identity-${label}-part-2`;
  const unit = {
    schemaVersion: "dual_platform_content_unit_v1",
    contentId,
    version: "v5",
    wizardProductionPartId: "part-2",
    series: {
      partNumber: 2,
      totalParts: 2,
    },
    instagramSourcePath: sourcePath,
    sourceIntegrity: {
      productionPartId: "part-2",
      finalMp4Sha256: sourceSha256,
    },
  };
  const manifestPath = join(root, "content-unit.json");
  writeFileSync(
    manifestPath,
    `${JSON.stringify(unit, null, 2)}\n`,
    "utf8",
  );
  const manifestSha256 = sha256(
    readFileSync(manifestPath),
  );
  const baseArgs = [
    "--approval",
    MONEY_SHORTS_PART2_INSTAGRAM_IDENTITY_APPROVAL,
    "--content-unit",
    manifestPath,
    "--expected-content-id",
    contentId,
    "--expected-manifest-sha256",
    manifestSha256,
    "--expected-source-sha256",
    sourceSha256,
    "--expected-instagram-account-id",
    EXPECTED_ACCOUNT_ID,
  ];
  return {
    root,
    sourcePath,
    manifestPath,
    manifestSha256,
    sourceSha256,
    contentId,
    baseArgs,
  };
}

function fakeEnv(
  accountId = EXPECTED_ACCOUNT_ID,
  accessToken = DUMMY_TOKEN,
) {
  return {
    INSTAGRAM_BUSINESS_ACCOUNT_ID: accountId,
    INSTAGRAM_ACCESS_TOKEN: accessToken,
  };
}

function successfulAdapter(
  calls,
  overrides = {},
) {
  return {
    async verifyIdentity() {
      calls.push("verifyIdentity");
      if (overrides.throwProviderError) {
        throw new Error(
          "provider_raw_error_secret_must_not_escape",
        );
      }
      return {
        ok: overrides.ok ?? true,
        accountId:
          overrides.accountId ?? EXPECTED_ACCOUNT_ID,
        username:
          overrides.username ?? "finance.owner",
        accountType:
          overrides.accountType ?? "BUSINESS",
      };
    },
  };
}

const invalidAuthorization =
  validateMoneyShortsPart2InstagramIdentityAuthorization({
    armed: true,
    approval: "WRONG",
  });
check(
  "pure authorization rejects a wrong approval",
  invalidAuthorization.ok === false,
);

let invalidEnvReads = 0;
let invalidAdapterLoads = 0;
const invalidRun =
  await runMoneyShortsPart2InstagramIdentityPreflight({
    argv: ["--approval", "WRONG", "--arm"],
    envProvider: () => {
      invalidEnvReads += 1;
      return fakeEnv();
    },
    adapterFactory: () => {
      invalidAdapterLoads += 1;
      return successfulAdapter([]);
    },
  });
check(
  "invalid authorization stops before filesystem/env/network",
  invalidRun.ok === false &&
    invalidEnvReads === 0 &&
    invalidAdapterLoads === 0 &&
    Object.values(invalidRun.sideEffectCounters).every(
      (value) => value === 0,
    ),
);

const roots = [];
try {
  const fixture = createFixture("success");
  roots.push(fixture.root);
  let dryEnvReads = 0;
  let dryAdapterLoads = 0;
  const dryRun =
    await runMoneyShortsPart2InstagramIdentityPreflight({
      argv: fixture.baseArgs,
      envProvider: () => {
        dryEnvReads += 1;
        return fakeEnv();
      },
      adapterFactory: () => {
        dryAdapterLoads += 1;
        return successfulAdapter([]);
      },
    });
  check(
    "dry-run binds the exact Part 2 artifacts",
    dryRun.ok === true &&
      dryRun.status === "PREFLIGHT_ONLY_OK" &&
      dryRun.contentId === fixture.contentId &&
      /^[a-f0-9]{64}$/.test(dryRun.planFingerprint),
    JSON.stringify(dryRun),
  );
  check(
    "dry-run has zero env/network/filesystem mutation",
    dryEnvReads === 0 &&
      dryAdapterLoads === 0 &&
      Object.values(dryRun.sideEffectCounters).every(
        (value) => value === 0,
      ),
  );
  check(
    "plan fixes one GET, fields, redirect, cache and retry count",
    dryRun.requestContract.method === "GET" &&
      dryRun.requestContract.fields.join(",") ===
        "id,username,account_type" &&
      dryRun.requestContract.redirect === "error" &&
      dryRun.requestContract.cache === "no-store" &&
      dryRun.requestContract.maximumAttempts === 1,
  );

  let missingFingerprintEnvReads = 0;
  const missingFingerprint =
    await runMoneyShortsPart2InstagramIdentityPreflight({
      argv: [...fixture.baseArgs, "--arm"],
      envProvider: () => {
        missingFingerprintEnvReads += 1;
        return fakeEnv();
      },
    });
  check(
    "armed run requires the exact plan fingerprint before env",
    missingFingerprint.ok === false &&
      missingFingerprintEnvReads === 0,
  );

  let mismatchedEnvAdapterLoads = 0;
  const mismatchedEnv =
    await runMoneyShortsPart2InstagramIdentityPreflight({
      argv: [
        ...fixture.baseArgs,
        "--expected-plan-fingerprint",
        dryRun.planFingerprint,
        "--arm",
      ],
      envProvider: () =>
        fakeEnv("17841499999999999"),
      adapterFactory: () => {
        mismatchedEnvAdapterLoads += 1;
        return successfulAdapter([]);
      },
    });
  check(
    "injected account id mismatch stops before Graph GET",
    mismatchedEnv.ok === false &&
      mismatchedEnvAdapterLoads === 0 &&
      mismatchedEnv.sideEffectCounters.externalApiGetCount ===
        0,
  );

  const mismatchCalls = [];
  const providerMismatch =
    await runMoneyShortsPart2InstagramIdentityPreflight({
      argv: [
        ...fixture.baseArgs,
        "--expected-plan-fingerprint",
        dryRun.planFingerprint,
        "--arm",
      ],
      envProvider: () => fakeEnv(),
      adapterFactory: () =>
        successfulAdapter(mismatchCalls, {
          accountId: "17841411111111111",
        }),
    });
  check(
    "provider account mismatch is fail-closed after one GET",
    providerMismatch.ok === false &&
      mismatchCalls.length === 1 &&
      providerMismatch.sideEffectCounters
        .externalApiGetCount === 1 &&
      providerMismatch.sideEffectCounters
        .externalMutationCount === 0,
  );

  const invalidProfessionalCalls = [];
  const invalidProfessional =
    await runMoneyShortsPart2InstagramIdentityPreflight({
      argv: [
        ...fixture.baseArgs,
        "--expected-plan-fingerprint",
        dryRun.planFingerprint,
        "--arm",
      ],
      envProvider: () => fakeEnv(),
      adapterFactory: () =>
        successfulAdapter(invalidProfessionalCalls, {
          username: "",
          accountType: "PERSONAL",
        }),
    });
  check(
    "missing username or non-professional type fails closed",
    invalidProfessional.ok === false &&
      invalidProfessionalCalls.length === 1,
  );

  const successCalls = [];
  const success =
    await runMoneyShortsPart2InstagramIdentityPreflight({
      argv: [
        ...fixture.baseArgs,
        "--expected-plan-fingerprint",
        dryRun.planFingerprint,
        "--arm",
      ],
      envProvider: () => fakeEnv(),
      adapterFactory: () =>
        successfulAdapter(successCalls),
    });
  check(
    "armed fake-adapter identity preflight succeeds",
    success.ok === true &&
      success.status ===
        "INSTAGRAM_IDENTITY_READONLY_PREFLIGHT_OK" &&
      success.accountIdMatchesExpected === true &&
      success.username === "finance.owner" &&
      success.accountType === "BUSINESS" &&
      success.externalReadOnlyCheckPerformed === true &&
      success.externalMutationPerformed === false &&
      success.publishPerformed === false &&
      /^[a-f0-9]{64}$/.test(
        success.identityBindingFingerprint,
      ),
    JSON.stringify(success),
  );
  check(
    "successful preflight performs one GET and zero mutations/writes",
    successCalls.length === 1 &&
      success.sideEffectCounters.externalApiGetCount === 1 &&
      success.sideEffectCounters.credentialReadCount === 2 &&
      success.sideEffectCounters.automaticRetryCount === 0 &&
      success.sideEffectCounters.externalMutationCount === 0 &&
      success.sideEffectCounters.filesystemWriteCount === 0 &&
      success.sideEffectCounters.blobMutationCount === 0 &&
      success.sideEffectCounters.instagramMutationCount === 0 &&
      success.sideEffectCounters.youtubeMutationCount === 0 &&
      success.sideEffectCounters.dbMutationCount === 0 &&
      success.sideEffectCounters.ledgerWriteCount === 0,
  );
  const successText = JSON.stringify(success);
  check(
    "access token and raw provider details never enter result JSON",
    !successText.includes(DUMMY_TOKEN) &&
      !successText.includes("Authorization") &&
      !successText.includes("provider_raw_error"),
  );

  const throwCalls = [];
  const providerThrow =
    await runMoneyShortsPart2InstagramIdentityPreflight({
      argv: [
        ...fixture.baseArgs,
        "--expected-plan-fingerprint",
        dryRun.planFingerprint,
        "--arm",
      ],
      envProvider: () => fakeEnv(),
      adapterFactory: () =>
        successfulAdapter(throwCalls, {
          throwProviderError: true,
        }),
    });
  check(
    "provider error is sanitized and never retried",
    providerThrow.ok === false &&
      throwCalls.length === 1 &&
      providerThrow.sideEffectCounters
        .externalApiGetCount === 1 &&
      providerThrow.sideEffectCounters
        .automaticRetryCount === 0 &&
      !JSON.stringify(providerThrow).includes(
        "provider_raw_error_secret_must_not_escape",
      ),
  );

  let fetchCallCount = 0;
  let capturedUrl = null;
  let capturedOptions = null;
  const fetchAdapter =
    buildMoneyShortsInstagramIdentityFetchAdapter({
      accountId: EXPECTED_ACCOUNT_ID,
      accessToken: DUMMY_TOKEN,
      fetchImpl: async (url, options) => {
        fetchCallCount += 1;
        capturedUrl = url;
        capturedOptions = options;
        return {
          ok: true,
          async json() {
            return {
              id: EXPECTED_ACCOUNT_ID,
              username: "finance.owner",
              account_type: "BUSINESS",
            };
          },
        };
      },
    });
  const fetchIdentity = await fetchAdapter.verifyIdentity();
  const parsedUrl = new URL(String(capturedUrl));
  check(
    "default adapter uses exactly one fixed Graph GET",
    fetchCallCount === 1 &&
      capturedOptions.method === "GET" &&
      capturedOptions.body === undefined &&
      capturedOptions.redirect === "error" &&
      capturedOptions.cache === "no-store" &&
      parsedUrl.origin === "https://graph.facebook.com" &&
      parsedUrl.pathname ===
        `/v19.0/${EXPECTED_ACCOUNT_ID}` &&
      parsedUrl.searchParams.get("fields") ===
        "id,username,account_type" &&
      fetchIdentity.accountId === EXPECTED_ACCOUNT_ID,
  );
  check(
    "default adapter keeps the token in the Authorization header only",
    capturedOptions.headers.Authorization ===
      `Bearer ${DUMMY_TOKEN}` &&
      !String(capturedUrl).includes(DUMMY_TOKEN),
  );

  const driftFixture = createFixture("drift");
  roots.push(driftFixture.root);
  const driftDry =
    await runMoneyShortsPart2InstagramIdentityPreflight({
      argv: driftFixture.baseArgs,
    });
  writeFileSync(
    driftFixture.sourcePath,
    "changed-after-dry-run",
    "utf8",
  );
  let driftEnvReads = 0;
  const drift =
    await runMoneyShortsPart2InstagramIdentityPreflight({
      argv: [
        ...driftFixture.baseArgs,
        "--expected-plan-fingerprint",
        driftDry.planFingerprint,
        "--arm",
      ],
      envProvider: () => {
        driftEnvReads += 1;
        return fakeEnv();
      },
    });
  check(
    "source drift blocks before env and network",
    drift.ok === false && driftEnvReads === 0,
  );

  const wrapperArgs = [
    WRAPPER_PATH,
    "part2-instagram-identity-preflight",
    "--env-path",
    join(fixture.root, "must-not-read.env"),
    "--content-unit",
    fixture.manifestPath,
    "--expected-content-id",
    fixture.contentId,
    "--expected-manifest-sha256",
    fixture.manifestSha256,
    "--expected-source-sha256",
    fixture.sourceSha256,
    "--expected-instagram-account-id",
    EXPECTED_ACCOUNT_ID,
  ];
  const wrapperDry = spawnSync(
    process.execPath,
    wrapperArgs,
    {
      cwd: REPO_ROOT,
      encoding: "utf8",
      timeout: 30_000,
    },
  );
  const wrapperDryOutput =
    `${wrapperDry.stdout ?? ""}${wrapperDry.stderr ?? ""}`;
  check(
    "no-log wrapper dry-run injects zero credentials",
    wrapperDry.status === 0 &&
      wrapperDryOutput.includes(
        "dry-run: credential env file was not accessed",
      ) &&
      wrapperDryOutput.includes(
        "approved keys present: 0/2",
      ) &&
      wrapperDryOutput.includes(
        '"status": "PREFLIGHT_ONLY_OK"',
      ),
    wrapperDryOutput,
  );

  const wrapperInvalidArmed = spawnSync(
    process.execPath,
    [...wrapperArgs, "--arm"],
    {
      cwd: REPO_ROOT,
      encoding: "utf8",
      timeout: 30_000,
    },
  );
  const wrapperInvalidOutput =
    `${wrapperInvalidArmed.stdout ?? ""}` +
    `${wrapperInvalidArmed.stderr ?? ""}`;
  check(
    "wrapper validates armed fingerprint before env diagnostics",
    wrapperInvalidArmed.status !== 0 &&
      wrapperInvalidOutput.includes(
        "part2_instagram_identity_required_binding_invalid",
      ) &&
      !wrapperInvalidOutput.includes(
        "[owner-env-no-log] env file:",
      ),
  );

  const runnerSource = readFileSync(
    join(
      SCRIPT_DIR,
      "run-money-shorts-part2-instagram-identity-readonly-preflight-v1.mjs",
    ),
    "utf8",
  );
  check(
    "identity runner has no upload, publish, ledger or filesystem writer authority",
    !runnerSource.includes("@vercel/blob") &&
      !runnerSource.includes("googleapis") &&
      !runnerSource.includes("videos.insert") &&
      !runnerSource.includes("media_publish") &&
      !runnerSource.includes("writeFileSync") &&
      !runnerSource.includes("appendFileSync") &&
      !runnerSource.includes("writePublishLedger"),
  );
} finally {
  for (const root of roots) {
    rmSync(root, { recursive: true, force: true });
  }
}

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exitCode = 1;
