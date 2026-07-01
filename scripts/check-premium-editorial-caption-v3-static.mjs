#!/usr/bin/env node
// ──────────────────────────────────────────────────────────────────────────
// check-premium-editorial-caption-v3-static.mjs
//
// CAPTION v3 RENDER MANIFEST + TTS v3 SCRIPT + RENDERER/BUILDER v3 EXTENSIONS
// — STRUCTURE/SAFETY GUARD (no execution, no ffmpeg, no API)
//
// v3 correction 검증:
//   - TTS v3 script: v2 과압축 폐기 검증 — 각 scene ttsText가 v2보다 길고, S1/S2/S3/S6은 v1 이상,
//     S4/S5는 v1보다 살짝 짧아도 v2보다는 충분히 길다. factual source fact 유지.
//   - caption v3 render manifest: selected image 6장 그대로(assetPath v1 일치), caption v3 한 줄,
//     captionFontSize 104, outline 6, shadow 3, marginV 130. sourceFact 핵심값(2.5%)만 허용, 날짜/출처 금지.
//   - renderer: captionFontSize/Outline/Shadow/MarginV를 manifest에서 읽음, one-line ABORT 존재, default 보존.
//   - builder: VOICE_PRESETS에 confident_v3 존재, default/confident_v2 보존.
//   - selected image set 미변경.
// ──────────────────────────────────────────────────────────────────────────

import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..");

const SELECTED_SET_PATH = join(REPO_ROOT, "scripts", "fixtures", "premium-editorial-scene-selected-image-set.v1.json");
const V1_MANIFEST_PATH = join(REPO_ROOT, "scripts", "fixtures", "premium-editorial-selected-image-render-manifest.v1.json");
const V3_MANIFEST_PATH = join(REPO_ROOT, "scripts", "fixtures", "premium-editorial-selected-image-render-manifest.caption-v3.json");
const TTS_V1_PATH = join(REPO_ROOT, "scripts", "fixtures", "provider-candidate-tts-script.yohan-koo.ecos-live-draft.json");
const TTS_V2_PATH = join(REPO_ROOT, "scripts", "fixtures", "provider-candidate-tts-script.yohan-koo.ecos-live-draft.voice-v2.json");
const TTS_V3_PATH = join(REPO_ROOT, "scripts", "fixtures", "provider-candidate-tts-script.yohan-koo.ecos-live-draft.voice-v3.json");
const RENDERER_PATH = join(__dirname, "render-premium-editorial-selected-image-visual-only-v1.mjs");
const TTS_BUILDER_PATH = join(__dirname, "build-elevenlabs-scene-paced-tts-from-script.mjs");
const V3_BUILDER_PATH = join(__dirname, "build-premium-editorial-selected-image-render-manifest-caption-v3.mjs");
const SELF_PATH = join(__dirname, "check-premium-editorial-caption-v3-static.mjs");

const results = [];
function check(name, condition, detail = "") {
  results.push({ name, pass: !!condition, detail });
}

let selectedSet, v1Manifest, v3Manifest, ttsV1, ttsV2, ttsV3, rendererText, ttsBuilderText, v3BuilderText, selfText;
try {
  selectedSet = JSON.parse(readFileSync(SELECTED_SET_PATH, "utf8"));
  v1Manifest = JSON.parse(readFileSync(V1_MANIFEST_PATH, "utf8"));
  v3Manifest = JSON.parse(readFileSync(V3_MANIFEST_PATH, "utf8"));
  ttsV1 = JSON.parse(readFileSync(TTS_V1_PATH, "utf8"));
  ttsV2 = JSON.parse(readFileSync(TTS_V2_PATH, "utf8"));
  ttsV3 = JSON.parse(readFileSync(TTS_V3_PATH, "utf8"));
  rendererText = readFileSync(RENDERER_PATH, "utf8");
  ttsBuilderText = readFileSync(TTS_BUILDER_PATH, "utf8");
  v3BuilderText = readFileSync(V3_BUILDER_PATH, "utf8");
  selfText = readFileSync(SELF_PATH, "utf8");
} catch (e) {
  console.error(`FATAL: cannot read/parse inputs: ${e.message}`);
  process.exit(2);
}

const byNum = (scenes) => new Map((scenes || []).map((s) => [s.sceneNumber, s]));
const v1Scenes = byNum(ttsV1.scenes);
const v2Scenes = byNum(ttsV2.scenes);
const v3Scenes = byNum(ttsV3.scenes);
const ALLOWED_CORE_VALUE = (ttsV3.sourceFact?.currentValueText || "").trim();

