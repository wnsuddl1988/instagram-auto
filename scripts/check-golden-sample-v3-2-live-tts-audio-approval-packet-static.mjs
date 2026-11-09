#!/usr/bin/env node
/**
 * check-golden-sample-v3-2-live-tts-audio-approval-packet-static.mjs
 *
 * Golden Sample v3.2 — no-live TTS/audio approval packet 정적/fail-closed 가드.
 * task: golden-sample-v3-2-existing-image-set-acceptance-and-live-tts-audio-approval-prep-v1
 *
 * 이 가드 자체는 no-live다: 레포 내 fixture/markdown JSON·텍스트만 읽는다.
 * (browser/CDP/network/env-값/secret/write/subprocess/TTS/audio/binary 없음)
 *
 * 검증 대상:
 *   1) Owner 승인 문구가 packet에 정확히(문자 단위) 기록됨
 *   2) packet이 future-use-only이며 현재 승인 아님 (approvalGrantedNow/live/provider/cap flag 전부 false)
 *   3) 기존 9개 이미지 채택 증거가 run plan + summary JSON과 정합 (savedImages 9 / submitted 0 / cost 0 / md5 세트 일치)
 *   4) 이미지 재생성 미승인 (imageRegenerationApprovedNow=false)
 *   5) upload/render/mux/env-secret 미승인 flag 전부 false + readiness 미승격
 *   6) 미래 provider가 정확히 [ALLOW_OPENAI_TTS, ALLOW_ELEVENLABS]
 *   7) stop conditions + script impact gate provenance + audio quality gate audit 참조 존재
 *   8) TTS audit contract/sample + provider allow guard + upload hard block 참조 실재
 *   9) markdown이 "NOT LIVE APPROVAL" 경고 + 기존 9 채택 + provider/cap 미선택 + render/mux/upload 차단 명시
 *  10) future-use snippet에 future-use-only 라벨 존재
 *  11) mutant: live TTS 승인 true / provider 선택 / upload·render·mux true / 이미지 재생성 승인 /
 *      채택 이미지 수 오류 / submitted drift / cost drift / future-use 라벨 누락 / stop 누락 /
 *      audit 참조 누락 / provider 목록 변조 / 승인 문구 변조·누락 → 전부 fail
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

const PACKET_PATH = FX("golden_sample_v3_2_live_tts_audio_approval_packet.t1_lifestyle_inflation.v1.json");
const MD_PATH = path.join(ROOT, "_ai", "GOLDEN_SAMPLE_V3_2_LIVE_TTS_AUDIO_APPROVAL_PACKET.md");
const RUN_PLAN_PATH = FX("golden_sample_v3_2_live_image_browser_run_plan.t1_lifestyle_inflation.v1.json");
const SUMMARY_PATH = path.join(ROOT, "output", "money-shorts", "chatgpt-playwright-fresh-image-set-v3", "image-generation-summary.v3.json");
const TTS_CONTRACT_PATH = FX("golden_sample_v3_2_tts_audio_audit_contract.v1.json");
const TTS_SAMPLE_PATH = FX("golden_sample_v3_2_tts_audio_audit_sample_plan.t1_lifestyle_inflation.v1.json");
const POLICY_PATH = FX("golden_sample_v3_2_paid_image_allow_guard_policy.v1.json");
const UPLOAD_HARD_BLOCK_PATH = FX("golden_sample_v3_2_upload_hard_block_policy.v1.json");
const ACTION_PACKET_PATH = FX("golden_sample_v3_2_live_action_approval_packet.v1.json");

const EXACT_OWNER_ACCEPTANCE =
  "APPROVE_EXISTING_IMAGE_SET_AND_PREPARE_LIVE_TTS_AUDIO: t1_lifestyle_inflation — existing 9 images accepted, no image regeneration, prepare next approval packet for TTS/audio only";
const ALLOWED_FUTURE_PROVIDERS = ["ALLOW_OPENAI_TTS", "ALLOW_ELEVENLABS"];
const FUTURE_USE_LABEL = "FUTURE_USE_ONLY_NOT_APPROVED_NOW";

const CURRENT_FLAG_KEYS = [
  "approvalGrantedNow", "liveTtsAudioApprovedNow", "providerSelectedNow",
  "callCapEffectiveNow", "costCapEffectiveNow", "uploadApprovedNow",
  "renderApprovedNow", "muxApprovedNow", "envSecretAccessApprovedNow", "imageRegenerationApprovedNow",
];
const READINESS_FLAG_KEYS = [
  "uploadReady", "automationExpansionReady", "implementationApproved",
  "liveTtsApproved", "liveMuxApproved", "liveAudioAnalysisApproved",
  "liveRenderApproved", "ownerQaPassed", "productionReady",
];
const REQUIRED_REF_KEYS = [
  "liveImageBrowserRunPlan", "liveActionApprovalPacket", "liveActionApprovalPacketMd",
  "futureExecutionPlanGate", "ttsAudioAuditContract", "ttsAudioAuditSamplePlan",
  "ttsAudioAuditStandardHarness", "paidImageAllowGuardPolicy", "ownerDecisionState",
  "uploadHardBlockPolicy", "humanReadablePacket",
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

const packetF = loadJson("live TTS/audio approval packet fixture", PACKET_PATH);
const runPlanF = loadJson("live image/browser run plan fixture", RUN_PLAN_PATH);
const summaryF = loadJson("image generation summary (read-only evidence)", SUMMARY_PATH);
const ttsContractF = loadJson("tts audio audit contract", TTS_CONTRACT_PATH);
const ttsSampleF = loadJson("tts audio audit sample plan", TTS_SAMPLE_PATH);

if (!packetF.parsed || !runPlanF.parsed || !summaryF.parsed || !ttsContractF.parsed || !ttsSampleF.parsed) {
  console.error(`\nRESULT: ${failures} FAILURE(S) / ${passes + failures} checks — core fixture unreadable, aborting`);
  process.exit(1);
}
const packet = packetF.parsed;
const runPlan = runPlanF.parsed;
const summary = summaryF.parsed;

let md = "";
try { md = readFileSync(MD_PATH, "utf8"); check("human-readable markdown packet readable", md.length > 0); }
catch (e) { check("human-readable markdown packet readable", false, String(e).slice(0, 120)); }

// ── 순수 검증 함수 (mutant 재사용) ───────────────────────────────────────────
function detectAcceptanceDrift(p) {
  const issues = [];
  if (p.ownerAcceptance?.exactText !== EXACT_OWNER_ACCEPTANCE) issues.push("ownerAcceptance.exactText가 Owner 승인 문구와 문자 단위 불일치/누락");
  if (p.ownerAcceptance?.topicId !== "t1_lifestyle_inflation") issues.push("ownerAcceptance.topicId != t1_lifestyle_inflation");
  return issues;
}
function detectFutureUseDrift(p) {
  const issues = [];
  if (p.isApprovalRequestOnly !== true) issues.push("isApprovalRequestOnly != true");
  if (p.approvalGrantedNow !== false) issues.push("approvalGrantedNow != false");
  if (p.isFutureUseOnly !== true) issues.push("isFutureUseOnly != true");
  if (p.futureUseOnlyLabel !== FUTURE_USE_LABEL) issues.push("futureUseOnlyLabel 누락/불일치");
  const cf = p.currentApprovalFlags ?? {};
  for (const k of CURRENT_FLAG_KEYS) if (cf[k] !== false) issues.push(`currentApprovalFlags.${k}=${cf[k]} (false 아님)`);
  const rf = p.prohibitedReadinessFlags ?? {};
  for (const k of READINESS_FLAG_KEYS) if (rf[k] !== false) issues.push(`prohibitedReadinessFlags.${k}=${rf[k]} (false 아님)`);
  return issues;
}
function detectImageAcceptanceDrift(p, sum) {
  const issues = [];
  const a = p.existingImageSetAcceptance ?? {};
  if (a.accepted !== true) issues.push("existingImageSetAcceptance.accepted != true");
  if (a.imageRegenerationApprovedNow !== false) issues.push("imageRegenerationApprovedNow != false");
  if (a.savedImages !== 9) issues.push(`savedImages ${a.savedImages} != 9`);
  if (a.submitted !== 0) issues.push(`submitted ${a.submitted} != 0`);
  if (a.costUsd !== 0) issues.push(`costUsd ${a.costUsd} != 0`);
  // summary 증거와 정합
  const sumImgs = sum.generatedImages ?? [];
  if (sum.submissionCount !== a.submitted) issues.push(`submitted가 summary.submissionCount(${sum.submissionCount})와 불일치`);
  if (sum.costUsd !== a.costUsd) issues.push(`costUsd가 summary.costUsd(${sum.costUsd})와 불일치`);
  if (sumImgs.length !== a.savedImages) issues.push(`savedImages가 summary 이미지 수(${sumImgs.length})와 불일치`);
  // md5 세트 정합
  const packetMd5 = new Map((a.acceptedMd5Set ?? []).map((m) => [m.imageId, m.md5]));
  const sumMd5 = new Map(sumImgs.map((g) => [g.imageId, g.md5]));
  if (packetMd5.size !== sumMd5.size) issues.push(`acceptedMd5Set 크기(${packetMd5.size})가 summary(${sumMd5.size})와 불일치`);
  for (const [id, m] of sumMd5) {
    if (packetMd5.get(id) !== m) issues.push(`md5 불일치 imageId=${id}`);
  }
  return issues;
}
function detectProviderDrift(p) {
  const issues = [];
  const t = p.ttsAudioApprovalTemplate ?? {};
  if (!setEq(t.allowedFutureProviders, ALLOWED_FUTURE_PROVIDERS)) {
    issues.push(`allowedFutureProviders != [${ALLOWED_FUTURE_PROVIDERS.join(",")}] (실제 ${JSON.stringify(t.allowedFutureProviders)})`);
  }
  if (t.providerSelectionIsFutureOwnerDecision !== true) issues.push("providerSelectionIsFutureOwnerDecision != true");
  if (t.suggestedCaps?.effectiveNow !== false) issues.push("ttsAudioApprovalTemplate.suggestedCaps.effectiveNow != false");
  return issues;
}
function detectStopAuditMissing(p) {
  const issues = [];
  const rf = p.ttsAudioApprovalTemplate?.requiredFutureFields ?? {};
  if (!isStrArr(rf.stopConditions)) issues.push("requiredFutureFields.stopConditions 누락");
  const joined = (rf.stopConditions ?? []).join(" | ");
  for (const tok of ["provider", "cap", "Script Impact Gate", "provenance", "audio quality gate"]) {
    if (!joined.includes(tok)) issues.push(`stopConditions에 "${tok}" 누락`);
  }
  const gp = rf.scriptImpactGateProvenance ?? {};
  if (!isStr(gp.contractRef) || !gp.contractRef.includes("tts_audio_audit_contract")) issues.push("scriptImpactGateProvenance.contractRef 누락");
  if (gp.requiredAuthority !== "codex_judge") issues.push("scriptImpactGateProvenance.requiredAuthority != codex_judge");
  if (gp.requiredScoreProvenanceCount !== 6) issues.push("requiredScoreProvenanceCount != 6");
  if (gp.requiredHardFailProvenanceCount !== 7) issues.push("requiredHardFailProvenanceCount != 7");
  const aq = rf.audioQualityGateAudit ?? {};
  if (!isStr(aq.contractRef) || !aq.contractRef.includes("tts_audio_audit_contract")) issues.push("audioQualityGateAudit.contractRef 누락");
  if (!isStrArr(aq.subCheckKeys) || aq.subCheckKeys.length !== 6) issues.push("audioQualityGateAudit.subCheckKeys 6개 아님");
  return issues;
}
function detectSnippetLabelMissing(p) {
  const issues = [];
  const snips = p.futureUseApprovalSnippets ?? {};
  if (snips.notApprovedNow !== true) issues.push("futureUseApprovalSnippets.notApprovedNow != true");
  if (snips.labelPrefix !== FUTURE_USE_LABEL) issues.push("futureUseApprovalSnippets.labelPrefix 불일치");
  const arr = snips.snippets ?? [];
  if (!Array.isArray(arr) || arr.length < 2) issues.push("snippets 2개 미만");
  for (const s of arr) {
    if (s.futureUseOnly !== true) issues.push(`snippet(${s.domain}) futureUseOnly != true`);
    if (!isStr(s.text) || !s.text.includes(FUTURE_USE_LABEL)) issues.push(`snippet(${s.domain}) text에 future-use 라벨 누락`);
  }
  return issues;
}

// ── 1. Owner 승인 문구 + future-use-only ─────────────────────────────────────
{
  check("packet schemaVersion + status = future-use-only no-live",
    packet.schemaVersion === "golden_sample_live_tts_audio_approval_packet_v1" &&
    packet.status === "LIVE_TTS_AUDIO_APPROVAL_PACKET_FUTURE_USE_ONLY_NO_LIVE");
  check("packet Owner 승인 문구 정확히 기록 + topicId",
    detectAcceptanceDrift(packet).length === 0, detectAcceptanceDrift(packet).join("; "));
  check("packet future-use-only + 현재 승인 flag 전부 false + readiness 미승격",
    detectFutureUseDrift(packet).length === 0, detectFutureUseDrift(packet).join("; "));
}

// ── 2. 기존 9개 이미지 채택 증거 정합 ────────────────────────────────────────
{
  check("packet 기존 9개 이미지 채택 증거가 summary JSON과 정합 (9/0/$0 + md5 세트)",
    detectImageAcceptanceDrift(packet, summary).length === 0, detectImageAcceptanceDrift(packet, summary).join("; "));
  const a = packet.existingImageSetAcceptance ?? {};
  check("packet 채택 증거가 첫 live image slice run plan을 sourceRunPlan으로 참조",
    isStr(a.sourceRunPlan) && a.sourceRunPlan.includes("live_image_browser_run_plan") &&
    existsSync(path.join(ROOT, a.sourceRunPlan)));
  check("run plan cross-check: Owner 이미지 승인 문구 + provider ALLOW_CHATGPT_IMAGE 정합",
    runPlan.provider === "ALLOW_CHATGPT_IMAGE" && runPlan.topicId === "t1_lifestyle_inflation");
}

// ── 3. 미래 provider + caps ──────────────────────────────────────────────────
{
  check("packet 미래 provider가 정확히 [ALLOW_OPENAI_TTS, ALLOW_ELEVENLABS] + provider 미선택",
    detectProviderDrift(packet).length === 0, detectProviderDrift(packet).join("; "));
}

// ── 4. stop conditions + gate provenance + audio gate audit ─────────────────
{
  check("packet stop conditions + script impact gate provenance + audio quality gate audit 완비",
    detectStopAuditMissing(packet).length === 0, detectStopAuditMissing(packet).join("; "));
}

// ── 5. 참조 실재 ─────────────────────────────────────────────────────────────
{
  const refs = packet.references ?? {};
  const missingKeys = REQUIRED_REF_KEYS.filter((k) => !isStr(refs[k]));
  check("packet references 11개 key 전부 존재", missingKeys.length === 0, `missing=${missingKeys.join(",")}`);
  const refPaths = REQUIRED_REF_KEYS.map((k) => refs[k]).filter(isStr);
  const missingFiles = refPaths.filter((r) => !existsSync(path.join(ROOT, r)));
  check("packet references 대상 파일 전부 레포 실재", refPaths.length >= 11 && missingFiles.length === 0, `missing=${missingFiles.join(",")}`);
  const t = packet.ttsAudioApprovalTemplate ?? {};
  check("packet TTS audit contract/sample 참조 실재",
    isStr(t.ttsAuditContractRef) && existsSync(path.join(ROOT, t.ttsAuditContractRef)) &&
    isStr(t.ttsAuditSamplePlanRef) && existsSync(path.join(ROOT, t.ttsAuditSamplePlanRef)));
  check("packet provider allow guard 참조 = paid image allow guard policy 실재",
    isStr(t.providerAllowGuardRef) && t.providerAllowGuardRef.includes("paid_image_allow_guard") &&
    existsSync(path.join(ROOT, t.providerAllowGuardRef)));
}

// ── 6. render/mux/upload 차단 + owner QA 분리 + upload hard block ────────────
{
  const b = packet.renderMuxUploadStillBlocked ?? {};
  check("packet render/mux/upload 계속 차단 명시",
    b.renderApprovedNow === false && b.muxApprovedNow === false && b.uploadApprovedNow === false &&
    isStr(b.approvalSequenceRef));
  check("packet ownerQaSeparation: actual PENDING + ownerQaPassed false",
    packet.ownerQaSeparation?.ownerViewingListeningActualStatus === "PENDING_DIRECT_OWNER_REVIEW" &&
    packet.ownerQaSeparation?.ownerQaPassed === false);
  check("packet uploadHardBlock.active=true + policyRef 실재",
    packet.uploadHardBlock?.active === true &&
    isStr(packet.uploadHardBlock?.policyRef) && existsSync(path.join(ROOT, packet.uploadHardBlock.policyRef)));
  check("packet prohibitedInterpretations/forbiddenBehavior: 재생성·render/mux/upload·commit 금지 포함",
    Array.isArray(packet.prohibitedInterpretations) &&
    packet.prohibitedInterpretations.some((s) => s.includes("재생성")) &&
    packet.prohibitedInterpretations.some((s) => s.includes("render/mux/upload")) &&
    Array.isArray(packet.forbiddenBehavior) &&
    packet.forbiddenBehavior.some((s) => s.includes("commit/push")));
}

// ── 7. future-use snippet 라벨 ───────────────────────────────────────────────
{
  check("packet future-use snippet에 future-use-only 라벨 존재",
    detectSnippetLabelMissing(packet).length === 0, detectSnippetLabelMissing(packet).join("; "));
}

// ── 8. markdown 경고/내용 정합 ───────────────────────────────────────────────
{
  check("markdown: NOT LIVE APPROVAL 경고 + approvalGrantedNow false 명시",
    md.includes("NOT LIVE APPROVAL") && md.includes("approvalGrantedNow"));
  check("markdown: 기존 9개 이미지 채택 + 이미지 재생성 미승인 명시",
    (md.includes("기존 9개") || md.includes("9개 이미지")) &&
    (md.includes("재생성은 승인되지 않") || md.includes("imageRegenerationApprovedNow")));
  check("markdown: provider/cap 미선택 + render/mux/upload 차단 명시",
    (md.includes("providerSelectedNow") || md.includes("미선택")) &&
    (md.includes("upload hard block") || md.includes("차단")));
  check("markdown: Owner 승인 원문 정확히 포함",
    md.includes(EXACT_OWNER_ACCEPTANCE));
  check("markdown: future-use-only 라벨 + 두 provider 문구 포함",
    md.includes(FUTURE_USE_LABEL) && md.includes("ALLOW_OPENAI_TTS") && md.includes("ALLOW_ELEVENLABS"));
}

// ── 9. self 소스 스캔 + import allowlist ─────────────────────────────────────
{
  const execTokens = [J("child_", "process"), J("spawn", "("), J("exec", "("), J("ff", "mpeg"), J("ff", "probe"),
    J("silence", "detect"), J("process", ".env"), J("fetch", "("), J("chromium", ".launch"), J("page", ".goto"),
    J("write", "File"), J("append", "File"), J("mk", "dir"), J("rm", "Sync"), J("un", "link"), J("elevenlabs", "."),
    J("openai", ".audio"), J("readFileSync(.*\\.(png|mp3|mp4|wav|m4a", ")")];
  const selfSrc = readFileSync(SELF, "utf8");
  const hit = execTokens.find((t) => selfSrc.includes(t));
  check("no forbidden live/env/write/audio pattern in guard script (self)", !hit, hit ? `token=${hit}` : "");
  check("no forbidden live/env/write pattern in packet fixture",
    !execTokens.slice(0, 15).some((t) => packetF.raw.includes(t)));
  // 실제 import 문(행 시작)만 추출
  const specifiers = [...selfSrc.matchAll(/^import\s[^\n]*?from\s+["']([^"']+)["']/gm)].map((m) => m[1]);
  const allow = new Set(["node:fs", "node:path", "node:url"]);
  check("guard imports restricted to node:fs/node:path/node:url",
    specifiers.length > 0 && specifiers.every((s) => allow.has(s)), `bad=${specifiers.filter((s) => !allow.has(s)).join(",")}`);
  console.log("NOTE  scanner holds forbidden tokens split-concatenated only (denylist exception)");
}

// ── 10. in-memory mutant — fail-closed 확인 ──────────────────────────────────
{
  const truthy = 1 === 1;
  const mLive = clone(packet); mLive.currentApprovalFlags.liveTtsAudioApprovedNow = truthy;
  check("mutant: liveTtsAudioApprovedNow true → fail",
    detectFutureUseDrift(mLive).some((i) => i.includes("liveTtsAudioApprovedNow")));
  const mProv = clone(packet); mProv.currentApprovalFlags.providerSelectedNow = truthy;
  check("mutant: providerSelectedNow true → fail",
    detectFutureUseDrift(mProv).some((i) => i.includes("providerSelectedNow")));
  const mUp = clone(packet); mUp.currentApprovalFlags.uploadApprovedNow = truthy;
  check("mutant: uploadApprovedNow true → fail",
    detectFutureUseDrift(mUp).some((i) => i.includes("uploadApprovedNow")));
  const mRen = clone(packet); mRen.currentApprovalFlags.renderApprovedNow = truthy;
  check("mutant: renderApprovedNow true → fail",
    detectFutureUseDrift(mRen).some((i) => i.includes("renderApprovedNow")));
  const mMux = clone(packet); mMux.currentApprovalFlags.muxApprovedNow = truthy;
  check("mutant: muxApprovedNow true → fail",
    detectFutureUseDrift(mMux).some((i) => i.includes("muxApprovedNow")));
  const mRegen = clone(packet); mRegen.existingImageSetAcceptance.imageRegenerationApprovedNow = truthy;
  check("mutant: imageRegenerationApprovedNow true → fail",
    detectImageAcceptanceDrift(mRegen, summary).some((i) => i.includes("imageRegenerationApprovedNow")));
  const mCount = clone(packet); mCount.existingImageSetAcceptance.savedImages = 8;
  check("mutant: savedImages 8 (≠9, summary drift) → fail",
    detectImageAcceptanceDrift(mCount, summary).length > 0);
  const mSub = clone(packet); mSub.existingImageSetAcceptance.submitted = 3;
  check("mutant: submitted 3 (drift) → fail",
    detectImageAcceptanceDrift(mSub, summary).some((i) => i.includes("submitted")));
  const mCost = clone(packet); mCost.existingImageSetAcceptance.costUsd = 5;
  check("mutant: costUsd 5 (drift) → fail",
    detectImageAcceptanceDrift(mCost, summary).some((i) => i.includes("costUsd")));
  const mMd5 = clone(packet); mMd5.existingImageSetAcceptance.acceptedMd5Set[0].md5 = "deadbeef";
  check("mutant: md5 변조 → fail",
    detectImageAcceptanceDrift(mMd5, summary).some((i) => i.includes("md5")));
  const mReadiness = clone(packet); mReadiness.prohibitedReadinessFlags.liveTtsApproved = truthy;
  check("mutant: prohibitedReadinessFlags.liveTtsApproved true → fail",
    detectFutureUseDrift(mReadiness).some((i) => i.includes("liveTtsApproved")));
  const mProvList = clone(packet); mProvList.ttsAudioApprovalTemplate.allowedFutureProviders = ["ALLOW_OPENAI_TTS", "ALLOW_IMAGEN"];
  check("mutant: allowedFutureProviders에 ALLOW_IMAGEN 오염 → fail",
    detectProviderDrift(mProvList).some((i) => i.includes("allowedFutureProviders")));
  const mCap = clone(packet); mCap.ttsAudioApprovalTemplate.suggestedCaps.effectiveNow = truthy;
  check("mutant: suggestedCaps.effectiveNow true → fail",
    detectProviderDrift(mCap).some((i) => i.includes("effectiveNow")));
  const mStop = clone(packet); mStop.ttsAudioApprovalTemplate.requiredFutureFields.stopConditions = [];
  check("mutant: stopConditions 비움 → fail",
    detectStopAuditMissing(mStop).some((i) => i.includes("stopConditions")));
  const mAudit = clone(packet); delete mAudit.ttsAudioApprovalTemplate.requiredFutureFields.audioQualityGateAudit;
  check("mutant: audioQualityGateAudit 참조 제거 → fail",
    detectStopAuditMissing(mAudit).some((i) => i.includes("audioQualityGateAudit")));
  const mText = clone(packet); mText.ownerAcceptance.exactText = mText.ownerAcceptance.exactText.replace("9 images", "12 images");
  check("mutant: Owner 승인 문구 변조(12 images) → fail",
    detectAcceptanceDrift(mText).some((i) => i.includes("exactText")));
  const mTextGone = clone(packet); delete mTextGone.ownerAcceptance.exactText;
  check("mutant: Owner 승인 문구 누락 → fail",
    detectAcceptanceDrift(mTextGone).some((i) => i.includes("exactText")));
  const mLabel = clone(packet); mLabel.futureUseApprovalSnippets.snippets[0].text = "APPROVE_LIVE_TTS_AUDIO now";
  check("mutant: snippet에서 future-use-only 라벨 제거 → fail",
    detectSnippetLabelMissing(mLabel).some((i) => i.includes("라벨")));
}

console.log(failures === 0
  ? `\nRESULT: ALL PASS (${passes} checks)`
  : `\nRESULT: ${failures} FAILURE(S) / ${passes + failures} checks`);
process.exit(failures === 0 ? 0 : 1);
