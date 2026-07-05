#!/usr/bin/env node
/**
 * run-golden-sample-integrated-production-readiness-standard-v1.mjs
 *
 * Golden Sample v3.2 Slice 5 — 통합 production-readiness 표준 harness (no-live).
 * task: golden-sample-v3-2-integrated-production-readiness-standardization-v1
 *
 * Slice 0~4(upload hard block / story·visual evidence / ChatGPT+Playwright runner /
 * Pillow renderer / TTS·audio·audit) 표준을 하나의 no-live readiness 계약으로 합성한다.
 *
 * 이 slice에서는 dry-run/정적 검증 모드만 존재한다:
 *   - 통합 계약 fixture와 plan fixture를 로드해 readiness verdict·mandatory Slice 0~4 참조·
 *     미결 Owner 결정·금지 readiness flag·no-live 정책·미래 확장 게이트를 검증하고 요약만 출력.
 *   - live TTS/render/mux/upload/image generation/ChatGPT/Playwright/browser/network/env/secret/
 *     subprocess/파일 쓰기/audio·video·image 파일 읽기가 전혀 없다.
 *   - live/render/mux/tts/upload/browser/image/audio-mode CLI flag는 즉시 abort (fail-closed).
 *   - import는 node:fs / node:path / node:url 만 허용된다 (계약 harnessImportRule).
 *
 * 재사용 pure function을 export한다:
 *   readiness-level 평가, mandatory artifact presence, prior-slice reference validation,
 *   미결 Owner decision 탐지, 금지 readiness flag 탐지, live-action prohibition 탐지,
 *   checkpoint summary 생성.
 * 미래 live/render/TTS/upload 확장 slice는 이 통합 표준 표면을 import해야 하며,
 * 두 번째 orchestration 클론 생성은 계약(forbiddenBehavior)상 금지다.
 *
 * exit codes: 0 = readiness PASS · 1 = readiness FAIL · 2 = usage 오류 · 3 = live/action-mode 거부
 */
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const SELF = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SELF), "..");

export const EXPECTED_CONTRACT_SCHEMA = "golden_sample_integrated_production_readiness_contract_v1";
export const EXPECTED_PLAN_SCHEMA = "golden_sample_integrated_production_readiness_plan_v1";
export const DEFAULT_CONTRACT_PATH = path.join(
  ROOT, "scripts", "fixtures", "golden_sample_v3_2_integrated_production_readiness_contract.v1.json");
export const DEFAULT_PLAN_PATH = path.join(
  ROOT, "scripts", "fixtures", "golden_sample_v3_2_integrated_production_readiness_sample_plan.t1_lifestyle_inflation.v1.json");

// live/action류 flag는 이 slice에 존재하지 않는 기능 — 발견 즉시 거부 (fail-closed).
export const REFUSED_LIVE_FLAGS = [
  "--live", "--render", "--mux", "--tts", "--upload", "--browser", "--generate",
  "--image", "--audio", "--arm", "--allow-live", "--allow-upload",
];

// 현재 허용되는 유일한 readiness verdict — 상위 승격은 이 slice 범위 밖.
export const ALLOWED_READINESS_VERDICT = "STANDARDIZED_NO_LIVE_READY";

// 통합 계약이 승인 없이 true가 되면 fail-closed인 readiness flag 10종.
export const PROHIBITED_READINESS_FLAGS = [
  "uploadReady", "automationExpansionReady", "implementationApproved",
  "liveTtsApproved", "liveMuxApproved", "liveRenderApproved",
  "liveImageGenerationApproved", "chatgptPlaywrightApproved",
  "ownerQaPassed", "productionReady",
];

// 다르게 명명된 동등 flag도 신중히 취급 (애매하면 not-ready). true면 fail-closed.
export const AMBIGUOUS_READINESS_FLAG_ALIASES = [
  "liveGenerationApproved", "liveAudioAnalysisApproved", "uploadEnabled",
  "readyForProduction", "readyToUpload", "productionLiveReady", "automationReady",
];

export const REQUIRED_SLICE_IDS = [
  "upload-hard-block", "story-visual-evidence", "chatgpt-playwright-runner",
  "pillow-renderer", "tts-audio-audit",
];

