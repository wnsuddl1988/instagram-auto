#!/usr/bin/env node
/**
 * check-golden-sample-v3-2-live-image-browser-run-plan-static.mjs
 *
 * Golden Sample v3.2 — live image/browser run plan 정적/preflight 가드.
 * task: golden-sample-v3-2-live-image-browser-chatgpt-run-v1
 *
 * 이 가드 자체는 no-live다: 레포 내 fixture JSON과 스크립트 소스 텍스트만 읽는다.
 * (browser/CDP/network/env-값/secret/write/subprocess 없음)
 *
 * 검증 대상:
 *   1) Owner 명시 승인 문구가 run plan에 정확히(문자 단위) 기록됨
 *   2) provider=ALLOW_CHATGPT_IMAGE, topicId, callCapMax=12, costCapUsdMax=0, 도메인 고정
 *   3) upload/TTS/render/mux/env-secret 미승인 flag 전부 false + 타 provider 전부 false
 *   4) 참조(gate/packet/contract/sample plan/prompts/allow policy/표준 모듈/runner/core) 실재
 *   5) stop conditions + artifact audit 요건 존재
 *   6) 승인 output dir 고정 (runner OUT_DIR와 세그먼트 일치)
 *   7) 기존 live runner가 ALLOW_CHATGPT_IMAGE fail-closed guard를 side effect보다 먼저 실행,
 *      하드캡 상수 12, existing-file skip, 타 provider flag 없음
 *   8) 새 runner clone 미도입 (scripts/ chatgpt 파일 인벤토리가 known set과 정확히 일치)
 *   9) 표준 no-live runner 모듈 실재 + run plan이 이를 표준으로 참조
 *  10) future gate requiredFields 8개가 plan compliance map에 전부 매핑
 *  11) approval packet/future gate는 변경되지 않고 여전히 fail-closed (승격 없음)
 *  12) mutant: wrong provider / cap>12 / cost>0 / upload flag true / stop 누락 /
 *      approval text 누락·변조 / provider guard ref 누락 / wrong output dir → 전부 fail
 *
 * 전부 통과 시 exit 0 + PASS 카운트, 위반 시 exit 1.
 */
import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const SELF = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SELF), "..");
const FX = (name) => path.join(ROOT, "scripts", "fixtures", name);
const J = (a, b) => a + b; // 토큰 분할-연결 (denylist self-scan 회피용, 검색 전용)

const PLAN_PATH = FX("golden_sample_v3_2_live_image_browser_run_plan.t1_lifestyle_inflation.v1.json");
const PROMPTS_PATH = FX("chatgpt_playwright_image_prompts.t1_lifestyle_inflation.v3.json");
const POLICY_PATH = FX("golden_sample_v3_2_paid_image_allow_guard_policy.v1.json");
const PACKET_PATH = FX("golden_sample_v3_2_live_action_approval_packet.v1.json");
const GATE_PATH = FX("golden_sample_v3_2_future_execution_plan_gate.v1.json");
const RUNNER_PATH = path.join(ROOT, "scripts", "run-chatgpt-playwright-fresh-image-set-v3.mjs");
const CORE_PATH = path.join(ROOT, "scripts", "_chatgpt-image-core.mjs");
const STANDARD_PATH = path.join(ROOT, "scripts", "run-golden-sample-chatgpt-playwright-standard-image-runner-v1.mjs");

const EXACT_OWNER_APPROVAL =
  "APPROVE_LIVE_IMAGE_BROWSER: t1_lifestyle_inflation — provider=ALLOW_CHATGPT_IMAGE, call cap=12, cost cap=$0, stop on provider error/cap exceeded/artifact audit fail";
const APPROVED_OUTPUT_DIR = "output/money-shorts/chatgpt-playwright-fresh-image-set-v3";

