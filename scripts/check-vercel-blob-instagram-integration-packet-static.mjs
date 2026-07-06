#!/usr/bin/env node
/**
 * check-vercel-blob-instagram-integration-packet-static.mjs
 *
 * Vercel Blob → Instagram integration packet — 정적 가드 (no-secret/no-provisioning/no-live).
 * task: vercel-blob-instagram-integration-packet-v1
 *
 * 이 가드 자체는 no-live다: 레포 내 integration packet fixture JSON + docs 텍스트만 읽는다.
 * (network/env/secret/upload/subprocess/write 없음)
 *
 * 검증:
 *  1) fixture: provider=vercel_blob_public_direct_url, platform=instagram_only,
 *     YouTube가 Blob/public URL 미사용, blobStore.accessMode=public(생성 시 불변),
 *     envNamesOnly.writeToken=BLOB_READ_WRITE_TOKEN(secret 값 없음),
 *     dependencyStatus(@vercel/blob 미설치 + 이 slice에서 dependency 변경 미승인),
 *     uploadPathDesign(Function body route 금지, local/worker SDK),
 *     objectKeyContract(deterministic immutable, allowOverwrite=false, addRandomSuffix=false),
 *     uploadVerifierGates 상속(HTTPS/2xx|206/video/reject html/unauth/verified-only),
 *     retentionPolicy + sizeCostGuard 존재,
 *     futureApprovalGates(store/dependency/env/upload/liveness/arm/cleanup),
 *     forbiddenBehavior, secret 값 미기록
 *  2) docs: Instagram-vs-YouTube 이유 / public store 이유 / Function body 회피 이유 /
 *     key scheme / retention / cost guard / future gate / 금지 항목 명문화
 *  3) mutant → 전부 fail (Blob→YouTube 라우팅, private store, token 값 삽입,
 *     dependency 승인됨, upload/provisioning/env/arm 허용, overwrite/random-only key,
 *     verifier gate 제거, retention/cost guard 제거 시 fail)
 */
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const SELF = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SELF), "..");
const J = (a, b) => a + b; // 토큰 분할-연결 (self-scan denylist 예외, 검색 전용)

const FIXTURE_PATH = path.join(ROOT, "scripts", "fixtures", "vercel_blob_instagram_integration_packet.v1.json");
const DOCS_PATH = path.join(ROOT, "docs", "vercel-blob-instagram-integration-packet.md");

const REQUIRED_FUTURE_GATES = [
  "APPROVE_VERCEL_BLOB_STORE_PROVISIONING",
  "APPROVE_VERCEL_BLOB_DEPENDENCY_AND_CODE_INTEGRATION",
  "APPROVE_VERCEL_BLOB_ENV_TOKEN_WRITE_OR_PULL",
  "APPROVE_VERCEL_BLOB_OBJECT_UPLOAD_TEST",
  "APPROVE_VERCEL_BLOB_PUBLIC_URL_LIVENESS",
  "APPROVE_INSTAGRAM_ARM",
  "APPROVE_VERCEL_BLOB_CLEANUP_RETENTION_JOB",
];

let passes = 0;
let failures = 0;
function check(name, ok, detail) {
  if (ok) { passes += 1; console.log(`PASS  ${name}`); }
  else { failures += 1; console.error(`FAIL  ${name}${detail ? " — " + detail : ""}`); }
}
const isStr = (v) => typeof v === "string" && v.trim().length > 0;
const clone = (o) => JSON.parse(JSON.stringify(o));

// ── 로드 ─────────────────────────────────────────────────────────────────────
let fx = null;
try {
  fx = JSON.parse(readFileSync(FIXTURE_PATH, "utf8"));
  check("integration packet fixture parses as JSON", true);
} catch (e) {
  check("integration packet fixture parses as JSON", false, String(e).slice(0, 160));
}
let docs = null;
try {
  docs = readFileSync(DOCS_PATH, "utf8");
  check("integration packet docs readable", true);
} catch (e) {
  check("integration packet docs readable", false, String(e).slice(0, 120));
}

