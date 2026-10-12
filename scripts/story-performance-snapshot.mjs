#!/usr/bin/env node
/**
 * 스토리형 편별 반응 스냅샷 (2026-10-12 Owner "스토리형 성과 추적 정례화").
 * 네트워크·자격증명 없음 — 이미 수집된 인사이트 JSON만 읽어 `_ai/story-performance-tracker.md`에 한 구간을 덧붙인다.
 *
 * 순서:
 *   1) node scripts/run-owner-command-with-local-env-no-log.mjs instagram-insights-collect --arm
 *   2) node scripts/run-owner-command-with-local-env-no-log.mjs youtube-analytics-collect --arm
 *   3) node scripts/story-performance-snapshot.mjs            (가장 최근 수집 파일을 쓴다)
 *      node scripts/story-performance-snapshot.mjs --print    (파일에 덧붙이지 않고 출력만)
 * 편 ID는 `_ai/story-performance-ids.json`에 새 편 게시 때 한 줄 추가한다.
 * 유튜브 분석은 2~3일 지연되므로 유튜브 칸은 게시 72시간 뒤 이후 값을 본다.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DIR = process.env.INSIGHTS_DIR || "C:/tmp/money-shorts-os/insights";
const IDS = JSON.parse(fs.readFileSync(path.join(ROOT, "_ai", "story-performance-ids.json"), "utf8")).episodes;
const TRACKER = path.join(ROOT, "_ai", "story-performance-tracker.md");
const printOnly = process.argv.includes("--print");

const latest = (prefix) => {
  const files = fs.readdirSync(DIR).filter((f) => f.startsWith(prefix) && f.endsWith(".json")).sort();
  if (!files.length) { console.error(`수집 파일 없음: ${DIR}/${prefix}*.json`); process.exit(1); }
  return path.join(DIR, files[files.length - 1]);
};
const igFile = latest("instagram-insights-");
const ytFile = latest("youtube-analytics-");
const ig = JSON.parse(fs.readFileSync(igFile, "utf8"));
const yt = JSON.parse(fs.readFileSync(ytFile, "utf8"));
const code = (r) => (r.permalink || "").split("/").filter(Boolean).pop();
const igBy = new Map(ig.rows.map((r) => [code(r), r]));
const ytBy = new Map(yt.rows.map((r) => [r.video, r]));
const med = (a) => { const s = [...a].sort((x, y) => x - y); const n = s.length; return n ? (n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2) : 0; };
const hoursSince = (iso, at) => (iso ? Math.round((new Date(at) - new Date(iso)) / 36e5) : null);

const idSet = new Set(IDS.flatMap((e) => [e.ig, e.yt]));
const explainerIg = ig.rows.filter((r) => r.type === "REELS" && !idSet.has(code(r)));
const explainerYt = yt.rows.filter((r) => !idSet.has(r.video));

const lines = [];
lines.push(`## 스냅샷 ${ig.collectedAt.slice(0, 16).replace("T", " ")} UTC (인스타 ${path.basename(igFile)} · 유튜브 ${path.basename(ytFile)})`);
lines.push("");
lines.push("| 편 | 소재 | 게시 후 | IG 조회 | IG 평균시청 | IG 저장·공유 | YT 조회 | YT 시청률 | YT 좋아요 | YT 구독 |");
lines.push("|---|---|---|---|---|---|---|---|---|---|");
for (const e of IDS) {
  const i = igBy.get(e.ig), y = ytBy.get(e.yt);
  const h = hoursSince(i?.timestamp || y?.publishedAt, ig.collectedAt);
  lines.push(`| ${e.ep} | ${e.title} | ${h == null ? "-" : h + "시간"} | ${i ? i.views : "-"} | ${i ? (i.ig_reels_avg_watch_time / 1000).toFixed(1) + "초" : "-"} | ${i ? `${i.saved}·${i.shares}` : "-"} | ${y ? y.views : "미반영"} | ${y ? y.averageViewPercentage.toFixed(0) + "%" : "미반영"} | ${y ? y.likes : "미반영"} | ${y ? y.subscribersGained : "미반영"} |`);
}
lines.push(`| 설명형 중앙값 | (인스타 ${explainerIg.length}·유튜브 ${explainerYt.length}편) | | ${med(explainerIg.map((r) => r.views))} | ${(med(explainerIg.map((r) => r.ig_reels_avg_watch_time)) / 1000).toFixed(1)}초 | ${med(explainerIg.map((r) => r.saved))}·${med(explainerIg.map((r) => r.shares))} | ${med(explainerYt.map((r) => r.views))} | ${med(explainerYt.map((r) => r.averageViewPercentage)).toFixed(0)}% | ${med(explainerYt.map((r) => r.likes))} | ${explainerYt.reduce((a, r) => a + r.subscribersGained, 0)}(합) |`);
lines.push("");
const block = lines.join("\n");
console.log(block);
if (printOnly) process.exit(0);

let cur = fs.existsSync(TRACKER) ? fs.readFileSync(TRACKER, "utf8") : "";
const head = lines[0];
if (cur.includes(head)) { console.log("\n(같은 수집 파일의 스냅샷이 이미 있어 덧붙이지 않음)"); process.exit(0); }
if (!cur) cur = "# 스토리형 편별 반응 추적\n\n> `scripts/story-performance-snapshot.mjs`가 수집된 인사이트로 구간을 덧붙인다. 새 편 게시 때 `_ai/story-performance-ids.json`에 ID를 추가한다. 결단형·현상형 비교는 유형 표(아래)를 직접 갱신한다.\n\n";
fs.writeFileSync(TRACKER, cur.trimEnd() + "\n\n" + block + "\n");
console.log(`\n덧붙임: ${TRACKER}`);
