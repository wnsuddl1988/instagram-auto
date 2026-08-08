import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const root = resolve(process.cwd());
const statusBefore = repositoryStatus();
const baseline = JSON.parse(readFileSync(resolve(root, "_ai/SHORTS_EDITORIAL_OS_V2_PA2_BASELINE.json"), "utf8"));
const invariantPaths = [...new Set([...baseline.statusPaths.map((entry) => entry.path), ...baseline.pa2Allowlist.map((entry) => entry.path), ...baseline.governanceFiles.map((entry) => entry.path), ...baseline.inheritedCheckpointManifests.map((entry) => entry.path)])];
const hashesBefore = Object.fromEntries(invariantPaths.map((path) => [path, createHash("sha256").update(readFileSync(resolve(root, path))).digest("hex")]));
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

function makeStageStates(stageOrder, marker) {
  const states = {
    trend_brief_import: { stageId: "trend_brief_import", approvalAuthority: "non_canonical_draft", approvalLikeState: "pending_reconfirmation", researchInput: { researchCutoffDate: "2026-08-08", researchWindow: "7d", domain: "생활경제", audience: "일반 성인", targetDurationSeconds: 30, additionalFocus: marker }, generatedPrompt: null, rawImport: `초안 ${marker}\r\nline`, normalizedPreview: null, rawHash: "", normalizedHash: "", validationSummary: null, sessionHashes: [], repairInput: "", repairPrompt: null, repairPreview: null, repairIssues: [], uiSelectionState: {}, approvalState: "approved" },
    editorial_intelligence: { stageId: "editorial_intelligence", approvalAuthority: "non_canonical_draft", approvalLikeState: "pending_reconfirmation", session: { approvedTrendBrief: { marker }, evidenceReview: { status: "approved" }, selectedAngleApproval: "approved", scriptApproval: "approved" }, normalizationMethod: marker, scriptRawHash: "", scriptNormalizedHash: "", rawImportHashes: [], repairPrompt: null, repairPackage: null, repairIssues: [] },
    scene_planning: { stageId: "scene_planning", approvalAuthority: "non_canonical_draft", approvalLikeState: "pending_reconfirmation", session: { approvedScript: { marker }, sceneCards: [], sceneValidation: null, sceneCardApproval: "approved", visualPlan: [], visualProof: null, planningApproval: "approved" }, selectedSceneId: null },
    character_motion: { stageId: "character_motion", approvalAuthority: "non_canonical_draft", approvalLikeState: "pending_reconfirmation", session: { approvedPlanning: { marker }, representativeScene: null, selection: { approvalState: "provisionally_approved" }, validation: null, approvedSnapshot: { marker }, playbackState: "paused", previewSpeed: 1, reducedMotionPreview: false }, comparisonMotionTag: "idle_scan" },
    render_integration: { stageId: "render_integration", approvalAuthority: "non_canonical_draft", approvalLikeState: "pending_reconfirmation", voiceMode: "plan_only", locale: "ko-KR", voiceIdentity: marker, providerId: "", providerLabel: "", manualCostBasisLabel: "", ownerExternalApprovalConfirmed: false, targetDurationSeconds: 45, selectedProfileId: "preview_540x960", approvedVoiceKey: `voice-${marker}`, approvedRenderKey: `render-${marker}`, lastApprovedManifest: { marker } },
    publish_integration: { stageId: "publish_integration", approvalAuthority: "non_canonical_draft", approvalLikeState: "pending_reconfirmation", selectedPlatforms: ["instagram_reels"], instagramExpectedId: marker, instagramObservedId: "", instagramLabel: "", instagramOwnerConfirmed: false, youtubeExpectedId: "", youtubeObservedId: "", youtubeLabel: "", youtubeOwnerConfirmed: false, instagramHashtags: "", youtubeHashtags: "", instagramCoverSceneId: "", youtubeCoverSceneId: "", youtubeVisibility: "private", executionIntent: "immediate_future", scheduledAtIso: "", timezone: "Asia/Seoul", validationNowIso: "2026-08-08T00:00:00.000Z", scheduleOwnerConfirmation: false, ledger: { ledgerVersion: "session-publication-ledger-v1", sessionIdentity: marker, attempts: [], platformStates: [], durable: false, remoteSynchronized: false }, actualPublishNotIncludedConfirmed: false, approvedPackageHash: `package-${marker}` },
    relaunch_readiness: { stageId: "relaunch_readiness", approvalAuthority: "non_canonical_draft", approvalLikeState: "pending_reconfirmation", selectedDirectionId: "", reviewedDirectionIds: [], identityDraft: { channelNameCandidate: marker, handleCandidates: "", oneLinePromise: "", primaryAudience: "", prohibitedWords: "", tagline: "" }, acknowledgementStates: { productionGapsAcknowledged: true, controlTowerApprovalAcknowledged: true }, approvedIdentity: `identity-${marker}` },
  };
  return Object.fromEntries(stageOrder.map((stageId) => [stageId, states[stageId]]));
}

