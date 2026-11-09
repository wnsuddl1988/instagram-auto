import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const root = resolve(process.cwd());
const baselinePath = "_ai/SHORTS_EDITORIAL_OS_V2_PA3_BASELINE.json";
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
check("baseline activation slice", baseline.activationSlice === "PA-3_LOCAL_USER_CONTENT_PREVIEW_RENDERER");
check("baseline reconstruction boundary", baseline.baselineReconstructability === "NOT_RECONSTRUCTABLE");
check("baseline branch", baseline.git.branch === "codex/source-first-blueprint-clean");
check("baseline HEAD", baseline.git.head === "fc1bdd98aff12425daf31241934de783d3ca9b15");
check("baseline parent", baseline.git.parent === "41d302a9954015ad34a7ca96313f3ccb54a344b2");
check("baseline tree", baseline.git.tree === "e36dc1dd03468c43206d17ac5bb0afcbd268b0a1");
check("baseline ahead eleven", baseline.git.upstream.ahead === 11 && baseline.git.upstream.behind === 0);
check("baseline starting counts", baseline.git.modifiedCount === 21 && baseline.git.untrackedCount === 3 && baseline.git.stagedCount === 0 && baseline.git.statusPathCount === 24);
check("PA3 allowlist exact 18", baseline.pa3Allowlist.length === 18 && new Set(baseline.pa3Allowlist.map((entry) => entry.path)).size === 18);
check("PA3 new exact 13", baseline.pa3Allowlist.filter((entry) => entry.expectedAction === "new").length === 13);
check("PA3 modified exact 5", baseline.pa3Allowlist.filter((entry) => entry.expectedAction === "modified").length === 5);
check("state exceptions exact", JSON.stringify(baseline.stateDocumentExceptions) === JSON.stringify(["_ai/PROJECT_STATE.md", "_ai/NEXT_ACTION.md"]));
check("governance exact two", baseline.governanceFiles.length === 2);
check("inherited manifests exact twelve", baseline.inheritedCheckpointManifests.length === 12);
check("protected configs exact four", baseline.protectedConfigFiles.length === 4);
check("PA1 checkpoint recorded", baseline.previousCheckpoints.pa1.commit === "41d302a9954015ad34a7ca96313f3ccb54a344b2" && baseline.previousCheckpoints.pa1.pathCount === 20);
check("PA2 checkpoint recorded", baseline.previousCheckpoints.pa2.commit === baseline.git.head && baseline.previousCheckpoints.pa2.pathCount === 23);
for (const [key, expected] of Object.entries({ canonicalRenderSource: "APPROVED_CHECKPOINT_ONLY", localPreviewProfile: "preview_540x960", featureFlagDefault: "OFF", dependencyChange: "PROHIBITED", configChange: "PROHIBITED", authentication: "PROHIBITED", v1Migration: "PROHIBITED", externalNetwork: "LOCALHOST_ONLY_FOR_RUNTIME_PROBE", externalApi: "PROHIBITED", actualExternalAsset: "PROHIBITED", actualTts: "PROHIBITED", finalProductionRender: "PROHIBITED", publicPublish: "PROHIBITED", deployPush: "PROHIBITED", pnpmBuild: "PROHIBITED", pa4: "PROHIBITED" })) {
  check(`baseline constraint ${key}`, baseline.constraints[key] === expected);
}
check("current HEAD unchanged", git(["rev-parse", "HEAD"]) === baseline.git.head);
check("current parent unchanged", git(["show", "-s", "--format=%P", "HEAD"]) === baseline.git.parent);
check("current tree unchanged", git(["show", "-s", "--format=%T", "HEAD"]) === baseline.git.tree);
check("current ahead eleven", Number(git(["rev-list", "--count", "@{upstream}..HEAD"])) === 11);
check("current behind zero", Number(git(["rev-list", "--count", "HEAD..@{upstream}"])) === 0);

