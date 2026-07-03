#!/usr/bin/env node
/**
 * run-golden-sample-tts-audio-audit-standard-v1.mjs
 *
 * Golden Sample v3.2 Slice 4 — TTS-first / audio gate / mux policy / artifact audit 표준 harness (no-live).
 * task: golden-sample-v3-2-tts-audio-audit-standardization-v1
 *
 * 이 slice에서는 dry-run/정적 검증 모드만 존재한다:
 *   - 계약 fixture(golden_sample_v3_2_tts_audio_audit_contract.v1.json)와 plan fixture를
 *     로드해 Script Impact Gate 선행 조건·one-shot TTS 정책·word/phrase re-anchor 기준·
 *     audio quality gate threshold·natural-duration mux policy·4-gate artifact audit·
 *     Owner QA 분리를 검증하고 요약만 출력한다.
 *   - live TTS 호출, audio/video 파일 읽기, 동영상 합성·probe·무음탐지 실행, mux 재생성,
 *     파일 쓰기, 네트워크, env/secret 접근이 전혀 없다.
 *   - live/tts/mux/audio 모드는 구현되어 있지 않다 — 관련 CLI flag는 즉시 abort (fail-closed).
 *   - import는 node:fs / node:path / node:url 만 허용된다 (계약 harnessImportRule).
 *
 * v3.1/v3.2 audit runner lineage에서 검증된 게이트 로직을 재사용 가능한 pure function으로 노출한다:
 *   Script Impact Gate 판정, audio quality gate(6 서브체크) 판정, re-anchor entry 판정,
 *   mux media gate 판정, 4-gate artifact audit 판정, QA readiness 분리 검증.
 * 미래 live/tts/mux slice는 이 모듈을 import해 동일 threshold를 사용해야 하며,
 * inline audit 8번째 클론 생성은 계약(forbiddenBehavior)상 금지다.
 *
 * exit codes: 0 = validation PASS · 1 = validation FAIL · 2 = usage 오류 · 3 = live/tts/mux/audio-mode 거부
 */
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const SELF = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SELF), "..");

export const EXPECTED_CONTRACT_SCHEMA = "golden_sample_tts_audio_audit_contract_v1";
export const EXPECTED_PLAN_SCHEMA = "golden_sample_tts_audio_audit_plan_v1";
export const DEFAULT_CONTRACT_PATH = path.join(
  ROOT, "scripts", "fixtures", "golden_sample_v3_2_tts_audio_audit_contract.v1.json");
export const DEFAULT_PLAN_PATH = path.join(
  ROOT, "scripts", "fixtures", "golden_sample_v3_2_tts_audio_audit_sample_plan.t1_lifestyle_inflation.v1.json");

// live/tts/mux/audio류 flag는 이 slice에 존재하지 않는 기능 — 발견 즉시 거부 (fail-closed).
// (scanner denylist 토큰과 겹치는 flag 이름은 도입하지 않는다.)
export const REFUSED_LIVE_FLAGS = [
  "--live", "--live-tts", "--tts", "--mux", "--audio", "--probe", "--render", "--arm", "--allow-live",
];

export const REQUIRED_SCORE_KEYS = [
  "hook_self_relevance_score", "story_causality_score", "problem_solution_bridge_score",
  "solution_specificity_score", "save_worthiness_score", "spoken_naturalness_score",
];
export const HARD_FAIL_KEYS = [
  "generic_hook", "explains_but_does_not_sting", "weak_problem_solution_bridge",
  "abstract_solution_ending", "three_things_unnamed", "invented_stats_or_facts",
  "topic_changed_from_accepted_visual",
];
export const AUDIO_SUBCHECK_KEYS = [
  "beginningPass", "first5sPass", "ratioPass", "speechActivePass", "tailHoldPass", "notClippedTail",
];
export const AUDIT_GATE_KEYS = ["media", "audio", "captionCard", "story"];

const isStr = (v) => typeof v === "string" && v.trim().length > 0;
const isStrArr = (v) => Array.isArray(v) && v.length > 0 && v.every(isStr);
const isNum = (v) => typeof v === "number" && Number.isFinite(v);
const isBool = (v) => typeof v === "boolean";
const setEq = (a, b) =>
  Array.isArray(a) && Array.isArray(b) && a.length === b.length &&
  [...a].sort().join("|") === [...b].sort().join("|");

