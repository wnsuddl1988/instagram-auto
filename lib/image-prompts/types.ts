import type { VideoBlueprintVisualType } from "@/lib/blueprints/types";

export const IMAGE_PROMPT_SCHEMA_VERSION = "money_shorts_image_prompt_v1" as const;

/** Image generation provider this prompt targets. */
export type ImagePromptProvider =
  | "pexels_stock"
  | "openai_dall_e"
  | "google_imagen"
  | "pollinations"
  | "manual";

/** Intended asset format/role for the rendered scene. */
export type ImageAssetType =
  | "background_scene"
  | "object_focus"
  | "environment"
  | "concept_abstract"
  | "cta_overlay_bg";

/**
 * Rules that must apply to every generated image in this pipeline.
 * Any violation makes the prompt invalid.
 */
export interface ImageNegativeRules {
  /** No text, numbers, labels, subtitles, or captions rendered inside the image. */
  noTextInImage: true;
  /** No investment advice, performance promises, or financial guarantees. */
  noInvestmentAdvice: true;
  /** No fantasy, game, cartoon, chibi, or mascot style. */
  noFantasyStyle: true;
  /** No brand logos, UI chrome, or external source attribution inside the image. */
  noLogosOrUI: true;
}

export const REQUIRED_NEGATIVE_RULES: ImageNegativeRules = {
  noTextInImage: true,
  noInvestmentAdvice: true,
  noFantasyStyle: true,
  noLogosOrUI: true,
};

/** Linkage to the blueprint/fact-card that backs this prompt. */
export interface ImagePromptSourceLink {
  videoId: string;
  sceneId: string;
  sceneIndex: number;
  /** null for non-data scenes (hook backgrounds, CTA overlays, etc.). */
  factCardId: string | null;
  sourceCitationIds: string[];
}

/** A single scene-level image prompt derived from a VideoBlueprint scene. */
export interface SceneImagePrompt {
  promptId: string;
  provider: ImagePromptProvider;
  assetType: ImageAssetType;
  /** Blueprint visualType this prompt was derived from. */
  blueprintVisualType: VideoBlueprintVisualType;
  /** The prompt text to pass to the image generation provider. No numbers/text inside image. */
  promptText: string;
  /** Negative prompt text (for providers that support it, e.g. Dall-E/Imagen). */
  negativePromptText: string;
  /** Aspect ratio for 9:16 vertical shorts format. */
  aspectRatio: "9:16";
  negativeRules: ImageNegativeRules;
  sourceLink: ImagePromptSourceLink;
}

/** A complete image prompt package derived from a single VideoBlueprint. */
export interface ImagePromptPackage {
  schemaVersion: typeof IMAGE_PROMPT_SCHEMA_VERSION;
  packageId: string;
  videoId: string;
  factCardIds: string[];
  sourceCitationIds: string[];
  defaultProvider: ImagePromptProvider;
  scenePrompts: SceneImagePrompt[];
  createdAt?: string;
}

/** Validation result for an ImagePromptPackage or individual SceneImagePrompt. */
export interface ImagePromptValidationError {
  field: string;
  code: string;
  message: string;
}

export interface ImagePromptValidationResult {
  ok: boolean;
  errors: ImagePromptValidationError[];
}
