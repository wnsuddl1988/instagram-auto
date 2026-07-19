/**
 * Owner-run local env no-log command wrapper.
 *
 * task: owner-local-env-no-log-command-wrapper-v1
 * Owner approval: APPROVE_OWNER_LOCAL_ENV_NO_LOG_COMMAND_WRAPPER
 *
 * Purpose
 * -------
 * The redacted credential-preflight command (`--credential-preflight`) only reports
 * `present:true` for keys that exist in *this* process env. When Codex/Claude run it,
 * the required keys are `present:false` because that shell does not inherit the
 * Owner's local secret env. This wrapper lets the OWNER — running locally — read only
 * command-specific approved keys from a local `.env` file (default `.env.local`) and inject them
 * into a child command's process env, WITHOUT ever printing, logging, hashing, storing,
 * or otherwise exposing any credential value.
 *
 * Strict no-log / no-secret-exposure contract
 * --------------------------------------------
 * - Reads ONLY the selected command's allowlisted key names. Any other line is ignored
 *   (its value is never parsed into a retained variable).
 * - Credential values live ONLY inside the child process `env` object handed to spawnSync.
 *   They are never console.log'd, written to disk, returned, hashed, measured (length),
 *   prefixed/suffixed/masked/sampled, or type-inferred.
 * - Output is limited to: key NAMES, present/missing booleans, the child command's own
 *   (already-redacted) stdout, and non-secret diagnostics.
 * - The parent env is NOT spread into the child (no `{ ...process.env }`). Only a small
 *   whitelist of non-secret OS variables needed to launch node on Windows is inherited
 *   individually, plus the command-specific approved credential keys.
 * - The child runs with `shell:false` and `process.execPath` (no shell string, no glob).
 *
 * What this file does NOT do
 * --------------------------
 * - No dotenv package (dependency-free hand parser).
 * - No `vercel env pull`.
 * - No Instagram/YouTube/Blob/OpenAI/ElevenLabs/Pexels/Supabase API, upload, HEAD, OAuth.
 * - No ffmpeg/ffprobe, no media/TTS/image/browser render, no deploy/DNS.
 * - No commit/push.
 *
 * Usage (Owner, local)
 * --------------------
 *   node scripts/run-owner-command-with-local-env-no-log.mjs credential-preflight
 *   node scripts/run-owner-command-with-local-env-no-log.mjs credential-preflight --env-path .env.local
 *   node scripts/run-owner-command-with-local-env-no-log.mjs credential-preflight --content-unit <manifest.json>
 *
 * The guard/tests pass an explicit fake `--env-path` with dummy values; they never point
 * this wrapper at the real `.env.local`.
 *
 * Note: the flag is `--env-path` (not `--env-file`) so it is never confused with node's
 * own reserved `--env-file` runtime option.
 */

import { spawnSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import {
  dirname,
  isAbsolute,
  join,
  resolve,
} from "node:path";
import { fileURLToPath } from "node:url";

const SELF = fileURLToPath(import.meta.url);
const SCRIPTS_DIR = dirname(SELF);
const REPO_ROOT = resolve(SCRIPTS_DIR, "..");
const ENTRYPOINT_PATH = join(SCRIPTS_DIR, "run-owner-daily-automation-entrypoint.mjs");
const FINAL_E2E_RUNNER_PATH = join(SCRIPTS_DIR, "run-final-e2e-dual-platform-publish-once.mjs");
const YOUTUBE_ONLY_RECOVERY_RUNNER_PATH = join(
  SCRIPTS_DIR,
  "run-money-shorts-youtube-only-part1-recovery-v1.mjs",
);
const PART2_DUAL_PUBLISH_SAFE_RUNNER_PATH = join(
  SCRIPTS_DIR,
  "run-money-shorts-part2-only-dual-publish-safe-v1.mjs",
);
const PART2_INSTAGRAM_IDENTITY_RUNNER_PATH = join(
  SCRIPTS_DIR,
  "run-money-shorts-part2-instagram-identity-readonly-preflight-v1.mjs",
);

// 승인된 6개 key 이름만 로드한다(그 외 라인의 값은 파싱/보관하지 않는다).
const APPROVED_ENV_KEY_NAMES = Object.freeze([
  "INSTAGRAM_BUSINESS_ACCOUNT_ID",
  "INSTAGRAM_ACCESS_TOKEN",
  "YOUTUBE_CLIENT_ID",
  "YOUTUBE_CLIENT_SECRET",
  "YOUTUBE_REFRESH_TOKEN",
  "BLOB_READ_WRITE_TOKEN",
]);
const YOUTUBE_ONLY_ENV_KEY_NAMES = Object.freeze([
  "YOUTUBE_CLIENT_ID",
  "YOUTUBE_CLIENT_SECRET",
  "YOUTUBE_REFRESH_TOKEN",
]);
const INSTAGRAM_IDENTITY_ENV_KEY_NAMES = Object.freeze([
  "INSTAGRAM_BUSINESS_ACCOUNT_ID",
  "INSTAGRAM_ACCESS_TOKEN",
]);
const YOUTUBE_ONLY_REQUIRED_PATH_FLAGS = Object.freeze([
  "--source-publish-dir",
  "--recovery-out-dir",
  "--content-unit",
  "--owner-resolution",
  "--ledger",
]);
const YOUTUBE_ONLY_REQUIRED_EVIDENCE_FLAGS =
  Object.freeze([
    "--expected-recovery-fingerprint",
    "--expected-resolution-sha256",
    "--expected-channel-id",
  ]);
const PART2_DUAL_SAFE_REQUIRED_PATH_FLAGS = Object.freeze([
  "--content-unit",
  "--ledger",
  "--out-dir",
]);
const PART2_DUAL_SAFE_REQUIRED_EVIDENCE_FLAGS =
  Object.freeze([
    "--expected-content-id",
    "--expected-manifest-sha256",
    "--expected-source-sha256",
    "--expected-publication-attempt-fingerprint",
    "--expected-instagram-account-id",
    "--expected-youtube-channel-id",
  ]);
const PART2_INSTAGRAM_IDENTITY_REQUIRED_FLAGS =
  Object.freeze([
    "--content-unit",
    "--expected-content-id",
    "--expected-manifest-sha256",
    "--expected-source-sha256",
    "--expected-instagram-account-id",
  ]);
const SHA256_RE = /^[a-f0-9]{64}$/;
const YOUTUBE_CHANNEL_ID_RE =
  /^UC[A-Za-z0-9_-]{22}$/;
const INSTAGRAM_ACCOUNT_ID_RE = /^[0-9]{5,32}$/;

// child node 실행에 필요한 최소 non-secret OS 변수만 개별 상속한다(broad spread 금지).
const SAFE_CHILD_OS_ENV_KEYS = Object.freeze([
  "SystemRoot", "windir", "SystemDrive", "PATH", "Path", "PATHEXT", "COMSPEC",
  "TEMP", "TMP", "NUMBER_OF_PROCESSORS", "PROCESSOR_ARCHITECTURE",
]);

// 지원 명령: 논리 이름 → { script, baseArgs }. 값(secret)은 여기 없다 — child 스크립트 경로와
// 상수 인자만. approval token은 secret이 아니라 Owner 승인 문구다.
const SUPPORTED_COMMANDS = Object.freeze({
  "credential-preflight": {
    script: ENTRYPOINT_PATH,
    baseArgs: ["--credential-preflight"],
    passthrough: ["--content-unit"],
    passthroughFlags: [],
    envKeyNames: APPROVED_ENV_KEY_NAMES,
  },
  // task: final-e2e-ready-content-unit-and-publish-one-v1
  // 실제 E2E 게시 러너(별도 스크립트)를 승인 토큰과 함께 child로 실행한다. 이 wrapper 자체는
  // 여전히 어떤 API/upload/Blob 호출도 하지 않는다 — 승인 키를 child env로 주입만 한다.
  "final-e2e-publish": {
    script: FINAL_E2E_RUNNER_PATH,
    baseArgs: ["--approval", "APPROVE_FINAL_E2E_AUTOMATION_PUBLISH_ONE_NEW_CONTENT_UNIT"],
    passthrough: ["--content-unit", "--ledger", "--out-dir"],
    passthroughFlags: ["--arm"],
    envKeyNames: APPROVED_ENV_KEY_NAMES,
  },
  "youtube-only-part1-recovery": {
    script: YOUTUBE_ONLY_RECOVERY_RUNNER_PATH,
    baseArgs: [
      "--approval",
      "APPROVE_YOUTUBE_ONLY_PART1_RECOVERY_V1",
    ],
    passthrough: [
      "--source-publish-dir",
      "--recovery-out-dir",
      "--content-unit",
      "--owner-resolution",
      "--ledger",
      "--expected-recovery-fingerprint",
      "--expected-resolution-sha256",
      "--expected-channel-id",
      "--expected-preflight-fingerprint",
    ],
    passthroughFlags: ["--arm"],
    envKeyNames: YOUTUBE_ONLY_ENV_KEY_NAMES,
    loadEnvInDryRun: false,
    validateBeforeEnvAccess:
      validateYoutubeOnlyRecoveryBeforeEnvAccess,
  },
  "part2-only-dual-publish": {
    script: PART2_DUAL_PUBLISH_SAFE_RUNNER_PATH,
    baseArgs: [
      "--approval",
      "APPROVE_MONEY_SHORTS_PART2_DUAL_PLATFORM_PUBLISH_SAFE_V1",
    ],
    passthrough: [
      ...PART2_DUAL_SAFE_REQUIRED_PATH_FLAGS,
      ...PART2_DUAL_SAFE_REQUIRED_EVIDENCE_FLAGS,
      "--expected-preflight-fingerprint",
    ],
    passthroughFlags: ["--arm"],
    envKeyNames: APPROVED_ENV_KEY_NAMES,
    loadEnvInDryRun: false,
    validateBeforeEnvAccess:
      validatePart2DualPublishBeforeEnvAccess,
  },
  "part2-instagram-identity-preflight": {
    script: PART2_INSTAGRAM_IDENTITY_RUNNER_PATH,
    baseArgs: [
      "--approval",
      "APPROVE_MONEY_SHORTS_PART2_INSTAGRAM_IDENTITY_READONLY_PREFLIGHT_V1",
    ],
    passthrough: [
      ...PART2_INSTAGRAM_IDENTITY_REQUIRED_FLAGS,
      "--expected-plan-fingerprint",
    ],
    passthroughFlags: ["--arm"],
    envKeyNames: INSTAGRAM_IDENTITY_ENV_KEY_NAMES,
    loadEnvInDryRun: false,
    validateBeforeEnvAccess:
      validatePart2InstagramIdentityBeforeEnvAccess,
  },
});

function validateYoutubeOnlyRecoveryBeforeEnvAccess(
  rawArgs,
) {
  if (
    !Array.isArray(rawArgs) ||
    rawArgs[0] !== "youtube-only-part1-recovery"
  ) {
    return {
      ok: false,
      reason: "youtube_recovery_command_position_invalid",
    };
  }
  const valueFlags = new Set([
    "--env-path",
    ...YOUTUBE_ONLY_REQUIRED_PATH_FLAGS,
    ...YOUTUBE_ONLY_REQUIRED_EVIDENCE_FLAGS,
    "--expected-preflight-fingerprint",
  ]);
  const values = Object.create(null);
  let armed = false;
  for (let index = 1; index < rawArgs.length; index += 1) {
    const token = rawArgs[index];
    if (token === "--arm") {
      if (armed) {
        return {
          ok: false,
          reason: "youtube_recovery_duplicate_arm",
        };
      }
      armed = true;
      continue;
    }
    if (!valueFlags.has(token) || Object.hasOwn(values, token)) {
      return {
        ok: false,
        reason: "youtube_recovery_unknown_or_duplicate_flag",
      };
    }
    const value = rawArgs[index + 1];
    if (
      typeof value !== "string" ||
      value.length === 0 ||
      value.startsWith("--")
    ) {
      return {
        ok: false,
        reason: "youtube_recovery_flag_value_invalid",
      };
    }
    values[token] = value;
    index += 1;
  }
  if (
    !YOUTUBE_ONLY_REQUIRED_PATH_FLAGS.every(
      (flag) =>
        typeof values[flag] === "string" &&
        isAbsolute(values[flag]),
    ) ||
    !YOUTUBE_ONLY_REQUIRED_EVIDENCE_FLAGS.every(
      (flag) => typeof values[flag] === "string",
    ) ||
    !SHA256_RE.test(
      values["--expected-recovery-fingerprint"] ?? "",
    ) ||
    !SHA256_RE.test(
      values["--expected-resolution-sha256"] ?? "",
    ) ||
    !YOUTUBE_CHANNEL_ID_RE.test(
      values["--expected-channel-id"] ?? "",
    ) ||
    (values["--expected-preflight-fingerprint"] !==
      undefined &&
      !SHA256_RE.test(
        values["--expected-preflight-fingerprint"],
      )) ||
    (armed &&
      !SHA256_RE.test(
        values["--expected-preflight-fingerprint"] ?? "",
      ))
  ) {
    return {
      ok: false,
      reason: "youtube_recovery_required_evidence_invalid",
    };
  }
  return { ok: true };
}

function validatePart2DualPublishBeforeEnvAccess(rawArgs) {
  if (
    !Array.isArray(rawArgs) ||
    rawArgs[0] !== "part2-only-dual-publish"
  ) {
    return {
      ok: false,
      reason:
        "part2_dual_safe_command_position_invalid",
    };
  }
  const valueFlags = new Set([
    "--env-path",
    ...PART2_DUAL_SAFE_REQUIRED_PATH_FLAGS,
    ...PART2_DUAL_SAFE_REQUIRED_EVIDENCE_FLAGS,
    "--expected-preflight-fingerprint",
  ]);
  const values = Object.create(null);
  let armed = false;
  for (let index = 1; index < rawArgs.length; index += 1) {
    const token = rawArgs[index];
    if (token === "--arm") {
      if (armed) {
        return {
          ok: false,
          reason: "part2_dual_safe_duplicate_arm",
        };
      }
      armed = true;
      continue;
    }
    if (
      !valueFlags.has(token) ||
      Object.hasOwn(values, token)
    ) {
      return {
        ok: false,
        reason:
          "part2_dual_safe_unknown_or_duplicate_flag",
      };
    }
    const value = rawArgs[index + 1];
    if (
      typeof value !== "string" ||
      value.length === 0 ||
      value.startsWith("--")
    ) {
      return {
        ok: false,
        reason: "part2_dual_safe_flag_value_invalid",
      };
    }
    values[token] = value;
    index += 1;
  }
  const contentId =
    values["--expected-content-id"] ?? "";
  if (
    !PART2_DUAL_SAFE_REQUIRED_PATH_FLAGS.every(
      (flag) =>
        typeof values[flag] === "string" &&
        isAbsolute(values[flag]),
    ) ||
    !PART2_DUAL_SAFE_REQUIRED_EVIDENCE_FLAGS.every(
      (flag) => typeof values[flag] === "string",
    ) ||
    !contentId.endsWith("-part-2") ||
    !SHA256_RE.test(
      values["--expected-manifest-sha256"] ?? "",
    ) ||
    !SHA256_RE.test(
      values["--expected-source-sha256"] ?? "",
    ) ||
    !SHA256_RE.test(
      values[
        "--expected-publication-attempt-fingerprint"
      ] ?? "",
    ) ||
    !INSTAGRAM_ACCOUNT_ID_RE.test(
      values["--expected-instagram-account-id"] ?? "",
    ) ||
    !YOUTUBE_CHANNEL_ID_RE.test(
      values["--expected-youtube-channel-id"] ?? "",
    ) ||
    (values["--expected-preflight-fingerprint"] !==
      undefined &&
      !SHA256_RE.test(
        values["--expected-preflight-fingerprint"],
      )) ||
    (armed &&
      !SHA256_RE.test(
        values["--expected-preflight-fingerprint"] ?? "",
      ))
  ) {
    return {
      ok: false,
      reason:
        "part2_dual_safe_required_evidence_invalid",
    };
  }
  return { ok: true };
}

function validatePart2InstagramIdentityBeforeEnvAccess(
  rawArgs,
) {
  if (
    !Array.isArray(rawArgs) ||
    rawArgs[0] !==
      "part2-instagram-identity-preflight"
  ) {
    return {
      ok: false,
      reason:
        "part2_instagram_identity_command_position_invalid",
    };
  }
  const valueFlags = new Set([
    "--env-path",
    ...PART2_INSTAGRAM_IDENTITY_REQUIRED_FLAGS,
    "--expected-plan-fingerprint",
  ]);
  const values = Object.create(null);
  let armed = false;
  for (let index = 1; index < rawArgs.length; index += 1) {
    const token = rawArgs[index];
    if (token === "--arm") {
      if (armed) {
        return {
          ok: false,
          reason:
            "part2_instagram_identity_duplicate_arm",
        };
      }
      armed = true;
      continue;
    }
    if (
      !valueFlags.has(token) ||
      Object.hasOwn(values, token)
    ) {
      return {
        ok: false,
        reason:
          "part2_instagram_identity_unknown_or_duplicate_flag",
      };
    }
    const value = rawArgs[index + 1];
    if (
      typeof value !== "string" ||
      value.length === 0 ||
      value.startsWith("--")
    ) {
      return {
        ok: false,
        reason:
          "part2_instagram_identity_flag_value_invalid",
      };
    }
    values[token] = value;
    index += 1;
  }
  if (
    !PART2_INSTAGRAM_IDENTITY_REQUIRED_FLAGS.every(
      (flag) => typeof values[flag] === "string",
    ) ||
    !isAbsolute(values["--content-unit"] ?? "") ||
    !String(values["--expected-content-id"] ?? "")
      .endsWith("-part-2") ||
    !SHA256_RE.test(
      values["--expected-manifest-sha256"] ?? "",
    ) ||
    !SHA256_RE.test(
      values["--expected-source-sha256"] ?? "",
    ) ||
    !INSTAGRAM_ACCOUNT_ID_RE.test(
      values["--expected-instagram-account-id"] ?? "",
    ) ||
    (values["--expected-plan-fingerprint"] !==
      undefined &&
      !SHA256_RE.test(
        values["--expected-plan-fingerprint"],
      )) ||
    (armed &&
      !SHA256_RE.test(
        values["--expected-plan-fingerprint"] ?? "",
      ))
  ) {
    return {
      ok: false,
      reason:
        "part2_instagram_identity_required_binding_invalid",
    };
  }
  return { ok: true };
}

/**
 * .env 형식 파일에서 승인된 key만 골라 { KEY: value } 를 만든다.
 * 값은 이 객체 안에만 존재하며, 어디에도 출력/파생/저장하지 않는다.
 * - `KEY=value` 라인만 처리, 앞뒤 공백 trim
 * - 값 양끝의 짝맞는 single/double quote 1겹 제거
 * - 빈 줄/주석(#)/`export ` prefix 허용
 * - 변수 확장/명령 실행 없음
 * 승인 목록에 없는 key는 값을 읽지 않고 건너뛴다.
 * @returns {{ present: Record<string, boolean>, injected: Record<string, string> }}
 */
function loadApprovedKeysFromEnvFile(
  envFilePath,
  approvedEnvKeyNames,
) {
  const injected = Object.create(null);
  const present = Object.create(null);
  for (const name of approvedEnvKeyNames) present[name] = false;

  if (!envFilePath || !existsSync(envFilePath)) {
    return { present, injected };
  }

  let raw = "";
  try {
    raw = readFileSync(envFilePath, "utf8");
  } catch {
    return { present, injected }; // 읽기 실패 시 값 노출 없이 present=false 유지
  }

  const approved = new Set(approvedEnvKeyNames);
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed === "" || trimmed.startsWith("#")) continue;
    const withoutExport = trimmed.startsWith("export ") ? trimmed.slice(7).trim() : trimmed;
    const eq = withoutExport.indexOf("=");
    if (eq <= 0) continue;
    const key = withoutExport.slice(0, eq).trim();
    if (!approved.has(key)) continue; // 승인되지 않은 key는 값 자체를 읽지 않음
    let value = withoutExport.slice(eq + 1).trim();
    if (
      value.length >= 2 &&
      ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'")))
    ) {
      value = value.slice(1, -1);
    }
    if (value !== "") {
      injected[key] = value; // 값은 이 객체에만 존재 — 출력/파생 없음
      present[key] = true;
    }
  }
  return { present, injected };
}

