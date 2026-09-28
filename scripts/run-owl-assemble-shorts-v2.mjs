#!/usr/bin/env node

/**
 * 부엉이 쇼츠 조립기 v2 — 연속 오디오 + 동적 자막.
 *
 * v1과의 결정적 차이: TTS 오디오를 장면별로 자르지 않는다.
 *
 * v1은 연속 오디오를 scenes[].startSec/endSec 으로 잘라 장면마다 붙이고 각 장면에
 * 여유 0.4초 + apad 무음을 더했다. 그 결과 원본에는 없던 공백이 장면 경계마다 생겨
 * 말이 뚝뚝 끊겼다. ElevenLabs가 한 번에 읽은 호흡을 사람이 다시 잘라 붙이면
 * 자연스러울 수 없다.
 *
 * v2는 오디오를 단일 트랙으로 그대로 깔고, 영상 쪽을 오디오 타임코드에 맞춘다:
 *   1. 장면별로 1080x1920 업스케일 + 숫자 오버레이 → 무음 클립
 *      길이는 summary의 scene.endSec - scene.startSec 을 그대로 쓴다.
 *      영상이 짧으면 마지막 프레임을 정지로 늘리고(tpad), 길면 잘라낸다.
 *   2. 8개 무음 클립을 concat → 타임라인 영상
 *   3. 연속 오디오를 통째로 mux하면서 ASS 자막을 burn
 *
 * 자막은 _money-shorts-dynamic-captions.mjs 의 계약을 따른다(하단 고정 바 금지,
 * 1~5어절 블록, 발화 타이밍 기반, 6개 위치 순환). alignment.json 의 문자 단위
 * 타임스탬프가 입력이다.
 *
 * 사용:
 *   node scripts/run-owl-assemble-shorts-v2.mjs \
 *     --audio-summary "C:/tmp/money-shorts-os/owl-tts/out/elevenlabs-scene-paced-tts-summary.json" \
 *     --tts-script "C:/tmp/money-shorts-os/owl-tts/owl-tts-script.json"
 *
 *   --no-captions 로 자막 없이 (오디오 연속성만 확인)
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildDynamicCaptionTimeline,
  escapeAssText,
} from "./_money-shorts-dynamic-captions.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");

function getArg(name) {
  const i = process.argv.indexOf(name);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : null;
}

// 트랙별 스펙 모듈을 동적으로 로드한다(2026-09-19 Owner 확정) — 부엉이 전용으로
// 짜인 이 조립기를 금박사에도 재사용하기 위함. 부엉이는 기존 동작을 그대로
// 유지하도록 기본값을 _owl-assembly-spec.mjs로 둔다. 자막/오디오 mux 등 정교하게
// 다듬어진 로직을 트랙마다 복사하면 드리프트 위험이 크므로, 스펙만 갈아끼운다.
const SPEC_MODULE = getArg("--spec-module") || "./_owl-assembly-spec.mjs";
const SPEC_EXPORT_NAME = getArg("--spec-export") || "OWL_ASSEMBLY_SPEC";
const specModuleUrl = new URL(SPEC_MODULE, import.meta.url);
const specModule = await import(specModuleUrl.href);
let ASSEMBLY_SPEC = specModule[SPEC_EXPORT_NAME];
if (!ASSEMBLY_SPEC) {
  console.error(
    `ABORT: ${SPEC_MODULE} 에서 export "${SPEC_EXPORT_NAME}" 을 찾을 수 없습니다.`,
  );
  process.exit(2);
}
// 고정 재사용 클립(예: 금박사 CTA)은 캐릭터·배경·대사가 매번 같지만, 화면
// 상단 제목만 그 편 주제로 바뀌어야 한다(2026-09-19 Owner 확정: "CTA는 고정,
// 대신 매 편 주제는 상단에 그대로 나오게"). 스펙 파일을 편마다 고쳐 쓰지 않고
// CLI에서 오버라이드할 수 있게 한다. "|"로 여러 줄을 구분한다.
const HEADER_TITLE_OVERRIDE = getArg("--header-title");
if (HEADER_TITLE_OVERRIDE) {
  ASSEMBLY_SPEC = { ...ASSEMBLY_SPEC, headerTitle: HEADER_TITLE_OVERRIDE.split("|") };
}

const CLIP_DIR = getArg("--clip-dir") || "C:/tmp/owl-motion-final";
const AUDIO_SUMMARY = getArg("--audio-summary");
const TTS_SCRIPT = getArg("--tts-script");
const OUT_DIR = getArg("--out-dir") || "C:/tmp/owl-assembly-v2";
const NO_CAPTIONS = process.argv.includes("--no-captions");
// 화면에 나오는 모든 글자는 같은 폰트를 쓴다 — 제목·자막·수치·채널명.
// 폰트가 섞이면 아마추어처럼 보인다(Owner 지적, 2026-09-16).
const CAPTION_FONTS_DIR = path.join(REPO_ROOT, "assets", "fonts");
const CAPTION_FONT_PATH = path.join(CAPTION_FONTS_DIR, "BlackHanSans.ttf");
const OVERLAY_FONT = getArg("--font") || CAPTION_FONT_PATH;

if (!AUDIO_SUMMARY) {
  console.error("ABORT: --audio-summary 가 필요합니다.");
  process.exit(2);
}
if (!NO_CAPTIONS && !TTS_SCRIPT) {
  console.error("ABORT: 자막을 만들려면 --tts-script 가 필요합니다(--no-captions 로 끌 수 있습니다).");
  process.exit(2);
}
if (!fs.existsSync(OVERLAY_FONT)) {
  console.error(`ABORT: 오버레이 폰트를 찾을 수 없습니다: ${OVERLAY_FONT}`);
  process.exit(2);
}
if (!NO_CAPTIONS && !fs.existsSync(CAPTION_FONT_PATH)) {
  console.error(`ABORT: 자막 폰트를 찾을 수 없습니다: ${CAPTION_FONT_PATH}`);
  process.exit(2);
}

const { render, scenes } = ASSEMBLY_SPEC;
const SCENE_DIR = path.join(OUT_DIR, "scenes");
fs.mkdirSync(SCENE_DIR, { recursive: true });

function log(m) {
  console.log(`[${new Date().toISOString().slice(11, 19)}][assemble-v2] ${m}`);
}

function run(bin, args) {
  const r = spawnSync(bin, args, { encoding: "utf8", maxBuffer: 1024 * 1024 * 32 });
  if (r.status !== 0) {
    console.error(`FAILED: ${bin} ${args.slice(0, 6).join(" ")} …`);
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

// ── 입력 로드 ────────────────────────────────────────────────────────────────

if (!fs.existsSync(AUDIO_SUMMARY)) {
  console.error(`ABORT: summary 파일이 없습니다: ${AUDIO_SUMMARY}`);
  process.exit(1);
}
const summary = JSON.parse(fs.readFileSync(AUDIO_SUMMARY, "utf8"));
const audioScenes = summary?.scenes;
if (!Array.isArray(audioScenes) || audioScenes.length !== scenes.length) {
  console.error(`ABORT: summary의 장면 수(${audioScenes?.length})가 스펙(${scenes.length})과 다릅니다.`);
  process.exit(1);
}
const timelineAudioPath = summary.timelineAudioPath;
if (!timelineAudioPath || !fs.existsSync(timelineAudioPath)) {
  console.error(`ABORT: 연속 오디오를 찾을 수 없습니다: ${timelineAudioPath}`);
  process.exit(1);
}
const audioDuration = probeDuration(timelineAudioPath);

// 씬 경계 화면 컷 보정(2026-09-22 확정, v2): alignment 기반 audioScenes의
// endSec은 pauseAfterMs로 요청한 무음 길이가 아니라 TTS 엔진이 실제로 생성한
// 무음 길이를 그대로 반영하는데, 이 실제 무음 길이가 씬마다 0.71~1.4초로
// 들쭉날쭉하다는 게 실측으로 확인됐다(부엉이 12편, pauseAfterMs를 씬마다
// 통일해도 실제 무음 길이는 안 맞춰짐 — TTS 엔진이 요청값을 정확히 지키지
// 않기 때문). 그 결과 어떤 씬 전환은 무음이 길게 남고 어떤 전환은 거의
// 바로 붙어, "여러 클립을 이어붙인" 느낌이 더 두드러진다는 지적(Owner).
// 화면 컷(무음 클립 길이) 계산에서만, 각 중간 씬의 끝을 "실제 발화 종료
// (spokenEndSec) + 고정 여유(SCENE_GAP_SEC)"로 다시 계산해 모든 전환의
// 무음 길이를 통일한다. 자막 타이밍(buildDynamicCaptionTimeline)은 원본
// audioScenes를 그대로 써서 이 보정의 영향을 받지 않게 분리한다 — 자막은
// alignment 타임스탬프 자체를 신뢰해야 하는 별도 계약이기 때문이다.
// 처음 씬의 시작(0초)과 마지막 씬의 끝(오디오 전체 길이)은 건드리지 않는다.
// summary.timingPolicy가 "rebuilt_uniform_gap_v1"이면 오디오 자체가 이미
// 씬마다 정확히 같은 길이의 무음으로 재조립된 상태다(부엉이 12편, 오디오
// 직접 편집으로 무음 편차를 없앤 버전) — 이때는 startSec/endSec을 그대로
// 신뢰해야 한다. 아래 SCENE_GAP_SEC 보정을 다시 적용하면 화면 컷이 오디오
// 실제 무음 길이(0.5초)보다 0.05초씩 밀려 어긋난다.
const SCENE_GAP_SEC = 0.55;
const videoCutScenes = summary.timingPolicy === "rebuilt_uniform_gap_v1"
  ? audioScenes
  : (() => {
      // 1단계: 각 씬의 화면 시작 시각(startSec)을 정한다.
      //
      // 기준은 항상 "이 씬의 실제 발화 시작"(alignment 원본 startSec)이다 —
      // 자막도 이 값을 그대로 쓰므로(아래 buildDynamicCaptionTimeline 참고),
      // 화면도 같은 시각에 전환돼야 화면-자막-발화 셋이 어긋나지 않는다.
      // SCENE_GAP_SEC은 "이전 씬 발화가 이 시각까지 안 끝났을 때"만 적용하는
      // 최소 여유값이지, 항상 더해야 하는 고정 오프셋이 아니다 — 예전 버전은
      // 매번 prevSpokenEnd + GAP과 비교해 더 늦은 쪽을 썼는데, 실제 무음이
      // GAP(0.55초)보다 짧은 경우(부엉이 15편 s1→s2 실측: 무음 0.14초)
      // 화면이 발화보다 0.41초 늦게 전환되는 반대 방향 사고가 났다
      // (2026-09-24 Owner 지적: "s1 영상 마지막 프레임에 s2 자막이 뜬다" —
      // 실은 화면이 자막/발화보다 늦게 나온 것). 이전 씬 발화가 이 씬 발화
      // 시작 시각 이후까지 안 끝나 겹치는 극단적 경우에만 GAP만큼만 뒤로
      // 밀어 최소 무음을 보장하고, 그 외에는 alignment 원본을 그대로 쓴다.
      const starts = audioScenes.map((s, i) => {
        if (i === 0) return Number(s.startSec);
        const thisStart = Number(s.startSec);
        const prevSpokenEnd = Number(audioScenes[i - 1].spokenEndSec ?? audioScenes[i - 1].endSec);
        if (thisStart >= prevSpokenEnd) return thisStart;
        return prevSpokenEnd + SCENE_GAP_SEC;
      });
      // 2단계: 각 씬의 화면 종료 시각(endSec)은 "다음 씬의 화면 시작
      // 시각"과 정확히 이어붙인다(갭도 중복도 없음) — endSec을 spokenEnd
      // 기준으로 별도 계산하면 다음 씬 startSec과 어긋나 그 차이만큼 tpad
      // 정지 프레임이 늘어난다(1단계 수정 이전 버전에서 실측: 무음이 화면에
      // 반영 안 돼 마지막 씬 tpad가 3.8초까지 늘어남). 마지막 씬만 오디오
      // 전체 길이(s.endSec)로 끝낸다.
      return audioScenes.map((s, i) => {
        const isFirst = i === 0;
        const isLast = i === audioScenes.length - 1;
        const spokenEnd = Number.isFinite(Number(s.spokenEndSec)) ? Number(s.spokenEndSec) : Number(s.endSec);
        const startSec = starts[i];
        let endSec = isLast ? Number(s.endSec) : starts[i + 1];
        // 중간 씬의 화면 컷 길이가 실제 클립 길이보다 길면 tpad(마지막 프레임
        // 정지 클론)로 늘어나는데, 이 정지 구간이 "화면이 멈췄다 끊기며
        // 넘어간다"는 인상을 준다(Owner 지적, 2026-09-22, 부엉이 12편 s3→s4
        // 전환: 클립 7.42초인데 컷이 7.77초로 계산돼 0.35초 정지). 클립보다
        // 길게 늘어나는 중간 씬은 화면 컷을 클립 실제 길이로 캡해 정지 프레임
        // 자체가 생기지 않게 한다 — 다음 씬 시작 시각(starts[i+1])은 그대로
        // 둬서 오디오 무음 구간은 유지되고, 화면만 클립이 끝나는 즉시 다음
        // 씬으로 넘어간다(정지 프레임 대신 컷이 살짝 빨라짐).
        // 마지막 씬도 "오디오 파일 전체 끝까지 채운다"는 기존 로직 때문에,
        // 발화가 끝난 뒤 남은 꼬리 무음 구간까지 화면을 tpad로 늘려 같은 정지
        // 문제가 생긴다(Owner 지적, 2026-09-22: "1:13부터 영상 정지하고 말만
        // 나온다" — 부엉이 12편 s10, 클립 8.0초인데 컷이 8.45초로 계산됨).
        // 발화 자체(spokenEnd)는 절대 자르지 않되, 그 이후 무음 꼬리까지
        // 억지로 늘리지는 않는다 — 클립 길이를 상한으로 캡하고, 발화 길이를
        // 하한으로 보장한다.
        if (!isFirst) {
          const clipPath = path.join(CLIP_DIR, scenes[i].video);
          if (fs.existsSync(clipPath)) {
            const clipDur = probeDuration(clipPath);
            endSec = Math.min(endSec, startSec + clipDur);
            if (isLast) endSec = Math.max(endSec, spokenEnd);
          }
        }
        return { ...s, startSec, endSec };
      });
    })();

// ── 1단계: 장면별 무음 클립 (오디오 타임코드에 길이를 맞춘다) ────────────────

function escapeDrawtextValue(s) {
  return String(s).replace(/\\/g, "\\\\").replace(/:/g, "\\:").replace(/'/g, "\\'").replace(/%/g, "\\%");
}
const OVERLAY_FONT_FOR_FILTER = OVERLAY_FONT.replace(/\\/g, "/").replace(/^([A-Za-z]):/, "$1\\:");

// 수치 오버레이는 자막 다음으로 눈에 들어와야 한다. 배경 박스를 진하게 깔고
// 글자도 키운다(Owner 지적: "눈에 잘 띄게"). 출처만 의도적으로 작게 둔다.
// boxborderw는 "top|right|bottom|left" 4방향 개별 지정(ffmpeg 8.x)을 쓴다.
// 기존 균일값(예: 20)은 좌우 여백이 상하보다 좁아 보여 글자가 박스 테두리에
// 붙어 답답해 보인다는 지적(Owner 2026-09-19: "위치를 좀 신경쓰고 자간도") —
// 좌우 패딩을 상하보다 넉넉히 줘서 한글 특유의 넓은 자폭에 숨 쉴 공간을 준다.
const OVERLAY_STYLE = {
  label: { color: "white", box: 1, boxcolor: "black@0.78", boxborderw: "14|26|14|26", scale: 1.25 },
  value: { color: "white", box: 1, boxcolor: "black@0.85", boxborderw: "16|28|16|28", scale: 1.35 },
  accent: { color: "#FFD54A", box: 1, boxcolor: "black@0.85", boxborderw: "16|28|16|28", scale: 1.35 },
  // 위험·부담을 가리키는 수치. 자막의 빨강 강조와 같은 색을 쓴다.
  alert: { color: "#FF4B4B", box: 1, boxcolor: "black@0.85", boxborderw: "16|28|16|28", scale: 1.35 },
  // 출처 표기 — 작게. 면책이 아니라 "이 숫자 어디서 왔는지" 밝히는 장치다.
  source: { color: "#C8C8C8", box: 1, boxcolor: "black@0.6", boxborderw: "6|14|6|14", scale: 1 },
};

// 상단 제목 바 / 하단 채널 바. 벤치마킹 채널처럼 영상 내내 고정한다.
// 제목 바는 스크롤하다 멈춘 사람이 0.5초 안에 주제를 알게 하고,
// 채널 바는 저장·공유됐을 때 출처가 남게 한다.
// 제목은 별도 색 바 없이 영상 위에 얹는다. 노란 바는 배경과 따로 놀아 붙여넣은
// 것처럼 보였다(Owner 지적). 대신 상단에 어두운 반투명 층을 깔아 글자가 묻히지
// 않게 하고, 영상은 화면 전체를 그대로 쓴다.
// 모바일 검수(2026-09-17): 제목이 화면 최상단에 너무 붙어 있어 실기기의 카메라
// 펀치홀/노치에 가려진다는 지적 — topY를 한 줄 정도(약 화면 높이의 6%) 아래로
// 내리고, 제목·채널명 폰트도 확대한다.
const HEADER_BAR = Object.freeze({
  height: 0,            // 영상을 밀어내지 않는다
  scrimHeight: 420,     // 제목 뒤 어두운 층 (topY가 내려간 만큼 함께 확장)
  scrimColor: "black@0.45",
  titleColor: "#FFFFFF",
  accentColor: "#FFD54A",
  titleSize: 92,
  topY: 150,
  lineGap: 112,
});
const FOOTER_BAR = Object.freeze({
  height: 150,
  bgColor: "black@0.6",
  textColor: "#FFD54A",
  textSize: 80,
});
// 황소특보 전용 투자 리스크 고지 자막바(2026-09-23 Owner 확정,
// [[project_bull_risk_disclosure_and_cta_structure]], 2026-09-23 재확정으로
// 마지막 씬(클로징, CTA 직전)에만 적용) — 나레이션 없이 텍스트로만 노출한다.
// 채널명 FOOTER_BAR 위에 gap을 두고 얹어 자막(하단 2줄 시 y~1600대까지
// 내려옴)과 바로 붙지 않게 한다. scene.riskDisclosure === true인 씬에만
// buildSceneRiskDisclosureFilters()가 필터를 추가한다(부엉박사/금박사는
// closing_disclaimer 자체를 스펙에서 뺐지만, 황소특보는 시황 캐스터
// 특성상 별도로 유지하기로 확정됨 — 다른 캐릭터 트랙에 영향 없음).
// 문구는 "키워드 나열처럼 보인다"는 지적(2026-09-23)으로 완전한 문장
// 하나로 교체, 폰트도 그 길이에 맞춰 조정. 글자색은 흰색이 안 두드러진다는
// 지적(2026-09-23)으로 경고성 오렌지레드 강조색으로 교체(채널명 바의
// 골드 #FFD54A와도 구분되게).
const RISK_BAR = Object.freeze({
  height: 80,
  gapAboveFooter: 24,
  bgColor: "black@0.55",
  textColor: "#FF6B4A",
  textSize: 38,
});
function buildSceneRiskDisclosureFilters(scene) {
  if (!scene?.riskDisclosure) return [];
  const footerY = render.height - FOOTER_BAR.height;
  const riskY = footerY - RISK_BAR.height - RISK_BAR.gapAboveFooter;
  const text = "이 영상은 정보 전달 목적이며, 투자 판단의 책임은 본인에게 있습니다.";
  return [
    `drawbox=x=0:y=${riskY}:w=${render.width}:h=${RISK_BAR.height}:color=${RISK_BAR.bgColor}:t=fill`,
    `drawtext=${[
      `fontfile='${OVERLAY_FONT_FOR_FILTER}'`,
      `text='${escapeDrawtextValue(text)}'`,
      "x=(w-text_w)/2",
      `y=${riskY + Math.round((RISK_BAR.height - RISK_BAR.textSize) / 2) - 4}`,
      `fontsize=${RISK_BAR.textSize}`,
      `fontcolor=${RISK_BAR.textColor}`,
      "borderw=3",
      "bordercolor=black@0.8",
      "expansion=none",
    ].join(":")}`,
  ];
}

function buildHeaderFooterFilters() {
  const filters = [];
  const title = ASSEMBLY_SPEC.headerTitle ?? [];
  const channel = ASSEMBLY_SPEC.channelName;

  if (title.length > 0) {
    // 위에서 아래로 옅어지는 어두운 층. 단색 바와 달리 영상에 자연스럽게 녹는다.
    // drawbox 를 겹쳐 쌓으면 경계마다 띠가 보여서, geq 로 픽셀 단위 그라데이션을
    // 만든다. lum 을 y 위치에 비례해 낮추는 방식이라 색조는 유지된다.
    const h = HEADER_BAR.scrimHeight;
    filters.push(
      `geq=lum='if(lt(Y,${h}), lum(X,Y)*(0.45+0.55*Y/${h}), lum(X,Y))':cb='cb(X,Y)':cr='cr(X,Y)'`,
    );
    // 제목 폰트를 키우면서(78→92) 화면 폭(1080, 좌우 여백 70씩 = 안전폭 940)을
    // 넘는 줄이 생길 수 있다(모바일 검수 2026-09-17). drawtext는 자동 줄바꿈이나
    // 축소를 하지 않으므로, 폭 초과 줄만 그 줄에 한해 폰트를 낮춰 화면 안에 둔다.
    const HEADER_SAFE_WIDTH_PX = 940;
    title.forEach((line, index) => {
      // 마지막 줄(질문)만 노란색 — 시선이 질문에 멈추게 한다.
      const color = index === title.length - 1 ? HEADER_BAR.accentColor : HEADER_BAR.titleColor;
      const naturalWidth = textWidthRatio(line) * HEADER_BAR.titleSize;
      const lineFontSize = naturalWidth > HEADER_SAFE_WIDTH_PX
        ? Math.floor(HEADER_BAR.titleSize * (HEADER_SAFE_WIDTH_PX / naturalWidth))
        : HEADER_BAR.titleSize;
      const y = HEADER_BAR.topY + index * HEADER_BAR.lineGap;
      // drawtext의 단일 borderw+bordercolor 외곽선은 Black Han Sans의 일부
      // 글자(예: "누" — ㄴ과 ㅜ 획이 겹치는 모서리)에서 안티앨리어싱이
      // 얇아져 외곽선이 부분적으로 빠져 보이는 렌더링 결함이 있다(2026-09-24
      // Owner 지적, "누"에서 실측 확인 — borderw를 6→20까지 올려봐도 해당
      // 모서리는 계속 얇았다). ffmpeg drawtext 자체의 outline 렌더링 한계라
      // borderw/bordercolor 값 조정으로는 고쳐지지 않는다. 대신 검은 텍스트를
      // 십자 4방향으로 살짝 오프셋해 겹쳐 그려서 외곽선을 수동으로 만들고,
      // 그 위에 컬러 텍스트를 얹는 방식으로 우회한다(레이어당 작은 borderw=3을
      // 더해 4방향 사이 틈도 메운다). 모든 트랙(부엉박사·금박사·황소특보)
      // 공용 헤더 렌더링이므로 이 방식은 전체에 적용된다.
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
      ].join(":")}`);
    });
  }

  if (channel) {
    const footerY = render.height - FOOTER_BAR.height;
    filters.push(
      `drawbox=x=0:y=${footerY}:w=${render.width}:h=${FOOTER_BAR.height}:color=${FOOTER_BAR.bgColor}:t=fill`,
    );
    filters.push(`drawtext=${[
      `fontfile='${OVERLAY_FONT_FOR_FILTER}'`,
      `text='${escapeDrawtextValue(channel)}'`,
      "x=(w-text_w)/2",
      `y=${footerY + Math.round((FOOTER_BAR.height - FOOTER_BAR.textSize) / 2) - 6}`,
      `fontsize=${FOOTER_BAR.textSize}`,
      `fontcolor=${FOOTER_BAR.textColor}`,
      "borderw=4",
      "bordercolor=black@0.8",
      "expansion=none",
    ].join(":")}`);
  }
  return filters;
}

function buildOverlayFilters(overlays) {
  // 금박사처럼 overlays 필드 자체가 없는 스펙도 있다(이미지 생성 단계에서 이미
  // 텍스트를 구워 넣어 오버레이 합성을 아예 안 쓰기로 한 트랙, 2026-09-19 확정).
  // undefined.map 크래시를 막기 위해 방어한다.
  return (overlays ?? []).map((o) => {
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

// ── 자막 텍스트를 화면 표기(숫자 그대로)로 바꾼다 ────────────────────────────
//
// TTS는 "영점이오퍼센트포인트"로 읽어야 자연스럽지만, 자막에는 "0.25%p"가 떠야
// 한다 — 숫자가 한글로 풀리면 읽는 속도가 느려지고, 벤치마킹 채널처럼 숫자를
// 크게 강조할 수도 없다.
//
// build-owl-tts-script-v1.mjs 가 낭독형과 표시형의 어절 수를 맞춰두는 것이
// 기본 계약이지만, "이십구점구오 퍼센트"(2어절) → "29.95%"(1어절)처럼 숫자를
// 표시형으로 압축하면 어절 수가 자연히 달라지는 경우가 있다(2026-09-28,
// 황소특보 7편에서 발견). 이 경우까지 지원하려고 정확히 같은 길이일 때만
// 쓰던 1:1 인덱스 매칭을, spoken/display를 앞에서부터 동시에 정렬해 서로
// 다른 구간을 하나의 치환 그룹으로 묶는 방식으로 확장한다 — 어절 수가 같은
// 기존 케이스는 그룹이 전부 1:1이 되어 동작이 그대로 보존된다.
function applyDisplayText(captions, ttsScenes) {
  const displayWordsByScene = new Map();
  for (const scene of ttsScenes) {
    const display = scene.captionDisplayText;
    if (!display) continue;
    const spoken = scene.speechDirection.performanceText.split(/\s+/);
    const displayWords = display.split(/\s+/);
    displayWordsByScene.set(Number(scene.sceneNumber), {
      spoken,
      display: displayWords,
      groups: alignWordGroups(spoken, displayWords),
    });
  }

  return captions.map((caption) => {
    const pair = displayWordsByScene.get(caption.sceneNumber);
    if (!pair) return caption;

    // 이 블록이 장면 안에서 차지하는 어절 구간을 찾아 같은 구간의 표시 어절로 바꾼다.
    const blockWords = caption.text.split(/\s+/);
    const startIndex = findWordOffset(pair.spoken, blockWords);
    if (startIndex < 0) return caption;
    const range = resolveDisplayRange(pair.groups, startIndex, blockWords.length);
    if (!range) return caption;
    const replaced = pair.display.slice(range.displayStart, range.displayEnd);
    // caption.wordTimings는 이 블록 안의 어절만 담고 있다(씬 전체가 아니다) —
    // matchedGroups는 씬 전체 기준 절대 인덱스이므로 블록 시작(startIndex)을
    // 빼서 caption.wordTimings 안에서의 상대 위치로 변환한다.
    const relativeGroups = range.matchedGroups.map((g) => ({
      ...g,
      spokenStart: g.spokenStart - startIndex,
    }));
    const replacedWordTimings = remapWordTimings(caption.wordTimings, relativeGroups);

    return rebuildCaptionText(caption, replaced, replacedWordTimings);
  });
}

/** spoken 어절 배열에서 blockWords 가 시작하는 위치를 찾는다. */
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

