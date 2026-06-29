import type { MoneyShortsScenePackage } from "@/lib/source-facts/signal-translation-generator";
import {
  RENDER_PLAN_SCHEMA_VERSION,
  DEFAULT_RENDER_DIMENSIONS,
} from "./types";
import type {
  RenderManifest,
  RenderOutputSpec,
  PlannedImageInput,
  PlannedAudioInput,
  PlannedCaptionOverlay,
  PlannedSourceOverlay,
  PlannedFfmpegFragment,
  PlannedFfmpegCommand,
  RenderPlanValidationResult,
} from "./types";
import { validateRenderManifest } from "./validation";

export interface ScenePackageAdapterOptions {
  manifestId?: string;
  createdAt?: string;
  imagePlaceholderBase?: string;
  audioPlaceholderBase?: string;
  outputPlaceholderBase?: string;
  /** CRF quality (default: 23). */
  crf?: number;
  /** Audio bitrate kbps (default: 128). */
  audioBitrateKbps?: number;
  /** FPS (default: 30). */
  fps?: number;
  /** Source attribution overlay duration sec (default: 3). */
  sourceOverlayDurationSec?: number;
}

export interface ScenePackageRenderManifestResult {
  renderManifest: RenderManifest;
  validation: RenderPlanValidationResult;
}

/**
 * Builds a deterministic RenderManifest from a MoneyShortsScenePackage.
 *
 * Nothing is executed, rendered, or read from disk.
 * All asset paths are relative placeholder strings derived from ids.
 * Caption text is taken verbatim from captionBlocks — no new text is invented.
 * ffmpegPlan.fullCommand is a data string, never passed to exec().
 * riskLevel uses "unchecked" (existing render-plan convention) to avoid inventing
 * new meaning strings; structural QA status is recorded in scenePackage.warnings.
 */
