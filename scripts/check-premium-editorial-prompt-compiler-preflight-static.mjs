#!/usr/bin/env node
// ──────────────────────────────────────────────────────────────────────────
// check-premium-editorial-prompt-compiler-preflight-static.mjs
//
// CONTRACT CONSUMER PREFLIGHT STRUCTURE GUARD (NOT a prompt/image quality judge).
//
// 이 guard는 "Prompt Compiler가 Rule Contract v1을 올바르게 소비(consume)할 수 있는
// 구조를 preflight fixture가 갖췄는지"를 검증한다.
//
// 이 guard는 다음을 하지 않는다:
//   - 실제 프롬프트 생성
//   - 이미지 품질 판정
//   - ChatGPT/Playwright/OpenAI 실행
//   - 이미지 생성
//   - 네트워크 요청
//
// 검증 대상:
//   1) scripts/fixtures/premium-editorial-visual-system.rule-contract.v1.json
//   2) scripts/fixtures/premium-editorial-prompt-compiler-preflight.v1.json
//   3) 이 스크립트 자체 (forbidden import 부재 확인)
// ──────────────────────────────────────────────────────────────────────────

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..");

const CONTRACT_PATH = join(REPO_ROOT, "scripts", "fixtures", "premium-editorial-visual-system.rule-contract.v1.json");
const PREFLIGHT_PATH = join(REPO_ROOT, "scripts", "fixtures", "premium-editorial-prompt-compiler-preflight.v1.json");
const SELF_PATH = join(REPO_ROOT, "scripts", "check-premium-editorial-prompt-compiler-preflight-static.mjs");

let contract = null;
let preflight = null;
let selfText = "";

const results = [];
function check(name, condition, detail = "") {
  results.push({ name, pass: !!condition, detail });
}

// ── load ──────────────────────────────────────────────────────────────────
try {
  contract = JSON.parse(readFileSync(CONTRACT_PATH, "utf8"));
} catch (e) {
  console.error(`FATAL: cannot read/parse Rule Contract: ${e.message}`);
  process.exit(2);
}
try {
  preflight = JSON.parse(readFileSync(PREFLIGHT_PATH, "utf8"));
} catch (e) {
  console.error(`FATAL: cannot read/parse preflight fixture: ${e.message}`);
  process.exit(2);
}
try {
  selfText = readFileSync(SELF_PATH, "utf8");
} catch (e) {
  console.error(`FATAL: cannot read self for forbidden-import check: ${e.message}`);
  process.exit(2);
}

const C = contract;
const P = preflight;

// ── 1. schema identity ────────────────────────────────────────────────────
check("[contract] schemaVersion correct",
  C.schemaVersion === "money_shorts_visual_system_rule_contract_v1", C.schemaVersion);
check("[preflight] schemaVersion correct",
  P.schemaVersion === "money_shorts_prompt_compiler_preflight_v1", P.schemaVersion);

// ── 2. preflight safety flags (no implementation, no generation) ──────────
check("[preflight] isPromptCompilerImplementation is false",
  P.isPromptCompilerImplementation === false);
check("[preflight] isImageGenerationRunner is false",
  P.isImageGenerationRunner === false);
check("[preflight] containsFinalPrompt is false",
  P.containsFinalPrompt === false);
check("[preflight] status is preflight_only",
  P.status === "preflight_only");
check("[preflight] purpose mentions no-prompt-generation and no-image-generation (EN or KO)",
  typeof P.purpose === "string" &&
  (
    /no.*prompt generation|no.*image generation/i.test(P.purpose) ||
    /(finalPrompt|프롬프트)\s*(생성|generation)\s*아님|(이미지|image)\s*(생성|generation)\s*아님/i.test(P.purpose)
  ));

// ── 3. ruleContractRef cross-link ─────────────────────────────────────────
const rcRef = P.ruleContractRef || {};
check("[preflight] ruleContractRef.schemaVersion matches Rule Contract",
  rcRef.schemaVersion === C.schemaVersion, rcRef.schemaVersion);
