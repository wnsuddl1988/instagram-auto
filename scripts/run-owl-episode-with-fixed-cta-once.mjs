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
 * 명시할 것.
 *
 * --scene8-start: 이름과 무관하게 "본편 오디오 전체 길이(초)"를 넣는다.
 * --alignment <그 편 TTS *.alignment.json>: 마지막 발화 종료 시각 계산용(권장).
 *   없으면 silencedetect로 추정, --narration-end <초>로 직접 지정도 가능.
 * 결과 검증값은 <out-dir>/cta-join-report.json에 남는다(FAIL이면 exit 1).
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
// CTA 클립마다 도입부 무음 길이가 다르다(부엉박사/금박사 CTA는 약 0.9초,
// 황소특보 CTA(bull_cta_fixed_final_with_captions.mp4)는 약 0.18초부터 바로
// 발화가 시작됨, 실측 확인 2026-09-24). 예전엔 0.5초를 모든 캐릭터에
// 하드코딩해서 황소특보 2편에서 발화 시작 이후(0.18~0.32초 구간)를 잘라내
// "새로운"의 앞부분이 잘리는 사고가 났다(Owner 지적, 2026-09-23: "CTA
// 넘어가면 '새로운'을 또 말하지 않는다" — 1편 때 이미 같은 유형 문제를
// "트림 없이 원본 그대로 사용"으로 해결했으나 공용 스크립트의 하드코딩
// 값 자체는 안 고쳐서 재발).
//
// 재발 방지책: "매번 값을 명시하기"에 맡기면 또 깜빡할 수 있으므로, 확정된
// CTA 클립은 경로 기준으로 트림값을 코드에 고정해 자동 적용한다(Owner
// 지시, 2026-09-24: "황소특보 영상조립할 때는 무조건 이 방식으로 할 수
// 있게 해줘"). --cta-leading-silence-trim-sec으로 수동 override도 가능하되,
// 확정 클립에는 필요 없다 — 새 CTA 클립(버전 업)으로 교체되면 무음 길이가
// 달라지므로 이 표에 새로 등록하고 실측값을 넣어야 한다.
const KNOWN_CTA_LEADING_SILENCE_TRIM_SEC = new Map([
  // 황소특보 확정 CTA(project_bull_cta_final_confirmed 메모리, 실측 무음 0.179s,
  // 안전하게 그 직전까지만 자름).
  ["C:/tmp/bull-cta-fixed-v5/bull_cta_fixed_final_with_captions.mp4", 0.15],
  // 부엉박사 확정 CTA v6(실측 무음 0.516s, 2026-09-24 재측정 — 기존
  // 하드코딩 0.5초와 사실상 일치, 회귀 없음).
  ["C:/tmp/owl-cta-fixed-v2/owl_cta_fixed_v2_final_v6.mp4", 0.5],
  // 금박사 구 CTA(여성 Hana Lee 목소리, 실측 무음 0.897s). 표시 1~4편 전용.
  ["C:/tmp/geumbaksa-cta-fixed-clean/geumbaksa_cta_clean_final.mp4", 0.5],
  // 금박사 현행 CTA(남성 Yohan Koo 목소리, 2026-09-25) — 5편 이후 전부 이것.
  // 0초부터 바로 발화(도입부 무음 없음, 2026-09-26 실측)라 트림하지 않는다.
  ["C:/tmp/geumbaksa-cta-fixed-clean/geumbaksa_cta_clean_final_v3voice.mp4", 0],
]);
function resolveCtaLeadingSilenceTrimSec(ctaClipPath) {
  const override = getArg("--cta-leading-silence-trim-sec");
  if (override !== null) return Number(override);
  const normalized = path.resolve(ctaClipPath).replace(/\\/g, "/").toLowerCase();
  for (const [knownPath, trimSec] of KNOWN_CTA_LEADING_SILENCE_TRIM_SEC) {
    if (path.resolve(knownPath).replace(/\\/g, "/").toLowerCase() === normalized) {
      return trimSec;
    }
  }
  return NaN;
}
const CTA_LEADING_SILENCE_TRIM_SEC = resolveCtaLeadingSilenceTrimSec(CTA_CLIP);
if (!Number.isFinite(CTA_LEADING_SILENCE_TRIM_SEC) || CTA_LEADING_SILENCE_TRIM_SEC < 0) {
  console.error(
    `ABORT: --cta-clip "${CTA_CLIP}" 의 도입부 무음 트림값을 모릅니다. ` +
      "이 CTA 클립은 KNOWN_CTA_LEADING_SILENCE_TRIM_SEC에 등록되지 않은 새 클립입니다 — " +
      "ffmpeg -i <clip> -af silencedetect=noise=-35dB:d=0.05 -f null - 로 먼저 실측하고, " +
      "--cta-leading-silence-trim-sec으로 명시하거나 이 표에 등록할 것 " +
      "(임의 기본값 사용 금지 — 황소특보 CTA \"새로운\" 잘림 사고 재발 방지).",
  );
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
function probeStreamDuration(file, selector) {
  const out = run("ffprobe", [
    "-v", "error", "-select_streams", selector,
    "-show_entries", "stream=duration",
    "-of", "default=noprint_wrappers=1:nokey=1", file,
  ]);
  const d = Number.parseFloat(out.trim());
  if (!Number.isFinite(d)) {
    console.error(`ABORT: ${selector} stream duration을 읽지 못했습니다: ${file}`);
    process.exit(1);
  }
  return d;
}
function probeVideoFrameCount(file) {
  const out = run("ffprobe", [
    "-v", "error", "-count_frames", "-select_streams", "v:0",
    "-show_entries", "stream=nb_read_frames",
    "-of", "default=noprint_wrappers=1:nokey=1", file,
  ]);
  return Number.parseInt(out.trim(), 10);
}
// alignment JSON(ElevenLabs)의 마지막 발화 글자 종료 시각.
function narrationEndFromAlignment(alignmentPath) {
  const raw = JSON.parse(fs.readFileSync(alignmentPath, "utf8"));
  const al = raw.alignment ?? raw.normalized_alignment ?? raw;
  const chars = al.characters;
  const ends = al.character_end_times_seconds;
  if (!Array.isArray(chars) || !Array.isArray(ends)) {
    console.error(`ABORT: alignment 형식을 해석할 수 없습니다: ${alignmentPath}`);
    process.exit(2);
  }
  let last = -1;
  for (let i = 0; i < chars.length; i += 1) {
    if (/[가-힣A-Za-z0-9.?!]/.test(chars[i])) last = i;
  }
  return Number(ends[last]);
}
// alignment가 없을 때: 오디오의 마지막 무음 구간 시작 = 마지막 발화 종료.
function narrationEndFromSilence(file, upToSec) {
  const r = spawnSync("ffmpeg", [
    "-v", "info", "-t", upToSec.toFixed(3), "-i", file,
    "-af", "silencedetect=noise=-35dB:d=0.12", "-f", "null", "-",
  ], { encoding: "utf8", maxBuffer: 1024 * 1024 * 64 });
  const text = r.stderr ?? "";
  const starts = [...text.matchAll(/silence_start: ([0-9.]+)/g)].map((m) => Number(m[1]));
  const ends = [...text.matchAll(/silence_end: ([0-9.]+)/g)].map((m) => Number(m[1]));
  const lastStart = starts.at(-1);
  // 마지막 무음이 끝까지 이어지면(end 없음) 그 시작이 발화 종료다.
  if (lastStart !== undefined && (ends.length < starts.length || ends.at(-1) < lastStart)) {
    return lastStart;
  }
  return upToSec;
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
  topY: 232, // 2026-09-30 배치 v2: 앱 상단 아이콘을 피해 조립기와 같은 높이로 내림
  lineGap: 112,
});
// 2026-09-30: 940 → 864. 화면비가 긴 폰에서 앱이 좌우를 각 약 10%씩 잘라내 헤더 끝 글자가
// 잘릴 수 있다(조립기 TEXT_SAFE_WIDTH_PX와 같은 값).
const HEADER_SAFE_WIDTH_PX = 864;