// ── Script Impact Gate 판정 (pure) ──────────────────────────────────────────

// scores/required/hardFail을 받아 gate PASS 여부와 실패 사유를 반환한다.
// 모든 required 점수 충족(>=) + hardFail 7키 전부 false여야 PASS (fail-closed).
export function evaluateScriptImpactGate(scores, required, hardFailChecks) {
  const issues = [];
  for (const k of REQUIRED_SCORE_KEYS) {
    const s = scores?.[k];
    const r = required?.[k];
    if (!isNum(s)) { issues.push(`점수 누락/비수치 — ${k}`); continue; }
    if (!isNum(r)) { issues.push(`required threshold 누락 — ${k}`); continue; }
    if (s < r) issues.push(`${k} ${s} < required ${r}`);
  }
  for (const k of HARD_FAIL_KEYS) {
    const v = hardFailChecks?.[k];
    if (v !== false) issues.push(`hardFail ${k} !== false (${v === undefined ? "누락" : v})`);
  }
  return { pass: issues.length === 0, issues };
}

// ── audio quality gate 판정 (pure) ──────────────────────────────────────────

// 실측값(measured) + threshold를 받아 6개 서브체크와 audio gate PASS를 반환한다.
// 실측이 아니라 이미 측정된 값을 threshold와 대조만 한다 (audio 파일 읽기 없음).
export function evaluateAudioGate(measured, thresholds) {
  const t = thresholds ?? {};
  const m = measured ?? {};
  const range = Array.isArray(t.tailHoldSecRange) ? t.tailHoldSecRange : [0.3, 0.8];
  const sub = {
    beginningPass: isNum(m.beginningSilenceSec) && isNum(t.beginningSilenceMaxSec) && m.beginningSilenceSec <= t.beginningSilenceMaxSec,
    first5sPass: isNum(m.first5sSilenceSec) && isNum(t.first5sSilenceMaxSec) && m.first5sSilenceSec <= t.first5sSilenceMaxSec,
    ratioPass: isNum(m.totalSilenceRatio) && isNum(t.totalSilenceRatioMax) && m.totalSilenceRatio <= t.totalSilenceRatioMax,
    speechActivePass: isNum(m.speechActiveRatio) && isNum(t.speechActiveRatioMin) && m.speechActiveRatio >= t.speechActiveRatioMin,
    tailHoldPass: isNum(m.tailHoldSec) && m.tailHoldSec >= range[0] && m.tailHoldSec <= range[1],
    notClippedTail: m.clippedTail === false,
  };
  const pass = AUDIO_SUBCHECK_KEYS.every((k) => sub[k] === true);
  return { pass, sub };
}

// ── word/phrase re-anchor entry 판정 (pure) ─────────────────────────────────

// entryDeltaMs가 tolerance 이내이거나 음수(단어보다 먼저 뜸)면 OK — 늦게 뜨는 것만 fail.
export function isAnchorEntryOk(entryDeltaMs, toleranceMs) {
  if (!isNum(entryDeltaMs) || !isNum(toleranceMs)) return false; // fail-closed
  return entryDeltaMs < 0 || Math.abs(entryDeltaMs) <= toleranceMs;
}

// ── mux media gate 판정 (pure) ──────────────────────────────────────────────

export function evaluateMediaGate(probeExpected, videoEndSec, durTolerance = 0.25) {
  const f = probeExpected ?? {};
  const issues = [];
  if (f.width !== 1080 || f.height !== 1920) issues.push("해상도 !== 1080x1920");
  if (f.videoCodec !== "h264") issues.push("videoCodec !== h264");
  if (f.rFrameRate !== "30/1") issues.push("rFrameRate !== 30/1");
  if (f.audioCodec !== "aac") issues.push("audioCodec !== aac");
  if (f.audioStreamCount !== 1) issues.push("audioStreamCount !== 1");
  // videoEndSec 누락은 duration 검사를 침묵 skip하지 않는다 — natural-duration 기준점이 없으면 fail-closed.
  if (!isNum(videoEndSec)) issues.push("videoEndSec(자연 발화 길이) 누락/비수치 — duration 검사 불가");
  else if (isNum(f.videoDurationSec) && Math.abs(f.videoDurationSec - videoEndSec) > durTolerance) {
    issues.push(`duration gap ${Math.abs(f.videoDurationSec - videoEndSec)} > ${durTolerance}`);
  }
  return { pass: issues.length === 0, issues };
}

