import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const root = resolve(process.cwd());
const baselinePath = "_ai/SHORTS_EDITORIAL_OS_V2_PA2_BASELINE.json";
const baseline = JSON.parse(readFileSync(resolve(root, baselinePath), "utf8"));
let pass = 0;
let fail = 0;

function check(label, condition, detail = "") {
  if (condition) { pass += 1; return; }
  fail += 1;
  console.error(`FAIL ${label}${detail ? ` :: ${detail}` : ""}`);
}
function checkTokens(label, source, tokens) { for (const token of tokens) check(`${label}: ${token}`, source.includes(token)); }
function checkForbiddenTokens(label, source, tokens) { for (const token of tokens) check(`${label} excludes ${token}`, !source.includes(token)); }
function readRepo(path) { return readFileSync(resolve(root, path), "utf8"); }
function sha256(path) { return createHash("sha256").update(readFileSync(resolve(root, path))).digest("hex"); }
function git(args, raw = false) {
  const result = spawnSync("git", args, { cwd: root, encoding: "utf8", windowsHide: true, maxBuffer: 32 * 1024 * 1024 });
  if (result.status !== 0 || result.error) throw new Error(result.stderr || result.error?.message || `git ${args.join(" ")} failed`);
  return raw ? result.stdout : result.stdout.trim();
}

check("repository root", resolve(git(["rev-parse", "--show-toplevel"])) === root);
check("baseline exists", existsSync(resolve(root, baselinePath)));
check("baseline manifest version", baseline.manifestVersion === "1.0.0");
check("baseline repository", baseline.repository === "Shorts Editorial OS V2");
check("baseline reconstruction boundary", baseline.baselineReconstructability === "NOT_RECONSTRUCTABLE");
check("baseline branch", baseline.git.branch === "codex/source-first-blueprint-clean");
check("baseline HEAD", baseline.git.head === "41d302a9954015ad34a7ca96313f3ccb54a344b2");
check("baseline parent", baseline.git.parent === "a31a2db8cb092786165064987d134536ebfcfce3");
check("baseline ahead ten", baseline.git.upstream.ahead === 10 && baseline.git.upstream.behind === 0);
check("baseline starting counts", baseline.git.modifiedCount === 21 && baseline.git.untrackedCount === 3 && baseline.git.stagedCount === 0 && baseline.git.statusPathCount === 24);
check("PA2 allowlist exact 23", baseline.pa2Allowlist.length === 23 && new Set(baseline.pa2Allowlist.map((entry) => entry.path)).size === 23);
check("PA2 new exact 12", baseline.pa2Allowlist.filter((entry) => entry.expectedAction === "new").length === 12);
check("PA2 modified exact 11", baseline.pa2Allowlist.filter((entry) => entry.expectedAction === "modified").length === 11);
check("state exceptions exact", JSON.stringify(baseline.stateDocumentExceptions) === JSON.stringify(["_ai/PROJECT_STATE.md", "_ai/NEXT_ACTION.md"]));
check("governance exact two", baseline.governanceFiles.length === 2);
check("inherited manifests exact twelve", baseline.inheritedCheckpointManifests.length === 12);
check("PA1 checkpoint path count", baseline.pa1Checkpoint.pathCount === 20 && baseline.pa1Checkpoint.paths.length === 20);
check("dependency prohibited", baseline.constraints.dependencyChange === "PROHIBITED");
check("configuration prohibited", baseline.constraints.configChange === "PROHIBITED");
check("V1 migration prohibited", baseline.constraints.v1Migration === "PROHIBITED");
check("external network localhost only", baseline.constraints.externalNetwork === "LOCALHOST_ONLY_FOR_RUNTIME_PROBE");
check("deploy push prohibited", baseline.constraints.deployPush === "PROHIBITED");
check("current HEAD unchanged", git(["rev-parse", "HEAD"]) === baseline.git.head);
check("current parent unchanged", git(["show", "-s", "--format=%P", "HEAD"]) === baseline.git.parent);
check("current ahead ten", Number(git(["rev-list", "--count", "@{upstream}..HEAD"])) === 10);
check("current behind zero", Number(git(["rev-list", "--count", "HEAD..@{upstream}"])) === 0);

