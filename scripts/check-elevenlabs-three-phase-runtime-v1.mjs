#!/usr/bin/env node

import {
  buildMinjaeThreePhasePlan,
  buildMinjaeTaggedContinuousParts,
  buildThreePhaseRequestContext,
  buildThreePhaseRequestFingerprint,
  buildThreePhaseAudioFilter,
  maskElevenLabsVoiceId,
  mergeThreePhaseCharacterAlignments,
  validateMinjaeVoicePhaseContract,
} from "./_elevenlabs-three-phase-voice-runtime.mjs";

const contract = {
  enabled: true,
  contractVersion: "money_shorts_character_voice_phase_v3",
  characterId: "minjae_horizon",
  opening: { selector: "staged_cover_first_three_lines", speed: 1.02, v3AudioTagPolicy: "match_body_lead" },
  body: { selector: "opening_through_preclosing", speed: 1.02, v3AudioTagPolicy: "inherit_scene_direction" },
  closing: { selector: "final_save_or_follow_scene", speed: 1.02, v3AudioTag: "clear and decisive" },
  assembly: {
    mode: "two_aligned_segments",
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
  { scene: { sceneNumber: 1 }, performanceText: "첫째", tag: "serious" },
  { scene: { sceneNumber: 2 }, performanceText: "둘째", tag: "serious" },
  { scene: { sceneNumber: 3 }, performanceText: "셋째", tag: "thoughtful" },
  { scene: { sceneNumber: 4 }, performanceText: "넷째", tag: "clear and decisive" },
];
const continuousParts = buildMinjaeTaggedContinuousParts({ scenePayloads, contract });
const plan = buildMinjaeThreePhasePlan({
  scenePayloads,
  continuousParts,
  baseVoiceSettings: { stability: 0.48, similarity_boost: 0.86, style: 0, speed: 1, use_speaker_boost: true },
  contract,
});
check("plan has exactly body and closing", plan.map(({ id }) => id).join(",") === "body,closing");
check("body contains opening through the pre-closing scene", plan[0].sceneNumbers.join(",") === "1,2,3" && plan[0].text.includes("첫째") && !plan[0].text.includes("넷째"));
check("opening and body lead share one provider tag without a repeated boundary tag", continuousParts[0] === "[serious]\n첫째" && continuousParts[1] === "둘째" && !/^\[[^\]]+\]/u.test(continuousParts[1]));
check("closing contains only final scene", plan[1].sceneNumbers.join(",") === "4" && !plan[1].text.includes("셋째"));
check("phase speeds both keep the Junho 1.02 baseline", plan.map(({ voiceSettings }) => voiceSettings.speed).join(",") === "1.02,1.02");
check("Junho stability and similarity survive every phase", plan.every(({ voiceSettings }) => voiceSettings.stability === 0.48 && voiceSettings.similarity_boost === 0.86));
check("voice id is masked with the shared production rule", maskElevenLabsVoiceId("pb3lVZVjdFWbkhPKlelB") === "pb3***elB");
const v3RequestContext = buildThreePhaseRequestContext({ modelId: "eleven_v3", phasePlan: plan, phaseIndex: 0 });
check("Eleven v3 omits unsupported adjacent text context", v3RequestContext.strategy === "eleven_v3_local_crossfade_only_v1" && v3RequestContext.previousText === null && v3RequestContext.nextText === null);
const requestFingerprint = buildThreePhaseRequestFingerprint({
  engineVersion: "money_shorts_korean_director_v2",
  modelId: "eleven_v3",
  voiceIdMasked: "pb3***elB",
  phase: plan[0],
  requestContextStrategy: v3RequestContext.strategy,
  previousText: v3RequestContext.previousText,
  nextText: v3RequestContext.nextText,
});
check("request fingerprint is stable and content-addressed", requestFingerprint.sha256.length === 64 && requestFingerprint.short === requestFingerprint.sha256.slice(0, 14));
check("Eleven v3 fingerprint rejects unsupported adjacent text", throwsCode(() => buildThreePhaseRequestFingerprint({
  engineVersion: "money_shorts_korean_director_v2",
  modelId: "eleven_v3",
  voiceIdMasked: "pb3***elB",
  phase: plan[0],
  requestContextStrategy: v3RequestContext.strategy,
  previousText: "unsupported",
  nextText: plan[1].text,
}), "ELEVEN_V3_ADJACENT_CONTEXT_FORBIDDEN"));
const legacyRequestContext = buildThreePhaseRequestContext({ modelId: "eleven_multilingual_v2", phasePlan: plan, phaseIndex: 0 });
check("non-v3 models retain adjacent text context", legacyRequestContext.strategy === "adjacent_text_context_v1" && legacyRequestContext.previousText === null && legacyRequestContext.nextText === plan[1].text);
const legacyRequestFingerprint = buildThreePhaseRequestFingerprint({
  engineVersion: "money_shorts_korean_director_v2",
  modelId: "eleven_multilingual_v2",
  voiceIdMasked: "pb3***elB",
  phase: plan[0],
  requestContextStrategy: legacyRequestContext.strategy,
  previousText: legacyRequestContext.previousText,
  nextText: legacyRequestContext.nextText,
});
check("supported adjacent context changes the non-v3 fingerprint", legacyRequestFingerprint.sha256 !== buildThreePhaseRequestFingerprint({
  engineVersion: "money_shorts_korean_director_v2",
  modelId: "eleven_multilingual_v2",
  voiceIdMasked: "pb3***elB",
  phase: plan[0],
  requestContextStrategy: legacyRequestContext.strategy,
  previousText: null,
  nextText: null,
}).sha256);
check("wrong opening tag fails before synthesis", throwsCode(() => buildMinjaeTaggedContinuousParts({
  scenePayloads: [{ ...scenePayloads[0], tag: "calmly" }, ...scenePayloads.slice(1)],
  contract,
}), "OPENING_BODY_TAG_MISMATCH"));
check("repeated provider tag at the opening/body boundary fails before synthesis", throwsCode(() => buildMinjaeThreePhasePlan({
  scenePayloads,
  continuousParts: ["[serious]\n첫째", "[serious]\n둘째", "[thoughtful]\n셋째", "[clear and decisive]\n넷째"],
  baseVoiceSettings: {},
  contract,
}), "OPENING_BODY_PROVIDER_BOUNDARY_MISMATCH"));