const porcelain = git(["status", "--porcelain=v1", "-z", "--untracked-files=all"], true);
const statusEntries = porcelain.split("\0").filter(Boolean).map((entry) => ({ status: entry.slice(0, 2), path: entry.slice(3).replaceAll("\\", "/") }));
const expectedPaths = new Set([...baseline.statusPaths.map((entry) => entry.path), ...baseline.pa3Allowlist.map((entry) => entry.path)]);
const actualPaths = new Set(statusEntries.map((entry) => entry.path));
check("working status exact 42", statusEntries.length === 42, String(statusEntries.length));
check("working modified exact 26", statusEntries.filter((entry) => entry.status === " M").length === 26, JSON.stringify(statusEntries.filter((entry) => entry.status === " M").map((entry) => entry.path)));
check("working untracked exact 16", statusEntries.filter((entry) => entry.status === "??").length === 16, JSON.stringify(statusEntries.filter((entry) => entry.status === "??").map((entry) => entry.path)));
check("working staged zero", statusEntries.every((entry) => entry.status === "??" || entry.status[0] === " "));
check("working rename zero", statusEntries.every((entry) => !entry.status.includes("R")));
check("working delete zero", statusEntries.every((entry) => !entry.status.includes("D")));
check("working path set exact", actualPaths.size === expectedPaths.size && [...actualPaths].every((path) => expectedPaths.has(path)));
for (const entry of baseline.pa3Allowlist) {
  const expectedStatus = entry.expectedAction === "new" ? "??" : " M";
  check(`PA3 action ${entry.path}`, statusEntries.some((candidate) => candidate.path === entry.path && candidate.status === expectedStatus));
  check(`PA3 path exists ${entry.path}`, existsSync(resolve(root, entry.path)));
  if (entry.expectedAction === "modified") check(`PA3 modified differs ${entry.path}`, sha256(entry.path) !== entry.originalSha256);
}
for (const entry of baseline.statusPaths) {
  check(`protected status ${entry.path}`, statusEntries.some((candidate) => candidate.path === entry.path && candidate.status === entry.status));
  check(`protected hash ${entry.path}`, sha256(entry.path) === entry.sha256);
}
for (const entry of [...baseline.governanceFiles, ...baseline.inheritedCheckpointManifests]) {
  check(`protected file exists ${entry.path}`, existsSync(resolve(root, entry.path)));
  check(`protected file hash ${entry.path}`, sha256(entry.path) === entry.sha256);
}
for (const entry of baseline.protectedConfigFiles) {
  check(`protected config exists ${entry.path}`, existsSync(resolve(root, entry.path)));
  check(`protected config hash ${entry.path}`, sha256(entry.path) === entry.sha256);
  check(`protected config working blob ${entry.path}`, git(["hash-object", entry.path]) === entry.workingBlob);
  if (entry.path !== "package.json") check(`protected config HEAD identical ${entry.path}`, entry.headBlob === entry.workingBlob && git(["rev-parse", `${baseline.git.head}:${entry.path}`]) === entry.headBlob);
}
check("git diff check", spawnSync("git", ["diff", "--check"], { cwd: root, encoding: "utf8", windowsHide: true }).status === 0);
check("middleware absent", !existsSync(resolve(root, "middleware.ts")) && !existsSync(resolve(root, "src/middleware.ts")));

