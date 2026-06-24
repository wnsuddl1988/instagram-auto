import type {
  VoiceProfile,
  TtsScriptPackage,
  VoiceProfileValidationError,
  VoiceProfileValidationResult,
} from "./types";

const SUPPORTED_PROVIDERS = new Set([
  "elevenlabs",
  "openai_tts",
  "google_tts",
  "azure_tts",
  "local_mock",
]);

const SUPPORTED_LOCALES = new Set(["ko-KR", "en-US", "ja-JP"]);

function err(
  field: string,
  code: string,
  message: string,
): VoiceProfileValidationError {
  return { field, code, message };
}

/** Validates a VoiceProfile definition. */
export function validateVoiceProfile(
  profile: VoiceProfile,
): VoiceProfileValidationResult {
  const errors: VoiceProfileValidationError[] = [];

  if (!profile.profileId) {
    errors.push(err("profileId", "empty_profile_id", "profileId is required"));
  }
  if (!profile.profileName) {
    errors.push(err("profileName", "empty_profile_name", "profileName is required"));
  }
  if (!SUPPORTED_PROVIDERS.has(profile.provider)) {
    errors.push(
      err("provider", "unsupported_provider", `Unsupported provider: "${profile.provider}"`),
    );
  }
  if (!SUPPORTED_LOCALES.has(profile.locale)) {
    errors.push(
      err("locale", "unsupported_locale", `Unsupported locale: "${profile.locale}"`),
    );
  }
  if (!profile.providerSettings?.voiceId) {
    errors.push(
      err(
        "providerSettings.voiceId",
        "missing_voice_id",
        "providerSettings.voiceId is required",
      ),
    );
  }
  if (
    profile.providerSettings?.speedMultiplier !== undefined &&
    (profile.providerSettings.speedMultiplier <= 0 ||
      profile.providerSettings.speedMultiplier > 4)
  ) {
    errors.push(
      err(
        "providerSettings.speedMultiplier",
        "invalid_speed_multiplier",
        "speedMultiplier must be in range (0, 4]",
      ),
    );
  }

  return { ok: errors.length === 0, errors };
}

/** Validates a TtsScriptPackage. */
export function validateTtsScriptPackage(
  pkg: TtsScriptPackage,
): VoiceProfileValidationResult {
  const errors: VoiceProfileValidationError[] = [];

  if (!pkg.ttsPackageId) {
    errors.push(err("ttsPackageId", "empty_package_id", "ttsPackageId is required"));
  }
  if (!pkg.sourceId) {
    errors.push(err("sourceId", "empty_source_id", "sourceId is required"));
  }
  if (!pkg.profileId) {
    errors.push(err("profileId", "missing_profile_id", "profileId is required"));
  }
  if (!SUPPORTED_PROVIDERS.has(pkg.provider)) {
    errors.push(
      err("provider", "unsupported_provider", `Unsupported provider: "${pkg.provider}"`),
    );
  }
  if (!SUPPORTED_LOCALES.has(pkg.locale)) {
    errors.push(
      err("locale", "unsupported_locale", `Unsupported locale: "${pkg.locale}"`),
    );
  }
  if (!pkg.fullTtsText || pkg.fullTtsText.trim().length === 0) {
    errors.push(err("fullTtsText", "empty_tts_text", "fullTtsText is required"));
  }
  if (!pkg.scenes || pkg.scenes.length === 0) {
    errors.push(err("scenes", "empty_scenes", "scenes must be non-empty"));
  } else {
    pkg.scenes.forEach((scene, i) => {
      if (!scene.sceneId) {
        errors.push(
          err(`scenes[${i}].sceneId`, "empty_scene_id", "sceneId is required"),
        );
      }
      if (!scene.ttsText || scene.ttsText.trim().length === 0) {
        errors.push(
          err(`scenes[${i}].ttsText`, "empty_tts_text", "ttsText is required"),
        );
      }
      if (!scene.parentId) {
        errors.push(
          err(`scenes[${i}].parentId`, "missing_parent_id", "parentId is required"),
        );
      }
    });
  }

  return { ok: errors.length === 0, errors };
}
