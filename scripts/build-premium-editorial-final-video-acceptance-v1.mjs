#!/usr/bin/env node
// ──────────────────────────────────────────────────────────────────────────
// build-premium-editorial-final-video-acceptance-v1.mjs
//
// FINAL VIDEO ACCEPTANCE MANIFEST — DATA-ONLY (no render, no mux, no upload)
//
// Owner가 tailfit v3.1 mp4를 최종 후보로 승인했다. 이 빌더는 그 산출물을
// data-only manifest로 고정한다. ffprobe로 실제 mp4를 재검증하고,
// selected image set / caption v3 manifest / TTS v3.1 tailfit summary를
// 참조로 묶어 asset provenance를 기록한다.
//
// 이 빌더는 이미지/TTS/캡션/렌더/업로드를 절대 실행하지 않는다.
// ffprobe(읽기 전용 조회)만 spawnSync로 호출한다.
//
// source:
//   1) C:\tmp\...\selected-image-elevenlabs-tts-mux-voice-caption-v3-1-tailfit\
//      premium-editorial-selected-image-visual-only-v1-tts-mux.mp4 (accepted candidate)
//   2) ...\tts-mux-summary.json (mux summary)
//   3) ...\elevenlabs-scene-paced-tts-summary.json (tailfit TTS summary)
//   4) scripts/fixtures/premium-editorial-scene-selected-image-set.v1.json (selected image provenance)
//   5) scripts/fixtures/premium-editorial-selected-image-render-manifest.caption-v3.json (caption v3 provenance)
// output:
//   scripts/fixtures/premium-editorial-final-video-acceptance.v1.json
// ──────────────────────────────────────────────────────────────────────────

import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..");

const ACCEPTED_CANDIDATE_PATH = "C:\\tmp\\money-shorts-os\\selected-image-elevenlabs-tts-mux-voice-caption-v3-1-tailfit\\premium-editorial-selected-image-visual-only-v1-tts-mux.mp4";
const MUX_SUMMARY_PATH = "C:\\tmp\\money-shorts-os\\selected-image-elevenlabs-tts-mux-voice-caption-v3-1-tailfit\\tts-mux-summary.json";
const TAILFIT_TTS_SUMMARY_PATH = "C:\\tmp\\money-shorts-os\\selected-image-elevenlabs-scene-paced-tts-voice-v3-1-tailfit\\elevenlabs-scene-paced-tts-summary.json";
const SELECTED_IMAGE_SET_PATH = join(REPO_ROOT, "scripts", "fixtures", "premium-editorial-scene-selected-image-set.v1.json");
const CAPTION_V3_MANIFEST_PATH = join(REPO_ROOT, "scripts", "fixtures", "premium-editorial-selected-image-render-manifest.caption-v3.json");
const OUTPUT_PATH = join(REPO_ROOT, "scripts", "fixtures", "premium-editorial-final-video-acceptance.v1.json");

// 이 manifest가 참조하는 관련 commit hash (git 히스토리 조회로 채워진 값; hardcode된 과거 기록).
const SOURCE_COMMIT_REFS = {
  ttsCaptionV3TailfitPatch: "866db10",
  ttsVoiceCaptionV2: "728ed25",
  visualRenderSelectedImage: "42abaf6",
  selectedSceneImageSetManifest: "73ed8a0",
};

console.log(`\n[final-acceptance] accepted candidate: ${ACCEPTED_CANDIDATE_PATH}`);

// ── 필수 입력 존재 확인 (data-only 조회) ─────────────────────────────────────
if (!existsSync(ACCEPTED_CANDIDATE_PATH)) {
  console.error(`FATAL: accepted candidate mp4가 존재하지 않음: ${ACCEPTED_CANDIDATE_PATH}`);
  process.exit(2);
}
if (!existsSync(MUX_SUMMARY_PATH)) {
  console.error(`FATAL: mux summary가 존재하지 않음: ${MUX_SUMMARY_PATH}`);
  process.exit(2);
}
if (!existsSync(TAILFIT_TTS_SUMMARY_PATH)) {
  console.error(`FATAL: tailfit TTS summary가 존재하지 않음: ${TAILFIT_TTS_SUMMARY_PATH}`);
  process.exit(2);
}

// ── ffprobe로 최종 mp4 재검증 (읽기 전용) ────────────────────────────────────
console.log("[step 1/3] ffprobe로 accepted candidate 재검증...");
const probeResult = spawnSync("ffprobe", [
  "-v", "quiet", "-print_format", "json", "-show_format", "-show_streams", ACCEPTED_CANDIDATE_PATH,
], { encoding: "utf-8", maxBuffer: 2 * 1024 * 1024, shell: false });

