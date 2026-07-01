#!/usr/bin/env node
// ──────────────────────────────────────────────────────────────────────────
// check-money-shorts-creative-quality-contract-static.mjs
//
// CREATIVE QUALITY CONTRACT v1 — STRUCTURE/SAFETY GUARD (data-only, no execution)
//
// 검증 대상: scripts/fixtures/money-shorts-creative-quality-contract.v1.json
//   - schema/version/status, production flow + required final artifacts
//   - channel line + content pillars + source-required pillars
//   - forbidden language, source gate, hard/soft fail policy
//   - hook / retention script / caption / visual event contracts
//   - renderer template registry + fallback + unsupported policy
//   - intent→template mapping, tts rhythm, originality guard
//   - quality report schema + thresholds + final decision enum
//   - candidate selection, platform metadata, source/risk disclosure
//   - phase roadmap (phase 8 roadmap-only), boundary flags
//   - no credential / no forbidden-file references
//
// 이 guard는 렌더/업로드/외부 호출/네트워크/env 접근을 절대 하지 않는다. 순수 정적 검사.
// Node built-in only.
// ──────────────────────────────────────────────────────────────────────────

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIXTURE_PATH = join(__dirname, "fixtures", "money-shorts-creative-quality-contract.v1.json");
const SELF_PATH = join(__dirname, "check-money-shorts-creative-quality-contract-static.mjs");

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
function arrIncludesAll(arr, items) {
  return Array.isArray(arr) && items.every((i) => arr.includes(i));
}

// forbidden tokens built by concatenation so this guard doesn't match itself on self-read
const CTX_TRANSFER_TOKEN = "CONTEXT" + "_TRANSFER_" + "CODEX";
const PIQ_TOKEN = "piq" + "_diag_" + "out";

let raw, c, selfText;
try {
  raw = readFileSync(FIXTURE_PATH, "utf8");
  c = JSON.parse(raw);
  selfText = readFileSync(SELF_PATH, "utf8");
} catch (e) {
  console.error(`FATAL: cannot read/parse inputs: ${e.message}`);
  process.exit(2);
}

const pg = c.productionGoal ?? {};
const cp = c.channelPosition ?? {};
const pillars = Array.isArray(c.contentPillars) ? c.contentPillars : [];
const flp = c.forbiddenLanguagePolicy ?? {};
const sg = c.sourceGate ?? {};
const hsf = c.hardSoftFailPolicy ?? {};
const hook = c.hookContract ?? {};
const rsc = c.retentionScriptContract ?? {};
const cap = c.captionContract ?? {};
const vec = c.visualEventContract ?? {};
const rtr = c.rendererTemplateRegistry ?? {};
const mcs = c.motionCaptionSoundSelection ?? {};
const tts = c.ttsRhythmPolicy ?? {};
const ovg = c.originalityVariationGuard ?? {};
const qrc = c.qualityReportContract ?? {};
const csp = c.candidateSelectionPolicy ?? {};
const pmp = c.platformMetadataPolicy ?? {};
const srd = c.sourceRiskDisclosurePolicy ?? {};
const roadmap = Array.isArray(c.phaseRoadmap) ? c.phaseRoadmap : [];
const bd = c.boundary ?? {};

// ── § A. schema / version / status ───────────────────────────────────────────
check("A-01: schemaVersion === money_shorts_creative_quality_contract_v1", c.schemaVersion === "money_shorts_creative_quality_contract_v1");
check("A-02: contractVersion is semver-like", /^\d+\.\d+\.\d+$/.test(c.contractVersion ?? ""));
check("A-03: status marks data_only", isStr(c.status) && c.status.includes("data_only"));
check("A-04: title present", isStr(c.title));
check("A-05: purpose present", isStr(c.purpose));

