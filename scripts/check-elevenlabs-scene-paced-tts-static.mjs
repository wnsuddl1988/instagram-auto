#!/usr/bin/env node
/** Read-only guard for Money Shorts Korean Director TTS v2. */

import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const BUILDER_PATH = resolve(__dirname, "build-elevenlabs-korean-director-tts-from-script.mjs");
const HELPER_PATH = resolve(ROOT, "lib", "owner-web-operator.ts");
const VOICE_CAST_DATA_PATH = resolve(ROOT, "lib", "finance-character-voice-cast-data.json");
const MUX_PATH = resolve(__dirname, "run-owner-real-video-from-wizard-assets-once.mjs");
const DYNAMIC_CAPTION_PATH = resolve(__dirname, "_money-shorts-dynamic-captions.mjs");

let passed = 0;
let failed = 0;
function check(label, condition) {
  if (condition) {
    passed++;
    console.log(`  PASS  ${label}`);
  } else {
    failed++;
    console.error(`  FAIL  ${label}`);
  }
}

function codeLines(source) {
  return source.split("\n").filter((line) => !/^\s*(\/\/|\*)/.test(line)).join("\n");
}

const builder = existsSync(BUILDER_PATH) ? readFileSync(BUILDER_PATH, "utf8") : "";
const helper = existsSync(HELPER_PATH) ? readFileSync(HELPER_PATH, "utf8") : "";
const voiceCastData = existsSync(VOICE_CAST_DATA_PATH) ? readFileSync(VOICE_CAST_DATA_PATH, "utf8") : "";
const mux = existsSync(MUX_PATH) ? readFileSync(MUX_PATH, "utf8") : "";
const dynamicCaptions = existsSync(DYNAMIC_CAPTION_PATH) ? readFileSync(DYNAMIC_CAPTION_PATH, "utf8") : "";
const code = codeLines(builder);

console.log("\nStatic guard: Money Shorts Korean Director TTS v2\n");
check("builder/helper/final-video/dynamic-caption consumer exist", Boolean(builder && helper && mux && dynamicCaptions));

