import type { EditorialV2LocalStoreConfiguration } from "./contracts";

export const VOICE_MATERIALIZATION_PROVIDER_ID = "elevenlabs_tts_with_timestamps" as const;
export const ELEVENLABS_API_ORIGIN = "https://api.elevenlabs.io" as const;
export const ELEVENLABS_OUTPUT_FORMAT = "mp3_44100_128" as const;
export const SHORTS_EDITORIAL_OS_V2_EXTERNAL_TTS_ENABLED = "SHORTS_EDITORIAL_OS_V2_EXTERNAL_TTS_ENABLED" as const;
export const ELEVENLABS_API_KEY_ENV = "ELEVENLABS_API_KEY" as const;
export const VOICE_MATERIALIZATION_MAX_SCENE_CHARACTERS = 2_000;
export const VOICE_MATERIALIZATION_MAX_TOTAL_CHARACTERS = 10_000;
export const VOICE_MATERIALIZATION_MIN_SCENES = 7;
export const VOICE_MATERIALIZATION_MAX_SCENES = 10;
export const VOICE_MATERIALIZATION_MAX_REQUEST_BYTES = 32_768;
export const ELEVENLABS_MAX_RESPONSE_JSON_BYTES = 32 * 1024 * 1024;
export const VOICE_MATERIALIZATION_MAX_SCENE_AUDIO_BYTES = 20 * 1024 * 1024;
export const VOICE_MATERIALIZATION_MAX_TOTAL_AUDIO_BYTES = 80 * 1024 * 1024;
export const VOICE_MATERIALIZATION_MAX_AUDIO_DURATION_MS = 10 * 60 * 1_000;
export const VOICE_MATERIALIZATION_STANDARD_EXECUTION_MODE = "standard_full_materialization" as const;
export const PA4L_SINGLE_SCENE_LIVE_SMOKE_MODE = "pa4l_single_scene_live_smoke" as const;
export const PA4L_MAX_SCENES = 1 as const;
export const PA4L_MAX_EXTERNAL_GENERATION_REQUESTS = 1 as const;
export const PA4L_MAX_NARRATION_CHARACTERS = 180 as const;
export const PA4L_AUTOMATIC_RETRY_LIMIT = 0 as const;
export const PA4L_FALLBACK_REQUEST_LIMIT = 0 as const;

export type VoiceMaterializationProviderId = typeof VOICE_MATERIALIZATION_PROVIDER_ID;
export type VoiceMaterializationOutputFormat = typeof ELEVENLABS_OUTPUT_FORMAT;
export type VoiceMaterializationExecutionMode =
  | typeof VOICE_MATERIALIZATION_STANDARD_EXECUTION_MODE
  | typeof PA4L_SINGLE_SCENE_LIVE_SMOKE_MODE;
export type VoiceMaterializationSceneStatus = "cache_hit" | "generated" | "failed" | "pending";
export type VoiceMaterializationApprovalState = "pending" | "blocked" | "approved";

export interface VoiceMaterializationScenePlan {
  readonly sceneId: string;
  readonly sceneOrder: number;
  readonly narration: string;
  readonly narrationHash: string;
  readonly characterCount: number;
  readonly keyCaption: string;
  readonly sceneAudioIdentity: string;
}

export interface VoiceMaterializationPlan {
  readonly schemaVersion: "voice-materialization-plan-v1";
  readonly projectId: string;
  readonly projectRevision: number;
  readonly projectIntegrityHash: string;
  readonly sourceRenderCheckpointHash: string;
  readonly renderManifestHash: string;
  readonly providerId: VoiceMaterializationProviderId;
  readonly voiceId: string;
  readonly modelId: string;
  readonly outputFormat: VoiceMaterializationOutputFormat;
  readonly executionMode: VoiceMaterializationExecutionMode;
  readonly sceneCount: number;
  readonly plannedSceneCount: number;
  readonly scenes: readonly VoiceMaterializationScenePlan[];
  readonly totalCharacters: number;
  readonly maximumExternalGenerationRequests: number;
  readonly automaticRetryLimit: 0;
  readonly fallbackRequestLimit: 0;
  readonly materializationSetId: string;
  readonly planHash: string;
  readonly externalCallRequired: true;
  readonly externalCallExecuted: false;
  readonly ownerConfirmationRequired: true;
  readonly costAmountKnown: false;
  readonly stopPolicy: "STOP_ON_FIRST_EXTERNAL_FAILURE";
}

export interface VoiceMaterializationPlanComparison {
  readonly matches: boolean;
  readonly stale: boolean;
  readonly reasons: readonly string[];
}

export interface VoiceMaterializationPlanPreview {
  readonly plan: VoiceMaterializationPlan;
  readonly featureEnabled: boolean;
  readonly credentialConfigured: boolean;
  readonly cacheHitSceneIds: readonly string[];
  readonly missingSceneIds: readonly string[];
  readonly maximumExternalRequests: number;
  readonly actualPrice: "UNKNOWN";
  readonly providerPriceVerified: false;
  readonly priceNotice: "실제 Provider 가격을 이 프로그램이 검증한 것이 아닙니다.";
  readonly externalNetworkRequestsMade: 0;
}