const porcelain = git(["status", "--porcelain=v1", "-z", "--untracked-files=all"], true);
const statusEntries = porcelain.split("\0").filter(Boolean).map((entry) => ({ status: entry.slice(0, 2), path: entry.slice(3).replaceAll("\\", "/") }));
const expectedPaths = new Set([...baseline.statusPaths.map((entry) => entry.path), ...baseline.pa2Allowlist.map((entry) => entry.path)]);
const actualPaths = new Set(statusEntries.map((entry) => entry.path));
check("working status exact 47", statusEntries.length === 47, String(statusEntries.length));
check("working modified exact 32", statusEntries.filter((entry) => entry.status === " M").length === 32, JSON.stringify(statusEntries.filter((entry) => entry.status === " M").map((entry) => entry.path)));
check("working untracked exact 15", statusEntries.filter((entry) => entry.status === "??").length === 15);
check("working staged zero", statusEntries.every((entry) => entry.status === "??" || entry.status[0] === " "));
check("working rename zero", statusEntries.every((entry) => !entry.status.includes("R")));
check("working delete zero", statusEntries.every((entry) => !entry.status.includes("D")));
check("working path set exact", actualPaths.size === expectedPaths.size && [...actualPaths].every((path) => expectedPaths.has(path)));
for (const entry of baseline.pa2Allowlist) {
  const expectedStatus = entry.expectedAction === "new" ? "??" : " M";
  check(`PA2 action ${entry.path}`, statusEntries.some((candidate) => candidate.path === entry.path && candidate.status === expectedStatus));
}
for (const entry of baseline.statusPaths) {
  check(`protected status ${entry.path}`, statusEntries.some((candidate) => candidate.path === entry.path && candidate.status === entry.status));
  check(`protected hash ${entry.path}`, sha256(entry.path) === entry.sha256);
}
for (const entry of [...baseline.governanceFiles, ...baseline.inheritedCheckpointManifests]) {
  check(`protected file exists ${entry.path}`, existsSync(resolve(root, entry.path)));
  check(`protected file hash ${entry.path}`, sha256(entry.path) === entry.sha256);
}
const pa2Modified = new Set(baseline.pa2Allowlist.filter((entry) => entry.expectedAction === "modified").map((entry) => entry.path));
for (const entry of baseline.pa1Checkpoint.paths) {
  if (pa2Modified.has(entry.path)) continue;
  check(`PA1 path exists ${entry.path}`, existsSync(resolve(root, entry.path)));
  check(`PA1 path protected ${entry.path}`, sha256(entry.path) === entry.sha256);
}
check("git diff check", spawnSync("git", ["diff", "--check"], { cwd: root, encoding: "utf8", windowsHide: true }).status === 0);
check("middleware absent", !existsSync(resolve(root, "middleware.ts")) && !existsSync(resolve(root, "src/middleware.ts")));

