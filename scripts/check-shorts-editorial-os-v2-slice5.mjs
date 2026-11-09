import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import vm from "node:vm";

const ROOT = process.cwd();
const BASELINE_PATH = "_ai/SHORTS_EDITORIAL_OS_V2_SLICE_5_BASELINE.json";
const CHECKPOINT_HEAD = "80aa56cfdc75f3014fb5415392a6b363ced18feb";
const CHECKPOINT_PARENT = "3edc034022e179492c38272f30049c5950fe54c3";
const CHECKPOINT_MESSAGE = "feat(editorial-v2): checkpoint slice 4 scene planning";
const CHECKPOINT_PATHS = [
  "_ai/NEXT_ACTION.md",
  "_ai/PROJECT_STATE.md",
  "_ai/SHORTS_EDITORIAL_OS_V2_SLICE_4_BASELINE.json",
  "components/editorial-v2/EditorialIntelligenceWorkbench.tsx",
  "components/editorial-v2/EditorialV2Workbench.tsx",
  "components/editorial-v2/ScenePlanningWorkbench.module.css",
  "components/editorial-v2/ScenePlanningWorkbench.tsx",
  "lib/editorial-v2/contracts.ts",
  "lib/editorial-v2/planning-session.ts",
  "lib/editorial-v2/scene-card-validation.ts",
  "lib/editorial-v2/scene-cards.ts",
  "lib/editorial-v2/scene-overrides.ts",
  "lib/editorial-v2/visual-planning.ts",
  "scripts/check-shorts-editorial-os-v2-slice4.mjs",
];
const TYPECHECK_FILES = [
  "next-env.d.ts",
  "lib/editorial-v2/contracts.ts",
  "lib/editorial-v2/character-directions.ts",
  "lib/editorial-v2/character-rig.ts",
  "lib/editorial-v2/character-motion.ts",
  "lib/editorial-v2/character-motion-planner.ts",
  "lib/editorial-v2/character-selection.ts",
  "components/editorial-v2/EditorialV2Workbench.tsx",
  "components/editorial-v2/ScenePlanningWorkbench.tsx",
  "components/editorial-v2/CharacterSvgPreview.tsx",
  "components/editorial-v2/CharacterMotionWorkbench.tsx",
];
const PRODUCT_FILES = [
  "lib/editorial-v2/character-directions.ts",
  "lib/editorial-v2/character-rig.ts",
  "lib/editorial-v2/character-motion.ts",
  "lib/editorial-v2/character-motion-planner.ts",
  "lib/editorial-v2/character-selection.ts",
  "components/editorial-v2/EditorialV2Workbench.tsx",
  "components/editorial-v2/ScenePlanningWorkbench.tsx",
  "components/editorial-v2/CharacterSvgPreview.tsx",
  "components/editorial-v2/CharacterMotionWorkbench.tsx",
  "components/editorial-v2/CharacterMotionWorkbench.module.css",
];

let pass = 0;
let fail = 0;
function check(name, ok, detail = "") {
  if (ok) { pass += 1; console.log(`PASS  ${name}`); }
  else { fail += 1; console.error(`FAIL  ${name}${detail ? ` — ${detail}` : ""}`); }
}
function resolveRepo(relativePath) {
  const resolved = path.resolve(ROOT, relativePath);
  const relative = path.relative(ROOT, resolved);
  if (relative.startsWith("..") || path.isAbsolute(relative)) throw new Error(`Path escaped: ${relativePath}`);
  return resolved;
}
function readRepo(relativePath) { return readFileSync(resolveRepo(relativePath), "utf8"); }
function sha256File(relativePath) { return createHash("sha256").update(readFileSync(resolveRepo(relativePath))).digest("hex"); }
function gitRaw(args) { return execFileSync("git", args, { cwd: ROOT, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }); }
function git(args) { return gitRaw(args).trim(); }
function parseStatus() {
  const output = gitRaw(["status", "--porcelain=v1", "--untracked-files=all"]).replace(/\r?\n$/u, "");
  return output ? output.split(/\r?\n/u).map((line) => ({ status: line.slice(0, 2), path: line.slice(3) })) : [];
}
function sameSet(left, right) { return JSON.stringify([...left].sort()) === JSON.stringify([...right].sort()); }
function clone(value) { return JSON.parse(JSON.stringify(value)); }

const baseline = JSON.parse(readRepo(BASELINE_PATH));
const status = parseStatus();
const statusPaths = status.map((entry) => entry.path);
const allowedStatusPaths = [...baseline.statusPaths.map((entry) => entry.path), ...baseline.slice5ExactAllowlist];
const baselineByPath = new Map(baseline.statusPaths.map((entry) => [entry.path, entry]));

check("baseline manifest version", baseline.manifestVersion === "1.0.0");
check("baseline repository identity", baseline.repository === "Shorts Editorial OS V2");
check("baseline capture HEAD", baseline.git.head === CHECKPOINT_HEAD);
check("baseline capture parent", baseline.git.parent === CHECKPOINT_PARENT);
check("baseline capture upstream", baseline.git.upstream.ahead === 5 && baseline.git.upstream.behind === 0);
check("baseline modified count 21", baseline.git.modifiedCount === 21);
check("baseline untracked count 3", baseline.git.untrackedCount === 3);
check("baseline staged count 0", baseline.git.stagedCount === 0);
check("baseline status count 24", baseline.git.statusPathCount === 24 && baseline.statusPaths.length === 24);
check("baseline diff stat", baseline.git.trackedDiffShortStat === "21 files changed, 635 insertions(+), 260 deletions(-)");
check("baseline reconstructability explicit", baseline.baselineReconstructability === "NOT_RECONSTRUCTABLE");
check("baseline exact allowlist 15", baseline.slice5ExactAllowlist.length === 15);
check("baseline new allowlist 10", baseline.slice5NewFileAllowlist.length === 10);
check("baseline modified allowlist 5", baseline.slice5ModifiedFileAllowlist.length === 5);
check("baseline allowlist unique", new Set(baseline.slice5ExactAllowlist).size === 15);
check("baseline new and modified partition", sameSet([...baseline.slice5NewFileAllowlist, ...baseline.slice5ModifiedFileAllowlist], baseline.slice5ExactAllowlist));
check("baseline protection exceptions exact", sameSet(baseline.protectionExceptions, ["_ai/PROJECT_STATE.md", "_ai/NEXT_ACTION.md"]));
check("all Slice 5 new files exist", baseline.slice5NewFileAllowlist.every((file) => existsSync(resolveRepo(file))));
check("all Slice 5 modified files exist", baseline.slice5ModifiedFileAllowlist.every((file) => existsSync(resolveRepo(file))));
check("status has expected 39 paths", status.length === 39, String(status.length));
check("status contains no unexpected path", statusPaths.every((file) => allowedStatusPaths.includes(file)));
check("status includes every allowlisted path", baseline.slice5ExactAllowlist.every((file) => statusPaths.includes(file)));
check("new file statuses are untracked", baseline.slice5NewFileAllowlist.every((file) => status.find((entry) => entry.path === file)?.status === "??"));
check("modified file statuses are unstaged", baseline.slice5ModifiedFileAllowlist.every((file) => status.find((entry) => entry.path === file)?.status === " M"));
check("staged path count zero", status.filter((entry) => entry.status !== "??" && entry.status[0] !== " ").length === 0);
check("current branch", git(["branch", "--show-current"]) === baseline.git.branch);
check("current HEAD unchanged", git(["rev-parse", "HEAD"]) === CHECKPOINT_HEAD);
check("current upstream +5/-0", git(["rev-list", "--left-right", "--count", "HEAD...@{upstream}"]).split(/\s+/u).join(":") === "5:0");

