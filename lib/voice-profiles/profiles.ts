import { VOICE_PROFILE_SCHEMA_VERSION } from "./types";
import type { VoiceProfile } from "./types";

/**
 * Default Money Shorts OS voice profile.
 * Korean male, calm + confident, warm but not soft, clear pronunciation.
 * Matches the spec from HANDOFF_NOW §Approved Scope.
 */
export const DEFAULT_MONEY_SHORTS_VOICE_PROFILE: VoiceProfile = {
  schemaVersion: VOICE_PROFILE_SCHEMA_VERSION,
  profileId: "voice-profile-money-shorts-ko-male-calm-v1",
  profileName: "Money Shorts OS — 한국어 남성 차분 신뢰형",
  description:
    "한국어, 남성, 차분하고 자신감 있는 톤. 따뜻하되 부드럽지 않음. 명확한 발음, 너무 느리지 않음. 광고 말투 아님, 뉴스 앵커 말투 아님.",
  provider: "elevenlabs",
  locale: "ko-KR",
  gender: "male",
  style: "calm_confident",
  providerSettings: {
    voiceId: "ELEVENLABS_VOICE_ID_PENDING",
    speedMultiplier: 1.0,
    stability: 0.75,
    similarity: 0.8,
    extras: {
      selectionStatus: "pending_owner_selection",
      targetStyle: "calm_confident_korean_male",
    },
  },
  narrationGuidelines: [
    "짧고 명확한 문장으로 구성한다.",
    "수치는 한국어 발음 기준으로 표기한다 (예: 3.2% → '3.2퍼센트').",
    "광고성 감탄어, 과장 표현, FOMO 유발 문구를 쓰지 않는다.",
    "뉴스 앵커식 딱딱한 어투보다는 신뢰할 수 있는 지인의 설명 스타일.",
    "CTA는 마지막 씬에만 자연스럽게 삽입한다.",
  ],
  createdAt: "2026-06-25T00:00:00+09:00",
};

export const MOCK_VOICE_PROFILES: VoiceProfile[] = [
  DEFAULT_MONEY_SHORTS_VOICE_PROFILE,
];
