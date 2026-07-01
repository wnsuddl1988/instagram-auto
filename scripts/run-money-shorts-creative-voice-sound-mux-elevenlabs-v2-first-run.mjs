#!/usr/bin/env node
// ──────────────────────────────────────────────────────────────────────────
// run-money-shorts-creative-voice-sound-mux-elevenlabs-v2-first-run.mjs
//
// MONEY SHORTS OS — CREATIVE VOICE+SOUND MUX ELEVENLABS RUNNER v2 (real TTS, first run)
//
// v2 manifest를 읽어:
//   1) TTS script package(JSON)를 out-dir(C:\tmp)에 기록
//   2) v2 atempo TTS builder로 real ElevenLabs TTS 생성 (scene별 1회, max 6, no retry, atempo normalize)
//   3) 기존 검증된 mux helper로 visual-only mp4 + real TTS timeline을 mux
//   4) mux mp4를 ffprobe로 검증(h264/aac/1080x1920/30fps/30±0.5s/av-gap<=0.2s)
//   5) creative-voice-sound-mux-elevenlabs-v2-report.json 생성
//
// 유지 상태(불변): audioMode=elevenlabs_real_tts, notRealSpeech=false, realTtsExecuted=true,
//   ownerAcceptanceRequired=true, uploadReady=false, uploadQueueReadinessGenerated=false,
//   isFinalUploadReadyVideo=false.
//
// ffmpeg/ffprobe/node helper는 spawnSync(args array, shell:false)로만 실행.
// 절대 하지 않음: upload/publish/deploy, 이미지 재생성, OpenAI/ChatGPT/Playwright,
//   voice list endpoint, 자동 재시도, secret 원문 출력, 기존 accepted mux 덮어쓰기.
// out-dir은 C:\tmp 아래에만.
// ──────────────────────────────────────────────────────────────────────────

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const MANIFEST_PATH = join(__dirname, "fixtures", "money-shorts-creative-voice-sound-mux-manifest.elevenlabs-v2.json");

const manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));

// ── boundary guard: must be real-TTS, not upload-ready ───────────────────────
if (manifest.audioMode !== "elevenlabs_real_tts" || manifest.notRealSpeech !== false) {
  console.error("ABORT: manifest audioMode must be elevenlabs_real_tts and notRealSpeech must be false.");
  process.exit(2);
}
if (manifest.uploadReady !== false || manifest.ownerAcceptanceRequired !== true || manifest.uploadQueueReadinessGenerated !== false || manifest.isFinalUploadReadyVideo !== false) {
  console.error("ABORT: manifest must keep uploadReady=false, ownerAcceptanceRequired=true, uploadQueueReadinessGenerated=false, isFinalUploadReadyVideo=false.");
  process.exit(2);
}

const OUT_DIR = manifest.outputPaths.outDir;
const outAbs = resolve(OUT_DIR);
if (!/^C:\\+tmp\\+/i.test(OUT_DIR)) {
  console.error(`ABORT: out-dir must be under C:\\tmp. got: ${OUT_DIR}`);
  process.exit(2);
}
if (outAbs === REPO_ROOT || outAbs.startsWith(REPO_ROOT + "\\") || outAbs.startsWith(REPO_ROOT + "/")) {
  console.error("ABORT: out-dir must be OUTSIDE repo root.");
  process.exit(2);
}
mkdirSync(outAbs, { recursive: true });

// ── verify visual mp4 exists (do NOT overwrite the accepted final mux) ───────
const visualMp4 = manifest.sourceRefs.visualMp4;
if (!existsSync(visualMp4)) {
  console.error(`ABORT: visual-only mp4 missing: ${visualMp4}`);
  process.exit(3);
}
if (/premium-editorial-selected-image-visual-only-v1-tts-mux\.mp4/.test(manifest.outputPaths.muxedMp4)) {
  console.error("ABORT: refuse to write to the existing accepted final mux mp4 path.");
  process.exit(3);
}

// ── step 1: write TTS script package to out-dir ──────────────────────────────
const ttsScriptPath = manifest.outputPaths.ttsScriptJson;
writeFileSync(ttsScriptPath, JSON.stringify(manifest.ttsScript, null, 2) + "\n", "utf8");
console.log(`[step 1/4] TTS script written: ${ttsScriptPath}`);

// ── helper: run a node script via spawnSync (shell:false), no auto-retry ─────
function runNode(scriptRel, argv, label, allowExitCodes = [0]) {
  const abs = join(REPO_ROOT, scriptRel);
  if (!existsSync(abs)) { console.error(`ABORT: helper not found: ${scriptRel}`); process.exit(4); }
  const proc = spawnSync(process.execPath, [abs, ...argv], { cwd: REPO_ROOT, shell: false, encoding: "utf8", stdio: "inherit", timeout: 300000 });
  if (!allowExitCodes.includes(proc.status)) {
    console.error(`ABORT: ${label} failed (exit ${proc.status}). No retry.`);
    process.exit(4);
  }
  return proc;
}

