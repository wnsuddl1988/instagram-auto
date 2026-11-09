#!/usr/bin/env node

/**
 * 부엉이 쇼츠 YouTube Shorts 게시 러너 — 1회성, 승인 게이트, fail-closed.
 *
 * task: owl-shorts-youtube-publish-once-v1
 * 승인 토큰: APPROVE_OWL_SHORTS_YOUTUBE_PUBLISH_ONCE
 *
 * Instagram 러너와 다른 점:
 * - 공개 URL이 필요 없다. 로컬 mp4 를 직접 업로드한다(Blob 불필요).
 * - AI 생성 콘텐츠이므로 containsSyntheticMedia 를 반드시 true 로 표시한다.
 * - 제목에 #Shorts 를 붙여 Shorts 로 분류되게 한다(세로 영상 + 3분 이하).
 *
 * 안전 원칙:
 * - YouTube 전용. Instagram/Blob 코드 경로 없음.
 * - **cap 정확히 1**: videos.insert 직전에 시도 기록을 먼저 남긴다. 재시도 루프 없음
 *   (retry:false). 실패해도 자동 재업로드하지 않는다 — 중복 업로드가 가장 위험하다.
 * - 시크릿은 process.env 에서만 받고 값을 로그·결과에 남기지 않는다.
 * - --arm 없으면 준비 확인만 하고 외부 호출을 하지 않는다.
 * - 기본 공개 범위는 private. Owner가 확인 후 수동으로 공개하거나
 *   --privacy public 을 명시해야 공개된다.
 *
 * 사용:
 *   node scripts/run-owl-youtube-publish-once-v1.mjs \
 *     --approval APPROVE_OWL_SHORTS_YOUTUBE_PUBLISH_ONCE \
 *     --content-unit <owl-content-unit.json> \
 *     --out-dir <repo 밖 경로> [--privacy public] [--publish-at <ISO8601>] [--arm]
 *
 * 썸네일(2026-09-22 추가): 매니페스트에 thumbnailImagePath(로컬 png/jpg 경로)가
 * 있으면 videos.insert 성공 직후 thumbnails.set 으로 지정한다. 실패해도 업로드
 * 자체는 이미 끝난 상태이므로 UPLOADED 로 기록하고 썸네일 오류만 별도 필드에
 * 남긴다(영상 업로드를 롤백하지 않는다 — 재시도가 중복 업로드보다 위험하다).
 *
 * 썸네일 리사이즈(2026-09-28 추가): YouTube는 Shorts 커스텀 썸네일을 정확히
 * 1080x1920(9:16)로 올려야 세로 그리드에 그대로 노출한다 — 이 규격이 아니면
 * (예: 941x1672) 16:9 캔버스에 레터박스로 감싸 저장하고, Shorts 그리드에서는
 * 그 레터박스 이미지를 다시 확대해 캐릭터만 과도하게 클로즈업되고 텍스트가
 * 잘린 채로 보인다(API 응답은 정상 "set"으로 나와 겉보기엔 성공처럼 보이는게
 * 함정). 그래서 업로드 전 ffmpeg로 원본을 무조건 1080x1920으로 리사이즈한 뒤
 * 넘긴다(공식 권장 사이즈, 참고: support.google.com/youtube/answer/72431).
 *
 * 예약 발행(2026-09-28 추가, Owner 확정: "유튜브는 바로 올리면 알고리즘을 잘
 * 못 탄다"): --publish-at에 미래 ISO8601 시각을 주면 공개 범위를 강제로
 * private으로 업로드하고 status.publishAt을 지정한다 — YouTube가 그 시각에
 * 자동으로 공개 전환한다. **주의**: 이 토큰(youtube.upload 스코프만 있음)으로는
 * 업로드 후 videos.update가 안 되므로, 한 번 넣은 publishAt은 API로 취소·수정이
 * 불가능하다(YouTube Studio에서 로그인해 수동으로만 가능). 실행 전 반드시
 * --arm 없이 먼저 돌려 preflight에 찍힌 시각을 확인할 것. --publish-at과
 * --privacy public을 동시에 주면 어긋나므로 ABORT한다.
 */

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { Readable } from "node:stream";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const YOUTUBE_SHORTS_THUMBNAIL_WIDTH = 1080;
const YOUTUBE_SHORTS_THUMBNAIL_HEIGHT = 1920;

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const APPROVAL_TOKEN = "APPROVE_OWL_SHORTS_YOUTUBE_PUBLISH_ONCE";
const ATTEMPT_FILENAME = "owl-youtube-publish-attempt.json";
const RESULT_FILENAME = "owl-youtube-publish-result.json";
const TITLE_MAX_CHARS = 100;      // YouTube 제목 상한
const DESCRIPTION_MAX_CHARS = 5000;
const CATEGORY_NEWS_POLITICS = "25"; // 뉴스/정치 — 경제 뉴스 채널에 맞는 분류
const VIDEO_ID_RE = /^[A-Za-z0-9_-]{6,20}$/;

