#!/usr/bin/env node
// ──────────────────────────────────────────────────────────────────────────
// render-money-shorts-creative-final-visual-v1.mjs
//
// MONEY SHORTS OS — CREATIVE FINAL VISUAL RENDERER v1 (local ffmpeg only)
//
// final visual render manifest를 읽어 FULL 30초 visual-only mp4를 C:\tmp에 렌더한다.
// 실제 selected image PNG 6장을 24+ event plan에 매핑해 motion/caption을 반영한다.
// 12초 preview subset이 아니라 30초 전체를 렌더한다.
//
// 이 render는 최종 업로드용 완성본이 아니다: audio/TTS/SFX 없음(visual-only).
// TTS/SFX/mux 이후에야 upload readiness를 판단한다 → uploadReady=false.
//
// 절대 하지 않는 것:
//   - 외부 API / OpenAI / ChatGPT / Playwright / ElevenLabs / network / env / secret
//   - image generation / TTS generation / upload / publish / deploy
//   - 기존 accepted final video / source fixtures 수정
//   - ffmpeg color=c= placeholder 단색 카드 생성
//   - silent fallback (unsupported template은 manifest에 기록된 fallback만 사용)
//
// ffmpeg/ffprobe는 spawnSync(args array, shell:false)로만 사용. C:\tmp 아래에만 write.
// ──────────────────────────────────────────────────────────────────────────

import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve, isAbsolute } from "node:path";
import { spawnSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const MANIFEST_PATH = join(__dirname, "fixtures", "money-shorts-creative-final-visual-render-manifest.v1.json");

const manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
const W = manifest.canvas.widthPx; // 1080
const H = manifest.canvas.heightPx; // 1920
const FPS = manifest.fps; // 30
const FULL_SEC = manifest.fullDurationSec; // 30
const OUT_DIR = manifest.outputPaths.outDir;
const MARGIN_V = manifest.captionPlan.recommendedCaptionMarginV; // 340

// ── out-dir guard: under C:\tmp and outside repo ─────────────────────────────
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

// ── silent-fallback guard: every event motion must be renderer-supported ─────
const RENDERER_SUPPORTED_V1 = new Set(manifest.motionPlan.rendererSupportedV1);
for (const ev of manifest.fullEventTimeline) {
  if (!RENDERER_SUPPORTED_V1.has(ev.motion_template)) {
    console.error(`ABORT: event ${ev.event_id} uses unsupported motion '${ev.motion_template}' with no recorded fallback.`);
    process.exit(3);
  }
}

// ── ffmpeg helpers (spawnSync array, shell:false) ────────────────────────────
function runFfmpeg(args, label) {
  const r = spawnSync("ffmpeg", args, { shell: false, encoding: "utf8", timeout: 180000 });
  if (r.status !== 0) {
    console.error(`ffmpeg ${label} failed (exit ${r.status}):\n${(r.stderr || "").slice(-1200)}`);
    process.exit(4);
  }
  return r;
}
function ffprobe(path) {
  const r = spawnSync(
    "ffprobe",
    ["-v", "error", "-show_entries", "stream=width,height,codec_name,codec_type,avg_frame_rate", "-show_entries", "format=duration", "-of", "json", path],
    { shell: false, encoding: "utf8", timeout: 60000 }
  );
  if (r.status !== 0) { console.error(`ffprobe failed: ${r.stderr}`); process.exit(4); }
  return JSON.parse(r.stdout);
}

// ── motion filter (zoompan d=1, on-index driven — proven from preview v1) ─────
function motionFilter(template, durSec, fps) {
  const frames = Math.max(1, Math.round(durSec * fps));
  const cover = `scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H}`;
  const big = `${cover},scale=${W * 4}:${H * 4}`;
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
      return zp(`1.0+0.12*on/${N}`, cx, cy);
    case "freeze_punch":
      return zp(`1.0+0.18*on/${N}`, cx, cy);
    case "pull_out":
      return zp(`1.15-0.15*on/${N}`, cx, cy);
    case "pan_left":
      return zp("1.12", `(iw-iw/zoom)*(1-on/${N})`, cy);
    case "pan_right":
      return zp("1.12", `(iw-iw/zoom)*(on/${N})`, cy);
    default:
      return zp(`1.0+0.1*on/${N}`, cx, cy);
  }
}

// render one clip (image + motion) → temp mp4. Input framerate pinned so duration is exact.
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

