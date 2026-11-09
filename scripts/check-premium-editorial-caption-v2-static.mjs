#!/usr/bin/env node
// ──────────────────────────────────────────────────────────────────────────
// check-premium-editorial-caption-v2-static.mjs
//
// CAPTION v2 RENDER MANIFEST + TTS v2 SCRIPT + RENDERER/BUILDER v2 EXTENSIONS
// — STRUCTURE/SAFETY GUARD (no execution, no ffmpeg, no API)
//
// 검증:
//   - caption v2 render manifest: selected image 6장 그대로(assetPath v1 일치), caption v2 한 줄,
//     captionFontSize 84, exact 수치/날짜/출처 없음, timing contiguous
//   - TTS v2 script: 6 scene, 각 ttsText <= 7 chars/sec (over_target 없음, Scene 4/5 tail trim 위험 해소),
//     voicePreset=confident_v2, factual source fact 유지
//   - renderer: captionFontSize를 manifest에서 읽음(하드코딩 72 아님), one-line 강제 ABORT 존재
//   - builder: VOICE_PRESETS(default + confident_v2) 존재, default 값 보존, summary에 preset/sanitized settings
//   - selected image set 미변경(스키마/경로 참조 일치)
// ──────────────────────────────────────────────────────────────────────────

import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..");

const SELECTED_SET_PATH = join(REPO_ROOT, "scripts", "fixtures", "premium-editorial-scene-selected-image-set.v1.json");
const V1_MANIFEST_PATH = join(REPO_ROOT, "scripts", "fixtures", "premium-editorial-selected-image-render-manifest.v1.json");
const V2_MANIFEST_PATH = join(REPO_ROOT, "scripts", "fixtures", "premium-editorial-selected-image-render-manifest.caption-v2.json");
const TTS_V1_PATH = join(REPO_ROOT, "scripts", "fixtures", "provider-candidate-tts-script.yohan-koo.ecos-live-draft.json");
const TTS_V2_PATH = join(REPO_ROOT, "scripts", "fixtures", "provider-candidate-tts-script.yohan-koo.ecos-live-draft.voice-v2.json");
const RENDERER_PATH = join(__dirname, "render-premium-editorial-selected-image-visual-only-v1.mjs");
const TTS_BUILDER_PATH = join(__dirname, "build-elevenlabs-scene-paced-tts-from-script.mjs");
const V2_BUILDER_PATH = join(__dirname, "build-premium-editorial-selected-image-render-manifest-caption-v2.mjs");
const SELF_PATH = join(__dirname, "check-premium-editorial-caption-v2-static.mjs");

const results = [];
function check(name, condition, detail = "") {
  results.push({ name, pass: !!condition, detail });
}

let selectedSet, v1Manifest, v2Manifest, ttsV1, ttsV2, rendererText, ttsBuilderText, v2BuilderText, selfText;
try {
  selectedSet = JSON.parse(readFileSync(SELECTED_SET_PATH, "utf8"));
  v1Manifest = JSON.parse(readFileSync(V1_MANIFEST_PATH, "utf8"));
  v2Manifest = JSON.parse(readFileSync(V2_MANIFEST_PATH, "utf8"));
  ttsV1 = JSON.parse(readFileSync(TTS_V1_PATH, "utf8"));
  ttsV2 = JSON.parse(readFileSync(TTS_V2_PATH, "utf8"));
  rendererText = readFileSync(RENDERER_PATH, "utf8");
  ttsBuilderText = readFileSync(TTS_BUILDER_PATH, "utf8");
  v2BuilderText = readFileSync(V2_BUILDER_PATH, "utf8");
  selfText = readFileSync(SELF_PATH, "utf8");
} catch (e) {
  console.error(`FATAL: cannot read/parse inputs: ${e.message}`);
  process.exit(2);
}

const EXACT_VALUE_PATTERN = /\d{1,3}(\.\d+)?%|\d{4}-\d{2}-\d{2}|202\d년|\d+%p/;
const TTS_CHARS_PER_SEC_TARGET = 7;

