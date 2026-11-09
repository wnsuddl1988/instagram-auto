/**
 * Vercel Blob 스토어 사용량 조회 전용 no-log 실행기(읽기 전용, list()만).
 *
 * run-owner-command-with-local-env-no-log.mjs 의 승인된 서브커맨드 화이트리스트를
 * 건드리지 않기 위해 별도 파일로 둔다. 원리는 동일하다: .env.local 에서
 * BLOB_READ_WRITE_TOKEN 값만 읽어 child 프로세스 env로 주입하고, 이 프로세스는
 * 그 값을 절대 출력·저장하지 않는다. check-vercel-blob-store-usage-list-only.mjs
 * (child)는 @vercel/blob list() 만 호출한다 — delete/put 없음.
 *
 * 목적: "Limits Exceeded"로 정지된 스토어 안에 어떤 파일이 얼마나 쌓여
 * 있는지 Owner가 삭제 여부를 판단할 수 있게 근거를 만든다(Owner 결정,
 * 2026-09-28) — 이 스크립트 자체는 아무것도 지우지 않는다.
 *
 * 사용:
 *   node scripts/run-owner-blob-usage-check-no-log.mjs --out-dir C:/tmp/blob-usage-check
 */

import { spawnSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SELF = fileURLToPath(import.meta.url);
const SCRIPTS_DIR = dirname(SELF);
const REPO_ROOT = resolve(SCRIPTS_DIR, "..");
const CHILD_SCRIPT = join(SCRIPTS_DIR, "check-vercel-blob-store-usage-list-only.mjs");

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
const outDir = getFlag("--out-dir") || "C:/tmp/blob-usage-check";
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
console.log("[owner-blob-usage-check-no-log] injecting BLOB_READ_WRITE_TOKEN into child env (value not printed).");
console.log(`[owner-blob-usage-check-no-log] env file: ${envFile}`);
console.log(`[owner-blob-usage-check-no-log] key present: ${present}`);

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

const result = spawnSync(
  process.execPath,
  [CHILD_SCRIPT, "--out-dir", outDir],
  { env: childEnv, stdio: "inherit", shell: false }
);

process.exit(result.status ?? 1);
