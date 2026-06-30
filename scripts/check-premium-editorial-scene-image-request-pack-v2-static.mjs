#!/usr/bin/env node
// ──────────────────────────────────────────────────────────────────────────
// check-premium-editorial-scene-image-request-pack-v2-static.mjs
//
// SCENE 1~6 FULL-SET IMAGE REQUEST PACK v2 — STRUCTURE/FULL-SET GUARD
// (NOT an image-quality judge, NOT a prompt-quality judge)
//
// 이 guard는 v2 full-set pack이:
//   - final-prompts v1 + compiled visual plan v1을 올바르게 소비했는지
//   - generationTargets가 정확히 Scene 1~6 전체(6개, order 1..6)인지
//   - Scene 1 role=scene_1_hook, Scene 2 role=scene_2_signal이며 generation에서 제외되지 않았는지
//   - 고정 anchor exclusion(approvedAnchorRefs / excludedFromGenerationTargets=true)이 없는지
//   - referenceCandidates가 generation exclusion으로 작동하지 않는지
//   - v1 3~6-only 전제가 supersedes/stale로 명시됐는지
//   - sceneRole / category / objectFamilies가 final-prompts·visual plan과 일치하는지
//   - exact number/date/source text 금지 정책이 scene별로 포함됐는지
//   - openai/playwright/chatgpt/fetch/http/https/child_process/node-fetch import·실행이 없는지
//   - openaiRequestBody/imageUrl/generatedImagePath 데이터가 없는지
//   - Scene 1~6 전체 기준 반복 수렴 방지 evidence가 있는지
// 를 구조적으로 검증한다.
//
// 검증 대상:
//   1) scripts/fixtures/premium-editorial-prompt-compiler-final-prompts.v1.json
//   2) scripts/fixtures/premium-editorial-prompt-compiler-compiled-visual-plan.v1.json
//   3) scripts/fixtures/premium-editorial-scene-image-request-pack.v2.json
//   4) scripts/build-premium-editorial-scene-image-request-pack-v2.mjs (forbidden import)
//   5) 이 스크립트 자체 (forbidden import)
// ──────────────────────────────────────────────────────────────────────────

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..");

const FINAL_PROMPTS_PATH = join(REPO_ROOT, "scripts", "fixtures", "premium-editorial-prompt-compiler-final-prompts.v1.json");
const VISUAL_PLAN_PATH = join(REPO_ROOT, "scripts", "fixtures", "premium-editorial-prompt-compiler-compiled-visual-plan.v1.json");
const PACK_PATH = join(REPO_ROOT, "scripts", "fixtures", "premium-editorial-scene-image-request-pack.v2.json");
const BUILDER_PATH = join(__dirname, "build-premium-editorial-scene-image-request-pack-v2.mjs");
const SELF_PATH = join(__dirname, "check-premium-editorial-scene-image-request-pack-v2-static.mjs");

const results = [];
function check(name, condition, detail = "") {
  results.push({ name, pass: !!condition, detail });
}

