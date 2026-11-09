#!/usr/bin/env node
// ──────────────────────────────────────────────────────────────────────────
// build-premium-editorial-selected-image-render-manifest-caption-v2.mjs
//
// SELECTED IMAGE RENDER MANIFEST — CAPTION v2 — DATA-ONLY (no execution, no render)
//
// v1 render manifest 대비 변화 (selected image 6장은 그대로 유지):
//   - caption 문구를 v2로 교체 (짧고 임팩트 있는 한 줄, TTS v2 script의 captionText 소비)
//   - outputSpec.captionFontSize = 84 (쇼츠 가독성 상향; v1은 renderer default 72)
//   - caption은 모두 한 줄. newline / \N / 강제 줄바꿈 금지 (여기서 검증).
//   - 정확 수치/날짜/출처 라벨은 caption에 새로 넣지 않는다.
//
// 이 빌더는 이미지 재생성/렌더/mux를 하지 않는다. selected image set은 변경하지 않는다.
//
// source:
//   1) scripts/fixtures/premium-editorial-scene-selected-image-set.v1.json (assetPath source)
//   2) scripts/fixtures/provider-candidate-tts-script.yohan-koo.ecos-live-draft.voice-v2.json (v2 caption source)
// output:
//   scripts/fixtures/premium-editorial-selected-image-render-manifest.caption-v2.json
// ──────────────────────────────────────────────────────────────────────────

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..");

const SELECTED_SET_PATH = join(REPO_ROOT, "scripts", "fixtures", "premium-editorial-scene-selected-image-set.v1.json");
const TTS_V2_PATH = join(REPO_ROOT, "scripts", "fixtures", "provider-candidate-tts-script.yohan-koo.ecos-live-draft.voice-v2.json");
const OUTPUT_PATH = join(REPO_ROOT, "scripts", "fixtures", "premium-editorial-selected-image-render-manifest.caption-v2.json");

const CAPTION_FONT_SIZE = 84;

// ── load selected image set (assetPath source of truth, 변경하지 않음) ──────
const selectedSet = JSON.parse(readFileSync(SELECTED_SET_PATH, "utf8"));
if (selectedSet.schemaVersion !== "money_shorts_scene_selected_image_set_v1") {
  console.error(`FATAL: selected image set schemaVersion 불일치 — ${selectedSet.schemaVersion}`);
  process.exit(2);
}
const selectedScenes = (selectedSet.selectedScenes || []).slice().sort((a, b) => a.sceneOrder - b.sceneOrder);
if (selectedScenes.length !== 6) {
  console.error(`FATAL: selectedScenes 기대값 6과 불일치 — 실제 ${selectedScenes.length}개`);
  process.exit(2);
}
const orders = selectedScenes.map((s) => s.sceneOrder);
if (JSON.stringify(orders) !== JSON.stringify([1, 2, 3, 4, 5, 6])) {
  console.error(`FATAL: selectedScenes order 불일치 — 기대 [1..6], 실제 [${orders.join(",")}]`);
  process.exit(2);
}

// ── load TTS v2 script (v2 caption source) ──────────────────────────────────
const ttsV2 = JSON.parse(readFileSync(TTS_V2_PATH, "utf8"));
const ttsScenes = new Map((ttsV2.scenes || []).map((s) => [s.sceneNumber, s]));

// ── duration 구조 유지 (4+5+6+6+4+5=30) ─────────────────────────────────────
const DURATIONS_SEC = [4, 5, 6, 6, 4, 5];
const TOTAL_DURATION_SEC = DURATIONS_SEC.reduce((a, b) => a + b, 0);

// ── exact number/date/source 패턴 (caption에 새로 넣으면 안 됨) ─────────────
const EXACT_VALUE_PATTERN = /\d{1,3}(\.\d+)?%|\d{4}-\d{2}-\d{2}|202\d년|\d+\.\d+%|\d+%p/;

// ── imageInputs 구성 (selectedScenes 6개 그대로, assetPath 유지) ────────────
const imageInputs = selectedScenes.map((s, idx) => ({
  sceneId: s.sceneId,
  sceneIndex: s.sceneOrder,
  sceneRole: s.sceneRole,
  assetPath: s.imagePath,
  assetSourceType: "selected_generated_image",
  sourceRun: s.sourceRun,
  durationSec: DURATIONS_SEC[idx],
  motionType: "static_hold",
}));

// ── captionOverlays 구성 (v2 caption, 한 줄, timing contiguous) ─────────────
let capCursor = 0;
const captionOverlays = selectedScenes.map((s, idx) => {
  const durationSec = DURATIONS_SEC[idx];
  const showAtSec = capCursor;
  const hideAtSec = capCursor + durationSec;
  capCursor = hideAtSec;

  const ttsScene = ttsScenes.get(s.sceneOrder);
  const captionText = (ttsScene?.captionText || "").trim();

  if (!captionText) {
    console.error(`FATAL: scene ${s.sceneOrder}에 대한 v2 caption(captionText)이 TTS v2 script에 없음`);
    process.exit(2);
  }
  // one-line 강제: 개행/강제 줄바꿈 금지
  if (/[\r\n]/.test(captionText) || /\\N|\\n/.test(captionText)) {
    console.error(`FATAL: scene ${s.sceneOrder} caption에 강제 줄바꿈이 있음 — 한 줄만 허용`);
    process.exit(2);
  }
  // exact number/date/source 금지
  if (EXACT_VALUE_PATTERN.test(captionText)) {
    console.error(`FATAL: scene ${s.sceneOrder} caption에 정확 수치/날짜/출처 패턴이 있음 — 금지: "${captionText}"`);
    process.exit(2);
  }

  return {
    sceneId: s.sceneId,
    sceneIndex: s.sceneOrder,
    captionText,
    captionCharCount: captionText.length,
    showAtSec,
    hideAtSec,
    captionStyle: "bold_short_center_lower_v2",
  };
});

