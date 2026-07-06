#!/usr/bin/env node
/**
 * check-vercel-blob-dependency-code-integration-static.mjs
 *
 * Vercel Blob dependency + code integration (no-upload) 정적 가드.
 * task: vercel-blob-dependency-code-integration-no-upload-v1
 *
 * 이 가드 자체는 no-live다: 레포 내 fixture JSON + docs + lib/planner 소스 텍스트만 읽는다.
 * (network/env/secret/SDK/subprocess/write 없음)
 *
 * 검증:
 *  1) fixture: dependency=@vercel/blob(단일)/additive lockfile, platform=instagram_only,
 *     youtubeUsesBlob=false, putOptionPlan(access public/no random/no overwrite/multipart),
 *     size cap 35MB fail-closed, upload fail-closed + approval token,
 *     count(putCall/upload/env/deploy/instagram/youtube) 전부 0, secret 미기록.
 *  2) lib/instagram-blob-media.ts 소스:
 *     - deterministic pathname 패턴 존재
 *     - put()을 실제 호출하는 코드 없음(import type만 허용, 값 import/put( 호출 금지)
 *     - uploadInstagramBlob이 항상 uploaded:false를 반환하는 fail-closed 형태
 *  3) planner 소스: @vercel/blob 미참조, upload/network/env 미참조.
 *  4) package.json: @vercel/blob dependency 존재.
 *  5) docs: dependency/code/no-upload/fail-closed/다음 게이트 명시.
 *  6) mutant → 전부 fail.
 */
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const SELF = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SELF), "..");
const J = (a, b) => a + b; // 토큰 분할-연결 (self-scan denylist 예외, 검색 전용)

const FIXTURE_PATH = path.join(ROOT, "scripts", "fixtures", "vercel_blob_dependency_code_integration_no_upload.v1.json");
const DOCS_PATH = path.join(ROOT, "docs", "vercel-blob-dependency-code-integration-no-upload.md");
const LIB_PATH = path.join(ROOT, "lib", "instagram-blob-media.ts");
const PLANNER_PATH = path.join(ROOT, "scripts", "plan-vercel-blob-instagram-upload-no-upload.mjs");
const PKG_PATH = path.join(ROOT, "package.json");

const ZERO_COUNT_FIELDS = [
  "blobObjectUploadCount",
  "publicUrlLivenessCheckCount",
  "envSecretAccessCount",
  "projectConnectionCount",
  "putCallCount",
  "deployCount",
  "instagramApiCallCount",
  "youtubeApiCallCount",
  "otherDependencyChangeCount",
];

let passes = 0;
let failures = 0;
function check(name, ok, detail) {
  if (ok) { passes += 1; console.log(`PASS  ${name}`); }
  else { failures += 1; console.error(`FAIL  ${name}${detail ? " — " + detail : ""}`); }
}
const clone = (o) => JSON.parse(JSON.stringify(o));

/**
 * 주석/문자열 리터럴을 제거해 "실제 코드"만 남긴다.
 * - 라인 주석과 블록 주석 본문, JSDoc 라인 제거
 * - 큰따옴표/작은따옴표/백틱 문자열 리터럴 본문 제거
 * put 호출과 @vercel/blob 값 참조가 주석/문자열에서 false positive 나는 것을 막는다.
 */