export interface VoiceMaterializationRequest {
  readonly action: "materialize" | "retry_failed";
  readonly executionMode: VoiceMaterializationExecutionMode;
  readonly expectedProjectRevision: number;
  readonly expectedRenderCheckpointHash: string;
  readonly voiceId: string;
  readonly modelId: string;
  readonly expectedPlanHash: string;
  readonly ownerPaidExternalTtsConfirmation: true;
  readonly requestedSceneIds?: readonly string[];
}

export interface ProviderCharacterAlignment {
  readonly characters: readonly string[];
  readonly characterStartTimesSeconds: readonly number[];
  readonly characterEndTimesSeconds: readonly number[];
}

export interface ProviderAlignmentValidation {
  readonly structurallyValid: boolean;
  readonly audioAlignmentUsable: boolean;
  readonly canonicalTextMatches: boolean;
  readonly normalizedAlignmentPresent: boolean;
  readonly normalizedAlignmentAuthoritative: false;
  readonly alignmentHash: string | null;
  readonly reconstructedText: string;
  readonly finalEndSeconds: number | null;
  readonly issues: readonly string[];
  readonly alignment: ProviderCharacterAlignment | null;
}

export interface ElevenLabsTimestampTtsResult {
  readonly audio: Uint8Array;
  readonly alignmentValidation: ProviderAlignmentValidation;
  readonly providerId: VoiceMaterializationProviderId;
  readonly outputFormat: VoiceMaterializationOutputFormat;
  readonly normalizedAlignmentPresent: boolean;
}

export interface VoiceAudioProbeSummary {
  readonly audioStreamPresent: boolean;
  readonly videoStreamPresent: boolean;
  readonly codecName: string;
  readonly formatName: string;
  readonly durationMs: number;
}

export interface AudioAlignedSubtitleCue {
  readonly cueId: string;
  readonly sceneId: string;
  readonly sceneOrder: number;
  readonly cueOrder: number;
  readonly text: string;
  readonly characterStartIndex: number;
  readonly characterEndIndexExclusive: number;
  readonly startSeconds: number;
  readonly endSeconds: number;
  readonly keyCaption: boolean;
  readonly safeZone: "lower_safe_caption_zone";
  readonly alignmentStatus: "provider_character_timestamps_aligned";
}

export interface AudioAlignedSceneSubtitlePlan {
  readonly sceneId: string;
  readonly sceneOrder: number;
  readonly narration: string;
  readonly keyCaption: string;
  readonly audioDurationMs: number;
  readonly cues: readonly AudioAlignedSubtitleCue[];
  readonly alignmentStatus: "provider_character_timestamps_aligned";
  readonly audioAlignmentPerformed: true;
}

export interface AudioAlignedSubtitleTrack {
  readonly trackVersion: "audio-aligned-subtitle-track-v1";
  readonly sourceRenderCheckpointHash: string;
  readonly materializationSetId: string;
  readonly scenePlans: readonly AudioAlignedSceneSubtitlePlan[];
  readonly cues: readonly AudioAlignedSubtitleCue[];
  readonly safeZone: "lower_safe_caption_zone";
  readonly alignmentStatus: "provider_character_timestamps_aligned";
  readonly audioAlignmentPerformed: true;
  readonly estimatedFallbackUsed: false;
}

export interface VoiceSceneAudioMetadata {
  readonly schemaVersion: "voice-scene-audio-v1";
  readonly sceneAudioIdentity: string;
  readonly projectId: string;
  readonly projectRevision: number;
  readonly sourceRenderCheckpointHash: string;
  readonly providerId: VoiceMaterializationProviderId;
  readonly voiceId: string;
  readonly modelId: string;
  readonly outputFormat: VoiceMaterializationOutputFormat;
  readonly sceneId: string;
  readonly sceneOrder: number;
  readonly narrationHash: string;
  readonly characterCount: number;
  readonly audioSha256: string;
  readonly audioBytes: number;
  readonly durationMs: number;
  readonly codecName: string;
  readonly formatName: string;
  readonly alignmentHash: string;
  readonly alignment: ProviderCharacterAlignment;
  readonly alignmentStatus: "provider_character_timestamps_aligned";
  readonly audioAlignmentUsable: true;
  readonly subtitleTrack: AudioAlignedSceneSubtitlePlan;
  readonly createdAtIso: string;
  readonly immutableContentAddressed: true;
  readonly productionVoiceQualityApproved: false;
}

