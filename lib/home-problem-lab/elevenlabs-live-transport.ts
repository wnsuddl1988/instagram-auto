import { validateHomeProblemLabAudioResponse } from "./elevenlabs-tts-adapter";
import {
  validateHomeProblemLabLiveAuthorization,
  validateHomeProblemLabLiveExecutionPermit,
  validateHomeProblemLabSingleSampleInput,
} from "./tts-live-authorization";
import type { HomeProblemLabAudioSink } from "./tts-audio-sink";
import type { HomeProblemLabLiveCallRegistry } from "./tts-live-call-registry";
import type { HomeProblemLabLiveCredentialProvider } from "./tts-live-credential-boundary";
import type {
  HomeProblemLabElevenLabsRequestEnvelope,
  HomeProblemLabLiveAuthorization,
  HomeProblemLabLiveExecutionPermit,
  HomeProblemLabLiveTtsResult,
} from "./types";

const ELEVENLABS_TTS_ORIGIN = "https://api.elevenlabs.io";
const ELEVENLABS_TTS_PATH = "/v1/text-to-speech/";

export interface HomeProblemLabFetchResponse {
  status: number;
  headers: { get(name: string): string | null };
  arrayBuffer(): Promise<ArrayBuffer>;
}

export interface HomeProblemLabFetchRequest {
  method: "POST";
  headers: Record<"xi-api-key" | "Content-Type", string>;
  body: string;
  signal: AbortSignal;
}

export type HomeProblemLabFetchImpl = (
  input: string,
  init: HomeProblemLabFetchRequest,
) => Promise<HomeProblemLabFetchResponse>;

export interface HomeProblemLabElevenLabsLiveTransportDependencies {
  fetchImpl: HomeProblemLabFetchImpl;
  credentialProvider: HomeProblemLabLiveCredentialProvider;
  callRegistry: HomeProblemLabLiveCallRegistry;
  audioSink: HomeProblemLabAudioSink;
  now?: () => number;
  setTimeoutImpl?: (callback: () => void, milliseconds: number) => ReturnType<typeof setTimeout>;
  clearTimeoutImpl?: (timeout: ReturnType<typeof setTimeout>) => void;
}

function blockedResult(
  request: HomeProblemLabElevenLabsRequestEnvelope,
  errorCode: string,
  externalCalls = 0,
): HomeProblemLabLiveTtsResult {
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
    externalCalls,
    voiceIdExposed: false,
    secretExposed: false,
    uploadCandidate: false,
    validationPassed: false,
    errorCode,
  };
}

function classifyHttpFailure(status: number): string {
  if (status === 400 || status === 422) return "ELEVENLABS_REQUEST_REJECTED";
  if (status === 401 || status === 403) return "ELEVENLABS_UNAUTHORIZED";
  if (status === 429) return "ELEVENLABS_RATE_LIMITED";
  if (status >= 500 && status <= 599) return "ELEVENLABS_SERVER_ERROR";
  return "ELEVENLABS_HTTP_FAILURE";
}

function requestBody(request: HomeProblemLabElevenLabsRequestEnvelope): string {
  return JSON.stringify({
    text: request.normalizedText,
    model_id: request.model,
    voice_settings: {
      stability: request.voiceSettings.stability,
      similarity_boost: request.voiceSettings.similarityBoost,
      style: request.voiceSettings.style,
      use_speaker_boost: request.voiceSettings.useSpeakerBoost,
      speed: request.voiceSettings.speed,
    },
  });
}

export class HomeProblemLabElevenLabsLiveTransport {
  constructor(private readonly dependencies: HomeProblemLabElevenLabsLiveTransportDependencies) {}

