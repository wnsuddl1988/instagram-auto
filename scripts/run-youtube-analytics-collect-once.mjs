#!/usr/bin/env node
/**
 * YouTube 성과 수집 — 읽기 전용(GET만), 업로드·수정 없음. (2026-09-30 품질 개선)
 *
 * 영상별 조회수·평균 시청 시간·평균 시청 비율(유지율)·좋아요·공유·구독 증가를 모은다.
 * 결과: C:/tmp/money-shorts-os/insights/youtube-analytics-<날짜>.json (+ 표 출력)
 *
 * 필요 권한: youtube.readonly + yt-analytics.readonly. 지금 토큰이 업로드 전용이면 권한 부족을 알려준다
 * → 토큰 재발급(run-youtube-refresh-token-renewal-v1.mjs, 새 권한 포함) 후 다시 실행.
 * 토큰 값은 출력하지 않는다.
 *
 * 사용: node scripts/run-owner-command-with-local-env-no-log.mjs youtube-analytics-collect --arm
 */

import fs from "node:fs";
import path from "node:path";

const OUT_DIR = "C:/tmp/money-shorts-os/insights";
const START_DATE = "2026-09-01";
const clientId = process.env.YOUTUBE_CLIENT_ID;
const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
const refreshToken = process.env.YOUTUBE_REFRESH_TOKEN;
if (!clientId || !clientSecret || !refreshToken) {
  console.error("ABORT: 자격증명이 주입되지 않았습니다(no-log 래퍼로 실행하세요).");
  process.exit(2);
}
function sanitize(text) {
  return String(text ?? "")
    .replace(/ya29\.[A-Za-z0-9._-]+/g, "REDACTED")
    .replace(/1\/\/[A-Za-z0-9._-]+/g, "REDACTED")
    .slice(0, 300);
}

const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, refresh_token: refreshToken, grant_type: "refresh_token" }),
  signal: AbortSignal.timeout(30_000),
});
const tokenData = await tokenResponse.json().catch(() => null);
if (!tokenResponse.ok || !tokenData?.access_token) {
  console.error(`토큰 교환 실패: HTTP ${tokenResponse.status} ${sanitize(JSON.stringify(tokenData))}`);
  process.exit(1);
}
const accessToken = tokenData.access_token;
const scopes = String(tokenData.scope ?? "").split(/\s+/).filter(Boolean);
console.log(`권한: ${scopes.map((s) => s.replace("https://www.googleapis.com/auth/", "")).join(", ")}`);
const canRead = scopes.some((s) => /youtube(\.readonly)?$/.test(s));
const canAnalytics = scopes.some((s) => /yt-analytics(\.readonly)?$/.test(s));
if (!canRead || !canAnalytics) {
  console.error(
    `ABORT: 권한 부족 — 채널 조회 ${canRead ? "있음" : "없음"}, 분석 조회 ${canAnalytics ? "있음" : "없음"}. ` +
      "토큰을 새 권한으로 재발급해야 합니다(scripts/run-youtube-refresh-token-renewal-v1.mjs, CURRENT_STANDARDS 규칙 16).",
  );
  process.exit(3);
}
const headers = { Authorization: `Bearer ${accessToken}` };
async function getJson(url) {
  const response = await fetch(url, { headers, signal: AbortSignal.timeout(30_000) });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(`HTTP ${response.status} ${sanitize(JSON.stringify(data?.error ?? data))}`);
  return data;
}

const today = new Date().toISOString().slice(0, 10);