/**
 * spoken/display 어절 배열을 앞에서부터 동시에 정렬해, 일치하는 어절은
 * 1:1 그룹으로, 일치하지 않는 구간(숫자 표현 차이 등)은 다음으로 다시
 * 일치하는 앵커 어절이 나올 때까지 양쪽을 한 그룹으로 묶는다.
 * 반환값: [{ spokenStart, spokenLen, displayStart, displayLen }, ...]
 */
function alignWordGroups(spokenWords, displayWords) {
  const groups = [];
  let si = 0;
  let di = 0;
  while (si < spokenWords.length && di < displayWords.length) {
    if (spokenWords[si] === displayWords[di]) {
      groups.push({ spokenStart: si, spokenLen: 1, displayStart: di, displayLen: 1 });
      si += 1;
      di += 1;
      continue;
    }
    // 다음 일치 지점을 찾는다(양쪽 다 최대 6어절까지만 탐색 — 숫자 표현
    // 차이는 보통 1~2어절 안에서 끝난다).
    const MAX_LOOKAHEAD = 6;
    let found = null;
    for (let dsi = si + 1; dsi <= Math.min(si + MAX_LOOKAHEAD, spokenWords.length); dsi += 1) {
      for (let ddi = di + 1; ddi <= Math.min(di + MAX_LOOKAHEAD, displayWords.length); ddi += 1) {
        if (spokenWords[dsi] === displayWords[ddi]) { found = { dsi, ddi }; break; }
      }
      if (found) break;
    }
    const nextSi = found ? found.dsi : spokenWords.length;
    const nextDi = found ? found.ddi : displayWords.length;
    groups.push({
      spokenStart: si,
      spokenLen: nextSi - si,
      displayStart: di,
      displayLen: nextDi - di,
    });
    si = nextSi;
    di = nextDi;
  }
  if (si < spokenWords.length || di < displayWords.length) {
    groups.push({
      spokenStart: si,
      spokenLen: spokenWords.length - si,
      displayStart: di,
      displayLen: displayWords.length - di,
    });
  }
  return groups;
}

