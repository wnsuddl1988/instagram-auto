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
const baseline = JSON.parse(readFileSync(resolve(root, "_ai/SHORTS_EDITORIAL_OS_V2_PA4_BASELINE.json"), "utf8"));
const secretSentinel = "PA4_PROBE_SECRET_SENTINEL_MUST_NEVER_PERSIST";
const statusBefore = repositoryStatus();
const invariantPaths = statusPaths(statusBefore);
const hashesBefore = Object.fromEntries(invariantPaths.map((path) => [path, sha256File(resolve(root, path))]));
const originalFetch = globalThis.fetch;
let temporaryDirectory = "";
let probeError = null;
let summary = null;
let actualNetworkRequestCount = 0;

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
      researchCutoffDate: "2026-08-08",
      researchWindow: "7d",
      domain: "생활경제",
      audience: "일반 성인",
      targetDurationSeconds: 30,
      briefTitle: "PA4 external voice synthetic trend",
      executiveSummary: "외부 network 없는 audio materialization 검증 전용 synthetic summary",
      sources: [
        { sourceId: "src-1", publisher: "Synthetic A", title: "Synthetic A", url: "source://synthetic-a", publishedAt: "2026-08-08T00:00:00Z", eventDate: null },
        { sourceId: "src-2", publisher: "Synthetic B", title: "Synthetic B", url: "source://synthetic-b", publishedAt: "2026-08-07T00:00:00Z", eventDate: null },
        { sourceId: "src-3", publisher: "Synthetic C", title: "Synthetic C", url: "source://synthetic-c", publishedAt: "2026-08-06T00:00:00Z", eventDate: null },
      ],
      signals: [
        { signalId: "sig-1", headline: "h-one", claim: "c-one", whyNow: "w-one", audienceImpact: "i-one", sourceRefs: ["src-1"], numbers: [] },
        { signalId: "sig-2", headline: "h-two", claim: "c-two", whyNow: "w-two", audienceImpact: "i-two", sourceRefs: ["src-2"], numbers: [] },
        { signalId: "sig-3", headline: "h-three", claim: "c-three", whyNow: "w-three", audienceImpact: "i-three", sourceRefs: ["src-3"], numbers: [] },
      ],
    },
    rawHash: "pa4-trend-raw-hash",
    normalizedHash: "pa4-trend-normalized-hash",
    expectedInput: { projectId: "pa4-probe-session", researchCutoffDate: "2026-08-08", researchWindow: "7d", domain: "생활경제", audience: "일반 성인", targetDurationSeconds: 30, additionalFocus: "" },
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
        beatId: `pa4-probe-beat-${index + 1}`,
        beatType,
        purpose: "승인된 출처와 원문 narration authority를 확인하는 synthetic 단계",
        narration: `승인된 ${sceneLabels[index]} 장면 원문입니다. 출처와 기준일을 확인합니다.`,
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
        unit: "index",
        currency: null,
        asOf: "2026-08-08",
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
  const voicePlan = voiceModule.buildVoiceRequestPlan(planning, { mode: "plan_only", locale: "ko-KR", voiceIdentity: "pa4-pre-materialization-placeholder", targetDurationSeconds: 12 });
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
  temporaryDirectory = mkdtempSync(join(tmpdir(), "shorts-editorial-v2-pa4-"));
  const roots = loadTs("lib/editorial-v2/persistence-data-root.ts");
  const store = loadTs("lib/editorial-v2/project-store-node.ts");
  const nodeModule = loadTs("lib/editorial-v2/voice-materialization-node.ts");
  const audioStore = loadTs("lib/editorial-v2/voice-audio-store-node.ts");
  const recoveryModule = loadTs("lib/editorial-v2/voice-materialization-recovery.ts");
  const validationModule = loadTs("lib/editorial-v2/voice-materialization-validation.ts");
  const configuration = roots.resolveEditorialV2LocalStoreConfiguration({
    env: { SHORTS_EDITORIAL_OS_V2_LOCAL_PERSISTENCE_ENABLED: "1", SHORTS_EDITORIAL_OS_V2_DATA_ROOT: temporaryDirectory },
    repositoryRoot: root,
    workingDirectory: root,
    syntheticProbe: true,
  });
  const chain = buildApprovedChain();
  const created = await store.createProject(configuration, { displayName: "PA4 Audio Materialization Probe", creationTimestampIso: "2026-08-08T20:40:00.000Z" });
  assert(created.ok && created.projectId, `project create failed: ${created.message}`);
  const projectId = created.projectId;
  const checkpoints = [
    ["trend_brief_import", buildTrendSnapshot(), "pa4-probe-trend"],
    ["editorial_intelligence", chain.script, "pa4-probe-script"],
    ["scene_planning", chain.planning, "pa4-probe-planning"],
    ["character_motion", chain.character, "pa4-probe-character"],
    ["render_integration", chain.render, "pa4-probe-render"],
  ];
  for (const [index, [stageId, payload, sourceIdentity]] of checkpoints.entries()) {
    const written = await store.writeProjectCheckpoint(configuration, projectId, { ownerConfirmed: true, checkpoint: { stageId, approvedAtIso: `2026-08-08T20:${String(41 + index).padStart(2, "0")}:00.000Z`, sourceIdentity, payload }, rawArtifacts: [] });
    assert(written.ok && written.revision === index + 1, `checkpoint ${stageId} failed: ${written.message}`);
  }
  const persisted = await store.readProject(configuration, projectId);
  assert(persisted.ok && persisted.snapshot?.revision === 5, "canonical persisted project unavailable");
  const project = persisted.snapshot;
  const mp3Path = join(temporaryDirectory, "synthetic-provider-audio.mp3");
  makeSyntheticMp3(mp3Path);
  const mp3Bytes = readFileSync(mp3Path);
  const probe = await nodeModule.probeVoiceAudioFile(mp3Path);
  assert(probe.audioStreamPresent && !probe.videoStreamPresent && probe.durationMs > 0 && ["mp3", "mp3float"].includes(probe.codecName), `synthetic mp3 probe invalid: ${JSON.stringify(probe)}`);

  globalThis.fetch = async () => {
    actualNetworkRequestCount += 1;
    throw new Error("ACTUAL_NETWORK_FORBIDDEN_IN_PA4_PROBE");
  };
  let fakeProviderRequestCount = 0;
  let failAtRequest = null;
  const fakeFetch = async (url, init) => {
    fakeProviderRequestCount += 1;
    assert(typeof url === "string" && url.startsWith("https://api.elevenlabs.io/v1/text-to-speech/") && url.endsWith("/with-timestamps?output_format=mp3_44100_128"), `provider URL invalid: ${url}`);
    assert(init?.method === "POST" && init.redirect === "error", "provider method/redirect invalid");
    assert(init?.headers?.["xi-api-key"] === secretSentinel, "provider credential header not server supplied");
    assert(init?.headers?.["content-type"] === "application/json", "provider content type invalid");
    const body = JSON.parse(init.body);
    assert(typeof body.text === "string" && body.text.length > 0 && body.model_id === "probe_model", "provider canonical text/model body invalid");
    if (failAtRequest !== null && fakeProviderRequestCount === failAtRequest) {
      return new Response(JSON.stringify({ error: "synthetic provider failure" }), { status: 500, headers: { "content-type": "application/json" } });
    }
    const characters = [...body.text];
    const durationSeconds = probe.durationMs / 1_000;
    const step = durationSeconds / characters.length;
    const alignment = {
      characters,
      character_start_times_seconds: characters.map((_, index) => index * step),
      character_end_times_seconds: characters.map((_, index) => (index + 1) * step),
    };
    return new Response(JSON.stringify({ audio_base64: mp3Bytes.toString("base64"), alignment, normalized_alignment: alignment }), { status: 200, headers: { "content-type": "application/json" } });
  };

  const plan = nodeModule.buildVoiceMaterializationPlan(project, { voiceId: "probe_voice_main", modelId: "probe_model" });
  assert(plan.sceneCount === 8 && plan.totalCharacters === plan.scenes.reduce((total, scene) => total + scene.characterCount, 0), "deterministic materialization plan invalid");
  assert(nodeModule.validateVoiceMaterializationPlan(plan).length === 0 && nodeModule.hashVoiceMaterializationPlan(plan) === plan.planHash, "plan validation/hash invalid");
  const planPreview = await nodeModule.buildVoiceMaterializationPlanPreview(configuration, plan, { featureEnabled: true, credentialConfigured: true });
  assert(planPreview.externalNetworkRequestsMade === 0 && planPreview.maximumExternalRequests === 8 && planPreview.actualPrice === "UNKNOWN", "plan preview paid-call boundary invalid");
  const full = await nodeModule.materializeVoiceMaterializationPlan(plan, { configuration, apiKey: secretSentinel, fetchImpl: fakeFetch, mode: "initial", now: () => "2026-08-08T20:50:00.000Z" });
  assert(full.ok && full.set.approvalState === "approved" && full.externalRequestsThisRun === 8 && !full.stoppedOnFirstFailure, `full materialization invalid: ${JSON.stringify(full)}`);
  assert(full.set.sceneEntries.every((entry) => entry.status === "generated" && entry.audioAlignmentUsable && entry.subtitleCueCount > 0 && entry.durationMs === probe.durationMs), "generated scene metadata invalid");
  assert(validationModule.validateVoiceMaterializationSet(full.set).length === 0, "generated set validation failed");
  assert(full.set.approvalBoundary.productionVoiceQualityApproval === "NOT_APPROVED" && full.set.approvalBoundary.pa3PreviewAudioMode === "SILENT_PLACEHOLDER", "production boundary claim invalid");

  const setPath = join(temporaryDirectory, "projects", projectId, "audio", "tts", "sets", `${plan.materializationSetId}.json`);
  assert(resolve(setPath).startsWith(resolve(temporaryDirectory)), "probe set cleanup path escaped temp root");
  rmSync(setPath, { force: true });
  const requestsBeforeCache = fakeProviderRequestCount;
  const cached = await nodeModule.materializeVoiceMaterializationPlan(plan, { configuration, apiKey: secretSentinel, fetchImpl: fakeFetch, mode: "initial", now: () => "2026-08-08T20:51:00.000Z" });
  assert(cached.ok && cached.externalRequestsThisRun === 0 && cached.set.sceneEntries.every((entry) => entry.status === "cache_hit"), "content-addressed cache reuse failed");
  assert(fakeProviderRequestCount === requestsBeforeCache, "cache reuse invoked provider");

  const partialPlan = nodeModule.buildVoiceMaterializationPlan(project, { voiceId: "probe_voice_partial", modelId: "probe_model" });
  const partialStart = fakeProviderRequestCount;
  failAtRequest = partialStart + 3;
  const partial = await nodeModule.materializeVoiceMaterializationPlan(partialPlan, { configuration, apiKey: secretSentinel, fetchImpl: fakeFetch, mode: "initial", now: () => "2026-08-08T20:52:00.000Z" });
  assert(!partial.ok && partial.stoppedOnFirstFailure && partial.externalRequestsThisRun === 3, "stop-on-first external failure accounting invalid");
  assert(partial.set.completeSceneIds.length === 2 && partial.set.failedSceneIds.length === 1 && partial.set.pendingSceneIds.length === 5, `partial status invalid: ${JSON.stringify(partial.set)}`);
  assert(partial.set.sceneEntries[2].failureCode === "ELEVENLABS_HTTP_500", "provider failure was not sanitized/persisted");
  const recovery = recoveryModule.buildVoiceMaterializationRecoveryPlan(partial.set, partialPlan);
  assert(!recovery.stale && recovery.reusableSceneIds.length === 2 && recovery.retryableSceneIds.length === 6 && recovery.automaticRetry === false && recovery.ownerConfirmationRequired === true, "recovery plan invalid");
  assert(!recoveryModule.canRetryVoiceScene(partial.set.sceneEntries[0], recovery) && recoveryModule.canRetryVoiceScene(partial.set.sceneEntries[2], recovery), "failed-only retry gate invalid");
  const retryPlan = recoveryModule.buildRetryMaterializationPlan(partialPlan, partial.set);
  assert(retryPlan.requestedSceneIds.length === 6 && retryPlan.maximumExternalRequests === 6 && retryPlan.automaticRetry === false, "retry materialization plan invalid");
  failAtRequest = null;
  const retry = await nodeModule.materializeVoiceMaterializationPlan(partialPlan, { configuration, apiKey: secretSentinel, fetchImpl: fakeFetch, mode: "retry", requestedSceneIds: retryPlan.requestedSceneIds, now: () => "2026-08-08T20:53:00.000Z" });
  assert(retry.ok && retry.externalRequestsThisRun === 6 && retry.set.approvalState === "approved" && retry.set.sceneEntries.slice(0, 2).every((entry) => entry.status === "generated"), "failed/pending-only retry did not complete");

  const baseScene = plan.scenes[0];
  const narrationChanged = nodeModule.buildVoiceSceneAudioIdentity({ narration: `${baseScene.narration} 변경`, providerId: plan.providerId, voiceId: plan.voiceId, modelId: plan.modelId, outputFormat: plan.outputFormat });
  const voiceChanged = nodeModule.buildVoiceSceneAudioIdentity({ narration: baseScene.narration, providerId: plan.providerId, voiceId: "probe_voice_changed", modelId: plan.modelId, outputFormat: plan.outputFormat });
  assert(narrationChanged !== baseScene.sceneAudioIdentity && voiceChanged !== baseScene.sceneAudioIdentity && narrationChanged !== voiceChanged, "narration/voice identity mutation did not cause cache miss");
  const staleCheckpointPlan = { ...partialPlan, projectRevision: partialPlan.projectRevision + 1, sourceRenderCheckpointHash: "f".repeat(64) };
  const staleRecovery = recoveryModule.buildVoiceMaterializationRecoveryPlan(partial.set, staleCheckpointPlan);
  assert(staleRecovery.stale && staleRecovery.retryableSceneIds.length === 0 && staleRecovery.staleReasons.includes("render_checkpoint_changed"), "checkpoint mutation did not stale old set");

  for (const scene of full.set.sceneEntries) {
    const descriptor = await audioStore.readVoiceSceneAudioDescriptor(configuration, projectId, scene.sceneAudioIdentity);
    const bytes = await audioStore.readVoiceSceneAudioBytes(descriptor);
    assert(bytes.byteLength === scene.audioBytes && !JSON.stringify(scene).includes(temporaryDirectory), "scene audio public metadata leaked an absolute path");
  }
  const persistedSetText = readFileSync(join(temporaryDirectory, "projects", projectId, "audio", "tts", "sets", `${partialPlan.materializationSetId}.json`), "utf8");
  assert(!persistedSetText.includes(secretSentinel) && !JSON.stringify(partial).includes(secretSentinel) && !JSON.stringify(retry).includes(secretSentinel), "secret sentinel leaked to metadata/result");
  assert(actualNetworkRequestCount === 0, "actual network request occurred");
  assert(fakeProviderRequestCount === 8 + 3 + 6, `provider request count invalid: ${fakeProviderRequestCount}`);
  summary = {
    projectId,
    scenes: plan.sceneCount,
    fullExternalRequests: full.externalRequestsThisRun,
    cacheExternalRequests: cached.externalRequestsThisRun,
    partialExternalRequests: partial.externalRequestsThisRun,
    retryExternalRequests: retry.externalRequestsThisRun,
    actualNetworkRequestCount,
    ffprobe: probe,
    finalApproval: retry.set.approvalState,
    productionVoiceQualityApproval: retry.set.approvalBoundary.productionVoiceQualityApproval,
    pa3PreviewAudioMode: retry.set.approvalBoundary.pa3PreviewAudioMode,
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
  console.error("SHORTS_EDITORIAL_OS_V2_PA4_AUDIO_MATERIALIZATION_PROOF_FAILED");
  console.error(JSON.stringify({ error: probeError instanceof Error ? probeError.message : probeError, repositoryUnchanged, temporaryDirectoryRemoved, actualNetworkRequestCount, summary }, null, 2));
  process.exit(1);
}
console.log("SHORTS_EDITORIAL_OS_V2_PA4_AUDIO_MATERIALIZATION_PROOF_PASS");
console.log(JSON.stringify({ ...summary, repositoryUnchanged, temporaryDirectoryRemoved, baselineHead: baseline.git.head }, null, 2));
