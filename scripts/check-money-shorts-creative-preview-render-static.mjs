#!/usr/bin/env node
// ──────────────────────────────────────────────────────────────────────────
// check-money-shorts-creative-preview-render-static.mjs
//
// CREATIVE PREVIEW RENDER v1 — STRUCTURE/SAFETY GUARD (data-only, no execution)
//
// 검증 대상:
//   - Phase 1~4 source fixtures + selected image set + platform profiles
//   - money-shorts-creative-preview-render-manifest.v1.json  (preview manifest)
//   - build-money-shorts-creative-preview-render-manifest-v1.mjs (manifest builder)
//   - render-money-shorts-creative-preview-v1.mjs             (renderer)
//   - (if present) preview_quality_report.json under C:\tmp   (render report)
//   - self                                                    (this guard)
//
// 핵심: preview가 개발용(운영 gate 아님)이고, 실제 selected image를 쓰며(placeholder 금지),
//       after가 before보다 event density/motion variety/static duration에서 개선되고,
//       renderer가 ffmpeg local만 쓰고 외부 API/upload/image-gen을 안 하는지.
//
// Node built-in only. 외부 네트워크/렌더/업로드 실행 없음. 순수 정적 검사.
// ──────────────────────────────────────────────────────────────────────────

import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const F = (n) => join(__dirname, "fixtures", n);
const CONTRACT_PATH = F("money-shorts-creative-quality-contract.v1.json");
const SCRIPT_PATH = F("money-shorts-retention-script-compiler.output.v1.json");
const PLANNER_PATH = F("money-shorts-scene-event-planner.output.v1.json");
const SCORER_PATH = F("money-shorts-quality-scorer.output.v1.json");
const IMAGESET_PATH = F("premium-editorial-scene-selected-image-set.v1.json");
const PROFILE_PATH = F("premium-editorial-platform-render-profiles.v1.json");
const MANIFEST_PATH = F("money-shorts-creative-preview-render-manifest.v1.json");
const BUILDER_PATH = join(__dirname, "build-money-shorts-creative-preview-render-manifest-v1.mjs");
const RENDERER_PATH = join(__dirname, "render-money-shorts-creative-preview-v1.mjs");
const SELF_PATH = join(__dirname, "check-money-shorts-creative-preview-render-static.mjs");

const results = [];
function check(name, condition, detail = "") { results.push({ name, pass: !!condition, detail }); }
function isStr(v) { return typeof v === "string" && v.length > 0; }
function isNum(v) { return typeof v === "number" && Number.isFinite(v); }
function isArr(v) { return Array.isArray(v); }

const CTX_TRANSFER_TOKEN = "CONTEXT" + "_TRANSFER_" + "CODEX";
const PIQ_TOKEN = "piq" + "_diag_" + "out";

let contract, script, planner, scorer, imageSet, profiles, manifest, manifestRaw, builderText, rendererText, selfText;
try {
  contract = JSON.parse(readFileSync(CONTRACT_PATH, "utf8"));
  script = JSON.parse(readFileSync(SCRIPT_PATH, "utf8"));
  planner = JSON.parse(readFileSync(PLANNER_PATH, "utf8"));
  scorer = JSON.parse(readFileSync(SCORER_PATH, "utf8"));
  imageSet = JSON.parse(readFileSync(IMAGESET_PATH, "utf8"));
  profiles = JSON.parse(readFileSync(PROFILE_PATH, "utf8"));
  manifestRaw = readFileSync(MANIFEST_PATH, "utf8");
  manifest = JSON.parse(manifestRaw);
  builderText = readFileSync(BUILDER_PATH, "utf8");
  rendererText = readFileSync(RENDERER_PATH, "utf8");
  selfText = readFileSync(SELF_PATH, "utf8");
} catch (e) {
  console.error(`FATAL: cannot read/parse inputs: ${e.message}`);
  process.exit(2);
}