// ── fixture 불변식 검증 함수 (mutant 재사용) ─────────────────────────────────
function detectFixtureIssues(p) {
  const issues = [];
  if (!p) return ["fixture null"];

  if (p.provider !== "vercel_blob_public_direct_url")
    issues.push(`provider=${p.provider} (vercel_blob_public_direct_url 아님)`);
  if (p.platform !== "instagram_only")
    issues.push(`platform=${p.platform} (instagram_only 아님 — Blob이 다른 플랫폼으로 라우팅됨)`);

  // YouTube가 Blob/public URL을 쓰면 안 됨
  const yt = p.youtube ?? {};
  if (yt.usesBlobUrl !== false) issues.push("youtube.usesBlobUrl != false (Blob이 YouTube로 라우팅됨)");
  if (yt.usesPublicUrlLayer !== false) issues.push("youtube.usesPublicUrlLayer != false");
  if (yt.uploadMode !== "youtube_data_api_direct_file_upload")
    issues.push(`youtube.uploadMode=${yt.uploadMode} (direct file upload 아님)`);

  // Blob store: public + 생성 시 불변
  const store = p.blobStore ?? {};
  if (store.accessMode !== "public") issues.push(`blobStore.accessMode=${store.accessMode} (public 아님 — private drift)`);
  if (store.accessModeImmutableAtCreation !== true) issues.push("blobStore.accessModeImmutableAtCreation != true");
  if (store.writeAccessRequiresToken !== true) issues.push("blobStore.writeAccessRequiresToken != true");

  // env 이름만: BLOB_READ_WRITE_TOKEN + secret 값 없음
  const env = p.envNamesOnly ?? {};
  if (env.writeToken !== "BLOB_READ_WRITE_TOKEN")
    issues.push(`envNamesOnly.writeToken=${env.writeToken} (BLOB_READ_WRITE_TOKEN 아님)`);
  if (env.secretValueRecorded !== false) issues.push("envNamesOnly.secretValueRecorded != false");
  // secret-like 값 감지: BLOB_READ_WRITE_TOKEN 뒤에 '=' 또는 실제 토큰 형태(긴 영숫자열)가 붙으면 fail
  const envJson = JSON.stringify(env);
  if (/vercel_blob_rw_[A-Za-z0-9]/.test(envJson) || /BLOB_READ_WRITE_TOKEN\s*=\s*\S/.test(envJson))
    issues.push("envNamesOnly에 secret-like 토큰 값 형태가 포함됨");

  // dependency: @vercel/blob 미설치 + 이 slice에서 변경 미승인
  const dep = p.dependencyStatus ?? {};
  if (dep.vercelBlobSdkInstalled !== false) issues.push("dependencyStatus.vercelBlobSdkInstalled != false");
  if (dep.dependencyChangeApprovedNow !== false)
    issues.push("dependencyStatus.dependencyChangeApprovedNow != false (이 slice에서 dependency 변경이 이미 승인된 것으로 오독)");

  // uploadPathDesign: Function body route 금지
  const up = p.uploadPathDesign ?? {};
  if (up.routeThroughVercelFunctionBody !== false)
    issues.push("uploadPathDesign.routeThroughVercelFunctionBody != false (20-30MB mp4를 Function body로 라우팅)");
  if (up.mode !== "local_or_worker_side_sdk_upload")
    issues.push(`uploadPathDesign.mode=${up.mode} (local/worker SDK upload 아님)`);

  // objectKeyContract: deterministic immutable, no overwrite, no random-only
  const key = p.objectKeyContract ?? {};
  if (!isStr(key.pattern) || !key.pattern.includes("{contentId}") || !key.pattern.includes("{sha256_12}"))
    issues.push("objectKeyContract.pattern이 deterministic key 형태가 아님");
  if (key.deterministic !== true) issues.push("objectKeyContract.deterministic != true");
  if (key.immutable !== true) issues.push("objectKeyContract.immutable != true");
  if (key.allowOverwrite !== false) issues.push("objectKeyContract.allowOverwrite != false (overwrite 허용됨)");
  if (key.addRandomSuffix !== false) issues.push("objectKeyContract.addRandomSuffix != false (random-only URL)");
  if (key.randomOnlyUrlForbidden !== true) issues.push("objectKeyContract.randomOnlyUrlForbidden != true");

  // uploadVerifierGates 상속
  const g = p.uploadVerifierGates ?? {};
  if (g.requireHttps !== true) issues.push("uploadVerifierGates.requireHttps != true");
  if (g.requireVideoContentType !== true) issues.push("uploadVerifierGates.requireVideoContentType != true");
  if (g.rejectTextHtml !== true) issues.push("uploadVerifierGates.rejectTextHtml != true");
  if (g.requireUnauthenticatedAccess !== true) issues.push("uploadVerifierGates.requireUnauthenticatedAccess != true");
  if (g.uploadOnlyWithVerifiedUrl !== true) issues.push("uploadVerifierGates.uploadOnlyWithVerifiedUrl != true");
  if (!Array.isArray(g.acceptedContentTypePrefixes) || !g.acceptedContentTypePrefixes.includes("video/"))
    issues.push("uploadVerifierGates.acceptedContentTypePrefixes에 video/ 누락");

  // retention / cost guard 존재
  const ret = p.retentionPolicy ?? {};
  if (!isStr(ret.defaultTargetDays)) issues.push("retentionPolicy.defaultTargetDays 누락");
  if (ret.deleteOnlyAfterPublishSuccess !== true) issues.push("retentionPolicy.deleteOnlyAfterPublishSuccess != true");
  if (ret.cleanupRequiresSeparateApproval !== true) issues.push("retentionPolicy.cleanupRequiresSeparateApproval != true");
  if (ret.longTermArchiveInBlobForbidden !== true) issues.push("retentionPolicy.longTermArchiveInBlobForbidden != true");

  const cost = p.sizeCostGuard ?? {};
  if (!(typeof cost.proposedCapMb === "number" && cost.proposedCapMb > 0)) issues.push("sizeCostGuard.proposedCapMb 누락/비정상");
  if (cost.failClosedAboveCap !== true) issues.push("sizeCostGuard.failClosedAboveCap != true");
  if (cost.longTermVideoArchiveForbidden !== true) issues.push("sizeCostGuard.longTermVideoArchiveForbidden != true");

  // futureApprovalGates: 필수 게이트 모두 존재
  const gates = Array.isArray(p.futureApprovalGates) ? p.futureApprovalGates.map((x) => x.gate) : [];
  for (const req of REQUIRED_FUTURE_GATES) {
    if (!gates.includes(req)) issues.push(`futureApprovalGates에 ${req} 누락`);
  }

  // forbiddenBehavior: 핵심 항목 존재
  const fb = Array.isArray(p.forbiddenBehavior) ? p.forbiddenBehavior.join(" | ") : "";
  if (!/provisioning/.test(fb)) issues.push("forbiddenBehavior에 provisioning 금지 누락");
  if (!/upload/.test(fb)) issues.push("forbiddenBehavior에 upload 금지 누락");
  if (!/dependency|lockfile/.test(fb)) issues.push("forbiddenBehavior에 dependency/lockfile 금지 누락");
  if (!/--arm|arm/.test(fb)) issues.push("forbiddenBehavior에 Instagram --arm 금지 누락");
  if (!/env|secret|token/.test(fb)) issues.push("forbiddenBehavior에 env/secret/token 금지 누락");

  if (!Array.isArray(p.prohibitedDrift?.cases) || p.prohibitedDrift.cases.length < 8)
    issues.push("prohibitedDrift.cases 항목 부족(8개 미만)");

  return issues;
}