const protectedHashMismatch = baseline.statusPaths.filter((entry) => sha256File(entry.path) !== entry.sha256);
const protectedStatusMismatch = baseline.statusPaths.filter((entry) => status.find((item) => item.path === entry.path)?.status !== entry.status);
check("protected dirty hashes unchanged", protectedHashMismatch.length === 0, protectedHashMismatch.map((entry) => entry.path).join(", "));
check("protected dirty status unchanged", protectedStatusMismatch.length === 0, protectedStatusMismatch.map((entry) => entry.path).join(", "));
for (const entry of baseline.governanceCriticalPaths) check(`governance critical hash: ${entry.path}`, sha256File(entry.path) === entry.sha256);
const modifiableCritical = new Set([
  "lib/editorial-v2/contracts.ts",
  "components/editorial-v2/EditorialV2Workbench.tsx",
  "components/editorial-v2/ScenePlanningWorkbench.tsx",
]);
for (const entry of baseline.checkpointCriticalPaths.filter((item) => !modifiableCritical.has(item.path))) {
  check(`checkpoint critical hash: ${entry.path}`, sha256File(entry.path) === entry.sha256);
}
check("checkpoint parent identity", git(["rev-parse", "HEAD^"]) === CHECKPOINT_PARENT);
check("checkpoint message identity", git(["log", "-1", "--format=%s"]) === CHECKPOINT_MESSAGE);
const checkpointNameStatus = gitRaw(["diff-tree", "--no-commit-id", "--name-status", "-r", "HEAD"]).trim().split(/\r?\n/u);
const checkpointPaths = checkpointNameStatus.map((line) => line.split("\t").at(-1));
check("Slice 4 checkpoint path count 14", checkpointPaths.length === 14);
check("Slice 4 checkpoint exact paths", sameSet(checkpointPaths, CHECKPOINT_PATHS));
check("middleware remains absent", ["middleware.ts", "middleware.js", "src/middleware.ts", "src/middleware.js"].every((file) => !existsSync(resolveRepo(file))));

const [contractsAdded, contractsDeleted] = git(["diff", "--numstat", "HEAD", "--", "lib/editorial-v2/contracts.ts"]).split(/\s+/u).slice(0, 2).map(Number);
check("contracts additive insertions present", contractsAdded > 0);
check("contracts deletions zero", contractsDeleted === 0, String(contractsDeleted));
const contractsAtHead = gitRaw(["show", "HEAD:lib/editorial-v2/contracts.ts"]);
const contractsSource = readRepo("lib/editorial-v2/contracts.ts");
for (const interfaceName of ["SceneCard", "ApprovedDetailedScriptSessionSnapshot", "SceneVisualPlan", "ScenePlanningSessionState"]) {
  const pattern = new RegExp(`export interface ${interfaceName} \\{[\\s\\S]*?\\n\\}`, "u");
  check(`existing ${interfaceName} first declaration unchanged`, pattern.exec(contractsAtHead)?.[0] === pattern.exec(contractsSource)?.[0]);
}
const legacyCharacterMotion = /export type CharacterMotionTag =[\s\S]*?;\r?\n/u;
check("legacy CharacterMotionTag union unchanged", legacyCharacterMotion.exec(contractsAtHead)?.[0] === legacyCharacterMotion.exec(contractsSource)?.[0]);
check("artifact kind exactly 12", /EDITORIAL_V2_ARTIFACT_KINDS/u.test(contractsSource));
check("contracts add no any", !/\bany\b/u.test(contractsSource));
for (const typeName of [
  "ApprovedScenePlanningSessionSnapshot", "CharacterDirectionId", "CharacterDirectionStatus",
  "CharacterDirectionDefinition", "CharacterSilhouetteClass", "CharacterVisualRole", "CharacterRigLayerId",
  "CharacterRigLayerDefinition", "CharacterRigDefinition", "CharacterMotionTag", "CharacterMotionIntensity",
  "CharacterMotionTiming", "CharacterMotionKeyframe", "CharacterMotionDefinition", "CharacterMotionPlan",
  "SceneCharacterMotionAssignment", "CharacterComparisonScene", "CharacterComparisonResult",
  "CharacterOriginalityCheckId", "CharacterOriginalityCheck", "CharacterAccessibilityReview",
  "CharacterRightsReview", "CharacterDirectionSelectionDraft", "CharacterDirectionValidationIssue",
  "CharacterDirectionValidationSummary", "CharacterDirectionApprovalState",
  "ApprovedCharacterMotionSessionSnapshot", "CharacterMotionSessionState",
]) check(`contract exists: ${typeName}`, new RegExp(`export (?:interface|type) ${typeName}\\b`, "u").test(contractsSource));
for (const token of ["comparison_only", "internal_svg_primitives_only", "character_secondary_evidence_first", "productionRendered: false", "productionAssetCreated: false", "finalIdentityApproved: false", "sessionOnly: true"])
  check(`Slice 5 contract boundary: ${token}`, contractsSource.includes(token));
const slice5ContractSource = contractsSource.slice(contractsSource.indexOf("// Slice 5 augments"));
check("Slice 5 interface fields readonly", !/\n\s{2}(?!readonly|export|\/\/|\||\}|\{)[A-Za-z][A-Za-z0-9]*\??\s*:/u.test(slice5ContractSource));

