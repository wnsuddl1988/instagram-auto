#!/usr/bin/env node
/**
 * check-r2-dns-zone-preflight-report-static.mjs
 *
 * R2 provisioning DNS/zone preflight report — 정적 가드 (read-only, no-mutation).
 * task: r2-provisioning-preflight-dns-zone-check-v1
 *
 * 이 가드 자체는 no-live다: 레포 내 preflight fixture JSON + docs 텍스트만 읽는다.
 * (network/env/secret/upload/subprocess/write 없음)
 *
 * 검증:
 *  1) fixture: domain/customDomain 존재, dnsClassification ∈ allowlist,
 *     evidence(≥ media 대상 포함) 존재, actualProvisioningExecuted=false,
 *     nextRecommendedGate 존재, forbidden behavior(이 slice에서 bucket/token/DNS/env/
 *     deploy/upload/liveness/Instagram 금지) 명문, secret logging 금지
 *  2) docs: 판정/증거/4답/next 액션 명문화
 *  3) mutant(HANDOFF 요구) → 전부 fail
 */
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const SELF = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SELF), "..");
const J = (a, b) => a + b; // 토큰 분할-연결 (self-scan denylist 예외, 검색 전용)

const FIXTURE_PATH = path.join(ROOT, "scripts", "fixtures", "r2_dns_zone_preflight_report.v1.json");
const DOCS_PATH = path.join(ROOT, "docs", "r2-dns-zone-preflight-report.md");

const DOMAIN = "buildgongjakso.com";
const CUSTOM_DOMAIN = "media.buildgongjakso.com";
const ALLOWED_CLASS = [
  "CLOUDFLARE_ZONE_CONFIRMED",
  "PARTIAL_CNAME_SETUP_LIKELY",
  "DNS_PROVIDER_UNCLEAR_OWNER_DASHBOARD_REQUIRED",
  "BLOCKED_NO_SAFE_READONLY_EVIDENCE",
];
const REQUIRED_FORBIDDEN = [
  "R2 bucket creation",
  "R2 token creation",
  "DNS/custom domain change",
  "env/secret write",
  "object upload",
  "public URL liveness",
  "Instagram upload or --arm",
  "secret logging",
  "dependency/lockfile",
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
  check("preflight fixture parses as JSON", true);
} catch (e) {
  check("preflight fixture parses as JSON", false, String(e).slice(0, 160));
}
let docs = null;
try {
  docs = readFileSync(DOCS_PATH, "utf8");
  check("preflight docs readable", true);
} catch (e) {
  check("preflight docs readable", false, String(e).slice(0, 120));
}
if (!fx || !docs) {
  console.error(`\nRESULT: ${failures} FAILURE(S) / ${passes + failures} checks — core artifact unreadable, aborting`);
  process.exit(1);
}

