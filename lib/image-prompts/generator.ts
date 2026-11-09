import type { VideoBlueprint, VideoBlueprintScene, VideoBlueprintVisualType } from "@/lib/blueprints/types";
import {
  IMAGE_PROMPT_SCHEMA_VERSION,
  REQUIRED_NEGATIVE_RULES,
} from "./types";
import type {
  ImageAssetType,
  ImagePromptPackage,
  ImagePromptProvider,
  ImagePromptSourceLink,
  SceneImagePrompt,
} from "./types";

export interface ImagePromptGeneratorOptions {
  packageId?: string;
  defaultProvider?: ImagePromptProvider;
  createdAt?: string;
}

const STANDARD_NEGATIVE_PROMPT =
  "text, numbers, labels, subtitles, captions, watermarks, logos, UI elements, " +
  "investment charts with labels, stock ticker symbols, percentage numbers, " +
  "cartoon, chibi, fantasy, game art, mascot, anime, illustration style";

/** Maps blueprint visualType to the intended image asset type. */
function deriveAssetType(visualType: VideoBlueprintVisualType): ImageAssetType {
  switch (visualType) {
    case "chart_card":
    case "number_card":
      return "object_focus";
    case "cta_card":
      return "cta_overlay_bg";
    case "gpt_image":
      return "concept_abstract";
    case "static_background":
      return "environment";
    case "veo_clip":
      return "background_scene";
    default:
      return "background_scene";
  }
}

/** Maps blueprint visualType to the preferred image provider. */
function deriveProvider(
  visualType: VideoBlueprintVisualType,
  defaultProvider: ImagePromptProvider,
): ImagePromptProvider {
  switch (visualType) {
    case "chart_card":
    case "number_card":
      // Chart/number cards are handled by chart-cards module, not image gen.
      // Use stock photography as background for these scene types.
      return "pexels_stock";
    case "cta_card":
      return "pexels_stock";
    default:
      return defaultProvider;
  }
}

/**
 * Visual types that must use a safe background fallback prompt regardless of
 * what visualDescription or imagePrompt contain.
 *
 * - chart_card / number_card: card surface is rendered by chart-cards module.
 *   Image gen must never try to render a card with numbers/labels.
 * - cta_card: CTA copy belongs in an overlay layer, not a generated image.
 */
const CARD_SURFACE_VISUAL_TYPES: Set<VideoBlueprintVisualType> = new Set([
  "chart_card",
  "number_card",
  "cta_card",
]);

/**
 * Derives prompt text from a scene's visualDescription and scene role.
 * Numbers, captions, CTA text, and source attributions are deliberately
 * excluded from the prompt — those belong in the chart-card/overlay layer.
 *
 * For card/CTA visual types, always use a safe background fallback — the
 * visualDescription of these scenes typically contains card-label or CTA
 * copy that must not be passed to an image model.
 */
function buildPromptText(scene: VideoBlueprintScene): string {
  // Card/CTA scenes: always use safe fallback; skip visualDescription entirely
  if (CARD_SURFACE_VISUAL_TYPES.has(scene.visualType)) {
    return buildFallbackPrompt(scene);
  }

  // For other visual types, start from the scene's existing imagePrompt if available
  if (scene.imagePrompt && scene.imagePrompt.trim().length > 0) {
    return sanitizePromptText(scene.imagePrompt);
  }

  // Fall back to visualDescription, sanitized
  if (scene.visualDescription && scene.visualDescription.trim().length > 0) {
    return sanitizePromptText(scene.visualDescription);
  }

  // Minimal fallback based on scene role
  return buildFallbackPrompt(scene);
}

/**
 * Removes numeric facts, percentages, source citations, and CTA instructions
 * from a prompt candidate string. These belong in overlay layers, not the image.
 */
