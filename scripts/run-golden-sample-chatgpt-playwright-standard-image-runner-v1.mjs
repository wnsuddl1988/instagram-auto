#!/usr/bin/env node
/**
 * run-golden-sample-chatgpt-playwright-standard-image-runner-v1.mjs
 *
 * Golden Sample v3.2 Slice 2 — ChatGPT 이미지 생성 표준 runner (no-live).
 * task: golden-sample-v3-2-chatgpt-playwright-runner-standardization-v1
 *
 * 이 slice에서는 dry-run/정적 검증 모드만 존재한다:
 *   - 계약 fixture(golden_sample_v3_2_chatgpt_playwright_runner_contract.v1.json)와
 *     plan fixture를 로드해 계약 준수를 검증하고 실행 계획 요약만 출력한다.
 *   - 브라우저/CDP/네트워크/env/secret 접근이 전혀 없고, 파일 시스템은 읽기 전용이다.
 *   - live 생성 모드는 구현되어 있지 않다 — live류 CLI flag는 즉시 abort (fail-closed).
 *   - import는 node:fs / node:path / node:url 만 허용된다 (계약 runnerImportRule).
 *
 * v3/v3.1 lineage에서 검증된 로직 표면을 재사용 가능한 pure function으로 노출한다:
 *   page-wide 수집 필터(user 첨부 제외, baseline cid 제외), stable×3 저장 판정,
 *   hard cap ledger(plan fixture 단일 소스), latency 진단(detect-to-save 30s target),
 *   same-run current-page recovery 판정(sidebar/old conversation 금지),
 *   passive-window resolution 검증(Owner 결정 #9 = accept_25s_passive_window_as_v3_2_behavior).
 * 미래 live slice는 이 모듈을 import해 동일 표면을 사용해야 하며,
 * 4번째 runner 클론 생성은 계약(forbiddenBehavior)상 금지다.
 *
 * exit codes: 0 = validation PASS · 1 = validation FAIL · 2 = usage 오류 · 3 = live-mode 거부
 */
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const SELF = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SELF), "..");

export const EXPECTED_CONTRACT_SCHEMA = "golden_sample_chatgpt_playwright_runner_contract_v1";
export const EXPECTED_PLAN_SCHEMA = "golden_sample_chatgpt_playwright_runner_plan_v1";
export const DEFAULT_CONTRACT_PATH = path.join(
  ROOT, "scripts", "fixtures", "golden_sample_v3_2_chatgpt_playwright_runner_contract.v1.json");
export const DEFAULT_PLAN_PATH = path.join(
  ROOT, "scripts", "fixtures", "golden_sample_v3_2_chatgpt_playwright_runner_sample_plan.t1_lifestyle_inflation.v1.json");

// live류 flag는 이 slice에 존재하지 않는 기능 — 발견 즉시 거부 (fail-closed)
export const REFUSED_LIVE_FLAGS = ["--live", "--generate", "--submit", "--arm", "--allow-live", "--browser"];

// Owner 결정 #9 = accept_25s_passive_window_as_v3_2_behavior. resolved timing 해석 표준.
export const PASSIVE_WINDOW_RESOLVED_VALUE = "accept_25s_passive_window_as_v3_2_behavior";
export const PASSIVE_WINDOW_PROFILE = { passiveWindowMs: 25000, pollIntervalMs: 1800 };
// resolved timing 섹션에 남아있으면 안 되는 미결/pending 문구 (pending 재도입 방지).
// 주: 대안 이름 자체(switch_to_immediate_1_2s_poll)는 감사 기록용으로 rejectedAlternative* 필드에
// 담길 수 있으므로 pending 토큰에 넣지 않는다 — immediate-poll-only가 표준이라는 "주장"은
// resolvedValue가 잘못된 값일 때 별도로 잡힌다.
export const PASSIVE_WINDOW_PENDING_TOKENS = [
  "openOwnerDecision", "pending", "TBD", "TODO", "미결", "미정", "확정 전까지",
];
// pending 스캔에서 제외하는 감사-기록 전용 필드 (대안 이름을 의도적으로 담는 곳)
const PASSIVE_WINDOW_AUDIT_ONLY_FIELDS = ["rejectedAlternative", "rejectedAlternativeNote"];

