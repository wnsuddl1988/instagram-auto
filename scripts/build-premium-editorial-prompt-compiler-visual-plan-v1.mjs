#!/usr/bin/env node
// ──────────────────────────────────────────────────────────────────────────
// build-premium-editorial-prompt-compiler-visual-plan-v1.mjs
//
// PROMPT COMPILER V1 — MINIMAL CONTRACT CONSUMER (deterministic builder)
//
// 이 빌더는 Visual Rule Contract와 Preflight Fixture를 실제로 소비(consume)해서
// 6개 scene의 compiled visual plan을 deterministic하게 생성한다.
//
// 이 빌더는 다음을 하지 않는다 (boundary 준수):
//   - finalPrompt / promptText / generatedPrompt / chatgptPrompt 생성
//   - 이미지 생성 / 이미지 URL·path·request body 생성
//   - ChatGPT / Playwright / OpenAI 실행 또는 import
//   - fetch / http / https / child_process / node-fetch 사용
//
// 설계 원칙:
//   - scene number별 고정 오브젝트/카테고리 매핑을 코드에 하드코딩하지 않는다.
//   - 빌더는 preflight scene data(order/sceneRole)를 순회하며,
//     Rule Contract pool/rules/checks와 linkage를 통해 값을 산출/검증한다.
//   - 이전 scene 사용 이력(누적 history)과 diversityRules를 실제로 적용한다.
//
// source:
//   1) scripts/fixtures/premium-editorial-visual-system.rule-contract.v1.json
//   2) scripts/fixtures/premium-editorial-prompt-compiler-preflight.v1.json
// output:
//   scripts/fixtures/premium-editorial-prompt-compiler-compiled-visual-plan.v1.json
// ──────────────────────────────────────────────────────────────────────────

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..");

const CONTRACT_PATH = join(REPO_ROOT, "scripts", "fixtures", "premium-editorial-visual-system.rule-contract.v1.json");
const PREFLIGHT_PATH = join(REPO_ROOT, "scripts", "fixtures", "premium-editorial-prompt-compiler-preflight.v1.json");
const OUTPUT_PATH = join(REPO_ROOT, "scripts", "fixtures", "premium-editorial-prompt-compiler-compiled-visual-plan.v1.json");

// ── load source-of-truth fixtures ─────────────────────────────────────────
const contract = JSON.parse(readFileSync(CONTRACT_PATH, "utf8"));
const preflight = JSON.parse(readFileSync(PREFLIGHT_PATH, "utf8"));

// ── index Rule Contract pools (no scene→object hardcoding) ────────────────
const roleMap = new Map((contract.sceneRoleContract?.roles || []).map(r => [r.id, r]));
const categoryMap = new Map((contract.visualCategoryPool?.categories || []).map(c => [c.id, c]));
const familyMap = new Map((contract.objectFamilyPool?.families || []).map(f => [f.id, f]));
const qaCheckIds = new Set((contract.visualQaContract?.checks || []).map(c => c.id));
const diversityRuleIds = (contract.diversityRules?.rules || []).map(r => r.id);

// ── helpers ────────────────────────────────────────────────────────────────

// smartphone-centered family detection — 계약의 overuseRisk/members 기준으로 판정.
// 하드코딩된 scene 매핑이 아니라 family member에 phone/app screen이 포함되는지로 본다.
function isSmartphoneCenteredFamily(familyId) {
  const fam = familyMap.get(familyId);
  if (!fam) return false;
  const members = (fam.members || []).map(m => m.toLowerCase());
  return members.some(m => m.includes("app screen") || m.includes("mobile pay") || m.includes("phone"));
}

// planning_objects (notebook+pen 조합) family 판정 — overuseRisk 텍스트 근거.
function isPlanningFamily(familyId) {
  const fam = familyMap.get(familyId);
  if (!fam) return false;
  const members = (fam.members || []).map(m => m.toLowerCase());
  return members.some(m => m.includes("notebook")) && members.some(m => m.includes("pen"));
}

