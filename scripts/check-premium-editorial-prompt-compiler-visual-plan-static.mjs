#!/usr/bin/env node
// ──────────────────────────────────────────────────────────────────────────
// check-premium-editorial-prompt-compiler-visual-plan-static.mjs
//
// COMPILED VISUAL PLAN — CONTRACT/REPETITION STRUCTURE GUARD
// (NOT an image-quality judge, NOT a prompt-quality judge)
//
// 이 guard는 compiled visual plan이:
//   - Visual Rule Contract와 Preflight Fixture를 올바르게 소비했는지
//   - scene별 role/category/family linkage가 계약과 일치하는지
//   - 반복 수렴 방지 evidence가 실제 계산값과 일치하는지
//   - finalPrompt/이미지/네트워크 생성 필드가 없는지
// 를 구조적으로 검증한다.
//
// 검증 대상:
//   1) scripts/fixtures/premium-editorial-visual-system.rule-contract.v1.json
//   2) scripts/fixtures/premium-editorial-prompt-compiler-preflight.v1.json
//   3) scripts/fixtures/premium-editorial-prompt-compiler-compiled-visual-plan.v1.json
//   4) scripts/build-premium-editorial-prompt-compiler-visual-plan-v1.mjs (forbidden import)
//   5) 이 스크립트 자체 (forbidden import)
// ──────────────────────────────────────────────────────────────────────────

import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..");

const CONTRACT_PATH = join(REPO_ROOT, "scripts", "fixtures", "premium-editorial-visual-system.rule-contract.v1.json");
const PREFLIGHT_PATH = join(REPO_ROOT, "scripts", "fixtures", "premium-editorial-prompt-compiler-preflight.v1.json");
const PLAN_PATH = join(REPO_ROOT, "scripts", "fixtures", "premium-editorial-prompt-compiler-compiled-visual-plan.v1.json");
const BUILDER_PATH = join(REPO_ROOT, "scripts", "build-premium-editorial-prompt-compiler-visual-plan-v1.mjs");
const SELF_PATH = join(REPO_ROOT, "scripts", "check-premium-editorial-prompt-compiler-visual-plan-static.mjs");

const results = [];
function check(name, condition, detail = "") {
  results.push({ name, pass: !!condition, detail });
}

// ── load ──────────────────────────────────────────────────────────────────
let contract, preflight, plan, builderText, selfText;
try {
  contract = JSON.parse(readFileSync(CONTRACT_PATH, "utf8"));
} catch (e) {
  console.error(`FATAL: cannot read/parse Rule Contract: ${e.message}`);
  process.exit(2);
}
try {
  preflight = JSON.parse(readFileSync(PREFLIGHT_PATH, "utf8"));
} catch (e) {
  console.error(`FATAL: cannot read/parse preflight: ${e.message}`);
  process.exit(2);
}
try {
  plan = JSON.parse(readFileSync(PLAN_PATH, "utf8"));
} catch (e) {
  console.error(`FATAL: cannot read/parse compiled visual plan: ${e.message}`);
  process.exit(2);
}
try {
  builderText = readFileSync(BUILDER_PATH, "utf8");
} catch (e) {
  console.error(`FATAL: cannot read builder script: ${e.message}`);
  process.exit(2);
}
try {
  selfText = readFileSync(SELF_PATH, "utf8");
} catch (e) {
  console.error(`FATAL: cannot read self: ${e.message}`);
  process.exit(2);
}

// ── index Rule Contract pools ──────────────────────────────────────────────
const roleIds = new Set((contract.sceneRoleContract?.roles || []).map(r => r.id));
const catMap = new Map((contract.visualCategoryPool?.categories || []).map(c => [c.id, c]));
const famMap = new Map((contract.objectFamilyPool?.families || []).map(f => [f.id, f]));
const qaCheckIds = new Set((contract.visualQaContract?.checks || []).map(c => c.id));
const diversityRuleIds = new Set((contract.diversityRules?.rules || []).map(r => r.id));

// ═══════════════════════════════════════════════════════════════════════════
// § A. File existence + schema identity
// ═══════════════════════════════════════════════════════════════════════════