const isStr = (v) => typeof v === "string" && v.trim().length > 0;
const isStrArr = (v) => Array.isArray(v) && v.length > 0 && v.every(isStr);
const isNum = (v) => typeof v === "number" && Number.isFinite(v);
const setEq = (a, b) =>
  Array.isArray(a) && Array.isArray(b) && a.length === b.length &&
  [...a].sort().join("|") === [...b].sort().join("|");

// ── v3 lineage 검증 로직 표면 (pure) ────────────────────────────────────────

export function imageFileNameFor(order, imageId) {
  return `img-${String(order).padStart(2, "0")}-${imageId}.png`;
}

// page-wide 수집 의미론: 생성물 URL marker 또는 blob, user 첨부 제외, 최소 폭 200px
export const GENERATED_URL_MARKERS = /backend-api\/estuary\/content|backend-api\/files|oaiusercontent/;

export function isGeneratedImageCandidate(img, { minCandidateWidthPx = 200 } = {}) {
  if (!img || typeof img.src !== "string" || img.src.length === 0) return false;
  if (img.insideUserAttachment === true) return false;
  if (!(Number(img.naturalWidth) >= minCandidateWidthPx)) return false;
  return GENERATED_URL_MARKERS.test(img.src) || img.src.startsWith("blob:");
}

// fresh 후보: 생성물 조건 + 폭 400px 이상 + 제출 직전 baseline cid에 없던 것 (stale 제외)
export function filterFreshCandidates(imgs, baselineCids, { minFreshWidthPx = 400, minCandidateWidthPx = 200 } = {}) {
  const base = baselineCids instanceof Set ? baselineCids : new Set(baselineCids ?? []);
  return (Array.isArray(imgs) ? imgs : []).filter((x) =>
    isGeneratedImageCandidate(x, { minCandidateWidthPx }) &&
    Number(x.naturalWidth) >= minFreshWidthPx &&
    (!x.cid || !base.has(x.cid)));
}

export function stableCandidateKey(img) {
  return `${img.cid || String(img.src).slice(0, 80)}|${img.naturalWidth}x${img.naturalHeight}`;
}

// stable×N 판정 — 같은 key가 N회 연속 관측되면 idle 대기 없이 즉시 저장
export function updateStableState(state, key, stablePollsToSave = 3) {
  const prev = state && state.key === key ? state.count : 0;
  const count = prev + 1;
  return { key, count, saveNow: count >= stablePollsToSave };
}

// hard cap ledger — cap은 반드시 plan fixture에서 온다 (runner 상수 금지)
export function createSubmissionLedger(hardCap) {
  if (!Number.isInteger(hardCap) || hardCap < 1) {
    throw new Error(`submission hard cap은 plan fixture의 positive integer여야 한다 — 수신값 ${hardCap}`);
  }
  let used = 0;
  return {
    get used() { return used; },
    get cap() { return hardCap; },
    canSubmit() { return used < hardCap; },
    recordSubmission() {
      if (used >= hardCap) throw new Error(`SUBMISSION_HARD_CAP(${hardCap}) 도달 — 신규 제출 불가`);
      used += 1;
      return used;
    },
  };
}

// latency 진단 — detect-to-save target(기본 30s) 초과 시 진단 필수
export function evaluateLatency(entry, { detectToSaveTargetSec = 30 } = {}) {
  const first = Number.isFinite(entry?.firstCandidateSec) ? entry.firstCandidateSec : null;
  const saved = Number.isFinite(entry?.savedSec) ? entry.savedSec : null;
  const detectionLatencySec = first !== null && saved !== null ? saved - first : null;
  const over = detectionLatencySec !== null && detectionLatencySec > detectToSaveTargetSec;
  const undetected = first === null && saved === null;
  return {
    submitToFirstImageSec: first,
    submitToSaveSec: saved,
    detectionLatencySec,
    delayedSaveOverTarget: over,
    diagnosticRequired: over || undetected,
    diagnosticReason: over
      ? `detect-to-save ${detectionLatencySec}s > target ${detectToSaveTargetSec}s — 원인 진단 기록 필수`
      : undetected ? "후보 미감지 — diagnostic screenshot/DOM summary 캡처 필요" : null,
  };
}