// ── 1. fixture 검증 ──────────────────────────────────────────────────────────
{
  check("fixture schemaVersion + taskId + status",
    fx?.schemaVersion === "vercel_blob_instagram_integration_packet_v1" &&
    fx?.taskId === "vercel-blob-instagram-integration-packet-v1" &&
    fx?.status === "INTEGRATION_PACKET_NO_SECRET_NO_PROVISIONING_NO_LIVE");
  const issues = detectFixtureIssues(fx);
  check("fixture invariants: provider=Blob/platform=instagram_only/YouTube no-Blob/public store immutable/BLOB_READ_WRITE_TOKEN name-only/dependency not-approved/no-Function-body/deterministic immutable key/verifier gates/retention+cost/future gates/forbidden",
    issues.length === 0, issues.join("; "));
  check("fixture docsRef + activeArchitectureRef + strategyRef + providerDecisionRef 실재",
    isStr(fx?.docsRef) && existsSync(path.join(ROOT, fx.docsRef)) &&
    isStr(fx?.activeArchitectureRef) && existsSync(path.join(ROOT, fx.activeArchitectureRef)) &&
    isStr(fx?.strategyRef) && existsSync(path.join(ROOT, fx.strategyRef)) &&
    isStr(fx?.providerDecisionRef) && existsSync(path.join(ROOT, fx.providerDecisionRef)));
  check("fixture instagramVariantId = instagram_reels_full_frame_1080x1920",
    fx?.instagramVariantId === "instagram_reels_full_frame_1080x1920");
  check("fixture 전체에 secret-like 토큰 리터럴 미포함 (vercel_blob_rw_ 형태 없음)",
    !/vercel_blob_rw_[A-Za-z0-9]{6,}/.test(JSON.stringify(fx ?? {})));
}

