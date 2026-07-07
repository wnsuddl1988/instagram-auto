/**
 * Planner: dual_platform_content_unit_v1 manifest → Instagram Vercel Blob upload request (no-upload).
 *
 * task: instagram-blob-upload-plan-from-content-unit-no-upload-v1
 *
 * Usage:
 *   node scripts/plan-instagram-blob-upload-from-content-unit.mjs \
 *     --content-unit <dual_platform_content_unit_v1 manifest> \
 *     --out-dir <outside-repo path>
 *
 * Reads a content unit manifest's instagramSourcePath, computes its SHA-256 read-only,
 * and builds the deterministic Blob pathname + put() option plan using the existing
 * no-upload contract in lib/instagram-blob-media.ts (mirrored here in plain JS so this
 * script has no TypeScript/build dependency). Writes a request JSON under --out-dir so a
 * later approved Blob upload step has deterministic input — no manual pathname work.
 *
 * This script NEVER uploads anything:
 * - No @vercel/blob import, no put()/list()/head()/del() call.
 * - No fetch/axios/network/API call of any kind.
 * - No process.env access, no .env/.env.local read.
 * - No ffmpeg/ffprobe — the mp4 is only opened read-only to hash its bytes.
 * - Does not mutate the content unit manifest.
 * - --out-dir must be outside the repo root and must not touch .money-shorts-local.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");

export const CONTENT_UNIT_MANIFEST_SCHEMA_VERSION = "dual_platform_content_unit_v1";
export const UPLOAD_REQUEST_SCHEMA_VERSION = "instagram_blob_upload_request_v1";

// ── Blob contract constants (mirrors lib/instagram-blob-media.ts) ───────────────
export const INSTAGRAM_BLOB_PLATFORM = "instagram";
export const INSTAGRAM_BLOB_VARIANT_ID = "instagram_reels_full_frame_1080x1920";
export const INSTAGRAM_BLOB_PATH_PREFIX = "instagram/reels";
export const INSTAGRAM_BLOB_CONTENT_TYPE = "video/mp4";
export const INSTAGRAM_BLOB_SIZE_CAP_BYTES = 35 * 1024 * 1024;
export const INSTAGRAM_BLOB_UPLOAD_APPROVAL_TOKEN = "APPROVE_VERCEL_BLOB_OBJECT_UPLOAD_TEST";

// ── CLI args ──────────────────────────────────────────────────────────────────
function getArg(args, name) {
  const idx = args.indexOf(name);
  if (idx !== -1 && args[idx + 1]) return args[idx + 1];
  return null;
}

function printUsage() {
  console.log(
    [
      "Plan an Instagram Vercel Blob upload request from a content unit manifest (no-upload).",
      "",
      "Usage:",
      "  node scripts/plan-instagram-blob-upload-from-content-unit.mjs" +
        " --content-unit <dual_platform_content_unit_v1 manifest>" +
        " --out-dir <outside-repo path>",
      "",
      "Reads instagramSourcePath from the content unit manifest, hashes it read-only (SHA-256),",
      "and writes instagram-blob-upload-request.json under --out-dir. Never calls @vercel/blob,",
      "never uploads, never touches env/network/API. --out-dir must be outside the repo root.",
    ].join("\n"),
  );
}

/** deterministic immutable pathname: instagram/reels/{contentId}/{variantId}/{version}/{sha256_12}.mp4 */
export function buildInstagramBlobPathname({ contentId, version, sha256 }) {
  const sha256_12 = sha256.slice(0, 12);
  return `${INSTAGRAM_BLOB_PATH_PREFIX}/${contentId}/${INSTAGRAM_BLOB_VARIANT_ID}/${version}/${sha256_12}.mp4`;
}

/** put()에 넘길 고정 옵션 plan — 실제 put()은 이 스크립트에서 절대 호출하지 않는다. */
export function buildInstagramBlobPutOptionPlan() {
  return {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: false,
    multipart: true,
    contentType: INSTAGRAM_BLOB_CONTENT_TYPE,
  };
}