// 대화 위생 — sidebar/old conversation 금지, same-run current-page recovery만 예외
export function evaluateRecoveryRequest({ source, sameRun, knownCurrentImage } = {}) {
  if (source !== "current_page") {
    return { allowed: false, reason: "sidebar/old-conversation recovery 금지 — current_page만 허용" };
  }
  if (sameRun !== true || knownCurrentImage !== true) {
    return { allowed: false, reason: "같은 승인 run의 known current image 회수만 예외적으로 허용" };
  }
  return { allowed: true, reason: "same-run current-page recovery 허용" };
}

// ── passive-window resolution 검증 (pure, Owner 결정 #9) ────────────────────

// resolved timing 섹션에 미결/pending 문구가 남아있으면 true (pending 재도입 방지).
// 감사-기록 전용 필드(rejectedAlternative*)는 대안 이름을 의도적으로 담으므로 스캔에서 제외한다.
export function hasPassiveWindowPendingWording(sectionJson) {
  let scanTarget = sectionJson;
  if (sectionJson && typeof sectionJson === "object") {
    scanTarget = {};
    for (const [k, v] of Object.entries(sectionJson)) {
      if (!PASSIVE_WINDOW_AUDIT_ONLY_FIELDS.includes(k)) scanTarget[k] = v;
    }
  }
  const text = typeof scanTarget === "string" ? scanTarget : JSON.stringify(scanTarget ?? {});
  return PASSIVE_WINDOW_PENDING_TOKENS.some((tok) => {
    if (/[가-힣]/.test(tok)) return text.includes(tok);
    return text.toLowerCase().includes(tok.toLowerCase());
  });
}

