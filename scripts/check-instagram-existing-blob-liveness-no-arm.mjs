/**
 * Instagram existing Vercel Blob object — public URL liveness check (no-arm, read-only).
 *
 * task: instagram-existing-blob-liveness-and-content-unit-attach-no-arm-v1
 * Owner approval token: APPROVE_INSTAGRAM_EXISTING_BLOB_LIVENESS_AND_ATTACH_NO_ARM
 *
 * Usage:
 *   node scripts/check-instagram-existing-blob-liveness-no-arm.mjs \
 *     --pathname instagram/reels/t1_lifestyle_inflation/instagram_reels_full_frame_1080x1920/v3_2/54957450ac10.mp4 \
 *     --expected-size 20294549 \
 *     --out-dir <repo 밖>
 *
 * Confirms the public URL for an EXISTING Vercel Blob object and performs exactly one
 * unauthenticated public `HEAD` request against it — no `@vercel/blob` SDK import, no token,
 * no list/head/put/del/copy call, no GET/download.
 *
 * URL derivation is deterministic: this store's public base host
 * (https://7iq7vppwlaha2vuo.public.blob.vercel-storage.com) is already recorded as non-secret
 * public evidence in this repo (scripts/run-dual-platform-final-publish-orchestrator.mjs
 * BLOB_PUBLIC_URL_LIVENESS_EVIDENCE, produced by the prior completed
 * instagram-blob-url-liveness-no-arm-v1 task). The candidate URL is
 * `${PUBLIC_BLOB_BASE_URL}/${pathname}` — a plain string join, no SDK/API call is used to look it up.
 *
 * Fail-closed if:
 * - the HEAD response status is not 2xx/3xx
 * - content-type is missing, html/text, or not video/*
 * - content-length is present but does not equal --expected-size
 * - the resolved URL's path does not contain the exact expected pathname
 *
 * Secret safety: no process.env access, no .env/.env.local read, no @vercel/blob import.
 */

import { writeFileSync, mkdirSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { isRepoRootOrInside } from "./prepare-instagram-blob-upload-from-request.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");

export const LIVENESS_RESULT_SCHEMA_VERSION = "instagram_existing_blob_liveness_result_v1";

/**
 * 이 store의 public base host — secret이 아닌, 이미 orchestrator 코드/이전 완료된
 * instagram-blob-url-liveness-no-arm-v1 result.json에 기록된 non-secret public evidence.
 * 이 값을 바꾸는 것은 별도 승인된 재-provisioning task에서만 가능하다.
 */
export const PUBLIC_BLOB_BASE_URL = "https://7iq7vppwlaha2vuo.public.blob.vercel-storage.com";

const STATUS_OK = "LIVE_PUBLIC_URL_OK";
const STATUS_NON_2XX_3XX = "BLOCKED_HEAD_NON_2XX_3XX";
const STATUS_HTML_OR_TEXT = "BLOCKED_HEAD_HTML_OR_TEXT";
const STATUS_NOT_VIDEO = "BLOCKED_HEAD_NOT_VIDEO";
const STATUS_SIZE_MISMATCH = "BLOCKED_SIZE_MISMATCH";
const STATUS_PATH_MISMATCH = "BLOCKED_URL_PATH_MISMATCH";
const STATUS_HEAD_FAILED = "BLOCKED_HEAD_REQUEST_FAILED";
const STATUS_MISSING_ARGS = "BLOCKED_MISSING_ARGS";

function getArg(args, name) {
  const idx = args.indexOf(name);
  if (idx !== -1 && args[idx + 1]) return args[idx + 1];
  return null;
}

function printUsage() {
  console.log(
    [
      "Read-only public URL liveness check for an EXISTING Vercel Blob object (no SDK/token, HEAD only).",
      "",
      "Usage:",
      "  node scripts/check-instagram-existing-blob-liveness-no-arm.mjs" +
        " --pathname instagram/reels/t1_lifestyle_inflation/instagram_reels_full_frame_1080x1920/v3_2/54957450ac10.mp4" +
        " --expected-size 20294549" +
        " --out-dir <레포 밖 경로>",
    ].join("\n"),
  );
}

function baseResult({ pathname, expectedSize, url }) {
  return {
    schemaVersion: LIVENESS_RESULT_SCHEMA_VERSION,
    pathname,
    expectedContentLength: expectedSize,
    url,
    sideEffectCounters: {
      publicUrlLivenessCheckCount: 0,
      blobUploadCount: 0,
      blobListCount: 0,
      blobHeadCount: 0,
      blobDeleteCount: 0,
      blobCopyCount: 0,
      instagramApiCallCount: 0,
      youtubeApiCallCount: 0,
      deployCount: 0,
      mediaGenerationCount: 0,
    },
    envSecretAccess: {
      envLocalRead: false,
      envFileRead: false,
      processEnvAccessed: false,
      tokenValueRead: false,
      tokenValuePrinted: false,
    },
    vercelBlobSdkUsed: false,
  };
}

