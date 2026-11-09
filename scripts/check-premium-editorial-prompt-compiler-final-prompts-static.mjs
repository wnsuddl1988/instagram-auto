#!/usr/bin/env node
// ──────────────────────────────────────────────────────────────────────────
// check-premium-editorial-prompt-compiler-final-prompts-static.mjs
//
// FINAL PROMPTS — PROMPT TEXT STRUCTURE GUARD
// (NOT an image-quality judge, NOT a prompt-quality judge)
//
// 이 guard는 final prompts fixture가:
//   - compiled visual plan과 Rule Contract를 올바르게 소비했는지
//   - scene별 finalPrompt가 role/category/space/camera/family/overlay 정책을 반영했는지
//   - forbidden object/composition/repetition이 negative rule 또는 finalPrompt에 반영됐는지
//   - scene5/6 planning repeat 구도 분리가 반영됐는지
//   - scene별 finalPrompt가 서로 다르고 인접 scene이 과도하게 유사하지 않은지
//   - 이미지/네트워크/openaiRequestBody 생성 필드가 없는지
// 를 구조적으로 검증한다.
//
// 검증 대상:
//   1) scripts/fixtures/premium-editorial-visual-system.rule-contract.v1.json
//   2) scripts/fixtures/premium-editorial-prompt-compiler-compiled-visual-plan.v1.json
//   3) scripts/fixtures/premium-editorial-prompt-compiler-final-prompts.v1.json
//   4) scripts/build-premium-editorial-prompt-compiler-final-prompts-v1.mjs (forbidden import)
//   5) 이 스크립트 자체 (forbidden import)
// ──────────────────────────────────────────────────────────────────────────

import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..");

const CONTRACT_PATH = join(REPO_ROOT, "scripts", "fixtures", "premium-editorial-visual-system.rule-contract.v1.json");
const PLAN_PATH = join(REPO_ROOT, "scripts", "fixtures", "premium-editorial-prompt-compiler-compiled-visual-plan.v1.json");
const FINAL_PATH = join(REPO_ROOT, "scripts", "fixtures", "premium-editorial-prompt-compiler-final-prompts.v1.json");
const BUILDER_PATH = join(REPO_ROOT, "scripts", "build-premium-editorial-prompt-compiler-final-prompts-v1.mjs");
const SELF_PATH = join(REPO_ROOT, "scripts", "check-premium-editorial-prompt-compiler-final-prompts-static.mjs");

const results = [];
function check(name, condition, detail = "") {
  results.push({ name, pass: !!condition, detail });
}