// CTA 클립은 follow(0~8s, "팔로우" 유도)와 teaser(8s~, "다음 편도 기대해줘")
// 두 파트가 이어붙은 것이다. 헤더 제목은 follow 구간에만 얹는다 — teaser는
// 특정 편 내용과 무관한 범용 마무리 멘트라 제목이 얹히면 어색하다(Owner
// 2026-09-19 지적: "CTA 제일 마지막에는 위에 제목 안 넣기로 했었는데").
// CTA_FOLLOW_DURATION_SEC가 어긋나면(다른 CTA 클립으로 교체될 경우) 헤더가
// teaser까지 새어나가거나 너무 일찍 끊기므로, 클립을 바꿀 때 반드시 같이 맞춘다.
//
// (2026-09-22 CTA 인트로 여백 클립 실험 — geumbaksa_cta_with_intro_v1.mp4로
// 4초 무발화 대기 구간을 추가해봤으나 Owner가 "이상해졌다"며 이전 버전으로
// 되돌리라고 확정. 인트로 클립/로직은 폐기하고 원래 고정 CTA
// (geumbaksa_cta_clean_final.mp4)로 복귀한다.)
const CTA_FOLLOW_DURATION_SEC = 8;
// CTA 클립 도입부에서 CTA_LEADING_SILENCE_TRIM_SEC(위에서 --cta-leading-silence-trim-sec로
// 필수 입력받음)만큼 잘라내면(아래 2단계) 새 타임라인의 t=0이 원본 CTA의
// t=CTA_LEADING_SILENCE_TRIM_SEC가 된다. CTA_FOLLOW_DURATION_SEC는 원본 CTA
// 기준 절대 시각이므로, 트림한 만큼 빼주지 않으면 헤더가 실제 follow
// 구간보다 일찍 꺼진다.
const CTA_FOLLOW_DURATION_SEC_TRIMMED = CTA_FOLLOW_DURATION_SEC - CTA_LEADING_SILENCE_TRIM_SEC;