  async execute(
    request: HomeProblemLabElevenLabsRequestEnvelope,
    authorization: HomeProblemLabLiveAuthorization,
    permit: HomeProblemLabLiveExecutionPermit,
  ): Promise<HomeProblemLabLiveTtsResult> {
    if (typeof this.dependencies.fetchImpl !== "function") {
      return blockedResult(request, "HOME_PROBLEM_LAB_TTS_FETCH_IMPL_REQUIRED");
    }
    if (!this.dependencies.audioSink || typeof this.dependencies.audioSink.saveVerifiedAudio !== "function") {
      return blockedResult(request, "HOME_PROBLEM_LAB_TTS_AUDIO_SINK_REQUIRED");
    }
    if (request.maxExternalCalls !== 1 || request.retryCount !== 0) {
      return blockedResult(request, "HOME_PROBLEM_LAB_TTS_CALL_POLICY_INVALID");
    }
    const finalInputValidation = validateHomeProblemLabSingleSampleInput(request.normalizedText);
    if (!finalInputValidation.allowed) {
      return blockedResult(request, finalInputValidation.errors[0] ?? "HOME_PROBLEM_LAB_TTS_SINGLE_SAMPLE_INPUT_INVALID");
    }
    const authorizationValidation = validateHomeProblemLabLiveAuthorization(authorization);
    if (!authorizationValidation.allowed) return blockedResult(request, authorizationValidation.errors[0] ?? "HOME_PROBLEM_LAB_TTS_LIVE_NOT_AUTHORIZED");

    const permitValidation = validateHomeProblemLabLiveExecutionPermit(
      permit,
      request.requestId,
      (this.dependencies.now ?? Date.now)(),
    );
    if (!permitValidation.allowed) return blockedResult(request, permitValidation.errorCode ?? "HOME_PROBLEM_LAB_TTS_PERMIT_INVALID");

    const presence = await this.dependencies.credentialProvider.getPresence();
    if (presence.apiKey !== "present" || presence.lumiVoiceId !== "present") {
      return blockedResult(request, "HOME_PROBLEM_LAB_TTS_CREDENTIALS_NOT_PRESENT");
    }

    const reservation = this.dependencies.callRegistry.reserve(request.requestId);
    if (!reservation.allowed) return blockedResult(request, reservation.errorCode ?? "HOME_PROBLEM_LAB_TTS_CALL_LIMIT_EXCEEDED");

    try {
      return await this.dependencies.credentialProvider.withCredentials(async (credentials) => {
        const controller = new AbortController();
        const setTimer = this.dependencies.setTimeoutImpl ?? setTimeout;
        const clearTimer = this.dependencies.clearTimeoutImpl ?? clearTimeout;
        const timeout = setTimer(() => controller.abort(), request.timeoutMs);
        let response: HomeProblemLabFetchResponse;
        try {
          const url = `${ELEVENLABS_TTS_ORIGIN}${ELEVENLABS_TTS_PATH}${encodeURIComponent(credentials.lumiVoiceId)}?output_format=${request.outputFormat}`;
          response = await this.dependencies.fetchImpl(url, {
            method: "POST",
            headers: {
              "xi-api-key": credentials.apiKey,
              "Content-Type": "application/json",
            },
            body: requestBody(request),
            signal: controller.signal,
          });
        } catch (_error) {
          this.dependencies.callRegistry.fail(request.requestId);
          return blockedResult(request, controller.signal.aborted ? "ELEVENLABS_TIMEOUT" : "ELEVENLABS_HTTP_FAILURE", 1);
        } finally {
          clearTimer(timeout);
        }

        if (response.status < 200 || response.status >= 300) {
          this.dependencies.callRegistry.fail(request.requestId);
          return blockedResult(request, classifyHttpFailure(response.status), 1);
        }

        const bytes = new Uint8Array(await response.arrayBuffer());
        const contentType = response.headers.get("content-type");
        const validation = validateHomeProblemLabAudioResponse({
          status: response.status,
          contentType,
          byteLength: bytes.byteLength,
          timedOut: false,
        });
        if (!validation.passed) {
          this.dependencies.callRegistry.fail(request.requestId);
          return blockedResult(request, validation.errorCode ?? "ELEVENLABS_AUDIO_INVALID", 1);
        }

        try {
          const stored = await this.dependencies.audioSink.saveVerifiedAudio({
            bytes,
            contentType: "audio/mpeg",
            requestId: request.requestId,
          });
          this.dependencies.callRegistry.complete(request.requestId);
          return {
            provider: "elevenlabs",
            isMock: false,
            isPublishable: false,
            audioGenerated: stored.audioGenerated,
            audioPath: stored.audioPath,
            durationMs: null,
            byteLength: validation.byteLength,
            contentType: validation.contentType,
            outputFormat: request.outputFormat,
            requestId: request.requestId,
            externalCalls: 1,
            voiceIdExposed: false,
            secretExposed: false,
            uploadCandidate: false,
            validationPassed: true,
            errorCode: "OK",
          };
        } catch (_error) {
          this.dependencies.callRegistry.fail(request.requestId);
          return blockedResult(request, "HOME_PROBLEM_LAB_TTS_AUDIO_SINK_FAILURE", 1);
        }
      });
    } catch (_error) {
      this.dependencies.callRegistry.fail(request.requestId);
      return blockedResult(request, "HOME_PROBLEM_LAB_TTS_CREDENTIAL_PROVIDER_FAILURE");
    }
  }
}