// ═══════════════════════════════════════════════════════════════════════════
// § A. TTS v3 script: v2 과압축 폐기, v1 리듬 복구
// ═══════════════════════════════════════════════════════════════════════════
check("A-01: TTS v3 schemaVersion === money_shorts_tts_script_v1", ttsV3.schemaVersion === "money_shorts_tts_script_v1");
check("A-02: TTS v3 ttsMode === elevenlabs_scene_paced", ttsV3.ttsMode === "elevenlabs_scene_paced");
check("A-03: TTS v3 voiceProfile === yohan_koo", ttsV3.voiceProfile === "yohan_koo");
check("A-04: TTS v3 voicePreset === confident_v3", ttsV3.voicePreset === "confident_v3");
check("A-05: TTS v3 targetDurationSec === 30", ttsV3.targetDurationSec === 30);
check("A-06: TTS v3 has 6 scenes", (ttsV3.scenes || []).length === 6);
check("A-07: TTS v3 duration sum === 30", (ttsV3.scenes || []).reduce((s, sc) => s + sc.durationSec, 0) === 30);
check("A-08: TTS v3 supersedes v2 scriptId", ttsV3.supersedes?.scriptId === ttsV2.scriptId);

// 핵심: v3 > v2 (모든 scene, 과압축 폐기)
for (let n = 1; n <= 6; n++) {
  const l2 = (v2Scenes.get(n)?.ttsText || "").trim().length;
  const l3 = (v3Scenes.get(n)?.ttsText || "").trim().length;
  check(`A-09: scene ${n} ttsText v3(${l3}) > v2(${l2}) — 과압축 폐기`, l3 > l2, `v2=${l2}, v3=${l3}`);
}
// S1/S2/S3/S6: v3 >= v1 (v1 리듬 복구/유지)
for (const n of [1, 2, 3, 6]) {
  const l1 = (v1Scenes.get(n)?.ttsText || "").trim().length;
  const l3 = (v3Scenes.get(n)?.ttsText || "").trim().length;
  check(`A-10: scene ${n} ttsText v3(${l3}) >= v1(${l1}) — v1 리듬 유지/복구`, l3 >= l1, `v1=${l1}, v3=${l3}`);
}
// S4/S5: v1보다 살짝 짧아도 되지만 v1의 90% 이상은 유지 (과도 축소 방지)
for (const n of [4, 5]) {
  const l1 = (v1Scenes.get(n)?.ttsText || "").trim().length;
  const l3 = (v3Scenes.get(n)?.ttsText || "").trim().length;
  check(`A-11: scene ${n} ttsText v3(${l3}) >= 0.9 × v1(${l1}) — 소폭 축소만 허용`, l3 >= Math.floor(l1 * 0.9), `v1=${l1}, v3=${l3}`);
}
// Scene 5는 특히 v2보다 확실히 길어야 (4초 채우기)
{
  const l2 = (v2Scenes.get(5)?.ttsText || "").trim().length;
  const l3 = (v3Scenes.get(5)?.ttsText || "").trim().length;
  check(`A-12: scene 5 ttsText v3(${l3}) >= v2(${l2}) + 8 — 4초 채우기 위해 v2보다 충분히 김`, l3 >= l2 + 8, `v2=${l2}, v3=${l3}`);
}
// v2처럼 과압축(17~25자 수준)이 재발하지 않음: 모든 scene ttsText >= 30자
for (let n = 1; n <= 6; n++) {
  const l3 = (v3Scenes.get(n)?.ttsText || "").trim().length;
  check(`A-13: scene ${n} ttsText v3(${l3}) >= 30 chars — 과압축 재발 방지`, l3 >= 30, `${l3} chars`);
}

// factual meaning 유지
check("A-14: TTS v3 sourceFact currentValueText matches v1 (2.5%)", ttsV3.sourceFact?.currentValueText === ttsV1.sourceFact?.currentValueText);
check("A-15: TTS v3 sourceFact latestPeriod matches v1 (202605)", ttsV3.sourceFact?.latestPeriod === ttsV1.sourceFact?.latestPeriod);
check("A-16: TTS v3 sourceFact verifiedPublishedDate matches v1", ttsV3.sourceFact?.verifiedPublishedDate === ttsV1.sourceFact?.verifiedPublishedDate);
check("A-17: TTS v3 isPublishable === false (draft only)", ttsV3.sourceFact?.isPublishable === false);

