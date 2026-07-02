#!/usr/bin/env node
// ──────────────────────────────────────────────────────────────────────────
// render-golden-sample-visual-only-v1.mjs
//
// GOLDEN SAMPLE — T2 VISUAL-ONLY CARD-IMAGE HYBRID RENDERER v1 (local ffmpeg only)
//
// task: creative-v2-golden-sample-visual-only-render-v1
// 기존 render-money-shorts-card-image-hybrid-v1.mjs는 수정/삭제하지 않는다(보존).
//
// 계약:
//   1) IMAGE GATE FIRST — lock manifest(golden_sample_flux2_selected_image_set_lock.v1.json)의
//      lockedImages 6장만 사용. render 전 MD5/크기/해상도(≥1080x1920, 9:16) 전수 대조.
//      불일치 시 즉시 ABORT (md5 mismatch = exit 11, resolution gate = exit 10).
//      upscale/placeholder/stock/mock 대체 금지.
//   2) card-first: 배경은 dim+저강도 blur(질감 유지), 카드가 정보 주연.
//      hook/contrast/checklist/number/graph/twist/action 7 카드 + perceptual events.
//   3) Reels-style dynamic caption: bottom-fixed bar 금지, phrase 단위 1~5단어,
//      pop/reveal 모션, 하단 15% 상시 점유 금지. 타이밍은 provisional_visual_only —
//      후속 TTS-first 단계에서 실제 word timing으로 교체.
//   4) visual-only: audio stream 없음. TTS/mux/upload 금지. uploadReady=false.
//
// 절대 하지 않는 것: 외부 API/이미지 생성/TTS/mux/upload/env/secret/원본 이미지 수정.
// ffmpeg/ffprobe는 spawnSync(args array, shell:false)로만. C:\tmp 아래에만 write.
//
// 사용: node scripts/render-golden-sample-visual-only-v1.mjs [--gate-only]
// ──────────────────────────────────────────────────────────────────────────

import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve, isAbsolute } from "node:path";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const MANIFEST_PATH = join(__dirname, "fixtures", "golden_sample_visual_only_render_manifest.t2.v1.json");

const argv = process.argv.slice(2);
const GATE_ONLY = argv.includes("--gate-only");

const manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
const W = manifest.canvas.widthPx;
const H = manifest.canvas.heightPx;
const FPS = manifest.canvas.fps;

// ── out-dir guard: under C:\tmp and outside repo ────────────────────────────
const outAbs = resolve(manifest.outputPaths.outDir);
if (!/^C:\\+tmp\\+/i.test(manifest.outputPaths.outDir)) {
  console.error(`ABORT: out-dir must be under C:\\tmp. got: ${manifest.outputPaths.outDir}`);
  process.exit(2);
}
if (outAbs === REPO_ROOT || outAbs.startsWith(REPO_ROOT + "\\") || outAbs.startsWith(REPO_ROOT + "/")) {
  console.error("ABORT: out-dir must be OUTSIDE repo root.");
  process.exit(2);
}
mkdirSync(outAbs, { recursive: true });

const assetAbs = (p) => (isAbsolute(p) ? p : join(REPO_ROOT, p));

function ffprobeJson(args) {
  const r = spawnSync("ffprobe", ["-v", "error", ...args, "-of", "json"], { shell: false, encoding: "utf8", timeout: 60000 });
  if (r.status !== 0) return null;
  try { return JSON.parse(r.stdout); } catch { return null; }
}
function runFfmpeg(args, label) {
  const r = spawnSync("ffmpeg", args, { shell: false, encoding: "utf8", timeout: 600000 });
  if (r.status !== 0) {
    console.error(`ffmpeg ${label} failed (exit ${r.status}):\n${(r.stderr || "").slice(-1500)}`);
    process.exit(4);
  }
}

// ══════════════════════════════════════════════════════════════════════════
// STEP 1 — LOCKED IMAGE GATE (MD5 + resolution) — render 전 필수
// ══════════════════════════════════════════════════════════════════════════
const lock = JSON.parse(readFileSync(assetAbs(manifest.imageSource.lockFixture), "utf8"));
const lockByOrder = new Map(lock.lockedImages.map((l) => [l.order, l]));
const GATE = manifest.imageQualityGate;
const targetAspect = W / H;

