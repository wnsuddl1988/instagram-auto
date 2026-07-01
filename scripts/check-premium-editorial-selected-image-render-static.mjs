#!/usr/bin/env node
// ──────────────────────────────────────────────────────────────────────────
// check-premium-editorial-selected-image-render-static.mjs
//
// SELECTED IMAGE RENDER MANIFEST + RENDERER — STRUCTURE/SAFETY GUARD
// (NOT an image/video-quality judge; does not execute ffmpeg)
//
// 이 guard는:
//   - render manifest(v1)가 selected image set(v1)을 올바르게 소비했는지
//   - imageInputs가 정확히 6개(order 1~6)이고 assetPath가 selected image set의
//     imagePath와 정확히 일치하는지
//   - Scene 2 assetPath가 retry-01이고 first-run 원본이 아닌지
//   - 모든 assetPath 파일이 로컬에 실제 존재하는지
//   - PNG header 기준 9:16 근접 확인(941x1672 소스)
//   - outputSpec이 1080x1920 / fps 30 / h264 / mp4 / silent인지
//   - duration 합이 30초인지
//   - captionOverlays가 6개이고 timing에 gap/overlap이 없는지
//   - renderer가 placeholder color image를 생성하지 않는지 (ffmpeg lavfi color= 패턴 부재)
//   - renderer가 실제 assetPath를 읽어 concat에 사용하는지
//   - shell:true / exec( / fetch( / openai,playwright,node-fetch,http,https,child_process import가 없는지
//   - render manifest의 executionBoundaries에서 render는 계획만, mux/upload는 false인지
// 를 구조적으로 검증한다 (ffmpeg/ffprobe 실행 없음).
// ──────────────────────────────────────────────────────────────────────────

import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..");

const SELECTED_SET_PATH = join(REPO_ROOT, "scripts", "fixtures", "premium-editorial-scene-selected-image-set.v1.json");
const RENDER_MANIFEST_PATH = join(REPO_ROOT, "scripts", "fixtures", "premium-editorial-selected-image-render-manifest.v1.json");
const BUILDER_PATH = join(__dirname, "build-premium-editorial-selected-image-render-manifest-v1.mjs");
const RENDERER_PATH = join(__dirname, "render-premium-editorial-selected-image-visual-only-v1.mjs");
const SELF_PATH = join(__dirname, "check-premium-editorial-selected-image-render-static.mjs");

const results = [];
function check(name, condition, detail = "") {
  results.push({ name, pass: !!condition, detail });
}

// ── load ──────────────────────────────────────────────────────────────────
let selectedSet, renderManifest, builderText, rendererText, selfText;
try {
  selectedSet = JSON.parse(readFileSync(SELECTED_SET_PATH, "utf8"));
} catch (e) {
  console.error(`FATAL: cannot read/parse selected image set: ${e.message}`);
  process.exit(2);
}
try {
  renderManifest = JSON.parse(readFileSync(RENDER_MANIFEST_PATH, "utf8"));
} catch (e) {
  console.error(`FATAL: cannot read/parse render manifest: ${e.message}`);
  process.exit(2);
}
try {
  builderText = readFileSync(BUILDER_PATH, "utf8");
} catch (e) {
  console.error(`FATAL: cannot read builder script: ${e.message}`);
  process.exit(2);
}
try {
  rendererText = readFileSync(RENDERER_PATH, "utf8");
} catch (e) {
  console.error(`FATAL: cannot read renderer script: ${e.message}`);
  process.exit(2);
}
try {
  selfText = readFileSync(SELF_PATH, "utf8");
} catch (e) {
  console.error(`FATAL: cannot read self: ${e.message}`);
  process.exit(2);
}

