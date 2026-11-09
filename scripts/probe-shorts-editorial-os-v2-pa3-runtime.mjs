import { createHash } from "node:crypto";
import { createServer } from "node:net";
import { existsSync, mkdtempSync, readFileSync, rmSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import { spawn, spawnSync } from "node:child_process";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const { chromium } = require("playwright");
const root = resolve(process.cwd());
const baseline = JSON.parse(readFileSync(resolve(root, "_ai/SHORTS_EDITORIAL_OS_V2_PA3_BASELINE.json"), "utf8"));
const statusBefore = repositoryStatus();
const invariantPaths = [...new Set([
  ...baseline.statusPaths.map((entry) => entry.path),
  ...baseline.pa3Allowlist.map((entry) => entry.path),
  ...baseline.governanceFiles.map((entry) => entry.path),
  ...baseline.inheritedCheckpointManifests.map((entry) => entry.path),
  ...baseline.protectedConfigFiles.map((entry) => entry.path),
])];
const hashesBefore = Object.fromEntries(invariantPaths.map((path) => [path, sha256File(resolve(root, path))]));
let temporaryDirectory = "";
let serverProcess = null;
let browser = null;
let serverOutput = "";
let probeError = null;
let summary = null;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function repositoryStatus() {
  const result = spawnSync("git", ["status", "--porcelain=v1", "-z", "--untracked-files=all"], { cwd: root, encoding: "utf8", windowsHide: true, maxBuffer: 32 * 1024 * 1024 });
  if (result.status !== 0 || result.error) throw new Error(result.stderr || result.error?.message || "git status failed");
  return result.stdout;
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

async function freePort() {
  return new Promise((resolvePort, reject) => {
    const socket = createServer();
    socket.unref();
    socket.once("error", reject);
    socket.listen(0, "127.0.0.1", () => {
      const address = socket.address();
      const port = typeof address === "object" && address ? address.port : 0;
      socket.close((error) => error ? reject(error) : resolvePort(port));
    });
  });
}

async function waitForServer(url) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    if (serverProcess?.exitCode !== null) throw new Error(`Next dev exited early: ${serverOutput.slice(-4_000)}`);
    try {
      const response = await fetch(url, { redirect: "error" });
      if (response.ok) return;
    } catch {}
    await new Promise((resolveWait) => setTimeout(resolveWait, 500));
  }
  throw new Error(`Next dev did not become ready: ${serverOutput.slice(-4_000)}`);
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
      briefTitle: "PA3 local preview synthetic trend",
      executiveSummary: "로컬 preview renderer 검증 전용 synthetic summary",
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
    rawHash: "runtime-trend-raw-hash",
    normalizedHash: "runtime-trend-normalized-hash",
    expectedInput: { projectId: "runtime-session", researchCutoffDate: "2026-08-08", researchWindow: "7d", domain: "생활경제", audience: "일반 성인", targetDurationSeconds: 30, additionalFocus: "" },
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
  const script = {
    ...baseRender.sourceDetailedScriptSnapshot,
    approvedScript: {
      ...baseRender.sourceDetailedScriptSnapshot.approvedScript,
      beats: beatTypes.map((beatType, index) => ({
        ...baseRender.sourceDetailedScriptSnapshot.approvedScript.beats[0],
        beatId: `pa3-runtime-beat-${index + 1}`,
        beatType,
        purpose: "공식 출처와 기준일을 확인하는 synthetic preview 단계",
        narration: "공식 출처와 기준일을 확인하고 승인된 근거만 화면에 표시합니다.",
        keyCaption: "승인된 출처 확인",
        numberRefs: index === 2 ? ["synthetic-number-01"] : [],
        retentionDevice: "synthetic source check",
      })),
    },
    evidencePack: {
      ...baseRender.sourceDetailedScriptSnapshot.evidencePack,
      sources: baseRender.sourceDetailedScriptSnapshot.evidencePack.sources.map((source) => ({
        ...source,
        publisher: "<img src=https://invalid.example/pa3 onerror=alert('x')>",
        title: "</style><script>globalThis.PA3_INJECTED=true</script>",
        url: "javascript:alert('pa3')&<unsafe>",
      })),
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
  assert(sceneValidation.valid && visualProof.valid, `approved planning fixture invalid: ${JSON.stringify({ sceneValidation, visualProof })}`);
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
  const voicePlan = voiceModule.buildVoiceRequestPlan(planning, { mode: "plan_only", locale: "ko-KR", voiceIdentity: "pa3-silent-placeholder", targetDurationSeconds: 12 });
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

function projectSelect(page) {
  return page.locator('section[aria-labelledby="project-workspace-title"] select').first();
}

async function postPreview(origin, projectId, body, extraHeaders = {}) {
  const response = await fetch(`${origin}/api/editorial-v2/projects/${encodeURIComponent(projectId)}/preview-render`, {
    method: "POST",
    headers: { "content-type": "application/json", origin, ...extraHeaders },
    body: JSON.stringify(body),
    redirect: "error",
  });
  return { response, body: await response.json() };
}

try {
  assert(spawnSync("ffmpeg", ["-version"], { cwd: root, windowsHide: true, stdio: "ignore" }).status === 0, "system ffmpeg unavailable");
  assert(spawnSync("ffprobe", ["-version"], { cwd: root, windowsHide: true, stdio: "ignore" }).status === 0, "system ffprobe unavailable");
  temporaryDirectory = mkdtempSync(join(tmpdir(), "shorts-editorial-v2-pa3-runtime-"));
  const resolvedTemp = resolve(temporaryDirectory);
  const tempChild = relative(resolve(tmpdir()), resolvedTemp);
  assert(tempChild && !tempChild.startsWith(".."), "runtime temporary root escaped OS temp");

  const roots = loadTs("lib/editorial-v2/persistence-data-root.ts");
  const store = loadTs("lib/editorial-v2/project-store-node.ts");
  const previewContracts = loadTs("lib/editorial-v2/local-preview-contracts.ts");
  assert(previewContracts.parseLocalPreviewRenderEnabled(undefined) === false, "preview flag default must be off");
  assert(previewContracts.parseLocalPreviewRenderEnabled("TRUE") === false, "preview flag parser must be exact");
  assert(previewContracts.parseLocalPreviewRenderEnabled("1") === true && previewContracts.parseLocalPreviewRenderEnabled("true") === true, "preview flag explicit enable failed");
  const configuration = roots.resolveEditorialV2LocalStoreConfiguration({ env: { SHORTS_EDITORIAL_OS_V2_LOCAL_PERSISTENCE_ENABLED: "1", SHORTS_EDITORIAL_OS_V2_DATA_ROOT: resolvedTemp }, repositoryRoot: root, workingDirectory: root, syntheticProbe: true });
  assert(configuration.enabled && resolve(configuration.dataRoot) === resolvedTemp && configuration.exposeDataRoot === false, "runtime data root mismatch");

  const chain = buildApprovedChain();
  const created = await store.createProject(configuration, { displayName: "PA3 Runtime Local Preview", creationTimestampIso: "2026-08-08T19:45:00.000Z" });
  assert(created.ok && created.projectId, `runtime project create failed: ${created.message}`);
  const projectId = created.projectId;
  const checkpoints = [
    ["trend_brief_import", buildTrendSnapshot(), "pa3-runtime-trend"],
    ["editorial_intelligence", chain.script, "pa3-runtime-script"],
    ["scene_planning", chain.planning, "pa3-runtime-planning"],
    ["character_motion", chain.character, "pa3-runtime-character"],
    ["render_integration", chain.render, "pa3-runtime-render"],
  ];
  let renderCheckpointHash = "";
  for (const [index, [stageId, payload, sourceIdentity]] of checkpoints.entries()) {
    const written = await store.writeProjectCheckpoint(configuration, projectId, { ownerConfirmed: true, checkpoint: { stageId, approvedAtIso: `2026-08-08T19:${String(46 + index).padStart(2, "0")}:00.000Z`, sourceIdentity, payload }, rawArtifacts: [] });
    assert(written.ok && written.revision === index + 1, `runtime checkpoint ${stageId} failed: ${written.message}`);
    if (stageId === "render_integration") renderCheckpointHash = written.checkpointHash ?? "";
  }
  const persisted = await store.readProject(configuration, projectId);
  assert(persisted.ok && persisted.snapshot?.revision === 5, "persisted approved checkpoint chain unavailable");
  renderCheckpointHash = persisted.snapshot.approvedCheckpoints.find((entry) => entry.stageId === "render_integration")?.payloadHash ?? renderCheckpointHash;
  assert(/^[a-f0-9]{64}$/u.test(renderCheckpointHash), "render checkpoint hash missing");

  const port = await freePort();
  assert(Number.isSafeInteger(port) && port > 0, "runtime port unavailable");
  const origin = `http://127.0.0.1:${port}`;
  serverProcess = spawn(process.execPath, [resolve(root, "node_modules/next/dist/bin/next"), "dev", "-H", "127.0.0.1", "-p", String(port)], {
    cwd: root,
    env: {
      ...process.env,
      NEXT_TELEMETRY_DISABLED: "1",
      SHORTS_EDITORIAL_OS_V2_ENABLED: "1",
      SHORTS_EDITORIAL_OS_V2_LOCAL_PERSISTENCE_ENABLED: "1",
      SHORTS_EDITORIAL_OS_V2_LOCAL_PREVIEW_RENDER_ENABLED: "1",
      SHORTS_EDITORIAL_OS_V2_DATA_ROOT: resolvedTemp,
    },
    windowsHide: true,
    stdio: ["ignore", "pipe", "pipe"],
  });
  const capture = (chunk) => { serverOutput = `${serverOutput}${chunk.toString()}`.slice(-96_000); };
  serverProcess.stdout.on("data", capture);
  serverProcess.stderr.on("data", capture);
  await waitForServer(`${origin}/editorial-v2`);

  try { browser = await chromium.launch({ headless: true }); } catch { browser = await chromium.launch({ headless: true, channel: "chrome" }); }
  const context = await browser.newContext({ baseURL: origin });
  const page = await context.newPage();
  const externalRequests = [];
  const pageErrors = [];
  page.on("request", (request) => {
    if (request.url().startsWith(`blob:${origin}/`)) return;
    const url = new URL(request.url());
    if (url.hostname !== "127.0.0.1" || url.port !== String(port)) externalRequests.push(request.url());
  });
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto("/editorial-v2", { waitUntil: "networkidle", timeout: 60_000 });
  await page.getByRole("heading", { name: "Project Workspace" }).waitFor({ timeout: 20_000 });
  await page.locator('[data-state="enabled"]').first().waitFor({ timeout: 20_000 });
  await projectSelect(page).selectOption(projectId);
  await page.getByRole("button", { name: "Load approved checkpoint summary" }).click();
  const panel = page.locator('[data-pa3-preview-state]');
  await panel.waitFor({ state: "attached", timeout: 20_000 });
  await page.locator('[data-pa3-preview-state="ready"]').waitFor({ timeout: 30_000 });
  assert(await page.locator('[data-pa3-checkpoint-match="yes"]').count() === 1, "persisted/session checkpoint match not shown");
  assert(await page.getByText("NOT_PRODUCTION_READY", { exact: true }).count() >= 1, "preview production boundary missing");
  assert(await page.getByRole("button", { name: "Generate Local Preview" }).isDisabled(), "preview button enabled without confirmation");
  await page.getByLabel("이 렌더는 로컬 Preview이며 최종 영상·게시용이 아님을 확인했습니다.").check();

  const firstResponsePromise = page.waitForResponse((response) => response.request().method() === "POST" && response.url().endsWith(`/api/editorial-v2/projects/${projectId}/preview-render`), { timeout: 180_000 });
  await page.getByRole("button", { name: "Generate Local Preview" }).click();
  await page.locator('[data-pa3-preview-state="rendering"]').waitFor({ timeout: 10_000 });
  const firstResponse = await firstResponsePromise;
  const firstPayload = await firstResponse.json();
  assert(firstResponse.ok() && firstPayload.ok === true, `first preview API failed: ${JSON.stringify(firstPayload)}`);
  assert(firstPayload.ffmpegExecuted === true && firstPayload.cacheStatus === "miss_rendered", "first render did not execute ffmpeg exactly once");
  await page.locator('[data-pa3-preview-state="completed"]').waitFor({ timeout: 30_000 });
  await page.locator('[data-pa3-preview-video="ready"]').waitFor({ timeout: 30_000 });
  assert(firstPayload.productionReady === false && firstPayload.metadata.productionReady === false, "production-ready false boundary changed");
  assert(firstPayload.metadata.profile === "preview_540x960" && firstPayload.metadata.width === 540 && firstPayload.metadata.height === 960 && firstPayload.metadata.fps === 30, "preview output profile mismatch");
  assert(firstPayload.metadata.audioMode === "silent_placeholder" && firstPayload.metadata.subtitleAlignment === "estimated_not_audio_aligned", "preview audio/subtitle boundary mismatch");
  assert(firstPayload.metadata.probe.video && firstPayload.metadata.probe.audio && firstPayload.metadata.probe.subtitle, "required media streams missing");
  assert(firstPayload.metadata.sceneCount === 8 && firstPayload.metadata.characterMotionProxy === true && firstPayload.metadata.productionAnimation === false, "scene/character preview metadata mismatch");
  assert(!JSON.stringify(firstPayload).includes(resolvedTemp), "API leaked local data root path");

  const mediaResponse = await fetch(`${origin}/api/editorial-v2/projects/${projectId}/preview-render?renderId=${firstPayload.identity.renderId}&media=1`, { redirect: "error" });
  const mediaBytes = Buffer.from(await mediaResponse.arrayBuffer());
  assert(mediaResponse.ok && mediaResponse.headers.get("content-type") === "video/mp4", "media endpoint contract mismatch");
  assert(mediaBytes.byteLength === firstPayload.metadata.outputBytes && createHash("sha256").update(mediaBytes).digest("hex") === firstPayload.metadata.outputSha256, "media bytes/hash mismatch");

  const secondResponsePromise = page.waitForResponse((response) => response.request().method() === "POST" && response.url().endsWith(`/api/editorial-v2/projects/${projectId}/preview-render`), { timeout: 60_000 });
  await page.getByRole("button", { name: "Generate Local Preview" }).click();
  const secondResponse = await secondResponsePromise;
  const secondPayload = await secondResponse.json();
  assert(secondResponse.ok() && secondPayload.cacheStatus === "hit_reused" && secondPayload.ffmpegExecuted === false, `valid cache was not reused: ${JSON.stringify(secondPayload)}`);
  assert(secondPayload.identity.renderId === firstPayload.identity.renderId && secondPayload.metadata.outputSha256 === firstPayload.metadata.outputSha256, "cache identity/output changed");
  await page.locator('[data-pa3-preview-state="cache_hit"]').waitFor({ timeout: 20_000 });

  const validRequest = { expectedProjectRevision: 5, expectedRenderCheckpointHash: renderCheckpointHash, profile: "preview_540x960", ownerLocalPreviewConfirmation: true };
  const injectionAttempt = await postPreview(origin, projectId, { ...validRequest, filesystemPath: "C:\\sensitive\\preview.mp4", content: "<script>" });
  assert(injectionAttempt.response.status === 400 && injectionAttempt.body.code === "LOCAL_PREVIEW_REQUEST_INVALID", "client path/content injection was not blocked");
  const finalAttempt = await postPreview(origin, projectId, { ...validRequest, profile: "final_1080x1920" });
  assert(finalAttempt.response.status === 400, "final profile request was not blocked");
  const staleAttempt = await postPreview(origin, projectId, { ...validRequest, expectedProjectRevision: 4 });
  assert(staleAttempt.response.status === 409 && staleAttempt.body.code === "PROJECT_REVISION_MISMATCH", "stale project revision was not blocked");
  const unconfirmedAttempt = await postPreview(origin, projectId, { ...validRequest, ownerLocalPreviewConfirmation: false });
  assert(unconfirmedAttempt.response.status === 400, "unconfirmed preview request was not blocked");
  const crossOriginAttempt = await postPreview(origin, projectId, validRequest, { origin: "https://invalid.example" });
  assert(crossOriginAttempt.response.status === 403, "cross-origin preview mutation was not blocked");

  const renderDirectory = join(resolvedTemp, "projects", projectId, "renders", "preview", firstPayload.identity.renderId);
  const mediaPath = join(renderDirectory, "preview.mp4");
  const metadataPath = join(renderDirectory, "metadata.json");
  assert(existsSync(mediaPath) && existsSync(metadataPath), "preview output missing from V2 project data root");
  assert(statSync(mediaPath).size === firstPayload.metadata.outputBytes, "preview disk output size mismatch");
  assert(!existsSync(join(root, "output", firstPayload.identity.renderId)), "preview escaped into repository output directory");
  assert(externalRequests.length === 0, `external browser requests observed: ${externalRequests.join(" | ")}`);
  assert(pageErrors.length === 0, `browser page errors: ${pageErrors.join(" | ")}`);
  assert(serverOutput.includes("POST /api/editorial-v2/projects/") && !serverOutput.includes("invalid.example/pa3"), "runtime request evidence missing or injection escaped as network");

  summary = {
    playwrightRuntimeUsed: true,
    localhostOnly: true,
    canonicalApprovedCheckpointSource: true,
    exactIdentifierOnlyRequest: true,
    ownerLocalPreviewConfirmationRequired: true,
    profile540x960At30fps: true,
    videoStreamPresent: true,
    silentAudioStreamPresent: true,
    estimatedSubtitleStreamPresent: true,
    actualUserContentRendered: true,
    adversarialTextEscaped: true,
    characterMotionProxyRendered: true,
    productionAnimationCreated: false,
    externalAssetsCreated: false,
    externalTtsCalled: false,
    firstFfmpegExecutionObserved: true,
    deterministicCacheHitWithoutFfmpeg: true,
    clientPathAndContentInjectionBlocked: true,
    finalProfileBlocked: true,
    staleRevisionBlocked: true,
    crossOriginMutationBlocked: true,
    localDataRootPathHidden: true,
    externalRequests: 0,
    pageErrors: 0,
    publicPublishExecuted: false,
    defaultDataRootAccessed: false,
  };
  await context.close();
} catch (error) {
  probeError = error;
} finally {
  if (browser) await browser.close().catch(() => undefined);
  if (serverProcess && serverProcess.exitCode === null) {
    serverProcess.kill("SIGTERM");
    await new Promise((resolveWait) => {
      const timer = setTimeout(resolveWait, 5_000);
      serverProcess.once("exit", () => { clearTimeout(timer); resolveWait(); });
    });
    if (serverProcess.exitCode === null) serverProcess.kill("SIGKILL");
  }
  if (temporaryDirectory) {
    const child = relative(resolve(tmpdir()), resolve(temporaryDirectory));
    if (child && !child.startsWith("..")) rmSync(resolve(temporaryDirectory), { recursive: true, force: true });
  }
}

const temporaryDirectoryRemoved = Boolean(temporaryDirectory) && !existsSync(temporaryDirectory);
const repositoryStatusUnchanged = repositoryStatus() === statusBefore;
const repositoryHashesUnchanged = invariantPaths.every((path) => existsSync(resolve(root, path)) && sha256File(resolve(root, path)) === hashesBefore[path]);
if (probeError) {
  console.error(probeError instanceof Error ? probeError.stack ?? probeError.message : probeError);
  console.error(serverOutput.slice(-8_000));
  process.exit(1);
}
if (!temporaryDirectoryRemoved || !repositoryStatusUnchanged || !repositoryHashesUnchanged || !summary) {
  console.error(JSON.stringify({ temporaryDirectoryRemoved, repositoryStatusUnchanged, repositoryHashesUnchanged, summaryPresent: Boolean(summary) }));
  process.exit(1);
}
console.log(JSON.stringify({ ...summary, temporaryDirectoryRemoved, repositoryStatusUnchanged, repositoryHashesUnchanged }));
console.log("SHORTS_EDITORIAL_OS_V2_PA3_RUNTIME_PROOF_PASS");
