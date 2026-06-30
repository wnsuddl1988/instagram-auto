#!/usr/bin/env node
// ──────────────────────────────────────────────────────────────────────────
// check-premium-editorial-visual-system-static.mjs
//
// CONTRACT STRUCTURE GUARD (NOT an image-quality judge).
//
// 이 static guard는 "실제 생성 이미지 품질"을 판정하지 않는다.
// 이 guard는 Money Shorts OS Visual System Rule Contract(JSON + 문서 + helper)가
// 하드코딩/고정 오브젝트표/반복 수렴 실패를 막을 "구조"를 갖췄는지만 검증한다.
// 실제 이미지 품질 검수는 다음 샘플 생성 단계에서 별도로 한다.
//
// 검증 대상:
//   1) scripts/fixtures/premium-editorial-visual-system.rule-contract.v1.json
//   2) _ai/MONEY_SHORTS_OS_VISUAL_SYSTEM_V1.md
//   3) scripts/_chatgpt-image-anchor-generate.mjs (실패 Scene 3~6 분기 부재 확인)
// ──────────────────────────────────────────────────────────────────────────

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..");

const JSON_PATH = join(REPO_ROOT, "scripts", "fixtures", "premium-editorial-visual-system.rule-contract.v1.json");
const DOC_PATH = join(REPO_ROOT, "_ai", "MONEY_SHORTS_OS_VISUAL_SYSTEM_V1.md");
const HELPER_PATH = join(REPO_ROOT, "scripts", "_chatgpt-image-anchor-generate.mjs");

let contract = null;
let docText = "";
let helperText = "";

const results = [];
function check(name, condition, detail = "") {
  const pass = !!condition;
  results.push({ name, pass, detail });
}

// ── load ──────────────────────────────────────────────────────────────────
try {
  contract = JSON.parse(readFileSync(JSON_PATH, "utf8"));
} catch (e) {
  console.error(`FATAL: cannot read/parse JSON contract: ${e.message}`);
  process.exit(2);
}
try {
  docText = readFileSync(DOC_PATH, "utf8");
} catch (e) {
  console.error(`FATAL: cannot read doc: ${e.message}`);
  process.exit(2);
}
try {
  helperText = readFileSync(HELPER_PATH, "utf8");
} catch (e) {
  console.error(`FATAL: cannot read helper: ${e.message}`);
  process.exit(2);
}

const C = contract;
const json = JSON.stringify(C);

// ── 1. schema / profile identity ────────────────────────────────────────────
check("[contract] schemaVersion is money_shorts_visual_system_rule_contract_v1",
  C.schemaVersion === "money_shorts_visual_system_rule_contract_v1", C.schemaVersion);
check("[contract] visualProfileId is premium_editorial_life_economy_realism_v2",
  C.visualProfileId === "premium_editorial_life_economy_realism_v2", C.visualProfileId);
check("[contract] declares it is NOT a fixed scene→object mapping table",
  C.notMappingTable && C.notMappingTable.forbiddenPattern === "fixed_scene_to_object_mapping");

// ── 2. approved anchor set (Scene 1 fix + Scene 2 v2) must survive ───────────
const anchors = (C.approvedAnchorSet && C.approvedAnchorSet.anchors) || [];
const hasScene1Fix = anchors.some(a =>
  a.sceneRole === "scene_1_hook" && /scene-01-hook-anchor-fix-v1\.png/.test(a.file || ""));
const hasScene2V2 = anchors.some(a =>
  a.sceneRole === "scene_2_signal" && /scene-02-signal-anchor-v2\.png/.test(a.file || ""));
check("[anchor] approvedAnchorSet present", anchors.length >= 2);
check("[anchor] Scene 1 fixed anchor preserved (scene-01-hook-anchor-fix-v1.png)", hasScene1Fix);
check("[anchor] Scene 2 v2 anchor preserved (scene-02-signal-anchor-v2.png)", hasScene2V2);
check("[anchor] both approved anchors marked owner_approved",
  anchors.filter(a => a.status === "owner_approved").length >= 2);
check("[anchor] consistency basis is space/object/color/light/composition (not face identity)",
  C.approvedAnchorSet && C.approvedAnchorSet.notFaceIdentity === true);
