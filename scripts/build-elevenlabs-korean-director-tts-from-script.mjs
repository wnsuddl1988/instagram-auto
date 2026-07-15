#!/usr/bin/env node
/**
 * Money Shorts Korean Director TTS v2.
 *
 * Generates the Korean narration as one continuous request by default, or as the Owner-approved
 * Minjae opening/body/closing performance phases. With-timestamps responses are mapped back to
 * the original scene boundaries for the video renderer.
 *
 * Safety:
 * - Owner button is the only caller; no upload/DB/OAuth.
 * - One API call maximum for the legacy continuous path; exactly three phase calls maximum for
 *   the Minjae phase path. No retry/fallback paid call.
 * - Secrets are accepted from process.env only and never logged or persisted.
 * - Inputs and outputs must stay under C:\tmp\money-shorts-os\ and outside the repo.
 */

import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  buildMinjaeThreePhasePlan,
  buildThreePhaseRequestFingerprint,
  buildThreePhaseAudioFilter,
  maskElevenLabsVoiceId,
  mergeThreePhaseCharacterAlignments,
  validateMinjaeVoicePhaseContract,
} from "./_elevenlabs-three-phase-voice-runtime.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const ENGINE_VERSION = "money_shorts_korean_director_v2";
const SUMMARY_SCHEMA = "money_shorts_elevenlabs_scene_paced_tts_summary_v1";
const SAMPLE_REVIEW_CONTRACT_VERSION = "money_shorts_av_sample_review_v1";
const SAMPLE_REVIEW_TOPIC_ID = "gen-finance-editorial-v2-housing_asset_gap-psychology_gap-04";
const STAGED_COVER_CONTRACT_VERSION = "money_shorts_staged_prehook_cover_v1";
const LEGACY_API_CALL_BUDGET_MAX = 1;
const THREE_PHASE_API_CALL_BUDGET_MAX = 3;
const MEDIA_ROOT_RE = /^C:[\\/]+tmp[\\/]+money-shorts-os[\\/]+/i;

const args = process.argv.slice(2);
function getArg(name) {
  const index = args.indexOf(name);
  return index >= 0 && args[index + 1] ? args[index + 1] : null;
}

const ttsScriptArg = getArg("--tts-script");
const outDirArg = getArg("--out-dir");
if (!ttsScriptArg || !outDirArg) {
  console.error("Usage: node build-elevenlabs-korean-director-tts-from-script.mjs --tts-script <path> --out-dir <path>");
  process.exit(2);
}

const ttsScriptPath = resolve(ttsScriptArg);
const outDir = resolve(outDirArg);
if (!MEDIA_ROOT_RE.test(ttsScriptPath) || !MEDIA_ROOT_RE.test(outDir + "\\")) {
  console.error("ABORT: --tts-script and --out-dir must be under C:\\tmp\\money-shorts-os\\.");
  process.exit(2);
}
if (outDir.startsWith(REPO_ROOT + "\\") || outDir.startsWith(REPO_ROOT + "/")) {
  console.error("ABORT: --out-dir must be outside the repository.");
  process.exit(2);
}
if ([ttsScriptPath, outDir].some((value) => value.includes(".money-shorts-local"))) {
  console.error("ABORT: .money-shorts-local access forbidden.");
  process.exit(2);
}

let ttsScript;
try {
  ttsScript = JSON.parse(readFileSync(ttsScriptPath, "utf8"));
} catch (error) {
  console.error(`ABORT: TTS script read failed: ${error.message}`);
  process.exit(2);
}

const scenes = Array.isArray(ttsScript.scenes)
  ? ttsScript.scenes.slice().sort((a, b) => Number(a.sceneNumber) - Number(b.sceneNumber))
  : [];
if (
  ttsScript.ttsEngineVersion !== ENGINE_VERSION ||
  ttsScript.prosodyPolicy !== "korean_native_cadence_v2" ||
  scenes.length < 4 ||
  scenes.length > 18
) {
  console.error(`ABORT: ${ENGINE_VERSION} TTS script with 4~18 flow-derived scenes required.`);
  process.exit(2);
}

const voicePhaseContract = ttsScript?.voicePhaseContract;
const voicePhaseEnabled = voicePhaseContract?.enabled === true;
if (voicePhaseEnabled) {
  if (!validateMinjaeVoicePhaseContract(voicePhaseContract)) {
    console.error("ABORT: invalid money_shorts_character_voice_phase_v1 contract. No API call was made.");
    process.exit(2);
  }
}
const API_CALL_BUDGET_MAX = voicePhaseEnabled ? THREE_PHASE_API_CALL_BUDGET_MAX : LEGACY_API_CALL_BUDGET_MAX;