function stripCommentsAndStrings(src) {
  if (!src) return "";
  const codeLines = [];
  let inBlock = false;
  for (const raw of src.split("\n")) {
    let line = raw;
    const trimmed = line.trim();
    if (inBlock) {
      const end = line.indexOf("*/");
      if (end === -1) continue;
      line = line.slice(end + 2);
      inBlock = false;
    }
    // 라인 전체가 JSDoc/블록 주석 연속(* ...)인 경우 스킵
    if (trimmed.startsWith("*") || trimmed.startsWith("//")) continue;
    // 인라인 블록 주석 시작
    const blockStart = line.indexOf("/*");
    if (blockStart !== -1) {
      const end = line.indexOf("*/", blockStart + 2);
      if (end === -1) { line = line.slice(0, blockStart); inBlock = true; }
      else { line = line.slice(0, blockStart) + line.slice(end + 2); }
    }
    // 인라인 라인 주석
    const lc = line.indexOf("//");
    if (lc !== -1) line = line.slice(0, lc);
    // 문자열 리터럴 본문 제거
    line = line.replace(/"(?:[^"\\]|\\.)*"/g, '""')
               .replace(/'(?:[^'\\]|\\.)*'/g, "''")
               .replace(/`(?:[^`\\]|\\.)*`/g, "``");
    codeLines.push(line);
  }
  return codeLines.join("\n");
}

// ── 로드 ─────────────────────────────────────────────────────────────────────
let fx = null;
try {
  fx = JSON.parse(readFileSync(FIXTURE_PATH, "utf8"));
  check("integration fixture parses as JSON", true);
} catch (e) {
  check("integration fixture parses as JSON", false, String(e).slice(0, 160));
}
let docs = null, lib = null, planner = null, pkg = null;
try { docs = readFileSync(DOCS_PATH, "utf8"); check("docs readable", true); }
catch (e) { check("docs readable", false, String(e).slice(0, 120)); }
try { lib = readFileSync(LIB_PATH, "utf8"); check("lib/instagram-blob-media.ts readable", true); }
catch (e) { check("lib/instagram-blob-media.ts readable", false, String(e).slice(0, 120)); }
try { planner = readFileSync(PLANNER_PATH, "utf8"); check("planner readable", true); }
catch (e) { check("planner readable", false, String(e).slice(0, 120)); }
try { pkg = JSON.parse(readFileSync(PKG_PATH, "utf8")); check("package.json parses", true); }
catch (e) { check("package.json parses", false, String(e).slice(0, 120)); }

// ── fixture 불변식 (mutant 재사용) ────────────────────────────────────────────
function detectFixtureIssues(p) {
  const issues = [];
  if (!p) return ["fixture null"];

  const dep = p.dependency ?? {};
  if (dep.packageName !== "@vercel/blob") issues.push(`dependency.packageName=${dep.packageName}`);
  if (dep.onlyThisDependencyChanged !== true) issues.push("dependency.onlyThisDependencyChanged != true");
  if (dep.lockfileChangeAdditiveOnly !== true) issues.push("dependency.lockfileChangeAdditiveOnly != true");
  if (dep.packageManager !== "pnpm") issues.push(`dependency.packageManager=${dep.packageManager}`);

  if (p.platform !== "instagram_only") issues.push(`platform=${p.platform}`);
  if (p.instagramVariantId !== "instagram_reels_full_frame_1080x1920") issues.push(`instagramVariantId=${p.instagramVariantId}`);
  if (p.youtubeUsesBlob !== false) issues.push("youtubeUsesBlob != false (Blob이 YouTube로 라우팅됨)");

  const ci = p.codeIntegration ?? {};
  if (ci.instagramOnlyGuard !== true) issues.push("codeIntegration.instagramOnlyGuard != true");
  if (ci.variantGuard !== "instagram_reels_full_frame_1080x1920") issues.push(`codeIntegration.variantGuard=${ci.variantGuard}`);
  if (ci.sizeGuardFailClosed !== true) issues.push("codeIntegration.sizeGuardFailClosed != true");
  if (ci.sizeCapMb !== 35) issues.push(`codeIntegration.sizeCapMb=${ci.sizeCapMb} (35 아님)`);
  if (ci.extensionGuard !== "mp4") issues.push(`codeIntegration.extensionGuard=${ci.extensionGuard}`);
  if (ci.contentTypeGuard !== "video/mp4") issues.push(`codeIntegration.contentTypeGuard=${ci.contentTypeGuard}`);
  if (ci.noUploadPlanBuilder !== true) issues.push("codeIntegration.noUploadPlanBuilder != true");
  if (ci.uploadFunctionFailClosed !== true) issues.push("codeIntegration.uploadFunctionFailClosed != true");
  if (ci.uploadApprovalToken !== "APPROVE_VERCEL_BLOB_OBJECT_UPLOAD_TEST") issues.push("codeIntegration.uploadApprovalToken 누락/불일치");
  if (!ci.deterministicPathnamePattern || !ci.deterministicPathnamePattern.includes("{contentId}") ||
      !ci.deterministicPathnamePattern.includes("{sha256_12}"))
    issues.push("codeIntegration.deterministicPathnamePattern 형태 오류");

  const po = ci.putOptionPlan ?? {};
  if (po.access !== "public") issues.push(`putOptionPlan.access=${po.access}`);
  if (po.addRandomSuffix !== false) issues.push("putOptionPlan.addRandomSuffix != false");
  if (po.allowOverwrite !== false) issues.push("putOptionPlan.allowOverwrite != false");
  if (po.multipart !== true) issues.push("putOptionPlan.multipart != true");
  if (po.contentType !== "video/mp4") issues.push(`putOptionPlan.contentType=${po.contentType}`);

  const pr = p.noUploadPlannerResult ?? {};
  if (pr.uploadPerformed !== false) issues.push("noUploadPlannerResult.uploadPerformed != false");
  if (pr.sizeMatchesExpected !== true) issues.push("noUploadPlannerResult.sizeMatchesExpected != true");
  if (pr.status !== "PLANNED_NO_UPLOAD") issues.push(`noUploadPlannerResult.status=${pr.status}`);

  for (const k of ZERO_COUNT_FIELDS) {
    if (p[k] !== 0) issues.push(`${k}=${p[k]} (0 아님)`);
  }

  if (p.secretValueRecorded !== false) issues.push("secretValueRecorded != false");
  if (p.tokenValueRecorded !== false) issues.push("tokenValueRecorded != false");

  if (!Array.isArray(p.prohibitedDrift?.cases) || p.prohibitedDrift.cases.length < 8)
    issues.push("prohibitedDrift.cases 부족(8개 미만)");

  return issues;
}

function hasSecretLiteral(obj) {
  const s = typeof obj === "string" ? obj : JSON.stringify(obj ?? {});
  if (/vercel_blob_rw_[A-Za-z0-9]{6,}/.test(s)) return true;
  if (/BLOB_READ_WRITE_TOKEN\s*[:=]\s*["']?[A-Za-z0-9_]{12,}/.test(s)) return true;
  return false;
}

// ── 1. fixture ───────────────────────────────────────────────────────────────
{
  check("fixture schemaVersion + taskId + status",
    fx?.schemaVersion === "vercel_blob_dependency_code_integration_no_upload_v1" &&
    fx?.taskId === "vercel-blob-dependency-code-integration-no-upload-v1" &&
    fx?.status === "DEPENDENCY_INSTALLED_CODE_INTEGRATED_NO_UPLOAD");
  const issues = detectFixtureIssues(fx);
  check("fixture invariants: dependency=@vercel/blob 단일/additive, instagram_only/YouTube no-Blob, putOptionPlan(public/no-random/no-overwrite/multipart), size cap 35 fail-closed, upload fail-closed+token, planner PLANNED_NO_UPLOAD, count 0, secret 미기록",
    issues.length === 0, issues.join("; "));
  check("fixture refs 실재 (docs/packet/provisioning/lib/planner)",
    ["docsRef", "integrationPacketRef", "provisioningResultRef", "libModuleRef", "plannerRef"].every(
      (k) => typeof fx?.[k] === "string" && existsSync(path.join(ROOT, fx[k]))));
  check("fixture 전체에 secret-like 리터럴 미포함", !hasSecretLiteral(fx));
}

// ── 2. lib 소스 정적 검증 ─────────────────────────────────────────────────────
{
  check("lib: deterministic pathname 패턴 존재",
    lib?.includes("instagram/reels") && lib?.includes("sha256_12") && lib?.includes("${INSTAGRAM_BLOB_EXTENSION}"));
  check("lib: @vercel/blob는 import type만 (값 import 아님)",
    lib?.includes("import type") && lib?.includes("@vercel/blob") &&
    !/import\s+\{[^}]*\}\s+from\s+["']@vercel\/blob["']/.test(lib ?? "") &&
    !/import\s+\*\s+as\s+\w+\s+from\s+["']@vercel\/blob["']/.test(lib ?? ""));
  // put()을 실제 호출하는 코드가 없어야 함 (주석/문자열 제거 후 검사)
  const libCode = stripCommentsAndStrings(lib ?? "");
  check("lib: 실제 put() 호출 없음 (주석/문자열 제외)",
    !/(^|[^.\w])put\s*\(/m.test(libCode));
  check("lib: uploadInstagramBlob fail-closed (uploaded:false + blocked error)",
    lib?.includes("uploaded: false") && lib?.includes("INSTAGRAM_BLOB_UPLOAD_BLOCKED_NO_APPROVAL") &&
    lib?.includes("APPROVE_VERCEL_BLOB_OBJECT_UPLOAD_TEST"));
  check("lib: size cap 35MB + fail-closed guard 존재",
    lib?.includes("35 * 1024 * 1024") && lib?.includes("size_exceeds_cap"));
  check("lib: put 옵션 plan(access public/addRandomSuffix false/allowOverwrite false/multipart true) 존재",
    lib?.includes('access: "public"') && lib?.includes("addRandomSuffix: false") &&
    lib?.includes("allowOverwrite: false") && lib?.includes("multipart: true"));
  check("lib 소스에 secret-like 리터럴 미포함", !hasSecretLiteral(lib ?? ""));
}

// ── 3. planner 소스 정적 검증 ─────────────────────────────────────────────────
{
  const plannerCode = stripCommentsAndStrings(planner ?? "");
  check("planner: @vercel/blob 미참조 (주석/문자열 제외)",
    planner != null && !plannerCode.includes("@vercel/blob"));
  check("planner: 실제 put()/upload 호출 없음 (주석/문자열 제외)",
    planner != null && !/(^|[^.\w])put\s*\(/m.test(plannerCode) && !plannerCode.includes(".upload("));
  check("planner: NO_UPLOAD 모드 + uploadPerformed:false",
    planner?.includes("NO_UPLOAD_DRY_PLAN") && planner?.includes("uploadPerformed = false"));
  check("planner: read-only (readFile/stat만, writeFile 없음)",
    planner?.includes("readFile") && !planner.includes("writeFile"));
}

// ── 4. package.json ──────────────────────────────────────────────────────────
{
  check("package.json: @vercel/blob dependency 존재",
    typeof pkg?.dependencies?.["@vercel/blob"] === "string" &&
    pkg.dependencies["@vercel/blob"].includes("2"));
}

// ── 5. docs ──────────────────────────────────────────────────────────────────
{
  check("docs: dependency 설치(@vercel/blob 2.5.0 + pnpm) 명시",
    docs?.includes("@vercel/blob") && docs?.includes("2.5.0") && docs?.includes("pnpm"));
  check("docs: no-upload / fail-closed / put 미호출 명시",
    (docs?.includes("no-upload") || docs?.includes("NO-UPLOAD") || docs?.includes("업로드하지")) &&
    docs?.includes("fail-closed") && docs?.includes("put"));
  check("docs: deterministic pathname + put 옵션 명시",
    docs?.includes("instagram/reels/") && docs?.includes("sha256_12") &&
    docs?.includes("allowOverwrite"));
  check("docs: 다음 승인 게이트(object upload test/liveness/arm) 명시",
    docs?.includes("APPROVE_VERCEL_BLOB_OBJECT_UPLOAD_TEST") &&
    docs?.includes("APPROVE_INSTAGRAM_ARM"));
  check("docs 전체에 secret-like 리터럴 미포함", !hasSecretLiteral(docs ?? ""));
}

// ── 6. 가드 self 스캔 ────────────────────────────────────────────────────────
{
  const selfSrc = readFileSync(SELF, "utf8");
  const liveTokens = [J("fet", "ch("), J("child_", "process"), J("spawn", "("),
    J("exec", "Sync("), J("write", "FileSync"), J("mkdir", "Sync"), J("rm", "Sync"),
    J("XMLHttp", "Request"), J("vercel ", "env pull")];
  const hit = liveTokens.find((t) => selfSrc.includes(t));
  check("guard 자체에 live/write 패턴 없음 (self-scan)", !hit, hit ? `token=${hit}` : "");
  const specifiers = [...selfSrc.matchAll(/^import\s[^\n]*?from\s+["']([^"']+)["']/gm)].map((m) => m[1]);
  const allow = new Set(["node:fs", "node:path", "node:url"]);
  check("guard imports restricted to node:fs/node:path/node:url",
    specifiers.length > 0 && specifiers.every((sp) => allow.has(sp)));
  console.log("NOTE  scanner holds forbidden tokens split-concatenated only (denylist exception)");
}

// ── 7. mutant — fail-closed ──────────────────────────────────────────────────
{
  const m1 = clone(fx); m1.dependency.packageName = "some-other-pkg";
  check("mutant 1: dependency가 @vercel/blob가 아님 → fail",
    detectFixtureIssues(m1).some((i) => i.includes("packageName")));

  const m2 = clone(fx); m2.dependency.onlyThisDependencyChanged = false;
  check("mutant 2: 다른 dependency churn 발생 → fail",
    detectFixtureIssues(m2).some((i) => i.includes("onlyThisDependencyChanged")));

  const m3 = clone(fx); m3.youtubeUsesBlob = true;
  check("mutant 3: Blob이 YouTube로 라우팅 → fail",
    detectFixtureIssues(m3).some((i) => i.includes("youtubeUsesBlob")));

  const m4 = clone(fx); m4.codeIntegration.putOptionPlan.allowOverwrite = true;
  check("mutant 4: putOptionPlan allowOverwrite=true → fail",
    detectFixtureIssues(m4).some((i) => i.includes("allowOverwrite")));

  const m5 = clone(fx); m5.codeIntegration.putOptionPlan.access = "private";
  check("mutant 5: putOptionPlan access private → fail",
    detectFixtureIssues(m5).some((i) => i.includes("access")));

  const m6 = clone(fx); m6.codeIntegration.putOptionPlan.multipart = false;
  check("mutant 6: putOptionPlan multipart=false → fail",
    detectFixtureIssues(m6).some((i) => i.includes("multipart")));

  const m7 = clone(fx); m7.codeIntegration.uploadFunctionFailClosed = false;
  check("mutant 7: upload function fail-closed 해제 → fail",
    detectFixtureIssues(m7).some((i) => i.includes("uploadFunctionFailClosed")));

  const m8 = clone(fx); m8.codeIntegration.sizeCapMb = 100;
  check("mutant 8: size cap이 35MB가 아님 → fail",
    detectFixtureIssues(m8).some((i) => i.includes("sizeCapMb")));

  const m9 = clone(fx); m9.putCallCount = 1;
  check("mutant 9: putCallCount>0 → fail",
    detectFixtureIssues(m9).some((i) => i.includes("putCallCount")));

  const m10 = clone(fx); m10.blobObjectUploadCount = 1;
  check("mutant 10: blobObjectUploadCount>0 → fail",
    detectFixtureIssues(m10).some((i) => i.includes("blobObjectUploadCount")));

  const m11 = clone(fx); m11.envSecretAccessCount = 1;
  check("mutant 11: envSecretAccessCount>0 → fail",
    detectFixtureIssues(m11).some((i) => i.includes("envSecretAccessCount")));

  const m12 = clone(fx); m12.instagramApiCallCount = 1;
  check("mutant 12: instagramApiCallCount>0 → fail",
    detectFixtureIssues(m12).some((i) => i.includes("instagramApiCallCount")));

  const m13 = clone(fx); m13.noUploadPlannerResult.uploadPerformed = true;
  check("mutant 13: planner uploadPerformed=true → fail",
    detectFixtureIssues(m13).some((i) => i.includes("uploadPerformed")));

  const m14 = clone(fx); m14.platform = "instagram_and_youtube";
  check("mutant 14: platform이 instagram_only 벗어남 → fail",
    detectFixtureIssues(m14).some((i) => i.includes("platform=")));

  const m15 = clone(fx); m15.secretValueRecorded = true;
  check("mutant 15: secretValueRecorded=true → fail",
    detectFixtureIssues(m15).some((i) => i.includes("secretValueRecorded")));

  const m16 = clone(fx); m16.codeIntegration.uploadApprovalToken = null;
  check("mutant 16: upload approval token 누락 → fail",
    detectFixtureIssues(m16).some((i) => i.includes("uploadApprovalToken")));

  // secret literal 스캐너 mutant
  check("mutant 17: secret-like 리터럴 삽입 → 스캐너 감지",
    hasSecretLiteral({ leak: "vercel_blob_rw_abcdef1234567890XYZ" }));
}

console.log(`\nRESULT: ${failures === 0 ? "ALL PASS" : "FAIL"} (${passes + failures} checks)`);
process.exit(failures === 0 ? 0 : 1);