check("[preflight] ruleContractRef.visualProfileId matches Rule Contract",
  rcRef.visualProfileId === C.visualProfileId, rcRef.visualProfileId);
check("[preflight] ruleContractRef.path points to rule-contract file",
  typeof rcRef.path === "string" && rcRef.path.includes("rule-contract.v1.json"));

// ── 4. sourceOfTruthPolicyRef (deterministic overlay) ────────────────────
const sotRef = P.sourceOfTruthPolicyRef || {};
check("[preflight] sourceOfTruthPolicyRef.policy is deterministic_overlay",
  sotRef.policy === "deterministic_overlay");
check("[preflight] sourceOfTruthPolicyRef.exactValuesInImage is false",
  sotRef.exactValuesInImage === false);
check("[preflight] sourceOfTruthPolicyRef.deterministicOverlayOwnsExactValues is true",
  sotRef.deterministicOverlayOwnsExactValues === true);

// ── 5. approved anchor ref (identifier only, no file access) ─────────────
const anchorRef = P.approvedAnchorRef || {};
const anchors = anchorRef.anchors || [];
check("[preflight] approvedAnchorRef has >= 2 anchor references",
  anchors.length >= 2);
check("[preflight] all anchor refs are referenceOnly (no file access)",
  anchors.length > 0 && anchors.every(a => a.referenceOnly === true));
check("[preflight] scene1 hook anchor ref present",
  anchors.some(a => a.sceneRole === "scene_1_hook" && a.status === "owner_approved"));
check("[preflight] scene2 signal anchor ref present",
  anchors.some(a => a.sceneRole === "scene_2_signal" && a.status === "owner_approved"));

// ── 6. deprecated generation targets (failed scene-set must not be active) ─
const deprecated = anchorRef.deprecatedGenerationTargets || [];
check("[preflight] failed scenes-3-6-v1 scene-set is listed as deprecated",
  deprecated.some(d => d.sceneSetId === "ecos-live-yohan-koo-premium-editorial-scenes-3-6-v1"));
check("[preflight] failed scenes-3-6-v1 has isActiveGenerationTarget=false",
  deprecated.some(d =>
    d.sceneSetId === "ecos-live-yohan-koo-premium-editorial-scenes-3-6-v1" &&
    d.isActiveGenerationTarget === false));

// ── 7. 6 scene roles — exactly one of each ───────────────────────────────
const scenes = P.scenes || [];
const expectedRoles = [
  "scene_1_hook", "scene_2_signal", "scene_3_context",
  "scene_4_life_impact", "scene_5_watch_point", "scene_6_action_closing",
];
check("[preflight] exactly 6 scenes", scenes.length === 6, String(scenes.length));
for (const role of expectedRoles) {
  const count = scenes.filter(s => s.sceneRole === role).length;
  check(`[preflight] exactly one scene with role ${role}`, count === 1, String(count));
}

// ── 8. each scene role exists in Rule Contract ────────────────────────────
const contractRoleIds = (C.sceneRoleContract?.roles || []).map(r => r.id);
for (const scene of scenes) {
  check(`[preflight] sceneRole '${scene.sceneRole}' exists in Rule Contract sceneRoleContract.roles`,
    contractRoleIds.includes(scene.sceneRole));
}

// ── 9. selectedVisualCategory exists in Rule Contract pool ───────────────
const contractCatIds = (C.visualCategoryPool?.categories || []).map(c => c.id);
for (const scene of scenes) {
  check(`[preflight] scene ${scene.order} selectedVisualCategory '${scene.selectedVisualCategory}' exists in Rule Contract pool`,
    contractCatIds.includes(scene.selectedVisualCategory));
}

