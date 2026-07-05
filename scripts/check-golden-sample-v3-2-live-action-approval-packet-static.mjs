#!/usr/bin/env node
/**
 * check-golden-sample-v3-2-live-action-approval-packet-static.mjs
 *
 * Golden Sample v3.2 — live/action approval packet 정적 가드 (no-live).
 * task: golden-sample-v3-2-live-action-approval-packet-standardization-v1
 *
 * - no-live / no-network / no-env / no-secret / no-browser / no-render / no-mux /
 *   no-audio·video·image-read / no-write / no-subprocess:
 *   레포 내 fixture JSON + markdown만 읽어 검증한다.
 * - 검증 대상:
 *   1) approval packet status가 draft/no-live이고 approvalGrantedNow=false (승인 요청서일 뿐)
 *   2) currentApprovalFlags + prohibitedReadinessFlags 전부 false
 *   3) decision 10/0 + actual Owner QA PENDING + ownerQaPassed 아님
 *   4) upload hard block active
 *   5) future execution plan gate + 필수 source contract 참조 실재
 *   6) 6개 도메인 template 전부 blocked/not_approved + suggested cap effectiveNow=false +
 *      stop conditions + artifact audit + provider allow guard ref(image/browser·TTS/audio)
 *   7) upload template이 Owner QA actual pass 선행 + 별도 upload slice 요구
 *   8) markdown snippet이 future-use-only 라벨 + 현재 승인 주장 없음, upload snippet Owner QA pass 요구
 *   9) mutant 10종: approvalGrantedNow true / readiness·approval flag true / owner QA actual PASS /
 *      ownerQaPassed true / upload block inactive / active cap now / stop 누락 / provider guard 누락 /
 *      upload snippet Owner QA 미요구 / markdown live approval now 주장 → 전부 fail-closed
 * - 전부 통과 시 exit 0 + PASS 카운트, 위반 시 exit 1.
 */
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const SELF = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(SELF), "..");
const FX = (name) => path.join(ROOT, "scripts", "fixtures", name);

const PACKET_PATH = FX("golden_sample_v3_2_live_action_approval_packet.v1.json");
const STATE_PATH = FX("golden_sample_v3_2_owner_decision_resolution_state.v1.json");
const GATE_PATH = FX("golden_sample_v3_2_future_execution_plan_gate.v1.json");
const MD_PATH = path.join(ROOT, "_ai", "GOLDEN_SAMPLE_V3_2_LIVE_ACTION_APPROVAL_PACKET.md");

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
  "approvalGrantedNow", "executionApprovedNow", "liveActionApprovedNow", "uploadApprovedNow",
  "renderApprovedNow", "muxApprovedNow", "imageGenerationApprovedNow", "ttsApprovedNow",
  "browserApprovedNow", "envSecretAccessApprovedNow",
];
const PROHIBITED_READINESS_FLAGS = [
  "uploadReady", "automationExpansionReady", "implementationApproved", "liveTtsApproved",
  "liveMuxApproved", "liveRenderApproved", "liveImageGenerationApproved", "chatgptPlaywrightApproved",
  "ownerQaPassed", "productionReady",
];
const REQUIRED_DOMAINS = ["imageBrowser", "ttsAudio", "pillowRender", "muxAudit", "ownerQa", "upload"];
const EXEC_DOMAINS = ["imageBrowser", "ttsAudio", "pillowRender", "muxAudit"]; // cap/stop/audit 필수 실행 도메인

const packetF = loadJson("live action approval packet fixture", PACKET_PATH);
const stateF = loadJson("owner decision resolution state fixture", STATE_PATH);
const gateF = loadJson("future execution plan gate fixture", GATE_PATH);

let mdSrc = null;
try { mdSrc = readFileSync(MD_PATH, "utf8"); check("human-readable approval packet markdown 존재", isStr(mdSrc)); }
catch (e) { check("human-readable approval packet markdown 존재", false, String(e).slice(0, 160)); }