const requiredModules = new Map([
  ["lib/editorial-v2/draft-contracts.ts", ["EDITORIAL_V2_DRAFT_NAMESPACE", "EDITORIAL_V2_DRAFT_SCHEMA_VERSION", "EDITORIAL_V2_DRAFT_MAX_BYTES", "EDITORIAL_V2_DRAFT_MAX_RAW_TEXT_BYTES", "EDITORIAL_V2_DRAFT_AUTOSAVE_DEBOUNCE_MS", "EditorialV2FullDraftSnapshot", "EditorialV2DraftStageStateMap", "non_canonical_draft", "EditorialV2DraftConflict", "automaticMerge", "EditorialV2DraftHydrationDecision", "EditorialV2DraftRecoveryState"]],
  ["lib/editorial-v2/draft-snapshot.ts", ["stableStringifyDraft", "hashEditorialV2Draft", "buildEditorialV2FullDraftSnapshot", "validateEditorialV2Draft", "sanitizeHydratedDraftApprovals", "decideDraftHydration", "pending_reconfirmation", "canonical_approval_supplied_by_checkpoint_only", "draft_integrity_mismatch"]],
  ["lib/editorial-v2/draft-store-node.ts", ["draft.json", "draft.last-known-good.json", "draft-quarantine", ".draft.write.lock", "atomicWriteText", "wx", "handle.sync", "rename", "DRAFT_SYMLINK_OR_JUNCTION_FORBIDDEN", "DRAFT_PROJECT_PATH_ESCAPE_BLOCKED", "draft_revision_conflict", "base_project_conflict", "corruptedCurrentPreserved", "approvedSnapshotUnchanged"]],
  ["lib/editorial-v2/draft-recovery.ts", ["inspectDraftRecoveryState", "buildDraftRecoveryPlan", "recoverDraftFromLastKnownGood", "ownerConfirmationRequired", "automaticRecovery: false", "automaticMerge: false", "corruptedCurrentMustBePreserved", "approvedSnapshotMustRemainUnchanged"]],
  ["lib/editorial-v2/draft-api-client.ts", ["loadEditorialV2Draft", "saveEditorialV2Draft", "recoverEditorialV2Draft", "same-origin", "AbortController", "credentials: \"same-origin\"", "redirect: \"error\"", "cache: \"no-store\"", "EXTERNAL_DRAFT_URL_FORBIDDEN"]],
  ["app/api/editorial-v2/projects/[projectId]/draft/route.ts", ["export async function GET", "export async function PUT", "export async function PATCH", "save_draft", "recover_draft", "LOCAL_PERSISTENCE_DISABLED", "REQUEST_BODY_TOO_LARGE", "CLIENT_FILESYSTEM_PATH_FORBIDDEN", "CROSS_ORIGIN_DRAFT_MUTATION_FORBIDDEN", "DRAFT_CORRUPTED", "recoveryPlan"]],
  ["components/editorial-v2/DraftAutosaveStatus.tsx", ["Draft Autosave", "Approved checkpoint와 편집 draft는 별도 권위", "Draft Resume ≠ Approval Resume", "암호화되지 않은 JSON", "Save Draft Now", "Reload Saved Draft", "Start From Approved Checkpoint", "automatic merge/overwrite 없음", "Force Overwrite Conflict"]],
  ["components/editorial-v2/DraftAutosaveStatus.module.css", [".panel", ".header", ".badge", ".warning", ".summary", ".alert", ".actions", ":focus-visible", "@media"]],
]);
for (const [path, tokens] of requiredModules) {
  check(`required module exists ${path}`, existsSync(resolve(root, path)));
  checkTokens(path, readRepo(path), tokens);
}