/** sanitized child env: 화이트리스트 OS 변수(개별 상속) + 승인 credential key만. broad spread 없음. */
function buildSanitizedChildEnv(
  injected,
  approvedEnvKeyNames,
) {
  const env = Object.create(null);
  for (const name of SAFE_CHILD_OS_ENV_KEYS) {
    const v = process.env[name];
    if (typeof v === "string") env[name] = v; // non-secret OS 변수만, 개별 상속
  }
  for (const name of approvedEnvKeyNames) {
    if (typeof injected[name] === "string") env[name] = injected[name];
  }
  return env;
}

function parseArgs(argv) {
  const args = argv.slice(2);
  const commandName = args.find((a) => !a.startsWith("--")) ?? null;
  const getFlag = (flag) => {
    const i = args.indexOf(flag);
    return i !== -1 && i + 1 < args.length ? args[i + 1] : null;
  };
  // 기본 env 파일은 Owner runtime에서만 .env.local. 테스트는 항상 명시적 --env-path를 준다.
  // (node 예약 옵션 --env-file과 충돌하지 않도록 --env-path 사용.)
  const envFile = getFlag("--env-path") ?? join(REPO_ROOT, ".env.local");
  return { commandName, envFile, rawArgs: args, getFlag };
}

function printUsage() {
  console.log(
    [
      "Owner local env no-log command wrapper (task: owner-local-env-no-log-command-wrapper-v1).",
      "",
      "Usage:",
      "  node scripts/run-owner-command-with-local-env-no-log.mjs <command> [--env-path <path>] [--content-unit <path>]",
      "  node scripts/run-owner-command-with-local-env-no-log.mjs final-e2e-publish --content-unit <manifest> --ledger <ledger.json> --out-dir <dir> [--arm]",
      "  node scripts/run-owner-command-with-local-env-no-log.mjs youtube-only-part1-recovery --source-publish-dir <dir> --recovery-out-dir <separate-dir> --content-unit <manifest> --owner-resolution <part-1.json> --ledger <ledger.json> --expected-recovery-fingerprint <sha256> --expected-resolution-sha256 <sha256> --expected-channel-id <channel> [--expected-preflight-fingerprint <sha256> --arm]",
      "  node scripts/run-owner-command-with-local-env-no-log.mjs part2-only-dual-publish --content-unit <manifest> --ledger <ledger.json> --out-dir <part-2 publish dir> --expected-content-id <part-2 id> --expected-manifest-sha256 <sha256> --expected-source-sha256 <sha256> --expected-publication-attempt-fingerprint <sha256> --expected-instagram-account-id <id> --expected-youtube-channel-id <channel> [--expected-preflight-fingerprint <sha256> --arm]",
      "  node scripts/run-owner-command-with-local-env-no-log.mjs part2-instagram-identity-preflight --content-unit <manifest> --expected-content-id <part-2 id> --expected-manifest-sha256 <sha256> --expected-source-sha256 <sha256> --expected-instagram-account-id <id> [--expected-plan-fingerprint <sha256> --arm]",
      "",
      "Commands:",
      "  credential-preflight   inject approved local env keys (no-log) and run the redacted",
      "                         credential presence check via the owner entrypoint.",
      "  final-e2e-publish      inject approved local env keys (no-log) and run the one-shot final",
      "                         E2E dual-platform publish runner (Blob→Instagram→YouTube→ledger).",
      "                         Without --arm it is preflight-only (zero external calls).",
      "  youtube-only-part1-recovery",
      "                         inject ONLY the three YouTube OAuth keys and run the one-shot",
      "                         part-1 YouTube-only recovery. Instagram/Blob keys are excluded.",
      "  part2-only-dual-publish",
      "                         run the dedicated part-2-only dual publish safety gate.",
      "                         Dry-run does not access the env file; --arm requires the exact preflight fingerprint.",
      "  part2-instagram-identity-preflight",
      "                         inject ONLY the Instagram account-id/token keys and perform one",
      "                         fixed GET-only account identity check. No publish or local write.",
      "                         Dry-run does not access the env file; --arm requires the exact plan fingerprint.",
      "",
      "Notes:",
      "  - Loads ONLY approved key NAMES; credential values are never printed/hashed/measured.",
      "  - Default env file is .env.local (Owner runtime only). Tests pass an explicit fake --env-path.",
    ].join("\n"),
  );
}

