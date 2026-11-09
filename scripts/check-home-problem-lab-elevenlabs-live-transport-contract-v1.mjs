import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const transport = readFileSync(resolve(root, "lib/home-problem-lab/elevenlabs-live-transport.ts"), "utf8");
const config = readFileSync(resolve(root, "lib/home-problem-lab/config.ts"), "utf8");
const authorization = readFileSync(resolve(root, "lib/home-problem-lab/tts-live-authorization.ts"), "utf8");
const credentialBoundary = readFileSync(resolve(root, "lib/home-problem-lab/tts-live-credential-boundary.ts"), "utf8");
const registry = readFileSync(resolve(root, "lib/home-problem-lab/tts-live-call-registry.ts"), "utf8");
const sink = readFileSync(resolve(root, "lib/home-problem-lab/tts-audio-sink.ts"), "utf8");
const api = readFileSync(resolve(root, "app/api/home-problem-lab/route.ts"), "utf8");
const page = readFileSync(resolve(root, "app/home-problem-lab/page.tsx"), "utf8");
const source = [transport, config, authorization, credentialBoundary, registry, sink].join("\n");
const required = [
  "https://api.elevenlabs.io", "/v1/text-to-speech/", "output_format=", "method: \"POST\"",
  "xi-api-key", "Content-Type", "model_id", "voice_settings", "similarity_boost", "use_speaker_boost",
  "fetchImpl", "AbortController", "ELEVENLABS_TIMEOUT", "ELEVENLABS_REQUEST_REJECTED", "ELEVENLABS_UNAUTHORIZED",
  "ELEVENLABS_RATE_LIMITED", "ELEVENLABS_SERVER_ERROR", "ELEVENLABS_HTTP_FAILURE", "retryCount",
  "getPresence", "withCredentials", "TEST_ONLY_NOT_A_SECRET", "TEST_ONLY_VOICE_REFERENCE",
  "processLocalRegistry", "in_flight", "completed", "failed", "randomUUID", "flag: \"wx\"",
  "validateHomeProblemLabSingleSampleInput", "liveOneShotMaxCharacters", "SINGLE_SAMPLE_LINEBREAK_FORBIDDEN",
  "SINGLE_SAMPLE_LIST_FORBIDDEN", "SINGLE_SAMPLE_SEMICOLON_FORBIDDEN", "SINGLE_SAMPLE_REPEATED_SEPARATOR_FORBIDDEN",
];
const failures = required.filter((entry) => !source.includes(entry));
if (source.includes("process.env") || source.includes("globalThis.fetch") || /\bfetch\(/.test(source)) {
  failures.push("implicit_network_or_environment_access");
}
if (api.includes("elevenlabs-live-transport") || page.includes("elevenlabs-live-transport")) {
  failures.push("public_mock_surface_imports_live_transport");
}
if (source.includes("language_code")) failures.push("language_code_forbidden");
const retiredCredentialBoundary = ["tts", "live", "credentials"].join("-");
if (existsSync(resolve(root, `lib/home-problem-lab/${retiredCredentialBoundary}.ts`))) failures.push("retired_credential_boundary_retained");
if (failures.length) {
  console.error(`HOME_PROBLEM_LAB_ELEVENLABS_LIVE_TRANSPORT_CONTRACT_FAIL: ${failures.join(",")}`);
  process.exit(1);
}
console.log("HOME_PROBLEM_LAB_ELEVENLABS_LIVE_TRANSPORT_CONTRACT_PASS: injected fetch, credential boundary, registry, temp sink, mock-only public surface");