check("[anchor] failed Scene 3~6 v1 direction recorded as deprecated / not main baseline",
  (C.approvedAnchorSet.deprecatedDirections || []).some(d =>
    d.sceneSetId === "ecos-live-yohan-koo-premium-editorial-scenes-3-6-v1" &&
    d.status === "deprecated" && d.notMainBaseline === true));

// ── 3. scene role contract — 6 roles, role-based (not fixed object) ─────────
const roles = (C.sceneRoleContract && C.sceneRoleContract.roles) || [];
const roleIds = roles.map(r => r.id);
const expectedRoles = [
  "scene_1_hook", "scene_2_signal", "scene_3_context",
  "scene_4_life_impact", "scene_5_watch_point", "scene_6_action_closing",
];
check("[role] exactly 6 scene roles", roles.length === 6, String(roles.length));
for (const rid of expectedRoles) {
  check(`[role] role present: ${rid}`, roleIds.includes(rid));
}
check("[role] every role defines what it must communicate (mustConvey/communicates)",
  roles.length > 0 && roles.every(r => (r.communicates || r.mustConvey)));
check("[role] every role flags doesNotFixObject=true (role is not a fixed object)",
  roles.length > 0 && roles.every(r => r.doesNotFixObject === true));

// ── 4. visual category pool (>= 10), with required per-category metadata ─────
const cats = (C.visualCategoryPool && C.visualCategoryPool.categories) || [];
check("[category] visualCategoryPool has >= 10 categories", cats.length >= 10, String(cats.length));
check("[category] every category has id + description",
  cats.length > 0 && cats.every(c => c.id && c.description));
check("[category] every category has usefulForRoles",
  cats.length > 0 && cats.every(c => Array.isArray(c.usefulForRoles) && c.usefulForRoles.length > 0));
check("[category] every category has avoidWhen + overuseRisk",
  cats.length > 0 && cats.every(c => c.avoidWhen && c.overuseRisk));
check("[category] every category has visualExamples",
  cats.length > 0 && cats.every(c => Array.isArray(c.visualExamples) && c.visualExamples.length > 0));
const pinnedCats = cats.filter(c => Array.isArray(c.usefulForRoles) && c.usefulForRoles.length < 2).map(c => c.id);
check("[category] no single category is permanently pinned to exactly one scene role (usefulForRoles >= 2)",
  pinnedCats.length === 0, pinnedCats.length > 0 ? `pinned: ${pinnedCats.join(", ")}` : "");

// ── 5. object family pool (>= 6), family-level not single objects ───────────
const fams = (C.objectFamilyPool && C.objectFamilyPool.families) || [];
check("[family] objectFamilyPool has >= 6 families", fams.length >= 6, String(fams.length));
check("[family] every family has id + members[]",
  fams.length > 0 && fams.every(f => f.id && Array.isArray(f.members) && f.members.length >= 2));
check("[family] every family has usefulForCategories",
  fams.length > 0 && fams.every(f => Array.isArray(f.usefulForCategories) && f.usefulForCategories.length > 0));
check("[family] every family has repeatLimitGuidance + overuseRisk",
  fams.length > 0 && fams.every(f => f.repeatLimitGuidance && f.overuseRisk));

// ── 6. diversity rules — repetition limits that block the failure ───────────
const drules = (C.diversityRules && C.diversityRules.rules) || [];
const drIds = drules.map(r => r.id);
check("[diversity] diversityRules present (>= 7 rules)", drules.length >= 7, String(drules.length));
const requiredDiversity = [
  "same_space_repeat_limit",
  "same_camera_distance_repeat_limit",
  "same_object_family_repeat_limit",
  "smartphone_centered_repeat_limit",
  "wood_table_notebook_coffee_hand_combo_limit",
  "fullscreen_data_card_ban",
  "hand_table_smartphone_convergence_ban",
  "scene_category_must_differ",
  "previous_history_as_compiler_input",
];
for (const id of requiredDiversity) {
  check(`[diversity] rule present: ${id}`, drIds.includes(id));
}

// ── 7. prompt compiler contract — input/output only (NOT implementation) ────
const pc = C.promptCompilerContract || {};
const pcIn = (pc.input && pc.input.fields) || [];
const pcOut = (pc.output && pc.output.fields) || [];
check("[compiler] promptCompilerContract is contract-only, not implementation (isImplementation=false)",
  pc.isImplementation === false);
