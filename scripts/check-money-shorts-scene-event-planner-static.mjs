#!/usr/bin/env node
// ──────────────────────────────────────────────────────────────────────────
// check-money-shorts-scene-event-planner-static.mjs
//
// SCENE/EVENT PLANNER v1 — STRUCTURE/SAFETY GUARD (data-only, no execution)
//
// 검증 대상:
//   - scripts/fixtures/money-shorts-creative-quality-contract.v1.json          (contract)
//   - scripts/fixtures/money-shorts-retention-script-compiler.output.v1.json    (script output)
//   - scripts/fixtures/money-shorts-scene-event-planner.output.v1.json          (planner output)
//   - scripts/build-money-shorts-scene-event-planner-v1.mjs                     (builder)
//   - self                                                                      (this guard)
//
// 핵심: 6장 구조 유지 + 24+ visual events + 정적 방지 + renderer registry validation +
//       motion/sound/caption plan이 contract/script를 실제 소비하는지, 외부 실행 흔적 없는지.
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
const BUILDER_PATH = join(__dirname, "build-money-shorts-scene-event-planner-v1.mjs");
const SELF_PATH = join(__dirname, "check-money-shorts-scene-event-planner-static.mjs");

const results = [];
function check(name, condition, detail = "") {
  results.push({ name, pass: !!condition, detail });
}
function isStr(v) { return typeof v === "string" && v.length > 0; }
function isNum(v) { return typeof v === "number" && Number.isFinite(v); }

const CTX_TRANSFER_TOKEN = "CONTEXT" + "_TRANSFER_" + "CODEX";
const PIQ_TOKEN = "piq" + "_diag_" + "out";

let contractRaw, contract, scriptRaw, script, plannerRaw, planner, builderText, selfText;
try {
  contractRaw = readFileSync(CONTRACT_PATH, "utf8");
  contract = JSON.parse(contractRaw);
  scriptRaw = readFileSync(SCRIPT_PATH, "utf8");
  script = JSON.parse(scriptRaw);
  plannerRaw = readFileSync(PLANNER_PATH, "utf8");
  planner = JSON.parse(plannerRaw);
  builderText = readFileSync(BUILDER_PATH, "utf8");
  selfText = readFileSync(SELF_PATH, "utf8");
} catch (e) {
  console.error(`FATAL: cannot read/parse inputs: ${e.message}`);
  process.exit(2);
}

const VEC = contract.visualEventContract ?? {};
const REGISTRY = contract.rendererTemplateRegistry ?? {};
const SFX_RULES = contract.motionCaptionSoundSelection?.sfxRules ?? {};
const SAFE_REF = VEC.youtubeSafeFrameProfileRef;
const supportedMotion = new Set((REGISTRY.motion ?? []).filter((m) => m.renderer_support).map((m) => m.id));
const supportedOverlay = new Set((REGISTRY.overlay ?? []).filter((m) => m.renderer_support).map((m) => m.id));
const supportedSfx = new Set((REGISTRY.sfx ?? []).filter((m) => m.renderer_support).map((m) => m.id));
const unsupportedMotion = new Set((REGISTRY.motion ?? []).filter((m) => !m.renderer_support).map((m) => m.id));
const EVENT_SCHEMA = VEC.visualEventSchemaRequiredFields ?? [];

const plannerTopics = Array.isArray(planner.topics) ? planner.topics : [];
const allEvents = plannerTopics.flatMap((t) => (t.scenePlan?.scenes ?? []).flatMap((s) => s.events ?? []));

// ── § A. contract + script presence ──────────────────────────────────────────
check("A-01: contract parsed", typeof contract === "object" && contract !== null);
check("A-02: contract schemaVersion correct", contract.schemaVersion === "money_shorts_creative_quality_contract_v1");
check("A-03: contract has visualEventContract", typeof VEC === "object" && VEC !== null);
check("A-04: contract has rendererTemplateRegistry", typeof REGISTRY === "object" && REGISTRY !== null);
check("A-05: script compiler output parsed", typeof script === "object" && script !== null);
check("A-06: script compiler schemaVersion correct", script.schemaVersion === "money_shorts_retention_script_compiler_output_v1");
check("A-07: contract sceneCount === 6", VEC.sceneCount === 6);
check("A-08: contract totalVisualEventMin === 24", VEC.totalVisualEventMin === 24);
check("A-09: contract maxStaticDurationSec === 2.2", VEC.maxStaticDurationSec === 2.2);
check("A-10: contract youtube safe-frame ref present", SAFE_REF === "youtube_shorts_safe_frame_v1");

