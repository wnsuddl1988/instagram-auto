/**
 * Instagram Vercel Blob upload from request — approval-gated one-shot runner.
 *
 * task: instagram-blob-upload-from-request-once-v1
 * Owner approval token: APPROVE_INSTAGRAM_BLOB_UPLOAD_FROM_REQUEST_ONCE
 *
 * Usage:
 *   node scripts/run-instagram-blob-upload-from-request-once.mjs \
 *     --approval APPROVE_INSTAGRAM_BLOB_UPLOAD_FROM_REQUEST_ONCE \
 *     --request <instagram-blob-upload-request.json> \
 *     --out-dir <outside-repo path>
 *
 * Consumes a validated instagram_blob_upload_request_v1 JSON and performs AT MOST ONE
 * Vercel Blob put() attempt for the request pathname. Gate order (fail-closed):
 *   1. --approval must exactly match APPROVE_INSTAGRAM_BLOB_UPLOAD_FROM_REQUEST_ONCE.
 *   2. --out-dir must be outside repo root; .money-shorts-local paths are forbidden.
 *   3. A previous upload-attempt result JSON in --out-dir blocks re-run (one-shot guarantee).
 *   4. No-execute preflight must pass via prepareInstagramBlobUploadFromRequest()
 *      (schema/approval-token/contract fields + current source size/SHA-256/pathname/put options).
 *   5. BLOB_READ_WRITE_TOKEN runtime presence is checked as a BOOLEAN ONLY. If absent:
 *      no upload attempt, status BLOCKED_BLOB_TOKEN_ABSENT_NO_UPLOAD (exit 2), and a no-log
 *      Owner-run PowerShell wrapper is written under gitignored output/.
 *   6. The upload body buffer's SHA-256 is recomputed and must equal the request sha256
 *      (the exact bytes uploaded are the exact bytes verified — no TOCTOU window).
 *   7. Exactly one put(pathname, body, { access:"public", addRandomSuffix:false,
 *      allowOverwrite:false, multipart:true, contentType:"video/mp4" }). No retry
 *      (VERCEL_BLOB_RETRIES is forced to "0" so the SDK's internal retry loop is disabled).
 *
 * Outcomes / exit codes:
 *   UPLOADED                                    exit 0  (one successful put; url recorded)
 *   BLOCKED_ALREADY_EXISTS_OR_OVERWRITE_REFUSED exit 3  (one attempt refused by allowOverwrite:false;
 *                                                        no retry/overwrite/delete; Blob mutation 0)
 *   BLOCKED_BLOB_TOKEN_ABSENT_NO_UPLOAD         exit 2  (no attempt; no-log fallback provided)
 *   UPLOAD_FAILED_ERROR                         exit 1  (one attempt failed for another reason; no retry)
 *   gate failures (approval/args/out-dir/result-exists/preflight/body-hash) abort with exit 1
 *   before any Blob SDK import or upload attempt.
 *
 * Secret safety:
 * - Never reads .env/.env.local/secret files.
 * - Never prints/hashes/copies/logs the token value. Only a boolean presence check of
 *   process.env.BLOB_READ_WRITE_TOKEN is performed; the @vercel/blob SDK consumes the token
 *   from the runtime env by itself.
 * - @vercel/blob is loaded via dynamic import ONLY after every gate has passed — no SDK code
 *   runs for blocked/aborted invocations.
 * - Forbidden and not present: list/head/del/copy/liveness/public HEAD, Instagram/YouTube API,
 *   fetch/axios, ffmpeg/ffprobe, .env access.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import {
  prepareInstagramBlobUploadFromRequest,
  isRepoRootOrInside,
} from "./prepare-instagram-blob-upload-from-request.mjs";
import { INSTAGRAM_BLOB_UPLOAD_APPROVAL_TOKEN } from "./plan-instagram-blob-upload-from-content-unit.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");

export const ONCE_APPROVAL_TOKEN = "APPROVE_INSTAGRAM_BLOB_UPLOAD_FROM_REQUEST_ONCE";
export const UPLOAD_ONCE_RESULT_SCHEMA_VERSION = "instagram_blob_upload_once_result_v1";
export const STATUS_UPLOADED = "UPLOADED";
export const STATUS_BLOCKED_ALREADY_EXISTS = "BLOCKED_ALREADY_EXISTS_OR_OVERWRITE_REFUSED";
export const STATUS_BLOCKED_TOKEN_ABSENT = "BLOCKED_BLOB_TOKEN_ABSENT_NO_UPLOAD";
export const STATUS_UPLOAD_FAILED = "UPLOAD_FAILED_ERROR";

const RESULT_FILENAME = "instagram-blob-upload-once-result.json";
const TOKEN_ABSENT_FILENAME = "instagram-blob-upload-once-token-absent.json";
const WRAPPER_DIR = resolve(REPO_ROOT, "output/instagram-blob-upload-from-request-once-v1");
const WRAPPER_PATH = join(WRAPPER_DIR, "run-upload-with-token-prompt.ps1");

/** 승인된 put option 계약 — preflight가 request putOptions와의 일치를 이미 검증한 값의 리터럴 고정본. */
const PUT_OPTIONS = {
  access: "public",
  addRandomSuffix: false,
  allowOverwrite: false,
  multipart: true,
  contentType: "video/mp4",
};