// 현재 레포의 chatgpt 파일 known set — 새 clone이 생기면 이 목록과 불일치 → fail
const KNOWN_CHATGPT_SCRIPT_BASENAMES = [
  "_chatgpt-image-core.mjs",
  "_chatgpt-image-preflight.mjs",
  "_chatgpt-image-anchor-generate.mjs",
  "render-golden-sample-chatgpt-playwright-visual-only-v1.mjs",
  "render-golden-sample-chatgpt-playwright-visual-only-v2.mjs",
  "render-golden-sample-chatgpt-playwright-visual-only-v3.mjs",
  "render-golden-sample-chatgpt-playwright-visual-only-v3-1.mjs",
  "run-chatgpt-playwright-image-method-revalidation-v1.mjs",
  "run-chatgpt-playwright-image-method-revalidation-v2.mjs",
  "run-chatgpt-playwright-fresh-image-set-v3.mjs",
  "run-chatgpt-playwright-korean-banknote-patch-v3-1.mjs",
  "run-golden-sample-chatgpt-playwright-v3-1-tts-first-mux-audit.mjs",
  "run-golden-sample-chatgpt-playwright-v3-2-script-voice-mux-audit.mjs",
  "run-golden-sample-chatgpt-playwright-standard-image-runner-v1.mjs",
  "check-golden-sample-v3-2-chatgpt-playwright-runner-static.mjs",
];

const NOT_APPROVED_FLAG_KEYS = [
  "uploadApprovedNow", "ttsApprovedNow", "renderApprovedNow", "muxApprovedNow", "envSecretAccessApprovedNow",
];
const OTHER_PROVIDER_KEYS = [
  "PAID_API_ENABLED", "ALLOW_OPENAI_IMAGE", "ALLOW_BFL_FLUX2", "ALLOW_IMAGEN",
  "ALLOW_GEMINI_VEO", "ALLOW_OPENAI_TTS", "ALLOW_ELEVENLABS", "midjourney",
];
const REQUIRED_REF_KEYS = [
  "futureExecutionPlanGate", "liveActionApprovalPacket", "liveActionApprovalPacketMd",
  "chatgptRunnerContract", "chatgptRunnerSamplePlan", "promptsFixture",
  "paidImageAllowGuardPolicy", "standardNoLiveRunnerModule", "liveRunner",
  "liveRunnerCoreModule", "uploadHardBlockPolicy",
];
const GATE_REQUIRED_FIELD_TOKENS = [
  "explicitOwnerLiveApproval", "callCountCapMax", "costCapUsdMax", "providerAllowGuardRef",
  "stopConditions", "artifactAuditPlan", "ownerQaSeparation", "sliceHarnessImport",
];

let passes = 0;
let failures = 0;
function check(name, ok, detail) {
  if (ok) { passes += 1; console.log(`PASS  ${name}`); }
  else { failures += 1; console.error(`FAIL  ${name}${detail ? " — " + detail : ""}`); }
}
const isStr = (v) => typeof v === "string" && v.trim().length > 0;
const isStrArr = (v) => Array.isArray(v) && v.length > 0 && v.every(isStr);
const clone = (o) => JSON.parse(JSON.stringify(o));

function loadJson(label, p) {
  try {
    const raw = readFileSync(p, "utf8");
    const parsed = JSON.parse(raw);
    check(`${label} parses as JSON`, true);
    return { raw, parsed };
  } catch (e) {
    check(`${label} parses as JSON`, false, String(e).slice(0, 160));
    return { raw: null, parsed: null };
  }
}

const planF = loadJson("live image/browser run plan fixture", PLAN_PATH);
const promptsF = loadJson("prompts fixture (v3)", PROMPTS_PATH);
const policyF = loadJson("paid image allow guard policy", POLICY_PATH);
const packetF = loadJson("live action approval packet", PACKET_PATH);
const gateF = loadJson("future execution plan gate", GATE_PATH);

if (!planF.parsed || !promptsF.parsed || !policyF.parsed || !packetF.parsed || !gateF.parsed) {
  console.error(`\nRESULT: ${failures} FAILURE(S) / ${passes + failures} checks — core fixture unreadable, aborting`);
  process.exit(1);
}
const plan = planF.parsed;
const promptsDoc = promptsF.parsed;
const policy = policyF.parsed;
const packet = packetF.parsed;
const gate = gateF.parsed;