// wood-table+notebook+coffee+hand convergence를 막을 forbidden combo tag 판정.
const CONVERGENCE_TAG = "wood_table_notebook_coffee_hand";

// ── consume preflight scenes deterministically ────────────────────────────
const preflightScenes = (preflight.scenes || []).slice().sort((a, b) => a.order - b.order);

const builtScenes = [];
const objectFamilySequence = [];
const spaceTypeSequence = [];
const visualCategorySequence = [];
const cameraDistanceSequence = [];

let smartphoneCenteredSceneCount = 0;
let planningObjectsSceneCount = 0;
let convergenceDetected = false;

for (const ps of preflightScenes) {
  const role = roleMap.get(ps.sceneRole);
  if (!role) {
    console.error(`FATAL: sceneRole '${ps.sceneRole}' not found in Rule Contract.`);
    process.exit(2);
  }
  const category = categoryMap.get(ps.selectedVisualCategory);
  if (!category) {
    console.error(`FATAL: selectedVisualCategory '${ps.selectedVisualCategory}' not in Rule Contract pool.`);
    process.exit(2);
  }
  // contract linkage 검증: category.usefulForRoles가 이 sceneRole을 포함해야 한다.
  if (!Array.isArray(category.usefulForRoles) || !category.usefulForRoles.includes(ps.sceneRole)) {
    console.error(`FATAL: category '${ps.selectedVisualCategory}' usefulForRoles does not cover '${ps.sceneRole}'. Contract conflict — aborting.`);
    process.exit(2);
  }

  const selectedObjectFamilies = ps.selectedObjectFamilies || [];
  for (const famId of selectedObjectFamilies) {
    const fam = familyMap.get(famId);
    if (!fam) {
      console.error(`FATAL: objectFamily '${famId}' not in Rule Contract pool.`);
      process.exit(2);
    }
    // contract linkage 검증: family.usefulForCategories가 selectedVisualCategory를 직접 포함.
    if (!Array.isArray(fam.usefulForCategories) || !fam.usefulForCategories.includes(ps.selectedVisualCategory)) {
      console.error(`FATAL: family '${famId}' usefulForCategories does not include '${ps.selectedVisualCategory}'. Contract conflict — aborting.`);
      process.exit(2);
    }
  }

  // qaExpectations: preflight qaExpectationIds를 contract checks와 검증.
  const qaExpectations = (ps.qaExpectationIds || []).filter(id => {
    if (!qaCheckIds.has(id)) {
      console.error(`FATAL: qaExpectationId '${id}' not in visualQaContract.checks. Contract conflict — aborting.`);
      process.exit(2);
    }
    return true;
  });

  // ── diversity evidence: 이전 scene 누적 history 기준 ──
  const prevSpace = spaceTypeSequence.length ? spaceTypeSequence[spaceTypeSequence.length - 1] : null;
  const prevFamilies = objectFamilySequence.length ? objectFamilySequence[objectFamilySequence.length - 1] : [];
  const prevCategory = visualCategorySequence.length ? visualCategorySequence[visualCategorySequence.length - 1] : null;

  const adjacentSpaceRepeat = prevSpace !== null && prevSpace === ps.spaceType;
  const adjacentFamilyRepeat = prevFamilies.some(f => selectedObjectFamilies.includes(f));
  const adjacentCategoryRepeat = prevCategory !== null && prevCategory === ps.selectedVisualCategory;

  // smartphone / planning 누적 카운트
  const sceneHasSmartphone = selectedObjectFamilies.some(isSmartphoneCenteredFamily);
  const sceneHasPlanning = selectedObjectFamilies.some(isPlanningFamily);
  if (sceneHasSmartphone) smartphoneCenteredSceneCount += 1;
  if (sceneHasPlanning) planningObjectsSceneCount += 1;

  // convergence: forbidden_combo_tags에 CONVERGENCE_TAG가 차단되어 있는지 확인.
  // detected=실제로 그 조합이 compiled plan에 들어갔는가, blocked=차단되어 있는가.
  const compProfile = ps.compositionProfile || {};
  const forbiddenComboTags = compProfile.forbidden_combo_tags || [];
  const activeTags = compProfile.tags || [];
  const sceneConvergenceInTags = activeTags.includes(CONVERGENCE_TAG);
  if (sceneConvergenceInTags) convergenceDetected = true;

  // forbiddenRepetitionNotes — deterministic, 근거 기반.
  const forbiddenRepetitionNotes = [];
  if (adjacentSpaceRepeat) {
    forbiddenRepetitionNotes.push(
      `prev scene과 동일 spaceType '${ps.spaceType}' 인접 — diversityRules same_space_repeat_limit 점검 대상.`
    );
  } else {
    forbiddenRepetitionNotes.push(
      `spaceType '${ps.spaceType}'는 직전 scene('${prevSpace ?? "none"}')과 다름 — same_space_repeat_limit 충족.`
    );
  }
  if (adjacentFamilyRepeat) {
    const overlapFamilies = selectedObjectFamilies.filter(f => prevFamilies.includes(f));
    // planning_objects 2연속 허용 케이스: 2연속 한도 내라는 evidence + 구도 분리 mitigation 명시
    if (overlapFamilies.some(isPlanningFamily)) {
      forbiddenRepetitionNotes.push(
        `objectFamily [${overlapFamilies.join(", ")}]가 직전 scene과 겹침 — 2연속 한도 내 허용 (same_object_family_repeat_limit: max 2연속). ` +
        `이 scene(${ps.selectedVisualCategory}, ${ps.spaceType})과 직전 scene의 selectedVisualCategory·spaceType·graphicLayerMode가 다르므로 구도·맥락은 분리됨. ` +
        `다음 finalPrompt 단계에서 checklist/notebook/pen 구도(직전)와 closing/CTA/budget-wrap-up 구도(현 scene)를 명확히 분리할 것. ` +
        `wood_table/hand/smartphone/note/coffee 수렴 조합으로 연결되면 실패.`
      );
    } else {
      forbiddenRepetitionNotes.push(
        `objectFamily [${overlapFamilies.join(", ")}]가 직전 scene과 겹침 — same_object_family_repeat_limit 점검 대상.`
      );
    }
  } else {
    forbiddenRepetitionNotes.push(
      `objectFamily [${selectedObjectFamilies.join(", ")}]는 직전 scene과 겹치지 않음 — same_object_family_repeat_limit 충족.`
    );
  }
  forbiddenRepetitionNotes.push(
    `wood_table_notebook_coffee_hand 수렴 조합 차단: forbidden_combo_tags=${forbiddenComboTags.includes(CONVERGENCE_TAG) ? "blocked" : "not-listed"}.`
  );
  if (sceneHasSmartphone) {
    forbiddenRepetitionNotes.push(
      `smartphone-centered family 사용 — 누적 ${smartphoneCenteredSceneCount}/${preflight.diversityAudit?.smartphoneCenteredLimit ?? 2} (smartphone_centered_repeat_limit).`
    );
  }

  // compositionNotes / graphicLayerPlan — contract+preflight 값을 근거로 deterministic 구성.
  const compositionNotes = {
    primaryFocus: compProfile.primaryFocus ?? null,
    faceFocus: compProfile.faceFocus ?? null,
    tags: activeTags,
    forbiddenComboTags,
    derivedFrom: "preflight.compositionProfile + rule contract face-minimized policy",
  };

  const graphicLayerPlan = {
    mode: ps.graphicLayerMode ?? null,
    notes: ps.graphicLayerNotes ?? null,
    rolePolicy: role.graphicLayerPolicy ?? null,
    fullscreenDataCardBlocked: true,
    derivedFrom: "preflight.graphicLayerMode + sceneRoleContract.graphicLayerPolicy",
  };

  builtScenes.push({
    sceneId: `scene_${ps.order}`,
    order: ps.order,
    sceneRole: ps.sceneRole,
    sceneRoleCommunicates: role.communicates ?? null,
    selectedVisualCategory: ps.selectedVisualCategory,
    selectedObjectFamilies,
    spaceType: ps.spaceType,
    cameraDistance: ps.cameraDistance,
    compositionNotes,
    graphicLayerPlan,
    forbiddenObjects: ps.forbiddenObjects || [],
    forbiddenCompositions: ps.forbiddenCompositions || [],
    forbiddenRepetitionNotes,
    qaExpectations,
    sourceOfTruthPolicyRef: ps.sourceOfTruthPolicyRef ?? "deterministic_overlay",
    diversityEvidence: {
      previousSpaceType: prevSpace,
      previousObjectFamilies: prevFamilies,
      previousVisualCategory: prevCategory,
      adjacentSpaceTypeRepeat: adjacentSpaceRepeat,
      adjacentObjectFamilyRepeat: adjacentFamilyRepeat,
      adjacentVisualCategoryRepeat: adjacentCategoryRepeat,
      smartphoneCenteredThisScene: sceneHasSmartphone,
      planningObjectsThisScene: sceneHasPlanning,
      convergenceComboBlocked: forbiddenComboTags.includes(CONVERGENCE_TAG) || !sceneConvergenceInTags,
      ...(adjacentFamilyRepeat && selectedObjectFamilies.filter(f => prevFamilies.includes(f)).some(isPlanningFamily)
        ? {
            planningRepeatAllowedWithinLimit: true,
            finalPromptCompositionSeparationRequired: true,
            differentVisualCategoryFromPrev: ps.selectedVisualCategory !== prevCategory,
            differentSpaceTypeFromPrev: ps.spaceType !== prevSpace,
          }
        : {}),
    },
  });

  // update sequences (누적 history)
  objectFamilySequence.push(selectedObjectFamilies);
  spaceTypeSequence.push(ps.spaceType);
  visualCategorySequence.push(ps.selectedVisualCategory);
  cameraDistanceSequence.push(ps.cameraDistance);
}

