#!/usr/bin/env node
/**
 * check-golden-sample-v3-2-live-instagram-upload-run-static.mjs
 *
 * Golden Sample v3.2 — live Instagram upload run plan + runner 정적 가드 (no-live).
 * task: golden-sample-v3-2-live-instagram-upload-with-buildgongjakso-public-url-v1
 *
 * 이 가드 자체는 no-live다: 레포 내 plan fixture JSON + runner 소스 텍스트만 읽는다.
 * (network/env/secret/upload/subprocess/write 없음)
 *
 * 검증:
 *  1) plan: Owner 승인 3건 문자 단위, platform 정확히 Instagram, cap 정확히 1,
 *     no regeneration/render/mux/TTS/image/browser, buildgongjakso.com URL 정책,
 *     final pre-upload audit 요건, one-shot ledger, HTTP hard block 불변 선언
 *  2) runner 소스: import allowlist, YouTube/googleapis/dotenv/subprocess 금지,
 *     env allowlist 2-key targeted 추출(broad parse 금지), secret logging 금지,
 *     게이트 순서(URL 검증 → armed → credential → upload), ledger 선기록,
 *     text/html 거부 + video/* 요구, graph.facebook.com 외 API host 금지,
 *     hard-block reconcile 존재, repo 내 write 금지
 *  3) mutant 13종(HANDOFF 요구 11종 + allowlist 확장 + ledger 선기록 해제) → 전부 fail
 */
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const SELF = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SELF), "..");
const J = (a, b) => a + b; // 토큰 분할-연결 (self-scan denylist 예외, 검색 전용)
const ENV_TOKEN = J("process", ".env");
const WFS_TOKEN = J("write", "FileSync");

const PLAN_PATH = path.join(ROOT, "scripts", "fixtures", "golden_sample_v3_2_live_instagram_upload_run_plan.t1_lifestyle_inflation.v1.json");
const RUNNER_PATH = path.join(ROOT, "scripts", "run-golden-sample-v3-2-instagram-upload-once.mjs");

const EXPECTED_PUBLIC_URL = "https://www.buildgongjakso.com/golden-sample/v3-2/t1_lifestyle_inflation/golden_sample_t1_lifestyle_inflation_tts_mux_v3_2.mp4";
const EXPECTED_REPO_STATIC = "public/golden-sample/v3-2/t1_lifestyle_inflation/golden_sample_t1_lifestyle_inflation_tts_mux_v3_2.mp4";
const EXPECTED_SOURCE_MP4 = "C:\\tmp\\money-shorts-os\\golden-sample-chatgpt-playwright-v3-2-script-voice-mux-audit\\golden_sample_t1_lifestyle_inflation_tts_mux_v3_2.mp4";
const EXPECTED_BYTES = 20294549;
const ALLOWED_HOSTS = ["www.buildgongjakso.com", "buildgongjakso.com"];
const ALLOWED_ENV = ["INSTAGRAM_ACCESS_TOKEN", "INSTAGRAM_BUSINESS_ACCOUNT_ID"];

let passes = 0;
let failures = 0;
function check(name, ok, detail) {
  if (ok) { passes += 1; console.log(`PASS  ${name}`); }
  else { failures += 1; console.error(`FAIL  ${name}${detail ? " — " + detail : ""}`); }
}
const isStr = (v) => typeof v === "string" && v.trim().length > 0;
const clone = (o) => JSON.parse(JSON.stringify(o));

// ── 로드 ─────────────────────────────────────────────────────────────────────
let plan = null;
try {
  plan = JSON.parse(readFileSync(PLAN_PATH, "utf8"));
  check("plan fixture parses as JSON", true);
} catch (e) {
  check("plan fixture parses as JSON", false, String(e).slice(0, 160));
}
let runnerSrc = null;
try {
  runnerSrc = readFileSync(RUNNER_PATH, "utf8");
  check("runner source readable", true);
} catch (e) {
  check("runner source readable", false, String(e).slice(0, 120));
}
if (!plan || !runnerSrc) {
  console.error(`\nRESULT: ${failures} FAILURE(S) / ${passes + failures} checks — core artifact unreadable, aborting`);
  process.exit(1);
}

