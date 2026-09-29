#!/usr/bin/env node

/**
 * 부엉이 6편/7편에 소급 추가하는 오프닝 씬에 자막을 입힌다.
 *
 * 8~9편에서 신설된 오프닝 템플릿("안녕, 난 매일 경제 뉴스를 콕 집어 전해주는
 * 부엉박사야! 오늘은 [주제] 얘기해볼게.")을 6, 7편에도 소급 적용하면서, 오프닝
 * 전용 TTS(패딩 3~5개 + 실제 오프닝 1개)에서 오프닝 구간만 잘라 자막을 입힌다.
 * 헤더 타이틀과 CTA 카드 오버레이는 없음(오프닝 자체가 주제를 육성으로 예고).
 *
 * 사용:
 *   node scripts/run-owl-opening-retrofit-caption-assemble-once.mjs \
 *     --episode 6 \
 *     --tts-script "C:/tmp/money-shorts-os/owl-ep6-opening-tts/owl-ep6-opening-tts-script.json" \
 *     --audio-summary "C:/tmp/money-shorts-os/owl-ep6-opening-tts/output-v1/elevenlabs-scene-paced-tts-summary.json" \
 *     --muxed-video "C:/tmp/owl-ep6-ep7-opening-final/owl_ep6_opening_muxed.mp4" \
 *     --out-dir "C:/tmp/owl-ep6-ep7-opening-final" \
 *     --final-out-name "owl_ep6_opening_captioned.mp4"
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildDynamicCaptionTimeline, escapeAssText } from "./_money-shorts-dynamic-captions.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");

function getArg(name) {
  const i = process.argv.indexOf(name);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : null;
}

const EPISODE = getArg("--episode");
const TTS_SCRIPT_PATH = getArg("--tts-script");
const AUDIO_SUMMARY_PATH = getArg("--audio-summary");
const MUXED_VIDEO = getArg("--muxed-video");
const OUT_DIR = getArg("--out-dir") || "C:/tmp/owl-ep6-ep7-opening-final";
const FINAL_OUT_NAME = getArg("--final-out-name") || `owl_ep${EPISODE}_opening_captioned.mp4`;
const FINAL_OUT = path.join(OUT_DIR, FINAL_OUT_NAME);
// 오디오를 mux 단계에서 alignment상 발화 시작 시각보다 더 이르게 자른 만큼
// (자음 어택 보존을 위해 태그 마커 구간까지 포함해 넉넉히 자른 뒤
// silenceremove로 트림) 자막 시작도 그만큼 당겨야 한다. 양수 = 자막이
// 더 일찍(왼쪽으로) 이동.
const EARLY_START_SEC = Number(getArg("--early-start-sec") || "0");

const CAPTION_FONTS_DIR = path.join(REPO_ROOT, "assets", "fonts");
const CAPTION_FONT_PATH = path.join(CAPTION_FONTS_DIR, "BlackHanSans.ttf");

function log(m) {
  console.log(`[${new Date().toISOString().slice(11, 19)}][owl-ep${EPISODE}-opening-caption] ${m}`);
}
function run(bin, args) {
  const r = spawnSync(bin, args, { encoding: "utf8", maxBuffer: 1024 * 1024 * 32 });
  if (r.status !== 0) {
    console.error(`FAILED: ${bin} ${args.slice(0, 8).join(" ")} …`);
    console.error((r.stderr || "").slice(-2000));
    process.exit(1);
  }
  return r.stdout ?? "";
}
function probeDuration(file) {
  const out = run("ffprobe", [
    "-v", "error", "-show_entries", "format=duration",
    "-of", "default=noprint_wrappers=1:nokey=1", file,
  ]);
  const d = Number.parseFloat(out.trim());
  if (!Number.isFinite(d)) {
    console.error(`ABORT: duration을 읽지 못했습니다: ${file}`);
    process.exit(1);
  }
  return d;
}

for (const p of [TTS_SCRIPT_PATH, AUDIO_SUMMARY_PATH, MUXED_VIDEO, CAPTION_FONT_PATH]) {
  if (!p || !fs.existsSync(p)) {
    console.error(`ABORT: 필요한 파일이 없습니다: ${p}`);
    process.exit(1);
  }
}

const ttsScript = JSON.parse(fs.readFileSync(TTS_SCRIPT_PATH, "utf8"));
const summary = JSON.parse(fs.readFileSync(AUDIO_SUMMARY_PATH, "utf8"));
const audioScenes = summary.scenes;
if (!Array.isArray(audioScenes) || audioScenes.length !== ttsScript.scenes.length) {
  console.error("ABORT: summary와 tts-script의 장면 수가 다릅니다.");
  process.exit(1);
}
const alignmentPath = summary.alignmentPath;
if (!alignmentPath || !fs.existsSync(alignmentPath)) {
  console.error(`ABORT: alignment 파일이 없습니다: ${alignmentPath}`);
  process.exit(1);
}
const alignmentDocument = JSON.parse(fs.readFileSync(alignmentPath, "utf8"));

const targetScene = ttsScript.scenes.find((s) => s.sceneRole === "opening");
if (!targetScene) {
  console.error(`ABORT: sceneRole="opening" 장면을 찾지 못했습니다.`);
  process.exit(1);
}
const targetAudioScene = audioScenes.find((s) => s.sceneRole === "opening");
const sceneOffsetSec = Number(targetAudioScene.startSec);
log(`대상 장면 번호=${targetScene.sceneNumber}, 원본 타임코드=${targetAudioScene.startSec}~${targetAudioScene.endSec}s`);

const timelineResult = buildDynamicCaptionTimeline({
  ttsScenes: ttsScript.scenes,
  audioScenes,
  alignmentDocument,
});

const sceneCaptions = timelineResult.captions.filter((c) => Number(c.sceneNumber) === targetScene.sceneNumber);
if (sceneCaptions.length === 0) {
  console.error("ABORT: 대상 장면의 캡션 블록을 찾지 못했습니다.");
  process.exit(1);
}
log(`캡션 블록 ${sceneCaptions.length}개`);

function applyDisplayText(captions, ttsScenes) {
  const displayWordsByScene = new Map();
  for (const scene of ttsScenes) {
    const display = scene.captionDisplayText;
    if (!display) continue;
    displayWordsByScene.set(Number(scene.sceneNumber), {
      spoken: scene.speechDirection.performanceText.split(/\s+/),
      display: display.split(/\s+/),
    });
  }
  return captions.map((caption) => {
    const pair = displayWordsByScene.get(caption.sceneNumber);
    if (!pair || pair.spoken.length !== pair.display.length) return caption;
    const blockWords = caption.text.split(/\s+/);
    const startIndex = findWordOffset(pair.spoken, blockWords);
    if (startIndex < 0) return caption;
    const replaced = pair.display.slice(startIndex, startIndex + blockWords.length);
    if (replaced.length !== blockWords.length) return caption;
    return rebuildCaptionText(caption, replaced);
  });
}
function findWordOffset(spokenWords, blockWords) {
  for (let i = 0; i + blockWords.length <= spokenWords.length; i += 1) {
    let match = true;
    for (let j = 0; j < blockWords.length; j += 1) {
      if (spokenWords[i + j] !== blockWords[j]) { match = false; break; }
    }
    if (match) return i;
  }
  return -1;
}
function rebuildCaptionText(caption, words) {
  const lineWordCounts = (caption.displayLines ?? [caption.displayText]).map(
    (line) => String(line).split(/\s+/).filter(Boolean).length,
  );
  const lines = [];
  let cursor = 0;
  for (const count of lineWordCounts) {
    lines.push(words.slice(cursor, cursor + count).join(" "));
    cursor += count;
  }
  if (cursor < words.length) lines[lines.length - 1] += " " + words.slice(cursor).join(" ");
  const lineVisuals = (caption.lineVisuals ?? []).map((visual, index) => ({
    ...visual,
    text: lines[index] ?? visual.text,
  }));
  return {
    ...caption,
    text: words.join(" "),
    displayText: words.join(" "),
    displayLines: lines,
    lineVisuals: lineVisuals.length > 0 ? lineVisuals : caption.lineVisuals,
  };
}

const CAPTION_MAX_WIDTH_PX = 920;
const CAPTION_FONT_SIZE = 88;
const CAPTION_FIXED_X = 540;
const CAPTION_FIXED_Y = 1500;

const DETERMINER_PATTERN = /^(한|두|세|네|다섯|여섯|일곱|여덟|아홉|열|그|이|저|또|몇)$/u;

const EMPHASIS_KEY_TERMS = ["부엉박사"];

function findEmphasisSpan(word) {
  for (const t of EMPHASIS_KEY_TERMS) {
    const i = word.indexOf(t);
    if (i >= 0) return { kind: "key", start: i, end: i + t.length };
  }
  return null;
}
function emphasisMapFor(line) {
  const words = line.split(/\s+/).filter(Boolean);
  const hits = [];
  words.forEach((word, index) => {
    const span = findEmphasisSpan(word);
    if (span) hits.push({ index, ...span, priority: 2 });
  });
  const picked = hits.sort((a, b) => a.priority - b.priority).slice(0, 2);
  return Object.fromEntries(picked.map((hit) => [hit.index, hit]));
}
function textWidthRatio(text) {
  let ratio = 0;
  for (const char of String(text)) {
    if (char === " ") ratio += 0.3;
    else if (/[0-9A-Za-z.%,→]/.test(char)) ratio += 0.55;
    else ratio += 1;
  }
  return ratio;
}
function wrapToLines(text, fontSize, maxWidth) {
  const words = String(text).split(/\s+/).filter(Boolean);
  if (words.length === 0) return [String(text)];
  if (words.length === 1 || textWidthRatio(words.join(" ")) * fontSize <= maxWidth) {
    return [words.join(" ")];
  }
  let best = null;
  for (let split = 1; split < words.length; split += 1) {
    if (DETERMINER_PATTERN.test(words[split - 1])) continue;
    const left = words.slice(0, split).join(" ");
    const right = words.slice(split).join(" ");
    const leftWidth = textWidthRatio(left) * fontSize;
    const rightWidth = textWidthRatio(right) * fontSize;
    if (leftWidth > maxWidth || rightWidth > maxWidth) continue;
    const score = Math.abs(leftWidth - rightWidth);
    if (!best || score < best.score) best = { score, lines: [left, right] };
  }
  return best ? best.lines : null;
}
function stripTrailingPunctuation(text) {
  return String(text).replace(/[,.·…]+$/u, "").trimEnd();
}
function toStyledCaption(caption, cleaned, lines) {
  const lineVisuals = lines.map((line) => ({ text: line, emphasisByWordIndex: emphasisMapFor(line) }));
  return { ...caption, x: CAPTION_FIXED_X, y: CAPTION_FIXED_Y, fontSize: CAPTION_FONT_SIZE, displayText: cleaned, lineVisuals, displayLines: lines };
}
function wrapToLinesForced(text, fontSize, maxWidth) {
  const words = String(text).split(/\s+/).filter(Boolean);
  if (words.length <= 1) return [text];
  let best = null;
  for (let split = 1; split < words.length; split += 1) {
    if (DETERMINER_PATTERN.test(words[split - 1])) continue;
    const left = words.slice(0, split).join(" ");
    const right = words.slice(split).join(" ");
    const score = Math.abs(textWidthRatio(left) - textWidthRatio(right));
    if (!best || score < best.score) best = { score, lines: [left, right] };
  }
  if (!best) {
    const split = Math.ceil(words.length / 2);
    return [words.slice(0, split).join(" "), words.slice(split).join(" ")];
  }
  return best.lines;
}
function splitCaptionIntoScreenSafeBlocks(caption) {
  const cleaned = stripTrailingPunctuation(caption.displayText);
  const fitLines = wrapToLines(cleaned, CAPTION_FONT_SIZE, CAPTION_MAX_WIDTH_PX);
  if (fitLines) return [toStyledCaption(caption, cleaned, fitLines.map(stripTrailingPunctuation))];

  const words = cleaned.split(/\s+/).filter(Boolean);
  const timings = Array.isArray(caption.wordTimings) ? caption.wordTimings : null;
  if (!timings || timings.length !== words.length) {
    const forced = wrapToLinesForced(cleaned, CAPTION_FONT_SIZE, CAPTION_MAX_WIDTH_PX);
    return [toStyledCaption(caption, cleaned, forced.map(stripTrailingPunctuation))];
  }
  for (let parts = 2; parts <= words.length; parts += 1) {
    const groupSize = Math.ceil(words.length / parts);
    const groups = [];
    for (let i = 0; i < words.length; i += groupSize) groups.push(words.slice(i, i + groupSize));
    const groupLines = groups.map((g) => wrapToLines(g.join(" "), CAPTION_FONT_SIZE, CAPTION_MAX_WIDTH_PX));
    if (groupLines.some((lines) => !lines)) continue;
    let cursor = 0;
    return groups.map((group, index) => {
      const startWord = timings[cursor];
      const endWord = timings[cursor + group.length - 1];
      cursor += group.length;
      return toStyledCaption(
        { ...caption, startSec: startWord.startSec, endSec: endWord.endSec },
        stripTrailingPunctuation(group.join(" ")),
        groupLines[index].map(stripTrailingPunctuation),
      );
    });
  }
  const forced = wrapToLinesForced(cleaned, CAPTION_FONT_SIZE, CAPTION_MAX_WIDTH_PX);
  return [toStyledCaption(caption, cleaned, forced.map(stripTrailingPunctuation))];
}
function styleCaptions(captions) {
  return captions.flatMap(splitCaptionIntoScreenSafeBlocks);
}

const CAPTION_WHITE = "&H00FFFFFF";
const CAPTION_CYAN = "&H00E3C452";
const EMPHASIS_COLORS = { key: CAPTION_CYAN };

function secToAssTime(sec) {
  const cs = Math.max(0, Math.round(Number(sec) * 100));
  const h = Math.floor(cs / 360000);
  const m = Math.floor((cs % 360000) / 6000);
  const s = Math.floor((cs % 6000) / 100);
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(cs % 100).padStart(2, "0")}`;
}
function createOwlCaptionAss(captions) {
  const lines = [
    "[Script Info]",
    "Title: Owl Opening Retrofit Captions",
    "ScriptType: v4.00+",
    "PlayResX: 1080",
    "PlayResY: 1920",
    "ScaledBorderAndShadow: yes",
    "WrapStyle: 2",
    "",
    "[V4+ Styles]",
    "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
    `Style: OwlCaption,Black Han Sans,80,${CAPTION_WHITE},${CAPTION_WHITE},&H00000000,&HA0000000,-1,0,0,0,100,100,0,0,1,8,3,5,50,50,0,1`,
    "",
    "[Events]",
    "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
  ];
  for (const caption of captions) {
    const visuals = caption.lineVisuals ?? [{ text: caption.displayText, emphasisByWordIndex: {} }];
    const step = caption.fontSize + 14;
    visuals.forEach((visual, index) => {
      const y = Math.round(caption.y + (index - (visuals.length - 1) / 2) * step);
      const emphasis = visual.emphasisByWordIndex ?? {};
      const body = String(visual.text).split(/\s+/).filter(Boolean).map((word, wordIndex) => {
        const span = emphasis[wordIndex];
        const color = span && EMPHASIS_COLORS[span.kind];
        if (!color) return escapeAssText(word);
        const before = word.slice(0, span.start);
        const target = word.slice(span.start, span.end);
        const after = word.slice(span.end);
        return `${escapeAssText(before)}{\\1c${color}}${escapeAssText(target)}{\\1c${CAPTION_WHITE}}${escapeAssText(after)}`;
      }).join(" ");
      const tags = `{\\an5\\pos(${caption.x},${y})\\fs${caption.fontSize}\\fscx94\\fscy94\\t(0,120,0.7,\\fscx100\\fscy100)}`;
      lines.push(`Dialogue: 0,${secToAssTime(caption.startSec)},${secToAssTime(caption.endSec)},OwlCaption,,0,0,0,,${tags}${body}`);
    });
  }
  return lines.join("\n") + "\n";
}

const styled = styleCaptions(applyDisplayText(sceneCaptions, ttsScript.scenes));

const clipDuration = probeDuration(MUXED_VIDEO);
const netOffsetSec = sceneOffsetSec - EARLY_START_SEC;
const shifted = styled
  .map((c) => ({ ...c, startSec: Number(c.startSec) - netOffsetSec, endSec: Number(c.endSec) - netOffsetSec }))
  .filter((c) => c.startSec < clipDuration)
  .map((c) => ({ ...c, startSec: Math.max(0, c.startSec), endSec: Math.min(clipDuration, c.endSec) }));

log(`클립 길이=${clipDuration.toFixed(2)}s, 자막 블록=${shifted.length}개(오프셋 -${sceneOffsetSec}s + earlyStart ${EARLY_START_SEC}s 적용)`);
shifted.forEach((c) => log(`  [${c.startSec.toFixed(2)}~${c.endSec.toFixed(2)}s] ${c.displayText} (${c.displayLines.length}줄)`));

const overflow = shifted.flatMap((c) =>
  (c.displayLines ?? []).filter((line) => textWidthRatio(line) * c.fontSize > CAPTION_MAX_WIDTH_PX)
    .map((line) => ({ line, width: Math.round(textWidthRatio(line) * c.fontSize) })),
);
const tooManyLines = shifted.filter((c) => (c.displayLines?.length ?? 1) > 2);
if (overflow.length > 0 || tooManyLines.length > 0) {
  console.error(`ABORT: 자막 계약 위반 — 폭초과 ${overflow.length}개, 3줄이상 ${tooManyLines.length}개`);
  console.error(JSON.stringify({ overflow, tooManyLines: tooManyLines.map((c) => c.displayText) }, null, 2));
  process.exit(1);
}

const assPath = path.join(OUT_DIR, `owl_ep${EPISODE}_opening_captions.ass`);
fs.writeFileSync(assPath, createOwlCaptionAss(shifted), "utf8");

const filterPath = (value) => value.replace(/\\/g, "/").replace(/^([A-Za-z]):/, "$1\\:");
const RENDER_WIDTH = 1080;
const RENDER_HEIGHT = 1920;
const vFilters = [
  `scale=${RENDER_WIDTH}:${RENDER_HEIGHT}:flags=lanczos`,
  "setsar=1",
  `ass='${filterPath(assPath)}':fontsdir='${filterPath(CAPTION_FONTS_DIR)}'`,
];
run("ffmpeg", [
  "-y", "-i", MUXED_VIDEO,
  "-vf", vFilters.join(","),
  "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p",
  "-c:a", "aac", "-b:a", "192k",
  "-movflags", "+faststart",
  FINAL_OUT,
]);

log(`완료: ${FINAL_OUT}`);