function getArg(args, name) {
  const idx = args.indexOf(name);
  if (idx !== -1 && args[idx + 1]) return args[idx + 1];
  return null;
}

function printUsage() {
  console.log(
    [
      "Approval-gated one-shot Instagram Vercel Blob upload from a validated upload request.",
      "",
      "Usage:",
      "  node scripts/run-instagram-blob-upload-from-request-once.mjs" +
        ` --approval ${ONCE_APPROVAL_TOKEN}` +
        " --request <instagram-blob-upload-request.json>" +
        " --out-dir <outside-repo path>",
      "",
      "Performs AT MOST ONE Blob put() after no-execute preflight passes. allowOverwrite:false —",
      "an existing object is refused, never overwritten, never retried, never deleted.",
      "BLOB_READ_WRITE_TOKEN is consumed by the SDK from the runtime env only; this runner never",
      "reads .env.local and never prints the token value (boolean presence check only).",
    ].join("\n"),
  );
}

/** 에러 메시지에서 token 형태를 방어적으로 제거한다(정상 경로에서는 나타날 수 없음 — belt and suspenders). */
function sanitizeErrorMessage(message) {
  return String(message ?? "unknown error").replace(/vercel_blob_rw_[A-Za-z0-9_-]+/g, "[REDACTED_TOKEN_SHAPE]");
}

/** allowOverwrite:false로 인해 기존 객체가 거부된 에러인지 판별한다. */
function isAlreadyExistsRefusal(message) {
  return /already exists|allow.?overwrite/i.test(String(message ?? ""));
}

/** token absent 시 Owner가 직접 실행할 no-log PowerShell wrapper를 생성한다(token echo 0). */
function writeNoLogTokenWrapper({ requestPathAbs, outDirAbs }) {
  mkdirSync(WRAPPER_DIR, { recursive: true });
  const runnerAbs = resolve(__dirname, "run-instagram-blob-upload-from-request-once.mjs");
  const lines = [
    "# no-log Vercel Blob upload wrapper (instagram-blob-upload-from-request-once-v1)",
    "# - token is read as SecureString: not echoed, not logged, not persisted.",
    "# - env var exists only for the child node process and is removed in finally.",
    '$ErrorActionPreference = "Stop"',
    '$secure = Read-Host -Prompt "BLOB_READ_WRITE_TOKEN (input hidden)" -AsSecureString',
    "$bstr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)",
    "try {",
    "  $env:BLOB_READ_WRITE_TOKEN = [System.Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)",
    "  [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)",
    `  & node "${runnerAbs}" --approval ${ONCE_APPROVAL_TOKEN} --request "${requestPathAbs}" --out-dir "${outDirAbs}"`,
    "  exit $LASTEXITCODE",
    "} finally {",
    "  Remove-Item Env:\\BLOB_READ_WRITE_TOKEN -ErrorAction SilentlyContinue",
    "}",
    "",
  ];
  writeFileSync(WRAPPER_PATH, lines.join("\r\n"), "utf-8");
  return WRAPPER_PATH;
}