// ═══════════════════════════════════════════════════════════════════════════
// § A. TTS v2 script: 6 scene, over_target 없음, Scene 4/5 tail trim 해소
// ═══════════════════════════════════════════════════════════════════════════
check("A-01: TTS v2 schemaVersion === money_shorts_tts_script_v1", ttsV2.schemaVersion === "money_shorts_tts_script_v1");
check("A-02: TTS v2 ttsMode === elevenlabs_scene_paced", ttsV2.ttsMode === "elevenlabs_scene_paced");
check("A-03: TTS v2 voiceProfile === yohan_koo", ttsV2.voiceProfile === "yohan_koo");
check("A-04: TTS v2 voicePreset === confident_v2", ttsV2.voicePreset === "confident_v2");
check("A-05: TTS v2 targetDurationSec === 30", ttsV2.targetDurationSec === 30);
const v2Scenes = (ttsV2.scenes || []).slice().sort((a, b) => a.sceneNumber - b.sceneNumber);
check("A-06: TTS v2 has 6 scenes", v2Scenes.length === 6);
check("A-07: TTS v2 scene numbers === [1..6]", JSON.stringify(v2Scenes.map((s) => s.sceneNumber)) === JSON.stringify([1, 2, 3, 4, 5, 6]));
check("A-08: TTS v2 duration sum === 30", v2Scenes.reduce((s, sc) => s + sc.durationSec, 0) === 30);

for (const sc of v2Scenes) {
  const len = (sc.ttsText || "").trim().length;
  const maxChars = Math.floor(sc.durationSec * TTS_CHARS_PER_SEC_TARGET);
  check(`A-09: scene ${sc.sceneNumber} ttsText <= ${maxChars} chars (7chars/s, no over_target)`, len > 0 && len <= maxChars, `${len} chars`);
}
// Scene 4/5 tail trim 위험 해소 (특히 강조)
const v2s4 = v2Scenes.find((s) => s.sceneNumber === 4);
const v2s5 = v2Scenes.find((s) => s.sceneNumber === 5);
check("A-10: scene 4 ttsText <= 42 chars (6s tail-trim risk removed)", (v2s4?.ttsText || "").trim().length <= 42);
check("A-11: scene 5 ttsText <= 28 chars (4s tail-trim risk removed)", (v2s5?.ttsText || "").trim().length <= 28);

// factual meaning 유지: source fact가 v1과 동일 핵심값
check("A-12: TTS v2 sourceFact currentValueText matches v1 (2.5%)",
  ttsV2.sourceFact?.currentValueText === ttsV1.sourceFact?.currentValueText);
check("A-13: TTS v2 sourceFact latestPeriod matches v1 (202605)",
  ttsV2.sourceFact?.latestPeriod === ttsV1.sourceFact?.latestPeriod);
check("A-14: TTS v2 sourceFact verifiedPublishedDate matches v1",
  ttsV2.sourceFact?.verifiedPublishedDate === ttsV1.sourceFact?.verifiedPublishedDate);
check("A-15: TTS v2 supersedes v1 scriptId", ttsV2.supersedes?.scriptId === ttsV1.scriptId);

// ═══════════════════════════════════════════════════════════════════════════
// § B. caption v2 render manifest: selected image 유지 + caption v2 한 줄 + fontSize 84
// ═══════════════════════════════════════════════════════════════════════════
check("B-01: v2 manifest schemaVersion === money_shorts_selected_image_render_manifest_v1",
  v2Manifest.schemaVersion === "money_shorts_selected_image_render_manifest_v1");
check("B-02: v2 manifest supersedes v1 manifest", v2Manifest.supersedes?.manifest === "scripts/fixtures/premium-editorial-selected-image-render-manifest.v1.json");
check("B-03: v2 manifest outputSpec.captionFontSize === 84", v2Manifest.outputSpec?.captionFontSize === 84);
check("B-04: v2 manifest outputSpec dimensions 1080x1920", v2Manifest.outputSpec?.dimensions?.widthPx === 1080 && v2Manifest.outputSpec?.dimensions?.heightPx === 1920);
check("B-05: v2 manifest fps 30 / h264 / mp4", v2Manifest.outputSpec?.fps === 30 && v2Manifest.outputSpec?.codec === "h264" && v2Manifest.outputSpec?.container === "mp4");

const v2Inputs = v2Manifest.imageInputs || [];
const v1Inputs = v1Manifest.imageInputs || [];
check("B-06: v2 imageInputs count === 6", v2Inputs.length === 6);
// selected image 유지: assetPath가 v1 manifest와 정확히 일치 (이미지 변경 없음)
const v1PathByOrder = new Map(v1Inputs.map((i) => [i.sceneIndex, i.assetPath]));
const selByOrder = new Map((selectedSet.selectedScenes || []).map((s) => [s.sceneOrder, s.imagePath]));
for (const inp of v2Inputs) {
  check(`B-07: scene ${inp.sceneIndex} assetPath matches v1 manifest (image unchanged)`, inp.assetPath === v1PathByOrder.get(inp.sceneIndex));
  check(`B-08: scene ${inp.sceneIndex} assetPath matches selected image set (image unchanged)`, inp.assetPath === selByOrder.get(inp.sceneIndex));
  const abs = join(REPO_ROOT, inp.assetPath || "");
  check(`B-09: scene ${inp.sceneIndex} assetPath exists locally`, existsSync(abs));
}
// Scene 2 retry 유지
const v2s2 = v2Inputs.find((i) => i.sceneIndex === 2);
check("B-10: scene 2 assetPath is retry-01 (unchanged from selected set)", /retry-01\.png$/.test(v2s2?.assetPath || ""));