/** content unit manifest JSON을 읽고 fail-closed로 검증한다. */
function readAndValidateContentUnit(contentUnitPath) {
  if (!existsSync(contentUnitPath)) {
    return { ok: false, reason: "content_unit_file_not_found", manifest: null };
  }
  let manifest;
  try {
    manifest = JSON.parse(readFileSync(contentUnitPath, "utf-8"));
  } catch (e) {
    return { ok: false, reason: `content_unit_json_parse_failed: ${String(e?.message || e)}`, manifest: null };
  }
  if (manifest?.schemaVersion !== CONTENT_UNIT_MANIFEST_SCHEMA_VERSION) {
    return { ok: false, reason: `content_unit_unrecognized_schema_version: ${manifest?.schemaVersion}`, manifest: null };
  }
  if (typeof manifest?.contentId !== "string" || manifest.contentId.trim() === "") {
    return { ok: false, reason: "content_unit_contentId_missing", manifest: null };
  }
  if (typeof manifest?.version !== "string" || manifest.version.trim() === "") {
    return { ok: false, reason: "content_unit_version_missing", manifest: null };
  }
  const instagramSourcePath = manifest?.instagramSourcePath;
  if (typeof instagramSourcePath !== "string" || instagramSourcePath.trim() === "" || !instagramSourcePath.toLowerCase().endsWith(".mp4")) {
    return { ok: false, reason: "content_unit_instagramSourcePath_missing_or_not_mp4", manifest: null };
  }
  if (!existsSync(instagramSourcePath)) {
    return { ok: false, reason: "content_unit_instagramSourcePath_file_not_found", manifest: null };
  }
  return { ok: true, reason: null, manifest };
}

/** mp4를 read-only로 읽어 SHA-256을 계산한다. 파일을 쓰거나 변형하지 않는다. */
function sha256OfFileReadOnly(filePath) {
  const buf = readFileSync(filePath);
  return createHash("sha256").update(buf).digest("hex");
}

/**
 * 순수 빌더: content unit manifest → Instagram Blob upload request plan.
 * 파일 IO는 manifest 읽기 + source mp4 읽기(해시용) + 결과 JSON 쓰기만 수행한다.
 * @vercel/blob put()/list()/head()/del()을 호출하지 않고, 네트워크/env에 접근하지 않는다.
 */
