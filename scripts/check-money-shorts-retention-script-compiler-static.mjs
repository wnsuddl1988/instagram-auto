#!/usr/bin/env node
// ──────────────────────────────────────────────────────────────────────────
// check-money-shorts-retention-script-compiler-static.mjs
//
// RETENTION SCRIPT COMPILER v1 — STRUCTURE/SAFETY GUARD (data-only, no execution)
//
// 검증 대상:
//   - scripts/fixtures/money-shorts-creative-quality-contract.v1.json   (contract, source of truth)
//   - scripts/fixtures/money-shorts-retention-script-compiler.sample-input.v1.json (input)
//   - scripts/fixtures/money-shorts-retention-script-compiler.output.v1.json       (output)
//   - scripts/build-money-shorts-retention-script-compiler-v1.mjs        (builder)
//   - self                                                               (this guard)
//
// 핵심: builder가 contract를 실제 소비하고, output이 contract의 hook/script/caption/duration/
//       source-gate 규칙을 만족하며, 외부 LLM/API/render/TTS/upload 실행 흔적이 없는지.
//
// Node built-in only. 외부 네트워크/렌더/업로드/env 접근 없음. 순수 정적 검사.
// ──────────────────────────────────────────────────────────────────────────

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONTRACT_PATH = join(__dirname, "fixtures", "money-shorts-creative-quality-contract.v1.json");
const INPUT_PATH = join(__dirname, "fixtures", "money-shorts-retention-script-compiler.sample-input.v1.json");
const OUTPUT_PATH = join(__dirname, "fixtures", "money-shorts-retention-script-compiler.output.v1.json");
const BUILDER_PATH = join(__dirname, "build-money-shorts-retention-script-compiler-v1.mjs");
const SELF_PATH = join(__dirname, "check-money-shorts-retention-script-compiler-static.mjs");

const results = [];
function check(name, condition, detail = "") {
  results.push({ name, pass: !!condition, detail });
}
function isStr(v) {
  return typeof v === "string" && v.length > 0;
}
function isNum(v) {
  return typeof v === "number" && Number.isFinite(v);
}

// forbidden tokens by concatenation so this guard doesn't match itself on self-read
const CTX_TRANSFER_TOKEN = "CONTEXT" + "_TRANSFER_" + "CODEX";
const PIQ_TOKEN = "piq" + "_diag_" + "out";

let contractRaw, contract, inputRaw, input, outputRaw, output, builderText, selfText;
try {
  contractRaw = readFileSync(CONTRACT_PATH, "utf8");
  contract = JSON.parse(contractRaw);
  inputRaw = readFileSync(INPUT_PATH, "utf8");
  input = JSON.parse(inputRaw);
  outputRaw = readFileSync(OUTPUT_PATH, "utf8");
  output = JSON.parse(outputRaw);
  builderText = readFileSync(BUILDER_PATH, "utf8");
  selfText = readFileSync(SELF_PATH, "utf8");
} catch (e) {
  console.error(`FATAL: cannot read/parse inputs: ${e.message}`);
  process.exit(2);
}

const HOOK_TYPES = contract.hookContract?.hookTypes ?? [];
const HOOK_MIN = contract.hookContract?.selectedHookMinScore ?? 75;
const HOOK_COUNT = contract.hookContract?.candidatesPerTopic ?? 10;
const DG = contract.retentionScriptContract?.durationGuard ?? {};
const REQUIRED_SOURCE_FIELDS = contract.sourceGate?.requiredSourceMetadataFields ?? [];
const FORBIDDEN = contract.forbiddenLanguagePolicy?.forbiddenDirections ?? [];
const SOURCE_REQUIRED_PILLARS = contract.sourceGate?.sourceRequiredPillars ?? [];
const CAPTION_SAFE_REF = contract.captionContract?.captionSafeReference;
const CHANNEL_CONNECT = contract.channelPosition?.everyVideoMustConnectToOneOf ?? [];

// ── § A. contract presence + schema ──────────────────────────────────────────
check("A-01: contract fixture parsed", typeof contract === "object" && contract !== null);
check("A-02: contract schemaVersion === money_shorts_creative_quality_contract_v1", contract.schemaVersion === "money_shorts_creative_quality_contract_v1");
check("A-03: contract has hookContract", typeof contract.hookContract === "object");
check("A-04: contract has retentionScriptContract.durationGuard", typeof DG === "object" && DG !== null);
check("A-05: contract has sourceGate", typeof contract.sourceGate === "object");
check("A-06: contract hookTypes non-empty", Array.isArray(HOOK_TYPES) && HOOK_TYPES.length === 8);

