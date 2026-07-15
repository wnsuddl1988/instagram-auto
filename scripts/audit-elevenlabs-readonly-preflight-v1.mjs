#!/usr/bin/env node
/**
 * Owner-approved ElevenLabs account/TTS-history audit.
 *
 * Safety contract:
 * - Reads exactly two existing Minjae two-phase approval packets.
 * - Performs one GET each for subscription, the approved voice, models, and
 *   recent voice-filtered history. There is no retry path.
 * - Never prints the API key, raw voice id, narration text, history ids, or
 *   provider error bodies. No file is created or changed.
 */

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const AUDIT_VERSION = "elevenlabs_readonly_preflight_v1";
const PACKET_SCHEMA = "money_shorts_minjae_two_phase_tts_approval_packet_v3";
const REQUIRED_MODEL_ID = "eleven_v3";
const MEDIA_ROOT_RE = /^C:[\\/]+tmp[\\/]+money-shorts-os[\\/]+/i;
const API_ROOT = "https://api.elevenlabs.io/v1";
const FETCH_TIMEOUT_MS = 15_000;
const HISTORY_PACKET_LEEWAY_SEC = 600;
const HISTORY_PAGE_SIZE = 100;

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function maskVoiceId(value) {
  const voiceId = String(value ?? "");
  return voiceId.length >= 6 ? `${voiceId.slice(0, 3)}***${voiceId.slice(-3)}` : "***";
}

function nullableNumber(value) {
  if (value == null || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function nullableString(value) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function collectPacketArgs(argv) {
  const packetPaths = [];
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] !== "--packet" || !argv[index + 1]) {
      throw new Error("PACKET_ARGUMENTS_INVALID");
    }
    packetPaths.push(resolve(argv[index + 1]));
    index += 1;
  }
  if (packetPaths.length !== 2 || new Set(packetPaths).size !== 2) {
    throw new Error("EXACTLY_TWO_PACKETS_REQUIRED");
  }
  if (!packetPaths.every((packetPath) => MEDIA_ROOT_RE.test(packetPath))) {
    throw new Error("PACKET_PATH_OUTSIDE_MEDIA_ROOT");
  }
  return packetPaths;
}

function readAndValidatePacket(packetPath, expectedVoiceId) {
  let packet;
  try {
    packet = JSON.parse(readFileSync(packetPath, "utf8"));
  } catch {
    throw new Error("PACKET_READ_FAILED");
  }

  if (
    packet?.schemaVersion !== PACKET_SCHEMA ||
    packet?.status !== "PREFLIGHT_ONLY_OK" ||
    packet?.noLive !== true ||
    packet?.modelId !== REQUIRED_MODEL_ID
  ) {
    throw new Error("PACKET_CONTRACT_INVALID");
  }

  const expectedVoiceHash = sha256(expectedVoiceId);
  const expectedVoiceMask = maskVoiceId(expectedVoiceId);
  if (
    packet?.voice?.idSha256 !== expectedVoiceHash ||
    packet?.voice?.idMasked !== expectedVoiceMask
  ) {
    throw new Error("PACKET_VOICE_MISMATCH");
  }

  const phaseRequests = Array.isArray(packet.phaseRequests) ? packet.phaseRequests : [];
  const phaseIds = phaseRequests.map((phase) => phase?.id);
  if (
    phaseRequests.length !== 2 ||
    JSON.stringify(phaseIds) !== JSON.stringify(["body", "closing"]) ||
    phaseRequests.some((phase) => !/^[a-f0-9]{64}$/.test(String(phase?.textSha256 ?? "")))
  ) {
    throw new Error("PACKET_PHASES_INVALID");
  }

  const {
    packetHash,
    generatedAt,
    noLive: _noLive,
    approvalText: _approvalText,
    packetPath: _packetPath,
    ...stablePacket
  } = packet;
  if (!/^[a-f0-9]{64}$/.test(String(packetHash ?? "")) || sha256(JSON.stringify(stablePacket)) !== packetHash) {
    throw new Error("PACKET_HASH_MISMATCH");
  }

  const generatedAtMs = Date.parse(String(generatedAt ?? ""));
  if (!Number.isFinite(generatedAtMs)) {
    throw new Error("PACKET_TIMESTAMP_INVALID");
  }

  return {
    packetHash,
    generatedAt: new Date(generatedAtMs).toISOString(),
    generatedAtMs,
    wizardTopicId: nullableString(packet.wizardTopicId),
    productionPartId: nullableString(packet.productionPartId),
    ttsInputContractSha256: nullableString(packet.ttsInputContractSha256),
    phaseRequests: phaseRequests.map((phase) => ({
      id: phase.id,
      textSha256: phase.textSha256,
    })),
  };
}