if (!packetF.parsed || !stateF.parsed || !gateF.parsed || !isStr(mdSrc)) {
  console.error(`\nRESULT: ${failures} FAILURE(S) / ${passes + failures} checks — core artifact unreadable, aborting`);
  process.exit(1);
}

const packet = packetF.parsed;
const state = stateF.parsed;

// ── 순수 검증 함수 (mutant 재사용) ───────────────────────────────────────────
function detectApprovalGranted(p) {
  const issues = [];
  if (p.approvalGrantedNow !== false) issues.push(`top-level approvalGrantedNow=${p.approvalGrantedNow} (false 아님)`);
  if (p.isApprovalRequestOnly !== true) issues.push(`isApprovalRequestOnly=${p.isApprovalRequestOnly} (true 아님)`);
  const f = p.currentApprovalFlags ?? {};
  for (const name of CURRENT_APPROVAL_FLAGS) if (f[name] !== false) issues.push(`currentApprovalFlags.${name}=${f[name]} (false 아님)`);
  return issues;
}
function detectProhibitedReadinessEscalation(flags) {
  const issues = [];
  const f = flags ?? {};
  for (const name of PROHIBITED_READINESS_FLAGS) if (f[name] !== false) issues.push(`prohibitedReadinessFlags.${name}=${f[name]} (false 아님)`);
  return issues;
}
function detectOwnerQaActualPass(p) {
  const issues = [];
  const ods = p.ownerDecisionState ?? {};
  if (ods.ownerViewingListeningActualStatus !== "PENDING_DIRECT_OWNER_REVIEW") {
    issues.push(`ownerDecisionState.ownerViewingListeningActualStatus "${ods.ownerViewingListeningActualStatus}" != PENDING_DIRECT_OWNER_REVIEW`);
  }
  const oq = p.domainApprovalTemplates?.ownerQa ?? {};
  if (oq.ownerQaPassed !== false) issues.push(`domainApprovalTemplates.ownerQa.ownerQaPassed=${oq.ownerQaPassed} (false 아님)`);
  if (oq.ownerViewingListeningActualStatus !== "PENDING_DIRECT_OWNER_REVIEW") {
    issues.push(`domainApprovalTemplates.ownerQa.ownerViewingListeningActualStatus "${oq.ownerViewingListeningActualStatus}" != PENDING`);
  }
  if ((p.prohibitedReadinessFlags ?? {}).ownerQaPassed !== false) issues.push("prohibitedReadinessFlags.ownerQaPassed != false");
  return issues;
}
function detectDecisionStateRegression(p) {
  const issues = [];
  const ods = p.ownerDecisionState ?? {};
  if (ods.resolvedCount !== 10) issues.push(`ownerDecisionState.resolvedCount "${ods.resolvedCount}" != 10`);
  if (ods.pendingCount !== 0) issues.push(`ownerDecisionState.pendingCount "${ods.pendingCount}" != 0`);
  return issues;
}
function detectUploadHardBlockInactive(p) {
  const issues = [];
  const uhb = p.uploadHardBlock ?? {};
  if (uhb.active !== true) issues.push(`uploadHardBlock.active=${uhb.active} (true 아님)`);
  const up = p.domainApprovalTemplates?.upload ?? {};
  if (up.currentStatus !== "blocked_hard_block_active") issues.push(`domainApprovalTemplates.upload.currentStatus "${up.currentStatus}" != blocked_hard_block_active`);
  return issues;
}
function detectActiveCapNow(p) {
  const issues = [];
  const dat = p.domainApprovalTemplates ?? {};
  for (const d of REQUIRED_DOMAINS) {
    const caps = dat[d]?.suggestedCaps;
    if (!caps || typeof caps !== "object") { issues.push(`domainApprovalTemplates.${d}.suggestedCaps 누락`); continue; }
    if (caps.effectiveNow !== false) issues.push(`domainApprovalTemplates.${d}.suggestedCaps.effectiveNow=${caps.effectiveNow} (false 아님 — 예산 활성화 금지)`);
  }
  return issues;
}
function detectStopOrAuditMissing(p) {
  const issues = [];
  const dat = p.domainApprovalTemplates ?? {};
  for (const d of EXEC_DOMAINS) {
    const dom = dat[d] ?? {};
    if (!isStrArr(dom.stopConditions)) issues.push(`domainApprovalTemplates.${d}.stopConditions 비어있음/누락`);
    if (!isStr(dom.artifactAuditPlan)) issues.push(`domainApprovalTemplates.${d}.artifactAuditPlan 누락`);
  }
  // upload도 stop condition 필수
  const up = dat.upload ?? {};
  if (!isStrArr(up.stopConditions)) issues.push("domainApprovalTemplates.upload.stopConditions 비어있음/누락");
  return issues;
}
function detectProviderGuardMissing(p) {
  const issues = [];
  const dat = p.domainApprovalTemplates ?? {};
  const ib = dat.imageBrowser ?? {};
  if (!isStr(ib.providerAllowGuardRef) || !ib.providerAllowGuardRef.includes("paid_image_allow_guard")) {
    issues.push("imageBrowser.providerAllowGuardRef가 paid image allow guard policy 참조 아님");
  }
  if (!isStrArr(ib.providerAllowFlags) || !ib.providerAllowFlags.includes("ALLOW_CHATGPT_IMAGE")) {
    issues.push("imageBrowser.providerAllowFlags에 ALLOW_CHATGPT_IMAGE 누락");
  }
  const tts = dat.ttsAudio ?? {};
  if (!isStr(tts.providerAllowGuardRef) || !tts.providerAllowGuardRef.includes("paid_image_allow_guard")) {
    issues.push("ttsAudio.providerAllowGuardRef가 paid image allow guard policy 참조 아님");
  }
  if (!isStrArr(tts.providerAllowFlags) || !tts.providerAllowFlags.includes("ALLOW_OPENAI_TTS")) {
    issues.push("ttsAudio.providerAllowFlags에 ALLOW_OPENAI_TTS 누락");
  }
  return issues;
}
function detectUploadQaGateMissing(p) {
  const issues = [];
  const up = p.domainApprovalTemplates?.upload ?? {};
  if (up.requiresOwnerQaActualPassFirst !== true) issues.push("domainApprovalTemplates.upload.requiresOwnerQaActualPassFirst != true");
  if (up.requiresSeparateUploadSlice !== true) issues.push("domainApprovalTemplates.upload.requiresSeparateUploadSlice != true");
  const seq = p.approvalSequenceRule ?? {};
  if (seq.uploadIsLast !== true) issues.push("approvalSequenceRule.uploadIsLast != true");
  if (seq.uploadRequiresOwnerQaActualPass !== true) issues.push("approvalSequenceRule.uploadRequiresOwnerQaActualPass != true");
  return issues;
}