const statusText = gitRaw(["status", "--porcelain=v1", "--untracked-files=all"]);
check("working tree deletion zero", !/^ D|^D /mu.test(statusText));
check("working tree rename zero", !/^R/mu.test(statusText));
const combinedProduct = PRODUCT_FILES.map(readRepo).join("\n");
for (const [label, pattern] of [
  ["fetch", /\bfetch\s*\(/u], ["XMLHttpRequest", /\bXMLHttpRequest\b/u], ["WebSocket", /\bWebSocket\b/u],
  ["EventSource", /\bEventSource\b/u], ["filesystem import", /from\s+["']node:(?:fs|path)/u],
  ["database adapter", /@supabase|\bprisma\b|database client/iu], ["localStorage", /\blocalStorage\b/u],
  ["IndexedDB", /\bindexedDB\b/u], ["eval", /\beval\s*\(/u], ["Function constructor", /new\s+Function\b/u],
  ["dangerouslySetInnerHTML", /dangerouslySetInnerHTML/u], ["server action", /["']use server["']/u],
  ["scratch root", /c:\\tmp/iu], ["V1 import", /VideoCreationWizard|owner-web-operator|money-shorts|fact-cards/u],
  ["image generation SDK", /image_gen|openai\.images|replicate/iu], ["render adapter", /ffmpeg|remotion|renderMedia/iu],
  ["external image element", /<image\b|<img\b/iu], ["data URI", /data:image/iu],
]) check(`static safety ${label} zero`, !pattern.test(combinedProduct));
check("pure core no clock random UUID", !/Date\.now|Math\.random|randomUUID|crypto\.randomUUID/u.test(PRODUCT_FILES.filter((file) => file.startsWith("lib/")).map(readRepo).join("\n")));

let ts;
try { const imported = await import("typescript"); ts = imported.default ?? imported; }
catch (error) { console.error(`UNVERIFIED_TOOLING_LIMITATION ${error.message}`); process.exit(2); }
const configPath = resolveRepo("tsconfig.json");
const configResult = ts.readConfigFile(configPath, ts.sys.readFile);
const parsedConfig = ts.parseJsonConfigFileContent(configResult.config, ts.sys, ROOT, { noEmit: true, incremental: false, tsBuildInfoFile: undefined }, configPath);
const program = ts.createProgram({ rootNames: TYPECHECK_FILES.map(resolveRepo), options: parsedConfig.options });
const syntactic = program.getSyntacticDiagnostics();
const semantic = program.getSemanticDiagnostics();
check("targeted TypeScript syntactic diagnostics zero", syntactic.length === 0, String(syntactic.length));
check("targeted TypeScript semantic diagnostics zero", semantic.length === 0, semantic.slice(0, 3).map((entry) => ts.flattenDiagnosticMessageText(entry.messageText, " ")).join(" | "));

const moduleCache = new Map();
function loadTypescriptModule(relativePath) {
  const absolutePath = resolveRepo(relativePath);
  if (moduleCache.has(absolutePath)) return moduleCache.get(absolutePath).exports;
  const transpiled = ts.transpileModule(readFileSync(absolutePath, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true }, fileName: absolutePath, reportDiagnostics: true });
  const errors = (transpiled.diagnostics ?? []).filter((entry) => entry.category === ts.DiagnosticCategory.Error);
  if (errors.length) throw new Error(ts.flattenDiagnosticMessageText(errors[0].messageText, " "));
  const record = { exports: {} };
  moduleCache.set(absolutePath, record);
  const localRequire = (specifier) => {
    if (!specifier.startsWith(".")) throw new Error(`Unexpected runtime import: ${specifier}`);
    const candidate = path.resolve(path.dirname(absolutePath), specifier);
    const resolved = candidate.endsWith(".ts") ? candidate : `${candidate}.ts`;
    return loadTypescriptModule(path.relative(ROOT, resolved).replaceAll("\\", "/"));
  };
  const wrapper = vm.runInThisContext(`(function(exports, require, module){${transpiled.outputText}\n})`, { filename: absolutePath });
  wrapper(record.exports, localRequire, record);
  return record.exports;
}

const contracts = loadTypescriptModule("lib/editorial-v2/contracts.ts");
const sceneCardsModule = loadTypescriptModule("lib/editorial-v2/scene-cards.ts");
const sceneValidationModule = loadTypescriptModule("lib/editorial-v2/scene-card-validation.ts");
const visualModule = loadTypescriptModule("lib/editorial-v2/visual-planning.ts");
const directionsModule = loadTypescriptModule("lib/editorial-v2/character-directions.ts");
const rigModule = loadTypescriptModule("lib/editorial-v2/character-rig.ts");
const motionModule = loadTypescriptModule("lib/editorial-v2/character-motion.ts");
const plannerModule = loadTypescriptModule("lib/editorial-v2/character-motion-planner.ts");
const selectionModule = loadTypescriptModule("lib/editorial-v2/character-selection.ts");

const sources = [
  { sourceId:"src-a", signalId:"sig-a", publisher:"공식기관 A", title:"공식 자료 A", url:"https://example.com/a", publishedAt:"2026-08-04T01:00:00Z", eventDate:"2026-08-04", freshness:"fresh", originalIndex:0 },
  { sourceId:"src-b", signalId:"sig-b", publisher:"공식기관 B", title:"공식 자료 B", url:"https://example.com/b", publishedAt:"2026-08-03T01:00:00Z", eventDate:"2026-08-03", freshness:"fresh", originalIndex:1 },
  { sourceId:"src-c", signalId:"sig-c", publisher:"공식기관 C", title:"공식 자료 C", url:"https://example.com/c", publishedAt:"2026-08-02T01:00:00Z", eventDate:"2026-08-02", freshness:"fresh", originalIndex:2 },
];
const claims = contracts.DETAILED_SCRIPT_BEAT_TYPES.map((beatType, index) => ({
  claimId:`claim-${index + 1}`, signalId:`sig-${index + 1}`, headline:`근거 ${index + 1}`,
  claim:`검증된 주장 ${index + 1}`, whyNow:`현재 이유 ${index + 1}`, audienceImpact:`생활 영향 ${index + 1}`,
  sourceRefs:index === 1 ? ["src-a","src-b"] : [sources[index % sources.length].sourceId],
  numberRefs:index === 0 ? ["num-1"] : index === 2 ? ["num-1","num-2"] : [],
}));
const numbers = [
  { numberId:"num-1", signalId:"sig-1", value:3.5, unit:"%", currency:null, asOf:"2026-08-04", context:"지표 A", sourceRefs:["src-a"] },
  { numberId:"num-2", signalId:"sig-3", value:4, unit:"%", currency:null, asOf:"2026-08-03", context:"지표 B", sourceRefs:["src-b"] },
  { numberId:"num-3", signalId:"sig-4", value:120, unit:"원", currency:"KRW", asOf:"2026-08-02", context:"비용", sourceRefs:["src-c"] },
];
const evidencePack = {
  verificationLevel:"structural_only",
  provenance:{rawHash:"a".repeat(64),normalizedHash:"b".repeat(64),researchCutoffDate:"2026-08-04",researchWindow:"7d",domain:"생활경제",audience:"직장인",targetDurationSeconds:30,sourceImportSchemaVersion:"2.0.0-alpha.1"},
  sources, claims, numbers,
  coverage:{sourceCount:3,signalCount:8,numberCount:3,freshSourceCount:3,signalCoverage:[],warnings:[]},
};
const selectedAngle = {selectedAngleId:"angle-1",candidateId:"candidate-1",sourceSignalId:"sig-1",workingTitle:"생활 지표 변화",hookPromise:"숫자의 의미를 확인합니다",angleStatement:"근거로 생활 영향을 설명합니다",viewerQuestion:"무엇을 확인해야 할까요?",sourceRefs:["src-a","src-b","src-c"],claimRefs:claims.map((entry)=>entry.claimId),numberRefs:numbers.map((entry)=>entry.numberId)};
const beats = contracts.DETAILED_SCRIPT_BEAT_TYPES.map((beatType, index) => ({
  beatId:`beat-${index + 1}`, beatType, purpose:index === 6 ? "위험 경고 확인" : "장면 목적",
  narration:index === 0 ? "공식 지표는 3.5%입니다." : index === 2 ? "3.5%와 4%를 비교합니다." : "검증된 주장을 확인합니다.",
  keyCaption:index === 0 ? "3.5% 공식 지표" : index === 2 ? "3.5% vs 4%" : "핵심 근거",
  claimRefs:[`claim-${index + 1}`], sourceRefs:index === 1 ? ["src-a","src-b"] : [sources[index % sources.length].sourceId],
  numberRefs:index === 0 ? ["num-1"] : index === 2 ? ["num-1","num-2"] : [], retentionDevice:"다음 근거",
}));
const approvedScriptSnapshot = {
  approvedScript:{schemaVersion:"2.0.0-alpha.1",selectedAngleId:"angle-1",title:"생활 지표 변화",audience:"직장인",durationSeconds:30,thesis:"근거 중심 설명",beats,closingAction:"공식 자료를 확인하세요",nextSignal:"다음 발표",financialSafetyNote:"정보 제공 목적"},
  evidencePack, selectedAngle, scriptRawHash:"c".repeat(64), scriptNormalizedHash:"d".repeat(64), evidenceIdentity:"b".repeat(64),
  validation:{valid:true,issues:[],validatedAt:"2026-08-04T00:00:00.000Z",blockingIssueCount:0,warningCount:0}, approvalState:"approved", audience:"직장인", durationSeconds:30,
};
const sceneCards = sceneCardsModule.buildSceneCardDrafts(approvedScriptSnapshot);
const sceneValidation = sceneValidationModule.validateSceneCardDrafts(sceneCards, approvedScriptSnapshot);
const visualPlan = visualModule.buildVisualAssetPlan(sceneCards, approvedScriptSnapshot);
const visualProof = visualModule.validateVisualAssetPlan(visualPlan, sceneCards, approvedScriptSnapshot);
const planningSnapshot = {
  approvedScriptIdentity: approvedScriptSnapshot.scriptNormalizedHash,
  approvedScriptRawHash: approvedScriptSnapshot.scriptRawHash,
  approvedScriptNormalizedHash: approvedScriptSnapshot.scriptNormalizedHash,
  evidenceIdentity: approvedScriptSnapshot.evidenceIdentity,
  selectedAngleId: selectedAngle.selectedAngleId,
  sceneCards, sceneValidation, visualPlan, visualProof, approvalState:"approved",
};

const directionIds = ["loop_signal_navigator", "pin_field_finch", "moa_archive_sprite"];
const directionsOne = directionsModule.getCharacterDirections();
const directionsTwo = directionsModule.getCharacterDirections();
check("directions exactly 3", directionsOne.length === 3);
check("direction stable IDs exact", JSON.stringify(directionsOne.map((entry) => entry.directionId)) === JSON.stringify(directionIds));
check("directions deterministic deep equal", JSON.stringify(directionsOne) === JSON.stringify(directionsTwo));
check("direction clone top-level isolated", directionsOne !== directionsTwo && directionsOne[0] !== directionsTwo[0]);
check("direction clone arrays isolated", directionsOne[0].prohibitedMotifs !== directionsTwo[0].prohibitedMotifs);
check("direction IDs unique", new Set(directionsOne.map((entry) => entry.directionId)).size === 3);
check("direction silhouettes distinct", new Set(directionsOne.map((entry) => entry.silhouetteDescription)).size === 3);
check("direction display names distinct", new Set(directionsOne.map((entry) => entry.temporaryDisplayName)).size === 3);
for (const direction of directionsOne) {
  check(`${direction.directionId} comparison-only`, direction.status === "comparison_only");
  check(`${direction.directionId} provisional not final`, direction.finalIdentityApproved === false);
  check(`${direction.directionId} internal provenance`, direction.rightsProvenance === "internal_svg_primitives_only");
  check(`${direction.directionId} evidence priority`, direction.evidencePriorityRule === "character_secondary_evidence_first");
  check(`${direction.directionId} visual roles`, direction.visualRoles.length >= 3);
  check(`${direction.directionId} motion emphasis`, direction.motionVocabularyEmphasis.length >= 3);
  check(`${direction.directionId} occupancy compact`, direction.screenOccupancyTargetPercent > 0 && direction.screenOccupancyTargetPercent <= 16);
  check(`${direction.directionId} reduced motion defined`, direction.reducedMotionBehavior.length >= 20);
  check(`${direction.directionId} accessibility defined`, direction.accessibilityConsiderations.length >= 3);
  check(`${direction.directionId} similarity risk explicit`, direction.similarityRisks.length >= 2);
  check(`${direction.directionId} money motif prohibited`, direction.prohibitedMotifs.includes("money_coin_banknote_face"));
  check(`${direction.directionId} primary evidence prohibited`, direction.prohibitedMotifs.includes("character_as_primary_evidence"));
  check(`${direction.directionId} third-party marks prohibited`, direction.prohibitedMotifs.includes("third_party_logo_or_trademark"));
  check(`${direction.directionId} real person prohibited`, direction.prohibitedMotifs.includes("real_person_face"));
}
check("Loop open-ring silhouette", directionsOne[0].silhouetteClass === "asymmetric_open_signal_ring" && directionsOne[0].prohibitedMotifs.includes("closed_coin_circle"));
check("Pin functional device silhouette", directionsOne[1].silhouetteClass === "direction_pin_with_information_wings" && directionsOne[1].prohibitedMotifs.includes("literal_bird_face"));
check("Moa archive silhouette", directionsOne[2].silhouetteClass === "layered_archive_tabs" && directionsOne[2].prohibitedMotifs.includes("document_face"));

const rigs = directionIds.map((directionId) => rigModule.buildCharacterRig(directionId));
const rigsAgain = directionIds.map((directionId) => rigModule.buildCharacterRig(directionId));
for (const [index, rig] of rigs.entries()) {
  const directionId = directionIds[index];
  const validation = rigModule.validateCharacterRig(rig);
  const clonedRig = rigModule.cloneCharacterRig(rig);
  check(`${directionId} rig deterministic`, JSON.stringify(rig) === JSON.stringify(rigsAgain[index]));
  check(`${directionId} rig direction identity`, rig.directionId === directionId);
  check(`${directionId} rig version`, rig.rigVersion === "character-rig-v1");
  check(`${directionId} stable viewBox`, JSON.stringify(rig.viewBox) === "[0,0,240,240]");
  check(`${directionId} rig layers present`, rig.layers.length >= 7);
  check(`${directionId} layer IDs unique`, new Set(rig.layers.map((entry) => entry.layerId)).size === rig.layers.length);
  check(`${directionId} z-order unique`, new Set(rig.layers.map((entry) => entry.zOrder)).size === rig.layers.length);
  check(`${directionId} transforms finite`, rig.layers.every((entry) => [...entry.transformOrigin, ...entry.translation, entry.opacity, entry.scale, entry.rotationDegrees].every(Number.isFinite)));
  check(`${directionId} evidence layers known`, rig.evidenceNavigationLayerIds.every((layerId) => rig.layers.some((entry) => entry.layerId === layerId)));
  check(`${directionId} reduced representation`, rig.layers.some((entry) => entry.reducedMotionVisible));
  check(`${directionId} production export false`, rig.productionExportReady === false);
  check(`${directionId} rig validates clean`, validation.valid && validation.blockingIssueCount === 0);
  check(`${directionId} rig clone deep equal`, JSON.stringify(clonedRig) === JSON.stringify(rig));
  check(`${directionId} rig clone isolated`, clonedRig !== rig && clonedRig.layers !== rig.layers && clonedRig.layers[0] !== rig.layers[0]);
}
const duplicateLayerRig = clone(rigs[0]); duplicateLayerRig.layers[1].layerId = duplicateLayerRig.layers[0].layerId;
check("duplicate rig layer blocked", rigModule.validateCharacterRig(duplicateLayerRig).issues.some((entry) => entry.code === "DUPLICATE_LAYER_ID" && entry.blocking));
const duplicateZRig = clone(rigs[0]); duplicateZRig.layers[1].zOrder = duplicateZRig.layers[0].zOrder;
check("duplicate rig z-order blocked", rigModule.validateCharacterRig(duplicateZRig).issues.some((entry) => entry.code === "INVALID_Z_ORDER" && entry.blocking));
const negativeZRig = clone(rigs[0]); negativeZRig.layers[0].zOrder = -1;
check("negative rig z-order blocked", rigModule.validateCharacterRig(negativeZRig).issues.some((entry) => entry.code === "INVALID_Z_ORDER"));
const unsupportedEvidenceLayerRig = clone(rigs[0]); unsupportedEvidenceLayerRig.evidenceNavigationLayerIds = ["evidencePanel"];
check("unsupported evidence layer ref blocked", rigModule.validateCharacterRig(unsupportedEvidenceLayerRig).issues.some((entry) => entry.code === "UNSUPPORTED_EVIDENCE_LAYER_REF"));
const noEvidenceLayerRig = clone(rigs[0]); noEvidenceLayerRig.evidenceNavigationLayerIds = [];
check("missing evidence layer blocked", rigModule.validateCharacterRig(noEvidenceLayerRig).issues.some((entry) => entry.code === "MISSING_EVIDENCE_NAVIGATION_LAYER"));
const nonFiniteRig = clone(rigs[0]); nonFiniteRig.layers[0].scale = Number.NaN;
check("non-finite transform blocked", rigModule.validateCharacterRig(nonFiniteRig).issues.some((entry) => entry.code === "NON_FINITE_TRANSFORM"));
const noReducedRig = clone(rigs[0]); noReducedRig.layers = noReducedRig.layers.map((entry) => ({ ...entry, reducedMotionVisible:false }));
check("missing reduced representation blocked", rigModule.validateCharacterRig(noReducedRig).issues.some((entry) => entry.code === "MISSING_REDUCED_MOTION_REPRESENTATION"));
const noMoneyGuardRig = clone(rigs[0]); noMoneyGuardRig.prohibitedMotifMarkers = [];
check("money motif guard removal blocked", rigModule.validateCharacterRig(noMoneyGuardRig).issues.some((entry) => entry.code === "MISSING_MONEY_MOTIF_GUARD"));
const badViewBoxRig = clone(rigs[0]); badViewBoxRig.viewBox = [0,0,0,240];
check("invalid viewBox blocked", rigModule.validateCharacterRig(badViewBoxRig).issues.some((entry) => entry.code === "INVALID_VIEWBOX"));
const highOccupancyRig = clone(rigs[0]); highOccupancyRig.occupancyTargetPercent = 30;
check("high occupancy warned", rigModule.validateCharacterRig(highOccupancyRig).issues.some((entry) => entry.code === "OCCUPANCY_TARGET_WARNING" && !entry.blocking));

const vocabularyOne = motionModule.getCharacterMotionVocabulary();
const vocabularyTwo = motionModule.getCharacterMotionVocabulary();
check("motion vocabulary exactly 11", vocabularyOne.length === 11 && contracts.CHARACTER_RIG_MOTION_TAGS.length === 11);
check("motion tag IDs exact", JSON.stringify(vocabularyOne.map((entry) => entry.motionTag)) === JSON.stringify(contracts.CHARACTER_RIG_MOTION_TAGS));
check("motion tags unique", new Set(vocabularyOne.map((entry) => entry.motionTag)).size === 11);
check("motion vocabulary deterministic", JSON.stringify(vocabularyOne) === JSON.stringify(vocabularyTwo));
check("motion vocabulary clone isolated", vocabularyOne !== vocabularyTwo && vocabularyOne[0] !== vocabularyTwo[0] && vocabularyOne[0].keyframes !== vocabularyTwo[0].keyframes);
for (const motion of vocabularyOne) {
  check(`${motion.motionTag} semantic purpose`, motion.semanticPurpose.length >= 12);
  check(`${motion.motionTag} duration finite`, Number.isFinite(motion.timing.durationMs) && motion.timing.durationMs >= 500);
  check(`${motion.motionTag} easing token`, ["ease_in_out","ease_out","linear_soft"].includes(motion.timing.easingToken));
  check(`${motion.motionTag} loop policy bounded`, ["none","limited_2","ambient_pause"].includes(motion.timing.loopPolicy));
  check(`${motion.motionTag} keyframes present`, motion.keyframes.length >= 3);
  check(`${motion.motionTag} keyframe offsets bounded`, motion.keyframes.every((entry) => entry.offset >= 0 && entry.offset <= 1));
  check(`${motion.motionTag} transform limits safe`, motion.maximumScale <= 1.1 && motion.maximumRotationDegrees <= 8 && motion.maximumTranslation <= 10);
  check(`${motion.motionTag} occupancy safe`, motion.screenOccupancyConstraintPercent <= 16);
  check(`${motion.motionTag} reduced alternative`, motion.reducedMotionAlternative.length >= 12);
  check(`${motion.motionTag} obstruction policy`, motion.evidenceObstructionPolicy === "never_cover_primary_evidence");
  check(`${motion.motionTag} all directions allowed`, sameSet(motion.allowedDirectionIds, directionIds));
  check(`${motion.motionTag} no new facts`, motion.createsNewFact === false);
  check(`${motion.motionTag} no rapid flash`, motion.rapidFlashAllowed === false);
  check(`${motion.motionTag} affected layer or role`, motion.affectedLayerIds.length > 0 && motion.affectedSemanticRoles.length > 0);
}
check("idle motion avoids continuous bounce", motionModule.getCharacterMotionDefinition("idle_scan").timing.loopPolicy === "ambient_pause");
check("warning pulse bounded", motionModule.getCharacterMotionDefinition("warning_pulse").timing.loopPolicy === "limited_2");
check("number emphasis semantic", /number ref|숫자/u.test(motionModule.getCharacterMotionDefinition("number_emphasis").semanticPurpose));
check("source scan semantic", /source ref|출처/u.test(motionModule.getCharacterMotionDefinition("source_scan").semanticPurpose));

const planningBefore = JSON.stringify(planningSnapshot);
const representativeOne = plannerModule.selectRepresentativeComparisonScene(planningSnapshot);
const representativeTwo = plannerModule.selectRepresentativeComparisonScene(planningSnapshot);
check("representative scene exists", representativeOne !== null);
check("representative scene deterministic", JSON.stringify(representativeOne) === JSON.stringify(representativeTwo));
check("representative scene enabled", sceneCards.find((entry) => entry.sceneId === representativeOne.sceneId)?.enabled === true);
check("representative scene evidence-first", visualPlan.find((entry) => entry.sceneId === representativeOne.sceneId)?.primaryStrategyClass === "evidence_first");
check("representative scene has refs", representativeOne.numberRefs.length + representativeOne.sourceRefs.length > 0);
check("representative scene middle preference", representativeOne.sceneOrder >= 3 && representativeOne.sceneOrder <= 6);
check("representative scene preserves narration", representativeOne.narration === sceneCards.find((entry) => entry.sceneId === representativeOne.sceneId)?.narration);
check("representative scene preserves caption", representativeOne.keyCaption === sceneCards.find((entry) => entry.sceneId === representativeOne.sceneId)?.keyCaption);
check("representative selection input mutation zero", JSON.stringify(planningSnapshot) === planningBefore);
const emptyPlanning = { ...planningSnapshot, sceneCards:planningSnapshot.sceneCards.map((entry) => ({ ...entry, enabled:false })) };
check("no enabled representative returns null", plannerModule.selectRepresentativeComparisonScene(emptyPlanning) === null);

const plans = directionIds.map((directionId) => plannerModule.buildCharacterMotionPlan(planningSnapshot, directionId));
const plansAgain = directionIds.map((directionId) => plannerModule.buildCharacterMotionPlan(planningSnapshot, directionId));
const enabledCount = sceneCards.filter((entry) => entry.enabled).length;
for (const [index, plan] of plans.entries()) {
  const directionId = directionIds[index];
  const validation = plannerModule.validateCharacterMotionPlan(plan, planningSnapshot);
  check(`${directionId} motion plan deterministic`, JSON.stringify(plan) === JSON.stringify(plansAgain[index]));
  check(`${directionId} plan identity`, plan.directionId === directionId);
  check(`${directionId} plan version`, plan.planVersion === "character-motion-plan-v1" && plan.vocabularyVersion === "character-motion-v1");
  check(`${directionId} enabled assignment count`, plan.assignments.length === enabledCount);
  check(`${directionId} reduced assignment count`, plan.reducedMotionAssignments.length === enabledCount);
  check(`${directionId} scene order preserved`, plan.assignments.every((entry, assignmentIndex) => entry.sceneId === sceneCards.filter((scene) => scene.enabled)[assignmentIndex].sceneId));
  check(`${directionId} character secondary only`, plan.assignments.every((entry) => entry.characterRole === "secondary_evidence_navigation"));
  check(`${directionId} primary strategy preserved`, plan.assignments.every((entry) => entry.primaryVisualStrategy === visualPlan.find((visual) => visual.sceneId === entry.sceneId)?.primaryStrategy));
  check(`${directionId} reduced semantic preserved`, plan.reducedMotionAssignments.every((entry, assignmentIndex) => entry.motionTag === plan.assignments[assignmentIndex].motionTag));
  check(`${directionId} reduced intensity low`, plan.reducedMotionAssignments.every((entry) => entry.intensity === "low"));
  check(`${directionId} obstruction clear`, plan.assignments.every((entry) => entry.obstructionWarning === null));
  check(`${directionId} production rendered false`, plan.productionRendered === false);
  check(`${directionId} plan validates clean`, validation.valid && validation.blockingIssueCount === 0);
}
check("same scene gets same semantic tag across directions", plans.every((plan) => plan.assignments.find((entry) => entry.sceneId === representativeOne.sceneId)?.motionTag === plans[0].assignments.find((entry) => entry.sceneId === representativeOne.sceneId)?.motionTag));
check("planning input mutation remains zero", JSON.stringify(planningSnapshot) === planningBefore);
const badIdentityPlan = clone(plans[0]); badIdentityPlan.sourcePlanningIdentity = "other";
check("planning identity mismatch blocked", plannerModule.validateCharacterMotionPlan(badIdentityPlan, planningSnapshot).issues.some((entry) => entry.code === "PLANNING_IDENTITY_MISMATCH"));
const duplicateAssignmentPlan = clone(plans[0]); duplicateAssignmentPlan.assignments[1].sceneId = duplicateAssignmentPlan.assignments[0].sceneId;
check("duplicate scene assignment blocked", plannerModule.validateCharacterMotionPlan(duplicateAssignmentPlan, planningSnapshot).issues.some((entry) => entry.code === "DUPLICATE_SCENE_ASSIGNMENT"));
const unknownAssignmentPlan = clone(plans[0]); unknownAssignmentPlan.assignments[0].sceneId = "unknown-scene";
check("unknown scene assignment blocked", plannerModule.validateCharacterMotionPlan(unknownAssignmentPlan, planningSnapshot).issues.some((entry) => entry.code === "UNSUPPORTED_SCENE_REF"));
const primaryMutationPlan = clone(plans[0]); primaryMutationPlan.assignments[0].primaryVisualStrategy = "map";
check("primary strategy mutation blocked", plannerModule.validateCharacterMotionPlan(primaryMutationPlan, planningSnapshot).issues.some((entry) => entry.code === "PRIMARY_STRATEGY_MUTATED"));
const numberPrereqPlan = clone(plans[0]); const noNumberIndex = numberPrereqPlan.assignments.findIndex((entry) => entry.numberRefs.length === 0); numberPrereqPlan.assignments[noNumberIndex].motionTag = "number_emphasis";
check("number motion without number ref blocked", plannerModule.validateCharacterMotionPlan(numberPrereqPlan, planningSnapshot).issues.some((entry) => entry.code === "NUMBER_REF_REQUIRED"));
const sourcePrereqPlan = clone(plans[0]); sourcePrereqPlan.assignments[0].motionTag = "source_scan"; sourcePrereqPlan.assignments[0].sourceRefs = [];
check("source motion without source ref blocked", plannerModule.validateCharacterMotionPlan(sourcePrereqPlan, planningSnapshot).issues.some((entry) => entry.code === "SOURCE_REF_REQUIRED"));
const obstructionPlan = clone(plans[0]); obstructionPlan.assignments[0].obstructionWarning = "covers chart";
check("evidence obstruction blocked", plannerModule.validateCharacterMotionPlan(obstructionPlan, planningSnapshot).issues.some((entry) => entry.code === "EVIDENCE_OBSTRUCTION"));
const badReducedPlan = clone(plans[0]); badReducedPlan.reducedMotionAssignments[0].intensity = "high";
check("invalid reduced motion blocked", plannerModule.validateCharacterMotionPlan(badReducedPlan, planningSnapshot).issues.some((entry) => entry.code === "INVALID_REDUCED_MOTION_ASSIGNMENT"));
const disabledCharacterPlan = clone(plans[0]); disabledCharacterPlan.assignments[0].enabled = false;
check("per-scene character disable allowed", !plannerModule.validateCharacterMotionPlan(disabledCharacterPlan, planningSnapshot).issues.some((entry) => entry.code === "DISABLED_SCENE_ACTIVE"));

const selectionInitial = selectionModule.createCharacterDirectionSelectionDraft(planningSnapshot);
check("selection starts with 3 directions", selectionInitial.directions.length === 3);
check("selection starts with 3 rigs", selectionInitial.rigs.length === 3);
check("selection starts with 3 motion plans", selectionInitial.motionPlans.length === 3);
check("selection representative scene exists", selectionInitial.comparisonResult !== null);
check("selection comparison all directions", selectionInitial.comparisonResult.comparedDirectionIds.length === 3);
check("selection comparison same scene confirmed", selectionInitial.comparisonResult.sameSceneIdentityConfirmed);
check("selection comparison same tag confirmed", selectionInitial.comparisonResult.sameSemanticMotionTagConfirmed);
check("selection initially unselected", selectionInitial.selectedDirectionId === null);
check("selection initially unapproved", selectionInitial.approvalState === "not_approved");
check("selection final name null", selectionInitial.finalName === null);
check("selection final palette null", selectionInitial.finalPalette === null);
check("selection final brand null", selectionInitial.finalBrandIdentity === null);
check("selection rights internal", selectionInitial.rightsReview.sourceStatus === "OWNED_ORIGINAL" && selectionInitial.rightsReview.provenance === "internal_svg_primitives_only");
check("selection no external assets", selectionInitial.rightsReview.externalAssetsUsed === false);
check("selection no third-party marks", selectionInitial.rightsReview.thirdPartyMarksUsed === false);
check("selection no likeness", selectionInitial.rightsReview.realPersonLikenessUsed === false);
check("selection checklist exactly 15", selectionInitial.originalityChecks.length === 15);
check("selection checklist initially pending", selectionInitial.originalityChecks.every((entry) => !entry.confirmed && entry.blocking));
const selectionInitialClone = selectionModule.cloneCharacterDirectionSelectionDraft(selectionInitial);
check("selection clone deep equal", JSON.stringify(selectionInitialClone) === JSON.stringify(selectionInitial));
check("selection clone isolated", selectionInitialClone !== selectionInitial && selectionInitialClone.motionPlans !== selectionInitial.motionPlans && selectionInitialClone.originalityChecks !== selectionInitial.originalityChecks);
const initialSelectionSummary = selectionModule.validateCharacterDirectionSelection(selectionInitial, planningSnapshot);
check("selection without direction blocked", initialSelectionSummary.issues.some((entry) => entry.code === "SELECTED_DIRECTION_REQUIRED"));
check("selection without comparison review blocked", initialSelectionSummary.issues.some((entry) => entry.code === "COMPARISON_REVIEW_REQUIRED"));
check("selection without checklist blocked", initialSelectionSummary.issues.some((entry) => entry.code === "ORIGINALITY_CONFIRMATION_REQUIRED"));
check("selection without accessibility review blocked", initialSelectionSummary.issues.some((entry) => entry.code === "ACCESSIBILITY_REVIEW_BLOCKED"));
check("selection cannot approve initially", !selectionModule.canApproveCharacterDirection(initialSelectionSummary));

let completeSelection = selectionModule.selectProvisionalCharacterDirection(selectionInitial, "loop_signal_navigator");
completeSelection = selectionModule.setCharacterComparisonReview(completeSelection, true, true);
for (const item of completeSelection.originalityChecks) completeSelection = selectionModule.setCharacterOriginalityCheck(completeSelection, item.checkId, true);
const completeSummary = selectionModule.validateCharacterDirectionSelection(completeSelection, planningSnapshot);
check("complete selection selected direction", completeSelection.selectedDirectionId === "loop_signal_navigator");
check("complete selection standard reviewed", completeSelection.comparisonResult.standardMotionReviewed);
check("complete selection reduced reviewed", completeSelection.comparisonResult.reducedMotionReviewed);
check("complete selection accessibility clear", completeSelection.accessibilityReview.blockingIssueCount === 0 && completeSelection.accessibilityReview.reducedMotionCompared);
check("complete selection checklist confirmed", completeSelection.originalityChecks.every((entry) => entry.confirmed));
check("complete selection validation passes", completeSummary.valid && completeSummary.blockingIssueCount === 0);
check("complete selection can approve", selectionModule.canApproveCharacterDirection(completeSummary));
let directApprovalBlocked = false;
try { selectionModule.buildApprovedCharacterMotionSnapshot(completeSelection, planningSnapshot); } catch { directApprovalBlocked = true; }
check("approved snapshot requires explicit provisional state", directApprovalBlocked);
const provisionallyApprovedSelection = selectionModule.cloneCharacterDirectionSelectionDraft({ ...completeSelection, approvalState:"provisionally_approved" });
const approvedCharacter = selectionModule.buildApprovedCharacterMotionSnapshot(provisionallyApprovedSelection, planningSnapshot);
check("approved snapshot selected direction", approvedCharacter.selectedDirectionId === "loop_signal_navigator");
check("approved snapshot temporary name", approvedCharacter.temporaryDisplayName.includes("비교용"));
check("approved snapshot rig version", approvedCharacter.rigVersion === "character-rig-v1");
check("approved snapshot vocabulary version", approvedCharacter.motionVocabularyVersion === "character-motion-v1");
check("approved snapshot representative scene", approvedCharacter.comparisonSceneId === representativeOne.sceneId);
check("approved snapshot assignments cloned", approvedCharacter.sceneMotionAssignments !== completeSelection.motionPlans[0].assignments);
check("approved snapshot reduced assignments", approvedCharacter.reducedMotionAssignments.length === enabledCount);
check("approved snapshot originality cloned", approvedCharacter.originalityReview !== completeSelection.originalityChecks);
check("approved snapshot provisional only", approvedCharacter.provisionalApprovalState === "provisionally_approved" && approvedCharacter.finalIdentityApproved === false);
check("approved snapshot session-only", approvedCharacter.sessionOnly === true);
check("approved snapshot no production asset", approvedCharacter.productionAssetCreated === false);
check("approved snapshot source identity", approvedCharacter.sourcePlanningIdentity === plannerModule.buildPlanningIdentity(planningSnapshot));

const duplicateDirectionSelection = clone(completeSelection); duplicateDirectionSelection.directions[1].directionId = duplicateDirectionSelection.directions[0].directionId;
check("duplicate direction selection blocked", selectionModule.validateCharacterDirectionSelection(duplicateDirectionSelection, planningSnapshot).issues.some((entry) => entry.code === "DUPLICATE_DIRECTION_ID"));
const unknownDirectionSelection = clone(completeSelection); unknownDirectionSelection.selectedDirectionId = "unknown_direction";
check("unsupported selected direction blocked", selectionModule.validateCharacterDirectionSelection(unknownDirectionSelection, planningSnapshot).issues.some((entry) => entry.code === "SELECTED_DIRECTION_REQUIRED"));
const unfairSceneSelection = clone(completeSelection); unfairSceneSelection.comparisonResult.sameSceneIdentityConfirmed = false;
check("unfair scene comparison blocked", selectionModule.validateCharacterDirectionSelection(unfairSceneSelection, planningSnapshot).issues.some((entry) => entry.code === "COMPARISON_FAIRNESS"));
const changedNarrationSelection = clone(completeSelection); changedNarrationSelection.comparisonResult.scene.narration = "changed";
check("comparison narration mismatch blocked", selectionModule.validateCharacterDirectionSelection(changedNarrationSelection, planningSnapshot).issues.some((entry) => entry.code === "COMPARISON_SCENE_IDENTITY_MISMATCH"));
const mismatchedMotionSelection = clone(completeSelection); const representativeAssignment = mismatchedMotionSelection.motionPlans[1].assignments.find((entry) => entry.sceneId === representativeOne.sceneId); representativeAssignment.motionTag = representativeAssignment.motionTag === "number_emphasis" ? "idle_scan" : "number_emphasis";
check("comparison semantic mismatch blocked", selectionModule.validateCharacterDirectionSelection(mismatchedMotionSelection, planningSnapshot).issues.some((entry) => entry.code === "SEMANTIC_MOTION_MISMATCH"));
const uncheckedSelection = clone(completeSelection); uncheckedSelection.originalityChecks[0].confirmed = false;
check("unchecked originality blocked", selectionModule.validateCharacterDirectionSelection(uncheckedSelection, planningSnapshot).issues.some((entry) => entry.code === "ORIGINALITY_CONFIRMATION_REQUIRED"));
const rightsBlockedSelection = clone(completeSelection); rightsBlockedSelection.rightsReview.externalAssetsUsed = true; rightsBlockedSelection.rightsReview.blockingIssueCount = 1;
check("external asset rights blocked", selectionModule.validateCharacterDirectionSelection(rightsBlockedSelection, planningSnapshot).issues.some((entry) => entry.code === "RIGHTS_REVIEW_BLOCKED"));
const likenessBlockedSelection = clone(completeSelection); likenessBlockedSelection.rightsReview.realPersonLikenessUsed = true;
check("real person likeness blocked", selectionModule.validateCharacterDirectionSelection(likenessBlockedSelection, planningSnapshot).issues.some((entry) => entry.code === "RIGHTS_REVIEW_BLOCKED"));
const accessibilityBlockedSelection = clone(completeSelection); accessibilityBlockedSelection.accessibilityReview.evidenceRemainsReadable = false;
check("evidence readability blocked", selectionModule.validateCharacterDirectionSelection(accessibilityBlockedSelection, planningSnapshot).issues.some((entry) => entry.code === "ACCESSIBILITY_REVIEW_BLOCKED"));
const finalNameSelection = clone(completeSelection); finalNameSelection.finalName = "Final Mascot";
check("final name claim blocked", selectionModule.validateCharacterDirectionSelection(finalNameSelection, planningSnapshot).issues.some((entry) => entry.code === "FINAL_BRAND_FIELD_PROHIBITED"));
const characterPrimarySelection = clone(completeSelection); characterPrimarySelection.motionPlans[0].assignments[0].characterRole = "primary";
check("character primary role blocked", selectionModule.validateCharacterDirectionSelection(characterPrimarySelection, planningSnapshot).issues.some((entry) => entry.code === "MOTION_CHARACTER_PRIMARY_ROLE"));
const selectionBeforeOverride = JSON.stringify(completeSelection);
const overriddenSelection = selectionModule.overrideSceneCharacterMotion(completeSelection, completeSelection.motionPlans[0].assignments[0].sceneId, "idle_scan", "high", false);
check("scene motion override exact scene", overriddenSelection.motionPlans.every((plan) => plan.assignments[0].motionTag === "idle_scan" && plan.assignments[0].intensity === "high" && !plan.assignments[0].enabled));
check("scene motion override same semantic all directions", new Set(overriddenSelection.motionPlans.map((plan) => plan.assignments[0].motionTag)).size === 1);
check("scene motion reduced intensity remains low", overriddenSelection.motionPlans.every((plan) => plan.reducedMotionAssignments[0].intensity === "low"));
check("scene motion override marks user override", overriddenSelection.motionPlans.every((plan) => plan.assignments[0].userOverride));
check("scene motion override input mutation zero", JSON.stringify(completeSelection) === selectionBeforeOverride);
const representativeBaseAssignment = completeSelection.motionPlans[0].assignments.find((entry) => entry.sceneId === representativeOne.sceneId);
const representativeOverrideTag = representativeBaseAssignment.motionTag === "idle_scan" ? "signal_detect" : "idle_scan";
const representativeOverride = selectionModule.overrideSceneCharacterMotion(completeSelection, representativeOne.sceneId, representativeOverrideTag, "medium", true);
check("representative override updates comparison tag", representativeOverride.comparisonResult.scene.semanticMotionTag === representativeOverrideTag);
check("representative override clears comparison review", !representativeOverride.comparisonResult.standardMotionReviewed && !representativeOverride.comparisonResult.reducedMotionReviewed);
check("representative override clears reduced review", !representativeOverride.accessibilityReview.reducedMotionCompared && representativeOverride.accessibilityReview.blockingIssueCount === 1);
check("representative override requires re-review", selectionModule.validateCharacterDirectionSelection(representativeOverride, planningSnapshot).issues.some((entry) => entry.code === "COMPARISON_REVIEW_REQUIRED"));
const staleComparisonTag = clone(completeSelection); staleComparisonTag.comparisonResult.scene.semanticMotionTag = staleComparisonTag.comparisonResult.scene.semanticMotionTag === "idle_scan" ? "signal_detect" : "idle_scan";
check("stale comparison motion snapshot blocked", selectionModule.validateCharacterDirectionSelection(staleComparisonTag, planningSnapshot).issues.some((entry) => entry.code === "COMPARISON_MOTION_SNAPSHOT_MISMATCH"));

const initialSession = selectionModule.createInitialCharacterMotionSession(planningSnapshot);
check("session starts with approved planning", initialSession.approvedPlanning === planningSnapshot);
check("session starts representative scene", initialSession.representativeScene !== null);
check("session starts unapproved", initialSession.approvedSnapshot === null);
check("session starts paused 1x", initialSession.playbackState === "paused" && initialSession.previewSpeed === 1);
check("session starts standard motion", initialSession.reducedMotion === false);
const completedSession = selectionModule.reduceCharacterMotionSession(initialSession, { type:"selection_changed", selection:completeSelection });
check("session accepts selection clone", completedSession.selection !== completeSelection && completedSession.validation.valid);
const approvedSession = selectionModule.reduceCharacterMotionSession(completedSession, { type:"provisional_approval_requested" });
check("session provisional approval", approvedSession.approvedSnapshot?.provisionalApprovalState === "provisionally_approved");
check("session selection approval state", approvedSession.selection.approvalState === "provisionally_approved");
const playSession = selectionModule.reduceCharacterMotionSession(approvedSession, { type:"playback_changed", playbackState:"playing" });
check("playback does not invalidate", playSession.playbackState === "playing" && playSession.approvedSnapshot !== null);
const speedSession = selectionModule.reduceCharacterMotionSession(approvedSession, { type:"preview_speed_changed", previewSpeed:1.25 });
check("preview speed updates", speedSession.previewSpeed === 1.25 && speedSession.approvedSnapshot !== null);
const reducedInvalidated = selectionModule.reduceCharacterMotionSession(approvedSession, { type:"reduced_motion_changed", reducedMotion:true });
check("reduced-motion change invalidates approval", reducedInvalidated.reducedMotion && reducedInvalidated.approvedSnapshot === null && reducedInvalidated.selection.approvalState === "invalidated");
const selectedPin = selectionModule.selectProvisionalCharacterDirection(completeSelection, "pin_field_finch");
const selectionInvalidated = selectionModule.reduceCharacterMotionSession(approvedSession, { type:"selection_changed", selection:selectedPin });
check("selected direction change invalidates approval", selectionInvalidated.approvedSnapshot === null && selectionInvalidated.selection.approvalState === "invalidated");
const cancelledSession = selectionModule.reduceCharacterMotionSession(approvedSession, { type:"approval_cancelled" });
check("approval cancel invalidates", cancelledSession.approvedSnapshot === null && cancelledSession.selection.approvalState === "invalidated");
const resetSession = selectionModule.reduceCharacterMotionSession(approvedSession, { type:"reset" });
check("session reset clears approval and choice", resetSession.approvedSnapshot === null && resetSession.selection.selectedDirectionId === null);
const changedPlanning = { ...planningSnapshot, approvedScriptNormalizedHash:"e".repeat(64) };
const upstreamInvalidated = selectionModule.reduceCharacterMotionSession(approvedSession, { type:"approved_planning_changed", snapshot:changedPlanning });
check("upstream planning change resets state", upstreamInvalidated.approvedSnapshot === null && upstreamInvalidated.selection.selectedDirectionId === null);
const nullPlanningSession = selectionModule.reduceCharacterMotionSession(approvedSession, { type:"approved_planning_changed", snapshot:null });
check("missing upstream locks session", nullPlanningSession.approvedPlanning === null && nullPlanningSession.selection === null);
check("session reducer input mutation zero", approvedSession.approvedSnapshot !== null && completedSession.approvedSnapshot === null);

const orchestrationSource = readRepo("components/editorial-v2/EditorialV2Workbench.tsx");
const planningUiSource = readRepo("components/editorial-v2/ScenePlanningWorkbench.tsx");
const characterUiSource = readRepo("components/editorial-v2/CharacterMotionWorkbench.tsx");
const previewSource = readRepo("components/editorial-v2/CharacterSvgPreview.tsx");
const characterCssSource = readRepo("components/editorial-v2/CharacterMotionWorkbench.module.css");
check("planning callback prop exists", planningUiSource.includes("onApprovedScenePlanningChange"));
check("planning callback approved snapshot", planningUiSource.includes("approvedScriptNormalizedHash") && planningUiSource.includes("evidenceIdentity") && planningUiSource.includes("selectedAngleId"));
check("planning callback approval gate", planningUiSource.includes('session.planningApproval !== "approved"') && planningUiSource.includes("canApproveScenePlanning(session)"));
check("planning callback invalidation null", planningUiSource.includes("onApprovedScenePlanningChange(null)"));
check("planning snapshot clones scene refs", planningUiSource.includes("claimRefs: [...scene.provenance.claimRefs]") && planningUiSource.includes("sourceRefs: [...scene.sourceRefs]"));
check("planning snapshot clones visual plan", planningUiSource.includes("cloneVisualPlan(session.visualPlan)"));
check("planning snapshot clones validation", planningUiSource.includes("session.sceneValidation.issues.map") && planningUiSource.includes("session.visualProof.issues.map"));
check("orchestrator connects character workbench", orchestrationSource.includes("<CharacterMotionWorkbench"));
check("orchestrator stores approved planning", orchestrationSource.includes("approvedPlanningSnapshot"));
check("orchestrator trend change clears planning", /handleApprovedTrendBriefChange[\s\S]*?setApprovedPlanningSnapshot\(null\)/u.test(orchestrationSource));
check("orchestrator script change clears planning", /handleApprovedScriptChange[\s\S]*?setApprovedPlanningSnapshot\(null\)/u.test(orchestrationSource));
check("orchestrator planning callback wired", orchestrationSource.includes("onApprovedScenePlanningChange={setApprovedPlanningSnapshot}"));
check("orchestrator character key provenance", ["approvedScriptNormalizedHash","evidenceIdentity","selectedAngleId","sceneRevision"].every((token) => orchestrationSource.includes(token)));
check("orchestrator character lock notice", orchestrationSource.includes("Character Motion Workbench가 잠겨 있습니다"));
check("orchestrator session-only boundary", orchestrationSource.includes("network·persistence·asset export·render는 없습니다"));
check("character UI client component", characterUiSource.startsWith('"use client"'));
for (const token of [
  "방향 개요", "동일 장면 비교", "Motion vocabulary", "Scene Motion Mapping",
  "Originality · Rights · Accessibility", "Provisional Direction Approval", "comparison_only",
  "Play", "Pause", "Preview speed", "0.75", "1.25", "Reduced-motion preview",
  "final name/palette 아님", "same scene · same semantic tag", "session-only",
  "Production asset 아님", "Lottie/WebM export 없음", "renderer integration 없음",
  "network/persistence 없음", "Slice 6는 구현되지 않았습니다",
]) check(`character UI contract: ${token}`, characterUiSource.includes(token));
check("character UI six numbered steps", [1,2,3,4,5,6].every((step) => characterUiSource.includes(`<span>${step}</span>`)));
check("character UI three direction cards", characterUiSource.includes("selection.directions.map"));
check("character UI same scene refs", ["narration","keyCaption","evidenceRefs","sourceRefs","numberRefs","primaryVisualStrategy"].every((token) => characterUiSource.includes(token)));
check("character UI motion override", characterUiSource.includes("overrideSceneCharacterMotion"));
check("character UI selection helper", characterUiSource.includes("selectProvisionalCharacterDirection"));
check("character UI checklist helper", characterUiSource.includes("setCharacterOriginalityCheck"));
check("character UI approval gate", characterUiSource.includes("disabled={!canApproveCharacterDirection(session.validation)}"));
check("character UI reset", characterUiSource.includes('dispatch({ type: "reset" })'));
check("character UI no network persistence", !/\bfetch\s*\(|localStorage|indexedDB/u.test(characterUiSource));
check("character UI no dangerous HTML", !/dangerouslySetInnerHTML/u.test(characterUiSource));
check("preview inline SVG", previewSource.includes("<svg") && previewSource.includes("</svg>"));
check("preview React primitives", ["<circle","<rect","<path","<line"].every((token) => previewSource.includes(token)));
check("preview no external image", !/<image\b|<img\b|data:image/iu.test(previewSource));
check("preview no dangerous HTML", !/dangerouslySetInnerHTML/u.test(previewSource));
check("preview aria label", previewSource.includes('aria-label='));
check("preview reduced motion", previewSource.includes("data-reduced-motion"));
check("preview playback state", previewSource.includes("data-playing"));
check("preview loop policy state", previewSource.includes("data-loop-policy"));
check("preview shared viewBox", previewSource.includes('viewBox={rig.viewBox.join'));
check("preview evidence safe area", previewSource.includes("EVIDENCE SAFE AREA") && previewSource.includes("evidenceSafeArea"));
check("preview occupancy guide", previewSource.includes("CHARACTER OCCUPANCY GUIDE") && previewSource.includes("occupancyGuide"));
check("CSS responsive one column", characterCssSource.includes("@media (max-width: 860px)") && characterCssSource.includes("grid-template-columns: 1fr"));
check("CSS focus visible", characterCssSource.includes(":focus-visible"));
check("CSS OS reduced-motion", characterCssSource.includes("@media (prefers-reduced-motion: reduce)"));
check("CSS bounded loop policy", characterCssSource.includes('[data-loop-policy="none"]') && characterCssSource.includes('[data-loop-policy="limited_2"]'));
check("CSS review not color-only", characterCssSource.includes('.checkItem[data-confirmed="true"]') && characterUiSource.includes("checked={check.confirmed}"));
check("CSS safe-area visual", characterCssSource.includes(".evidenceSafeArea") && characterCssSource.includes("stroke-dasharray"));
check("CSS comparison desktop grid", characterCssSource.includes(".previewGrid") && characterCssSource.includes("repeat(3"));

const projectState = readRepo("_ai/PROJECT_STATE.md");
const nextAction = readRepo("_ai/NEXT_ACTION.md");
for (const token of [
  "Slice 4: `FINAL_PASS`", "governance: `ACTIVE`", "Slice 5: `IMPLEMENTATION_COMPLETE_AWAITING_CROSS_REVIEW`",
  "Slice 5 Cross Review: `NOT_STARTED`", "Slice 6: `BLOCKED`", "Character directions: `COMPARISON_ONLY`",
  "selected direction: `PROVISIONAL_SESSION_ONLY`", "SVG rig: `PROTOTYPE_ONLY`", "Lottie/WebM export: `NOT_IMPLEMENTED`",
  "actual asset generation: `NOT_IMPLEMENTED`", "renderer integration: `NOT_IMPLEMENTED`", "runtime UI: `UNVERIFIED`",
  "durable persistence: `NOT_IMPLEMENTED`", "product operational capability: `NOT_CLAIMED`", "Push: `NOT_AUTHORIZED`",
  "automatic continuation: `DISABLED`", "official progress: `NOT_CALCULATED`", "Slice 3 maintenance backlog", "Slice 4 maintenance backlog",
]) check(`PROJECT_STATE contract: ${token}`, projectState.includes(token));
for (const token of [
  "Claude Code Slice 5 read-only Cross Review", "ChatGPT 중간 전달 불필요", "Claude 결과는 Codex에 전달",
  "일반 P1", "P0/BLOCKED/scope expansion", "Slice 6 자동 시작 금지",
  "feat(editorial-v2): checkpoint slice 5 character motion system", "exact 15-file checkpoint",
]) check(`NEXT_ACTION contract: ${token}`, nextAction.includes(token));

let diffCheckPassed = true;
try { git(["diff", "--check"]); } catch { diffCheckPassed = false; }
check("git diff --check passes", diffCheckPassed);
const whitespaceIssues = baseline.slice5NewFileAllowlist.filter((file) => readRepo(file).split(/\r?\n/u).some((line) => /[ \t]+$/u.test(line)));
check("Slice 5 new files trailing whitespace zero", whitespaceIssues.length === 0, whitespaceIssues.join(", "));
check("checker has at least 260 independent checks", pass + fail >= 260, String(pass + fail));

if (fail > 0) {
  console.error(`SHORTS_EDITORIAL_OS_V2_SLICE5_CHECK_FAIL ${pass}/${pass + fail} PASS`);
  process.exit(1);
}
console.log(`SHORTS_EDITORIAL_OS_V2_SLICE5_CHECK_PASS ${pass}/${pass} PASS`);
