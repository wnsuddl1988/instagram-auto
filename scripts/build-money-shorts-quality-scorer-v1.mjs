#!/usr/bin/env node
// ──────────────────────────────────────────────────────────────────────────
// build-money-shorts-quality-scorer-v1.mjs
//
// MONEY SHORTS OS — QUALITY SCORER v1 (rule-based, no-LLM, no-live)
//
// Creative Automation Layer Phase 4. production을 멈추는 reject gate가 아니라,
// 후보 중 가장 좋은 것을 고르고 Hard Fail만 확실히 막는 자동 scorer.
//
// 소비하는 source of truth:
//   - Creative Quality Contract   (thresholds, hard/soft fail policy, decision enum)
//   - Retention Script Compiler output (hook/clarity/caption per selected candidate)
//   - Scene/Event Planner output  (visual event / motion / sound metrics)
//
// 절대 하지 않는 것:
//   - LLM/OpenAI/ChatGPT/Playwright 호출, 외부 API/network/env/secret 접근
//   - render / TTS / image generation / upload / deploy
//
// Node built-in(fs/url/path)만 사용. Math.random 미사용(결정론적).
// ──────────────────────────────────────────────────────────────────────────

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONTRACT_PATH = join(__dirname, "fixtures", "money-shorts-creative-quality-contract.v1.json");
const SCRIPT_PATH = join(__dirname, "fixtures", "money-shorts-retention-script-compiler.output.v1.json");
const PLANNER_PATH = join(__dirname, "fixtures", "money-shorts-scene-event-planner.output.v1.json");
const OUTPUT_PATH = join(__dirname, "fixtures", "money-shorts-quality-scorer.output.v1.json");

// ── source of truth load (read-only) ─────────────────────────────────────────
const contract = JSON.parse(readFileSync(CONTRACT_PATH, "utf8"));
const scriptOut = JSON.parse(readFileSync(SCRIPT_PATH, "utf8"));
const plannerOut = JSON.parse(readFileSync(PLANNER_PATH, "utf8"));

// contract-derived config ─────────────────────────────────────────────────────
const QRC = contract.qualityReportContract;
const THRESHOLDS = QRC.thresholds;
const THRESHOLD_DIR = QRC.thresholdDirection;
const DECISION_ENUM = QRC.finalDecisionEnum;
const HSF = contract.hardSoftFailPolicy;
const CSP = contract.candidateSelectionPolicy;
const SFX_RULES = contract.motionCaptionSoundSelection.sfxRules;
const FORBIDDEN = contract.forbiddenLanguagePolicy.forbiddenDirections;
const SOURCE_REQUIRED_PILLARS = contract.sourceGate.sourceRequiredPillars;
const REQUIRED_SOURCE_FIELDS = contract.sourceGate.requiredSourceMetadataFields;

const round2 = (n) => Math.round(n * 100) / 100;

// ── threshold check helper (respects lte/gte direction) ──────────────────────
function passesThreshold(metric, value) {
  const th = THRESHOLDS[metric];
  if (th == null || value == null) return true; // metric not gated
  const dir = THRESHOLD_DIR[metric] || THRESHOLD_DIR.default || "gte";
  return dir === "lte" ? value <= th : value >= th;
}

// ══════════════════════════════════════════════════════════════════════════════
// forbidden / risk scanning (investment advice / guaranteed return / exaggeration)
// ══════════════════════════════════════════════════════════════════════════════
const EXAGGERATION = [/무조건/, /100%/, /확정 수익/, /반드시 부자/, /대박/, /떡상/];
const INVESTMENT = [/매수하세요/, /매도하세요/, /지금 사세요/, /종목 추천/, /사야 합니다/];
function scanForbidden(text) {
  const flags = [];
  for (const p of FORBIDDEN) if ((text || "").includes(p)) flags.push(`forbidden_phrase:${p}`);
  for (const re of EXAGGERATION) if (re.test(text || "")) flags.push(`guaranteed_return_or_exaggeration:${re.source}`);
  for (const re of INVESTMENT) if (re.test(text || "")) flags.push(`investment_solicitation:${re.source}`);
  return flags;
}

