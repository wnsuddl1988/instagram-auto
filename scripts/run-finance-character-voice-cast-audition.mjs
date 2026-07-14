#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);
function argValue(name, fallback = null) {
  const exact = args.find((arg) => arg.startsWith(`${name}=`));
  if (exact) return exact.slice(name.length + 1);
  const index = args.indexOf(name);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
}

const castDataPath = path.resolve(argValue("--cast-data", "lib/finance-character-voice-cast-data.json"));
const outDir = path.resolve(argValue("--out-dir", "C:\\tmp\\money-shorts-os\\finance-character-voice-audition-v1"));
const execute = args.includes("--execute");
const preflightOnly = args.includes("--preflight-only") || !execute;
const paidCallCap = Number(argValue("--paid-call-cap", "4"));
const mediaRoot = /^C:[\\/]+tmp[\\/]+money-shorts-os[\\/]+/i;
const summaryPath = path.join(outDir, "voice-audition-summary.json");
const preflightSummaryPath = path.join(outDir, "voice-preflight-summary.json");

if (!mediaRoot.test(outDir + path.sep)) {
  console.error("ABORT: --out-dir must stay under C:\\tmp\\money-shorts-os\\.");
  process.exit(2);
}
if (!Number.isInteger(paidCallCap) || paidCallCap < 1 || paidCallCap > 4) {
  console.error("ABORT: --paid-call-cap must be an integer from 1 to 4.");
  process.exit(2);
}

let cast;
try {
  cast = JSON.parse(fs.readFileSync(castDataPath, "utf8"));
} catch (error) {
  console.error(`ABORT: voice cast data read failed: ${error.message}`);
  process.exit(2);
}

const characters = Array.isArray(cast.characters) ? cast.characters : [];
if (characters.length !== 4 || cast.status !== "provisional_owner_audition_required") {
  console.error("ABORT: exactly four provisional finance character voices are required.");
  process.exit(2);
}

const apiKey = process.env.ELEVENLABS_API_KEY;
if (!apiKey) {
  console.error("READINESS FAILURE: ELEVENLABS_API_KEY missing. No API call was made.");
  process.exit(3);
}
if (execute && process.env.ALLOW_ELEVENLABS_AUDITION !== "1") {
  console.error("ABORT: ALLOW_ELEVENLABS_AUDITION=1 is required for the paid audition.");
  process.exit(3);
}

fs.mkdirSync(outDir, { recursive: true });

function fingerprint(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, 14);
}

function probeAudio(filePath) {
  const probe = spawnSync("ffprobe", [
    "-v", "quiet", "-print_format", "json", "-show_format", "-show_streams", filePath,
  ], { encoding: "utf8", maxBuffer: 2 * 1024 * 1024, shell: false });
  if ((probe.status ?? -1) !== 0) return null;
  try {
    const parsed = JSON.parse(probe.stdout);
    const stream = (parsed.streams ?? []).find((item) => item.codec_type === "audio");
    const durationSec = Number(parsed.format?.duration);
    return stream && Number.isFinite(durationSec) && durationSec > 0
      ? { durationSec: Number(durationSec.toFixed(3)), codec: stream.codec_name ?? "unknown" }
      : null;
  } catch {
    return null;
  }
}

const reviewLoudness = cast.audition?.reviewLoudness;
if (
  !reviewLoudness ||
  !Number.isFinite(reviewLoudness.integratedLufs) ||
  !Number.isFinite(reviewLoudness.integratedToleranceLu) ||
  reviewLoudness.integratedToleranceLu <= 0 ||
  reviewLoudness.integratedToleranceLu > 1.5 ||
  !Number.isFinite(reviewLoudness.truePeakDbtp) ||
  !Number.isFinite(reviewLoudness.loudnessRangeLu) ||
  reviewLoudness.method !== "ffmpeg_loudnorm_two_pass_dynamic_v1"
) {
  console.error("ABORT: review loudness contract is missing or invalid.");
  process.exit(2);
}

function loudnessFilter(target, measured = null, printFormat = "json") {
  const base = [
    `I=${target.integratedLufs}`,
    `TP=${target.truePeakDbtp}`,
    `LRA=${target.loudnessRangeLu}`,
  ];
  if (measured) {
    base.push(
      `measured_I=${measured.input_i}`,
      `measured_TP=${measured.input_tp}`,
      `measured_LRA=${measured.input_lra}`,
      `measured_thresh=${measured.input_thresh}`,
      `offset=${measured.target_offset}`,
      "linear=false",
    );
  }
  base.push(`print_format=${printFormat}`);
  return `loudnorm=${base.join(":")}`;
}