// ── PNG header dimensions (IHDR) ─────────────────────────────────────────────
function readPngDimensions(absPath) {
  try {
    const fd = readFileSync(absPath);
    if (fd.length < 24) return null;
    const sig = fd.subarray(0, 8);
    const expectedSig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    if (!sig.equals(expectedSig)) return null;
    return { width: fd.readUInt32BE(16), height: fd.readUInt32BE(20) };
  } catch {
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// § A. top-level schema / status / sourceRefs
// ═══════════════════════════════════════════════════════════════════════════
check("A-01: render manifest schemaVersion === money_shorts_selected_image_render_manifest_v1",
  renderManifest.schemaVersion === "money_shorts_selected_image_render_manifest_v1", renderManifest.schemaVersion);
check("A-02: render manifest status === data_only_render_plan_visual_only",
  renderManifest.status === "data_only_render_plan_visual_only", renderManifest.status);
check("A-03: sourceRefs.selectedImageSet.path 참조",
  renderManifest.sourceRefs?.selectedImageSet?.path === "scripts/fixtures/premium-editorial-scene-selected-image-set.v1.json");
check("A-04: sourceRefs.selectedImageSet.schemaVersion 일치",
  renderManifest.sourceRefs?.selectedImageSet?.schemaVersion === selectedSet.schemaVersion);

// ═══════════════════════════════════════════════════════════════════════════
// § B. executionBoundaries: render=false(계획만), mux/upload=false
// ═══════════════════════════════════════════════════════════════════════════
const eb = renderManifest.executionBoundaries || {};
check("B-01: executionBoundaries.imageGenerationExecuted === false", eb.imageGenerationExecuted === false);
check("B-02: executionBoundaries.imageRegenerationExecuted === false", eb.imageRegenerationExecuted === false);
check("B-03: executionBoundaries.networkExecuted === false", eb.networkExecuted === false);
check("B-04: executionBoundaries.renderExecuted === false (manifest는 계획만)", eb.renderExecuted === false);
check("B-05: executionBoundaries.audioMuxExecuted === false", eb.audioMuxExecuted === false);
check("B-06: executionBoundaries.uploadExecuted === false", eb.uploadExecuted === false);

// ═══════════════════════════════════════════════════════════════════════════
// § C. outputSpec: 1080x1920 / fps 30 / h264 / mp4 / silent
// ═══════════════════════════════════════════════════════════════════════════
const spec = renderManifest.outputSpec || {};
check("C-01: outputSpec.codec === h264", spec.codec === "h264");
check("C-02: outputSpec.container === mp4", spec.container === "mp4");
check("C-03: outputSpec.fps === 30", spec.fps === 30);
check("C-04: outputSpec.dimensions.widthPx === 1080", spec.dimensions?.widthPx === 1080);
check("C-05: outputSpec.dimensions.heightPx === 1920", spec.dimensions?.heightPx === 1920);
check("C-06: outputSpec.audioMode === silent_visual_only", spec.audioMode === "silent_visual_only");

// ═══════════════════════════════════════════════════════════════════════════
// § D. imageInputs: 정확히 6개, order 1~6, assetPath === selected image set imagePath
// ═══════════════════════════════════════════════════════════════════════════
const inputs = renderManifest.imageInputs || [];
check("D-01: imageInputs is array", Array.isArray(inputs));
check("D-02: imageInputs count === 6", inputs.length === 6, String(inputs.length));
const inputOrders = inputs.map((i) => i.sceneIndex).slice().sort((a, b) => a - b);
check("D-03: imageInputs sceneIndex === [1,2,3,4,5,6]", JSON.stringify(inputOrders) === JSON.stringify([1, 2, 3, 4, 5, 6]), JSON.stringify(inputOrders));

const selectedByOrder = new Map((selectedSet.selectedScenes || []).map((s) => [s.sceneOrder, s]));
for (const inp of inputs) {
  const sel = selectedByOrder.get(inp.sceneIndex);
  check(`D-04: scene ${inp.sceneIndex} has matching selected image set entry`, !!sel);
  if (!sel) continue;
  check(`D-05: scene ${inp.sceneIndex} sceneId matches selected image set`, inp.sceneId === sel.sceneId);
  check(`D-06: scene ${inp.sceneIndex} sceneRole matches selected image set`, inp.sceneRole === sel.sceneRole);
  check(`D-07: scene ${inp.sceneIndex} assetPath === selected image set imagePath (exact)`, inp.assetPath === sel.imagePath);
  check(`D-08: scene ${inp.sceneIndex} sourceRun matches selected image set`, inp.sourceRun === sel.sourceRun);

  const absAssetPath = join(REPO_ROOT, inp.assetPath || "");
  const existsLocal = existsSync(absAssetPath);
  check(`D-09: scene ${inp.sceneIndex} assetPath file exists locally`, existsLocal, inp.assetPath);
  if (existsLocal) {
    const dims = readPngDimensions(absAssetPath);
    check(`D-10: scene ${inp.sceneIndex} is a valid PNG (readable IHDR)`, !!dims);
    if (dims) {
      const ratio = dims.width / dims.height;
      const ratioClose = Math.abs(ratio - 9 / 16) < 0.05;
      check(`D-11: scene ${inp.sceneIndex} PNG ratio close to 9:16`, ratioClose, `${dims.width}x${dims.height} ratio=${ratio.toFixed(4)}`);
    }
  }
  check(`D-12: scene ${inp.sceneIndex} assetSourceType === selected_generated_image (not placeholder)`,
    inp.assetSourceType === "selected_generated_image");
}

// ═══════════════════════════════════════════════════════════════════════════
// § E. Scene 2: retry-01 assetPath 확인, first-run 원본 미사용 확인
// ═══════════════════════════════════════════════════════════════════════════
const scene2Input = inputs.find((i) => i.sceneIndex === 2);
check("E-01: scene 2 input 존재", !!scene2Input);
check("E-02: scene 2 assetPath ends with retry-01.png", /retry-01\.png$/.test(scene2Input?.assetPath || ""));
check("E-03: scene 2 assetPath is NOT the first-run original",
  scene2Input?.assetPath !== "output/money-shorts/scene-1-6-fullset-first-run-v1/scene-02-scene_2_signal.png");
check("E-04: scene 2 sourceRun === retry_01", scene2Input?.sourceRun === "retry_01");

// ═══════════════════════════════════════════════════════════════════════════
// § F. duration sum === 30, captionOverlays 6개, timing gap/overlap 없음
// ═══════════════════════════════════════════════════════════════════════════
const totalDuration = inputs.reduce((s, i) => s + (i.durationSec || 0), 0);
check("F-01: imageInputs duration sum === 30", totalDuration === 30, String(totalDuration));

const captions = renderManifest.captionOverlays || [];
check("F-02: captionOverlays count === 6", captions.length === 6, String(captions.length));
const sortedCaps = captions.slice().sort((a, b) => a.showAtSec - b.showAtSec);
let timingOk = sortedCaps.length > 0 && sortedCaps[0].showAtSec === 0;
for (let i = 1; i < sortedCaps.length; i++) {
  if (sortedCaps[i].showAtSec !== sortedCaps[i - 1].hideAtSec) timingOk = false;
}
check("F-03: captionOverlays timing contiguous (no gap/overlap)", timingOk);
check("F-04: last captionOverlay hideAtSec === 30",
  sortedCaps.length > 0 && sortedCaps[sortedCaps.length - 1].hideAtSec === 30);
for (const cap of captions) {
  check(`F-05: caption scene ${cap.sceneIndex} has no exact digit/percent/date pattern`,
    !/\d{1,3}(\.\d+)?%|\d{4}-\d{2}-\d{2}|202\d년|\d+\.\d+%/.test(cap.captionText || ""));
}

// ═══════════════════════════════════════════════════════════════════════════
// § G. renderer: NO placeholder color image generation
// ═══════════════════════════════════════════════════════════════════════════
check("G-01: renderer does NOT generate lavfi color= placeholder images",
  !/color=c=/.test(rendererText));
check("G-02: renderer does NOT contain 'Generating placeholder scene images' step",
  !/[Gg]enerating placeholder/.test(rendererText));
check("G-03: renderer resolves assetPath via manifest.imageInputs (input.assetPath)",
  /input\.assetPath/.test(rendererText));
check("G-04: renderer validates assetPath existsSync before use (ABORT if missing)",
  /existsSync\(absAssetPath\)/.test(rendererText) && /ABORT: assetPath not found/.test(rendererText));
check("G-05: renderer concat list uses sceneImagePaths (actual resolved assets)",
  /sceneImagePaths\[i\]/.test(rendererText) && /Concat list written \(actual assetPath images\)/.test(rendererText));
check("G-06: renderer summary marks usedActualSelectedImages: true", /usedActualSelectedImages:\s*true/.test(rendererText));
check("G-07: renderer summary marks placeholderImagesUsed: false", /placeholderImagesUsed:\s*false/.test(rendererText));

// ═══════════════════════════════════════════════════════════════════════════
// § H. renderer: silent-only, no audio mux, no upload
// ═══════════════════════════════════════════════════════════════════════════
check("H-01: renderer uses -an (silent, no audio track)", /"-an"/.test(rendererText));
check("H-02: renderer does NOT reference audio codec (aac/mp3) for mux", !/-c:a/.test(rendererText));
check("H-03: renderer summary marks audioMuxPerformed: false", /audioMuxPerformed:\s*false/.test(rendererText));
check("H-04: renderer summary marks uploadPerformed: false", /uploadPerformed:\s*false/.test(rendererText));

// ═══════════════════════════════════════════════════════════════════════════
// § I. security: no shell:true / exec( / fetch( / forbidden imports, repo-safety guards
// ═══════════════════════════════════════════════════════════════════════════
function stripComments(src) {
  return src.split("\n").filter((l) => !/^\s*(\/\/|\*)/.test(l)).join("\n");
}
for (const [label, text] of [["renderer", rendererText], ["builder", builderText]]) {
  const stripped = stripComments(text);
  check(`I: ${label} has no shell:true`, !/shell\s*:\s*true/.test(stripped));
  check(`I: ${label} has no exec( call`, !stripped.includes("exec("));
  check(`I: ${label} does NOT call fetch(`, !/\bfetch\s*\(/.test(text));
}
check("I: renderer uses spawnSync (args array pattern)", /spawnSync\(/.test(rendererText));
check("I: renderer out-dir repo-safety guard present", /outDirAbs\.startsWith\(REPO_ROOT/.test(rendererText));
check("I: renderer .money-shorts-local guard present", rendererText.includes(".money-shorts-local") && rendererText.includes("forbidden"));

const forbiddenImports = ["openai", "playwright", "node-fetch", "child_process\"", "child_process'"];
for (const imp of ["openai", "playwright", "node-fetch"]) {
  const pat = new RegExp(`(import|require)[^\\n]*['"\`]${imp}['"\`]`);
  check(`I: renderer does NOT import/require '${imp}'`, !pat.test(rendererText));
  check(`I: builder does NOT import/require '${imp}'`, !pat.test(builderText));
  check(`I: guard does NOT import/require '${imp}'`, !pat.test(selfText));
}
check("I: renderer imports child_process ONLY for spawnSync (no other child_process API)",
  /import\s*\{\s*spawnSync\s*\}\s*from\s*["']node:child_process["']/.test(rendererText));
check("I: renderer does NOT import node:http/https",
  !/import[^\n]*['"`]node:https?['"`]/.test(rendererText));
check("I: builder does NOT import node:http/https",
  !/import[^\n]*['"`]node:https?['"`]/.test(builderText));

// ═══════════════════════════════════════════════════════════════════════════
// § J. builder: selected-image-set driven (하드코딩 order/role 매핑 없음)
// ═══════════════════════════════════════════════════════════════════════════
check("J-01: builder reads selectedScenes via selectedScenes.map", /selectedScenes\.map\(/.test(builderText));
check("J-02: builder validates selectedScenes count === 6 (FATAL on mismatch)",
  /selectedScenes\.length !== 6/.test(builderText) && /process\.exit\(2\)/.test(builderText));
check("J-03: builder validates assetPath existsSync before writing manifest (FATAL if missing)",
  /existsSync\(join\(REPO_ROOT, i\.assetPath\)\)/.test(builderText) && /FATAL:.*assetPath.*로컬에 존재하지 않음/.test(builderText));

// ═══════════════════════════════════════════════════════════════════════════
// § K. manifestAudit
// ═══════════════════════════════════════════════════════════════════════════
const audit = renderManifest.manifestAudit || {};
check("K-01: manifestAudit.sceneCount === 6", audit.sceneCount === 6);
check("K-02: manifestAudit.totalDurationSec === 30", audit.totalDurationSec === 30);
check("K-03: manifestAudit.scene2UsesRetry === true", audit.scene2UsesRetry === true);
check("K-04: manifestAudit.allAssetPathsExistLocally === true", audit.allAssetPathsExistLocally === true);
check("K-05: manifestAudit.captionTimingContiguous === true", audit.captionTimingContiguous === true);

// ═══════════════════════════════════════════════════════════════════════════
// Result Summary
// ═══════════════════════════════════════════════════════════════════════════
const pass = results.filter((r) => r.pass);
const fail = results.filter((r) => !r.pass);

console.log(`\n══════════════════════════════════════════════════════════`);
console.log(`  SELECTED IMAGE RENDER MANIFEST + RENDERER — STRUCTURE/SAFETY GUARD`);
console.log(`  (NOT an image/video quality judge; no ffmpeg execution)`);
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
  console.log(`GUARD OK: render manifest + renderer structure/safety/no-placeholder intact (${pass.length}/${results.length}).`);
  process.exit(0);
}
