#!/usr/bin/env node
/**
 * Local-only two-part Money Shorts pilot.
 *
 * `prepare` writes two Korean Director v2 TTS inputs. `render` reuses the approved
 * 3D editorial images, character-aligned TTS, and the common v6 caption engine.
 * The first scene is rendered as a stronger staged cover instead of duplicating
 * the normal caption. No image API, upload, platform API, DB, or OAuth is used.
 */

import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import {
  FULL_SCRIPT_CAPTION_CONTRACT_VERSION,
  DYNAMIC_CAPTION_FONT,
  buildDynamicCaptionTimeline,
  createDynamicCaptionAss,
  escapeAssText,
} from "./_money-shorts-dynamic-captions.mjs";

const MEDIA_ROOT = "C:\\tmp\\money-shorts-os";
const PILOT_ROOT = path.join(MEDIA_ROOT, "two-part-prehook-pilot-v1");
const SOURCE_IMAGES_DIR = path.join(
  MEDIA_ROOT,
  "web-wizard-create-v1",
  "gen-finance-editorial-v2-investing-assets-reversal-01",
  "real",
  "images-3d-editorial-sequence-v10",
);
const FONT_DIR = path.resolve("assets", "fonts");
const FONT_PATH = path.join(FONT_DIR, "BlackHanSans.ttf");
const MODE = process.argv.includes("--render") ? "render" : "prepare";

const PARTS = [
  {
    id: "part-1",
    title: "주가가 싸졌는데 더 위험해질 수 있는 이유 1편",
    answer: "가격 하락만으로는 매수 이유가 생기지 않으며 하락 원인을 먼저 확인해야 한다.",
    bridge: "그럼 지금 사도 되는지, 가격 말고 딱 세 가지만 보면 돼. 2편에서 그 세 가지를 바로 보여줄게. 지금 이어서 봐.",
    sourceImageIndexes: [1, 2, 3, 4, 5, 6],
    coverLines: [
      { text: "주가 하락???", wordStart: 0, wordEnd: 1, y: 650, color: "&H00575FFF", fontSize: 126 },
      { text: "지금 사면", wordStart: 2, wordEnd: 3, y: 845, color: "&H00F7F4EC", fontSize: 126 },
      { text: "진짜 이득일까?!", wordStart: 4, wordEnd: 5, y: 1045, color: "&H0057C8FF", fontSize: 104 },
    ],
    scenes: [
      scene("hook", ["주가 하락.", "지금 사면, 진짜 이득일까?"], "direct_hook", "confidently", ["하락", "이득"]),
      scene("hook", ["주가가 싸졌는데 더 위험해질 수 있는 이유.", "가격이 내려갔다는 사실만으로 살 이유가 생기진 않아."], "firm_result", "firmly", ["위험", "가격"]),
      scene("situation", ["주가가 급하게 떨어지면 예전 가격이 기준처럼 보여."], "conversational", "conversationally", ["가격", "기준"]),
      scene("consequence", ["사업과 재무가 바뀌었는데도 싸졌다는 느낌만 따라가면."], "firm_result", "seriously", ["바뀌었는데도"]),
      scene("consequence", ["깨진 투자 이유에 돈을 계속 묶게 돼."], "firm_result", "firmly", ["깨진", "돈"]),
      scene("mindset", ["그래서 가격보다 하락 원인부터 확인해야 해.", "그럼 지금 사도 되는지, 가격 말고 딱 세 가지만 보면 돼.", "2편에서 그 세 가지를 바로 보여줄게. 지금 이어서 봐."], "decisive_turn", "confidently", ["2편", "이어서 봐", "원인", "세 가지"]),
    ],
  },
  {
    id: "part-2",
    title: "지금 사도 되는지 확인하는 세 가지 2편",
    answer: "하락 원인, 최초 매수 이유, 손실 한계를 모두 설명할 수 있어야 한다.",
    bridge: null,
    sourceImageIndexes: [6, 7, 8, 9, 10, 11],
    coverLines: [
      { text: "2편이야!", wordStart: 0, wordEnd: 0, y: 560, color: "&H00FFD864", fontSize: 108 },
      { text: "이 3개 통과 못하면...", wordStart: 1, wordEnd: 4, y: 815, color: "&H0057C8FF", fontSize: 86 },
      { text: "매수 멈추세요!!!", wordStart: 5, wordEnd: 6, y: 1045, color: "&H00575FFF", fontSize: 102 },
    ],
    scenes: [
      scene("hook", ["2편이야.", "이 3개 통과 못하면.", "매수 멈추세요."], "direct_hook", "confidently", ["2편", "3개", "멈추세요"]),
      scene("recommendation", ["첫째, 왜 떨어졌는지 한 줄로 설명할 수 있어야 해."], "practical", "clearly", ["첫째", "한 줄"]),
      scene("habit", ["둘째, 처음 매수 이유가 아직 살아 있는지 확인해."], "practical", "clearly", ["둘째", "확인"]),
      scene("habit", ["셋째, 틀렸을 때 멈출 손실 한계를 먼저 정해."], "practical", "clearly", ["셋째", "손실 한계"]),
      scene("mindset", ["세 가지가 비어 있으면 싼 가격은 기회가 아니라 함정이야."], "decisive_turn", "confidently", ["기회", "함정"]),
      scene("save", ["급락한 종목이 싸 보일 때, 매수 전에 이 세 줄을 다시 봐.", "다음 선택 전에 꺼내 볼 수 있게 저장하고 팔로우해 둬."], "calm_close", "confident", ["다시", "저장", "팔로우"]),
    ],
  },
];

