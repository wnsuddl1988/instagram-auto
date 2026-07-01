#!/usr/bin/env node
// ──────────────────────────────────────────────────────────────────────────
// build-premium-editorial-selected-image-render-manifest-caption-v3.mjs
//
// SELECTED IMAGE RENDER MANIFEST — CAPTION v3 — DATA-ONLY (no execution, no render)
//
// v2 render manifest 대비 변화 (selected image 6장은 그대로 유지):
//   - caption 문구를 v3로 교체 (더 짧고 임팩트 있는 한 줄, TTS v3 script의 captionText 소비)
//   - outputSpec.captionFontSize = 104 (v2 84 → v3 104, Owner 체감상 확실히 크게)
//   - outputSpec.captionOutline = 6 (v1/v2 default 4 → 강화)
//   - outputSpec.captionShadow = 3 (v1/v2 default 2 → 강화)
//   - outputSpec.captionMarginV = 130 (safe zone 유지, 폰트 확대에 맞춰 살짝 상향)
//   - caption은 모두 한 줄. newline / \N / 강제 줄바꿈 금지 (여기서 검증).
//
// CAPTION POLICY 변경 (v3): sourceFact.currentValueText(=2.5%)와 정확히 일치하는
//   deterministic core value 하나는 caption에 허용한다. 날짜(YYYY-MM-DD)/출처 라벨은 여전히 금지.
//   이유: 2.5%는 영상 주제의 핵심 수치이며 sourceFact와 결정적으로 일치하므로 overlay가 소유해도 안전.
//
// 이 빌더는 이미지 재생성/렌더/mux를 하지 않는다. selected image set은 변경하지 않는다.
//
// source:
//   1) scripts/fixtures/premium-editorial-scene-selected-image-set.v1.json (assetPath source)
//   2) scripts/fixtures/provider-candidate-tts-script.yohan-koo.ecos-live-draft.voice-v3.json (v3 caption source)
// output:
//   scripts/fixtures/premium-editorial-selected-image-render-manifest.caption-v3.json
// ──────────────────────────────────────────────────────────────────────────

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..");

const SELECTED_SET_PATH = join(REPO_ROOT, "scripts", "fixtures", "premium-editorial-scene-selected-image-set.v1.json");
const TTS_V3_PATH = join(REPO_ROOT, "scripts", "fixtures", "provider-candidate-tts-script.yohan-koo.ecos-live-draft.voice-v3.json");
const OUTPUT_PATH = join(REPO_ROOT, "scripts", "fixtures", "premium-editorial-selected-image-render-manifest.caption-v3.json");

const CAPTION_FONT_SIZE = 104;
const CAPTION_OUTLINE = 6;
const CAPTION_SHADOW = 3;
const CAPTION_MARGIN_V = 130;

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

// ── load TTS v3 script (v3 caption source) ──────────────────────────────────
const ttsV3 = JSON.parse(readFileSync(TTS_V3_PATH, "utf8"));
const ttsScenes = new Map((ttsV3.scenes || []).map((s) => [s.sceneNumber, s]));

// deterministic core value (허용): sourceFact.currentValueText 와 정확히 일치하는 값만.
const ALLOWED_CORE_VALUE = (ttsV3.sourceFact?.currentValueText || "").trim(); // e.g. "2.5%"

// ── duration 구조 유지 (4+5+6+6+4+5=30) ─────────────────────────────────────
const DURATIONS_SEC = [4, 5, 6, 6, 4, 5];
const TOTAL_DURATION_SEC = DURATIONS_SEC.reduce((a, b) => a + b, 0);

// ── 금지 패턴: 날짜(YYYY-MM-DD), 연도라벨(202X년), %p 변화량, 여러 자리 수치 조합 ──
// 단, ALLOWED_CORE_VALUE(=2.5%)는 caption에서 제거 후 나머지에 대해서만 검사한다.
const FORBIDDEN_PATTERN = /\d{4}-\d{2}-\d{2}|202\d년|\d+%p|\d{1,3}\.\d+%|\d{2,}%/;

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