// ── 2. docs 검증 ─────────────────────────────────────────────────────────────
{
  check("docs: Instagram=Blob public direct URL / YouTube=Blob 미사용 이유 명시",
    docs?.includes("Vercel Blob public direct URL") && docs?.includes("YouTube") &&
    (docs?.includes("Blob을 쓰지 않는다") || docs?.includes("쓰지 않는다")));
  check("docs: public store 필요 + access mode 생성 시 불변 명시",
    docs?.includes("public") && (docs?.includes("변경할 수 없다") || docs?.includes("변경 불가")));
  check("docs: Vercel Function body 4.5MB 한계 회피 + local/worker SDK 업로드 명시",
    docs?.includes("4.5") && (docs?.includes("로컬/워커") || docs?.includes("local")) && docs?.includes("SDK"));
  check("docs: @vercel/blob 미설치 + dependency 별도 승인 명시",
    docs?.includes("@vercel/blob") && (docs?.includes("별도 승인") || docs?.includes("dependency")));
  check("docs: deterministic immutable key scheme (instagram/reels/.../sha256_12) 명시",
    docs?.includes("instagram/reels/") && docs?.includes("sha256_12") &&
    (docs?.includes("allowOverwrite") || docs?.includes("overwrite 금지")));
  check("docs: verifier gate(HTTPS/video/reject html/unauth/verified-only) 명시",
    docs?.includes("HTTPS") && docs?.includes("text/html") && docs?.includes("video/") &&
    docs?.includes("무인증"));
  check("docs: retention(1-7일)/cleanup 별도 승인/장기 아카이브 금지 명시",
    docs?.includes("1-7일") && (docs?.includes("cleanup") || docs?.includes("삭제")) &&
    docs?.includes("아카이브"));
  check("docs: cost/free-tier guard(35MB cap + Hobby 한도) 명시",
    docs?.includes("35MB") && docs?.includes("Hobby"));
  check("docs: BLOB_READ_WRITE_TOKEN 이름만 명시",
    docs?.includes("BLOB_READ_WRITE_TOKEN"));
  check("docs: future approval sequence(store/dependency/env/upload/liveness/arm/cleanup) 명시",
    REQUIRED_FUTURE_GATES.every((g) => docs?.includes(g)));
  check("docs: 금지 항목 + 공식 문서 근거(3 URL) 명시",
    docs?.includes("provisioning") && docs?.includes("vercel.com/docs/vercel-blob") &&
    docs?.includes("server-upload") && docs?.includes("usage-and-pricing"));
}

// ── 3. 가드 self 스캔 ────────────────────────────────────────────────────────
{
  const selfSrc = readFileSync(SELF, "utf8");
  const liveTokens = [J("fet", "ch("), J("child_", "process"), J("spawn", "("),
    J("write", "FileSync"), J("mkdir", "Sync"), J("rm", "Sync"), J("XMLHttp", "Request"),
    J("env", ".BLOB"), J("vercel ", "env pull")];
  const hit = liveTokens.find((t) => selfSrc.includes(t));
  check("guard 자체에 live/env/write 패턴 없음 (self-scan)", !hit, hit ? `token=${hit}` : "");
  const specifiers = [...selfSrc.matchAll(/^import\s[^\n]*?from\s+["']([^"']+)["']/gm)].map((m) => m[1]);
  const allow = new Set(["node:fs", "node:path", "node:url"]);
  check("guard imports restricted to node:fs/node:path/node:url",
    specifiers.length > 0 && specifiers.every((sp) => allow.has(sp)));
  console.log("NOTE  scanner holds forbidden tokens split-concatenated only (denylist exception)");
}

