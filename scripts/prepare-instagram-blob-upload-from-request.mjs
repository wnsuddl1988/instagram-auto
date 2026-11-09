/**
 * Instagram Vercel Blob upload preflight/executor from an instagram_blob_upload_request_v1 JSON (no-execute).
 *
 * task: instagram-blob-upload-from-request-executor-no-execute-v1
 *
 * Usage:
 *   node scripts/prepare-instagram-blob-upload-from-request.mjs \
 *     --request <instagram-blob-upload-request.json> \
 *     --out-dir <outside-repo path> \
 *     [--dry-run]
 *   node scripts/prepare-instagram-blob-upload-from-request.mjs --request <path> --out-dir <path> --run
 *
 * Reads an instagram-blob-upload-request.json (already produced by
 * scripts/plan-instagram-blob-upload-from-content-unit.mjs), re-verifies that the source mp4 still
 * matches the recorded size + SHA-256 + deterministic pathname + put option plan, and writes a
 * no-execute readiness/result JSON describing the exact future approved Vercel Blob put() contract.
 *
 * This script NEVER uploads anything and never touches secrets:
 * - No @vercel/blob import, no put()/list()/head()/del()/copy() call.
 * - No fetch/axios/network/API call of any kind.
 * - No process.env access, no .env/.env.local read.
 * - No ffmpeg/ffprobe — the mp4 is only opened read-only to re-hash its bytes.
 * - No child_process/spawnSync of any kind in this file.
 * - Does not mutate the request JSON or the source mp4.
 * - --out-dir must be outside the repo root and must not touch .money-shorts-local.
 *
 * --run is a future-slice flag but is refused in this slice — it must NOT perform an upload here.
 * It fails closed BEFORE request validation or any output write, with status
 * INSTAGRAM_BLOB_UPLOAD_RUN_DISABLED_THIS_SLICE, and performs no Blob SDK import/call and no
 * env/secret access.
 *
 * Output:
 *   ${outDir}\instagram-blob-upload-preflight.json
 *
 * Contract note (field names): the request JSON produced by the planner uses `schemaVersion` and
 * `variantId` (mirroring lib/instagram-blob-media.ts). This executor validates exactly those field
 * names — they are the source of truth for the request contract.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import {
  UPLOAD_REQUEST_SCHEMA_VERSION,
  INSTAGRAM_BLOB_PLATFORM,
  INSTAGRAM_BLOB_VARIANT_ID,
  INSTAGRAM_BLOB_PATH_PREFIX,
  INSTAGRAM_BLOB_CONTENT_TYPE,
  INSTAGRAM_BLOB_UPLOAD_APPROVAL_TOKEN,
} from "./plan-instagram-blob-upload-from-content-unit.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");

export const PREFLIGHT_SCHEMA_VERSION = "instagram_blob_upload_preflight_v1";
export const RUN_DISABLED_STATUS = "INSTAGRAM_BLOB_UPLOAD_RUN_DISABLED_THIS_SLICE";

/**
 * 절대경로가 repo root "자체"이거나 repo root 하위인지 판정한다.
 * `outDirAbs.startsWith(REPO_ROOT + sep)`만으로는 --out-dir이 정확히 REPO_ROOT와 같은 경우
 * (예: `--out-dir .`)를 놓친다 — 그 경우 startsWith가 false가 되어 repo root에 직접 파일이
 * 써진다. 이 helper는 그 두 경우를 모두 명시적으로 막는다.
 */
export function isRepoRootOrInside(absPath, repoRoot) {
  return absPath === repoRoot || absPath.startsWith(repoRoot + "\\") || absPath.startsWith(repoRoot + "/");
}

/** 승인된 put option plan 계약 — request의 putOptions는 이와 정확히 같아야 한다. */
const EXPECTED_PUT_OPTIONS = {
  access: "public",
  addRandomSuffix: false,
  allowOverwrite: false,
  multipart: true,
  contentType: INSTAGRAM_BLOB_CONTENT_TYPE,
};

// ── CLI args ──────────────────────────────────────────────────────────────────
function getArg(args, name) {
  const idx = args.indexOf(name);
  if (idx !== -1 && args[idx + 1]) return args[idx + 1];
  return null;
}
function hasFlag(args, name) {
  return args.includes(name);
}

