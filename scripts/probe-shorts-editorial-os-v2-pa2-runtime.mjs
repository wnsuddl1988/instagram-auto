import { createServer } from "node:net";
import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import { spawn, spawnSync } from "node:child_process";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const { chromium } = require("playwright");
const root = resolve(process.cwd());
const statusBefore = repositoryStatus();
const baseline = JSON.parse(readFileSync(resolve(root, "_ai/SHORTS_EDITORIAL_OS_V2_PA2_BASELINE.json"), "utf8"));
const invariantPaths = [...new Set([...baseline.statusPaths.map((entry) => entry.path), ...baseline.pa2Allowlist.map((entry) => entry.path), ...baseline.governanceFiles.map((entry) => entry.path), ...baseline.inheritedCheckpointManifests.map((entry) => entry.path)])];
const hashesBefore = Object.fromEntries(invariantPaths.map((path) => [path, createHash("sha256").update(readFileSync(resolve(root, path))).digest("hex")]));
let temporaryDirectory = "";
let serverProcess = null;
let browser = null;
let probeError = null;
let summary = null;
let serverOutput = "";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function repositoryStatus() {
  const result = spawnSync("git", ["status", "--porcelain=v1", "-z", "--untracked-files=all"], { cwd: root, encoding: "utf8", windowsHide: true, maxBuffer: 16 * 1024 * 1024 });
  if (result.status !== 0 || result.error) throw new Error(result.stderr || result.error?.message || "git status failed");
  return result.stdout;
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
  for (let attempt = 0; attempt < 80; attempt += 1) {
    if (serverProcess?.exitCode !== null) throw new Error(`Next dev exited early: ${serverOutput.slice(-3000)}`);
    try {
      const response = await fetch(url, { redirect: "error" });
      if (response.ok) return;
    } catch {}
    await new Promise((resolveWait) => setTimeout(resolveWait, 500));
  }
  throw new Error(`Next dev did not become ready: ${serverOutput.slice(-3000)}`);
}

function buildExpandedScript(baseRender) {
  const base = baseRender.sourceDetailedScriptSnapshot;
  const beatTypes = ["anomaly_or_problem", "common_interpretation_crack", "evidence_and_number", "hidden_cause_or_connection", "audience_life_impact", "misread_correction", "practical_check_or_action", "next_signal_to_watch"];
  const beats = beatTypes.map((beatType, index) => ({
    ...base.approvedScript.beats[0],
    beatId: `pa2-runtime-beat-${index + 1}`,
    beatType,
    purpose: `runtime-purpose-${index + 1}`,
    narration: `공식 출처와 기준일을 확인하는 synthetic runtime narration ${index + 1}`,
    keyCaption: `출처 확인 ${index + 1}`,
    retentionDevice: `runtime-retention-${index + 1}`,
  }));
  return { ...base, approvedScript: { ...base.approvedScript, beats } };
}

function buildTrendSnapshot() {
  const candidate = {
    schemaVersion: "trend-brief-import-v1",
    researchCutoffDate: "2026-08-08",
    researchWindow: "7d",
    domain: "생활경제",
    audience: "일반 성인",
    targetDurationSeconds: 30,
    briefTitle: "PA2 runtime synthetic trend",
    executiveSummary: "로컬 hydration 검증 전용 synthetic summary",
    sources: [
      { sourceId: "src-1", publisher: "Synthetic A", title: "Synthetic A", url: "https://example.com/a", publishedAt: "2026-08-08T00:00:00Z", eventDate: null },
      { sourceId: "src-2", publisher: "Synthetic B", title: "Synthetic B", url: "https://example.org/b", publishedAt: "2026-08-07T00:00:00Z", eventDate: null },
      { sourceId: "src-3", publisher: "Synthetic C", title: "Synthetic C", url: "https://example.net/c", publishedAt: "2026-08-06T00:00:00Z", eventDate: null },
    ],
    signals: [
      { signalId: "sig-1", headline: "h1", claim: "c1", whyNow: "w1", audienceImpact: "i1", sourceRefs: ["src-1"], numbers: [] },
      { signalId: "sig-2", headline: "h2", claim: "c2", whyNow: "w2", audienceImpact: "i2", sourceRefs: ["src-2"], numbers: [] },
      { signalId: "sig-3", headline: "h3", claim: "c3", whyNow: "w3", audienceImpact: "i3", sourceRefs: ["src-3"], numbers: [] },
    ],
  };
  return {
    candidate,
    rawHash: "runtime-trend-raw-hash",
    normalizedHash: "runtime-trend-normalized-hash",
    expectedInput: { projectId: "runtime-session", researchCutoffDate: "2026-08-08", researchWindow: "7d", domain: "생활경제", audience: "일반 성인", targetDurationSeconds: 30, additionalFocus: "" },
    validationSummary: { valid: true, blockingIssueCount: 0, warningCount: 0, issues: [] },
    approvalState: "approved",
  };
}

