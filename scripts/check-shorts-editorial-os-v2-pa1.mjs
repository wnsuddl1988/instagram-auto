import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const root = resolve(process.cwd());
const baselinePath = "_ai/SHORTS_EDITORIAL_OS_V2_PA1_BASELINE.json";
const baseline = JSON.parse(readFileSync(resolve(root, baselinePath), "utf8"));
let pass = 0;
let fail = 0;

function check(label, condition, detail = "") {
  if (condition) { pass += 1; return; }
  fail += 1;
  console.error(`FAIL ${label}${detail ? ` :: ${detail}` : ""}`);
}

function checkTokens(label, source, tokens) {
  for (const token of tokens) check(`${label}: ${token}`, source.includes(token));
}

function checkForbiddenTokens(label, source, tokens) {
  for (const token of tokens) check(`${label} excludes ${token}`, !source.includes(token));
}

function readRepo(path) { return readFileSync(resolve(root, path), "utf8"); }
function sha256(path) { return createHash("sha256").update(readFileSync(resolve(root, path))).digest("hex"); }
function git(args, raw = false) {
  const result = spawnSync("git", args, { cwd: root, encoding: "utf8", windowsHide: true, maxBuffer: 32 * 1024 * 1024 });
  if (result.status !== 0 || result.error) throw new Error(result.stderr || result.error?.message || `git ${args.join(" ")} failed`);
  return raw ? result.stdout : result.stdout.trim();
}

check("repository root", resolve(git(["rev-parse", "--show-toplevel"])) === root);
check("manifest exists", existsSync(resolve(root, baselinePath)));
check("manifest version", baseline.manifestVersion === "1.0.0");
check("manifest repository", baseline.repository === "Shorts Editorial OS V2");
check("manifest reconstructability", baseline.baselineReconstructability === "NOT_RECONSTRUCTABLE");
check("manifest branch", baseline.git.branch === "codex/source-first-blueprint-clean");
check("manifest HEAD", baseline.git.head === "a31a2db8cb092786165064987d134536ebfcfce3");
check("manifest parent", baseline.git.parent === "9a29fd4d2fd3e828a45f31d0c0ee2332465b4a62");
check("manifest upstream", baseline.git.upstream.ahead === 9 && baseline.git.upstream.behind === 0);
check("manifest starting counts", baseline.git.modifiedCount === 21 && baseline.git.untrackedCount === 3 && baseline.git.stagedCount === 0 && baseline.git.statusPathCount === 24);
check("manifest starting status exact", baseline.statusPaths.length === 24);
check("manifest exact allowlist", baseline.pa1ExactAllowlist.length === 20 && new Set(baseline.pa1ExactAllowlist).size === 20);
check("manifest new allowlist", baseline.pa1NewFileAllowlist.length === 15);
check("manifest modified allowlist", baseline.pa1ModifiedFileAllowlist.length === 5);
check("manifest protection exceptions", JSON.stringify(baseline.protectionExceptions) === JSON.stringify(["_ai/PROJECT_STATE.md", "_ai/NEXT_ACTION.md"]));
check("manifest governance entries", baseline.governanceCriticalPaths.length === 2);
check("manifest checkpoint entries broad", baseline.checkpointCriticalPaths.length >= 85);
check("manifest critical exceptions", baseline.criticalAllowlistExceptions.length === 3);
check("current HEAD unchanged", git(["rev-parse", "HEAD"]) === baseline.git.head);
check("current parent unchanged", git(["show", "-s", "--format=%P", "HEAD"]) === baseline.git.parent);
check("current ahead nine", Number(git(["rev-list", "--count", "@{upstream}..HEAD"])) === 9);
check("current behind zero", Number(git(["rev-list", "--count", "HEAD..@{upstream}"])) === 0);