// caption v2: 6개, 한 줄, exact-value 없음, timing contiguous
const caps = v2Manifest.captionOverlays || [];
check("B-11: captionOverlays count === 6", caps.length === 6);
for (const c of caps) {
  check(`B-12: caption scene ${c.sceneIndex} is single-line (no newline/\\N)`, !/[\r\n]/.test(c.captionText) && !/\\N|\\n/.test(c.captionText));
  check(`B-13: caption scene ${c.sceneIndex} has NO exact number/date/source`, !EXACT_VALUE_PATTERN.test(c.captionText), c.captionText);
  check(`B-14: caption scene ${c.sceneIndex} char count <= 20 (one-line safe at fontSize 84)`, (c.captionText || "").length <= 20, `${(c.captionText || "").length} chars`);
}
const sortedCaps = caps.slice().sort((a, b) => a.showAtSec - b.showAtSec);
let timingOk = sortedCaps.length === 6 && sortedCaps[0].showAtSec === 0;
for (let i = 1; i < sortedCaps.length; i++) {
  if (sortedCaps[i].showAtSec !== sortedCaps[i - 1].hideAtSec) timingOk = false;
}
check("B-15: caption timing contiguous (no gap/overlap)", timingOk);
check("B-16: last caption hideAtSec === 30", sortedCaps.length === 6 && sortedCaps[5].hideAtSec === 30);

// caption v2가 v1 caption과 실제로 달라짐 (v2 교체 확인)
const v1Caps = new Map((v1Manifest.captionOverlays || []).map((c) => [c.sceneIndex, c.captionText]));
check("B-17: at least one v2 caption differs from v1 (caption actually updated)",
  caps.some((c) => c.captionText !== v1Caps.get(c.sceneIndex)));

// caption v2가 TTS v2 script의 captionText와 일치 (소비 확인)
const ttsCapByNum = new Map(v2Scenes.map((s) => [s.sceneNumber, (s.captionText || "").trim()]));
for (const c of caps) {
  check(`B-18: caption scene ${c.sceneIndex} matches TTS v2 script captionText`, c.captionText === ttsCapByNum.get(c.sceneIndex));
}

// duration sum 30
check("B-19: v2 imageInputs duration sum === 30", v2Inputs.reduce((s, i) => s + (i.durationSec || 0), 0) === 30);

// ═══════════════════════════════════════════════════════════════════════════
// § C. renderer: captionFontSize를 manifest에서 읽음, one-line 강제 ABORT
// ═══════════════════════════════════════════════════════════════════════════
check("C-01: renderer reads outputSpec.captionFontSize (not hardcoded 72)", /outputSpec\.captionFontSize/.test(rendererText));
check("C-02: renderer ASS Style uses captionFontSize variable (template literal)", /Style: Caption,Arial,\$\{captionFontSize\}/.test(rendererText));
check("C-03: renderer has one-line enforcement ABORT (forced line break check)",
  /forced line break/.test(rendererText) && /process\.exit\(1\)/.test(rendererText));
check("C-04: renderer default captionFontSize fallback === 72 (backward compat)", /:\s*72\b/.test(rendererText) || /\?\?\s*72/.test(rendererText) || /captionFontSize[^\n]*72/.test(rendererText));
// renderer는 여전히 placeholder 생성 안 함 (v1 계약 유지)
check("C-05: renderer still does NOT generate color= placeholder", !/color=c=/.test(rendererText));
check("C-06: renderer still uses input.assetPath (actual images)", /input\.assetPath/.test(rendererText));

