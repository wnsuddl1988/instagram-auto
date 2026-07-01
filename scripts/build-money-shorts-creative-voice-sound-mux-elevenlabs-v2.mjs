#!/usr/bin/env node
// ──────────────────────────────────────────────────────────────────────────
// build-money-shorts-creative-voice-sound-mux-elevenlabs-v2.mjs
//
// MONEY SHORTS OS — CREATIVE VOICE+SOUND MUX ELEVENLABS MANIFEST BUILDER v2 (data-only)
//
// v1 local_mock mux manifest를 source로 소비해, real ElevenLabs first-run용 v2 manifest +
// scene-paced TTS script package를 생성한다. 이 builder는 데이터만 만든다 —
// ElevenLabs/ffmpeg/mux를 실행하지 않는다.
//
// v1 대비 차이:
//   - audioMode: local_mock → elevenlabs_real_tts
//   - notRealSpeech: true → false
//   - realTtsExecuted: false (builder는 실행 안 함; runner가 true로 확정)
//   - normalizeMethod: (v1 없음) → atempo (tail-preserving; -t hard trim 금지)
//   - TTS script scene 스키마를 scene-paced helper 호환 형태로 변환
//       (sceneIndex → sceneNumber, text → ttsText, sceneRole 추가)
//
// upload 경계는 v1과 동일하게 유지:
//   uploadReady=false, ownerAcceptanceRequired=true, uploadQueueReadinessGenerated=false,
//   isFinalUploadReadyVideo=false.
//
// 외부 API/LLM/network/env/secret 접근 없음. Math.random 미사용.
// ──────────────────────────────────────────────────────────────────────────

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const F = (name) => join(__dirname, "fixtures", name);
const V1_MANIFEST_PATH = F("money-shorts-creative-voice-sound-mux-manifest.v1.json");
const OUTPUT_PATH = F("money-shorts-creative-voice-sound-mux-manifest.elevenlabs-v2.json");

const OUT_DIR = "C:\\tmp\\money-shorts-os\\creative-voice-sound-mux-elevenlabs-v2-first-run";

const round2 = (n) => Math.round(n * 100) / 100;

// ── source of truth: v1 local_mock manifest (read-only) ──────────────────────
const v1 = JSON.parse(readFileSync(V1_MANIFEST_PATH, "utf8"));

// v1 must itself be in the expected pre-mux state before we build a real-TTS variant.
if (v1.schemaVersion !== "money_shorts_creative_voice_sound_mux_manifest_v1") {
  console.error("ABORT: v1 manifest schemaVersion unexpected.");
  process.exit(1);
}
if (v1.hardFailReasonCount !== 0) {
  console.error("ABORT: v1 manifest reports hard fail; real TTS mux forbidden.");
  process.exit(1);
}
if (v1.uploadReady !== false || v1.ownerAcceptanceRequired !== true) {
  console.error("ABORT: v1 manifest is not in the expected pre-upload state.");
  process.exit(1);
}

const selectedTopicId = v1.selectedTopicId;
const selectedCandidateId = v1.selectedCandidateId;
if (selectedCandidateId !== "base-rate-hold-202605-cand-1") {
  console.error(`ABORT: unexpected selected candidate (${selectedCandidateId}); expected base-rate-hold-202605-cand-1.`);
  process.exit(1);
}

const targetDurationSec = v1.targetDurationSec;

// ── scene-paced TTS script package (helper-compatible schema) ────────────────
// scene-paced helper expects scenes: [{ sceneNumber, durationSec, ttsText, sceneRole }].
// v1 ttsScript.scenes uses { sceneIndex, sourceImage, text, durationSec } — convert here.
// Scene durations are preserved verbatim from v1 (planner-derived 30s windows).
const SCENE_ROLES = {
  1: "hook",
  2: "problem",
  3: "point_1",
  4: "point_2",
  5: "point_3",
  6: "twist_and_action",
};

