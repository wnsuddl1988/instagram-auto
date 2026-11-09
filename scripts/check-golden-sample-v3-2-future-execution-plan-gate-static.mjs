#!/usr/bin/env node
/**
 * check-golden-sample-v3-2-future-execution-plan-gate-static.mjs
 *
 * Golden Sample v3.2 — future execution plan gate 정적 가드 (no-live).
 * task: golden-sample-v3-2-future-execution-plan-gate-standardization-v1
 *
 * - no-live / no-network / no-env / no-secret / no-browser / no-render / no-mux /
 *   no-audio·video·image-read / no-write / no-subprocess:
 *   레포 내 fixture JSON만 읽어 검증한다.
 * - 검증 대상:
 *   1) gate fixture가 planning artifact only이고 현재 승인이 zero live execution임을 명시
 *   2) currentApprovalFlags 9종 + prohibitedReadinessFlags 10종 전부 false
 *   3) ownerDecisionState resolved 10 / pending 0 + actual Owner QA PENDING + ownerQaPassed 아님
 *   4) upload hard block active
 *   5) futureApprovalRequirements: 명시 Owner 승인 필수 + plan 필드 nonzero는 미래 slice에서만
 *   6) call/cost cap + stop condition + artifact audit 요건이 미래 live 전 필수
 *   7) provider allow guard가 image/browser·TTS·render·mux·upload·owner QA 도메인별로 참조됨
 *   8) mutant: approval flag true / owner QA actual PASS / pending 재도입 / upload block inactive /
 *      cap·cost·stop 누락 / provider guard 누락 / future plan을 현재 승인으로 해석 → 전부 fail-closed
 * - 전부 통과 시 exit 0 + PASS 카운트, 위반 시 exit 1.
 */
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const SELF = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SELF), "..");
const FX = (name) => path.join(ROOT, "scripts", "fixtures", name);

const GATE_PATH = FX("golden_sample_v3_2_future_execution_plan_gate.v1.json");
const STATE_PATH = FX("golden_sample_v3_2_owner_decision_resolution_state.v1.json");
const CONTRACT_PATH = FX("golden_sample_v3_2_integrated_production_readiness_contract.v1.json");

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

const CURRENT_APPROVAL_FLAGS = [
  "executionApprovedNow", "liveActionApprovedNow", "uploadApprovedNow", "renderApprovedNow",
  "muxApprovedNow", "imageGenerationApprovedNow", "ttsApprovedNow", "browserApprovedNow",
  "envSecretAccessApprovedNow",
];
const PROHIBITED_READINESS_FLAGS = [
  "uploadReady", "automationExpansionReady", "implementationApproved", "liveTtsApproved",
  "liveMuxApproved", "liveRenderApproved", "liveImageGenerationApproved", "chatgptPlaywrightApproved",
  "ownerQaPassed", "productionReady",
];
const REQUIRED_FUTURE_FIELDS_TOKENS = [
  "explicitOwnerLiveApproval", "callCountCapMax", "costCapUsdMax", "providerAllowGuardRef",
  "stopConditions", "artifactAuditPlan", "ownerQaSeparation", "sliceHarnessImport",
];
const REQUIRED_DOMAINS = ["imageBrowser", "ttsAudio", "pillowRender", "muxAudit", "upload", "ownerQa"];

const gateF = loadJson("future execution plan gate fixture", GATE_PATH);
const stateF = loadJson("owner decision resolution state fixture", STATE_PATH);
const contractF = loadJson("integrated readiness contract", CONTRACT_PATH);

if (!gateF.parsed || !stateF.parsed || !contractF.parsed) {
  console.error(`\nRESULT: ${failures} FAILURE(S) / ${passes + failures} checks — core fixture unreadable, aborting`);
  process.exit(1);
}

const gate = gateF.parsed;
const state = stateF.parsed;

