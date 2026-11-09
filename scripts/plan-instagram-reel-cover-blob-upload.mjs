/**
 * Planner: 릴스 커버 이미지 1장 → Instagram Vercel Blob upload request (no-upload).
 *
 * task: instagram-reel-cover-blob-upload-plan-no-upload-v1
 *
 * 기존 mp4 전용 계약(plan-instagram-blob-upload-from-content-unit.mjs)이나 카드뉴스
 * 캐러셀 계약(plan-instagram-cardnews-blob-upload.mjs)과 완전히 분리된, 릴스 커버
 * 전용 계약이다. 영상/카드뉴스 스크립트는 전혀 건드리지 않는다. 카드뉴스 플래너와
 * 같은 패턴(계획→준비/재검증→승인 실행 3단계, no-log 토큰 처리)을 그대로 따르되
 * 대상이 1장뿐이라는 점만 다르다.
 *
 * Usage:
 *   node scripts/plan-instagram-reel-cover-blob-upload.mjs \
 *     --cover-image <썸네일/커버 png 경로> \
 *     --content-id <geumbaksa-ep7-deposit-insurance-01> \
 *     --version v1 \
 *     --out-dir <outside-repo path>
 *
 * 이 스크립트는 절대 업로드하지 않는다:
 * - @vercel/blob import 없음, put()/list()/head()/del() 호출 없음.
 * - fetch/axios/network/API 호출 없음.
 * - process.env 접근 없음, .env/.env.local 읽기 없음.
 * - PNG 파일은 SHA-256 계산을 위해 read-only로만 연다.
 * - --out-dir는 repo 밖이어야 하고 .money-shorts-local 접근 금지.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");

export const REEL_COVER_UPLOAD_REQUEST_SCHEMA_VERSION = "instagram_reel_cover_blob_upload_request_v1";

// ── Blob contract constants (커버 이미지 전용, mp4/카드뉴스 계약과 완전히 분리) ──
export const INSTAGRAM_REEL_COVER_BLOB_PLATFORM = "instagram";
export const INSTAGRAM_REEL_COVER_BLOB_VARIANT_ID = "instagram_reel_cover_1080x1920";
export const INSTAGRAM_REEL_COVER_BLOB_PATH_PREFIX = "instagram/reel-cover";
export const INSTAGRAM_REEL_COVER_BLOB_CONTENT_TYPE_PNG = "image/png";
export const INSTAGRAM_REEL_COVER_BLOB_CONTENT_TYPE_JPEG = "image/jpeg";
export const INSTAGRAM_REEL_COVER_BLOB_SIZE_CAP_BYTES = 8 * 1024 * 1024; // Instagram 이미지 상한보다 여유
export const INSTAGRAM_REEL_COVER_BLOB_UPLOAD_APPROVAL_TOKEN = "APPROVE_INSTAGRAM_REEL_COVER_BLOB_UPLOAD_FROM_REQUEST_ONCE";

function getArg(args, name) {
  const idx = args.indexOf(name);
  if (idx !== -1 && args[idx + 1]) return args[idx + 1];
  return null;
}

function printUsage() {
  console.log(
    [
      "Plan an Instagram reel-cover Vercel Blob upload request (no-upload).",
      "",
      "Usage:",
      "  node scripts/plan-instagram-reel-cover-blob-upload.mjs" +
        " --cover-image <png/jpg path>" +
        " --content-id <geumbaksa-ep7-deposit-insurance-01>" +
        " --version v1" +
        " --out-dir <outside-repo path>",
      "",
      "Never calls @vercel/blob, never uploads, never touches env/network/API.",
    ].join("\n"),
  );
}

function contentTypeForExt(filePath) {
  const lower = filePath.toLowerCase();
  if (lower.endsWith(".png")) return INSTAGRAM_REEL_COVER_BLOB_CONTENT_TYPE_PNG;
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return INSTAGRAM_REEL_COVER_BLOB_CONTENT_TYPE_JPEG;
  return null;
}

export function buildReelCoverBlobPathname({ contentId, version, sha256, ext }) {
  const sha256_12 = sha256.slice(0, 12);
  return `${INSTAGRAM_REEL_COVER_BLOB_PATH_PREFIX}/${contentId}/${INSTAGRAM_REEL_COVER_BLOB_VARIANT_ID}/${version}/${sha256_12}${ext}`;
}

export function buildReelCoverBlobPutOptionPlan(contentType) {
  return {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: false,
    multipart: false,
    contentType,
  };
}

function sha256OfFileReadOnly(filePath) {
  const buf = readFileSync(filePath);
  return createHash("sha256").update(buf).digest("hex");
}

/**
 * 커버 이미지 1장을 계획한다(실제 업로드 없음). 카드뉴스 플래너와 동일한 검증
 * 패턴(크기 상한, sha256, deterministic pathname)을 1장짜리로 단순화해 적용한다.
 */