/**
 * spokenStart..spokenStart+spokenLen 구간이 그룹 경계와 정확히 맞아떨어질 때만
 * 대응하는 display 어절 범위 [displayStart, displayEnd) 와 그 구간을 이루는
 * 그룹들(각 그룹이 발화 어절 몇 개를 표시 어절 몇 개로 묶었는지)을 반환한다
 * (그룹 중간에서 끊기면 안전하게 포기해 원래 텍스트를 유지한다).
 */
function resolveDisplayRange(groups, spokenStart, spokenLen) {
  const spokenEnd = spokenStart + spokenLen;
  const startGroupIndex = groups.findIndex((g) => g.spokenStart === spokenStart);
  if (startGroupIndex < 0) return null;
  let cursor = spokenStart;
  let endGroupIndex = -1;
  for (let i = startGroupIndex; i < groups.length; i += 1) {
    if (groups[i].spokenStart !== cursor) return null;
    cursor += groups[i].spokenLen;
    if (cursor === spokenEnd) { endGroupIndex = i; break; }
    if (cursor > spokenEnd) return null;
  }
  if (endGroupIndex < 0) return null;

  const displayStart = groups[startGroupIndex].displayStart;
  const displayEnd = groups[endGroupIndex].displayStart + groups[endGroupIndex].displayLen;
  return { displayStart, displayEnd, matchedGroups: groups.slice(startGroupIndex, endGroupIndex + 1) };
}