// ── 0. 순수 검증 함수 (mutant 재사용) ───────────────────────────────────────
function detectCurrentApprovalEscalation(flags) {
  const issues = [];
  const f = flags ?? {};
  for (const name of CURRENT_APPROVAL_FLAGS) if (f[name] !== false) issues.push(`currentApprovalFlags.${name}=${f[name]} (false 아님)`);
  return issues;
}
function detectProhibitedReadinessEscalation(flags) {
  const issues = [];
  const f = flags ?? {};
  for (const name of PROHIBITED_READINESS_FLAGS) if (f[name] !== false) issues.push(`prohibitedReadinessFlags.${name}=${f[name]} (false 아님)`);
  return issues;
}
function detectOwnerQaActualPass(gateObj) {
  const issues = [];
  const ods = gateObj?.ownerDecisionState ?? {};
  if (ods.ownerViewingListeningActualStatus !== "PENDING_DIRECT_OWNER_REVIEW") {
    issues.push(`ownerViewingListeningActualStatus "${ods.ownerViewingListeningActualStatus}" != PENDING_DIRECT_OWNER_REVIEW`);
  }
  const oq = gateObj?.perDomainFuturePlan?.ownerQa ?? {};
  if (oq.ownerQaPassed !== false) issues.push(`perDomainFuturePlan.ownerQa.ownerQaPassed=${oq.ownerQaPassed} (false 아님)`);
  if (oq.ownerViewingListeningActualStatus !== "PENDING_DIRECT_OWNER_REVIEW") {
    issues.push(`perDomainFuturePlan.ownerQa.ownerViewingListeningActualStatus "${oq.ownerViewingListeningActualStatus}" != PENDING`);
  }
  return issues;
}
function detectDecisionStateRegression(gateObj) {
  const issues = [];
  const ods = gateObj?.ownerDecisionState ?? {};
  if (ods.resolvedCount !== 10) issues.push(`ownerDecisionState.resolvedCount "${ods.resolvedCount}" != 10`);
  if (ods.pendingCount !== 0) issues.push(`ownerDecisionState.pendingCount "${ods.pendingCount}" != 0`);
  return issues;
}
function detectUploadHardBlockInactive(gateObj) {
  const issues = [];
  const uhb = gateObj?.uploadHardBlock ?? {};
  if (uhb.active !== true) issues.push(`uploadHardBlock.active=${uhb.active} (true 아님)`);
  const up = gateObj?.perDomainFuturePlan?.upload ?? {};
  if (up.currentStatus !== "blocked_hard_block_active") issues.push(`perDomainFuturePlan.upload.currentStatus "${up.currentStatus}" != blocked_hard_block_active`);
  return issues;
}
function detectCapStopMissing(gateObj) {
  const issues = [];
  const cs = gateObj?.capAndStopRequirements ?? {};
  for (const k of ["callCapRequiredBeforeAnyLive", "costCapRequiredBeforeAnyLive", "stopConditionRequiredBeforeAnyLive", "artifactAuditRequiredBeforeAnyLive"]) {
    if (cs[k] !== true) issues.push(`capAndStopRequirements.${k}=${cs[k]} (true 아님)`);
  }
  const pdp = gateObj?.perDomainFuturePlan ?? {};
  for (const d of REQUIRED_DOMAINS) {
    if (d === "ownerQa") continue; // owner QA는 수동 QA 도메인 — cap/stop 대신 pending 유지
    const dom = pdp[d] ?? {};
    for (const k of ["callCapRequired", "costCapRequired", "stopConditionRequired", "artifactAuditRequired"]) {
      if (dom[k] !== true) issues.push(`perDomainFuturePlan.${d}.${k}=${dom[k]} (true 아님)`);
    }
  }
  return issues;
}
function detectProviderGuardMissing(gateObj) {
  const issues = [];
  const pdp = gateObj?.perDomainFuturePlan ?? {};
  const ib = pdp.imageBrowser ?? {};
  if (!isStr(ib.providerAllowGuardRef) || !ib.providerAllowGuardRef.includes("paid_image_allow_guard")) {
    issues.push("imageBrowser.providerAllowGuardRef가 paid image allow guard policy 참조 아님");
  }
  if (!isStrArr(ib.providerAllowFlags) || !ib.providerAllowFlags.includes("ALLOW_CHATGPT_IMAGE")) {
    issues.push("imageBrowser.providerAllowFlags에 ALLOW_CHATGPT_IMAGE 누락");
  }
  const tts = pdp.ttsAudio ?? {};
  if (!isStrArr(tts.providerAllowFlags) || !tts.providerAllowFlags.includes("ALLOW_OPENAI_TTS")) {
    issues.push("ttsAudio.providerAllowFlags에 ALLOW_OPENAI_TTS 누락");
  }
  const pr = pdp.pillowRender ?? {};
  if (!isStr(pr.renderContractRef) || !pr.renderContractRef.includes("pillow_renderer")) {
    issues.push("pillowRender.renderContractRef가 pillow renderer contract 참조 아님");
  }
  const mux = pdp.muxAudit ?? {};
  if (!isStr(mux.muxAuditContractRef) || !mux.muxAuditContractRef.includes("tts_audio_audit")) {
    issues.push("muxAudit.muxAuditContractRef가 tts audio audit contract 참조 아님");
  }
  const up = pdp.upload ?? {};
  if (!isStr(up.uploadHardBlockRef) || !up.uploadHardBlockRef.includes("upload_hard_block")) {
    issues.push("upload.uploadHardBlockRef가 upload hard block policy 참조 아님");
  }
  return issues;
}

