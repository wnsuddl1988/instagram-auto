#!/usr/bin/env node
// ──────────────────────────────────────────────────────────────────────────
// build-premium-editorial-prompt-compiler-final-prompts-v1.mjs
//
// PROMPT COMPILER V1 — FINAL PROMPT COMPILER (deterministic text-only)
//
// 이 빌더는 Visual Rule Contract와 compiled visual plan fixture를 소비해서
// 6개 scene 각각의 deterministic finalPrompt(텍스트 prompt)를 생성한다.
//
// 이 단계의 산출물 finalPrompt는:
//   - 이미지 생성 엔진(예: ChatGPT 이미지)에 넣을 수 있는 텍스트 artifact일 뿐이다.
//   - 이 스크립트는 절대 이미지 생성 요청을 하지 않는다.
//   - 정확 숫자/날짜/출처는 이미지 안에 박지 않고 deterministic overlay에 위임한다.
//
// 이 빌더는 다음을 하지 않는다 (boundary 준수):
//   - 이미지 생성 / 이미지 URL·path·request body 생성
//   - ChatGPT / Playwright / OpenAI 실행 또는 import
//   - fetch / http / https / child_process / node-fetch 사용
//   - openaiRequestBody / imageUrl / generatedImagePath 필드 생성
//
// 설계 원칙 (Rule Contract promptCompilerContract.fixed80 / variable20):
//   - fixedPart(약 80%): premium editorial 실사풍 / 생활경제 맥락 /
//     보조 금융 그래픽 레이어 / face-minimized / no-stock / no-3D /
//     subtitle safe-zone / deterministic overlay 원칙 — 모든 scene 공통.
//   - variablePart(약 20%): 경제 신호·scene role·visual category·object family·
//     공간/구도·그래픽 레이어 역할 — scene별 변수.
//   - object family는 "고정 오브젝트표"가 아니라 family 단위 visual family로 사용한다.
//   - scene5/6처럼 objectFamily가 반복되면 finalPrompt에 구도 분리 지시를 넣는다.
//
// source:
//   1) scripts/fixtures/premium-editorial-visual-system.rule-contract.v1.json
//   2) scripts/fixtures/premium-editorial-prompt-compiler-compiled-visual-plan.v1.json
// output:
//   scripts/fixtures/premium-editorial-prompt-compiler-final-prompts.v1.json
// ──────────────────────────────────────────────────────────────────────────

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..");

const CONTRACT_PATH = join(REPO_ROOT, "scripts", "fixtures", "premium-editorial-visual-system.rule-contract.v1.json");
const PLAN_PATH = join(REPO_ROOT, "scripts", "fixtures", "premium-editorial-prompt-compiler-compiled-visual-plan.v1.json");
const OUTPUT_PATH = join(REPO_ROOT, "scripts", "fixtures", "premium-editorial-prompt-compiler-final-prompts.v1.json");

// ── load source-of-truth fixtures ─────────────────────────────────────────
const contract = JSON.parse(readFileSync(CONTRACT_PATH, "utf8"));
const plan = JSON.parse(readFileSync(PLAN_PATH, "utf8"));

// ── index Rule Contract pools ──────────────────────────────────────────────
const roleMap = new Map((contract.sceneRoleContract?.roles || []).map(r => [r.id, r]));
const categoryMap = new Map((contract.visualCategoryPool?.categories || []).map(c => [c.id, c]));
const familyMap = new Map((contract.objectFamilyPool?.families || []).map(f => [f.id, f]));

// ── fixed part (약 80% 공통) — Rule Contract fixed80 + source-of-truth policy 반영 ──
// 모든 scene이 공유하는 premium editorial life-economy realism 토대.
const FIXED_PART = [
  "Premium editorial life-economy realism, photographic look (not 3D, not animation, not illustration).",
  "Korean / Asian personal-finance short-form vertical 9:16 visual tone, calm warm-neutral editorial color grade.",
  "Everyday Korean household / urban economic life setting, grounded and believable — not a posed stock photo, not a glossy advertisement.",
  "Face-minimized: do not center on a person's full face; keep focus on hands, objects, and space (faces only incidental / background / cropped).",
  "Subtitle safe-zone: keep the lower portion of the frame clear and uncluttered for burned-in caption text.",
  "Fixed financial graphic layer is SUPPORTING ONLY — subtle premium accent, never a full-screen data card, never the dominant element.",
  "Deterministic overlay owns exact values: do NOT render any exact numbers, percentages, dates, or official source labels as trustworthy text inside the image. Exact numbers / dates / source labels are added later by a separate deterministic overlay stage; here use only neutral placeholder / chip areas with no real values.",
  "Do not converge into the failure combo: avoid the repeated wood-table + hand + smartphone + notebook + coffee composition across scenes.",
].join(" ");