const storeSource = readRepo("lib/editorial-v2/draft-store-node.ts");
checkForbiddenTokens("draft store", storeSource, ["fetch(", "XMLHttpRequest", "WebSocket", "node:http", "node:https", "child_process", "spawn(", "exec(", "rm(", "rmdir(", "hardDelete", "localStorage", "indexedDB"]);
check("draft store unlink limited to temp and lock cleanup", (storeSource.match(/unlink\(/gu) ?? []).length === 2 && storeSource.includes("unlink(temporary)") && storeSource.includes("unlink(path)"));
check("draft store no approved writes", !storeSource.includes("writeProjectCheckpoint") && !storeSource.includes("archiveProject") && !storeSource.includes("createProject"));
const clientSource = readRepo("lib/editorial-v2/draft-api-client.ts");
checkForbiddenTokens("draft client", clientSource, ["node:", "process.env", "localStorage", "indexedDB", "sessionStorage", "http://", "https://", "dataRoot", "filesystemPath"]);
const routeSource = readRepo("app/api/editorial-v2/projects/[projectId]/draft/route.ts");
checkForbiddenTokens("draft route", routeSource, ["export async function DELETE", "Access-Control-Allow-Origin", "dataRoot:", "stack", "http://", "https://", "writeProjectCheckpoint", "archiveProject"]);
const statusSource = readRepo("components/editorial-v2/DraftAutosaveStatus.tsx");
checkForbiddenTokens("draft status UI", statusSource, ["type=\"file\"", "showDirectoryPicker", "webkitdirectory", "dangerouslySetInnerHTML", "Hard Delete Draft</button>", "Force Overwrite Conflict</button>"]);

const orchestrationSource = readRepo("components/editorial-v2/EditorialV2Workbench.tsx");
checkTokens("orchestration", orchestrationSource, ["loadedApprovedSnapshot", "loadedDraft", "hydratedDraft", "stageDraftStates", "draftRevision", "draftHash", "hydrationStatus", "autosaveStatus", "conflictMessage", "EDITORIAL_V2_DRAFT_AUTOSAVE_DEBOUNCE_MS", "decideDraftHydration", "sanitizeHydratedDraftApprovals", "expectedDraftRevision", "expectedBaseProjectRevision", "승인 checkpoint", "Draft는 편집값만 복원", "data-pa2-stage-count"]);
for (const stage of ["trend_brief_import", "editorial_intelligence", "scene_planning", "character_motion", "render_integration", "publish_integration", "relaunch_readiness"]) {
  check(`orchestration stage ${stage}`, orchestrationSource.includes(stage));
  check(`orchestration draft initial ${stage}`, orchestrationSource.includes(`hydratedDraft?.stageStates.${stage}`));
}
checkForbiddenTokens("orchestration", orchestrationSource, ["localStorage", "indexedDB", "sessionStorage", "http://", "https://", "forceOverwrite", "deleteDraft", "window.location", "fetch("]);
const workspaceSource = readRepo("components/editorial-v2/ProjectWorkspacePanel.tsx");
checkTokens("workspace PA2", workspaceSource, ["Production Activation PA-2", "승인 checkpoint와 편집 draft를 분리 저장", "LOCAL-ONLY ENABLED", "SAFE BASE MATCH ONLY", "UNENCRYPTED", "draftSummary", "onApprovedProjectLoaded", "onProjectSelectionChange", "Draft Resume는 Approval Resume가 아니며"]);
checkForbiddenTokens("workspace PA2", workspaceSource, ["type=\"file\"", "localStorage", "indexedDB", "showDirectoryPicker", "webkitdirectory", "dangerouslySetInnerHTML", "http://", "https://"]);

const workbenchContracts = new Map([
  ["components/editorial-v2/ResearchImportWorkbench.tsx", ["ResearchImportDraftState", "initialDraftState", "draftHydrationKey", "onDraftStateChange", "non_canonical_draft", "pending_reconfirmation"]],
  ["components/editorial-v2/EditorialIntelligenceWorkbench.tsx", ["EditorialIntelligenceDraftState", "initialDraftState", "draftHydrationKey", "onDraftStateChange", "non_canonical_draft", "approvedTrendBrief"]],
  ["components/editorial-v2/ScenePlanningWorkbench.tsx", ["ScenePlanningDraftState", "initialDraftState", "draftHydrationKey", "onDraftStateChange", "non_canonical_draft", "approvedScript"]],
  ["components/editorial-v2/CharacterMotionWorkbench.tsx", ["CharacterMotionDraftState", "initialDraftState", "draftHydrationKey", "onDraftStateChange", "non_canonical_draft", "approvedSnapshot: null"]],
  ["components/editorial-v2/RenderIntegrationWorkbench.tsx", ["RenderIntegrationDraftState", "initialDraftState", "draftHydrationKey", "onDraftStateChange", "non_canonical_draft", "approvedRenderKey"]],
  ["components/editorial-v2/PublishIntegrationWorkbench.tsx", ["PublishIntegrationDraftState", "initialDraftState", "draftHydrationKey", "onDraftStateChange", "non_canonical_draft", "approvedPackageHash"]],
  ["components/editorial-v2/SampleRelaunchWorkbench.tsx", ["SampleRelaunchDraftState", "initialDraftState", "draftHydrationKey", "onDraftStateChange", "non_canonical_draft", "approvedIdentity"]],
]);
for (const [path, tokens] of workbenchContracts) {
  const source = readRepo(path);
  checkTokens(path, source, tokens);
  checkForbiddenTokens(path, source, ["localStorage", "indexedDB", "sessionStorage", "fetch(", "http://", "https://", "node:"]);
}

for (const path of ["package.json", "pnpm-lock.yaml", "lib/editorial-v2/contracts.ts", "lib/editorial-v2/persistence-contracts.ts", "lib/editorial-v2/project-store-node.ts", "lib/editorial-v2/project-api-client.ts", "app/api/editorial-v2/projects/route.ts", "app/api/editorial-v2/projects/[projectId]/route.ts"]) {
  const checkpoint = baseline.statusPaths.find((entry) => entry.path === path) ?? baseline.pa1Checkpoint.paths.find((entry) => entry.path === path);
  check(`dependency and PA1 boundary source ${path}`, Boolean(checkpoint) || path === "pnpm-lock.yaml");
  if (checkpoint) check(`dependency and PA1 boundary hash ${path}`, sha256(path) === checkpoint.sha256);
  else check(`dependency and PA1 boundary HEAD blob ${path}`, git(["hash-object", path]) === git(["rev-parse", `${baseline.git.head}:${path}`]));
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

const drafts = loadTs("lib/editorial-v2/draft-snapshot.ts");
const draftContracts = loadTs("lib/editorial-v2/draft-contracts.ts");
check("draft stage order exact seven", draftContracts.EDITORIAL_V2_DRAFT_STAGE_ORDER.length === 7);
check("draft debounce fixed", draftContracts.EDITORIAL_V2_DRAFT_AUTOSAVE_DEBOUNCE_MS === 1350);
check("draft max bytes 8MiB", draftContracts.EDITORIAL_V2_DRAFT_MAX_BYTES === 8_388_608);
check("draft raw aggregate 4MiB", draftContracts.EDITORIAL_V2_DRAFT_MAX_RAW_TEXT_BYTES === 4_194_304);

function sampleStageStates(marker, reverse = false) {
  const research = { stageId: "trend_brief_import", approvalAuthority: "non_canonical_draft", approvalLikeState: "pending_reconfirmation", researchInput: { researchCutoffDate: "2026-08-08", researchWindow: "7d", domain: "생활경제", audience: "성인", targetDurationSeconds: 30, additionalFocus: marker }, generatedPrompt: null, rawImport: `raw-${marker}`, normalizedPreview: null, rawHash: "", normalizedHash: "", validationSummary: null, sessionHashes: [], repairInput: "", repairPrompt: null, repairPreview: null, repairIssues: [], uiSelectionState: {}, approvalState: "approved" };
  const intelligence = { stageId: "editorial_intelligence", approvalAuthority: "non_canonical_draft", approvalLikeState: "pending_reconfirmation", session: { approvedTrendBrief: { marker }, evidenceReview: { status: "approved" }, selectedAngleApproval: "approved", scriptApproval: "approved" }, normalizationMethod: marker, scriptRawHash: "", scriptNormalizedHash: "", rawImportHashes: [], repairPrompt: null, repairPackage: null, repairIssues: [] };
  const scene = { stageId: "scene_planning", approvalAuthority: "non_canonical_draft", approvalLikeState: "pending_reconfirmation", session: { approvedScript: { marker }, sceneCards: [], sceneValidation: null, sceneCardApproval: "approved", visualPlan: [], visualProof: null, planningApproval: "approved" }, selectedSceneId: null };
  const character = { stageId: "character_motion", approvalAuthority: "non_canonical_draft", approvalLikeState: "pending_reconfirmation", session: { approvedPlanning: { marker }, representativeScene: null, selection: { approvalState: "provisionally_approved" }, validation: null, approvedSnapshot: { marker }, playbackState: "paused", previewSpeed: 1, reducedMotionPreview: false }, comparisonMotionTag: "idle_scan" };
  const render = { stageId: "render_integration", approvalAuthority: "non_canonical_draft", approvalLikeState: "pending_reconfirmation", voiceMode: "plan_only", locale: "ko-KR", voiceIdentity: marker, providerId: "", providerLabel: "", manualCostBasisLabel: "", ownerExternalApprovalConfirmed: false, targetDurationSeconds: 45, selectedProfileId: "preview_540x960", approvedVoiceKey: `voice-${marker}`, approvedRenderKey: `render-${marker}`, lastApprovedManifest: { marker } };
  const publish = { stageId: "publish_integration", approvalAuthority: "non_canonical_draft", approvalLikeState: "pending_reconfirmation", selectedPlatforms: ["instagram_reels"], instagramExpectedId: marker, instagramObservedId: "", instagramLabel: "", instagramOwnerConfirmed: false, youtubeExpectedId: "", youtubeObservedId: "", youtubeLabel: "", youtubeOwnerConfirmed: false, instagramHashtags: "", youtubeHashtags: "", instagramCoverSceneId: "", youtubeCoverSceneId: "", youtubeVisibility: "private", executionIntent: "immediate_future", scheduledAtIso: "", timezone: "Asia/Seoul", validationNowIso: "2026-08-08T00:00:00.000Z", scheduleOwnerConfirmation: false, ledger: { ledgerVersion: "session-publication-ledger-v1", sessionIdentity: marker, attempts: [], platformStates: [], durable: false, remoteSynchronized: false }, actualPublishNotIncludedConfirmed: false, approvedPackageHash: `package-${marker}` };
  const relaunch = { stageId: "relaunch_readiness", approvalAuthority: "non_canonical_draft", approvalLikeState: "pending_reconfirmation", selectedDirectionId: "", reviewedDirectionIds: [], identityDraft: { channelNameCandidate: marker, handleCandidates: "", oneLinePromise: "", primaryAudience: "", prohibitedWords: "", tagline: "" }, acknowledgementStates: { productionGapsAcknowledged: true, controlTowerApprovalAcknowledged: true }, approvedIdentity: `identity-${marker}` };
  const entries = [["trend_brief_import", research], ["editorial_intelligence", intelligence], ["scene_planning", scene], ["character_motion", character], ["render_integration", render], ["publish_integration", publish], ["relaunch_readiness", relaunch]];
  return Object.fromEntries(reverse ? entries.reverse() : entries);
}

const project = { projectId: "pa2-checker-project", revision: 7, lastApprovedStage: "relaunch_readiness", integrity: { canonicalHash: "a".repeat(64) } };
async function build(marker, reverse = false) {
  return drafts.buildEditorialV2FullDraftSnapshot({ projectId: project.projectId, draftRevision: 4, baseProjectRevision: project.revision, baseApprovedStage: project.lastApprovedStage, baseApprovedCheckpointHash: project.integrity.canonicalHash, savedAtIso: "2026-08-08T04:00:00.000Z", stageStates: sampleStageStates(marker, reverse), dirtyStageIds: [...draftContracts.EDITORIAL_V2_DRAFT_STAGE_ORDER].reverse() });
}

for (let index = 0; index < 120; index += 1) {
  const marker = `${index}-한글-${index % 7}-\r\n-${"x".repeat(index % 17)}`;
  const left = await build(marker, false);
  const right = await build(marker, true);
  const changed = await build(`${marker}-changed`, index % 2 === 0);
  const validation = await drafts.validateEditorialV2Draft(left);
  check(`stable hash key order ${index}`, left.draftHash === right.draftHash);
  check(`hash mutation sensitive ${index}`, left.draftHash !== changed.draftHash);
  check(`draft validation ${index}`, validation.valid && validation.issues.length === 0);
  const clone = drafts.cloneEditorialV2FullDraftSnapshot(left);
  check(`draft deep clone ${index}`, clone !== left && clone.stageStates !== left.stageStates && JSON.stringify(clone) === JSON.stringify(left));
}

const approvedDraft = await build("approval-sanitize");
const sanitized = await drafts.sanitizeHydratedDraftApprovals(approvedDraft, project);
check("sanitize research approval", sanitized.stageStates.trend_brief_import.approvalState === "pending_reconfirmation");
check("sanitize intelligence approved upstream", sanitized.stageStates.editorial_intelligence.session.approvedTrendBrief === null);
check("sanitize intelligence evidence", sanitized.stageStates.editorial_intelligence.session.evidenceReview.status === "not_reviewed");
check("sanitize intelligence angle", sanitized.stageStates.editorial_intelligence.session.selectedAngleApproval === "invalidated");
check("sanitize intelligence script", sanitized.stageStates.editorial_intelligence.session.scriptApproval === "invalidated");
check("sanitize scene upstream", sanitized.stageStates.scene_planning.session.approvedScript === null);
check("sanitize scene card approval", sanitized.stageStates.scene_planning.session.sceneCardApproval === "invalidated");
check("sanitize scene planning approval", sanitized.stageStates.scene_planning.session.planningApproval === "invalidated");
check("sanitize character upstream", sanitized.stageStates.character_motion.session.approvedPlanning === null);
check("sanitize character snapshot", sanitized.stageStates.character_motion.session.approvedSnapshot === null);
check("sanitize character provisional", sanitized.stageStates.character_motion.session.selection.approvalState === "invalidated");
check("sanitize render voice", sanitized.stageStates.render_integration.approvedVoiceKey === null);
check("sanitize render package", sanitized.stageStates.render_integration.approvedRenderKey === null && sanitized.stageStates.render_integration.lastApprovedManifest === null);
check("sanitize publish package", sanitized.stageStates.publish_integration.approvedPackageHash === null);
check("sanitize relaunch identity", sanitized.stageStates.relaunch_readiness.approvedIdentity === null);
check("sanitize relaunch acknowledgements", sanitized.stageStates.relaunch_readiness.acknowledgementStates.productionGapsAcknowledged === false && sanitized.stageStates.relaunch_readiness.acknowledgementStates.controlTowerApprovalAcknowledged === false);
const safeDecision = await drafts.decideDraftHydration(approvedDraft, project);
check("safe hydration exact base", safeDecision.safe && safeDecision.autoHydrate && safeDecision.status === "safe_to_hydrate" && safeDecision.approvalDowngraded);
check("project mismatch blocked", (await drafts.decideDraftHydration(approvedDraft, { ...project, projectId: "other-project" })).status === "project_mismatch");
check("revision mismatch blocked", (await drafts.decideDraftHydration(approvedDraft, { ...project, revision: 8 })).status === "revision_conflict");
check("checkpoint hash mismatch blocked", (await drafts.decideDraftHydration(approvedDraft, { ...project, integrity: { canonicalHash: "b".repeat(64) } })).status === "stale_draft");
check("approved stage mismatch blocked", (await drafts.decideDraftHydration(approvedDraft, { ...project, lastApprovedStage: "publish_integration" })).status === "stale_draft");

const mutationCases = [
  ["draft_namespace_mismatch", (value) => { value.namespace = "wrong"; }],
  ["draft_schema_mismatch", (value) => { value.schemaVersion = "9"; }],
  ["draft_project_id_invalid", (value) => { value.projectId = "../escape"; }],
  ["draft_revision_invalid", (value) => { value.draftRevision = -1; }],
  ["draft_base_revision_invalid", (value) => { value.baseProjectRevision = -1; }],
  ["draft_base_checkpoint_hash_invalid", (value) => { value.baseApprovedCheckpointHash = "bad"; }],
  ["draft_saved_at_invalid", (value) => { value.savedAtIso = "now"; }],
  ["draft_stage_key_unsupported", (value) => { value.stageStates.unknown = { stageId: "unknown", approvalAuthority: "non_canonical_draft" }; }],
  ["draft_stage_identity_mismatch", (value) => { value.stageStates.trend_brief_import.stageId = "scene_planning"; }],
  ["draft_authority_invalid", (value) => { value.stageStates.trend_brief_import.approvalAuthority = "canonical"; }],
  ["draft_dirty_stage_ids_invalid", (value) => { value.dirtyStageIds = ["trend_brief_import", "trend_brief_import"]; }],
  ["draft_integrity_contract_invalid", (value) => { value.integrity.algorithm = "md5"; }],
  ["draft_integrity_mismatch", (value) => { value.draftHash = "0".repeat(64); }],
];
for (const [expectedCode, mutate] of mutationCases) {
  const candidate = JSON.parse(JSON.stringify(approvedDraft));
  mutate(candidate);
  const validation = await drafts.validateEditorialV2Draft(candidate);
  check(`mutation blocked ${expectedCode}`, !validation.valid);
  check(`mutation code ${expectedCode}`, validation.issues.some((issue) => issue.code === expectedCode));
}

const unsupportedValues = [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY, 1n, Symbol("x"), () => 1, new Date(), Object.create({ inherited: true })];
for (const [index, unsupported] of unsupportedValues.entries()) {
  let blocked = false;
  try {
    const states = sampleStageStates(`unsupported-${index}`);
    states.trend_brief_import.unsupported = unsupported;
    await drafts.buildEditorialV2FullDraftSnapshot({ projectId: project.projectId, draftRevision: 0, baseProjectRevision: 0, baseApprovedStage: null, baseApprovedCheckpointHash: "c".repeat(64), savedAtIso: "2026-08-08T04:00:00.000Z", stageStates: states, dirtyStageIds: [] });
  } catch { blocked = true; }
  check(`unsupported JSON blocked ${index}`, blocked);
}
let cyclicBlocked = false;
try {
  const states = sampleStageStates("cyclic");
  states.trend_brief_import.self = states.trend_brief_import;
  await drafts.buildEditorialV2FullDraftSnapshot({ projectId: project.projectId, draftRevision: 0, baseProjectRevision: 0, baseApprovedStage: null, baseApprovedCheckpointHash: "d".repeat(64), savedAtIso: "2026-08-08T04:00:00.000Z", stageStates: states, dirtyStageIds: [] });
} catch { cyclicBlocked = true; }
check("cyclic JSON blocked", cyclicBlocked);

const targetFiles = baseline.pa2Allowlist.filter((entry) => entry.path.endsWith(".ts") || entry.path.endsWith(".tsx")).map((entry) => entry.path);
const config = ts.readConfigFile(resolve(root, "tsconfig.json"), ts.sys.readFile);
check("TypeScript config readable", !config.error);
const parsedConfig = ts.parseJsonConfigFileContent(config.config, ts.sys, root);
check("TypeScript strict true", parsedConfig.options.strict === true);
const program = ts.createProgram(parsedConfig.fileNames, { ...parsedConfig.options, noEmit: true });
for (const path of targetFiles) {
  const sourceFile = program.getSourceFile(resolve(root, path));
  check(`TypeScript source included ${path}`, Boolean(sourceFile));
  check(`TypeScript syntactic zero ${path}`, Boolean(sourceFile) && program.getSyntacticDiagnostics(sourceFile).length === 0);
  check(`TypeScript semantic zero ${path}`, Boolean(sourceFile) && program.getSemanticDiagnostics(sourceFile).length === 0);
}

checkTokens("draft probe contract", readRepo("scripts/probe-shorts-editorial-os-v2-pa2-draft.mjs"), ["mkdtempSync", "synthetic_probe", "sevenStageDraftPersisted", "draft_revision_conflict", "base_project_conflict", "corruptionText", "recoverDraftFromLastKnownGood", "approvedSnapshotUnchanged", "approvalDowngradeVerified", "projectMismatchBlocked", "schemaMismatchBlocked", "sizeLimitBlocked", "temporaryDirectoryRemoved", "repositoryStatusUnchanged", "repositoryHashesUnchanged", "SHORTS_EDITORIAL_OS_V2_PA2_DRAFT_PERSISTENCE_PROOF_PASS"]);
checkTokens("runtime probe contract", readRepo("scripts/probe-shorts-editorial-os-v2-pa2-runtime.mjs"), ["playwright", "127.0.0.1", "SHORTS_EDITORIAL_OS_V2_ENABLED", "SHORTS_EDITORIAL_OS_V2_LOCAL_PERSISTENCE_ENABLED", "SHORTS_EDITORIAL_OS_V2_DATA_ROOT", "NEXT_TELEMETRY_DISABLED", "uiProjectCreated", "rawTextareaExactRestored", "sameOriginFullDraftApiSeeded", "data-pa2-stage-count", "twoTabRaceExecuted", "secondTabConflictObserved", "conflictedTabOverwriteBlocked", "repositoryHashesUnchanged", "SHORTS_EDITORIAL_OS_V2_PA2_RUNTIME_PROOF_PASS"]);
checkTokens("PROJECT_STATE PA2", readRepo("_ai/PROJECT_STATE.md"), ["PA-1: `FINAL_PASS`", "PA-2: `IMPLEMENTATION_COMPLETE_AWAITING_CROSS_REVIEW`", "PA-2 Cross Review: `NOT_STARTED`", "correction cycle: `2`", "PA-3: `BLOCKED`", "full draft autosave: `IMPLEMENTED_PENDING_REVIEW`", "full Workbench hydration: `IMPLEMENTED_PENDING_REVIEW`", "draft approval authority: `NON_CANONICAL`", "approved checkpoint authority: `CANONICAL`", "Local browser runtime proof: final `PASS`", "external request `0`", "ERR_PNPM_IGNORED_BUILDS", "cloud sync: `NOT_IMPLEMENTED`", "encryption at rest: `NOT_IMPLEMENTED`", "product operational capability: `NOT_CLAIMED`", "Push: `NOT_AUTHORIZED`", "progress: `NOT_CALCULATED`"]);
checkTokens("NEXT_ACTION PA2", readRepo("_ai/NEXT_ACTION.md"), ["Claude Code PA-2 read-only Cross Review", "ChatGPT 중간 전달 불필요", "Claude 결과를 Codex에 전달", "exact 23-path", "최대 2회", "PA-3 자동 시작 금지", "feat(editorial-v2): checkpoint production activation draft resume"]);
checkForbiddenTokens("draft probe", readRepo("scripts/probe-shorts-editorial-os-v2-pa2-draft.mjs"), ["C:\\tmp\\ShortsEditorialOSV2", "http://", "https://", "fetch(", "node:https", "node:http"]);

const totalBeforeMinimum = pass + fail;
check("meaningful check minimum 650", totalBeforeMinimum >= 650, String(totalBeforeMinimum));
if (fail > 0) {
  console.error(`SHORTS_EDITORIAL_OS_V2_PA2_CHECK_FAIL ${pass}/${pass + fail} PASS`);
  process.exit(1);
}
console.log(`SHORTS_EDITORIAL_OS_V2_PA2_CHECK_PASS ${pass}/${pass + fail}`);