try {
  temporaryDirectory = mkdtempSync(join(tmpdir(), "shorts-editorial-v2-pa2-draft-"));
  const resolvedTemp = resolve(temporaryDirectory);
  const tempChild = relative(resolve(tmpdir()), resolvedTemp);
  assert(tempChild && !tempChild.startsWith(".."), "temporary root escaped OS temp");

  const roots = loadTs("lib/editorial-v2/persistence-data-root.ts");
  const projectStore = loadTs("lib/editorial-v2/project-store-node.ts");
  const draftStore = loadTs("lib/editorial-v2/draft-store-node.ts");
  const draftSnapshot = loadTs("lib/editorial-v2/draft-snapshot.ts");
  const draftRecovery = loadTs("lib/editorial-v2/draft-recovery.ts");
  const draftContracts = loadTs("lib/editorial-v2/draft-contracts.ts");
  const configuration = roots.resolveEditorialV2LocalStoreConfiguration({
    env: { SHORTS_EDITORIAL_OS_V2_LOCAL_PERSISTENCE_ENABLED: "1", SHORTS_EDITORIAL_OS_V2_DATA_ROOT: resolvedTemp },
    repositoryRoot: root,
    workingDirectory: root,
    syntheticProbe: true,
  });
  assert(configuration.enabled && configuration.dataRootKind === "synthetic_probe", "synthetic configuration not enabled");
  assert(resolve(configuration.dataRoot) === resolvedTemp, "draft probe data root mismatch");

  const createdAtIso = "2026-08-08T03:00:00.000Z";
  const createResult = await projectStore.createProject(configuration, { displayName: "PA2 Draft Probe", creationTimestampIso: createdAtIso });
  assert(createResult.ok && createResult.projectId, `project create failed: ${createResult.message}`);
  const projectId = createResult.projectId;
  const firstCheckpoint = await projectStore.writeProjectCheckpoint(configuration, projectId, {
    ownerConfirmed: true,
    checkpoint: { stageId: "trend_brief_import", approvedAtIso: "2026-08-08T03:01:00.000Z", sourceIdentity: "pa2-probe-approved-1", payload: { approvalState: "approved", marker: "canonical-1" } },
    rawArtifacts: [],
  });
  assert(firstCheckpoint.ok && firstCheckpoint.revision === 1, `approved checkpoint failed: ${firstCheckpoint.message}`);
  const approvedAtRevisionOne = await projectStore.readProject(configuration, projectId);
  assert(approvedAtRevisionOne.ok && approvedAtRevisionOne.snapshot, "approved snapshot r1 missing");
  const approvedHashAtRevisionOne = approvedAtRevisionOne.snapshot.integrity.canonicalHash;

  async function buildDraft(draftRevision, approved, marker) {
    return draftSnapshot.buildEditorialV2FullDraftSnapshot({
      projectId,
      draftRevision,
      baseProjectRevision: approved.revision,
      baseApprovedStage: approved.lastApprovedStage,
      baseApprovedCheckpointHash: approved.integrity.canonicalHash,
      savedAtIso: `2026-08-08T03:${String(10 + draftRevision).padStart(2, "0")}:00.000Z`,
      stageStates: makeStageStates(draftContracts.EDITORIAL_V2_DRAFT_STAGE_ORDER, marker),
      dirtyStageIds: [...draftContracts.EDITORIAL_V2_DRAFT_STAGE_ORDER],
    });
  }

  const draftZero = await buildDraft(0, approvedAtRevisionOne.snapshot, "first");
  const firstSave = await draftStore.writeProjectDraft(configuration, { projectId, expectedDraftRevision: 0, expectedBaseProjectRevision: 1, draft: draftZero });
  assert(firstSave.ok && firstSave.draftRevision === 1 && firstSave.draftHash, `first draft save failed: ${firstSave.message}`);
  const firstRead = await draftStore.readProjectDraft(configuration, projectId);
  assert(firstRead.ok && firstRead.draft?.draftRevision === 1, "first draft read mismatch");
  assert(Object.keys(firstRead.draft.stageStates).length === 7, "seven stage states not preserved");
  assert(firstRead.draft.stageStates.trend_brief_import.rawImport.includes("\r\n"), "exact CRLF text not preserved");
  assert((await draftStore.verifyProjectDraftIntegrity(configuration, projectId)).valid, "first draft integrity failed");

  const draftOne = await buildDraft(1, approvedAtRevisionOne.snapshot, "second");
  const secondSave = await draftStore.writeProjectDraft(configuration, { projectId, expectedDraftRevision: 1, expectedBaseProjectRevision: 1, draft: draftOne });
  assert(secondSave.ok && secondSave.draftRevision === 2, `second draft save failed: ${secondSave.message}`);
  const currentBeforeStaleWriter = await draftStore.readProjectDraft(configuration, projectId);
  const staleWriter = await draftStore.writeProjectDraft(configuration, { projectId, expectedDraftRevision: 1, expectedBaseProjectRevision: 1, draft: draftOne });
  assert(!staleWriter.ok && staleWriter.status === "draft_revision_conflict" && staleWriter.conflict?.automaticMerge === false, "stale writer was not paused");
  const currentAfterStaleWriter = await draftStore.readProjectDraft(configuration, projectId);
  assert(currentAfterStaleWriter.draft?.draftHash === currentBeforeStaleWriter.draft?.draftHash, "stale writer changed current draft");

  const secondCheckpoint = await projectStore.writeProjectCheckpoint(configuration, projectId, {
    ownerConfirmed: true,
    checkpoint: { stageId: "editorial_intelligence", approvedAtIso: "2026-08-08T03:20:00.000Z", sourceIdentity: "pa2-probe-approved-2", payload: { approvalState: "approved", marker: "canonical-2" } },
    rawArtifacts: [],
  });
  assert(secondCheckpoint.ok && secondCheckpoint.revision === 2, "approved checkpoint r2 failed");
  const approvedAtRevisionTwo = await projectStore.readProject(configuration, projectId);
  assert(approvedAtRevisionTwo.ok && approvedAtRevisionTwo.snapshot, "approved snapshot r2 missing");
  const approvedHashAtRevisionTwo = approvedAtRevisionTwo.snapshot.integrity.canonicalHash;
  assert(approvedHashAtRevisionTwo !== approvedHashAtRevisionOne, "approved checkpoint hash did not advance");

  const staleBaseDraft = await buildDraft(2, approvedAtRevisionOne.snapshot, "stale-base");
  const staleBaseSave = await draftStore.writeProjectDraft(configuration, { projectId, expectedDraftRevision: 2, expectedBaseProjectRevision: 1, draft: staleBaseDraft });
  assert(!staleBaseSave.ok && staleBaseSave.status === "base_project_conflict" && staleBaseSave.conflict?.autosavePaused === true, "base project conflict was not paused");
  const approvedAfterConflicts = await projectStore.readProject(configuration, projectId);
  assert(approvedAfterConflicts.snapshot?.integrity.canonicalHash === approvedHashAtRevisionTwo, "draft conflict mutated approved snapshot");

  const rebasedDraftTwo = await buildDraft(2, approvedAtRevisionTwo.snapshot, "rebased");
  const rebasedSave = await draftStore.writeProjectDraft(configuration, { projectId, expectedDraftRevision: 2, expectedBaseProjectRevision: 2, draft: rebasedDraftTwo });
  assert(rebasedSave.ok && rebasedSave.draftRevision === 3, "explicit rebase save failed");
  const draftThree = await buildDraft(3, approvedAtRevisionTwo.snapshot, "post-rebase");
  const postRebaseSave = await draftStore.writeProjectDraft(configuration, { projectId, expectedDraftRevision: 3, expectedBaseProjectRevision: 2, draft: draftThree });
  assert(postRebaseSave.ok && postRebaseSave.draftRevision === 4, "post-rebase LKG save failed");

  const projectDirectory = join(resolvedTemp, "projects", projectId);
  const currentDraftPath = join(projectDirectory, "draft.json");
  const lastKnownGoodPath = join(projectDirectory, "draft.last-known-good.json");
  assert(existsSync(currentDraftPath) && existsSync(lastKnownGoodPath), "draft current or LKG missing");
  const approvedBeforeCorruption = await projectStore.readProject(configuration, projectId);
  const corruptionText = "{synthetic-pa2-draft-corruption";
  writeFileSync(currentDraftPath, corruptionText, { encoding: "utf8", flag: "w" });
  const corruptedRead = await draftStore.readProjectDraft(configuration, projectId);
  assert(!corruptedRead.ok && corruptedRead.status === "corrupted", "draft corruption was not detected");
  const overwriteAttempt = await draftStore.writeProjectDraft(configuration, { projectId, expectedDraftRevision: 4, expectedBaseProjectRevision: 2, draft: draftThree });
  assert(!overwriteAttempt.ok && overwriteAttempt.status === "integrity_conflict", "corrupted current was overwritten");
  assert(readFileSync(currentDraftPath, "utf8") === corruptionText, "corrupted current changed before explicit recovery");

  const recoveryState = await draftRecovery.inspectDraftRecoveryState(configuration, projectId);
  const recoveryPlan = draftRecovery.buildDraftRecoveryPlan(recoveryState);
  assert(recoveryState.currentExists && !recoveryState.currentValid && recoveryState.lastKnownGoodValid, "draft recovery state mismatch");
  assert(recoveryPlan.required && recoveryPlan.automaticRecovery === false && recoveryPlan.automaticMerge === false, "draft recovery plan unsafe");
  const blockedRecovery = await draftRecovery.recoverDraftFromLastKnownGood(configuration, projectId, { action: "recover_draft", ownerConfirmed: false, expectedCorruptedRevision: null, approvedAtIso: "2026-08-08T03:30:00.000Z" });
  assert(!blockedRecovery.ok && blockedRecovery.message === "DRAFT_RECOVERY_OWNER_CONFIRMATION_REQUIRED", "unconfirmed recovery was allowed");
  const recovery = await draftRecovery.recoverDraftFromLastKnownGood(configuration, projectId, { action: "recover_draft", ownerConfirmed: true, expectedCorruptedRevision: null, approvedAtIso: "2026-08-08T03:31:00.000Z" });
  assert(recovery.ok && recovery.corruptedCurrentPreserved && recovery.approvedSnapshotUnchanged, `confirmed recovery failed: ${recovery.message}`);
  const recoveredDraft = await draftStore.readProjectDraft(configuration, projectId);
  assert(recoveredDraft.ok && recoveredDraft.draft?.draftRevision === 3, "LKG revision was not restored");
  const hydrationDecision = await draftSnapshot.decideDraftHydration(recoveredDraft.draft, approvedAtRevisionTwo.snapshot);
  assert(hydrationDecision.safe && hydrationDecision.autoHydrate && hydrationDecision.approvalDowngraded, "recovered draft not safe to hydrate");
  assert(hydrationDecision.draft.stageStates.trend_brief_import.approvalState === "pending_reconfirmation", "research approval was not downgraded");
  assert(hydrationDecision.draft.stageStates.render_integration.approvedRenderKey === null, "render approval was not downgraded");
  assert(hydrationDecision.draft.stageStates.publish_integration.approvedPackageHash === null, "publish approval was not downgraded");
  assert(hydrationDecision.draft.stageStates.relaunch_readiness.approvedIdentity === null, "relaunch approval was not downgraded");
  const projectMismatch = await draftSnapshot.decideDraftHydration(recoveredDraft.draft, { ...approvedAtRevisionTwo.snapshot, projectId: "other-pa2-project" });
  assert(projectMismatch.status === "project_mismatch" && !projectMismatch.autoHydrate, "project mismatch did not block hydration");
  const schemaMismatchDraft = JSON.parse(JSON.stringify(recoveredDraft.draft));
  schemaMismatchDraft.draftSchemaVersion = "9.0.0";
  const schemaMismatch = await draftSnapshot.decideDraftHydration(schemaMismatchDraft, approvedAtRevisionTwo.snapshot);
  assert(schemaMismatch.status === "schema_mismatch" && !schemaMismatch.autoHydrate, "schema mismatch did not block hydration");
  const oversizeStates = makeStageStates(draftContracts.EDITORIAL_V2_DRAFT_STAGE_ORDER, "oversize");
  oversizeStates.trend_brief_import.rawImport = "x".repeat(draftContracts.EDITORIAL_V2_DRAFT_MAX_RAW_TEXT_BYTES + 1);
  const oversizeDraft = await draftSnapshot.buildEditorialV2FullDraftSnapshot({ projectId, draftRevision: 3, baseProjectRevision: approvedAtRevisionTwo.snapshot.revision, baseApprovedStage: approvedAtRevisionTwo.snapshot.lastApprovedStage, baseApprovedCheckpointHash: approvedAtRevisionTwo.snapshot.integrity.canonicalHash, savedAtIso: "2026-08-08T03:40:00.000Z", stageStates: oversizeStates, dirtyStageIds: ["trend_brief_import"] });
  const oversizeSave = await draftStore.writeProjectDraft(configuration, { projectId, expectedDraftRevision: 3, expectedBaseProjectRevision: 2, draft: oversizeDraft });
  assert(!oversizeSave.ok && oversizeSave.status === "validation_error", "raw aggregate size limit did not block save");
  const approvedAfterRecovery = await projectStore.readProject(configuration, projectId);
  assert(approvedAfterRecovery.snapshot?.integrity.canonicalHash === approvedBeforeCorruption.snapshot?.integrity.canonicalHash, "recovery mutated approved snapshot");
  assert(existsSync(join(projectDirectory, "draft-quarantine")), "draft quarantine directory missing");

  summary = {
    sevenStageDraftPersisted: true,
    optimisticRevisionConflictPaused: true,
    baseApprovedRevisionConflictPaused: true,
    automaticMergeUsed: false,
    corruptedDraftOverwriteBlocked: true,
    explicitOwnerRecoveryRequired: true,
    corruptedCurrentPreserved: true,
    lastKnownGoodRecovered: true,
    approvedSnapshotUnchanged: true,
    recoveredDraftSafeToHydrate: true,
    approvalDowngradeVerified: true,
    projectMismatchBlocked: true,
    schemaMismatchBlocked: true,
    sizeLimitBlocked: true,
    defaultDataRootAccessed: false,
    networkUsed: false,
    repositoryWrites: false,
  };
} catch (error) {
  probeError = error;
} finally {
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
  process.exit(1);
}
if (!temporaryDirectoryRemoved || !repositoryStatusUnchanged || !repositoryHashesUnchanged || !summary) {
  console.error(JSON.stringify({ temporaryDirectoryRemoved, repositoryStatusUnchanged, repositoryHashesUnchanged, summaryPresent: Boolean(summary) }));
  process.exit(1);
}
console.log(JSON.stringify({ ...summary, temporaryDirectoryRemoved, repositoryStatusUnchanged, repositoryHashesUnchanged }));
console.log("SHORTS_EDITORIAL_OS_V2_PA2_DRAFT_PERSISTENCE_PROOF_PASS");
