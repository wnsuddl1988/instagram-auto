import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const requiredFiles = [
  "lib/home-problem-lab/types.ts",
  "lib/home-problem-lab/config.ts",
  "lib/home-problem-lab/tts-normalization.ts",
  "lib/home-problem-lab/tts-preflight.ts",
  "lib/home-problem-lab/tts-provider.ts",
  "lib/home-problem-lab/dry-run.ts",
  "app/api/home-problem-lab/route.ts",
  "app/home-problem-lab/page.tsx",
];
const source = requiredFiles.map((file) => readFileSync(resolve(root, file), "utf8")).join("\n");
const normalizationFixture = JSON.parse(readFileSync(resolve(root, "scripts/fixtures/home_problem_lab_lumi_tts_normalization.v1.json"), "utf8"));
const preflightFixture = JSON.parse(readFileSync(resolve(root, "scripts/fixtures/home_problem_lab_lumi_tts_preflight.v1.json"), "utf8"));
const required = [
  "HomeProblemLabLumiTtsRequest", "characterId: \"lumi\"", "voiceProfileId: \"lumi_home_problem_lab\"",
  "voiceProfileVersion: \"v1\"", "language: \"ko\"", "requestId: string", "ELEVENLABS_LUMI_VOICE_ID",
  "eleven_multilingual_v2", "eleven_flash_v2_5", "stability: 0.62", "similarityBoost: 0.78", "style: 0.08",
  "useSpeakerBoost: true", "speed: 1.08", "HomeProblemLabTtsProvider", "MockHomeProblemLabTtsProvider",
  "FutureElevenLabsHomeProblemLabTtsProvider", "HOME_PROBLEM_LAB_TTS_PROVIDER_BLOCKED", "supportsExternalCalls = false",
  "isMock: true", "isPublishable: false", "externalCalls: 0", "audioGenerated: false", "audioPath: null",
  "voiceIdExposed: false", "uploadCandidate: false", "TTS_CHARACTER_LIMIT_EXCEEDED", "TTS_FAKE_REVIEW",
  "TTS_FAKE_NEDON", "TTS_EXAGGERATED_EFFICACY", "TTS_DANGEROUS_CLEANING_MIX", "TTS_VOICE_PROFILE_MISMATCH",
  "TTS_VOICE_ID_EXPOSURE_BLOCKED", "TTS_EXTERNAL_CALL_BLOCKED",
  "ttsMode: \"mock_preflight_only\"", "Mock preflight", "실제 오디오 없음", "외부 호출 없음",
];
const failures = required.filter((value) => !source.includes(value));
if (!Array.isArray(normalizationFixture.cases) || normalizationFixture.cases.length < 10) failures.push("normalization_fixture_requires_10_cases");
if (!Array.isArray(preflightFixture.cases) || !preflightFixture.cases.some((item) => item.id === "mock-zero-calls")) failures.push("preflight_fixture_missing_mock_zero_calls");
if (source.includes("\\b(\\d+)\\s*분\\b")) failures.push("legacy_noop_minutes_normalization_remains");
if (/\bvoiceId\s*:/.test(source)) failures.push("actual_voice_id_field_forbidden");
if (failures.length) {
  console.error(`HOME_PROBLEM_LAB_LUMI_TTS_CONTRACT_FAIL: ${failures.join(", ")}`);
  process.exit(1);
}
console.log("HOME_PROBLEM_LAB_LUMI_TTS_CONTRACT_PASS: mock-only Lumi TTS preflight, no audio, no external calls");
