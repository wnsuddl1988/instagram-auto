#!/usr/bin/env node
/**
 * check-r2-provisioning-approval-packet-static.mjs
 *
 * Cloudflare R2 provisioning approval packet — 정적 가드 (no-live).
 * task: r2-primary-provisioning-approval-packet-v1
 *
 * 이 가드 자체는 no-live다: 레포 내 approval packet fixture JSON + docs 텍스트만 읽는다.
 * (network/env/secret/upload/subprocess/write 없음)
 *
 * 검증:
 *  1) fixture: provider=cloudflare_r2, sustainedHost=media.buildgongjakso.com 보존,
 *     proposed bucket + custom domain, deterministic object key(= URL path),
 *     required env names 6종(값 미포함), approval gates 8종,
 *     rollback 6단계, future approval snippets, verifier gate 상속,
 *     official doc refs, forbidden behavior
 *  2) docs: bucket/custom domain/env 이름/10단계 setup/unknowns/rollback/approval snippets 명문화
 *  3) mutant 15종(HANDOFF 요구) → 전부 fail
 */
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const SELF = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SELF), "..");
const J = (a, b) => a + b; // 토큰 분할-연결 (self-scan denylist 예외, 검색 전용)

const FIXTURE_PATH = path.join(ROOT, "scripts", "fixtures", "r2_provisioning_approval_packet.v1.json");
const DOCS_PATH = path.join(ROOT, "docs", "r2-provisioning-approval-packet.md");

const PROVIDER = "cloudflare_r2";
const SUSTAINED_HOST = "media.buildgongjakso.com";
const CUSTOM_DOMAIN = "media.buildgongjakso.com";
const REQUIRED_ENV = ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET", "R2_ENDPOINT", "PUBLIC_MEDIA_BASE_URL"];
const REQUIRED_GATES = ["provisioning", "dnsCustomDomain", "envSecretWrite", "codeIntegration", "deploy", "objectUploadTest", "liveLivenessCheck", "instagramArm"];

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
  check("r2 packet fixture parses as JSON", true);
} catch (e) {
  check("r2 packet fixture parses as JSON", false, String(e).slice(0, 160));
}
let docs = null;
try {
  docs = readFileSync(DOCS_PATH, "utf8");
  check("r2 packet docs readable", true);
} catch (e) {
  check("r2 packet docs readable", false, String(e).slice(0, 120));
}
if (!fx || !docs) {
  console.error(`\nRESULT: ${failures} FAILURE(S) / ${passes + failures} checks — core artifact unreadable, aborting`);
  process.exit(1);
}