// ── 1. status draft/no-live + approvalGrantedNow false ──────────────────────
{
  check("packet schemaVersion + status = LIVE_ACTION_APPROVAL_PACKET_DRAFT_NO_LIVE",
    packet.schemaVersion === "golden_sample_live_action_approval_packet_v1" &&
    packet.status === "LIVE_ACTION_APPROVAL_PACKET_DRAFT_NO_LIVE");
  check("packet isApprovalRequestOnly=true + approvalGrantedNow=false (승인 요청서일 뿐)",
    detectApprovalGranted(packet).length === 0, detectApprovalGranted(packet).join("; "));
  check("packet currentApprovalFlags에 approvalGrantedNow key 포함 + 정확히 10개",
    CURRENT_APPROVAL_FLAGS.every((k) => k in (packet.currentApprovalFlags ?? {})));
  check("packet readinessVerdict.current = STANDARDIZED_NO_LIVE_READY (승격 없음)",
    packet.readinessVerdict?.current === "STANDARDIZED_NO_LIVE_READY" &&
    Array.isArray(packet.readinessVerdict?.isNot) && packet.readinessVerdict.isNot.includes("any_live_approved"));
}

// ── 2. prohibitedReadinessFlags 전부 false ──────────────────────────────────
{
  check("packet prohibitedReadinessFlags 10종 전부 false (fail-closed)",
    detectProhibitedReadinessEscalation(packet.prohibitedReadinessFlags).length === 0,
    detectProhibitedReadinessEscalation(packet.prohibitedReadinessFlags).join("; "));
}