function measureLoudness(filePath) {
  const result = spawnSync("ffmpeg", [
    "-hide_banner", "-i", filePath,
    "-af", loudnessFilter(reviewLoudness),
    "-f", "null", "NUL",
  ], { encoding: "utf8", maxBuffer: 8 * 1024 * 1024, shell: false });
  if ((result.status ?? -1) !== 0) return null;
  const block = String(result.stderr ?? "").match(/\{[\s\S]*?"target_offset"[\s\S]*?\}/u)?.[0];
  if (!block) return null;
  try {
    const parsed = JSON.parse(block);
    const values = {
      input_i: Number(parsed.input_i),
      input_tp: Number(parsed.input_tp),
      input_lra: Number(parsed.input_lra),
      input_thresh: Number(parsed.input_thresh),
      target_offset: Number(parsed.target_offset),
    };
    return Object.values(values).every(Number.isFinite) ? values : null;
  } catch {
    return null;
  }
}

function normalizeForReview(sourcePath, outputPath) {
  const measured = measureLoudness(sourcePath);
  if (!measured) return null;
  const result = spawnSync("ffmpeg", [
    "-y", "-hide_banner", "-i", sourcePath,
    "-af", loudnessFilter(reviewLoudness, measured, "summary"),
    "-c:a", "libmp3lame", "-b:a", "192k", outputPath,
  ], { encoding: "utf8", maxBuffer: 8 * 1024 * 1024, shell: false });
  if ((result.status ?? -1) !== 0) return null;
  const probe = probeAudio(outputPath);
  const audit = measureLoudness(outputPath);
  if (!probe || !audit) return null;
  const integratedLufs = audit.input_i;
  const truePeakDbtp = audit.input_tp;
  const passed = Math.abs(integratedLufs - reviewLoudness.integratedLufs) <= reviewLoudness.integratedToleranceLu &&
    truePeakDbtp <= reviewLoudness.truePeakDbtp + 0.2;
  return passed ? {
    ...probe,
    loudnessAudit: {
      method: reviewLoudness.method,
      targetIntegratedLufs: reviewLoudness.integratedLufs,
      integratedToleranceLu: reviewLoudness.integratedToleranceLu,
      measuredIntegratedLufs: integratedLufs,
      targetTruePeakDbtp: reviewLoudness.truePeakDbtp,
      measuredTruePeakDbtp: truePeakDbtp,
      passed: true,
    },
  } : null;
}

function writeSummary(rows, extra = {}, targetPath = summaryPath) {
  const summary = {
    schemaVersion: "money_shorts_finance_character_voice_audition_summary_v1",
    castVersion: cast.version,
    castStatus: cast.status,
    modelId: cast.baseline.modelId,
    ttsEngineBaseline: cast.baseline.ttsEngineVersion,
    prosodyPolicy: cast.baseline.prosodyPolicy,
    auditionScriptVersion: cast.audition.scriptVersion,
    sameSpokenTextForAll: true,
    performanceTagPolicy: cast.audition.comparisonPolicy,
    reviewLoudness,
    ownerListeningRequired: true,
    productionMappingApplied: false,
    noUploadPerformed: true,
    generatedAt: new Date().toISOString(),
    rows,
    ...extra,
  };
  fs.writeFileSync(targetPath, JSON.stringify(summary, null, 2), "utf8");
  return summary;
}

const preflightRows = [];
for (const character of characters) {
  let response;
  try {
    response = await fetch(`https://api.elevenlabs.io/v1/voices/${encodeURIComponent(character.voiceId)}`, {
      headers: { "xi-api-key": apiKey, Accept: "application/json" },
      signal: AbortSignal.timeout(20_000),
    });
  } catch (error) {
    preflightRows.push({ characterId: character.characterId, voiceLabel: character.voiceLabel, available: false, reason: `FETCH_FAILED: ${error.message}` });
    continue;
  }
  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    let providerReason = "";
    try {
      const parsed = JSON.parse(errorText);
      providerReason = String(parsed?.detail?.message ?? parsed?.detail?.status ?? parsed?.message ?? "").slice(0, 180);
    } catch {
      providerReason = errorText.replace(/\s+/g, " ").trim().slice(0, 180);
    }
    preflightRows.push({
      characterId: character.characterId,
      voiceLabel: character.voiceLabel,
      available: false,
      reason: `HTTP_${response.status}${providerReason ? `: ${providerReason}` : ""}`,
    });
    continue;
  }
  const metadata = await response.json().catch(() => ({}));
  preflightRows.push({
    characterId: character.characterId,
    characterName: character.characterName,
    configuredVoiceLabel: character.voiceLabel,
    providerVoiceName: typeof metadata.name === "string" ? metadata.name : null,
    voiceIdMasked: `${character.voiceId.slice(0, 3)}***${character.voiceId.slice(-3)}`,
    available: true,
  });
}