const requiredModules = new Map([
  ["lib/editorial-v2/local-preview-contracts.ts", ["SHORTS_EDITORIAL_OS_V2_LOCAL_PREVIEW_RENDER_ENABLED", "preview_540x960", "LOCAL_PREVIEW_WIDTH", "LOCAL_PREVIEW_HEIGHT", "LOCAL_PREVIEW_FPS", "silent_placeholder", "estimated_not_audio_aligned", "local_preview_with_placeholders", "LocalPreviewRenderInput", "LocalPreviewRenderIdentity", "LocalPreviewRenderMetadata", "LocalPreviewPersistedProjectSummary", "parseLocalPreviewRenderEnabled", "productionReady: false"]],
  ["lib/editorial-v2/local-preview-input.ts", ["buildLocalPreviewRenderInput", "hashLocalPreviewRenderInput", "validateLocalPreviewRenderInput", "cloneLocalPreviewRenderInput", "buildLocalPreviewRenderIdentity", "validateEditorialV2ProjectSnapshot", "hashRenderManifest", "approvalState", "LOCAL_PREVIEW_REQUIRED_CHECKPOINT_MISSING", "LOCAL_PREVIEW_RENDER_MANIFEST_HASH_MISMATCH", "LOCAL_PREVIEW_SOURCE_REF_UNRESOLVED", "LOCAL_PREVIEW_NUMBER_REF_UNRESOLVED", "UNRESOLVED_ASSET_PLACEHOLDERS_PRESENT", "createdFromCanonicalApprovedCheckpoints"]],
  ["lib/editorial-v2/local-preview-validation.ts", ["validateLocalPreviewRequest", "parseLocalPreviewRenderRequest", "validateLocalPreviewInput", "validateLocalPreviewOutput", "summarizeLocalPreviewValidation", "client_content_or_path_forbidden", "final_profile_forbidden", "canonical_approved_checkpoint_authority_required", "character_primary_only_forbidden", "safe_area_structural_blocker", "silent_placeholder_audio_warning", "estimated_subtitle_warning", "source_existence_unverified_warning"]],
  ["lib/editorial-v2/local-preview-scene.ts", ["escapePreviewText", "buildCharacterPreviewPose", "buildLocalPreviewSceneMarkup", "validatePreviewMarkup", "buildCharacterRig", "getCharacterMotionDefinition", "CHARACTER_MOTION_PREVIEW_PROXY", "PREVIEW_PLACEHOLDER_ONLY", "ESTIMATED_NOT_AUDIO_ALIGNED", "NOT PUBLIC READY", "script_tag", "external_resource_attribute", "event_handler_attribute"]],
  ["lib/editorial-v2/local-preview-store-node.ts", ["projects", "renders", "preview", "preview.mp4", "metadata.json", "createLocalPreviewWorkspace", "cleanupLocalPreviewWorkspace", "inspectLocalPreviewCache", "commitLocalPreviewOutput", "readLocalPreviewMediaDescriptor", "PREVIEW_SYMLINK_OR_JUNCTION_FORBIDDEN", "PREVIEW_PROJECT_PATH_ESCAPE_BLOCKED", "PREVIEW_OUTPUT_PATH_INVALID", "media_hash_mismatch", "atomicWriteText", "handle.sync"]],
  ["lib/editorial-v2/local-preview-executor-node.ts", ["chromium", "ffmpeg", "ffprobe", "shell: false", "childEnvironment", "--disable-background-networking", "route.abort", "LOCAL_PREVIEW_EXTERNAL_REQUEST_DETECTED", "anullsrc", "mov_text", "libx264", "silent_placeholder", "estimated_not_audio_aligned", "renderLocalProjectPreview", "hit_reused", "in_flight_reused", "cleanupLocalPreviewWorkspace"]],
  ["lib/editorial-v2/local-preview-api-client.ts", ["LocalPreviewApiError", "requestLocalProjectPreview", "getLocalProjectPreviewMetadata", "fetchLocalProjectPreviewBlob", "same-origin", "AbortController", "credentials: \"same-origin\"", "redirect: \"error\"", "cache: \"no-store\"", "EXTERNAL_PREVIEW_URL_FORBIDDEN"]],
  ["app/api/editorial-v2/projects/[projectId]/preview-render/route.ts", ["runtime = \"nodejs\"", "dynamic = \"force-dynamic\"", "export async function GET", "export async function POST", "EDITORIAL_V2_DISABLED", "LOCAL_PERSISTENCE_DISABLED", "LOCAL_PREVIEW_RENDER_DISABLED", "CROSS_ORIGIN_PREVIEW_MUTATION_FORBIDDEN", "REQUEST_BODY_TOO_LARGE", "LOCAL_PREVIEW_REQUEST_INVALID", "PROJECT_REVISION_MISMATCH", "RENDER_CHECKPOINT_HASH_MISMATCH", "ARCHIVED_PROJECT_PREVIEW_BLOCKED", "Content-Type", "video/mp4", "productionReady: false"]],
  ["components/editorial-v2/LocalPreviewRenderPanel.tsx", ["Local User-Content Preview", "Production Activation PA-3", "Feature OFF", "Ready for Local Preview", "Cache Hit", "checkpoint_mismatch", "data-pa3-preview-state", "data-pa3-checkpoint-match", "Generate Local Preview", "최종 영상·게시용이 아님", "NOT_PRODUCTION_READY", "productionReady", "preview_540x960", "URL.createObjectURL", "URL.revokeObjectURL"]],
  ["components/editorial-v2/LocalPreviewRenderPanel.module.css", [".panel", ".header", ".badge", ".boundary", ".message", ".grid", ".card", ".summary", ".confirm", ".preview", ".warnings", ".alert", ":focus-visible", "@media"]],
]);
for (const [path, tokens] of requiredModules) {
  check(`required module exists ${path}`, existsSync(resolve(root, path)));
  checkTokens(path, readRepo(path), tokens);
}