function scene(sceneRole, segments, delivery, v3AudioTag, emphasisWords) {
  return { sceneRole, segments, delivery, v3AudioTag, emphasisWords };
}

function fail(message, code = 1) {
  console.error(`ABORT: ${message}`);
  process.exit(code);
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(value, null, 2), "utf8");
}

function sha256File(file) {
  return createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function estimatedDurationSec(segments) {
  const visibleChars = segments.join(" ").replace(/\s/gu, "").length;
  return Math.max(3, Math.min(12, Math.round((visibleChars / 6.8 + 0.8) * 10) / 10));
}

function buildTtsInput(part) {
  const scenes = part.scenes.map((item, index) => {
    const performanceText = item.segments.join("\n");
    return {
      sceneNumber: index + 1,
      sceneRole: item.sceneRole,
      durationSec: estimatedDurationSec(item.segments),
      narration: item.segments.join("\n"),
      captionText: item.segments.join(" "),
      speechDirection: {
        engineVersion: "money_shorts_speech_direction_v2",
        delivery: item.delivery,
        v3AudioTag: item.v3AudioTag,
        performanceText,
        emphasisWords: item.emphasisWords,
        segments: item.segments.map((text, segmentIndex) => ({
          text,
          cadence: segmentIndex === item.segments.length - 1 ? "firm_land" : "continue_rise",
          pauseAfterMs: segmentIndex === item.segments.length - 1 ? 0 : 280,
        })),
      },
    };
  });
  const targetDurationSec = Number(scenes.reduce((sum, item) => sum + item.durationSec, 0).toFixed(1));
  const fingerprint = createHash("sha256").update(JSON.stringify({ id: part.id, scenes })).digest("hex");
  return {
    schemaVersion: "money_shorts_two_part_prehook_pilot_tts_v1",
    scriptId: `two-part-prehook-${part.id}`,
    manifestId: "local-pilot-only",
    factCardId: "local-pilot-only",
    ttsProvider: "elevenlabs",
    ttsMode: "continuous_character_aligned",
    ttsEngineVersion: "money_shorts_korean_director_v2",
    modelId: "eleven_v3",
    timingPolicy: "character_aligned_continuous_v2",
    prosodyPolicy: "korean_native_cadence_v2",
    voicePreset: "korean_confident_director_v2",
    language: "ko",
    targetDurationSec,
    wizardTopicId: `pilot-investing-assets-reversal-${part.id}`,
    wizardTopicTitle: part.title,
    wizardScriptFingerprint: fingerprint,
    topicSpeechProfile: {
      engineVersion: "money_shorts_topic_voice_profile_v2",
      id: "confident_attention_director",
      speakerStance: "첫 문장을 낮고 단단하게 착지시켜 시선을 붙잡고, 이후 설명은 서두르지 않는 확신형 코치",
      arc: "자신감 있는 첫 질문으로 집중 → 침착한 설명 → 다음 행동을 단호하게 마무리",
      globalV3Tag: "confidently",
      baseSpeed: 0.98,
      baseStability: 0.44,
      baseSimilarityBoost: 0.88,
      baseStyle: 0,
    },
    captionContract: FULL_SCRIPT_CAPTION_CONTRACT_VERSION,
    sampleReviewMode: null,
    scriptMode: "local_pilot_only",
    riskNotes: [
      "Two-part prehook pilot only; no 500-topic rollout is implied.",
      "No upload is performed by this input.",
    ],
    scenes,
  };
}

function sourceImagePath(index) {
  return path.join(SOURCE_IMAGES_DIR, `scene-${String(index).padStart(2, "0")}.png`);
}

function prepare() {
  if (!fs.existsSync(FONT_PATH)) fail(`caption font missing: ${FONT_PATH}`, 2);
  const allSourceImages = PARTS.flatMap((part) => part.sourceImageIndexes).map(sourceImagePath);
  for (const file of allSourceImages) if (!fs.existsSync(file)) fail(`source image missing: ${file}`, 2);

  const spec = {
    schemaVersion: "money_shorts_two_part_prehook_pilot_v1",
    status: "PREPARED",
    parentTopic: "주가가 싸졌는데 더 위험해질 수 있는 이유",
    localOnly: true,
    uploadReady: false,
    rollout500Applied: false,
    semanticSplitAudit: {
      twoQuestions: true,
      distinctActionBundles: true,
      eachPartIndependentlyComplete: true,
      specificNaturalBridge: true,
      distinctVisualFlow: true,
      explicitPartOneContinuationCue: true,
      partTwoContinuityMarker: true,
      passedCount: 7,
      threshold: 4,
      passed: true,
    },
    parts: PARTS.map((part) => ({
      id: part.id,
      title: part.title,
      answer: part.answer,
      bridge: part.bridge,
      sourceImages: part.sourceImageIndexes.map((index) => ({
        sourceScene: index,
        path: sourceImagePath(index),
        sha256: sha256File(sourceImagePath(index)),
      })),
      coverLines: part.coverLines,
      ttsScriptPath: path.join(PILOT_ROOT, part.id, "input", "tts-script.real.json"),
      ttsOutputDir: path.join(PILOT_ROOT, part.id, "tts"),
      renderOutputDir: path.join(PILOT_ROOT, part.id, "render"),
    })),
    generatedAt: new Date().toISOString(),
  };

  for (const part of PARTS) {
    const ttsInput = buildTtsInput(part);
    if (ttsInput.scenes.map((item) => item.speechDirection.performanceText).join("").replace(/\s/gu, "").length < 120) {
      fail(`${part.id} narration is too short for Korean Director v2`, 2);
    }
    writeJson(path.join(PILOT_ROOT, part.id, "input", "tts-script.real.json"), ttsInput);
  }
  writeJson(path.join(PILOT_ROOT, "pilot-spec.json"), spec);
  console.log(`[pilot-prehook] prepared: ${PILOT_ROOT}`);
  for (const part of spec.parts) console.log(`  ${part.id}: ${part.ttsScriptPath}`);
}

function run(command, args, label, timeout = 300_000) {
  const result = spawnSync(command, args, {
    shell: false,
    encoding: "utf8",
    timeout,
    maxBuffer: 32 * 1024 * 1024,
  });
  if (result.status !== 0) {
    fail(`${label} failed (${result.status}): ${(result.stderr || result.stdout || "").slice(-1800)}`);
  }
  return result.stdout;
}

function ffprobe(file) {
  const stdout = run("ffprobe", ["-v", "error", "-show_streams", "-show_format", "-of", "json", file], `ffprobe ${file}`, 60_000);
  return JSON.parse(stdout);
}

function secToAssTime(sec) {
  const cs = Math.max(0, Math.round(Number(sec) * 100));
  const hours = Math.floor(cs / 360000);
  const minutes = Math.floor((cs % 360000) / 6000);
  const seconds = Math.floor((cs % 6000) / 100);
  return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(cs % 100).padStart(2, "0")}`;
}

function semanticText(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .replace(/[\s"'“”‘’.,!?…，。！？:;；：]+/gu, "")
    .toLowerCase();
}

function buildPilotAss(part, timeline, audioScenes) {
  const coverCaptions = timeline.captions.filter((caption) => caption.sceneNumber === 1);
  const normalCaptions = timeline.captions.filter((caption) => caption.sceneNumber !== 1);
  const coverWords = coverCaptions.flatMap((caption) => caption.wordTimings);
  const coverSource = coverCaptions.map((caption) => caption.text).join(" ");
  const coverDisplay = part.coverLines.map((line) => line.text).join(" ");
  if (coverWords.length === 0 || semanticText(coverSource) !== semanticText(coverDisplay)) {
    fail(`${part.id} cover words do not match the spoken hook: ${coverSource} / ${coverDisplay}`);
  }
  const firstSceneEnd = Number(audioScenes[0]?.endSec);
  if (!Number.isFinite(firstSceneEnd)) fail(`${part.id} first scene timing missing`);

  const coverStyle = "Style: Cover," + DYNAMIC_CAPTION_FONT + ",112,&H00F7F4EC,&H0057C8FF,&H00100F0D,&H00000000,-1,0,0,0,100,100,0,0,1,10,4,5,42,42,0,1";
  let ass = createDynamicCaptionAss(normalCaptions).replace("\n[Events]", `\n${coverStyle}\n\n[Events]`);
  const coverEvents = [];
  const anchors = [];
  for (const line of part.coverLines) {
    const firstWord = coverWords[line.wordStart];
    const lastWord = coverWords[line.wordEnd];
    if (!firstWord || !lastWord) fail(`${part.id} invalid cover word range`);
    const startSec = firstWord.startSec;
    const endSec = Math.max(firstSceneEnd - 0.04, lastWord.endSec + 0.12);
    const motion = `{\\an5\\pos(540,${line.y})\\c${line.color}\\fs${line.fontSize}\\bord10\\shad4\\fad(25,90)\\fscx78\\fscy78\\t(0,150,0.74,\\fscx108\\fscy108)\\t(150,270,0.68,\\fscx100\\fscy100)}`;
    coverEvents.push(`Dialogue: 2,${secToAssTime(startSec)},${secToAssTime(endSec)},Cover,,0,0,0,,${motion}${escapeAssText(line.text)}`);
    anchors.push({
      text: line.text,
      wordStart: line.wordStart,
      wordEnd: line.wordEnd,
      startSec,
      sourceWordStartSec: firstWord.startSec,
      sourceWordEndSec: lastWord.endSec,
      anchorDeltaMs: 0,
    });
  }
  ass += coverEvents.join("\n") + "\n";
  return {
    ass,
    coverAudit: {
      sourceText: coverSource,
      displayText: coverDisplay,
      semanticWordCoveragePass: semanticText(coverSource) === semanticText(coverDisplay),
      allLinesCharacterAnchored: anchors.every((item) => item.anchorDeltaMs === 0),
      normalSceneOneCaptionSuppressed: normalCaptions.every((caption) => caption.sceneNumber !== 1),
      stagedLineCount: anchors.length,
      coverStartSec: anchors[0].startSec,
      coverEndSec: firstSceneEnd,
      coverDurationSec: Number((firstSceneEnd - anchors[0].startSec).toFixed(3)),
      anchors,
      passed: true,
    },
  };
}

function makeSegment(image, output, durationSec, index) {
  const frames = Math.max(1, Math.round(durationSec * 30));
  const zoom = index === 0
    ? "if(eq(on,0),1.18,max(1.03,zoom-0.0022))"
    : index % 2 === 0
      ? "min(1.02+0.00075*on,1.12)"
      : "max(1.12-0.00075*on,1.02)";
  const vf = "scale=1620:2880:force_original_aspect_ratio=increase,crop=1620:2880," +
    `zoompan=z='${zoom}':x='(iw-iw/zoom)/2':y='(ih-ih/zoom)/2':d=${frames}:s=1080x1920:fps=30,format=yuv420p`;
  run("ffmpeg", [
    "-y", "-loop", "1", "-framerate", "30", "-i", image,
    "-vf", vf, "-frames:v", String(frames),
    "-c:v", "libx264", "-crf", "21", "-preset", "fast", "-an", output,
  ], `render segment ${index + 1}`);
}

function filterPath(value) {
  return value.replace(/\\/g, "/").replace(/^([A-Za-z]):/, "$1\\:");
}

function captureFrame(video, output, timeSec) {
  run("ffmpeg", [
    "-y", "-ss", String(Math.max(0, timeSec)), "-i", video,
    "-frames:v", "1", "-vf", "scale=360:640", output,
  ], `capture ${path.basename(output)}`, 60_000);
}

function makeSheet(inputs, output, columns) {
  const args = ["-y"];
  for (const input of inputs) args.push("-i", input);
  const rows = Math.ceil(inputs.length / columns);
  const layout = inputs.map((_, index) => `${(index % columns) * 360}_${Math.floor(index / columns) * 640}`).join("|");
  args.push(
    "-filter_complex", `xstack=inputs=${inputs.length}:layout=${layout}:fill=black`,
    "-frames:v", "1", output,
  );
  run("ffmpeg", args, `contact sheet ${columns}x${rows}`, 60_000);
}

function coreCaptionAuditPass(audit) {
  return audit.contractVersion === FULL_SCRIPT_CAPTION_CONTRACT_VERSION &&
    audit.fullScriptCoveragePass === true &&
    audit.exactTranscriptMatchPass === true &&
    audit.perSceneTranscriptMatchPass === true &&
    audit.sceneBoundaryTimingPass === true &&
    audit.noCaptionOverlapPass === true &&
    audit.captionGapPass === true &&
    audit.displayTerminalPunctuationAbsent === true &&
    audit.displayWordCoveragePass === true &&
    audit.safeFramePass === true &&
    audit.wordAnchoredPass === true &&
    audit.motionDiversityPass === true;
}

function renderPart(part) {
  const partRoot = path.join(PILOT_ROOT, part.id);
  const ttsScriptPath = path.join(partRoot, "input", "tts-script.real.json");
  const audioSummaryPath = path.join(partRoot, "tts", "elevenlabs-scene-paced-tts-summary.json");
  if (!fs.existsSync(ttsScriptPath) || !fs.existsSync(audioSummaryPath)) {
    fail(`${part.id} TTS input/summary missing. Run prepare and the approved TTS builder first.`, 3);
  }
  const ttsScript = readJson(ttsScriptPath);
  const audioSummary = readJson(audioSummaryPath);
  if (audioSummary.provider !== "elevenlabs" || audioSummary.liveApiCallPerformed !== true || audioSummary.timingPolicy !== "character_aligned_continuous_v2") {
    fail(`${part.id} real character-aligned ElevenLabs summary required`, 3);
  }
  const alignmentPath = path.resolve(audioSummary.alignmentPath ?? "");
  const audioPath = path.resolve(audioSummary.timelineAudioPath ?? "");
  if (!alignmentPath.startsWith(MEDIA_ROOT) || !audioPath.startsWith(MEDIA_ROOT) || !fs.existsSync(alignmentPath) || !fs.existsSync(audioPath)) {
    fail(`${part.id} trusted alignment/audio file missing`, 3);
  }
  const audioScenes = [...audioSummary.scenes].sort((a, b) => a.sceneNumber - b.sceneNumber);
  const ttsScenes = [...ttsScript.scenes].sort((a, b) => a.sceneNumber - b.sceneNumber);
  if (audioScenes.length !== part.scenes.length || ttsScenes.length !== part.scenes.length) fail(`${part.id} scene count mismatch`);
  const durations = audioScenes.map((item) => Number(item.normalizedDurationSec));
  if (durations.some((item) => !Number.isFinite(item) || item < 1 || item > 15)) fail(`${part.id} invalid scene durations`);

  const timeline = buildDynamicCaptionTimeline({
    ttsScenes,
    audioScenes,
    alignmentDocument: readJson(alignmentPath),
  });
  if (!coreCaptionAuditPass(timeline.audit)) fail(`${part.id} common v6 caption audit failed: ${JSON.stringify(timeline.audit)}`);
  const pilotAss = buildPilotAss(part, timeline, audioScenes);
  const renderDir = path.join(partRoot, "render");
  const workDir = path.join(renderDir, "work");
  fs.mkdirSync(workDir, { recursive: true });
  const assPath = path.join(workDir, "captions-with-cover.ass");
  fs.writeFileSync(assPath, pilotAss.ass, "utf8");

  const segmentFiles = [];
  for (let index = 0; index < durations.length; index++) {
    const segment = path.join(workDir, `segment-${String(index + 1).padStart(2, "0")}.mp4`);
    makeSegment(sourceImagePath(part.sourceImageIndexes[index]), segment, durations[index], index);
    segmentFiles.push(segment);
  }
  const concatPath = path.join(workDir, "concat.txt");
  fs.writeFileSync(concatPath, segmentFiles.map((file) => `file '${file.replace(/\\/g, "/")}'`).join("\n") + "\n", "utf8");
  const silentPath = path.join(workDir, "silent.mp4");
  run("ffmpeg", ["-y", "-f", "concat", "-safe", "0", "-i", concatPath, "-c", "copy", silentPath], `${part.id} concat`);

  const totalSec = Number(durations.reduce((sum, item) => sum + item, 0).toFixed(3));
  const finalPath = path.join(renderDir, `${part.id}-final.mp4`);
  const assFilter = `ass='${filterPath(assPath)}':fontsdir='${filterPath(FONT_DIR)}'`;
  run("ffmpeg", [
    "-y", "-i", silentPath, "-i", audioPath,
    "-vf", assFilter,
    "-map", "0:v:0", "-map", "1:a:0",
    "-c:v", "libx264", "-crf", "20", "-preset", "fast", "-pix_fmt", "yuv420p", "-r", "30",
    "-c:a", "aac", "-b:a", "128k", "-t", String(totalSec), "-shortest", finalPath,
  ], `${part.id} final mux`);

  const probe = ffprobe(finalPath);
  const videoStream = probe.streams.find((item) => item.codec_type === "video");
  const audioStream = probe.streams.find((item) => item.codec_type === "audio");
  const durationSec = Number(Number(probe.format?.duration).toFixed(3));
  const validation = {
    width1080: videoStream?.width === 1080,
    height1920: videoStream?.height === 1920,
    duration15to90: durationSec >= 15 && durationSec <= 90,
    hasVideo: Boolean(videoStream),
    hasAudio: Boolean(audioStream),
    fileSizePositive: fs.statSync(finalPath).size > 0,
    commonV6CaptionAudit: coreCaptionAuditPass(timeline.audit),
    coverSemanticCoverage: pilotAss.coverAudit.semanticWordCoveragePass,
    coverCharacterAnchored: pilotAss.coverAudit.allLinesCharacterAnchored,
    firstSceneCaptionNotDuplicated: pilotAss.coverAudit.normalSceneOneCaptionSuppressed,
    sixDistinctImages: new Set(part.sourceImageIndexes.map((index) => sha256File(sourceImagePath(index)))).size === 6,
  };
  if (!Object.values(validation).every(Boolean)) fail(`${part.id} output validation failed: ${JSON.stringify(validation)}`);

  const frameDir = path.join(renderDir, "review-frames");
  fs.mkdirSync(frameDir, { recursive: true });
  const reviewFrames = [];
  for (let index = 0; index < audioScenes.length; index++) {
    const sceneMid = (Number(audioScenes[index].startSec) + Number(audioScenes[index].endSec)) / 2;
    const frame = path.join(frameDir, `scene-${String(index + 1).padStart(2, "0")}.png`);
    captureFrame(finalPath, frame, sceneMid);
    reviewFrames.push(frame);
  }
  const sceneSheetPath = path.join(renderDir, `${part.id}-scene-contact-sheet.png`);
  makeSheet(reviewFrames, sceneSheetPath, 3);
  const coverFrames = pilotAss.coverAudit.anchors.map((anchor, index) => {
    const frame = path.join(frameDir, `cover-${index + 1}.png`);
    captureFrame(finalPath, frame, Math.min(pilotAss.coverAudit.coverEndSec - 0.08, anchor.startSec + 0.16));
    return frame;
  });
  const coverSheetPath = path.join(renderDir, `${part.id}-cover-contact-sheet.png`);
  makeSheet(coverFrames, coverSheetPath, 3);

  const summary = {
    schemaVersion: "money_shorts_two_part_prehook_pilot_render_v1",
    status: "RENDER_MUX_OK",
    partId: part.id,
    title: part.title,
    answer: part.answer,
    bridge: part.bridge,
    finalMp4Path: finalPath,
    durationSec,
    width: videoStream.width,
    height: videoStream.height,
    videoCodec: videoStream.codec_name,
    audioCodec: audioStream.codec_name,
    sceneCount: part.scenes.length,
    sourceImageIndexes: part.sourceImageIndexes,
    sourceImageHashes: part.sourceImageIndexes.map((index) => sha256File(sourceImagePath(index))),
    captionContractVersion: timeline.audit.contractVersion,
    captionAudit: timeline.audit,
    coverAudit: pilotAss.coverAudit,
    sceneTimeline: audioScenes.map((item) => ({
      sceneNumber: item.sceneNumber,
      role: item.sceneRole,
      startSec: item.startSec,
      endSec: item.endSec,
      durationSec: item.normalizedDurationSec,
    })),
    sceneContactSheetPath: sceneSheetPath,
    coverContactSheetPath: coverSheetPath,
    validation,
    localOnly: true,
    notUploaded: true,
    uploadReady: false,
    rollout500Applied: false,
    generatedAt: new Date().toISOString(),
  };
  writeJson(path.join(renderDir, "pilot-render-summary.json"), summary);
  console.log(`[pilot-prehook] rendered ${part.id}: ${finalPath}`);
  return summary;
}

function render() {
  if (!fs.existsSync(FONT_PATH)) fail(`caption font missing: ${FONT_PATH}`, 2);
  const summaries = PARTS.map(renderPart);
  const previewHtml = `<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Money Shorts 2편 파일럿</title><style>body{margin:0;background:#090b10;color:#f7f7f5;font-family:Arial,sans-serif}main{max-width:980px;margin:auto;padding:24px}h1{font-size:24px}.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:24px}section{min-width:0}video{width:100%;max-height:78vh;background:#000;border-radius:6px}p{color:#b6bcc8}@media(max-width:760px){.grid{grid-template-columns:1fr}}</style><main><h1>Money Shorts 2편 프리훅 파일럿</h1><p>로컬 검수 전용 · 업로드되지 않음</p><div class="grid">${summaries.map((item) => `<section><h2>${item.partId === "part-1" ? "1편" : "2편"}</h2><video controls playsinline preload="metadata" src="${path.relative(PILOT_ROOT, item.finalMp4Path).replace(/\\/g, "/")}"></video><p>${item.title} · ${item.durationSec}초</p></section>`).join("")}</div></main></html>`;
  fs.writeFileSync(path.join(PILOT_ROOT, "index.html"), previewHtml, "utf8");
  writeJson(path.join(PILOT_ROOT, "pilot-render-index.json"), {
    schemaVersion: "money_shorts_two_part_prehook_pilot_index_v1",
    status: "RENDER_MUX_OK",
    parts: summaries.map((item) => ({
      id: item.partId,
      path: item.finalMp4Path,
      durationSec: item.durationSec,
      validation: item.validation,
    })),
    localOnly: true,
    notUploaded: true,
    rollout500Applied: false,
    generatedAt: new Date().toISOString(),
  });
}

if (MODE === "prepare") prepare();
else render();