// ═══════════════════════════════════════════════════════════════════════════
// § B. caption v3 render manifest
// ═══════════════════════════════════════════════════════════════════════════
check("B-01: v3 manifest schemaVersion === money_shorts_selected_image_render_manifest_v1", v3Manifest.schemaVersion === "money_shorts_selected_image_render_manifest_v1");
check("B-02: v3 manifest supersedes v2 manifest", v3Manifest.supersedes?.manifest === "scripts/fixtures/premium-editorial-selected-image-render-manifest.caption-v2.json");
check("B-03: v3 manifest outputSpec.captionFontSize === 104", v3Manifest.outputSpec?.captionFontSize === 104);
check("B-04: v3 manifest outputSpec.captionOutline === 6", v3Manifest.outputSpec?.captionOutline === 6);
check("B-05: v3 manifest outputSpec.captionShadow === 3", v3Manifest.outputSpec?.captionShadow === 3);
check("B-06: v3 manifest outputSpec.captionMarginV === 130", v3Manifest.outputSpec?.captionMarginV === 130);
check("B-07: v3 manifest dimensions 1080x1920", v3Manifest.outputSpec?.dimensions?.widthPx === 1080 && v3Manifest.outputSpec?.dimensions?.heightPx === 1920);
check("B-08: v3 manifest fps 30 / h264 / mp4", v3Manifest.outputSpec?.fps === 30 && v3Manifest.outputSpec?.codec === "h264" && v3Manifest.outputSpec?.container === "mp4");
check("B-09: v3 fontSize 104 > v2 fontSize 84 (Owner 체감 상향)", v3Manifest.outputSpec?.captionFontSize > 84);

const v3Inputs = v3Manifest.imageInputs || [];
const v1Inputs = v1Manifest.imageInputs || [];
check("B-10: v3 imageInputs count === 6", v3Inputs.length === 6);
// selected image 유지: assetPath가 v1 manifest와 정확히 일치
const v1PathByOrder = new Map(v1Inputs.map((i) => [i.sceneIndex, i.assetPath]));
const selByOrder = new Map((selectedSet.selectedScenes || []).map((s) => [s.sceneOrder, s.imagePath]));
for (const inp of v3Inputs) {
  check(`B-11: scene ${inp.sceneIndex} assetPath matches v1 manifest (image unchanged)`, inp.assetPath === v1PathByOrder.get(inp.sceneIndex));
  check(`B-12: scene ${inp.sceneIndex} assetPath matches selected image set (image unchanged)`, inp.assetPath === selByOrder.get(inp.sceneIndex));
  check(`B-13: scene ${inp.sceneIndex} assetPath exists locally`, existsSync(join(REPO_ROOT, inp.assetPath || "")));
}
const v3s2 = v3Inputs.find((i) => i.sceneIndex === 2);
check("B-14: scene 2 assetPath is retry-01 (unchanged from selected set)", /retry-01\.png$/.test(v3s2?.assetPath || ""));

// caption v3: 6개, 한 줄, timing contiguous, 2.5%만 허용 (날짜/출처 금지)
const caps = v3Manifest.captionOverlays || [];
const FORBIDDEN = /\d{4}-\d{2}-\d{2}|202\d년|\d+%p/;
check("B-15: captionOverlays count === 6", caps.length === 6);
for (const c of caps) {
  check(`B-16: caption scene ${c.sceneIndex} is single-line (no newline/\\N)`, !/[\r\n]/.test(c.captionText) && !/\\N|\\n/.test(c.captionText));
  check(`B-17: caption scene ${c.sceneIndex} has NO date/source/%p`, !FORBIDDEN.test(c.captionText), c.captionText);
  check(`B-18: caption scene ${c.sceneIndex} char count <= 14 (one-line safe at fontSize 104)`, (c.captionText || "").length <= 14, `${(c.captionText || "").length} chars`);
}
const sortedCaps = caps.slice().sort((a, b) => a.showAtSec - b.showAtSec);
let timingOk = sortedCaps.length === 6 && sortedCaps[0].showAtSec === 0;
for (let i = 1; i < sortedCaps.length; i++) {
  if (sortedCaps[i].showAtSec !== sortedCaps[i - 1].hideAtSec) timingOk = false;
}
check("B-19: caption timing contiguous (no gap/overlap)", timingOk);
check("B-20: last caption hideAtSec === 30", sortedCaps.length === 6 && sortedCaps[5].hideAtSec === 30);

// 2.5% 허용 정책: sourceFact 핵심값과 일치하는 caption만 수치 허용
const capsWithNumber = caps.filter((c) => /\d/.test(c.captionText));
check("B-21: caption with numbers only contains allowed core value (2.5%)",
  capsWithNumber.every((c) => c.captionText.split(ALLOWED_CORE_VALUE).join("").search(/\d/) === -1),
  capsWithNumber.map((c) => c.captionText).join(" | "));