if ((probeResult.status ?? -1) !== 0) {
  console.error(`FATAL: ffprobe 실패 (exit ${probeResult.status})`);
  if (probeResult.stderr) console.error(probeResult.stderr.slice(-300));
  process.exit(2);
}
let probe;
try {
  probe = JSON.parse(probeResult.stdout);
} catch (e) {
  console.error(`FATAL: ffprobe 출력 파싱 실패: ${e.message}`);
  process.exit(2);
}

const fmt = probe.format ?? {};
const streams = probe.streams ?? [];
const videoStream = streams.find((s) => s.codec_type === "video");
const audioStreams = streams.filter((s) => s.codec_type === "audio");

const durationSec = parseFloat(fmt.duration ?? "0");
const videoDurationSec = parseFloat(videoStream?.duration ?? fmt.duration ?? "0");
const audioDurationSec = parseFloat(audioStreams[0]?.duration ?? fmt.duration ?? "0");
const avGapSec = parseFloat(Math.abs(videoDurationSec - audioDurationSec).toFixed(3));
const fileSizeBytes = parseInt(fmt.size ?? "0", 10);
const fpsRaw = videoStream?.r_frame_rate ?? "0/1";
const [fpsNum, fpsDen] = fpsRaw.split("/").map(Number);
const fps = fpsDen ? Math.round(fpsNum / fpsDen) : 0;

const mediaProbe = {
  containerFormat: fmt.format_name ?? "unknown",
  videoCodec: videoStream?.codec_name ?? "unknown",
  widthPx: videoStream?.width ?? 0,
  heightPx: videoStream?.height ?? 0,
  fps,
  audioCodec: audioStreams[0]?.codec_name ?? "none",
  audioSampleRateHz: audioStreams[0]?.sample_rate ? parseInt(audioStreams[0].sample_rate, 10) : null,
  audioChannels: audioStreams[0]?.channels ?? null,
  audioStreamCount: audioStreams.length,
  durationSec,
  videoDurationSec,
  audioDurationSec,
  avGapSec,
  fileSizeBytes,
};

console.log(`  container: ${mediaProbe.containerFormat}`);
console.log(`  video: ${mediaProbe.videoCodec} ${mediaProbe.widthPx}x${mediaProbe.heightPx} @${mediaProbe.fps}fps`);
console.log(`  audio: ${mediaProbe.audioCodec} ${mediaProbe.audioSampleRateHz}Hz ch=${mediaProbe.audioChannels}`);
console.log(`  duration: ${mediaProbe.durationSec}s, av gap: ${mediaProbe.avGapSec}s`);
console.log(`  size: ${Math.round(fileSizeBytes / 1024)}KB\n`);

