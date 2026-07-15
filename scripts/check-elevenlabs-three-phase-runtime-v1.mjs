#!/usr/bin/env node

import {
  buildMinjaeThreePhasePlan,
  buildThreePhaseRequestFingerprint,
  buildThreePhaseAudioFilter,
  maskElevenLabsVoiceId,
  mergeThreePhaseCharacterAlignments,
  validateMinjaeVoicePhaseContract,
} from "./_elevenlabs-three-phase-voice-runtime.mjs";

const contract = {
  enabled: true,
  contractVersion: "money_shorts_character_voice_phase_v1",
  characterId: "minjae_horizon",
  opening: { selector: "staged_cover_first_three_lines", speed: 1.02, v3AudioTag: "firm and assertive" },
  body: { selector: "between_opening_and_closing", speed: 1, v3AudioTag: "inherit_scene_direction" },
  closing: { selector: "final_save_or_follow_scene", speed: 1.01, v3AudioTag: "clear and decisive" },
  assembly: {
    mode: "three_aligned_segments",
    crossfadeMs: 60,
    preserveCharacterAlignment: true,
    loudnessIntegratedLufs: -16,
    truePeakDbtp: -1.5,
  },
};

const results = [];
function check(name, condition) {
  const passed = Boolean(condition);
  results.push({ name, passed });
  console.log(`${passed ? "PASS" : "FAIL"} ${name}`);
}
function throwsCode(callback, code) {
  try {
    callback();
    return false;
  } catch (error) {
    return error.message === code;
  }
}

check("exact Minjae contract is accepted", validateMinjaeVoicePhaseContract(contract));
check("changed opening speed is rejected", !validateMinjaeVoicePhaseContract({ ...contract, opening: { ...contract.opening, speed: 1 } }));

const scenePayloads = [
  { scene: { sceneNumber: 1 }, tag: "firm and assertive" },
  { scene: { sceneNumber: 2 }, tag: "conversational" },
  { scene: { sceneNumber: 3 }, tag: "thoughtful" },
  { scene: { sceneNumber: 4 }, tag: "clear and decisive" },
];
const plan = buildMinjaeThreePhasePlan({
  scenePayloads,
  continuousParts: ["[firm and assertive]\n첫째", "[conversational]\n둘째", "[thoughtful]\n셋째", "[clear and decisive]\n넷째"],
  baseVoiceSettings: { stability: 0.48, similarity_boost: 0.86, style: 0, speed: 1, use_speaker_boost: true },
  contract,
});
check("plan has exactly opening body closing", plan.map(({ id }) => id).join(",") === "opening,body,closing");
check("opening contains only scene one", plan[0].sceneNumbers.join(",") === "1" && !plan[0].text.includes("둘째"));
check("body contains only middle scenes", plan[1].sceneNumbers.join(",") === "2,3" && !plan[1].text.includes("첫째") && !plan[1].text.includes("넷째"));
check("closing contains only final scene", plan[2].sceneNumbers.join(",") === "4" && !plan[2].text.includes("셋째"));
check("phase speeds are 1.02 1.00 1.01", plan.map(({ voiceSettings }) => voiceSettings.speed).join(",") === "1.02,1,1.01");
check("Junho stability and similarity survive every phase", plan.every(({ voiceSettings }) => voiceSettings.stability === 0.48 && voiceSettings.similarity_boost === 0.86));
check("voice id is masked with the shared production rule", maskElevenLabsVoiceId("pb3lVZVjdFWbkhPKlelB") === "pb3***elB");
const requestFingerprint = buildThreePhaseRequestFingerprint({
  engineVersion: "money_shorts_korean_director_v2",
  modelId: "eleven_v3",
  voiceIdMasked: "pb3***elB",
  phase: plan[1],
  previousText: plan[0].text,
  nextText: plan[2].text,
});
check("request fingerprint is stable and content-addressed", requestFingerprint.sha256.length === 64 && requestFingerprint.short === requestFingerprint.sha256.slice(0, 14));
check("adjacent context changes the request fingerprint", requestFingerprint.sha256 !== buildThreePhaseRequestFingerprint({
  engineVersion: "money_shorts_korean_director_v2",
  modelId: "eleven_v3",
  voiceIdMasked: "pb3***elB",
  phase: plan[1],
  previousText: null,
  nextText: plan[2].text,
}).sha256);
check("wrong opening tag fails before synthesis", throwsCode(() => buildMinjaeThreePhasePlan({
  scenePayloads: [{ ...scenePayloads[0], tag: "calmly" }, ...scenePayloads.slice(1)],
  continuousParts: ["a", "b", "c", "d"],
  baseVoiceSettings: {},
  contract,
}), "OPENING_PHASE_TAG_MISMATCH"));

const alignment = (character) => ({
  characters: [character],
  character_start_times_seconds: [0.1],
  character_end_times_seconds: [1.8],
});
const merged = mergeThreePhaseCharacterAlignments([
  { id: "opening", audioDurationSec: 2, alignment: alignment("가") },
  { id: "body", audioDurationSec: 2, alignment: alignment("나") },
  { id: "closing", audioDurationSec: 2, alignment: alignment("다") },
], 60);
check("60ms overlap rebases phase offsets", merged.phaseOffsetsSec.join(",") === "0,1.94,3.88");
check("merged alignment preserves character order", merged.alignment.characters.join("") === "가나다");
check("merged duration subtracts exactly two overlaps", merged.joinedDurationSec === 5.88);
check("rebased body character timing uses its phase offset", merged.alignment.character_start_times_seconds[1] === 2.04);
check("missing crossfade is rejected", throwsCode(() => mergeThreePhaseCharacterAlignments([
  { id: "opening", audioDurationSec: 2, alignment: alignment("가") },
  { id: "body", audioDurationSec: 2, alignment: alignment("나") },
  { id: "closing", audioDurationSec: 2, alignment: alignment("다") },
], undefined), "INVALID_THREE_PHASE_CROSSFADE"));

const filter = buildThreePhaseAudioFilter({
  crossfadeMs: 60,
  finalTailSec: 0.28,
  loudnessIntegratedLufs: -16,
  truePeakDbtp: -1.5,
});
check("filter applies exactly two 60ms crossfades", (filter.match(/acrossfade=d=0\.06/g) ?? []).length === 2);
check("filter applies final tail and loudness target", filter.includes("apad=pad_dur=0.28") && filter.includes("loudnorm=I=-16:TP=-1.5"));
check("missing filter settings are rejected", throwsCode(() => buildThreePhaseAudioFilter({
  crossfadeMs: undefined,
  finalTailSec: 0.28,
  loudnessIntegratedLufs: -16,
  truePeakDbtp: -1.5,
}), "INVALID_THREE_PHASE_AUDIO_FILTER_SETTINGS"));

const failed = results.filter(({ passed }) => !passed);
console.log(JSON.stringify({ passed: failed.length === 0, passedCount: results.length - failed.length, totalCount: results.length, failed }, null, 2));
process.exit(failed.length === 0 ? 0 : 1);