// fixed part를 항목별로도 보존 (guard 검증/추적용)
const FIXED_PART_ELEMENTS = [
  "premium_editorial_life_economy_realism",
  "korean_asian_personal_finance_short_form_tone",
  "no_stock_photo_look",
  "no_3d_animation",
  "face_minimized",
  "subtitle_safe_zone",
  "supporting_financial_graphic_layer_only",
  "no_fullscreen_data_card",
  "deterministic_overlay_owns_exact_values",
  "no_wood_table_hand_smartphone_note_coffee_convergence",
];

// ── overlay policy (모든 scene 공통 deterministic overlay 원칙) ────────────
const overlayPolicyBase = {
  exactValuesInImage: contract.imageTextSourceOfTruthPolicy?.exactValuesInImage ?? false,
  deterministicOverlayOwnsExactValues: contract.imageTextSourceOfTruthPolicy?.deterministicOverlayOwnsExactValues ?? true,
  ownedByOverlay: ["exact_numbers", "percentages", "dates", "source_labels", "chart_values"],
  note: "정확한 숫자/날짜/출처/차트 값은 finalPrompt(이미지)에 넣지 않는다. 후속 deterministic overlay 단계가 소유한다. dataPeriod와 lastPolicyDecisionDate는 서로 다른 개념이며 이미지 안에 직접 넣지 않는다.",
};

// ── helpers ────────────────────────────────────────────────────────────────

// camera distance → 자연어 촬영 지시
function cameraDistancePhrase(cd) {
  switch (cd) {
    case "close_up": return "close-up framing on hands and the key object";
    case "medium": return "medium shot balancing objects and surrounding space";
    case "wide": return "wide shot emphasizing the space and lived-in context";
    default: return `${cd} framing`;
  }
}

// space type → 자연어 공간 지시
function spaceTypePhrase(st) {
  switch (st) {
    case "indoor_personal": return "an intimate personal indoor space";
    case "indoor_desk": return "a calm indoor desk / work surface";
    case "indoor_living": return "a warm indoor living space";
    case "outdoor_urban": return "an outdoor urban / commute setting";
    default: return st;
  }
}

// object family → "고정 오브젝트표"가 아니라 family 의미(visual family)로 변환.
// member를 그대로 박지 않고 family의 visual 성격을 자연어로 풀어준다.
function objectFamilyPhrase(famId) {
  const fam = familyMap.get(famId);
  if (!fam) return famId;
  const members = (fam.members || []);
  // family 단위 의미 + 대표 member 몇 개를 "varied within this family" 형태로 제시.
  // 특정 오브젝트 고정이 아니라 family 내 다양화를 허용한다는 의도.
  const memberHint = members.slice(0, 3).join(", ");
  return `objects from the "${famId}" visual family (e.g. ${memberHint}; varied within the family, not a fixed single prop)`;
}

// graphic layer mode → 자연어 그래픽 레이어 역할
function graphicLayerModePhrase(mode) {
  switch (mode) {
    case "subtle_supporting_only": return "a subtle supporting financial graphic accent only (no large numbers)";
    case "supporting_with_placeholder": return "a supporting graphic layer with neutral numeric placeholder and a source-label chip area (no real values)";
    case "minimal_auxiliary_only": return "only minimal auxiliary graphic support, real-life scene first";
    case "supporting_checkpoint_card": return "a supporting checkpoint-card placeholder area (no real text values)";
    case "supporting_cta_card": return "a supporting wrap-up / CTA-card placeholder area (no real text values)";
    default: return `a supporting graphic layer (${mode})`;
  }
}

// scene role → role-specific visual intent 문장
function roleIntentPhrase(roleId, communicates) {
  const base = communicates ? communicates : "";
  switch (roleId) {
    case "scene_1_hook":
      return `Hook intent: instantly make the viewer feel an economic signal touching their own daily life, giving a reason to stop and watch. ${base}`;
    case "scene_2_signal":
      return `Signal intent: present where and how the core economic signal is captured, in a trustworthy, calm way. ${base}`;
    case "scene_3_context":
      return `Context intent: show the cause / wider context — why this is happening across prices, economy, and household flow. ${base}`;
    case "scene_4_life_impact":
      return `Life-impact intent: show how the same signal reaches a borrower / saver / living cost differently in real life. ${base}`;
    case "scene_5_watch_point":
      return `Watch-point intent: a checklist / decision moment showing what to verify next. ${base}`;
    case "scene_6_action_closing":
      return `Action-closing intent: an organized wrap-up of this month's actions with a soft call to action. ${base}`;
    default:
      return base;
  }
}

