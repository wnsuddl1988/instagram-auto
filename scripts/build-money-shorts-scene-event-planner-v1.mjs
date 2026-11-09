#!/usr/bin/env node
// ──────────────────────────────────────────────────────────────────────────
// build-money-shorts-scene-event-planner-v1.mjs
//
// MONEY SHORTS OS — SCENE/EVENT PLANNER v1 (rule-based, no-LLM, no-live)
//
// Creative Automation Layer Phase 3. 정적 6장 슬라이드 문제를 해결한다.
// Creative Quality Contract v1 + Retention Script Compiler output을 소비해,
// 기존 6장 이미지 구조를 유지하되 각 이미지를 4~6 visual event로 쪼개
// 30초 기준 최소 24개 이상의 visual event + motion/sound plan을 생성한다.
//
// 절대 하지 않는 것:
//   - LLM/OpenAI/ChatGPT/Playwright 호출
//   - 외부 API / network / env / secret 접근
//   - render / TTS / image generation / upload / deploy
//
// Node built-in(fs/url/path)만 사용. Math.random 미사용(결정론적).
// ──────────────────────────────────────────────────────────────────────────

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONTRACT_PATH = join(__dirname, "fixtures", "money-shorts-creative-quality-contract.v1.json");
const SCRIPT_OUTPUT_PATH = join(__dirname, "fixtures", "money-shorts-retention-script-compiler.output.v1.json");
const OUTPUT_PATH = join(__dirname, "fixtures", "money-shorts-scene-event-planner.output.v1.json");

// ── source of truth load (read-only) ─────────────────────────────────────────
const contract = JSON.parse(readFileSync(CONTRACT_PATH, "utf8"));
const scriptOutput = JSON.parse(readFileSync(SCRIPT_OUTPUT_PATH, "utf8"));

// contract-derived config ─────────────────────────────────────────────────────
const VEC = contract.visualEventContract;
const SCENE_COUNT = VEC.sceneCount; // 6
const EV_MIN = VEC.eventsPerSceneMin; // 4
const EV_MAX = VEC.eventsPerSceneMax; // 6
const TOTAL_MIN = VEC.totalVisualEventMin; // 24
const MAX_STATIC = VEC.maxStaticDurationSec; // 2.2
const FIRST5S_MIN = VEC.first5sVisualEventMin; // 4
const TWIST_WIN = VEC.twistReframeEventWindowSec; // 20..27
const ACTION_WIN = VEC.actionSaveReasonEventWindowSec; // 27..30
const SAFE_FRAME_REF = VEC.youtubeSafeFrameProfileRef; // youtube_shorts_safe_frame_v1
const TOTAL_DURATION = contract.retentionScriptContract.totalDurationSec; // 30

const REGISTRY = contract.rendererTemplateRegistry;
const INTENT_MAP = contract.motionCaptionSoundSelection.intentToTemplateMapping;
const SFX_RULES = contract.motionCaptionSoundSelection.sfxRules;

// supported template sets (planner MUST NOT use renderer_support=false)
const supportedMotion = new Set(REGISTRY.motion.filter((m) => m.renderer_support).map((m) => m.id));
const supportedOverlay = new Set(REGISTRY.overlay.filter((m) => m.renderer_support).map((m) => m.id));
const supportedSfx = new Set(REGISTRY.sfx.filter((m) => m.renderer_support).map((m) => m.id));
const fallbackById = new Map();
for (const t of [...REGISTRY.motion, ...REGISTRY.overlay, ...REGISTRY.sfx]) fallbackById.set(t.id, t.fallback_template);

// resolve a template to a supported one (fallback if unsupported), track substitutions
function resolveMotion(id, audit) {
  if (supportedMotion.has(id)) return id;
  const fb = fallbackById.get(id);
  audit.substitutions.push({ kind: "motion", requested: id, fallback: fb });
  return supportedMotion.has(fb) ? fb : "push_in";
}
function resolveOverlay(id, audit) {
  if (supportedOverlay.has(id)) return id;
  const fb = fallbackById.get(id);
  audit.substitutions.push({ kind: "overlay", requested: id, fallback: fb });
  return supportedOverlay.has(fb) ? fb : "none";
}
function resolveSfx(id, audit) {
  if (supportedSfx.has(id)) return id;
  const fb = fallbackById.get(id);
  audit.substitutions.push({ kind: "sfx", requested: id, fallback: fb });
  return supportedSfx.has(fb) ? fb : "none";
}

