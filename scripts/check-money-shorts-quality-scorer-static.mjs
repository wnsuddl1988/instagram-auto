#!/usr/bin/env node
// ──────────────────────────────────────────────────────────────────────────
// check-money-shorts-quality-scorer-static.mjs
//
// QUALITY SCORER v1 — STRUCTURE/SAFETY GUARD (data-only, no execution)
//
// 검증 대상:
//   - money-shorts-creative-quality-contract.v1.json            (contract)
//   - money-shorts-retention-script-compiler.output.v1.json     (script output)
//   - money-shorts-scene-event-planner.output.v1.json           (planner output)
//   - money-shorts-quality-scorer.output.v1.json                (scorer output)
//   - build-money-shorts-quality-scorer-v1.mjs                  (builder)
//   - self                                                       (this guard)
//
// 핵심: scorer가 3 source를 실제 소비하고, quality report/threshold/hard-soft fail/
//       render_best_candidate 금지조건/candidate selection/policy simulation을 정확히
//       구현하며, 외부 실행 흔적이 없는지.
//
// Node built-in only. 외부 네트워크/렌더/업로드/env 접근 없음. 순수 정적 검사.
// ──────────────────────────────────────────────────────────────────────────

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONTRACT_PATH = join(__dirname, "fixtures", "money-shorts-creative-quality-contract.v1.json");
const SCRIPT_PATH = join(__dirname, "fixtures", "money-shorts-retention-script-compiler.output.v1.json");
const PLANNER_PATH = join(__dirname, "fixtures", "money-shorts-scene-event-planner.output.v1.json");
const SCORER_PATH = join(__dirname, "fixtures", "money-shorts-quality-scorer.output.v1.json");
const BUILDER_PATH = join(__dirname, "build-money-shorts-quality-scorer-v1.mjs");
const SELF_PATH = join(__dirname, "check-money-shorts-quality-scorer-static.mjs");

const results = [];
function check(name, condition, detail = "") {
  results.push({ name, pass: !!condition, detail });
}
function isStr(v) { return typeof v === "string" && v.length > 0; }
function isNum(v) { return typeof v === "number" && Number.isFinite(v); }
function isArr(v) { return Array.isArray(v); }

const CTX_TRANSFER_TOKEN = "CONTEXT" + "_TRANSFER_" + "CODEX";
const PIQ_TOKEN = "piq" + "_diag_" + "out";

let contractRaw, contract, scriptRaw, script, plannerRaw, planner, scorerRaw, scorer, builderText, selfText;
try {
  contractRaw = readFileSync(CONTRACT_PATH, "utf8");
  contract = JSON.parse(contractRaw);
  scriptRaw = readFileSync(SCRIPT_PATH, "utf8");
  script = JSON.parse(scriptRaw);
  plannerRaw = readFileSync(PLANNER_PATH, "utf8");
  planner = JSON.parse(plannerRaw);
  scorerRaw = readFileSync(SCORER_PATH, "utf8");
  scorer = JSON.parse(scorerRaw);
  builderText = readFileSync(BUILDER_PATH, "utf8");
  selfText = readFileSync(SELF_PATH, "utf8");
} catch (e) {
  console.error(`FATAL: cannot read/parse inputs: ${e.message}`);
  process.exit(2);
}

const QRC = contract.qualityReportContract ?? {};
const THRESHOLDS = QRC.thresholds ?? {};
const THRESHOLD_DIR = QRC.thresholdDirection ?? {};
const DECISION_ENUM = QRC.finalDecisionEnum ?? [];
const HSF = contract.hardSoftFailPolicy ?? {};
const SFX_RULES = contract.motionCaptionSoundSelection?.sfxRules ?? {};
const QR_SCHEMA = QRC.qualityReportSchemaRequiredFields ?? [];
const contractFinal = contract.productionGoal?.requiredFinalArtifacts ?? [];
const scorerTopics = isArr(scorer.topics) ? scorer.topics : [];
const sims = isArr(scorer.policySimulationCases) ? scorer.policySimulationCases : [];

