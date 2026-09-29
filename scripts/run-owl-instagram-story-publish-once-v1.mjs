#!/usr/bin/env node

/**
 * 부엉이/금박사 카드뉴스 표지 Instagram Story 게시 러너 — 1회성, 승인 게이트,
 * fail-closed.
 *
 * task: owl-shorts-instagram-story-publish-once-v1
 * 승인 토큰: APPROVE_OWL_SHORTS_INSTAGRAM_STORY_PUBLISH_ONCE
 *
 * 2026-09-20 신설 배경: 영상(Reels)을 그대로 스토리에 올리려 했으나 Instagram
 * Story는 영상 길이 상한이 60초(Graph API 에러 2207082로 실제 확인됨)라 CTA
 * 포함 90초 안팎인 편들이 그대로 못 올라간다. 매 편 별도로 60초 컷 영상을
 * 만드는 대신, 이미 카드뉴스 파이프라인으로 만들어 둔 표지 이미지 1장을
 * 스토리로 올리는 방식을 택했다(Owner 확정) — 작업량이 거의 늘지 않는다.
 *
 * run-owl-instagram-publish-once-v1.mjs(Reels)와 동일한 계약·게이트 구조를
 * 따르되, media_type=STORIES + image_url로 게시한다:
 * - 카드뉴스 Blob 업로드 결과(instagram-cardnews-blob-upload-once-result.json)의
 *   slides[] 중 --slide-index(기본 1=표지)에 해당하는 uploadedUrl을 쓴다.
 * - 스토리는 caption을 지원하지 않는다 — Graph API가 필드 자체를 무시한다.
 * - media_publish 이후 조회 가능한 필드가 Reels보다 적다(permalink 없음,
 *   media_product_type만 확인 가능) — 스토리는 24시간 뒤 사라지는 임시
 *   콘텐츠라 Graph API가 영구 링크를 주지 않는다.
 * - 이미지는 영상과 달리 처리 폴링이 즉시 끝나는 경우가 대부분이라 폴링
 *   최대 대기 시간을 짧게 둔다.
 *
 * 안전 원칙(기존 게시 러너들의 계약을 그대로 따른다):
 * - Instagram 전용. YouTube/Blob 코드 경로 없음.
 * - **cap 정확히 1**: 컨테이너 생성 "직전"에 시도 기록을 먼저 남긴다. 중간에 죽거나
 *   재실행해도 그 기록을 보고 차단한다. 재시도 루프 없음.
 * - 시크릿은 process.env 에서만 받는다(.env 직접 읽기 금지). 값은 로그·결과 JSON에
 *   절대 남기지 않으며 존재 여부 boolean 과 마스킹된 계정 ID 접미사만 기록한다.
 * - --arm 없으면 준비 상태만 확인하고 외부 호출을 하지 않는다(공개 URL HEAD 제외).
 * - 출력 디렉터리는 저장소 밖이어야 한다.
 *
 * 사용:
 *   node scripts/run-owl-instagram-story-publish-once-v1.mjs \
 *     --approval APPROVE_OWL_SHORTS_INSTAGRAM_STORY_PUBLISH_ONCE \
 *     --content-unit <owl-content-unit.json> \
 *     --cardnews-blob-result <instagram-cardnews-blob-upload-once-result.json> \
 *     --out-dir <저장소 밖 경로> [--slide-index 1] [--arm]
 */

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const APPROVAL_TOKEN = "APPROVE_OWL_SHORTS_INSTAGRAM_STORY_PUBLISH_ONCE";
const GRAPH_BASE = "https://graph.facebook.com/v25.0";
const ATTEMPT_FILENAME = "owl-instagram-story-publish-attempt.json";
const RESULT_FILENAME = "owl-instagram-story-publish-result.json";
const POLL_MAX_ATTEMPTS = 15;
const POLL_INTERVAL_MS = 3_000;

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
const cardnewsBlobResultPath = getArg("--cardnews-blob-result");
const outDirArg = getArg("--out-dir");
const slideIndex = Number(getArg("--slide-index") ?? "1");
if (!contentUnitPath || !cardnewsBlobResultPath || !outDirArg) {
  abort("missing_required_args", "--content-unit / --cardnews-blob-result / --out-dir 필수");
}
if (!Number.isInteger(slideIndex) || slideIndex < 1) {
  abort("slide_index_invalid", "--slide-index 는 1 이상의 정수여야 합니다.");
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
    `이미 스토리 게시를 시도한 기록이 있습니다: ${attemptPath}. 중복 게시를 막기 위해 차단합니다.`,
  );
}

// ── 게이트 4: 매니페스트·카드뉴스 Blob 결과 로드 ─────────────────────────────
function loadJson(path, label) {
  if (!existsSync(path)) abort(`${label}_not_found`, path);
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    abort(`${label}_parse_failed`, sanitize(error?.message));
  }
}
const manifest = loadJson(resolve(contentUnitPath), "content_unit");
const cardnewsBlobResult = loadJson(resolve(cardnewsBlobResultPath), "cardnews_blob_result");

const slides = Array.isArray(cardnewsBlobResult?.slides) ? cardnewsBlobResult.slides : [];
const targetSlide = slides.find((slide) => slide.slideIndex === slideIndex);
const imageUrl = targetSlide?.uploadedUrl;
if (typeof imageUrl !== "string" || !/^https:\/\//.test(imageUrl) || !imageUrl.endsWith(".png")) {
  abort("image_url_invalid", `카드뉴스 Blob 결과에서 slideIndex=${slideIndex} 의 https .png URL을 찾지 못했습니다.`);
}