// ── load ──────────────────────────────────────────────────────────────────
let contract, plan, final, builderText, selfText;
try {
  contract = JSON.parse(readFileSync(CONTRACT_PATH, "utf8"));
} catch (e) {
  console.error(`FATAL: cannot read/parse Rule Contract: ${e.message}`);
  process.exit(2);
}
try {
  plan = JSON.parse(readFileSync(PLAN_PATH, "utf8"));
} catch (e) {
  console.error(`FATAL: cannot read/parse compiled visual plan: ${e.message}`);
  process.exit(2);
}
try {
  final = JSON.parse(readFileSync(FINAL_PATH, "utf8"));
} catch (e) {
  console.error(`FATAL: cannot read/parse final prompts: ${e.message}`);
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
const roleMap = new Map((contract.sceneRoleContract?.roles || []).map(r => [r.id, r]));
const catMap = new Map((contract.visualCategoryPool?.categories || []).map(c => [c.id, c]));
const famMap = new Map((contract.objectFamilyPool?.families || []).map(f => [f.id, f]));
const planScenes = (plan.scenes || []).slice().sort((a, b) => a.order - b.order);
const planByOrder = new Map(planScenes.map(s => [s.order, s]));

// ═══════════════════════════════════════════════════════════════════════════
// § A. File existence + schema identity
// ═══════════════════════════════════════════════════════════════════════════

check("A-01: final prompts fixture 존재", existsSync(FINAL_PATH), FINAL_PATH);
check("A-02: builder 파일 존재", existsSync(BUILDER_PATH), BUILDER_PATH);
check("A-03: final schemaVersion 일치",
  final.schemaVersion === "money_shorts_prompt_compiler_final_prompts_v1", final.schemaVersion);
check("A-04: final status 일치",
  final.status === "deterministic_final_prompt_text_only", final.status);
check("A-05: contract schemaVersion 일치",
  contract.schemaVersion === "money_shorts_visual_system_rule_contract_v1", contract.schemaVersion);
check("A-06: compiled visual plan schemaVersion 일치",
  plan.schemaVersion === "money_shorts_prompt_compiler_compiled_visual_plan_v1", plan.schemaVersion);

// ═══════════════════════════════════════════════════════════════════════════
// § B. sourceRefs cross-link
// ═══════════════════════════════════════════════════════════════════════════

const srcRefs = final.sourceRefs || {};
check("B-01: sourceRefs.ruleContract.path 참조",
  srcRefs.ruleContract?.path === "scripts/fixtures/premium-editorial-visual-system.rule-contract.v1.json");
check("B-02: sourceRefs.ruleContract.schemaVersion 일치",
  srcRefs.ruleContract?.schemaVersion === contract.schemaVersion);
check("B-03: sourceRefs.ruleContract.visualProfileId 일치",
  srcRefs.ruleContract?.visualProfileId === contract.visualProfileId);
check("B-04: sourceRefs.compiledVisualPlan.path 참조",
  srcRefs.compiledVisualPlan?.path === "scripts/fixtures/premium-editorial-prompt-compiler-compiled-visual-plan.v1.json");
check("B-05: sourceRefs.compiledVisualPlan.schemaVersion 일치",
  srcRefs.compiledVisualPlan?.schemaVersion === plan.schemaVersion);
check("B-06: sourceRefs.boundaryDoc 참조",
  srcRefs.boundaryDoc === "_ai/MONEY_SHORTS_OS_PROMPT_COMPILER_V1_BOUNDARY.md");

// ═══════════════════════════════════════════════════════════════════════════
// § C. generationBoundaries (finalPromptText true; image/network/openaiRequestBody false)
// ═══════════════════════════════════════════════════════════════════════════

const gb = final.generationBoundaries || {};
check("C-01: generationBoundaries.finalPromptText === true", gb.finalPromptText === true);
check("C-02: generationBoundaries.image === false", gb.image === false);
check("C-03: generationBoundaries.network === false", gb.network === false);
check("C-04: generationBoundaries.openaiRequestBody === false", gb.openaiRequestBody === false);
check("C-05: generationBoundaries.note 존재", typeof gb.note === "string" && gb.note.length > 0);

// ═══════════════════════════════════════════════════════════════════════════
// § D. scenes structure (exactly 6, required fields)
// ═══════════════════════════════════════════════════════════════════════════

const scenes = final.scenes || [];
check("D-01: scenes 배열 존재", Array.isArray(scenes));
check("D-02: scenes 정확히 6개", scenes.length === 6, String(scenes.length));

const requiredSceneFields = [
  "sceneId", "order", "sceneRole", "selectedVisualCategory", "selectedObjectFamilies",
  "finalPrompt", "promptFixedPart", "promptVariablePart", "negativePromptRules",
  "overlayPolicy", "repetitionControlApplied", "qaExpectations",
];
for (const scene of scenes) {
  const label = scene.sceneId || `order_${scene.order}`;
  for (const field of requiredSceneFields) {
    check(`D: scene '${label}' has required field '${field}'`,
      Object.prototype.hasOwnProperty.call(scene, field) && scene[field] != null);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// § E. scene role/category/objectFamilies match compiled visual plan
// ═══════════════════════════════════════════════════════════════════════════

check("E-01: final scene count matches compiled plan scene count",
  scenes.length === planScenes.length, `${scenes.length} vs ${planScenes.length}`);

const finalByOrder = new Map(scenes.map(s => [s.order, s]));
for (const ps of planScenes) {
  const fs = finalByOrder.get(ps.order);
  const label = ps.sceneId;
  check(`E: scene order ${ps.order} present in final prompts`, !!fs);
  if (!fs) continue;
  check(`E: scene '${label}' sceneRole matches compiled plan`,
    fs.sceneRole === ps.sceneRole, `${fs.sceneRole} vs ${ps.sceneRole}`);
  check(`E: scene '${label}' selectedVisualCategory matches compiled plan`,
    fs.selectedVisualCategory === ps.selectedVisualCategory);
  check(`E: scene '${label}' selectedObjectFamilies matches compiled plan`,
    JSON.stringify(fs.selectedObjectFamilies) === JSON.stringify(ps.selectedObjectFamilies));
  check(`E: scene '${label}' spaceType matches compiled plan`,
    fs.spaceType === ps.spaceType);
  check(`E: scene '${label}' cameraDistance matches compiled plan`,
    fs.cameraDistance === ps.cameraDistance);
}

// role/category/family도 Rule Contract pool에 존재해야 한다
for (const fs of scenes) {
  const label = fs.sceneId;
  check(`E: scene '${label}' sceneRole exists in Rule Contract`, roleMap.has(fs.sceneRole));
  check(`E: scene '${label}' selectedVisualCategory exists in Rule Contract pool`,
    catMap.has(fs.selectedVisualCategory));
  for (const famId of (fs.selectedObjectFamilies || [])) {
    check(`E: scene '${label}' objectFamily '${famId}' exists in Rule Contract pool`, famMap.has(famId));
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// § F. finalPrompt non-empty + sufficiently long
// ═══════════════════════════════════════════════════════════════════════════

const MIN_PROMPT_LEN = 400;
for (const fs of scenes) {
  const label = fs.sceneId;
  check(`F: scene '${label}' finalPrompt is non-empty string`,
    typeof fs.finalPrompt === "string" && fs.finalPrompt.trim().length > 0);
  check(`F: scene '${label}' finalPrompt length >= ${MIN_PROMPT_LEN}`,
    typeof fs.finalPrompt === "string" && fs.finalPrompt.length >= MIN_PROMPT_LEN,
    String(fs.finalPrompt?.length));
  check(`F: scene '${label}' promptFixedPart is non-empty string`,
    typeof fs.promptFixedPart === "string" && fs.promptFixedPart.length > 0);
  check(`F: scene '${label}' promptVariablePart is non-empty string`,
    typeof fs.promptVariablePart === "string" && fs.promptVariablePart.length > 0);
}

// ═══════════════════════════════════════════════════════════════════════════
// § G. finalPrompt reflects sceneRole intent / category / space / camera
// ═══════════════════════════════════════════════════════════════════════════

// sceneRole 목적이 반영됐는지: role별 intent keyword
const roleIntentKeyword = {
  scene_1_hook: "Hook intent",
  scene_2_signal: "Signal intent",
  scene_3_context: "Context intent",
  scene_4_life_impact: "Life-impact intent",
  scene_5_watch_point: "Watch-point intent",
  scene_6_action_closing: "Action-closing intent",
};
const spaceKeyword = {
  indoor_personal: "personal indoor",
  indoor_desk: "indoor desk",
  indoor_living: "indoor living",
  outdoor_urban: "outdoor urban",
};
const cameraKeyword = {
  close_up: "close-up",
  medium: "medium shot",
  wide: "wide shot",
};
for (const fs of scenes) {
  const label = fs.sceneId;
  const fp = fs.finalPrompt || "";
  check(`G: scene '${label}' finalPrompt reflects sceneRole intent`,
    fp.includes(roleIntentKeyword[fs.sceneRole] || "###NO###"));
  check(`G: scene '${label}' finalPrompt references its selectedVisualCategory`,
    fp.includes(fs.selectedVisualCategory));
  check(`G: scene '${label}' finalPrompt reflects spaceType`,
    fp.includes(spaceKeyword[fs.spaceType] || "###NO###"));
  check(`G: scene '${label}' finalPrompt reflects cameraDistance`,
    fp.includes(cameraKeyword[fs.cameraDistance] || "###NO###"));
}

// ═══════════════════════════════════════════════════════════════════════════
// § H. finalPrompt reflects at least one object family meaning
// ═══════════════════════════════════════════════════════════════════════════

for (const fs of scenes) {
  const label = fs.sceneId;
  const fp = fs.finalPrompt || "";
  const families = fs.selectedObjectFamilies || [];
  // family id 자체 또는 member 중 하나가 finalPrompt에 등장해야 한다 (family 의미 반영)
  let reflected = false;
  for (const famId of families) {
    if (fp.includes(famId)) { reflected = true; break; }
    const fam = famMap.get(famId);
    if (fam && (fam.members || []).some(m => fp.toLowerCase().includes(m.toLowerCase()))) {
      reflected = true; break;
    }
  }
  check(`H: scene '${label}' finalPrompt reflects at least one object family meaning`, reflected);
  // 또한 "visual family" 또는 "varied within the family" 의도가 반영됐는지 (고정 오브젝트표 금지 의도)
  check(`H: scene '${label}' finalPrompt treats objects as a visual family (not a fixed single prop)`,
    fp.includes("visual family") || fp.includes("varied within the family"));
}

// ═══════════════════════════════════════════════════════════════════════════
// § I. forbiddenObjects / forbiddenCompositions / forbiddenRepetitionNotes reflected
// ═══════════════════════════════════════════════════════════════════════════

for (const ps of planScenes) {
  const fs = finalByOrder.get(ps.order);
  if (!fs) continue;
  const label = ps.sceneId;
  const negText = (fs.negativePromptRules || []).join(" | ");
  const fp = fs.finalPrompt || "";
  // 각 forbiddenObject가 negativePromptRules 또는 finalPrompt에 반영
  for (const fo of (ps.forbiddenObjects || [])) {
    check(`I: scene '${label}' forbiddenObject '${fo}' reflected in negativePromptRules or finalPrompt`,
      negText.includes(fo) || fp.includes(fo));
  }
  for (const fc of (ps.forbiddenCompositions || [])) {
    check(`I: scene '${label}' forbiddenComposition '${fc}' reflected in negativePromptRules or finalPrompt`,
      negText.includes(fc) || fp.includes(fc));
  }
  // forbiddenRepetitionNotes가 repetitionControlApplied에 보존
  const rca = fs.repetitionControlApplied || {};
  check(`I: scene '${label}' repetitionControlApplied carries forbiddenRepetitionNotes`,
    Array.isArray(rca.forbiddenRepetitionNotes) && rca.forbiddenRepetitionNotes.length > 0);
}

// ═══════════════════════════════════════════════════════════════════════════
// § J. overlayPolicy reflects deterministic overlay principle
// ═══════════════════════════════════════════════════════════════════════════

for (const fs of scenes) {
  const label = fs.sceneId;
  const op = fs.overlayPolicy || {};
  check(`J: scene '${label}' overlayPolicy.exactValuesInImage === false`,
    op.exactValuesInImage === false);
  check(`J: scene '${label}' overlayPolicy.deterministicOverlayOwnsExactValues === true`,
    op.deterministicOverlayOwnsExactValues === true);
  check(`J: scene '${label}' overlayPolicy.ownedByOverlay is non-empty array`,
    Array.isArray(op.ownedByOverlay) && op.ownedByOverlay.length > 0);
  check(`J: scene '${label}' overlayPolicy.note mentions overlay`,
    typeof op.note === "string" && op.note.includes("overlay"));
}

// ═══════════════════════════════════════════════════════════════════════════
// § K. finalPrompt policy phrases — exact values ban / data card / stock / convergence
// ═══════════════════════════════════════════════════════════════════════════

for (const fs of scenes) {
  const label = fs.sceneId;
  const fp = (fs.finalPrompt || "").toLowerCase();
  check(`K: scene '${label}' finalPrompt bans exact values in image`,
    fp.includes("do not render any exact numbers") || fp.includes("do not bake them into this image") || fp.includes("no exact numbers"));
  check(`K: scene '${label}' finalPrompt mentions deterministic overlay`,
    fp.includes("deterministic overlay"));
  check(`K: scene '${label}' finalPrompt bans full-screen data card`,
    fp.includes("full-screen data card") || fp.includes("no full-screen data card"));
  check(`K: scene '${label}' finalPrompt bans face-centered stock-photo look`,
    fp.includes("not a posed stock photo") || fp.includes("face-centered stock-photo"));
  check(`K: scene '${label}' finalPrompt bans wood-table/hand/smartphone/note/coffee convergence`,
    fp.includes("wood-table + hand + smartphone + notebook + coffee"));
  check(`K: scene '${label}' finalPrompt enforces face-minimized`,
    fp.includes("face-minimized"));
  check(`K: scene '${label}' finalPrompt enforces subtitle safe-zone`,
    fp.includes("subtitle safe-zone"));
  check(`K: scene '${label}' finalPrompt bans repeated previous-scene look`,
    fp.includes("no repeated scene look from the previous scene") || fp.includes("must not look alike"));
}

// ═══════════════════════════════════════════════════════════════════════════
// § L. scene5/6 planning repeat mitigation reflected
// ═══════════════════════════════════════════════════════════════════════════

const final5 = finalByOrder.get(5);
const final6 = finalByOrder.get(6);
check("L-01: scene5 and scene6 exist in final prompts", !!final5 && !!final6);
check("L-02: scene5 and scene6 share planning_objects family (the repeat case)",
  !!final5 && !!final6 &&
  (final5.selectedObjectFamilies || []).includes("planning_objects") &&
  (final6.selectedObjectFamilies || []).includes("planning_objects"));
check("L-03: scene6 repetitionControlApplied.adjacentObjectFamilyRepeat === true",
  final6?.repetitionControlApplied?.adjacentObjectFamilyRepeat === true);
check("L-04: scene6 repetitionControlApplied.planningRepeatAllowedWithinLimit === true",
  final6?.repetitionControlApplied?.planningRepeatAllowedWithinLimit === true);
check("L-05: scene6 repetitionControlApplied.finalPromptCompositionSeparationRequired === true",
  final6?.repetitionControlApplied?.finalPromptCompositionSeparationRequired === true);
check("L-06: scene6 repetitionControlApplied has compositionSeparationDirective",
  typeof final6?.repetitionControlApplied?.compositionSeparationDirective === "string" &&
  final6.repetitionControlApplied.compositionSeparationDirective.length > 0);
const s6fp = (final6?.finalPrompt || "");
check("L-07: scene6 finalPrompt mentions repeat within allowed limit",
  s6fp.includes("within the allowed 2-scene limit") || s6fp.includes("repeats from the previous scene"));
check("L-08: scene6 finalPrompt enforces composition separation",
  s6fp.includes("strong composition separation") || s6fp.includes("must NOT look alike"));
check("L-09: scene6 finalPrompt distinguishes checklist (prev) vs closing/CTA (this)",
  s6fp.includes("checklist") && (s6fp.includes("closing") || s6fp.includes("CTA")));
check("L-10: scene6 finalPrompt notes different space/category/graphic-layer",
  s6fp.includes("Different space, different category, different graphic-layer plan") ||
  (s6fp.includes("different graphic layer role") && s6fp.includes("closing_action_cue")));
// scene5는 watch-point/checklist visual로 표현되어야 한다
const s5fp = (final5?.finalPrompt || "");
check("L-11: scene5 finalPrompt reflects watch-point/checklist intent",
  s5fp.includes("Watch-point intent") || s5fp.includes("checklist_decision_moment"));
// scene5는 직전 scene과 family repeat가 아님 (scene4=city_economy_objects)
check("L-12: scene5 repetitionControlApplied.adjacentObjectFamilyRepeat === false",
  final5?.repetitionControlApplied?.adjacentObjectFamilyRepeat === false);

// ═══════════════════════════════════════════════════════════════════════════
// § M. scenes distinct + adjacent similarity not excessive
// ═══════════════════════════════════════════════════════════════════════════

const finalPrompts = scenes.map(s => s.finalPrompt || "");
check("M-01: all finalPrompts are pairwise distinct (no exact equality)",
  new Set(finalPrompts).size === finalPrompts.length, `${new Set(finalPrompts).size}/${finalPrompts.length}`);

// 인접 scene의 variable part가 충분히 다른지: category/space/family 차이 기준
const orderedFinal = scenes.slice().sort((a, b) => a.order - b.order);
for (let i = 1; i < orderedFinal.length; i++) {
  const prev = orderedFinal[i - 1];
  const cur = orderedFinal[i];
  const label = `${prev.sceneId}->${cur.sceneId}`;
  // 인접 scene은 category가 달라야 한다 (scene_category_must_differ)
  check(`M: adjacent ${label} have different selectedVisualCategory`,
    prev.selectedVisualCategory !== cur.selectedVisualCategory,
    `${prev.selectedVisualCategory} vs ${cur.selectedVisualCategory}`);
  // 인접 scene은 promptVariablePart가 exact-equal이면 안 됨
  check(`M: adjacent ${label} promptVariablePart not exactly equal`,
    prev.promptVariablePart !== cur.promptVariablePart);
  // 인접 scene은 space/category/family 중 최소 하나가 달라야 한다
  const spaceDiff = prev.spaceType !== cur.spaceType;
  const catDiff = prev.selectedVisualCategory !== cur.selectedVisualCategory;
  const famDiff = JSON.stringify(prev.selectedObjectFamilies) !== JSON.stringify(cur.selectedObjectFamilies);
  check(`M: adjacent ${label} differ in space/category/family (at least one)`,
    spaceDiff || catDiff || famDiff);
}

// finalPrompt가 모두 같은 템플릿만 반복하지 않는지: variable part가 6개 모두 distinct
const varParts = scenes.map(s => s.promptVariablePart || "");
check("M-99: all promptVariablePart distinct (not single repeated template)",
  new Set(varParts).size === varParts.length, `${new Set(varParts).size}/${varParts.length}`);

// ═══════════════════════════════════════════════════════════════════════════
// § N. forbidden generation fields ABSENT (deep scan)
// ═══════════════════════════════════════════════════════════════════════════

// 주의: generationBoundaries는 openaiRequestBody:false 같은 boundary 선언 flag를 갖는다.
// 그 선언 키 자체는 정상이며(§ C-04에서 false로 검증함), 실제 데이터 산출 필드로
// 등장하는 것만 금지한다. 따라서 deep scan은 generationBoundaries를 제외한 영역
// (scenes + promptCompilerAudit + sourceRefs)에서만 수행한다.
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
// scan target: generationBoundaries 선언 블록 제외한 실제 산출 영역.
const scanTarget = {
  scenes: final.scenes,
  promptCompilerAudit: final.promptCompilerAudit,
  sourceRefs: final.sourceRefs,
};
const scanJson = JSON.stringify(scanTarget);
const allKeys = new Set();
collectKeys(scanTarget, allKeys);

for (const f of forbiddenFieldNames) {
  check(`N: scenes/audit has NO '${f}' data key (deep scan, excl. boundary flags)`, !allKeys.has(f));
  check(`N: scenes/audit JSON has no '"${f}"' data key token`, !scanJson.includes(`"${f}":`));
}
// boundary 선언 영역의 openaiRequestBody는 반드시 false flag여야 한다 (값 산출이 아님).
check("N: generationBoundaries.openaiRequestBody is a false boundary flag (not a data payload)",
  final.generationBoundaries?.openaiRequestBody === false &&
  typeof final.generationBoundaries.openaiRequestBody === "boolean");

// ═══════════════════════════════════════════════════════════════════════════
// § O. builder + guard: no network/runner imports
// ═══════════════════════════════════════════════════════════════════════════

const forbiddenImports = ["openai", "playwright", "node-fetch", "child_process"];
for (const imp of forbiddenImports) {
  const pat = new RegExp(`(import|require)[^\\n]*['"\`]${imp}['"\`]`);
  check(`O: builder does NOT import/require '${imp}'`, !pat.test(builderText));
  check(`O: guard does NOT import/require '${imp}'`, !pat.test(selfText));
}
check("O: builder does NOT import node:http/https",
  !/import[^\n]*['"`]node:https?['"`]/.test(builderText) && !/require\(['"`]https?['"`]\)/.test(builderText));
check("O: guard does NOT import node:http/https",
  !/import[^\n]*['"`]node:https?['"`]/.test(selfText) && !/require\(['"`]https?['"`]\)/.test(selfText));
// fetch usage in builder (실행 호출 점검). guard 자체는 검증 패턴 텍스트에
// 'fetch(' 리터럴을 포함하므로 self-match를 피하고 import/require 부재로만 검증한다.
check("O: builder does NOT call fetch(",
  !/\bfetch\s*\(/.test(builderText));
check("O: guard does NOT import fetch runner (node-fetch checked above)",
  !/(import|require)[^\n]*['"`]node-fetch['"`]/.test(selfText));

// ═══════════════════════════════════════════════════════════════════════════
// § P. builder: text-only, no image/network runner semantics
// ═══════════════════════════════════════════════════════════════════════════

// builder가 compiled visual plan을 소비(loop)하는지
check("P-01: builder iterates compiled visual plan scenes",
  /for\s*\(\s*const\s+\w+\s+of\s+planScenes\b/.test(builderText));
// builder가 fixed/variable 구조를 사용하는지
check("P-02: builder defines a FIXED_PART (fixed ~80%)",
  /FIXED_PART\b/.test(builderText));
// builder가 finalPrompt를 생성하는지
check("P-03: builder writes finalPrompt field",
  /finalPrompt\b/.test(builderText));
// builder가 family를 '고정 오브젝트표'가 아니라 family 의미로 변환하는지
check("P-04: builder treats object family as a visual family (objectFamilyPhrase)",
  /objectFamilyPhrase\b/.test(builderText) && /visual family/.test(builderText));
// builder가 overlay 원칙을 명시하는지
check("P-05: builder emits deterministic overlay note",
  /deterministic overlay/.test(builderText));
// builder가 이미지 생성 요청 의미 단어를 쓰지 않는지 (generateImage / requestImage 등)
check("P-06: builder has no image-generation call semantics",
  !/generateImage|requestImage|createImage|images\.generate/.test(builderText));

// ═══════════════════════════════════════════════════════════════════════════
// § Q. promptCompilerAudit consistency
// ═══════════════════════════════════════════════════════════════════════════

const audit = final.promptCompilerAudit || {};
check("Q-01: promptCompilerAudit.sceneCount === 6", audit.sceneCount === 6, String(audit.sceneCount));
check("Q-02: promptCompilerAudit.allScenesHaveFinalPrompt === true",
  audit.allScenesHaveFinalPrompt === true);
check("Q-03: promptCompilerAudit.allScenesDistinctFinalPrompt === true",
  audit.allScenesDistinctFinalPrompt === true);
check("Q-04: promptCompilerAudit.deterministicOverlayOwnsExactValues === true",
  audit.deterministicOverlayOwnsExactValues === true);
check("Q-05: promptCompilerAudit.exactValuesInImage === false",
  audit.exactValuesInImage === false);
check("Q-06: promptCompilerAudit.fixedPartElements non-empty array",
  Array.isArray(audit.fixedPartElements) && audit.fixedPartElements.length > 0);
check("Q-07: promptCompilerAudit.scenesWithAdjacentFamilyRepeat includes scene 6",
  Array.isArray(audit.scenesWithAdjacentFamilyRepeat) && audit.scenesWithAdjacentFamilyRepeat.includes(6));
// audit이 실제 scenes와 일치
const actualDistinct = new Set(scenes.map(s => s.finalPrompt)).size === scenes.length;
check("Q-08: audit.allScenesDistinctFinalPrompt matches recomputed",
  audit.allScenesDistinctFinalPrompt === actualDistinct);
const actualRepeatOrders = scenes
  .filter(s => s.repetitionControlApplied?.adjacentObjectFamilyRepeat === true)
  .map(s => s.order)
  .sort((a, b) => a - b);
check("Q-09: audit.scenesWithAdjacentFamilyRepeat matches recomputed",
  JSON.stringify((audit.scenesWithAdjacentFamilyRepeat || []).slice().sort((a, b) => a - b)) ===
  JSON.stringify(actualRepeatOrders),
  `${JSON.stringify(audit.scenesWithAdjacentFamilyRepeat)} vs ${JSON.stringify(actualRepeatOrders)}`);

// ═══════════════════════════════════════════════════════════════════════════
// § R. qaExpectations preserved from compiled plan
// ═══════════════════════════════════════════════════════════════════════════

for (const ps of planScenes) {
  const fs = finalByOrder.get(ps.order);
  if (!fs) continue;
  const label = ps.sceneId;
  check(`R: scene '${label}' qaExpectations matches compiled plan`,
    JSON.stringify(fs.qaExpectations) === JSON.stringify(ps.qaExpectations));
}

// ═══════════════════════════════════════════════════════════════════════════
// Result Summary
// ═══════════════════════════════════════════════════════════════════════════

const pass = results.filter(r => r.pass);
const fail = results.filter(r => !r.pass);

console.log(`\n══════════════════════════════════════════════════════════`);
console.log(`  FINAL PROMPTS — PROMPT TEXT STRUCTURE STATIC GUARD`);
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
  console.log(`GUARD OK: final prompts structure + overlay/repetition policy intact (${pass.length}/${results.length}).`);
  process.exit(0);
}
