#!/usr/bin/env node

/**
 * Instagram 게시물(미디어) 삭제 러너 — 1회성, 승인 게이트, fail-closed.
 *
 * task: owl-instagram-media-delete-once-v1
 * 승인 토큰: APPROVE_OWL_INSTAGRAM_MEDIA_DELETE_ONCE
 *
 * 2026-09-20 신설 배경: 카드뉴스 표지(4:5)를 그대로 Story(9:16)에 올렸다가
 * 좌우 크롭으로 텍스트가 잘리는 문제가 발생해, 잘못 게시된 스토리를 삭제하고
 * 올바른 9:16 이미지로 재게시해야 했다. Graph API DELETE는 영구 삭제이며
 * 되돌릴 수 없으므로 --media-id를 인자로 명시하고 --arm 없이는 실행하지
 * 않는다.
 *
 * 안전 원칙:
 * - Instagram 전용.
 * - **cap 정확히 1**: 삭제 시도 직전에 시도 기록을 먼저 남긴다. 같은
 *   --media-id에 대해 재실행하면 차단한다(실수로 두 번 삭제 명령을 보내는
 *   것 자체는 API 입장에서 무해하지만, 의도치 않은 다른 미디어 삭제 방지를
 *   위해 동일한 out-dir 재사용을 막는다).
 * - 시크릿은 process.env 에서만 받는다. 값은 로그에 남기지 않는다.
 * - --arm 없으면 삭제 대상 정보만 출력하고 실제 DELETE 호출은 하지 않는다.
 *
 * 사용:
 *   node scripts/run-owl-instagram-media-delete-once.mjs \
 *     --approval APPROVE_OWL_INSTAGRAM_MEDIA_DELETE_ONCE \
 *     --media-id <mediaId> \
 *     --out-dir <저장소 밖 경로> [--arm]
 */

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const APPROVAL_TOKEN = "APPROVE_OWL_INSTAGRAM_MEDIA_DELETE_ONCE";
const GRAPH_BASE = "https://graph.facebook.com/v25.0";
const ATTEMPT_FILENAME = "owl-instagram-media-delete-attempt.json";
const RESULT_FILENAME = "owl-instagram-media-delete-result.json";

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
    .replace(/access_token=[^&\s"]+/gi, "access_token=REDACTED")
    .replace(/EAA[A-Za-z0-9]+/g, "REDACTED")
    .slice(0, 500);
}

// ── 게이트 1: 승인 토큰 ──────────────────────────────────────────────────────
if (getArg("--approval") !== APPROVAL_TOKEN) {
  abort("approval_token_mismatch", "정확한 승인 토큰이 필요합니다.");
}

// ── 게이트 2: 인자·경로 ──────────────────────────────────────────────────────
const mediaId = getArg("--media-id");
const outDirArg = getArg("--out-dir");
if (!mediaId || !/^[0-9]+$/.test(mediaId)) {
  abort("media_id_invalid", "--media-id 는 숫자로만 이루어진 값이어야 합니다.");
}
if (!outDirArg) {
  abort("missing_required_args", "--out-dir 필수");
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
    "delete_attempt_already_recorded",
    `이미 삭제를 시도한 기록이 있습니다: ${attemptPath}. 실수 방지를 위해 차단합니다.`,
  );
}

console.log(`[owl-media-delete] mediaId: ${mediaId}`);

// ── 게이트 4: --arm 없으면 여기서 종료 ───────────────────────────────────────
if (!armed) {
  mkdirSync(outDir, { recursive: true });
  writeFileSync(
    join(outDir, "owl-instagram-media-delete-preflight.json"),
    JSON.stringify({
      schemaVersion: "owl_instagram_media_delete_preflight_v1",
      mediaId,
      armed: false,
      checkedAt: new Date().toISOString(),
    }, null, 2) + "\n",
    "utf8",
  );
  console.log("[owl-media-delete] --arm 이 없어 삭제하지 않았습니다(준비 확인만 완료).");
  process.exit(0);
}

// ── 게이트 5: 시크릿 존재 확인 ────────────────────────────────────────────────
const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
if (!accessToken) {
  abort(
    "instagram_credentials_absent",
    "INSTAGRAM_ACCESS_TOKEN 이 주입되지 않았습니다(no-log 래퍼로 실행하세요).",
  );
}

// ── 게이트 6: 시도 기록 ──────────────────────────────────────────────────────
mkdirSync(outDir, { recursive: true });
writeFileSync(
  attemptPath,
  JSON.stringify({
    schemaVersion: "owl_instagram_media_delete_attempt_v1",
    mediaId,
    attemptedAt: new Date().toISOString(),
    note: "삭제 호출 직전에 기록됨. 이 파일이 있으면 재실행이 차단된다.",
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

// ── 1) 삭제 실행 ─────────────────────────────────────────────────────────────
console.log("[owl-media-delete] 삭제 요청 중…");
const deleteResponse = await fetch(
  `${GRAPH_BASE}/${encodeURIComponent(mediaId)}?access_token=${encodeURIComponent(accessToken)}`,
  { method: "DELETE", redirect: "error", signal: AbortSignal.timeout(30_000) },
);
const deleteData = await graphJson(deleteResponse);
const success = deleteData?.success === true;

const payload = {
  schemaVersion: "owl_instagram_media_delete_result_v1",
  mediaId,
  status: success ? "DELETED" : "DELETE_FAILED",
  httpStatus: deleteResponse.status,
  raw: sanitize(JSON.stringify(deleteData)),
  finishedAt: new Date().toISOString(),
};
writeFileSync(resultPath, JSON.stringify(payload, null, 2) + "\n", "utf8");

if (!success) {
  abort("delete_failed", payload.raw);
}

console.log("");
console.log("═".repeat(60));
console.log("  삭제 완료");
console.log(`  mediaId: ${mediaId}`);
console.log(`  결과 기록: ${resultPath}`);
console.log("═".repeat(60));
