#!/usr/bin/env node
// ──────────────────────────────────────────────────────────────────────────
// check-money-shorts-creative-final-visual-render-static.mjs
//
// CREATIVE FINAL VISUAL RENDER v1 — STRUCTURE/SAFETY GUARD (data-only, no execution)
//
// 검증 대상:
//   - Phase 1~6 source fixtures + selected image set + platform profiles + creative job
//   - money-shorts-creative-final-visual-render-manifest.v1.json  (manifest)
//   - build-money-shorts-creative-final-visual-render-manifest-v1.mjs (builder)
//   - render-money-shorts-creative-final-visual-v1.mjs             (renderer)
//   - (if present) creative-final-visual-render-report.json under C:\tmp (report)
//   - self
//
// 핵심: FULL 30s(24+ events, preview subset 아님) visual-only render가 실제 selected
//   image로 되고, hard fail 0 + render decision, safe-frame/caption/motion 정합,
//   renderer가 ffmpeg-local만 쓰고 uploadReady=false(TTS/SFX/mux 필요)인지.
//
// Node built-in only. 외부 네트워크/렌더 실행 없음. 순수 정적 검사.
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
const CREATIVE_JOB_PATH = F("money-shorts-automation-job.creative-layer-base-rate-202605.v1.json");
const IMAGESET_PATH = F("premium-editorial-scene-selected-image-set.v1.json");
const PROFILE_PATH = F("premium-editorial-platform-render-profiles.v1.json");
const MANIFEST_PATH = F("money-shorts-creative-final-visual-render-manifest.v1.json");
const BUILDER_PATH = join(__dirname, "build-money-shorts-creative-final-visual-render-manifest-v1.mjs");
const RENDERER_PATH = join(__dirname, "render-money-shorts-creative-final-visual-v1.mjs");
const SELF_PATH = join(__dirname, "check-money-shorts-creative-final-visual-render-static.mjs");

const results = [];
function check(name, condition, detail = "") { results.push({ name, pass: !!condition, detail }); }
function isStr(v) { return typeof v === "string" && v.length > 0; }
function isNum(v) { return typeof v === "number" && Number.isFinite(v); }
function isArr(v) { return Array.isArray(v); }

const CTX_TRANSFER_TOKEN = "CONTEXT" + "_TRANSFER_" + "CODEX";
const PIQ_TOKEN = "piq" + "_diag_" + "out";