check("[compiler] input has previousSceneVisualHistory", pcIn.includes("previousSceneVisualHistory"));
check("[compiler] input has forbiddenObjects", pcIn.includes("forbiddenObjects"));
check("[compiler] input has forbiddenCompositions", pcIn.includes("forbiddenCompositions"));
check("[compiler] input has subtitleSafeZone + graphicLayerPolicy",
  pcIn.includes("subtitleSafeZone") && pcIn.includes("graphicLayerPolicy"));
check("[compiler] output has sceneRole/selectedVisualCategory/selectedObjectFamilies",
  pcOut.includes("sceneRole") && pcOut.includes("selectedVisualCategory") && pcOut.includes("selectedObjectFamilies"));
check("[compiler] output has finalPrompt + promptFixedPart + promptVariablePart",
  pcOut.includes("finalPrompt") && pcOut.includes("promptFixedPart") && pcOut.includes("promptVariablePart"));
check("[compiler] output has qaExpectations + forbiddenRepetitionNotes",
  pcOut.includes("qaExpectations") && pcOut.includes("forbiddenRepetitionNotes"));
check("[compiler] fixed80 + variable20 split defined",
  pc.fixed80 && Array.isArray(pc.fixed80.elements) && pc.variable20 && Array.isArray(pc.variable20.elements));

// ── 8. visual QA contract — structure guard, not image-quality judge ────────
const qa = C.visualQaContract || {};
const qaChecks = (qa.checks || []).map(c => c.id);
check("[qa] visualQaContract explicitly NOT an image-quality judge (isImageQualityJudge=false)",
  qa.isImageQualityJudge === false);
check("[qa] role differentiation check present", qaChecks.includes("role_differentiation"));
check("[qa] adjacent-scene repetition check present", qaChecks.includes("adjacent_scene_similarity"));
check("[qa] smartphone/notebook/coffee/table repeat check present",
  qaChecks.includes("smartphone_notebook_coffee_table_repeat"));
check("[qa] graphic layer present + not-dominant checks present",
  qaChecks.includes("graphic_layer_present") && qaChecks.includes("graphic_layer_not_dominant"));
check("[qa] subtitle safe zone check present", qaChecks.includes("subtitle_safe_zone"));
check("[qa] source-of-truth (overlay) check present", qaChecks.includes("source_of_truth_overlay"));

// ── 9. failure routing ──────────────────────────────────────────────────────
const routes = (C.failureRouting && C.failureRouting.routes) || [];
const routeIds = routes.map(r => r.id);
const requiredRoutes = [
  "regenerate_same_role_with_new_category",
  "regenerate_with_object_family_ban",
  "owner_review_required",
  "accept_with_overlay_fix",
  "reject_as_visual_system_failure",
];
for (const id of requiredRoutes) {
  check(`[routing] route present: ${id}`, routeIds.includes(id));
}

// ── 10. ChatGPT / Veo / data-card policy ────────────────────────────────────
const policy = C.chatgptVeoDataCardPolicy || {};
check("[policy] ChatGPT is primary engine", policy.chatgptPrimary === true);
check("[policy] Veo is limited assist only", policy.veoLimitedAssist === true);
check("[policy] data-card is auxiliary layer, NOT main visual",
  policy.dataCard && policy.dataCard.isMainVisual === false);
check("[policy] full-screen data-card domination is a failure",
  policy.dataCard && policy.dataCard.fullScreenDominationIsFailure === true);

// ── 11. image text source-of-truth policy (deterministic overlay) ───────────
const sot = C.imageTextSourceOfTruthPolicy || {};
check("[sot] exact numbers/dates/source NOT baked into image", sot.exactValuesInImage === false);
check("[sot] deterministic overlay owns exact values", sot.deterministicOverlayOwnsExactValues === true);
check("[sot] policy mentions deterministic overlay principle in rules",
  Array.isArray(sot.rules) && sot.rules.some(r => /deterministic overlay/.test(r)));

