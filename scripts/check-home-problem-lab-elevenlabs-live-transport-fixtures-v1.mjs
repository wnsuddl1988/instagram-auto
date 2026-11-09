import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import ts from "typescript";

const root = resolve(import.meta.dirname, "..");
const fixture = JSON.parse(readFileSync(resolve(root, "scripts/fixtures/home_problem_lab_elevenlabs_live_transport.v1.json"), "utf8"));

function toModuleUrl(relativePath, replacements = {}) {
  let output = ts.transpileModule(readFileSync(resolve(root, relativePath), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  for (const [specifier, replacement] of Object.entries(replacements)) {
    output = output.replaceAll(`"${specifier}"`, `"${replacement}"`);
  }
  return `data:text/javascript;base64,${Buffer.from(output).toString("base64")}`;
}

const typesUrl = toModuleUrl("lib/home-problem-lab/types.ts");
const configUrl = toModuleUrl("lib/home-problem-lab/config.ts", { "./types": typesUrl });
const authorizationUrl = toModuleUrl("lib/home-problem-lab/tts-live-authorization.ts", { "./config": configUrl });
const adapterUrl = toModuleUrl("lib/home-problem-lab/elevenlabs-tts-adapter.ts", {
  "./config": configUrl,
  "./tts-live-authorization": authorizationUrl,
});
const credentialBoundaryUrl = toModuleUrl("lib/home-problem-lab/tts-live-credential-boundary.ts");
const registryUrl = toModuleUrl("lib/home-problem-lab/tts-live-call-registry.ts");
const sinkUrl = toModuleUrl("lib/home-problem-lab/tts-audio-sink.ts");
const transportUrl = toModuleUrl("lib/home-problem-lab/elevenlabs-live-transport.ts", {
  "./elevenlabs-tts-adapter": adapterUrl,
  "./tts-live-authorization": authorizationUrl,
  "./tts-live-credential-boundary": credentialBoundaryUrl,
  "./tts-live-call-registry": registryUrl,
  "./tts-audio-sink": sinkUrl,
});

const authorization = await import(authorizationUrl);
const credentialBoundary = await import(credentialBoundaryUrl);
const registry = await import(registryUrl);
const sink = await import(sinkUrl);
const transportModule = await import(transportUrl);

const validSentence = "욕실 냄새는 배수구의 물막이가 마른 경우 생길 수 있으니 물을 천천히 부어 원인부터 확인해 보세요.";
const request = (requestId, text = validSentence) => ({
  provider: "elevenlabs_live", engineId: "home_problem_lab", characterId: "lumi", voiceProfileId: "lumi_home_problem_lab",
  requestId, text, normalizedText: text, model: "eleven_multilingual_v2",
  voiceSettings: { stability: 0.62, similarityBoost: 0.78, style: 0.08, useSpeakerBoost: true, speed: 1.08 },
  outputFormat: "mp3_44100_128", characterCount: text.length, estimatedBillableCharacters: text.length, timeoutMs: 20_000,
  maxExternalCalls: 1, retryCount: 0, credentialPresence: { apiKey: "present", lumiVoiceId: "present" },
});
const liveAuthorization = (requestId, sampleText = validSentence, patch = {}) => ({
  engineId: "home_problem_lab", characterId: "lumi", voiceProfileId: "lumi_home_problem_lab", provider: "elevenlabs_live",
  dryRun: false, liveCallAuthorized: true, maxExternalCalls: 1, requestId, sampleText, batchSize: 1, sentenceCount: 1,
  preflightPassed: true, instagramUpload: false, youtubeUpload: false, imageGeneration: false, productLookup: false,
  credentialPresence: { apiKey: "present", lumiVoiceId: "present" }, ...patch,
});
const audioResponse = (status = 200, contentType = "audio/mpeg", byteLength = 1024) => ({
  status, headers: { get: () => contentType }, arrayBuffer: async () => new Uint8Array(byteLength).buffer,
});
const fakeFetch = (response, captured) => async (url, init) => {
  captured.push({ url, init });
  if (init.signal.aborted) throw new Error("aborted");
  return response;
};
const syntheticProvider = credentialBoundary.createSyntheticHomeProblemLabLiveCredentialProvider();
const run = async ({ id, inputText = validSentence, response = audioResponse(), permitPatch = {}, authorizationPatch = {}, provider = syntheticProvider, fetchImpl, audioSink, now = () => 1_000, setTimeoutImpl, registryInstance } = {}) => {
  const captured = [];
  const transport = new transportModule.HomeProblemLabElevenLabsLiveTransport({
    fetchImpl: fetchImpl ?? fakeFetch(response, captured), credentialProvider: provider,
    callRegistry: registryInstance ?? registry.createHomeProblemLabLiveCallRegistryForTest(),
    audioSink: audioSink ?? new sink.InMemoryHomeProblemLabAudioSink(), now, setTimeoutImpl,
    clearTimeoutImpl: () => {},
  });
  const req = request(id, inputText);
  const permit = { ...authorization.createSyntheticHomeProblemLabLiveExecutionPermit(id, 2_000), ...permitPatch };
  return { result: await transport.execute(req, liveAuthorization(id, inputText, authorizationPatch), permit), captured, transport, req, permit };
};

const failures = [];
const expect = (name, value) => { if (!value) failures.push(name); };

const normal = await run({ id: "normal" });
expect("normal_mp3", normal.result.validationPassed && normal.result.audioGenerated && normal.result.externalCalls === 1);
expect("url_internal", normal.captured.length === 1 && normal.captured[0].url.startsWith("https://api.elevenlabs.io/v1/text-to-speech/") && normal.captured[0].url.includes("output_format=mp3_44100_128"));
const parsedBody = JSON.parse(normal.captured[0].init.body);
expect("headers_and_body", normal.captured[0].init.method === "POST" && normal.captured[0].init.headers["Content-Type"] === "application/json" && parsedBody.model_id === "eleven_multilingual_v2" && !Object.hasOwn(parsedBody, "language_code"));
expect("result_nonpublishable", normal.result.isPublishable === false && normal.result.uploadCandidate === false && normal.result.durationMs === null);
const commaSentence = "욕실 냄새는 배수구의 물막이가 마른 경우 생길 수 있으니, 물을 천천히 부어 원인부터 확인해 보세요.";
const colonSentence = "루미의 진단: 욕실 냄새는 배수구 물막이가 마른 경우가 많으니 먼저 물을 보충해 확인해 보세요.";
expect("comma_single_sentence", (await run({ id: "comma_single_sentence", inputText: commaSentence })).captured.length === 1);
expect("colon_single_sentence", (await run({ id: "colon_single_sentence", inputText: colonSentence })).captured.length === 1);

const inputGuardFetchCounts = {};
const assertBlockedInput = async (id, inputText, bypassAuthorization = false) => {
  const captured = [];
  const localRegistry = registry.createHomeProblemLabLiveCallRegistryForTest();
  const countingSink = {
    calls: 0,
    async saveVerifiedAudio() { this.calls += 1; return { audioPath: null, audioGenerated: true }; },
    async cleanup() {},
  };
  const guardedTransport = new transportModule.HomeProblemLabElevenLabsLiveTransport({
    fetchImpl: fakeFetch(audioResponse(), captured), credentialProvider: syntheticProvider,
    callRegistry: localRegistry, audioSink: countingSink,
  });
  const guardedRequest = request(id, inputText);
  const authorizationText = bypassAuthorization ? validSentence : inputText;
  const result = await guardedTransport.execute(
    guardedRequest,
    liveAuthorization(id, authorizationText),
    authorization.createSyntheticHomeProblemLabLiveExecutionPermit(id, 2_000),
  );
  inputGuardFetchCounts[id] = captured.length;
  expect(id, result.externalCalls === 0 && result.audioGenerated === false && result.audioPath === null && captured.length === 0 && countingSink.calls === 0 && localRegistry.getState(id) !== "completed" && result.isPublishable === false);
};
await assertBlockedInput("two_sentences", "욕실 냄새는 원인을 먼저 확인해야 합니다. 물막이가 마르면 냄새가 올라올 수 있습니다.");
await assertBlockedInput("three_lines", "욕실 냄새 원인을 확인합니다.\n배수구 물막이를 봅니다.\n물을 보충합니다.");
await assertBlockedInput("list_three_items", "- 배수구 물막이를 확인합니다 - 환기를 확인합니다 - 쓰레기통을 확인합니다");
await assertBlockedInput("five_semicolons", "배수구를 확인합니다; 물막이를 봅니다; 환기 상태를 봅니다; 쓰레기통을 비웁니다; 다시 냄새를 확인합니다; 원인부터 해결합니다.");
await assertBlockedInput("repeated_separators", "배수구/물막이/환기/쓰레기통을 순서대로 확인해 욕실 냄새 원인을 먼저 찾습니다.");
await assertBlockedInput("unpunctuated_221", "가".repeat(221));
await assertBlockedInput("unpunctuated_400", "가".repeat(400));
await assertBlockedInput("over_max_single_sentence", `${"가".repeat(221)}.`);
await assertBlockedInput("transport_bypass_long", "가".repeat(221), true);
for (const [id, status, code] of [["http_401", 401, "ELEVENLABS_UNAUTHORIZED"], ["http_403", 403, "ELEVENLABS_UNAUTHORIZED"], ["http_429", 429, "ELEVENLABS_RATE_LIMITED"], ["http_422", 422, "ELEVENLABS_REQUEST_REJECTED"], ["http_500", 500, "ELEVENLABS_SERVER_ERROR"]]) {
  expect(id, (await run({ id, response: audioResponse(status) })).result.errorCode === code);
}
expect("timeout", (await run({ id: "timeout", setTimeoutImpl: (callback) => { callback(); return 0; } })).result.errorCode === "ELEVENLABS_TIMEOUT");
expect("empty_audio", (await run({ id: "empty_audio", response: audioResponse(200, "audio/mpeg", 0) })).result.validationPassed === false);
expect("json_response", (await run({ id: "json_response", response: audioResponse(200, "application/json", 1024) })).result.errorCode === "HOME_PROBLEM_LAB_TTS_INVALID_CONTENT_TYPE");
expect("html_response", (await run({ id: "html_response", response: audioResponse(200, "text/html", 1024) })).result.errorCode === "HOME_PROBLEM_LAB_TTS_INVALID_CONTENT_TYPE");
expect("wrong_content_type", (await run({ id: "wrong_content_type", response: audioResponse(200, "audio/wav", 1024) })).result.errorCode === "HOME_PROBLEM_LAB_TTS_INVALID_CONTENT_TYPE");
expect("audio_too_small", (await run({ id: "audio_too_small", response: audioResponse(200, "audio/mpeg", 1023) })).result.errorCode === "HOME_PROBLEM_LAB_TTS_AUDIO_TOO_SMALL");
expect("audio_too_large", (await run({ id: "audio_too_large", response: audioResponse(200, "audio/mpeg", 25 * 1024 * 1024 + 1) })).result.errorCode === "HOME_PROBLEM_LAB_TTS_AUDIO_TOO_LARGE");
const duplicateRegistry = registry.createHomeProblemLabLiveCallRegistryForTest();
await run({ id: "duplicate", registryInstance: duplicateRegistry });
expect("duplicate_request", (await run({ id: "duplicate", registryInstance: duplicateRegistry })).result.errorCode === "HOME_PROBLEM_LAB_TTS_DUPLICATE_REQUEST");
expect("expired_permit", (await run({ id: "expired_permit", permitPatch: { expiresAt: 999 } })).result.errorCode === "HOME_PROBLEM_LAB_TTS_PERMIT_EXPIRED");
expect("permit_request_mismatch", (await run({ id: "permit_mismatch", permitPatch: { requestId: "other" } })).result.errorCode === "HOME_PROBLEM_LAB_TTS_PERMIT_REQUEST_MISMATCH");
const missingProvider = { getPresence: async () => ({ apiKey: "missing", lumiVoiceId: "missing" }), withCredentials: async () => { throw new Error("should_not_run"); } };
const uncheckedProvider = { getPresence: async () => ({ apiKey: "unchecked", lumiVoiceId: "unchecked" }), withCredentials: async () => { throw new Error("should_not_run"); } };
expect("missing_credentials", (await run({ id: "missing_credentials", provider: missingProvider })).result.errorCode === "HOME_PROBLEM_LAB_TTS_CREDENTIALS_NOT_PRESENT");
expect("unchecked_credentials", (await run({ id: "unchecked_credentials", provider: uncheckedProvider })).result.errorCode === "HOME_PROBLEM_LAB_TTS_CREDENTIALS_NOT_PRESENT");
const missingFetchResult = await new transportModule.HomeProblemLabElevenLabsLiveTransport({ fetchImpl: undefined, credentialProvider: syntheticProvider, callRegistry: registry.createHomeProblemLabLiveCallRegistryForTest(), audioSink: new sink.InMemoryHomeProblemLabAudioSink() }).execute(request("missing_fetch_real"), liveAuthorization("missing_fetch_real"), authorization.createSyntheticHomeProblemLabLiveExecutionPermit("missing_fetch_real", 2_000));
expect("missing_fetch", missingFetchResult.errorCode === "HOME_PROBLEM_LAB_TTS_FETCH_IMPL_REQUIRED");
const missingSinkResult = await new transportModule.HomeProblemLabElevenLabsLiveTransport({ fetchImpl: fakeFetch(audioResponse(), []), credentialProvider: syntheticProvider, callRegistry: registry.createHomeProblemLabLiveCallRegistryForTest(), audioSink: undefined }).execute(request("missing_sink"), liveAuthorization("missing_sink"), authorization.createSyntheticHomeProblemLabLiveExecutionPermit("missing_sink", 2_000));
expect("missing_sink", missingSinkResult.errorCode === "HOME_PROBLEM_LAB_TTS_AUDIO_SINK_REQUIRED");
const serialized = JSON.stringify(normal.result);
expect("secret_redaction", !serialized.includes("TEST_ONLY_NOT_A_SECRET") && !serialized.includes("TEST_ONLY_VOICE_REFERENCE") && normal.result.secretExposed === false && normal.result.voiceIdExposed === false);
expect("one_call_no_retry", normal.captured.length === 1 && normal.req.retryCount === 0 && normal.req.maxExternalCalls === 1);
expect("no_file_output", normal.result.audioPath === null);
expect("authorization_required", (await run({ id: "authorization_required", authorizationPatch: { liveCallAuthorized: false } })).result.errorCode === "HOME_PROBLEM_LAB_TTS_LIVE_NOT_AUTHORIZED");
expect("permit_side_effect_flags", (await run({ id: "permit_flags", permitPatch: { publish: true } })).result.errorCode === "HOME_PROBLEM_LAB_TTS_PERMIT_SIDE_EFFECT_FLAGS_FORBIDDEN");

if (fixture.cases.length < 40 || failures.length) {
  console.error(`HOME_PROBLEM_LAB_ELEVENLABS_LIVE_TRANSPORT_FIXTURES_FAIL: ${failures.join(",") || "fixture_case_count"}`);
  process.exit(1);
}
console.log(`HOME_PROBLEM_LAB_ELEVENLABS_LIVE_TRANSPORT_FIXTURES_PASS: ${fixture.cases.length} no-network synthetic cases; guard fetches=${JSON.stringify(inputGuardFetchCounts)}`);