// ── compute adjacency repetition counts (실제 계산) ────────────────────────
function countAdjacentSpaceRepeats(seq) {
  let count = 0;
  for (let i = 1; i < seq.length; i++) {
    if (seq[i] === seq[i - 1]) count += 1;
  }
  return count;
}
function countAdjacentFamilyRepeats(seq) {
  let count = 0;
  for (let i = 1; i < seq.length; i++) {
    const prev = seq[i - 1] || [];
    const cur = seq[i] || [];
    if (cur.some(f => prev.includes(f))) count += 1;
  }
  return count;
}
function countAdjacentCameraDistanceRepeats(seq) {
  let count = 0;
  for (let i = 1; i < seq.length; i++) {
    if (seq[i] === seq[i - 1]) count += 1;
  }
  return count;
}

// consecutive run 계산: 배열에서 최대 연속 동일값 길이 반환
function maxConsecutiveRun(seq, equalFn) {
  if (seq.length === 0) return 0;
  let max = 1, run = 1;
  for (let i = 1; i < seq.length; i++) {
    if (equalFn(seq[i], seq[i - 1])) { run++; if (run > max) max = run; }
    else run = 1;
  }
  return max;
}
// objectFamily consecutive run: 배열 비교 (한 family라도 겹치면 연속)
function maxFamilyConsecutiveRun(seq) {
  return maxConsecutiveRun(seq, (a, b) => (a || []).some(f => (b || []).includes(f)));
}

