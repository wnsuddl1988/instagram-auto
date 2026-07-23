import { HOME_PROBLEM_LAB_CONFIG } from "./config";
import { preflightHomeProblemLabLumiTts } from "./tts-preflight";
import { normalizeLumiTtsText } from "./tts-normalization";
import type {
  HomeProblemLabLumiTtsRequest,
  HomeProblemLabMockTtsResponse,
  HomeProblemLabTtsPreflightArtifact,
} from "./types";

export interface HomeProblemLabTtsProvider {
  providerName: "mock" | "elevenlabs_future";
  supportsExternalCalls: false;
  preflight(request: HomeProblemLabLumiTtsRequest): ReturnType<typeof preflightHomeProblemLabLumiTts>;
  synthesize(request: HomeProblemLabLumiTtsRequest): HomeProblemLabMockTtsResponse;
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

class MockHomeProblemLabTtsProvider implements HomeProblemLabTtsProvider {
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

class FutureElevenLabsHomeProblemLabTtsProvider implements HomeProblemLabTtsProvider {
  providerName = "elevenlabs_future" as const;
  supportsExternalCalls = false as const;

  preflight(request: HomeProblemLabLumiTtsRequest) {
    return preflightHomeProblemLabLumiTts(request);
  }

  synthesize(_request: HomeProblemLabLumiTtsRequest): HomeProblemLabMockTtsResponse {
    throw new Error("HOME_PROBLEM_LAB_ELEVENLABS_NOT_IMPLEMENTED");
  }
}

export function getHomeProblemLabTtsProvider(
  providerName: "mock" | "elevenlabs_future" = "mock",
): HomeProblemLabTtsProvider {
  if (providerName === "mock") return new MockHomeProblemLabTtsProvider();
  if (providerName === "elevenlabs_future") return new FutureElevenLabsHomeProblemLabTtsProvider();
  throw new Error("HOME_PROBLEM_LAB_TTS_PROVIDER_BLOCKED");
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
