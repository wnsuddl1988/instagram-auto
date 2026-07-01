#!/usr/bin/env node
// ──────────────────────────────────────────────────────────────────────────
// check-premium-editorial-scene-selected-image-set-static.mjs
//
// SCENE 1~6 SELECTED IMAGE SET — STRUCTURE/PATH/DIMENSION GUARD
// (NOT an image-quality judge, NOT a prompt-quality judge)
//
// 이 guard는 selected image set manifest(v1)가:
//   - v2 request pack의 sceneRole/category/objectFamilies와 정확히 일치하는지
//   - selectedScenes가 정확히 6개(order 1~6)인지
//   - 모든 imagePath가 repo-relative + output/money-shorts/scene-1-6-fullset-first-run-v1/ 아래인지
//   - 모든 선택 이미지 파일이 로컬에 실제 존재하는지
//   - PNG header 기반 width/height가 9:16 계열(세로, ratio ~= 9:16 근접)인지
//   - Scene 2 selected path가 retry-01이고 first-run 원본이 selected로 들어가지 않았는지
//   - Scene 1,3,4,5,6 path가 first-run 파일인지
//   - 이미지 생성/네트워크/렌더/mux/업로드 boundary가 전부 false인지
//   - openai/playwright/fetch/http/https/child_process/node-fetch import/실행이 없는지 (self-guard)
// 를 구조적으로 검증한다.
//
// 검증 대상:
//   1) scripts/fixtures/premium-editorial-scene-image-request-pack.v2.json
//   2) scripts/fixtures/premium-editorial-scene-selected-image-set.v1.json
//   3) scripts/build-premium-editorial-scene-selected-image-set-v1.mjs (forbidden import)
//   4) 이 스크립트 자체 (forbidden import)
// ──────────────────────────────────────────────────────────────────────────

