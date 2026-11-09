/**
 * Golden Sample — ChatGPT+Playwright Visual-Only Candidate Renderer v1
 * task: golden-sample-chatgpt-playwright-visual-only-candidate-v1
 *
 * 역할:
 *   ChatGPT+Playwright로 생성된 4장 소스 이미지 + t1_lifestyle_inflation story blueprint를
 *   card-image hybrid 방식으로 합성해 1080x1920 visual-only mp4 후보 1개를 만든다.
 *
 * 타이포 계약 (bold_info_shorts_font_contract.v1.json):
 *   - 텍스트/카드 레이어는 전부 Pillow overlay(RGBA PNG)로 사전 렌더 — libass 경유 없음.
 *   - Noto Sans KR Black (NotoSansKR-VF.ttf named instance, set_variation_by_name) —
 *     이름 불일치 시 python 예외로 즉사하는 구조라 Malgun/기본 weight silent fallback이 불가능.
 *   - 흰색 본문 + 검정 외곽선 9px+ + 강조색 노랑/주황/빨강/파랑, 줄당 <=12자, 블록 <=2줄.
 *   - 하단 고정 받아쓰기 자막 없음 — phrase 단위 카드/캡션이 화면 중심 영역에 배치.
 *
 * 파이프라인 (로컬 전용, 외부 호출 없음):
 *   1. 소스 이미지 존재 + md5 무결성 확인 (image-generation-summary 대조)
 *   2. Pillow로 overlay PNG 24장 생성 (투명 캔버스 1080x1920)
 *   3. ffmpeg pass1: scene별 zoompan drift + dim/blur 배경 트랙 (hard cut concat, 40.0s)
 *   4. ffmpeg pass2: overlay 24장을 fade+entry slide로 합성 → visual-only mp4 (audio 없음)
 *   5. ffprobe 검증 + key frame screenshot 추출 + render manifest 산출
 *
 * 금지: TTS/mux/upload/유료 API/placeholder 이미지/Malgun fallback.
 * 출력: C:\tmp\money-shorts-os\golden-sample-chatgpt-playwright-visual-only-v1\
 */