// ── captionOverlays 구성 (v3 caption, 한 줄, timing contiguous) ─────────────
let capCursor = 0;
const captionOverlays = selectedScenes.map((s, idx) => {
  const durationSec = DURATIONS_SEC[idx];
  const showAtSec = capCursor;
  const hideAtSec = capCursor + durationSec;
  capCursor = hideAtSec;

  const ttsScene = ttsScenes.get(s.sceneOrder);
  const captionText = (ttsScene?.captionText || "").trim();

  if (!captionText) {
    console.error(`FATAL: scene ${s.sceneOrder}에 대한 v3 caption(captionText)이 TTS v3 script에 없음`);
    process.exit(2);
  }
  // one-line 강제: 개행/강제 줄바꿈 금지
  if (/[\r\n]/.test(captionText) || /\\N|\\n/.test(captionText)) {
    console.error(`FATAL: scene ${s.sceneOrder} caption에 강제 줄바꿈이 있음 — 한 줄만 허용`);
    process.exit(2);
  }
  // ALLOWED_CORE_VALUE(=2.5%)는 허용 → 제거 후 나머지에서 금지 패턴 검사
  const captionWithoutCoreValue = ALLOWED_CORE_VALUE
    ? captionText.split(ALLOWED_CORE_VALUE).join("")
    : captionText;
  if (FORBIDDEN_PATTERN.test(captionWithoutCoreValue)) {
    console.error(`FATAL: scene ${s.sceneOrder} caption에 금지된 날짜/출처/추가 수치 패턴이 있음: "${captionText}"`);
    process.exit(2);
  }

  const containsCoreValue = ALLOWED_CORE_VALUE ? captionText.includes(ALLOWED_CORE_VALUE) : false;

  return {
    sceneId: s.sceneId,
    sceneIndex: s.sceneOrder,
    captionText,
    captionCharCount: captionText.length,
    containsAllowedCoreValue: containsCoreValue,
    showAtSec,
    hideAtSec,
    captionStyle: "bold_short_center_lower_v3",
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

// ── output spec: v2와 동일 + fontSize 104 + outline/shadow/marginV 강화 ──────
const outputSpec = {
  codec: "h264",
  container: "mp4",
  crf: 23,
  fps: 30,
  dimensions: { widthPx: 1080, heightPx: 1920 },
  audioMode: "silent_visual_only",
  captionFontSize: CAPTION_FONT_SIZE,
  captionOutline: CAPTION_OUTLINE,
  captionShadow: CAPTION_SHADOW,
  captionMarginV: CAPTION_MARGIN_V,
  plannedOutputPath: "premium-editorial-selected-image-visual-only-caption-v3.mp4",
};

const executionBoundaries = {
  imageGenerationExecuted: false,
  imageRegenerationExecuted: false,
  networkExecuted: false,
  renderExecuted: false,
  audioMuxExecuted: false,
  uploadExecuted: false,
  note: "이 manifest는 caption v3 visual-only silent mp4 렌더 계획을 data-only로 기록한다. selected image는 변경하지 않고 caption 문구/폰트/아웃라인만 v3로 갱신한다.",
};

const overlayPolicySummary = {
  exactValuesInImage: false,
  deterministicOverlayOwnsExactValues: true,
  captionsContainNoDatesSources: true,
  allowedCoreValueInCaption: ALLOWED_CORE_VALUE,
  captionsAreSingleLine: true,
  note: `caption v3는 한 줄 문구만 사용한다. sourceFact.currentValueText(=${ALLOWED_CORE_VALUE})와 정확히 일치하는 deterministic core value 하나는 허용하나 날짜/출처/추가 수치는 금지한다.`,
};

const manifestAudit = {
  description: "Caption v3 render manifest가 selected image set(v1) + TTS v3 caption을 소비한 결과 요약.",
  sceneCount: imageInputs.length,
  sceneOrders: imageInputs.map((i) => i.sceneIndex),
  totalDurationSec: TOTAL_DURATION_SEC,
  durationsSec: DURATIONS_SEC,
  captionFontSize: CAPTION_FONT_SIZE,
  captionOutline: CAPTION_OUTLINE,
  captionShadow: CAPTION_SHADOW,
  captionMarginV: CAPTION_MARGIN_V,
  scene2UsesRetry: imageInputs.find((i) => i.sceneIndex === 2)?.sourceRun === "retry_01",
  allAssetPathsExistLocally: assetExistence.every((a) => a.exists),
  captionCount: captionOverlays.length,
  allCaptionsSingleLine: captionOverlays.every((c) => !/[\r\n]/.test(c.captionText) && !/\\N|\\n/.test(c.captionText)),
  maxCaptionCharCount: Math.max(...captionOverlays.map((c) => c.captionCharCount)),
  captionTimingContiguous: captionOverlays.every((c, idx) => idx === 0 || c.showAtSec === captionOverlays[idx - 1].hideAtSec),
  allowedCoreValueScenes: captionOverlays.filter((c) => c.containsAllowedCoreValue).map((c) => c.sceneIndex),
};

const renderManifest = {
  schemaVersion: "money_shorts_selected_image_render_manifest_v1",
  status: "data_only_render_plan_visual_only",
  title: "Money Shorts OS — Selected Image Visual-Only Render Manifest (Caption v3)",
  purpose: "selected image set(v1)의 Scene 1~6 실제 이미지를 그대로 사용하되 caption 문구를 v3로 교체하고 captionFontSize를 104로 상향(outline/shadow 강화)한 visual-only 렌더 계획. selected image 변경 없음, 렌더 실행 아님.",
  supersedes: {
    manifest: "scripts/fixtures/premium-editorial-selected-image-render-manifest.caption-v2.json",
    reason: "caption v3 correction: v2 fontSize 84가 Owner 체감상 부족 → 104로 상향, outline/shadow 강화. caption 문구를 더 짧게 교체하고 sourceFact 핵심값 2.5%를 S2 caption에 허용. selected image/assetPath는 동일 유지.",
  },
  sourceRefs: {
    selectedImageSet: {
      path: "scripts/fixtures/premium-editorial-scene-selected-image-set.v1.json",
      schemaVersion: selectedSet.schemaVersion,
    },
    ttsScriptV3: {
      path: "scripts/fixtures/provider-candidate-tts-script.yohan-koo.ecos-live-draft.voice-v3.json",
      scriptId: ttsV3.scriptId,
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

console.log(`✅ Caption v3 render manifest written: ${OUTPUT_PATH}`);
console.log(`   captionFontSize: ${CAPTION_FONT_SIZE}, outline: ${CAPTION_OUTLINE}, shadow: ${CAPTION_SHADOW}, marginV: ${CAPTION_MARGIN_V}`);
console.log(`   captions: ${captionOverlays.map((c) => `s${c.sceneIndex}(${c.captionCharCount}자)`).join(", ")}`);
console.log(`   maxCaptionCharCount: ${manifestAudit.maxCaptionCharCount}`);
console.log(`   allowedCoreValue: ${ALLOWED_CORE_VALUE}, scenes: [${manifestAudit.allowedCoreValueScenes.join(",")}]`);
console.log(`   allCaptionsSingleLine: ${manifestAudit.allCaptionsSingleLine}`);
console.log(`   scene2UsesRetry: ${manifestAudit.scene2UsesRetry}, allAssetPathsExistLocally: ${manifestAudit.allAssetPathsExistLocally}`);
