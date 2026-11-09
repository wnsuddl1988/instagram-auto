#!/usr/bin/env node
/**
 * check-vercel-blob-store-provisioning-result-static.mjs
 *
 * Vercel Blob store provisioning 결과 정적 가드 (no-secret / no-live).
 * task: vercel-blob-store-provisioning-v1
 *
 * 이 가드 자체는 no-live다: 레포 내 provisioning result fixture JSON + docs 텍스트만 읽는다.
 * (network/env/secret/CLI/subprocess/write 없음)
 *
 * 검증:
 *  1) fixture: taskId/approvalToken/storeName/accessMode 고정,
 *     status ∈ 허용 집합,
 *     externalMutationOccurred는 store 생성 시에만 true,
 *     storeCreationAttemptCount ∈ {0,1}, storeCreatedCount ∈ {0,1},
 *     blobObjectUploadCount/envSecretAccessCount/dependencyChangeCount/deployCount/
 *       instagramApiCallCount/youtubeApiCallCount/projectConnectionCount/publicUrlLivenessCheckCount = 0,
 *     connectedToProject=false (이 slice는 link 금지),
 *     secretValueRecorded=false, tokenValueRecorded=false,
 *     forbiddenFlagsUsed 전부 false, safetyBoundaries 전부 true,
 *     token/secret literal 미기록.
 *  2) docs: store 결과 요약 / link prompt 미응답 / side effects 0 / 다음 게이트 명시.
 *  3) mutant → 전부 fail (private accessMode, storeName drift, invalid status,
 *     count>0 위반, connectedToProject=true, secret 값 기록, forbidden flag 사용,
 *     mutation-status 불일치).
 */
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const SELF = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SELF), "..");
const J = (a, b) => a + b; // 토큰 분할-연결 (self-scan denylist 예외, 검색 전용)

const FIXTURE_PATH = path.join(ROOT, "scripts", "fixtures", "vercel_blob_store_provisioning_result.v1.json");
const DOCS_PATH = path.join(ROOT, "docs", "vercel-blob-store-provisioning-result.md");

const ALLOWED_STATUS = new Set([
  "PROVISIONED",
  "ALREADY_EXISTS",
  "BLOCKED_VERCEL_AUTH_OR_INTERACTIVE_REQUIRED",
  "BLOCKED_VERCEL_CLI_UNAVAILABLE",
  "BLOCKED_UNSAFE_OR_AMBIGUOUS_CONTEXT",
  "BLOCKED_VERCEL_STORE_CONNECTION_OR_ENV_WRITE_REQUIRED",
]);
// externalMutation(=store 실제 생성)을 허용하는 status는 PROVISIONED 뿐.
const MUTATION_ALLOWED_STATUS = new Set(["PROVISIONED"]);
const ZERO_COUNT_FIELDS = [
  "blobObjectUploadCount",
  "publicUrlLivenessCheckCount",
  "envSecretAccessCount",
  "projectConnectionCount",
  "dependencyChangeCount",
  "deployCount",
  "instagramApiCallCount",
  "youtubeApiCallCount",
];
const SAFETY_KEYS = [
  "noYesFlag", "noEnvironmentFlag", "noTokenFlag", "noRwTokenFlag",
  "noVercelEnvPull", "noEnvLocalAccess", "noBlobReadWriteTokenValueAccess",
  "noShellEnvInspection", "noPrivateStore", "onlyOneStoreCreated", "noProjectLink",
];

let passes = 0;
let failures = 0;
function check(name, ok, detail) {
  if (ok) { passes += 1; console.log(`PASS  ${name}`); }
  else { failures += 1; console.error(`FAIL  ${name}${detail ? " — " + detail : ""}`); }
}
const clone = (o) => JSON.parse(JSON.stringify(o));

// ── 로드 ─────────────────────────────────────────────────────────────────────
let fx = null;
try {
  fx = JSON.parse(readFileSync(FIXTURE_PATH, "utf8"));
  check("provisioning result fixture parses as JSON", true);
} catch (e) {
  check("provisioning result fixture parses as JSON", false, String(e).slice(0, 160));
}
let docs = null;
try {
  docs = readFileSync(DOCS_PATH, "utf8");
  check("provisioning result docs readable", true);
} catch (e) {
  check("provisioning result docs readable", false, String(e).slice(0, 120));
}

