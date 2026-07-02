/**
 * Golden Sample — ChatGPT+Playwright Visual-Only Candidate Renderer v2 (revision)
 * task: golden-sample-chatgpt-playwright-visual-only-revision-v2
 *
 * v1 대비 변경:
 *   - blueprint v2의 selected_image_set(6장, md5 명시) 소비 — awkward img_03 미사용.
 *   - 7 visual beats / 31.5s (v1: 4장/40s) — 이미지 dwell 단축.
 *   - 나머지 파이프라인 동일: Pillow RGBA 오버레이(Noto Sans KR Black VF, silent fallback 불가)
 *     → ffmpeg pass1(zoompan drift + hard cut concat) → pass2(fade+slide 합성) → ffprobe/frames.
 *
 * 금지: TTS/mux/upload/유료 API/placeholder/Malgun fallback. 로컬 전용.
 * 출력: C:\tmp\money-shorts-os\golden-sample-chatgpt-playwright-visual-only-v2\
 */

import { writeFileSync, readFileSync, mkdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import crypto from "node:crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const BLUEPRINT = join(REPO_ROOT, "scripts", "fixtures", "golden_sample_t1_lifestyle_inflation_story_blueprint.v2.json");
const OUT_DIR = "C:/tmp/money-shorts-os/golden-sample-chatgpt-playwright-visual-only-v2";
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

// ── 1. 이미지 gate (blueprint v2 selected_image_set + md5) ───────────────────
if (!existsSync(VF_FILE)) fail("NotoSansKR-VF.ttf 미존재 — Malgun fallback 금지로 진행 불가", 12);
const blueprint = JSON.parse(readFileSync(BLUEPRINT, "utf8"));
if (blueprint.schemaVersion !== "golden_sample_story_blueprint_v2") fail("blueprint v2 schema 불일치", 12);

const IMAGES = {};
console.log("── selected image set integrity gate (v2) ──");
for (const s of blueprint.selected_image_set) {
  const p = join(REPO_ROOT, s.path);
  if (!existsSync(p)) fail(`이미지 미존재: ${s.path}`, 12);
  const b = readFileSync(p);
  const md5 = crypto.createHash("md5").update(b).digest("hex");
  if (md5 !== s.md5) fail(`md5 불일치: ${s.imageId} expected=${s.md5} actual=${md5}`, 12);
  IMAGES[s.imageId] = { path: p, md5, bytes: b.length };
  console.log(`  ${s.imageId}: md5 OK (${s.origin})`);
}
if (blueprint.excluded_images?.some(e => IMAGES[e.imageId])) fail("excluded 이미지가 selected set에 포함됨", 12);

mkdirSync(OVL_DIR, { recursive: true });
mkdirSync(FRAME_DIR, { recursive: true });

// ── 2. 장면 정의 (blueprint v2 타이밍 준수 — 7 beats / 31.5s) ────────────────
const SCENES = [
  { id: "s1", img: "img_01_hook_raise_no_change",         t0: 0.0,  t1: 4.0,  zs: 1.02, ze: 1.08, eq: "brightness=-0.06:contrast=1.0:saturation=1.03", blur: 0 },
  { id: "s2", img: "img_05_problem_month_end",            t0: 4.0,  t1: 8.5,  zs: 1.03, ze: 1.08, eq: "brightness=-0.08:contrast=1.0:saturation=1.02", blur: 0 },
  { id: "s3", img: "img_02_cause_absorbed_outflow",       t0: 8.5,  t1: 13.5, zs: 1.03, ze: 1.09, eq: "brightness=-0.06:contrast=1.0:saturation=1.03", blur: 0 },
  { id: "s4", img: "img_06_illusion_bundle_vs_scattered", t0: 13.5, t1: 18.5, zs: 1.02, ze: 1.07, eq: "brightness=-0.08:contrast=1.02:saturation=1.0", blur: 0 },
  { id: "s5", img: "img_06_illusion_bundle_vs_scattered", t0: 18.5, t1: 23.0, zs: 1.07, ze: 1.09, eq: "brightness=-0.16:contrast=0.98:saturation=0.95", blur: 2.2 },
  { id: "s6", img: "img_04_action_divide_on_payday",      t0: 23.0, t1: 28.0, zs: 1.08, ze: 1.03, eq: "brightness=-0.02:contrast=1.0:saturation=1.04", blur: 0 },
  { id: "s7", img: "img_07_result_settled_morning",       t0: 28.0, t1: 31.5, zs: 1.06, ze: 1.02, eq: "brightness=0.03:contrast=1.0:saturation=1.05",  blur: 0 },
];
const FULL_DUR = 31.5;
{
  const bp = blueprint.story_chain;
  if (bp.length !== SCENES.length) fail("blueprint story_chain과 SCENES 수 불일치", 12);
  for (let i = 0; i < bp.length; i++) {
    if (bp[i].timeStartSec !== SCENES[i].t0 || bp[i].timeEndSec !== SCENES[i].t1 || bp[i].image !== SCENES[i].img) {
      fail(`scene ${SCENES[i].id} blueprint 타이밍/이미지 불일치`, 12);
    }
  }
}

// ── 3. Overlay 정의 ──────────────────────────────────────────────────────────
const COL = {
  white: "#FFFFFF", yellow: "#FFD400", orange: "#FF7A00", red: "#E82B2B",
  blue: "#3B82F6", gray: "#C7CDD4", panel: [13, 17, 23, 216], panelSoft: [13, 17, 23, 190],
};
const S = 10;
const OVERLAYS = [];
const capLenGuard = [];
function T(text) { capLenGuard.push(text); return text; }
function ov(id, start, end, elements) { OVERLAYS.push({ id, start, end, file: `${id}.png`, elements }); }

// s1 — hook (0–4.0)
ov("ov01_hook_l1", 0.15, 4.0, [
  { type: "text", x: 540, y: 760, fs: 112, fill: COL.white, stroke: S + 1, text: T("월급은 올랐는데") },
]);
ov("ov02_hook_l2", 0.8, 4.0, [
  { type: "text", x: 540, y: 924, fs: 126, fill: COL.yellow, stroke: S + 1, text: T("통장은 그대로") },
  { type: "rect", x1: 360, y1: 1008, x2: 720, y2: 1024, fill: COL.yellow },
]);
ov("ov03_hook_cap", 2.4, 4.0, [
  { type: "text", x: 540, y: 1210, fs: 64, fill: COL.white, stroke: S - 1, text: T("당신 얘기 맞죠?") },
]);
// s2 — problem (4.0–8.5)
ov("ov04_prob_panel", 4.2, 8.5, [
  { type: "rrect", x1: 110, y1: 560, x2: 970, y2: 930, r: 28, fill: COL.panel },
  { type: "text", x: 540, y: 688, fs: 86, fill: COL.white, stroke: S, text: T("분명 더 버는데") },
]);
ov("ov05_prob_l2", 5.0, 8.5, [
  { type: "runs", cx: 540, y: 832, fs: 86, stroke: S, runs: [
    { t: "월말 잔액은 ", fill: COL.white }, { t: "그대로", fill: COL.orange } ] },
]);
ov("ov06_bridge_cap", 7.2, 8.5, [
  { type: "text", x: 540, y: 1180, fs: 66, fill: COL.yellow, stroke: S - 1, text: T("이미 예약된 지출") },
]);
// s3 — cause checklist (8.5–13.5)
ov("ov07_cause_chip", 8.7, 13.5, [
  { type: "rrect", x1: 60, y1: 190, x2: 570, y2: 302, r: 22, fill: COL.red },
  { type: "text", x: 315, y: 246, fs: 62, fill: COL.white, stroke: S - 1, text: T("먼저 나가는 돈") },
]);
const causeRow = (id, start, y1, label) => ov(id, start, 13.5, [
  { type: "rrect", x1: 140, y1, x2: 940, y2: y1 + 132, r: 24, fill: COL.panelSoft },
  { type: "text", x: 430, y: y1 + 66, fs: 74, fill: COL.white, stroke: S, text: T(label) },
  { type: "poly", pts: [[820, y1 + 92], [864, y1 + 92], [842, y1 + 40]], fill: COL.red },
]);
causeRow("ov08_cause_r1", 9.4, 540, "고정비");
causeRow("ov09_cause_r2", 10.2, 700, "카드값");
causeRow("ov10_cause_r3", 11.0, 860, "구독료");
causeRow("ov11_cause_r4", 11.8, 1020, "생활비");
ov("ov12_cause_line", 12.5, 13.5, [
  { type: "runs", cx: 540, y: 1300, fs: 76, stroke: S, runs: [
    { t: "오른 월급부터 ", fill: COL.white }, { t: "흡수", fill: COL.red } ] },
]);
// s4 — illusion (13.5–18.5)
ov("ov13_ill_p1", 13.7, 18.5, [
  { type: "rrect", x1: 110, y1: 1090, x2: 970, y2: 1380, r: 28, fill: COL.panel },
  { type: "text", x: 540, y: 1188, fs: 64, fill: COL.gray, stroke: S - 1, text: T("기억나는 건") },
  { type: "text", x: 540, y: 1302, fs: 90, fill: COL.yellow, stroke: S, text: T("인상액 한 덩어리") },
]);
ov("ov14_ill_p2", 15.8, 18.5, [
  { type: "rrect", x1: 110, y1: 1430, x2: 970, y2: 1600, r: 28, fill: COL.panel },
  { type: "runs", cx: 540, y: 1515, fs: 72, stroke: S, runs: [
    { t: "늘어난 지출은 ", fill: COL.white }, { t: "안 보임", fill: COL.red } ] },
]);
ov("ov14b_ill_ul", 17.5, 18.5, [
  { type: "rect", x1: 560, y1: 1562, x2: 850, y2: 1576, fill: COL.red },
]);
// s5 — reframe (18.5–23.0)
ov("ov15_ref_l1", 18.7, 23.0, [
  { type: "text", x: 540, y: 820, fs: 90, fill: COL.white, stroke: S + 1, text: T("안 모이는 게 아니라") },
]);
ov("ov16_ref_l2", 19.8, 23.0, [
  { type: "text", x: 540, y: 980, fs: 100, fill: COL.yellow, stroke: S + 1, text: T("돈의 자리가 없던 것") },
]);
ov("ov16b_ref_ul", 21.3, 23.0, [
  { type: "rect", x1: 265, y1: 1058, x2: 815, y2: 1074, fill: COL.yellow },
]);
// s6 — action 3 slots (23.0–28.0)
ov("ov17_act_title", 23.2, 28.0, [
  { type: "rrect", x1: 60, y1: 190, x2: 700, y2: 302, r: 22, fill: COL.orange },
  { type: "text", x: 380, y: 246, fs: 60, fill: COL.white, stroke: S - 1, text: T("받는 날, 먼저 나누기") },
]);
const slot = (id, start, y1, barColor, label) => ov(id, start, 28.0, [
  { type: "rrect", x1: 140, y1, x2: 940, y2: y1 + 146, r: 24, fill: COL.panel },
  { type: "rect", x1: 140, y1: y1 + 10, x2: 164, y2: y1 + 136, fill: barColor },
  { type: "text", x: 552, y: y1 + 73, fs: 74, fill: COL.white, stroke: S, text: T(label) },
]);
slot("ov18_slot1", 24.0, 560, COL.blue, "고정비 증가분");
slot("ov19_slot2", 24.9, 740, COL.orange, "생활비 상한");
slot("ov20_slot3", 25.8, 920, COL.yellow, "남길 돈");
// s7 — result + CTA (28.0–31.5)
ov("ov21_result", 28.2, 31.5, [
  { type: "rrect", x1: 110, y1: 1100, x2: 970, y2: 1462, r: 28, fill: COL.panel },
  { type: "text", x: 540, y: 1218, fs: 76, fill: COL.white, stroke: S, text: T("체감은 잔액이 아니라") },
  { type: "text", x: 540, y: 1358, fs: 82, fill: COL.yellow, stroke: S, text: T("돈의 자리에서 생겨요") },
]);
ov("ov22_cta", 29.9, 31.5, [
  { type: "rrect", x1: 250, y1: 1496, x2: 830, y2: 1632, r: 26, fill: COL.blue },
  { type: "text", x: 540, y: 1564, fs: 62, fill: COL.white, stroke: S - 1, text: T("저장하고 월급날 실행") },
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
const specPath = join(OUT_DIR, "overlay_spec.v2.json");
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
const outMp4 = join(OUT_DIR, "golden_sample_t1_lifestyle_inflation_visual_only_v2.mp4");
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
const probeOk = v.width === 1080 && v.height === 1920 && aStreams.length === 0 && dur >= 30 && dur <= 34;
console.log(`  ${v.width}x${v.height} ${v.codec_name} ${v.r_frame_rate} dur=${dur.toFixed(3)}s audioStreams=${aStreams.length} → ${probeOk ? "PASS" : "FAIL"}`);
if (!probeOk) fail("ffprobe gate 실패", 2);

// ── 8. key frame screenshots ─────────────────────────────────────────────────
console.log("── frame screenshots ──");
const SHOTS = [0.5, 1.3, 3.0, 4.6, 5.5, 7.6, 9.0, 10.6, 12.2, 13.0, 14.2, 16.3, 17.8, 19.2, 21.6, 23.6, 26.3, 28.6, 30.3, 31.2];
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
SCENES.forEach(sc => { dwell[sc.img] = (dwell[sc.img] || 0) + (sc.t1 - sc.t0); });

const manifest = {
  schemaVersion: "golden_sample_chatgpt_playwright_visual_only_render_manifest_v2",
  taskId: "golden-sample-chatgpt-playwright-visual-only-revision-v2",
  createdAt: new Date().toISOString(),
  topicId: blueprint.topicId,
  blueprint: "scripts/fixtures/golden_sample_t1_lifestyle_inflation_story_blueprint.v2.json",
  imageSource: { images: IMAGES, excluded: blueprint.excluded_images, provider_path: "ChatGPT+Playwright+Chrome CDP", nativeNote: "native 941x1672 실측 그대로 — 배경 채움 lanczos" },
  typography: { engine: "pillow_overlay", font: "Noto Sans KR Black (NotoSansKR-VF named instance)", strokeMinPx: 9, silentFallbackPossible: false, malgunUsed: false, bottomFixedSubtitle: false },
  output: { mp4: outMp4, width: v.width, height: v.height, durationSec: dur, fps: FPS, audioStreams: aStreams.length },
  scenes: SCENES,
  imageDwellSec: dwell,
  overlays: OVERLAYS.map(o => ({ id: o.id, start: o.start, end: o.end })),
  perceptual: { eventCount: events.length, maxGapSec: Number(maxGap.toFixed(2)), events },
  frames: shotPaths,
  boundary: { tts: false, mux: false, upload: false, cost_usd: 0, render_ready: false, upload_ready: false },
};
writeFileSync(join(OUT_DIR, "render_manifest.v2.json"), JSON.stringify(manifest, null, 2), "utf8");
console.log(`DONE — ${outMp4}`);
console.log(`  visual beats=${SCENES.length}, events=${events.length}, maxGap=${maxGap.toFixed(2)}s`);
console.log(`  image dwell(sec): ${JSON.stringify(dwell)}`);
