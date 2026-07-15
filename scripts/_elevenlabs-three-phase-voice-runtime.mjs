import { createHash } from "node:crypto";

const CONTRACT_VERSION = "money_shorts_character_voice_phase_v2";
const PHASE_IDS = ["body", "closing"];
const ELEVEN_V3_CONTEXT_STRATEGY = "eleven_v3_local_crossfade_only_v1";
const ADJACENT_TEXT_CONTEXT_STRATEGY = "adjacent_text_context_v1";

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
    contract.opening?.v3AudioTag === "conversationally" &&
    contract.body?.selector === "opening_through_preclosing" &&
    contract.body?.speed === 1.02 &&
    contract.body?.v3AudioTag === "inherit_scene_direction" &&
    contract.closing?.selector === "final_save_or_follow_scene" &&
    contract.closing?.speed === 1.02 &&
    contract.closing?.v3AudioTag === "clear and decisive" &&
    contract.assembly?.mode === "two_aligned_segments" &&
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
    { id: "body", startIndex: 0, endIndex: scenePayloads.length - 1 },
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
      requestedTag: id === "body" ? contract.opening.v3AudioTag : contract.closing.v3AudioTag,
    };
  });
}

export function maskElevenLabsVoiceId(value) {
  const voiceId = String(value ?? "");
  if (voiceId.length <= 6) return "***";
  return `${voiceId.slice(0, 3)}***${voiceId.slice(-3)}`;
}

export function buildThreePhaseRequestContext({ modelId, phasePlan, phaseIndex }) {
  if (
    !Array.isArray(phasePlan) ||
    phasePlan.length !== PHASE_IDS.length ||
    phasePlan.some((phase, index) => phase?.id !== PHASE_IDS[index]) ||
    !Number.isInteger(phaseIndex) ||
    phaseIndex < 0 ||
    phaseIndex >= phasePlan.length
  ) {
    throw new Error("INVALID_THREE_PHASE_REQUEST_CONTEXT_INPUT");
  }
  const isElevenV3 = /^eleven_v3(?:$|_)/.test(String(modelId ?? ""));
  return {
    strategy: isElevenV3 ? ELEVEN_V3_CONTEXT_STRATEGY : ADJACENT_TEXT_CONTEXT_STRATEGY,
    previousText: !isElevenV3 && phaseIndex > 0 ? phasePlan[phaseIndex - 1].text : null,
    nextText: !isElevenV3 && phaseIndex < phasePlan.length - 1 ? phasePlan[phaseIndex + 1].text : null,
  };
}

export function buildThreePhaseRequestFingerprint({
  engineVersion,
  modelId,
  voiceIdMasked,
  phase,
  requestContextStrategy,
  previousText,
  nextText,
}) {
  if (![ELEVEN_V3_CONTEXT_STRATEGY, ADJACENT_TEXT_CONTEXT_STRATEGY].includes(requestContextStrategy)) {
    throw new Error("INVALID_THREE_PHASE_REQUEST_CONTEXT_STRATEGY");
  }
  if (/^eleven_v3(?:$|_)/.test(String(modelId ?? ""))) {
    if (requestContextStrategy !== ELEVEN_V3_CONTEXT_STRATEGY) {
      throw new Error("ELEVEN_V3_LOCAL_CONTEXT_STRATEGY_REQUIRED");
    }
    if (previousText != null || nextText != null) {
      throw new Error("ELEVEN_V3_ADJACENT_CONTEXT_FORBIDDEN");
    }
  }
  const payload = {
    engineVersion,
    modelId,
    voiceIdMasked,
    phaseId: phase.id,
    sceneNumbers: phase.sceneNumbers,
    voiceSettings: phase.voiceSettings,
    text: phase.text,
    requestContextStrategy,
    previousText: previousText ?? null,
    nextText: nextText ?? null,
  };
  const sha256 = createHash("sha256").update(JSON.stringify(payload)).digest("hex");
  return { payload, sha256, short: sha256.slice(0, 14) };
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
    `[0:a][1:a]acrossfade=d=${fade}:c1=tri:c2=tri[joined]`,
    `[joined]apad=pad_dur=${tailSec},loudnorm=I=${loudness}:TP=${truePeak}:LRA=11[aout]`,
  ].join(";");
}
