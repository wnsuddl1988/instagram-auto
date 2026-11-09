#!/usr/bin/env node
// ──────────────────────────────────────────────────────────────────────────
// build-premium-editorial-scene-selected-image-set-v1.mjs
//
// SCENE 1~6 SELECTED IMAGE SET — DATA-ONLY MANIFEST (no execution)
//
// 이 빌더는 v2 request pack의 sceneRole/category/objectFamilies와, Owner가
// 확정한 Scene 1~6 선택 이미지 경로를 묶어 data-only manifest를 생성한다.
// 다음 render 단계가 정확히 이 6장(및 정확히 이 verdict/warning)을 소비할 수
// 있도록 고정하는 것이 목적이다.
//
// 이 빌더는 다음을 하지 않는다 (boundary 준수):
//   - 이미지 생성 / ChatGPT / Playwright / OpenAI 실행 또는 import
//   - 렌더 / mp4 / mux / upload
//   - fetch / http / https / child_process / node-fetch 사용
//   - Scene 재생성
//
// 선택 근거 (Owner 확정):
//   - Scene 1,3,4,5: first_run 이미지 keep
//   - Scene 2: first_run 원본은 stock-photo/차트과다로 superseded, retry_01 채택 (경고 잔존)
//   - Scene 6: first_run 이미지 keep, planning motif 유사성 경고 잔존
//
// source:
//   1) scripts/fixtures/premium-editorial-scene-image-request-pack.v2.json (sceneRole/category/family/space/camera의 유일한 source of truth)
//   2) Owner 확정 선택 이미지 경로 (하드코딩된 6개 경로 — v2 pack에 이미지 경로 필드가 없으므로 이 목록만 여기서 고정)
// output:
//   scripts/fixtures/premium-editorial-scene-selected-image-set.v1.json
// ──────────────────────────────────────────────────────────────────────────

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..");

const V2_PACK_PATH = join(REPO_ROOT, "scripts", "fixtures", "premium-editorial-scene-image-request-pack.v2.json");
const OUTPUT_PATH = join(REPO_ROOT, "scripts", "fixtures", "premium-editorial-scene-selected-image-set.v1.json");

const OUTPUT_BASE_DIR = "output/money-shorts/scene-1-6-fullset-first-run-v1";

// ── load v2 pack (유일한 sceneRole/category/family source) ─────────────────
const pack = JSON.parse(readFileSync(V2_PACK_PATH, "utf8"));
if (pack.schemaVersion !== "money_shorts_scene_image_request_pack_v2") {
  console.error(`FATAL: v2 pack schemaVersion 불일치 — ${pack.schemaVersion}`);
  process.exit(2);
}
const packScenes = (pack.generationTargets || []).slice().sort((a, b) => a.sceneOrder - b.sceneOrder);
if (packScenes.length !== 6) {
  console.error(`FATAL: v2 pack generationTargets 기대값 6과 불일치 — 실제 ${packScenes.length}개`);
  process.exit(2);
}

// ── Owner 확정 선택 이미지 (order → 파일명 + sourceRun + verdict + warnings) ─
const SELECTION = {
  1: {
    fileName: "scene-01-scene_1_hook.png",
    sourceRun: "first_run",
    selectionVerdict: "keep",
    warnings: [],
    supersededPaths: [],
  },
  2: {
    fileName: "scene-02-scene_2_signal-retry-01.png",
    sourceRun: "retry_01",
    selectionVerdict: "keep_candidate",
    warnings: [
      "손에 든 종이에 라인차트+bar 영역이 잔존 — chart-only/dominance는 아니나 완전히 제거되지 않음.",
    ],
    supersededPaths: [`${OUTPUT_BASE_DIR}/scene-02-scene_2_signal.png`],
  },
  3: {
    fileName: "scene-03-scene_3_context.png",
    sourceRun: "first_run",
    selectionVerdict: "keep",
    warnings: [],
    supersededPaths: [],
  },
  4: {
    fileName: "scene-04-scene_4_life_impact.png",
    sourceRun: "first_run",
    selectionVerdict: "keep",
    warnings: [],
    supersededPaths: [],
  },
  5: {
    fileName: "scene-05-scene_5_watch_point.png",
    sourceRun: "first_run",
    selectionVerdict: "keep",
    warnings: [],
    supersededPaths: [],
  },
  6: {
    fileName: "scene-06-scene_6_action_closing.png",
    sourceRun: "first_run",
    selectionVerdict: "keep",
    warnings: [
      "Scene 5와 동일한 planning_objects(노트+펜 계획 모티프) 반복 — 2연속 한도 내 허용 범위, 구도/공간/그래픽 레이어는 분리됨.",
    ],
    supersededPaths: [],
  },
};

// ── selectedScenes 구성 (order 1~6, v2 pack을 유일한 source of truth로 사용) ─
const selectedScenes = packScenes.map((t) => {
  const sel = SELECTION[t.sceneOrder];
  if (!sel) {
    console.error(`FATAL: order ${t.sceneOrder}에 대한 SELECTION 항목 없음`);
    process.exit(2);
  }
  const imagePath = `${OUTPUT_BASE_DIR}/${sel.fileName}`;
  return {
    sceneOrder: t.sceneOrder,
    sceneId: t.sceneId,
    sceneRole: t.sceneRole,
    selectedVisualCategory: t.selectedVisualCategory,
    selectedObjectFamilies: t.selectedObjectFamilies,
    spaceType: t.spaceType,
    cameraDistance: t.cameraDistance,
    imagePath,
    sourceRun: sel.sourceRun,
    selectionVerdict: sel.selectionVerdict,
    warnings: sel.warnings,
    supersededPaths: sel.supersededPaths,
    localFileExists: existsSync(join(REPO_ROOT, imagePath)),
  };
});