/**
 * 발화 어절 기준 wordTimings(1개씩)를 표시 어절 그룹 단위로 다시 묶는다.
 * 한 그룹이 발화 어절 여러 개를 표시 어절 하나로 합쳤으면, 그 발화
 * 어절들의 첫 시작~마지막 끝을 이어붙여 표시 어절 하나의 타이밍으로 쓴다
 * (표시 어절 수가 그룹 수와 항상 같지는 않으므로 — 그룹 하나가 표시 어절
 * 여러 개를 만들 수도 있다 — 그 경우 그 그룹의 표시 어절들에게 같은
 * 시간 구간을 고르게 나눠 준다).
 */
function remapWordTimings(spokenTimings, matchedGroups) {
  if (!Array.isArray(spokenTimings) || matchedGroups.length === 0) return null;
  const result = [];
  let cursor = matchedGroups[0].spokenStart;
  for (const group of matchedGroups) {
    const groupTimings = spokenTimings.slice(cursor, cursor + group.spokenLen);
    if (groupTimings.length !== group.spokenLen || groupTimings.some((t) => !t)) return null;
    const startSec = groupTimings[0].startSec;
    const endSec = groupTimings[groupTimings.length - 1].endSec;
    if (group.displayLen === 1) {
      result.push({ startSec, endSec });
    } else {
      // 표시 어절이 여러 개면(드묾) 구간을 고르게 나눈다.
      const span = endSec - startSec;
      for (let k = 0; k < group.displayLen; k += 1) {
        result.push({
          startSec: startSec + (span * k) / group.displayLen,
          endSec: startSec + (span * (k + 1)) / group.displayLen,
        });
      }
    }
    cursor += group.spokenLen;
  }
  return result;
}

/**
 * 표시 어절로 교체한다. applyDisplayText는 styleCaptions(줄바꿈·시간축 분할)
 * 이전, buildDynamicCaptionTimeline이 만든 원시 블록(문장 전체 단위, 아직
 * 폭에 맞춰 줄바꿈되지 않은 상태) 에 대해 호출된다 — 그래야 이후
 * splitCaptionIntoScreenSafeBlocks가 "표시형 기준"으로 폭 계산·필요시 시간축
 * 분할까지 다시 판단할 수 있다. 치환을 먼저 하고 줄바꿈을 나중에 해야
 * 순서가 맞는다(거꾸로 하면 이미 확정된 줄 경계에 치환 결과가 억지로
 * 끼워 맞춰져 폭 위반이 생긴다 — 2026-09-28, 황소특보 7편에서 발견).
 *
 * wordTimings도 words와 나란히 다시 만든다 — replacedWordTimings가 주어지면
 * (발화 어절 여러 개가 표시 어절 하나로 합쳐진 구간의 시작~끝을 이어붙인
 * 값) 그것을 쓰고, 없으면 caption.wordTimings를 그대로 유지한다(어절 수가
 * 같아 1:1 매칭되는 기존 케이스).
 */
function rebuildCaptionText(caption, words, replacedWordTimings) {
  return {
    ...caption,
    text: words.join(" "),
    displayText: words.join(" "),
    wordTimings: replacedWordTimings ?? caption.wordTimings,
  };
}

// ── 글자 크기 확대 + 색 강조 규칙 ────────────────────────────────────────────
//
// 공용 모듈의 기본 크기(54~88)는 화면 폭을 절반쯤만 쓴다. 벤치마킹 채널은 자막이
// 화면 폭의 80% 이상을 차지할 만큼 크다 — 소리 없이 스크롤하는 사람이 자막만으로
// 내용을 따라갈 수 있어야 하기 때문이다.
//
// 색 강조도 다르다. 공용 모듈은 마지막 줄 전체를 색칠하는데, 벤치마킹은 핵심
// 숫자·키워드 몇 글자만 노란색이고 나머지는 흰색이다. 색이 많으면 강조가 아니라
// 장식이 된다.
// 자막은 **한 자리에 한 크기로 고정**한다.
//
// 이전 버전은 블록마다 폭에 맞춰 46~108px로 자동 확대하고 위치도 3곳을 순환했다.
// 그 결과 글자가 커졌다 작아졌다, 왼쪽에 나왔다 중앙에 나왔다 하며 시선이 계속
// 흔들렸다(Owner 지적). 자동 최적화보다 일관성이 중요하다.
//
// 크기는 가장 긴 블록도 두 줄 안에 들어가는 값으로 고정한다. 길면 줄을 나누지,
// 글자를 줄이지 않는다.
// 모바일 검수(2026-09-17): 자막이 작게 보이고 일부 기기에서 화면 폭을 벗어난다는
// 지적 — 크기를 키우되(72→88) 좌우 여백을 넉넉히(80px) 둬 기종 간 화면비 차이에도
// 잘리지 않게 한다.
const CAPTION_MAX_WIDTH_PX = 920; // 1080 - 좌우 여백 80씩
const CAPTION_FONT_SIZE = 88;
const CAPTION_FIXED_X = 540;      // 항상 화면 중앙
const CAPTION_FIXED_Y = 1500;     // 항상 하단 고정