// ── consume compiled visual plan scenes deterministically ──────────────────
const planScenes = (plan.scenes || []).slice().sort((a, b) => a.order - b.order);

const builtScenes = [];

for (const cs of planScenes) {
  const role = roleMap.get(cs.sceneRole);
  const category = categoryMap.get(cs.selectedVisualCategory);
  const families = cs.selectedObjectFamilies || [];

  // ── variable part (약 20% scene별 변수) ──
  const roleIntent = roleIntentPhrase(cs.sceneRole, cs.sceneRoleCommunicates ?? role?.communicates);
  const categoryDesc = category?.description
    ? `Visual category "${cs.selectedVisualCategory}": ${category.description}`
    : `Visual category "${cs.selectedVisualCategory}".`;
  const familyPhrases = families.map(objectFamilyPhrase);
  const spacePhrase = spaceTypePhrase(cs.spaceType);
  const cameraPhrase = cameraDistancePhrase(cs.cameraDistance);
  const graphicPhrase = graphicLayerModePhrase(cs.graphicLayerPlan?.mode);

  const variableParts = [
    roleIntent,
    categoryDesc,
    `Use ${familyPhrases.join(" and ")} as the object focus.`,
    `Set the scene in ${spacePhrase}, with ${cameraPhrase}.`,
    `Graphic layer for this scene: ${graphicPhrase}.`,
  ];

  // ── negative prompt rules — forbiddenObjects / forbiddenCompositions / repetition ──
  const negativePromptRules = [];
  for (const fo of (cs.forbiddenObjects || [])) {
    negativePromptRules.push(`forbidden object: ${fo}`);
  }
  for (const fc of (cs.forbiddenCompositions || [])) {
    negativePromptRules.push(`forbidden composition: ${fc}`);
  }
  negativePromptRules.push("no full-screen data card; graphic layer must stay supporting");
  negativePromptRules.push("no face-centered stock-photo look");
  negativePromptRules.push("no wood-table + hand + smartphone + notebook + coffee convergence");
  negativePromptRules.push("no repeated scene look from the previous scene (different space / category / object family / composition)");
  negativePromptRules.push("no exact numbers, dates, or source labels rendered as trustworthy text in the image");

  // ── repetition control applied (per-scene) ──
  const de = cs.diversityEvidence || {};
  const adjacentFamilyRepeat = de.adjacentObjectFamilyRepeat === true;
  const repetitionControlApplied = {
    previousSpaceType: de.previousSpaceType ?? null,
    previousVisualCategory: de.previousVisualCategory ?? null,
    previousObjectFamilies: de.previousObjectFamilies ?? [],
    adjacentSpaceTypeRepeat: de.adjacentSpaceTypeRepeat === true,
    adjacentObjectFamilyRepeat: adjacentFamilyRepeat,
    adjacentVisualCategoryRepeat: de.adjacentVisualCategoryRepeat === true,
    forbiddenRepetitionNotes: cs.forbiddenRepetitionNotes || [],
    differentiateFromPreviousScene: true,
  };

  // ── scene5/6 처럼 objectFamily가 직전 scene과 반복되는 경우 구도 분리 지시 ──
  let separationDirective = null;
  if (adjacentFamilyRepeat) {
    const repeatedFamilies = families.filter(f => (de.previousObjectFamilies || []).includes(f));
    separationDirective =
      `Object family ${repeatedFamilies.join("/")} repeats from the previous scene (within the allowed 2-scene limit). ` +
      `Therefore enforce strong composition separation: the previous scene is a checklist / watch-point visual ` +
      `("${de.previousVisualCategory}", ${spaceTypePhrase(de.previousSpaceType)}), while THIS scene is a closing / CTA / budget-wrap-up visual ` +
      `("${cs.selectedVisualCategory}", ${spacePhrase}) with a different graphic layer role (${graphicPhrase}). ` +
      `Different space, different category, different graphic-layer plan — the two scenes must NOT look alike, ` +
      `and must NOT converge into the wood-table + hand + smartphone + notebook + coffee combo.`;
    repetitionControlApplied.planningRepeatAllowedWithinLimit = de.planningRepeatAllowedWithinLimit === true;
    repetitionControlApplied.finalPromptCompositionSeparationRequired = de.finalPromptCompositionSeparationRequired === true;
    repetitionControlApplied.compositionSeparationDirective = separationDirective;
  }

  // ── assemble finalPrompt (fixed + variable + negative + separation) ──
  const finalPromptSegments = [
    `[${cs.sceneId} — ${cs.sceneRole}]`,
    FIXED_PART,
    ...variableParts,
  ];
  if (separationDirective) {
    finalPromptSegments.push(separationDirective);
  }
  finalPromptSegments.push(
    `Avoid: ${negativePromptRules.join("; ")}.`
  );
  // overlay 원칙 명시 문장 (요구사항)
  finalPromptSegments.push(
    "Note: exact numbers, dates, and source labels are added later by a deterministic overlay stage — do not bake them into this image."
  );

  const finalPrompt = finalPromptSegments.join(" ");

  const promptVariablePart = variableParts.join(" ");

  builtScenes.push({
    sceneId: cs.sceneId,
    order: cs.order,
    sceneRole: cs.sceneRole,
    selectedVisualCategory: cs.selectedVisualCategory,
    selectedObjectFamilies: families,
    spaceType: cs.spaceType,
    cameraDistance: cs.cameraDistance,
    finalPrompt,
    promptFixedPart: FIXED_PART,
    promptVariablePart,
    negativePromptRules,
    overlayPolicy: {
      ...overlayPolicyBase,
      sourceOfTruthPolicyRef: cs.sourceOfTruthPolicyRef ?? "deterministic_overlay",
    },
    repetitionControlApplied,
    qaExpectations: cs.qaExpectations || [],
  });
}

