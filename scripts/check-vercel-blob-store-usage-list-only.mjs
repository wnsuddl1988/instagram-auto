/**
 * Vercel Blob 스토어 사용량 조회 전용(읽기 전용, list()만 호출).
 *
 * 목적: "Limits Exceeded"로 정지된 Blob 스토어 안에 어떤 파일이 얼마나
 * 쌓여있는지 확인한다. delete/put은 절대 호출하지 않는다 — 이미 배포된
 * 릴스·스토리가 참조하는 URL을 실수로 지우면 게시물이 깨지기 때문에,
 * 삭제 판단은 Owner가 Vercel 대시보드에서 직접 한다(Owner 결정,
 * 2026-09-28).
 *
 * 사용:
 *   node scripts/run-owner-command-with-local-env-no-log.mjs \
 *     blob-usage-list --out-dir C:/tmp/blob-usage-check
 */

import { list } from "@vercel/blob";
import fs from "node:fs";
import path from "node:path";

const argv = process.argv.slice(2);
function getArg(name) {
  const i = argv.indexOf(name);
  return i !== -1 && argv[i + 1] ? argv[i + 1] : null;
}

const OUT_DIR = getArg("--out-dir") || "C:/tmp/blob-usage-check";

if (!process.env.BLOB_READ_WRITE_TOKEN) {
  console.error("ABORT: BLOB_READ_WRITE_TOKEN 이 없습니다 (no-log 래퍼로 실행하세요).");
  process.exit(1);
}

fs.mkdirSync(OUT_DIR, { recursive: true });

let cursor;
const all = [];
let pageCount = 0;
do {
  const page = await list({ cursor, limit: 1000 });
  all.push(...page.blobs);
  cursor = page.cursor;
  pageCount += 1;
} while (cursor);

const totalBytes = all.reduce((sum, b) => sum + (b.size || 0), 0);

// pathname 최상위 prefix(캐릭터/카테고리)별로 묶어서 집계
const byPrefix = new Map();
for (const b of all) {
  const parts = b.pathname.split("/");
  const prefix = parts.slice(0, 2).join("/"); // e.g. "instagram/reels"
  const entry = byPrefix.get(prefix) || { count: 0, bytes: 0 };
  entry.count += 1;
  entry.bytes += b.size || 0;
  byPrefix.set(prefix, entry);
}

// contentId(3번째 segment)별 집계 — 어느 편인지 특정하기 위함
const byContentId = new Map();
for (const b of all) {
  const parts = b.pathname.split("/");
  const contentId = parts[2] || "(unknown)";
  const entry = byContentId.get(contentId) || { count: 0, bytes: 0, pathnames: [] };
  entry.count += 1;
  entry.bytes += b.size || 0;
  entry.pathnames.push(b.pathname);
  byContentId.set(contentId, entry);
}

const sortedByContentId = [...byContentId.entries()]
  .sort((a, b) => b[1].bytes - a[1].bytes)
  .map(([contentId, v]) => ({
    contentId,
    count: v.count,
    bytesMB: Number((v.bytes / 1024 / 1024).toFixed(2)),
  }));

const oldestFirst = [...all].sort(
  (a, b) => new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime()
);

const summary = {
  schemaVersion: "vercel_blob_store_usage_list_only_v1",
  totalBlobCount: all.length,
  totalBytes,
  totalMB: Number((totalBytes / 1024 / 1024).toFixed(2)),
  pageCount,
  byPrefix: Object.fromEntries(
    [...byPrefix.entries()].map(([k, v]) => [
      k,
      { count: v.count, bytesMB: Number((v.bytes / 1024 / 1024).toFixed(2)) },
    ])
  ),
  byContentIdSortedByBytesDesc: sortedByContentId,
  oldest10: oldestFirst.slice(0, 10).map((b) => ({
    pathname: b.pathname,
    uploadedAt: b.uploadedAt,
    sizeMB: Number(((b.size || 0) / 1024 / 1024).toFixed(2)),
  })),
  newest10: oldestFirst.slice(-10).map((b) => ({
    pathname: b.pathname,
    uploadedAt: b.uploadedAt,
    sizeMB: Number(((b.size || 0) / 1024 / 1024).toFixed(2)),
  })),
};

const outPath = path.join(OUT_DIR, "blob-usage-summary.json");
fs.writeFileSync(outPath, JSON.stringify(summary, null, 2));

const allListPath = path.join(OUT_DIR, "blob-usage-full-list.json");
fs.writeFileSync(
  allListPath,
  JSON.stringify(
    all.map((b) => ({
      pathname: b.pathname,
      uploadedAt: b.uploadedAt,
      sizeMB: Number(((b.size || 0) / 1024 / 1024).toFixed(2)),
      url: b.url,
    })),
    null,
    2
  )
);

console.log("");
console.log("╔══════════════════════════════════════════════════════════════╗");
console.log("║   Vercel Blob Store Usage (list-only, no delete)                ║");
console.log("╚══════════════════════════════════════════════════════════════╝");
console.log("");
console.log(`  totalBlobCount:  ${summary.totalBlobCount}`);
console.log(`  totalMB:         ${summary.totalMB}`);
console.log("");
console.log("  byPrefix:");
for (const [k, v] of Object.entries(summary.byPrefix)) {
  console.log(`    ${k}: ${v.count}개, ${v.bytesMB}MB`);
}
console.log("");
console.log("  contentId별 용량(큰 순서, 상위 15개):");
for (const item of summary.byContentIdSortedByBytesDesc.slice(0, 15)) {
  console.log(`    ${item.contentId}: ${item.count}개, ${item.bytesMB}MB`);
}
console.log("");
console.log(`  전체 목록: ${allListPath}`);
console.log(`  요약: ${outPath}`);
