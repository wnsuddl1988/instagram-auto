#!/usr/bin/env node
// ──────────────────────────────────────────────────────────────────────────
// build-premium-editorial-scene-image-request-pack-v1.mjs
//
// SCENE 3~6 IMAGE GENERATION REQUEST PACK — DATA-ONLY (no execution)
//
// 이 빌더는 finalPrompt fixture(v1)와 Rule Contract approvedAnchorSet을 소비해
// Scene 3~6용 image generation request pack을 deterministic하게 생성한다.
//
// 이 빌더는 다음을 하지 않는다 (boundary 준수):
//   - 이미지 생성 / 이미지 URL·path·request body 생성
//   - ChatGPT / Playwright / OpenAI 실행 또는 import
//   - fetch / http / https / child_process / node-fetch 사용
//   - openaiRequestBody / imageUrl / generatedImagePath 필드 생성
//
// 설계 원칙:
//   - Scene 1 fixed + Scene 2 v2는 Owner 승인 anchor이며, 이 pack은
//     그것을 "재생성 대상"이 아니라 approvedAnchorRefs로만 참조 보존한다.
//   - generationTargets는 정확히 Scene 3,4,5,6만 포함한다 (order 3~6).
//   - 각 target은 finalPrompt fixture의 finalPrompt / negativePromptRules /
//     overlayPolicy / repetitionControlApplied / qaExpectations를 그대로 소비한다.
//   - 이 pack 자체는 "다음 단계에서 실행자가 읽을 data-only 요청 패키지"이며
//     이 스크립트는 그 실행을 수행하지 않는다 (executionBoundaries 전부 false).
//
// source:
//   1) scripts/fixtures/premium-editorial-visual-system.rule-contract.v1.json
//   2) scripts/fixtures/premium-editorial-prompt-compiler-final-prompts.v1.json
// output:
//   scripts/fixtures/premium-editorial-scene-image-request-pack.v1.json
// ──────────────────────────────────────────────────────────────────────────

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..");

const CONTRACT_PATH = join(REPO_ROOT, "scripts", "fixtures", "premium-editorial-visual-system.rule-contract.v1.json");
const FINAL_PROMPTS_PATH = join(REPO_ROOT, "scripts", "fixtures", "premium-editorial-prompt-compiler-final-prompts.v1.json");
const OUTPUT_PATH = join(REPO_ROOT, "scripts", "fixtures", "premium-editorial-scene-image-request-pack.v1.json");

// ── load source-of-truth fixtures ─────────────────────────────────────────
const contract = JSON.parse(readFileSync(CONTRACT_PATH, "utf8"));
const finalPrompts = JSON.parse(readFileSync(FINAL_PROMPTS_PATH, "utf8"));

// ── approved anchor set (Scene 1/2 — 재생성 대상 아님, 참조만 보존) ────────
const anchorSet = contract.approvedAnchorSet || {};
const anchors = anchorSet.anchors || [];

// Scene 1 fixed (scene_1_hook), Scene 2 v2 (scene_2_signal) anchor를 role 기준으로 조회.
// 하드코딩된 order 매핑이 아니라 sceneRole로 조회 — Rule Contract가 anchor 변경 시
// 이 빌더는 그대로 추종한다.
function findAnchorByRole(role) {
  return anchors.find(a => a.sceneRole === role) || null;
}
const scene1Anchor = findAnchorByRole("scene_1_hook");
const scene2Anchor = findAnchorByRole("scene_2_signal");
if (!scene1Anchor || !scene2Anchor) {
  console.error("FATAL: approvedAnchorSet에서 scene_1_hook 또는 scene_2_signal anchor를 찾지 못함.");
  process.exit(2);
}

const approvedAnchorRefs = anchors.map(a => ({
  id: a.id,
  sceneRole: a.sceneRole,
  status: a.status,
  file: a.file,
  sceneSetId: a.sceneSetId,
  excludedFromGenerationTargets: true,
}));
const approvedAnchorRoleIds = new Set(anchors.map(a => a.sceneRole));