// ── § B. production goal: flow + final artifacts ─────────────────────────────
const EXPECTED_FLOW = [
  "topic_list", "topic_classification", "source_gate", "hook_candidates_generation", "hook_scoring",
  "retention_script_candidates_generation", "tts_script_duration_guard", "scene_event_plan_generation",
  "renderer_template_registry_validation", "motion_caption_sound_plan_generation", "originality_variation_guard",
  "quality_scoring", "candidate_selection", "final_render", "platform_metadata_generation",
  "upload_queue_readiness", "analytics_feedback_loop_later",
];
check("B-01: productionFlow is an array", Array.isArray(pg.productionFlow));
check("B-02: productionFlow has all 17 pipeline steps", arrIncludesAll(pg.productionFlow, EXPECTED_FLOW));
check("B-03: productionFlow includes source_gate", (pg.productionFlow ?? []).includes("source_gate"));
check("B-04: productionFlow includes hook_scoring", (pg.productionFlow ?? []).includes("hook_scoring"));
check("B-05: productionFlow includes quality_scoring", (pg.productionFlow ?? []).includes("quality_scoring"));
check("B-06: productionFlow includes candidate_selection", (pg.productionFlow ?? []).includes("candidate_selection"));
check("B-07: productionFlow includes final_render", (pg.productionFlow ?? []).includes("final_render"));
check("B-08: productionFlow includes upload_queue_readiness", (pg.productionFlow ?? []).includes("upload_queue_readiness"));
// requiredFinalArtifacts is a FILE OUTPUT contract: the exact 9 file names the final
// production plan writes to disk (script.json ... final_video.mp4), not conceptual stage ids.
const EXPECTED_FINAL_OUTPUT_FILES = [
  "script.json", "hook_candidates.json", "scene_plan.json", "caption_plan.json", "sound_plan.json",
  "quality_report.json", "selected_candidate.json", "platform_metadata.json", "final_video.mp4",
];
check("B-09: requiredFinalArtifacts has exactly 9 entries", Array.isArray(pg.requiredFinalArtifacts) && pg.requiredFinalArtifacts.length === 9);
check("B-10: requiredFinalArtifacts contains all 9 expected production output files", arrIncludesAll(pg.requiredFinalArtifacts, EXPECTED_FINAL_OUTPUT_FILES));
check("B-11: requiredFinalArtifacts is an EXACT match to the 9 file names (no extra/renamed entries)", JSON.stringify([...pg.requiredFinalArtifacts].sort()) === JSON.stringify([...EXPECTED_FINAL_OUTPUT_FILES].sort()));
check("B-12: requiredFinalArtifacts entries are all real file names (.json or .mp4 extension)", (pg.requiredFinalArtifacts ?? []).every((a) => /\.(json|mp4)$/.test(a)));
check("B-13: requiredFinalArtifacts includes script.json", (pg.requiredFinalArtifacts ?? []).includes("script.json"));
check("B-14: requiredFinalArtifacts includes hook_candidates.json", (pg.requiredFinalArtifacts ?? []).includes("hook_candidates.json"));
check("B-15: requiredFinalArtifacts includes scene_plan.json", (pg.requiredFinalArtifacts ?? []).includes("scene_plan.json"));
check("B-16: requiredFinalArtifacts includes caption_plan.json", (pg.requiredFinalArtifacts ?? []).includes("caption_plan.json"));
check("B-17: requiredFinalArtifacts includes sound_plan.json", (pg.requiredFinalArtifacts ?? []).includes("sound_plan.json"));
check("B-18: requiredFinalArtifacts includes quality_report.json", (pg.requiredFinalArtifacts ?? []).includes("quality_report.json"));
check("B-19: requiredFinalArtifacts includes selected_candidate.json", (pg.requiredFinalArtifacts ?? []).includes("selected_candidate.json"));
check("B-20: requiredFinalArtifacts includes platform_metadata.json", (pg.requiredFinalArtifacts ?? []).includes("platform_metadata.json"));
check("B-21: requiredFinalArtifacts includes final_video.mp4 (the only non-json output)", (pg.requiredFinalArtifacts ?? []).includes("final_video.mp4"));
check("B-22: requiredFinalArtifacts does NOT contain conceptual stage ids (e.g. classified_topic)", !(pg.requiredFinalArtifacts ?? []).includes("classified_topic") && !(pg.requiredFinalArtifacts ?? []).includes("retention_script"));
// intermediateArtifacts: conceptual/pipeline-stage ids demoted out of the file-output contract
const EXPECTED_INTERMEDIATE = ["classified_topic", "source_gate_record", "selected_hook", "retention_script", "scene_event_plan", "motion_caption_sound_plan"];
check("B-23: intermediateArtifacts is an array", Array.isArray(pg.intermediateArtifacts));
check("B-24: intermediateArtifacts contains all 6 conceptual stage ids", arrIncludesAll(pg.intermediateArtifacts, EXPECTED_INTERMEDIATE));
check("B-25: intermediateArtifacts and requiredFinalArtifacts do not overlap", (pg.intermediateArtifacts ?? []).every((id) => !(pg.requiredFinalArtifacts ?? []).includes(id)));
// productionPrinciples: the plan's non-negotiable production stance (not an experiment tool,
// no per-video human preview, quality gate selects candidates rather than halting production).
const prp = pg.productionPrinciples ?? {};
check("B-26: productionPrinciples present", typeof prp === "object" && prp !== null && Object.keys(prp).length > 0);
check("B-27: isPartOfProductionPipelineNotExperiment === true", prp.isPartOfProductionPipelineNotExperiment === true);
check("B-28: noPerVideoHumanPreviewOrManualEdit === true", prp.noPerVideoHumanPreviewOrManualEdit === true);
check("B-29: qualityGateIsCandidateSelectorNotProductionHalt === true", prp.qualityGateIsCandidateSelectorNotProductionHalt === true);
check("B-30: productionPrinciples maxCandidatesPerTopic === 3", prp.maxCandidatesPerTopic === 3);
check("B-31: previewIsDevOnlyNotOperationalReviewGate === true", prp.previewIsDevOnlyNotOperationalReviewGate === true);