function printUsage() {
  console.log(
    [
      "Prepare a no-execute Instagram Vercel Blob upload readiness JSON from an upload request.",
      "",
      "Usage:",
      "  node scripts/prepare-instagram-blob-upload-from-request.mjs" +
        " --request <instagram-blob-upload-request.json>" +
        " --out-dir <outside-repo path>" +
        " [--dry-run]",
      "  node scripts/prepare-instagram-blob-upload-from-request.mjs --request <path> --out-dir <path> --run",
      "",
      "Reads only the request JSON already produced by",
      "scripts/plan-instagram-blob-upload-from-content-unit.mjs, re-verifies source size/hash/pathname,",
      "and writes instagram-blob-upload-preflight.json. Never calls @vercel/blob, never uploads, never",
      "touches env/network/API. --out-dir must be outside the repo root. --run is refused this slice.",
    ].join("\n"),
  );
}

/** mp4를 read-only로 읽어 SHA-256을 계산한다. 파일을 쓰거나 변형하지 않는다. */
function sha256OfFileReadOnly(filePath) {
  const buf = readFileSync(filePath);
  return createHash("sha256").update(buf).digest("hex");
}

/**
 * request JSON(instagram_blob_upload_request_v1)을 읽어 fail-closed로 전면 검증한다.
 * 계약 필드 + 현재 source mp4의 size/SHA-256/deterministic pathname/put options 일치까지 확인한다.
 * ffmpeg/ffprobe는 실행하지 않으며, source mp4는 해시 계산을 위해 read-only로만 연다.
 */
function readAndValidateRequest(requestPath) {
  if (!existsSync(requestPath)) {
    return { ok: false, reason: "request_file_not_found", request: null };
  }
  let request;
  try {
    request = JSON.parse(readFileSync(requestPath, "utf-8"));
  } catch (e) {
    return { ok: false, reason: `request_json_parse_failed: ${String(e?.message || e)}`, request: null };
  }

  // ── 계약 필드 검증 ──────────────────────────────────────────────────────────
  if (request?.schemaVersion !== UPLOAD_REQUEST_SCHEMA_VERSION) {
    return { ok: false, reason: `request_unrecognized_schema_version: ${request?.schemaVersion}`, request };
  }
  if (request?.requiresApprovalToken !== INSTAGRAM_BLOB_UPLOAD_APPROVAL_TOKEN) {
    return { ok: false, reason: `request_requiresApprovalToken_mismatch: ${request?.requiresApprovalToken}`, request };
  }
  if (request?.uploadPerformed !== false) {
    return { ok: false, reason: `request_uploadPerformed_not_false: ${request?.uploadPerformed}`, request };
  }
  if (request?.willUpload !== false) {
    return { ok: false, reason: `request_willUpload_not_false: ${request?.willUpload}`, request };
  }
  if (request?.platform !== INSTAGRAM_BLOB_PLATFORM) {
    return { ok: false, reason: `request_platform_not_instagram: ${request?.platform}`, request };
  }
  if (request?.variantId !== INSTAGRAM_BLOB_VARIANT_ID) {
    return { ok: false, reason: `request_variantId_mismatch: ${request?.variantId}`, request };
  }
  if (request?.contentType !== INSTAGRAM_BLOB_CONTENT_TYPE) {
    return { ok: false, reason: `request_contentType_not_video_mp4: ${request?.contentType}`, request };
  }
  if (typeof request?.contentId !== "string" || request.contentId.trim() === "") {
    return { ok: false, reason: "request_contentId_missing", request };
  }
  if (typeof request?.version !== "string" || request.version.trim() === "") {
    return { ok: false, reason: "request_version_missing", request };
  }

  // ── put option plan 검증 ────────────────────────────────────────────────────
  const putOptions = request?.putOptions ?? {};
  const putOptionsMatch =
    putOptions.access === EXPECTED_PUT_OPTIONS.access &&
    putOptions.addRandomSuffix === EXPECTED_PUT_OPTIONS.addRandomSuffix &&
    putOptions.allowOverwrite === EXPECTED_PUT_OPTIONS.allowOverwrite &&
    putOptions.multipart === EXPECTED_PUT_OPTIONS.multipart &&
    putOptions.contentType === EXPECTED_PUT_OPTIONS.contentType;
  if (!putOptionsMatch) {
    return { ok: false, reason: "request_putOptions_mismatch", request };
  }

  // ── sha256 형식 검증 ────────────────────────────────────────────────────────
  const sha256 = request?.sha256;
  if (typeof sha256 !== "string" || !/^[0-9a-f]{64}$/.test(sha256)) {
    return { ok: false, reason: "request_sha256_missing_or_invalid", request };
  }
  if (request?.sha256_12 !== sha256.slice(0, 12)) {
    return { ok: false, reason: `request_sha256_12_mismatch_with_sha256: ${request?.sha256_12}`, request };
  }

  // ── pathname 검증(deterministic 계약과 정확히 일치) ─────────────────────────
  const expectedPathname = `${INSTAGRAM_BLOB_PATH_PREFIX}/${request.contentId}/${INSTAGRAM_BLOB_VARIANT_ID}/${request.version}/${sha256.slice(0, 12)}.mp4`;
  if (request?.pathname !== expectedPathname) {
    return { ok: false, reason: `request_pathname_mismatch: expected ${expectedPathname}, got ${request?.pathname}`, request };
  }

  // ── source mp4 검증(존재/확장자/현재 size/현재 SHA-256 일치) ────────────────
  const sourcePath = request?.sourcePath;
  if (typeof sourcePath !== "string" || sourcePath.trim() === "" || !sourcePath.toLowerCase().endsWith(".mp4")) {
    return { ok: false, reason: "request_sourcePath_missing_or_not_mp4", request };
  }
  if (!existsSync(sourcePath)) {
    return { ok: false, reason: "request_sourcePath_file_not_found", request };
  }
  const currentSize = statSync(sourcePath).size;
  if (typeof request?.sourceSizeBytes !== "number" || request.sourceSizeBytes <= 0) {
    return { ok: false, reason: "request_sourceSizeBytes_missing_or_invalid", request };
  }
  if (currentSize !== request.sourceSizeBytes) {
    return { ok: false, reason: `source_size_mismatch: current ${currentSize} !== request ${request.sourceSizeBytes}`, request };
  }
  const currentSha256 = sha256OfFileReadOnly(sourcePath);
  if (currentSha256 !== sha256) {
    return { ok: false, reason: "source_sha256_mismatch: current file hash differs from request sha256", request };
  }
  if (currentSha256.slice(0, 12) !== request.sha256_12) {
    return { ok: false, reason: "source_sha256_12_mismatch: current file hash prefix differs from request sha256_12", request };
  }

  return { ok: true, reason: null, request, currentSize, currentSha256 };
}