// ── § B. planner output schema + no-live flags ───────────────────────────────
check("B-01: planner schemaVersion === money_shorts_scene_event_planner_output_v1", planner.schemaVersion === "money_shorts_scene_event_planner_output_v1");
check("B-02: planner status === data_only_rule_based_dry_run", planner.status === "data_only_rule_based_dry_run");
check("B-03: planner sourceContractRef points to contract", /money-shorts-creative-quality-contract\.v1\.json$/.test(planner.sourceContractRef ?? ""));
check("B-04: planner sourceScriptCompilerOutputRef points to script output", /money-shorts-retention-script-compiler\.output\.v1\.json$/.test(planner.sourceScriptCompilerOutputRef ?? ""));
check("B-05: planner sourceContractSchemaVersion matches", planner.sourceContractSchemaVersion === contract.schemaVersion);
check("B-06: planner sourceScriptCompilerSchemaVersion matches", planner.sourceScriptCompilerSchemaVersion === script.schemaVersion);
check("B-07: planner plannerMode === rule_based_v1", planner.plannerMode === "rule_based_v1");
check("B-08: planner isLlmGeneration === false", planner.isLlmGeneration === false);
check("B-09: planner externalApiExecuted === false", planner.externalApiExecuted === false);
check("B-10: planner renderExecuted === false", planner.renderExecuted === false);
check("B-11: planner ttsExecuted === false", planner.ttsExecuted === false);
check("B-12: planner imageGenerationExecuted === false", planner.imageGenerationExecuted === false);
check("B-13: planner has topics array", Array.isArray(planner.topics));
check("B-14: planner safeFrameRef === youtube_shorts_safe_frame_v1", planner.safeFrameRef === "youtube_shorts_safe_frame_v1");
check("B-15: planner.boundary.noLlmCall === true", planner.boundary?.noLlmCall === true);
check("B-16: planner.boundary.dataOnly === true", planner.boundary?.dataOnly === true);
check("B-17: planner declares rule-based components", Array.isArray(planner.ruleBasedComponents) && planner.ruleBasedComponents.length >= 3);
check("B-18: planner declares future LLM slot", (planner.futureLlmSlots ?? []).includes("LLMSceneEventPlanner"));