const contractsSource = readRepo("lib/editorial-v2/local-preview-contracts.ts");
checkForbiddenTokens("preview contracts", contractsSource, ["fetch(", "localStorage", "indexedDB", "1080x1920", "final_1080x1920", "process.env", "node:fs", "node:child_process"]);
const inputSource = readRepo("lib/editorial-v2/local-preview-input.ts");
checkForbiddenTokens("preview input", inputSource, ["fetch(", "localStorage", "indexedDB", "node:fs", "node:child_process", "process.env", "writeProjectCheckpoint", "archiveProject", "createProject", "actualGenerationRequested: true"]);
const validationSource = readRepo("lib/editorial-v2/local-preview-validation.ts");
checkForbiddenTokens("preview validation", validationSource, ["fetch(", "localStorage", "indexedDB", "node:fs", "node:child_process", "process.env", "1080", "1920"]);
const sceneSource = readRepo("lib/editorial-v2/local-preview-scene.ts");
checkForbiddenTokens("preview scene", sceneSource, ["dangerouslySetInnerHTML", "fetch(", "XMLHttpRequest", "WebSocket", "EventSource", "node:fs", "node:child_process", "http://", "https://", "file://"]);
const storeSource = readRepo("lib/editorial-v2/local-preview-store-node.ts");
checkForbiddenTokens("preview store", storeSource, ["fetch(", "XMLHttpRequest", "WebSocket", "node:http", "node:https", "child_process", "spawn(", "exec(", "localStorage", "indexedDB", "output/", "public/", "writeProjectCheckpoint", "archiveProject", "createProject"]);
check("preview store recursive rm limited cleanup", (storeSource.match(/rm\(/gu) ?? []).length === 2 && storeSource.includes("rm(workspace.workDirectory") && storeSource.includes("rm(temporary"));
const executorSource = readRepo("lib/editorial-v2/local-preview-executor-node.ts");
checkForbiddenTokens("preview executor", executorSource, ["exec(", "execFile(", "shell: true", "fetch(", "XMLHttpRequest", "WebSocket", "node:http", "node:https", "1080x1920", "final_1080x1920", "output/", "public/", "process.env.OPENAI", "process.env.ELEVEN", "process.env.YOUTUBE"]);
check("executor fixed executable count", (executorSource.match(/runFixedExecutable\(/gu) ?? []).length === 3);
check("executor fixed phases", executorSource.includes("const PHASES = [0, 0.5, 1] as const"));
check("executor fixed ffmpeg", executorSource.includes('const FFMPEG_EXECUTABLE = "ffmpeg"'));
check("executor fixed ffprobe", executorSource.includes('const FFPROBE_EXECUTABLE = "ffprobe"'));
const clientSource = readRepo("lib/editorial-v2/local-preview-api-client.ts");
checkForbiddenTokens("preview client", clientSource, ["node:", "process.env", "localStorage", "indexedDB", "sessionStorage", "http://", "https://", "dataRoot", "filesystemPath"]);
const routeSource = readRepo("app/api/editorial-v2/projects/[projectId]/preview-render/route.ts");
checkForbiddenTokens("preview route", routeSource, ["export async function DELETE", "Access-Control-Allow-Origin", "dataRoot:", "stack", "http://", "https://", "writeProjectCheckpoint", "archiveProject", "createProject", "final_1080x1920"]);
const panelSource = readRepo("components/editorial-v2/LocalPreviewRenderPanel.tsx");
checkForbiddenTokens("preview panel", panelSource, ["type=\"file\"", "showDirectoryPicker", "webkitdirectory", "dangerouslySetInnerHTML", "localStorage", "indexedDB", "http://", "https://", "Publish", "Upload", "1080×1920 결과가 아닙니다.</button>"]);

const orchestrationSource = readRepo("components/editorial-v2/EditorialV2Workbench.tsx");
checkTokens("PA3 orchestration", orchestrationSource, ["LocalPreviewPersistedProjectSummary", "persistedPreviewSummary", "setPersistedPreviewSummary", "LocalPreviewRenderPanel", "onPersistedPreviewSummaryChange", "persistenceEnabled", "currentSessionRenderManifestHash", "approvedRenderSnapshot?.renderManifest.manifestHash"]);
checkForbiddenTokens("PA3 orchestration", orchestrationSource, ["filesystemPath", "localStorage", "indexedDB", "http://", "https://", "final_1080x1920", "fetch("]);
const workspaceSource = readRepo("components/editorial-v2/ProjectWorkspacePanel.tsx");
checkTokens("workspace PA3", workspaceSource, ["Production Activation PA-3", "LocalPreviewPersistedProjectSummary", "persistedPreviewSummary", "render_integration", "checkpoint.payloadHash", "manifest.manifestHash", "onPersistedPreviewSummaryChange", "unresolvedRequirements", "selectedCharacterDirectionId"]);
checkForbiddenTokens("workspace PA3", workspaceSource, ["type=\"file\"", "localStorage", "indexedDB", "showDirectoryPicker", "webkitdirectory", "dangerouslySetInnerHTML", "http://", "https://", "filesystemPath"]);

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

const contracts = loadTs("lib/editorial-v2/local-preview-contracts.ts");
const inputs = loadTs("lib/editorial-v2/local-preview-input.ts");
const validations = loadTs("lib/editorial-v2/local-preview-validation.ts");
const scenes = loadTs("lib/editorial-v2/local-preview-scene.ts");
for (const [value, expected] of [[undefined, false], [null, false], ["", false], ["0", false], ["false", false], ["TRUE", false], ["True", false], [" true", false], ["true ", false], [1, false], [true, false], ["1", true], ["true", true]]) {
  check(`feature flag exact ${JSON.stringify(value)}`, contracts.parseLocalPreviewRenderEnabled(value) === expected);
}
const profile = contracts.localPreviewProfile();
check("profile id fixed", profile.profileId === "preview_540x960");
check("profile geometry fixed", profile.width === 540 && profile.height === 960 && profile.fps === 30);
check("profile final false", profile.actualFinal === false && profile.productionReady === false);
check("profile silent placeholder", profile.audioMode === "silent_placeholder");
check("profile estimated subtitles", profile.subtitleAlignment === "estimated_not_audio_aligned");
check("profile placeholder assets", profile.assetResolutionLevel === "local_preview_with_placeholders");

function sampleScene(index, marker = "safe") {
  const strategies = ["number_text_motion", "chart_comparison", "official_source_card", "timeline", "relationship_diagram", "map", "generated_image", "stock_video"];
  return {
    sceneId: `pa3-scene-${String(index).padStart(2, "0")}`,
    order: index,
    durationMs: 1500,
    beatType: "practical_check_or_action",
    purpose: `approved purpose ${marker}`,
    narration: `승인된 출처를 확인합니다 ${marker}`,
    keyCaption: `출처 확인 ${marker}`,
    sourceRefs: [`source-${index}`],
    numberRefs: [],
    claimRefs: [`claim-${index}`],
    sources: [{ sourceId: `source-${index}`, publisher: `publisher ${marker}`, title: `title ${marker}`, publishedAt: "2026-08-08", eventDate: null, urlText: `source://approved-${marker}` }],
    numbers: [],
    primaryVisualStrategy: strategies[(index - 1) % strategies.length],
    secondaryStrategies: ["character_motion"],
    chartLabels: [],
    chartUnit: null,
    timelineEntries: [{ evidenceRef: `source-${index}`, date: "2026-08-08", label: `timeline ${marker}` }],
    relationshipLabels: [`claim ${marker}`, `source ${marker}`],
    characterDirection: "loop_signal_navigator",
    characterMotionTag: "idle_scan",
    reducedMotionTag: "idle_scan",
    estimatedSubtitleCues: [{ cueId: `cue-${index}`, sceneId: `pa3-scene-${String(index).padStart(2, "0")}`, sceneOrder: index, cueOrder: 1, text: `subtitle ${marker}`, startSeconds: (index - 1) * 1.5, endSeconds: index * 1.5, keyCaption: true, safeZone: "lower_safe_caption_zone", alignmentStatus: "estimated_not_audio_aligned" }],
    rightsState: "not_required",
    costClass: "none_estimate",
    unresolvedAssets: index >= 6 ? ["PREVIEW_PLACEHOLDER_ONLY"] : [],
    assetResolution: index >= 6 ? "preview_placeholder_only" : "resolved_local_primitive",
    safeAreaState: "structural_precheck_pass",
    sceneRevision: 1,
    fingerprint: createHash("sha256").update(`scene-${index}`).digest("hex"),
  };
}
function sampleInput(marker = "safe") {
  const inputScenes = Array.from({ length: 8 }, (_, index) => sampleScene(index + 1, marker));
  return {
    schemaVersion: "local-preview-input-v1",
    projectId: "sev2-pa3-checker-project-a1b2c3d4",
    projectRevision: 5,
    projectIntegrityHash: "a".repeat(64),
    sourceCheckpointHashes: { editorialIntelligence: "b".repeat(64), scenePlanning: "c".repeat(64), characterMotion: "d".repeat(64), renderIntegration: "e".repeat(64) },
    renderCheckpointHash: "e".repeat(64),
    profile: contracts.localPreviewProfile(),
    sceneCount: inputScenes.length,
    durationMs: inputScenes.reduce((total, scene) => total + scene.durationMs, 0),
    selectedCharacterDirection: "loop_signal_navigator",
    scenes: inputScenes,
    warnings: ["NOT_PRODUCTION_READY", "SILENT_PLACEHOLDER_AUDIO"],
    createdFromCanonicalApprovedCheckpoints: true,
  };
}

const validRequest = { expectedProjectRevision: 5, expectedRenderCheckpointHash: "e".repeat(64), profile: "preview_540x960", ownerLocalPreviewConfirmation: true };
check("valid request issues zero", validations.validateLocalPreviewRequest(validRequest).length === 0);
check("valid request parse exact", JSON.stringify(validations.parseLocalPreviewRenderRequest(validRequest)) === JSON.stringify(validRequest));
const forbiddenRequestFields = ["content", "payload", "scene", "scenes", "narration", "caption", "source", "sourceUrl", "asset", "assetUrl", "path", "file", "filePath", "filesystemPath", "dataRoot", "output", "outputPath", "command", "args", "executable", "ffmpeg", "profileOverride", "width", "height", "fps", "final", "productionReady", "tts", "voice", "publish"];
for (const field of forbiddenRequestFields) {
  const issues = validations.validateLocalPreviewRequest({ ...validRequest, [field]: "blocked" });
  check(`request field blocked ${field}`, issues.some((entry) => entry.code === "client_content_or_path_forbidden" && entry.fieldPath === field));
  let threw = false;
  try { validations.parseLocalPreviewRenderRequest({ ...validRequest, [field]: "blocked" }); } catch { threw = true; }
  check(`request parse throws ${field}`, threw);
}
const requestMutations = [
  ["object", null, "request_object_required"],
  ["negative revision", { ...validRequest, expectedProjectRevision: -1 }, "project_revision_invalid"],
  ["fraction revision", { ...validRequest, expectedProjectRevision: 1.5 }, "project_revision_invalid"],
  ["string revision", { ...validRequest, expectedProjectRevision: "5" }, "project_revision_invalid"],
  ["short hash", { ...validRequest, expectedRenderCheckpointHash: "e" }, "render_checkpoint_hash_invalid"],
  ["upper hash", { ...validRequest, expectedRenderCheckpointHash: "E".repeat(64) }, "render_checkpoint_hash_invalid"],
  ["final profile", { ...validRequest, profile: "final_1080x1920" }, "final_profile_forbidden"],
  ["missing confirm", { ...validRequest, ownerLocalPreviewConfirmation: false }, "owner_local_preview_confirmation_required"],
];
for (const [label, value, expectedCode] of requestMutations) check(`request mutation ${label}`, validations.validateLocalPreviewRequest(value).some((entry) => entry.code === expectedCode));

for (let index = 0; index < 90; index += 1) {
  const injection = `<script data-i="${index}">alert('한글-${index}')</script><img src=https://evil.example/${index} onerror=alert(1)>&\"'`;
  const input = sampleInput(injection);
  const cloned = inputs.cloneLocalPreviewRenderInput(input);
  const reversed = Object.fromEntries(Object.entries(cloned).reverse());
  const changed = inputs.cloneLocalPreviewRenderInput(input);
  changed.scenes[0].narration = `${changed.scenes[0].narration}-changed`;
  const validation = validations.summarizeLocalPreviewValidation(validations.validateLocalPreviewInput(input));
  check(`dynamic input valid ${index}`, validation.valid && validation.blockingIssueCount === 0);
  check(`dynamic warnings present ${index}`, validation.warningCount >= 5);
  check(`dynamic clone deep ${index}`, cloned !== input && cloned.scenes !== input.scenes && JSON.stringify(cloned) === JSON.stringify(input));
  check(`dynamic stable key order ${index}`, inputs.hashLocalPreviewRenderInput(input) === inputs.hashLocalPreviewRenderInput(reversed));
  check(`dynamic mutation sensitive ${index}`, inputs.hashLocalPreviewRenderInput(input) !== inputs.hashLocalPreviewRenderInput(changed));
  const identity = inputs.buildLocalPreviewRenderIdentity(input);
  check(`dynamic render id ${index}`, /^preview-[a-f0-9]{40}$/u.test(identity.renderId));
  check(`dynamic identity hash ${index}`, identity.renderInputHash === inputs.hashLocalPreviewRenderInput(input));
  const scene = input.scenes[index % input.scenes.length];
  for (const phase of [0, 0.5, 1]) {
    const markup = scenes.buildLocalPreviewSceneMarkup(scene, { phase, frameLabel: injection });
    const markupValidation = scenes.validatePreviewMarkup(markup);
    check(`dynamic markup valid ${index}/${phase}`, markupValidation.valid && markupValidation.issues.length === 0);
    check(`dynamic script escaped ${index}/${phase}`, !markup.includes("<script data-i") && markup.includes("&lt;script"));
    check(`dynamic img escaped ${index}/${phase}`, !markup.includes("<img src=https://evil.example") && markup.includes("&lt;img"));
    check(`dynamic quote escaped ${index}/${phase}`, markup.includes("&quot;") && !markup.includes(`data-i="${index}"`));
    check(`dynamic document fixed ${index}/${phase}`, markup.startsWith("<!doctype html>") && markup.includes("width:540px") && markup.includes("height:960px"));
    check(`dynamic preview labels ${index}/${phase}`, markup.includes("CHARACTER_MOTION_PREVIEW_PROXY") && markup.includes("ESTIMATED_NOT_AUDIO_ALIGNED") && markup.includes("NOT PUBLIC READY"));
  }
}

const baseInput = sampleInput();
check("base input lightweight validator", inputs.validateLocalPreviewRenderInput(baseInput).valid);
const inputMutations = [
  ["canonical_approved_checkpoint_authority_required", (value) => { value.createdFromCanonicalApprovedCheckpoints = false; }],
  ["project_revision_invalid", (value) => { value.projectRevision = -1; }],
  ["checkpoint_identity_invalid", (value) => { value.projectIntegrityHash = "bad"; }],
  ["preview_profile_invalid", (value) => { value.profile.width = 1080; }],
  ["production_boundary_false_claim", (value) => { value.profile.productionReady = true; }],
  ["actual_audio_forbidden", (value) => { value.profile.audioMode = "actual_tts"; }],
  ["subtitle_alignment_false_claim", (value) => { value.profile.subtitleAlignment = "audio_aligned"; }],
  ["enabled_scene_count_invalid", (value) => { value.sceneCount = 6; }],
  ["duration_total_mismatch", (value) => { value.durationMs += 1; }],
  ["scene_id_duplicate", (value) => { value.scenes[1].sceneId = value.scenes[0].sceneId; }],
  ["scene_order_unstable", (value) => { value.scenes[0].order = 2; }],
  ["scene_duration_invalid", (value) => { value.scenes[0].durationMs = 100; }],
  ["scene_content_missing", (value) => { value.scenes[0].narration = ""; }],
  ["character_primary_only_forbidden", (value) => { value.scenes[0].primaryVisualStrategy = "character_motion"; }],
  ["safe_area_structural_blocker", (value) => { value.scenes[0].safeAreaState = "structural_precheck_blocked"; }],
  ["source_ref_mismatch", (value) => { value.scenes[0].sourceRefs = ["missing"]; }],
  ["number_ref_mismatch", (value) => { value.scenes[0].numberRefs = ["missing"]; }],
  ["estimated_subtitle_invalid", (value) => { value.scenes[0].estimatedSubtitleCues = []; }],
];
for (const [expectedCode, mutate] of inputMutations) {
  const candidate = inputs.cloneLocalPreviewRenderInput(baseInput);
  mutate(candidate);
  const issues = validations.validateLocalPreviewInput(candidate);
  check(`input mutation blocked ${expectedCode}`, issues.some((entry) => entry.code === expectedCode && entry.blocking));
}
const outputMetadata = {
  schemaVersion: "local-preview-metadata-v1",
  status: "completed",
  renderId: `preview-${"f".repeat(40)}`,
  projectId: baseInput.projectId,
  projectRevision: 5,
  renderInputHash: "f".repeat(64),
  sourceCheckpointHashes: { ...baseInput.sourceCheckpointHashes },
  renderCheckpointHash: baseInput.renderCheckpointHash,
  profile: "preview_540x960",
  sceneCount: 8,
  durationMs: 12_000,
  width: 540,
  height: 960,
  fps: 30,
  audioMode: "silent_placeholder",
  subtitleAlignment: "estimated_not_audio_aligned",
  unresolvedAssetCount: 3,
  placeholderSceneIds: ["pa3-scene-06", "pa3-scene-07", "pa3-scene-08"],
  characterDirection: "loop_signal_navigator",
  characterMotionProxy: true,
  productionAnimation: false,
  productionReady: false,
  outputSha256: "9".repeat(64),
  outputBytes: 12_345,
  completedAtIso: "2026-08-08T20:00:00.000Z",
  probe: { video: true, audio: true, subtitle: true, width: 540, height: 960, fps: 30, durationMs: 12_000, formatName: "mov,mp4,m4a,3gp,3g2,mj2" },
  warnings: ["NOT_PRODUCTION_READY"],
};
check("valid output issues zero", validations.validateLocalPreviewOutput(outputMetadata).length === 0);
for (const [expectedCode, mutate] of [
  ["output_metadata_invalid", (value) => { value.status = "rendering"; }],
  ["output_profile_mismatch", (value) => { value.width = 1080; }],
  ["output_production_false_claim", (value) => { value.productionReady = true; }],
  ["output_audio_subtitle_false_claim", (value) => { value.audioMode = "actual_tts"; }],
  ["output_size_or_hash_invalid", (value) => { value.outputSha256 = "bad"; }],
  ["ffprobe_stream_missing", (value) => { value.probe.subtitle = false; }],
  ["ffprobe_profile_mismatch", (value) => { value.probe.fps = 60; }],
  ["ffprobe_duration_mismatch", (value) => { value.probe.durationMs = 20_000; }],
]) {
  const candidate = JSON.parse(JSON.stringify(outputMetadata));
  mutate(candidate);
  check(`output mutation ${expectedCode}`, validations.validateLocalPreviewOutput(candidate).some((entry) => entry.code === expectedCode));
}

const targetFiles = baseline.pa3Allowlist.filter((entry) => entry.path.endsWith(".ts") || entry.path.endsWith(".tsx")).map((entry) => entry.path);
const config = ts.readConfigFile(resolve(root, "tsconfig.json"), ts.sys.readFile);
check("TypeScript config readable", !config.error);
const parsedConfig = ts.parseJsonConfigFileContent(config.config, ts.sys, root);
check("TypeScript strict true", parsedConfig.options.strict === true);
const program = ts.createProgram(parsedConfig.fileNames, { ...parsedConfig.options, noEmit: true, incremental: false });
for (const path of targetFiles) {
  const sourceFile = program.getSourceFile(resolve(root, path));
  check(`TypeScript source included ${path}`, Boolean(sourceFile));
  check(`TypeScript syntactic zero ${path}`, Boolean(sourceFile) && program.getSyntacticDiagnostics(sourceFile).length === 0);
  check(`TypeScript semantic zero ${path}`, Boolean(sourceFile) && program.getSemanticDiagnostics(sourceFile).length === 0);
}
const preEmitDiagnostics = ts.getPreEmitDiagnostics(program).filter((diagnostic) => !diagnostic.file || targetFiles.includes(relativePath(diagnostic.file.fileName)));
check("target strict preEmit zero", preEmitDiagnostics.length === 0, preEmitDiagnostics.map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, " ")).join(" | "));
function relativePath(path) { return resolve(path).slice(root.length + 1).replaceAll("\\", "/"); }

