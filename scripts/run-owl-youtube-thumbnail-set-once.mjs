#!/usr/bin/env node

/**
 * 이미 업로드된 YouTube 영상에 썸네일만 (재)설정하는 1회성 러너 — 승인 게이트,
 * fail-closed.
 *
 * task: owl-youtube-thumbnail-set-once-v1
 * 승인 토큰: APPROVE_OWL_SHORTS_YOUTUBE_THUMBNAIL_SET_ONCE
 *
 * 배경: run-owl-youtube-publish-once-v1.mjs 업로드 직후 thumbnails.set을 같이
 * 시도했으나 "채널 미인증" 상태에서는 권한 오류로 실패했다(영상 업로드 자체는
 * 유지됨). Owner가 채널 인증을 마친 뒤 재업로드 없이 썸네일만 다시 설정하기
 * 위한 별도 스크립트.
 *
 * 사용:
 *   node scripts/run-owl-youtube-thumbnail-set-once.mjs \
 *     --approval APPROVE_OWL_SHORTS_YOUTUBE_THUMBNAIL_SET_ONCE \
 *     --video-id <YouTube videoId> \
 *     --thumbnail <png/jpg 경로> \
 *     --out-dir <repo 밖 경로> [--arm]
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Readable } from "node:stream";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const APPROVAL_TOKEN = "APPROVE_OWL_SHORTS_YOUTUBE_THUMBNAIL_SET_ONCE";
const VIDEO_ID_RE = /^[A-Za-z0-9_-]{6,20}$/;

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
    .replace(/ya29\.[A-Za-z0-9._-]+/g, "REDACTED")
    .replace(/1\/\/[A-Za-z0-9._-]+/g, "REDACTED")
    .replace(/client_secret=[^&\s"]+/gi, "client_secret=REDACTED")
    .slice(0, 500);
}

if (getArg("--approval") !== APPROVAL_TOKEN) {
  abort("approval_token_mismatch", "정확한 승인 토큰이 필요합니다.");
}

const videoId = getArg("--video-id");
const thumbnailPath = getArg("--thumbnail");
const outDirArg = getArg("--out-dir");
if (!videoId || !thumbnailPath || !outDirArg) {
  abort("missing_required_args", "--video-id / --thumbnail / --out-dir 필수");
}
if (!VIDEO_ID_RE.test(videoId)) {
  abort("video_id_invalid", videoId);
}
const thumbnailAbs = resolve(thumbnailPath);
if (!existsSync(thumbnailAbs)) {
  abort("thumbnail_not_found", thumbnailAbs);
}
const outDir = resolve(outDirArg);
if (outDir === REPO_ROOT || outDir.startsWith(REPO_ROOT + "\\") || outDir.startsWith(REPO_ROOT + "/")) {
  abort("out_dir_inside_repo", "출력 디렉터리는 저장소 밖이어야 합니다.");
}
mkdirSync(outDir, { recursive: true });

const attemptPath = join(outDir, `owl-youtube-thumbnail-set-attempt-${videoId}.json`);
const resultPath = join(outDir, `owl-youtube-thumbnail-set-result-${videoId}.json`);
if (existsSync(attemptPath)) {
  abort("one_shot_already_attempted", attemptPath);
}

if (!armed) {
  writeFileSync(
    attemptPath.replace("attempt", "preflight"),
    JSON.stringify({
      schemaVersion: "owl_youtube_thumbnail_set_preflight_v1",
      videoId,
      thumbnailPath: thumbnailAbs,
      checkedAt: new Date().toISOString(),
    }, null, 2) + "\n",
    "utf8",
  );
  console.log(`[owl-youtube-thumbnail-set] videoId:   ${videoId}`);
  console.log(`[owl-youtube-thumbnail-set] thumbnail: ${thumbnailAbs}`);
  console.log("[owl-youtube-thumbnail-set] --arm 이 없어 설정하지 않았습니다(준비 확인만 완료).");
  process.exit(0);
}

const clientId = process.env.YOUTUBE_CLIENT_ID;
const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
const refreshToken = process.env.YOUTUBE_REFRESH_TOKEN;
if (!clientId || !clientSecret || !refreshToken) {
  abort("youtube_credentials_absent", "no-log 래퍼로 실행하세요.");
}

const { google } = await import("googleapis");
const oauth2 = new google.auth.OAuth2(clientId, clientSecret, "http://localhost:3000/api/auth/youtube/callback");
oauth2.setCredentials({ refresh_token: refreshToken });
const youtube = google.youtube({ version: "v3", auth: oauth2 });

writeFileSync(
  attemptPath,
  JSON.stringify({
    schemaVersion: "owl_youtube_thumbnail_set_attempt_v1",
    videoId,
    thumbnailPath: thumbnailAbs,
    attemptedAt: new Date().toISOString(),
  }, null, 2) + "\n",
  "utf8",
);

try {
  const thumbBytes = readFileSync(thumbnailAbs);
  const mimeType = thumbnailAbs.toLowerCase().endsWith(".jpg") || thumbnailAbs.toLowerCase().endsWith(".jpeg")
    ? "image/jpeg"
    : "image/png";
  const response = await youtube.thumbnails.set(
    { videoId, media: { mimeType, body: Readable.from([thumbBytes]) } },
    { retry: false },
  );
  writeFileSync(
    resultPath,
    JSON.stringify({
      schemaVersion: "owl_youtube_thumbnail_set_result_v1",
      status: "SET",
      videoId,
      thumbnailUrls: response.data?.items?.[0] ?? null,
      finishedAt: new Date().toISOString(),
    }, null, 2) + "\n",
    "utf8",
  );
  console.log("");
  console.log("════════════════════════════════════════════════════════════");
  console.log("  썸네일 설정 완료");
  console.log(`  videoId:   ${videoId}`);
  console.log(`  결과 기록: ${resultPath}`);
  console.log("════════════════════════════════════════════════════════════");
} catch (error) {
  const message = sanitize(error?.message);
  writeFileSync(
    resultPath,
    JSON.stringify({
      schemaVersion: "owl_youtube_thumbnail_set_result_v1",
      status: "FAILED",
      videoId,
      error: message,
      finishedAt: new Date().toISOString(),
    }, null, 2) + "\n",
    "utf8",
  );
  console.error(`ABORT: youtube_thumbnail_set_failed — ${message}`);
  process.exit(1);
}