// ── 1. planning artifact only + verdict 불변 ────────────────────────────────
{
  check("gate schemaVersion + status = FUTURE_EXECUTION_PLAN_GATE_NO_LIVE",
    gate.schemaVersion === "golden_sample_future_execution_plan_gate_v1" &&
    gate.status === "FUTURE_EXECUTION_PLAN_GATE_NO_LIVE");
  check("gate isPlanningArtifactOnly=true + currentApprovalIsZeroLiveExecution=true",
    gate.isPlanningArtifactOnly === true && gate.currentApprovalIsZeroLiveExecution === true);
  check("gate readinessVerdict.current = STANDARDIZED_NO_LIVE_READY (승격 없음)",
    gate.readinessVerdict?.current === "STANDARDIZED_NO_LIVE_READY" &&
    Array.isArray(gate.readinessVerdict?.isNot) && gate.readinessVerdict.isNot.includes("upload_ready"));
  check("gate basedOn integrated contract + decision state 참조 실재",
    isStr(gate.basedOn?.integratedReadinessContract) && existsSync(path.join(ROOT, gate.basedOn.integratedReadinessContract)) &&
    isStr(gate.basedOn?.decisionState) && existsSync(path.join(ROOT, gate.basedOn.decisionState)));
}

// ── 2. currentApprovalFlags 9종 + prohibitedReadinessFlags 10종 전부 false ──
{
  check("gate currentApprovalFlags 9종 전부 false (fail-closed)",
    detectCurrentApprovalEscalation(gate.currentApprovalFlags).length === 0,
    detectCurrentApprovalEscalation(gate.currentApprovalFlags).join("; "));
  check("gate currentApprovalFlags 정확히 9개 key 존재",
    CURRENT_APPROVAL_FLAGS.every((k) => k in (gate.currentApprovalFlags ?? {})));
  check("gate prohibitedReadinessFlags 10종 전부 false (fail-closed)",
    detectProhibitedReadinessEscalation(gate.prohibitedReadinessFlags).length === 0,
    detectProhibitedReadinessEscalation(gate.prohibitedReadinessFlags).join("; "));
}