// ── fixture 불변식 (mutant 재사용) ────────────────────────────────────────────
function detectFixtureIssues(p) {
  const issues = [];
  if (!p) return ["fixture null"];

  if (p.taskId !== "vercel-blob-store-provisioning-v1") issues.push(`taskId=${p.taskId}`);
  if (p.approvalToken !== "APPROVE_VERCEL_BLOB_STORE_PROVISIONING") issues.push(`approvalToken=${p.approvalToken}`);
  if (p.storeName !== "instagram-auto-instagram-media") issues.push(`storeName=${p.storeName} (drift)`);
  if (p.accessMode !== "public") issues.push(`accessMode=${p.accessMode} (public 아님 — private drift)`);

  if (!ALLOWED_STATUS.has(p.status)) issues.push(`status=${p.status} (허용 집합 밖)`);

  // externalMutation은 PROVISIONED status에서만 true
  if (p.externalMutationOccurred === true && !MUTATION_ALLOWED_STATUS.has(p.status))
    issues.push(`externalMutationOccurred=true인데 status=${p.status} (mutation-status 불일치)`);
  // PROVISIONED면 실제 생성이 있었어야 함
  if (p.status === "PROVISIONED") {
    if (p.externalMutationOccurred !== true) issues.push("status=PROVISIONED인데 externalMutationOccurred != true");
    if (p.storeCreatedCount !== 1) issues.push(`status=PROVISIONED인데 storeCreatedCount=${p.storeCreatedCount} (1 아님)`);
    if (p.storeCreationAttemptCount !== 1) issues.push(`status=PROVISIONED인데 storeCreationAttemptCount=${p.storeCreationAttemptCount}`);
  }
  // ALREADY_EXISTS면 생성이 없어야 함
  if (p.status === "ALREADY_EXISTS") {
    if (p.externalMutationOccurred !== false) issues.push("status=ALREADY_EXISTS인데 externalMutationOccurred != false");
    if (p.storeCreatedCount !== 0) issues.push(`status=ALREADY_EXISTS인데 storeCreatedCount=${p.storeCreatedCount}`);
  }

  // attempt/created count 범위 {0,1}
  if (![0, 1].includes(p.storeCreationAttemptCount)) issues.push(`storeCreationAttemptCount=${p.storeCreationAttemptCount} (0/1 아님)`);
  if (![0, 1].includes(p.storeCreatedCount)) issues.push(`storeCreatedCount=${p.storeCreatedCount} (0/1 아님)`);

  // zero-count 필드
  for (const k of ZERO_COUNT_FIELDS) {
    if (p[k] !== 0) issues.push(`${k}=${p[k]} (0 아님)`);
  }

  // link/connection 금지
  if (p.connectedToProject !== false) issues.push("connectedToProject != false (이 slice는 project link 금지)");

  // secret/token 미기록
  if (p.secretValueRecorded !== false) issues.push("secretValueRecorded != false");
  if (p.tokenValueRecorded !== false) issues.push("tokenValueRecorded != false");

  // forbidden flags 전부 false
  const ff = p.cliCommands?.forbiddenFlagsUsed ?? {};
  for (const flag of ["--yes", "--environment", "--token", "--rw-token"]) {
    if (ff[flag] !== false) issues.push(`forbiddenFlagsUsed['${flag}'] != false`);
  }

  // safety boundaries 전부 true
  const sb = p.safetyBoundariesHonored ?? {};
  for (const k of SAFETY_KEYS) {
    if (sb[k] !== true) issues.push(`safetyBoundariesHonored.${k} != true`);
  }

  return issues;
}

