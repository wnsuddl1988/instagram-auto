/**
 * paidApiGuard.ts — 유료 API 비용 가드레일
 *
 * 기본값은 "전부 차단". 아래 환경변수로 명시적으로 허용해야만 유료 호출이 발생한다.
 *
 * 환경변수 설정 방법 (.env.local):
 *   PAID_API_ENABLED=true          # 전체 허용 마스터 스위치
 *   ALLOW_OPENAI_GENERATE=true     # GPT 콘티 생성 (generate-v2)
 *   ALLOW_OPENAI_TTS=true          # OpenAI TTS (render-v2, voice-test)
 *   ALLOW_IMAGEN=true              # Google Imagen 이미지 생성 (render-v2)
 *   ALLOW_ELEVENLABS=true          # ElevenLabs TTS (render-v2, voice-test)
 *
 * 우선순위 규칙:
 *   1. PAID_API_ENABLED=false (또는 미설정) → 세부 플래그와 무관하게 전부 차단
 *   2. PAID_API_ENABLED=true + 세부 플래그 없음 → 전부 허용
 *   3. PAID_API_ENABLED=true + 세부 플래그 false → 해당 API만 차단
 */

export type PaidApiProvider =
  | "openai-generate"
  | "openai-tts"
  | "imagen"
  | "elevenlabs";

export interface GuardResult {
  allowed: boolean;
  provider: PaidApiProvider;
  operation: string;
  /** allowed=false 일 때 API 응답으로 바로 쓸 수 있는 JSON 객체 */
  blockedResponse?: {
    error: string;
    paidApiBlocked: true;
    provider: PaidApiProvider;
    operation: string;
    hint: string;
    requiredEnvVars: string[];
  };
}

/** 환경변수 플래그 → boolean 변환 (미설정은 false) */
function envFlag(key: string): boolean | undefined {
  const val = process.env[key];
  if (val === undefined) return undefined;
  return val.toLowerCase() === "true";
}

/**
 * 유료 API 호출 허용 여부를 확인한다.
 *
 * @param provider  어떤 유료 API를 사용할지
 * @param operation 로그/응답에 노출할 작업명 (예: "generate-v2", "tts-render")
 */
export function checkPaidApi(
  provider: PaidApiProvider,
  operation: string
): GuardResult {
  const masterEnabled = envFlag("PAID_API_ENABLED") === true;

  // 마스터 스위치가 꺼져있으면 즉시 차단
  if (!masterEnabled) {
    return buildBlocked(provider, operation, false);
  }

  // 세부 플래그 확인 (미설정이면 마스터 허용에 따름 → true)
  const perProviderAllowed = getPerProviderFlag(provider);
  if (!perProviderAllowed) {
    return buildBlocked(provider, operation, true);
  }

  return { allowed: true, provider, operation };
}

function getPerProviderFlag(provider: PaidApiProvider): boolean {
  const flagKey = providerToEnvKey(provider);
  const flag = envFlag(flagKey);
  // 세부 플래그 미설정 → 마스터가 true이므로 허용
  return flag !== false;
}

function providerToEnvKey(provider: PaidApiProvider): string {
  switch (provider) {
    case "openai-generate": return "ALLOW_OPENAI_GENERATE";
    case "openai-tts":      return "ALLOW_OPENAI_TTS";
    case "imagen":          return "ALLOW_IMAGEN";
    case "elevenlabs":      return "ALLOW_ELEVENLABS";
  }
}

function buildBlocked(
  provider: PaidApiProvider,
  operation: string,
  masterOn: boolean
): GuardResult {
  const requiredEnvVars = masterOn
    ? [providerToEnvKey(provider) + "=true"]
    : ["PAID_API_ENABLED=true", providerToEnvKey(provider) + "=true"];

  return {
    allowed: false,
    provider,
    operation,
    blockedResponse: {
      error: "유료 API 비활성화 상태입니다.",
      paidApiBlocked: true,
      provider,
      operation,
      hint: `예상 비용 확인 후 .env.local에 다음 변수를 설정하고 서버를 재시작하세요: ${requiredEnvVars.join(", ")}`,
      requiredEnvVars,
    },
  };
}

/**
 * 현재 유료 API 허용 상태 요약 (GET 메타데이터 등 무료 엔드포인트에서 사용 가능)
 */
export function getPaidApiStatus(): {
  masterEnabled: boolean;
  providers: Record<PaidApiProvider, boolean>;
} {
  const masterEnabled = envFlag("PAID_API_ENABLED") === true;
  const providers: Record<PaidApiProvider, boolean> = {
    "openai-generate": masterEnabled && getPerProviderFlag("openai-generate"),
    "openai-tts":      masterEnabled && getPerProviderFlag("openai-tts"),
    "imagen":          masterEnabled && getPerProviderFlag("imagen"),
    "elevenlabs":      masterEnabled && getPerProviderFlag("elevenlabs"),
  };
  return { masterEnabled, providers };
}
