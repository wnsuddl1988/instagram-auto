#!/usr/bin/env node
/**
 * check-instagram-blob-upload-from-request-executor-static.mjs
 *
 * Static guard: Instagram Vercel Blob upload preflight/executor from request JSON (no-execute).
 * task: instagram-blob-upload-from-request-executor-no-execute-v1
 *
 * Dependency-free. Reads executor source text + fixture JSON, and (for execution checks) runs the
 * executor itself via spawnSync/child_process with real local fixtures — no network, no external
 * API, no env/secret access, no @vercel/blob call.
 *
 * Exit 0 = all PASS. Exit 1 = at least one FAIL.
 */

import { readFileSync, existsSync, mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
import os from "node:os";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");

const EXECUTOR_PATH = resolve(__dirname, "prepare-instagram-blob-upload-from-request.mjs");
const PLANNER_PATH = resolve(__dirname, "plan-instagram-blob-upload-from-content-unit.mjs");
const ENTRYPOINT_PATH = resolve(__dirname, "run-owner-daily-automation-entrypoint.mjs");
const RUNBOOK_PATH = resolve(REPO_ROOT, "docs/owner-daily-automation-runbook.md");
const SAMPLE_PREFLIGHT_PATH = resolve(REPO_ROOT, "scripts/fixtures/instagram_blob_upload_from_request_executor.sample.v1.json");

// 실제 존재하는 로컬 mp4(이전 phase에서 생성된 real 파일, 35MB 이하) — request source로 재사용한다.
const REAL_SOURCE_MP4 = "C:\\tmp\\money-shorts-os\\golden-sample-chatgpt-playwright-v3-2-script-voice-mux-audit\\golden_sample_t1_lifestyle_inflation_tts_mux_v3_2.mp4";
const REAL_SOURCE_SIZE = 20294549;
const REAL_SOURCE_SHA256 = "54957450ac107b9a2209197244653a61ec30c63d2f17f405a211fa27e297a8e4";
const REAL_SOURCE_SHA256_12 = "54957450ac10";

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

/**
 * 실제 실행 코드에서 import/호출 여부만 검사하기 위해 블록 주석 + 문자열 리터럴 본문을 지운다.
 * 주석/문서/console.log 안의 "@vercel/blob"/"put()" 언급이 실제 import/호출로 오탐되는 것을 막는다.
 */
function stripBlockCommentsAndStrings(code) {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/"(?:[^"\\]|\\.)*"/g, '""')
    .replace(/'(?:[^'\\]|\\.)*'/g, "''")
    .replace(/`(?:[^`\\]|\\.)*`/g, "``");
}

/** 기준이 되는 유효 request JSON 객체를 만든다(실제 mp4 기준). */
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
    sha256_12: REAL_SOURCE_SHA256_12,
    pathname: `instagram/reels/t1_lifestyle_inflation/instagram_reels_full_frame_1080x1920/v3_2/${REAL_SOURCE_SHA256_12}.mp4`,
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
    sideEffectCounters: {
      blobUploadCount: 0,
      apiCallCount: 0,
      envSecretReadCount: 0,
      deployCount: 0,
      mediaGenerationCount: 0,
    },
  };
}

console.log("\nStatic guard check: instagram blob upload from request executor (no-execute)\n");

// ── executor source safety ────────────────────────────────────────────────────
console.log("[ executor source safety ]");
check("executor file exists", existsSync(EXECUTOR_PATH));
const executorSrc = existsSync(EXECUTOR_PATH) ? readFileSync(EXECUTOR_PATH, "utf-8") : "";
const executorCode = codeLines(executorSrc);
const executorCodeNoStrings = stripBlockCommentsAndStrings(executorCode);

check("no process.env access", !executorCode.includes("process.env"));
check("no .env.local reference in executable code", !executorCode.includes(".env.local"));
check("no @vercel/blob import (actual import statement, not doc/string mentions)", !executorCodeNoStrings.includes("@vercel/blob"));
check(
  "no Blob put(/list(/head(/del(/copy( call pattern (property access like putOptions is fine)",
  !/(^|[^a-zA-Z_.])(put|list|head|del|copy)\s*\(/.test(executorCodeNoStrings.replace(/\bput[A-Za-z]*\s*[:=]/g, "")),
);
check("no fetch(", !executorCodeNoStrings.includes("fetch("));
check("no axios", !executorCodeNoStrings.includes("axios"));
check("no googleapis", !executorCodeNoStrings.toLowerCase().includes("googleapis"));
check("no graph.facebook.com / graph.instagram.com", !executorCodeNoStrings.includes("graph.facebook.com") && !executorCodeNoStrings.includes("graph.instagram.com"));
check("no child_process/spawnSync (no subprocess in executor)", !/spawnSync|child_process/.test(executorCodeNoStrings));
check("no ffmpeg/ffprobe execution", !/\bffmpeg\s*\(|\bffprobe\s*\(|spawnSync.*ffmpeg/i.test(executorCodeNoStrings.replace(/\.\s*ffmpeg[A-Za-z]*/gi, "")));
check("no secret value shape (EAA/ya29/blob token) in source", !/(EAA[A-Za-z0-9]{20}|ya29\.[A-Za-z0-9_-]{20}|vercel_blob_rw_[A-Za-z0-9]{10})/.test(executorSrc));
check("no shell: true", !executorCode.includes("shell: true") && !executorCode.includes("shell:true"));

// ── executor contract constants/functions ────────────────────────────────────
console.log("\n[ executor contract constants/functions ]");
check("exports PREFLIGHT_SCHEMA_VERSION = instagram_blob_upload_preflight_v1", /PREFLIGHT_SCHEMA_VERSION\s*=\s*"instagram_blob_upload_preflight_v1"/.test(executorSrc));
check("exports RUN_DISABLED_STATUS = INSTAGRAM_BLOB_UPLOAD_RUN_DISABLED_THIS_SLICE", /RUN_DISABLED_STATUS\s*=\s*"INSTAGRAM_BLOB_UPLOAD_RUN_DISABLED_THIS_SLICE"/.test(executorSrc));
check("imports contract constants from planner (single source of truth)", /from\s+["']\.\/plan-instagram-blob-upload-from-content-unit\.mjs["']/.test(executorSrc));
check("has prepareInstagramBlobUploadFromRequest function", executorCode.includes("export function prepareInstagramBlobUploadFromRequest"));
check("validates schemaVersion === instagram_blob_upload_request_v1 (via UPLOAD_REQUEST_SCHEMA_VERSION)", /schemaVersion\s*!==\s*UPLOAD_REQUEST_SCHEMA_VERSION/.test(executorCode));
check("validates requiresApprovalToken", /requiresApprovalToken\s*!==\s*INSTAGRAM_BLOB_UPLOAD_APPROVAL_TOKEN/.test(executorCode));
check("validates uploadPerformed !== false → fail", /uploadPerformed\s*!==\s*false/.test(executorCode));
check("validates willUpload !== false → fail", /willUpload\s*!==\s*false/.test(executorCode));
check("validates platform !== instagram → fail", /platform\s*!==\s*INSTAGRAM_BLOB_PLATFORM/.test(executorCode));
check("validates variantId !== full_frame → fail", /variantId\s*!==\s*INSTAGRAM_BLOB_VARIANT_ID/.test(executorCode));
check("validates contentType !== video/mp4 → fail", /contentType\s*!==\s*INSTAGRAM_BLOB_CONTENT_TYPE/.test(executorCode));
check("validates put option plan match", /putOptionsMatch/.test(executorCode) && /request_putOptions_mismatch/.test(executorCode));
check("validates sha256 hex format", /\[0-9a-f\]\{64\}/.test(executorCode));
check("validates deterministic pathname match", /request_pathname_mismatch/.test(executorCode));
check("re-computes current source SHA-256 via node:crypto createHash", /createHash\(\s*["']sha256["']\s*\)/.test(executorCode));
check("re-verifies current source size against request (source_size_mismatch)", /source_size_mismatch/.test(executorCode));
check("re-verifies current source hash against request (source_sha256_mismatch)", /source_sha256_mismatch/.test(executorCode));
check("output readyForFutureApprovedUpload:true only when all pass", /readyForFutureApprovedUpload:\s*true/.test(executorCode));
check("output runStatus RUN_DISABLED", /runStatus:\s*RUN_DISABLED_STATUS/.test(executorCode));
check("output executed:false / blobUploadPerformed:false / willUpload:false", /executed:\s*false/.test(executorCode) && /blobUploadPerformed:\s*false/.test(executorCode) && /willUpload:\s*false/.test(executorCode));
check("--run fail-closed abort present (RUN_DISABLED_STATUS)", /--run is not executable|RUN_DISABLED_STATUS/.test(executorCode));
check("out-dir must be outside repo root (fail-closed check present)", /isRepoRootOrInside\(outDirAbs,\s*REPO_ROOT\)/.test(executorCode));
check(
  "isRepoRootOrInside helper covers exact repo-root match, not just subpath (startsWith(REPO_ROOT + sep))",
  /export function isRepoRootOrInside/.test(executorCode) && /absPath\s*===\s*repoRoot/.test(executorCode),
);
check(".money-shorts-local access forbidden check present", executorCode.includes(".money-shorts-local"));

// ── fixture parse + contract checks ───────────────────────────────────────────
console.log("\n[ fixture: instagram_blob_upload_from_request_executor.sample.v1.json ]");
check("sample preflight fixture exists", existsSync(SAMPLE_PREFLIGHT_PATH));
let samplePreflight = null;
if (existsSync(SAMPLE_PREFLIGHT_PATH)) {
  try {
    samplePreflight = JSON.parse(readFileSync(SAMPLE_PREFLIGHT_PATH, "utf-8"));
    check("fixture JSON parses", true);
  } catch (e) {
    check("fixture JSON parses", false, String(e?.message || e));
  }
}
if (samplePreflight) {
  check("fixture schemaVersion === instagram_blob_upload_preflight_v1", samplePreflight.schemaVersion === "instagram_blob_upload_preflight_v1");
  check("fixture mode === no_execute", samplePreflight.mode === "no_execute");
  check("fixture executed === false", samplePreflight.executed === false);
  check("fixture blobUploadPerformed === false", samplePreflight.blobUploadPerformed === false);
  check("fixture willUpload === false", samplePreflight.willUpload === false);
  check("fixture runStatus === INSTAGRAM_BLOB_UPLOAD_RUN_DISABLED_THIS_SLICE", samplePreflight.runStatus === "INSTAGRAM_BLOB_UPLOAD_RUN_DISABLED_THIS_SLICE");
  check("fixture requiresApprovalToken === APPROVE_VERCEL_BLOB_OBJECT_UPLOAD_TEST", samplePreflight.requiresApprovalToken === "APPROVE_VERCEL_BLOB_OBJECT_UPLOAD_TEST");
  check("fixture readyForFutureApprovedUpload === true", samplePreflight.readyForFutureApprovedUpload === true);
  check("fixture sourceSizeMatches === true", samplePreflight.sourceSizeMatches === true);
  check("fixture sha256Matches === true", samplePreflight.sha256Matches === true);
  check("fixture putOptionsMatchApprovedContract === true", samplePreflight.putOptionsMatchApprovedContract === true);
  check(
    "fixture pathname matches deterministic contract",
    samplePreflight.pathname === `instagram/reels/${samplePreflight.contentId}/${samplePreflight.variantId}/${samplePreflight.version}/${samplePreflight.sha256_12}.mp4`,
  );
  check("fixture sha256Reverified === sha256 (readiness proof)", samplePreflight.sha256Reverified === samplePreflight.sha256);
  const sideEffects = samplePreflight.sideEffectCounters ?? {};
  const zeroFields = ["blobUploadCount", "blobListCount", "blobHeadCount", "blobDeleteCount", "blobCopyCount", "publicUrlLivenessCheckCount", "apiCallCount", "envSecretReadCount", "deployCount", "mediaGenerationCount", "requestMutationCount"];
  check(
    `fixture sideEffectCounters all 0 (${zeroFields.length} counters)`,
    zeroFields.every((f) => sideEffects[f] === 0),
  );
}

// ── owner entrypoint integration ──────────────────────────────────────────────
console.log("\n[ owner entrypoint integration ]");
check("owner entrypoint file exists", existsSync(ENTRYPOINT_PATH));
const entrypointSrc = existsSync(ENTRYPOINT_PATH) ? readFileSync(ENTRYPOINT_PATH, "utf-8") : "";
check("owner entrypoint imports prepareInstagramBlobUploadFromRequest", entrypointSrc.includes("prepareInstagramBlobUploadFromRequest"));
check("owner entrypoint registers --prepare-instagram-blob-upload mode", entrypointSrc.includes('"--prepare-instagram-blob-upload"'));
check("owner entrypoint has runPrepareInstagramBlobUpload function", entrypointSrc.includes("function runPrepareInstagramBlobUpload"));
check("owner entrypoint switch dispatches --prepare-instagram-blob-upload", /case\s+"--prepare-instagram-blob-upload":/.test(entrypointSrc));
check("owner entrypoint --run fail-closed for this mode", /--run is not executable in this slice/.test(entrypointSrc));
check("owner entrypoint imports isRepoRootOrInside from executor", entrypointSrc.includes("isRepoRootOrInside"));
check("owner entrypoint --prepare-instagram-blob-upload uses isRepoRootOrInside (not raw startsWith)", /isRepoRootOrInside\(outDirAbs,\s*REPO_ROOT\)/.test(entrypointSrc));
check("owner entrypoint --prepare-instagram-blob-upload checks .money-shorts-local forbidden", /\.money-shorts-local/.test(entrypointSrc));

// ── docs ───────────────────────────────────────────────────────────────────────
console.log("\n[ runbook docs ]");
check("runbook file exists", existsSync(RUNBOOK_PATH));
const runbookSrc = existsSync(RUNBOOK_PATH) ? readFileSync(RUNBOOK_PATH, "utf-8") : "";
check("runbook mentions --prepare-instagram-blob-upload", runbookSrc.includes("--prepare-instagram-blob-upload"));
check("runbook mentions no-execute / readiness before actual approved upload", /no-execute|readiness/i.test(runbookSrc) && runbookSrc.includes("APPROVE_VERCEL_BLOB_OBJECT_UPLOAD_TEST"));

// ── execution smoke tests (real spawnSync, no network/API) ───────────────────
console.log("\n[ execution smoke tests ]");
const tmpDir = mkdtempSync(join(os.tmpdir(), "ig-blob-executor-guard-"));
try {
  const sourcePresent = existsSync(REAL_SOURCE_MP4);
  check(
    "real source mp4 present for smoke test",
    sourcePresent,
    `expected fixture mp4 not found: ${REAL_SOURCE_MP4}`,
  );

  // 정상 흐름: 유효 request → preflight readyForFutureApprovedUpload:true.
  const goodRequestPath = join(tmpDir, "good_request.json");
  writeFileSync(goodRequestPath, JSON.stringify(baseValidRequest()), "utf-8");
  const outDir = join(tmpDir, "out");
  let goodOk = false;
  let goodPreflight = null;
  if (sourcePresent) {
    try {
      execFileSync(process.execPath, [EXECUTOR_PATH, "--request", goodRequestPath, "--out-dir", outDir], {
        cwd: REPO_ROOT,
        stdio: ["ignore", "pipe", "pipe"],
      });
      goodOk = true;
      const preflightPath = join(outDir, "instagram-blob-upload-preflight.json");
      if (existsSync(preflightPath)) goodPreflight = JSON.parse(readFileSync(preflightPath, "utf-8"));
    } catch (e) {
      goodOk = false;
    }
    check("executor exits 0 with valid request + real mp4", goodOk);
    check("executor writes instagram-blob-upload-preflight.json", goodPreflight != null);
    if (goodPreflight) {
      check("output readyForFutureApprovedUpload === true", goodPreflight.readyForFutureApprovedUpload === true);
      check("output executed === false / blobUploadPerformed === false", goodPreflight.executed === false && goodPreflight.blobUploadPerformed === false);
      check("output sourceSizeMatches === true && sha256Matches === true", goodPreflight.sourceSizeMatches === true && goodPreflight.sha256Matches === true);
      check(
        "output sideEffectCounters all 0",
        Object.values(goodPreflight.sideEffectCounters ?? {}).every((v) => v === 0),
      );
    }
  }

  // fail-closed: --run은 request 검증/출력 이전에 abort(부작용 0, out-dir 미생성).
  const runOutDir = join(tmpDir, "run-out-should-not-exist");
  let runExitCode = 0;
  try {
    execFileSync(process.execPath, [EXECUTOR_PATH, "--request", goodRequestPath, "--out-dir", runOutDir, "--run"], {
      cwd: REPO_ROOT,
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (e) {
    runExitCode = e.status ?? 1;
  }
  check("--run → exit != 0 (fail-closed)", runExitCode !== 0);
  check("--run did not create out-dir (no side effect before validation)", !existsSync(runOutDir));

  // fail-closed: request file not found.
  let missingExitCode = 0;
  try {
    execFileSync(process.execPath, [EXECUTOR_PATH, "--request", join(tmpDir, "nope.json"), "--out-dir", join(tmpDir, "out2")], {
      cwd: REPO_ROOT,
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (e) {
    missingExitCode = e.status ?? 1;
  }
  check("missing request file → exit != 0 (fail-closed)", missingExitCode !== 0);

  // fail-closed: wrong requiresApprovalToken.
  const badTokenReq = baseValidRequest();
  badTokenReq.requiresApprovalToken = "WRONG_TOKEN";
  const badTokenPath = join(tmpDir, "bad_token.json");
  writeFileSync(badTokenPath, JSON.stringify(badTokenReq), "utf-8");
  let badTokenExit = 0;
  try {
    execFileSync(process.execPath, [EXECUTOR_PATH, "--request", badTokenPath, "--out-dir", join(tmpDir, "out3")], {
      cwd: REPO_ROOT,
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (e) {
    badTokenExit = e.status ?? 1;
  }
  check("wrong requiresApprovalToken → exit != 0 (fail-closed)", badTokenExit !== 0);

  // fail-closed: source size mismatch (request claims wrong size).
  if (sourcePresent) {
    const badSizeReq = baseValidRequest();
    badSizeReq.sourceSizeBytes = REAL_SOURCE_SIZE + 1;
    const badSizePath = join(tmpDir, "bad_size.json");
    writeFileSync(badSizePath, JSON.stringify(badSizeReq), "utf-8");
    let badSizeExit = 0;
    try {
      execFileSync(process.execPath, [EXECUTOR_PATH, "--request", badSizePath, "--out-dir", join(tmpDir, "out4")], {
        cwd: REPO_ROOT,
        stdio: ["ignore", "pipe", "pipe"],
      });
    } catch (e) {
      badSizeExit = e.status ?? 1;
    }
    check("source size mismatch → exit != 0 (fail-closed)", badSizeExit !== 0);

    // fail-closed: source sha256 mismatch (request claims wrong hash + pathname).
    const badHashReq = baseValidRequest();
    const wrongHash = "0000000000001111111111112222222222223333333333334444444444445555";
    badHashReq.sha256 = wrongHash;
    badHashReq.sha256_12 = wrongHash.slice(0, 12);
    badHashReq.pathname = `instagram/reels/t1_lifestyle_inflation/instagram_reels_full_frame_1080x1920/v3_2/${wrongHash.slice(0, 12)}.mp4`;
    const badHashPath = join(tmpDir, "bad_hash.json");
    writeFileSync(badHashPath, JSON.stringify(badHashReq), "utf-8");
    let badHashExit = 0;
    try {
      execFileSync(process.execPath, [EXECUTOR_PATH, "--request", badHashPath, "--out-dir", join(tmpDir, "out5")], {
        cwd: REPO_ROOT,
        stdio: ["ignore", "pipe", "pipe"],
      });
    } catch (e) {
      badHashExit = e.status ?? 1;
    }
    check("source sha256 mismatch → exit != 0 (fail-closed)", badHashExit !== 0);
  }

  // fail-closed: putOptions differ from approved contract.
  const badPutReq = baseValidRequest();
  badPutReq.putOptions.allowOverwrite = true;
  const badPutPath = join(tmpDir, "bad_put.json");
  writeFileSync(badPutPath, JSON.stringify(badPutReq), "utf-8");
  let badPutExit = 0;
  try {
    execFileSync(process.execPath, [EXECUTOR_PATH, "--request", badPutPath, "--out-dir", join(tmpDir, "out6")], {
      cwd: REPO_ROOT,
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (e) {
    badPutExit = e.status ?? 1;
  }
  check("putOptions mismatch (allowOverwrite:true) → exit != 0 (fail-closed)", badPutExit !== 0);

  // fail-closed: pathname does not match deterministic contract.
  const badPathReq = baseValidRequest();
  badPathReq.pathname = "instagram/reels/wrong/path.mp4";
  const badPathPath = join(tmpDir, "bad_path.json");
  writeFileSync(badPathPath, JSON.stringify(badPathReq), "utf-8");
  let badPathExit = 0;
  try {
    execFileSync(process.execPath, [EXECUTOR_PATH, "--request", badPathPath, "--out-dir", join(tmpDir, "out7")], {
      cwd: REPO_ROOT,
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (e) {
    badPathExit = e.status ?? 1;
  }
  check("pathname mismatch → exit != 0 (fail-closed)", badPathExit !== 0);

  // fail-closed: --out-dir inside repo root.
  if (sourcePresent) {
    let insideRepoExit = 0;
    const insideRepoOut = join(REPO_ROOT, "tmp-executor-guard-out-should-not-be-created");
    try {
      execFileSync(process.execPath, [EXECUTOR_PATH, "--request", goodRequestPath, "--out-dir", insideRepoOut], {
        cwd: REPO_ROOT,
        stdio: ["ignore", "pipe", "pipe"],
      });
    } catch (e) {
      insideRepoExit = e.status ?? 1;
    }
    check("--out-dir inside repo root → exit != 0 (fail-closed)", insideRepoExit !== 0);
    check("--out-dir inside repo root did not create output dir", !existsSync(insideRepoOut));
  }

  // fail-closed: --out-dir is exactly repo root itself ("."), not just a subpath.
  // Regression guard for Codex finding: startsWith(REPO_ROOT + sep) misses outDirAbs === REPO_ROOT.
  const rootPreflightPath = join(REPO_ROOT, "instagram-blob-upload-preflight.json");
  if (sourcePresent) {
    let directRootExit = 0;
    try {
      execFileSync(process.execPath, [EXECUTOR_PATH, "--request", goodRequestPath, "--out-dir", "."], {
        cwd: REPO_ROOT,
        stdio: ["ignore", "pipe", "pipe"],
      });
    } catch (e) {
      directRootExit = e.status ?? 1;
    }
    check("direct executor --out-dir . (repo root itself) → exit != 0 (fail-closed)", directRootExit !== 0);
    check("direct executor --out-dir . did not create instagram-blob-upload-preflight.json at repo root", !existsSync(rootPreflightPath));

    let ownerRootExit = 0;
    try {
      execFileSync(process.execPath, [ENTRYPOINT_PATH, "--prepare-instagram-blob-upload", "--request", goodRequestPath, "--out-dir", "."], {
        cwd: REPO_ROOT,
        stdio: ["ignore", "pipe", "pipe"],
      });
    } catch (e) {
      ownerRootExit = e.status ?? 1;
    }
    check("owner entrypoint --prepare-instagram-blob-upload --out-dir . (repo root itself) → exit != 0 (fail-closed)", ownerRootExit !== 0);
    check("owner entrypoint --out-dir . did not create instagram-blob-upload-preflight.json at repo root", !existsSync(rootPreflightPath));
  }

  // owner entrypoint forwarding: same good request via owner entrypoint.
  if (sourcePresent) {
    const ownerOutDir = join(tmpDir, "owner-out");
    let ownerOk = false;
    try {
      execFileSync(process.execPath, [ENTRYPOINT_PATH, "--prepare-instagram-blob-upload", "--request", goodRequestPath, "--out-dir", ownerOutDir], {
        cwd: REPO_ROOT,
        stdio: ["ignore", "pipe", "pipe"],
      });
      ownerOk = true;
    } catch (e) {
      ownerOk = false;
    }
    check("owner entrypoint --prepare-instagram-blob-upload exits 0 with valid request", ownerOk);
    check(
      "owner entrypoint --prepare-instagram-blob-upload writes instagram-blob-upload-preflight.json",
      existsSync(join(ownerOutDir, "instagram-blob-upload-preflight.json")),
    );

    // owner entrypoint --run fail-closed.
    const ownerRunOut = join(tmpDir, "owner-run-out-should-not-exist");
    let ownerRunExit = 0;
    try {
      execFileSync(process.execPath, [ENTRYPOINT_PATH, "--prepare-instagram-blob-upload", "--request", goodRequestPath, "--out-dir", ownerRunOut, "--run"], {
        cwd: REPO_ROOT,
        stdio: ["ignore", "pipe", "pipe"],
      });
    } catch (e) {
      ownerRunExit = e.status ?? 1;
    }
    check("owner entrypoint --run → exit != 0 (fail-closed)", ownerRunExit !== 0);
    check("owner entrypoint --run did not create out-dir", !existsSync(ownerRunOut));
  }
} finally {
  rmSync(tmpDir, { recursive: true, force: true });
}

// ── done ───────────────────────────────────────────────────────────────────────
console.log(`\n${passed} PASS / ${failed} FAIL\n`);
process.exit(failed === 0 ? 0 : 1);