console.log("[ safety ]");
check("no SDK, upload, OAuth or DB calls", !/from\s+["']elevenlabs|axios|uploadVideo|OAuth|supabase|prisma/.test(code));
check("no shell:true or execSync", !/shell\s*:\s*true|execSync/.test(code));
check("input/output are restricted to C:\\tmp\\money-shorts-os", /MEDIA_ROOT_RE/.test(builder) && /money-shorts-os/.test(builder));
check(".money-shorts-local remains forbidden", builder.includes(".money-shorts-local access forbidden"));
check("builder never reads .env.local", !/\.env\.local|readFileSync\([^)]*env/i.test(code));
check("API key and full voice id are never logged or summarized", !/console\.log\([^)]*apiKey|apiKey:/.test(code) && /maskVoiceId/.test(builder));
check("one paid call maximum and no retry loop", /API_CALL_BUDGET_MAX\s*=\s*1/.test(builder) && !/for\s*\([^)]*retry|while\s*\([^)]*retry/i.test(code));

console.log("\n[ Korean direction engine ]");
check("speech direction v2 is the required input", /money_shorts_speech_direction_v2/.test(builder) && /money_shorts_speech_direction_v2/.test(helper));
check("five topic delivery profiles exist", ["economic_authority", "discipline_coach", "wealth_conviction", "reassuring_control", "social_insight"].every((id) => helper.includes(id)));
check("Korean cadence categories exist", ["continue_rise", "contrast_pivot", "list_build", "firm_land", "command_land"].every((id) => helper.includes(id)));
check("continuation and list endings use comma rather than forced full stop", /WIZARD_SPEECH_CONNECTIVE_END_PATTERN/.test(helper) && /WIZARD_SPEECH_LIST_END_PATTERN/.test(helper) && /\? "," :/.test(helper));
check("connective endings continue naturally across scene boundaries", /continuesAfterScene/.test(helper) && /\(!isLast \|\| continuesAfterScene\)/.test(helper));
check("save scene uses confident closing", /save:\s*\{[\s\S]{0,380}v3AudioTag:\s*"confident"/.test(helper) && /intensity:\s*0\.72/.test(helper));
check(
  "topic profile is attached to every generated production-part TTS script",
  /topicSpeechProfile/.test(helper) &&
    /buildWizardTopicSpeechProfile\(script\.title, script\.fullVoiceover,\s*\{ topicId:\s*rootTopicId \}\)/.test(helper) &&
    /baseSpeed:\s*typeof speedCap === "number" \? Math\.min\(baseProfile\.baseSpeed, speedCap\) : baseProfile\.baseSpeed/.test(helper),
);
check("single-topic review profile is isolated from the 500-topic rollout", /WIZARD_AV_SAMPLE_REVIEW_TOPIC_ID/.test(helper) && /rolloutScope:\s*"single_topic_only"/.test(helper));
check("sample review routes housing anxiety to reassuring control at 0.91 speed", /isWizardAvSampleReviewTopic/.test(helper) && /id:\s*"reassuring_control"[\s\S]{0,480}baseSpeed:\s*0\.91/.test(helper));
check(
  "staged cover validates three semantically identical spoken/display lines before any API call",
  /STAGED_COVER_CONTRACT_VERSION/.test(builder) &&
    /lines\.length === 3/.test(builder) &&
    /semanticText\(line\.spokenText\) === semanticText\(line\.displayText\)/.test(builder) &&
    /semanticText\(spokenText\) === semanticText\(sceneOneNarration\)/.test(builder) &&
    builder.indexOf("staged cover spoken/display contract is invalid") < builder.indexOf("const apiKey = process.env.ELEVENLABS_API_KEY"),
);
check(
  "staged opening voice is confidently tagged and capped at 0.98 before any API call",
  /openingVoiceAudit/.test(builder) && /confidentFirstTag/.test(builder) && /speedWithinCap/.test(builder) &&
    /scenePayloads\[0\]\?\.tag === "confidently"/.test(builder) &&
    /voiceSettings\.speed <= openingSpeedCap/.test(builder) &&
    /openingVoiceContract:\s*script\.videoStrategy\?\.openingVoice/.test(helper) &&
    /Math\.min\(baseProfile\.baseSpeed, speedCap\)/.test(helper),
);

console.log("\n[ continuous generation ]");
check("full narration is joined before the API request", /continuousParts/.test(builder) && /continuousText/.test(builder) && /text:\s*continuousText/.test(builder));
check("official with-timestamps endpoint is used", /api\.elevenlabs\.io\/v1\/text-to-speech/.test(builder) && /with-timestamps\?output_format=mp3_44100_128/.test(builder));
check(
  "v3 Korean model and tags are explicit",
  /FINANCE_CHARACTER_VOICE_MODEL_ID/.test(helper) &&
    /"modelId"\s*:\s*"eleven_v3"/.test(voiceCastData) &&
    /language_code:\s*"ko"/.test(builder) &&
    /sceneDirectorTag/.test(builder),
);
check("SSML break spam is absent", !/<break time=/.test(builder));
check("voice style is zero; legacy speed stays narrow while sample review permits official slower range", /style:\s*0/.test(builder) && /\[0\.7,\s*1\.2\]\s*:\s*\[0\.95,\s*1\.05\]/.test(builder));
check("sample review adds v3 phrase pauses and scene beats", /\[pause\]/.test(builder) && /\[continues after a beat\]/.test(builder));
check("cache fingerprint includes engine/model/profile/settings/full text", ["engineVersion", "modelId", "topicProfileId", "voiceSettings", "continuousText"].every((field) => builder.includes(field)));
check("matching raw audio and alignment are reused without a paid call", /existsSync\(rawAudioPath\) && existsSync\(alignmentPath\)/.test(builder) && /reused_continuous_aligned/.test(builder));

console.log("\n[ alignment and downstream ]");
check("character alignment arrays are validated", ["characters", "character_start_times_seconds", "character_end_times_seconds"].every((field) => builder.includes(field)));
check("each directed segment is located sequentially despite v3 pause tags", /alignedText\.indexOf\(segment\.text, searchCursor\)/.test(builder));
check("sample review duration must remain within 95~108 percent", /durationWithinTargetRange/.test(builder) && /acceptedDurationRatio/.test(builder) && /SAMPLE_REVIEW_VOICE_AUDIT_FAILED/.test(mux));
check("scene timing includes spoken and video boundaries", ["spokenStartSec", "spokenEndSec", "normalizedDurationSec", "startSec", "endSec"].every((field) => builder.includes(field)));
check("summary exposes the reusable alignment artifact", /alignmentPath,/.test(builder) && /alignmentPath:\s*null/.test(builder));
check("final timeline is one continuous file with a short tail", /FINAL_TAIL_SEC\s*=\s*0\.28/.test(builder) && /elevenlabs-korean-director-\$\{inputFingerprint\}\.m4a/.test(builder));
check("summary remains compatible and identifies director v2", /money_shorts_elevenlabs_scene_paced_tts_summary_v1/.test(builder) && /money_shorts_korean_director_v2/.test(builder));
check("Owner listening remains required", /qualityAccepted:\s*false/.test(builder) && /ownerListeningRequired:\s*true/.test(builder));
check("final video consumes aligned scene durations and continuous audio", /audioSummary\.timelineAudioPath/.test(mux) && /normalizedDurationSec/.test(mux));
check("final video consumes character timing through the common dynamic-semantic caption module", /buildDynamicCaptionTimeline/.test(mux) && /character_aligned_continuous_v2/.test(mux) && /full_script_dynamic_semantic_aligned_v6/.test(mux));
check("dynamic captions prohibit Malgun and bottom-fixed sentence subtitles", /Black Han Sans/.test(dynamicCaptions) && !/Malgun Gothic/.test(dynamicCaptions) && /bottomFixedSubtitleBar:\s*false/.test(dynamicCaptions));
check("all captions require exact full-script coverage, source sentence boundaries and character timing", /full_script_dynamic_semantic_aligned/.test(dynamicCaptions) && /fullScriptCoveragePass/.test(dynamicCaptions) && /sentenceBoundaryPreservedPass/.test(dynamicCaptions) && /sourceSegmentBoundaryPreservedPass/.test(dynamicCaptions) && /arbitraryMidPhraseSplitAbsent/.test(dynamicCaptions) && /exactTranscriptMatchPass/.test(dynamicCaptions) && /captionCoverageRatio === 1/.test(dynamicCaptions));
check(
  "renderer suppresses ordinary scene-one captions and anchors exactly three cover lines to aligned words",
  /normalCaptions = dynamicCaptionTimeline\.captions\.filter\(\(caption\) => caption\.sceneNumber !== 1\)/.test(mux) &&
    /coverWords = coverCaptions\.flatMap\(\(caption\) => caption\.wordTimings\)/.test(mux) &&
    /coverLines\.length !== 3/.test(mux) &&
    /wordCursor \+= spokenWords\.length/.test(mux) &&
    /stagedLineCount:\s*anchors\.length/.test(mux),
);
check(
  "renderer fails closed unless cover semantics, character anchors and suppression all pass",
  /semanticWordCoveragePass/.test(mux) && /allLinesCharacterAnchored/.test(mux) &&
    /normalSceneOneCaptionSuppressed/.test(mux) && /coverAudit\.passed/.test(mux) &&
    /STAGED_COVER_AUDIT_FAILED/.test(mux) && /coverMode:\s*stagedCoverEnabled \? "staged_prehook_v1"/.test(mux),
);

console.log(`\n${passed + failed} checks — ${passed} PASS, ${failed} FAIL\n`);
if (failed > 0) process.exit(1);