const ytProfile = profiles.platformProfiles?.youtube_shorts ?? {};
const rendererCode = rendererText.split(/\r?\n/).filter((ln) => !/^\s*\/\//.test(ln)).join("\n");
const builderCode = builderText.split(/\r?\n/).filter((ln) => !/^\s*\/\//.test(ln)).join("\n");

// ── § A. source fixtures presence + schema ───────────────────────────────────
check("A-01: contract schemaVersion correct", contract.schemaVersion === "money_shorts_creative_quality_contract_v1");
check("A-02: script compiler schemaVersion correct", script.schemaVersion === "money_shorts_retention_script_compiler_output_v1");
check("A-03: scene planner schemaVersion correct", planner.schemaVersion === "money_shorts_scene_event_planner_output_v1");
check("A-04: quality scorer schemaVersion correct", scorer.schemaVersion === "money_shorts_quality_scorer_output_v1");
check("A-05: selected image set schemaVersion present", isStr(imageSet.schemaVersion));
check("A-06: platform profiles has youtube_shorts profile", !!ytProfile.profileId);
check("A-07: youtube profile id is safe_frame_v1", ytProfile.profileId === "youtube_shorts_safe_frame_v1");
check("A-08: youtube profile recommendedCaptionMarginV present", isNum(ytProfile.recommendedCaptionMarginV));
check("A-09: quality scorer has a render-decision topic", scorer.topics.some((t) => t.qualityReport.final_decision === "render"));
check("A-10: selected image set has selectedScenes array", isArr(imageSet.selectedScenes) && imageSet.selectedScenes.length >= 3);

// ── § B. preview manifest schema + dev-only flags ────────────────────────────
check("B-01: manifest schemaVersion === money_shorts_creative_preview_render_manifest_v1", manifest.schemaVersion === "money_shorts_creative_preview_render_manifest_v1");
check("B-02: manifest status === data_only_preview_manifest", manifest.status === "data_only_preview_manifest");
check("B-03: previewIsDevelopmentOnly === true", manifest.previewIsDevelopmentOnly === true);
check("B-04: operationalRequiredReview === false", manifest.operationalRequiredReview === false);
check("B-05: previewDurationSec === 12", manifest.previewDurationSec === 12);
check("B-06: canvas 1080x1920", manifest.canvas?.widthPx === 1080 && manifest.canvas?.heightPx === 1920);
check("B-07: targetPlatformProfile === youtube_shorts_safe_frame_v1", manifest.targetPlatformProfile === "youtube_shorts_safe_frame_v1");
check("B-08: manifest has sourceRefs", typeof manifest.sourceRefs === "object" && manifest.sourceRefs !== null);
check("B-09: manifest selectedTopicId present", isStr(manifest.selectedTopicId));
check("B-10: manifest selectedCandidateId present", isStr(manifest.selectedCandidateId));
check("B-11: selectedTopicId is a render-decision topic in scorer", scorer.topics.some((t) => t.topicId === manifest.selectedTopicId && t.qualityReport.final_decision === "render"));
check("B-12: manifest has actualImageInputs", isArr(manifest.actualImageInputs) && manifest.actualImageInputs.length >= 3);
check("B-13: manifest has beforeTimeline", isArr(manifest.beforeTimeline) && manifest.beforeTimeline.length >= 1);
check("B-14: manifest has afterEventTimeline", isArr(manifest.afterEventTimeline) && manifest.afterEventTimeline.length >= 1);
check("B-15: manifest has captionPlan", typeof manifest.captionPlan === "object" && manifest.captionPlan !== null);
check("B-16: manifest has motionPlan", typeof manifest.motionPlan === "object");
check("B-17: manifest has soundPlan", typeof manifest.soundPlan === "object");
check("B-18: manifest has fallbackPolicy", typeof manifest.fallbackPolicy === "object");
check("B-19: manifest has outputPaths", typeof manifest.outputPaths === "object");
check("B-20: manifest.boundary.previewIsDevelopmentOnly === true", manifest.boundary?.previewIsDevelopmentOnly === true);

// ── § C. output paths under C:\tmp ───────────────────────────────────────────
const op = manifest.outputPaths ?? {};
check("C-01: outDir under C:\\tmp", /^C:\\+tmp\\+/i.test(op.outDir ?? ""));
check("C-02: beforeMp4 under C:\\tmp", /^C:\\+tmp\\+/i.test(op.beforeMp4 ?? ""));
check("C-03: afterMp4 under C:\\tmp", /^C:\\+tmp\\+/i.test(op.afterMp4 ?? ""));
check("C-04: qualityReport under C:\\tmp", /^C:\\+tmp\\+/i.test(op.qualityReport ?? ""));
check("C-05: beforeMp4 is preview_before.mp4", /preview_before\.mp4$/.test(op.beforeMp4 ?? ""));
check("C-06: afterMp4 is preview_after.mp4", /preview_after\.mp4$/.test(op.afterMp4 ?? ""));
check("C-07: qualityReport is preview_quality_report.json", /preview_quality_report\.json$/.test(op.qualityReport ?? ""));
check("C-08: outDir not inside repo output/ dir", !/instagram-auto[\\/]output/i.test(op.outDir ?? ""));

// ── § D. actual selected image usage (no placeholder) ────────────────────────
const imgPathsInSet = new Set(imageSet.selectedScenes.map((s) => s.imagePath));
let dUsesSetPaths = true, dRepoRel = true;
for (const ai of manifest.actualImageInputs) {
  if (!imgPathsInSet.has(ai.imagePath)) dUsesSetPaths = false;
  if (isAbsoluteWin(ai.imagePath)) dRepoRel = false;
}
function isAbsoluteWin(p) { return /^[A-Za-z]:\\/.test(p) || p.startsWith("/"); }
check("D-01: actualImageInputs use selected image set imagePaths", dUsesSetPaths);
check("D-02: actualImageInputs paths are repo-relative (not absolute)", dRepoRel);
check("D-03: actualImageInputs reference output/money-shorts png", manifest.actualImageInputs.every((a) => /\.png$/i.test(a.imagePath)));
check("D-04: beforeTimeline segments carry real imagePath", manifest.beforeTimeline.every((s) => isStr(s.imagePath) && imgPathsInSet.has(s.imagePath)));
check("D-05: afterEventTimeline events carry real imagePath", manifest.afterEventTimeline.every((e) => isStr(e.imagePath) && imgPathsInSet.has(e.imagePath)));

// ── § E. before vs after improvement (from manifest timelines) ───────────────
const beforeCount = manifest.beforeTimeline.length;
const afterCount = manifest.afterEventTimeline.length;
const beforeMaxStatic = Math.max(...manifest.beforeTimeline.map((s) => s.duration));
const afterMaxStatic = Math.max(...manifest.afterEventTimeline.map((e) => e.duration));
const afterFirst5s = manifest.afterEventTimeline.filter((e) => e.time_start < 5).length;
const beforeMotionVariety = new Set(manifest.beforeTimeline.map((s) => s.motion_template)).size;
const afterMotionVariety = new Set(manifest.afterEventTimeline.map((e) => e.motion_template)).size;
check("E-01: after visual event count > before", afterCount > beforeCount);
check("E-02: after max static duration < before", afterMaxStatic < beforeMaxStatic);
check("E-03: after max static duration <= 2.2", afterMaxStatic <= 2.2);
check("E-04: after first 5s events >= 4", afterFirst5s >= 4);
check("E-05: after motion variety > before", afterMotionVariety > beforeMotionVariety);
check("E-06: after events are within 12s window", manifest.afterEventTimeline.every((e) => e.time_start < 12));
check("E-07: before timeline is intentionally static (holds > 2.2s)", beforeMaxStatic > 2.2);
check("E-08: after event count is a 12s subset (< full 24)", afterCount < 24 && afterCount >= 4);

// ── § F. caption / safe-frame ────────────────────────────────────────────────
check("F-01: captionPlan.captionSafeReference === youtube_shorts_safe_frame_v1", manifest.captionPlan?.captionSafeReference === "youtube_shorts_safe_frame_v1");
check("F-02: captionPlan.oneLinePolicy === true", manifest.captionPlan?.oneLinePolicy === true);
check("F-03: captionPlan recommendedCaptionMarginV matches profile", manifest.captionPlan?.recommendedCaptionMarginV === ytProfile.recommendedCaptionMarginV);
check("F-04: after events carry youtube safe-frame ref", manifest.afterEventTimeline.every((e) => e.safe_frame_ref === "youtube_shorts_safe_frame_v1"));
check("F-05: captionPlan autoTruncateIfTwoLines present", manifest.captionPlan?.autoTruncateIfTwoLines === true);

// ── § G. motion / fallback ───────────────────────────────────────────────────
check("G-01: motionPlan lists after motion templates", isArr(manifest.motionPlan?.motionTemplatesUsedAfter) && manifest.motionPlan.motionTemplatesUsedAfter.length >= 3);
check("G-02: before motion templates are 'none' (static baseline)", manifest.motionPlan?.motionTemplatesUsedBefore?.every((m) => m === "none"));
check("G-03: fallbackPolicy records fallback (not silently dropped)", manifest.fallbackPolicy?.fallbackRecordedNotSilentlyDropped === true);
check("G-04: fallbackTemplatesApplied is an array", isArr(manifest.fallbackPolicy?.fallbackTemplatesApplied));
check("G-05: manifest rendererSupportedV1 list present", isArr(manifest.motionPlan?.rendererSupportedV1) && manifest.motionPlan.rendererSupportedV1.length >= 5);
// all after motion templates are renderer-supported v1 (fallback resolved)
const supV1 = new Set(manifest.motionPlan?.rendererSupportedV1 ?? []);
check("G-06: all after motion templates are in rendererSupportedV1 (fallback resolved)", manifest.afterEventTimeline.every((e) => supV1.has(e.motion_template)));

// ── § H. builder consumes sources + is data-only ─────────────────────────────
check("H-01: builder references quality scorer output", /money-shorts-quality-scorer\.output\.v1\.json/.test(builderText));
check("H-02: builder references scene planner output", /money-shorts-scene-event-planner\.output\.v1\.json/.test(builderText));
check("H-03: builder references selected image set", /premium-editorial-scene-selected-image-set\.v1\.json/.test(builderText));
check("H-04: builder references platform render profiles", /premium-editorial-platform-render-profiles\.v1\.json/.test(builderText));
check("H-05: builder selects render-decision topic", /final_decision === ["']render["']/.test(builderText));
check("H-06: builder preserves repo-relative imagePath", /imagePath/.test(builderText));
check("H-07: builder does not use fetch/http/https", !/\bfetch\s*\(/.test(builderCode) && !/from\s+["']node:https?["']/.test(builderCode));
check("H-08: builder does not read process.env", !/process\.env\./.test(builderCode));
check("H-09: builder does not spawn/exec (data-only)", !new RegExp("spawn" + "Sync?\\(|" + "exec" + "(Sync)?\\(").test(builderCode));
check("H-10: builder is deterministic (no Math.random)", !/Math\.random\s*\(/.test(builderText));

// ── § I. renderer: ffmpeg local, no placeholder, no external ─────────────────
check("I-01: renderer does NOT use color=c= placeholder", !/color=c=/.test(rendererCode));
check("I-02: renderer reads selected image set (via manifest actualImageInputs/imagePath)", /actualImageInputs/.test(rendererText) && /imagePath/.test(rendererText));
check("I-03: renderer checks asset existence", /existsSync\(/.test(rendererText));
check("I-04: renderer aborts if a selected image asset missing", /selected image asset missing/.test(rendererText));
check("I-05: renderer uses spawnSync with shell:false", /spawnSync\(/.test(rendererText) && /shell:\s*false/.test(rendererText));
check("I-06: renderer invokes ffmpeg", /spawnSync\(["']ffmpeg["']/.test(rendererText));
check("I-07: renderer invokes ffprobe", /spawnSync\(\s*\n?\s*["']ffprobe["']|spawnSync\(["']ffprobe["']/.test(rendererText));
check("I-08: renderer uses args array (not shell string) for ffmpeg", /spawnSync\(["']ffmpeg["'],\s*args|runFfmpeg\(\s*\[/.test(rendererText));
check("I-09: renderer uses zoompan/crop motion (not static-only)", /zoompan/.test(rendererText));
check("I-10: renderer does NOT import openai/googleapis/playwright/elevenlabs", !/(import|require)[^\n]*['"`](openai|googleapis|playwright|elevenlabs)['"`]/i.test(rendererCode));
check("I-11: renderer does NOT use fetch()", !/\bfetch\s*\(/.test(rendererCode));
check("I-12: renderer does NOT import node:http/https", !/from\s+["']node:https?["']|require\(["']https?["']\)/.test(rendererCode));
check("I-13: renderer does NOT read process.env", !/process\.env\./.test(rendererCode));
check("I-14: renderer does NOT read a .env file", !/(^|[^A-Za-z0-9_])\.env(\.[A-Za-z]+)?(["'`\s)]|$)/m.test(rendererCode));
check("I-15: renderer does NOT call openai/elevenlabs/ecos endpoints", !/api\.openai\.com|api\.elevenlabs\.io|ecos\.bok\.or\.kr/i.test(rendererCode));
check("I-16: renderer enforces out-dir under C:\\tmp", /must be under C:\\+tmp/.test(rendererText));
check("I-17: renderer guards out-dir outside repo root", /must be OUTSIDE repo root/.test(rendererText));
check("I-18: renderer does NOT do upload/publish/deploy", !/videos\.insert|media_publish|graph\.facebook\.com|vercel\s+deploy/i.test(rendererCode));
check("I-19: renderer does NOT generate images (no imagen/dalle/pollinations)", !/imagen|dall-?e|pollinations|stability\.ai/i.test(rendererCode));
// TTS generation = an actual synthesis call/endpoint, not the boundary field `noTtsGeneration`.
check("I-20: renderer does NOT generate TTS", !/text-to-speech|elevenlabs|\.speech\.|tts\.(synthesize|create|generate)/i.test(rendererCode));
check("I-21: renderer canvas 1080x1920 (W/H from manifest)", /manifest\.canvas\.widthPx/.test(rendererText) && /manifest\.canvas\.heightPx/.test(rendererText));
check("I-22: renderer applies caption marginV from profile", /MARGIN_V/.test(rendererText) && /recommendedCaptionMarginV/.test(rendererText));
check("I-23: renderer sets audio none (-an)", /["']-an["']/.test(rendererText));
check("I-24: renderer probes output (ffprobe width/height/codec/duration)", /ffprobe/.test(rendererText) && /codec_name/.test(rendererText));

// ── § J. render report (if produced) ─────────────────────────────────────────
let report = null;
if (op.qualityReport && existsSync(op.qualityReport)) {
  try { report = JSON.parse(readFileSync(op.qualityReport, "utf8")); } catch { report = null; }
}
if (report) {
  check("J-01: report schemaVersion === money_shorts_creative_preview_quality_report_v1", report.schemaVersion === "money_shorts_creative_preview_quality_report_v1");
  check("J-02: report previewMode === development_only", report.previewMode === "development_only");
  check("J-03: report operationalGate === false", report.operationalGate === false);
  check("J-04: report usedActualSelectedImages === true", report.usedActualSelectedImages === true);
  check("J-05: report placeholderImagesUsed === false", report.placeholderImagesUsed === false);
  check("J-06: report previewDurationSec === 12", report.previewDurationSec === 12);
  check("J-07: report has beforePreviewPath under C:\\tmp", /^C:\\+tmp\\+/i.test(report.beforePreviewPath ?? ""));
  check("J-08: report has afterPreviewPath under C:\\tmp", /^C:\\+tmp\\+/i.test(report.afterPreviewPath ?? ""));
  check("J-09: report visualEventCountAfter > before eventCount", report.visualEventCountAfter > report.beforeMetrics?.eventCount);
  check("J-10: report first5sEventCountAfter >= 4", report.first5sEventCountAfter >= 4);
  check("J-11: report maxStaticDurationAfter <= 2.2", report.maxStaticDurationAfter <= 2.2);
  check("J-12: report after maxStatic < before maxStatic", report.afterMetrics?.maxStaticDuration < report.beforeMetrics?.maxStaticDuration);
  check("J-13: report after motionVariety > before", report.afterMetrics?.motionVariety > report.beforeMetrics?.motionVariety);
  check("J-14: report captionsOneLine present", typeof report.captionsOneLine === "boolean");
  check("J-15: report youtubeSafeFrameApplied === true", report.youtubeSafeFrameApplied === true);
  check("J-16: report audioRendered === false", report.audioRendered === false);
  check("J-17: report sfxPlannedButAudioNotRendered === true", report.sfxPlannedButAudioNotRendered === true);
  check("J-18: report has sfxPlannedCount + sfxRenderedCount", isNum(report.sfxPlannedCount) && isNum(report.sfxRenderedCount));
  check("J-19: report sfxRenderedCount === 0 (silent preview)", report.sfxRenderedCount === 0);
  check("J-20: report after mp4 is 1080x1920", report.afterMetrics?.width === 1080 && report.afterMetrics?.height === 1920);
  check("J-21: report before mp4 is 1080x1920", report.beforeMetrics?.width === 1080 && report.beforeMetrics?.height === 1920);
  check("J-22: report after codec h264", report.afterMetrics?.codec === "h264");
  check("J-23: report after duration 12±0.5", Math.abs(report.afterMetrics?.durationSec - 12) <= 0.5);
  check("J-24: report before duration 12±0.5", Math.abs(report.beforeMetrics?.durationSec - 12) <= 0.5);
  check("J-25: report qualityImprovementVerdict indicates improvement", /improve/.test(report.qualityImprovementVerdict ?? ""));
  check("J-26: report motionTemplatesUsed listed", isArr(report.motionTemplatesUsed) && report.motionTemplatesUsed.length >= 3);
  check("J-27: report imageExistence all exist with size>0", isArr(report.imageExistence) && report.imageExistence.every((i) => i.exists && i.size > 0));
} else {
  check("J-00: render report not yet produced (renderer not run) — informational", true, "run renderer to populate §J");
}

// ── § K. no credential / forbidden-file refs ─────────────────────────────────
for (const [label, raw] of [["manifest", manifestRaw], ["builder", builderText], ["renderer", rendererText]]) {
  check(`K-01:${label}: no access_token`, !/access_?token/i.test(raw));
  check(`K-02:${label}: no refresh_token`, !/refresh_?token/i.test(raw));
  check(`K-03:${label}: no client_secret/api_key`, !/client_?secret|api_?key/i.test(raw));
  check(`K-04:${label}: no OAuth code`, !/oauth[_-]?code/i.test(raw));
  check(`K-05:${label}: no EAA/IGA token-looking string`, !/\b(EAA|IGA)[A-Za-z0-9]{20,}/.test(raw));
  check(`K-06:${label}: no codex transfer doc ref`, !raw.includes(CTX_TRANSFER_TOKEN));
  check(`K-07:${label}: no diag output file ref`, !raw.includes(PIQ_TOKEN));
}
check("K-08: guard does not reference the codex transfer doc", !selfText.includes(CTX_TRANSFER_TOKEN));
check("K-09: guard does not reference the diag output file", !selfText.includes(PIQ_TOKEN));
const guardImports = (selfText.match(/^import\s+.*?from\s+["']([^"']+)["']/gm) || []).map((l) => (l.match(/from\s+["']([^"']+)["']/) || [])[1]);
const ALLOWED = new Set(["node:fs", "node:url", "node:path"]);
check("K-10: guard imports only node:fs/url/path", guardImports.length > 0 && guardImports.every((m) => ALLOWED.has(m)), `imports=${guardImports.join(",")}`);

// ── § L. existing final video / source not overwritten ───────────────────────
check("L-01: renderer does not write into repo output/ dir", !/writeFileSync\([^)]*instagram-auto[\\/]output/.test(rendererText) && !/output[\\/].*\.mp4["']/.test(rendererCode));
check("L-02: renderer writes only under out-dir (C:\\tmp)", /outAbs/.test(rendererText) && /join\(outAbs/.test(rendererText));
check("L-03: renderer does not modify source fixtures", !/writeFileSync\([^)]*fixtures[\\/]/.test(rendererCode));
check("L-04: builder writes only the preview manifest fixture", /OUTPUT_PATH/.test(builderText) && /money-shorts-creative-preview-render-manifest\.v1\.json/.test(builderText));
check("L-05: builder does not overwrite existing final video", !/premium-editorial-selected-image-visual-only-v1-tts-mux\.mp4/.test(builderCode));

// ── § M. per-after-event deep audit ──────────────────────────────────────────
manifest.afterEventTimeline.forEach((e, i) => {
  const tag = `ev${i + 1}`;
  check(`M-${tag}-01: has imagePath in image set`, imgPathsInSet.has(e.imagePath));
  check(`M-${tag}-02: motion in rendererSupportedV1`, supV1.has(e.motion_template));
  check(`M-${tag}-03: duration > 0 and <= 2.2`, e.duration > 0 && e.duration <= 2.2);
  check(`M-${tag}-04: time_start < 12`, e.time_start < 12);
  check(`M-${tag}-05: time_start < time_end`, e.time_start < e.time_end);
  check(`M-${tag}-06: safe_frame_ref correct`, e.safe_frame_ref === "youtube_shorts_safe_frame_v1");
});

// ── result ────────────────────────────────────────────────────────────────────
const pass = results.filter((r) => r.pass);
const fail = results.filter((r) => !r.pass);
console.log(`\n══════════════════════════════════════════════════════════`);
console.log(`  CREATIVE PREVIEW RENDER v1 — STRUCTURE/SAFETY GUARD`);
console.log(`══════════════════════════════════════════════════════════`);
for (const r of results) {
  console.log(`  ${r.pass ? "PASS" : "FAIL"}  ${r.name}${r.detail ? `  [${r.detail}]` : ""}`);
}
console.log(`\n──────────────────────────────────────────────────────────`);
console.log(`  TOTAL : ${results.length}  |  PASS : ${pass.length}  |  FAIL : ${fail.length}`);
console.log(`──────────────────────────────────────────────────────────\n`);
if (fail.length > 0) {
  console.error(`GUARD FAILED (${fail.length} failures):`);
  for (const r of fail) console.error(`  FAIL  ${r.name}${r.detail ? `  [${r.detail}]` : ""}`);
  process.exit(1);
} else {
  console.log(`GUARD OK: creative preview render structure/safety intact (${pass.length}/${results.length}).`);
  process.exit(0);
}
