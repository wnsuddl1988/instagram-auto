import type { VideoBlueprint, VideoBlueprintValidationError, VideoBlueprintValidationResult } from "./types";
import { BLUEPRINT_SCHEMA_VERSION } from "./types";

const HTTP_URL_PATTERN = /^https?:\/\//i;

function pushError(
  errors: VideoBlueprintValidationError[],
  field: string,
  code: string,
  message: string,
) {
  errors.push({ field, code, message });
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function validateVideoBlueprint(
  blueprint: Partial<VideoBlueprint>,
): VideoBlueprintValidationResult {
  const errors: VideoBlueprintValidationError[] = [];

  if (blueprint.schemaVersion !== BLUEPRINT_SCHEMA_VERSION) {
    pushError(errors, "schemaVersion", "invalid_schema_version", `schemaVersion must be "${BLUEPRINT_SCHEMA_VERSION}".`);
  }

  if (!isNonEmptyString(blueprint.videoId)) {
    pushError(errors, "videoId", "required", "videoId is required.");
  }

  if (!isNonEmptyString(blueprint.title)) {
    pushError(errors, "title", "required", "title is required.");
  }

  if (!isNonEmptyString(blueprint.topic)) {
    pushError(errors, "topic", "required", "topic is required.");
  }

  if (!isNonEmptyString(blueprint.coreMessage)) {
    pushError(errors, "coreMessage", "required", "coreMessage is required.");
  }

  if (!Array.isArray(blueprint.factCardIds) || blueprint.factCardIds.length === 0) {
    pushError(errors, "factCardIds", "required_non_empty", "factCardIds must contain at least one Fact Card id.");
  } else {
    blueprint.factCardIds.forEach((id, i) => {
      if (!isNonEmptyString(id)) {
        pushError(errors, `factCardIds[${i}]`, "invalid_id", "Each factCardId must be a non-empty string.");
      }
    });
  }

  if (!Array.isArray(blueprint.sourceCitationIds) || blueprint.sourceCitationIds.length === 0) {
    pushError(errors, "sourceCitationIds", "required_non_empty", "sourceCitationIds must contain at least one citation id.");
  } else {
    blueprint.sourceCitationIds.forEach((id, i) => {
      if (!isNonEmptyString(id)) {
        pushError(errors, `sourceCitationIds[${i}]`, "invalid_id", "Each sourceCitationId must be a non-empty string.");
      }
    });
  }

  if (!isNonEmptyString(blueprint.sourceSummary)) {
    pushError(errors, "sourceSummary", "required", "sourceSummary is required.");
  }

  if (!Array.isArray(blueprint.scenes) || blueprint.scenes.length === 0) {
    pushError(errors, "scenes", "required_non_empty", "scenes must contain at least one scene.");
  } else {
    const ctaIndexes = new Set(
      blueprint.scenes
        .map((s, i) => (s.sceneRole === "money_os_cta" ? i : -1))
        .filter((i) => i >= 0),
    );

    blueprint.scenes.forEach((scene, i) => {
      const base = `scenes[${i}]`;
      if (!isNonEmptyString(scene.sceneId)) {
        pushError(errors, `${base}.sceneId`, "required", "scene.sceneId is required.");
      }
      if (!isNonEmptyString(scene.narration)) {
        pushError(errors, `${base}.narration`, "required", "scene.narration is required.");
      }
      if (!isNonEmptyString(scene.caption)) {
        pushError(errors, `${base}.caption`, "required", "scene.caption is required.");
      }
      // CTA scenes are allowed to have null factCardId
      if (!ctaIndexes.has(i)) {
        if (!isNonEmptyString(scene.factCardId)) {
          pushError(errors, `${base}.factCardId`, "missing_fact_card_link", "scene.factCardId must link back to a Fact Card id.");
        } else if (Array.isArray(blueprint.factCardIds) && !blueprint.factCardIds.includes(scene.factCardId)) {
          pushError(errors, `${base}.factCardId`, "unresolved_fact_card_link", `scene.factCardId "${scene.factCardId}" is not in blueprint.factCardIds.`);
        }
      }
    });

    // Timing invariant 1: start times must be strictly increasing (or equal, for first scene at 0)
    for (let i = 1; i < blueprint.scenes.length; i++) {
      const prev = blueprint.scenes[i - 1];
      const curr = blueprint.scenes[i];
      if (curr.estimatedStartTime <= prev.estimatedStartTime) {
        pushError(
          errors,
          `scenes[${i}].estimatedStartTime`,
          "start_time_not_ordered",
          `scenes[${i}].estimatedStartTime (${curr.estimatedStartTime}) must be greater than scenes[${i - 1}].estimatedStartTime (${prev.estimatedStartTime}).`,
        );
      }
    }

    // Timing invariant 2: no scene may exceed targetDurationSec
    const targetDurationSec = blueprint.targetDurationSec;
    if (typeof targetDurationSec === "number") {
      blueprint.scenes.forEach((scene, i) => {
        const end = scene.estimatedStartTime + scene.estimatedDuration;
        if (end > targetDurationSec) {
          pushError(
            errors,
            `scenes[${i}].estimatedDuration`,
            "scene_exceeds_target_duration",
            `scenes[${i}] ends at ${end}s which exceeds targetDurationSec (${targetDurationSec}s).`,
          );
        }
      });
    }

    // Timing invariant 3: estimatedDurationSec must equal sum of scene durations
    if (typeof blueprint.estimatedDurationSec === "number") {
      const sceneDurationSum = blueprint.scenes.reduce((acc, s) => acc + s.estimatedDuration, 0);
      if (Math.abs(blueprint.estimatedDurationSec - sceneDurationSum) > 0.001) {
        pushError(
          errors,
          "estimatedDurationSec",
          "duration_mismatch",
          `estimatedDurationSec (${blueprint.estimatedDurationSec}) does not equal sum of scene estimatedDuration values (${sceneDurationSum}).`,
        );
      }
    }
  }

  if (!Array.isArray(blueprint.sourceReferences)) {
    pushError(errors, "sourceReferences", "required_array", "sourceReferences must be an array.");
  } else {
    blueprint.sourceReferences.forEach((ref, i) => {
      const base = `sourceReferences[${i}]`;
      if (!isNonEmptyString(ref.sourceName)) {
        pushError(errors, `${base}.sourceName`, "required", "sourceReference.sourceName is required.");
      }
      if (!isNonEmptyString(ref.sourceUrl) || !HTTP_URL_PATTERN.test(ref.sourceUrl)) {
        pushError(errors, `${base}.sourceUrl`, "invalid_url", "sourceReference.sourceUrl must start with http:// or https://.");
      }
      if (!isNonEmptyString(ref.publishedDate)) {
        pushError(errors, `${base}.publishedDate`, "required", "sourceReference.publishedDate is required.");
      }
    });
  }

  if (!isNonEmptyString(blueprint.voiceProfileId)) {
    pushError(errors, "voiceProfileId", "required", "voiceProfileId is required.");
  }

  const validCtaPolicies = ["none", "soft", "direct"];
  if (!isNonEmptyString(blueprint.ctaPolicy) || !validCtaPolicies.includes(blueprint.ctaPolicy)) {
    pushError(errors, "ctaPolicy", "invalid_cta_policy", `ctaPolicy must be one of: ${validCtaPolicies.join(", ")}.`);
  }

  return { ok: errors.length === 0, errors };
}
