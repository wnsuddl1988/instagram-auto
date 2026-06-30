#!/usr/bin/env node
// ──────────────────────────────────────────────────────────────────────────
// build-premium-editorial-scene-owner-presubmit-qa-packet-v1.mjs
//
// SCENE 3~6 OWNER PRE-SUBMIT QA PACKET — DATA-ONLY (no execution)
//
// 이 빌더는 image request pack(v1)을 소비해 Owner가 이미지 생성 전에
// 검토할 수 있는 pre-submit QA packet을 deterministic하게 생성한다.
//
// 이 빌더는 다음을 하지 않는다 (boundary 준수):
//   - 이미지 생성 / 이미지 URL·path·request body 생성
//   - ChatGPT / Playwright / OpenAI 실행 또는 import
//   - fetch / http / https / child_process / node-fetch 사용
//   - openaiRequestBody / imageUrl / generatedImagePath 필드 생성
//
// 설계 원칙:
//   - request pack의 generationTargets(Scene 3~6)만 QA packet 대상이다.
//   - Scene 1/2 anchor는 approvedAnchorRefs로만 참조 보존하며 QA target이 아니다.
//   - 각 scene에 Owner가 한눈에 검토할 수 있는 요약(mustPreserve/mustRejectIf 등)을 만든다.
//   - packet 자체는 Owner 승인 전까지 제출 차단 상태(submissionBlockedUntilOwnerApproval=true)다.
//
// source:
//   scripts/fixtures/premium-editorial-scene-image-request-pack.v1.json
// output:
//   scripts/fixtures/premium-editorial-scene-owner-presubmit-qa-packet.v1.json
// ──────────────────────────────────────────────────────────────────────────

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..");

const REQUEST_PACK_PATH = join(REPO_ROOT, "scripts", "fixtures", "premium-editorial-scene-image-request-pack.v1.json");
const OUTPUT_PATH = join(REPO_ROOT, "scripts", "fixtures", "premium-editorial-scene-owner-presubmit-qa-packet.v1.json");

// ── load source-of-truth fixture ──────────────────────────────────────────
const requestPack = JSON.parse(readFileSync(REQUEST_PACK_PATH, "utf8"));

const approvedAnchorRefs = requestPack.approvedAnchorRefs || [];
const generationTargets = requestPack.generationTargets || [];

if (generationTargets.length !== 4) {
  console.error(`FATAL: generationTargets 기대값 4(Scene 3~6)와 불일치 — 실제 ${generationTargets.length}개.`);
  process.exit(2);
}
const expectedOrders = [3, 4, 5, 6];
const actualOrders = generationTargets.map(t => t.order).slice().sort((a, b) => a - b);
if (JSON.stringify(actualOrders) !== JSON.stringify(expectedOrders)) {
  console.error(`FATAL: generationTargets order 불일치 — 기대 [3,4,5,6], 실제 [${actualOrders.join(",")}].`);
  process.exit(2);
}

// ── promptSummary 헬퍼: finalPrompt 전체 텍스트가 아닌 짧은 의도 요약만 추출 ──
function buildPromptSummary(t) {
  return `${t.sceneRole} / ${t.selectedVisualCategory} — ${t.selectedObjectFamilies.join(", ")} 오브젝트 패밀리, ${t.spaceType} 공간, ${t.cameraDistance} 카메라.`;
}

// ── mustPreserve: negativePromptRules + overlayPolicy 핵심을 Owner 체크리스트로 변환 ──
function buildMustPreserve(t) {
  const list = [
    "Premium editorial life-economy realism — photographic look (3D/animation/illustration 금지)",
    "Face-minimized — 얼굴 클로즈업/정면 구도 금지",
    "Subtitle safe-zone — 하단 자막 영역 비움",
    "Fixed financial graphic layer는 supporting only — 화면 전체를 덮는 데이터 카드 금지",
  ];
  if (t.visualSystemSafetyEvidence?.deterministicOverlayOwnsExactValues) {
    list.push("정확한 숫자/퍼센트/날짜/출처 라벨은 이미지에 직접 렌더링하지 않음 — 후속 deterministic overlay 단계 소유");
  }
  if (t.visualSystemSafetyEvidence?.adjacentSceneDifferentiationRequired) {
    list.push("직전 scene과 공간/카테고리/오브젝트 패밀리/구도가 달라야 함");
  }
  return list;
}

// ── mustRejectIf: negativePromptRules를 reject 조건으로 변환 ──────────────
function buildMustRejectIf(t) {
  const rejectIf = (t.negativePromptRules || []).map(r => `이미지가 다음에 해당하면 반려: ${r}`);
  if (t.planningRepeatEvidence && t.planningRepeatEvidence.planningRepeatAllowedWithinLimit === true) {
    rejectIf.push("실제 이미지가 직전 scene(checklist/notebook/pen 구도)과 시각적으로 유사하면 반려 — planning_objects 반복은 2연속 한도 내 허용이지만 구도 분리가 실제 이미지에서 확인되지 않으면 반려");
  }
  return rejectIf;
}

// ── overlayPolicySummary ───────────────────────────────────────────────────
function buildOverlayPolicySummary(t) {
  const op = t.overlayPolicy || {};
  return {
    exactValuesInImage: op.exactValuesInImage === true,
    deterministicOverlayOwnsExactValues: op.deterministicOverlayOwnsExactValues === true,
    ownedByOverlay: op.ownedByOverlay || [],
  };
}