export function planInstagramBlobUploadFromContentUnit({ contentUnitPath }) {
  const validation = readAndValidateContentUnit(contentUnitPath);
  if (!validation.ok) {
    return { ok: false, reason: validation.reason, request: null };
  }
  const manifest = validation.manifest;
  const instagramSourcePath = manifest.instagramSourcePath;

  const stat = statSync(instagramSourcePath);
  const sizeBytes = stat.size;
  if (!Number.isInteger(sizeBytes) || sizeBytes <= 0) {
    return { ok: false, reason: "instagramSourcePath_size_invalid", request: null };
  }
  if (sizeBytes > INSTAGRAM_BLOB_SIZE_CAP_BYTES) {
    return { ok: false, reason: `instagramSourcePath_size_exceeds_cap: ${sizeBytes} > ${INSTAGRAM_BLOB_SIZE_CAP_BYTES}`, request: null };
  }

  const sha256 = sha256OfFileReadOnly(instagramSourcePath);
  const sha256_12 = sha256.slice(0, 12);
  const pathname = buildInstagramBlobPathname({ contentId: manifest.contentId, version: manifest.version, sha256 });
  const putOptions = buildInstagramBlobPutOptionPlan();

  const request = {
    schemaVersion: UPLOAD_REQUEST_SCHEMA_VERSION,
    _note:
      "Generated by scripts/plan-instagram-blob-upload-from-content-unit.mjs. No @vercel/blob upload was " +
      "performed to build this file — this is a deterministic plan only, for a later approved upload step.",
    noLive: true,
    envSecretValuesAccessedThisRun: false,
    contentId: manifest.contentId,
    version: manifest.version,
    platform: INSTAGRAM_BLOB_PLATFORM,
    variantId: INSTAGRAM_BLOB_VARIANT_ID,
    sourcePath: resolve(instagramSourcePath),
    sourceSizeBytes: sizeBytes,
    sourceSizeCapBytes: INSTAGRAM_BLOB_SIZE_CAP_BYTES,
    sha256,
    sha256_12,
    pathname,
    contentType: INSTAGRAM_BLOB_CONTENT_TYPE,
    putOptions,
    uploadPerformed: false,
    willUpload: false,
    requiresApprovalToken: INSTAGRAM_BLOB_UPLOAD_APPROVAL_TOKEN,
    sideEffectCounters: {
      blobUploadCount: 0,
      blobListCount: 0,
      blobHeadCount: 0,
      blobDeleteCount: 0,
      blobCopyCount: 0,
      apiCallCount: 0,
      envSecretReadCount: 0,
      deployCount: 0,
      mediaGenerationCount: 0,
    },
    riskNotes: [
      "no-live: no @vercel/blob call, no network/API call, no env/secret read performed by this planner.",
      "sourcePath was read read-only to compute sha256 — the file was not modified or moved.",
      "The content unit manifest itself was not mutated by this planner.",
      `Actual upload requires a separate approved step with approval token ${INSTAGRAM_BLOB_UPLOAD_APPROVAL_TOKEN}.`,
    ],
  };

  return { ok: true, reason: null, request };
}

// ── CLI entrypoint (skipped when imported for tests) ────────────────────────────
const isMainModule = process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));
if (isMainModule) {
  const args = process.argv.slice(2);
  const contentUnitPath = getArg(args, "--content-unit");
  const outDir = getArg(args, "--out-dir");

  if (!contentUnitPath || !outDir) {
    printUsage();
    process.exit(1);
  }

  const outDirAbs = resolve(outDir);
  if (outDirAbs.startsWith(REPO_ROOT + "\\") || outDirAbs.startsWith(REPO_ROOT + "/")) {
    console.error(`ABORT: --out-dir must be outside repo root.\n  repo: ${REPO_ROOT}\n  out-dir: ${outDirAbs}`);
    process.exit(1);
  }
  if ([contentUnitPath, outDirAbs].some((p) => typeof p === "string" && p.includes(".money-shorts-local"))) {
    console.error("ABORT: .money-shorts-local access forbidden.");
    process.exit(1);
  }

  console.log("\n╔══════════════════════════════════════════════════════════════╗");
  console.log("║   Plan Instagram Blob Upload From Content Unit (no-upload)     ║");
  console.log("╚══════════════════════════════════════════════════════════════╝\n");

  const result = planInstagramBlobUploadFromContentUnit({ contentUnitPath });

  if (!result.ok) {
    console.error(`ABORT: ${result.reason}`);
    process.exit(1);
  }

  mkdirSync(outDirAbs, { recursive: true });
  const requestPath = join(outDirAbs, "instagram-blob-upload-request.json");
  writeFileSync(requestPath, JSON.stringify(result.request, null, 2), "utf-8");

  console.log(`  contentId:        ${result.request.contentId}`);
  console.log(`  version:          ${result.request.version}`);
  console.log(`  sourcePath:       ${result.request.sourcePath}`);
  console.log(`  sourceSizeBytes:  ${result.request.sourceSizeBytes}`);
  console.log(`  sha256_12:        ${result.request.sha256_12}`);
  console.log(`  pathname:         ${result.request.pathname}`);
  console.log(`  uploadPerformed:  ${result.request.uploadPerformed}`);
  console.log(`\n  request: ${requestPath}`);
  console.log("");

  process.exit(0);
}
