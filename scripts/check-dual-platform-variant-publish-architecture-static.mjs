#!/usr/bin/env node
/**
 * check-dual-platform-variant-publish-architecture-static.mjs
 *
 * Dual-platform (Instagram Blob URL + YouTube direct upload) variant publish
 * architecture — 정적 가드 (no-live).
 * task: dual-platform-variant-publish-architecture-no-live-v1
 *
 * 이 가드 자체는 no-live다: 레포 내 architecture fixture JSON + docs 텍스트만 읽는다.
 * (network/env/secret/upload/subprocess/write 없음)
 *
 * 검증:
 *  1) fixture: R2 suspended(owner preference)·Instagram=Vercel Blob·YouTube=direct upload(non-Blob)·
 *     1콘텐츠→2변형→2job·daily 수식(1→2,2→4)·YouTube letterbox(black top/bottom+centered)·
 *     Blob-required는 Instagram variant뿐·free-tier not unlimited/guaranteed·cost/retention guard·
 *     승인 순서 10종·공식 doc URL·forbidden·repo public/ fallback 비-sustained
 *  2) docs: 위 핵심 명문화
 *  3) mutant → 전부 fail
 */
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const SELF = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SELF), "..");
const J = (a, b) => a + b; // 토큰 분할-연결 (self-scan denylist 예외, 검색 전용)

const FIXTURE_PATH = path.join(ROOT, "scripts", "fixtures", "dual_platform_variant_publish_architecture.v1.json");
const DOCS_PATH = path.join(ROOT, "docs", "dual-platform-variant-publish-architecture.md");

const IG_VARIANT = "instagram_reels_full_frame_1080x1920";
const YT_VARIANT = "youtube_shorts_letterbox_1080x1920";
const REQUIRED_APPROVALS = [
  "APPROVE_DUAL_PLATFORM_ARCHITECTURE",
  "APPROVE_YOUTUBE_VARIANT_RENDER_SPEC",
  "APPROVE_VERCEL_BLOB_STORE_PROVISIONING",
  "APPROVE_VERCEL_BLOB_ENV_TOKEN_WRITE",
  "APPROVE_BLOB_INSTAGRAM_UPLOAD_CODE_INTEGRATION",
  "APPROVE_YOUTUBE_OAUTH_AND_UPLOAD_INTEGRATION",
  "APPROVE_PLATFORM_VARIANT_RENDER_TEST",
  "APPROVE_INSTAGRAM_BLOB_URL_LIVENESS",
  "APPROVE_YOUTUBE_UPLOAD_TEST",
  "APPROVE_DUAL_PLATFORM_ARM",
];
const REQUIRED_FORBIDDEN = [
  "Cloudflare/R2/wrangler",
  "Vercel Blob store creation/provisioning",
  "token/env/secret read/write",
  "object upload",
  "public URL liveness check",
  "Instagram upload or --arm",
  "YouTube upload/API/OAuth execution",
  "dependency/lockfile",
  "commit/push",
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
  check("architecture fixture parses as JSON", true);
} catch (e) {
  check("architecture fixture parses as JSON", false, String(e).slice(0, 160));
}
let docs = null;
try {
  docs = readFileSync(DOCS_PATH, "utf8");
  check("architecture docs readable", true);
} catch (e) {
  check("architecture docs readable", false, String(e).slice(0, 120));
}
if (!fx || !docs) {
  console.error(`\nRESULT: ${failures} FAILURE(S) / ${passes + failures} checks — core artifact unreadable, aborting`);
  process.exit(1);
}