// ── step 2: real ElevenLabs TTS via v2 atempo builder (scene-paced, max 6) ───
console.log("[step 2/4] Generating real ElevenLabs TTS (atempo normalize, scene-paced)...");
const ttsBuilder = manifest.reuseHelpers.ttsBuilder;
const threshold = String(manifest.audioTimelinePolicy.atempoRatioAbortThreshold ?? 1.25);
runNode(
  ttsBuilder,
  ["--tts-script", ttsScriptPath, "--out-dir", OUT_DIR, "--voice-candidate", manifest.ttsScript.voiceCandidateId ?? "yohan_koo", "--voice-preset", manifest.ttsScript.voicePreset ?? "default", "--atempo-abort-threshold", threshold],
  "ElevenLabs v2 atempo TTS builder"
);

const ttsSummaryPath = manifest.outputPaths.ttsSummaryJson;
if (!existsSync(ttsSummaryPath)) {
  console.error(`ABORT: TTS summary not produced: ${ttsSummaryPath}`);
  process.exit(4);
}
const ttsSummary = JSON.parse(readFileSync(ttsSummaryPath, "utf8"));
if (ttsSummary.readinessFailure === true || ttsSummary.liveApiCallPerformed !== true) {
  console.error("ABORT: ElevenLabs readiness failure or no live API call performed.");
  process.exit(4);
}
if (ttsSummary.hardTrimApplied === true) {
  console.error("ABORT: hard trim was applied — v2 requires atempo tail-preserving normalize only.");
  process.exit(4);
}

// ── step 3: mux visual mp4 + real TTS timeline via existing helper ───────────
console.log("[step 3/4] Muxing visual mp4 + real TTS timeline...");
runNode(
  manifest.reuseHelpers.muxRunner,
  ["--video", visualMp4, "--script", ttsScriptPath, "--out-dir", OUT_DIR, "--audio-summary", ttsSummaryPath],
  "mux helper"
);
const muxSummaryPath = join(outAbs, "tts-mux-summary.json");
if (!existsSync(muxSummaryPath)) {
  console.error(`ABORT: mux summary not produced: ${muxSummaryPath}`);
  process.exit(4);
}
const muxSummary = JSON.parse(readFileSync(muxSummaryPath, "utf8"));
const muxedMp4 = muxSummary.outputMp4Path;
if (!muxedMp4 || !existsSync(muxedMp4)) {
  console.error(`ABORT: muxed mp4 not produced: ${muxedMp4}`);
  process.exit(4);
}

// ── step 4: ffprobe verification ─────────────────────────────────────────────
console.log("[step 4/4] Verifying muxed mp4 with ffprobe...");
function ffprobe(path) {
  const r = spawnSync("ffprobe", ["-v", "error", "-show_entries", "stream=codec_type,codec_name,width,height,avg_frame_rate,duration", "-show_entries", "format=duration", "-of", "json", path], { shell: false, encoding: "utf8", timeout: 60000 });
  if (r.status !== 0) { console.error(`ABORT: ffprobe failed: ${r.stderr}`); process.exit(4); }
  return JSON.parse(r.stdout);
}
function fpsOf(afr) {
  if (!afr || afr === "0/0") return null;
  const [n, d] = afr.split("/").map(Number);
  return d ? Math.round((n / d) * 100) / 100 : null;
}
const probe = ffprobe(muxedMp4);
const vs = probe.streams.find((s) => s.codec_type === "video") || {};
const as = probe.streams.find((s) => s.codec_type === "audio") || {};
const containerDur = Math.round(parseFloat(probe.format.duration) * 100) / 100;
const vDur = parseFloat(vs.duration ?? probe.format.duration);
const aDur = parseFloat(as.duration ?? probe.format.duration);
const avGap = Math.round(Math.abs(vDur - aDur) * 1000) / 1000;

const target = manifest.targetDurationSec;
const tol = manifest.muxExpectations.durationToleranceSec;
const maxGap = manifest.muxExpectations.maxAvGapSec;

