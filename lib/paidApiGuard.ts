/**
 * paidApiGuard.ts — 유료 API 비용 가드레일 (fail-closed)
 *
 * 기본값은 "전부 차단". 마스터 스위치와 provider별 세부 플래그가 **둘 다** true여야만
 * 유료 호출이 발생한다. 마스터 스위치 하나만으로는 어떤 provider도 열리지 않는다.
 *
 * 환경변수 설정 방법 (.env.local):
 *   PAID_API_ENABLED=true          # 전체 허용 마스터 스위치 (단독으로는 불충분)
 *   ALLOW_OPENAI_GENERATE=true     # GPT 콘티 생성 (generate-v2)
 *   ALLOW_OPENAI_TTS=true          # OpenAI TTS (render-v2, voice-test)
 *   ALLOW_IMAGEN=true              # Google Imagen 이미지 생성 (render-v2)
 *   ALLOW_OPENAI_IMAGE=true        # OpenAI gpt-image 이미지 생성 (paid image script)
 *   ALLOW_BFL_FLUX2=true           # BFL FLUX.2 이미지 생성 (paid image script)
 *   ALLOW_ELEVENLABS=true          # ElevenLabs TTS (render-v2, voice-test)
 *
 * 우선순위 규칙 (fail-closed, 2026-07-04 하드닝):
 *   1. PAID_API_ENABLED=false (또는 미설정) → 세부 플래그와 무관하게 전부 차단
 *   2. PAID_API_ENABLED=true + 세부 플래그 미설정(undefined) → **차단** (fail-closed)
 *   3. PAID_API_ENABLED=true + 세부 플래그 false → 해당 API 차단
 *   4. PAID_API_ENABLED=true + 세부 플래그 true → 해당 API만 허용
 *
 * Owner decision (golden-sample-v3-2, image_script_allow_guard =
 *   add_allow_guard_to_all_paid_image_scripts): 이미지 provider는 반드시 명시
 *   provider allow flag가 있어야 하며 마스터 스위치만으로 열려선 안 된다.
 */

export type PaidApiProvider =
  | "openai-generate"
  | "openai-tts"
  | "imagen"
  | "openai-image"
  | "bfl-flux2"
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

  // 세부 플래그 확인 (fail-closed: 미설정/false 모두 차단, true만 허용)
  const perProviderAllowed = getPerProviderFlag(provider);
  if (!perProviderAllowed) {
    return buildBlocked(provider, operation, true);
  }

  return { allowed: true, provider, operation };
}

function getPerProviderFlag(provider: PaidApiProvider): boolean {
  const flagKey = providerToEnvKey(provider);
  const flag = envFlag(flagKey);
  // fail-closed: 세부 플래그가 명시적으로 true일 때만 허용.
  // 미설정(undefined)이나 false는 마스터가 켜져 있어도 차단한다.
  return flag === true;
}

function providerToEnvKey(provider: PaidApiProvider): string {
  switch (provider) {
    case "openai-generate": return "ALLOW_OPENAI_GENERATE";
    case "openai-tts":      return "ALLOW_OPENAI_TTS";
    case "imagen":          return "ALLOW_IMAGEN";
    case "openai-image":    return "ALLOW_OPENAI_IMAGE";
    case "bfl-flux2":       return "ALLOW_BFL_FLUX2";
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
    "openai-image":    masterEnabled && getPerProviderFlag("openai-image"),
    "bfl-flux2":       masterEnabled && getPerProviderFlag("bfl-flux2"),
    "elevenlabs":      masterEnabled && getPerProviderFlag("elevenlabs"),
  };
  return { masterEnabled, providers };
}