function semanticText(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .replace(/[\s"'“”‘’.,!?…，。！？:;；：]+/gu, "")
    .toLowerCase();
}

const coverContract = ttsScript?.coverContract;
const stagedCoverEnabled = coverContract?.enabled === true;
if (stagedCoverEnabled) {
  const lines = Array.isArray(coverContract.lines) ? coverContract.lines : [];
  const spokenText = lines.map((line) => String(line?.spokenText ?? "").trim()).join("\n");
  const displayText = lines.map((line) => String(line?.displayText ?? "").trim()).join("\n");
  const sceneOneNarration = String(scenes[0]?.narration ?? "").trim();
  const coverContractValid =
    coverContract.contractVersion === STAGED_COVER_CONTRACT_VERSION &&
    coverContract.sceneNumber === 1 &&
    coverContract.visualOnlyPunctuation === true &&
    lines.length === 3 &&
    lines.every((line) =>
      typeof line?.spokenText === "string" && line.spokenText.trim().length > 0 &&
      typeof line?.displayText === "string" && line.displayText.trim().length > 0 &&
      !/[!?]{2,}/u.test(line.spokenText) && /[!?]/u.test(line.displayText) &&
      semanticText(line.spokenText) === semanticText(line.displayText)) &&
    semanticText(spokenText) === semanticText(displayText) &&
    semanticText(spokenText) === semanticText(sceneOneNarration) &&
    semanticText(coverContract.spokenText) === semanticText(spokenText) &&
    semanticText(coverContract.displayText) === semanticText(displayText);
  if (!coverContractValid) {
    console.error("ABORT: staged cover spoken/display contract is invalid or display punctuation leaked into narration.");
    process.exit(2);
  }
}

mkdirSync(outDir, { recursive: true });
const summaryPath = join(outDir, "elevenlabs-scene-paced-tts-summary.json");
const ttsInputContractSha256 = createHash("sha256").update(JSON.stringify(ttsScript, null, 2)).digest("hex");
const ttsInputContractFingerprint = ttsInputContractSha256.slice(0, 12);

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function cleanTag(value) {
  const tag = String(value ?? "").trim().toLowerCase();
  return /^[a-z ]{3,24}$/.test(tag) ? tag : null;
}

function sceneDirectorTag(scene) {
  const requested = cleanTag(scene?.speechDirection?.v3AudioTag);
  if (requested) return requested;
  const fallback = {
    hook: "confident",
    problem: "serious",
    situation: "conversational",
    consequence: "serious",
    psychology: "thoughtful",
    mindset: "confident",
    habit: "confident",
    recommendation: "confident",
    save: "confident",
  };
  return fallback[scene?.sceneRole] ?? "confident";
}

function scenePerformanceText(scene) {
  const direction = scene?.speechDirection;
  if (direction?.engineVersion !== "money_shorts_speech_direction_v2") return null;
  const text = String(direction.performanceText ?? "").trim();
  return text.length > 0 ? text : null;
}

function scenePerformanceSegments(scene, performanceText) {
  const directed = Array.isArray(scene?.speechDirection?.segments)
    ? scene.speechDirection.segments
      .map((segment) => ({
        text: String(segment?.text ?? "").trim(),
        pauseAfterMs: Number(segment?.pauseAfterMs) || 0,
      }))
      .filter((segment) => segment.text.length > 0)
    : [];
  return directed.length > 0
    ? directed
    : performanceText.split(/\n+/u).map((text) => ({ text: text.trim(), pauseAfterMs: 0 })).filter((segment) => segment.text);
}

function sampleReviewTagForScene(scene) {
  const tags = {
    hook: "thoughtfully",
    situation: "conversationally",
    consequence: "seriously",
    psychology: "thoughtfully",
    mindset: "calmly",
    habit: "clearly",
    recommendation: "calmly",
    save: "calmly",
  };
  return tags[scene?.sceneRole] ?? "calmly";
}

const sampleReviewMode = ttsScript?.sampleReviewMode;
const sampleReviewEnabled = sampleReviewMode?.enabled === true &&
  sampleReviewMode?.contractVersion === SAMPLE_REVIEW_CONTRACT_VERSION &&
  sampleReviewMode?.topicId === SAMPLE_REVIEW_TOPIC_ID &&
  ttsScript?.wizardTopicId === SAMPLE_REVIEW_TOPIC_ID;

const scenePayloads = scenes.map((scene) => {
  const performanceText = scenePerformanceText(scene);
  if (!performanceText) {
    console.error(`ABORT: scene ${scene.sceneNumber} has no speech direction v2 performance text.`);
    process.exit(2);
  }
  return {
    scene,
    performanceText,
    performanceSegments: scenePerformanceSegments(scene, performanceText),
    tag: sceneDirectorTag(scene),
  };
});

const modelId = String(ttsScript.modelId ?? "eleven_v3");
const isElevenV3 = /^eleven_v3(?:$|_)/.test(modelId);
const topicProfile = ttsScript.topicSpeechProfile ?? {};
const globalTag = cleanTag(topicProfile.globalV3Tag) ?? "confident";
const continuousParts = scenePayloads.map(({ scene, performanceText, performanceSegments, tag }, index) => {
  if (!isElevenV3) return performanceText;
  const effectiveTag = sampleReviewEnabled
    ? sampleReviewTagForScene(scene)
    : index === 0 && tag === globalTag ? globalTag : tag;
  const directedText = sampleReviewEnabled
    ? performanceSegments.map((segment, segmentIndex) => {
      const pause = segmentIndex < performanceSegments.length - 1 && segment.pauseAfterMs >= 350 ? "\n[pause]" : "";
      return `${segment.text}${pause}`;
    }).join("\n")
    : performanceText;
  const sceneBeat = sampleReviewEnabled && index < scenePayloads.length - 1 ? "\n[continues after a beat]" : "";
  return `[${effectiveTag}]\n${directedText}${sceneBeat}`;
});
const continuousText = continuousParts.join("\n\n");
if (continuousText.replace(/\[[^\]]+\]/g, "").replace(/\s+/g, "").length < 120) {
  console.error("ABORT: continuous narration is too short for stable Korean direction.");
  process.exit(2);
}

const apiKey = process.env.ELEVENLABS_API_KEY;
const voiceId = process.env.ELEVENLABS_VOICE_ID;
const voiceLabel = process.env.ELEVENLABS_VOICE_LABEL ?? null;
const missingEnv = [];
if (!apiKey) missingEnv.push("ELEVENLABS_API_KEY");
if (!voiceId) missingEnv.push("ELEVENLABS_VOICE_ID");

const baseSpeed = Number(topicProfile.baseSpeed);
const speedBounds = sampleReviewEnabled ? [0.7, 1.2] : [0.95, 1.05];
const voiceSettings = {
  stability: Number(clamp(Number(topicProfile.baseStability) || 0.5, 0.42, 0.58).toFixed(2)),
  similarity_boost: Number(clamp(Number(topicProfile.baseSimilarityBoost) || 0.87, 0.82, 0.9).toFixed(2)),
  style: 0,
  speed: Number(clamp(Number.isFinite(baseSpeed) ? baseSpeed : 1, speedBounds[0], speedBounds[1]).toFixed(2)),
  use_speaker_boost: true,
};
let voicePhasePlan = null;
if (voicePhaseEnabled) {
  try {
    voicePhasePlan = buildMinjaeThreePhasePlan({
      scenePayloads,
      continuousParts,
      baseVoiceSettings: voiceSettings,
      contract: voicePhaseContract,
    });
  } catch (error) {
    console.error(`ABORT: Minjae three-phase plan failed: ${error.message}. No API call was made.`);
    process.exit(2);
  }
}
const openingSpeedCap = Number(ttsScript?.openingVoiceContract?.speedCap);
const openingVoiceAudit = stagedCoverEnabled ? {
  contractVersion: STAGED_COVER_CONTRACT_VERSION,
  voicePhaseContractVersion: voicePhaseEnabled ? voicePhaseContract.contractVersion : null,
  requestedTag: ttsScript?.openingVoiceContract?.v3AudioTag ?? null,
  appliedFirstTag: scenePayloads[0]?.tag ?? null,
  speed: voicePhaseEnabled ? voicePhasePlan[0].voiceSettings.speed : voiceSettings.speed,
  speedCap: Number.isFinite(openingSpeedCap) ? openingSpeedCap : null,
  requestedTagApplied:
    ttsScript?.openingVoiceContract?.v3AudioTag === scenePayloads[0]?.tag,
  confidentFirstTag:
    !voicePhaseEnabled &&
    ttsScript?.openingVoiceContract?.v3AudioTag === "confidently" &&
    scenePayloads[0]?.tag === "confidently",
  speedWithinCap: Number.isFinite(openingSpeedCap) &&
    (voicePhaseEnabled ? voicePhasePlan[0].voiceSettings.speed : voiceSettings.speed) <= openingSpeedCap,
  visualOnlyPunctuation: coverContract?.visualOnlyPunctuation === true,
} : null;
if (openingVoiceAudit) {
  openingVoiceAudit.passed =
    (voicePhaseEnabled ? openingVoiceAudit.requestedTagApplied === true : openingVoiceAudit.confidentFirstTag === true) &&
    openingVoiceAudit.speedWithinCap === true &&
    openingVoiceAudit.visualOnlyPunctuation === true;
  if (!openingVoiceAudit.passed) {
    console.error("ABORT: staged cover opening voice contract failed before API call.");
    process.exit(2);
  }
}

function writeReadinessFailure() {
  const summary = {
    schemaVersion: SUMMARY_SCHEMA,
    mode: "elevenlabs_korean_director_continuous",
    ttsEngineVersion: ENGINE_VERSION,
    provider: "elevenlabs",
    liveApiCallPerformed: false,
    newApiCallPerformed: false,
    readinessFailure: true,
    missingEnv,
    apiCallCount: 0,
    apiCallBudgetMax: API_CALL_BUDGET_MAX,
    ttsInputContractFingerprint,
    ttsInputContractSha256,
    sceneCount: scenes.length,
    generationMode: voicePhaseEnabled ? "minjae_three_phase_aligned" : "continuous_full_script",
    timelineAudioPath: null,
    alignmentPath: null,
    timelineDurationSec: null,
    qualityAccepted: false,
    ownerListeningRequired: true,
    voiceIdMasked: null,
    modelId,
    sampleReviewMode: sampleReviewEnabled ? sampleReviewMode : null,
    coverContractVersion: stagedCoverEnabled ? STAGED_COVER_CONTRACT_VERSION : null,
    openingVoiceAudit,
    voicePhaseContractVersion: voicePhaseEnabled ? voicePhaseContract.contractVersion : null,
    phaseGenerationAudit: null,
    scenes: [],
    riskNotes: ["Missing required media environment. No ElevenLabs API call was made."],
  };
  writeFileSync(summaryPath, JSON.stringify(summary, null, 2), "utf8");
}

if (missingEnv.length > 0) {
  writeReadinessFailure();
  console.error(`READINESS FAILURE: Missing env: ${missingEnv.join(", ")}. No API call was made.`);
  process.exit(3);
}

const voiceIdMasked = maskElevenLabsVoiceId(voiceId);
const inputFingerprint = createHash("sha256").update(JSON.stringify({
  engineVersion: ENGINE_VERSION,
  modelId,
  voiceIdMasked,
  voiceSettings,
  voicePhaseContract: voicePhaseEnabled ? voicePhaseContract : null,
  voicePhasePlan: voicePhasePlan?.map(({ id, sceneNumbers, text, voiceSettings: phaseVoiceSettings }) => ({
    id,
    sceneNumbers,
    text,
    voiceSettings: phaseVoiceSettings,
  })) ?? null,
  topicProfileId: topicProfile.id ?? "economic_authority",
  sampleReviewContractVersion: sampleReviewEnabled ? SAMPLE_REVIEW_CONTRACT_VERSION : null,
  continuousText,
})).digest("hex").slice(0, 14);
const wizardScriptFingerprint = typeof ttsScript.wizardScriptFingerprint === "string" ? ttsScript.wizardScriptFingerprint : null;
const rawAudioPath = join(outDir, `elevenlabs-korean-director-${inputFingerprint}.mp3`);
const alignmentPath = join(outDir, `elevenlabs-korean-director-${inputFingerprint}.alignment.json`);
const timelineAudioPath = join(outDir, `elevenlabs-korean-director-${inputFingerprint}.m4a`);

function validateAlignment(value) {
  const characters = value?.characters;
  const starts = value?.character_start_times_seconds;
  const ends = value?.character_end_times_seconds;
  return Array.isArray(characters) && characters.length > 0 &&
    Array.isArray(starts) && starts.length === characters.length &&
    Array.isArray(ends) && ends.length === characters.length;
}

let alignment;
let apiCallCount = 0;
let reusedRawAudio = false;
let phaseArtifacts = [];
let phaseGenerationAudit = null;
const endpoint = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}/with-timestamps?output_format=mp3_44100_128`;

async function loadOrRequestAlignedAudio({ text, previousText = null, nextText = null, settings, fingerprint, rawPath, alignmentCachePath, phaseId }) {
  if (existsSync(rawPath) && existsSync(alignmentCachePath)) {
    try {
      const saved = JSON.parse(readFileSync(alignmentCachePath, "utf8"));
      if (saved.inputFingerprint === fingerprint && validateAlignment(saved.alignment)) {
        return { alignment: saved.alignment, reused: true };
      }
    } catch {
      // Invalid or stale cache falls through to one budgeted request.
    }
  }
  if (apiCallCount >= API_CALL_BUDGET_MAX) {
    console.error(`ABORT: ElevenLabs API call budget exhausted before ${phaseId}. No retry was attempted.`);
    process.exit(1);
  }
  const seed = parseInt(fingerprint.slice(0, 8), 16);
  const requestBody = {
    text,
    model_id: modelId,
    voice_settings: settings,
    seed,
    apply_text_normalization: "auto",
    ...(previousText ? { previous_text: previousText } : {}),
    ...(nextText ? { next_text: nextText } : {}),
    ...(isElevenV3 ? { language_code: "ko" } : {}),
  };
  let response;
  try {
    apiCallCount += 1;
    response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(requestBody),
    });
  } catch (error) {
    console.error(`ABORT: ElevenLabs ${phaseId} request failed: ${error.message}`);
    process.exit(1);
  }
  if (!response.ok) {
    const errorText = await response.text().catch(() => "(unreadable)");
    console.error(`ABORT: ElevenLabs ${phaseId} API returned ${response.status}: ${errorText.slice(0, 180)}`);
    process.exit(1);
  }
  let body;
  try {
    body = await response.json();
  } catch {
    console.error("ABORT: ElevenLabs timing response was not JSON.");
    process.exit(1);
  }
  const responseAlignment = validateAlignment(body.alignment) ? body.alignment : body.normalized_alignment;
  if (typeof body.audio_base64 !== "string" || !validateAlignment(responseAlignment)) {
    console.error(`ABORT: ElevenLabs ${phaseId} response is missing audio or character alignment.`);
    process.exit(1);
  }
  writeFileSync(rawPath, Buffer.from(body.audio_base64, "base64"));
  writeFileSync(alignmentCachePath, JSON.stringify({
    engineVersion: ENGINE_VERSION,
    phaseId,
    inputFingerprint: fingerprint,
    alignment: responseAlignment,
  }, null, 2), "utf8");
  return { alignment: responseAlignment, reused: false };
}

if (voicePhaseEnabled) {
  for (const [phaseIndex, phase] of voicePhasePlan.entries()) {
    const previousText = phaseIndex > 0 ? voicePhasePlan[phaseIndex - 1].text : null;
    const nextText = phaseIndex < voicePhasePlan.length - 1 ? voicePhasePlan[phaseIndex + 1].text : null;
    const phaseFingerprint = buildThreePhaseRequestFingerprint({
      engineVersion: ENGINE_VERSION,
      modelId,
      voiceIdMasked,
      phase,
      previousText,
      nextText,
    }).short;
    const phaseRawAudioPath = join(outDir, `elevenlabs-korean-director-${inputFingerprint}-${phase.id}-${phaseFingerprint}.mp3`);
    const phaseAlignmentPath = join(outDir, `elevenlabs-korean-director-${inputFingerprint}-${phase.id}-${phaseFingerprint}.alignment.json`);
    const result = await loadOrRequestAlignedAudio({
      text: phase.text,
      previousText,
      nextText,
      settings: phase.voiceSettings,
      fingerprint: phaseFingerprint,
      rawPath: phaseRawAudioPath,
      alignmentCachePath: phaseAlignmentPath,
      phaseId: phase.id,
    });
    const audioProbe = probeAudio(phaseRawAudioPath);
    if (!audioProbe) {
      console.error(`ABORT: generated ${phase.id} phase audio is invalid.`);
      process.exit(1);
    }
    phaseArtifacts.push({
      ...phase,
      inputFingerprint: phaseFingerprint,
      rawAudioPath: phaseRawAudioPath,
      alignmentPath: phaseAlignmentPath,
      alignment: result.alignment,
      audioDurationSec: audioProbe.durationSec,
      audioCodec: audioProbe.codec,
      reused: result.reused,
    });
  }
  reusedRawAudio = phaseArtifacts.every(({ reused }) => reused);
  let merged;
  try {
    merged = mergeThreePhaseCharacterAlignments(phaseArtifacts, voicePhaseContract.assembly.crossfadeMs);
  } catch (error) {
    console.error(`ABORT: Minjae phase alignment merge failed: ${error.message}`);
    process.exit(1);
  }
  alignment = merged.alignment;
  phaseGenerationAudit = {
    contractVersion: voicePhaseContract.contractVersion,
    mode: voicePhaseContract.assembly.mode,
    phaseCount: phaseArtifacts.length,
    phaseOrder: phaseArtifacts.map(({ id }) => id),
    phaseOffsetsSec: merged.phaseOffsetsSec,
    crossfadeMs: voicePhaseContract.assembly.crossfadeMs,
    joinedDurationBeforeTailSec: merged.joinedDurationSec,
    loudnessIntegratedLufs: voicePhaseContract.assembly.loudnessIntegratedLufs,
    truePeakDbtp: voicePhaseContract.assembly.truePeakDbtp,
    phases: phaseArtifacts.map(({ id, sceneNumbers, voiceSettings: settings, inputFingerprint: fingerprint, audioDurationSec, reused }) => ({
      id,
      sceneNumbers,
      voiceSettingsSanitized: settings,
      inputFingerprint: fingerprint,
      audioDurationSec,
      reused,
    })),
  };
  writeFileSync(alignmentPath, JSON.stringify({
    engineVersion: ENGINE_VERSION,
    inputFingerprint,
    contractVersion: voicePhaseContract.contractVersion,
    phaseOffsetsSec: merged.phaseOffsetsSec,
    crossfadeMs: voicePhaseContract.assembly.crossfadeMs,
    alignment,
  }, null, 2), "utf8");
} else {
  const result = await loadOrRequestAlignedAudio({
    text: continuousText,
    settings: voiceSettings,
    fingerprint: inputFingerprint,
    rawPath: rawAudioPath,
    alignmentCachePath: alignmentPath,
    phaseId: "continuous",
  });
  alignment = result.alignment;
  reusedRawAudio = result.reused;
}

function probeAudio(audioPath) {
  const result = spawnSync("ffprobe", ["-v", "quiet", "-print_format", "json", "-show_format", "-show_streams", audioPath], {
    encoding: "utf8",
    maxBuffer: 2 * 1024 * 1024,
    shell: false,
  });
  if ((result.status ?? -1) !== 0) return null;
  try {
    const parsed = JSON.parse(result.stdout);
    const stream = (parsed.streams ?? []).find((item) => item.codec_type === "audio");
    const durationSec = Number(parsed.format?.duration);
    return stream && Number.isFinite(durationSec) && durationSec > 0
      ? { durationSec, codec: stream.codec_name ?? "unknown" }
      : null;
  } catch {
    return null;
  }
}

const rawProbe = voicePhaseEnabled ? null : probeAudio(rawAudioPath);
if (!voicePhaseEnabled && !rawProbe) {
  console.error("ABORT: generated Korean director audio is invalid.");
  process.exit(1);
}

const FINAL_TAIL_SEC = 0.28;
if (!existsSync(timelineAudioPath)) {
  const convertedDuration = Number(((voicePhaseEnabled
    ? phaseGenerationAudit.joinedDurationBeforeTailSec
    : rawProbe.durationSec) + FINAL_TAIL_SEC).toFixed(3));
  const convertArgs = voicePhaseEnabled
    ? [
        "-y",
        ...phaseArtifacts.flatMap(({ rawAudioPath: phaseRawAudioPath }) => ["-i", phaseRawAudioPath]),
        "-filter_complex", buildThreePhaseAudioFilter({
          crossfadeMs: voicePhaseContract.assembly.crossfadeMs,
          finalTailSec: FINAL_TAIL_SEC,
          loudnessIntegratedLufs: voicePhaseContract.assembly.loudnessIntegratedLufs,
          truePeakDbtp: voicePhaseContract.assembly.truePeakDbtp,
        }),
        "-map", "[aout]", "-t", String(convertedDuration),
        "-c:a", "aac", "-ar", "44100", "-b:a", "128k", timelineAudioPath,
      ]
    : [
        "-y", "-i", rawAudioPath,
        "-filter_complex", `[0:a]apad=pad_dur=${FINAL_TAIL_SEC}[aout]`,
        "-map", "[aout]", "-t", String(convertedDuration),
        "-c:a", "aac", "-b:a", "128k", timelineAudioPath,
      ];
  const convert = spawnSync("ffmpeg", convertArgs, {
    encoding: "utf8",
    maxBuffer: 8 * 1024 * 1024,
    shell: false,
  });
  if ((convert.status ?? -1) !== 0) {
    console.error(`ABORT: ffmpeg conversion failed: ${(convert.stderr ?? "").slice(-240)}`);
    process.exit(1);
  }
}

const timelineProbe = probeAudio(timelineAudioPath);
if (!timelineProbe) {
  console.error("ABORT: Korean director timeline audio is invalid.");
  process.exit(1);
}
if (phaseGenerationAudit) {
  phaseGenerationAudit.timelineDurationSec = timelineProbe.durationSec;
  phaseGenerationAudit.finalTailSec = FINAL_TAIL_SEC;
}

const alignedText = alignment.characters.join("");
let searchCursor = 0;
const timedRanges = scenePayloads.map(({ scene, performanceText, performanceSegments, tag }) => {
  const timedIndexes = [];
  for (const segment of performanceSegments) {
    const segmentStartIndex = alignedText.indexOf(segment.text, searchCursor);
    if (segmentStartIndex < 0) {
      console.error(`ABORT: scene ${scene.sceneNumber} segment was not found in character alignment.`);
      process.exit(1);
    }
    const segmentEndIndex = segmentStartIndex + segment.text.length - 1;
    searchCursor = segmentEndIndex + 1;
    for (let index = segmentStartIndex; index <= segmentEndIndex; index++) {
      if (Number.isFinite(Number(alignment.character_start_times_seconds[index])) && Number.isFinite(Number(alignment.character_end_times_seconds[index]))) {
        timedIndexes.push(index);
      }
    }
  }
  if (timedIndexes.length === 0) {
    console.error(`ABORT: scene ${scene.sceneNumber} has no usable aligned characters.`);
    process.exit(1);
  }
  return {
    scene,
    performanceText,
    tag,
    spokenStartSec: Number(alignment.character_start_times_seconds[timedIndexes[0]]),
    spokenEndSec: Number(alignment.character_end_times_seconds[timedIndexes[timedIndexes.length - 1]]),
  };
});

const sceneResults = timedRanges.map((range, index) => {
  const startSec = index === 0 ? 0 : timedRanges[index].spokenStartSec;
  const endSec = index === timedRanges.length - 1 ? timelineProbe.durationSec : timedRanges[index + 1].spokenStartSec;
  const normalizedDurationSec = Number((endSec - startSec).toFixed(3));
  if (!Number.isFinite(normalizedDurationSec) || normalizedDurationSec < 1 || normalizedDurationSec > 15) {
    console.error(`ABORT: scene ${range.scene.sceneNumber} aligned duration is outside 1..15s: ${normalizedDurationSec}`);
    process.exit(1);
  }
  const phaseForScene = voicePhaseEnabled
    ? voicePhasePlan.find(({ startIndex, endIndex }) => index >= startIndex && index < endIndex)
    : null;
  return {
    sceneNumber: range.scene.sceneNumber,
    sceneRole: range.scene.sceneRole,
    plannedDurationSec: range.scene.durationSec,
    targetDurationSec: normalizedDurationSec,
    normalizedDurationSec,
    startSec: Number(startSec.toFixed(3)),
    endSec: Number(endSec.toFixed(3)),
    spokenStartSec: Number(range.spokenStartSec.toFixed(3)),
    spokenEndSec: Number(range.spokenEndSec.toFixed(3)),
    textSource: "speechDirectionV2Continuous",
    speechDirectionApplied: true,
    speechDirectionEngineVersion: "money_shorts_speech_direction_v2",
    speechRenderingMode: voicePhaseEnabled
      ? "eleven_v3_three_phase_aligned_audio_tags"
      : isElevenV3 ? "eleven_v3_continuous_audio_tags" : "multilingual_v2_continuous_punctuation",
    delivery: range.scene.speechDirection?.delivery ?? "unknown",
    directorTag: range.tag,
    cadenceSequence: Array.isArray(range.scene.speechDirection?.segments)
      ? range.scene.speechDirection.segments.map((segment) => segment.cadence)
      : [],
    emphasisWords: range.scene.speechDirection?.emphasisWords ?? [],
    inputFingerprint,
    voicePhaseId: phaseForScene?.id ?? null,
    sceneVoiceSettingsSanitized: phaseForScene?.voiceSettings ?? voiceSettings,
    rawAudioDurationSec: Number((range.spokenEndSec - range.spokenStartSec).toFixed(3)),
    audioPath: timelineAudioPath,
    normalizedAudioPath: timelineAudioPath,
    status: voicePhaseEnabled
      ? reusedRawAudio ? "reused_three_phase_aligned" : "three_phase_aligned"
      : reusedRawAudio ? "reused_continuous_aligned" : "continuous_aligned",
    riskNotes: [],
  };
});

const plannedTargetDurationSec = Number(ttsScript.targetDurationSec) || null;
const durationRatio = plannedTargetDurationSec
  ? Number((timelineProbe.durationSec / plannedTargetDurationSec).toFixed(4))
  : null;
const acceptedDurationRatio = Array.isArray(sampleReviewMode?.voiceContract?.acceptedDurationRatio)
  ? sampleReviewMode.voiceContract.acceptedDurationRatio.map(Number)
  : [0.95, 1.08];
const durationWithinTargetRange = !sampleReviewEnabled || (
  durationRatio !== null &&
  Number.isFinite(acceptedDurationRatio[0]) &&
  Number.isFinite(acceptedDurationRatio[1]) &&
  durationRatio >= acceptedDurationRatio[0] &&
  durationRatio <= acceptedDurationRatio[1]
);
const sampleReviewAudit = sampleReviewEnabled ? {
  contractVersion: SAMPLE_REVIEW_CONTRACT_VERSION,
  topicId: SAMPLE_REVIEW_TOPIC_ID,
  speed: voiceSettings.speed,
  phrasePauseTagCount: (continuousText.match(/\[pause\]/g) ?? []).length,
  sceneBeatTagCount: (continuousText.match(/\[continues after a beat\]/g) ?? []).length,
  plannedTargetDurationSec,
  actualDurationSec: timelineProbe.durationSec,
  durationRatio,
  acceptedDurationRatio,
  durationWithinTargetRange,
  ownerListeningRequired: true,
} : null;

const summary = {
  schemaVersion: SUMMARY_SCHEMA,
  mode: "elevenlabs_korean_director_continuous",
  ttsEngineVersion: ENGINE_VERSION,
  provider: "elevenlabs",
  liveApiCallPerformed: true,
  newApiCallPerformed: apiCallCount > 0,
  readinessFailure: false,
  apiCallCount,
  apiCallBudgetMax: API_CALL_BUDGET_MAX,
  ttsInputContractFingerprint,
  ttsInputContractSha256,
  sceneCount: scenes.length,
  generationMode: voicePhaseEnabled ? "minjae_three_phase_aligned" : "continuous_full_script",
  timingPolicy: "character_aligned_continuous_v2",
  prosodyPolicy: "korean_native_cadence_v2",
  speechDirectionEngineVersion: "money_shorts_speech_direction_v2",
  speechContextPolicy: voicePhaseEnabled ? "opening_body_closing_continuity_with_crossfade" : "continuous_full_script",
  topicSpeechProfileId: topicProfile.id ?? "economic_authority",
  speakerStance: topicProfile.speakerStance ?? null,
  deliveryArc: topicProfile.arc ?? null,
  plannedTargetDurationSec,
  targetDurationSec: timelineProbe.durationSec,
  timelineAudioPath,
  alignmentPath,
  timelineDurationSec: timelineProbe.durationSec,
  timelineAudioCodec: timelineProbe.codec,
  qualityAccepted: false,
  ownerListeningRequired: true,
  sampleReviewMode: sampleReviewEnabled ? sampleReviewMode : null,
  sampleReviewAudit,
  voicePhaseContractVersion: voicePhaseEnabled ? voicePhaseContract.contractVersion : null,
  phaseGenerationAudit,
  coverContractVersion: stagedCoverEnabled ? STAGED_COVER_CONTRACT_VERSION : null,
  openingVoiceAudit,
  apiKeyConfigured: true,
  voiceIdConfigured: true,
  voiceIdMasked,
  voiceLabel,
  voicePresetId: "korean_confident_director_v2",
  voiceSettingsSanitized: voiceSettings,
  modelId,
  inputFingerprint,
  wizardScriptFingerprint,
  generatedAt: new Date().toISOString(),
  scenes: sceneResults,
  riskNotes: [
    "Korean continuous director v2 sample; Owner listening review is required.",
    voicePhaseEnabled
      ? "Minjae narration was generated as three aligned performance phases and assembled with the Owner-approved crossfade and loudness target."
      : "Full narration was generated in one request and scene timing came from character alignment.",
    ...(voicePhaseEnabled ? ["Opening/body/closing phase caches prevent duplicate paid calls for matching fingerprints; no automatic retry exists."] : []),
    ...(sampleReviewEnabled ? ["Single-topic A/V review contract applied; no 500-topic rollout is implied."] : []),
    "No upload performed. Audio generated outside the repository.",
  ],
};
writeFileSync(summaryPath, JSON.stringify(summary, null, 2), "utf8");

console.log("[korean-director-v2] complete");
console.log(`  model: ${modelId}`);
console.log(`  profile: ${summary.topicSpeechProfileId}`);
console.log(`  scenes: ${sceneResults.length}`);
console.log(`  api calls: ${apiCallCount}/${API_CALL_BUDGET_MAX}`);
console.log(`  duration: ${timelineProbe.durationSec.toFixed(3)}s`);
console.log(`  summary: ${summaryPath}`);
