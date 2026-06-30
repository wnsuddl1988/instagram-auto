#!/usr/bin/env node
// ──────────────────────────────────────────────────────────────────────────
// build-premium-editorial-scene-image-request-pack-v2.mjs
//
// SCENE 1~6 FULL-SET IMAGE GENERATION REQUEST PACK v2 — DATA-ONLY (no execution)
//
// 이 빌더는 final-prompts v1 + compiled visual plan v1을 소비해 Scene 1~6 전체를
// generation target으로 갖는 full-set image generation request pack을 deterministic하게
// 생성한다.
//
// v1(Scene 3~6 only) 대비 핵심 변화:
//   - 기존 Scene 1 fixed + Scene 2 v2는 "무조건 고정 anchor"가 아니라
//     reference 후보 / 새 기준 재검수 대상이다.
//   - 따라서 v1의 approvedAnchorRefs(excludedFromGenerationTargets=true) 전제는 stale이다.
//   - 이 pack은 Scene 1~6 전체를 generationTargets로 만든다 (full-set regeneration).
//   - 기존 Scene 1/2 reference는 referenceCandidates로만 보존한다
//     (reuse 강제 아님, generation exclusion 아님, 새 visual rule 기준 재검수 대상).
//
// 이 빌더는 다음을 하지 않는다 (boundary 준수):
//   - 이미지 생성 / 이미지 URL·path·request body 생성
//   - ChatGPT / Playwright / OpenAI 실행 또는 import
//   - fetch / http / https / child_process / node-fetch 사용
//   - openaiRequestBody / imageUrl / generatedImagePath 필드 생성
//
// source:
//   1) scripts/fixtures/premium-editorial-prompt-compiler-final-prompts.v1.json
//   2) scripts/fixtures/premium-editorial-prompt-compiler-compiled-visual-plan.v1.json
//   3) scripts/fixtures/premium-editorial-scene-image-request-pack.v1.json (reference 후보 정보 + supersedes 기록용)
// output:
//   scripts/fixtures/premium-editorial-scene-image-request-pack.v2.json
// ──────────────────────────────────────────────────────────────────────────

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..");

const FINAL_PROMPTS_PATH = join(REPO_ROOT, "scripts", "fixtures", "premium-editorial-prompt-compiler-final-prompts.v1.json");
const VISUAL_PLAN_PATH = join(REPO_ROOT, "scripts", "fixtures", "premium-editorial-prompt-compiler-compiled-visual-plan.v1.json");
const V1_PACK_PATH = join(REPO_ROOT, "scripts", "fixtures", "premium-editorial-scene-image-request-pack.v1.json");
const OUTPUT_PATH = join(REPO_ROOT, "scripts", "fixtures", "premium-editorial-scene-image-request-pack.v2.json");

// ── load source-of-truth fixtures ─────────────────────────────────────────
const finalPrompts = JSON.parse(readFileSync(FINAL_PROMPTS_PATH, "utf8"));
const visualPlan = JSON.parse(readFileSync(VISUAL_PLAN_PATH, "utf8"));
const v1Pack = JSON.parse(readFileSync(V1_PACK_PATH, "utf8"));

// ── final-prompts / visual plan scene을 order 기준으로 인덱싱 ───────────────
const finalScenes = (finalPrompts.scenes || []).slice().sort((a, b) => a.order - b.order);
const planByRole = new Map((visualPlan.scenes || []).map(s => [s.sceneRole, s]));

if (finalScenes.length !== 6) {
  console.error(`FATAL: final-prompts scene 기대값 6(Scene 1~6)와 불일치 — 실제 ${finalScenes.length}개.`);
  process.exit(2);
}
const finalOrders = finalScenes.map(s => s.order);
const expectedOrders = [1, 2, 3, 4, 5, 6];
if (JSON.stringify(finalOrders) !== JSON.stringify(expectedOrders)) {
  console.error(`FATAL: final-prompts order 불일치 — 기대 [1..6], 실제 [${finalOrders.join(",")}].`);
  process.exit(2);
}

// ── compositionSummary 도출: compiled visual plan의 compositionNotes 요약 ───
function buildCompositionSummary(plan, finalScene) {
  const cn = plan?.compositionNotes || {};
  const tags = Array.isArray(cn.tags) ? cn.tags.join(", ") : "";
  return `${finalScene.spaceType} / ${finalScene.cameraDistance} — primaryFocus=${cn.primaryFocus || "objects_and_space"}, faceFocus=${cn.faceFocus || "minimized"}${tags ? `, tags=[${tags}]` : ""}.`;
}

