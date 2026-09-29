/**
 * Instagram 카드뉴스 이미지 Vercel Blob upload — approval-gated one-shot runner.
 *
 * task: instagram-cardnews-blob-upload-from-request-once-v1
 * Owner approval token: APPROVE_INSTAGRAM_CARDNEWS_BLOB_UPLOAD_FROM_REQUEST_ONCE
 *
 * plan-instagram-cardnews-blob-upload.mjs가 만든 request JSON을 읽어, 그 안의
 * slides 배열 각각에 대해 정확히 한 번씩 Blob put()을 시도한다(총 N회, N=slideCount).
 * 기존 영상용 run-instagram-blob-upload-from-request-once.mjs와 안전 계약은
 * 동일하되(승인 토큰, out-dir 검증, one-shot 결과 파일, no-log 토큰 처리) 대상이
 * PNG 여러 장이라는 점만 다르다. 영상 스크립트는 전혀 건드리지 않는다.
 *
 * Usage:
 *   node scripts/run-instagram-cardnews-blob-upload-once.mjs \
 *     --approval APPROVE_INSTAGRAM_CARDNEWS_BLOB_UPLOAD_FROM_REQUEST_ONCE \
 *     --request <instagram-cardnews-blob-upload-request.json> \
 *     --out-dir <outside-repo path>
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import {
  CARDNEWS_UPLOAD_REQUEST_SCHEMA_VERSION,
  INSTAGRAM_CARDNEWS_BLOB_UPLOAD_APPROVAL_TOKEN,
  INSTAGRAM_CARDNEWS_BLOB_PLATFORM,
  INSTAGRAM_CARDNEWS_BLOB_VARIANT_ID,
  INSTAGRAM_CARDNEWS_BLOB_CONTENT_TYPE,
  buildCardnewsBlobPathname,
  buildCardnewsBlobPutOptionPlan,
} from "./plan-instagram-cardnews-blob-upload.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");

export const ONCE_APPROVAL_TOKEN = INSTAGRAM_CARDNEWS_BLOB_UPLOAD_APPROVAL_TOKEN;
export const UPLOAD_ONCE_RESULT_SCHEMA_VERSION = "instagram_cardnews_blob_upload_once_result_v1";
export const STATUS_UPLOADED = "UPLOADED";
export const STATUS_PARTIAL = "PARTIAL_UPLOAD";
export const STATUS_BLOCKED_TOKEN_ABSENT = "BLOCKED_BLOB_TOKEN_ABSENT_NO_UPLOAD";
export const STATUS_UPLOAD_FAILED = "UPLOAD_FAILED_ERROR";

const RESULT_FILENAME = "instagram-cardnews-blob-upload-once-result.json";
const TOKEN_ABSENT_FILENAME = "instagram-cardnews-blob-upload-once-token-absent.json";
const WRAPPER_DIR = resolve(REPO_ROOT, "output/instagram-cardnews-blob-upload-from-request-once-v1");
const WRAPPER_PATH = join(WRAPPER_DIR, "run-upload-with-token-prompt.ps1");

function getArg(args, name) {
  const idx = args.indexOf(name);
  if (idx !== -1 && args[idx + 1]) return args[idx + 1];
  return null;
}

function printUsage() {
  console.log(
    [
      "Approval-gated one-shot Instagram cardnews Blob upload (multiple PNG slides) from a validated request.",
      "",
      "Usage:",
      "  node scripts/run-instagram-cardnews-blob-upload-once.mjs" +
        ` --approval ${ONCE_APPROVAL_TOKEN}` +
        " --request <instagram-cardnews-blob-upload-request.json>" +
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
  const runnerAbs = resolve(__dirname, "run-instagram-cardnews-blob-upload-once.mjs");
  const lines = [
    "# no-log Vercel Blob upload wrapper (instagram-cardnews-blob-upload-from-request-once-v1)",
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
  if (request?.schemaVersion !== CARDNEWS_UPLOAD_REQUEST_SCHEMA_VERSION) {
    return { ok: false, reason: `request_unrecognized_schema_version: ${request?.schemaVersion}` };
  }
  if (request?.requiresApprovalToken !== ONCE_APPROVAL_TOKEN) {
    return { ok: false, reason: `request_requiresApprovalToken_mismatch: ${request?.requiresApprovalToken}` };
  }
  if (request?.uploadPerformed !== false || request?.willUpload !== false) {
    return { ok: false, reason: "request_upload_flags_invalid" };
  }
  if (request?.platform !== INSTAGRAM_CARDNEWS_BLOB_PLATFORM || request?.variantId !== INSTAGRAM_CARDNEWS_BLOB_VARIANT_ID) {
    return { ok: false, reason: "request_platform_or_variant_mismatch" };
  }
  if (!Array.isArray(request?.slides) || request.slides.length === 0) {
    return { ok: false, reason: "request_slides_missing_or_empty" };
  }
  if (request.slides.length > 10) {
    return { ok: false, reason: `request_too_many_slides: ${request.slides.length} > 10` };
  }

  // 각 슬라이드마다 현재 파일이 request와 여전히 일치하는지(size/sha256/pathname) 재검증한다.
  const expectedPutOptions = buildCardnewsBlobPutOptionPlan();
  const putOptionsMatch =
    request?.putOptions?.access === expectedPutOptions.access &&
    request?.putOptions?.addRandomSuffix === expectedPutOptions.addRandomSuffix &&
    request?.putOptions?.allowOverwrite === expectedPutOptions.allowOverwrite &&
    request?.putOptions?.multipart === expectedPutOptions.multipart &&
    request?.putOptions?.contentType === expectedPutOptions.contentType;
  if (!putOptionsMatch) return { ok: false, reason: "request_putOptions_mismatch" };

  for (const slide of request.slides) {
    if (!existsSync(slide.sourcePath)) {
      return { ok: false, reason: `slide_source_not_found: ${slide.file}` };
    }
    const currentSize = statSync(slide.sourcePath).size;
    if (currentSize !== slide.sourceSizeBytes) {
      return { ok: false, reason: `slide_size_mismatch: ${slide.file} current=${currentSize} request=${slide.sourceSizeBytes}` };
    }
    const currentSha256 = createHash("sha256").update(readFileSync(slide.sourcePath)).digest("hex");
    if (currentSha256 !== slide.sha256) {
      return { ok: false, reason: `slide_sha256_mismatch: ${slide.file}` };
    }
    const expectedPathname = buildCardnewsBlobPathname({
      contentId: request.contentId,
      version: request.version,
      sha256: slide.sha256,
      slideIndex: slide.slideIndex,
    });
    if (slide.pathname !== expectedPathname) {
      return { ok: false, reason: `slide_pathname_mismatch: ${slide.file}` };
    }
  }

  return { ok: true, reason: null, request };
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
  console.log("║   Instagram Cardnews Blob Upload — one-shot per slide (approval) ║");
  console.log("╚══════════════════════════════════════════════════════════════╝\n");

  const validated = loadAndValidateRequest(requestPathAbs);
  if (!validated.ok) {
    console.error(`ABORT: preflight failed — ${validated.reason}`);
    process.exit(1);
  }
  const request = validated.request;
  console.log(`  contentId:   ${request.contentId}`);
  console.log(`  slideCount:  ${request.slides.length}`);

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
      slideCount: request.slides.length,
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
  const { put } = await import("@vercel/blob");

  const putOptions = buildCardnewsBlobPutOptionPlan();
  const slideResults = [];
  let uploadedCount = 0;

  for (const slide of request.slides) {
    const bodyBuffer = readFileSync(slide.sourcePath);
    const bodySha256 = createHash("sha256").update(bodyBuffer).digest("hex");
    if (bodySha256 !== slide.sha256) {
      slideResults.push({ ...slide, status: STATUS_UPLOAD_FAILED, error: "body_hash_mismatch_at_read_time" });
      continue;
    }
    try {
      const blob = await put(slide.pathname, bodyBuffer, { ...putOptions });
      uploadedCount += 1;
      slideResults.push({
        slideIndex: slide.slideIndex,
        file: slide.file,
        status: STATUS_UPLOADED,
        uploadedUrl: blob.url,
        uploadedPathname: blob.pathname,
      });
      console.log(`  [${slide.slideIndex}] ${slide.file} → UPLOADED: ${blob.url}`);
    } catch (err) {
      const message = sanitizeErrorMessage(err?.message);
      const status = isAlreadyExistsRefusal(message) ? "BLOCKED_ALREADY_EXISTS_OR_OVERWRITE_REFUSED" : STATUS_UPLOAD_FAILED;
      slideResults.push({ slideIndex: slide.slideIndex, file: slide.file, status, error: message });
      console.error(`  [${slide.slideIndex}] ${slide.file} → ${status}: ${message}`);
    }
  }

  const allUploaded = uploadedCount === request.slides.length;
  const overallStatus = allUploaded
    ? STATUS_UPLOADED
    : uploadedCount > 0
    ? STATUS_PARTIAL
    : STATUS_UPLOAD_FAILED;

  const result = {
    schemaVersion: UPLOAD_ONCE_RESULT_SCHEMA_VERSION,
    status: overallStatus,
    contentId: request.contentId,
    version: request.version,
    slideCount: request.slides.length,
    uploadedCount,
    slides: slideResults,
    completedAtIso: new Date().toISOString(),
  };
  mkdirSync(outDirAbs, { recursive: true });
  writeFileSync(resultPath, JSON.stringify(result, null, 2), "utf-8");

  console.log(`\n  STATUS: ${overallStatus} (${uploadedCount}/${request.slides.length} uploaded)`);
  console.log(`  result: ${resultPath}\n`);
  process.exit(allUploaded ? 0 : 1);
}