import { readFileSync, existsSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..");

const V2_PACK_PATH = join(REPO_ROOT, "scripts", "fixtures", "premium-editorial-scene-image-request-pack.v2.json");
const MANIFEST_PATH = join(REPO_ROOT, "scripts", "fixtures", "premium-editorial-scene-selected-image-set.v1.json");
const BUILDER_PATH = join(__dirname, "build-premium-editorial-scene-selected-image-set-v1.mjs");
const SELF_PATH = join(__dirname, "check-premium-editorial-scene-selected-image-set-static.mjs");

const results = [];
function check(name, condition, detail = "") {
  results.push({ name, pass: !!condition, detail });
}

// ── load ──────────────────────────────────────────────────────────────────
let pack, manifest, builderText, selfText;
try {
  pack = JSON.parse(readFileSync(V2_PACK_PATH, "utf8"));
} catch (e) {
  console.error(`FATAL: cannot read/parse v2 request pack: ${e.message}`);
  process.exit(2);
}
try {
  manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
} catch (e) {
  console.error(`FATAL: cannot read/parse selected image set manifest: ${e.message}`);
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

// ── PNG header에서 width/height 읽기 (IHDR chunk, no external lib) ─────────
function readPngDimensions(absPath) {
  try {
    const fd = readFileSync(absPath);
    // PNG signature(8) + IHDR length(4) + "IHDR"(4) + width(4) + height(4)
    if (fd.length < 24) return null;
    const sig = fd.subarray(0, 8);
    const expectedSig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    if (!sig.equals(expectedSig)) return null;
    const width = fd.readUInt32BE(16);
    const height = fd.readUInt32BE(20);
    return { width, height };
  } catch {
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// § A. top-level schema / status / boundaries
// ═══════════════════════════════════════════════════════════════════════════
check("A-01: manifest schemaVersion === money_shorts_scene_selected_image_set_v1",
  manifest.schemaVersion === "money_shorts_scene_selected_image_set_v1", manifest.schemaVersion);
check("A-02: manifest status === data_only_selected_not_rendered",
  manifest.status === "data_only_selected_not_rendered", manifest.status);
check("A-03: title 존재", typeof manifest.title === "string" && manifest.title.length > 0);
check("A-04: purpose 존재", typeof manifest.purpose === "string" && manifest.purpose.length > 0);
check("A-05: sourceRefs.requestPack.path 참조", manifest.sourceRefs?.requestPack?.path === "scripts/fixtures/premium-editorial-scene-image-request-pack.v2.json");
check("A-06: sourceRefs.requestPack.schemaVersion 일치", manifest.sourceRefs?.requestPack?.schemaVersion === pack.schemaVersion);
check("A-07: renderReadyCandidate === true", manifest.renderReadyCandidate === true);
check("A-08: deterministicOverlayRequired === true", manifest.deterministicOverlayRequired === true);
check("A-09: ownerReviewRequired === true", manifest.ownerReviewRequired === true);
check("A-10: renderNotYetPerformed === true", manifest.renderNotYetPerformed === true);
check("A-11: mp4NotYetGenerated === true", manifest.mp4NotYetGenerated === true);
check("A-12: muxNotYetPerformed === true", manifest.muxNotYetPerformed === true);
check("A-13: uploadNotYetPerformed === true", manifest.uploadNotYetPerformed === true);

// ═══════════════════════════════════════════════════════════════════════════
// § B. executionBoundaries 전부 false (no image gen / network / render / mux / upload)
// ═══════════════════════════════════════════════════════════════════════════
const eb = manifest.executionBoundaries || {};
check("B-01: executionBoundaries.imageGenerationExecuted === false", eb.imageGenerationExecuted === false);
check("B-02: executionBoundaries.networkExecuted === false", eb.networkExecuted === false);
check("B-03: executionBoundaries.renderExecuted === false", eb.renderExecuted === false);
check("B-04: executionBoundaries.muxExecuted === false", eb.muxExecuted === false);
check("B-05: executionBoundaries.uploadExecuted === false", eb.uploadExecuted === false);
check("B-06: executionBoundaries.note 존재", typeof eb.note === "string" && eb.note.length > 0);

// ═══════════════════════════════════════════════════════════════════════════
// § C. selectedScenes: 정확히 6개, order 1~6, v2 pack과 role/category/family 일치
// ═══════════════════════════════════════════════════════════════════════════
const scenes = manifest.selectedScenes || [];
check("C-01: selectedScenes is array", Array.isArray(scenes));
check("C-02: selectedScenes count === 6", scenes.length === 6, String(scenes.length));
const orders = scenes.map((s) => s.sceneOrder).slice().sort((a, b) => a - b);
check("C-03: selectedScenes orders === [1,2,3,4,5,6]", JSON.stringify(orders) === JSON.stringify([1, 2, 3, 4, 5, 6]), JSON.stringify(orders));

const packByOrder = new Map((pack.generationTargets || []).map((t) => [t.sceneOrder, t]));
for (const s of scenes) {
  const pt = packByOrder.get(s.sceneOrder);
  check(`C-04: scene order ${s.sceneOrder} has matching v2 pack target`, !!pt);
  if (!pt) continue;
  check(`C-05: scene order ${s.sceneOrder} sceneId matches v2 pack`, s.sceneId === pt.sceneId);
  check(`C-06: scene order ${s.sceneOrder} sceneRole matches v2 pack`, s.sceneRole === pt.sceneRole);
  check(`C-07: scene order ${s.sceneOrder} selectedVisualCategory matches v2 pack`, s.selectedVisualCategory === pt.selectedVisualCategory);
  check(`C-08: scene order ${s.sceneOrder} selectedObjectFamilies matches v2 pack`, JSON.stringify(s.selectedObjectFamilies) === JSON.stringify(pt.selectedObjectFamilies));
  check(`C-09: scene order ${s.sceneOrder} spaceType matches v2 pack`, s.spaceType === pt.spaceType);
  check(`C-10: scene order ${s.sceneOrder} cameraDistance matches v2 pack`, s.cameraDistance === pt.cameraDistance);
}

// ═══════════════════════════════════════════════════════════════════════════
// § D. imagePath: repo-relative, 지정 폴더 아래, 로컬 파일 존재, PNG 9:16 계열
// ═══════════════════════════════════════════════════════════════════════════
const REQUIRED_PREFIX = "output/money-shorts/scene-1-6-fullset-first-run-v1/";
for (const s of scenes) {
  check(`D-01: scene ${s.sceneOrder} imagePath is repo-relative (no drive letter/absolute)`,
    typeof s.imagePath === "string" && !/^[A-Za-z]:[\\/]/.test(s.imagePath) && !s.imagePath.startsWith("/"));
  check(`D-02: scene ${s.sceneOrder} imagePath under ${REQUIRED_PREFIX}`,
    typeof s.imagePath === "string" && s.imagePath.startsWith(REQUIRED_PREFIX));
  const absPath = join(REPO_ROOT, s.imagePath || "");
  const exists = existsSync(absPath);
  check(`D-03: scene ${s.sceneOrder} imagePath file exists locally`, exists, s.imagePath);
  check(`D-04: scene ${s.sceneOrder} localFileExists field === true`, s.localFileExists === true);
  if (exists) {
    const stat = statSync(absPath);
    check(`D-05: scene ${s.sceneOrder} file is non-empty`, stat.size > 10000, `${stat.size} bytes`);
    const dims = readPngDimensions(absPath);
    check(`D-06: scene ${s.sceneOrder} is a valid PNG (readable IHDR)`, !!dims);
    if (dims) {
      const isPortrait = dims.height > dims.width;
      const ratio = dims.width / dims.height;
      const expectedRatio = 9 / 16;
      const ratioClose = Math.abs(ratio - expectedRatio) < 0.05;
      check(`D-07: scene ${s.sceneOrder} PNG is portrait (height > width)`, isPortrait, `${dims.width}x${dims.height}`);
      check(`D-08: scene ${s.sceneOrder} PNG ratio close to 9:16`, ratioClose, `ratio=${ratio.toFixed(4)} expected=${expectedRatio.toFixed(4)}`);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// § E. Scene 2: retry-01 채택 확인, first-run 원본 미채택 확인
// ═══════════════════════════════════════════════════════════════════════════
const scene2 = scenes.find((s) => s.sceneOrder === 2);
check("E-01: scene 2 존재", !!scene2);
check("E-02: scene 2 sourceRun === retry_01", scene2?.sourceRun === "retry_01");
check("E-03: scene 2 imagePath ends with retry-01.png", /retry-01\.png$/.test(scene2?.imagePath || ""));
check("E-04: scene 2 imagePath is NOT the first-run original (scene-02-scene_2_signal.png)",
  scene2?.imagePath !== `${REQUIRED_PREFIX}scene-02-scene_2_signal.png`);
check("E-05: scene 2 supersededPaths includes the first-run original",
  (scene2?.supersededPaths || []).includes(`${REQUIRED_PREFIX}scene-02-scene_2_signal.png`));
check("E-06: scene 2 selectionVerdict === keep_candidate", scene2?.selectionVerdict === "keep_candidate");
check("E-07: scene 2 warnings non-empty (경고 보존)", Array.isArray(scene2?.warnings) && scene2.warnings.length > 0);

// ═══════════════════════════════════════════════════════════════════════════
// § F. Scene 1,3,4,5,6: first_run 파일 확인
// ═══════════════════════════════════════════════════════════════════════════
const FIRST_RUN_FILES = {
  1: "scene-01-scene_1_hook.png",
  3: "scene-03-scene_3_context.png",
  4: "scene-04-scene_4_life_impact.png",
  5: "scene-05-scene_5_watch_point.png",
  6: "scene-06-scene_6_action_closing.png",
};
for (const [orderStr, fileName] of Object.entries(FIRST_RUN_FILES)) {
  const order = parseInt(orderStr, 10);
  const s = scenes.find((x) => x.sceneOrder === order);
  check(`F: scene ${order} sourceRun === first_run`, s?.sourceRun === "first_run");
  check(`F: scene ${order} imagePath === ${REQUIRED_PREFIX}${fileName}`, s?.imagePath === `${REQUIRED_PREFIX}${fileName}`);
  check(`F: scene ${order} selectionVerdict is keep or keep_candidate`, s?.selectionVerdict === "keep" || s?.selectionVerdict === "keep_candidate");
}

// ── Scene 6 경고 보존 확인 ───────────────────────────────────────────────────
const scene6 = scenes.find((s) => s.sceneOrder === 6);
check("F: scene 6 warnings non-empty (planning motif 경고 보존)", Array.isArray(scene6?.warnings) && scene6.warnings.length > 0);
check("F: scene 6 selectionVerdict === keep", scene6?.selectionVerdict === "keep");

// ── Scene 1,3,4,5는 warnings 비어있음 (경고 없는 scene) ─────────────────────
for (const order of [1, 3, 4, 5]) {
  const s = scenes.find((x) => x.sceneOrder === order);
  check(`F: scene ${order} warnings empty (경고 없음)`, Array.isArray(s?.warnings) && s.warnings.length === 0);
}

// ═══════════════════════════════════════════════════════════════════════════
// § G. set-level 평가 필드 존재
// ═══════════════════════════════════════════════════════════════════════════
check("G-01: visualRhythmEvaluation 존재", typeof manifest.visualRhythmEvaluation === "object" && manifest.visualRhythmEvaluation !== null);
check("G-02: visualRhythmEvaluation.spaceTypeSequence 길이 === 6", (manifest.visualRhythmEvaluation?.spaceTypeSequence || []).length === 6);
check("G-03: repetitionConvergenceEvidence 존재", typeof manifest.repetitionConvergenceEvidence === "object" && manifest.repetitionConvergenceEvidence !== null);
check("G-04: woodTableHandSmartphoneNotebookCoffeeConvergenceDetected === false",
  manifest.repetitionConvergenceEvidence?.woodTableHandSmartphoneNotebookCoffeeConvergenceDetected === false);
check("G-05: planningObjectsAdjacentRepeat.scenes === [5,6]",
  JSON.stringify(manifest.repetitionConvergenceEvidence?.planningObjectsAdjacentRepeat?.scenes) === JSON.stringify([5, 6]));
check("G-06: planningObjectsAdjacentRepeat.withinAllowedLimit === true",
  manifest.repetitionConvergenceEvidence?.planningObjectsAdjacentRepeat?.withinAllowedLimit === true);
check("G-07: overlayPolicySummary.exactValuesInImage === false", manifest.overlayPolicySummary?.exactValuesInImage === false);
check("G-08: overlayPolicySummary.deterministicOverlayOwnsExactValues === true", manifest.overlayPolicySummary?.deterministicOverlayOwnsExactValues === true);

// ═══════════════════════════════════════════════════════════════════════════
// § H. setAudit
// ═══════════════════════════════════════════════════════════════════════════
const audit = manifest.setAudit || {};
check("H-01: setAudit.selectedSceneCount === 6", audit.selectedSceneCount === 6);
check("H-02: setAudit.selectedSceneOrders === [1,2,3,4,5,6]", JSON.stringify(audit.selectedSceneOrders) === JSON.stringify([1, 2, 3, 4, 5, 6]));
check("H-03: setAudit.scenesWithWarnings === [2,6]", JSON.stringify(audit.scenesWithWarnings) === JSON.stringify([2, 6]));
check("H-04: setAudit.scenesUsingRetry === [2]", JSON.stringify(audit.scenesUsingRetry) === JSON.stringify([2]));
check("H-05: setAudit.allImagesExistLocally === true", audit.allImagesExistLocally === true);
check("H-06: setAudit.renderReadyCandidate === true", audit.renderReadyCandidate === true);

// ═══════════════════════════════════════════════════════════════════════════
// § I. forbidden execution imports/calls (self-guard, builder + this guard)
// ═══════════════════════════════════════════════════════════════════════════
const forbiddenImports = ["openai", "playwright", "node-fetch", "child_process"];
for (const imp of forbiddenImports) {
  const pat = new RegExp(`(import|require)[^\\n]*['"\`]${imp}['"\`]`);
  check(`I: builder does NOT import/require '${imp}'`, !pat.test(builderText));
  check(`I: guard does NOT import/require '${imp}'`, !pat.test(selfText));
}
check("I: builder does NOT import node:http/https",
  !/import[^\n]*['"`]node:https?['"`]/.test(builderText) && !/require\(['"`]https?['"`]\)/.test(builderText));
check("I: guard does NOT import node:http/https",
  !/import[^\n]*['"`]node:https?['"`]/.test(selfText) && !/require\(['"`]https?['"`]\)/.test(selfText));
check("I: builder does NOT call fetch(", !/\bfetch\s*\(/.test(builderText));
check("I: guard does NOT import fetch runner (node-fetch checked above)",
  !/(import|require)[^\n]*['"`]node-fetch['"`]/.test(selfText));

// ── 실행/렌더 관련 필드를 true로 강제하지 않는지 (builder 소스 검사) ────────
check("I: builder does NOT force imageGenerationExecuted:true", !/imageGenerationExecuted\s*:\s*true/.test(builderText));
check("I: builder does NOT force renderExecuted:true", !/renderExecuted\s*:\s*true/.test(builderText));
check("I: builder does NOT force muxExecuted:true", !/muxExecuted\s*:\s*true/.test(builderText));
check("I: builder does NOT force uploadExecuted:true", !/uploadExecuted\s*:\s*true/.test(builderText));

// ═══════════════════════════════════════════════════════════════════════════
// § J. builder: v2 pack driven (하드코딩 scene role/category 매핑 없음)
// ═══════════════════════════════════════════════════════════════════════════
check("J-01: builder reads v2 pack generationTargets via packScenes.map", /packScenes\.map\(/.test(builderText));
check("J-02: builder validates v2 pack scene count === 6 (FATAL on mismatch)",
  /packScenes\.length !== 6/.test(builderText) && /process\.exit\(2\)/.test(builderText));
check("J-03: builder uses existsSync for localFileExists (실제 로컬 확인)", /existsSync\(/.test(builderText));

// ═══════════════════════════════════════════════════════════════════════════
// Result Summary
// ═══════════════════════════════════════════════════════════════════════════
const pass = results.filter((r) => r.pass);
const fail = results.filter((r) => !r.pass);

console.log(`\n══════════════════════════════════════════════════════════`);
console.log(`  SCENE 1~6 SELECTED IMAGE SET — STRUCTURE/PATH/DIMENSION GUARD`);
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
  console.log(`GUARD OK: selected image set structure + path/dimension + retry-adoption intact (${pass.length}/${results.length}).`);
  process.exit(0);
}
