#!/usr/bin/env node
/**
 * check-vercel-blob-env-token-write-or-pull-result-static.mjs
 *
 * Vercel Blob env/token (write-or-pull) 결과 정적 가드 (no-secret / no-live).
 * task: vercel-blob-env-token-write-or-pull-v1
 *
 * 이 가드 자체는 no-live다: 레포 내 result fixture JSON + docs + presence checker 소스만 읽는다.
 * (network/env/secret/CLI/subprocess/write 없음)
 *
 * 검증:
 *  1) fixture: storeId/access 고정, store→project 연결이 BLOCKED이고 mutation 0,
 *     token presence는 allowlisted key만 읽어 redacted로 확인(값 print/hash/copy/record 전부 false),
 *     secret 미기록, env write/broad pull 0, upload/put/liveness/api/deploy 0,
 *     rw-token/token flag 미사용, externalMutation false.
 *  2) presence checker 소스: BLOB_READ_WRITE_TOKEN presence만 보고,
 *     값/length/prefix/suffix/hash를 노출하는 패턴이 없어야 함.
 *  3) docs: BLOCKED 사유 / redacted presence / secret 미기록 / 다음 게이트 명시.
 *  4) mutant → 전부 fail.
 */
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const SELF = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SELF), "..");
const J = (a, b) => a + b; // 토큰 분할-연결 (self-scan denylist 예외, 검색 전용)

const FIXTURE_PATH = path.join(ROOT, "scripts", "fixtures", "vercel_blob_env_token_write_or_pull_result.v1.json");
const DOCS_PATH = path.join(ROOT, "docs", "vercel-blob-env-token-write-or-pull-result.md");
const CHECKER_PATH = path.join(ROOT, "scripts", "check-vercel-blob-token-presence-redacted.mjs");

const ALLOWED_STATUS = new Set([
  "STORE_LINK_BLOCKED_TOKEN_ABSENT_VERIFIED_REDACTED",
  "STORE_ALREADY_CONNECTED_TOKEN_PRESENT_VERIFIED_REDACTED",
  "STORE_NEWLY_CONNECTED_TOKEN_PRESENT_VERIFIED_REDACTED",
  "BLOCKED_VERCEL_BLOB_EXISTING_STORE_LINK_METHOD_UNAVAILABLE",
]);
const ZERO_COUNT_FIELDS = [
  "storeLinkAttemptCount",
  "connectionMutationCount",
  "newStoreCreatedCount",
  "envWriteCount",
  "envAddCount",
  "envRmCount",
  "broadEnvPullCount",
  "blobObjectUploadCount",
  "blobPutCount",
  "publicUrlLivenessCheckCount",
  "instagramApiCallCount",
  "youtubeApiCallCount",
  "deployCount",
  "dependencyChangeCount",
];

let passes = 0;
let failures = 0;
function check(name, ok, detail) {
  if (ok) { passes += 1; console.log(`PASS  ${name}`); }
  else { failures += 1; console.error(`FAIL  ${name}${detail ? " — " + detail : ""}`); }
}
const clone = (o) => JSON.parse(JSON.stringify(o));

