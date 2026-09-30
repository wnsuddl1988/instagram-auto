#!/usr/bin/env node
/**
 * 고정 CTA(황소특보·부엉박사)를 화면 배치 v2로 다시 입힌다(2026-09-30, Owner "CTA 재제작").
 *
 * 영상·음성은 새로 만들지 않는다. 기존 확정 CTA를 만들 때 쓴 "글자 없는 원본"(영상+음성 mux)과
 * 확정 자막 ASS의 블록 타이밍·문구를 그대로 가져와서, 글자 배치만 v2 기준으로 바꾼다:
 *   - 하단 채널바 없음(휴대폰 UI 가림 구역 y≈1510+ 회피, 본편 v2와 동일)
 *   - 카드("팔로우 / 핵심 소식 가장 먼저" 등)는 왼쪽 두 줄 모양 그대로, 자막과 겹치던 y1090~1300에서
 *     y970~1162로 올림(상단은 결합 때 편 제목 헤더가 얹히는 자리라 비워 둠)
 *   - 자막은 _caption-linebreak-ko 줄바꿈 규칙 + 본편 v2 위치(y1290 / 폭 760 / 글자 84)
 * 부엉박사는 follow·teaser 두 클립을 각각 입힌 뒤 기존 v6과 같은 0.4초 크로스디졸브로 잇는다.
 *
 * 사용:
 *   node scripts/run-cta-layout-v2-rerender-once.mjs --character bull
 *   node scripts/run-cta-layout-v2-rerender-once.mjs --character owl
 * 결과를 본편에 붙이려면 run-owl-episode-with-fixed-cta-once.mjs의
 * KNOWN_CTA_LEADING_SILENCE_TRIM_SEC에 새 경로가 등록돼 있어야 한다.
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { escapeAssText } from "./_money-shorts-dynamic-captions.mjs";
import { textWidthRatio, wrapToLines } from "./_caption-linebreak-ko.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");

function getArg(name) {
  const i = process.argv.indexOf(name);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : null;
}

const CTA_CONFIGS = {
  bull: {
    outDir: "C:/tmp/bull-cta-fixed-v6",
    finalName: "bull_cta_fixed_final_layout_v2.mp4",
    parts: [
      {
        role: "follow",
        muxed: "C:/tmp/bull-cta-fixed-v5/bull_cta_muxed.mp4",
        ass: "C:/tmp/bull-cta-fixed-v5/bull_cta_captions.ass",
        card: { accent: "팔로우", label: "핵심 소식 가장 먼저" },
      },
    ],
    keyTerms: ["팔로우", "황소특보"],
  },
  owl: {
    outDir: "C:/tmp/owl-cta-fixed-v3",
    finalName: "owl_cta_fixed_v3_final_layout_v2.mp4",
    parts: [
      {
        role: "follow",
        muxed: "C:/tmp/owl-cta-fixed-v2/owl_cta_v2_follow_muxed_v5.mp4",
        ass: "C:/tmp/owl-cta-fixed-v2/owl_cta_v2_follow_captions.ass",
        // 기존 블록은 "…뉴스를 내 / 지갑 얘기로…", "다음 / 이야기도"처럼 꾸밈말과 명사가 블록·줄 사이에서
        // 끊기고, "지갑 얘기로 풀어주는 부엉박사야"는 폭 760에 2줄로 안 들어간다. 블록을 다시 나눈다.
        // 시각 = TTS 정렬(owl-cta-fixed-v2-tts/output-v1 alignment) 글자 시각 − 6.24초
        // (기존 ASS 블록 시작 0.69·2.16·4.88이 "어"·"지"·"팔" 글자 시각과 정확히 이 차이로 맞음).
        blockOverrides: [
          { start: 0.69, end: 2.8, text: "어려운 경제 뉴스를 내 지갑 얘기로" }, // 로 끝 9.04
          { start: 2.84, end: 4.8, text: "풀어주는 부엉박사야" }, // 풀 9.08
          { start: 4.88, end: 5.72, text: "팔로우해두면" }, // 팔 11.12, 면 끝 11.92
          { start: 5.76, end: 7.52, text: "다음 이야기도 먼저 만나볼 수 있어" }, // 다 12.00, 끝은 기존 블록과 동일
        ],
        card: { accent: "팔로우", label: "다음 소식도 먼저 받기" },
      },
      {
        role: "teaser",
        muxed: "C:/tmp/owl-cta-fixed-v2/owl_cta_v2_teaser_muxed_v5.mp4",
        ass: "C:/tmp/owl-cta-fixed-v2/owl_cta_v2_teaser_captions.ass",
        // "다음 편엔 우리 지갑을"(832px)이 폭 760을 넘어 첫 블록만 둘로 나눈다.
        // 시각 = 같은 alignment 글자 시각 − 13.88초(기존 블록 시작 0.63·3.16 = "다"·"부" 글자 시각과 일치).
        blockOverrides: [
          { start: 0.63, end: 1.8, text: "다음 편엔 우리 지갑을" }, // 을 끝 15.68
          { start: 1.88, end: 3.12, text: "또 뭐가 건드릴지" }, // 또 15.76
          { start: 3.16, end: 5.08, text: "부엉박사가 알짜만 골라서" },
          { start: 5.2, end: 6.52, text: "쉽게 정리해서 가져올게" },
        ],
        card: { accent: "경제번역소", label: "다음 편도 기대해줘" },
      },
    ],
    // 기존 v6과 동일: follow→teaser 0.4초 크로스디졸브
    crossfadeSec: 0.4,
    keyTerms: ["팔로우", "부엉박사"],
  },
};

const CHARACTER = getArg("--character");
const CONFIG = CTA_CONFIGS[CHARACTER];
if (!CONFIG) {
  console.error("ABORT: --character bull|owl 을 지정하세요.");
  process.exit(1);
}

const RENDER_WIDTH = 1080;
const RENDER_HEIGHT = 1920;
// 본편 v2와 같은 자막 규격(run-owl-assemble-shorts-v2.mjs CAPTION_LAYOUT_V2)
const CAPTION_MAX_WIDTH_PX = 760;
const CAPTION_FONT_SIZE = 84;
const CAPTION_X = 540;
const CAPTION_Y = 1290;
// 카드: 왼쪽 두 줄 쌓기(기존 CTA와 같은 모양). 상단은 결합 스크립트가 편 제목 헤더(y232~440)를
// 얹는 자리라 쓸 수 없고, 자막(2줄일 때 위 끝 ≈1191)과 오른쪽 아이콘 열(x≥917, y≥1144) 사이인
// y970~1162에 둔다. 좌우 잘림(약 57px) 안쪽 x90부터.
const CARD_STACK = Object.freeze({ x: 90, accentTextTopY: 986, accentSize: 80, labelTextTopY: 1096, labelSize: 52 });
const CARD_STYLE = {
  accent: { color: "#FFD54A", boxcolor: "black@0.85", padV: 16, padH: 28 },
  label: { color: "white", boxcolor: "black@0.78", padV: 14, padH: 26 },
};

const CAPTION_FONTS_DIR = path.join(REPO_ROOT, "assets", "fonts");
const CAPTION_FONT_PATH = path.join(CAPTION_FONTS_DIR, "BlackHanSans.ttf");
const filterPath = (value) => value.replace(/\\/g, "/").replace(/^([A-Za-z]):/, "$1\\:");
const FONT_FOR_FILTER = filterPath(CAPTION_FONT_PATH);

function log(m) {
  console.log(`[${new Date().toISOString().slice(11, 19)}][cta-v2:${CHARACTER}] ${m}`);
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
  const d = Number.parseFloat(run("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", file]).trim());
  if (!Number.isFinite(d)) {
    console.error(`ABORT: duration을 읽지 못했습니다: ${file}`);
    process.exit(1);
  }
  return d;
}

function assTimeToSec(t) {
  const [h, m, s] = t.split(":");
  return Number(h) * 3600 + Number(m) * 60 + Number(s);
}
function secToAssTime(sec) {
  const cs = Math.max(0, Math.round(Number(sec) * 100));
  const h = Math.floor(cs / 360000);
  const m = Math.floor((cs % 360000) / 6000);
  const s = Math.floor((cs % 6000) / 100);
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(cs % 100).padStart(2, "0")}`;
}

// 확정 ASS에서 블록(같은 시작·끝 시각의 줄들)을 복원한다. 태그를 걷어낸 문구만 쓴다.
function readCaptionBlocks(assFile) {
  const blocks = [];
  for (const line of fs.readFileSync(assFile, "utf8").split(/\r?\n/)) {
    if (!line.startsWith("Dialogue:")) continue;
    const fields = line.slice("Dialogue:".length).split(",");
    const start = assTimeToSec(fields[1].trim());
    const end = assTimeToSec(fields[2].trim());
    const text = fields.slice(9).join(",").replace(/\{[^}]*\}/g, "").trim();
    const last = blocks[blocks.length - 1];
    if (last && last.start === start && last.end === end) last.text += ` ${text}`;
    else blocks.push({ start, end, text });
  }
  return blocks;
}

function emphasisBody(lineText, keyTerms) {
  const CAPTION_WHITE = "&H00FFFFFF";
  const CAPTION_CYAN = "&H00E3C452";
  return lineText.split(/\s+/).filter(Boolean).map((word) => {
    const term = keyTerms.find((t) => word.includes(t));
    if (!term) return escapeAssText(word);
    const i = word.indexOf(term);
    return `${escapeAssText(word.slice(0, i))}{\\1c${CAPTION_CYAN}}${escapeAssText(term)}{\\1c${CAPTION_WHITE}}${escapeAssText(word.slice(i + term.length))}`;
  }).join(" ");
}

function buildAss(blocks, keyTerms) {
  const out = [
    "[Script Info]",
    "Title: CTA Captions layout v2",
    "ScriptType: v4.00+",
    `PlayResX: ${RENDER_WIDTH}`,
    `PlayResY: ${RENDER_HEIGHT}`,
    "ScaledBorderAndShadow: yes",
    "WrapStyle: 2",
    "",
    "[V4+ Styles]",
    "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
    "Style: CtaCaption,Black Han Sans,80,&H00FFFFFF,&H00FFFFFF,&H00000000,&HA0000000,-1,0,0,0,100,100,0,0,1,8,3,5,50,50,0,1",
    "",
    "[Events]",
    "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
  ];
  const step = CAPTION_FONT_SIZE + 14;
  for (const block of blocks) {
    block.lines.forEach((lineText, index) => {
      const y = Math.round(CAPTION_Y + (index - (block.lines.length - 1) / 2) * step);
      const tags = `{\\an5\\pos(${CAPTION_X},${y})\\fs${CAPTION_FONT_SIZE}\\fscx94\\fscy94\\t(0,120,0.7,\\fscx100\\fscy100)}`;
      out.push(`Dialogue: 0,${secToAssTime(block.start)},${secToAssTime(block.end)},CtaCaption,,0,0,0,,${tags}${emphasisBody(lineText, keyTerms)}`);
    });
  }
  return out.join("\n") + "\n";
}

function escapeDrawtextValue(s) {
  return String(s).replace(/\\/g, "\\\\").replace(/:/g, "\\:").replace(/'/g, "\\'").replace(/%/g, "\\%");
}
function buildCardStack(card) {
  const { x, accentTextTopY, accentSize, labelTextTopY, labelSize } = CARD_STACK;
  // drawtext의 x는 글자 시작점이고 상자는 좌우로 padH만큼 더 나온다 → 상자 왼쪽 끝을 x에 맞춘다.
  const accentX = x + CARD_STYLE.accent.padH;
  const labelX = x + CARD_STYLE.label.padH;
  const accentRight = accentX + textWidthRatio(card.accent) * accentSize + CARD_STYLE.accent.padH;
  const labelRight = labelX + textWidthRatio(card.label) * labelSize + CARD_STYLE.label.padH;
  const labelY = labelTextTopY;
  const draw = (text, x, y, size, style) => `drawtext=${[
    `fontfile='${FONT_FOR_FILTER}'`,
    `text='${escapeDrawtextValue(text)}'`,
    `x=${x}`,
    `y=${y}`,
    `fontsize=${size}`,
    `fontcolor=${style.color}`,
    "box=1",
    `boxcolor=${style.boxcolor}`,
    `boxborderw=${style.padV}|${style.padH}|${style.padV}|${style.padH}`,
    "expansion=none",
  ].join(":")}`;
  return {
    filters: [
      draw(card.accent, accentX, accentTextTopY, accentSize, CARD_STYLE.accent),
      draw(card.label, labelX, labelY, labelSize, CARD_STYLE.label),
    ],
    info: {
      boxTop: accentTextTopY - CARD_STYLE.accent.padV,
      boxBottom: labelTextTopY + labelSize + CARD_STYLE.label.padV,
      boxRightEstimate: Math.round(Math.max(accentRight, labelRight)),
      accentSize,
      labelSize,
    },
  };
}

for (const p of [CAPTION_FONT_PATH, ...CONFIG.parts.flatMap((part) => [part.muxed, part.ass])]) {
  if (!fs.existsSync(p)) {
    console.error(`ABORT: 필요한 파일이 없습니다: ${p}`);
    process.exit(1);
  }
}
fs.mkdirSync(CONFIG.outDir, { recursive: true });

const report = { character: CHARACTER, generatedAt: new Date().toISOString(), layout: { captionY: CAPTION_Y, captionMaxWidthPx: CAPTION_MAX_WIDTH_PX, captionFontSize: CAPTION_FONT_SIZE, footer: false, cardStack: CARD_STACK }, parts: [] };
const renderedParts = [];

for (const part of CONFIG.parts) {
  const blocks = (part.blockOverrides ?? readCaptionBlocks(part.ass)).map((block) => {
    const lines = wrapToLines(block.text, CAPTION_FONT_SIZE, CAPTION_MAX_WIDTH_PX);
    return { ...block, lines };
  });
  const bad = blocks.filter((b) => !b.lines || b.lines.length > 2 || b.lines.some((l) => textWidthRatio(l) * CAPTION_FONT_SIZE > CAPTION_MAX_WIDTH_PX));
  if (bad.length > 0) {
    console.error(`ABORT: ${part.role} 자막이 2줄·폭 760 안에 안 들어갑니다: ${bad.map((b) => b.text).join(" / ")}`);
    process.exit(1);
  }
  const assPath = path.join(CONFIG.outDir, `${CHARACTER}_cta_${part.role}_captions_layout_v2.ass`);
  fs.writeFileSync(assPath, buildAss(blocks, CONFIG.keyTerms), "utf8");
  const cardRow = buildCardStack(part.card);
  const outPath = path.join(CONFIG.outDir, `${CHARACTER}_cta_${part.role}_layout_v2.mp4`);
  run("ffmpeg", [
    "-y", "-i", part.muxed,
    "-vf", [
      `scale=${RENDER_WIDTH}:${RENDER_HEIGHT}:flags=lanczos`,
      "setsar=1",
      ...cardRow.filters,
      `ass='${filterPath(assPath)}':fontsdir='${filterPath(CAPTION_FONTS_DIR)}'`,
    ].join(","),
    "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p",
    "-c:a", "aac", "-b:a", "192k", "-ar", "44100",
    "-movflags", "+faststart",
    outPath,
  ]);
  const duration = probeDuration(outPath);
  log(`${part.role}: ${duration.toFixed(3)}s, 카드 ${JSON.stringify(cardRow.info)}`);
  blocks.forEach((b) => log(`  [${b.start.toFixed(2)}~${b.end.toFixed(2)}s] ${b.lines.join(" / ")}`));
  renderedParts.push({ path: outPath, duration });
  report.parts.push({ role: part.role, source: part.muxed, captionsFrom: part.ass, out: outPath, durationSec: Number(duration.toFixed(3)), card: { ...part.card, ...cardRow.info }, blocks: blocks.map((b) => ({ start: b.start, end: b.end, lines: b.lines })) });
}

const finalPath = path.join(CONFIG.outDir, CONFIG.finalName);
if (renderedParts.length === 1) {
  fs.copyFileSync(renderedParts[0].path, finalPath);
} else {
  const [a, b] = renderedParts;
  const xf = CONFIG.crossfadeSec;
  const offset = (a.duration - xf).toFixed(3);
  run("ffmpeg", [
    "-y", "-i", a.path, "-i", b.path,
    "-filter_complex", `[0:v][1:v]xfade=transition=fade:duration=${xf}:offset=${offset},format=yuv420p[v];[0:a][1:a]acrossfade=d=${xf}[a]`,
    "-map", "[v]", "-map", "[a]",
    "-c:v", "libx264", "-preset", "medium", "-crf", "18",
    "-c:a", "aac", "-b:a", "192k", "-ar", "44100",
    "-movflags", "+faststart",
    finalPath,
  ]);
}
report.final = { path: finalPath, durationSec: Number(probeDuration(finalPath).toFixed(3)) };
fs.writeFileSync(path.join(CONFIG.outDir, "cta-layout-v2-report.json"), JSON.stringify(report, null, 2), "utf8");
log(`완료: ${finalPath} (${report.final.durationSec}s)`);