// contract 또는 plan의 passive-window resolution 섹션 하나를 fail-closed 검증한다.
// section: contract.timingStandard.passiveWindowInterpretation 또는 plan.timingInterpretation.
// operationalProfile: contract.timingStandard.operationalProfile (profile 값 대조용).
export function validatePassiveWindowResolution(section, operationalProfile, label = "passiveWindow") {
  const issues = [];
  const push = (m) => issues.push(`${label}: ${m}`);
  if (!section || typeof section !== "object") { push("resolution 섹션 누락 (Owner 결정 #9 = resolved 필수)"); return issues; }

  if (section.resolvedValue !== PASSIVE_WINDOW_RESOLVED_VALUE) {
    push(`resolvedValue(${section.resolvedValue}) != ${PASSIVE_WINDOW_RESOLVED_VALUE}`);
  }
  if (section.passiveWindowIsStandardV32Behavior !== true) push("passiveWindowIsStandardV32Behavior !== true");
  if (section.notLiveApproval !== true) push("notLiveApproval !== true (타이밍 해석은 live/생성 승인 아님 명시 필수)");

  const ref = section.resolvedDecisionRef ?? {};
  if (ref.decisionId !== 9) push("resolvedDecisionRef.decisionId !== 9");
  if (ref.resolvedValue !== PASSIVE_WINDOW_RESOLVED_VALUE) push(`resolvedDecisionRef.resolvedValue != ${PASSIVE_WINDOW_RESOLVED_VALUE}`);
  if (!isStr(ref.decisionStateFixture) || !ref.decisionStateFixture.endsWith("golden_sample_v3_2_owner_decision_resolution_state.v1.json")) {
    push("resolvedDecisionRef.decisionStateFixture가 decision state fixture를 가리키지 않음");
  }

  // pending/open/TBD/immediate-poll-only 문구 재도입 금지
  if (hasPassiveWindowPendingWording(section)) push("resolved 섹션에 pending/open/TBD/대안(immediate-poll) 문구 잔존");

  // profile 값 대조 — resolved 값이 operationalProfile과 어긋나면 fail (변조 방지)
  const op = operationalProfile ?? {};
  // section이 자체 profile 블록을 가지면(plan) 그것도 대조, 아니면 operationalProfile만.
  const secProfile = section.profile ?? null;
  if (isNum(op.passiveWindowMs) && op.passiveWindowMs !== PASSIVE_WINDOW_PROFILE.passiveWindowMs) {
    push(`operationalProfile.passiveWindowMs(${op.passiveWindowMs}) != ${PASSIVE_WINDOW_PROFILE.passiveWindowMs}`);
  }
  if (isNum(op.pollIntervalMs) && op.pollIntervalMs !== PASSIVE_WINDOW_PROFILE.pollIntervalMs) {
    push(`operationalProfile.pollIntervalMs(${op.pollIntervalMs}) != ${PASSIVE_WINDOW_PROFILE.pollIntervalMs}`);
  }
  if (secProfile) {
    if (secProfile.passiveWindowMs !== PASSIVE_WINDOW_PROFILE.passiveWindowMs) {
      push(`profile.passiveWindowMs(${secProfile.passiveWindowMs}) != ${PASSIVE_WINDOW_PROFILE.passiveWindowMs}`);
    }
    if (secProfile.pollIntervalMs !== PASSIVE_WINDOW_PROFILE.pollIntervalMs) {
      push(`profile.pollIntervalMs(${secProfile.pollIntervalMs}) != ${PASSIVE_WINDOW_PROFILE.pollIntervalMs}`);
    }
    // plan profile이 contract operationalProfile과도 일치해야 함 (drift 방지)
    if (isNum(op.passiveWindowMs) && secProfile.passiveWindowMs !== op.passiveWindowMs) {
      push(`profile.passiveWindowMs가 contract operationalProfile(${op.passiveWindowMs})과 불일치`);
    }
    if (isNum(op.pollIntervalMs) && secProfile.pollIntervalMs !== op.pollIntervalMs) {
      push(`profile.pollIntervalMs가 contract operationalProfile(${op.pollIntervalMs})과 불일치`);
    }
  }
  return issues;
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
  for (const k of ["uploadReady", "automationExpansionReady", "implementationApproved", "liveGenerationApproved"]) {
    if (fl[k] !== false) push(`flags.${k}는 false여야 한다`);
  }

  const nl = contract?.noLivePolicy ?? {};
  for (const k of ["noChatgptPlaywrightExecution", "noBrowserOrCdpLaunch", "noImageGeneration", "noPaidApiCalls",
    "noLiveTts", "noRenderOrMux", "noUpload", "noUploadQueue", "noEnvOrSecretAccess", "noNetwork", "noWrite"]) {
    if (nl[k] !== true) push(`noLivePolicy.${k}는 true여야 한다`);
  }
  if (nl.standardRunnerMode !== "dry_run_validation_only") push("noLivePolicy.standardRunnerMode !== dry_run_validation_only");

  const am = contract?.approvalModel ?? {};
  if (am.liveGenerationApprovedNow !== false) push("approvalModel.liveGenerationApprovedNow은 false여야 한다");
  if (am.hardCapRule?.sourceType !== "plan_fixture") push("hardCapRule.sourceType !== plan_fixture");
  if (am.hardCapRule?.forbidRunnerConstants !== true) push("hardCapRule.forbidRunnerConstants !== true");
  if (!isStrArr(am.planInputSchema?.requiredBlocks)) push("planInputSchema.requiredBlocks 누락");

  const t = contract?.timingStandard ?? {};
  const bounds = t.pollIntervalSecBounds ?? {};
  const op = t.operationalProfile ?? {};
  if (!(Number.isFinite(bounds.min) && Number.isFinite(bounds.max) && bounds.min < bounds.max)) {
    push("pollIntervalSecBounds min/max 불량");
  } else if (!(Number.isFinite(op.pollIntervalMs) && op.pollIntervalMs >= bounds.min * 1000 && op.pollIntervalMs <= bounds.max * 1000)) {
    push(`operationalProfile.pollIntervalMs(${op.pollIntervalMs})가 pollIntervalSecBounds(${bounds.min}~${bounds.max}s) 밖`);
  }
  if (!(Number.isFinite(t.detectToSaveTargetSec) && t.detectToSaveTargetSec > 0)) push("detectToSaveTargetSec 불량");
  if (!(op.passiveWindowMs < op.diagnosticAtMs && op.diagnosticAtMs < op.hardTimeoutMs)) {
    push("passiveWindowMs < diagnosticAtMs < hardTimeoutMs 순서 위반");
  }
  if (!(Number.isInteger(op.stablePollsToSave) && op.stablePollsToSave >= 1)) push("stablePollsToSave 불량");

  // Owner 결정 #9 — passive-window resolution (resolved, not pending)
  issues.push(...validatePassiveWindowResolution(t.passiveWindowInterpretation, op, "contract passiveWindow"));

  const ch = contract?.conversationHygiene ?? {};
  if (ch.sidebarScanProhibited !== true) push("conversationHygiene.sidebarScanProhibited !== true");
  if (ch.oldConversationReusePolicy !== "forbidden_except_same_run_current_image_recovery") {
    push("oldConversationReusePolicy 불일치");
  }
  if (ch.sameRunRecovery?.allowedSource !== "current_page_only") push("sameRunRecovery.allowedSource !== current_page_only");

  const cs = contract?.collectionStandard ?? {};
  if (cs.method !== "page_wide_generated_image_collection") push("collectionStandard.method !== page_wide_generated_image_collection");
  if (cs.excludeUserAttachments !== true) push("collectionStandard.excludeUserAttachments !== true");
  if (cs.excludeStaleImages !== true) push("collectionStandard.excludeStaleImages !== true");

  const of = contract?.outputFacts ?? {};
  if (of.nativeResolutionRisk?.value !== "941x1672") push("nativeResolutionRisk.value !== 941x1672");
  if (of.nativeResolutionRisk?.autoRejectForbidden !== true) push("nativeResolutionRisk.autoRejectForbidden !== true");
  if (of.upscalingAsFixForbidden !== true) push("upscalingAsFixForbidden !== true");
  if (!isStrArr(of.requiredPerImage)) push("outputFacts.requiredPerImage 누락");

  if (contract?.sliceOneIntegration?.planMustReferenceStoryVisualEvidence !== true) {
    push("sliceOneIntegration.planMustReferenceStoryVisualEvidence !== true");
  }
  return issues;
}

