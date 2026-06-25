import type { RecalculatedTimeline } from "@/lib/timeline/types";
import type { TtsScriptPackage } from "@/lib/voice-profiles/types";
import type { ImagePromptPackage } from "@/lib/image-prompts/types";
import type { ChartCardPackage } from "@/lib/chart-cards/types";
import type {
  RenderManifest,
  RenderOutputSpec,
  PlannedImageInput,
  PlannedAudioInput,
  PlannedCaptionOverlay,
  PlannedSourceOverlay,
  PlannedFfmpegFragment,
  PlannedFfmpegCommand,
} from "./types";
import { RENDER_PLAN_SCHEMA_VERSION, DEFAULT_RENDER_DIMENSIONS } from "./types";

export interface RenderPlanBuilderOptions {
  manifestId?: string;
  createdAt?: string;
  /** Override output dimensions (default: 1080×1920). */
  dimensions?: { widthPx: number; heightPx: number };
  /** CRF quality setting (default: 23). */
  crf?: number;
  /** Audio bitrate in kbps (default: 128). */
  audioBitrateKbps?: number;
  /** Frame rate (default: 30). */
  fps?: number;
  /** Placeholder base path for image assets (default: "assets/images"). */
  imagePlaceholderBase?: string;
  /** Placeholder base path for audio assets (default: "assets/audio"). */
  audioPlaceholderBase?: string;
  /** Placeholder base path for output files (default: "output/planned"). */
  outputPlaceholderBase?: string;
  /** Source attribution overlay duration in seconds (default: 3). */
  sourceOverlayDurationSec?: number;
}

/**
 * Builds a deterministic RenderManifest from linked local package data.
 *
 * Nothing is executed, rendered, or read from disk.
 * All asset paths are placeholder strings derived from ids.
 * Caption text comes from existing timeline captions — no new text is invented.
 * ffmpegPlan.fullCommand is a data string, never passed to exec().
 */