checkTokens("runtime probe contract", readRepo("scripts/probe-shorts-editorial-os-v2-pa3-runtime.mjs"), ["mkdtempSync", "shorts-editorial-v2-pa3-runtime-", "ffmpeg", "ffprobe", "playwright", "127.0.0.1", "SHORTS_EDITORIAL_OS_V2_LOCAL_PREVIEW_RENDER_ENABLED", "Generate Local Preview", "data-pa3-preview-state", "miss_rendered", "hit_reused", "ffmpegExecuted === false", "client path/content injection", "final profile request", "cross-origin preview mutation", "externalRequests.length === 0", "repositoryStatusUnchanged", "repositoryHashesUnchanged", "SHORTS_EDITORIAL_OS_V2_PA3_RUNTIME_PROOF_PASS"]);
checkForbiddenTokens("runtime probe", readRepo("scripts/probe-shorts-editorial-os-v2-pa3-runtime.mjs"), ["pnpm build", "next build", "final render executed", "publishExecuted: true", "public/", "output/"]);
checkTokens("PROJECT_STATE PA3", readRepo("_ai/PROJECT_STATE.md"), ["PA-3: `IMPLEMENTATION_COMPLETE_AWAITING_CROSS_REVIEW`", "PA-3 Cross Review: `NOT_STARTED`", "local user-content preview renderer", "540×960", "silent placeholder", "estimated_not_audio_aligned", "productionReady=false", "external request `0`", "cache hit", "pnpm build: `PROHIBITED_NOT_RUN`", "PA-4: `BLOCKED`", "Push: `NOT_AUTHORIZED`"]);
checkTokens("NEXT_ACTION PA3", readRepo("_ai/NEXT_ACTION.md"), ["Claude Code PA-3 read-only Cross Review", "Claude 결과를 Codex에 전달", "runtime probe 재실행 금지", "build 실행 금지", "exact 18-path", "최대 2회", "PA-4 자동 시작 금지", "feat(editorial-v2): checkpoint local user-content preview renderer"]);
checkTokens("activation plan PA3", readRepo("_ai/SHORTS_EDITORIAL_OS_V2_PRODUCTION_ACTIVATION_PLAN.md"), ["PA-3", "Local User-Content Preview Renderer", "IMPLEMENTED_PENDING_CROSS_REVIEW", "540×960", "silent placeholder", "estimated subtitle", "external asset", "productionReady=false", "PA-4"]);

