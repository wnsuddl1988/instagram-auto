#!/usr/bin/env node

import fs from "node:fs";
import { validateMinjaeVoicePhaseContract } from "./_elevenlabs-three-phase-voice-runtime.mjs";
import { validateFinanceCoverHookContract } from "./_finance-cover-hook-guard.mjs";

const cast = JSON.parse(fs.readFileSync("lib/finance-character-voice-cast-data.json", "utf8"));
const voiceModule = fs.readFileSync("lib/finance-character-voice-cast.ts", "utf8");
const operator = fs.readFileSync("lib/owner-web-operator.ts", "utf8");
const builder = fs.readFileSync("scripts/build-elevenlabs-korean-director-tts-from-script.mjs", "utf8");
const runtime = fs.readFileSync("scripts/_elevenlabs-three-phase-voice-runtime.mjs", "utf8");
const approvalBuilder = fs.readFileSync("scripts/build-minjae-three-phase-tts-approval-packet-v1.mjs", "utf8");
const coverHookGuard = fs.readFileSync("scripts/_finance-cover-hook-guard.mjs", "utf8");
const readonlyAudit = fs.readFileSync("scripts/audit-elevenlabs-readonly-preflight-v1.mjs", "utf8");

const results = [];
function check(name, condition) {
  const passed = Boolean(condition);
  results.push({ name, passed });
  console.log(`${passed ? "PASS" : "FAIL"} ${name}`);
}

const minjae = cast.characters.find((row) => row.characterId === "minjae_horizon");
const phasedCharacters = cast.characters.filter((row) => row.deliveryPhases?.enabled === true);
const phases = minjae?.deliveryPhases;

