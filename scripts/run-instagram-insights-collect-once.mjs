#!/usr/bin/env node
/**
 * Instagram 성과 수집 — 읽기 전용(GET만), 게시·수정·삭제 없음. (2026-09-30 품질 개선)
 *
 * 편별 조회수·도달·평균 시청 시간·저장·공유를 한 번에 모아, "무엇이 효과가 있었는지"를 편끼리 비교한다.
 * 결과: C:/tmp/money-shorts-os/insights/instagram-insights-<날짜>.json (+ 표 출력)
 *
 * 필요 권한: instagram_basic + instagram_manage_insights. 권한이 없으면 어떤 지표가 막혔는지 알려준다.
 * 토큰 값·계정 ID는 출력하지 않는다.
 *
 * 사용: node scripts/run-owner-command-with-local-env-no-log.mjs instagram-insights-collect --arm
 */

import fs from "node:fs";
import path from "node:path";

const GRAPH_BASE = "https://graph.facebook.com/v25.0";
const OUT_DIR = "C:/tmp/money-shorts-os/insights";
const MEDIA_LIMIT = 60;
// 릴스 지표. API 버전에 따라 이름이 바뀐 적이 있어(plays → views) 하나씩 시도하고 실패한 것은 기록만 한다.
const REEL_METRICS = ["views", "reach", "likes", "comments", "shares", "saved", "total_interactions", "ig_reels_avg_watch_time", "ig_reels_video_view_total_time"];
const FEED_METRICS = ["views", "reach", "likes", "comments", "shares", "saved", "total_interactions"];

const accountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
if (!accountId || !accessToken) {
  console.error("ABORT: 자격증명이 주입되지 않았습니다(no-log 래퍼로 실행하세요).");
  process.exit(2);
}

function sanitize(text) {
  return String(text ?? "")
    .replace(/access_token=[^&\s"]+/gi, "access_token=REDACTED")
    .replace(/EAA[A-Za-z0-9]+/g, "REDACTED")
    .slice(0, 240);
}
async function getJson(url) {
  const response = await fetch(url, { redirect: "error", signal: AbortSignal.timeout(30_000) });
  let data = null;
  try { data = await response.json(); } catch { /* 본문 없음 */ }
  return { ok: response.ok, status: response.status, data };
}
const auth = `access_token=${encodeURIComponent(accessToken)}`;

// 1) 권한 확인(이름만)
const debug = await getJson(`${GRAPH_BASE}/debug_token?input_token=${encodeURIComponent(accessToken)}&${auth}`);
const scopes = debug.data?.data?.scopes ?? [];
const hasInsights = scopes.includes("instagram_manage_insights");
console.log(`권한: ${scopes.join(", ") || "(조회 실패)"}`);
console.log(`인사이트 권한(instagram_manage_insights): ${hasInsights ? "있음" : "없음 — Meta 앱에서 권한 추가 후 토큰 재발급 필요"}`);

// 2) 최근 게시물
const media = await getJson(
  `${GRAPH_BASE}/${encodeURIComponent(accountId)}/media?fields=id,caption,media_type,media_product_type,permalink,timestamp,like_count,comments_count&limit=${MEDIA_LIMIT}&${auth}`,
);
if (!media.ok) {
  console.error(`게시물 조회 실패: HTTP ${media.status} ${sanitize(JSON.stringify(media.data))}`);
  process.exit(1);
}

const blocked = new Map();
const rows = [];
for (const item of media.data?.data ?? []) {
  const isReel = item.media_product_type === "REELS";
  const metrics = {};
  for (const metric of isReel ? REEL_METRICS : FEED_METRICS) {
    const r = await getJson(`${GRAPH_BASE}/${item.id}/insights?metric=${metric}&${auth}`);
    if (r.ok) {
      const v = r.data?.data?.[0]?.values?.[0]?.value ?? r.data?.data?.[0]?.total_value?.value ?? null;
      metrics[metric] = v;
    } else {
      blocked.set(metric, sanitize(r.data?.error?.message ?? `HTTP ${r.status}`));
    }
  }
  rows.push({
    id: item.id,
    type: item.media_product_type,
    timestamp: item.timestamp,
    permalink: item.permalink,
    title: String(item.caption ?? "").split("\n")[0].slice(0, 60),
    likeCount: item.like_count ?? null,
    commentsCount: item.comments_count ?? null,
    ...metrics,
  });
}

fs.mkdirSync(OUT_DIR, { recursive: true });
const outFile = path.join(OUT_DIR, `instagram-insights-${new Date().toISOString().slice(0, 10)}.json`);
fs.writeFileSync(outFile, JSON.stringify({ collectedAt: new Date().toISOString(), scopes, blockedMetrics: Object.fromEntries(blocked), rows }, null, 2), "utf8");

const fmtSec = (ms) => (ms == null ? "-" : `${(ms / 1000).toFixed(1)}s`);
console.log("\n날짜        형식     조회    도달   평균시청  저장  공유  좋아요 댓글  제목");
for (const r of rows) {
  console.log(
    `${r.timestamp.slice(0, 10)}  ${String(r.type).padEnd(7)} ${String(r.views ?? "-").padStart(6)} ${String(r.reach ?? "-").padStart(6)}  ${fmtSec(r.ig_reels_avg_watch_time).padStart(7)} ${String(r.saved ?? "-").padStart(5)} ${String(r.shares ?? "-").padStart(5)} ${String(r.likeCount ?? "-").padStart(6)} ${String(r.commentsCount ?? "-").padStart(4)}  ${r.title}`,
  );
}
if (blocked.size > 0) {
  console.log("\n막힌 지표:");
  for (const [metric, reason] of blocked) console.log(`  ${metric}: ${reason}`);
}
console.log(`\n저장: ${outFile}`);