// 강조는 세 색을 쓴다(모바일 재검수 2026-09-17: "노랑·빨강 두 색밖에 안 보인다,
// 3색을 쓴다고 했는데" 지적 — number와 key가 같은 노랑을 공유해 실질 2색이었다).
//   노랑 = 수치 (기억해야 할 숫자)
//   청록 = 핵심 개념어 (이 영상이 설명하는 용어 — 가계부채, 총량 규제, 대출금리 등)
//   빨강 = 위험·부담 (조심해야 할 것)
// 나머지는 흰색. 한 줄에 최대 2어절까지만 칠해 절제한다.
const EMPHASIS_NUMBER_PATTERNS = [
  /[0-9]+(?:\.[0-9]+)?%p?/,      // 0.25%p, 2.75%, 20%
  /[0-9,]+(?:만|천|억|조)?원/,    // 1000만원, 6조원
  /[0-9]+(?:개월|월|일|년|위)/,   // 34개월, 8월, 27일, 9위
];
// 이 영상이 설명하는 핵심 개념 + 출처 기관명. 처음 듣는 말일수록, 그리고
// "이 숫자 어디서 왔는지"가 눈에 띄어야 한다. 편마다 새 용어가 등장하므로
// 여러 편의 용어를 함께 등록해 재사용한다(2편 재검수 2026-09-17: "가계부채,
// 총량규제, 세계9위, 대출금리, 변동금리도 포인트 단어가 될 수 있는데" 지적 —
// 1편 용어만 있어 2편에서 하나도 안 걸렸음). 기관명도 같은 카테고리(청록)로
// 묶는다 — 3편에서 "주요 단어·주요 수치·주요 기관에 포인트를 써야지, 지금
// 무슨 기준으로 넣는지 이해가 안 된다"는 지적을 받고서야 기관명 강조 자체가
// 빠져 있었음을 발견했다(2026-09-18). 새 편을 붙일 때는 그 편의 핵심
// 개념어·출처 기관명을 반드시 여기 추가할 것 — 안 하면 EMPHASIS_NUMBER_PATTERNS
// 에 안 걸리는 단어는 전부 조용히 강조 없이 지나간다.
const EMPHASIS_KEY_TERMS = [
  // 1·2편(대출·가계부채)
  "여전채", "기준금리", "카드론", "리볼빙", "마이너스통장", "팔로우",
  "가계부채", "총량", "대출금리", "변동금리", "고정금리", "규제",
  // 3편(전세난·부동산) 개념어
  "전세난", "전세", "실거주", "갱신청구권", "안심신탁", "전세사기",
  // 출처 기관명(3편)
  "한국부동산원", "HUG", "동아일보", "이투데이", "연합인포맥스",
  // 4편(초소형 아파트 급등) 개념어
  "실거래가", "청약", "특별공급", "생애최초", "신혼부부", "디딤돌대출", "진입장벽",
  // 5편(한국은행 11월 추가 인상) 출처 기관명 및 개념어
  "한국은행", "중앙일보", "파이낸셜뉴스", "국고채", "코스피", "자산시장",
  // 금박사 1편(IRP 세액공제) 개념어 및 출처 기관명 — 이 목록에 없으면
  // EMPHASIS_NUMBER_PATTERNS에 안 걸리는 일반 단어는 조용히 강조 없이
  // 지나간다(2026-09-19 Owner 지적: "30초 이전까지 강조색이 하나도 안 나온다").
  "금박사", "IRP", "저금통", "세금", "돌려받는", "누구나", "계좌", "ETF",
  "국세청", "노후", "노후통장",
];
// 부담·위험을 가리키는 말. 빨강으로 경고 신호를 준다.
const EMPHASIS_RISK_TERMS = ["최고", "비싼", "비싸", "늘어", "빠져나갔", "올랐", "오르면", "인상", "경고"];

// 편마다 EMPHASIS_KEY_TERMS에 수동으로 용어를 추가하는 방식은 새 편을 만들 때
// 통째로 빠뜨리기 쉽다(2026-09-20 Owner 지적 — 금박사 3편/레버리지 전체가
// 누락돼 자막에 강조색이 하나도 안 붙었음, 2편/ETF 때도 같은 문제 반복).
// 이제 각 편의 스펙 파일이 emphasisTerms 배열로 그 편의 핵심 개념어·출처
// 기관명을 직접 선언하고, 조립기는 이를 공용 목록에 자동 병합한다 — 새 편을
// 추가할 때 이 파일을 다시 열어 고칠 필요가 없다.
//
// 배열의 첫 번째 항목은 반드시 "그 편의 대표 주제어"(제목에 들어가는 단어 —
// 환율편이면 "환율", IRP편이면 "IRP")여야 한다. 아래 findEmphasisSpan에서
// 이 단어를 최우선으로 강조한다(2026-09-20 Owner 지적: "1편이면 환율, 2편이면
// IRP처럼 편 제목 단어가 강조 안 되는 경우가 있다" — 기존엔 한 자막 줄에 숫자
// 강조가 이미 2개 채워지면 우선순위가 낮은 개념어가 밀려 강조되지 않았다).
const SPEC_EMPHASIS_TERMS = Array.isArray(ASSEMBLY_SPEC.emphasisTerms) ? ASSEMBLY_SPEC.emphasisTerms : [];
if (SPEC_EMPHASIS_TERMS.length === 0) {
  console.warn(
    `[WARN][assemble-v2] 스펙에 emphasisTerms가 없습니다 — 이 편의 핵심 개념어가 ` +
      `자막에서 전부 강조 없이 지나갈 수 있습니다. 스펙 파일에 emphasisTerms: [...] 를 추가하세요.`,
  );
}
const SPEC_TOPIC_TERM = SPEC_EMPHASIS_TERMS[0] ?? null;
EMPHASIS_KEY_TERMS.push(...SPEC_EMPHASIS_TERMS.filter((t) => !EMPHASIS_KEY_TERMS.includes(t)));

