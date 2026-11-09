import {
  inflationScriptPackage30,
  exchangeRateScriptPackage15,
} from "@/lib/scripts/fixtures";
import {
  inflationBlueprint30,
} from "@/lib/blueprints/fixtures";
import { DEFAULT_MONEY_SHORTS_VOICE_PROFILE } from "./profiles";
import { formatScriptPackageForTts, formatBlueprintForTts } from "./formatter";
import type { TtsScriptPackage } from "./types";

const MOCK_CREATED_AT = "2026-06-25T00:00:00+09:00";

/** TTS script from the inflation 30s script package. */
export const inflationTtsPackage30: TtsScriptPackage = formatScriptPackageForTts(
  inflationScriptPackage30,
  DEFAULT_MONEY_SHORTS_VOICE_PROFILE,
  {
    ttsPackageId: "tts-mock-inflation-30s",
    targetDurationSec: 30,
    createdAt: MOCK_CREATED_AT,
  },
);

/** TTS script from the exchange rate 15s script package. */
export const exchangeRateTtsPackage15: TtsScriptPackage = formatScriptPackageForTts(
  exchangeRateScriptPackage15,
  DEFAULT_MONEY_SHORTS_VOICE_PROFILE,
  {
    ttsPackageId: "tts-mock-usd-krw-15s",
    targetDurationSec: 15,
    createdAt: MOCK_CREATED_AT,
  },
);

/** TTS script from the inflation blueprint (blueprint source type). */
export const inflationBlueprintTtsPackage: TtsScriptPackage = formatBlueprintForTts(
  inflationBlueprint30,
  DEFAULT_MONEY_SHORTS_VOICE_PROFILE,
  {
    ttsPackageId: "tts-mock-inflation-bp-30s",
    createdAt: MOCK_CREATED_AT,
  },
);

export const MOCK_TTS_PACKAGES: TtsScriptPackage[] = [
  inflationTtsPackage30,
  exchangeRateTtsPackage15,
  inflationBlueprintTtsPackage,
];
