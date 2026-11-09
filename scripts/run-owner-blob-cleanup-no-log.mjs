/**
 * Vercel Blob 정리(오래된 것부터) no-log 실행기 — Owner가 터미널에서 직접 실행.
 *
 * run-vercel-blob-oldest-cleanup-once.mjs(list+선택 삭제)를 BLOB_READ_WRITE_TOKEN
 * 만 주입해서 실행한다. 기본은 dry-run(삭제 없음, 무엇을 지울지 목록만 출력) —
 * 실제 삭제는 --confirm-delete 를 명시해야 한다.
 *
 * Claude Code 세션은 "클라우드 스토리지 대량 삭제"로 이 실행이 자동 차단되므로,
 * Owner가 터미널에서 직접 실행해야 한다(2026-09-28).
 *
 * 사용:
 *   1) 먼저 무엇이 지워질지 확인(삭제 안 함):
 *      node scripts/run-owner-blob-cleanup-no-log.mjs --min-free-mb 300
 *   2) 목록을 보고 문제없으면 실제 삭제:
 *      node scripts/run-owner-blob-cleanup-no-log.mjs --min-free-mb 300 --confirm-delete
 */

import { spawnSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SELF = fileURLToPath(import.meta.url);
const SCRIPTS_DIR = dirname(SELF);
const REPO_ROOT = resolve(SCRIPTS_DIR, "..");
const CHILD_SCRIPT = join(SCRIPTS_DIR, "run-vercel-blob-oldest-cleanup-once.mjs");

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
console.log("[owner-blob-cleanup-no-log] injecting BLOB_READ_WRITE_TOKEN into child env (value not printed).");
console.log(`[owner-blob-cleanup-no-log] env file: ${envFile}`);
console.log(`[owner-blob-cleanup-no-log] key present: ${present}`);

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

// --env-path 는 child 로 넘기지 않는다(child 스크립트가 모르는 인자).
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
