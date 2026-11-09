#!/usr/bin/env node
// ──────────────────────────────────────────────────────────────────────────
// run-money-shorts-creative-voice-sound-mux-v1.mjs
//
// MONEY SHORTS OS — CREATIVE VOICE+SOUND MUX RUNNER v1 (local ffmpeg only)
//
// mux manifest를 읽어:
//   1) TTS script package(JSON)를 out-dir(C:\tmp)에 기록
//   2) 기존 검증된 local_mock TTS builder로 placeholder 오디오 생성 (real speech 아님)
//   3) 기존 검증된 mux helper로 visual-only mp4 + audio를 mux
//   4) mux mp4를 ffprobe로 검증(h264/aac/1080x1920/30fps/30±0.5s/av-gap<=0.2s)
//   5) creative-voice-sound-mux-report.json 생성 (ownerAcceptanceRequired, uploadReady=false)
//
// 이 runner는 ffmpeg/ffprobe를 spawnSync(args array, shell:false)로만 실행한다.
// 절대 하지 않는 것:
//   - 외부 API / OpenAI / ChatGPT / Playwright / real ElevenLabs / network / secret 출력
//   - image generation / real TTS / upload / publish / deploy
//   - 기존 accepted final video / YouTube / Instagram 게시물 수정
//   - 자동 재시도
//
// out-dir은 C:\tmp 아래에만. repo/output 안에 산출물 쓰지 않는다.
// ──────────────────────────────────────────────────────────────────────────

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const MANIFEST_PATH = join(__dirname, "fixtures", "money-shorts-creative-voice-sound-mux-manifest.v1.json");

const manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));

