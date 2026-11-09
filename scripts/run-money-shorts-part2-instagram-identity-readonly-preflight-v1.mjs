#!/usr/bin/env node
/**
 * Part 2 Instagram account identity read-only preflight.
 *
 * - Dry-run is the default: local artifact validation only, env/network/write 0.
 * - Armed mode reads exactly two injected Instagram env keys and performs one
 *   fixed Graph API GET. It never uploads, publishes, writes evidence/ledger,
 *   or invokes Blob/YouTube/DB.
 * - The expected account id is supplied by the Owner as a public command
 *   argument. The access token and raw provider response/error are never
 *   returned or printed.
 */

import { createHash } from "node:crypto";
import {
  existsSync,
  readFileSync,
  realpathSync,
  statSync,
} from "node:fs";
import {
  isAbsolute,
  resolve,
} from "node:path";
import { fileURLToPath } from "node:url";

export const MONEY_SHORTS_PART2_INSTAGRAM_IDENTITY_APPROVAL =
  "APPROVE_MONEY_SHORTS_PART2_INSTAGRAM_IDENTITY_READONLY_PREFLIGHT_V1";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const GRAPH_API_BASE =
  "https://graph.facebook.com/v25.0";
const GRAPH_FIELDS = Object.freeze([
  "id",
  "username",
]);
// Meta v25 documents IG User itself as a Business or Creator account;
// Account subtype is not part of the documented IG User field contract.
const PROFESSIONAL_ACCOUNT_BASIS = "META_IG_USER_OBJECT";
const REQUIRED_ENV_KEYS = Object.freeze([
  "INSTAGRAM_BUSINESS_ACCOUNT_ID",
  "INSTAGRAM_ACCESS_TOKEN",
]);
const VALUE_FLAGS = Object.freeze([
  "--approval",
  "--content-unit",
  "--expected-content-id",
  "--expected-manifest-sha256",
  "--expected-source-sha256",
  "--expected-instagram-account-id",
  "--expected-plan-fingerprint",
]);
const SHA256_RE = /^[a-f0-9]{64}$/;
const ACCOUNT_ID_RE = /^[0-9]{5,32}$/;
const CONTENT_ID_RE = /^[A-Za-z0-9._:-]{1,240}-part-2$/;
const USERNAME_RE = /^[A-Za-z0-9._]{1,64}$/;