// ── repetitionRiskSummary ──────────────────────────────────────────────────
function buildRepetitionRiskSummary(t) {
  const rca = t.repetitionControlApplied || {};
  const isPlanningRepeat = rca.adjacentObjectFamilyRepeat === true;
  return {
    adjacentSpaceTypeRepeat: rca.adjacentSpaceTypeRepeat === true,
    adjacentObjectFamilyRepeat: rca.adjacentObjectFamilyRepeat === true,
    adjacentVisualCategoryRepeat: rca.adjacentVisualCategoryRepeat === true,
    riskLevel: isPlanningRepeat ? "controlled_within_limit_requires_composition_separation" : "low",
    note: isPlanningRepeat
      ? "planning_objects 패밀리가 직전 scene과 반복됨 — 2연속 허용 한도 내이나 구도 분리 필수. 실제 이미지에서 분리 미확인 시 반려 대상."
      : "직전 scene과 spaceType/objectFamily/visualCategory 반복 없음.",
  };
}

// ── expectedVisualDifferenceFromPreviousScene ──────────────────────────────
function buildExpectedVisualDifference(t) {
  const de = t.differentiationEvidence || {};
  if (de.previousSpaceType === null && de.previousVisualCategory === null) {
    return "직전 scene 비교 대상 없음 (이 generation target 중 가장 앞선 scene).";
  }
  return `이전 scene(spaceType=${de.previousSpaceType}, category=${de.previousVisualCategory})과 비교해 이 scene은 spaceType=${t.spaceType}, category=${t.selectedVisualCategory}로 차별화되어야 함.`;
}

// ── per-scene QA entry 구성 ─────────────────────────────────────────────────
const qaEntries = generationTargets.map(t => ({
  sceneId: t.sceneId,
  order: t.order,
  sceneRole: t.sceneRole,
  selectedVisualCategory: t.selectedVisualCategory,
  selectedObjectFamilies: t.selectedObjectFamilies,
  spaceType: t.spaceType,
  cameraDistance: t.cameraDistance,
  promptSummary: buildPromptSummary(t),
  mustPreserve: buildMustPreserve(t),
  mustRejectIf: buildMustRejectIf(t),
  overlayPolicySummary: buildOverlayPolicySummary(t),
  repetitionRiskSummary: buildRepetitionRiskSummary(t),
  expectedVisualDifferenceFromPreviousScene: buildExpectedVisualDifference(t),
  approvalRecommendation: "ready_for_owner_review",
}));

// ── approvedAnchorRefs는 QA target이 아닌 참조로만 보존 ─────────────────────
const anchorReferences = approvedAnchorRefs.map(a => ({
  id: a.id,
  sceneRole: a.sceneRole,
  status: a.status,
  excludedFromQaTargets: true,
  note: "Owner 승인 anchor — 재검토/재생성 대상 아님, 참조만 보존.",
}));

// ── packet audit ────────────────────────────────────────────────────────────
const packetAudit = {
  description: "Owner pre-submit QA packet이 request pack(v1)을 소비해 Scene 3~6 검토 항목을 구성한 결과 요약.",
  totalGenerationTargets: generationTargets.length,
  generationTargetOrders: qaEntries.map(e => e.order),
  scenesWithComposedSeparationRisk: qaEntries
    .filter(e => e.repetitionRiskSummary.riskLevel !== "low")
    .map(e => e.order),
  allEntriesReadyForOwnerReview: qaEntries.every(e => e.approvalRecommendation === "ready_for_owner_review"),
  approvedAnchorReferenceCount: anchorReferences.length,
};

// ── assemble QA packet ───────────────────────────────────────────────────────
const qaPacket = {
  schemaVersion: "money_shorts_scene_owner_presubmit_qa_packet_v1",
  status: "data_only_pending_owner_review",
  title: "Money Shorts OS — Scene 3~6 Owner Pre-Submit QA Packet v1",
  purpose: "Scene 3~6 image generation request pack을 Owner가 이미지 생성 전에 검토할 수 있도록 data-only QA packet으로 요약한 결과. 이미지 생성/네트워크/ChatGPT·Playwright/OpenAI 실행 아님.",
  sourceRefs: {
    requestPack: {
      path: "scripts/fixtures/premium-editorial-scene-image-request-pack.v1.json",
      schemaVersion: requestPack.schemaVersion,
    },
  },
  submissionBlockedUntilOwnerApproval: true,
  imageGenerationExecuted: false,
  networkExecuted: false,
  anchorReferences,
  qaEntries,
  packetAudit,
};

writeFileSync(OUTPUT_PATH, JSON.stringify(qaPacket, null, 2) + "\n", "utf8");

console.log(`✅ Owner pre-submit QA packet written: ${OUTPUT_PATH}`);
console.log(`   anchorReferences: ${anchorReferences.map(a => a.sceneRole).join(", ")}`);
console.log(`   qaEntries: ${qaEntries.map(e => `${e.sceneId}(order ${e.order})`).join(", ")}`);
console.log(`   scenesWithComposedSeparationRisk: [${packetAudit.scenesWithComposedSeparationRisk.join(", ")}]`);
console.log(`   submissionBlockedUntilOwnerApproval=${qaPacket.submissionBlockedUntilOwnerApproval}, imageGenerationExecuted=${qaPacket.imageGenerationExecuted}, networkExecuted=${qaPacket.networkExecuted}`);
