#!/usr/bin/env node

/**
 * [폐기 — 재실행 금지] 옛 부엉박사 CTA v1(owl_cta_final_with_captions.mp4)을
 * 만들던 생성기다. 확정 CTA는 이제 owl-cta-fixed-v2/owl_cta_fixed_v2_final_v6.mp4
 * 하나뿐이며(_ai/CURRENT_STANDARDS.md §1), 이 스크립트를 다시 돌리면 폐기된
 * v1 자산이 재생성될 뿐이다. 히스토리 참고용으로만 남겨둔다.
 *
 * 고정 CTA 클립(영상+음성) 위에 동적 자막을 입혀 최종본을 만든다.
 *
 * CTA TTS는 러너의 "4~18장면" 가드를 우회하려고 2편 실제 장면 3개를 패딩으로
 * 앞에 붙여 생성했다(_build-owl-cta-tts-script-once.mjs). 이 스크립트는 그
 * 4장면 전체에 대해 run-owl-assemble-shorts-v2.mjs와 동일한 자막 규칙
 * (_money-shorts-dynamic-captions.mjs)을 적용한 뒤, 마지막 장면(CTA)의 캡션만
 * 골라 오디오 트림 오프셋만큼 시간을 당겨서 CTA 단일 클립용 ASS를 만든다.
 *
 * 사용:
 *   node scripts/run-owl-cta-final-assemble-once.mjs
 *
 * 3편 CTA 확장(2026-09-18 Owner 확정): 이 스크립트는 아직 follow 클립
 * 1개(owl_cta_muxed.mp4) 전용이다. 3편부터는 follow 뒤에 밝은 톤 teaser
 * 클립(owl_cta_bright_teaser_motion.mp4, 8초)을 이어붙인다 — 화면 구성은:
 *   - follow: "팔로우"/"다음 소식도 먼저 받기" 카드 + 하단 채널명(기존 그대로)
 *   - teaser: "경제번역소"/"다음 편도 기대해줘" 카드(TEASER_CARD_OVERLAYS) +
 *     하단 채널명. 상단 주제 헤더는 넣지 않는다.
 * teaser용 TTS/오디오가 준비되면 이 스크립트를 follow+teaser 두 클립을
 * 순회하도록 확장해야 한다(현재는 MUXED_VIDEO 단일 경로만 처리).
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildDynamicCaptionTimeline, escapeAssText } from "./_money-shorts-dynamic-captions.mjs";
import { OWL_ASSEMBLY_SPEC } from "./_owl-assembly-spec.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");

const TTS_SCRIPT_PATH = "C:/tmp/money-shorts-os/owl-cta-tts/owl-cta-tts-script.json";
const AUDIO_SUMMARY_PATH = "C:/tmp/money-shorts-os/owl-cta-tts/out/elevenlabs-scene-paced-tts-summary.json";
// 2026-09-20 Owner 지적으로 재확인: 기존 owl_cta_muxed.mp4는 오디오 트랙이
// 7.36초로 잘려 있었다(원본 TTS는 8.64초) — 자막은 8.64초 전체 타이밍 기준으로
// 만들어졌는데 실제 음성은 7.36초에서 끊겨 마지막 자막 구간이 목소리와
// 어긋났다. owl_cta_muxed_fixed.mp4(8.64초 오디오 그대로, 영상도 8.64초로
// 맞춤)로 교체해 재생성한다. --muxed-video 인자로 다른 경로를 넘기면 사용.
function getArg(name) {
  const i = process.argv.indexOf(name);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : null;
}
const MUXED_VIDEO = getArg("--muxed-video") || "C:/tmp/owl-cta-final/owl_cta_muxed_fixed.mp4";
const OUT_DIR = getArg("--out-dir") || "C:/tmp/owl-cta-final";
const FINAL_OUT_NAME = getArg("--final-out-name") || "owl_cta_final_with_captions.mp4";
const FINAL_OUT = path.join(OUT_DIR, FINAL_OUT_NAME);

const CAPTION_FONTS_DIR = path.join(REPO_ROOT, "assets", "fonts");
const CAPTION_FONT_PATH = path.join(CAPTION_FONTS_DIR, "BlackHanSans.ttf");
const OVERLAY_FONT_FOR_FILTER = CAPTION_FONT_PATH.replace(/\\/g, "/").replace(/^([A-Za-z]):/, "$1\\:");

// CTA는 고정 재사용 클립이라 편마다 다른 상단 제목(headerTitle)은 없다. 하지만
// 하단 채널명 바("경제번역소")는 이 시리즈의 모든 장면에 공통으로 붙는 요소라
// CTA에도 빠지면 안 된다(Owner 지적: "기존 2편 영상엔 화면에 고정글자 밑에
// 채널이름도 있는데 이건 없네" — CTA도 최종 영상에 이어붙는 한 장면이므로 동일).
const FOOTER_BAR = Object.freeze({
  height: 150,
  bgColor: "black@0.6",
  textColor: "#FFD54A",
  textSize: 80,
});

function escapeDrawtextValue(s) {
  return String(s).replace(/\\/g, "\\\\").replace(/:/g, "\\:").replace(/'/g, "\\'").replace(/%/g, "\\%");
}

function buildChannelFooterFilter(renderHeight, renderWidth) {
  const channel = OWL_ASSEMBLY_SPEC.channelName;
  if (!channel) return [];
  const footerY = renderHeight - FOOTER_BAR.height;
  return [
    `drawbox=x=0:y=${footerY}:w=${renderWidth}:h=${FOOTER_BAR.height}:color=${FOOTER_BAR.bgColor}:t=fill`,
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

// "팔로우 / 다른 소식도 먼저 받기" 카드는 CTA가 재사용 클립으로 확정되면서
// 편마다 다시 만들 필요 없는 고정 요소가 됐다(Owner 2026-09-17: "이 문구는
// CTA 기본으로 고정해놓고 각 편별로 주제는 바뀌니까 그건 너가 바꿔서 합성").
// run-owl-assemble-shorts-v2.mjs의 OVERLAY_STYLE(accent/label)과 동일한 스타일,
// _owl-assembly-spec.mjs의 기존 s8_closing 오버레이 좌표(x=150, y=1090/1220)를
// 그대로 재사용해 시각적 일관성을 유지한다.
const OVERLAY_STYLE = {
  label: { color: "white", box: 1, boxcolor: "black@0.78", boxborderw: 20, scale: 1.25 },
  accent: { color: "#FFD54A", box: 1, boxcolor: "black@0.85", boxborderw: 22, scale: 1.35 },
};
const FOLLOW_CARD_OVERLAYS = [
  { text: "팔로우", x: 150, y: 1090, size: 76, kind: "accent" },
  { text: "다음 소식도 먼저 받기", x: 150, y: 1220, size: 48, kind: "label" },
];

// 3편부터 follow 클립 뒤에 이어붙이는 밝은 톤 teaser CTA(8초, Owner 2026-09-18
// 확정) 전용 카드. follow 카드와 같은 좌표·스타일 체계를 쓰되 문구만 바꾼다 —
// "팔로우" 행동 유도는 이미 앞 클립에서 끝났으므로, 여기서는 채널 브랜드를
// 다시 각인시키는 톤으로 채널명(accent) + 다음 편 기대 문구(label)를 쓴다.
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

function log(m) {
  console.log(`[${new Date().toISOString().slice(11, 19)}][owl-cta-final] ${m}`);
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
  if (!fs.existsSync(p)) {
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

// CTA는 항상 마지막 장면(closing_cta → sceneRole: "save").
const ctaSceneNumber = ttsScript.scenes[ttsScript.scenes.length - 1].sceneNumber;
const ctaAudioScene = audioScenes[audioScenes.length - 1];
const ctaOffsetSec = Number(ctaAudioScene.startSec);
log(`CTA 장면 번호=${ctaSceneNumber}, 원본 타임코드=${ctaAudioScene.startSec}~${ctaAudioScene.endSec}s`);

const timelineResult = buildDynamicCaptionTimeline({
  ttsScenes: ttsScript.scenes,
  audioScenes,
  alignmentDocument,
});

const ctaCaptions = timelineResult.captions.filter((c) => Number(c.sceneNumber) === ctaSceneNumber);
if (ctaCaptions.length === 0) {
  console.error("ABORT: CTA 장면의 캡션 블록을 찾지 못했습니다.");
  process.exit(1);
}
log(`CTA 캡션 블록 ${ctaCaptions.length}개`);

// ── 표시 텍스트 치환(숫자·조사 등 낭독형→표시형, CTA엔 숫자 없음이라 보통 동일) ──
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

// ── 크기 고정·강조색·줄바꿈 (run-owl-assemble-shorts-v2.mjs와 동일 규칙) ──
const CAPTION_MAX_WIDTH_PX = 920;
const CAPTION_FONT_SIZE = 88;
const CAPTION_FIXED_X = 540;
const CAPTION_FIXED_Y = 1500;

const EMPHASIS_NUMBER_PATTERNS = [
  /[0-9]+(?:\.[0-9]+)?%p?/,
  /[0-9,]+(?:만|천|억|조)?원/,
  /[0-9]+(?:개월|월|일|년|위)/,
];
const EMPHASIS_KEY_TERMS = [
  "여전채", "기준금리", "카드론", "리볼빙", "마이너스통장", "팔로우",
  "가계부채", "총량", "대출금리", "변동금리", "고정금리", "규제",
];
const EMPHASIS_RISK_TERMS = ["최고", "비싼", "비싸", "늘어", "빠져나갔", "올랐", "오르면", "인상", "경고"];

function findEmphasisSpan(word) {
  for (const pattern of EMPHASIS_NUMBER_PATTERNS) {
    const m = word.match(pattern);
    if (m) return { kind: "number", start: m.index, end: m.index + m[0].length };
  }
  for (const t of EMPHASIS_RISK_TERMS) {
    const i = word.indexOf(t);
    if (i >= 0) return { kind: "risk", start: i, end: i + t.length };
  }
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
    if (span) hits.push({ index, ...span, priority: span.kind === "number" ? 0 : span.kind === "risk" ? 1 : 2 });
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
// 2줄 안에 폭 제한을 지키며 들어갈 때만 분할을 반환하고, 안 되면 null —
// 호출부가 시간축으로 블록을 재분할한다(run-owl-assemble-shorts-v2.mjs와 동일
// 원칙: 절대 폭을 넘기지 않고, 절대 3줄로 넘어가지 않는다).
function wrapToLines(text, fontSize, maxWidth) {
  const words = String(text).split(/\s+/).filter(Boolean);
  if (words.length === 0) return [String(text)];
  if (words.length === 1 || textWidthRatio(words.join(" ")) * fontSize <= maxWidth) {
    return [words.join(" ")];
  }
  let best = null;
  for (let split = 1; split < words.length; split += 1) {
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
// 의문형/감탄형 부호(?, !)는 보존한다(2026-09-18, run-owl-assemble-shorts-v2.mjs와
// 동일 수정 — 쉼표·마침표만 지우려던 게 물음표까지 지워버리는 회귀였다).
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
    const left = words.slice(0, split).join(" ");
    const right = words.slice(split).join(" ");
    const score = Math.abs(textWidthRatio(left) - textWidthRatio(right));
    if (!best || score < best.score) best = { score, lines: [left, right] };
  }
  return best.lines;
}
// 2줄·폭 안에 안 들어가는 블록을 wordTimings로 시간축을 나눠 여러 이벤트로
// 쪼갠다(본편 재검수 2026-09-17: "자막이 화면을 넘어간다" 수정을 CTA에도 동일
// 적용 — 두 스크립트가 로직을 따로 들고 있어 한쪽만 고치면 다시 재발한다).
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
const CAPTION_AMBER = "&H0057C8FF"; // 수치
const CAPTION_CYAN = "&H00E3C452";  // 핵심 개념어(3색 체계)
const CAPTION_RED = "&H004B4BFF";   // 위험·부담
const EMPHASIS_COLORS = { number: CAPTION_AMBER, key: CAPTION_CYAN, risk: CAPTION_RED };

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
    "Title: Owl CTA Captions",
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

const styled = styleCaptions(applyDisplayText(ctaCaptions, ttsScript.scenes));

// CTA 오디오는 원본 타임라인의 ctaOffsetSec 지점부터 잘라 썼으므로, 캡션 시간도
// 그만큼 당긴다. 최종 트림 길이(8.64s)를 벗어나는 캡션은 클립한다.
const clipDuration = probeDuration(MUXED_VIDEO);
const shifted = styled
  .map((c) => ({ ...c, startSec: Number(c.startSec) - ctaOffsetSec, endSec: Number(c.endSec) - ctaOffsetSec }))
  .filter((c) => c.startSec < clipDuration)
  .map((c) => ({ ...c, startSec: Math.max(0, c.startSec), endSec: Math.min(clipDuration, c.endSec) }));

log(`CTA 클립 길이=${clipDuration.toFixed(2)}s, 자막 블록=${shifted.length}개(오프셋 -${ctaOffsetSec}s 적용)`);
shifted.forEach((c) => log(`  [${c.startSec.toFixed(2)}~${c.endSec.toFixed(2)}s] ${c.displayText} (${c.displayLines.length}줄)`));

// 렌더 전에 실측 검증 — 화면 밖으로 나가는 줄이나 3줄 블록이 있으면 즉시 중단.
const overflow = shifted.flatMap((c) =>
  (c.displayLines ?? []).filter((line) => textWidthRatio(line) * c.fontSize > CAPTION_MAX_WIDTH_PX)
    .map((line) => ({ line, width: Math.round(textWidthRatio(line) * c.fontSize) })),
);
const tooManyLines = shifted.filter((c) => (c.displayLines?.length ?? 1) > 2);
if (overflow.length > 0 || tooManyLines.length > 0) {
  console.error(`ABORT: CTA 자막 계약 위반 — 폭초과 ${overflow.length}개, 3줄이상 ${tooManyLines.length}개`);
  console.error(JSON.stringify({ overflow, tooManyLines: tooManyLines.map((c) => c.displayText) }, null, 2));
  process.exit(1);
}

const assPath = path.join(OUT_DIR, "owl_cta_captions.ass");
fs.writeFileSync(assPath, createOwlCaptionAss(shifted), "utf8");

const filterPath = (value) => value.replace(/\\/g, "/").replace(/^([A-Za-z]):/, "$1\\:");
const RENDER_WIDTH = 1080;
const RENDER_HEIGHT = 1920;
// MUXED_VIDEO는 원본 해상도(720x1280)다. 채널 푸터/자막 좌표는 1080x1920
// 기준으로 계산되므로, 오버레이 전에 반드시 업스케일해야 한다 — 이걸 빼먹으면
// drawbox/drawtext가 화면 밖(y=1770 등)에 그려져 아무것도 안 보인다(재검수
// 2026-09-17: "CTA에 채널명 바가 없다" — 실제로는 그려졌지만 화면 밖이었음).
const vFilters = [
  `scale=${RENDER_WIDTH}:${RENDER_HEIGHT}:flags=lanczos`,
  "setsar=1",
  ...buildChannelFooterFilter(RENDER_HEIGHT, RENDER_WIDTH),
  ...buildCardFilters(FOLLOW_CARD_OVERLAYS),
  `ass='${filterPath(assPath)}':fontsdir='${filterPath(CAPTION_FONTS_DIR)}'`,
];
run("ffmpeg", [
  "-y", "-i", MUXED_VIDEO,
  "-vf", vFilters.join(","),
  "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p",
  "-c:a", "copy",
  "-movflags", "+faststart",
  FINAL_OUT,
]);

log(`완료: ${FINAL_OUT}`);
