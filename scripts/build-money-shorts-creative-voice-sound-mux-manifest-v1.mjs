#!/usr/bin/env node
// ──────────────────────────────────────────────────────────────────────────
// build-money-shorts-creative-voice-sound-mux-manifest-v1.mjs
//
// MONEY SHORTS OS — CREATIVE VOICE+SOUND MUX MANIFEST BUILDER v1 (data-only)
//
// Creative Layer selected candidate의 voiceover + scene/event timing을 소비해,
// visual-only mp4에 붙일 TTS script package(scene-paced, 30s fit) + mux manifest를
// 생성한다. 이 builder는 데이터만 만든다 — ffmpeg/TTS/mux를 실행하지 않는다.
//
// 이 단계는 upload queue readiness 직전이지만 Owner 청취 전이므로
// uploadReady=false, ownerAcceptanceRequired=true, realTtsRequiredBeforeUpload=true.
// TTS는 local_mock(placeholder, notRealSpeech=true) — 최종 음성 아님.
//
// 외부 API/LLM/network/env/secret 접근 없음. Math.random 미사용.
// ──────────────────────────────────────────────────────────────────────────

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const F = (name) => join(__dirname, "fixtures", name);
const SCRIPT_PATH = F("money-shorts-retention-script-compiler.output.v1.json");
const PLANNER_PATH = F("money-shorts-scene-event-planner.output.v1.json");
const SCORER_PATH = F("money-shorts-quality-scorer.output.v1.json");
const VISUAL_MANIFEST_PATH = F("money-shorts-creative-final-visual-render-manifest.v1.json");
const OUTPUT_PATH = F("money-shorts-creative-voice-sound-mux-manifest.v1.json");

const VISUAL_REPORT_PATH = "C:\\tmp\\money-shorts-os\\creative-final-visual-render-v1\\creative-final-visual-render-report.json";
const VISUAL_MP4_PATH = "C:\\tmp\\money-shorts-os\\creative-final-visual-render-v1\\money-shorts-creative-final-visual-youtube-safe-frame-v1.mp4";
const OUT_DIR = "C:\\tmp\\money-shorts-os\\creative-voice-sound-mux-v1";

// ── source of truth load (read-only) ─────────────────────────────────────────
const scriptOut = JSON.parse(readFileSync(SCRIPT_PATH, "utf8"));
const plannerOut = JSON.parse(readFileSync(PLANNER_PATH, "utf8"));
const scorerOut = JSON.parse(readFileSync(SCORER_PATH, "utf8"));
const visualManifest = JSON.parse(readFileSync(VISUAL_MANIFEST_PATH, "utf8"));

// visual render report is a C:\tmp artifact; read read-only if present (used for cross-checks)
let visualReport = null;
try {
  visualReport = JSON.parse(readFileSync(VISUAL_REPORT_PATH, "utf8"));
} catch {
  visualReport = null;
}

const round2 = (n) => Math.round(n * 100) / 100;

// ── select render-ready candidate (must match visual manifest + scorer) ──────
const scorerTopic = scorerOut.topics.find((t) => t.qualityReport.final_decision === "render" || t.qualityReport.final_decision === "render_best_candidate");
if (!scorerTopic) {
  console.error("ABORT: no render / render_best_candidate topic in quality scorer output.");
  process.exit(1);
}
if (scorerTopic.qualityReport.hard_fail_reasons.length > 0) {
  console.error("ABORT: selected topic has hard_fail_reasons; mux forbidden.");
  process.exit(1);
}
const selectedTopicId = scorerTopic.topicId;
const selectedCandidateId = scorerTopic.selectedCandidate.candidateId;

// cross-check against visual manifest
if (visualManifest.selectedCandidateId !== selectedCandidateId) {
  console.error(`ABORT: visual manifest candidate (${visualManifest.selectedCandidateId}) != scorer selected candidate (${selectedCandidateId}).`);
  process.exit(1);
}
// visual report must require TTS/mux and not be upload-ready
if (visualReport && (visualReport.uploadReady !== false || visualReport.requiresTtsSoundMuxBeforeUpload !== true)) {
  console.error("ABORT: visual render report is not in the expected pre-mux state (uploadReady must be false, requiresTtsSoundMuxBeforeUpload must be true).");
  process.exit(1);
}

// ── voiceover + scene timing ─────────────────────────────────────────────────
const scriptTopic = scriptOut.topics.find((t) => t.topicId === selectedTopicId);
const scriptCand = scriptTopic.candidates.find((c) => c.candidateId === scriptTopic.selectedCandidateId);
const fullVoiceover = scriptCand.script.full_voiceover;
const perSentence = scriptCand.voiceover_timing_metadata.per_sentence;
const targetDurationSec = scriptCand.script.target_duration; // 30