function sanitizePromptText(raw: string): string {
  return raw
    // Remove percentage numbers (e.g. "3.2%", "+2.4%")
    .replace(/[+-]?\d+\.?\d*\s*%/g, "")
    // Remove standalone numbers that look like financial values
    .replace(/\b\d{1,3}(,\d{3})*(\.\d+)?\s*(원|달러|엔|USD|KRW|EUR|JPY|억|조|만)?\b/g, "")
    // Remove source citation patterns
    .replace(/(출처|source|©|저작권)[^\n]*/gi, "")
    // Remove CTA patterns
    .replace(/(구독|팔로우|좋아요|저장|링크|지금\s*바로)[^\n]*/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function buildFallbackPrompt(scene: VideoBlueprintScene): string {
  switch (scene.sceneRole) {
    case "hook":
      return "modern minimalist financial environment, clean corporate atmosphere, soft natural lighting, no text";
    case "context":
      return "professional economic environment, clean modern office or urban setting, neutral tones, no text";
    case "problem":
      return "subtle tension in a calm financial setting, muted colors, thoughtful atmosphere, no text";
    case "reason":
      return "conceptual abstract background suggesting cause and effect, clean modern style, no text";
    case "structure":
      return "organized clean workspace or structured environment, professional lighting, no text";
    case "solution":
      return "bright airy environment suggesting positive resolution, clean modern space, no text";
    case "example":
      return "everyday life scene in a modern Korean urban environment, natural lighting, no text";
    case "recap":
      return "calm clean environment suggesting clarity and summary, soft light, no text";
    case "money_os_cta":
      return "clean abstract gradient background, modern minimal, no text, no UI elements";
    default:
      return "clean modern financial environment, professional, neutral tones, no text";
  }
}

function buildSourceLink(
  blueprint: VideoBlueprint,
  scene: VideoBlueprintScene,
): ImagePromptSourceLink {
  return {
    videoId: blueprint.videoId,
    sceneId: scene.sceneId,
    sceneIndex: scene.sceneIndex,
    factCardId: scene.factCardId,
    sourceCitationIds: blueprint.sourceCitationIds,
  };
}

/**
 * Derives a SceneImagePrompt from a single BlueprintScene.
 * No external service is called. Prompt text is sanitized to exclude
 * numbers, captions, CTA text, and source attributions.
 */
export function makeSceneImagePrompt(
  blueprint: VideoBlueprint,
  scene: VideoBlueprintScene,
  options: ImagePromptGeneratorOptions = {},
): SceneImagePrompt {
  const defaultProvider = options.defaultProvider ?? "pexels_stock";
  const provider = deriveProvider(scene.visualType, defaultProvider);
  const assetType = deriveAssetType(scene.visualType);
  const promptText = buildPromptText(scene);

  return {
    promptId: `prompt-${blueprint.videoId}-${scene.sceneId}`,
    provider,
    assetType,
    blueprintVisualType: scene.visualType,
    promptText,
    negativePromptText: STANDARD_NEGATIVE_PROMPT,
    aspectRatio: "9:16",
    negativeRules: REQUIRED_NEGATIVE_RULES,
    sourceLink: buildSourceLink(blueprint, scene),
  };
}

/**
 * Derives a complete ImagePromptPackage from a VideoBlueprint.
 * Fully deterministic — no external calls, no `new Date()` inside.
 */
export function generateImagePromptPackage(
  blueprint: VideoBlueprint,
  options: ImagePromptGeneratorOptions = {},
): ImagePromptPackage {
  const packageId =
    options.packageId ?? `ipp-${blueprint.videoId}`;
  const defaultProvider = options.defaultProvider ?? "pexels_stock";

  const scenePrompts = blueprint.scenes.map((scene) =>
    makeSceneImagePrompt(blueprint, scene, { ...options, defaultProvider }),
  );

  const pkg: ImagePromptPackage = {
    schemaVersion: IMAGE_PROMPT_SCHEMA_VERSION,
    packageId,
    videoId: blueprint.videoId,
    factCardIds: blueprint.factCardIds,
    sourceCitationIds: blueprint.sourceCitationIds,
    defaultProvider,
    scenePrompts,
  };

  if (options.createdAt !== undefined) pkg.createdAt = options.createdAt;

  return pkg;
}