// ── 10. selectedVisualCategory.usefulForRoles covers the sceneRole ────────
const catMap = {};
for (const cat of (C.visualCategoryPool?.categories || [])) {
  catMap[cat.id] = cat;
}
for (const scene of scenes) {
  const cat = catMap[scene.selectedVisualCategory];
  const covered = cat && Array.isArray(cat.usefulForRoles) &&
    cat.usefulForRoles.includes(scene.sceneRole);
  check(`[preflight] scene ${scene.order} category '${scene.selectedVisualCategory}' usefulForRoles covers '${scene.sceneRole}'`,
    covered);
}

// ── 11. selectedObjectFamilies exist in Rule Contract pool ────────────────
const contractFamIds = (C.objectFamilyPool?.families || []).map(f => f.id);
for (const scene of scenes) {
  for (const fam of (scene.selectedObjectFamilies || [])) {
    check(`[preflight] scene ${scene.order} objectFamily '${fam}' exists in Rule Contract pool`,
      contractFamIds.includes(fam));
  }
}

// ── 12. selectedObjectFamily usefulForCategories cross-link (per family) ─────
// Rule Contract 계약: 각 selectedObjectFamily는 selectedVisualCategory와
// usefulForCategories로 직접 연결되어야 한다. secondary/cross-scene family 완화 없음.
const famMap = {};
for (const fam of (C.objectFamilyPool?.families || [])) {
  famMap[fam.id] = fam;
}
for (const scene of scenes) {
  for (const famId of (scene.selectedObjectFamilies || [])) {
    const fam = famMap[famId];
    const linked = fam && Array.isArray(fam.usefulForCategories) &&
      fam.usefulForCategories.includes(scene.selectedVisualCategory);
    check(
      `[preflight] scene ${scene.order} objectFamily '${famId}' is directly linked to category '${scene.selectedVisualCategory}' via usefulForCategories`,
      linked === true,
      linked ? "" : `scene ${scene.order}: '${famId}' usefulForCategories=[${fam ? (fam.usefulForCategories || []).join(",") : "family_not_found"}] does not include '${scene.selectedVisualCategory}'`
    );
  }
}

// ── 13. previousSceneVisualHistoryInput present for scenes 2~6 ───────────
for (const scene of scenes) {
  if (scene.order >= 2) {
    check(`[preflight] scene ${scene.order} has previousSceneVisualHistoryInput (non-null)`,
      scene.previousSceneVisualHistoryInput !== null &&
      typeof scene.previousSceneVisualHistoryInput === "object");
  }
}

// ── 13.5. selectedObjectFamilies is non-empty array for each scene ─────────
for (const scene of scenes) {
  check(`[preflight] scene ${scene.order} selectedObjectFamilies is non-empty array`,
    Array.isArray(scene.selectedObjectFamilies) && scene.selectedObjectFamilies.length > 0);
}

// ── 13.6. diversityAudit.objectFamilySequence matches scenes selectedObjectFamilies ─
const sceneFamilySeq = scenes.map(s => s.selectedObjectFamilies);
const auditFamilySeq = (P.diversityAudit?.objectFamilySequence || []);
const familySeqMatches = JSON.stringify(sceneFamilySeq) === JSON.stringify(auditFamilySeq);
check("[preflight] diversityAudit.objectFamilySequence exactly matches scenes selectedObjectFamilies",
  familySeqMatches,
  !familySeqMatches ? `mismatch: scenes=[${JSON.stringify(sceneFamilySeq)}] vs audit=[${JSON.stringify(auditFamilySeq)}]` : "");

// ── 14. forbiddenObjects / forbiddenCompositions are arrays ──────────────
for (const scene of scenes) {
  check(`[preflight] scene ${scene.order} forbiddenObjects is array`,
    Array.isArray(scene.forbiddenObjects));
  check(`[preflight] scene ${scene.order} forbiddenCompositions is array`,
    Array.isArray(scene.forbiddenCompositions));
}