// ── 순수 fixture 검증기 (mutant 재사용) ───────────────────────────────────────
function detectFixtureIssues(p) {
  const issues = [];

  // Cloudflare/R2 suspended by owner preference, primary 아님
  const r2 = p.cloudflareR2Status ?? {};
  if (r2.state !== "suspended") issues.push("cloudflareR2Status.state != suspended (R2가 다시 활성/primary?)");
  if (r2.reason !== "owner_preference_not_technical_failure") issues.push("R2 suspended 사유가 owner preference 아님");
  if (r2.bucketCreated !== false) issues.push("cloudflareR2Status.bucketCreated != false");

  // Instagram=Vercel Blob, YouTube=direct upload(non-Blob)
  if (p.primaryPublicUrlProviderForInstagram !== "vercel_blob_public_direct_url")
    issues.push(`Instagram provider=${p.primaryPublicUrlProviderForInstagram} (Vercel Blob 아님 — R2/다른 provider drift 가능)`);
  if (p.youtubeUploadMode !== "youtube_data_api_direct_file_upload")
    issues.push(`youtubeUploadMode=${p.youtubeUploadMode} (direct file upload 아님)`);
  if (p.youtubeUsesBlobUrl !== false)
    issues.push("youtubeUsesBlobUrl != false (YouTube가 Blob URL 경로로 잘못 라우팅)");

  // render variants: IG full-frame + YT letterbox 둘 다 존재
  const variants = Array.isArray(p.renderVariants) ? p.renderVariants : [];
  const ig = variants.find((v) => v && v.id === IG_VARIANT);
  const yt = variants.find((v) => v && v.id === YT_VARIANT);
  if (!ig) issues.push("Instagram full-frame variant 누락");
  if (!yt) issues.push("YouTube shorts variant 누락 (first-class target 누락)");
  if (ig) {
    if (ig.width !== 1080 || ig.height !== 1920) issues.push("Instagram variant 해상도 1080x1920 아님");
    if (ig.requiresPublicBlobUrl !== true) issues.push("Instagram variant requiresPublicBlobUrl != true");
  }
  if (yt) {
    if (yt.width !== 1080 || yt.height !== 1920) issues.push("YouTube variant 해상도 1080x1920 아님");
    if (yt.background !== "black") issues.push("YouTube variant 배경 black 아님");
    if (yt.blackTopBottomSpace !== true) issues.push("YouTube variant black top/bottom space 요구 누락");
    if (yt.centeredContent !== true) issues.push("YouTube variant centered content 요구 누락");
    if (yt.requiresPublicBlobUrl !== false) issues.push("YouTube variant requiresPublicBlobUrl != false (Blob 불필요해야 함)");
  }

  // publish jobs: instagram(Blob) + youtube(direct, non-Blob)
  const jobs = Array.isArray(p.publishJobs) ? p.publishJobs : [];
  const igJob = jobs.find((j) => j && j.id === "instagram_job");
  const ytJob = jobs.find((j) => j && j.id === "youtube_job");
  if (!igJob) issues.push("instagram_job 누락");
  if (!ytJob) issues.push("youtube_job 누락 (YouTube first-class publish 누락)");
  if (igJob && igJob.uploadsToBlob !== true) issues.push("instagram_job uploadsToBlob != true");
  if (ytJob && ytJob.uploadsToBlob !== false) issues.push("youtube_job uploadsToBlob != false (YouTube가 Blob 업로드로 잘못 설정)");

  // Blob-required variants는 Instagram variant 뿐
  const blobReq = Array.isArray(p.blobRequiredVariantsOnly) ? p.blobRequiredVariantsOnly : [];
  if (blobReq.length !== 1 || blobReq[0] !== IG_VARIANT)
    issues.push("blobRequiredVariantsOnly가 Instagram variant 단일이 아님 (YouTube가 Blob-required로 샘)");

  // daily capacity math: 1->2, 2->4, per content 2
  const dc = p.dailyCapacityBaseline ?? {};
  const one = dc.onePerDay ?? {}, two = dc.twoPerDay ?? {};
  if (one.publishJobs !== 2) issues.push("1 content/day -> 2 publish jobs 수식 누락/오류");
  if (two.publishJobs !== 4) issues.push("2 contents/day -> 4 publish jobs 수식 누락/오류");
  if (dc.publishJobsPerContent !== 2) issues.push("publishJobsPerContent != 2");

  // free-tier feasibility: plausible but not unlimited/guaranteed
  const ft = p.freeTierFeasibility ?? {};
  if (ft.plausibleUnderAssumptions !== true) issues.push("freeTierFeasibility.plausibleUnderAssumptions != true");
  if (ft.unlimited !== false) issues.push("freeTierFeasibility.unlimited != false (무제한으로 잘못 서술)");
  if (ft.guaranteedFree !== false) issues.push("freeTierFeasibility.guaranteedFree != false (보장 무료로 잘못 서술)");
  const ftSize = String(ft.assumedVariantSizeMb ?? "");
  if (!ftSize.includes("20") || !ftSize.includes("30")) issues.push("free-tier 20-30MB variant size 가정 누락");
  const ftRet = String(ft.assumedRetentionDays ?? "");
  if (!ftRet.includes("1") || !ftRet.includes("7")) issues.push("free-tier 1-7일 retention 가정 누락");

  // cost/retention guards 존재
  const guards = Array.isArray(p.costAndQuotaGuards) ? p.costAndQuotaGuards : [];
  if (guards.length < 3) issues.push("costAndQuotaGuards 부족 (cost/retention 가드 누락)");
  const guardsJoined = guards.join(" | ");
  if (!/retention|삭제|만료/.test(guardsJoined)) issues.push("cost guard에 retention/삭제/만료 없음");

  // repo public/ fallback은 sustained default 아님
  const rf = p.repoPublicFallback ?? {};
  if (rf.isSustainedDefault !== false) issues.push("repoPublicFallback.isSustainedDefault != false (public/ fallback이 sustained default로 승격)");

  // 승인 순서 10종
  const seq = Array.isArray(p.futureApprovalSequence) ? p.futureApprovalSequence : [];
  for (const a of REQUIRED_APPROVALS) {
    if (!seq.includes(a)) issues.push(`futureApprovalSequence에 '${a}' 누락`);
  }

  // 공식 doc URL
  const dr = p.officialDocRefs ?? {};
  if (!isStr(dr.vercelBlobPublicStorage) || !dr.vercelBlobPublicStorage.includes("vercel.com"))
    issues.push("officialDocRefs vercel blob public storage URL 누락");
  if (!isStr(dr.youtubeVideosInsert) || !dr.youtubeVideosInsert.includes("developers.google.com"))
    issues.push("officialDocRefs youtube videos.insert URL 누락");

  // forbidden behavior
  const fb = (p.forbiddenBehavior ?? []).join(" | ");
  for (const t of REQUIRED_FORBIDDEN) {
    if (!fb.includes(t)) issues.push(`forbiddenBehavior에 '${t}' 누락`);
  }

  return issues;
}

