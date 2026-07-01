#!/usr/bin/env node
// ──────────────────────────────────────────────────────────────────────────
// build-premium-editorial-selected-image-render-manifest-v1.mjs
//
// SELECTED IMAGE RENDER MANIFEST v1 — DATA-ONLY (no execution, no render)
//
// 이 빌더는 selected image set manifest(v1)를 유일한 source of truth로 소비해
// visual-only render manifest를 생성한다. Scene 1~6 각각의 assetPath는 selected
// image set의 imagePath를 그대로 사용한다 (Scene 2는 retry-01, first-run 원본 금지).
//
// 이 빌더는 다음을 하지 않는다 (boundary 준수):
//   - 이미지 생성/재생성, ffmpeg 실행, mp4 렌더
//   - ChatGPT / Playwright / OpenAI 실행 또는 import
//   - fetch / http / https / child_process / node-fetch 사용
//   - audio mux, upload
//
// source:
//   scripts/fixtures/premium-editorial-scene-selected-image-set.v1.json
// output:
//   scripts/fixtures/premium-editorial-selected-image-render-manifest.v1.json
// ──────────────────────────────────────────────────────────────────────────

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..");

const SELECTED_SET_PATH = join(REPO_ROOT, "scripts", "fixtures", "premium-editorial-scene-selected-image-set.v1.json");
const OUTPUT_PATH = join(REPO_ROOT, "scripts", "fixtures", "premium-editorial-selected-image-render-manifest.v1.json");

// ── load selected image set (유일한 source of truth) ────────────────────────
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

// ── duration 구조: 기존 30초 구조(4+5+6+6+4+5)를 scene order 1~6에 적용 ──────
const DURATIONS_SEC = [4, 5, 6, 6, 4, 5];
const TOTAL_DURATION_SEC = DURATIONS_SEC.reduce((a, b) => a + b, 0);

// ── caption text: sceneRole 의도를 짧은 생활경제 톤 문구로 표현 (exact 수치/날짜/출처 없음) ──
// 실제 정확 수치/날짜/출처는 deterministic overlay가 별도로 담당 — 여기서는 생성하지 않는다.
const CAPTION_BY_ROLE = {
  scene_1_hook: "경제 신호, 내 생활에 닿는 순간",
  scene_2_signal: "핵심 신호는 어디서 어떻게 잡힐까",
  scene_3_context: "물가와 가계 흐름을 함께 보면",
  scene_4_life_impact: "대출자·예금자에게 다르게 닿는 접점",
  scene_5_watch_point: "지금 확인해야 할 체크포인트",
  scene_6_action_closing: "이번 달, 이것부터 점검하기",
};

// ── imageInputs 구성 (selectedScenes 6개와 1:1 대응) ────────────────────────
let cursorSec = 0;
const imageInputs = selectedScenes.map((s, idx) => {
  const durationSec = DURATIONS_SEC[idx];
  const entry = {
    sceneId: s.sceneId,
    sceneIndex: s.sceneOrder,
    sceneRole: s.sceneRole,
    assetPath: s.imagePath,
    assetSourceType: "selected_generated_image",
    sourceRun: s.sourceRun,
    durationSec,
    motionType: "static_hold",
  };
  cursorSec += durationSec;
  return entry;
});

// ── captionOverlays 구성 (imageInputs와 동일 timing, gap/overlap 없음) ──────
let capCursor = 0;
const captionOverlays = selectedScenes.map((s, idx) => {
  const durationSec = DURATIONS_SEC[idx];
  const showAtSec = capCursor;
  const hideAtSec = capCursor + durationSec;
  capCursor = hideAtSec;
  return {
    sceneId: s.sceneId,
    sceneIndex: s.sceneOrder,
    captionText: CAPTION_BY_ROLE[s.sceneRole] || s.sceneRole,
    showAtSec,
    hideAtSec,
    captionStyle: "bold_short_center_lower",
  };
});

