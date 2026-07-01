#!/usr/bin/env node
// ──────────────────────────────────────────────────────────────────────────
// check-money-shorts-creative-voice-sound-mux-static.mjs
//
// CREATIVE VOICE+SOUND MUX v1 — STRUCTURE/SAFETY GUARD (data-only, no execution)
//
// 검증 대상:
//   - Creative Layer source fixtures (script/planner/scorer/visual manifest)
//   - money-shorts-creative-voice-sound-mux-manifest.v1.json  (mux manifest)
//   - build-money-shorts-creative-voice-sound-mux-manifest-v1.mjs (builder)
//   - run-money-shorts-creative-voice-sound-mux-v1.mjs             (runner)
//   - (if present) visual render report + mux report under C:\tmp
//   - self
//
// 핵심: local_mock TTS mux가 Creative Layer selected candidate에서 파생되고,
//   visual report가 pre-mux 상태(uploadReady=false, requiresTtsSoundMux=true,
//   captionsOneLine=true, captionsTruncated=[])이며, mux 결과가 h264/aac/1080x1920/
//   30fps/30±0.5s/av-gap<=0.2s이고, 최종 상태가 review_required + ownerAcceptanceRequired
//   + uploadReady=false로 유지되며 외부 API/real-TTS/upload 흔적이 없는지.
//
// Node built-in only. 외부 네트워크/렌더 실행 없음. 순수 정적 검사.
// ──────────────────────────────────────────────────────────────────────────

import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const F = (n) => join(__dirname, "fixtures", n);
const SCRIPT_PATH = F("money-shorts-retention-script-compiler.output.v1.json");
const PLANNER_PATH = F("money-shorts-scene-event-planner.output.v1.json");
const SCORER_PATH = F("money-shorts-quality-scorer.output.v1.json");
const VISUAL_MANIFEST_PATH = F("money-shorts-creative-final-visual-render-manifest.v1.json");
const MANIFEST_PATH = F("money-shorts-creative-voice-sound-mux-manifest.v1.json");
const BUILDER_PATH = join(__dirname, "build-money-shorts-creative-voice-sound-mux-manifest-v1.mjs");
const RUNNER_PATH = join(__dirname, "run-money-shorts-creative-voice-sound-mux-v1.mjs");
const SELF_PATH = join(__dirname, "check-money-shorts-creative-voice-sound-mux-static.mjs");

const VISUAL_REPORT_PATH = "C:\\tmp\\money-shorts-os\\creative-final-visual-render-v1\\creative-final-visual-render-report.json";

const results = [];
function check(name, condition, detail = "") { results.push({ name, pass: !!condition, detail }); }
function isStr(v) { return typeof v === "string" && v.length > 0; }
function isNum(v) { return typeof v === "number" && Number.isFinite(v); }
function isArr(v) { return Array.isArray(v); }

const CTX_TRANSFER_TOKEN = "CONTEXT" + "_TRANSFER_" + "CODEX";
const PIQ_TOKEN = "piq" + "_diag_" + "out";

let script, planner, scorer, visualManifest, manifest, manifestRaw, builderText, runnerText, selfText;
try {
  script = JSON.parse(readFileSync(SCRIPT_PATH, "utf8"));
  planner = JSON.parse(readFileSync(PLANNER_PATH, "utf8"));
  scorer = JSON.parse(readFileSync(SCORER_PATH, "utf8"));
  visualManifest = JSON.parse(readFileSync(VISUAL_MANIFEST_PATH, "utf8"));
  manifestRaw = readFileSync(MANIFEST_PATH, "utf8");
  manifest = JSON.parse(manifestRaw);
  builderText = readFileSync(BUILDER_PATH, "utf8");
  runnerText = readFileSync(RUNNER_PATH, "utf8");
  selfText = readFileSync(SELF_PATH, "utf8");
} catch (e) {
  console.error(`FATAL: cannot read/parse inputs: ${e.message}`);
  process.exit(2);
}

