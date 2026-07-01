#!/usr/bin/env node
// ──────────────────────────────────────────────────────────────────────────
// build-money-shorts-creative-final-visual-render-manifest-v1.mjs
//
// MONEY SHORTS OS — CREATIVE FINAL VISUAL RENDER MANIFEST BUILDER v1 (data-only)
//
// Creative Automation Layer Phase 1~6 산출물을 소비해, 선택된 candidate의 FULL 30초
// visual event plan(24+ events)을 실제 selected PNG 6장에 매핑한 visual-only final
// render manifest를 생성한다. 12초 preview subset이 아니라 30초 전체를 사용한다.
//
// 이 builder는 데이터만 만든다 — ffmpeg/이미지/TTS/업로드를 실행하지 않는다.
// 이 render는 최종 업로드용 완성본이 아니다: TTS/SFX/mux 전 단계 visual candidate다.
// 따라서 uploadReady=false, requiresTtsSoundMuxBeforeUpload=true.
//
// 외부 API/LLM/network/env/secret 접근 없음. Math.random 미사용.
// ──────────────────────────────────────────────────────────────────────────

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const F = (name) => join(__dirname, "fixtures", name);
const CONTRACT_PATH = F("money-shorts-creative-quality-contract.v1.json");
const SCRIPT_PATH = F("money-shorts-retention-script-compiler.output.v1.json");
const PLANNER_PATH = F("money-shorts-scene-event-planner.output.v1.json");
const SCORER_PATH = F("money-shorts-quality-scorer.output.v1.json");
const CREATIVE_JOB_PATH = F("money-shorts-automation-job.creative-layer-base-rate-202605.v1.json");
const IMAGESET_PATH = F("premium-editorial-scene-selected-image-set.v1.json");
const PROFILE_PATH = F("premium-editorial-platform-render-profiles.v1.json");
const OUTPUT_PATH = F("money-shorts-creative-final-visual-render-manifest.v1.json");

const OUT_DIR = "C:\\tmp\\money-shorts-os\\creative-final-visual-render-v1";

// ── source of truth load (read-only) ─────────────────────────────────────────
const contract = JSON.parse(readFileSync(CONTRACT_PATH, "utf8"));
const scriptOut = JSON.parse(readFileSync(SCRIPT_PATH, "utf8"));
const plannerOut = JSON.parse(readFileSync(PLANNER_PATH, "utf8"));
const scorerOut = JSON.parse(readFileSync(SCORER_PATH, "utf8"));
const creativeJob = JSON.parse(readFileSync(CREATIVE_JOB_PATH, "utf8"));
const imageSet = JSON.parse(readFileSync(IMAGESET_PATH, "utf8"));
const profiles = JSON.parse(readFileSync(PROFILE_PATH, "utf8"));

const FULL_SEC = contract.retentionScriptContract.totalDurationSec; // 30
const VEC = contract.visualEventContract;
const ytProfile = profiles.platformProfiles.youtube_shorts;
const REGISTRY = contract.rendererTemplateRegistry;
const fallbackById = new Map(
  [...REGISTRY.motion, ...REGISTRY.overlay, ...REGISTRY.sfx].map((t) => [t.id, t.fallback_template])
);

// renderer v1 이 실제 시각적으로 구현하는 motion template (나머지는 fallback)
const RENDERER_SUPPORTED_V1 = new Set([
  "push_in", "pull_out", "pan_left", "pan_right", "freeze_punch",
  "number_countup", "checklist_pop", "red_box", "arrow_reveal", "final_card",
]);

// ── select render-ready topic/candidate (quality scorer) ─────────────────────
const scorerTopic = scorerOut.topics.find((t) => t.qualityReport.final_decision === "render" || t.qualityReport.final_decision === "render_best_candidate");
if (!scorerTopic) {
  console.error("ABORT: no render / render_best_candidate topic in quality scorer output.");
  process.exit(1);
}
const decision = scorerTopic.qualityReport.final_decision;
const hardFailCount = scorerTopic.qualityReport.hard_fail_reasons.length;
if (hardFailCount > 0) {
  console.error(`ABORT: selected topic has ${hardFailCount} hard_fail_reasons; render forbidden.`);
  process.exit(1);
}
const selectedTopicId = scorerTopic.topicId;
const selectedCandidateId = scorerTopic.selectedCandidate.candidateId;

