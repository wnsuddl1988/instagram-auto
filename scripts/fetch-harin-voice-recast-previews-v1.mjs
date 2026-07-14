#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const apiKey = process.env.ELEVENLABS_API_KEY;
if (!apiKey) {
  console.error("READINESS FAILURE: ELEVENLABS_API_KEY missing. No API call was made.");
  process.exit(1);
}

const outputDir = "C:\\tmp\\money-shorts-os\\harin-voice-recast-preview-v1";
const summaryPath = path.join(outputDir, "harin-voice-recast-preview-summary.json");
fs.mkdirSync(outputDir, { recursive: true });

const candidates = [
  {
    rank: 1,
    candidateId: "jisoo",
    voiceId: "iWLjl1zCuqXRkW6494ve",
    search: "Jisoo",
    voiceLabel: "Jisoo - Inviting, Clear and Measured",
    statusLabel: "우선 추천",
    rationale: "뉴스형 정보 전달에 맞는 또렷함과 생동감이 가장 유력한 후보",
    fallbackPreviewUrl: "https://storage.googleapis.com/eleven-public-prod/database/user/0h6nEQqeUxPV3L5wkm7lBKU0IyL2/voices/iWLjl1zCuqXRkW6494ve/XNH3Tlaron38adHGvq6X.mp3",
  },
  {
    rank: 2,
    candidateId: "jy",
    voiceId: "bQlkYuipD5BHEhntA5iz",
    search: "JY",
    voiceLabel: "JY - Trendy K-Culture Vlog Girl",
    statusLabel: "속도감 후보",
    rationale: "첫 문장 흡입력과 밝은 에너지가 강하지만 지나치게 어려 보이는지는 확인 필요",
    fallbackPreviewUrl: "https://api.us.elevenlabs.io/v1/voices/bQlkYuipD5BHEhntA5iz/previews/audio?payload=eyJ2b2ljZV9zb3VyY2UiOiJjdXN0b20iLCJ3b3Jrc3BhY2VfaWQiOiIwZTcwZTkwYWI2MTk0ODAyODllYmVhNTAwNWQzZmY4YSIsImZpbGVuYW1lIjoiZUY5eW5DZGQ4NldQZUtIV0NuNXIubXAzIiwidGltZXN0YW1wIjoxNzgzOTgwMDAwMDAwMDAwfQ%3D%3D",
  },
  {
    rank: 3,
    candidateId: "yooni",
    voiceId: "n2fbxG88jqAoaVPUy3IG",
    search: "Yooni",
    voiceLabel: "Yooni - Natural & Clear",
    statusLabel: "균형 후보",
    rationale: "밝고 선명한 서울 억양과 높은 발음 명료도가 생활경제 설명에 유리",
    fallbackPreviewUrl: "https://storage.googleapis.com/eleven-public-prod/database/workspace/dc9d42698272443c82f44e26ea1c9263/voices/n2fbxG88jqAoaVPUy3IG/kVgVODaebcaz7AEHhgDo.mp3",
  },
  {
    rank: 4,
    candidateId: "hana-lee",
    voiceId: "QPFsEL6IBxlT15xfiD6C",
    search: "Hana Lee",
    voiceLabel: "Hana Lee - Natural and Cheerful",
    statusLabel: "Owner 초안 후보",
    rationale: "밝고 매끄러운 장점은 있으나 너무 앳되거나 가벼운지는 실제 미리듣기 필요",
  },
  {
    rank: 5,
    candidateId: "miso-choi",
    voiceId: "tIXHSlSWOafJawXSV1g4",
    search: "Miso Choi",
    voiceLabel: "Miso Choi - Calm and Positive",
    statusLabel: "처짐 주의 후보",
    rationale: "성숙하고 안정적이지만 Calm 성향이 기존 하린 문제를 반복할 위험이 큼",
  },
];

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: { "xi-api-key": apiKey, Accept: "application/json" },
  });
  if (!response.ok) {
    throw new Error(`ElevenLabs metadata request failed (${response.status})`);
  }
  return response.json();
}

async function resolveSharedVoice(candidate) {
  const params = new URLSearchParams({
    page_size: "100",
    search: candidate.search,
    language: "ko",
    gender: "female",
  });
  const payload = await fetchJson(`https://api.elevenlabs.io/v1/shared-voices?${params}`);
  const voices = Array.isArray(payload.voices) ? payload.voices : [];
  return voices.find((voice) => voice.voice_id === candidate.voiceId) ?? null;
}

function probeAudio(filePath) {
  const result = spawnSync("ffprobe", [
    "-v", "error",
    "-show_entries", "format=duration:stream=codec_name,sample_rate,channels",
    "-of", "json",
    filePath,
  ], { encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(`ffprobe failed for ${path.basename(filePath)}`);
  }
  const parsed = JSON.parse(result.stdout);
  const stream = parsed.streams?.[0] ?? {};
  return {
    durationSec: Number(Number(parsed.format?.duration ?? 0).toFixed(2)),
    codec: stream.codec_name ?? null,
    sampleRate: Number(stream.sample_rate ?? 0),
    channels: Number(stream.channels ?? 0),
  };
}

const rows = [];
for (const candidate of candidates) {
  let sharedVoice = null;
  let metadataError = null;
  try {
    sharedVoice = await resolveSharedVoice(candidate);
  } catch (error) {
    metadataError = error instanceof Error ? error.message : String(error);
  }

  const previewUrl = sharedVoice?.preview_url ?? candidate.fallbackPreviewUrl ?? null;
  if (!previewUrl) {
    rows.push({
      ...candidate,
      status: "PREVIEW_NOT_FOUND",
      metadataError,
    });
    continue;
  }

  const response = await fetch(previewUrl, { headers: { Accept: "audio/mpeg,audio/*" } });
  if (!response.ok) {
    rows.push({
      ...candidate,
      status: "PREVIEW_DOWNLOAD_FAILED",
      httpStatus: response.status,
      metadataError,
    });
    continue;
  }

  const outputPath = path.join(outputDir, `${String(candidate.rank).padStart(2, "0")}-${candidate.candidateId}.mp3`);
  fs.writeFileSync(outputPath, Buffer.from(await response.arrayBuffer()));
  const probe = probeAudio(outputPath);
  rows.push({
    ...candidate,
    status: "PREVIEW_READY",
    outputPath,
    description: sharedVoice?.description ?? null,
    labels: sharedVoice?.labels ?? null,
    metadataError,
    ...probe,
  });
}

const summary = {
  schemaVersion: "money_shorts_harin_voice_recast_preview_v1",
  status: rows.every((row) => row.status === "PREVIEW_READY") ? "PREVIEW_READY" : "PREVIEW_PARTIAL",
  generatedAt: new Date().toISOString(),
  paidTtsCalls: 0,
  accountMutations: 0,
  note: "Public Voice Library previews only. These clips do not use the common Harin audition script.",
  rows,
};
fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2), "utf8");
console.log(JSON.stringify({
  status: summary.status,
  ready: rows.filter((row) => row.status === "PREVIEW_READY").length,
  total: rows.length,
  paidTtsCalls: 0,
  accountMutations: 0,
  summaryPath,
}, null, 2));
process.exitCode = summary.status === "PREVIEW_READY" ? 0 : 2;
