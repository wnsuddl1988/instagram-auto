/**
 * Vercel Blob 스토어 정리 — "게시 완료 후 N일 지난 콘텐츠"의 Blob만 삭제.
 *
 * 배경: "instagram-auto-instagram-media-prod" Blob 스토어가 Hobby 플랜 사용량
 * 한도 초과로 자주 정지된다(2026-09-28). Instagram/YouTube는 업로드 시점에
 * 원본을 자기 서버로 복사해가므로, 실제로 게시가 끝난 콘텐츠의 Blob 원본은
 * 지워도 이미 올라간 게시물에 영향이 없다(Owner 확인, 2026-09-28: "이미 올린건
 * 문제없다며").
 *
 * 판정 기준(Owner 확정, 2026-09-28): "Blob 업로드 시각"이 아니라 **"실제 게시
 * 완료 시각"** 기준 N일 경과다. 배포 전 재고(아직 게시 안 한 콘텐츠)의 Blob을
 * 실수로 지우면 재업로드해야 하므로, 반드시 `C:/tmp/**\/owl-instagram-publish-result.json`
 * / `owl-youtube-publish-result.json`에 성공 기록(`status: "PUBLISHED"|"UPLOADED"`)이
 * 있고 그 `finishedAt`이 N일 넘게 지난 contentId만 대상으로 삼는다. 인스타/유튜브
 * 둘 다 게시 기록이 있어야 안전하지만, 한쪽만 배포하는 캐릭터(현재는 없음)를
 * 고려해 --require-both(기본 true)로 조절 가능하게 둔다.
 *
 * 사용:
 *   1) 무엇이 지워질지 먼저 확인(삭제 안 함, 기본값):
 *      node scripts/run-owner-blob-retention-cleanup-no-log.mjs --publish-glob-root C:/tmp --days 2
 *   2) 실제로 지우기:
 *      node scripts/run-owner-blob-retention-cleanup-no-log.mjs --publish-glob-root C:/tmp --days 2 --confirm-delete
 */

import { list, del } from "@vercel/blob";
import fs from "node:fs";
import path from "node:path";

const argv = process.argv.slice(2);
function getArg(name) {
  const i = argv.indexOf(name);
  return i !== -1 && argv[i + 1] ? argv[i + 1] : null;
}
const CONFIRM_DELETE = argv.includes("--confirm-delete");
const PUBLISH_ROOT = getArg("--publish-glob-root") || "C:/tmp";
const DAYS = getArg("--days") ? Number(getArg("--days")) : 2;
const OUT_DIR = getArg("--out-dir") || "C:/tmp/blob-retention-cleanup";
const REQUIRE_BOTH = !argv.includes("--no-require-both");

if (!process.env.BLOB_READ_WRITE_TOKEN) {
  console.error("ABORT: BLOB_READ_WRITE_TOKEN 이 없습니다 (no-log 래퍼로 실행하세요).");
  process.exit(1);
}
if (!Number.isFinite(DAYS) || DAYS <= 0) {
  console.error("ABORT: --days 는 양수여야 합니다.");
  process.exit(1);
}

fs.mkdirSync(OUT_DIR, { recursive: true });

// ── 1단계: C:/tmp 아래 모든 owl-instagram-publish-result.json / owl-youtube-publish-result.json 스캔 ──
function findPublishResults(root) {
  const found = [];
  let entries;
  try {
    entries = fs.readdirSync(root, { withFileTypes: true });
  } catch {
    return found;
  }
  for (const entry of entries) {
    const full = path.join(root, entry.name);
    if (entry.isDirectory()) {
      // 얕은 재귀(1단계 하위만) — 기존 배포 산출물은 전부 C:/tmp/<폴더>/owl-*-publish-result.json 구조라 충분.
      let subEntries;
      try {
        subEntries = fs.readdirSync(full, { withFileTypes: true });
      } catch {
        continue;
      }
      for (const sub of subEntries) {
        if (sub.isFile() && (sub.name === "owl-instagram-publish-result.json" || sub.name === "owl-youtube-publish-result.json")) {
          found.push(path.join(full, sub.name));
        }
      }
    }
  }
  return found;
}

function readJsonSafe(p) {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return null;
  }
}

const resultFiles = findPublishResults(PUBLISH_ROOT);
const now = Date.now();
const cutoffMs = DAYS * 24 * 60 * 60 * 1000;

// contentId -> { instagram: {status, finishedAt} | null, youtube: {...} | null }
const byContentId = new Map();
for (const filePath of resultFiles) {
  const data = readJsonSafe(filePath);
  if (!data || !data.contentId) continue;
  const platform = filePath.endsWith("owl-instagram-publish-result.json") ? "instagram" : "youtube";
  const entry = byContentId.get(data.contentId) || {};
  const success = platform === "instagram" ? data.status === "PUBLISHED" : data.status === "UPLOADED";
  const existing = entry[platform];
  // 같은 contentId가 여러 폴더에 걸쳐 있을 수 있으므로(재시도 등) 가장 최근 finishedAt을 쓴다.
  if (!existing || (success && new Date(data.finishedAt).getTime() > new Date(existing.finishedAt || 0).getTime())) {
    entry[platform] = { status: data.status, finishedAt: data.finishedAt, success, sourceFile: filePath };
  }
  byContentId.set(data.contentId, entry);
}

