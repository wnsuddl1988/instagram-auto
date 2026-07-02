#!/usr/bin/env node
// ──────────────────────────────────────────────────────────────────────────
// render-golden-sample-typography-mock-frames-v1.mjs
//
// GOLDEN SAMPLE DIRECTION RESET — TYPOGRAPHY MOCK FRAMES v1 (local-only)
// task: golden-sample-direction-reset-money-economy-psychology-v1
//
// 목적: Owner가 "굵은 정보형 쇼츠" 자막/폰트 방향(글자 크기·외곽선·강조색)만
// 판단할 수 있는 정적 목업 PNG 4장을 로컬 도형/텍스트만으로 생성한다.
//
// 렌더 경로 실측 결과 (이 스크립트가 Pillow를 쓰는 이유):
//   - ffmpeg drawtext: 이 빌드(8.1.1 essentials)에 fontvariations 옵션 없음 → VF Black 선택 불가.
//   - ffmpeg libass: "Noto Sans KR Black" named instance 미해석 — 기본 weight로 silent fallback 실측
//     (증거: typography_mock_frames/font_weight_probe.png, 900/800/기본 굵기 동일).
//   - Python Pillow(기설치 10.3.0): ImageFont.set_variation_by_name('Black') → VF에서 진짜 Black을
//     결정론적으로 선택. 이름 불일치 시 예외 발생 — silent fallback 자체가 불가능한 경로.
//
// 계약 (bold_info_shorts_font_contract.v1.json):
//   - Malgun Gothic 기본/암묵 fallback 금지. silent font fallback 금지.
//   - 승인 weight(ExtraBold/Black)가 확인되지 않으면 생성하지 않고 exit 12 (BLOCKED).
//   - stroke(검정 외곽선) >= 8px, hook >= 86px, body >= 58px, 흰색 기본 + 강조색(노랑/주황/빨강/파랑).
//   - 줄당 <= 12자, 블록당 <= 2줄, 하단 고정 자막 구조 금지.
//
// 사용:
//   node scripts/render-golden-sample-typography-mock-frames-v1.mjs --probe
//     → Black/Regular weight 대조 probe PNG 1장 (vision 판독용)
//   node scripts/render-golden-sample-typography-mock-frames-v1.mjs --frames --variation Black
//     → 목업 4장 생성. --variation은 probe vision 판독으로 확정된 instance명만 전달.
//
// 절대 하지 않는 것: 외부 API/이미지 생성/TTS/mux/env·secret 접근/full video render/신규 의존성.
// python(Pillow)은 spawnSync(args array, shell:false) + stdin 코드 전달로만 실행.
// 쓰기는 output/ 하위 목업 폴더에만.
// ──────────────────────────────────────────────────────────────────────────

import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const OUT_DIR = join(REPO_ROOT, "output", "money-shorts", "golden-sample-direction-reset-money-economy-psychology-v1", "typography_mock_frames");

const argv = process.argv.slice(2);
const MODE_PROBE = argv.includes("--probe");
const MODE_FRAMES = argv.includes("--frames");
const varIdx = argv.indexOf("--variation");
const CONFIRMED_VARIATION = varIdx >= 0 ? argv[varIdx + 1] : null;

// ── 폰트 가용성 gate (read-only 존재 확인) ────────────────────────────────
const FONT_CANDIDATE_FILES = [
  { name: "Pretendard Black", files: ["C:/Windows/Fonts/Pretendard-Black.otf", "C:/Windows/Fonts/Pretendard-Black.ttf"] },
  { name: "Pretendard ExtraBold", files: ["C:/Windows/Fonts/Pretendard-ExtraBold.otf", "C:/Windows/Fonts/Pretendard-ExtraBold.ttf"] },
  { name: "Noto Sans KR Black (static)", files: ["C:/Windows/Fonts/NotoSansKR-Black.otf", "C:/Windows/Fonts/NotoSansKR-Black.ttf"] },
  { name: "Noto Sans KR ExtraBold (static)", files: ["C:/Windows/Fonts/NotoSansKR-ExtraBold.otf", "C:/Windows/Fonts/NotoSansKR-ExtraBold.ttf"] },
  { name: "SUIT Heavy", files: ["C:/Windows/Fonts/SUIT-Heavy.ttf", "C:/Windows/Fonts/SUIT-Heavy.otf"] },
  { name: "Gmarket Sans Bold", files: ["C:/Windows/Fonts/GmarketSansTTFBold.ttf", "C:/Windows/Fonts/GmarketSansBold.otf"] },
];
const VF_FILE = "C:/Windows/Fonts/NotoSansKR-VF.ttf"; // 가변 폰트 — named instance에 Black 포함 (ExtraBold는 이 VF에 없음)

