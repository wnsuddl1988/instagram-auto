/**
 * Planner: 카드뉴스 이미지 폴더 → Instagram Vercel Blob upload request 여러 개 (no-upload).
 *
 * task: instagram-cardnews-blob-upload-plan-no-upload-v1
 *
 * 기존 mp4 전용 계약(plan-instagram-blob-upload-from-content-unit.mjs)과 병행하는
 * PNG 이미지 전용 계약이다. 영상 스크립트는 전혀 건드리지 않는다.
 *
 * Usage:
 *   node scripts/plan-instagram-cardnews-blob-upload.mjs \
 *     --images-dir <카드뉴스 png 폴더> \
 *     --content-id <owl-cardnews-ep1> \
 *     --version v1 \
 *     --out-dir <outside-repo path>
 *
 * --images-dir 안의 *.png 파일을 파일명 알파벳 순으로 정렬해 순서를 정한다
 * (예: ep1_cover.png, ep1_body1.png, ep1_body2.png, ep1_closing.png).
 * 이 순서가 캐러셀에 올라가는 순서와 동일해야 하므로 파일명에 순번을 명시해야 한다.
 *
 * 이 스크립트는 절대 업로드하지 않는다:
 * - @vercel/blob import 없음, put()/list()/head()/del() 호출 없음.
 * - fetch/axios/network/API 호출 없음.
 * - process.env 접근 없음, .env/.env.local 읽기 없음.
 * - PNG 파일은 SHA-256 계산을 위해 read-only로만 연다.
 * - --out-dir는 repo 밖이어야 하고 .money-shorts-local 접근 금지.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");

export const CARDNEWS_UPLOAD_REQUEST_SCHEMA_VERSION = "instagram_cardnews_blob_upload_request_v1";

// ── Blob contract constants (이미지 전용, mp4 계약과 완전히 분리) ────────────────
export const INSTAGRAM_CARDNEWS_BLOB_PLATFORM = "instagram";
export const INSTAGRAM_CARDNEWS_BLOB_VARIANT_ID = "instagram_cardnews_carousel_1080x1350";
export const INSTAGRAM_CARDNEWS_BLOB_PATH_PREFIX = "instagram/cardnews";
export const INSTAGRAM_CARDNEWS_BLOB_CONTENT_TYPE = "image/png";
export const INSTAGRAM_CARDNEWS_BLOB_SIZE_CAP_BYTES = 8 * 1024 * 1024; // Instagram 이미지 상한(8MB)보다 여유
export const INSTAGRAM_CARDNEWS_BLOB_UPLOAD_APPROVAL_TOKEN = "APPROVE_INSTAGRAM_CARDNEWS_BLOB_UPLOAD_FROM_REQUEST_ONCE";

function getArg(args, name) {
  const idx = args.indexOf(name);
  if (idx !== -1 && args[idx + 1]) return args[idx + 1];
  return null;
}

function printUsage() {
  console.log(
    [
      "Plan Instagram Vercel Blob upload requests for a cardnews image folder (no-upload).",
      "",
      "Usage:",
      "  node scripts/plan-instagram-cardnews-blob-upload.mjs" +
        " --images-dir <folder with *.png>" +
        " --content-id <owl-cardnews-ep1>" +
        " --version v1" +
        " --out-dir <outside-repo path>",
      "",
      "Never calls @vercel/blob, never uploads, never touches env/network/API.",
    ].join("\n"),
  );
}

export function buildCardnewsBlobPathname({ contentId, version, sha256, slideIndex }) {
  const sha256_12 = sha256.slice(0, 12);
  const seq = String(slideIndex).padStart(2, "0");
  return `${INSTAGRAM_CARDNEWS_BLOB_PATH_PREFIX}/${contentId}/${INSTAGRAM_CARDNEWS_BLOB_VARIANT_ID}/${version}/${seq}-${sha256_12}.png`;
}

export function buildCardnewsBlobPutOptionPlan() {
  return {
    access: "public",
    addRandomSuffix: false,
    allowOverwrite: false,
    multipart: false,
    contentType: INSTAGRAM_CARDNEWS_BLOB_CONTENT_TYPE,
  };
}

function sha256OfFileReadOnly(filePath) {
  const buf = readFileSync(filePath);
  return createHash("sha256").update(buf).digest("hex");
}

/**
 * images-dir 안의 *.png를 알파벳 순 정렬해 캐러셀 순서를 확정하고, 각 파일마다
 * blob upload request 항목을 계획한다. 실제 업로드는 하지 않는다.
 */
