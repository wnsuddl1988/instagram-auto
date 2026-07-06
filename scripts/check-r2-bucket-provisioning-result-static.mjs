#!/usr/bin/env node
/**
 * check-r2-bucket-provisioning-result-static.mjs
 *
 * R2 bucket provisioning result — 정적 가드 (no-live, no-secret).
 * task: r2-bucket-provisioning-only-v1
 *
 * 이 가드 자체는 no-live다: 레포 내 result fixture JSON + docs 텍스트만 읽는다.
 * (network/env/secret/upload/subprocess/write 없음)
 *
 * 검증:
 *  1) fixture: approval/provider/bucketName 고정, status ∈ allowlist,
 *     blocked면 blockerCode 존재, externalMutationOccurred=false(생성/기존확인 아닌 한),
 *     forbiddenExternalMutations 명문(token/env/DNS/custom domain/upload/liveness/Instagram/dep/commit),
 *     secretHandling 전부 미열람, secret 형태 문자열 미포함, checkpoint/approval 존재
 *  2) docs: bucket name/status/증거/금지/다음 승인 명문화
 *  3) mutant → 전부 fail
 */
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const SELF = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SELF), "..");
const J = (a, b) => a + b; // 토큰 분할-연결 (self-scan denylist 예외, 검색 전용)

const FIXTURE_PATH = path.join(ROOT, "scripts", "fixtures", "r2_bucket_provisioning_result.v1.json");
const DOCS_PATH = path.join(ROOT, "docs", "r2-bucket-provisioning-result.md");

const APPROVAL = "APPROVE_R2_BUCKET_PROVISIONING_ONLY";
const PROVIDER = "cloudflare_r2";
const BUCKET = "buildgongjakso-media";
const STATUS_ALLOWED = [
  "CREATED_BUCKET",
  "ALREADY_EXISTS_NO_MUTATION",
  "BLOCKED_CLOUDFLARE_AUTH_REQUIRED",
  "BLOCKED_CLOUDFLARE_TOOL_UNAVAILABLE",
  "BLOCKED_SCOPE_EXPANSION_REQUIRED",
  "BLOCKED_SECRET_OR_ENV_REQUIRED",
  "BLOCKED_COST_OR_PLAN_CONFIRMATION_REQUIRED",
  "BLOCKED_ACCOUNT_IDENTITY_UNCLEAR",
];
const REQUIRED_FORBIDDEN = [
  "R2 API token",
  "env/secret read/write",
  "DNS/custom domain",
  "object upload",
  "public URL liveness",
  "Instagram upload or --arm",
  "dependency/lockfile",
  "commit/push",
];
// result 증거에 절대 나타나선 안 되는 secret-형태 토큰(대문자 env 키 리터럴 값 등)
const SECRETISH = [
  J("R2_SECRET", "_ACCESS_KEY="), J("CLOUDFLARE_API", "_TOKEN="),
  J("R2_ACCESS", "_KEY_ID="), J("Bearer ", "eyJ"),
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
  check("bucket result fixture parses as JSON", true);
} catch (e) {
  check("bucket result fixture parses as JSON", false, String(e).slice(0, 160));
}
let docs = null;
try {
  docs = readFileSync(DOCS_PATH, "utf8");
  check("bucket result docs readable", true);
} catch (e) {
  check("bucket result docs readable", false, String(e).slice(0, 120));
}
if (!fx || !docs) {
  console.error(`\nRESULT: ${failures} FAILURE(S) / ${passes + failures} checks — core artifact unreadable, aborting`);
  process.exit(1);
}

