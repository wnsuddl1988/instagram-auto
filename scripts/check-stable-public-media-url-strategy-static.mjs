#!/usr/bin/env node
/**
 * check-stable-public-media-url-strategy-static.mjs
 *
 * Stable public media URL strategy — 정적 가드 (no-live).
 * task: stable-public-media-url-layer-v1
 *
 * 이 가드 자체는 no-live다: 레포 내 strategy fixture JSON + docs 텍스트만 읽는다.
 * (network/env/secret/upload/subprocess/write 없음)
 *
 * 검증:
 *  1) fixture: sustained default(historical) = media.buildgongjakso.com + object storage/CDN,
 *     activeExecutionPath(현재 active): Instagram=vercel_blob_public_direct_url,
 *     mediaOriginHostRequiredForCurrentExecution=false, YouTube가 이 public URL layer를
 *     쓰지 않음(youtubeUsesThisPublicUrlLayer=false)+direct file upload,
 *     fallback(repo public/ static)은 manual/one-off이며 sustained default 아님(변경 없음),
 *     결정론적 key scheme, provider-neutral 요건, verifier gate(HTTPS/allowed host/
 *     2xx|206/video/reject html/unauth/reject redirect/verified-url-only, Blob URL에도 적용),
 *     runner 계약(verified URL만 소비, fail-closed 유지), 외부 승인 항목,
 *     forbidden behavior
 *  2) docs: §0 active 경로(Instagram=Blob/YouTube=direct/불필요) + historical 지속 default/
 *     fallback/ verifier gate/ 외부 승인 항목 명문화
 *  3) mutant → 전부 fail (repo public/ fallback이 sustained default로 승격되거나
 *     YouTube가 이 public URL layer를 다시 쓰게 되면 fail 포함)
 */
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const SELF = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SELF), "..");
const J = (a, b) => a + b; // 토큰 분할-연결 (self-scan denylist 예외, 검색 전용)

const FIXTURE_PATH = path.join(ROOT, "scripts", "fixtures", "stable_public_media_url_strategy.v1.json");
const DOCS_PATH = path.join(ROOT, "docs", "public-media-url-strategy.md");

const SUSTAINED_DEFAULT_HOST = "media.buildgongjakso.com";
const FALLBACK_HOSTS = ["www.buildgongjakso.com", "buildgongjakso.com"];
const ALLOWED_HOSTS = ["media.buildgongjakso.com", "www.buildgongjakso.com", "buildgongjakso.com"];

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
  check("strategy fixture parses as JSON", true);
} catch (e) {
  check("strategy fixture parses as JSON", false, String(e).slice(0, 160));
}
let docs = null;
try {
  docs = readFileSync(DOCS_PATH, "utf8");
  check("strategy docs readable", true);
} catch (e) {
  check("strategy docs readable", false, String(e).slice(0, 120));
}
if (!fx || !docs) {
  console.error(`\nRESULT: ${failures} FAILURE(S) / ${passes + failures} checks — core artifact unreadable, aborting`);
  process.exit(1);
}

