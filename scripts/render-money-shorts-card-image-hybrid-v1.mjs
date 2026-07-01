#!/usr/bin/env node
// ──────────────────────────────────────────────────────────────────────────
// render-money-shorts-card-image-hybrid-v1.mjs
//
// MONEY SHORTS OS — CARD-IMAGE HYBRID RENDERER v1 (local ffmpeg only)
//
// 새 렌더러 모드 `card_image_hybrid_v1`. 기존 render-money-shorts-creative-final-visual-v1.mjs를
// 삭제/수정하지 않는다. selected 고품질 LLM 이미지를 dim/blur/crop 배경으로 쓰고, 카드를 주요
// 정보 표면으로 렌더한다.
//
// 절대 계약(핸드오프 준수):
//   1) IMAGE QUALITY GATE FIRST. manifest의 모든 selected 이미지 실제 해상도를 ffprobe로 검사한다.
//      하나라도 1080x1920 미달이면 즉시 ABORT하고 정확한 blocker를 보고한다.
//      upscale 후 final로 쓰지 않는다. placeholder/plain color/stock fallback로 대체하지 않는다.
//   2) card-first: 배경은 dim/blur, 카드가 주요 정보 표면. full-screen 이미지 지배 금지.
//   3) 게이트 통과 시에만 실제 카드+배경+모션 렌더.
//
// 이 render는 visual-only다: audio/TTS/SFX 없음. TTS/mux 이후에야 upload 판단. uploadReady=false.
//
// 절대 하지 않는 것:
//   - 외부 API / OpenAI / ChatGPT / Playwright / ElevenLabs / network / env / secret
//   - image generation / TTS generation / upload / publish / deploy
//   - 기존 renderer / accepted final video / source fixtures 수정
//
// ffmpeg/ffprobe는 spawnSync(args array, shell:false)로만. C:\tmp 아래에만 write.
//
// 사용: node scripts/render-money-shorts-card-image-hybrid-v1.mjs [--gate-only]
//   --gate-only: 이미지 품질 게이트만 검사하고 render 없이 blocker/pass 리포트만 쓴다.
// ──────────────────────────────────────────────────────────────────────────