async function getJsonOnce(url, apiKey) {
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "xi-api-key": apiKey,
      },
      redirect: "error",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!response.ok) {
      return { ok: false, httpStatus: response.status, data: null, errorCode: `HTTP_${response.status}` };
    }
    try {
      return { ok: true, httpStatus: response.status, data: await response.json(), errorCode: null };
    } catch {
      return { ok: false, httpStatus: response.status, data: null, errorCode: "INVALID_JSON_RESPONSE" };
    }
  } catch (error) {
    const errorCode = error instanceof Error && error.name === "TimeoutError" ? "TIMEOUT" : "NETWORK_ERROR";
    return { ok: false, httpStatus: null, data: null, errorCode };
  }
}

function requestEvidence(result) {
  return {
    ok: result.ok,
    httpStatus: result.httpStatus,
    errorCode: result.errorCode,
  };
}

function modelSupportsKorean(model) {
  const languages = Array.isArray(model?.languages) ? model.languages : [];
  return languages.some((language) => {
    const id = String(language?.language_id ?? language?.language_code ?? language?.id ?? "").toLowerCase();
    const name = String(language?.name ?? "").toLowerCase();
    return id === "ko" || id === "ko-kr" || name === "korean" || name === "한국어";
  });
}

function safeHistoryRows(historyData, expectedVoiceId, approvedByTextHash) {
  const rows = Array.isArray(historyData?.history) ? historyData.history : [];
  return rows.map((row) => {
    const text = typeof row?.text === "string" ? row.text : "";
    const textSha256 = sha256(text);
    const matches = approvedByTextHash.get(textSha256) ?? [];
    const dateUnix = nullableNumber(row?.date_unix);
    const countFrom = nullableNumber(row?.character_count_change_from);
    const countTo = nullableNumber(row?.character_count_change_to);
    return {
      timestamp: dateUnix == null ? null : new Date(dateUnix * 1000).toISOString(),
      modelId: nullableString(row?.model_id),
      voiceMatched: row?.voice_id === expectedVoiceId,
      textLength: text.length,
      textSha256,
      approvedPhaseMatches: matches,
      characterCountChange: {
        from: countFrom,
        to: countTo,
        delta: countFrom == null || countTo == null ? null : countTo - countFrom,
      },
      source: nullableString(row?.source),
      state: nullableString(row?.state),
    };
  });
}