const staticFound = FONT_CANDIDATE_FILES.filter((f) => f.files.some((p) => existsSync(p)));
const vfFound = existsSync(VF_FILE);
console.log("── font availability (read-only) ──");
for (const f of FONT_CANDIDATE_FILES) console.log(`  ${f.name}: ${f.files.some((p) => existsSync(p)) ? "FOUND" : "not found"}`);
console.log(`  NotoSansKR-VF.ttf (variable): ${vfFound ? "FOUND" : "not found"}`);

if (!staticFound.length && !vfFound) {
  console.error("BLOCKED: 승인 폰트 static/VF 모두 미발견 — Malgun Gothic fallback은 금지이므로 목업을 생성하지 않는다.");
  process.exit(12);
}

mkdirSync(OUT_DIR, { recursive: true });

// ── Pillow 렌더러 (python stdin 실행, spec은 JSON 파일로 전달) ─────────────
const PY_RENDERER = `
import json, sys
from PIL import Image, ImageDraw, ImageFont

spec = json.load(open(sys.argv[1], encoding="utf-8"))
VF = spec["fontFile"]; VAR = spec["variation"]

def make_font(sz):
    f = ImageFont.truetype(VF, sz)
    f.set_variation_by_name(VAR)  # 이름이 없으면 예외 → silent fallback 불가능
    return f

for fr in spec["frames"]:
    img = Image.new("RGB", (spec["w"], spec["h"]), fr["bg"])
    d = ImageDraw.Draw(img)
    for el in fr["elements"]:
        t = el["type"]
        if t == "rect":
            d.rectangle([el["x1"], el["y1"], el["x2"], el["y2"]], fill=el["fill"])
        elif t == "text":
            d.text((el["x"], el["y"]), el["text"], font=make_font(el["fs"]), fill=el["fill"],
                   anchor=el.get("anchor", "mm"), stroke_width=el.get("stroke", 0), stroke_fill="#000000")
        elif t == "runs":
            fnt = make_font(el["fs"])
            total = sum(d.textlength(r["t"], font=fnt) for r in el["runs"])
            x = el["cx"] - total / 2
            for r in el["runs"]:
                d.text((x, el["y"]), r["t"], font=fnt, fill=r["fill"], anchor="lm",
                       stroke_width=el.get("stroke", 0), stroke_fill="#000000")
                x += d.textlength(r["t"], font=fnt)
    img.save(fr["out"])
    print("WROTE " + fr["out"])
`;

function renderSpec(spec, label) {
  const specPath = join(OUT_DIR, "mock_frames_spec.json");
  writeFileSync(specPath, JSON.stringify(spec, null, 2), "utf8");
  const r = spawnSync("python", ["-", specPath], { shell: false, encoding: "utf8", input: PY_RENDERER, timeout: 120000 });
  if (r.status !== 0) {
    console.error(`pillow render ${label} failed (exit ${r.status}):\n${(r.stderr || "").slice(-1200)}`);
    process.exit(4);
  }
  process.stdout.write(r.stdout);
}

// 색상 팔레트 (계약 emphasis 4색 + 기본 흰색)
const COL = {
  bg: "#0F1115", white: "#FFFFFF", yellow: "#FFD400", orange: "#FF7A00",
  red: "#E82B2B", blue: "#3B82F6", gray: "#8A929A", panel: "#171C23",
};
const W = 1080, H = 1920, STROKE = 9; // 계약 하한 8px 이상