// ── § C. channel position + content pillars ──────────────────────────────────
check("C-01: channelLine exact fixed phrase", cp.channelLine === "돈의 흐름, 기회 정보, 성공 심리를 30초 안에 번역하는 쇼츠");
check("C-02: everyVideoMustConnectToOneOf === 돈/기회/선택/행동", arrIncludesAll(cp.everyVideoMustConnectToOneOf, ["돈", "기회", "선택", "행동"]));
check("C-03: psychologyRule present (no generic self-help)", isStr(cp.psychologyRule));
check("C-04: contentPillars has exactly 4 pillars", pillars.length === 4);
const pillarIds = pillars.map((p) => p.id);
check("C-05: pillars include money_flow", pillarIds.includes("money_flow"));
check("C-06: pillars include opportunity_info", pillarIds.includes("opportunity_info"));
check("C-07: pillars include money_psychology", pillarIds.includes("money_psychology"));
check("C-08: pillars include success_psychology", pillarIds.includes("success_psychology"));
const moneyFlow = pillars.find((p) => p.id === "money_flow");
const oppInfo = pillars.find((p) => p.id === "opportunity_info");
const moneyPsy = pillars.find((p) => p.id === "money_psychology");
const successPsy = pillars.find((p) => p.id === "success_psychology");
check("C-09: money_flow sourceRequired === true", moneyFlow?.sourceRequired === true);
check("C-10: opportunity_info sourceRequired === true", oppInfo?.sourceRequired === true);
check("C-11: money_psychology sourceRequired === false", moneyPsy?.sourceRequired === false);
check("C-12: success_psychology sourceRequired === false", successPsy?.sourceRequired === false);

// ── § D. forbidden language policy ───────────────────────────────────────────
const FORBIDDEN_DIRS = ["당신은 할 수 있습니다", "긍정적으로 생각하면 성공합니다", "부자처럼 생각하세요", "성공하려면 노력하세요"];
check("D-01: forbiddenDirections is an array", Array.isArray(flp.forbiddenDirections));
check("D-02: forbiddenDirections contains all 4 banned phrases", arrIncludesAll(flp.forbiddenDirections, FORBIDDEN_DIRS));
check("D-03: goodDirectionExamples is a non-empty array", Array.isArray(flp.goodDirectionExamples) && flp.goodDirectionExamples.length >= 4);
check("D-04: goodDirectionExamples includes 실행 미룸 example", (flp.goodDirectionExamples ?? []).some((s) => /실행을 미루/.test(s)));
check("D-05: goodDirectionExamples includes 환경 만들어둠 example", (flp.goodDirectionExamples ?? []).some((s) => /시작하기 쉬운 환경/.test(s)));
check("D-06: goodDirectionExamples includes 정책 도착 example", (flp.goodDirectionExamples ?? []).some((s) => /챙기는 사람에게만 도착/.test(s)));
check("D-07: investmentSolicitationForbidden === true", flp.investmentSolicitationForbidden === true);
check("D-08: guaranteedReturnForbidden === true", flp.guaranteedReturnForbidden === true);
check("D-09: exaggerationForbidden === true", flp.exaggerationForbidden === true);

// ── § E. source gate ─────────────────────────────────────────────────────────
const REQUIRED_SOURCE_FIELDS = [
  "source_urls", "source_titles", "checked_at", "published_date", "policy_date",
  "key_numbers", "deadline_date", "target_condition", "uncertainty_note",
];
check("E-01: sourceRequiredPillars === [money_flow, opportunity_info]", arrIncludesAll(sg.sourceRequiredPillars, ["money_flow", "opportunity_info"]) && sg.sourceRequiredPillars.length === 2);
check("E-02: requiredSourceMetadataFields has all 9 fields", arrIncludesAll(sg.requiredSourceMetadataFields, REQUIRED_SOURCE_FIELDS));
check("E-03: requiredSourceMetadataFields includes checked_at", (sg.requiredSourceMetadataFields ?? []).includes("checked_at"));
check("E-04: requiredSourceMetadataFields includes target_condition", (sg.requiredSourceMetadataFields ?? []).includes("target_condition"));
check("E-05: requiredSourceMetadataFields includes uncertainty_note", (sg.requiredSourceMetadataFields ?? []).includes("uncertainty_note"));
check("E-06: source missing disallows render", sg.processingRules?.sourceRequiredButMissingDisallowsRender === true);
check("E-07: source missing disallows render_best_candidate", sg.processingRules?.sourceRequiredButMissingDisallowsRenderBestCandidate === true);
check("E-08: policy topic missing target/period/condition disallows render", sg.processingRules?.policyTopicMissingTargetPeriodConditionDisallowsRender === true);
check("E-09: date-critical without checked_at is hard fail", sg.processingRules?.dateCriticalWithoutCheckedAtIsHardFail === true);
check("E-10: investment topic forbids buy/sell/guaranteed/exaggeration", sg.processingRules?.investmentTopicForbidsSpecificBuySellGuaranteedReturnExaggeration === true);
check("E-11: insufficient source must regenerate_all or skip", sg.processingRules?.insufficientSourceTopicMustRegenerateAllOrSkip === true);

