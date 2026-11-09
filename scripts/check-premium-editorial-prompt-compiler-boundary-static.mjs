#!/usr/bin/env node
// ──────────────────────────────────────────────────────────────────────────
// check-premium-editorial-prompt-compiler-boundary-static.mjs
//
// PROMPT COMPILER V1 IMPLEMENTATION BOUNDARY GUARD
//
// 이 guard는 "Prompt Compiler V1 구현 전 경계(boundary)가 안전하게 정의됐는지"만 검증한다.
//
// 이 guard는 다음을 하지 않는다:
//   - 실제 프롬프트 생성
//   - 이미지 품질 판정
//   - ChatGPT / Playwright / OpenAI 실행
//   - 이미지 생성
//   - 네트워크 요청
//
// 검증 대상:
//   1) _ai/MONEY_SHORTS_OS_PROMPT_COMPILER_V1_BOUNDARY.md (boundary 문서)
//   2) scripts/fixtures/premium-editorial-visual-system.rule-contract.v1.json
//   3) scripts/fixtures/premium-editorial-prompt-compiler-preflight.v1.json
//   4) scripts/check-premium-editorial-prompt-compiler-preflight-static.mjs
//   5) 이 스크립트 자체 (forbidden import 부재 확인)
// ──────────────────────────────────────────────────────────────────────────

import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..");

const BOUNDARY_DOC_PATH = join(REPO_ROOT, "_ai", "MONEY_SHORTS_OS_PROMPT_COMPILER_V1_BOUNDARY.md");
const CONTRACT_PATH = join(REPO_ROOT, "scripts", "fixtures", "premium-editorial-visual-system.rule-contract.v1.json");
const PREFLIGHT_PATH = join(REPO_ROOT, "scripts", "fixtures", "premium-editorial-prompt-compiler-preflight.v1.json");
const PREFLIGHT_GUARD_PATH = join(REPO_ROOT, "scripts", "check-premium-editorial-prompt-compiler-preflight-static.mjs");
const SELF_PATH = join(REPO_ROOT, "scripts", "check-premium-editorial-prompt-compiler-boundary-static.mjs");

let boundaryDoc = "";
let contract = null;
let preflight = null;
let preflightGuardText = "";
let selfText = "";

const results = [];
function check(name, condition, detail = "") {
  results.push({ name, pass: !!condition, detail });
}

// ── load ──────────────────────────────────────────────────────────────────
try {
  boundaryDoc = readFileSync(BOUNDARY_DOC_PATH, "utf8");
} catch (e) {
  console.error(`FATAL: cannot read boundary doc: ${e.message}`);
  process.exit(2);
}
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
  preflightGuardText = readFileSync(PREFLIGHT_GUARD_PATH, "utf8");
} catch (e) {
  console.error(`FATAL: cannot read preflight guard script: ${e.message}`);
  process.exit(2);
}
try {
  selfText = readFileSync(SELF_PATH, "utf8");
} catch (e) {
  console.error(`FATAL: cannot read self for forbidden-import check: ${e.message}`);
  process.exit(2);
}

// ═══════════════════════════════════════════════════════════════════════════
// § A. Boundary Document Existence & Basic Structure
// ═══════════════════════════════════════════════════════════════════════════

check(
  "A-01: boundary 문서 파일 존재",
  existsSync(BOUNDARY_DOC_PATH),
  BOUNDARY_DOC_PATH
);

check(
  "A-02: boundary 문서 비어 있지 않음",
  boundaryDoc.length > 500,
  `length=${boundaryDoc.length}`
);

check(
  "A-03: boundary 문서 제목 포함",
  boundaryDoc.includes("Prompt Compiler V1 Implementation Boundary"),
  ""
);

// ── Rule Contract / Preflight fixture 파일명 참조 ──
check(
  "A-04: boundary 문서가 Rule Contract 파일명 참조",
  boundaryDoc.includes("premium-editorial-visual-system.rule-contract.v1.json"),
  ""
);