const eligibleContentIds = [];
for (const [contentId, entry] of byContentId.entries()) {
  const ig = entry.instagram;
  const yt = entry.youtube;
  const igOk = ig?.success === true;
  const ytOk = yt?.success === true;
  if (REQUIRE_BOTH && !(igOk && ytOk)) continue;
  if (!REQUIRE_BOTH && !igOk && !ytOk) continue;

  const finishedTimes = [ig?.success ? new Date(ig.finishedAt).getTime() : null, yt?.success ? new Date(yt.finishedAt).getTime() : null].filter(
    (t) => Number.isFinite(t)
  );
  if (finishedTimes.length === 0) continue;
  // 둘 다 요구하는 경우 "더 늦게 끝난 쪽" 기준으로 N일을 센다(둘 다 게시 완료된 시점부터).
  const latestFinishedAt = Math.max(...finishedTimes);
  if (now - latestFinishedAt >= cutoffMs) {
    eligibleContentIds.push({ contentId, latestFinishedAt: new Date(latestFinishedAt).toISOString(), instagram: ig, youtube: yt });
  }
}

console.log("");
console.log("Vercel Blob Published-Retention Cleanup — " + (CONFIRM_DELETE ? "DELETE MODE" : "DRY RUN (no delete)"));
console.log("");
console.log(`  publish-result.json 스캔 루트: ${PUBLISH_ROOT}`);
console.log(`  스캔된 결과 파일: ${resultFiles.length}개, 고유 contentId: ${byContentId.size}개`);
console.log(`  게시완료 기준: 인스타+유튜브 둘 다 성공 = ${REQUIRE_BOTH}, 기준일수: ${DAYS}일`);
console.log(`  삭제 대상 contentId: ${eligibleContentIds.length}개`);
for (const item of eligibleContentIds) {
  console.log(`    ${item.contentId} (게시완료 ${item.latestFinishedAt})`);
}

if (eligibleContentIds.length === 0) {
  console.log("");
  console.log("  삭제 대상 없음 — 종료.");
  const emptyReport = { schemaVersion: "blob_published_retention_cleanup_v1", eligibleContentIds: [], blobTargets: [] };
  fs.writeFileSync(path.join(OUT_DIR, "cleanup-report.json"), JSON.stringify(emptyReport, null, 2));
  process.exit(0);
}

// ── 2단계: Blob 전체 목록에서 eligible contentId에 해당하는 pathname만 매칭 ──
let cursor;
const allBlobs = [];
do {
  const page = await list({ cursor, limit: 1000 });
  allBlobs.push(...page.blobs);
  cursor = page.cursor;
} while (cursor);

const eligibleIds = new Set(eligibleContentIds.map((e) => e.contentId));
const blobTargets = allBlobs.filter((b) => {
  const parts = b.pathname.split("/");
  const contentId = parts[2];
  return eligibleIds.has(contentId);
});

const targetBytes = blobTargets.reduce((sum, b) => sum + (b.size || 0), 0);
console.log("");
console.log(`  매칭된 Blob 파일: ${blobTargets.length}개, 총 ${(targetBytes / 1024 / 1024).toFixed(2)}MB`);
for (const b of blobTargets) {
  console.log(`    ${b.uploadedAt}  ${((b.size || 0) / 1024 / 1024).toFixed(2)}MB  ${b.pathname}`);
}

const report = {
  schemaVersion: "blob_published_retention_cleanup_v1",
  ranAt: new Date().toISOString(),
  days: DAYS,
  requireBoth: REQUIRE_BOTH,
  eligibleContentIds,
  blobTargets: blobTargets.map((b) => ({ pathname: b.pathname, uploadedAt: b.uploadedAt, sizeMB: Number(((b.size || 0) / 1024 / 1024).toFixed(2)), url: b.url })),
};
fs.writeFileSync(path.join(OUT_DIR, "cleanup-report.json"), JSON.stringify(report, null, 2));

if (!CONFIRM_DELETE) {
  console.log("");
  console.log("  DRY RUN — 삭제하지 않았습니다. 위 목록을 확인한 뒤 --confirm-delete 로 재실행하세요.");
  process.exit(0);
}

console.log("");
console.log("  삭제 실행 중...");
const deleteResults = [];
for (const b of blobTargets) {
  try {
    await del(b.url);
    deleteResults.push({ pathname: b.pathname, status: "deleted" });
    console.log(`    deleted: ${b.pathname}`);
  } catch (err) {
    deleteResults.push({ pathname: b.pathname, status: "error", message: String(err?.message || err) });
    console.log(`    ERROR: ${b.pathname} — ${String(err?.message || err)}`);
  }
}

const deletedCount = deleteResults.filter((r) => r.status === "deleted").length;
fs.writeFileSync(path.join(OUT_DIR, "cleanup-delete-result.json"), JSON.stringify(deleteResults, null, 2));
console.log("");
console.log(`  완료: ${deletedCount}/${blobTargets.length}개 삭제, 확보 ${(targetBytes / 1024 / 1024).toFixed(2)}MB`);
console.log(`  보고서: ${path.join(OUT_DIR, "cleanup-report.json")}`);