// ── 1. fixture 검증 ──────────────────────────────────────────────────────────
{
  check("fixture schemaVersion + taskId + status",
    fx.schemaVersion === "dual_platform_variant_publish_architecture_v1" &&
    fx.taskId === "dual-platform-variant-publish-architecture-no-live-v1" &&
    fx.status === "DUAL_PLATFORM_ARCHITECTURE_NO_LIVE");
  const issues = detectFixtureIssues(fx);
  check("fixture invariants: R2 suspended·IG=Blob·YT=direct·1→2변형→2job·daily(1→2,2→4)·YT letterbox·Blob=IG only·free-tier bounded·guards·승인10·docref·forbidden",
    issues.length === 0, issues.join("; "));
  check("fixture docsRef + strategyRef + r2ResultRef 실재",
    isStr(fx.docsRef) && existsSync(path.join(ROOT, fx.docsRef)) &&
    isStr(fx.strategyRef) && existsSync(path.join(ROOT, fx.strategyRef)) &&
    isStr(fx.r2ResultRef) && existsSync(path.join(ROOT, fx.r2ResultRef)));
  check("fixture verifier gate 상속(HTTPS/reject html/verified only)",
    fx.verifierGatesInheritedFromStrategy &&
    fx.verifierGatesInheritedFromStrategy.requireHttps === true &&
    fx.verifierGatesInheritedFromStrategy.rejectTextHtml === true &&
    fx.verifierGatesInheritedFromStrategy.uploadOnlyWithVerifiedUrl === true);
  check("fixture blobStoragePressureSource = Instagram variants only",
    fx.blobStoragePressureSource === "instagram_public_url_variants_only");
}