function buildApprovedPublishSnapshot(fixture) {
  const render = fixture.approvedRenderIntegration;
  const publishPackage = fixture.publishPackage;
  return {
    publishPackage,
    validation: { valid: true, blockingIssueCount: 0, warningCount: 0, verificationLevel: "PUBLISH_INTEGRATION_PRECHECK_ONLY", executionEligible: false, issues: [] },
    bridgePlan: { packageId: publishPackage.packageId, executionReady: false },
    ledger: fixture.emptyLedger,
    recoveryPlan: { actualRetryExecuted: false },
    approvalState: "approved",
    sessionOnly: true,
    externalIdentityVerified: false,
    uploadExecuted: false,
    publicationExecuted: false,
    schedulingExecuted: false,
    durableLedgerAvailable: false,
    executionReady: false,
    sourceRenderIntegrationSnapshot: render,
    sourceRenderIntegrationIdentity: `${render.renderManifest.sourcePlanningIdentity}:${render.renderManifest.manifestHash}`,
    sceneFingerprints: render.renderManifest.scenes.map((scene) => ({ ...scene.fingerprint })),
    selectedCharacterDirectionId: render.sourceCharacterSnapshot.selectedDirectionId,
    platformPackages: publishPackage.platformPackages.map((entry) => ({ ...entry })),
    publishMetadata: publishPackage.platformPackages.map((entry) => ({ ...entry.metadata })),
    sourceDisclosures: publishPackage.platformPackages.map((entry) => ({ ...entry.metadata.sourceDisclosure })),
    destinationIdentityPlan: publishPackage.platformPackages.map((entry) => ({ ...entry.expectedDestinationIdentity })),
    dedupeKeys: publishPackage.platformPackages.map((entry) => ({ ...entry.dedupeKey })),
  };
}

function projectSelect(page) {
  return page.locator('section[aria-labelledby="project-workspace-title"] select').first();
}