// ── 순수 fixture 검증기 (mutant 재사용) ───────────────────────────────────────
function detectFixtureIssues(p) {
  const issues = [];

  // sustained default = media.buildgongjakso.com + object storage/CDN
  const d = p.sustainedDefault ?? {};
  if (d.strategy !== "dedicated_media_origin") issues.push(`sustainedDefault.strategy=${d.strategy} (dedicated_media_origin 아님)`);
  if (d.mediaOriginHost !== SUSTAINED_DEFAULT_HOST) issues.push(`sustainedDefault.mediaOriginHost=${d.mediaOriginHost} (media.buildgongjakso.com 아님 — default host drift)`);
  if (p.sustainedDefaultHost !== SUSTAINED_DEFAULT_HOST) issues.push(`sustainedDefaultHost=${p.sustainedDefaultHost} (media.buildgongjakso.com 아님 — default host drift)`);
  if (d.backing !== "object_storage_cdn") issues.push(`sustainedDefault.backing=${d.backing} (object_storage_cdn 아님)`);
  if (d.httpsOnly !== true) issues.push("sustainedDefault.httpsOnly != true");
  if (d.commitGeneratedMp4ToGit !== false) issues.push("sustainedDefault.commitGeneratedMp4ToGit != false (생성 mp4 git 커밋을 default로 삼음)");
  let dhost = null;
  try { dhost = new URL(d.originUrlBase).hostname; } catch { /* below */ }
  if (dhost !== SUSTAINED_DEFAULT_HOST) issues.push(`sustainedDefault.originUrlBase host=${dhost} (media.buildgongjakso.com 아님)`);

  // activeExecutionPath: 현재 active 경로 — Instagram=Blob, YouTube=이 layer 미사용
  const aep = p.activeExecutionPath ?? {};
  if (aep.instagramPublicUrlProvider !== "vercel_blob_public_direct_url")
    issues.push(`activeExecutionPath.instagramPublicUrlProvider=${aep.instagramPublicUrlProvider} (vercel_blob_public_direct_url 아님)`);
  if (aep.mediaOriginHostRequiredForCurrentExecution !== false)
    issues.push("activeExecutionPath.mediaOriginHostRequiredForCurrentExecution != false (media.buildgongjakso.com이 현재도 필수로 남음)");
  if (aep.youtubeUsesThisPublicUrlLayer !== false)
    issues.push("activeExecutionPath.youtubeUsesThisPublicUrlLayer != false (YouTube가 이 public URL layer를 쓰게 됨)");
  if (aep.youtubeUploadMode !== "youtube_data_api_direct_file_upload")
    issues.push(`activeExecutionPath.youtubeUploadMode=${aep.youtubeUploadMode} (direct file upload 아님)`);
  if (aep.repoPublicFallbackRoleUnchanged !== "manual_one_off_only")
    issues.push("activeExecutionPath.repoPublicFallbackRoleUnchanged != manual_one_off_only");
  if (p.status !== "STRATEGY_SUPERSEDED_BY_DUAL_PLATFORM_FOR_CURRENT_EXECUTION")
    issues.push(`status=${p.status} (STRATEGY_SUPERSEDED_BY_DUAL_PLATFORM_FOR_CURRENT_EXECUTION 아님)`);
  if (!isStr(p.activeArchitectureRef)) issues.push("activeArchitectureRef 누락 (dual-platform fixture 참조 없음)");
  if (p.sustainedDefault?.historicalOnly !== true) issues.push("sustainedDefault.historicalOnly != true (historical 표시 누락)");

  // fallback = repo public/ static, sustained default 아님
  const f = p.fallback ?? {};
  if (f.strategy !== "repo_public_static_plus_deploy") issues.push(`fallback.strategy=${f.strategy} (repo_public_static_plus_deploy 아님)`);
  if (f.role !== "manual_one_off_only") issues.push(`fallback.role=${f.role} (manual_one_off_only 아님)`);
  if (f.isSustainedDefault !== false) issues.push("fallback.isSustainedDefault != false (fallback이 sustained default로 승격됨)");
  if (f.repoStaticPathPrefix !== "public/") issues.push(`fallback.repoStaticPathPrefix=${f.repoStaticPathPrefix} (public/ 아님)`);
  if (FALLBACK_HOSTS.includes(SUSTAINED_DEFAULT_HOST)) issues.push("sustained default host가 fallback host 목록에 섞임");
  if (f.fallbackHost === SUSTAINED_DEFAULT_HOST) issues.push("fallback.fallbackHost가 sustained default host와 동일 (경로 혼동)");

  // 결정론적 key scheme
  const k = p.deterministicKeyScheme ?? {};
  if (!isStr(k.pattern) || !k.pattern.includes("<topicId>")) issues.push("deterministicKeyScheme.pattern에 <topicId> 없음");
  if (k.stableAcrossRuns !== true) issues.push("deterministicKeyScheme.stableAcrossRuns != true");
  if (k.noRandomSuffix !== true) issues.push("deterministicKeyScheme.noRandomSuffix != true");
  let exHost = null;
  try { exHost = new URL(k.exampleSustainedUrl).hostname; } catch { /* below */ }
  if (exHost !== SUSTAINED_DEFAULT_HOST) issues.push(`exampleSustainedUrl host=${exHost} (media.buildgongjakso.com 아님)`);

  // provider-neutral
  const pn = p.providerNeutral ?? {};
  if (pn.vendorLock !== false) issues.push("providerNeutral.vendorLock != false");
  if (!Array.isArray(pn.candidateProviders) || pn.candidateProviders.length < 2) issues.push("providerNeutral.candidateProviders 2개 미만");
  if (!Array.isArray(pn.requirements) || pn.requirements.length < 5) issues.push("providerNeutral.requirements 5개 미만");

  // allowedHosts / hosts
  if (JSON.stringify(p.allowedHosts) !== JSON.stringify(ALLOWED_HOSTS)) issues.push("allowedHosts가 media+www+apex 3개 host가 아님");
  if (JSON.stringify(p.fallbackHosts) !== JSON.stringify(FALLBACK_HOSTS)) issues.push("fallbackHosts가 www+apex 2개 host가 아님");

  // verifier gate
  const g = p.uploadVerifierGates ?? {};
  if (g.requireHttps !== true) issues.push("uploadVerifierGates.requireHttps != true (non-HTTPS URL 허용됨)");
  if (g.requireAllowedHost !== true) issues.push("uploadVerifierGates.requireAllowedHost != true");
  if (g.requireHttp2xxOr206 !== true) issues.push("uploadVerifierGates.requireHttp2xxOr206 != true");
  if (g.requireVideoContentType !== true) issues.push("uploadVerifierGates.requireVideoContentType != true");
  if (!Array.isArray(g.acceptedContentTypePrefixes) || !g.acceptedContentTypePrefixes.includes("video/")) issues.push("acceptedContentTypePrefixes에 video/ 없음");
  if (g.rejectTextHtml !== true) issues.push("uploadVerifierGates.rejectTextHtml != true (text/html 허용됨)");
  if (g.requireUnauthenticatedAccess !== true) issues.push("uploadVerifierGates.requireUnauthenticatedAccess != true");
  if (g.rejectLoginOrHtmlRedirect !== true) issues.push("uploadVerifierGates.rejectLoginOrHtmlRedirect != true");
  if (g.uploadOnlyWithVerifiedUrl !== true) issues.push("uploadVerifierGates.uploadOnlyWithVerifiedUrl != true (검증 없는 URL로 upload 허용됨)");

  // runner 계약
  const r = p.runnerContract ?? {};
  if (r.runnerRef !== "scripts/run-golden-sample-v3-2-instagram-upload-once.mjs") issues.push("runnerContract.runnerRef 불일치");
  if (r.consumesVerifiedUrlOnly !== true) issues.push("runnerContract.consumesVerifiedUrlOnly != true");
  if (r.preservesFailClosedGates !== true) issues.push("runnerContract.preservesFailClosedGates != true");
  if (r.noAdHocUrlGuessing !== true) issues.push("runnerContract.noAdHocUrlGuessing != true");

  // 외부 Owner 승인 항목
  const ext = (p.externalOwnerApprovalRequired ?? []).join(" | ");
  for (const t of ["DNS", "storage provider provisioning", "env/secret", "deploy", "live URL liveness", "--arm"]) {
    if (!ext.includes(t)) issues.push(`externalOwnerApprovalRequired에 '${t}' 항목 누락`);
  }

  // forbidden behavior
  const fb = (p.forbiddenBehavior ?? []).join(" | ");
  for (const t of ["live upload without verified URL", "broad .env.local", "YouTube", "Supabase", "deploy", "committing generated mp4s to git", "secret logging", "commit/push"]) {
    if (!fb.includes(t)) issues.push(`forbiddenBehavior에 '${t}' 항목 누락`);
  }

  return issues;
}