// ── finalPrompts scenes (order 보존) ───────────────────────────────────────
const finalScenes = (finalPrompts.scenes || []).slice().sort((a, b) => a.order - b.order);

// ── generationTargets: anchor role을 제외한 나머지 scene만 (Scene 3~6) ─────
const generationTargetScenes = finalScenes.filter(s => !approvedAnchorRoleIds.has(s.sceneRole));

if (generationTargetScenes.length !== 4) {
  console.error(`FATAL: generationTargets 기대값 4(Scene 3~6)와 불일치 — 실제 ${generationTargetScenes.length}개.`);
  process.exit(2);
}
const expectedOrders = [3, 4, 5, 6];
const actualOrders = generationTargetScenes.map(s => s.order).sort((a, b) => a - b);
if (JSON.stringify(actualOrders) !== JSON.stringify(expectedOrders)) {
  console.error(`FATAL: generationTargets order 불일치 — 기대 [3,4,5,6], 실제 [${actualOrders.join(",")}].`);
  process.exit(2);
}

// ── per-target evidence 구성 ────────────────────────────────────────────────
const generationTargets = generationTargetScenes.map(s => {
  const rca = s.repetitionControlApplied || {};
  const op = s.overlayPolicy || {};

  // adjacent-scene differentiation evidence — finalPrompt fixture 값을 그대로 보존 + 구조적 evidence 추가.
  const differentiationEvidence = {
    previousSpaceType: rca.previousSpaceType ?? null,
    previousVisualCategory: rca.previousVisualCategory ?? null,
    previousObjectFamilies: rca.previousObjectFamilies ?? [],
    adjacentSpaceTypeRepeat: rca.adjacentSpaceTypeRepeat === true,
    adjacentObjectFamilyRepeat: rca.adjacentObjectFamilyRepeat === true,
    adjacentVisualCategoryRepeat: rca.adjacentVisualCategoryRepeat === true,
    differentiateFromPreviousScene: rca.differentiateFromPreviousScene === true,
  };

  // scene5/6 planning_objects 반복 — "2연속 한도 내 허용 + 구도 분리 필수" evidence 보존.
  const planningRepeatEvidence = rca.adjacentObjectFamilyRepeat === true
    ? {
        planningRepeatAllowedWithinLimit: rca.planningRepeatAllowedWithinLimit === true,
        finalPromptCompositionSeparationRequired: rca.finalPromptCompositionSeparationRequired === true,
        compositionSeparationDirective: rca.compositionSeparationDirective ?? null,
      }
    : null;

  // visual-system safety evidence: deterministic overlay / no-data-card / no-exact-values / no-convergence
  const visualSystemSafetyEvidence = {
    deterministicOverlayOwnsExactValues: op.deterministicOverlayOwnsExactValues === true,
    exactValuesInImage: op.exactValuesInImage === false ? false : op.exactValuesInImage,
    noFullscreenDataCard: (s.negativePromptRules || []).some(r => r.includes("full-screen data card")),
    noExactValuesInImage: (s.negativePromptRules || []).some(r => r.includes("no exact numbers, dates, or source labels")),
    noWoodTableHandSmartphoneNoteCoffeeConvergence: (s.negativePromptRules || []).some(r => r.includes("wood-table + hand + smartphone + notebook + coffee")),
    adjacentSceneDifferentiationRequired: (s.negativePromptRules || []).some(r => r.includes("no repeated scene look from the previous scene")),
  };

  return {
    sceneId: s.sceneId,
    order: s.order,
    sceneRole: s.sceneRole,
    selectedVisualCategory: s.selectedVisualCategory,
    selectedObjectFamilies: s.selectedObjectFamilies,
    spaceType: s.spaceType,
    cameraDistance: s.cameraDistance,
    finalPrompt: s.finalPrompt,
    negativePromptRules: s.negativePromptRules,
    overlayPolicy: s.overlayPolicy,
    repetitionControlApplied: s.repetitionControlApplied,
    qaExpectations: s.qaExpectations,
    differentiationEvidence,
    planningRepeatEvidence,
    visualSystemSafetyEvidence,
    requestStatus: "pending_owner_gate_not_submitted",
  };
});

