/**
 * Golden Sample — ChatGPT+Playwright Visual-Only Candidate Renderer v3.1 (korean banknote patch)
 * task: golden-sample-chatgpt-playwright-korean-banknote-clarity-patch-v3-1
 * v3 renderer 파생: blueprint v3_1 소비(패치 5장+유지 4장), s1 hook 텍스트만 재배치(신규 지폐 부채꼴 충돌 회피).
 *
 * v2 renderer 대비 변경:
 *   - blueprint v3의 selected_image_set(완전 신규 9장, md5 명시) 소비 — v1/v2 이미지 재사용 없음.
 *   - 9 visual beats / 41.4s 자연 길이 (30초 고정 목표 아님 — 캡션 dwell/스토리 필요에서 도출).
 *   - 유리병 3개 모티프 서사 + 카드 슬롯 색(파랑/주황/노랑) ↔ 병 리본 색 1:1 매칭.
 *   - 나머지 파이프라인 동일: Pillow RGBA 오버레이(Noto Sans KR Black VF, silent fallback 불가)
 *     → ffmpeg pass1(zoompan drift + hard cut concat) → pass2(fade+slide 합성) → ffprobe/frames.
 *
 * 금지: TTS/mux/upload/유료 API/placeholder/Malgun fallback. 로컬 전용.
 * 출력: C:\tmp\money-shorts-os\golden-sample-chatgpt-playwright-visual-only-v3\
 */

