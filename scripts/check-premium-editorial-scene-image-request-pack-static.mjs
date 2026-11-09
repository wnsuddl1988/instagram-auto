#!/usr/bin/env node
// ──────────────────────────────────────────────────────────────────────────
// check-premium-editorial-scene-image-request-pack-static.mjs
//
// SCENE 3~6 IMAGE REQUEST PACK — STRUCTURE/ANCHOR-EXCLUSION GUARD
// (NOT an image-quality judge, NOT a prompt-quality judge)
//
// 이 guard는 scene image request pack이:
//   - finalPrompt fixture를 올바르게 소비했는지
//   - Scene 1 fixed + Scene 2 v2 anchor가 generationTargets에서 제외되고
//     approvedAnchorRefs로만 보존됐는지
//   - generationTargets가 정확히 Scene 3,4,5,6인지
//   - 각 target이 finalPrompt/negativePromptRules/overlayPolicy/
//     repetitionControlApplied/qaExpectations를 소비했는지
//   - deterministic overlay / no-data-card / no-exact-values / no-convergence /
//     adjacent-scene differentiation evidence가 유지되는지
//   - scene5/6 planning_objects 반복의 "2연속 한도 내 허용 + 구도 분리 필수" evidence가 있는지
//   - executionBoundaries 전부 false인지 (이 pack은 실행하지 않는다)
//   - openaiRequestBody/imageUrl/generatedImagePath 데이터가 없는지
// 를 구조적으로 검증한다.
//
// 검증 대상:
//   1) scripts/fixtures/premium-editorial-visual-system.rule-contract.v1.json
//   2) scripts/fixtures/premium-editorial-prompt-compiler-final-prompts.v1.json
//   3) scripts/fixtures/premium-editorial-scene-image-request-pack.v1.json
//   4) scripts/build-premium-editorial-scene-image-request-pack-v1.mjs (forbidden import)
//   5) 이 스크립트 자체 (forbidden import)
// ──────────────────────────────────────────────────────────────────────────

import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..");

const CONTRACT_PATH = join(REPO_ROOT, "scripts", "fixtures", "premium-editorial-visual-system.rule-contract.v1.json");
const FINAL_PROMPTS_PATH = join(REPO_ROOT, "scripts", "fixtures", "premium-editorial-prompt-compiler-final-prompts.v1.json");
const PACK_PATH = join(REPO_ROOT, "scripts", "fixtures", "premium-editorial-scene-image-request-pack.v1.json");
const BUILDER_PATH = join(REPO_ROOT, "scripts", "build-premium-editorial-scene-image-request-pack-v1.mjs");
const SELF_PATH = join(REPO_ROOT, "scripts", "check-premium-editorial-scene-image-request-pack-static.mjs");

const results = [];
function check(name, condition, detail = "") {
  results.push({ name, pass: !!condition, detail });
}

