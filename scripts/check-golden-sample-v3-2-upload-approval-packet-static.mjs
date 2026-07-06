#!/usr/bin/env node
/**
 * check-golden-sample-v3-2-upload-approval-packet-static.mjs
 *
 * Golden Sample v3.2 — Owner QA actual pass + upload approval packet 정적 가드 (no-live).
 * task: golden-sample-v3-2-owner-qa-pass-upload-approval-packet-prep-v1
 *
 * 이 가드 자체는 no-live다: 레포 내 fixture JSON + markdown만 읽는다.
 * (upload/network/env/secret/platform/DB/write/subprocess/media binary read 없음)
 *
 * 검증 대상:
 *   1) Owner QA actual pass 문구가 fixture에 정확히(문자 단위) 기록됨 + Owner 직접 확인 근거
 *   2) Owner QA pass는 upload 승인이 아님 — uploadApprovedNow/uploadExecutionApprovedNow/
 *      uploadReady/productionReady false + uploadHardBlockActive true + 선행 조건 역할 명시
 *   3) upload approval packet은 future-use-only — uploadApprovalGrantedNow false,
 *      currentApprovalFlags/prohibitedReadinessFlags 전부 false
 *   4) upload hard block active + policy 참조 실재
 *   5) latest mux candidate 참조 = render/mux plan의 mux path + audit JSON 참조
 *   6) future upload snippet이 future-use-only 라벨 + 별도 APPROVE_UPLOAD + Owner QA 선행 요구
 *   7) upload cap이 현재 유효하지 않음(effectiveNow=false) + no-regeneration/no-render/no-TTS 경계
 *   8) 참조 계약(render/mux plan, hard block, future gate, integrated readiness, live action packet) 실재
 *   9) markdown이 NOT UPLOAD APPROVAL 문구 + fixture와 정합 (mux path/QA 문구/snippet)
 *  10) mutant: owner QA text drift, uploadApprovedNow/uploadReady true, uploadHardBlockActive false,
 *      snippet 현재 승인화, platform credential now, latest mux 참조 누락,
 *      별도 APPROVE_UPLOAD 요건 제거, no-regeneration/no-render/no-TTS 경계 제거 → 전부 fail
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

const QA_PATH = FX("golden_sample_v3_2_owner_qa_actual_pass.t1_lifestyle_inflation.v1.json");
const PACKET_PATH = FX("golden_sample_v3_2_upload_approval_packet.t1_lifestyle_inflation.v1.json");
const RENDER_MUX_PATH = FX("golden_sample_v3_2_live_render_mux_run_plan.t1_lifestyle_inflation.v1.json");
const HARD_BLOCK_PATH = FX("golden_sample_v3_2_upload_hard_block_policy.v1.json");
const GATE_PATH = FX("golden_sample_v3_2_future_execution_plan_gate.v1.json");
const READINESS_PATH = FX("golden_sample_v3_2_integrated_production_readiness_contract.v1.json");
const LIVE_ACTION_PATH = FX("golden_sample_v3_2_live_action_approval_packet.v1.json");
const MD_PATH = path.join(ROOT, "_ai", "GOLDEN_SAMPLE_V3_2_UPLOAD_APPROVAL_PACKET.md");

const EXACT_OWNER_QA_PASS =
  "OWNER_QA_ACTUAL_PASS: t1_lifestyle_inflation — latest mux mp4 watched/listened directly by Owner, visual/caption/story/audio accepted, proceed to prepare upload approval packet only; no upload execution yet";
const LATEST_MUX_MP4 =
  "C:\\tmp\\money-shorts-os\\golden-sample-chatgpt-playwright-v3-2-script-voice-mux-audit\\golden_sample_t1_lifestyle_inflation_tts_mux_v3_2.mp4";
const QA_FALSE_FLAGS = ["uploadApprovedNow", "uploadExecutionApprovedNow", "uploadReady", "productionReady"];
const PACKET_APPROVAL_FLAGS = [
  "uploadApprovalGrantedNow", "uploadExecutionApprovedNow", "uploadEndpointUnblockApprovedNow",
  "platformCredentialAccessApprovedNow", "envSecretAccessApprovedNow", "dbStatusUpdateApprovedNow",
];
const PACKET_READINESS_FLAGS = ["uploadReady", "productionReady", "automationExpansionReady", "uploadHardBlockLifted"];
const REQUIRED_PACKET_REF_KEYS = [
  "ownerQaActualPass", "renderMuxRunPlan", "uploadHardBlockPolicy", "futureExecutionPlanGate",
  "integratedReadinessContract", "liveActionApprovalPacket", "humanReadablePacket",
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

const qaF = loadJson("owner QA actual pass fixture", QA_PATH);
const packetF = loadJson("upload approval packet fixture", PACKET_PATH);
const renderMuxF = loadJson("render/mux run plan", RENDER_MUX_PATH);
const hardBlockF = loadJson("upload hard block policy", HARD_BLOCK_PATH);
const gateF = loadJson("future execution plan gate", GATE_PATH);
const readinessF = loadJson("integrated readiness contract", READINESS_PATH);
const liveActionF = loadJson("live action approval packet", LIVE_ACTION_PATH);

let mdRaw = null;
try { mdRaw = readFileSync(MD_PATH, "utf8"); check("upload approval packet markdown readable", true); }
catch (e) { check("upload approval packet markdown readable", false, String(e).slice(0, 120)); }

if (!qaF.parsed || !packetF.parsed || !renderMuxF.parsed || !hardBlockF.parsed || !gateF.parsed || !readinessF.parsed || !liveActionF.parsed || mdRaw == null) {
  console.error(`\nRESULT: ${failures} FAILURE(S) / ${passes + failures} checks — core artifact unreadable, aborting`);
  process.exit(1);
}
const qa = qaF.parsed;
const packet = packetF.parsed;
const renderMux = renderMuxF.parsed;
const hardBlock = hardBlockF.parsed;
const gate = gateF.parsed;
const readiness = readinessF.parsed;
const liveAction = liveActionF.parsed;

// ── 순수 검증 함수 (mutant 재사용) ───────────────────────────────────────────
function detectQaDrift(q) {
  const issues = [];
  if (q.ownerQaActualPass?.exactText !== EXACT_OWNER_QA_PASS) issues.push("ownerQaActualPass.exactText가 Owner 문구와 문자 단위 불일치/누락");
  if (q.ownerQaActualPass?.topicId !== "t1_lifestyle_inflation") issues.push("topicId 불일치");
  if (q.ownerQaActualPass?.passSource !== "OWNER_DIRECT_VIEWING_LISTENING") issues.push("passSource가 Owner 직접 확인 아님");
  if (q.ownerQaActualPass?.isAutomatedOrTechnicalPass !== false) issues.push("isAutomatedOrTechnicalPass != false");
  if (q.ownerQaPassed !== true) issues.push("ownerQaPassed != true (Owner 직접 확인 기록 아님)");
  return issues;
}
function detectQaUploadEscalation(q) {
  const issues = [];
  for (const k of QA_FALSE_FLAGS) if (q[k] !== false) issues.push(`QA fixture ${k}=${q[k]} (false 아님)`);
  if (q.uploadHardBlockActive !== true) issues.push("QA fixture uploadHardBlockActive != true");
  if (q.prerequisiteRole?.isUploadApproval !== false) issues.push("prerequisiteRole.isUploadApproval != false");
  if (q.prerequisiteRole?.isPrerequisiteForUploadApproval !== true) issues.push("prerequisiteRole.isPrerequisiteForUploadApproval != true");
  if (q.prerequisiteRole?.approvalSequenceRuleStageSatisfied !== 4) issues.push("approvalSequenceRuleStageSatisfied != 4");
  return issues;
}
function detectPacketEscalation(p) {
  const issues = [];
  if (p.uploadApprovalGrantedNow !== false) issues.push("uploadApprovalGrantedNow != false");
  if (p.futureUseOnly !== true) issues.push("futureUseOnly != true");
  for (const k of PACKET_APPROVAL_FLAGS) if (p.currentApprovalFlags?.[k] !== false) issues.push(`currentApprovalFlags.${k} != false`);
  for (const k of PACKET_READINESS_FLAGS) if (p.prohibitedReadinessFlags?.[k] !== false) issues.push(`prohibitedReadinessFlags.${k} != false`);
  return issues;
}
function detectHardBlockDrift(p, q) {
  const issues = [];
  if (p.uploadHardBlock?.active !== true) issues.push("packet uploadHardBlock.active != true");
  if (q.uploadHardBlock?.active !== true) issues.push("QA fixture uploadHardBlock.active != true");
  if (!existsSync(path.join(ROOT, p.uploadHardBlock?.policyRef ?? ""))) issues.push("packet upload hard block policyRef 미존재");
  return issues;
}
function detectMuxTargetDrift(p, q, rm) {
  const issues = [];
  const rmMux = (rm.outputPolicy?.allowedArtifacts ?? []).some((a) => a.includes("golden_sample_t1_lifestyle_inflation_tts_mux_v3_2.mp4"));
  if (!rmMux) issues.push("render/mux plan에 tts_mux_v3_2.mp4 산출물 없음 (참조 무결성)");
  if (p.uploadTarget?.latestMuxMp4 !== LATEST_MUX_MP4) issues.push("packet uploadTarget.latestMuxMp4가 정본 경로와 불일치/누락");
  if (q.qaTarget?.latestMuxMp4 !== LATEST_MUX_MP4) issues.push("QA fixture qaTarget.latestMuxMp4가 정본 경로와 불일치/누락");
  if (!isStr(p.uploadTarget?.artifactAuditJson) || !p.uploadTarget.artifactAuditJson.includes("post_render_artifact_audit_tts_mux")) issues.push("packet artifact audit JSON 참조 누락");
  if (p.uploadTarget?.renderMuxRunPlan !== "scripts/fixtures/golden_sample_v3_2_live_render_mux_run_plan.t1_lifestyle_inflation.v1.json") issues.push("packet renderMuxRunPlan 참조 불일치");
  return issues;
}
function detectSnippetDrift(p) {
  const issues = [];
  const s = p.futureUseUploadApprovalSnippet ?? {};
  if (s.notApprovedNow !== true) issues.push("snippet.notApprovedNow != true");
  if (s.futureUseOnly !== true) issues.push("snippet.futureUseOnly != true");
  if (s.labelPrefix !== "FUTURE_USE_ONLY_NOT_APPROVED_NOW") issues.push("snippet.labelPrefix 불일치");
  if (!isStr(s.text) || !s.text.startsWith("FUTURE_USE_ONLY_NOT_APPROVED_NOW")) issues.push("snippet.text가 future-use-only 라벨로 시작 안 함");
  if (isStr(s.text) && !s.text.includes("APPROVE_UPLOAD")) issues.push("snippet.text에 APPROVE_UPLOAD 문구 없음");
  const req = p.futureUploadApprovalRequirement ?? {};
  if (req.requiresOwnerQaActualPassFirst !== true) issues.push("requiresOwnerQaActualPassFirst != true");
  if (req.requiresSeparateUploadSlice !== true) issues.push("requiresSeparateUploadSlice != true");
  if (req.requiresExplicitApproveUploadWording !== true) issues.push("requiresExplicitApproveUploadWording != true");
  if (req.capsEffectiveNow !== false) issues.push("futureUploadApprovalRequirement.capsEffectiveNow != false");
  if (!isStr(p.requiredOwnerApprovalWording) || !p.requiredOwnerApprovalWording.includes("APPROVE_UPLOAD")) issues.push("requiredOwnerApprovalWording에 APPROVE_UPLOAD 없음");
  return issues;
}
function detectBoundaryDrift(p) {
  const issues = [];
  const reqFields = (p.futureUploadApprovalRequirement?.requiredFields ?? []).join(" | ");
  const wording = p.requiredOwnerApprovalWording ?? "";
  const snippet = p.futureUseUploadApprovalSnippet?.text ?? "";
  // no-regeneration / no-render/mux/TTS/image/browser 경계가 요건+문구+snippet에 존재해야 함
  if (!reqFields.includes("noRegenerationBoundary")) issues.push("requiredFields에 noRegenerationBoundary 누락");
  if (!wording.includes("no regeneration") || !wording.includes("no render/mux/TTS/image/browser")) issues.push("requiredOwnerApprovalWording에 no-regeneration/no-render/mux/TTS/image/browser 경계 누락");
  if (!snippet.includes("no regeneration") || !snippet.includes("no render/mux/TTS/image/browser")) issues.push("snippet에 no-regeneration/no-render/mux/TTS/image/browser 경계 누락");
  return issues;
}
function detectStopMissing(p) {
  const issues = [];
  if (!isStrArr(p.stopConditionsForFutureUpload)) issues.push("stopConditionsForFutureUpload 비어있음/누락");
  const joined = (p.stopConditionsForFutureUpload ?? []).join(" | ");
  for (const tok of ["hard block", "자격증명", "platform", "cap", "audit"]) {
    if (!joined.includes(tok)) issues.push(`stopConditions에 "${tok}" 누락`);
  }
  return issues;
}

// ── 1. Owner QA actual pass fixture ──────────────────────────────────────────
{
  check("QA fixture schemaVersion + status = OWNER_QA_ACTUAL_PASS_RECORDED_UPLOAD_STILL_BLOCKED",
    qa.schemaVersion === "golden_sample_owner_qa_actual_pass_v1" &&
    qa.status === "OWNER_QA_ACTUAL_PASS_RECORDED_UPLOAD_STILL_BLOCKED");
  check("QA fixture Owner 문구 정확히 기록 + Owner 직접 확인 근거 + ownerQaPassed true",
    detectQaDrift(qa).length === 0, detectQaDrift(qa).join("; "));
  check("QA fixture upload 미승격: uploadApproved/uploadExecution/uploadReady/productionReady false + hardBlock active + 선행 조건 역할",
    detectQaUploadEscalation(qa).length === 0, detectQaUploadEscalation(qa).join("; "));
  check("QA fixture ownerViewingListeningActualStatus = PASS_DIRECT_OWNER_REVIEW_COMPLETED (Owner 직접 확인)",
    qa.ownerViewingListeningActualStatus === "PASS_DIRECT_OWNER_REVIEW_COMPLETED");
  check("QA fixture readinessVerdict STANDARDIZED_NO_LIVE_READY 불변 + upload readiness 아님",
    qa.readinessVerdict?.current === "STANDARDIZED_NO_LIVE_READY" &&
    Array.isArray(qa.readinessVerdict?.isNot) && qa.readinessVerdict.isNot.includes("upload_ready"));
}

// ── 2. upload approval packet — future-use-only ──────────────────────────────
{
  check("packet schemaVersion + status = UPLOAD_APPROVAL_PACKET_FUTURE_USE_ONLY_NOT_APPROVED",
    packet.schemaVersion === "golden_sample_upload_approval_packet_v1" &&
    packet.status === "UPLOAD_APPROVAL_PACKET_FUTURE_USE_ONLY_NOT_APPROVED");
  check("packet future-use-only: uploadApprovalGrantedNow false + currentApproval/prohibitedReadiness flag 전부 false",
    detectPacketEscalation(packet).length === 0, detectPacketEscalation(packet).join("; "));
  check("packet ownerQaPrerequisite: QA actual pass 충족 + upload 별도 승인 요구",
    packet.ownerQaPrerequisite?.ownerQaActualPassSatisfied === true &&
    packet.ownerQaPrerequisite?.uploadStillRequiresSeparateApproval === true &&
    existsSync(path.join(ROOT, packet.ownerQaPrerequisite?.ownerQaActualPassFixture ?? "")));
  check("packet readinessVerdict STANDARDIZED_NO_LIVE_READY 불변",
    packet.readinessVerdict?.current === "STANDARDIZED_NO_LIVE_READY");
  check("packet future upload snippet: future-use-only 라벨 + APPROVE_UPLOAD + Owner QA 선행 + 별도 slice + cap effectiveNow false",
    detectSnippetDrift(packet).length === 0, detectSnippetDrift(packet).join("; "));
  check("packet no-regeneration/no-render·mux·TTS·image·browser 경계가 요건/문구/snippet에 존재",
    detectBoundaryDrift(packet).length === 0, detectBoundaryDrift(packet).join("; "));
  check("packet stopConditionsForFutureUpload 완비 (hard block/자격증명/platform/cap/audit)",
    detectStopMissing(packet).length === 0, detectStopMissing(packet).join("; "));
}

// ── 3. upload hard block + latest mux target + 참조 실재 ─────────────────────
{
  check("upload hard block active (packet + QA fixture) + policy 참조 실재",
    detectHardBlockDrift(packet, qa).length === 0, detectHardBlockDrift(packet, qa).join("; "));
  check("hard block policy 자체 상태: uploadBlocked true + uploadReady false (불변 확인)",
    hardBlock.uploadBlocked === true && hardBlock.uploadReady === false);
  check("latest mux 참조 = render/mux plan mux path + audit JSON (packet + QA fixture 정합)",
    detectMuxTargetDrift(packet, qa, renderMux).length === 0, detectMuxTargetDrift(packet, qa, renderMux).join("; "));
  const refs = packet.references ?? {};
  const missingKeys = REQUIRED_PACKET_REF_KEYS.filter((k) => !isStr(refs[k]));
  check("packet references 7개 key 전부 존재", missingKeys.length === 0, `missing=${missingKeys.join(",")}`);
  const refPaths = REQUIRED_PACKET_REF_KEYS.map((k) => refs[k]).filter(isStr);
  const missingFiles = refPaths.filter((r) => !existsSync(path.join(ROOT, r)));
  check("packet references 대상 파일 전부 레포 실재", missingFiles.length === 0, `missing=${missingFiles.join(",")}`);
}

// ── 4. prior 계약 불변 (승격 없음) ───────────────────────────────────────────
{
  check("future gate 불변: uploadApprovedNow false + upload hard block active + readiness STANDARDIZED_NO_LIVE_READY",
    gate.currentApprovalFlags?.uploadApprovedNow === false && gate.uploadHardBlock?.active === true &&
    gate.readinessVerdict?.current === "STANDARDIZED_NO_LIVE_READY");
  check("integrated readiness 불변: readinessVerdict STANDARDIZED_NO_LIVE_READY",
    readiness.readinessVerdict?.current === "STANDARDIZED_NO_LIVE_READY");
  check("live action packet 불변: uploadApprovedNow false + ownerQaPassed(prohibited) false + upload hard block active",
    liveAction.currentApprovalFlags?.uploadApprovedNow === false &&
    liveAction.prohibitedReadinessFlags?.ownerQaPassed === false &&
    liveAction.uploadHardBlock?.active === true);
  check("live action packet upload template: requiresOwnerQaActualPassFirst + requiresSeparateUploadSlice 유지",
    liveAction.domainApprovalTemplates?.upload?.requiresOwnerQaActualPassFirst === true &&
    liveAction.domainApprovalTemplates?.upload?.requiresSeparateUploadSlice === true);
}

// ── 5. markdown 정합 ─────────────────────────────────────────────────────────
{
  check("markdown: NOT UPLOAD APPROVAL / 준비 문서 문구 존재",
    mdRaw.includes("NOT UPLOAD APPROVAL") && mdRaw.includes("준비 문서"));
  check("markdown: Owner QA actual pass 정확 문구 포함",
    mdRaw.includes(EXACT_OWNER_QA_PASS));
  check("markdown: latest mux mp4 경로 포함",
    mdRaw.includes("golden_sample_t1_lifestyle_inflation_tts_mux_v3_2.mp4"));
  check("markdown: upload 계속 차단 명시 (hard block active + 403)",
    (mdRaw.includes("upload hard block") || mdRaw.includes("hard block")) &&
    mdRaw.includes("403"));
  check("markdown: future-use-only upload snippet + FUTURE_USE_ONLY_NOT_APPROVED_NOW 라벨",
    mdRaw.includes("FUTURE_USE_ONLY_NOT_APPROVED_NOW") && mdRaw.includes("APPROVE_UPLOAD"));
  check("markdown: uploadApprovalGrantedNow/uploadReady/productionReady false 명시",
    mdRaw.includes("uploadApprovalGrantedNow: false") && mdRaw.includes("uploadReady: false") && mdRaw.includes("productionReady: false"));
}

// ── 6. 가드 self 소스 스캔 + import allowlist ────────────────────────────────
{
  const execTokens = [J("child_", "process"), J("spawn", "("), J("exec", "("), J("process", ".env"),
    J("fet", "ch("), J("chromium", ".launch"), J("page", ".goto"), J("upload", "Instagram"),
    J("write", "File"), J("append", "File"), J("mk", "dir"), J("rm", "Sync"), J("un", "link")];
  const selfSrc = readFileSync(SELF, "utf8");
  const hit = execTokens.find((t) => selfSrc.includes(t));
  check("no forbidden live/env/write/upload pattern in guard script (self)", !hit, hit ? `token=${hit}` : "");
  check("no forbidden pattern in QA fixture", !execTokens.some((t) => qaF.raw.includes(t)));
  check("no forbidden pattern in upload packet fixture", !execTokens.some((t) => packetF.raw.includes(t)));
  const specifiers = [...selfSrc.matchAll(/^import\s[^\n]*?from\s+["']([^"']+)["']/gm)].map((m) => m[1]);
  const allow = new Set(["node:fs", "node:path", "node:url"]);
  check("guard imports restricted to node:fs/node:path/node:url",
    specifiers.length > 0 && specifiers.every((s) => allow.has(s)), `bad=${specifiers.filter((s) => !allow.has(s)).join(",")}`);
  console.log("NOTE  scanner holds forbidden tokens split-concatenated only (denylist exception)");
}

// ── 7. in-memory mutant — fail-closed 확인 ───────────────────────────────────
{
  const truthy = 1 === 1;
  const mQaText = clone(qa); mQaText.ownerQaActualPass.exactText = mQaText.ownerQaActualPass.exactText.replace("no upload execution yet", "upload now");
  check("mutant: Owner QA 문구 변조(upload now) → fail",
    detectQaDrift(mQaText).some((i) => i.includes("exactText")));
  const mQaTextGone = clone(qa); delete mQaTextGone.ownerQaActualPass.exactText;
  check("mutant: Owner QA 문구 누락 → fail",
    detectQaDrift(mQaTextGone).some((i) => i.includes("exactText")));
  const mQaUp = clone(qa); mQaUp.uploadApprovedNow = truthy;
  check("mutant: QA fixture uploadApprovedNow true → fail",
    detectQaUploadEscalation(mQaUp).some((i) => i.includes("uploadApprovedNow")));
  const mQaReady = clone(qa); mQaReady.uploadReady = truthy;
  check("mutant: QA fixture uploadReady true → fail",
    detectQaUploadEscalation(mQaReady).some((i) => i.includes("uploadReady")));
  const mQaProd = clone(qa); mQaProd.productionReady = truthy;
  check("mutant: QA fixture productionReady true → fail",
    detectQaUploadEscalation(mQaProd).some((i) => i.includes("productionReady")));
  const mQaBlock = clone(qa); mQaBlock.uploadHardBlockActive = false;
  check("mutant: QA fixture uploadHardBlockActive false → fail",
    detectQaUploadEscalation(mQaBlock).some((i) => i.includes("uploadHardBlockActive")));
  const mPktGrant = clone(packet); mPktGrant.uploadApprovalGrantedNow = truthy;
  check("mutant: packet uploadApprovalGrantedNow true → fail",
    detectPacketEscalation(mPktGrant).some((i) => i.includes("uploadApprovalGrantedNow")));
  const mPktReady = clone(packet); mPktReady.prohibitedReadinessFlags.uploadReady = truthy;
  check("mutant: packet uploadReady true → fail",
    detectPacketEscalation(mPktReady).some((i) => i.includes("uploadReady")));
  const mPktCred = clone(packet); mPktCred.currentApprovalFlags.platformCredentialAccessApprovedNow = truthy;
  check("mutant: packet platform credential access true (지금) → fail",
    detectPacketEscalation(mPktCred).some((i) => i.includes("platformCredentialAccessApprovedNow")));
  const mPktBlock = clone(packet); mPktBlock.uploadHardBlock.active = false;
  check("mutant: packet upload hard block inactive → fail",
    detectHardBlockDrift(mPktBlock, qa).some((i) => i.includes("uploadHardBlock.active")));
  const mPktSnip = clone(packet); mPktSnip.futureUseUploadApprovalSnippet.notApprovedNow = false;
  check("mutant: packet snippet notApprovedNow false (현재 승인화) → fail",
    detectSnippetDrift(mPktSnip).some((i) => i.includes("notApprovedNow")));
  const mPktSnipLabel = clone(packet); mPktSnipLabel.futureUseUploadApprovalSnippet.text = mPktSnipLabel.futureUseUploadApprovalSnippet.text.replace("FUTURE_USE_ONLY_NOT_APPROVED_NOW — ", "");
  check("mutant: packet snippet future-use-only 라벨 제거 → fail",
    detectSnippetDrift(mPktSnipLabel).some((i) => i.includes("future-use-only 라벨")));
  const mPktQaReq = clone(packet); mPktQaReq.futureUploadApprovalRequirement.requiresOwnerQaActualPassFirst = false;
  check("mutant: packet requiresOwnerQaActualPassFirst 제거 → fail",
    detectSnippetDrift(mPktQaReq).some((i) => i.includes("requiresOwnerQaActualPassFirst")));
  const mPktSlice = clone(packet); mPktSlice.futureUploadApprovalRequirement.requiresSeparateUploadSlice = false;
  check("mutant: packet 별도 upload slice 요건 제거 → fail",
    detectSnippetDrift(mPktSlice).some((i) => i.includes("requiresSeparateUploadSlice")));
  const mPktCaps = clone(packet); mPktCaps.futureUploadApprovalRequirement.capsEffectiveNow = truthy;
  check("mutant: packet capsEffectiveNow true (현재 예산화) → fail",
    detectSnippetDrift(mPktCaps).some((i) => i.includes("capsEffectiveNow")));
  const mPktMux = clone(packet); mPktMux.uploadTarget.latestMuxMp4 = "C:\\wrong\\path.mp4";
  check("mutant: packet latest mux 참조 변조 → fail",
    detectMuxTargetDrift(mPktMux, qa, renderMux).some((i) => i.includes("latestMuxMp4")));
  const mPktMuxGone = clone(packet); delete mPktMuxGone.uploadTarget.latestMuxMp4;
  check("mutant: packet latest mux 참조 누락 → fail",
    detectMuxTargetDrift(mPktMuxGone, qa, renderMux).some((i) => i.includes("latestMuxMp4")));
  const mPktBoundW = clone(packet); mPktBoundW.requiredOwnerApprovalWording = mPktBoundW.requiredOwnerApprovalWording.replace("no regeneration, ", "");
  check("mutant: packet requiredOwnerApprovalWording에서 no-regeneration 경계 제거 → fail",
    detectBoundaryDrift(mPktBoundW).some((i) => i.includes("no-regeneration")));
  const mPktBoundR = clone(packet);
  mPktBoundR.futureUploadApprovalRequirement.requiredFields = mPktBoundR.futureUploadApprovalRequirement.requiredFields.filter((f) => !f.includes("noRegenerationBoundary"));
  check("mutant: packet requiredFields에서 noRegenerationBoundary 제거 → fail",
    detectBoundaryDrift(mPktBoundR).some((i) => i.includes("noRegenerationBoundary")));
  const mPktStop = clone(packet); mPktStop.stopConditionsForFutureUpload = mPktStop.stopConditionsForFutureUpload.filter((s) => !s.includes("자격증명"));
  check("mutant: packet stop condition(자격증명 누락) 제거 → fail",
    detectStopMissing(mPktStop).some((i) => i.includes("자격증명")));
}

console.log(failures === 0
  ? `\nRESULT: ALL PASS (${passes} checks)`
  : `\nRESULT: ${failures} FAILURE(S) / ${passes + failures} checks`);
process.exit(failures === 0 ? 0 : 1);
