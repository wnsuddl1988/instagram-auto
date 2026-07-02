#!/usr/bin/env node
// ──────────────────────────────────────────────────────────────────────────
// run-golden-sample-v2-s6-card-occlusion-reprobe-v1.mjs
//
// GOLDEN SAMPLE v2 — s6 CARD OCCLUSION REPROBE v1 (비용 0, 로컬 ffmpeg만)
//
// task: creative-v2-golden-sample-v2-s6-card-occlusion-reprobe-v1
//
// 목적:
//   s6_P_A(PATCH_STILL_NEEDED)의 visible '2' 영역을 final/save 카드 재배치로
//   가릴 수 있는지, 직전 denomination probe와 동일한 1080x1920 viewer frame
//   조건에서 baseline vs card-shift variant 프레임으로 검증한다.
//
// 안전 규칙:
//   - 네트워크/외부 API/provider 호출 없음. env/secret 접근 없음. import는 node 내장만.
//   - 원본 s6_P_A는 read-only 입력으로만 사용. 실존/1088x1936/bytes/MD5 불일치 시 abort(exit 10).
//   - 이미지 생성/재생성 없음. s1~s5 접근 없음. lock 없음. renderReady/uploadReady 항상 false.
//   - ffmpeg는 spawnSync(args array, shell:false)로만 실행.
//
// 사용: node scripts/run-golden-sample-v2-s6-card-occlusion-reprobe-v1.mjs
// exit: 0 = 완료, 1 = 실행 불가, 4 = ffmpeg 실패, 10 = 원본 무결성 게이트 실패
// ──────────────────────────────────────────────────────────────────────────

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const MANIFEST_PATH = join(__dirname, "fixtures", "golden_sample_v2_s6_card_occlusion_reprobe_manifest.v1.json");

const manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
if (manifest.schemaVersion !== "golden_sample_v2_s6_card_occlusion_reprobe_manifest_v1") {
  console.error("ABORT: manifest schemaVersion 불일치");
  process.exit(1);
}
const W = manifest.canvas.widthPx;
const H = manifest.canvas.heightPx;
const OUT_DIR = join(REPO_ROOT, manifest.outputs.outDir);
mkdirSync(OUT_DIR, { recursive: true });

function log(m) { console.log(`[s6-occl] ${m}`); }
function runFfmpeg(args, label) {
  const r = spawnSync("ffmpeg", args, { shell: false, encoding: "utf8", timeout: 120000 });
  if (r.status !== 0) {
    console.error(`ffmpeg ${label} failed (exit ${r.status}):\n${(r.stderr || "").slice(-1200)}`);
    process.exit(4);
  }
}
function sniffJpegDims(buf) {
  if (!(buf[0] === 0xff && buf[1] === 0xd8)) return null;
  let p = 2;
  while (p + 9 < buf.length) {
    if (buf[p] !== 0xff) { p++; continue; }
    const marker = buf[p + 1];
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return { w: buf.readUInt16BE(p + 7), h: buf.readUInt16BE(p + 5) };
    }
    p += 2 + buf.readUInt16BE(p + 2);
  }
  return null;
}

// ══════════════════════════════════════════════════════════════════════════
// STEP 1 — 원본 s6_P_A 무결성 게이트 (read-only, MD5까지)
// ══════════════════════════════════════════════════════════════════════════
const exp = manifest.sourceIntegrity.expected;
const srcPath = join(REPO_ROOT, exp.image);
log(`STEP 1 — 원본 무결성 게이트: ${exp.image}`);
if (!existsSync(srcPath)) {
  console.error("ABORT(10): 원본 이미지 없음");
  process.exit(10);
}
const srcBuf = readFileSync(srcPath); // read-only
const dims = sniffJpegDims(srcBuf);
const md5 = createHash("md5").update(srcBuf).digest("hex").toUpperCase();
const integrity = {
  image: exp.image, exists: true,
  fileSizeBytes: srcBuf.length, expectedBytes: exp.fileSizeBytes,
  width: dims?.w ?? null, height: dims?.h ?? null, expectedDims: `${exp.width}x${exp.height}`,
  md5, expectedMd5: exp.md5,
  gatePass: srcBuf.length === exp.fileSizeBytes && dims?.w === exp.width && dims?.h === exp.height && md5 === exp.md5,
};
log(`  ${dims?.w}x${dims?.h} bytes=${srcBuf.length} md5=${md5.slice(0, 8)}… → ${integrity.gatePass ? "PASS" : "FAIL"}`);
if (!integrity.gatePass) {
  console.error("ABORT(10): 원본 무결성 게이트 실패 — 파일 변조/불일치 의심. reprobe 중단.");
  writeFileSync(join(OUT_DIR, manifest.outputs.runSummary), JSON.stringify({
    schemaVersion: "golden_sample_v2_s6_card_occlusion_reprobe_run_summary_v1",
    status: "ABORT_SOURCE_INTEGRITY", integrity,
  }, null, 2) + "\n", "utf8");
  process.exit(10);
}