// ── 15. no finalPrompt / promptText / generatedPrompt fields ─────────────
const preflightJson = JSON.stringify(P);
check("[preflight] no 'finalPrompt' field",
  !/"finalPrompt"/.test(preflightJson));
check("[preflight] no 'promptText' field",
  !/"promptText"/.test(preflightJson));
check("[preflight] no 'generatedPrompt' field",
  !/"generatedPrompt"/.test(preflightJson));
check("[preflight] no 'chatgptPrompt' field",
  !/"chatgptPrompt"/.test(preflightJson));

// ── 16. smartphone-centered scene count <= 2 ─────────────────────────────
const audit = P.diversityAudit || {};
check("[diversity] smartphoneCenteredSceneCount declared in diversityAudit",
  typeof audit.smartphoneCenteredSceneCount === "number");
check("[diversity] smartphoneCenteredSceneCount <= 2 (Rule Contract limit)",
  typeof audit.smartphoneCenteredSceneCount === "number" && audit.smartphoneCenteredSceneCount <= 2,
  String(audit.smartphoneCenteredSceneCount));

// ── 17. same object family not repeated > 2 consecutive scenes ───────────
const famSeq = audit.objectFamilySequence || [];
if (famSeq.length === 6) {
  let maxConsecutive = 1;
  for (const fid of contractFamIds) {
    let consecutive = 0;
    let max = 0;
    for (const scFams of famSeq) {
      if (scFams.includes(fid)) {
        consecutive++;
        if (consecutive > max) max = consecutive;
      } else {
        consecutive = 0;
      }
    }
    if (max > maxConsecutive) maxConsecutive = max;
  }
  check("[diversity] no objectFamily appears in > 2 consecutive scenes",
    maxConsecutive <= 2, `max consecutive: ${maxConsecutive}`);
} else {
  check("[diversity] objectFamilySequence has 6 entries for consecutive-repeat check",
    false, String(famSeq.length));
}

// ── 18. spaceType and cameraDistance diversity ────────────────────────────
const spaceSeq = audit.spaceTypeSequence || [];
const camSeq = audit.cameraDistanceSequence || [];
check("[diversity] spaceTypeSequence has 6 entries",
  spaceSeq.length === 6, String(spaceSeq.length));
check("[diversity] cameraDistanceSequence has 6 entries",
  camSeq.length === 6, String(camSeq.length));

// Check consecutive space repeats <= 2
if (spaceSeq.length === 6) {
  let spaceOk = true;
  for (let i = 0; i < spaceSeq.length - 2; i++) {
    if (spaceSeq[i] === spaceSeq[i + 1] && spaceSeq[i + 1] === spaceSeq[i + 2]) {
      spaceOk = false;
      break;
    }
  }
  check("[diversity] no spaceType repeated 3+ consecutive scenes",
    spaceOk);
}

// Check consecutive close-up <= 2
if (camSeq.length === 6) {
  let camOk = true;
  for (let i = 0; i < camSeq.length - 2; i++) {
    if (camSeq[i] === "close_up" && camSeq[i + 1] === "close_up" && camSeq[i + 2] === "close_up") {
      camOk = false;
      break;
    }
  }
  check("[diversity] no close_up cameraDistance 3+ consecutive scenes",
    camOk);
}

// ── 19. wood-table/notebook/coffee/hand combo not detected ────────────────
check("[diversity] woodTableNotebookCoffeeHandComboDetected is false",
  audit.woodTableNotebookCoffeeHandComboDetected === false);

// ── 20. data-card not fullscreen ──────────────────────────────────────────
check("[diversity] fullscreenDataCardDetected is false",
  audit.fullscreenDataCardDetected === false);

// Verify each scene has no fullscreen data-card graphicLayerMode
for (const scene of scenes) {
  check(`[preflight] scene ${scene.order} graphicLayerMode is not fullscreen_data_card`,
    scene.graphicLayerMode !== "fullscreen_data_card" &&
    scene.graphicLayerMode !== "main_data_card");
}

