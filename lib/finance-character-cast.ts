import castData from "./finance-character-cast-data.json";
import type { FinanceEditorialSubtopicId } from "./finance-editorial-topic-bank";

export const FINANCE_CHARACTER_CAST_VERSION = castData.version;
export const FINANCE_CHARACTER_VISUAL_STYLE = castData.visualStyle;
export const FINANCE_CHARACTER_CANDIDATE_COUNT = castData.candidateCount;
export const FINANCE_CHARACTER_SELECTION_STATUS = castData.selectionStatus;
export const FINANCE_CHARACTER_SCENE_INTEGRATION_CONTRACT = castData.sceneIntegrationContract;
export const FINANCE_CHARACTER_MOTION_READY_CONTRACT = castData.motionReadyContract;
export const FINANCE_CHARACTER_FORBIDDEN_VISUAL_CONTRACT = castData.forbiddenVisualContract;

export const FINANCE_CHARACTER_IDS = [
  "harin_daily",
  "junho_cashflow",
  "seoyun_safety",
  "minjae_horizon",
] as const;

export type FinanceCharacterId = (typeof FINANCE_CHARACTER_IDS)[number];

export type FinanceCharacterProfile = {
  id: FinanceCharacterId;
  name: string;
  label: string;
  role: string;
  selectedCandidateNumber: number;
  subtopics: FinanceEditorialSubtopicId[];
  appearance: string;
  wardrobe: string;
  palette: string[];
  homeSpaces: string[];
  motionProfile: string;
  candidateDirections: string[];
};

export const FINANCE_CHARACTER_CAST = castData.characters as FinanceCharacterProfile[];

export const FINANCE_SUBTOPIC_CHARACTER_MAP = Object.fromEntries(
  FINANCE_CHARACTER_CAST.flatMap((character) =>
    character.subtopics.map((subtopic) => [subtopic, character.id] as const),
  ),
) as Record<FinanceEditorialSubtopicId, FinanceCharacterId>;

export function financeCharacterForSubtopic(
  subtopic: FinanceEditorialSubtopicId,
): FinanceCharacterProfile {
  const characterId = FINANCE_SUBTOPIC_CHARACTER_MAP[subtopic];
  const character = FINANCE_CHARACTER_CAST.find((candidate) => candidate.id === characterId);
  if (!character) throw new Error(`finance_character_missing:${subtopic}`);
  return character;
}

export function financeCharacterById(
  characterId: string,
): FinanceCharacterProfile | null {
  return FINANCE_CHARACTER_CAST.find((candidate) => candidate.id === characterId) ?? null;
}

export function buildFinanceCharacterCandidatePrompt(
  character: FinanceCharacterProfile,
  candidateNumber: number,
): string {
  const direction = character.candidateDirections[candidateNumber - 1];
  if (!direction) throw new Error(`finance_character_candidate_invalid:${candidateNumber}`);
  return [
    castData.sharedStyle,
    `Create an identity reference image for the recurring character ${character.name}.`,
    `Role: ${character.role}.`,
    `Fixed appearance: ${character.appearance}.`,
    `Fixed wardrobe: ${character.wardrobe}.`,
    `Candidate direction: ${direction}.`,
    "Show one and only one character as a clean vertical 9:16 identity board: one large full-body three-quarter view and two smaller consistent head-and-shoulder views in the same image.",
    "All three views must depict the exact same person, hairstyle, face proportions, age, body and outfit. Use a bright neutral studio-like environment with subtle lived-in depth, not a blank void.",
    "No labels, letters, numbers, captions, logos, split-screen borders, other people, duplicate bodies, bald or shaved hair, hairstyle changes, costume changes or photographic skin.",
  ].join(" ");
}
