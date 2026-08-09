import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const baseline = JSON.parse(readFileSync(resolve(root, "_ai/SHORTS_EDITORIAL_OS_V2_PA4L_ERROR_DIAGNOSTICS_BASELINE.json"), "utf8"));
const inherited = JSON.parse(readFileSync(resolve(root, baseline.protectedDirtyBaselineManifest.path), "utf8"));
const postCheckpoint = process.argv.includes("--post-checkpoint");
const postCheckpointCorrectionAllowlist = new Set([
  "lib/editorial-v2/voice-materialization-contracts.ts",
  "lib/editorial-v2/voice-materialization-validation.ts",
  "lib/editorial-v2/voice-materialization-api-client.ts",
  "lib/editorial-v2/voice-materialization-node.ts",
  "app/api/editorial-v2/projects/[projectId]/voice-materialization/route.ts",
  "scripts/probe-shorts-editorial-os-v2-pa4l-single-scene.mjs",
  "scripts/check-shorts-editorial-os-v2-pa4l-single-scene.mjs",
  "scripts/check-shorts-editorial-os-v2-pa4l-error-diagnostics.mjs",
]);
const failures = [];
let passed = 0;
let actualFetchCalls = 0;

function check(label, condition, detail = "") {
  if (condition) passed += 1;
  else failures.push(`${label}${detail ? ` :: ${detail}` : ""}`);
}

function git(args) {
  const result = spawnSync("git", args, { cwd: root, encoding: "utf8", windowsHide: true, maxBuffer: 64 * 1024 * 1024 });
  if (result.status !== 0 || result.error) throw new Error(result.stderr || result.error?.message || `git ${args.join(" ")} failed`);
  return result.stdout.trimEnd();
}

function source(path) {
  return readFileSync(resolve(root, path), "utf8");
}

function sha256File(path) {
  return createHash("sha256").update(readFileSync(resolve(root, path))).digest("hex");
}

function parseStatus() {
  const raw = git(["status", "--porcelain=v1", "-z", "--untracked-files=all"]);
  return raw ? raw.split("\0").filter(Boolean).map((entry) => ({ status: entry.slice(0, 2), path: entry.slice(3).replaceAll("\\", "/") })) : [];
}

const allowlist = baseline.pa4lDiagAllowlist.map((entry) => entry.path);
const allowlistSet = new Set(allowlist);
const inheritedStatusMap = new Map(inherited.statusPaths.map((entry) => [entry.path, entry]));
const status = parseStatus();
const statusMap = new Map(status.map((entry) => [entry.path, entry.status]));

if (!postCheckpoint) {
  check("branch exact", git(["branch", "--show-current"]) === baseline.git.branch);
  check("HEAD exact", git(["rev-parse", "HEAD"]) === baseline.git.head);
  check("parent exact", git(["rev-parse", "HEAD^"]) === baseline.git.parent);
  check("tree exact", git(["rev-parse", "HEAD^{tree}"]) === baseline.git.tree);
  const [behind, ahead] = git(["rev-list", "--left-right", "--count", "@{upstream}...HEAD"]).split(/\s+/u).map(Number);
  check("upstream behind exact", behind === baseline.git.upstream.behind);
  check("upstream ahead exact", ahead === baseline.git.upstream.ahead);
  check("precommit status paths exact", status.length === baseline.expectedPreCommitTree.statusPaths, String(status.length));
  check("precommit modified exact", status.filter((entry) => entry.status.includes("M")).length === baseline.expectedPreCommitTree.modified);
  check("precommit untracked exact", status.filter((entry) => entry.status === "??").length === baseline.expectedPreCommitTree.untracked);
  for (const entry of baseline.pa4lDiagAllowlist) {
    const expectedStatus = entry.expectedAction === "new" ? "??" : " M";
    check(`allowlist status ${entry.path}`, statusMap.get(entry.path) === expectedStatus, statusMap.get(entry.path) ?? "missing");
    check(`allowlist exists ${entry.path}`, existsSync(resolve(root, entry.path)));
    if (entry.originalBlob) check(`allowlist HEAD blob ${entry.path}`, git(["rev-parse", `HEAD:${entry.path}`]) === entry.originalBlob);
  }
  for (const entry of status) check(`status exact baseline or allowlist ${entry.path}`, inheritedStatusMap.has(entry.path) || allowlistSet.has(entry.path));
} else {
  check("post-checkpoint branch exact", git(["branch", "--show-current"]) === baseline.git.branch);
  for (const entry of baseline.pa4lDiagAllowlist) {
    check(`post-checkpoint allowlist committed ${entry.path}`, existsSync(resolve(root, entry.path)) && (postCheckpointCorrectionAllowlist.has(entry.path) || !statusMap.has(entry.path)));
  }
  for (const entry of status) check(`post-checkpoint status protected or correction ${entry.path}`, inheritedStatusMap.has(entry.path) || postCheckpointCorrectionAllowlist.has(entry.path));
}