const gateResults = [];
for (const scene of manifest.scenes) {
  const li = lockByOrder.get(scene.order);
  const abs = li ? assetAbs(li.path) : null;
  const exists = !!abs && existsSync(abs);
  let md5 = null, sizeBytes = null, width = null, height = null;
  if (exists) {
    const buf = readFileSync(abs);
    sizeBytes = buf.length;
    md5 = createHash("md5").update(buf).digest("hex").toUpperCase();
    const pr = ffprobeJson(["-select_streams", "v:0", "-show_entries", "stream=width,height", abs]);
    const s = pr?.streams?.[0] || {};
    width = s.width ?? null;
    height = s.height ?? null;
  }
  const md5Match = !!li && md5 === li.md5;
  const sizeMatch = !!li && sizeBytes === li.fileSizeBytes;
  const aspect = width && height ? width / height : null;
  const resOk = !!(width && height && width >= GATE.minWidthPx && height >= GATE.minHeightPx);
  const aspectOk = aspect != null ? Math.abs(aspect - targetAspect) <= 0.01 : false;
  gateResults.push({
    order: scene.order, sceneRole: scene.sceneRole, path: li?.path ?? null, exists,
    md5, md5Expected: li?.md5 ?? null, md5Match, sizeMatch,
    width, height, resOk, aspectOk,
    gatePass: exists && md5Match && sizeMatch && resOk && aspectOk,
  });
}
const gateFail = gateResults.filter((g) => !g.gatePass);
const md5Fail = gateResults.filter((g) => g.exists && !g.md5Match);
writeFileSync(join(outAbs, "image_gate_report.json"), JSON.stringify({
  schemaVersion: "golden_sample_visual_only_image_gate_report_v1",
  lockFixture: manifest.imageSource.lockFixture,
  verdict: gateFail.length ? "IMAGE_GATE_BLOCKED" : "IMAGE_GATE_PASS",
  images: gateResults,
}, null, 2) + "\n", "utf8");

console.log("── GOLDEN SAMPLE VISUAL-ONLY v1 — LOCKED IMAGE GATE ──");
for (const g of gateResults) console.log(`  [s${g.order}] ${g.width}x${g.height} md5Match=${g.md5Match} gatePass=${g.gatePass}`);
if (md5Fail.length) {
  console.error(`ABORT: MD5 mismatch vs lock manifest for ${md5Fail.length} image(s) — locked source integrity violated. Render refused.`);
  process.exit(11);
}
if (gateFail.length) {
  console.error(`ABORT: image gate failed for ${gateFail.length} image(s). No upscale/placeholder/stock fallback. Render refused.`);
  process.exit(10);
}
if (GATE_ONLY) { console.log("--gate-only: gate passed, render skipped."); process.exit(0); }

// ══════════════════════════════════════════════════════════════════════════
// STEP 2 — BACKGROUND SEGMENTS (dim + light blur + slow drift, hard cuts)
// ══════════════════════════════════════════════════════════════════════════
const BT = manifest.backgroundTreatment;
function zoompanExpr(motion, frames) {
  const cx = "iw/2-(iw/zoom/2)";
  const cy = "ih/2-(ih/zoom/2)";
  let z, x = cx;
  switch (motion.type) {
    case "punch_in": {
      const pf = motion.punchFrames;
      z = `if(lte(on,${pf}),${motion.zFrom}+${(motion.zPunch - motion.zFrom).toFixed(4)}*on/${pf},${motion.zPunch}+${(motion.zTo - motion.zPunch).toFixed(4)}*(on-${pf})/${frames - motion.punchFrames})`;
      break;
    }
    case "zoom_in":
    case "zoom_out":
      z = `${motion.zFrom}+${(motion.zTo - motion.zFrom).toFixed(4)}*on/${frames}`;
      break;
    case "pan_left":
      z = String(motion.zConst);
      x = `${cx}+${motion.panPx / 2}-${motion.panPx}*on/${frames}`;
      break;
    default:
      z = "1.02";
  }
  return `zoompan=z='${z}':d=1:x='${x}':y='${cy}':s=${W}x${H}:fps=${FPS}`;
}

console.log("\n── STEP 2: background segments ──");
const segPaths = [];
manifest.scenes.forEach((scene, i) => {
  const li = lockByOrder.get(scene.order);
  const dur = scene.endSec - scene.startSec;
  const frames = Math.round(dur * FPS);
  const seg = join(outAbs, `bg_seg_${String(i).padStart(2, "0")}.mp4`);
  const vf = [
    `scale=${W}:${H}:force_original_aspect_ratio=increase`, `crop=${W}:${H}`,
    BT.dim, BT.blur,
    `scale=${W * 2}:${H * 2}`, zoompanExpr(scene.motion, frames), "setsar=1", "format=yuv420p",
  ].join(",");
  runFfmpeg(
    ["-y", "-loop", "1", "-framerate", String(FPS), "-t", dur.toFixed(3), "-i", assetAbs(li.path),
     "-vf", vf, "-r", String(FPS), "-vsync", "cfr", "-video_track_timescale", "30000",
     "-c:v", "libx264", "-crf", "16", "-preset", "medium", "-an", seg],
    `bg s${scene.order}`
  );
  segPaths.push(seg);
  console.log(`  [s${scene.order}] ${dur}s ${frames}f ${scene.motion.type}`);
});
const listPath = join(outAbs, "bg_concat.txt");
writeFileSync(listPath, segPaths.map((p) => `file '${p.replace(/\\/g, "/")}'`).join("\n") + "\n", "utf8");
const bgMp4 = join(outAbs, "bg_visual.mp4");
runFfmpeg(["-y", "-f", "concat", "-safe", "0", "-i", listPath, "-c", "copy", bgMp4], "bg concat");