// ── 3. decision 10/0 + actual QA PENDING + ownerQaPassed 아님 ───────────────
{
  check("packet ownerDecisionState references decision resolution state fixture",
    isStr(packet.ownerDecisionState?.decisionStateRef) &&
    packet.ownerDecisionState.decisionStateRef.includes("owner_decision_resolution_state"));
  check("packet ownerDecisionState resolved 10 / pending 0",
    detectDecisionStateRegression(packet).length === 0, detectDecisionStateRegression(packet).join("; "));
  check("packet actual Owner QA PENDING + ownerQaPassed 아님 (정책 resolved ≠ 실제 pass)",
    detectOwnerQaActualPass(packet).length === 0, detectOwnerQaActualPass(packet).join("; "));
  check("cross-check: decision state fixture resolved 10 / pending 0 / actual PENDING / ownerQaPassed false",
    state.coverage?.resolvedCount === 10 && state.coverage?.pendingCount === 0 &&
    state.ownerViewingListeningActualStatus === "PENDING_DIRECT_OWNER_REVIEW" &&
    state.flags?.ownerQaPassed === false);
}

// ── 4. upload hard block active ─────────────────────────────────────────────
{
  check("packet uploadHardBlock.active=true + policyRef 실재",
    detectUploadHardBlockInactive(packet).length === 0 &&
    isStr(packet.uploadHardBlock?.policyRef) && existsSync(path.join(ROOT, packet.uploadHardBlock.policyRef)),
    detectUploadHardBlockInactive(packet).join("; "));
}

// ── 5. gate + source contract 참조 실재 ─────────────────────────────────────
{
  const refs = packet.references ?? {};
  const requiredRefKeys = [
    "futureExecutionPlanGate", "integratedReadinessContract", "ownerDecisionState",
    "paidImageAllowGuardPolicy", "chatgptRunnerContract", "pillowRendererContract",
    "ttsAudioAuditContract", "uploadHardBlockPolicy", "humanReadablePacket",
  ];
  const missingKeys = requiredRefKeys.filter((k) => !isStr(refs[k]));
  check("packet references에 gate + 필수 source contract key 전부 존재",
    missingKeys.length === 0, `missing=${missingKeys.join(",")}`);
  const refPaths = requiredRefKeys.map((k) => refs[k]).filter(isStr);
  const missingFiles = refPaths.filter((r) => !existsSync(path.join(ROOT, r)));
  check("packet references 대상 파일 전부 레포 실재 (prose 아님)",
    refPaths.length >= 9 && missingFiles.length === 0, `missing=${missingFiles.join(",")}`);
  check("packet references.futureExecutionPlanGate = future execution plan gate fixture",
    isStr(refs.futureExecutionPlanGate) && refs.futureExecutionPlanGate.includes("future_execution_plan_gate"));
}

