#!/usr/bin/env node
/**
 * Builds a no-live approval packet from the exact content-addressed Minjae TTS input.
 * No API key, network request, audio generation, upload, or retry path exists here.
 */

import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import {
  buildMinjaeThreePhasePlan,
  buildThreePhaseRequestContext,
  buildThreePhaseRequestFingerprint,
  maskElevenLabsVoiceId,
  validateMinjaeVoicePhaseContract,
} from "./_elevenlabs-three-phase-voice-runtime.mjs";

const ENGINE_VERSION = "money_shorts_korean_director_v2";
const PACKET_SCHEMA = "money_shorts_minjae_two_phase_tts_approval_packet_v2";
const MEDIA_ROOT_RE = /^C:[\\/]+tmp[\\/]+money-shorts-os[\\/]+/i;

const args = process.argv.slice(2);
function getArg(name) {
  const index = args.indexOf(name);
  return index >= 0 && args[index + 1] ? args[index + 1] : null;
}
function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}
function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
function cleanTag(value) {
  const tag = String(value ?? "").trim().toLowerCase();
  return /^[a-z ]{3,24}$/.test(tag) ? tag : null;
}

const ttsScriptPath = resolve(getArg("--tts-script") ?? "");
const outDir = resolve(getArg("--out-dir") ?? "");
const voiceId = String(getArg("--voice-id") ?? "").trim();
const voiceLabel = String(getArg("--voice-label") ?? "").trim();
if (!MEDIA_ROOT_RE.test(ttsScriptPath) || !MEDIA_ROOT_RE.test(outDir + "\\") || !voiceId || !voiceLabel) {
  console.error("ABORT: exact C:\\tmp TTS input, output directory, voice id and voice label are required. No API call was made.");
  process.exit(2);
}

let ttsScript;
try {
  ttsScript = JSON.parse(readFileSync(ttsScriptPath, "utf8"));
} catch (error) {
  console.error(`ABORT: TTS input read failed: ${error.message}. No API call was made.`);
  process.exit(2);
}

const ttsInputJson = JSON.stringify(ttsScript, null, 2);
const ttsInputSha256 = sha256(ttsInputJson);
const ttsInputFingerprint = ttsInputSha256.slice(0, 12);
const jobId = `${String(ttsScript.wizardTopicId ?? "minjae").replace(/[^a-z0-9_-]+/gi, "-")}-two-phase-tts-v2`;
const packetPath = join(outDir, `${jobId}.approval-packet.v2.json`);
if (basename(ttsScriptPath) !== `tts-script.real-${ttsInputFingerprint}.json`) {
  console.error("ABORT: TTS input filename does not match its current content hash. No API call was made.");
  process.exit(2);
}
if (ttsScript.ttsEngineVersion !== ENGINE_VERSION || !validateMinjaeVoicePhaseContract(ttsScript.voicePhaseContract)) {
  console.error("ABORT: exact Minjae two-phase TTS contract is required. No API call was made.");
  process.exit(2);
}
if (ttsScript.sampleReviewMode?.enabled === true) {
  console.error("ABORT: sample-review overrides cannot be mixed into the Minjae approval packet. No API call was made.");
  process.exit(2);
}

const targetDurationSec = Number(ttsScript.targetDurationSec);
if (!Number.isFinite(targetDurationSec) || targetDurationSec < 15 || targetDurationSec > 60) {
  const stableBlockedPacket = {
    schemaVersion: PACKET_SCHEMA,
    status: "BLOCKED_DURATION_CONTRACT",
    jobId,
    wizardTopicId: ttsScript.wizardTopicId ?? null,
    productionPartId: ttsScript.wizardProductionPartId ?? "single",
    ttsInputPath: ttsScriptPath,
    ttsInputContractFingerprint: ttsInputFingerprint,
    ttsInputContractSha256: ttsInputSha256,
    targetDurationSec: Number.isFinite(targetDurationSec) ? targetDurationSec : null,
    durationContract: { minSec: 15, maxSec: 60, passed: false },
    voice: {
      label: voiceLabel,
      idMasked: maskElevenLabsVoiceId(voiceId),
      idSha256: sha256(voiceId),
    },
    generationPolicy: {
      apiCallBudgetMax: 0,
      retryAllowed: false,
      uploadAllowed: false,
      renderAllowed: false,
    },
    noLive: true,
    approvalText: null,
  };
  const blockedPacket = {
    ...stableBlockedPacket,
    packetHash: sha256(JSON.stringify(stableBlockedPacket)),
    generatedAt: new Date().toISOString(),
    packetPath,
  };
  mkdirSync(outDir, { recursive: true });
  writeFileSync(packetPath, JSON.stringify(blockedPacket, null, 2), "utf8");
  console.error(JSON.stringify(blockedPacket));
  process.exit(2);
}

const scenes = Array.isArray(ttsScript.scenes)
  ? ttsScript.scenes.slice().sort((a, b) => Number(a.sceneNumber) - Number(b.sceneNumber))
  : [];
if (scenes.length < 4 || scenes.length > 18) {
  console.error("ABORT: 4~18 ordered scenes are required. No API call was made.");
  process.exit(2);
}