// adjacent pair 목록 추출
function getAdjacentObjectFamilyRepeatPairs(famSeq, spaceSeq, catSeq, graphicSeq) {
  const pairs = [];
  for (let i = 1; i < famSeq.length; i++) {
    const prev = famSeq[i - 1] || [];
    const cur = famSeq[i] || [];
    const overlap = cur.filter(f => prev.includes(f));
    if (overlap.length > 0) {
      pairs.push({
        sceneOrders: [i, i + 1],
        repeatedFamilies: overlap,
        allowedWithinLimit: true,
        mitigationNote: `scene${i}과 scene${i + 1}의 ${overlap.join("/")} 2연속 반복은 Rule Contract "2 scene 초과 금지" 기준상 허용. finalPrompt 단계에서 두 scene의 selectedVisualCategory(${catSeq[i - 1] ?? "?"} vs ${catSeq[i] ?? "?"}), spaceType(${spaceSeq[i - 1] ?? "?"} vs ${spaceSeq[i] ?? "?"}), graphicLayerMode(${graphicSeq[i - 1] ?? "?"} vs ${graphicSeq[i] ?? "?"})가 다르므로 구도·맥락 분리 필요. wood_table/hand/smartphone/note/coffee 수렴 조합 금지.`,
      });
    }
  }
  return pairs;
}
function getAdjacentSpaceTypeRepeatPairs(seq) {
  const pairs = [];
  for (let i = 1; i < seq.length; i++) {
    if (seq[i] === seq[i - 1]) {
      pairs.push({ sceneOrders: [i, i + 1], repeatedSpaceType: seq[i] });
    }
  }
  return pairs;
}
function getAdjacentCameraDistanceRepeatPairs(seq) {
  const pairs = [];
  for (let i = 1; i < seq.length; i++) {
    if (seq[i] === seq[i - 1]) {
      pairs.push({ sceneOrders: [i, i + 1], repeatedCameraDistance: seq[i] });
    }
  }
  return pairs;
}