const porcelain = git(["status", "--porcelain=v1", "-z", "--untracked-files=all"], true);
const statusEntries = porcelain.split("\0").filter(Boolean).map((entry) => ({ status: entry.slice(0, 2), path: entry.slice(3).replaceAll("\\", "/") }));
const expectedPaths = new Set([...baseline.statusPaths.map((entry) => entry.path), ...baseline.pa1ExactAllowlist]);
const actualPaths = new Set(statusEntries.map((entry) => entry.path));
check("working status exact 44", statusEntries.length === 44, String(statusEntries.length));
check("working modified exact 26", statusEntries.filter((entry) => entry.status === " M").length === 26);
check("working untracked exact 18", statusEntries.filter((entry) => entry.status === "??").length === 18);
check("working staged zero", statusEntries.every((entry) => entry.status === "??" || entry.status[0] === " "));
check("working rename zero", statusEntries.every((entry) => !entry.status.includes("R")));
check("working delete zero", statusEntries.every((entry) => !entry.status.includes("D")));
check("working path set exact", actualPaths.size === expectedPaths.size && [...actualPaths].every((path) => expectedPaths.has(path)));
for (const path of baseline.pa1NewFileAllowlist) check(`new file untracked ${path}`, statusEntries.some((entry) => entry.path === path && entry.status === "??"));
for (const path of baseline.pa1ModifiedFileAllowlist) check(`modified file unstaged ${path}`, statusEntries.some((entry) => entry.path === path && entry.status === " M"));
for (const entry of baseline.statusPaths) {
  check(`protected status ${entry.path}`, statusEntries.some((candidate) => candidate.path === entry.path && candidate.status === entry.status));
  check(`protected hash ${entry.path}`, sha256(entry.path) === entry.sha256);
}
for (const entry of [...baseline.governanceCriticalPaths, ...baseline.checkpointCriticalPaths]) {
  const criticalPath = entry.path.replaceAll("\\", "/");
  if (baseline.pa1ModifiedFileAllowlist.includes(criticalPath)) continue;
  check(`critical exists ${criticalPath}`, existsSync(resolve(root, criticalPath)));
  check(`critical hash ${criticalPath}`, sha256(criticalPath) === entry.sha256);
}
check("middleware absent", !existsSync(resolve(root, "middleware.ts")) && !existsSync(resolve(root, "src/middleware.ts")));
check("git diff check", spawnSync("git", ["diff", "--check"], { cwd: root, encoding: "utf8", windowsHide: true }).status === 0);