// ── mux policy 위반 검출 (pure) — padding/atempo/hard-trim/fixed target ──────

export function detectForbiddenMuxRoutes(muxPolicy) {
  const issues = [];
  const p = muxPolicy ?? {};
  if (p.paddingUsed !== false) issues.push("paddingUsed !== false (padding 금지)");
  if (p.atempoUsed !== false) issues.push("atempoUsed !== false (atempo 금지)");
  if (p.hardTrimUsed !== false) issues.push("hardTrimUsed !== false (hard-trim 금지)");
  // 누락(undefined)도 fail-closed — 고정 길이 목표를 사용하지 않았음을 명시적으로 false로 선언해야 한다.
  if (p.fixedTargetUsed !== false) issues.push("fixedTargetUsed !== false (고정 길이 목표 금지, 누락도 fail-closed)");
  return issues;
}

// ── TTS 정책 위반 검출 (pure) ───────────────────────────────────────────────

export function detectForbiddenTtsRoutes(tts) {
  const issues = [];
  const t = tts ?? {};
  if (t.strategy !== "full_narration_one_shot") issues.push(`tts.strategy "${t.strategy}" !== full_narration_one_shot`);
  if (t.sceneBySceneTts !== false) issues.push("tts.sceneBySceneTts !== false (scene 단위 TTS 금지)");
  if (t.requireLiveTtsGuard !== true) issues.push("tts.requireLiveTtsGuard !== true");
  if (isNum(t.apiCallBudgetMax) && t.apiCallBudgetMax > 2) issues.push(`tts.apiCallBudgetMax ${t.apiCallBudgetMax} > 2`);
  if (isNum(t.liveTtsCalls) && isNum(t.apiCallBudgetMax) && t.liveTtsCalls > t.apiCallBudgetMax) {
    issues.push(`tts.liveTtsCalls ${t.liveTtsCalls} > budget ${t.apiCallBudgetMax}`);
  }
  if (t.keyValueLeaked === true) issues.push("tts.keyValueLeaked === true (secret 출력 금지)");
  return issues;
}

// ── 4-gate artifact audit 판정 (pure) ───────────────────────────────────────

export function evaluateArtifactAudit(gates) {
  const g = gates ?? {};
  const issues = [];
  for (const k of AUDIT_GATE_KEYS) {
    if (g[k] !== true) issues.push(`audit gate ${k} !== true`);
  }
  const pass = AUDIT_GATE_KEYS.every((k) => g[k] === true);
  return { pass, verdict: pass ? "PASS_CANDIDATE_PENDING_VISION_QA" : "FAIL", issues };
}

// ── fixture 로딩 (read-only) ────────────────────────────────────────────────

export function defaultIo() {
  const abs = (ref) => (path.isAbsolute(ref) ? ref : path.join(ROOT, ref));
  return {
    exists: (ref) => existsSync(abs(ref)),
    load: (ref) => JSON.parse(readFileSync(abs(ref), "utf8")),
  };
}

// ── 계약 검증 ───────────────────────────────────────────────────────────────

