#!/usr/bin/env node
/**
 * check-golden-sample-v3-2-live-render-mux-run-plan-static.mjs
 *
 * Golden Sample v3.2 — live render/mux run plan 정적/preflight 가드.
 * task: golden-sample-v3-2-live-render-mux-run-v1
 *
 * 이 가드 자체는 no-live다: 레포 내 fixture JSON과 runner 소스 텍스트만 읽는다.
 * (render/mux/Pillow/probe 실행, network, env 값 read, write, subprocess 없음)
 *
 * 검증 대상:
 *   1) Owner 명시 승인 문구가 run plan에 정확히(문자 단위) 기록됨
 *   2) approvedDomain=local_render_mux_artifact_audit, renderCap 1 / muxCap 1 / cost $0
 *   3) image 재생성/TTS 재생성/외부 API/env·secret read/upload/ownerQa 전부 false
 *   4) accepted 입력 재사용 전용(9 images md5 gate + 기존 narration/alignment/timing)
 *   5) stop conditions: font vendoring/safe-frame/overlay-spec/audio audit/media probe/
 *      caption-card/story/render error/mux error 전부 명시
 *   6) 참조 실재 + 승인 output dir=manifest outDir + 산출물 allowlist 정합
 *   7) runner 소스: render-mux-only stage + --allow-render-mux 명시 승인 gate,
 *      stageTts 미진입(reuse gate), .env.local 파싱 생략 + env() 전면 차단,
 *      pre-output gates(font/safe-frame)가 Pillow 실행 앞, audit fail-closed,
 *      render/mux 호출 지점 각 1개, 원격 호출 지점 1개(TTS stage 내부, 도달 불가),
 *      tts-audio-only 동작 보존
 *   8) safe-frame 임계값이 pillow renderer contract와 일치 (드리프트 방지)
 *   9) mutant: 승인 문구 변조/누락, 도메인 확장, cap/cost 드리프트, 미승인 flag true,
 *      stop 누락, runner 승인 gate/env 차단/reuse gate/pre-output/audit fail-closed 제거,
 *      render·mux 2차 호출 지점 추가 → 전부 fail
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

const PLAN_PATH = FX("golden_sample_v3_2_live_render_mux_run_plan.t1_lifestyle_inflation.v1.json");
const PILLOW_PATH = FX("golden_sample_v3_2_pillow_renderer_contract.v1.json");
const MANIFEST_PATH = FX("golden_sample_t1_lifestyle_inflation_tts_first_mux_manifest.v3_2.json");
const RENDER_MANIFEST_PATH = FX("golden_sample_t1_lifestyle_inflation_visual_render_manifest.v3_2_tts_anchored.json");
const TTS_PLAN_PATH = FX("golden_sample_v3_2_live_tts_audio_run_plan.t1_lifestyle_inflation.v1.json");
const GATE_PATH = FX("golden_sample_v3_2_future_execution_plan_gate.v1.json");
const RUNNER_PATH = path.join(ROOT, "scripts", "run-golden-sample-chatgpt-playwright-v3-2-script-voice-mux-audit.mjs");

const EXACT_OWNER_APPROVAL =
  "APPROVE_RENDER + APPROVE_MUX: t1_lifestyle_inflation — render cap=1, mux cap=1, cost cap=$0, use existing accepted 9 images and existing accepted ElevenLabs narration/alignment/timing only, no image regeneration, no TTS regeneration, allow Pillow/frame render + ffmpeg/ffprobe mux/artifact audit only, stop on font vendoring fail/safe-frame fail/overlay-spec fail/audio artifact audit fail/media probe fail/caption-card gate fail/story gate fail/render or mux error";
const NOT_APPROVED_FLAG_KEYS = [
  "imageRegenerationApprovedNow", "ttsRegenerationApprovedNow", "externalApiApprovedNow",
  "envSecretReadApprovedNow", "uploadApprovedNow", "ownerQaPassed",
];
const STOP_TOKENS = ["font vendoring", "safe-frame", "overlay-spec", "audio artifact audit", "media probe", "caption-card", "story gate", "render error", "mux error"];
const REQUIRED_REF_KEYS = [
  "acceptedImageRunPlan", "acceptedTtsAudioRunPlan", "pillowRendererContract", "pillowRendererSamplePlan",
  "pillowRendererStandardHarness", "ttsAuditContract", "muxManifest", "visualRenderManifest",
  "futureExecutionPlanGate", "integratedReadinessContract", "liveRunner", "liveActionApprovalPacket",
  "providerAllowGuardPolicy", "uploadHardBlockPolicy",
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
const count = (hay, needle) => hay.split(needle).length - 1;

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

const planF = loadJson("live render/mux run plan fixture", PLAN_PATH);
const pillowF = loadJson("pillow renderer contract", PILLOW_PATH);
const manifestF = loadJson("v3.2 tts-first mux manifest", MANIFEST_PATH);
const renderManifestF = loadJson("v3.2 visual render manifest (repo)", RENDER_MANIFEST_PATH);
const ttsPlanF = loadJson("live tts/audio run plan (prior slice)", TTS_PLAN_PATH);
const gateF = loadJson("future execution plan gate", GATE_PATH);

if (!planF.parsed || !pillowF.parsed || !manifestF.parsed || !renderManifestF.parsed || !ttsPlanF.parsed || !gateF.parsed) {
  console.error(`\nRESULT: ${failures} FAILURE(S) / ${passes + failures} checks — core fixture unreadable, aborting`);
  process.exit(1);
}
const plan = planF.parsed;
const pillow = pillowF.parsed;
const manifest = manifestF.parsed;
const renderManifest = renderManifestF.parsed;
const ttsPlan = ttsPlanF.parsed;
const gate = gateF.parsed;
const runnerSrc = readFileSync(RUNNER_PATH, "utf8");

// ── 순수 검증 함수 (mutant 재사용) ───────────────────────────────────────────
function detectApprovalDrift(p) {
  const issues = [];
  if (p.ownerApproval?.exactText !== EXACT_OWNER_APPROVAL) issues.push("ownerApproval.exactText가 Owner 승인 문구와 문자 단위 불일치/누락");
  if (p.approvedDomain !== "local_render_mux_artifact_audit") issues.push(`approvedDomain "${p.approvedDomain}" != local_render_mux_artifact_audit`);
  if (p.topicId !== "t1_lifestyle_inflation") issues.push("topicId 불일치");
  if (p.renderCapMax !== 1) issues.push(`renderCapMax "${p.renderCapMax}" != 1`);
  if (!(typeof p.renderCapMax === "number" && p.renderCapMax <= 1)) issues.push("renderCapMax > 1 (승인 초과)");
  if (p.muxCapMax !== 1) issues.push(`muxCapMax "${p.muxCapMax}" != 1`);
  if (!(typeof p.muxCapMax === "number" && p.muxCapMax <= 1)) issues.push("muxCapMax > 1 (승인 초과)");
  if (p.costCapUsdMax !== 0) issues.push(`costCapUsdMax "${p.costCapUsdMax}" != 0`);
  return issues;
}
function detectDomainEscalation(p) {
  const issues = [];
  for (const k of NOT_APPROVED_FLAG_KEYS) if (p[k] !== false) issues.push(`${k}=${p[k]} (false 아님)`);
  return issues;
}
function detectStopMissing(p) {
  const issues = [];
  if (!isStrArr(p.stopConditions)) issues.push("stopConditions 비어있음/누락");
  const joined = (p.stopConditions ?? []).join(" | ");
  for (const tok of STOP_TOKENS) if (!joined.includes(tok)) issues.push(`stopConditions에 "${tok}" 누락`);
  return issues;
}
function detectInputDrift(p) {
  const issues = [];
  const ai = p.approvedInputs ?? {};
  for (const k of ["acceptedImageSet", "acceptedNarration", "acceptedAlignment", "acceptedTiming", "overlaySpecSource", "reuseOnlyRule"]) {
    if (!isStr(ai[k])) issues.push(`approvedInputs.${k} 누락`);
  }
  if (isStr(ai.acceptedImageSet) && !ai.acceptedImageSet.includes("md5")) issues.push("acceptedImageSet에 md5 gate 명시 누락");
  if (isStr(ai.reuseOnlyRule) && !ai.reuseOnlyRule.includes("중단")) issues.push("reuseOnlyRule에 fail-closed 중단 명시 누락");
  const ce = p.capEnforcement ?? {};
  if (ce.perInvocationRenders !== 1 || ce.perInvocationMuxes !== 1 || ce.approvedInvocations !== 1) issues.push("capEnforcement per-invocation/invocation 카운트 != 1");
  if (ce.retry !== false) issues.push("capEnforcement.retry != false");
  if (ce.singleRenderCallSite !== true || ce.singleMuxCallSite !== true) issues.push("단일 render/mux 호출 지점 명시 누락");
  return issues;
}
function detectExecCommandDrift(p) {
  const issues = [];
  const ec = p.executionCommand ?? {};
  if (!isStr(ec.pattern) || !ec.pattern.includes("--stage render-mux-only") || !ec.pattern.includes("--allow-render-mux")) {
    issues.push("executionCommand.pattern에 --stage render-mux-only / --allow-render-mux 누락");
  }
  if (isStr(ec.pattern) && (ec.pattern.includes("--allow-live-tts") || ec.pattern.includes("ALLOW_ELEVENLABS"))) {
    issues.push("executionCommand.pattern에 TTS/provider flag 혼입");
  }
  if (ec.runCount !== 1) issues.push("runCount != 1");
  if (ec.noEnvVarsSet !== true || ec.noProviderFlags !== true || ec.noLiveTtsFlag !== true) issues.push("noEnvVarsSet/noProviderFlags/noLiveTtsFlag != true");
  if (ec.envLocalModification !== false) issues.push("envLocalModification != false");
  if (p.liveRunner?.stageFlag !== "--stage render-mux-only" || p.liveRunner?.allowCliFlag !== "--allow-render-mux") issues.push("liveRunner stage/allow flag 불일치");
  return issues;
}
function detectOutputPolicyDrift(p, m) {
  const issues = [];
  if (p.approvedOutputDir !== m.outputPaths?.outDir) issues.push("approvedOutputDir가 manifest outDir와 불일치");
  if (!/^C:\\tmp\\/i.test(p.approvedOutputDir ?? "")) issues.push("approvedOutputDir가 C:\\tmp 하위 아님");
  const op = p.outputPolicy ?? {};
  const joined = (op.allowedArtifacts ?? []).join(" | ");
  for (const key of ["visualMp4", "muxMp4", "auditReport", "timingSummary", "captionTimeline", "scriptPreview", "scriptImpactGateReport"]) {
    const v = m.outputPaths?.[key];
    if (!isStr(v) || !joined.includes(v)) issues.push(`allowedArtifacts에 manifest ${key}(${v}) 누락`);
  }
  if (!joined.includes("overlays/") || !joined.includes("frames/")) issues.push("allowedArtifacts에 overlays//frames/ 누락");
  if (!isStr(op.frameExtractionScope) || !op.frameExtractionScope.includes("artifact audit")) issues.push("frame 추출 범위(이 mux의 audit 증거 한정) 누락");
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
function detectSafeFrameDrift(p, contract) {
  const issues = [];
  const sf = p.safeFrameGate ?? {};
  const csf = contract.safeFrameGeometry ?? {};
  if (sf.textMaxY !== csf.textMaxY) issues.push(`safeFrameGate.textMaxY ${sf.textMaxY} != contract ${csf.textMaxY}`);
  if (sf.graphicMaxY !== csf.graphicMaxY) issues.push(`safeFrameGate.graphicMaxY ${sf.graphicMaxY} != contract ${csf.graphicMaxY}`);
  if (sf.canvas?.width !== csf.canvas?.width || sf.canvas?.height !== csf.canvas?.height) issues.push("safeFrameGate.canvas가 contract와 불일치");
  const fv = p.fontVendoringGate ?? {};
  if (!isStr(fv.approvedFontFile) || !(contract.fontPolicy?.approvedFontFileHint ?? "").includes(fv.approvedFontFile)) {
    issues.push("fontVendoringGate.approvedFontFile이 contract approvedFontFileHint와 불일치");
  }
  if (fv.requiredVariation !== "Black" || fv.silentFallbackForbidden !== true) issues.push("fontVendoringGate variation/silent fallback 규칙 누락");
  return issues;
}
function detectRunnerIssues(src) {
  const issues = [];
  if (!src.includes('STAGE !== "render-mux-only"')) issues.push("--stage render-mux-only 파싱 없음");
  if (!src.includes("RENDER_MUX_ONLY && !ALLOW_RENDER_MUX_FLAG")) issues.push("--allow-render-mux 명시 승인 gate 없음 (fail-closed 아님)");
  if (!src.includes("RENDER_MUX_ONLY && ALLOW_LIVE_TTS_FLAG")) issues.push("render-mux-only + --allow-live-tts 조합 차단 없음");
  if (!src.includes("RENDER_MUX_ONLY ? {} : loadEnvLocal()")) issues.push(".env.local 파싱 생략(RENDER_MUX_NO_ENV_READ) 없음");
  if (!src.includes("render-mux-only stage는 어떤 env/secret 값도 읽지 않는다")) issues.push("env() 전면 차단 fail-closed 없음");
  if (!src.includes("RENDER_MUX_ONLY ? renderMuxAudioReuseGate() : await stageTts()")) issues.push("stageTts 미진입 reuse gate 분기 없음");
  if (!src.includes("TTS 재생성 승인 없음, 즉시 중단")) issues.push("narration/alignment 누락 시 fail-closed(재생성 금지) 없음");
  const preGateIdx = src.indexOf("RENDER_MUX_PRE_OUTPUT_GATES");
  const pillowIdx = src.indexOf('spawnSync("python"');
  if (!(preGateIdx > -1 && pillowIdx > -1 && preGateIdx < pillowIdx)) issues.push("pre-output gates(font/safe-frame)가 Pillow 실행 앞에 없음");
  if (!src.includes("NotoSansKR-VF\\.ttf$/i") || !src.includes("font vendoring fail")) issues.push("font vendoring gate(승인 폰트 fail-fast) 없음");
  if (!src.includes("> 1580") || !src.includes("> 1632") || !src.includes("safe-frame fail")) issues.push("safe-frame gate(1580/1632) 없음");
  if (!src.includes("침묵 skip 금지")) issues.push("미지원 element 침묵 skip 금지 없음");
  const auditWriteIdx = src.indexOf(J("write", 'FileSync(P("auditReport")'));
  const failClosedIdx = src.indexOf("RENDER_MUX_ONLY_AUDIT_FAIL_CLOSED");
  if (!(auditWriteIdx > -1 && failClosedIdx > -1 && auditWriteIdx < failClosedIdx)) issues.push("audit 기록 후 fail-closed 종료 지점 없음");
  if (!src.includes('audit.verdict !== "PASS_CANDIDATE_PENDING_VISION_QA"')) issues.push("audit verdict fail-closed 판정 없음");
  if (count(src, "= renderVisual(R)") !== 1) issues.push(`render 호출 지점 ${count(src, "= renderVisual(R)")}개 != 1`);
  if (count(src, '], "mux")') !== 1) issues.push(`mux 호출 지점 ${count(src, '], "mux")')}개 != 1`);
  const remoteCalls = count(src, J("fet", "ch("));
  if (remoteCalls !== 1) issues.push(`원격 호출 지점 ${remoteCalls}개 != 1 (TTS stage 내부 단일 지점 위반)`);
  if (!src.includes("renderPerformedThisRun: 1, renderCapMax: 1, muxPerformedThisRun: 1, muxCapMax: 1")) issues.push("audit에 render/mux cap 증거 없음");
  if (!src.includes('stage: "render-mux-only"')) issues.push("timing summary render-mux-only stage 마커 없음");
  if (!src.includes("(TTS_AUDIO_ONLY || RENDER_MUX_ONLY) ? cfg.tts.modelIdDefault")) issues.push("render-mux-only에서 modelId env read 우회 없음");
  if (!src.includes("TTS_AUDIO_ONLY_STOP_BEFORE_RENDER_MUX")) issues.push("tts-audio-only 종료 지점 소실 (기존 동작 미보존)");
  if (!src.includes('stage: "tts-audio-only", audioArtifactAuditTtsOnly: ttsOnlyAudioAudit')) issues.push("tts-audio-only audit 마커 소실 (기존 동작 미보존)");
  if (src.includes("/api/upload")) issues.push("upload 엔드포인트 참조 발견");
  if (!src.includes("uploadReady: false")) issues.push("uploadReady:false 기록 없음");
  if (!src.includes("must be under C:")) issues.push("out-dir C:\\tmp 강제 없음");
  return issues;
}

// ── 1. Owner 승인 / 도메인 / cap / cost / 미승인 flag ────────────────────────
{
  check("plan schemaVersion + status = LIVE_RENDER_MUX_RUN_PLAN_APPROVED_SCOPED",
    plan.schemaVersion === "golden_sample_live_render_mux_run_plan_v1" &&
    plan.status === "LIVE_RENDER_MUX_RUN_PLAN_APPROVED_SCOPED" &&
    plan.taskId === "golden-sample-v3-2-live-render-mux-run-v1");
  check("plan Owner 승인 문구 정확히 기록 + 도메인/topicId/renderCap 1/muxCap 1/cost $0 고정",
    detectApprovalDrift(plan).length === 0, detectApprovalDrift(plan).join("; "));
  check("plan 미승인 6 flag 전부 false (imageRegen/ttsRegen/externalApi/envSecretRead/upload/ownerQa)",
    detectDomainEscalation(plan).length === 0, detectDomainEscalation(plan).join("; "));
  check("plan costCapHandling: 로컬 전용 구조 + expectedCostUsd 0 + 비용 신호 즉시 중단",
    plan.costCapHandling?.expectedCostUsd === 0 && plan.costCapHandling?.immediateStopOnCostSignal === true &&
    isStr(plan.costCapHandling?.hardControl));
  check("plan approvedInputs 재사용 전용 + capEnforcement (render 1/mux 1/invocation 1/no retry)",
    detectInputDrift(plan).length === 0, detectInputDrift(plan).join("; "));
}

// ── 2. stop conditions + 실행 명령 + output policy ───────────────────────────
{
  check("plan stopConditions 완비 (font vendoring/safe-frame/overlay-spec/audio audit/media probe/caption-card/story/render error/mux error)",
    detectStopMissing(plan).length === 0, detectStopMissing(plan).join("; "));
  check("plan executionCommand: render-mux-only + allow flag, TTS/provider flag 배제, 1회 실행, env 불필요",
    detectExecCommandDrift(plan).length === 0, detectExecCommandDrift(plan).join("; "));
  check("plan approvedOutputDir=manifest outDir + 산출물 allowlist(mux/visual/audit/frames/overlays) 정합",
    detectOutputPolicyDrift(plan, manifest).length === 0, detectOutputPolicyDrift(plan, manifest).join("; "));
  check("plan artifactAuditPlan: 필수 + tailHold 이연 확정 + threshold source + vision QA 분리 + failAction 재시도 금지",
    plan.artifactAuditPlan?.requiredForCompletion === true &&
    isStr(plan.artifactAuditPlan?.tailHoldResolution) &&
    isStr(plan.artifactAuditPlan?.thresholdsSource) &&
    isStr(plan.artifactAuditPlan?.visionQaNote) &&
    isStr(plan.artifactAuditPlan?.failAction) && plan.artifactAuditPlan.failAction.includes("금지"));
  check("plan preRunOutputState 내적 정합 (accepted 입력 실재 + 예상 외부 호출/env read 0)",
    plan.preRunOutputState?.narrationExists === true && plan.preRunOutputState?.alignmentExists === true &&
    plan.preRunOutputState?.expectedExternalApiCallsThisRun === 0 &&
    plan.preRunOutputState?.expectedEnvSecretReadsThisRun === 0 &&
    plan.preRunOutputState?.priorMuxExists === true && isStr(plan.outputPolicy?.overwriteNote));
}

// ── 3. 참조 실재 + gate compliance + safe-frame 계약 정합 ────────────────────
{
  const refs = plan.references ?? {};
  const missingKeys = REQUIRED_REF_KEYS.filter((k) => !isStr(refs[k]));
  check("plan references 14개 key 전부 존재 (HANDOFF 필수 7개 포함)", missingKeys.length === 0, `missing=${missingKeys.join(",")}`);
  const refPaths = REQUIRED_REF_KEYS.map((k) => refs[k]).filter(isStr);
  const missingFiles = refPaths.filter((r) => !existsSync(path.join(ROOT, r)));
  check("plan references 대상 파일 전부 레포 실재", refPaths.length >= 14 && missingFiles.length === 0, `missing=${missingFiles.join(",")}`);
  check("plan futureGateComplianceMap: gate requiredFields 8개 전부 매핑",
    detectGateComplianceGap(plan).length === 0, detectGateComplianceGap(plan).join("; "));
  const gateTokens = (gate.futureApprovalRequirements?.requiredFields ?? []);
  check("cross-check: gate requiredFields 8개 토큰이 실제 gate fixture와 일치",
    GATE_REQUIRED_FIELD_TOKENS.every((t) => gateTokens.some((f) => f.includes(t))));
  check("plan safe-frame/font gate가 pillow renderer contract와 일치 (1580/1632/1080x1920/NotoSansKR-VF/Black)",
    detectSafeFrameDrift(plan, pillow).length === 0, detectSafeFrameDrift(plan, pillow).join("; "));
  check("plan ownerQaSeparation PENDING + uploadHardBlock active + policyRef 실재",
    plan.ownerQaSeparation?.ownerViewingListeningActualStatus === "PENDING_DIRECT_OWNER_REVIEW" &&
    plan.ownerQaSeparation?.ownerQaPassed === false && plan.uploadHardBlock?.active === true &&
    existsSync(path.join(ROOT, plan.uploadHardBlock?.policyRef ?? "")));
  check("plan prohibitedInterpretations/forbiddenBehavior: 도메인 확장/재생성 강제/자동 재시도/clone/commit·push 금지 포함",
    Array.isArray(plan.prohibitedInterpretations) &&
    plan.prohibitedInterpretations.some((s) => s.includes("upload")) &&
    plan.prohibitedInterpretations.some((s) => s.includes("재생성")) &&
    plan.prohibitedInterpretations.some((s) => s.includes("재시도")) &&
    Array.isArray(plan.forbiddenBehavior) &&
    plan.forbiddenBehavior.some((s) => s.includes("clone")) &&
    plan.forbiddenBehavior.some((s) => s.includes("commit/push")) &&
    plan.forbiddenBehavior.some((s) => s.includes("env/secret")));
}

// ── 4. manifest/렌더 manifest/이전 slice 계약 정합 ───────────────────────────
{
  check("mux manifest boundary: noUpload/noImageGeneration/uploadReady=false/sourceImagesReadOnly 유지",
    manifest.boundary?.noUpload === true && manifest.boundary?.noImageGeneration === true &&
    manifest.boundary?.uploadReady === false && manifest.boundary?.sourceImagesReadOnly === true);
  check("repo visual render manifest: boundary.uploadReady=false + padding/atempo/hardTrim 미사용",
    renderManifest.boundary?.uploadReady === false && renderManifest.boundary?.paddingUsed === false &&
    renderManifest.boundary?.atempoUsed === false && renderManifest.boundary?.hardTrimUsed === false);
  check("이전 TTS slice run plan과 정합: 그 plan의 renderApprovedNow/muxApprovedNow는 false (이 plan이 신규 승인 기록)",
    ttsPlan.renderApprovedNow === false && ttsPlan.muxApprovedNow === false &&
    ttsPlan.topicId === plan.topicId);
  check("pillow contract: silent fallback 금지 + fail-closed bbox 원칙 존재",
    isStr(pillow.fontPolicy?.silentDefaultFontFallback) && pillow.fontPolicy.silentDefaultFontFallback.includes("금지") &&
    isStr(pillow.safeFrameGeometry?.failClosedOnMissingBbox));
}

// ── 5. runner 소스 안전성 (render-mux-only 경계) ─────────────────────────────
{
  const issues = detectRunnerIssues(runnerSrc);
  check("runner: render-mux-only stage/승인 gate/env 차단/reuse gate/pre-output gates/audit fail-closed/단일 호출 지점/기존 동작 보존 전부 충족",
    issues.length === 0, issues.join("; "));
  check("runner: render-mux-only에서 --allow-live-tts 조합 시 즉시 abort 메시지 존재",
    runnerSrc.includes("--allow-live-tts must not be combined with render-mux-only"));
  check("runner: 이미지 md5 gate가 stage 분기와 무관하게 실행됨 (accepted 9장 무변경 보증)",
    runnerSrc.includes("md5 불일치") && runnerSrc.includes("image gate"));
  check("runner: reuse gate가 audio+alignment 실재를 모두 요구 (exit 22 fail-closed)",
    runnerSrc.includes("!existsSync(audioPath) || !existsSync(alignPath)"));
}

// ── 6. 가드 self 소스 스캔 + import allowlist ────────────────────────────────
{
  // 주의: 이번 slice는 로컬 미디어 도구 실행이 Owner 승인 대상이므로 (승인 문구에 도구명 포함)
  // 해당 도구명 토큰은 fixture/self 스캔에서 제외한다. 실행 차단은 import allowlist가 보증한다.
  const execTokens = [J("child_", "process"), J("spawn", "("), J("exec", "("), J("process", ".env"),
    J("fet", "ch("), J("chromium", ".launch"), J("page", ".goto"),
    J("write", "File"), J("append", "File"), J("mk", "dir"), J("rm", "Sync"), J("un", "link")];
  const selfSrc = readFileSync(SELF, "utf8");
  // self 소스에는 위 토큰이 문자 그대로 존재하지 않아야 한다 (전부 J()로 분할 보관)
  const selfHit = execTokens.find((t) => selfSrc.includes(t));
  check("no forbidden live/env/write pattern in guard script (self)", !selfHit, selfHit ? `token=${selfHit}` : "");
  check("no forbidden live/env/write pattern in run plan fixture", !execTokens.some((t) => planF.raw.includes(t)));
  const specifiers = [...selfSrc.matchAll(/^import\s[^\n]*?from\s+["']([^"']+)["']/gm)].map((m) => m[1]);
  const allow = new Set(["node:fs", "node:path", "node:url"]);
  check("guard imports restricted to node:fs/node:path/node:url",
    specifiers.length > 0 && specifiers.every((s) => allow.has(s)), `bad=${specifiers.filter((s) => !allow.has(s)).join(",")}`);
  console.log("NOTE  scanner holds forbidden tokens split-concatenated only; 승인 로컬 미디어 도구명 토큰은 스캔 제외 (Owner 승인 문구에 포함)");
}

// ── 7. in-memory mutant — fail-closed 확인 ───────────────────────────────────
{
  const truthy = 1 === 1;
  const mText = clone(plan); mText.ownerApproval.exactText = mText.ownerApproval.exactText.replace("render cap=1", "render cap=9");
  check("mutant: Owner 승인 문구 변조(render cap=9) → fail",
    detectApprovalDrift(mText).some((i) => i.includes("exactText")));
  const mTextGone = clone(plan); delete mTextGone.ownerApproval.exactText;
  check("mutant: Owner 승인 문구 누락 → fail",
    detectApprovalDrift(mTextGone).some((i) => i.includes("exactText")));
  const mDomain = clone(plan); mDomain.approvedDomain = "upload";
  check("mutant: approvedDomain을 upload로 변조 → fail",
    detectApprovalDrift(mDomain).some((i) => i.includes("approvedDomain")));
  const mRenderCap = clone(plan); mRenderCap.renderCapMax = 2;
  check("mutant: renderCapMax 2 (>1) → fail",
    detectApprovalDrift(mRenderCap).some((i) => i.includes("renderCapMax")));
  const mMuxCap = clone(plan); mMuxCap.muxCapMax = 2;
  check("mutant: muxCapMax 2 (>1) → fail",
    detectApprovalDrift(mMuxCap).some((i) => i.includes("muxCapMax")));
  const mCost = clone(plan); mCost.costCapUsdMax = 1;
  check("mutant: costCapUsdMax 1 (>0) → fail",
    detectApprovalDrift(mCost).some((i) => i.includes("costCapUsdMax")));
  const mImg = clone(plan); mImg.imageRegenerationApprovedNow = truthy;
  check("mutant: imageRegenerationApprovedNow true → fail",
    detectDomainEscalation(mImg).some((i) => i.includes("imageRegenerationApprovedNow")));
  const mTts = clone(plan); mTts.ttsRegenerationApprovedNow = truthy;
  check("mutant: ttsRegenerationApprovedNow true → fail",
    detectDomainEscalation(mTts).some((i) => i.includes("ttsRegenerationApprovedNow")));
  const mEnv = clone(plan); mEnv.envSecretReadApprovedNow = truthy;
  check("mutant: envSecretReadApprovedNow true → fail",
    detectDomainEscalation(mEnv).some((i) => i.includes("envSecretReadApprovedNow")));
  const mUp = clone(plan); mUp.uploadApprovedNow = truthy;
  check("mutant: uploadApprovedNow true → fail",
    detectDomainEscalation(mUp).some((i) => i.includes("uploadApprovedNow")));
  const mStop1 = clone(plan); mStop1.stopConditions = mStop1.stopConditions.filter((s) => !s.includes("safe-frame"));
  check("mutant: safe-frame stop 조건 제거 → fail",
    detectStopMissing(mStop1).some((i) => i.includes("safe-frame")));
  const mStop2 = clone(plan); mStop2.stopConditions = mStop2.stopConditions.filter((s) => !s.includes("media probe"));
  check("mutant: media probe stop 조건 제거 → fail",
    detectStopMissing(mStop2).some((i) => i.includes("media probe")));
  const mCmd = clone(plan); mCmd.executionCommand.pattern += " --allow-live-tts";
  check("mutant: 실행 명령에 --allow-live-tts 혼입 → fail",
    detectExecCommandDrift(mCmd).some((i) => i.includes("혼입")));
  const mRetry = clone(plan); mRetry.capEnforcement.retry = truthy;
  check("mutant: capEnforcement.retry true → fail",
    detectInputDrift(mRetry).some((i) => i.includes("retry")));
  const mSf = clone(plan); mSf.safeFrameGate.textMaxY = 1700;
  check("mutant: safeFrameGate.textMaxY 1700 (contract 드리프트) → fail",
    detectSafeFrameDrift(mSf, pillow).some((i) => i.includes("textMaxY")));
  const mGateMap = clone(plan); delete mGateMap.futureGateComplianceMap.costCapUsdMax;
  check("mutant: futureGateComplianceMap.costCapUsdMax 누락 → fail",
    detectGateComplianceGap(mGateMap).some((i) => i.includes("costCapUsdMax")));
  const srcNoAllow = runnerSrc.replace("RENDER_MUX_ONLY && !ALLOW_RENDER_MUX_FLAG", "false && false");
  check("mutant: runner 승인 flag gate 제거 → fail",
    detectRunnerIssues(srcNoAllow).some((i) => i.includes("승인 gate")));
  const srcNoEnvSkip = runnerSrc.replace("RENDER_MUX_ONLY ? {} : loadEnvLocal()", "loadEnvLocal()");
  check("mutant: runner .env.local 파싱 생략 제거 → fail",
    detectRunnerIssues(srcNoEnvSkip).some((i) => i.includes("RENDER_MUX_NO_ENV_READ")));
  const srcNoReuse = runnerSrc.replace("RENDER_MUX_ONLY ? renderMuxAudioReuseGate() : await stageTts()", "await stageTts()");
  check("mutant: runner reuse gate 제거(무조건 stageTts) → fail",
    detectRunnerIssues(srcNoReuse).some((i) => i.includes("reuse gate")));
  const srcNoPre = runnerSrc.replace("RENDER_MUX_PRE_OUTPUT_GATES", "PRE_GATES_REMOVED");
  check("mutant: runner pre-output gates 제거 → fail",
    detectRunnerIssues(srcNoPre).some((i) => i.includes("Pillow 실행 앞")));
  const srcNoFail = runnerSrc.replace("RENDER_MUX_ONLY_AUDIT_FAIL_CLOSED", "FAIL_CLOSED_REMOVED");
  check("mutant: runner audit fail-closed 종료 제거 → fail",
    detectRunnerIssues(srcNoFail).some((i) => i.includes("fail-closed 종료")));
  const srcTwoRender = runnerSrc + "\n// mutant second call site: x = renderVisual(R)\nconst zz = 0; // = renderVisual(R)";
  check("mutant: runner render 호출 지점 2개 → fail",
    detectRunnerIssues(srcTwoRender).some((i) => i.includes("render 호출 지점")));
  const srcTwoMux = runnerSrc + '\n// mutant: ], "mux")';
  check("mutant: runner mux 호출 지점 2개 → fail",
    detectRunnerIssues(srcTwoMux).some((i) => i.includes("mux 호출 지점")));
  const srcTwoRemote = runnerSrc + "\n// " + J("fet", "ch(") + ")";
  check("mutant: runner 원격 호출 지점 2개 → fail",
    detectRunnerIssues(srcTwoRemote).some((i) => i.includes("원격 호출 지점")));
}

console.log(failures === 0
  ? `\nRESULT: ALL PASS (${passes} checks)`
  : `\nRESULT: ${failures} FAILURE(S) / ${passes + failures} checks`);
process.exit(failures === 0 ? 0 : 1);