// secret-like literal 스캐너 (BLOB_READ_WRITE_TOKEN 실제 값 형태)
function hasSecretLiteral(obj) {
  const s = JSON.stringify(obj ?? {});
  if (/vercel_blob_rw_[A-Za-z0-9]{6,}/.test(s)) return true;
  if (/BLOB_READ_WRITE_TOKEN\s*[:=]\s*["']?[A-Za-z0-9_]{12,}/.test(s)) return true;
  return false;
}

// ── 1. fixture 검증 ──────────────────────────────────────────────────────────
{
  check("fixture schemaVersion 고정",
    fx?.schemaVersion === "vercel_blob_store_provisioning_result_v1");
  const issues = detectFixtureIssues(fx);
  check("fixture invariants: taskId/approvalToken/storeName/accessMode=public/status∈허용/mutation-status 일치/count 0 제약/connectedToProject=false/secret 미기록/forbidden flags false/safety true",
    issues.length === 0, issues.join("; "));
  check("fixture docsRef + integrationPacketRef + integrationPacketDocsRef 실재",
    typeof fx?.docsRef === "string" && existsSync(path.join(ROOT, fx.docsRef)) &&
    typeof fx?.integrationPacketRef === "string" && existsSync(path.join(ROOT, fx.integrationPacketRef)) &&
    typeof fx?.integrationPacketDocsRef === "string" && existsSync(path.join(ROOT, fx.integrationPacketDocsRef)));
  check("fixture 전체에 secret-like 토큰 리터럴 미포함",
    !hasSecretLiteral(fx));
  check("fixture accessMode public + storeId 형태(store_ prefix)",
    fx?.accessMode === "public" && typeof fx?.storeId === "string" && fx.storeId.startsWith("store_"));
  check("fixture projectLinkPrompt: prompt 표시됨 + 미응답 기록",
    fx?.projectLinkPromptShown === true && fx?.projectLinkPromptAnswered === false);
}

// ── 2. docs 검증 ─────────────────────────────────────────────────────────────
{
  check("docs: store 결과(이름/ID/public/region) 명시",
    docs?.includes("instagram-auto-instagram-media") && docs?.includes("store_NyZYiaz51y6acaCQ") &&
    docs?.includes("public") && docs?.includes("iad1"));
  check("docs: link prompt 미응답 + Projects '–'(연결 없음) 명시",
    (docs?.includes("link") || docs?.includes("연결")) &&
    (docs?.includes("응답하지 않") || docs?.includes("미응답")) &&
    (docs?.includes("Projects") || docs?.includes("연결 없음")));
  check("docs: --yes/--environment/--token 미사용 명시",
    docs?.includes("--yes") && docs?.includes("--environment") && docs?.includes("--token"));
  check("docs: side effects 0 (object upload/env/secret/deploy) 명시",
    docs?.includes("Side effects") && docs?.includes("0"));
  check("docs: 다음 승인 게이트(env/token write, upload, arm) 명시",
    docs?.includes("APPROVE_VERCEL_BLOB_ENV_TOKEN_WRITE_OR_PULL") &&
    docs?.includes("APPROVE_INSTAGRAM_ARM"));
  check("docs: BLOB_READ_WRITE_TOKEN 값 미접근 명시",
    docs?.includes("BLOB_READ_WRITE_TOKEN") &&
    (docs?.includes("미접근") || docs?.includes("값 미")));
  check("docs 전체에 secret-like 토큰 리터럴 미포함",
    !(docs && /vercel_blob_rw_[A-Za-z0-9]{6,}/.test(docs)));
}

// ── 3. 가드 self 스캔 ────────────────────────────────────────────────────────
{
  const selfSrc = readFileSync(SELF, "utf8");
  const liveTokens = [J("fet", "ch("), J("child_", "process"), J("spawn", "("),
    J("exec", "Sync("), J("write", "FileSync"), J("mkdir", "Sync"), J("rm", "Sync"),
    J("XMLHttp", "Request"), J("vercel ", "env pull")];
  const hit = liveTokens.find((t) => selfSrc.includes(t));
  check("guard 자체에 live/CLI/write 패턴 없음 (self-scan)", !hit, hit ? `token=${hit}` : "");
  const specifiers = [...selfSrc.matchAll(/^import\s[^\n]*?from\s+["']([^"']+)["']/gm)].map((m) => m[1]);
  const allow = new Set(["node:fs", "node:path", "node:url"]);
  check("guard imports restricted to node:fs/node:path/node:url",
    specifiers.length > 0 && specifiers.every((sp) => allow.has(sp)));
  console.log("NOTE  scanner holds forbidden tokens split-concatenated only (denylist exception)");
}

// ── 4. mutant — fail-closed ──────────────────────────────────────────────────
{
  const m1 = clone(fx); m1.accessMode = "private";
  check("mutant 1: accessMode private drift → fail",
    detectFixtureIssues(m1).some((i) => i.includes("accessMode")));

  const m2 = clone(fx); m2.storeName = "some-other-store";
  check("mutant 2: storeName drift → fail",
    detectFixtureIssues(m2).some((i) => i.includes("storeName")));

  const m3 = clone(fx); m3.status = "CONNECTED_AND_LINKED";
  check("mutant 3: status가 허용 집합 밖 → fail",
    detectFixtureIssues(m3).some((i) => i.includes("status=")));

  const m4 = clone(fx); m4.blobObjectUploadCount = 1;
  check("mutant 4: blobObjectUploadCount>0 → fail",
    detectFixtureIssues(m4).some((i) => i.includes("blobObjectUploadCount")));

  const m5 = clone(fx); m5.envSecretAccessCount = 1;
  check("mutant 5: envSecretAccessCount>0 → fail",
    detectFixtureIssues(m5).some((i) => i.includes("envSecretAccessCount")));

  const m6 = clone(fx); m6.connectedToProject = true;
  check("mutant 6: connectedToProject=true (link drift) → fail",
    detectFixtureIssues(m6).some((i) => i.includes("connectedToProject")));

  const m7 = clone(fx); m7.storeCreationAttemptCount = 2;
  check("mutant 7: storeCreationAttemptCount=2 (2개 이상 생성 시도) → fail",
    detectFixtureIssues(m7).some((i) => i.includes("storeCreationAttemptCount")));

  const m8 = clone(fx); m8.secretValueRecorded = true;
  check("mutant 8: secretValueRecorded=true → fail",
    detectFixtureIssues(m8).some((i) => i.includes("secretValueRecorded")));

  const m9 = clone(fx); m9.cliCommands.forbiddenFlagsUsed["--yes"] = true;
  check("mutant 9: --yes 플래그 사용됨 → fail",
    detectFixtureIssues(m9).some((i) => i.includes("--yes")));

  const m10 = clone(fx); m10.cliCommands.forbiddenFlagsUsed["--environment"] = true;
  check("mutant 10: --environment 플래그 사용됨 (auto-connect) → fail",
    detectFixtureIssues(m10).some((i) => i.includes("--environment")));

  const m11 = clone(fx); m11.safetyBoundariesHonored.noProjectLink = false;
  check("mutant 11: safety noProjectLink=false → fail",
    detectFixtureIssues(m11).some((i) => i.includes("noProjectLink")));

  const m12 = clone(fx); m12.externalMutationOccurred = true; m12.status = "ALREADY_EXISTS";
  check("mutant 12: ALREADY_EXISTS인데 externalMutationOccurred=true (mutation-status 불일치) → fail",
    detectFixtureIssues(m12).some((i) => i.includes("externalMutationOccurred") || i.includes("mutation")));

  const m13 = clone(fx); m13.deployCount = 1;
  check("mutant 13: deployCount>0 → fail",
    detectFixtureIssues(m13).some((i) => i.includes("deployCount")));

  const m14 = clone(fx); m14.instagramApiCallCount = 1;
  check("mutant 14: instagramApiCallCount>0 → fail",
    detectFixtureIssues(m14).some((i) => i.includes("instagramApiCallCount")));

  const m15 = clone(fx); m15.dependencyChangeCount = 1;
  check("mutant 15: dependencyChangeCount>0 → fail",
    detectFixtureIssues(m15).some((i) => i.includes("dependencyChangeCount")));

  const m16 = clone(fx); m16.cliCommands.forbiddenFlagsUsed["--token"] = true;
  check("mutant 16: --token 플래그 사용됨 → fail",
    detectFixtureIssues(m16).some((i) => i.includes("--token")));

  // secret literal 스캐너 mutant
  const m17 = clone(fx); m17.leakedField = "vercel_blob_rw_abcdef1234567890XYZ";
  check("mutant 17: secret-like 토큰 리터럴 삽입 → 스캐너 감지",
    hasSecretLiteral(m17));
}

console.log(`\nRESULT: ${failures === 0 ? "ALL PASS" : "FAIL"} (${passes + failures} checks)`);
process.exit(failures === 0 ? 0 : 1);