// ── 6. 6개 도메인 template + cap effectiveNow false + stop/audit + provider guard ──
{
  const dat = packet.domainApprovalTemplates ?? {};
  check("packet domainApprovalTemplates 6개 도메인 전부 존재",
    REQUIRED_DOMAINS.every((d) => d in dat), `missing=${REQUIRED_DOMAINS.filter((d) => !(d in dat)).join(",")}`);
  check("packet 실행 4개 도메인 currentStatus = blocked/not_approved",
    EXEC_DOMAINS.every((d) => isStr(dat[d]?.currentStatus) && /blocked|not_approved/.test(dat[d].currentStatus)),
    EXEC_DOMAINS.map((d) => `${d}=${dat[d]?.currentStatus}`).join(";"));
  check("packet ownerQa = pending_manual_owner_review + isAutomatable false",
    dat.ownerQa?.currentStatus === "pending_manual_owner_review" && dat.ownerQa?.isAutomatable === false);
  check("packet upload = blocked_hard_block_active",
    dat.upload?.currentStatus === "blocked_hard_block_active");
  check("packet 각 도메인 requiredOwnerApprovalWording 문구 존재 (명시 승인 요구)",
    REQUIRED_DOMAINS.every((d) => isStr(dat[d]?.requiredOwnerApprovalWording)));
  check("packet suggestedCaps 전 도메인 effectiveNow=false (현재 예산 아님)",
    detectActiveCapNow(packet).length === 0, detectActiveCapNow(packet).join("; "));
  check("packet 실행 도메인 stop conditions + artifact audit 필수",
    detectStopOrAuditMissing(packet).length === 0, detectStopOrAuditMissing(packet).join("; "));
  check("packet provider allow guard가 image/browser·TTS/audio 도메인에 참조",
    detectProviderGuardMissing(packet).length === 0, detectProviderGuardMissing(packet).join("; "));
}

// ── 7. upload template Owner QA actual pass 선행 ────────────────────────────
{
  check("packet upload template이 Owner QA actual pass 선행 + 별도 upload slice 요구",
    detectUploadQaGateMissing(packet).length === 0, detectUploadQaGateMissing(packet).join("; "));
}

// ── 8. markdown: future-use-only 라벨 + 현재 승인 주장 없음 + upload QA 요구 ──
{
  check("markdown 시작부에 'NOT LIVE APPROVAL' 명시",
    /NOT LIVE APPROVAL/i.test(mdSrc) && /live 승인이 아닙니다|승인 요청서/.test(mdSrc));
  const snippetLabels = (mdSrc.match(/FUTURE_USE_ONLY_NOT_APPROVED_NOW/g) || []).length;
  check("markdown copy-ready snippet에 future-use-only 라벨 5회+ (도메인별)",
    snippetLabels >= 5, `count=${snippetLabels}`);
  check("markdown이 현재 live 승인을 주장하지 않음 (approvalGrantedNow=true / 지금 승인됨 문구 없음)",
    !/approvalGrantedNow\s*[:=]\s*true/i.test(mdSrc) && !/지금 승인됨|현재 승인됨|live approval granted now/i.test(mdSrc));
  check("markdown 5개 도메인 승인 문구 분리 (image/browser·TTS·render/mux·Owner QA·upload)",
    /APPROVE_LIVE_IMAGE_BROWSER/.test(mdSrc) && /APPROVE_LIVE_TTS_AUDIO/.test(mdSrc) &&
    /APPROVE_RENDER/.test(mdSrc) && /APPROVE_MUX/.test(mdSrc) &&
    /OWNER_QA_ACTUAL_PASS/.test(mdSrc) && /APPROVE_UPLOAD/.test(mdSrc));
  check("markdown upload snippet이 Owner QA actual pass 선행 + 가장 마지막 명시",
    /APPROVE_UPLOAD[\s\S]*OWNER_QA_ACTUAL_PASS|OWNER_QA_ACTUAL_PASS[\s\S]*APPROVE_UPLOAD/.test(mdSrc) &&
    /가장 마지막|마지막.*Owner QA|Owner QA.*선행|actual pass.*선행|선행.*pass/i.test(mdSrc));
  check("markdown 불변 사항: readiness STANDARDIZED_NO_LIVE_READY + upload hard block active + PENDING",
    /STANDARDIZED_NO_LIVE_READY/.test(mdSrc) && /upload hard block/i.test(mdSrc) &&
    /PENDING_DIRECT_OWNER_REVIEW/.test(mdSrc));
}

