#!/usr/bin/env node
// ──────────────────────────────────────────────────────────────────────────
// check-premium-editorial-scene-owner-presubmit-qa-packet-static.mjs
//
// Owner pre-submit QA packet(v1) static guard.
// 이 guard는 이미지 품질을 판단하지 않는다 — 구조/contract 정합성만 검사한다.
// ──────────────────────────────────────────────────────────────────────────

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..");

const BUILDER_PATH = join(__dirname, "build-premium-editorial-scene-owner-presubmit-qa-packet-v1.mjs");
const PACKET_PATH = join(REPO_ROOT, "scripts", "fixtures", "premium-editorial-scene-owner-presubmit-qa-packet.v1.json");
const REQUEST_PACK_PATH = join(REPO_ROOT, "scripts", "fixtures", "premium-editorial-scene-image-request-pack.v1.json");

const builderSrc = readFileSync(BUILDER_PATH, "utf8");
const packet = JSON.parse(readFileSync(PACKET_PATH, "utf8"));
const requestPack = JSON.parse(readFileSync(REQUEST_PACK_PATH, "utf8"));

let pass = 0;
let fail = 0;
const fails = [];

function check(id, label, cond) {
  if (cond) {
    pass++;
  } else {
    fail++;
    fails.push(`${id}: ${label}`);
  }
}

// ── § A: top-level schema / status ──────────────────────────────────────────
check("A-01", "schemaVersion === money_shorts_scene_owner_presubmit_qa_packet_v1", packet.schemaVersion === "money_shorts_scene_owner_presubmit_qa_packet_v1");
check("A-02", "status === data_only_pending_owner_review", packet.status === "data_only_pending_owner_review");
check("A-03", "title 존재", typeof packet.title === "string" && packet.title.length > 0);
check("A-04", "purpose 존재", typeof packet.purpose === "string" && packet.purpose.length > 0);
check("A-05", "sourceRefs.requestPack.path 일치", packet.sourceRefs?.requestPack?.path === "scripts/fixtures/premium-editorial-scene-image-request-pack.v1.json");
check("A-06", "sourceRefs.requestPack.schemaVersion 일치", packet.sourceRefs?.requestPack?.schemaVersion === requestPack.schemaVersion);

// ── § B: execution boundary 플래그 (절대 false/true 고정) ───────────────────
check("B-01", "submissionBlockedUntilOwnerApproval === true", packet.submissionBlockedUntilOwnerApproval === true);
check("B-02", "imageGenerationExecuted === false", packet.imageGenerationExecuted === false);
check("B-03", "networkExecuted === false", packet.networkExecuted === false);

// ── § C: anchorReferences (Scene 1/2, QA target 아님) ────────────────────────
check("C-01", "anchorReferences 배열", Array.isArray(packet.anchorReferences));
check("C-02", "anchorReferences 길이 === 2", packet.anchorReferences?.length === 2);
const anchorRoles = (packet.anchorReferences || []).map(a => a.sceneRole);
check("C-03", "anchorReferences에 scene_1_hook 포함", anchorRoles.includes("scene_1_hook"));
check("C-04", "anchorReferences에 scene_2_signal 포함", anchorRoles.includes("scene_2_signal"));
check("C-05", "모든 anchorReferences.excludedFromQaTargets === true", (packet.anchorReferences || []).every(a => a.excludedFromQaTargets === true));
check("C-06", "모든 anchorReferences.status === owner_approved", (packet.anchorReferences || []).every(a => a.status === "owner_approved"));
check("C-07", "anchorReferences에 file 필드 없음 (참조만, 경로 재노출 금지 아님 — 단 QA packet은 id/role/status/note만)", (packet.anchorReferences || []).every(a => !("file" in a)));

// ── § D: qaEntries 구조 (Scene 3~6) ─────────────────────────────────────────
check("D-01", "qaEntries 배열", Array.isArray(packet.qaEntries));
check("D-02", "qaEntries 길이 === 4", packet.qaEntries?.length === 4);
const qaOrders = (packet.qaEntries || []).map(e => e.order).slice().sort((a, b) => a - b);
check("D-03", "qaEntries order === [3,4,5,6]", JSON.stringify(qaOrders) === JSON.stringify([3, 4, 5, 6]));
check("D-04", "qaEntries sceneId 모두 scene_3~scene_6", (packet.qaEntries || []).every(e => ["scene_3", "scene_4", "scene_5", "scene_6"].includes(e.sceneId)));