async function main() {
  const apiKey = String(process.env.ELEVENLABS_API_KEY ?? "").trim();
  const voiceId = String(process.env.ELEVENLABS_VOICE_ID ?? "").trim();
  if (!apiKey || !voiceId) {
    throw new Error("ELEVENLABS_RUNTIME_ENV_MISSING");
  }

  const packetPaths = collectPacketArgs(process.argv.slice(2));
  const packets = packetPaths.map((packetPath) => readAndValidatePacket(packetPath, voiceId));
  const partIds = packets.map((packet) => packet.productionPartId).sort();
  if (JSON.stringify(partIds) !== JSON.stringify(["part-1", "part-2"])) {
    throw new Error("TWO_PART_PACKET_SET_REQUIRED");
  }
  if (new Set(packets.map((packet) => packet.wizardTopicId)).size !== 1) {
    throw new Error("PACKET_TOPIC_MISMATCH");
  }

  const approvedByTextHash = new Map();
  for (const packet of packets) {
    for (const phase of packet.phaseRequests) {
      const matches = approvedByTextHash.get(phase.textSha256) ?? [];
      matches.push({ partId: packet.productionPartId, phaseId: phase.id });
      approvedByTextHash.set(phase.textSha256, matches);
    }
  }
  if (approvedByTextHash.size !== 6) {
    throw new Error("APPROVED_PHASE_TEXT_HASHES_NOT_UNIQUE");
  }

  const dateAfterUnix = Math.max(
    0,
    Math.floor(Math.min(...packets.map((packet) => packet.generatedAtMs)) / 1000) - HISTORY_PACKET_LEEWAY_SEC,
  );
  const historyUrl = new URL(`${API_ROOT}/history`);
  historyUrl.searchParams.set("page_size", String(HISTORY_PAGE_SIZE));
  historyUrl.searchParams.set("voice_id", voiceId);
  historyUrl.searchParams.set("date_after_unix", String(dateAfterUnix));
  historyUrl.searchParams.set("sort_direction", "desc");
  historyUrl.searchParams.set("source", "TTS");

  const [subscriptionResult, voiceResult, modelsResult, historyResult] = await Promise.all([
    getJsonOnce(`${API_ROOT}/user/subscription`, apiKey),
    getJsonOnce(`${API_ROOT}/voices/${encodeURIComponent(voiceId)}`, apiKey),
    getJsonOnce(`${API_ROOT}/models`, apiKey),
    getJsonOnce(historyUrl, apiKey),
  ]);

  const subscription = subscriptionResult.data ?? {};
  const voice = voiceResult.data ?? {};
  const models = Array.isArray(modelsResult.data) ? modelsResult.data : [];
  const requiredModel = models.find((model) => model?.model_id === REQUIRED_MODEL_ID) ?? null;
  const historyRows = safeHistoryRows(historyResult.data, voiceId, approvedByTextHash);
  const matchedApprovedKeys = new Set(
    historyRows.flatMap((row) => row.approvedPhaseMatches.map((match) => `${match.partId}:${match.phaseId}`)),
  );
  const allRequestsOk = [subscriptionResult, voiceResult, modelsResult, historyResult].every((result) => result.ok);
  const voiceMatches = voiceResult.ok && voice?.voice_id === voiceId;
  const modelReady = modelsResult.ok && requiredModel != null && requiredModel.can_do_text_to_speech !== false;

  const result = {
    auditVersion: AUDIT_VERSION,
    status: allRequestsOk && voiceMatches && modelReady
      ? "READONLY_PREFLIGHT_OK"
      : "READONLY_PREFLIGHT_INCONCLUSIVE",
    observedAt: new Date().toISOString(),
    networkContract: {
      method: "GET_ONLY",
      requestCount: 4,
      retries: 0,
      ttsGenerationRequests: 0,
      downloads: 0,
      writes: 0,
    },
    packets: packets.map((packet) => ({
      partId: packet.productionPartId,
      packetHash: packet.packetHash,
      ttsInputContractSha256: packet.ttsInputContractSha256,
      generatedAt: packet.generatedAt,
      approvedPhaseCount: packet.phaseRequests.length,
    })),
    requestEvidence: {
      subscription: requestEvidence(subscriptionResult),
      voice: requestEvidence(voiceResult),
      models: requestEvidence(modelsResult),
      history: requestEvidence(historyResult),
    },
    subscription: {
      tier: nullableString(subscription?.tier),
      status: nullableString(subscription?.status ?? subscription?.subscription_status),
      characterCount: nullableNumber(subscription?.character_count),
      characterLimit: nullableNumber(subscription?.character_limit),
    },
    voice: {
      name: nullableString(voice?.name),
      category: nullableString(voice?.category),
      idMasked: maskVoiceId(voiceId),
      idMatched: voiceMatches,
    },
    model: {
      modelId: REQUIRED_MODEL_ID,
      found: modelsResult.ok ? requiredModel != null : null,
      name: nullableString(requiredModel?.name),
      canDoTextToSpeech: modelsResult.ok && requiredModel != null
        ? requiredModel.can_do_text_to_speech === true
        : null,
      supportsKorean: modelsResult.ok && requiredModel != null
        ? modelSupportsKorean(requiredModel)
        : null,
    },
    history: {
      dateAfterUnix,
      pageSize: HISTORY_PAGE_SIZE,
      querySucceeded: historyResult.ok,
      returnedCount: historyResult.ok ? historyRows.length : null,
      hasMore: historyResult.ok ? historyResult.data?.has_more === true : null,
      matchedApprovedPhaseCount: matchedApprovedKeys.size,
      matchedHistoryRowCount: historyRows.filter((row) => row.approvedPhaseMatches.length > 0).length,
      unmatchedHistoryRowCount: historyRows.filter((row) => row.approvedPhaseMatches.length === 0).length,
      possibleCharacterCountChangeRows: historyRows.filter((row) => {
        const change = row.characterCountChange;
        return change.from != null && change.to != null && change.from !== change.to;
      }).length,
      rows: historyRows,
    },
    privacy: {
      apiKeyPrinted: false,
      rawVoiceIdPrinted: false,
      narrationTextPrinted: false,
      historyIdsPrinted: false,
    },
  };

  console.log(JSON.stringify(result));
}

main().catch(async (error) => {
  const code = error instanceof Error && /^[A-Z0-9_]+$/.test(error.message)
    ? error.message
    : "READONLY_PREFLIGHT_INTERNAL_ERROR";
  console.error(`ABORT: ${code}`);
  process.exitCode = 1;
  await new Promise((resolveDelay) => setTimeout(resolveDelay, 250));
});