const contracts = readRepo("lib/editorial-v2/contracts.ts");
const originalContracts = git(["show", `${baseline.git.head}:lib/editorial-v2/contracts.ts`]).replaceAll("\r\n", "\n");
let contractCursor = 0;
let contractsAdditive = true;
for (const line of originalContracts.split("\n").filter((line) => line.trim())) {
  const next = contracts.replaceAll("\r\n", "\n").indexOf(line, contractCursor);
  if (next < 0) { contractsAdditive = false; break; }
  contractCursor = next + line.length;
}
check("contracts original lines preserved in order", contractsAdditive);
checkForbiddenTokens("contracts", contracts, [" any;", ": any", "<any>", "readonly?:", "// @ts-ignore", "// @ts-expect-error"]);
const artifactBlock = contracts.match(/EDITORIAL_V2_ARTIFACT_KINDS\s*=\s*\[([\s\S]*?)\]\s*as const/u)?.[1] ?? "";
const qualityBlock = contracts.match(/EDITORIAL_V2_QUALITY_GATES\s*=\s*\[([\s\S]*?)\]\s*as const/u)?.[1] ?? "";
const sceneCardBlock = contracts.match(/export interface SceneCard \{([\s\S]*?)\n\}/u)?.[1] ?? "";
check("artifact kind remains 12", (artifactBlock.match(/"[^"]+"/gu) ?? []).length === 12);
check("quality gate remains 11", (qualityBlock.match(/"[^"]+"/gu) ?? []).length === 11);
check("SceneCard remains 15 fields", (sceneCardBlock.match(/^  readonly /gmu) ?? []).length === 15);
checkTokens("PA-1 contract types", contracts, [
  "EditorialV2ProjectId", "EditorialV2ProjectStatus", "EditorialV2ApprovedStageId", "EditorialV2ProjectMetadata", "EditorialV2RawArtifactRecord",
  "EditorialV2ApprovedCheckpoint", "EditorialV2ProjectSnapshot", "EditorialV2ProjectIndexEntry", "EditorialV2ProjectIndex", "EditorialV2SnapshotIntegrity",
  "EditorialV2StoreWriteResult", "EditorialV2StoreReadResult", "EditorialV2RecoveryResult", "EditorialV2PersistenceCapability", "EditorialV2PersistenceStatus",
  "EditorialV2PersistenceValidationIssue", "EditorialV2PersistenceValidationSummary", "EditorialV2LocalStoreConfiguration", "EditorialV2WorkspaceState",
]);
checkTokens("PA-1 honesty contract", contracts, ["fullDraftAutosave: false", "fullWorkbenchHydration: false", "v1Migration: false", "localOnly: true", "approvedOnly: true", "fullDraftIncluded: false", "V1_ISOLATED_NO_MIGRATION"]);

const requiredModules = new Map([
  ["lib/editorial-v2/persistence-contracts.ts", ["SHORTS_EDITORIAL_OS_V2_LOCAL_PERSISTENCE_ENABLED", "SHORTS_EDITORIAL_OS_V2_DATA_ROOT", "parseEditorialV2LocalPersistenceEnabled", "EDITORIAL_V2_APPROVED_STAGE_ORDER", "EDITORIAL_V2_MAX_REQUEST_BYTES"]],
  ["lib/editorial-v2/persistence-data-root.ts", ["resolveEditorialV2LocalStoreConfiguration", "assertEditorialV2SafeDataRoot", "isEditorialV2PathContained", "%LOCALAPPDATA%", "ShortsEditorialOSV2", "DATA_ROOT_REPOSITORY_OVERLAP", "DATA_ROOT_V1_OVERLAP"]],
  ["lib/editorial-v2/project-snapshot.ts", ["buildEditorialV2ProjectSnapshot", "cloneEditorialV2ProjectSnapshot", "hashEditorialV2ProjectSnapshot", "validateEditorialV2ProjectSnapshot", "getLastApprovedStage", "buildEditorialV2ProjectId", "stableSerialize", "sha256", "JSON_UNSUPPORTED_PROTOTYPE"]],
  ["lib/editorial-v2/project-store-validation.ts", ["validateEditorialV2ProjectCreateRequest", "validateEditorialV2CheckpointWriteRequest", "validateEditorialV2LocalStoreConfiguration", "validateEditorialV2SnapshotForStore", "raw_artifact_total_too_large"]],
  ["lib/editorial-v2/project-store-node.ts", ["createProject", "listProjects", "readProject", "writeProjectCheckpoint", "archiveProject", "verifyProjectIntegrity", "atomicWriteText", "last-known-good", "revision-", "wx", "handle.sync", "rename", "SYMLINK_OR_JUNCTION_PATH_FORBIDDEN", "PROJECT_PATH_ESCAPE_BLOCKED", "PROJECT_ARCHIVED_WITHOUT_DELETE"]],
  ["lib/editorial-v2/project-recovery.ts", ["inspectProjectRecoveryState", "recoverFromLastKnownGood", "compareProjectRevisions", "buildProjectRecoveryPlan", "ownerConfirmationRequired", "preserveCorruptedCurrent", "automaticExecution: false"]],
  ["lib/editorial-v2/project-api-client.ts", ["listEditorialV2Projects", "createEditorialV2Project", "loadEditorialV2Project", "saveEditorialV2ApprovedCheckpoint", "archiveEditorialV2Project", "requestEditorialV2Recovery", "Same-origin", "AbortController", "timeoutMs"]],
]);
for (const [path, tokens] of requiredModules) {
  const source = readRepo(path);
  checkTokens(path, source, tokens);
}

const dataRootSource = readRepo("lib/editorial-v2/persistence-data-root.ts");
checkForbiddenTokens("data root", dataRootSource, ["C:\\tmp\\ShortsEditorialOSV2", "localStorage", "IndexedDB", "fetch(", "axios", "child_process"]);
const storeSource = readRepo("lib/editorial-v2/project-store-node.ts");
checkForbiddenTokens("node store", storeSource, ["fetch(", "XMLHttpRequest", "WebSocket", "node:http", "node:https", "child_process", "spawn(", "exec(", "rm(", "rmdir(", "hardDelete", "export async function DELETE"]);
check("node store unlink limited to temp cleanup", (storeSource.match(/unlink\(/gu) ?? []).length === 1 && storeSource.includes("unlink(temporary)"));
const clientSource = readRepo("lib/editorial-v2/project-api-client.ts");
checkForbiddenTokens("browser client", clientSource, ["node:", "process.env", "localStorage", "indexedDB", "sessionStorage", "http://", "https://", "module-level cache"]);
check("client URLs rooted at same-origin API", clientSource.includes('const API_ROOT = "/api/editorial-v2/projects"'));

const collectionRoute = readRepo("app/api/editorial-v2/projects/route.ts");
const itemRoute = readRepo("app/api/editorial-v2/projects/[projectId]/route.ts");
checkTokens("collection route", collectionRoute, ["export async function GET", "export async function POST", "LOCAL_PERSISTENCE_DISABLED", "CONTENT_TYPE_JSON_REQUIRED", "REQUEST_BODY_TOO_LARGE", "CLIENT_DATA_ROOT_FORBIDDEN", "action: \"create\""]);
checkTokens("item route", itemRoute, ["export async function GET", "export async function PUT", "export async function PATCH", "save_approved_checkpoint", "integrity_conflict", "schema_conflict", "ownerConfirmed", "recoverFromLastKnownGood"]);
checkForbiddenTokens("collection route", collectionRoute, ["export async function DELETE", "Access-Control-Allow-Origin", "dataRoot:", "stack"]);
checkForbiddenTokens("item route", itemRoute, ["export async function DELETE", "Access-Control-Allow-Origin", "dataRoot:", "stack", "http://", "https://"]);

const workspaceSource = readRepo("components/editorial-v2/ProjectWorkspacePanel.tsx");
checkTokens("Workspace UI", workspaceSource, ["Project Workspace", "Local only", "Full draft autosave: NOT IMPLEMENTED", "Workbench form hydration: NOT IMPLEMENTED", "V1 data: ISOLATED", "data root path: HIDDEN", "Create local V2 project", "Load approved checkpoint summary", "Save Approved Checkpoint", "Resume from approved checkpoint", "Owner가 corruption 복구 실행", "Archive without delete"]);
checkForbiddenTokens("Workspace UI", workspaceSource, ["type=\"file\"", "localStorage", "indexedDB", "dangerouslySetInnerHTML", "webkitdirectory", "showDirectoryPicker", "dataRoot", "http://", "https://"]);
const workspaceCss = readRepo("components/editorial-v2/ProjectWorkspacePanel.module.css");
checkTokens("Workspace CSS", workspaceCss, [".panel", ".header", ".status", '[data-state="enabled"]', ".boundary", ".grid", ".card", ".confirm", ".summary", ":focus-visible", "@media (max-width: 820px)"]);
const editorialSource = readRepo("components/editorial-v2/EditorialV2Workbench.tsx");
checkTokens("orchestration", editorialSource, ["ProjectWorkspacePanel", "approvedCheckpointOptions", "trend_brief_import", "editorial_intelligence", "scene_planning", "character_motion", "render_integration", "publish_integration", "relaunch_readiness", "currentSessionStage", "승인 checkpoint만 local-only로 저장"]);
const relaunchSource = readRepo("components/editorial-v2/SampleRelaunchWorkbench.tsx");
checkTokens("relaunch callback", relaunchSource, ["onApprovedRelaunchReadinessChange(null)", "sourcePublishIntegrationIdentity", "representativePackage.provenance.publishIntegrationIdentity"]);

const activationPlan = readRepo("_ai/SHORTS_EDITORIAL_OS_V2_PRODUCTION_ACTIVATION_PLAN.md");
for (let index = 1; index <= 15; index += 1) check(`activation plan section ${index}`, activationPlan.includes(`## ${index}.`));
checkTokens("activation plan boundaries", activationPlan, ["FINAL_PASS", "approved checkpoint", "full draft autosave", "PA-2 후보", "PA-3 후보", "PA-4 후보", "PA-5 후보", "PA-6 후보", "PA-7 후보", "Rollback", "V1 cutover", "Push·deploy·external cost", "product operational capability = NOT_CLAIMED"]);

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

const persistence = loadTs("lib/editorial-v2/persistence-contracts.ts");
const roots = loadTs("lib/editorial-v2/persistence-data-root.ts");
const snapshots = loadTs("lib/editorial-v2/project-snapshot.ts");
const validations = loadTs("lib/editorial-v2/project-store-validation.ts");

for (const value of ["1", "true"]) check(`feature enabled exact ${value}`, persistence.parseEditorialV2LocalPersistenceEnabled(value) === true);
for (const value of [undefined, null, "", "0", "false", "TRUE", "True", " true", "true ", "01", 1, true, {}, []]) check(`feature fails closed ${JSON.stringify(value)}`, persistence.parseEditorialV2LocalPersistenceEnabled(value) === false);
check("capability checkpoint true", persistence.getEditorialV2PersistenceCapability().approvedCheckpointPersistence === true);
check("capability autosave false", persistence.getEditorialV2PersistenceCapability().fullDraftAutosave === false);
check("capability hydration false", persistence.getEditorialV2PersistenceCapability().fullWorkbenchHydration === false);
check("stage order exact seven", persistence.EDITORIAL_V2_APPROVED_STAGE_ORDER.length === 7);

const safeRootOptions = {
  env: { SHORTS_EDITORIAL_OS_V2_LOCAL_PERSISTENCE_ENABLED: "1", LOCALAPPDATA: "C:\\Users\\Tester\\AppData\\Local" },
  repositoryRoot: "C:\\work\\instagram-auto",
  workingDirectory: "C:\\work\\instagram-auto",
  homeDirectory: "C:\\Users\\Tester",
  platform: "win32",
};
const defaultConfiguration = roots.resolveEditorialV2LocalStoreConfiguration(safeRootOptions);
check("default root enabled", defaultConfiguration.enabled === true);
check("default root app data", defaultConfiguration.dataRoot.endsWith("ShortsEditorialOSV2"));
check("default root not C tmp", !defaultConfiguration.dataRoot.toLowerCase().startsWith("c:\\tmp"));
check("default root hidden", defaultConfiguration.exposeDataRoot === false);
check("default root kind", defaultConfiguration.dataRootKind === "os_application_data");
const overrideConfiguration = roots.resolveEditorialV2LocalStoreConfiguration({ ...safeRootOptions, env: { ...safeRootOptions.env, SHORTS_EDITORIAL_OS_V2_DATA_ROOT: "C:\\safe-data\\pa1" }, syntheticProbe: true });
check("override deterministic", overrideConfiguration.dataRoot.toLowerCase() === resolve("C:\\safe-data\\pa1").toLowerCase());
check("override probe kind", overrideConfiguration.dataRootKind === "synthetic_probe");

const containmentCases = [
  ["C:\\safe", "C:\\safe", true], ["C:\\safe", "C:\\safe\\child", true], ["C:\\safe", "C:\\safe2", false], ["C:\\safe\\child", "C:\\safe", false],
  ["C:\\A", "C:\\a\\b\\c", true], ["C:\\A\\B", "C:\\a\\b\\..\\b\\c", true], ["C:\\A\\B", "D:\\A\\B", false], ["C:\\one", "C:\\two", false],
];
for (const [parent, candidate, expected] of containmentCases) check(`containment ${parent} -> ${candidate}`, roots.isEditorialV2PathContained(parent, candidate) === expected);
const invalidRoots = [
  "relative\\path", "C:\\work\\instagram-auto", "C:\\work\\instagram-auto\\data", "C:\\work", "C:\\tmp\\money-shorts-os", "C:\\tmp\\money-shorts-os\\v2", "C:\\tmp", "C:\\", "C:\\work\\instagram-auto\\..\\instagram-auto",
];
for (const candidate of invalidRoots) {
  let blocked = false;
  try { roots.assertEditorialV2SafeDataRoot(candidate, "C:\\work\\instagram-auto", "C:\\work\\instagram-auto"); } catch { blocked = true; }
  check(`unsafe data root blocked ${candidate}`, blocked);
}
let nullRootBlocked = false;
try { roots.assertEditorialV2SafeDataRoot("C:\\safe\0root", "C:\\work\\instagram-auto", "C:\\work\\instagram-auto"); } catch { nullRootBlocked = true; }
check("null byte root blocked", nullRootBlocked);

const baseNames = ["Evidence Lab", "Daily Economy", "Hidden Connection", "CON", "NUL", "COM1", "한글 프로젝트", "Crème Café", "dots...name", "slash/name", "back\\name", " spaced   name ", "UPPER CASE", "123 Project", "a", "프로젝트 2026"];
const projectNames = [];
for (let round = 0; round < 4; round += 1) for (const name of baseNames) projectNames.push(`${name} ${round}`);
for (const [index, name] of projectNames.entries()) {
  const timestamp = `2026-08-${String(1 + (index % 20)).padStart(2, "0")}T${String(index % 24).padStart(2, "0")}:00:00.000Z`;
  const first = snapshots.buildEditorialV2ProjectId(name, timestamp);
  const second = snapshots.buildEditorialV2ProjectId(name, timestamp);
  check(`project id deterministic ${index}`, first === second);
  check(`project id characters ${index}`, /^[a-z0-9]+(?:-[a-z0-9]+)*$/u.test(first));
  check(`project id length ${index}`, first.length <= 80 && first.length >= 9);
  check(`project id no traversal ${index}`, !first.includes("..") && !first.includes("/") && !first.includes("\\"));
  check(`project id validator ${index}`, snapshots.isEditorialV2ProjectId(first));
}
for (const value of ["", ".", "..", "../x", "a/b", "a\\b", "CON", "NUL", "UPPER-x", "has space", "under_score", "-leading", "trailing-", "double--dash", "x".repeat(81), "한글", null, 42, {}, []]) check(`invalid direct project id ${JSON.stringify(value)}`, snapshots.isEditorialV2ProjectId(value) === false);

const creationTimestamp = "2026-08-06T10:00:00.000Z";
const projectId = snapshots.buildEditorialV2ProjectId("PA1 Synthetic Project", creationTimestamp);
const metadata = { displayName: "PA1 Synthetic Project", status: "active", createdAtIso: creationTimestamp, updatedAtIso: creationTimestamp, archivedAtIso: null };
const rawTexts = ["plain", "line1\nline2", "한글 원문", "emoji 🧪", "quotes \"exact\"", "tabs\tstay", "CRLF\r\ntext", " leading", "trailing ", "\n", "0", "null", "{}", "[]", "é", "漢字", "العربية", "comma,value", "colon:value", "backslash\\value", "${notInterpolation}", "source/date", "100%", "끝"];
for (const [index, rawText] of rawTexts.entries()) {
  const record = snapshots.buildEditorialV2RawArtifactRecord({ artifactId: `raw-artifact-${String(index).padStart(2, "0")}`, artifactKind: "trend_brief_raw_text", sourceStage: "trend_brief_import", rawText, importedAtIso: creationTimestamp });
  check(`raw exact ${index}`, record.rawText === rawText);
  check(`raw sha256 ${index}`, /^[a-f0-9]{64}$/u.test(record.rawHash));
  check(`raw trust ${index}`, record.trust === "UNTRUSTED_DATA");
}

const stageOrder = persistence.EDITORIAL_V2_APPROVED_STAGE_ORDER;
const checkpoints = stageOrder.map((stageId, index) => snapshots.buildEditorialV2ApprovedCheckpoint({ stageId, approvedAtIso: `2026-08-06T10:00:0${index}.000Z`, sourceIdentity: `source-${index}`, payload: { stageId, nested: { index, values: [index, `value-${index}`] } } }));
for (let index = 0; index < checkpoints.length; index += 1) {
  const selected = checkpoints.slice(0, index + 1);
  const snapshot = snapshots.buildEditorialV2ProjectSnapshot({ projectId, metadata: { ...metadata, updatedAtIso: `2026-08-06T10:00:0${index}.000Z` }, createdAtIso: creationTimestamp, updatedAtIso: `2026-08-06T10:00:0${index}.000Z`, revision: index + 1, approvedCheckpoints: selected, rawArtifacts: [], currentStage: stageOrder[index] });
  check(`stage snapshot valid ${index}`, snapshots.validateEditorialV2ProjectSnapshot(snapshot).valid);
  check(`stage last approved ${index}`, snapshots.getLastApprovedStage(snapshot) === stageOrder[index]);
  check(`stage integrity ${index}`, snapshots.hashEditorialV2ProjectSnapshot(snapshot) === snapshot.integrity.canonicalHash);
  check(`stage capability honest ${index}`, snapshot.persistenceCapabilities.fullDraftAutosave === false && snapshot.persistenceCapabilities.fullWorkbenchHydration === false);
}

for (let index = 0; index < 40; index += 1) {
  const left = snapshots.buildEditorialV2ApprovedCheckpoint({ stageId: "trend_brief_import", approvedAtIso: creationTimestamp, sourceIdentity: `stable-${index}`, payload: { z: index, a: { y: `v-${index}`, b: [index, true] } } });
  const right = snapshots.buildEditorialV2ApprovedCheckpoint({ stageId: "trend_brief_import", approvedAtIso: creationTimestamp, sourceIdentity: `stable-${index}`, payload: { a: { b: [index, true], y: `v-${index}` }, z: index } });
  check(`stable key hash ${index}`, left.payloadHash === right.payloadHash);
  check(`stable key checkpoint id ${index}`, left.checkpointId === right.checkpointId);
}

for (let index = 0; index < 20; index += 1) {
  const mutable = { nested: { values: [index, index + 1] } };
  const checkpoint = snapshots.buildEditorialV2ApprovedCheckpoint({ stageId: "trend_brief_import", approvedAtIso: creationTimestamp, sourceIdentity: `isolation-${index}`, payload: mutable });
  mutable.nested.values[0] = 9999;
  check(`checkpoint deep isolation ${index}`, checkpoint.payload.nested.values[0] === index);
}

const validSnapshot = snapshots.buildEditorialV2ProjectSnapshot({ projectId, metadata, createdAtIso: creationTimestamp, updatedAtIso: creationTimestamp, revision: 1, approvedCheckpoints: [checkpoints[0]], rawArtifacts: [snapshots.buildEditorialV2RawArtifactRecord({ artifactId: "raw-main", artifactKind: "trend_brief_raw_text", sourceStage: "trend_brief_import", rawText: "exact raw\ntext", importedAtIso: creationTimestamp })], currentStage: "trend_brief_import" });
check("valid baseline snapshot", snapshots.validateEditorialV2ProjectSnapshot(validSnapshot).valid);
check("snapshot clone new root", snapshots.cloneEditorialV2ProjectSnapshot(validSnapshot) !== validSnapshot);
check("snapshot clone nested isolation", snapshots.cloneEditorialV2ProjectSnapshot(validSnapshot).approvedCheckpoints !== validSnapshot.approvedCheckpoints);
const mutationCases = [
  ["snapshot_namespace_mismatch", (value) => { value.namespace = "wrong"; }],
  ["snapshot_schema_mismatch", (value) => { value.schemaVersion = "9"; }],
  ["snapshot_project_id_invalid", (value) => { value.projectId = "../escape"; }],
  ["snapshot_revision_invalid", (value) => { value.revision = -1; }],
  ["snapshot_duplicate_stage", (value) => { value.approvedCheckpoints.push(JSON.parse(JSON.stringify(value.approvedCheckpoints[0]))); }],
  ["checkpoint_payload_hash_mismatch", (value) => { value.approvedCheckpoints[0].payloadHash = "0".repeat(64); }],
  ["checkpoint_boundary_invalid", (value) => { value.approvedCheckpoints[0].fullDraftIncluded = true; }],
  ["raw_artifact_duplicate_id", (value) => { value.rawArtifacts.push(JSON.parse(JSON.stringify(value.rawArtifacts[0]))); }],
  ["raw_artifact_hash_mismatch", (value) => { value.rawArtifacts[0].rawText = "forged"; }],
  ["raw_artifact_trust_mismatch", (value) => { value.rawArtifacts[0].trust = "TRUSTED"; }],
  ["snapshot_last_approved_stage_mismatch", (value) => { value.lastApprovedStage = "relaunch_readiness"; }],
  ["snapshot_current_stage_ahead", (value) => { value.currentStage = "relaunch_readiness"; }],
  ["snapshot_draft_capability_false_claim", (value) => { value.persistenceCapabilities.fullDraftAutosave = true; }],
  ["snapshot_integrity_mismatch", (value) => { value.metadata.displayName = "forged"; }],
  ["snapshot_display_name_invalid", (value) => { value.metadata.displayName = ""; }],
  ["snapshot_project_status_invalid", (value) => { value.metadata.status = "deleted"; }],
  ["snapshot_metadata_timestamp_mismatch", (value) => { value.metadata.updatedAtIso = "2026-08-06T10:01:00.000Z"; }],
  ["checkpoint_metadata_invalid", (value) => { value.approvedCheckpoints[0].approvedAtIso = "not-iso"; }],
  ["checkpoint_identity_mismatch", (value) => { value.approvedCheckpoints[0].checkpointId = "forged-id"; }],
  ["raw_artifact_metadata_invalid", (value) => { value.rawArtifacts[0].artifactId = "../raw"; }],
  ["raw_artifact_normalized_hash_invalid", (value) => { value.rawArtifacts[0].normalizedHash = "not-sha"; }],
  ["snapshot_migration_state_invalid", (value) => { value.migrationState = "MIGRATED"; }],
  ["snapshot_integrity_contract_invalid", (value) => { value.integrity.algorithm = "md5"; }],
];
for (const [expectedCode, mutate] of mutationCases) {
  const candidate = JSON.parse(JSON.stringify(validSnapshot));
  mutate(candidate);
  const validation = snapshots.validateEditorialV2ProjectSnapshot(candidate);
  check(`adversarial snapshot blocked ${expectedCode}`, !validation.valid);
  check(`adversarial code ${expectedCode}`, validation.issues.some((issue) => issue.code === expectedCode));
}

const unsupportedPayloads = [new Date(), () => 1, Symbol("x"), 1n, Number.NaN, Number.POSITIVE_INFINITY, Object.create({ inherited: true })];
for (const [index, payload] of unsupportedPayloads.entries()) {
  let blocked = false;
  try { snapshots.buildEditorialV2ApprovedCheckpoint({ stageId: "trend_brief_import", approvedAtIso: creationTimestamp, sourceIdentity: `unsupported-${index}`, payload }); } catch { blocked = true; }
  check(`unsupported payload blocked ${index}`, blocked);
}
const cyclic = {};
cyclic.self = cyclic;
let cycleBlocked = false;
try { snapshots.buildEditorialV2ApprovedCheckpoint({ stageId: "trend_brief_import", approvedAtIso: creationTimestamp, sourceIdentity: "cycle", payload: cyclic }); } catch { cycleBlocked = true; }
check("cyclic payload blocked", cycleBlocked);

check("create request valid", validations.validateEditorialV2ProjectCreateRequest({ displayName: "Project", creationTimestampIso: creationTimestamp }).valid);
check("create timestamp invalid blocked", !validations.validateEditorialV2ProjectCreateRequest({ displayName: "Project", creationTimestampIso: "now" }).valid);
check("create blank name blocked", !validations.validateEditorialV2ProjectCreateRequest({ displayName: "", creationTimestampIso: creationTimestamp }).valid);
check("checkpoint owner confirmation blocked", !validations.validateEditorialV2CheckpointWriteRequest({ ownerConfirmed: false, checkpoint: { stageId: "trend_brief_import", approvedAtIso: creationTimestamp, sourceIdentity: "source", payload: {} }, rawArtifacts: [] }).valid);
check("checkpoint valid request", validations.validateEditorialV2CheckpointWriteRequest({ ownerConfirmed: true, checkpoint: { stageId: "trend_brief_import", approvedAtIso: creationTimestamp, sourceIdentity: "source", payload: {} }, rawArtifacts: [] }).valid);
check("raw artifact size blocked", !validations.validateEditorialV2CheckpointWriteRequest({ ownerConfirmed: true, checkpoint: { stageId: "trend_brief_import", approvedAtIso: creationTimestamp, sourceIdentity: "source", payload: {} }, rawArtifacts: [{ artifactId: "raw-large", artifactKind: "raw", sourceStage: "trend_brief_import", rawText: "x".repeat(persistence.EDITORIAL_V2_MAX_RAW_ARTIFACT_BYTES + 1), importedAtIso: creationTimestamp }] }).valid);

const targetFiles = [
  "lib/editorial-v2/contracts.ts", "lib/editorial-v2/persistence-contracts.ts", "lib/editorial-v2/persistence-data-root.ts", "lib/editorial-v2/project-snapshot.ts",
  "lib/editorial-v2/project-store-validation.ts", "lib/editorial-v2/project-store-node.ts", "lib/editorial-v2/project-recovery.ts", "lib/editorial-v2/project-api-client.ts",
  "components/editorial-v2/EditorialV2Workbench.tsx", "components/editorial-v2/SampleRelaunchWorkbench.tsx", "components/editorial-v2/ProjectWorkspacePanel.tsx",
  "app/api/editorial-v2/projects/route.ts", "app/api/editorial-v2/projects/[projectId]/route.ts",
];
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

const totalBeforeMinimum = pass + fail;
check("meaningful check minimum 480", totalBeforeMinimum >= 480, String(totalBeforeMinimum));

if (fail > 0) {
  console.error(`SHORTS_EDITORIAL_OS_V2_PA1_CHECK_FAIL ${pass}/${pass + fail} PASS`);
  process.exit(1);
}
console.log(`SHORTS_EDITORIAL_OS_V2_PA1_CHECK_PASS ${pass}/${pass + fail}`);