// ── 1. fixture 검증 ──────────────────────────────────────────────────────────
{
  check("fixture schemaVersion + taskId + status(superseded)",
    fx.schemaVersion === "stable_public_media_url_strategy_v1" &&
    fx.taskId === "stable-public-media-url-layer-v1" &&
    fx.status === "STRATEGY_SUPERSEDED_BY_DUAL_PLATFORM_FOR_CURRENT_EXECUTION");
  const issues = detectFixtureIssues(fx);
  check("fixture invariants: sustained default(historical, media origin)/activeExecutionPath(Blob/YouTube 미사용)/fallback(manual)/key scheme/provider-neutral/verifier gates/runner 계약/외부 승인/forbidden",
    issues.length === 0, issues.join("; "));
  check("fixture docsRef + activeArchitectureRef가 실재하는 파일",
    isStr(fx.docsRef) && existsSync(path.join(ROOT, fx.docsRef)) &&
    isStr(fx.activeArchitectureRef) && existsSync(path.join(ROOT, fx.activeArchitectureRef)));
  check("fixture runnerContract 참조 파일 실재",
    existsSync(path.join(ROOT, fx.runnerContract?.runnerRef ?? "")) &&
    existsSync(path.join(ROOT, fx.runnerContract?.staticGuardRef ?? "")));
  check("fixture prohibitedSustainedDefaultDrift cases 7개 이상",
    Array.isArray(fx.prohibitedSustainedDefaultDrift?.cases) && fx.prohibitedSustainedDefaultDrift.cases.length >= 7);
}

