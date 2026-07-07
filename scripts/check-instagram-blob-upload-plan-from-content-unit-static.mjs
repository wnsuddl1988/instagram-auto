#!/usr/bin/env node
/**
 * check-instagram-blob-upload-plan-from-content-unit-static.mjs
 *
 * Static guard: Instagram Vercel Blob upload plan from content unit manifest (no-upload).
 * task: instagram-blob-upload-plan-from-content-unit-no-upload-v1
 *
 * Dependency-free. Reads planner source text + fixture JSON, and (for execution checks)
 * runs the planner itself via spawnSync/child_process with real local fixtures — no
 * network, no external API, no env/secret access, no @vercel/blob call.
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

const PLANNER_PATH = resolve(__dirname, "plan-instagram-blob-upload-from-content-unit.mjs");
const ENTRYPOINT_PATH = resolve(__dirname, "run-owner-daily-automation-entrypoint.mjs");
const RUNBOOK_PATH = resolve(REPO_ROOT, "docs/owner-daily-automation-runbook.md");
const SAMPLE_REQUEST_PATH = resolve(REPO_ROOT, "scripts/fixtures/instagram_blob_upload_plan_from_content_unit.sample.v1.json");
const CONTENT_UNIT_SAMPLE_PATH = resolve(REPO_ROOT, "scripts/fixtures/dual_platform_content_unit.sample.v1.json");

// 실제 존재하는 로컬 mp4(이전 phase에서 생성된 real 파일, 35MB 이하) — smoke 실행에 재사용한다.
const REAL_SOURCE_MP4 = "C:\\tmp\\money-shorts-os\\golden-sample-chatgpt-playwright-v3-2-script-voice-mux-audit\\golden_sample_t1_lifestyle_inflation_tts_mux_v3_2.mp4";

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
 * 실제 실행 코드에서 import/호출 여부를 검사하기 위해 블록 주석과 문자열 리터럴 본문을 지운다.
 * 주석/문서/console.log 안의 "@vercel/blob"/"put()" 언급이 실제 import/호출로 오탐되는 것을 막는다.
 */