export function planCardnewsBlobUpload({ imagesDir, contentId, version }) {
  if (!existsSync(imagesDir)) {
    return { ok: false, reason: "images_dir_not_found" };
  }
  const files = readdirSync(imagesDir)
    .filter((f) => f.toLowerCase().endsWith(".png"))
    .sort((a, b) => a.localeCompare(b, "en"));
  if (files.length === 0) {
    return { ok: false, reason: "no_png_files_in_images_dir" };
  }
  if (files.length > 10) {
    // Instagram 캐러셀은 최대 10장까지만 허용한다.
    return { ok: false, reason: `too_many_slides: ${files.length} > 10 (Instagram carousel limit)` };
  }

  const items = files.map((file, index) => {
    const sourcePath = join(imagesDir, file);
    const sourceSizeBytes = statSync(sourcePath).size;
    if (sourceSizeBytes > INSTAGRAM_CARDNEWS_BLOB_SIZE_CAP_BYTES) {
      throw new Error(`slide_too_large: ${file} is ${sourceSizeBytes} bytes > cap ${INSTAGRAM_CARDNEWS_BLOB_SIZE_CAP_BYTES}`);
    }
    const sha256 = sha256OfFileReadOnly(sourcePath);
    const slideIndex = index + 1;
    const pathname = buildCardnewsBlobPathname({ contentId, version, sha256, slideIndex });
    return {
      slideIndex,
      file,
      sourcePath: resolve(sourcePath),
      sourceSizeBytes,
      sha256,
      sha256_12: sha256.slice(0, 12),
      pathname,
    };
  });

  const request = {
    schemaVersion: CARDNEWS_UPLOAD_REQUEST_SCHEMA_VERSION,
    requiresApprovalToken: INSTAGRAM_CARDNEWS_BLOB_UPLOAD_APPROVAL_TOKEN,
    uploadPerformed: false,
    willUpload: false,
    platform: INSTAGRAM_CARDNEWS_BLOB_PLATFORM,
    variantId: INSTAGRAM_CARDNEWS_BLOB_VARIANT_ID,
    contentType: INSTAGRAM_CARDNEWS_BLOB_CONTENT_TYPE,
    contentId,
    version,
    imagesDir: resolve(imagesDir),
    slideCount: items.length,
    putOptions: buildCardnewsBlobPutOptionPlan(),
    slides: items,
  };

  return { ok: true, reason: null, request };
}

// ── CLI entrypoint ───────────────────────────────────────────────────────────────
const isMainModule = process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));
if (isMainModule) {
  const args = process.argv.slice(2);
  const imagesDir = getArg(args, "--images-dir");
  const contentId = getArg(args, "--content-id");
  const version = getArg(args, "--version") || "v1";
  const outDir = getArg(args, "--out-dir");

  if (!imagesDir || !contentId || !outDir) {
    printUsage();
    process.exit(1);
  }

  const outDirAbs = resolve(outDir);
  if (outDirAbs === REPO_ROOT || outDirAbs.startsWith(REPO_ROOT + "\\") || outDirAbs.startsWith(REPO_ROOT + "/")) {
    console.error(`ABORT: --out-dir must be outside repo root.\n  repo: ${REPO_ROOT}\n  out-dir: ${outDirAbs}`);
    process.exit(1);
  }
  if ([imagesDir, outDirAbs].some((p) => p.includes(".money-shorts-local"))) {
    console.error("ABORT: .money-shorts-local access forbidden.");
    process.exit(1);
  }

  console.log("\n╔══════════════════════════════════════════════════════════════╗");
  console.log("║   Plan Instagram Cardnews Blob Upload (no-upload)               ║");
  console.log("╚══════════════════════════════════════════════════════════════╝\n");

  let result;
  try {
    result = planCardnewsBlobUpload({ imagesDir, contentId, version });
  } catch (err) {
    console.error(`ABORT: ${err.message}`);
    process.exit(1);
  }
  if (!result.ok) {
    console.error(`ABORT: ${result.reason}`);
    process.exit(1);
  }

  mkdirSync(outDirAbs, { recursive: true });
  const requestPath = join(outDirAbs, "instagram-cardnews-blob-upload-request.json");
  writeFileSync(requestPath, JSON.stringify(result.request, null, 2), "utf-8");

  console.log(`  contentId:   ${result.request.contentId}`);
  console.log(`  slideCount:  ${result.request.slideCount}`);
  result.request.slides.forEach((s) => {
    console.log(`    [${s.slideIndex}] ${s.file} → ${s.pathname} (${Math.round(s.sourceSizeBytes / 1024)}KB)`);
  });
  console.log(`\n  request: ${requestPath}`);
  console.log("");

  process.exit(0);
}