export async function checkInstagramExistingBlobLiveness({ pathname, expectedSize }) {
  if (!pathname || !Number.isFinite(expectedSize) || expectedSize <= 0) {
    return { ...baseResult({ pathname, expectedSize, url: null }), status: STATUS_MISSING_ARGS, headStatus: null, contentType: null, contentLength: null, urlPathMatchesExpectedPath: false, livenessOk: false };
  }

  const url = `${PUBLIC_BLOB_BASE_URL}/${pathname}`;
  const result = baseResult({ pathname, expectedSize, url });

  let urlPathMatchesExpectedPath = false;
  try {
    urlPathMatchesExpectedPath = new URL(url).pathname.replace(/^\//, "").endsWith(pathname);
  } catch {
    urlPathMatchesExpectedPath = false;
  }
  if (!urlPathMatchesExpectedPath) {
    return { ...result, status: STATUS_PATH_MISMATCH, headStatus: null, contentType: null, contentLength: null, urlPathMatchesExpectedPath, livenessOk: false };
  }

  // 정확히 1회 public HEAD 요청 — GET/download 없음, SDK/token 없음.
  let headStatus = null;
  let contentType = null;
  let contentLengthHeader = null;
  result.sideEffectCounters.publicUrlLivenessCheckCount = 1;
  try {
    const resp = await fetch(url, { method: "HEAD", redirect: "follow" });
    headStatus = resp.status;
    contentType = resp.headers.get("content-type");
    contentLengthHeader = resp.headers.get("content-length");
  } catch (e) {
    return {
      ...result,
      status: STATUS_HEAD_FAILED,
      headStatus: null,
      contentType: null,
      contentLength: null,
      urlPathMatchesExpectedPath,
      livenessOk: false,
      errorMessage: String(e?.message ?? e).slice(0, 300),
    };
  }

  const contentLength = contentLengthHeader != null && contentLengthHeader !== "" ? Number(contentLengthHeader) : null;
  const statusOk = typeof headStatus === "number" && headStatus >= 200 && headStatus < 400;
  const isHtmlOrText = typeof contentType === "string" && /(text\/html|text\/plain|application\/json)/i.test(contentType);
  const isVideo = typeof contentType === "string" && /^video\//i.test(contentType);

  let status;
  if (!statusOk) status = STATUS_NON_2XX_3XX;
  else if (isHtmlOrText) status = STATUS_HTML_OR_TEXT;
  else if (!isVideo) status = STATUS_NOT_VIDEO;
  else if (contentLength != null && contentLength !== expectedSize) status = STATUS_SIZE_MISMATCH;
  else status = STATUS_OK;

  return {
    ...result,
    status,
    headStatus,
    contentType,
    contentLength,
    urlPathMatchesExpectedPath,
    livenessOk: status === STATUS_OK,
  };
}

// ── CLI entrypoint ───────────────────────────────────────────────────────────────
const isMainModule = process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));
if (isMainModule) {
  const args = process.argv.slice(2);
  const pathname = getArg(args, "--pathname");
  const expectedSizeArg = getArg(args, "--expected-size");
  const outDirArg = getArg(args, "--out-dir");

  if (!pathname || !expectedSizeArg || !outDirArg) {
    printUsage();
    process.exit(1);
  }

  const outDirAbs = resolve(outDirArg);
  if (isRepoRootOrInside(outDirAbs, REPO_ROOT)) {
    console.error(`ABORT: --out-dir must be outside repo root.\n  repo: ${REPO_ROOT}\n  out-dir: ${outDirAbs}`);
    process.exit(1);
  }
  if (outDirAbs.includes(".money-shorts-local")) {
    console.error("ABORT: .money-shorts-local access forbidden.");
    process.exit(1);
  }

  const expectedSize = Number(expectedSizeArg);

  console.log("\n╔══════════════════════════════════════════════════════════════╗");
  console.log("║  Instagram Existing Blob Liveness Check — no-arm (HEAD only)   ║");
  console.log("╚══════════════════════════════════════════════════════════════╝\n");
  console.log(`  pathname:        ${pathname}`);
  console.log(`  expectedSize:    ${expectedSize}`);

  checkInstagramExistingBlobLiveness({ pathname, expectedSize }).then((result) => {
    console.log(`  url:             ${result.url}`);
    console.log(`  headStatus:      ${result.headStatus}`);
    console.log(`  contentType:     ${result.contentType}`);
    console.log(`  contentLength:   ${result.contentLength}`);
    console.log(`  status:          ${result.status}`);
    console.log(`  livenessOk:      ${result.livenessOk}\n`);

    mkdirSync(outDirAbs, { recursive: true });
    const resultPath = join(outDirAbs, "instagram-existing-blob-liveness-result.json");
    writeFileSync(resultPath, JSON.stringify(result, null, 2), "utf-8");
    console.log(`  result: ${resultPath}\n`);
    process.exitCode = result.livenessOk ? 0 : 1;
  });
}