// ── per-scene generation target 구성 (Scene 1~6 전체) ──────────────────────
const generationTargets = finalScenes.map(s => {
  const plan = planByRole.get(s.sceneRole) || null;
  return {
    sceneId: s.sceneId,
    sceneOrder: s.order,
    sceneRole: s.sceneRole,
    selectedVisualCategory: s.selectedVisualCategory,
    selectedObjectFamilies: s.selectedObjectFamilies,
    spaceType: s.spaceType,
    cameraDistance: s.cameraDistance,
    compositionSummary: buildCompositionSummary(plan, s),
    graphicLayerPlan: plan?.graphicLayerPlan || null,
    finalPrompt: s.finalPrompt,
    negativePromptRules: s.negativePromptRules,
    overlayPolicy: s.overlayPolicy,
    repetitionControlApplied: s.repetitionControlApplied,
    qaExpectations: s.qaExpectations,
    requestStatus: "pending_owner_gate_not_submitted",
  };
});

// ── referenceCandidates: 기존 Scene 1/2 anchor를 reference 후보로만 보존 ───
// reuse 강제 아님 / generation exclusion 아님 / 새 visual rule 기준 재검수 대상.
const v1Anchors = v1Pack.approvedAnchorRefs || [];
const referenceCandidates = v1Anchors.map(a => ({
  id: a.id,
  sceneRole: a.sceneRole,
  previousStatus: a.status,
  file: a.file,
  sceneSetId: a.sceneSetId,
  reuseForced: false,
  excludedFromGenerationTargets: false,
  requiresRecheckUnderNewVisualRule: true,
  note: "이전 Visual Rule Contract 이전에 승인된 reference 후보다. reuse를 강제하지 않으며 generation target에서 제외하지 않는다. 새 visual rule / prompt compiler / visual QA 기준으로 재검수해야 하며, 현재 기준 자동 통과로 간주하지 않는다.",
}));

// ── compatibility audit (짧게) ──────────────────────────────────────────────
const compatibilityAudit = {
  description: "기존 Scene 1/2 reference의 현재 기준 호환성을 짧게 판정한 결과.",
  legacyAnchorRoles: referenceCandidates.map(r => r.sceneRole),
  legacyAnchorsAutoPass: false,
  reasons: [
    "기존 Scene 1/2는 새 Visual Rule Contract 이전에 승인된 anchor라서 현재 기준에서 자동 통과로 간주하지 않는다.",
    "실제 이미지 compatibility가 새 기준으로 입증되지 않았으므로 full-set regeneration target에 포함한다.",
    "최종 기준은 Scene 1~6 전체의 visual rhythm / tone / composition / graphic layer 일관성이다.",
  ],
  conclusion: "Scene 1/2를 고정 anchor로 두지 않고 Scene 1~6 전체를 generation target으로 재구성한다. 기존 1/2 이미지는 reference 후보로만 보존하고 새 기준으로 재검수한다.",
};

// ── execution boundaries (이 pack은 실행하지 않는다) ────────────────────────
const executionBoundaries = {
  imageGenerationExecuted: false,
  networkExecuted: false,
  chatgptPlaywrightRun: false,
  openaiRequestBodyGenerated: false,
  note: "이 pack은 Scene 1~6 full-set image generation request의 data-only 패키지다. 이미지 생성/네트워크/ChatGPT·Playwright 실행/OpenAI request body 생성을 하지 않는다. 실제 실행은 별도 Owner 승인 단계 이후 별도 구현체가 담당한다.",
};

// ── full-set 반복 수렴 방지 evidence (Scene 1~6 전체 기준) ──────────────────
const da = visualPlan.diversityAudit || {};
const fullSetRepetitionEvidence = {
  description: "Scene 1~6 전체 기준 반복 수렴 방지 evidence. compiled visual plan diversityAudit를 그대로 보존한다.",
  spaceTypeSequence: da.spaceTypeSequence || generationTargets.map(t => t.spaceType),
  cameraDistanceSequence: da.cameraDistanceSequence || generationTargets.map(t => t.cameraDistance),
  objectFamilySequence: da.objectFamilySequence || generationTargets.map(t => t.selectedObjectFamilies),
  visualCategorySequence: da.visualCategorySequence || generationTargets.map(t => t.selectedVisualCategory),
  adjacentSpaceTypeRepeatCount: da.adjacentSpaceTypeRepeatCount ?? null,
  adjacentObjectFamilyRepeatCount: da.adjacentObjectFamilyRepeatCount ?? null,
  woodTableNotebookCoffeeHandComboDetected: da.woodTableNotebookCoffeeHandComboDetected === true,
  scenesWithPlanningRepeat: generationTargets
    .filter(t => t.repetitionControlApplied?.adjacentObjectFamilyRepeat === true)
    .map(t => t.sceneOrder),
};