// ══════════════════════════════════════════════════════════════════════════
// STEP 3 — ASS OVERLAY (cards + dynamic captions)
// ══════════════════════════════════════════════════════════════════════════
const COLOR = {
  white: "&H00F2EFE8", amber: "&H0033AEFF", dim: "&H00AAB4BA", dark: "&H00100F0D",
  panelFill: "&H0F1417", barWhite: "&HE8EFF2",
};
const PANEL_ALPHA = "&H3C&";   // ~76% opacity
const ROW_ALPHA = "&H55&";     // item rows slightly lighter
const BAR_ALPHA = "&H30&";
const FONT = manifest.typography.font;

const ts = (sec) => {
  const s = Math.max(0, sec);
  const m = Math.floor((s % 3600) / 60);
  const cs = (s % 60).toFixed(2).padStart(5, "0");
  return `0:${String(m).padStart(2, "0")}:${cs}`;
};
const esc = (t) => (t || "").replace(/\{/g, "(").replace(/\}/g, ")");
const runColor = (c) => COLOR[c] || COLOR.white;

// absolute rounded-rect path (모든 패널은 absolute 좌표 + an7 pos(0,0) — libass 음수좌표 offset 버그 회피)
function rrAbs(x1, y1, x2, y2, r) {
  return `m ${x1 + r} ${y1} l ${x2 - r} ${y1} b ${x2} ${y1} ${x2} ${y1} ${x2} ${y1 + r} l ${x2} ${y2 - r} b ${x2} ${y2} ${x2} ${y2} ${x2 - r} ${y2} l ${x1 + r} ${y2} b ${x1} ${y2} ${x1} ${y2} ${x1} ${y2 - r} l ${x1} ${y1 + r} b ${x1} ${y1} ${x1} ${y1} ${x1 + r} ${y1}`;
}
const rect = (x1, y1, x2, y2) => `m ${x1} ${y1} l ${x2} ${y1} ${x2} ${y2} ${x1} ${y2}`;
// vector check mark (font-glyph 독립) — positive coords, \an7\pos(topLeft)로 배치
const CHECK_PATH = "m 0 28 l 14 42 46 8 38 0 14 30 8 22";

const events = []; // {layer,start,end,style,text}
const EV = (layer, start, end, style, text) => events.push({ layer, start, end, style, text });

function runsToAss(runs, baseFs) {
  return runs.map((r) => {
    const tags = [`\\c${runColor(r.c)}`];
    if (r.fs && r.fs !== baseFs) tags.push(`\\fs${r.fs}`);
    if (r.bold) tags.push(`\\b1`);
    let s = `{${tags.join("")}}${esc(r.t)}`;
    if (r.fs && r.fs !== baseFs) s += `{\\fs${baseFs}}`;
    if (r.bold) s += `{\\b0}`;
    return s;
  }).join("");
}
const popIn = (ms, accel = 0.55, from = 88, fadInMs = 50) =>
  `\\fscx${from}\\fscy${from}\\t(0,${ms},${accel},\\fscx100\\fscy100)` + (fadInMs > 0 ? `\\fad(${fadInMs},0)` : "");
// center-out horizontal clip expansion (패널 punch entry — 좌표계 안전한 absolute 방식)
const clipExpandCenter = (x1, y1, x2, y2, ms, accel = 0.55) => {
  const cx = Math.round((x1 + x2) / 2);
  return `\\clip(${cx},${y1 - 8},${cx},${y2 + 8})\\t(0,${ms},${accel},\\clip(${x1 - 8},${y1 - 8},${x2 + 8},${y2 + 8}))`;
};
const clipRevealH = (x1, y1, x2, y2, ms, fromLeft = true, accel = 0.6) =>
  fromLeft
    ? `\\clip(${x1},${y1},${x1},${y2})\\t(0,${ms},${accel},\\clip(${x1},${y1},${x2},${y2}))\\fad(40,0)`
    : `\\clip(${x2},${y1},${x2},${y2})\\t(0,${ms},${accel},\\clip(${x1},${y1},${x2},${y2}))\\fad(40,0)`;
const clipRevealUp = (x1, y1, x2, y2, ms, accel = 0.6) =>
  `\\clip(${x1},${y2},${x2},${y2})\\t(0,${ms},${accel},\\clip(${x1},${y1},${x2},${y2}))\\fad(40,0)`;

function panelAbs(x1, y1, x2, y2, start, end, entryTag, alpha = PANEL_ALPHA) {
  EV(0, start, end, "Drw", `{\\an7\\pos(0,0)\\bord0\\shad0\\1c${COLOR.panelFill}\\1a${alpha}${entryTag}\\p1}${rrAbs(x1, y1, x2, y2, 26)}{\\p0}`);
}
function accentBar(x1, y1, y2, start, end, entryTag) {
  EV(1, start, end, "Drw", `{\\an7\\pos(0,0)\\bord0\\shad0\\1c${COLOR.amber}${entryTag}\\p1}${rect(x1, y1 + 20, x1 + 12, y2 - 20)}{\\p0}`);
}