// ── 9. prohibited / forbidden 문구 ──────────────────────────────────────────
{
  check("packet prohibitedInterpretations: 현재 승인 해석/snippet 오해/owner QA 실제 pass/upload QA 선행 금지 포함",
    Array.isArray(packet.prohibitedInterpretations) &&
    packet.prohibitedInterpretations.some((s) => s.includes("현재 live 실행 승인")) &&
    packet.prohibitedInterpretations.some((s) => s.includes("futureUseApprovalSnippets")) &&
    packet.prohibitedInterpretations.some((s) => s.includes("owner_viewing_listening_qa") && (s.includes("실제") || s.includes("ownerQaPassed"))) &&
    packet.prohibitedInterpretations.some((s) => s.includes("upload") && s.includes("Owner QA")));
  check("packet forbiddenBehavior: approvalGrantedNow/upload block/cap effectiveNow/upload QA gate/snippet 라벨 금지 포함",
    Array.isArray(packet.forbiddenBehavior) &&
    packet.forbiddenBehavior.some((s) => s.includes("approvalGrantedNow")) &&
    packet.forbiddenBehavior.some((s) => s.includes("upload hard block")) &&
    packet.forbiddenBehavior.some((s) => s.includes("effectiveNow")) &&
    packet.forbiddenBehavior.some((s) => s.includes("requiresOwnerQaActualPassFirst")) &&
    packet.forbiddenBehavior.some((s) => s.includes("future-use-only")));
  const snippets = packet.futureUseApprovalSnippets ?? {};
  check("packet futureUseApprovalSnippets: notApprovedNow=true + 각 snippet future-use-only 라벨",
    snippets.notApprovedNow === true && Array.isArray(snippets.snippets) && snippets.snippets.length >= 5 &&
    snippets.snippets.every((s) => s.futureUseOnly === true && isStr(s.text) && s.text.includes("FUTURE_USE_ONLY_NOT_APPROVED_NOW")));
}

// ── 10. 가드 self 소스 스캔 + import allowlist ──────────────────────────────
{
  const J = (a, b) => a + b;
  const execTokens = [J("child_", "process"), J("spawn", "("), J("exec", "("), J("ff", "mpeg"), J("ff", "probe"),
    J("silence", "detect"), J("process", ".env"), J("fetch", "("), J("chromium", ".launch"), J("page", ".goto"),
    J("write", "File"), J("append", "File"), J("mk", "dir"), J("rm", "Sync"), J("un", "link")];
  const selfSrc = readFileSync(SELF, "utf8");
  const hit = execTokens.find((t) => selfSrc.includes(t));
  check("no forbidden live/env/write pattern in guard script (self)", !hit, hit ? `token=${hit}` : "");
  check("no forbidden live/env/write pattern in approval packet fixture", !execTokens.some((t) => packetF.raw.includes(t)));
  check("no forbidden live/env/write pattern in approval packet markdown", !execTokens.some((t) => mdSrc.includes(t)));
  const specifiers = [...selfSrc.matchAll(/from\s+["']([^"']+)["']/g)].map((m) => m[1]);
  const allow = new Set(["node:fs", "node:path", "node:url"]);
  check("guard imports restricted to node:fs/node:path/node:url",
    specifiers.length > 0 && specifiers.every((s) => allow.has(s)), `bad=${specifiers.filter((s) => !allow.has(s)).join(",")}`);
  console.log("NOTE  scanner holds forbidden tokens split-concatenated only (denylist exception per HANDOFF)");
}