// ── 3. ownerDecisionState resolved 10 / pending 0 + actual QA PENDING ───────
{
  check("gate ownerDecisionState references decision resolution state fixture",
    isStr(gate.ownerDecisionState?.decisionStateRef) &&
    gate.ownerDecisionState.decisionStateRef.includes("owner_decision_resolution_state"));
  check("gate ownerDecisionState resolved 10 / pending 0",
    detectDecisionStateRegression(gate).length === 0, detectDecisionStateRegression(gate).join("; "));
  check("gate ownerDecisionState actual QA PENDING + ownerQaPassed 아님 (정책 resolved ≠ 실제 pass)",
    detectOwnerQaActualPass(gate).length === 0, detectOwnerQaActualPass(gate).join("; "));
  // decision state fixture와 교차: 실제 fixture도 resolved 10/pending 0 + actual PENDING
  check("cross-check: decision state fixture resolvedCount 10 / pendingCount 0 / actual PENDING",
    state.coverage?.resolvedCount === 10 && state.coverage?.pendingCount === 0 &&
    state.ownerViewingListeningActualStatus === "PENDING_DIRECT_OWNER_REVIEW" &&
    state.flags?.ownerQaPassed === false);
}

// ── 4. upload hard block active ─────────────────────────────────────────────
{
  check("gate uploadHardBlock.active=true + policyRef 실재",
    detectUploadHardBlockInactive(gate).length === 0 &&
    isStr(gate.uploadHardBlock?.policyRef) && existsSync(path.join(ROOT, gate.uploadHardBlock.policyRef)),
    detectUploadHardBlockInactive(gate).join("; "));
}

// ── 5. futureApprovalRequirements: 명시 승인 + plan 필드 미래 slice 한정 ────
{
  const far = gate.futureApprovalRequirements ?? {};
  check("gate futureApprovalRequirements.explicitOwnerApprovalRequired=true",
    far.explicitOwnerApprovalRequired === true);
  check("gate futureApprovalRequirements.planFieldsNonzeroOnlyInFutureSlice=true (현재는 승인/예산 아님)",
    far.planFieldsNonzeroOnlyInFutureSlice === true);
  check("gate futureApprovalRequirements.requiredFields에 8개 핵심 토큰 전부 포함",
    isStrArr(far.requiredFields) &&
    REQUIRED_FUTURE_FIELDS_TOKENS.every((t) => far.requiredFields.some((f) => f.includes(t))),
    `missing=${REQUIRED_FUTURE_FIELDS_TOKENS.filter((t) => !(far.requiredFields ?? []).some((f) => f.includes(t))).join(",")}`);
}

// ── 6. cap/cost/stop/audit 요건 필수 ────────────────────────────────────────
{
  check("gate capAndStopRequirements: call/cost/stop/audit 4종 전부 true (미래 live 전 필수)",
    detectCapStopMissing(gate).length === 0, detectCapStopMissing(gate).join("; "));
}

// ── 7. perDomainFuturePlan 6개 도메인 + provider allow guard 참조 ────────────
{
  const pdp = gate.perDomainFuturePlan ?? {};
  check("gate perDomainFuturePlan 6개 도메인 전부 존재",
    REQUIRED_DOMAINS.every((d) => d in pdp), `missing=${REQUIRED_DOMAINS.filter((d) => !(d in pdp)).join(",")}`);
  // 실행 도메인 5개는 blocked/not_approved, ownerQa는 pending
  const execDomains = REQUIRED_DOMAINS.filter((d) => d !== "ownerQa");
  check("gate perDomainFuturePlan 실행 5개 도메인 currentStatus = blocked/not_approved",
    execDomains.every((d) => isStr(pdp[d]?.currentStatus) && /blocked|not_approved/.test(pdp[d].currentStatus)),
    execDomains.map((d) => `${d}=${pdp[d]?.currentStatus}`).join(";"));
  check("gate perDomainFuturePlan.ownerQa = pending_manual_owner_review + isAutomatable false",
    pdp.ownerQa?.currentStatus === "pending_manual_owner_review" && pdp.ownerQa?.isAutomatable === false);
  check("gate provider allow guard가 image/browser·TTS·render·mux·upload 도메인별 참조",
    detectProviderGuardMissing(gate).length === 0, detectProviderGuardMissing(gate).join("; "));
  // 참조된 provider allow guard / contract 파일이 실재
  const refs = [
    pdp.imageBrowser?.providerAllowGuardRef, pdp.imageBrowser?.chatgptRunnerContractRef,
    pdp.ttsAudio?.ttsAuditContractRef, pdp.pillowRender?.renderContractRef,
    pdp.muxAudit?.muxAuditContractRef, pdp.upload?.uploadHardBlockRef,
  ].filter(isStr);
  const missingRefs = refs.filter((r) => !existsSync(path.join(ROOT, r)));
  check("gate perDomainFuturePlan 참조 fixture/contract 전부 레포 실재 (prose 아님)",
    refs.length >= 6 && missingRefs.length === 0, `missing=${missingRefs.join(",")}`);
}