// ══════════════════════════════════════════════════════════════════════════
// MODE 1 — PROBE: VF variation weight 대조 (Black vs Regular vs Medium)
// ══════════════════════════════════════════════════════════════════════════
if (MODE_PROBE) {
  const mk = (variation, y) => ({
    fontFile: VF_FILE, variation, w: 1080, h: 360, frames: [] // per-variation 단일 프레임은 아래에서 합성 불가 → 개별 렌더 후 비교 대신 한 캔버스에 못 얹으므로 각 variation을 개별 spec으로 렌더
  });
  // Pillow는 variation을 폰트 단위로 갖는다 — 한 프레임 안에서 variation별 폰트 생성이 필요하므로
  // 여기서는 요소별 fs가 아니라 spec 3개를 순차 렌더하지 않고, python 쪽에서 프레임별 VAR을 쓰는 구조상
  // variation별 프레임 3장을 생성해 세로로 읽게 한다. (판독 목적에는 충분)
  const probes = [
    ["Black", join(OUT_DIR, "font_weight_probe_pillow_black.png")],
    ["Regular", join(OUT_DIR, "font_weight_probe_pillow_regular.png")],
    ["Medium", join(OUT_DIR, "font_weight_probe_pillow_medium.png")],
  ];
  for (const [variation, out] of probes) {
    renderSpec({
      fontFile: VF_FILE, variation, w: 1080, h: 300,
      frames: [{
        bg: COL.bg, out,
        elements: [
          { type: "text", x: 540, y: 110, fs: 100, fill: COL.white, text: `${variation} 굵기 확인` },
          { type: "text", x: 540, y: 235, fs: 72, fill: COL.white, stroke: STROKE, text: "외곽선 9px 확인" },
        ],
      }],
    }, `probe ${variation}`);
  }
  console.log("PROBE_DONE — vision 판독: black 프레임이 regular/medium보다 확연히 굵어야 GO.");
  process.exit(0);
}

// ══════════════════════════════════════════════════════════════════════════
// MODE 2 — FRAMES: 목업 4장 (probe로 확정된 variation 필수 — 암묵 기본값 없음)
// ══════════════════════════════════════════════════════════════════════════
if (!MODE_FRAMES) { console.error("usage: --probe | --frames --variation <확정 instance명>"); process.exit(2); }
if (!CONFIRMED_VARIATION) {
  console.error("BLOCKED: --variation 미지정 — probe vision 판독으로 확정된 weight 없이 목업을 생성하지 않는다 (silent fallback 금지).");
  process.exit(12);
}
if (!/^(Black|ExtraBold)$/.test(CONFIRMED_VARIATION)) {
  console.error(`BLOCKED: '${CONFIRMED_VARIATION}'은 승인 weight(ExtraBold/Black)가 아니다.`);
  process.exit(12);
}

const F = (name, elements) => ({ bg: COL.bg, out: join(OUT_DIR, name), elements });
const chip = (x1, x2, fill, label) => ([
  { type: "rect", x1, y1: 150, x2, y2: 262, fill },
  { type: "text", x: (x1 + x2) / 2, y: 206, fs: 62, fill: COL.white, stroke: STROKE, text: label },
]);
const meta = (label) => ({ type: "text", x: 540, y: 1856, fs: 36, fill: COL.gray, text: label });

