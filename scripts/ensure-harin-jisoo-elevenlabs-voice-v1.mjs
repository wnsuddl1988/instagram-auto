#!/usr/bin/env node

const apiKey = process.env.ELEVENLABS_API_KEY;
if (!apiKey) {
  console.error("READINESS FAILURE: ELEVENLABS_API_KEY missing. No API call was made.");
  process.exit(1);
}

const target = {
  voiceId: "iWLjl1zCuqXRkW6494ve",
  search: "Jisoo",
  expectedNameIncludes: "Jisoo",
  collectionName: "Jisoo - Harin audition",
};

const headers = { "xi-api-key": apiKey, Accept: "application/json" };
const current = await fetch(`https://api.elevenlabs.io/v1/voices/${target.voiceId}`, {
  headers,
  signal: AbortSignal.timeout(20_000),
}).catch(() => null);

if (current?.ok) {
  const metadata = await current.json().catch(() => ({}));
  console.log(JSON.stringify({
    status: "VOICE_ALREADY_AVAILABLE",
    voiceId: target.voiceId,
    providerVoiceName: metadata.name ?? null,
    accountMutationCount: 0,
    paidTtsCallCount: 0,
  }, null, 2));
  process.exit(0);
}

const searchParams = new URLSearchParams({
  page_size: "100",
  search: target.search,
  language: "ko",
  gender: "female",
});
const searchResponse = await fetch(`https://api.elevenlabs.io/v1/shared-voices?${searchParams}`, {
  headers,
  signal: AbortSignal.timeout(20_000),
});
if (!searchResponse.ok) {
  console.error(`BLOCKED: shared voice lookup returned HTTP ${searchResponse.status}. No account mutation occurred.`);
  process.exit(2);
}
const searchPayload = await searchResponse.json();
const sharedVoice = Array.isArray(searchPayload.voices)
  ? searchPayload.voices.find((voice) => voice.voice_id === target.voiceId)
  : null;
if (!sharedVoice?.public_owner_id || !String(sharedVoice.name ?? "").includes(target.expectedNameIncludes)) {
  console.error("BLOCKED: the exact Jisoo shared voice could not be verified. No account mutation occurred.");
  process.exit(3);
}

const addResponse = await fetch(
  `https://api.elevenlabs.io/v1/voices/add/${encodeURIComponent(sharedVoice.public_owner_id)}/${encodeURIComponent(target.voiceId)}`,
  {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ new_name: target.collectionName, bookmarked: true }),
    signal: AbortSignal.timeout(30_000),
  },
);
if (!addResponse.ok) {
  let providerReason = "";
  try {
    const payload = await addResponse.json();
    providerReason = String(payload?.detail?.message ?? payload?.detail?.status ?? payload?.message ?? "").slice(0, 180);
  } catch {}
  console.error(`BLOCKED: Jisoo account add returned HTTP ${addResponse.status}${providerReason ? `: ${providerReason}` : ""}. No TTS call was made.`);
  process.exit(4);
}
const added = await addResponse.json().catch(() => ({}));
if (added.voice_id !== target.voiceId) {
  console.error("BLOCKED: Jisoo account add response did not match the selected voice ID. No TTS call was made.");
  process.exit(5);
}
console.log(JSON.stringify({
  status: "VOICE_ADDED",
  voiceId: target.voiceId,
  providerVoiceName: sharedVoice.name,
  accountMutationCount: 1,
  paidTtsCallCount: 0,
}, null, 2));