export function planReelCoverBlobUpload({ coverImagePath, contentId, version }) {
  if (!existsSync(coverImagePath)) {
    return { ok: false, reason: "cover_image_not_found" };
  }
  const contentType = contentTypeForExt(coverImagePath);
  if (!contentType) {
    return { ok: false, reason: "cover_image_must_be_png_or_jpg" };
  }
  const ext = coverImagePath.toLowerCase().endsWith(".png") ? ".png" : ".jpg";
  const sourceSizeBytes = statSync(coverImagePath).size;
  if (sourceSizeBytes > INSTAGRAM_REEL_COVER_BLOB_SIZE_CAP_BYTES) {
    return { ok: false, reason: `cover_image_too_large: ${sourceSizeBytes} > cap ${INSTAGRAM_REEL_COVER_BLOB_SIZE_CAP_BYTES}` };
  }
  const sha256 = sha256OfFileReadOnly(coverImagePath);
  const pathname = buildReelCoverBlobPathname({ contentId, version, sha256, ext });
  const putOptions = buildReelCoverBlobPutOptionPlan(contentType);

  const request = {
    schemaVersion: REEL_COVER_UPLOAD_REQUEST_SCHEMA_VERSION,
    requiresApprovalToken: INSTAGRAM_REEL_COVER_BLOB_UPLOAD_APPROVAL_TOKEN,
    uploadPerformed: false,
    willUpload: false,
    platform: INSTAGRAM_REEL_COVER_BLOB_PLATFORM,
    variantId: INSTAGRAM_REEL_COVER_BLOB_VARIANT_ID,
    contentType,
    contentId,
    version,
    sourcePath: resolve(coverImagePath),
    sourceSizeBytes,
    sha256,
    sha256_12: sha256.slice(0, 12),
    pathname,
    putOptions,
  };

  return { ok: true, reason: null, request };
}

// ── CLI entrypoint ───────────────────────────────────────────────────────────────
const isMainModule = process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));
if (isMainModule) {
  const args = process.argv.slice(2);
  const coverImagePath = getArg(args, "--cover-image");
  const contentId = getArg(args, "--content-id");
  const version = getArg(args, "--version") || "v1";
  const outDir = getArg(args, "--out-dir");

  if (!coverImagePath || !contentId || !outDir) {
    printUsage();
    process.exit(1);
  }

  const outDirAbs = resolve(outDir);
  if (outDirAbs === REPO_ROOT || outDirAbs.startsWith(REPO_ROOT + "\\") || outDirAbs.startsWith(REPO_ROOT + "/")) {
    console.error(`ABORT: --out-dir must be outside repo root.\n  repo: ${REPO_ROOT}\n  out-dir: ${outDirAbs}`);
    process.exit(1);
  }
  if ([coverImagePath, outDirAbs].some((p) => p.includes(".money-shorts-local"))) {
    console.error("ABORT: .money-shorts-local access forbidden.");
    process.exit(1);
  }

  console.log("\n╔══════════════════════════════════════════════════════════════╗");
  console.log("║   Plan Instagram Reel Cover Blob Upload (no-upload)             ║");
  console.log("╚══════════════════════════════════════════════════════════════╝\n");

  let result;
  try {
    result = planReelCoverBlobUpload({ coverImagePath, contentId, version });
  } catch (err) {
    console.error(`ABORT: ${err.message}`);
    process.exit(1);
  }
  if (!result.ok) {
    console.error(`ABORT: ${result.reason}`);
    process.exit(1);
  }

  mkdirSync(outDirAbs, { recursive: true });
  const requestPath = join(outDirAbs, "instagram-reel-cover-blob-upload-request.json");
  writeFileSync(requestPath, JSON.stringify(result.request, null, 2), "utf-8");

  console.log(`  contentId:   ${result.request.contentId}`);
  console.log(`  sourcePath:  ${result.request.sourcePath}`);
  console.log(`  pathname:    ${result.request.pathname}`);
  console.log(`  sizeKB:      ${Math.round(result.request.sourceSizeBytes / 1024)}`);
  console.log(`\n  request: ${requestPath}`);
  console.log("");

  process.exit(0);
}