// ── 2. docs 검증 ─────────────────────────────────────────────────────────────
{
  check("docs: sustained default = media.buildgongjakso.com 명시(historical)",
    docs.includes("media.buildgongjakso.com") && docs.includes("sustained"));
  check("docs: §0 active 경로 — Instagram=Vercel Blob / YouTube=이 layer 미사용 명시",
    docs.includes("Active") && docs.includes("Vercel Blob public direct URL") &&
    docs.includes("쓰지 않는다") && docs.includes("YouTube"));
  check("docs: media.buildgongjakso.com이 historical/superseded로 명시",
    (docs.includes("historical") || docs.includes("Historical")) &&
    (docs.includes("superseded") || docs.includes("supersede")));
  check("docs: dual-platform-variant-publish-architecture 문서 참조 명시",
    docs.includes("dual-platform-variant-publish-architecture.md"));
  check("docs: fallback = repo public/ static + one-off 명시(변경 없음)",
    docs.includes("public/") && (docs.includes("one-off") || docs.includes("one_off") || docs.includes("긴급") || docs.includes("수동")));
  check("docs: verifier gate(HTTPS/host/2xx|206/video/reject html/unauth/redirect) 명문화",
    docs.includes("HTTPS") && docs.includes("text/html") && docs.includes("video/") &&
    (docs.includes("206") || docs.includes("2xx")) && docs.includes("무인증"));
  check("docs: 외부 Owner 승인 항목(DNS/storage/env/deploy/live/--arm) 명문화",
    docs.includes("DNS") && docs.includes("deploy") && docs.includes("--arm") &&
    docs.includes("liveness") && docs.includes("storage"));
  check("docs: 생성 mp4 git 커밋을 sustained default로 삼지 않음 명시",
    docs.includes("git") && (docs.includes("non-default") || docs.includes("지속 경로로 삼지 않는다") || docs.includes("sustained default")));
}

// ── 3. 가드 self 스캔 ────────────────────────────────────────────────────────
{
  const selfSrc = readFileSync(SELF, "utf8");
  const liveTokens = [J("fet", "ch("), J("process", ".env"), J("child_", "process"), J("spawn", "("),
    J("write", "FileSync"), J("mkdir", "Sync"), J("rm", "Sync"), J("XMLHttp", "Request")];
  const hit = liveTokens.find((t) => selfSrc.includes(t));
  check("guard 자체에 live/env/write 패턴 없음 (self-scan)", !hit, hit ? `token=${hit}` : "");
  const specifiers = [...selfSrc.matchAll(/^import\s[^\n]*?from\s+["']([^"']+)["']/gm)].map((m) => m[1]);
  const allow = new Set(["node:fs", "node:path", "node:url"]);
  check("guard imports restricted to node:fs/node:path/node:url",
    specifiers.length > 0 && specifiers.every((sp) => allow.has(sp)));
  console.log("NOTE  scanner holds forbidden tokens split-concatenated only (denylist exception)");
}