// ── Owner decision resolution state (decision state fixture와 정합) ──────────
// safe-default final resolution: 10개 결정 전부 resolved — 값까지 고정. pending 0.
export const EXPECTED_RESOLVED_DECISIONS = Object.freeze({
  script_impact_gate_score_authority: "codex_judge_with_mandatory_provenance",
  legacy_line_scope: "isolate_as_pre_v3_2_legacy_documented",
  upload_endpoint_disposition: "keep_hard_blocked_until_upload_slice",
  blueprint_schema_unification: "adopt_standard_six_field_names_map_v2",
  md5_locked_image_durability: "define_durable_backup_location_policy",
  font_vendoring: "vendor_noto_black_vf_remove_system_dependency",
  contract_duality_resolution: "single_v3_2_standard_json_contract",
  image_script_allow_guard: "add_allow_guard_to_all_paid_image_scripts",
  poll_25s_passive_window: "accept_25s_passive_window_as_v3_2_behavior",
  owner_viewing_listening_qa: "keep_manual_owner_qa_mandatory_non_automatable",
});
export const EXPECTED_RESOLVED_KEYS = Object.keys(EXPECTED_RESOLVED_DECISIONS);
// 전부 resolved이므로 pending은 없다.
export const EXPECTED_PENDING_KEYS = [];

const isStr = (v) => typeof v === "string" && v.trim().length > 0;
const isStrArr = (v) => Array.isArray(v) && v.length > 0 && v.every(isStr);
const isBool = (v) => typeof v === "boolean";
const setEq = (a, b) =>
  Array.isArray(a) && Array.isArray(b) && a.length === b.length &&
  [...a].sort().join("|") === [...b].sort().join("|");

// ── readiness-level 평가 (pure) ─────────────────────────────────────────────

// verdict가 정확히 STANDARDIZED_NO_LIVE_READY이고, 상위 readiness로 오해될 이름이 아니면 OK.
export function evaluateReadinessLevel(verdict) {
  const issues = [];
  if (verdict !== ALLOWED_READINESS_VERDICT) {
    issues.push(`readiness verdict "${verdict}" !== ${ALLOWED_READINESS_VERDICT}`);
  }
  return { pass: issues.length === 0, verdict, issues };
}

// ── 금지 readiness flag 탐지 (pure) ─────────────────────────────────────────

// flags 객체에서 금지 flag가 true거나, 애매한 별칭이 true면 issue. 명시 false면 통과.
export function detectForbiddenReadinessFlags(flags) {
  const issues = [];
  const f = flags ?? {};
  for (const k of PROHIBITED_READINESS_FLAGS) {
    if (f[k] === true) issues.push(`readiness flag ${k} === true (승인 없이 승격 금지)`);
    else if (f[k] !== false && f[k] !== undefined) issues.push(`readiness flag ${k}는 boolean false여야 한다 (현재: ${JSON.stringify(f[k])})`);
  }
  for (const k of AMBIGUOUS_READINESS_FLAG_ALIASES) {
    if (f[k] === true) issues.push(`애매한 readiness 별칭 ${k} === true — 승인 없이 승격 금지 (애매하면 not-ready)`);
  }
  return issues;
}

// ── live-action prohibition 탐지 (pure) ─────────────────────────────────────

// executionMode에서 live/upload/render/mux/tts/image/chatgpt/automation approvedNow가
// true면 issue. 모든 approvedNow는 false여야 한다 (fail-closed).
export function detectLiveActionApprovals(executionMode) {
  const issues = [];
  const em = executionMode ?? {};
  const liveKeys = [
    "liveTtsApprovedNow", "liveMuxApprovedNow", "liveRenderApprovedNow",
    "liveImageGenerationApprovedNow", "chatgptPlaywrightApprovedNow",
    "uploadApprovedNow", "automationExpansionApprovedNow",
  ];
  for (const k of liveKeys) {
    if (em[k] === true) issues.push(`executionMode.${k} === true (live 실행 승인 금지)`);
  }
  if (em.approvedNow !== undefined && em.approvedNow !== "dry_run_static_validation_only") {
    issues.push(`executionMode.approvedNow "${em.approvedNow}" !== dry_run_static_validation_only`);
  }
  return issues;
}

// ── 미결 Owner decision 탐지 (pure) ─────────────────────────────────────────

// unresolvedOwnerDecisions에서 status가 PENDING이 아닌 항목(=제거/조기 해소 위장)이 있으면
// issue. blocker가 PENDING으로 보존됐는지 확인 (fail-closed: 결정이 사라지면 안 된다).
export function detectUnresolvedOwnerDecisions(decisions, requiredKeys = []) {
  const issues = [];
  const list = Array.isArray(decisions) ? decisions : [];
  const keys = new Set(list.map((d) => d?.key));
  for (const rk of requiredKeys) {
    if (!keys.has(rk)) issues.push(`필수 미결 결정 누락 — ${rk} (blocker가 사라지면 안 된다)`);
  }
  for (const d of list) {
    if (d?.status !== "PENDING") {
      issues.push(`Owner decision "${d?.key ?? "?"}" status "${d?.status}" !== PENDING (이 slice에서 임의 해소 금지)`);
    }
  }
  return { count: list.length, issues };
}