try {
  temporaryDirectory = mkdtempSync(join(tmpdir(), "shorts-editorial-v2-pa2-runtime-"));
  const resolvedTemp = resolve(temporaryDirectory);
  const tempChild = relative(resolve(tmpdir()), resolvedTemp);
  assert(tempChild && !tempChild.startsWith(".."), "runtime temporary root escaped OS temp");

  const roots = loadTs("lib/editorial-v2/persistence-data-root.ts");
  const store = loadTs("lib/editorial-v2/project-store-node.ts");
  const fixtureModule = loadTs("lib/editorial-v2/publish-fixture.ts");
  const sceneCardsModule = loadTs("lib/editorial-v2/scene-cards.ts");
  const sceneValidationModule = loadTs("lib/editorial-v2/scene-card-validation.ts");
  const visualModule = loadTs("lib/editorial-v2/visual-planning.ts");
  const configuration = roots.resolveEditorialV2LocalStoreConfiguration({ env: { SHORTS_EDITORIAL_OS_V2_LOCAL_PERSISTENCE_ENABLED: "1", SHORTS_EDITORIAL_OS_V2_DATA_ROOT: resolvedTemp }, repositoryRoot: root, workingDirectory: root, syntheticProbe: true });
  assert(configuration.enabled && resolve(configuration.dataRoot) === resolvedTemp, "runtime data root mismatch");

  const fixture = fixtureModule.buildSyntheticPublishFixture();
  const scriptSnapshot = buildExpandedScript(fixture.approvedRenderIntegration);
  const sceneCards = sceneCardsModule.buildSceneCardDrafts(scriptSnapshot);
  const sceneValidation = sceneValidationModule.validateSceneCardDrafts(sceneCards, scriptSnapshot);
  const visualPlan = visualModule.buildVisualAssetPlan(sceneCards, scriptSnapshot);
  const visualProof = visualModule.validateVisualAssetPlan(visualPlan, sceneCards, scriptSnapshot);
  const planningSnapshot = {
    approvedScriptIdentity: scriptSnapshot.scriptNormalizedHash,
    approvedScriptRawHash: scriptSnapshot.scriptRawHash,
    approvedScriptNormalizedHash: scriptSnapshot.scriptNormalizedHash,
    evidenceIdentity: scriptSnapshot.evidenceIdentity,
    selectedAngleId: scriptSnapshot.selectedAngle.selectedAngleId,
    sceneCards,
    sceneValidation,
    visualPlan,
    visualProof,
    approvalState: "approved",
  };
  const publishSnapshot = buildApprovedPublishSnapshot(fixture);
  const createdAtIso = "2026-08-08T05:00:00.000Z";
  const created = await store.createProject(configuration, { displayName: "PA2 Runtime Hydration", creationTimestampIso: createdAtIso });
  assert(created.ok && created.projectId, `runtime project create failed: ${created.message}`);
  const projectId = created.projectId;
  const checkpoints = [
    ["trend_brief_import", buildTrendSnapshot(), "runtime-trend"],
    ["editorial_intelligence", scriptSnapshot, "runtime-script"],
    ["scene_planning", planningSnapshot, "runtime-planning"],
    ["character_motion", fixture.approvedRenderIntegration.sourceCharacterSnapshot, "runtime-character"],
    ["render_integration", fixture.approvedRenderIntegration, "runtime-render"],
    ["publish_integration", publishSnapshot, "runtime-publish"],
  ];
  for (const [index, [stageId, payload, sourceIdentity]] of checkpoints.entries()) {
    const written = await store.writeProjectCheckpoint(configuration, projectId, { ownerConfirmed: true, checkpoint: { stageId, approvedAtIso: `2026-08-08T05:0${index + 1}:00.000Z`, sourceIdentity, payload }, rawArtifacts: [] });
    assert(written.ok && written.revision === index + 1, `runtime checkpoint ${stageId} failed: ${written.message}`);
  }

  const port = await freePort();
  assert(Number.isSafeInteger(port) && port > 0, "runtime port unavailable");
  const origin = `http://127.0.0.1:${port}`;
  serverProcess = spawn(process.execPath, [resolve(root, "node_modules/next/dist/bin/next"), "dev", "-H", "127.0.0.1", "-p", String(port)], {
    cwd: root,
    env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1", SHORTS_EDITORIAL_OS_V2_ENABLED: "1", SHORTS_EDITORIAL_OS_V2_LOCAL_PERSISTENCE_ENABLED: "1", SHORTS_EDITORIAL_OS_V2_DATA_ROOT: resolvedTemp },
    windowsHide: true,
    stdio: ["ignore", "pipe", "pipe"],
  });
  const capture = (chunk) => { serverOutput = `${serverOutput}${chunk.toString()}`.slice(-64_000); };
  serverProcess.stdout.on("data", capture);
  serverProcess.stderr.on("data", capture);
  await waitForServer(`${origin}/editorial-v2`);

  try {
    browser = await chromium.launch({ headless: true });
  } catch {
    browser = await chromium.launch({ headless: true, channel: "chrome" });
  }
  const context = await browser.newContext({ baseURL: origin });
  const page = await context.newPage();
  const externalRequests = [];
  const pageErrors = [];
  const draftPutRequests = [];
  const auditPage = (targetPage) => {
    targetPage.on("request", (request) => {
      if (!request.url().startsWith(origin)) externalRequests.push(request.url());
      if (request.method() === "PUT" && request.url().includes("/api/editorial-v2/projects/") && request.url().endsWith("/draft")) draftPutRequests.push(request.url());
    });
    targetPage.on("pageerror", (error) => pageErrors.push(error.message));
  };
  auditPage(page);
  await page.goto("/editorial-v2", { waitUntil: "networkidle", timeout: 45_000 });
  await page.getByRole("heading", { name: "Project Workspace" }).waitFor({ timeout: 20_000 });
  await page.locator('[data-state="enabled"]').first().waitFor({ timeout: 20_000 });

  const uiProjectTimestamp = "2026-08-08T05:40:00.000Z";
  await page.getByLabel("프로젝트 이름").fill("PA2 UI Research Resume");
  await page.getByLabel("Creation timestamp (canonical ISO)").fill(uiProjectTimestamp);
  await page.getByRole("button", { name: "Create local V2 project" }).click();
  await page.getByText("프로젝트를 생성했습니다.", { exact: false }).waitFor({ timeout: 20_000 });
  await page.locator('[data-state="clean"]').waitFor({ timeout: 20_000 });
  const uiProjectId = await projectSelect(page).inputValue();
  assert(uiProjectId && uiProjectId !== projectId, "UI project was not created or selected");
  const uiResearchFocus = "UI_RESEARCH_FOCUS_RELOAD_PROOF";
  const uiRawExact = "synthetic raw line one\n한글 line two 🧪\ttab\n{\"not\":\"executed\"}";
  await page.getByLabel("조사 기준일").fill("2026-08-08");
  await page.getByLabel("추가 조사 초점 (선택)").fill(uiResearchFocus);
  await page.getByLabel("외부 LLM raw response").fill(uiRawExact);
  await page.locator('[data-state="saved"]').waitFor({ timeout: 30_000 });
  const uiDraftPath = join(resolvedTemp, "projects", uiProjectId, "draft.json");
  const uiDiskDraft = JSON.parse(readFileSync(uiDraftPath, "utf8"));
  assert(uiDiskDraft.draftRevision > 0, "UI draft revision did not advance");
  assert(uiDiskDraft.stageStates.trend_brief_import.researchInput.additionalFocus === uiResearchFocus, "UI research focus did not persist");
  assert(uiDiskDraft.stageStates.trend_brief_import.rawImport === uiRawExact, "UI raw textarea was not preserved exactly");

  await page.reload({ waitUntil: "networkidle", timeout: 45_000 });
  await page.locator('[data-state="enabled"]').first().waitFor({ timeout: 20_000 });
  await projectSelect(page).selectOption(uiProjectId);
  await page.getByRole("button", { name: "Load approved checkpoint summary" }).click();
  await page.getByText("safe_to_hydrate", { exact: true }).first().waitFor({ timeout: 20_000 });
  await page.locator('[data-state="clean"]').waitFor({ timeout: 20_000 });
  assert(await page.getByLabel("추가 조사 초점 (선택)").inputValue() === uiResearchFocus, "UI research focus did not restore after reload");
  assert(await page.getByLabel("외부 LLM raw response").inputValue() === uiRawExact, "UI raw textarea did not restore exactly");
  assert(await page.getByText("승인되지 않음", { exact: true }).count() >= 1, "research approval was automatically restored");

  await projectSelect(page).selectOption(projectId);
  await page.getByRole("button", { name: "Load approved checkpoint summary" }).click();
  await page.getByText(`Project ID`).waitFor({ timeout: 20_000 });
  await page.locator('[data-pa2-stage-count="7"]').waitFor({ state: "attached", timeout: 20_000 });
  await page.locator('[data-state="clean"]').waitFor({ timeout: 20_000 });
  const uniqueDraftValue = "PA2_RUNTIME_HYDRATION_VALUE_7_STAGE";
  const fullDraftRawExact = "seven-stage raw\n그대로 보존 🧪\nend";
  const focusInput = page.getByLabel("추가 조사 초점 (선택)");
  await focusInput.fill(uniqueDraftValue);
  await page.getByLabel("외부 LLM raw response").fill(fullDraftRawExact);
  await page.locator('[data-state="saved"]').waitFor({ timeout: 30_000 });
  const savedStageCount = await page.locator("[data-pa2-stage-count]").getAttribute("data-pa2-stage-count");
  assert(savedStageCount === "7", `saved stage count mismatch: ${savedStageCount}`);
  assert(draftPutRequests.length >= 2, "same-origin draft API autosave seed was not observed");

  await page.reload({ waitUntil: "networkidle", timeout: 45_000 });
  await page.locator('[data-state="enabled"]').first().waitFor({ timeout: 20_000 });
  await projectSelect(page).selectOption(projectId);
  await page.getByRole("button", { name: "Load approved checkpoint summary" }).click();
  await page.getByText("safe_to_hydrate", { exact: true }).first().waitFor({ timeout: 20_000 });
  await page.locator('[data-state="clean"]').waitFor({ timeout: 20_000 });
  await page.locator('[data-pa2-stage-count="7"]').waitFor({ state: "attached", timeout: 20_000 });
  await page.getByLabel("추가 조사 초점 (선택)").waitFor({ timeout: 20_000 });
  assert(await page.getByLabel("추가 조사 초점 (선택)").inputValue() === uniqueDraftValue, "research draft value did not hydrate");
  assert(await page.getByLabel("외부 LLM raw response").inputValue() === fullDraftRawExact, "seven-stage raw value did not hydrate");
  for (const heading of ["Trend Brief 조사·가져오기 워크벤치", "Evidence · Topic · Detailed Script Intelligence", "Scene Cards · Visual Planning", "Character Direction · Rig · Motion System", "Voice · Subtitle · Render Integration", "Publish Package · Identity · Recovery", "Representative Sample · Relaunch Readiness"]) {
    assert(await page.getByRole("heading", { name: heading, exact: true }).count() === 1, `hydrated Workbench heading missing: ${heading}`);
  }
  assert(await page.getByText("Draft Resume ≠ Approval Resume", { exact: false }).count() >= 1, "draft approval boundary missing");

  const secondPage = await context.newPage();
  auditPage(secondPage);
  await secondPage.goto("/editorial-v2", { waitUntil: "networkidle", timeout: 45_000 });
  await secondPage.locator('[data-state="enabled"]').first().waitFor({ timeout: 20_000 });
  await projectSelect(secondPage).selectOption(projectId);
  await secondPage.getByRole("button", { name: "Load approved checkpoint summary" }).click();
  await secondPage.getByText("safe_to_hydrate", { exact: true }).first().waitFor({ timeout: 20_000 });
  await secondPage.locator('[data-state="clean"]').waitFor({ timeout: 20_000 });
  const beforeRace = JSON.parse(readFileSync(join(resolvedTemp, "projects", projectId, "draft.json"), "utf8"));
  const tabOneValue = "PA2_TAB_ONE_FIRST_WRITER_WINS";
  const tabTwoValue = "PA2_TAB_TWO_MUST_CONFLICT";
  await page.getByLabel("추가 조사 초점 (선택)").fill(tabOneValue);
  await page.locator('[data-state="saved"]').waitFor({ timeout: 30_000 });
  const afterFirstWriter = JSON.parse(readFileSync(join(resolvedTemp, "projects", projectId, "draft.json"), "utf8"));
  assert(afterFirstWriter.draftRevision === beforeRace.draftRevision + 1, "first tab did not advance exactly one draft revision");
  assert(afterFirstWriter.stageStates.trend_brief_import.researchInput.additionalFocus === tabOneValue, "first tab value did not persist");
  await secondPage.getByLabel("추가 조사 초점 (선택)").fill(tabTwoValue);
  await secondPage.locator('[data-state="conflict"]').waitFor({ timeout: 30_000 });
  assert(await secondPage.getByText("autosave paused", { exact: false }).count() >= 1, "two-tab conflict warning missing");
  await new Promise((resolveWait) => setTimeout(resolveWait, 3_000));
  const afterConflictPause = JSON.parse(readFileSync(join(resolvedTemp, "projects", projectId, "draft.json"), "utf8"));
  assert(afterConflictPause.draftRevision === afterFirstWriter.draftRevision, "conflicted tab advanced draft revision");
  assert(afterConflictPause.stageStates.trend_brief_import.researchInput.additionalFocus === tabOneValue, "conflicted tab overwrote first writer");
  await secondPage.close();

  await page.reload({ waitUntil: "networkidle", timeout: 45_000 });
  await page.locator('[data-state="enabled"]').first().waitFor({ timeout: 20_000 });
  await projectSelect(page).selectOption(projectId);
  await page.getByRole("button", { name: "Load approved checkpoint summary" }).click();
  await page.getByText("safe_to_hydrate", { exact: true }).first().waitFor({ timeout: 20_000 });
  assert(await page.getByLabel("추가 조사 초점 (선택)").inputValue() === tabOneValue, "winning tab value did not restore after reload");
  assert(pageErrors.length === 0, `browser page errors: ${pageErrors.join(" | ")}`);
  assert(externalRequests.length === 0, `external requests observed: ${externalRequests.join(" | ")}`);
  const savedDraft = JSON.parse(readFileSync(join(resolvedTemp, "projects", projectId, "draft.json"), "utf8"));
  assert(Object.keys(savedDraft.stageStates).length === 7 && savedDraft.draftRevision >= 1, "runtime saved draft missing seven states");
  assert(savedDraft.stageStates.trend_brief_import.researchInput.additionalFocus === tabOneValue, "runtime disk winning draft value mismatch");
  assert(savedDraft.stageStates.trend_brief_import.approvalAuthority === "non_canonical_draft", "runtime draft authority mismatch");
  assert(savedDraft.stageStates.trend_brief_import.approvalState !== "approved", "research approval was persisted as canonical");
  assert(savedDraft.stageStates.editorial_intelligence.session.scriptApproval !== "approved", "intelligence approval was persisted as canonical");
  assert(savedDraft.stageStates.scene_planning.session.planningApproval !== "approved", "scene approval was persisted as canonical");
  assert(savedDraft.stageStates.character_motion.session.approvedSnapshot === null, "character approval was persisted as canonical");
  assert(savedDraft.stageStates.render_integration.approvedRenderKey === null, "render approval was persisted as canonical");
  assert(savedDraft.stageStates.publish_integration.approvedPackageHash === null, "publish approval was persisted as canonical");
  assert(savedDraft.stageStates.relaunch_readiness.approvedIdentity === null, "relaunch approval was persisted as canonical");

  summary = {
    playwrightRuntimeUsed: true,
    localhostOnly: true,
    uiProjectCreated: true,
    researchFieldsAutosaved: true,
    rawTextareaExactRestored: true,
    researchApprovalNotRestored: true,
    approvedCheckpointChainLoaded: true,
    sameOriginFullDraftApiSeeded: true,
    sevenWorkbenchDraftStatesCaptured: true,
    sevenWorkbenchHeadingsHydrated: true,
    debouncedAutosaveObserved: true,
    pageReloaded: true,
    safeHydrationObserved: true,
    researchValueRestored: true,
    approvalAuthorityRemainedNonCanonical: true,
    twoTabRaceExecuted: true,
    firstTabSaveSucceeded: true,
    secondTabConflictObserved: true,
    conflictedTabOverwriteBlocked: true,
    conflictAutosavePaused: true,
    externalRequests: 0,
    pageErrors: 0,
    actualRenderOrPublishExecuted: false,
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
const repositoryHashesUnchanged = invariantPaths.every((path) => existsSync(resolve(root, path)) && createHash("sha256").update(readFileSync(resolve(root, path))).digest("hex") === hashesBefore[path]);
if (probeError) {
  console.error(probeError instanceof Error ? probeError.stack ?? probeError.message : probeError);
  console.error(serverOutput.slice(-5000));
  process.exit(1);
}
if (!temporaryDirectoryRemoved || !repositoryStatusUnchanged || !repositoryHashesUnchanged || !summary) {
  console.error(JSON.stringify({ temporaryDirectoryRemoved, repositoryStatusUnchanged, repositoryHashesUnchanged, summaryPresent: Boolean(summary) }));
  process.exit(1);
}
console.log(JSON.stringify({ ...summary, temporaryDirectoryRemoved, repositoryStatusUnchanged, repositoryHashesUnchanged }));
console.log("SHORTS_EDITORIAL_OS_V2_PA2_RUNTIME_PROOF_PASS");