// 어절 안에서 강조할 정확한 부분 문자열(span)을 찾는다. word.includes(t) 로만
// 판정하면 "팔로우해두면"처럼 조사·어미가 붙은 어절 전체가 강조돼버린다
// (모바일 검수 2026-09-17: "팔로우"만 강조하고 "해두면"은 흰색이어야 함).
// 어근의 위치(start~end)까지 반환해 그 부분만 색칠하고 나머지는 흰색으로 둔다.
function findEmphasisSpan(word) {
  // 그 편의 대표 주제어(편 제목 단어)는 무엇보다 먼저 확인한다 — 한 줄의
  // 강조 슬롯이 숫자로 이미 다 차서 밀려나는 일이 없도록 kind를 별도로 둔다.
  if (SPEC_TOPIC_TERM) {
    const i = word.indexOf(SPEC_TOPIC_TERM);
    if (i >= 0) return { kind: "topic", start: i, end: i + SPEC_TOPIC_TERM.length };
  }
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

/**
 * 강조할 어절 인덱스 → { kind, start, end }. 편 대표 주제어가 항상 최우선,
 * 그다음 수치, 위험, 나머지 개념어 순(2026-09-20 Owner 지적 반영 — 편 제목
 * 단어가 숫자에 밀려 강조에서 빠지는 사례가 있었다). 한 줄 최대 2어절까지
 * 칠하는 절제 원칙은 유지하되, topic은 이 상한과 무관하게 항상 포함한다.
 */
function emphasisMapFor(line) {
  const words = line.split(/\s+/).filter(Boolean);
  const hits = [];
  words.forEach((word, index) => {
    const span = findEmphasisSpan(word);
    if (span) {
      const priority = span.kind === "topic" ? -1 : span.kind === "number" ? 0 : span.kind === "risk" ? 1 : 2;
      hits.push({ index, ...span, priority });
    }
  });
  const topicHits = hits.filter((h) => h.priority === -1);
  const otherHits = hits.filter((h) => h.priority !== -1).sort((a, b) => a.priority - b.priority);
  const otherSlots = Math.max(0, 2 - topicHits.length);
  const picked = [...topicHits, ...otherHits.slice(0, otherSlots)];
  return Object.fromEntries(picked.map((hit) => [hit.index, hit]));
}

/**
 * 블록이 화면 폭에 맞는 최대 크기를 찾는다. Black Han Sans 는 한글이 거의
 * 정사각형이라 글자수 × 크기로 폭을 근사할 수 있다(영문·숫자는 약 0.55배).
 */
/** Black Han Sans 기준 글자폭 근사. 한글은 거의 정사각, 영숫자는 약 0.55배. */
function textWidthRatio(text) {
  let ratio = 0;
  for (const char of String(text)) {
    if (char === " ") ratio += 0.3;
    else if (/[0-9A-Za-z.%,→]/.test(char)) ratio += 0.55;
    else ratio += 1;
  }
  return ratio;
}

/**
 * 고정 크기로 줄을 나눈다. 글자를 줄이는 대신 줄을 늘린다.
 *
 * 폭이 찰 때까지 채우는 단순 방식은 "…올렸어." 같은 한 단어짜리 둘째 줄을
 * 만든다(Owner 지적). 두 줄이 필요하면 **양쪽 폭이 비슷해지는 지점**에서 나눠
 * 시각적으로 안정된 덩어리를 만든다.
 */
// 모바일 재검수(2026-09-17): "자막은 2줄까지만, 3줄은 너무 길다. 대신 문장을
// 마음대로 끊으면 안 되고 자연스러운 흐름으로" — 이전에는 폭을 넘으면 3줄 이상
// 순차 분할로 폴백했다. 블록 자체를 짧게 만드는 것(_money-shorts-dynamic-
// captions.mjs 의 MAX_VISIBLE_CHARS_PER_BLOCK)이 1차 방어선이지만, 그래도 폭을
// 넘는 블록이 있으면 여기서 절대 3줄로 넘어가지 않고 좌우 폭 차이가 최소인
// 지점에서 강제로 2줄로만 나눈다(폭이 살짝 넘쳐도 2줄 유지가 우선).
function wrapToLines(text, fontSize, maxWidth) {
  const words = String(text).split(/\s+/).filter(Boolean);
  if (words.length === 0) return [String(text)];
  if (words.length === 1 || textWidthRatio(words.join(" ")) * fontSize <= maxWidth) {
    return [words.join(" ")];
  }

  // 좌우 폭 차이가 가장 작은 분할점을 고른다. 폭 제한 안에 드는 분할이 없으면
  // null을 반환한다 — 호출부(splitCaptionIntoScreenSafeBlocks)가 이 경우 블록
  // 자체를 시간축으로 나눠 각 조각이 폭 안에 들어가게 한다. 여기서 폭을 무시하고
  // 2줄로 우겨넣으면 화면 밖으로 글자가 밀려난다(재검수 2026-09-17: "6번째 영상
  // 50초부근 자막이 화면을 넘어간다" — 이전 수정에서 "3줄 금지"만 우선하다가
  // 화면 밖으로 나가는 걸 허용해버린 회귀).
  //
  // 관형사(순우리말 수 관형사·지시 관형사) 바로 뒤는 분할 금지 — "한 달", "두
  // 번", "그 종목"처럼 뒤 명사와 붙어야 하는 조합이 폭 균형만 보고 줄바꿈되면
  // "한" / "달"처럼 어색하게 갈린다(2026-09-20, 8편 2번째 씬에서 실제 발생).
  // 부정 부사("못", "안") 바로 뒤도 동일하게 금지 — "못 받게"가 "못" / "받게"로
  // 갈리면 부정의 의미가 화면상 끊겨 보인다(2026-09-24, 15편 s7에서 실제 발생:
  // "남은 실업급여도 못" / "받게 기준이"로 분리됨).
  const WRAP_DETERMINER_PATTERN = /^(한|두|세|네|다섯|여섯|일곱|여덟|아홉|열|그|이|저|또|몇|못|안)$/u;
  let bestWithinLimit = null;
  for (let split = 1; split < words.length; split += 1) {
    if (WRAP_DETERMINER_PATTERN.test(words[split - 1])) continue;
    const left = words.slice(0, split).join(" ");
    const right = words.slice(split).join(" ");
    const leftWidth = textWidthRatio(left) * fontSize;
    const rightWidth = textWidthRatio(right) * fontSize;
    if (leftWidth > maxWidth || rightWidth > maxWidth) continue;
    const score = Math.abs(leftWidth - rightWidth);
    if (!bestWithinLimit || score < bestWithinLimit.score) bestWithinLimit = { score, lines: [left, right] };
  }
  return bestWithinLimit ? bestWithinLimit.lines : null;
}

/** 자막 끝의 문장부호를 지운다. 화면에서는 군더더기다(Owner 지적). */
// 의문형/감탄형 부호(?, !)는 의미를 바꾸므로 보존한다(Owner 2026-09-18:
// "알고 있었어" → "알고 있었어?"로 고쳐야 한다는 지적 — 쉼표·마침표만 지저분해
// 보여서 지우려던 게 물음표까지 지워버리는 회귀였다).
function stripTrailingPunctuation(text) {
  return String(text).replace(/[,.·…]+$/u, "").trimEnd();
}

function toStyledCaption(caption, cleaned, lines) {
  const lineVisuals = lines.map((line) => ({
    text: line,
    emphasisByWordIndex: emphasisMapFor(line),
  }));
  const halfHeight = Math.ceil(lines.length * CAPTION_FONT_SIZE * 0.72 + 18);
  return {
    ...caption,
    x: CAPTION_FIXED_X,
    y: CAPTION_FIXED_Y,
    fontSize: CAPTION_FONT_SIZE,
    displayText: cleaned,
    lineVisuals,
    displayLines: lines,
    placementId: "owl_fixed",
    visualTop: CAPTION_FIXED_Y - halfHeight,
    visualBottom: CAPTION_FIXED_Y + halfHeight,
  };
}

// 2줄·폭 안에 도저히 안 들어가는 블록(25자 이상 등)을 wordTimings로 시간축을
// 나눠 여러 자막 이벤트로 쪼갠다. 조각 수를 2부터 늘려가며 "모든 조각이 2줄
// 폭 제한 안에 들어가는" 최소 조각 수를 찾는다 — 문장을 억지로 끊지 않고
// 어절 경계에서만 나누고, 각 조각의 시간 범위는 해당 어절들의 실제 발화
// 타이밍(wordTimings)을 그대로 쓴다.
function splitCaptionIntoScreenSafeBlocks(caption) {
  const cleaned = stripTrailingPunctuation(caption.displayText);
  const fitLines = wrapToLines(cleaned, CAPTION_FONT_SIZE, CAPTION_MAX_WIDTH_PX);
  if (fitLines) {
    return [toStyledCaption(caption, cleaned, fitLines.map(stripTrailingPunctuation))];
  }

  const words = cleaned.split(/\s+/).filter(Boolean);
  const timings = Array.isArray(caption.wordTimings) ? caption.wordTimings : null;
  if (!timings || timings.length !== words.length) {
    // 시간 정보가 없으면(방어적 폴백) 폭을 넘더라도 2줄 강제였던 이전 동작을 유지.
    const forced = wrapToLinesForced(cleaned, CAPTION_FONT_SIZE, CAPTION_MAX_WIDTH_PX);
    return [toStyledCaption(caption, cleaned, forced.map(stripTrailingPunctuation))];
  }

  // 관형사(순우리말 수 관형사·지시 관형사) 바로 뒤는 분할 금지 — "한 달", "두 번",
  // "그 종목"처럼 뒤 명사와 의미상 붙어 있어야 하는 조합이 "N등분" 균등 분할에
  // 걸려 "한"과 "달"이 서로 다른 자막 조각으로 쪼개지는 버그(2026-09-20, 8편
  // 2번째 씬 "4개 중 1개는 한 / 달 이후"로 실제 발생) 재발 방지.
  // 부정 부사("못", "안") 바로 뒤도 동일하게 금지(2026-09-24, 15편 s7 "못 받게"
  // 분리 사고 재발 방지 — wrapToLines의 WRAP_DETERMINER_PATTERN과 동일 패턴).
  const DETERMINER_PATTERN = /^(한|두|세|네|다섯|여섯|일곱|여덟|아홉|열|그|이|저|또|몇|못|안)$/u;
  const forbiddenSplitAfter = new Set(
    words.reduce((acc, word, index) => {
      if (index < words.length - 1 && DETERMINER_PATTERN.test(word)) acc.push(index);
      return acc;
    }, []),
  );

  for (let parts = 2; parts <= words.length; parts += 1) {
    const groupSize = Math.ceil(words.length / parts);
    const rawBoundaries = [];
    for (let i = groupSize; i < words.length; i += groupSize) rawBoundaries.push(i);
    // 금지된 경계(관형사 직후)는 한 칸 뒤로 민다 — 그룹 개수는 유지하되 그
    // 경계만 다음 어절 뒤로 옮겨서 관형사+명사가 항상 같은 그룹에 남게 한다.
    const boundaries = rawBoundaries.map((b) => (forbiddenSplitAfter.has(b - 1) ? b + 1 : b));
    const groups = [];
    let prev = 0;
    for (const b of boundaries) {
      const clamped = Math.min(b, words.length - 1);
      if (clamped > prev) groups.push(words.slice(prev, clamped));
      prev = clamped;
    }
    groups.push(words.slice(prev));
    if (groups.some((g) => g.length === 0) || groups.length < 2) continue;

    const groupLines = groups.map((g) => wrapToLines(g.join(" "), CAPTION_FONT_SIZE, CAPTION_MAX_WIDTH_PX));
    if (groupLines.some((lines) => !lines)) continue; // 이 조각 수로는 아직 안 들어가는 조각이 있음

    let cursor = 0;
    return groups.map((group, index) => {
      const startWord = timings[cursor];
      const endWord = timings[cursor + group.length - 1];
      cursor += group.length;
      const text = group.join(" ");
      return toStyledCaption(
        { ...caption, startSec: startWord.startSec, endSec: endWord.endSec },
        stripTrailingPunctuation(text),
        groupLines[index].map(stripTrailingPunctuation),
      );
    });
  }

  // 모든 조각 수를 시도해도 안 되면(사실상 불가능) 마지막 안전망으로 강제 2줄.
  const forced = wrapToLinesForced(cleaned, CAPTION_FONT_SIZE, CAPTION_MAX_WIDTH_PX);
  return [toStyledCaption(caption, cleaned, forced.map(stripTrailingPunctuation))];
}

/** wrapToLines가 null을 반환할 때(폭 초과)의 최후 안전망 — 폭을 무시하고 좌우 균형 2줄. */
function wrapToLinesForced(text, fontSize, maxWidth) {
  const words = String(text).split(/\s+/).filter(Boolean);
  if (words.length <= 1) return [text];
  const FORCED_DETERMINER_PATTERN = /^(한|두|세|네|다섯|여섯|일곱|여덟|아홉|열|그|이|저|또|몇)$/u;
  let best = null;
  for (let split = 1; split < words.length; split += 1) {
    if (FORCED_DETERMINER_PATTERN.test(words[split - 1]) && split < words.length - 1) continue;
    const left = words.slice(0, split).join(" ");
    const right = words.slice(split).join(" ");
    const score = Math.abs(textWidthRatio(left) - textWidthRatio(right));
    if (!best || score < best.score) best = { score, lines: [left, right] };
  }
  return best ? best.lines : [words.slice(0, 1).join(" "), words.slice(1).join(" ")];
}

function styleCaptions(captions) {
  return captions.flatMap(splitCaptionIntoScreenSafeBlocks);
}

// ── ASS 생성 (어절 단위 색 강조) ─────────────────────────────────────────────
//
// 공용 createDynamicCaptionAss 는 줄 전체를 한 색으로 칠한다. 벤치마킹처럼 한 줄
// 안에서 숫자만 노란색으로 만들려면 인라인 색 태그가 필요해 여기서 따로 만든다.
// ASS 색은 BGR 순서다(RGB가 아니다).
const CAPTION_WHITE = "&H00FFFFFF";
const CAPTION_AMBER = "&H0057C8FF"; // #FFC857 — 수치
const CAPTION_CYAN = "&H00E3C452";  // #52C4E3 — 핵심 개념어(3색 체계, 2026-09-17 추가)
const CAPTION_RED = "&H004B4BFF";   // #FF4B4B — 위험·부담
// topic(편 대표 주제어)은 개념어와 같은 카테고리이므로 같은 청록을 쓴다.
const EMPHASIS_COLORS = { number: CAPTION_AMBER, key: CAPTION_CYAN, topic: CAPTION_CYAN, risk: CAPTION_RED };

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
    "Title: Owl Shorts Captions",
    "ScriptType: v4.00+",
    "PlayResX: 1080",
    "PlayResY: 1920",
    "ScaledBorderAndShadow: yes",
    "WrapStyle: 2",
    "",
    "[V4+ Styles]",
    "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
    // 두꺼운 검정 외곽선(Outline 8) + 짙은 그림자. 밝은 배경(석양·건물) 위에서도
    // 흰 글자가 묻히지 않는다. BorderStyle=3(불투명 박스)은 libass에서 \fad 와
    // 함께 쓰면 박스가 그려지지 않는 경우가 있어 외곽선 방식을 쓴다.
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
      // 어절 전체가 아니라 강조 대상 부분 문자열(start~end)만 색칠한다 — 조사나
      // 어미까지 함께 칠해지면 강조가 아니라 문장 단위 음영처럼 보인다
      // (모바일 검수 2026-09-17: "팔로우해두면" 전체가 아니라 "팔로우"만).
      const body = String(visual.text).split(/\s+/).filter(Boolean).map((word, wordIndex) => {
        const span = emphasis[wordIndex];
        const color = span && EMPHASIS_COLORS[span.kind];
        if (!color) return escapeAssText(word);
        const before = word.slice(0, span.start);
        const target = word.slice(span.start, span.end);
        const after = word.slice(span.end);
        return `${escapeAssText(before)}{\\1c${color}}${escapeAssText(target)}{\\1c${CAPTION_WHITE}}${escapeAssText(after)}`;
      }).join(" ");
      // 짧게 튀어오르는 진입. 자막이 자주 바뀌므로 모션은 가볍게 유지한다.
      const tags = `{\\an5\\pos(${caption.x},${y})\\fs${caption.fontSize}\\fscx94\\fscy94\\t(0,120,0.7,\\fscx100\\fscy100)}`;
      lines.push(
        `Dialogue: 0,${secToAssTime(caption.startSec)},${secToAssTime(caption.endSec)},OwlCaption,,0,0,0,,${tags}${body}`,
      );
    });
  }
  return lines.join("\n") + "\n";
}