// ── 순수 검증 함수 (mutant 재사용) ───────────────────────────────────────────
function detectApprovalDrift(p) {
  const issues = [];
  if (p.ownerApproval?.exactText !== EXACT_OWNER_APPROVAL) issues.push("ownerApproval.exactText가 Owner 승인 문구와 문자 단위 불일치/누락");
  if (p.provider !== "ALLOW_CHATGPT_IMAGE") issues.push(`provider "${p.provider}" != ALLOW_CHATGPT_IMAGE`);
  if (p.topicId !== "t1_lifestyle_inflation") issues.push(`topicId "${p.topicId}" != t1_lifestyle_inflation`);
  if (p.callCapMax !== 12) issues.push(`callCapMax "${p.callCapMax}" != 12`);
  if (!(typeof p.callCapMax === "number" && p.callCapMax <= 12)) issues.push("callCapMax > 12 (승인 초과)");
  if (p.costCapUsdMax !== 0) issues.push(`costCapUsdMax "${p.costCapUsdMax}" != 0`);
  if (p.approvedDomain !== "image_browser_generation") issues.push(`approvedDomain "${p.approvedDomain}" != image_browser_generation`);
  return issues;
}
function detectDomainEscalation(p) {
  const issues = [];
  for (const k of NOT_APPROVED_FLAG_KEYS) if (p[k] !== false) issues.push(`${k}=${p[k]} (false 아님)`);
  const other = p.otherProvidersApproved ?? {};
  for (const k of OTHER_PROVIDER_KEYS) if (other[k] !== false) issues.push(`otherProvidersApproved.${k}=${other[k]} (false 아님)`);
  return issues;
}
function detectStopAuditMissing(p) {
  const issues = [];
  if (!isStrArr(p.stopConditions)) issues.push("stopConditions 비어있음/누락");
  const joined = (p.stopConditions ?? []).join(" | ");
  for (const tok of ["provider", "cap", "audit", "login", "CAPTCHA", "STOP_DETECTED", "CDP"]) {
    if (!joined.includes(tok)) issues.push(`stopConditions에 "${tok}" 조건 누락`);
  }
  const audit = p.artifactAudit ?? {};
  if (audit.requiredForCompletion !== true) issues.push("artifactAudit.requiredForCompletion != true");
  if (!isStr(audit.auditMethod)) issues.push("artifactAudit.auditMethod 누락");
  if (!isStrArr(audit.evidencePaths)) issues.push("artifactAudit.evidencePaths 누락");
  if (!isStr(audit.failAction)) issues.push("artifactAudit.failAction 누락");
  return issues;
}
function detectProviderGuardRefMissing(p) {
  const issues = [];
  const refs = p.references ?? {};
  if (!isStr(refs.paidImageAllowGuardPolicy) || !refs.paidImageAllowGuardPolicy.includes("paid_image_allow_guard")) {
    issues.push("references.paidImageAllowGuardPolicy가 paid image allow guard policy 참조 아님/누락");
  }
  return issues;
}
function detectOutputDirDrift(p) {
  const issues = [];
  if (p.approvedOutputDir !== APPROVED_OUTPUT_DIR) issues.push(`approvedOutputDir "${p.approvedOutputDir}" != ${APPROVED_OUTPUT_DIR}`);
  const op = p.outputPolicy ?? {};
  for (const k of ["summaryPath", "latencyReportPath"]) {
    if (!isStr(op[k]) || !op[k].startsWith(APPROVED_OUTPUT_DIR + "/")) issues.push(`outputPolicy.${k}가 승인 output dir 밖`);
  }
  for (const k of ["doNotStageOutputs", "doNotDeleteExistingOutputs", "doNotManualRenameForRegeneration", "unrelatedOutputSubtreesUntouched"]) {
    if (op[k] !== true) issues.push(`outputPolicy.${k} != true`);
  }
  return issues;
}
function detectGateComplianceGap(p) {
  const issues = [];
  const map = p.futureGateComplianceMap ?? {};
  for (const tok of GATE_REQUIRED_FIELD_TOKENS) {
    if (!isStr(map[tok])) issues.push(`futureGateComplianceMap.${tok} 누락/비어있음`);
  }
  return issues;
}