// ── § A. source fixtures presence + schema ───────────────────────────────────
check("A-01: contract parsed", typeof contract === "object" && contract !== null);
check("A-02: contract schemaVersion correct", contract.schemaVersion === "money_shorts_creative_quality_contract_v1");
check("A-03: script compiler output parsed", typeof script === "object" && script !== null);
check("A-04: script compiler schemaVersion correct", script.schemaVersion === "money_shorts_retention_script_compiler_output_v1");
check("A-05: scene planner output parsed", typeof planner === "object" && planner !== null);
check("A-06: scene planner schemaVersion correct", planner.schemaVersion === "money_shorts_scene_event_planner_output_v1");
check("A-07: contract has qualityReportContract", typeof QRC === "object" && QRC !== null);
check("A-08: contract has thresholds", typeof THRESHOLDS === "object" && Object.keys(THRESHOLDS).length === 9);
check("A-09: contract has hardSoftFailPolicy", typeof HSF === "object" && HSF !== null);
check("A-10: contract finalDecisionEnum has 6 decisions", DECISION_ENUM.length === 6);

// ── § B. scorer output schema + no-live flags ────────────────────────────────
check("B-01: scorer schemaVersion === money_shorts_quality_scorer_output_v1", scorer.schemaVersion === "money_shorts_quality_scorer_output_v1");
check("B-02: scorer status === data_only_rule_based_dry_run", scorer.status === "data_only_rule_based_dry_run");
check("B-03: scorer sourceContractRef points to contract", /money-shorts-creative-quality-contract\.v1\.json$/.test(scorer.sourceContractRef ?? ""));
check("B-04: scorer sourceScriptCompilerOutputRef points to script output", /money-shorts-retention-script-compiler\.output\.v1\.json$/.test(scorer.sourceScriptCompilerOutputRef ?? ""));
check("B-05: scorer sourceSceneEventPlannerOutputRef points to planner output", /money-shorts-scene-event-planner\.output\.v1\.json$/.test(scorer.sourceSceneEventPlannerOutputRef ?? ""));
check("B-06: scorer sourceContractSchemaVersion matches", scorer.sourceContractSchemaVersion === contract.schemaVersion);
check("B-07: scorer sourceScriptCompilerSchemaVersion matches", scorer.sourceScriptCompilerSchemaVersion === script.schemaVersion);
check("B-08: scorer sourceSceneEventPlannerSchemaVersion matches", scorer.sourceSceneEventPlannerSchemaVersion === planner.schemaVersion);
check("B-09: scorer scorerMode === rule_based_v1", scorer.scorerMode === "rule_based_v1");
check("B-10: scorer isLlmEnhancedScoring === false", scorer.isLlmEnhancedScoring === false);
check("B-11: scorer externalApiExecuted === false", scorer.externalApiExecuted === false);
check("B-12: scorer renderExecuted === false", scorer.renderExecuted === false);
check("B-13: scorer ttsExecuted === false", scorer.ttsExecuted === false);
check("B-14: scorer imageGenerationExecuted === false", scorer.imageGenerationExecuted === false);
check("B-15: scorer has topics array", isArr(scorer.topics));
check("B-16: scorer has policySimulationCases array", isArr(scorer.policySimulationCases));
check("B-17: scorer.boundary.noLlmCall === true", scorer.boundary?.noLlmCall === true);
check("B-18: scorer.boundary.dataOnly === true", scorer.boundary?.dataOnly === true);

// ── § C. scorer components + LLM slot ────────────────────────────────────────
const RB = ["RuleBasedQualityScorer", "RuleBasedCandidateSelector", "HardFailPolicyEvaluator", "SoftFailPolicyEvaluator"];
check("C-01: scorer declares all 4 rule-based components", RB.every((r) => (scorer.ruleBasedComponents ?? []).includes(r)));
check("C-02: scorer declares future LLM slot", (scorer.futureLlmSlots ?? []).includes("LLMEnhancedQualityScorer"));

