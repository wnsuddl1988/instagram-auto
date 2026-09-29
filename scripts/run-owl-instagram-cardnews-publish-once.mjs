#!/usr/bin/env node

/**
 * 부엉이/금박사 카드뉴스 Instagram 캐러셀 게시 러너 — 1회성, 승인 게이트, fail-closed.
 *
 * task: owl-cardnews-instagram-publish-once-v1
 * 승인 토큰: APPROVE_OWL_CARDNEWS_INSTAGRAM_PUBLISH_ONCE
 *
 * 시퀀스:
 *   1) 업로드된 이미지 URL마다 캐러셀 아이템 컨테이너 생성(is_carousel_item=true)
 *   2) 아이템 컨테이너 ID들을 children으로 묶어 캐러셀 컨테이너 생성(media_type=CAROUSEL)
 *   3) 캐러셀 처리 완료 폴링
 *   4) media_publish
 *   5) 게시물 검증
 *
 * run-owl-instagram-publish-once-v1.mjs(영상 REELS 게시)와 안전 계약은 동일하되
 * (승인 토큰, cap=1, secret 미로그, out-dir 검증, 공개 URL 확인) 대상이 이미지
 * 캐러셀이라는 점만 다르다. 영상 스크립트는 전혀 건드리지 않는다.
 *
 * 사용:
 *   node scripts/run-owl-instagram-cardnews-publish-once.mjs \
 *     --approval APPROVE_OWL_CARDNEWS_INSTAGRAM_PUBLISH_ONCE \
 *     --caption-file <caption.txt> \
 *     --blob-result <instagram-cardnews-blob-upload-once-result.json> \
 *     --out-dir <repo 밖 경로> [--arm]
 */

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const APPROVAL_TOKEN = "APPROVE_OWL_CARDNEWS_INSTAGRAM_PUBLISH_ONCE";
const GRAPH_BASE = "https://graph.facebook.com/v25.0";
const ATTEMPT_FILENAME = "owl-cardnews-instagram-publish-attempt.json";
const RESULT_FILENAME = "owl-cardnews-instagram-publish-result.json";
const CAPTION_MAX_CHARS = 2200;
const POLL_MAX_ATTEMPTS = 40;
const POLL_INTERVAL_MS = 6_000;
const MAX_CAROUSEL_ITEMS = 10;

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
const captionFilePath = getArg("--caption-file");
const blobResultPath = getArg("--blob-result");
const outDirArg = getArg("--out-dir");
if (!captionFilePath || !blobResultPath || !outDirArg) {
  abort("missing_required_args", "--caption-file / --blob-result / --out-dir 필수");
}
const outDir = resolve(outDirArg);
if (outDir === REPO_ROOT || outDir.startsWith(REPO_ROOT + "\\") || outDir.startsWith(REPO_ROOT + "/")) {
  abort("out_dir_inside_repo", "출력 디렉터리는 저장소 밖이어야 합니다.");
}

// ── 게이트 3: one-shot ───────────────────────────────────────────────────────
const attemptPath = join(outDir, ATTEMPT_FILENAME);
const resultPath = join(outDir, RESULT_FILENAME);
if (armed && existsSync(attemptPath)) {
  abort("publish_attempt_already_recorded", `이미 게시를 시도한 기록이 있습니다: ${attemptPath}. 중복 게시를 막기 위해 차단합니다.`);
}

// ── 게이트 4: caption + blob 결과 로드 ────────────────────────────────────────
function loadJson(path, label) {
  if (!existsSync(path)) abort(`${label}_not_found`, path);
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    abort(`${label}_parse_failed`, sanitize(error?.message));
  }
}
if (!existsSync(captionFilePath)) abort("caption_file_not_found", captionFilePath);
const caption = readFileSync(captionFilePath, "utf8").trim();
if (!caption) abort("caption_empty");
if (caption.length > CAPTION_MAX_CHARS) abort("caption_too_long", `${caption.length}자 > ${CAPTION_MAX_CHARS}자`);