// ── 부엉이 구도 전용 자막 배치 ───────────────────────────────────────────────
//
/**
 * 위치·크기가 고정됐으므로 audit의 "동적 배치" 항목은 의미가 없다.
 * 공용 계약은 자막이 여러 위치를 순환하기를 요구하지만, 그건 인물이 화면 하단에
 * 있는 일반 쇼츠 기준이다. 부엉이는 화면 중앙에 고정돼 있어 자막이 움직이면
 * 오히려 시선이 흔들린다 — 이 콘텐츠에서는 고정이 맞다.
 */
// 재검수(2026-09-17): "6번째 영상 50초부근 자막이 화면을 넘어간다"는 지적이
// 나올 때까지 이 검사가 없었다 — styleCaptions의 재분할 로직만 믿고 렌더 결과를
// 실측하지 않았다. 다시는 육안 검수에만 의존하지 않도록, 실제로 화면에 나가는
// 모든 줄의 폭을 여기서 다시 계산해 넘는 줄이 하나라도 있으면 조립 자체를
// 실패시킨다(mustPass 목록에 포함).
function screenWidthAudit(captions) {
  const overflow = [];
  for (const caption of captions) {
    for (const line of caption.displayLines ?? []) {
      const width = textWidthRatio(line) * caption.fontSize;
      if (width > CAPTION_MAX_WIDTH_PX) overflow.push({ sceneNumber: caption.sceneNumber, line, width: Math.round(width) });
    }
  }
  return { captionWidthPass: overflow.length === 0, captionWidthOverflow: overflow };
}

// displayUnitLengthPass는 원래 _money-shorts-dynamic-captions.mjs의
// buildDynamicCaptionTimeline() audit이 재분할 전 캡션 기준으로 계산해서 넘겨준
// 값인데, fixedPlacementAudit가 이 필드를 덮어쓰지 않아 styleCaptions() 재분할
// 이후에도 재분할 "전" 판정이 그대로 mustPass 게이트에 남는 버그였다(2026-09-18
// 3편 조립 중 발견 — 재분할 후 실제 자막은 폭·줄수 모두 정상인데 이 필드만 오래된
// 값이라 ABORT됨). 재분할 후 캡션 기준으로 다시 계산해 정확한 값으로 덮어쓴다.
function displayUnitLengthAudit(captions) {
  const MAX_VISIBLE_CHARS_PER_BLOCK = 30;
  const MAX_VISIBLE_CHARS_PER_LINE = 15;
  const visibleCharCount = (text) => String(text).replace(/\s+/g, "").length;
  return captions.every((c) => {
    const lines = c.displayLines ?? [c.displayText];
    const blockChars = visibleCharCount(lines.join(""));
    const maxLineChars = Math.max(...lines.map(visibleCharCount));
    return lines.length <= 2 && blockChars <= MAX_VISIBLE_CHARS_PER_BLOCK && maxLineChars <= MAX_VISIBLE_CHARS_PER_LINE;
  });
}

function fixedPlacementAudit(captions) {
  return {
    minY: CAPTION_FIXED_Y,
    maxY: CAPTION_FIXED_Y,
    distinctYPositions: 1,
    distinctPlacements: 1,
    longestSamePlacementRun: captions.length,
    positionStrategy: "owl_fixed_bottom_single_position_v1",
    fontSizeFixed: CAPTION_FONT_SIZE,
    safeFramePass: captions.every((c) => c.visualBottom <= render.height - FOOTER_BAR.height - 10),
    captionLineCountPass: captions.every((c) => (c.displayLines?.length ?? 1) <= 2),
    dynamicPlacementPass: true,           // 의도적 고정
    multiPositionNarrativeFlowPass: true, // 의도적 고정
    displayUnitLengthPass: displayUnitLengthAudit(captions),
    ...screenWidthAudit(captions),
  };
}

const sceneOutputs = [];
const timeline = [];

for (let i = 0; i < scenes.length; i++) {
  const scene = scenes[i];
  const audioScene = videoCutScenes[i];
  const clip = path.join(CLIP_DIR, scene.video);
  if (!fs.existsSync(clip)) {
    console.error(`ABORT: 클립이 없습니다: ${clip}`);
    process.exit(1);
  }

  // 장면 길이는 오디오가 정한다. scene.tailPadSec이 있으면(2026-09-18, s11
  // 전용) 그만큼 더 늘린다 — 오디오가 클립보다 훨씬 짧아 말이 끝나자마자
  // 화면이 뚝 끊기는 특정 씬만 개별 보정한다.
  // 마지막 장면을 "오디오 파일 전체 길이(audioDuration)까지 채운다"던 이전
  // 로직은, videoCutScenes 계산 단계에서 이미 클립 길이 기준으로 캡해 둔
  // endSec(정지 프레임 방지)을 여기서 다시 audioDuration으로 덮어써 캡을
  // 무력화시키는 버그였다(Owner 지적, 2026-09-22: "1:13부터 영상 정지하고
  // 말만 나온다" — 부엉이 12편 s10, 캡 적용 후에도 8.45초로 그대로였음).
  // videoCutScenes[i].endSec을 그대로 신뢰한다.
  const startSec = Number(audioScene.startSec);
  const tailPadSec = Number.isFinite(scene.tailPadSec) ? scene.tailPadSec : 0;
  const endSec = Number(audioScene.endSec) + tailPadSec;
  const targetDuration = endSec - startSec;
  if (!Number.isFinite(targetDuration) || targetDuration <= 0) {
    console.error(`ABORT: scene ${scene.scene} 의 오디오 구간이 올바르지 않습니다.`);
    process.exit(1);
  }

  const clipDuration = probeDuration(clip);
  // 제목이 영상 위에 얹히므로 영상은 화면 전체를 그대로 쓴다.
  const bodyTop = 0;
  const vFilters = [
    `scale=${render.width}:${render.height}:flags=lanczos`,
    "setsar=1",
  ];
  if (targetDuration > clipDuration + 0.05) {
    vFilters.push(`tpad=stop_mode=clone:stop_duration=${(targetDuration - clipDuration).toFixed(3)}`);
  }
  // 2026-09-19 되돌림: 나레이션이 클립보다 짧을 때 setpts로 slow-down을 시도
  // 했으나, 캐릭터 동작 자체가 느려 보여 더 부자연스럽다는 지적(Owner: "슬로우
  // 모션 켜놓은거 같아서 너무 이상해, 차라리 이전 영상이 나아"). 원인은 재생
  // 속도가 아니라 압축된 나레이션이 만드는 장면 전환 리듬이었다 — 이 부분은
  // 대본/씬 길이 설계로 풀 문제이지 영상 재생 속도로 풀 문제가 아니다. 앞부분만
  // 자르는 기본 동작(-t targetDuration)으로 복귀.
  vFilters.push(...buildHeaderFooterFilters());
  vFilters.push(...buildOverlayFilters(scene.overlays));
  vFilters.push(...buildSceneRiskDisclosureFilters(scene));

  const outFile = path.join(SCENE_DIR, `scene_${String(scene.scene).padStart(2, "0")}.mp4`);
  log(`scene ${scene.scene} (${scene.key}): clip=${clipDuration.toFixed(2)}s → ${targetDuration.toFixed(2)}s${scene.overlays?.length ? ` +overlay×${scene.overlays.length}` : ""}`);
  run("ffmpeg", [
    "-y", "-i", clip,
    "-an", // 소스 오디오는 버린다. 최종 오디오는 연속 TTS 하나뿐이다.
    "-vf", vFilters.join(","),
    "-t", targetDuration.toFixed(3),
    "-r", String(render.fps),
    "-c:v", render.videoCodec, "-preset", "medium", "-crf", String(render.crf),
    "-pix_fmt", render.pixFmt,
    outFile,
  ]);

  sceneOutputs.push(outFile);
  timeline.push({
    scene: scene.scene,
    key: scene.key,
    start: Number(startSec.toFixed(3)),
    duration: Number(targetDuration.toFixed(3)),
  });
}