// ── 4. mutant — fail-closed 확인 (HANDOFF 요구 9종) ──────────────────────────
{
  const m1 = clone(fx); m1.sustainedDefault.mediaOriginHost = "www.buildgongjakso.com"; m1.sustainedDefaultHost = "www.buildgongjakso.com";
  check("mutant 1: default host drift (media→www) → fail",
    detectFixtureIssues(m1).some((i) => i.includes("default host drift")));
  const m2 = clone(fx); m2.fallback.isSustainedDefault = true;
  check("mutant 2: fallback(repo public/)을 sustained default로 승격 → fail",
    detectFixtureIssues(m2).some((i) => i.includes("sustained default로 승격")));
  const m3 = clone(fx); m3.uploadVerifierGates.rejectTextHtml = false;
  check("mutant 3: text/html 허용 → fail",
    detectFixtureIssues(m3).some((i) => i.includes("rejectTextHtml")));
  const m4 = clone(fx); m4.uploadVerifierGates.requireHttps = false;
  check("mutant 4: non-HTTPS URL 허용 → fail",
    detectFixtureIssues(m4).some((i) => i.includes("requireHttps")));
  const m5 = clone(fx); m5.uploadVerifierGates.uploadOnlyWithVerifiedUrl = false;
  check("mutant 5: 검증 없는 URL로 upload 허용 → fail",
    detectFixtureIssues(m5).some((i) => i.includes("uploadOnlyWithVerifiedUrl")));
  const m6 = clone(fx); m6.forbiddenBehavior = fx.forbiddenBehavior.filter((t) => !t.includes("broad .env.local"));
  check("mutant 6: broad .env.local parse 금지 제거 → fail",
    detectFixtureIssues(m6).some((i) => i.includes("broad .env.local")));
  const m7 = clone(fx); m7.forbiddenBehavior = fx.forbiddenBehavior.filter((t) => !t.includes("YouTube") && !t.includes("Supabase") && !t.includes("deploy"));
  check("mutant 7: YouTube/Supabase/deploy side effect 금지 제거 → fail",
    detectFixtureIssues(m7).some((i) => i.includes("YouTube") || i.includes("Supabase") || i.includes("deploy")));
  const m8 = clone(fx); m8.forbiddenBehavior = fx.forbiddenBehavior.filter((t) => !t.includes("secret logging"));
  check("mutant 8: secret logging 금지 제거 → fail",
    detectFixtureIssues(m8).some((i) => i.includes("secret logging")));
  const m9 = clone(fx); m9.externalOwnerApprovalRequired = fx.externalOwnerApprovalRequired.filter((t) => !t.includes("DNS") && !t.includes("storage provider") && !t.includes("env/secret") && !t.includes("deploy") && !t.includes("--arm"));
  check("mutant 9: DNS/storage/env/deploy/live upload Owner 승인 요건 제거 → fail",
    detectFixtureIssues(m9).some((i) => i.includes("externalOwnerApprovalRequired")));
  const m10 = clone(fx); m10.sustainedDefault.commitGeneratedMp4ToGit = true;
  check("mutant 10: 생성 mp4 git 커밋을 sustained default로 → fail",
    detectFixtureIssues(m10).some((i) => i.includes("commitGeneratedMp4ToGit")));
  const m11 = clone(fx); m11.activeExecutionPath.mediaOriginHostRequiredForCurrentExecution = true;
  check("mutant 11: media.buildgongjakso.com이 현재도 필수로 되돌아감 → fail",
    detectFixtureIssues(m11).some((i) => i.includes("mediaOriginHostRequiredForCurrentExecution")));
  const m12 = clone(fx); m12.activeExecutionPath.youtubeUsesThisPublicUrlLayer = true;
  check("mutant 12: YouTube가 이 public URL layer(Blob/media origin)를 다시 씀 → fail",
    detectFixtureIssues(m12).some((i) => i.includes("youtubeUsesThisPublicUrlLayer")));
  const m13 = clone(fx); m13.activeExecutionPath.instagramPublicUrlProvider = "cloudflare_r2";
  check("mutant 13: Instagram active provider가 R2로 drift → fail",
    detectFixtureIssues(m13).some((i) => i.includes("instagramPublicUrlProvider")));
  const m14 = clone(fx); delete m14.sustainedDefault.historicalOnly;
  check("mutant 14: sustainedDefault historical 표시 제거 → fail",
    detectFixtureIssues(m14).some((i) => i.includes("historicalOnly")));
}

console.log(failures === 0
  ? `\nRESULT: ALL PASS (${passes} checks)`
  : `\nRESULT: ${failures} FAILURE(S) / ${passes + failures} checks`);
process.exit(failures === 0 ? 0 : 1);