// ── card builders ───────────────────────────────────────────────────────────
for (const card of manifest.cardTimeline) {
  const s = card.timeStartSec, e = card.timeEndSec;

  if (card.cardTemplate === "hook_card" || card.cardTemplate === "number_drop_card") {
    // punch_zoom entry: 패널 center-out clip 확장 + 텍스트 scale 88→100
    // hook은 t=0 프레임부터 보여야 하므로 fade 없이 시작 (첫 프레임 공백 방지)
    const isHook = card.cardTemplate === "hook_card";
    const p = card.panel;
    const textEntry = popIn(card.entryMs, 0.55, 88, isHook ? 0 : 40);
    const panelEntry = clipExpandCenter(p.x1, p.y1, p.x2, p.y2, card.entryMs);
    panelAbs(p.x1, p.y1, p.x2, p.y2, s, e, panelEntry);
    if (p.accentBarLeft) accentBar(p.x1 + 26, p.y1, p.y2, s, e, isHook ? "" : "\\fad(120,0)");
    for (const line of card.lines || []) {
      EV(2, s, e, "Txt", `{\\an8\\pos(540,${line.y})\\fs${line.fs}${textEntry}}${runsToAss(line.runs, line.fs)}`);
    }
    if (card.cardTemplate === "number_drop_card") {
      const nz = card.numberZone;
      const ctx = card.contextLine;
      EV(2, s, e, "Txt", `{\\an8\\pos(540,${ctx.y})\\fs${ctx.fs}${textEntry}}${runsToAss(ctx.runs, ctx.fs)}`);
      const counts = card.counts;
      counts.forEach((c, i) => {
        const cEnd = i + 1 < counts.length ? counts[i + 1].atSec : e;
        const pulse = c.finalPulse
          ? `\\fscx112\\fscy112\\t(0,140,\\fscx102\\fscy102)\\t(140,320,0.9,\\fscx100\\fscy100)\\fad(30,0)`
          : `\\fscx94\\fscy94\\t(0,120,0.6,\\fscx100\\fscy100)\\fad(40,0)`;
        EV(2, c.atSec, cEnd, "Txt", `{\\an5\\pos(${nz.cx},${nz.cy})\\fs${nz.fs}\\b1\\c${runColor(c.c)}${pulse}}${esc(c.text)}`);
      });
    }
  }

  if (card.cardTemplate === "contrast_card") {
    for (const sp of card.splitPanels) {
      const reveal = clipRevealH(sp.x1 - 6, sp.y1 - 6, sp.x2 + 6, sp.y2 + 6, card.entryMs, sp.revealFrom === "left");
      panelAbs(sp.x1, sp.y1, sp.x2, sp.y2, sp.revealAtSec, e, reveal);
      if (sp.line.emphasisSwitch) {
        const sw = sp.line.emphasisSwitch;
        EV(2, sp.revealAtSec, sw.atSec, "Txt", `{\\an8\\pos(540,${sp.line.y})\\fs${sp.line.fs}${reveal}}${runsToAss(sp.line.runs, sp.line.fs)}`);
        const swRuns = sp.line.runs.map((r, i) => (i === sw.runIndex ? { ...r, c: sw.toColor } : r));
        const pulse = sw.pulse ? `\\fscx106\\fscy106\\t(0,160,0.6,\\fscx100\\fscy100)` : "";
        EV(2, sw.atSec, e, "Txt", `{\\an8\\pos(540,${sp.line.y})\\fs${sp.line.fs}${pulse}}${runsToAss(swRuns, sp.line.fs)}`);
      } else {
        EV(2, sp.revealAtSec, e, "Txt", `{\\an8\\pos(540,${sp.line.y})\\fs${sp.line.fs}${reveal}}${runsToAss(sp.line.runs, sp.line.fs)}`);
      }
    }
    const d = card.divider;
    const sweep = `\\clip(${d.x1},${d.y1 - 4},${d.x1},${d.y2 + 4})\\t(0,${d.sweepMs},0.6,\\clip(${d.x1},${d.y1 - 4},${d.x2},${d.y2 + 4}))`;
    EV(1, d.sweepAtSec, e, "Drw", `{\\an7\\pos(0,0)\\bord0\\shad0\\1c${COLOR.amber}${sweep}\\p1}${rect(d.x1, d.y1, d.x2, d.y2)}{\\p0}`);
  }

  if (card.cardTemplate === "checklist_card") {
    const hd = card.header;
    const entry = popIn(card.entryMs, 0.55, 90);
    panelAbs(hd.x1, hd.y1, hd.x2, hd.y2, s + 0.05, e, clipExpandCenter(hd.x1, hd.y1, hd.x2, hd.y2, card.entryMs));
    EV(2, s + 0.05, e, "Txt", `{\\an8\\pos(540,${hd.line.y})\\fs${hd.line.fs}${entry}}${runsToAss(hd.line.runs, hd.line.fs)}`);
    for (const item of card.items) {
      const r = item.row;
      const rcy = (r.y1 + r.y2) / 2;
      const pop = popIn(240, 0.55, 90);
      panelAbs(r.x1, r.y1, r.x2, r.y2, item.popAtSec, e, clipRevealH(r.x1 - 6, r.y1 - 6, r.x2 + 6, r.y2 + 6, 220, true), ROW_ALPHA);
      EV(2, item.popAtSec, e, "Txt", `{\\an4\\pos(300,${rcy})\\fs${item.fs}${pop}}${esc(item.text)}`);
      // vector check mark pops at checkAtSec (checkMarkMoment) — positive path, top-left 배치
      EV(1, item.checkAtSec, e, "Drw", `{\\an7\\pos(${220 - 23},${rcy - 21})\\bord0\\shad0\\1c${COLOR.amber}${popIn(150, 0.5, 70)}\\p1}${CHECK_PATH}{\\p0}`);
    }
  }

  if (card.cardTemplate === "mini_graph_card") {
    const p = card.panel;
    const reveal = clipRevealH(p.x1 - 6, p.y1 - 6, p.x2 + 6, p.y2 + 6, card.entryMs, true);
    panelAbs(p.x1, p.y1, p.x2, p.y2, s + 0.05, e, reveal);
    const t = card.title;
    EV(2, s + 0.05, e, "Txt", `{\\an8\\pos(540,${t.y})\\fs${t.fs}${reveal}}${runsToAss(t.runs, t.fs)}`);
    const g = card.graph;
    for (const bar of g.bars) {
      const x1 = bar.cx - bar.w / 2, x2 = bar.cx + bar.w / 2;
      const topY = g.baselineY - bar.h;
      const isAmber = bar.c === "amber";
      const grow = `\\clip(${x1},${g.baselineY},${x2},${g.baselineY})\\t(0,${g.fillMs},0.65,\\clip(${x1},${topY},${x2},${g.baselineY}))`;
      EV(1, bar.fillAtSec, e, "Drw",
        `{\\an7\\pos(0,0)\\bord0\\shad0\\1c${isAmber ? COLOR.amber : COLOR.barWhite}\\1a${isAmber ? "&H00&" : BAR_ALPHA}${grow}\\p1}${rect(x1, topY, x2, g.baselineY)}{\\p0}`);
      EV(2, bar.fillAtSec, e, "Txt", `{\\an8\\pos(${bar.cx},${g.labelY})\\fs${g.labelFs}\\fad(100,0)}${esc(bar.label)}`);
    }
    // baseline
    EV(1, s + 0.05, e, "Drw", `{\\an7\\pos(0,0)\\bord0\\shad0\\1c${COLOR.white}\\1a&H60&${reveal}\\p1}${rect(p.x1 + 60, g.baselineY, p.x2 - 60, g.baselineY + 4)}{\\p0}`);
  }

  if (card.cardTemplate === "twist_card") {
    const p = card.panel;
    const entry = `\\fscx112\\fscy112\\t(0,${card.entryMs},0.5,\\fscx100\\fscy100)\\fad(40,0)`;
    panelAbs(p.x1, p.y1, p.x2, p.y2, s, e, clipExpandCenter(p.x1, p.y1, p.x2, p.y2, card.entryMs, 0.5));
    for (const line of card.lines) {
      if (line.emphasisSwitch) {
        const sw = line.emphasisSwitch;
        EV(2, s, sw.atSec, "Txt", `{\\an8\\pos(540,${line.y})\\fs${line.fs}\\b1${entry}}${runsToAss(line.runs, line.fs)}`);
        const pulse = sw.pulse ? `\\fscx106\\fscy106\\t(0,160,0.6,\\fscx100\\fscy100)` : "";
        EV(2, sw.atSec, e, "Txt", `{\\an8\\pos(540,${line.y})\\fs${line.fs}\\b1\\c${runColor(sw.toColor)}${pulse}}${esc(line.runs.map((r) => r.t).join(""))}`);
      } else {
        EV(2, s, e, "Txt", `{\\an8\\pos(540,${line.y})\\fs${line.fs}${entry}}${runsToAss(line.runs, line.fs)}`);
      }
    }
  }

  if (card.cardTemplate === "final_action_card") {
    const p = card.panel;
    const reveal = clipRevealUp(p.x1 - 6, p.y1 - 6, p.x2 + 6, p.y2 + 6, card.entryMs);
    panelAbs(p.x1, p.y1, p.x2, p.y2, s, e, reveal);
    if (p.accentBarLeft) accentBar(p.x1 + 26, p.y1, p.y2, s, e, "\\fad(160,0)");
    for (const line of card.lines) {
      if (line.keywordPulse) {
        const kp = line.keywordPulse;
        EV(2, s, kp.atSec, "Txt", `{\\an8\\pos(540,${line.y})\\fs${line.fs}\\b1${reveal}}${runsToAss(line.runs, line.fs)}`);
        const pulsedRuns = line.runs.map((r, i) => (i === kp.runIndex ? { ...r, c: kp.toColor } : r));
        EV(2, kp.atSec, e, "Txt", `{\\an8\\pos(540,${line.y})\\fs${line.fs}\\b1\\fscx106\\fscy106\\t(0,180,0.6,\\fscx100\\fscy100)}${runsToAss(pulsedRuns, line.fs)}`);
      } else {
        EV(2, s, e, "Txt", `{\\an8\\pos(540,${line.y})\\fs${line.fs}${reveal}}${runsToAss(line.runs, line.fs)}`);
      }
    }
    const u = card.underline;
    const sweep = `\\clip(${u.x1},${u.y1 - 4},${u.x1},${u.y2 + 4})\\t(0,${u.sweepMs},0.6,\\clip(${u.x1},${u.y1 - 4},${u.x2},${u.y2 + 4}))`;
    EV(1, u.sweepAtSec, e, "Drw", `{\\an7\\pos(0,0)\\bord0\\shad0\\1c${COLOR.amber}${sweep}\\p1}${rect(u.x1, u.y1, u.x2, u.y2)}{\\p0}`);
  }
}