/**
 * 순수 executor(no-execute): request JSON → upload readiness/result JSON.
 * 파일 IO는 request 읽기 + source mp4 read-only 해시 + 결과 JSON 쓰기만 수행한다.
 * @vercel/blob put()/list()/head()/del()/copy()를 호출하지 않고, 네트워크/env에 접근하지 않는다.
 * request JSON과 source mp4는 절대 mutate하지 않는다(읽기 전용).
 */
export function prepareInstagramBlobUploadFromRequest({ requestPath }) {
  const validation = readAndValidateRequest(requestPath);
  if (!validation.ok) {
    return { ok: false, reason: validation.reason, preflight: null };
  }
  const request = validation.request;

  const futureApprovedCommand =
    `node scripts/prepare-instagram-blob-upload-from-request.mjs --request "${resolve(requestPath)}"` +
    ` --out-dir <outside-repo path> --run   # (requires a future approved slice that enables --run with ${INSTAGRAM_BLOB_UPLOAD_APPROVAL_TOKEN})`;

  const preflight = {
    schemaVersion: PREFLIGHT_SCHEMA_VERSION,
    _note:
      "Generated by scripts/prepare-instagram-blob-upload-from-request.mjs. No @vercel/blob upload was " +
      "performed — this is a no-execute readiness proof only. It re-verifies that the source mp4 still " +
      "matches the request's recorded size + SHA-256 + deterministic pathname + put option plan.",
    mode: "no_execute",
    noLive: true,
    envSecretValuesAccessedThisRun: false,
    executed: false,
    blobUploadPerformed: false,
    willUpload: false,
    runStatus: RUN_DISABLED_STATUS,
    requiresApprovalToken: INSTAGRAM_BLOB_UPLOAD_APPROVAL_TOKEN,
    sourceRequestPath: resolve(requestPath),
    sourceRequestSchemaVersion: request.schemaVersion,
    contentId: request.contentId,
    version: request.version,
    platform: request.platform,
    variantId: request.variantId,
    contentType: request.contentType,
    sourcePath: resolve(request.sourcePath),
    sourceSizeBytes: request.sourceSizeBytes,
    sourceSizeReverified: validation.currentSize,
    sourceSizeMatches: validation.currentSize === request.sourceSizeBytes,
    sha256: request.sha256,
    sha256_12: request.sha256_12,
    sha256Reverified: validation.currentSha256,
    sha256Matches: validation.currentSha256 === request.sha256,
    pathname: request.pathname,
    pathnameMatchesDeterministicContract: true,
    putOptions: {
      access: EXPECTED_PUT_OPTIONS.access,
      addRandomSuffix: EXPECTED_PUT_OPTIONS.addRandomSuffix,
      allowOverwrite: EXPECTED_PUT_OPTIONS.allowOverwrite,
      multipart: EXPECTED_PUT_OPTIONS.multipart,
      contentType: EXPECTED_PUT_OPTIONS.contentType,
    },
    putOptionsMatchApprovedContract: true,
    readyForFutureApprovedUpload: true,
    futureApprovedCommand,
    sideEffectCounters: {
      blobUploadCount: 0,
      blobListCount: 0,
      blobHeadCount: 0,
      blobDeleteCount: 0,
      blobCopyCount: 0,
      publicUrlLivenessCheckCount: 0,
      apiCallCount: 0,
      envSecretReadCount: 0,
      deployCount: 0,
      mediaGenerationCount: 0,
      requestMutationCount: 0,
    },
    riskNotes: [
      "no-execute: no @vercel/blob call, no upload, no public-URL liveness/HEAD, no network/API call, " +
        "no env/secret read performed by this executor.",
      "sourcePath was opened read-only to re-compute sha256 — the file was not modified or moved.",
      "The request JSON passed via --request was read-only; this executor never mutates it.",
      "--run is disabled in this slice — actual Blob upload requires a separate approved slice that enables " +
        `--run with approval token ${INSTAGRAM_BLOB_UPLOAD_APPROVAL_TOKEN}.`,
      "readyForFutureApprovedUpload:true means the request contract + current source still match; it is a " +
        "readiness proof, NOT evidence that an upload occurred (none did).",
    ],
  };

  return { ok: true, reason: null, preflight };
}

