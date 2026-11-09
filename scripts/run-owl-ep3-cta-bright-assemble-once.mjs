#!/usr/bin/env node

/**
 * 3편부터 쓰는 밝은 톤 CTA 2클립(follow+teaser)을 영상+음성 mux → 카드/채널명
 * 오버레이 → 자막 합성 → 이어붙이기까지 한 번에 처리한다.
 *
 * run-owl-cta-final-assemble-once.mjs(1·2편 follow 전용, 어두운 톤)는 건드리지
 * 않고 그대로 보존한다 — 이 스크립트는 3편부터 교체되는 밝은 톤 버전 전용이다
 * (2026-09-18 Owner 확정).
 *
 * 입력:
 *   - 영상: C:/tmp/owl-ep3-cta-bright/owl_cta_bright_follow_motion.mp4 (8.0s)
 *           C:/tmp/owl-ep3-cta-bright/owl_cta_bright_teaser_motion.mp4 (8.0s)
 *   - 음성: TTS summary(각 CTA 장면 구간만 트림)
 *
 * 처리:
 *   - follow: 음성(8.86s)이 영상(8.0s)보다 기므로 영상 마지막 프레임을 0.86s
 *     정지(freeze) 확장해 맞춘다(Owner 확정 — Flow 재생성은 크레딧 낭비이자
 *     10초 그리드로 튈 위험이 있어 회피).
 *   - teaser: 음성(5.74s)이 영상(8.0s)보다 짧으므로 그대로 둔다 — 남는 시간은
 *     캐릭터 동작 여운으로 자연스럽게 채워진다.
 *   - 카드 오버레이: follow="팔로우"/"다음 소식도 먼저 받기",
 *     teaser="경제번역소"/"다음 편도 기대해줘" (Owner 확정, TEASER_CARD_OVERLAYS
 *     와 동일 문구를 여기서도 재사용).
 *   - 채널명 하단 워터마크는 두 클립 모두 공통.
 *
 * 사용:
 *   node scripts/run-owl-ep3-cta-bright-assemble-once.mjs
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildDynamicCaptionTimeline, escapeAssText } from "./_money-shorts-dynamic-captions.mjs";
import { OWL_ASSEMBLY_SPEC } from "./_owl-assembly-spec.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");

const OUT_DIR = "C:/tmp/owl-ep3-cta-bright";
const CAPTION_FONTS_DIR = path.join(REPO_ROOT, "assets", "fonts");
const CAPTION_FONT_PATH = path.join(CAPTION_FONTS_DIR, "BlackHanSans.ttf");
const OVERLAY_FONT_FOR_FILTER = CAPTION_FONT_PATH.replace(/\\/g, "/").replace(/^([A-Za-z]):/, "$1\\:");
const RENDER_WIDTH = 1080;
const RENDER_HEIGHT = 1920;

function log(m) {
  console.log(`[${new Date().toISOString().slice(11, 19)}][owl-ep3-cta-bright] ${m}`);
}
function run(bin, args) {
  const r = spawnSync(bin, args, { encoding: "utf8", maxBuffer: 1024 * 1024 * 64 });
  if (r.status !== 0) {
    console.error(`FAILED: ${bin} ${args.slice(0, 12).join(" ")} …`);
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
function escapeDrawtextValue(s) {
  return String(s).replace(/\\/g, "\\\\").replace(/:/g, "\\:").replace(/'/g, "\\'").replace(/%/g, "\\%");
}

// ── 채널명 하단 워터마크 (run-owl-cta-final-assemble-once.mjs와 동일 스타일) ──
const FOOTER_BAR = Object.freeze({ height: 150, bgColor: "black@0.6", textColor: "#FFD54A", textSize: 80 });
function buildChannelFooterFilter() {
  const channel = OWL_ASSEMBLY_SPEC.channelName;
  if (!channel) return [];
  const footerY = RENDER_HEIGHT - FOOTER_BAR.height;
  return [
    `drawbox=x=0:y=${footerY}:w=${RENDER_WIDTH}:h=${FOOTER_BAR.height}:color=${FOOTER_BAR.bgColor}:t=fill`,
    `drawtext=${[
      `fontfile='${OVERLAY_FONT_FOR_FILTER}'`,
      `text='${escapeDrawtextValue(channel)}'`,
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

// ── 상단 제목 헤더 (follow 클립 전용) ──
// run-owl-episode-with-fixed-cta-once.mjs(1·2편 어두운 톤 CTA 조립)에는 이미
// 있던 "CTA 위에도 그 편의 headerTitle을 얹는다" 로직이, 3편 밝은 톤 CTA를
// 새 스크립트로 만들면서 빠져 있었다(Owner 2026-09-18 지적: "CTA 1편 상단에는
// 제목까지 넣기로 했는데 빠져있어"). follow에만 적용한다 — teaser는 예고
// 클립이라 상단 주제 헤더를 넣지 않기로 이미 확정됐다([[teaser 카드 문구
// 확정]] 대화에서 "위에 주제는 빼도 되는데").
const HEADER_BAR = Object.freeze({
  scrimHeight: 420,
  titleColor: "#FFFFFF",
  accentColor: "#FFD54A",
  titleSize: 92,
  topY: 150,
  lineGap: 112,
});
const HEADER_SAFE_WIDTH_PX = 940;
function buildEpisodeHeaderFilters() {
  const title = OWL_ASSEMBLY_SPEC.headerTitle ?? [];
  if (title.length === 0) return [];
  const filters = [];
  const h = HEADER_BAR.scrimHeight;
  filters.push(`geq=lum='if(lt(Y,${h}), lum(X,Y)*(0.45+0.55*Y/${h}), lum(X,Y))':cb='cb(X,Y)':cr='cr(X,Y)'`);
  title.forEach((line, index) => {
    const color = index === title.length - 1 ? HEADER_BAR.accentColor : HEADER_BAR.titleColor;
    const naturalWidth = textWidthRatio(line) * HEADER_BAR.titleSize;
    const lineFontSize = naturalWidth > HEADER_SAFE_WIDTH_PX
      ? Math.floor(HEADER_BAR.titleSize * (HEADER_SAFE_WIDTH_PX / naturalWidth))
      : HEADER_BAR.titleSize;
    filters.push(`drawtext=${[
      `fontfile='${OVERLAY_FONT_FOR_FILTER}'`,
      `text='${escapeDrawtextValue(line)}'`,
      "x=(w-text_w)/2",
      `y=${HEADER_BAR.topY + index * HEADER_BAR.lineGap}`,
      `fontsize=${lineFontSize}`,
      `fontcolor=${color}`,
      "borderw=6",
      "bordercolor=black@0.85",
      "expansion=none",
    ].join(":")}`);
  });
  return filters;
}

// ── 카드 오버레이 (Owner 2026-09-18 확정) ──
const OVERLAY_STYLE = {
  label: { color: "white", box: 1, boxcolor: "black@0.78", boxborderw: 20, scale: 1.25 },
  accent: { color: "#FFD54A", box: 1, boxcolor: "black@0.85", boxborderw: 22, scale: 1.35 },
};
const FOLLOW_CARD_OVERLAYS = [
  { text: "팔로우", x: 150, y: 1090, size: 76, kind: "accent" },
  { text: "다음 소식도 먼저 받기", x: 150, y: 1220, size: 48, kind: "label" },
];
const TEASER_CARD_OVERLAYS = [
  { text: "경제번역소", x: 150, y: 1090, size: 76, kind: "accent" },
  { text: "다음 편도 기대해줘", x: 150, y: 1220, size: 48, kind: "label" },
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

// ── 자막 스타일링 (run-owl-cta-final-assemble-once.mjs와 동일 규칙 재사용) ──
const CAPTION_MAX_WIDTH_PX = 920;
const CAPTION_FONT_SIZE = 88;
const CAPTION_FIXED_X = 540;
const CAPTION_FIXED_Y = 1500;
const EMPHASIS_NUMBER_PATTERNS = [/[0-9]+(?:\.[0-9]+)?%p?/, /[0-9,]+(?:만|천|억|조)?원/, /[0-9]+(?:개월|월|일|년|위)/];
const EMPHASIS_KEY_TERMS = ["여전채", "기준금리", "카드론", "리볼빙", "마이너스통장", "팔로우", "경제번역소", "가계부채", "총량", "대출금리", "변동금리", "고정금리", "규제"];
const EMPHASIS_RISK_TERMS = ["최고", "비싼", "비싸", "늘어", "빠져나갔", "올랐", "오르면", "인상", "경고"];
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
// 의문형/감탄형 부호(?, !)는 보존한다(2026-09-18, run-owl-assemble-shorts-v2.mjs와 동일 수정).
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
function createOwlCaptionAss(captions) {
  const lines = [
    "[Script Info]", "Title: Owl CTA Captions", "ScriptType: v4.00+", "PlayResX: 1080", "PlayResY: 1920", "ScaledBorderAndShadow: yes", "WrapStyle: 2", "",
    "[V4+ Styles]",
    "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
    `Style: OwlCaption,Black Han Sans,80,${CAPTION_WHITE},${CAPTION_WHITE},&H00000000,&HA0000000,-1,0,0,0,100,100,0,0,1,8,3,5,50,50,0,1`,
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
      lines.push(`Dialogue: 0,${secToAssTime(caption.startSec)},${secToAssTime(caption.endSec)},OwlCaption,,0,0,0,,${tags}${body}`);
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

// CTA 오디오 트림이 직전 문장의 끝 pause 없이 정확히 첫 음절 시작점에서 끊겨,
// "어려운"의 "어"·"다음 편엔"의 "다"가 씹혀 들린다는 지적(Owner 2026-09-18).
// 실측해보니 CTA 시작점 직전 0.3~0.4초는 이전 문장의 무음 구간이라, 그 여유를
// 그대로 끌어와 리드인으로 쓰면 인위적 무음 삽입 없이 자연스럽게 해결된다.
const LEAD_IN_SEC = 0.25;

// ── 클립 하나(follow 또는 teaser)를 mux+오버레이+자막까지 처리한다 ──
function assembleClip({ name, videoPath, ttsScriptPath, summaryPath, cardOverlays, freezeExtendToMatchAudio, includeEpisodeHeader }) {
  const ttsScript = JSON.parse(fs.readFileSync(ttsScriptPath, "utf8"));
  const summary = JSON.parse(fs.readFileSync(summaryPath, "utf8"));
  const audioScenes = summary.scenes;
  const alignmentDocument = JSON.parse(fs.readFileSync(summary.alignmentPath, "utf8"));

  const ctaSceneNumber = ttsScript.scenes[ttsScript.scenes.length - 1].sceneNumber;
  const ctaAudioScene = audioScenes[audioScenes.length - 1];
  const ctaSpeechStartSec = Number(ctaAudioScene.startSec);
  const ctaOffsetSec = Math.max(0, ctaSpeechStartSec - LEAD_IN_SEC);
  const ctaAudioDurationSec = Number(ctaAudioScene.endSec) - ctaOffsetSec;
  log(`[${name}] CTA 오디오 구간=${ctaOffsetSec.toFixed(3)}(리드인 ${LEAD_IN_SEC}s 포함)~${ctaAudioScene.endSec}s (${ctaAudioDurationSec.toFixed(2)}s)`);

  const timelineResult = buildDynamicCaptionTimeline({ ttsScenes: ttsScript.scenes, audioScenes, alignmentDocument });
  const ctaCaptions = timelineResult.captions.filter((c) => Number(c.sceneNumber) === ctaSceneNumber);
  if (ctaCaptions.length === 0) { console.error(`ABORT[${name}]: CTA 캡션 블록을 찾지 못했습니다.`); process.exit(1); }

  const videoDurationSec = probeDuration(videoPath);
  let workingVideoPath = videoPath;
  let clipDuration = videoDurationSec;

  if (freezeExtendToMatchAudio && ctaAudioDurationSec > videoDurationSec + 0.01) {
    const extendSec = ctaAudioDurationSec - videoDurationSec;
    const frozenPath = path.join(OUT_DIR, `${name}_freeze_extended.mp4`);
    log(`[${name}] 영상(${videoDurationSec.toFixed(2)}s)이 음성(${ctaAudioDurationSec.toFixed(2)}s)보다 짧아 마지막 프레임을 ${extendSec.toFixed(2)}s 정지 확장합니다.`);
    run("ffmpeg", [
      "-y", "-i", videoPath,
      "-vf", `tpad=stop_mode=clone:stop_duration=${extendSec.toFixed(3)}`,
      "-c:v", "libx264", "-preset", "medium", "-crf", "16", "-pix_fmt", "yuv420p",
      "-an",
      frozenPath,
    ]);
    workingVideoPath = frozenPath;
    clipDuration = probeDuration(frozenPath);
    log(`[${name}] 확장 후 영상 길이=${clipDuration.toFixed(2)}s`);
  }

  // 오디오: CTA 구간만 잘라 별도 파일로 만든다.
  const audioSrcPath = summary.timelineAudioPath;
  const trimmedAudioPath = path.join(OUT_DIR, `${name}_cta_audio_trimmed.m4a`);
  run("ffmpeg", ["-y", "-i", audioSrcPath, "-ss", String(ctaOffsetSec), "-to", String(Number(ctaAudioScene.endSec)), "-c:a", "aac", "-b:a", "192k", trimmedAudioPath]);

  // mux: 영상 길이가 기준이다 — teaser처럼 오디오가 영상보다 짧을 때 영상을
  // 오디오 길이로 잘라버리면 안 된다(2026-09-18 첫 시도에서 -shortest가 8초
  // teaser를 5.76초로 잘라버린 회귀 발견). freeze 확장으로 오디오가 영상보다
  // 길어진 경우(follow)에만 오디오 쪽을 -shortest로 잘라 영상 길이에 맞춘다.
  const muxedPath = path.join(OUT_DIR, `${name}_muxed.mp4`);
  const audioLongerThanVideo = ctaAudioDurationSec > clipDuration + 0.01;
  const muxArgs = ["-y", "-i", workingVideoPath, "-i", trimmedAudioPath, "-map", "0:v:0", "-map", "1:a:0", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k"];
  if (audioLongerThanVideo) muxArgs.push("-shortest");
  else muxArgs.push("-t", String(clipDuration));
  muxArgs.push(muxedPath);
  run("ffmpeg", muxArgs);
  clipDuration = probeDuration(muxedPath);
  log(`[${name}] mux 완료: ${muxedPath} (${clipDuration.toFixed(2)}s)`);

  // 자막 타이밍을 오프셋만큼 당기고 clipDuration으로 클립.
  const styled = styleCaptions(applyDisplayText(ctaCaptions, ttsScript.scenes));
  const shifted = styled
    .map((c) => ({ ...c, startSec: Number(c.startSec) - ctaOffsetSec, endSec: Number(c.endSec) - ctaOffsetSec }))
    .filter((c) => c.startSec < clipDuration)
    .map((c) => ({ ...c, startSec: Math.max(0, c.startSec), endSec: Math.min(clipDuration, c.endSec) }));
  shifted.forEach((c) => log(`  [${name}] [${c.startSec.toFixed(2)}~${c.endSec.toFixed(2)}s] ${c.displayText} (${c.displayLines.length}줄)`));

  const overflow = shifted.flatMap((c) => (c.displayLines ?? []).filter((line) => textWidthRatio(line) * c.fontSize > CAPTION_MAX_WIDTH_PX).map((line) => ({ line })));
  const tooManyLines = shifted.filter((c) => (c.displayLines?.length ?? 1) > 2);
  if (overflow.length > 0 || tooManyLines.length > 0) {
    console.error(`ABORT[${name}]: 자막 계약 위반 — 폭초과 ${overflow.length}개, 3줄이상 ${tooManyLines.length}개`);
    process.exit(1);
  }

  const assPath = path.join(OUT_DIR, `${name}_captions.ass`);
  fs.writeFileSync(assPath, createOwlCaptionAss(shifted), "utf8");

  const filterPath = (value) => value.replace(/\\/g, "/").replace(/^([A-Za-z]):/, "$1\\:");
  const vFilters = [
    `scale=${RENDER_WIDTH}:${RENDER_HEIGHT}:flags=lanczos`,
    "setsar=1",
    ...(includeEpisodeHeader ? buildEpisodeHeaderFilters() : []),
    ...buildChannelFooterFilter(),
    ...buildCardFilters(cardOverlays),
    `ass='${filterPath(assPath)}':fontsdir='${filterPath(CAPTION_FONTS_DIR)}'`,
  ];
  const finalOut = path.join(OUT_DIR, `${name}_final_with_captions.mp4`);
  run("ffmpeg", ["-y", "-i", muxedPath, "-vf", vFilters.join(","), "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", "-c:a", "copy", "-movflags", "+faststart", finalOut]);
  log(`[${name}] 완료: ${finalOut}`);
  return finalOut;
}

const followFinal = assembleClip({
  name: "owl_ep3_cta_bright_follow",
  videoPath: path.join(OUT_DIR, "owl_cta_bright_follow_motion.mp4"),
  ttsScriptPath: "C:/tmp/money-shorts-os/owl-ep3-cta-follow-tts/owl-cta-tts-script.json",
  summaryPath: "C:/tmp/money-shorts-os/owl-ep3-cta-follow-tts/out/elevenlabs-scene-paced-tts-summary.json",
  cardOverlays: FOLLOW_CARD_OVERLAYS,
  freezeExtendToMatchAudio: true,
  includeEpisodeHeader: true,
});

const teaserFinal = assembleClip({
  name: "owl_ep3_cta_bright_teaser",
  videoPath: path.join(OUT_DIR, "owl_cta_bright_teaser_motion.mp4"),
  ttsScriptPath: "C:/tmp/money-shorts-os/owl-ep3-cta-teaser-tts/owl-cta-teaser-tts-script.json",
  summaryPath: "C:/tmp/money-shorts-os/owl-ep3-cta-teaser-tts/out/elevenlabs-scene-paced-tts-summary.json",
  cardOverlays: TEASER_CARD_OVERLAYS,
  freezeExtendToMatchAudio: false,
  includeEpisodeHeader: false,
});

// ── follow + teaser 이어붙이기 ──
const concatListPath = path.join(OUT_DIR, "owl_ep3_cta_bright_concat_list.txt");
const concatList = [followFinal, teaserFinal].map((p) => `file '${p.replace(/\\/g, "/")}'`).join("\n") + "\n";
fs.writeFileSync(concatListPath, concatList, "utf8");
const combinedOut = path.join(OUT_DIR, "owl_ep3_cta_bright_combined.mp4");
run("ffmpeg", ["-y", "-f", "concat", "-safe", "0", "-i", concatListPath, "-c", "copy", combinedOut]);
const combinedDuration = probeDuration(combinedOut);
log(`최종 결합본 완료: ${combinedOut} (${combinedDuration.toFixed(2)}s)`);
