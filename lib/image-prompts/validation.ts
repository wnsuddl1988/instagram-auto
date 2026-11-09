import type {
  ImagePromptPackage,
  ImagePromptValidationError,
  ImagePromptValidationResult,
  SceneImagePrompt,
} from "./types";

const SUPPORTED_PROVIDERS = new Set([
  "pexels_stock",
  "openai_dall_e",
  "google_imagen",
  "pollinations",
  "manual",
]);

const SUPPORTED_ASSET_TYPES = new Set([
  "background_scene",
  "object_focus",
  "environment",
  "concept_abstract",
  "cta_overlay_bg",
]);

/** Patterns that suggest a number/text was injected into prompt text. */
const TEXT_IN_IMAGE_PATTERNS: RegExp[] = [
  /\b\d+(\.\d+)?\s*%/,                        // percentage numbers
  /\b\d{1,3}(,\d{3})+/,                       // comma-formatted numbers (1,382)
  /출처\s*[:：]/,                                // source attribution
  /구독|팔로우|좋아요|저장해|지금\s*바로/,       // CTA phrases
  // Card-label / CTA / product-name terms that imply rendered text in the image
  /CTA\s*카드|CTA\s*card/i,                    // explicit CTA card labels
  /Money[\s-]?OS/i,                            // product name inside image prompt
  /숫자\s*카드|카드\s*배경|카드\s*표면|카드\s*라벨/, // Korean card-surface labels
  /현재값|이전값|비교\s*카드|요약\s*카드|핵심\s*카드/, // numeric card field labels
];

function err(
  field: string,
  code: string,
  message: string,
): ImagePromptValidationError {
  return { field, code, message };
}

function validateNegativeRules(
  prompt: SceneImagePrompt,
  index: number,
  errors: ImagePromptValidationError[],
): void {
  const nr = prompt.negativeRules;
  if (!nr || nr.noTextInImage !== true) {
    errors.push(
      err(
        `scenePrompts[${index}].negativeRules.noTextInImage`,
        "missing_negative_rule",
        "noTextInImage must be true",
      ),
    );
  }
  if (!nr || nr.noInvestmentAdvice !== true) {
    errors.push(
      err(
        `scenePrompts[${index}].negativeRules.noInvestmentAdvice`,
        "missing_negative_rule",
        "noInvestmentAdvice must be true",
      ),
    );
  }
  if (!nr || nr.noFantasyStyle !== true) {
    errors.push(
      err(
        `scenePrompts[${index}].negativeRules.noFantasyStyle`,
        "missing_negative_rule",
        "noFantasyStyle must be true",
      ),
    );
  }
  if (!nr || nr.noLogosOrUI !== true) {
    errors.push(
      err(
        `scenePrompts[${index}].negativeRules.noLogosOrUI`,
        "missing_negative_rule",
        "noLogosOrUI must be true",
      ),
    );
  }
}

function validateScenePrompt(
  prompt: SceneImagePrompt,
  index: number,
  errors: ImagePromptValidationError[],
): void {
  if (!prompt.promptId) {
    errors.push(err(`scenePrompts[${index}].promptId`, "empty_prompt_id", "promptId is required"));
  }
  if (!prompt.promptText || prompt.promptText.trim().length === 0) {
    errors.push(
      err(`scenePrompts[${index}].promptText`, "empty_prompt_text", "promptText is required"),
    );
  } else {
    // Check for text/numbers-in-image violations
    for (const pattern of TEXT_IN_IMAGE_PATTERNS) {
      if (pattern.test(prompt.promptText)) {
        errors.push(
          err(
            `scenePrompts[${index}].promptText`,
            "text_in_image_violation",
            `promptText contains disallowed pattern (${pattern}). Numbers/text/CTA must stay in overlay layers.`,
          ),
        );
        break;
      }
    }
  }
  if (!prompt.negativePromptText || prompt.negativePromptText.trim().length === 0) {
    errors.push(
      err(
        `scenePrompts[${index}].negativePromptText`,
        "empty_negative_prompt",
        "negativePromptText is required",
      ),
    );
  }
  if (!SUPPORTED_PROVIDERS.has(prompt.provider)) {
    errors.push(
      err(
        `scenePrompts[${index}].provider`,
        "unsupported_provider",
        `Unsupported provider: "${prompt.provider}"`,
      ),
    );
  }
  if (!SUPPORTED_ASSET_TYPES.has(prompt.assetType)) {
    errors.push(
      err(
        `scenePrompts[${index}].assetType`,
        "unsupported_asset_type",
        `Unsupported asset type: "${prompt.assetType}"`,
      ),
    );
  }
  if (!prompt.sourceLink?.videoId) {
    errors.push(
      err(
        `scenePrompts[${index}].sourceLink.videoId`,
        "missing_video_id",
        "sourceLink.videoId is required",
      ),
    );
  }
  if (!prompt.sourceLink?.sceneId) {
    errors.push(
      err(
        `scenePrompts[${index}].sourceLink.sceneId`,
        "missing_scene_id",
        "sourceLink.sceneId is required",
      ),
    );
  }
  if (!prompt.sourceLink?.sourceCitationIds || prompt.sourceLink.sourceCitationIds.length === 0) {
    errors.push(
      err(
        `scenePrompts[${index}].sourceLink.sourceCitationIds`,
        "missing_citation_ids",
        "sourceLink.sourceCitationIds must be non-empty",
      ),
    );
  }
  validateNegativeRules(prompt, index, errors);
}

/** Validates a complete ImagePromptPackage. */
export function validateImagePromptPackage(
  pkg: ImagePromptPackage,
): ImagePromptValidationResult {
  const errors: ImagePromptValidationError[] = [];

  if (!pkg.packageId) {
    errors.push(err("packageId", "empty_package_id", "packageId is required"));
  }
  if (!pkg.videoId) {
    errors.push(err("videoId", "empty_video_id", "videoId is required"));
  }
  if (!pkg.factCardIds || pkg.factCardIds.length === 0) {
    errors.push(err("factCardIds", "missing_fact_card_ids", "factCardIds must be non-empty"));
  }
  if (!pkg.sourceCitationIds || pkg.sourceCitationIds.length === 0) {
    errors.push(
      err("sourceCitationIds", "missing_citation_ids", "sourceCitationIds must be non-empty"),
    );
  }
  if (!pkg.scenePrompts || pkg.scenePrompts.length === 0) {
    errors.push(err("scenePrompts", "empty_scene_prompts", "scenePrompts must be non-empty"));
  } else {
    pkg.scenePrompts.forEach((p, i) => validateScenePrompt(p, i, errors));
  }

  return { ok: errors.length === 0, errors };
}
