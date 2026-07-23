import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const files = [
  "lib/home-problem-lab/types.ts",
  "lib/home-problem-lab/config.ts",
  "lib/home-problem-lab/tts-provider.ts",
  "lib/home-problem-lab/tts-live-authorization.ts",
  "lib/home-problem-lab/elevenlabs-tts-adapter.ts",
];
const source = files.map((file) => readFileSync(resolve(root, file), "utf8")).join("\n");
const fixture = JSON.parse(readFileSync(resolve(root, "scripts/fixtures/home_problem_lab_elevenlabs_live_safety.v1.json"), "utf8"));
const required = [
  "defaultProvider: \"mock\"", "liveProvider: \"elevenlabs_live\"", "transport: \"disabled\"",
  "HOME_PROBLEM_LAB_TTS_PROVIDER_INVALID", "HOME_PROBLEM_LAB_TTS_LIVE_NOT_AUTHORIZED",
  "HOME_PROBLEM_LAB_TTS_ENGINE_MISMATCH", "HOME_PROBLEM_LAB_TTS_PROFILE_MISMATCH",
  "HOME_PROBLEM_LAB_TTS_CREDENTIALS_NOT_PRESENT", "HOME_PROBLEM_LAB_TTS_DUPLICATE_REQUEST",
  "maxExternalCalls: 1", "retryCount: 0", "timeoutMs: 20_000", "estimatedBillableCharacters",
  "DisabledHomeProblemLabElevenLabsTransport", "supportsNetwork = false", "HOME_PROBLEM_LAB_TTS_TRANSPORT_DISABLED",
  "validateHomeProblemLabAudioResponse", "HOME_PROBLEM_LAB_TTS_INVALID_CONTENT_TYPE",
  "HOME_PROBLEM_LAB_TTS_AUDIO_TOO_SMALL", "HOME_PROBLEM_LAB_TTS_AUDIO_TOO_LARGE", "HOME_PROBLEM_LAB_TTS_TIMEOUT",
  "createHomeProblemLabSafeTtsLogEvent", "findHomeProblemLabSensitiveLogFields",
  "ELEVENLABS_API_KEY", "ELEVENLABS_LUMI_VOICE_ID", "eleven_multilingual_v2", "mp3_44100_128",
];
const failures = required.filter((item) => !source.includes(item));
if (source.includes("fetch(") || source.includes("process.env") || source.includes("Authorization: ")) failures.push("live_network_or_secret_access_forbidden");
if (/\bvoiceId\s*:/.test(source)) failures.push("actual_voice_id_field_forbidden");
if (fixture.credentialPresence?.apiKey !== "unchecked" || fixture.credentialPresence?.lumiVoiceId !== "unchecked") failures.push("fixture_must_not_check_credentials");
if (!Array.isArray(fixture.authorizationCases) || fixture.authorizationCases.length < 6) failures.push("authorization_fixture_incomplete");
if (!Array.isArray(fixture.callGuardCases) || fixture.callGuardCases.length < 2) failures.push("call_guard_fixture_incomplete");
if (!Array.isArray(fixture.audioResponseCases) || fixture.audioResponseCases.length < 10) failures.push("audio_response_fixture_incomplete");
if (failures.length) {
  console.error(`HOME_PROBLEM_LAB_ELEVENLABS_LIVE_CONTRACT_FAIL: ${failures.join(",")}`);
  process.exit(1);
}
console.log("HOME_PROBLEM_LAB_ELEVENLABS_LIVE_CONTRACT_PASS: disabled transport, redacted live contract, no network");