check("staged zero", git(["diff", "--cached", "--name-only"]) === "");
check("rename zero", status.every((entry) => !entry.status.includes("R")));
check("delete zero", status.every((entry) => !entry.status.includes("D")));
check("allowlist exact eight", allowlist.length === 8 && allowlistSet.size === 8);
check("allowlist new exact three", baseline.pa4lDiagAllowlist.filter((entry) => entry.expectedAction === "new").length === 3);
check("allowlist modified exact five", baseline.pa4lDiagAllowlist.filter((entry) => entry.expectedAction === "modified").length === 5);

for (const entry of inherited.statusPaths) {
  check(`protected path status ${entry.path}`, statusMap.get(entry.path) === entry.status, statusMap.get(entry.path) ?? "missing");
  check(`protected path hash ${entry.path}`, existsSync(resolve(root, entry.path)) && sha256File(entry.path) === entry.sha256);
}
check("inherited PA4 baseline hash", sha256File(baseline.protectedDirtyBaselineManifest.path) === baseline.protectedDirtyBaselineManifest.sha256);
for (const entry of baseline.governanceFiles) {
  check(`governance hash ${entry.path}`, sha256File(entry.path) === entry.sha256);
  check(`governance clean ${entry.path}`, !statusMap.has(entry.path));
}
for (const entry of inherited.inheritedCheckpointManifests) {
  check(`checkpoint hash ${entry.path}`, sha256File(entry.path) === entry.sha256);
  check(`checkpoint clean ${entry.path}`, !statusMap.has(entry.path));
}
for (const entry of baseline.protectedConfigFiles) {
  check(`protected config status ${entry.path}`, entry.status ? statusMap.get(entry.path) === entry.status : !statusMap.has(entry.path));
  check(`protected config HEAD ${entry.path}`, git(["rev-parse", `HEAD:${entry.path}`]) === entry.headBlob);
  check(`protected config worktree ${entry.path}`, git(["hash-object", "--", entry.path]) === entry.workingBlob);
  check(`protected config sha ${entry.path}`, sha256File(entry.path) === entry.sha256);
  check(`protected config head policy ${entry.path}`, entry.expectedHeadIdentical ? entry.headBlob === entry.workingBlob : entry.headBlob !== entry.workingBlob);
}

const contractsSource = source("lib/editorial-v2/voice-materialization-contracts.ts");
const adapterSource = source("lib/editorial-v2/elevenlabs-timestamp-tts-node.ts");
const nodeSource = source("lib/editorial-v2/voice-materialization-node.ts");
const probeSource = source("scripts/probe-shorts-editorial-os-v2-pa4l-error-diagnostics.mjs");
const productSource = [contractsSource, adapterSource, nodeSource].join("\n");