// ── execution boundaries (이 pack은 실행하지 않는다) ────────────────────────
const executionBoundaries = {
  imageGeneration: false,
  network: false,
  chatgptPlaywrightRun: false,
  openaiRequestBody: false,
  note: "이 pack은 Scene 3~6 image generation request의 data-only 패키지다. 이미지 생성/네트워크/ChatGPT·Playwright 실행/OpenAI request body 생성을 하지 않는다. 실제 실행은 별도 Owner 승인 단계 이후 별도 구현체가 담당한다.",
};

// ── pack audit (요약) ───────────────────────────────────────────────────────
const packAudit = {
  description: "Scene image request pack이 finalPrompt fixture를 소비해 Scene 3~6 generation target을 구성한 결과 요약. static guard가 anchor 제외 + target 정합성을 대조한다.",
  totalScenesInFinalPrompts: finalScenes.length,
  approvedAnchorCount: approvedAnchorRefs.length,
  generationTargetCount: generationTargets.length,
  generationTargetOrders: generationTargets.map(t => t.order),
  scenesWithPlanningRepeatEvidence: generationTargets
    .filter(t => t.planningRepeatEvidence !== null)
    .map(t => t.order),
  allTargetsHaveFinalPrompt: generationTargets.every(t => typeof t.finalPrompt === "string" && t.finalPrompt.length > 0),
  allTargetsPendingOwnerGate: generationTargets.every(t => t.requestStatus === "pending_owner_gate_not_submitted"),
};

// ── assemble request pack ──────────────────────────────────────────────────
const requestPack = {
  schemaVersion: "money_shorts_scene_image_request_pack_v1",
  status: "data_only_not_submitted",
  title: "Money Shorts OS — Scene 3~6 Image Generation Request Pack v1",
  purpose: "finalPrompt fixture를 소비해 Scene 3~6용 image generation request pack을 data-only로 구성한 결과. Scene 1 fixed + Scene 2 v2는 Owner 승인 anchor이므로 재생성 대상에서 제외하고 참조만 보존한다. 이미지 생성/네트워크/ChatGPT·Playwright 실행 아님.",
  sourceRefs: {
    ruleContract: {
      path: "scripts/fixtures/premium-editorial-visual-system.rule-contract.v1.json",
      schemaVersion: contract.schemaVersion,
      visualProfileId: contract.visualProfileId,
    },
    finalPrompts: {
      path: "scripts/fixtures/premium-editorial-prompt-compiler-final-prompts.v1.json",
      schemaVersion: finalPrompts.schemaVersion,
    },
    boundaryDoc: "_ai/MONEY_SHORTS_OS_PROMPT_COMPILER_V1_BOUNDARY.md",
  },
  executionBoundaries,
  approvedAnchorRefs,
  generationTargets,
  packAudit,
};

writeFileSync(OUTPUT_PATH, JSON.stringify(requestPack, null, 2) + "\n", "utf8");

console.log(`✅ Scene image request pack written: ${OUTPUT_PATH}`);
console.log(`   approvedAnchorRefs: ${approvedAnchorRefs.map(a => a.sceneRole).join(", ")}`);
console.log(`   generationTargets: ${generationTargets.map(t => `${t.sceneId}(order ${t.order})`).join(", ")}`);
console.log(`   scenesWithPlanningRepeatEvidence: [${packAudit.scenesWithPlanningRepeatEvidence.join(", ")}]`);
console.log(`   executionBoundaries: imageGeneration=${executionBoundaries.imageGeneration}, network=${executionBoundaries.network}, chatgptPlaywrightRun=${executionBoundaries.chatgptPlaywrightRun}, openaiRequestBody=${executionBoundaries.openaiRequestBody}`);