check("B-22: exactly scene 2 caption contains allowed core value 2.5%",
  caps.filter((c) => c.captionText.includes(ALLOWED_CORE_VALUE)).map((c) => c.sceneIndex).join(",") === "2");
check("B-23: overlayPolicySummary.allowedCoreValueInCaption === 2.5%", v3Manifest.overlayPolicySummary?.allowedCoreValueInCaption === ALLOWED_CORE_VALUE);

// caption v3가 TTS v3 script의 captionText와 일치
const ttsCapByNum = new Map((ttsV3.scenes || []).map((s) => [s.sceneNumber, (s.captionText || "").trim()]));
for (const c of caps) {
  check(`B-24: caption scene ${c.sceneIndex} matches TTS v3 script captionText`, c.captionText === ttsCapByNum.get(c.sceneIndex));
}
check("B-25: v3 imageInputs duration sum === 30", v3Inputs.reduce((s, i) => s + (i.durationSec || 0), 0) === 30);

// ═══════════════════════════════════════════════════════════════════════════
// § C. renderer: captionFontSize/Outline/Shadow/MarginV manifest 읽기 + one-line ABORT
// ═══════════════════════════════════════════════════════════════════════════
check("C-01: renderer reads outputSpec.captionFontSize", /outputSpec\.captionFontSize/.test(rendererText));
check("C-02: renderer reads outputSpec.captionOutline", /outputSpec\.captionOutline/.test(rendererText));
check("C-03: renderer reads outputSpec.captionShadow", /outputSpec\.captionShadow/.test(rendererText));
check("C-04: renderer reads outputSpec.captionMarginV", /outputSpec\.captionMarginV/.test(rendererText));
check("C-05: renderer ASS Style uses captionFontSize variable", /Style: Caption,Arial,\$\{captionFontSize\}/.test(rendererText));
check("C-06: renderer ASS Style uses captionOutline/Shadow/MarginV variables",
  /\$\{captionOutline\}/.test(rendererText) && /\$\{captionShadow\}/.test(rendererText) && /\$\{captionMarginV\}/.test(rendererText));
check("C-07: renderer default fontSize fallback 72 preserved", /captionFontSize[^\n]*:\s*72/.test(rendererText));
check("C-08: renderer default outline 4 / shadow 2 / marginV 120 preserved",
  /captionOutline[^\n]*:\s*4/.test(rendererText) && /captionShadow[^\n]*:\s*2/.test(rendererText) && /captionMarginV[^\n]*:\s*120/.test(rendererText));
check("C-09: renderer one-line enforcement ABORT present", /forced line break/.test(rendererText) && /process\.exit\(1\)/.test(rendererText));
check("C-10: renderer still does NOT generate color= placeholder", !/color=c=/.test(rendererText));
check("C-11: renderer still uses input.assetPath (actual images)", /input\.assetPath/.test(rendererText));

