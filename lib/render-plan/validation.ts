import type { RenderManifest, RenderPlanValidationError, RenderPlanValidationResult } from "./types";

/** Shell-executable invocation patterns that must never appear in a planned command. */
const FORBIDDEN_EXEC_PATTERNS: RegExp[] = [
  /\bexec\s*\(/i,
  /\bspawn\s*\(/i,
  /\bchild_process\b/i,
  /\bshell\s*=\s*true\b/i,
  /&&\s*rm\b/i,       // chained destructive command
  /;\s*rm\b/i,
  /\|\s*sh\b/i,
  /\|\s*bash\b/i,
  /`[^`]+`/,          // backtick shell substitution in command string
  /\$\([^)]+\)/,      // $(...) shell substitution
];

/**
 * Validates a RenderManifest:
 * - missing sourceId / timelineId / ttsPackageId / factCardIds / sourceCitationIds
 * - empty imageInputs or captionOverlays
 * - invalid output dimensions
 * - missing caption-to-scene linkage (caption sceneId not in imageInputs)
 * - forbidden executable patterns in ffmpegPlan.fullCommand
 * - planned output path must not point to real output/ tree (guard against accidental writes)
 */
export function validateRenderManifest(manifest: RenderManifest): RenderPlanValidationResult {
  const errors: RenderPlanValidationError[] = [];

  // Source linkage
  if (!manifest.sourceId) {
    errors.push({ field: "sourceId", code: "missing_source_id", message: "sourceId is required" });
  }
  if (!manifest.timelineId) {
    errors.push({ field: "timelineId", code: "missing_timeline_id", message: "timelineId is required" });
  }
  if (!manifest.ttsPackageId) {
    errors.push({ field: "ttsPackageId", code: "missing_tts_package_id", message: "ttsPackageId is required" });
  }
  if (!manifest.factCardIds || manifest.factCardIds.length === 0) {
    errors.push({ field: "factCardIds", code: "missing_fact_card_ids", message: "factCardIds must be non-empty" });
  }
  if (!manifest.sourceCitationIds || manifest.sourceCitationIds.length === 0) {
    errors.push({ field: "sourceCitationIds", code: "missing_citation_ids", message: "sourceCitationIds must be non-empty" });
  }

  // Output dimensions
  const { widthPx, heightPx } = manifest.outputSpec.dimensions;
  if (widthPx <= 0 || heightPx <= 0) {
    errors.push({
      field: "outputSpec.dimensions",
      code: "invalid_dimensions",
      message: `dimensions must be positive (got ${widthPx}×${heightPx})`,
    });
  }

  // Image inputs
  if (!manifest.imageInputs || manifest.imageInputs.length === 0) {
    errors.push({ field: "imageInputs", code: "empty_image_inputs", message: "imageInputs must be non-empty" });
  }

  // Caption overlays
  if (!manifest.captionOverlays || manifest.captionOverlays.length === 0) {
    errors.push({ field: "captionOverlays", code: "empty_caption_overlays", message: "captionOverlays must be non-empty" });
  } else {
    // Check each caption has non-empty text
    for (let i = 0; i < manifest.captionOverlays.length; i++) {
      const cap = manifest.captionOverlays[i];
      if (!cap.captionText || cap.captionText.trim().length === 0) {
        errors.push({
          field: `captionOverlays[${i}].captionText`,
          code: "empty_caption_text",
          message: `caption for scene ${cap.sceneId} has empty captionText`,
        });
      }
    }

    // Check caption sceneIds are present in imageInputs
    if (manifest.imageInputs && manifest.imageInputs.length > 0) {
      const imageSceneIds = new Set(manifest.imageInputs.map((img) => img.sceneId));
      for (let i = 0; i < manifest.captionOverlays.length; i++) {
        const cap = manifest.captionOverlays[i];
        if (!imageSceneIds.has(cap.sceneId)) {
          errors.push({
            field: `captionOverlays[${i}].sceneId`,
            code: "caption_scene_not_in_image_inputs",
            message: `caption sceneId "${cap.sceneId}" has no matching imageInput`,
          });
        }
      }
    }
  }

  // Forbidden executable patterns in planned command
  if (manifest.ffmpegPlan?.fullCommand) {
    for (const pattern of FORBIDDEN_EXEC_PATTERNS) {
      if (pattern.test(manifest.ffmpegPlan.fullCommand)) {
        errors.push({
          field: "ffmpegPlan.fullCommand",
          code: "forbidden_exec_pattern",
          message: `planned command contains forbidden pattern: ${pattern.toString()}`,
        });
        break; // Report once
      }
    }
  }

  // Guard: plannedOutputPath must not look like it bypasses the placeholder boundary
  const plannedPath = manifest.outputSpec.plannedOutputPath;
  if (plannedPath && /^\/|^[A-Za-z]:\\/.test(plannedPath)) {
    errors.push({
      field: "outputSpec.plannedOutputPath",
      code: "absolute_output_path_forbidden",
      message: `plannedOutputPath must be a relative placeholder path, not an absolute path (got "${plannedPath}")`,
    });
  }

  return { ok: errors.length === 0, errors };
}