// ── 순수 fixture 검증기 (mutant 재사용) ───────────────────────────────────────
function detectFixtureIssues(p) {
  const issues = [];

  // approval / provider / bucket name 고정
  if (p.approval !== APPROVAL) issues.push(`approval=${p.approval} (APPROVE_R2_BUCKET_PROVISIONING_ONLY 아님)`);
  if (p.provider !== PROVIDER) issues.push(`provider=${p.provider} (cloudflare_r2 아님)`);
  if (p.bucketName !== BUCKET) issues.push(`bucketName=${p.bucketName} (buildgongjakso-media 아님 — bucket 이름 drift)`);
  if (!isStr(p.checkpointAccepted)) issues.push("checkpointAccepted 누락 (현 승인 checkpoint 없음)");

  // status: 존재 + allowlist 내 (vocabulary 확장 방지)
  if (!isStr(p.status)) issues.push("status 누락");
  else if (!STATUS_ALLOWED.includes(p.status)) issues.push(`status=${p.status} (allowlist 밖 — status vocabulary 확장)`);

  // blocked면 blockerCode 필요 + externalMutationOccurred=false 강제
  const isBlocked = isStr(p.status) && p.status.startsWith("BLOCKED_");
  if (isBlocked) {
    if (!isStr(p.blockerCode)) issues.push("status가 BLOCKED_인데 blockerCode 누락");
    else if (p.blockerCode !== p.status) issues.push("blockerCode가 status와 불일치");
    if (p.externalMutationOccurred !== false) issues.push("BLOCKED인데 externalMutationOccurred != false (금지: 우회 mutation)");
  }
  // CREATED가 아니면 mutation 발생은 있을 수 없음(ALREADY_EXISTS도 no-mutation)
  if (p.status !== "CREATED_BUCKET" && p.externalMutationOccurred === true) {
    issues.push(`status=${p.status}인데 externalMutationOccurred=true (비생성 status에서 mutation 주장)`);
  }

  // allowedExternalMutation은 bucket 생성 1건으로 한정, DNS/token/env/upload 확장 금지
  const aem = isStr(p.allowedExternalMutation) ? p.allowedExternalMutation : "";
  if (!aem.includes("buildgongjakso-media")) issues.push("allowedExternalMutation에 bucket 이름 없음");
  for (const bad of ["custom domain", "DNS", "token", "env", "upload", "public access"]) {
    // "no custom domain" 처럼 부정 문맥은 허용, 단독 허용 표현만 잡기 위해 'no '가 앞에 없을 때만
    const re = new RegExp(`(^|[^o]|[^n]o )${bad}`, "i");
    if (re.test(aem) && !new RegExp(`no ${bad}`, "i").test(aem)) {
      issues.push(`allowedExternalMutation이 '${bad}' 확장 허용 의심`);
    }
  }

  // forbidden external mutations 명문
  const fb = Array.isArray(p.forbiddenExternalMutations) ? p.forbiddenExternalMutations.join(" | ") : "";
  for (const t of REQUIRED_FORBIDDEN) {
    if (!fb.includes(t)) issues.push(`forbiddenExternalMutations에 '${t}' 누락`);
  }

  // secretHandling: 전부 미열람
  const sh = p.secretHandling ?? {};
  for (const f of ["secretsRead", "secretsWritten", "secretsPrinted", "envLocalAccessed", "cloudflareApiTokenAccessed"]) {
    if (sh[f] !== false) issues.push(`secretHandling.${f} != false (secret 취급 위반)`);
  }

  // evidenceSummary + nextApprovalRequired 존재
  if (!Array.isArray(p.evidenceSummary) || p.evidenceSummary.length < 1) issues.push("evidenceSummary 누락");
  if (!isStr(p.nextApprovalRequired)) issues.push("nextApprovalRequired 누락");

  // fixture 전체에 secret-형태 리터럴 미포함
  const whole = JSON.stringify(p);
  for (const s of SECRETISH) {
    if (whole.includes(s)) issues.push(`result에 secret-형태 값 포함 의심: ${s.slice(0, 12)}…`);
  }

  return issues;
}

// ── 1. fixture 검증 ──────────────────────────────────────────────────────────
{
  check("fixture schemaVersion + taskId",
    fx.schemaVersion === "r2_bucket_provisioning_result_v1" &&
    fx.taskId === "r2-bucket-provisioning-only-v1");
  const issues = detectFixtureIssues(fx);
  check("fixture invariants: approval/provider/bucket 고정·status(allowlist)·blocker·no-mutation·forbidden·secretHandling·no-secret",
    issues.length === 0, issues.join("; "));
  check("fixture statusAllowed = 8종 vocabulary 그대로 보존",
    Array.isArray(fx.statusAllowed) && STATUS_ALLOWED.every((s) => fx.statusAllowed.includes(s)) &&
    fx.statusAllowed.length === STATUS_ALLOWED.length);
  check("fixture docsRef + preflightRef + approvalPacketRef 실재",
    isStr(fx.docsRef) && existsSync(path.join(ROOT, fx.docsRef)) &&
    isStr(fx.preflightRef) && existsSync(path.join(ROOT, fx.preflightRef)) &&
    isStr(fx.approvalPacketRef) && existsSync(path.join(ROOT, fx.approvalPacketRef)));
}