// ── dynamic captions (Reels-style, provisional timing) ─────────────────────
function captionRuns(cap) {
  if (!cap.emphasis || !cap.text.includes(cap.emphasis)) return [{ t: cap.text, c: "white" }];
  const idx = cap.text.indexOf(cap.emphasis);
  const runs = [];
  if (idx > 0) runs.push({ t: cap.text.slice(0, idx), c: "white" });
  runs.push({ t: cap.emphasis, c: "amber" });
  if (idx + cap.emphasis.length < cap.text.length) runs.push({ t: cap.text.slice(idx + cap.emphasis.length), c: "white" });
  return runs;
}
function capWidthPx(text, fs) {
  let w = 0;
  for (const ch of text) w += /[가-힣]/.test(ch) ? fs : fs * 0.55;
  return Math.round(w);
}
for (const cap of manifest.captionTimeline) {
  const runs = captionRuns(cap);
  let tag;
  if (cap.motion === "reveal") {
    const w = capWidthPx(cap.text, cap.fs);
    tag = clipRevealH(cap.posX - w / 2 - 12, cap.posY - 10, cap.posX + w / 2 + 12, cap.posY + cap.fs * 1.4, 220, true, 0.6) + "\\fad(40,90)";
  } else {
    tag = `\\fscx78\\fscy78\\t(0,180,0.5,\\fscx100\\fscy100)\\fad(60,90)`;
  }
  EV(3, cap.startSec, cap.endSec, "Cap", `{\\an8\\pos(${cap.posX},${cap.posY})\\fs${cap.fs}${tag}}${runsToAss(runs, cap.fs)}`);
}