// ── § C. builder reads both sources + registry, is no-live ───────────────────
check("C-01: builder references contract fixture path", /money-shorts-creative-quality-contract\.v1\.json/.test(builderText));
check("C-02: builder references script compiler output path", /money-shorts-retention-script-compiler\.output\.v1\.json/.test(builderText));
check("C-03: builder reads contract via readFileSync", /readFileSync\([^)]*CONTRACT_PATH/.test(builderText));
check("C-04: builder reads script output via readFileSync", /readFileSync\([^)]*SCRIPT_OUTPUT_PATH/.test(builderText));
check("C-05: builder derives visualEventContract from contract", /contract\.visualEventContract/.test(builderText));
check("C-06: builder derives rendererTemplateRegistry from contract", /contract\.rendererTemplateRegistry/.test(builderText));
check("C-07: builder derives intent mapping from contract", /contract\.motionCaptionSoundSelection\.intentToTemplateMapping/.test(builderText));
check("C-08: builder derives sfxRules from contract", /contract\.motionCaptionSoundSelection\.sfxRules/.test(builderText));
check("C-09: builder plans only selected candidates (skips null selectedCandidateId)", /if \(!t\.selectedCandidateId\) continue/.test(builderText));
check("C-10: builder declares RendererTemplateRegistryValidator component", /RendererTemplateRegistryValidator/.test(builderText));
check("C-11: builder declares LLMSceneEventPlanner slot", /class LLMSceneEventPlanner/.test(builderText));
// no-live: code-only view
const builderCode = builderText.split(/\r?\n/).filter((ln) => !/^\s*\/\//.test(ln)).join("\n");
check("C-12: builder does not import openai/googleapis/playwright/elevenlabs", !/(import|require)[^\n]*['"`](openai|googleapis|playwright|elevenlabs)['"`]/i.test(builderCode));
check("C-13: builder does not use fetch()", !/\bfetch\s*\(/.test(builderCode));
check("C-14: builder does not import node:http/https", !/from\s+["']node:https?["']|require\(["']https?["']\)/.test(builderCode));
check("C-15: builder does not read process.env", !/process\.env\./.test(builderCode));
check("C-16: builder does not read a .env file", !/(^|[^A-Za-z0-9_])\.env(\.[A-Za-z]+)?(["'`\s)]|$)/m.test(builderCode));
check("C-17: builder does not spawn/exec child processes", !new RegExp("spawn" + "Sync?\\(|" + "exec" + "(Sync)?\\(").test(builderCode));
check("C-18: builder does not spawn ffmpeg/ffprobe", !/["'](ffmpeg|ffprobe)["']/.test(builderCode));
check("C-19: builder does not call openai/elevenlabs/ecos endpoints", !/api\.openai\.com|api\.elevenlabs\.io|ecos\.bok\.or\.kr/i.test(builderCode));
check("C-20: builder is deterministic (no Math.random)", !/Math\.random\s*\(/.test(builderText));
check("C-21: builder writes only the planner output fixture", /OUTPUT_PATH/.test(builderText) && /money-shorts-scene-event-planner\.output\.v1\.json/.test(builderText));
check("C-22: builder does not writeFileSync .mp4/.mp3/.png", !/writeFileSync\([^)]*\.(mp4|mp3|wav|png|jpg)/.test(builderText));

// ── § D. topic count matches selected topics ─────────────────────────────────
const selectedScriptTopics = script.topics.filter((t) => t.selectedCandidateId);
check("D-01: planner topic count matches script selected-topic count", plannerTopics.length === selectedScriptTopics.length);
check("D-02: planner has >= 1 topic", plannerTopics.length >= 1);
let dPillarOk = true, dSelOk = true, dFields = true;
for (const t of plannerTopics) {
  const st = script.topics.find((x) => x.topicId === t.topicId);
  if (!st || st.contentPillar !== t.contentPillar) dPillarOk = false;
  if (t.selectedCandidateId !== st?.selectedCandidateId) dSelOk = false;
  for (const f of ["topicId", "contentPillar", "selectedCandidateId", "scenePlan", "motionPlan", "soundPlan", "eventTimingAudit", "templateRegistryAudit", "phase3Readiness"]) {
    if (!(f in t)) dFields = false;
  }
}
check("D-03: every planner topic pillar matches script topic pillar", dPillarOk);
check("D-04: every planner topic selectedCandidateId matches script", dSelOk);
check("D-05: every planner topic has all 9 required sections", dFields);

// ── § E. scene structure (6 scenes, image_01..06, 4~6 events) ────────────────
let eSceneCount = true, eImages = true, eEvPerScene = true, eSceneIdx = true;
for (const t of plannerTopics) {
  const scenes = t.scenePlan?.scenes ?? [];
  if (t.scenePlan?.sceneCount !== 6 || scenes.length !== 6) eSceneCount = false;
  scenes.forEach((sc, i) => {
    if (sc.source_image !== `image_0${i + 1}`) eImages = false;
    if (!Array.isArray(sc.events) || sc.events.length < 4 || sc.events.length > 6) eEvPerScene = false;
    if (sc.scene_index !== i + 1) eSceneIdx = false;
  });
}
check("E-01: every topic has sceneCount 6 and 6 scenes", eSceneCount);
check("E-02: scene source images are image_01..image_06", eImages);
check("E-03: every scene has 4..6 events", eEvPerScene);
check("E-04: scene_index is 1..6 in order", eSceneIdx);

// ── § F. total visual events >= 24 ───────────────────────────────────────────
let fTotal = true, fMatch = true;
for (const t of plannerTopics) {
  const total = (t.scenePlan?.scenes ?? []).reduce((s, sc) => s + (sc.events?.length ?? 0), 0);
  if (total < 24) fTotal = false;
  if (t.scenePlan?.totalVisualEvents !== total) fMatch = false;
}
check("F-01: every topic has >= 24 total visual events", fTotal);
check("F-02: scenePlan.totalVisualEvents matches actual event count", fMatch);
check("F-03: overall event pool is non-empty", allEvents.length > 0);

// ── § G. visual event schema (all 11 contract fields + 2 planner extras) ─────
let gSchema = true, gExtras = true, gTimeOrder = true, gDurPos = true, gSafeRef = true, gSingleLine = true;
for (const e of allEvents) {
  for (const f of EVENT_SCHEMA) if (!(f in e)) gSchema = false;
  if (!("safe_frame_ref" in e) || !("source_caption_line_ref" in e)) gExtras = false;
  if (!(e.time_start < e.time_end)) gTimeOrder = false;
  if (!(isNum(e.duration) && e.duration > 0)) gDurPos = false;
  if (e.safe_frame_ref !== SAFE_REF) gSafeRef = false;
  if (typeof e.caption === "string" && /\n/.test(e.caption)) gSingleLine = false;
}
check("G-01: every event has all 11 contract schema fields", gSchema);
check("G-02: every event has safe_frame_ref + source_caption_line_ref", gExtras);
check("G-03: every event time_start < time_end", gTimeOrder);
check("G-04: every event duration > 0", gDurPos);
check("G-05: every event safe_frame_ref === youtube_shorts_safe_frame_v1", gSafeRef);
check("G-06: every event caption is single-line (no newline)", gSingleLine);
check("G-07: event_id present on every event", allEvents.every((e) => isStr(e.event_id)));
check("G-08: script_part present on every event", allEvents.every((e) => isStr(e.script_part)));
check("G-09: intent present on every event", allEvents.every((e) => isStr(e.intent)));
check("G-10: source_image present on every event", allEvents.every((e) => /^image_0[1-6]$/.test(e.source_image)));

// ── § H. static prevention (max static, 3-in-a-row, first windows) ───────────
let hMaxStatic = true, hFirst5s = true, hHook2s = true, hTwist = true, hAction = true, hCoverage = true;
for (const t of plannerTopics) {
  const evs = (t.scenePlan?.scenes ?? []).flatMap((s) => s.events);
  const maxStatic = Math.max(...evs.map((e) => e.duration));
  if (maxStatic > 2.2) hMaxStatic = false;
  const first5 = evs.filter((e) => e.time_start < 5).length;
  if (first5 < 4) hFirst5s = false;
  if (!evs.some((e) => e.intent === "hook_impact" && e.time_start < 2)) hHook2s = false;
  if (!evs.some((e) => e.script_part === "twist_reframe" && e.time_start >= 20 && e.time_start < 27)) hTwist = false;
  if (!evs.some((e) => e.script_part === "action_save_reason" && e.time_start >= 27 && e.time_start < 30)) hAction = false;
  const tStart = Math.min(...evs.map((e) => e.time_start));
  const tEnd = Math.max(...evs.map((e) => e.time_end));
  if (!(tStart === 0 && tEnd === 30)) hCoverage = false;
}
check("H-01: max static duration <= 2.2 for every topic", hMaxStatic);
check("H-02: first 5s has >= 4 visual events", hFirst5s);
check("H-03: first 2s hook-impact event exists", hHook2s);
check("H-04: twist/reframe event exists in 20..27s", hTwist);
check("H-05: action/save event exists in 27..30s", hAction);
check("H-06: timeline covers full 0..30s", hCoverage);
// no same-motion 3-in-a-row (recompute independently)
let hThreeInRow = false;
for (const t of plannerTopics) {
  const evs = (t.scenePlan?.scenes ?? []).flatMap((s) => s.events);
  for (let i = 2; i < evs.length; i++) {
    if (evs[i].motion_template === evs[i - 1].motion_template && evs[i].motion_template === evs[i - 2].motion_template) hThreeInRow = true;
  }
}
check("H-07: no same motion_template 3-in-a-row (independent recompute)", !hThreeInRow);
// eventTimingAudit fields consistent
let hAuditOk = true;
for (const t of plannerTopics) {
  const a = t.eventTimingAudit;
  if (!isNum(a?.totalVisualEvents) || !isNum(a?.first5sEventCount) || !isNum(a?.maxStaticDuration) || !isNum(a?.avgEventInterval)) hAuditOk = false;
  if (a?.allDurationsPositive !== true || a?.allTimeStartBeforeEnd !== true) hAuditOk = false;
  if (a?.timelineCoversFullDuration !== true) hAuditOk = false;
}
check("H-08: eventTimingAudit has consistent numeric fields", hAuditOk);
check("H-09: eventTimingAudit records avg interval and max static", plannerTopics.every((t) => isNum(t.eventTimingAudit?.avgEventInterval) && isNum(t.eventTimingAudit?.maxStaticDuration)));

// ── § I. renderer template registry validation ───────────────────────────────
let iMotionSup = true, iOverlaySup = true, iSfxSup = true, iNoUnsupported = true;
for (const e of allEvents) {
  if (!supportedMotion.has(e.motion_template)) iMotionSup = false;
  if (!supportedOverlay.has(e.overlay)) iOverlaySup = false;
  if (!supportedSfx.has(e.sfx)) iSfxSup = false;
}
check("I-01: every event motion_template is in supported registry", iMotionSup);
check("I-02: every event overlay is in supported registry", iOverlaySup);
check("I-03: every event sfx is in supported registry", iSfxSup);
check("I-04: no event uses a renderer_support=false motion template", allEvents.every((e) => !unsupportedMotion.has(e.motion_template)));
// registry has fallbacks and they are supported
const allTemplates = [...(REGISTRY.motion ?? []), ...(REGISTRY.overlay ?? []), ...(REGISTRY.sfx ?? [])];
check("I-05: every registry template has a fallback_template", allTemplates.every((t) => isStr(t.fallback_template)));
function fbSupported(arr) {
  const sup = new Set(arr.filter((t) => t.renderer_support).map((t) => t.id));
  return arr.every((t) => sup.has(t.fallback_template));
}
check("I-06: motion fallbacks resolve to supported ids", fbSupported(REGISTRY.motion ?? []));
check("I-07: overlay fallbacks resolve to supported ids", fbSupported(REGISTRY.overlay ?? []));
check("I-08: sfx fallbacks resolve to supported ids", fbSupported(REGISTRY.sfx ?? []));
// templateRegistryAudit present and consistent
let iAuditOk = true;
for (const t of plannerTopics) {
  const a = t.templateRegistryAudit;
  if (a?.allMotionSupported !== true || a?.allOverlaySupported !== true || a?.allSfxSupported !== true) iAuditOk = false;
  if (a?.unsupportedTemplateUsedCount !== 0) iAuditOk = false;
  if (!Array.isArray(a?.motionTemplatesUsed)) iAuditOk = false;
}
check("I-09: templateRegistryAudit reports all supported, 0 unsupported", iAuditOk);
check("I-10: builder consults supported template sets", /renderer_support/.test(builderText) && /supportedMotion/.test(builderText));
check("I-11: builder marks unsupported template usage as hard fail", /renderer_unsupported_template_used/.test(builderText));

// ── § J. motion plan ─────────────────────────────────────────────────────────
let jSeq = true, jVariety = true, jNoThree = true, jMapping = true;
for (const t of plannerTopics) {
  const mp = t.motionPlan;
  if (!Array.isArray(mp?.sequence) || mp.sequence.length < 24) jSeq = false;
  if (!isNum(mp?.motionVarietyScore) || mp.motionVarietyScore < 0 || mp.motionVarietyScore > 100) jVariety = false;
  if (mp?.sameMotionThreeInARow !== false) jNoThree = false;
  if (!isStr(mp?.intentMotionMappingSource)) jMapping = false;
}
check("J-01: every topic motionPlan.sequence has >= 24 entries", jSeq);
check("J-02: motionVarietyScore is 0..100", jVariety);
check("J-03: motionPlan.sameMotionThreeInARow === false", jNoThree);
check("J-04: motionPlan references intent mapping source", jMapping);
check("J-05: motion sequence entries have event_id + motion_template + intent", plannerTopics.every((t) => t.motionPlan.sequence.every((m) => isStr(m.event_id) && isStr(m.motion_template) && isStr(m.intent))));
check("J-06: distinctMotionCount recorded", plannerTopics.every((t) => isNum(t.motionPlan.distinctMotionCount)));

// ── § K. sound plan (8~12 sfx, not every caption) ────────────────────────────
let kCount = true, kRange = true, kNotEvery = true, kSeq = true, kSeed = true;
for (const t of plannerTopics) {
  const sp = t.soundPlan;
  const total = t.scenePlan.totalVisualEvents;
  if (!isNum(sp?.sfxCount)) kCount = false;
  if (!(sp?.sfxCount >= SFX_RULES.recommendedSfxCountMin && sp?.sfxCount <= SFX_RULES.recommendedSfxCountMax)) kRange = false;
  if (sp?.everyCaptionHasSfx !== false) kNotEvery = false; // NOT every caption gets sfx
  if (sp?.sfxCount >= total) kNotEvery = false;
  if (!Array.isArray(sp?.sequence)) kSeq = false;
  if (!isNum(sp?.soundDesignScoreSeed)) kSeed = false;
}
check("K-01: every topic soundPlan.sfxCount is numeric", kCount);
check("K-02: sfxCount within recommended 8..12", kRange);
check("K-03: NOT every caption gets sfx (sfxCount < total events)", kNotEvery);
check("K-04: soundPlan has sfx sequence array", kSeq);
check("K-05: soundPlan has soundDesignScoreSeed metadata", kSeed);
check("K-06: soundPlan.sfxWithinRecommended === true", plannerTopics.every((t) => t.soundPlan.sfxWithinRecommended === true));
check("K-07: soundPlan lists sfxFocusIntents", plannerTopics.every((t) => Array.isArray(t.soundPlan.sfxFocusIntents) && t.soundPlan.sfxFocusIntents.length > 0));
check("K-08: contract sfx recommended range is 8..12", SFX_RULES.recommendedSfxCountMin === 8 && SFX_RULES.recommendedSfxCountMax === 12);
check("K-09: sfx sequence entries reference event_id + sfx + intent", plannerTopics.every((t) => t.soundPlan.sequence.every((s) => isStr(s.event_id) && isStr(s.sfx) && isStr(s.intent))));
check("K-10: sfx-bearing events use focus intents", plannerTopics.every((t) => t.soundPlan.sequence.every((s) => ["hook_impact", "money_number", "twist", "action", "explanation"].includes(s.intent))));

// ── § L. caption linkage (from script compiler caption_plan) ─────────────────
let lLinked = true, lSafe = true;
for (const t of plannerTopics) {
  const st = script.topics.find((x) => x.topicId === t.topicId);
  const cand = st.candidates.find((c) => c.candidateId === st.selectedCandidateId);
  const captionByPart = new Map(cand.caption_plan.lines.map((ln) => [ln.script_part, ln.caption]));
  const evs = (t.scenePlan?.scenes ?? []).flatMap((s) => s.events);
  for (const e of evs) {
    if (e.caption && captionByPart.has(e.script_part)) {
      if (e.caption !== captionByPart.get(e.script_part)) lLinked = false;
    }
    if (e.safe_frame_ref !== "youtube_shorts_safe_frame_v1") lSafe = false;
  }
}
check("L-01: event captions are linked to script compiler caption_plan lines", lLinked);
check("L-02: caption events carry youtube safe-frame ref", lSafe);
check("L-03: planner consumes script caption_plan (builder reads caption_plan.lines)", /caption_plan\.lines/.test(builderText));
check("L-04: events reference caption line index (source_caption_line_ref)", allEvents.some((e) => e.source_caption_line_ref !== null));

// ── § M. artifact file mapping + phase3 handoff ──────────────────────────────
const AFM = planner.artifactFileMapping ?? {};
check("M-01: artifactFileMapping present", typeof AFM === "object" && AFM !== null);
check("M-02: artifactFileMapping has scene_plan.json", "scene_plan.json" in AFM);
check("M-03: artifactFileMapping has motion_plan.json", "motion_plan.json" in AFM);
check("M-04: artifactFileMapping has sound_plan.json", "sound_plan.json" in AFM);
check("M-05: phase3Outputs lists scene_plan/motion_plan/sound_plan", ["scene_plan.json", "motion_plan.json", "sound_plan.json"].every((f) => (planner.phase3Outputs ?? []).includes(f)));
const contractFinal = contract.productionGoal?.requiredFinalArtifacts ?? [];
check("M-06: scene_plan.json and sound_plan.json exist in contract final artifacts", contractFinal.includes("scene_plan.json") && contractFinal.includes("sound_plan.json"));
// phase3Readiness handoff flags
let mReady = true, mHint = true;
for (const t of plannerTopics) {
  const r = t.phase3Readiness;
  if (r?.sceneStructureIntact !== true || r?.minVisualEventsMet !== true || r?.staticPreventionOk !== true || r?.rendererRegistryOk !== true) mReady = false;
  if (r?.nextQualityScorerReady !== true || !/quality_scorer|scene_plan_ready/.test(r?.finalDecisionHint ?? "")) mHint = false;
}
check("M-07: every phase3Readiness has scene/events/static/registry flags true", mReady);
check("M-08: every phase3Readiness signals nextQualityScorerReady + handoff hint", mHint);

// ── § N. passing sample has no hard fails ────────────────────────────────────
check("N-01: every planned topic has empty hard_fail_reasons", plannerTopics.every((t) => Array.isArray(t.hard_fail_reasons) && t.hard_fail_reasons.length === 0));
check("N-02: builder collects hard_fail_reasons array", /hard_fail_reasons/.test(builderText));
check("N-03: builder checks total events below min as hard fail", /total_visual_events_below_/.test(builderText));
check("N-04: builder checks max static over limit as hard fail", /max_static_over_/.test(builderText));
check("N-05: builder checks 3-in-a-row as hard fail", /same_motion_template_three_in_a_row/.test(builderText));

// ── § O. no credential / forbidden-file refs (all files) ─────────────────────
for (const [label, raw] of [["planner", plannerRaw], ["builder", builderText]]) {
  check(`O-01:${label}: no access_token`, !/access_?token/i.test(raw));
  check(`O-02:${label}: no refresh_token`, !/refresh_?token/i.test(raw));
  check(`O-03:${label}: no client_secret/api_key`, !/client_?secret|api_?key/i.test(raw));
  check(`O-04:${label}: no OAuth code`, !/oauth[_-]?code/i.test(raw));
  check(`O-05:${label}: no EAA/IGA token-looking string`, !/\b(EAA|IGA)[A-Za-z0-9]{20,}/.test(raw));
  check(`O-06:${label}: no codex transfer doc ref`, !raw.includes(CTX_TRANSFER_TOKEN));
  check(`O-07:${label}: no diag output file ref`, !raw.includes(PIQ_TOKEN));
}
check("O-08: guard does not reference the codex transfer doc", !selfText.includes(CTX_TRANSFER_TOKEN));
check("O-09: guard does not reference the diag output file", !selfText.includes(PIQ_TOKEN));
check("O-10: guard does not import openai/googleapis/playwright/elevenlabs", !/(import|require)[^\n]*['"`](openai|googleapis|playwright|elevenlabs)['"`]/i.test(selfText));
const guardImports = (selfText.match(/^import\s+.*?from\s+["']([^"']+)["']/gm) || []).map((l) => (l.match(/from\s+["']([^"']+)["']/) || [])[1]);
const ALLOWED = new Set(["node:fs", "node:url", "node:path"]);
check("O-11: guard imports only node:fs/url/path (no net/child_process/llm)", guardImports.length > 0 && guardImports.every((m) => ALLOWED.has(m)), `imports=${guardImports.join(",")}`);

// ── § P. render/upload/TTS/image execution NOT present ───────────────────────
check("P-01: planner marks renderExecuted false", planner.renderExecuted === false);
check("P-02: planner marks ttsExecuted false", planner.ttsExecuted === false);
check("P-03: planner marks imageGenerationExecuted false", planner.imageGenerationExecuted === false);
check("P-04: planner marks externalApiExecuted false", planner.externalApiExecuted === false);
check("P-05: builder LLM slot throws (not used in v1)", /is a v-next slot and is not used|not used in rule_based_v1/.test(builderText));
check("P-06: builder does not import child_process", !/(import|require)[^\n]*child_process/.test(builderCode));

// ── § Q. per-topic deep audit (each topic verified independently) ────────────
plannerTopics.forEach((t, ti) => {
  const evs = (t.scenePlan?.scenes ?? []).flatMap((s) => s.events);
  const tag = `topic${ti + 1}`;
  check(`Q-${tag}-01: >=24 events`, evs.length >= 24);
  check(`Q-${tag}-02: all events <=2.2s`, evs.every((e) => e.duration <= 2.2));
  check(`Q-${tag}-03: all events >0s`, evs.every((e) => e.duration > 0));
  check(`Q-${tag}-04: time_start<time_end`, evs.every((e) => e.time_start < e.time_end));
  check(`Q-${tag}-05: contiguous non-overlapping timeline`, (() => {
    const sorted = evs.slice().sort((a, b) => a.time_start - b.time_start);
    for (let i = 1; i < sorted.length; i++) if (Math.round(sorted[i].time_start * 100) / 100 !== Math.round(sorted[i - 1].time_end * 100) / 100) return false;
    return true;
  })());
  check(`Q-${tag}-06: motion all supported`, evs.every((e) => supportedMotion.has(e.motion_template)));
  check(`Q-${tag}-07: overlay all supported`, evs.every((e) => supportedOverlay.has(e.overlay)));
  check(`Q-${tag}-08: sfx all supported`, evs.every((e) => supportedSfx.has(e.sfx)));
  check(`Q-${tag}-09: no unsupported motion used`, evs.every((e) => !unsupportedMotion.has(e.motion_template)));
  check(`Q-${tag}-10: first-2s hook_impact present`, evs.some((e) => e.intent === "hook_impact" && e.time_start < 2));
  check(`Q-${tag}-11: first-5s events >=4`, evs.filter((e) => e.time_start < 5).length >= 4);
  check(`Q-${tag}-12: twist event in 20..27`, evs.some((e) => e.script_part === "twist_reframe" && e.time_start >= 20 && e.time_start < 27));
  check(`Q-${tag}-13: action event in 27..30`, evs.some((e) => e.script_part === "action_save_reason" && e.time_start >= 27 && e.time_start < 30));
  check(`Q-${tag}-14: sfx count in 8..12`, t.soundPlan.sfxCount >= 8 && t.soundPlan.sfxCount <= 12);
  check(`Q-${tag}-15: sfx not on every event`, t.soundPlan.sfxCount < evs.length);
  check(`Q-${tag}-16: no motion 3-in-a-row`, (() => { for (let i = 2; i < evs.length; i++) if (evs[i].motion_template === evs[i - 1].motion_template && evs[i].motion_template === evs[i - 2].motion_template) return false; return true; })());
  check(`Q-${tag}-17: every event caption single-line`, evs.every((e) => !/\n/.test(e.caption || "")));
  check(`Q-${tag}-18: every event safe_frame_ref correct`, evs.every((e) => e.safe_frame_ref === "youtube_shorts_safe_frame_v1"));
  check(`Q-${tag}-19: hard_fail_reasons empty`, t.hard_fail_reasons.length === 0);
  check(`Q-${tag}-20: nextQualityScorerReady true`, t.phase3Readiness.nextQualityScorerReady === true);
});

// ── § R. per-scene deep audit (scene-level structure) ────────────────────────
plannerTopics.forEach((t, ti) => {
  (t.scenePlan?.scenes ?? []).forEach((sc, si) => {
    const tag = `t${ti + 1}s${si + 1}`;
    check(`R-${tag}-01: 4..6 events`, sc.events.length >= 4 && sc.events.length <= 6);
    check(`R-${tag}-02: source_image image_0${si + 1}`, sc.source_image === `image_0${si + 1}`);
    check(`R-${tag}-03: event_count matches events length`, sc.event_count === sc.events.length);
    check(`R-${tag}-04: all events belong to this scene image`, sc.events.every((e) => e.source_image === sc.source_image));
    check(`R-${tag}-05: scene events time-ordered`, (() => { for (let i = 1; i < sc.events.length; i++) if (sc.events[i].time_start < sc.events[i - 1].time_start) return false; return true; })());
  });
});

// ── § S. intent + motion distribution sanity ─────────────────────────────────
check("S-01: hook_impact intent used exactly where expected (first event)", plannerTopics.every((t) => { const evs = t.scenePlan.scenes.flatMap((s) => s.events); return evs[0].intent === "hook_impact"; }));
check("S-02: at least 3 distinct intents across events", plannerTopics.every((t) => new Set(t.scenePlan.scenes.flatMap((s) => s.events).map((e) => e.intent)).size >= 3));
check("S-03: at least 4 distinct motion templates used", plannerTopics.every((t) => new Set(t.scenePlan.scenes.flatMap((s) => s.events).map((e) => e.motion_template)).size >= 4));
check("S-04: motionVarietyScore >= 70 (contract threshold)", plannerTopics.every((t) => t.motionPlan.motionVarietyScore >= 70));
check("S-05: twist_reframe and action_save_reason both present as script_parts", plannerTopics.every((t) => { const parts = new Set(t.scenePlan.scenes.flatMap((s) => s.events).map((e) => e.script_part)); return parts.has("twist_reframe") && parts.has("action_save_reason"); }));
check("S-06: hook script_part present in scene 1", plannerTopics.every((t) => t.scenePlan.scenes[0].events.some((e) => e.script_part === "hook")));

// ── result ────────────────────────────────────────────────────────────────────
const pass = results.filter((r) => r.pass);
const fail = results.filter((r) => !r.pass);
console.log(`\n══════════════════════════════════════════════════════════`);
console.log(`  SCENE/EVENT PLANNER v1 — STRUCTURE/SAFETY GUARD`);
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
  console.log(`GUARD OK: scene/event planner structure/safety intact (${pass.length}/${results.length}).`);
  process.exit(0);
}
