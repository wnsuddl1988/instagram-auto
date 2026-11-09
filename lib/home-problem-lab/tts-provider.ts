import { HOME_PROBLEM_LAB_CONFIG } from "./config";
import {
  buildHomeProblemLabElevenLabsRequest,
  DisabledHomeProblemLabElevenLabsTransport,
} from "./elevenlabs-tts-adapter";
import { preflightHomeProblemLabLumiTts } from "./tts-preflight";
import { normalizeLumiTtsText } from "./tts-normalization";
import type {
  HomeProblemLabLumiTtsRequest,
  HomeProblemLabLiveAuthorization,
  HomeProblemLabLiveTtsResult,
  HomeProblemLabMockTtsResponse,
  HomeProblemLabTtsProviderMode,
  HomeProblemLabTtsPreflightArtifact,
} from "./types";

export interface HomeProblemLabTtsProvider {
  providerName: HomeProblemLabTtsProviderMode;
  supportsExternalCalls: false;
  preflight(request: HomeProblemLabLumiTtsRequest): ReturnType<typeof preflightHomeProblemLabLumiTts>;
}

export interface HomeProblemLabMockTtsProvider extends HomeProblemLabTtsProvider {
  providerName: "mock";
  synthesize(request: HomeProblemLabLumiTtsRequest): HomeProblemLabMockTtsResponse;
}

export interface HomeProblemLabLiveTtsProvider extends HomeProblemLabTtsProvider {
  providerName: "elevenlabs_live";
  synthesizeLive(
    request: HomeProblemLabLumiTtsRequest,
    authorization: HomeProblemLabLiveAuthorization,
  ): HomeProblemLabLiveTtsResult;
}

export function createHomeProblemLabLumiTtsRequest(text: string, requestId: string): HomeProblemLabLumiTtsRequest {
  return {
    engineId: "home_problem_lab",
    characterId: "lumi",
    voiceProfileId: "lumi_home_problem_lab",
    voiceProfileVersion: "v1",
    text,
    normalizedText: normalizeLumiTtsText(text),
    language: "ko",
    model: HOME_PROBLEM_LAB_CONFIG.lumiVoice.previewModel,
    voiceSettings: {
      stability: HOME_PROBLEM_LAB_CONFIG.lumiVoice.stability,
      similarityBoost: HOME_PROBLEM_LAB_CONFIG.lumiVoice.similarityBoost,
      style: HOME_PROBLEM_LAB_CONFIG.lumiVoice.style,
      useSpeakerBoost: HOME_PROBLEM_LAB_CONFIG.lumiVoice.useSpeakerBoost,
      speed: HOME_PROBLEM_LAB_CONFIG.lumiVoice.speed,
    },
    outputFormat: "mp3_44100_128",
    dryRun: true,
    requestId,
  };
}

export function createHomeProblemLabLumiLiveTtsRequest(text: string, requestId: string): HomeProblemLabLumiTtsRequest {
  return {
    ...createHomeProblemLabLumiTtsRequest(text, requestId),
    model: HOME_PROBLEM_LAB_CONFIG.lumiVoice.productionModel,
    dryRun: false,
  };
}

class MockHomeProblemLabTtsProvider implements HomeProblemLabMockTtsProvider {
  providerName = "mock" as const;
  supportsExternalCalls = false as const;

  preflight(request: HomeProblemLabLumiTtsRequest) {
    return preflightHomeProblemLabLumiTts(request);
  }

  synthesize(request: HomeProblemLabLumiTtsRequest): HomeProblemLabMockTtsResponse {
    const preflight = this.preflight(request);
    if (!preflight.passed) throw new Error(`HOME_PROBLEM_LAB_TTS_PREFLIGHT_BLOCKED:${preflight.errors.join(",")}`);
    return {
      isMock: true,
      isPublishable: false,
      externalCalls: 0,
      provider: "mock",
      character: "lumi",
      durationEstimateMs: preflight.estimatedDurationMs,
      characterCount: request.normalizedText.length,
      normalizedText: request.normalizedText,
      outputFormat: request.outputFormat,
      audioGenerated: false,
      audioPath: null,
      voiceIdExposed: false,
      uploadCandidate: false,
    };
  }
}

class DisabledElevenLabsLiveHomeProblemLabTtsProvider implements HomeProblemLabLiveTtsProvider {
  providerName = "elevenlabs_live" as const;
  supportsExternalCalls = false as const;
  private readonly transport = new DisabledHomeProblemLabElevenLabsTransport();

  preflight(request: HomeProblemLabLumiTtsRequest) {
    return preflightHomeProblemLabLumiTts(request);
  }

  synthesizeLive(
    request: HomeProblemLabLumiTtsRequest,
    authorization: HomeProblemLabLiveAuthorization,
  ): HomeProblemLabLiveTtsResult {
    const requestEnvelope = buildHomeProblemLabElevenLabsRequest(request, authorization);
    return this.transport.execute(requestEnvelope, authorization);
  }
}

export function getHomeProblemLabTtsProvider(): HomeProblemLabMockTtsProvider;
export function getHomeProblemLabTtsProvider(providerName: "mock"): HomeProblemLabMockTtsProvider;
export function getHomeProblemLabTtsProvider(providerName: "elevenlabs_live"): HomeProblemLabLiveTtsProvider;
export function getHomeProblemLabTtsProvider(
  providerName: string = HOME_PROBLEM_LAB_CONFIG.liveTtsSafety.defaultProvider,
): HomeProblemLabTtsProvider {
  if (providerName === "mock") return new MockHomeProblemLabTtsProvider();
  if (providerName === "elevenlabs_live") return new DisabledElevenLabsLiveHomeProblemLabTtsProvider();
  throw new Error("HOME_PROBLEM_LAB_TTS_PROVIDER_INVALID");
}

export function createHomeProblemLabLumiMockPreflight(dialogue: string, requestId: string): HomeProblemLabTtsPreflightArtifact {
  const request = createHomeProblemLabLumiTtsRequest(dialogue, requestId);
  const provider = getHomeProblemLabTtsProvider();
  const preflight = provider.preflight(request);
  return {
    dialogue,
    request,
    preflight,
    response: provider.synthesize(request),
  };
}