// ── 12. anti-fixed-object-table guard (the core mistake we must prevent) ────
// 구조 검증: contract가 scene→단일오브젝트 고정 매핑을 "구조적으로" 갖지 않아야 한다.
// (notMappingTable.description 안의 '나쁜 예시' 문구는 의도된 설명이므로 검사에서 제외한다.)
const fixedMapPattern = /scene\s*[1-6]\s*=\s*(smartphone|desk|laptop|notebook|checklist|cta)/i;
// notMappingTable 블록(부정 예시 설명)을 제거한 나머지 JSON에 고정 매핑이 없어야 한다.
const jsonWithoutNegativeExample = JSON.stringify({ ...C, notMappingTable: undefined });
check("[anti-fixed] contract has no real 'Scene N = <object>' fixed mapping (negative-example text excluded)",
  !fixedMapPattern.test(jsonWithoutNegativeExample));
// 구조적 보장: 모든 role은 doesNotFixObject=true 이고, scene별 고정 object 필드를 갖지 않는다.
check("[anti-fixed] no scene role carries a fixed object/objects field",
  roles.length > 0 && roles.every(r =>
    r.fixedObject === undefined && r.objects === undefined && r.fixedObjects === undefined));
// 구조적 보장: 어떤 category도 정확히 1개 role에만 고정되어 카테고리가 scene 매핑표로 굳지 않는다.
const narrowCats = cats.filter(c => Array.isArray(c.usefulForRoles) && c.usefulForRoles.length < 2).map(c => c.id);
check("[anti-fixed] no category is so narrow it acts as a single-scene fixed mapping (usefulForRoles >= 2)",
  narrowCats.length === 0, narrowCats.length > 0 ? `narrow: ${narrowCats.join(", ")}` : "");

// ── 13. helper guard — failed Scene 3~6 v1 branch must be gone ──────────────
check("[helper] failed scene-set id 'ecos-live-yohan-koo-premium-editorial-scenes-3-6-v1' NOT present in helper",
  !helperText.includes("ecos-live-yohan-koo-premium-editorial-scenes-3-6-v1"));
check("[helper] failed SCENES_SCENES_3_6 branch array NOT present in helper",
  !/SCENES_SCENES_3_6/.test(helperText));
check("[helper] approved Scene 1 fix + Scene 2 v2 scene-set ids still present in helper",
  helperText.includes("ecos-live-yohan-koo-premium-editorial-scene1-anchor-fix-v1") &&
  helperText.includes("ecos-live-yohan-koo-premium-editorial-anchor-sample-v2"));

// ── 14. doc guard — rule-contract direction must be in the doc ───────────────
check("[doc] doc references the rule-contract fixture by filename",
  docText.includes("premium-editorial-visual-system.rule-contract.v1.json"));
check("[doc] doc explicitly forbids fixed object table (고정 오브젝트표 금지)",
  /고정\s*오브젝트표/.test(docText));
check("[doc] doc states recent Scene 3~6 v1 failure is NOT used as main baseline",
  /Scene\s*3[~\-]?6/.test(docText) && /(메인\s*기준으로\s*사용하지|실패)/.test(docText));
check("[doc] doc keeps approved anchor set (Scene 1 fix + Scene 2 v2)",
  docText.includes("scene-01-hook-anchor-fix-v1.png") && docText.includes("scene-02-signal-anchor-v2.png"));

// ── report ──────────────────────────────────────────────────────────────────
const total = results.length;
const failed = results.filter(r => !r.pass);
const MIN_CHECKS = 35;

console.log("── Money Shorts OS Visual System — STATIC CONTRACT GUARD ──");
console.log("(contract structure guard, NOT an image-quality judge)\n");
for (const r of results) {
  console.log(`${r.pass ? "PASS" : "FAIL"}  ${r.name}${r.detail ? `  [${r.detail}]` : ""}`);
}
console.log(`\nTotal checks: ${total}  |  Passed: ${total - failed.length}  |  Failed: ${failed.length}`);

if (total < MIN_CHECKS) {
  console.error(`\nFATAL: only ${total} checks defined; contract guard requires >= ${MIN_CHECKS}.`);
  process.exit(2);
}
if (failed.length > 0) {
  console.error(`\nGUARD FAILED: ${failed.length} contract structure check(s) failed.`);
  process.exit(1);
}
console.log("\nGUARD OK: Visual System Rule Contract structure is intact.");
process.exit(0);