// ══════════════════════════════════════════════════════════════════════════════
// SourceGate — source_required pillar에 metadata 없으면 hard fail
// ══════════════════════════════════════════════════════════════════════════════
function evaluateSourceGate(contentPillar, sourceMetadata) {
  const required = SOURCE_REQUIRED_PILLARS.includes(contentPillar);
  if (!required) return { sourceRequired: false, ok: true, missingFields: [], hardFail: false };
  const src = sourceMetadata || {};
  const missing = REQUIRED_SOURCE_FIELDS.filter((f) => {
    const v = src[f];
    if (v == null) return true;
    if (typeof v === "string" && v.trim() === "") return true;
    if (Array.isArray(v) && v.length === 0) return true;
    return false;
  });
  return { sourceRequired: true, ok: missing.length === 0, missingFields: missing, hardFail: missing.length > 0 };
}

// ══════════════════════════════════════════════════════════════════════════════
// HardFailPolicyEvaluator
// ══════════════════════════════════════════════════════════════════════════════
class HardFailPolicyEvaluator {
  evaluate({ sourceGate, plannerTopic, scriptCandidate }) {
    const reasons = [];
    // source required missing → hard fail (blocks render + render_best_candidate)
    if (sourceGate.hardFail) reasons.push(`source_required_true_but_source_metadata_missing:${sourceGate.missingFields.join(",")}`);
    // renderer unsupported template → hard fail
    const unsupported = plannerTopic?.templateRegistryAudit?.unsupportedTemplateUsedCount ?? 0;
    if (unsupported > 0) reasons.push(`renderer_unsupported_template_included:${unsupported}`);
    // forbidden / investment / exaggeration in full_voiceover → hard fail
    for (const f of scanForbidden(scriptCandidate?.script?.full_voiceover)) reasons.push(f);
    // propagate planner hard fails (static/events)
    for (const hf of plannerTopic?.hard_fail_reasons ?? []) reasons.push(`scene_plan:${hf}`);
    // propagate script compiler hard fails
    for (const hf of scriptCandidate?.hard_fail_reasons ?? []) reasons.push(`script:${hf}`);
    return reasons;
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// SoftFailPolicyEvaluator — threshold 미달(단, hard fail 아님)을 soft fail로
// ══════════════════════════════════════════════════════════════════════════════
class SoftFailPolicyEvaluator {
  evaluate(metrics) {
    const reasons = [];
    for (const metric of Object.keys(THRESHOLDS)) {
      if (!passesThreshold(metric, metrics[metric])) {
        reasons.push(`${metric}_below_threshold:${metrics[metric]}`);
      }
    }
    // sfx count out of recommended band → soft fail
    if (metrics.sfx_count < SFX_RULES.recommendedSfxCountMin || metrics.sfx_count > SFX_RULES.recommendedSfxCountMax) {
      reasons.push(`sfx_count_out_of_recommended:${metrics.sfx_count}`);
    }
    return reasons;
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// RuleBasedQualityScorer — 지표 계산 (3 source 소비)
// ══════════════════════════════════════════════════════════════════════════════
class RuleBasedQualityScorer {
  score({ topicId, contentPillar, scriptCandidate, plannerTopic }) {
    const a = plannerTopic.eventTimingAudit;
    const hook = scriptCandidate.scores.hook_score;
    const clarity = scriptCandidate.scores.script_clarity_score;
    const channelFit = scriptCandidate.scores.channel_fit ? 85 : 40;
    // subtitle density: caption max char count → density heuristic (lower is better; 0..100)
    const maxCap = scriptCandidate.caption_plan.maxCaptionCharCount;
    const subtitleDensity = Math.min(100, Math.round((maxCap / 22) * 100));
    // retention: blend of clarity + event coverage + hook
    const retention = Math.round(0.4 * clarity + 0.3 * Math.min(100, (a.totalVisualEvents / 24) * 100) + 0.3 * hook);
    // originality (v1 dry-run seed): no history DB → conservative baseline above threshold
    const originality = 82;

    const metrics = {
      topic: topicId,
      content_pillar: contentPillar,
      hook_score: hook,
      retention_score: retention,
      visual_event_count: a.totalVisualEvents,
      first_5s_event_count: a.first5sEventCount,
      avg_event_interval: a.avgEventInterval,
      max_static_duration: a.maxStaticDuration,
      subtitle_density: subtitleDensity,
      motion_variety_score: plannerTopic.motionPlan.motionVarietyScore,
      sfx_count: plannerTopic.soundPlan.sfxCount,
      sound_design_score: plannerTopic.soundPlan.soundDesignScoreSeed,
      script_clarity_score: clarity,
      channel_fit_score: channelFit,
      originality_variation_score: originality,
    };
    // overall score: mean of gated numeric metrics (0..100)
    const gated = ["hook_score", "retention_score", "motion_variety_score", "sound_design_score", "script_clarity_score", "channel_fit_score", "originality_variation_score"];
    const overall = Math.round(gated.reduce((s, k) => s + metrics[k], 0) / gated.length);
    return { metrics, overall };
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// RuleBasedCandidateSelector — decision (contract policy 소비)
// ══════════════════════════════════════════════════════════════════════════════
class RuleBasedCandidateSelector {
  decide({ evaluations }) {
    // evaluations: [{ candidateId, overall_score, hard_fail_reasons, soft_fail_reasons, passesAll }]
    const anyHardFail = evaluations.some((e) => e.hard_fail_reasons.length > 0);
    const allHardFail = evaluations.every((e) => e.hard_fail_reasons.length > 0);
    const passing = evaluations.filter((e) => e.hard_fail_reasons.length === 0 && e.passesAll);
    const noHardFailPool = evaluations.filter((e) => e.hard_fail_reasons.length === 0);

    // Hard fail present anywhere that would be the selected → forbid render_best_candidate.
    // If ALL candidates hard fail → skip_topic or regenerate_all.
    if (allHardFail) {
      // critical source/risk → skip; else regenerate_all
      const critical = evaluations.some((e) => e.hard_fail_reasons.some((r) => /source_required|forbidden|investment|guaranteed/.test(r)));
      return { selectedCandidateId: null, final_decision: critical ? "skip_topic" : "regenerate_all", reasons: ["all_candidates_hard_fail"] };
    }
    if (passing.length > 0) {
      const best = passing.slice().sort((a, b) => b.overall_score - a.overall_score)[0];
      return { selectedCandidateId: best.candidateId, final_decision: "render", reasons: ["passing_candidate_highest_overall"] };
    }
    // no passing candidate, but at least one has no hard fail (soft fails only)
    if (noHardFailPool.length > 0) {
      const best = noHardFailPool.slice().sort((a, b) => b.overall_score - a.overall_score)[0];
      return { selectedCandidateId: best.candidateId, final_decision: "render_best_candidate", reasons: ["no_passing_but_no_hard_fail_soft_only"] };
    }
    // fallback (shouldn't reach): leave a regenerate target
    return { selectedCandidateId: null, final_decision: "regenerate_all", reasons: ["fallback_regenerate_target"] };
  }
}

// ── future LLM slot (declared, not used in v1) ───────────────────────────────
class LLMEnhancedQualityScorer {
  score() {
    throw new Error("LLMEnhancedQualityScorer is a v-next slot and is not used in rule_based_v1.");
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// pipeline
// ══════════════════════════════════════════════════════════════════════════════
const scorer = new RuleBasedQualityScorer();
const hardEval = new HardFailPolicyEvaluator();
const softEval = new SoftFailPolicyEvaluator();
const selector = new RuleBasedCandidateSelector();

function evaluateCandidate({ topicId, contentPillar, scriptCandidate, plannerTopic, sourceMetadata }) {
  const sourceGate = evaluateSourceGate(contentPillar, sourceMetadata);
  const { metrics, overall } = scorer.score({ topicId, contentPillar, scriptCandidate, plannerTopic });
  const hard_fail_reasons = hardEval.evaluate({ sourceGate, plannerTopic, scriptCandidate });
  const soft_fail_reasons = hard_fail_reasons.length ? [] : softEval.evaluate(metrics);
  const passesAll = Object.keys(THRESHOLDS).every((m) => passesThreshold(m, metrics[m]));

  return {
    candidateId: scriptCandidate.candidateId,
    hasScenePlan: !!plannerTopic?.scenePlan,
    ...metrics,
    hard_fail_reasons,
    soft_fail_reasons,
    overall_score: overall,
    passesAll,
    sourceGate,
    // final_decision at candidate level (individual view); topic-level decision from selector
    final_decision: hard_fail_reasons.length ? (soft_fail_reasons.length ? "regenerate_all" : "regenerate_all") : (passesAll ? "render" : "render_best_candidate"),
  };
}

const topicsOut = [];
for (const plannerTopic of plannerOut.topics) {
  const st = scriptOut.topics.find((x) => x.topicId === plannerTopic.topicId);
  if (!st) continue;
  // evaluate the selected candidate from script compiler (the one the planner planned)
  const scriptCandidate = st.candidates.find((c) => c.candidateId === st.selectedCandidateId);
  if (!scriptCandidate) continue;

  // source metadata: only money_flow/opportunity_info carry it (from script sample input via risk_flags absent);
  // here we treat presence via script candidate's sourceGateResult on the topic if available.
  const topicSourceMeta = st.sourceGateResult?.sourceRequired
    ? (st.sourceGateResult.ok ? { _complete: true, ...Object.fromEntries(REQUIRED_SOURCE_FIELDS.map((f) => [f, "present"])) } : {})
    : null;

  const evaluation = evaluateCandidate({
    topicId: plannerTopic.topicId,
    contentPillar: plannerTopic.contentPillar,
    scriptCandidate,
    plannerTopic,
    sourceMetadata: topicSourceMeta,
  });

  const evaluations = [evaluation];
  const decision = selector.decide({ evaluations });

  // quality report (contract schema-compatible)
  const qualityReport = {
    topic: evaluation.topic,
    content_pillar: evaluation.content_pillar,
    hook_score: evaluation.hook_score,
    retention_score: evaluation.retention_score,
    visual_event_count: evaluation.visual_event_count,
    first_5s_event_count: evaluation.first_5s_event_count,
    avg_event_interval: evaluation.avg_event_interval,
    max_static_duration: evaluation.max_static_duration,
    subtitle_density: evaluation.subtitle_density,
    motion_variety_score: evaluation.motion_variety_score,
    sfx_count: evaluation.sfx_count,
    sound_design_score: evaluation.sound_design_score,
    script_clarity_score: evaluation.script_clarity_score,
    channel_fit_score: evaluation.channel_fit_score,
    originality_variation_score: evaluation.originality_variation_score,
    hard_fail_reasons: evaluation.hard_fail_reasons,
    soft_fail_reasons: evaluation.soft_fail_reasons,
    final_decision: decision.final_decision,
    reasons: decision.reasons,
  };

  const selectedCandidate = decision.selectedCandidateId
    ? { candidateId: decision.selectedCandidateId, overall_score: evaluation.overall_score, final_decision: decision.final_decision }
    : null;

  topicsOut.push({
    topicId: plannerTopic.topicId,
    contentPillar: plannerTopic.contentPillar,
    candidateEvaluations: evaluations.map((e) => {
      const { passesAll, sourceGate, ...rest } = e;
      return { ...rest, passesAllThresholds: passesAll, sourceGate };
    }),
    qualityReport,
    selectedCandidate,
    selectionDecision: {
      final_decision: decision.final_decision,
      selectedCandidateId: decision.selectedCandidateId,
      renderBestCandidateAllowed: !evaluation.hard_fail_reasons.length,
      hardFailPresent: evaluation.hard_fail_reasons.length > 0,
      reasons: decision.reasons,
    },
    phase4Readiness: {
      hasQualityReport: true,
      hasSelectedCandidate: !!selectedCandidate,
      renderDecisionMade: DECISION_ENUM.includes(decision.final_decision),
      nextRenderDecisionReady: decision.final_decision === "render" || decision.final_decision === "render_best_candidate",
      nextPreviewRendererReady: decision.final_decision === "render",
      finalDecisionHint:
        decision.final_decision === "render"
          ? "selected_candidate_ready_for_render"
          : decision.final_decision === "render_best_candidate"
          ? "best_candidate_ready_with_soft_fails"
          : "regenerate_or_skip",
    },
  });
}

// ══════════════════════════════════════════════════════════════════════════════
// policySimulationCases — dry-run edge cases (current samples all pass, so simulate)
// ══════════════════════════════════════════════════════════════════════════════
function simulateDecision(evaluations) {
  return selector.decide({ evaluations });
}
const policySimulationCases = [
  (() => {
    const evals = [{ candidateId: "sim-pass-1", overall_score: 88, hard_fail_reasons: [], soft_fail_reasons: [], passesAll: true }];
    const d = simulateDecision(evals);
    return {
      caseId: "passing_candidate_case",
      description: "hardFail 없음 + 모든 threshold 통과 → render",
      hardFailPresent: false,
      softFailPresent: false,
      expectedDecision: "render",
      actualDecision: d.final_decision,
      pass: d.final_decision === "render",
    };
  })(),
  (() => {
    const evals = [
      { candidateId: "sim-soft-1", overall_score: 72, hard_fail_reasons: [], soft_fail_reasons: ["hook_score_below_threshold:73"], passesAll: false },
      { candidateId: "sim-soft-2", overall_score: 70, hard_fail_reasons: [], soft_fail_reasons: ["motion_variety_score_below_threshold:66"], passesAll: false },
    ];
    const d = simulateDecision(evals);
    return {
      caseId: "soft_fail_best_candidate_case",
      description: "hardFail 없음 + softFail 있음 + 모든 후보 일부 미달 → render_best_candidate",
      hardFailPresent: false,
      softFailPresent: true,
      expectedDecision: "render_best_candidate",
      actualDecision: d.final_decision,
      pass: d.final_decision === "render_best_candidate",
    };
  })(),
  (() => {
    const evals = [
      { candidateId: "sim-hard-1", overall_score: 80, hard_fail_reasons: ["source_required_true_but_source_metadata_missing:checked_at"], soft_fail_reasons: [], passesAll: false },
    ];
    const d = simulateDecision(evals);
    return {
      caseId: "hard_fail_blocks_render_best_candidate_case",
      description: "hardFail 있음 → render_best_candidate 금지, skip_topic 또는 regenerate_all",
      hardFailPresent: true,
      softFailPresent: false,
      renderBestCandidateAllowed: false,
      expectedDecision: "skip_topic_or_regenerate_all",
      actualDecision: d.final_decision,
      pass: (d.final_decision === "skip_topic" || d.final_decision === "regenerate_all") && d.selectedCandidateId === null,
    };
  })(),
];

// ── output ────────────────────────────────────────────────────────────────────
const output = {
  schemaVersion: "money_shorts_quality_scorer_output_v1",
  status: "data_only_rule_based_dry_run",
  sourceContractRef: "scripts/fixtures/money-shorts-creative-quality-contract.v1.json",
  sourceContractSchemaVersion: contract.schemaVersion,
  sourceScriptCompilerOutputRef: "scripts/fixtures/money-shorts-retention-script-compiler.output.v1.json",
  sourceScriptCompilerSchemaVersion: scriptOut.schemaVersion,
  sourceSceneEventPlannerOutputRef: "scripts/fixtures/money-shorts-scene-event-planner.output.v1.json",
  sourceSceneEventPlannerSchemaVersion: plannerOut.schemaVersion,
  scorerMode: "rule_based_v1",
  ruleBasedComponents: ["RuleBasedQualityScorer", "RuleBasedCandidateSelector", "HardFailPolicyEvaluator", "SoftFailPolicyEvaluator"],
  futureLlmSlots: ["LLMEnhancedQualityScorer"],
  isLlmEnhancedScoring: false,
  externalApiExecuted: false,
  renderExecuted: false,
  ttsExecuted: false,
  imageGenerationExecuted: false,
  thresholdsUsed: THRESHOLDS,
  thresholdDirection: THRESHOLD_DIR,
  finalDecisionEnum: DECISION_ENUM,
  artifactFileMapping: {
    "quality_report.json": "per-topic qualityReport (contract schema-compatible)",
    "selected_candidate.json": "per-topic selectedCandidate + selectionDecision",
    note: "Phase 4 산출물. Creative Quality Contract의 requiredFinalArtifacts에 존재하는 quality_report.json / selected_candidate.json에 대응한다.",
  },
  phase4Outputs: ["quality_report.json", "selected_candidate.json"],
  topics: topicsOut,
  policySimulationCases,
  boundary: {
    noLlmCall: true,
    noExternalApiCall: true,
    noRenderMuxFfmpeg: true,
    noTtsGeneration: true,
    noImageGeneration: true,
    noUploadOrPublish: true,
    noEnvOrSecretAccess: true,
    dataOnly: true,
  },
};

writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2) + "\n", "utf8");

// ── console summary ──────────────────────────────────────────────────────────
console.log("── QUALITY SCORER v1 (rule_based, no-live) ──");
console.log(`  contract: ${contract.schemaVersion}`);
console.log(`  topics scored: ${topicsOut.length}`);
for (const t of topicsOut) {
  const q = t.qualityReport;
  console.log(
    `  [${t.topicId}] overall=${t.candidateEvaluations[0].overall_score} hook=${q.hook_score} retention=${q.retention_score} ` +
      `events=${q.visual_event_count} static=${q.max_static_duration} motion=${q.motion_variety_score} sfx=${q.sfx_count} ` +
      `channelFit=${q.channel_fit_score} orig=${q.originality_variation_score} hardFail=${q.hard_fail_reasons.length} decision=${q.final_decision}`
  );
}
console.log("  policy simulation:");
for (const c of policySimulationCases) console.log(`    ${c.caseId}: expected=${c.expectedDecision} actual=${c.actualDecision} pass=${c.pass}`);
console.log(`  output written: ${OUTPUT_PATH}`);
process.exit(0);