function hasSecretLiteral(obj) {
  const s = typeof obj === "string" ? obj : JSON.stringify(obj ?? {});
  if (/vercel_blob_rw_[A-Za-z0-9]{6,}/.test(s)) return true;
  if (/BLOB_READ_WRITE_TOKEN\s*[:=]\s*["']?[A-Za-z0-9_]{12,}/.test(s)) return true;
  return false;
}

// ── 로드 ─────────────────────────────────────────────────────────────────────
let fx = null;
try {
  fx = JSON.parse(readFileSync(FIXTURE_PATH, "utf8"));
  check("env/token result fixture parses as JSON", true);
} catch (e) {
  check("env/token result fixture parses as JSON", false, String(e).slice(0, 160));
}
let docs = null, checker = null;
try { docs = readFileSync(DOCS_PATH, "utf8"); check("docs readable", true); }
catch (e) { check("docs readable", false, String(e).slice(0, 120)); }
try { checker = readFileSync(CHECKER_PATH, "utf8"); check("token presence checker readable", true); }
catch (e) { check("token presence checker readable", false, String(e).slice(0, 120)); }

// ── fixture 불변식 (mutant 재사용) ────────────────────────────────────────────
function detectFixtureIssues(p) {
  const issues = [];
  if (!p) return ["fixture null"];

  if (p.taskId !== "vercel-blob-env-token-write-or-pull-v1") issues.push(`taskId=${p.taskId}`);
  if (p.approvalToken !== "APPROVE_VERCEL_BLOB_ENV_TOKEN_WRITE_OR_PULL") issues.push(`approvalToken=${p.approvalToken}`);
  if (!ALLOWED_STATUS.has(p.status)) issues.push(`status=${p.status} (허용 집합 밖)`);

  if (p.storeId !== "store_NyZYiaz51y6acaCQ") issues.push(`storeId=${p.storeId} (drift)`);
  if (p.storeAccess !== "public") issues.push(`storeAccess=${p.storeAccess} (public 아님)`);

  // 연결 상태 일관성: BLOCKED outcome이면 connected=false + mutation 0
  const blocked = p.storeLinkOutcome === "BLOCKED_VERCEL_BLOB_EXISTING_STORE_LINK_METHOD_UNAVAILABLE";
  if (blocked) {
    if (p.storeConnectedToProject !== false)
      issues.push("storeLinkOutcome BLOCKED인데 storeConnectedToProject != false (불일치)");
    if (p.storeLinkMethodAvailable !== false)
      issues.push("storeLinkOutcome BLOCKED인데 storeLinkMethodAvailable != false");
  }
  // connected=true라고 주장하면 mutation 또는 이미-연결 근거가 있어야 함(이 slice에서는 BLOCKED가 정상)
  if (p.storeConnectedToProject === true && p.connectionMutationCount === 0 &&
      p.status === "BLOCKED_VERCEL_BLOB_EXISTING_STORE_LINK_METHOD_UNAVAILABLE")
    issues.push("connected=true인데 status는 BLOCKED (불일치)");

  // token presence는 allowlisted key만 읽어 redacted로 확인하고, 값 출력/기록/해시/복사는 금지
  if (p.blobReadWriteTokenName !== "BLOB_READ_WRITE_TOKEN") issues.push(`blobReadWriteTokenName=${p.blobReadWriteTokenName}`);
  if (p.tokenPresenceVerifiedRedacted !== true) issues.push("tokenPresenceVerifiedRedacted != true");
  if (p.allowlistedTokenKeyReadForPresenceOnly !== true) issues.push("allowlistedTokenKeyReadForPresenceOnly != true");
  if (p.tokenValuePrinted !== false) issues.push("tokenValuePrinted != false");
  if (p.tokenValueHashed !== false) issues.push("tokenValueHashed != false");
  if (p.tokenValueCopied !== false) issues.push("tokenValueCopied != false");
  if (p.tokenValueRecorded !== false) issues.push("tokenValueRecorded != false");
  if (p.secretValueRecorded !== false) issues.push("secretValueRecorded != false");

  // env 안전
  if (p.envLocalCreatedOrModified !== false) issues.push("envLocalCreatedOrModified != false");
  if (p.envRunUsedNoFileWrite !== true) issues.push("envRunUsedNoFileWrite != true");

  // flag 미사용
  if (p.rwTokenFlagUsed !== false) issues.push("rwTokenFlagUsed != false");
  if (p.tokenFlagUsed !== false) issues.push("tokenFlagUsed != false");

  // externalMutation: 이 slice(BLOCKED)에서는 false
  if (blocked && p.externalMutationOccurred !== false)
    issues.push("BLOCKED인데 externalMutationOccurred != false");

  // zero-count 필드
  for (const k of ZERO_COUNT_FIELDS) {
    if (p[k] !== 0) issues.push(`${k}=${p[k]} (0 아님)`);
  }

  if (!Array.isArray(p.prohibitedDrift?.cases) || p.prohibitedDrift.cases.length < 8)
    issues.push("prohibitedDrift.cases 부족(8개 미만)");

  return issues;
}

// ── 1. fixture ───────────────────────────────────────────────────────────────
{
  check("fixture schemaVersion 고정",
    fx?.schemaVersion === "vercel_blob_env_token_write_or_pull_result_v1");
  const issues = detectFixtureIssues(fx);
  check("fixture invariants: storeId/access 고정, BLOCKED+connected false+mutation 0, token redacted(allowlisted key only, 값 print/hash/copy/record false), secret 미기록, env write/pull 0, upload/put/liveness/api/deploy 0, rw-token/token flag 미사용",
    issues.length === 0, issues.join("; "));
  check("fixture refs 실재 (docs/provisioning/integration/checker)",
    ["docsRef", "provisioningResultRef", "integrationResultRef", "tokenPresenceCheckerRef"].every(
      (k) => typeof fx?.[k] === "string" && existsSync(path.join(ROOT, fx[k]))));
  check("fixture 전체에 secret-like 리터럴 미포함", !hasSecretLiteral(fx));
  check("fixture blobReadWriteTokenPresent가 boolean",
    typeof fx?.blobReadWriteTokenPresent === "boolean");
}

// ── 2. presence checker 소스 정적 검증 ────────────────────────────────────────
{
  check("checker: BLOB_READ_WRITE_TOKEN presence만 참조",
    checker?.includes("BLOB_READ_WRITE_TOKEN") && checker?.includes("present"));
  check("checker: valueRedacted 선언 + REDACTED 계약 주석",
    checker?.includes("valueRedacted") && checker?.includes("REDACTED"));
  // 값 노출로 이어질 수 있는 패턴 금지: .length / slice / substring / substr / hash / digest 를 토큰 값에 적용
  const leakPatterns = [
    /process\.env\[[^\]]*\]\.length/,
    /process\.env\[[^\]]*\]\.slice/,
    /process\.env\[[^\]]*\]\.substr/,
    /createHash/,
    /\.digest\(/,
  ];
  const leak = leakPatterns.find((re) => checker && re.test(checker));
  check("checker: 토큰 값 노출 패턴 없음 (length/slice/substr/hash/digest)", !leak, leak ? String(leak) : "");
  check("checker 소스에 secret-like 리터럴 미포함", !hasSecretLiteral(checker ?? ""));
}