const scenePayloads = scenes.map((scene) => {
  const performanceText = scene?.speechDirection?.engineVersion === "money_shorts_speech_direction_v2"
    ? String(scene.speechDirection.performanceText ?? "").trim()
    : "";
  const tag = cleanTag(scene?.speechDirection?.v3AudioTag);
  if (!performanceText || !tag) {
    console.error(`ABORT: scene ${scene?.sceneNumber ?? "?"} has no approved performance text or tag. No API call was made.`);
    process.exit(2);
  }
  return { scene, performanceText, tag };
});
const continuousParts = scenePayloads.map(({ performanceText, tag }) => `[${tag}]\n${performanceText}`);
const profile = ttsScript.topicSpeechProfile ?? {};
const baseVoiceSettings = {
  stability: Number(clamp(Number(profile.baseStability) || 0.5, 0.42, 0.58).toFixed(2)),
  similarity_boost: Number(clamp(Number(profile.baseSimilarityBoost) || 0.87, 0.82, 0.9).toFixed(2)),
  style: 0,
  speed: Number(clamp(Number(profile.baseSpeed) || 1, 0.95, 1.05).toFixed(2)),
  use_speaker_boost: true,
};

let phasePlan;
try {
  phasePlan = buildMinjaeThreePhasePlan({
    scenePayloads,
    continuousParts,
    baseVoiceSettings,
    contract: ttsScript.voicePhaseContract,
  });
} catch (error) {
  console.error(`ABORT: two-phase plan failed: ${error.message}. No API call was made.`);
  process.exit(2);
}

const modelId = String(ttsScript.modelId ?? "eleven_v3");
const voiceIdMasked = maskElevenLabsVoiceId(voiceId);
const phaseRequests = phasePlan.map((phase, phaseIndex) => {
  const {
    strategy: requestContextStrategy,
    previousText,
    nextText,
  } = buildThreePhaseRequestContext({ modelId, phasePlan, phaseIndex });
  const fingerprint = buildThreePhaseRequestFingerprint({
    engineVersion: ENGINE_VERSION,
    modelId,
    voiceIdMasked,
    phase,
    requestContextStrategy,
    previousText,
    nextText,
  });
  return {
    id: phase.id,
    sceneNumbers: phase.sceneNumbers,
    speed: phase.voiceSettings.speed,
    requestedTag: phase.requestedTag,
    textSha256: sha256(phase.text),
    requestSha256: fingerprint.sha256,
    requestFingerprint: fingerprint.short,
    requestContextStrategy,
    previousContextIncluded: previousText != null,
    nextContextIncluded: nextText != null,
  };
});

const stablePacket = {
  schemaVersion: PACKET_SCHEMA,
  status: "PREFLIGHT_ONLY_OK",
  jobId,
  wizardTopicId: ttsScript.wizardTopicId ?? null,
  productionPartId: ttsScript.wizardProductionPartId ?? "single",
  wizardScriptFingerprint: ttsScript.wizardScriptFingerprint ?? null,
  ttsInputPath: ttsScriptPath,
  ttsInputContractFingerprint: ttsInputFingerprint,
  ttsInputContractSha256: ttsInputSha256,
  engineVersion: ENGINE_VERSION,
  modelId,
  voice: {
    label: voiceLabel,
    idMasked: voiceIdMasked,
    idSha256: sha256(voiceId),
  },
  targetDurationSec,
  durationContract: { minSec: 15, maxSec: 60, passed: true },
  generationPolicy: {
    apiCallBudgetMax: 2,
    retryAllowed: false,
    uploadAllowed: false,
    renderAllowed: false,
    phaseOrder: ["body", "closing"],
    requestContextPolicy: phaseRequests[0].requestContextStrategy,
    providerAdjacentContextIncluded: phaseRequests.some(({ previousContextIncluded, nextContextIncluded }) => previousContextIncluded || nextContextIncluded),
    crossfadeMs: ttsScript.voicePhaseContract.assembly.crossfadeMs,
    loudnessIntegratedLufs: ttsScript.voicePhaseContract.assembly.loudnessIntegratedLufs,
    truePeakDbtp: ttsScript.voicePhaseContract.assembly.truePeakDbtp,
  },
  phaseRequests,
};
const packetHash = sha256(JSON.stringify(stablePacket));
const packet = {
  ...stablePacket,
  packetHash,
  generatedAt: new Date().toISOString(),
  noLive: true,
  approvalText: `APPROVE_MINJAE_TWO_PHASE_TTS: ${jobId} — packet hash ${packetHash}, TTS input hash ${ttsInputSha256}, phase request hashes ${phaseRequests.map((phase) => `${phase.id}:${phase.requestSha256}`).join(", ")} 기준으로 ElevenLabs ${voiceLabel} 2구간 TTS 작업 1회를 승인함; API 호출은 body/closing 최대 2회, 자동 재시도·렌더·업로드 금지`,
};

mkdirSync(outDir, { recursive: true });
writeFileSync(packetPath, JSON.stringify({ ...packet, packetPath }, null, 2), "utf8");
console.log(JSON.stringify({ ...packet, packetPath }));