const v1Scenes = v1.ttsScript.scenes;
const ttsScenes = v1Scenes.map((sc) => ({
  sceneNumber: sc.sceneIndex,
  sceneRole: SCENE_ROLES[sc.sceneIndex] ?? "unknown",
  sourceImage: sc.sourceImage,
  ttsText: sc.text,
  durationSec: sc.durationSec,
}));
const sceneTotalDurationSec = round2(ttsScenes.reduce((s, sc) => s + sc.durationSec, 0));

const ttsScriptId = `tts-script-creative-${selectedTopicId}-elevenlabs-v2`;
const ttsScriptPackage = {
  schemaVersion: "money_shorts_creative_tts_script_elevenlabs_v2",
  scriptId: ttsScriptId,
  manifestId: selectedCandidateId,
  ttsMode: "elevenlabs_real_tts",
  audioMode: "elevenlabs_real_tts",
  notRealSpeech: false,
  provider: "elevenlabs",
  targetDurationSec,
  fullVoiceover: v1.ttsScript.fullVoiceover,
  voiceCandidateId: "yohan_koo",
  voicePreset: "confident_v3",
  scenes: ttsScenes,
  sceneTotalDurationSec,
  riskNotes: [
    "real ElevenLabs TTS: scene별 1회 호출(max 6), 자동 재시도 금지, voice list endpoint 금지.",
    "TTS text is derived from the Creative Layer selected candidate full_voiceover — 문구 자동 수정/압축 루프 금지.",
    "normalize는 atempo(tail-preserving)만 사용; raw>target 시 -t hard trim 금지.",
  ],
};

// ── audio timeline / normalize policy (atempo tail-preserving) ───────────────
const audioTimelinePolicy = {
  fitStrategy: "scene_paced_to_planner_windows",
  targetDurationSec,
  sceneTotalDurationSec,
  normalizeMethod: "atempo",
  tailHardTrimForbidden: true,
  excessiveSilenceForbidden: true,
  atempoRatioAbortThreshold: 1.25,
  note: "scene별 raw>target이면 atempo=ratio(=raw/target)로 tail-preserving normalize. ratio가 1.25 초과면 abort/warning으로 보고하고 멈춘다. raw<target이면 apad로 무음 패딩.",
};

// ── sound / sfx policy (deferred, same as v1) ────────────────────────────────
const soundPolicy = {
  sfxPlanned: v1.soundPolicy?.sfxPlanned ?? true,
  sfxPlannedCount: v1.soundPolicy?.sfxPlannedCount ?? 0,
  sfxRendered: false,
  sfxRenderDeferredReason: "v2 real-TTS first run has no approved local SFX asset library; fabricating or downloading SFX is forbidden. SFX render deferred to a later approved step. Voice mux proceeds without SFX.",
  fabricatedSfxForbidden: true,
  externalSfxDownloadForbidden: true,
};