// ══════════════════════════════════════════════════════════════════════════
// STEP 2 — 배경 체인 (직전 probe와 동일, parity 사전 검증)
// ══════════════════════════════════════════════════════════════════════════
const BT = manifest.backgroundTreatment;
const zoomW = Math.round((W * BT.driftZoomMid) / 2) * 2;
const zoomH = Math.round((H * BT.driftZoomMid) / 2) * 2;
const bgChain = [BT.scaleCrop, BT.dim, BT.blur, `scale=${zoomW}:${zoomH}`, `crop=${W}:${H}`, "format=rgb24"].join(",");
if (bgChain !== BT.expectedChain) {
  console.error(`ABORT: 배경 체인 parity 불일치\n계산: ${bgChain}\n기대: ${BT.expectedChain}`);
  process.exit(1);
}

// ══════════════════════════════════════════════════════════════════════════
// STEP 3 — ASS overlay 빌드 (variant별 카드 위치, caption 동일)
// ══════════════════════════════════════════════════════════════════════════
const ST = manifest.overlayStyle;
const CBGR = ST.colorsAssBgr;
const esc = (t) => (t || "").replace(/\{/g, "(").replace(/\}/g, ")");
const rrAbs = (x1, y1, x2, y2, r) =>
  `m ${x1 + r} ${y1} l ${x2 - r} ${y1} b ${x2} ${y1} ${x2} ${y1} ${x2} ${y1 + r} l ${x2} ${y2 - r} b ${x2} ${y2} ${x2} ${y2} ${x2 - r} ${y2} l ${x1 + r} ${y2} b ${x1} ${y2} ${x1} ${y2} ${x1} ${y2 - r} l ${x1} ${y1 + r} b ${x1} ${y1} ${x1} ${y1} ${x1 + r} ${y1}`;
const runsToAss = (runs) => runs.map((r) => `{\\c${CBGR[r.c] || CBGR.white}}${esc(r.t)}`).join("");

function buildAss(variant) {
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
  const p = variant.panel;
  lines.push(`Dialogue: 0,${T0},${T1},Drw,,0,0,0,,{\\an7\\pos(0,0)\\bord0\\shad0\\1c${ST.panelFillAssBgr}\\1a${ST.panelAlpha}\\p1}${rrAbs(p.x1, p.y1, p.x2, p.y2, 26)}{\\p0}`);
  lines.push(`Dialogue: 2,${T0},${T1},Txt,,0,0,0,,{\\an8\\pos(540,${variant.line.y})\\fs${variant.line.fs}}${runsToAss(variant.line.runs)}`);
  const cap = manifest.caption;
  const i = cap.text.indexOf(cap.emphasis);
  const capRuns = i < 0 ? [{ t: cap.text, c: "white" }] : [
    ...(i > 0 ? [{ t: cap.text.slice(0, i), c: "white" }] : []),
    { t: cap.emphasis, c: cap.emphasisColor },
    ...(i + cap.emphasis.length < cap.text.length ? [{ t: cap.text.slice(i + cap.emphasis.length), c: "white" }] : []),
  ];
  lines.push(`Dialogue: 3,${T0},${T1},Cap,,0,0,0,,{\\an8\\pos(${cap.posX},${cap.posY})\\fs${cap.fs}}${runsToAss(capRuns)}`);
  return lines.join("\n") + "\n";
}