// ── plan 검증 (계약 + 참조 fixture 교차) ────────────────────────────────────

export function validatePlanAgainstContract(plan, contract, io = defaultIo()) {
  const issues = [];
  const push = (m) => issues.push(`plan: ${m}`);
  const expectedPlanSchema = contract?.approvalModel?.planInputSchema?.schemaVersion ?? EXPECTED_PLAN_SCHEMA;
  if (plan?.schemaVersion !== expectedPlanSchema) push(`schemaVersion !== ${expectedPlanSchema}`);
  if (!isStr(plan?.contractRef) || !plan.contractRef.endsWith("golden_sample_v3_2_chatgpt_playwright_runner_contract.v1.json")) {
    push("contractRef가 표준 계약 fixture를 가리키지 않는다");
  }

  const fl = plan?.flags ?? {};
  for (const k of ["uploadReady", "automationExpansionReady", "implementationApproved", "liveGenerationApproved"]) {
    if (fl[k] !== false) push(`flags.${k}는 false여야 한다`);
  }

  for (const block of contract?.approvalModel?.planInputSchema?.requiredBlocks ?? []) {
    if (plan?.[block] === undefined) push(`required block 누락 — ${block}`);
  }

  const ota = plan?.ownerTopicApproval ?? {};
  if (ota.approved !== true) push("ownerTopicApproval.approved !== true");
  if (ota.permanentChannelWideTopicLock !== false) push("ownerTopicApproval.permanentChannelWideTopicLock !== false");
  for (const k of ["topicId", "title", "approvedScope", "approvalSourceNote"]) {
    if (!isStr(ota[k])) push(`ownerTopicApproval.${k} 비어 있음`);
  }

  // Slice 1 integration — story/visual evidence reference 없으면 fail
  const sve = plan?.storyVisualEvidenceRef;
  const s1 = contract?.sliceOneIntegration ?? {};
  if (!sve || !isStr(sve.contract) || !isStr(sve.sample)) {
    push("storyVisualEvidenceRef(contract/sample) 누락 — Slice 1 story/visual evidence 참조 필수");
  } else {
    if (isStr(s1.sliceOneContract) && !sve.contract.endsWith(path.basename(s1.sliceOneContract))) {
      push("storyVisualEvidenceRef.contract가 Slice 1 계약 fixture와 다르다");
    }
    if (isStr(s1.sliceOneSample) && !sve.sample.endsWith(path.basename(s1.sliceOneSample))) {
      push("storyVisualEvidenceRef.sample이 Slice 1 accepted sample과 다르다");
    }
    for (const [label, ref] of [["contract", sve.contract], ["sample", sve.sample]]) {
      if (!io.exists(ref)) { push(`storyVisualEvidenceRef.${label} 파일 없음 — ${ref}`); continue; }
      try { io.load(ref); } catch (e) { push(`storyVisualEvidenceRef.${label} JSON parse 실패 — ${String(e).slice(0, 120)}`); }
    }
    if (io.exists(sve.sample)) {
      try {
        const s1sample = io.load(sve.sample);
        const otc = s1sample?.owner_topic_confirmation ?? {};
        if (otc.topicId !== ota.topicId || otc.title !== ota.title) {
          push("ownerTopicApproval topicId/title이 Slice 1 accepted sample과 불일치");
        }
      } catch { /* parse 실패는 위에서 이미 issue 처리 */ }
    }
  }

  // prompt set — 경로/스키마/개수가 실제 fixture와 일치해야 한다
  const promptIdUniverse = new Set();
  const checkPromptFixture = (label, block, { requireTopicMatch = true } = {}) => {
    if (!block) return null;
    if (!isStr(block.path)) { push(`promptSet.${label}.path 비어 있음`); return null; }
    if (!io.exists(block.path)) { push(`promptSet.${label} 파일 없음 — ${block.path}`); return null; }
    let doc;
    try { doc = io.load(block.path); } catch (e) {
      push(`promptSet.${label} JSON parse 실패 — ${String(e).slice(0, 120)}`); return null;
    }
    if (doc.schemaVersion !== block.schemaVersion) {
      push(`promptSet.${label}.schemaVersion(${block.schemaVersion})이 실제 파일(${doc.schemaVersion})과 불일치`);
    }
    const prompts = Array.isArray(doc.prompts) ? doc.prompts : [];
    if (prompts.length !== block.promptCount) {
      push(`promptSet.${label}.promptCount(${block.promptCount})이 실제 prompts 길이(${prompts.length})와 불일치`);
    }
    const orders = prompts.map((p) => p.order);
    if (new Set(orders).size !== orders.length) push(`promptSet.${label} order 중복`);
    if (requireTopicMatch && doc.topicId !== ota.topicId) {
      push(`promptSet.${label} topicId(${doc.topicId})가 ownerTopicApproval(${ota.topicId})과 불일치`);
    }
    for (const p of prompts) if (isStr(p.imageId)) promptIdUniverse.add(p.imageId);
    return { doc, prompts };
  };
  const primary = checkPromptFixture("primary", plan?.promptSet?.primary);
  checkPromptFixture("patchRunLineage", plan?.promptSet?.patchRunLineage);

  // hard cap — plan fixture 단일 소스
  const cap = plan?.submissionHardCap ?? {};
  if (!(Number.isInteger(cap.value) && cap.value >= 1)) push(`submissionHardCap.value는 positive integer여야 한다 — 수신값 ${cap.value}`);
  if (cap.sourceType !== "plan_fixture") push("submissionHardCap.sourceType !== plan_fixture");
  if (cap.forbidRunnerConstants !== true) push("submissionHardCap.forbidRunnerConstants !== true");
  if (primary && Number.isInteger(cap.value) && primary.prompts.length > cap.value) {
    push(`primary promptCount(${primary.prompts.length}) > hardCap(${cap.value})`);
  }
  if (!isStr(cap.approvalSourceNote)) push("submissionHardCap.approvalSourceNote 비어 있음");

  if (plan?.costCapUsd !== 0) push(`costCapUsd는 ChatGPT 경로에서 0이어야 한다 — 수신값 ${plan?.costCapUsd}`);
  if (!isStrArr(plan?.stopConditions) || plan.stopConditions.length < 3) {
    push("stopConditions는 3개 이상의 non-empty string array여야 한다");
  }

  // 품질 기준 — Slice 1 계약 reject 코드와 정확히 일치 + accepted md5 lock 교차
  const eq = plan?.expectedImageQuality ?? {};
  if (sve && isStr(sve.contract) && io.exists(sve.contract)) {
    try {
      const s1contract = io.load(sve.contract);
      const ve = s1contract?.visualEvidence ?? {};
      if (!setEq(eq.rejectCodesBase, ve.baseRejectCodes ?? [])) {
        push("expectedImageQuality.rejectCodesBase가 Slice 1 계약 baseRejectCodes와 불일치");
      }
      const moneyCodes = [...(ve.koreanMoneyHardFailCodes ?? []), ...(ve.moneyDominantExtraRejectCodes ?? [])];
      if (!setEq(eq.moneyDominantRejectCodes, moneyCodes)) {
        push("expectedImageQuality.moneyDominantRejectCodes가 Slice 1 계약(화폐 hard-fail 7 + money_clarity_fail)과 불일치");
      }
    } catch { /* parse 실패는 위에서 이미 issue 처리 */ }
  }
  if (!isStr(eq.nativeResolutionRisk) || !eq.nativeResolutionRisk.includes("941x1672")) {
    push("expectedImageQuality.nativeResolutionRisk에 941x1672 기술 리스크 기록이 없다");
  }
  const lock = Array.isArray(eq.acceptedSetMd5Lock) ? eq.acceptedSetMd5Lock : [];
  if (lock.length === 0) push("expectedImageQuality.acceptedSetMd5Lock 비어 있음");
  if (isStr(eq.md5LockSource)) {
    const [srcPath, srcField] = eq.md5LockSource.split("#");
    if (!io.exists(srcPath)) push(`md5LockSource 파일 없음 — ${srcPath}`);
    else {
      try {
        const src = io.load(srcPath);
        const expected = (src?.[srcField ?? "selected_image_set"] ?? []).map((e) => ({ imageId: e.imageId, md5: e.md5 }));
        const same = expected.length === lock.length &&
          expected.every((e, i) => lock[i]?.imageId === e.imageId && lock[i]?.md5 === e.md5);
        if (!same) push("acceptedSetMd5Lock이 md5LockSource(selected_image_set)와 verbatim 불일치");
      } catch (e) { push(`md5LockSource parse 실패 — ${String(e).slice(0, 120)}`); }
    }
  } else {
    push("expectedImageQuality.md5LockSource 비어 있음");
  }
  if (promptIdUniverse.size > 0) {
    const orphan = lock.filter((e) => !promptIdUniverse.has(e.imageId));
    if (orphan.length > 0) {
      push(`acceptedSetMd5Lock imageId가 promptSet(primary+patchRunLineage) 어디에도 없음 — ${orphan.map((e) => e.imageId).join(",")}`);
    }
  }

  // Owner 결정 #9 — plan의 passive-window 타이밍 해석이 resolved이고 contract profile과 일치
  issues.push(...validatePassiveWindowResolution(
    plan?.timingInterpretation, contract?.timingStandard?.operationalProfile, "plan timingInterpretation"));

  const em = plan?.executionMode ?? {};
  if (em.approvedNow !== "dry_run_validation_only") push("executionMode.approvedNow !== dry_run_validation_only");
  if (em.liveGenerationApprovedNow !== false) push("executionMode.liveGenerationApprovedNow !== false");

  return issues;
}