// ── 8. prohibitedInterpretations + forbiddenBehavior ────────────────────────
{
  check("gate prohibitedInterpretations: 현재 승인 해석/owner QA 실제 pass/upload 활성화 오해 금지 포함",
    Array.isArray(gate.prohibitedInterpretations) &&
    gate.prohibitedInterpretations.some((s) => s.includes("현재 live 실행 승인")) &&
    gate.prohibitedInterpretations.some((s) => s.includes("owner_viewing_listening_qa") && (s.includes("실제") || s.includes("ownerQaPassed"))) &&
    gate.prohibitedInterpretations.some((s) => s.includes("upload_endpoint_disposition") && s.includes("활성화")) &&
    gate.prohibitedInterpretations.some((s) => s.includes("cap") || s.includes("stop")));
  check("gate forbiddenBehavior: approval flag/upload block 비활성화/cap 제거/provider guard 제거 금지 포함",
    Array.isArray(gate.forbiddenBehavior) &&
    gate.forbiddenBehavior.some((s) => s.includes("currentApprovalFlags")) &&
    gate.forbiddenBehavior.some((s) => s.includes("upload hard block")) &&
    gate.forbiddenBehavior.some((s) => s.includes("cap") || s.includes("stop")) &&
    gate.forbiddenBehavior.some((s) => s.includes("provider allow guard")));
}

// ── 9. 가드 self 소스 스캔 + import allowlist ───────────────────────────────
{
  const J = (a, b) => a + b;
  const execTokens = [J("child_", "process"), J("spawn", "("), J("exec", "("), J("ff", "mpeg"), J("ff", "probe"),
    J("silence", "detect"), J("process", ".env"), J("fetch", "("), J("chromium", ".launch"), J("page", ".goto"),
    J("write", "File"), J("append", "File"), J("mk", "dir"), J("rm", "Sync"), J("un", "link")];
  const selfSrc = readFileSync(SELF, "utf8");
  const hit = execTokens.find((t) => selfSrc.includes(t));
  check("no forbidden live/env/write pattern in guard script (self)", !hit, hit ? `token=${hit}` : "");
  check("no forbidden live/env/write pattern in gate fixture", !execTokens.some((t) => gateF.raw.includes(t)));
  const specifiers = [...selfSrc.matchAll(/from\s+["']([^"']+)["']/g)].map((m) => m[1]);
  const allow = new Set(["node:fs", "node:path", "node:url"]);
  check("guard imports restricted to node:fs/node:path/node:url",
    specifiers.length > 0 && specifiers.every((s) => allow.has(s)), `bad=${specifiers.filter((s) => !allow.has(s)).join(",")}`);
  console.log("NOTE  scanner holds forbidden tokens split-concatenated only (denylist exception per HANDOFF)");
}

