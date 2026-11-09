import { HOME_PROBLEM_LAB_CONFIG } from "./config";
import { validateHomeProblemLabLiveAuthorization } from "./tts-live-authorization";
import type {
  HomeProblemLabAudioResponseMetadata,
  HomeProblemLabAudioResponseValidation,
  HomeProblemLabElevenLabsRequestEnvelope,
  HomeProblemLabLiveAuthorization,
  HomeProblemLabLiveTtsResult,
  HomeProblemLabLumiTtsRequest,
  HomeProblemLabSafeTtsLogEvent,
} from "./types";

const MIN_AUDIO_BYTES = 1024;
const MAX_AUDIO_BYTES = 25 * 1024 * 1024;

export interface HomeProblemLabTtsTransport {
  transportName: "disabled";
  supportsNetwork: false;
  execute(
    request: HomeProblemLabElevenLabsRequestEnvelope,
    authorization: HomeProblemLabLiveAuthorization,
  ): HomeProblemLabLiveTtsResult;
}

export function buildHomeProblemLabElevenLabsRequest(
  request: HomeProblemLabLumiTtsRequest,
  authorization: HomeProblemLabLiveAuthorization,
): HomeProblemLabElevenLabsRequestEnvelope {
  if (request.engineId !== "home_problem_lab") throw new Error("HOME_PROBLEM_LAB_TTS_ENGINE_MISMATCH");
  if (request.characterId !== "lumi" || request.voiceProfileId !== "lumi_home_problem_lab") {
    throw new Error("HOME_PROBLEM_LAB_TTS_PROFILE_MISMATCH");
  }
  if (request.model !== HOME_PROBLEM_LAB_CONFIG.lumiVoice.productionModel) {
    throw new Error("HOME_PROBLEM_LAB_TTS_LIVE_MODEL_MISMATCH");
  }
  if (!request.requestId.trim() || request.requestId !== authorization.requestId) {
    throw new Error("HOME_PROBLEM_LAB_TTS_REQUEST_ID_REQUIRED");
  }
  if (request.normalizedText.length > HOME_PROBLEM_LAB_CONFIG.liveTtsSafety.maxCharacters) {
    throw new Error("HOME_PROBLEM_LAB_TTS_TEXT_TOO_LONG");
  }
  return {
    provider: "elevenlabs_live",
    engineId: "home_problem_lab",
    characterId: "lumi",
    voiceProfileId: "lumi_home_problem_lab",
    requestId: request.requestId,
    text: request.text,
    normalizedText: request.normalizedText,
    model: HOME_PROBLEM_LAB_CONFIG.lumiVoice.productionModel,
    voiceSettings: request.voiceSettings,
    outputFormat: HOME_PROBLEM_LAB_CONFIG.liveTtsSafety.outputFormat,
    characterCount: request.normalizedText.length,
    estimatedBillableCharacters: request.normalizedText.length,
    timeoutMs: HOME_PROBLEM_LAB_CONFIG.liveTtsSafety.timeoutMs,
    maxExternalCalls: HOME_PROBLEM_LAB_CONFIG.liveTtsSafety.maxExternalCalls,
    retryCount: HOME_PROBLEM_LAB_CONFIG.liveTtsSafety.retryCount,
    credentialPresence: authorization.credentialPresence,
  };
}

export function validateHomeProblemLabAudioResponse(
  metadata: HomeProblemLabAudioResponseMetadata,
): HomeProblemLabAudioResponseValidation {
  if (metadata.timedOut) return { passed: false, errorCode: "HOME_PROBLEM_LAB_TTS_TIMEOUT", contentType: null, byteLength: 0 };
  if (metadata.status < 200 || metadata.status >= 300) {
    return { passed: false, errorCode: "HOME_PROBLEM_LAB_TTS_HTTP_FAILURE", contentType: null, byteLength: 0 };
  }
  if (metadata.contentType !== "audio/mpeg") {
    return { passed: false, errorCode: "HOME_PROBLEM_LAB_TTS_INVALID_CONTENT_TYPE", contentType: metadata.contentType, byteLength: 0 };
  }
  if (metadata.byteLength < MIN_AUDIO_BYTES) {
    return { passed: false, errorCode: "HOME_PROBLEM_LAB_TTS_AUDIO_TOO_SMALL", contentType: metadata.contentType, byteLength: metadata.byteLength };
  }
  if (metadata.byteLength > MAX_AUDIO_BYTES) {
    return { passed: false, errorCode: "HOME_PROBLEM_LAB_TTS_AUDIO_TOO_LARGE", contentType: metadata.contentType, byteLength: metadata.byteLength };
  }
  return { passed: true, errorCode: null, contentType: metadata.contentType, byteLength: metadata.byteLength };
}

export function createHomeProblemLabSafeTtsLogEvent(
  request: HomeProblemLabElevenLabsRequestEnvelope,
  outcomeCode: string,
): HomeProblemLabSafeTtsLogEvent {
  return {
    requestId: request.requestId,
    provider: request.provider,
    engineId: request.engineId,
    characterId: request.characterId,
    model: request.model,
    outputFormat: request.outputFormat,
    characterCount: request.characterCount,
    estimatedBillableCharacters: request.estimatedBillableCharacters,
    timeoutMs: request.timeoutMs,
    externalCallCount: 0,
    outcomeCode,
    credentialPresence: request.credentialPresence,
  };
}

export function findHomeProblemLabSensitiveLogFields(value: unknown, parentKey = ""): string[] {
  if (!value || typeof value !== "object") return [];
  const forbidden = new Set(["apikey", "voiceid", "authorization", "requesturl", "url", "headers", "secret", "voice_id"]);
  const fields: string[] = [];
  for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
    const normalizedKey = key.replaceAll("_", "").toLowerCase();
    const credentialStatusField = parentKey === "credentialPresence" && (key === "apiKey" || key === "lumiVoiceId");
    if (forbidden.has(normalizedKey) && !credentialStatusField) fields.push(key);
    fields.push(...findHomeProblemLabSensitiveLogFields(nested, key));
  }
  return fields;
}

function blockedLiveResult(request: HomeProblemLabElevenLabsRequestEnvelope, errorCode: string): HomeProblemLabLiveTtsResult {
  return {
    provider: "elevenlabs",
    isMock: false,
    isPublishable: false,
    audioGenerated: false,
    audioPath: null,
    durationMs: null,
    byteLength: null,
    contentType: null,
    outputFormat: request.outputFormat,
    requestId: request.requestId,
    externalCalls: 0,
    voiceIdExposed: false,
    secretExposed: false,
    uploadCandidate: false,
    validationPassed: false,
    errorCode,
  };
}

export class DisabledHomeProblemLabElevenLabsTransport implements HomeProblemLabTtsTransport {
  transportName = "disabled" as const;
  supportsNetwork = false as const;

  execute(
    request: HomeProblemLabElevenLabsRequestEnvelope,
    authorization: HomeProblemLabLiveAuthorization,
  ): HomeProblemLabLiveTtsResult {
    const authorizationResult = validateHomeProblemLabLiveAuthorization(authorization);
    if (!authorizationResult.allowed) return blockedLiveResult(request, authorizationResult.errors[0] ?? "HOME_PROBLEM_LAB_TTS_LIVE_NOT_AUTHORIZED");
    return blockedLiveResult(request, "HOME_PROBLEM_LAB_TTS_TRANSPORT_DISABLED");
  }
}