// ── 순수 fixture 검증기 (mutant 재사용) ───────────────────────────────────────
function detectFixtureIssues(p) {
  const issues = [];

  // domain / custom domain
  if (p.domain !== DOMAIN) issues.push(`domain=${p.domain} (buildgongjakso.com 아님 — domain drift/누락)`);
  if (p.customDomain !== CUSTOM_DOMAIN) issues.push(`customDomain=${p.customDomain} (media.buildgongjakso.com 아님 — custom domain 누락)`);

  // classification: 존재 + allowlist 내
  if (!isStr(p.dnsClassification)) issues.push("dnsClassification 누락");
  else if (!ALLOWED_CLASS.includes(p.dnsClassification)) issues.push(`dnsClassification=${p.dnsClassification} (allowlist 밖)`);

  // evidence: 배열 + 최소 1건 이상 + custom domain 대상 증거 포함 + read-only 표기
  const ev = Array.isArray(p.evidence) ? p.evidence : [];
  if (ev.length < 3) issues.push(`evidence ${ev.length}건 (증거 부족)`);
  if (!ev.some((e) => e && e.target === CUSTOM_DOMAIN)) issues.push("evidence에 media.buildgongjakso.com 대상 없음");
  if (!ev.some((e) => e && e.target === DOMAIN)) issues.push("evidence에 buildgongjakso.com 대상 없음");
  if (ev.some((e) => e && e.readOnly !== true)) issues.push("evidence 항목 중 readOnly != true (read-only 경계 위반)");

  // 실제 provisioning 미수행 (no-live)
  if (p.actualProvisioningExecuted !== false) issues.push("actualProvisioningExecuted != false (provisioning 수행됨)");
  if (p.noLiveThisSlice !== true) issues.push("noLiveThisSlice != true");

  // next recommended gate
  if (!isStr(p.nextRecommendedGate)) issues.push("nextRecommendedGate 누락 (다음 승인 게이트 없음)");

  // read-only boundary: 핵심 flag
  const rb = p.readOnlyBoundary ?? {};
  for (const f of ["noCloudflareLogin", "noCloudflareMutation", "noSecretRead", "noGeneratedMp4LivenessCheck"]) {
    if (rb[f] !== true) issues.push(`readOnlyBoundary.${f} != true`);
  }

  // forbidden behavior: 이 slice에서 bucket/token/DNS/env/upload/liveness/Instagram/secret logging/dep 금지
  const fb = (p.forbiddenBehavior ?? []).join(" | ");
  for (const t of REQUIRED_FORBIDDEN) {
    if (!fb.includes(t)) issues.push(`forbiddenBehavior에 '${t}' 누락`);
  }

  return issues;
}

// ── 1. fixture 검증 ──────────────────────────────────────────────────────────
{
  check("fixture schemaVersion + taskId + status",
    fx.schemaVersion === "r2_dns_zone_preflight_report_v1" &&
    fx.taskId === "r2-provisioning-preflight-dns-zone-check-v1" &&
    fx.status === "R2_DNS_ZONE_PREFLIGHT_READONLY");
  const issues = detectFixtureIssues(fx);
  check("fixture invariants: domain·customDomain·classification(allowlist)·evidence(readOnly)·noLive·nextGate·forbidden",
    issues.length === 0, issues.join("; "));
  check("fixture docsRef + approvalPacketRef + strategyRef 실재",
    isStr(fx.docsRef) && existsSync(path.join(ROOT, fx.docsRef)) &&
    isStr(fx.approvalPacketRef) && existsSync(path.join(ROOT, fx.approvalPacketRef)) &&
    isStr(fx.strategyRef) && existsSync(path.join(ROOT, fx.strategyRef)));
  check("fixture answers 4종(isCloudflareZone/partialCnameLikely/dnsRecordLocation/safeToProceed) 존재",
    fx.answers && typeof fx.answers.isCloudflareZone === "boolean" &&
    typeof fx.answers.partialCnameLikely === "boolean" &&
    isStr(fx.answers.dnsRecordLocation) && isStr(fx.answers.safeToProceedToProvisioning));
  check("fixture dnsClassificationAllowed = 4종 allowlist 그대로 보존",
    Array.isArray(fx.dnsClassificationAllowed) &&
    ALLOWED_CLASS.every((c) => fx.dnsClassificationAllowed.includes(c)));
}