// ── 1. Owner 승인 / provider / cap / 도메인 ─────────────────────────────────
{
  check("plan schemaVersion + status = LIVE_IMAGE_BROWSER_RUN_PLAN_APPROVED_SCOPED",
    plan.schemaVersion === "golden_sample_live_image_browser_run_plan_v1" &&
    plan.status === "LIVE_IMAGE_BROWSER_RUN_PLAN_APPROVED_SCOPED");
  check("plan Owner 승인 문구 정확히 기록 + provider/topicId/callCap 12/costCap 0/도메인 고정",
    detectApprovalDrift(plan).length === 0, detectApprovalDrift(plan).join("; "));
  check("plan upload/TTS/render/mux/env-secret 미승인 + 타 provider 전부 false",
    detectDomainEscalation(plan).length === 0, detectDomainEscalation(plan).join("; "));
}

// ── 2. 참조 실재 ─────────────────────────────────────────────────────────────
{
  const refs = plan.references ?? {};
  const missingKeys = REQUIRED_REF_KEYS.filter((k) => !isStr(refs[k]));
  check("plan references 11개 key 전부 존재", missingKeys.length === 0, `missing=${missingKeys.join(",")}`);
  const refPaths = REQUIRED_REF_KEYS.map((k) => refs[k]).filter(isStr);
  const missingFiles = refPaths.filter((r) => !existsSync(path.join(ROOT, r)));
  check("plan references 대상 파일 전부 레포 실재", refPaths.length >= 11 && missingFiles.length === 0, `missing=${missingFiles.join(",")}`);
  check("plan provider allow guard ref = paid image allow guard policy",
    detectProviderGuardRefMissing(plan).length === 0, detectProviderGuardRefMissing(plan).join("; "));
  check("plan 표준 no-live runner 모듈 참조 + 실재 (sliceHarnessStandard)",
    isStr(plan.sliceHarnessStandard?.standardModule) &&
    plan.sliceHarnessStandard.standardModule.includes("standard-image-runner-v1") &&
    existsSync(STANDARD_PATH) &&
    isStr(plan.sliceHarnessStandard?.rule) && plan.sliceHarnessStandard.rule.includes("클론"));
}

// ── 3. stop conditions + artifact audit + output dir ────────────────────────
{
  check("plan stopConditions 완비 (provider/cap/audit/login/CAPTCHA/STOP_DETECTED/CDP)",
    detectStopAuditMissing(plan).length === 0, detectStopAuditMissing(plan).join("; "));
  check("plan approvedOutputDir 고정 + outputPolicy(no stage/no delete/no manual rename)",
    detectOutputDirDrift(plan).length === 0, detectOutputDirDrift(plan).join("; "));
  check("plan executionCommand: transient env 1회 실행 + 타 provider flag 금지 + .env.local 금지",
    plan.executionCommand?.transientEnvOnly === true && plan.executionCommand?.runCount === 1 &&
    plan.executionCommand?.noOtherProviderFlags === true && plan.executionCommand?.noEnvLocalRead === true &&
    isStr(plan.executionCommand?.powerShellPattern) && plan.executionCommand.powerShellPattern.includes("ALLOW_CHATGPT_IMAGE='1'") &&
    plan.executionCommand.powerShellPattern.includes("run-chatgpt-playwright-fresh-image-set-v3.mjs"));
  check("plan preRunOutputState 내적 정합 (9개 최종 파일 존재 → 예상 신규 제출 0)",
    plan.preRunOutputState?.finalImagesPresent === 9 && plan.preRunOutputState?.expectedNewSubmissionsThisRun === 0 &&
    isStr(plan.preRunOutputState?.expectedBehaviorNote));
}

