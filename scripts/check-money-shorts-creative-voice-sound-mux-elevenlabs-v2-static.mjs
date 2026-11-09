#!/usr/bin/env node
// ──────────────────────────────────────────────────────────────────────────
// check-money-shorts-creative-voice-sound-mux-elevenlabs-v2-static.mjs
//
// CREATIVE VOICE+SOUND MUX ELEVENLABS v2 — STRUCTURE/SAFETY GUARD (static, no execution)
//
// 검증 대상:
//   - money-shorts-creative-voice-sound-mux-manifest.v1.json      (source v1 manifest)
//   - money-shorts-creative-voice-sound-mux-manifest.elevenlabs-v2.json (v2 manifest)
//   - build-money-shorts-creative-voice-sound-mux-elevenlabs-v2.mjs      (v2 manifest builder)
//   - build-money-shorts-creative-voice-sound-mux-elevenlabs-v2-tts.mjs  (v2 atempo TTS builder)
//   - run-money-shorts-creative-voice-sound-mux-elevenlabs-v2-first-run.mjs (v2 runner)
//   - (if present) v2 tts summary + mux report under C:\tmp
//   - self
//
// 핵심: real ElevenLabs TTS mux가 v1 selected candidate에서 파생되고,
//   normalize가 atempo tail-preserving(no -t hard trim)이며, scene별 1회(max 6)·no-retry이고,
//   secret 원문 미출력·voice list endpoint 미호출이며, 최종 상태가
//   audioMode=elevenlabs_real_tts / notRealSpeech=false / realTtsExecuted=true /
//   ownerAcceptanceRequired=true / uploadReady=false / uploadQueueReadinessGenerated=false /
//   isFinalUploadReadyVideo=false로 유지되는지.
//
// Node built-in only. 순수 정적 검사.
// ──────────────────────────────────────────────────────────────────────────

import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const F = (n) => join(__dirname, "fixtures", n);
const V1_MANIFEST_PATH = F("money-shorts-creative-voice-sound-mux-manifest.v1.json");
const V2_MANIFEST_PATH = F("money-shorts-creative-voice-sound-mux-manifest.elevenlabs-v2.json");
const MBUILDER_PATH = join(__dirname, "build-money-shorts-creative-voice-sound-mux-elevenlabs-v2.mjs");
const TBUILDER_PATH = join(__dirname, "build-money-shorts-creative-voice-sound-mux-elevenlabs-v2-tts.mjs");
const RUNNER_PATH = join(__dirname, "run-money-shorts-creative-voice-sound-mux-elevenlabs-v2-first-run.mjs");
const SELF_PATH = join(__dirname, "check-money-shorts-creative-voice-sound-mux-elevenlabs-v2-static.mjs");

const results = [];
function check(name, condition, detail = "") { results.push({ name, pass: !!condition, detail }); }
function isStr(v) { return typeof v === "string" && v.length > 0; }
function isNum(v) { return typeof v === "number" && Number.isFinite(v); }
function isArr(v) { return Array.isArray(v); }

const CTX_TRANSFER_TOKEN = "CONTEXT" + "_TRANSFER_" + "CODEX";
const PIQ_TOKEN = "piq" + "_diag_" + "out";

let v1, v2, v2Raw, mbuilderText, tbuilderText, runnerText, selfText;
try {
  v1 = JSON.parse(readFileSync(V1_MANIFEST_PATH, "utf8"));
  v2Raw = readFileSync(V2_MANIFEST_PATH, "utf8");
  v2 = JSON.parse(v2Raw);
  mbuilderText = readFileSync(MBUILDER_PATH, "utf8");
  tbuilderText = readFileSync(TBUILDER_PATH, "utf8");
  runnerText = readFileSync(RUNNER_PATH, "utf8");
  selfText = readFileSync(SELF_PATH, "utf8");
} catch (e) {
  console.error(`FATAL: cannot read/parse inputs: ${e.message}`);
  process.exit(2);
}