check("provider error contract present", contractsSource.includes("interface SanitizedElevenLabsProviderError"));
for (const field of ["provider", "httpStatus", "type", "code", "message", "param", "requestId", "legacyStatus", "truncated"]) {
  check(`sanitized field ${field}`, contractsSource.includes(`readonly ${field}:`));
}
check("short cap exact", contractsSource.includes("ELEVENLABS_PROVIDER_ERROR_SHORT_FIELD_MAX_LENGTH = 128"));
check("long cap exact", contractsSource.includes("ELEVENLABS_PROVIDER_ERROR_LONG_FIELD_MAX_LENGTH = 256"));
check("message cap exact", contractsSource.includes("ELEVENLABS_PROVIDER_ERROR_MESSAGE_MAX_LENGTH = 2_000"));
check("unavailable fallback exact", contractsSource.includes('PROVIDER_ERROR_DETAIL_UNAVAILABLE = "PROVIDER_ERROR_DETAIL_UNAVAILABLE"'));
check("typed provider HTTP error", adapterSource.includes("export class ElevenLabsProviderHttpError extends Error"));
check("bounded non-2xx reader", adapterSource.indexOf("const errorText = await readBoundedJsonText(response)") > adapterSource.indexOf("if (!response.ok)"));
check("same response cap retained", adapterSource.includes("ELEVENLABS_MAX_RESPONSE_JSON_BYTES"));
check("no unbounded response text", !adapterSource.includes("await response.text()"));
check("exact API key redaction", adapterSource.includes('value.replaceAll(apiKey, "[REDACTED]")'));
check("credential assignment redaction", adapterSource.includes("CREDENTIAL_ASSIGNMENT_PATTERN"));
check("bearer redaction", adapterSource.includes("BEARER_CREDENTIAL_PATTERN"));
check("secret token redaction", adapterSource.includes("OBVIOUS_SECRET_TOKEN_PATTERN"));
check("malformed JSON fail closed", adapterSource.includes("ELEVENLABS_ERROR_RESPONSE_JSON_INVALID"));
check("oversized body fail closed", adapterSource.includes('error.message === "ELEVENLABS_RESPONSE_JSON_TOO_LARGE"'));
check("node persists provider error", nodeSource.includes("providerError,"));
check("pending provider error null", nodeSource.includes("providerError: null"));
check("node only accepts typed provider error", nodeSource.includes("error instanceof ElevenLabsProviderHttpError ? error.providerError : null"));
check("no raw body field", !/raw(?:Body|Response|Payload)|providerBody/iu.test(productSource));
check("no headers persisted", !/providerHeaders|rawHeaders|responseHeaders/iu.test(productSource));
check("no product logging", !/console\.(?:log|info|warn|error)|logger\./u.test(productSource));
check("fixed ElevenLabs origin retained", contractsSource.includes('ELEVENLABS_API_ORIGIN = "https://api.elevenlabs.io"'));
check("PA4L max request one", contractsSource.includes("PA4L_MAX_EXTERNAL_GENERATION_REQUESTS = 1"));
check("PA4L second-final total request cap two", contractsSource.includes("PA4L_MAX_TOTAL_EXTERNAL_GENERATION_REQUESTS = 2"));
check("PA4L retry zero", contractsSource.includes("PA4L_AUTOMATIC_RETRY_LIMIT = 0"));
check("PA4L fallback zero", contractsSource.includes("PA4L_FALLBACK_REQUEST_LIMIT = 0"));
check("second-final retry state guard", nodeSource.includes("PA4L_SECOND_FINAL_RETRY_STATE_INVALID"));
check("second-final retry owner confirmation", nodeSource.includes("PA4L_SECOND_FINAL_OWNER_CONFIRMATION_REQUIRED"));
for (const fixture of ["invalid_parameters", "invalid_model", "invalid_voice_style_param", "missing_required_field", "quota", "malformed", "oversizedMessage", "secretBearing", "readerBound", "successful"]) {
  check(`probe fixture ${fixture}`, probeSource.includes(fixture));
}
check("probe global fetch fail closed", probeSource.includes("ACTUAL_NETWORK_FORBIDDEN_IN_PA4L_DIAG_PROBE"));
check("probe external zero assertion", probeSource.includes("actualExternalNetworkRequests === 0"));
check("probe repository invariant", probeSource.includes("repositoryUnchanged"));
if (!postCheckpoint) {
  check("diagnostic provider requests zero", baseline.externalReadOnlyDiagnostics.actualRequests === 0 && baseline.externalReadOnlyDiagnostics.generationRequests === 0);
  check("root cause not guessed", baseline.rootCauseClassification === "PROVIDER_CAUSE_STILL_UNKNOWN");
  check("second live not authorized", baseline.constraints.secondLiveRequest === "NOT_AUTHORIZED");
  check("state failure current", source("_ai/PROJECT_STATE.md").includes("LIVE_TTS_SMOKE_FAILED_DIAGNOSED_OR_PENDING_RETRY"));
  check("state diagnostics zero", source("_ai/PROJECT_STATE.md").includes("actual external diagnostic request count: `0`"));
  check("next exact diagnostic approval", source("_ai/NEXT_ACTION.md").includes("APPROVE_PA4L_ELEVENLABS_READONLY_DIAGNOSTICS_WITH_API_KEY_NO_SECRET_OUTPUT"));
  check("next second live blocked", source("_ai/NEXT_ACTION.md").includes("APPROVE_PA4L_SECOND_AND_FINAL_ONE_SCENE_LIVE_ELEVENLABS_REQUEST"));
} else {
  check("post-checkpoint provider errors sanitized", adapterSource.includes("sanitizeElevenLabsProviderErrorPayload"));
  check("post-checkpoint second live owner gated", contractsSource.includes("readonly ownerConfirmationRequired: true"));
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
  const output = ts.transpileModule(readFileSync(absolute, "utf8"), { fileName: absolute, compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  const localRequire = (specifier) => specifier.startsWith(".") ? loadTs(resolveTs(absolute, specifier)) : require(specifier);
  new Function("require", "module", "exports", "__filename", "__dirname", output)(localRequire, record, record.exports, absolute, dirname(absolute));
  return record.exports;
}

try {
  const adapter = loadTs("lib/editorial-v2/elevenlabs-timestamp-tts-node.ts");
  const contracts = loadTs("lib/editorial-v2/voice-materialization-contracts.ts");
  const sentinel = "PA4L_CHECKER_SECRET_SENTINEL";
  const structured = adapter.sanitizeElevenLabsProviderErrorPayload({ detail: {
    type: "invalid_request_error",
    code: "invalid_parameters",
    message: `Authorization: Bearer bearerCheckerSecret token=tokenCheckerSecret api_key=${sentinel}`,
    param: "voice_settings.style",
    request_id: "req_checker",
    status: "invalid_request",
  } }, 400, sentinel);
  check("dynamic structured HTTP 400", structured.httpStatus === 400 && structured.code === "invalid_parameters");
  check("dynamic structured fields", structured.type === "invalid_request_error" && structured.param === "voice_settings.style" && structured.requestId === "req_checker" && structured.legacyStatus === "invalid_request");
  const serialized = JSON.stringify(structured);
  for (const forbidden of [sentinel, "bearerCheckerSecret", "tokenCheckerSecret", "Authorization", "api_key"]) check(`dynamic redaction ${forbidden}`, !serialized.includes(forbidden));
  const missing = adapter.sanitizeElevenLabsProviderErrorPayload({}, 400, sentinel);
  check("dynamic missing detail fail closed", missing.code === contracts.PROVIDER_ERROR_DETAIL_UNAVAILABLE);
  const stringDetail = adapter.sanitizeElevenLabsProviderErrorPayload({ detail: "invalid" }, 400, sentinel);
  check("dynamic string detail fail closed", stringDetail.code === contracts.PROVIDER_ERROR_DETAIL_UNAVAILABLE);
  const oversized = adapter.sanitizeElevenLabsProviderErrorPayload({ detail: { message: "x".repeat(2_500) } }, 400, sentinel);
  check("dynamic message cap", oversized.message.length === 2_000 && oversized.truncated === true);

  const narration = "가나";
  const alignment = { characters: [...narration], character_start_times_seconds: [0, 0.1], character_end_times_seconds: [0.1, 0.2] };
  let fakeSuccessCalls = 0;
  const success = await adapter.requestElevenLabsTimestampTts({
    voiceId: "checker_voice",
    modelId: "eleven_multilingual_v2",
    narration,
    apiKey: sentinel,
    fetchImpl: async () => {
      fakeSuccessCalls += 1;
      return new Response(JSON.stringify({ audio_base64: Buffer.from([1, 2, 3]).toString("base64"), alignment, normalized_alignment: alignment }), { status: 200, headers: { "content-type": "application/json" } });
    },
  });
  check("successful response regression zero", fakeSuccessCalls === 1 && success.audio.byteLength === 3 && success.alignmentValidation.audioAlignmentUsable);
  let fakeFailureCalls = 0;
  let capturedError = null;
  try {
    await adapter.requestElevenLabsTimestampTts({
      voiceId: "checker_voice",
      modelId: "eleven_multilingual_v2",
      narration,
      apiKey: sentinel,
      fetchImpl: async () => {
        fakeFailureCalls += 1;
        return new Response("{invalid", { status: 400, headers: { "content-type": "application/json" } });
      },
    });
  } catch (error) {
    capturedError = error;
  }
  check("malformed response typed error", fakeFailureCalls === 1 && capturedError instanceof adapter.ElevenLabsProviderHttpError);
  check("malformed response unavailable", capturedError?.providerError?.code === contracts.PROVIDER_ERROR_DETAIL_UNAVAILABLE);
} catch (error) {
  failures.push(`dynamic checker execution :: ${error instanceof Error ? error.stack ?? error.message : String(error)}`);
}

const targetSourcePaths = [
  "lib/editorial-v2/elevenlabs-timestamp-tts-node.ts",
  "lib/editorial-v2/voice-materialization-contracts.ts",
  "lib/editorial-v2/voice-materialization-node.ts",
];
const configPath = ts.findConfigFile(root, ts.sys.fileExists, "tsconfig.json");
const config = ts.readConfigFile(configPath, ts.sys.readFile);
const parsedConfig = ts.parseJsonConfigFileContent(config.config, ts.sys, root);
const program = ts.createProgram(parsedConfig.fileNames, { ...parsedConfig.options, noEmit: true, incremental: false });
const targetFiles = targetSourcePaths.map((path) => resolve(root, path));
for (const path of targetFiles) {
  const sourceFile = program.getSourceFile(path);
  check(`TypeScript source discovered ${relative(root, path)}`, Boolean(sourceFile));
  const syntactic = sourceFile ? program.getSyntacticDiagnostics(sourceFile) : [];
  const semantic = sourceFile ? program.getSemanticDiagnostics(sourceFile) : [];
  check(`TypeScript syntactic zero ${relative(root, path)}`, Boolean(sourceFile) && syntactic.length === 0, syntactic.map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, " ")).join(" | "));
  check(`TypeScript semantic zero ${relative(root, path)}`, Boolean(sourceFile) && semantic.length === 0, semantic.map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, " ")).join(" | "));
}
const preEmitDiagnostics = ts.getPreEmitDiagnostics(program).filter((diagnostic) => !diagnostic.file || targetFiles.includes(resolve(diagnostic.file.fileName)));
check("target strict preEmit zero", preEmitDiagnostics.length === 0, preEmitDiagnostics.map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, " ")).join(" | "));
check("checker actual fetch zero", actualFetchCalls === 0);
check("minimum 100 meaningful checks", passed + failures.length >= 100, String(passed + failures.length));

if (failures.length > 0) {
  console.error(`SHORTS_EDITORIAL_OS_V2_PA4L_ERROR_DIAGNOSTICS_CHECK_FAILED ${passed}/${passed + failures.length}`);
  for (const failure of failures) console.error(`FAIL ${failure}`);
  process.exit(1);
}
console.log(`SHORTS_EDITORIAL_OS_V2_PA4L_ERROR_DIAGNOSTICS_CHECK_PASS ${passed}/${passed}`);