function buildEpisodeHeaderFilters() {
  const title = OWL_ASSEMBLY_SPEC.headerTitle ?? [];
  if (title.length === 0) return [];
  const filters = [];
  const h = HEADER_BAR.scrimHeight;
  const enable = `enable='lt(t,${CTA_FOLLOW_DURATION_SEC_TRIMMED})'`;
  filters.push(`geq=lum='if(lt(Y,${h}), lum(X,Y)*(0.45+0.55*Y/${h}), lum(X,Y))':cb='cb(X,Y)':cr='cr(X,Y)':${enable}`);
  title.forEach((line, index) => {
    const color = index === title.length - 1 ? HEADER_BAR.accentColor : HEADER_BAR.titleColor;
    const naturalWidth = textWidthRatio(line) * HEADER_BAR.titleSize;
    const lineFontSize = naturalWidth > HEADER_SAFE_WIDTH_PX
      ? Math.floor(HEADER_BAR.titleSize * (HEADER_SAFE_WIDTH_PX / naturalWidth))
      : HEADER_BAR.titleSize;
    const y = HEADER_BAR.topY + index * HEADER_BAR.lineGap;
    // drawtext의 단일 borderw+bordercolor 외곽선은 Black Han Sans의 일부
    // 글자(예: "누")에서 안티앨리어싱이 얇아져 외곽선이 부분적으로 빠져
    // 보이는 렌더링 결함이 있다(2026-09-24, run-owl-assemble-shorts-v2.mjs와
    // 동일 원인·동일 수정 — 그 파일 주석 참고). 검은 텍스트를 십자 4방향
    // 오프셋으로 겹쳐 그려 외곽선을 수동으로 만들고 그 위에 컬러 텍스트를
    // 얹는다.
    const outlineOffsets = [
      [-5, 0], [5, 0], [0, -5], [0, 5],
    ];
    for (const [dx, dy] of outlineOffsets) {
      filters.push(`drawtext=${[
        `fontfile='${OVERLAY_FONT_FOR_FILTER}'`,
        `text='${escapeDrawtextValue(line)}'`,
        `x=(w-text_w)/2+${dx}`,
        `y=${y + dy}`,
        `fontsize=${lineFontSize}`,
        "fontcolor=black",
        "borderw=3",
        "bordercolor=black",
        "expansion=none",
        enable,
      ].join(":")}`);
    }
    filters.push(`drawtext=${[
      `fontfile='${OVERLAY_FONT_FOR_FILTER}'`,
      `text='${escapeDrawtextValue(line)}'`,
      "x=(w-text_w)/2",
      `y=${y}`,
      `fontsize=${lineFontSize}`,
      `fontcolor=${color}`,
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

// ── 2단계: CTA 클립 도입부 무음 트림 + 헤더 제목 합성 ────────────────────────
// 실측 확인(2026-09-22, 금박사 7·8·9편 전수 재확인): CTA 클립
// (geumbaksa_cta_clean_final.mp4 등)은 시작부에 약 0.9초의 무음이 원래부터
// 포함돼 있다. 이전 주석은 이를 "무음 부족"이라 잘못 서술했으나 실제로는
// "무음 과다"이며, 본편 마지막 씬의 발화 후 여백(약 0.3~0.5초)과 합쳐지면
// 전환부에서 1초 이상 화면은 이미 바뀌었는데 아무 소리도 안 나오는 구간이
// 생긴다("화면이 또 먹통이다", Owner 지적). CTA_LEADING_SILENCE_TRIM_SEC만큼
// 항상 잘라내 전환 무음을 다른 씬 간격과 비슷한 수준으로 되돌린다(상수는
// 위 buildEpisodeHeaderFilters 앞에서 이미 선언됨 — 헤더 표시 구간 계산과
// 공유해야 하므로 여기서 다시 선언하지 않는다).
const ctaRes = probeResolution(CTA_CLIP);
const ctaWithHeader = path.join(OUT_DIR, "cta_with_header.mp4");
const headerFilters = buildEpisodeHeaderFilters();
const vFilters = [];
if (ctaRes.width !== RENDER_WIDTH || ctaRes.height !== RENDER_HEIGHT) {
  vFilters.push(`scale=${RENDER_WIDTH}:${RENDER_HEIGHT}:flags=lanczos`, "setsar=1");
}
vFilters.push(...headerFilters);
log(`CTA(${ctaRes.width}x${ctaRes.height}) 도입부 무음 ${CTA_LEADING_SILENCE_TRIM_SEC}s 트림 + 헤더 "${(OWL_ASSEMBLY_SPEC.headerTitle ?? []).join(" / ")}" 합성`);
run("ffmpeg", [
  "-y", "-i", CTA_CLIP,
  "-ss", CTA_LEADING_SILENCE_TRIM_SEC.toFixed(3),
  ...(vFilters.length > 0 ? ["-vf", vFilters.join(",")] : []),
  "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p",
  "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "1",
  ctaWithHeader,
]);

// ── 3단계: 본편 + CTA 결합 — CTA 연결 표준 절차(Owner 확정 2026-09-23) ─────────
// xfade는 쓰지 않는다(길이·offset에 따라 CTA가 중복되거나 잘리고 대량 프레임
// 드롭이 재현됨). 본편 마지막 씬은 비디오 스트림이 발화보다 먼저 끝나는
// 경우가 있어, 하드컷 concat만 하면 마지막 멘트 끝부분이 CTA 화면 위로
// 들리고 CTA 첫 프레임이 정지한다(황소특보 4편 실측: 영상 126.42s < 발화
// 126.97s). 그래서:
//   1) 마지막 발화 종료(NARRATION_END)까지 +0.15s 여유로 마지막 프레임을 tpad 연장
//   2) 본편 끝 0.3s fade-out → CTA 시작 0.3s fade-in, concat
//   3) 오디오는 본편을 같은 지점에서 자르고 CTA 오디오를 겹치지 않게 순차 결합
const finalOut = path.join(OUT_DIR, "owl_episode_final.mp4");
const DISSOLVE_SEC = 0.3;
const NARRATION_MARGIN_SEC = 0.15;
const OUTPUT_FPS = 24;

const mainVideoEnd = probeStreamDuration(scenes1to7, "v:0");
const mainAudioEnd = probeStreamDuration(scenes1to7, "a:0");
const narrationEndArg = getArg("--narration-end");
const alignmentArg = getArg("--alignment");
let narrationEnd;
let narrationEndSource;
if (narrationEndArg !== null) {
  narrationEnd = Number(narrationEndArg);
  narrationEndSource = "--narration-end";
} else if (alignmentArg) {
  narrationEnd = narrationEndFromAlignment(alignmentArg);
  narrationEndSource = `alignment(${path.basename(alignmentArg)})`;
} else {
  narrationEnd = narrationEndFromSilence(scenes1to7, mainAudioEnd);
  narrationEndSource = "silencedetect";
}
if (!Number.isFinite(narrationEnd) || narrationEnd <= 0) {
  console.error("ABORT: 마지막 발화 종료 시각(NARRATION_END)을 구하지 못했습니다.");
  process.exit(1);
}
if (narrationEnd > SCENE8_START + 0.05) {
  console.error(
    `ABORT: 마지막 발화 종료(${narrationEnd.toFixed(3)}s)가 --scene8-start(${SCENE8_START.toFixed(3)}s)보다 늦습니다 — ` +
      "--scene8-start에는 본편 오디오 전체 길이를 넣어야 합니다(발화가 잘림).",
  );
  process.exit(2);
}
// CTA(트림 후)가 몇 초 뒤에 말을 시작하는지. 본편 마지막 발화와 CTA 첫 발화
// 사이 무음이 MIN_TRANSITION_SILENCE_SEC보다 짧으면 숨 쉴 틈 없이 붙어
// 들리므로(금박사 현행 CTA는 0초부터 발화) 본편 쪽을 그만큼 더 연장한다.
const MIN_TRANSITION_SILENCE_SEC = 0.3;
const ctaLeadSilence = (() => {
  const r = spawnSync("ffmpeg", [
    "-v", "info", "-t", "2", "-i", ctaWithHeader,
    "-af", "silencedetect=noise=-35dB:d=0.02", "-f", "null", "-",
  ], { encoding: "utf8", maxBuffer: 1024 * 1024 * 16 });
  const text = r.stderr ?? "";
  const firstStart = text.match(/silence_start: ([0-9.]+)/);
  const firstEnd = text.match(/silence_end: ([0-9.]+)/);
  if (firstStart && Number(firstStart[1]) < 0.02 && firstEnd) return Number(firstEnd[1]);
  return 0;
})();
const mainEnd = Math.max(
  mainVideoEnd,
  narrationEnd + NARRATION_MARGIN_SEC,
  narrationEnd + MIN_TRANSITION_SILENCE_SEC - ctaLeadSilence,
);
const extendSec = mainEnd - mainVideoEnd;
const transitionSilence = mainEnd - narrationEnd + ctaLeadSilence;
const ctaVideoEnd = probeStreamDuration(ctaWithHeader, "v:0");
log(
  `CTA 연결: NARRATION_END=${narrationEnd.toFixed(3)}s(${narrationEndSource}) ` +
    `VIDEO_END=${mainVideoEnd.toFixed(3)}s → 본편 끝 ${mainEnd.toFixed(3)}s ` +
    `(tpad 연장 ${extendSec > 0 ? extendSec.toFixed(3) : "0"}s, fade ${DISSOLVE_SEC}s, ` +
    `발화 사이 무음 ${transitionSilence.toFixed(2)}s)`,
);

const mainVideoChain = [
  "setpts=PTS-STARTPTS", `fps=${OUTPUT_FPS}`, "format=yuv420p",
  ...(extendSec > 0 ? [`tpad=stop_mode=clone:stop_duration=${extendSec.toFixed(3)}`] : []),
  `trim=duration=${mainEnd.toFixed(3)}`, "setpts=PTS-STARTPTS",
  `fade=t=out:st=${(mainEnd - DISSOLVE_SEC).toFixed(3)}:d=${DISSOLVE_SEC}`,
].join(",");
run("ffmpeg", [
  "-y", "-i", scenes1to7, "-i", ctaWithHeader,
  "-filter_complex",
  [
    `[0:v:0]${mainVideoChain}[v0]`,
    `[0:a:0]atrim=0:${mainEnd.toFixed(3)},apad=whole_dur=${mainEnd.toFixed(3)},asetpts=PTS-STARTPTS[a0]`,
    `[1:v:0]setpts=PTS-STARTPTS,fps=${OUTPUT_FPS},format=yuv420p,fade=t=in:st=0:d=${DISSOLVE_SEC}[v1]`,
    `[1:a:0]apad=whole_dur=${ctaVideoEnd.toFixed(3)},asetpts=PTS-STARTPTS[a1]`,
    "[v0][a0][v1][a1]concat=n=2:v=1:a=1[outv][outa]",
  ].join(";"),
  "-map", "[outv]", "-map", "[outa]",
  "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p",
  "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "1",
  "-movflags", "+faststart",
  finalOut,
]);

// 검증: 프레임 드롭 없음 + 화면/오디오 길이 일치.
const finalVideoDur = probeStreamDuration(finalOut, "v:0");
const finalAudioDur = probeStreamDuration(finalOut, "a:0");
const frames = probeVideoFrameCount(finalOut);
const expectedFrames = Math.round(finalVideoDur * OUTPUT_FPS);
const frameOk = Math.abs(frames - expectedFrames) <= 1;
const avOk = Math.abs(finalVideoDur - finalAudioDur) <= 0.1;
const report = {
  schemaVersion: "owl_cta_join_report_v1",
  assembled: ASSEMBLED,
  ctaClip: CTA_CLIP,
  narrationEndSec: Number(narrationEnd.toFixed(3)),
  narrationEndSource,
  mainVideoEndSec: Number(mainVideoEnd.toFixed(3)),
  mainEndSec: Number(mainEnd.toFixed(3)),
  tpadExtendSec: Number(Math.max(0, extendSec).toFixed(3)),
  dissolveSec: DISSOLVE_SEC,
  ctaLeadSilenceSec: Number(ctaLeadSilence.toFixed(3)),
  transitionSilenceSec: Number(transitionSilence.toFixed(3)),
  finalVideoSec: Number(finalVideoDur.toFixed(3)),
  finalAudioSec: Number(finalAudioDur.toFixed(3)),
  frames,
  expectedFrames,
  frameCheck: frameOk ? "PASS" : "FAIL",
  avLengthCheck: avOk ? "PASS" : "FAIL",
  checkFramesAtSec: {
    beforeNarrationEnd: Number((narrationEnd - 0.2).toFixed(2)),
    transition: Number(mainEnd.toFixed(2)),
    afterTransition: Number((mainEnd + 0.5).toFixed(2)),
    ctaLastFrame: Number((finalVideoDur - 0.1).toFixed(2)),
  },
};
fs.writeFileSync(path.join(OUT_DIR, "cta-join-report.json"), JSON.stringify(report, null, 2));
log(`검증: 프레임 ${frames}/${expectedFrames} ${report.frameCheck}, 화면 ${finalVideoDur.toFixed(2)}s / 오디오 ${finalAudioDur.toFixed(2)}s ${report.avLengthCheck}`);
log(`육안 확인할 시점(초): ${JSON.stringify(report.checkFramesAtSec)}`);
if (!frameOk || !avOk) {
  console.error("FAIL: CTA 결합 검증 실패 — cta-join-report.json 확인");
  process.exit(1);
}
log(`완료: ${finalOut} (${finalVideoDur.toFixed(2)}s)`);
