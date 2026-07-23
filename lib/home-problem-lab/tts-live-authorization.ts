import { HOME_PROBLEM_LAB_CONFIG } from "./config";
import type {
  HomeProblemLabCredentialPresence,
  HomeProblemLabLiveAuthorization,
  HomeProblemLabLiveExecutionPermit,
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

export interface HomeProblemLabLiveExecutionPermitValidation {
  allowed: boolean;
  errorCode: string | null;
}

export interface HomeProblemLabSingleSampleInputValidation {
  allowed: boolean;
  sentenceCount: number;
  errors: string[];
}

export function countHomeProblemLabSentences(text: string): number {
  return text.split(/[.!?。！？]+/u).map((part) => part.trim()).filter(Boolean).length;
}

function countMatches(text: string, pattern: RegExp): number {
  return [...text.matchAll(pattern)].length;
}

/** Fail-closed contract for one paid Lumi sample, independent of generic mock TTS limits. */
export function validateHomeProblemLabSingleSampleInput(text: string): HomeProblemLabSingleSampleInputValidation {
  const errors: string[] = [];
  const trimmed = text.trim();
  const sentenceCount = countHomeProblemLabSentences(trimmed);
  const safety = HOME_PROBLEM_LAB_CONFIG.liveTtsSafety;
  if (!trimmed) errors.push("HOME_PROBLEM_LAB_TTS_SINGLE_SAMPLE_TEXT_REQUIRED");
  if (/[\r\n]/u.test(text)) errors.push("HOME_PROBLEM_LAB_TTS_SINGLE_SAMPLE_LINEBREAK_FORBIDDEN");
  if (trimmed.length < safety.liveOneShotMinCharacters) errors.push("HOME_PROBLEM_LAB_TTS_SINGLE_SAMPLE_TOO_SHORT");
  if (sentenceCount !== 1) errors.push("HOME_PROBLEM_LAB_TTS_SINGLE_SENTENCE_REQUIRED");
  if (/(?:^|\s)(?:[-*•]|\d+[.)]|[가-힣][.)])\s+/u.test(trimmed)) {
    errors.push("HOME_PROBLEM_LAB_TTS_SINGLE_SAMPLE_LIST_FORBIDDEN");
  }
  if (countMatches(trimmed, /;/gu) >= 2) errors.push("HOME_PROBLEM_LAB_TTS_SINGLE_SAMPLE_SEMICOLON_FORBIDDEN");
  if (countMatches(trimmed, /\/|\||->|→|⇒/gu) >= 2) {
    errors.push("HOME_PROBLEM_LAB_TTS_SINGLE_SAMPLE_REPEATED_SEPARATOR_FORBIDDEN");
  }
  if (!/[.!?。！？]/u.test(trimmed) && trimmed.length > safety.liveOneShotMaxCharacters) {
    errors.push("HOME_PROBLEM_LAB_TTS_SINGLE_SAMPLE_UNPUNCTUATED_TOO_LONG");
  }
  if (trimmed.length > safety.liveOneShotMaxCharacters) {
    errors.push("HOME_PROBLEM_LAB_TTS_SINGLE_SAMPLE_MAX_LENGTH_EXCEEDED");
  }
  return { allowed: errors.length === 0, sentenceCount, errors };
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
    sampleText: text,
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
  const inputValidation = validateHomeProblemLabSingleSampleInput(authorization.sampleText);
  if (authorization.batchSize !== 1 || authorization.sentenceCount !== inputValidation.sentenceCount || !inputValidation.allowed) {
    errors.push(...inputValidation.errors);
    if (authorization.batchSize !== 1 || authorization.sentenceCount !== inputValidation.sentenceCount) {
      errors.push("HOME_PROBLEM_LAB_TTS_SINGLE_SENTENCE_REQUIRED");
    }
  }
  if (!authorization.preflightPassed) errors.push("HOME_PROBLEM_LAB_TTS_PREFLIGHT_REQUIRED");
  if (authorization.instagramUpload || authorization.youtubeUpload || authorization.imageGeneration || authorization.productLookup) {
    errors.push("HOME_PROBLEM_LAB_TTS_SIDE_EFFECT_FLAGS_FORBIDDEN");
  }
  if (authorization.credentialPresence.apiKey !== "present" || authorization.credentialPresence.lumiVoiceId !== "present") {
    errors.push("HOME_PROBLEM_LAB_TTS_CREDENTIALS_NOT_PRESENT");
  }
  return { allowed: errors.length === 0, errors };
}

export function validateHomeProblemLabLiveExecutionPermit(
  permit: HomeProblemLabLiveExecutionPermit,
  requestId: string,
  now: number,
): HomeProblemLabLiveExecutionPermitValidation {
  if (permit.purpose !== "single_lumi_voice_sample") return { allowed: false, errorCode: "HOME_PROBLEM_LAB_TTS_PERMIT_PURPOSE_INVALID" };
  if (permit.engineId !== "home_problem_lab" || permit.characterId !== "lumi") {
    return { allowed: false, errorCode: "HOME_PROBLEM_LAB_TTS_PERMIT_SCOPE_INVALID" };
  }
  if (!permit.liveCallAuthorized) return { allowed: false, errorCode: "HOME_PROBLEM_LAB_TTS_PERMIT_NOT_AUTHORIZED" };
  if (permit.maxExternalCalls !== 1) return { allowed: false, errorCode: "HOME_PROBLEM_LAB_TTS_PERMIT_CALL_LIMIT_INVALID" };
  if (!permit.requestId.trim() || permit.requestId !== requestId) {
    return { allowed: false, errorCode: "HOME_PROBLEM_LAB_TTS_PERMIT_REQUEST_MISMATCH" };
  }
  if (permit.expiresAt <= now) return { allowed: false, errorCode: "HOME_PROBLEM_LAB_TTS_PERMIT_EXPIRED" };
  if (permit.instagramUpload || permit.youtubeUpload || permit.imageGeneration || permit.productLookup || permit.publish) {
    return { allowed: false, errorCode: "HOME_PROBLEM_LAB_TTS_PERMIT_SIDE_EFFECT_FLAGS_FORBIDDEN" };
  }
  return { allowed: true, errorCode: null };
}

/** Test fixture helper only. It grants no runtime credential or transport access by itself. */
export function createSyntheticHomeProblemLabLiveExecutionPermit(
  requestId: string,
  expiresAt: number,
): HomeProblemLabLiveExecutionPermit {
  return {
    purpose: "single_lumi_voice_sample",
    engineId: "home_problem_lab",
    characterId: "lumi",
    requestId,
    liveCallAuthorized: true,
    maxExternalCalls: 1,
    expiresAt,
    instagramUpload: false,
    youtubeUpload: false,
    imageGeneration: false,
    productLookup: false,
    publish: false,
  };
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
