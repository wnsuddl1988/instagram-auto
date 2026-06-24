export const VOICE_PROFILE_SCHEMA_VERSION = "money_shorts_voice_profile_v1" as const;
export const TTS_SCRIPT_SCHEMA_VERSION = "money_shorts_tts_script_v1" as const;

/** Supported TTS provider identifiers (local model only — no live calls here). */
export type VoiceProvider =
  | "elevenlabs"
  | "openai_tts"
  | "google_tts"
  | "azure_tts"
  | "local_mock";

export type VoiceLocale = "ko-KR" | "en-US" | "ja-JP";

export type VoiceGender = "male" | "female" | "neutral";

/** Broad delivery style for the voiceover. */
export type VoiceStyle =
  | "calm_confident"
  | "warm_trustworthy"
  | "authoritative"
  | "conversational"
  | "neutral";

/**
 * Provider-specific voice settings.
 * Values are strings so they can be serialized and passed to any provider SDK
 * without importing provider-specific types here.
 */
export interface VoiceProviderSettings {
  /** Provider voice model id or name (e.g. "nova", "eleven_multilingual_v2"). */
  voiceId: string;
  /** Speaking speed multiplier (provider-normalized: 1.0 = normal). */
  speedMultiplier: number;
  /** Stability / consistency score where applicable (0.0–1.0). */
  stability?: number;
  /** Similarity / expressiveness score where applicable (0.0–1.0). */
  similarity?: number;
  /** Any additional provider-specific overrides as key-value strings. */
  extras?: Record<string, string>;
}

/** A voice profile defining how narration should be spoken. */
export interface VoiceProfile {
  schemaVersion: typeof VOICE_PROFILE_SCHEMA_VERSION;
  profileId: string;
  profileName: string;
  description: string;
  provider: VoiceProvider;
  locale: VoiceLocale;
  gender: VoiceGender;
  style: VoiceStyle;
  providerSettings: VoiceProviderSettings;
  /** Narration guidelines for prompt/script writers (not sent to TTS). */
  narrationGuidelines: string[];
  createdAt?: string;
}

/** A single scene's TTS-ready text block. */
export interface TtsSceneBlock {
  sceneId: string;
  sceneIndex: number;
  /** TTS-ready text derived from scene.narrationText or scene.ttsScript. No invented text. */
  ttsText: string;
  /** Estimated character count (not audio duration — no measurement here). */
  charCount: number;
  /** Package/blueprint id that owns this scene. */
  parentId: string;
}

/** A formatted TTS script package ready for provider submission. */
export interface TtsScriptPackage {
  schemaVersion: typeof TTS_SCRIPT_SCHEMA_VERSION;
  ttsPackageId: string;
  /** Source script package id or blueprint video id. */
  sourceId: string;
  sourceType: "script_package" | "blueprint";
  profileId: string;
  locale: VoiceLocale;
  provider: VoiceProvider;
  /** Full concatenated TTS text for the entire video (scenes joined). */
  fullTtsText: string;
  scenes: TtsSceneBlock[];
  totalCharCount: number;
  createdAt?: string;
}

/** Validation result for a VoiceProfile or TtsScriptPackage. */
export interface VoiceProfileValidationError {
  field: string;
  code: string;
  message: string;
}

export interface VoiceProfileValidationResult {
  ok: boolean;
  errors: VoiceProfileValidationError[];
}
