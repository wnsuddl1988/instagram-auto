import type { GeneratedScriptPackage, DurationScript } from "@/lib/scripts/types";
import type { VideoBlueprint } from "@/lib/blueprints/types";
import type { VoiceProfile } from "./types";
import { TTS_SCRIPT_SCHEMA_VERSION } from "./types";
import type { TtsSceneBlock, TtsScriptPackage } from "./types";

export interface TtsFormatterOptions {
  ttsPackageId?: string;
  targetDurationSec?: 15 | 30 | 60;
  createdAt?: string;
}

/**
 * Normalizes a narration string for TTS:
 * - Trims whitespace.
 * - Ensures the text ends with terminal punctuation.
 * No new facts, numbers, or sentences are invented.
 */
function normalizeTtsText(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.length === 0) return trimmed;
  const lastChar = trimmed[trimmed.length - 1];
  const hasTerminal = /[.。!！?？]$/.test(lastChar);
  return hasTerminal ? trimmed : `${trimmed}.`;
}

function makeTtsBlock(
  parentId: string,
  sceneId: string,
  sceneIndex: number,
  rawText: string,
): TtsSceneBlock {
  const ttsText = normalizeTtsText(rawText);
  return {
    sceneId,
    sceneIndex,
    ttsText,
    charCount: ttsText.length,
    parentId,
  };
}

/**
 * Picks the best DurationScript from a GeneratedScriptPackage.
 * If targetDurationSec is specified, returns the matching script; otherwise
 * returns the longest one (most scenes = most detail).
 */
function pickScript(
  pkg: GeneratedScriptPackage,
  targetDurationSec?: 15 | 30 | 60,
): DurationScript | null {
  if (pkg.scripts.length === 0) return null;
  if (targetDurationSec !== undefined) {
    const match = pkg.scripts.find((s) => s.targetDurationSec === targetDurationSec);
    if (match) return match;
  }
  // Default: longest script
  return pkg.scripts.reduce((best, s) =>
    s.scenes.length >= best.scenes.length ? s : best,
  );
}

/**
 * Builds a TtsScriptPackage from a GeneratedScriptPackage.
 * Narration is taken from `scene.narrationText` only — nothing invented.
 */
export function formatScriptPackageForTts(
  pkg: GeneratedScriptPackage,
  profile: VoiceProfile,
  options: TtsFormatterOptions = {},
): TtsScriptPackage {
  const ttsPackageId =
    options.ttsPackageId ?? `tts-${pkg.packageId}-${profile.profileId}`;

  const script = pickScript(pkg, options.targetDurationSec);
  const scenes: TtsSceneBlock[] = script
    ? script.scenes.map((scene) =>
        makeTtsBlock(pkg.packageId, `scene-${scene.sceneIndex}`, scene.sceneIndex, scene.narrationText),
      )
    : [];

  const fullTtsText = scenes.map((s) => s.ttsText).join(" ");

  const result: TtsScriptPackage = {
    schemaVersion: TTS_SCRIPT_SCHEMA_VERSION,
    ttsPackageId,
    sourceId: pkg.packageId,
    sourceType: "script_package",
    profileId: profile.profileId,
    locale: profile.locale,
    provider: profile.provider,
    fullTtsText,
    scenes,
    totalCharCount: fullTtsText.length,
  };
  if (options.createdAt !== undefined) result.createdAt = options.createdAt;
  return result;
}

/**
 * Builds a TtsScriptPackage from a VideoBlueprint.
 * Narration is taken from `scene.ttsScript` (preferred) or `scene.narration`.
 * Nothing is invented.
 */
export function formatBlueprintForTts(
  blueprint: VideoBlueprint,
  profile: VoiceProfile,
  options: TtsFormatterOptions = {},
): TtsScriptPackage {
  const ttsPackageId =
    options.ttsPackageId ?? `tts-${blueprint.videoId}-${profile.profileId}`;

  const scenes: TtsSceneBlock[] = blueprint.scenes.map((scene) => {
    const rawText =
      scene.ttsScript && scene.ttsScript.trim().length > 0
        ? scene.ttsScript
        : scene.narration;
    return makeTtsBlock(blueprint.videoId, scene.sceneId, scene.sceneIndex, rawText);
  });

  const fullTtsText = scenes.map((s) => s.ttsText).join(" ");

  const result: TtsScriptPackage = {
    schemaVersion: TTS_SCRIPT_SCHEMA_VERSION,
    ttsPackageId,
    sourceId: blueprint.videoId,
    sourceType: "blueprint",
    profileId: profile.profileId,
    locale: profile.locale,
    provider: profile.provider,
    fullTtsText,
    scenes,
    totalCharCount: fullTtsText.length,
  };
  if (options.createdAt !== undefined) result.createdAt = options.createdAt;
  return result;
}
