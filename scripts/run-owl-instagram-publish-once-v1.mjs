#!/usr/bin/env node

/**
 * 부엉이 쇼츠 Instagram Reels 게시 러너 — 1회성, 승인 게이트, fail-closed.
 *
 * task: owl-shorts-instagram-publish-once-v1
 * 승인 토큰: APPROVE_OWL_SHORTS_INSTAGRAM_PUBLISH_ONCE
 *
 * 시퀀스: 컨테이너 생성 → 처리 완료 폴링 → media_publish → 게시물 검증
 *
 * 안전 원칙(기존 게시 러너들의 계약을 그대로 따른다):
 * - Instagram 전용. YouTube/Blob 코드 경로 없음.
 * - **cap 정확히 1**: 컨테이너 생성 "직전"에 시도 기록을 먼저 남긴다. 중간에 죽거나
 *   재실행해도 그 기록을 보고 차단한다. 재시도 루프 없음.
 * - 시크릿은 process.env 에서만 받는다(.env 직접 읽기 금지). 값은 로그·결과 JSON에
 *   절대 남기지 않으며 존재 여부 boolean 과 마스킹된 계정 ID 접미사만 기록한다.
 * - --arm 없으면 준비 상태만 확인하고 외부 호출을 하지 않는다(공개 URL HEAD 제외).
 * - 출력 디렉터리는 repo 밖이어야 한다.
 *
 * 사용:
 *   node scripts/run-owl-instagram-publish-once-v1.mjs \
 *     --approval APPROVE_OWL_SHORTS_INSTAGRAM_PUBLISH_ONCE \
 *     --content-unit <owl-content-unit.json> \
 *     --blob-result <instagram-blob-upload-once-result.json> \
 *     --out-dir <repo 밖 경로> [--arm]
 *
 * 릴스 커버(2026-09-22 추가): blobResult.coverImageUrl(png/jpg 공개 URL)이
 * 있으면 REELS 컨테이너 생성 시 cover_url 로 지정한다(Instagram Graph API
 * REELS 가 지원하는 공식 파라미터). 없으면 기존처럼 영상에서 자동 프레임을
 * 뽑는다 — 필수 아님.
 */

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const APPROVAL_TOKEN = "APPROVE_OWL_SHORTS_INSTAGRAM_PUBLISH_ONCE";
const GRAPH_BASE = "https://graph.facebook.com/v25.0";
const ATTEMPT_FILENAME = "owl-instagram-publish-attempt.json";
const RESULT_FILENAME = "owl-instagram-publish-result.json";
const CAPTION_MAX_CHARS = 2200; // Instagram 캡션 상한
const POLL_MAX_ATTEMPTS = 40;
const POLL_INTERVAL_MS = 6_000;

const args = process.argv.slice(2);
function getArg(name) {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : null;
}
const armed = args.includes("--arm");

function abort(reason, detail) {
  console.error(`ABORT: ${reason}${detail ? ` — ${detail}` : ""}`);
  process.exit(1);
}

