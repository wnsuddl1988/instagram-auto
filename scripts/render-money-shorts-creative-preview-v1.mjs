#!/usr/bin/env node
// ──────────────────────────────────────────────────────────────────────────
// render-money-shorts-creative-preview-v1.mjs
//
// MONEY SHORTS OS — CREATIVE PREVIEW RENDERER v1 (local ffmpeg only, dev preview)
//
// preview manifest를 읽어 12초 preview_before.mp4 / preview_after.mp4를 C:\tmp에
// 렌더한다. 실제 selected image PNG를 사용한다(단색 placeholder 금지).
//
// - before: 정적 baseline (긴 hold, motion 없음)
// - after : Creative Event Plan (12초 event subset, zoompan/crop motion + caption)
// - audio : 렌더하지 않음(silent). sfx plan은 report에만 기록.
//
// 절대 하지 않는 것:
//   - 외부 API / OpenAI / ChatGPT / Playwright / ElevenLabs / network / env / secret
//   - image generation / TTS generation / upload / publish / deploy
//   - 기존 final video / source fixtures 수정
//   - ffmpeg color=c= placeholder 단색 카드 생성
//
// ffmpeg/ffprobe는 spawnSync(args array, shell:false)로만 사용. C:\tmp 아래에만 write.
// ──────────────────────────────────────────────────────────────────────────