// ═══════════════════════════════════════════════════════════════════════════
// § D. TTS builder: confident_v3 preset + default/confident_v2 보존
// ═══════════════════════════════════════════════════════════════════════════
check("D-01: builder has VOICE_PRESETS registry", /VOICE_PRESETS/.test(ttsBuilderText));
check("D-02: builder default preset stability 0.52 (unchanged)", /default:\s*\{\s*stability:\s*0\.52/.test(ttsBuilderText));
check("D-03: builder confident_v2 preset preserved (stability 0.8)", /confident_v2:\s*\{\s*stability:\s*0\.8/.test(ttsBuilderText));
check("D-04: builder confident_v3 preset present", /confident_v3:\s*\{/.test(ttsBuilderText));
check("D-05: builder confident_v3 stability 0.68 (권장 0.65~0.72)", /confident_v3:\s*\{\s*stability:\s*0\.68/.test(ttsBuilderText));
check("D-06: builder confident_v3 style 0.22 (권장 0.18~0.25, v2보다 높음)", /confident_v3:[^}]*style:\s*0\.22/.test(ttsBuilderText));
check("D-07: builder confident_v3 similarity_boost 0.9 (권장 0.88~0.92)", /confident_v3:[^}]*similarity_boost:\s*0\.9/.test(ttsBuilderText));
check("D-08: builder confident_v3 use_speaker_boost true", /confident_v3:[^}]*use_speaker_boost:\s*true/.test(ttsBuilderText));
check("D-09: builder supports --voice-preset CLI", /--voice-preset/.test(ttsBuilderText));
check("D-10: builder records voicePresetId in summary", /voicePresetId/.test(ttsBuilderText));
check("D-11: builder records voiceSettingsSanitized in summary", /voiceSettingsSanitized/.test(ttsBuilderText));
check("D-12: builder still uses maskVoiceId (secret safety preserved)", /maskVoiceId/.test(ttsBuilderText));
check("D-13: builder does NOT console.log/error bare apiKey (secret safety)",
  !/console\.(log|error)\(\s*apiKey\s*\)/.test(ttsBuilderText) &&
  !/console\.(log|error)\(\s*`[^`]*\$\{apiKey\}/.test(ttsBuilderText));

// ═══════════════════════════════════════════════════════════════════════════
// § E. v3 builder: selected image 미변경 driven, 2.5% 허용 정책 명시, no execution
// ═══════════════════════════════════════════════════════════════════════════
check("E-01: v3 builder reads selectedScenes via selectedScenes.map", /selectedScenes\.map\(/.test(v3BuilderText));
check("E-02: v3 builder has ALLOWED_CORE_VALUE from sourceFact.currentValueText", /ALLOWED_CORE_VALUE/.test(v3BuilderText) && /currentValueText/.test(v3BuilderText));
check("E-03: v3 builder has one-line FATAL guard for captions", /강제 줄바꿈이 있음/.test(v3BuilderText) && /process\.exit\(2\)/.test(v3BuilderText));
check("E-04: v3 builder sets captionFontSize 104", /CAPTION_FONT_SIZE\s*=\s*104/.test(v3BuilderText));
check("E-05: v3 builder sets outline 6 / shadow 3 / marginV 130", /CAPTION_OUTLINE\s*=\s*6/.test(v3BuilderText) && /CAPTION_SHADOW\s*=\s*3/.test(v3BuilderText) && /CAPTION_MARGIN_V\s*=\s*130/.test(v3BuilderText));
check("E-06: v3 builder forbids date/source but allows core value (policy documented)", /FORBIDDEN_PATTERN/.test(v3BuilderText) && /captionWithoutCoreValue/.test(v3BuilderText));
check("E-07: v3 builder does NOT call fetch(", !/\bfetch\s*\(/.test(v3BuilderText));
check("E-08: v3 builder does NOT import openai/playwright/child_process/node-fetch",
  !/(import|require)[^\n]*['"`](openai|playwright|child_process|node-fetch)['"`]/.test(v3BuilderText));

// ═══════════════════════════════════════════════════════════════════════════
// § F. selected image set 미변경
// ═══════════════════════════════════════════════════════════════════════════
check("F-01: selected image set schemaVersion unchanged", selectedSet.schemaVersion === "money_shorts_scene_selected_image_set_v1");
check("F-02: v3 manifest references selected image set path", v3Manifest.sourceRefs?.selectedImageSet?.path === "scripts/fixtures/premium-editorial-scene-selected-image-set.v1.json");
check("F-03: v3 manifest references TTS v3 script path", v3Manifest.sourceRefs?.ttsScriptV3?.path === "scripts/fixtures/provider-candidate-tts-script.yohan-koo.ecos-live-draft.voice-v3.json");

// ═══════════════════════════════════════════════════════════════════════════
// § G. executionBoundaries 전부 false
// ═══════════════════════════════════════════════════════════════════════════
const eb = v3Manifest.executionBoundaries || {};
check("G-01: v3 executionBoundaries.imageGenerationExecuted === false", eb.imageGenerationExecuted === false);
check("G-02: v3 executionBoundaries.renderExecuted === false", eb.renderExecuted === false);
check("G-03: v3 executionBoundaries.audioMuxExecuted === false", eb.audioMuxExecuted === false);
check("G-04: v3 executionBoundaries.uploadExecuted === false", eb.uploadExecuted === false);

// ── self-guard ──────────────────────────────────────────────────────────────
check("H-01: guard does NOT import openai/playwright/node-fetch",
  !/(import|require)[^\n]*['"`](openai|playwright|node-fetch)['"`]/.test(selfText));

// ── result ────────────────────────────────────────────────────────────────
const pass = results.filter((r) => r.pass);
const fail = results.filter((r) => !r.pass);
console.log(`\n══════════════════════════════════════════════════════════`);
console.log(`  CAPTION v3 + TTS v3 + RENDERER/BUILDER v3 — STRUCTURE GUARD`);
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
  console.log(`GUARD OK: caption v3 + TTS v3 + renderer/builder v3 extensions intact (${pass.length}/${results.length}).`);
  process.exit(0);
}