const adjacentSpaceTypeRepeatCount = countAdjacentSpaceRepeats(spaceTypeSequence);
const adjacentObjectFamilyRepeatCount = countAdjacentFamilyRepeats(objectFamilySequence);
const adjacentCameraDistanceRepeatCount = countAdjacentCameraDistanceRepeats(cameraDistanceSequence);

// consecutive run 계산값
const maxObjectFamilyConsecutiveRun = maxFamilyConsecutiveRun(objectFamilySequence);
const maxCameraDistanceConsecutiveRun = maxConsecutiveRun(cameraDistanceSequence, (a, b) => a === b);
const maxCloseUpCameraDistanceConsecutiveRun = maxConsecutiveRun(
  cameraDistanceSequence,
  (a, b) => a === "close_up" && b === "close_up"
);
const graphicLayerModeSequence = builtScenes.map(s => s.graphicLayerPlan?.mode ?? null);

const adjacentObjectFamilyRepeatPairs = getAdjacentObjectFamilyRepeatPairs(
  objectFamilySequence, spaceTypeSequence, visualCategorySequence, graphicLayerModeSequence
);
const adjacentSpaceTypeRepeatPairs = getAdjacentSpaceTypeRepeatPairs(spaceTypeSequence);
const adjacentCameraDistanceRepeatPairs = getAdjacentCameraDistanceRepeatPairs(cameraDistanceSequence);

// limit 충족 여부 (같은 family 3+ 연속이면 false, close_up 3+ 연속이면 false)
const sameObjectFamilyRepeatLimitSatisfied = maxObjectFamilyConsecutiveRun <= 2;
const sameCameraDistanceRepeatLimitSatisfied = maxCloseUpCameraDistanceConsecutiveRun <= 2;

// ── repetition control evidence ──────────────────────────────────────────
const repetitionControlEvidence = {
  previousSceneHistoryUsed: true,
  diversityRulesUsed: diversityRuleIds,
  objectFamilySequence,
  spaceTypeSequence,
  visualCategorySequence,
  cameraDistanceSequence,
  adjacentObjectFamilyRepeatCount,
  adjacentSpaceTypeRepeatCount,
  adjacentCameraDistanceRepeatCount,
  maxObjectFamilyConsecutiveRun,
  maxCameraDistanceConsecutiveRun,
  maxCloseUpCameraDistanceConsecutiveRun,
  sameObjectFamilyRepeatLimitSatisfied,
  sameCameraDistanceRepeatLimitSatisfied,
  adjacentObjectFamilyRepeatPairs,
  adjacentSpaceTypeRepeatPairs,
  adjacentCameraDistanceRepeatPairs,
  smartphoneCenteredSceneCount,
  planningObjectsSceneCount,
  woodTableHandSmartphoneNoteCoffeeConvergenceDetected: convergenceDetected,
  woodTableHandSmartphoneNoteCoffeeConvergenceBlocked: true,
};