check("A-01: compiled visual plan 파일 존재", existsSync(PLAN_PATH), PLAN_PATH);
check("A-02: builder 파일 존재", existsSync(BUILDER_PATH), BUILDER_PATH);
check("A-03: plan schemaVersion 일치",
  plan.schemaVersion === "money_shorts_prompt_compiler_compiled_visual_plan_v1", plan.schemaVersion);
check("A-04: plan status 일치",
  plan.status === "minimal_contract_consumer", plan.status);
check("A-05: contract schemaVersion 일치",
  contract.schemaVersion === "money_shorts_visual_system_rule_contract_v1", contract.schemaVersion);
check("A-06: preflight schemaVersion 일치",
  preflight.schemaVersion === "money_shorts_prompt_compiler_preflight_v1", preflight.schemaVersion);

// ═══════════════════════════════════════════════════════════════════════════
// § B. sourceRefs cross-link
// ═══════════════════════════════════════════════════════════════════════════

const srcRefs = plan.sourceRefs || {};
check("B-01: sourceRefs.ruleContract.path 참조",
  srcRefs.ruleContract?.path === "scripts/fixtures/premium-editorial-visual-system.rule-contract.v1.json");
check("B-02: sourceRefs.ruleContract.schemaVersion 일치",
  srcRefs.ruleContract?.schemaVersion === contract.schemaVersion);
check("B-03: sourceRefs.ruleContract.visualProfileId 일치",
  srcRefs.ruleContract?.visualProfileId === contract.visualProfileId);
check("B-04: sourceRefs.preflight.path 참조",
  srcRefs.preflight?.path === "scripts/fixtures/premium-editorial-prompt-compiler-preflight.v1.json");
check("B-05: sourceRefs.preflight.schemaVersion 일치",
  srcRefs.preflight?.schemaVersion === preflight.schemaVersion);
check("B-06: sourceRefs.boundaryDoc 참조",
  srcRefs.boundaryDoc === "_ai/MONEY_SHORTS_OS_PROMPT_COMPILER_V1_BOUNDARY.md");

// ═══════════════════════════════════════════════════════════════════════════
// § C. generationBoundaries (no prompt/image/network generation)
// ═══════════════════════════════════════════════════════════════════════════

const gb = plan.generationBoundaries || {};
check("C-01: generationBoundaries.textPrompt === false", gb.textPrompt === false);
check("C-02: generationBoundaries.image === false", gb.image === false);
check("C-03: generationBoundaries.network === false", gb.network === false);
check("C-04: generationBoundaries.note 존재", typeof gb.note === "string" && gb.note.length > 0);

// ═══════════════════════════════════════════════════════════════════════════
// § D. scenes structure (exactly 6, required fields)
// ═══════════════════════════════════════════════════════════════════════════

const scenes = plan.scenes || [];
check("D-01: scenes 배열 존재", Array.isArray(scenes));
check("D-02: scenes 정확히 6개", scenes.length === 6, String(scenes.length));