// ── 순수 fixture 검증기 (mutant 재사용) ───────────────────────────────────────
function detectFixtureIssues(p) {
  const issues = [];

  // provider / host 보존
  if (p.provider !== PROVIDER) issues.push(`provider=${p.provider} (cloudflare_r2 아님 — provider drift)`);
  if (p.sustainedHost !== SUSTAINED_HOST) issues.push(`sustainedHost=${p.sustainedHost} (media.buildgongjakso.com 아님 — host drift)`);
  if (p.sustainedHostPreserved !== true) issues.push("sustainedHostPreserved != true");
  if (p.noLiveThisSlice !== true) issues.push("noLiveThisSlice != true");

  // bucket / custom domain
  if (!isStr(p.proposedBucketName)) issues.push("proposedBucketName 누락 (bucket 제안 없음)");
  if (p.customDomain !== CUSTOM_DOMAIN) issues.push(`customDomain=${p.customDomain} (media.buildgongjakso.com 아님)`);

  // object key policy: deterministic + object key = URL path
  const k = p.objectKeyPolicy ?? {};
  if (!isStr(k.prefixPattern) || !k.prefixPattern.includes("<topicId>")) issues.push("objectKeyPolicy.prefixPattern에 <topicId> 없음");
  if (k.deterministic !== true) issues.push("objectKeyPolicy.deterministic != true");
  if (k.noRandomSuffix !== true) issues.push("objectKeyPolicy.noRandomSuffix != true");
  if (k.objectKeyEqualsUrlPath !== true) issues.push("objectKeyPolicy.objectKeyEqualsUrlPath != true");
  let exHost = null;
  try { exHost = new URL(k.examplePublicUrl).hostname; } catch { /* below */ }
  if (exHost !== SUSTAINED_HOST) issues.push(`objectKeyPolicy.examplePublicUrl host=${exHost} (media.buildgongjakso.com 아님)`);
  // 예시 object key가 URL path와 정확히 일치하는지
  let exPath = null;
  try { exPath = new URL(k.examplePublicUrl).pathname.replace(/^\//, ""); } catch { /* below */ }
  if (isStr(exPath) && isStr(k.exampleObjectKey) && exPath !== k.exampleObjectKey) issues.push("exampleObjectKey가 examplePublicUrl path와 불일치 (object key = URL path 위반)");

  // required env names: 정확히 6종 + 값 미포함(이름만)
  const env = Array.isArray(p.requiredEnvNames) ? p.requiredEnvNames : [];
  for (const req of REQUIRED_ENV) {
    if (!env.includes(req)) issues.push(`requiredEnvNames 누락: ${req}`);
  }
  if (p.envNamesOnlyNoValues !== true) issues.push("envNamesOnlyNoValues != true");
  for (const n of env) {
    if (typeof n !== "string" || n.includes("=") || /\s/.test(n)) issues.push(`env name에 값/공백 의심(값 섞임): ${n}`);
  }
  if (p.publicReadViaCustomDomainOnly !== true) issues.push("publicReadViaCustomDomainOnly != true (public read가 custom domain 외로 샐 수 있음)");

  // setup sequence: 10단계
  const seq = Array.isArray(p.setupSequence) ? p.setupSequence : [];
  if (seq.length !== 10) issues.push(`setupSequence ${seq.length}단계 (10단계 아님)`);
  const seqIds = seq.map((s) => s && s.id).join(" | ");
  for (const id of ["bucket_creation", "public_bucket_custom_domain", "api_token_creation", "env_secret_config", "instagram_arm"]) {
    if (!seqIds.includes(id)) issues.push(`setupSequence에 '${id}' 단계 누락`);
  }

  // approval gates: 8종 전부 true
  const ag = p.approvalGates ?? {};
  for (const g of REQUIRED_GATES) {
    if (ag[g] !== true) issues.push(`approvalGates.${g} != true (승인 게이트 누락)`);
  }

  // rollback: 6단계, 핵심 토큰
  const rb = Array.isArray(p.rollback) ? p.rollback : [];
  if (rb.length < 6) issues.push(`rollback ${rb.length}단계 (6단계 미만)`);
  const rbJoined = rb.join(" | ");
  for (const t of ["disable domain access", "remove custom domain", "revoke token", "remove env values", "stop uploader", "one-off repo public/ fallback only if explicitly approved"]) {
    if (!rbJoined.includes(t)) issues.push(`rollback에 '${t}' 누락`);
  }

  // future approval snippets: 게이트별 존재
  const snip = p.futureApprovalSnippets ?? {};
  for (const s of ["provisioning", "dnsCustomDomain", "envSecretWrite", "codeIntegration", "deploy", "objectUploadAndLiveness", "instagramArm"]) {
    if (!isStr(snip[s])) issues.push(`futureApprovalSnippets.${s} 누락`);
  }
  if (isStr(snip.provisioning) && !snip.provisioning.startsWith("APPROVE_R2_PROVISIONING")) issues.push("provisioning snippet 문구 불일치");

  // verifier gate 상속
  const vg = p.verifierGatesInheritedFromStrategy ?? {};
  if (vg.requireHttps !== true) issues.push("verifierGate.requireHttps != true");
  if (vg.rejectTextHtml !== true) issues.push("verifierGate.rejectTextHtml != true");
  if (vg.uploadOnlyWithVerifiedUrl !== true) issues.push("verifierGate.uploadOnlyWithVerifiedUrl != true");

  // official doc refs
  const dr = p.officialDocRefs ?? {};
  if (!isStr(dr.r2PublicBuckets) || !dr.r2PublicBuckets.includes("developers.cloudflare.com")) issues.push("officialDocRefs.r2PublicBuckets 누락/불일치");
  if (!isStr(dr.r2ApiTokens) || !dr.r2ApiTokens.includes("developers.cloudflare.com")) issues.push("officialDocRefs.r2ApiTokens 누락/불일치");

  // forbidden behavior
  const fb = (p.forbiddenBehavior ?? []).join(" | ");
  for (const t of ["R2 bucket creation", "R2 token creation", "DNS/custom domain change", "env/secret write", "object upload", "public URL liveness", "Instagram upload or --arm", "secret logging", "dependency/lockfile"]) {
    if (!fb.includes(t)) issues.push(`forbiddenBehavior에 '${t}' 누락`);
  }

  return issues;
}

// ── 1. fixture 검증 ──────────────────────────────────────────────────────────
{
  check("fixture schemaVersion + taskId + status",
    fx.schemaVersion === "r2_provisioning_approval_packet_v1" &&
    fx.taskId === "r2-primary-provisioning-approval-packet-v1" &&
    fx.status === "R2_PROVISIONING_APPROVAL_PACKET_NO_LIVE");
  const issues = detectFixtureIssues(fx);
  check("fixture invariants: provider/host 보존·bucket·domain·key(=path)·env 6종·gate 8종·rollback 6·snippet·verifier·docref·forbidden",
    issues.length === 0, issues.join("; "));
  check("fixture docsRef + strategyRef + providerDecisionRef 실재",
    isStr(fx.docsRef) && existsSync(path.join(ROOT, fx.docsRef)) &&
    isStr(fx.strategyRef) && existsSync(path.join(ROOT, fx.strategyRef)) &&
    isStr(fx.providerDecisionRef) && existsSync(path.join(ROOT, fx.providerDecisionRef)));
  check("fixture unknowns 5개 이상 (U1~U5)",
    Array.isArray(fx.unknowns) && fx.unknowns.length >= 5);
  check("fixture r2DevEndpointForProductionForbidden true (r2.dev 비-production 준수)",
    fx.r2DevEndpointForProductionForbidden === true);
}

// ── 2. docs 검증 ─────────────────────────────────────────────────────────────
{
  check("docs: provider cloudflare_r2 + sustained host 명시",
    docs.includes("cloudflare_r2") && docs.includes("media.buildgongjakso.com"));
  check("docs: proposed bucket(buildgongjakso-media) + custom domain 명시",
    docs.includes("buildgongjakso-media") && docs.includes("media.buildgongjakso.com"));
  check("docs: required env 6종 이름 명시 (값 없이)",
    REQUIRED_ENV.every((n) => docs.includes(n)));
  check("docs: R2 setup 순서(bucket/custom domain/token/env/deploy/--arm) 명문화",
    docs.includes("bucket") && docs.includes("custom domain") && docs.includes("token") &&
    docs.includes("deploy") && docs.includes("--arm"));
  check("docs: unknowns(U1~U5) 명문화",
    docs.includes("U1") && docs.includes("U5") && docs.includes("Cloudflare"));
  check("docs: rollback(disable/remove custom domain/revoke/remove env/stop uploader/one-off) 명문화",
    docs.includes("disable domain access") && docs.includes("revoke token") &&
    docs.includes("stop uploader") && docs.includes("one-off"));
  check("docs: future approval snippets(APPROVE_R2_*) 명문화",
    docs.includes("APPROVE_R2_PROVISIONING") && docs.includes("APPROVE_R2_ENV_WRITE") &&
    docs.includes("APPROVE_INSTAGRAM_ARM_WITH_R2_URL"));
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

// ── 4. mutant — fail-closed 확인 (HANDOFF 요구 15종) ─────────────────────────
{
  const m1 = clone(fx); m1.provider = "vercel_blob";
  check("mutant 1: provider drift (r2→vercel_blob) → fail",
    detectFixtureIssues(m1).some((i) => i.includes("provider drift")));
  const m2 = clone(fx); m2.sustainedHost = "www.buildgongjakso.com";
  check("mutant 2: sustained host drift (media→www) → fail",
    detectFixtureIssues(m2).some((i) => i.includes("host drift")));
  const m3 = clone(fx); delete m3.proposedBucketName;
  check("mutant 3: bucket 제안 누락 → fail",
    detectFixtureIssues(m3).some((i) => i.includes("proposedBucketName")));
  const m4 = clone(fx); m4.customDomain = "example.com";
  check("mutant 4: custom domain 누락/변조 → fail",
    detectFixtureIssues(m4).some((i) => i.includes("customDomain")));
  const m5 = clone(fx); m5.requiredEnvNames = fx.requiredEnvNames.filter((n) => n !== "R2_SECRET_ACCESS_KEY");
  check("mutant 5: env name 누락 → fail",
    detectFixtureIssues(m5).some((i) => i.includes("requiredEnvNames 누락")));
  const m6 = clone(fx); m6.requiredEnvNames = [...fx.requiredEnvNames.slice(0, 5), "R2_SECRET_ACCESS_KEY=r2secretvaluexyz123"];
  check("mutant 6: env name에 값 섞임 → fail",
    detectFixtureIssues(m6).some((i) => i.includes("값 섞임")));
  const m7 = clone(fx); m7.approvalGates.provisioning = false;
  check("mutant 7: provisioning 승인 게이트 누락 → fail",
    detectFixtureIssues(m7).some((i) => i.includes("provisioning")));
  const m8 = clone(fx); m8.approvalGates.dnsCustomDomain = false;
  check("mutant 8: DNS 승인 게이트 누락 → fail",
    detectFixtureIssues(m8).some((i) => i.includes("dnsCustomDomain")));
  const m9 = clone(fx); m9.approvalGates.envSecretWrite = false;
  check("mutant 9: env/secret 승인 게이트 누락 → fail",
    detectFixtureIssues(m9).some((i) => i.includes("envSecretWrite")));
  const m10 = clone(fx); m10.approvalGates.objectUploadTest = false;
  check("mutant 10: object upload test 승인 게이트 누락 → fail",
    detectFixtureIssues(m10).some((i) => i.includes("objectUploadTest")));
  const m11 = clone(fx); m11.approvalGates.liveLivenessCheck = false;
  check("mutant 11: live liveness 승인 게이트 누락 → fail",
    detectFixtureIssues(m11).some((i) => i.includes("liveLivenessCheck")));
  const m12 = clone(fx); m12.approvalGates.instagramArm = false;
  check("mutant 12: Instagram arm 승인 게이트 누락 → fail",
    detectFixtureIssues(m12).some((i) => i.includes("instagramArm")));
  const m13 = clone(fx); m13.rollback = fx.rollback.filter((t) => !t.includes("revoke token"));
  check("mutant 13: rollback 단계 누락(revoke token) → fail",
    detectFixtureIssues(m13).some((i) => i.includes("rollback")));
  const m14 = clone(fx); m14.forbiddenBehavior = fx.forbiddenBehavior.filter((t) => !t.includes("secret logging"));
  check("mutant 14: secret logging 금지 제거 → fail",
    detectFixtureIssues(m14).some((i) => i.includes("secret logging")));
  const m15 = clone(fx); m15.forbiddenBehavior = fx.forbiddenBehavior.filter((t) => !t.includes("R2 bucket creation") && !t.includes("object upload") && !t.includes("DNS/custom domain change"));
  check("mutant 15: 이 slice에서 bucket/DNS/upload 허용(금지 제거) → fail",
    detectFixtureIssues(m15).some((i) => i.includes("bucket creation") || i.includes("DNS") || i.includes("object upload")));
}

console.log(failures === 0
  ? `\nRESULT: ALL PASS (${passes} checks)`
  : `\nRESULT: ${failures} FAILURE(S) / ${passes + failures} checks`);
process.exit(failures === 0 ? 0 : 1);