export function buildRenderManifest(params: {
  timeline: RecalculatedTimeline;
  ttsPackage: TtsScriptPackage;
  imagePromptPackage?: ImagePromptPackage | null;
  chartCardPackage?: ChartCardPackage | null;
  riskLevel?: string;
  sourceReferences?: Array<{ sourceName: string; sourceUrl: string; publishedDate: string; dataPeriod?: string }>;
  options?: RenderPlanBuilderOptions;
}): RenderManifest {
  const {
    timeline,
    ttsPackage,
    imagePromptPackage = null,
    chartCardPackage = null,
    riskLevel = "unchecked",
    sourceReferences = [],
    options = {},
  } = params;

  const dims = options.dimensions ?? DEFAULT_RENDER_DIMENSIONS;
  const crf = options.crf ?? 23;
  const audioBitrateKbps = options.audioBitrateKbps ?? 128;
  const fps = options.fps ?? 30;
  const imagePlaceholderBase = options.imagePlaceholderBase ?? "assets/images";
  const audioPlaceholderBase = options.audioPlaceholderBase ?? "assets/audio";
  const outputPlaceholderBase = options.outputPlaceholderBase ?? "output/planned";

  const manifestId =
    options.manifestId ?? `rp-${timeline.sourceId}-${timeline.measuredAudioDurationSec}s`;
  const plannedOutputPath = `${outputPlaceholderBase}/${timeline.sourceId}.mp4`;

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

  // ── Image inputs ─────────────────────────────────────────────────────────────
  const imageInputs: PlannedImageInput[] = timeline.scenes.map((slot) => {
    // Determine asset source type from image prompt package if available
    let assetSourceType: PlannedImageInput["assetSourceType"] = "placeholder";
    let sceneImagePromptId: string | null = null;

    if (imagePromptPackage) {
      const matchingPrompt = imagePromptPackage.scenePrompts.find(
        (p) => p.sourceLink.sceneIndex === slot.sceneIndex || p.sourceLink.sceneId === slot.sceneId,
      );
      if (matchingPrompt) {
        assetSourceType = "image_prompt_package";
        sceneImagePromptId = matchingPrompt.promptId;
      }
    } else if (chartCardPackage) {
      assetSourceType = "chart_card";
    }

    return {
      sceneId: slot.sceneId,
      sceneIndex: slot.sceneIndex,
      assetPath: `${imagePlaceholderBase}/${timeline.sourceId}/${slot.sceneId}.jpg`,
      assetSourceType,
      imagePromptPackageId: imagePromptPackage?.packageId ?? null,
      sceneImagePromptId,
      chartCardPackageId: chartCardPackage?.packageId ?? null,
      durationSec: slot.durationSec,
      motionType: "card_slide",
    };
  });

  // ── Audio input ───────────────────────────────────────────────────────────────
  const audioInput: PlannedAudioInput = {
    ttsPackageId: ttsPackage.ttsPackageId,
    voiceProfileId: ttsPackage.profileId,
    provider: ttsPackage.provider,
    assetPath: `${audioPlaceholderBase}/${ttsPackage.ttsPackageId}.mp3`,
    plannedDurationSec: timeline.measuredAudioDurationSec,
  };

  // ── Caption overlays (from timeline captions — no new text) ──────────────────
  const captionOverlays: PlannedCaptionOverlay[] = timeline.captions.map((cap) => ({
    sceneId: cap.sceneId,
    sceneIndex: cap.sceneIndex,
    captionText: cap.captionText,
    showAtSec: cap.showAtSec,
    hideAtSec: cap.hideAtSec,
    captionStyle: "bold_short_center_lower",
  }));

  // ── Source overlays ────────────────────────────────────────────────────────────
  const sourceOverlayDurationSec = options.sourceOverlayDurationSec ?? 3;
  const totalDur = timeline.totalVideoDurationSec;
  const sourceOverlays: PlannedSourceOverlay[] = sourceReferences.map((ref) => ({
    sourceName: ref.sourceName,
    sourceUrl: ref.sourceUrl,
    publishedDate: ref.publishedDate,
    dataPeriod: ref.dataPeriod,
    showAtSec: Math.max(0, totalDur - sourceOverlayDurationSec),
    hideAtSec: totalDur,
  }));

  // ── Planned ffmpeg fragments (data only — never executed) ────────────────────
  const fragments: PlannedFfmpegFragment[] = [];

  // Input image fragments
  imageInputs.forEach((img, i) => {
    fragments.push({
      label: `input_image_${i}`,
      fragmentType: "input_image",
      commandFragment: `-loop 1 -t ${img.durationSec} -i "${img.assetPath}"`,
    });
  });

  // Input audio fragment
  fragments.push({
    label: "input_audio",
    fragmentType: "input_audio",
    commandFragment: `-i "${audioInput.assetPath}"`,
  });

  // Concat filter fragment
  const scaleFilter = imageInputs
    .map((_, i) => `[${i}:v]scale=${dims.widthPx}:${dims.heightPx}:force_original_aspect_ratio=decrease,pad=${dims.widthPx}:${dims.heightPx}:(ow-iw)/2:(oh-ih)/2[v${i}];`)
    .join("");
  const concatInputsForFilter = imageInputs.map((_, i) => `[v${i}]`).join("");
  fragments.push({
    label: "concat_filter",
    fragmentType: "concat_filter",
    commandFragment: `-filter_complex "${scaleFilter}${concatInputsForFilter}concat=n=${imageInputs.length}:v=1:a=0[vout]" -map "[vout]" -map ${imageInputs.length}:a`,
  });

  // Caption overlay fragment (drawtext per scene)
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

  // Output spec fragment
  fragments.push({
    label: "output_spec",
    fragmentType: "output_spec",
    commandFragment: `-c:v libx264 -crf ${crf} -c:a aac -b:a ${audioBitrateKbps}k -r ${fps} -shortest "${plannedOutputPath}"`,
  });

  const fullCommand = [
    "ffmpeg",
    ...fragments.map((f) => f.commandFragment),
  ].join(" ");

  const ffmpegPlan: PlannedFfmpegCommand = {
    fullCommand,
    fragments,
    plannedOutputPath,
    estimatedDurationSec: timeline.totalVideoDurationSec,
  };

  const result: RenderManifest = {
    schemaVersion: RENDER_PLAN_SCHEMA_VERSION,
    manifestId,
    sourceId: timeline.sourceId,
    sourceType: timeline.sourceType,
    factCardIds: timeline.factCardIds,
    sourceCitationIds: timeline.sourceCitationIds,
    timelineId: timeline.timelineId,
    ttsPackageId: ttsPackage.ttsPackageId,
    imagePromptPackageId: imagePromptPackage?.packageId ?? null,
    chartCardPackageId: chartCardPackage?.packageId ?? null,
    riskLevel,
    outputSpec,
    imageInputs,
    audioInput,
    captionOverlays,
    sourceOverlays,
    ffmpegPlan,
  };
  if (options.createdAt !== undefined) result.createdAt = options.createdAt;
  return result;
}
