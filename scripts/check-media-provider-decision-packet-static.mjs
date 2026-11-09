#!/usr/bin/env node
/**
 * check-media-provider-decision-packet-static.mjs
 *
 * Media provider decision packet — 정적 가드 (no-live).
 * task: media-provider-discovery-decision-packet-v1
 *
 * 이 가드 자체는 no-live다: 레포 내 decision packet fixture JSON + docs 텍스트만 읽는다.
 * (network/env/secret/upload/subprocess/write 없음)
 *
 * 검증:
 *  1) fixture: sustained default host = media.buildgongjakso.com 보존(historical 참조),
 *     candidates(cloudflare_r2/vercel_blob/s3_compatible) 존재 + chosen(historical, primary=cloudflare_r2/fallback=vercel_blob 기록 유지),
 *     activeDecision(현재 active): Instagram=vercel_blob_public_direct_url, YouTube=direct file upload,
 *     R2=suspended_by_owner_preference & cloudflareR2IsCurrentPrimary=false,
 *     candidate role/customDomainSupported 일관성(historical),
 *     futureSequence 8게이트 + approvalGates(DNS/env/provisioning/deploy/upload/live/arm),
 *     verifier gate 상속, forbidden behavior, local/official read-only evidence,
 *     secret 값 미기록(requiredEnvNames는 이름만)
 *  2) docs: provider 비교(historical) + active decision(§0, Instagram=Blob/YouTube=direct/R2=suspended) +
 *     custom domain 근거 + 8단계 승인 시퀀스(historical) + 리스크/롤백 명문화
 *  3) mutant → 전부 fail (R2가 activeDecision에서 다시 primary로 승격되거나 YouTube가 Blob 경로로 가면 fail 포함)
 */
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const SELF = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SELF), "..");
const J = (a, b) => a + b; // 토큰 분할-연결 (self-scan denylist 예외, 검색 전용)

const FIXTURE_PATH = path.join(ROOT, "scripts", "fixtures", "media_provider_decision_packet.v1.json");
const DOCS_PATH = path.join(ROOT, "docs", "media-provider-decision-packet.md");

const SUSTAINED_DEFAULT_HOST = "media.buildgongjakso.com";
const REQUIRED_CANDIDATES = ["vercel_blob", "cloudflare_r2", "s3_compatible"];

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
  check("decision packet fixture parses as JSON", true);
} catch (e) {
  check("decision packet fixture parses as JSON", false, String(e).slice(0, 160));
}
let docs = null;
try {
  docs = readFileSync(DOCS_PATH, "utf8");
  check("decision packet docs readable", true);
} catch (e) {
  check("decision packet docs readable", false, String(e).slice(0, 120));
}
if (!fx || !docs) {
  console.error(`\nRESULT: ${failures} FAILURE(S) / ${passes + failures} checks — core artifact unreadable, aborting`);
  process.exit(1);
}

