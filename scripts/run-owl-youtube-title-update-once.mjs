#!/usr/bin/env node

/**
 * YouTube 영상 제목(및 필요시 설명)만 수정하는 1회성 러너 — 승인 게이트, fail-closed.
 *
 * task: owl-youtube-title-update-once-v1
 * 승인 토큰: APPROVE_OWL_SHORTS_YOUTUBE_TITLE_UPDATE_ONCE
 *
 * 배경: run-owl-youtube-publish-once-v1.mjs로 올린 영상 제목에 "#Shorts"가
 * 중복 붙는 결함이 있었다(content-unit의 youtubeTitle에 이미 #Shorts가
 * 있는데 업로드 스크립트가 자동으로 한 번 더 붙임). 재업로드 없이 videos.update
 * 로 제목만 고친다.
 *
 * 주의: 기존 업로드 토큰은 youtube.upload 스코프만 보유하고 있을 수 있다
 * (run-owl-youtube-publish-once-v1.mjs 주석 참고). videos.update는 보통
 * youtube 또는 youtube.force-ssl 스코프가 필요하므로, 스코프 부족으로 실패하면
 * 그 사실을 그대로 보고한다(재시도 안 함).
 *
 * 사용:
 *   node scripts/run-owl-youtube-title-update-once.mjs \
 *     --approval APPROVE_OWL_SHORTS_YOUTUBE_TITLE_UPDATE_ONCE \
 *     --video-id <YouTube videoId> \
 *     --title <새 제목> \
 *     --out-dir <repo 밖 경로> [--arm]
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const APPROVAL_TOKEN = "APPROVE_OWL_SHORTS_YOUTUBE_TITLE_UPDATE_ONCE";
const TITLE_MAX_CHARS = 100;

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

if (getArg("--approval") !== APPROVAL_TOKEN) {
  abort("approval_token_mismatch", "정확한 승인 토큰이 필요합니다.");
}

const videoId = getArg("--video-id");
const newTitle = getArg("--title");
const outDirArg = getArg("--out-dir");
if (!videoId || !newTitle || !outDirArg) {
  abort("missing_required_args", "--video-id / --title / --out-dir 필수");
}
if (!/^[A-Za-z0-9_-]{6,20}$/.test(videoId)) {
  abort("video_id_invalid", videoId);
}
if (newTitle.length > TITLE_MAX_CHARS) {
  abort("title_too_long", `${newTitle.length} > ${TITLE_MAX_CHARS}`);
}
const outDir = resolve(outDirArg);
if (outDir === REPO_ROOT || outDir.startsWith(REPO_ROOT + "\\") || outDir.startsWith(REPO_ROOT + "/")) {
  abort("out_dir_inside_repo", "출력 디렉터리는 저장소 밖이어야 합니다.");
}
mkdirSync(outDir, { recursive: true });

const attemptPath = join(outDir, "owl-youtube-title-update-attempt.json");
const resultPath = join(outDir, "owl-youtube-title-update-result.json");
if (existsSync(attemptPath)) {
  abort("one_shot_already_attempted", attemptPath);
}

if (!armed) {
  writeFileSync(
    attemptPath.replace("attempt", "preflight"),
    JSON.stringify({ schemaVersion: "owl_youtube_title_update_preflight_v1", videoId, newTitle, checkedAt: new Date().toISOString() }, null, 2) + "\n",
    "utf8",
  );
  console.log(`[owl-youtube-title-update] videoId: ${videoId}`);
  console.log(`[owl-youtube-title-update] newTitle: ${newTitle}`);
  console.log("[owl-youtube-title-update] --arm 이 없어 수정하지 않았습니다(준비 확인만 완료).");
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
  JSON.stringify({ schemaVersion: "owl_youtube_title_update_attempt_v1", videoId, newTitle, attemptedAt: new Date().toISOString() }, null, 2) + "\n",
  "utf8",
);

try {
  // videos.update는 snippet 전체를 요구하므로, 먼저 현재 snippet을 읽어와
  // title만 바꾸고 나머지(categoryId 등)는 그대로 보존한다.
  const current = await youtube.videos.list({ part: ["snippet"], id: [videoId] });
  const existing = current.data.items?.[0]?.snippet;
  if (!existing) {
    throw new Error("video_not_found_or_no_read_scope");
  }
  const response = await youtube.videos.update({
    part: ["snippet"],
    requestBody: {
      id: videoId,
      snippet: { ...existing, title: newTitle },
    },
  });
  writeFileSync(
    resultPath,
    JSON.stringify({
      schemaVersion: "owl_youtube_title_update_result_v1",
      status: "UPDATED",
      videoId,
      oldTitle: existing.title,
      newTitle: response.data.snippet?.title,
      finishedAt: new Date().toISOString(),
    }, null, 2) + "\n",
    "utf8",
  );
  console.log("");
  console.log("════════════════════════════════════════════════════════════");
  console.log("  제목 수정 완료");
  console.log(`  videoId:  ${videoId}`);
  console.log(`  이전:     ${existing.title}`);
  console.log(`  변경:     ${response.data.snippet?.title}`);
  console.log(`  결과 기록: ${resultPath}`);
  console.log("════════════════════════════════════════════════════════════");
} catch (error) {
  const message = String(error?.message ?? error).slice(0, 500);
  writeFileSync(
    resultPath,
    JSON.stringify({
      schemaVersion: "owl_youtube_title_update_result_v1",
      status: "FAILED",
      videoId,
      error: message,
      finishedAt: new Date().toISOString(),
    }, null, 2) + "\n",
    "utf8",
  );
  console.error(`ABORT: youtube_update_failed — ${message}`);
  process.exit(1);
}
