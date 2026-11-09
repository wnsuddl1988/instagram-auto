import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const secretSentinel = "PA4L_DIAG_SECRET_SENTINEL_MUST_NEVER_PERSIST";
const originalFetch = globalThis.fetch;
let actualExternalNetworkRequests = 0;
let fakeProviderRequests = 0;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function git(args) {
  const result = spawnSync("git", args, { cwd: root, encoding: "utf8", windowsHide: true, maxBuffer: 64 * 1024 * 1024 });
  if (result.status !== 0 || result.error) throw new Error(result.stderr || result.error?.message || `git ${args.join(" ")} failed`);
  return result.stdout.trimEnd();
}

function repositoryStatus() {
  return git(["status", "--porcelain=v1", "-z", "--untracked-files=all"]);
}

function statusPaths(raw) {
  return raw ? raw.split("\0").filter(Boolean).map((entry) => entry.slice(3).replaceAll("\\", "/")) : [];
}

function sha256File(path) {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}

const moduleCache = new Map();
function resolveTs(fromFile, specifier) {
  const base = resolve(dirname(fromFile), specifier);
  for (const candidate of [base, `${base}.ts`, `${base}.tsx`]) if (existsSync(candidate)) return candidate;
  throw new Error(`cannot resolve ${specifier}`);
}
function loadTs(path) {
  const absolute = resolve(root, path);
  const cached = moduleCache.get(absolute);
  if (cached) return cached.exports;
  const record = { exports: {} };
  moduleCache.set(absolute, record);
  const output = ts.transpileModule(readFileSync(absolute, "utf8"), {
    fileName: absolute,
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  const localRequire = (specifier) => specifier.startsWith(".") ? loadTs(resolveTs(absolute, specifier)) : require(specifier);
  new Function("require", "module", "exports", "__filename", "__dirname", output)(localRequire, record, record.exports, absolute, dirname(absolute));
  return record.exports;
}

const statusBefore = repositoryStatus();
const invariantPaths = statusPaths(statusBefore);
const hashesBefore = Object.fromEntries(invariantPaths.map((path) => [path, sha256File(resolve(root, path))]));
let probeError = null;
let summary = null;

try {
  globalThis.fetch = async () => {
    actualExternalNetworkRequests += 1;
    throw new Error("ACTUAL_NETWORK_FORBIDDEN_IN_PA4L_DIAG_PROBE");
  };
  const adapter = loadTs("lib/editorial-v2/elevenlabs-timestamp-tts-node.ts");
  const contracts = loadTs("lib/editorial-v2/voice-materialization-contracts.ts");
  const narration = "가나";

  async function requestWithFakeResponse({ payload, raw, status = 400, headers = {} }) {
    const fetchImpl = async (url, init) => {
      fakeProviderRequests += 1;
      assert(typeof url === "string" && url.startsWith(`${contracts.ELEVENLABS_API_ORIGIN}/v1/text-to-speech/`), "provider origin/path changed");
      assert(init?.method === "POST" && init?.redirect === "error", "provider request method/redirect changed");
      assert(init?.headers?.["xi-api-key"] === secretSentinel, "fake credential not forwarded to fake fetch");
      const requestBody = JSON.parse(init.body);
      assert(requestBody.text === narration && requestBody.model_id === "eleven_multilingual_v2", "provider request body regression");
      return new Response(raw ?? JSON.stringify(payload), {
        status,
        headers: { "content-type": "application/json", ...headers },
      });
    };
    try {
      const result = await adapter.requestElevenLabsTimestampTts({
        voiceId: "probe_voice_pa4l_diag",
        modelId: "eleven_multilingual_v2",
        narration,
        apiKey: secretSentinel,
        fetchImpl,
      });
      return { result, error: null };
    } catch (error) {
      return { result: null, error };
    }
  }

  const structuredCases = [
    {
      label: "invalid_parameters",
      detail: { type: "invalid_request_error", code: "invalid_parameters", message: "Invalid request parameters", param: "request", request_id: "req_invalid_parameters", status: "invalid_request" },
    },
    {
      label: "invalid_model",
      detail: { type: "invalid_request_error", code: "invalid_model", message: "The model is invalid", param: "model_id", request_id: "req_invalid_model", status: "invalid_request" },
    },
    {
      label: "invalid_voice_style_param",
      detail: { type: "invalid_request_error", code: "invalid_parameter", message: "Style is invalid for this voice", param: "voice_settings.style", request_id: "req_invalid_style", status: "invalid_request" },
    },
    {
      label: "missing_required_field",
      detail: { type: "validation_error", code: "missing_required_field", message: "A required field is missing", param: "text", request_id: "req_missing_field", status: "invalid_request" },
    },
    {
      label: "quota",
      detail: { type: "quota_error", code: "quota_exceeded", message: "Quota exceeded", param: null, request_id: "req_quota", status: "payment_required" },
    },
  ];
  const capturedStructured = [];
  for (const fixture of structuredCases) {
    const captured = await requestWithFakeResponse({ payload: { detail: fixture.detail } });
    assert(captured.error instanceof adapter.ElevenLabsProviderHttpError, `${fixture.label} did not retain typed provider error`);
    const providerError = captured.error.providerError;
    assert(providerError.httpStatus === 400 && providerError.code === fixture.detail.code, `${fixture.label} structured code lost`);
    assert(providerError.param === fixture.detail.param && providerError.requestId === fixture.detail.request_id, `${fixture.label} structured fields lost`);
    capturedStructured.push({ label: fixture.label, code: providerError.code, param: providerError.param });
  }

  const missing = await requestWithFakeResponse({ payload: { error: "legacy unknown" } });
  assert(missing.error.providerError.code === contracts.PROVIDER_ERROR_DETAIL_UNAVAILABLE, "missing detail did not fail closed");
  const stringDetail = await requestWithFakeResponse({ payload: { detail: "plain provider error" } });
  assert(stringDetail.error.providerError.message === contracts.PROVIDER_ERROR_DETAIL_UNAVAILABLE, "string detail did not fail closed");
  const malformed = await requestWithFakeResponse({ raw: "{not-json" });
  assert(malformed.error.providerError.code === contracts.PROVIDER_ERROR_DETAIL_UNAVAILABLE, "malformed JSON did not fail closed");

  const oversizedMessage = "x".repeat(contracts.ELEVENLABS_PROVIDER_ERROR_MESSAGE_MAX_LENGTH + 500);
  const oversized = await requestWithFakeResponse({ payload: { detail: { code: "oversized_message", message: oversizedMessage } } });
  assert(oversized.error.providerError.message.length === contracts.ELEVENLABS_PROVIDER_ERROR_MESSAGE_MAX_LENGTH, "message cap not enforced");
  assert(oversized.error.providerError.truncated === true, "message truncation flag missing");

  const secretBearing = await requestWithFakeResponse({
    payload: {
      detail: {
        type: "invalid_request_error",
        code: "credential_echo",
        message: `api_key=${secretSentinel} xi-api-key=headerSecret Authorization: Bearer bearerSecret123 token=tokenSecret123 sk_secretPattern123`,
        param: `Bearer ${secretSentinel}`,
        request_id: "req_secret_redaction",
        status: "invalid_request",
      },
    },
  });
  const serializedSecretBearing = JSON.stringify(secretBearing.error.providerError);
  for (const forbidden of [secretSentinel, "headerSecret", "bearerSecret123", "tokenSecret123", "sk_secretPattern123", "xi-api-key", "Authorization"] ) {
    assert(!serializedSecretBearing.includes(forbidden), `credential material leaked: ${forbidden}`);
  }

  const readerBound = await requestWithFakeResponse({
    payload: { detail: { code: "declared_too_large", message: "not read" } },
    headers: { "content-length": String(contracts.ELEVENLABS_MAX_RESPONSE_JSON_BYTES + 1) },
  });
  assert(readerBound.error.providerError.code === contracts.PROVIDER_ERROR_DETAIL_UNAVAILABLE, "bounded reader did not fail closed");
  assert(readerBound.error.providerError.truncated === true, "bounded reader truncation evidence missing");

  const successAlignment = {
    characters: [...narration],
    character_start_times_seconds: [0, 0.1],
    character_end_times_seconds: [0.1, 0.2],
  };
  const successful = await requestWithFakeResponse({
    status: 200,
    payload: {
      audio_base64: Buffer.from([1, 2, 3]).toString("base64"),
      alignment: successAlignment,
      normalized_alignment: successAlignment,
    },
  });
  assert(successful.error === null && successful.result.audio.byteLength === 3, "successful response regression");
  assert(successful.result.alignmentValidation.audioAlignmentUsable === true, "successful alignment regression");
  assert(contracts.PA4L_MAX_EXTERNAL_GENERATION_REQUESTS === 1, "PA4L request budget changed");
  assert(contracts.PA4L_AUTOMATIC_RETRY_LIMIT === 0 && contracts.PA4L_FALLBACK_REQUEST_LIMIT === 0, "retry/fallback budget changed");
  assert(actualExternalNetworkRequests === 0, "actual external network request occurred");

  summary = {
    structuredCases: capturedStructured,
    missingDetailFailClosed: true,
    stringDetailFailClosed: true,
    malformedJsonFailClosed: true,
    oversizedMessageTruncated: true,
    secretSentinelRedacted: true,
    bearerAndTokenPatternsRedacted: true,
    boundedReaderFailClosed: true,
    successfulResponseRegressionZero: true,
    fakeProviderRequests,
    actualExternalNetworkRequests,
    automaticRetryCount: 0,
    fallbackCount: 0,
  };
} catch (error) {
  probeError = error;
} finally {
  globalThis.fetch = originalFetch;
}

const statusAfter = repositoryStatus();
const hashesAfter = Object.fromEntries(invariantPaths.map((path) => [path, sha256File(resolve(root, path))]));
const repositoryUnchanged = statusBefore === statusAfter && invariantPaths.every((path) => hashesBefore[path] === hashesAfter[path]);
if (probeError || !repositoryUnchanged || actualExternalNetworkRequests !== 0) {
  console.error("SHORTS_EDITORIAL_OS_V2_PA4L_ERROR_DIAGNOSTICS_PROOF_FAILED");
  console.error(JSON.stringify({
    error: probeError instanceof Error ? probeError.message : probeError,
    repositoryUnchanged,
    actualExternalNetworkRequests,
    summary,
  }, null, 2));
  process.exit(1);
}

console.log("SHORTS_EDITORIAL_OS_V2_PA4L_ERROR_DIAGNOSTICS_PROOF_PASS");
console.log(JSON.stringify({ ...summary, repositoryUnchanged }, null, 2));