// cross-check against creative job manifest selected candidate
const jobSelectedId = creativeJob.creativeLayer?.creativeSelectedCandidateId;
if (jobSelectedId && jobSelectedId !== selectedCandidateId) {
  console.error(`ABORT: creative job selected candidate (${jobSelectedId}) != quality scorer selected candidate (${selectedCandidateId}).`);
  process.exit(1);
}

const plannerTopic = plannerOut.topics.find((t) => t.topicId === selectedTopicId);
const scriptTopic = scriptOut.topics.find((t) => t.topicId === selectedTopicId);
const scriptCand = scriptTopic.candidates.find((c) => c.candidateId === scriptTopic.selectedCandidateId);

// ── map planner source_image (image_01..06) → selected image set scene ───────
const scenesByOrder = new Map(imageSet.selectedScenes.map((s) => [s.sceneOrder, s]));
function imagePathForSourceImage(sourceImage) {
  const n = parseInt((sourceImage || "").replace("image_0", ""), 10);
  const scene = scenesByOrder.get(n);
  return scene ? scene.imagePath : null;
}

const actualImageInputs = imageSet.selectedScenes.map((s) => ({
  sceneOrder: s.sceneOrder,
  sceneId: s.sceneId,
  sourceImageKey: `image_0${s.sceneOrder}`,
  imagePath: s.imagePath,
  declaredLocalFileExists: s.localFileExists === true,
}));

const round2 = (n) => Math.round(n * 100) / 100;
const captionChars = (t) => (t || "").replace(/\s/g, "").length;

// ── CAPTION ONE-LINE COMPRESSION ─────────────────────────────────────────────
// 자막은 반드시 한 줄이어야 한다. planner event caption(script compiler에서 온 것)이
// one-line safe threshold를 넘으면 renderer가 몰래 자르지 않고, builder가 script_part별
// 짧고 임팩트 있는 renderCaption(의미 유지, ellipsis 금지)으로 deterministic하게 대체한다.
const CAPTION_ONE_LINE_MAX = 16; // 공백 제외 글자 수 상한 (bottom-safe 한 줄 유지)

// script_part별 짧은 renderCaption (base-rate-hold 후보 내용에 맞춘 12~16자 요약).
// 의미를 유지하되 짧게: 금리 동결 → 현금흐름 점검 신호.
const RENDER_CAPTION_BY_PART = {
  hook: "금리 동결, 내 이자 신호",
  curiosity: "왜 내 이자는 그대로일까",
  point_1: "동결은 당장 이득 아님",
  point_2: "예금은 갈아탈 곳 확인",
  point_3: "변동금리 상환 점검",
  twist_reframe: "현금흐름 먼저 정리",
  action_save_reason: "고정비부터 확인, 저장",
};

// deterministic caption resolver: prefer the short renderCaption for the part;
// verify it is one-line safe. NEVER truncate with ellipsis.
function resolveRenderCaption(scriptPart, sourceCaption) {
  const short = RENDER_CAPTION_BY_PART[scriptPart];
  if (short && captionChars(short) <= CAPTION_ONE_LINE_MAX) return short;
  // fallback: if source is already short & not ellipsis-truncated, keep it
  if (sourceCaption && !/[…\.]{1,3}$/.test(sourceCaption) && captionChars(sourceCaption) <= CAPTION_ONE_LINE_MAX) return sourceCaption;
  // last resort should not happen for this candidate; still avoid ellipsis — hard fail at build
  return null;
}