// ── set-level 평가 ───────────────────────────────────────────────────────────
const visualRhythmEvaluation = {
  description: "Scene 1~6 선택 세트의 공간/카메라/톤 리듬 평가 (Owner 시각 QA 기반, 재판정 아님).",
  spaceTypeSequence: selectedScenes.map((s) => s.spaceType),
  cameraDistanceSequence: selectedScenes.map((s) => s.cameraDistance),
  rhythmAssessment:
    "현관(1, close_up) → 데스크(2, medium) → 주방(3, medium) → 도심(4, wide) → 데스크(5, medium) → 거실(6, medium)로 " +
    "공간과 카메라가 변주되며 생활공간 톤 일관성을 유지한다. Scene 2는 retry-01 채택으로 오피스 stock-photo 이질감이 해소되어 " +
    "세트 전체 리듬에 자연스럽게 편입된다.",
};

const repetitionConvergenceEvidence = {
  description: "우드테이블+손+스마트폰+노트+커피 수렴 조합 및 반복 수렴 여부 평가.",
  woodTableHandSmartphoneNotebookCoffeeConvergenceDetected: false,
  planningObjectsAdjacentRepeat: {
    scenes: [5, 6],
    withinAllowedLimit: true,
    compositionSeparationConfirmedInImage: true,
    note: "Scene 5(데스크 클립보드 체크리스트, top-down)와 Scene 6(거실 낮은 테이블 플래너, 어깨너머 시점)은 " +
      "공간/시점/그래픽 레이어가 실제 이미지에서 분리 확인됨. 오브젝트 패밀리(planning_objects) 유사성만 경고로 잔존.",
  },
};

const overlayPolicySummary = {
  exactValuesInImage: false,
  deterministicOverlayOwnsExactValues: true,
  note: "선택된 6장 이미지 어디에도 신뢰 가능한 정확 숫자/퍼센트/날짜/출처 라벨은 없다. 정확 값은 후속 deterministic overlay 단계가 소유한다.",
};

const executionBoundaries = {
  imageGenerationExecuted: false,
  networkExecuted: false,
  renderExecuted: false,
  muxExecuted: false,
  uploadExecuted: false,
  note: "이 manifest는 Owner가 확정한 Scene 1~6 선택 이미지를 data-only로 잠근 결과다. 이미지 생성/네트워크/렌더/mux/업로드를 수행하지 않는다.",
};

const setAudit = {
  description: "선택 이미지 세트가 v2 request pack과 Owner 확정 선택을 소비한 결과 요약. static guard가 order/role/path 정합성을 대조한다.",
  selectedSceneCount: selectedScenes.length,
  selectedSceneOrders: selectedScenes.map((s) => s.sceneOrder),
  scenesWithWarnings: selectedScenes.filter((s) => s.warnings.length > 0).map((s) => s.sceneOrder),
  scenesUsingRetry: selectedScenes.filter((s) => s.sourceRun !== "first_run").map((s) => s.sceneOrder),
  allImagesExistLocally: selectedScenes.every((s) => s.localFileExists),
  renderReadyCandidate: true,
};

// ── assemble selected image set ─────────────────────────────────────────────
const selectedImageSet = {
  schemaVersion: "money_shorts_scene_selected_image_set_v1",
  status: "data_only_selected_not_rendered",
  title: "Money Shorts OS — Scene 1~6 Selected Image Set v1",
  purpose: "v2 request pack의 sceneRole/category/family와 Owner가 확정한 Scene 1~6 선택 이미지를 묶어 " +
    "다음 render 단계가 소비할 수 있는 data-only manifest로 잠근 결과. 이미지 생성/렌더/mp4/mux/업로드 아님.",
  sourceRefs: {
    requestPack: {
      path: "scripts/fixtures/premium-editorial-scene-image-request-pack.v2.json",
      schemaVersion: pack.schemaVersion,
    },
  },
  executionBoundaries,
  renderReadyCandidate: true,
  deterministicOverlayRequired: true,
  ownerReviewRequired: true,
  renderNotYetPerformed: true,
  mp4NotYetGenerated: true,
  muxNotYetPerformed: true,
  uploadNotYetPerformed: true,
  selectedScenes,
  visualRhythmEvaluation,
  repetitionConvergenceEvidence,
  overlayPolicySummary,
  setAudit,
};

writeFileSync(OUTPUT_PATH, JSON.stringify(selectedImageSet, null, 2) + "\n", "utf8");

console.log(`✅ Selected image set manifest written: ${OUTPUT_PATH}`);
console.log(`   selectedScenes: ${selectedScenes.map((s) => `${s.sceneId}(${s.sourceRun})`).join(", ")}`);
console.log(`   scenesWithWarnings: [${setAudit.scenesWithWarnings.join(", ")}]`);
console.log(`   scenesUsingRetry: [${setAudit.scenesUsingRetry.join(", ")}]`);
console.log(`   allImagesExistLocally: ${setAudit.allImagesExistLocally}`);
console.log(`   executionBoundaries: imageGenerationExecuted=${executionBoundaries.imageGenerationExecuted}, renderExecuted=${executionBoundaries.renderExecuted}, muxExecuted=${executionBoundaries.muxExecuted}, uploadExecuted=${executionBoundaries.uploadExecuted}`);
