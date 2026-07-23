import type {
  HomeProblemLabLumiTtsRequest,
  HomeProblemLabTtsPreflightResult,
} from "./types";

const MAX_CHARACTERS = 500;
const LONG_TEXT_WARNING_CHARACTERS = 300;
const MIN_DURATION_MS = 600;
const MAX_DURATION_MS = 60_000;

const HARD_FAIL_RULES: Array<{ code: string; pattern: RegExp }> = [
  { code: "TTS_FAKE_REVIEW", pattern: /제가\s*써봤|직접\s*써봤|사용해\s*봤/u },
  { code: "TTS_FAKE_NEDON", pattern: /내돈내산/u },
  { code: "TTS_EXAGGERATED_EFFICACY", pattern: /무조건|100\s*%\s*해결|완전\s*제거|인생템/u },
  { code: "TTS_DANGEROUS_CLEANING_MIX", pattern: /(락스|표백제).{0,24}(식초|산성|암모니아)|(식초|산성|암모니아).{0,24}(락스|표백제)/u },
  { code: "TTS_FORBIDDEN_TONE", pattern: /홈쇼핑|뉴스\s*앵커|ASMR|과한\s*애교|공포|위협/u },
];

export function estimateLumiTtsDurationMs(text: string, speed = 1.08): number {
  return Math.ceil((Math.max(text.trim().length, 1) / 7) * 1000 / speed);
}

export function preflightHomeProblemLabLumiTts(
  request: HomeProblemLabLumiTtsRequest,
): HomeProblemLabTtsPreflightResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const estimatedDurationMs = estimateLumiTtsDurationMs(request.normalizedText, request.voiceSettings.speed);

  if (!request.text.trim()) errors.push("TTS_TEXT_REQUIRED");
  if (!request.normalizedText.trim()) errors.push("TTS_NORMALIZED_TEXT_REQUIRED");
  if (request.normalizedText.length > MAX_CHARACTERS) errors.push("TTS_CHARACTER_LIMIT_EXCEEDED");
  if (request.normalizedText.length > LONG_TEXT_WARNING_CHARACTERS) warnings.push("TTS_LONG_TEXT_WARNING");
  if (estimatedDurationMs < MIN_DURATION_MS || estimatedDurationMs > MAX_DURATION_MS) errors.push("TTS_DURATION_OUT_OF_RANGE");
  if (request.engineId !== "home_problem_lab") errors.push("TTS_ENGINE_MISMATCH");
  if (request.characterId !== "lumi" || request.voiceProfileId !== "lumi_home_problem_lab" || request.voiceProfileVersion !== "v1") {
    errors.push("TTS_VOICE_PROFILE_MISMATCH");
  }
  if (!request.dryRun) errors.push("TTS_DRY_RUN_REQUIRED");

  const untrustedRequest = request as HomeProblemLabLumiTtsRequest & {
    voiceId?: unknown;
    voice_id?: unknown;
    externalCallRequested?: unknown;
  };
  if (Object.hasOwn(untrustedRequest, "voiceId") || Object.hasOwn(untrustedRequest, "voice_id")) {
    errors.push("TTS_VOICE_ID_EXPOSURE_BLOCKED");
  }
  if (untrustedRequest.externalCallRequested === true) errors.push("TTS_EXTERNAL_CALL_BLOCKED");

  for (const rule of HARD_FAIL_RULES) {
    if (rule.pattern.test(request.text)) errors.push(rule.code);
  }

  return {
    passed: errors.length === 0,
    errors,
    warnings,
    estimatedDurationMs,
    isMock: true,
    isPublishable: false,
    externalCallAllowed: false,
    voiceIdExposed: false,
  };
}