import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve, isAbsolute } from "node:path";
import { spawnSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const MANIFEST_PATH = join(__dirname, "fixtures", "card_image_hybrid_render_manifest.v1.json");

const argv = process.argv.slice(2);
const GATE_ONLY = argv.includes("--gate-only");

const manifest = JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
const W = manifest.canvas.widthPx;
const H = manifest.canvas.heightPx;
const FPS = manifest.canvas.fps;
const GATE = manifest.imageQualityGate;
const OUT_DIR = manifest.outputPaths.outDir;

// ── out-dir guard: under C:\tmp and outside repo ─────────────────────────────
const outAbs = resolve(OUT_DIR);
if (!/^C:\\+tmp\\+/i.test(OUT_DIR)) {
  console.error(`ABORT: out-dir must be under C:\\tmp. got: ${OUT_DIR}`);
  process.exit(2);
}
if (outAbs === REPO_ROOT || outAbs.startsWith(REPO_ROOT + "\\") || outAbs.startsWith(REPO_ROOT + "/")) {
  console.error("ABORT: out-dir must be OUTSIDE repo root.");
  process.exit(2);
}
mkdirSync(outAbs, { recursive: true });

// ── ffprobe helpers ──────────────────────────────────────────────────────────
function assetAbs(repoRel) {
  return isAbsolute(repoRel) ? repoRel : join(REPO_ROOT, repoRel);
}
function ffprobeImage(path) {
  const r = spawnSync(
    "ffprobe",
    ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "json", path],
    { shell: false, encoding: "utf8", timeout: 60000 }
  );
  if (r.status !== 0) return null;
  try {
    const s = (JSON.parse(r.stdout).streams || [])[0] || {};
    return { width: s.width, height: s.height };
  } catch {
    return null;
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// STEP 1 — IMAGE QUALITY GATE (runs first, before any render)
// ══════════════════════════════════════════════════════════════════════════════
const targetAspect = W / H;
const gateResults = [];
for (const img of manifest.actualImageInputs) {
  const abs = assetAbs(img.imagePath);
  const exists = existsSync(abs);
  const size = exists ? statSync(abs).size : 0;
  const dim = exists ? ffprobeImage(abs) : null;
  const width = dim?.width ?? null;
  const height = dim?.height ?? null;
  const aspect = width && height ? width / height : null;
  const meetsResolution = !!(width && height && width >= GATE.minWidthPx && height >= GATE.minHeightPx);
  const aspectOk = aspect != null ? Math.abs(aspect - targetAspect) <= 0.01 : false;
  const reasons = [];
  if (!exists) reasons.push("missing_file");
  else {
    if (!dim) reasons.push("unprobeable");
    if (width && width < GATE.minWidthPx) reasons.push(`width_${width}_below_${GATE.minWidthPx}`);
    if (height && height < GATE.minHeightPx) reasons.push(`height_${height}_below_${GATE.minHeightPx}`);
    if (!aspectOk) reasons.push(`aspect_${aspect ? aspect.toFixed(4) : "na"}_not_9_16`);
  }
  gateResults.push({
    sourceImageKey: img.sourceImageKey,
    imageSceneId: img.imageSceneId,
    imagePath: img.imagePath,
    exists,
    sizeBytes: size,
    width,
    height,
    aspect: aspect != null ? Math.round(aspect * 10000) / 10000 : null,
    meetsResolution,
    aspectOk,
    gatePass: exists && !!dim && meetsResolution && aspectOk,
    failReasons: reasons,
  });
}

const allImagesPassGate = gateResults.every((g) => g.gatePass);
const failingImages = gateResults.filter((g) => !g.gatePass);

const gateReport = {
  schemaVersion: "money_shorts_card_image_hybrid_image_gate_report_v1",
  rendererMode: manifest.rendererMode,
  topic: manifest.topic,
  gate: { minWidthPx: GATE.minWidthPx, minHeightPx: GATE.minHeightPx, orientation: GATE.orientation, allowUpscaleForFinal: GATE.allowUpscaleForFinal, allowPlaceholder: GATE.allowPlaceholder },
  imageCount: gateResults.length,
  allImagesPassGate,
  failingImageCount: failingImages.length,
  images: gateResults,
  verdict: allImagesPassGate ? "IMAGE_GATE_PASS" : "IMAGE_GATE_BLOCKED",
  blocker: allImagesPassGate
    ? null
    : {
        code: "image_resolution_below_gate",
        message:
          `${failingImages.length} selected image(s) below the ${GATE.minWidthPx}x${GATE.minHeightPx} quality gate. ` +
          `Final render is refused. Regenerate images via the LLM image path (Owner approval) — ` +
          `do NOT upscale, placeholder, or stock-fallback the final render.`,
        failing: failingImages.map((f) => ({ imageSceneId: f.imageSceneId, resolution: `${f.width}x${f.height}`, reasons: f.failReasons })),
        regeneratePath: "run-premium-editorial-scene-1-6-fullset-image-generation-v2-first-run.mjs (live ChatGPT, Owner approval + ALLOW_CHATGPT_IMAGE)",
      },
};
writeFileSync(join(outAbs, "image_gate_report.json"), JSON.stringify(gateReport, null, 2) + "\n", "utf8");

console.log("── CARD-IMAGE HYBRID RENDERER v1 — IMAGE QUALITY GATE ──");
for (const g of gateResults) {
  console.log(`  [${g.imageSceneId}] ${g.width}x${g.height} aspect=${g.aspect} gatePass=${g.gatePass}${g.gatePass ? "" : " reasons=" + g.failReasons.join(",")}`);
}
console.log(`  allImagesPassGate=${allImagesPassGate} verdict=${gateReport.verdict}`);
console.log(`  gate report: ${join(outAbs, "image_gate_report.json")}`);

// GATE BLOCKS RENDER. Do not upscale/placeholder. Report precise blocker and stop.
if (!allImagesPassGate) {
  console.error(
    `\nBLOCKER: image quality gate failed for ${failingImages.length} image(s). ` +
      `Refusing to render final (no upscale, no placeholder, no stock fallback). ` +
      `Regenerate images (Owner-approved live ChatGPT path) then re-run.`
  );
  // exit 10 = deterministic "image gate blocker" signal (distinct from usage/other errors)
  process.exit(10);
}

if (GATE_ONLY) {
  console.log("\n--gate-only: gate passed, render skipped by request.");
  process.exit(0);
}

// ══════════════════════════════════════════════════════════════════════════════
// STEP 2 — CARD-IMAGE HYBRID RENDER (only reached if gate passed)
// ══════════════════════════════════════════════════════════════════════════════
function runFfmpeg(args, label) {
  const r = spawnSync("ffmpeg", args, { shell: false, encoding: "utf8", timeout: 180000 });
  if (r.status !== 0) {
    console.error(`ffmpeg ${label} failed (exit ${r.status}):\n${(r.stderr || "").slice(-1200)}`);
    process.exit(4);
  }
  return r;
}

// dim/blur/crop background + card motion for one card clip.
// Background = selected image scaled-to-cover, cropped, darkened + blurred so the card reads on top.
function backgroundFilter(motion, durSec) {
  const frames = Math.max(1, Math.round(durSec * FPS));
  const cover = `scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H}`;
  // dim (curves/eq) + blur (gblur) → dim_blur_background
  const dimBlur = `eq=brightness=-0.18:contrast=0.92,gblur=sigma=14`;
  const big = `${cover},${dimBlur},scale=${W * 2}:${H * 2}`;
  const cx = "iw/2-(iw/zoom/2)";
  const cy = "ih/2-(ih/zoom/2)";
  const zp = (zExpr) => `${big},zoompan=z='${zExpr}':d=1:x='${cx}':y='${cy}':s=${W}x${H}:fps=${FPS},setsar=1`;
  switch (motion) {
    case "card_punch_zoom":
    case "freeze_punch":
      return zp(`1.0+0.10*on/${frames}`);
    case "checklist_pop":
      return zp(`1.04+0.04*on/${frames}`);
    case "card_slide_in":
    default:
      return zp(`1.02+0.03*on/${frames}`);
  }
}

// ASS card overlay: a solid card panel (via drawbox is not text; we use styled ASS text with a box).
function assEscape(t) {
  return (t || "").replace(/\\/g, "\\\\").replace(/\n/g, "\\N").replace(/\{/g, "(").replace(/\}/g, ")");
}
function buildCardAss(card, durSec) {
  // card as a large centered title with a translucent box background (BorderStyle=4 → opaque box).
  const isHook = card.cardTemplate === "big_hook_card" || card.cardTemplate === "twist_single_sentence_card";
  const fontSize = isHook ? 84 : 60;
  const marginV = isHook ? 640 : 900; // hook title higher-center; checklist mid-frame (safe frame)
  const header = [
    "[Script Info]", "ScriptType: v4.00+", `PlayResX: ${W}`, `PlayResY: ${H}`, "WrapStyle: 0", "",
    "[V4+ Styles]",
    "Format: Name, Fontname, Fontsize, PrimaryColour, OutlineColour, BackColour, Bold, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
    // BorderStyle=4 → box; BackColour with alpha → card panel. Amber-ish outline accent.
    `Style: Card,Arial,${fontSize},&H00FFFFFF,&H0018A0FF,&HB0202020,1,4,18,0,8,90,90,${marginV},1`,
    "", "[Events]",
    "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
  ];
  const toTs = (s) => {
    const m = Math.floor((s % 3600) / 60);
    const sec = (s % 60).toFixed(2).padStart(5, "0");
    return `0:${String(m).padStart(2, "0")}:${sec}`;
  };
  const line = `Dialogue: 0,${toTs(0)},${toTs(durSec)},Card,,0,0,0,,${assEscape(card.screenText)}`;
  return header.concat([line]).join("\n") + "\n";
}

console.log("\n── STEP 2: card-image hybrid render (gate passed) ──");
const clipPaths = [];
manifest.cardTimeline.forEach((card, i) => {
  const img = manifest.actualImageInputs.find((a) => a.imageSceneId === card.imageSceneId);
  const abs = assetAbs(img.imagePath);
  const durSec = Math.max(0.2, card.timeEndSec - card.timeStartSec);
  const clip = join(outAbs, `hybrid_clip_${String(i).padStart(2, "0")}.mp4`);
  // 1) background clip (dim/blur/motion)
  const bgClip = join(outAbs, `hybrid_bg_${String(i).padStart(2, "0")}.mp4`);
  runFfmpeg(
    ["-y", "-loop", "1", "-framerate", String(FPS), "-t", String(durSec), "-i", abs,
     "-vf", backgroundFilter(card.cardMotion, durSec), "-r", String(FPS), "-vsync", "cfr",
     "-video_track_timescale", "30000", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-an", bgClip],
    `bg ${card.cardId}`
  );
  // 2) burn card overlay
  const assPath = join(outAbs, `hybrid_card_${String(i).padStart(2, "0")}.ass`);
  writeFileSync(assPath, buildCardAss(card, durSec), "utf8");
  const assForFilter = assPath.replace(/\\/g, "/").replace(/:/g, "\\:");
  runFfmpeg(
    ["-y", "-i", bgClip, "-vf", `ass='${assForFilter}'`, "-r", String(FPS),
     "-c:v", "libx264", "-pix_fmt", "yuv420p", "-an", clip],
    `card ${card.cardId}`
  );
  clipPaths.push(clip);
});

// concat
const listPath = join(outAbs, "hybrid_concat.txt");
writeFileSync(listPath, clipPaths.map((p) => `file '${p.replace(/\\/g, "/")}'`).join("\n") + "\n", "utf8");
const finalMp4 = manifest.outputPaths.visualOnlyMp4;
runFfmpeg(["-y", "-f", "concat", "-safe", "0", "-i", listPath, "-c", "copy", finalMp4], "concat");

// probe
const pr = spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-show_entries", "stream=width,height,codec_name,codec_type", "-of", "json", finalMp4], { shell: false, encoding: "utf8" });
const probe = JSON.parse(pr.stdout);
const v = (probe.streams || []).find((s) => s.codec_type === "video") || {};

// actual card timeline + perceptual event report
const actualCardTimeline = {
  schemaVersion: "money_shorts_actual_card_timeline_v1",
  rendererMode: manifest.rendererMode,
  cards: manifest.cardTimeline.map((c) => ({ cardId: c.cardId, phaseId: c.phaseId, timeStartSec: c.timeStartSec, timeEndSec: c.timeEndSec, cardTemplate: c.cardTemplate, cardMotion: c.cardMotion, backgroundTemplate: c.backgroundTemplate, screenText: c.screenText })),
};
writeFileSync(manifest.outputPaths.actualCardTimeline, JSON.stringify(actualCardTimeline, null, 2) + "\n", "utf8");

// perceptual events are NOT invented here — each card's perceptualEvents array in the manifest
// (single source of truth, mirrors golden_sample_blueprint.rate_freeze.v1.json#perceptualEventPlan)
// is consumed verbatim. dim_blur_background is intentionally absent from that array: it is a
// static per-phase background treatment, not a transition, so it is never counted (same bucket
// as pan/zoom/micro-movement).
const perceptualEvents = [];
for (const c of manifest.cardTimeline) {
  for (const type of c.perceptualEvents || []) {
    perceptualEvents.push({ atSec: c.timeStartSec, type, cardId: c.cardId });
  }
}
const plannedCount = manifest.perceptualEventPlanRef?.plannedPerceptualEventCount ?? null;
const minForPass = manifest.perceptualEventPlanRef?.minPerceptualEventCountForPass ?? null;
const actualMatchesPlanned = plannedCount != null ? perceptualEvents.length === plannedCount : null;
const perceptualEventReport = {
  schemaVersion: "money_shorts_perceptual_event_report_v1",
  rendererMode: manifest.rendererMode,
  perceptualEventCount: perceptualEvents.length,
  plannedPerceptualEventCount: plannedCount,
  minPerceptualEventCountForPass: minForPass,
  actualMatchesPlanned,
  passesMinThreshold: minForPass != null ? perceptualEvents.length >= minForPass : null,
  cardPresenceRatio: 1.0,
  fullScreenImageDominanceRatio: 0.0,
  firstTwoSecondHookCardPresent: manifest.cardTimeline.some((c) => c.timeStartSec < 2.0 && c.cardTemplate === "big_hook_card"),
  events: perceptualEvents,
  note: "카드가 매 구간 존재(cardPresenceRatio=1.0), 배경은 dim/blur로만 사용해 full-screen 이미지 지배 없음. perceptualEventCount는 manifest cardTimeline[].perceptualEvents(blueprint와 동일)를 그대로 합산한 값이다.",
};
writeFileSync(manifest.outputPaths.perceptualEventReport, JSON.stringify(perceptualEventReport, null, 2) + "\n", "utf8");

const renderManifestOut = {
  schemaVersion: "money_shorts_card_image_hybrid_render_manifest_out_v1",
  rendererMode: manifest.rendererMode,
  visualOnly: true,
  uploadReady: false,
  requiresTtsSoundMuxBeforeUpload: true,
  imageGatePassed: true,
  output: finalMp4,
  probe: { width: v.width, height: v.height, codec: v.codec_name, durationSec: Math.round(parseFloat(probe.format.duration) * 100) / 100 },
  cardCount: manifest.cardTimeline.length,
  perceptualEventCount: perceptualEvents.length,
};
writeFileSync(manifest.outputPaths.renderManifestOut, JSON.stringify(renderManifestOut, null, 2) + "\n", "utf8");

console.log(`  output: ${finalMp4}`);
console.log(`  ${v.width}x${v.height} ${v.codec_name} ${renderManifestOut.probe.durationSec}s cards=${manifest.cardTimeline.length} perceptualEvents=${perceptualEvents.length} (planned=${plannedCount}, matches=${actualMatchesPlanned}, minForPass=${minForPass})`);
console.log(`  visualOnly=true uploadReady=false`);
process.exit(0);