import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve, isAbsolute } from "node:path";
import { spawnSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const MANIFEST_PATH = join(__dirname, "fixtures", "money-shorts-creative-preview-render-manifest.v1.json");

const manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
const W = manifest.canvas.widthPx; // 1080
const H = manifest.canvas.heightPx; // 1920
const PREVIEW_SEC = manifest.previewDurationSec; // 12
const OUT_DIR = manifest.outputPaths.outDir;
const MARGIN_V = manifest.captionPlan.recommendedCaptionMarginV; // 340

// ── out-dir guard: must be under C:\tmp and outside repo ─────────────────────
const outAbs = resolve(OUT_DIR);
if (!/^C:\\+tmp\\+/i.test(OUT_DIR)) {
  console.error(`ABORT: out-dir must be under C:\\tmp. got: ${OUT_DIR}`);
  process.exit(2);
}
if (outAbs === REPO_ROOT || outAbs.startsWith(REPO_ROOT + "\\") || outAbs.startsWith(REPO_ROOT + "/")) {
  console.error(`ABORT: out-dir must be OUTSIDE repo root.`);
  process.exit(2);
}
mkdirSync(outAbs, { recursive: true });

// ── resolve + verify actual image assets exist (NO placeholder) ──────────────
function assetAbs(repoRel) {
  return isAbsolute(repoRel) ? repoRel : join(REPO_ROOT, repoRel);
}
const imageExistence = [];
for (const img of manifest.actualImageInputs) {
  const abs = assetAbs(img.imagePath);
  const exists = existsSync(abs);
  const size = exists ? statSync(abs).size : 0;
  imageExistence.push({ sourceImageKey: img.sourceImageKey, imagePath: img.imagePath, exists, size });
  if (!exists) {
    console.error(`ABORT: selected image asset missing: ${img.imagePath}`);
    process.exit(3);
  }
}
const usedActualSelectedImages = imageExistence.every((i) => i.exists && i.size > 0);

// ── ffmpeg helpers (spawnSync array, shell:false) ────────────────────────────
function runFfmpeg(args, label) {
  const r = spawnSync("ffmpeg", args, { shell: false, encoding: "utf8", timeout: 120000 });
  if (r.status !== 0) {
    console.error(`ffmpeg ${label} failed (exit ${r.status}):\n${(r.stderr || "").slice(-1200)}`);
    process.exit(4);
  }
  return r;
}
function ffprobe(path) {
  const r = spawnSync(
    "ffprobe",
    ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height,codec_name", "-show_entries", "format=duration", "-of", "json", path],
    { shell: false, encoding: "utf8", timeout: 60000 }
  );
  if (r.status !== 0) { console.error(`ffprobe failed: ${r.stderr}`); process.exit(4); }
  return JSON.parse(r.stdout);
}

// ── motion filter per template (zoompan/crop based, real movement) ───────────
// each clip: image scaled to cover 1080x1920, then a motion applied over its duration.
function motionFilter(template, durSec, fps) {
  const frames = Math.max(1, Math.round(durSec * fps));
  // base: scale to cover + setsar. Upscale before zoompan for crisp motion.
  const cover = `scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H}`;
  const big = `${cover},scale=${W * 4}:${H * 4}`;
  // zoompan with d=1: exactly ONE output frame per input frame. Combined with an input
  // of `-loop 1 -t durSec -r fps` (= frames input frames), total output = frames = durSec.
  // Motion is driven by frame index `on` (0..frames-1) instead of zoompan's internal d ramp,
  // so clip duration stays exactly durSec (fixes the d=frames duration-multiplication bug).
  const zp = (zExpr, xExpr, yExpr) =>
    `${big},zoompan=z='${zExpr}':d=1:x='${xExpr}':y='${yExpr}':s=${W}x${H}:fps=${fps},setsar=1`;
  const cx = "iw/2-(iw/zoom/2)";
  const cy = "ih/2-(ih/zoom/2)";
  const N = frames;
  switch (template) {
    case "push_in":
    case "number_countup":
    case "red_box":
    case "checklist_pop":
    case "final_card":
    case "arrow_reveal":
      return zp(`1.0+0.12*on/${N}`, cx, cy); // slow push in
    case "freeze_punch":
      return zp(`1.0+0.18*on/${N}`, cx, cy); // stronger punch
    case "pull_out":
      return zp(`1.15-0.15*on/${N}`, cx, cy); // reverse zoom
    case "pan_left":
      return zp("1.12", `(iw-iw/zoom)*(1-on/${N})`, cy);
    case "pan_right":
      return zp("1.12", `(iw-iw/zoom)*(on/${N})`, cy);
    default:
      return zp(`1.0+0.1*on/${N}`, cx, cy); // fallback: gentle push_in
  }
}

const FPS = 30;

// render one clip (image + motion) → temp mp4.
// Input framerate is pinned with `-r FPS` BEFORE `-i` so the looped still produces exactly
// durSec*FPS input frames; zoompan d=1 then yields exactly durSec*FPS output frames.
// -vsync cfr + -video_track_timescale keep concat clip durations exact (fixes short total).
function renderClip(imagePath, template, durSec, outPath) {
  const abs = assetAbs(imagePath);
  const vf = motionFilter(template, durSec, FPS);
  runFfmpeg(
    ["-y", "-loop", "1", "-framerate", String(FPS), "-t", String(durSec), "-i", abs,
     "-vf", vf, "-r", String(FPS), "-vsync", "cfr", "-video_track_timescale", "30000",
     "-c:v", "libx264", "-pix_fmt", "yuv420p", "-an", outPath],
    `clip ${template}`
  );
}

// concat clips via concat demuxer
function concatClips(clipPaths, outPath) {
  const listPath = join(outAbs, "concat_" + (outPath.includes("before") ? "before" : "after") + ".txt");
  const listBody = clipPaths.map((p) => `file '${p.replace(/\\/g, "/")}'`).join("\n") + "\n";
  writeFileSync(listPath, listBody, "utf8");
  runFfmpeg(["-y", "-f", "concat", "-safe", "0", "-i", listPath, "-c", "copy", outPath], "concat");
  return listPath;
}

// escape caption text for ASS
function assEscape(t) {
  return (t || "").replace(/\\/g, "\\\\").replace(/\n/g, " ").replace(/\{/g, "(").replace(/\}/g, ")");
}

// build an ASS subtitle file for AFTER (one-line captions, safe-frame marginV)
function buildAssForAfter(events) {
  const header = [
    "[Script Info]",
    "ScriptType: v4.00+",
    `PlayResX: ${W}`,
    `PlayResY: ${H}`,
    "",
    "[V4+ Styles]",
    "Format: Name, Fontname, Fontsize, PrimaryColour, OutlineColour, BackColour, Bold, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
    `Style: Default,Arial,72,&H00FFFFFF,&H00000000,&H00000000,1,6,3,2,60,60,${MARGIN_V},1`,
    "",
    "[Events]",
    "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
  ];
  const toTs = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = (s % 60).toFixed(2).padStart(5, "0");
    return `${h}:${String(m).padStart(2, "0")}:${sec}`;
  };
  const lines = events
    .filter((e) => e.caption)
    .map((e) => `Dialogue: 0,${toTs(e.time_start)},${toTs(e.time_end)},Default,,0,0,0,,${assEscape(e.caption)}`);
  return header.concat(lines).join("\n") + "\n";
}