// ── FULL 30s event timeline (all 24+ events, NOT a 12s subset) ───────────────
const allEvents = plannerTopic.scenePlan.scenes.flatMap((s) => s.events);
const fallbackTemplatesApplied = [];
const captionCompressions = [];
const fullEventTimeline = allEvents.map((e) => {
  let motion = e.motion_template;
  let fallbackApplied = false;
  if (!RENDERER_SUPPORTED_V1.has(motion)) {
    const fb = fallbackById.get(motion) || "push_in";
    fallbackTemplatesApplied.push({ event_id: e.event_id, requested: motion, fallback: fb });
    motion = RENDERER_SUPPORTED_V1.has(fb) ? fb : "push_in";
    fallbackApplied = true;
  }
  const sourceCaption = e.caption || "";
  const renderCaption = resolveRenderCaption(e.script_part, sourceCaption);
  if (renderCaption === null) {
    console.error(`ABORT: no one-line-safe caption for event ${e.event_id} (part=${e.script_part}); refuse ellipsis truncation.`);
    process.exit(1);
  }
  if (renderCaption !== sourceCaption) {
    captionCompressions.push({ event_id: e.event_id, script_part: e.script_part, sourceCaption, renderCaption, sourceChars: captionChars(sourceCaption), renderChars: captionChars(renderCaption) });
  }
  return {
    event_id: e.event_id,
    time_start: e.time_start,
    time_end: e.time_end,
    duration: round2(e.time_end - e.time_start),
    script_part: e.script_part,
    intent: e.intent,
    source_image: e.source_image,
    imagePath: imagePathForSourceImage(e.source_image),
    motion_template: motion,
    fallbackApplied,
    caption: renderCaption, // the ACTUAL caption to render — one-line safe
    sourceCaption, // original (may be ellipsis-truncated upstream); preserved for provenance
    captionCompressed: renderCaption !== sourceCaption,
    captionChars: captionChars(renderCaption),
    overlay: e.overlay,
    sfx: e.sfx,
    safe_frame_ref: e.safe_frame_ref,
    source_caption_line_ref: e.source_caption_line_ref ?? null,
  };
});

// build-time invariant: every rendered caption is one-line safe
const overLimit = fullEventTimeline.filter((e) => captionChars(e.caption) > CAPTION_ONE_LINE_MAX);
if (overLimit.length > 0) {
  console.error(`ABORT: ${overLimit.length} caption(s) exceed one-line max ${CAPTION_ONE_LINE_MAX}: ${overLimit.map((e) => e.event_id).join(",")}`);
  process.exit(1);
}

// ── caption plan (single-line, safe-frame) ───────────────────────────────────
const captionPlan = {
  captionSafeReference: "youtube_shorts_safe_frame_v1",
  recommendedCaptionMarginV: ytProfile.recommendedCaptionMarginV,
  style: "single_line_bold_bottom_safe",
  oneLinePolicy: true,
  oneLineMaxChars: CAPTION_ONE_LINE_MAX,
  ellipsisTruncationForbidden: true,
  compressionStrategy: "deterministic_short_render_caption_per_script_part",
  captionCompressions,
  allRenderCaptionsOneLine: fullEventTimeline.every((e) => captionChars(e.caption) <= CAPTION_ONE_LINE_MAX),
  captionLinesRef: "money-shorts-retention-script-compiler.output.v1.json caption_plan",
};

// ── timeline audit ──────────────────────────────────────────────────────────
const totalEvents = fullEventTimeline.length;
const first5sEvents = fullEventTimeline.filter((e) => e.time_start < 5).length;
const maxStatic = Math.max(...fullEventTimeline.map((e) => e.duration));
const timelineStart = Math.min(...fullEventTimeline.map((e) => e.time_start));
const timelineEnd = Math.max(...fullEventTimeline.map((e) => e.time_end));