// ══════════════════════════════════════════════════════════════════════════════
// scene → script part layout (6 scenes cover 7 script parts / 30s)
// scene1: hook(0~2s hook impact) | scene2: curiosity | scene3: point_1
// scene4: point_2 | scene5: point_3 | scene6: twist(20~27) + action(27~30)
// ══════════════════════════════════════════════════════════════════════════════
const SCENE_LAYOUT = [
  { image: "image_01", scriptParts: ["hook"], intent: "hook_impact", timeStart: 0, timeEnd: 5 },
  { image: "image_02", scriptParts: ["curiosity"], intent: "explanation", timeStart: 5, timeEnd: 9 },
  { image: "image_03", scriptParts: ["point_1"], intent: "explanation", timeStart: 9, timeEnd: 14 },
  { image: "image_04", scriptParts: ["point_2"], intent: "money_number", timeStart: 14, timeEnd: 19 },
  { image: "image_05", scriptParts: ["point_3"], intent: "explanation", timeStart: 19, timeEnd: 23 },
  { image: "image_06", scriptParts: ["twist_reframe", "action_save_reason"], intent: "twist", timeStart: 23, timeEnd: 30 },
];

// motion rotation pools per intent (kept to supported templates); used to avoid 3-in-a-row
const MOTION_POOL_BY_INTENT = {
  hook_impact: ["freeze_punch", "push_in", "red_box"],
  explanation: ["checklist_pop", "arrow_reveal", "pan_left", "pan_right"],
  money_number: ["number_countup", "push_in", "pull_out"],
  twist: ["freeze_punch", "push_in", "pull_out"],
  action: ["final_card", "push_in", "arrow_reveal"],
};

const round2 = (n) => Math.round(n * 100) / 100;

// build events for one scene: split scene window into N events (4~6), each <= MAX_STATIC
function buildSceneEvents(sceneCfg, sceneIdx, captionLinesByPart, prevTwoMotions, audit, sfxBudget) {
  const windowLen = sceneCfg.timeEnd - sceneCfg.timeStart;
  // choose event count: deterministic per scene, 4~6, keeping each event <= MAX_STATIC
  let nEvents = Math.max(EV_MIN, Math.min(EV_MAX, Math.ceil(windowLen / MAX_STATIC)));
  nEvents = Math.max(EV_MIN, Math.min(EV_MAX, nEvents));
  const dur = windowLen / nEvents;

  const events = [];
  for (let i = 0; i < nEvents; i++) {
    const tStart = round2(sceneCfg.timeStart + i * dur);
    const tEnd = round2(i === nEvents - 1 ? sceneCfg.timeEnd : sceneCfg.timeStart + (i + 1) * dur);
    const duration = round2(tEnd - tStart);

    // intent per event: scene6 splits into twist (until TWIST_WIN.endSec) then action
    let intent = sceneCfg.intent;
    let scriptPart = sceneCfg.scriptParts[0];
    if (sceneIdx === 5) {
      if (tStart >= ACTION_WIN.startSec) {
        intent = "action";
        scriptPart = "action_save_reason";
      } else {
        intent = "twist";
        scriptPart = "twist_reframe";
      }
    }
    // first event overall is the hook-impact event
    const isHookImpact = sceneIdx === 0 && i === 0;
    if (isHookImpact) intent = "hook_impact";

    // motion: pick from pool, avoid 3-in-a-row
    const pool = MOTION_POOL_BY_INTENT[intent] || MOTION_POOL_BY_INTENT.explanation;
    let motion = pool[i % pool.length];
    // avoid 3 consecutive identical
    if (prevTwoMotions[0] === motion && prevTwoMotions[1] === motion) {
      motion = pool[(i + 1) % pool.length];
    }
    motion = resolveMotion(motion, audit);
    prevTwoMotions[0] = prevTwoMotions[1];
    prevTwoMotions[1] = motion;

    // overlay from intent map (supported)
    const overlayCandidates = (INTENT_MAP[intent]?.overlay) || ["none"];
    const overlay = resolveOverlay(overlayCandidates[i % overlayCandidates.length], audit);

    // sfx: only on focus intents & budget remaining; not every caption gets sfx
    const focusIntents = new Set(["hook_impact", "money_number", "twist", "action"]);
    let sfx = "none";
    const wantsSfx = focusIntents.has(intent) && i === 0; // one sfx per focus scene-lead event
    if (wantsSfx && sfxBudget.remaining > 0) {
      const sfxCandidates = (INTENT_MAP[intent]?.sfx) || ["none"];
      sfx = resolveSfx(sfxCandidates[0], audit);
      if (sfx !== "none") sfxBudget.remaining -= 1;
    }

    // caption: from script compiler caption line for this script part (single-line)
    const capLine = captionLinesByPart.get(scriptPart);
    const caption = capLine ? capLine.caption : "";

    events.push({
      event_id: `${sceneCfg.image}-ev-${i + 1}`,
      time_start: tStart,
      time_end: tEnd,
      script_part: scriptPart,
      intent,
      source_image: sceneCfg.image,
      motion_template: motion,
      caption,
      overlay,
      sfx,
      duration,
      safe_frame_ref: SAFE_FRAME_REF,
      source_caption_line_ref: capLine ? capLine.index : null,
    });
  }
  return events;
}