// ── manifest ──────────────────────────────────────────────────────────────────
const manifest = {
  schemaVersion: "money_shorts_creative_voice_sound_mux_manifest_elevenlabs_v2",
  status: "data_only_elevenlabs_voice_sound_mux_manifest",
  audioMode: "elevenlabs_real_tts",
  notRealSpeech: false,
  realTtsExecuted: false,
  ownerAcceptanceRequired: true,
  uploadReady: false,
  uploadQueueReadinessGenerated: false,
  isFinalUploadReadyVideo: false,
  realTtsProvider: "elevenlabs",
  sourceRefs: {
    v1MuxManifest: "scripts/fixtures/money-shorts-creative-voice-sound-mux-manifest.v1.json",
    visualRenderReport: v1.sourceRefs.visualRenderReport,
    visualMp4: v1.sourceRefs.visualMp4,
  },
  selectedTopicId,
  selectedCandidateId,
  qualityScorerDecision: v1.qualityScorerDecision,
  hardFailReasonCount: v1.hardFailReasonCount,
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
  elevenlabsPolicy: {
    apiCallBudgetMax: 6,
    perSceneMaxCalls: 1,
    autoRetryForbidden: true,
    voiceListEndpointForbidden: true,
    voiceExperimentForbidden: true,
    scriptRewriteLoopForbidden: true,
    allowedEnvKeys: ["ELEVENLABS_API_KEY", "ELEVENLABS_YOHAN_KOO_VOICE_ID", "ELEVENLABS_VOICE_ID"],
    secretRawOutputForbidden: true,
  },
  outputPaths: {
    outDir: OUT_DIR,
    ttsScriptJson: join(OUT_DIR, "creative-tts-script.elevenlabs-v2.json"),
    ttsSummaryJson: join(OUT_DIR, "elevenlabs-scene-paced-tts-summary.json"),
    muxedMp4: join(OUT_DIR, "money-shorts-creative-final-visual-youtube-safe-frame-v1-tts-mux.mp4"),
    muxReport: join(OUT_DIR, "creative-voice-sound-mux-elevenlabs-v2-report.json"),
  },
  reuseHelpers: {
    ttsBuilder: "scripts/build-money-shorts-creative-voice-sound-mux-elevenlabs-v2-tts.mjs",
    muxRunner: "scripts/mux-local-tts-audio-into-visual-mp4.mjs",
    note: "v2 atempo TTS builder(신규)로 real TTS timeline 생성 후, 기존 검증된 mux helper를 read-only 재사용해 mux한다. mux helper는 money_shorts_elevenlabs_scene_paced_tts_summary_v1 스키마를 이미 지원한다.",
  },
  boundary: {
    audioMode: "elevenlabs_real_tts",
    notRealSpeech: false,
    realTts: true,
    noAutoRetry: true,
    noVoiceExperiment: true,
    noVoiceListEndpoint: true,
    noScriptRewriteLoop: true,
    noTailHardTrim: true,
    noUploadOrPublish: true,
    noDeploy: true,
    noUploadQueueReadiness: true,
    noExistingFinalVideoOverwrite: true,
    noSecretRawOutput: true,
    dataOnlyManifest: true,
  },
  riskNotes: [
    "real ElevenLabs TTS (유료). scene별 1회, max 6 calls, 자동 재시도 금지.",
    "notRealSpeech=false, realTtsExecuted는 runner가 실제 호출 후 true로 확정.",
    "ownerAcceptanceRequired=true, uploadReady=false, uploadQueueReadinessGenerated=false — Owner 청취/시청 전 최종 확정 아님.",
    "normalize는 atempo tail-preserving만; ratio>1.25면 abort/warning.",
    "SFX 미렌더(sfxRendered=false); 가짜 SFX/외부 다운로드 금지.",
    "기존 accepted final mux mp4 / YouTube / Instagram 게시물 미변경. secret 원문 출력 금지.",
  ],
};

writeFileSync(OUTPUT_PATH, JSON.stringify(manifest, null, 2) + "\n", "utf8");

console.log("── CREATIVE VOICE+SOUND MUX ELEVENLABS MANIFEST v2 (data-only) ──");
console.log(`  selected: ${selectedTopicId} / ${selectedCandidateId}`);
console.log(`  audioMode=elevenlabs_real_tts notRealSpeech=false realTtsExecuted=false(runner sets true)`);
console.log(`  ownerAcceptanceRequired=true uploadReady=false uploadQueueReadinessGenerated=false`);
console.log(`  tts scenes: ${ttsScenes.length}, sceneTotal=${sceneTotalDurationSec}s, target=${targetDurationSec}s`);
console.log(`  normalizeMethod=atempo atempoRatioAbortThreshold=1.25 (no -t hard trim)`);
console.log(`  voiceCandidate=yohan_koo preset=confident_v3`);
console.log(`  out-dir: ${OUT_DIR}`);
console.log(`  manifest written: ${OUTPUT_PATH}`);
process.exit(0);