// caption two-line detection (single-line policy): flag if any caption would wrap.
// heuristic: >18 Korean chars at fontsize 72 in a 1080-wide, 60px-margin box risks 2 lines.
const captionsTruncated = [];
function captionOneLineOk(events) {
  const MAX = 18;
  let allOk = true;
  for (const e of events) {
    if (!e.caption) continue;
    const chars = e.caption.replace(/\s/g, "").length;
    if (chars > MAX) { allOk = false; captionsTruncated.push({ event_id: e.event_id, chars }); }
  }
  return allOk;
}

// ── RENDER BEFORE (static baseline) ──────────────────────────────────────────
const beforeClips = [];
manifest.beforeTimeline.forEach((seg, i) => {
  const clip = join(outAbs, `before_clip_${i}.mp4`);
  // baseline: NO motion — a still hold (uses actual image, NOT a color placeholder)
  const abs = assetAbs(seg.imagePath);
  runFfmpeg(
    ["-y", "-loop", "1", "-framerate", String(FPS), "-t", String(seg.duration), "-i", abs,
     "-vf", `scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},setsar=1`,
     "-r", String(FPS), "-vsync", "cfr", "-video_track_timescale", "30000",
     "-c:v", "libx264", "-pix_fmt", "yuv420p", "-an", clip],
    "before still"
  );
  beforeClips.push(clip);
});
const beforeMp4 = manifest.outputPaths.beforeMp4;
concatClips(beforeClips, beforeMp4);

// ── RENDER AFTER (event plan with motion + captions) ─────────────────────────
const afterClips = [];
manifest.afterEventTimeline.forEach((ev, i) => {
  const clip = join(outAbs, `after_clip_${i}.mp4`);
  renderClip(ev.imagePath, ev.motion_template, Math.max(0.2, ev.duration), clip);
  afterClips.push(clip);
});
const afterConcat = join(outAbs, "after_noscap.mp4");
concatClips(afterClips, afterConcat);

// burn captions (ASS) into after
const captionsOneLine = captionOneLineOk(manifest.afterEventTimeline);
const assPath = join(outAbs, "after_captions.ass");
writeFileSync(assPath, buildAssForAfter(manifest.afterEventTimeline), "utf8");
const afterMp4 = manifest.outputPaths.afterMp4;
const assForFilter = assPath.replace(/\\/g, "/").replace(/:/g, "\\:");
runFfmpeg(
  ["-y", "-i", afterConcat, "-vf", `ass='${assForFilter}'`, "-r", String(FPS),
   "-c:v", "libx264", "-pix_fmt", "yuv420p", "-an", afterMp4],
  "after captions burn"
);

// ── probe both outputs ───────────────────────────────────────────────────────
function summarize(path) {
  const p = ffprobe(path);
  const st = p.streams[0] || {};
  return { width: st.width, height: st.height, codec: st.codec_name, durationSec: Math.round(parseFloat(p.format.duration) * 100) / 100 };
}
const beforeProbe = summarize(beforeMp4);
const afterProbe = summarize(afterMp4);

// ── metrics ──────────────────────────────────────────────────────────────────
const beforeEventCount = manifest.beforeTimeline.length;
const afterEventCount = manifest.afterEventTimeline.length;
const beforeMaxStatic = Math.max(...manifest.beforeTimeline.map((e) => e.duration));
const afterMaxStatic = Math.max(...manifest.afterEventTimeline.map((e) => e.duration));
const afterFirst5s = manifest.afterEventTimeline.filter((e) => e.time_start < 5).length;
const beforeMotionVariety = new Set(manifest.beforeTimeline.map((e) => e.motion_template)).size;
const afterMotionVariety = new Set(manifest.afterEventTimeline.map((e) => e.motion_template)).size;
const sfxPlanned = manifest.soundPlan.sfxPlannedCount;