// ── § B. output schema + no-live flags ───────────────────────────────────────
check("B-01: output schemaVersion === money_shorts_retention_script_compiler_output_v1", output.schemaVersion === "money_shorts_retention_script_compiler_output_v1");
check("B-02: output status === data_only_rule_based_dry_run", output.status === "data_only_rule_based_dry_run");
check("B-03: output sourceContractRef points to contract fixture", /money-shorts-creative-quality-contract\.v1\.json$/.test(output.sourceContractRef ?? ""));
check("B-04: output sourceContractSchemaVersion matches contract", output.sourceContractSchemaVersion === contract.schemaVersion);
check("B-05: output inputRef points to sample input", /money-shorts-retention-script-compiler\.sample-input\.v1\.json$/.test(output.inputRef ?? ""));
check("B-06: output compilerMode === rule_based_v1", output.compilerMode === "rule_based_v1");
check("B-07: output isLlmGeneration === false", output.isLlmGeneration === false);
check("B-08: output externalApiExecuted === false", output.externalApiExecuted === false);
check("B-09: output renderExecuted === false", output.renderExecuted === false);
check("B-10: output ttsExecuted === false", output.ttsExecuted === false);
check("B-11: output imageGenerationExecuted === false", output.imageGenerationExecuted === false);
check("B-12: output has topics array", Array.isArray(output.topics));
check("B-13: output.boundary.noLlmCall === true", output.boundary?.noLlmCall === true);
check("B-14: output.boundary.noExternalApiCall === true", output.boundary?.noExternalApiCall === true);
check("B-15: output.boundary.dataOnly === true", output.boundary?.dataOnly === true);

// ── § C. rule-based components + LLM slots ───────────────────────────────────
const RB = ["RuleBasedTopicClassifier", "RuleBasedHookGenerator", "RuleBasedScriptCompiler", "RuleBasedCaptionPlanner"];
check("C-01: output declares all 4 rule-based components", RB.every((r) => (output.ruleBasedComponents ?? []).includes(r)));
check("C-02: output declares future LLM slots", (output.futureLlmSlots ?? []).includes("LLMHookGenerator") && (output.futureLlmSlots ?? []).includes("LLMScriptCompiler"));

// ── § D. builder reads contract + consumes it ────────────────────────────────
check("D-01: builder references contract fixture path", /money-shorts-creative-quality-contract\.v1\.json/.test(builderText));
check("D-02: builder reads contract via readFileSync", /readFileSync\([^)]*CONTRACT_PATH/.test(builderText) || /CONTRACT_PATH[\s\S]{0,80}readFileSync/.test(builderText));
check("D-03: builder derives HOOK_TYPES from contract", /contract\.hookContract\.hookTypes/.test(builderText));
check("D-04: builder derives hook min score from contract", /contract\.hookContract\.selectedHookMinScore/.test(builderText));
check("D-05: builder derives durationGuard from contract", /contract\.retentionScriptContract\.durationGuard/.test(builderText));
check("D-06: builder derives source fields from contract", /contract\.sourceGate\.requiredSourceMetadataFields/.test(builderText));
check("D-07: builder derives forbidden directions from contract", /contract\.forbiddenLanguagePolicy\.forbiddenDirections/.test(builderText));
check("D-08: builder derives caption safe ref from contract", /contract\.captionContract\.captionSafeReference/.test(builderText));
check("D-09: builder declares RuleBasedTopicClassifier", /class RuleBasedTopicClassifier/.test(builderText));
check("D-10: builder declares RuleBasedHookGenerator", /class RuleBasedHookGenerator/.test(builderText));
check("D-11: builder declares RuleBasedScriptCompiler", /class RuleBasedScriptCompiler/.test(builderText));
check("D-12: builder declares RuleBasedCaptionPlanner", /class RuleBasedCaptionPlanner/.test(builderText));
check("D-13: builder declares LLMHookGenerator slot", /class LLMHookGenerator/.test(builderText));
check("D-14: builder declares LLMScriptCompiler slot", /class LLMScriptCompiler/.test(builderText));