// ── Owner decision resolution state 검증 (pure, fail-closed) ─────────────────
// safe-default final resolution: resolved 10 (값까지) + pending 0, 정확한 key set,
// resolved가 live/upload/render/mux/Owner QA 승인으로 오해되지 않음.
// owner_viewing_listening_qa는 정책만 resolved이고 실제 QA pass는 별도 status로 추적.
export function validateOwnerDecisionState(state) {
  const issues = [];
  if (!state || typeof state !== "object") { issues.push("ownerDecisionState 섹션 누락"); return issues; }
  if (!isStr(state.decisionStateRef) || !state.decisionStateRef.includes("owner_decision_resolution_state")) {
    issues.push("ownerDecisionState.decisionStateRef가 decision resolution state fixture를 가리키지 않는다");
  }
  if (state.totalDecisions !== 10) issues.push(`ownerDecisionState.totalDecisions "${state.totalDecisions}" !== 10`);
  if (state.resolvedCount !== 10) issues.push(`ownerDecisionState.resolvedCount "${state.resolvedCount}" !== 10`);
  if (state.pendingCount !== 0) issues.push(`ownerDecisionState.pendingCount "${state.pendingCount}" !== 0`);

  // resolved key set 정확히 10개 (제거/추가 fail-closed)
  if (!setEq(state.resolvedKeys, EXPECTED_RESOLVED_KEYS)) {
    issues.push(`ownerDecisionState.resolvedKeys가 정확한 10개 resolved set과 불일치 — ${JSON.stringify(state.resolvedKeys)}`);
  }
  // pending key set 정확히 0개 (재도입 fail-closed)
  if (!(Array.isArray(state.pendingKeys) && state.pendingKeys.length === 0)) {
    issues.push(`ownerDecisionState.pendingKeys가 빈 배열이 아님 (pending 재도입 금지) — ${JSON.stringify(state.pendingKeys)}`);
  }
  // resolvedDecisions 항목의 값이 기대값과 일치 (값 변조 fail-closed)
  const rd = Array.isArray(state.resolvedDecisions) ? state.resolvedDecisions : [];
  if (rd.length !== 10) issues.push(`ownerDecisionState.resolvedDecisions 10개 아님 — ${rd.length}`);
  const seenKeys = new Set();
  for (const d of rd) {
    if (!isStr(d?.key)) { issues.push("resolvedDecision.key 누락"); continue; }
    seenKeys.add(d.key);
    const expected = EXPECTED_RESOLVED_DECISIONS[d.key];
    if (expected === undefined) { issues.push(`resolvedDecision "${d.key}"는 resolved set에 없는 key`); continue; }
    if (d.resolvedValue !== expected) {
      issues.push(`resolvedDecision "${d.key}" resolvedValue "${d.resolvedValue}" != ${expected} (값 변조 금지)`);
    }
    // resolved가 live 승인으로 오해되지 않도록 isNotLiveApproval 명시 필수
    if (!isStr(d.isNotLiveApproval)) issues.push(`resolvedDecision "${d.key}" isNotLiveApproval 문구 누락 (정책 확정 ≠ live 승인)`);
    // owner_viewing_listening_qa는 정책 resolved지만 실제 QA pass가 아님을 명시해야 한다
    if (d.key === "owner_viewing_listening_qa" && d.policyResolvedButActualQaPending !== true) {
      issues.push("owner_viewing_listening_qa resolvedDecision에 policyResolvedButActualQaPending=true 누락 (정책 resolved ≠ 실제 QA pass)");
    }
  }
  for (const k of EXPECTED_RESOLVED_KEYS) {
    if (!seenKeys.has(k)) issues.push(`resolvedDecisions에 필수 resolved key 누락 — ${k}`);
  }
  // owner_viewing_listening_qa 정책 resolved여도 실제 QA는 PENDING이어야 한다 (자동 pass 방지)
  if (state.ownerViewingListeningActualStatus !== undefined &&
      state.ownerViewingListeningActualStatus !== "PENDING_DIRECT_OWNER_REVIEW") {
    issues.push(`ownerDecisionState.ownerViewingListeningActualStatus "${state.ownerViewingListeningActualStatus}" != PENDING_DIRECT_OWNER_REVIEW (실제 QA 자동 pass 금지)`);
  }
  // resolved가 readiness escalation 근거가 아님을 명시
  if (!isStr(state.resolvedIsNotReadinessEscalation)) {
    issues.push("ownerDecisionState.resolvedIsNotReadinessEscalation 문구 누락 (resolved ≠ readiness 승격)");
  }
  return issues;
}