const alignment = (character) => ({
  characters: [character],
  character_start_times_seconds: [0.1],
  character_end_times_seconds: [1.8],
});
const merged = mergeThreePhaseCharacterAlignments([
  { id: "body", audioDurationSec: 2, alignment: alignment("가") },
  { id: "closing", audioDurationSec: 2, alignment: alignment("나") },
], 60);
check("60ms overlap rebases phase offsets", merged.phaseOffsetsSec.join(",") === "0,1.94");
check("merged alignment preserves character order", merged.alignment.characters.join("") === "가나");
check("merged duration subtracts exactly one overlap", merged.joinedDurationSec === 3.94);
check("rebased closing character timing uses its phase offset", merged.alignment.character_start_times_seconds[1] === 2.04);
check("missing crossfade is rejected", throwsCode(() => mergeThreePhaseCharacterAlignments([
  { id: "body", audioDurationSec: 2, alignment: alignment("가") },
  { id: "closing", audioDurationSec: 2, alignment: alignment("나") },
], undefined), "INVALID_THREE_PHASE_CROSSFADE"));

const filter = buildThreePhaseAudioFilter({
  crossfadeMs: 60,
  finalTailSec: 0.28,
  loudnessIntegratedLufs: -16,
  truePeakDbtp: -1.5,
});
check("filter applies exactly one 60ms crossfade", (filter.match(/acrossfade=d=0\.06/g) ?? []).length === 1);
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
