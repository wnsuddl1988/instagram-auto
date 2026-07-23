import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import ts from "typescript";

const root = resolve(import.meta.dirname, "..");
const fixture = JSON.parse(readFileSync(resolve(root, "scripts/fixtures/home_problem_lab_elevenlabs_live_safety.v1.json"), "utf8"));

function toModuleUrl(relativePath, replacements = {}) {
  let output = ts.transpileModule(readFileSync(resolve(root, relativePath), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  for (const [specifier, replacement] of Object.entries(replacements)) {
    output = output.replaceAll(`\"${specifier}\"`, `\"${replacement}\"`);
  }
  return `data:text/javascript;base64,${Buffer.from(output).toString("base64")}`;
}

const typesUrl = toModuleUrl("lib/home-problem-lab/types.ts");
const configUrl = toModuleUrl("lib/home-problem-lab/config.ts", { "./types": typesUrl });
const normalizationUrl = toModuleUrl("lib/home-problem-lab/tts-normalization.ts");
const preflightUrl = toModuleUrl("lib/home-problem-lab/tts-preflight.ts");
const authorizationUrl = toModuleUrl("lib/home-problem-lab/tts-live-authorization.ts");
const adapterUrl = toModuleUrl("lib/home-problem-lab/elevenlabs-tts-adapter.ts", {
  "./config": configUrl,
  "./tts-live-authorization": authorizationUrl,
});
const providerUrl = toModuleUrl("lib/home-problem-lab/tts-provider.ts", {
  "./config": configUrl,
  "./elevenlabs-tts-adapter": adapterUrl,
  "./tts-live-authorization": authorizationUrl,
  "./tts-preflight": preflightUrl,
  "./tts-normalization": normalizationUrl,
});
const qualityUrl = toModuleUrl("lib/home-problem-lab/quality.ts", { "./types": typesUrl });
const dryRunUrl = toModuleUrl("lib/home-problem-lab/dry-run.ts", {
  "./config": configUrl,
  "./quality": qualityUrl,
  "./tts-provider": providerUrl,
});

const provider = await import(providerUrl);
const authorization = await import(authorizationUrl);
const adapter = await import(adapterUrl);
const dryRun = await import(dryRunUrl);
const text = "루미가 원인부터 설명합니다.";
const request = provider.createHomeProblemLabLumiLiveTtsRequest(text, "live-fixture-1");
const baseAuthorization = (patch = {}) => ({
  ...authorization.createHomeProblemLabUncheckedLiveAuthorization(request.requestId, text),
  ...patch,
});
const authorizationFailures = fixture.authorizationCases
  .filter((item) => {
    const patch = { ...item };
    delete patch.id;
    delete patch.expectedError;
    return !authorization.validateHomeProblemLabLiveAuthorization(baseAuthorization(patch)).errors.includes(item.expectedError);
  })
  .map((item) => item.id);
const guardFailures = fixture.callGuardCases
  .filter((item) => {
    const guard = new authorization.HomeProblemLabLiveCallGuard();
    const results = item.requestIds.map((requestId) => guard.reserve(requestId));
    return results.at(-1)?.errorCode !== item.expectedError;
  })
  .map((item) => item.id);
const audioFailures = fixture.audioResponseCases
  .filter((item) => {
    const result = adapter.validateHomeProblemLabAudioResponse(item);
    return item.expectedPassed === true ? !result.passed : result.errorCode !== item.expectedError;
  })
  .map((item) => item.id);
const envelope = adapter.buildHomeProblemLabElevenLabsRequest(request, baseAuthorization());
const safeLog = adapter.createHomeProblemLabSafeTtsLogEvent(envelope, "HOME_PROBLEM_LAB_TTS_TRANSPORT_DISABLED");
const defaultProvider = provider.getHomeProblemLabTtsProvider();
const liveProvider = provider.getHomeProblemLabTtsProvider("elevenlabs_live");
const blockedResult = liveProvider.synthesizeLive(request, baseAuthorization());
let invalidProviderBlocked = false;
try { provider.getHomeProblemLabTtsProvider("invalid_provider"); } catch (error) { invalidProviderBlocked = String(error.message).includes("HOME_PROBLEM_LAB_TTS_PROVIDER_INVALID"); }
const assertions = {
  defaultProvider: defaultProvider.providerName === "mock" && defaultProvider.supportsExternalCalls === false,
  invalidProviderBlocked,
  requestBuilder: envelope.model === "eleven_multilingual_v2" && envelope.outputFormat === "mp3_44100_128" && envelope.timeoutMs === 20_000 && envelope.estimatedBillableCharacters === request.normalizedText.length,
  liveAuthorizationGate: blockedResult.errorCode === "HOME_PROBLEM_LAB_TTS_LIVE_NOT_AUTHORIZED" && blockedResult.externalCalls === 0 && blockedResult.audioGenerated === false,
  redaction: adapter.findHomeProblemLabSensitiveLogFields(safeLog).length === 0 && adapter.findHomeProblemLabSensitiveLogFields({ voiceId: null }).includes("voiceId"),
  mockSamples: dryRun.createFiveHomeProblemLabDryRunSamples().every((sample) => sample.lumiTts.response.externalCalls === 0 && sample.lumiTts.response.audioGenerated === false),
};
const assertionFailures = Object.entries(assertions).filter(([, passed]) => !passed).map(([name]) => name);
const failures = [...authorizationFailures, ...guardFailures, ...audioFailures, ...assertionFailures];
if (failures.length) {
  console.error(`HOME_PROBLEM_LAB_ELEVENLABS_LIVE_FIXTURES_FAIL: ${failures.join(",")}`);
  process.exit(1);
}
console.log(`HOME_PROBLEM_LAB_ELEVENLABS_LIVE_FIXTURES_PASS: ${fixture.authorizationCases.length} authorization, ${fixture.callGuardCases.length} guard, ${fixture.audioResponseCases.length} response cases`);
