#!/usr/bin/env node
// ──────────────────────────────────────────────────────────────────────────
// run-golden-sample-v2-denomination-render-probe-v1.mjs
//
// GOLDEN SAMPLE v2 — DENOMINATION RENDER PROBE v1 (비용 0, 로컬 ffmpeg만)
//
// task: creative-v2-golden-sample-v2-denomination-render-probe-v1
//
// 목적:
//   FLUX2 selected 6장(s1_B/s2_A/s3_A/s4_A/s5_B/s6_B)의 SOFT_RISK(지폐 액면 숫자)가
//   실제 시청 프레임(1080x1920 + 직전 채택 renderer와 동일한 dim/blur/crop +
//   card/caption overlay)에서 읽히는지 판정할 probe 프레임을 산출한다.
//
// 산출 (scene별 3프레임):
//   - background_probe : viewer frame 판정용 (dim/blur/crop, 카드 없음)
//   - overlay_probe    : viewer frame 판정용 (동일 frame + card/caption)
//   - denomination_zoom_crop : evidence 전용 (viewer 판정에 사용하지 않음, 액면부 2x)
//
// 안전 규칙:
//   - 네트워크/외부 API/provider 호출 없음. env/secret 읽기 없음. import는 node 내장만.
//   - 원본 selected 이미지는 read-only 입력으로만 사용 (수정/이동/복사 없음).
//   - 원본 실존/1088x1936/파일크기 불일치 시 즉시 abort (exit 10).
//   - selected image set lock 없음. renderReady/uploadReady는 항상 false.
//   - ffmpeg/ffprobe는 spawnSync(args array, shell:false)로만 실행.
//
// 사용: node scripts/run-golden-sample-v2-denomination-render-probe-v1.mjs
// exit: 0 = 완료, 4 = ffmpeg 실패, 10 = 원본 무결성 게이트 실패, 1 = 실행 불가
// ──────────────────────────────────────────────────────────────────────────

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve, isAbsolute } from "node:path";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const MANIFEST_PATH = join(__dirname, "fixtures", "golden_sample_v2_denomination_render_probe_manifest.v1.json");

const manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
if (manifest.schemaVersion !== "golden_sample_v2_denomination_render_probe_manifest_v1") {
  console.error("ABORT: manifest schemaVersion 불일치");
  process.exit(1);
}
const W = manifest.canvas.widthPx;
const H = manifest.canvas.heightPx;
const abs = (p) => (isAbsolute(p) ? p : join(REPO_ROOT, p));
const OUT_DIR = abs(manifest.outputs.outDir);
mkdirSync(OUT_DIR, { recursive: true });

function log(m) { console.log(`[dprobe] ${m}`); }
function runFfmpeg(args, label) {
  const r = spawnSync("ffmpeg", args, { shell: false, encoding: "utf8", timeout: 120000 });
  if (r.status !== 0) {
    console.error(`ffmpeg ${label} failed (exit ${r.status}):\n${(r.stderr || "").slice(-1200)}`);
    process.exit(4);
  }
}
function ffprobeDims(file) {
  const r = spawnSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "json", file], { shell: false, encoding: "utf8", timeout: 60000 });
  if (r.status !== 0) return null;
  try { const s = JSON.parse(r.stdout)?.streams?.[0]; return s ? { w: s.width, h: s.height } : null; } catch { return null; }
}

// ══════════════════════════════════════════════════════════════════════════
// STEP 1 — 원본 selected 6장 무결성 게이트 (read-only)
// ══════════════════════════════════════════════════════════════════════════
log("STEP 1 — selected 원본 무결성 게이트 (실존/1088x1936/파일크기)");
const integrity = [];
let gateFail = 0;
for (const e of manifest.sourceIntegrity.expected) {
  const p = abs(e.image);
  const exists = existsSync(p);
  let bytes = null, md5 = null, dims = null;
  if (exists) {
    const buf = readFileSync(p); // read-only — 어떤 write/rename도 하지 않는다
    bytes = buf.length;
    md5 = createHash("md5").update(buf).digest("hex").toUpperCase();
    dims = ffprobeDims(p);
  }
  const pass = exists && bytes === e.fileSizeBytes && dims && dims.w === e.width && dims.h === e.height;
  if (!pass) gateFail++;
  integrity.push({
    sceneId: e.sceneId, candidateId: e.candidateId, image: e.image,
    exists, fileSizeBytes: bytes, expectedBytes: e.fileSizeBytes,
    width: dims?.w ?? null, height: dims?.h ?? null,
    expected: `${e.width}x${e.height}`, md5, gatePass: pass,
  });
  log(`  [${e.candidateId}] ${dims ? `${dims.w}x${dims.h}` : "?"} bytes=${bytes} md5=${md5 ? md5.slice(0, 8) + "…" : "?"} → ${pass ? "PASS" : "FAIL"}`);
}
if (gateFail > 0) {
  console.error(`ABORT: 원본 무결성 게이트 실패 ${gateFail}건 — 파일 누락/변조/해상도 불일치 의심. probe 중단.`);
  writeFileSync(join(OUT_DIR, manifest.outputs.runSummary), JSON.stringify({
    schemaVersion: "golden_sample_v2_denomination_render_probe_run_summary_v1",
    status: "ABORT_SOURCE_INTEGRITY", integrity,
  }, null, 2) + "\n", "utf8");
  process.exit(10);
}