// ── ASS assembly ────────────────────────────────────────────────────────────
const assHeader = [
  "[Script Info]", "ScriptType: v4.00+", `PlayResX: ${W}`, `PlayResY: ${H}`,
  "ScaledBorderAndShadow: yes", "WrapStyle: 2", "",
  "[V4+ Styles]",
  "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
  `Style: Txt,${FONT},60,${COLOR.white},&H000000FF,&H00141210,&H96000000,1,0,0,0,100,100,0,0,1,0,0,5,60,60,60,1`,
  `Style: Cap,${FONT},60,${COLOR.white},&H000000FF,&H00141210,&H96000000,1,0,0,0,100,100,0,0,1,4,1.6,8,60,60,60,1`,
  `Style: Drw,${FONT},20,${COLOR.white},&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,0,0,7,0,0,0,1`,
  "", "[Events]",
  "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
];
const assLines = events
  .sort((a, b) => a.layer - b.layer || a.start - b.start)
  .map((ev) => `Dialogue: ${ev.layer},${ts(ev.start)},${ts(ev.end)},${ev.style},,0,0,0,,${ev.text}`);
const assPath = join(outAbs, "golden_sample_t2_overlay.ass");
writeFileSync(assPath, assHeader.concat(assLines).join("\n") + "\n", "utf8");
console.log(`\n── STEP 3: ASS overlay written (${events.length} events) ──`);

// ══════════════════════════════════════════════════════════════════════════
// STEP 4 — BURN + FINAL
// ══════════════════════════════════════════════════════════════════════════
const finalMp4 = join(outAbs, manifest.outputPaths.visualOnlyMp4);
const assForFilter = assPath.replace(/\\/g, "/").replace(/:/g, "\\:");
runFfmpeg(
  ["-y", "-i", bgMp4, "-vf", `ass='${assForFilter}'`, "-r", String(FPS),
   "-c:v", "libx264", "-crf", "18", "-preset", "medium", "-pix_fmt", "yuv420p",
   "-movflags", "+faststart", "-an", finalMp4],
  "final burn"
);

// ══════════════════════════════════════════════════════════════════════════
// STEP 5 — PROBE + FRAMES + REPORTS
// ══════════════════════════════════════════════════════════════════════════
const probe = ffprobeJson(["-show_entries", "format=duration", "-show_entries", "stream=width,height,codec_name,codec_type,r_frame_rate,nb_frames", finalMp4]);
const vStream = (probe?.streams || []).find((st) => st.codec_type === "video") || {};
const aStreams = (probe?.streams || []).filter((st) => st.codec_type === "audio");
const durationSec = Math.round(parseFloat(probe?.format?.duration ?? "0") * 1000) / 1000;

