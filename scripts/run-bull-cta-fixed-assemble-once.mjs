#!/usr/bin/env node

/**
 * 황소특보(bull3dv1) 고정 CTA 단일 클립 최종 조립.
 *
 * run-owl-ep3-cta-bright-assemble-once.mjs(부엉박사 follow+teaser 2클립
 * 구조)를 참고하되, 황소특보는 Owner 확정으로 단일 클립(follow+teaser 통합)
 * 이므로 그 구조를 1클립으로 단순화한 버전이다. concat/이어붙이기 단계가
 * 없다 — 이 스크립트 자체가 최종 결과물을 만든다.
 *
 * 입력:
 *   - 영상: --video-path (기본 C:/tmp/bull-cta-fixed-v1/bull_cta_fixed_follow_teaser_motion.mp4)
 *   - 음성: C:/tmp/money-shorts-os/bull-cta-tts/out/elevenlabs-scene-paced-tts-summary.json
 *           (+ bull-cta-tts-script.json)
 *
 * 처리:
 *   - 음성(rawAudioDurationSec 6.5s)이 영상(8초 티어)보다 짧으면 그대로 두고,
 *     영상이 음성보다 짧을 때만 tpad(stop_mode=clone)로 마지막 프레임을 정지
 *     확장한다 — xfade는 어떤 경우에도 사용하지 않는다(Owner 절대 규칙).
 *   - 카드 오버레이: "팔로우"(accent) / "핵심 소식 가장 먼저"(label, "실시간" 제거)
 *     (Owner 확정 문구, 인수인계서 그대로).
 *   - 채널명 하단 워터마크: "경제번역소" 고정(2026-09-23 Owner 정정 — 황소특보는
 *     독립 채널이 아니라 기존 경제번역소 채널 안의 세 번째 캐릭터다. 부엉박사
 *     CTA(run-owl-cta-final-assemble-once.mjs의 buildChannelFooterFilter,
 *     FOOTER_BAR 스타일)와 동일하게 처리).
 *   - 리스크 고지 문구는 이 CTA에 넣지 않는다(별도 확정 사항).
 *   - 상단 주제 헤더(episodeHeader)도 넣지 않는다 — 이 클립은 특정 편 소재와
 *     무관한 채널 고정 CTA이므로 OWL_ASSEMBLY_SPEC.headerTitle을 재사용할
 *     근거가 없다.
 *
 * 사용:
 *   node scripts/run-bull-cta-fixed-assemble-once.mjs [--video-path <mp4>] [--out-dir <dir>]
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

const OUT_DIR = getArg("--out-dir") || "C:/tmp/bull-cta-fixed-v1";
const VIDEO_PATH = getArg("--video-path") || path.join(OUT_DIR, "bull_cta_fixed_follow_teaser_motion.mp4");
const TTS_SCRIPT_PATH = getArg("--tts-script") || "C:/tmp/money-shorts-os/bull-cta-tts/bull-cta-tts-script.json";
const SUMMARY_PATH = getArg("--tts-summary") || "C:/tmp/money-shorts-os/bull-cta-tts/out/elevenlabs-scene-paced-tts-summary.json";
// 2026-09-23 Owner 확정: 나레이션 끝난 뒤 영상이 남으면 0.5초 여백만 남기고
// 나머지는 잘라낸다(캐릭터가 멀뚱히 서 있는 시간 제거).
const TAIL_PAD_SEC = Number(getArg("--tail-pad-sec") ?? 0.5);

const CAPTION_FONTS_DIR = path.join(REPO_ROOT, "assets", "fonts");
const CAPTION_FONT_PATH = path.join(CAPTION_FONTS_DIR, "BlackHanSans.ttf");
const OVERLAY_FONT_FOR_FILTER = CAPTION_FONT_PATH.replace(/\\/g, "/").replace(/^([A-Za-z]):/, "$1\\:");
const RENDER_WIDTH = 1080;
const RENDER_HEIGHT = 1920;

function log(m) {
  console.log(`[${new Date().toISOString().slice(11, 19)}][bull-cta-fixed-assemble] ${m}`);
}
function run(bin, args) {
  const r = spawnSync(bin, args, { encoding: "utf8", maxBuffer: 1024 * 1024 * 64 });
  if (r.status !== 0) {
    console.error(`FAILED: ${bin} ${args.slice(0, 14).join(" ")} …`);
    console.error((r.stderr || "").slice(-3000));
    process.exit(1);
  }
  return r.stdout ?? "";
}
function probeDuration(file) {
  const out = run("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", file]);
  const d = Number.parseFloat(out.trim());
  if (!Number.isFinite(d)) { console.error(`ABORT: duration을 읽지 못했습니다: ${file}`); process.exit(1); }
  return d;
}
function probeStream(file, kind) {
  const out = run("ffprobe", ["-v", "error", "-select_streams", kind, "-show_entries", "stream=duration,codec_type", "-of", "default=noprint_wrappers=1:nokey=1", file]);
  return out.trim();
}
function escapeDrawtextValue(s) {
  return String(s).replace(/\\/g, "\\\\").replace(/:/g, "\\:").replace(/'/g, "\\'").replace(/%/g, "\\%");
}

if (!fs.existsSync(VIDEO_PATH)) {
  console.error(`ABORT: 영상 파일을 찾을 수 없습니다: ${VIDEO_PATH}`);
  process.exit(1);
}
if (!fs.existsSync(TTS_SCRIPT_PATH) || !fs.existsSync(SUMMARY_PATH)) {
  console.error("ABORT: TTS 스크립트 또는 summary json을 찾을 수 없습니다.");
  process.exit(1);
}
fs.mkdirSync(OUT_DIR, { recursive: true });

// ── 채널명 하단 워터마크 (부엉박사 CTA와 동일 스타일 재사용) ──
const CHANNEL_NAME = "경제번역소";
const FOOTER_BAR = Object.freeze({ height: 150, bgColor: "black@0.6", textColor: "#FFD54A", textSize: 80 });
function buildChannelFooterFilter() {
  const footerY = RENDER_HEIGHT - FOOTER_BAR.height;
  return [
    `drawbox=x=0:y=${footerY}:w=${RENDER_WIDTH}:h=${FOOTER_BAR.height}:color=${FOOTER_BAR.bgColor}:t=fill`,
    `drawtext=${[
      `fontfile='${OVERLAY_FONT_FOR_FILTER}'`,
      `text='${escapeDrawtextValue(CHANNEL_NAME)}'`,
      "x=(w-text_w)/2",
      `y=${footerY + Math.round((FOOTER_BAR.height - FOOTER_BAR.textSize) / 2) - 6}`,
      `fontsize=${FOOTER_BAR.textSize}`,
      `fontcolor=${FOOTER_BAR.textColor}`,
      "borderw=4",
      "bordercolor=black@0.8",
      "expansion=none",
    ].join(":")}`,
  ];
}

// ── 카드 오버레이 (인수인계서 확정 문구) ──
const OVERLAY_STYLE = {
  label: { color: "white", box: 1, boxcolor: "black@0.78", boxborderw: 20, scale: 1.25 },
  accent: { color: "#FFD54A", box: 1, boxcolor: "black@0.85", boxborderw: 22, scale: 1.35 },
};
const BULL_CTA_CARD_OVERLAYS = [
  { text: "팔로우", x: 150, y: 1090, size: 76, kind: "accent" },
  { text: "핵심 소식 가장 먼저", x: 150, y: 1220, size: 48, kind: "label" },
];
function buildCardFilters(overlays) {
  return overlays.map((o) => {
    const style = OVERLAY_STYLE[o.kind] ?? OVERLAY_STYLE.label;
    return `drawtext=${[
      `fontfile='${OVERLAY_FONT_FOR_FILTER}'`,
      `text='${escapeDrawtextValue(o.text)}'`,
      `x=${Math.round(o.x)}`,
      `y=${Math.round(o.y)}`,
      `fontsize=${Math.round(o.size * (style.scale ?? 1))}`,
      `fontcolor=${style.color}`,
      `box=${style.box}`,
      `boxcolor=${style.boxcolor}`,
      `boxborderw=${style.boxborderw}`,
      "expansion=none",
    ].join(":")}`;
  });
}

// ── 자막 스타일링 (run-owl-ep3-cta-bright-assemble-once.mjs와 동일 규칙 재사용) ──
const CAPTION_MAX_WIDTH_PX = 920;
const CAPTION_FONT_SIZE = 88;
const CAPTION_FIXED_X = 540;
const CAPTION_FIXED_Y = 1500;
const EMPHASIS_NUMBER_PATTERNS = [/[0-9]+(?:\.[0-9]+)?%p?/, /[0-9,]+(?:만|천|억|조)?원/, /[0-9]+(?:개월|월|일|년|위)/];
const EMPHASIS_KEY_TERMS = ["팔로우", "시황", "황소특보"];
const EMPHASIS_RISK_TERMS = ["놓치면", "손해"];
function findEmphasisSpan(word) {
  for (const pattern of EMPHASIS_NUMBER_PATTERNS) { const m = word.match(pattern); if (m) return { kind: "number", start: m.index, end: m.index + m[0].length }; }
  for (const t of EMPHASIS_RISK_TERMS) { const i = word.indexOf(t); if (i >= 0) return { kind: "risk", start: i, end: i + t.length }; }
  for (const t of EMPHASIS_KEY_TERMS) { const i = word.indexOf(t); if (i >= 0) return { kind: "key", start: i, end: i + t.length }; }
  return null;
}
function emphasisMapFor(line) {
  const words = line.split(/\s+/).filter(Boolean);
  const hits = [];
  words.forEach((word, index) => { const span = findEmphasisSpan(word); if (span) hits.push({ index, ...span, priority: span.kind === "number" ? 0 : span.kind === "risk" ? 1 : 2 }); });
  return Object.fromEntries(hits.sort((a, b) => a.priority - b.priority).slice(0, 2).map((hit) => [hit.index, hit]));
}
function textWidthRatio(text) {
  let ratio = 0;
  for (const char of String(text)) { if (char === " ") ratio += 0.3; else if (/[0-9A-Za-z.%,→]/.test(char)) ratio += 0.55; else ratio += 1; }
  return ratio;
}
function wrapToLines(text, fontSize, maxWidth) {
  const words = String(text).split(/\s+/).filter(Boolean);
  if (words.length === 0) return [String(text)];
  if (words.length === 1 || textWidthRatio(words.join(" ")) * fontSize <= maxWidth) return [words.join(" ")];
  let best = null;
  for (let split = 1; split < words.length; split += 1) {
    const left = words.slice(0, split).join(" "); const right = words.slice(split).join(" ");
    const leftWidth = textWidthRatio(left) * fontSize; const rightWidth = textWidthRatio(right) * fontSize;
    if (leftWidth > maxWidth || rightWidth > maxWidth) continue;
    const score = Math.abs(leftWidth - rightWidth);
    if (!best || score < best.score) best = { score, lines: [left, right] };
  }
  return best ? best.lines : null;
}
function wrapToLinesForced(text, fontSize, maxWidth) {
  const words = String(text).split(/\s+/).filter(Boolean);
  if (words.length <= 1) return [text];
  let best = null;
  for (let split = 1; split < words.length; split += 1) {
    const left = words.slice(0, split).join(" "); const right = words.slice(split).join(" ");
    const score = Math.abs(textWidthRatio(left) - textWidthRatio(right));
    if (!best || score < best.score) best = { score, lines: [left, right] };
  }
  return best.lines;
}
function stripTrailingPunctuation(text) { return String(text).replace(/[,.·…]+$/u, "").trimEnd(); }
function toStyledCaption(caption, cleaned, lines) {
  const lineVisuals = lines.map((line) => ({ text: line, emphasisByWordIndex: emphasisMapFor(line) }));
  return { ...caption, x: CAPTION_FIXED_X, y: CAPTION_FIXED_Y, fontSize: CAPTION_FONT_SIZE, displayText: cleaned, lineVisuals, displayLines: lines };
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
      const startWord = timings[cursor]; const endWord = timings[cursor + group.length - 1];
      cursor += group.length;
      return toStyledCaption({ ...caption, startSec: startWord.startSec, endSec: endWord.endSec }, stripTrailingPunctuation(group.join(" ")), groupLines[index].map(stripTrailingPunctuation));
    });
  }
  const forced = wrapToLinesForced(cleaned, CAPTION_FONT_SIZE, CAPTION_MAX_WIDTH_PX);
  return [toStyledCaption(caption, cleaned, forced.map(stripTrailingPunctuation))];
}
function styleCaptions(captions) { return captions.flatMap(splitCaptionIntoScreenSafeBlocks); }

const CAPTION_WHITE = "&H00FFFFFF";
const CAPTION_AMBER = "&H0057C8FF";
const CAPTION_CYAN = "&H00E3C452";
const CAPTION_RED = "&H004B4BFF";
const EMPHASIS_COLORS = { number: CAPTION_AMBER, key: CAPTION_CYAN, risk: CAPTION_RED };
function secToAssTime(sec) {
  const cs = Math.max(0, Math.round(Number(sec) * 100));
  const h = Math.floor(cs / 360000); const m = Math.floor((cs % 360000) / 6000); const s = Math.floor((cs % 6000) / 100);
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(cs % 100).padStart(2, "0")}`;
}
function createBullCaptionAss(captions) {
  const lines = [
    "[Script Info]", "Title: Bull CTA Captions", "ScriptType: v4.00+", "PlayResX: 1080", "PlayResY: 1920", "ScaledBorderAndShadow: yes", "WrapStyle: 2", "",
    "[V4+ Styles]",
    "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
    `Style: BullCaption,Black Han Sans,80,${CAPTION_WHITE},${CAPTION_WHITE},&H00000000,&HA0000000,-1,0,0,0,100,100,0,0,1,8,3,5,50,50,0,1`,
    "", "[Events]", "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
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
        const before = word.slice(0, span.start); const target = word.slice(span.start, span.end); const after = word.slice(span.end);
        return `${escapeAssText(before)}{\\1c${color}}${escapeAssText(target)}{\\1c${CAPTION_WHITE}}${escapeAssText(after)}`;
      }).join(" ");
      const tags = `{\\an5\\pos(${caption.x},${y})\\fs${caption.fontSize}\\fscx94\\fscy94\\t(0,120,0.7,\\fscx100\\fscy100)}`;
      lines.push(`Dialogue: 0,${secToAssTime(caption.startSec)},${secToAssTime(caption.endSec)},BullCaption,,0,0,0,,${tags}${body}`);
    });
  }
  return lines.join("\n") + "\n";
}

function applyDisplayText(captions, ttsScenes) {
  const displayWordsByScene = new Map();
  for (const scene of ttsScenes) {
    const display = scene.captionDisplayText;
    if (!display) continue;
    displayWordsByScene.set(Number(scene.sceneNumber), { spoken: scene.speechDirection.performanceText.split(/\s+/), display: display.split(/\s+/) });
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
    for (let j = 0; j < blockWords.length; j += 1) { if (spokenWords[i + j] !== blockWords[j]) { match = false; break; } }
    if (match) return i;
  }
  return -1;
}
function rebuildCaptionText(caption, words) {
  const lineWordCounts = (caption.displayLines ?? [caption.displayText]).map((line) => String(line).split(/\s+/).filter(Boolean).length);
  const lines = []; let cursor = 0;
  for (const count of lineWordCounts) { lines.push(words.slice(cursor, cursor + count).join(" ")); cursor += count; }
  if (cursor < words.length) lines[lines.length - 1] += " " + words.slice(cursor).join(" ");
  const lineVisuals = (caption.lineVisuals ?? []).map((visual, index) => ({ ...visual, text: lines[index] ?? visual.text }));
  return { ...caption, text: words.join(" "), displayText: words.join(" "), displayLines: lines, lineVisuals: lineVisuals.length > 0 ? lineVisuals : caption.lineVisuals };
}

// CTA 오디오 트림 시작점 직전 리드인 — run-owl-ep3-cta-bright-assemble-once.mjs와
// 동일 근거(문장 첫 음절이 씹히지 않도록 직전 무음 구간을 리드인으로 사용).
const LEAD_IN_SEC = 0.25;

const ttsScript = JSON.parse(fs.readFileSync(TTS_SCRIPT_PATH, "utf8"));
const summary = JSON.parse(fs.readFileSync(SUMMARY_PATH, "utf8"));
const audioScenes = summary.scenes;
const alignmentDocument = JSON.parse(fs.readFileSync(summary.alignmentPath, "utf8"));

const ctaSceneNumber = ttsScript.scenes[ttsScript.scenes.length - 1].sceneNumber;
const ctaAudioScene = audioScenes[audioScenes.length - 1];
const ctaSpeechStartSec = Number(ctaAudioScene.startSec);
const ctaOffsetSec = Math.max(0, ctaSpeechStartSec - LEAD_IN_SEC);
const ctaAudioDurationSec = Number(ctaAudioScene.endSec) - ctaOffsetSec;
log(`CTA 오디오 구간=${ctaOffsetSec.toFixed(3)}(리드인 ${LEAD_IN_SEC}s 포함)~${ctaAudioScene.endSec}s (${ctaAudioDurationSec.toFixed(2)}s)`);

const timelineResult = buildDynamicCaptionTimeline({ ttsScenes: ttsScript.scenes, audioScenes, alignmentDocument });
const ctaCaptions = timelineResult.captions.filter((c) => Number(c.sceneNumber) === ctaSceneNumber);
if (ctaCaptions.length === 0) { console.error("ABORT: CTA 캡션 블록을 찾지 못했습니다."); process.exit(1); }

const videoDurationSec = probeDuration(VIDEO_PATH);
log(`원본 영상 길이=${videoDurationSec.toFixed(2)}s, CTA 음성 길이=${ctaAudioDurationSec.toFixed(2)}s`);
let workingVideoPath = VIDEO_PATH;
let clipDuration = videoDurationSec;

if (ctaAudioDurationSec > videoDurationSec + 0.01) {
  const extendSec = ctaAudioDurationSec - videoDurationSec;
  const frozenPath = path.join(OUT_DIR, "bull_cta_freeze_extended.mp4");
  log(`영상(${videoDurationSec.toFixed(2)}s)이 음성(${ctaAudioDurationSec.toFixed(2)}s)보다 짧아 마지막 프레임을 ${extendSec.toFixed(2)}s 정지 확장합니다(tpad, xfade 아님).`);
  run("ffmpeg", [
    "-y", "-i", VIDEO_PATH,
    "-vf", `tpad=stop_mode=clone:stop_duration=${extendSec.toFixed(3)}`,
    "-c:v", "libx264", "-preset", "medium", "-crf", "16", "-pix_fmt", "yuv420p",
    "-an",
    frozenPath,
  ]);
  workingVideoPath = frozenPath;
  clipDuration = probeDuration(frozenPath);
  log(`확장 후 영상 길이=${clipDuration.toFixed(2)}s`);
} else {
  log("영상이 음성보다 길거나 같음 — freeze 확장 불필요, 영상 길이 기준으로 진행합니다.");
  const targetDurationSec = ctaAudioDurationSec + TAIL_PAD_SEC;
  if (videoDurationSec > targetDurationSec + 0.01) {
    const trimmedPath = path.join(OUT_DIR, "bull_cta_tail_trimmed.mp4");
    log(`음성 종료 후 ${TAIL_PAD_SEC}s 여백만 남기고 영상을 ${targetDurationSec.toFixed(2)}s로 자릅니다(원본 ${videoDurationSec.toFixed(2)}s).`);
    run("ffmpeg", [
      "-y", "-i", VIDEO_PATH,
      "-t", targetDurationSec.toFixed(3),
      "-c:v", "libx264", "-preset", "medium", "-crf", "16", "-pix_fmt", "yuv420p",
      "-an",
      trimmedPath,
    ]);
    workingVideoPath = trimmedPath;
    clipDuration = probeDuration(trimmedPath);
    log(`트림 후 영상 길이=${clipDuration.toFixed(2)}s`);
  }
}

// 오디오: CTA 구간만 잘라 별도 파일로 만든다.
const audioSrcPath = summary.timelineAudioPath;
const trimmedAudioPath = path.join(OUT_DIR, "bull_cta_audio_trimmed.m4a");
run("ffmpeg", ["-y", "-i", audioSrcPath, "-ss", String(ctaOffsetSec), "-to", String(Number(ctaAudioScene.endSec)), "-c:a", "aac", "-b:a", "192k", trimmedAudioPath]);

// mux: 영상 길이가 기준. freeze 확장으로 오디오가 영상보다 길어진 경우에만
// -shortest로 오디오 쪽을 영상 길이에 맞춰 자른다(run-owl-ep3-cta-bright와 동일 로직).
const muxedPath = path.join(OUT_DIR, "bull_cta_muxed.mp4");
const audioLongerThanVideo = ctaAudioDurationSec > clipDuration + 0.01;
const muxArgs = ["-y", "-i", workingVideoPath, "-i", trimmedAudioPath, "-map", "0:v:0", "-map", "1:a:0", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k"];
if (audioLongerThanVideo) muxArgs.push("-shortest");
else muxArgs.push("-t", String(clipDuration));
muxArgs.push(muxedPath);
run("ffmpeg", muxArgs);
clipDuration = probeDuration(muxedPath);
log(`mux 완료: ${muxedPath} (${clipDuration.toFixed(2)}s)`);

// 자막 타이밍을 오프셋만큼 당기고 clipDuration으로 클립.
const styled = styleCaptions(applyDisplayText(ctaCaptions, ttsScript.scenes));
const shifted = styled
  .map((c) => ({ ...c, startSec: Number(c.startSec) - ctaOffsetSec, endSec: Number(c.endSec) - ctaOffsetSec }))
  .filter((c) => c.startSec < clipDuration)
  .map((c) => ({ ...c, startSec: Math.max(0, c.startSec), endSec: Math.min(clipDuration, c.endSec) }));
shifted.forEach((c) => log(`  [${c.startSec.toFixed(2)}~${c.endSec.toFixed(2)}s] ${c.displayText} (${c.displayLines.length}줄)`));

const overflow = shifted.flatMap((c) => (c.displayLines ?? []).filter((line) => textWidthRatio(line) * c.fontSize > CAPTION_MAX_WIDTH_PX).map((line) => ({ line })));
const tooManyLines = shifted.filter((c) => (c.displayLines?.length ?? 1) > 2);
if (overflow.length > 0 || tooManyLines.length > 0) {
  console.error(`ABORT: 자막 계약 위반 — 폭초과 ${overflow.length}개, 3줄이상 ${tooManyLines.length}개`);
  process.exit(1);
}

const assPath = path.join(OUT_DIR, "bull_cta_captions.ass");
fs.writeFileSync(assPath, createBullCaptionAss(shifted), "utf8");

const filterPath = (value) => value.replace(/\\/g, "/").replace(/^([A-Za-z]):/, "$1\\:");
const vFilters = [
  `scale=${RENDER_WIDTH}:${RENDER_HEIGHT}:flags=lanczos`,
  "setsar=1",
  ...buildChannelFooterFilter(),
  ...buildCardFilters(BULL_CTA_CARD_OVERLAYS),
  `ass='${filterPath(assPath)}':fontsdir='${filterPath(CAPTION_FONTS_DIR)}'`,
];
const finalOut = path.join(OUT_DIR, "bull_cta_fixed_final_with_captions.mp4");
run("ffmpeg", ["-y", "-i", muxedPath, "-vf", vFilters.join(","), "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", "-c:a", "copy", "-movflags", "+faststart", finalOut]);
log(`완료: ${finalOut}`);

const finalVideoDur = probeDuration(finalOut);
const vStream = probeStream(finalOut, "v:0");
const aStream = probeStream(finalOut, "a:0");
log(`최종 검증 — 전체 길이=${finalVideoDur.toFixed(3)}s, video stream=${vStream}, audio stream=${aStream}`);