// ── load ──────────────────────────────────────────────────────────────────
let finalPrompts, visualPlan, pack, builderText, selfText;
try {
  finalPrompts = JSON.parse(readFileSync(FINAL_PROMPTS_PATH, "utf8"));
} catch (e) {
  console.error(`FATAL: cannot read/parse final prompts: ${e.message}`);
  process.exit(2);
}
try {
  visualPlan = JSON.parse(readFileSync(VISUAL_PLAN_PATH, "utf8"));
} catch (e) {
  console.error(`FATAL: cannot read/parse compiled visual plan: ${e.message}`);
  process.exit(2);
}
try {
  pack = JSON.parse(readFileSync(PACK_PATH, "utf8"));
} catch (e) {
  console.error(`FATAL: cannot read/parse v2 request pack: ${e.message}`);
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

// ═══════════════════════════════════════════════════════════════════════════
// § A. top-level schema / status / supersedes
// ═══════════════════════════════════════════════════════════════════════════
check("A-01: pack schemaVersion === money_shorts_scene_image_request_pack_v2",
  pack.schemaVersion === "money_shorts_scene_image_request_pack_v2", pack.schemaVersion);
check("A-02: pack status === data_only_full_set_not_submitted",
  pack.status === "data_only_full_set_not_submitted", pack.status);
check("A-03: title 존재", typeof pack.title === "string" && pack.title.length > 0);
check("A-04: purpose 존재", typeof pack.purpose === "string" && pack.purpose.length > 0);
check("A-05: allSixScenesGenerationRequired === true", pack.allSixScenesGenerationRequired === true);
check("A-06: scene1And2AreReferenceCandidatesOnly === true", pack.scene1And2AreReferenceCandidatesOnly === true);
check("A-07: imageGenerationExecuted === false", pack.imageGenerationExecuted === false);
check("A-08: networkExecuted === false", pack.networkExecuted === false);
check("A-09: chatgptPlaywrightRun === false", pack.chatgptPlaywrightRun === false);

// ── supersedes: v1 3~6-only가 stale로 명시 ─────────────────────────────────
check("B-01: supersedes 객체 존재", typeof pack.supersedes === "object" && pack.supersedes !== null);
check("B-02: supersedes.pack가 v1 pack 경로", pack.supersedes?.pack === "scripts/fixtures/premium-editorial-scene-image-request-pack.v1.json");
check("B-03: supersedes.schemaVersion === v1 식별자", pack.supersedes?.schemaVersion === "money_shorts_scene_image_request_pack_v1");
check("B-04: supersedes.reasonStale 비어있지 않음", typeof pack.supersedes?.reasonStale === "string" && pack.supersedes.reasonStale.length > 0);
check("B-05: supersedes.reasonStale가 '3~6'/'stale' 전제를 언급",
  /3~6|stale/.test(pack.supersedes?.reasonStale || ""));

// ── sourceRefs: final-prompts + compiled visual plan 소비 ──────────────────
check("B-06: sourceRefs.finalPrompts.path 참조", pack.sourceRefs?.finalPrompts?.path === "scripts/fixtures/premium-editorial-prompt-compiler-final-prompts.v1.json");
check("B-07: sourceRefs.finalPrompts.schemaVersion 일치", pack.sourceRefs?.finalPrompts?.schemaVersion === finalPrompts.schemaVersion);
check("B-08: sourceRefs.compiledVisualPlan.path 참조", pack.sourceRefs?.compiledVisualPlan?.path === "scripts/fixtures/premium-editorial-prompt-compiler-compiled-visual-plan.v1.json");
check("B-09: sourceRefs.compiledVisualPlan.schemaVersion 일치", pack.sourceRefs?.compiledVisualPlan?.schemaVersion === visualPlan.schemaVersion);

// ═══════════════════════════════════════════════════════════════════════════
// § C. executionBoundaries 전부 false
// ═══════════════════════════════════════════════════════════════════════════
const eb = pack.executionBoundaries || {};
check("C-01: executionBoundaries.imageGenerationExecuted === false", eb.imageGenerationExecuted === false);
check("C-02: executionBoundaries.networkExecuted === false", eb.networkExecuted === false);
check("C-03: executionBoundaries.chatgptPlaywrightRun === false", eb.chatgptPlaywrightRun === false);
check("C-04: executionBoundaries.openaiRequestBodyGenerated === false", eb.openaiRequestBodyGenerated === false);
check("C-05: executionBoundaries.note 존재", typeof eb.note === "string" && eb.note.length > 0);

// ═══════════════════════════════════════════════════════════════════════════
// § D. generationTargets: 정확히 Scene 1~6 전체
// ═══════════════════════════════════════════════════════════════════════════
const targets = pack.generationTargets || [];
check("D-01: generationTargets is array", Array.isArray(targets));
check("D-02: generationTargets count === 6 (full set)", targets.length === 6, String(targets.length));
const targetOrders = targets.map(t => t.sceneOrder).slice().sort((a, b) => a - b);
check("D-03: generationTargets orders === [1,2,3,4,5,6]", JSON.stringify(targetOrders) === JSON.stringify([1, 2, 3, 4, 5, 6]), JSON.stringify(targetOrders));
const targetSceneIds = targets.map(t => t.sceneId);
for (const sid of ["scene_1", "scene_2", "scene_3", "scene_4", "scene_5", "scene_6"]) {
  check(`D-04: generationTargets includes ${sid}`, targetSceneIds.includes(sid));
}
// Scene 1/2가 generation에서 제외되지 않았는지 (full-set의 핵심)
check("D-05: generationTargets includes scene_1_hook role (NOT excluded)",
  targets.some(t => t.sceneRole === "scene_1_hook"));
check("D-06: generationTargets includes scene_2_signal role (NOT excluded)",
  targets.some(t => t.sceneRole === "scene_2_signal"));
const t1 = targets.find(t => t.sceneOrder === 1);
const t2 = targets.find(t => t.sceneOrder === 2);
check("D-07: Scene 1 (order 1) role === scene_1_hook", t1?.sceneRole === "scene_1_hook");
check("D-08: Scene 2 (order 2) role === scene_2_signal", t2?.sceneRole === "scene_2_signal");

// ── 각 target 필수 필드 + final-prompts·visual plan 일치 ────────────────────
const finalByRole = new Map((finalPrompts.scenes || []).map(s => [s.sceneRole, s]));
const planByRole = new Map((visualPlan.scenes || []).map(s => [s.sceneRole, s]));
const requiredFields = [
  "sceneId", "sceneOrder", "sceneRole", "selectedVisualCategory",
  "selectedObjectFamilies", "spaceType", "cameraDistance",
  "compositionSummary", "graphicLayerPlan", "finalPrompt",
  "negativePromptRules", "overlayPolicy", "repetitionControlApplied", "qaExpectations",
];
for (const t of targets) {
  const sid = t.sceneId;
  for (const f of requiredFields) {
    check(`E: target '${sid}' has required field '${f}'`, f in t);
  }
  const fs = finalByRole.get(t.sceneRole);
  const pl = planByRole.get(t.sceneRole);
  check(`E: target '${sid}' has matching scene in final-prompts`, !!fs);
  check(`E: target '${sid}' has matching scene in visual plan`, !!pl);
  if (fs) {
    check(`E: target '${sid}' sceneRole matches final-prompts`, t.sceneRole === fs.sceneRole);
    check(`E: target '${sid}' selectedVisualCategory matches final-prompts`, t.selectedVisualCategory === fs.selectedVisualCategory);
    check(`E: target '${sid}' selectedObjectFamilies matches final-prompts`, JSON.stringify(t.selectedObjectFamilies) === JSON.stringify(fs.selectedObjectFamilies));
    check(`E: target '${sid}' spaceType matches final-prompts`, t.spaceType === fs.spaceType);
    check(`E: target '${sid}' cameraDistance matches final-prompts`, t.cameraDistance === fs.cameraDistance);
    check(`E: target '${sid}' finalPrompt matches final-prompts (exact consume)`, t.finalPrompt === fs.finalPrompt);
    check(`E: target '${sid}' negativePromptRules matches final-prompts`, JSON.stringify(t.negativePromptRules) === JSON.stringify(fs.negativePromptRules));
    check(`E: target '${sid}' overlayPolicy matches final-prompts`, JSON.stringify(t.overlayPolicy) === JSON.stringify(fs.overlayPolicy));
    check(`E: target '${sid}' repetitionControlApplied matches final-prompts`, JSON.stringify(t.repetitionControlApplied) === JSON.stringify(fs.repetitionControlApplied));
    check(`E: target '${sid}' qaExpectations matches final-prompts`, JSON.stringify(t.qaExpectations) === JSON.stringify(fs.qaExpectations));
  }
  if (pl) {
    check(`E: target '${sid}' graphicLayerPlan matches visual plan`, JSON.stringify(t.graphicLayerPlan) === JSON.stringify(pl.graphicLayerPlan));
  }
  check(`E: target '${sid}' requestStatus === pending_owner_gate_not_submitted`, t.requestStatus === "pending_owner_gate_not_submitted");
}

// ═══════════════════════════════════════════════════════════════════════════
// § F. exact number/date/source text 금지 정책이 scene별로 포함
// ═══════════════════════════════════════════════════════════════════════════
for (const t of targets) {
  const sid = t.sceneId;
  const op = t.overlayPolicy || {};
  check(`F: target '${sid}' overlayPolicy.exactValuesInImage === false`, op.exactValuesInImage === false);
  check(`F: target '${sid}' overlayPolicy.deterministicOverlayOwnsExactValues === true`, op.deterministicOverlayOwnsExactValues === true);
  const npr = t.negativePromptRules || [];
  check(`F: target '${sid}' negativePromptRules에 exact numbers/dates/source labels 금지 포함`,
    npr.some(r => r.includes("no exact numbers, dates, or source labels")));
  check(`F: target '${sid}' negativePromptRules에 full-screen data card 금지 포함`,
    npr.some(r => r.includes("full-screen data card")));
  check(`F: target '${sid}' negativePromptRules에 face-centered stock-photo 금지 포함`,
    npr.some(r => r.includes("face-centered stock-photo")));
  check(`F: target '${sid}' negativePromptRules에 wood-table+hand+smartphone+notebook+coffee 수렴 금지 포함`,
    npr.some(r => r.includes("wood-table + hand + smartphone + notebook + coffee")));
}

// ═══════════════════════════════════════════════════════════════════════════
// § G. 고정 anchor exclusion 부재 + referenceCandidates는 exclusion 아님
// ═══════════════════════════════════════════════════════════════════════════
check("G-01: pack에 approvedAnchorRefs 키 없음 (고정 anchor exclusion 부재)", !("approvedAnchorRefs" in pack));
const refCandidates = pack.referenceCandidates || [];
check("G-02: referenceCandidates is array", Array.isArray(refCandidates));
check("G-03: referenceCandidates 길이 === 2 (기존 Scene 1/2)", refCandidates.length === 2);
const refRoles = refCandidates.map(r => r.sceneRole);
check("G-04: referenceCandidates에 scene_1_hook 포함", refRoles.includes("scene_1_hook"));
check("G-05: referenceCandidates에 scene_2_signal 포함", refRoles.includes("scene_2_signal"));
check("G-06: 모든 referenceCandidate.excludedFromGenerationTargets === false (exclusion 아님)",
  refCandidates.every(r => r.excludedFromGenerationTargets === false));
check("G-07: 모든 referenceCandidate.reuseForced === false (reuse 강제 아님)",
  refCandidates.every(r => r.reuseForced === false));
check("G-08: 모든 referenceCandidate.requiresRecheckUnderNewVisualRule === true (재검수 대상)",
  refCandidates.every(r => r.requiresRecheckUnderNewVisualRule === true));
// referenceCandidate role이 실제로 generationTargets에 포함되어 있는지 (exclusion이 아님을 교차 검증)
for (const role of refRoles) {
  check(`G-09: referenceCandidate role '${role}' is ALSO a generation target (not excluded)`,
    targets.some(t => t.sceneRole === role));
}
// excludedFromGenerationTargets=true 같은 고정 exclusion이 어디에도 없는지
const packJson = JSON.stringify(pack);
check("G-10: pack 어디에도 excludedFromGenerationTargets:true 없음", !/"excludedFromGenerationTargets":\s*true/.test(packJson));

// ── compatibilityAudit: 짧고 legacyAnchorsAutoPass=false ───────────────────
const ca = pack.compatibilityAudit || {};
check("G-11: compatibilityAudit 존재", typeof ca === "object" && ca !== null);
check("G-12: compatibilityAudit.legacyAnchorsAutoPass === false (자동 통과 아님)", ca.legacyAnchorsAutoPass === false);
check("G-13: compatibilityAudit.reasons 배열, 비어있지 않음", Array.isArray(ca.reasons) && ca.reasons.length > 0);
check("G-14: compatibilityAudit.conclusion 존재", typeof ca.conclusion === "string" && ca.conclusion.length > 0);

// ═══════════════════════════════════════════════════════════════════════════
// § H. full-set 반복 수렴 방지 evidence (Scene 1~6 전체)
// ═══════════════════════════════════════════════════════════════════════════
const fre = pack.fullSetRepetitionEvidence || {};
check("H-01: fullSetRepetitionEvidence 존재", typeof fre === "object" && fre !== null);
check("H-02: spaceTypeSequence 길이 === 6", Array.isArray(fre.spaceTypeSequence) && fre.spaceTypeSequence.length === 6);
check("H-03: cameraDistanceSequence 길이 === 6", Array.isArray(fre.cameraDistanceSequence) && fre.cameraDistanceSequence.length === 6);
check("H-04: objectFamilySequence 길이 === 6", Array.isArray(fre.objectFamilySequence) && fre.objectFamilySequence.length === 6);
check("H-05: visualCategorySequence 길이 === 6", Array.isArray(fre.visualCategorySequence) && fre.visualCategorySequence.length === 6);
check("H-06: woodTableNotebookCoffeeHandComboDetected === false (수렴 미발생)", fre.woodTableNotebookCoffeeHandComboDetected === false);
check("H-07: scenesWithPlanningRepeat === [6] (scene6 planning 반복)",
  JSON.stringify(fre.scenesWithPlanningRepeat) === JSON.stringify([6]));
// scene6의 planning 반복은 fullSetRepetitionEvidence와 일치해야 함
const t6 = targets.find(t => t.sceneOrder === 6);
check("H-08: scene6 repetitionControlApplied.adjacentObjectFamilyRepeat === true",
  t6?.repetitionControlApplied?.adjacentObjectFamilyRepeat === true);
check("H-09: scene6 repetitionControlApplied.planningRepeatAllowedWithinLimit === true",
  t6?.repetitionControlApplied?.planningRepeatAllowedWithinLimit === true);
check("H-10: scene6 repetitionControlApplied.finalPromptCompositionSeparationRequired === true",
  t6?.repetitionControlApplied?.finalPromptCompositionSeparationRequired === true);

// ═══════════════════════════════════════════════════════════════════════════
// § I. forbidden generation fields ABSENT (deep scan, excl. boundary flags)
// ═══════════════════════════════════════════════════════════════════════════
// executionBoundaries는 openaiRequestBodyGenerated:false 같은 boundary 선언 flag를 갖는다.
// deep scan은 boundary 선언 영역을 제외한 실제 산출 영역에서 수행한다.
const forbiddenFieldNames = ["openaiRequestBody", "imageUrl", "generatedImagePath", "generatedPrompt", "chatgptPrompt"];
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
  referenceCandidates: pack.referenceCandidates,
  generationTargets: pack.generationTargets,
  fullSetRepetitionEvidence: pack.fullSetRepetitionEvidence,
  packAudit: pack.packAudit,
  compatibilityAudit: pack.compatibilityAudit,
};
const scanJson = JSON.stringify(scanTarget);
const allKeys = new Set();
collectKeys(scanTarget, allKeys);
for (const f of forbiddenFieldNames) {
  check(`I: refCandidates/targets/evidence/audit has NO '${f}' data key`, !allKeys.has(f));
  check(`I: refCandidates/targets/evidence/audit JSON has no '"${f}"' data key token`, !scanJson.includes(`"${f}":`));
}
// boundary 선언 영역의 openaiRequestBodyGenerated는 반드시 false flag.
check("I: executionBoundaries.openaiRequestBodyGenerated is a false boundary flag",
  eb.openaiRequestBodyGenerated === false && typeof eb.openaiRequestBodyGenerated === "boolean");