// Analytics API가 꺼져 있으면(프로젝트에서 미사용) Data API 통계(조회수·좋아요·댓글)만이라도 모은다.
async function collectDataApiOnly(reason) {
  console.log(`\n⚠ 분석 API 사용 불가 → 기본 통계만 수집합니다(유지율·평균 시청 시간 없음).\n  이유: ${reason}`);
  const channel = await getJson("https://www.googleapis.com/youtube/v3/channels?part=contentDetails&mine=true");
  const uploads = channel.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  const ids = [];
  let pageToken = "";
  do {
    const page = await getJson(`https://www.googleapis.com/youtube/v3/playlistItems?part=contentDetails&maxResults=50&playlistId=${uploads}${pageToken ? `&pageToken=${pageToken}` : ""}`);
    for (const it of page.items ?? []) ids.push(it.contentDetails.videoId);
    pageToken = page.nextPageToken ?? "";
  } while (pageToken && ids.length < 200);
  const rows = [];
  for (let i = 0; i < ids.length; i += 50) {
    const batch = await getJson(`https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails,status&id=${ids.slice(i, i + 50).join(",")}`);
    for (const v of batch.items ?? []) {
      rows.push({
        privacyStatus: v.status?.privacyStatus,
        uploadStatus: v.status?.uploadStatus,
        rejectionReason: v.status?.rejectionReason ?? null,
        madeForKids: v.status?.madeForKids ?? null,
        video: v.id,
        title: v.snippet.title,
        publishedAt: v.snippet.publishedAt,
        duration: v.contentDetails.duration,
        views: Number(v.statistics.viewCount ?? 0),
        likes: Number(v.statistics.likeCount ?? 0),
        comments: Number(v.statistics.commentCount ?? 0),
        url: `https://www.youtube.com/shorts/${v.id}`,
      });
    }
  }
  rows.sort((a, b) => String(b.publishedAt).localeCompare(String(a.publishedAt)));
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const outFile = path.join(OUT_DIR, `youtube-stats-${today}.json`);
  fs.writeFileSync(outFile, JSON.stringify({ collectedAt: new Date().toISOString(), analyticsUnavailable: reason, rows }, null, 2), "utf8");
  console.log("\n게시일      조회  좋아요 댓글  제목");
  for (const r of rows) {
    const flag = r.privacyStatus !== "public" || r.uploadStatus !== "processed" || r.rejectionReason || r.madeForKids
      ? `  ⚠ ${r.privacyStatus}/${r.uploadStatus}${r.rejectionReason ? `/${r.rejectionReason}` : ""}${r.madeForKids ? "/아동용" : ""}`
      : "";
    console.log(`${r.publishedAt.slice(0, 10)}  ${String(r.views).padStart(5)} ${String(r.likes).padStart(6)} ${String(r.comments).padStart(4)}  ${r.title.slice(0, 44)}${flag}`);
  }
  console.log(`\n저장: ${outFile}`);
  process.exit(0);
}

let report;
try {
  report = await getJson(
  "https://youtubeanalytics.googleapis.com/v2/reports?" +
    new URLSearchParams({
      ids: "channel==MINE",
      startDate: START_DATE,
      endDate: today,
      metrics: "views,estimatedMinutesWatched,averageViewDuration,averageViewPercentage,likes,shares,comments,subscribersGained",
      dimensions: "video",
      sort: "-views",
      maxResults: "100",
    }),
  );
} catch (error) {
  await collectDataApiOnly(String(error.message).slice(0, 160));
}
const columns = report.columnHeaders.map((c) => c.name);
const rows = (report.rows ?? []).map((r) => Object.fromEntries(columns.map((c, i) => [c, r[i]])));
const ids = rows.map((r) => r.video);
const titles = {};
for (let i = 0; i < ids.length; i += 50) {
  const batch = await getJson(`https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${ids.slice(i, i + 50).join(",")}`);
  for (const v of batch.items ?? []) titles[v.id] = { title: v.snippet.title, publishedAt: v.snippet.publishedAt, duration: v.contentDetails.duration };
}
const merged = rows.map((r) => ({ ...r, ...(titles[r.video] ?? {}), url: `https://www.youtube.com/shorts/${r.video}` }));

fs.mkdirSync(OUT_DIR, { recursive: true });
const outFile = path.join(OUT_DIR, `youtube-analytics-${today}.json`);
fs.writeFileSync(outFile, JSON.stringify({ collectedAt: new Date().toISOString(), startDate: START_DATE, rows: merged }, null, 2), "utf8");

console.log("\n게시일      조회   평균시청  유지율  좋아요 공유 구독+  제목");
for (const r of merged) {
  console.log(
    `${String(r.publishedAt ?? "").slice(0, 10)}  ${String(r.views).padStart(5)}  ${String(r.averageViewDuration + "s").padStart(7)}  ${String(Number(r.averageViewPercentage).toFixed(0) + "%").padStart(5)}  ${String(r.likes).padStart(5)} ${String(r.shares).padStart(4)} ${String(r.subscribersGained).padStart(4)}  ${String(r.title ?? r.video).slice(0, 40)}`,
  );
}
console.log(`\n저장: ${outFile}`);
