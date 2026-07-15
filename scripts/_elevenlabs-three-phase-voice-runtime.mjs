const CONTRACT_VERSION = "money_shorts_character_voice_phase_v1";
const PHASE_IDS = ["opening", "body", "closing"];

function finiteNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function validateMinjaeVoicePhaseContract(contract) {
  return contract?.enabled === true &&
    contract.contractVersion === CONTRACT_VERSION &&
    contract.characterId === "minjae_horizon" &&
    contract.opening?.selector === "staged_cover_first_three_lines" &&
    contract.opening?.speed === 1.02 &&
    contract.opening?.v3AudioTag === "firm and assertive" &&
    contract.body?.selector === "between_opening_and_closing" &&
    contract.body?.speed === 1 &&
    contract.body?.v3AudioTag === "inherit_scene_direction" &&
    contract.closing?.selector === "final_save_or_follow_scene" &&
    contract.closing?.speed === 1.01 &&
    contract.closing?.v3AudioTag === "clear and decisive" &&
    contract.assembly?.mode === "three_aligned_segments" &&
    contract.assembly?.crossfadeMs === 60 &&
    contract.assembly?.preserveCharacterAlignment === true &&
    contract.assembly?.loudnessIntegratedLufs === -16 &&
    contract.assembly?.truePeakDbtp === -1.5;
}

export function buildMinjaeThreePhasePlan({ scenePayloads, continuousParts, baseVoiceSettings, contract }) {
  if (!validateMinjaeVoicePhaseContract(contract)) {
    throw new Error("INVALID_MINJAE_VOICE_PHASE_CONTRACT");
  }
  if (!Array.isArray(scenePayloads) || !Array.isArray(continuousParts) ||
      scenePayloads.length !== continuousParts.length || scenePayloads.length < 3) {
    throw new Error("INVALID_THREE_PHASE_SCENE_INPUT");
  }
  if (scenePayloads[0]?.tag !== contract.opening.v3AudioTag) {
    throw new Error("OPENING_PHASE_TAG_MISMATCH");
  }
  if (scenePayloads.at(-1)?.tag !== contract.closing.v3AudioTag) {
    throw new Error("CLOSING_PHASE_TAG_MISMATCH");
  }

  const boundaries = [
    { id: "opening", startIndex: 0, endIndex: 1 },
    { id: "body", startIndex: 1, endIndex: scenePayloads.length - 1 },
    { id: "closing", startIndex: scenePayloads.length - 1, endIndex: scenePayloads.length },
  ];
  return boundaries.map(({ id, startIndex, endIndex }) => {
    const text = continuousParts.slice(startIndex, endIndex).join("\n\n").trim();
    const payloads = scenePayloads.slice(startIndex, endIndex);
    if (!text || payloads.length === 0) throw new Error(`EMPTY_${id.toUpperCase()}_PHASE`);
    return {
      id,
      startIndex,
      endIndex,
      sceneNumbers: payloads.map(({ scene }) => Number(scene.sceneNumber)),
      text,
      voiceSettings: {
        ...baseVoiceSettings,
        speed: contract[id].speed,
      },
      requestedTag: contract[id].v3AudioTag,
    };
  });
}

export function mergeThreePhaseCharacterAlignments(phaseArtifacts, crossfadeMs) {
  if (!Array.isArray(phaseArtifacts) || phaseArtifacts.length !== PHASE_IDS.length) {
    throw new Error("THREE_PHASE_ARTIFACTS_REQUIRED");
  }
  const crossfadeValue = finiteNumber(crossfadeMs);
  const crossfadeSec = crossfadeValue === null ? null : crossfadeValue / 1000;
  if (crossfadeSec === null || crossfadeSec < 0 || crossfadeSec >= 1) {
    throw new Error("INVALID_THREE_PHASE_CROSSFADE");
  }

  const merged = {
    characters: [],
    character_start_times_seconds: [],
    character_end_times_seconds: [],
  };
  const phaseOffsetsSec = [];
  let cursorSec = 0;

  phaseArtifacts.forEach((artifact, phaseIndex) => {
    if (artifact?.id !== PHASE_IDS[phaseIndex]) throw new Error("THREE_PHASE_ORDER_MISMATCH");
    const durationSec = finiteNumber(artifact.audioDurationSec);
    const alignment = artifact.alignment;
    const characters = alignment?.characters;
    const starts = alignment?.character_start_times_seconds;
    const ends = alignment?.character_end_times_seconds;
    if (!durationSec || durationSec <= crossfadeSec || !Array.isArray(characters) || characters.length === 0 ||
        !Array.isArray(starts) || starts.length !== characters.length ||
        !Array.isArray(ends) || ends.length !== characters.length) {
      throw new Error(`INVALID_${artifact?.id ?? phaseIndex}_PHASE_ALIGNMENT`);
    }

    phaseOffsetsSec.push(Number(cursorSec.toFixed(6)));
    characters.forEach((character, characterIndex) => {
      const start = finiteNumber(starts[characterIndex]);
      const end = finiteNumber(ends[characterIndex]);
      if (start === null || end === null || start < 0 || end < start || end > durationSec + 0.25) {
        throw new Error(`INVALID_${artifact.id}_PHASE_CHARACTER_TIME`);
      }
      merged.characters.push(character);
      merged.character_start_times_seconds.push(Number((start + cursorSec).toFixed(6)));
      merged.character_end_times_seconds.push(Number((end + cursorSec).toFixed(6)));
    });
    cursorSec += durationSec;
    if (phaseIndex < phaseArtifacts.length - 1) cursorSec -= crossfadeSec;
  });

  return {
    alignment: merged,
    phaseOffsetsSec,
    crossfadeSec,
    joinedDurationSec: Number(cursorSec.toFixed(6)),
  };
}

export function buildThreePhaseAudioFilter({ crossfadeMs, finalTailSec, loudnessIntegratedLufs, truePeakDbtp }) {
  const crossfadeValue = finiteNumber(crossfadeMs);
  const crossfadeSec = crossfadeValue === null ? null : crossfadeValue / 1000;
  const tailSec = finiteNumber(finalTailSec);
  const loudness = finiteNumber(loudnessIntegratedLufs);
  const truePeak = finiteNumber(truePeakDbtp);
  if (crossfadeSec === null || crossfadeSec <= 0 || crossfadeSec >= 1 ||
      tailSec === null || tailSec < 0 || loudness === null || truePeak === null) {
    throw new Error("INVALID_THREE_PHASE_AUDIO_FILTER_SETTINGS");
  }
  const fade = Number(crossfadeSec.toFixed(3));
  return [
    `[0:a][1:a]acrossfade=d=${fade}:c1=tri:c2=tri[phase01]`,
    `[phase01][2:a]acrossfade=d=${fade}:c1=tri:c2=tri[joined]`,
    `[joined]apad=pad_dur=${tailSec},loudnorm=I=${loudness}:TP=${truePeak}:LRA=11[aout]`,
  ].join(";");
}