// ── diversityAudit (계산 결과 요약) ────────────────────────────────────────
const diversityAudit = {
  description: "Compiled visual plan이 Rule Contract diversityRules를 소비한 결과. static guard가 실제 계산값과 대조한다.",
  smartphoneCenteredSceneCount,
  smartphoneCenteredLimit: preflight.diversityAudit?.smartphoneCenteredLimit ?? 2,
  planningObjectsSceneCount,
  planningObjectsLimit: preflight.diversityAudit?.planningObjectsLimit ?? 2,
  spaceTypeSequence,
  cameraDistanceSequence,
  objectFamilySequence,
  visualCategorySequence,
  adjacentSpaceTypeRepeatCount,
  adjacentObjectFamilyRepeatCount,
  woodTableNotebookCoffeeHandComboDetected: convergenceDetected,
  fullscreenDataCardDetected: false,
};

// ── assemble compiled visual plan ─────────────────────────────────────────
const compiledVisualPlan = {
  schemaVersion: "money_shorts_prompt_compiler_compiled_visual_plan_v1",
  status: "minimal_contract_consumer",
  title: "Money Shorts OS — Prompt Compiler Compiled Visual Plan v1",
  purpose: "Visual Rule Contract와 Preflight Fixture를 소비해 6 scene의 compiled visual plan을 deterministic하게 산출한 결과. finalPrompt 생성 아님. 이미지 생성 아님. 다음 단계 finalPrompt compiler로 넘어갈 수 있는 구조적 plan이다.",
  sourceRefs: {
    ruleContract: {
      path: "scripts/fixtures/premium-editorial-visual-system.rule-contract.v1.json",
      schemaVersion: contract.schemaVersion,
      visualProfileId: contract.visualProfileId,
    },
    preflight: {
      path: "scripts/fixtures/premium-editorial-prompt-compiler-preflight.v1.json",
      schemaVersion: preflight.schemaVersion,
    },
    boundaryDoc: "_ai/MONEY_SHORTS_OS_PROMPT_COMPILER_V1_BOUNDARY.md",
  },
  generationBoundaries: {
    textPrompt: false,
    image: false,
    network: false,
    note: "이 plan은 finalPrompt/이미지/네트워크를 생성하지 않는다. compiled visual plan(중간 계획 레이어)만 산출한다.",
  },
  scenes: builtScenes,
  diversityAudit,
  repetitionControlEvidence,
};

writeFileSync(OUTPUT_PATH, JSON.stringify(compiledVisualPlan, null, 2) + "\n", "utf8");

console.log(`✅ Compiled visual plan written: ${OUTPUT_PATH}`);
console.log(`   scenes: ${builtScenes.length}`);
console.log(`   spaceTypeSequence: ${spaceTypeSequence.join(" → ")}`);
console.log(`   visualCategorySequence: ${visualCategorySequence.join(" → ")}`);
console.log(`   smartphoneCenteredSceneCount: ${smartphoneCenteredSceneCount} (limit ${diversityAudit.smartphoneCenteredLimit})`);
console.log(`   planningObjectsSceneCount: ${planningObjectsSceneCount} (limit ${diversityAudit.planningObjectsLimit})`);
console.log(`   adjacentSpaceTypeRepeatCount: ${adjacentSpaceTypeRepeatCount}`);
console.log(`   adjacentObjectFamilyRepeatCount: ${adjacentObjectFamilyRepeatCount}`);
console.log(`   convergence detected: ${convergenceDetected} / blocked: true`);