const checkerSource = readRepo("scripts/check-shorts-editorial-os-v2-pa3.mjs");
const checkerAst = ts.createSourceFile("check-shorts-editorial-os-v2-pa3.mjs", checkerSource, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
const checkerImports = checkerAst.statements.filter(ts.isImportDeclaration);
const checkerFsImport = checkerImports.find((statement) => statement.moduleSpecifier.text === "node:fs");
const checkerFsImportNames = checkerFsImport?.importClause?.namedBindings && ts.isNamedImports(checkerFsImport.importClause.namedBindings)
  ? checkerFsImport.importClause.namedBindings.elements.map((element) => element.name.text).sort()
  : [];
check("checker source fs import read-only", JSON.stringify(checkerFsImportNames) === JSON.stringify(["existsSync", "readFileSync"]));
check("checker source has no fs promises import", !checkerImports.some((statement) => statement.moduleSpecifier.text === "node:fs/promises"));
const totalBeforeMinimum = pass + fail;
check("meaningful check minimum 700", totalBeforeMinimum >= 700, String(totalBeforeMinimum));
if (fail > 0) {
  console.error(`SHORTS_EDITORIAL_OS_V2_PA3_CHECK_FAIL ${pass}/${pass + fail} PASS`);
  process.exit(1);
}
console.log(`SHORTS_EDITORIAL_OS_V2_PA3_CHECK_PASS ${pass}/${pass + fail}`);