// ── § F. hard/soft fail policy ───────────────────────────────────────────────
check("F-01: hardFailReasonsExamples is a non-empty array", Array.isArray(hsf.hardFailReasonsExamples) && hsf.hardFailReasonsExamples.length >= 8);
check("F-02: hard fail includes forbidden_phrase_included", (hsf.hardFailReasonsExamples ?? []).includes("forbidden_phrase_included"));
check("F-03: hard fail includes investment solicitation", (hsf.hardFailReasonsExamples ?? []).includes("looks_like_investment_solicitation"));
check("F-04: hard fail includes policy without source", (hsf.hardFailReasonsExamples ?? []).includes("policy_or_subsidy_info_without_source"));
check("F-05: hard fail includes date without checked_at", (hsf.hardFailReasonsExamples ?? []).includes("date_critical_info_without_checked_at"));
check("F-06: hard fail includes renderer unsupported template", (hsf.hardFailReasonsExamples ?? []).includes("renderer_unsupported_template_included"));
check("F-07: hard fail includes source_required missing metadata", (hsf.hardFailReasonsExamples ?? []).includes("source_required_true_but_source_metadata_missing"));
check("F-08: hardFailDisallowsRender === true", hsf.hardFailDisallowsRender === true);
check("F-09: hardFailDisallowsRenderBestCandidate === true", hsf.hardFailDisallowsRenderBestCandidate === true);
check("F-10: hardFailAllowedDecisions === [skip_topic, regenerate_all] only", arrIncludesAll(hsf.hardFailAllowedDecisions, ["skip_topic", "regenerate_all"]) && hsf.hardFailAllowedDecisions.length === 2);
check("F-11: softFailReasonsExamples is a non-empty array", Array.isArray(hsf.softFailReasonsExamples) && hsf.softFailReasonsExamples.length >= 4);
check("F-12: soft fail includes hook slightly below threshold", (hsf.softFailReasonsExamples ?? []).includes("hook_score_slightly_below_threshold"));
check("F-13: soft fail includes visual event 22-23", (hsf.softFailReasonsExamples ?? []).includes("visual_event_count_22_to_23"));
check("F-14: softFailAllowsRenderBestCandidate === true", hsf.softFailAllowsRenderBestCandidate === true);

// ── § G. hook contract ───────────────────────────────────────────────────────
const HOOK_TYPES = ["loss", "gain", "twist", "question", "number", "risk", "wallet_impact", "psychology"];
check("G-01: candidatesPerTopic === 10", hook.candidatesPerTopic === 10);
check("G-02: hookTypes has all 8 types", arrIncludesAll(hook.hookTypes, HOOK_TYPES));
check("G-03: hookTypes includes wallet_impact", (hook.hookTypes ?? []).includes("wallet_impact"));
check("G-04: hookTypes includes psychology", (hook.hookTypes ?? []).includes("psychology"));
check("G-05: evaluationCriteria is a non-empty array", Array.isArray(hook.evaluationCriteria) && hook.evaluationCriteria.length >= 6);
check("G-06: evaluationCriteria includes understood_within_first_2s", (hook.evaluationCriteria ?? []).includes("understood_within_first_2s"));
check("G-07: evaluationCriteria includes recoverable_within_30s", (hook.evaluationCriteria ?? []).includes("recoverable_within_30s"));
check("G-08: selectedHookMinScore === 75", hook.selectedHookMinScore === 75);

// ── § H. retention script contract ───────────────────────────────────────────
const struct = Array.isArray(rsc.structure) ? rsc.structure : [];
check("H-01: totalDurationSec === 30", rsc.totalDurationSec === 30);
check("H-02: structure has 5 parts", struct.length === 5);
check("H-03: structure part hook 0-2s", struct.some((s) => s.part === "hook" && s.timeStartSec === 0 && s.timeEndSec === 2));
check("H-04: structure part curiosity 2-6s", struct.some((s) => s.part === "curiosity" && s.timeStartSec === 2 && s.timeEndSec === 6));
check("H-05: structure part point_1_2_3 6-18s", struct.some((s) => s.part === "point_1_2_3" && s.timeStartSec === 6 && s.timeEndSec === 18));
check("H-06: structure part twist_reframe 18-25s", struct.some((s) => s.part === "twist_reframe" && s.timeStartSec === 18 && s.timeEndSec === 25));
check("H-07: structure part action_save_reason 25-30s", struct.some((s) => s.part === "action_save_reason" && s.timeStartSec === 25 && s.timeEndSec === 30));
check("H-08: scriptSchema has estimated_voiceover_duration", (rsc.scriptSchemaRequiredFields ?? []).includes("estimated_voiceover_duration"));
check("H-09: scriptSchema has target_duration", (rsc.scriptSchemaRequiredFields ?? []).includes("target_duration"));
check("H-10: scriptSchema has needs_compression", (rsc.scriptSchemaRequiredFields ?? []).includes("needs_compression"));
const dg = rsc.durationGuard ?? {};
check("H-11: fullVoiceover min 27", dg.fullVoiceoverMinSec === 27);
check("H-12: fullVoiceover max 30", dg.fullVoiceoverMaxSec === 30);
check("H-13: over 30s requires compression", dg.over30sRequiresCompression === true);
check("H-14: hook duration 1.5-2.5", dg.hookMinSec === 1.5 && dg.hookMaxSec === 2.5);
check("H-15: sentence preferred 1.5-3.5", dg.sentencePreferredMinSec === 1.5 && dg.sentencePreferredMaxSec === 3.5);
check("H-16: long sentence triggers compression", dg.longSentenceTriggersCaptionOrScriptCompression === true);

// ── § I. caption contract ────────────────────────────────────────────────────
check("I-01: captionSafeReference === youtube_shorts_safe_frame_v1", cap.captionSafeReference === "youtube_shorts_safe_frame_v1");
check("I-02: captionDensityPolicy present", isStr(cap.captionDensityPolicy));
check("I-03: captionCompressionRule present", isStr(cap.captionCompressionRule));