// ── 2. docs 검증 ─────────────────────────────────────────────────────────────
{
  check("docs: domain + custom domain 명시",
    docs.includes(DOMAIN) && docs.includes(CUSTOM_DOMAIN));
  check("docs: classification(PARTIAL_CNAME_SETUP_LIKELY 등 allowlist) 명문화",
    ALLOWED_CLASS.some((c) => docs.includes(c)));
  check("docs: NS/gabia + Vercel + NXDOMAIN 증거 명문화",
    docs.includes("gabia") && (docs.includes("Vercel") || docs.includes("vercel")) &&
    (docs.includes("NXDOMAIN") || docs.includes("Non-existent")));
  check("docs: Owner 4질문 답(Cloudflare zone/partial CNAME/DNS 위치/proceed) 명문화",
    docs.includes("Cloudflare zone") && docs.includes("partial CNAME") &&
    docs.includes("DNS record"));
  check("docs: 다음 권장 승인(APPROVE_R2_DNS_CUSTOM_DOMAIN) 명문화",
    docs.includes("APPROVE_R2_DNS_CUSTOM_DOMAIN"));
  check("docs: read-only / no provisioning 경계 명문화",
    (docs.includes("read-only") || docs.includes("Read-Only")) &&
    docs.includes("provisioning"));
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
  const m1 = clone(fx); delete m1.domain;
  check("mutant 1: domain 누락 → fail",
    detectFixtureIssues(m1).some((i) => i.includes("domain")));
  const m2 = clone(fx); delete m2.customDomain;
  check("mutant 2: custom domain 누락 → fail",
    detectFixtureIssues(m2).some((i) => i.includes("custom domain 누락") || i.includes("customDomain")));
  const m3 = clone(fx); delete m3.dnsClassification;
  check("mutant 3: classification 누락 → fail",
    detectFixtureIssues(m3).some((i) => i.includes("dnsClassification 누락")));
  const m4 = clone(fx); m4.dnsClassification = "SOMETHING_ELSE";
  check("mutant 4: classification allowlist 밖 → fail",
    detectFixtureIssues(m4).some((i) => i.includes("allowlist 밖")));
  const m5 = clone(fx); m5.evidence = [];
  check("mutant 5: evidence 누락 → fail",
    detectFixtureIssues(m5).some((i) => i.includes("evidence")));
  const m6 = clone(fx); m6.actualProvisioningExecuted = true;
  check("mutant 6: actualProvisioningExecuted=true (provisioning 수행 주장) → fail",
    detectFixtureIssues(m6).some((i) => i.includes("actualProvisioningExecuted")));
  const m7 = clone(fx); delete m7.nextRecommendedGate;
  check("mutant 7: next recommended gate 누락 → fail",
    detectFixtureIssues(m7).some((i) => i.includes("nextRecommendedGate")));
  const m8 = clone(fx);
  m8.forbiddenBehavior = fx.forbiddenBehavior.filter(
    (t) => !t.includes("R2 bucket creation") && !t.includes("R2 token creation") &&
      !t.includes("DNS/custom domain change") && !t.includes("env/secret write") &&
      !t.includes("object upload") && !t.includes("public URL liveness") &&
      !t.includes("Instagram upload or --arm"));
  check("mutant 8: 이 slice에서 bucket/token/DNS/env/upload/liveness/Instagram 허용(금지 제거) → fail",
    detectFixtureIssues(m8).some((i) => i.includes("forbiddenBehavior")));
  const m9 = clone(fx); m9.forbiddenBehavior = fx.forbiddenBehavior.filter((t) => !t.includes("secret logging"));
  check("mutant 9: secret logging 금지 제거 → fail",
    detectFixtureIssues(m9).some((i) => i.includes("secret logging")));
  const m10 = clone(fx); m10.readOnlyBoundary = { ...fx.readOnlyBoundary, noSecretRead: false };
  check("mutant 10: read-only 경계에서 secret read 허용 → fail",
    detectFixtureIssues(m10).some((i) => i.includes("noSecretRead")));
  const m11 = clone(fx); m11.evidence = fx.evidence.map((e) => ({ ...e, readOnly: false }));
  check("mutant 11: evidence read-only 표기 제거 → fail",
    detectFixtureIssues(m11).some((i) => i.includes("readOnly")));
}

console.log(failures === 0
  ? `\nRESULT: ALL PASS (${passes} checks)`
  : `\nRESULT: ${failures} FAILURE(S) / ${passes + failures} checks`);
process.exit(failures === 0 ? 0 : 1);