// ── load ──────────────────────────────────────────────────────────────────
let contract, finalPrompts, pack, builderText, selfText;
try {
  contract = JSON.parse(readFileSync(CONTRACT_PATH, "utf8"));
} catch (e) {
  console.error(`FATAL: cannot read/parse Rule Contract: ${e.message}`);
  process.exit(2);
}
try {
  finalPrompts = JSON.parse(readFileSync(FINAL_PROMPTS_PATH, "utf8"));
} catch (e) {
  console.error(`FATAL: cannot read/parse final prompts: ${e.message}`);
  process.exit(2);
}
try {
  pack = JSON.parse(readFileSync(PACK_PATH, "utf8"));
} catch (e) {
  console.error(`FATAL: cannot read/parse request pack: ${e.message}`);
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

const finalScenes = (finalPrompts.scenes || []).slice().sort((a, b) => a.order - b.order);
const finalByOrder = new Map(finalScenes.map(s => [s.order, s]));
const anchors = contract.approvedAnchorSet?.anchors || [];
const anchorRoleIds = new Set(anchors.map(a => a.sceneRole));

// ═══════════════════════════════════════════════════════════════════════════
// § A. File existence + schema identity
// ═══════════════════════════════════════════════════════════════════════════

check("A-01: request pack 파일 존재", existsSync(PACK_PATH), PACK_PATH);
check("A-02: builder 파일 존재", existsSync(BUILDER_PATH), BUILDER_PATH);
check("A-03: pack schemaVersion 일치",
  pack.schemaVersion === "money_shorts_scene_image_request_pack_v1", pack.schemaVersion);
check("A-04: pack status 일치",
  pack.status === "data_only_not_submitted", pack.status);
check("A-05: contract schemaVersion 일치",
  contract.schemaVersion === "money_shorts_visual_system_rule_contract_v1", contract.schemaVersion);
check("A-06: finalPrompts schemaVersion 일치",
  finalPrompts.schemaVersion === "money_shorts_prompt_compiler_final_prompts_v1", finalPrompts.schemaVersion);

// ═══════════════════════════════════════════════════════════════════════════
// § B. sourceRefs cross-link
// ═══════════════════════════════════════════════════════════════════════════

const srcRefs = pack.sourceRefs || {};
check("B-01: sourceRefs.ruleContract.path 참조",
  srcRefs.ruleContract?.path === "scripts/fixtures/premium-editorial-visual-system.rule-contract.v1.json");
check("B-02: sourceRefs.ruleContract.schemaVersion 일치",
  srcRefs.ruleContract?.schemaVersion === contract.schemaVersion);
check("B-03: sourceRefs.ruleContract.visualProfileId 일치",
  srcRefs.ruleContract?.visualProfileId === contract.visualProfileId);
check("B-04: sourceRefs.finalPrompts.path 참조",
  srcRefs.finalPrompts?.path === "scripts/fixtures/premium-editorial-prompt-compiler-final-prompts.v1.json");
check("B-05: sourceRefs.finalPrompts.schemaVersion 일치",
  srcRefs.finalPrompts?.schemaVersion === finalPrompts.schemaVersion);
check("B-06: sourceRefs.boundaryDoc 참조",
  srcRefs.boundaryDoc === "_ai/MONEY_SHORTS_OS_PROMPT_COMPILER_V1_BOUNDARY.md");

// ═══════════════════════════════════════════════════════════════════════════
// § C. executionBoundaries — 전부 false (이 pack은 실행하지 않는다)
// ═══════════════════════════════════════════════════════════════════════════

const eb = pack.executionBoundaries || {};
check("C-01: executionBoundaries.imageGeneration === false", eb.imageGeneration === false);
check("C-02: executionBoundaries.network === false", eb.network === false);
check("C-03: executionBoundaries.chatgptPlaywrightRun === false", eb.chatgptPlaywrightRun === false);
check("C-04: executionBoundaries.openaiRequestBody === false", eb.openaiRequestBody === false);
check("C-05: executionBoundaries.note 존재", typeof eb.note === "string" && eb.note.length > 0);

// ═══════════════════════════════════════════════════════════════════════════
// § D. approvedAnchorRefs — Scene 1 fixed + Scene 2 v2 보존, 제외 플래그
// ═══════════════════════════════════════════════════════════════════════════

const refs = pack.approvedAnchorRefs || [];
check("D-01: approvedAnchorRefs is array", Array.isArray(refs));
check("D-02: approvedAnchorRefs count matches Rule Contract anchors",
  refs.length === anchors.length, `${refs.length} vs ${anchors.length}`);
check("D-03: approvedAnchorRefs includes scene_1_hook",
  refs.some(r => r.sceneRole === "scene_1_hook"));
check("D-04: approvedAnchorRefs includes scene_2_signal",
  refs.some(r => r.sceneRole === "scene_2_signal"));

const refScene1 = refs.find(r => r.sceneRole === "scene_1_hook");
const refScene2 = refs.find(r => r.sceneRole === "scene_2_signal");
const anchorScene1 = anchors.find(a => a.sceneRole === "scene_1_hook");
const anchorScene2 = anchors.find(a => a.sceneRole === "scene_2_signal");

check("D-05: scene_1_hook anchor id matches Rule Contract",
  refScene1?.id === anchorScene1?.id);
check("D-06: scene_1_hook anchor status === owner_approved",
  refScene1?.status === "owner_approved");
check("D-07: scene_1_hook anchor file path preserved",
  refScene1?.file === anchorScene1?.file);
check("D-08: scene_2_signal anchor id matches Rule Contract",
  refScene2?.id === anchorScene2?.id);
check("D-09: scene_2_signal anchor status === owner_approved",
  refScene2?.status === "owner_approved");
check("D-10: scene_2_signal anchor file path preserved",
  refScene2?.file === anchorScene2?.file);

for (const r of refs) {
  check(`D: approvedAnchorRef '${r.sceneRole}' has excludedFromGenerationTargets === true`,
    r.excludedFromGenerationTargets === true);
}

// ═══════════════════════════════════════════════════════════════════════════
// § E. generationTargets — 정확히 Scene 3,4,5,6 (order)
// ═══════════════════════════════════════════════════════════════════════════

const targets = pack.generationTargets || [];
check("E-01: generationTargets is array", Array.isArray(targets));
check("E-02: generationTargets count === 4", targets.length === 4, String(targets.length));

const targetOrders = targets.map(t => t.order).sort((a, b) => a - b);
check("E-03: generationTargets orders === [3,4,5,6]",
  JSON.stringify(targetOrders) === JSON.stringify([3, 4, 5, 6]), JSON.stringify(targetOrders));

// Scene 1/2가 generationTargets에 절대 포함되지 않음을 명시적으로 검증
check("E-04: generationTargets does NOT include order 1 (scene_1_hook anchor)",
  !targets.some(t => t.order === 1));
check("E-05: generationTargets does NOT include order 2 (scene_2_signal anchor)",
  !targets.some(t => t.order === 2));
check("E-06: generationTargets does NOT include sceneRole scene_1_hook",
  !targets.some(t => t.sceneRole === "scene_1_hook"));
check("E-07: generationTargets does NOT include sceneRole scene_2_signal",
  !targets.some(t => t.sceneRole === "scene_2_signal"));

// 각 target의 sceneRole이 anchorRoleIds(제외 대상)에 속하지 않아야 함
for (const t of targets) {
  check(`E: generation target '${t.sceneId}' sceneRole is NOT an approved anchor role`,
    !anchorRoleIds.has(t.sceneRole));
}

// ═══════════════════════════════════════════════════════════════════════════
// § F. generationTargets 필수 필드 + finalPrompts와 일치
// ═══════════════════════════════════════════════════════════════════════════

const requiredTargetFields = [
  "sceneId", "order", "sceneRole", "selectedVisualCategory", "selectedObjectFamilies",
  "spaceType", "cameraDistance", "finalPrompt", "negativePromptRules", "overlayPolicy",
  "repetitionControlApplied", "qaExpectations", "differentiationEvidence",
  "visualSystemSafetyEvidence", "requestStatus",
];
for (const t of targets) {
  const label = t.sceneId;
  for (const field of requiredTargetFields) {
    check(`F: target '${label}' has required field '${field}'`,
      Object.prototype.hasOwnProperty.call(t, field) && t[field] != null);
  }
  const fs = finalByOrder.get(t.order);
  check(`F: target '${label}' has matching scene in finalPrompts`, !!fs);
  if (!fs) continue;
  check(`F: target '${label}' sceneRole matches finalPrompts`, t.sceneRole === fs.sceneRole);
  check(`F: target '${label}' selectedVisualCategory matches finalPrompts`,
    t.selectedVisualCategory === fs.selectedVisualCategory);
  check(`F: target '${label}' selectedObjectFamilies matches finalPrompts`,
    JSON.stringify(t.selectedObjectFamilies) === JSON.stringify(fs.selectedObjectFamilies));
  check(`F: target '${label}' spaceType matches finalPrompts`, t.spaceType === fs.spaceType);
  check(`F: target '${label}' cameraDistance matches finalPrompts`, t.cameraDistance === fs.cameraDistance);
  check(`F: target '${label}' finalPrompt matches finalPrompts (exact consume)`,
    t.finalPrompt === fs.finalPrompt);
  check(`F: target '${label}' negativePromptRules matches finalPrompts`,
    JSON.stringify(t.negativePromptRules) === JSON.stringify(fs.negativePromptRules));
  check(`F: target '${label}' overlayPolicy matches finalPrompts`,
    JSON.stringify(t.overlayPolicy) === JSON.stringify(fs.overlayPolicy));
  check(`F: target '${label}' repetitionControlApplied matches finalPrompts`,
    JSON.stringify(t.repetitionControlApplied) === JSON.stringify(fs.repetitionControlApplied));
  check(`F: target '${label}' qaExpectations matches finalPrompts`,
    JSON.stringify(t.qaExpectations) === JSON.stringify(fs.qaExpectations));
  check(`F: target '${label}' requestStatus === pending_owner_gate_not_submitted`,
    t.requestStatus === "pending_owner_gate_not_submitted");
}

// ═══════════════════════════════════════════════════════════════════════════
// § G. visualSystemSafetyEvidence — overlay/no-data-card/no-exact-values/no-convergence
// ═══════════════════════════════════════════════════════════════════════════

for (const t of targets) {
  const label = t.sceneId;
  const vse = t.visualSystemSafetyEvidence || {};
  check(`G: target '${label}' visualSystemSafetyEvidence.deterministicOverlayOwnsExactValues === true`,
    vse.deterministicOverlayOwnsExactValues === true);
  check(`G: target '${label}' visualSystemSafetyEvidence.exactValuesInImage === false`,
    vse.exactValuesInImage === false);
  check(`G: target '${label}' visualSystemSafetyEvidence.noFullscreenDataCard === true`,
    vse.noFullscreenDataCard === true);
  check(`G: target '${label}' visualSystemSafetyEvidence.noExactValuesInImage === true`,
    vse.noExactValuesInImage === true);
  check(`G: target '${label}' visualSystemSafetyEvidence.noWoodTableHandSmartphoneNoteCoffeeConvergence === true`,
    vse.noWoodTableHandSmartphoneNoteCoffeeConvergence === true);
  check(`G: target '${label}' visualSystemSafetyEvidence.adjacentSceneDifferentiationRequired === true`,
    vse.adjacentSceneDifferentiationRequired === true);
}

// ═══════════════════════════════════════════════════════════════════════════
// § H. differentiationEvidence — adjacent-scene 차별화 evidence
// ═══════════════════════════════════════════════════════════════════════════

for (const t of targets) {
  const label = t.sceneId;
  const de = t.differentiationEvidence || {};
  check(`H: target '${label}' differentiationEvidence has adjacentSpaceTypeRepeat boolean`,
    typeof de.adjacentSpaceTypeRepeat === "boolean");
  check(`H: target '${label}' differentiationEvidence has adjacentObjectFamilyRepeat boolean`,
    typeof de.adjacentObjectFamilyRepeat === "boolean");
  check(`H: target '${label}' differentiationEvidence has adjacentVisualCategoryRepeat boolean`,
    typeof de.adjacentVisualCategoryRepeat === "boolean");
  check(`H: target '${label}' differentiationEvidence.differentiateFromPreviousScene === true`,
    de.differentiateFromPreviousScene === true);
  // adjacentVisualCategoryRepeat은 모든 target에서 false여야 함 (scene_category_must_differ)
  check(`H: target '${label}' differentiationEvidence.adjacentVisualCategoryRepeat === false`,
    de.adjacentVisualCategoryRepeat === false);
}

// ═══════════════════════════════════════════════════════════════════════════
// § I. scene5/6 planning_objects repeat evidence — "2연속 한도 내 허용 + 구도 분리 필수"
// ═══════════════════════════════════════════════════════════════════════════

const target5 = targets.find(t => t.order === 5);
const target6 = targets.find(t => t.order === 6);
check("I-01: target order 5 (scene_5_watch_point) exists", !!target5);
check("I-02: target order 6 (scene_6_action_closing) exists", !!target6);
check("I-03: target5 selectedObjectFamilies includes planning_objects",
  !!target5 && (target5.selectedObjectFamilies || []).includes("planning_objects"));
check("I-04: target6 selectedObjectFamilies includes planning_objects",
  !!target6 && (target6.selectedObjectFamilies || []).includes("planning_objects"));
check("I-05: target5 differentiationEvidence.adjacentObjectFamilyRepeat === false (no repeat with scene4)",
  target5?.differentiationEvidence?.adjacentObjectFamilyRepeat === false);
check("I-06: target6 differentiationEvidence.adjacentObjectFamilyRepeat === true (repeats with scene5)",
  target6?.differentiationEvidence?.adjacentObjectFamilyRepeat === true);
check("I-07: target5 planningRepeatEvidence === null (no repeat case)",
  target5?.planningRepeatEvidence === null);
check("I-08: target6 planningRepeatEvidence is non-null object",
  target6?.planningRepeatEvidence !== null && typeof target6?.planningRepeatEvidence === "object");
check("I-09: target6 planningRepeatEvidence.planningRepeatAllowedWithinLimit === true",
  target6?.planningRepeatEvidence?.planningRepeatAllowedWithinLimit === true);
check("I-10: target6 planningRepeatEvidence.finalPromptCompositionSeparationRequired === true",
  target6?.planningRepeatEvidence?.finalPromptCompositionSeparationRequired === true);
check("I-11: target6 planningRepeatEvidence.compositionSeparationDirective is non-empty string",
  typeof target6?.planningRepeatEvidence?.compositionSeparationDirective === "string" &&
  target6.planningRepeatEvidence.compositionSeparationDirective.length > 0);
check("I-12: target6 compositionSeparationDirective mentions checklist (prev) and closing/CTA (this)",
  (target6?.planningRepeatEvidence?.compositionSeparationDirective || "").includes("checklist") &&
  /(closing|CTA)/.test(target6?.planningRepeatEvidence?.compositionSeparationDirective || ""));
check("I-13: target6 compositionSeparationDirective mentions 2-scene limit",
  (target6?.planningRepeatEvidence?.compositionSeparationDirective || "").includes("2-scene limit"));
// 다른 target(3,4)은 planningRepeatEvidence가 null이어야 함 (adjacentObjectFamilyRepeat false)
for (const t of targets) {
  if (t.order === 6) continue;
  check(`I: target '${t.sceneId}' (order ${t.order}) planningRepeatEvidence is null (no adjacent family repeat)`,
    t.planningRepeatEvidence === null);
}

// ═══════════════════════════════════════════════════════════════════════════
// § J. packAudit consistency
// ═══════════════════════════════════════════════════════════════════════════

const audit = pack.packAudit || {};
check("J-01: packAudit.totalScenesInFinalPrompts === 6", audit.totalScenesInFinalPrompts === 6);
check("J-02: packAudit.approvedAnchorCount === 2", audit.approvedAnchorCount === 2,
  String(audit.approvedAnchorCount));
check("J-03: packAudit.generationTargetCount === 4", audit.generationTargetCount === 4);
check("J-04: packAudit.generationTargetOrders === [3,4,5,6]",
  JSON.stringify(audit.generationTargetOrders) === JSON.stringify([3, 4, 5, 6]),
  JSON.stringify(audit.generationTargetOrders));
check("J-05: packAudit.scenesWithPlanningRepeatEvidence === [6]",
  JSON.stringify(audit.scenesWithPlanningRepeatEvidence) === JSON.stringify([6]),
  JSON.stringify(audit.scenesWithPlanningRepeatEvidence));
check("J-06: packAudit.allTargetsHaveFinalPrompt === true", audit.allTargetsHaveFinalPrompt === true);
check("J-07: packAudit.allTargetsPendingOwnerGate === true", audit.allTargetsPendingOwnerGate === true);

// recompute and compare
const recomputedOrders = targets.map(t => t.order).slice().sort((a, b) => a - b);
check("J-08: packAudit.generationTargetOrders matches recomputed",
  JSON.stringify((audit.generationTargetOrders || []).slice().sort((a, b) => a - b)) ===
  JSON.stringify(recomputedOrders));
const recomputedPlanningOrders = targets
  .filter(t => t.planningRepeatEvidence !== null)
  .map(t => t.order)
  .sort((a, b) => a - b);
check("J-09: packAudit.scenesWithPlanningRepeatEvidence matches recomputed",
  JSON.stringify((audit.scenesWithPlanningRepeatEvidence || []).slice().sort((a, b) => a - b)) ===
  JSON.stringify(recomputedPlanningOrders));

// ═══════════════════════════════════════════════════════════════════════════
// § K. forbidden generation fields ABSENT (deep scan, excl. boundary flags)
// ═══════════════════════════════════════════════════════════════════════════

// executionBoundaries는 imageGeneration/network/chatgptPlaywrightRun/openaiRequestBody:false
// 같은 boundary 선언 flag를 갖는다. 그 선언 키 자체는 § C에서 false로 검증했으므로,
// deep scan은 executionBoundaries를 제외한 실제 산출 영역(approvedAnchorRefs + generationTargets + packAudit)에서 수행한다.
const forbiddenFieldNames = [
  "openaiRequestBody", "imageUrl", "generatedImagePath",
  "generatedPrompt", "chatgptPrompt",
];

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
const scanTarget = {
  approvedAnchorRefs: pack.approvedAnchorRefs,
  generationTargets: pack.generationTargets,
  packAudit: pack.packAudit,
};
const scanJson = JSON.stringify(scanTarget);
const allKeys = new Set();
collectKeys(scanTarget, allKeys);

for (const f of forbiddenFieldNames) {
  check(`K: anchorRefs/targets/audit has NO '${f}' data key (deep scan, excl. boundary flags)`, !allKeys.has(f));
  check(`K: anchorRefs/targets/audit JSON has no '"${f}"' data key token`, !scanJson.includes(`"${f}":`));
}
// boundary 선언 영역의 openaiRequestBody는 반드시 false flag여야 한다.
check("K: executionBoundaries.openaiRequestBody is a false boundary flag (not a data payload)",
  pack.executionBoundaries?.openaiRequestBody === false &&
  typeof pack.executionBoundaries.openaiRequestBody === "boolean");

// ═══════════════════════════════════════════════════════════════════════════
// § L. builder + guard: no network/runner imports
// ═══════════════════════════════════════════════════════════════════════════

const forbiddenImports = ["openai", "playwright", "node-fetch", "child_process"];
for (const imp of forbiddenImports) {
  const pat = new RegExp(`(import|require)[^\\n]*['"\`]${imp}['"\`]`);
  check(`L: builder does NOT import/require '${imp}'`, !pat.test(builderText));
  check(`L: guard does NOT import/require '${imp}'`, !pat.test(selfText));
}
check("L: builder does NOT import node:http/https",
  !/import[^\n]*['"`]node:https?['"`]/.test(builderText) && !/require\(['"`]https?['"`]\)/.test(builderText));