renderSpec({
  fontFile: VF_FILE, variation: CONFIRMED_VARIATION, w: W, h: H,
  frames: [
    // 01 HOOK — 큰 훅 타이포 (hook >= 86 → 128), 강조 노랑 inline run + 노랑 언더라인
    F("mock_frame_01_hook.png", [
      ...chip(60, 560, COL.red, "머니 인사이트"),
      { type: "text", x: 540, y: 800, fs: 128, fill: COL.white, stroke: STROKE + 2, text: "당신 돈은" },
      { type: "runs", cx: 540, y: 990, fs: 128, stroke: STROKE + 2, runs: [
        { t: "왜 항상 ", fill: COL.white }, { t: "부족", fill: COL.yellow }, { t: "할까", fill: COL.white } ] },
      { type: "rect", x1: 600, y1: 1082, x2: 892, y2: 1098, fill: COL.yellow },
      meta("MOCK 01 - HOOK - typography only"),
    ]),
    // 02 FACT CARD — 정보/숫자 카드 (body >= 58, 숫자 강조 노랑/주황, 00% = 자리표시)
    F("mock_frame_02_fact_card.png", [
      ...chip(60, 500, COL.blue, "핵심 팩트"),
      { type: "rect", x1: 100, y1: 560, x2: 980, y2: 800, fill: COL.panel },
      { type: "text", x: 350, y: 680, fs: 68, fill: COL.white, stroke: STROKE, text: "평균 저축률" },
      { type: "text", x: 800, y: 680, fs: 116, fill: COL.yellow, stroke: STROKE + 2, text: "00%" },
      { type: "rect", x1: 100, y1: 850, x2: 980, y2: 1090, fill: COL.panel },
      { type: "text", x: 350, y: 970, fs: 68, fill: COL.white, stroke: STROKE, text: "고정비 비중" },
      { type: "text", x: 800, y: 970, fs: 116, fill: COL.orange, stroke: STROKE + 2, text: "00%" },
      { type: "text", x: 540, y: 1220, fs: 58, fill: COL.gray, text: "숫자는 목업용 자리표시" },
      meta("MOCK 02 - FACT CARD - 00% = placeholder"),
    ]),
    // 03 MECHANISM — 구조/흐름 (단계 강조색 파랑/주황/빨강 + 노랑 커넥터)
    F("mock_frame_03_mechanism.png", [
      { type: "text", x: 540, y: 330, fs: 96, fill: COL.white, stroke: STROKE + 2, text: "돈이 새는 구조" },
      { type: "rect", x1: 300, y1: 520, x2: 780, y2: 700, fill: COL.panel },
      { type: "text", x: 540, y: 610, fs: 84, fill: COL.blue, stroke: STROKE, text: "월급" },
      { type: "rect", x1: 532, y1: 700, x2: 548, y2: 800, fill: COL.yellow },
      { type: "rect", x1: 300, y1: 800, x2: 780, y2: 980, fill: COL.panel },
      { type: "text", x: 540, y: 890, fs: 84, fill: COL.orange, stroke: STROKE, text: "고정비" },
      { type: "rect", x1: 532, y1: 980, x2: 548, y2: 1080, fill: COL.yellow },
      { type: "rect", x1: 300, y1: 1080, x2: 780, y2: 1260, fill: COL.panel },
      { type: "text", x: 540, y: 1170, fs: 84, fill: COL.red, stroke: STROKE, text: "잔액 0" },
      meta("MOCK 03 - MECHANISM"),
    ]),
    // 04 ACTION — 행동/CTA (숫자 빨강 run + 파랑 CTA 박스, 하단 고정 자막 아님)
    F("mock_frame_04_action.png", [
      ...chip(60, 500, COL.orange, "오늘 할 일"),
      { type: "text", x: 540, y: 780, fs: 122, fill: COL.white, stroke: STROKE + 2, text: "쓰기 전에" },
      { type: "runs", cx: 540, y: 960, fs: 122, stroke: STROKE + 2, runs: [
        { t: "10%", fill: COL.red }, { t: " 먼저 떼기", fill: COL.white } ] },
      { type: "rect", x1: 240, y1: 1380, x2: 840, y2: 1520, fill: COL.blue },
      { type: "text", x: 540, y: 1450, fs: 72, fill: COL.white, stroke: STROKE, text: "저장하고 시작" },
      meta("MOCK 04 - ACTION / CTA"),
    ]),
  ],
}, "mock frames");

console.log(`\nDONE — 4 mock frames written with Noto Sans KR ${CONFIRMED_VARIATION} (VF instance):\n  ${OUT_DIR}`);
process.exit(0);