const mediaProbeChecks = [
  ["format is mp4", mediaProbe.containerFormat.includes("mp4")],
  ["video codec h264", mediaProbe.videoCodec === "h264"],
  ["width 1080", mediaProbe.widthPx === 1080],
  ["height 1920", mediaProbe.heightPx === 1920],
  ["fps 30", mediaProbe.fps === 30],
  ["audio codec aac", mediaProbe.audioCodec === "aac"],
  ["audio stream count >= 1", mediaProbe.audioStreamCount >= 1],
  ["duration 30s ± 0.5s", Math.abs(mediaProbe.durationSec - 30) <= 0.5],
  ["av gap <= 0.05s", mediaProbe.avGapSec <= 0.05],
];
let allProbePass = true;
console.log("[step 2/3] mediaProbe 기준 확인...");
for (const [label, ok] of mediaProbeChecks) {
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}`);
  if (!ok) allProbePass = false;
}
if (!allProbePass) {
  console.error("\nFATAL: mediaProbe 기준 미달 — acceptance manifest를 작성하지 않음.");
  process.exit(2);
}
console.log();

// ── 소스 provenance 로드 (읽기 전용) ─────────────────────────────────────────
console.log("[step 3/3] provenance 소스 로드 및 manifest 조립...");
const muxSummary = JSON.parse(readFileSync(MUX_SUMMARY_PATH, "utf-8"));
const tailfitTtsSummary = JSON.parse(readFileSync(TAILFIT_TTS_SUMMARY_PATH, "utf-8"));
const selectedImageSet = JSON.parse(readFileSync(SELECTED_IMAGE_SET_PATH, "utf-8"));
const captionV3Manifest = JSON.parse(readFileSync(CAPTION_V3_MANIFEST_PATH, "utf-8"));

if (selectedImageSet.schemaVersion !== "money_shorts_scene_selected_image_set_v1") {
  console.error(`FATAL: selected image set schemaVersion 불일치 — ${selectedImageSet.schemaVersion}`);
  process.exit(2);
}
if (captionV3Manifest.schemaVersion !== "money_shorts_selected_image_render_manifest_v1") {
  console.error(`FATAL: caption v3 manifest schemaVersion 불일치 — ${captionV3Manifest.schemaVersion}`);
  process.exit(2);
}
if (tailfitTtsSummary.apiCallCountThisRun !== 0 || tailfitTtsSummary.noLiveTailPreservingRun !== true) {
  console.error("FATAL: tailfit TTS summary가 no-live(apiCallCountThisRun=0) 조건을 만족하지 않음.");
  process.exit(2);
}

const acceptanceManifest = {
  schemaVersion: "money_shorts_final_video_acceptance_v1",
  status: "data_only_final_acceptance_record",
  title: "Money Shorts OS — Final Video Acceptance (Voice+Caption v3.1 Tailfit)",
  purpose: "Owner가 승인한 tailfit v3.1 mp4를 최종 accepted candidate로 고정하는 data-only record. 렌더/이미지/TTS/자막을 재생성하지 않으며, 업로드도 수행하지 않는다.",

  acceptedCandidatePath: ACCEPTED_CANDIDATE_PATH,
  acceptedByOwner: true,
  acceptedVariant: "voice_caption_v3_1_tailfit",
  acceptedAt: new Date().toISOString(),

  sourceCommitRefs: SOURCE_COMMIT_REFS,

  mediaProbe,

  noFurtherChangesPolicy: {
    imageRegenerationAllowed: false,
    ttsRegenerationAllowed: false,
    captionRestylingAllowed: false,
    renderRebuildAllowed: false,
    renderRebuildAllowedNote: "Owner가 명시적으로 품질 재검토를 재개하지 않는 한 렌더 재실행 금지.",
  },

  uploadBoundary: {
    uploadExecuted: false,
    publishExecuted: false,
    requiresOwnerUploadApproval: true,
  },

  assetProvenance: {
    selectedImageSet: {
      path: "scripts/fixtures/premium-editorial-scene-selected-image-set.v1.json",
      schemaVersion: selectedImageSet.schemaVersion,
      sceneCount: (selectedImageSet.selectedScenes || []).length,
    },
    captionV3: {
      path: "scripts/fixtures/premium-editorial-selected-image-render-manifest.caption-v3.json",
      schemaVersion: captionV3Manifest.schemaVersion,
      captionFontSize: captionV3Manifest.outputSpec?.captionFontSize ?? null,
      captionOutline: captionV3Manifest.outputSpec?.captionOutline ?? null,
      captionShadow: captionV3Manifest.outputSpec?.captionShadow ?? null,
    },
    ttsV31Tailfit: {
      summaryPath: TAILFIT_TTS_SUMMARY_PATH,
      scriptId: tailfitTtsSummary.scriptId,
      mode: tailfitTtsSummary.mode,
      apiCallCountThisRun: tailfitTtsSummary.apiCallCountThisRun,
      noLiveTailPreservingRun: tailfitTtsSummary.noLiveTailPreservingRun,
      note: "이번(tailfit) run의 실제 ElevenLabs 호출 수는 0. Scene 4/6 raw audio는 이전 승인된 v3.1 live ElevenLabs 생성물을 재사용해 atempo tempo-fit만 적용.",
    },
    muxSummary: {
      path: MUX_SUMMARY_PATH,
      scriptId: muxSummary.scriptId,
      manifestId: muxSummary.manifestId,
      mode: muxSummary.mode,
    },
  },

  qualityAcceptance: {
    ownerListeningReviewCompleted: true,
    ownerVisualReviewCompleted: true,
    qualityAcceptedForFinalCandidate: true,
    note: "Owner가 tailfit v3.1 mp4를 청취/시청 후 최종 후보로 승인함 (voice_caption_v3_1_review_required 상태 해제).",
  },

  riskNotes: [
    ...(muxSummary.riskNotes ?? []),
    "no upload/publish performed by this manifest — data-only acceptance record.",
    "final render rebuild disallowed unless Owner explicitly reopens quality review.",
  ],
};

writeFileSync(OUTPUT_PATH, JSON.stringify(acceptanceManifest, null, 2) + "\n", "utf-8");

console.log(`\n✅ Final video acceptance manifest written: ${OUTPUT_PATH}`);
console.log(`   acceptedCandidatePath: ${ACCEPTED_CANDIDATE_PATH}`);
console.log(`   acceptedVariant: voice_caption_v3_1_tailfit`);
console.log(`   mediaProbe: ${mediaProbe.videoCodec} ${mediaProbe.widthPx}x${mediaProbe.heightPx}@${mediaProbe.fps}fps, ${mediaProbe.audioCodec}, ${mediaProbe.durationSec}s, avGap=${mediaProbe.avGapSec}s`);
console.log(`   uploadExecuted: false, publishExecuted: false, requiresOwnerUploadApproval: true`);
