import voiceCastData from "./finance-character-voice-cast-data.json";
import {
  financeCharacterForSubtopic,
  type FinanceCharacterId,
} from "./finance-character-cast";
import type { FinanceEditorialSubtopicId } from "./finance-editorial-topic-bank";

export const FINANCE_CHARACTER_VOICE_CAST_VERSION = voiceCastData.version;
export const FINANCE_CHARACTER_VOICE_CAST_STATUS = voiceCastData.status;
export const FINANCE_CHARACTER_VOICE_MODEL_ID = voiceCastData.baseline.modelId;
export const FINANCE_CHARACTER_VOICE_PRODUCTION_PRESET = voiceCastData.baseline.productionVoicePreset;

export type FinanceCharacterVoiceProfile = {
  characterId: FinanceCharacterId;
  characterName: string;
  characterLabel: string;
  subtopics: FinanceEditorialSubtopicId[];
  voiceLabel: string;
  voiceId: string;
  voiceStatus: "approved";
  settings: {
    speed: number;
    stability: number;
    similarityBoost: number;
    style: number;
    useSpeakerBoost: boolean;
  };
  deliveryPhases?: {
    enabled: true;
    contractVersion: "money_shorts_character_voice_phase_v3";
    characterId: "minjae_horizon";
    opening: {
      selector: "staged_cover_first_three_lines";
      speed: number;
      v3AudioTagPolicy: "match_body_lead";
      intent: string;
    };
    body: {
      selector: "opening_through_preclosing";
      speed: number;
      v3AudioTagPolicy: "inherit_scene_direction";
      intent: string;
    };
    closing: {
      selector: "final_save_or_follow_scene";
      speed: number;
      v3AudioTag: string;
      intent: string;
    };
    assembly: {
      mode: "two_aligned_segments";
      crossfadeMs: number;
      preserveCharacterAlignment: true;
      loudnessIntegratedLufs: number;
      truePeakDbtp: number;
    };
  };
  intent: string;
};

export const FINANCE_CHARACTER_VOICE_CAST = voiceCastData.characters as unknown as FinanceCharacterVoiceProfile[];

export function financeCharacterVoiceByCharacterId(
  characterId: FinanceCharacterId,
): FinanceCharacterVoiceProfile {
  const voice = FINANCE_CHARACTER_VOICE_CAST.find((candidate) => candidate.characterId === characterId);
  if (!voice || voice.voiceStatus !== "approved") {
    throw new Error(`finance_character_voice_missing_or_unapproved:${characterId}`);
  }
  return voice;
}

export function financeCharacterVoiceForSubtopic(
  subtopic: FinanceEditorialSubtopicId,
): FinanceCharacterVoiceProfile {
  return financeCharacterVoiceByCharacterId(financeCharacterForSubtopic(subtopic).id);
}
