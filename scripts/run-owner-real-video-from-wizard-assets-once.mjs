#!/usr/bin/env node
/**
 * run-owner-real-video-from-wizard-assets-once.mjs
 * task: owner-web-real-script-voice-visual-generation-pipeline-v1
 *
 * 웹 위저드 최종 영상 합성: 실제 ElevenLabs TTS(timeline mp3) + 흐름 기반 실제 장면 이미지 +
 * ASS 자막 + 장면별 카메라 이동·전경 패럴랙스·인물/손 미세 레이어 모션 → 1080x1920 mp4.
 * 로컬 ffmpeg/ffprobe만 사용한다.
 *
 * 입력 계약(fail-closed — 전부 만족해야 렌더 시작):
 *   --script        script-final.json (wizard_script_final_v1)
 *   --tts-script    tts-script.real.json (scene text/role source)
 *   --audio-summary elevenlabs-scene-paced-tts-summary.json (generated audio duration = 영상 scene 경계의 단일 소스)
 *   --images-dir    scene-01..NN.png + scene-images-summary.json (allReady=true)
 *   --out-dir       repo 밖 C:\tmp 하위
 *
 * 산출: final-<slug>.mp4 + real-video-summary.json (ffprobe 검증값 + media quality gate).
 * 검증: 1080x1920 · duration 15~60s · audio+video stream · size>0 · scene 4~18.
 *
 * 보안: 외부 API/업로드/DB/OAuth/secret 접근 없음. spawnSync shell:false only.
 * exit codes: 0 = RENDER_MUX_OK · 1 = 렌더/검증 실패 · 2 = usage 오류 · 3 = 입력 미준비 차단
 */

import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  FULL_SCRIPT_CAPTION_CONTRACT_VERSION,
  DYNAMIC_CAPTION_FONT,
  buildDynamicCaptionTimeline,
  createDynamicCaptionAss,
  escapeAssText,
} from "./_money-shorts-dynamic-captions.mjs";
import {
  LAYERED_MOTION_RENDERER_VERSION,
  buildLayeredMotionAudit,
  buildLayeredMotionFilter,
  buildSceneMotionRecipe,
} from "./_money-shorts-layered-motion.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");

const args = process.argv.slice(2);
function getArg(name) {
  const idx = args.indexOf(name);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : null;
}
const scriptArg = getArg("--script");
const ttsScriptArg = getArg("--tts-script");
const audioSummaryArg = getArg("--audio-summary");
const imagesDirArg = getArg("--images-dir");
const outDirArg = getArg("--out-dir");
if (!scriptArg || !ttsScriptArg || !audioSummaryArg || !imagesDirArg || !outDirArg) {
  console.error(
    "Usage: node run-owner-real-video-from-wizard-assets-once.mjs --script <script-final.json> --tts-script <tts-script.real.json> --audio-summary <summary.json> --images-dir <dir> --out-dir <dir>",
  );
  process.exit(2);
}
const OUT_DIR = path.resolve(outDirArg);

// 입력/출력 전부 C:\tmp\money-shorts-os\ 하위만 허용(fail-closed). ffmpeg/ffprobe 이전에 검사한다.
const MEDIA_ROOT_RE = /^C:[\\/]+tmp[\\/]+money-shorts-os[\\/]+/i;
const PATH_INPUTS = [
  ["--script", path.resolve(scriptArg)],
  ["--tts-script", path.resolve(ttsScriptArg)],
  ["--audio-summary", path.resolve(audioSummaryArg)],
  ["--images-dir", path.resolve(imagesDirArg)],
  ["--out-dir", OUT_DIR],
];
for (const [flag, abs] of PATH_INPUTS) {
  if (!MEDIA_ROOT_RE.test(abs + path.sep)) {
    console.error(`ABORT: ${flag} must be under C:\\tmp\\money-shorts-os\\. path: ${abs}`);
    process.exit(2);
  }
}
if (OUT_DIR.startsWith(REPO_ROOT + "\\") || OUT_DIR.startsWith(REPO_ROOT + "/")) {
  console.error("ABORT: --out-dir must be outside repo root.");
  process.exit(2);
}
if ([scriptArg, ttsScriptArg, audioSummaryArg, imagesDirArg, OUT_DIR].some((p) => String(p).includes(".money-shorts-local"))) {
  console.error("ABORT: .money-shorts-local access forbidden.");
  process.exit(2);
}