function concatClips(clipPaths, outPath) {
  const listPath = join(outAbs, "concat_final_visual.txt");
  const listBody = clipPaths.map((p) => `file '${p.replace(/\\/g, "/")}'`).join("\n") + "\n";
  writeFileSync(listPath, listBody, "utf8");
  runFfmpeg(["-y", "-f", "concat", "-safe", "0", "-i", listPath, "-c", "copy", outPath], "concat");
  return listPath;
}

// ASS caption (one-line, safe-frame marginV)
function assEscape(t) {
  return (t || "").replace(/\\/g, "\\\\").replace(/\n/g, " ").replace(/\{/g, "(").replace(/\}/g, ")");
}
function buildAss(events) {
  const header = [
    "[Script Info]", "ScriptType: v4.00+", `PlayResX: ${W}`, `PlayResY: ${H}`, "",
    "[V4+ Styles]",
    "Format: Name, Fontname, Fontsize, PrimaryColour, OutlineColour, BackColour, Bold, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
    `Style: Default,Arial,72,&H00FFFFFF,&H00000000,&H00000000,1,6,3,2,60,60,${MARGIN_V},1`,
    "", "[Events]",
    "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
  ];
  const toTs = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = (s % 60).toFixed(2).padStart(5, "0");
    return `${h}:${String(m).padStart(2, "0")}:${sec}`;
  };
  const lines = events.filter((e) => e.caption).map((e) => `Dialogue: 0,${toTs(e.time_start)},${toTs(e.time_end)},Default,,0,0,0,,${assEscape(e.caption)}`);
  return header.concat(lines).join("\n") + "\n";
}

// one-line caption check (single-line policy). MAX comes from the manifest's oneLineMaxChars
// so the renderer enforces exactly the builder's compression threshold. Any caption over the
// limit (or ellipsis-truncated) is a violation — the renderer ABORTs, it does NOT succeed.
const CAPTION_MAX = manifest.captionPlan?.oneLineMaxChars ?? 16;
function captionViolations(events) {
  const viol = [];
  for (const e of events) {
    if (!e.caption) continue;
    const chars = e.caption.replace(/\s/g, "").length;
    const ellipsis = /[…]|\.{3}$/.test(e.caption);
    if (chars > CAPTION_MAX || ellipsis) viol.push({ event_id: e.event_id, chars, ellipsis });
  }
  return viol;
}

// ── CAPTION ONE-LINE ABORT GATE (before any render) ──────────────────────────
// Enforce single-line captions up front. If ANY caption violates (too long or
// ellipsis-truncated), ABORT with a non-zero exit — never produce a "successful"
// mp4/report with captionsOneLine=false. The builder is responsible for compressing
// captions deterministically; the renderer refuses to silently truncate.
const captionViol = captionViolations(manifest.fullEventTimeline);
if (captionViol.length > 0) {
  console.error(
    `ABORT: ${captionViol.length} caption(s) violate the one-line policy (max ${CAPTION_MAX} chars, no ellipsis). ` +
      `Fix captions in the builder — the renderer will not truncate or emit a failing render.\n  ` +
      captionViol.map((v) => `${v.event_id}: chars=${v.chars} ellipsis=${v.ellipsis}`).join("\n  ")
  );
  process.exit(5);
}
const captionsTruncatedFinal = []; // enforced empty: gate above aborts on any violation
const captionsOneLine = true;

// ── RENDER FULL 30s visual timeline (24+ events) ─────────────────────────────
const clips = [];
manifest.fullEventTimeline.forEach((ev, i) => {
  const clip = join(outAbs, `final_visual_clip_${String(i).padStart(2, "0")}.mp4`);
  renderClip(ev.imagePath, ev.motion_template, Math.max(0.2, ev.duration), clip);
  clips.push(clip);
});
const concatMp4 = join(outAbs, "final_visual_noscap.mp4");
concatClips(clips, concatMp4);

// burn captions (guaranteed one-line by the abort gate above)
const assPath = join(outAbs, "final_visual_captions.ass");
writeFileSync(assPath, buildAss(manifest.fullEventTimeline), "utf8");
const finalMp4 = manifest.outputPaths.finalVisualMp4;
const assForFilter = assPath.replace(/\\/g, "/").replace(/:/g, "\\:");
runFfmpeg(
  ["-y", "-i", concatMp4, "-vf", `ass='${assForFilter}'`, "-r", String(FPS),
   "-c:v", "libx264", "-pix_fmt", "yuv420p", "-an", finalMp4],
  "captions burn"
);