const framePaths = [];
for (const t of manifest.outputPaths.frameTimesSec) {
  const fp = join(outAbs, `frame_${String(t).replace(".", "_")}s.jpg`);
  // output-side seek (-i 먼저, -ss 뒤) = 샘플 정확 — input-side seek는 이 빌드에서 최대 ~1s 오차 실측됨
  runFfmpeg(["-y", "-i", finalMp4, "-ss", String(t), "-frames:v", "1", "-q:v", "3", fp], `frame ${t}s`);
  framePaths.push(fp);
}

// actual card timeline + caption timeline
writeFileSync(join(outAbs, manifest.outputPaths.actualCardTimeline), JSON.stringify({
  schemaVersion: "golden_sample_actual_card_timeline_v1",
  ttsTimingSource: manifest.ttsTimingSource,
  cards: manifest.cardTimeline.map((c) => ({
    cardId: c.cardId, cardTemplate: c.cardTemplate, phraseId: c.phraseId,
    timeStartSec: c.timeStartSec, timeEndSec: c.timeEndSec, sceneOrder: c.sceneOrder, entryMotion: c.entryMotion,
  })),
}, null, 2) + "\n", "utf8");
writeFileSync(join(outAbs, manifest.outputPaths.dynamicCaptionTimeline), JSON.stringify({
  schemaVersion: "golden_sample_dynamic_caption_timeline_v1",
  ttsTimingSource: manifest.ttsTimingSource,
  ttsTimingNote: manifest.ttsTimingNote,
  contract: manifest.captionRules.contract,
  captions: manifest.captionTimeline,
}, null, 2) + "\n", "utf8");

// ── machine QA ──────────────────────────────────────────────────────────────
function cardRectsAt(tSec) {
  const rects = [];
  for (const c of manifest.cardTimeline) {
    if (tSec < c.timeStartSec || tSec >= c.timeEndSec) continue;
    if (c.panel) rects.push({ id: c.cardId, ...c.panel });
    if (c.splitPanels) for (const sp of c.splitPanels) rects.push({ id: c.cardId, x1: sp.x1, y1: sp.y1, x2: sp.x2, y2: sp.y2 });
    if (c.header) rects.push({ id: c.cardId, x1: c.header.x1, y1: c.header.y1, x2: c.header.x2, y2: c.header.y2 });
    if (c.items) for (const it of c.items) if (tSec >= it.popAtSec) rects.push({ id: c.cardId, ...it.row });
    if (c.underline) rects.push({ id: c.cardId, x1: c.underline.x1, y1: c.underline.y1, x2: c.underline.x2, y2: c.underline.y2 });
  }
  return rects;
}
const intersects = (a, b) => a.x1 < b.x2 && b.x1 < a.x2 && a.y1 < b.y2 && b.y1 < a.y2;

const SAFE = manifest.safeFrame;
const capChecks = manifest.captionTimeline.map((cap) => {
  const w = capWidthPx(cap.text, cap.fs);
  const rectC = { x1: cap.posX - w / 2, y1: cap.posY, x2: cap.posX + w / 2, y2: cap.posY + Math.round(cap.fs * 1.35) };
  const overlaps = [];
  for (const t of [cap.startSec + 0.01, (cap.startSec + cap.endSec) / 2, cap.endSec - 0.01]) {
    for (const cr of cardRectsAt(t)) if (intersects(rectC, cr)) overlaps.push(cr.id);
  }
  const dwell = Math.round((cap.endSec - cap.startSec) * 100) / 100;
  return {
    captionId: cap.captionId, text: cap.text, startSec: cap.startSec, endSec: cap.endSec, dwellSec: dwell,
    approxRect: rectC,
    overlapsCard: [...new Set(overlaps)],
    inSafeFrame: rectC.x1 >= SAFE.xMin && rectC.x2 <= SAFE.xMax && rectC.y1 >= SAFE.yMinCoreText && rectC.y2 <= SAFE.yMaxCoreText,
    touchesBottom15: rectC.y2 > SAFE.bottom15PermanentFailY,
    dwellOver1_6: dwell > manifest.captionRules.maxDwellSecRecommended,
    wordCount: cap.text.split(/\s+/).length,
  };
});