// ═══════════════════════════════════════════════════════════════════════════
// § D. TTS builder: VOICE_PRESETS(default + confident_v2), default 보존, summary 기록
// ═══════════════════════════════════════════════════════════════════════════
check("D-01: builder has VOICE_PRESETS registry", /VOICE_PRESETS/.test(ttsBuilderText));
check("D-02: builder has default preset with stability 0.52 (unchanged)", /default:\s*\{\s*stability:\s*0\.52/.test(ttsBuilderText));
check("D-03: builder has confident_v2 preset", /confident_v2:\s*\{/.test(ttsBuilderText));
check("D-04: builder confident_v2 has higher stability (0.8)", /confident_v2:\s*\{\s*stability:\s*0\.8/.test(ttsBuilderText));
check("D-05: builder supports --voice-preset CLI", /--voice-preset/.test(ttsBuilderText));
check("D-06: builder reads voicePreset from tts script as fallback", /ttsScript\.voicePreset/.test(ttsBuilderText));
check("D-07: builder records voicePresetId in summary", /voicePresetId/.test(ttsBuilderText));
check("D-08: builder records voiceSettingsSanitized in summary", /voiceSettingsSanitized/.test(ttsBuilderText));
check("D-09: builder unknown preset falls back to default (no crash)", /unknown voice preset/.test(ttsBuilderText) || /VOICE_PRESETS\[requestedPreset\]\s*\?/.test(ttsBuilderText));
// secret safety 유지: preset 추가가 masking을 깨지 않음
check("D-10: builder still uses maskVoiceId (secret safety preserved)", /maskVoiceId/.test(ttsBuilderText));
check("D-11: builder does NOT console.log/error bare apiKey (secret safety)",
  !/console\.(log|error)\(\s*apiKey\s*\)/.test(ttsBuilderText) &&
  !/console\.(log|error)\(\s*`[^`]*\$\{apiKey\}/.test(ttsBuilderText));

// ═══════════════════════════════════════════════════════════════════════════
// § E. v2 builder: selected image 미변경 driven, exact-value guard, no execution
// ═══════════════════════════════════════════════════════════════════════════
check("E-01: v2 builder reads selectedScenes via selectedScenes.map", /selectedScenes\.map\(/.test(v2BuilderText));
check("E-02: v2 builder has EXACT_VALUE_PATTERN guard", /EXACT_VALUE_PATTERN/.test(v2BuilderText));
check("E-03: v2 builder has one-line FATAL guard for captions", /강제 줄바꿈이 있음/.test(v2BuilderText) && /process\.exit\(2\)/.test(v2BuilderText));
check("E-04: v2 builder sets captionFontSize 84", /CAPTION_FONT_SIZE\s*=\s*84/.test(v2BuilderText));
check("E-05: v2 builder does NOT call fetch(", !/\bfetch\s*\(/.test(v2BuilderText));
check("E-06: v2 builder does NOT import openai/playwright/child_process/node-fetch",
  !/(import|require)[^\n]*['"`](openai|playwright|child_process|node-fetch)['"`]/.test(v2BuilderText));

// ═══════════════════════════════════════════════════════════════════════════
// § F. selected image set 미변경 (스키마/참조 확인)
// ═══════════════════════════════════════════════════════════════════════════
check("F-01: selected image set schemaVersion unchanged", selectedSet.schemaVersion === "money_shorts_scene_selected_image_set_v1");
check("F-02: v2 manifest references selected image set path", v2Manifest.sourceRefs?.selectedImageSet?.path === "scripts/fixtures/premium-editorial-scene-selected-image-set.v1.json");
check("F-03: v2 manifest references TTS v2 script path", v2Manifest.sourceRefs?.ttsScriptV2?.path === "scripts/fixtures/provider-candidate-tts-script.yohan-koo.ecos-live-draft.voice-v2.json");

// ═══════════════════════════════════════════════════════════════════════════
// § G. executionBoundaries 전부 false
// ═══════════════════════════════════════════════════════════════════════════
const eb = v2Manifest.executionBoundaries || {};
check("G-01: v2 executionBoundaries.imageGenerationExecuted === false", eb.imageGenerationExecuted === false);
check("G-02: v2 executionBoundaries.renderExecuted === false", eb.renderExecuted === false);
check("G-03: v2 executionBoundaries.audioMuxExecuted === false", eb.audioMuxExecuted === false);
check("G-04: v2 executionBoundaries.uploadExecuted === false", eb.uploadExecuted === false);

// ── self-guard ──────────────────────────────────────────────────────────────
check("H-01: guard does NOT import openai/playwright/node-fetch",
  !/(import|require)[^\n]*['"`](openai|playwright|node-fetch)['"`]/.test(selfText));

// ── result ────────────────────────────────────────────────────────────────
const pass = results.filter((r) => r.pass);
const fail = results.filter((r) => !r.pass);
console.log(`\n══════════════════════════════════════════════════════════`);
console.log(`  CAPTION v2 + TTS v2 + RENDERER/BUILDER v2 — STRUCTURE GUARD`);
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
  console.log(`GUARD OK: caption v2 + TTS v2 + renderer/builder v2 extensions intact (${pass.length}/${results.length}).`);
  process.exit(0);
}