// ── dry-run 실행 계획 (no-live, in-memory) ──────────────────────────────────

export function buildExecutionPlan(plan, contract, io = defaultIo()) {
  const capValue = plan?.submissionHardCap?.value;
  const ledger = createSubmissionLedger(capValue);
  const entries = [];
  const primaryRef = plan?.promptSet?.primary;
  if (primaryRef && isStr(primaryRef.path) && io.exists(primaryRef.path)) {
    const doc = io.load(primaryRef.path);
    for (const p of (doc.prompts ?? []).slice().sort((a, b) => a.order - b.order)) {
      const budget = ledger.recordSubmission(); // in-memory 시뮬레이션 — 실제 제출 아님
      entries.push({
        order: p.order,
        imageId: p.imageId,
        beat: p.beat,
        targetFileName: imageFileNameFor(p.order, p.imageId),
        submissionBudget: `${budget}/${ledger.cap}`,
      });
    }
  }
  const op = contract?.timingStandard?.operationalProfile ?? {};
  return {
    mode: "dry_run_validation_only",
    submissionHardCap: capValue,
    simulatedSubmissions: ledger.used,
    remainingBudget: ledger.cap - ledger.used,
    timingPolicy: {
      passiveWindowMs: op.passiveWindowMs,
      pollIntervalMs: op.pollIntervalMs,
      stablePollsToSave: op.stablePollsToSave,
      diagnosticAtMs: op.diagnosticAtMs,
      hardTimeoutMs: op.hardTimeoutMs,
      detectToSaveTargetSec: contract?.timingStandard?.detectToSaveTargetSec,
      passiveWindowResolvedValue: contract?.timingStandard?.passiveWindowInterpretation?.resolvedValue ?? "(누락)",
    },
    hygiene: {
      sidebarScanProhibited: contract?.conversationHygiene?.sidebarScanProhibited === true,
      oldConversationReusePolicy: contract?.conversationHygiene?.oldConversationReusePolicy,
    },
    entries,
  };
}

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
  let executionPlan = null;
  if (issues.length === 0) {
    try { executionPlan = buildExecutionPlan(plan, contract, io); }
    catch (e) { issues.push(`execution plan 구성 실패 — ${String(e).slice(0, 160)}`); }
  }
  return { ok: issues.length === 0, issues, contract, plan, executionPlan };
}