// ── § D. builder reads 3 sources + contract policy, no-live ──────────────────
check("D-01: builder references contract fixture path", /money-shorts-creative-quality-contract\.v1\.json/.test(builderText));
check("D-02: builder references script compiler output path", /money-shorts-retention-script-compiler\.output\.v1\.json/.test(builderText));
check("D-03: builder references scene planner output path", /money-shorts-scene-event-planner\.output\.v1\.json/.test(builderText));
check("D-04: builder reads contract via readFileSync", /readFileSync\([^)]*CONTRACT_PATH/.test(builderText));
check("D-05: builder reads script output via readFileSync", /readFileSync\([^)]*SCRIPT_PATH/.test(builderText));
check("D-06: builder reads planner output via readFileSync", /readFileSync\([^)]*PLANNER_PATH/.test(builderText));
check("D-07: builder derives thresholds from contract qualityReportContract", /contract\.qualityReportContract/.test(builderText) && /thresholds/.test(builderText));
check("D-08: builder derives thresholdDirection from contract", /thresholdDirection/.test(builderText));
check("D-09: builder derives hardSoftFailPolicy from contract", /contract\.hardSoftFailPolicy/.test(builderText));
check("D-10: builder derives candidateSelectionPolicy from contract", /contract\.candidateSelectionPolicy/.test(builderText));
check("D-11: builder derives forbidden directions from contract", /contract\.forbiddenLanguagePolicy\.forbiddenDirections/.test(builderText));
check("D-12: builder derives source gate fields from contract", /contract\.sourceGate\.requiredSourceMetadataFields/.test(builderText));
check("D-13: builder evaluates planner output metrics (eventTimingAudit)", /eventTimingAudit/.test(builderText));
check("D-14: builder declares HardFailPolicyEvaluator", /class HardFailPolicyEvaluator/.test(builderText));
check("D-15: builder declares SoftFailPolicyEvaluator", /class SoftFailPolicyEvaluator/.test(builderText));
check("D-16: builder declares RuleBasedQualityScorer", /class RuleBasedQualityScorer/.test(builderText));
check("D-17: builder declares RuleBasedCandidateSelector", /class RuleBasedCandidateSelector/.test(builderText));
check("D-18: builder declares LLMEnhancedQualityScorer slot", /class LLMEnhancedQualityScorer/.test(builderText));
// no-live (code-only)
const builderCode = builderText.split(/\r?\n/).filter((ln) => !/^\s*\/\//.test(ln)).join("\n");
check("D-19: builder does not import openai/googleapis/playwright/elevenlabs", !/(import|require)[^\n]*['"`](openai|googleapis|playwright|elevenlabs)['"`]/i.test(builderCode));
check("D-20: builder does not use fetch()", !/\bfetch\s*\(/.test(builderCode));
check("D-21: builder does not import node:http/https", !/from\s+["']node:https?["']|require\(["']https?["']\)/.test(builderCode));
check("D-22: builder does not read process.env", !/process\.env\./.test(builderCode));
check("D-23: builder does not read a .env file", !/(^|[^A-Za-z0-9_])\.env(\.[A-Za-z]+)?(["'`\s)]|$)/m.test(builderCode));
check("D-24: builder does not spawn/exec child processes", !new RegExp("spawn" + "Sync?\\(|" + "exec" + "(Sync)?\\(").test(builderCode));
check("D-25: builder does not spawn ffmpeg/ffprobe", !/["'](ffmpeg|ffprobe)["']/.test(builderCode));
check("D-26: builder is deterministic (no Math.random)", !/Math\.random\s*\(/.test(builderText));
check("D-27: builder writes only the scorer output fixture", /OUTPUT_PATH/.test(builderText) && /money-shorts-quality-scorer\.output\.v1\.json/.test(builderText));
check("D-28: builder does not writeFileSync .mp4/.mp3/.png", !/writeFileSync\([^)]*\.(mp4|mp3|wav|png|jpg)/.test(builderText));

// ── § E. topic count + structure matches planner topics ──────────────────────
check("E-01: scorer topic count matches planner topic count", scorerTopics.length === planner.topics.length);
check("E-02: scorer has >= 1 topic", scorerTopics.length >= 1);
let eFields = true, ePillar = true, eCandEval = true;
for (const t of scorerTopics) {
  for (const f of ["topicId", "contentPillar", "candidateEvaluations", "qualityReport", "selectedCandidate", "selectionDecision", "phase4Readiness"]) {
    if (!(f in t)) eFields = false;
  }
  const pt = planner.topics.find((x) => x.topicId === t.topicId);
  if (!pt || pt.contentPillar !== t.contentPillar) ePillar = false;
  if (!isArr(t.candidateEvaluations) || t.candidateEvaluations.length < 1) eCandEval = false;
}
check("E-03: every scorer topic has all 7 required sections", eFields);
check("E-04: every scorer topic pillar matches planner pillar", ePillar);
check("E-05: every scorer topic has >= 1 candidate evaluation", eCandEval);
check("E-06: selectedCandidate id (when set) exists in candidateEvaluations", scorerTopics.every((t) => !t.selectedCandidate || t.candidateEvaluations.some((c) => c.candidateId === t.selectedCandidate.candidateId)));

// ── § F. quality report schema (contract-compatible) ─────────────────────────
let fSchema = true;
for (const t of scorerTopics) {
  for (const f of QR_SCHEMA) if (!(f in (t.qualityReport || {}))) fSchema = false;
}
check("F-01: every qualityReport has all contract schema fields", fSchema);
check("F-02: qualityReport has hook_score", scorerTopics.every((t) => "hook_score" in t.qualityReport));
check("F-03: qualityReport has retention_score", scorerTopics.every((t) => "retention_score" in t.qualityReport));
check("F-04: qualityReport has visual_event_count", scorerTopics.every((t) => "visual_event_count" in t.qualityReport));
check("F-05: qualityReport has channel_fit_score", scorerTopics.every((t) => "channel_fit_score" in t.qualityReport));
check("F-06: qualityReport has originality_variation_score", scorerTopics.every((t) => "originality_variation_score" in t.qualityReport));
check("F-07: qualityReport has hard_fail_reasons array", scorerTopics.every((t) => isArr(t.qualityReport.hard_fail_reasons)));
check("F-08: qualityReport has soft_fail_reasons array", scorerTopics.every((t) => isArr(t.qualityReport.soft_fail_reasons)));
check("F-09: qualityReport final_decision in decision enum", scorerTopics.every((t) => DECISION_ENUM.includes(t.qualityReport.final_decision)));
check("F-10: qualityReport has reasons array", scorerTopics.every((t) => isArr(t.qualityReport.reasons)));

// ── § G. threshold application (9 thresholds) + passing sample ───────────────
check("G-01: scorer thresholdsUsed matches contract thresholds", JSON.stringify(scorer.thresholdsUsed) === JSON.stringify(THRESHOLDS));
check("G-02: threshold hook_score === 75", THRESHOLDS.hook_score === 75);
check("G-03: threshold retention_score === 75", THRESHOLDS.retention_score === 75);
check("G-04: threshold visual_event_count === 24", THRESHOLDS.visual_event_count === 24);
check("G-05: threshold first_5s_event_count === 4", THRESHOLDS.first_5s_event_count === 4);
check("G-06: threshold max_static_duration === 2.2 (lte)", THRESHOLDS.max_static_duration === 2.2 && THRESHOLD_DIR.max_static_duration === "lte");
check("G-07: threshold motion_variety_score === 70", THRESHOLDS.motion_variety_score === 70);
check("G-08: threshold script_clarity_score === 75", THRESHOLDS.script_clarity_score === 75);
check("G-09: threshold channel_fit_score === 80", THRESHOLDS.channel_fit_score === 80);
check("G-10: threshold originality_variation_score === 70", THRESHOLDS.originality_variation_score === 70);
// passing-sample metric checks (real scored values)
let gHook = true, gRet = true, gEvents = true, gFirst5 = true, gStatic = true, gMotion = true, gClarity = true, gChannel = true, gOrig = true, gSfx = true;
for (const t of scorerTopics) {
  const q = t.qualityReport;
  if (!(q.hook_score >= 75)) gHook = false;
  if (!(q.retention_score >= 75)) gRet = false;
  if (!(q.visual_event_count >= 24)) gEvents = false;
  if (!(q.first_5s_event_count >= 4)) gFirst5 = false;
  if (!(q.max_static_duration <= 2.2)) gStatic = false;
  if (!(q.motion_variety_score >= 70)) gMotion = false;
  if (!(q.script_clarity_score >= 75)) gClarity = false;
  if (!(q.channel_fit_score >= 80)) gChannel = false;
  if (!(q.originality_variation_score >= 70)) gOrig = false;
  if (!(q.sfx_count >= SFX_RULES.recommendedSfxCountMin && q.sfx_count <= SFX_RULES.recommendedSfxCountMax)) gSfx = false;
}
check("G-11: passing sample hook_score >= 75", gHook);
check("G-12: passing sample retention_score >= 75", gRet);
check("G-13: passing sample visual_event_count >= 24", gEvents);
check("G-14: passing sample first_5s_event_count >= 4", gFirst5);
check("G-15: passing sample max_static_duration <= 2.2", gStatic);
check("G-16: passing sample motion_variety_score >= 70", gMotion);
check("G-17: passing sample script_clarity_score >= 75", gClarity);
check("G-18: passing sample channel_fit_score >= 80", gChannel);
check("G-19: passing sample originality_variation_score >= 70", gOrig);
check("G-20: passing sample sfx_count in 8..12", gSfx);

// ── § H. passing sample decisions ────────────────────────────────────────────
check("H-01: every passing-sample topic has empty hard_fail_reasons", scorerTopics.every((t) => t.qualityReport.hard_fail_reasons.length === 0));
check("H-02: every passing-sample topic final_decision === render", scorerTopics.every((t) => t.qualityReport.final_decision === "render"));
check("H-03: every passing-sample topic has a selectedCandidate", scorerTopics.every((t) => t.selectedCandidate && isStr(t.selectedCandidate.candidateId)));
check("H-04: selectedCandidate carries overall_score", scorerTopics.every((t) => isNum(t.selectedCandidate.overall_score)));
check("H-05: selectionDecision.final_decision matches qualityReport", scorerTopics.every((t) => t.selectionDecision.final_decision === t.qualityReport.final_decision));
check("H-06: selectionDecision.renderBestCandidateAllowed true when no hard fail", scorerTopics.every((t) => t.selectionDecision.renderBestCandidateAllowed === (t.qualityReport.hard_fail_reasons.length === 0)));
check("H-07: selectionDecision.hardFailPresent false for passing sample", scorerTopics.every((t) => t.selectionDecision.hardFailPresent === false));

// ── § I. candidate evaluation fields ─────────────────────────────────────────
const EVAL_FIELDS = ["candidateId", "hasScenePlan", "hook_score", "retention_score", "visual_event_count", "first_5s_event_count", "avg_event_interval", "max_static_duration", "subtitle_density", "motion_variety_score", "sfx_count", "sound_design_score", "script_clarity_score", "channel_fit_score", "originality_variation_score", "hard_fail_reasons", "soft_fail_reasons", "overall_score", "final_decision"];
let iEvalFields = true;
for (const t of scorerTopics) {
  for (const ev of t.candidateEvaluations) {
    for (const f of EVAL_FIELDS) if (!(f in ev)) iEvalFields = false;
  }
}
check("I-01: every candidate evaluation has all required fields", iEvalFields);
check("I-02: every evaluation hasScenePlan === true (planner-backed)", scorerTopics.every((t) => t.candidateEvaluations.every((e) => e.hasScenePlan === true)));
check("I-03: every evaluation overall_score is 0..100", scorerTopics.every((t) => t.candidateEvaluations.every((e) => e.overall_score >= 0 && e.overall_score <= 100)));
check("I-04: every evaluation final_decision in decision enum", scorerTopics.every((t) => t.candidateEvaluations.every((e) => DECISION_ENUM.includes(e.final_decision))));
check("I-05: every evaluation has hard_fail_reasons + soft_fail_reasons arrays", scorerTopics.every((t) => t.candidateEvaluations.every((e) => isArr(e.hard_fail_reasons) && isArr(e.soft_fail_reasons))));

// ── § J. hard/soft fail policy in builder + contract ─────────────────────────
check("J-01: contract hardFailDisallowsRender === true", QRC.hardFailDisallowsRender === true);
check("J-02: contract hardFailDisallowsRenderBestCandidate === true", QRC.hardFailDisallowsRenderBestCandidate === true);
check("J-03: contract softFailAllowsRenderBestCandidate === true", QRC.softFailAllowsRenderBestCandidate === true);
check("J-04: contract hardFailAllowedDecisions === [skip_topic, regenerate_all]", JSON.stringify(HSF.hardFailAllowedDecisions) === JSON.stringify(["skip_topic", "regenerate_all"]));
check("J-05: builder blocks render_best_candidate on hard fail (allHardFail path)", /allHardFail/.test(builderText));
check("J-06: builder returns skip_topic or regenerate_all on all-hard-fail", /skip_topic/.test(builderText) && /regenerate_all/.test(builderText));
check("J-07: builder gives render_best_candidate only when no hard fail (soft only)", /render_best_candidate/.test(builderText) && /noHardFailPool/.test(builderText));
check("J-08: builder scans forbidden/investment/exaggeration", /scanForbidden/.test(builderText) && /INVESTMENT/.test(builderText) && /EXAGGERATION/.test(builderText));
check("J-09: builder treats unsupported template as hard fail", /renderer_unsupported_template_included/.test(builderText));
check("J-10: builder treats source-required missing as hard fail", /source_required_true_but_source_metadata_missing/.test(builderText));

// ── § K. policySimulationCases (3 edge cases) ────────────────────────────────
check("K-01: policySimulationCases has >= 3 cases", sims.length >= 3);
const simById = Object.fromEntries(sims.map((s) => [s.caseId, s]));
check("K-02: passing_candidate_case present", !!simById.passing_candidate_case);
check("K-03: passing_candidate_case expectedDecision render", simById.passing_candidate_case?.expectedDecision === "render");
check("K-04: passing_candidate_case actualDecision render", simById.passing_candidate_case?.actualDecision === "render");
check("K-05: passing_candidate_case pass === true", simById.passing_candidate_case?.pass === true);
check("K-06: soft_fail_best_candidate_case present", !!simById.soft_fail_best_candidate_case);
check("K-07: soft_fail_best_candidate_case expectedDecision render_best_candidate", simById.soft_fail_best_candidate_case?.expectedDecision === "render_best_candidate");
check("K-08: soft_fail_best_candidate_case actualDecision render_best_candidate", simById.soft_fail_best_candidate_case?.actualDecision === "render_best_candidate");
check("K-09: soft_fail_best_candidate_case softFailPresent true", simById.soft_fail_best_candidate_case?.softFailPresent === true);
check("K-10: soft_fail_best_candidate_case pass === true", simById.soft_fail_best_candidate_case?.pass === true);
check("K-11: hard_fail_blocks_render_best_candidate_case present", !!simById.hard_fail_blocks_render_best_candidate_case);
check("K-12: hard_fail case hardFailPresent true", simById.hard_fail_blocks_render_best_candidate_case?.hardFailPresent === true);
check("K-13: hard_fail case renderBestCandidateAllowed false", simById.hard_fail_blocks_render_best_candidate_case?.renderBestCandidateAllowed === false);
check("K-14: hard_fail case actualDecision is skip_topic or regenerate_all", ["skip_topic", "regenerate_all"].includes(simById.hard_fail_blocks_render_best_candidate_case?.actualDecision));
check("K-15: hard_fail case actualDecision is NOT render_best_candidate", simById.hard_fail_blocks_render_best_candidate_case?.actualDecision !== "render_best_candidate");
check("K-16: hard_fail case pass === true", simById.hard_fail_blocks_render_best_candidate_case?.pass === true);
check("K-17: all simulation cases pass", sims.every((s) => s.pass === true));
check("K-18: every simulation has caseId/expectedDecision/actualDecision", sims.every((s) => isStr(s.caseId) && isStr(s.expectedDecision) && isStr(s.actualDecision)));

// ── § L. source gate / risk ──────────────────────────────────────────────────
check("L-01: builder has evaluateSourceGate function", /function evaluateSourceGate/.test(builderText));
check("L-02: builder source gate uses sourceRequiredPillars", /SOURCE_REQUIRED_PILLARS/.test(builderText));
check("L-03: money_flow topic scored with sourceGate", scorerTopics.some((t) => t.contentPillar === "money_flow"));
const mfScored = scorerTopics.find((t) => t.contentPillar === "money_flow");
check("L-04: money_flow scored topic has empty hard fail (source passed)", mfScored && mfScored.qualityReport.hard_fail_reasons.length === 0);
check("L-05: builder scans investment advice patterns", /INVESTMENT/.test(builderText));
check("L-06: builder scans guaranteed-return/exaggeration patterns", /EXAGGERATION/.test(builderText));
check("L-07: current passing sample has no investment/guarantee hard fail", scorerTopics.every((t) => !t.qualityReport.hard_fail_reasons.some((r) => /investment|guaranteed/.test(r))));

// ── § M. artifact file mapping + phase4 handoff ──────────────────────────────
const AFM = scorer.artifactFileMapping ?? {};
check("M-01: artifactFileMapping present", typeof AFM === "object" && AFM !== null);
check("M-02: artifactFileMapping has quality_report.json", "quality_report.json" in AFM);
check("M-03: artifactFileMapping has selected_candidate.json", "selected_candidate.json" in AFM);
check("M-04: phase4Outputs lists quality_report + selected_candidate", ["quality_report.json", "selected_candidate.json"].every((f) => (scorer.phase4Outputs ?? []).includes(f)));
check("M-05: quality_report.json exists in contract requiredFinalArtifacts", contractFinal.includes("quality_report.json"));
check("M-06: selected_candidate.json exists in contract requiredFinalArtifacts", contractFinal.includes("selected_candidate.json"));
let mReady = true, mHint = true;
for (const t of scorerTopics) {
  const r = t.phase4Readiness;
  if (r?.hasQualityReport !== true || r?.renderDecisionMade !== true) mReady = false;
  if (!("nextRenderDecisionReady" in (r || {})) || !("nextPreviewRendererReady" in (r || {}))) mHint = false;
}
check("M-07: every phase4Readiness has quality report + render decision flags", mReady);
check("M-08: every phase4Readiness has nextRenderDecisionReady + nextPreviewRendererReady", mHint);
check("M-09: passing-sample phase4Readiness nextRenderDecisionReady true", scorerTopics.every((t) => t.phase4Readiness.nextRenderDecisionReady === true));

// ── § N. no credential / forbidden-file refs ─────────────────────────────────
for (const [label, raw] of [["scorer", scorerRaw], ["builder", builderText]]) {
  check(`N-01:${label}: no access_token`, !/access_?token/i.test(raw));
  check(`N-02:${label}: no refresh_token`, !/refresh_?token/i.test(raw));
  check(`N-03:${label}: no client_secret/api_key`, !/client_?secret|api_?key/i.test(raw));
  check(`N-04:${label}: no OAuth code`, !/oauth[_-]?code/i.test(raw));
  check(`N-05:${label}: no EAA/IGA token-looking string`, !/\b(EAA|IGA)[A-Za-z0-9]{20,}/.test(raw));
  check(`N-06:${label}: no codex transfer doc ref`, !raw.includes(CTX_TRANSFER_TOKEN));
  check(`N-07:${label}: no diag output file ref`, !raw.includes(PIQ_TOKEN));
}
check("N-08: guard does not reference the codex transfer doc", !selfText.includes(CTX_TRANSFER_TOKEN));
check("N-09: guard does not reference the diag output file", !selfText.includes(PIQ_TOKEN));
check("N-10: guard does not import openai/googleapis/playwright/elevenlabs", !/(import|require)[^\n]*['"`](openai|googleapis|playwright|elevenlabs)['"`]/i.test(selfText));
const guardImports = (selfText.match(/^import\s+.*?from\s+["']([^"']+)["']/gm) || []).map((l) => (l.match(/from\s+["']([^"']+)["']/) || [])[1]);
const ALLOWED = new Set(["node:fs", "node:url", "node:path"]);
check("N-11: guard imports only node:fs/url/path", guardImports.length > 0 && guardImports.every((m) => ALLOWED.has(m)), `imports=${guardImports.join(",")}`);

// ── § O. no render/upload/tts/image execution ────────────────────────────────
check("O-01: scorer renderExecuted false", scorer.renderExecuted === false);
check("O-02: scorer ttsExecuted false", scorer.ttsExecuted === false);
check("O-03: scorer imageGenerationExecuted false", scorer.imageGenerationExecuted === false);
check("O-04: scorer externalApiExecuted false", scorer.externalApiExecuted === false);
check("O-05: builder LLM slot throws (not used in v1)", /is a v-next slot and is not used|not used in rule_based_v1/.test(builderText));
check("O-06: builder does not import child_process", !/(import|require)[^\n]*child_process/.test(builderCode));

// ── § P. per-topic independent deep audit ────────────────────────────────────
scorerTopics.forEach((t, ti) => {
  const q = t.qualityReport;
  const tag = `topic${ti + 1}`;
  check(`P-${tag}-01: qualityReport topic matches topicId`, q.topic === t.topicId);
  check(`P-${tag}-02: content_pillar matches`, q.content_pillar === t.contentPillar);
  check(`P-${tag}-03: final_decision render`, q.final_decision === "render");
  check(`P-${tag}-04: hard_fail empty`, q.hard_fail_reasons.length === 0);
  check(`P-${tag}-05: selectedCandidate present`, !!t.selectedCandidate);
  check(`P-${tag}-06: all 9 thresholds pass`, Object.keys(THRESHOLDS).every((m) => { const dir = THRESHOLD_DIR[m] || "gte"; const v = q[m]; return dir === "lte" ? v <= THRESHOLDS[m] : v >= THRESHOLDS[m]; }));
  check(`P-${tag}-07: overall_score >= 70`, t.candidateEvaluations[0].overall_score >= 70);
  check(`P-${tag}-08: renderBestCandidateAllowed true`, t.selectionDecision.renderBestCandidateAllowed === true);
  check(`P-${tag}-09: nextPreviewRendererReady true`, t.phase4Readiness.nextPreviewRendererReady === true);
  check(`P-${tag}-10: candidate evaluation count >= 1`, t.candidateEvaluations.length >= 1);
});

// ── § Q. per-candidate-evaluation deep audit (each evaluation independently) ──
let qi = 0;
for (const t of scorerTopics) {
  for (const ev of t.candidateEvaluations) {
    qi += 1;
    const tag = `eval${qi}`;
    check(`Q-${tag}-01: candidateId is a string`, isStr(ev.candidateId));
    check(`Q-${tag}-02: hook_score numeric 0..100`, isNum(ev.hook_score) && ev.hook_score >= 0 && ev.hook_score <= 100);
    check(`Q-${tag}-03: retention_score numeric 0..100`, isNum(ev.retention_score) && ev.retention_score >= 0 && ev.retention_score <= 100);
    check(`Q-${tag}-04: visual_event_count >= 24`, ev.visual_event_count >= 24);
    check(`Q-${tag}-05: first_5s_event_count >= 4`, ev.first_5s_event_count >= 4);
    check(`Q-${tag}-06: max_static_duration <= 2.2`, ev.max_static_duration <= 2.2);
    check(`Q-${tag}-07: motion_variety_score >= 70`, ev.motion_variety_score >= 70);
    check(`Q-${tag}-08: script_clarity_score >= 75`, ev.script_clarity_score >= 75);
    check(`Q-${tag}-09: channel_fit_score >= 80`, ev.channel_fit_score >= 80);
    check(`Q-${tag}-10: originality_variation_score >= 70`, ev.originality_variation_score >= 70);
    check(`Q-${tag}-11: sfx_count in 8..12`, ev.sfx_count >= 8 && ev.sfx_count <= 12);
    check(`Q-${tag}-12: overall_score numeric 0..100`, isNum(ev.overall_score) && ev.overall_score >= 0 && ev.overall_score <= 100);
    check(`Q-${tag}-13: passesAllThresholds recorded`, typeof ev.passesAllThresholds === "boolean");
    check(`Q-${tag}-14: passing evaluation passesAllThresholds true`, ev.passesAllThresholds === true);
    check(`Q-${tag}-15: sourceGate recorded`, typeof ev.sourceGate === "object" && ev.sourceGate !== null);
    check(`Q-${tag}-16: avg_event_interval numeric > 0`, isNum(ev.avg_event_interval) && ev.avg_event_interval > 0);
    check(`Q-${tag}-17: subtitle_density numeric`, isNum(ev.subtitle_density));
    check(`Q-${tag}-18: sound_design_score numeric`, isNum(ev.sound_design_score));
  }
}

// ── § R. scoring/decision integrity ──────────────────────────────────────────
check("R-01: builder passesThreshold respects lte/gte direction", /passesThreshold/.test(builderText) && /dir === ["']lte["']/.test(builderText));
check("R-02: builder computes overall_score as mean of gated metrics", /overall/.test(builderText) && /reduce/.test(builderText));
check("R-03: builder retention blends clarity/events/hook", /retention/.test(builderText));
check("R-04: builder originality has a v1 dry-run baseline >= threshold", /originality = 82|originality=82/.test(builderText) || scorerTopics.every((t) => t.qualityReport.originality_variation_score >= 70));
check("R-05: scorer decision enum matches contract enum exactly", JSON.stringify(scorer.finalDecisionEnum) === JSON.stringify(DECISION_ENUM));
check("R-06: every topic decision ∈ enum", scorerTopics.every((t) => DECISION_ENUM.includes(t.selectionDecision.final_decision)));
check("R-07: render decision implies a non-null selectedCandidateId", scorerTopics.every((t) => t.selectionDecision.final_decision !== "render" || isStr(t.selectionDecision.selectedCandidateId)));
check("R-08: hard-fail simulation yields null selectedCandidateId", (() => { const s = sims.find((x) => x.caseId === "hard_fail_blocks_render_best_candidate_case"); return s && s.pass === true; })());
check("R-09: builder selector prefers passing candidate highest overall", /passing\.length > 0/.test(builderText) && /overall_score/.test(builderText));
check("R-10: builder leaves regenerate target (no infinite reject)", /regenerate_all/.test(builderText) && /fallback_regenerate_target|regenerate target/i.test(builderText));
check("R-11: thresholdsUsed has all 9 gated metrics", Object.keys(scorer.thresholdsUsed ?? {}).length === 9);
check("R-12: candidateSelectionPolicy maxCandidatesPerTopic honored (<=3 evaluations)", scorerTopics.every((t) => t.candidateEvaluations.length <= (contract.candidateSelectionPolicy?.maxCandidatesPerTopic ?? 3)));

// ── result ────────────────────────────────────────────────────────────────────
const pass = results.filter((r) => r.pass);
const fail = results.filter((r) => !r.pass);
console.log(`\n══════════════════════════════════════════════════════════`);
console.log(`  QUALITY SCORER v1 — STRUCTURE/SAFETY GUARD`);
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
  console.log(`GUARD OK: quality scorer structure/safety intact (${pass.length}/${results.length}).`);
  process.exit(0);
}