check(
  "A-05: boundary 문서가 Preflight 파일명 참조",
  boundaryDoc.includes("premium-editorial-prompt-compiler-preflight.v1.json"),
  ""
);

// ── 이 문서는 구현 아님 명시 ──
check(
  "A-06: boundary 문서가 '구현이 아니다' 명시",
  boundaryDoc.includes("구현이 아니다"),
  ""
);

check(
  "A-07: boundary 문서가 'finalPrompt 생성이 아니다' 명시",
  boundaryDoc.includes("finalPrompt 생성이 아니다"),
  ""
);

check(
  "A-08: boundary 문서가 '이미지 생성이 아니다' 명시",
  boundaryDoc.includes("이미지 생성이 아니다"),
  ""
);

check(
  "A-09: boundary 문서가 'ChatGPT / Playwright 실행이 아니다' 명시",
  boundaryDoc.includes("ChatGPT") && boundaryDoc.includes("Playwright 실행이 아니다"),
  ""
);

// ═══════════════════════════════════════════════════════════════════════════
// § B. Input Boundary Fields
// ═══════════════════════════════════════════════════════════════════════════

const inputFields = [
  "sceneRoleContract",
  "visualCategoryPool",
  "objectFamilyPool",
  "diversityRules",
  "previousSceneVisualHistory",
  "forbiddenObjects",
  "forbiddenCompositions",
  "sourceOfTruthPolicy",
];