// ── 2단계: 무음 타임라인 영상 ────────────────────────────────────────────────

const concatList = path.join(OUT_DIR, "concat.txt");
fs.writeFileSync(
  concatList,
  sceneOutputs.map((f) => `file '${f.replace(/\\/g, "/")}'`).join("\n") + "\n",
  "utf8",
);
const silentPath = path.join(OUT_DIR, "owl_timeline_silent.mp4");
log(`concat → ${path.basename(silentPath)}`);
run("ffmpeg", ["-y", "-f", "concat", "-safe", "0", "-i", concatList, "-c", "copy", silentPath]);
const silentDuration = probeDuration(silentPath);

// ── 3단계: 동적 자막 ASS 생성 ────────────────────────────────────────────────

let assPath = null;
let captionAudit = null;
if (!NO_CAPTIONS) {
  if (!fs.existsSync(TTS_SCRIPT)) {
    console.error(`ABORT: TTS 스크립트가 없습니다: ${TTS_SCRIPT}`);
    process.exit(1);
  }
  const ttsScript = JSON.parse(fs.readFileSync(TTS_SCRIPT, "utf8"));
  const alignmentPath = summary.alignmentPath;
  if (!alignmentPath || !fs.existsSync(alignmentPath)) {
    console.error(`ABORT: alignment 파일이 없습니다: ${alignmentPath}`);
    process.exit(1);
  }
  const alignmentDocument = JSON.parse(fs.readFileSync(alignmentPath, "utf8"));

  let timelineResult;
  try {
    timelineResult = buildDynamicCaptionTimeline({
      ttsScenes: ttsScript.scenes,
      audioScenes,
      alignmentDocument,
    });
  } catch (error) {
    console.error(`ABORT: 자막 타임라인 생성 실패: ${error.message}`);
    process.exit(1);
  }
  // 자막 endSec은 alignment 기준(audioScenes, 원본 좌표계)으로 계산되는데,
  // 화면 컷(videoCutScenes)은 씬마다 클립 실제 길이로 캡되어 더 일찍 끝나는
  // 경우가 있다(2026-09-22 캡 로직 추가 이후). 그 결과 화면은 이미 다음
  // 씬으로 넘어갔는데 이전 문장 자막이 1~2초 더 남아있는 어긋남이 생겼다
  // (Owner 지적, 2026-09-22: "씬3에서 나온 자막이 씬4 첫 장면에 1~2초 떠있다
  // 사라진다"). 각 캡션의 endSec을 그 씬의 실제 화면 컷 종료 시각을 넘지
  // 않도록 사후 캡한다.
  // 씬 경계에 딱 맞춰 캡하면(마진 0) 다음 씬 화면으로 전환되는 첫 몇 프레임
  // 동안에도 이전 자막이 아직 화면에 남아 보인다(실측: 2026-09-22, s4→s5
  // 경계 34.8초, 캡한 endSec이 34.79초였는데도 35.0초 프레임에 이전 자막이
  // 그대로 남아있었다 — burn-in 렌더링 직전 프레임까지 표시되는 것으로
  // 추정). 0.15초 마진으로 1차 수정했으나 "아까보단 좋아졌는데 그래도 조금
  // 물린다"는 재지적(Owner, 2026-09-22)으로 0.35초로 늘렸고, "조금만 더
  // 땡기는게 좋을거 같다"는 3차 지적으로 0.5초까지 늘린다.
  const CAPTION_SCENE_END_MARGIN_SEC = 0.5;
  const cappedCaptions = timelineResult.captions.map((caption) => {
    const sceneEnd = Number(videoCutScenes[caption.sceneIndex]?.endSec);
    if (!Number.isFinite(sceneEnd)) return caption;
    const cap = sceneEnd - CAPTION_SCENE_END_MARGIN_SEC;
    if (caption.endSec <= cap) return caption;
    const endSec = Math.max(caption.startSec + 0.05, cap);
    return { ...caption, endSec, dwellSec: Number((endSec - caption.startSec).toFixed(3)) };
  });
  // 표시 텍스트(숫자 그대로)로 바꾼 뒤 고정 크기·고정 위치로 스타일을 입힌다.
  const captions = styleCaptions(
    applyDisplayText(cappedCaptions, ttsScript.scenes),
  );
  captionAudit = { ...timelineResult.audit, ...fixedPlacementAudit(captions) };
  assPath = path.join(OUT_DIR, "owl_captions.ass");
  fs.writeFileSync(assPath, createOwlCaptionAss(captions), "utf8");
  log(`자막 ${captions.length}블록(재분할 후), 최대 ${captionAudit.maxWordsPerBlock}어절 / ${captionAudit.maxDwellSec.toFixed(2)}s`);
  if (captionAudit.captionWidthOverflow.length > 0) {
    log(`WARN: 폭 초과 줄 ${captionAudit.captionWidthOverflow.length}개: ${JSON.stringify(captionAudit.captionWidthOverflow.slice(0, 3))}`);
  }

  // 계약 위반은 조용히 넘기지 않는다 — 하단 고정 자막이 되어버리면 벤치마킹과 달라진다.
  // captionWidthPass/captionLineCountPass는 재검수(2026-09-17)에서 "자막이 화면을
  // 넘어간다"는 지적을 받고서야 추가됐다 — styleCaptions의 재분할 결과를 실측하지
  // 않고 넘어간 게 원인이었다. 이제는 매 실행마다 자동으로 막는다.
  const mustPass = [
    "displayUnitLengthPass",
    "dwellPass",
    "safeFramePass",
    "dynamicPlacementPass",
    "fullScriptCoveragePass",
    "captionWidthPass",
    "captionLineCountPass",
  ];
  const failed = mustPass.filter((key) => captionAudit[key] !== true);
  if (failed.length > 0) {
    // --allow-caption-audit-fail 은 스타일 육안 확인용 프리뷰 전용이다.
    // 최종본에는 절대 쓰지 않는다 — 계약 위반 자막이 그대로 나간다.
    if (process.argv.includes("--allow-caption-audit-fail")) {
      log(`WARN: 자막 계약 위반(프리뷰 모드로 계속): ${failed.join(", ")}`);
    } else {
      console.error(`ABORT: 자막 계약 위반: ${failed.join(", ")}`);
      process.exit(1);
    }
  }
}

// ── 4단계: 연속 오디오 mux + 자막 burn ───────────────────────────────────────

const finalOut = path.join(OUT_DIR, "owl_shorts_final.mp4");
const filterPath = (value) => value.replace(/\\/g, "/").replace(/^([A-Za-z]):/, "$1\\:");
const muxArgs = ["-y", "-i", silentPath, "-i", timelineAudioPath];
if (assPath) {
  muxArgs.push("-vf", `ass='${filterPath(assPath)}':fontsdir='${filterPath(CAPTION_FONTS_DIR)}'`);
  muxArgs.push("-c:v", render.videoCodec, "-preset", "medium", "-crf", String(render.crf), "-pix_fmt", render.pixFmt);
} else {
  muxArgs.push("-c:v", "copy");
}
muxArgs.push(
  "-map", "0:v:0", "-map", "1:a:0",
  "-c:a", render.audioCodec, "-b:a", render.audioBitrate,
  "-ar", String(render.audioSampleRate), "-ac", String(render.audioChannels),
  "-movflags", "+faststart",
  finalOut,
);
log(`mux + ${assPath ? "자막 burn" : "자막 없음"} → ${path.basename(finalOut)}`);
run("ffmpeg", muxArgs);

const finalDuration = probeDuration(finalOut);
fs.writeFileSync(
  path.join(OUT_DIR, "assembly-manifest.json"),
  JSON.stringify({
    schemaVersion: "owl_assembly_manifest_v2",
    specVersion: ASSEMBLY_SPEC.specVersion,
    title: ASSEMBLY_SPEC.title,
    audioMode: "continuous_tts",
    audioSourcePath: timelineAudioPath,
    audioDurationSec: Number(audioDuration.toFixed(3)),
    silentVideoDurationSec: Number(silentDuration.toFixed(3)),
    captionsEnabled: !NO_CAPTIONS,
    captionAudit,
    render,
    totalDurationSec: Number(finalDuration.toFixed(3)),
    timeline,
    output: finalOut,
    finishedAt: new Date().toISOString(),
  }, null, 2) + "\n",
  "utf8",
);

log("─".repeat(50));
for (const t of timeline) log(`  ${t.key}: ${t.start.toFixed(1)}s ~ ${(t.start + t.duration).toFixed(1)}s`);
log(`오디오 ${audioDuration.toFixed(1)}s / 영상 ${silentDuration.toFixed(1)}s / 최종 ${finalDuration.toFixed(1)}s`);
log(`→ ${finalOut}`);