for (const entry of packet.qaEntries || []) {
  const o = entry.order;
  check(`D-05-${o}`, `entry(${o}) sceneRole 존재`, typeof entry.sceneRole === "string" && entry.sceneRole.length > 0);
  check(`D-06-${o}`, `entry(${o}) selectedVisualCategory 존재`, typeof entry.selectedVisualCategory === "string" && entry.selectedVisualCategory.length > 0);
  check(`D-07-${o}`, `entry(${o}) selectedObjectFamilies 배열`, Array.isArray(entry.selectedObjectFamilies) && entry.selectedObjectFamilies.length > 0);
  check(`D-08-${o}`, `entry(${o}) spaceType 존재`, typeof entry.spaceType === "string" && entry.spaceType.length > 0);
  check(`D-09-${o}`, `entry(${o}) cameraDistance 존재`, typeof entry.cameraDistance === "string" && entry.cameraDistance.length > 0);
  check(`D-10-${o}`, `entry(${o}) promptSummary 존재 + finalPrompt 전체 텍스트 아님(요약, 200자 미만)`, typeof entry.promptSummary === "string" && entry.promptSummary.length > 0 && entry.promptSummary.length < 200);
  check(`D-11-${o}`, `entry(${o}) mustPreserve 배열, 비어있지 않음`, Array.isArray(entry.mustPreserve) && entry.mustPreserve.length > 0);
  check(`D-12-${o}`, `entry(${o}) mustRejectIf 배열, 비어있지 않음`, Array.isArray(entry.mustRejectIf) && entry.mustRejectIf.length > 0);
  check(`D-13-${o}`, `entry(${o}) overlayPolicySummary 객체`, typeof entry.overlayPolicySummary === "object" && entry.overlayPolicySummary !== null);
  check(`D-14-${o}`, `entry(${o}) overlayPolicySummary.exactValuesInImage === false`, entry.overlayPolicySummary?.exactValuesInImage === false);
  check(`D-15-${o}`, `entry(${o}) overlayPolicySummary.deterministicOverlayOwnsExactValues === true`, entry.overlayPolicySummary?.deterministicOverlayOwnsExactValues === true);
  check(`D-16-${o}`, `entry(${o}) repetitionRiskSummary 객체`, typeof entry.repetitionRiskSummary === "object" && entry.repetitionRiskSummary !== null);
  check(`D-17-${o}`, `entry(${o}) repetitionRiskSummary.riskLevel 존재`, typeof entry.repetitionRiskSummary?.riskLevel === "string");
  check(`D-18-${o}`, `entry(${o}) expectedVisualDifferenceFromPreviousScene 존재`, typeof entry.expectedVisualDifferenceFromPreviousScene === "string" && entry.expectedVisualDifferenceFromPreviousScene.length > 0);
  check(`D-19-${o}`, `entry(${o}) approvalRecommendation === ready_for_owner_review`, entry.approvalRecommendation === "ready_for_owner_review");
  check(`D-20-${o}`, `entry(${o})에 finalPrompt 원문 필드 없음 (요약만 노출)`, !("finalPrompt" in entry));
  check(`D-21-${o}`, `entry(${o})에 openaiRequestBody 없음`, !("openaiRequestBody" in entry));
  check(`D-22-${o}`, `entry(${o})에 imageUrl 없음`, !("imageUrl" in entry));
  check(`D-23-${o}`, `entry(${o})에 generatedImagePath 없음`, !("generatedImagePath" in entry));
}

// ── § E: scene6 planning repeat — 분리 필수 + reject 조건 명시 ──────────────
const scene6 = (packet.qaEntries || []).find(e => e.order === 6);
check("E-01", "scene6 존재", !!scene6);
check("E-02", "scene6 repetitionRiskSummary.adjacentObjectFamilyRepeat === true", scene6?.repetitionRiskSummary?.adjacentObjectFamilyRepeat === true);
check("E-03", "scene6 repetitionRiskSummary.riskLevel !== low (구도분리 필요 표시)", scene6?.repetitionRiskSummary?.riskLevel !== "low");
check("E-04", "scene6 mustRejectIf에 '직전 scene'과 유사하면 반려 조건 포함", (scene6?.mustRejectIf || []).some(r => r.includes("직전 scene") && r.includes("반려")));
check("E-05", "scene6 mustRejectIf에 '2연속 한도' 또는 '허용' 언급 포함 (허용 범위 명시)", (scene6?.mustRejectIf || []).some(r => r.includes("한도") || r.includes("허용")));

// ── § F: scene3/4/5는 risk low (반복 없음) ──────────────────────────────────
for (const o of [3, 4, 5]) {
  const e = (packet.qaEntries || []).find(x => x.order === o);
  check(`F-01-${o}`, `scene${o} repetitionRiskSummary.riskLevel === low`, e?.repetitionRiskSummary?.riskLevel === "low");
  check(`F-02-${o}`, `scene${o} adjacentObjectFamilyRepeat === false`, e?.repetitionRiskSummary?.adjacentObjectFamilyRepeat === false);
}