// ── § J. visual event contract ───────────────────────────────────────────────
const VE_FIELDS = ["event_id", "time_start", "time_end", "script_part", "intent", "source_image", "motion_template", "caption", "overlay", "sfx", "duration"];
check("J-01: keepSixImageStructure === true", vec.keepSixImageStructure === true);
check("J-02: sceneCount === 6", vec.sceneCount === 6);
check("J-03: eventsPerSceneMin === 4", vec.eventsPerSceneMin === 4);
check("J-04: eventsPerSceneMax === 6", vec.eventsPerSceneMax === 6);
check("J-05: totalVisualEventMin === 24", vec.totalVisualEventMin === 24);
check("J-06: first2sHookImpactEventRequired === true", vec.first2sHookImpactEventRequired === true);
check("J-07: first5sVisualEventMin === 4", vec.first5sVisualEventMin === 4);
check("J-08: maxStaticDurationSec === 2.2", vec.maxStaticDurationSec === 2.2);
check("J-09: sameMotionTemplateConsecutiveLimit === 2", vec.sameMotionTemplateConsecutiveLimit === 2);
check("J-10: sameMotionTemplateThreeInARowForbidden === true", vec.sameMotionTemplateThreeInARowForbidden === true);
check("J-11: twist/reframe window 20-27s", vec.twistReframeEventWindowSec?.startSec === 20 && vec.twistReframeEventWindowSec?.endSec === 27);
check("J-12: action/save window 27-30s", vec.actionSaveReasonEventWindowSec?.startSec === 27 && vec.actionSaveReasonEventWindowSec?.endSec === 30);
check("J-13: youtubeSafeFrameProfileRef === youtube_shorts_safe_frame_v1", vec.youtubeSafeFrameProfileRef === "youtube_shorts_safe_frame_v1");
check("J-14: visualEventSchema has all 11 fields", arrIncludesAll(vec.visualEventSchemaRequiredFields, VE_FIELDS));
check("J-15: visualEventSchema includes motion_template", (vec.visualEventSchemaRequiredFields ?? []).includes("motion_template"));
check("J-16: visualEventSchema includes sfx", (vec.visualEventSchemaRequiredFields ?? []).includes("sfx"));

// ── § K. renderer template registry ──────────────────────────────────────────
const EXPECTED_MOTION = ["push_in", "pull_out", "pan_left", "pan_right", "parallax", "freeze_punch", "checklist_pop", "number_countup", "red_box", "arrow_reveal", "split_screen", "blur_focus", "final_card"];
const EXPECTED_OVERLAY = ["none", "warning_card", "number_card", "checklist", "arrow", "underline", "document_card", "graph_card", "calendar_card"];
const EXPECTED_SFX = ["none", "hit", "whoosh", "click", "beep", "pop", "riser"];
const motionArr = Array.isArray(rtr.motion) ? rtr.motion : [];
const overlayArr = Array.isArray(rtr.overlay) ? rtr.overlay : [];
const sfxArr = Array.isArray(rtr.sfx) ? rtr.sfx : [];
const motionIds = motionArr.map((m) => m.id);
const overlayIds = overlayArr.map((m) => m.id);
const sfxIds = sfxArr.map((m) => m.id);
check("K-01: registry motion includes all expected", arrIncludesAll(motionIds, EXPECTED_MOTION));
check("K-02: registry overlay includes all expected", arrIncludesAll(overlayIds, EXPECTED_OVERLAY));
check("K-03: registry sfx includes all expected", arrIncludesAll(sfxIds, EXPECTED_SFX));
check("K-04: rule motion not in registry fails", rtr.rules?.motionTemplateNotInRegistryFails === true);
check("K-05: rule renderer-unsupported is hard fail", rtr.rules?.rendererUnsupportedTemplateIsHardFail === true);
check("K-06: rule every template must have fallback", rtr.rules?.everyTemplateMustHaveFallbackTemplate === true);
check("K-07: rule fallback must be renderer-supported", rtr.rules?.fallbackMustBeRendererSupported === true);
check("K-08: rule planner must not use unsupported template", rtr.rules?.plannerMustNotUseUnsupportedTemplate === true);
// every template has fallback_template + renderer_support flag
const allTemplates = [...motionArr, ...overlayArr, ...sfxArr];
check("K-09: every template has a fallback_template", allTemplates.every((t) => isStr(t.fallback_template)));
check("K-10: every template has boolean renderer_support", allTemplates.every((t) => typeof t.renderer_support === "boolean"));
// fallback resolves to a renderer-supported template within its own category
function fallbackOk(arr) {
  const supported = new Set(arr.filter((t) => t.renderer_support === true).map((t) => t.id));
  return arr.every((t) => supported.has(t.fallback_template));
}
check("K-11: motion fallbacks are renderer-supported registry ids", fallbackOk(motionArr));
check("K-12: overlay fallbacks are renderer-supported registry ids", fallbackOk(overlayArr));
check("K-13: sfx fallbacks are renderer-supported registry ids", fallbackOk(sfxArr));
// at least some unsupported templates are marked (contract documents the unsupported set)
check("K-14: some motion templates are marked renderer_support=false", motionArr.some((t) => t.renderer_support === false));
check("K-15: unsupported motion has a supported fallback (parallax)", motionArr.find((t) => t.id === "parallax")?.renderer_support === false && new Set(motionArr.filter((t) => t.renderer_support).map((t) => t.id)).has(motionArr.find((t) => t.id === "parallax")?.fallback_template));