const blobResult = loadJson(resolve(blobResultPath), "blob_result");
if (blobResult?.status !== "UPLOADED") {
  abort("blob_result_not_fully_uploaded", `status=${blobResult?.status}`);
}
const slides = Array.isArray(blobResult?.slides) ? blobResult.slides : [];
if (slides.length === 0) abort("blob_result_slides_empty");
if (slides.length > MAX_CAROUSEL_ITEMS) abort("too_many_slides", `${slides.length} > ${MAX_CAROUSEL_ITEMS}`);
const sortedSlides = [...slides].sort((a, b) => a.slideIndex - b.slideIndex);
const imageUrls = sortedSlides.map((s) => s.uploadedUrl);
if (imageUrls.some((u) => typeof u !== "string" || !/^https:\/\//.test(u) || !u.endsWith(".png"))) {
  abort("image_url_invalid", "Blob 결과에서 https .png URL을 찾지 못했습니다.");
}

console.log(`[cardnews-publish] slideCount: ${imageUrls.length}`);
console.log(`[cardnews-publish] caption:    ${caption.length}자`);

// ── 게이트 5: 공개 URL 실제 접근 확인(HEAD, 시크릿 불필요) ────────────────────
for (const [i, url] of imageUrls.entries()) {
  const head = await fetch(url, { method: "HEAD", redirect: "follow", signal: AbortSignal.timeout(30_000) });
  const headType = head.headers.get("content-type") ?? "";
  if (!head.ok || !headType.startsWith("image/")) {
    abort("public_url_not_viewable", `[${i + 1}] HTTP ${head.status}, content-type=${headType}`);
  }
  console.log(`[cardnews-publish] 공개 URL 확인[${i + 1}]: HTTP ${head.status}, ${headType}`);
}

// ── 게이트 6: --arm 없으면 여기서 종료 ────────────────────────────────────────
if (!armed) {
  mkdirSync(outDir, { recursive: true });
  writeFileSync(
    join(outDir, "owl-cardnews-instagram-publish-preflight.json"),
    JSON.stringify({
      schemaVersion: "owl_cardnews_instagram_publish_preflight_v1",
      slideCount: imageUrls.length,
      imageUrls,
      captionChars: caption.length,
      publicUrlOk: true,
      armed: false,
      checkedAt: new Date().toISOString(),
    }, null, 2) + "\n",
    "utf8",
  );
  console.log("\n[cardnews-publish] --arm 이 없어 게시하지 않았습니다(준비 확인만 완료).");
  process.exit(0);
}

// ── 게이트 7: 시크릿 존재 확인 ─────────────────────────────────────────────────
const accountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
if (!accountId || !accessToken) {
  abort("instagram_credentials_absent", "INSTAGRAM_BUSINESS_ACCOUNT_ID / INSTAGRAM_ACCESS_TOKEN 이 주입되지 않았습니다(no-log 래퍼로 실행하세요).");
}
const accountIdMasked = `***${String(accountId).slice(-4)}`;
console.log(`[cardnews-publish] 계정: ${accountIdMasked} (자격증명 확인됨)`);

// ── 게이트 8: 시도 기록을 먼저 남긴다(cap=1 보장) ─────────────────────────────
mkdirSync(outDir, { recursive: true });
writeFileSync(
  attemptPath,
  JSON.stringify({
    schemaVersion: "owl_cardnews_instagram_publish_attempt_v1",
    imageUrls,
    captionSha256: createHash("sha256").update(caption).digest("hex"),
    accountIdMasked,
    attemptedAt: new Date().toISOString(),
    note: "캐러셀 아이템 컨테이너 생성 직전에 기록됨. 이 파일이 있으면 재실행이 차단된다.",
  }, null, 2) + "\n",
  "utf8",
);

async function graphJson(response) {
  try { return await response.json(); } catch { return null; }
}
function writeResult(status, extra) {
  const payload = {
    schemaVersion: "owl_cardnews_instagram_publish_result_v1",
    status,
    imageUrls,
    accountIdMasked,
    finishedAt: new Date().toISOString(),
    ...extra,
  };
  writeFileSync(resultPath, JSON.stringify(payload, null, 2) + "\n", "utf8");
  return payload;
}

// ── 1) 캐러셀 아이템 컨테이너 생성 (이미지마다 1개) ───────────────────────────
console.log("[cardnews-publish] 캐러셀 아이템 컨테이너 생성 중…");
const itemContainerIds = [];
for (const [i, url] of imageUrls.entries()) {
  const itemResponse = await fetch(`${GRAPH_BASE}/${encodeURIComponent(accountId)}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      image_url: url,
      is_carousel_item: "true",
      access_token: accessToken,
    }),
    redirect: "error",
    signal: AbortSignal.timeout(60_000),
  });
  const itemData = await graphJson(itemResponse);
  const itemId = typeof itemData?.id === "string" ? itemData.id : null;
  if (!itemResponse.ok || !itemId) {
    const detail = sanitize(JSON.stringify(itemData?.error ?? itemData));
    writeResult("ITEM_CONTAINER_FAILED", { httpStatus: itemResponse.status, error: detail, failedSlideIndex: i + 1, itemContainerIds });
    abort("item_container_creation_failed", `[${i + 1}] ${detail}`);
  }
  itemContainerIds.push(itemId);
  console.log(`[cardnews-publish] [${i + 1}/${imageUrls.length}] 아이템 컨테이너 생성됨: ${itemId}`);
}

// ── 2) 캐러셀 컨테이너 생성 ────────────────────────────────────────────────────
console.log("[cardnews-publish] 캐러셀 컨테이너 생성 중…");
const carouselResponse = await fetch(`${GRAPH_BASE}/${encodeURIComponent(accountId)}/media`, {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({
    media_type: "CAROUSEL",
    caption,
    children: itemContainerIds.join(","),
    access_token: accessToken,
  }),
  redirect: "error",
  signal: AbortSignal.timeout(60_000),
});
const carouselData = await graphJson(carouselResponse);
const containerId = typeof carouselData?.id === "string" ? carouselData.id : null;
if (!carouselResponse.ok || !containerId) {
  const detail = sanitize(JSON.stringify(carouselData?.error ?? carouselData));
  writeResult("CAROUSEL_CONTAINER_FAILED", { httpStatus: carouselResponse.status, error: detail, itemContainerIds });
  abort("carousel_container_creation_failed", detail);
}
console.log(`[cardnews-publish] 캐러셀 컨테이너 생성됨: ${containerId}`);

// ── 3) 처리 완료 폴링 ─────────────────────────────────────────────────────────
let finishedStatus = null;
for (let attempt = 1; attempt <= POLL_MAX_ATTEMPTS; attempt += 1) {
  await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  const statusResponse = await fetch(
    `${GRAPH_BASE}/${encodeURIComponent(containerId)}?fields=status_code,status&access_token=${encodeURIComponent(accessToken)}`,
    { redirect: "error", signal: AbortSignal.timeout(30_000) },
  );
  const statusData = await graphJson(statusResponse);
  const code = typeof statusData?.status_code === "string" ? statusData.status_code : "UNKNOWN";
  console.log(`[cardnews-publish] 처리 상태(${attempt}/${POLL_MAX_ATTEMPTS}): ${code}`);
  if (code === "FINISHED") { finishedStatus = code; break; }
  if (code === "ERROR" || code === "EXPIRED") {
    const detail = sanitize(JSON.stringify(statusData));
    writeResult("CONTAINER_PROCESSING_FAILED", { containerId, itemContainerIds, statusCode: code, error: detail });
    abort("container_processing_failed", `${code}: ${detail}`);
  }
}
if (finishedStatus !== "FINISHED") {
  writeResult("CONTAINER_TIMEOUT", { containerId, itemContainerIds, note: "처리 완료를 기다리다 시간 초과. 게시는 시도하지 않음." });
  abort("container_timeout", "컨테이너 처리가 제한 시간 내에 끝나지 않았습니다.");
}

// ── 4) 발행 ──────────────────────────────────────────────────────────────────
console.log("[cardnews-publish] 발행 중…");
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
  writeResult("PUBLISH_FAILED", { containerId, itemContainerIds, httpStatus: publishResponse.status, error: detail });
  abort("publish_failed", detail);
}

// ── 5) 게시물 검증 ───────────────────────────────────────────────────────────
const verifyResponse = await fetch(
  `${GRAPH_BASE}/${encodeURIComponent(mediaId)}?fields=id,media_type,media_product_type,permalink,timestamp&access_token=${encodeURIComponent(accessToken)}`,
  { redirect: "error", signal: AbortSignal.timeout(30_000) },
);
const verifyData = await graphJson(verifyResponse);

const result = writeResult("PUBLISHED", {
  containerId,
  itemContainerIds,
  mediaId,
  mediaProductType: verifyData?.media_product_type ?? null,
  permalink: verifyData?.permalink ?? null,
  publishedAt: verifyData?.timestamp ?? null,
});

console.log("");
console.log("═".repeat(60));
console.log("  카드뉴스 게시 완료");
console.log(`  mediaId:   ${mediaId}`);
console.log(`  형식:      ${result.mediaProductType ?? "-"}`);
console.log(`  링크:      ${result.permalink ?? "-"}`);
console.log(`  결과 기록: ${resultPath}`);
console.log("═".repeat(60));