export function validateContract(contract) {
  const issues = [];
  const push = (m) => issues.push(`contract: ${m}`);
  if (contract?.schemaVersion !== EXPECTED_CONTRACT_SCHEMA) push(`schemaVersion !== ${EXPECTED_CONTRACT_SCHEMA}`);

  const fl = contract?.flags ?? {};
  for (const k of ["uploadReady", "automationExpansionReady", "implementationApproved",
    "liveTtsApproved", "liveMuxApproved", "liveAudioAnalysisApproved"]) {
    if (fl[k] !== false) push(`flags.${k}는 false여야 한다`);
  }

  const nl = contract?.noLivePolicy ?? {};
  for (const k of ["noLiveTts", "noPaidOrFreeTtsApiCall", "noAudioOrVideoFileRead", "noFfmpegOrProbeExecution",
    "noSilenceDetectExecution", "noRenderOrMuxRegeneration", "noAudioOrVideoGeneration", "noChatgptPlaywrightExecution",
    "noBrowserOrCdpLaunch", "noImageGeneration", "noOtherExternalApi", "noUpload", "noUploadQueue",
    "noEnvOrSecretAccess", "noNetwork", "noWrite"]) {
    if (nl[k] !== true) push(`noLivePolicy.${k}는 true여야 한다`);
  }
  if (nl.standardHarnessMode !== "dry_run_static_validation_only") push("noLivePolicy.standardHarnessMode !== dry_run_static_validation_only");

  const sig = contract?.scriptImpactGateStandard ?? {};
  if (sig.evaluatedBeforeLiveTts !== true) push("scriptImpactGateStandard.evaluatedBeforeLiveTts !== true");
  for (const k of REQUIRED_SCORE_KEYS) {
    if (!isNum(sig.requiredScores?.[k])) push(`scriptImpactGateStandard.requiredScores.${k} 누락`);
  }
  if (!setEq(sig.hardFailKeys, HARD_FAIL_KEYS)) push("scriptImpactGateStandard.hardFailKeys 불일치(7키)");
  if (!isStr(sig.gateOrderRule)) push("scriptImpactGateStandard.gateOrderRule 문서 누락");

  const tts = contract?.ttsStandard ?? {};
  const forbids = (v) => isStr(v) && v.startsWith("금지");
  if (tts.strategy !== "full_narration_one_shot") push("ttsStandard.strategy !== full_narration_one_shot");
  if (!forbids(tts.sceneBySceneTts)) push("ttsStandard.sceneBySceneTts !== 금지");
  if (tts.apiCallBudgetMax !== 2) push("ttsStandard.apiCallBudgetMax !== 2");
  if (tts.requireLiveTtsGuard !== true) push("ttsStandard.requireLiveTtsGuard !== true");

  const ra = contract?.wordPhraseReAnchorStandard ?? {};
  if (ra.mandatory !== true) push("wordPhraseReAnchorStandard.mandatory !== true");
  if (ra.entryToleranceMs !== 120) push("wordPhraseReAnchorStandard.entryToleranceMs !== 120");
  if (ra.v32MeasuredMaxDeltaMs !== 50) push("wordPhraseReAnchorStandard.v32MeasuredMaxDeltaMs !== 50");
  if (ra.overlayCount !== 29) push("wordPhraseReAnchorStandard.overlayCount !== 29");

  const ag = contract?.audioQualityGateStandard ?? {};
  if (ag.beginningSilenceMaxSec !== 0.6) push("audioQualityGateStandard.beginningSilenceMaxSec !== 0.6");
  if (ag.first5sSilenceMaxSec !== 0.8) push("audioQualityGateStandard.first5sSilenceMaxSec !== 0.8");
  if (ag.totalSilenceRatioMax !== 0.18) push("audioQualityGateStandard.totalSilenceRatioMax !== 0.18");
  if (ag.speechActiveRatioMin !== 0.72) push("audioQualityGateStandard.speechActiveRatioMin !== 0.72");
  if (!setEq(ag.subCheckKeys, AUDIO_SUBCHECK_KEYS)) push("audioQualityGateStandard.subCheckKeys 불일치(6키)");

  const mux = contract?.muxPolicyStandard ?? {};
  for (const k of ["paddingUsed", "atempoUsed", "hardTrimUsed", "fixedDurationTarget"]) {
    if (mux[k] !== "금지") push(`muxPolicyStandard.${k} !== 금지`);
  }
  if (!(mux.expectedFfprobe?.width === 1080 && mux.expectedFfprobe?.height === 1920)) push("muxPolicyStandard.expectedFfprobe canvas !== 1080x1920");

  const aa = contract?.artifactAuditStandard ?? {};
  if (!setEq(aa.gates, AUDIT_GATE_KEYS)) push("artifactAuditStandard.gates 불일치(media/audio/captionCard/story)");
  if (!isStr(aa.visionQaSeparation)) push("artifactAuditStandard.visionQaSeparation 문서 누락");

  const qa = contract?.qaReadinessSeparation ?? {};
  if (!isStrArr(qa.preUploadGates) || qa.preUploadGates.length !== 6) push("qaReadinessSeparation.preUploadGates 6개 아님");
  if (!qa.preUploadGates?.includes("owner_viewing_listening_pass")) push("qaReadinessSeparation.preUploadGates에 owner_viewing_listening_pass 누락");

  if (contract?.integration?.manifestRefRequired?.length !== 3) push("integration.manifestRefRequired 3개 아님");
  if (!isStrArr(contract?.forbiddenBehavior) || contract.forbiddenBehavior.length < 10) push("forbiddenBehavior 부족(>=10)");
  if (!Array.isArray(contract?.pipelineOrder) || contract.pipelineOrder.length !== 7) push("pipelineOrder 7단계 아님");
  return issues;
}