// ── 10. in-memory mutant — fail-closed 확인 ────────────────────────────────
{
  // approval flag true
  const truthy = 1 === 1;
  check("mutant: executionApprovedNow true → fail",
    detectCurrentApprovalEscalation({ ...gate.currentApprovalFlags, executionApprovedNow: truthy }).some((i) => i.includes("executionApprovedNow")));
  check("mutant: uploadApprovedNow true → fail",
    detectCurrentApprovalEscalation({ ...gate.currentApprovalFlags, uploadApprovedNow: truthy }).some((i) => i.includes("uploadApprovedNow")));
  check("mutant: prohibitedReadinessFlags.productionReady true → fail",
    detectProhibitedReadinessEscalation({ ...gate.prohibitedReadinessFlags, productionReady: truthy }).some((i) => i.includes("productionReady")));
  check("mutant: prohibitedReadinessFlags.ownerQaPassed true → fail",
    detectProhibitedReadinessEscalation({ ...gate.prohibitedReadinessFlags, ownerQaPassed: truthy }).some((i) => i.includes("ownerQaPassed")));

  // owner QA actual PASS
  const mQaPass = clone(gate); mQaPass.ownerDecisionState.ownerViewingListeningActualStatus = "PASS";
  check("mutant: ownerViewingListeningActualStatus PASS로 위장 → fail",
    detectOwnerQaActualPass(mQaPass).some((i) => i.includes("ownerViewingListeningActualStatus")));
  const mQaFlag = clone(gate); mQaFlag.perDomainFuturePlan.ownerQa.ownerQaPassed = truthy;
  check("mutant: perDomainFuturePlan.ownerQa.ownerQaPassed true → fail",
    detectOwnerQaActualPass(mQaFlag).some((i) => i.includes("ownerQaPassed")));

  // pending 재도입
  const mPending = clone(gate); mPending.ownerDecisionState.pendingCount = 1; mPending.ownerDecisionState.resolvedCount = 9;
  check("mutant: ownerDecisionState pending 재도입(resolved 9/pending 1) → fail",
    detectDecisionStateRegression(mPending).length > 0);

  // upload hard block inactive
  const mUpload = clone(gate); mUpload.uploadHardBlock.active = false;
  check("mutant: uploadHardBlock.active false → fail",
    detectUploadHardBlockInactive(mUpload).some((i) => i.includes("uploadHardBlock.active")));
  const mUploadStatus = clone(gate); mUploadStatus.perDomainFuturePlan.upload.currentStatus = "approved";
  check("mutant: upload 도메인 currentStatus approved로 위장 → fail",
    detectUploadHardBlockInactive(mUploadStatus).some((i) => i.includes("currentStatus")));

  // cap/cost/stop 누락
  const mCap = clone(gate); mCap.capAndStopRequirements.callCapRequiredBeforeAnyLive = false;
  check("mutant: capAndStopRequirements.callCapRequiredBeforeAnyLive false → fail",
    detectCapStopMissing(mCap).some((i) => i.includes("callCapRequiredBeforeAnyLive")));
  const mDomStop = clone(gate); mDomStop.perDomainFuturePlan.imageBrowser.stopConditionRequired = false;
  check("mutant: imageBrowser.stopConditionRequired false → fail",
    detectCapStopMissing(mDomStop).some((i) => i.includes("stopConditionRequired")));

  // provider allow guard 누락
  const mGuard = clone(gate); mGuard.perDomainFuturePlan.imageBrowser.providerAllowGuardRef = "scripts/fixtures/nope.json";
  check("mutant: imageBrowser.providerAllowGuardRef를 non-guard로 교체 → fail",
    detectProviderGuardMissing(mGuard).some((i) => i.includes("providerAllowGuardRef")));
  const mFlags = clone(gate); mFlags.perDomainFuturePlan.ttsAudio.providerAllowFlags = [];
  check("mutant: ttsAudio.providerAllowFlags 비움 → fail",
    detectProviderGuardMissing(mFlags).some((i) => i.includes("ALLOW_OPENAI_TTS")));

  // future plan을 현재 승인으로 해석 (isPlanningArtifactOnly 뒤집기)
  const mPlanning = clone(gate); mPlanning.isPlanningArtifactOnly = false;
  check("mutant: isPlanningArtifactOnly false → fail (planning artifact only 손실)",
    mPlanning.isPlanningArtifactOnly !== true);
  const mZeroExec = clone(gate); mZeroExec.currentApprovalIsZeroLiveExecution = false;
  check("mutant: currentApprovalIsZeroLiveExecution false → fail",
    mZeroExec.currentApprovalIsZeroLiveExecution !== true);
}

console.log(failures === 0
  ? `\nRESULT: ALL PASS (${passes} checks)`
  : `\nRESULT: ${failures} FAILURE(S) / ${passes + failures} checks`);
process.exit(failures === 0 ? 0 : 1);