// ── assetPath 로컬 존재 재확인 (build 시점 기준) ─────────────────────────────
const assetExistence = imageInputs.map((i) => ({
  sceneIndex: i.sceneIndex,
  assetPath: i.assetPath,
  exists: existsSync(join(REPO_ROOT, i.assetPath)),
}));
if (assetExistence.some((a) => !a.exists)) {
  console.error("FATAL: 다음 assetPath가 로컬에 존재하지 않음:");
  for (const a of assetExistence.filter((x) => !x.exists)) {
    console.error(`  scene ${a.sceneIndex}: ${a.assetPath}`);
  }
  process.exit(2);
}

// ── output spec: visual-only/silent, 1080x1920, fps 30, h264/mp4 ───────────
const outputSpec = {
  codec: "h264",
  container: "mp4",
  crf: 23,
  fps: 30,
  dimensions: { widthPx: 1080, heightPx: 1920 },
  audioMode: "silent_visual_only",
  plannedOutputPath: "premium-editorial-selected-image-visual-only-v1.mp4",
};

// ── execution boundaries: render는 visual-only만 허용, mux/upload는 false ──
const executionBoundaries = {
  imageGenerationExecuted: false,
  imageRegenerationExecuted: false,
  networkExecuted: false,
  renderExecuted: false,
  audioMuxExecuted: false,
  uploadExecuted: false,
  note: "이 manifest는 visual-only silent mp4 렌더 계획을 data-only로 기록한다. 렌더 자체는 별도 renderer 스크립트 실행 시에만 수행되며, audio mux/upload는 이 라인에서 전혀 수행하지 않는다.",
};

const overlayPolicySummary = {
  exactValuesInImage: false,
  deterministicOverlayOwnsExactValues: true,
  captionsContainNoExactNumbersDatesSources: true,
  note: "captionOverlays는 생활경제 톤의 짧은 문구만 사용하며 정확 수치/퍼센트/날짜/출처 라벨을 포함하지 않는다. 그러한 값은 후속 deterministic overlay 단계가 소유한다.",
};

const manifestAudit = {
  description: "Selected image render manifest가 selected image set(v1)을 소비해 visual-only render 계획을 구성한 결과 요약. static guard가 assetPath/order/timing 정합성을 대조한다.",
  sceneCount: imageInputs.length,
  sceneOrders: imageInputs.map((i) => i.sceneIndex),
  totalDurationSec: TOTAL_DURATION_SEC,
  durationsSec: DURATIONS_SEC,
  scene2UsesRetry: imageInputs.find((i) => i.sceneIndex === 2)?.sourceRun === "retry_01",
  allAssetPathsExistLocally: assetExistence.every((a) => a.exists),
  captionCount: captionOverlays.length,
  captionTimingContiguous: captionOverlays.every((c, idx) => idx === 0 || c.showAtSec === captionOverlays[idx - 1].hideAtSec),
};

// ── assemble render manifest ─────────────────────────────────────────────────
const renderManifest = {
  schemaVersion: "money_shorts_selected_image_render_manifest_v1",
  status: "data_only_render_plan_visual_only",
  title: "Money Shorts OS — Selected Image Visual-Only Render Manifest v1",
  purpose: "selected image set(v1)의 Scene 1~6 실제 생성 이미지를 소비해 visual-only silent mp4 렌더 계획을 data-only로 구성한 결과. 이미지 재생성/네트워크/렌더 실행/audio mux/업로드 아님.",
  sourceRefs: {
    selectedImageSet: {
      path: "scripts/fixtures/premium-editorial-scene-selected-image-set.v1.json",
      schemaVersion: selectedSet.schemaVersion,
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

console.log(`✅ Selected image render manifest written: ${OUTPUT_PATH}`);
console.log(`   imageInputs: ${imageInputs.map((i) => `scene${i.sceneIndex}(${i.sourceRun}, ${i.durationSec}s)`).join(", ")}`);
console.log(`   totalDurationSec: ${TOTAL_DURATION_SEC}`);
console.log(`   scene2UsesRetry: ${manifestAudit.scene2UsesRetry}`);
console.log(`   allAssetPathsExistLocally: ${manifestAudit.allAssetPathsExistLocally}`);
console.log(`   captionTimingContiguous: ${manifestAudit.captionTimingContiguous}`);
console.log(`   executionBoundaries: renderExecuted=${executionBoundaries.renderExecuted}, audioMuxExecuted=${executionBoundaries.audioMuxExecuted}, uploadExecuted=${executionBoundaries.uploadExecuted}`);
