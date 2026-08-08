import { createHash } from "node:crypto";

import { validateAudioAlignedSceneSubtitlePlan } from "./audio-alignment";
import type {
  ProviderAlignmentValidation,
  ProviderCharacterAlignment,
  VoiceAudioProbeSummary,
  VoiceMaterializationPlan,
  VoiceMaterializationRequest,
  VoiceMaterializationSet,
  VoiceSceneAudioMetadata,
} from "./voice-materialization-contracts";
import {
  ELEVENLABS_OUTPUT_FORMAT,
  PA4L_AUTOMATIC_RETRY_LIMIT,
  PA4L_FALLBACK_REQUEST_LIMIT,
  PA4L_MAX_EXTERNAL_GENERATION_REQUESTS,
  PA4L_MAX_NARRATION_CHARACTERS,
  PA4L_MAX_SCENES,
  PA4L_SINGLE_SCENE_LIVE_SMOKE_MODE,
  VOICE_MATERIALIZATION_MAX_AUDIO_DURATION_MS,
  VOICE_MATERIALIZATION_MAX_SCENE_AUDIO_BYTES,
  VOICE_MATERIALIZATION_MAX_SCENE_CHARACTERS,
  VOICE_MATERIALIZATION_MAX_SCENES,
  VOICE_MATERIALIZATION_MAX_TOTAL_CHARACTERS,
  VOICE_MATERIALIZATION_MIN_SCENES,
  VOICE_MATERIALIZATION_PROVIDER_ID,
  VOICE_MATERIALIZATION_STANDARD_EXECUTION_MODE,
  isMaterializationSetId,
  isSceneAudioIdentity,
  isVoiceMaterializationIdentifier,
} from "./voice-materialization-contracts";

const POST_KEYS = new Set([
  "action",
  "executionMode",
  "expectedProjectRevision",
  "expectedRenderCheckpointHash",
  "voiceId",
  "modelId",
  "expectedPlanHash",
  "ownerPaidExternalTtsConfirmation",
  "requestedSceneIds",
]);