// ── 4. future gate compliance + owner QA/upload 불변 ─────────────────────────
{
  check("plan futureGateComplianceMap: gate requiredFields 8개 전부 매핑",
    detectGateComplianceGap(plan).length === 0, detectGateComplianceGap(plan).join("; "));
  const gateTokens = (gate.futureApprovalRequirements?.requiredFields ?? []);
  check("cross-check: gate requiredFields 8개 토큰이 실제 gate fixture와 일치",
    GATE_REQUIRED_FIELD_TOKENS.every((t) => gateTokens.some((f) => f.includes(t))));
  check("plan ownerQaSeparation: actual PENDING + ownerQaPassed false (기술 pass ≠ Owner QA)",
    plan.ownerQaSeparation?.ownerViewingListeningActualStatus === "PENDING_DIRECT_OWNER_REVIEW" &&
    plan.ownerQaSeparation?.ownerQaPassed === false);
  check("plan uploadHardBlock.active=true + policyRef 실재",
    plan.uploadHardBlock?.active === true &&
    isStr(plan.uploadHardBlock?.policyRef) && existsSync(path.join(ROOT, plan.uploadHardBlock.policyRef)));
  check("plan prohibitedInterpretations/forbiddenBehavior: 타 도메인 확장/클론/rename 우회 금지 포함",
    Array.isArray(plan.prohibitedInterpretations) &&
    plan.prohibitedInterpretations.some((s) => s.includes("upload/TTS/render/mux")) &&
    plan.prohibitedInterpretations.some((s) => s.includes("rename")) &&
    Array.isArray(plan.forbiddenBehavior) &&
    plan.forbiddenBehavior.some((s) => s.includes("clone")) &&
    plan.forbiddenBehavior.some((s) => s.includes("commit/push")));
}

// ── 5. approval packet / future gate 불변 (승격 없음) ────────────────────────
{
  check("packet 불변: approvalGrantedNow=false 유지 (packet은 요청서, 이 plan이 승인 기록)",
    packet.approvalGrantedNow === false && packet.isApprovalRequestOnly === true);
  check("packet imageBrowser template의 providerAllowFlags에 ALLOW_CHATGPT_IMAGE 존재",
    Array.isArray(packet.domainApprovalTemplates?.imageBrowser?.providerAllowFlags) &&
    packet.domainApprovalTemplates.imageBrowser.providerAllowFlags.includes("ALLOW_CHATGPT_IMAGE"));
  check("gate 불변: currentApprovalFlags 전부 false 유지 (gate는 planning artifact)",
    gate.isPlanningArtifactOnly === true &&
    Object.values(gate.currentApprovalFlags ?? {}).every((v) => v === false));
  check("packet+gate 불변: upload hard block 여전히 active",
    packet.uploadHardBlock?.active === true && gate.uploadHardBlock?.active === true);
}

// ── 6. prompts fixture 정합 (cap 12 / cost 0 / auto retry 없음) ──────────────
{
  const prompts = promptsDoc.prompts ?? [];
  check("prompts fixture: schemaVersion v3 + topicId 일치",
    promptsDoc.schemaVersion === "chatgpt_playwright_image_prompts_v3" &&
    promptsDoc.topicId === "t1_lifestyle_inflation");
  check("prompts fixture: 승인된 prompt set 9개 (1~12 범위)",
    prompts.length === 9 && prompts.length >= 1 && prompts.length <= 12, `actual=${prompts.length}`);
  check("prompts fixture boundary: max_additional_submissions=12 + cost_usd=0 + auto_retry=false",
    promptsDoc.boundary?.max_additional_submissions === 12 &&
    promptsDoc.boundary?.cost_usd === 0 && promptsDoc.boundary?.auto_retry === false);
}