check("L: guard does NOT import node:http/https",
  !/import[^\n]*['"`]node:https?['"`]/.test(selfText) && !/require\(['"`]https?['"`]\)/.test(selfText));
check("L: builder does NOT call fetch(",
  !/\bfetch\s*\(/.test(builderText));
check("L: guard does NOT import fetch runner (node-fetch checked above)",
  !/(import|require)[^\n]*['"`]node-fetch['"`]/.test(selfText));

// ═══════════════════════════════════════════════════════════════════════════
// § M. builder: anchor-exclusion driven by Rule Contract, not hardcoded order
// ═══════════════════════════════════════════════════════════════════════════

check("M-01: builder resolves anchors via sceneRole lookup (findAnchorByRole), not hardcoded order",
  /findAnchorByRole\(/.test(builderText));
check("M-02: builder filters generationTargets by excluding anchorRoleIds (contract-driven)",
  /approvedAnchorRoleIds/.test(builderText) && /\.filter\(/.test(builderText));
check("M-03: builder does NOT hardcode a literal [3,4,5,6] filter without contract-derived exclusion",
  /approvedAnchorRoleIds\.has\(/.test(builderText));
check("M-04: builder validates generationTargets count === 4 (FATAL exit on mismatch)",
  /generationTargetScenes\.length !== 4/.test(builderText) && /process\.exit\(2\)/.test(builderText));
check("M-05: builder validates expected orders [3,4,5,6] (FATAL exit on mismatch)",
  /expectedOrders/.test(builderText) && /\[3, 4, 5, 6\]/.test(builderText));

// ═══════════════════════════════════════════════════════════════════════════
// Result Summary
// ═══════════════════════════════════════════════════════════════════════════

const pass = results.filter(r => r.pass);
const fail = results.filter(r => !r.pass);

console.log(`\n══════════════════════════════════════════════════════════`);
console.log(`  SCENE 3~6 IMAGE REQUEST PACK — STRUCTURE/ANCHOR GUARD`);
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
  console.log(`GUARD OK: scene image request pack structure + anchor exclusion + repetition evidence intact (${pass.length}/${results.length}).`);
  process.exit(0);
}