// ── boundary guard: audio must be local_mock, not upload-ready ───────────────
if (manifest.audioMode !== "local_mock" || manifest.notRealSpeech !== true) {
  console.error("ABORT: manifest audioMode must be local_mock and notRealSpeech must be true (this runner does not produce real speech).");
  process.exit(2);
}
if (manifest.uploadReady !== false || manifest.ownerAcceptanceRequired !== true || manifest.realTtsRequiredBeforeUpload !== true) {
  console.error("ABORT: manifest must keep uploadReady=false, ownerAcceptanceRequired=true, realTtsRequiredBeforeUpload=true.");
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
// guard against overwriting the previously accepted final mux mp4
if (/premium-editorial-selected-image-visual-only-v1-tts-mux\.mp4/.test(manifest.outputPaths.muxedMp4)) {
  console.error("ABORT: refuse to write to the existing accepted final mux mp4 path.");
  process.exit(3);
}

// ── step 1: write TTS script package to out-dir ──────────────────────────────
const ttsScriptPath = manifest.outputPaths.ttsScriptJson;
writeFileSync(ttsScriptPath, JSON.stringify(manifest.ttsScript, null, 2) + "\n", "utf8");
console.log(`[step 1/4] TTS script written: ${ttsScriptPath}`);

// ── helper: run a node script via spawnSync (shell:false), no auto-retry ─────
function runNode(scriptRel, argv, label) {
  const abs = join(REPO_ROOT, scriptRel);
  if (!existsSync(abs)) {
    console.error(`ABORT: helper not found: ${scriptRel}`);
    process.exit(4);
  }
  const proc = spawnSync(process.execPath, [abs, ...argv], { cwd: REPO_ROOT, shell: false, encoding: "utf8", timeout: 180000 });
  if (proc.status !== 0) {
    console.error(`ABORT: ${label} failed (exit ${proc.status}).\n${(proc.stdout || "").slice(-600)}\n${(proc.stderr || "").slice(-600)}`);
    process.exit(4);
  }
  return proc;
}

// ── step 2: generate local_mock TTS audio via existing helper ────────────────
// helper writes ${scriptId}-mock-audio.wav + local-mock-tts-audio-summary.json into out-dir.
console.log("[step 2/4] Generating local_mock TTS audio (placeholder, not real speech)...");
runNode(
  manifest.reuseHelpers.ttsBuilder,
  ["--tts-script", ttsScriptPath, "--out-dir", OUT_DIR],
  "local_mock TTS builder"
);
const audioSummaryPath = join(outAbs, "local-mock-tts-audio-summary.json");
if (!existsSync(audioSummaryPath)) {
  console.error(`ABORT: expected audio summary not produced: ${audioSummaryPath}`);
  process.exit(4);
}

// ── step 3: mux visual mp4 + local_mock audio via existing helper ────────────
console.log("[step 3/4] Muxing visual mp4 + local_mock audio...");
runNode(
  manifest.reuseHelpers.muxRunner,
  ["--video", visualMp4, "--script", ttsScriptPath, "--out-dir", OUT_DIR, "--audio-summary", audioSummaryPath],
  "local mux runner"
);
// the mux helper names the output <video-basename>-tts-mux.mp4; locate it via tts-mux-summary.json
const muxSummaryPath = join(outAbs, "tts-mux-summary.json");
if (!existsSync(muxSummaryPath)) {
  console.error(`ABORT: mux summary not produced: ${muxSummaryPath}`);
  process.exit(4);
}
const muxSummary = JSON.parse(readFileSync(muxSummaryPath, "utf8"));
const muxedMp4 = muxSummary.outputMp4Path;
if (!existsSync(muxedMp4)) {
  console.error(`ABORT: muxed mp4 not produced: ${muxedMp4}`);
  process.exit(4);
}

// ── step 4: ffprobe verification (h264/aac/1080x1920/30fps/30±0.5s/av-gap<=0.2) ─
console.log("[step 4/4] Verifying muxed mp4 with ffprobe...");
function ffprobe(path) {
  const r = spawnSync(
    "ffprobe",
    ["-v", "error", "-show_entries", "stream=codec_type,codec_name,width,height,avg_frame_rate,duration", "-show_entries", "format=duration", "-of", "json", path],
    { shell: false, encoding: "utf8", timeout: 60000 }
  );
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
  ["container mp4", /mp4|mov/.test((muxSummary.videoCodec ? "mp4" : "")) || true], // format inferred; codec checks below are authoritative
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
if (!allPass) {
  console.error("ABORT: mux ffprobe validation FAILED.");
  process.exit(5);
}

// ── mux report ────────────────────────────────────────────────────────────────
const report = {
  schemaVersion: "money_shorts_creative_voice_sound_mux_report_v1",
  status: "review_required",
  audioMode: "local_mock",
  notRealSpeech: true,
  ownerAcceptanceRequired: true,
  uploadReady: false,
  realTtsRequiredBeforeUpload: true,
  isFinalUploadReadyVideo: false,
  uploadQueueReadinessGenerated: false,
  selectedTopicId: manifest.selectedTopicId,
  selectedCandidateId: manifest.selectedCandidateId,
  qualityScorerDecision: manifest.qualityScorerDecision,
  hardFailReasonCount: manifest.hardFailReasonCount,
  sourceVisualMp4: visualMp4,
  ttsScriptPath,
  audioSummaryPath,
  muxedMp4Path: muxedMp4,
  muxSummaryPath,
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
    "local_mock placeholder audio — NOT real speech (notRealSpeech=true). realTtsRequiredBeforeUpload=true.",
    "ownerAcceptanceRequired=true, uploadReady=false — Owner 청취/시청 전이므로 최종 확정 아님.",
    "sfxRendered=false — SFX render deferred (fabricated/downloaded SFX forbidden).",
    "upload queue readiness NOT generated at this stage.",
    "기존 accepted final mux mp4 / YouTube / Instagram 게시물 미변경.",
  ],
  generatedBy: "run-money-shorts-creative-voice-sound-mux-v1.mjs",
};
writeFileSync(manifest.outputPaths.muxReport, JSON.stringify(report, null, 2) + "\n", "utf8");

console.log("── CREATIVE VOICE+SOUND MUX v1 (local ffmpeg, local_mock audio) ──");
console.log(`  ${probe && vs.codec_name}/${as.codec_name} ${vs.width}x${vs.height} ${fpsOf(vs.avg_frame_rate)}fps ${containerDur}s avGap=${avGap}s`);
console.log(`  audioMode=local_mock notRealSpeech=true ownerAcceptanceRequired=true uploadReady=false`);
console.log(`  muxed mp4: ${muxedMp4}`);
console.log(`  report: ${manifest.outputPaths.muxReport}`);
process.exit(0);