// ── plan 검증 (계약 + 참조 fixture 교차) ────────────────────────────────────

export function validatePlanAgainstContract(plan, contract, io = defaultIo()) {
  const issues = [];
  const push = (m) => issues.push(`plan: ${m}`);
  if (plan?.schemaVersion !== EXPECTED_PLAN_SCHEMA) push(`schemaVersion !== ${EXPECTED_PLAN_SCHEMA}`);
  if (!isStr(plan?.contractRef) || !plan.contractRef.endsWith("golden_sample_v3_2_tts_audio_audit_contract.v1.json")) {
    push("contractRef가 표준 계약 fixture를 가리키지 않는다");
  }

  const fl = plan?.flags ?? {};
  for (const k of ["uploadReady", "automationExpansionReady", "implementationApproved",
    "liveTtsApproved", "liveMuxApproved", "liveAudioAnalysisApproved"]) {
    if (fl[k] !== false) push(`flags.${k}는 false여야 한다`);
  }

  // manifest / acceptance-lock 참조 필수 (integration.failIfMissing)
  const refs = plan?.manifestRefs ?? {};
  const required = contract?.integration?.manifestRefRequired ?? [];
  const refMap = {
    "v3.2 tts-first mux manifest": refs.ttsFirstMuxManifest,
    "v3.2 acceptance lock": refs.acceptanceLock,
    "production standard fixture": refs.productionStandard,
  };
  for (const label of required) {
    const ref = refMap[label];
    if (!isStr(ref)) { push(`manifestRefs 누락 — ${label}`); continue; }
    if (!io.exists(ref)) { push(`manifestRefs 파일 없음 — ${ref}`); continue; }
    try { io.load(ref); } catch (e) { push(`manifestRefs JSON parse 실패 — ${String(e).slice(0, 120)}`); }
  }
  if (!isStr(refs.ttsFirstMuxManifest) || !isStr(refs.acceptanceLock)) {
    push("v3.2 mux manifest 또는 acceptance-lock 참조 없음 — integration.failIfMissing");
  }

  const ota = plan?.ownerTopicApproval ?? {};
  if (ota.approved !== true) push("ownerTopicApproval.approved !== true");
  if (ota.permanentChannelWideTopicLock !== false) push("ownerTopicApproval.permanentChannelWideTopicLock !== false");
  if (isStr(refs.acceptanceLock) && io.exists(refs.acceptanceLock)) {
    try {
      const lock = io.load(refs.acceptanceLock);
      if (lock.topicId !== ota.topicId) push(`ownerTopicApproval.topicId(${ota.topicId})가 acceptance lock(${lock.topicId})과 불일치`);
    } catch { /* parse 실패는 위에서 처리 */ }
  }

  // ── Script Impact Gate: plan 점수가 실제로 gate를 PASS하는지 + required가 계약과 일치 ──
  const sig = plan?.scriptImpactGate ?? {};
  const contractReq = contract?.scriptImpactGateStandard?.requiredScores ?? {};
  for (const k of REQUIRED_SCORE_KEYS) {
    if (sig.requiredScores?.[k] !== contractReq[k]) {
      push(`scriptImpactGate.requiredScores.${k}(${sig.requiredScores?.[k]}) != contract(${contractReq[k]})`);
    }
  }
  const gateRes = evaluateScriptImpactGate(sig.scores, sig.requiredScores, sig.hardFailChecks);
  if (!gateRes.pass) push(`scriptImpactGate 판정 FAIL — ${gateRes.issues.slice(0, 3).join("; ")}`);
  if (sig.evaluatedBeforeLiveTts !== true) push("scriptImpactGate.evaluatedBeforeLiveTts !== true");
  if (sig.hardFails !== 0) push("scriptImpactGate.hardFails !== 0");

  // ── TTS 정책 ──
  issues.push(...detectForbiddenTtsRoutes(plan?.tts ?? {}).map((m) => `plan tts: ${m}`));

  // ── re-anchor 계약 일치 ──
  const ra = plan?.wordPhraseReAnchor ?? {};
  const cra = contract?.wordPhraseReAnchorStandard ?? {};
  if (ra.mandatory !== true) push("wordPhraseReAnchor.mandatory !== true");
  if (ra.entryToleranceMs !== cra.entryToleranceMs) push(`wordPhraseReAnchor.entryToleranceMs(${ra.entryToleranceMs}) != contract(${cra.entryToleranceMs})`);
  if (ra.measuredMaxDeltaMs !== cra.v32MeasuredMaxDeltaMs) push(`wordPhraseReAnchor.measuredMaxDeltaMs(${ra.measuredMaxDeltaMs}) != contract(${cra.v32MeasuredMaxDeltaMs})`);
  if (ra.overlayCount !== cra.overlayCount) push(`wordPhraseReAnchor.overlayCount(${ra.overlayCount}) != contract(${cra.overlayCount})`);
  if (isNum(ra.measuredMaxDeltaMs) && isNum(ra.entryToleranceMs) && ra.measuredMaxDeltaMs > ra.entryToleranceMs) {
    push(`wordPhraseReAnchor.measuredMaxDeltaMs ${ra.measuredMaxDeltaMs} > tolerance ${ra.entryToleranceMs}`);
  }
  if (ra.paddingUsed !== false || ra.atempoUsed !== false || ra.hardTrimUsed !== false) {
    push("wordPhraseReAnchor: padding/atempo/hardTrim은 false여야 한다");
  }

  // ── audio quality gate: plan 실측이 실제로 6 서브체크를 PASS하는지 + threshold 계약 일치 ──
  const ag = plan?.audioQualityGate ?? {};
  const cag = contract?.audioQualityGateStandard ?? {};
  const th = ag.thresholds ?? {};
  if (th.beginningSilenceMaxSec !== cag.beginningSilenceMaxSec) push(`audioQualityGate.thresholds.beginningSilenceMaxSec(${th.beginningSilenceMaxSec}) != contract(${cag.beginningSilenceMaxSec})`);
  if (th.first5sSilenceMaxSec !== cag.first5sSilenceMaxSec) push(`audioQualityGate.thresholds.first5sSilenceMaxSec(${th.first5sSilenceMaxSec}) != contract(${cag.first5sSilenceMaxSec})`);
  if (th.totalSilenceRatioMax !== cag.totalSilenceRatioMax) push(`audioQualityGate.thresholds.totalSilenceRatioMax(${th.totalSilenceRatioMax}) != contract(${cag.totalSilenceRatioMax})`);
  if (th.speechActiveRatioMin !== cag.speechActiveRatioMin) push(`audioQualityGate.thresholds.speechActiveRatioMin(${th.speechActiveRatioMin}) != contract(${cag.speechActiveRatioMin})`);
  const audioRes = evaluateAudioGate(ag, th);
  if (!audioRes.pass) {
    const failed = AUDIO_SUBCHECK_KEYS.filter((k) => audioRes.sub[k] !== true);
    push(`audioQualityGate 판정 FAIL — 서브체크 실패: ${failed.join(",")}`);
  }
  // plan이 명시한 subChecksPass가 실제 계산과 일치하는지 (자기모순 방지)
  if (ag.subChecksPass) {
    for (const k of AUDIO_SUBCHECK_KEYS) {
      if (ag.subChecksPass[k] !== audioRes.sub[k]) push(`audioQualityGate.subChecksPass.${k}(${ag.subChecksPass[k]}) != 계산값(${audioRes.sub[k]})`);
    }
  }

  // ── mux policy ──
  issues.push(...detectForbiddenMuxRoutes(plan?.muxPolicy ?? {}).map((m) => `plan mux: ${m}`));
  // naturalDurationSec 누락/비수치/비양수는 fail-closed — media gate의 duration 검사가 이 값에
  // 의존하므로, 값이 없으면 duration 검사가 조용히 skip되는 대신 명시적으로 막는다.
  const natDur = plan?.muxPolicy?.naturalDurationSec;
  if (!isNum(natDur) || natDur <= 0) {
    push(`muxPolicy.naturalDurationSec 누락/비수치/비양수 — 현재값: ${JSON.stringify(natDur)} (자연 발화 길이는 필수)`);
  }
  const mediaRes = evaluateMediaGate(plan?.muxPolicy?.probeExpected, natDur);
  if (!mediaRes.pass) push(`mux media gate FAIL — ${mediaRes.issues.slice(0, 3).join("; ")}`);

  // ── artifact audit: plan gates가 실제로 verdict를 만드는지 ──
  const aa = plan?.artifactAudit ?? {};
  const auditRes = evaluateArtifactAudit(aa.gates);
  if (!auditRes.pass) push(`artifactAudit 4-gate FAIL — ${auditRes.issues.join("; ")}`);
  if (aa.verdict !== auditRes.verdict) push(`artifactAudit.verdict(${aa.verdict}) != 계산값(${auditRes.verdict})`);
  if (aa.claudeVisionQaSeparateStage !== true) push("artifactAudit.claudeVisionQaSeparateStage !== true (vision QA 분리 필수)");

  // ── QA readiness 분리 ──
  // Owner viewing/listening pass는 technical/automated pass로 대체 불가 — 이 no-live slice에서는
  // 항상 PENDING(미완) 상태여야 한다. "PASS - automated" 같은 값은 자동 대체를 뜻하므로 fail-closed.
  const qa = plan?.qaReadiness ?? {};
  if (qa.uploadReady !== false) push("qaReadiness.uploadReady !== false");
  if (qa.automationExpansionReady !== false) push("qaReadiness.automationExpansionReady !== false");
  if (!isStr(qa.ownerViewingListeningPass)) push("qaReadiness.ownerViewingListeningPass 누락(Owner 직접 QA 분리)");
  else if (!qa.ownerViewingListeningPass.includes("PENDING")) {
    push(`qaReadiness.ownerViewingListeningPass는 PENDING을 포함해야 한다(자동/기술 PASS로 대체 불가) — 현재값: "${qa.ownerViewingListeningPass}"`);
  }

  const em = plan?.executionMode ?? {};
  if (em.approvedNow !== "dry_run_static_validation_only") push("executionMode.approvedNow !== dry_run_static_validation_only");
  if (em.liveTtsApprovedNow !== false) push("executionMode.liveTtsApprovedNow !== false");
  if (em.liveMuxApprovedNow !== false) push("executionMode.liveMuxApprovedNow !== false");

  return issues;
}