const plannerTopic = plannerOut.topics.find((t) => t.topicId === selectedTopicId);
// scene-level durations from planner: each scene's events sum to its window length.
const plannerScenes = plannerTopic.scenePlan.scenes.map((sc) => ({
  sceneIndex: sc.scene_index,
  sourceImage: sc.source_image,
  durationSec: round2(sc.events.reduce((s, e) => s + e.duration, 0)),
}));
const plannerTotalDuration = round2(plannerScenes.reduce((s, sc) => s + sc.durationSec, 0));

// ── TTS script package (scene-paced, aligned to 30s visual) ──────────────────
// Map the 7 voiceover sentences onto the 6 scenes: scene 6 carries twist+action
// (the last two sentences), scenes 1-5 carry one sentence each. Scene durations come
// from the planner (which already sums to 30s), so the audio timeline is 30s-fit.
const sentences = fullVoiceover.split(/(?<=[.?!])\s+/).filter((s) => s.trim().length);
// sentence → scene mapping (7 sentences → 6 scenes; scene 6 gets sentences 6 & 7)
const sentenceToScene = [1, 2, 3, 4, 5, 6, 6];
const sceneTexts = new Map();
sentences.forEach((sent, i) => {
  const sceneIdx = sentenceToScene[i] ?? plannerScenes.length;
  const prev = sceneTexts.get(sceneIdx) || "";
  sceneTexts.set(sceneIdx, prev ? `${prev} ${sent}` : sent);
});

const ttsScenes = plannerScenes.map((sc) => ({
  sceneIndex: sc.sceneIndex,
  sourceImage: sc.sourceImage,
  text: sceneTexts.get(sc.sceneIndex) || "",
  durationSec: sc.durationSec,
}));

const ttsScriptId = `tts-script-creative-${selectedTopicId}-local-mock-v1`;
const ttsScriptPackage = {
  schemaVersion: "money_shorts_creative_tts_script_v1",
  scriptId: ttsScriptId,
  manifestId: selectedCandidateId,
  ttsMode: "local_mock",
  audioMode: "local_mock",
  notRealSpeech: true,
  provider: "local_mock_lavfi_placeholder",
  targetDurationSec,
  fullVoiceover,
  perSentenceTimingRef: "money-shorts-retention-script-compiler.output.v1.json voiceover_timing_metadata",
  scenes: ttsScenes,
  sceneTotalDurationSec: round2(ttsScenes.reduce((s, sc) => s + sc.durationSec, 0)),
  riskNotes: [
    "local_mock: ffmpeg lavfi placeholder audio (NOT real speech). Final voice must be validated with ElevenLabs in a separate Owner-approved step.",
    "TTS text is derived from the Creative Layer selected candidate full_voiceover — not hand-written here.",
    "no tail hard trim: audio timeline is scene-paced to the planner's 30s windows.",
  ],
};

// ── audio timeline policy (tail-preserving, no hard trim / excessive silence) ─
const audioTimelinePolicy = {
  fitStrategy: "scene_paced_to_planner_windows",
  targetDurationSec,
  sceneTotalDurationSec: ttsScriptPackage.sceneTotalDurationSec,
  tailHardTrimForbidden: true,
  excessiveSilenceForbidden: true,
  atempoUsedForFit: false,
  atempoRatioAbortThreshold: 1.25,
  note: "scene 총합이 30s에 맞으므로 atempo 강제 압축 없이 mux한다. audio가 video보다 짧으면 mux runner가 apad로 무음 패딩(과도한 tail silence 아님).",
};

// ── sound / sfx policy (deferred in v1) ──────────────────────────────────────
const soundPolicy = {
  sfxPlanned: true,
  sfxPlannedCount: plannerTopic.soundPlan?.sfxCount ?? 0,
  sfxRendered: false,
  sfxRenderDeferredReason: "v1 has no real SFX asset library wired in; fabricating or downloading SFX is forbidden. SFX render deferred to a later approved step. Voice mux proceeds without SFX.",
  fabricatedSfxForbidden: true,
  externalSfxDownloadForbidden: true,
};