// ═══════════════════════════════════════════════════════════════════════════
// § J. builder + guard: no network/runner imports + no exec code (self-guard)
// ═══════════════════════════════════════════════════════════════════════════
const forbiddenImports = ["openai", "playwright", "node-fetch", "child_process"];
for (const imp of forbiddenImports) {
  const pat = new RegExp(`(import|require)[^\\n]*['"\`]${imp}['"\`]`);
  check(`J: builder does NOT import/require '${imp}'`, !pat.test(builderText));
  check(`J: guard does NOT import/require '${imp}'`, !pat.test(selfText));
}
check("J: builder does NOT import node:http/https",
  !/import[^\n]*['"`]node:https?['"`]/.test(builderText) && !/require\(['"`]https?['"`]\)/.test(builderText));
check("J: guard does NOT import node:http/https",
  !/import[^\n]*['"`]node:https?['"`]/.test(selfText) && !/require\(['"`]https?['"`]\)/.test(selfText));
check("J: builder does NOT call fetch(", !/\bfetch\s*\(/.test(builderText));
check("J: guard does NOT import fetch runner (node-fetch checked above)",
  !/(import|require)[^\n]*['"`]node-fetch['"`]/.test(selfText));
// builder가 chatgpt/playwright 실행 코드를 만들지 않는지
check("J: builder does NOT contain chatgpt run helper import", !/(import|require)[^\n]*chatgpt/i.test(builderText));
// builder가 openaiRequestBody/imageUrl/generatedImagePath를 실제로 할당하지 않는지
check("J: builder does NOT assign openaiRequestBody field", !/openaiRequestBody\s*[:=]\s*[^f]/.test(builderText.replace(/openaiRequestBodyGenerated/g, "")));
check("J: builder does NOT assign imageUrl field", !/\bimageUrl\s*[:=]/.test(builderText));
check("J: builder does NOT assign generatedImagePath field", !/\bgeneratedImagePath\s*[:=]/.test(builderText));

// ═══════════════════════════════════════════════════════════════════════════
// § K. builder: full-set driven by final-prompts, not hardcoded scene props
// ═══════════════════════════════════════════════════════════════════════════
check("K-01: builder consumes final-prompts via finalScenes.map (contract-driven)",
  /finalScenes\.map\(/.test(builderText));
check("K-02: builder validates final scene count === 6 (FATAL on mismatch)",
  /finalScenes\.length !== 6/.test(builderText) && /process\.exit\(2\)/.test(builderText));
check("K-03: builder validates expected orders [1,2,3,4,5,6] (FATAL on mismatch)",
  /expectedOrders/.test(builderText) && /\[1, 2, 3, 4, 5, 6\]/.test(builderText));
check("K-04: builder marks referenceCandidates excludedFromGenerationTargets:false",
  /excludedFromGenerationTargets:\s*false/.test(builderText));
check("K-05: builder does NOT emit approvedAnchorRefs", !/approvedAnchorRefs\s*[:=]/.test(builderText));

// ═══════════════════════════════════════════════════════════════════════════
// § L. packAudit
// ═══════════════════════════════════════════════════════════════════════════
const audit = pack.packAudit || {};
check("L-01: packAudit.generationTargetCount === 6", audit.generationTargetCount === 6);
check("L-02: packAudit.generationTargetOrders === [1,2,3,4,5,6]", JSON.stringify(audit.generationTargetOrders) === JSON.stringify([1, 2, 3, 4, 5, 6]));
check("L-03: packAudit.scene1Role === scene_1_hook", audit.scene1Role === "scene_1_hook");
check("L-04: packAudit.scene2Role === scene_2_signal", audit.scene2Role === "scene_2_signal");
check("L-05: packAudit.referenceCandidatesExcludeGeneration === false", audit.referenceCandidatesExcludeGeneration === false);
check("L-06: packAudit.allTargetsHaveFinalPrompt === true", audit.allTargetsHaveFinalPrompt === true);
check("L-07: packAudit.allTargetsPendingOwnerGate === true", audit.allTargetsPendingOwnerGate === true);

// ═══════════════════════════════════════════════════════════════════════════
// Result Summary
// ═══════════════════════════════════════════════════════════════════════════
const pass = results.filter(r => r.pass);
const fail = results.filter(r => !r.pass);

console.log(`\n══════════════════════════════════════════════════════════`);
console.log(`  SCENE 1~6 FULL-SET IMAGE REQUEST PACK v2 — STRUCTURE GUARD`);
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
  console.log(`GUARD OK: scene 1~6 full-set request pack structure + reference-candidate-not-excluded + supersedes intact (${pass.length}/${results.length}).`);
  process.exit(0);
}