// ── 2. docs 검증 ─────────────────────────────────────────────────────────────
{
  check("docs: R2 suspended by owner preference 명시",
    docs.includes("suspended") && (docs.includes("Owner preference") || docs.includes("Owner")));
  check("docs: Instagram=Vercel Blob public URL + YouTube=direct file upload 명시",
    docs.includes("Vercel Blob") && docs.includes("direct") && docs.includes("YouTube Data API"));
  check("docs: YouTube variant 검은 여백/중앙 배치 명시",
    (docs.includes("검정") || docs.includes("검은")) && (docs.includes("중앙") || docs.includes("centered")) && docs.includes("여백"));
  check("docs: 1개/일 2 jobs, 2개/일 4 jobs 수식 명문화",
    docs.includes("2") && docs.includes("4") && (docs.includes("publish jobs") || docs.includes("jobs")));
  check("docs: free-tier plausible but not unlimited/guaranteed 명시",
    (docs.includes("plausible") || docs.includes("가능")) && (docs.includes("무제한") && docs.includes("보장")));
  check("docs: 승인 순서 10종(APPROVE_DUAL_PLATFORM_ARCHITECTURE ~ APPROVE_DUAL_PLATFORM_ARM) 명문화",
    docs.includes("APPROVE_DUAL_PLATFORM_ARCHITECTURE") && docs.includes("APPROVE_DUAL_PLATFORM_ARM") &&
    docs.includes("APPROVE_YOUTUBE_OAUTH_AND_UPLOAD_INTEGRATION"));
  check("docs: repo public/ fallback 비-sustained 명시",
    docs.includes("public/") && (docs.includes("sustained default가 아니") || docs.includes("one-off")));
  check("docs: 공식 Vercel/YouTube source URL 명시",
    docs.includes("vercel.com/docs/vercel-blob") && docs.includes("developers.google.com/youtube"));
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

// ── 4. mutant — fail-closed 확인 ─────────────────────────────────────────────
{
  const m1 = clone(fx); m1.cloudflareR2Status.state = "primary";
  check("mutant 1: Cloudflare/R2 다시 primary → fail",
    detectFixtureIssues(m1).some((i) => i.includes("suspended")));
  const m2 = clone(fx); m2.youtubeUploadMode = "vercel_blob_public_direct_url"; m2.youtubeUsesBlobUrl = true;
  check("mutant 2: YouTube를 Blob URL 경로로 발행 → fail",
    detectFixtureIssues(m2).some((i) => i.includes("direct file upload 아님") || i.includes("Blob URL 경로")));
  const m3 = clone(fx); m3.renderVariants = fx.renderVariants.filter((v) => v.id !== YT_VARIANT); m3.publishJobs = fx.publishJobs.filter((j) => j.id !== "youtube_job");
  check("mutant 3: YouTube first-class target 누락 → fail",
    detectFixtureIssues(m3).some((i) => i.includes("YouTube")));
  const m4 = clone(fx); m4.dailyCapacityBaseline.onePerDay.publishJobs = 1;
  check("mutant 4: 1 content/day -> 2 jobs 수식 훼손 → fail",
    detectFixtureIssues(m4).some((i) => i.includes("1 content/day")));
  const m5 = clone(fx); m5.dailyCapacityBaseline.twoPerDay.publishJobs = 2;
  check("mutant 5: 2 contents/day -> 4 jobs 수식 훼손 → fail",
    detectFixtureIssues(m5).some((i) => i.includes("2 contents/day")));
  const m6 = clone(fx); const yt6 = m6.renderVariants.find((v) => v.id === YT_VARIANT); yt6.blackTopBottomSpace = false;
  check("mutant 6: YouTube variant black top/bottom space 제거 → fail",
    detectFixtureIssues(m6).some((i) => i.includes("black top/bottom")));
  const m7 = clone(fx); const yt7 = m7.renderVariants.find((v) => v.id === YT_VARIANT); yt7.centeredContent = false;
  check("mutant 7: YouTube variant centered content 제거 → fail",
    detectFixtureIssues(m7).some((i) => i.includes("centered content")));
  const m8 = clone(fx); m8.blobRequiredVariantsOnly = [IG_VARIANT, YT_VARIANT];
  check("mutant 8: YouTube variant가 Blob-required로 샘 → fail",
    detectFixtureIssues(m8).some((i) => i.includes("Instagram variant 단일")));
  const m9 = clone(fx); m9.freeTierFeasibility.unlimited = true;
  check("mutant 9: free-tier를 unlimited로 서술 → fail",
    detectFixtureIssues(m9).some((i) => i.includes("무제한")));
  const m10 = clone(fx); m10.freeTierFeasibility.guaranteedFree = true;
  check("mutant 10: free-tier를 guaranteed로 서술 → fail",
    detectFixtureIssues(m10).some((i) => i.includes("보장 무료")));
  const m11 = clone(fx); m11.costAndQuotaGuards = [];
  check("mutant 11: cost/retention guard 제거 → fail",
    detectFixtureIssues(m11).some((i) => i.includes("costAndQuotaGuards") || i.includes("retention")));
  const m12 = clone(fx); m12.forbiddenBehavior = fx.forbiddenBehavior.filter((t) => !t.includes("object upload") && !t.includes("Instagram upload or --arm") && !t.includes("YouTube upload/API/OAuth execution"));
  check("mutant 12: upload/Instagram/YouTube live action 금지 제거 → fail",
    detectFixtureIssues(m12).some((i) => i.includes("object upload") || i.includes("Instagram upload") || i.includes("YouTube upload")));
  const m13 = clone(fx); m13.repoPublicFallback.isSustainedDefault = true;
  check("mutant 13: repo public/ fallback을 sustained default로 승격 → fail",
    detectFixtureIssues(m13).some((i) => i.includes("sustained default로 승격")));
  const m14 = clone(fx); delete m14.officialDocRefs.youtubeVideosInsert;
  check("mutant 14: 공식 YouTube source URL 제거 → fail",
    detectFixtureIssues(m14).some((i) => i.includes("youtube videos.insert URL")));
  const m15 = clone(fx); m15.futureApprovalSequence = fx.futureApprovalSequence.filter((a) => a !== "APPROVE_DUAL_PLATFORM_ARM");
  check("mutant 15: 승인 순서에서 최종 --arm 게이트 제거 → fail",
    detectFixtureIssues(m15).some((i) => i.includes("APPROVE_DUAL_PLATFORM_ARM")));
}

console.log(failures === 0
  ? `\nRESULT: ALL PASS (${passes} checks)`
  : `\nRESULT: ${failures} FAILURE(S) / ${passes + failures} checks`);
process.exit(failures === 0 ? 0 : 1);