function log(m) { console.log(`[wizard-final-video] ${m}`); }
function readJson(p) {
  try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch { return null; }
}
function secToAssTime(sec) {
  const totalCentiseconds = Math.max(0, Math.round(Number(sec) * 100));
  const hours = Math.floor(totalCentiseconds / 360000);
  const minutes = Math.floor((totalCentiseconds % 360000) / 6000);
  const seconds = Math.floor((totalCentiseconds % 6000) / 100);
  return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(totalCentiseconds % 100).padStart(2, "0")}`;
}
function semanticText(value) {
  return String(value ?? "").normalize("NFKC").replace(/[\s"'“”‘’.,!?…，。！？:;；：]+/gu, "").toLowerCase();
}
fs.mkdirSync(OUT_DIR, { recursive: true });
const SUMMARY_PATH = path.join(OUT_DIR, "real-video-summary.json");
function abortBlocked(code, note) {
  fs.writeFileSync(
    SUMMARY_PATH,
    JSON.stringify(
      { schemaVersion: "wizard_real_video_summary_v1", status: code, note, notUploaded: true, uploadReady: false },
      null,
      2,
    ),
    "utf8",
  );
  console.error(`ABORT(${code}): ${note}`);
  process.exit(3);
}

// ── 입력 검증 (fail-closed) ───────────────────────────────────────────────────
const MIN_SCENES = 4;
const MAX_SCENES = 18;
const IMAGE_CONTROLLER_VERSION = "chatgpt_picture_v2_character_reference_v8";
const VISUAL_MODALITY_VERSION = "money_shorts_visual_modality_sequence_v1";
const BASE_VISUAL_ENGINE_VERSION = "money_shorts_finance_3d_editorial_sequence_v11";
const CHARACTER_CONTINUITY_VERSION = "money_shorts_selected_character_reference_v1";
const MOTION_PLAN_VERSION = "money_shorts_scene_motion_plan_v1";
const SAMPLE_REVIEW_CONTRACT_VERSION = "money_shorts_av_sample_review_v1";
const STAGED_COVER_CONTRACT_VERSION = "money_shorts_staged_prehook_cover_v1";
const record = readJson(path.resolve(scriptArg));
const scriptSceneCount = Array.isArray(record?.script?.scenes) ? record.script.scenes.length : 0;
if (!record || record.schemaVersion !== "wizard_script_final_v1" || scriptSceneCount < MIN_SCENES || scriptSceneCount > MAX_SCENES) {
  abortBlocked("SCRIPT_FINAL_INVALID", `script-final.json(wizard_script_final_v1, scenes ${MIN_SCENES}~${MAX_SCENES}) 필요`);
}
const expectedVisualEngineVersion = BASE_VISUAL_ENGINE_VERSION;
const ttsScript = readJson(path.resolve(ttsScriptArg));
const ttsSceneCount = Array.isArray(ttsScript?.scenes) ? ttsScript.scenes.length : 0;
if (!ttsScript || ttsScript.ttsProvider !== "elevenlabs" || ttsSceneCount !== scriptSceneCount) {
  abortBlocked("TTS_SCRIPT_INVALID", `tts-script.real.json(elevenlabs, scenes ${scriptSceneCount}) 필요`);
}
const audioSummary = readJson(path.resolve(audioSummaryArg));
if (
  !audioSummary ||
  audioSummary.provider !== "elevenlabs" ||
  audioSummary.liveApiCallPerformed !== true ||
  audioSummary.readinessFailure === true ||
  typeof audioSummary.timelineAudioPath !== "string"
) {
  abortBlocked("REAL_TTS_REQUIRED", "실제 ElevenLabs TTS summary(liveApiCallPerformed=true) 필요 — 테스트 소리 사용 불가");
}
if (
  typeof ttsScript.wizardScriptFingerprint !== "string" ||
  ttsScript.wizardScriptFingerprint !== record.localFingerprint ||
  audioSummary.wizardScriptFingerprint !== record.localFingerprint
) {
  abortBlocked("SCRIPT_FINGERPRINT_MISMATCH", "대본·음성·영상 입력 지문이 일치하지 않습니다. 현재 확정 대본으로 음성을 다시 만들어 주세요.");
}
const AUDIO_PATH = path.resolve(audioSummary.timelineAudioPath);
if (!fs.existsSync(AUDIO_PATH)) abortBlocked("REAL_TTS_REQUIRED", `timeline 오디오 파일 없음: ${AUDIO_PATH}`);
if (audioSummary.timingPolicy !== "character_aligned_continuous_v2") {
  abortBlocked("DYNAMIC_CAPTION_ALIGNMENT_REQUIRED", "연속 TTS character alignment가 있어야 문장·문단 기준 자막을 만들 수 있습니다.");
}
const sampleReviewEnabled = ttsScript?.sampleReviewMode?.enabled === true;
if (sampleReviewEnabled && (
  ttsScript.sampleReviewMode.contractVersion !== SAMPLE_REVIEW_CONTRACT_VERSION ||
  audioSummary?.sampleReviewAudit?.contractVersion !== SAMPLE_REVIEW_CONTRACT_VERSION ||
  audioSummary?.sampleReviewAudit?.durationWithinTargetRange !== true
)) {
  abortBlocked(
    "SAMPLE_REVIEW_VOICE_AUDIT_FAILED",
    "샘플 검수 음성은 전용 계약과 목표 길이 95~108%를 모두 통과해야 영상으로 합성할 수 있습니다.",
  );
}
const audioTimelineScenes = Array.isArray(audioSummary.scenes)
  ? audioSummary.scenes.slice().sort((a, b) => a.sceneNumber - b.sceneNumber)
  : [];
if (audioTimelineScenes.length !== scriptSceneCount) {
  abortBlocked("REAL_TTS_REQUIRED", `TTS summary 장면 길이 불일치: ${audioTimelineScenes.length}/${scriptSceneCount}`);
}

const IMAGES_DIR = path.resolve(imagesDirArg);
const imagesSummary = readJson(path.join(IMAGES_DIR, "scene-images-summary.json"));
const imageSummaryScenes = Array.isArray(imagesSummary?.scenes) ? imagesSummary.scenes : [];
const imageHashes = imageSummaryScenes.map((scene) => scene?.imageSha256);
const imageAssetContractReady = imageSummaryScenes.length === scriptSceneCount && imageSummaryScenes.every((scene, index) => {
  const file = path.join(IMAGES_DIR, `scene-${String(index + 1).padStart(2, "0")}.png`);
  const expectedEvidenceId = record.script.scenes[index]?.visualEvidence?.sceneIdentity;
  const expectedSceneIntegrationPlan = record.script.scenes[index]?.visualEvidence?.sceneIntegrationPlan;
  const expectedMotionPlan = record.script.scenes[index]?.visualEvidence?.motionPlan;
  return scene?.status === "SAVED_OK" &&
    scene?.sceneIndex === index + 1 &&
    typeof scene?.visualEvidenceId === "string" &&
    scene.visualEvidenceId === expectedEvidenceId &&
    typeof scene?.visualModeId === "string" &&
    typeof scene?.presenceMode === "string" &&
    scene?.sceneIntegrationPlan === expectedSceneIntegrationPlan &&
    scene?.motionPlan === expectedMotionPlan &&
    typeof scene?.promptFingerprint === "string" &&
    scene.promptFingerprint.length === 16 &&
    typeof scene?.imageSha256 === "string" &&
    scene.imageSha256.length === 64 &&
    typeof scene?.perceptualHash === "string" &&
    scene.perceptualHash.length === 16 &&
    fs.existsSync(file) &&
    createHash("sha256").update(fs.readFileSync(file)).digest("hex") === scene.imageSha256;
}) && new Set(imageHashes).size === scriptSceneCount;
if (
  !imagesSummary ||
  imagesSummary.mode !== "chatgpt_playwright" ||
  imagesSummary.visualEngineVersion !== expectedVisualEngineVersion ||
  imagesSummary.imageControllerVersion !== IMAGE_CONTROLLER_VERSION ||
  imagesSummary.visualModalityVersion !== VISUAL_MODALITY_VERSION ||
  imagesSummary.allReady !== true ||
  imagesSummary.visualDifferenceAudit?.version !== "ffmpeg_dhash64_v1" ||
  imagesSummary.visualDifferenceAudit?.passed !== true ||
  imagesSummary.visualModalityAudit?.version !== VISUAL_MODALITY_VERSION ||
  imagesSummary.visualModalityAudit?.passed !== true ||
  imagesSummary.visualModalityAudit?.sceneContractsPassed !== true ||
  imagesSummary.characterContinuityAudit?.version !== CHARACTER_CONTINUITY_VERSION ||
  imagesSummary.characterContinuityAudit?.promptCoveragePassed !== true ||
  imagesSummary.characterContinuityAudit?.targetedRegenerationPassed !== true ||
  imagesSummary.characterContinuityAudit?.passed !== true ||
  imagesSummary.motionPlanAudit?.version !== MOTION_PLAN_VERSION ||
  imagesSummary.motionPlanAudit?.promptCoveragePassed !== true ||
  imagesSummary.motionPlanAudit?.evidenceCoveragePassed !== true ||
  imagesSummary.motionPlanAudit?.stateCoveragePassed !== true ||
  imagesSummary.motionPlanAudit?.passed !== true ||
  !imageAssetContractReady
) {
  abortBlocked("REAL_SCENE_IMAGES_REQUIRED", "현재 주제의 장면 증거·프롬프트 지문·시각 모달리티 분산·고유 이미지 해시·근접 유사도·인물 연속성·장면 통합·모션 계획 계약이 모두 통과한 실제 이미지 summary 필요 — 구버전/중복/유사/변경 이미지 사용 불가");
}
const imageFiles = [];
for (let i = 1; i <= scriptSceneCount; i++) {
  const f = path.join(IMAGES_DIR, `scene-${String(i).padStart(2, "0")}.png`);
  if (!fs.existsSync(f)) abortBlocked("REAL_SCENE_IMAGES_REQUIRED", `scene 이미지 없음: ${f}`);
  imageFiles.push(f);
}

const plannedScenes = ttsScript.scenes.slice().sort((a, b) => a.sceneNumber - b.sceneNumber);
const durations = audioTimelineScenes.map((s) => Number(s.normalizedDurationSec));
if (durations.some((d) => !Number.isFinite(d) || d < 1 || d > 15)) {
  abortBlocked("REAL_TTS_REQUIRED", "TTS summary normalizedDurationSec(1~15s) 형식 오류");
}
const totalSec = durations.reduce((a, b) => a + b, 0);
if (totalSec < 15 || totalSec > 60) {
  abortBlocked("REAL_TTS_REQUIRED", `audio-driven 전체 길이(15~60s) 형식 오류: ${totalSec}s`);
}
let sceneCursorSec = 0;
const scenes = plannedScenes.map((scene, i) => {
  const startSec = sceneCursorSec;
  const durationSec = durations[i];
  sceneCursorSec += durationSec;
  return { ...scene, startSec, endSec: sceneCursorSec, durationSec };
});
const safeSlug = String(record.topicId ?? "topic").replace(/[^a-z0-9-]/gi, "-").toLowerCase().slice(0, 60);
const renderId = `${Date.now().toString(36)}-${process.pid}`;
const renderDir = path.join(OUT_DIR, `.render-${renderId}`);
fs.mkdirSync(renderDir, { recursive: true });

const inferredAlignmentPath = typeof audioSummary.inputFingerprint === "string"
  ? path.join(path.dirname(AUDIO_PATH), `elevenlabs-korean-director-${audioSummary.inputFingerprint}.alignment.json`)
  : null;
const alignmentPath = path.resolve(audioSummary.alignmentPath ?? inferredAlignmentPath ?? "");
if (!alignmentPath || !MEDIA_ROOT_RE.test(alignmentPath + path.sep) || !fs.existsSync(alignmentPath)) {
  abortBlocked("DYNAMIC_CAPTION_ALIGNMENT_REQUIRED", `ElevenLabs alignment 파일 없음: ${alignmentPath || "(unknown)"}`);
}
const alignmentDocument = readJson(alignmentPath);
let dynamicCaptionTimeline;
try {
  dynamicCaptionTimeline = buildDynamicCaptionTimeline({
    ttsScenes: plannedScenes,
    audioScenes: audioTimelineScenes,
    alignmentDocument,
  });
} catch (error) {
  abortBlocked("DYNAMIC_CAPTION_ALIGNMENT_REQUIRED", error instanceof Error ? error.message : String(error));
}
const captionAudit = dynamicCaptionTimeline.audit;
const stagedCoverEnabled = ttsScript?.coverContract?.enabled === true;
let renderedCaptionAss = createDynamicCaptionAss(dynamicCaptionTimeline.captions);
let coverAudit = {
  enabled: false,
  contractVersion: null,
  semanticWordCoveragePass: true,
  allLinesCharacterAnchored: true,
  normalSceneOneCaptionSuppressed: false,
  stagedLineCount: 0,
  anchors: [],
  passed: true,
};
if (stagedCoverEnabled) {
  const coverContract = ttsScript.coverContract;
  const coverLines = Array.isArray(coverContract.lines) ? coverContract.lines : [];
  const coverCaptions = dynamicCaptionTimeline.captions.filter((caption) => caption.sceneNumber === 1);
  const normalCaptions = dynamicCaptionTimeline.captions.filter((caption) => caption.sceneNumber !== 1);
  const coverWords = coverCaptions.flatMap((caption) => caption.wordTimings);
  const coverSource = coverCaptions.map((caption) => caption.text).join(" ");
  const coverSpoken = coverLines.map((line) => String(line?.spokenText ?? "").trim()).join(" ");
  const coverDisplay = coverLines.map((line) => String(line?.displayText ?? "").trim()).join(" ");
  const firstSceneEnd = Number(audioTimelineScenes[0]?.endSec);
  if (
    coverContract.contractVersion !== STAGED_COVER_CONTRACT_VERSION ||
    coverContract.sceneNumber !== 1 ||
    coverContract.visualOnlyPunctuation !== true ||
    coverLines.length !== 3 ||
    coverWords.length === 0 ||
    !Number.isFinite(firstSceneEnd) ||
    semanticText(coverSource) !== semanticText(coverSpoken) ||
    semanticText(coverSpoken) !== semanticText(coverDisplay) ||
    audioSummary.coverContractVersion !== STAGED_COVER_CONTRACT_VERSION ||
    audioSummary.openingVoiceAudit?.passed !== true
  ) {
    abortBlocked("STAGED_COVER_AUDIT_FAILED", "첫 장면의 음성·화면 문구·문자 정렬·확신형 속도 계약이 일치하지 않습니다.");
  }
  const coverStyle = `Style: Cover,${DYNAMIC_CAPTION_FONT},112,&H00F7F4EC,&H0057C8FF,&H00100F0D,&H00000000,-1,0,0,0,100,100,0,0,1,10,4,5,42,42,0,1`;
  renderedCaptionAss = createDynamicCaptionAss(normalCaptions).replace("\n[Events]", `\n${coverStyle}\n\n[Events]`);
  const yPositions = [610, 830, 1060];
  const emphasisColors = {
    topic: "&H00575FFF",
    tension: "&H00F7F4EC",
    impact: "&H0057C8FF",
    part_marker: "&H00FFD864",
  };
  const baseFontSizes = [118, 100, 108];
  const coverEvents = [];
  const anchors = [];
  let wordCursor = 0;
  for (let index = 0; index < coverLines.length; index += 1) {
    const line = coverLines[index];
    const spokenWords = String(line.spokenText).trim().split(/\s+/u).filter(Boolean);
    const firstWord = coverWords[wordCursor];
    const lastWord = coverWords[wordCursor + spokenWords.length - 1];
    if (!firstWord || !lastWord || spokenWords.length === 0) {
      abortBlocked("STAGED_COVER_AUDIT_FAILED", `썸네일 ${index + 1}번째 문구의 문자 정렬 범위를 찾지 못했습니다.`);
    }
    const startSec = Number(firstWord.startSec);
    const endSec = Math.max(firstSceneEnd - 0.04, Number(lastWord.endSec) + 0.12);
    const visibleLength = [...String(line.displayText)].length;
    const fontSize = Math.max(72, Math.min(baseFontSizes[index], Math.round(baseFontSizes[index] * Math.min(1, 14 / Math.max(1, visibleLength)))));
    const color = emphasisColors[line.emphasis] ?? "&H00F7F4EC";
    const motion = `{\\an5\\pos(540,${yPositions[index]})\\c${color}\\fs${fontSize}\\bord10\\shad4\\fad(25,90)\\fscx78\\fscy78\\t(0,150,0.74,\\fscx108\\fscy108)\\t(150,270,0.68,\\fscx100\\fscy100)}`;
    coverEvents.push(`Dialogue: 2,${secToAssTime(startSec)},${secToAssTime(endSec)},Cover,,0,0,0,,${motion}${escapeAssText(line.displayText)}`);
    anchors.push({
      spokenText: line.spokenText,
      displayText: line.displayText,
      startSec,
      sourceWordStartSec: Number(firstWord.startSec),
      sourceWordEndSec: Number(lastWord.endSec),
      anchorDeltaMs: 0,
    });
    wordCursor += spokenWords.length;
  }
  renderedCaptionAss += coverEvents.join("\n") + "\n";
  coverAudit = {
    enabled: true,
    contractVersion: STAGED_COVER_CONTRACT_VERSION,
    semanticWordCoveragePass:
      semanticText(coverSource) === semanticText(coverSpoken) &&
      semanticText(coverSpoken) === semanticText(coverDisplay),
    allLinesCharacterAnchored: anchors.every((anchor) => anchor.anchorDeltaMs === 0),
    normalSceneOneCaptionSuppressed: normalCaptions.every((caption) => caption.sceneNumber !== 1),
    stagedLineCount: anchors.length,
    anchors,
    passed: anchors.length === 3 && wordCursor === coverWords.length,
  };
}
const fullScriptCaptionPass = (
  captionAudit.contractVersion === FULL_SCRIPT_CAPTION_CONTRACT_VERSION &&
  captionAudit.fullScriptCoveragePass === true &&
  captionAudit.exactTranscriptMatchPass === true &&
  captionAudit.perSceneTranscriptMatchPass === true &&
  captionAudit.perSceneBlockCountPass === true &&
  captionAudit.sceneBoundaryTimingPass === true &&
  captionAudit.noCaptionOverlapPass === true &&
  captionAudit.captionGapPass === true &&
  captionAudit.screenDutyPass === true &&
  captionAudit.sentenceSemanticSegmentationPass === true &&
  captionAudit.sentenceBoundaryPreservedPass === true &&
  captionAudit.sourceSegmentBoundaryPreservedPass === true &&
  captionAudit.arbitraryMidPhraseSplitAbsent === true &&
  captionAudit.oneWordFragmentAbsent === true &&
  captionAudit.displayTerminalPunctuationAbsent === true &&
  captionAudit.displayWordCoveragePass === true &&
  captionAudit.multiPositionNarrativeFlowPass === true &&
  captionAudit.semanticColorPalettePass === true &&
  captionAudit.emphasisDensityPass === true &&
  captionAudit.highImpactRoleEmphasisPass === true &&
  captionAudit.motionDiversityPass === true
);
if (
  !captionAudit.firstTwoSecondsHook ||
  !captionAudit.displayUnitLengthPass ||
  !captionAudit.dwellPass ||
  !captionAudit.safeFramePass ||
  !captionAudit.dynamicPlacementPass ||
  !captionAudit.wordAnchoredPass ||
  captionAudit.bottomFixedSubtitleBar !== false ||
  !fullScriptCaptionPass ||
  !coverAudit.passed
) {
  abortBlocked("DYNAMIC_CAPTION_AUDIT_FAILED", "공통 전체 대본 자막 계약 위반: " + JSON.stringify(captionAudit));
}

// ── ffmpeg/ffprobe helpers (shell:false) ─────────────────────────────────────
function runFfmpeg(ffArgs, label) {
  const r = spawnSync("ffmpeg", ffArgs, { shell: false, encoding: "utf8", timeout: 300000, maxBuffer: 32 * 1024 * 1024 });
  if (r.status !== 0) {
    console.error(`ABORT: ffmpeg ${label} failed (exit ${r.status}):\n${(r.stderr || "").slice(-1200)}`);
    process.exit(1);
  }
}
function ffprobeJson(target) {
  const r = spawnSync(
    "ffprobe",
    ["-v", "error", "-show_streams", "-show_format", "-of", "json", target],
    { shell: false, encoding: "utf8", timeout: 60000 },
  );
  if (r.status !== 0) return null;
  try { return JSON.parse(r.stdout); } catch { return null; }
}

// ── step 1: motionPlan 기반 장면별 레이어 모션 세그먼트 ──────────────────────
log(`scene segments: ${scriptSceneCount}개, 총 ${totalSec}s (오디오 timeline ${audioSummary.timelineDurationSec ?? "?"}s)`);
const segFiles = [];
const motionSegments = [];
for (let i = 0; i < scriptSceneCount; i++) {
  const dur = durations[i];
  const frames = Math.round(dur * 30);
  const seg = path.join(renderDir, `seg-${String(i + 1).padStart(2, "0")}.mp4`);
  segFiles.push(seg);
  const scriptScene = record.script.scenes[i];
  const imageScene = imageSummaryScenes[i];
  const motionRecipe = buildSceneMotionRecipe({
    stage: scriptScene?.id,
    motionPlan: scriptScene?.visualEvidence?.motionPlan,
    presenceMode: imageScene?.presenceMode,
    sceneIndex: i + 1,
  });
  const motionFilter = buildLayeredMotionFilter({ recipe: motionRecipe, frames, durationSec: dur });
  motionSegments.push({
    ...motionRecipe,
    motionPlanFingerprint: createHash("sha256")
      .update(String(scriptScene?.visualEvidence?.motionPlan ?? ""))
      .digest("hex")
      .slice(0, 16),
  });
  runFfmpeg(
    ["-y", "-loop", "1", "-framerate", "30", "-i", imageFiles[i],
      "-filter_complex", motionFilter, "-map", "[motionout]", "-frames:v", String(frames),
      "-c:v", "libx264", "-crf", "21", "-preset", "fast", "-an", seg],
    `segment scene-${i + 1}`,
  );
  log(`  seg-${i + 1}: ${dur}s (${frames}f), ${motionRecipe.cameraMode}/${motionRecipe.presenceMode}`);
}
const motionAudit = buildLayeredMotionAudit(motionSegments);
if (!motionAudit.passed) {
  abortBlocked("LAYERED_MOTION_AUDIT_FAILED", `장면별 실제 모션 계약 위반: ${JSON.stringify(motionAudit)}`);
}

// ── step 2: 세그먼트 concat (재인코딩 없음) ───────────────────────────────────
const concatList = path.join(renderDir, "concat.txt");
fs.writeFileSync(concatList, segFiles.map((f) => `file '${f.replace(/\\/g, "/")}'`).join("\n") + "\n", "utf8");
const silentPath = path.join(renderDir, "silent-concat.mp4");
runFfmpeg(["-y", "-f", "concat", "-safe", "0", "-i", concatList, "-c", "copy", silentPath], "concat");

// ── step 3: 공통 전체 대본 자막 (문장 우선 · 긴 문장만 의미구절 · character timing) ──
const assPath = path.join(renderDir, "captions.ass");
const captionTimelinePath = path.join(renderDir, "dynamic-caption-timeline.json");
fs.writeFileSync(assPath, renderedCaptionAss, "utf8");
fs.writeFileSync(
  captionTimelinePath,
  JSON.stringify({
    schemaVersion: "money_shorts_dynamic_semantic_caption_timeline_v4",
    contractVersion: captionAudit.contractVersion,
    timingSource: captionAudit.timingSource,
    alignmentPath,
    audit: captionAudit,
    coverAudit,
    captions: dynamicCaptionTimeline.captions.map((caption) => Object.fromEntries(
      Object.entries(caption).filter(([key]) => key !== "assText"),
    )),
  }, null, 2),
  "utf8",
);
log(`dynamic captions: ${captionAudit.blockCount}개 문장/의미구절, max ${captionAudit.maxWordsPerBlock}어절/${captionAudit.maxDwellSec.toFixed(2)}s`);

// ── step 4: 자막 burn + 실제 음성 mux → 최종 mp4 ─────────────────────────────
const finalPath = path.join(OUT_DIR, `final-${safeSlug}-${renderId}.mp4`);
const fontsDir = path.join(REPO_ROOT, "assets", "fonts");
const captionFontPath = path.join(fontsDir, "BlackHanSans.ttf");
if (!fs.existsSync(captionFontPath)) abortBlocked("DYNAMIC_CAPTION_FONT_REQUIRED", `승인된 한국어 굵은 폰트 없음: ${captionFontPath}`);
const filterPath = (value) => value.replace(/\\/g, "/").replace(/^([A-Za-z]):/, "$1\\:");
const assFilter = `ass='${filterPath(assPath)}':fontsdir='${filterPath(fontsDir)}'`;
runFfmpeg(
  ["-y", "-i", silentPath, "-i", AUDIO_PATH,
    "-vf", assFilter,
    "-map", "0:v:0", "-map", "1:a:0",
    "-c:v", "libx264", "-crf", "21", "-preset", "fast", "-pix_fmt", "yuv420p", "-r", "30",
    "-c:a", "aac", "-b:a", "128k",
    "-t", String(totalSec), "-shortest",
    finalPath],
  "final mux",
);

// ── step 5: ffprobe 검증 + summary ───────────────────────────────────────────
const probe = ffprobeJson(finalPath);
const vStream = probe?.streams?.find((s) => s.codec_type === "video") ?? null;
const aStream = probe?.streams?.find((s) => s.codec_type === "audio") ?? null;
const durationSec = probe?.format?.duration ? Math.round(parseFloat(probe.format.duration) * 100) / 100 : null;
const sizeBytes = fs.existsSync(finalPath) ? fs.statSync(finalPath).size : 0;

const checks = {
  width1080: vStream?.width === 1080,
  height1920: vStream?.height === 1920,
  duration15to60: typeof durationSec === "number" && durationSec >= 15 && durationSec <= 60,
  hasVideoStream: vStream != null,
  hasAudioStream: aStream != null,
  fileSizePositive: sizeBytes > 0,
  sceneCountSupported: scriptSceneCount >= MIN_SCENES && scriptSceneCount <= MAX_SCENES,
  fullScriptCaptionContract: captionAudit.contractVersion === FULL_SCRIPT_CAPTION_CONTRACT_VERSION,
  fullScriptCaptions: fullScriptCaptionPass && captionAudit.wordAnchoredPass,
  captionTextCoverage100Percent: captionAudit.captionCoverageRatio === 1,
  captionExactTranscriptMatch: captionAudit.exactTranscriptMatchPass,
  captionSceneBoundaryTiming: captionAudit.sceneBoundaryTimingPass,
  captionNoOverlap: captionAudit.noCaptionOverlapPass,
  captionGapBounded: captionAudit.captionGapPass,
  captionSentenceSemanticUnits:
    captionAudit.displayUnitLengthPass &&
    captionAudit.sentenceSemanticSegmentationPass &&
    captionAudit.arbitraryMidPhraseSplitAbsent,
  captionSentenceBoundaries: captionAudit.sentenceBoundaryPreservedPass,
  captionParagraphBoundaries: captionAudit.sourceSegmentBoundaryPreservedPass,
  captionDisplayPunctuationRemoved: captionAudit.displayTerminalPunctuationAbsent,
  captionDisplayWordCoverage: captionAudit.displayWordCoveragePass,
  captionDwellContract: captionAudit.dwellPass,
  captionSafeFrame: captionAudit.safeFramePass,
  captionPlacementMovesByScene: captionAudit.dynamicPlacementPass && captionAudit.multiPositionNarrativeFlowPass,
  captionSemanticColorPalette: captionAudit.semanticColorPalettePass,
  captionHighImpactEmphasis: captionAudit.highImpactRoleEmphasisPass,
  captionMotionDiversity: captionAudit.motionDiversityPass,
  firstTwoSecondsHookCaption: captionAudit.firstTwoSecondsHook,
  bottomFixedSubtitleBarAbsent: captionAudit.bottomFixedSubtitleBar === false,
  forbiddenMalgunGothicAbsent: DYNAMIC_CAPTION_FONT !== "Malgun Gothic",
  sampleReviewVoiceDurationGate: !sampleReviewEnabled || audioSummary.sampleReviewAudit?.durationWithinTargetRange === true,
  fullScriptCaptionGate: fullScriptCaptionPass,
  stagedCoverGate: !stagedCoverEnabled || (
    coverAudit.enabled === true &&
    coverAudit.semanticWordCoveragePass === true &&
    coverAudit.allLinesCharacterAnchored === true &&
    coverAudit.normalSceneOneCaptionSuppressed === true &&
    coverAudit.stagedLineCount === 3 &&
    coverAudit.passed === true
  ),
  layeredMotionRenderer: motionAudit.passed === true,
};
const ok = Object.values(checks).every(Boolean);

const summary = {
  schemaVersion: "wizard_real_video_summary_v1",
  status: ok ? "RENDER_MUX_OK" : "RENDER_VALIDATION_FAILED",
  renderId,
  topicId: record.topicId ?? null,
  wizardScriptFingerprint: record.localFingerprint ?? null,
  scriptMode: record.mode ?? null,
  finalMp4Path: finalPath,
  durationSec,
  width: vStream?.width ?? null,
  height: vStream?.height ?? null,
  hasVideoStream: vStream != null,
  hasAudioStream: aStream != null,
  videoCodec: vStream?.codec_name ?? null,
  audioCodec: aStream?.codec_name ?? null,
  sizeBytes,
  sceneCount: scriptSceneCount,
  audioProvider: "elevenlabs",
  timingPolicy: audioSummary.timingPolicy ?? "audio_summary_scene_durations",
  captionMode: "full_script_dynamic_semantic_aligned_v6",
  captionContractVersion: captionAudit.contractVersion,
  coverMode: stagedCoverEnabled ? "staged_prehook_v1" : null,
  coverContractVersion: stagedCoverEnabled ? STAGED_COVER_CONTRACT_VERSION : null,
  coverAudit,
  sampleReviewContractVersion: sampleReviewEnabled ? SAMPLE_REVIEW_CONTRACT_VERSION : null,
  captionFont: DYNAMIC_CAPTION_FONT,
  captionTimelinePath,
  captionAudit,
  imageMode: "chatgpt_playwright",
  visualEngineVersion: expectedVisualEngineVersion,
  motionRendererVersion: LAYERED_MOTION_RENDERER_VERSION,
  motionAudit,
  sceneMotion: motionSegments,
  sceneTimeline: scenes.map((s, i) => ({ sceneNumber: i + 1, startSec: s.startSec, endSec: s.endSec, durationSec: s.durationSec })),
  validation: checks,
  notUploaded: true,
  uploadReady: false, // 업로드 가능 여부는 서버 media quality gate + preflight + Owner 확인 게이트가 판정한다.
  generatedAt: new Date().toISOString(),
};
fs.writeFileSync(SUMMARY_PATH, JSON.stringify(summary, null, 2), "utf8");
log(`final mp4: ${finalPath}`);
log(`검증: ${JSON.stringify(checks)}`);
log(`summary: ${SUMMARY_PATH} (status=${summary.status})`);
process.exit(ok ? 0 : 1);