// ── 3. docs ──────────────────────────────────────────────────────────────────
{
  check("docs: store→project 연결 BLOCKED 사유(전용 subcommand 부재) 명시",
    docs?.includes("BLOCKED") && (docs?.includes("subcommand") || docs?.includes("connect")) &&
    docs?.includes("store_NyZYiaz51y6acaCQ"));
  check("docs: BLOB_READ_WRITE_TOKEN redacted presence(없음) 명시",
    docs?.includes("BLOB_READ_WRITE_TOKEN") && docs?.includes("redacted") &&
    (docs?.includes("present:false") || docs?.includes("없음") || docs?.includes("absent")));
  check("docs: allowlisted key presence-only + secret/token 값 미출력/미hash/미copy/미기록 명시",
    docs?.includes("allowlisted") &&
    (docs?.includes("해시") || docs?.includes("hash")) &&
    (docs?.includes("복사") || docs?.includes("copy")) &&
    (docs?.includes("기록") || docs?.includes("record")));
  check("docs: --rw-token/--token 미사용 + 새 store 미생성 명시",
    docs?.includes("--rw-token") && docs?.includes("--token") &&
    (docs?.includes("새 store 생성 없") || docs?.includes("새 store 미생성")));
  check("docs: 다음 승인 게이트(object upload test/liveness/arm) 명시",
    docs?.includes("APPROVE_VERCEL_BLOB_OBJECT_UPLOAD_TEST") && docs?.includes("APPROVE_INSTAGRAM_ARM"));
  check("docs 전체에 secret-like 리터럴 미포함", !hasSecretLiteral(docs ?? ""));
}

// ── 4. 가드 self 스캔 ────────────────────────────────────────────────────────
{
  const selfSrc = readFileSync(SELF, "utf8");
  const liveTokens = [J("fet", "ch("), J("child_", "process"), J("spawn", "("),
    J("exec", "Sync("), J("write", "FileSync"), J("mkdir", "Sync"), J("rm", "Sync"),
    J("XMLHttp", "Request"), J("vercel ", "env pull into")];
  const hit = liveTokens.find((t) => selfSrc.includes(t));
  check("guard 자체에 live/write 패턴 없음 (self-scan)", !hit, hit ? `token=${hit}` : "");
  const specifiers = [...selfSrc.matchAll(/^import\s[^\n]*?from\s+["']([^"']+)["']/gm)].map((m) => m[1]);
  const allow = new Set(["node:fs", "node:path", "node:url"]);
  check("guard imports restricted to node:fs/node:path/node:url",
    specifiers.length > 0 && specifiers.every((sp) => allow.has(sp)));
  console.log("NOTE  scanner holds forbidden tokens split-concatenated only (denylist exception)");
}