check("voice cast advances to v8", cast.version === "money_shorts_finance_character_voice_cast_v8");
check("only Minjae receives the two-phase override", phasedCharacters.length === 1 && phasedCharacters[0]?.characterId === "minjae_horizon");
check("Minjae uses the Owner-selected Mr. K Pro voice", minjae?.voiceLabel === "Mr. K Pro – V3 Natural Korean Voice" && minjae?.voiceId === "HCANy6ACvOWyndVWS0gV");
check("Junho synthesis baseline stays intact", minjae?.settings?.speed === 1.02 && minjae?.settings?.stability === 0.48 && minjae?.settings?.similarityBoost === 0.86 && minjae?.settings?.style === 0 && minjae?.settings?.useSpeakerBoost === true);
check("opening copies the body lead delivery at 1.02", phases?.opening?.selector === "staged_cover_first_three_lines" && phases?.opening?.speed === 1.02 && phases?.opening?.v3AudioTagPolicy === "match_body_lead");
check("body includes the opening and keeps the exact Junho speed", phases?.body?.selector === "opening_through_preclosing" && phases?.body?.speed === 1.02 && phases?.body?.v3AudioTagPolicy === "inherit_scene_direction");
check("closing keeps the exact Junho speed at 1.02", phases?.closing?.selector === "final_save_or_follow_scene" && phases?.closing?.speed === 1.02 && phases?.closing?.v3AudioTag === "clear and decisive");
check("two-part assembly preserves alignment and safe loudness", phases?.assembly?.mode === "two_aligned_segments" && phases?.assembly?.preserveCharacterAlignment === true && phases?.assembly?.crossfadeMs === 60 && phases?.assembly?.loudnessIntegratedLufs === -16 && phases?.assembly?.truePeakDbtp === -1.5);
check("runtime accepts the exact current Minjae phase contract", validateMinjaeVoicePhaseContract(phases));
check("typed voice profile exposes the optional v3 phase contract", /deliveryPhases\?:/.test(voiceModule) && /money_shorts_character_voice_phase_v3/.test(voiceModule));
check("wizard emits the approved phase contract", /voicePhaseContract = financeVoiceRoute\?\.route\.voice\.deliveryPhases/.test(operator) && /voicePhaseContract,/.test(operator));
check("wizard body profile uses phase speed and cast stability", /baseSpeed: voicePhaseContract\?\.body\.speed/.test(operator) && /castSettings\.stability/.test(operator) && /castSettings\.similarityBoost/.test(operator));
check("wizard copies the body lead provider delivery onto the opening and isolates the closing", /bodyLeadDirection = directedScenes\[1\]/.test(operator) && /v3AudioTag: bodyLeadDirection\.v3AudioTag/.test(operator) && /voicePhaseContract && index === script\.scenes\.length - 1/.test(operator));
check("runtime removes a repeated provider tag at the opening/body boundary", /buildMinjaeTaggedContinuousParts/.test(runtime) && /OPENING_BODY_TAG_MISMATCH/.test(runtime) && /OPENING_BODY_PROVIDER_BOUNDARY_MISMATCH/.test(runtime));
const phasePlanIndex = builder.indexOf("buildMinjaeThreePhasePlan");
const apiKeyIndex = builder.indexOf("const apiKey = process.env.ELEVENLABS_API_KEY");
check("phase contract and plan are validated before paid API access", phasePlanIndex >= 0 && apiKeyIndex >= 0 && phasePlanIndex < apiKeyIndex && /validateMinjaeVoicePhaseContract/.test(builder));
check("legacy remains one call while Minjae is capped at exactly two", /LEGACY_API_CALL_BUDGET_MAX\s*=\s*1/.test(builder) && /PHASED_API_CALL_BUDGET_MAX\s*=\s*2/.test(builder));
check("runtime keeps opening with body and isolates only closing", /id: "body", startIndex: 0/.test(runtime) && /endIndex: scenePayloads\.length - 1/.test(runtime) && /id: "closing"/.test(runtime));
check("runtime rebases character alignment after each crossfade", /mergeThreePhaseCharacterAlignments/.test(builder) && /phaseOffsetsSec/.test(runtime) && /cursorSec -= crossfadeSec/.test(runtime));
check("runtime assembles one crossfade and Owner loudness target", /buildThreePhaseAudioFilter/.test(builder) && (runtime.match(/acrossfade=d=/g) ?? []).length === 1 && /loudnorm=I=\$\{loudness\}:TP=\$\{truePeak\}/.test(runtime));
check("runtime and approval packet share exact model-aware phase request context and fingerprints", /buildThreePhaseRequestContext/.test(builder) && /buildThreePhaseRequestContext/.test(approvalBuilder) && /buildThreePhaseRequestFingerprint/.test(builder) && /buildThreePhaseRequestFingerprint/.test(approvalBuilder));
check("v3 request contract forbids provider adjacent text and keeps local crossfade continuity", /ELEVEN_V3_ADJACENT_CONTEXT_FORBIDDEN/.test(runtime) && /eleven_v3_local_crossfade_only_v1/.test(runtime) && /providerAdjacentContextIncluded/.test(builder) && /providerAdjacentContextIncluded/.test(approvalBuilder));
check("TTS summary carries the exact current input contract hashes", /ttsInputContractFingerprint/.test(builder) && /ttsInputContractSha256/.test(builder));
check("approval packet is no-live and never reads API credentials", /PREFLIGHT_ONLY_OK/.test(approvalBuilder) && /apiCallBudgetMax:\s*2/.test(approvalBuilder) && !/fetch\(|ELEVENLABS_API_KEY|process\.env/.test(approvalBuilder));
check("approval packet and paid builder both reject stale cover hooks before paid access", /validateFinanceCoverHookContract/.test(approvalBuilder) &&
  /validateFinanceCoverHookContract/.test(builder) &&
  /money_shorts_finance_cover_hook_v2/.test(coverHookGuard) &&
  /dangling_cover_token/.test(coverHookGuard) &&
  /explanatory_or_generic_closure/.test(coverHookGuard) &&
  builder.indexOf("validateFinanceCoverHookContract(coverContract)") < apiKeyIndex);
const validHookContract = {
  lines: [
    { spokenText: "주가가 싸졌는데", displayText: "주가가 싸졌는데..." },
    { spokenText: "더 위험해질 수 있는 이유", displayText: "더 위험해질 수 있는 이유?" },
    { spokenText: "문제는 가격이 아니야", displayText: "문제는 가격이 아니야!" },
  ],
  hookAudit: {
    contractVersion: "money_shorts_finance_cover_hook_v2",
    mode: "title_open_loop",
    sourceText: "주가가 싸졌는데 더 위험해질 수 있는 이유",
    sourceTextCoverageRatio: 1,
    sourceTextPreserved: true,
    danglingTokenFree: true,
    explanatoryClosureFree: true,
    openLoopPresent: true,
    displaySemanticsPreserved: true,
    visualOnlyPunctuation: true,
    failures: [],
    passed: true,
  },
};
check("runtime cover guard accepts the repaired hook and rejects the old dangling hook", validateFinanceCoverHookContract(validHookContract).passed &&
  !validateFinanceCoverHookContract({
    ...validHookContract,
    lines: [
      { spokenText: "주가가 싸졌는데 더", displayText: "주가가 싸졌는데 더..." },
      validHookContract.lines[1],
      { spokenText: "계좌가 먼저 흔들려", displayText: "계좌가 먼저 흔들려!" },
    ],
  }).passed);
check("operator exposes a separate no-media-env TTS preflight action", /"realTtsPreflight"/.test(operator) && /SCRIPT_ELEVENLABS_TTS_PREFLIGHT/.test(operator) && /approval-preflight-v3/.test(operator));
check("operator exposes the separately approved GET-only audit action", /"realTtsReadonlyPreflight"/.test(operator) && /SCRIPT_ELEVENLABS_READONLY_PREFLIGHT/.test(operator) && /audit-elevenlabs-readonly-preflight-v1\.mjs/.test(operator));
check("read-only audit accepts exactly two content-addressed packets", /packetPaths\.length !== 2/.test(readonlyAudit) && /TWO_PART_PACKET_SET_REQUIRED/.test(readonlyAudit) && /PACKET_HASH_MISMATCH/.test(readonlyAudit));
check("read-only audit has four fixed GET targets and no retry loop", ["\/user\/subscription", "\/voices\/", "\/models", "\/history"].every((token) => readonlyAudit.includes(token)) && (readonlyAudit.match(/getJsonOnce\(/g) ?? []).length === 5 && /method:\s*"GET"/.test(readonlyAudit) && /retries:\s*0/.test(readonlyAudit));
check("read-only audit never writes files or prints provider text", !/writeFile|mkdir|unlink|rmSync|renameSync/.test(readonlyAudit) && /textLength/.test(readonlyAudit) && /textSha256/.test(readonlyAudit) && !/response\.text\(/.test(readonlyAudit) && !/console\.(?:log|error)\([^\n]*apiKey/.test(readonlyAudit));
check("read-only audit uses natural async failure shutdown", !/process\.exit\(/.test(readonlyAudit) && /process\.exitCode\s*=\s*1/.test(readonlyAudit) && /setTimeout\(resolveDelay, 250\)/.test(readonlyAudit));
check("approval packet fails closed outside the 15~60 second contract", /BLOCKED_DURATION_CONTRACT/.test(approvalBuilder) && /targetDurationSec < 15 \|\| targetDurationSec > 60/.test(approvalBuilder) && /apiCallBudgetMax:\s*0/.test(approvalBuilder));
check("media readiness rejects stale input hashes and requires exact opening/body provider parity", /ttsInputContractCurrent/.test(operator) && /phaseAuditReady/.test(operator) && /openingMatchesBodyLead/.test(operator) && /providerBoundaryTagRepeated/.test(operator) && /minjae_two_phase_aligned/.test(operator) && /1\.02,1\.02/.test(operator));

const failed = results.filter((row) => !row.passed);
console.log(JSON.stringify({ passed: failed.length === 0, passedCount: results.length - failed.length, totalCount: results.length, failed }, null, 2));
process.exit(failed.length === 0 ? 0 : 1);