// ── § L. motion/caption/sound selection ──────────────────────────────────────
const REQUIRED_INTENTS = ["hook_impact", "risk", "money_number", "policy_deadline", "explanation", "comparison", "psychology", "twist", "action"];
const mapping = mcs.intentToTemplateMapping ?? {};
check("L-01: intentToTemplateMapping present", typeof mapping === "object" && mapping !== null);
check("L-02: mapping has all 9 required intents", REQUIRED_INTENTS.every((i) => mapping[i] != null));
check("L-03: hook_impact mapping present", mapping.hook_impact != null);
check("L-04: risk mapping present", mapping.risk != null);
check("L-05: money_number mapping present", mapping.money_number != null);
check("L-06: policy_deadline mapping present", mapping.policy_deadline != null);
check("L-07: comparison mapping present", mapping.comparison != null);
check("L-08: psychology mapping present", mapping.psychology != null);
check("L-09: twist mapping present", mapping.twist != null);
check("L-10: action mapping present", mapping.action != null);
// mapping references only known registry ids (motion/overlay/sfx)
const motionSet = new Set(motionIds), overlaySet = new Set(overlayIds), sfxSet = new Set(sfxIds);
let mappingRefsValid = true;
for (const intent of Object.keys(mapping)) {
  const m = mapping[intent];
  if (m.motion && !m.motion.every((x) => motionSet.has(x))) mappingRefsValid = false;
  if (m.overlay && !m.overlay.every((x) => overlaySet.has(x))) mappingRefsValid = false;
  if (m.sfx && !m.sfx.every((x) => sfxSet.has(x))) mappingRefsValid = false;
}
check("L-11: all intent mapping template ids exist in registry", mappingRefsValid);
const sfxRules = mcs.sfxRules ?? {};
check("L-12: sfx recommended min 8", sfxRules.recommendedSfxCountMin === 8);
check("L-13: sfx recommended max 12", sfxRules.recommendedSfxCountMax === 12);
check("L-14: not every caption gets sfx", sfxRules.notEveryCaptionGetsSfx === true);
check("L-15: too many sfx is cheap quality risk", sfxRules.tooManySfxIsCheapQualityRisk === true);

// ── § M. tts rhythm policy ───────────────────────────────────────────────────
check("M-01: tts targetFullVoiceover 27-30", tts.targetFullVoiceoverSec?.minSec === 27 && tts.targetFullVoiceoverSec?.maxSec === 30);
check("M-02: tts per-sentence 1.5-3.5", tts.perSentencePacingSec?.preferredMinSec === 1.5 && tts.perSentencePacingSec?.preferredMaxSec === 3.5);
check("M-03: tts hook 1.5-2.5", tts.hookPacingSec?.minSec === 1.5 && tts.hookPacingSec?.maxSec === 2.5);

// ── § N. originality variation guard ─────────────────────────────────────────
const DIMS = ["hook_structure", "first_2s_caption_style", "motion_sequence", "caption_template_sequence", "bgm_sfx_pattern", "script_opening_phrase", "final_action_phrase", "image_composition"];
check("N-01: compareDimensions has all 8 dimensions", arrIncludesAll(ovg.compareDimensions, DIMS));
check("N-02: compareDimensions includes motion_sequence", (ovg.compareDimensions ?? []).includes("motion_sequence"));
check("N-03: compareDimensions includes script_opening_phrase", (ovg.compareDimensions ?? []).includes("script_opening_phrase"));
check("N-04: compareDimensions includes image_composition", (ovg.compareDimensions ?? []).includes("image_composition"));
check("N-05: high similarity lowers score", ovg.highSimilarityLowersOriginalityScore === true);
check("N-06: low score triggers regeneration list", Array.isArray(ovg.lowScoreTriggersRegeneration) && ovg.lowScoreTriggersRegeneration.length >= 1);
check("N-07: opening phrase + motion repetition forbidden within pillar", ovg.openingPhraseAndMotionSequenceRepetitionForbiddenWithinPillar === true);
check("N-08: minimumOriginalityVariationScore === 70", ovg.minimumOriginalityVariationScore === 70);
check("N-09: v1 dry-run policy present", isStr(ovg.v1DryRunPolicy));