function baseResult({ requestPathAbs, preflight, status }) {
  return {
    schemaVersion: UPLOAD_ONCE_RESULT_SCHEMA_VERSION,
    status,
    approvalTokenMatched: true,
    onceApprovalToken: ONCE_APPROVAL_TOKEN,
    requestApprovalToken: INSTAGRAM_BLOB_UPLOAD_APPROVAL_TOKEN,
    requestPath: requestPathAbs,
    contentId: preflight.contentId,
    version: preflight.version,
    platform: preflight.platform,
    variantId: preflight.variantId,
    pathname: preflight.pathname,
    contentType: preflight.contentType,
    sourcePath: preflight.sourcePath,
    sourceSizeBytes: preflight.sourceSizeBytes,
    sha256: preflight.sha256,
    sha256_12: preflight.sha256_12,
    preflightPassed: true,
    putOptions: { ...PUT_OPTIONS },
    envSecretHandling: {
      envLocalRead: false,
      envFileRead: false,
      tokenValuePrinted: false,
      tokenValueLogged: false,
      tokenValueCopiedToResult: false,
      tokenPresenceCheckedBooleanOnly: true,
      tokenConsumedBySdkFromRuntimeEnvOnly: true,
    },
    sdkRetryDisabled: true,
  };
}

// ── CLI entrypoint ───────────────────────────────────────────────────────────────
const isMainModule = process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));
if (isMainModule) {
  const args = process.argv.slice(2);
  const approval = getArg(args, "--approval");
  const requestPathArg = getArg(args, "--request");
  const outDirArg = getArg(args, "--out-dir");

  // gate 1: approval token (부작용 0으로 즉시 abort)
  if (approval !== ONCE_APPROVAL_TOKEN) {
    console.error(`ABORT: this runner requires the exact --approval ${ONCE_APPROVAL_TOKEN}.`);
    console.error("No preflight, no Blob SDK import, no upload attempt was performed.");
    process.exit(1);
  }

  if (!requestPathArg || !outDirArg) {
    printUsage();
    process.exit(1);
  }

  // gate 2: out-dir repo 밖 + .money-shorts-local 금지
  const requestPathAbs = resolve(requestPathArg);
  const outDirAbs = resolve(outDirArg);
  if (isRepoRootOrInside(outDirAbs, REPO_ROOT)) {
    console.error(`ABORT: --out-dir must be outside repo root.\n  repo: ${REPO_ROOT}\n  out-dir: ${outDirAbs}`);
    process.exit(1);
  }
  if ([requestPathAbs, outDirAbs].some((p) => p.includes(".money-shorts-local"))) {
    console.error("ABORT: .money-shorts-local access forbidden.");
    process.exit(1);
  }

  // gate 3: 이전 upload-attempt result가 있으면 재실행 금지(one-shot 보증, overwrite 0)
  const resultPath = join(outDirAbs, RESULT_FILENAME);
  if (existsSync(resultPath)) {
    console.error(
      `ABORT: previous upload-attempt result already exists — refusing to run again (one-shot guarantee).\n` +
        `  existing: ${resultPath}\n` +
        "No new upload attempt was performed. Choose a different --out-dir only with a new approved slice.",
    );
    process.exit(1);
  }

  console.log("\n╔══════════════════════════════════════════════════════════════╗");
  console.log("║   Instagram Blob Upload From Request — one-shot (approval)     ║");
  console.log("╚══════════════════════════════════════════════════════════════╝\n");

  // gate 4: no-execute preflight (source size/SHA-256/pathname/put options 재검증)
  const pf = prepareInstagramBlobUploadFromRequest({ requestPath: requestPathAbs });
  if (!pf.ok) {
    console.error(`ABORT: preflight failed — ${pf.reason}`);
    console.error("No Blob SDK import and no upload attempt was performed.");
    process.exit(1);
  }
  const preflight = pf.preflight;
  console.log(`  preflight:                    PASS (readyForFutureApprovedUpload=${preflight.readyForFutureApprovedUpload})`);
  console.log(`  contentId/version:            ${preflight.contentId}/${preflight.version}`);
  console.log(`  pathname:                     ${preflight.pathname}`);
  console.log(`  sourceSizeBytes:              ${preflight.sourceSizeBytes}`);
  console.log(`  sha256_12:                    ${preflight.sha256_12}`);

  // gate 5: token presence — boolean만 확인. 값은 읽어 옮기지 않는다(SDK가 env에서 직접 소비).
  const blobTokenPresent = typeof process.env.BLOB_READ_WRITE_TOKEN === "string" && process.env.BLOB_READ_WRITE_TOKEN.length > 0;
  console.log(`  BLOB_READ_WRITE_TOKEN:        ${blobTokenPresent ? "present (value not read/printed)" : "ABSENT"}`);
  console.log("");

  if (!blobTokenPresent) {
    mkdirSync(outDirAbs, { recursive: true });
    const wrapperPath = writeNoLogTokenWrapper({ requestPathAbs, outDirAbs });
    const tokenAbsentPath = join(outDirAbs, TOKEN_ABSENT_FILENAME);
    const blocked = {
      ...baseResult({ requestPathAbs, preflight, status: STATUS_BLOCKED_TOKEN_ABSENT }),
      uploadAttemptCount: 0,
      sideEffectCounters: {
        blobUploadCount: 0,
        blobListCount: 0,
        blobHeadCount: 0,
        blobDeleteCount: 0,
        blobCopyCount: 0,
        publicUrlLivenessCheckCount: 0,
        instagramApiCallCount: 0,
        youtubeApiCallCount: 0,
        deployCount: 0,
        mediaGenerationCount: 0,
      },
      ownerRunWrapperPath: wrapperPath,
      ownerRunCommand: `powershell -ExecutionPolicy Bypass -File "${wrapperPath}"`,
      riskNotes: [
        "BLOB_READ_WRITE_TOKEN is absent from this runtime env — no upload attempt was made (attempt count 0).",
        ".env.local was NOT read; the token value was NOT requested in chat, printed, or logged.",
        "Run the no-log wrapper above: it prompts for the token as a hidden SecureString, sets it only for the child node process, and removes it in finally.",
      ],
    };
    if (!existsSync(tokenAbsentPath)) {
      writeFileSync(tokenAbsentPath, JSON.stringify(blocked, null, 2), "utf-8");
    }
    console.error(`BLOCKED: ${STATUS_BLOCKED_TOKEN_ABSENT}`);
    console.error("  No upload attempt was performed. .env.local was not read.");
    console.error(`  token-absent report: ${tokenAbsentPath}`);
    console.error(`  Owner-run command (single step, token never echoed):`);
    console.error(`    powershell -ExecutionPolicy Bypass -File "${wrapperPath}"`);
    process.exit(2);
  }

  // gate 6: 업로드할 바이트를 읽고 그 바이트의 SHA-256을 재확인 — 업로드 바이트 == 검증 바이트.
  const bodyBuffer = readFileSync(preflight.sourcePath);
  const bodySha256 = createHash("sha256").update(bodyBuffer).digest("hex");
  if (bodySha256 !== preflight.sha256 || bodyBuffer.length !== preflight.sourceSizeBytes) {
    console.error(
      "ABORT: upload body verification failed — the bytes read for upload no longer match the request " +
        "(size or SHA-256 changed between preflight and read). No upload attempt was performed.",
    );
    process.exit(1);
  }

  // SDK 내부 재시도(기본 10회)를 비활성화해 'no retry' 계약을 기술적으로 강제한다(secret 아님).
  process.env.VERCEL_BLOB_RETRIES = "0";

  // gate 통과 후에만 SDK 로드(dynamic import) — 차단/중단 경로에서는 SDK 코드가 전혀 실행되지 않는다.
  const finish = (result, exitCode) => {
    mkdirSync(outDirAbs, { recursive: true });
    writeFileSync(resultPath, JSON.stringify(result, null, 2), "utf-8");
    console.log(`\n  result: ${resultPath}\n`);
    process.exit(exitCode);
  };

  import("@vercel/blob")
    .then(({ put }) =>
      // put() 정확 1회. 재시도/overwrite/delete/list/head 없음.
      put(preflight.pathname, bodyBuffer, { ...PUT_OPTIONS }).then(
        (blob) => {
          const result = {
            ...baseResult({ requestPathAbs, preflight, status: STATUS_UPLOADED }),
            uploadAttemptCount: 1,
            sideEffectCounters: {
              blobUploadCount: 1,
              blobListCount: 0,
              blobHeadCount: 0,
              blobDeleteCount: 0,
              blobCopyCount: 0,
              publicUrlLivenessCheckCount: 0,
              instagramApiCallCount: 0,
              youtubeApiCallCount: 0,
              deployCount: 0,
              mediaGenerationCount: 0,
            },
            uploadedUrl: blob.url,
            uploadedDownloadUrl: blob.downloadUrl ?? null,
            uploadedPathname: blob.pathname,
            uploadedContentType: blob.contentType ?? null,
            completedAtIso: new Date().toISOString(),
            riskNotes: [
              "Exactly one Blob put() succeeded. No list/head/delete/copy/liveness call was made.",
              "The uploaded bytes are byte-identical to the preflight-verified source (same buffer, SHA-256 re-checked).",
              "Token was consumed by the SDK from the runtime env; its value was never read, printed, or logged by this runner.",
            ],
          };
          console.log(`  STATUS:                       ${STATUS_UPLOADED}`);
          console.log(`  uploadedUrl:                  ${blob.url}`);
          console.log(`  uploadedPathname:             ${blob.pathname}`);
          finish(result, 0);
        },
        (err) => {
          const message = sanitizeErrorMessage(err?.message);
          if (isAlreadyExistsRefusal(message)) {
            const result = {
              ...baseResult({ requestPathAbs, preflight, status: STATUS_BLOCKED_ALREADY_EXISTS }),
              uploadAttemptCount: 1,
              sideEffectCounters: {
                blobUploadCount: 0,
                blobListCount: 0,
                blobHeadCount: 0,
                blobDeleteCount: 0,
                blobCopyCount: 0,
                publicUrlLivenessCheckCount: 0,
                instagramApiCallCount: 0,
                youtubeApiCallCount: 0,
                deployCount: 0,
                mediaGenerationCount: 0,
              },
              refusalMessageSanitized: message,
              completedAtIso: new Date().toISOString(),
              riskNotes: [
                "allowOverwrite:false refused the single put() because the object already exists.",
                "No retry, no overwrite, no delete was performed (Blob mutation count 0).",
              ],
            };
            console.error(`  STATUS:                       ${STATUS_BLOCKED_ALREADY_EXISTS}`);
            console.error(`  refusal (sanitized):          ${message}`);
            finish(result, 3);
          } else {
            const result = {
              ...baseResult({ requestPathAbs, preflight, status: STATUS_UPLOAD_FAILED }),
              uploadAttemptCount: 1,
              sideEffectCounters: {
                blobUploadCount: 0,
                blobListCount: 0,
                blobHeadCount: 0,
                blobDeleteCount: 0,
                blobCopyCount: 0,
                publicUrlLivenessCheckCount: 0,
                instagramApiCallCount: 0,
                youtubeApiCallCount: 0,
                deployCount: 0,
                mediaGenerationCount: 0,
              },
              errorMessageSanitized: message,
              completedAtIso: new Date().toISOString(),
              riskNotes: [
                "The single put() attempt failed; NO retry was performed (SDK retry disabled via VERCEL_BLOB_RETRIES=0).",
                "Report to Codex/Owner before any further attempt — a new attempt requires a new approved slice.",
              ],
            };
            console.error(`  STATUS:                       ${STATUS_UPLOAD_FAILED}`);
            console.error(`  error (sanitized):            ${message}`);
            finish(result, 1);
          }
        },
      ),
    )
    .catch((err) => {
      console.error(`ABORT: Blob SDK load failed before any upload attempt — ${sanitizeErrorMessage(err?.message)}`);
      process.exit(1);
    });
}