// ── 7. live runner 하드닝 검증 (guard-before-side-effects + cap 12) ──────────
{
  const runnerSrc = readFileSync(RUNNER_PATH, "utf8");
  const guardIdx = runnerSrc.indexOf(J("process", ".env.") + "ALLOW_CHATGPT_IMAGE");
  const promptsReadIdx = runnerSrc.indexOf("readFileSync(PROMPTS_PATH");
  const dirCreateIdx = runnerSrc.indexOf(J("mk", "dirSync(OUT_DIR_ABS"));
  const cdpIdx = runnerSrc.indexOf("connectOverCDP");
  check("runner: ALLOW_CHATGPT_IMAGE guard가 첫 side effect(prompts read/dir 생성/CDP)보다 먼저",
    guardIdx > -1 && promptsReadIdx > -1 && dirCreateIdx > -1 && cdpIdx > -1 &&
    guardIdx < promptsReadIdx && guardIdx < dirCreateIdx && guardIdx < cdpIdx,
    `idx guard=${guardIdx} promptsRead=${promptsReadIdx} dirCreate=${dirCreateIdx} cdp=${cdpIdx}`);
  check("runner: SUBMISSION_HARD_CAP 상수 = 12",
    /const\s+SUBMISSION_HARD_CAP\s*=\s*12\s*;/.test(runnerSrc));
  check("runner: 제출 전 하드캡 도달 검사 존재 (submissionCount >= SUBMISSION_HARD_CAP)",
    runnerSrc.includes("submissionCount >= SUBMISSION_HARD_CAP"));
  check("runner: existing-file skip 정책 존재 (재제출 방지)",
    runnerSrc.includes("existing_file_skip"));
  check("runner: OUT_DIR가 승인 output dir 세그먼트와 일치",
    runnerSrc.includes('"output", "money-shorts", "chatgpt-playwright-fresh-image-set-v3"'));
  check("runner: 타 provider flag 참조 없음 (OpenAI/BFL/Imagen/Gemini-Veo/PAID_API)",
    !["ALLOW_OPENAI_IMAGE", "ALLOW_BFL_FLUX2", "ALLOW_IMAGEN", "ALLOW_GEMINI_VEO", "PAID_API_ENABLED"]
      .some((t) => runnerSrc.includes(t)));
  check("runner: core 모듈 실재 + import 사용",
    existsSync(CORE_PATH) && runnerSrc.includes(J("from ", '"./_chatgpt-image-core.mjs"')));
  check("runner: 자동 재시도 루프 없음 선언 (autoRetryPerformed: false 기록)",
    runnerSrc.includes("autoRetryPerformed: false"));
}

// ── 8. runner가 paid image allow policy에 등재 + 새 clone 없음 ───────────────
{
  const hardened = policy.hardenedImageScripts ?? [];
  const entry = hardened.find((h) => h.path === "scripts/run-chatgpt-playwright-fresh-image-set-v3.mjs");
  check("policy: live runner가 hardenedImageScripts에 chatgpt-playwright provider로 등재",
    !!entry && entry.provider === "chatgpt-playwright" &&
    Array.isArray(entry.requiredEnv) && entry.requiredEnv.includes("ALLOW_CHATGPT_IMAGE=1") &&
    entry.guardBeforeSecretRead === true);
  const helperPaths = (policy.browserRunnerClassification?.helperModules ?? []).map((h) => h.path);
  check("policy: core 모듈이 helperModules로 증거 분류됨",
    helperPaths.includes("scripts/_chatgpt-image-core.mjs"));
  const scriptsDir = path.join(ROOT, "scripts");
  const actual = readdirSync(scriptsDir)
    .filter((f) => f.toLowerCase().includes("chatgpt") && f.endsWith(".mjs"))
    .filter((f) => statSync(path.join(scriptsDir, f)).isFile())
    .sort();
  const expected = [...KNOWN_CHATGPT_SCRIPT_BASENAMES].sort();
  check("no new runner clone: scripts/ chatgpt .mjs 인벤토리가 known set 15개와 정확히 일치",
    actual.length === expected.length && actual.every((f, i) => f === expected[i]),
    `actual=${actual.length} [${actual.filter((f) => !expected.includes(f)).join(",")}] missing=[${expected.filter((f) => !actual.includes(f)).join(",")}]`);
}

// ── 9. 가드 self 소스 스캔 + import allowlist ────────────────────────────────
{
  const execTokens = [J("child_", "process"), J("spawn", "("), J("exec", "("), J("ff", "mpeg"), J("ff", "probe"),
    J("silence", "detect"), J("process", ".env"), J("fetch", "("), J("chromium", ".launch"), J("page", ".goto"),
    J("write", "File"), J("append", "File"), J("mk", "dir"), J("rm", "Sync"), J("un", "link")];
  const selfSrc = readFileSync(SELF, "utf8");
  const hit = execTokens.find((t) => selfSrc.includes(t));
  check("no forbidden live/env/write pattern in guard script (self)", !hit, hit ? `token=${hit}` : "");
  check("no forbidden live/env/write pattern in run plan fixture", !execTokens.some((t) => planF.raw.includes(t)));
  // 실제 import 문(행 시작)만 추출 — 문자열 내 검색용 토큰 오탐 방지
  const specifiers = [...selfSrc.matchAll(/^import\s[^\n]*?from\s+["']([^"']+)["']/gm)].map((m) => m[1]);
  const allow = new Set(["node:fs", "node:path", "node:url"]);
  check("guard imports restricted to node:fs/node:path/node:url",
    specifiers.length > 0 && specifiers.every((s) => allow.has(s)), `bad=${specifiers.filter((s) => !allow.has(s)).join(",")}`);
  console.log("NOTE  scanner holds forbidden tokens split-concatenated only (denylist exception per HANDOFF)");
}