function main() {
  const { commandName, envFile, rawArgs, getFlag } = parseArgs(process.argv);

  if (!commandName || !(commandName in SUPPORTED_COMMANDS)) {
    printUsage();
    if (commandName && !(commandName in SUPPORTED_COMMANDS)) {
      console.error(`\nABORT: unsupported command: ${commandName}`);
      process.exit(2);
    }
    process.exit(commandName ? 0 : 2);
  }

  const command = SUPPORTED_COMMANDS[commandName];
  const preEnvValidation =
    typeof command.validateBeforeEnvAccess === "function"
      ? command.validateBeforeEnvAccess(rawArgs)
      : { ok: true };
  if (preEnvValidation.ok !== true) {
    console.error(
      `ABORT: ${preEnvValidation.reason}`,
    );
    process.exit(2);
  }
  const approvedEnvKeyNames = command.envKeyNames;
  const shouldLoadApprovedCredentials =
    command.loadEnvInDryRun !== false ||
    rawArgs.includes("--arm");
  const { present, injected } =
    shouldLoadApprovedCredentials
      ? loadApprovedKeysFromEnvFile(
          envFile,
          approvedEnvKeyNames,
        )
      : {
          present: Object.fromEntries(
            approvedEnvKeyNames.map((name) => [
              name,
              false,
            ]),
          ),
          injected: Object.create(null),
        };

  // 진단 출력: key 이름 + present boolean만. 값/길이/prefix/hash 없음.
  const presentCount = approvedEnvKeyNames.filter((k) => present[k] === true).length;
  console.log("[owner-env-no-log] injecting approved credential key NAMES into child process env (no values printed).");
  console.log(
    shouldLoadApprovedCredentials
      ? `[owner-env-no-log] env file: ${envFile}${existsSync(envFile) ? "" : " (not found — all keys will be present:false)"}`
      : "[owner-env-no-log] dry-run: credential env file was not accessed.",
  );
  console.log(`[owner-env-no-log] approved keys present: ${presentCount}/${approvedEnvKeyNames.length}`);
  for (const name of approvedEnvKeyNames) {
    console.log(`  ${name}: ${present[name] === true}`);
  }
  console.log("");

  const childEnv = buildSanitizedChildEnv(
    injected,
    approvedEnvKeyNames,
  );
  const childArgs = [command.script, ...command.baseArgs];
  for (const flag of command.passthrough) {
    const v = getFlag(flag);
    if (v) childArgs.push(flag, v);
  }
  for (const flag of command.passthroughFlags) {
    if (rawArgs.includes(flag)) childArgs.push(flag);
  }

  const result = spawnSync(process.execPath, childArgs, {
    cwd: REPO_ROOT,
    env: childEnv,
    shell: false,
    stdio: "inherit",
    encoding: "utf8",
  });

  // 실용적 범위에서 로컬 secret 참조를 정리한다(GC 대상화).
  for (const name of approvedEnvKeyNames) {
    if (name in injected) delete injected[name];
    if (name in childEnv) delete childEnv[name];
  }

  if (result.error) {
    console.error(`ABORT: failed to launch child command: ${result.error.message}`);
    process.exit(1);
  }
  process.exit(typeof result.status === "number" ? result.status : 1);
}

main();