// ══════════════════════════════════════════════════════════════════════════
// STEP 2 — ASS overlay 빌드 (renderer 스타일 축약판: absolute rounded panel + runs)
// entry 애니메이션은 넣지 않는다 — probe 판정 대상은 카드 '정착 상태' 프레임.
// ══════════════════════════════════════════════════════════════════════════
const ST = manifest.overlayStyle;
const CBGR = ST.colorsAssBgr;
const esc = (t) => (t || "").replace(/\{/g, "(").replace(/\}/g, ")");
const rrAbs = (x1, y1, x2, y2, r) =>
  `m ${x1 + r} ${y1} l ${x2 - r} ${y1} b ${x2} ${y1} ${x2} ${y1} ${x2} ${y1 + r} l ${x2} ${y2 - r} b ${x2} ${y2} ${x2} ${y2} ${x2 - r} ${y2} l ${x1 + r} ${y2} b ${x1} ${y2} ${x1} ${y2} ${x1} ${y2 - r} l ${x1} ${y1 + r} b ${x1} ${y1} ${x1} ${y1} ${x1 + r} ${y1}`;
const runsToAss = (runs) => runs.map((r) => `{\\c${CBGR[r.c] || CBGR.white}}${esc(r.t)}`).join("");

function buildAss(scene) {
  const lines = [
    "[Script Info]", "ScriptType: v4.00+", `PlayResX: ${W}`, `PlayResY: ${H}`,
    "ScaledBorderAndShadow: yes", "WrapStyle: 2", "",
    "[V4+ Styles]",
    "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
    `Style: Txt,${ST.font},60,${CBGR.white},&H000000FF,&H00141210,&H96000000,1,0,0,0,100,100,0,0,1,${ST.cardTextOutline},1.2,5,60,60,60,1`,
    `Style: Cap,${ST.font},60,${CBGR.white},&H000000FF,&H00141210,&H96000000,1,0,0,0,100,100,0,0,1,${ST.captionOutline},${ST.captionShadow},8,60,60,60,1`,
    `Style: Drw,${ST.font},20,${CBGR.white},&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,0,0,7,0,0,0,1`,
    "", "[Events]",
    "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
  ];
  const T0 = "0:00:00.00", T1 = "0:00:05.00";
  const panel = (x1, y1, x2, y2) =>
    lines.push(`Dialogue: 0,${T0},${T1},Drw,,0,0,0,,{\\an7\\pos(0,0)\\bord0\\shad0\\1c${ST.panelFillAssBgr}\\1a${ST.panelAlpha}\\p1}${rrAbs(x1, y1, x2, y2, 26)}{\\p0}`);
  const text = (x, y, fs, runs) =>
    lines.push(`Dialogue: 2,${T0},${T1},Txt,,0,0,0,,{\\an8\\pos(${x},${y})\\fs${fs}}${runsToAss(runs)}`);

  const card = scene.card;
  if (card.panel) {
    panel(card.panel.x1, card.panel.y1, card.panel.x2, card.panel.y2);
    for (const ln of card.lines || []) text(540, ln.y, ln.fs, ln.runs);
  }
  if (card.subPanel) {
    panel(card.subPanel.x1, card.subPanel.y1, card.subPanel.x2, card.subPanel.y2);
    for (const ln of card.subPanel.lines || []) text(540, ln.y, ln.fs, ln.runs);
  }
  if (card.slotPanels) {
    for (const sp of card.slotPanels) {
      panel(sp.x1, sp.y1, sp.x2, sp.y2);
      text(Math.round((sp.x1 + sp.x2) / 2), sp.line.y, sp.line.fs, sp.line.runs);
    }
  }
  // dynamic caption (상단 keyword phrase — 하단 고정 자막 바 아님)
  const cap = scene.caption;
  const capRuns = (() => {
    const i = cap.text.indexOf(cap.emphasis);
    if (i < 0) return [{ t: cap.text, c: "white" }];
    const out = [];
    if (i > 0) out.push({ t: cap.text.slice(0, i), c: "white" });
    out.push({ t: cap.emphasis, c: cap.emphasisColor });
    if (i + cap.emphasis.length < cap.text.length) out.push({ t: cap.text.slice(i + cap.emphasis.length), c: "white" });
    return out;
  })();
  lines.push(`Dialogue: 3,${T0},${T1},Cap,,0,0,0,,{\\an8\\pos(${cap.posX},${cap.posY})\\fs${cap.fs}}${runsToAss(capRuns)}`);
  return lines.join("\n") + "\n";
}

