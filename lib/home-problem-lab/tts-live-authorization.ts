import type {
  HomeProblemLabCredentialPresence,
  HomeProblemLabLiveAuthorization,
} from "./types";

export const HOME_PROBLEM_LAB_UNCHECKED_CREDENTIALS: HomeProblemLabCredentialPresence = {
  apiKey: "unchecked",
  lumiVoiceId: "unchecked",
};

export interface HomeProblemLabLiveAuthorizationValidation {
  allowed: boolean;
  errors: string[];
}

export interface HomeProblemLabLiveCallGuardResult {
  allowed: boolean;
  errorCode: string | null;
}

export function countHomeProblemLabSentences(text: string): number {
  return text.split(/[.!?。！？]+/u).map((part) => part.trim()).filter(Boolean).length;
}

export function createHomeProblemLabUncheckedLiveAuthorization(
  requestId: string,
  text: string,
): HomeProblemLabLiveAuthorization {
  return {
    engineId: "home_problem_lab",
    characterId: "lumi",
    voiceProfileId: "lumi_home_problem_lab",
    provider: "elevenlabs_live",
    dryRun: false,
    liveCallAuthorized: false,
    maxExternalCalls: 1,
    requestId,
    batchSize: 1,
    sentenceCount: countHomeProblemLabSentences(text),
    preflightPassed: false,
    instagramUpload: false,
    youtubeUpload: false,
    imageGeneration: false,
    productLookup: false,
    credentialPresence: HOME_PROBLEM_LAB_UNCHECKED_CREDENTIALS,
  };
}

export function validateHomeProblemLabLiveAuthorization(
  authorization: HomeProblemLabLiveAuthorization,
): HomeProblemLabLiveAuthorizationValidation {
  const errors: string[] = [];
  if (authorization.engineId !== "home_problem_lab") errors.push("HOME_PROBLEM_LAB_TTS_ENGINE_MISMATCH");
  if (authorization.characterId !== "lumi" || authorization.voiceProfileId !== "lumi_home_problem_lab") {
    errors.push("HOME_PROBLEM_LAB_TTS_PROFILE_MISMATCH");
  }
  if (authorization.provider !== "elevenlabs_live") errors.push("HOME_PROBLEM_LAB_TTS_PROVIDER_INVALID");
  if (authorization.dryRun !== false) errors.push("HOME_PROBLEM_LAB_TTS_LIVE_REQUIRES_DRY_RUN_FALSE");
  if (!authorization.liveCallAuthorized) errors.push("HOME_PROBLEM_LAB_TTS_LIVE_NOT_AUTHORIZED");
  if (authorization.maxExternalCalls !== 1) errors.push("HOME_PROBLEM_LAB_TTS_CALL_LIMIT_EXCEEDED");
  if (!authorization.requestId.trim()) errors.push("HOME_PROBLEM_LAB_TTS_REQUEST_ID_REQUIRED");
  if (authorization.batchSize !== 1 || authorization.sentenceCount !== 1) errors.push("HOME_PROBLEM_LAB_TTS_SINGLE_SENTENCE_REQUIRED");
  if (!authorization.preflightPassed) errors.push("HOME_PROBLEM_LAB_TTS_PREFLIGHT_REQUIRED");
  if (authorization.instagramUpload || authorization.youtubeUpload || authorization.imageGeneration || authorization.productLookup) {
    errors.push("HOME_PROBLEM_LAB_TTS_SIDE_EFFECT_FLAGS_FORBIDDEN");
  }
  if (authorization.credentialPresence.apiKey !== "present" || authorization.credentialPresence.lumiVoiceId !== "present") {
    errors.push("HOME_PROBLEM_LAB_TTS_CREDENTIALS_NOT_PRESENT");
  }
  return { allowed: errors.length === 0, errors };
}

export class HomeProblemLabLiveCallGuard {
  private readonly seenRequestIds = new Set<string>();
  private reservations = 0;

  reserve(requestId: string): HomeProblemLabLiveCallGuardResult {
    if (!requestId.trim()) return { allowed: false, errorCode: "HOME_PROBLEM_LAB_TTS_REQUEST_ID_REQUIRED" };
    if (this.seenRequestIds.has(requestId)) return { allowed: false, errorCode: "HOME_PROBLEM_LAB_TTS_DUPLICATE_REQUEST" };
    if (this.reservations >= 1) return { allowed: false, errorCode: "HOME_PROBLEM_LAB_TTS_CALL_LIMIT_EXCEEDED" };
    this.seenRequestIds.add(requestId);
    this.reservations += 1;
    return { allowed: true, errorCode: null };
  }
}