// ── manifest ──────────────────────────────────────────────────────────────────
const manifest = {
  schemaVersion: "money_shorts_creative_voice_sound_mux_manifest_v1",
  status: "data_only_voice_sound_mux_manifest",
  audioMode: "local_mock",
  notRealSpeech: true,
  ownerAcceptanceRequired: true,
  uploadReady: false,
  realTtsRequiredBeforeUpload: true,
  isFinalUploadReadyVideo: false,
  sourceRefs: {
    scriptCompilerOutput: "scripts/fixtures/money-shorts-retention-script-compiler.output.v1.json",
    sceneEventPlannerOutput: "scripts/fixtures/money-shorts-scene-event-planner.output.v1.json",
    qualityScorerOutput: "scripts/fixtures/money-shorts-quality-scorer.output.v1.json",
    creativeFinalVisualRenderManifest: "scripts/fixtures/money-shorts-creative-final-visual-render-manifest.v1.json",
    visualRenderReport: VISUAL_REPORT_PATH,
    visualMp4: VISUAL_MP4_PATH,
  },
  selectedTopicId,
  selectedCandidateId,
  qualityScorerDecision: scorerTopic.qualityReport.final_decision,
  hardFailReasonCount: scorerTopic.qualityReport.hard_fail_reasons.length,
  targetDurationSec,
  canvas: { widthPx: 1080, heightPx: 1920 },
  fps: 30,
  ttsScript: ttsScriptPackage,
  audioTimelinePolicy,
  soundPolicy,
  muxExpectations: {
    container: "mp4",
    videoCodec: "h264",
    audioCodec: "aac",
    widthPx: 1080,
    heightPx: 1920,
    fps: 30,
    durationToleranceSec: 0.5,
    maxAvGapSec: 0.2,
    audioPresent: true,
  },
  outputPaths: {
    outDir: OUT_DIR,
    ttsScriptJson: join(OUT_DIR, "creative-tts-script.local-mock.v1.json"),
    muxedMp4: join(OUT_DIR, "money-shorts-creative-final-youtube-safe-frame-tts-mux-v1.mp4"),
    muxReport: join(OUT_DIR, "creative-voice-sound-mux-report.json"),
  },
  reuseHelpers: {
    ttsBuilder: "scripts/build-local-mock-tts-audio-from-script.mjs",
    muxRunner: "scripts/mux-local-tts-audio-into-visual-mp4.mjs",
    note: "기존 검증된 local_mock TTS builder + mux helper를 read-only 재사용한다. source는 Creative Layer 산출물이다.",
  },
  boundary: {
    audioMode: "local_mock",
    notRealSpeech: true,
    noRealTts: true,
    noExternalApiCall: true,
    noUploadOrPublish: true,
    noDeploy: true,
    noExistingFinalVideoOverwrite: true,
    localFfmpegMuxOnly: true,
    dataOnlyManifest: true,
  },
  riskNotes: [
    "local_mock TTS placeholder audio — NOT real speech. realTtsRequiredBeforeUpload=true.",
    "ownerAcceptanceRequired=true, uploadReady=false — 최종 accepted/upload-ready 확정 아님.",
    "SFX는 이번 v1에서 렌더하지 않음(sfxRendered=false); deferred reason 기록. 가짜 SFX/외부 다운로드 금지.",
    "기존 accepted final mux mp4 / YouTube / Instagram 게시물은 수정하지 않는다.",
    "upload queue readiness는 이 단계에서 생성하지 않는다 — real TTS + Owner 승인 이후.",
  ],
};

writeFileSync(OUTPUT_PATH, JSON.stringify(manifest, null, 2) + "\n", "utf8");
// also write the TTS script json to the out-dir path so the mux runner can consume it directly
// (data-only: builder writes the script package; it does not run ffmpeg/tts).
// NOTE: out-dir write is deferred to the runner to keep this builder repo-only + data-only.

console.log("── CREATIVE VOICE+SOUND MUX MANIFEST v1 (data-only) ──");
console.log(`  selected: ${selectedTopicId} / ${selectedCandidateId} (decision=${scorerTopic.qualityReport.final_decision}, hardFail=${scorerTopic.qualityReport.hard_fail_reasons.length})`);
console.log(`  audioMode=local_mock notRealSpeech=true ownerAcceptanceRequired=true uploadReady=false realTtsRequiredBeforeUpload=true`);
console.log(`  tts scenes: ${ttsScenes.length}, sceneTotal=${ttsScriptPackage.sceneTotalDurationSec}s, target=${targetDurationSec}s`);
console.log(`  sfxPlanned=${soundPolicy.sfxPlanned} sfxRendered=${soundPolicy.sfxRendered} (deferred)`);
console.log(`  out-dir: ${OUT_DIR}`);
console.log(`  manifest written: ${OUTPUT_PATH}`);
process.exit(0);