const args = process.argv.slice(2);
function getArg(name) {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : null;
}
const armed = args.includes("--arm");
const publishAtArg = getArg("--publish-at");
let publishAtIso = null;
if (publishAtArg) {
  const parsed = new Date(publishAtArg);
  if (Number.isNaN(parsed.getTime())) {
    abort("publish_at_invalid", `--publish-at 값을 ISO8601 시각으로 해석하지 못했습니다: ${publishAtArg}`);
  }
  if (parsed.getTime() <= Date.now()) {
    abort("publish_at_not_future", `--publish-at은 미래 시각이어야 합니다: ${parsed.toISOString()}`);
  }
  publishAtIso = parsed.toISOString();
}
if (publishAtIso && getArg("--privacy") === "public") {
  abort("publish_at_conflicts_with_public", "--publish-at과 --privacy public을 동시에 줄 수 없습니다(예약 발행은 private로 업로드해야 합니다).");
}
// 예약 발행이면 강제로 private(YouTube가 publishAt 시각에 자동 공개 전환).
const privacyStatus = publishAtIso ? "private" : (getArg("--privacy") === "public" ? "public" : "private");

function abort(reason, detail) {
  console.error(`ABORT: ${reason}${detail ? ` — ${detail}` : ""}`);
  process.exit(1);
}

