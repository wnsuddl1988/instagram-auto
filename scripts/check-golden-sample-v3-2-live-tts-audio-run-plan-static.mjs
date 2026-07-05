#!/usr/bin/env node
/**
 * check-golden-sample-v3-2-live-tts-audio-run-plan-static.mjs
 *
 * Golden Sample v3.2 — live TTS/audio run plan 정적/preflight 가드.
 * task: golden-sample-v3-2-live-tts-audio-elevenlabs-run-v1
 *
 * 이 가드 자체는 no-live다: 레포 내 fixture JSON과 runner 소스 텍스트만 읽는다.
 * (TTS API/network/env-값/secret/write/subprocess/audio·video·image binary read 없음)
 *
 * 검증 대상:
 *   1) Owner 명시 승인 문구가 run plan에 정확히(문자 단위) 기록됨
 *   2) provider=ALLOW_ELEVENLABS, callCapMax=2, costCapUsdMax=1, 도메인 고정
 *   3) secret allowlist 정확히 [ELEVENLABS_API_KEY, ELEVENLABS_VOICE_ID] + no secret logging
 *   4) upload/render/mux/imageBrowser/ownerQa 미승인 flag 전부 false
 *   5) cost telemetry 부재 처리(hard call cap 프록시 + 즉시 중단) 문서화
 *   6) stop conditions(provider/cap/cost/gate/provenance/audit/allowlist) 완비
 *   7) 참조 12개 실재 + 승인 output dir가 manifest outDir와 일치 + 산출물 allowlist 정합
 *   8) runner 소스: TTS-only stage가 render/mux 앞에서 종료, env allowlist fail-closed,
 *      voice 단일키/model default 고정, Script Impact Gate가 TTS 앞, 단일 호출 지점,
 *      no retry, no upload, masked 로그만
 *   9) provenance 삼중 일치: audit contract v32AcceptedScores ↔ mux manifest selfAssessment
 *      ↔ audit sample plan provenance(scores 6 + hardFail 7, 전부 codex_judge)
 *  10) packet/gate 불변 (승격 없음) + future gate requiredFields 8개 매핑
 *  11) mutant: wrong provider / cap 3 / cost 2 / secret key 추가 / secret logging true /
 *      render·mux·upload true / gate 제거 / render 앞 종료 제거 / allowlist 변조 /
 *      호출 지점 추가 / provenance 점수 변조 / 승인 문구 변조·누락 → 전부 fail
 *
 * 전부 통과 시 exit 0 + PASS 카운트, 위반 시 exit 1.
 */
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const SELF = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SELF), "..");
const FX = (name) => path.join(ROOT, "scripts", "fixtures", name);
const J = (a, b) => a + b; // 토큰 분할-연결 (denylist self-scan 회피용, 검색 전용)

const PLAN_PATH = FX("golden_sample_v3_2_live_tts_audio_run_plan.t1_lifestyle_inflation.v1.json");
const PACKET_PATH = FX("golden_sample_v3_2_live_tts_audio_approval_packet.t1_lifestyle_inflation.v1.json");
const CONTRACT_PATH = FX("golden_sample_v3_2_tts_audio_audit_contract.v1.json");
const SAMPLE_PATH = FX("golden_sample_v3_2_tts_audio_audit_sample_plan.t1_lifestyle_inflation.v1.json");
const MANIFEST_PATH = FX("golden_sample_t1_lifestyle_inflation_tts_first_mux_manifest.v3_2.json");
const GATE_PATH = FX("golden_sample_v3_2_future_execution_plan_gate.v1.json");
const RUNNER_PATH = path.join(ROOT, "scripts", "run-golden-sample-chatgpt-playwright-v3-2-script-voice-mux-audit.mjs");

const EXACT_OWNER_APPROVAL =
  "APPROVE_LIVE_TTS_AUDIO: t1_lifestyle_inflation — provider=ALLOW_ELEVENLABS, call cap=2, cost cap=$1, allow selected provider env/secret read only for ELEVENLABS_API_KEY and ELEVENLABS_VOICE_ID with no secret logging, stop on provider error/cap exceeded/cost cap exceeded/script impact gate fail/provenance mismatch/audio artifact audit fail";