// ── prompt compiler audit (요약) ───────────────────────────────────────────
const promptCompilerAudit = {
  description: "Final prompt compiler가 compiled visual plan을 소비해 6 scene deterministic finalPrompt를 생성한 결과 요약. static guard가 구조/일관성을 대조한다.",
  sceneCount: builtScenes.length,
  fixedPartElements: FIXED_PART_ELEMENTS,
  variablePartElements: contract.promptCompilerContract?.variable20?.elements ?? [],
  allScenesHaveFinalPrompt: builtScenes.every(s => typeof s.finalPrompt === "string" && s.finalPrompt.length > 0),
  allScenesDistinctFinalPrompt:
    new Set(builtScenes.map(s => s.finalPrompt)).size === builtScenes.length,
  scenesWithAdjacentFamilyRepeat: builtScenes
    .filter(s => s.repetitionControlApplied?.adjacentObjectFamilyRepeat === true)
    .map(s => s.order),
  deterministicOverlayOwnsExactValues: overlayPolicyBase.deterministicOverlayOwnsExactValues,
  exactValuesInImage: overlayPolicyBase.exactValuesInImage,
};

// ── assemble final prompts payload ─────────────────────────────────────────
const finalPromptsPayload = {
  schemaVersion: "money_shorts_prompt_compiler_final_prompts_v1",
  status: "deterministic_final_prompt_text_only",
  title: "Money Shorts OS — Prompt Compiler Final Prompts v1",
  purpose: "compiled visual plan을 소비해 6 scene용 deterministic finalPrompt(텍스트 prompt)를 생성한 결과. 이미지 생성 요청 아님. ChatGPT/Playwright/OpenAI 실행 아님. 정확 수치/날짜/출처는 deterministic overlay가 소유한다.",
  sourceRefs: {
    ruleContract: {
      path: "scripts/fixtures/premium-editorial-visual-system.rule-contract.v1.json",
      schemaVersion: contract.schemaVersion,
      visualProfileId: contract.visualProfileId,
    },
    compiledVisualPlan: {
      path: "scripts/fixtures/premium-editorial-prompt-compiler-compiled-visual-plan.v1.json",
      schemaVersion: plan.schemaVersion,
    },
    boundaryDoc: "_ai/MONEY_SHORTS_OS_PROMPT_COMPILER_V1_BOUNDARY.md",
  },
  generationBoundaries: {
    finalPromptText: true,
    image: false,
    network: false,
    openaiRequestBody: false,
    note: "이 payload는 finalPrompt 텍스트만 생성한다. 이미지 생성/네트워크/OpenAI request body는 생성하지 않는다.",
  },
  scenes: builtScenes,
  promptCompilerAudit,
};

writeFileSync(OUTPUT_PATH, JSON.stringify(finalPromptsPayload, null, 2) + "\n", "utf8");

console.log(`✅ Final prompts written: ${OUTPUT_PATH}`);
console.log(`   scenes: ${builtScenes.length}`);
console.log(`   all scenes have finalPrompt: ${promptCompilerAudit.allScenesHaveFinalPrompt}`);
console.log(`   all finalPrompts distinct: ${promptCompilerAudit.allScenesDistinctFinalPrompt}`);
console.log(`   scenes with adjacent family repeat (separation directive): [${promptCompilerAudit.scenesWithAdjacentFamilyRepeat.join(", ")}]`);
console.log(`   deterministicOverlayOwnsExactValues: ${promptCompilerAudit.deterministicOverlayOwnsExactValues} / exactValuesInImage: ${promptCompilerAudit.exactValuesInImage}`);