function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const record = value as Readonly<Record<string, unknown>>;
  return `{${Object.keys(record).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`).join(",")}}`;
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeCrlf(value: string): string {
  return value.replace(/\r\n/gu, "\n");
}

function asAlignment(value: unknown): ProviderCharacterAlignment | null {
  if (!isRecord(value)) return null;
  const characters = value.characters;
  const starts = value.character_start_times_seconds ?? value.characterStartTimesSeconds;
  const ends = value.character_end_times_seconds ?? value.characterEndTimesSeconds;
  if (!Array.isArray(characters) || !Array.isArray(starts) || !Array.isArray(ends)) return null;
  return {
    characters: characters as readonly string[],
    characterStartTimesSeconds: starts as readonly number[],
    characterEndTimesSeconds: ends as readonly number[],
  };
}

export function validateProviderCharacterAlignment(
  value: unknown,
  canonicalNarration: string,
  normalizedAlignmentPresent = false,
): ProviderAlignmentValidation {
  const alignment = asAlignment(value);
  const issues: string[] = [];
  if (!alignment) {
    return {
      structurallyValid: false,
      audioAlignmentUsable: false,
      canonicalTextMatches: false,
      normalizedAlignmentPresent,
      normalizedAlignmentAuthoritative: false,
      alignmentHash: null,
      reconstructedText: "",
      finalEndSeconds: null,
      issues: ["alignment_shape_invalid"],
      alignment: null,
    };
  }
  const { characters, characterStartTimesSeconds: starts, characterEndTimesSeconds: ends } = alignment;
  if (characters.length === 0) issues.push("alignment_empty");
  if (characters.length !== starts.length || characters.length !== ends.length) issues.push("alignment_array_length_mismatch");
  let previousStart = -1;
  let previousEnd = -1;
  for (let index = 0; index < Math.max(characters.length, starts.length, ends.length); index += 1) {
    const character = characters[index];
    const start = starts[index];
    const end = ends[index];
    if (typeof character !== "string" || character.length === 0) issues.push(`alignment_character_invalid:${index}`);
    if (typeof start !== "number" || !Number.isFinite(start) || typeof end !== "number" || !Number.isFinite(end)) {
      issues.push(`alignment_time_nonfinite:${index}`);
      continue;
    }
    if (start < 0 || end < 0) issues.push(`alignment_time_negative:${index}`);
    if (start > end) issues.push(`alignment_start_after_end:${index}`);
    if (start < previousStart || end < previousEnd || start < previousEnd) issues.push(`alignment_time_backwards:${index}`);
    if (end * 1_000 > VOICE_MATERIALIZATION_MAX_AUDIO_DURATION_MS) issues.push(`alignment_duration_absurd:${index}`);
    previousStart = start;
    previousEnd = end;
  }
  const reconstructedText = characters.every((entry) => typeof entry === "string") ? characters.join("") : "";
  const canonicalTextMatches = normalizeCrlf(reconstructedText) === normalizeCrlf(canonicalNarration);
  if (!canonicalTextMatches) issues.push("alignment_canonical_text_mismatch");
  const structuralIssues = issues.filter((entry) => entry !== "alignment_canonical_text_mismatch");
  const structurallyValid = structuralIssues.length === 0;
  const audioAlignmentUsable = structurallyValid && canonicalTextMatches;
  return {
    structurallyValid,
    audioAlignmentUsable,
    canonicalTextMatches,
    normalizedAlignmentPresent,
    normalizedAlignmentAuthoritative: false,
    alignmentHash: structurallyValid ? sha256(stableStringify(alignment)) : null,
    reconstructedText,
    finalEndSeconds: structurallyValid && ends.length > 0 ? ends[ends.length - 1] ?? null : null,
    issues: [...new Set(issues)],
    alignment: structurallyValid ? alignment : null,
  };
}

export function validateVoiceMaterializationPlan(plan: VoiceMaterializationPlan): readonly string[] {
  const issues: string[] = [];
  if (plan.schemaVersion !== "voice-materialization-plan-v1") issues.push("plan_schema_invalid");
  if (!plan.projectId || !Number.isSafeInteger(plan.projectRevision) || plan.projectRevision < 0) issues.push("project_identity_invalid");
  if (![plan.projectIntegrityHash, plan.sourceRenderCheckpointHash, plan.planHash].every((value) => /^[a-f0-9]{64}$/u.test(value)) || !/^[a-f0-9]{32}$/u.test(plan.renderManifestHash)) issues.push("plan_hash_invalid");
  if (plan.providerId !== VOICE_MATERIALIZATION_PROVIDER_ID || plan.outputFormat !== ELEVENLABS_OUTPUT_FORMAT) issues.push("provider_contract_invalid");
  if (!isVoiceMaterializationIdentifier(plan.voiceId) || !isVoiceMaterializationIdentifier(plan.modelId)) issues.push("voice_or_model_invalid");
  if (!isMaterializationSetId(plan.materializationSetId)) issues.push("materialization_set_id_invalid");
  const executionMode = plan.executionMode ?? VOICE_MATERIALIZATION_STANDARD_EXECUTION_MODE;
  if (executionMode !== VOICE_MATERIALIZATION_STANDARD_EXECUTION_MODE && executionMode !== PA4L_SINGLE_SCENE_LIVE_SMOKE_MODE) issues.push("execution_mode_invalid");
  const pa4lMode = executionMode === PA4L_SINGLE_SCENE_LIVE_SMOKE_MODE;
  if (plan.sceneCount !== plan.scenes.length
    || (pa4lMode
      ? plan.sceneCount !== PA4L_MAX_SCENES || plan.plannedSceneCount !== PA4L_MAX_SCENES
      : plan.sceneCount < VOICE_MATERIALIZATION_MIN_SCENES || plan.sceneCount > VOICE_MATERIALIZATION_MAX_SCENES)) issues.push("scene_count_invalid");
  if (plan.totalCharacters !== plan.scenes.reduce((total, scene) => total + scene.characterCount, 0)
    || plan.totalCharacters > (pa4lMode ? PA4L_MAX_NARRATION_CHARACTERS : VOICE_MATERIALIZATION_MAX_TOTAL_CHARACTERS)) issues.push("total_character_cap_invalid");
  if (pa4lMode && (plan.maximumExternalGenerationRequests !== PA4L_MAX_EXTERNAL_GENERATION_REQUESTS
    || plan.automaticRetryLimit !== PA4L_AUTOMATIC_RETRY_LIMIT
    || plan.fallbackRequestLimit !== PA4L_FALLBACK_REQUEST_LIMIT)) issues.push("pa4l_execution_limits_invalid");
  if (!pa4lMode && plan.plannedSceneCount !== undefined && plan.plannedSceneCount !== plan.sceneCount) issues.push("planned_scene_count_invalid");
  if (!pa4lMode && plan.maximumExternalGenerationRequests !== undefined && plan.maximumExternalGenerationRequests !== plan.sceneCount) issues.push("standard_external_request_limit_invalid");
  if (!pa4lMode && ((plan.automaticRetryLimit !== undefined && plan.automaticRetryLimit !== 0) || (plan.fallbackRequestLimit !== undefined && plan.fallbackRequestLimit !== 0))) issues.push("standard_retry_or_fallback_limit_invalid");
  const ids = new Set<string>();
  for (const [index, scene] of plan.scenes.entries()) {
    if (!scene.sceneId || ids.has(scene.sceneId) || (pa4lMode ? !Number.isSafeInteger(scene.sceneOrder) || scene.sceneOrder < 1 : scene.sceneOrder !== index + 1)) issues.push("scene_identity_or_order_invalid");
    ids.add(scene.sceneId);
    if (!scene.narration || scene.characterCount !== [...scene.narration].length || scene.characterCount > (pa4lMode ? PA4L_MAX_NARRATION_CHARACTERS : VOICE_MATERIALIZATION_MAX_SCENE_CHARACTERS)) issues.push(`scene_character_cap_invalid:${scene.sceneId}`);
    if (sha256(scene.narration) !== scene.narrationHash || !isSceneAudioIdentity(scene.sceneAudioIdentity)) issues.push(`scene_content_identity_invalid:${scene.sceneId}`);
  }
  if (plan.externalCallRequired !== true || plan.externalCallExecuted !== false || plan.ownerConfirmationRequired !== true || plan.costAmountKnown !== false || plan.stopPolicy !== "STOP_ON_FIRST_EXTERNAL_FAILURE") issues.push("paid_call_boundary_invalid");
  return [...new Set(issues)];
}

export function validateVoiceMaterializationRequest(value: unknown): readonly string[] {
  if (!isRecord(value)) return ["request_object_required"];
  const issues: string[] = [];
  for (const key of Object.keys(value)) if (!POST_KEYS.has(key)) issues.push(`client_content_or_path_forbidden:${key}`);
  if (value.action !== "materialize") issues.push(value.action === "retry_failed" ? "pa4l_retry_not_activated" : "action_invalid");
  if (value.executionMode !== PA4L_SINGLE_SCENE_LIVE_SMOKE_MODE) issues.push(value.executionMode === VOICE_MATERIALIZATION_STANDARD_EXECUTION_MODE ? "live_full_materialization_not_activated" : "execution_mode_invalid");
  if (!Number.isSafeInteger(value.expectedProjectRevision) || Number(value.expectedProjectRevision) < 0) issues.push("project_revision_invalid");
  if (typeof value.expectedRenderCheckpointHash !== "string" || !/^[a-f0-9]{64}$/u.test(value.expectedRenderCheckpointHash)) issues.push("render_checkpoint_hash_invalid");
  if (!isVoiceMaterializationIdentifier(value.voiceId) || !isVoiceMaterializationIdentifier(value.modelId)) issues.push("voice_or_model_invalid");
  if (typeof value.expectedPlanHash !== "string" || !/^[a-f0-9]{64}$/u.test(value.expectedPlanHash)) issues.push("plan_hash_invalid");
  if (value.ownerPaidExternalTtsConfirmation !== true) issues.push("owner_paid_external_tts_confirmation_required");
  if (!Array.isArray(value.requestedSceneIds)
    || value.requestedSceneIds.length !== PA4L_MAX_SCENES
    || value.requestedSceneIds.some((entry) => typeof entry !== "string" || !/^[A-Za-z0-9][A-Za-z0-9_-]{0,127}$/u.test(entry))
    || new Set(value.requestedSceneIds).size !== value.requestedSceneIds.length) issues.push("pa4l_requested_scene_exactly_one_required");
  return [...new Set(issues)];
}

export function parseVoiceMaterializationRequest(value: unknown): VoiceMaterializationRequest {
  const issues = validateVoiceMaterializationRequest(value);
  if (issues.length > 0) throw new Error(`VOICE_MATERIALIZATION_REQUEST_INVALID:${issues.join(",")}`);
  const record = value as Readonly<Record<string, unknown>>;
  return {
    action: record.action as VoiceMaterializationRequest["action"],
    executionMode: PA4L_SINGLE_SCENE_LIVE_SMOKE_MODE,
    expectedProjectRevision: Number(record.expectedProjectRevision),
    expectedRenderCheckpointHash: String(record.expectedRenderCheckpointHash),
    voiceId: String(record.voiceId),
    modelId: String(record.modelId),
    expectedPlanHash: String(record.expectedPlanHash),
    ownerPaidExternalTtsConfirmation: true,
    ...(Array.isArray(record.requestedSceneIds) ? { requestedSceneIds: record.requestedSceneIds.map(String) } : {}),
  };
}

export function validateVoiceAudioProbe(probe: VoiceAudioProbeSummary, audioBytes: number): readonly string[] {
  const issues: string[] = [];
  if (!Number.isSafeInteger(audioBytes) || audioBytes <= 0 || audioBytes > VOICE_MATERIALIZATION_MAX_SCENE_AUDIO_BYTES) issues.push("audio_size_invalid");
  if (!probe.audioStreamPresent || probe.videoStreamPresent) issues.push("audio_stream_invalid");
  if (!Number.isFinite(probe.durationMs) || probe.durationMs <= 0 || probe.durationMs > VOICE_MATERIALIZATION_MAX_AUDIO_DURATION_MS) issues.push("audio_duration_invalid");
  const compatibleCodec = ["mp3", "mp3float"].includes(probe.codecName.toLowerCase()) || probe.formatName.toLowerCase().split(",").includes("mp3");
  if (!compatibleCodec) issues.push("audio_codec_not_mp3_compatible");
  return issues;
}

export function validateAlignmentAudioDuration(alignmentEndSeconds: number | null, audioDurationMs: number): readonly string[] {
  if (alignmentEndSeconds === null || !Number.isFinite(alignmentEndSeconds)) return ["alignment_final_end_invalid"];
  const differenceMs = Math.abs(alignmentEndSeconds * 1_000 - audioDurationMs);
  const toleranceMs = Math.max(300, audioDurationMs * 0.05);
  return differenceMs <= toleranceMs ? [] : ["alignment_audio_duration_mismatch"];
}

export function validateVoiceSceneAudioMetadata(metadata: VoiceSceneAudioMetadata): readonly string[] {
  const issues: string[] = [];
  if (metadata.schemaVersion !== "voice-scene-audio-v1" || !isSceneAudioIdentity(metadata.sceneAudioIdentity)) issues.push("scene_audio_schema_or_identity_invalid");
  if (![metadata.sourceRenderCheckpointHash, metadata.narrationHash, metadata.audioSha256, metadata.alignmentHash].every((value) => /^[a-f0-9]{64}$/u.test(value))) issues.push("scene_audio_hash_invalid");
  if (metadata.providerId !== VOICE_MATERIALIZATION_PROVIDER_ID || metadata.outputFormat !== ELEVENLABS_OUTPUT_FORMAT) issues.push("scene_audio_provider_invalid");
  if (!isVoiceMaterializationIdentifier(metadata.voiceId) || !isVoiceMaterializationIdentifier(metadata.modelId)) issues.push("scene_audio_voice_invalid");
  issues.push(...validateVoiceAudioProbe({ audioStreamPresent: true, videoStreamPresent: false, codecName: metadata.codecName, formatName: metadata.formatName, durationMs: metadata.durationMs }, metadata.audioBytes));
  if (!metadata.audioAlignmentUsable || metadata.alignmentStatus !== "provider_character_timestamps_aligned") issues.push("scene_alignment_unusable");
  issues.push(...validateAudioAlignedSceneSubtitlePlan(metadata.subtitleTrack));
  issues.push(...validateAlignmentAudioDuration(metadata.alignment.characterEndTimesSeconds.at(-1) ?? null, metadata.durationMs));
  return [...new Set(issues)];
}

export function validateVoiceMaterializationSet(set: VoiceMaterializationSet): readonly string[] {
  const issues: string[] = [];
  if (set.schemaVersion !== "voice-materialization-set-v1" || !isMaterializationSetId(set.materializationSetId)) issues.push("set_schema_or_identity_invalid");
  if (set.providerId !== VOICE_MATERIALIZATION_PROVIDER_ID || set.outputFormat !== ELEVENLABS_OUTPUT_FORMAT || !/^[a-f0-9]{64}$/u.test(set.planHash)) issues.push("set_provider_or_plan_invalid");
  if (set.requestedCharacters !== set.sceneEntries.reduce((total, scene) => total + scene.characterCount, 0)) issues.push("set_requested_characters_invalid");
  const complete = set.sceneEntries.filter((scene) => scene.status === "cache_hit" || scene.status === "generated");
  if (set.successfulCharacters !== complete.reduce((total, scene) => total + scene.characterCount, 0)) issues.push("set_successful_characters_invalid");
  if (set.externalRequestCount < 0 || !Number.isSafeInteger(set.externalRequestCount) || set.automaticRetryCount !== 0 || set.costAmountStored !== false) issues.push("set_external_request_accounting_invalid");
  if (set.executionMode === PA4L_SINGLE_SCENE_LIVE_SMOKE_MODE
    && (set.sceneEntries.length !== PA4L_MAX_SCENES
      || set.externalRequestCount > PA4L_MAX_EXTERNAL_GENERATION_REQUESTS
      || set.maximumExternalGenerationRequests !== PA4L_MAX_EXTERNAL_GENERATION_REQUESTS
      || set.automaticRetryLimit !== 0
      || set.fallbackRequestLimit !== 0)) issues.push("pa4l_set_limits_invalid");
  if (JSON.stringify(set).toLowerCase().includes("xi-api-key") || Object.keys(set as unknown as Record<string, unknown>).some((key) => key.toLowerCase().includes("apikey"))) issues.push("secret_metadata_forbidden");
  const shouldApprove = set.failedSceneIds.length === 0 && set.pendingSceneIds.length === 0 && complete.length === set.sceneEntries.length && complete.every((scene) => scene.audioAlignmentUsable && scene.subtitleCueCount > 0);
  if ((set.approvalState === "approved") !== shouldApprove) issues.push("set_approval_state_invalid");
  if (set.approvalBoundary.productionVoiceQualityApproval !== "NOT_APPROVED" || set.approvalBoundary.finalRenderCreated !== false || set.approvalBoundary.pa3PreviewAudioMode !== "SILENT_PLACEHOLDER") issues.push("production_boundary_invalid");
  return [...new Set(issues)];
}
