export { VOICE_PROFILE_SCHEMA_VERSION, TTS_SCRIPT_SCHEMA_VERSION } from "./types";
export type {
  VoiceProvider,
  VoiceLocale,
  VoiceGender,
  VoiceStyle,
  VoiceProviderSettings,
  VoiceProfile,
  TtsSceneBlock,
  TtsScriptPackage,
  VoiceProfileValidationError,
  VoiceProfileValidationResult,
} from "./types";

export {
  DEFAULT_MONEY_SHORTS_VOICE_PROFILE,
  MOCK_VOICE_PROFILES,
} from "./profiles";

export { formatScriptPackageForTts, formatBlueprintForTts } from "./formatter";
export type { TtsFormatterOptions } from "./formatter";

export { validateVoiceProfile, validateTtsScriptPackage } from "./validation";

export {
  inflationTtsPackage30,
  exchangeRateTtsPackage15,
  inflationBlueprintTtsPackage,
  MOCK_TTS_PACKAGES,
} from "./fixtures";