// ── pack audit (요약) ───────────────────────────────────────────────────────
const packAudit = {
  description: "Scene 1~6 full-set image request pack v2가 final-prompts v1 + compiled visual plan v1을 소비한 결과 요약. static guard가 full-set target 정합성 + reference 후보 비제외 + supersedes를 대조한다.",
  totalScenesInFinalPrompts: finalScenes.length,
  generationTargetCount: generationTargets.length,
  generationTargetOrders: generationTargets.map(t => t.sceneOrder),
  scene1Role: generationTargets[0]?.sceneRole,
  scene2Role: generationTargets[1]?.sceneRole,
  referenceCandidateCount: referenceCandidates.length,
  referenceCandidatesExcludeGeneration: referenceCandidates.some(r => r.excludedFromGenerationTargets === true),
  allTargetsHaveFinalPrompt: generationTargets.every(t => typeof t.finalPrompt === "string" && t.finalPrompt.length > 0),
  allTargetsPendingOwnerGate: generationTargets.every(t => t.requestStatus === "pending_owner_gate_not_submitted"),
};

// ── assemble request pack v2 ────────────────────────────────────────────────
const requestPack = {
  schemaVersion: "money_shorts_scene_image_request_pack_v2",
  status: "data_only_full_set_not_submitted",
  title: "Money Shorts OS — Scene 1~6 Full-Set Image Generation Request Pack v2",
  purpose: "final-prompts v1 + compiled visual plan v1을 소비해 Scene 1~6 전체를 generation target으로 갖는 full-set image generation request pack을 data-only로 구성한 결과. 기존 Scene 1/2는 고정 anchor가 아니라 reference 후보 / 재검수 대상이다. 이미지 생성/네트워크/ChatGPT·Playwright 실행 아님.",
  supersedes: {
    pack: "scripts/fixtures/premium-editorial-scene-image-request-pack.v1.json",
    schemaVersion: v1Pack.schemaVersion,
    reasonStale: "v1 pack은 Scene 1/2를 고정 승인 anchor로 보고 generation target을 Scene 3~6만으로 한정했다. 현재 기준에서는 Scene 1/2도 새 Visual Rule Contract로 재검수해야 하므로, 3~6-only 전제는 stale이며 Scene 1~6 full-set으로 대체한다.",
  },
  sourceRefs: {
    finalPrompts: {
      path: "scripts/fixtures/premium-editorial-prompt-compiler-final-prompts.v1.json",
      schemaVersion: finalPrompts.schemaVersion,
    },
    compiledVisualPlan: {
      path: "scripts/fixtures/premium-editorial-prompt-compiler-compiled-visual-plan.v1.json",
      schemaVersion: visualPlan.schemaVersion,
    },
    boundaryDoc: "_ai/MONEY_SHORTS_OS_PROMPT_COMPILER_V1_BOUNDARY.md",
  },
  allSixScenesGenerationRequired: true,
  scene1And2AreReferenceCandidatesOnly: true,
  imageGenerationExecuted: false,
  networkExecuted: false,
  chatgptPlaywrightRun: false,
  executionBoundaries,
  compatibilityAudit,
  referenceCandidates,
  generationTargets,
  fullSetRepetitionEvidence,
  packAudit,
};

writeFileSync(OUTPUT_PATH, JSON.stringify(requestPack, null, 2) + "\n", "utf8");

console.log(`✅ Scene 1~6 full-set image request pack v2 written: ${OUTPUT_PATH}`);
console.log(`   generationTargets: ${generationTargets.map(t => `${t.sceneId}(order ${t.sceneOrder}, ${t.sceneRole})`).join(", ")}`);
console.log(`   referenceCandidates (NOT excluded from generation): ${referenceCandidates.map(r => r.sceneRole).join(", ")}`);
console.log(`   scenesWithPlanningRepeat: [${fullSetRepetitionEvidence.scenesWithPlanningRepeat.join(", ")}]`);
console.log(`   supersedes: ${requestPack.supersedes.pack}`);
console.log(`   allSixScenesGenerationRequired=${requestPack.allSixScenesGenerationRequired}, scene1And2AreReferenceCandidatesOnly=${requestPack.scene1And2AreReferenceCandidatesOnly}`);
console.log(`   imageGenerationExecuted=${requestPack.imageGenerationExecuted}, networkExecuted=${requestPack.networkExecuted}, chatgptPlaywrightRun=${requestPack.chatgptPlaywrightRun}`);