// ── 21. visualCategory diversity (no two adjacent scenes same category) ───
const catSeq = audit.visualCategorySequence || [];
if (catSeq.length === 6) {
  let allUnique = true;
  for (let i = 0; i < catSeq.length - 1; i++) {
    if (catSeq[i] === catSeq[i + 1]) {
      allUnique = false;
      break;
    }
  }
  check("[diversity] no two adjacent scenes share the same visualCategory",
    allUnique);
}

// ── 22. this script has no forbidden execution/network imports ────────────
const forbiddenImports = ["playwright", "openai", "node-fetch", "child_process"];
for (const imp of forbiddenImports) {
  check(`[self-guard] script does NOT import '${imp}'`,
    !selfText.includes(`from "${imp}"`) &&
    !selfText.includes(`require("${imp}")`) &&
    !selfText.includes(`from '${imp}'`) &&
    !selfText.includes(`require('${imp}')`));
}
// 실제 https/http/node-fetch import 선언 라인이 없음을 검증한다.
// 정규식으로 라인 시작 import 키워드만 체크해 self-literal 오탐을 방지한다.
check("[self-guard] script does NOT import https/http/node-fetch for network requests",
  !/^import\s+.*\s+from\s+["'](https|http|node-fetch)["']/m.test(selfText) &&
  !/^import\s+(https|http)\b/m.test(selfText) &&
  !/require\s*\(\s*["'](https|http|node-fetch)["']\s*\)/m.test(selfText));

// ── 23. failed scene-set not active anywhere in preflight ────────────────
check("[preflight] deprecated scenes-3-6-v1 sceneSetId not present as active in scenes",
  !scenes.some(s => JSON.stringify(s).includes("ecos-live-yohan-koo-premium-editorial-scenes-3-6-v1")));

// ── 24. approved anchor ref has scene_1 and scene_2 consistency ──────────
const scene1 = scenes.find(s => s.sceneRole === "scene_1_hook");
const scene2 = scenes.find(s => s.sceneRole === "scene_2_signal");
check("[preflight] scene_1_hook references scene1 anchor",
  scene1 && scene1.anchorConsistencyRef === "scene1_hook_anchor_fix_v1");
check("[preflight] scene_2_signal references scene2 anchor",
  scene2 && scene2.anchorConsistencyRef === "scene2_signal_anchor_v2");

// ── 25. diversityAudit completeness ──────────────────────────────────────
check("[preflight] diversityAudit present",
  typeof P.diversityAudit === "object" && P.diversityAudit !== null);
check("[preflight] diversityAudit.planningObjectsSceneCount <= 2 (notebook+pen limit)",
  typeof audit.planningObjectsSceneCount === "number" && audit.planningObjectsSceneCount <= 2,
  String(audit.planningObjectsSceneCount));

// ── report ────────────────────────────────────────────────────────────────
const total = results.length;
const failed = results.filter(r => !r.pass);
const MIN_CHECKS = 45;

console.log("── Money Shorts OS — PROMPT COMPILER PREFLIGHT CONTRACT GUARD ──");
console.log("(contract consumer preflight structure guard — NOT a prompt/image quality judge)\n");

for (const r of results) {
  console.log(`${r.pass ? "PASS" : "FAIL"}  ${r.name}${r.detail ? `  [${r.detail}]` : ""}`);
}

console.log(`\nTotal checks: ${total}  |  Passed: ${total - failed.length}  |  Failed: ${failed.length}`);

if (total < MIN_CHECKS) {
  console.error(`\nFATAL: only ${total} checks; preflight guard requires >= ${MIN_CHECKS}.`);
  process.exit(2);
}
if (failed.length > 0) {
  console.error(`\nGUARD FAILED: ${failed.length} preflight structure check(s) failed.`);
  process.exit(1);
}
console.log("\nGUARD OK: Prompt Compiler Preflight Contract structure is intact.");
process.exit(0);