// ── dry-run 검증 실행 (no-live, in-memory) ──────────────────────────────────

export function runDryRunValidation({ contractPath = DEFAULT_CONTRACT_PATH, planPath = DEFAULT_PLAN_PATH, io = defaultIo() } = {}) {
  const issues = [];
  let contract = null;
  let plan = null;
  try { contract = JSON.parse(readFileSync(contractPath, "utf8")); }
  catch (e) { issues.push(`contract fixture 로드 실패 — ${String(e).slice(0, 160)}`); }
  try { plan = JSON.parse(readFileSync(planPath, "utf8")); }
  catch (e) { issues.push(`plan fixture 로드 실패 — ${String(e).slice(0, 160)}`); }
  if (contract) issues.push(...validateContract(contract));
  if (contract && plan) issues.push(...validatePlanAgainstContract(plan, contract, io));

  let summary = null;
  if (issues.length === 0) {
    const sig = plan.scriptImpactGate;
    const gateRes = evaluateScriptImpactGate(sig.scores, sig.requiredScores, sig.hardFailChecks);
    const audioRes = evaluateAudioGate(plan.audioQualityGate, plan.audioQualityGate.thresholds);
    const auditRes = evaluateArtifactAudit(plan.artifactAudit.gates);
    summary = {
      mode: "dry_run_static_validation_only",
      topicId: plan.ownerTopicApproval.topicId,
      scriptImpactGate: gateRes.pass ? "PASS" : "FAIL",
      minScoreMargin: Math.min(...REQUIRED_SCORE_KEYS.map((k) => sig.scores[k] - sig.requiredScores[k])),
      ttsStrategy: plan.tts.strategy,
      ttsCalls: `${plan.tts.liveTtsCalls}/${plan.tts.apiCallBudgetMax}`,
      audioGate: audioRes.pass ? "PASS" : "FAIL",
      audioSubChecks: AUDIO_SUBCHECK_KEYS.filter((k) => audioRes.sub[k]).length + "/" + AUDIO_SUBCHECK_KEYS.length,
      naturalDurationSec: plan.muxPolicy.naturalDurationSec,
      artifactAudit: auditRes.verdict,
      ownerQaPending: plan.qaReadiness.ownerViewingListeningPass,
    };
  }
  return { ok: issues.length === 0, issues, contract, plan, summary };
}