// ── assetPath 로컬 존재 확인 ────────────────────────────────────────────────
const assetExistence = imageInputs.map((i) => ({
  sceneIndex: i.sceneIndex,
  assetPath: i.assetPath,
  exists: existsSync(join(REPO_ROOT, i.assetPath)),
}));
if (assetExistence.some((a) => !a.exists)) {
  console.error("FATAL: 다음 assetPath가 로컬에 존재하지 않음:");
  for (const a of assetExistence.filter((x) => !x.exists)) console.error(`  scene ${a.sceneIndex}: ${a.assetPath}`);
  process.exit(2);
}

// ── output spec: v1과 동일 + captionFontSize 84 추가 ────────────────────────
const outputSpec = {
  codec: "h264",
  container: "mp4",
  crf: 23,
  fps: 30,
  dimensions: { widthPx: 1080, heightPx: 1920 },
  audioMode: "silent_visual_only",
  captionFontSize: CAPTION_FONT_SIZE,
  plannedOutputPath: "premium-editorial-selected-image-visual-only-caption-v2.mp4",
};

const executionBoundaries = {
  imageGenerationExecuted: false,
  imageRegenerationExecuted: false,
  networkExecuted: false,
  renderExecuted: false,
  audioMuxExecuted: false,
  uploadExecuted: false,
  note: "이 manifest는 caption v2 visual-only silent mp4 렌더 계획을 data-only로 기록한다. selected image는 변경하지 않고 caption 문구/폰트만 v2로 갱신한다.",
};

const overlayPolicySummary = {
  exactValuesInImage: false,
  deterministicOverlayOwnsExactValues: true,
  captionsContainNoExactNumbersDatesSources: true,
  captionsAreSingleLine: true,
  note: "captionOverlays는 짧은 한 줄 v2 문구만 사용하며 정확 수치/날짜/출처 라벨을 포함하지 않는다.",
};

const manifestAudit = {
  description: "Caption v2 render manifest가 selected image set(v1) + TTS v2 caption을 소비한 결과 요약.",
  sceneCount: imageInputs.length,
  sceneOrders: imageInputs.map((i) => i.sceneIndex),
  totalDurationSec: TOTAL_DURATION_SEC,
  durationsSec: DURATIONS_SEC,
  captionFontSize: CAPTION_FONT_SIZE,
  scene2UsesRetry: imageInputs.find((i) => i.sceneIndex === 2)?.sourceRun === "retry_01",
  allAssetPathsExistLocally: assetExistence.every((a) => a.exists),
  captionCount: captionOverlays.length,
  allCaptionsSingleLine: captionOverlays.every((c) => !/[\r\n]/.test(c.captionText) && !/\\N|\\n/.test(c.captionText)),
  maxCaptionCharCount: Math.max(...captionOverlays.map((c) => c.captionCharCount)),
  captionTimingContiguous: captionOverlays.every((c, idx) => idx === 0 || c.showAtSec === captionOverlays[idx - 1].hideAtSec),
};

const renderManifest = {
  schemaVersion: "money_shorts_selected_image_render_manifest_v1",
  status: "data_only_render_plan_visual_only",
  title: "Money Shorts OS — Selected Image Visual-Only Render Manifest (Caption v2)",
  purpose: "selected image set(v1)의 Scene 1~6 실제 이미지를 그대로 사용하되 caption 문구를 v2로 교체하고 captionFontSize를 84로 상향한 visual-only 렌더 계획. selected image 변경 없음, 렌더 실행 아님.",
  supersedes: {
    manifest: "scripts/fixtures/premium-editorial-selected-image-render-manifest.v1.json",
    reason: "caption v2: 문구를 짧고 임팩트 있는 한 줄로 교체 + captionFontSize 84 상향(쇼츠 가독성). selected image/assetPath는 동일 유지.",
  },
  sourceRefs: {
    selectedImageSet: {
      path: "scripts/fixtures/premium-editorial-scene-selected-image-set.v1.json",
      schemaVersion: selectedSet.schemaVersion,
    },
    ttsScriptV2: {
      path: "scripts/fixtures/provider-candidate-tts-script.yohan-koo.ecos-live-draft.voice-v2.json",
      scriptId: ttsV2.scriptId,
    },
  },
  executionBoundaries,
  outputSpec,
  imageInputs,
  captionOverlays,
  overlayPolicySummary,
  manifestAudit,
};

writeFileSync(OUTPUT_PATH, JSON.stringify(renderManifest, null, 2) + "\n", "utf8");

console.log(`✅ Caption v2 render manifest written: ${OUTPUT_PATH}`);
console.log(`   captionFontSize: ${CAPTION_FONT_SIZE}`);
console.log(`   captions: ${captionOverlays.map((c) => `s${c.sceneIndex}(${c.captionCharCount}자)`).join(", ")}`);
console.log(`   maxCaptionCharCount: ${manifestAudit.maxCaptionCharCount}`);
console.log(`   allCaptionsSingleLine: ${manifestAudit.allCaptionsSingleLine}`);
console.log(`   scene2UsesRetry: ${manifestAudit.scene2UsesRetry}, allAssetPathsExistLocally: ${manifestAudit.allAssetPathsExistLocally}`);