const checks = [
  ["video codec h264", vs.codec_name === "h264"],
  ["width 1080", vs.width === 1080],
  ["height 1920", vs.height === 1920],
  ["fps ~30", Math.abs((fpsOf(vs.avg_frame_rate) ?? 0) - 30) <= 0.5],
  [`duration ${target}s ± ${tol}s`, containerDur >= target - tol && containerDur <= target + tol],
  ["audio present", !!as.codec_name],
  ["audio codec aac", as.codec_name === "aac"],
  [`av gap <= ${maxGap}s`, avGap <= maxGap],
];
let allPass = true;
for (const [label, ok] of checks) {
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${label}`);
  if (!ok) allPass = false;
}
if (!allPass) { console.error("ABORT: mux ffprobe validation FAILED."); process.exit(5); }

// ── report ────────────────────────────────────────────────────────────────────
const report = {
  schemaVersion: "money_shorts_creative_voice_sound_mux_elevenlabs_v2_report",
  status: "review_required",
  audioMode: "elevenlabs_real_tts",
  notRealSpeech: false,
  realTtsExecuted: true,
  ownerAcceptanceRequired: true,
  uploadReady: false,
  uploadQueueReadinessGenerated: false,
  isFinalUploadReadyVideo: false,
  selectedTopicId: manifest.selectedTopicId,
  selectedCandidateId: manifest.selectedCandidateId,
  qualityScorerDecision: manifest.qualityScorerDecision,
  hardFailReasonCount: manifest.hardFailReasonCount,
  sourceVisualMp4: visualMp4,
  ttsScriptPath,
  ttsSummaryPath,
  muxedMp4Path: muxedMp4,
  muxSummaryPath,
  elevenlabs: {
    provider: "elevenlabs",
    apiCallCount: ttsSummary.apiCallCount,
    apiCallBudgetMax: ttsSummary.apiCallBudgetMax,
    voiceIdMasked: ttsSummary.voiceIdMasked,
    voiceCandidateId: ttsSummary.voiceCandidateId,
    voicePresetId: ttsSummary.voicePresetId,
    modelId: ttsSummary.modelId,
    normalizeMethod: ttsSummary.normalizeMethod,
    maxAtempoRatio: ttsSummary.maxAtempoRatio,
    atempoAbortThreshold: ttsSummary.atempoAbortThreshold,
    hardTrimApplied: ttsSummary.hardTrimApplied,
    timelineDurationSec: ttsSummary.timelineDurationSec,
    autoRetry: false,
    scenes: (ttsSummary.scenes ?? []).map((s) => ({
      sceneNumber: s.sceneNumber,
      sceneRole: s.sceneRole,
      targetDurationSec: s.targetDurationSec,
      rawAudioDurationSec: s.rawAudioDurationSec,
      normalizeMethod: s.normalizeMethod,
      atempoRatio: s.atempoRatio,
      hardTrimApplied: s.hardTrimApplied,
      status: s.status,
    })),
  },
  probe: {
    container: "mp4",
    videoCodec: vs.codec_name,
    audioCodec: as.codec_name,
    width: vs.width,
    height: vs.height,
    fps: fpsOf(vs.avg_frame_rate),
    durationSec: containerDur,
    audioPresent: !!as.codec_name,
    avGapSec: avGap,
  },
  soundPolicy: manifest.soundPolicy,
  ttsTextDerivedFromCandidate: true,
  riskNotes: [
    "real ElevenLabs TTS (유료) 1회 실행 완료 — 최종 음성 승인 아님. Owner 청취/시청 검토 필요.",
    "normalize=atempo tail-preserving; -t hard trim 미적용(hardTrimApplied=false).",
    "ownerAcceptanceRequired=true, uploadReady=false, uploadQueueReadinessGenerated=false.",
    "sfxRendered=false — SFX render deferred (fabricated/downloaded SFX forbidden).",
    "기존 accepted final mux mp4 / YouTube / Instagram 게시물 미변경. secret 원문 미출력.",
  ],
  generatedBy: "run-money-shorts-creative-voice-sound-mux-elevenlabs-v2-first-run.mjs",
};
writeFileSync(manifest.outputPaths.muxReport, JSON.stringify(report, null, 2) + "\n", "utf8");

console.log("── CREATIVE VOICE+SOUND MUX ELEVENLABS v2 (real TTS, atempo) ──");
console.log(`  ${vs.codec_name}/${as.codec_name} ${vs.width}x${vs.height} ${fpsOf(vs.avg_frame_rate)}fps ${containerDur}s avGap=${avGap}s`);
console.log(`  apiCalls=${ttsSummary.apiCallCount}/${ttsSummary.apiCallBudgetMax} maxAtempoRatio=${ttsSummary.maxAtempoRatio} hardTrim=${ttsSummary.hardTrimApplied} voiceIdMasked=${ttsSummary.voiceIdMasked}`);
console.log(`  audioMode=elevenlabs_real_tts realTtsExecuted=true ownerAcceptanceRequired=true uploadReady=false`);
console.log(`  muxed mp4: ${muxedMp4}`);
console.log(`  report: ${manifest.outputPaths.muxReport}`);
process.exit(0);
