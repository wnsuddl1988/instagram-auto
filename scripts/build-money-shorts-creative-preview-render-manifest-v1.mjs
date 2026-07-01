#!/usr/bin/env node
// ──────────────────────────────────────────────────────────────────────────
// build-money-shorts-creative-preview-render-manifest-v1.mjs
//
// MONEY SHORTS OS — CREATIVE PREVIEW RENDER MANIFEST BUILDER v1 (data-only)
//
// Phase 1~4 산출물 + selected image set + platform render profile을 소비해,
// 12초 개발용 preview(before/after) 렌더 manifest를 생성한다.
// 이 builder는 데이터만 만든다 — ffmpeg/이미지/TTS/업로드를 실행하지 않는다.
//
// Preview는 개발용이며 운영 필수 검수 단계가 아니다.
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
const IMAGESET_PATH = F("premium-editorial-scene-selected-image-set.v1.json");
const PROFILE_PATH = F("premium-editorial-platform-render-profiles.v1.json");
const OUTPUT_PATH = F("money-shorts-creative-preview-render-manifest.v1.json");

const OUT_DIR = "C:\\tmp\\money-shorts-os\\creative-preview-renderer-v1";

// ── source of truth load (read-only) ─────────────────────────────────────────
const contract = JSON.parse(readFileSync(CONTRACT_PATH, "utf8"));
const scriptOut = JSON.parse(readFileSync(SCRIPT_PATH, "utf8"));
const plannerOut = JSON.parse(readFileSync(PLANNER_PATH, "utf8"));
const scorerOut = JSON.parse(readFileSync(SCORER_PATH, "utf8"));
const imageSet = JSON.parse(readFileSync(IMAGESET_PATH, "utf8"));
const profiles = JSON.parse(readFileSync(PROFILE_PATH, "utf8"));

const PREVIEW_SEC = 12;
const ytProfile = profiles.platformProfiles.youtube_shorts;
const REGISTRY = contract.rendererTemplateRegistry;
const supportedMotion = new Set(REGISTRY.motion.filter((m) => m.renderer_support).map((m) => m.id));
const fallbackById = new Map(REGISTRY.motion.map((m) => [m.id, m.fallback_template]));

// renderer v1 이 실제 시각적으로 구현하는 motion template (나머지는 fallback)
const RENDERER_SUPPORTED_V1 = new Set([
  "push_in", "pull_out", "pan_left", "pan_right", "freeze_punch",
  "number_countup", "checklist_pop", "red_box", "arrow_reveal", "final_card",
]);

// ── select render-ready topic from quality scorer ────────────────────────────
const renderTopic = scorerOut.topics.find((t) => t.qualityReport.final_decision === "render");
if (!renderTopic) {
  console.error("ABORT: no render-ready topic in quality scorer output.");
  process.exit(1);
}
const selectedTopicId = renderTopic.topicId;
const selectedCandidateId = renderTopic.selectedCandidate.candidateId;

const plannerTopic = plannerOut.topics.find((t) => t.topicId === selectedTopicId);
const scriptTopic = scriptOut.topics.find((t) => t.topicId === selectedTopicId);
const scriptCand = scriptTopic.candidates.find((c) => c.candidateId === scriptTopic.selectedCandidateId);

// ── map planner source_image (image_01..06) → selected image set scene ───────
// selectedScenes are ordered by sceneOrder 1..6 → image_0N maps to sceneOrder N.
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
  imagePath: s.imagePath, // repo-relative, preserved
  declaredLocalFileExists: s.localFileExists === true,
}));

// ── BEFORE timeline: static-ish baseline (first 3 images, long holds) ────────
// 12s / 3 images = 4s each (well over the 2.2s static threshold → "static" baseline).
const beforeImages = imageSet.selectedScenes.slice(0, 3);
const beforeHold = PREVIEW_SEC / beforeImages.length;
const beforeTimeline = beforeImages.map((s, i) => ({
  index: i,
  time_start: Math.round(i * beforeHold * 100) / 100,
  time_end: Math.round((i + 1) * beforeHold * 100) / 100,
  duration: Math.round(beforeHold * 100) / 100,
  source_image: `image_0${s.sceneOrder}`,
  imagePath: s.imagePath,
  motion_template: "none", // static hold — baseline intentionally has no motion
  caption: "",
}));