const requiredSceneFields = [
  "sceneId", "sceneRole", "selectedVisualCategory", "selectedObjectFamilies",
  "spaceType", "cameraDistance", "compositionNotes", "graphicLayerPlan",
  "forbiddenRepetitionNotes", "qaExpectations", "diversityEvidence",
];
for (const scene of scenes) {
  const label = scene.sceneId || `order_${scene.order}`;
  for (const field of requiredSceneFields) {
    check(`D: scene '${label}' has required field '${field}'`,
      Object.prototype.hasOwnProperty.call(scene, field) && scene[field] != null);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// § E. role / category / family contract linkage
// ═══════════════════════════════════════════════════════════════════════════

for (const scene of scenes) {
  const label = scene.sceneId;
  // sceneRole exists in contract
  check(`E: scene '${label}' sceneRole '${scene.sceneRole}' exists in Rule Contract sceneRoleContract`,
    roleIds.has(scene.sceneRole));

  // selectedVisualCategory exists in pool
  const cat = catMap.get(scene.selectedVisualCategory);
  check(`E: scene '${label}' selectedVisualCategory '${scene.selectedVisualCategory}' exists in visualCategoryPool`,
    !!cat);

  // category.usefulForRoles covers sceneRole
  check(`E: scene '${label}' category '${scene.selectedVisualCategory}' usefulForRoles covers '${scene.sceneRole}'`,
    !!cat && Array.isArray(cat.usefulForRoles) && cat.usefulForRoles.includes(scene.sceneRole));

  // selectedObjectFamilies exist in pool + usefulForCategories direct link
  for (const famId of (scene.selectedObjectFamilies || [])) {
    const fam = famMap.get(famId);
    check(`E: scene '${label}' objectFamily '${famId}' exists in objectFamilyPool`, !!fam);
    check(`E: scene '${label}' family '${famId}' usefulForCategories includes '${scene.selectedVisualCategory}'`,
      !!fam && Array.isArray(fam.usefulForCategories) && fam.usefulForCategories.includes(scene.selectedVisualCategory));
  }

  // qaExpectations exist in visualQaContract.checks
  for (const qa of (scene.qaExpectations || [])) {
    check(`E: scene '${label}' qaExpectation '${qa}' exists in visualQaContract.checks`,
      qaCheckIds.has(qa));
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// § F. plan scenes match preflight scenes (consumed faithfully)
// ═══════════════════════════════════════════════════════════════════════════

const preflightScenes = (preflight.scenes || []).slice().sort((a, b) => a.order - b.order);
const planScenes = scenes.slice().sort((a, b) => a.order - b.order);
check("F-01: plan scene count matches preflight scene count",
  planScenes.length === preflightScenes.length, `${planScenes.length} vs ${preflightScenes.length}`);

for (let i = 0; i < preflightScenes.length; i++) {
  const ps = preflightScenes[i];
  const cs = planScenes[i];
  if (!cs) continue;
  check(`F: scene order ${ps.order} sceneRole matches preflight`,
    cs.sceneRole === ps.sceneRole, `${cs.sceneRole} vs ${ps.sceneRole}`);
  check(`F: scene order ${ps.order} selectedVisualCategory matches preflight`,
    cs.selectedVisualCategory === ps.selectedVisualCategory);
  check(`F: scene order ${ps.order} spaceType matches preflight`,
    cs.spaceType === ps.spaceType);
  check(`F: scene order ${ps.order} cameraDistance matches preflight`,
    cs.cameraDistance === ps.cameraDistance);
  check(`F: scene order ${ps.order} selectedObjectFamilies matches preflight`,
    JSON.stringify(cs.selectedObjectFamilies) === JSON.stringify(ps.selectedObjectFamilies));
}

// ═══════════════════════════════════════════════════════════════════════════
// § G. repetitionControlEvidence structure
// ═══════════════════════════════════════════════════════════════════════════

const rce = plan.repetitionControlEvidence || {};
check("G-01: previousSceneHistoryUsed === true", rce.previousSceneHistoryUsed === true);
check("G-02: diversityRulesUsed is non-empty array",
  Array.isArray(rce.diversityRulesUsed) && rce.diversityRulesUsed.length > 0);
check("G-03: all diversityRulesUsed exist in Rule Contract diversityRules.rules",
  Array.isArray(rce.diversityRulesUsed) && rce.diversityRulesUsed.every(id => diversityRuleIds.has(id)));
check("G-04: objectFamilySequence present", Array.isArray(rce.objectFamilySequence));
check("G-05: spaceTypeSequence present", Array.isArray(rce.spaceTypeSequence));
check("G-06: visualCategorySequence present", Array.isArray(rce.visualCategorySequence));
check("G-07: adjacentObjectFamilyRepeatCount is number",
  typeof rce.adjacentObjectFamilyRepeatCount === "number");
check("G-08: adjacentSpaceTypeRepeatCount is number",
  typeof rce.adjacentSpaceTypeRepeatCount === "number");
check("G-09: smartphoneCenteredSceneCount is number",
  typeof rce.smartphoneCenteredSceneCount === "number");
check("G-10: planningObjectsSceneCount is number",
  typeof rce.planningObjectsSceneCount === "number");
check("G-11: woodTableHandSmartphoneNoteCoffeeConvergenceDetected === false",
  rce.woodTableHandSmartphoneNoteCoffeeConvergenceDetected === false);
check("G-12: woodTableHandSmartphoneNoteCoffeeConvergenceBlocked === true",
  rce.woodTableHandSmartphoneNoteCoffeeConvergenceBlocked === true);

// ═══════════════════════════════════════════════════════════════════════════
// § H. sequences match scenes (계산 일치)
// ═══════════════════════════════════════════════════════════════════════════

const sceneSpaceSeq = planScenes.map(s => s.spaceType);
const sceneCatSeq = planScenes.map(s => s.selectedVisualCategory);
const sceneFamSeq = planScenes.map(s => s.selectedObjectFamilies);

check("H-01: spaceTypeSequence matches scenes",
  JSON.stringify(rce.spaceTypeSequence) === JSON.stringify(sceneSpaceSeq),
  `${JSON.stringify(rce.spaceTypeSequence)} vs ${JSON.stringify(sceneSpaceSeq)}`);
check("H-02: visualCategorySequence matches scenes",
  JSON.stringify(rce.visualCategorySequence) === JSON.stringify(sceneCatSeq));
check("H-03: objectFamilySequence matches scenes",
  JSON.stringify(rce.objectFamilySequence) === JSON.stringify(sceneFamSeq));

// ═══════════════════════════════════════════════════════════════════════════
// § I. adjacency repetition counts — recompute and compare
// ═══════════════════════════════════════════════════════════════════════════

function countAdjacentSpace(seq) {
  let c = 0;
  for (let i = 1; i < seq.length; i++) if (seq[i] === seq[i - 1]) c++;
  return c;
}
function countAdjacentFamily(seq) {
  let c = 0;
  for (let i = 1; i < seq.length; i++) {
    const prev = seq[i - 1] || [];
    const cur = seq[i] || [];
    if (cur.some(f => prev.includes(f))) c++;
  }
  return c;
}

const recomputedSpaceRepeat = countAdjacentSpace(sceneSpaceSeq);
const recomputedFamilyRepeat = countAdjacentFamily(sceneFamSeq);

check("I-01: adjacentSpaceTypeRepeatCount matches recomputed",
  rce.adjacentSpaceTypeRepeatCount === recomputedSpaceRepeat,
  `audit=${rce.adjacentSpaceTypeRepeatCount} recomputed=${recomputedSpaceRepeat}`);
check("I-02: adjacentObjectFamilyRepeatCount matches recomputed",
  rce.adjacentObjectFamilyRepeatCount === recomputedFamilyRepeat,
  `audit=${rce.adjacentObjectFamilyRepeatCount} recomputed=${recomputedFamilyRepeat}`);
check("I-03: no spaceType repeated 3+ consecutive scenes",
  (() => {
    let run = 1, max = 1;
    for (let i = 1; i < sceneSpaceSeq.length; i++) {
      if (sceneSpaceSeq[i] === sceneSpaceSeq[i - 1]) { run++; max = Math.max(max, run); }
      else run = 1;
    }
    return max < 3;
  })());

// ═══════════════════════════════════════════════════════════════════════════
// § Q. consecutive run enforcement + adjacent pair mitigation
// ═══════════════════════════════════════════════════════════════════════════

// consecutive run recompute helpers (guard-side)
function maxConsecutiveRunGuard(seq, equalFn) {
  if (seq.length === 0) return 0;
  let max = 1, run = 1;
  for (let i = 1; i < seq.length; i++) {
    if (equalFn(seq[i], seq[i - 1])) { run++; if (run > max) max = run; }
    else run = 1;
  }
  return max;
}
function maxFamilyConsecutiveRunGuard(seq) {
  return maxConsecutiveRunGuard(seq, (a, b) => (a || []).some(f => (b || []).includes(f)));
}

const sceneCamSeq = planScenes.map(s => s.cameraDistance);
const sceneFamSeqQ = planScenes.map(s => s.selectedObjectFamilies);

const recomputedMaxFamilyRun = maxFamilyConsecutiveRunGuard(sceneFamSeqQ);
const recomputedMaxCamRun = maxConsecutiveRunGuard(sceneCamSeq, (a, b) => a === b);
const recomputedMaxCloseUpRun = maxConsecutiveRunGuard(
  sceneCamSeq, (a, b) => a === "close_up" && b === "close_up"
);

check("Q-01: maxObjectFamilyConsecutiveRun exists in repetitionControlEvidence",
  typeof rce.maxObjectFamilyConsecutiveRun === "number");
check("Q-02: maxObjectFamilyConsecutiveRun matches recomputed",
  rce.maxObjectFamilyConsecutiveRun === recomputedMaxFamilyRun,
  `evidence=${rce.maxObjectFamilyConsecutiveRun} recomputed=${recomputedMaxFamilyRun}`);
check("Q-03: maxObjectFamilyConsecutiveRun <= 2",
  typeof rce.maxObjectFamilyConsecutiveRun === "number" && rce.maxObjectFamilyConsecutiveRun <= 2,
  String(rce.maxObjectFamilyConsecutiveRun));
check("Q-04: maxCameraDistanceConsecutiveRun exists",
  typeof rce.maxCameraDistanceConsecutiveRun === "number");
check("Q-05: maxCameraDistanceConsecutiveRun matches recomputed",
  rce.maxCameraDistanceConsecutiveRun === recomputedMaxCamRun,
  `evidence=${rce.maxCameraDistanceConsecutiveRun} recomputed=${recomputedMaxCamRun}`);
check("Q-06: maxCloseUpCameraDistanceConsecutiveRun exists",
  typeof rce.maxCloseUpCameraDistanceConsecutiveRun === "number");
check("Q-07: maxCloseUpCameraDistanceConsecutiveRun matches recomputed",
  rce.maxCloseUpCameraDistanceConsecutiveRun === recomputedMaxCloseUpRun,
  `evidence=${rce.maxCloseUpCameraDistanceConsecutiveRun} recomputed=${recomputedMaxCloseUpRun}`);
check("Q-08: maxCloseUpCameraDistanceConsecutiveRun <= 2",
  typeof rce.maxCloseUpCameraDistanceConsecutiveRun === "number" && rce.maxCloseUpCameraDistanceConsecutiveRun <= 2,
  String(rce.maxCloseUpCameraDistanceConsecutiveRun));
check("Q-09: sameObjectFamilyRepeatLimitSatisfied === true",
  rce.sameObjectFamilyRepeatLimitSatisfied === true);
check("Q-10: sameCameraDistanceRepeatLimitSatisfied === true",
  rce.sameCameraDistanceRepeatLimitSatisfied === true);
check("Q-11: adjacentObjectFamilyRepeatPairs is array",
  Array.isArray(rce.adjacentObjectFamilyRepeatPairs));
check("Q-12: adjacentSpaceTypeRepeatPairs is array",
  Array.isArray(rce.adjacentSpaceTypeRepeatPairs));
check("Q-13: adjacentCameraDistanceRepeatPairs is array",
  Array.isArray(rce.adjacentCameraDistanceRepeatPairs));

// adjacent objectFamily repeat pairs — each must have allowedWithinLimit + mitigationNote
for (const pair of (rce.adjacentObjectFamilyRepeatPairs || [])) {
  const pairLabel = `scenes[${(pair.sceneOrders || []).join(",")}]`;
  check(`Q: adjacent objectFamily repeat pair ${pairLabel} has allowedWithinLimit === true`,
    pair.allowedWithinLimit === true);
  check(`Q: adjacent objectFamily repeat pair ${pairLabel} has non-empty mitigationNote`,
    typeof pair.mitigationNote === "string" && pair.mitigationNote.length > 0);
}

// scene5/scene6 planning_objects 2연속 처리: selectedVisualCategory, spaceType, graphicLayerPlan.mode가 다른지 확인
const scene5 = planScenes.find(s => s.order === 5);
const scene6 = planScenes.find(s => s.order === 6);
check("Q-14: scene5 and scene6 exist for planning convergence check",
  !!scene5 && !!scene6);
check("Q-15: scene5 and scene6 have different selectedVisualCategory",
  !!scene5 && !!scene6 && scene5.selectedVisualCategory !== scene6.selectedVisualCategory,
  `scene5=${scene5?.selectedVisualCategory} scene6=${scene6?.selectedVisualCategory}`);
check("Q-16: scene5 and scene6 have different spaceType OR different graphicLayerPlan.mode",
  !!scene5 && !!scene6 && (
    scene5.spaceType !== scene6.spaceType ||
    scene5.graphicLayerPlan?.mode !== scene6.graphicLayerPlan?.mode
  ),
  `spaceType:${scene5?.spaceType}vs${scene6?.spaceType} graphicMode:${scene5?.graphicLayerPlan?.mode}vs${scene6?.graphicLayerPlan?.mode}`);

// scene6 diversityEvidence: planning repeat allowedWithinLimit + finalPromptCompositionSeparationRequired
const scene6de = scene6?.diversityEvidence || {};
check("Q-17: scene6 diversityEvidence has planningRepeatAllowedWithinLimit === true (if adjacentFamilyRepeat)",
  !scene6de.adjacentObjectFamilyRepeat || scene6de.planningRepeatAllowedWithinLimit === true);
check("Q-18: scene6 diversityEvidence has finalPromptCompositionSeparationRequired === true (if adjacentFamilyRepeat)",
  !scene6de.adjacentObjectFamilyRepeat || scene6de.finalPromptCompositionSeparationRequired === true);

// scene6 forbiddenRepetitionNotes: 2연속 한도 내 허용 + 구도 분리 의미 포함 여부
const scene6Notes = (scene6?.forbiddenRepetitionNotes || []).join(" ");
check("Q-19: scene6 forbiddenRepetitionNotes mentions '2연속 한도 내 허용'",
  scene6Notes.includes("2연속 한도 내 허용") || scene6Notes.includes("2 scene 초과 금지"));
check("Q-20: scene6 forbiddenRepetitionNotes mentions finalPrompt 단계 구도 분리",
  scene6Notes.includes("finalPrompt") || scene6Notes.includes("구도·맥락") || scene6Notes.includes("구도 분리"));

// ═══════════════════════════════════════════════════════════════════════════
// § J. smartphone / planning counts — recompute from contract member semantics
// ═══════════════════════════════════════════════════════════════════════════

function isSmartphoneFam(famId) {
  const fam = famMap.get(famId);
  if (!fam) return false;
  const members = (fam.members || []).map(m => m.toLowerCase());
  return members.some(m => m.includes("app screen") || m.includes("mobile pay") || m.includes("phone"));
}
function isPlanningFam(famId) {
  const fam = famMap.get(famId);
  if (!fam) return false;
  const members = (fam.members || []).map(m => m.toLowerCase());
  return members.some(m => m.includes("notebook")) && members.some(m => m.includes("pen"));
}

let recomputedSmartphone = 0, recomputedPlanning = 0;
for (const fams of sceneFamSeq) {
  if ((fams || []).some(isSmartphoneFam)) recomputedSmartphone++;
  if ((fams || []).some(isPlanningFam)) recomputedPlanning++;
}

check("J-01: smartphoneCenteredSceneCount matches recomputed",
  rce.smartphoneCenteredSceneCount === recomputedSmartphone,
  `audit=${rce.smartphoneCenteredSceneCount} recomputed=${recomputedSmartphone}`);
check("J-02: smartphoneCenteredSceneCount <= limit (2)",
  rce.smartphoneCenteredSceneCount <= 2, String(rce.smartphoneCenteredSceneCount));
check("J-03: planningObjectsSceneCount matches recomputed",
  rce.planningObjectsSceneCount === recomputedPlanning,
  `audit=${rce.planningObjectsSceneCount} recomputed=${recomputedPlanning}`);
check("J-04: planningObjectsSceneCount <= limit (2)",
  rce.planningObjectsSceneCount <= 2, String(rce.planningObjectsSceneCount));

// ═══════════════════════════════════════════════════════════════════════════
// § K. diversityAudit consistency with repetitionControlEvidence
// ═══════════════════════════════════════════════════════════════════════════

const da = plan.diversityAudit || {};
check("K-01: diversityAudit.smartphoneCenteredSceneCount matches evidence",
  da.smartphoneCenteredSceneCount === rce.smartphoneCenteredSceneCount);
check("K-02: diversityAudit.planningObjectsSceneCount matches evidence",
  da.planningObjectsSceneCount === rce.planningObjectsSceneCount);
check("K-03: diversityAudit.spaceTypeSequence matches evidence",
  JSON.stringify(da.spaceTypeSequence) === JSON.stringify(rce.spaceTypeSequence));
check("K-04: diversityAudit.visualCategorySequence matches evidence",
  JSON.stringify(da.visualCategorySequence) === JSON.stringify(rce.visualCategorySequence));
check("K-05: diversityAudit.woodTableNotebookCoffeeHandComboDetected === false",
  da.woodTableNotebookCoffeeHandComboDetected === false);
check("K-06: diversityAudit.fullscreenDataCardDetected === false",
  da.fullscreenDataCardDetected === false);

// ═══════════════════════════════════════════════════════════════════════════
// § L. per-scene diversityEvidence + forbiddenRepetitionNotes
// ═══════════════════════════════════════════════════════════════════════════

for (const scene of planScenes) {
  const label = scene.sceneId;
  const de = scene.diversityEvidence || {};
  check(`L: scene '${label}' diversityEvidence has adjacentSpaceTypeRepeat boolean`,
    typeof de.adjacentSpaceTypeRepeat === "boolean");
  check(`L: scene '${label}' diversityEvidence has adjacentObjectFamilyRepeat boolean`,
    typeof de.adjacentObjectFamilyRepeat === "boolean");
  check(`L: scene '${label}' diversityEvidence.convergenceComboBlocked === true`,
    de.convergenceComboBlocked === true);
  check(`L: scene '${label}' forbiddenRepetitionNotes is non-empty array`,
    Array.isArray(scene.forbiddenRepetitionNotes) && scene.forbiddenRepetitionNotes.length > 0);
}

// ═══════════════════════════════════════════════════════════════════════════
// § M. forbidden generation fields ABSENT (deep scan)
// ═══════════════════════════════════════════════════════════════════════════

const planJson = JSON.stringify(plan);
const forbiddenFieldNames = [
  "finalPrompt", "promptText", "generatedPrompt", "chatgptPrompt",
  "imageUrl", "generatedImagePath", "openaiRequestBody",
];

// deep key scan
function collectKeys(obj, acc) {
  if (Array.isArray(obj)) {
    for (const v of obj) collectKeys(v, acc);
  } else if (obj && typeof obj === "object") {
    for (const k of Object.keys(obj)) {
      acc.add(k);
      collectKeys(obj[k], acc);
    }
  }
}
const allKeys = new Set();
collectKeys(plan, allKeys);

for (const f of forbiddenFieldNames) {
  check(`M: compiled plan has NO '${f}' key (deep scan)`, !allKeys.has(f));
  // also check raw substring as a defensive net for key names
  check(`M: compiled plan JSON has no '"${f}"' key token`, !planJson.includes(`"${f}"`));
}

// ═══════════════════════════════════════════════════════════════════════════
// § N. builder + guard: no network/runner imports
// ═══════════════════════════════════════════════════════════════════════════

const forbiddenImports = ["openai", "playwright", "node-fetch", "child_process"];
for (const imp of forbiddenImports) {
  const pat = new RegExp(`(import|require)[^\\n]*['"\`]${imp}['"\`]`);
  check(`N: builder does NOT import/require '${imp}'`, !pat.test(builderText));
  check(`N: guard does NOT import/require '${imp}'`, !pat.test(selfText));
}
// http/https module imports
check("N: builder does NOT import node:http/https",
  !/import[^\n]*['"`]node:https?['"`]/.test(builderText) && !/require\(['"`]https?['"`]\)/.test(builderText));
check("N: guard does NOT import node:http/https",
  !/import[^\n]*['"`]node:https?['"`]/.test(selfText) && !/require\(['"`]https?['"`]\)/.test(selfText));
// fetch usage in builder (실행 호출 점검). guard 자체는 검증 패턴 텍스트에
// 'fetch(' 리터럴을 포함하므로 self-match를 피하고 import/require 부재로만 검증한다.
check("N: builder does NOT call fetch(",
  !/\bfetch\s*\(/.test(builderText));
check("N: guard does NOT import fetch runner (node-fetch checked above)",
  !/(import|require)[^\n]*['"`]node-fetch['"`]/.test(selfText));

// ═══════════════════════════════════════════════════════════════════════════
// § O. builder: no fixed scene→object/category hardcoded mapping
// ═══════════════════════════════════════════════════════════════════════════

// 구조적 점검: builder가 'scene_N = <object/category>' 형태로 고정 매핑을
// 하드코딩하지 않았는지. preflight를 순회(loop)하며 contract pool에서 조회하는지 확인.
check("O-01: builder iterates preflight scenes (no per-scene-number hardcode)",
  /for\s*\(\s*const\s+\w+\s+of\s+preflightScenes\b/.test(builderText));
check("O-02: builder resolves category from categoryMap (pool lookup, not literal)",
  /categoryMap\.get\(/.test(builderText));
check("O-03: builder resolves family from familyMap (pool lookup, not literal)",
  /familyMap\.get\(/.test(builderText));
check("O-04: builder resolves role from roleMap (pool lookup, not literal)",
  /roleMap\.get\(/.test(builderText));
// negative: no literal 'scene_1 = banking_objects' style fixed mapping object in builder
check("O-05: builder has no literal fixed scene-number→objectFamily mapping table",
  !/scene_[1-6]\s*:\s*\[?["']?(banking_objects|data_objects|household_objects|planning_objects)/.test(builderText));
check("O-06: builder validates category.usefulForRoles linkage (contract-driven)",
  /usefulForRoles/.test(builderText) && /usefulForCategories/.test(builderText));

// ═══════════════════════════════════════════════════════════════════════════
// § P. existing guards' invariants reflected (no convergence, anchors intact)
// ═══════════════════════════════════════════════════════════════════════════

// no two adjacent scenes share same visualCategory
check("P-01: no two adjacent scenes share the same visualCategory",
  (() => {
    for (let i = 1; i < sceneCatSeq.length; i++) {
      if (sceneCatSeq[i] === sceneCatSeq[i - 1]) return false;
    }
    return true;
  })());
// scene 1 / scene 2 roles still the approved-anchor roles
check("P-02: scene order 1 is scene_1_hook (approved anchor role preserved)",
  planScenes[0]?.sceneRole === "scene_1_hook");
check("P-03: scene order 2 is scene_2_signal (approved anchor role preserved)",
  planScenes[1]?.sceneRole === "scene_2_signal");
// every scene blocks fullscreen data card via graphicLayerPlan
check("P-04: every scene graphicLayerPlan.fullscreenDataCardBlocked === true",
  planScenes.every(s => s.graphicLayerPlan?.fullscreenDataCardBlocked === true));

// ═══════════════════════════════════════════════════════════════════════════
// Result Summary
// ═══════════════════════════════════════════════════════════════════════════

const pass = results.filter(r => r.pass);
const fail = results.filter(r => !r.pass);

console.log(`\n══════════════════════════════════════════════════════════`);
console.log(`  COMPILED VISUAL PLAN — CONTRACT/REPETITION STATIC GUARD`);
console.log(`  (NOT an image/prompt quality judge)`);
console.log(`══════════════════════════════════════════════════════════`);

for (const r of results) {
  const mark = r.pass ? "PASS" : "FAIL";
  const detail = r.detail ? `  [${r.detail}]` : "";
  console.log(`  ${mark}  ${r.name}${detail}`);
}

console.log(`\n──────────────────────────────────────────────────────────`);
console.log(`  TOTAL : ${results.length}  |  PASS : ${pass.length}  |  FAIL : ${fail.length}`);
console.log(`──────────────────────────────────────────────────────────\n`);

if (fail.length > 0) {
  console.error(`GUARD FAILED (${fail.length} failures):`);
  for (const r of fail) console.error(`  FAIL  ${r.name}${r.detail ? `  [${r.detail}]` : ""}`);
  process.exit(1);
} else {
  console.log(`GUARD OK: compiled visual plan structure + repetition control intact (${pass.length}/${results.length}).`);
  process.exit(0);
}