// ── § O. quality report contract ─────────────────────────────────────────────
const QR_FIELDS = [
  "topic", "content_pillar", "hook_score", "retention_score", "visual_event_count", "first_5s_event_count",
  "avg_event_interval", "max_static_duration", "subtitle_density", "motion_variety_score", "sfx_count",
  "sound_design_score", "script_clarity_score", "channel_fit_score", "originality_variation_score",
  "hard_fail_reasons", "soft_fail_reasons", "final_decision", "reasons",
];
check("O-01: qualityReportSchema has all 19 fields", arrIncludesAll(qrc.qualityReportSchemaRequiredFields, QR_FIELDS));
check("O-02: schema includes hook_score", (qrc.qualityReportSchemaRequiredFields ?? []).includes("hook_score"));
check("O-03: schema includes channel_fit_score", (qrc.qualityReportSchemaRequiredFields ?? []).includes("channel_fit_score"));
check("O-04: schema includes originality_variation_score", (qrc.qualityReportSchemaRequiredFields ?? []).includes("originality_variation_score"));
check("O-05: schema includes hard_fail_reasons", (qrc.qualityReportSchemaRequiredFields ?? []).includes("hard_fail_reasons"));
check("O-06: schema includes final_decision", (qrc.qualityReportSchemaRequiredFields ?? []).includes("final_decision"));
const th = qrc.thresholds ?? {};
check("O-07: threshold hook_score >= 75", th.hook_score === 75);
check("O-08: threshold retention_score >= 75", th.retention_score === 75);
check("O-09: threshold visual_event_count >= 24", th.visual_event_count === 24);
check("O-10: threshold first_5s_event_count >= 4", th.first_5s_event_count === 4);
check("O-11: threshold max_static_duration <= 2.2", th.max_static_duration === 2.2);
check("O-12: threshold motion_variety_score >= 70", th.motion_variety_score === 70);
check("O-13: threshold script_clarity_score >= 75", th.script_clarity_score === 75);
check("O-14: threshold channel_fit_score >= 80", th.channel_fit_score === 80);
check("O-15: threshold originality_variation_score >= 70", th.originality_variation_score === 70);
check("O-16: max_static_duration threshold direction is lte", qrc.thresholdDirection?.max_static_duration === "lte");
check("O-17: default threshold direction is gte", qrc.thresholdDirection?.default === "gte");
const DECISIONS = ["render", "regenerate_script", "regenerate_scene_plan", "regenerate_all", "render_best_candidate", "skip_topic"];
check("O-18: finalDecisionEnum has all 6 decisions", arrIncludesAll(qrc.finalDecisionEnum, DECISIONS) && qrc.finalDecisionEnum.length === 6);
check("O-19: qrc hardFailDisallowsRender === true", qrc.hardFailDisallowsRender === true);
check("O-20: qrc hardFailDisallowsRenderBestCandidate === true", qrc.hardFailDisallowsRenderBestCandidate === true);
check("O-21: qrc softFailAllowsRenderBestCandidate === true", qrc.softFailAllowsRenderBestCandidate === true);

// ── § P. candidate selection policy ──────────────────────────────────────────
check("P-01: maxCandidatesPerTopic === 3", csp.maxCandidatesPerTopic === 3);
check("P-02: passing candidate → render highest", csp.ifPassingCandidateExistsRenderHighest === true);
check("P-03: no passing but no hard fail → render_best_candidate", csp.ifNoPassingButNoHardFailRenderBestCandidate === true);
check("P-04: hard fail forbids render_best_candidate", csp.hardFailForbidsRenderBestCandidate === true);
check("P-05: critical source/risk/forbidden → skip_topic", csp.criticalSourceRiskForbiddenIssueSkipsTopic === true);
check("P-06: always leave regenerate target (no infinite reject)", csp.alwaysLeaveRegenerateTargetToAvoidInfiniteReject === true);

// ── § Q. platform metadata policy ────────────────────────────────────────────
check("Q-01: generates title/description/caption/hashtags", pmp.generatesTitleDescriptionCaptionHashtags === true);
check("Q-02: no source/date/value hallucination", pmp.noSourceDateValueHallucination === true);
check("Q-03: exact values from sourceFact only", pmp.exactValuesFromSourceFactOnly === true);
check("Q-04: no exact source/date/value baked into image body", pmp.noExactSourceDateValueBakedIntoImageBody === true);
check("Q-05: deterministic overlay for numbers only", pmp.deterministicOverlayForNumbersOnly === true);
check("Q-06: youtube uses safe-frame profile", pmp.perPlatform?.youtube_shorts?.renderProfileId === "youtube_shorts_safe_frame_v1");
check("Q-07: instagram uses full-vertical profile", pmp.perPlatform?.instagram_reels?.renderProfileId === "instagram_reels_full_vertical_v1");

// ── § R. source/risk/disclosure policy ───────────────────────────────────────
check("R-01: must disclose source for factual pillars", srd.mustDiscloseSourceForFactualPillars === true);
check("R-02: must disclose checked_at for date-critical", srd.mustDiscloseCheckedAtForDateCriticalInfo === true);
check("R-03: must include uncertainty note when applicable", srd.mustIncludeUncertaintyNoteWhenApplicable === true);
check("R-04: not investment advice disclosure required", srd.notInvestmentAdviceDisclosureRequired === true);
check("R-05: no guaranteed return claims", srd.noGuaranteedReturnClaims === true);
check("R-06: copyright risk source forbidden", srd.copyrightRiskSourceForbidden === true);