// ── 5. mutant — fail-closed ──────────────────────────────────────────────────
{
  const m1 = clone(fx); m1.storeConnectedToProject = true;
  check("mutant 1: BLOCKED인데 connected=true (불일치) → fail",
    detectFixtureIssues(m1).some((i) => i.includes("storeConnectedToProject") || i.includes("불일치")));

  const m2 = clone(fx); m2.connectionMutationCount = 1;
  check("mutant 2: connectionMutationCount>0 → fail",
    detectFixtureIssues(m2).some((i) => i.includes("connectionMutationCount")));

  const m3 = clone(fx); m3.newStoreCreatedCount = 1;
  check("mutant 3: newStoreCreatedCount>0 (새 store 생성) → fail",
    detectFixtureIssues(m3).some((i) => i.includes("newStoreCreatedCount")));

  const m4 = clone(fx); m4.allowlistedTokenKeyReadForPresenceOnly = false;
  check("mutant 4: allowlistedTokenKeyReadForPresenceOnly=false → fail",
    detectFixtureIssues(m4).some((i) => i.includes("allowlistedTokenKeyReadForPresenceOnly")));

  const m5 = clone(fx); m5.tokenValueHashed = true;
  check("mutant 5: tokenValueHashed=true → fail",
    detectFixtureIssues(m5).some((i) => i.includes("tokenValueHashed")));

  const m6 = clone(fx); m6.tokenValuePrinted = true;
  check("mutant 6: tokenValuePrinted=true → fail",
    detectFixtureIssues(m6).some((i) => i.includes("tokenValuePrinted")));

  const m7 = clone(fx); m7.secretValueRecorded = true;
  check("mutant 7: secretValueRecorded=true → fail",
    detectFixtureIssues(m7).some((i) => i.includes("secretValueRecorded")));

  const m8 = clone(fx); m8.tokenPresenceVerifiedRedacted = false;
  check("mutant 8: tokenPresenceVerifiedRedacted=false → fail",
    detectFixtureIssues(m8).some((i) => i.includes("tokenPresenceVerifiedRedacted")));

  const m9 = clone(fx); m9.envLocalCreatedOrModified = true;
  check("mutant 9: .env.local 생성/수정 → fail",
    detectFixtureIssues(m9).some((i) => i.includes("envLocalCreatedOrModified")));

  const m10 = clone(fx); m10.broadEnvPullCount = 1;
  check("mutant 10: broad vercel env pull → fail",
    detectFixtureIssues(m10).some((i) => i.includes("broadEnvPullCount")));

  const m11 = clone(fx); m11.blobObjectUploadCount = 1;
  check("mutant 11: blobObjectUploadCount>0 → fail",
    detectFixtureIssues(m11).some((i) => i.includes("blobObjectUploadCount")));

  const m12 = clone(fx); m12.blobPutCount = 1;
  check("mutant 12: blobPutCount>0 → fail",
    detectFixtureIssues(m12).some((i) => i.includes("blobPutCount")));

  const m13 = clone(fx); m13.rwTokenFlagUsed = true;
  check("mutant 13: --rw-token 사용 → fail",
    detectFixtureIssues(m13).some((i) => i.includes("rwTokenFlagUsed")));

  const m14 = clone(fx); m14.tokenFlagUsed = true;
  check("mutant 14: --token 사용 → fail",
    detectFixtureIssues(m14).some((i) => i.includes("tokenFlagUsed")));

  const m15 = clone(fx); m15.storeAccess = "private";
  check("mutant 15: storeAccess private drift → fail",
    detectFixtureIssues(m15).some((i) => i.includes("storeAccess")));

  const m16 = clone(fx); m16.status = "TOKEN_WRITTEN";
  check("mutant 16: status가 허용 집합 밖 → fail",
    detectFixtureIssues(m16).some((i) => i.includes("status=")));

  const m17 = clone(fx); m17.deployCount = 1;
  check("mutant 17: deployCount>0 → fail",
    detectFixtureIssues(m17).some((i) => i.includes("deployCount")));

  const m18 = clone(fx); m18.tokenValueRecorded = true;
  check("mutant 18: tokenValueRecorded=true → fail",
    detectFixtureIssues(m18).some((i) => i.includes("tokenValueRecorded")));

  check("mutant 19: secret-like 리터럴 삽입 → 스캐너 감지",
    hasSecretLiteral({ leak: "vercel_blob_rw_abcdef1234567890XYZ" }));
}

console.log(`\nRESULT: ${failures === 0 ? "ALL PASS" : "FAIL"} (${passes + failures} checks)`);
process.exit(failures === 0 ? 0 : 1);
