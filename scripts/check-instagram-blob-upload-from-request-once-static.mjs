#!/usr/bin/env node
/**
 * check-instagram-blob-upload-from-request-once-static.mjs
 *
 * Static guard: approval-gated one-shot Instagram Vercel Blob upload runner.
 * task: instagram-blob-upload-from-request-once-v1
 *
 * Dependency-free. Reads runner source text and runs gate-failure / token-absent smoke cases
 * via child_process. EVERY smoke case runs with BLOB_READ_WRITE_TOKEN explicitly removed from
 * the child env, so no smoke invocation can ever perform a real upload. This guard itself never
 * reads .env files, never touches token values, and never calls @vercel/blob.
 *
 * Exit 0 = all PASS. Exit 1 = at least one FAIL.
 */

import { readFileSync, existsSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import os from "node:os";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");

const RUNNER_PATH = resolve(__dirname, "run-instagram-blob-upload-from-request-once.mjs");
const WRAPPER_PATH = resolve(REPO_ROOT, "output/instagram-blob-upload-from-request-once-v1/run-upload-with-token-prompt.ps1");

// 실제 존재하는 로컬 mp4(이전 phase 산출물) — smoke request의 source로 재사용.
const REAL_SOURCE_MP4 = "C:\\tmp\\money-shorts-os\\golden-sample-chatgpt-playwright-v3-2-script-voice-mux-audit\\golden_sample_t1_lifestyle_inflation_tts_mux_v3_2.mp4";
const REAL_SOURCE_SIZE = 20294549;
const REAL_SOURCE_SHA256 = "54957450ac107b9a2209197244653a61ec30c63d2f17f405a211fa27e297a8e4";

const APPROVAL = "APPROVE_INSTAGRAM_BLOB_UPLOAD_FROM_REQUEST_ONCE";

let passed = 0;
let failed = 0;
function check(label, condition, detail) {
  if (condition) {
    console.log(`  PASS  ${label}`);
    passed++;
  } else {
    console.error(`  FAIL  ${label}${detail ? " — " + detail : ""}`);
    failed++;
  }
}

function codeLines(src) {
  return src
    .split("\n")
    .filter((l) => !/^\s*(\/\/|\*)/.test(l))
    .join("\n");
}

function stripBlockCommentsAndStrings(code) {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/"(?:[^"\\]|\\.)*"/g, '""')
    .replace(/'(?:[^'\\]|\\.)*'/g, "''")
    .replace(/`(?:[^`\\]|\\.)*`/g, "``");
}

/** token이 절대 전달되지 않는 child env — 모든 스모크가 이 env로 실행되어 실제 업로드가 불가능하다. */
function tokenFreeEnv() {
  const env = { ...process.env };
  delete env.BLOB_READ_WRITE_TOKEN;
  delete env.VERCEL_BLOB_RETRIES;
  return env;
}

function runRunner(runnerArgs, extraOpts = {}) {
  let exitCode = 0;
  let output = "";
  try {
    output = execFileSync(process.execPath, [RUNNER_PATH, ...runnerArgs], {
      cwd: REPO_ROOT,
      encoding: "utf8",
      timeout: 60000,
      env: tokenFreeEnv(),
      stdio: ["ignore", "pipe", "pipe"],
      ...extraOpts,
    });
  } catch (e) {
    exitCode = typeof e?.status === "number" ? e.status : 1;
    output = String(e?.stdout ?? "") + String(e?.stderr ?? "");
  }
  return { exitCode, output };
}

function baseValidRequest() {
  return {
    schemaVersion: "instagram_blob_upload_request_v1",
    noLive: true,
    envSecretValuesAccessedThisRun: false,
    contentId: "t1_lifestyle_inflation",
    version: "v3_2",
    platform: "instagram",
    variantId: "instagram_reels_full_frame_1080x1920",
    sourcePath: REAL_SOURCE_MP4,
    sourceSizeBytes: REAL_SOURCE_SIZE,
    sourceSizeCapBytes: 36700160,
    sha256: REAL_SOURCE_SHA256,
    sha256_12: REAL_SOURCE_SHA256.slice(0, 12),
    pathname: `instagram/reels/t1_lifestyle_inflation/instagram_reels_full_frame_1080x1920/v3_2/${REAL_SOURCE_SHA256.slice(0, 12)}.mp4`,
    contentType: "video/mp4",
    putOptions: {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: false,
      multipart: true,
      contentType: "video/mp4",
    },
    uploadPerformed: false,
    willUpload: false,
    requiresApprovalToken: "APPROVE_VERCEL_BLOB_OBJECT_UPLOAD_TEST",
    sideEffectCounters: { blobUploadCount: 0, apiCallCount: 0, envSecretReadCount: 0, deployCount: 0, mediaGenerationCount: 0 },
  };
}

console.log("\nStatic guard check: instagram blob upload from request once (approval-gated one-shot)\n");

// ── runner source safety ────────────────────────────────────────────────────────
console.log("[ runner source safety ]");
check("runner file exists", existsSync(RUNNER_PATH));
const src = existsSync(RUNNER_PATH) ? readFileSync(RUNNER_PATH, "utf-8") : "";
const code = codeLines(src);
const codeNoStrings = stripBlockCommentsAndStrings(code);

check("no top-level static import of @vercel/blob (dynamic import only)", !/^\s*import\s+[^;]*from\s+["']@vercel\/blob["']/m.test(code));
check("exactly one dynamic import(\"@vercel/blob\") call site", (code.match(/import\(\s*["']@vercel\/blob["']\s*\)/g) ?? []).length === 1);
check(
  "exactly one put( call site (comments/strings stripped, put-option keys excluded)",
  (codeNoStrings.replace(/\bput[A-Za-z]*\s*[:=]/g, "").match(/(^|[^a-zA-Z_.])put\s*\(/g) ?? []).length === 1,
);
check(
  "no list(/head(/del(/copy( call pattern",
  !/(^|[^a-zA-Z_.])(list|head|del|copy)\s*\(/.test(codeNoStrings),
);
check("no fetch(", !codeNoStrings.includes("fetch("));
check("no axios / googleapis / graph API hosts", !/axios|googleapis|graph\.facebook\.com|graph\.instagram\.com/i.test(codeNoStrings));
check(
  "no .env.local / .env read in executable code (string literals like user guidance excluded)",
  !codeNoStrings.includes(".env.local") && !/readFileSync\([^)]*\.env/.test(codeNoStrings),
);
check("no child_process / spawnSync in runner", !/child_process|spawnSync|execFileSync|execSync/.test(codeNoStrings));
check("no ffmpeg/ffprobe", !/ffmpeg|ffprobe/i.test(codeNoStrings));
check("no secret value shape in source", !/(EAA[A-Za-z0-9]{20}|ya29\.[A-Za-z0-9_-]{20}|vercel_blob_rw_[A-Za-z0-9]{10})/.test(src));

// ── token handling contract ─────────────────────────────────────────────────────
console.log("\n[ token handling contract ]");
check(
  "BLOB_READ_WRITE_TOKEN used only as boolean presence check (typeof/length), never assigned to a variable holding the value",
  /typeof process\.env\.BLOB_READ_WRITE_TOKEN === "string"/.test(code) &&
    !/const\s+\w+\s*=\s*process\.env\.BLOB_READ_WRITE_TOKEN\s*;/.test(code),
);
check(
  "token value never interpolated into console output",
  !/console\.(log|error)\([^;]*process\.env\.BLOB_READ_WRITE_TOKEN/.test(code),
);
check("put() options omit token (SDK consumes runtime env itself)", !/token\s*:\s*process\.env/.test(codeNoStrings));
check("SDK internal retry disabled (VERCEL_BLOB_RETRIES = \"0\") to enforce no-retry contract", /VERCEL_BLOB_RETRIES\s*=\s*"0"/.test(code));
check("sanitizeErrorMessage redacts token shape defensively", /vercel_blob_rw_/.test(src) && /REDACTED/.test(src));

// ── approval / gate order ───────────────────────────────────────────────────────
console.log("\n[ approval / gate order ]");
check(`ONCE_APPROVAL_TOKEN === ${APPROVAL}`, new RegExp(`ONCE_APPROVAL_TOKEN\\s*=\\s*"${APPROVAL}"`).test(src));
check("reuses prepareInstagramBlobUploadFromRequest preflight (import from executor)", /import\s*\{[^}]*prepareInstagramBlobUploadFromRequest[^}]*\}\s*from\s*["']\.\/prepare-instagram-blob-upload-from-request\.mjs["']/.test(src));
check("reuses isRepoRootOrInside for out-dir gate", /isRepoRootOrInside\(outDirAbs,\s*REPO_ROOT\)/.test(code));
const idxApproval = code.indexOf("approval !== ONCE_APPROVAL_TOKEN");
const idxResultGate = code.indexOf("existsSync(resultPath)");
const idxPreflight = code.indexOf("prepareInstagramBlobUploadFromRequest({ requestPath");
const idxTokenGate = code.indexOf("process.env.BLOB_READ_WRITE_TOKEN");
const idxSdkImport = code.indexOf('import("@vercel/blob")');
check(
  "gate order in source: approval → result-exists → preflight → token presence → SDK import",
  idxApproval !== -1 && idxResultGate !== -1 && idxPreflight !== -1 && idxTokenGate !== -1 && idxSdkImport !== -1 &&
    idxApproval < idxResultGate && idxResultGate < idxPreflight && idxPreflight < idxTokenGate && idxTokenGate < idxSdkImport,
);
check(".money-shorts-local forbidden gate present", code.includes(".money-shorts-local"));
check("one-shot re-run gate on existing result JSON (no overwrite of prior attempt evidence)", /previous upload-attempt result already exists/.test(src));

// ── put options contract ────────────────────────────────────────────────────────
console.log("\n[ put options contract ]");
check('access: "public"', /access:\s*"public"/.test(code));
check("addRandomSuffix: false", /addRandomSuffix:\s*false/.test(code));
check("allowOverwrite: false", /allowOverwrite:\s*false/.test(code));
check("multipart: true", /multipart:\s*true/.test(code));
check('contentType: "video/mp4"', /contentType:\s*"video\/mp4"/.test(code));
check("upload body SHA-256 re-verified against request before put (no TOCTOU window)", /bodySha256 !== preflight\.sha256/.test(code));

// ── status / result contract ────────────────────────────────────────────────────
console.log("\n[ status / result contract ]");
check("schemaVersion instagram_blob_upload_once_result_v1", src.includes("instagram_blob_upload_once_result_v1"));
check("STATUS_UPLOADED present", /STATUS_UPLOADED\s*=\s*"UPLOADED"/.test(src));
check("STATUS_BLOCKED_ALREADY_EXISTS = BLOCKED_ALREADY_EXISTS_OR_OVERWRITE_REFUSED", src.includes('"BLOCKED_ALREADY_EXISTS_OR_OVERWRITE_REFUSED"'));
check("STATUS_BLOCKED_TOKEN_ABSENT = BLOCKED_BLOB_TOKEN_ABSENT_NO_UPLOAD", src.includes('"BLOCKED_BLOB_TOKEN_ABSENT_NO_UPLOAD"'));
check("STATUS_UPLOAD_FAILED = UPLOAD_FAILED_ERROR (no retry on unknown failure)", src.includes('"UPLOAD_FAILED_ERROR"'));
check("already-exists refusal mapped from allowOverwrite/already-exists message", /already exists\|allow\.\?overwrite/.test(src) || /isAlreadyExistsRefusal/.test(src));

// ── no-log wrapper contract ─────────────────────────────────────────────────────
console.log("\n[ no-log wrapper contract ]");
check("wrapper written under gitignored output/instagram-blob-upload-from-request-once-v1/", src.includes("output/instagram-blob-upload-from-request-once-v1"));
check("wrapper uses Read-Host -AsSecureString (hidden input)", src.includes("Read-Host") && src.includes("AsSecureString"));
check("wrapper clears env in finally (Remove-Item Env:)", src.includes("finally") && src.includes("Remove-Item Env:"));
check("wrapper never echoes token (no Write-Host/Write-Output of env token in template)", !/Write-(Host|Output)[^\n]*BLOB_READ_WRITE_TOKEN/.test(src));

// ── execution smoke tests (ALL run with token removed from child env) ───────────
console.log("\n[ execution smoke tests — child env has NO token; upload impossible ]");
const tmpDir = mkdtempSync(join(os.tmpdir(), "ig-blob-once-guard-"));
const sourcePresent = existsSync(REAL_SOURCE_MP4);
// guard 스모크가 wrapper를 스모크 경로로 덮어쓴 경우 정리하기 위해 사전 상태를 기억한다.
const wrapperExistedBefore = existsSync(WRAPPER_PATH);
const wrapperContentBefore = wrapperExistedBefore ? readFileSync(WRAPPER_PATH, "utf-8") : null;
try {
  const goodRequestPath = join(tmpDir, "good_request.json");
  writeFileSync(goodRequestPath, JSON.stringify(baseValidRequest()), "utf-8");

  // 1. approval 없음 → exit 1
  {
    const { exitCode, output } = runRunner(["--request", goodRequestPath, "--out-dir", join(tmpDir, "o1")]);
    check("no --approval → exit != 0 (fail-closed before anything)", exitCode !== 0);
    check("no --approval → abort message names required token", output.includes(APPROVAL));
  }

  // 2. 잘못된 approval → exit 1
  {
    const { exitCode } = runRunner(["--approval", "WRONG_TOKEN", "--request", goodRequestPath, "--out-dir", join(tmpDir, "o2")]);
    check("wrong --approval → exit != 0", exitCode !== 0);
  }

  // 3. --out-dir . (repo root 자체) → exit 1
  {
    const { exitCode } = runRunner(["--approval", APPROVAL, "--request", goodRequestPath, "--out-dir", "."]);
    check("--out-dir . (repo root itself) → exit != 0", exitCode !== 0);
    check("--out-dir . did not create result at repo root", !existsSync(resolve(REPO_ROOT, "instagram-blob-upload-once-result.json")));
  }

  // 4. .money-shorts-local out-dir → exit 1
  {
    const { exitCode } = runRunner(["--approval", APPROVAL, "--request", goodRequestPath, "--out-dir", "C:\\tmp\\.money-shorts-local\\x"]);
    check(".money-shorts-local out-dir → exit != 0", exitCode !== 0);
  }

  // 5. request 미존재 → preflight 실패 exit 1
  {
    const { exitCode } = runRunner(["--approval", APPROVAL, "--request", join(tmpDir, "nope.json"), "--out-dir", join(tmpDir, "o3")]);
    check("missing request → exit != 0 (preflight fail-closed, no SDK import)", exitCode !== 0);
  }

  // 6. 이전 result 존재 → one-shot 재실행 거부 exit 1 (preflight/token보다 먼저)
  {
    const rerunDir = join(tmpDir, "rerun");
    mkdirSync(rerunDir, { recursive: true });
    const priorResult = join(rerunDir, "instagram-blob-upload-once-result.json");
    writeFileSync(priorResult, JSON.stringify({ note: "prior attempt evidence" }), "utf-8");
    const { exitCode, output } = runRunner(["--approval", APPROVAL, "--request", goodRequestPath, "--out-dir", rerunDir]);
    check("existing result JSON → exit != 0 (one-shot re-run refused)", exitCode !== 0);
    check("existing result JSON → prior evidence not overwritten", readFileSync(priorResult, "utf-8").includes("prior attempt evidence"));
    check("existing result JSON → message explains one-shot guarantee", output.includes("one-shot"));
  }

  // 7. tampered request (size mismatch) → preflight 실패 exit 1
  if (sourcePresent) {
    const bad = baseValidRequest();
    bad.sourceSizeBytes = REAL_SOURCE_SIZE + 1;
    const badPath = join(tmpDir, "bad_size.json");
    writeFileSync(badPath, JSON.stringify(bad), "utf-8");
    const { exitCode } = runRunner(["--approval", APPROVAL, "--request", badPath, "--out-dir", join(tmpDir, "o4")]);
    check("size-mismatch request → exit != 0 (preflight fail-closed, upload 0)", exitCode !== 0);
  }

  // 8. 유효 request + token 없는 env → BLOCKED_BLOB_TOKEN_ABSENT_NO_UPLOAD exit 2, attempt 0
  if (sourcePresent) {
    const absentDir = join(tmpDir, "token-absent");
    const { exitCode, output } = runRunner(["--approval", APPROVAL, "--request", goodRequestPath, "--out-dir", absentDir]);
    check("valid request + token-free env → exit 2 (BLOCKED_BLOB_TOKEN_ABSENT_NO_UPLOAD)", exitCode === 2, `exit=${exitCode}`);
    check("token-free run mentions blocked status", output.includes("BLOCKED_BLOB_TOKEN_ABSENT_NO_UPLOAD"));
    const tokenAbsentPath = join(absentDir, "instagram-blob-upload-once-token-absent.json");
    check("token-absent report JSON written", existsSync(tokenAbsentPath));
    let report = null;
    try { report = JSON.parse(readFileSync(tokenAbsentPath, "utf-8")); } catch {}
    check("report status === BLOCKED_BLOB_TOKEN_ABSENT_NO_UPLOAD", report?.status === "BLOCKED_BLOB_TOKEN_ABSENT_NO_UPLOAD");
    check("report uploadAttemptCount === 0", report?.uploadAttemptCount === 0);
    check("report blobUploadCount === 0", report?.sideEffectCounters?.blobUploadCount === 0);
    check("report envLocalRead === false && tokenPresenceCheckedBooleanOnly === true", report?.envSecretHandling?.envLocalRead === false && report?.envSecretHandling?.tokenPresenceCheckedBooleanOnly === true);
    check("report contains ownerRunCommand (single no-log step)", typeof report?.ownerRunCommand === "string" && report.ownerRunCommand.includes("run-upload-with-token-prompt.ps1"));
    check("report contains no token value shape", !/vercel_blob_rw_[A-Za-z0-9]{10}/.test(JSON.stringify(report)));
    check("upload result JSON NOT written (no attempt)", !existsSync(join(absentDir, "instagram-blob-upload-once-result.json")));
    check("no-log wrapper file created under output/", existsSync(WRAPPER_PATH));
    if (existsSync(WRAPPER_PATH)) {
      const w = readFileSync(WRAPPER_PATH, "utf-8");
      check("wrapper: Read-Host -AsSecureString present", w.includes("Read-Host") && w.includes("AsSecureString"));
      check("wrapper: finally removes env var", w.includes("finally") && w.includes("Remove-Item Env:\\BLOB_READ_WRITE_TOKEN"));
      check("wrapper: no token echo (no Write-Host of token)", !/Write-(Host|Output)[^\r\n]*BLOB_READ_WRITE_TOKEN/.test(w));
      check("wrapper: invokes runner with exact approval + request + out-dir", w.includes(APPROVAL) && w.includes("run-instagram-blob-upload-from-request-once.mjs"));
    }
  } else {
    check("real source mp4 present for token-absent smoke", false, `missing: ${REAL_SOURCE_MP4}`);
  }
} finally {
  rmSync(tmpDir, { recursive: true, force: true });
  // guard 스모크가 만든 wrapper(스모크 tmp 경로 포함)는 정리하고, 사전에 존재하던 wrapper는 복원한다.
  if (existsSync(WRAPPER_PATH)) {
    const wNow = readFileSync(WRAPPER_PATH, "utf-8");
    if (wNow.includes("ig-blob-once-guard-")) {
      if (wrapperExistedBefore && wrapperContentBefore !== null) {
        writeFileSync(WRAPPER_PATH, wrapperContentBefore, "utf-8");
      } else {
        rmSync(WRAPPER_PATH, { force: true });
      }
    }
  }
}

console.log(`\n${passed} PASS / ${failed} FAIL\n`);
process.exit(failed === 0 ? 0 : 1);