function stripStringLiterals(code) {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/"(?:[^"\\]|\\.)*"/g, '""')
    .replace(/'(?:[^'\\]|\\.)*'/g, "''")
    .replace(/`(?:[^`\\]|\\.)*`/g, "``");
}

console.log("\nStatic guard check: instagram blob upload plan from content unit\n");

// ── planner file existence + source safety ───────────────────────────────────
console.log("[ planner source safety ]");
check("planner file exists", existsSync(PLANNER_PATH));
const plannerSrc = existsSync(PLANNER_PATH) ? readFileSync(PLANNER_PATH, "utf-8") : "";
const plannerCode = codeLines(plannerSrc);

const plannerCodeNoStrings = stripStringLiterals(plannerCode);
check("no process.env access", !plannerCode.includes("process.env"));
check("no .env.local reference in executable code", !plannerCode.includes(".env.local"));
check("no @vercel/blob import (actual import statement, not doc/string mentions)", !plannerCodeNoStrings.includes("@vercel/blob"));
check(
  "no Blob put(/list(/head(/del( call pattern (property access like putOptions/putCall is fine)",
  !/(^|[^a-zA-Z_.])(put|list|head|del)\s*\(/.test(plannerCodeNoStrings.replace(/\bput[A-Za-z]*\s*[:=]/g, "")),
);
check("no fetch(", !plannerCodeNoStrings.includes("fetch("));
check("no axios", !plannerCodeNoStrings.includes("axios"));
check("no googleapis", !plannerCodeNoStrings.toLowerCase().includes("googleapis"));
check(
  "no ffmpeg/spawnSync/child_process usage (media generation absent)",
  !/spawnSync|child_process|\bffmpeg\s*\(/i.test(plannerCode.replace(/\.\s*ffmpeg[A-Za-z]*/gi, "")),
);
check("no secret value shape (EAA/ya29/blob token) in source", !/(EAA[A-Za-z0-9]{20}|ya29\.[A-Za-z0-9_-]{20}|vercel_blob_rw_[A-Za-z0-9]{10})/.test(plannerSrc));
check("no shell: true", !plannerCode.includes("shell: true") && !plannerCode.includes("shell:true"));

// ── required contract constants/functions in planner ─────────────────────────
console.log("\n[ planner contract constants/functions ]");
check("exports CONTENT_UNIT_MANIFEST_SCHEMA_VERSION = dual_platform_content_unit_v1", /CONTENT_UNIT_MANIFEST_SCHEMA_VERSION\s*=\s*"dual_platform_content_unit_v1"/.test(plannerSrc));
check("exports UPLOAD_REQUEST_SCHEMA_VERSION = instagram_blob_upload_request_v1", /UPLOAD_REQUEST_SCHEMA_VERSION\s*=\s*"instagram_blob_upload_request_v1"/.test(plannerSrc));
check("exports INSTAGRAM_BLOB_PLATFORM = instagram", /INSTAGRAM_BLOB_PLATFORM\s*=\s*"instagram"/.test(plannerSrc));
check("exports INSTAGRAM_BLOB_VARIANT_ID = instagram_reels_full_frame_1080x1920", /INSTAGRAM_BLOB_VARIANT_ID\s*=\s*"instagram_reels_full_frame_1080x1920"/.test(plannerSrc));
check("exports INSTAGRAM_BLOB_PATH_PREFIX = instagram/reels", /INSTAGRAM_BLOB_PATH_PREFIX\s*=\s*"instagram\/reels"/.test(plannerSrc));
check("exports INSTAGRAM_BLOB_CONTENT_TYPE = video/mp4", /INSTAGRAM_BLOB_CONTENT_TYPE\s*=\s*"video\/mp4"/.test(plannerSrc));
check("exports INSTAGRAM_BLOB_SIZE_CAP_BYTES = 35 * 1024 * 1024", /INSTAGRAM_BLOB_SIZE_CAP_BYTES\s*=\s*35\s*\*\s*1024\s*\*\s*1024/.test(plannerSrc));
check(
  "exports INSTAGRAM_BLOB_UPLOAD_APPROVAL_TOKEN = APPROVE_VERCEL_BLOB_OBJECT_UPLOAD_TEST",
  /INSTAGRAM_BLOB_UPLOAD_APPROVAL_TOKEN\s*=\s*"APPROVE_VERCEL_BLOB_OBJECT_UPLOAD_TEST"/.test(plannerSrc),
);
check("has buildInstagramBlobPathname function", plannerCode.includes("export function buildInstagramBlobPathname"));
check("has buildInstagramBlobPutOptionPlan function", plannerCode.includes("export function buildInstagramBlobPutOptionPlan"));
check("has planInstagramBlobUploadFromContentUnit function", plannerCode.includes("export function planInstagramBlobUploadFromContentUnit"));
check(
  "putOptionPlan fixes access:public / addRandomSuffix:false / allowOverwrite:false / multipart:true",
  /access:\s*"public"/.test(plannerCode) &&
    /addRandomSuffix:\s*false/.test(plannerCode) &&
    /allowOverwrite:\s*false/.test(plannerCode) &&
    /multipart:\s*true/.test(plannerCode),
);
check("validates schemaVersion === dual_platform_content_unit_v1", /manifest\?\.schemaVersion\s*!==\s*CONTENT_UNIT_MANIFEST_SCHEMA_VERSION/.test(plannerCode));
check("validates contentId non-empty", /contentId_missing/.test(plannerCode));
check("validates version non-empty", /version_missing/.test(plannerCode));
check("validates instagramSourcePath is .mp4", /instagramSourcePath_missing_or_not_mp4/.test(plannerCode));
check("validates instagramSourcePath existence", /instagramSourcePath_file_not_found/.test(plannerCode));
check("validates size > 0", /size_invalid/.test(plannerCode));
check("validates size <= 35MB cap", /size_exceeds_cap/.test(plannerCode));
check("computes sha256 via node:crypto createHash", /createHash\(\s*["']sha256["']\s*\)/.test(plannerCode));
check("request includes uploadPerformed:false", /uploadPerformed:\s*false/.test(plannerCode));
check("request includes willUpload:false", /willUpload:\s*false/.test(plannerCode));
check("request includes requiresApprovalToken", /requiresApprovalToken:\s*INSTAGRAM_BLOB_UPLOAD_APPROVAL_TOKEN/.test(plannerCode));
check(
  "out-dir must be outside repo root (fail-closed check present)",
  /outDirAbs\.startsWith\(REPO_ROOT/.test(plannerCode),
);
check(".money-shorts-local access forbidden check present", plannerCode.includes(".money-shorts-local"));

// ── fixture parse + contract checks ───────────────────────────────────────────
console.log("\n[ fixture: instagram_blob_upload_plan_from_content_unit.sample.v1.json ]");
check("sample request fixture exists", existsSync(SAMPLE_REQUEST_PATH));
let sampleRequest = null;
if (existsSync(SAMPLE_REQUEST_PATH)) {
  try {
    sampleRequest = JSON.parse(readFileSync(SAMPLE_REQUEST_PATH, "utf-8"));
    check("fixture JSON parses", true);
  } catch (e) {
    check("fixture JSON parses", false, String(e?.message || e));
  }
}
if (sampleRequest) {
  check("fixture schemaVersion === instagram_blob_upload_request_v1", sampleRequest.schemaVersion === "instagram_blob_upload_request_v1");
  check("fixture noLive === true", sampleRequest.noLive === true);
  check("fixture envSecretValuesAccessedThisRun === false", sampleRequest.envSecretValuesAccessedThisRun === false);
  check("fixture platform === instagram", sampleRequest.platform === "instagram");
  check("fixture variantId === instagram_reels_full_frame_1080x1920", sampleRequest.variantId === "instagram_reels_full_frame_1080x1920");
  check("fixture contentType === video/mp4", sampleRequest.contentType === "video/mp4");
  check("fixture uploadPerformed === false", sampleRequest.uploadPerformed === false);
  check("fixture willUpload === false", sampleRequest.willUpload === false);
  check("fixture requiresApprovalToken === APPROVE_VERCEL_BLOB_OBJECT_UPLOAD_TEST", sampleRequest.requiresApprovalToken === "APPROVE_VERCEL_BLOB_OBJECT_UPLOAD_TEST");
  check(
    "fixture pathname matches instagram/reels/{contentId}/{variantId}/{version}/{sha256_12}.mp4",
    sampleRequest.pathname === `instagram/reels/${sampleRequest.contentId}/${sampleRequest.variantId}/${sampleRequest.version}/${sampleRequest.sha256_12}.mp4`,
  );
  check("fixture sha256_12 is first 12 chars of sha256", typeof sampleRequest.sha256 === "string" && sampleRequest.sha256.slice(0, 12) === sampleRequest.sha256_12);
  const sideEffects = sampleRequest.sideEffectCounters ?? {};
  const zeroFields = ["blobUploadCount", "blobListCount", "blobHeadCount", "blobDeleteCount", "blobCopyCount", "apiCallCount", "envSecretReadCount", "deployCount", "mediaGenerationCount"];
  check(
    `fixture sideEffectCounters all 0 (${zeroFields.join(",")})`,
    zeroFields.every((f) => sideEffects[f] === 0),
  );
  check("fixture sourceSizeBytes <= sourceSizeCapBytes (35MB)", typeof sampleRequest.sourceSizeBytes === "number" && sampleRequest.sourceSizeBytes <= sampleRequest.sourceSizeCapBytes);
}

// ── owner entrypoint integration ──────────────────────────────────────────────
console.log("\n[ owner entrypoint integration ]");
check("owner entrypoint file exists", existsSync(ENTRYPOINT_PATH));
const entrypointSrc = existsSync(ENTRYPOINT_PATH) ? readFileSync(ENTRYPOINT_PATH, "utf-8") : "";
check("owner entrypoint imports planInstagramBlobUploadFromContentUnit", entrypointSrc.includes("planInstagramBlobUploadFromContentUnit"));
check("owner entrypoint registers --plan-instagram-blob-upload mode", entrypointSrc.includes('"--plan-instagram-blob-upload"'));
check("owner entrypoint has runPlanInstagramBlobUpload function", entrypointSrc.includes("function runPlanInstagramBlobUpload"));
check("owner entrypoint switch dispatches --plan-instagram-blob-upload", /case\s+"--plan-instagram-blob-upload":/.test(entrypointSrc));

// ── docs ───────────────────────────────────────────────────────────────────────
console.log("\n[ runbook docs ]");
check("runbook file exists", existsSync(RUNBOOK_PATH));
const runbookSrc = existsSync(RUNBOOK_PATH) ? readFileSync(RUNBOOK_PATH, "utf-8") : "";
check("runbook mentions --plan-instagram-blob-upload", runbookSrc.includes("--plan-instagram-blob-upload"));
check("runbook mentions APPROVE_VERCEL_BLOB_OBJECT_UPLOAD_TEST", runbookSrc.includes("APPROVE_VERCEL_BLOB_OBJECT_UPLOAD_TEST"));

// ── execution smoke tests (real spawnSync, no network/API) ───────────────────
console.log("\n[ execution smoke tests ]");
const tmpDir = mkdtempSync(join(os.tmpdir(), "ig-blob-plan-guard-"));
try {
  // 정상 흐름: 실제 존재하는 로컬 mp4를 가리키는 content unit manifest → plan 성공.
  const goodManifestPath = join(tmpDir, "good_content_unit.json");
  writeFileSync(
    goodManifestPath,
    JSON.stringify({
      schemaVersion: "dual_platform_content_unit_v1",
      contentId: "t1_lifestyle_inflation",
      version: "v3_2",
      instagramSourcePath: REAL_SOURCE_MP4,
      youtubeSourcePath: "C:\\tmp\\money-shorts-os\\t1_lifestyle_inflation\\placeholder.mp4",
      instagramMetadata: { captionFirstLineHook: "x", caption: "x", hashtags: ["x"], callToAction: "x", forbiddenUnrelatedTrendTags: true },
      youtubeMetadata: { titleBase: "x", titleWithShortsSuffix: "x #Shorts", descriptionBase: "x", tags: ["x"], categoryId: "22", defaultLanguage: "ko", privacyStatus: "private", selfDeclaredMadeForKids: false },
      existingPublishedKeys: [],
    }),
    "utf-8",
  );

  const outDir = join(tmpDir, "out");
  let goodOk = false;
  let goodRequest = null;
  if (existsSync(REAL_SOURCE_MP4)) {
    try {
      execFileSync(process.execPath, [PLANNER_PATH, "--content-unit", goodManifestPath, "--out-dir", outDir], {
        cwd: REPO_ROOT,
        stdio: ["ignore", "pipe", "pipe"],
      });
      goodOk = true;
      const requestPath = join(outDir, "instagram-blob-upload-request.json");
      if (existsSync(requestPath)) goodRequest = JSON.parse(readFileSync(requestPath, "utf-8"));
    } catch (e) {
      goodOk = false;
    }
  }
  check(
    "real source mp4 present for smoke test (skips gracefully documented if missing)",
    existsSync(REAL_SOURCE_MP4),
    `expected fixture mp4 not found: ${REAL_SOURCE_MP4}`,
  );
  if (existsSync(REAL_SOURCE_MP4)) {
    check("planner exits 0 with real content unit + real mp4", goodOk);
    check("planner writes instagram-blob-upload-request.json", goodRequest != null);
    if (goodRequest) {
      check("output request uploadPerformed === false", goodRequest.uploadPerformed === false);
      check("output request sha256_12 matches pathname suffix", goodRequest.pathname.includes(goodRequest.sha256_12));
      check(
        "output request sideEffectCounters all 0",
        Object.values(goodRequest.sideEffectCounters ?? {}).every((v) => v === 0),
      );
    }
  }

  // fail-closed: content unit manifest not found.
  let missingManifestExitCode = 0;
  try {
    execFileSync(process.execPath, [PLANNER_PATH, "--content-unit", join(tmpDir, "does_not_exist.json"), "--out-dir", join(tmpDir, "out2")], {
      cwd: REPO_ROOT,
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (e) {
    missingManifestExitCode = e.status ?? 1;
  }
  check("missing content unit manifest → exit != 0 (fail-closed)", missingManifestExitCode !== 0);

  // fail-closed: instagramSourcePath does not exist.
  const badManifestPath = join(tmpDir, "bad_content_unit_missing_source.json");
  writeFileSync(
    badManifestPath,
    JSON.stringify({
      schemaVersion: "dual_platform_content_unit_v1",
      contentId: "t9_missing_source",
      version: "v1",
      instagramSourcePath: join(tmpDir, "does_not_exist.mp4"),
      youtubeSourcePath: "x",
      instagramMetadata: {},
      youtubeMetadata: {},
      existingPublishedKeys: [],
    }),
    "utf-8",
  );
  let missingSourceExitCode = 0;
  try {
    execFileSync(process.execPath, [PLANNER_PATH, "--content-unit", badManifestPath, "--out-dir", join(tmpDir, "out3")], {
      cwd: REPO_ROOT,
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (e) {
    missingSourceExitCode = e.status ?? 1;
  }
  check("missing instagramSourcePath file → exit != 0 (fail-closed)", missingSourceExitCode !== 0);

  // fail-closed: --out-dir inside repo root.
  let outDirInsideRepoExitCode = 0;
  if (existsSync(REAL_SOURCE_MP4)) {
    try {
      execFileSync(process.execPath, [PLANNER_PATH, "--content-unit", goodManifestPath, "--out-dir", join(REPO_ROOT, "tmp-guard-out-should-not-be-created")], {
        cwd: REPO_ROOT,
        stdio: ["ignore", "pipe", "pipe"],
      });
    } catch (e) {
      outDirInsideRepoExitCode = e.status ?? 1;
    }
    check("--out-dir inside repo root → exit != 0 (fail-closed)", outDirInsideRepoExitCode !== 0);
    check("--out-dir inside repo root did not create output dir", !existsSync(join(REPO_ROOT, "tmp-guard-out-should-not-be-created")));
  }

  // fail-closed: wrong schemaVersion.
  const wrongSchemaManifestPath = join(tmpDir, "wrong_schema_content_unit.json");
  writeFileSync(
    wrongSchemaManifestPath,
    JSON.stringify({ schemaVersion: "not_the_right_schema_v1", contentId: "x", version: "x", instagramSourcePath: REAL_SOURCE_MP4 }),
    "utf-8",
  );
  let wrongSchemaExitCode = 0;
  try {
    execFileSync(process.execPath, [PLANNER_PATH, "--content-unit", wrongSchemaManifestPath, "--out-dir", join(tmpDir, "out4")], {
      cwd: REPO_ROOT,
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (e) {
    wrongSchemaExitCode = e.status ?? 1;
  }
  check("wrong schemaVersion → exit != 0 (fail-closed)", wrongSchemaExitCode !== 0);

  // owner entrypoint forwarding: same good manifest via owner entrypoint --plan-instagram-blob-upload.
  if (existsSync(REAL_SOURCE_MP4)) {
    const ownerOutDir = join(tmpDir, "owner-out");
    let ownerOk = false;
    try {
      execFileSync(process.execPath, [ENTRYPOINT_PATH, "--plan-instagram-blob-upload", "--content-unit", goodManifestPath, "--out-dir", ownerOutDir], {
        cwd: REPO_ROOT,
        stdio: ["ignore", "pipe", "pipe"],
      });
      ownerOk = true;
    } catch (e) {
      ownerOk = false;
    }
    check("owner entrypoint --plan-instagram-blob-upload exits 0 with real content unit", ownerOk);
    check(
      "owner entrypoint --plan-instagram-blob-upload writes instagram-blob-upload-request.json",
      existsSync(join(ownerOutDir, "instagram-blob-upload-request.json")),
    );
  }
} finally {
  rmSync(tmpDir, { recursive: true, force: true });
}

// ── done ───────────────────────────────────────────────────────────────────────
console.log(`\n${passed} PASS / ${failed} FAIL\n`);
process.exit(failed === 0 ? 0 : 1);
