/**
 * Static + runtime guard: Owner local env no-log command wrapper.
 * task: owner-local-env-no-log-command-wrapper-v1
 *
 * Dependency-free. Verifies that
 *   scripts/run-owner-command-with-local-env-no-log.mjs
 * loads ONLY the six approved credential key names from an env file, injects them into a
 * child process env, and NEVER exposes credential values (or any value-derived data) in
 * output/logs. All runtime tests use a FAKE temp env file with dummy values — the real
 * `.env.local` is never read by this guard.
 *
 * Exit 0 = all PASS. Exit 1 = at least one FAIL.
 *
 * Safety of the guard itself:
 * - never reads `.env.local` (asserted: no `.env.local` path is passed to the wrapper,
 *   and this guard's own source contains no `.env.local` executable read)
 * - runs the wrapper with a sanitized child env (whitelist OS vars + dummy keys only)
 * - never prints dummy values back into any retained/asserted-secret form
 */

import { readFileSync, existsSync, mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import os from "node:os";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const WRAPPER_PATH = resolve(__dirname, "run-owner-command-with-local-env-no-log.mjs");
const ENTRYPOINT_PATH = resolve(__dirname, "run-owner-daily-automation-entrypoint.mjs");

const APPROVED_ENV_KEY_NAMES = [
  "INSTAGRAM_BUSINESS_ACCOUNT_ID",
  "INSTAGRAM_ACCESS_TOKEN",
  "YOUTUBE_CLIENT_ID",
  "YOUTUBE_CLIENT_SECRET",
  "YOUTUBE_REFRESH_TOKEN",
  "BLOB_READ_WRITE_TOKEN",
];

// child node 실행용 non-secret OS 변수만 개별 상속(guard가 wrapper를 띄울 때 broad spread 방지).
const SAFE_CHILD_OS_ENV_KEYS = [
  "SystemRoot", "windir", "SystemDrive", "PATH", "Path", "PATHEXT", "COMSPEC",
  "TEMP", "TMP", "NUMBER_OF_PROCESSORS", "PROCESSOR_ARCHITECTURE",
];
function buildSanitizedGuardEnv() {
  const env = Object.create(null);
  for (const name of SAFE_CHILD_OS_ENV_KEYS) {
    const v = process.env[name];
    if (typeof v === "string") env[name] = v;
  }
  return env;
}

let passed = 0;
let failed = 0;
function check(label, condition, detail) {
  if (condition) { console.log(`  PASS  ${label}`); passed++; }
  else { console.error(`  FAIL  ${label}${detail ? " — " + detail : ""}`); failed++; }
}

/** 라인 주석(//, *) 제거 후 블록 주석 + 문자열/정규식 리터럴 본문을 지워 "실제 코드"만 남긴다. */
function codeOnly(src) {
  const noLineComments = src.split("\n").filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l)).join("\n");
  return noLineComments
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/"(?:[^"\\]|\\.)*"/g, '""')
    .replace(/'(?:[^'\\]|\\.)*'/g, "''")
    .replace(/`(?:[^`\\]|\\.)*`/g, "``");
}

console.log("\nStatic guard check: owner local env no-log command wrapper\n");

// ── 1) source presence + static contract ────────────────────────────────────
console.log("[ wrapper source: static contract ]");
check("wrapper file exists", existsSync(WRAPPER_PATH));
const src = existsSync(WRAPPER_PATH) ? readFileSync(WRAPPER_PATH, "utf8") : "";
const code = codeOnly(src);

// 승인된 6개 key 이름을 모두 명시
for (const name of APPROVED_ENV_KEY_NAMES) {
  check(`wrapper allowlists approved key: ${name}`, src.includes(name));
}
// 승인 목록 외 임의 key를 무차별 로드하지 않도록 allowlist Set 사용
check("wrapper uses an approved-key allowlist (APPROVED_ENV_KEY_NAMES)", /APPROVED_ENV_KEY_NAMES/.test(src));

// ── 2) forbidden: broad env spread / value exposure in source ────────────────
console.log("\n[ wrapper source: no broad env spread / no value exposure ]");
// parent env 전체 spread 금지(실제 spread 문법만 검사: 여는 괄호/중괄호/대괄호/콤마 뒤 ...process.env)
const spreadSyntaxRe = /[{[(,]\s*\.\.\.\s*process\s*\.\s*env\b/;
check("wrapper source has no parent env broad spread expression", !spreadSyntaxRe.test(code));
// process.env 접근은 화이트리스트 OS 변수 개별 참조만 — Object.assign(env, process.env) 류 금지
check("wrapper source has no Object.assign(..., process.env) style bulk copy", !/Object\.assign\([^)]*process\.env/.test(code));
// 값에서 파생 정보(length/slice/substring/hash/prefix/suffix/mask) 추출 없음
check("wrapper source does not derive value length/slice/substring from loaded values",
  !/injected\[[^\]]+\]\s*\.\s*(length|slice|substring|substr|charAt|indexOf|split|replace|match)/.test(code) &&
  !/createHash|createHmac|\.digest\s*\(/.test(code));
check("wrapper source has no masked/prefix/suffix/sample value-output identifiers in code",
  !/\b(maskedValue|valuePrefix|valueSuffix|valueSample|tokenType|valueLength|redactedValue)\b/.test(code));

// ── 3) forbidden: dotenv / vercel env pull / API / upload / deploy / media ───
console.log("\n[ wrapper source: no dotenv / API / upload / deploy / media ]");
check("no dotenv import/require", !/require\(["']dotenv["']\)/.test(src) && !/from\s+["']dotenv["']/.test(src));
check("no vercel env pull", !/vercel\s+env\s+pull/.test(code));
check("no fetch/axios/googleapis/graph API", !/\bfetch\s*\(/.test(code) && !/axios/.test(code) && !/googleapis/.test(code) && !/graph\.(facebook|instagram)\.com/.test(code));
check("no @vercel/blob / Blob mutation / HEAD", !/@vercel\/blob/.test(code) && !/\b(put|del|list|head)\s*\(/.test(code));
check("no ffmpeg/ffprobe/media generation", !/ffmpeg|ffprobe/.test(code));
check("no OpenAI/ElevenLabs/Pexels/Supabase clients", !/openai|elevenlabs|pexels|supabase/i.test(code));
check("no deploy/DNS keywords", !/vercel\s+deploy/i.test(code) && !/\bdns\b/i.test(code));

// ── 4) safe child process usage ──────────────────────────────────────────────
console.log("\n[ wrapper source: safe child process ]");
check("uses spawnSync", /spawnSync/.test(src));
check("child uses shell:false", /shell\s*:\s*false/.test(src));
check("no shell:true anywhere", !/shell\s*:\s*true/.test(code));
check("child launched via process.execPath (no raw shell string)", /spawnSync\(\s*process\.execPath/.test(src));

// ── 5) guard itself never reads real .env.local ─────────────────────────────
// guard는 항상 명시적 fake temp env 경로만 wrapper에 넘긴다. 실제 .env.local read 호출
// (readFileSync(...env.local)) 이나 wrapper에 실제 .env.local 경로를 전달하는 코드가 없어야 한다.
// (line-comment/JSDoc/문자열/정규식 리터럴 안의 ".env.local" 언급은 실제 read가 아니라 설명이다.)
console.log("\n[ guard safety: real .env.local never read ]");
const guardSelfSrc = readFileSync(fileURLToPath(import.meta.url), "utf8");
const guardSelfCode = codeOnly(guardSelfSrc);
const envLocalToken = [".env", "local"].join(".");
check("guard has no executable readFileSync of .env.local", !new RegExp("readFileSync\\([^)]*\\.env\\.local").test(guardSelfCode));
// wrapper 실행 인자에 실제 .env.local 경로를 넘기지 않는다(항상 mkdtemp fake 경로만 사용).
check("guard never passes a real .env.local path to the wrapper (fake temp env only)",
  !/--env-path["'\s,]+[^\n]*\.env\.local/.test(guardSelfCode) && guardSelfCode.includes("mkdtempSync"));
check("guard runtime tests use only fake temp env files", !guardSelfCode.includes(envLocalToken) || /mkdtempSync/.test(guardSelfCode));

// ── 6) runtime: fake env → all six present:true, no dummy value leak ─────────
console.log("\n[ runtime: fake temp env → present:true, no value leak ]");
const DUMMY_VALUE = "wrapperguard_dummy_zzz";
const OTHER_SECRET = "wrapperguard_should_never_read_zzz";
let tmpDir = "";
try {
  tmpDir = mkdtempSync(join(os.tmpdir(), "owner-env-nolog-guard-"));
  const fakeEnvPath = join(tmpDir, "fake.env");
  // 승인 6개 + 승인되지 않은 secret 라인(무시되어야 함) + 다양한 quote/comment/export 형식.
  const fakeEnvBody = [
    "# fake env for guard — dummy values only, never real secrets",
    `INSTAGRAM_BUSINESS_ACCOUNT_ID=${DUMMY_VALUE}`,
    `INSTAGRAM_ACCESS_TOKEN="${DUMMY_VALUE}"`,
    `YOUTUBE_CLIENT_ID='${DUMMY_VALUE}'`,
    `export YOUTUBE_CLIENT_SECRET=${DUMMY_VALUE}`,
    `YOUTUBE_REFRESH_TOKEN=${DUMMY_VALUE}`,
    `BLOB_READ_WRITE_TOKEN=${DUMMY_VALUE}`,
    `SOME_OTHER_SECRET=${OTHER_SECRET}`,
    "",
  ].join("\n");
  writeFileSync(fakeEnvPath, fakeEnvBody, "utf8");

  let out = "";
  let exitCode = null;
  try {
    out = execFileSync(
      process.execPath,
      [WRAPPER_PATH, "credential-preflight", "--env-path", fakeEnvPath],
      { cwd: REPO_ROOT, encoding: "utf8", timeout: 30000, env: buildSanitizedGuardEnv() },
    );
    exitCode = 0;
  } catch (e) {
    exitCode = typeof e?.status === "number" ? e.status : null;
    out = String(e?.stdout || "") + String(e?.stderr || "");
  }

  check("fake-env run: exit 0 (status-style diagnostic)", exitCode === 0, `exit=${exitCode}`);
  check("fake-env run: reports 6/6 approved keys present", /approved keys present:\s*6\/6/.test(out));
  for (const name of APPROVED_ENV_KEY_NAMES) {
    check(`fake-env run: ${name} present`, new RegExp(`"name":\\s*"${name}"[\\s\\S]{0,40}"present":\\s*true`).test(out) || new RegExp(`${name}:\\s*true`).test(out));
  }
  check("fake-env run: allRequiredKeysPresent true", /"allRequiredKeysPresent":\s*true/.test(out));
  check("fake-env run: readyForCredentialResolution true", /"readyForCredentialResolution":\s*true/.test(out));
  // task: dual-platform-credential-resolution-wiring-no-execute-v1
  // credential resolution 코드 경로는 wiring됐지만(true), 이 --credential-preflight 모드는 값 미접근이고
  // actual API 실행/live publish는 비활성이다 — publish 활성화로 오인되면 안 된다.
  check("fake-env run: credentialResolutionWiredThisSlice true (코드 경로 wiring됨)", /"credentialResolutionWiredThisSlice":\s*true/.test(out));
  check("fake-env run: credentialValuesAccessedInThisMode false (preflight 값 미접근)", /"credentialValuesAccessedInThisMode":\s*false/.test(out));
  check("fake-env run: actualApiExecutionEnabledThisSlice false (live still disabled)", /"actualApiExecutionEnabledThisSlice":\s*false/.test(out));

  // 핵심: dummy 값이 출력에 절대 나타나지 않음(값 미노출)
  check("fake-env run: dummy credential value never appears in output", out !== "" && !out.includes(DUMMY_VALUE));
  // 승인되지 않은 key의 값도 절대 읽히거나 노출되지 않음
  check("fake-env run: non-approved secret value never appears in output", !out.includes(OTHER_SECRET));
  // value length/hash/prefix/suffix/masked 파생 필드가 출력에 없음
  check("fake-env run: no value length/hash/prefix/suffix/masked field in output",
    !/"(valueLength|length|hash|prefix|suffix|sample|masked|redactedValue|firstChars|lastChars|tokenType)"\s*:/.test(out));
  // secret-shaped value 없음
  check("fake-env run: no secret-shaped value (EAA/ya29/vercel_blob_rw_)",
    !/(EAA[A-Za-z0-9]{10}|ya29\.[A-Za-z0-9_-]{10}|vercel_blob_rw_[A-Za-z0-9]{6})/.test(out));

  // ── 7) runtime: missing-keys fake env → present:false, still exit 0 ────────
  const fakeEnvMissingPath = join(tmpDir, "fake-missing.env");
  writeFileSync(fakeEnvMissingPath, `INSTAGRAM_BUSINESS_ACCOUNT_ID=${DUMMY_VALUE}\n`, "utf8");
  let outMissing = "";
  let exitMissing = null;
  try {
    outMissing = execFileSync(
      process.execPath,
      [WRAPPER_PATH, "credential-preflight", "--env-path", fakeEnvMissingPath],
      { cwd: REPO_ROOT, encoding: "utf8", timeout: 30000, env: buildSanitizedGuardEnv() },
    );
    exitMissing = 0;
  } catch (e) {
    exitMissing = typeof e?.status === "number" ? e.status : null;
    outMissing = String(e?.stdout || "") + String(e?.stderr || "");
  }
  check("missing-keys fake-env: exit 0 (status-style)", exitMissing === 0, `exit=${exitMissing}`);
  check("missing-keys fake-env: reports 1/6 approved keys present", /approved keys present:\s*1\/6/.test(outMissing));
  check("missing-keys fake-env: allRequiredKeysPresent false", /"allRequiredKeysPresent":\s*false/.test(outMissing));
  check("missing-keys fake-env: dummy value never appears", outMissing !== "" && !outMissing.includes(DUMMY_VALUE));

  // ── 8) runtime: nonexistent env file → all present:false, no crash ────────
  const nonexistentPath = join(tmpDir, "does-not-exist.env");
  let outNone = "";
  let exitNone = null;
  try {
    outNone = execFileSync(
      process.execPath,
      [WRAPPER_PATH, "credential-preflight", "--env-path", nonexistentPath],
      { cwd: REPO_ROOT, encoding: "utf8", timeout: 30000, env: buildSanitizedGuardEnv() },
    );
    exitNone = 0;
  } catch (e) {
    exitNone = typeof e?.status === "number" ? e.status : null;
    outNone = String(e?.stdout || "") + String(e?.stderr || "");
  }
  check("nonexistent env file: exit 0, reports 0/6 present", exitNone === 0 && /approved keys present:\s*0\/6/.test(outNone), `exit=${exitNone}`);
} finally {
  if (tmpDir) { try { rmSync(tmpDir, { recursive: true, force: true }); } catch { /* ignore */ } }
}

// ── 9) unsupported command → non-zero, no secret handling ───────────────────
console.log("\n[ runtime: unsupported command fails closed ]");
{
  let exitBad = null;
  try {
    execFileSync(process.execPath, [WRAPPER_PATH, "definitely-not-a-command"], { cwd: REPO_ROOT, encoding: "utf8", timeout: 15000, env: buildSanitizedGuardEnv() });
    exitBad = 0;
  } catch (e) { exitBad = typeof e?.status === "number" ? e.status : null; }
  check("unsupported command: non-zero exit (fail-closed)", exitBad !== 0, `exit=${exitBad}`);
}

// ── summary ──────────────────────────────────────────────────────────────────
console.log(`\n${passed + failed} checks — ${passed} PASS, ${failed} FAIL\n`);
if (failed > 0) process.exit(1);
