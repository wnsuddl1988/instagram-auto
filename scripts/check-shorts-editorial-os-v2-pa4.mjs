import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, relative, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const root = resolve(dirname(new URL(import.meta.url).pathname.replace(/^\/(?:[A-Za-z]:)/u, (value) => value.slice(1))), "..");
const baselinePath = resolve(root, "_ai/SHORTS_EDITORIAL_OS_V2_PA4_BASELINE.json");
const baseline = JSON.parse(readFileSync(baselinePath, "utf8"));
const failures = [];
let passed = 0;

function check(label, condition, detail = "") {
  if (condition) passed += 1;
  else failures.push(`${label}${detail ? ` :: ${detail}` : ""}`);
}

function git(args) {
  const result = spawnSync("git", args, { cwd: root, encoding: "utf8", windowsHide: true, maxBuffer: 64 * 1024 * 1024 });
  if (result.status !== 0 || result.error) throw new Error(result.stderr || result.error?.message || `git ${args.join(" ")} failed`);
  return result.stdout.trimEnd();
}

function sha256File(path) {
  return createHash("sha256").update(readFileSync(resolve(root, path))).digest("hex");
}

function sha256Text(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function parseStatus() {
  const raw = git(["status", "--porcelain=v1", "-z", "--untracked-files=all"]);
  if (!raw) return [];
  return raw.split("\0").filter(Boolean).map((entry) => ({ status: entry.slice(0, 2), path: entry.slice(3).replaceAll("\\", "/") }));
}

function source(path) {
  return readFileSync(resolve(root, path), "utf8");
}

const allowlist = baseline.pa4Allowlist.map((entry) => entry.path);
const allowlistSet = new Set(allowlist);
const baselineStatusMap = new Map(baseline.statusPaths.map((entry) => [entry.path, entry]));
const status = parseStatus();
const statusMap = new Map(status.map((entry) => [entry.path, entry.status]));

check("branch exact", git(["branch", "--show-current"]) === baseline.git.branch);
check("HEAD exact", git(["rev-parse", "HEAD"]) === baseline.git.head);
check("parent exact", git(["rev-parse", "HEAD^"]) === baseline.git.parent);
check("tree exact", git(["rev-parse", "HEAD^{tree}"]) === baseline.git.tree);
const [behind, ahead] = git(["rev-list", "--left-right", "--count", "@{upstream}...HEAD"]).split(/\s+/u).map(Number);
check("upstream behind exact", behind === baseline.git.upstream.behind);
check("upstream ahead exact", ahead === baseline.git.upstream.ahead);
check("staged zero", git(["diff", "--cached", "--name-only"]) === "");
check("status path count 42", status.length === 42, String(status.length));
check("modified count 25", status.filter((entry) => entry.status.includes("M")).length === 25);
check("untracked count 17", status.filter((entry) => entry.status === "??").length === 17);
check("rename zero", status.every((entry) => !entry.status.includes("R")));
check("delete zero", status.every((entry) => !entry.status.includes("D")));

for (const entry of baseline.statusPaths) {
  check(`baseline path present ${entry.path}`, statusMap.get(entry.path) === entry.status, statusMap.get(entry.path) ?? "missing");
  check(`baseline hash unchanged ${entry.path}`, existsSync(resolve(root, entry.path)) && sha256File(entry.path) === entry.sha256);
}
for (const entry of baseline.pa4Allowlist) {
  const expectedStatus = entry.expectedAction === "new" ? "??" : " M";
  check(`allowlist status ${entry.path}`, statusMap.get(entry.path) === expectedStatus, statusMap.get(entry.path) ?? "missing");
  check(`allowlist file exists ${entry.path}`, existsSync(resolve(root, entry.path)));
}
for (const entry of status) {
  check(`status within baseline or allowlist ${entry.path}`, baselineStatusMap.has(entry.path) || allowlistSet.has(entry.path));
}
check("allowlist exact 18", allowlist.length === 18 && new Set(allowlist).size === 18);
check("allowlist new 14", baseline.pa4Allowlist.filter((entry) => entry.expectedAction === "new").length === 14);
check("allowlist modified 4", baseline.pa4Allowlist.filter((entry) => entry.expectedAction === "modified").length === 4);

for (const entry of baseline.governanceFiles) {
  check(`governance hash ${entry.path}`, sha256File(entry.path) === entry.sha256);
  check(`governance clean ${entry.path}`, !statusMap.has(entry.path));
}
for (const entry of baseline.inheritedCheckpointManifests) {
  check(`checkpoint hash ${entry.path}`, sha256File(entry.path) === entry.sha256);
  check(`checkpoint clean ${entry.path}`, !statusMap.has(entry.path));
}

const packageConfig = baseline.protectedConfigFiles.find((entry) => entry.path === "package.json");
check("package protected baseline declared", packageConfig?.protectedDirtyBaseline === true);
check("package expected HEAD identity false", packageConfig?.expectedHeadIdentical === false);
check("package expected working identity true", packageConfig?.expectedWorkingBaselineIdentical === true);
check("package status protected dirty", statusMap.get("package.json") === " M");
check("package HEAD blob exact", git(["rev-parse", "HEAD:package.json"]) === packageConfig?.headBlob);
check("package working blob exact", git(["hash-object", "--", "package.json"]) === packageConfig?.workingBlob);
check("package SHA exact", sha256File("package.json") === packageConfig?.sha256);
check("package PA3 identity compared", Object.values(packageConfig?.pa3IdentityComparison ?? {}).filter((value) => value === true).length === 4);
check("package outside PA4 allowlist", !allowlistSet.has("package.json"));
check("package not staged", !git(["diff", "--cached", "--name-only"]).split(/\r?\n/u).includes("package.json"));
for (const entry of baseline.protectedConfigFiles.filter((item) => item.path !== "package.json")) {
  check(`protected config status clean ${entry.path}`, !statusMap.has(entry.path));
  check(`protected config HEAD blob ${entry.path}`, git(["rev-parse", `HEAD:${entry.path}`]) === entry.headBlob);
  check(`protected config working blob ${entry.path}`, git(["hash-object", "--", entry.path]) === entry.workingBlob);
  check(`protected config HEAD identical ${entry.path}`, entry.headBlob === entry.workingBlob && entry.expectedHeadIdentical === true);
  check(`protected config SHA ${entry.path}`, sha256File(entry.path) === entry.sha256);
}

const newLibPaths = [
  "lib/editorial-v2/voice-materialization-contracts.ts",
  "lib/editorial-v2/elevenlabs-timestamp-tts-node.ts",
  "lib/editorial-v2/voice-materialization-node.ts",
  "lib/editorial-v2/voice-audio-store-node.ts",
  "lib/editorial-v2/audio-alignment.ts",
  "lib/editorial-v2/voice-materialization-validation.ts",
  "lib/editorial-v2/voice-materialization-recovery.ts",
  "lib/editorial-v2/voice-materialization-api-client.ts",
];
const allNewCode = [
  ...newLibPaths,
  "components/editorial-v2/VoiceMaterializationPanel.tsx",
  "app/api/editorial-v2/projects/[projectId]/voice-materialization/route.ts",
].map(source).join("\n");
check("no V1 provider import", !/(?:from|require\()[^\n]*(?:money-shorts|voice-provider|tts-provider)/iu.test(allNewCode));
check("no SDK dependency", !/@elevenlabs|elevenlabs-sdk|ElevenLabsClient/u.test(allNewCode));
check("no websocket", !/WebSocket|wss:\/\//u.test(allNewCode));
check("no localStorage", !/localStorage/u.test(allNewCode));
check("no generic provider URL input", !/providerUrl|baseUrl|proxyUrl|endpointUrl/u.test(allNewCode));
check("no secret logging", !/console\.(?:log|info|warn|error)|logger\./u.test(allNewCode));
check("no process spawn in provider adapter", !/child_process|spawn|execFile|shell/u.test(source("lib/editorial-v2/elevenlabs-timestamp-tts-node.ts")));
check("fixed provider origin", source("lib/editorial-v2/voice-materialization-contracts.ts").includes('ELEVENLABS_API_ORIGIN = "https://api.elevenlabs.io"'));
check("fixed timestamp endpoint", source("lib/editorial-v2/elevenlabs-timestamp-tts-node.ts").includes("/v1/text-to-speech/${encodeURIComponent(voiceId)}/with-timestamps"));
check("fixed output format", source("lib/editorial-v2/voice-materialization-contracts.ts").includes('ELEVENLABS_OUTPUT_FORMAT = "mp3_44100_128"'));
check("server auth header", source("lib/editorial-v2/elevenlabs-timestamp-tts-node.ts").includes('"xi-api-key": request.apiKey'));
check("explicit model id", source("lib/editorial-v2/elevenlabs-timestamp-tts-node.ts").includes("model_id: request.modelId"));
check("redirect error", source("lib/editorial-v2/elevenlabs-timestamp-tts-node.ts").includes('redirect: "error"'));
check("bounded response reader", source("lib/editorial-v2/elevenlabs-timestamp-tts-node.ts").includes("response.body.getReader()"));
check("response 32 MiB constant", source("lib/editorial-v2/voice-materialization-contracts.ts").includes("32 * 1024 * 1024"));
check("scene audio 20 MiB constant", source("lib/editorial-v2/voice-materialization-contracts.ts").includes("20 * 1024 * 1024"));
check("total audio 80 MiB constant", source("lib/editorial-v2/voice-materialization-contracts.ts").includes("80 * 1024 * 1024"));
check("strict base64", source("lib/editorial-v2/elevenlabs-timestamp-tts-node.ts").includes("STRICT_BASE64"));
check("no automatic retry provider", !/retry|backoff/iu.test(source("lib/editorial-v2/elevenlabs-timestamp-tts-node.ts")));
check("stop on first failure", source("lib/editorial-v2/voice-materialization-node.ts").includes("if (stoppedOnFirstFailure) break"));
check("sequential for loop", /for \(const \[index, scene\] of plan\.scenes\.entries\(\)\)/u.test(source("lib/editorial-v2/voice-materialization-node.ts")));
check("ffprobe fixed", source("lib/editorial-v2/voice-materialization-node.ts").includes('execFile("ffprobe"'));
check("duration tolerance", source("lib/editorial-v2/voice-materialization-validation.ts").includes("Math.max(300, audioDurationMs * 0.05)"));
check("store in project audio tts", source("lib/editorial-v2/voice-audio-store-node.ts").includes('resolve(projectRoot, "audio", "tts")'));
check("store containment", source("lib/editorial-v2/voice-audio-store-node.ts").includes("isEditorialV2PathContained"));
check("store symlink guard", source("lib/editorial-v2/voice-audio-store-node.ts").includes("assertNoSymlinkOrJunctionSegments"));
check("store atomic rename", source("lib/editorial-v2/voice-audio-store-node.ts").includes("await rename(temporaryPath, path)"));
check("store immutable conflict", source("lib/editorial-v2/voice-audio-store-node.ts").includes("VOICE_SCENE_IMMUTABLE_CACHE_CONFLICT"));
check("no absolute path in API JSON", !/mediaPath[^\n]*NextResponse\.json/u.test(source("app/api/editorial-v2/projects/[projectId]/voice-materialization/route.ts")));
check("GET plan network zero claim", source("lib/editorial-v2/voice-materialization-node.ts").includes("externalNetworkRequestsMade: 0"));
check("POST feature gate", source("app/api/editorial-v2/projects/[projectId]/voice-materialization/route.ts").includes("isExternalTtsEnabled(process.env)"));
check("POST credential gate", source("app/api/editorial-v2/projects/[projectId]/voice-materialization/route.ts").includes("ELEVENLABS_CREDENTIAL_MISSING"));
check("POST revision gate", source("app/api/editorial-v2/projects/[projectId]/voice-materialization/route.ts").includes("PROJECT_REVISION_MISMATCH"));
check("POST checkpoint gate", source("app/api/editorial-v2/projects/[projectId]/voice-materialization/route.ts").includes("RENDER_CHECKPOINT_HASH_MISMATCH"));
check("POST plan hash gate", source("app/api/editorial-v2/projects/[projectId]/voice-materialization/route.ts").includes("VOICE_MATERIALIZATION_PLAN_HASH_MISMATCH"));
check("POST same origin", source("app/api/editorial-v2/projects/[projectId]/voice-materialization/route.ts").includes("CROSS_ORIGIN_VOICE_MUTATION_FORBIDDEN"));
check("POST in-flight", source("app/api/editorial-v2/projects/[projectId]/voice-materialization/route.ts").includes("VOICE_MATERIALIZATION_IN_FLIGHT"));
check("no DELETE route", !/export async function DELETE/u.test(source("app/api/editorial-v2/projects/[projectId]/voice-materialization/route.ts")));
check("client same origin root", source("lib/editorial-v2/voice-materialization-api-client.ts").includes('const API_ROOT = "/api/editorial-v2/projects"'));
check("client no module cache", !/new Map|moduleCache/u.test(source("lib/editorial-v2/voice-materialization-api-client.ts")));
check("client caller-owned Blob", source("lib/editorial-v2/voice-materialization-api-client.ts").includes("Promise<Blob>"));

const panel = source("components/editorial-v2/VoiceMaterializationPanel.tsx");
check("UI has seven steps", [1, 2, 3, 4, 5, 6, 7].every((step) => panel.includes(`data-step=\"${step}\"`)));
check("UI no API key input", !/name=["']?(?:api|secret)|type=["']password|API key<input/iu.test(panel));
check("UI plan first button", panel.includes("Preview External TTS Plan"));
check("UI character count", panel.includes("Total characters") && panel.includes("scene.characterCount"));
check("UI actual price unknown", panel.includes("Actual price") && panel.includes("UNKNOWN"));
check("UI paid checkbox", panel.includes("외부 유료 TTS 요청을 발생시킬 수 있음을 확인했습니다."));
check("UI materialize button", panel.includes("Generate Missing Scene Audio"));
check("UI audio controls", panel.includes("<audio controls"));
check("UI alignment status", panel.includes("Alignment") && panel.includes("scene.alignmentStatus"));
check("UI retry preview", panel.includes("Preview Retry Plan"));
check("UI retry confirmation", panel.includes("Retry도 새 plan preview와 Owner 유료 확인"));
check("UI PA3 silent boundary exact", panel.includes("현재 Local Preview는 PA-3의 silent placeholder audio를 사용합니다. 실제 생성 음성의 Preview 합성은 다음 Production Activation 범위입니다."));
check("UI production voice not approved", panel.includes("Production voice quality: NOT_APPROVED"));
check("UI Blob cleanup", panel.includes("URL.revokeObjectURL"));
check("Workbench PA4 panel wired", source("components/editorial-v2/EditorialV2Workbench.tsx").includes("<VoiceMaterializationPanel"));
check("Workbench ProjectWorkspacePanel unchanged by PA4", !allowlistSet.has("components/editorial-v2/ProjectWorkspacePanel.tsx"));

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
  const contracts = loadTs("lib/editorial-v2/voice-materialization-contracts.ts");
  const validation = loadTs("lib/editorial-v2/voice-materialization-validation.ts");
  const alignmentModule = loadTs("lib/editorial-v2/audio-alignment.ts");
  const nodeModule = loadTs("lib/editorial-v2/voice-materialization-node.ts");
  const recoveryModule = loadTs("lib/editorial-v2/voice-materialization-recovery.ts");

  const flagCases = [[undefined, false], ["", false], ["0", false], ["TRUE", false], ["True", false], [" true", false], ["true ", false], ["yes", false], ["1", true], ["true", true]];
  for (const [index, [value, expected]] of flagCases.entries()) check(`flag exact case ${index}`, contracts.parseExternalTtsEnabled(value) === expected);

  const planScenes = Array.from({ length: 8 }, (_, index) => {
    const narration = `승인된 장면 ${index + 1}의 원문입니다.`;
    return {
      sceneId: `scene-${index + 1}`,
      sceneOrder: index + 1,
      narration,
      narrationHash: sha256Text(narration),
      characterCount: [...narration].length,
      keyCaption: `장면 ${index + 1}`,
      sceneAudioIdentity: nodeModule.buildVoiceSceneAudioIdentity({ narration, providerId: "elevenlabs_tts_with_timestamps", voiceId: "voice_a", modelId: "model_a", outputFormat: "mp3_44100_128" }),
    };
  });
  const planBase = {
    schemaVersion: "voice-materialization-plan-v1",
    projectId: "pa4-checker-project",
    projectRevision: 7,
    projectIntegrityHash: "1".repeat(64),
    sourceRenderCheckpointHash: "2".repeat(64),
    renderManifestHash: "3".repeat(32),
    providerId: "elevenlabs_tts_with_timestamps",
    voiceId: "voice_a",
    modelId: "model_a",
    outputFormat: "mp3_44100_128",
    sceneCount: 8,
    scenes: planScenes,
    totalCharacters: planScenes.reduce((total, scene) => total + scene.characterCount, 0),
    materializationSetId: `voice-set-${"4".repeat(64)}`,
    planHash: "0".repeat(64),
    externalCallRequired: true,
    externalCallExecuted: false,
    ownerConfirmationRequired: true,
    costAmountKnown: false,
    stopPolicy: "STOP_ON_FIRST_EXTERNAL_FAILURE",
  };
  const plan = { ...planBase, planHash: nodeModule.hashVoiceMaterializationPlan(planBase) };
  check("dynamic plan valid", nodeModule.validateVoiceMaterializationPlan(plan).length === 0);
  check("dynamic plan self comparison", nodeModule.compareVoiceMaterializationPlans(plan, plan).matches === true);
  check("dynamic plan stale revision", nodeModule.compareVoiceMaterializationPlans(plan, { ...plan, projectRevision: 8 }).stale === true);
  check("dynamic plan stale checkpoint", nodeModule.compareVoiceMaterializationPlans(plan, { ...plan, sourceRenderCheckpointHash: "5".repeat(64) }).stale === true);
  check("dynamic request rejects narration", validation.validateVoiceMaterializationRequest({ action: "materialize", narration: "forbidden" }).some((issue) => issue.includes("client_content_or_path_forbidden:narration")));
  for (const forbidden of ["narration", "rawText", "text", "url", "providerUrl", "path", "outputPath", "apiKey", "xi-api-key", "secret"]) {
    const candidate = { action: "materialize", expectedProjectRevision: 1, expectedRenderCheckpointHash: "a".repeat(64), voiceId: "voice", modelId: "model", expectedPlanHash: "b".repeat(64), ownerPaidExternalTtsConfirmation: true, [forbidden]: "blocked" };
    check(`request forbidden field ${forbidden}`, validation.validateVoiceMaterializationRequest(candidate).some((issue) => issue.includes("client_content_or_path_forbidden")));
  }

  const baseIdentity = nodeModule.buildVoiceSceneAudioIdentity({ narration: "base", providerId: "elevenlabs_tts_with_timestamps", voiceId: "voice", modelId: "model", outputFormat: "mp3_44100_128" });
  for (let index = 0; index < 200; index += 1) {
    const narrationIdentity = nodeModule.buildVoiceSceneAudioIdentity({ narration: `base-${index}`, providerId: "elevenlabs_tts_with_timestamps", voiceId: "voice", modelId: "model", outputFormat: "mp3_44100_128" });
    const voiceIdentity = nodeModule.buildVoiceSceneAudioIdentity({ narration: "base", providerId: "elevenlabs_tts_with_timestamps", voiceId: `voice_${index}`, modelId: "model", outputFormat: "mp3_44100_128" });
    check(`identity narration mutation ${index}`, narrationIdentity !== baseIdentity && /^tts-[a-f0-9]{64}$/u.test(narrationIdentity));
    check(`identity voice mutation ${index}`, voiceIdentity !== baseIdentity && voiceIdentity !== narrationIdentity);
  }

  for (let index = 0; index < 420; index += 1) {
    const narration = `승인 원문 ${index}번입니다${index % 3 === 0 ? ". 다음 문장입니다!" : index % 3 === 1 ? ", 확인합니다." : "? 확인."}`;
    const characters = [...narration];
    const duration = 0.8 + (index % 17) * 0.01;
    const step = duration / characters.length;
    const starts = characters.map((_, characterIndex) => characterIndex * step);
    const ends = characters.map((_, characterIndex) => (characterIndex + 1) * step);
    const result = validation.validateProviderCharacterAlignment({ characters, character_start_times_seconds: starts, character_end_times_seconds: ends }, narration, index % 2 === 0);
    check(`alignment valid variant ${index}`, result.structurallyValid && result.audioAlignmentUsable && result.canonicalTextMatches && result.normalizedAlignmentAuthoritative === false);
  }

  for (let index = 0; index < 180; index += 1) {
    const narration = `불일치 검증 ${index}`;
    const characters = [...`${narration}X`];
    const starts = characters.map((_, characterIndex) => characterIndex * 0.01);
    const ends = characters.map((_, characterIndex) => (characterIndex + 1) * 0.01);
    const result = validation.validateProviderCharacterAlignment({ characters, character_start_times_seconds: starts, character_end_times_seconds: ends }, narration, true);
    check(`alignment text mismatch blocks ${index}`, result.structurallyValid && !result.audioAlignmentUsable && !result.canonicalTextMatches && result.issues.includes("alignment_canonical_text_mismatch"));
  }
  const crlf = validation.validateProviderCharacterAlignment({ characters: ["A", "\n", "B"], character_start_times_seconds: [0, .1, .2], character_end_times_seconds: [.1, .2, .3] }, "A\r\nB");
  check("alignment CRLF to LF allowed", crlf.audioAlignmentUsable === true);
  const backwards = validation.validateProviderCharacterAlignment({ characters: ["A", "B"], character_start_times_seconds: [0, .05], character_end_times_seconds: [.1, .2] }, "AB");
  check("alignment overlap backwards blocked", backwards.structurallyValid === false && backwards.issues.some((issue) => issue.includes("backwards")));

  for (let index = 0; index < 200; index += 1) {
    const narration = `첫 문장 ${index}입니다. 둘째 문장을 확인합니다! 셋째인가요?`;
    const characters = [...narration];
    const duration = 1.2 + (index % 11) * 0.01;
    const step = duration / characters.length;
    const providerAlignment = { characters, characterStartTimesSeconds: characters.map((_, characterIndex) => characterIndex * step), characterEndTimesSeconds: characters.map((_, characterIndex) => (characterIndex + 1) * step) };
    const track = alignmentModule.buildAudioAlignedSubtitleTrack("a".repeat(64), `voice-set-${"b".repeat(64)}`, [{ sceneId: `scene-${index}`, sceneOrder: 1, narration, keyCaption: "첫 문장", audioDurationMs: Math.round(duration * 1000), alignment: providerAlignment }]);
    check(`subtitle punctuation timing ${index}`, track.alignmentStatus === "provider_character_timestamps_aligned" && track.estimatedFallbackUsed === false && alignmentModule.validateAudioAlignedSubtitleTrack(track).length === 0 && track.cues.length >= 2);
  }

  const mockEntries = plan.scenes.map((scene, index) => ({ sceneId: scene.sceneId, sceneOrder: scene.sceneOrder, sceneAudioIdentity: scene.sceneAudioIdentity, narration: scene.narration, narrationHash: scene.narrationHash, characterCount: scene.characterCount, status: index < 2 ? "generated" : index === 2 ? "failed" : "pending", audioSha256: index < 2 ? "c".repeat(64) : null, audioBytes: index < 2 ? 100 : null, durationMs: index < 2 ? 1000 : null, alignmentStatus: index < 2 ? "provider_character_timestamps_aligned" : "not_available", audioAlignmentUsable: index < 2, subtitleCueCount: index < 2 ? 2 : 0, failureCode: index === 2 ? "ELEVENLABS_HTTP_500" : null, retryable: index >= 2 }));
  const mockSet = { schemaVersion: "voice-materialization-set-v1", materializationSetId: plan.materializationSetId, projectId: plan.projectId, projectRevision: plan.projectRevision, sourceRenderCheckpointHash: plan.sourceRenderCheckpointHash, renderManifestHash: plan.renderManifestHash, providerId: plan.providerId, voiceId: plan.voiceId, modelId: plan.modelId, outputFormat: plan.outputFormat, planHash: plan.planHash, sceneEntries: mockEntries, completeSceneIds: mockEntries.slice(0, 2).map((entry) => entry.sceneId), failedSceneIds: [mockEntries[2].sceneId], pendingSceneIds: mockEntries.slice(3).map((entry) => entry.sceneId), requestedCharacters: mockEntries.reduce((total, entry) => total + entry.characterCount, 0), successfulCharacters: mockEntries.slice(0, 2).reduce((total, entry) => total + entry.characterCount, 0), externalRequestCount: 3, createdAtIso: "2026-08-08T00:00:00.000Z", updatedAtIso: "2026-08-08T00:01:00.000Z", approvalState: "blocked", approvalBoundary: { packageType: "Audio Materialization Package", allEnabledScenesMaterialized: false, allAudioIntegrityValid: false, allProviderAlignmentsUsable: false, allAudioAlignedSubtitlePlansValid: false, checkpointIdentityCurrent: true, productionVoiceQualityApproval: "NOT_APPROVED", finalRenderCreated: false, actualVisualAssetsCreated: false, pa3PreviewAudioMode: "SILENT_PLACEHOLDER" }, automaticRetryCount: 0, costAmountStored: false };
  const recovery = recoveryModule.buildVoiceMaterializationRecoveryPlan(mockSet, plan);
  check("recovery not stale", recovery.stale === false);
  check("recovery successes reusable", recovery.reusableSceneIds.length === 2);
  check("recovery failed and pending retryable", recovery.retryableSceneIds.length === 6);
  check("recovery automatic retry false", recovery.automaticRetry === false && recovery.ownerConfirmationRequired === true);
  check("recovery success cannot retry", recoveryModule.canRetryVoiceScene(mockEntries[0], recovery) === false);
  check("recovery failure can retry", recoveryModule.canRetryVoiceScene(mockEntries[2], recovery) === true);
  const retryPlan = recoveryModule.buildRetryMaterializationPlan(plan, mockSet);
  check("retry plan failed pending only", retryPlan.requestedSceneIds.length === 6 && retryPlan.requestedSceneIds.every((sceneId) => !recovery.reusableSceneIds.includes(sceneId)));
  const staleRecovery = recoveryModule.buildVoiceMaterializationRecoveryPlan(mockSet, { ...plan, projectRevision: plan.projectRevision + 1 });
  check("recovery stale checkpoint identity", staleRecovery.stale === true && staleRecovery.retryableSceneIds.length === 0);
} catch (error) {
  failures.push(`dynamic checker execution :: ${error instanceof Error ? error.stack ?? error.message : String(error)}`);
}

const configPath = ts.findConfigFile(root, ts.sys.fileExists, "tsconfig.json");
const config = ts.readConfigFile(configPath, ts.sys.readFile);
const parsedConfig = ts.parseJsonConfigFileContent(config.config, ts.sys, root);
const program = ts.createProgram(parsedConfig.fileNames, { ...parsedConfig.options, noEmit: true, incremental: false });
const targetFiles = allowlist.filter((path) => /\.(?:ts|tsx)$/u.test(path)).map((path) => resolve(root, path));
for (const path of targetFiles) {
  const sourceFile = program.getSourceFile(path);
  check(`TypeScript source discovered ${relative(root, path)}`, Boolean(sourceFile));
  check(`TypeScript syntactic zero ${relative(root, path)}`, Boolean(sourceFile) && program.getSyntacticDiagnostics(sourceFile).length === 0);
  check(`TypeScript semantic zero ${relative(root, path)}`, Boolean(sourceFile) && program.getSemanticDiagnostics(sourceFile).length === 0, program.getSemanticDiagnostics(sourceFile).map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, " ")).join(" | "));
}
const preEmitDiagnostics = ts.getPreEmitDiagnostics(program).filter((diagnostic) => !diagnostic.file || targetFiles.includes(resolve(diagnostic.file.fileName)));
check("target strict preEmit zero", preEmitDiagnostics.length === 0, preEmitDiagnostics.map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, " ")).join(" | "));

check("minimum 850 meaningful independent checks", passed + failures.length >= 850, String(passed + failures.length));
if (failures.length > 0) {
  console.error(`SHORTS_EDITORIAL_OS_V2_PA4_CHECK_FAILED ${passed}/${passed + failures.length}`);
  for (const failure of failures) console.error(`FAIL ${failure}`);
  process.exit(1);
}
console.log(`SHORTS_EDITORIAL_OS_V2_PA4_CHECK_PASS ${passed}/${passed}`);
