#!/usr/bin/env node

/**
 * 편별 본편(1~7번, 연속 TTS)에 고정 CTA 클립(8번)을 이어붙여 최종본을 만든다.
 *
 * 구조 배경(Owner 2026-09-17): "영상별로 합성할 때 기본 CTA를 붙이되, 위쪽에
 * 각 편의 영상마다 제목을 넣어주고 '팔로우 / 다음 소식도 먼저 받기' 이 문구는
 * CTA 기본으로 고정해놓고 각 편별로 주제는 바뀌니까 그건 너가 바꿔서 합성해줘."
 *
 * 즉:
 *   - CTA 클립(영상+음성+"팔로우" 카드+채널명 바)은 완전히 고정 — 편마다 다시
 *     만들지 않는다(run-owl-cta-final-assemble-once.mjs 산출물을 그대로 재사용).
 *   - 상단 헤더 제목만 그 편의 OWL_ASSEMBLY_SPEC.headerTitle로 CTA 위에 얹는다.
 *   - 본편(1~7번)은 run-owl-assemble-shorts-v2.mjs로 이미 만든 8장면짜리
 *     결과물에서 8번째 장면 구간만 잘라내고 CTA로 교체한다 — 8장면 스펙과 TTS
 *     파이프라인(연속 오디오, 최소 4장면 가드 등)을 그대로 유지하기 위함이다.
 *
 * 사용(부엉박사 — 확정 CTA v6, _ai/CURRENT_STANDARDS.md §1 참고):
 *   node scripts/run-owl-episode-with-fixed-cta-once.mjs \
 *     --spec-module ./_owl-ep{N}-assembly-spec.mjs \
 *     --assembled "C:/tmp/owl-assembly-v5-final/owl_shorts_final.mp4" \
 *     --scene8-start 67.093 \
 *     --cta-clip "C:/tmp/owl-cta-fixed-v2/owl_cta_fixed_v2_final_v6.mp4" \
 *     --out-dir "C:/tmp/owl-episode-final"
 *
 * 금박사는 --spec-module을 _geumbaksa-ep{N}-assembly-spec.mjs로, --cta-clip을
 * C:/tmp/geumbaksa-cta-fixed-clean/geumbaksa_cta_clean_final.mp4로 바꿔서 쓴다
 * (_ai/CURRENT_STANDARDS.md §2 참고). --cta-clip은 캐릭터마다 다르므로 항상
 * 명시할 것 — 아래 기본값은 옛 v1 CTA라 이제 쓰지 않는다.
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const CAPTION_FONTS_DIR = path.join(REPO_ROOT, "assets", "fonts");
const CAPTION_FONT_PATH = path.join(CAPTION_FONTS_DIR, "BlackHanSans.ttf");
const OVERLAY_FONT_FOR_FILTER = CAPTION_FONT_PATH.replace(/\\/g, "/").replace(/^([A-Za-z]):/, "$1\\:");

function getArg(name) {
  const i = process.argv.indexOf(name);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : null;
}

// 편마다 다른 스펙(제목·헤더)을 쓸 수 있도록 모듈을 동적으로 로드한다.
// 기존 하드코딩된 import는 항상 6편(_owl-assembly-spec.mjs)을 가리켜, 다른 편을
// 조립할 때 헤더 제목이 조용히 6편 것으로 잘못 얹히는 결함이 있었다.
const SPEC_MODULE = getArg("--spec-module") || "./_owl-assembly-spec.mjs";
const SPEC_EXPORT_NAME = getArg("--spec-export") || "OWL_ASSEMBLY_SPEC";
const specModuleUrl = new URL(SPEC_MODULE, import.meta.url);
const specModule = await import(specModuleUrl.href);
let OWL_ASSEMBLY_SPEC = specModule[SPEC_EXPORT_NAME];
if (!OWL_ASSEMBLY_SPEC) {
  console.error(`ABORT: ${SPEC_MODULE} 에서 export "${SPEC_EXPORT_NAME}" 을 찾을 수 없습니다.`);
  process.exit(2);
}
const HEADER_TITLE_OVERRIDE = getArg("--header-title");
if (HEADER_TITLE_OVERRIDE) {
  OWL_ASSEMBLY_SPEC = { ...OWL_ASSEMBLY_SPEC, headerTitle: HEADER_TITLE_OVERRIDE.split("|") };
}

const ASSEMBLED = getArg("--assembled");
const SCENE8_START = Number(getArg("--scene8-start"));
// 기본값은 두지 않는다 — 부엉박사/금박사 확정 CTA 경로가 서로 다르고(각각
// owl-cta-fixed-v2/..._v6.mp4, geumbaksa-cta-fixed-clean/...clean_final.mp4),
// 옛 v1 CTA(owl_cta_final_with_captions.mp4)로 조용히 폴백해 헤더가 겹치는
// 사고가 실제로 있었다(2026-09-21). --cta-clip을 반드시 명시할 것.
const CTA_CLIP = getArg("--cta-clip");
if (!CTA_CLIP || !fs.existsSync(CTA_CLIP)) {
  console.error(`ABORT: --cta-clip (캐릭터별 확정 CTA 경로, _ai/CURRENT_STANDARDS.md 참고) 가 필요합니다: ${CTA_CLIP}`);
  process.exit(2);
}
const OUT_DIR = getArg("--out-dir") || "C:/tmp/owl-episode-final";
const RENDER_WIDTH = 1080;
const RENDER_HEIGHT = 1920;

if (!ASSEMBLED || !fs.existsSync(ASSEMBLED)) {
  console.error(`ABORT: --assembled 본편 파일이 없습니다: ${ASSEMBLED}`);
  process.exit(2);
}
if (!Number.isFinite(SCENE8_START) || SCENE8_START <= 0) {
  console.error("ABORT: --scene8-start (1~7번 장면 끝 시각, 초) 가 필요합니다.");
  process.exit(2);
}
if (!fs.existsSync(CAPTION_FONT_PATH)) {
  console.error(`ABORT: 폰트를 찾을 수 없습니다: ${CAPTION_FONT_PATH}`);
  process.exit(2);
}
fs.mkdirSync(OUT_DIR, { recursive: true });

function log(m) {
  console.log(`[${new Date().toISOString().slice(11, 19)}][episode-cta] ${m}`);
}
function run(bin, args) {
  const r = spawnSync(bin, args, { encoding: "utf8", maxBuffer: 1024 * 1024 * 64 });
  if (r.status !== 0) {
    console.error(`FAILED: ${bin} ${args.slice(0, 10).join(" ")} …`);
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
function probeResolution(file) {
  const out = run("ffprobe", [
    "-v", "error", "-select_streams", "v:0",
    "-show_entries", "stream=width,height",
    "-of", "csv=s=x:p=0", file,
  ]);
  const [w, h] = out.trim().split("x").map(Number);
  return { width: w, height: h };
}
function escapeDrawtextValue(s) {
  return String(s).replace(/\\/g, "\\\\").replace(/:/g, "\\:").replace(/'/g, "\\'").replace(/%/g, "\\%");
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

// run-owl-assemble-shorts-v2.mjs의 HEADER_BAR와 동일한 값. 헤더만 그리고
// 채널명 바는 그리지 않는다 — CTA 클립에는 이미 채널명 바가 고정으로 있다.
const HEADER_BAR = Object.freeze({
  scrimHeight: 420,
  titleColor: "#FFFFFF",
  accentColor: "#FFD54A",
  titleSize: 92,
  topY: 150,
  lineGap: 112,
});
const HEADER_SAFE_WIDTH_PX = 940;

// CTA 클립은 follow(0~8s, "팔로우" 유도)와 teaser(8s~, "다음 편도 기대해줘")
// 두 파트가 이어붙은 것이다. 헤더 제목은 follow 구간에만 얹는다 — teaser는
// 특정 편 내용과 무관한 범용 마무리 멘트라 제목이 얹히면 어색하다(Owner
// 2026-09-19 지적: "CTA 제일 마지막에는 위에 제목 안 넣기로 했었는데").
// CTA_FOLLOW_DURATION_SEC가 어긋나면(다른 CTA 클립으로 교체될 경우) 헤더가
// teaser까지 새어나가거나 너무 일찍 끊기므로, 클립을 바꿀 때 반드시 같이 맞춘다.
const CTA_FOLLOW_DURATION_SEC = 8;

function buildEpisodeHeaderFilters() {
  const title = OWL_ASSEMBLY_SPEC.headerTitle ?? [];
  if (title.length === 0) return [];
  const filters = [];
  const h = HEADER_BAR.scrimHeight;
  const enable = `enable='lt(t,${CTA_FOLLOW_DURATION_SEC})'`;
  filters.push(`geq=lum='if(lt(Y,${h}), lum(X,Y)*(0.45+0.55*Y/${h}), lum(X,Y))':cb='cb(X,Y)':cr='cr(X,Y)':${enable}`);
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
      enable,
    ].join(":")}`);
  });
  return filters;
}

// ── 1단계: 본편에서 1~7번 장면 구간만 정밀 컷 ────────────────────────────────
const scenes1to7 = path.join(OUT_DIR, "scenes1to7.mp4");
log(`1~7번 장면 컷: 0~${SCENE8_START.toFixed(3)}s`);
run("ffmpeg", [
  "-y", "-i", ASSEMBLED,
  "-t", SCENE8_START.toFixed(3),
  "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p",
  "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "1",
  scenes1to7,
]);

// ── 2단계: CTA 클립에 이 편의 헤더 제목을 얹는다 ─────────────────────────────
const ctaRes = probeResolution(CTA_CLIP);
const ctaWithHeader = path.join(OUT_DIR, "cta_with_header.mp4");
const headerFilters = buildEpisodeHeaderFilters();
const vFilters = [];
if (ctaRes.width !== RENDER_WIDTH || ctaRes.height !== RENDER_HEIGHT) {
  vFilters.push(`scale=${RENDER_WIDTH}:${RENDER_HEIGHT}:flags=lanczos`, "setsar=1");
}
vFilters.push(...headerFilters);
log(`CTA(${ctaRes.width}x${ctaRes.height}) 위에 헤더 "${(OWL_ASSEMBLY_SPEC.headerTitle ?? []).join(" / ")}" 합성`);
if (vFilters.length > 0) {
  run("ffmpeg", [
    "-y", "-i", CTA_CLIP,
    "-vf", vFilters.join(","),
    "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p",
    "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "1",
    ctaWithHeader,
  ]);
} else {
  fs.copyFileSync(CTA_CLIP, ctaWithHeader);
}

// ── 3단계: 1~7번 + CTA(헤더 포함) 결합 ───────────────────────────────────────
const finalOut = path.join(OUT_DIR, "owl_episode_final.mp4");
run("ffmpeg", [
  "-y", "-i", scenes1to7, "-i", ctaWithHeader,
  "-filter_complex", "[0:v:0][0:a:0][1:v:0][1:a:0]concat=n=2:v=1:a=1[outv][outa]",
  "-map", "[outv]", "-map", "[outa]",
  "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p",
  "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "1",
  "-movflags", "+faststart",
  finalOut,
]);

const finalDuration = probeDuration(finalOut);
log(`완료: ${finalOut} (${finalDuration.toFixed(2)}s)`);