import { writeFileSync, readFileSync, mkdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import crypto from "node:crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const IMG_DIR = join(REPO_ROOT, "output", "money-shorts", "chatgpt-playwright-image-method-revalidation-v1");
const IMG_SUMMARY = join(IMG_DIR, "image-generation-summary.v1.json");
const BLUEPRINT = join(REPO_ROOT, "scripts", "fixtures", "golden_sample_t1_lifestyle_inflation_story_blueprint.v1.json");
const OUT_DIR = "C:/tmp/money-shorts-os/golden-sample-chatgpt-playwright-visual-only-v1";
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

// ── 1. 소스 이미지 gate ──────────────────────────────────────────────────────
if (!existsSync(VF_FILE)) fail("NotoSansKR-VF.ttf 미존재 — 타이포 계약상 진행 불가 (Malgun fallback 금지)", 12);
if (!existsSync(IMG_SUMMARY)) fail("image-generation-summary.v1.json 미존재 — 이미지 생성 단계 미완료", 12);
const imgSummary = JSON.parse(readFileSync(IMG_SUMMARY, "utf8"));
const gen = (imgSummary.generatedImages || []).slice().sort((a, b) => a.order - b.order);
if (gen.length !== 4) fail(`생성 이미지 4장 기대 — 실제 ${gen.length}장`, 12);

const IMAGES = {};
console.log("── source image integrity gate ──");
for (const g of gen) {
  if (!existsSync(g.imagePath)) fail(`이미지 미존재: ${g.imagePath}`, 12);
  const b = readFileSync(g.imagePath);
  const md5 = crypto.createHash("md5").update(b).digest("hex");
  if (g.md5 && md5 !== g.md5) fail(`md5 불일치: ${g.imageId} summary=${g.md5} actual=${md5}`, 12);
  IMAGES[g.imageId] = { path: g.imagePath, width: g.width, height: g.height, md5, bytes: b.length };
  console.log(`  ${g.imageId}: ${g.width}x${g.height} md5=${md5} OK`);
}

const blueprint = JSON.parse(readFileSync(BLUEPRINT, "utf8"));
mkdirSync(OVL_DIR, { recursive: true });
mkdirSync(FRAME_DIR, { recursive: true });

// ── 2. 장면 정의 (blueprint 타이밍 준수) ─────────────────────────────────────
// treatment: 이미지=증거 원칙 — 기본은 mild dim + drift zoom, reframe(s5)만 강한 dim+blur로 배경화
const SCENES = [
  { id: "s1", img: "img_01_hook_raise_no_change",      t0: 0.0,  t1: 5.5,  zs: 1.02, ze: 1.08, eq: "brightness=-0.06:contrast=1.0:saturation=1.03", blur: 0 },
  { id: "s2", img: "img_01_hook_raise_no_change",      t0: 5.5,  t1: 11.0, zs: 1.10, ze: 1.05, eq: "brightness=-0.08:contrast=1.0:saturation=1.02", blur: 0 },
  { id: "s3", img: "img_02_cause_absorbed_outflow",    t0: 11.0, t1: 18.5, zs: 1.03, ze: 1.09, eq: "brightness=-0.06:contrast=1.0:saturation=1.03", blur: 0 },
  { id: "s4", img: "img_03_illusion_scattered_spending", t0: 18.5, t1: 25.0, zs: 1.02, ze: 1.07, eq: "brightness=-0.10:contrast=1.02:saturation=1.0", blur: 0 },
  { id: "s5", img: "img_03_illusion_scattered_spending", t0: 25.0, t1: 30.5, zs: 1.07, ze: 1.09, eq: "brightness=-0.16:contrast=0.98:saturation=0.95", blur: 2.2 },
  { id: "s6", img: "img_04_action_divide_on_payday",   t0: 30.5, t1: 36.5, zs: 1.08, ze: 1.03, eq: "brightness=-0.02:contrast=1.0:saturation=1.04", blur: 0 },
  { id: "s7", img: "img_04_action_divide_on_payday",   t0: 36.5, t1: 40.0, zs: 1.06, ze: 1.02, eq: "brightness=0.03:contrast=1.0:saturation=1.05",  blur: 0 },
];
const FULL_DUR = 40.0;

// ── 3. Overlay 정의 (Pillow 스펙) ────────────────────────────────────────────
const COL = {
  white: "#FFFFFF", yellow: "#FFD400", orange: "#FF7A00", red: "#E82B2B",
  blue: "#3B82F6", gray: "#C7CDD4", panel: [13, 17, 23, 216], panelSoft: [13, 17, 23, 190],
};
const S = 10; // 기본 stroke px (계약 하한 8 이상)

// 각 overlay = 투명 1080x1920 캔버스 1장. start~end 사이 표시, entry fade 0.22s + 14px slide-up.
const OVERLAYS = [];
const capLenGuard = [];
function T(text) { capLenGuard.push(text); return text; }
function ov(id, start, end, elements) { OVERLAYS.push({ id, start, end, file: `${id}.png`, elements }); }

// s1 — hook
ov("ov01_hook_l1", 0.15, 5.5, [
  { type: "text", x: 540, y: 780, fs: 118, fill: COL.white, stroke: S + 1, text: T("월급은 올랐는데") },
]);
ov("ov02_hook_l2", 0.85, 5.5, [
  { type: "text", x: 540, y: 952, fs: 132, fill: COL.yellow, stroke: S + 1, text: T("통장은 그대로") },
  { type: "rect", x1: 350, y1: 1040, x2: 730, y2: 1056, fill: COL.yellow },
]);
ov("ov03_hook_cap", 3.0, 5.5, [
  { type: "text", x: 540, y: 1250, fs: 64, fill: COL.white, stroke: S - 1, text: T("당신 얘기 맞죠?") },
]);
// s2 — problem
ov("ov04_prob_panel", 5.7, 11.0, [
  { type: "rrect", x1: 110, y1: 640, x2: 970, y2: 1010, r: 28, fill: COL.panel },
  { type: "text", x: 540, y: 768, fs: 88, fill: COL.white, stroke: S, text: T("분명 더 버는데") },
]);
ov("ov05_prob_l2", 6.5, 11.0, [
  { type: "runs", cx: 540, y: 912, fs: 88, stroke: S, runs: [
    { t: "월말 잔액은 ", fill: COL.white }, { t: "그대로", fill: COL.orange } ] },
]);
ov("ov06_bridge_cap", 9.2, 11.0, [
  { type: "text", x: 540, y: 1250, fs: 66, fill: COL.yellow, stroke: S - 1, text: T("이미 예약된 지출") },
]);
// s3 — cause checklist
ov("ov07_cause_chip", 11.2, 18.5, [
  { type: "rrect", x1: 60, y1: 190, x2: 570, y2: 302, r: 22, fill: COL.red },
  { type: "text", x: 315, y: 246, fs: 62, fill: COL.white, stroke: S - 1, text: T("먼저 나가는 돈") },
]);
const causeRow = (id, start, y1, label) => ov(id, start, 18.5, [
  { type: "rrect", x1: 140, y1, x2: 940, y2: y1 + 140, r: 24, fill: COL.panelSoft },
  { type: "text", x: 430, y: y1 + 70, fs: 76, fill: COL.white, stroke: S, text: T(label) },
  { type: "poly", pts: [[820, y1 + 96], [864, y1 + 96], [842, y1 + 44]], fill: COL.red },
]);
causeRow("ov08_cause_r1", 12.1, 540, "고정비");
causeRow("ov09_cause_r2", 13.1, 710, "카드값");
causeRow("ov10_cause_r3", 14.1, 880, "구독료");
causeRow("ov11_cause_r4", 15.1, 1050, "생활비");
ov("ov12_cause_line", 16.4, 18.5, [
  { type: "runs", cx: 540, y: 1330, fs: 78, stroke: S, runs: [
    { t: "오른 월급부터 ", fill: COL.white }, { t: "흡수", fill: COL.red } ] },
]);
// s4 — illusion contrast
ov("ov13_ill_p1", 18.7, 25.0, [
  { type: "rrect", x1: 110, y1: 540, x2: 970, y2: 838, r: 28, fill: COL.panel },
  { type: "text", x: 540, y: 640, fs: 66, fill: COL.gray, stroke: S - 1, text: T("기억나는 건") },
  { type: "text", x: 540, y: 758, fs: 96, fill: COL.yellow, stroke: S, text: T("인상액 한 줄") },
]);
ov("ov14_ill_p2", 21.0, 25.0, [
  { type: "rrect", x1: 110, y1: 888, x2: 970, y2: 1186, r: 28, fill: COL.panel },
  { type: "text", x: 540, y: 988, fs: 66, fill: COL.gray, stroke: S - 1, text: T("늘어난 지출은") },
  { type: "text", x: 540, y: 1106, fs: 96, fill: COL.red, stroke: S, text: T("흩어져 안 보임") },
]);
ov("ov14b_ill_ul", 23.0, 25.0, [
  { type: "rect", x1: 300, y1: 1166, x2: 780, y2: 1180, fill: COL.red },
]);
// s5 — reframe (single sentence twist)
ov("ov15_ref_l1", 25.2, 30.5, [
  { type: "text", x: 540, y: 840, fs: 92, fill: COL.white, stroke: S + 1, text: T("안 모이는 게 아니라") },
]);
ov("ov16_ref_l2", 26.3, 30.5, [
  { type: "text", x: 540, y: 1000, fs: 102, fill: COL.yellow, stroke: S + 1, text: T("돈의 자리가 없던 것") },
]);
ov("ov16b_ref_ul", 28.0, 30.5, [
  { type: "rect", x1: 260, y1: 1078, x2: 820, y2: 1094, fill: COL.yellow },
]);
// s6 — action 3 slots
ov("ov17_act_title", 30.7, 36.5, [
  { type: "rrect", x1: 60, y1: 190, x2: 700, y2: 302, r: 22, fill: COL.orange },
  { type: "text", x: 380, y: 246, fs: 60, fill: COL.white, stroke: S - 1, text: T("받는 날, 먼저 나누기") },
]);
const slot = (id, start, y1, barColor, label) => ov(id, start, 36.5, [
  { type: "rrect", x1: 140, y1, x2: 940, y2: y1 + 150, r: 24, fill: COL.panel },
  { type: "rect", x1: 140, y1: y1 + 10, x2: 164, y2: y1 + 140, fill: barColor },
  { type: "text", x: 552, y: y1 + 75, fs: 76, fill: COL.white, stroke: S, text: T(label) },
]);
slot("ov18_slot1", 31.6, 590, COL.blue, "고정비 증가분");
slot("ov19_slot2", 32.6, 770, COL.orange, "생활비 상한");
slot("ov20_slot3", 33.6, 950, COL.yellow, "남길 돈");
// s7 — result + CTA
ov("ov21_result", 36.7, 40.0, [
  { type: "rrect", x1: 110, y1: 640, x2: 970, y2: 1010, r: 28, fill: COL.panel },
  { type: "text", x: 540, y: 762, fs: 78, fill: COL.white, stroke: S, text: T("체감은 잔액이 아니라") },
  { type: "text", x: 540, y: 902, fs: 84, fill: COL.yellow, stroke: S, text: T("돈의 자리에서 생겨요") },
]);
ov("ov22_cta", 38.1, 40.0, [
  { type: "rrect", x1: 250, y1: 1360, x2: 830, y2: 1502, r: 26, fill: COL.blue },
  { type: "text", x: 540, y: 1431, fs: 64, fill: COL.white, stroke: S - 1, text: T("저장하고 월급날 실행") },
]);

// 캡션 계약 guard: 줄당 <=12자 (공백 포함), 블록 <=2줄(설계상 보장)
for (const t of capLenGuard) {
  if (t.length > 12) fail(`caption_max_chars_per_line 위반: "${t}" (${t.length}자)`, 12);
}

// ── 4. Pillow overlay 렌더 (silent fallback 불가능 경로) ─────────────────────
const PY = `
import json, sys
from PIL import Image, ImageDraw, ImageFont
spec = json.load(open(sys.argv[1], encoding="utf-8"))
VF = spec["fontFile"]
def font(sz):
    f = ImageFont.truetype(VF, sz)
    f.set_variation_by_name(spec["variation"])  # 'Black' 미존재 시 예외 → fallback 불가
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
                   anchor="mm", stroke_width=el.get("stroke", 0), stroke_fill=(0,0,0,255))
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
const specPath = join(OUT_DIR, "overlay_spec.v1.json");
writeFileSync(specPath, JSON.stringify(spec, null, 2), "utf8");
console.log("── pillow overlays ──");
{
  const r = spawnSync("python", ["-", specPath], { shell: false, encoding: "utf8", input: PY, timeout: 180000 });
  if (r.status !== 0) fail(`pillow overlays failed:\n${(r.stderr || "").slice(-1400)}`, 4);
  console.log(r.stdout.trim().split("\n").length + " overlays rendered");
}

// ── 5. ffmpeg pass1 — 배경 트랙 (zoompan drift + hard cut concat) ────────────
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

// ── 6. ffmpeg pass2 — overlay 합성 (fade + entry slide) ──────────────────────
console.log("── ffmpeg pass2: overlay composite ──");
const outMp4 = join(OUT_DIR, "golden_sample_t1_lifestyle_inflation_visual_only.mp4");
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

// ── 7. ffprobe 검증 ──────────────────────────────────────────────────────────
console.log("── ffprobe ──");
const probe = run("ffprobe", ["-v", "error", "-show_entries",
  "stream=codec_type,codec_name,width,height,r_frame_rate,nb_frames:format=duration",
  "-of", "json", outMp4], "ffprobe");
const probeJson = JSON.parse(probe.stdout);
const vStreams = probeJson.streams.filter(s => s.codec_type === "video");
const aStreams = probeJson.streams.filter(s => s.codec_type === "audio");
const v = vStreams[0] || {};
const dur = parseFloat(probeJson.format?.duration || "0");
const probeOk = v.width === 1080 && v.height === 1920 && aStreams.length === 0 && dur >= 28 && dur <= 42;
console.log(`  ${v.width}x${v.height} ${v.codec_name} ${v.r_frame_rate} dur=${dur.toFixed(3)}s audioStreams=${aStreams.length} → ${probeOk ? "PASS" : "FAIL"}`);
if (!probeOk) fail("ffprobe gate 실패", 2);

// ── 8. key frame screenshots ─────────────────────────────────────────────────
console.log("── frame screenshots ──");
const SHOTS = [0.5, 1.4, 3.4, 5.9, 7.0, 9.5, 11.5, 12.6, 15.6, 17.0, 19.2, 21.6, 23.4, 25.7, 26.9, 28.4, 31.1, 34.2, 36.9, 38.6];
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

const manifest = {
  schemaVersion: "golden_sample_chatgpt_playwright_visual_only_render_manifest_v1",
  taskId: "golden-sample-chatgpt-playwright-visual-only-candidate-v1",
  createdAt: new Date().toISOString(),
  topicId: blueprint.topicId,
  blueprint: "scripts/fixtures/golden_sample_t1_lifestyle_inflation_story_blueprint.v1.json",
  imageSource: { summary: IMG_SUMMARY, images: IMAGES, provider_path: "ChatGPT+Playwright+Chrome CDP", nativeNote: "실측 native 해상도 그대로 기록 — 배경 채움은 lanczos 스케일" },
  typography: { engine: "pillow_overlay", font: "Noto Sans KR Black (NotoSansKR-VF named instance)", strokeMinPx: 9, silentFallbackPossible: false, malgunUsed: false, bottomFixedSubtitle: false },
  output: { mp4: outMp4, width: v.width, height: v.height, durationSec: dur, fps: FPS, audioStreams: aStreams.length },
  scenes: SCENES, overlays: OVERLAYS.map(o => ({ id: o.id, start: o.start, end: o.end })),
  perceptual: { eventCount: events.length, maxGapSec: Number(maxGap.toFixed(2)), events },
  frames: shotPaths,
  boundary: { tts: false, mux: false, upload: false, cost_usd: 0, render_ready: false, upload_ready: false },
};
writeFileSync(join(OUT_DIR, "render_manifest.v1.json"), JSON.stringify(manifest, null, 2), "utf8");
console.log(`DONE — ${outMp4}`);
console.log(`  perceptual events=${events.length}, maxGap=${maxGap.toFixed(2)}s`);