function isPlainObject(value) {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function canonicalize(value) {
  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }
  if (!isPlainObject(value)) return value;
  return Object.keys(value)
    .sort()
    .reduce((result, key) => {
      result[key] = canonicalize(value[key]);
      return result;
    }, {});
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function fingerprint(value) {
  return sha256(JSON.stringify(canonicalize(value)));
}

function zeroCounters() {
  return {
    credentialReadCount: 0,
    externalApiGetCount: 0,
    automaticRetryCount: 0,
    externalMutationCount: 0,
    filesystemWriteCount: 0,
    blobMutationCount: 0,
    instagramMutationCount: 0,
    youtubeMutationCount: 0,
    dbMutationCount: 0,
    ledgerWriteCount: 0,
  };
}

export function parseMoneyShortsPart2InstagramIdentityArgs(
  argv,
) {
  const values = Object.create(null);
  let armed = false;
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--arm") {
      if (armed) {
        return {
          ok: false,
          reason:
            "PART2_INSTAGRAM_IDENTITY_DUPLICATE_ARM_FLAG",
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
          "PART2_INSTAGRAM_IDENTITY_UNKNOWN_OR_DUPLICATE_ARGUMENT",
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
          "PART2_INSTAGRAM_IDENTITY_ARGUMENT_VALUE_INVALID",
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
    expectedContentId:
      values["--expected-content-id"] ?? null,
    expectedManifestSha256:
      values["--expected-manifest-sha256"] ?? null,
    expectedSourceSha256:
      values["--expected-source-sha256"] ?? null,
    expectedInstagramAccountId:
      values["--expected-instagram-account-id"] ?? null,
    expectedPlanFingerprint:
      values["--expected-plan-fingerprint"] ?? null,
  };
}

export function validateMoneyShortsPart2InstagramIdentityAuthorization(
  parsed,
) {
  if (
    !isPlainObject(parsed) ||
    parsed.approval !==
      MONEY_SHORTS_PART2_INSTAGRAM_IDENTITY_APPROVAL
  ) {
    return {
      ok: false,
      reason:
        "PART2_INSTAGRAM_IDENTITY_APPROVAL_REQUIRED",
    };
  }
  if (
    typeof parsed.contentUnitPath !== "string" ||
    !isAbsolute(parsed.contentUnitPath) ||
    !CONTENT_ID_RE.test(parsed.expectedContentId ?? "") ||
    !SHA256_RE.test(
      parsed.expectedManifestSha256 ?? "",
    ) ||
    !SHA256_RE.test(parsed.expectedSourceSha256 ?? "") ||
    !ACCOUNT_ID_RE.test(
      parsed.expectedInstagramAccountId ?? "",
    )
  ) {
    return {
      ok: false,
      reason:
        "PART2_INSTAGRAM_IDENTITY_REQUIRED_BINDING_INVALID",
    };
  }
  if (
    parsed.expectedPlanFingerprint !== null &&
    !SHA256_RE.test(parsed.expectedPlanFingerprint)
  ) {
    return {
      ok: false,
      reason:
        "PART2_INSTAGRAM_IDENTITY_PLAN_FINGERPRINT_INVALID",
    };
  }
  if (
    parsed.armed === true &&
    !SHA256_RE.test(parsed.expectedPlanFingerprint ?? "")
  ) {
    return {
      ok: false,
      reason:
        "PART2_INSTAGRAM_IDENTITY_ARMED_PLAN_FINGERPRINT_REQUIRED",
    };
  }
  return { ok: true };
}

function inspectBoundPart2Content(parsed) {
  try {
    const resolvedManifestPath = realpathSync(
      resolve(parsed.contentUnitPath),
    );
    if (
      !existsSync(resolvedManifestPath) ||
      !statSync(resolvedManifestPath).isFile()
    ) {
      return {
        ok: false,
        reason:
          "PART2_INSTAGRAM_IDENTITY_CONTENT_UNIT_MISSING",
      };
    }
    const manifestBytes = readFileSync(resolvedManifestPath);
    if (
      sha256(manifestBytes) !==
      parsed.expectedManifestSha256
    ) {
      return {
        ok: false,
        reason:
          "PART2_INSTAGRAM_IDENTITY_MANIFEST_SHA_MISMATCH",
      };
    }
    const unit = JSON.parse(manifestBytes.toString("utf8"));
    if (
      !isPlainObject(unit) ||
      unit.schemaVersion !==
        "dual_platform_content_unit_v1" ||
      unit.contentId !== parsed.expectedContentId ||
      unit.wizardProductionPartId !== "part-2" ||
      unit.sourceIntegrity?.productionPartId !== "part-2" ||
      unit.series?.partNumber !== 2 ||
      unit.series?.totalParts !== 2 ||
      typeof unit.instagramSourcePath !== "string" ||
      !isAbsolute(unit.instagramSourcePath)
    ) {
      return {
        ok: false,
        reason:
          "PART2_INSTAGRAM_IDENTITY_CONTENT_UNIT_NOT_EXACT_PART2",
      };
    }
    const sourcePath = realpathSync(
      resolve(unit.instagramSourcePath),
    );
    if (
      !existsSync(sourcePath) ||
      !statSync(sourcePath).isFile()
    ) {
      return {
        ok: false,
        reason:
          "PART2_INSTAGRAM_IDENTITY_SOURCE_MISSING",
      };
    }
    const sourceBytes = readFileSync(sourcePath);
    const sourceSha256 = sha256(sourceBytes);
    if (
      sourceSha256 !== parsed.expectedSourceSha256 ||
      unit.sourceIntegrity?.finalMp4Sha256 !==
        parsed.expectedSourceSha256
    ) {
      return {
        ok: false,
        reason:
          "PART2_INSTAGRAM_IDENTITY_SOURCE_SHA_MISMATCH",
      };
    }
    return {
      ok: true,
      contentId: unit.contentId,
      version: unit.version,
      contentUnitPath: resolvedManifestPath,
      contentUnitSha256: parsed.expectedManifestSha256,
      sourcePath,
      sourceSha256,
    };
  } catch {
    return {
      ok: false,
      reason:
        "PART2_INSTAGRAM_IDENTITY_LOCAL_BINDING_READ_FAILED",
    };
  }
}

export function buildMoneyShortsPart2InstagramIdentityPlan({
  content,
  expectedInstagramAccountId,
}) {
  if (
    content?.ok !== true ||
    !ACCOUNT_ID_RE.test(expectedInstagramAccountId ?? "")
  ) {
    return null;
  }
  const planCore = {
    schemaVersion:
      "money_shorts_part2_instagram_identity_readonly_plan_v1",
    contentId: content.contentId,
    version: content.version,
    productionPartId: "part-2",
    contentUnitPath: content.contentUnitPath,
    contentUnitSha256: content.contentUnitSha256,
    sourcePath: content.sourcePath,
    sourceSha256: content.sourceSha256,
    expectedInstagramAccountId,
    requestContract: {
      baseUrl: GRAPH_API_BASE,
      method: "GET",
      fields: [...GRAPH_FIELDS],
      redirect: "error",
      cache: "no-store",
      maximumAttempts: 1,
    },
    credentialContract: {
      requiredKeyNames: [...REQUIRED_ENV_KEYS],
      valuesPrinted: false,
      accessTokenReturned: false,
      rawProviderBodyReturned: false,
      rawProviderErrorReturned: false,
    },
    sideEffectPolicy: {
      externalReadOnlyGetAllowedWhenArmed: true,
      uploadAllowed: false,
      publishAllowed: false,
      blobMutationAllowed: false,
      instagramMutationAllowed: false,
      youtubeActionAllowed: false,
      dbMutationAllowed: false,
      ledgerWriteAllowed: false,
      filesystemWriteAllowed: false,
      automaticRetryAllowed: false,
    },
  };
  return {
    ...planCore,
    planFingerprint: fingerprint(planCore),
  };
}

export function buildMoneyShortsPart2InstagramIdentityBinding({
  plan,
  username,
}) {
  if (
    !isPlainObject(plan) ||
    !SHA256_RE.test(plan.planFingerprint ?? "") ||
    !USERNAME_RE.test(username ?? "")
  ) {
    return null;
  }
  const bindingCore = {
    schemaVersion:
      "money_shorts_part2_instagram_identity_binding_v1",
    planFingerprint: plan.planFingerprint,
    contentId: plan.contentId,
    contentUnitSha256: plan.contentUnitSha256,
    sourceSha256: plan.sourceSha256,
    expectedInstagramAccountId:
      plan.expectedInstagramAccountId,
    username,
    professionalAccountBasis: PROFESSIONAL_ACCOUNT_BASIS,
    accountIdMatchesExpected: true,
    requestMethod: "GET",
    graphFields: [...GRAPH_FIELDS],
  };
  return {
    ...bindingCore,
    identityBindingFingerprint: fingerprint(bindingCore),
  };
}

export function buildMoneyShortsInstagramIdentityFetchAdapter({
  accountId,
  accessToken,
  fetchImpl = fetch,
}) {
  if (
    !ACCOUNT_ID_RE.test(accountId ?? "") ||
    typeof accessToken !== "string" ||
    accessToken.length === 0 ||
    typeof fetchImpl !== "function"
  ) {
    throw new Error(
      "part2_instagram_identity_adapter_input_invalid",
    );
  }
  return {
    async verifyIdentity() {
      const url = new URL(
        `${GRAPH_API_BASE}/${encodeURIComponent(accountId)}`,
      );
      url.searchParams.set("fields", GRAPH_FIELDS.join(","));
      const response = await fetchImpl(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        redirect: "error",
        cache: "no-store",
        signal: AbortSignal.timeout(30_000),
      });
      let data = null;
      try {
        data = await response.json();
      } catch {}
      return {
        ok: response.ok === true,
        accountId:
          typeof data?.id === "string" ? data.id : null,
        username:
          typeof data?.username === "string"
            ? data.username
            : null,
      };
    },
  };
}

export async function runMoneyShortsPart2InstagramIdentityPreflight({
  argv,
  envProvider = () => process.env,
  adapterFactory = ({
    accountId,
    accessToken,
  }) =>
    buildMoneyShortsInstagramIdentityFetchAdapter({
      accountId,
      accessToken,
    }),
}) {
  const counters = zeroCounters();
  const parsed =
    parseMoneyShortsPart2InstagramIdentityArgs(argv);
  if (!parsed.ok) {
    return {
      ...parsed,
      sideEffectCounters: counters,
    };
  }

  // Authorization deliberately precedes filesystem, env, and network.
  const authorization =
    validateMoneyShortsPart2InstagramIdentityAuthorization(
      parsed,
    );
  if (!authorization.ok) {
    return {
      ...authorization,
      sideEffectCounters: counters,
    };
  }

  const content = inspectBoundPart2Content(parsed);
  if (!content.ok) {
    return {
      ...content,
      sideEffectCounters: counters,
    };
  }
  const plan =
    buildMoneyShortsPart2InstagramIdentityPlan({
      content,
      expectedInstagramAccountId:
        parsed.expectedInstagramAccountId,
    });
  if (!plan) {
    return {
      ok: false,
      reason:
        "PART2_INSTAGRAM_IDENTITY_PLAN_BUILD_FAILED",
      sideEffectCounters: counters,
    };
  }

  if (parsed.armed !== true) {
    return {
      ok: true,
      status: "PREFLIGHT_ONLY_OK",
      armed: false,
      noLiveActions: true,
      externalReadOnlyCheckPerformed: false,
      externalMutationPerformed: false,
      publishPerformed: false,
      contentId: plan.contentId,
      expectedInstagramAccountId:
        plan.expectedInstagramAccountId,
      planFingerprint: plan.planFingerprint,
      requestContract: plan.requestContract,
      sideEffectCounters: counters,
    };
  }

  if (
    parsed.expectedPlanFingerprint !==
    plan.planFingerprint
  ) {
    return {
      ok: false,
      status: "BLOCKED",
      blockerCode:
        "PART2_INSTAGRAM_IDENTITY_PLAN_FINGERPRINT_MISMATCH",
      sideEffectCounters: counters,
    };
  }

  const runtimeEnv = envProvider();
  counters.credentialReadCount = REQUIRED_ENV_KEYS.length;
  const injectedAccountId =
    runtimeEnv?.INSTAGRAM_BUSINESS_ACCOUNT_ID;
  const accessToken = runtimeEnv?.INSTAGRAM_ACCESS_TOKEN;
  const credentialPresence = {
    INSTAGRAM_BUSINESS_ACCOUNT_ID:
      typeof injectedAccountId === "string" &&
      injectedAccountId.length > 0,
    INSTAGRAM_ACCESS_TOKEN:
      typeof accessToken === "string" &&
      accessToken.length > 0,
  };
  if (
    !credentialPresence.INSTAGRAM_BUSINESS_ACCOUNT_ID ||
    !credentialPresence.INSTAGRAM_ACCESS_TOKEN ||
    injectedAccountId !== plan.expectedInstagramAccountId
  ) {
    return {
      ok: false,
      status: "BLOCKED",
      blockerCode:
        "PART2_INSTAGRAM_IDENTITY_CREDENTIAL_OR_ACCOUNT_ID_MISMATCH",
      credentialPresence,
      accountIdMatchesExpected: false,
      sideEffectCounters: counters,
    };
  }

  let identity;
  try {
    const adapter = adapterFactory({
      accountId: injectedAccountId,
      accessToken,
    });
    counters.externalApiGetCount += 1;
    identity = await adapter.verifyIdentity();
  } catch {
    return {
      ok: false,
      status: "READONLY_IDENTITY_CHECK_FAILED",
      blockerCode:
        "PART2_INSTAGRAM_IDENTITY_PROVIDER_READ_FAILED",
      sideEffectCounters: counters,
    };
  }
  if (
    identity?.ok !== true ||
    identity.accountId !==
      plan.expectedInstagramAccountId ||
    !USERNAME_RE.test(identity.username ?? "")
  ) {
    return {
      ok: false,
      status: "READONLY_IDENTITY_CHECK_FAILED",
      blockerCode:
        "PART2_INSTAGRAM_IDENTITY_RESPONSE_MISMATCH",
      accountIdMatchesExpected:
        identity?.accountId ===
        plan.expectedInstagramAccountId,
      sideEffectCounters: counters,
    };
  }

  const identityBinding =
    buildMoneyShortsPart2InstagramIdentityBinding({
      plan,
      username: identity.username,
    });
  if (!identityBinding) {
    return {
      ok: false,
      status: "READONLY_IDENTITY_CHECK_FAILED",
      blockerCode:
        "PART2_INSTAGRAM_IDENTITY_BINDING_BUILD_FAILED",
      sideEffectCounters: counters,
    };
  }
  return {
    ok: true,
    status: "INSTAGRAM_IDENTITY_READONLY_PREFLIGHT_OK",
    armed: true,
    externalReadOnlyCheckPerformed: true,
    externalMutationPerformed: false,
    publishPerformed: false,
    contentId: plan.contentId,
    expectedInstagramAccountId:
      plan.expectedInstagramAccountId,
    accountIdMatchesExpected: true,
    username: identity.username,
    professionalAccountBasis:
      PROFESSIONAL_ACCOUNT_BASIS,
    planFingerprint: plan.planFingerprint,
    identityBindingFingerprint:
      identityBinding.identityBindingFingerprint,
    requestContract: plan.requestContract,
    credentialPresence,
    secretValuesPrinted: false,
    rawProviderResponseReturned: false,
    sideEffectCounters: counters,
  };
}

async function main() {
  const result =
    await runMoneyShortsPart2InstagramIdentityPreflight({
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
