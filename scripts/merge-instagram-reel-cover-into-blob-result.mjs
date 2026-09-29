/**
 * 영상 Blob 업로드 결과(instagram-blob-upload-once-result.json)에 릴스 커버
 * Blob 업로드 결과(instagram-reel-cover-blob-upload-once-result.json)의
 * uploadedUrl을 coverImageUrl로 병합한다.
 *
 * task: instagram-reel-cover-blob-result-merge-v1
 *
 * run-owl-instagram-publish-once-v1.mjs는 --blob-result로 넘긴 JSON에서
 * coverImageUrl 필드를 읽어 REELS 컨테이너 생성 시 cover_url로 지정한다
 * (없으면 기존처럼 영상에서 자동 프레임을 뽑는다 — 필수 아님). 지금까지는
 * 이 필드를 수동으로 채워 넣어야 했는데, 이 스크립트가 두 개의 이미 완료된
 * blob 업로드 결과 JSON을 읽어 자동으로 병합해준다.
 *
 * 이 스크립트는 업로드를 하지 않는다:
 * - @vercel/blob import 없음, put()/list()/head()/del() 호출 없음.
 * - fetch/axios/network/API 호출 없음.
 * - process.env 접근 없음, .env/.env.local 읽기 없음.
 * - 순수 JSON 읽기 + 병합 + 쓰기만 수행한다(두 입력 모두 "업로드가 이미
 *   완료됐다는 증거"인 result JSON이어야 한다 — request/preflight JSON이
 *   아니다).
 * - 원본 영상 blob-result 파일은 직접 덮어쓰지 않는다. 병합 결과를 별도
 *   파일(기본 <video-blob-result 디렉터리>/instagram-blob-upload-once-result.merged.json)
 *   로 새로 쓴다 — 원본을 보존해 재실행/디버깅이 쉽도록 한다.
 *
 * Usage:
 *   node scripts/merge-instagram-reel-cover-into-blob-result.mjs \
 *     --video-blob-result <instagram-blob-upload-once-result.json> \
 *     --cover-blob-result <instagram-reel-cover-blob-upload-once-result.json> \
 *     --out <병합 결과를 쓸 경로, 기본값은 video-blob-result와 같은 폴더>
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");

export const MERGE_RESULT_SCHEMA_SUFFIX = "_with_cover_merged";

function getArg(args, name) {
  const idx = args.indexOf(name);
  if (idx !== -1 && args[idx + 1]) return args[idx + 1];
  return null;
}

function printUsage() {
  console.log(
    [
      "Merge a completed reel-cover Blob upload result's uploadedUrl into a video Blob upload result",
      "as coverImageUrl, so run-owl-instagram-publish-once-v1.mjs can pick it up as cover_url.",
      "",
      "Usage:",
      "  node scripts/merge-instagram-reel-cover-into-blob-result.mjs" +
        " --video-blob-result <instagram-blob-upload-once-result.json>" +
        " --cover-blob-result <instagram-reel-cover-blob-upload-once-result.json>" +
        " [--out <output path>]",
      "",
      "Both inputs must be COMPLETED upload result JSONs (status UPLOADED) — not request/preflight",
      "JSONs. Never calls @vercel/blob, never uploads, never touches env/network/API. Writes a new",
      "merged JSON file; does not overwrite the original video blob-result in place.",
    ].join("\n"),
  );
}

function loadJson(filePath, label) {
  if (!existsSync(filePath)) {
    return { ok: false, reason: `${label}_file_not_found`, data: null };
  }
  try {
    return { ok: true, reason: null, data: JSON.parse(readFileSync(filePath, "utf8")) };
  } catch (e) {
    return { ok: false, reason: `${label}_json_parse_failed: ${String(e?.message || e)}`, data: null };
  }
}

/**
 * 순수 병합 함수: 영상 blob-result + 커버 blob-result → coverImageUrl이 채워진
 * 새 객체. 두 입력 모두 status가 "UPLOADED"여야 하고, uploadedUrl이 https URL
 * 이어야 한다. 원본 객체는 변형하지 않고 새 객체를 반환한다.
 */