// ── 4. mutant — fail-closed 확인 ──────────────────────────────────────────────
{
  const m1 = clone(fx); m1.youtube.usesBlobUrl = true; m1.youtube.usesPublicUrlLayer = true;
  check("mutant 1: Blob이 YouTube로 라우팅 → fail",
    detectFixtureIssues(m1).some((i) => i.includes("youtube.usesBlobUrl") || i.includes("usesPublicUrlLayer")));

  const m2 = clone(fx); m2.platform = "instagram_and_youtube";
  check("mutant 2: platform이 instagram_only에서 벗어남 → fail",
    detectFixtureIssues(m2).some((i) => i.includes("platform=")));

  const m3 = clone(fx); m3.blobStore.accessMode = "private";
  check("mutant 3: store access mode가 private로 drift → fail",
    detectFixtureIssues(m3).some((i) => i.includes("accessMode")));

  const m4 = clone(fx); m4.envNamesOnly.writeToken = "vercel_blob_rw_abcdef1234567890XYZ";
  check("mutant 4: BLOB_READ_WRITE_TOKEN 자리에 secret-like 값 삽입 → fail",
    detectFixtureIssues(m4).some((i) => i.includes("writeToken") || i.includes("secret-like")));

  const m5 = clone(fx); m5.envNamesOnly.writeToken = "OTHER_TOKEN";
  check("mutant 5: env 토큰 이름이 BLOB_READ_WRITE_TOKEN이 아님 → fail",
    detectFixtureIssues(m5).some((i) => i.includes("writeToken")));

  const m6 = clone(fx); m6.dependencyStatus.dependencyChangeApprovedNow = true;
  check("mutant 6: dependency 변경이 이 slice에서 이미 승인된 것으로 표시 → fail",
    detectFixtureIssues(m6).some((i) => i.includes("dependencyChangeApprovedNow")));

  const m7 = clone(fx); m7.objectKeyContract.allowOverwrite = true;
  check("mutant 7: object key allowOverwrite=true → fail",
    detectFixtureIssues(m7).some((i) => i.includes("allowOverwrite")));

  const m8 = clone(fx); m8.objectKeyContract.addRandomSuffix = true;
  check("mutant 8: object key addRandomSuffix=true (random-only URL) → fail",
    detectFixtureIssues(m8).some((i) => i.includes("addRandomSuffix")));

  const m9 = clone(fx); m9.uploadVerifierGates.rejectTextHtml = false;
  check("mutant 9: verifier gate rejectTextHtml=false → fail",
    detectFixtureIssues(m9).some((i) => i.includes("rejectTextHtml")));

  const m10 = clone(fx); m10.uploadVerifierGates.uploadOnlyWithVerifiedUrl = false;
  check("mutant 10: verifier gate uploadOnlyWithVerifiedUrl=false (검증 없이 업로드) → fail",
    detectFixtureIssues(m10).some((i) => i.includes("uploadOnlyWithVerifiedUrl")));

  const m11 = clone(fx); delete m11.retentionPolicy;
  check("mutant 11: retention guard 제거 → fail",
    detectFixtureIssues(m11).some((i) => i.includes("retentionPolicy")));

  const m12 = clone(fx); delete m12.sizeCostGuard;
  check("mutant 12: cost guard 제거 → fail",
    detectFixtureIssues(m12).some((i) => i.includes("sizeCostGuard") || i.includes("proposedCapMb")));

  const m13 = clone(fx); m13.uploadPathDesign.routeThroughVercelFunctionBody = true;
  check("mutant 13: 20-30MB mp4를 Vercel Function body route로 라우팅 → fail",
    detectFixtureIssues(m13).some((i) => i.includes("routeThroughVercelFunctionBody")));

  const m14 = clone(fx); m14.futureApprovalGates = m14.futureApprovalGates.filter((x) => x.gate !== "APPROVE_INSTAGRAM_ARM");
  check("mutant 14: future approval gate에서 Instagram arm 제거 → fail",
    detectFixtureIssues(m14).some((i) => i.includes("APPROVE_INSTAGRAM_ARM")));

  const m15 = clone(fx); m15.futureApprovalGates = m15.futureApprovalGates.filter((x) => x.gate !== "APPROVE_VERCEL_BLOB_STORE_PROVISIONING");
  check("mutant 15: future approval gate에서 store provisioning 제거 → fail",
    detectFixtureIssues(m15).some((i) => i.includes("APPROVE_VERCEL_BLOB_STORE_PROVISIONING")));

  const m16 = clone(fx); m16.provider = "cloudflare_r2";
  check("mutant 16: provider가 R2로 drift → fail",
    detectFixtureIssues(m16).some((i) => i.includes("provider=")));
}

console.log(`\nRESULT: ${failures === 0 ? "ALL PASS" : "FAIL"} (${passes + failures} checks)`);
process.exit(failures === 0 ? 0 : 1);