// strip line comments for code-intent checks (avoid matching prose in comments)
const stripComments = (t) => t.split(/\r?\n/).filter((ln) => !/^\s*\/\//.test(ln)).join("\n");
const mbuilderCode = stripComments(mbuilderText);
const tbuilderCode = stripComments(tbuilderText);
const runnerCode = stripComments(runnerText);

// ── § A. v2 manifest schema + real-TTS/upload flags ──────────────────────────
check("A-01: v2 manifest schemaVersion === money_shorts_creative_voice_sound_mux_manifest_elevenlabs_v2", v2.schemaVersion === "money_shorts_creative_voice_sound_mux_manifest_elevenlabs_v2");
check("A-02: v2 status === data_only_elevenlabs_voice_sound_mux_manifest", v2.status === "data_only_elevenlabs_voice_sound_mux_manifest");
check("A-03: audioMode === elevenlabs_real_tts", v2.audioMode === "elevenlabs_real_tts");
check("A-04: notRealSpeech === false", v2.notRealSpeech === false);
check("A-05: realTtsExecuted === false at manifest stage (runner sets true)", v2.realTtsExecuted === false);
check("A-06: ownerAcceptanceRequired === true", v2.ownerAcceptanceRequired === true);
check("A-07: uploadReady === false", v2.uploadReady === false);
check("A-08: uploadQueueReadinessGenerated === false", v2.uploadQueueReadinessGenerated === false);
check("A-09: isFinalUploadReadyVideo === false", v2.isFinalUploadReadyVideo === false);
check("A-10: realTtsProvider === elevenlabs", v2.realTtsProvider === "elevenlabs");
check("A-11: v2 manifest never asserts uploadReady:true", !/uploadReady["']?\s*:\s*true/.test(v2Raw));
check("A-12: v2 manifest never asserts notRealSpeech:true", !/notRealSpeech["']?\s*:\s*true/.test(v2Raw));
check("A-13: v2 manifest never asserts uploadQueueReadinessGenerated:true", !/uploadQueueReadinessGenerated["']?\s*:\s*true/.test(v2Raw));

// ── § B. derivation from v1 selected candidate ───────────────────────────────
check("B-01: v2 selectedCandidateId matches v1", v2.selectedCandidateId === v1.selectedCandidateId);
check("B-02: v2 selectedTopicId matches v1", v2.selectedTopicId === v1.selectedTopicId);
check("B-03: v2 selectedCandidateId === base-rate-hold-202605-cand-1", v2.selectedCandidateId === "base-rate-hold-202605-cand-1");
check("B-04: v2 targetDurationSec matches v1", v2.targetDurationSec === v1.targetDurationSec);
check("B-05: v2 qualityScorerDecision matches v1", v2.qualityScorerDecision === v1.qualityScorerDecision);
check("B-06: v2 hardFailReasonCount === 0", v2.hardFailReasonCount === 0);
check("B-07: v2 sourceRefs references v1 mux manifest", /money-shorts-creative-voice-sound-mux-manifest\.v1\.json/.test(v2Raw));
check("B-08: v2 fullVoiceover matches v1 fullVoiceover", v2.ttsScript?.fullVoiceover === v1.ttsScript?.fullVoiceover);

// ── § C. TTS script package (scene-paced, helper-compatible) ─────────────────
const ts = v2.ttsScript ?? {};
check("C-01: ttsScript.audioMode === elevenlabs_real_tts", ts.audioMode === "elevenlabs_real_tts");
check("C-02: ttsScript.notRealSpeech === false", ts.notRealSpeech === false);
check("C-03: ttsScript.provider === elevenlabs", ts.provider === "elevenlabs");
check("C-04: ttsScript has 6 scenes", isArr(ts.scenes) && ts.scenes.length === 6);
check("C-05: each scene has sceneNumber (helper field)", (ts.scenes ?? []).every((s) => Number.isInteger(s.sceneNumber)));
check("C-06: each scene has ttsText (helper field)", (ts.scenes ?? []).every((s) => isStr(s.ttsText)));
check("C-07: each scene has durationSec > 0", (ts.scenes ?? []).every((s) => isNum(s.durationSec) && s.durationSec > 0));
check("C-08: sceneTotal ~ target (30s fit)", Math.abs((ts.sceneTotalDurationSec ?? 0) - (v2.targetDurationSec ?? 30)) <= 0.5);
check("C-09: ttsScript.voiceCandidateId is set", isStr(ts.voiceCandidateId));
// scene text derived from candidate voiceover (each scene text substring-present in fullVoiceover)
const fv = ts.fullVoiceover ?? "";
check("C-10: scene ttsText derived from candidate voiceover", (ts.scenes ?? []).every((s) => { const first = (s.ttsText || "").split(/[\s,]/)[0]; return !first || fv.includes(first); }));

// ── § D. audio timeline / normalize policy (atempo, no hard trim) ────────────
const atp = v2.audioTimelinePolicy ?? {};
check("D-01: normalizeMethod === atempo", atp.normalizeMethod === "atempo");
check("D-02: tailHardTrimForbidden === true", atp.tailHardTrimForbidden === true);
check("D-03: atempoRatioAbortThreshold === 1.25", atp.atempoRatioAbortThreshold === 1.25);
check("D-04: excessiveSilenceForbidden === true", atp.excessiveSilenceForbidden === true);

// ── § E. elevenlabs policy (budget, no-retry, no voice list) ─────────────────
const ep = v2.elevenlabsPolicy ?? {};
check("E-01: apiCallBudgetMax === 6", ep.apiCallBudgetMax === 6);
check("E-02: perSceneMaxCalls === 1", ep.perSceneMaxCalls === 1);
check("E-03: autoRetryForbidden === true", ep.autoRetryForbidden === true);
check("E-04: voiceListEndpointForbidden === true", ep.voiceListEndpointForbidden === true);
check("E-05: voiceExperimentForbidden === true", ep.voiceExperimentForbidden === true);
check("E-06: scriptRewriteLoopForbidden === true", ep.scriptRewriteLoopForbidden === true);
check("E-07: secretRawOutputForbidden === true", ep.secretRawOutputForbidden === true);
check("E-08: allowedEnvKeys limited to ELEVENLABS_* voice/key", isArr(ep.allowedEnvKeys) && ep.allowedEnvKeys.every((k) => /^ELEVENLABS_/.test(k)));

// ── § F. sound / sfx policy (deferred, no fabrication) ───────────────────────
const sp = v2.soundPolicy ?? {};
check("F-01: sfxRendered === false", sp.sfxRendered === false);
check("F-02: sfxRenderDeferredReason present", isStr(sp.sfxRenderDeferredReason));
check("F-03: fabricatedSfxForbidden === true", sp.fabricatedSfxForbidden === true);
check("F-04: externalSfxDownloadForbidden === true", sp.externalSfxDownloadForbidden === true);

// ── § G. manifest builder: data-only, derives from v1, no side effects ───────
check("G-01: manifest builder references v1 mux manifest", /money-shorts-creative-voice-sound-mux-manifest\.v1\.json/.test(mbuilderText));
check("G-02: manifest builder aborts on v1 hard fail", /hardFailReasonCount !== 0/.test(mbuilderText) && /ABORT/.test(mbuilderText));
check("G-03: manifest builder pins candidate base-rate-hold-202605-cand-1", /base-rate-hold-202605-cand-1/.test(mbuilderText));
check("G-04: manifest builder is data-only (no spawn/exec)", !new RegExp("spawn" + "Sync?\\(|" + "exec" + "(Sync)?\\(|\\bfetch\\s*\\(").test(mbuilderCode));
check("G-05: manifest builder deterministic (no Math.random)", !/Math\.random\s*\(/.test(mbuilderText));
check("G-06: manifest builder does not read process.env", !/process\.env\./.test(mbuilderCode));

// ── § H. TTS builder: real API, no-retry, atempo, masked secret ──────────────
check("H-01: TTS builder calls ElevenLabs text-to-speech endpoint", /api\.elevenlabs\.io\/v1\/text-to-speech/.test(tbuilderText));
check("H-02: TTS builder enforces API_CALL_BUDGET_MAX = 6", /API_CALL_BUDGET_MAX\s*=\s*6/.test(tbuilderText));
check("H-03: TTS builder increments apiCallCount once per scene inside loop", /apiCallCount\+\+/.test(tbuilderText));
check("H-04: TTS builder aborts when budget exceeded", /API call budget exceeded/.test(tbuilderText));
check("H-05: TTS builder does NOT retry on API failure (exit, no retry loop)", /no retry/i.test(tbuilderText) && !/for\s*\([^)]*retry|while\s*\([^)]*retry|maxRetries/i.test(tbuilderCode));
check("H-06: TTS builder uses atempo for over-duration (tail-preserving)", /atempo=/.test(tbuilderText) || /filter:a["'`],\s*`atempo/.test(tbuilderText));
check("H-07: TTS builder does NOT use -t hard trim for over-duration scenes", !/normalizeStatus\s*=\s*["']trimmed["']/.test(tbuilderText));
check("H-08: TTS builder aborts if atempo ratio exceeds threshold", /atempo ratio .* exceeds threshold/.test(tbuilderText) || /ATEMPO_ABORT_THRESHOLD/.test(tbuilderText));
check("H-09: TTS builder masks voice id (no raw secret)", /maskVoiceId/.test(tbuilderText) && /voiceIdMasked/.test(tbuilderText));
check("H-10: TTS builder does NOT call voice list endpoint", !/\/v1\/voices\b/.test(tbuilderText) && !/api\.elevenlabs\.io\/v1\/voices/.test(tbuilderText));
check("H-11: TTS builder does NOT log raw apiKey/voiceId", !/console\.log\([^)]*\bapiKey\b/.test(tbuilderCode) && !/console\.log\([^)]*\bvoiceId\b(?!Masked|Configured|Source)/.test(tbuilderCode));
check("H-12: TTS builder does NOT import openai/googleapis/playwright", !/(import|require)[^\n]*['"`](openai|googleapis|playwright)['"`]/i.test(tbuilderCode));
check("H-13: TTS builder out-dir must be outside repo", /must be outside repo root/.test(tbuilderText));
check("H-14: TTS builder summary schema mux-compatible", /money_shorts_elevenlabs_scene_paced_tts_summary_v1/.test(tbuilderText));
check("H-15: TTS builder marks realTtsExecuted true + notRealSpeech false semantics", /realTtsExecuted:\s*true/.test(tbuilderText) && /liveApiCallPerformed:\s*true/.test(tbuilderText));
check("H-16: TTS builder records hardTrimApplied flag", /hardTrimApplied/.test(tbuilderText));
check("H-17: TTS builder does NOT read a .env file for writing/modification", !/writeFileSync\([^)]*\.env/.test(tbuilderCode));

// ── § H2. atempo tail-preserving contract (no -t hard trim in speed-up path) ─
// Codex review fix: the over-target/atempo_compressed path must NOT pass "-t" to ffmpeg
// (which would tail-trim). Length must come from apad whole_dur (extend-only) + verify.
// Precise checks below inspect the actual code (comments stripped) so guard prose can't self-pass.
//
// 1) The atempo filter chain must be built with apad whole_dur, never a raw -t trim.
const atempoChainLine = (tbuilderCode.match(/^[^\n]*filterChain\s*=\s*`atempo=[^\n]*$/m) || [])[0] ?? "";
check("H2-01: atempo filter chain uses apad whole_dur", /atempo=\$\{atempoRatio\},apad=whole_dur=/.test(atempoChainLine), atempoChainLine ? "" : "atempo filterChain line not found");
check("H2-02: atempo filter chain line has no -t hard trim", atempoChainLine.length > 0 && !/["'`]-t["'`]/.test(atempoChainLine));
// 2) The single normalizeArgs used for ALL branches must not contain a "-t" token
//    (length is set by apad whole_dur, not by trimming). Inspect the normalizeArgs assignment.
const normalizeArgsLine = (tbuilderCode.match(/^[^\n]*const\s+normalizeArgs\s*=\s*\[[^\n]*$/m) || [])[0] ?? "";
check("H2-03: normalizeArgs assignment found", normalizeArgsLine.length > 0);
check("H2-04: normalizeArgs contains NO \"-t\" hard-trim token", normalizeArgsLine.length > 0 && !/["'`]-t["'`]/.test(normalizeArgsLine));
check("H2-05: normalizeArgs uses filter_complex + apad (extend-only length)", /-filter_complex/.test(normalizeArgsLine) && /\$\{filterChain\}/.test(normalizeArgsLine));
// 3) No branch may set normalizeStatus to the old "trimmed" state.
check("H2-06: no trimmed normalizeStatus anywhere", !/normalizeStatus\s*=\s*["']trimmed["']/.test(tbuilderCode));
// 4) After normalize, duration is verified; overshoot beyond tolerance aborts instead of trimming.
check("H2-07: normalized duration is verified via ffprobe", /probeDurationSec\s*\(/.test(tbuilderCode) && /normalizedDurationSec/.test(tbuilderCode));
check("H2-08: overshoot beyond tolerance aborts (no trim to fix)", /normalizedDurationSec\s*>\s*targetSceneDurationSec\s*\+\s*NORMALIZE_OVERSHOOT_TOLERANCE/.test(tbuilderCode) && /Refusing to hard-trim/.test(tbuilderText));
// 5) Guardrail: the ONLY places a bare "-t" ffmpeg flag may appear in the TTS builder is
//    none — the whole normalize path is now trim-free. Assert zero "-t" occurrences in code.
const dashTOccurrences = (tbuilderCode.match(/["'`]-t["'`]/g) || []).length;
check("H2-09: zero bare \"-t\" ffmpeg flags remain in TTS builder code", dashTOccurrences === 0, `count=${dashTOccurrences}`);
// 6) recorded per-scene normalizedDurationSec must be the MEASURED value, not a hardcoded target.
check("H2-10: per-scene normalizedDurationSec is the measured value", /normalizedDurationSec:\s*parseFloat\(normalizedDurationSec\.toFixed/.test(tbuilderCode) && !/normalizedDurationSec:\s*targetSceneDurationSec/.test(tbuilderCode));

// ── § I. runner: orchestrates real TTS + mux, keeps boundaries ───────────────
check("I-01: runner enforces audioMode elevenlabs_real_tts", /audioMode !== ["']elevenlabs_real_tts["']/.test(runnerText));
check("I-02: runner enforces uploadReady false + ownerAcceptanceRequired true", /uploadReady !== false/.test(runnerText) && /ownerAcceptanceRequired !== true/.test(runnerText));
check("I-03: runner enforces uploadQueueReadinessGenerated false", /uploadQueueReadinessGenerated !== false/.test(runnerText));
check("I-04: runner reuses v2 atempo TTS builder", /reuseHelpers\.ttsBuilder/.test(runnerText) && /elevenlabs-v2-tts/.test(v2Raw));
check("I-05: runner reuses existing mux helper", /reuseHelpers\.muxRunner/.test(runnerText) && /mux-local-tts-audio-into-visual-mp4/.test(v2Raw));
check("I-06: runner aborts if hardTrimApplied true", /hardTrimApplied === true/.test(runnerText));
check("I-07: runner aborts on readiness failure / no live call", /readinessFailure === true/.test(runnerText) && /liveApiCallPerformed !== true/.test(runnerText));
check("I-08: runner spawns via spawnSync shell:false", /spawnSync\(/.test(runnerText) && /shell:\s*false/.test(runnerText));
check("I-09: runner invokes ffprobe", /["']ffprobe["']/.test(runnerText));
check("I-10: runner enforces out-dir under C:\\tmp", /must be under C:\\+tmp/.test(runnerText));
check("I-11: runner guards out-dir outside repo root", /must be OUTSIDE repo root/.test(runnerText));
check("I-12: runner has explicit refuse-guard for accepted final mux", /refuse to write to the existing accepted final mux/.test(runnerText));
check("I-13: runner does NOT import openai/googleapis/playwright/elevenlabs sdk", !/(import|require)[^\n]*['"`](openai|googleapis|playwright|elevenlabs)['"`]/i.test(runnerCode));
check("I-14: runner does NOT call fetch directly", !/\bfetch\s*\(/.test(runnerCode));
check("I-15: runner does NOT read process.env for secrets", !/process\.env\.(?!execPath)/.test(runnerCode.replace(/process\.execPath/g, "")));
check("I-16: runner does NOT upload/publish/deploy", !/videos\.insert|media_publish|graph\.facebook\.com|vercel\s+deploy/i.test(runnerCode));
check("I-17: runner does NOT generate images", !/imagen|dall-?e|pollinations|stability\.ai/i.test(runnerCode));
check("I-18: runner does NOT auto-retry helper calls", !/for\s*\([^)]*retry|while\s*\([^)]*retry|maxRetries/i.test(runnerCode));
check("I-19: runner report status review_required", /status: ["']review_required["']/.test(runnerText));
check("I-20: runner report keeps realTtsExecuted true", /realTtsExecuted: true/.test(runnerText));
check("I-21: runner report keeps uploadReady false + uploadQueueReadinessGenerated false", /uploadReady: false/.test(runnerText) && /uploadQueueReadinessGenerated: false/.test(runnerText));
check("I-22: runner report keeps ownerAcceptanceRequired true", /ownerAcceptanceRequired: true/.test(runnerText));
check("I-23: runner verifies av gap <= maxGap", /avGap <= maxGap/.test(runnerText) || /av gap/.test(runnerText));

// ── § J. runtime TTS summary (if produced) ───────────────────────────────────
const ttsSummaryPath = v2.outputPaths?.ttsSummaryJson;
let ttsSummary = null;
if (ttsSummaryPath && existsSync(ttsSummaryPath)) {
  try { ttsSummary = JSON.parse(readFileSync(ttsSummaryPath, "utf8")); } catch { ttsSummary = null; }
}
if (ttsSummary) {
  check("J-01: tts summary schema mux-compatible", ttsSummary.schemaVersion === "money_shorts_elevenlabs_scene_paced_tts_summary_v1");
  check("J-02: tts summary provider elevenlabs", ttsSummary.provider === "elevenlabs");
  check("J-03: tts summary liveApiCallPerformed true", ttsSummary.liveApiCallPerformed === true);
  check("J-04: tts summary readinessFailure false", ttsSummary.readinessFailure === false);
  check("J-05: tts summary apiCallCount <= 6", isNum(ttsSummary.apiCallCount) && ttsSummary.apiCallCount <= 6);
  check("J-06: tts summary apiCallCount === sceneCount (1 per scene)", ttsSummary.apiCallCount === ttsSummary.sceneCount);
  check("J-07: tts summary normalizeMethod atempo", ttsSummary.normalizeMethod === "atempo");
  check("J-08: tts summary hardTrimApplied false", ttsSummary.hardTrimApplied === false);
  check("J-09: tts summary maxAtempoRatio <= abort threshold", isNum(ttsSummary.maxAtempoRatio) && ttsSummary.maxAtempoRatio <= (ttsSummary.atempoAbortThreshold ?? 1.25));
  check("J-10: tts summary qualityAccepted false", ttsSummary.qualityAccepted === false);
  check("J-11: tts summary ownerListeningRequired true", ttsSummary.ownerListeningRequired === true);
  check("J-12: tts summary timelineDurationSec ~ target", isNum(ttsSummary.timelineDurationSec) && Math.abs(ttsSummary.timelineDurationSec - ttsSummary.targetDurationSec) <= 0.5);
  check("J-13: tts summary voiceIdMasked is masked (contains ***)", isStr(ttsSummary.voiceIdMasked) && ttsSummary.voiceIdMasked.includes("***"));
  check("J-14: tts summary has no raw apiKey field", !("apiKey" in ttsSummary) && !("xi_api_key" in ttsSummary));
} else {
  check("J-00: tts summary not produced (runner not run) — informational", true, "run the v2 runner to populate §J");
}

// ── § K. runtime mux report (if produced) ────────────────────────────────────
const muxReportPath = v2.outputPaths?.muxReport;
let muxReport = null;
if (muxReportPath && existsSync(muxReportPath)) {
  try { muxReport = JSON.parse(readFileSync(muxReportPath, "utf8")); } catch { muxReport = null; }
}
if (muxReport) {
  check("K-01: mux report schema correct", muxReport.schemaVersion === "money_shorts_creative_voice_sound_mux_elevenlabs_v2_report");
  check("K-02: mux report status review_required", muxReport.status === "review_required");
  check("K-03: mux report audioMode elevenlabs_real_tts", muxReport.audioMode === "elevenlabs_real_tts");
  check("K-04: mux report notRealSpeech false", muxReport.notRealSpeech === false);
  check("K-05: mux report realTtsExecuted true", muxReport.realTtsExecuted === true);
  check("K-06: mux report ownerAcceptanceRequired true", muxReport.ownerAcceptanceRequired === true);
  check("K-07: mux report uploadReady false", muxReport.uploadReady === false);
  check("K-08: mux report uploadQueueReadinessGenerated false", muxReport.uploadQueueReadinessGenerated === false);
  check("K-09: mux report isFinalUploadReadyVideo false", muxReport.isFinalUploadReadyVideo === false);
  check("K-10: mux report elevenlabs.autoRetry false", muxReport.elevenlabs?.autoRetry === false);
  check("K-11: mux report elevenlabs.hardTrimApplied false", muxReport.elevenlabs?.hardTrimApplied === false);
  check("K-12: mux report elevenlabs.normalizeMethod atempo", muxReport.elevenlabs?.normalizeMethod === "atempo");
  check("K-13: mux report voiceIdMasked masked", isStr(muxReport.elevenlabs?.voiceIdMasked) && muxReport.elevenlabs.voiceIdMasked.includes("***"));
  check("K-14: mux probe video h264", muxReport.probe?.videoCodec === "h264");
  check("K-15: mux probe audio aac", muxReport.probe?.audioCodec === "aac");
  check("K-16: mux probe 1080x1920", muxReport.probe?.width === 1080 && muxReport.probe?.height === 1920);
  check("K-17: mux probe fps ~30", Math.abs((muxReport.probe?.fps ?? 0) - 30) <= 0.5);
  check("K-18: mux probe duration 30±0.5", Math.abs((muxReport.probe?.durationSec ?? 0) - 30) <= 0.5);
  check("K-19: mux probe audio present", muxReport.probe?.audioPresent === true);
  check("K-20: mux probe av gap <= 0.2", isNum(muxReport.probe?.avGapSec) && muxReport.probe.avGapSec <= 0.2);
  check("K-21: mux report muxedMp4Path under C:\\tmp", /^C:\\+tmp\\+/i.test(muxReport.muxedMp4Path ?? ""));
  check("K-22: mux report muxedMp4Path not accepted final mux", !/premium-editorial-selected-image-visual-only-v1-tts-mux\.mp4$/.test(muxReport.muxedMp4Path ?? ""));
} else {
  check("K-00: mux report not produced (runner not run) — informational", true, "run the v2 runner to populate §K");
}

// ── § L. output paths under C:\tmp ───────────────────────────────────────────
const op = v2.outputPaths ?? {};
check("L-01: outDir under C:\\tmp", /^C:\\+tmp\\+/i.test(op.outDir ?? ""));
check("L-02: muxedMp4 under C:\\tmp", /^C:\\+tmp\\+/i.test(op.muxedMp4 ?? ""));
check("L-03: muxReport under C:\\tmp", /^C:\\+tmp\\+/i.test(op.muxReport ?? ""));
check("L-04: ttsScriptJson under C:\\tmp", /^C:\\+tmp\\+/i.test(op.ttsScriptJson ?? ""));
check("L-05: ttsSummaryJson under C:\\tmp", /^C:\\+tmp\\+/i.test(op.ttsSummaryJson ?? ""));
check("L-06: outDir is the elevenlabs-v2 dir", /creative-voice-sound-mux-elevenlabs-v2-first-run/.test(op.outDir ?? ""));
check("L-07: outDir not inside repo output/ dir", !/instagram-auto[\\/]output/i.test(op.outDir ?? ""));

// ── § M. no credential / forbidden-file refs ─────────────────────────────────
for (const [label, raw] of [["v2manifest", v2Raw], ["mbuilder", mbuilderText], ["tbuilder", tbuilderText], ["runner", runnerText]]) {
  check(`M-01:${label}: no access_token`, !/access_?token/i.test(raw));
  check(`M-02:${label}: no refresh_token`, !/refresh_?token/i.test(raw));
  check(`M-03:${label}: no hardcoded api_key value`, !/api_?key\s*[:=]\s*["'][A-Za-z0-9]{8,}/i.test(raw));
  check(`M-04:${label}: no codex transfer doc ref`, !raw.includes(CTX_TRANSFER_TOKEN));
  check(`M-05:${label}: no diag output file ref`, !raw.includes(PIQ_TOKEN));
}
check("M-06: guard does not reference codex transfer doc", !selfText.includes(CTX_TRANSFER_TOKEN));
check("M-07: guard does not reference diag output file", !selfText.includes(PIQ_TOKEN));
const guardImports = (selfText.match(/^import\s+.*?from\s+["']([^"']+)["']/gm) || []).map((l) => (l.match(/from\s+["']([^"']+)["']/) || [])[1]);
const ALLOWED = new Set(["node:fs", "node:url", "node:path"]);
check("M-08: guard imports only node:fs/url/path", guardImports.length > 0 && guardImports.every((m) => ALLOWED.has(m)), `imports=${guardImports.join(",")}`);

// ── § N. per-scene TTS deep audit ────────────────────────────────────────────
(ts.scenes ?? []).forEach((sc, i) => {
  const tag = `scene${sc.sceneNumber ?? i + 1}`;
  check(`N-${tag}-01: durationSec > 0`, isNum(sc.durationSec) && sc.durationSec > 0);
  check(`N-${tag}-02: ttsText non-empty`, isStr(sc.ttsText));
  check(`N-${tag}-03: sceneRole present`, isStr(sc.sceneRole));
});

// ── result ────────────────────────────────────────────────────────────────────
const pass = results.filter((r) => r.pass);
const fail = results.filter((r) => !r.pass);
console.log(`\n══════════════════════════════════════════════════════════`);
console.log(`  CREATIVE VOICE+SOUND MUX ELEVENLABS v2 — STRUCTURE/SAFETY GUARD`);
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
  console.log(`GUARD OK: elevenlabs v2 voice+sound mux structure/safety intact (${pass.length}/${results.length}).`);
  process.exit(0);
}