// ── 2. docs 검증 ─────────────────────────────────────────────────────────────
{
  check("docs: bucket name + provider 명시",
    docs.includes(BUCKET) && docs.includes("R2"));
  check("docs: status(현재 결과) 명문화",
    STATUS_ALLOWED.some((s) => docs.includes(s)));
  check("docs: read-only 증거(wrangler/~/.wrangler) 명문화",
    docs.includes("wrangler") && docs.includes(".wrangler"));
  check("docs: 금지 작업 미수행 확인 명문화",
    docs.includes("미수행") &&
    docs.includes("token") && docs.includes("DNS") && docs.includes("upload"));
  check("docs: 다음 Owner 승인/액션 명문화",
    docs.includes("Owner") && (docs.includes("wrangler login") || docs.includes("대시보드")));
  check("docs: 우회 안 함 근거(각 우회가 별도 금지) 명문화",
    docs.includes("우회") &&
    docs.includes("dependency") && docs.includes("secret"));
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
  const m1 = clone(fx); m1.bucketName = "some-other-bucket";
  check("mutant 1: bucket 이름 변경 → fail",
    detectFixtureIssues(m1).some((i) => i.includes("bucket 이름 drift")));
  const m2 = clone(fx); m2.status = "CREATED_ANYTHING";
  check("mutant 2: status vocabulary 확장(allowlist 밖) → fail",
    detectFixtureIssues(m2).some((i) => i.includes("vocabulary 확장")));
  const m3 = clone(fx); m3.status = "BLOCKED_CLOUDFLARE_TOOL_UNAVAILABLE"; delete m3.blockerCode;
  check("mutant 3: BLOCKED인데 blockerCode 누락 → fail",
    detectFixtureIssues(m3).some((i) => i.includes("blockerCode 누락")));
  const m4 = clone(fx); m4.externalMutationOccurred = true;
  check("mutant 4: BLOCKED status에서 external mutation 발생 주장 → fail",
    detectFixtureIssues(m4).some((i) => i.includes("externalMutationOccurred")));
  const m5 = clone(fx); m5.forbiddenExternalMutations = fx.forbiddenExternalMutations.filter((t) => !t.includes("R2 API token"));
  check("mutant 5: token 생성 금지 제거 → fail",
    detectFixtureIssues(m5).some((i) => i.includes("R2 API token")));
  const m6 = clone(fx); m6.forbiddenExternalMutations = fx.forbiddenExternalMutations.filter((t) => !t.includes("DNS/custom domain"));
  check("mutant 6: DNS/custom domain 금지 제거 → fail",
    detectFixtureIssues(m6).some((i) => i.includes("DNS/custom domain")));
  const m7 = clone(fx); m7.forbiddenExternalMutations = fx.forbiddenExternalMutations.filter((t) => !t.includes("object upload") && !t.includes("public URL liveness") && !t.includes("Instagram upload or --arm"));
  check("mutant 7: upload/liveness/Instagram 금지 제거 → fail",
    detectFixtureIssues(m7).some((i) => i.includes("object upload") || i.includes("public URL liveness") || i.includes("Instagram")));
  const m8 = clone(fx); m8.secretHandling = { ...fx.secretHandling, secretsRead: true };
  check("mutant 8: secret read 허용 → fail",
    detectFixtureIssues(m8).some((i) => i.includes("secretsRead")));
  const m9 = clone(fx); m9.secretHandling = { ...fx.secretHandling, cloudflareApiTokenAccessed: true };
  check("mutant 9: Cloudflare API token 접근 허용 → fail",
    detectFixtureIssues(m9).some((i) => i.includes("cloudflareApiTokenAccessed")));
  const m10 = clone(fx); m10.evidenceSummary = [...fx.evidenceSummary, { probe: "leak", result: J("CLOUDFLARE_API", "_TOKEN=") + "abc123def" }];
  check("mutant 10: 증거에 secret-형태 값 삽입 → fail",
    detectFixtureIssues(m10).some((i) => i.includes("secret-형태 값")));
  const m11 = clone(fx); delete m11.checkpointAccepted;
  check("mutant 11: checkpoint 누락 → fail",
    detectFixtureIssues(m11).some((i) => i.includes("checkpointAccepted")));
  const m12 = clone(fx); m12.approval = "APPROVE_EVERYTHING";
  check("mutant 12: approval 문구 변조 → fail",
    detectFixtureIssues(m12).some((i) => i.includes("approval")));
  const m13 = clone(fx); m13.allowedExternalMutation = "create bucket buildgongjakso-media plus custom domain and token and DNS";
  check("mutant 13: allowedExternalMutation이 custom domain/token/DNS 확장 → fail",
    detectFixtureIssues(m13).some((i) => i.includes("확장 허용 의심")));
}

console.log(failures === 0
  ? `\nRESULT: ALL PASS (${passes} checks)`
  : `\nRESULT: ${failures} FAILURE(S) / ${passes + failures} checks`);
process.exit(failures === 0 ? 0 : 1);