// ── future execution plan gate 검증 (pure, fail-closed) ─────────────────────
// no-live 계획 게이트가 어떤 현재 실행도 승인하지 않고, readiness를 승격하지 않으며,
// owner decision 10/0 + actual Owner QA PENDING + upload hard block active를 유지하는지 확인.
// 이 harness는 dry-run 정합 수준만 검증한다 (상세 mutant는 전용 static guard가 담당).
export const GATE_CURRENT_APPROVAL_FLAGS = [
  "executionApprovedNow", "liveActionApprovedNow", "uploadApprovedNow", "renderApprovedNow",
  "muxApprovedNow", "imageGenerationApprovedNow", "ttsApprovedNow", "browserApprovedNow",
  "envSecretAccessApprovedNow",
];
export function validateFutureExecutionPlanGate(gate) {
  const issues = [];
  if (!gate || typeof gate !== "object") { issues.push("gate fixture 누락/비객체"); return issues; }
  if (gate.status !== "FUTURE_EXECUTION_PLAN_GATE_NO_LIVE") issues.push(`gate.status "${gate.status}" != FUTURE_EXECUTION_PLAN_GATE_NO_LIVE`);
  if (gate.isPlanningArtifactOnly !== true) issues.push("gate.isPlanningArtifactOnly !== true (planning artifact only 여야 함)");
  if (gate.currentApprovalIsZeroLiveExecution !== true) issues.push("gate.currentApprovalIsZeroLiveExecution !== true");
  if (gate.readinessVerdict?.current !== ALLOWED_READINESS_VERDICT) {
    issues.push(`gate.readinessVerdict.current "${gate.readinessVerdict?.current}" != ${ALLOWED_READINESS_VERDICT} (승격 금지)`);
  }
  const caf = gate.currentApprovalFlags ?? {};
  for (const k of GATE_CURRENT_APPROVAL_FLAGS) if (caf[k] !== false) issues.push(`gate.currentApprovalFlags.${k}=${caf[k]} (false 아님)`);
  const ods = gate.ownerDecisionState ?? {};
  if (ods.resolvedCount !== 10) issues.push(`gate.ownerDecisionState.resolvedCount "${ods.resolvedCount}" != 10`);
  if (ods.pendingCount !== 0) issues.push(`gate.ownerDecisionState.pendingCount "${ods.pendingCount}" != 0`);
  if (ods.ownerViewingListeningActualStatus !== "PENDING_DIRECT_OWNER_REVIEW") {
    issues.push(`gate.ownerDecisionState.ownerViewingListeningActualStatus "${ods.ownerViewingListeningActualStatus}" != PENDING_DIRECT_OWNER_REVIEW`);
  }
  if (gate.uploadHardBlock?.active !== true) issues.push("gate.uploadHardBlock.active !== true (upload hard block 유지 필수)");
  if (gate.prohibitedReadinessFlags?.ownerQaPassed !== false) issues.push("gate.prohibitedReadinessFlags.ownerQaPassed !== false");
  if (gate.prohibitedReadinessFlags?.productionReady !== false) issues.push("gate.prohibitedReadinessFlags.productionReady !== false");
  if (gate.capAndStopRequirements?.callCapRequiredBeforeAnyLive !== true) issues.push("gate.capAndStopRequirements.callCapRequiredBeforeAnyLive !== true");
  if (gate.capAndStopRequirements?.stopConditionRequiredBeforeAnyLive !== true) issues.push("gate.capAndStopRequirements.stopConditionRequiredBeforeAnyLive !== true");
  if (gate.futureApprovalRequirements?.explicitOwnerApprovalRequired !== true) issues.push("gate.futureApprovalRequirements.explicitOwnerApprovalRequired !== true");
  return issues;
}

// ── mandatory Slice 0~4 참조 실재 검증 (pure + IO) ──────────────────────────

// mandatorySlices의 contractPath/guardPath/harnessPath/implPath가 레포에 실재하는지 확인.
// 참조가 prose가 아니라 파일로 존재해야 통합 readiness가 성립 (fail-closed).
export function validateMandatorySliceReferences(mandatorySlices, io = defaultIo()) {
  const issues = [];
  const list = Array.isArray(mandatorySlices) ? mandatorySlices : [];
  const foundIds = new Set();
  for (const s of list) {
    if (!isStr(s?.id)) { issues.push("mandatorySlice.id 누락"); continue; }
    foundIds.add(s.id);
    for (const key of ["contractPath", "guardPath", "harnessPath", "implPath", "samplePath"]) {
      const ref = s[key];
      if (ref === undefined) continue; // 해당 slice에 없는 경로 종류는 skip (Slice 0/1은 harness 없음)
      if (!isStr(ref)) { issues.push(`slice ${s.id}: ${key} 비문자열`); continue; }
      if (!io.exists(ref)) issues.push(`slice ${s.id}: ${key} 파일 없음 — ${ref}`);
    }
    if (!isStr(s.checkpoint)) issues.push(`slice ${s.id}: checkpoint 누락`);
    if (!isStr(s.requiredBeforeFutureAction)) issues.push(`slice ${s.id}: requiredBeforeFutureAction 누락`);
  }
  for (const rid of REQUIRED_SLICE_IDS) {
    if (!foundIds.has(rid)) issues.push(`mandatory slice 누락 — ${rid}`);
  }
  return issues;
}