// ── manifest ──────────────────────────────────────────────────────────────────
const manifest = {
  schemaVersion: "money_shorts_creative_final_visual_render_manifest_v1",
  status: "data_only_final_visual_render_manifest",
  visualOnly: true,
  isFinalUploadReadyVideo: false,
  previewIsDevelopmentOnly: false,
  fullThirtySecondRender: true,
  sourceRefs: {
    contract: "scripts/fixtures/money-shorts-creative-quality-contract.v1.json",
    scriptCompilerOutput: "scripts/fixtures/money-shorts-retention-script-compiler.output.v1.json",
    sceneEventPlannerOutput: "scripts/fixtures/money-shorts-scene-event-planner.output.v1.json",
    qualityScorerOutput: "scripts/fixtures/money-shorts-quality-scorer.output.v1.json",
    creativeJobManifest: "scripts/fixtures/money-shorts-automation-job.creative-layer-base-rate-202605.v1.json",
    selectedImageSet: "scripts/fixtures/premium-editorial-scene-selected-image-set.v1.json",
    platformRenderProfiles: "scripts/fixtures/premium-editorial-platform-render-profiles.v1.json",
  },
  selectedTopicId,
  selectedCandidateId,
  qualityScorerDecision: decision,
  hardFailReasonCount: hardFailCount,
  fullDurationSec: FULL_SEC,
  canvas: { widthPx: 1080, heightPx: 1920 },
  fps: 30,
  targetPlatformProfile: "youtube_shorts_safe_frame_v1",
  actualImageInputs,
  fullEventTimeline,
  eventTimelineAudit: {
    totalVisualEvents: totalEvents,
    first5sEventCount: first5sEvents,
    maxStaticDuration: round2(maxStatic),
    timelineStartSec: round2(timelineStart),
    timelineEndSec: round2(timelineEnd),
    coversFullDuration: round2(timelineStart) === 0 && round2(timelineEnd) === FULL_SEC,
    isFullNotPreviewSubset: totalEvents >= VEC.totalVisualEventMin,
  },
  captionPlan,
  motionPlan: {
    motionTemplatesUsed: [...new Set(fullEventTimeline.map((e) => e.motion_template))],
    rendererSupportedV1: [...RENDERER_SUPPORTED_V1],
  },
  fallbackPolicy: {
    unsupportedTemplateReplacedWithFallback: true,
    fallbackTemplatesApplied,
    fallbackRecordedNotSilentlyDropped: true,
    silentFallbackForbidden: true,
  },
  audioPolicy: {
    audioRendered: false,
    ttsRendered: false,
    sfxRendered: false,
    requiresTtsSoundMuxBeforeUpload: true,
    uploadReady: false,
    note: "이 render는 visual-only candidate다. TTS/SFX/mux 전 단계이므로 uploadReady=false. upload queue readiness는 TTS/SFX/mux 이후에 판단한다.",
  },
  outputPaths: {
    outDir: OUT_DIR,
    finalVisualMp4: join(OUT_DIR, "money-shorts-creative-final-visual-youtube-safe-frame-v1.mp4"),
    renderReport: join(OUT_DIR, "creative-final-visual-render-report.json"),
  },
  boundary: {
    visualOnly: true,
    noAudioNoTtsNoSfx: true,
    noUploadOrPublish: true,
    noImageGeneration: true,
    noExistingFinalVideoOverwrite: true,
    localFfmpegRenderOnly: true,
    dataOnlyManifest: true,
  },
};

writeFileSync(OUTPUT_PATH, JSON.stringify(manifest, null, 2) + "\n", "utf8");

console.log("── CREATIVE FINAL VISUAL RENDER MANIFEST v1 (data-only) ──");
console.log(`  selected topic: ${selectedTopicId} / candidate: ${selectedCandidateId} / decision: ${decision} / hardFail: ${hardFailCount}`);
console.log(`  FULL event timeline: ${totalEvents} events (0 -> ${timelineEnd}s), first5s=${first5sEvents}, maxStatic=${round2(maxStatic)}s`);
console.log(`  motion templates: ${manifest.motionPlan.motionTemplatesUsed.join(",")}`);
console.log(`  fallback applied: ${fallbackTemplatesApplied.length}`);
console.log(`  visualOnly=true uploadReady=false requiresTtsSoundMuxBeforeUpload=true`);
console.log(`  out-dir: ${OUT_DIR}`);
console.log(`  manifest written: ${OUTPUT_PATH}`);
process.exit(0);