// ── 순수 fixture 검증기 (mutant 재사용) ───────────────────────────────────────
function detectFixtureIssues(p) {
  const issues = [];

  // sustained default host 보존
  if (p.sustainedDefaultHost !== SUSTAINED_DEFAULT_HOST) issues.push(`sustainedDefaultHost=${p.sustainedDefaultHost} (media.buildgongjakso.com 아님 — sustained host drift)`);
  if (p.sustainedDefaultPreserved !== true) issues.push("sustainedDefaultPreserved != true");

  // candidates: 3종 존재
  const cands = Array.isArray(p.candidates) ? p.candidates : [];
  const ids = cands.map((c) => c && c.id);
  for (const req of REQUIRED_CANDIDATES) {
    if (!ids.includes(req)) issues.push(`candidate 누락: ${req}`);
  }
  // requiredEnvNames는 이름만 (값 형태 금지 — '=' 포함 시 값 섞임 의심)
  for (const c of cands) {
    const names = Array.isArray(c?.requiredEnvNames) ? c.requiredEnvNames : [];
    if (names.length === 0) issues.push(`candidate ${c?.id} requiredEnvNames 비어있음`);
    for (const n of names) {
      if (typeof n !== "string" || n.includes("=") || /\s/.test(n)) issues.push(`candidate ${c?.id} env name에 값/공백 의심: ${n}`);
    }
  }

  // chosen: historical record — primary/fallback 값 자체는 당시 기록으로 보존하되
  // historicalOnly=true + supersededByActiveDecision=true로 "현재 active 아님"을 명확히 표시해야 한다.
  const ch = p.chosen ?? {};
  if (ch.primary !== "cloudflare_r2") issues.push(`chosen.primary=${ch.primary} (cloudflare_r2 아님 — historical 기록 훼손)`);
  if (ch.fallback !== "vercel_blob") issues.push(`chosen.fallback=${ch.fallback} (vercel_blob 아님)`);
  if (!isStr(ch.fallback)) issues.push("chosen.fallback 누락");
  if (!REQUIRED_CANDIDATES.includes(ch.primary)) issues.push("chosen.primary가 candidate 밖");
  if (!REQUIRED_CANDIDATES.includes(ch.fallback)) issues.push("chosen.fallback가 candidate 밖");
  if (!isStr(ch.rationale)) issues.push("chosen.rationale 누락");
  if (ch.historicalOnly !== true) issues.push("chosen.historicalOnly != true (historical 표시 누락 — R2가 여전히 active로 오독될 위험)");
  if (ch.supersededByActiveDecision !== true) issues.push("chosen.supersededByActiveDecision != true");

  // activeDecision: 현재 active recommendation — dual-platform 아키텍처와 정합해야 한다.
  const ad = p.activeDecision ?? {};
  if (ad.instagramPublicUrlProvider !== "vercel_blob_public_direct_url")
    issues.push(`activeDecision.instagramPublicUrlProvider=${ad.instagramPublicUrlProvider} (vercel_blob_public_direct_url 아님 — Instagram active provider drift)`);
  if (ad.youtubeUploadMode !== "youtube_data_api_direct_file_upload")
    issues.push(`activeDecision.youtubeUploadMode=${ad.youtubeUploadMode} (direct file upload 아님 — YouTube가 Blob 등 다른 경로로 라우팅됨)`);
  if (ad.cloudflareR2Status !== "suspended_by_owner_preference")
    issues.push(`activeDecision.cloudflareR2Status=${ad.cloudflareR2Status} (suspended_by_owner_preference 아님)`);
  if (ad.cloudflareR2IsCurrentPrimary !== false)
    issues.push("activeDecision.cloudflareR2IsCurrentPrimary != false (R2가 다시 current primary로 승격됨)");
  if (p.status !== "PROVIDER_DECISION_SUPERSEDED_BY_DUAL_PLATFORM")
    issues.push(`status=${p.status} (PROVIDER_DECISION_SUPERSEDED_BY_DUAL_PLATFORM 아님)`);
  if (!isStr(p.supersededBy)) issues.push("supersededBy 누락 (superseding task 참조 없음)");
  if (!isStr(p.activeArchitectureRef)) issues.push("activeArchitectureRef 누락 (dual-platform fixture 참조 없음)");
  // candidate role 일관성: primary=cloudflare_r2, fallback=vercel_blob role이 chosen과 일치해야 한다.
  const roleById = Object.fromEntries((Array.isArray(p.candidates) ? p.candidates : []).map((c) => [c?.id, c?.role]));
  if (roleById.cloudflare_r2 !== "primary") issues.push(`candidate cloudflare_r2 role=${roleById.cloudflare_r2} (primary 아님)`);
  if (roleById.vercel_blob !== "fallback") issues.push(`candidate vercel_blob role=${roleById.vercel_blob} (fallback 아님)`);
  // custom domain 근거: R2는 customDomainSupported true, vercel_blob은 false여야(미확인) primary/fallback 순서가 근거와 일치.
  const cdById = Object.fromEntries((Array.isArray(p.candidates) ? p.candidates : []).map((c) => [c?.id, c?.customDomainSupported]));
  if (cdById.cloudflare_r2 !== true) issues.push("candidate cloudflare_r2.customDomainSupported != true (custom domain 근거 소실)");
  if (cdById.vercel_blob !== false) issues.push("candidate vercel_blob.customDomainSupported != false (blob custom domain 직접 연결 근거는 미확인이어야 함)");

  // futureSequence: 8게이트 + ownerApprovalRequired
  const seq = Array.isArray(p.futureSequence) ? p.futureSequence : [];
  if (seq.length !== 8) issues.push(`futureSequence 게이트 ${seq.length}개 (8개 아님)`);
  if (!seq.every((s) => s && s.ownerApprovalRequired === true)) issues.push("futureSequence 일부 게이트 ownerApprovalRequired != true");
  const seqGates = seq.map((s) => s && s.gate).join(" | ");
  for (const g of ["dns_custom_domain_approval", "env_secret_configuration_approval", "deploy_approval", "instagram_arm_approval"]) {
    if (!seqGates.includes(g)) issues.push(`futureSequence에 '${g}' 게이트 누락`);
  }

  // approvalGates: DNS/env 필수 true
  const ag = p.approvalGates ?? {};
  if (ag.dns !== true) issues.push("approvalGates.dns != true (DNS 승인 게이트 누락)");
  if (ag.envSecret !== true) issues.push("approvalGates.envSecret != true (env/secret 승인 게이트 누락)");
  if (ag.provisioning !== true) issues.push("approvalGates.provisioning != true");
  if (ag.deploy !== true) issues.push("approvalGates.deploy != true");
  if (ag.objectUpload !== true) issues.push("approvalGates.objectUpload != true");
  if (ag.liveUrlCheck !== true) issues.push("approvalGates.liveUrlCheck != true");
  if (ag.instagramArm !== true) issues.push("approvalGates.instagramArm != true");

  // verifier gate 상속
  const vg = p.verifierGatesInheritedFromStrategy ?? {};
  if (vg.requireHttps !== true) issues.push("verifierGate.requireHttps != true");
  if (vg.rejectTextHtml !== true) issues.push("verifierGate.rejectTextHtml != true");
  if (vg.uploadOnlyWithVerifiedUrl !== true) issues.push("verifierGate.uploadOnlyWithVerifiedUrl != true");

  // local read-only evidence: secret 미기록
  const ev = p.localReadOnlyEvidence ?? {};
  if (ev.secretValuesRead !== false) issues.push("localReadOnlyEvidence.secretValuesRead != false");

  // forbidden behavior
  const fb = (p.forbiddenBehavior ?? []).join(" | ");
  for (const t of ["storage provisioning", "DNS/custom domain change", "env/secret write", "deploy", "object upload", "public URL liveness", "Instagram upload or --arm", "secret logging", "dependency/lockfile"]) {
    if (!fb.includes(t)) issues.push(`forbiddenBehavior에 '${t}' 항목 누락`);
  }

  return issues;
}