// ── CLI ─────────────────────────────────────────────────────────────────────

function parseArgs(argv) {
  const out = { contractPath: DEFAULT_CONTRACT_PATH, planPath: DEFAULT_PLAN_PATH };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (REFUSED_LIVE_FLAGS.includes(a)) return { refusedLiveFlag: a };
    if (a === "--dry-run") continue;
    if (a === "--contract" || a === "--plan") {
      const v = argv[i + 1];
      if (!v || v.startsWith("--")) return { usageError: `${a} 는 경로 인자가 필요하다 (silent fallback 금지)` };
      if (a === "--contract") out.contractPath = path.resolve(v);
      else out.planPath = path.resolve(v);
      i++;
      continue;
    }
    return { usageError: `알 수 없는 인자 — ${a}` };
  }
  return out;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.refusedLiveFlag) {
    console.error(`ABORT: ${args.refusedLiveFlag} 거부 — 이 slice의 standard harness는 dry-run/정적 검증 전용이다.`);
    console.error("live TTS/audio/mux는 Owner 승인 slice + 계약 준수 + Script Impact Gate PASS + live guard 후 별도 구현된다 (fail-closed).");
    process.exit(3);
  }
  if (args.usageError) {
    console.error(`USAGE ERROR: ${args.usageError}`);
    process.exit(2);
  }
  console.log("[tts-audio-audit-standard-v1] mode=DRY_RUN_STATIC_VALIDATION_ONLY (no live-tts / no audio read / no video-mux / no probe / no network / no env / read-only)");
  console.log(`[tts-audio-audit-standard-v1] contract: ${args.contractPath}`);
  console.log(`[tts-audio-audit-standard-v1] plan:     ${args.planPath}`);
  const res = runDryRunValidation({ contractPath: args.contractPath, planPath: args.planPath });
  if (!res.ok) {
    for (const issue of res.issues) console.error(`FAIL  ${issue}`);
    console.error(`\nVALIDATION RESULT: FAIL (${res.issues.length} issue(s))`);
    process.exit(1);
  }
  const s = res.summary;
  console.log(`[tts-audio-audit-standard-v1] topic: ${s.topicId}`);
  console.log(`[tts-audio-audit-standard-v1] Script Impact Gate: ${s.scriptImpactGate} (최소 점수 마진 +${s.minScoreMargin})`);
  console.log(`[tts-audio-audit-standard-v1] TTS: ${s.ttsStrategy} · calls ${s.ttsCalls} (live 호출 없음, 정책 검증만)`);
  console.log(`[tts-audio-audit-standard-v1] audio gate: ${s.audioGate} (${s.audioSubChecks} 서브체크)`);
  console.log(`[tts-audio-audit-standard-v1] mux: natural ${s.naturalDurationSec}s (no padding/atempo/hard-trim)`);
  console.log(`[tts-audio-audit-standard-v1] artifact audit: ${s.artifactAudit}`);
  console.log(`[tts-audio-audit-standard-v1] Owner QA: ${s.ownerQaPending}`);
  console.log(`\nVALIDATION RESULT: PASS (0 issues) — no-live dry-run만 수행됨`);
  process.exit(0);
}

const isMain = process.argv[1] && path.resolve(process.argv[1]).toLowerCase() === SELF.toLowerCase();
if (isMain) main();