export interface VoiceMaterializationSceneEntry {
  readonly sceneId: string;
  readonly sceneOrder: number;
  readonly sceneAudioIdentity: string;
  readonly narration: string;
  readonly narrationHash: string;
  readonly characterCount: number;
  readonly status: VoiceMaterializationSceneStatus;
  readonly audioSha256: string | null;
  readonly audioBytes: number | null;
  readonly durationMs: number | null;
  readonly alignmentStatus: "provider_character_timestamps_aligned" | "unusable" | "not_available";
  readonly audioAlignmentUsable: boolean;
  readonly subtitleCueCount: number;
  readonly failureCode: string | null;
  readonly retryable: boolean;
}

export interface AudioMaterializationPackageBoundary {
  readonly packageType: "Audio Materialization Package";
  readonly allEnabledScenesMaterialized: boolean;
  readonly allAudioIntegrityValid: boolean;
  readonly allProviderAlignmentsUsable: boolean;
  readonly allAudioAlignedSubtitlePlansValid: boolean;
  readonly checkpointIdentityCurrent: boolean;
  readonly productionVoiceQualityApproval: "NOT_APPROVED";
  readonly finalRenderCreated: false;
  readonly actualVisualAssetsCreated: false;
  readonly pa3PreviewAudioMode: "SILENT_PLACEHOLDER";
}

export interface VoiceMaterializationSet {
  readonly schemaVersion: "voice-materialization-set-v1";
  readonly materializationSetId: string;
  readonly projectId: string;
  readonly projectRevision: number;
  readonly sourceRenderCheckpointHash: string;
  readonly renderManifestHash: string;
  readonly providerId: VoiceMaterializationProviderId;
  readonly voiceId: string;
  readonly modelId: string;
  readonly outputFormat: VoiceMaterializationOutputFormat;
  readonly executionMode: VoiceMaterializationExecutionMode;
  readonly maximumExternalGenerationRequests: number;
  readonly automaticRetryLimit: 0;
  readonly fallbackRequestLimit: 0;
  readonly planHash: string;
  readonly sceneEntries: readonly VoiceMaterializationSceneEntry[];
  readonly completeSceneIds: readonly string[];
  readonly failedSceneIds: readonly string[];
  readonly pendingSceneIds: readonly string[];
  readonly requestedCharacters: number;
  readonly successfulCharacters: number;
  readonly externalRequestCount: number;
  readonly createdAtIso: string;
  readonly updatedAtIso: string;
  readonly approvalState: VoiceMaterializationApprovalState;
  readonly approvalBoundary: AudioMaterializationPackageBoundary;
  readonly automaticRetryCount: 0;
  readonly costAmountStored: false;
}

export interface VoiceMaterializationExecutionResult {
  readonly ok: boolean;
  readonly set: VoiceMaterializationSet;
  readonly externalRequestsThisRun: number;
  readonly stoppedOnFirstFailure: boolean;
  readonly message: string;
}

export interface VoiceMaterializationRecoveryPlan {
  readonly schemaVersion: "voice-materialization-recovery-plan-v1";
  readonly materializationSetId: string;
  readonly stale: boolean;
  readonly staleReasons: readonly string[];
  readonly reusableSceneIds: readonly string[];
  readonly retryableSceneIds: readonly string[];
  readonly failedSceneIds: readonly string[];
  readonly pendingSceneIds: readonly string[];
  readonly blockedSceneIds: readonly string[];
  readonly automaticRetry: false;
  readonly ownerConfirmationRequired: true;
}

export interface RetryVoiceMaterializationPlan {
  readonly basePlan: VoiceMaterializationPlan;
  readonly requestedSceneIds: readonly string[];
  readonly maximumExternalRequests: number;
  readonly automaticRetry: false;
  readonly ownerConfirmationRequired: true;
}

export interface VoiceSceneAudioDescriptor {
  readonly sceneAudioIdentity: string;
  readonly mediaPath: string;
  readonly contentType: "audio/mpeg";
  readonly audioBytes: number;
  readonly audioSha256: string;
}

export interface VoiceMaterializationRuntimeOptions {
  readonly configuration: EditorialV2LocalStoreConfiguration;
  readonly apiKey: string;
  readonly fetchImpl?: typeof globalThis.fetch;
  readonly timeoutMs?: number;
  readonly now?: () => string;
}

export function parseExternalTtsEnabled(value: unknown): boolean {
  return value === "1" || value === "true";
}

export function isExternalTtsEnabled(env: Readonly<Record<string, string | undefined>>): boolean {
  return parseExternalTtsEnabled(env[SHORTS_EDITORIAL_OS_V2_EXTERNAL_TTS_ENABLED]);
}

export function isVoiceMaterializationIdentifier(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/u.test(value);
}

export function isSceneAudioIdentity(value: unknown): value is string {
  return typeof value === "string" && /^tts-[a-f0-9]{64}$/u.test(value);
}

export function isMaterializationSetId(value: unknown): value is string {
  return typeof value === "string" && /^voice-set-[a-f0-9]{64}$/u.test(value);
}