for (const field of inputFields) {
  check(
    `B: input boundary에 '${field}' 포함`,
    boundaryDoc.includes(field),
    ""
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// § C. Output Boundary Fields
// ═══════════════════════════════════════════════════════════════════════════

const outputFields = [
  "sceneRole",
  "selectedVisualCategory",
  "selectedObjectFamilies",
  "spaceType",
  "cameraDistance",
  "compositionProfile",
  "graphicLayerMode",
  "forbiddenObjects",
  "forbiddenCompositions",
  "qaExpectationIds",
];

for (const field of outputFields) {
  check(
    `C: output boundary에 '${field}' 포함`,
    boundaryDoc.includes(field),
    ""
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// § D. Forbidden Output Fields
// ═══════════════════════════════════════════════════════════════════════════

const forbiddenOutputFields = [
  "finalPrompt",
  "promptText",
  "generatedPrompt",
  "chatgptPrompt",
];

for (const field of forbiddenOutputFields) {
  check(
    `D: forbidden output fields에 '${field}' 포함`,
    boundaryDoc.includes(field),
    ""
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// § E. Deterministic Overlay Source-of-Truth
// ═══════════════════════════════════════════════════════════════════════════

check(
  "E-01: boundary 문서가 'deterministic overlay' 원칙 포함",
  boundaryDoc.includes("deterministic overlay"),
  ""
);

check(
  "E-02: boundary 문서가 'exactValuesInImage: false' 참조",
  boundaryDoc.includes("exactValuesInImage: false"),
  ""
);

check(
  "E-03: boundary 문서가 'deterministicOverlayOwnsExactValues: true' 참조",
  boundaryDoc.includes("deterministicOverlayOwnsExactValues: true"),
  ""
);

check(
  "E-04: Rule Contract가 deterministicOverlayOwnsExactValues=true 선언",
  contract?.imageTextSourceOfTruthPolicy?.deterministicOverlayOwnsExactValues === true,
  ""
);

check(
  "E-05: Preflight Fixture가 deterministicOverlayOwnsExactValues=true 선언",
  preflight?.sourceOfTruthPolicyRef?.deterministicOverlayOwnsExactValues === true,
  ""
);

check(
  "E-06: Preflight Fixture policy가 deterministic_overlay",
  preflight?.sourceOfTruthPolicyRef?.policy === "deterministic_overlay",
  ""
);

// ═══════════════════════════════════════════════════════════════════════════
// § F. No-Network / No-Runner Boundary
// ═══════════════════════════════════════════════════════════════════════════

const noNetworkItems = [
  "openai",
  "ChatGPT",
  "Playwright",
  "fetch",
  "http",
  "https",
  "child_process",
];

for (const item of noNetworkItems) {
  check(
    `F: no-network/no-runner에 '${item}' 금지 명시`,
    boundaryDoc.includes(item),
    ""
  );
}

// ── 이 guard 자체 forbidden import 없음 확인 ──
const selfForbiddenImports = [
  "openai",
  "playwright",
  "node-fetch",
  "child_process",
];

for (const imp of selfForbiddenImports) {
  const importPattern = new RegExp(`(import|require).*['"\`]${imp}['"\`]`);
  check(
    `F-self: 이 boundary guard가 '${imp}'를 import/require하지 않음`,
    !importPattern.test(selfText),
    `searched for import/require of '${imp}'`
  );
}

// ── http/https import 없음 확인 (별도) ──
check(
  "F-self: 이 boundary guard가 'http' 모듈을 import하지 않음",
  !/import.*['"`]node:http['"`]/.test(selfText) && !/require\(['"`]http['"`]\)/.test(selfText),
  ""
);

check(
  "F-self: 이 boundary guard가 'https' 모듈을 import하지 않음",
  !/import.*['"`]node:https['"`]/.test(selfText) && !/require\(['"`]https['"`]\)/.test(selfText),
  ""
);

// ═══════════════════════════════════════════════════════════════════════════
// § G. Preflight Guard File Existence & schemaVersion Reference
// ═══════════════════════════════════════════════════════════════════════════

check(
  "G-01: Preflight guard 파일 존재",
  existsSync(PREFLIGHT_GUARD_PATH),
  PREFLIGHT_GUARD_PATH
);

check(
  "G-02: Preflight guard가 preflight schemaVersion 문자열 참조",
  preflightGuardText.includes("money_shorts_prompt_compiler_preflight_v1"),
  ""
);

check(
  "G-03: Preflight Fixture schemaVersion 일치",
  preflight?.schemaVersion === "money_shorts_prompt_compiler_preflight_v1",
  `actual=${preflight?.schemaVersion}`
);

check(
  "G-04: Preflight Fixture isPromptCompilerImplementation=false",
  preflight?.isPromptCompilerImplementation === false,
  ""
);

check(
  "G-05: Preflight Fixture isImageGenerationRunner=false",
  preflight?.isImageGenerationRunner === false,
  ""
);

check(
  "G-06: Preflight Fixture containsFinalPrompt=false",
  preflight?.containsFinalPrompt === false,
  ""
);

// ═══════════════════════════════════════════════════════════════════════════
// § H. Rule Contract Source-of-Truth Integrity
// ═══════════════════════════════════════════════════════════════════════════

check(
  "H-01: Rule Contract schemaVersion 존재",
  typeof contract?.schemaVersion === "string" && contract.schemaVersion.length > 0,
  `actual=${contract?.schemaVersion}`
);

check(
  "H-02: Rule Contract schemaVersion이 expected value",
  contract?.schemaVersion === "money_shorts_visual_system_rule_contract_v1",
  `actual=${contract?.schemaVersion}`
);

check(
  "H-03: Rule Contract sceneRoleContract 존재",
  Array.isArray(contract?.sceneRoleContract?.roles) && contract.sceneRoleContract.roles.length > 0,
  `roles count=${contract?.sceneRoleContract?.roles?.length}`
);

check(
  "H-04: Rule Contract sceneRoleContract 6개 role 포함",
  contract?.sceneRoleContract?.roles?.length === 6,
  `actual=${contract?.sceneRoleContract?.roles?.length}`
);

check(
  "H-05: Rule Contract visualCategoryPool 존재",
  Array.isArray(contract?.visualCategoryPool?.categories) && contract.visualCategoryPool.categories.length > 0,
  `categories count=${contract?.visualCategoryPool?.categories?.length}`
);

check(
  "H-06: Rule Contract objectFamilyPool 존재",
  Array.isArray(contract?.objectFamilyPool?.families) && contract.objectFamilyPool.families.length > 0,
  `families count=${contract?.objectFamilyPool?.families?.length}`
);

check(
  "H-07: Rule Contract diversityRules.rules 배열 존재",
  Array.isArray(contract?.diversityRules?.rules) && contract.diversityRules.rules.length > 0,
  `rules count=${contract?.diversityRules?.rules?.length}`
);

check(
  "H-08: Rule Contract promptCompilerContract isImplementation=false",
  contract?.promptCompilerContract?.isImplementation === false,
  ""
);

check(
  "H-09: Rule Contract visualQaContract.checks 배열 존재",
  Array.isArray(contract?.visualQaContract?.checks) && contract.visualQaContract.checks.length > 0,
  `checks count=${contract?.visualQaContract?.checks?.length}`
);

check(
  "H-10: Rule Contract imageTextSourceOfTruthPolicy exactValuesInImage=false",
  contract?.imageTextSourceOfTruthPolicy?.exactValuesInImage === false,
  ""
);

// ═══════════════════════════════════════════════════════════════════════════
// § I. Preflight Fixture Scene Structure Integrity
// ═══════════════════════════════════════════════════════════════════════════

check(
  "I-01: Preflight Fixture scenes 배열 존재",
  Array.isArray(preflight?.scenes) && preflight.scenes.length > 0,
  `scenes count=${preflight?.scenes?.length}`
);

check(
  "I-02: Preflight Fixture scenes 6개",
  preflight?.scenes?.length === 6,
  `actual=${preflight?.scenes?.length}`
);

const preflightScenes = preflight?.scenes ?? [];

check(
  "I-03: 모든 preflight scene에 sceneRole 존재",
  preflightScenes.every(s => typeof s.sceneRole === "string" && s.sceneRole.length > 0),
  ""
);

check(
  "I-04: 모든 preflight scene에 selectedVisualCategory 존재",
  preflightScenes.every(s => typeof s.selectedVisualCategory === "string" && s.selectedVisualCategory.length > 0),
  ""
);

check(
  "I-05: 모든 preflight scene에 selectedObjectFamilies 배열 존재",
  preflightScenes.every(s => Array.isArray(s.selectedObjectFamilies) && s.selectedObjectFamilies.length > 0),
  ""
);

check(
  "I-06: 모든 preflight scene에 forbiddenObjects 배열 존재",
  preflightScenes.every(s => Array.isArray(s.forbiddenObjects)),
  ""
);

check(
  "I-07: 모든 preflight scene에 forbiddenCompositions 배열 존재",
  preflightScenes.every(s => Array.isArray(s.forbiddenCompositions)),
  ""
);

check(
  "I-08: 모든 preflight scene에 qaExpectationIds 배열 존재",
  preflightScenes.every(s => Array.isArray(s.qaExpectationIds) && s.qaExpectationIds.length > 0),
  ""
);

check(
  "I-09: 모든 preflight scene에 sourceOfTruthPolicyRef 존재",
  preflightScenes.every(s => s.sourceOfTruthPolicyRef === "deterministic_overlay"),
  ""
);

check(
  "I-10: preflight scene 1 sceneRole이 scene_1_hook",
  preflightScenes[0]?.sceneRole === "scene_1_hook",
  `actual=${preflightScenes[0]?.sceneRole}`
);

// ═══════════════════════════════════════════════════════════════════════════
// § J. Next Implementation Gate Presence in Boundary Doc
// ═══════════════════════════════════════════════════════════════════════════

check(
  "J-01: boundary 문서에 'Next Implementation Gate' 섹션 포함",
  boundaryDoc.includes("Next Implementation Gate"),
  ""
);

check(
  "J-02: boundary 문서 gate에 boundary static guard 파일명 포함",
  boundaryDoc.includes("check-premium-editorial-prompt-compiler-boundary-static.mjs"),
  ""
);

check(
  "J-03: boundary 문서 gate에 'Codex / Owner 승인' 조건 포함",
  boundaryDoc.includes("Codex") && boundaryDoc.includes("Owner 승인"),
  ""
);

// ═══════════════════════════════════════════════════════════════════════════
// § K. Boundary Doc References Rule Contract Source-of-Truth Boundary
// ═══════════════════════════════════════════════════════════════════════════

check(
  "K-01: boundary 문서가 Rule Contract schemaVersion 참조",
  boundaryDoc.includes("money_shorts_visual_system_rule_contract_v1"),
  ""
);

check(
  "K-02: boundary 문서가 Preflight schemaVersion 참조",
  boundaryDoc.includes("money_shorts_prompt_compiler_preflight_v1"),
  ""
);

check(
  "K-03: boundary 문서가 'source of truth' 언급",
  boundaryDoc.toLowerCase().includes("source of truth"),
  ""
);

// ═══════════════════════════════════════════════════════════════════════════
// § L. Contract Path Accuracy (Diversity & QA)
// ═══════════════════════════════════════════════════════════════════════════

// 올바른 경로 참조 확인
check(
  "L-01: boundary 문서가 diversityRules.rules 참조",
  boundaryDoc.includes("diversityRules.rules"),
  ""
);

check(
  "L-02: boundary 문서가 visualQaContract.checks 참조",
  boundaryDoc.includes("visualQaContract.checks"),
  ""
);

// 잘못된 경로 제외 확인
check(
  "L-03: boundary 문서가 deprecated 경로 'diversityRules.objectFamilyDiversityPolicy' 제외",
  !boundaryDoc.includes("diversityRules.objectFamilyDiversityPolicy"),
  ""
);

check(
  "L-04: boundary 문서가 deprecated 경로 'visualQaContract.qaExpectationPool' 제외",
  !boundaryDoc.includes("visualQaContract.qaExpectationPool"),
  ""
);

check(
  "L-05: boundary 문서가 실제 diversityRules rule id '9가지 다양성 규칙' 명시",
  boundaryDoc.includes("same_space_repeat_limit") &&
  boundaryDoc.includes("same_camera_distance_repeat_limit") &&
  boundaryDoc.includes("smartphone_centered_repeat_limit"),
  ""
);

check(
  "L-06: boundary 문서가 실제 visualQaContract check id '11가지 QA 기준' 명시",
  boundaryDoc.includes("role_differentiation") &&
  boundaryDoc.includes("realistic_not_stock") &&
  boundaryDoc.includes("source_of_truth_overlay"),
  ""
);

// ═══════════════════════════════════════════════════════════════════════════
// Result Summary
// ═══════════════════════════════════════════════════════════════════════════

const pass = results.filter(r => r.pass);
const fail = results.filter(r => !r.pass);

console.log(`\n══════════════════════════════════════════════════════════`);
console.log(`  PROMPT COMPILER V1 BOUNDARY STATIC GUARD`);
console.log(`══════════════════════════════════════════════════════════`);

for (const r of results) {
  const mark = r.pass ? "✅" : "❌";
  const detail = r.detail ? `  (${r.detail})` : "";
  console.log(`  ${mark} ${r.name}${detail}`);
}

console.log(`\n──────────────────────────────────────────────────────────`);
console.log(`  TOTAL : ${results.length}`);
console.log(`  PASS  : ${pass.length}`);
console.log(`  FAIL  : ${fail.length}`);
console.log(`──────────────────────────────────────────────────────────\n`);

if (fail.length > 0) {
  console.error(`BOUNDARY GUARD FAILED (${fail.length} failures):`);
  for (const r of fail) {
    console.error(`  ❌ ${r.name}`);
  }
  process.exit(1);
} else {
  console.log(`BOUNDARY GUARD PASSED — ${pass.length}/${results.length} checks OK`);
  process.exit(0);
}