// ══════════════════════════════════════════════════════════════════════════
// STEP 3 — scene별 probe 프레임 생성
// ══════════════════════════════════════════════════════════════════════════
const BT = manifest.backgroundTreatment;
const zoomW = Math.round((W * BT.driftZoomMid) / 2) * 2;
const zoomH = Math.round((H * BT.driftZoomMid) / 2) * 2;
const bgChain = [
  BT.scaleCrop,
  BT.dim,
  BT.blur,
  `scale=${zoomW}:${zoomH}`,
  `crop=${W}:${H}`,
  "format=rgb24",
].join(",");

log(`STEP 2/3 — probe 프레임 생성 (배경 체인: ${bgChain})`);
const frames = [];
for (const scene of manifest.scenes) {
  const src = abs(manifest.sourceIntegrity.expected.find((e) => e.candidateId === scene.candidateId).image);
  const tag = `${scene.sceneId}-${scene.candidateId}`;

  const bgPng = join(OUT_DIR, `probe-${tag}-background.png`);
  runFfmpeg(["-y", "-i", src, "-vf", bgChain, "-frames:v", "1", bgPng], `bg ${tag}`);
  frames.push({ sceneId: scene.sceneId, kind: "background_probe", file: bgPng });

  const assPath = join(OUT_DIR, `probe-${tag}-overlay.ass`);
  writeFileSync(assPath, buildAss(scene), "utf8");
  const ovPng = join(OUT_DIR, `probe-${tag}-overlay.png`);
  const assFilter = assPath.replace(/\\/g, "/").replace(/:/g, "\\:");
  runFfmpeg(["-y", "-i", bgPng, "-vf", `ass='${assFilter}'`, "-frames:v", "1", ovPng], `overlay ${tag}`);
  frames.push({ sceneId: scene.sceneId, kind: "overlay_probe", file: ovPng });

  const z = scene.denominationZoomCrop;
  const zoomPng = join(OUT_DIR, `probe-${tag}-denomination-zoom.png`);
  runFfmpeg(["-y", "-i", bgPng, "-vf", `crop=${z.w}:${z.h}:${z.x}:${z.y},scale=${z.w * z.scale}:${z.h * z.scale}:flags=lanczos`, "-frames:v", "1", zoomPng], `zoom ${tag}`);
  frames.push({ sceneId: scene.sceneId, kind: "denomination_zoom_crop", evidenceOnly: true, file: zoomPng });

  log(`  [${scene.candidateId}] background + overlay + zoom-crop OK`);
}

// ══════════════════════════════════════════════════════════════════════════
// STEP 4 — run summary (vision 판정은 별도 QA report에서 채운다)
// ══════════════════════════════════════════════════════════════════════════
const viewerFrames = frames.filter((f) => !f.evidenceOnly);
const summary = {
  schemaVersion: "golden_sample_v2_denomination_render_probe_run_summary_v1",
  taskId: manifest.taskId,
  status: "RAN",
  canvas: `${W}x${H}`,
  backgroundChain: bgChain,
  rendererParity: "dim/blur/scale-crop은 render-golden-sample-visual-only-v1.mjs 채택값과 동일, drift zoom 중간값 1.06 반영",
  sourceIntegrity: { verdict: "PASS", images: integrity },
  frameCount: frames.length,
  viewerFrameCount: viewerFrames.length,
  minTotalFramesRequired: manifest.outputs.minTotalFrames,
  frameCountPass: viewerFrames.length >= manifest.outputs.minTotalFrames,
  frames,
  visionQaNote: "scene별 raw/background/overlay risk 판정은 Claude vision이 qa-report에 기록한다. denomination_zoom_crop은 evidence 전용이며 viewer frame 판정에 사용하지 않는다.",
  boundary: { ...manifest.boundary },
};
writeFileSync(join(OUT_DIR, manifest.outputs.runSummary), JSON.stringify(summary, null, 2) + "\n", "utf8");
log(`STEP 4 — run summary: ${join(OUT_DIR, manifest.outputs.runSummary)}`);
log(`완료 — frames=${frames.length} (viewer ${viewerFrames.length} + evidence ${frames.length - viewerFrames.length}) sourceIntegrity=PASS`);
process.exit(0);