// ── CLI entrypoint (skipped when imported for tests) ────────────────────────────
const isMainModule = process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));
if (isMainModule) {
  const args = process.argv.slice(2);
  const requestPath = getArg(args, "--request");
  const outDir = getArg(args, "--out-dir");
  const isRun = hasFlag(args, "--run");

  // ── --run은 request 검증/출력 쓰기 이전에 fail-closed로 막는다(부작용 0). ──
  if (isRun) {
    console.error(
      `ABORT: --run is not executable in this slice. status: ${RUN_DISABLED_STATUS}\n` +
        `Actual Vercel Blob upload requires a separate approved slice with token ${INSTAGRAM_BLOB_UPLOAD_APPROVAL_TOKEN}.`,
    );
    process.exit(1);
  }

  if (!requestPath || !outDir) {
    printUsage();
    process.exit(1);
  }

  const outDirAbs = resolve(outDir);
  if (isRepoRootOrInside(outDirAbs, REPO_ROOT)) {
    console.error(`ABORT: --out-dir must be outside repo root.\n  repo: ${REPO_ROOT}\n  out-dir: ${outDirAbs}`);
    process.exit(1);
  }
  if ([requestPath, outDirAbs].some((p) => typeof p === "string" && p.includes(".money-shorts-local"))) {
    console.error("ABORT: .money-shorts-local access forbidden.");
    process.exit(1);
  }

  console.log("\n╔══════════════════════════════════════════════════════════════╗");
  console.log("║   Prepare Instagram Blob Upload From Request (no-execute)      ║");
  console.log("╚══════════════════════════════════════════════════════════════╝\n");

  const result = prepareInstagramBlobUploadFromRequest({ requestPath });

  if (!result.ok) {
    console.error(`ABORT: ${result.reason}`);
    process.exit(1);
  }

  mkdirSync(outDirAbs, { recursive: true });
  const preflightPath = join(outDirAbs, "instagram-blob-upload-preflight.json");
  writeFileSync(preflightPath, JSON.stringify(result.preflight, null, 2), "utf-8");

  console.log(`  contentId:                    ${result.preflight.contentId}`);
  console.log(`  version:                      ${result.preflight.version}`);
  console.log(`  sourcePath:                   ${result.preflight.sourcePath}`);
  console.log(`  sourceSizeMatches:            ${result.preflight.sourceSizeMatches}`);
  console.log(`  sha256Matches:                ${result.preflight.sha256Matches}`);
  console.log(`  pathname:                     ${result.preflight.pathname}`);
  console.log(`  putOptionsMatchApprovedContract: ${result.preflight.putOptionsMatchApprovedContract}`);
  console.log(`  readyForFutureApprovedUpload: ${result.preflight.readyForFutureApprovedUpload}`);
  console.log(`  runStatus:                    ${result.preflight.runStatus}`);
  console.log(`\n  preflight: ${preflightPath}`);
  console.log("");

  process.exit(0);
}