// ══════════════════════════════════════════════════════════════════════════
// STEP 4 — 프레임 생성: background 1장 + variant별 overlay/zoom
// ══════════════════════════════════════════════════════════════════════════
log(`STEP 2~4 — 프레임 생성 (배경 체인: 직전 probe 동일, parity 검증됨)`);
const frames = [];

const bgPng = join(OUT_DIR, "probe-s6_P_A-background.png");
runFfmpeg(["-y", "-i", srcPath, "-vf", bgChain, "-frames:v", "1", bgPng], "background");
frames.push({ kind: "background_probe", variantId: null, file: "probe-s6_P_A-background.png" });

const Z = manifest.occlusionZoomCrop;
for (const variant of manifest.cardVariants) {
  const assPath = join(OUT_DIR, `probe-s6_P_A-overlay-${variant.variantId}.ass`);
  writeFileSync(assPath, buildAss(variant), "utf8");
  const ovPng = join(OUT_DIR, `probe-s6_P_A-overlay-${variant.variantId}.png`);
  const assFilter = assPath.replace(/\\/g, "/").replace(/:/g, "\\:");
  runFfmpeg(["-y", "-i", bgPng, "-vf", `ass='${assFilter}'`, "-frames:v", "1", ovPng], `overlay ${variant.variantId}`);
  frames.push({ kind: "overlay_probe", variantId: variant.variantId, file: `probe-s6_P_A-overlay-${variant.variantId}.png` });

  const zoomPng = join(OUT_DIR, `zoom-${variant.variantId}.png`);
  runFfmpeg(["-y", "-i", ovPng, "-vf", `crop=${Z.w}:${Z.h}:${Z.x}:${Z.y},scale=${Z.w * Z.scale}:${Z.h * Z.scale}:flags=lanczos`, "-frames:v", "1", zoomPng], `zoom ${variant.variantId}`);
  frames.push({ kind: "occlusion_zoom_crop", evidenceOnly: true, variantId: variant.variantId, file: `zoom-${variant.variantId}.png` });

  log(`  [${variant.variantId}] overlay + zoom OK (panel y${variant.panel.y1}~${variant.panel.y2})`);
}

// ══════════════════════════════════════════════════════════════════════════
// STEP 5 — run summary (vision 판정은 별도 QA report)
// ══════════════════════════════════════════════════════════════════════════
const summary = {
  schemaVersion: "golden_sample_v2_s6_card_occlusion_reprobe_run_summary_v1",
  taskId: manifest.taskId,
  status: "RAN",
  canvas: `${W}x${H}`,
  backgroundChain: bgChain,
  rendererParity: "직전 denomination probe와 동일 체인 (parity 사전 검증) — baseline 카드 위치도 동일해 PATCH_STILL_NEEDED 상태 재현 가능",
  sourceIntegrity: { verdict: "PASS", detail: integrity },
  denominationRiskZone: manifest.denominationRiskZone,
  variants: manifest.cardVariants.map(v => ({ variantId: v.variantId, panel: v.panel, coversRiskZone: v.coversRiskZone })),
  frameCount: frames.length,
  viewerFrameCount: frames.filter(f => !f.evidenceOnly).length,
  minTotalFramesRequired: manifest.outputs.minTotalFrames,
  frameCountPass: frames.length >= manifest.outputs.minTotalFrames,
  frames,
  visionQaNote: "variant별 occlusion/story evidence 판정은 Claude vision이 qa-report에 기록. zoom은 evidence 전용.",
  boundary: { ...manifest.boundary },
};
writeFileSync(join(OUT_DIR, manifest.outputs.runSummary), JSON.stringify(summary, null, 2) + "\n", "utf8");
log(`summary: ${join(OUT_DIR, manifest.outputs.runSummary)}`);
log(`완료 — frames=${frames.length} (viewer ${summary.viewerFrameCount} + evidence ${frames.length - summary.viewerFrameCount}) integrity=PASS`);
process.exit(0);