export function buildRenderManifestFromScenePackage(
  scenePackage: MoneyShortsScenePackage,
  options: ScenePackageAdapterOptions = {},
): ScenePackageRenderManifestResult {
  const dims = DEFAULT_RENDER_DIMENSIONS; // 1080×1920
  const crf = options.crf ?? 23;
  const audioBitrateKbps = options.audioBitrateKbps ?? 128;
  const fps = options.fps ?? 30;
  const imagePlaceholderBase = options.imagePlaceholderBase ?? "assets/images";
  const audioPlaceholderBase = options.audioPlaceholderBase ?? "assets/audio";
  const outputPlaceholderBase = options.outputPlaceholderBase ?? "output/planned";
  const sourceOverlayDurationSec = options.sourceOverlayDurationSec ?? 3;

  const sourceId = scenePackage.id;
  const manifestId =
    options.manifestId ?? `rp-scene-pkg-${sourceId}`;
  const plannedOutputPath = `${outputPlaceholderBase}/${sourceId}.mp4`;
  const timelineId = `timeline-${sourceId}`;
  const ttsPackageId = `tts-${sourceId}`;

  // Deduplicate citation ids from brief + all sceneCards
  const citationIdSet = new Set<string>([
    ...scenePackage.brief.sourceCitationIds,
    ...scenePackage.sceneCards.flatMap((sc) => sc.sourceCitationIds),
  ]);
  const sourceCitationIds = Array.from(citationIdSet);

  // ── Output spec ───────────────────────────────────────────────────────────────
  const outputSpec: RenderOutputSpec = {
    codec: "h264",
    audioCodec: "aac",
    container: "mp4",
    crf,
    audioBitrateKbps,
    fps,
    dimensions: dims,
    plannedOutputPath,
  };

  // ── Image inputs (one per scene card) ─────────────────────────────────────────
  const imageInputs: PlannedImageInput[] = scenePackage.sceneCards.map((sc) => ({
    sceneId: `scene-${scenePackage.id}-${sc.sceneNumber}`,
    sceneIndex: sc.sceneNumber,
    assetPath: `${imagePlaceholderBase}/${sourceId}/scene-${sc.sceneNumber}.jpg`,
    assetSourceType: "placeholder" as const,
    imagePromptPackageId: null,
    sceneImagePromptId: null,
    chartCardPackageId: null,
    durationSec: sc.durationSec,
    motionType: "card_slide",
  }));

  // Estimated total duration from scene cards
  const totalDurationSec = scenePackage.sceneCards.reduce(
    (sum, sc) => sum + sc.durationSec,
    0,
  );

  // ── Audio input (placeholder) ─────────────────────────────────────────────────
  const audioInput: PlannedAudioInput = {
    ttsPackageId,
    voiceProfileId: "voice-nova-0.92",
    provider: "openai_tts",
    assetPath: `${audioPlaceholderBase}/${ttsPackageId}.mp3`,
    plannedDurationSec: totalDurationSec,
  };

  // ── Caption overlays (from captionBlocks absolute timeline — no new text) ─────
  const captionOverlays: PlannedCaptionOverlay[] = [];
  for (const sc of scenePackage.sceneCards) {
    const sceneId = `scene-${scenePackage.id}-${sc.sceneNumber}`;
    for (const block of sc.captionBlocks) {
      if (block.text && block.text.trim().length > 0) {
        captionOverlays.push({
          sceneId,
          sceneIndex: sc.sceneNumber,
          captionText: block.text,
          showAtSec: block.startSec,
          hideAtSec: block.endSec,
          captionStyle: "bold_short_center_lower",
        });
      }
    }
  }

  // ── Source overlays (from brief citations — last 3s of video) ─────────────────
  const sourceOverlays: PlannedSourceOverlay[] = [];
  if (scenePackage.brief.sourceCitationIds.length > 0) {
    sourceOverlays.push({
      sourceName: scenePackage.brief.id,
      sourceUrl: `https://placeholder.source/${scenePackage.factCardId}`,
      publishedDate: "placeholder",
      showAtSec: Math.max(0, totalDurationSec - sourceOverlayDurationSec),
      hideAtSec: totalDurationSec,
    });
  }

  // ── Planned ffmpeg fragments (data-only strings — never executed) ─────────────
  const fragments: PlannedFfmpegFragment[] = [];

  imageInputs.forEach((img, i) => {
    fragments.push({
      label: `input_image_${i}`,
      fragmentType: "input_image",
      commandFragment: `-loop 1 -t ${img.durationSec} -i "${img.assetPath}"`,
    });
  });

  fragments.push({
    label: "input_audio",
    fragmentType: "input_audio",
    commandFragment: `-i "${audioInput.assetPath}"`,
  });

  const scaleFilter = imageInputs
    .map(
      (_, i) =>
        `[${i}:v]scale=${dims.widthPx}:${dims.heightPx}:force_original_aspect_ratio=decrease,pad=${dims.widthPx}:${dims.heightPx}:(ow-iw)/2:(oh-ih)/2[v${i}];`,
    )
    .join("");
  const concatInputs = imageInputs.map((_, i) => `[v${i}]`).join("");
  fragments.push({
    label: "concat_filter",
    fragmentType: "concat_filter",
    commandFragment: `-filter_complex "${scaleFilter}${concatInputs}concat=n=${imageInputs.length}:v=1:a=0[vout]" -map "[vout]" -map ${imageInputs.length}:a`,
  });

  const captionFilter = captionOverlays
    .map(
      (cap) =>
        `drawtext=text='${cap.captionText.replace(/'/g, "\\'").replace(/:/g, "\\:")}':enable='between(t,${cap.showAtSec},${cap.hideAtSec})':fontsize=48:fontcolor=white:x=(w-text_w)/2:y=h-120`,
    )
    .join(",");
  if (captionFilter) {
    fragments.push({
      label: "caption_overlay",
      fragmentType: "caption_overlay",
      commandFragment: `-vf "${captionFilter}"`,
    });
  }

  fragments.push({
    label: "output_spec",
    fragmentType: "output_spec",
    commandFragment: `-c:v libx264 -crf ${crf} -c:a aac -b:a ${audioBitrateKbps}k -r ${fps} -shortest "${plannedOutputPath}"`,
  });

  const ffmpegPlan: PlannedFfmpegCommand = {
    fullCommand: ["ffmpeg", ...fragments.map((f) => f.commandFragment)].join(" "),
    fragments,
    plannedOutputPath,
    estimatedDurationSec: totalDurationSec,
  };

  const renderManifest: RenderManifest = {
    schemaVersion: RENDER_PLAN_SCHEMA_VERSION,
    manifestId,
    sourceId,
    sourceType: "script_package",
    factCardIds: [scenePackage.factCardId],
    sourceCitationIds,
    timelineId,
    ttsPackageId,
    imagePromptPackageId: null,
    chartCardPackageId: null,
    riskLevel: "unchecked",
    outputSpec,
    imageInputs,
    audioInput,
    captionOverlays,
    sourceOverlays,
    ffmpegPlan,
  };
  if (options.createdAt !== undefined) renderManifest.createdAt = options.createdAt;

  const validation = validateRenderManifest(renderManifest);
  return { renderManifest, validation };
}