const ALLOWED_SECRET_KEYS = ["ELEVENLABS_API_KEY", "ELEVENLABS_VOICE_ID"];
const ENV_ALLOWLIST_3 = ["ELEVENLABS_API_KEY", "ELEVENLABS_VOICE_ID", "ALLOW_ELEVENLABS"];
const SCORE_KEYS = [
  "hook_self_relevance_score", "story_causality_score", "problem_solution_bridge_score",
  "solution_specificity_score", "save_worthiness_score", "spoken_naturalness_score",
];
const NOT_APPROVED_FLAG_KEYS = ["uploadApprovedNow", "renderApprovedNow", "muxApprovedNow", "imageBrowserApprovedNow", "ownerQaPassed"];
const REQUIRED_REF_KEYS = [
  "ttsApprovalPacket", "ttsApprovalPacketMd", "ttsAuditContract", "ttsAuditSamplePlan",
  "ttsAuditStandardHarness", "muxManifest", "futureExecutionPlanGate", "integratedReadinessContract",
  "liveRunner", "liveActionApprovalPacket", "providerAllowGuardPolicy", "uploadHardBlockPolicy",
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
const setEq = (a, b) => Array.isArray(a) && Array.isArray(b) && a.length === b.length &&
  [...a].sort().join("|") === [...b].sort().join("|");
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

const planF = loadJson("live TTS/audio run plan fixture", PLAN_PATH);
const packetF = loadJson("live TTS/audio approval packet", PACKET_PATH);
const contractF = loadJson("tts audio audit contract", CONTRACT_PATH);
const sampleF = loadJson("tts audio audit sample plan", SAMPLE_PATH);
const manifestF = loadJson("v3.2 tts-first mux manifest", MANIFEST_PATH);
const gateF = loadJson("future execution plan gate", GATE_PATH);

if (!planF.parsed || !packetF.parsed || !contractF.parsed || !sampleF.parsed || !manifestF.parsed || !gateF.parsed) {
  console.error(`\nRESULT: ${failures} FAILURE(S) / ${passes + failures} checks — core fixture unreadable, aborting`);
  process.exit(1);
}
const plan = planF.parsed;
const packet = packetF.parsed;
const contract = contractF.parsed;
const sample = sampleF.parsed;
const manifest = manifestF.parsed;
const gate = gateF.parsed;
const runnerSrc = readFileSync(RUNNER_PATH, "utf8");

// ── 순수 검증 함수 (mutant 재사용) ───────────────────────────────────────────
function detectApprovalDrift(p) {
  const issues = [];
  if (p.ownerApproval?.exactText !== EXACT_OWNER_APPROVAL) issues.push("ownerApproval.exactText가 Owner 승인 문구와 문자 단위 불일치/누락");
  if (p.provider !== "ALLOW_ELEVENLABS") issues.push(`provider "${p.provider}" != ALLOW_ELEVENLABS`);
  if (p.topicId !== "t1_lifestyle_inflation") issues.push("topicId 불일치");
  if (p.callCapMax !== 2) issues.push(`callCapMax "${p.callCapMax}" != 2`);
  if (!(typeof p.callCapMax === "number" && p.callCapMax <= 2)) issues.push("callCapMax > 2 (승인 초과)");
  if (p.costCapUsdMax !== 1) issues.push(`costCapUsdMax "${p.costCapUsdMax}" != 1`);
  if (!(typeof p.costCapUsdMax === "number" && p.costCapUsdMax <= 1)) issues.push("costCapUsdMax > 1 (승인 초과)");
  if (p.approvedDomain !== "tts_audio_generation") issues.push(`approvedDomain "${p.approvedDomain}" != tts_audio_generation`);
  return issues;
}
function detectSecretScopeDrift(p) {
  const issues = [];
  if (!setEq(p.selectedProviderSecretKeysAllowed, ALLOWED_SECRET_KEYS)) {
    issues.push(`selectedProviderSecretKeysAllowed != [${ALLOWED_SECRET_KEYS.join(",")}] (실제 ${JSON.stringify(p.selectedProviderSecretKeysAllowed)})`);
  }
  if (p.nonSecretAllowFlag !== "ALLOW_ELEVENLABS") issues.push("nonSecretAllowFlag != ALLOW_ELEVENLABS");
  if (p.secretLoggingAllowed !== false) issues.push(`secretLoggingAllowed=${p.secretLoggingAllowed} (false 아님)`);
  if (p.secretHandling?.maskedVoiceIdAllowed !== true) issues.push("maskedVoiceIdAllowed != true");
  const fr = (p.secretHandling?.forbiddenEnvReads ?? []).join(" | ");
  if (!fr.includes("ELEVENLABS_MODEL_ID")) issues.push("forbiddenEnvReads에 ELEVENLABS_MODEL_ID 누락");
  return issues;
}
function detectDomainEscalation(p) {
  const issues = [];
  for (const k of NOT_APPROVED_FLAG_KEYS) if (p[k] !== false) issues.push(`${k}=${p[k]} (false 아님)`);
  return issues;
}
function detectCostHandlingDrift(p) {
  const issues = [];
  const c = p.costCapHandling ?? {};
  if (c.providerCostTelemetry !== "MAY_BE_UNAVAILABLE") issues.push("providerCostTelemetry != MAY_BE_UNAVAILABLE");
  if (!isStr(c.hardControl) || !c.hardControl.includes("2")) issues.push("hardControl(call cap 2 프록시) 누락");
  if (c.immediateStopOnCostSignal !== true) issues.push("immediateStopOnCostSignal != true");
  return issues;
}
function detectStopMissing(p) {
  const issues = [];
  if (!isStrArr(p.stopConditions)) issues.push("stopConditions 비어있음/누락");
  const joined = (p.stopConditions ?? []).join(" | ");
  for (const tok of ["provider", "cap 2", "cost cap", "Script Impact Gate", "provenance mismatch", "audio artifact audit", "allowlist"]) {
    if (!joined.includes(tok)) issues.push(`stopConditions에 "${tok}" 누락`);
  }
  return issues;
}
function detectOutputPolicyDrift(p, m) {
  const issues = [];
  if (p.approvedOutputDir !== m.outputPaths?.outDir) issues.push("approvedOutputDir가 manifest outDir와 불일치");
  if (!/^C:\\tmp\\/i.test(p.approvedOutputDir ?? "")) issues.push("approvedOutputDir가 C:\\tmp 하위 아님");
  const op = p.outputPolicy ?? {};
  const manifestArtifacts = [
    m.outputPaths?.narrationAudio, m.outputPaths?.alignmentRaw, m.outputPaths?.timingSummary,
    m.outputPaths?.scriptPreview, m.outputPaths?.captionTimeline, m.outputPaths?.scriptImpactGateReport,
  ];
  if (!setEq(op.allowedArtifacts, manifestArtifacts)) issues.push("allowedArtifacts가 manifest 산출물 6개와 불일치");
  const forb = (op.forbiddenArtifactsThisSlice ?? []).join(" | ");
  for (const tok of ["visual mp4", "mux mp4", "frames"]) if (!forb.includes(tok)) issues.push(`forbiddenArtifacts에 "${tok}" 누락`);
  if (op.doNotStageTmpOutputs !== true) issues.push("doNotStageTmpOutputs != true");
  if (!isStr(op.repoManifestUpdateAllowed) || !op.repoManifestUpdateAllowed.includes("uploadReady")) issues.push("repo manifest 갱신 조건(uploadReady:false 유지) 누락");
  return issues;
}
function detectGateComplianceGap(p) {
  const issues = [];
  const map = p.futureGateComplianceMap ?? {};
  for (const tok of GATE_REQUIRED_FIELD_TOKENS) if (!isStr(map[tok])) issues.push(`futureGateComplianceMap.${tok} 누락`);
  return issues;
}
function detectProvenanceMismatch(c, m, s) {
  const issues = [];
  const cScores = c.scriptImpactGateStandard?.v32AcceptedScores ?? {};
  const cReq = c.scriptImpactGateStandard?.requiredScores ?? {};
  const mSelf = m.scriptImpactGate?.selfAssessment ?? {};
  const mReq = m.scriptImpactGate?.required ?? {};
  const sScores = s.scriptImpactGate?.scores ?? {};
  const sReq = s.scriptImpactGate?.requiredScores ?? {};
  const provScores = s.scriptImpactGate?.provenance?.scores ?? [];
  const provHard = s.scriptImpactGate?.provenance?.hardFailChecks ?? [];
  for (const k of SCORE_KEYS) {
    if (!(cScores[k] === mSelf[k] && mSelf[k] === sScores[k])) {
      issues.push(`score ${k} 삼중 불일치 (contract=${cScores[k]} manifest=${mSelf[k]} sample=${sScores[k]})`);
    }
    if (!(cReq[k] === mReq[k] && mReq[k] === sReq[k])) issues.push(`required ${k} 삼중 불일치`);
    const pe = provScores.find((x) => x.scoreKey === k);
    if (!pe || pe.value !== mSelf[k] || pe.authority !== "codex_judge") issues.push(`provenance score ${k} 누락/값 불일치/authority 위반`);
  }
  const mHard = m.scriptImpactGate?.hardFailCheck ?? {};
  const hardKeys = Object.keys(mHard);
  if (hardKeys.length !== 7) issues.push(`manifest hardFailCheck ${hardKeys.length}개 != 7`);
  for (const k of hardKeys) if (mHard[k] !== false) issues.push(`manifest hardFail ${k} != false`);
  if (provHard.length !== 7) issues.push(`provenance hardFailChecks ${provHard.length}개 != 7`);
  for (const h of provHard) if (h.value !== false || h.authority !== "codex_judge") issues.push(`provenance hardFail ${h.checkKey} value/authority 위반`);
  return issues;
}
function detectRunnerIssues(src) {
  const issues = [];
  if (!src.includes("--stage") || !src.includes("tts-audio-only")) issues.push("--stage tts-audio-only 파싱 없음");
  if (!/TTS_ONLY_ENV_ALLOWLIST\s*=\s*\[\s*"ELEVENLABS_API_KEY",\s*"ELEVENLABS_VOICE_ID",\s*"ALLOW_ELEVENLABS"\s*\]/.test(src)) {
    issues.push("env allowlist 상수(정확 3키) 없음/변조");
  }
  if (!src.includes("!TTS_ONLY_ENV_ALLOWLIST.includes(k)")) issues.push("env 접근 fail-closed 차단 없음");
  if (!src.includes("for (const k of TTS_ONLY_ENV_ALLOWLIST) if (k in result)")) issues.push("envLocal allowlist 필터 없음");
  if (!src.includes('TTS_AUDIO_ONLY ? ["ELEVENLABS_VOICE_ID"]')) issues.push("TTS-only voice 단일키 강제 없음");
  if (!src.includes("TTS_AUDIO_ONLY ? cfg.tts.modelIdDefault")) issues.push("TTS-only model default 고정 없음");
  const gateIdx = src.indexOf("Script Impact Gate FAIL");
  const ttsIdx = src.indexOf("await stageTts()");
  if (!(gateIdx > -1 && ttsIdx > -1 && gateIdx < ttsIdx)) issues.push("Script Impact Gate가 TTS stage 호출 앞에 없음");
  const stopIdx = src.indexOf("TTS_AUDIO_ONLY_STOP_BEFORE_RENDER_MUX");
  const renderCallIdx = src.indexOf("= renderVisual(R)"); // 함수 정의가 아닌 호출 지점 기준
  if (!(stopIdx > -1 && renderCallIdx > -1 && stopIdx < renderCallIdx)) issues.push("render/mux 앞 TTS-only 종료 지점 없음");
  const callSites = src.split(J("fet", "ch(")).length - 1;
  if (callSites !== 1) issues.push(`provider 호출 지점 ${callSites}개 != 1 (단일 호출 지점 위반)`);
  if (!src.includes("no retry")) issues.push("no retry 명시 없음");
  if (src.includes("/api/upload")) issues.push("upload 엔드포인트 참조 발견");
  if (!src.includes("mask(voiceId)")) issues.push("voice id mask 로깅 없음");
  if (!src.includes("${!!apiKey}")) issues.push("apiKey boolean 로깅 아님");
  if (!src.includes("must be under C:")) issues.push("out-dir C:\\tmp 강제 없음");
  if (!src.includes("uploadReady: false")) issues.push("uploadReady:false 기록 없음");
  return issues;
}

// ── 1. Owner 승인 / provider / cap / secret allowlist ────────────────────────
{
  check("plan schemaVersion + status = LIVE_TTS_AUDIO_RUN_PLAN_APPROVED_SCOPED",
    plan.schemaVersion === "golden_sample_live_tts_audio_run_plan_v1" &&
    plan.status === "LIVE_TTS_AUDIO_RUN_PLAN_APPROVED_SCOPED");
  check("plan Owner 승인 문구 정확히 기록 + provider/topicId/callCap 2/costCap 1/도메인 고정",
    detectApprovalDrift(plan).length === 0, detectApprovalDrift(plan).join("; "));
  check("plan secret allowlist 정확히 2키 + no secret logging + MODEL_ID 금지 명시",
    detectSecretScopeDrift(plan).length === 0, detectSecretScopeDrift(plan).join("; "));
  check("plan upload/render/mux/imageBrowser/ownerQa 미승인 flag 전부 false",
    detectDomainEscalation(plan).length === 0, detectDomainEscalation(plan).join("; "));
  check("plan cost telemetry 부재 처리 문서화 (hard call cap 프록시 + 즉시 중단)",
    detectCostHandlingDrift(plan).length === 0, detectCostHandlingDrift(plan).join("; "));
  check("plan callCapEnforcement: 단일 호출 지점/no retry/재사용 우선/invocation 1회",
    plan.callCapEnforcement?.perInvocationMaxCalls === 1 && plan.callCapEnforcement?.retry === false &&
    plan.callCapEnforcement?.reuseExistingAudioIfPresent === true && plan.callCapEnforcement?.approvedInvocations === 1);
}

// ── 2. stop conditions + audit + output policy ──────────────────────────────
{
  check("plan stopConditions 완비 (provider/cap/cost/gate/provenance/audit/allowlist)",
    detectStopMissing(plan).length === 0, detectStopMissing(plan).join("; "));
  check("plan audioArtifactAudit: 필수 + tailHold 이연 + threshold source + failAction",
    plan.audioArtifactAudit?.requiredForCompletion === true && plan.audioArtifactAudit?.tailHoldDeferred === true &&
    isStr(plan.audioArtifactAudit?.thresholdsSource) && isStr(plan.audioArtifactAudit?.failAction) &&
    plan.audioArtifactAudit.failAction.includes("금지"));
  check("plan approvedOutputDir=manifest outDir + 산출물 allowlist 6개 정합 + 금지 산출물 명시",
    detectOutputPolicyDrift(plan, manifest).length === 0, detectOutputPolicyDrift(plan, manifest).join("; "));
  check("plan executionCommand: transient env 1회 + --stage tts-audio-only + --allow-live-tts",
    plan.executionCommand?.transientEnvOnly === true && plan.executionCommand?.runCount === 1 &&
    plan.executionCommand?.noOtherProviderFlags === true && plan.executionCommand?.envLocalModification === false &&
    isStr(plan.executionCommand?.powerShellPattern) &&
    plan.executionCommand.powerShellPattern.includes("ALLOW_ELEVENLABS='1'") &&
    plan.executionCommand.powerShellPattern.includes("--stage tts-audio-only") &&
    plan.executionCommand.powerShellPattern.includes("--allow-live-tts"));
  check("plan preRunOutputState 내적 정합 (narration 존재 → 예상 live 호출 0)",
    plan.preRunOutputState?.narrationExists === true && plan.preRunOutputState?.alignmentExists === true &&
    plan.preRunOutputState?.expectedLiveApiCallsThisRun === 0 && isStr(plan.preRunOutputState?.expectedBehaviorNote));
}

// ── 3. 참조 실재 + gate compliance ───────────────────────────────────────────
{
  const refs = plan.references ?? {};
  const missingKeys = REQUIRED_REF_KEYS.filter((k) => !isStr(refs[k]));
  check("plan references 12개 key 전부 존재", missingKeys.length === 0, `missing=${missingKeys.join(",")}`);
  const refPaths = REQUIRED_REF_KEYS.map((k) => refs[k]).filter(isStr);
  const missingFiles = refPaths.filter((r) => !existsSync(path.join(ROOT, r)));
  check("plan references 대상 파일 전부 레포 실재", refPaths.length >= 12 && missingFiles.length === 0, `missing=${missingFiles.join(",")}`);
  check("plan futureGateComplianceMap: gate requiredFields 8개 전부 매핑",
    detectGateComplianceGap(plan).length === 0, detectGateComplianceGap(plan).join("; "));
  const gateTokens = (gate.futureApprovalRequirements?.requiredFields ?? []);
  check("cross-check: gate requiredFields 8개 토큰이 실제 gate fixture와 일치",
    GATE_REQUIRED_FIELD_TOKENS.every((t) => gateTokens.some((f) => f.includes(t))));
  check("plan ownerQaSeparation PENDING + uploadHardBlock active + policyRef 실재",
    plan.ownerQaSeparation?.ownerViewingListeningActualStatus === "PENDING_DIRECT_OWNER_REVIEW" &&
    plan.ownerQaSeparation?.ownerQaPassed === false && plan.uploadHardBlock?.active === true &&
    existsSync(path.join(ROOT, plan.uploadHardBlock?.policyRef ?? "")));
  check("plan prohibitedInterpretations/forbiddenBehavior: 도메인 확장/secret 확장/clone/재생성 강제 금지 포함",
    Array.isArray(plan.prohibitedInterpretations) &&
    plan.prohibitedInterpretations.some((s) => s.includes("render/mux/upload")) &&
    plan.prohibitedInterpretations.some((s) => s.includes("재생성")) &&
    Array.isArray(plan.forbiddenBehavior) &&
    plan.forbiddenBehavior.some((s) => s.includes("clone")) &&
    plan.forbiddenBehavior.some((s) => s.includes("commit/push")) &&
    plan.forbiddenBehavior.some((s) => s.includes("secret")));
}

// ── 4. manifest 계약 정합 (cap 2 / guard / one-shot / no retry) ──────────────
{
  const t = manifest.tts ?? {};
  check("manifest tts: allowEnvKey=ALLOW_ELEVENLABS + allowCliFlag=--allow-live-tts",
    t.allowEnvKey === "ALLOW_ELEVENLABS" && t.allowCliFlag === "--allow-live-tts");
  check("manifest tts: provider elevenlabs + one-shot 전략 + scene-by-scene 금지 + live guard 필수",
    t.provider === "elevenlabs" && t.strategy === "full_narration_one_shot" &&
    isStr(t.sceneLevelShortTts) && t.sceneLevelShortTts.includes("금지") && t.requireLiveTtsGuard === true);
  check("triple cap 일치: plan callCapMax=2 = manifest apiCallBudgetMax = boundary.elevenLabsCallsMax",
    plan.callCapMax === 2 && t.apiCallBudgetMax === 2 && manifest.boundary?.elevenLabsCallsMax === 2);
  check("manifest tts: retry=false + reuseExistingAudioIfPresent=true + modelIdDefault 존재",
    t.retry === false && t.reuseExistingAudioIfPresent === true && isStr(t.modelIdDefault));
  check("manifest boundary: noUpload/noLiveTtsBeforeScriptGate/noKeyValueInLogsOrFiles/noEnvSecretModification/uploadReady=false",
    manifest.boundary?.noUpload === true && manifest.boundary?.noLiveTtsBeforeScriptGate === true &&
    manifest.boundary?.noKeyValueInLogsOrFiles === true && manifest.boundary?.noEnvSecretModification === true &&
    manifest.boundary?.uploadReady === false);
}

// ── 5. provenance 삼중 일치 (mismatch = live 호출 전 중단) ────────────────────
{
  check("provenance 삼중 일치: contract v32AcceptedScores = manifest selfAssessment = sample plan provenance (6점수+7hardfail, 전부 codex_judge)",
    detectProvenanceMismatch(contract, manifest, sample).length === 0,
    detectProvenanceMismatch(contract, manifest, sample).join("; "));
  check("plan scriptImpactGateProvenance: codex_judge + 삼중 일치 규칙 + 6/7 카운트 기록",
    plan.scriptImpactGateProvenance?.requiredAuthority === "codex_judge" &&
    plan.scriptImpactGateProvenance?.requiredScoreProvenanceCount === 6 &&
    plan.scriptImpactGateProvenance?.requiredHardFailProvenanceCount === 7 &&
    isStr(plan.scriptImpactGateProvenance?.tripleMatchRule));
}

// ── 6. packet/gate 불변 (승격 없음) ──────────────────────────────────────────
{
  check("packet 불변: liveTtsAudioApprovedNow=false 유지 (packet은 준비물, 이 plan이 승인 기록)",
    packet.currentApprovalFlags?.liveTtsAudioApprovedNow === false && packet.approvalGrantedNow === false);
  check("packet cross: allowedFutureProviders에 ALLOW_ELEVENLABS 포함 + apiCallBudgetMaxReference=2",
    (packet.ttsAudioApprovalTemplate?.allowedFutureProviders ?? []).includes("ALLOW_ELEVENLABS") &&
    packet.ttsAudioApprovalTemplate?.suggestedCaps?.apiCallBudgetMaxReference === 2);
  check("gate 불변: currentApprovalFlags 전부 false 유지 (gate는 planning artifact)",
    gate.isPlanningArtifactOnly === true &&
    Object.values(gate.currentApprovalFlags ?? {}).every((v) => v === false));
}

// ── 7. runner 소스 안전성 (TTS-only 경계 + env allowlist + gate 순서) ─────────
{
  const issues = detectRunnerIssues(runnerSrc);
  check("runner: TTS-only stage/env allowlist/gate 순서/단일 호출/no retry/no upload/masked 로그 전부 충족",
    issues.length === 0, issues.join("; "));
  check("runner: TTS-only에서 overlays/frames 디렉터리 미생성 (render 전용)",
    runnerSrc.includes("if (!TTS_AUDIO_ONLY) {"));
  check("runner: audio-only artifact audit 존재 + FAIL 시 중단(exit 31) + tailHold 이연",
    runnerSrc.includes("tts_audio_only_artifact_audit_v3_2") &&
    runnerSrc.includes("audio artifact audit FAIL") &&
    runnerSrc.includes("DEFERRED_TO_MUX_SLICE"));
  check("runner: timing summary에 audit 포함 (stage: tts-audio-only 마킹)",
    runnerSrc.includes('stage: "tts-audio-only", audioArtifactAuditTtsOnly: ttsOnlyAudioAudit'));
}

// ── 8. 가드 self 소스 스캔 + import allowlist ────────────────────────────────
{
  const execTokens = [J("child_", "process"), J("spawn", "("), J("exec", "("), J("ff", "mpeg"), J("ff", "probe"),
    J("silence", "detect"), J("process", ".env"), J("fet", "ch("), J("chromium", ".launch"), J("page", ".goto"),
    J("write", "File"), J("append", "File"), J("mk", "dir"), J("rm", "Sync"), J("un", "link")];
  const selfSrc = readFileSync(SELF, "utf8");
  const hit = execTokens.find((t) => selfSrc.includes(t));
  check("no forbidden live/env/write pattern in guard script (self)", !hit, hit ? `token=${hit}` : "");
  check("no forbidden live/env/write pattern in run plan fixture", !execTokens.some((t) => planF.raw.includes(t)));
  const specifiers = [...selfSrc.matchAll(/^import\s[^\n]*?from\s+["']([^"']+)["']/gm)].map((m) => m[1]);
  const allow = new Set(["node:fs", "node:path", "node:url"]);
  check("guard imports restricted to node:fs/node:path/node:url",
    specifiers.length > 0 && specifiers.every((s) => allow.has(s)), `bad=${specifiers.filter((s) => !allow.has(s)).join(",")}`);
  console.log("NOTE  scanner holds forbidden tokens split-concatenated only (denylist exception per HANDOFF)");
}

// ── 9. in-memory mutant — fail-closed 확인 ───────────────────────────────────
{
  const truthy = 1 === 1;
  const mProvider = clone(plan); mProvider.provider = "ALLOW_OPENAI_TTS";
  check("mutant: provider를 ALLOW_OPENAI_TTS로 변조 → fail",
    detectApprovalDrift(mProvider).some((i) => i.includes("provider")));
  const mCap = clone(plan); mCap.callCapMax = 3;
  check("mutant: callCapMax 3 (>2) → fail",
    detectApprovalDrift(mCap).some((i) => i.includes("callCapMax")));
  const mCost = clone(plan); mCost.costCapUsdMax = 2;
  check("mutant: costCapUsdMax 2 (>1) → fail",
    detectApprovalDrift(mCost).some((i) => i.includes("costCapUsdMax")));
  const mText = clone(plan); mText.ownerApproval.exactText = mText.ownerApproval.exactText.replace("cap=2", "cap=9");
  check("mutant: Owner 승인 문구 변조(cap=9) → fail",
    detectApprovalDrift(mText).some((i) => i.includes("exactText")));
  const mTextGone = clone(plan); delete mTextGone.ownerApproval.exactText;
  check("mutant: Owner 승인 문구 누락 → fail",
    detectApprovalDrift(mTextGone).some((i) => i.includes("exactText")));
  const mDomain = clone(plan); mDomain.approvedDomain = "render_mux";
  check("mutant: approvedDomain을 render_mux로 변조 → fail",
    detectApprovalDrift(mDomain).some((i) => i.includes("approvedDomain")));
  const mKey = clone(plan); mKey.selectedProviderSecretKeysAllowed = [...ALLOWED_SECRET_KEYS, "ELEVENLABS_MODEL_ID"];
  check("mutant: secret allowlist에 ELEVENLABS_MODEL_ID 추가 → fail",
    detectSecretScopeDrift(mKey).some((i) => i.includes("selectedProviderSecretKeysAllowed")));
  const mLog = clone(plan); mLog.secretLoggingAllowed = truthy;
  check("mutant: secretLoggingAllowed true → fail",
    detectSecretScopeDrift(mLog).some((i) => i.includes("secretLoggingAllowed")));
  const mUp = clone(plan); mUp.uploadApprovedNow = truthy;
  check("mutant: uploadApprovedNow true → fail",
    detectDomainEscalation(mUp).some((i) => i.includes("uploadApprovedNow")));
  const mRen = clone(plan); mRen.renderApprovedNow = truthy;
  check("mutant: renderApprovedNow true → fail",
    detectDomainEscalation(mRen).some((i) => i.includes("renderApprovedNow")));
  const mMux = clone(plan); mMux.muxApprovedNow = truthy;
  check("mutant: muxApprovedNow true → fail",
    detectDomainEscalation(mMux).some((i) => i.includes("muxApprovedNow")));
  const mStop = clone(plan); mStop.stopConditions = mStop.stopConditions.filter((s) => !s.includes("provenance mismatch"));
  check("mutant: provenance mismatch stop 조건 제거 → fail",
    detectStopMissing(mStop).some((i) => i.includes("provenance mismatch")));
  const mCostSig = clone(plan); mCostSig.costCapHandling.immediateStopOnCostSignal = false;
  check("mutant: immediateStopOnCostSignal false → fail",
    detectCostHandlingDrift(mCostSig).some((i) => i.includes("immediateStopOnCostSignal")));
  const mOut = clone(plan); mOut.outputPolicy.forbiddenArtifactsThisSlice = ["frames"];
  check("mutant: forbiddenArtifacts에서 mux mp4 제거 → fail",
    detectOutputPolicyDrift(mOut, manifest).some((i) => i.includes("mux mp4")));
  const mGateMap = clone(plan); delete mGateMap.futureGateComplianceMap.costCapUsdMax;
  check("mutant: futureGateComplianceMap.costCapUsdMax 누락 → fail",
    detectGateComplianceGap(mGateMap).some((i) => i.includes("costCapUsdMax")));
  const mProv = clone(manifest); mProv.scriptImpactGate.selfAssessment.save_worthiness_score = 95;
  check("mutant: manifest 점수 변조(89→95) → provenance mismatch fail",
    detectProvenanceMismatch(contract, mProv, sample).some((i) => i.includes("save_worthiness_score")));
  const mHardTrue = clone(sample); mHardTrue.scriptImpactGate.provenance.hardFailChecks[0].value = truthy;
  check("mutant: sample plan hardFail provenance true → fail",
    detectProvenanceMismatch(contract, manifest, mHardTrue).length > 0);
  const srcNoGate = runnerSrc.replace("Script Impact Gate FAIL", "GATE_REMOVED");
  check("mutant: runner에서 Script Impact Gate 제거 → fail",
    detectRunnerIssues(srcNoGate).some((i) => i.includes("Script Impact Gate")));
  const srcNoStop = runnerSrc.replace("TTS_AUDIO_ONLY_STOP_BEFORE_RENDER_MUX", "STOP_REMOVED");
  check("mutant: runner에서 render/mux 앞 종료 지점 제거 → fail",
    detectRunnerIssues(srcNoStop).some((i) => i.includes("종료 지점")));
  const srcBadAllow = runnerSrc.replace('"ELEVENLABS_VOICE_ID", "ALLOW_ELEVENLABS"]', '"ELEVENLABS_VOICE_ID", "ELEVENLABS_MODEL_ID", "ALLOW_ELEVENLABS"]');
  check("mutant: runner env allowlist에 MODEL_ID 추가 → fail",
    detectRunnerIssues(srcBadAllow).some((i) => i.includes("allowlist 상수")));
  const srcTwoCalls = runnerSrc + "\n// " + J("fet", "ch(") + ")";
  check("mutant: runner에 두 번째 호출 지점 추가 → fail",
    detectRunnerIssues(srcTwoCalls).some((i) => i.includes("호출 지점")));
}

console.log(failures === 0
  ? `\nRESULT: ALL PASS (${passes} checks)`
  : `\nRESULT: ${failures} FAILURE(S) / ${passes + failures} checks`);
process.exit(failures === 0 ? 0 : 1);