// ── probe output ─────────────────────────────────────────────────────────────
const probe = ffprobe(finalMp4);
const vStream = probe.streams.find((s) => s.codec_type === "video") || {};
const aStream = probe.streams.find((s) => s.codec_type === "audio");
function fpsOf(afr) {
  if (!afr || afr === "0/0") return null;
  const [n, d] = afr.split("/").map(Number);
  return d ? Math.round((n / d) * 100) / 100 : null;
}
const probeSummary = {
  width: vStream.width,
  height: vStream.height,
  codec: vStream.codec_name,
  fps: fpsOf(vStream.avg_frame_rate),
  durationSec: Math.round(parseFloat(probe.format.duration) * 100) / 100,
  hasAudio: !!aStream,
};

// ── audit ──────────────────────────────────────────────────────────────────
const evs = manifest.fullEventTimeline;
const totalEvents = evs.length;
const first5s = evs.filter((e) => e.time_start < 5).length;
const maxStatic = Math.max(...evs.map((e) => e.duration));
const motionVariety = new Set(evs.map((e) => e.motion_template)).size;
let threeInARow = false;
for (let i = 2; i < evs.length; i++) {
  if (evs[i].motion_template === evs[i - 1].motion_template && evs[i].motion_template === evs[i - 2].motion_template) threeInARow = true;
}

// ── report ────────────────────────────────────────────────────────────────────
const report = {
  schemaVersion: "money_shorts_creative_final_visual_render_report_v1",
  visualOnly: true,
  isFinalUploadReadyVideo: false,
  uploadReady: false,
  requiresTtsSoundMuxBeforeUpload: true,
  audioRendered: false,
  ttsRendered: false,
  sfxRendered: false,
  fullThirtySecondRender: true,
  isPreviewSubset: false,
  sourceQualityScorerRef: manifest.sourceRefs.qualityScorerOutput,
  sourceSceneEventPlannerRef: manifest.sourceRefs.sceneEventPlannerOutput,
  sourceSelectedImageSetRef: manifest.sourceRefs.selectedImageSet,
  selectedTopicId: manifest.selectedTopicId,
  selectedCandidateId: manifest.selectedCandidateId,
  qualityScorerDecision: manifest.qualityScorerDecision,
  hardFailReasonCount: manifest.hardFailReasonCount,
  outputPath: finalMp4,
  usedActualSelectedImages,
  placeholderImagesUsed: false,
  imageExistence,
  probe: probeSummary,
  eventTimelineAudit: {
    totalVisualEvents: totalEvents,
    first5sEventCount: first5s,
    maxStaticDuration: Math.round(maxStatic * 100) / 100,
    motionVariety,
    sameMotionThreeInARow: threeInARow,
    timelineCoversFullDuration: manifest.eventTimelineAudit.coversFullDuration,
    isFullNotPreviewSubset: totalEvents >= 24,
  },
  motionTemplatesUsed: manifest.motionPlan.motionTemplatesUsed,
  fallbackTemplatesApplied: manifest.fallbackPolicy.fallbackTemplatesApplied,
  captionsOneLine,
  captionsTruncated: captionsTruncatedFinal,
  captionOneLineMaxChars: CAPTION_MAX,
  youtubeSafeFrameApplied: true,
  recommendedCaptionMarginV: MARGIN_V,
  boundary: { visualOnly: true, noAudioNoTtsNoSfx: true, noUploadOrPublish: true, localFfmpegRenderOnly: true },
};
writeFileSync(manifest.outputPaths.renderReport, JSON.stringify(report, null, 2) + "\n", "utf8");

// ── console summary ──────────────────────────────────────────────────────────
console.log("── CREATIVE FINAL VISUAL RENDERER v1 (local ffmpeg, visual-only) ──");
console.log(`  ${probeSummary.width}x${probeSummary.height} ${probeSummary.codec} ${probeSummary.fps}fps ${probeSummary.durationSec}s hasAudio=${probeSummary.hasAudio}`);
console.log(`  events=${totalEvents} first5s=${first5s} maxStatic=${Math.round(maxStatic * 100) / 100}s motionVariety=${motionVariety} 3inRow=${threeInARow}`);
console.log(`  usedActualSelectedImages=${usedActualSelectedImages} placeholderImagesUsed=false captionsOneLine=${captionsOneLine}`);
console.log(`  visualOnly=true uploadReady=false requiresTtsSoundMuxBeforeUpload=true`);
console.log(`  output: ${finalMp4}`);
console.log(`  report: ${manifest.outputPaths.renderReport}`);
process.exit(0);