// ══════════════════════════════════════════════════════════════════════════════
// plan one selected candidate → scene/motion/sound plan + audits
// ══════════════════════════════════════════════════════════════════════════════
function planCandidate(topic, candidate) {
  // map caption_plan lines by script_part for caption linkage
  const captionLinesByPart = new Map();
  for (const ln of candidate.caption_plan.lines) captionLinesByPart.set(ln.script_part, ln);

  const audit = { substitutions: [], unsupportedUsed: [] };
  // sfx budget: aim within 8~12 → target 8..12; we cap at max, ensure >= min by topping up
  const sfxBudget = { remaining: SFX_RULES.recommendedSfxCountMax };

  const prevTwoMotions = [null, null];
  const allEvents = [];
  const scenes = [];
  for (let s = 0; s < SCENE_COUNT; s++) {
    const cfg = SCENE_LAYOUT[s];
    const events = buildSceneEvents(cfg, s, captionLinesByPart, prevTwoMotions, audit, sfxBudget);
    scenes.push({ scene_index: s + 1, source_image: cfg.image, event_count: events.length, events });
    allEvents.push(...events);
  }

  // ensure sfx count within 8~12: count actual, top up toward the recommended min.
  // Scene lead events (-ev-1) already carry sfx; top up on scene-CLOSING events (last event
  // of each scene) so emphasis lands on both entry and exit — still NOT every caption.
  let sfxCount = allEvents.filter((e) => e.sfx !== "none").length;
  if (sfxCount < SFX_RULES.recommendedSfxCountMin) {
    // scene-closing event ids: last event of each scene
    const closingIds = new Set(scenes.map((sc) => sc.events[sc.events.length - 1].event_id));
    for (const e of allEvents) {
      if (sfxCount >= SFX_RULES.recommendedSfxCountMin) break;
      if (e.sfx === "none" && closingIds.has(e.event_id)) {
        e.sfx = resolveSfx("click", audit);
        if (e.sfx !== "none") sfxCount++;
      }
    }
  }

  // ── timeline / static audits ──
  const totalEvents = allEvents.length;
  const first5sEvents = allEvents.filter((e) => e.time_start < 5).length;
  const maxStatic = Math.max(...allEvents.map((e) => e.duration));
  const avgInterval = round2(allEvents.reduce((sum, e) => sum + e.duration, 0) / totalEvents);
  const hasHookImpactFirst2s = allEvents.some((e) => e.intent === "hook_impact" && e.time_start < 2);
  const twistEvent = allEvents.some((e) => e.script_part === "twist_reframe" && e.time_start >= TWIST_WIN.startSec && e.time_start < TWIST_WIN.endSec);
  const actionEvent = allEvents.some((e) => e.script_part === "action_save_reason" && e.time_start >= ACTION_WIN.startSec && e.time_start < ACTION_WIN.endSec);
  const timelineStart = Math.min(...allEvents.map((e) => e.time_start));
  const timelineEnd = Math.max(...allEvents.map((e) => e.time_end));

  // same-motion 3-in-a-row check
  let threeInARow = false;
  for (let i = 2; i < allEvents.length; i++) {
    if (allEvents[i].motion_template === allEvents[i - 1].motion_template && allEvents[i].motion_template === allEvents[i - 2].motion_template) {
      threeInARow = true;
      break;
    }
  }

  // motion variety score: distinct motions / total events (0..100)
  const distinctMotions = new Set(allEvents.map((e) => e.motion_template)).size;
  const motionVarietyScore = Math.round((distinctMotions / Math.min(totalEvents, supportedMotion.size)) * 100);

  // ── template registry audit ──
  const unsupportedUsed = allEvents.filter(
    (e) => !supportedMotion.has(e.motion_template) || !supportedOverlay.has(e.overlay) || !supportedSfx.has(e.sfx)
  );
  const templateRegistryAudit = {
    motionTemplatesUsed: [...new Set(allEvents.map((e) => e.motion_template))],
    overlayTemplatesUsed: [...new Set(allEvents.map((e) => e.overlay))],
    sfxTemplatesUsed: [...new Set(allEvents.map((e) => e.sfx))],
    allMotionSupported: allEvents.every((e) => supportedMotion.has(e.motion_template)),
    allOverlaySupported: allEvents.every((e) => supportedOverlay.has(e.overlay)),
    allSfxSupported: allEvents.every((e) => supportedSfx.has(e.sfx)),
    unsupportedTemplateUsedCount: unsupportedUsed.length,
    fallbackSubstitutions: audit.substitutions,
  };

  // ── motion plan ──
  const motionPlan = {
    sequence: allEvents.map((e) => ({ event_id: e.event_id, motion_template: e.motion_template, intent: e.intent })),
    distinctMotionCount: distinctMotions,
    motionVarietyScore,
    sameMotionThreeInARow: threeInARow,
    intentMotionMappingSource: "contract.motionCaptionSoundSelection.intentToTemplateMapping",
  };

  // ── sound plan ──
  const sfxEvents = allEvents.filter((e) => e.sfx !== "none");
  const soundPlan = {
    sequence: sfxEvents.map((e) => ({ event_id: e.event_id, sfx: e.sfx, intent: e.intent })),
    sfxCount: sfxEvents.length,
    recommendedRange: { min: SFX_RULES.recommendedSfxCountMin, max: SFX_RULES.recommendedSfxCountMax },
    sfxWithinRecommended: sfxEvents.length >= SFX_RULES.recommendedSfxCountMin && sfxEvents.length <= SFX_RULES.recommendedSfxCountMax,
    everyCaptionHasSfx: sfxEvents.length >= totalEvents,
    sfxFocusIntents: SFX_RULES.sfxFocusIntents,
    soundDesignScoreSeed: Math.min(100, 60 + (sfxEvents.length >= SFX_RULES.recommendedSfxCountMin ? 25 : 0) + (sfxEvents.length <= SFX_RULES.recommendedSfxCountMax ? 15 : 0)),
  };

  // ── hard fail collection ──
  const hard_fail_reasons = [];
  if (totalEvents < TOTAL_MIN) hard_fail_reasons.push(`total_visual_events_below_${TOTAL_MIN}:${totalEvents}`);
  if (maxStatic > MAX_STATIC) hard_fail_reasons.push(`max_static_over_${MAX_STATIC}:${maxStatic}`);
  if (threeInARow) hard_fail_reasons.push("same_motion_template_three_in_a_row");
  if (unsupportedUsed.length > 0) hard_fail_reasons.push(`renderer_unsupported_template_used:${unsupportedUsed.length}`);
  if (!hasHookImpactFirst2s) hard_fail_reasons.push("missing_first_2s_hook_impact_event");
  if (first5sEvents < FIRST5S_MIN) hard_fail_reasons.push(`first_5s_events_below_${FIRST5S_MIN}:${first5sEvents}`);
  if (!twistEvent) hard_fail_reasons.push("missing_twist_reframe_event_20_27");
  if (!actionEvent) hard_fail_reasons.push("missing_action_save_event_27_30");

  const eventTimingAudit = {
    totalVisualEvents: totalEvents,
    first5sEventCount: first5sEvents,
    maxStaticDuration: round2(maxStatic),
    avgEventInterval: avgInterval,
    hasHookImpactFirst2s,
    twistReframeEventInWindow: twistEvent,
    actionSaveEventInWindow: actionEvent,
    timelineStartSec: round2(timelineStart),
    timelineEndSec: round2(timelineEnd),
    timelineCoversFullDuration: round2(timelineStart) === 0 && round2(timelineEnd) === TOTAL_DURATION,
    allDurationsPositive: allEvents.every((e) => e.duration > 0),
    allTimeStartBeforeEnd: allEvents.every((e) => e.time_start < e.time_end),
  };

  return {
    scenePlan: { sceneCount: SCENE_COUNT, totalVisualEvents: totalEvents, scenes },
    motionPlan,
    soundPlan,
    eventTimingAudit,
    templateRegistryAudit,
    hard_fail_reasons,
  };
}