/** 오류 문구에서 토큰이 새어나가지 않게 지운다. */
function sanitize(text) {
  return String(text ?? "")
    .replace(/access_token=[^&\s"]+/gi, "access_token=REDACTED")
    .replace(/EAA[A-Za-z0-9]+/g, "REDACTED")
    .slice(0, 500);
}

// ── 게이트 1: 승인 토큰 ──────────────────────────────────────────────────────
if (getArg("--approval") !== APPROVAL_TOKEN) {
  abort("approval_token_mismatch", "정확한 승인 토큰이 필요합니다.");
}

// ── 게이트 2: 인자·경로 ──────────────────────────────────────────────────────
const contentUnitPath = getArg("--content-unit");
const blobResultPath = getArg("--blob-result");
const outDirArg = getArg("--out-dir");
if (!contentUnitPath || !blobResultPath || !outDirArg) {
  abort("missing_required_args", "--content-unit / --blob-result / --out-dir 필수");
}
const outDir = resolve(outDirArg);
if (outDir === REPO_ROOT || outDir.startsWith(REPO_ROOT + "\\") || outDir.startsWith(REPO_ROOT + "/")) {
  abort("out_dir_inside_repo", "출력 디렉터리는 저장소 밖이어야 합니다.");
}

// ── 게이트 3: one-shot — 이전 시도 기록이 있으면 차단 ────────────────────────
const attemptPath = join(outDir, ATTEMPT_FILENAME);
const resultPath = join(outDir, RESULT_FILENAME);
if (armed && existsSync(attemptPath)) {
  abort(
    "publish_attempt_already_recorded",
    `이미 게시를 시도한 기록이 있습니다: ${attemptPath}. 중복 게시를 막기 위해 차단합니다.`,
  );
}

// ── 게이트 4: 매니페스트·Blob 결과 로드 ──────────────────────────────────────
function loadJson(path, label) {
  if (!existsSync(path)) abort(`${label}_not_found`, path);
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    abort(`${label}_parse_failed`, sanitize(error?.message));
  }
}
const manifest = loadJson(resolve(contentUnitPath), "content_unit");
const blobResult = loadJson(resolve(blobResultPath), "blob_result");

const caption = manifest?.instagramCaption;
if (typeof caption !== "string" || caption.trim() === "") {
  abort("caption_missing", "매니페스트에 instagramCaption 이 없습니다.");
}
if (caption.length > CAPTION_MAX_CHARS) {
  abort("caption_too_long", `${caption.length}자 > ${CAPTION_MAX_CHARS}자`);
}

const videoUrl = blobResult?.uploadedUrl ?? blobResult?.result?.uploadedUrl;
if (typeof videoUrl !== "string" || !/^https:\/\//.test(videoUrl) || !videoUrl.endsWith(".mp4")) {
  abort("video_url_invalid", "Blob 결과에서 https .mp4 URL을 찾지 못했습니다.");
}

// 커버 이미지는 선택 사항 — 없으면 인스타가 영상에서 자동으로 프레임을 뽑는다.
// blobResult에 coverImageUrl(png/jpg 공개 URL)이 있으면 cover_url로 지정한다.
const coverImageUrl = blobResult?.coverImageUrl ?? blobResult?.result?.coverImageUrl ?? null;
if (coverImageUrl !== null) {
  if (typeof coverImageUrl !== "string" || !/^https:\/\//.test(coverImageUrl)) {
    abort("cover_image_url_invalid", "blobResult.coverImageUrl 이 https URL이 아닙니다.");
  }
}

// ── 게이트 5: 공개 URL 실제 접근 확인 (HEAD, 시크릿 불필요) ──────────────────
console.log(`[owl-publish] contentId: ${manifest.contentId}`);
console.log(`[owl-publish] videoUrl:  ${videoUrl}`);
console.log(`[owl-publish] coverUrl:  ${coverImageUrl ?? "(없음, 자동 프레임 사용)"}`);
console.log(`[owl-publish] caption:   ${caption.length}자`);

const head = await fetch(videoUrl, { method: "HEAD", redirect: "follow", signal: AbortSignal.timeout(30_000) });
const headType = head.headers.get("content-type") ?? "";
if (!head.ok || !headType.startsWith("video/")) {
  abort("public_url_not_playable", `HTTP ${head.status}, content-type=${headType}`);
}
console.log(`[owl-publish] 공개 URL 확인: HTTP ${head.status}, ${headType}`);

if (coverImageUrl) {
  const coverHead = await fetch(coverImageUrl, { method: "HEAD", redirect: "follow", signal: AbortSignal.timeout(30_000) });
  const coverHeadType = coverHead.headers.get("content-type") ?? "";
  if (!coverHead.ok || !coverHeadType.startsWith("image/")) {
    abort("cover_url_not_reachable", `HTTP ${coverHead.status}, content-type=${coverHeadType}`);
  }
  console.log(`[owl-publish] 커버 URL 확인: HTTP ${coverHead.status}, ${coverHeadType}`);
}

// ── 게이트 6: --arm 없으면 여기서 종료 ───────────────────────────────────────
if (!armed) {
  mkdirSync(outDir, { recursive: true });
  writeFileSync(
    join(outDir, "owl-instagram-publish-preflight.json"),
    JSON.stringify({
      schemaVersion: "owl_instagram_publish_preflight_v1",
      contentId: manifest.contentId,
      videoUrl,
      coverImageUrl,
      captionChars: caption.length,
      hashtagCount: (manifest.hashtags ?? []).length,
      publicUrlOk: true,
      armed: false,
      checkedAt: new Date().toISOString(),
    }, null, 2) + "\n",
    "utf8",
  );
  console.log("");
  console.log("[owl-publish] --arm 이 없어 게시하지 않았습니다(준비 확인만 완료).");
  process.exit(0);
}

// ── 게이트 7: 시크릿 존재 확인 (값은 읽되 절대 출력하지 않는다) ──────────────
const accountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
if (!accountId || !accessToken) {
  abort(
    "instagram_credentials_absent",
    "INSTAGRAM_BUSINESS_ACCOUNT_ID / INSTAGRAM_ACCESS_TOKEN 이 주입되지 않았습니다(no-log 래퍼로 실행하세요).",
  );
}
const accountIdMasked = `***${String(accountId).slice(-4)}`;
console.log(`[owl-publish] 계정: ${accountIdMasked} (자격증명 확인됨)`);

// ── 게이트 8: 시도 기록을 먼저 남긴다 (cap=1 보장) ───────────────────────────
mkdirSync(outDir, { recursive: true });
writeFileSync(
  attemptPath,
  JSON.stringify({
    schemaVersion: "owl_instagram_publish_attempt_v1",
    contentId: manifest.contentId,
    videoUrl,
    captionSha256: createHash("sha256").update(caption).digest("hex"),
    accountIdMasked,
    attemptedAt: new Date().toISOString(),
    note: "컨테이너 생성 직전에 기록됨. 이 파일이 있으면 재실행이 차단된다.",
  }, null, 2) + "\n",
  "utf8",
);

async function graphJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function writeResult(status, extra) {
  const payload = {
    schemaVersion: "owl_instagram_publish_result_v1",
    status,
    contentId: manifest.contentId,
    videoUrl,
    accountIdMasked,
    finishedAt: new Date().toISOString(),
    ...extra,
  };
  writeFileSync(resultPath, JSON.stringify(payload, null, 2) + "\n", "utf8");
  return payload;
}

// ── 1) 컨테이너 생성 ─────────────────────────────────────────────────────────
console.log("[owl-publish] 컨테이너 생성 중…");
const containerParams = {
  media_type: "REELS",
  video_url: videoUrl,
  caption,
  share_to_feed: "true",
  access_token: accessToken,
};
if (coverImageUrl) {
  containerParams.cover_url = coverImageUrl;
}
const containerResponse = await fetch(`${GRAPH_BASE}/${encodeURIComponent(accountId)}/media`, {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams(containerParams),
  redirect: "error",
  signal: AbortSignal.timeout(60_000),
});
const containerData = await graphJson(containerResponse);
const containerId = typeof containerData?.id === "string" ? containerData.id : null;
if (!containerResponse.ok || !containerId) {
  const detail = sanitize(JSON.stringify(containerData?.error ?? containerData));
  writeResult("CONTAINER_FAILED", { httpStatus: containerResponse.status, error: detail });
  abort("container_creation_failed", detail);
}
console.log(`[owl-publish] 컨테이너 생성됨: ${containerId}`);

// ── 2) 처리 완료 폴링 ────────────────────────────────────────────────────────
let finishedStatus = null;
for (let attempt = 1; attempt <= POLL_MAX_ATTEMPTS; attempt += 1) {
  await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  const statusResponse = await fetch(
    `${GRAPH_BASE}/${encodeURIComponent(containerId)}?fields=status_code,status&access_token=${encodeURIComponent(accessToken)}`,
    { redirect: "error", signal: AbortSignal.timeout(30_000) },
  );
  const statusData = await graphJson(statusResponse);
  const code = typeof statusData?.status_code === "string" ? statusData.status_code : "UNKNOWN";
  console.log(`[owl-publish] 처리 상태(${attempt}/${POLL_MAX_ATTEMPTS}): ${code}`);
  if (code === "FINISHED") { finishedStatus = code; break; }
  if (code === "ERROR" || code === "EXPIRED") {
    const detail = sanitize(JSON.stringify(statusData));
    writeResult("CONTAINER_PROCESSING_FAILED", { containerId, statusCode: code, error: detail });
    abort("container_processing_failed", `${code}: ${detail}`);
  }
}
if (finishedStatus !== "FINISHED") {
  writeResult("CONTAINER_TIMEOUT", { containerId, note: "처리 완료를 기다리다 시간 초과. 게시는 시도하지 않음." });
  abort("container_timeout", "컨테이너 처리가 제한 시간 내에 끝나지 않았습니다.");
}

// ── 3) 발행 ──────────────────────────────────────────────────────────────────
console.log("[owl-publish] 발행 중…");
const publishResponse = await fetch(`${GRAPH_BASE}/${encodeURIComponent(accountId)}/media_publish`, {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({ creation_id: containerId, access_token: accessToken }),
  redirect: "error",
  signal: AbortSignal.timeout(60_000),
});
const publishData = await graphJson(publishResponse);
const mediaId = typeof publishData?.id === "string" ? publishData.id : null;
if (!publishResponse.ok || !mediaId) {
  const detail = sanitize(JSON.stringify(publishData?.error ?? publishData));
  writeResult("PUBLISH_FAILED", { containerId, httpStatus: publishResponse.status, error: detail });
  abort("publish_failed", detail);
}

// ── 4) 게시물 검증 ───────────────────────────────────────────────────────────
const verifyResponse = await fetch(
  `${GRAPH_BASE}/${encodeURIComponent(mediaId)}?fields=id,media_type,media_product_type,permalink,timestamp&access_token=${encodeURIComponent(accessToken)}`,
  { redirect: "error", signal: AbortSignal.timeout(30_000) },
);
const verifyData = await graphJson(verifyResponse);

const result = writeResult("PUBLISHED", {
  containerId,
  mediaId,
  mediaProductType: verifyData?.media_product_type ?? null,
  permalink: verifyData?.permalink ?? null,
  publishedAt: verifyData?.timestamp ?? null,
});

console.log("");
console.log("═".repeat(60));
console.log("  게시 완료");
console.log(`  mediaId:   ${mediaId}`);
console.log(`  형식:      ${result.mediaProductType ?? "-"}`);
console.log(`  링크:      ${result.permalink ?? "-"}`);
console.log(`  결과 기록: ${resultPath}`);
console.log("═".repeat(60));