// ── § S. phase roadmap ───────────────────────────────────────────────────────
check("S-01: phaseRoadmap has 8 phases", roadmap.length === 8);
check("S-02: phase 1 is Creative Quality Contract v1", roadmap.find((p) => p.phase === 1)?.name === "Creative Quality Contract v1");
check("S-03: phase 2 is Retention Script Compiler v1", roadmap.find((p) => p.phase === 2)?.name === "Retention Script Compiler v1");
check("S-04: phase 3 is Scene/Event Planner v1", roadmap.find((p) => p.phase === 3)?.name === "Scene/Event Planner v1");
check("S-05: phase 4 is Quality Scorer v1", roadmap.find((p) => p.phase === 4)?.name === "Quality Scorer v1");
check("S-06: phase 5 preview renderer is dev-only (not operational gate)", /dev_only|not_operational/.test(roadmap.find((p) => p.phase === 5)?.status ?? ""));
check("S-07: phase 6 is Orchestrator Integration", /Orchestrator/.test(roadmap.find((p) => p.phase === 6)?.name ?? ""));
check("S-08: phase 7 is Upload Queue Readiness", roadmap.find((p) => p.phase === 7)?.name === "Upload Queue Readiness");
check("S-09: phase 8 status is roadmap_not_implemented_v1", roadmap.find((p) => p.phase === 8)?.status === "roadmap_not_implemented_v1");
// Phase 8 metric names must match the final Production Plan EXACTLY (shared contract —
// downstream analytics consumers key on these strings). Guard against the earlier drift:
// first_3s_dropoff_rate (not _drop_rate), rewatches (not replays), platform_performance_delta
// (not per_platform_performance_difference).
const P8M = ["views", "average_view_duration", "first_3s_dropoff_rate", "rewatches", "like_rate", "comment_rate", "save_rate", "share_rate", "follow_conversion", "platform_performance_delta"];
check("S-10: phase8Metrics has all 10 plan metrics (exact names)", arrIncludesAll(c.phase8Metrics, P8M));
check("S-11: phase8Metrics is an EXACT match to the 10 plan metric names", JSON.stringify([...(c.phase8Metrics ?? [])].sort()) === JSON.stringify([...P8M].sort()));
check("S-12: phase8Metrics uses first_3s_dropoff_rate (not the drifted first_3s_drop_rate)", (c.phase8Metrics ?? []).includes("first_3s_dropoff_rate") && !(c.phase8Metrics ?? []).includes("first_3s_drop_rate"));
check("S-13: phase8Metrics uses rewatches (not the drifted replays)", (c.phase8Metrics ?? []).includes("rewatches") && !(c.phase8Metrics ?? []).includes("replays"));
check("S-14: phase8Metrics uses platform_performance_delta (not per_platform_performance_difference)", (c.phase8Metrics ?? []).includes("platform_performance_delta") && !(c.phase8Metrics ?? []).includes("per_platform_performance_difference"));
check("S-15: phase8Metrics includes save_rate", (c.phase8Metrics ?? []).includes("save_rate"));

// ── § T. boundary flags ──────────────────────────────────────────────────────
check("T-01: boundary.noExternalApiCall === true", bd.noExternalApiCall === true);
check("T-02: boundary.noImageGeneration === true", bd.noImageGeneration === true);
check("T-03: boundary.noTtsGeneration === true", bd.noTtsGeneration === true);
check("T-04: boundary.noRenderMuxFfmpeg === true", bd.noRenderMuxFfmpeg === true);
check("T-05: boundary.noUploadOrPublish === true", bd.noUploadOrPublish === true);
check("T-06: boundary.noDeploy === true", bd.noDeploy === true);
check("T-07: boundary.noEnvOrSecretAccess === true", bd.noEnvOrSecretAccess === true);
check("T-08: boundary.noSourceRequery === true", bd.noSourceRequery === true);
check("T-09: boundary.noDependencyChange === true", bd.noDependencyChange === true);
check("T-10: boundary.dataOnly === true", bd.dataOnly === true);

// ── § U. no credential / no forbidden-file refs ──────────────────────────────
check("U-01: fixture has no access_token/accessToken", !/access_?token/i.test(raw));
check("U-02: fixture has no refresh_token", !/refresh_?token/i.test(raw));
check("U-03: fixture has no client_secret/api_key", !/client_?secret|api_?key/i.test(raw));
check("U-04: fixture has no OAuth code field", !/oauth[_-]?code/i.test(raw));
check("U-05: fixture has no EAA/IGA token-looking string", !/\b(EAA|IGA)[A-Za-z0-9]{20,}/.test(raw));
check("U-06: fixture does not reference the codex transfer doc", !raw.includes(CTX_TRANSFER_TOKEN));
check("U-07: fixture does not reference the diag output file", !raw.includes(PIQ_TOKEN));
check("U-08: guard does not reference the codex transfer doc", !selfText.includes(CTX_TRANSFER_TOKEN));
check("U-09: guard does not reference the diag output file", !selfText.includes(PIQ_TOKEN));
check("U-10: guard does not import googleapis/openai/playwright/elevenlabs", !/(import|require)[^\n]*['"`](googleapis|openai|playwright|elevenlabs)['"`]/i.test(selfText));
check("U-11: guard does not spawn/exec child processes", !new RegExp("spawn" + "Sync?\\(|" + "exec" + "(Sync)?\\(").test(selfText));
check("U-12: guard does not use fetch/http/https network", !/\bfetch\s*\(|require\(["']https?["']\)|from\s+["']node:https?["']/.test(selfText));

// ── result ────────────────────────────────────────────────────────────────────
const pass = results.filter((r) => r.pass);
const fail = results.filter((r) => !r.pass);
console.log(`\n══════════════════════════════════════════════════════════`);
console.log(`  CREATIVE QUALITY CONTRACT v1 — STRUCTURE/SAFETY GUARD`);
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
  console.log(`GUARD OK: creative quality contract structure/safety intact (${pass.length}/${results.length}).`);
  process.exit(0);
}