const qualityImprovementVerdict =
  afterEventCount > beforeEventCount && afterMaxStatic < beforeMaxStatic && afterFirst5s >= 4 && afterMotionVariety > beforeMotionVariety
    ? "after_improves_event_density_motion_variety_and_static_duration"
    : "no_clear_improvement";

// ── report ────────────────────────────────────────────────────────────────────
const report = {
  schemaVersion: "money_shorts_creative_preview_quality_report_v1",
  previewMode: "development_only",
  operationalGate: false,
  sourceQualityScorerRef: manifest.sourceRefs.qualityScorerOutput,
  sourceSceneEventPlannerRef: manifest.sourceRefs.sceneEventPlannerOutput,
  sourceSelectedImageSetRef: manifest.sourceRefs.selectedImageSet,
  selectedTopicId: manifest.selectedTopicId,
  selectedCandidateId: manifest.selectedCandidateId,
  previewDurationSec: PREVIEW_SEC,
  beforePreviewPath: beforeMp4,
  afterPreviewPath: afterMp4,
  usedActualSelectedImages,
  placeholderImagesUsed: false,
  imageExistence,
  beforeMetrics: { ...beforeProbe, eventCount: beforeEventCount, maxStaticDuration: beforeMaxStatic, motionVariety: beforeMotionVariety },
  afterMetrics: { ...afterProbe, eventCount: afterEventCount, maxStaticDuration: afterMaxStatic, motionVariety: afterMotionVariety, first5sEventCount: afterFirst5s },
  delta: {
    eventCountDelta: afterEventCount - beforeEventCount,
    maxStaticDurationDelta: Math.round((afterMaxStatic - beforeMaxStatic) * 100) / 100,
    motionVarietyDelta: afterMotionVariety - beforeMotionVariety,
  },
  visualEventCountAfter: afterEventCount,
  first5sEventCountAfter: afterFirst5s,
  maxStaticDurationAfter: afterMaxStatic,
  motionTemplatesUsed: manifest.motionPlan.motionTemplatesUsedAfter,
  fallbackTemplatesApplied: manifest.fallbackPolicy.fallbackTemplatesApplied,
  captionsOneLine,
  captionsTruncated,
  youtubeSafeFrameApplied: true,
  recommendedCaptionMarginV: MARGIN_V,
  audioRendered: false,
  sfxPlannedButAudioNotRendered: true,
  sfxPlannedCount: sfxPlanned,
  sfxRenderedCount: 0,
  qualityImprovementVerdict,
  boundary: { noUploadOrPublish: true, noImageGeneration: true, noTtsGeneration: true, localFfmpegRenderOnly: true },
};
writeFileSync(manifest.outputPaths.qualityReport, JSON.stringify(report, null, 2) + "\n", "utf8");

// ── console summary ──────────────────────────────────────────────────────────
console.log("── CREATIVE PREVIEW RENDERER v1 (local ffmpeg, dev preview) ──");
console.log(`  before: ${beforeProbe.width}x${beforeProbe.height} ${beforeProbe.codec} ${beforeProbe.durationSec}s events=${beforeEventCount} maxStatic=${beforeMaxStatic}s`);
console.log(`  after : ${afterProbe.width}x${afterProbe.height} ${afterProbe.codec} ${afterProbe.durationSec}s events=${afterEventCount} maxStatic=${afterMaxStatic}s first5s=${afterFirst5s} motionVariety=${afterMotionVariety}`);
console.log(`  usedActualSelectedImages=${usedActualSelectedImages} placeholderImagesUsed=false captionsOneLine=${captionsOneLine}`);
console.log(`  verdict: ${qualityImprovementVerdict}`);
console.log(`  report: ${manifest.outputPaths.qualityReport}`);
process.exit(0);
