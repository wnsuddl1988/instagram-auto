/**
 * Vercel Blob "게시완료 후 N일" 정리 no-log 실행기.
 *
 * run-vercel-blob-published-retention-cleanup.mjs 를 BLOB_READ_WRITE_TOKEN 만
 * 주입해서 실행한다. 기본은 dry-run(삭제 없음) — 실제 삭제는 --confirm-delete.
 *
 * 스케줄 태스크(매일 자동 실행)로 등록될 때도 이 파일이 진입점이다. dry-run이
 * 아니라 --confirm-delete로 매일 자동 실행되므로, child 스크립트 쪽의 판정
 * 로직(게시 성공 + N일 경과)이 유일한 안전장치다 — 이 로직을 건드릴 때는
 * 반드시 먼저 --confirm-delete 없이 실행해 대상 목록을 눈으로 확인할 것.
 *
 * 사용:
 *   node scripts/run-owner-blob-retention-cleanup-no-log.mjs --days 2 [--confirm-delete]
 */

import { spawnSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SELF = fileURLToPath(import.meta.url);
const SCRIPTS_DIR = dirname(SELF);
const REPO_ROOT = resolve(SCRIPTS_DIR, "..");
const CHILD_SCRIPT = join(SCRIPTS_DIR, "run-vercel-blob-published-retention-cleanup.mjs");

const SAFE_CHILD_OS_ENV_KEYS = Object.freeze([
  "SystemRoot", "windir", "SystemDrive", "PATH", "Path", "PATHEXT", "COMSPEC",
  "TEMP", "TMP", "NUMBER_OF_PROCESSORS", "PROCESSOR_ARCHITECTURE",
]);

const APPROVED_KEY = "BLOB_READ_WRITE_TOKEN";

const args = process.argv.slice(2);
function getFlag(flag) {
  const i = args.indexOf(flag);
  return i !== -1 && i + 1 < args.length ? args[i + 1] : null;
}
const envFile = getFlag("--env-path") || join(REPO_ROOT, ".env.local");

function loadApprovedKey(envFilePath, keyName) {
  if (!envFilePath || !existsSync(envFilePath)) return { present: false, value: null };
  let raw = "";
  try {
    raw = readFileSync(envFilePath, "utf8");
  } catch {
    return { present: false, value: null };
  }
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed === "" || trimmed.startsWith("#")) continue;
    const withoutExport = trimmed.startsWith("export ") ? trimmed.slice(7).trim() : trimmed;
    const eq = withoutExport.indexOf("=");
    if (eq <= 0) continue;
    const key = withoutExport.slice(0, eq).trim();
    if (key !== keyName) continue;
    let value = withoutExport.slice(eq + 1).trim();
    if (
      value.length >= 2 &&
      ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'")))
    ) {
      value = value.slice(1, -1);
    }
    if (value !== "") return { present: true, value };
  }
  return { present: false, value: null };
}

const { present, value } = loadApprovedKey(envFile, APPROVED_KEY);
console.log("[owner-blob-retention-cleanup-no-log] injecting BLOB_READ_WRITE_TOKEN into child env (value not printed).");
console.log(`[owner-blob-retention-cleanup-no-log] env file: ${envFile}`);
console.log(`[owner-blob-retention-cleanup-no-log] key present: ${present}`);

if (!present) {
  console.error("ABORT: BLOB_READ_WRITE_TOKEN 이 .env.local 에 없습니다.");
  process.exit(1);
}

const childEnv = Object.create(null);
for (const name of SAFE_CHILD_OS_ENV_KEYS) {
  const v = process.env[name];
  if (typeof v === "string") childEnv[name] = v;
}
childEnv[APPROVED_KEY] = value;

const passthroughArgs = args.filter((a, i) => {
  if (a === "--env-path") return false;
  if (args[i - 1] === "--env-path") return false;
  return true;
});

const result = spawnSync(
  process.execPath,
  [CHILD_SCRIPT, ...passthroughArgs],
  { env: childEnv, stdio: "inherit", shell: false }
);

process.exit(result.status ?? 1);