const unavailable = preflightRows.filter((row) => !row.available);
if (unavailable.length > 0) {
  writeSummary(
    preflightRows,
    { status: "BLOCKED_VOICE_PREFLIGHT", preflightApiCallCount: 4, paidTtsCallCount: 0 },
    preflightSummaryPath,
  );
  console.error(`BLOCKED: ${unavailable.length} configured voice IDs are unavailable. No paid TTS call was made.`);
  process.exit(4);
}

if (preflightOnly) {
  writeSummary(
    preflightRows,
    { status: "PREFLIGHT_PASS", preflightApiCallCount: 4, paidTtsCallCount: 0 },
    preflightSummaryPath,
  );
  console.log(JSON.stringify({ passed: true, paidTtsCallCount: 0, summaryPath: preflightSummaryPath, voices: preflightRows }, null, 2));
  process.exit(0);
}

const oldSummary = fs.existsSync(summaryPath)
  ? JSON.parse(fs.readFileSync(summaryPath, "utf8"))
  : null;
const rows = [];
let paidTtsCallCount = 0;
for (const character of characters) {
  const settings = {
    stability: character.settings.stability,
    similarity_boost: character.settings.similarityBoost,
    style: character.settings.style,
    speed: character.settings.speed,
    use_speaker_boost: character.settings.useSpeakerBoost,
  };
  const performanceText = String(character.auditionPerformanceText ?? cast.audition.performanceText);
  const inputFingerprint = fingerprint({
    modelId: cast.baseline.modelId,
    languageCode: cast.baseline.languageCode,
    seed: cast.baseline.seed,
    voiceId: character.voiceId,
    settings,
    performanceText,
  });
  const legacyOutputPath = path.join(outDir, `${character.characterId}-${inputFingerprint}.mp3`);
  const sourceOutputPath = path.join(outDir, `${character.characterId}-${inputFingerprint}.source.mp3`);
  const outputPath = path.join(outDir, `${character.characterId}-${inputFingerprint}.review.mp3`);
  const oldRow = oldSummary?.rows?.find((row) => row.characterId === character.characterId && row.inputFingerprint === inputFingerprint);
  if (fs.existsSync(outputPath)) {
    const probe = probeAudio(outputPath);
    const audit = measureLoudness(outputPath);
    if (
      probe && audit &&
      Math.abs(audit.input_i - reviewLoudness.integratedLufs) <= reviewLoudness.integratedToleranceLu &&
      audit.input_tp <= reviewLoudness.truePeakDbtp + 0.2
    ) {
      rows.push({
        characterId: character.characterId,
        characterName: character.characterName,
        characterLabel: character.characterLabel,
        subtopics: character.subtopics,
        voiceLabel: character.voiceLabel,
        voiceIdMasked: `${character.voiceId.slice(0, 3)}***${character.voiceId.slice(-3)}`,
        settings,
        intent: character.intent,
        inputFingerprint,
        outputPath,
        sourceOutputPath: fs.existsSync(sourceOutputPath) ? sourceOutputPath : legacyOutputPath,
        ...oldRow,
        ...probe,
        loudnessAudit: {
          method: reviewLoudness.method,
          targetIntegratedLufs: reviewLoudness.integratedLufs,
          integratedToleranceLu: reviewLoudness.integratedToleranceLu,
          measuredIntegratedLufs: audit.input_i,
          targetTruePeakDbtp: reviewLoudness.truePeakDbtp,
          measuredTruePeakDbtp: audit.input_tp,
          passed: true,
        },
        status: "SAVED_OK",
        method: "existing_normalized_review_skip",
      });
      continue;
    }
  }
  const reusableSourcePath = fs.existsSync(sourceOutputPath)
    ? sourceOutputPath
    : fs.existsSync(legacyOutputPath)
      ? legacyOutputPath
      : null;
  if (reusableSourcePath) {
    const normalized = normalizeForReview(reusableSourcePath, outputPath);
    if (normalized) {
      rows.push({
        characterId: character.characterId,
        characterName: character.characterName,
        characterLabel: character.characterLabel,
        subtopics: character.subtopics,
        voiceLabel: character.voiceLabel,
        voiceIdMasked: `${character.voiceId.slice(0, 3)}***${character.voiceId.slice(-3)}`,
        settings,
        intent: character.intent,
        inputFingerprint,
        sourceOutputPath: reusableSourcePath,
        outputPath,
        ...normalized,
        status: "SAVED_OK",
        method: "existing_source_normalized_skip",
      });
      continue;
    }
  }
  if (paidTtsCallCount >= paidCallCap) {
    writeSummary(rows, { status: "BLOCKED_CALL_BUDGET", apiCallCount: 4 + paidTtsCallCount, paidTtsCallCount, paidCallCap });
    console.error(`ABORT: paid TTS call budget of ${paidCallCap} exceeded.`);
    process.exit(5);
  }
  paidTtsCallCount += 1;
  let response;
  try {
    response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(character.voiceId)}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text: performanceText,
          model_id: cast.baseline.modelId,
          language_code: cast.baseline.languageCode,
          seed: cast.baseline.seed,
          apply_text_normalization: "auto",
          voice_settings: settings,
        }),
        signal: AbortSignal.timeout(120_000),
      },
    );
  } catch (error) {
    rows.push({ characterId: character.characterId, voiceLabel: character.voiceLabel, inputFingerprint, status: "BLOCKED", reason: `FETCH_FAILED: ${error.message}` });
    writeSummary(rows, { status: "BLOCKED_TTS", apiCallCount: 4 + paidTtsCallCount, paidTtsCallCount });
    console.error(`BLOCKED: ${character.characterName} TTS request failed. No retry was attempted.`);
    process.exit(6);
  }
  if (!response.ok) {
    const reason = (await response.text().catch(() => "")).slice(0, 160);
    rows.push({ characterId: character.characterId, voiceLabel: character.voiceLabel, inputFingerprint, status: "BLOCKED", reason: `HTTP_${response.status}: ${reason}` });
    writeSummary(rows, { status: "BLOCKED_TTS", apiCallCount: 4 + paidTtsCallCount, paidTtsCallCount });
    console.error(`BLOCKED: ${character.characterName} TTS returned HTTP ${response.status}. No retry was attempted.`);
    process.exit(6);
  }
  fs.writeFileSync(sourceOutputPath, Buffer.from(await response.arrayBuffer()));
  const normalized = normalizeForReview(sourceOutputPath, outputPath);
  if (!normalized) {
    rows.push({ characterId: character.characterId, voiceLabel: character.voiceLabel, inputFingerprint, status: "BLOCKED", reason: "LOUDNESS_NORMALIZATION_FAILED" });
    writeSummary(rows, { status: "BLOCKED_AUDIO", apiCallCount: 4 + paidTtsCallCount, paidTtsCallCount });
    console.error(`BLOCKED: ${character.characterName} generated audio is invalid.`);
    process.exit(7);
  }
  rows.push({
    characterId: character.characterId,
    characterName: character.characterName,
    characterLabel: character.characterLabel,
    subtopics: character.subtopics,
    voiceLabel: character.voiceLabel,
    voiceIdMasked: `${character.voiceId.slice(0, 3)}***${character.voiceId.slice(-3)}`,
    settings,
    intent: character.intent,
    inputFingerprint,
    sourceOutputPath,
    outputPath,
    ...normalized,
    status: "SAVED_OK",
    method: "live_api_once",
  });
}

const summary = writeSummary(rows, {
  status: rows.length === 4 && rows.every((row) => row.status === "SAVED_OK") ? "AUDITION_READY" : "BLOCKED_INCOMPLETE",
  apiCallCount: 4 + paidTtsCallCount,
  paidTtsCallCount,
  paidCallCap,
});
console.log(JSON.stringify({ status: summary.status, paidTtsCallCount, summaryPath, rows: rows.map((row) => ({ characterId: row.characterId, voiceLabel: row.voiceLabel, durationSec: row.durationSec, outputPath: row.outputPath, method: row.method })) }, null, 2));
process.exit(summary.status === "AUDITION_READY" ? 0 : 8);
