#!/usr/bin/env node

import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";

const cast = JSON.parse(fs.readFileSync("lib/finance-character-voice-cast-data.json", "utf8"));
const visualCast = JSON.parse(fs.readFileSync("lib/finance-character-cast-data.json", "utf8"));
const runner = fs.readFileSync("scripts/run-finance-character-voice-cast-audition.mjs", "utf8");
const voiceModule = fs.readFileSync("lib/finance-character-voice-cast.ts", "utf8");
const operator = fs.readFileSync("lib/owner-web-operator.ts", "utf8");
const route = fs.readFileSync("app/api/money-shorts/operator/route.ts", "utf8");
const ttsBuilder = fs.readFileSync("scripts/build-elevenlabs-scene-paced-tts-from-script.mjs", "utf8");
const bankSource = fs.readFileSync("lib/finance-editorial-topic-bank.ts", "utf8");

function loadTopicBank() {
  const output = ts.transpileModule(bankSource, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const sandboxModule = { exports: {} };
  vm.runInNewContext(output, { module: sandboxModule, exports: sandboxModule.exports, console });
  return sandboxModule.exports.FINANCE_EDITORIAL_TOPIC_BANK ?? [];
}

const expected = new Map([
  ["harin_daily", ["Jisoo", "iWLjl1zCuqXRkW6494ve"]],
  ["junho_cashflow", ["Yohan Koo", "4JJwo477JUAx3HV0T7n7"]],
  ["seoyun_safety", ["Jian.K", "ah4r1hZOydd3XWlHOm3Y"]],
  ["minjae_horizon", ["Hojin Lim", "fHzGR8qcnsDR2uaj9r16"]],
]);
const results = [];
function check(name, passed) {
  results.push({ name, passed: Boolean(passed) });
  console.log(`${passed ? "PASS" : "FAIL"} ${name}`);
}

check("cast is approved for the common production engine", cast.status === "approved_for_production" && cast.characters.every((row) => row.voiceStatus === "approved"));
check("four selected voice IDs match the Owner casting", cast.characters.length === 4 && cast.characters.every((row) => expected.get(row.characterId)?.[0] === row.voiceLabel && expected.get(row.characterId)?.[1] === row.voiceId));
check("voice cast matches the four visual protagonists", visualCast.characters.every((character) => cast.characters.some((row) => row.characterId === character.id)));
check("all twelve subtopics are mapped exactly once", cast.characters.flatMap((row) => row.subtopics).length === 12 && new Set(cast.characters.flatMap((row) => row.subtopics)).size === 12);
const topicBank = loadTopicBank();
const characterBySubtopic = new Map(visualCast.characters.flatMap((character) => character.subtopics.map((subtopic) => [subtopic, character.id])));
const approvedVoiceByCharacter = new Map(cast.characters.filter((row) => row.voiceStatus === "approved").map((row) => [row.characterId, row]));
const unresolvedBankTopics = topicBank.filter((topic) => !approvedVoiceByCharacter.has(characterBySubtopic.get(topic.financeSubtopic)));
check("all 500 finance topics resolve to exactly one approved character voice", topicBank.length === 500 && unresolvedBankTopics.length === 0, unresolvedBankTopics.slice(0, 3).map((topic) => topic.id).join(", "));
check("latest Korean Director v2 and Eleven v3 baseline is preserved", cast.baseline.ttsEngineVersion === "money_shorts_korean_director_v2" && cast.baseline.modelId === "eleven_v3" && cast.baseline.prosodyPolicy === "korean_native_cadence_v2");
check("all audition settings stay in bounded quality ranges", cast.characters.every((row) => row.settings.speed >= 0.7 && row.settings.speed <= 1.2 && row.settings.stability >= 0.42 && row.settings.stability <= 0.58 && row.settings.similarityBoost >= 0.82 && row.settings.similarityBoost <= 0.9 && row.settings.style === 0 && row.settings.useSpeakerBoost === true));
const junho = cast.characters.find((row) => row.characterId === "junho_cashflow");
check("all voices use the exact Junho synthesis settings", Boolean(junho) && cast.characters.every((row) => JSON.stringify(row.settings) === JSON.stringify(junho.settings)));
check("all voices use one identical text and tag program", cast.audition.comparisonPolicy === "same_model_text_tags_settings_seed_loudness_voice_id_only" && cast.audition.spokenText.length >= 120 && /\[confidently\]/.test(cast.audition.performanceText) && cast.characters.every((row) => row.auditionPerformanceText == null));
check("runner preflights every voice before paid TTS", /\/v1\/voices\//.test(runner) && /unavailable\.length > 0/.test(runner) && /No paid TTS call was made/.test(runner));
check("paid audition is explicit and has an Owner-bounded call cap", /ALLOW_ELEVENLABS_AUDITION/.test(runner) && /paidTtsCallCount >= paidCallCap/.test(runner) && /--paid-call-cap/.test(runner) && /No retry was attempted/.test(runner));
check("preflight cannot overwrite paid audition state", /voice-preflight-summary\.json/.test(runner) && /existing_normalized_review_skip/.test(runner) && /existing_source_normalized_skip/.test(runner));
check("review audio is normalized to one dynamic loudness target", cast.audition.reviewLoudness?.method === "ffmpeg_loudnorm_two_pass_dynamic_v1" && cast.audition.reviewLoudness?.integratedToleranceLu === 1.5 && /integratedToleranceLu/.test(runner) && /linear=false/.test(runner) && /normalizeForReview/.test(runner) && /loudnessAudit/.test(runner));
check("loudness parser ignores nonnumeric ffmpeg metadata", /input_i: Number\(parsed\.input_i\)/.test(runner) && !/Object\.entries\(parsed\)/.test(runner));
check("audio stays outside repo and no upload path exists", /C:\\\\tmp\\\\money-shorts-os/.test(runner) && /noUploadPerformed: true/.test(runner) && !/instagram|youtube|publish/i.test(runner));
check("approved production retains one common Korean Director preset", cast.baseline.productionVoicePreset === "korean_confident_director_v2" && /korean_confident_director_v2/.test(ttsBuilder) && /confident_v3/.test(ttsBuilder));
check("voice module routes every subtopic through its visual protagonist", /financeCharacterVoiceForSubtopic/.test(voiceModule) && /financeCharacterForSubtopic\(subtopic\)/.test(voiceModule) && /finance_character_voice_missing_or_unapproved/.test(voiceModule));
check("real TTS overrides only finance child env with an approved cast voice", /voiceOverride\?: FinanceCharacterVoiceProfile/.test(operator) && /ELEVENLABS_VOICE_ID = opts\.voiceOverride\.voiceId/.test(operator) && /finance_voice_override_not_approved/.test(operator));
check("finance route fails closed when its subtopic mapping is missing", /resolveWizardFinanceCharacterVoice/.test(operator) && /finance_voice_subtopic_missing/.test(operator) && /finance_voice_mapping_missing_or_unapproved/.test(operator));
check("operator route injects the selected finance voice into real TTS only", /resolveWizardFinanceCharacterVoice\(topicId\)/.test(route) && /voiceOverride: financeVoiceRoute\?\.route\.voice/.test(route) && /승인 화자를 찾지 못해 실제 음성 생성을 막았습니다/.test(route));

const failed = results.filter((row) => !row.passed);
console.log(JSON.stringify({ passed: failed.length === 0, passedCount: results.length - failed.length, totalCount: results.length, failed }, null, 2));
process.exit(failed.length === 0 ? 0 : 1);