// ── prior-slice contract schema 참조 검증 (pure + IO) ───────────────────────

// mandatorySlices의 harnessSchema가 실제 참조 contract의 schemaVersion과 일치하는지 확인.
export function validatePriorSliceSchemas(mandatorySlices, io = defaultIo()) {
  const issues = [];
  const list = Array.isArray(mandatorySlices) ? mandatorySlices : [];
  for (const s of list) {
    if (!isStr(s?.harnessSchema) || !isStr(s?.contractPath)) continue;
    if (!io.exists(s.contractPath)) { issues.push(`slice ${s.id}: contractPath 없어 schema 확인 불가`); continue; }
    let contract;
    try { contract = io.load(s.contractPath); }
    catch (e) { issues.push(`slice ${s.id}: contract parse 실패 — ${String(e).slice(0, 80)}`); continue; }
    if (contract.schemaVersion !== s.harnessSchema) {
      issues.push(`slice ${s.id}: harnessSchema(${s.harnessSchema}) != contract.schemaVersion(${contract.schemaVersion})`);
    }
  }
  return issues;
}

// ── checkpoint summary 생성 (pure) ──────────────────────────────────────────

export function buildCheckpointSummary(mandatorySlices) {
  const list = Array.isArray(mandatorySlices) ? mandatorySlices : [];
  return list.map((s) => ({ slice: s.slice, id: s.id, checkpoint: s.checkpoint }));
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

export function validateContract(contract, io = defaultIo()) {
  const issues = [];
  const push = (m) => issues.push(`contract: ${m}`);
  if (contract?.schemaVersion !== EXPECTED_CONTRACT_SCHEMA) push(`schemaVersion !== ${EXPECTED_CONTRACT_SCHEMA}`);
  if (contract?.status !== ALLOWED_READINESS_VERDICT) push(`status !== ${ALLOWED_READINESS_VERDICT}`);

  // flags 전부 false (fail-closed)
  issues.push(...detectForbiddenReadinessFlags(contract?.flags).map((m) => `contract flags: ${m}`));

  // readiness verdict
  const rv = contract?.readinessVerdict ?? {};
  const rvRes = evaluateReadinessLevel(rv.current);
  if (!rvRes.pass) push(`readinessVerdict — ${rvRes.issues.join("; ")}`);
  if (!isStrArr(rv.isNot) || rv.isNot.includes(ALLOWED_READINESS_VERDICT)) push("readinessVerdict.isNot 목록 누락 또는 자기모순");
  if (!isStr(rv.technicalPassIsNotOwnerApproval)) push("readinessVerdict.technicalPassIsNotOwnerApproval 문서 누락");

  // mandatory Slice 0~4 참조 실재
  issues.push(...validateMandatorySliceReferences(contract?.mandatorySlices, io));
  issues.push(...validatePriorSliceSchemas(contract?.mandatorySlices, io));
  if ((contract?.mandatorySlices?.length ?? 0) !== 5) push("mandatorySlices 5개 아님");

  // requiredGuardComposition 5개 실재
  const rgc = contract?.requiredGuardComposition ?? [];
  if (rgc.length !== 5) push("requiredGuardComposition 5개 아님");
  for (const g of rgc) { if (isStr(g) && !io.exists(g)) push(`requiredGuardComposition 파일 없음 — ${g}`); }

  // 미결 Owner decision — 전부 resolved되어 unresolvedOwnerDecisions는 빈 배열이어야 한다.
  // resolved 10개는 ownerDecisionState.resolvedDecisions로 이동(pending blocker로 재취급 금지).
  const dRes = detectUnresolvedOwnerDecisions(contract?.unresolvedOwnerDecisions, EXPECTED_PENDING_KEYS);
  issues.push(...dRes.issues.map((m) => `contract owner-decision: ${m}`));
  const udKeys = (contract?.unresolvedOwnerDecisions ?? []).map((d) => d?.key);
  if (!(Array.isArray(contract?.unresolvedOwnerDecisions) && contract.unresolvedOwnerDecisions.length === 0)) {
    push(`unresolvedOwnerDecisions는 빈 배열이어야 한다 (전부 resolved) — ${JSON.stringify(udKeys)}`);
  }
  // resolved decision이 pending blocker로 재도입되면 fail (stale 회귀 차단)
  for (const rk of EXPECTED_RESOLVED_KEYS) {
    if (udKeys.includes(rk)) push(`resolved 결정 "${rk}"가 unresolvedOwnerDecisions에 pending blocker로 재도입됨 (금지)`);
  }

  // Owner decision resolution state 섹션 검증 (resolved 10 + pending 0, 값·set·live-approval-오해)
  issues.push(...validateOwnerDecisionState(contract?.ownerDecisionState).map((m) => `contract ownerDecisionState: ${m}`));

  // prohibitedReadinessFlags 10종 명시
  if (!setEq(contract?.prohibitedReadinessFlags, PROHIBITED_READINESS_FLAGS)) push("prohibitedReadinessFlags 10종 불일치");

  // no-live policy
  const nl = contract?.noLivePolicy ?? {};
  const nlKeys = ["noLiveTts", "noPaidOrFreeTtsApiCall", "noAudioVideoImageFileRead", "noFfmpegOrProbeExecution",
    "noSilenceDetectExecution", "noRenderOrMuxRegeneration", "noImageGeneration", "noChatgptPlaywrightExecution",
    "noBrowserOrCdpLaunch", "noOtherExternalApi", "noUpload", "noUploadQueue", "noEnvOrSecretAccess",
    "noNetwork", "noChildProcess", "noWrite"];
  for (const k of nlKeys) { if (nl[k] !== true) push(`noLivePolicy.${k}는 true여야 한다`); }
  if (nl.standardHarnessMode !== "dry_run_static_validation_only") push("noLivePolicy.standardHarnessMode !== dry_run_static_validation_only");

  // future expansion gates
  const feg = contract?.futureExpansionGates ?? {};
  if (!Array.isArray(feg.order) || feg.order.length !== 7) push("futureExpansionGates.order 7단계 아님");
  // future execution plan gate 참조 — 실재 + no-live plan gate 검증 (readiness 승격 없이)
  if (feg.futureExecutionPlanGateRequired !== true) push("futureExpansionGates.futureExecutionPlanGateRequired !== true");
  if (!isStr(feg.futureExecutionPlanGateRef) || !feg.futureExecutionPlanGateRef.includes("future_execution_plan_gate")) {
    push("futureExpansionGates.futureExecutionPlanGateRef가 future execution plan gate fixture 참조 아님");
  } else if (!io.exists(feg.futureExecutionPlanGateRef)) {
    push(`futureExpansionGates.futureExecutionPlanGateRef 파일 없음 — ${feg.futureExecutionPlanGateRef}`);
  } else {
    issues.push(...validateFutureExecutionPlanGate(io.load(feg.futureExecutionPlanGateRef)).map((m) => `future execution plan gate: ${m}`));
  }

  if (!isStrArr(contract?.forbiddenBehavior) || contract.forbiddenBehavior.length < 12) push("forbiddenBehavior 부족(>=12)");
  if (contract?.integration?.mandatorySliceCount !== 5) push("integration.mandatorySliceCount !== 5");
  if (!isStr(contract?.integration?.failIfMissing)) push("integration.failIfMissing 문서 누락");
  return issues;
}

// ── plan 검증 (계약 + 참조 fixture 교차) ────────────────────────────────────

export function validatePlanAgainstContract(plan, contract, io = defaultIo()) {
  const issues = [];
  const push = (m) => issues.push(`plan: ${m}`);
  if (plan?.schemaVersion !== EXPECTED_PLAN_SCHEMA) push(`schemaVersion !== ${EXPECTED_PLAN_SCHEMA}`);
  if (!isStr(plan?.contractRef) || !plan.contractRef.endsWith("golden_sample_v3_2_integrated_production_readiness_contract.v1.json")) {
    push("contractRef가 통합 계약 fixture를 가리키지 않는다");
  }

  // flags 전부 false (fail-closed)
  issues.push(...detectForbiddenReadinessFlags(plan?.flags).map((m) => `plan flags: ${m}`));

  // readiness verdict
  const rvRes = evaluateReadinessLevel(plan?.readinessVerdict?.current);
  if (!rvRes.pass) push(`readinessVerdict — ${rvRes.issues.join("; ")}`);

  // sliceComposition: 5개 slice id + 참조 실재
  const comp = plan?.sliceComposition ?? [];
  const compIds = new Set(comp.map((s) => s?.id));
  for (const rid of REQUIRED_SLICE_IDS) { if (!compIds.has(rid)) push(`sliceComposition에 ${rid} 누락`); }
  for (const s of comp) {
    for (const key of ["contractPath", "guardPath", "harnessPath", "samplePath"]) {
      const ref = s?.[key];
      if (ref === undefined) continue;
      if (isStr(ref) && !io.exists(ref)) push(`sliceComposition ${s.id}: ${key} 파일 없음 — ${ref}`);
    }
  }
  // slice 0는 업로드 차단 상태 유지
  const s0 = comp.find((s) => s?.id === "upload-hard-block");
  if (s0 && s0.status !== "ACTIVE_BLOCKING") push("sliceComposition upload-hard-block.status !== ACTIVE_BLOCKING");

  // accepted lineage가 live 승인으로 해석되지 않음
  const al = plan?.acceptedLineage ?? {};
  if (isStr(al.acceptanceLock) && !io.exists(al.acceptanceLock)) push(`acceptedLineage.acceptanceLock 파일 없음 — ${al.acceptanceLock}`);
  if (!isStr(al.interpretationGuard)) push("acceptedLineage.interpretationGuard 누락 (lineage=live 승인 오해 방지)");

  // 미결 Owner decision 인지 — 전부 resolved되어 빈 배열이어야 한다
  const dRes = detectUnresolvedOwnerDecisions(plan?.unresolvedOwnerDecisionsAcknowledged, EXPECTED_PENDING_KEYS);
  issues.push(...dRes.issues.map((m) => `plan owner-decision: ${m}`));
  const planUdKeys = (plan?.unresolvedOwnerDecisionsAcknowledged ?? []).map((d) => d?.key);
  if (!(Array.isArray(plan?.unresolvedOwnerDecisionsAcknowledged) && plan.unresolvedOwnerDecisionsAcknowledged.length === 0)) {
    push(`unresolvedOwnerDecisionsAcknowledged는 빈 배열이어야 한다 (전부 resolved) — ${JSON.stringify(planUdKeys)}`);
  }
  for (const rk of EXPECTED_RESOLVED_KEYS) {
    if (planUdKeys.includes(rk)) push(`resolved 결정 "${rk}"가 plan pending blocker로 재도입됨 (금지)`);
  }

  // plan ownerDecisionStateAcknowledged — resolved 10 + pending 0 정합
  const ods = plan?.ownerDecisionStateAcknowledged ?? {};
  if (!isStr(ods.decisionStateRef) || !ods.decisionStateRef.includes("owner_decision_resolution_state")) {
    push("ownerDecisionStateAcknowledged.decisionStateRef가 decision resolution state fixture를 가리키지 않는다");
  }
  if (ods.resolvedCount !== 10) push(`ownerDecisionStateAcknowledged.resolvedCount "${ods.resolvedCount}" !== 10`);
  if (ods.pendingCount !== 0) push(`ownerDecisionStateAcknowledged.pendingCount "${ods.pendingCount}" !== 0`);
  if (!setEq(ods.resolvedKeys, EXPECTED_RESOLVED_KEYS)) push(`ownerDecisionStateAcknowledged.resolvedKeys 불일치 — ${JSON.stringify(ods.resolvedKeys)}`);
  if (!(Array.isArray(ods.pendingKeys) && ods.pendingKeys.length === 0)) push(`ownerDecisionStateAcknowledged.pendingKeys가 빈 배열이 아님 — ${JSON.stringify(ods.pendingKeys)}`);
  // owner_viewing_listening_qa 정책 resolved여도 실제 QA는 PENDING (자동 pass 방지)
  if (ods.ownerViewingListeningActualStatus !== undefined && ods.ownerViewingListeningActualStatus !== "PENDING_DIRECT_OWNER_REVIEW") {
    push(`ownerDecisionStateAcknowledged.ownerViewingListeningActualStatus "${ods.ownerViewingListeningActualStatus}" != PENDING_DIRECT_OWNER_REVIEW`);
  }

  // QA readiness: uploadReady/automationExpansionReady false + owner viewing PENDING
  const qa = plan?.qaReadiness ?? {};
  if (qa.uploadReady !== false) push("qaReadiness.uploadReady !== false");
  if (qa.automationExpansionReady !== false) push("qaReadiness.automationExpansionReady !== false");
  if (!isStr(qa.ownerViewingListeningPass) || !qa.ownerViewingListeningPass.includes("PENDING")) {
    push("qaReadiness.ownerViewingListeningPass는 PENDING을 포함해야 한다 (자동/기술 pass 대체 불가)");
  }

  // executionMode: live 실행 승인 없음
  issues.push(...detectLiveActionApprovals(plan?.executionMode).map((m) => `plan ${m}`));

  // future execution plan gate 인지 — 참조 실재 + no-live status
  const feg = plan?.futureExecutionPlanGateAcknowledged ?? {};
  if (!isStr(feg.gateRef) || !feg.gateRef.includes("future_execution_plan_gate")) {
    push("futureExecutionPlanGateAcknowledged.gateRef가 future execution plan gate fixture 참조 아님");
  } else if (!io.exists(feg.gateRef)) {
    push(`futureExecutionPlanGateAcknowledged.gateRef 파일 없음 — ${feg.gateRef}`);
  }
  if (feg.gateStatus !== "FUTURE_EXECUTION_PLAN_GATE_NO_LIVE") push(`futureExecutionPlanGateAcknowledged.gateStatus "${feg.gateStatus}" != FUTURE_EXECUTION_PLAN_GATE_NO_LIVE`);

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
  if (contract) issues.push(...validateContract(contract, io));
  if (contract && plan) issues.push(...validatePlanAgainstContract(plan, contract, io));

  let summary = null;
  if (issues.length === 0) {
    summary = {
      mode: "dry_run_static_validation_only",
      readinessVerdict: contract.readinessVerdict.current,
      mandatorySlices: contract.mandatorySlices.length,
      checkpoints: buildCheckpointSummary(contract.mandatorySlices),
      resolvedDecisions: contract.ownerDecisionState.resolvedCount,
      pendingDecisions: contract.unresolvedOwnerDecisions.length,
      ownerViewingListeningActualStatus: contract.ownerDecisionState.ownerViewingListeningActualStatus,
      prohibitedFlagsLocked: contract.prohibitedReadinessFlags.length,
      futureExecutionPlanGate: contract.futureExpansionGates?.futureExecutionPlanGateRef ?? null,
      futureExecutionPlanGateRequired: contract.futureExpansionGates?.futureExecutionPlanGateRequired === true,
      topicId: plan.topicId,
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
    console.error(`ABORT: ${args.refusedLiveFlag} 거부 — 이 slice의 통합 표준 harness는 dry-run/정적 검증 전용이다.`);
    console.error("live TTS/render/mux/upload/image generation은 미결 Owner 결정 해소 + 별도 승인 slice + live guard 후 별도 구현된다 (fail-closed).");
    process.exit(3);
  }
  if (args.usageError) {
    console.error(`USAGE ERROR: ${args.usageError}`);
    process.exit(2);
  }
  console.log("[integrated-readiness-standard-v1] mode=DRY_RUN_STATIC_VALIDATION_ONLY (no live / no render / no mux / no tts / no upload / no image-gen / no browser / no network / no env / no child-process / read-only)");
  console.log(`[integrated-readiness-standard-v1] contract: ${args.contractPath}`);
  console.log(`[integrated-readiness-standard-v1] plan:     ${args.planPath}`);
  const res = runDryRunValidation({ contractPath: args.contractPath, planPath: args.planPath });
  if (!res.ok) {
    for (const issue of res.issues) console.error(`FAIL  ${issue}`);
    console.error(`\nREADINESS RESULT: FAIL (${res.issues.length} issue(s))`);
    process.exit(1);
  }
  const s = res.summary;
  console.log(`[integrated-readiness-standard-v1] readiness verdict: ${s.readinessVerdict} (no-live only, not upload/production/live)`);
  console.log(`[integrated-readiness-standard-v1] mandatory slices: ${s.mandatorySlices}/5 (checkpoints: ${s.checkpoints.map((c) => c.checkpoint).join(", ")})`);
  console.log(`[integrated-readiness-standard-v1] owner decisions: ${s.resolvedDecisions} resolved (policy only, not live approval) + ${s.pendingDecisions} pending — owner QA actual status: ${s.ownerViewingListeningActualStatus} (정책 resolved ≠ 실제 QA pass)`);
  console.log(`[integrated-readiness-standard-v1] prohibited readiness flags locked: ${s.prohibitedFlagsLocked}`);
  console.log(`[integrated-readiness-standard-v1] future execution plan gate: ${s.futureExecutionPlanGate ?? "(none)"} (required=${s.futureExecutionPlanGateRequired}, no-live planning only — not execution approval)`);
  console.log(`[integrated-readiness-standard-v1] topic: ${s.topicId}`);
  console.log(`[integrated-readiness-standard-v1] Owner QA: ${s.ownerQaPending}`);
  console.log(`\nREADINESS RESULT: PASS (0 issues) — STANDARDIZED_NO_LIVE_READY, no-live dry-run만 수행됨`);
  process.exit(0);
}

const isMain = process.argv[1] && path.resolve(process.argv[1]).toLowerCase() === SELF.toLowerCase();
if (isMain) main();