// ── 순수 plan 검증기 (mutant 재사용) ─────────────────────────────────────────
function detectPlanIssues(p) {
  const issues = [];
  const scope = p.approvalScope ?? {};
  if (scope.platform !== "Instagram") issues.push(`platform=${scope.platform} (Instagram 아님)`);
  if (!Array.isArray(scope.platforms) || scope.platforms.length !== 1 || scope.platforms[0] !== "Instagram") issues.push("platforms가 정확히 [Instagram]이 아님");
  if (scope.uploadCountCapMax !== 1) issues.push(`uploadCountCapMax=${scope.uploadCountCapMax} (1 아님)`);
  for (const k of ["noRegeneration", "noRender", "noMux", "noTts", "noImage", "noBrowser", "noYoutube", "noDeploy", "noPush"]) {
    if (scope[k] !== true) issues.push(`approvalScope.${k} != true`);
  }
  const oa = p.ownerApprovals ?? {};
  if (!isStr(oa.approveUpload) || !oa.approveUpload.startsWith("APPROVE_UPLOAD: t1_lifestyle_inflation")) issues.push("approveUpload 문구 누락/불일치");
  if (isStr(oa.approveUpload) && !oa.approveUpload.includes("upload cap=1, platforms=Instagram")) issues.push("approveUpload에 cap=1/platforms=Instagram 없음");
  if (!isStr(oa.approveUploadPublicUrl) || !oa.approveUploadPublicUrl.startsWith("APPROVE_UPLOAD_PUBLIC_URL: t1_lifestyle_inflation")) issues.push("approveUploadPublicUrl 문구 누락/불일치");
  if (!isStr(oa.ownerClarificationDeriveUrl) || !oa.ownerClarificationDeriveUrl.includes("자꾸 물어보지말고")) issues.push("Owner clarification 원문 누락");
  const u = p.publicUrlPolicy ?? {};
  if (u.enabled !== true) issues.push("publicUrlPolicy.enabled != true (URL gate 비활성)");
  if (u.httpsOnly !== true) issues.push("httpsOnly != true");
  if (JSON.stringify(u.allowedHosts) !== JSON.stringify(ALLOWED_HOSTS)) issues.push("allowedHosts가 buildgongjakso 2개 host가 아님");
  if (u.deterministicPublicUrl !== EXPECTED_PUBLIC_URL) issues.push("deterministicPublicUrl 불일치");
  let host = null;
  try { host = new URL(u.deterministicPublicUrl).hostname; } catch { /* below */ }
  if (!ALLOWED_HOSTS.includes(host)) issues.push(`deterministicPublicUrl host=${host} (buildgongjakso 아님)`);
  if (u.repoStaticPath !== EXPECTED_REPO_STATIC) issues.push("repoStaticPath 불일치");
  if (u.requireVideoContentType !== true) issues.push("requireVideoContentType != true");
  if (u.rejectHtml !== true) issues.push("rejectHtml != true (HTML 허용됨)");
  if (u.noDeployApproved !== true) issues.push("noDeployApproved != true");
  if (u.doNotAskOwnerAgain !== true) issues.push("doNotAskOwnerAgain != true");
  if (u.ifNotLiveBlockerCode !== "BLOCKED_PUBLIC_URL_NOT_DEPLOYED") issues.push("ifNotLiveBlockerCode 불일치");
  const s = p.sourceMp4 ?? {};
  if (s.path !== EXPECTED_SOURCE_MP4) issues.push("sourceMp4.path 불일치");
  if (s.expectedBytes !== EXPECTED_BYTES) issues.push("sourceMp4.expectedBytes 불일치");
  const c = p.credentialPolicy ?? {};
  if (JSON.stringify(c.allowedEnvKeys) !== JSON.stringify(ALLOWED_ENV)) issues.push("allowedEnvKeys가 정확히 Instagram 2-key가 아님");
  if (c.broadEnvParseForbidden !== true) issues.push("broadEnvParseForbidden != true");
  if (c.secretLoggingForbidden !== true) issues.push("secretLoggingForbidden != true");
  if (!Array.isArray(c.forbiddenEnvKeyPatterns) || !c.forbiddenEnvKeyPatterns.includes("YOUTUBE_")) issues.push("forbiddenEnvKeyPatterns에 YOUTUBE_ 없음");
  if (p.httpEndpointStillBlocked !== true) issues.push("httpEndpointStillBlocked != true (hard-block mismatch 무시)");
  const ig = p.instagram ?? {};
  if (ig.publishOnlyIfFinished !== true) issues.push("publishOnlyIfFinished != true");
  if (ig.noRetry !== true) issues.push("noRetry != true");
  if (!isStr(ig.caption)) issues.push("caption 누락");
  const l = p.oneShotLedger ?? {};
  if (!isStr(l.resultJsonPath) || !l.resultJsonPath.toLowerCase().startsWith("c:\\tmp\\money-shorts-os\\")) issues.push("resultJsonPath가 승인된 C:\\tmp 경로 아님");
  if (l.armedLedgerWriteBeforeContainerCall !== true) issues.push("armedLedgerWriteBeforeContainerCall != true");
  const a = p.finalPreUploadAudit ?? {};
  if (!Array.isArray(a.requirements) || a.requirements.length < 5) issues.push("finalPreUploadAudit requirements 5개 미만");
  if (a.mustPassBeforeAnyCredentialRead !== true || a.mustPassBeforeAnyInstagramApiCall !== true) issues.push("finalPreUploadAudit 선행 강제 flag 누락");
  const expectedGates = ["GATE_1_PLAN", "GATE_2_LEDGER", "GATE_3_SOURCE_MP4", "GATE_4_OWNER_QA_PASS", "GATE_5_HARD_BLOCK_RECONCILE", "GATE_6_PUBLIC_URL", "GATE_7_CREDENTIALS_ARMED_ONLY", "GATE_8_UPLOAD_ONCE_ARMED_ONLY"];
  if (JSON.stringify(p.gateOrder) !== JSON.stringify(expectedGates)) issues.push("gateOrder 불일치");
  return issues;
}