// ── § G: packetAudit ──────────────────────────────────────────────────────
check("G-01", "packetAudit 객체", typeof packet.packetAudit === "object" && packet.packetAudit !== null);
check("G-02", "packetAudit.totalGenerationTargets === 4", packet.packetAudit?.totalGenerationTargets === 4);
check("G-03", "packetAudit.generationTargetOrders === [3,4,5,6]", JSON.stringify(packet.packetAudit?.generationTargetOrders) === JSON.stringify([3, 4, 5, 6]));
check("G-04", "packetAudit.scenesWithComposedSeparationRisk includes 6", (packet.packetAudit?.scenesWithComposedSeparationRisk || []).includes(6));
check("G-05", "packetAudit.allEntriesReadyForOwnerReview === true", packet.packetAudit?.allEntriesReadyForOwnerReview === true);
check("G-06", "packetAudit.approvedAnchorReferenceCount === 2", packet.packetAudit?.approvedAnchorReferenceCount === 2);

// ── § H: 금지 필드 — packet 전체 어디에도 실행 흔적 없어야 함 ────────────────
const packetStr = JSON.stringify(packet);
check("H-01", "packet 전체에 openaiRequestBody 문자열 없음", !packetStr.includes("openaiRequestBody"));
check("H-02", "packet 전체에 imageUrl 문자열 없음 (key로서)", !/"imageUrl"\s*:/.test(packetStr));
check("H-03", "packet 전체에 generatedImagePath 문자열 없음 (key로서)", !/"generatedImagePath"\s*:/.test(packetStr));
check("H-04", "packet 전체에 chatgptResponse 문자열 없음", !packetStr.includes("chatgptResponse"));
check("H-05", "packet 전체에 playwrightSession 문자열 없음", !packetStr.includes("playwrightSession"));

// ── § I: builder 소스 — 실행 금지 패턴 검사 ──────────────────────────────────
check("I-01", "builder는 fetch( 호출 없음", !/\bfetch\s*\(/.test(builderSrc));
check("I-02", "builder는 node-fetch import 없음", !/(import|require)[^\n]*['"`]node-fetch['"`]/.test(builderSrc));
check("I-03", "builder는 http/https 모듈 import 없음", !/(import|require)[^\n]*['"`]node:?(http|https)['"`]/.test(builderSrc));
check("I-04", "builder는 child_process import 없음", !/(import|require)[^\n]*['"`]node:?child_process['"`]/.test(builderSrc));
check("I-05", "builder는 openaiRequestBody 필드를 실제로 할당/생성하지 않음 (주석 언급은 허용)", !/openaiRequestBody\s*[:=]/.test(builderSrc));
check("I-06", "builder는 imageUrl 필드 생성 안 함", !/imageUrl\s*[:=]/.test(builderSrc));
check("I-07", "builder는 generatedImagePath 필드 생성 안 함", !/generatedImagePath\s*[:=]/.test(builderSrc));
check("I-08", "builder는 ChatGPT import 없음", !/chatgpt/i.test(builderSrc.replace(/\/\/.*$/gm, "")) || !/(import|require)/.test(builderSrc.match(/chatgpt/gi)?.join("") || ""));
check("I-09", "builder는 playwright import 없음", !/(import|require)[^\n]*playwright/i.test(builderSrc));
check("I-10", "builder는 imageGeneration true로 강제하지 않음 (false 고정)", !/imageGenerationExecuted\s*:\s*true/.test(builderSrc));
check("I-11", "builder는 networkExecuted true로 강제하지 않음 (false 고정)", !/networkExecuted\s*:\s*true/.test(builderSrc));
check("I-12", "builder는 submissionBlockedUntilOwnerApproval false로 강제하지 않음", !/submissionBlockedUntilOwnerApproval\s*:\s*false/.test(builderSrc));
check("I-13", "builder는 request pack fixture를 contract-driven으로 소비 (하드코딩 매핑 없음 — generationTargets.map 사용)", /generationTargets\.map\(/.test(builderSrc));
check("I-14", "builder는 anchor를 excludedFromQaTargets로 표시", /excludedFromQaTargets/.test(builderSrc));

// ── § J: 기존 request pack fixture/guard 미수정 보존 확인 (read-only 소비) ──
check("J-01", "request pack fixture에 generationTargets 4개 유지", requestPack.generationTargets?.length === 4);
check("J-02", "request pack fixture에 approvedAnchorRefs 2개 유지", requestPack.approvedAnchorRefs?.length === 2);

// ── 결과 출력 ─────────────────────────────────────────────────────────────
console.log(`\n=== check-premium-editorial-scene-owner-presubmit-qa-packet-static ===`);
console.log(`PASS: ${pass}  FAIL: ${fail}  TOTAL: ${pass + fail}`);
if (fail > 0) {
  console.log(`\nFAILED CHECKS:`);
  for (const f of fails) console.log(`  - ${f}`);
  process.exit(1);
}
console.log(`✅ ALL CHECKS PASSED`);
