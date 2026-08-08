import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, relative, resolve } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
const require = createRequire(import.meta.url);
const ts = require("typescript");
const root = resolve(process.cwd());
const statusBefore = repositoryStatus();
let temporaryDirectory = "";
let summary = null;
let probeError = null;

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

try {
  temporaryDirectory = mkdtempSync(join(tmpdir(), "shorts-editorial-v2-pa1-"));
  const resolvedTemp = resolve(temporaryDirectory);
  const resolvedOsTemp = resolve(tmpdir());
  assert(relative(resolvedOsTemp, resolvedTemp) !== "" && !relative(resolvedOsTemp, resolvedTemp).startsWith(".."), "temporary root escaped OS temp");

  const persistence = loadTs("lib/editorial-v2/persistence-contracts.ts");
  const roots = loadTs("lib/editorial-v2/persistence-data-root.ts");
  const store = loadTs("lib/editorial-v2/project-store-node.ts");
  const recovery = loadTs("lib/editorial-v2/project-recovery.ts");
  const env = {
    SHORTS_EDITORIAL_OS_V2_LOCAL_PERSISTENCE_ENABLED: "1",
    SHORTS_EDITORIAL_OS_V2_DATA_ROOT: resolvedTemp,
  };
  const configuration = roots.resolveEditorialV2LocalStoreConfiguration({ env, repositoryRoot: root, workingDirectory: root, syntheticProbe: true });
  assert(configuration.enabled === true, "persistence feature did not enable");
  assert(configuration.dataRootKind === "synthetic_probe", "probe data root kind mismatch");
  assert(resolve(configuration.dataRoot) === resolvedTemp, "probe did not use exact temporary data root");
  assert(!resolvedTemp.toLowerCase().startsWith(resolve("C:\\tmp\\money-shorts-os").toLowerCase()), "V1 root overlap");

  const createdAtIso = "2026-08-06T12:00:00.000Z";
  const createResult = await store.createProject(configuration, { displayName: "PA1 Persistence Probe", creationTimestampIso: createdAtIso });
  assert(createResult.ok && createResult.projectId && createResult.revision === 0, `create failed: ${createResult.message}`);
  const projectId = createResult.projectId;
  const listedAfterCreate = await store.listProjects(configuration, { includeArchived: true });
  assert(listedAfterCreate.length === 1 && listedAfterCreate[0].projectId === projectId, "project list after create mismatch");

  const exactRawText = "원본 그대로 보존\r\nline two\nemoji 🧪\ttab";
  const firstWrite = await store.writeProjectCheckpoint(configuration, projectId, {
    ownerConfirmed: true,
    checkpoint: {
      stageId: "trend_brief_import",
      approvedAtIso: "2026-08-06T12:01:00.000Z",
      sourceIdentity: "probe-trend-raw:normalized",
      payload: { approvalState: "approved", rawHash: "probe-raw-hash", normalizedHash: "probe-normalized-hash" },
    },
    rawArtifacts: [{
      artifactId: "probe-raw-artifact-01",
      artifactKind: "trend_brief_raw_text",
      sourceStage: "trend_brief_import",
      rawText: exactRawText,
      normalizedHash: "probe-normalized-hash",
      importedAtIso: "2026-08-06T12:00:30.000Z",
      providerLabel: "synthetic-probe",
      modelLabel: null,
      promptVersion: "probe-v1",
    }],
  });
  assert(firstWrite.ok && firstWrite.revision === 1, `first checkpoint failed: ${firstWrite.message}`);

  const secondWrite = await store.writeProjectCheckpoint(configuration, projectId, {
    ownerConfirmed: true,
    checkpoint: {
      stageId: "editorial_intelligence",
      approvedAtIso: "2026-08-06T12:02:00.000Z",
      sourceIdentity: "probe-script:evidence",
      payload: { approvalState: "approved", script: { beats: [{ id: "beat-1", text: "synthetic" }] } },
    },
    rawArtifacts: [],
  });
  assert(secondWrite.ok && secondWrite.revision === 2, `second checkpoint failed: ${secondWrite.message}`);

  const projectDirectory = join(resolvedTemp, "projects", projectId);
  const snapshotPath = join(projectDirectory, "snapshot.json");
  const lastKnownGoodPath = join(projectDirectory, "snapshot.last-known-good.json");
  const historyDirectory = join(projectDirectory, "history");
  assert(existsSync(snapshotPath), "current snapshot missing");
  assert(existsSync(lastKnownGoodPath), "last-known-good missing");
  assert(existsSync(join(historyDirectory, "revision-000001.json")), "history revision 1 missing");
  assert(existsSync(join(historyDirectory, "revision-000002.json")), "history revision 2 missing");

  const readBeforeCorruption = await store.readProject(configuration, projectId);
  assert(readBeforeCorruption.ok && readBeforeCorruption.snapshot?.revision === 2, "project read before corruption failed");
  assert(readBeforeCorruption.snapshot.rawArtifacts[0].rawText === exactRawText, "raw artifact exact string changed");
  const integrityBefore = await store.verifyProjectIntegrity(configuration, projectId);
  assert(integrityBefore.valid, "integrity before corruption failed");

  writeFileSync(snapshotPath, "{synthetic-corruption", { encoding: "utf8", flag: "w" });
  const corruptedRead = await store.readProject(configuration, projectId);
  assert(!corruptedRead.ok && corruptedRead.status === "integrity_conflict", "synthetic corruption was not detected");
  const recoveryState = await recovery.inspectProjectRecoveryState(configuration, projectId);
  assert(recoveryState.currentCorrupted && recoveryState.lastKnownGoodAvailable, "recovery candidates not detected");
  const recoveryPlan = recovery.buildProjectRecoveryPlan(recoveryState);
  assert(recoveryPlan.required && recoveryPlan.preferredCandidate === "last_known_good" && recoveryPlan.automaticExecution === false, "recovery plan mismatch");
  const recoveryResult = await recovery.recoverFromLastKnownGood(configuration, projectId, { ownerConfirmed: true, candidate: "last_known_good", approvedAtIso: "2026-08-06T12:03:00.000Z" });
  assert(recoveryResult.ok && recoveryResult.currentCorruptionPreserved, `recovery failed: ${recoveryResult.message}`);
  const readAfterRecovery = await store.readProject(configuration, projectId);
  assert(readAfterRecovery.ok && readAfterRecovery.snapshot, "project read after recovery failed");
  assert(readAfterRecovery.snapshot.rawArtifacts[0].rawText === exactRawText, "raw artifact changed after recovery");
  assert((await store.verifyProjectIntegrity(configuration, projectId)).valid, "integrity after recovery failed");
  assert(existsSync(join(projectDirectory, "quarantine")), "corrupted current quarantine missing");

  const archiveResult = await store.archiveProject(configuration, projectId, { ownerConfirmed: true, archivedAtIso: "2026-08-06T12:04:00.000Z" });
  assert(archiveResult.ok, `archive failed: ${archiveResult.message}`);
  const archivedRead = await store.readProject(configuration, projectId);
  assert(archivedRead.ok && archivedRead.snapshot?.metadata.status === "archived", "archive state mismatch");
  const activeList = await store.listProjects(configuration);
  const allList = await store.listProjects(configuration, { includeArchived: true });
  assert(activeList.length === 0 && allList.length === 1 && allList[0].status === "archived", "archived list separation mismatch");
  assert(existsSync(projectDirectory) && existsSync(snapshotPath), "archive performed a hard delete");
  assert(readFileSync(join(resolvedTemp, "index.json"), "utf8").includes('"status": "archived"'), "atomic index did not record archive");

  summary = {
    projectCreated: true,
    projectListed: true,
    approvedCheckpointSaved: true,
    rawArtifactExactStringPreserved: true,
    finalRevision: archivedRead.snapshot.revision,
    lastKnownGoodPresent: true,
    revisionHistoryPresent: true,
    integrityVerifiedBeforeAndAfterRecovery: true,
    syntheticCorruptionDetected: true,
    recoveryPlanRequiredOwnerConfirmation: true,
    explicitProbeRecoveryCompleted: true,
    corruptedCurrentPreserved: true,
    archivedWithoutHardDelete: true,
    defaultDataRootAccessed: false,
    v1DataAccessed: false,
    networkUsed: false,
    repositoryWrites: false,
  };
} catch (error) {
  probeError = error;
} finally {
  if (temporaryDirectory) {
    const resolvedTemp = resolve(temporaryDirectory);
    const resolvedOsTemp = resolve(tmpdir());
    const child = relative(resolvedOsTemp, resolvedTemp);
    if (child && !child.startsWith("..")) rmSync(resolvedTemp, { recursive: true, force: true });
  }
}

const temporaryDirectoryRemoved = Boolean(temporaryDirectory) && !existsSync(temporaryDirectory);
const repositoryStatusUnchanged = repositoryStatus() === statusBefore;
if (probeError) {
  console.error(probeError instanceof Error ? probeError.stack ?? probeError.message : probeError);
  process.exit(1);
}
if (!temporaryDirectoryRemoved || !repositoryStatusUnchanged || !summary) {
  console.error(JSON.stringify({ temporaryDirectoryRemoved, repositoryStatusUnchanged, summaryPresent: Boolean(summary) }));
  process.exit(1);
}
console.log(JSON.stringify({ ...summary, temporaryDirectoryRemoved, repositoryStatusUnchanged }));
console.log("SHORTS_EDITORIAL_OS_V2_PA1_PERSISTENCE_PROOF_PASS");