// ── 순수 runner 소스 검증기 (mutant 재사용) ───────────────────────────────────
function detectRunnerIssues(src) {
  const issues = [];
  // import allowlist
  const specifiers = [...src.matchAll(/^import\s[^\n]*?from\s+["']([^"']+)["']/gm)].map((m) => m[1]);
  const allow = new Set(["node:fs", "node:path", "node:url"]);
  const bad = specifiers.filter((sp) => !allow.has(sp));
  if (bad.length > 0) issues.push(`import allowlist 위반: ${bad.join(",")}`);
  // 금지 토큰 (YouTube/외부 client/subprocess/브라우저/dotenv)
  const forbidden = [J("google", "apis"), J("YOUTUBE", "_"), J("GOOGLE", "_"), J("youtube", ".videos"),
    J("dot", "env"), J("child_", "process"), J("spawn", "Sync"), J("exec", "Sync"),
    J("ff", "mpeg"), J("ff", "probe"), J("play", "wright"), J("chromium", ".launch"),
    J("eleven", "labs"), J("SUPABASE", "_"), J("OPENAI", "_"), "--force"];
  for (const t of forbidden) {
    if (src.includes(t)) issues.push(`금지 토큰 존재: ${t}`);
  }
  // env 접근: allowlist 루프의 [k] 접근 형태만 허용
  const envUseRe = new RegExp(ENV_TOKEN.replace(".", "\\.") + "[.\\[][A-Za-z_\"'\\[\\]k]*", "g");
  const envUses = [...src.matchAll(envUseRe)].map((m) => m[0]);
  if (!envUses.every((u) => u === ENV_TOKEN + "[k]")) issues.push(`${ENV_TOKEN} 접근이 allowlist 루프 외부에 존재: ${envUses.join(",")}`);
  // allowlist 상수 + targeted 추출 마커
  if (!/const\s+ALLOWED_ENV_KEYS\s*=\s*\[\s*"INSTAGRAM_ACCESS_TOKEN",\s*"INSTAGRAM_BUSINESS_ACCOUNT_ID"\s*\]/.test(src)) issues.push("ALLOWED_ENV_KEYS 상수(정확히 2-key) 누락");
  if (!src.includes('t.startsWith(k + "=")')) issues.push("allowlist-startsWith targeted 추출 마커 누락");
  if (src.includes('t.indexOf("=")')) issues.push("broad env parse 패턴 존재");
  // secret logging 금지: console 라인과 writeResult 라인에 igEnv 금지
  for (const line of src.split(/\r?\n/)) {
    if (/console\.\w+\(/.test(line) && line.includes("igEnv")) issues.push(`console 라인에 igEnv 노출: ${line.trim().slice(0, 80)}`);
    if (line.includes("writeResult(") && line.includes("igEnv")) issues.push("writeResult 호출에 igEnv 전달");
  }
  // URL gate: HTML 거부 + video/* 요구 + host allowlist
  if (!src.includes('contentType.includes("text/html")')) issues.push("text/html 거부 검사 누락");
  if (!src.includes('contentType.startsWith("video/")')) issues.push("video/* content-type 요구 누락");
  if (!src.includes("allowedHosts") || !src.includes("includes(parsed.hostname)")) issues.push("host allowlist 검사 누락");
  // API host: graph.facebook.com 외 https 리터럴 금지
  const httpsLiterals = [...src.matchAll(/https:\/\/[a-z0-9.-]+/gi)].map((m) => m[0]);
  const allowedApiHosts = ["https://graph.facebook.com"];
  const badHosts = httpsLiterals.filter((h) => !allowedApiHosts.some((a) => h.startsWith(a)));
  if (badHosts.length > 0) issues.push(`허용 외 https 리터럴: ${[...new Set(badHosts)].join(",")}`);
  // 게이트 순서: LEDGER → URL 검증 → ARMED → credential → upload
  const iG2 = src.indexOf("[GATE_2_LEDGER]");
  const iG6 = src.indexOf("[GATE_6_PUBLIC_URL]");
  const iArm = src.indexOf("ARMED_ONLY_BEGIN");
  const iG7 = src.indexOf("[GATE_7_CREDENTIALS_ARMED_ONLY]");
  const iG8 = src.indexOf("[GATE_8_UPLOAD_ONCE_ARMED_ONLY]");
  if (!(iG2 !== -1 && iG6 !== -1 && iArm !== -1 && iG7 !== -1 && iG8 !== -1 && iG2 < iG6 && iG6 < iArm && iArm < iG7 && iG7 < iG8)) {
    issues.push("게이트 순서 위반 (LEDGER→PUBLIC_URL→ARMED→CREDENTIALS→UPLOAD 아님)");
  }
  // cap=1 ledger: attempted 검사 + container 호출 전 ledger 선기록
  if (!src.includes("uploadAttempted === true")) issues.push("기존 attempted ledger 검사 누락");
  const iLedgerArm = src.indexOf('writeResult("UPLOAD_ATTEMPT_IN_PROGRESS"');
  const iContainer = src.indexOf("/media`");
  if (!(iLedgerArm !== -1 && iContainer !== -1 && iLedgerArm < iContainer)) issues.push("container 호출 전 attempted ledger 선기록 누락");
  // publish는 FINISHED 이후에만
  if (!src.includes('status_code === "FINISHED"') || !src.includes("if (!finished)")) issues.push("FINISHED 전 publish 차단 로직 누락");
  // hard-block reconcile
  if (!src.includes("uploadBlocked === true") || !src.includes("BLOCKED_HARD_BLOCK_MISMATCH")) issues.push("hard-block reconcile 검사 누락 (mismatch 무시)");
  // repo 내 write 금지: 결과 기록 write는 writeResult 내부 1회만
  const wfsCount = (src.match(new RegExp(WFS_TOKEN + "\\(", "g")) ?? []).length;
  if (wfsCount !== 1) issues.push(`${WFS_TOKEN} ${wfsCount}회 (resultPath 1회만 허용)`);
  if (src.includes(WFS_TOKEN + "(join(REPO_ROOT")) issues.push("repo 내부 write 존재");
  return issues;
}

// ── 1. plan 검증 ─────────────────────────────────────────────────────────────
{
  check("plan schemaVersion + taskId + status",
    plan.schemaVersion === "golden_sample_live_instagram_upload_run_plan_v1" &&
    plan.taskId === "golden-sample-v3-2-live-instagram-upload-with-buildgongjakso-public-url-v1" &&
    plan.status === "APPROVED_LIVE_PLAN_FAIL_CLOSED_CAP_1");
  const issues = detectPlanIssues(plan);
  check("plan invariants: Instagram-only, cap=1, 승인 3건, URL 정책, allowlist, ledger, audit, gateOrder",
    issues.length === 0, issues.join("; "));
  check("plan blockerCodes에 필수 코드 포함",
    ["BLOCKED_ALREADY_ATTEMPTED", "BLOCKED_PUBLIC_URL_NOT_DEPLOYED", "BLOCKED_PUBLIC_URL_NOT_DIRECT_MP4",
      "BLOCKED_INSTAGRAM_CREDENTIALS_MISSING", "BLOCKED_HARD_BLOCK_MISMATCH"]
      .every((code) => (plan.blockerCodes ?? []).includes(code)));
  check("plan stopConditions 핵심 토큰 완비",
    ["direct mp4", "text/html", "credential", "hard-block", "cap 1", "audit"]
      .every((t) => (plan.stopConditions ?? []).join(" | ").includes(t)));
  const refs = plan.references ?? {};
  const refFiles = ["ownerQaActualPass", "uploadApprovalPacket", "uploadHardBlockPolicy", "renderMuxRunPlan", "runner", "staticGuard"]
    .map((k) => refs[k]).filter(isStr);
  check("plan references 대상 파일 전부 레포 실재",
    refFiles.length === 6 && refFiles.every((r) => existsSync(path.join(ROOT, r))),
    refFiles.filter((r) => !existsSync(path.join(ROOT, r))).join(","));
  check("plan hardBlock.policyRef 실재 + httpEndpointActive true",
    plan.hardBlock?.httpEndpointActive === true && existsSync(path.join(ROOT, plan.hardBlock?.policyRef ?? "")));
  check("plan prohibited에 YouTube/2회 이상/broad env/secret logging/재질문 금지 명시",
    ["YouTube", "2회 이상", "broad .env.local", "secret", "재질문"]
      .every((t) => (plan.prohibited ?? []).join(" | ").includes(t)));
  check("plan executionPreconditionNotes: auto-mode 권한 차단 + Owner 직접 검토 필요 기록",
    (plan.executionPreconditionNotes ?? []).join(" | ").includes("auto-mode") &&
    (plan.executionPreconditionNotes ?? []).join(" | ").includes("직접 검토"));
}

// ── 2. runner 소스 검증 ──────────────────────────────────────────────────────
{
  const issues = detectRunnerIssues(runnerSrc);
  check("runner: import allowlist/금지 토큰/env allowlist/secret logging/게이트 순서/ledger/FINISHED/hard-block/write 제한",
    issues.length === 0, issues.join("; "));
  check("runner: --arm 없이는 credential/upload 미진입 (preflight-only 분기 존재)",
    runnerSrc.includes("if (!armed)") && runnerSrc.includes("PREFLIGHT_ONLY_NO_UPLOAD") &&
    runnerSrc.indexOf("if (!armed)") < runnerSrc.indexOf("[GATE_7_CREDENTIALS_ARMED_ONLY]"));
  check("runner: secretsWritten:false 마커 + presence-only 기록",
    runnerSrc.includes("secretsWritten: false") && runnerSrc.includes("credentialPresence"));
  check("runner: 자동 재시도 없음 (retry 토큰/재시도 루프 부재)",
    !/retr(y|ies)/i.test(runnerSrc.replace(/재시도/g, "")) && !runnerSrc.includes("for (let attempt"));
  check("runner: plan의 resultJsonPath가 C:\\tmp 승인 경로인지 실행 시 재검증",
    runnerSrc.includes('startsWith("c:\\\\tmp\\\\money-shorts-os\\\\")'));
}

// ── 3. 가드 self 스캔 ────────────────────────────────────────────────────────
{
  const selfSrc = readFileSync(SELF, "utf8");
  const liveTokens = [J("fet", "ch("), ENV_TOKEN, J("child_", "process"), J("spawn", "("),
    WFS_TOKEN, J("mkdir", "Sync"), J("rm", "Sync"), J("XMLHttp", "Request")];
  const hit = liveTokens.find((t) => selfSrc.includes(t));
  check("guard 자체에 live/env/write 패턴 없음 (self-scan)", !hit, hit ? `token=${hit}` : "");
  const specifiers = [...selfSrc.matchAll(/^import\s[^\n]*?from\s+["']([^"']+)["']/gm)].map((m) => m[1]);
  const allow = new Set(["node:fs", "node:path", "node:url"]);
  check("guard imports restricted to node:fs/node:path/node:url",
    specifiers.length > 0 && specifiers.every((sp) => allow.has(sp)));
  console.log("NOTE  scanner holds forbidden tokens split-concatenated only (denylist exception)");
}

// ── 4. mutant — fail-closed 확인 (HANDOFF 요구 11종 + 확장 2종) ──────────────
{
  const m1 = clone(plan); m1.approvalScope.platform = "YouTube"; m1.approvalScope.platforms = ["YouTube"];
  check("mutant 1: platform drift → YouTube → fail",
    detectPlanIssues(m1).some((i) => i.includes("platform")));
  const m1b = clone(plan); m1b.approvalScope.platforms = ["Instagram", "YouTube"];
  check("mutant 1b: platforms both → fail",
    detectPlanIssues(m1b).some((i) => i.includes("platforms")));
  const m2 = clone(plan); m2.approvalScope.uploadCountCapMax = 2;
  check("mutant 2: cap > 1 → fail",
    detectPlanIssues(m2).some((i) => i.includes("uploadCountCapMax")));
  const m3 = clone(plan); m3.publicUrlPolicy.deterministicPublicUrl = "https://evil.example.com/video.mp4";
  check("mutant 3: public URL이 buildgongjakso 밖 → fail",
    detectPlanIssues(m3).some((i) => i.includes("deterministicPublicUrl") || i.includes("host")));
  const m4 = clone(plan); m4.publicUrlPolicy.rejectHtml = false;
  check("mutant 4: HTML content-type 허용 → fail",
    detectPlanIssues(m4).some((i) => i.includes("rejectHtml")));
  const m5 = runnerSrc.replace('t.startsWith(k + "=")', 't.indexOf("=") !== -1');
  check("mutant 5: broad .env.local parse → fail",
    detectRunnerIssues(m5).some((i) => i.includes("targeted 추출") || i.includes("broad")));
  const m6 = runnerSrc + "\nconst yt = " + ENV_TOKEN + '["' + J("YOUTUBE", "_ACCESS_TOKEN") + '"];\n';
  check("mutant 6: YouTube credential read → fail",
    detectRunnerIssues(m6).some((i) => i.includes("금지 토큰") || i.includes("allowlist 루프 외부")));
  const m7 = runnerSrc + "\nconsole.log(igEnv.INSTAGRAM_ACCESS_TOKEN);\n";
  check("mutant 7: secret logging → fail",
    detectRunnerIssues(m7).some((i) => i.includes("igEnv")));
  const m8 = "import { " + J("spawn", "Sync") + ' } from "node:' + J("child_", "process") + '";\n' + runnerSrc;
  check("mutant 8: render/mux 계열 subprocess import → fail",
    detectRunnerIssues(m8).some((i) => i.includes("import allowlist") || i.includes("금지 토큰")));
  const m9 = "// [GATE_8_UPLOAD_ONCE_ARMED_ONLY] moved-before-audit mutant\n" + runnerSrc;
  check("mutant 9: final pre-upload audit 전 upload 마커 → fail",
    detectRunnerIssues(m9).some((i) => i.includes("게이트 순서")));
  const m10 = clone(plan); m10.publicUrlPolicy.enabled = false;
  check("mutant 10: public URL gate 비활성 → fail",
    detectPlanIssues(m10).some((i) => i.includes("enabled")));
  const m11 = runnerSrc.replace("policy?.uploadBlocked === true", "true /* hard block ignored */");
  check("mutant 11: upload hard-block mismatch 무시 → fail",
    detectRunnerIssues(m11).some((i) => i.includes("hard-block")));
  const m12 = clone(plan); m12.credentialPolicy.allowedEnvKeys = ["INSTAGRAM_ACCESS_TOKEN", "INSTAGRAM_BUSINESS_ACCOUNT_ID", J("YOUTUBE", "_ACCESS_TOKEN")];
  check("mutant 12: env allowlist 확장 → fail",
    detectPlanIssues(m12).some((i) => i.includes("allowedEnvKeys")));
  const m13 = clone(plan); m13.oneShotLedger.armedLedgerWriteBeforeContainerCall = false;
  check("mutant 13: ledger 선기록 해제 → fail",
    detectPlanIssues(m13).some((i) => i.includes("armedLedgerWriteBeforeContainerCall")));
}

console.log(failures === 0
  ? `\nRESULT: ALL PASS (${passes} checks)`
  : `\nRESULT: ${failures} FAILURE(S) / ${passes + failures} checks`);
process.exit(failures === 0 ? 0 : 1);