// ── 11. in-memory mutant — fail-closed 확인 ─────────────────────────────────
{
  const truthy = 1 === 1;
  // (1) approvalGrantedNow true
  const mGranted = clone(packet); mGranted.approvalGrantedNow = truthy;
  check("mutant: top-level approvalGrantedNow true → fail",
    detectApprovalGranted(mGranted).some((i) => i.includes("approvalGrantedNow")));
  const mFlagGranted = clone(packet); mFlagGranted.currentApprovalFlags.approvalGrantedNow = truthy;
  check("mutant: currentApprovalFlags.approvalGrantedNow true → fail",
    detectApprovalGranted(mFlagGranted).some((i) => i.includes("approvalGrantedNow")));

  // (2) readiness/approval flag true
  const mReadiness = clone(packet); mReadiness.prohibitedReadinessFlags.productionReady = truthy;
  check("mutant: prohibitedReadinessFlags.productionReady true → fail",
    detectProhibitedReadinessEscalation(mReadiness.prohibitedReadinessFlags).some((i) => i.includes("productionReady")));
  const mApprovalFlag = clone(packet); mApprovalFlag.currentApprovalFlags.uploadApprovedNow = truthy;
  check("mutant: currentApprovalFlags.uploadApprovedNow true → fail",
    detectApprovalGranted(mApprovalFlag).some((i) => i.includes("uploadApprovedNow")));

  // (3) Owner QA actual PASS
  const mQaPass = clone(packet); mQaPass.ownerDecisionState.ownerViewingListeningActualStatus = "PASS";
  check("mutant: ownerDecisionState.ownerViewingListeningActualStatus PASS로 위장 → fail",
    detectOwnerQaActualPass(mQaPass).some((i) => i.includes("ownerViewingListeningActualStatus")));

  // (4) ownerQaPassed true
  const mQaFlag = clone(packet); mQaFlag.domainApprovalTemplates.ownerQa.ownerQaPassed = truthy;
  check("mutant: domainApprovalTemplates.ownerQa.ownerQaPassed true → fail",
    detectOwnerQaActualPass(mQaFlag).some((i) => i.includes("ownerQaPassed")));

  // (5) upload hard block inactive
  const mUpload = clone(packet); mUpload.uploadHardBlock.active = false;
  check("mutant: uploadHardBlock.active false → fail",
    detectUploadHardBlockInactive(mUpload).some((i) => i.includes("uploadHardBlock.active")));

  // (6) active/effective cap now
  const mCap = clone(packet); mCap.domainApprovalTemplates.imageBrowser.suggestedCaps.effectiveNow = truthy;
  check("mutant: imageBrowser.suggestedCaps.effectiveNow true → fail (예산 활성화 금지)",
    detectActiveCapNow(mCap).some((i) => i.includes("effectiveNow")));

  // (7) missing stop conditions
  const mStop = clone(packet); mStop.domainApprovalTemplates.ttsAudio.stopConditions = [];
  check("mutant: ttsAudio.stopConditions 비움 → fail",
    detectStopOrAuditMissing(mStop).some((i) => i.includes("stopConditions")));

  // (8) missing provider allow guard
  const mGuard = clone(packet); mGuard.domainApprovalTemplates.imageBrowser.providerAllowGuardRef = "scripts/fixtures/nope.json";
  check("mutant: imageBrowser.providerAllowGuardRef non-guard → fail",
    detectProviderGuardMissing(mGuard).some((i) => i.includes("providerAllowGuardRef")));

  // (9) upload snippet not requiring Owner QA pass
  const mUploadQa = clone(packet); mUploadQa.domainApprovalTemplates.upload.requiresOwnerQaActualPassFirst = false;
  check("mutant: upload template requiresOwnerQaActualPassFirst false → fail",
    detectUploadQaGateMissing(mUploadQa).some((i) => i.includes("requiresOwnerQaActualPassFirst")));

  // (10) markdown claiming live approval now (문자열 기반 재현)
  const mMdApproved = mdSrc.replace(/approvalGrantedNow = false/i, "approvalGrantedNow = true");
  check("mutant: markdown이 approvalGrantedNow=true 주장 → 검출됨 (fail-closed)",
    /approvalGrantedNow\s*[:=]\s*true/i.test(mMdApproved) && !/approvalGrantedNow\s*[:=]\s*true/i.test(mdSrc));
}

console.log(failures === 0
  ? `\nRESULT: ALL PASS (${passes} checks)`
  : `\nRESULT: ${failures} FAILURE(S) / ${passes + failures} checks`);
process.exit(failures === 0 ? 0 : 1);
