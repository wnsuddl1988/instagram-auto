#!/usr/bin/env node

import fs from "node:fs";

const cast = JSON.parse(fs.readFileSync("lib/finance-character-voice-cast-data.json", "utf8"));
const voiceModule = fs.readFileSync("lib/finance-character-voice-cast.ts", "utf8");
const operator = fs.readFileSync("lib/owner-web-operator.ts", "utf8");
const builder = fs.readFileSync("scripts/build-elevenlabs-korean-director-tts-from-script.mjs", "utf8");

const results = [];
function check(name, condition) {
  const passed = Boolean(condition);
  results.push({ name, passed });
  console.log(`${passed ? "PASS" : "FAIL"} ${name}`);
}

const minjae = cast.characters.find((row) => row.characterId === "minjae_horizon");
const phasedCharacters = cast.characters.filter((row) => row.deliveryPhases?.enabled === true);
const phases = minjae?.deliveryPhases;

check("voice cast advances to v6", cast.version === "money_shorts_finance_character_voice_cast_v6");
check("only Minjae receives the three-phase override", phasedCharacters.length === 1 && phasedCharacters[0]?.characterId === "minjae_horizon");
check("Minjae remains Harry Kim", minjae?.voiceLabel === "Harry Kim – Conversational" && minjae?.voiceId === "pb3lVZVjdFWbkhPKlelB");
check("Junho synthesis baseline stays intact", minjae?.settings?.speed === 1.02 && minjae?.settings?.stability === 0.48 && minjae?.settings?.similarityBoost === 0.86 && minjae?.settings?.style === 0 && minjae?.settings?.useSpeakerBoost === true);
check("opening is 1.02 firm and assertive", phases?.opening?.selector === "staged_cover_first_three_lines" && phases?.opening?.speed === 1.02 && phases?.opening?.v3AudioTag === "firm and assertive");
check("body is slightly faster at 1.00", phases?.body?.selector === "between_opening_and_closing" && phases?.body?.speed === 1 && phases?.body?.v3AudioTag === "inherit_scene_direction");
check("closing is clear and decisive at 1.01", phases?.closing?.selector === "final_save_or_follow_scene" && phases?.closing?.speed === 1.01 && phases?.closing?.v3AudioTag === "clear and decisive");
check("assembly preserves alignment and safe loudness", phases?.assembly?.mode === "three_aligned_segments" && phases?.assembly?.preserveCharacterAlignment === true && phases?.assembly?.crossfadeMs === 60 && phases?.assembly?.loudnessIntegratedLufs === -16 && phases?.assembly?.truePeakDbtp === -1.5);
check("typed voice profile exposes the optional phase contract", /deliveryPhases\?:/.test(voiceModule) && /money_shorts_character_voice_phase_v1/.test(voiceModule));
check("wizard emits the approved phase contract", /voicePhaseContract = financeVoiceRoute\?\.route\.voice\.deliveryPhases/.test(operator) && /voicePhaseContract,/.test(operator));
check("wizard body profile uses phase speed and cast stability", /baseSpeed: voicePhaseContract\?\.body\.speed/.test(operator) && /castSettings\.stability/.test(operator) && /castSettings\.similarityBoost/.test(operator));
check("wizard applies opening and closing tags only at their boundaries", /voicePhaseContract && index === 0/.test(operator) && /voicePhaseContract && index === script\.scenes\.length - 1/.test(operator));
const phaseGuardIndex = builder.indexOf("Minjae three-phase TTS runtime is not implemented yet");
const apiKeyIndex = builder.indexOf("const apiKey = process.env.ELEVENLABS_API_KEY");
check("current single-call runtime fails closed before paid API access", phaseGuardIndex >= 0 && apiKeyIndex >= 0 && phaseGuardIndex < apiKeyIndex && /No API call was made/.test(builder));
check("shared builder source still has one-call maximum until phase runtime lands", /API_CALL_BUDGET_MAX\s*=\s*1/.test(builder));

const failed = results.filter((row) => !row.passed);
console.log(JSON.stringify({ passed: failed.length === 0, passedCount: results.length - failed.length, totalCount: results.length, failed }, null, 2));
process.exit(failed.length === 0 ? 0 : 1);