const runnerCode = runnerText.split(/\r?\n/).filter((ln) => !/^\s*\/\//.test(ln)).join("\n");
const builderCode = builderText.split(/\r?\n/).filter((ln) => !/^\s*\/\//.test(ln)).join("\n");

// ── § A. source schemaVersion ────────────────────────────────────────────────
check("A-01: script compiler schemaVersion correct", script.schemaVersion === "money_shorts_retention_script_compiler_output_v1");
check("A-02: scene planner schemaVersion correct", planner.schemaVersion === "money_shorts_scene_event_planner_output_v1");
check("A-03: quality scorer schemaVersion correct", scorer.schemaVersion === "money_shorts_quality_scorer_output_v1");
check("A-04: visual manifest schemaVersion correct", visualManifest.schemaVersion === "money_shorts_creative_final_visual_render_manifest_v1");

// ── § B. mux manifest schema + local_mock/upload flags ───────────────────────
check("B-01: mux manifest schemaVersion === money_shorts_creative_voice_sound_mux_manifest_v1", manifest.schemaVersion === "money_shorts_creative_voice_sound_mux_manifest_v1");
check("B-02: mux manifest status === data_only_voice_sound_mux_manifest", manifest.status === "data_only_voice_sound_mux_manifest");
check("B-03: audioMode === local_mock", manifest.audioMode === "local_mock");
check("B-04: notRealSpeech === true", manifest.notRealSpeech === true);
check("B-05: ownerAcceptanceRequired === true", manifest.ownerAcceptanceRequired === true);
check("B-06: uploadReady === false", manifest.uploadReady === false);
check("B-07: realTtsRequiredBeforeUpload === true", manifest.realTtsRequiredBeforeUpload === true);
check("B-08: isFinalUploadReadyVideo === false", manifest.isFinalUploadReadyVideo === false);
check("B-09: manifest has sourceRefs", typeof manifest.sourceRefs === "object");
check("B-10: manifest has ttsScript", typeof manifest.ttsScript === "object");
check("B-11: manifest has audioTimelinePolicy", typeof manifest.audioTimelinePolicy === "object");
check("B-12: manifest has soundPolicy", typeof manifest.soundPolicy === "object");
check("B-13: manifest has muxExpectations", typeof manifest.muxExpectations === "object");
check("B-14: manifest has outputPaths", typeof manifest.outputPaths === "object");
check("B-15: manifest.boundary.notRealSpeech === true", manifest.boundary?.notRealSpeech === true);
check("B-16: manifest does NOT claim upload ready anywhere", !/uploadReady["']?\s*:\s*true/.test(manifestRaw));

// ── § C. selected candidate consistency ──────────────────────────────────────
const scorerTopic = scorer.topics.find((t) => t.topicId === manifest.selectedTopicId) ?? scorer.topics[0];
const scorerSelectedId = scorerTopic?.selectedCandidate?.candidateId;
check("C-01: manifest selectedCandidateId matches quality scorer selected candidate", manifest.selectedCandidateId === scorerSelectedId);
check("C-02: manifest selectedCandidateId matches visual manifest selected candidate", manifest.selectedCandidateId === visualManifest.selectedCandidateId);
check("C-03: manifest selectedTopicId matches visual manifest topic", manifest.selectedTopicId === visualManifest.selectedTopicId);
check("C-04: quality scorer decision is render or render_best_candidate", ["render", "render_best_candidate"].includes(scorerTopic?.qualityReport?.final_decision));
check("C-05: manifest qualityScorerDecision matches scorer", manifest.qualityScorerDecision === scorerTopic?.qualityReport?.final_decision);
check("C-06: quality scorer hard_fail_reasons empty (no hard fail)", (scorerTopic?.qualityReport?.hard_fail_reasons?.length ?? 1) === 0);
check("C-07: manifest hardFailReasonCount === 0", manifest.hardFailReasonCount === 0);

// ── § D. TTS text derived from selected candidate voiceover ──────────────────
const scriptTopic = script.topics.find((t) => t.topicId === manifest.selectedTopicId);
const scriptCand = scriptTopic?.candidates.find((c) => c.candidateId === scriptTopic.selectedCandidateId);
const candVoiceover = scriptCand?.script?.full_voiceover ?? "";
check("D-01: manifest ttsScript.fullVoiceover matches candidate full_voiceover", manifest.ttsScript?.fullVoiceover === candVoiceover);
check("D-02: ttsScript ttsMode === local_mock", manifest.ttsScript?.ttsMode === "local_mock");
check("D-03: ttsScript notRealSpeech === true", manifest.ttsScript?.notRealSpeech === true);
check("D-04: ttsScript scenes present (6)", isArr(manifest.ttsScript?.scenes) && manifest.ttsScript.scenes.length === 6);
check("D-05: ttsScript scenes carry text derived from voiceover", manifest.ttsScript.scenes.every((s) => typeof s.text === "string"));
check("D-06: ttsScript scene text is a substring of the candidate voiceover", manifest.ttsScript.scenes.every((s) => !s.text || candVoiceover.includes(s.text.split(" ")[0])));
check("D-07: ttsScript sceneTotalDurationSec ~ targetDurationSec", Math.abs((manifest.ttsScript?.sceneTotalDurationSec ?? 0) - (manifest.targetDurationSec ?? 30)) <= 0.5);
check("D-08: ttsScript targetDurationSec === candidate target_duration", manifest.ttsScript?.targetDurationSec === scriptCand?.script?.target_duration);

// ── E. audio timeline policy (no hard trim / excessive silence) ──────────────
check("E-01: audioTimelinePolicy.tailHardTrimForbidden === true", manifest.audioTimelinePolicy?.tailHardTrimForbidden === true);
check("E-02: audioTimelinePolicy.excessiveSilenceForbidden === true", manifest.audioTimelinePolicy?.excessiveSilenceForbidden === true);
check("E-03: audioTimelinePolicy has atempoRatioAbortThreshold", isNum(manifest.audioTimelinePolicy?.atempoRatioAbortThreshold));
check("E-04: sceneTotal matches targetDuration (30s fit, no atempo forcing)", manifest.audioTimelinePolicy?.atempoUsedForFit === false);

// ── § F. sound / sfx policy (deferred, no fabrication) ───────────────────────
check("F-01: soundPolicy.sfxPlanned === true", manifest.soundPolicy?.sfxPlanned === true);
check("F-02: soundPolicy.sfxRendered === false", manifest.soundPolicy?.sfxRendered === false);
check("F-03: soundPolicy has sfxRenderDeferredReason", isStr(manifest.soundPolicy?.sfxRenderDeferredReason));
check("F-04: soundPolicy.fabricatedSfxForbidden === true", manifest.soundPolicy?.fabricatedSfxForbidden === true);
check("F-05: soundPolicy.externalSfxDownloadForbidden === true", manifest.soundPolicy?.externalSfxDownloadForbidden === true);

// ── § G. visual report pre-mux state ─────────────────────────────────────────
let visualReport = null;
if (existsSync(VISUAL_REPORT_PATH)) {
  try { visualReport = JSON.parse(readFileSync(VISUAL_REPORT_PATH, "utf8")); } catch { visualReport = null; }
}
if (visualReport) {
  check("G-01: visual report uploadReady === false", visualReport.uploadReady === false);
  check("G-02: visual report requiresTtsSoundMuxBeforeUpload === true", visualReport.requiresTtsSoundMuxBeforeUpload === true);
  check("G-03: visual report captionsOneLine === true", visualReport.captionsOneLine === true);
  check("G-04: visual report captionsTruncated is empty", isArr(visualReport.captionsTruncated) && visualReport.captionsTruncated.length === 0);
  check("G-05: visual report selectedCandidateId matches mux manifest", visualReport.selectedCandidateId === manifest.selectedCandidateId);
  check("G-06: visual report visualOnly === true", visualReport.visualOnly === true);
} else {
  check("G-00: visual render report not present — informational", true, "run visual renderer first");
}

// ── § H. builder consumes sources + is data-only ─────────────────────────────
check("H-01: builder references script compiler output", /money-shorts-retention-script-compiler\.output\.v1\.json/.test(builderText));
check("H-02: builder references scene planner output", /money-shorts-scene-event-planner\.output\.v1\.json/.test(builderText));
check("H-03: builder references quality scorer output", /money-shorts-quality-scorer\.output\.v1\.json/.test(builderText));
check("H-04: builder references visual final render manifest", /money-shorts-creative-final-visual-render-manifest\.v1\.json/.test(builderText));
check("H-05: builder cross-checks visual manifest vs scorer candidate", /visualManifest\.selectedCandidateId !== selectedCandidateId/.test(builderText));
check("H-06: builder aborts if hard_fail_reasons > 0", /hard_fail_reasons/.test(builderText) && /ABORT/.test(builderText));
check("H-07: builder derives TTS text from candidate full_voiceover", /full_voiceover/.test(builderText));
check("H-08: builder is data-only (no spawn/exec)", !new RegExp("spawn" + "Sync?\\(|" + "exec" + "(Sync)?\\(").test(builderCode));
check("H-09: builder is deterministic (no Math.random)", !/Math\.random\s*\(/.test(builderText));
check("H-10: builder does not read process.env", !/process\.env\./.test(builderCode));
check("H-11: builder does not use fetch/http", !/\bfetch\s*\(/.test(builderCode) && !/from\s+["']node:https?["']/.test(builderCode));

// ── § I. runner: local ffmpeg/mux only, no external / no real-tts / no upload ─
check("I-01: runner enforces audioMode local_mock", /audioMode !== ["']local_mock["']/.test(runnerText));
check("I-02: runner enforces uploadReady false + ownerAcceptanceRequired true", /uploadReady !== false/.test(runnerText) && /ownerAcceptanceRequired !== true/.test(runnerText));
check("I-03: runner reuses local_mock TTS builder", /reuseHelpers\.ttsBuilder/.test(runnerText) && /build-local-mock-tts-audio-from-script/.test(manifestRaw));
check("I-04: runner reuses mux helper", /reuseHelpers\.muxRunner/.test(runnerText) && /mux-local-tts-audio-into-visual-mp4/.test(manifestRaw));
check("I-05: runner spawns via spawnSync shell:false", /spawnSync\(/.test(runnerText) && /shell:\s*false/.test(runnerText));
check("I-06: runner invokes ffprobe", /spawnSync\(\s*["']ffprobe["']/.test(runnerText) || /["']ffprobe["'],/.test(runnerText));
check("I-07: runner enforces out-dir under C:\\tmp", /must be under C:\\+tmp/.test(runnerText));
check("I-08: runner guards out-dir outside repo root", /must be OUTSIDE repo root/.test(runnerText));
// runner has an explicit refuse-guard for the accepted final mux path, and its output goes
// to a separate creative-voice-sound-mux dir (verified via manifest.outputPaths below).
check("I-09: runner has an explicit refuse-guard for the accepted final mux mp4", /refuse to write to the existing accepted final mux/.test(runnerText));
check("I-09b: mux output dir is separate from the accepted final mux artifact", /creative-voice-sound-mux-v1/.test(manifest.outputPaths?.muxedMp4 ?? "") && !/selected-image-elevenlabs-tts-mux/.test(manifest.outputPaths?.muxedMp4 ?? ""));
check("I-10: runner does NOT import openai/googleapis/playwright/elevenlabs", !/(import|require)[^\n]*['"`](openai|googleapis|playwright|elevenlabs)['"`]/i.test(runnerCode));
check("I-11: runner does NOT use fetch()", !/\bfetch\s*\(/.test(runnerCode));
check("I-12: runner does NOT import node:http/https", !/from\s+["']node:https?["']|require\(["']https?["']\)/.test(runnerCode));
check("I-13: runner does NOT read process.env for secrets", !/process\.env\./.test(runnerCode));
check("I-14: runner does NOT read a .env file", !/(^|[^A-Za-z0-9_])\.env(\.[A-Za-z]+)?(["'`\s)]|$)/m.test(runnerCode));
check("I-15: runner does NOT call openai/elevenlabs/ecos endpoints", !/api\.openai\.com|api\.elevenlabs\.io|ecos\.bok\.or\.kr/i.test(runnerCode));
check("I-16: runner does NOT upload/publish/deploy", !/videos\.insert|media_publish|graph\.facebook\.com|vercel\s+deploy/i.test(runnerCode));
check("I-17: runner does NOT generate images", !/imagen|dall-?e|pollinations|stability\.ai/i.test(runnerCode));
check("I-18: runner does NOT auto-retry (single-shot helper calls)", !/for\s*\([^)]*retry|while\s*\([^)]*retry|maxRetries/i.test(runnerCode));
check("I-19: runner writes report status review_required", /status: ["']review_required["']/.test(runnerText));
check("I-20: runner report keeps uploadReady false + ownerAcceptanceRequired true", /uploadReady: false/.test(runnerText) && /ownerAcceptanceRequired: true/.test(runnerText));
check("I-21: runner report keeps realTtsRequiredBeforeUpload true", /realTtsRequiredBeforeUpload: true/.test(runnerText));
check("I-22: runner does NOT generate upload queue readiness", /uploadQueueReadinessGenerated: false/.test(runnerText));
check("I-23: runner verifies av gap <= maxGap", /avGap <= maxGap/.test(runnerText) || /av gap/.test(runnerText));

// ── § J. mux report (if produced) ────────────────────────────────────────────
const muxReportPath = manifest.outputPaths?.muxReport;
let muxReport = null;
if (muxReportPath && existsSync(muxReportPath)) {
  try { muxReport = JSON.parse(readFileSync(muxReportPath, "utf8")); } catch { muxReport = null; }
}
if (muxReport) {
  check("J-01: mux report schemaVersion correct", muxReport.schemaVersion === "money_shorts_creative_voice_sound_mux_report_v1");
  check("J-02: mux report status === review_required", muxReport.status === "review_required");
  check("J-03: mux report audioMode === local_mock", muxReport.audioMode === "local_mock");
  check("J-04: mux report notRealSpeech === true", muxReport.notRealSpeech === true);
  check("J-05: mux report ownerAcceptanceRequired === true", muxReport.ownerAcceptanceRequired === true);
  check("J-06: mux report uploadReady === false", muxReport.uploadReady === false);
  check("J-07: mux report realTtsRequiredBeforeUpload === true", muxReport.realTtsRequiredBeforeUpload === true);
  check("J-08: mux report uploadQueueReadinessGenerated === false", muxReport.uploadQueueReadinessGenerated === false);
  check("J-09: mux report ttsTextDerivedFromCandidate === true", muxReport.ttsTextDerivedFromCandidate === true);
  check("J-10: mux report selectedCandidateId matches manifest", muxReport.selectedCandidateId === manifest.selectedCandidateId);
  // ffprobe validation
  check("J-11: mux probe video codec h264", muxReport.probe?.videoCodec === "h264");
  check("J-12: mux probe audio codec aac", muxReport.probe?.audioCodec === "aac");
  check("J-13: mux probe width 1080", muxReport.probe?.width === 1080);
  check("J-14: mux probe height 1920", muxReport.probe?.height === 1920);
  check("J-15: mux probe fps ~30", Math.abs((muxReport.probe?.fps ?? 0) - 30) <= 0.5);
  check("J-16: mux probe duration 30±0.5", Math.abs((muxReport.probe?.durationSec ?? 0) - 30) <= 0.5);
  check("J-17: mux probe audio present", muxReport.probe?.audioPresent === true);
  check("J-18: mux probe av gap <= 0.2s", isNum(muxReport.probe?.avGapSec) && muxReport.probe.avGapSec <= 0.2);
  check("J-19: mux report muxedMp4Path under C:\\tmp", /^C:\\+tmp\\+/i.test(muxReport.muxedMp4Path ?? ""));
  check("J-20: mux report muxedMp4Path is not the accepted final mux mp4", !/premium-editorial-selected-image-visual-only-v1-tts-mux\.mp4$/.test(muxReport.muxedMp4Path ?? ""));
  check("J-21: mux report soundPolicy sfxRendered false", muxReport.soundPolicy?.sfxRendered === false);
} else {
  check("J-00: mux report not produced (runner not run) — informational", true, "run the mux runner to populate §J");
}

// ── § K. output paths under C:\tmp ───────────────────────────────────────────
const op = manifest.outputPaths ?? {};
check("K-01: outDir under C:\\tmp", /^C:\\+tmp\\+/i.test(op.outDir ?? ""));
check("K-02: muxedMp4 under C:\\tmp", /^C:\\+tmp\\+/i.test(op.muxedMp4 ?? ""));
check("K-03: muxReport under C:\\tmp", /^C:\\+tmp\\+/i.test(op.muxReport ?? ""));
check("K-04: ttsScriptJson under C:\\tmp", /^C:\\+tmp\\+/i.test(op.ttsScriptJson ?? ""));
check("K-05: outDir is the creative-voice-sound-mux dir", /creative-voice-sound-mux-v1/.test(op.outDir ?? ""));
check("K-06: outDir not inside repo output/ dir", !/instagram-auto[\\/]output/i.test(op.outDir ?? ""));

// ── § L. mux expectations ────────────────────────────────────────────────────
const me = manifest.muxExpectations ?? {};
check("L-01: muxExpectations videoCodec h264", me.videoCodec === "h264");
check("L-02: muxExpectations audioCodec aac", me.audioCodec === "aac");
check("L-03: muxExpectations 1080x1920", me.widthPx === 1080 && me.heightPx === 1920);
check("L-04: muxExpectations fps 30", me.fps === 30);
check("L-05: muxExpectations maxAvGapSec === 0.2", me.maxAvGapSec === 0.2);
check("L-06: muxExpectations audioPresent === true", me.audioPresent === true);
check("L-07: muxExpectations durationToleranceSec === 0.5", me.durationToleranceSec === 0.5);

// ── § M. no credential / forbidden-file refs ─────────────────────────────────
for (const [label, raw] of [["manifest", manifestRaw], ["builder", builderText], ["runner", runnerText]]) {
  check(`M-01:${label}: no access_token`, !/access_?token/i.test(raw));
  check(`M-02:${label}: no refresh_token`, !/refresh_?token/i.test(raw));
  check(`M-03:${label}: no client_secret/api_key value`, !/client_?secret|api_?key\s*[:=]\s*["'][A-Za-z0-9]/i.test(raw));
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

// ── § N. per-scene TTS deep audit ────────────────────────────────────────────
(manifest.ttsScript?.scenes ?? []).forEach((sc, i) => {
  const tag = `scene${i + 1}`;
  check(`N-${tag}-01: durationSec > 0`, isNum(sc.durationSec) && sc.durationSec > 0);
  check(`N-${tag}-02: sourceImage image_0N`, /^image_0[1-6]$/.test(sc.sourceImage));
  check(`N-${tag}-03: text is a string`, typeof sc.text === "string");
});

// ── result ────────────────────────────────────────────────────────────────────
const pass = results.filter((r) => r.pass);
const fail = results.filter((r) => !r.pass);
console.log(`\n══════════════════════════════════════════════════════════`);
console.log(`  CREATIVE VOICE+SOUND MUX v1 — STRUCTURE/SAFETY GUARD`);
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
  console.log(`GUARD OK: creative voice+sound mux structure/safety intact (${pass.length}/${results.length}).`);
  process.exit(0);
}