export function mergeReelCoverIntoBlobResult({ videoBlobResult, coverBlobResult }) {
  if (videoBlobResult?.status !== "UPLOADED") {
    return { ok: false, reason: `video_blob_result_not_uploaded: status=${videoBlobResult?.status}`, merged: null };
  }
  const videoUrl = videoBlobResult?.uploadedUrl;
  if (typeof videoUrl !== "string" || !/^https:\/\//.test(videoUrl) || !videoUrl.endsWith(".mp4")) {
    return { ok: false, reason: "video_blob_result_uploadedUrl_invalid", merged: null };
  }

  if (coverBlobResult?.status !== "UPLOADED") {
    return { ok: false, reason: `cover_blob_result_not_uploaded: status=${coverBlobResult?.status}`, merged: null };
  }
  const coverUrl = coverBlobResult?.uploadedUrl;
  if (typeof coverUrl !== "string" || !/^https:\/\//.test(coverUrl)) {
    return { ok: false, reason: "cover_blob_result_uploadedUrl_invalid", merged: null };
  }

  const merged = {
    ...videoBlobResult,
    coverImageUrl: coverUrl,
    coverImageMergedFrom: {
      contentId: coverBlobResult.contentId ?? null,
      pathname: coverBlobResult.pathname ?? null,
      uploadedPathname: coverBlobResult.uploadedPathname ?? null,
      mergedAtIso: new Date().toISOString(),
    },
  };

  return { ok: true, reason: null, merged };
}

// ── CLI entrypoint ───────────────────────────────────────────────────────────────
const isMainModule = process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));
if (isMainModule) {
  const args = process.argv.slice(2);
  const videoBlobResultPath = getArg(args, "--video-blob-result");
  const coverBlobResultPath = getArg(args, "--cover-blob-result");
  const outArg = getArg(args, "--out");

  if (!videoBlobResultPath || !coverBlobResultPath) {
    printUsage();
    process.exit(1);
  }

  const videoBlobResultAbs = resolve(videoBlobResultPath);
  const coverBlobResultAbs = resolve(coverBlobResultPath);
  const outAbs = outArg
    ? resolve(outArg)
    : join(dirname(videoBlobResultAbs), "instagram-blob-upload-once-result.merged.json");

  if ([videoBlobResultAbs, coverBlobResultAbs, outAbs].some((p) => p.includes(".money-shorts-local"))) {
    console.error("ABORT: .money-shorts-local access forbidden.");
    process.exit(1);
  }
  if (outAbs === REPO_ROOT || outAbs.startsWith(REPO_ROOT + "\\") || outAbs.startsWith(REPO_ROOT + "/")) {
    console.error(`ABORT: --out must be outside repo root.\n  repo: ${REPO_ROOT}\n  out: ${outAbs}`);
    process.exit(1);
  }

  console.log("\n╔══════════════════════════════════════════════════════════════╗");
  console.log("║   Merge Instagram Reel Cover Into Video Blob Result              ║");
  console.log("╚══════════════════════════════════════════════════════════════╝\n");

  const videoLoad = loadJson(videoBlobResultAbs, "video_blob_result");
  if (!videoLoad.ok) {
    console.error(`ABORT: ${videoLoad.reason}`);
    process.exit(1);
  }
  const coverLoad = loadJson(coverBlobResultAbs, "cover_blob_result");
  if (!coverLoad.ok) {
    console.error(`ABORT: ${coverLoad.reason}`);
    process.exit(1);
  }

  const result = mergeReelCoverIntoBlobResult({
    videoBlobResult: videoLoad.data,
    coverBlobResult: coverLoad.data,
  });
  if (!result.ok) {
    console.error(`ABORT: ${result.reason}`);
    process.exit(1);
  }

  mkdirSync(dirname(outAbs), { recursive: true });
  writeFileSync(outAbs, JSON.stringify(result.merged, null, 2) + "\n", "utf8");

  console.log(`  videoBlobResult:  ${videoBlobResultAbs}`);
  console.log(`  coverBlobResult:  ${coverBlobResultAbs}`);
  console.log(`  videoUrl:         ${result.merged.uploadedUrl}`);
  console.log(`  coverImageUrl:    ${result.merged.coverImageUrl}`);
  console.log(`\n  merged: ${outAbs}`);
  console.log("");
  console.log("  다음 단계: run-owl-instagram-publish-once-v1.mjs --blob-result 에 이 merged");
  console.log("  파일 경로를 넘기면 REELS 컨테이너 생성 시 cover_url이 자동 지정됩니다.");
  console.log("");

  process.exit(0);
}