// ── future LLM slot (declared, not used in v1) ───────────────────────────────
class LLMSceneEventPlanner {
  plan() {
    throw new Error("LLMSceneEventPlanner is a v-next slot and is not used in rule_based_v1.");
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// pipeline: only selected candidates from script compiler output
// ══════════════════════════════════════════════════════════════════════════════
const topicsOut = [];
for (const t of scriptOutput.topics) {
  if (!t.selectedCandidateId) continue;
  const candidate = t.candidates.find((c) => c.candidateId === t.selectedCandidateId);
  if (!candidate) continue;

  const plan = planCandidate(t, candidate);

  topicsOut.push({
    topicId: t.topicId,
    contentPillar: t.contentPillar,
    selectedCandidateId: t.selectedCandidateId,
    scenePlan: plan.scenePlan,
    motionPlan: plan.motionPlan,
    soundPlan: plan.soundPlan,
    eventTimingAudit: plan.eventTimingAudit,
    templateRegistryAudit: plan.templateRegistryAudit,
    hard_fail_reasons: plan.hard_fail_reasons,
    phase3Readiness: {
      sceneStructureIntact: plan.scenePlan.sceneCount === SCENE_COUNT,
      minVisualEventsMet: plan.scenePlan.totalVisualEvents >= TOTAL_MIN,
      staticPreventionOk: plan.eventTimingAudit.maxStaticDuration <= MAX_STATIC && !plan.motionPlan.sameMotionThreeInARow,
      rendererRegistryOk: plan.templateRegistryAudit.unsupportedTemplateUsedCount === 0,
      hasSelectablePlan: plan.hard_fail_reasons.length === 0,
      nextQualityScorerReady: plan.hard_fail_reasons.length === 0,
      finalDecisionHint: plan.hard_fail_reasons.length === 0 ? "scene_plan_ready_for_quality_scorer" : "regenerate_scene_plan",
    },
  });
}

// ── output ────────────────────────────────────────────────────────────────────
const output = {
  schemaVersion: "money_shorts_scene_event_planner_output_v1",
  status: "data_only_rule_based_dry_run",
  sourceContractRef: "scripts/fixtures/money-shorts-creative-quality-contract.v1.json",
  sourceContractSchemaVersion: contract.schemaVersion,
  sourceScriptCompilerOutputRef: "scripts/fixtures/money-shorts-retention-script-compiler.output.v1.json",
  sourceScriptCompilerSchemaVersion: scriptOutput.schemaVersion,
  plannerMode: "rule_based_v1",
  ruleBasedComponents: ["RuleBasedSceneLayout", "RuleBasedEventSplitter", "RuleBasedMotionPlanner", "RuleBasedSoundPlanner", "RendererTemplateRegistryValidator"],
  futureLlmSlots: ["LLMSceneEventPlanner"],
  isLlmGeneration: false,
  externalApiExecuted: false,
  renderExecuted: false,
  ttsExecuted: false,
  imageGenerationExecuted: false,
  rendererRegistryRef: "contract.rendererTemplateRegistry",
  safeFrameRef: SAFE_FRAME_REF,
  artifactFileMapping: {
    "scene_plan.json": "per-topic scenePlan (6 scenes, 24+ visual events)",
    "motion_plan.json": "per-topic motionPlan (motion sequence + variety)",
    "sound_plan.json": "per-topic soundPlan (sfx sequence, 8-12 range)",
    note: "Phase 3 산출물. Creative Quality Contract의 requiredFinalArtifacts와 동일 파일명(scene_plan.json/sound_plan.json)에 대응하며, motion_plan.json은 Phase 3 motion 세부 계획이다.",
  },
  phase3Outputs: ["scene_plan.json", "motion_plan.json", "sound_plan.json"],
  topics: topicsOut,
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
console.log("── SCENE/EVENT PLANNER v1 (rule_based, no-live) ──");
console.log(`  contract: ${contract.schemaVersion} | script: ${scriptOutput.schemaVersion}`);
console.log(`  topics planned: ${topicsOut.length}`);
for (const t of topicsOut) {
  const a = t.eventTimingAudit;
  console.log(
    `  [${t.topicId}] scenes=${t.scenePlan.sceneCount} events=${t.scenePlan.totalVisualEvents} ` +
      `first5s=${a.first5sEventCount} maxStatic=${a.maxStaticDuration}s motionVariety=${t.motionPlan.motionVarietyScore} ` +
      `sfx=${t.soundPlan.sfxCount} 3inRow=${t.motionPlan.sameMotionThreeInARow} unsupported=${t.templateRegistryAudit.unsupportedTemplateUsedCount} hardFail=${t.hard_fail_reasons.length}`
  );
}
console.log(`  output written: ${OUTPUT_PATH}`);
process.exit(0);