// ── § E. builder is no-LLM / no-network / no-live ────────────────────────────
// code-only view: strip full-line // comments so safety-declaration comments don't false-positive
const builderCode = builderText.split(/\r?\n/).filter((ln) => !/^\s*\/\//.test(ln)).join("\n");
check("E-01: builder does not import openai/googleapis/playwright/elevenlabs", !/(import|require)[^\n]*['"`](openai|googleapis|playwright|elevenlabs)['"`]/i.test(builderCode));
check("E-02: builder does not use fetch()", !/\bfetch\s*\(/.test(builderCode));
check("E-03: builder does not import node:http/https", !/from\s+["']node:https?["']|require\(["']https?["']\)/.test(builderCode));
check("E-04: builder does not read process.env", !/process\.env\./.test(builderCode));
check("E-05: builder does not read a .env file", !/(^|[^A-Za-z0-9_])\.env(\.[A-Za-z]+)?(["'`\s)]|$)/m.test(builderCode));
check("E-06: builder does not spawn/exec child processes", !new RegExp("spawn" + "Sync?\\(|" + "exec" + "(Sync)?\\(").test(builderCode));
check("E-07: builder does not call openai/elevenlabs/ecos endpoints", !/api\.openai\.com|api\.elevenlabs\.io|ecos\.bok\.or\.kr/i.test(builderCode));
check("E-08: builder does not spawn ffmpeg/ffprobe", !/["'](ffmpeg|ffprobe)["']/.test(builderCode));
check("E-09: builder LLM slots throw (not used in v1)", /is a v-next slot and is not used|not used in rule_based_v1/.test(builderText));

// ── § F. sample input topics ─────────────────────────────────────────────────
const topics = Array.isArray(input.topics) ? input.topics : [];
check("F-01: input has >= 2 topics", topics.length >= 2);
const moneyFlowTopic = topics.find((t) => t.contentPillar === "money_flow");
const psyTopic = topics.find((t) => t.contentPillar === "success_psychology" || t.contentPillar === "money_psychology");
check("F-02: input has a money_flow topic", !!moneyFlowTopic);
check("F-03: input has a success/money psychology topic", !!psyTopic);
check("F-04: money_flow topic has sourceMetadata", typeof moneyFlowTopic?.sourceMetadata === "object" && moneyFlowTopic?.sourceMetadata !== null);
// money_flow source metadata 9 fields all present & non-empty
for (const f of REQUIRED_SOURCE_FIELDS) {
  const v = moneyFlowTopic?.sourceMetadata?.[f];
  const present = v != null && !(typeof v === "string" && v.trim() === "") && !(Array.isArray(v) && v.length === 0);
  check(`F-05:${f}: money_flow sourceMetadata has ${f}`, present, present ? "" : "missing/empty");
}
check("F-06: money_flow topic connects to money/opportunity/choice/action idea", CHANNEL_CONNECT.some((w) => JSON.stringify(moneyFlowTopic ?? {}).includes(w)));
check("F-07: psychology topic connects to channel (돈/기회/선택/행동)", CHANNEL_CONNECT.some((w) => JSON.stringify(psyTopic ?? {}).includes(w)));
check("F-08: psychology topic is NOT a generic self-help forbidden phrase", !FORBIDDEN.some((p) => JSON.stringify(psyTopic ?? {}).includes(p)));

// ── § G. source gate policy reflected in output ──────────────────────────────
check("G-01: sourceRequiredPillars includes money_flow", SOURCE_REQUIRED_PILLARS.includes("money_flow"));
check("G-02: sourceRequiredPillars includes opportunity_info", SOURCE_REQUIRED_PILLARS.includes("opportunity_info"));
const mfOut = output.topics.find((t) => t.contentPillar === "money_flow");
const psyOut = output.topics.find((t) => t.contentPillar === "success_psychology" || t.contentPillar === "money_psychology");
check("G-03: money_flow output sourceGateResult.sourceRequired === true", mfOut?.sourceGateResult?.sourceRequired === true);
check("G-04: money_flow output sourceGate passed (metadata complete)", mfOut?.sourceGateResult?.ok === true && mfOut?.sourceGateResult?.hardFail === false);
check("G-05: money_flow output has no missing source fields", Array.isArray(mfOut?.sourceGateResult?.missingFields) && mfOut.sourceGateResult.missingFields.length === 0);
check("G-06: psychology output sourceGateResult.sourceRequired === false", psyOut?.sourceGateResult?.sourceRequired === false);
check("G-07: psychology output channelFit connected", psyOut?.channelFit?.isConnected === true);
// builder enforces hard fail when source_required but missing
check("G-08: builder marks hardFail when source_required and metadata missing", /hardFail:\s*!ok/.test(builderText) || /hardFail:\s*true/.test(builderText));
check("G-09: builder pushes source_required missing into hard_fail_reasons", /source_required_true_but_source_metadata_missing/.test(builderText));

// ── § H. per-topic + candidate structure ─────────────────────────────────────
let hTopicOk = true, hCandCountOk = true, hSelOk = true, hReadinessOk = true;
for (const t of output.topics) {
  if (!isStr(t.topicId) || !isStr(t.contentPillar) || typeof t.sourceGateResult !== "object") hTopicOk = false;
  if (!Array.isArray(t.candidates) || t.candidates.length < 1 || t.candidates.length > 3) hCandCountOk = false;
  if (!("selectedCandidateId" in t)) hSelOk = false;
  if (typeof t.phase2Readiness !== "object" || t.phase2Readiness === null) hReadinessOk = false;
}
check("H-01: every topic has topicId/contentPillar/sourceGateResult", hTopicOk);
check("H-02: every topic has 1..3 candidates", hCandCountOk);
check("H-03: every topic has selectedCandidateId field", hSelOk);
check("H-04: every topic has phase2Readiness", hReadinessOk);
check("H-05: max candidates per topic <= contract max (3)", output.topics.every((t) => t.candidates.length <= (contract.candidateSelectionPolicy?.maxCandidatesPerTopic ?? 3)));

// ── § I. hook candidates per candidate ───────────────────────────────────────
let iHookCount = true, iHookFields = true, iHookTypes = true, iForbidden = true;
for (const t of output.topics) {
  for (const cand of t.candidates) {
    const hooks = cand.hook_candidates;
    if (!Array.isArray(hooks) || hooks.length !== HOOK_COUNT) iHookCount = false;
    for (const h of hooks || []) {
      if (!isStr(h.text) || !isStr(h.type) || !isNum(h.score) || !isStr(h.reason)) iHookFields = false;
      if (!HOOK_TYPES.includes(h.type)) iHookTypes = false;
      if (FORBIDDEN.some((p) => (h.text || "").includes(p))) iForbidden = false;
    }
  }
}
check(`I-01: every candidate has exactly ${HOOK_COUNT} hook candidates`, iHookCount);
check("I-02: every hook has text/type/score/reason", iHookFields);
check("I-03: every hook type is one of contract's 8 types", iHookTypes);
check("I-04: no hook contains a forbidden phrase", iForbidden);

// ── § J. selected hook >= 75 for selected candidates ─────────────────────────
let jSelScore = true, jSelForbidden = true;
for (const t of output.topics) {
  if (!t.selectedCandidateId) continue;
  const sel = t.candidates.find((c) => c.candidateId === t.selectedCandidateId);
  if (!sel) { jSelScore = false; continue; }
  if (!(isNum(sel.selectedHookScore) && sel.selectedHookScore >= HOOK_MIN)) jSelScore = false;
  if (FORBIDDEN.some((p) => (sel.selectedHookText || "").includes(p))) jSelForbidden = false;
}
check(`J-01: selected candidate's hook score >= ${HOOK_MIN}`, jSelScore);
check("J-02: selected candidate's hook has no forbidden phrase", jSelForbidden);

// ── § K. script structure (5 parts, exactly 3 points) ────────────────────────
let kFields = true, kPoints = true, kTarget = true, kPillar = true;
const SCRIPT_FIELDS = ["topic", "content_pillar", "angle", "hook", "curiosity", "points", "twist_or_reframe", "action_or_save_reason", "full_voiceover", "caption_lines", "emphasis_words", "risk_flags", "estimated_voiceover_duration", "target_duration", "needs_compression"];
for (const t of output.topics) {
  for (const cand of t.candidates) {
    const s = cand.script;
    for (const f of SCRIPT_FIELDS) if (!(f in (s || {}))) kFields = false;
    if (!Array.isArray(s?.points) || s.points.length !== 3) kPoints = false;
    if (s?.target_duration !== 30) kTarget = false;
    if (s?.content_pillar !== t.contentPillar) kPillar = false;
  }
}
check("K-01: every script has all 15 required fields", kFields);
check("K-02: every script has exactly 3 points", kPoints);
check("K-03: every script target_duration === 30", kTarget);
check("K-04: every script content_pillar matches topic pillar", kPillar);
check("K-05: retention structure has hook/curiosity/point/twist/action parts (contract)", ["hook", "curiosity", "point_1_2_3", "twist_reframe", "action_save_reason"].every((p) => (contract.retentionScriptContract?.structure ?? []).some((s) => s.part === p)));

// ── § L. duration guard on SELECTED candidates (passing sample) ──────────────
let lDur = true, lNoComp = true, lHookWin = true, lTargets = true;
for (const t of output.topics) {
  if (!t.selectedCandidateId) continue;
  const sel = t.candidates.find((c) => c.candidateId === t.selectedCandidateId);
  const s = sel.script;
  const vt = sel.voiceover_timing_metadata;
  if (!(isNum(s.estimated_voiceover_duration) && s.estimated_voiceover_duration >= DG.fullVoiceoverMinSec && s.estimated_voiceover_duration <= DG.fullVoiceoverMaxSec)) lDur = false;
  if (s.needs_compression !== false) lNoComp = false;
  if (!(isNum(vt.hook_duration) && vt.hook_duration >= DG.hookMinSec && vt.hook_duration <= DG.hookMaxSec)) lHookWin = false;
  if (vt.target_duration !== 30) lTargets = false;
}
check("L-01: selected script estimated_voiceover_duration in 27..30", lDur);
check("L-02: selected script needs_compression === false (passing sample)", lNoComp);
check("L-03: selected hook_duration in 1.5..2.5", lHookWin);
check("L-04: selected voiceover_timing_metadata target_duration === 30", lTargets);
// duration guard constants match contract
check("L-05: contract fullVoiceover 27..30", DG.fullVoiceoverMinSec === 27 && DG.fullVoiceoverMaxSec === 30);
check("L-06: contract hook 1.5..2.5", DG.hookMinSec === 1.5 && DG.hookMaxSec === 2.5);
check("L-07: contract sentence preferred 1.5..3.5", DG.sentencePreferredMinSec === 1.5 && DG.sentencePreferredMaxSec === 3.5);
// per-sentence timing metadata present
let lPerSentence = true;
for (const t of output.topics) {
  for (const cand of t.candidates) {
    const ps = cand.voiceover_timing_metadata?.per_sentence;
    if (!Array.isArray(ps) || ps.length < 5) lPerSentence = false;
    for (const p of ps || []) if (!isNum(p.estimated_duration)) lPerSentence = false;
  }
}
check("L-08: every candidate has per-sentence timing metadata (>=5 sentences)", lPerSentence);

// ── § M. caption_plan (single-line, safe-frame, density) ─────────────────────
let mSafe = true, mLines = true, mDensity = true, mStyle = true;
for (const t of output.topics) {
  for (const cand of t.candidates) {
    const cpn = cand.caption_plan;
    if (cpn?.captionSafeReference !== CAPTION_SAFE_REF) mSafe = false;
    if (!Array.isArray(cpn?.lines) || cpn.lines.length < 5) mLines = false;
    if (!isStr(cpn?.style)) mStyle = false;
    for (const ln of cpn?.lines || []) {
      // single-line caption: char_count present + no newline
      if (!isNum(ln.char_count) || /\n/.test(ln.caption || "")) mDensity = false;
    }
  }
}
check("M-01: every caption_plan references youtube_shorts_safe_frame_v1", mSafe);
check("M-02: caption safe ref matches contract captionContract.captionSafeReference", CAPTION_SAFE_REF === "youtube_shorts_safe_frame_v1");
check("M-03: every caption_plan has >=5 lines", mLines);
check("M-04: every caption_plan has a style", mStyle);
check("M-05: caption lines are single-line with char_count (no newline)", mDensity);
// selected candidate caption density ok
let mSelDensity = true;
for (const t of output.topics) {
  if (!t.selectedCandidateId) continue;
  const sel = t.candidates.find((c) => c.candidateId === t.selectedCandidateId);
  if (sel.caption_plan?.densityOk !== true) mSelDensity = false;
}
check("M-06: selected candidate caption density ok", mSelDensity);

// ── § N. artifact file mapping (Phase 2 outputs) ─────────────────────────────
const AFM = output.artifactFileMapping ?? {};
check("N-01: artifactFileMapping present", typeof AFM === "object" && AFM !== null);
check("N-02: artifactFileMapping has hook_candidates.json", "hook_candidates.json" in AFM);
check("N-03: artifactFileMapping has script.json", "script.json" in AFM);
check("N-04: artifactFileMapping has caption_plan.json", "caption_plan.json" in AFM);
check("N-05: artifactFileMapping has voiceover_timing_metadata.json", "voiceover_timing_metadata.json" in AFM);
check("N-06: phase2Outputs lists all 4 artifact files", ["hook_candidates.json", "script.json", "caption_plan.json", "voiceover_timing_metadata.json"].every((f) => (output.phase2Outputs ?? []).includes(f)));
// phase2 outputs align with contract final-artifact names. The 3 shared artifacts
// (script.json/hook_candidates.json/caption_plan.json) MUST match contract file names;
// voiceover_timing_metadata.json is a Phase-2-specific timing artifact not in the final set.
const contractFinal = contract.productionGoal?.requiredFinalArtifacts ?? [];
const SHARED_WITH_CONTRACT = ["script.json", "hook_candidates.json", "caption_plan.json"];
check("N-07: phase2 shared artifact names (script/hook_candidates/caption_plan) exist in contract requiredFinalArtifacts", SHARED_WITH_CONTRACT.every((f) => contractFinal.includes(f) && (output.phase2Outputs ?? []).includes(f)));
check("N-08: voiceover_timing_metadata.json is a Phase-2-only artifact (not in contract final set)", (output.phase2Outputs ?? []).includes("voiceover_timing_metadata.json") && !contractFinal.includes("voiceover_timing_metadata.json"));

// ── § O. selected passing candidates have no hard fails ──────────────────────
let oNoHardFail = true, oRiskEmpty = true;
for (const t of output.topics) {
  if (!t.selectedCandidateId) continue;
  const sel = t.candidates.find((c) => c.candidateId === t.selectedCandidateId);
  if (!Array.isArray(sel.hard_fail_reasons) || sel.hard_fail_reasons.length !== 0) oNoHardFail = false;
  if (!Array.isArray(sel.risk_flags) || sel.risk_flags.length !== 0) oRiskEmpty = false;
}
check("O-01: selected candidates have empty hard_fail_reasons", oNoHardFail);
check("O-02: selected candidates have empty risk_flags", oRiskEmpty);
// no investment advice / guaranteed return / clickbait in any full_voiceover
const INVEST = /매수하세요|매도하세요|지금 사세요|종목 추천|사야 합니다/;
const GUARANTEE = /무조건|100%|확정 수익|반드시 부자|대박|떡상/;
let oInvest = true, oGuarantee = true;
for (const t of output.topics) {
  for (const cand of t.candidates) {
    if (INVEST.test(cand.script?.full_voiceover || "")) oInvest = false;
    if (GUARANTEE.test(cand.script?.full_voiceover || "")) oGuarantee = false;
  }
}
check("O-03: no script contains investment solicitation", oInvest);
check("O-04: no script contains guaranteed-return/exaggeration", oGuarantee);
// builder scans for these
check("O-05: builder scans forbidden/exaggeration/investment", /EXAGGERATION_PATTERNS/.test(builderText) && /INVESTMENT_SOLICITATION_PATTERNS/.test(builderText));

// ── § P. phase2Readiness signals for scene planner handoff ───────────────────
let pReady = true;
for (const t of output.topics) {
  const r = t.phase2Readiness;
  if (typeof r?.classified !== "boolean" || typeof r?.sourceGatePassed !== "boolean" || typeof r?.channelFitConnected !== "boolean" || !isStr(r?.finalDecisionHint)) pReady = false;
}
check("P-01: every phase2Readiness has classified/sourceGatePassed/channelFitConnected/finalDecisionHint", pReady);
check("P-02: selected topics hint scene planner handoff", output.topics.filter((t) => t.selectedCandidateId).every((t) => /scene_planner|render_candidate_ready/.test(t.phase2Readiness?.finalDecisionHint ?? "")));

// ── § Q. no credential / forbidden-file references (all 3 files) ─────────────
for (const [label, raw] of [["output", outputRaw], ["input", inputRaw], ["builder", builderText]]) {
  check(`Q-01:${label}: no access_token`, !/access_?token/i.test(raw));
  check(`Q-02:${label}: no refresh_token`, !/refresh_?token/i.test(raw));
  check(`Q-03:${label}: no client_secret/api_key`, !/client_?secret|api_?key/i.test(raw));
  check(`Q-04:${label}: no OAuth code`, !/oauth[_-]?code/i.test(raw));
  check(`Q-05:${label}: no EAA/IGA token-looking string`, !/\b(EAA|IGA)[A-Za-z0-9]{20,}/.test(raw));
  check(`Q-06:${label}: no codex transfer doc ref`, !raw.includes(CTX_TRANSFER_TOKEN));
  check(`Q-07:${label}: no diag output file ref`, !raw.includes(PIQ_TOKEN));
}
check("Q-08: guard does not reference the codex transfer doc", !selfText.includes(CTX_TRANSFER_TOKEN));
check("Q-09: guard does not reference the diag output file", !selfText.includes(PIQ_TOKEN));
check("Q-10: guard does not import openai/googleapis/playwright/elevenlabs", !/(import|require)[^\n]*['"`](openai|googleapis|playwright|elevenlabs)['"`]/i.test(selfText));
// Verify the guard's OWN import surface instead of scanning for call-like substrings —
// scanning would false-positive on the E-* checks' regex literals (which legitimately
// contain the strings "fetch(" and "node:https?" as patterns applied to builderCode).
// The guard's actual capabilities are exactly what it imports; restrict that to fs/url/path.
const guardImports = (selfText.match(/^import\s+.*?from\s+["']([^"']+)["']/gm) || []).map((l) => (l.match(/from\s+["']([^"']+)["']/) || [])[1]);
const ALLOWED_GUARD_IMPORTS = new Set(["node:fs", "node:url", "node:path"]);
check("Q-11: guard imports only node:fs/url/path (no net/child_process/llm modules)", guardImports.length > 0 && guardImports.every((m) => ALLOWED_GUARD_IMPORTS.has(m)), `imports=${guardImports.join(",")}`);

// ── § R. builder rule-based logic integrity (deterministic, contract-driven) ──
check("R-01: builder uses deterministic duration estimator (no Math.random)", !/Math\.random\s*\(/.test(builderText));
check("R-02: builder estimateDurationSec defined", /function estimateDurationSec/.test(builderText));
check("R-03: builder counts Korean chars for pacing", /function countKoreanChars/.test(builderText));
check("R-04: builder writes output only to the compiler output fixture", /OUTPUT_PATH/.test(builderText) && /money-shorts-retention-script-compiler\.output\.v1\.json/.test(builderText));
check("R-05: builder does not writeFileSync any .mp4/.mp3", !/writeFileSync\([^)]*\.(mp4|mp3|wav|png|jpg)/.test(builderText));
check("R-06: builder emits schemaVersion output_v1", /money_shorts_retention_script_compiler_output_v1/.test(builderText));
check("R-07: builder evaluateSourceGate reads REQUIRED_SOURCE_FIELDS", /REQUIRED_SOURCE_FIELDS/.test(builderText) && /function evaluateSourceGate/.test(builderText));
check("R-08: builder selects hook by score>=HOOK_MIN_SCORE", /HOOK_MIN_SCORE/.test(builderText));
check("R-09: builder generates exactly HOOK_CANDIDATES_PER_TOPIC hooks", /HOOK_CANDIDATES_PER_TOPIC/.test(builderText));
check("R-10: builder caps candidates at MAX_CANDIDATES", /MAX_CANDIDATES/.test(builderText));
check("R-11: builder channelFit checks 돈/기회/선택/행동 (CHANNEL_CONNECT)", /CHANNEL_CONNECT/.test(builderText));
check("R-12: builder emits phase2Readiness with scene-planner hint", /phase2Readiness/.test(builderText) && /scene_planner|render_candidate_ready/.test(builderText));

// ── § S. output/input consistency (every input topic compiled) ───────────────
const inputTopicIds = new Set(topics.map((t) => t.topicId));
const outputTopicIds = new Set(output.topics.map((t) => t.topicId));
check("S-01: every input topic appears in output", [...inputTopicIds].every((id) => outputTopicIds.has(id)));
check("S-02: output topic count === input topic count", output.topics.length === topics.length);
check("S-03: every output topic pillar matches its input topic pillar", output.topics.every((ot) => { const it = topics.find((x) => x.topicId === ot.topicId); return it && it.contentPillar === ot.contentPillar; }));
check("S-04: money_flow output selected candidate id is non-null (passing)", isStr(mfOut?.selectedCandidateId));
check("S-05: psychology output selected candidate id is non-null (passing)", isStr(psyOut?.selectedCandidateId));
check("S-06: every candidateId is unique within a topic", output.topics.every((t) => new Set(t.candidates.map((c) => c.candidateId)).size === t.candidates.length));
check("S-07: selectedCandidateId (when set) refers to a real candidate", output.topics.filter((t) => t.selectedCandidateId).every((t) => t.candidates.some((c) => c.candidateId === t.selectedCandidateId)));

// ── § T. hook/script content quality (channel-aligned, non-clickbait) ────────
// hook type coverage: selected candidates' 10 hooks span multiple contract types
let tTypeSpan = true, tScoreSane = true, tReasonInfo = true;
for (const t of output.topics) {
  for (const cand of t.candidates) {
    const types = new Set((cand.hook_candidates || []).map((h) => h.type));
    if (types.size < 3) tTypeSpan = false; // at least 3 distinct hook types per candidate
    for (const h of cand.hook_candidates || []) {
      if (!(h.score >= 0 && h.score <= 100)) tScoreSane = false;
      if (!isStr(h.reason)) tReasonInfo = false;
    }
  }
}
check("T-01: each candidate's hooks span >= 3 distinct types", tTypeSpan);
check("T-02: all hook scores are within 0..100", tScoreSane);
check("T-03: every hook has an informative reason string", tReasonInfo);
// script full_voiceover concatenates hook..action (starts with the selected hook)
let tVoiceStart = true, tVoiceHasAction = true;
for (const t of output.topics) {
  if (!t.selectedCandidateId) continue;
  const sel = t.candidates.find((c) => c.candidateId === t.selectedCandidateId);
  if (!(sel.script.full_voiceover || "").startsWith(sel.script.hook)) tVoiceStart = false;
  if (!(sel.script.full_voiceover || "").includes(sel.script.action_or_save_reason)) tVoiceHasAction = false;
}
check("T-04: selected full_voiceover starts with the hook", tVoiceStart);
check("T-05: selected full_voiceover includes the action/save line", tVoiceHasAction);
// emphasis words + caption_lines present per script
let tEmphasis = true, tCapLines = true;
for (const t of output.topics) {
  for (const cand of t.candidates) {
    if (!Array.isArray(cand.script?.emphasis_words)) tEmphasis = false;
    if (!Array.isArray(cand.script?.caption_lines) || cand.script.caption_lines.length < 5) tCapLines = false;
  }
}
check("T-06: every script has an emphasis_words array", tEmphasis);
check("T-07: every script has >=5 caption_lines", tCapLines);
// no candidate script contains any of the 4 forbidden self-help directions
let tNoForbiddenScript = true;
for (const t of output.topics) {
  for (const cand of t.candidates) {
    if (FORBIDDEN.some((p) => (cand.script?.full_voiceover || "").includes(p))) tNoForbiddenScript = false;
  }
}
check("T-08: no candidate script contains a forbidden self-help direction", tNoForbiddenScript);
// contract-driven: builder forbidden list came from contract (values match)
check("T-09: contract forbidden directions are the 4 known banned phrases", FORBIDDEN.length === 4 && FORBIDDEN.includes("당신은 할 수 있습니다"));
check("T-10: selected candidates' scripts stay within 27..30s (double-check)", output.topics.filter((t) => t.selectedCandidateId).every((t) => { const s = t.candidates.find((c) => c.candidateId === t.selectedCandidateId).script; return s.estimated_voiceover_duration >= 27 && s.estimated_voiceover_duration <= 30; }));

// ── result ────────────────────────────────────────────────────────────────────
const pass = results.filter((r) => r.pass);
const fail = results.filter((r) => !r.pass);
console.log(`\n══════════════════════════════════════════════════════════`);
console.log(`  RETENTION SCRIPT COMPILER v1 — STRUCTURE/SAFETY GUARD`);
console.log(`══════════════════════════════════════════════════════════`);
for (const r of results) {
  console.log(`  ${r.pass ? "PASS" : "FAIL"}  ${r.name}${r.detail ? `  [${r.detail}]` : ""}`);
}
console.log(`\n──────────────────────────────────────────────────────────`);
console.log(`  TOTAL : ${results.length}  |  PASS : ${pass.length}  |  FAIL : ${fail.length}`);
console.log(`──────────────────────────────────────────────────────────\n`);
if (fail.length > 0) {
  console.error(`GUARD FAILED (${fail.length} failures):`);
  for (const r of fail) console.error(`  FAIL  ${r.name}${r.detail ? `  [${r.detail}]` : ""}`);
  process.exit(1);
} else {
  console.log(`GUARD OK: retention script compiler structure/safety intact (${pass.length}/${results.length}).`);
  process.exit(0);
}
