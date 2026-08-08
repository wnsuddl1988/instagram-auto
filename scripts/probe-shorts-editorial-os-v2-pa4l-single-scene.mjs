import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const baseline = JSON.parse(readFileSync(resolve(root, "_ai/SHORTS_EDITORIAL_OS_V2_PA4L_SINGLE_SCENE_GUARD_BASELINE.json"), "utf8"));
const secretSentinel = "PA4L_PROBE_SECRET_SENTINEL_MUST_NEVER_PERSIST";
const originalFetch = globalThis.fetch;
const statusBefore = repositoryStatus();
const invariantPaths = statusPaths(statusBefore);
const hashesBefore = Object.fromEntries(invariantPaths.map((path) => [path, sha256File(resolve(root, path))]));
let temporaryDirectory = "";
let actualNetworkRequestCount = 0;
let probeError = null;
let summary = null;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function repositoryStatus() {
  const result = spawnSync("git", ["status", "--porcelain=v1", "-z", "--untracked-files=all"], { cwd: root, encoding: "utf8", windowsHide: true, maxBuffer: 64 * 1024 * 1024 });
  if (result.status !== 0 || result.error) throw new Error(result.stderr || result.error?.message || "git status failed");
  return result.stdout;
}

function statusPaths(raw) {
  return raw.split("\0").filter(Boolean).map((entry) => entry.slice(3).replaceAll("\\", "/"));
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
  const output = ts.transpileModule(readFileSync(absolute, "utf8"), { fileName: absolute, compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  const localRequire = (specifier) => specifier.startsWith(".") ? loadTs(resolveTs(absolute, specifier)) : require(specifier);
  new Function("require", "module", "exports", "__filename", "__dirname", output)(localRequire, record, record.exports, absolute, dirname(absolute));
  return record.exports;
}

function buildTrendSnapshot() {
  return {
    candidate: {
      schemaVersion: "trend-brief-import-v1",
      researchCutoffDate: "2026-08-09",
      researchWindow: "7d",
      domain: "생활경제",
      audience: "일반 성인",
      targetDurationSeconds: 30,
      briefTitle: "PA4L single-scene synthetic trend",
      executiveSummary: "외부 network 없는 PA4L single-scene guard 검증 전용 synthetic summary",
      sources: [
        { sourceId: "src-1", publisher: "Synthetic A", title: "Synthetic A", url: "source://synthetic-a", publishedAt: "2026-08-09T00:00:00Z", eventDate: null },
        { sourceId: "src-2", publisher: "Synthetic B", title: "Synthetic B", url: "source://synthetic-b", publishedAt: "2026-08-08T00:00:00Z", eventDate: null },
        { sourceId: "src-3", publisher: "Synthetic C", title: "Synthetic C", url: "source://synthetic-c", publishedAt: "2026-08-07T00:00:00Z", eventDate: null },
      ],
      signals: [
        { signalId: "sig-1", headline: "h-one", claim: "c-one", whyNow: "w-one", audienceImpact: "i-one", sourceRefs: ["src-1"], numbers: [] },
        { signalId: "sig-2", headline: "h-two", claim: "c-two", whyNow: "w-two", audienceImpact: "i-two", sourceRefs: ["src-2"], numbers: [] },
        { signalId: "sig-3", headline: "h-three", claim: "c-three", whyNow: "w-three", audienceImpact: "i-three", sourceRefs: ["src-3"], numbers: [] },
      ],
    },
    rawHash: "pa4l-trend-raw-hash",
    normalizedHash: "pa4l-trend-normalized-hash",
    expectedInput: { projectId: "pa4l-probe-session", researchCutoffDate: "2026-08-09", researchWindow: "7d", domain: "생활경제", audience: "일반 성인", targetDurationSeconds: 30, additionalFocus: "" },
    validationSummary: { valid: true, blockingIssueCount: 0, warningCount: 0, issues: [] },
    approvalState: "approved",
  };
}

function buildApprovedChain() {
  const fixtureModule = loadTs("lib/editorial-v2/publish-fixture.ts");
  const sceneCardsModule = loadTs("lib/editorial-v2/scene-cards.ts");
  const sceneValidationModule = loadTs("lib/editorial-v2/scene-card-validation.ts");
  const visualModule = loadTs("lib/editorial-v2/visual-planning.ts");
  const characterPlanner = loadTs("lib/editorial-v2/character-motion-planner.ts");
  const voiceModule = loadTs("lib/editorial-v2/voice-planning.ts");
  const subtitleModule = loadTs("lib/editorial-v2/subtitle-planning.ts");
  const manifestModule = loadTs("lib/editorial-v2/render-manifest.ts");
  const renderValidationModule = loadTs("lib/editorial-v2/render-validation.ts");
  const bridgeModule = loadTs("lib/editorial-v2/renderer-bridge.ts");
  const baseRender = fixtureModule.buildSyntheticPublishFixture().approvedRenderIntegration;
  const beatTypes = ["anomaly_or_problem", "common_interpretation_crack", "evidence_and_number", "hidden_cause_or_connection", "audience_life_impact", "misread_correction", "practical_check_or_action", "next_signal_to_watch"];
  const sceneLabels = ["첫", "둘째", "셋째", "넷째", "다섯째", "여섯째", "일곱째", "여덟째"];
  const script = {
    ...baseRender.sourceDetailedScriptSnapshot,
    approvedScript: {
      ...baseRender.sourceDetailedScriptSnapshot.approvedScript,
      beats: beatTypes.map((beatType, index) => ({
        ...baseRender.sourceDetailedScriptSnapshot.approvedScript.beats[0],
        beatId: `pa4l-probe-beat-${index + 1}`,
        beatType,
        purpose: "승인된 출처와 canonical narration authority를 확인하는 synthetic 단계",
        narration: index === 2
          ? "기준일에 확인된 42원이라는 숫자를 출처와 함께 검증하는 승인된 셋째 장면 원문입니다."
          : `승인된 ${sceneLabels[index]} 장면의 canonical 한국어 원문입니다. 출처와 기준일을 확인하고 생활경제 영향을 설명합니다.`,
        keyCaption: `승인 ${sceneLabels[index]} 장면`,
        numberRefs: index === 2 ? ["synthetic-number-01"] : [],
        retentionDevice: "synthetic canonical narration check",
      })),
    },
    evidencePack: {
      ...baseRender.sourceDetailedScriptSnapshot.evidencePack,
      numbers: [{
        numberId: "synthetic-number-01",
        signalId: "synthetic-signal-01",
        value: 42,
        unit: "원",
        currency: "KRW",
        asOf: "2026-08-09",
        context: "Synthetic approved number",
        sourceRefs: ["synthetic-source-01"],
      }],
      coverage: {
        ...baseRender.sourceDetailedScriptSnapshot.evidencePack.coverage,
        numberCount: 1,
        signalCoverage: baseRender.sourceDetailedScriptSnapshot.evidencePack.coverage.signalCoverage.map((entry) => ({ ...entry, numberCount: 1 })),
      },
    },
  };
  const sceneCards = sceneCardsModule.buildSceneCardDrafts(script);
  const sceneValidation = sceneValidationModule.validateSceneCardDrafts(sceneCards, script);
  const visualPlan = visualModule.buildVisualAssetPlan(sceneCards, script);
  const visualProof = visualModule.validateVisualAssetPlan(visualPlan, sceneCards, script);
  assert(sceneValidation.valid && visualProof.valid, `planning fixture invalid: ${JSON.stringify({ sceneValidation, visualProof })}`);
  const planning = {
    approvedScriptIdentity: script.scriptNormalizedHash,
    approvedScriptRawHash: script.scriptRawHash,
    approvedScriptNormalizedHash: script.scriptNormalizedHash,
    evidenceIdentity: script.evidenceIdentity,
    selectedAngleId: script.selectedAngle.selectedAngleId,
    sceneCards,
    sceneValidation,
    visualPlan,
    visualProof,
    approvalState: "approved",
  };
  const motionPlan = characterPlanner.buildCharacterMotionPlan(planning, "loop_signal_navigator");
  const character = {
    ...baseRender.sourceCharacterSnapshot,
    selectedDirectionId: "loop_signal_navigator",
    sceneMotionAssignments: motionPlan.assignments,
    reducedMotionAssignments: motionPlan.reducedMotionAssignments,
    sourcePlanningIdentity: motionPlan.sourcePlanningIdentity,
  };
  const voicePlan = voiceModule.buildVoiceRequestPlan(planning, { mode: "plan_only", locale: "ko-KR", voiceIdentity: "pa4l-pre-materialization-placeholder", targetDurationSeconds: 12 });
  const voiceValidation = voiceModule.summarizeVoicePlanValidation(voiceModule.validateVoiceRequestPlan(voicePlan));
  const subtitleTrack = subtitleModule.buildSubtitleTrackPlan(planning, 12, "ko-KR");
  const subtitleValidation = subtitleModule.summarizeSubtitleValidation(subtitleModule.validateSubtitleTrackPlan(subtitleTrack, planning));
  assert(voiceValidation.valid && subtitleValidation.valid, `voice/subtitle fixture invalid: ${JSON.stringify({ voiceValidation, subtitleValidation })}`);
  const renderManifest = manifestModule.buildRenderManifest({ approvedPlanning: planning, approvedCharacterMotion: character, voicePlan, subtitleTrack, profileId: "preview_540x960" });
  const validation = renderValidationModule.summarizeRenderManifestValidation(renderValidationModule.validateRenderManifest(renderManifest, { approvedPlanning: planning, approvedCharacterMotion: character, voiceValidation, subtitleValidation }));
  assert(validation.valid, `render fixture invalid: ${JSON.stringify(validation)}`);
  const render = {
    sourceDetailedScriptSnapshot: script,
    sourceCharacterSnapshot: character,
    voicePlan,
    subtitleTrack,
    renderManifest,
    validation,
    bridgePlan: bridgeModule.buildRendererBridgePlan(renderManifest),
    approvalState: "approved",
    sessionOnly: true,
    ttsConnected: false,
    audioCreated: false,
    renderExecuted: false,
    productionReady: false,
  };
  return { script, planning, character, render };
}

function makeSyntheticMp3(path) {
  const result = spawnSync("ffmpeg", ["-hide_banner", "-loglevel", "error", "-y", "-f", "lavfi", "-i", "sine=frequency=440:duration=1", "-ac", "1", "-ar", "44100", "-b:a", "128k", "-f", "mp3", path], { cwd: dirname(path), encoding: "utf8", windowsHide: true, timeout: 30_000, maxBuffer: 4 * 1024 * 1024 });
  if (result.status !== 0 || result.error) throw new Error(result.stderr || result.error?.message || "synthetic ffmpeg mp3 failed");
}

try {
  temporaryDirectory = mkdtempSync(join(tmpdir(), "shorts-editorial-v2-pa4l-"));
  globalThis.fetch = async () => {
    actualNetworkRequestCount += 1;
    throw new Error("ACTUAL_NETWORK_FORBIDDEN_IN_PA4L_PROBE");
  };
  const roots = loadTs("lib/editorial-v2/persistence-data-root.ts");
  const store = loadTs("lib/editorial-v2/project-store-node.ts");
  const voiceNode = loadTs("lib/editorial-v2/voice-materialization-node.ts");
  const validationModule = loadTs("lib/editorial-v2/voice-materialization-validation.ts");
  const contracts = loadTs("lib/editorial-v2/voice-materialization-contracts.ts");
  const configuration = roots.resolveEditorialV2LocalStoreConfiguration({
    env: { SHORTS_EDITORIAL_OS_V2_LOCAL_PERSISTENCE_ENABLED: "1", SHORTS_EDITORIAL_OS_V2_DATA_ROOT: temporaryDirectory },
    repositoryRoot: root,
    workingDirectory: root,
    syntheticProbe: true,
  });
  const chain = buildApprovedChain();
  const created = await store.createProject(configuration, { displayName: "PA4L Single Scene Guard Probe", creationTimestampIso: "2026-08-09T00:10:00.000Z" });
  assert(created.ok && created.projectId, `project create failed: ${created.message}`);
  const projectId = created.projectId;
  const checkpoints = [
    ["trend_brief_import", buildTrendSnapshot(), "pa4l-probe-trend"],
    ["editorial_intelligence", chain.script, "pa4l-probe-script"],
    ["scene_planning", chain.planning, "pa4l-probe-planning"],
    ["character_motion", chain.character, "pa4l-probe-character"],
    ["render_integration", chain.render, "pa4l-probe-render"],
  ];
  for (const [index, [stageId, payload, sourceIdentity]] of checkpoints.entries()) {
    const written = await store.writeProjectCheckpoint(configuration, projectId, { ownerConfirmed: true, checkpoint: { stageId, approvedAtIso: `2026-08-09T00:${String(11 + index).padStart(2, "0")}:00.000Z`, sourceIdentity, payload }, rawArtifacts: [] });
    assert(written.ok && written.revision === index + 1, `checkpoint ${stageId} failed: ${written.message}`);
  }
  const persisted = await store.readProject(configuration, projectId);
  assert(persisted.ok && persisted.snapshot?.revision === 5, "canonical persisted project unavailable");
  const project = persisted.snapshot;
  const mp3Path = join(temporaryDirectory, "synthetic-provider-audio.mp3");
  makeSyntheticMp3(mp3Path);
  const mp3Bytes = readFileSync(mp3Path);
  const audioProbe = await voiceNode.probeVoiceAudioFile(mp3Path);
  assert(audioProbe.audioStreamPresent && !audioProbe.videoStreamPresent && audioProbe.durationMs > 0, "synthetic mp3 invalid");

  let successRequests = 0;
  const successFetch = async (url, init) => {
    successRequests += 1;
    assert(successRequests <= 1, "second success provider request attempted");
    assert(typeof url === "string" && url.startsWith("https://api.elevenlabs.io/v1/text-to-speech/") && url.endsWith("/with-timestamps?output_format=mp3_44100_128"), `provider URL invalid: ${url}`);
    assert(init?.method === "POST" && init.redirect === "error", "provider method/redirect invalid");
    assert(init?.headers?.["xi-api-key"] === secretSentinel, "server credential missing");
    const body = JSON.parse(init.body);
    assert(body.model_id === "eleven_multilingual_v2", "model mismatch");
    const characters = [...body.text];
    const durationSeconds = audioProbe.durationMs / 1_000;
    const step = durationSeconds / characters.length;
    const alignment = { characters, character_start_times_seconds: characters.map((_, index) => index * step), character_end_times_seconds: characters.map((_, index) => (index + 1) * step) };
    return new Response(JSON.stringify({ audio_base64: mp3Bytes.toString("base64"), alignment, normalized_alignment: alignment }), { status: 200, headers: { "content-type": "application/json" } });
  };

  const plan = voiceNode.buildVoiceMaterializationPlan(project, { voiceId: "probe_voice_pa4l", modelId: "eleven_multilingual_v2", executionMode: contracts.PA4L_SINGLE_SCENE_LIVE_SMOKE_MODE });
  const selected = voiceNode.assertPa4lSingleScenePlan(plan);
  const repeated = voiceNode.buildVoiceMaterializationPlan(project, { voiceId: "probe_voice_pa4l", modelId: "eleven_multilingual_v2", executionMode: contracts.PA4L_SINGLE_SCENE_LIVE_SMOKE_MODE });
  assert(plan.sceneCount === 1 && plan.plannedSceneCount === 1 && plan.scenes.length === 1, "selected count not one");
  assert(plan.planHash === repeated.planHash && selected.sceneId === repeated.scenes[0].sceneId, "selection not deterministic");
  assert(selected.characterCount <= 180 && selected.narration === repeated.scenes[0].narration, "canonical narration modified or over cap");
  assert(plan.maximumExternalGenerationRequests === 1 && plan.automaticRetryLimit === 0 && plan.fallbackRequestLimit === 0, "plan limits invalid");
  const preview = await voiceNode.buildVoiceMaterializationPlanPreview(configuration, plan, { featureEnabled: true, credentialConfigured: true });
  assert(preview.externalNetworkRequestsMade === 0 && preview.maximumExternalRequests === 1 && preview.missingSceneIds.length === 1, "missing preview request cap invalid");

  const success = await voiceNode.materializeVoiceMaterializationPlan(plan, { configuration, apiKey: secretSentinel, fetchImpl: successFetch, mode: "initial", executionMode: contracts.PA4L_SINGLE_SCENE_LIVE_SMOKE_MODE, requestedSceneIds: [selected.sceneId], now: () => "2026-08-09T00:20:00.000Z" });
  assert(success.ok && success.externalRequestsThisRun === 1 && successRequests === 1 && !success.stoppedOnFirstFailure, "single success request accounting invalid");
  assert(success.set.sceneEntries.length === 1 && validationModule.validateVoiceMaterializationSet(success.set).length === 0, "single success set invalid");

  const beforeWrongRequest = successRequests;
  let wrongSceneBlocked = false;
  try {
    await voiceNode.materializeVoiceMaterializationPlan(plan, { configuration, apiKey: secretSentinel, fetchImpl: successFetch, mode: "initial", executionMode: contracts.PA4L_SINGLE_SCENE_LIVE_SMOKE_MODE, requestedSceneIds: [selected.sceneId, "attacker-second-scene"] });
  } catch (error) { wrongSceneBlocked = error instanceof Error && error.message === "PA4L_CANONICAL_SCENE_SELECTION_MISMATCH"; }
  assert(wrongSceneBlocked && successRequests === beforeWrongRequest, "second-scene request was not blocked before fetch");

  const standardPlan = voiceNode.buildVoiceMaterializationPlan(project, { voiceId: "probe_voice_pa4l", modelId: "eleven_multilingual_v2" });
  const secondScene = standardPlan.scenes.find((scene) => scene.sceneId !== selected.sceneId);
  const maliciousBase = { ...plan, sceneCount: 2, plannedSceneCount: 2, scenes: [selected, secondScene], totalCharacters: selected.characterCount + secondScene.characterCount, planHash: "0".repeat(64) };
  const maliciousPlan = { ...maliciousBase, planHash: voiceNode.hashVoiceMaterializationPlan(maliciousBase) };
  let maliciousBlocked = false;
  try {
    await voiceNode.materializeVoiceMaterializationPlan(maliciousPlan, { configuration, apiKey: secretSentinel, fetchImpl: successFetch, mode: "initial", executionMode: contracts.PA4L_SINGLE_SCENE_LIVE_SMOKE_MODE, requestedSceneIds: [selected.sceneId] });
  } catch (error) { maliciousBlocked = error instanceof Error && error.message.startsWith("VOICE_MATERIALIZATION_PLAN_INVALID"); }
  assert(maliciousBlocked && successRequests === beforeWrongRequest, "malicious multi-scene plan reached provider");

  const requestBase = { action: "materialize", executionMode: contracts.PA4L_SINGLE_SCENE_LIVE_SMOKE_MODE, expectedProjectRevision: project.revision, expectedRenderCheckpointHash: plan.sourceRenderCheckpointHash, voiceId: plan.voiceId, modelId: plan.modelId, expectedPlanHash: plan.planHash, ownerPaidExternalTtsConfirmation: true, requestedSceneIds: [selected.sceneId] };
  assert(validationModule.validateVoiceMaterializationRequest({ ...requestBase, requestedSceneIds: standardPlan.scenes.map((scene) => scene.sceneId) }).includes("pa4l_requested_scene_exactly_one_required"), "client eight-scene request not blocked");
  assert(validationModule.validateVoiceMaterializationRequest({ ...requestBase, executionMode: contracts.VOICE_MATERIALIZATION_STANDARD_EXECUTION_MODE }).includes("live_full_materialization_not_activated"), "standard full live request not blocked");
  assert(validationModule.validateVoiceMaterializationRequest({ ...requestBase, action: "retry_failed" }).includes("pa4l_retry_not_activated"), "retry request not blocked");

  const setPath = join(temporaryDirectory, "projects", projectId, "audio", "tts", "sets", `${plan.materializationSetId}.json`);
  assert(resolve(setPath).startsWith(resolve(temporaryDirectory)), "cache cleanup path escaped temp root");
  rmSync(setPath, { force: true });
  const cacheRequestsBefore = successRequests;
  const cached = await voiceNode.materializeVoiceMaterializationPlan(plan, { configuration, apiKey: secretSentinel, fetchImpl: successFetch, mode: "initial", executionMode: contracts.PA4L_SINGLE_SCENE_LIVE_SMOKE_MODE, requestedSceneIds: [selected.sceneId], now: () => "2026-08-09T00:21:00.000Z" });
  assert(cached.ok && cached.externalRequestsThisRun === 0 && cached.set.sceneEntries[0].status === "cache_hit", "selected-scene cache hit invalid");
  assert(successRequests === cacheRequestsBefore && cached.set.sceneEntries[0].sceneId === selected.sceneId, "cache hit selected another scene or invoked provider");

  let failureRequests = 0;
  const failureFetch = async () => {
    failureRequests += 1;
    assert(failureRequests <= 1, "failure path attempted second provider request");
    return new Response(JSON.stringify({ error: "synthetic provider failure" }), { status: 500, headers: { "content-type": "application/json" } });
  };
  const failurePlan = voiceNode.buildVoiceMaterializationPlan(project, { voiceId: "probe_voice_pa4l_failure", modelId: "eleven_multilingual_v2", executionMode: contracts.PA4L_SINGLE_SCENE_LIVE_SMOKE_MODE });
  const failed = await voiceNode.materializeVoiceMaterializationPlan(failurePlan, { configuration, apiKey: secretSentinel, fetchImpl: failureFetch, mode: "initial", executionMode: contracts.PA4L_SINGLE_SCENE_LIVE_SMOKE_MODE, requestedSceneIds: [failurePlan.scenes[0].sceneId], now: () => "2026-08-09T00:22:00.000Z" });
  assert(!failed.ok && failed.stoppedOnFirstFailure && failed.externalRequestsThisRun === 1 && failureRequests === 1, "first failure request accounting invalid");
  assert(failed.set.failedSceneIds.length === 1 && failed.set.pendingSceneIds.length === 0 && failed.set.automaticRetryCount === 0, "failure state or retry count invalid");

  const persistedSuccess = readFileSync(join(temporaryDirectory, "projects", projectId, "audio", "tts", "sets", `${plan.materializationSetId}.json`), "utf8");
  const persistedFailure = readFileSync(join(temporaryDirectory, "projects", projectId, "audio", "tts", "sets", `${failurePlan.materializationSetId}.json`), "utf8");
  assert(!persistedSuccess.includes(secretSentinel) && !persistedFailure.includes(secretSentinel) && !JSON.stringify({ success, cached, failed }).includes(secretSentinel), "secret sentinel leaked");
  assert(actualNetworkRequestCount === 0, "actual external network request occurred");
  summary = {
    projectId,
    canonicalSceneCount: standardPlan.sceneCount,
    selectedSceneId: selected.sceneId,
    selectedSceneOrder: selected.sceneOrder,
    selectedCharacters: selected.characterCount,
    maximumExternalRequests: plan.maximumExternalGenerationRequests,
    successFakeRequests: successRequests,
    failureFakeRequests: failureRequests,
    cacheFakeRequests: cached.externalRequestsThisRun,
    automaticRetryCount: failed.set.automaticRetryCount,
    fallbackRequests: plan.fallbackRequestLimit,
    actualExternalNetworkRequests: actualNetworkRequestCount,
    fullLiveMaterializationBlocked: true,
    maliciousMultiSceneBlockedBeforeFetch: maliciousBlocked,
    ffprobeDurationMs: audioProbe.durationMs,
  };
} catch (error) {
  probeError = error;
} finally {
  globalThis.fetch = originalFetch;
  if (temporaryDirectory) rmSync(temporaryDirectory, { recursive: true, force: true });
}

const statusAfter = repositoryStatus();
const hashesAfter = Object.fromEntries(invariantPaths.map((path) => [path, sha256File(resolve(root, path))]));
const repositoryUnchanged = statusBefore === statusAfter && invariantPaths.every((path) => hashesBefore[path] === hashesAfter[path]);
const temporaryDirectoryRemoved = Boolean(temporaryDirectory) && !existsSync(temporaryDirectory);
if (probeError || !repositoryUnchanged || !temporaryDirectoryRemoved || actualNetworkRequestCount !== 0) {
  console.error("SHORTS_EDITORIAL_OS_V2_PA4L_SINGLE_SCENE_GUARD_PROOF_FAILED");
  console.error(JSON.stringify({ error: probeError instanceof Error ? probeError.message : probeError, repositoryUnchanged, temporaryDirectoryRemoved, actualNetworkRequestCount, summary }, null, 2));
  process.exit(1);
}
console.log("SHORTS_EDITORIAL_OS_V2_PA4L_SINGLE_SCENE_GUARD_PROOF_PASS");
console.log(JSON.stringify({ ...summary, repositoryUnchanged, temporaryDirectoryRemoved, baselineHead: baseline.git.head }, null, 2));
