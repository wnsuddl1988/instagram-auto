/**
 * Vercel Blob 스토어 정리 — 가장 오래된 파일부터 지정 개수/용량만큼만 삭제.
 *
 * 배경: "instagram-auto-instagram-media-prod" Blob 스토어가 사용량 한도
 * 초과(Limits Exceeded)로 정지돼 신규 업로드가 막힘(2026-09-28). 이미
 * 게시 완료된 릴스/스토리는 Meta·YouTube가 업로드 시점에 자체 서버로
 * 파일을 복사해가므로, 원본 Blob을 지워도 게시물 자체에는 영향이 없다.
 * 정확히 어떤 파일이 게시 완료됐는지 하나하나 대조하려면 시간이 걸리므로,
 * Owner 결정(2026-09-28)에 따라 "가장 오래된 것부터" 순서로 지정된
 * 개수/용량만큼만 지운다 — 오래된 것일수록 게시 절차가 끝났을 가능성이
 * 가장 높다.
 *
 * 안전장치:
 * - list()만으로 먼저 대상 목록을 만들고, 반드시 --dry-run(기본값)으로
 *   무엇을 지울지 먼저 출력한다. 실제 삭제는 --confirm-delete 를 명시해야
 *   실행된다.
 * - --max-count 또는 --min-free-mb 중 하나로 목표를 지정한다(둘 다 주면
 *   먼저 도달하는 조건에서 멈춘다).
 * - del()은 한 번에 하나씩 순차 호출하고, 각 삭제 결과를 로그로 남긴다.
 *
 * 사용(직접, Owner 터미널):
 *   1) 먼저 무엇이 지워질지 확인(삭제 안 함):
 *      node scripts/run-owner-blob-cleanup-no-log.mjs --min-free-mb 300
 *   2) 실제로 지우기:
 *      node scripts/run-owner-blob-cleanup-no-log.mjs --min-free-mb 300 --confirm-delete
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
const MAX_COUNT = getArg("--max-count") ? Number(getArg("--max-count")) : null;
const MIN_FREE_MB = getArg("--min-free-mb") ? Number(getArg("--min-free-mb")) : null;
const OUT_DIR = getArg("--out-dir") || "C:/tmp/blob-cleanup";

if (!process.env.BLOB_READ_WRITE_TOKEN) {
  console.error("ABORT: BLOB_READ_WRITE_TOKEN 이 없습니다 (no-log 래퍼로 실행하세요).");
  process.exit(1);
}
if (!MAX_COUNT && !MIN_FREE_MB) {
  console.error("ABORT: --max-count 또는 --min-free-mb 중 하나는 필요합니다.");
  process.exit(1);
}

fs.mkdirSync(OUT_DIR, { recursive: true });

let cursor;
const all = [];
do {
  const page = await list({ cursor, limit: 1000 });
  all.push(...page.blobs);
  cursor = page.cursor;
} while (cursor);

const oldestFirst = [...all].sort(
  (a, b) => new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime()
);

const targets = [];
let freedBytes = 0;
for (const b of oldestFirst) {
  if (MAX_COUNT && targets.length >= MAX_COUNT) break;
  if (MIN_FREE_MB && freedBytes / 1024 / 1024 >= MIN_FREE_MB) break;
  targets.push(b);
  freedBytes += b.size || 0;
}

console.log("");
console.log("Vercel Blob Oldest Cleanup — " + (CONFIRM_DELETE ? "DELETE MODE" : "DRY RUN (no delete)"));
console.log("");
console.log(`  total blobs in store: ${all.length}`);
console.log(`  target count:         ${targets.length}`);
console.log(`  target freed MB:      ${(freedBytes / 1024 / 1024).toFixed(2)}`);
console.log("");
console.log("  targets (oldest first):");
for (const t of targets) {
  console.log(`    ${t.uploadedAt}  ${((t.size || 0) / 1024 / 1024).toFixed(2)}MB  ${t.pathname}`);
}

const planPath = path.join(OUT_DIR, "cleanup-target-list.json");
fs.writeFileSync(
  planPath,
  JSON.stringify(
    targets.map((t) => ({ pathname: t.pathname, uploadedAt: t.uploadedAt, sizeMB: Number(((t.size || 0) / 1024 / 1024).toFixed(2)), url: t.url })),
    null,
    2
  )
);
console.log("");
console.log(`  target list saved: ${planPath}`);

if (!CONFIRM_DELETE) {
  console.log("");
  console.log("  DRY RUN — 삭제하지 않았습니다. 위 목록을 확인한 뒤 --confirm-delete 로 재실행하세요.");
  process.exit(0);
}

console.log("");
console.log("  삭제 실행 중...");
const results = [];
for (const t of targets) {
  try {
    await del(t.url);
    results.push({ pathname: t.pathname, status: "deleted" });
    console.log(`    deleted: ${t.pathname}`);
  } catch (err) {
    results.push({ pathname: t.pathname, status: "error", message: String(err?.message || err) });
    console.log(`    ERROR: ${t.pathname} — ${String(err?.message || err)}`);
  }
}

const resultPath = path.join(OUT_DIR, "cleanup-result.json");
fs.writeFileSync(resultPath, JSON.stringify(results, null, 2));
const deletedCount = results.filter((r) => r.status === "deleted").length;
console.log("");
console.log(`  완료: ${deletedCount}/${targets.length}개 삭제, 확보 ${(freedBytes / 1024 / 1024).toFixed(2)}MB`);
console.log(`  결과: ${resultPath}`);
