import type {
  GeneratedScriptPackage,
  ScriptPackageValidationError,
  ScriptPackageValidationResult,
} from "./types";
import { SCRIPT_PACKAGE_SCHEMA_VERSION } from "./types";

function push(
  errors: ScriptPackageValidationError[],
  field: string,
  code: string,
  message: string,
) {
  errors.push({ field, code, message });
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

export function validateScriptPackage(
  pkg: Partial<GeneratedScriptPackage>,
): ScriptPackageValidationResult {
  const errors: ScriptPackageValidationError[] = [];

  if (pkg.schemaVersion !== SCRIPT_PACKAGE_SCHEMA_VERSION) {
    push(errors, "schemaVersion", "invalid_schema_version", `schemaVersion must be "${SCRIPT_PACKAGE_SCHEMA_VERSION}".`);
  }

  if (!isNonEmptyString(pkg.packageId)) {
    push(errors, "packageId", "required", "packageId is required.");
  }

  if (!isNonEmptyString(pkg.blueprintVideoId)) {
    push(errors, "blueprintVideoId", "required", "blueprintVideoId is required.");
  }

  if (!isNonEmptyString(pkg.topic)) {
    push(errors, "topic", "required", "topic is required.");
  }

  if (!isNonEmptyString(pkg.title)) {
    push(errors, "title", "required", "title is required.");
  }

  if (!isNonEmptyString(pkg.coreMessage)) {
    push(errors, "coreMessage", "required", "coreMessage is required.");
  }

  // Source linkage — must be non-empty
  if (!Array.isArray(pkg.factCardIds) || pkg.factCardIds.length === 0) {
    push(errors, "factCardIds", "required_non_empty", "factCardIds must contain at least one Fact Card id.");
  } else {
    pkg.factCardIds.forEach((id, i) => {
      if (!isNonEmptyString(id)) {
        push(errors, `factCardIds[${i}]`, "invalid_id", "Each factCardId must be a non-empty string.");
      }
    });
  }

  if (!Array.isArray(pkg.sourceCitationIds) || pkg.sourceCitationIds.length === 0) {
    push(errors, "sourceCitationIds", "required_non_empty", "sourceCitationIds must contain at least one citation id.");
  } else {
    pkg.sourceCitationIds.forEach((id, i) => {
      if (!isNonEmptyString(id)) {
        push(errors, `sourceCitationIds[${i}]`, "invalid_id", "Each sourceCitationId must be a non-empty string.");
      }
    });
  }

  if (!isNonEmptyString(pkg.sourceSummary)) {
    push(errors, "sourceSummary", "required", "sourceSummary is required.");
  }

  if (!Array.isArray(pkg.sourceAttributions) || pkg.sourceAttributions.length === 0) {
    push(errors, "sourceAttributions", "required_non_empty", "sourceAttributions must contain at least one attribution.");
  } else {
    pkg.sourceAttributions.forEach((attr, i) => {
      const base = `sourceAttributions[${i}]`;
      if (!isNonEmptyString(attr.sourceName)) push(errors, `${base}.sourceName`, "required", "sourceName is required.");
      if (!isNonEmptyString(attr.sourceUrl)) push(errors, `${base}.sourceUrl`, "required", "sourceUrl is required.");
      if (!isNonEmptyString(attr.publishedDate)) push(errors, `${base}.publishedDate`, "required", "publishedDate is required.");
    });
  }

  // Scripts — must be non-empty, each with non-empty scenes
  if (!Array.isArray(pkg.scripts) || pkg.scripts.length === 0) {
    push(errors, "scripts", "required_non_empty", "scripts must contain at least one DurationScript.");
  } else {
    pkg.scripts.forEach((script, si) => {
      const sb = `scripts[${si}]`;

      if (typeof script.targetDurationSec !== "number") {
        push(errors, `${sb}.targetDurationSec`, "required", "targetDurationSec is required.");
      }

      if (!isNonEmptyString(script.fullNarration)) {
        push(errors, `${sb}.fullNarration`, "empty_narration", "fullNarration must not be empty.");
      }

      if (!Array.isArray(script.scenes) || script.scenes.length === 0) {
        push(errors, `${sb}.scenes`, "required_non_empty", "scenes must contain at least one ScriptScene.");
      } else {
        script.scenes.forEach((scene, sci) => {
          const scb = `${sb}.scenes[${sci}]`;

          if (!isNonEmptyString(scene.narrationText)) {
            push(errors, `${scb}.narrationText`, "empty_narration", "narrationText must not be empty.");
          }

          if (!isNonEmptyString(scene.captionText)) {
            push(errors, `${scb}.captionText`, "empty_caption", "captionText must not be empty.");
          }

          // CTA-only scenes are allowed to have null factCardId and null sourceNote
          if (scene.sceneGoal !== "cta") {
            if (!isNonEmptyString(scene.factCardId)) {
              push(errors, `${scb}.factCardId`, "missing_source_link", "Non-CTA scenes must have a factCardId linking to the source Fact Card.");
            } else if (Array.isArray(pkg.factCardIds) && !pkg.factCardIds.includes(scene.factCardId)) {
              push(errors, `${scb}.factCardId`, "unresolved_source_link", `factCardId "${scene.factCardId}" is not in package.factCardIds.`);
            }

            if (!isNonEmptyString(scene.sourceNote)) {
              push(errors, `${scb}.sourceNote`, "missing_source_note", "Non-CTA scenes must have a sourceNote.");
            }
          }
        });
      }
    });
  }

  // SNS copy fields — warn if empty but treat as errors to be consistent
  if (!isNonEmptyString(pkg.youtubeTitle)) {
    push(errors, "youtubeTitle", "required", "youtubeTitle is required.");
  }

  if (!isNonEmptyString(pkg.instagramCaption)) {
    push(errors, "instagramCaption", "required", "instagramCaption is required.");
  }

  if (!isNonEmptyString(pkg.description)) {
    push(errors, "description", "required", "description is required.");
  }

  if (!Array.isArray(pkg.hashtags) || pkg.hashtags.length === 0) {
    push(errors, "hashtags", "required_non_empty", "hashtags must contain at least one tag.");
  }

  return { ok: errors.length === 0, errors };
}