// ── 1. fixture 검증 ──────────────────────────────────────────────────────────
{
  check("fixture schemaVersion + taskId + status(superseded)",
    fx.schemaVersion === "media_provider_decision_packet_v1" &&
    fx.taskId === "media-provider-discovery-decision-packet-v1" &&
    fx.status === "PROVIDER_DECISION_SUPERSEDED_BY_DUAL_PLATFORM");
  const issues = detectFixtureIssues(fx);
  check("fixture invariants: sustained host 보존(historical)/candidates 3종/chosen(historical)+activeDecision(dual-platform)/8게이트/approvalGates/verifier 상속/secret 미기록/forbidden",
    issues.length === 0, issues.join("; "));
  check("fixture docsRef + strategyRef + activeArchitectureRef 실재",
    isStr(fx.docsRef) && existsSync(path.join(ROOT, fx.docsRef)) &&
    isStr(fx.strategyRef) && existsSync(path.join(ROOT, fx.strategyRef)) &&
    isStr(fx.activeArchitectureRef) && existsSync(path.join(ROOT, fx.activeArchitectureRef)));
  check("fixture riskAndRollback 4개 이상 (R1 R2 zone/DNS · R3 env · R4 blob custom domain 미확인, historical)",
    Array.isArray(fx.riskAndRollback) && fx.riskAndRollback.length >= 4);
  check("fixture officialDocEvidence에 secret 값 형태 미포함 (토큰 리터럴 없음)",
    !JSON.stringify(fx.officialDocEvidence ?? {}).match(/[A-Za-z0-9_-]{32,}/));
}