/** 오류 문구에서 자격증명이 새지 않게 지운다. */
function sanitize(text) {
  return String(text ?? "")
    .replace(/ya29\.[A-Za-z0-9._-]+/g, "REDACTED")
    .replace(/1\/\/[A-Za-z0-9._-]+/g, "REDACTED")
    .replace(/client_secret=[^&\s"]+/gi, "client_secret=REDACTED")
    .slice(0, 500);
}

// ── 게이트 1: 승인 토큰 ──────────────────────────────────────────────────────
if (getArg("--approval") !== APPROVAL_TOKEN) {
  abort("approval_token_mismatch", "정확한 승인 토큰이 필요합니다.");
}

// ── 게이트 2: 인자·경로 ──────────────────────────────────────────────────────
const contentUnitPath = getArg("--content-unit");
const outDirArg = getArg("--out-dir");
if (!contentUnitPath || !outDirArg) {
  abort("missing_required_args", "--content-unit / --out-dir 필수");
}
const outDir = resolve(outDirArg);
if (outDir === REPO_ROOT || outDir.startsWith(REPO_ROOT + "\\") || outDir.startsWith(REPO_ROOT + "/")) {
  abort("out_dir_inside_repo", "출력 디렉터리는 저장소 밖이어야 합니다.");
}

// ── 게이트 3: one-shot ───────────────────────────────────────────────────────
const attemptPath = join(outDir, ATTEMPT_FILENAME);
const resultPath = join(outDir, RESULT_FILENAME);
if (armed && existsSync(attemptPath)) {
  abort(
    "upload_attempt_already_recorded",
    `이미 업로드를 시도한 기록이 있습니다: ${attemptPath}. 중복 업로드를 막기 위해 차단합니다.`,
  );
}

// ── 게이트 4: 매니페스트 + 소스 영상 ─────────────────────────────────────────
if (!existsSync(resolve(contentUnitPath))) abort("content_unit_not_found", contentUnitPath);
let manifest;
try {
  manifest = JSON.parse(readFileSync(resolve(contentUnitPath), "utf8"));
} catch (error) {
  abort("content_unit_parse_failed", sanitize(error?.message));
}

const videoPath = manifest?.instagramSourcePath; // 같은 mp4 를 양쪽에 쓴다
if (typeof videoPath !== "string" || !existsSync(videoPath)) {
  abort("source_video_not_found", String(videoPath));
}
const sizeBytes = statSync(videoPath).size;

// 제목: Shorts 분류를 위해 #Shorts 를 붙인다. 상한을 넘으면 본문을 줄인다.
const baseTitle = String(manifest?.youtubeTitle ?? manifest?.title ?? "").trim();
if (baseTitle === "") abort("title_missing", "매니페스트에 youtubeTitle/title 이 없습니다.");
const SHORTS_SUFFIX = " #Shorts";
const title = (baseTitle.length + SHORTS_SUFFIX.length <= TITLE_MAX_CHARS)
  ? baseTitle + SHORTS_SUFFIX
  : baseTitle.slice(0, TITLE_MAX_CHARS - SHORTS_SUFFIX.length - 1).trimEnd() + "…" + SHORTS_SUFFIX;

const description = String(manifest?.youtubeDescription ?? "").slice(0, DESCRIPTION_MAX_CHARS);
if (description.trim() === "") abort("description_missing", "매니페스트에 youtubeDescription 이 없습니다.");

// 태그는 해시태그에서 # 없이 가져온다.
const tags = (manifest?.hashtags ?? []).map((tag) => String(tag).replace(/^#/, "")).slice(0, 15);

// 썸네일은 선택 사항 — 없으면 유튜브가 영상에서 자동으로 프레임을 뽑는다.
const thumbnailPath = manifest?.thumbnailImagePath ?? null;
if (thumbnailPath && !existsSync(thumbnailPath)) {
  abort("thumbnail_not_found", String(thumbnailPath));
}

console.log(`[owl-youtube] contentId:  ${manifest.contentId}`);
console.log(`[owl-youtube] 영상:       ${videoPath} (${(sizeBytes / 1048576).toFixed(1)} MiB)`);
console.log(`[owl-youtube] 제목:       ${title}`);
console.log(`[owl-youtube] 설명:       ${description.length}자 / 태그 ${tags.length}개`);
console.log(`[owl-youtube] 공개 범위:  ${privacyStatus}${publishAtIso ? ` (예약: ${publishAtIso} 에 자동 공개 — API로 취소·수정 불가, 신중히 확인할 것)` : ""}`);
console.log(`[owl-youtube] 썸네일:     ${thumbnailPath ?? "(없음, 자동 프레임 사용)"}`);

// ── 게이트 5: --arm 없으면 종료 ──────────────────────────────────────────────
if (!armed) {
  mkdirSync(outDir, { recursive: true });
  writeFileSync(
    join(outDir, "owl-youtube-publish-preflight.json"),
    JSON.stringify({
      schemaVersion: "owl_youtube_publish_preflight_v1",
      contentId: manifest.contentId,
      title,
      descriptionChars: description.length,
      tagCount: tags.length,
      privacyStatus,
      publishAt: publishAtIso,
      sizeBytes,
      armed: false,
      checkedAt: new Date().toISOString(),
    }, null, 2) + "\n",
    "utf8",
  );
  console.log("");
  console.log("[owl-youtube] --arm 이 없어 업로드하지 않았습니다(준비 확인만 완료).");
  process.exit(0);
}

// ── 게이트 6: 자격증명 ───────────────────────────────────────────────────────
const clientId = process.env.YOUTUBE_CLIENT_ID;
const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
const refreshToken = process.env.YOUTUBE_REFRESH_TOKEN;
if (!clientId || !clientSecret || !refreshToken) {
  abort(
    "youtube_credentials_absent",
    "YOUTUBE_CLIENT_ID / CLIENT_SECRET / REFRESH_TOKEN 이 주입되지 않았습니다(no-log 래퍼로 실행하세요).",
  );
}

const { google } = await import("googleapis");
const oauth2 = new google.auth.OAuth2(
  clientId,
  clientSecret,
  "http://localhost:3000/api/auth/youtube/callback",
);
oauth2.setCredentials({ refresh_token: refreshToken });
const youtube = google.youtube({ version: "v3", auth: oauth2 });

// 채널 확인은 업로드 응답에서 얻는다.
//
// channels.list 로 미리 확인하면 좋겠지만 그건 youtube.readonly 범위를 요구한다.
// 토큰은 youtube.upload 범위만 갖고 있고, 업로드 하나 하자고 읽기 권한까지 받는 건
// 최소 권한 원칙에 어긋난다. videos.insert 응답의 snippet.channelId 로 충분하다.
let channelTitle = null;
let channelId = null;

// ── 게이트 7: 시도 기록 먼저 (cap=1) ─────────────────────────────────────────
mkdirSync(outDir, { recursive: true });
const sourceBytes = readFileSync(videoPath);
writeFileSync(
  attemptPath,
  JSON.stringify({
    schemaVersion: "owl_youtube_publish_attempt_v1",
    contentId: manifest.contentId,
    title,
    privacyStatus,
    publishAt: publishAtIso,
    sourceSha256: createHash("sha256").update(sourceBytes).digest("hex"),
    attemptedAt: new Date().toISOString(),
    note: "videos.insert 직전에 기록됨. 이 파일이 있으면 재실행이 차단된다.",
  }, null, 2) + "\n",
  "utf8",
);

function writeResult(status, extra) {
  const payload = {
    schemaVersion: "owl_youtube_publish_result_v1",
    status,
    contentId: manifest.contentId,
    channelId,
    channelTitle,
    title,
    privacyStatus,
    publishAt: publishAtIso,
    finishedAt: new Date().toISOString(),
    ...extra,
  };
  writeFileSync(resultPath, JSON.stringify(payload, null, 2) + "\n", "utf8");
  return payload;
}

// ── 업로드 ───────────────────────────────────────────────────────────────────
console.log("[owl-youtube] 업로드 중… (파일 크기에 따라 수십 초 걸릴 수 있습니다)");
let uploadResponse;
try {
  uploadResponse = await youtube.videos.insert(
    {
      part: ["snippet", "status"],
      requestBody: {
        snippet: {
          title,
          description,
          tags,
          categoryId: CATEGORY_NEWS_POLITICS,
          defaultLanguage: "ko",
        },
        status: {
          privacyStatus,
          ...(publishAtIso ? { publishAt: publishAtIso } : {}),
          selfDeclaredMadeForKids: false,
          // AI로 생성한 영상이므로 반드시 표시한다. 미표시는 정책 위반이다.
          containsSyntheticMedia: true,
        },
      },
      media: { mimeType: "video/mp4", body: Readable.from([sourceBytes]) },
    },
    { retry: false },
  );
} catch (error) {
  writeResult("UPLOAD_FAILED", { error: sanitize(error?.message) });
  abort("youtube_insert_failed", sanitize(error?.message));
}

const videoId = uploadResponse?.data?.id;
if (typeof videoId !== "string" || !VIDEO_ID_RE.test(videoId)) {
  writeResult("UPLOAD_NO_VALID_ID", { raw: sanitize(JSON.stringify(uploadResponse?.data)) });
  abort("youtube_insert_no_valid_id", "업로드 응답에서 videoId 를 확인하지 못했습니다.");
}
// 업로드가 끝난 뒤에야 어느 채널인지 알 수 있다(위 주석 참조).
channelId = uploadResponse?.data?.snippet?.channelId ?? null;
channelTitle = uploadResponse?.data?.snippet?.channelTitle ?? null;

// ── 썸네일 설정(선택) ────────────────────────────────────────────────────────
// 영상 업로드는 이미 끝났으므로, 여기서 실패해도 UPLOADED 로 기록하고 썸네일
// 오류만 별도로 남긴다. 재시도하지 않는다(중복 업로드보다 수동 재설정이 안전).
let thumbnailStatus = "not_attempted";
let thumbnailError = null;
if (thumbnailPath) {
  console.log("[owl-youtube] 썸네일 설정 중…");
  try {
    // YouTube Shorts 커스텀 썸네일은 정확히 1080x1920이어야 세로 그리드에
    // 그대로 노출된다(위 파일 상단 주석 참고). 원본 해상도가 다르면(예:
    // 941x1672) ffmpeg로 무조건 정확히 맞춘 뒤 그 결과물만 API에 넘긴다.
    const resizedThumbPath = join(outDir, "youtube-thumbnail-1080x1920.jpg");
    const ffmpegResult = spawnSync("ffmpeg", [
      "-y", "-i", thumbnailPath,
      "-vf", `scale=${YOUTUBE_SHORTS_THUMBNAIL_WIDTH}:${YOUTUBE_SHORTS_THUMBNAIL_HEIGHT}`,
      "-frames:v", "1",
      resizedThumbPath,
    ], { encoding: "utf8" });
    if (ffmpegResult.status !== 0 || !existsSync(resizedThumbPath)) {
      throw new Error(`ffmpeg 리사이즈 실패: ${sanitize(ffmpegResult.stderr)}`);
    }
    const thumbBytes = readFileSync(resizedThumbPath);
    await youtube.thumbnails.set(
      { videoId, media: { mimeType: "image/jpeg", body: Readable.from([thumbBytes]) } },
      { retry: false },
    );
    thumbnailStatus = "set";
    console.log(`[owl-youtube] 썸네일 설정 완료 (${YOUTUBE_SHORTS_THUMBNAIL_WIDTH}x${YOUTUBE_SHORTS_THUMBNAIL_HEIGHT}로 리사이즈: ${resizedThumbPath})`);
  } catch (error) {
    thumbnailStatus = "failed";
    thumbnailError = sanitize(error?.message);
    console.error(`[owl-youtube] 썸네일 설정 실패(영상 업로드는 유지됨): ${thumbnailError}`);
  }
}

const result = writeResult("UPLOADED", {
  videoId,
  watchUrl: `https://www.youtube.com/watch?v=${videoId}`,
  shortsUrl: `https://www.youtube.com/shorts/${videoId}`,
  uploadStatus: uploadResponse?.data?.status?.uploadStatus ?? null,
  thumbnailStatus,
  thumbnailError,
});

console.log("");
console.log("═".repeat(60));
console.log("  업로드 완료");
console.log(`  videoId:   ${videoId}`);
console.log(`  채널:      ${channelTitle}`);
console.log(`  공개 범위: ${privacyStatus}`);
console.log(`  Shorts:    ${result.shortsUrl}`);
console.log(`  썸네일:    ${thumbnailStatus}`);
console.log(`  결과 기록: ${resultPath}`);
console.log("═".repeat(60));
if (privacyStatus === "private") {
  console.log("");
  console.log("  ※ 비공개로 업로드됐습니다. 확인 후 YouTube Studio에서 공개로 바꾸거나,");
  console.log("    처음부터 공개하려면 --privacy public 을 주고 실행하세요.");
}
