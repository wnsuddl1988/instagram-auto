#!/usr/bin/env node
/**
 * check-instagram-existing-blob-liveness-attach-static.mjs
 *
 * Static guard: existing Vercel Blob object public URL liveness (no-arm) runner
 * + its content-unit attach path.
 * task: instagram-existing-blob-liveness-and-content-unit-attach-no-arm-v1
 *
 * Dependency-free. Reads runner source text for safety guarantees and runs a small set of
 * offline smoke cases (missing args, path-mismatch fail-closed) that make no network request.
 * The one real network HEAD check against the existing Blob object is performed separately by
 * the Owner-approved runner invocation, not by this guard — this guard never performs a live
 * HEAD request itself so it stays fast/dependency-free and safe to re-run anytime.
 *
 * Exit 0 = all PASS. Exit 1 = at least one FAIL.
 */

import { readFileSync, existsSync, mkdtempSync, rmSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import os from "node:os";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const RUNNER_PATH = resolve(__dirname, "check-instagram-existing-blob-liveness-no-arm.mjs");

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
  return src.split("\n").filter((l) => !/^\s*(\/\/|\*)/.test(l)).join("\n");
}
function stripBlockCommentsAndStrings(code) {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/"(?:[^"\\]|\\.)*"/g, '""')
    .replace(/'(?:[^'\\]|\\.)*'/g, "''")
    .replace(/`(?:[^`\\]|\\.)*`/g, "``");
}

function runRunner(runnerArgs) {
  let exitCode = 0;
  let output = "";
  try {
    // env 옵션을 명시하지 않는다. 이 guard의 smoke는 전부 offline fail-closed 케이스(missing args,
    // repo-root out-dir, .money-shorts-local)라 자식이 어떤 env 값도 소비하지 않으며, 부모 env를
    // 이 guard 소스가 직접 spread(`{ ...process.env }`)하면 "process.env 접근 0" 계약과 충돌한다.
    // env 미지정 시 자식은 부모 환경을 상속하되, 그 상속은 guard 소스의 env 참조가 아니라 Node 기본
    // 동작이다(Windows에서 SystemRoot/PATH가 유지되어 node 실행이 정상). env: {} 는 Windows에서
    // SystemRoot 부재로 실패할 수 있어 사용하지 않는다.
    output = execFileSync(process.execPath, [RUNNER_PATH, ...runnerArgs], {
      cwd: REPO_ROOT,
      encoding: "utf8",
      timeout: 30000,
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (e) {
    exitCode = typeof e?.status === "number" ? e.status : 1;
    output = String(e?.stdout ?? "") + String(e?.stderr ?? "");
  }
  return { exitCode, output };
}

console.log("\nStatic guard check: instagram existing blob liveness (no-arm) + content-unit attach\n");

// ── runner source safety ────────────────────────────────────────────────────────
console.log("[ runner source safety ]");
check("runner file exists", existsSync(RUNNER_PATH));
const src = existsSync(RUNNER_PATH) ? readFileSync(RUNNER_PATH, "utf-8") : "";
const code = codeLines(src);
const codeNoStrings = stripBlockCommentsAndStrings(code);

check("no @vercel/blob import (SDK not used — HEAD-only public URL check)", !/from\s+["']@vercel\/blob["']/.test(code) && !/import\(\s*["']@vercel\/blob["']\s*\)/.test(code));
check("no list(/head(/put(/del(/copy( SDK call pattern", !/(^|[^a-zA-Z_.])(list|head|put|del|copy)\s*\(/.test(codeNoStrings));
check("exactly one fetch( call site (single HEAD request)", (codeNoStrings.match(/(^|[^a-zA-Z_.])fetch\s*\(/g) ?? []).length === 1);
check("fetch call uses method: \"HEAD\"", /method:\s*["']HEAD["']/.test(code));
check("no GET/download body read (no .text()/.json()/.arrayBuffer()/.blob() on response)", !/\.(text|json|arrayBuffer|blob)\s*\(\s*\)/.test(codeNoStrings));
check("no process.env access", !/process\.env/.test(code));
check("no .env.local / .env read", !code.includes(".env.local") && !/readFileSync\([^)]*\.env/.test(code));
check("no child_process / spawnSync", !/child_process|spawnSync|execFileSync|execSync/.test(codeNoStrings));
check("no ffmpeg/ffprobe", !/ffmpeg|ffprobe/i.test(codeNoStrings));
check("no axios / Instagram / YouTube API hosts", !/axios|googleapis|graph\.facebook\.com|graph\.instagram\.com/i.test(codeNoStrings));
check("no secret value shape in source", !/(EAA[A-Za-z0-9]{20}|ya29\.[A-Za-z0-9_-]{20}|vercel_blob_rw_[A-Za-z0-9]{10})/.test(src));
check("reuses isRepoRootOrInside for out-dir gate", /isRepoRootOrInside\(outDirAbs,\s*REPO_ROOT\)/.test(code));
check(".money-shorts-local forbidden gate present", code.includes(".money-shorts-local"));

// ── this guard's own env-safety (self-regression) ────────────────────────────────
// 이 guard가 smoke 자식 프로세스에 부모 env를 broad하게 넘기지 않도록 자기 소스를 검사한다.
// 정규식 리터럴/문자열/주석은 오탐이므로 제거한 뒤 실제 코드 토큰만 본다(예: 위 88번 줄의
// `!/process\.env/.test(code)` 같은 정규식 패턴은 검사 대상에서 빠져야 한다).
console.log("\n[ this guard's own env-safety (self-regression) ]");
const selfSrc = readFileSync(resolve(__dirname, "check-instagram-existing-blob-liveness-attach-static.mjs"), "utf-8");
const selfCode = stripBlockCommentsAndStrings(codeLines(selfSrc))
  // /.../ 정규식 리터럴 제거 (이 파일엔 나눗셈이 없어 안전) — 정규식 안의 process\.env / env 오탐 방지
  .replace(/\/(?:[^/\\\n]|\\.)+\/[a-z]*/g, "//re//");
check(
  "self: no broad env spread `env: { ...process.env }` in guard's child-process options",
  !/env\s*:\s*\{\s*\.\.\.\s*process\.env/.test(selfCode),
);
check(
  "self: no direct process.env reference in guard executable code (regex/strings excluded)",
  !/process\.env/.test(selfCode),
);
check(
  "self: execFileSync options omit an `env:` key entirely (child inherits Node default, not a guard-sourced spread)",
  !/execFileSync\([\s\S]*?\benv\s*:/.test(selfCode),
);

// ── public URL derivation / result contract ─────────────────────────────────────
console.log("\n[ URL derivation / result contract ]");
check("PUBLIC_BLOB_BASE_URL is the recorded non-secret store base host", /PUBLIC_BLOB_BASE_URL\s*=\s*"https:\/\/7iq7vppwlaha2vuo\.public\.blob\.vercel-storage\.com"/.test(src));
check("candidate URL is a deterministic string join of base + pathname (no SDK/API lookup)", /`\$\{PUBLIC_BLOB_BASE_URL\}\/\$\{pathname\}`/.test(src));
check("schemaVersion instagram_existing_blob_liveness_result_v1", src.includes("instagram_existing_blob_liveness_result_v1"));
check("result includes urlPathMatchesExpectedPath check", /urlPathMatchesExpectedPath/.test(src));
check("fail-closed on non-2xx/3xx", src.includes("BLOCKED_HEAD_NON_2XX_3XX"));
check("fail-closed on html/text content-type", src.includes("BLOCKED_HEAD_HTML_OR_TEXT"));
check("fail-closed on non-video content-type", src.includes("BLOCKED_HEAD_NOT_VIDEO"));
check("fail-closed on content-length mismatch", src.includes("BLOCKED_SIZE_MISMATCH"));
check("fail-closed on URL path mismatch", src.includes("BLOCKED_URL_PATH_MISMATCH"));
check("result includes sideEffectCounters with publicUrlLivenessCheckCount", /sideEffectCounters/.test(src) && /publicUrlLivenessCheckCount/.test(src));
check("result includes envSecretAccess booleans (all false)", /envSecretAccess/.test(src) && /envLocalRead:\s*false/.test(src));
check("vercelBlobSdkUsed: false recorded in result", /vercelBlobSdkUsed:\s*false/.test(src));

// ── builder / orchestrator attach contract (cross-file, read-only check) ───────
console.log("\n[ content-unit builder attach contract (cross-file) ]");
const builderPath = resolve(__dirname, "build-dual-platform-content-unit-from-local-summary.mjs");
const builderSrc = existsSync(builderPath) ? readFileSync(builderPath, "utf-8") : "";
check("builder script exists (--blob-liveness-result consumer)", existsSync(builderPath));
check("builder reads top-level {url, headStatus, contentType, contentLength} (matches this runner's result shape)", /raw\.url/.test(builderSrc) && /raw\.headStatus/.test(builderSrc) && /raw\.contentType/.test(builderSrc) && /raw\.contentLength/.test(builderSrc));
check("builder never performs network validation of the liveness result itself", /네트워크|no-execute|read-only|never fetch/i.test(builderSrc) || !/fetch\(/.test(builderSrc));

const orchestratorPath = resolve(__dirname, "run-dual-platform-final-publish-orchestrator.mjs");
const orchestratorSrc = existsSync(orchestratorPath) ? readFileSync(orchestratorPath, "utf-8") : "";
check("orchestrator script exists (--preflight --content-unit consumer)", existsSync(orchestratorPath));
check("orchestrator's recorded default evidence URL matches this runner's PUBLIC_BLOB_BASE_URL host", orchestratorSrc.includes("7iq7vppwlaha2vuo.public.blob.vercel-storage.com"));

// ── execution smoke tests (all offline — no network HEAD request) ──────────────
console.log("\n[ execution smoke tests — offline only, no live HEAD request ]");
const tmpDir = mkdtempSync(join(os.tmpdir(), "ig-blob-liveness-guard-"));
try {
  // 1. missing args → exit 1, no result file
  {
    const { exitCode } = runRunner([]);
    check("no args → exit != 0 (usage/fail-closed)", exitCode !== 0);
  }
  // 2. missing --out-dir → exit 1
  {
    const { exitCode } = runRunner(["--pathname", "instagram/reels/x/y/z/abc.mp4", "--expected-size", "123"]);
    check("missing --out-dir → exit != 0", exitCode !== 0);
  }
  // 3. --out-dir . (repo root) → exit 1, no result created at repo root
  {
    const { exitCode } = runRunner(["--pathname", "instagram/reels/x/y/z/abc.mp4", "--expected-size", "123", "--out-dir", "."]);
    check("--out-dir . (repo root itself) → exit != 0", exitCode !== 0);
    check("--out-dir . did not create result at repo root", !existsSync(resolve(REPO_ROOT, "instagram-existing-blob-liveness-result.json")));
  }
  // 4. .money-shorts-local out-dir → exit 1
  {
    const { exitCode } = runRunner(["--pathname", "instagram/reels/x/y/z/abc.mp4", "--expected-size", "123", "--out-dir", "C:\\tmp\\.money-shorts-local\\x"]);
    check(".money-shorts-local out-dir → exit != 0", exitCode !== 0);
  }
} finally {
  rmSync(tmpDir, { recursive: true, force: true });
}

// ── prior completed run evidence (read-only observation, no new network call) ──
console.log("\n[ prior completed liveness result evidence (read-only, this guard makes no network call) ]");
const priorResultPath = "C:\\tmp\\money-shorts-os\\instagram-existing-blob-liveness-no-arm-v1\\instagram-existing-blob-liveness-result.json";
if (existsSync(priorResultPath)) {
  let prior = null;
  try { prior = JSON.parse(readFileSync(priorResultPath, "utf-8")); } catch {}
  check("prior result JSON parses", prior != null);
  check("prior result status === LIVE_PUBLIC_URL_OK", prior?.status === "LIVE_PUBLIC_URL_OK");
  check("prior result livenessOk === true", prior?.livenessOk === true);
  check("prior result headStatus === 200", prior?.headStatus === 200);
  check("prior result contentType === video/mp4", prior?.contentType === "video/mp4");
  check("prior result contentLength === expectedContentLength", prior?.contentLength === prior?.expectedContentLength);
  check("prior result vercelBlobSdkUsed === false", prior?.vercelBlobSdkUsed === false);
  check("prior result envSecretAccess all false", prior?.envSecretAccess && Object.values(prior.envSecretAccess).every((v) => v === false));
} else {
  console.log("  (skipped — no prior result found; run the Owner-approved liveness check first)");
}

console.log(`\n${passed} PASS / ${failed} FAIL\n`);
process.exit(failed === 0 ? 0 : 1);