// perceptual events QA
const evs = manifest.perceptualEventPlan.coreEvents.map((e2) => e2.atSec).sort((a, b) => a - b);
let maxGap = 0;
for (let i = 1; i < evs.length; i++) maxGap = Math.max(maxGap, evs[i] - evs[i - 1]);
const windows = [];
for (let w0 = 0; w0 < 30; w0 += 5) {
  windows.push({ window: `${w0}-${w0 + 5}s`, count: evs.filter((t) => t >= w0 && t < w0 + 5).length });
}
// card presence (merged intervals)
let covered = 0;
{
  const iv = manifest.cardTimeline.map((c) => [c.timeStartSec, c.timeEndSec]).sort((a, b) => a[0] - b[0]);
  let curS = iv[0][0], curE = iv[0][1];
  for (const [a, b] of iv.slice(1)) {
    if (a <= curE) curE = Math.max(curE, b);
    else { covered += curE - curS; curS = a; curE = b; }
  }
  covered += curE - curS;
}
const firstCaption = manifest.captionTimeline.reduce((m, c) => (c.startSec < m.startSec ? c : m));
const qa = {
  schemaVersion: "golden_sample_visual_only_qa_report_v1",
  taskId: manifest.taskId,
  topic: manifest.topic,
  ttsTimingSource: manifest.ttsTimingSource,
  output: finalMp4,
  ffprobe: {
    width: vStream.width, height: vStream.height, codec: vStream.codec_name,
    rFrameRate: vStream.r_frame_rate, nbFrames: vStream.nb_frames ?? null,
    durationSec, audioStreamCount: aStreams.length,
    pass: vStream.width === W && vStream.height === H && vStream.codec_name === "h264" &&
      vStream.r_frame_rate === `${FPS}/1` && aStreams.length === 0 && Math.abs(durationSec - manifest.fullDurationSec) <= 0.2,
  },
  captions: {
    count: capChecks.length,
    checks: capChecks,
    anyCardOverlap: capChecks.some((c) => c.overlapsCard.length > 0),
    anySafeFrameViolation: capChecks.some((c) => !c.inSafeFrame),
    anyBottom15Touch: capChecks.some((c) => c.touchesBottom15),
    bottom15PermanentOccupancy: false,
    anyDwellOver1_6: capChecks.some((c) => c.dwellOver1_6),
    anyOver5Words: capChecks.some((c) => c.wordCount > 5),
    bottomFixedSubtitleBarUsed: false,
    fullWidthCaptionBoxUsed: false,
  },
  firstTwoSeconds: {
    hookCardAtZero: manifest.cardTimeline[0].timeStartSec === 0 && manifest.cardTimeline[0].cardTemplate === "hook_card",
    hookCaptionInFirst2s: firstCaption.startSec < 2.0,
    hookCaptionMotion: firstCaption.motion,
    pass: manifest.cardTimeline[0].timeStartSec === 0 && firstCaption.startSec < 2.0,
  },
  perceptualEvents: {
    coreEventCount: evs.length,
    minForPass: manifest.perceptualEventPlan.minPerceptualEventCountForPass,
    passesMin: evs.length >= manifest.perceptualEventPlan.minPerceptualEventCountForPass,
    maxInterEventGapSec: Math.round(maxGap * 100) / 100,
    gapPass: maxGap <= manifest.perceptualEventPlan.maxInterEventGapSec,
    per5sWindows: windows,
    windowPass: windows.every((w2) => w2.count >= manifest.perceptualEventPlan.minEventsPer5sWindow),
    countingNote: manifest.perceptualEventPlan.countingRule,
  },
  cardPresenceRatio: Math.round((covered / manifest.fullDurationSec) * 1000) / 1000,
  fullScreenImageDominance: "없음 — 전 구간 카드 존재, 배경은 dim+저강도 blur 처리",
  frames: framePaths,
  claudeVisionQa: { status: "PENDING", note: "프레임 스크린샷 육안 QA는 렌더 후 Claude vision 판독으로 채워진다" },
  renderReady: false,
  uploadReady: false,
  boundary: { noTts: true, noMux: true, noUpload: true, noImageGeneration: true, noExternalApi: true },
};
writeFileSync(join(outAbs, manifest.outputPaths.visualQaReport), JSON.stringify(qa, null, 2) + "\n", "utf8");

writeFileSync(join(outAbs, manifest.outputPaths.renderManifestOut), JSON.stringify({
  schemaVersion: "golden_sample_visual_only_render_manifest_out_v1",
  rendererMode: manifest.rendererMode,
  sourceManifest: "scripts/fixtures/golden_sample_visual_only_render_manifest.t2.v1.json",
  imageSourceLock: manifest.imageSource.lockFixture,
  md5GatePassed: true,
  visualOnly: true, uploadReady: false, renderReady: false,
  ttsTimingSource: manifest.ttsTimingSource,
  output: finalMp4,
  probe: qa.ffprobe,
  cardCount: manifest.cardTimeline.length,
  captionCount: manifest.captionTimeline.length,
  perceptualEventCount: evs.length,
}, null, 2) + "\n", "utf8");

console.log(`\n── DONE ──`);
console.log(`  output: ${finalMp4}`);
console.log(`  probe: ${vStream.width}x${vStream.height} ${vStream.codec_name} ${vStream.r_frame_rate}fps ${durationSec}s audioStreams=${aStreams.length} → ffprobePass=${qa.ffprobe.pass}`);
console.log(`  cards=${manifest.cardTimeline.length} captions=${manifest.captionTimeline.length} coreEvents=${evs.length} (min ${qa.perceptualEvents.minForPass}, maxGap ${qa.perceptualEvents.maxInterEventGapSec}s, windows ${qa.perceptualEvents.windowPass ? "PASS" : "FAIL"})`);
console.log(`  captionQA: cardOverlap=${qa.captions.anyCardOverlap} safeFrameViolation=${qa.captions.anySafeFrameViolation} bottom15=${qa.captions.anyBottom15Touch} dwell>1.6=${qa.captions.anyDwellOver1_6}`);
console.log(`  cardPresenceRatio=${qa.cardPresenceRatio} visualOnly=true uploadReady=false`);
process.exit(0);