// ── AFTER timeline: planner events within first 12s ──────────────────────────
const allEvents = plannerTopic.scenePlan.scenes.flatMap((s) => s.events);
const first12 = allEvents.filter((e) => e.time_start < PREVIEW_SEC);
const fallbackTemplatesApplied = [];
const afterEventTimeline = first12.map((e) => {
  let motion = e.motion_template;
  let fallbackApplied = false;
  if (!RENDERER_SUPPORTED_V1.has(motion)) {
    const fb = fallbackById.get(motion) || "push_in";
    fallbackTemplatesApplied.push({ event_id: e.event_id, requested: motion, fallback: fb });
    motion = RENDERER_SUPPORTED_V1.has(fb) ? fb : "push_in";
    fallbackApplied = true;
  }
  return {
    event_id: e.event_id,
    time_start: e.time_start,
    time_end: Math.min(e.time_end, PREVIEW_SEC),
    duration: Math.round((Math.min(e.time_end, PREVIEW_SEC) - e.time_start) * 100) / 100,
    script_part: e.script_part,
    intent: e.intent,
    source_image: e.source_image,
    imagePath: imagePathForSourceImage(e.source_image),
    motion_template: motion,
    fallbackApplied,
    caption: e.caption || "",
    overlay: e.overlay,
    sfx: e.sfx,
    safe_frame_ref: e.safe_frame_ref,
  };
});

// ── caption plan (single-line, safe-frame) ───────────────────────────────────
const captionPlan = {
  captionSafeReference: "youtube_shorts_safe_frame_v1",
  recommendedCaptionMarginV: ytProfile.recommendedCaptionMarginV,
  style: "single_line_bold_bottom_safe",
  oneLinePolicy: true,
  autoTruncateIfTwoLines: true,
  captionLinesRef: "money-shorts-retention-script-compiler.output.v1.json caption_plan",
};

// ── sound plan (planned only; audio not rendered in v1) ──────────────────────
const soundPlan = {
  sfxPlannedCount: first12.filter((e) => e.sfx && e.sfx !== "none").length,
  sfxPlannedButAudioNotRendered: true,
  audioRendered: false,
  note: "Phase 5 preview는 TTS/SFX 오디오를 렌더하지 않는다. sfx plan은 report에만 기록.",
};

// ── manifest ──────────────────────────────────────────────────────────────────
const manifest = {
  schemaVersion: "money_shorts_creative_preview_render_manifest_v1",
  status: "data_only_preview_manifest",
  previewIsDevelopmentOnly: true,
  operationalRequiredReview: false,
  sourceRefs: {
    contract: "scripts/fixtures/money-shorts-creative-quality-contract.v1.json",
    scriptCompilerOutput: "scripts/fixtures/money-shorts-retention-script-compiler.output.v1.json",
    sceneEventPlannerOutput: "scripts/fixtures/money-shorts-scene-event-planner.output.v1.json",
    qualityScorerOutput: "scripts/fixtures/money-shorts-quality-scorer.output.v1.json",
    selectedImageSet: "scripts/fixtures/premium-editorial-scene-selected-image-set.v1.json",
    platformRenderProfiles: "scripts/fixtures/premium-editorial-platform-render-profiles.v1.json",
  },
  selectedTopicId,
  selectedCandidateId,
  previewDurationSec: PREVIEW_SEC,
  canvas: { widthPx: 1080, heightPx: 1920 },
  targetPlatformProfile: "youtube_shorts_safe_frame_v1",
  actualImageInputs,
  beforeTimeline,
  afterEventTimeline,
  captionPlan,
  motionPlan: {
    motionTemplatesUsedAfter: [...new Set(afterEventTimeline.map((e) => e.motion_template))],
    motionTemplatesUsedBefore: [...new Set(beforeTimeline.map((e) => e.motion_template))],
    rendererSupportedV1: [...RENDERER_SUPPORTED_V1],
  },
  soundPlan,
  fallbackPolicy: {
    unsupportedTemplateReplacedWithFallback: true,
    fallbackTemplatesApplied,
    fallbackRecordedNotSilentlyDropped: true,
  },
  outputPaths: {
    outDir: OUT_DIR,
    beforeMp4: join(OUT_DIR, "preview_before.mp4"),
    afterMp4: join(OUT_DIR, "preview_after.mp4"),
    qualityReport: join(OUT_DIR, "preview_quality_report.json"),
  },
  boundary: {
    previewIsDevelopmentOnly: true,
    noUploadOrPublish: true,
    noImageGeneration: true,
    noTtsGeneration: true,
    noExistingFinalVideoOverwrite: true,
    localFfmpegRenderOnly: true,
    dataOnlyManifest: true,
  },
};

writeFileSync(OUTPUT_PATH, JSON.stringify(manifest, null, 2) + "\n", "utf8");

console.log("── CREATIVE PREVIEW RENDER MANIFEST v1 (data-only) ──");
console.log(`  selected topic: ${selectedTopicId} / candidate: ${selectedCandidateId}`);
console.log(`  before timeline: ${beforeTimeline.length} static holds (${beforeHold}s each)`);
console.log(`  after event timeline: ${afterEventTimeline.length} events in first ${PREVIEW_SEC}s`);
console.log(`  after motion templates: ${manifest.motionPlan.motionTemplatesUsedAfter.join(",")}`);
console.log(`  fallback applied: ${fallbackTemplatesApplied.length}`);
console.log(`  actual images: ${actualImageInputs.length} (repo-relative paths preserved)`);
console.log(`  out-dir: ${OUT_DIR}`);
console.log(`  manifest written: ${OUTPUT_PATH}`);
process.exit(0);