let contract, script, planner, scorer, creativeJob, imageSet, profiles, manifest, manifestRaw, builderText, rendererText, selfText;
try {
  contract = JSON.parse(readFileSync(CONTRACT_PATH, "utf8"));
  script = JSON.parse(readFileSync(SCRIPT_PATH, "utf8"));
  planner = JSON.parse(readFileSync(PLANNER_PATH, "utf8"));
  scorer = JSON.parse(readFileSync(SCORER_PATH, "utf8"));
  creativeJob = JSON.parse(readFileSync(CREATIVE_JOB_PATH, "utf8"));
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
const imgPathsInSet = new Set(imageSet.selectedScenes.map((s) => s.imagePath));

// ── § A. Phase 1~6 source schemaVersion ──────────────────────────────────────
check("A-01: contract schemaVersion correct", contract.schemaVersion === "money_shorts_creative_quality_contract_v1");
check("A-02: script compiler schemaVersion correct", script.schemaVersion === "money_shorts_retention_script_compiler_output_v1");
check("A-03: scene planner schemaVersion correct", planner.schemaVersion === "money_shorts_scene_event_planner_output_v1");
check("A-04: quality scorer schemaVersion correct", scorer.schemaVersion === "money_shorts_quality_scorer_output_v1");
check("A-05: creative job schemaVersion correct", creativeJob.schemaVersion === "money_shorts_automation_job_v1");
check("A-06: creative job has creativeLayer block", typeof creativeJob.creativeLayer === "object" && creativeJob.creativeLayer !== null);
check("A-07: selected image set schemaVersion present", isStr(imageSet.schemaVersion));
check("A-08: youtube profile safe_frame_v1", ytProfile.profileId === "youtube_shorts_safe_frame_v1");
check("A-09: youtube profile recommendedCaptionMarginV present", isNum(ytProfile.recommendedCaptionMarginV));
check("A-10: contract totalDurationSec === 30", contract.retentionScriptContract?.totalDurationSec === 30);

// ── § B. manifest schema + visual-only flags ─────────────────────────────────
check("B-01: manifest schemaVersion === money_shorts_creative_final_visual_render_manifest_v1", manifest.schemaVersion === "money_shorts_creative_final_visual_render_manifest_v1");
check("B-02: manifest status === data_only_final_visual_render_manifest", manifest.status === "data_only_final_visual_render_manifest");
check("B-03: manifest visualOnly === true", manifest.visualOnly === true);
check("B-04: manifest isFinalUploadReadyVideo === false", manifest.isFinalUploadReadyVideo === false);
check("B-05: manifest fullThirtySecondRender === true", manifest.fullThirtySecondRender === true);
check("B-06: manifest previewIsDevelopmentOnly === false (this is not a preview)", manifest.previewIsDevelopmentOnly === false);
check("B-07: manifest fullDurationSec === 30", manifest.fullDurationSec === 30);
check("B-08: manifest canvas 1080x1920", manifest.canvas?.widthPx === 1080 && manifest.canvas?.heightPx === 1920);
check("B-09: manifest fps === 30", manifest.fps === 30);
check("B-10: manifest targetPlatformProfile === youtube_shorts_safe_frame_v1", manifest.targetPlatformProfile === "youtube_shorts_safe_frame_v1");
check("B-11: manifest has fullEventTimeline", isArr(manifest.fullEventTimeline));
check("B-12: manifest has actualImageInputs (6)", isArr(manifest.actualImageInputs) && manifest.actualImageInputs.length === 6);
check("B-13: manifest has captionPlan", typeof manifest.captionPlan === "object");
check("B-14: manifest has audioPolicy", typeof manifest.audioPolicy === "object");
check("B-15: manifest has outputPaths", typeof manifest.outputPaths === "object");
check("B-16: manifest.boundary.visualOnly === true", manifest.boundary?.visualOnly === true);

// ── § C. selected candidate consistency (scorer + creative job) ──────────────
const scorerTopic = scorer.topics.find((t) => t.topicId === manifest.selectedTopicId) ?? scorer.topics[0];
const scorerSelectedId = scorerTopic?.selectedCandidate?.candidateId;
check("C-01: manifest selectedCandidateId matches quality scorer selected candidate", manifest.selectedCandidateId === scorerSelectedId);
check("C-02: manifest selectedCandidateId matches creative job selected candidate", manifest.selectedCandidateId === creativeJob.creativeLayer?.creativeSelectedCandidateId);
check("C-03: manifest selectedTopicId matches creative job selected topic", manifest.selectedTopicId === creativeJob.creativeLayer?.creativeSelectedTopicId);
check("C-04: quality scorer decision is render or render_best_candidate", ["render", "render_best_candidate"].includes(scorerTopic?.qualityReport?.final_decision));
check("C-05: manifest qualityScorerDecision matches scorer", manifest.qualityScorerDecision === scorerTopic?.qualityReport?.final_decision);
check("C-06: quality scorer hard_fail_reasons is empty", (scorerTopic?.qualityReport?.hard_fail_reasons?.length ?? 1) === 0);
check("C-07: manifest hardFailReasonCount === 0", manifest.hardFailReasonCount === 0);

// ── § D. FULL 30s event plan (NOT a 12s preview subset) ──────────────────────
const evs = manifest.fullEventTimeline;
check("D-01: full event count >= 24", evs.length >= 24);
check("D-02: manifest audit isFullNotPreviewSubset true", manifest.eventTimelineAudit?.isFullNotPreviewSubset === true);
const maxStatic = Math.max(...evs.map((e) => e.duration));
const first5s = evs.filter((e) => e.time_start < 5).length;
check("D-03: first 5s events >= 4", first5s >= 4);
check("D-04: max static duration <= 2.2", maxStatic <= 2.2);
// contiguous non-overlapping 0->30
const sorted = evs.slice().sort((a, b) => a.time_start - b.time_start);
let contig = sorted.length > 0 && sorted[0].time_start === 0;
for (let i = 1; i < sorted.length; i++) {
  if (Math.round(sorted[i].time_start * 100) / 100 !== Math.round(sorted[i - 1].time_end * 100) / 100) contig = false;
}
check("D-05: timeline contiguous non-overlapping", contig);
check("D-06: timeline ends at 30s", Math.max(...evs.map((e) => e.time_end)) === 30);
check("D-07: timeline starts at 0s", Math.min(...evs.map((e) => e.time_start)) === 0);
check("D-08: manifest audit coversFullDuration true", manifest.eventTimelineAudit?.coversFullDuration === true);
check("D-09: every event duration > 0", evs.every((e) => e.duration > 0));
check("D-10: every event time_start < time_end", evs.every((e) => e.time_start < e.time_end));
// no same motion 3-in-a-row
let threeInRow = false;
for (let i = 2; i < evs.length; i++) {
  if (evs[i].motion_template === evs[i - 1].motion_template && evs[i].motion_template === evs[i - 2].motion_template) threeInRow = true;
}
check("D-11: no same motion_template 3-in-a-row", !threeInRow);
// twist / action windows
check("D-12: twist/reframe event in 20..27s", evs.some((e) => e.script_part === "twist_reframe" && e.time_start >= 20 && e.time_start < 27));
check("D-13: action/save event in 27..30s", evs.some((e) => e.script_part === "action_save_reason" && e.time_start >= 27 && e.time_start < 30));

// ── § E. actual images (no placeholder) ──────────────────────────────────────
check("E-01: actualImageInputs use selected image set imagePaths", manifest.actualImageInputs.every((a) => imgPathsInSet.has(a.imagePath)));
check("E-02: actualImageInputs paths are repo-relative png", manifest.actualImageInputs.every((a) => /\.png$/i.test(a.imagePath) && !/^[A-Za-z]:\\/.test(a.imagePath)));
check("E-03: every event imagePath exists in selected image set", evs.every((e) => imgPathsInSet.has(e.imagePath)));
check("E-04: events reference image_01..image_06", evs.every((e) => /^image_0[1-6]$/.test(e.source_image)));

// ── § F. renderer template registry (supported or explicit fallback) ─────────
const supV1 = new Set(manifest.motionPlan?.rendererSupportedV1 ?? []);
check("F-01: rendererSupportedV1 list present", isArr(manifest.motionPlan?.rendererSupportedV1) && manifest.motionPlan.rendererSupportedV1.length >= 5);
check("F-02: all event motion templates are renderer-supported (fallback resolved)", evs.every((e) => supV1.has(e.motion_template)));
check("F-03: fallbackPolicy records fallback (not silently dropped)", manifest.fallbackPolicy?.fallbackRecordedNotSilentlyDropped === true);
check("F-04: fallbackPolicy silentFallbackForbidden === true", manifest.fallbackPolicy?.silentFallbackForbidden === true);
check("F-05: fallbackTemplatesApplied is an array", isArr(manifest.fallbackPolicy?.fallbackTemplatesApplied));
// contract registry supported set consistency
const contractSupported = new Set((contract.rendererTemplateRegistry?.motion ?? []).filter((m) => m.renderer_support).map((m) => m.id));
check("F-06: rendererSupportedV1 is subset of contract renderer_support=true motions", [...supV1].every((m) => contractSupported.has(m)));

// ── § G. safe-frame + caption one-line ───────────────────────────────────────
check("G-01: captionPlan.captionSafeReference === youtube_shorts_safe_frame_v1", manifest.captionPlan?.captionSafeReference === "youtube_shorts_safe_frame_v1");
check("G-02: captionPlan.recommendedCaptionMarginV matches profile", manifest.captionPlan?.recommendedCaptionMarginV === ytProfile.recommendedCaptionMarginV);
check("G-03: captionPlan.oneLinePolicy === true", manifest.captionPlan?.oneLinePolicy === true);
check("G-04: every event carries youtube safe-frame ref", evs.every((e) => e.safe_frame_ref === "youtube_shorts_safe_frame_v1"));
check("G-05: caption values are single-line (no newline)", evs.every((e) => !/\n/.test(e.caption || "")));
// caption one-line enforcement (the review-fix core): manifest render captions must be
// within the one-line max AND must NOT be ellipsis-truncated.
const CAP_MAX = manifest.captionPlan?.oneLineMaxChars ?? 16;
const capChars = (t) => (t || "").replace(/\s/g, "").length;
check("G-06: captionPlan.oneLineMaxChars is defined", isNum(CAP_MAX) && CAP_MAX > 0);
check("G-07: captionPlan.ellipsisTruncationForbidden === true", manifest.captionPlan?.ellipsisTruncationForbidden === true);
check("G-08: captionPlan.allRenderCaptionsOneLine === true", manifest.captionPlan?.allRenderCaptionsOneLine === true);
check("G-09: EVERY render caption is within one-line max chars", evs.every((e) => capChars(e.caption) <= CAP_MAX), `max=${CAP_MAX}`);
check("G-10: NO render caption is ellipsis-truncated", evs.every((e) => !/[…]|\.{3}$/.test(e.caption || "")));
check("G-11: captions were compressed deterministically (not raw upstream)", manifest.captionPlan?.compressionStrategy === "deterministic_short_render_caption_per_script_part");
check("G-12: every event exposes captionChars metadata", evs.every((e) => isNum(e.captionChars) && e.captionChars <= CAP_MAX));
check("G-13: over-limit render caption count is 0", evs.filter((e) => capChars(e.caption) > CAP_MAX).length === 0);

// ── § H. audio policy: uploadReady=false, TTS/SFX/mux required ────────────────
check("H-01: audioPolicy.audioRendered === false", manifest.audioPolicy?.audioRendered === false);
check("H-02: audioPolicy.ttsRendered === false", manifest.audioPolicy?.ttsRendered === false);
check("H-03: audioPolicy.sfxRendered === false", manifest.audioPolicy?.sfxRendered === false);
check("H-04: audioPolicy.requiresTtsSoundMuxBeforeUpload === true", manifest.audioPolicy?.requiresTtsSoundMuxBeforeUpload === true);
check("H-05: audioPolicy.uploadReady === false", manifest.audioPolicy?.uploadReady === false);
check("H-06: manifest does NOT claim upload ready anywhere", !/uploadReady["']?\s*:\s*true/.test(manifestRaw));

// ── § I. output paths under C:\tmp ───────────────────────────────────────────
const op = manifest.outputPaths ?? {};
check("I-01: outDir under C:\\tmp", /^C:\\+tmp\\+/i.test(op.outDir ?? ""));
check("I-02: finalVisualMp4 under C:\\tmp", /^C:\\+tmp\\+/i.test(op.finalVisualMp4 ?? ""));
check("I-03: renderReport under C:\\tmp", /^C:\\+tmp\\+/i.test(op.renderReport ?? ""));
check("I-04: finalVisualMp4 is an mp4 with safe-frame in name", /\.mp4$/.test(op.finalVisualMp4 ?? "") && /youtube-safe-frame/.test(op.finalVisualMp4 ?? ""));
check("I-05: outDir not inside repo output/ dir", !/instagram-auto[\\/]output/i.test(op.outDir ?? ""));
check("I-06: outDir is the creative-final-visual dir (not preview/accepted)", /creative-final-visual-render-v1/.test(op.outDir ?? ""));

// ── § J. builder consumes sources + is data-only ─────────────────────────────
check("J-01: builder references quality scorer output", /money-shorts-quality-scorer\.output\.v1\.json/.test(builderText));
check("J-02: builder references scene planner output", /money-shorts-scene-event-planner\.output\.v1\.json/.test(builderText));
check("J-03: builder references creative job manifest", /money-shorts-automation-job\.creative-layer/.test(builderText));
check("J-04: builder references selected image set", /premium-editorial-scene-selected-image-set\.v1\.json/.test(builderText));
check("J-05: builder aborts if hard_fail_reasons > 0", /hard_fail_reasons/.test(builderText) && /ABORT/.test(builderText));
check("J-06: builder cross-checks scorer vs job selected candidate", /jobSelectedId !== selectedCandidateId/.test(builderText));
check("J-07: builder uses FULL event timeline (not 12s subset)", /scenePlan\.scenes\.flatMap/.test(builderText) && !/time_start < 12|PREVIEW_SEC/.test(builderText));
check("J-08: builder is data-only (no spawn/exec)", !new RegExp("spawn" + "Sync?\\(|" + "exec" + "(Sync)?\\(").test(builderCode));
check("J-09: builder is deterministic (no Math.random)", !/Math\.random\s*\(/.test(builderText));
check("J-10: builder does not use fetch/http", !/\bfetch\s*\(/.test(builderCode) && !/from\s+["']node:https?["']/.test(builderCode));

// ── § K. renderer: ffmpeg local, no placeholder, full 30s, no external ───────
check("K-01: renderer does NOT use color=c= placeholder", !/color=c=/.test(rendererCode));
check("K-02: renderer reads actual image inputs", /actualImageInputs/.test(rendererText) && /imagePath/.test(rendererText));
check("K-03: renderer checks asset existence (existsSync/statSync)", /existsSync\(/.test(rendererText) && /statSync\(/.test(rendererText));
check("K-04: renderer aborts if a selected image asset missing", /selected image asset missing/.test(rendererText));
check("K-05: renderer aborts on unsupported motion (no silent fallback)", /unsupported motion/.test(rendererText));
check("K-06: renderer uses spawnSync with shell:false", /spawnSync\(/.test(rendererText) && /shell:\s*false/.test(rendererText));
check("K-07: renderer invokes ffmpeg", /spawnSync\(["']ffmpeg["']/.test(rendererText));
check("K-08: renderer invokes ffprobe", /spawnSync\(\s*["']ffprobe["']|["']ffprobe["'],/.test(rendererText));
check("K-09: renderer uses zoompan motion", /zoompan/.test(rendererText));
check("K-10: renderer renders full event timeline (fullEventTimeline)", /manifest\.fullEventTimeline\.forEach/.test(rendererText));
check("K-11: renderer sets audio none (-an)", /["']-an["']/.test(rendererText));
check("K-12: renderer enforces out-dir under C:\\tmp", /must be under C:\\+tmp/.test(rendererText));
check("K-13: renderer guards out-dir outside repo root", /must be OUTSIDE repo root/.test(rendererText));
check("K-14: renderer does NOT import openai/googleapis/playwright/elevenlabs", !/(import|require)[^\n]*['"`](openai|googleapis|playwright|elevenlabs)['"`]/i.test(rendererCode));
check("K-15: renderer does NOT use fetch()", !/\bfetch\s*\(/.test(rendererCode));
check("K-16: renderer does NOT import node:http/https", !/from\s+["']node:https?["']|require\(["']https?["']\)/.test(rendererCode));
check("K-17: renderer does NOT read process.env", !/process\.env\./.test(rendererCode));
check("K-18: renderer does NOT read a .env file", !/(^|[^A-Za-z0-9_])\.env(\.[A-Za-z]+)?(["'`\s)]|$)/m.test(rendererCode));
check("K-19: renderer does NOT call openai/elevenlabs/ecos endpoints", !/api\.openai\.com|api\.elevenlabs\.io|ecos\.bok\.or\.kr/i.test(rendererCode));
check("K-20: renderer does NOT upload/publish/deploy", !/videos\.insert|media_publish|graph\.facebook\.com|vercel\s+deploy/i.test(rendererCode));
check("K-21: renderer does NOT generate images", !/imagen|dall-?e|pollinations|stability\.ai/i.test(rendererCode));
check("K-22: renderer does NOT generate TTS", !/text-to-speech|\.speech\.|tts\.(synthesize|create|generate)/i.test(rendererCode));
check("K-23: renderer report marks visualOnly true", /visualOnly: true/.test(rendererText));
check("K-24: renderer report marks uploadReady false + requiresTtsSoundMux true", /uploadReady: false/.test(rendererText) && /requiresTtsSoundMuxBeforeUpload: true/.test(rendererText));
check("K-25: renderer does not overwrite accepted final mux mp4", !/premium-editorial-selected-image-visual-only-v1-tts-mux\.mp4/.test(rendererCode));
// caption one-line enforcement in the renderer: it must ABORT (non-zero exit) on any
// caption violation BEFORE writing a "successful" mp4/report, not silently truncate.
check("K-26: renderer computes caption violations against manifest oneLineMaxChars", /captionViolations/.test(rendererText) && /oneLineMaxChars/.test(rendererText));
check("K-27: renderer ABORTs (process.exit) when caption violations exist", /captionViol\.length > 0/.test(rendererText) && /process\.exit\(/.test(rendererText));
check("K-28: renderer treats ellipsis-truncated captions as violations", /\[…\]|\\\.\{3\}/.test(rendererText) || /ellipsis/.test(rendererText));
check("K-29: renderer report captionsOneLine is hard-set true only past the abort gate", /const captionsOneLine = true/.test(rendererText));
check("K-30: renderer report captionsTruncated is the enforced-empty array", /captionsTruncated: captionsTruncatedFinal/.test(rendererText));
check("K-31: renderer does NOT push into a mutable captionsTruncated during render (no silent truncation list)", !/captionsTruncated\.push\(/.test(rendererText));

// ── § L. render report (if produced) ─────────────────────────────────────────
let report = null;
if (op.renderReport && existsSync(op.renderReport)) {
  try { report = JSON.parse(readFileSync(op.renderReport, "utf8")); } catch { report = null; }
}
if (report) {
  check("L-01: report schemaVersion correct", report.schemaVersion === "money_shorts_creative_final_visual_render_report_v1");
  check("L-02: report visualOnly === true", report.visualOnly === true);
  check("L-03: report uploadReady === false", report.uploadReady === false);
  check("L-04: report requiresTtsSoundMuxBeforeUpload === true", report.requiresTtsSoundMuxBeforeUpload === true);
  check("L-05: report audioRendered === false", report.audioRendered === false);
  check("L-06: report ttsRendered === false", report.ttsRendered === false);
  check("L-07: report sfxRendered === false", report.sfxRendered === false);
  check("L-08: report isPreviewSubset === false", report.isPreviewSubset === false);
  check("L-09: report fullThirtySecondRender === true", report.fullThirtySecondRender === true);
  check("L-10: report usedActualSelectedImages === true", report.usedActualSelectedImages === true);
  check("L-11: report placeholderImagesUsed === false", report.placeholderImagesUsed === false);
  check("L-12: report imageExistence all exist with size>0", isArr(report.imageExistence) && report.imageExistence.every((i) => i.exists && i.size > 0));
  // ffprobe: h264 / 1080x1920 / 30fps / 30±0.5s / no audio
  check("L-13: probe codec h264", report.probe?.codec === "h264");
  check("L-14: probe width 1080", report.probe?.width === 1080);
  check("L-15: probe height 1920", report.probe?.height === 1920);
  check("L-16: probe fps ~30", Math.abs((report.probe?.fps ?? 0) - 30) <= 0.5);
  check("L-17: probe duration 30±0.5", Math.abs((report.probe?.durationSec ?? 0) - 30) <= 0.5);
  check("L-18: probe has NO audio", report.probe?.hasAudio === false);
  check("L-19: report event count >= 24", report.eventTimelineAudit?.totalVisualEvents >= 24);
  check("L-20: report first5s >= 4", report.eventTimelineAudit?.first5sEventCount >= 4);
  check("L-21: report maxStatic <= 2.2", report.eventTimelineAudit?.maxStaticDuration <= 2.2);
  check("L-22: report no 3-in-a-row motion", report.eventTimelineAudit?.sameMotionThreeInARow === false);
  check("L-23: report isFullNotPreviewSubset true", report.eventTimelineAudit?.isFullNotPreviewSubset === true);
  check("L-24: report captionsOneLine === true (NOT just present)", report.captionsOneLine === true);
  check("L-24b: report captionsTruncated is an array of length 0", isArr(report.captionsTruncated) && report.captionsTruncated.length === 0);
  check("L-24c: report captionOneLineMaxChars recorded", isNum(report.captionOneLineMaxChars) && report.captionOneLineMaxChars > 0);
  check("L-25: report youtubeSafeFrameApplied true", report.youtubeSafeFrameApplied === true);
  check("L-26: report hardFailReasonCount === 0", report.hardFailReasonCount === 0);
  check("L-27: report motionTemplatesUsed listed", isArr(report.motionTemplatesUsed) && report.motionTemplatesUsed.length >= 3);
} else {
  check("L-00: render report not yet produced (renderer not run) — informational", true, "run renderer to populate §L");
}

// ── § M. no credential / forbidden-file refs ─────────────────────────────────
for (const [label, raw] of [["manifest", manifestRaw], ["builder", builderText], ["renderer", rendererText]]) {
  check(`M-01:${label}: no access_token`, !/access_?token/i.test(raw));
  check(`M-02:${label}: no refresh_token`, !/refresh_?token/i.test(raw));
  check(`M-03:${label}: no client_secret/api_key`, !/client_?secret|api_?key/i.test(raw));
  check(`M-04:${label}: no OAuth code`, !/oauth[_-]?code/i.test(raw));
  check(`M-05:${label}: no EAA/IGA token-looking string`, !/\b(EAA|IGA)[A-Za-z0-9]{20,}/.test(raw));
  check(`M-06:${label}: no codex transfer doc ref`, !raw.includes(CTX_TRANSFER_TOKEN));
  check(`M-07:${label}: no diag output file ref`, !raw.includes(PIQ_TOKEN));
}
check("M-08: guard does not reference the codex transfer doc", !selfText.includes(CTX_TRANSFER_TOKEN));
check("M-09: guard does not reference the diag output file", !selfText.includes(PIQ_TOKEN));
const guardImports = (selfText.match(/^import\s+.*?from\s+["']([^"']+)["']/gm) || []).map((l) => (l.match(/from\s+["']([^"']+)["']/) || [])[1]);
const ALLOWED = new Set(["node:fs", "node:url", "node:path"]);
check("M-10: guard imports only node:fs/url/path", guardImports.length > 0 && guardImports.every((m) => ALLOWED.has(m)), `imports=${guardImports.join(",")}`);

// ── § N. per-event deep audit ────────────────────────────────────────────────
evs.forEach((e, i) => {
  const tag = `ev${i + 1}`;
  check(`N-${tag}-01: imagePath in image set`, imgPathsInSet.has(e.imagePath));
  check(`N-${tag}-02: motion renderer-supported`, supV1.has(e.motion_template));
  check(`N-${tag}-03: duration > 0 and <= 2.2`, e.duration > 0 && e.duration <= 2.2);
  check(`N-${tag}-04: time_start < time_end`, e.time_start < e.time_end);
  check(`N-${tag}-05: safe_frame_ref correct`, e.safe_frame_ref === "youtube_shorts_safe_frame_v1");
});

// ── result ────────────────────────────────────────────────────────────────────
const pass = results.filter((r) => r.pass);
const fail = results.filter((r) => !r.pass);
console.log(`\n══════════════════════════════════════════════════════════`);
console.log(`  CREATIVE FINAL VISUAL RENDER v1 — STRUCTURE/SAFETY GUARD`);
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
  console.log(`GUARD OK: creative final visual render structure/safety intact (${pass.length}/${results.length}).`);
  process.exit(0);
}