// ── 10. in-memory mutant — fail-closed 확인 ──────────────────────────────────
{
  const truthy = 1 === 1;
  const mProvider = clone(plan); mProvider.provider = "ALLOW_OPENAI_IMAGE";
  check("mutant: provider를 ALLOW_OPENAI_IMAGE로 변조 → fail",
    detectApprovalDrift(mProvider).some((i) => i.includes("provider")));
  const mCap = clone(plan); mCap.callCapMax = 13;
  check("mutant: callCapMax 13 (>12) → fail",
    detectApprovalDrift(mCap).some((i) => i.includes("callCapMax")));
  const mCost = clone(plan); mCost.costCapUsdMax = 0.01;
  check("mutant: costCapUsdMax 0.01 (>0) → fail",
    detectApprovalDrift(mCost).some((i) => i.includes("costCapUsdMax")));
  const mText = clone(plan); mText.ownerApproval.exactText = mText.ownerApproval.exactText.replace("cap=12", "cap=24");
  check("mutant: Owner 승인 문구 변조(cap=24) → fail",
    detectApprovalDrift(mText).some((i) => i.includes("exactText")));
  const mTextGone = clone(plan); delete mTextGone.ownerApproval.exactText;
  check("mutant: Owner 승인 문구 누락 → fail",
    detectApprovalDrift(mTextGone).some((i) => i.includes("exactText")));
  const mDomain = clone(plan); mDomain.approvedDomain = "upload_publish";
  check("mutant: approvedDomain을 upload_publish로 변조 → fail",
    detectApprovalDrift(mDomain).some((i) => i.includes("approvedDomain")));
  const mUpload = clone(plan); mUpload.uploadApprovedNow = truthy;
  check("mutant: uploadApprovedNow true → fail",
    detectDomainEscalation(mUpload).some((i) => i.includes("uploadApprovedNow")));
  const mTts = clone(plan); mTts.ttsApprovedNow = truthy;
  check("mutant: ttsApprovedNow true → fail",
    detectDomainEscalation(mTts).some((i) => i.includes("ttsApprovedNow")));
  const mPaid = clone(plan); mPaid.otherProvidersApproved.PAID_API_ENABLED = truthy;
  check("mutant: otherProvidersApproved.PAID_API_ENABLED true → fail",
    detectDomainEscalation(mPaid).some((i) => i.includes("PAID_API_ENABLED")));
  const mStop = clone(plan); mStop.stopConditions = [];
  check("mutant: stopConditions 비움 → fail",
    detectStopAuditMissing(mStop).some((i) => i.includes("stopConditions")));
  const mGuardRef = clone(plan); mGuardRef.references.paidImageAllowGuardPolicy = "scripts/fixtures/nope.json";
  check("mutant: provider guard ref를 non-guard로 교체 → fail",
    detectProviderGuardRefMissing(mGuardRef).length > 0);
  const mOut = clone(plan); mOut.approvedOutputDir = "output/other-dir";
  check("mutant: approvedOutputDir 변조 → fail",
    detectOutputDirDrift(mOut).some((i) => i.includes("approvedOutputDir")));
  const mGateMap = clone(plan); delete mGateMap.futureGateComplianceMap.callCountCapMax;
  check("mutant: futureGateComplianceMap.callCountCapMax 누락 → fail",
    detectGateComplianceGap(mGateMap).some((i) => i.includes("callCountCapMax")));
}

console.log(failures === 0
  ? `\nRESULT: ALL PASS (${passes} checks)`
  : `\nRESULT: ${failures} FAILURE(S) / ${passes + failures} checks`);
process.exit(failures === 0 ? 0 : 1);