// ── 게이트 5: 공개 URL 실제 접근 확인 (HEAD, 시크릿 불필요) ──────────────────
console.log(`[owl-story-publish] contentId:   ${manifest.contentId}`);
console.log(`[owl-story-publish] slideIndex:  ${slideIndex} (${targetSlide?.file ?? "-"})`);
console.log(`[owl-story-publish] imageUrl:    ${imageUrl}`);

const head = await fetch(imageUrl, { method: "HEAD", redirect: "follow", signal: AbortSignal.timeout(30_000) });
const headType = head.headers.get("content-type") ?? "";
if (!head.ok || !headType.startsWith("image/")) {
  abort("public_url_not_playable", `HTTP ${head.status}, content-type=${headType}`);
}
console.log(`[owl-story-publish] 공개 URL 확인: HTTP ${head.status}, ${headType}`);

// ── 게이트 6: --arm 없으면 여기서 종료 ───────────────────────────────────────
if (!armed) {
  mkdirSync(outDir, { recursive: true });
  writeFileSync(
    join(outDir, "owl-instagram-story-publish-preflight.json"),
    JSON.stringify({
      schemaVersion: "owl_instagram_story_publish_preflight_v1",
      contentId: manifest.contentId,
      slideIndex,
      imageUrl,
      publicUrlOk: true,
      armed: false,
      checkedAt: new Date().toISOString(),
    }, null, 2) + "\n",
    "utf8",
  );
  console.log("");
  console.log("[owl-story-publish] --arm 이 없어 게시하지 않았습니다(준비 확인만 완료).");
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
console.log(`[owl-story-publish] 계정: ${accountIdMasked} (자격증명 확인됨)`);

// ── 게이트 8: 시도 기록을 먼저 남긴다 (cap=1 보장) ───────────────────────────
mkdirSync(outDir, { recursive: true });
writeFileSync(
  attemptPath,
  JSON.stringify({
    schemaVersion: "owl_instagram_story_publish_attempt_v1",
    contentId: manifest.contentId,
    slideIndex,
    imageUrl,
    imageUrlSha256: createHash("sha256").update(imageUrl).digest("hex"),
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
    schemaVersion: "owl_instagram_story_publish_result_v1",
    status,
    contentId: manifest.contentId,
    slideIndex,
    imageUrl,
    accountIdMasked,
    finishedAt: new Date().toISOString(),
    ...extra,
  };
  writeFileSync(resultPath, JSON.stringify(payload, null, 2) + "\n", "utf8");
  return payload;
}

// ── 1) 컨테이너 생성 (media_type=STORIES, image_url, caption 없음) ───────────
console.log("[owl-story-publish] 컨테이너 생성 중…");
const containerResponse = await fetch(`${GRAPH_BASE}/${encodeURIComponent(accountId)}/media`, {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({
    media_type: "STORIES",
    image_url: imageUrl,
    access_token: accessToken,
  }),
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
console.log(`[owl-story-publish] 컨테이너 생성됨: ${containerId}`);

// ── 2) 처리 완료 폴링(이미지는 대개 즉시 끝난다) ─────────────────────────────
let finishedStatus = null;
for (let attempt = 1; attempt <= POLL_MAX_ATTEMPTS; attempt += 1) {
  const statusResponse = await fetch(
    `${GRAPH_BASE}/${encodeURIComponent(containerId)}?fields=status_code,status&access_token=${encodeURIComponent(accessToken)}`,
    { redirect: "error", signal: AbortSignal.timeout(30_000) },
  );
  const statusData = await graphJson(statusResponse);
  const code = typeof statusData?.status_code === "string" ? statusData.status_code : "UNKNOWN";
  console.log(`[owl-story-publish] 처리 상태(${attempt}/${POLL_MAX_ATTEMPTS}): ${code}`);
  if (code === "FINISHED") { finishedStatus = code; break; }
  if (code === "ERROR" || code === "EXPIRED") {
    const detail = sanitize(JSON.stringify(statusData));
    writeResult("CONTAINER_PROCESSING_FAILED", { containerId, statusCode: code, error: detail });
    abort("container_processing_failed", `${code}: ${detail}`);
  }
  await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
}
if (finishedStatus !== "FINISHED") {
  writeResult("CONTAINER_TIMEOUT", { containerId, note: "처리 완료를 기다리다 시간 초과. 게시는 시도하지 않음." });
  abort("container_timeout", "컨테이너 처리가 제한 시간 내에 끝나지 않았습니다.");
}

// ── 3) 발행 ──────────────────────────────────────────────────────────────────
console.log("[owl-story-publish] 발행 중…");
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

// ── 4) 게시물 검증(스토리는 permalink를 지원하지 않는다) ─────────────────────
const verifyResponse = await fetch(
  `${GRAPH_BASE}/${encodeURIComponent(mediaId)}?fields=id,media_type,media_product_type,timestamp&access_token=${encodeURIComponent(accessToken)}`,
  { redirect: "error", signal: AbortSignal.timeout(30_000) },
);
const verifyData = await graphJson(verifyResponse);

const result = writeResult("PUBLISHED", {
  containerId,
  mediaId,
  mediaProductType: verifyData?.media_product_type ?? null,
  publishedAt: verifyData?.timestamp ?? null,
  expiresNote: "Instagram Story는 게시 후 약 24시간 뒤 자동으로 사라진다(영구 permalink 없음).",
});

console.log("");
console.log("═".repeat(60));
console.log("  스토리 게시 완료");
console.log(`  mediaId:   ${mediaId}`);
console.log(`  형식:      ${result.mediaProductType ?? "-"}`);
console.log(`  참고:      24시간 뒤 자동 만료 (permalink 없음)`);
console.log(`  결과 기록: ${resultPath}`);
console.log("═".repeat(60));