// ── 2. docs 검증 ─────────────────────────────────────────────────────────────
{
  check("docs: sustained default = media.buildgongjakso.com 보존 명시(historical)",
    docs.includes("media.buildgongjakso.com"));
  check("docs: 3 provider(Vercel Blob/Cloudflare R2/S3-compatible) 비교",
    docs.includes("Vercel Blob") && docs.includes("Cloudflare R2") && docs.includes("S3-compatible"));
  check("docs: §0 Active Decision — Instagram=Vercel Blob / YouTube=direct upload / R2=suspended 명시",
    docs.includes("Active Decision") && docs.includes("Vercel Blob public direct URL") &&
    docs.includes("YouTube Data API direct file upload") && docs.includes("suspended"));
  check("docs: R2 primary가 historical/superseded로 명시",
    (docs.includes("historical") || docs.includes("Historical")) &&
    (docs.includes("superseded") || docs.includes("Superseded") || docs.includes("supersede")));
  check("docs: dual-platform-variant-publish-architecture 문서 참조 명시",
    docs.includes("dual-platform-variant-publish-architecture.md"));
  check("docs: custom domain 근거 대비(R2 직접 연결 근거 있음 vs Vercel Blob 미확인, historical) 명문화",
    docs.includes("직접 연결 근거") && (docs.includes("확인되지 않") || docs.includes("미확인")) &&
    docs.includes("redirect/proxy"));
  check("docs: (historical) 승인 시퀀스(DNS/env/deploy/--arm) 명문화 + 현재 active 시퀀스 참조",
    docs.includes("DNS") && docs.includes("Env/secret") && docs.includes("Deploy") && docs.includes("--arm") &&
    docs.includes("APPROVE_DUAL_PLATFORM_ARM"));
  check("docs: 리스크 & 롤백 명문화",
    (docs.includes("리스크") || docs.includes("Risk") || docs.includes("risk")) &&
    (docs.includes("롤백") || docs.includes("rollback") || docs.includes("Rollback")));
  check("docs: local read-only evidence(이미 Vercel 링크 + 동일 org 도메인 + *.mp4 gitignore) 명시",
    docs.includes(".vercel") && docs.includes("buildgongjakso-home") && docs.includes("*.mp4"));
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

// ── 4. mutant — fail-closed 확인 (HANDOFF 요구 12종 + provider order fix 2종) ─
{
  const m1 = clone(fx); m1.sustainedDefaultHost = "www.buildgongjakso.com";
  check("mutant 1: sustained host drift (media→www) → fail",
    detectFixtureIssues(m1).some((i) => i.includes("sustained host drift")));
  const m2 = clone(fx); m2.candidates = fx.candidates.filter((c) => c.id !== "cloudflare_r2");
  check("mutant 2: candidate provider 누락(cloudflare_r2) → fail",
    detectFixtureIssues(m2).some((i) => i.includes("candidate 누락")));
  const m3 = clone(fx); delete m3.chosen.primary;
  check("mutant 3: chosen recommendation(primary) 누락 → fail",
    detectFixtureIssues(m3).some((i) => i.includes("chosen.primary")));
  const m4 = clone(fx); m4.approvalGates.dns = false;
  check("mutant 4: DNS 승인 게이트 누락 → fail",
    detectFixtureIssues(m4).some((i) => i.includes("DNS")));
  const m5 = clone(fx); m5.approvalGates.envSecret = false;
  check("mutant 5: env/secret 승인 게이트 누락 → fail",
    detectFixtureIssues(m5).some((i) => i.includes("env/secret")));
  const m6 = clone(fx); m6.approvalGates.provisioning = false;
  check("mutant 6: 이 slice에서 provisioning 허용 → fail",
    detectFixtureIssues(m6).some((i) => i.includes("provisioning")));
  const m7 = clone(fx); m7.approvalGates.deploy = false;
  check("mutant 7: 이 slice에서 deploy 허용 → fail",
    detectFixtureIssues(m7).some((i) => i.includes("deploy")));
  const m8 = clone(fx); m8.approvalGates.objectUpload = false;
  check("mutant 8: 이 slice에서 object upload 허용 → fail",
    detectFixtureIssues(m8).some((i) => i.includes("objectUpload")));
  const m9 = clone(fx); m9.approvalGates.liveUrlCheck = false;
  check("mutant 9: 이 slice에서 live URL check 허용 → fail",
    detectFixtureIssues(m9).some((i) => i.includes("liveUrlCheck")));
  const m10 = clone(fx); m10.approvalGates.instagramArm = false;
  check("mutant 10: 이 slice에서 Instagram upload 허용 → fail",
    detectFixtureIssues(m10).some((i) => i.includes("instagramArm")));
  const m11 = clone(fx); m11.localReadOnlyEvidence.secretValuesRead = true;
  check("mutant 11: secret 값 read/logging 허용 → fail",
    detectFixtureIssues(m11).some((i) => i.includes("secretValuesRead")));
  const m12 = clone(fx); m12.forbiddenBehavior = fx.forbiddenBehavior.filter((t) => !t.includes("dependency/lockfile"));
  check("mutant 12: dependency/lockfile 변경 금지 제거 → fail",
    detectFixtureIssues(m12).some((i) => i.includes("dependency/lockfile")));
  const m13 = clone(fx); m13.candidates[0].requiredEnvNames = ["R2_ACCESS_KEY_ID=r2_live_abc123secretvaluexyz"];
  check("mutant 13: env name에 secret 값 섞임 → fail",
    detectFixtureIssues(m13).some((i) => i.includes("env name에 값")));
  const m14 = clone(fx); delete m14.chosen.historicalOnly;
  check("mutant 14: chosen(historical)에서 historicalOnly 표시 제거 → fail (R2가 다시 active로 오독될 위험)",
    detectFixtureIssues(m14).some((i) => i.includes("historicalOnly")));
  const m15 = clone(fx);
  const r2 = m15.candidates.find((c) => c.id === "cloudflare_r2");
  const vb = m15.candidates.find((c) => c.id === "vercel_blob");
  r2.role = "fallback"; vb.role = "primary"; vb.customDomainSupported = true;
  check("mutant 15: candidate role 뒤집힘(R2 fallback / Blob primary) + Blob custom domain 근거 위조 → fail",
    detectFixtureIssues(m15).some((i) => i.includes("role=") || i.includes("customDomainSupported")));
  // dual-platform supersession 핵심 mutant: R2가 activeDecision에서 다시 primary로 승격되면 fail
  const m16 = clone(fx); m16.activeDecision.cloudflareR2IsCurrentPrimary = true; m16.activeDecision.cloudflareR2Status = "active_primary";
  check("mutant 16: R2가 activeDecision에서 다시 current primary로 승격 → fail",
    detectFixtureIssues(m16).some((i) => i.includes("cloudflareR2IsCurrentPrimary") || i.includes("cloudflareR2Status")));
  // YouTube가 Blob URL 경로로 라우팅되면 fail
  const m17 = clone(fx); m17.activeDecision.youtubeUploadMode = "vercel_blob_public_direct_url";
  check("mutant 17: YouTube가 activeDecision에서 Blob URL 경로로 라우팅 → fail",
    detectFixtureIssues(m17).some((i) => i.includes("youtubeUploadMode")));
  // Instagram active provider가 R2 등으로 drift되면 fail
  const m18 = clone(fx); m18.activeDecision.instagramPublicUrlProvider = "cloudflare_r2";
  check("mutant 18: Instagram active provider가 R2로 drift → fail",
    detectFixtureIssues(m18).some((i) => i.includes("instagramPublicUrlProvider")));
  // status가 superseded 표시 없이 그대로 no-live로 되돌아가면 fail
  const m19 = clone(fx); m19.status = "PROVIDER_DECISION_NO_LIVE";
  check("mutant 19: status가 supersession 표시 없이 회귀 → fail",
    detectFixtureIssues(m19).some((i) => i.includes("status=")));
  const m20 = clone(fx); delete m20.activeArchitectureRef;
  check("mutant 20: activeArchitectureRef(dual-platform 참조) 누락 → fail",
    detectFixtureIssues(m20).some((i) => i.includes("activeArchitectureRef")));
}

console.log(failures === 0
  ? `\nRESULT: ALL PASS (${passes} checks)`
  : `\nRESULT: ${failures} FAILURE(S) / ${passes + failures} checks`);
process.exit(failures === 0 ? 0 : 1);
