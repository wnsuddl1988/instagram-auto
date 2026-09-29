/**
 * Instagram 릴스 커버 이미지 Vercel Blob upload — approval-gated one-shot runner.
 *
 * task: instagram-reel-cover-blob-upload-from-request-once-v1
 * Owner approval token: APPROVE_INSTAGRAM_REEL_COVER_BLOB_UPLOAD_FROM_REQUEST_ONCE
 *
 * plan-instagram-reel-cover-blob-upload.mjs가 만든 request JSON을 읽어 정확히 한
 * 번 Blob put()을 시도한다. 기존 영상/카드뉴스용 러너와 안전 계약은 동일하되
 * (승인 토큰, out-dir 검증, one-shot 결과 파일, no-log 토큰 처리) 대상이 커버
 * 이미지 1장이라는 점만 다르다. 영상/카드뉴스 스크립트는 전혀 건드리지 않는다.
 *
 * Usage:
 *   node scripts/run-instagram-reel-cover-blob-upload-once.mjs \
 *     --approval APPROVE_INSTAGRAM_REEL_COVER_BLOB_UPLOAD_FROM_REQUEST_ONCE \
 *     --request <instagram-reel-cover-blob-upload-request.json> \
 *     --out-dir <outside-repo path>
 *
 * 성공 시 result JSON의 uploadedUrl 이 곧 run-owl-instagram-publish-once-v1.mjs
 * 가 blobResult.coverImageUrl 로 기대하는 값이다 — 그 블롭 결과 JSON에
 * coverImageUrl 필드로 수동/스크립트로 병합해 넣으면 REELS 컨테이너 생성 시
 * cover_url 로 지정된다.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import {
  REEL_COVER_UPLOAD_REQUEST_SCHEMA_VERSION,
  INSTAGRAM_REEL_COVER_BLOB_UPLOAD_APPROVAL_TOKEN,
  INSTAGRAM_REEL_COVER_BLOB_PLATFORM,
  INSTAGRAM_REEL_COVER_BLOB_VARIANT_ID,
  buildReelCoverBlobPathname,
  buildReelCoverBlobPutOptionPlan,
} from "./plan-instagram-reel-cover-blob-upload.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");

export const ONCE_APPROVAL_TOKEN = INSTAGRAM_REEL_COVER_BLOB_UPLOAD_APPROVAL_TOKEN;
export const UPLOAD_ONCE_RESULT_SCHEMA_VERSION = "instagram_reel_cover_blob_upload_once_result_v1";
export const STATUS_UPLOADED = "UPLOADED";
export const STATUS_BLOCKED_ALREADY_EXISTS = "BLOCKED_ALREADY_EXISTS_OR_OVERWRITE_REFUSED";
export const STATUS_BLOCKED_TOKEN_ABSENT = "BLOCKED_BLOB_TOKEN_ABSENT_NO_UPLOAD";
export const STATUS_UPLOAD_FAILED = "UPLOAD_FAILED_ERROR";

const RESULT_FILENAME = "instagram-reel-cover-blob-upload-once-result.json";
const TOKEN_ABSENT_FILENAME = "instagram-reel-cover-blob-upload-once-token-absent.json";
const WRAPPER_DIR = resolve(REPO_ROOT, "output/instagram-reel-cover-blob-upload-from-request-once-v1");
const WRAPPER_PATH = join(WRAPPER_DIR, "run-upload-with-token-prompt.ps1");

function getArg(args, name) {
  const idx = args.indexOf(name);
  if (idx !== -1 && args[idx + 1]) return args[idx + 1];
  return null;
}

function printUsage() {
  console.log(
    [
      "Approval-gated one-shot Instagram reel-cover Blob upload from a validated request.",
      "",
      "Usage:",
      "  node scripts/run-instagram-reel-cover-blob-upload-once.mjs" +
        ` --approval ${ONCE_APPROVAL_TOKEN}` +
        " --request <instagram-reel-cover-blob-upload-request.json>" +
        " --out-dir <outside-repo path>",
    ].join("\n"),
  );
}

function sanitizeErrorMessage(message) {
  return String(message ?? "unknown error").replace(/vercel_blob_rw_[A-Za-z0-9_-]+/g, "[REDACTED_TOKEN_SHAPE]");
}
function isAlreadyExistsRefusal(message) {
  return /already exists|allow.?overwrite/i.test(String(message ?? ""));
}

function writeNoLogTokenWrapper({ requestPathAbs, outDirAbs }) {
  mkdirSync(WRAPPER_DIR, { recursive: true });
  const runnerAbs = resolve(__dirname, "run-instagram-reel-cover-blob-upload-once.mjs");
  const lines = [
    "# no-log Vercel Blob upload wrapper (instagram-reel-cover-blob-upload-from-request-once-v1)",
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

function loadAndValidateRequest(requestPath) {
  if (!existsSync(requestPath)) return { ok: false, reason: "request_file_not_found" };
  let request;
  try {
    request = JSON.parse(readFileSync(requestPath, "utf-8"));
  } catch (e) {
    return { ok: false, reason: `request_json_parse_failed: ${String(e?.message || e)}` };
  }
  if (request?.schemaVersion !== REEL_COVER_UPLOAD_REQUEST_SCHEMA_VERSION) {
    return { ok: false, reason: `request_unrecognized_schema_version: ${request?.schemaVersion}` };
  }
  if (request?.requiresApprovalToken !== ONCE_APPROVAL_TOKEN) {
    return { ok: false, reason: `request_requiresApprovalToken_mismatch: ${request?.requiresApprovalToken}` };
  }
  if (request?.uploadPerformed !== false || request?.willUpload !== false) {
    return { ok: false, reason: "request_upload_flags_invalid" };
  }
  if (request?.platform !== INSTAGRAM_REEL_COVER_BLOB_PLATFORM || request?.variantId !== INSTAGRAM_REEL_COVER_BLOB_VARIANT_ID) {
    return { ok: false, reason: "request_platform_or_variant_mismatch" };
  }
  if (typeof request?.sourcePath !== "string" || request.sourcePath.trim() === "") {
    return { ok: false, reason: "request_sourcePath_missing" };
  }
  if (!existsSync(request.sourcePath)) {
    return { ok: false, reason: "request_sourcePath_file_not_found" };
  }

  const currentSize = statSync(request.sourcePath).size;
  if (currentSize !== request.sourceSizeBytes) {
    return { ok: false, reason: `source_size_mismatch: current ${currentSize} !== request ${request.sourceSizeBytes}` };
  }
  const currentSha256 = createHash("sha256").update(readFileSync(request.sourcePath)).digest("hex");
  if (currentSha256 !== request.sha256) {
    return { ok: false, reason: "source_sha256_mismatch: current file hash differs from request sha256" };
  }
  const ext = request.pathname.slice(request.pathname.lastIndexOf("."));
  const expectedPathname = buildReelCoverBlobPathname({
    contentId: request.contentId,
    version: request.version,
    sha256: request.sha256,
    ext,
  });
  if (request.pathname !== expectedPathname) {
    return { ok: false, reason: "request_pathname_mismatch" };
  }
  const expectedPutOptions = buildReelCoverBlobPutOptionPlan(request.contentType);
  const putOptionsMatch =
    request?.putOptions?.access === expectedPutOptions.access &&
    request?.putOptions?.addRandomSuffix === expectedPutOptions.addRandomSuffix &&
    request?.putOptions?.allowOverwrite === expectedPutOptions.allowOverwrite &&
    request?.putOptions?.multipart === expectedPutOptions.multipart &&
    request?.putOptions?.contentType === expectedPutOptions.contentType;
  if (!putOptionsMatch) return { ok: false, reason: "request_putOptions_mismatch" };

  return { ok: true, reason: null, request, currentSha256, currentSize };
}

// ── CLI entrypoint ───────────────────────────────────────────────────────────────
const isMainModule = process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));
if (isMainModule) {
  const args = process.argv.slice(2);
  const approval = getArg(args, "--approval");
  const requestPathArg = getArg(args, "--request");
  const outDirArg = getArg(args, "--out-dir");

  if (approval !== ONCE_APPROVAL_TOKEN) {
    console.error(`ABORT: this runner requires the exact --approval ${ONCE_APPROVAL_TOKEN}.`);
    process.exit(1);
  }
  if (!requestPathArg || !outDirArg) {
    printUsage();
    process.exit(1);
  }

  const requestPathAbs = resolve(requestPathArg);
  const outDirAbs = resolve(outDirArg);
  if (outDirAbs === REPO_ROOT || outDirAbs.startsWith(REPO_ROOT + "\\") || outDirAbs.startsWith(REPO_ROOT + "/")) {
    console.error(`ABORT: --out-dir must be outside repo root.\n  repo: ${REPO_ROOT}\n  out-dir: ${outDirAbs}`);
    process.exit(1);
  }
  if ([requestPathAbs, outDirAbs].some((p) => p.includes(".money-shorts-local"))) {
    console.error("ABORT: .money-shorts-local access forbidden.");
    process.exit(1);
  }

  const resultPath = join(outDirAbs, RESULT_FILENAME);
  if (existsSync(resultPath)) {
    console.error(
      `ABORT: previous upload-attempt result already exists — refusing to run again (one-shot guarantee).\n  existing: ${resultPath}`,
    );
    process.exit(1);
  }

  console.log("\n╔══════════════════════════════════════════════════════════════╗");
  console.log("║   Instagram Reel Cover Blob Upload — one-shot (approval)        ║");
  console.log("╚══════════════════════════════════════════════════════════════╝\n");

  const validated = loadAndValidateRequest(requestPathAbs);
  if (!validated.ok) {
    console.error(`ABORT: preflight failed — ${validated.reason}`);
    process.exit(1);
  }
  const request = validated.request;
  console.log(`  contentId:   ${request.contentId}`);
  console.log(`  sourcePath:  ${request.sourcePath}`);
  console.log(`  pathname:    ${request.pathname}`);

  const blobTokenPresent = typeof process.env.BLOB_READ_WRITE_TOKEN === "string" && process.env.BLOB_READ_WRITE_TOKEN.length > 0;
  console.log(`  BLOB_READ_WRITE_TOKEN: ${blobTokenPresent ? "present (value not read/printed)" : "ABSENT"}`);
  console.log("");

  if (!blobTokenPresent) {
    mkdirSync(outDirAbs, { recursive: true });
    const wrapperPath = writeNoLogTokenWrapper({ requestPathAbs, outDirAbs });
    const tokenAbsentPath = join(outDirAbs, TOKEN_ABSENT_FILENAME);
    const blocked = {
      schemaVersion: UPLOAD_ONCE_RESULT_SCHEMA_VERSION,
      status: STATUS_BLOCKED_TOKEN_ABSENT,
      contentId: request.contentId,
      uploadAttemptCount: 0,
      ownerRunWrapperPath: wrapperPath,
      ownerRunCommand: `powershell -ExecutionPolicy Bypass -File "${wrapperPath}"`,
    };
    if (!existsSync(tokenAbsentPath)) writeFileSync(tokenAbsentPath, JSON.stringify(blocked, null, 2), "utf-8");
    console.error(`BLOCKED: ${STATUS_BLOCKED_TOKEN_ABSENT}`);
    console.error(`  token-absent report: ${tokenAbsentPath}`);
    console.error(`  Owner-run command: powershell -ExecutionPolicy Bypass -File "${wrapperPath}"`);
    process.exit(2);
  }

  process.env.VERCEL_BLOB_RETRIES = "0";

  const bodyBuffer = readFileSync(request.sourcePath);
  const bodySha256 = createHash("sha256").update(bodyBuffer).digest("hex");
  if (bodySha256 !== request.sha256 || bodyBuffer.length !== request.sourceSizeBytes) {
    console.error(
      "ABORT: upload body verification failed — the bytes read for upload no longer match the request. No upload attempt was performed.",
    );
    process.exit(1);
  }

  const finish = (result, exitCode) => {
    mkdirSync(outDirAbs, { recursive: true });
    writeFileSync(resultPath, JSON.stringify(result, null, 2), "utf-8");
    console.log(`\n  result: ${resultPath}\n`);
    process.exit(exitCode);
  };

  const { put } = await import("@vercel/blob");
  try {
    const blob = await put(request.pathname, bodyBuffer, { ...request.putOptions });
    const result = {
      schemaVersion: UPLOAD_ONCE_RESULT_SCHEMA_VERSION,
      status: STATUS_UPLOADED,
      contentId: request.contentId,
      version: request.version,
      pathname: request.pathname,
      sourcePath: request.sourcePath,
      sha256: request.sha256,
      uploadAttemptCount: 1,
      uploadedUrl: blob.url,
      uploadedDownloadUrl: blob.downloadUrl ?? null,
      uploadedPathname: blob.pathname,
      uploadedContentType: blob.contentType ?? null,
      completedAtIso: new Date().toISOString(),
      note:
        "이 uploadedUrl을 instagram-blob-upload-once-result.json에 coverImageUrl로 병합하면 " +
        "run-owl-instagram-publish-once-v1.mjs가 REELS 컨테이너 생성 시 cover_url로 지정합니다.",
    };
    console.log(`  STATUS:           ${STATUS_UPLOADED}`);
    console.log(`  uploadedUrl:      ${blob.url}`);
    finish(result, 0);
  } catch (err) {
    const message = sanitizeErrorMessage(err?.message);
    const status = isAlreadyExistsRefusal(message) ? STATUS_BLOCKED_ALREADY_EXISTS : STATUS_UPLOAD_FAILED;
    const result = {
      schemaVersion: UPLOAD_ONCE_RESULT_SCHEMA_VERSION,
      status,
      contentId: request.contentId,
      pathname: request.pathname,
      uploadAttemptCount: 1,
      errorMessageSanitized: message,
      completedAtIso: new Date().toISOString(),
    };
    console.error(`  STATUS:           ${status}`);
    console.error(`  error (sanitized): ${message}`);
    finish(result, status === STATUS_BLOCKED_ALREADY_EXISTS ? 3 : 1);
  }
}