import { writeFileSync, readFileSync, mkdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import crypto from "node:crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const BLUEPRINT = join(REPO_ROOT, "scripts", "fixtures", "golden_sample_t1_lifestyle_inflation_story_blueprint.v3_1_banknote_patch.json");
const OUT_DIR = "C:/tmp/money-shorts-os/golden-sample-chatgpt-playwright-visual-only-v3-1-banknote-patch";
const OVL_DIR = join(OUT_DIR, "overlays");
const FRAME_DIR = join(OUT_DIR, "frames");
const VF_FILE = "C:/Windows/Fonts/NotoSansKR-VF.ttf";
const FPS = 30;

function fail(msg, code = 1) { console.error("ABORT: " + msg); process.exit(code); }
function run(cmd, args, label, timeout = 480000) {
  const r = spawnSync(cmd, args, { shell: false, encoding: "utf8", timeout, maxBuffer: 64 * 1024 * 1024 });
  if (r.status !== 0) fail(`${label} failed (exit ${r.status}):\n${(r.stderr || "").slice(-1600)}`, 4);
  return r;
}

// ── 1. 이미지 gate (blueprint v3 selected_image_set + md5) ───────────────────
if (!existsSync(VF_FILE)) fail("NotoSansKR-VF.ttf 미존재 — Malgun fallback 금지로 진행 불가", 12);
const blueprint = JSON.parse(readFileSync(BLUEPRINT, "utf8"));
if (blueprint.schemaVersion !== "golden_sample_story_blueprint_v3_1_banknote_patch") fail("blueprint v3 schema 불일치", 12);

const IMAGES = {};
console.log("── selected image set integrity gate (v3) ──");
for (const s of blueprint.selected_image_set) {
  const p = join(REPO_ROOT, s.path);
  if (!existsSync(p)) fail(`이미지 미존재: ${s.path}`, 12);
  const b = readFileSync(p);
  const md5 = crypto.createHash("md5").update(b).digest("hex");
  if (md5 !== s.md5) fail(`md5 불일치: ${s.imageId} expected=${s.md5} actual=${md5}`, 12);
  IMAGES[s.imageId] = { path: p, md5, bytes: b.length };
  console.log(`  ${s.imageId}: md5 OK (${s.origin})`);
}

mkdirSync(OVL_DIR, { recursive: true });
mkdirSync(FRAME_DIR, { recursive: true });

// ── 2. 장면 정의 (blueprint v3 타이밍 준수 — 9 beats / 41.4s 자연 길이) ──────
const SCENES = [
  { id: "s1", img: "img_41_hook_envelope_vs_empty_jar_krw",      t0: 0.0,  t1: 4.2,  zs: 1.02, ze: 1.08, eq: "brightness=-0.04:contrast=1.0:saturation=1.04",  blur: 0 },
  { id: "s2", img: "img_32_problem_wallet_check_night",      t0: 4.2,  t1: 8.8,  zs: 1.03, ze: 1.08, eq: "brightness=-0.06:contrast=1.0:saturation=1.02",  blur: 0 },
  { id: "s3", img: "img_43_causeA_orderly_fixed_outflow_krw",    t0: 8.8,  t1: 13.4, zs: 1.02, ze: 1.08, eq: "brightness=-0.04:contrast=1.01:saturation=1.02", blur: 0 },
  { id: "s4", img: "img_34_causeB_scattered_lifestyle_spend",t0: 13.4, t1: 18.6, zs: 1.03, ze: 1.09, eq: "brightness=-0.06:contrast=1.0:saturation=1.02",  blur: 0 },
  { id: "s5", img: "img_45_illusion_one_bill_vs_receipt_wall_krw",t0: 18.6, t1: 23.6, zs: 1.02, ze: 1.07, eq: "brightness=-0.05:contrast=1.02:saturation=1.0",  blur: 0 },
  { id: "s6", img: "img_36_reframe_three_empty_jars",        t0: 23.6, t1: 28.0, zs: 1.06, ze: 1.02, eq: "brightness=0.02:contrast=1.0:saturation=1.03",   blur: 0 },
  { id: "s7", img: "img_47_actionA_dividing_into_jars_krw",      t0: 28.0, t1: 31.6, zs: 1.03, ze: 1.08, eq: "brightness=0.0:contrast=1.0:saturation=1.04",    blur: 0 },
  { id: "s8", img: "img_48_actionB_three_jars_color_ribbons_krw",t0: 31.6, t1: 36.8, zs: 1.02, ze: 1.07, eq: "brightness=0.0:contrast=1.0:saturation=1.05",    blur: 0 },
  { id: "s9", img: "img_39_result_settled_morning_shelf",    t0: 36.8, t1: 41.4, zs: 1.06, ze: 1.02, eq: "brightness=0.03:contrast=1.0:saturation=1.05",   blur: 0 },
];
const FULL_DUR = 41.4;
{
  const bp = blueprint.story_chain;
  if (bp.length !== SCENES.length) fail("blueprint story_chain과 SCENES 수 불일치", 12);
  for (let i = 0; i < bp.length; i++) {
    if (bp[i].timeStartSec !== SCENES[i].t0 || bp[i].timeEndSec !== SCENES[i].t1 || bp[i].image !== SCENES[i].img) {
      fail(`scene ${SCENES[i].id} blueprint 타이밍/이미지 불일치`, 12);
    }
  }
}

// ── 3. Overlay 정의 (safe frame: 텍스트 y<=1580, 그래픽 y<=1632) ─────────────
const COL = {
  white: "#FFFFFF", yellow: "#FFD400", orange: "#FF7A00", red: "#E82B2B",
  blue: "#3B82F6", gray: "#C7CDD4", panel: [13, 17, 23, 216], panelSoft: [13, 17, 23, 190],
};
const S = 10;
const OVERLAYS = [];
const capLenGuard = [];
function T(text) { capLenGuard.push(text); return text; }
function ov(id, start, end, elements) { OVERLAYS.push({ id, start, end, file: `${id}.png`, elements }); }

// s1 — hook (0–4.2): 신규 KRW 이미지는 지폐 부채꼴이 y~550-1030 차지 → 텍스트 최상단 재배치
ov("ov01_hook_l1", 0.15, 4.2, [
  { type: "text", x: 540, y: 290, fs: 98, fill: COL.white, stroke: S + 1, text: T("월급은 올랐는데") },
]);
ov("ov02_hook_l2", 0.8, 4.2, [
  { type: "text", x: 540, y: 440, fs: 112, fill: COL.yellow, stroke: S + 1, text: T("통장은 그대로") },
  { type: "rect", x1: 345, y1: 516, x2: 735, y2: 532, fill: COL.yellow },
]);
ov("ov03_hook_cap", 2.5, 4.2, [
  { type: "text", x: 540, y: 1560, fs: 62, fill: COL.white, stroke: S - 1, text: T("느낌이 아니라 사실") },
]);
// s2 — problem (4.2–8.8): 인물 얼굴 회피, 하단 패널
ov("ov04_prob_panel", 4.4, 8.8, [
  { type: "rrect", x1: 110, y1: 1140, x2: 970, y2: 1400, r: 28, fill: COL.panel },
  { type: "text", x: 540, y: 1240, fs: 80, fill: COL.white, stroke: S, text: T("분명 더 버는데") },
]);
ov("ov05_prob_l2", 5.2, 8.8, [
  { type: "runs", cx: 540, y: 1330, fs: 80, stroke: S, runs: [
    { t: "월말 잔액은 ", fill: COL.white }, { t: "제자리", fill: COL.orange } ] },
]);
ov("ov06_bridge_cap", 7.3, 8.8, [
  { type: "text", x: 540, y: 1520, fs: 64, fill: COL.yellow, stroke: S - 1, text: T("돈은 어디로 갔을까") },
]);
// s3 — cause A: 고정비/자동이체 (8.8–13.4)
ov("ov07_ca_chip", 9.0, 13.4, [
  { type: "rrect", x1: 60, y1: 190, x2: 570, y2: 302, r: 22, fill: COL.red },
  { type: "text", x: 315, y: 246, fs: 60, fill: COL.white, stroke: S - 1, text: T("먼저 빠지는 돈") },
]);
const causeRow = (id, start, end, y1, label) => ov(id, start, end, [
  { type: "rrect", x1: 140, y1, x2: 940, y2: y1 + 132, r: 24, fill: COL.panelSoft },
  { type: "text", x: 430, y: y1 + 66, fs: 72, fill: COL.white, stroke: S, text: T(label) },
  { type: "poly", pts: [[820, y1 + 92], [864, y1 + 92], [842, y1 + 40]], fill: COL.red },
]);
causeRow("ov08_ca_r1", 9.7, 13.4, 1180, "고정비");
causeRow("ov09_ca_r2", 10.5, 13.4, 1330, "자동이체");
ov("ov10_ca_line", 11.6, 13.4, [
  { type: "runs", cx: 540, y: 1540, fs: 74, stroke: S, runs: [
    { t: "오른 만큼 ", fill: COL.white }, { t: "먼저 흡수", fill: COL.red } ] },
]);
// s4 — cause B: 카드값/구독료/생활비 (13.4–18.6)
ov("ov11_cb_chip", 13.6, 18.6, [
  { type: "rrect", x1: 60, y1: 190, x2: 620, y2: 302, r: 22, fill: COL.orange },
  { type: "text", x: 340, y: 246, fs: 58, fill: COL.white, stroke: S - 1, text: T("흩어져 빠지는 돈") },
]);
causeRow("ov12_cb_r1", 14.3, 18.6, 620, "카드값");
causeRow("ov13_cb_r2", 15.1, 18.6, 770, "구독료");
causeRow("ov14_cb_r3", 15.9, 18.6, 920, "생활비");
ov("ov15_cb_line", 16.9, 18.6, [
  { type: "runs", cx: 540, y: 1250, fs: 74, stroke: S, runs: [
    { t: "조금씩, ", fill: COL.white }, { t: "여러 곳에서", fill: COL.red } ] },
]);
// s5 — illusion (18.6–23.6): 지폐는 중상단, 패널 하단
ov("ov16_ill_p1", 18.8, 23.6, [
  { type: "rrect", x1: 110, y1: 1150, x2: 970, y2: 1440, r: 28, fill: COL.panel },
  { type: "text", x: 540, y: 1248, fs: 62, fill: COL.gray, stroke: S - 1, text: T("기억나는 건") },
  { type: "text", x: 540, y: 1360, fs: 92, fill: COL.yellow, stroke: S, text: T("인상액 하나") },
]);
ov("ov17_ill_p2", 20.9, 23.6, [
  { type: "rrect", x1: 110, y1: 1470, x2: 970, y2: 1630, r: 28, fill: COL.panel },
  { type: "runs", cx: 540, y: 1550, fs: 70, stroke: S, runs: [
    { t: "늘어난 지출은 ", fill: COL.white }, { t: "안 보임", fill: COL.red } ] },
]);
ov("ov17b_ill_ul", 22.4, 23.6, [
  { type: "rect", x1: 600, y1: 1596, x2: 850, y2: 1610, fill: COL.red },
]);
// s6 — reframe (23.6–28.0): 병은 중하단, 텍스트 상단
ov("ov18_ref_l1", 23.8, 28.0, [
  { type: "text", x: 540, y: 440, fs: 88, fill: COL.white, stroke: S + 1, text: T("안 모이는 게 아니라") },
]);
ov("ov19_ref_l2", 24.9, 28.0, [
  { type: "text", x: 540, y: 600, fs: 98, fill: COL.yellow, stroke: S + 1, text: T("돈의 자리가 없던 것") },
]);
ov("ov19b_ref_ul", 26.3, 28.0, [
  { type: "rect", x1: 265, y1: 678, x2: 815, y2: 694, fill: COL.yellow },
]);
// s7 — action A (28.0–31.6)
ov("ov20_aa_chip", 28.2, 31.6, [
  { type: "rrect", x1: 60, y1: 190, x2: 700, y2: 302, r: 22, fill: COL.orange },
  { type: "text", x: 380, y: 246, fs: 58, fill: COL.white, stroke: S - 1, text: T("받는 날, 먼저 나누기") },
]);
ov("ov21_aa_line", 29.3, 31.6, [
  { type: "text", x: 540, y: 1500, fs: 72, fill: COL.yellow, stroke: S, text: T("쓰기 전에 세 자리") },
]);
// s8 — action B: 3 slots — 슬롯 바 색 = 병 리본 색 (31.6–36.8), 병은 하단에 보이도록 슬롯 상단 배치
const slot = (id, start, y1, barColor, label) => ov(id, start, 36.8, [
  { type: "rrect", x1: 140, y1, x2: 940, y2: y1 + 146, r: 24, fill: COL.panel },
  { type: "rect", x1: 140, y1: y1 + 10, x2: 164, y2: y1 + 136, fill: barColor },
  { type: "text", x: 552, y: y1 + 73, fs: 72, fill: COL.white, stroke: S, text: T(label) },
]);
slot("ov22_ab_slot1", 31.8, 300, COL.blue, "고정비 증가분");
slot("ov23_ab_slot2", 32.7, 470, COL.orange, "생활비 상한");
slot("ov24_ab_slot3", 33.6, 640, COL.yellow, "남길 돈");
ov("ov25_ab_line", 35.0, 36.8, [
  { type: "runs", cx: 540, y: 1500, fs: 68, stroke: S, runs: [
    { t: "받는 날 ", fill: COL.white }, { t: "바로 분리", fill: COL.yellow } ] },
]);
// s9 — result + CTA (36.8–41.4)
ov("ov26_result", 37.0, 41.4, [
  { type: "rrect", x1: 110, y1: 1100, x2: 970, y2: 1462, r: 28, fill: COL.panel },
  { type: "text", x: 540, y: 1218, fs: 74, fill: COL.white, stroke: S, text: T("체감은 잔액이 아니라") },
  { type: "text", x: 540, y: 1358, fs: 80, fill: COL.yellow, stroke: S, text: T("돈의 자리에서 생겨요") },
]);
ov("ov27_cta", 39.2, 41.4, [
  { type: "rrect", x1: 250, y1: 1496, x2: 830, y2: 1632, r: 26, fill: COL.blue },
  { type: "text", x: 540, y: 1564, fs: 60, fill: COL.white, stroke: S - 1, text: T("저장하고 월급날 실행") },
]);

for (const t of capLenGuard) {
  if (t.length > 12) fail(`caption_max_chars_per_line 위반: "${t}" (${t.length}자)`, 12);
}

// ── 4. Pillow overlay 렌더 ───────────────────────────────────────────────────
const PY = `
import json, sys
from PIL import Image, ImageDraw, ImageFont
spec = json.load(open(sys.argv[1], encoding="utf-8"))
VF = spec["fontFile"]
def font(sz):
    f = ImageFont.truetype(VF, sz)
    f.set_variation_by_name(spec["variation"])
    return f
def col(c):
    if isinstance(c, list): return tuple(c)
    c = c.lstrip("#"); return (int(c[0:2],16), int(c[2:4],16), int(c[4:6],16), 255)
for o in spec["overlays"]:
    img = Image.new("RGBA", (1080, 1920), (0,0,0,0))
    d = ImageDraw.Draw(img)
    for el in o["elements"]:
        t = el["type"]
        if t == "rect":
            d.rectangle([el["x1"], el["y1"], el["x2"], el["y2"]], fill=col(el["fill"]))
        elif t == "rrect":
            d.rounded_rectangle([el["x1"], el["y1"], el["x2"], el["y2"]], radius=el.get("r", 20), fill=col(el["fill"]))
        elif t == "poly":
            d.polygon([tuple(p) for p in el["pts"]], fill=col(el["fill"]))
        elif t == "text":
            d.text((el["x"], el["y"]), el["text"], font=font(el["fs"]), fill=col(el["fill"]),
                   anchor=el.get("anchor", "mm"), stroke_width=el.get("stroke", 0), stroke_fill=(0,0,0,255))
        elif t == "runs":
            f = font(el["fs"])
            total = sum(d.textlength(r["t"], font=f) for r in el["runs"])
            x = el["cx"] - total/2
            for r in el["runs"]:
                d.text((x, el["y"]), r["t"], font=f, fill=col(r["fill"]), anchor="lm",
                       stroke_width=el.get("stroke", 0), stroke_fill=(0,0,0,255))
                x += d.textlength(r["t"], font=f)
    img.save(spec["outDir"] + "/" + o["file"])
    print("OVL " + o["file"])
`;
const spec = { fontFile: VF_FILE, variation: "Black", outDir: OVL_DIR.replace(/\\/g, "/"), overlays: OVERLAYS };
const specPath = join(OUT_DIR, "overlay_spec.v3_1.json");
writeFileSync(specPath, JSON.stringify(spec, null, 2), "utf8");
console.log("── pillow overlays ──");
{
  const r = spawnSync("python", ["-", specPath], { shell: false, encoding: "utf8", input: PY, timeout: 180000 });
  if (r.status !== 0) fail(`pillow overlays failed:\n${(r.stderr || "").slice(-1400)}`, 4);
  console.log(r.stdout.trim().split("\n").length + " overlays rendered");
}

// ── 5. ffmpeg pass1 — 배경 트랙 ──────────────────────────────────────────────
console.log("── ffmpeg pass1: background track ──");
const bgPath = join(OUT_DIR, "bg_track.mp4");
{
  const inputs = [];
  const chains = [];
  SCENES.forEach((sc, i) => {
    inputs.push("-i", IMAGES[sc.img].path);
    const d = Math.round((sc.t1 - sc.t0) * FPS);
    const blurStep = sc.blur > 0 ? `,gblur=sigma=${sc.blur}` : "";
    chains.push(
      `[${i}:v]scale=2160:3840:force_original_aspect_ratio=increase:flags=lanczos,crop=2160:3840,` +
      `zoompan=z='${sc.zs}+(${sc.ze}-${sc.zs})*on/${d}':d=${d}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1920:fps=${FPS},` +
      `eq=${sc.eq}${blurStep},setsar=1[sc${i}]`
    );
  });
  const concatIn = SCENES.map((_, i) => `[sc${i}]`).join("");
  const fc = chains.join(";") + `;${concatIn}concat=n=${SCENES.length}:v=1:a=0[bg]`;
  run("ffmpeg", ["-y", ...inputs, "-filter_complex", fc, "-map", "[bg]",
    "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p", "-an", bgPath],
    "pass1 background", 600000);
}

// ── 6. ffmpeg pass2 — overlay 합성 ───────────────────────────────────────────
console.log("── ffmpeg pass2: overlay composite ──");
const outMp4 = join(OUT_DIR, "golden_sample_t1_lifestyle_inflation_visual_only_v3_1.mp4");
{
  const inputs = ["-i", bgPath];
  const parts = [];
  OVERLAYS.forEach((o, i) => {
    inputs.push("-framerate", String(FPS), "-loop", "1", "-t", o.end.toFixed(2), "-i", join(OVL_DIR, o.file));
    const fadeOut = o.end < FULL_DUR - 0.05 ? `,fade=out:st=${(o.end - 0.14).toFixed(2)}:d=0.14:alpha=1` : "";
    parts.push(`[${i + 1}:v]format=rgba,fade=in:st=${o.start.toFixed(2)}:d=0.22:alpha=1${fadeOut}[f${i}]`);
  });
  let prev = "[0:v]";
  OVERLAYS.forEach((o, i) => {
    const yExpr = `-14*max(0\\,1-(t-${o.start.toFixed(2)})/0.25)`;
    const outLbl = i === OVERLAYS.length - 1 ? "[vout]" : `[v${i}]`;
    parts.push(`${prev}[f${i}]overlay=x=0:y=${yExpr}:enable='between(t,${o.start.toFixed(2)},${o.end.toFixed(2)})'${outLbl}`);
    prev = `[v${i}]`;
  });
  run("ffmpeg", ["-y", ...inputs, "-filter_complex", parts.join(";"), "-map", "[vout]",
    "-c:v", "libx264", "-preset", "medium", "-crf", "18", "-pix_fmt", "yuv420p",
    "-movflags", "+faststart", "-t", FULL_DUR.toFixed(2), "-an", outMp4],
    "pass2 overlays", 600000);
}

// ── 7. ffprobe ───────────────────────────────────────────────────────────────
console.log("── ffprobe ──");
const probe = run("ffprobe", ["-v", "error", "-show_entries",
  "stream=codec_type,codec_name,width,height,r_frame_rate,nb_frames:format=duration",
  "-of", "json", outMp4], "ffprobe");
const probeJson = JSON.parse(probe.stdout);
const vStreams = probeJson.streams.filter(s => s.codec_type === "video");
const aStreams = probeJson.streams.filter(s => s.codec_type === "audio");
const v = vStreams[0] || {};
const dur = parseFloat(probeJson.format?.duration || "0");
// 자연 길이 원칙: 고정 30s 목표 없음 — blueprint 산출 길이(41.4s) ±0.2s + 자연 범위(25~50s) 확인
const probeOk = v.width === 1080 && v.height === 1920 && aStreams.length === 0
  && Math.abs(dur - FULL_DUR) <= 0.2 && dur >= 25 && dur <= 50;
console.log(`  ${v.width}x${v.height} ${v.codec_name} ${v.r_frame_rate} dur=${dur.toFixed(3)}s audioStreams=${aStreams.length} → ${probeOk ? "PASS" : "FAIL"}`);
if (!probeOk) fail("ffprobe gate 실패", 2);

// ── 8. key frame screenshots ─────────────────────────────────────────────────
console.log("── frame screenshots ──");
const SHOTS = [0.5, 1.5, 3.3, 4.6, 6.0, 7.8, 9.3, 10.9, 12.2, 13.9, 16.2, 17.6, 19.2, 21.5, 22.9, 24.2, 26.8, 28.6, 30.2, 32.2, 34.2, 36.0, 37.4, 39.8, 41.0];
const shotPaths = [];
for (const t of SHOTS) {
  const p = join(FRAME_DIR, `frame_${t.toFixed(1).replace(".", "_")}s.jpg`);
  run("ffmpeg", ["-y", "-ss", t.toFixed(2), "-i", outMp4, "-frames:v", "1", "-q:v", "2", p], `frame@${t}`);
  shotPaths.push(p);
}
console.log(`  ${shotPaths.length} frames extracted`);

// ── 9. render manifest ───────────────────────────────────────────────────────
const events = [];
SCENES.forEach(sc => events.push({ atSec: sc.t0, type: "scene_cut", sceneId: sc.id }));
OVERLAYS.forEach(o => events.push({ atSec: o.start, type: "overlay_entry", id: o.id }));
events.sort((a, b) => a.atSec - b.atSec);
let maxGap = 0;
for (let i = 1; i < events.length; i++) maxGap = Math.max(maxGap, events[i].atSec - events[i - 1].atSec);
maxGap = Math.max(maxGap, FULL_DUR - events[events.length - 1].atSec);

const dwell = {};
SCENES.forEach(sc => { dwell[sc.img] = (dwell[sc.img] || 0) + Number((sc.t1 - sc.t0).toFixed(2)); });

const manifest = {
  schemaVersion: "golden_sample_chatgpt_playwright_visual_only_render_manifest_v3_1_banknote_patch",
  taskId: "golden-sample-chatgpt-playwright-korean-banknote-clarity-patch-v3-1",
  createdAt: new Date().toISOString(),
  topicId: blueprint.topicId,
  blueprint: "scripts/fixtures/golden_sample_t1_lifestyle_inflation_story_blueprint.v3_1_banknote_patch.json",
  imageSource: { images: IMAGES, rejected: blueprint.rejected_images, provider_path: "ChatGPT+Playwright+Chrome CDP", nativeNote: "native 941x1672 실측 그대로 — 배경 채움 lanczos" },
  typography: { engine: "pillow_overlay", font: "Noto Sans KR Black (NotoSansKR-VF named instance)", strokeMinPx: 9, silentFallbackPossible: false, malgunUsed: false, bottomFixedSubtitle: false },
  output: { mp4: outMp4, width: v.width, height: v.height, durationSec: dur, fps: FPS, audioStreams: aStreams.length },
  duration_rationale: blueprint.duration.duration_rationale,
  scenes: SCENES,
  imageDwellSec: dwell,
  overlays: OVERLAYS.map(o => ({ id: o.id, start: o.start, end: o.end })),
  perceptual: { eventCount: events.length, maxGapSec: Number(maxGap.toFixed(2)), events },
  frames: shotPaths,
  boundary: { tts: false, mux: false, upload: false, cost_usd: 0, render_ready: false, upload_ready: false },
};
writeFileSync(join(OUT_DIR, "render_manifest.v3_1.json"), JSON.stringify(manifest, null, 2), "utf8");
console.log(`DONE — ${outMp4}`);
console.log(`  visual beats=${SCENES.length}, events=${events.length}, maxGap=${maxGap.toFixed(2)}s`);
console.log(`  image dwell(sec): ${JSON.stringify(dwell)}`);