// ── CLI ─────────────────────────────────────────────────────────────────────

function parseArgs(argv) {
  const out = { contractPath: DEFAULT_CONTRACT_PATH, planPath: DEFAULT_PLAN_PATH };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (REFUSED_LIVE_FLAGS.includes(a)) return { refusedLiveFlag: a };
    if (a === "--dry-run") continue; // 기본 모드와 동일
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
    console.error(`ABORT: ${args.refusedLiveFlag} 거부 — 이 slice의 standard runner는 dry-run/정적 검증 전용이다.`);
    console.error("live 생성은 Owner 승인 slice + 계약 approvalModel.futureGenerationRequires 충족 후 별도 구현된다 (fail-closed).");
    process.exit(3);
  }
  if (args.usageError) {
    console.error(`USAGE ERROR: ${args.usageError}`);
    process.exit(2);
  }
  console.log("[standard-runner-v1] mode=DRY_RUN_VALIDATION_ONLY (no browser / no network / no env / read-only)");
  console.log(`[standard-runner-v1] contract: ${args.contractPath}`);
  console.log(`[standard-runner-v1] plan:     ${args.planPath}`);
  const res = runDryRunValidation({ contractPath: args.contractPath, planPath: args.planPath });
  if (!res.ok) {
    for (const issue of res.issues) console.error(`FAIL  ${issue}`);
    console.error(`\nVALIDATION RESULT: FAIL (${res.issues.length} issue(s))`);
    process.exit(1);
  }
  const ep = res.executionPlan;
  console.log(`[standard-runner-v1] topic: ${res.plan.ownerTopicApproval.topicId} — ${res.plan.ownerTopicApproval.title}`);
  console.log(`[standard-runner-v1] hard cap(plan fixture): ${ep.submissionHardCap} · 시뮬레이션 제출 ${ep.simulatedSubmissions} · 잔여 ${ep.remainingBudget}`);
  console.log(`[standard-runner-v1] timing: passive ${ep.timingPolicy.passiveWindowMs}ms → poll ${ep.timingPolicy.pollIntervalMs}ms, stable×${ep.timingPolicy.stablePollsToSave}, diag ${ep.timingPolicy.diagnosticAtMs}ms, hard timeout ${ep.timingPolicy.hardTimeoutMs}ms, detect-to-save target ${ep.timingPolicy.detectToSaveTargetSec}s`);
  console.log(`[standard-runner-v1] passive-window 해석(Owner 결정 #9): ${ep.timingPolicy.passiveWindowResolvedValue} (v3.2 표준 동작, live/생성 승인 아님)`);
  console.log(`[standard-runner-v1] hygiene: sidebarScanProhibited=${ep.hygiene.sidebarScanProhibited}, oldConversationReuse=${ep.hygiene.oldConversationReusePolicy}`);
  for (const e of ep.entries) {
    console.log(`  order ${String(e.order).padStart(2, " ")} [${e.beat}] → ${e.targetFileName} (budget ${e.submissionBudget})`);
  }
  console.log(`\nVALIDATION RESULT: PASS (0 issues) — no-live dry-run만 수행됨`);
  process.exit(0);
}

const isMain = process.argv[1] && path.resolve(process.argv[1]).toLowerCase() === SELF.toLowerCase();
if (isMain) main();
