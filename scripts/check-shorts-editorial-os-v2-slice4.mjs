import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import vm from "node:vm";

const ROOT = process.cwd();
const BASELINE_PATH = "_ai/SHORTS_EDITORIAL_OS_V2_SLICE_4_BASELINE.json";
const CHECKPOINT_HEAD = "3edc034022e179492c38272f30049c5950fe54c3";
const CHECKPOINT_PARENT = "07840765d312fb6a1a897d68d575fc82ad4957c9";
const CHECKPOINT_MESSAGE = "feat(editorial-v2): checkpoint slice 3 intelligence workflow";
const CHECKPOINT_PATHS = [
  "_ai/NEXT_ACTION.md",
  "_ai/PROJECT_STATE.md",
  "_ai/SHORTS_EDITORIAL_OS_V2_SLICE_3_BASELINE.json",
  "app/editorial-v2/page.tsx",
  "components/editorial-v2/EditorialIntelligenceWorkbench.module.css",
  "components/editorial-v2/EditorialIntelligenceWorkbench.tsx",
  "components/editorial-v2/EditorialV2Workbench.tsx",
  "components/editorial-v2/ResearchImportWorkbench.tsx",
  "lib/editorial-v2/contracts.ts",
  "lib/editorial-v2/evidence-pack.ts",
  "lib/editorial-v2/intelligence-session.ts",
  "lib/editorial-v2/script-import.ts",
  "lib/editorial-v2/script-prompt.ts",
  "lib/editorial-v2/selected-angle.ts",
  "lib/editorial-v2/topic-candidates.ts",
  "lib/editorial-v2/topic-evaluation.ts",
  "scripts/check-shorts-editorial-os-v2-slice3.mjs",
];
const TYPECHECK_FILES = [
  "next-env.d.ts",
  "lib/editorial-v2/contracts.ts",
  "lib/editorial-v2/scene-cards.ts",
  "lib/editorial-v2/scene-card-validation.ts",
  "lib/editorial-v2/visual-planning.ts",
  "lib/editorial-v2/scene-overrides.ts",
  "lib/editorial-v2/planning-session.ts",
  "components/editorial-v2/EditorialV2Workbench.tsx",
  "components/editorial-v2/EditorialIntelligenceWorkbench.tsx",
  "components/editorial-v2/ScenePlanningWorkbench.tsx",
];
const PRODUCT_FILES = [
  "lib/editorial-v2/scene-cards.ts",
  "lib/editorial-v2/scene-card-validation.ts",
  "lib/editorial-v2/visual-planning.ts",
  "lib/editorial-v2/scene-overrides.ts",
  "lib/editorial-v2/planning-session.ts",
  "components/editorial-v2/EditorialV2Workbench.tsx",
  "components/editorial-v2/EditorialIntelligenceWorkbench.tsx",
  "components/editorial-v2/ScenePlanningWorkbench.tsx",
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
const allowedStatusPaths = [...baseline.statusPaths.map((entry) => entry.path), ...baseline.slice4ExactAllowlist];
const baselineByPath = new Map(baseline.statusPaths.map((entry) => [entry.path, entry]));

check("baseline manifest version", baseline.manifestVersion === "1.0.0");
check("baseline repository identity", baseline.repository === "Shorts Editorial OS V2");
check("baseline capture HEAD", baseline.git.head === CHECKPOINT_HEAD);
check("baseline capture parent", baseline.git.parent === CHECKPOINT_PARENT);
check("baseline capture upstream", baseline.git.upstream.ahead === 4 && baseline.git.upstream.behind === 0);
check("baseline modified count 21", baseline.git.modifiedCount === 21);
check("baseline untracked count 3", baseline.git.untrackedCount === 3);
check("baseline staged count 0", baseline.git.stagedCount === 0);
check("baseline status count 24", baseline.git.statusPathCount === 24 && baseline.statusPaths.length === 24);
check("baseline reconstructability explicit", baseline.baselineReconstructability === "NOT_RECONSTRUCTABLE");
check("baseline exact allowlist 14", baseline.slice4ExactAllowlist.length === 14);
check("baseline new allowlist 9", baseline.slice4NewFileAllowlist.length === 9);
check("baseline modified allowlist 5", baseline.slice4ModifiedFileAllowlist.length === 5);
check("baseline allowlist unique", new Set(baseline.slice4ExactAllowlist).size === 14);
check("baseline new and modified partition", sameSet([...baseline.slice4NewFileAllowlist, ...baseline.slice4ModifiedFileAllowlist], baseline.slice4ExactAllowlist));
check("baseline protection exceptions exact", sameSet(baseline.protectionExceptions, ["_ai/PROJECT_STATE.md", "_ai/NEXT_ACTION.md"]));
check("all Slice 4 new files exist", baseline.slice4NewFileAllowlist.every((file) => existsSync(resolveRepo(file))));
check("all Slice 4 modified files exist", baseline.slice4ModifiedFileAllowlist.every((file) => existsSync(resolveRepo(file))));
check("status has expected 38 paths", status.length === 38, String(status.length));
check("status contains no unexpected path", statusPaths.every((file) => allowedStatusPaths.includes(file)));
check("status includes every allowlisted path", baseline.slice4ExactAllowlist.every((file) => statusPaths.includes(file)));
check("new file statuses are untracked", baseline.slice4NewFileAllowlist.every((file) => status.find((entry) => entry.path === file)?.status === "??"));
check("modified file statuses are unstaged", baseline.slice4ModifiedFileAllowlist.every((file) => status.find((entry) => entry.path === file)?.status === " M"));
check("staged path count zero", status.filter((entry) => entry.status !== "??" && entry.status[0] !== " ").length === 0);
check("current branch", git(["branch", "--show-current"]) === baseline.git.branch);
check("current HEAD unchanged", git(["rev-parse", "HEAD"]) === CHECKPOINT_HEAD);
check("current upstream +4/-0", git(["rev-list", "--left-right", "--count", "HEAD...@{upstream}"]).split(/\s+/u).join(":") === "4:0");

const protectedHashMismatch = baseline.protectedExistingStatusPaths.filter((file) => sha256File(file) !== baselineByPath.get(file)?.sha256);
const protectedStatusMismatch = baseline.protectedExistingStatusPaths.filter((file) => status.find((entry) => entry.path === file)?.status !== baselineByPath.get(file)?.status);
check("protected dirty hashes unchanged", protectedHashMismatch.length === 0, protectedHashMismatch.join(", "));
check("protected dirty status unchanged", protectedStatusMismatch.length === 0, protectedStatusMismatch.join(", "));
for (const entry of baseline.governanceCriticalPaths) check(`governance critical hash: ${entry.path}`, sha256File(entry.path) === entry.sha256);
const modifiableCritical = new Set([
  "lib/editorial-v2/contracts.ts",
  "components/editorial-v2/EditorialV2Workbench.tsx",
  "components/editorial-v2/EditorialIntelligenceWorkbench.tsx",
]);
for (const entry of baseline.checkpointCriticalPaths.filter((item) => !modifiableCritical.has(item.path))) {
  check(`checkpoint critical hash: ${entry.path}`, sha256File(entry.path) === entry.sha256);
}
check("checkpoint parent identity", git(["rev-parse", "HEAD^"]) === CHECKPOINT_PARENT);
check("checkpoint message identity", git(["log", "-1", "--format=%s"]) === CHECKPOINT_MESSAGE);
const checkpointNameStatus = gitRaw(["diff-tree", "--no-commit-id", "--name-status", "-r", "HEAD"]).trim().split(/\r?\n/u);
const checkpointPaths = checkpointNameStatus.map((line) => line.split("\t").at(-1));
check("Slice 3 checkpoint path count 17", checkpointPaths.length === 17);
check("Slice 3 checkpoint exact paths", sameSet(checkpointPaths, CHECKPOINT_PATHS));
check("middleware remains absent", ["middleware.ts", "middleware.js", "src/middleware.ts", "src/middleware.js"].every((file) => !existsSync(resolveRepo(file))));

const [contractsAdded, contractsDeleted] = git(["diff", "--numstat", "HEAD", "--", "lib/editorial-v2/contracts.ts"]).split(/\s+/u).slice(0, 2).map(Number);
check("contracts additive insertions present", contractsAdded > 0);
check("contracts deletions zero", contractsDeleted === 0, String(contractsDeleted));
const contractsAtHead = gitRaw(["show", "HEAD:lib/editorial-v2/contracts.ts"]);
const currentContracts = readRepo("lib/editorial-v2/contracts.ts");
const sceneCardPattern = /export interface SceneCard \{[\s\S]*?\n\}/u;
check("existing SceneCard interface unchanged", sceneCardPattern.exec(contractsAtHead)?.[0] === sceneCardPattern.exec(currentContracts)?.[0]);
const nameStatus = gitRaw(["status", "--porcelain=v1", "--untracked-files=all"]);
check("working tree deletion zero", !/^ D|^D /mu.test(nameStatus));
check("working tree rename zero", !/^R/mu.test(nameStatus));
const combinedProduct = PRODUCT_FILES.map(readRepo).join("\n");
for (const [label, pattern] of [
  ["fetch", /\bfetch\s*\(/u], ["XMLHttpRequest", /\bXMLHttpRequest\b/u], ["WebSocket", /\bWebSocket\b/u],
  ["EventSource", /\bEventSource\b/u], ["filesystem import", /from\s+["']node:(?:fs|path)/u],
  ["database adapter", /@supabase|\bprisma\b|database client/iu], ["localStorage", /\blocalStorage\b/u],
  ["IndexedDB", /\bindexedDB\b/u], ["eval", /\beval\s*\(/u], ["Function constructor", /new\s+Function\b/u],
  ["dangerouslySetInnerHTML", /dangerouslySetInnerHTML/u], ["server action", /["']use server["']/u],
  ["scratch root", /c:\\tmp/iu], ["V1 import", /VideoCreationWizard|owner-web-operator|money-shorts|fact-cards/u],
  ["image generation SDK", /image_gen|openai\.images|replicate/iu], ["render adapter", /ffmpeg|remotion|renderMedia/iu],
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
const overrides = loadTypescriptModule("lib/editorial-v2/scene-overrides.ts");
const planning = loadTypescriptModule("lib/editorial-v2/planning-session.ts");

check("artifact kind exactly 12", contracts.EDITORIAL_V2_ARTIFACT_KINDS.length === 12);
check("quality gate exactly 11", contracts.EDITORIAL_V2_QUALITY_GATES.length === 11);
check("detailed beat type exactly 8", contracts.DETAILED_SCRIPT_BEAT_TYPES.length === 8);
const contractsSource = currentContracts;
const sceneBlock = sceneCardPattern.exec(contractsSource)?.[0] ?? "";
const sceneFields = ["sceneId","order","purpose","narration","keyCaption","evidenceRefs","numberOrComparison","visualizationType","characterMotion","cameraOrScreenMotion","transition","soundEffect","retentionBeat","sourceRefs","enabled"];
for (const field of sceneFields) check(`SceneCard field preserved: ${field}`, new RegExp(`readonly\\s+${field}\\s*:`).test(sceneBlock));
check("SceneCard fields remain required", sceneFields.every((field) => !new RegExp(`${field}\\s*\\?`).test(sceneBlock)));
check("contracts add no any", !/\bany\b/u.test(contractsSource));
for (const typeName of [
  "ApprovedDetailedScriptSessionSnapshot", "SceneCardDraft", "SceneCardProvenance", "SceneCardRevision",
  "SceneCardValidationIssue", "SceneCardValidationSummary", "VisualStrategyType", "VisualStrategyClass",
  "AssetAcquisitionMode", "VisualCostClass", "RightsReviewState", "CharacterMotionTag", "ChartPlan",
  "SourceCardPlan", "TimelinePlan", "RelationshipDiagramPlan", "GeneratedImagePlan", "GeneratedVideoPlan",
  "StockVideoPlan", "DirectUploadPlan", "SceneVisualPlan", "VisualProofIssue", "VisualProofSummary",
  "ScenePlanningApprovalState", "ApprovedScenePlanningSessionSnapshot", "ScenePlanningSessionState",
]) check(`contract exists: ${typeName}`, new RegExp(`export (?:interface|type) ${typeName}\\b`, "u").test(contractsSource));
const slice4ContractSource = contractsSource.slice(contractsSource.indexOf("export interface ApprovedDetailedScriptSessionSnapshot"));
check("new interface fields readonly", !/\n\s+(?!readonly|export|\}|\||\/\/)[A-Za-z][A-Za-z0-9]*\??\s*:/u.test(slice4ContractSource));
for (const token of ["STRUCTURAL_PRECHECK_ONLY","deterministic_default","user_override","pending_manual_review","reviewed_for_planning","actualGenerationRequested: false","searchRequested: false","uploadRequested: false"])
  check(`contract boundary token: ${token}`, contractsSource.includes(token));
for (const strategy of ["number_text_motion","chart_comparison","official_source_card","timeline","relationship_diagram","map","character_motion","generated_image","generated_video","stock_video","direct_upload"])
  check(`visual strategy contract: ${strategy}`, contractsSource.includes(`"${strategy}"`));

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
  beatId:`beat-${index + 1}`,
  beatType,
  purpose:"장면 목적",
  narration:index === 0 ? "공식 지표는 3.5%입니다." : index === 2 ? "3.5%와 4%를 비교합니다." : "검증된 주장을 확인합니다.",
  keyCaption:index === 0 ? "3.5% 공식 지표" : index === 2 ? "3.5% vs 4%" : "핵심 근거",
  claimRefs:[`claim-${index + 1}`],
  sourceRefs:index === 1 ? ["src-a","src-b"] : [sources[index % sources.length].sourceId],
  numberRefs:index === 0 ? ["num-1"] : index === 2 ? ["num-1","num-2"] : [],
  retentionDevice:"다음 근거",
}));
const approvedSnapshot = {
  approvedScript:{schemaVersion:"2.0.0-alpha.1",selectedAngleId:"angle-1",title:"생활 지표 변화",audience:"직장인",durationSeconds:30,thesis:"근거 중심 설명",beats,closingAction:"공식 자료를 확인하세요",nextSignal:"다음 발표",financialSafetyNote:"정보 제공 목적"},
  evidencePack, selectedAngle, scriptRawHash:"c".repeat(64), scriptNormalizedHash:"d".repeat(64), evidenceIdentity:"b".repeat(64),
  validation:{valid:true,issues:[],validatedAt:"2026-08-04T00:00:00.000Z",blockingIssueCount:0,warningCount:0},
  approvalState:"approved", audience:"직장인", durationSeconds:30,
};

const snapshotBefore = JSON.stringify(approvedSnapshot);
const sceneOne = sceneCardsModule.buildSceneCardDrafts(approvedSnapshot);
const sceneTwo = sceneCardsModule.buildSceneCardDrafts(approvedSnapshot);
check("Scene Cards exactly 8", sceneOne.length === 8);
check("Scene Cards deterministic deep equal", JSON.stringify(sceneOne) === JSON.stringify(sceneTwo));
check("Scene builder input mutation zero", JSON.stringify(approvedSnapshot) === snapshotBefore);
check("Scene arrays reference isolated", sceneOne !== sceneTwo && sceneOne[0] !== sceneTwo[0]);
check("Scene nested refs isolated", sceneOne[0].provenance.claimRefs !== beats[0].claimRefs && sceneOne[0].sourceRefs !== beats[0].sourceRefs);
for (const [index, scene] of sceneOne.entries()) {
  check(`Scene ${index + 1} stable order`, scene.order === index + 1);
  check(`Scene ${index + 1} stable ID`, scene.sceneId === `angle-1:scene:${String(index + 1).padStart(2,"0")}`);
  check(`Scene ${index + 1} beat ID`, scene.provenance.beatId === beats[index].beatId);
  check(`Scene ${index + 1} beat type`, scene.provenance.beatType === beats[index].beatType);
  check(`Scene ${index + 1} narration preserved`, scene.narration === beats[index].narration);
  check(`Scene ${index + 1} caption preserved`, scene.keyCaption === beats[index].keyCaption);
  check(`Scene ${index + 1} enabled default`, scene.enabled === true);
  check(`Scene ${index + 1} revision default`, scene.provenance.sceneRevision.value === 1 && scene.provenance.sceneRevision.origin === "deterministic_default");
}
check("Scene number label supported", sceneOne[0].numberOrComparison.includes("3.5"));
check("Scene comparison labels supported", sceneOne[2].numberOrComparison.includes("3.5") && sceneOne[2].numberOrComparison.includes("4"));
check("Scene fixed camera vocabulary", sceneOne.every((entry) => typeof entry.cameraOrScreenMotion === "string" && entry.cameraOrScreenMotion.length > 0));
check("Scene fixed transition vocabulary", sceneOne.every((entry) => typeof entry.transition === "string" && entry.transition.length > 0));
check("Scene fixed sound vocabulary", sceneOne.every((entry) => typeof entry.soundEffect === "string" && entry.soundEffect.length > 0));
check("Scene character secondary metadata", sceneOne.every((entry) => typeof entry.characterMotion === "string" && entry.characterMotion.length > 0));
const clonedScenes = sceneCardsModule.cloneSceneCardDrafts(sceneOne);
check("Scene clone deep equal", JSON.stringify(clonedScenes) === JSON.stringify(sceneOne));
check("Scene clone reference isolated", clonedScenes !== sceneOne && clonedScenes[0].provenance !== sceneOne[0].provenance && clonedScenes[0].provenance.claimRefs !== sceneOne[0].provenance.claimRefs);

const cleanSceneSummary = sceneValidationModule.validateSceneCardDrafts(sceneOne, approvedSnapshot);
check("Scene clean validation", cleanSceneSummary.valid && cleanSceneSummary.blockingIssueCount === 0);
check("Scene enabled count 8", cleanSceneSummary.enabledSceneCount === 8);
check("Scene clean approval allowed", sceneValidationModule.canApproveSceneCards(cleanSceneSummary));
const sixScenes = clone(sceneOne).slice(0,6);
check("Scene count below 7 blocked", sceneValidationModule.validateSceneCardDrafts(sixScenes,approvedSnapshot).issues.some((entry)=>entry.code==="scene_count_out_of_range"));
const sixEnabled = clone(sceneOne); sixEnabled[0].enabled=false; sixEnabled[1].enabled=false;
check("Enabled count below 7 blocked", sceneValidationModule.validateSceneCardDrafts(sixEnabled,approvedSnapshot).issues.some((entry)=>entry.code==="enabled_scene_count_out_of_range"));
const duplicateScene = clone(sceneOne); duplicateScene[1].sceneId=duplicateScene[0].sceneId;
check("Duplicate scene ID blocked", sceneValidationModule.validateSceneCardDrafts(duplicateScene,approvedSnapshot).issues.some((entry)=>entry.code==="duplicate_scene_id"));
const duplicateOrder = clone(sceneOne); duplicateOrder[1].order=duplicateOrder[0].order;
check("Duplicate order blocked", sceneValidationModule.validateSceneCardDrafts(duplicateOrder,approvedSnapshot).issues.some((entry)=>entry.code==="duplicate_scene_order"));
const descending = clone(sceneOne); [descending[0],descending[1]]=[descending[1],descending[0]];
check("Scene array order blocked", sceneValidationModule.validateSceneCardDrafts(descending,approvedSnapshot).issues.some((entry)=>entry.code==="scene_order_not_continuous"));
const unknownBeat = clone(sceneOne); unknownBeat[0].provenance.beatId="beat-404";
check("Unknown beat blocked", sceneValidationModule.validateSceneCardDrafts(unknownBeat,approvedSnapshot).issues.some((entry)=>entry.code==="unknown_script_beat"));
const wrongBeatType = clone(sceneOne); wrongBeatType[0].provenance.beatType="next_signal_to_watch";
check("Beat type mismatch blocked", sceneValidationModule.validateSceneCardDrafts(wrongBeatType,approvedSnapshot).issues.some((entry)=>entry.code==="beat_order_or_type_mismatch"));
for (const [field, code] of [["narration","missing_narration"],["keyCaption","missing_key_caption"],["retentionBeat","missing_retention_beat"]]) {
  const bad = clone(sceneOne); bad[0][field]="";
  check(`Scene missing ${field} blocked`, sceneValidationModule.validateSceneCardDrafts(bad,approvedSnapshot).issues.some((entry)=>entry.code===code));
}
const noSource = clone(sceneOne); noSource[0].sourceRefs=[]; noSource[0].provenance.sourceRefs=[];
check("Scene source required", sceneValidationModule.validateSceneCardDrafts(noSource,approvedSnapshot).issues.some((entry)=>entry.code==="source_ref_required"));
const noClaim = clone(sceneOne); noClaim[0].provenance.claimRefs=[]; noClaim[0].evidenceRefs=[...noClaim[0].provenance.numberRefs];
check("Factual claim required", sceneValidationModule.validateSceneCardDrafts(noClaim,approvedSnapshot).issues.some((entry)=>entry.code==="factual_claim_ref_required"));
const noEvidenceNumber = clone(sceneOne); noEvidenceNumber[2].provenance.numberRefs=[]; noEvidenceNumber[2].evidenceRefs=[...noEvidenceNumber[2].provenance.claimRefs];
check("Evidence beat number required", sceneValidationModule.validateSceneCardDrafts(noEvidenceNumber,approvedSnapshot).issues.some((entry)=>entry.code==="evidence_number_ref_required"));
for (const [label, field, code] of [["source","sourceRefs","unsupported_source_ref"],["claim","claimRefs","unsupported_claim_ref"],["number","numberRefs","unsupported_number_ref"]]) {
  const bad = clone(sceneOne); bad[0].provenance[field]=[`${label}-404`];
  check(`Dangling ${label} ref blocked`, sceneValidationModule.validateSceneCardDrafts(bad,approvedSnapshot).issues.some((entry)=>entry.code===code));
}
const sourceMismatch = clone(sceneOne); sourceMismatch[0].sourceRefs=["src-b"];
check("Source provenance mismatch blocked", sceneValidationModule.validateSceneCardDrafts(sourceMismatch,approvedSnapshot).issues.some((entry)=>entry.code==="source_provenance_mismatch"));
const evidenceMismatch = clone(sceneOne); evidenceMismatch[0].evidenceRefs=[];
check("Evidence provenance mismatch blocked", sceneValidationModule.validateSceneCardDrafts(evidenceMismatch,approvedSnapshot).issues.some((entry)=>entry.code==="evidence_provenance_mismatch"));
for (const [field, value, code] of [["selectedAngleId","other","selected_angle_mismatch"],["sourceSignalId","other","source_signal_mismatch"],["scriptPackageIdentity","other","script_identity_mismatch"]]) {
  const bad = clone(sceneOne); bad[0].provenance[field]=value;
  check(`${field} mismatch blocked`, sceneValidationModule.validateSceneCardDrafts(bad,approvedSnapshot).issues.some((entry)=>entry.code===code));
}
const badRevision = clone(sceneOne); badRevision[0].provenance.sceneRevision.value=0;
check("Invalid revision blocked", sceneValidationModule.validateSceneCardDrafts(badRevision,approvedSnapshot).issues.some((entry)=>entry.code==="invalid_scene_revision"));
const urlScene = clone(sceneOne); urlScene[0].narration="https://other.example 확인";
check("New URL blocked", sceneValidationModule.validateSceneCardDrafts(urlScene,approvedSnapshot).issues.some((entry)=>entry.code==="new_url_not_allowed"));
const unsafeScene = clone(sceneOne); unsafeScene[0].narration="무조건 매수하면 수익 보장";
check("Unsafe financial wording blocked", sceneValidationModule.validateSceneCardDrafts(unsafeScene,approvedSnapshot).issues.some((entry)=>entry.code==="unsafe_financial_wording"));
const inventedNumber = clone(sceneOne); inventedNumber[0].narration="999%입니다";
check("Unsupported number blocked", sceneValidationModule.validateSceneCardDrafts(inventedNumber,approvedSnapshot).issues.some((entry)=>entry.code==="unsupported_numeric_literal"));
const equivalentNumber = clone(sceneOne); equivalentNumber[0].narration="3.50%입니다";
check("Equivalent number representation accepted", !sceneValidationModule.validateSceneCardDrafts(equivalentNumber,approvedSnapshot).issues.some((entry)=>entry.code==="unsupported_numeric_literal"));
const inventedDate = clone(sceneOne); inventedDate[0].narration="2025-01-01 자료";
check("Unsupported date blocked", sceneValidationModule.validateSceneCardDrafts(inventedDate,approvedSnapshot).issues.some((entry)=>entry.code==="unsupported_date_literal"));
const supportedDate = clone(sceneOne); supportedDate[0].narration="2026-08-04 자료";
check("Supported date accepted", !sceneValidationModule.validateSceneCardDrafts(supportedDate,approvedSnapshot).issues.some((entry)=>entry.code==="unsupported_date_literal"));
const disabledBadProvenance = clone(sceneOne); disabledBadProvenance[0].enabled=false; disabledBadProvenance[0].provenance.sourceRefs=["src-404"];
check("Disabled scene provenance still checked", sceneValidationModule.validateSceneCardDrafts(disabledBadProvenance,approvedSnapshot).issues.some((entry)=>entry.code==="unsupported_source_ref"));
check("Scene blocking prevents approval", !sceneValidationModule.canApproveSceneCards(sceneValidationModule.validateSceneCardDrafts(inventedNumber,approvedSnapshot)));

const visualOne = visualModule.buildVisualAssetPlan(sceneOne, approvedSnapshot);
const visualTwo = visualModule.buildVisualAssetPlan(sceneOne, approvedSnapshot);
check("Visual plan exactly 8", visualOne.length === 8);
check("Visual deterministic deep equal", JSON.stringify(visualOne) === JSON.stringify(visualTwo));
check("Visual input mutation zero", JSON.stringify(approvedSnapshot) === snapshotBefore);
check("Visual chart for two compatible numbers", visualOne[2].primaryStrategy === "chart_comparison" && visualOne[2].chartPlan.numberRefs.length === 2);
check("Visual number text for one number", visualOne[0].primaryStrategy === "number_text_motion");
check("Visual timeline for two dates", visualOne[1].primaryStrategy === "timeline" && visualOne[1].timelinePlan.entries.length >= 2);
check("Visual source card fallback", visualOne[3].primaryStrategy === "official_source_card");
check("Visual map not automatic", visualOne.every((entry)=>entry.primaryStrategy!=="map"));
check("Visual manual strategies not automatic", visualOne.every((entry)=>!["generated_image","generated_video","stock_video","direct_upload"].includes(entry.primaryStrategy)));
check("Character automatic secondary only", visualOne.every((entry)=>entry.primaryStrategy!=="character_motion" && entry.secondaryStrategies.includes("character_motion")));
check("Visual default acquisition deterministic", visualOne.every((entry)=>entry.acquisitionMode==="deterministic_overlay"));
check("Visual default cost no estimate", visualOne.every((entry)=>entry.costClass==="none_estimate"));
check("Visual default rights not required", visualOne.every((entry)=>entry.rightsReviewState==="not_required"));
check("Visual structural precheck label", visualOne.every((entry)=>entry.visualProofClass==="STRUCTURAL_PRECHECK_ONLY"));
check("Source card download false", visualOne.filter((entry)=>entry.sourceCardPlan).every((entry)=>entry.sourceCardPlan.downloadExpected===false));
check("Relationship causality false contract", visualModule.createSceneVisualPlanForStrategy(sceneOne[3],approvedSnapshot,"relationship_diagram").relationshipDiagramPlan.inventedCausalityAllowed===false);
const cleanVisualSummary = visualModule.validateVisualAssetPlan(visualOne,sceneOne,approvedSnapshot);
check("Visual clean structural validation", cleanVisualSummary.valid && cleanVisualSummary.blockingIssueCount===0);
check("Visual clean warnings explicit", cleanVisualSummary.warningCount>=8);
check("Visual summary structural-only", cleanVisualSummary.verificationLevel==="STRUCTURAL_PRECHECK_ONLY");

const missingPlan = clone(visualOne).slice(0,7);
check("Visual scene ID set mismatch blocked", visualModule.validateVisualAssetPlan(missingPlan,sceneOne,approvedSnapshot).issues.some((entry)=>entry.code==="visual_scene_id_mismatch"));
const unknownPlan = clone(visualOne); unknownPlan[0].sceneId="scene-404";
check("Unknown visual scene blocked", visualModule.validateVisualAssetPlan(unknownPlan,sceneOne,approvedSnapshot).issues.some((entry)=>entry.code==="unknown_visual_scene"));
const missingPrimary = clone(visualOne); missingPrimary[0].primaryStrategy="";
check("Missing primary blocked", visualModule.validateVisualAssetPlan(missingPrimary,sceneOne,approvedSnapshot).issues.some((entry)=>entry.code==="missing_primary_strategy"));
const revisionMismatch = clone(visualOne); revisionMismatch[0].sceneRevision.value=99;
check("Visual revision mismatch blocked", visualModule.validateVisualAssetPlan(revisionMismatch,sceneOne,approvedSnapshot).issues.some((entry)=>entry.code==="scene_revision_mismatch"));
const unknownSourcePlan = clone(visualOne); unknownSourcePlan[0].sourceRefs=["src-404"];
check("Visual unknown source blocked", visualModule.validateVisualAssetPlan(unknownSourcePlan,sceneOne,approvedSnapshot).issues.some((entry)=>entry.code==="unsupported_visual_source_ref"));
const unknownNumberPlan = clone(visualOne); unknownNumberPlan[0].numberRefs=["num-404"];
check("Visual unknown number blocked", visualModule.validateVisualAssetPlan(unknownNumberPlan,sceneOne,approvedSnapshot).issues.some((entry)=>entry.code==="unsupported_visual_number_ref"));
const badChart = clone(visualOne); badChart[2].chartPlan.numberRefs=["num-1"];
check("Incompatible chart blocked", visualModule.validateVisualAssetPlan(badChart,sceneOne,approvedSnapshot).issues.some((entry)=>entry.code==="incompatible_chart_plan"));
const sourceCardMissing = clone(visualOne); sourceCardMissing[3].sourceCardPlan.sourceRefs=[];
check("Source card missing source blocked", visualModule.validateVisualAssetPlan(sourceCardMissing,sceneOne,approvedSnapshot).issues.some((entry)=>entry.code==="source_card_requires_source"));
const badTimeline = clone(visualOne); badTimeline[1].timelinePlan.entries=badTimeline[1].timelinePlan.entries.slice(0,1);
check("Timeline insufficient dates blocked", visualModule.validateVisualAssetPlan(badTimeline,sceneOne,approvedSnapshot).issues.some((entry)=>entry.code==="timeline_requires_two_dates"));
const mapPlan = clone(visualOne); mapPlan[3]=visualModule.createSceneVisualPlanForStrategy(sceneOne[3],approvedSnapshot,"map");
check("Map without location blocked", visualModule.validateVisualAssetPlan(mapPlan,sceneOne,approvedSnapshot).issues.some((entry)=>entry.code==="map_location_evidence_required"));
const characterPlan = clone(visualOne); characterPlan[0]=visualModule.createSceneVisualPlanForStrategy(sceneOne[0],approvedSnapshot,"character_motion");
const characterSummary = visualModule.validateVisualAssetPlan(characterPlan,sceneOne,approvedSnapshot);
check("Character primary blocked", characterSummary.issues.some((entry)=>entry.code==="character_cannot_be_primary_proof"));
check("Character factual evidence-first blocked", characterSummary.issues.some((entry)=>entry.code==="factual_scene_requires_evidence_first_visual"));
for (const strategy of ["generated_image","generated_video","stock_video","direct_upload"]) {
  const manual = visualModule.createSceneVisualPlanForStrategy(sceneOne[0],approvedSnapshot,strategy);
  check(`${strategy} manual owner flag`, manual.requiresOwnerApproval===true);
  check(`${strategy} rights pending`, manual.rightsReviewState==="pending_manual_review");
  check(`${strategy} actual operation false`, strategy==="generated_image" ? manual.generatedImagePlan.actualGenerationRequested===false : strategy==="generated_video" ? manual.generatedVideoPlan.actualGenerationRequested===false : strategy==="stock_video" ? manual.stockVideoPlan.searchRequested===false : manual.directUploadPlan.uploadRequested===false);
  const mixed = clone(visualOne); mixed[0]=manual;
  const summary = visualModule.validateVisualAssetPlan(mixed,sceneOne,approvedSnapshot);
  check(`${strategy} illustrative-only proof blocked`, strategy==="direct_upload" || summary.issues.some((entry)=>entry.code==="illustrative_visual_cannot_be_only_proof"));
  check(`${strategy} owner confirmation blocked`, summary.issues.some((entry)=>entry.code==="paid_possible_owner_approval_missing"));
  check(`${strategy} rights unresolved blocked`, summary.issues.some((entry)=>entry.code==="rights_review_unresolved"));
  check(`${strategy} warning explicit`, summary.issues.some((entry)=>entry.code===`${strategy}_planned_warning` && !entry.blocking));
}
const noOwnerFlag = clone(visualOne); noOwnerFlag[0]=visualModule.createSceneVisualPlanForStrategy(sceneOne[0],approvedSnapshot,"generated_image"); noOwnerFlag[0].requiresOwnerApproval=false;
check("Manual owner flag absence blocked", visualModule.validateVisualAssetPlan(noOwnerFlag,sceneOne,approvedSnapshot).issues.some((entry)=>entry.code==="manual_plan_owner_approval_flag_required"));
check("Visual enabled below 7 blocked", visualModule.validateVisualAssetPlan(visualOne,sixEnabled,approvedSnapshot).issues.some((entry)=>entry.code==="enabled_scene_count_below_minimum"));

const originalScenesJson = JSON.stringify(sceneOne);
const narrated = overrides.editSceneNarration(sceneOne,sceneOne[0].sceneId,"편집된 내레이션");
check("Override narration applied", narrated[0].narration==="편집된 내레이션");
check("Override narration exact scene", narrated.slice(1).every((entry,index)=>entry.narration===sceneOne[index+1].narration));
check("Override revision increments", narrated[0].provenance.sceneRevision.value===2 && narrated[0].provenance.sceneRevision.origin==="user_override");
check("Override base mutation zero", JSON.stringify(sceneOne)===originalScenesJson);
const captioned = overrides.editSceneKeyCaption(sceneOne,sceneOne[0].sceneId,"편집 캡션");
check("Override caption applied", captioned[0].keyCaption==="편집 캡션");
const retained = overrides.editSceneRetentionBeat(sceneOne,sceneOne[0].sceneId,"새 retention");
check("Override retention applied", retained[0].retentionBeat==="새 retention");
const visualized = overrides.editSceneVisualizationType(sceneOne,sceneOne[0].sceneId,"timeline");
check("Override visualization applied", visualized[0].visualizationType==="timeline");
const characterReplaced = overrides.replaceSceneCharacterMotion(sceneOne,sceneOne[0].sceneId,"none");
check("Override character applied", characterReplaced[0].characterMotion==="none");
const cameraReplaced = overrides.replaceSceneCameraMotion(sceneOne,sceneOne[0].sceneId,"timeline_pan");
check("Override camera applied", cameraReplaced[0].cameraOrScreenMotion==="timeline_pan");
const transitionReplaced = overrides.replaceSceneTransition(sceneOne,sceneOne[0].sceneId,"signal_fade");
check("Override transition applied", transitionReplaced[0].transition==="signal_fade");
const soundReplaced = overrides.replaceSceneSoundEffect(sceneOne,sceneOne[0].sceneId,"watch_ping");
check("Override sound applied", soundReplaced[0].soundEffect==="watch_ping");
const toggled = overrides.toggleSceneEnabled(sceneOne,sceneOne[0].sceneId);
check("Override enabled toggle", toggled[0].enabled===false);
check("Override immutable scene ID", narrated[0].sceneId===sceneOne[0].sceneId);
check("Override immutable order", narrated[0].order===sceneOne[0].order);
check("Override immutable refs", JSON.stringify(narrated[0].provenance.claimRefs)===JSON.stringify(sceneOne[0].provenance.claimRefs));
const protoAttempt = overrides.editSceneNarration(sceneOne,"__proto__","polluted");
check("Override prototype scene blocked", JSON.stringify(protoAttempt)===JSON.stringify(sceneOne) && ({}).polluted===undefined);
const primaryOverride = overrides.overridePrimaryStrategy(sceneOne,visualOne,approvedSnapshot,sceneOne[0].sceneId,"generated_image");
check("Primary strategy override exact", primaryOverride.visualPlan[0].primaryStrategy==="generated_image" && primaryOverride.visualPlan.slice(1).every((entry,index)=>entry.primaryStrategy===visualOne[index+1].primaryStrategy));
check("Primary override revision synced", primaryOverride.sceneCards[0].provenance.sceneRevision.value===primaryOverride.visualPlan[0].sceneRevision.value);
check("Primary override manual boundary", primaryOverride.visualPlan[0].requiresOwnerApproval && !primaryOverride.visualPlan[0].ownerApprovalConfirmed);
const secondaryOverride = overrides.overrideSecondaryStrategies(sceneOne,visualOne,approvedSnapshot,sceneOne[0].sceneId,[]);
check("Secondary override applied", secondaryOverride.visualPlan[0].secondaryStrategies.length===0);
const promptOverride = overrides.editGenerationPromptDraft(primaryOverride.sceneCards,primaryOverride.visualPlan,approvedSnapshot,sceneOne[0].sceneId,"수정 prompt");
check("AI prompt override applied", promptOverride.visualPlan[0].generationPromptDraft==="수정 prompt" && promptOverride.visualPlan[0].generatedImagePlan.promptDraft==="수정 prompt");
const acquisitionOverride = overrides.changeAcquisitionMode(sceneOne,visualOne,approvedSnapshot,sceneOne[0].sceneId,"direct_upload_required");
check("Acquisition override applied", acquisitionOverride.visualPlan[0].acquisitionMode==="direct_upload_required");
check("Manual acquisition maps to manual strategy", acquisitionOverride.visualPlan[0].primaryStrategy==="direct_upload");
check("Manual acquisition requires Owner flag", acquisitionOverride.visualPlan[0].requiresOwnerApproval===true && acquisitionOverride.visualPlan[0].rightsReviewState==="pending_manual_review");
const acquisitionSummary = visualModule.validateVisualAssetPlan(acquisitionOverride.visualPlan,acquisitionOverride.sceneCards,approvedSnapshot);
check("Manual acquisition Owner confirmation blocked", acquisitionSummary.issues.some((entry)=>entry.code==="paid_possible_owner_approval_missing"));
check("Manual acquisition rights unresolved blocked", acquisitionSummary.issues.some((entry)=>entry.code==="rights_review_unresolved"));
const manualSecondary = overrides.overrideSecondaryStrategies(sceneOne,visualOne,approvedSnapshot,sceneOne[0].sceneId,["character_motion","generated_image"]);
check("Manual secondary preserves evidence primary", manualSecondary.visualPlan[0].primaryStrategy==="number_text_motion" && manualSecondary.visualPlan[0].secondaryStrategies.includes("generated_image"));
check("Manual secondary requires Owner and rights", manualSecondary.visualPlan[0].requiresOwnerApproval===true && manualSecondary.visualPlan[0].rightsReviewState==="pending_manual_review");
const manualSecondarySummary = visualModule.validateVisualAssetPlan(manualSecondary.visualPlan,manualSecondary.sceneCards,approvedSnapshot);
check("Manual secondary gate cannot hide behind primary", manualSecondarySummary.issues.some((entry)=>entry.code==="paid_possible_owner_approval_missing") && manualSecondarySummary.issues.some((entry)=>entry.code==="rights_review_unresolved"));
const manualSecondaryReviewed = overrides.setVisualRightsReviewState(manualSecondary.sceneCards,manualSecondary.visualPlan,approvedSnapshot,sceneOne[0].sceneId,"reviewed_for_planning");
const manualSecondaryConfirmed = overrides.setVisualOwnerApproval(manualSecondaryReviewed.sceneCards,manualSecondaryReviewed.visualPlan,approvedSnapshot,sceneOne[0].sceneId,true);
check("Manual secondary survives review updates", manualSecondaryConfirmed.visualPlan[0].secondaryStrategies.includes("generated_image") && manualSecondaryConfirmed.visualPlan[0].ownerApprovalConfirmed && manualSecondaryConfirmed.visualPlan[0].rightsReviewState==="reviewed_for_planning");
check("Reviewed manual secondary passes structural gate", visualModule.validateVisualAssetPlan(manualSecondaryConfirmed.visualPlan,manualSecondaryConfirmed.sceneCards,approvedSnapshot).valid);
const directRequired = overrides.setDirectUploadRequired(sceneOne,visualOne,approvedSnapshot,sceneOne[0].sceneId,true);
check("Direct upload is metadata only", directRequired.visualPlan[0].primaryStrategy==="direct_upload" && directRequired.visualPlan[0].directUploadPlan.uploadRequested===false);
const rightsReviewed = overrides.setVisualRightsReviewState(primaryOverride.sceneCards,primaryOverride.visualPlan,approvedSnapshot,sceneOne[0].sceneId,"reviewed_for_planning");
check("Rights state override applied", rightsReviewed.visualPlan[0].rightsReviewState==="reviewed_for_planning");
const ownerConfirmed = overrides.setVisualOwnerApproval(rightsReviewed.sceneCards,rightsReviewed.visualPlan,approvedSnapshot,sceneOne[0].sceneId,true);
check("Owner plan confirmation applied", ownerConfirmed.visualPlan[0].ownerApprovalConfirmed===true);
const resetOne = overrides.resetOneSceneToDeterministicDefault(narrated,visualOne,approvedSnapshot,sceneOne[0].sceneId);
check("One-scene reset restores narration", resetOne.sceneCards[0].narration===sceneOne[0].narration);
check("One-scene reset leaves others", resetOne.sceneCards.slice(1).every((entry,index)=>entry.narration===sceneOne[index+1].narration));
check("One-scene reset invalidating revision", resetOne.sceneCards[0].provenance.sceneRevision.origin==="user_override");
const overrideSource = readRepo("lib/editorial-v2/scene-overrides.ts");
check("Override exposes no provenance edit", !/edit(?:Evidence|Source|Claim|Number)Ref|replaceEntire|rootReplacement/iu.test(overrideSource));
check("Override has prototype denylist", overrideSource.includes("__proto__") && overrideSource.includes("prototype") && overrideSource.includes("constructor"));

const initialSession = planning.createInitialScenePlanningSession(approvedSnapshot);
check("Planning session starts with script", initialSession.approvedScript.scriptNormalizedHash===approvedSnapshot.scriptNormalizedHash);
check("Planning session starts downstream empty", initialSession.sceneCards.length===0 && initialSession.visualPlan.length===0);
check("Planning snapshot reference isolated", initialSession.approvedScript!==approvedSnapshot && initialSession.approvedScript.approvedScript.beats!==approvedSnapshot.approvedScript.beats);
const generatedSession = planning.reduceScenePlanningSession(initialSession,{type:"scene_cards_regenerated",sceneCards:sceneOne,validation:cleanSceneSummary});
check("Planning stores generated scenes", generatedSession.sceneCards.length===8);
check("Planning generated scenes clone", generatedSession.sceneCards!==sceneOne && generatedSession.sceneCards[0]!==sceneOne[0]);
check("Planning generation clears visuals", generatedSession.visualPlan.length===0 && generatedSession.visualProof===null);
const sceneApprovedSession = planning.reduceScenePlanningSession(generatedSession,{type:"scene_cards_approved"});
check("Planning scene approval explicit", sceneApprovedSession.sceneCardApproval==="approved");
const visualSession = planning.reduceScenePlanningSession(sceneApprovedSession,{type:"visual_plan_generated",visualPlan:visualOne,visualProof:cleanVisualSummary});
check("Planning stores visual plan", visualSession.visualPlan.length===8 && visualSession.visualProof.valid);
check("Planning can approve clean", planning.canApproveScenePlanning(visualSession));
const approvedPlanning = planning.reduceScenePlanningSession(visualSession,{type:"planning_approved"});
check("Planning approval explicit", approvedPlanning.planningApproval==="approved");
const cardsChangedSession = planning.reduceScenePlanningSession(approvedPlanning,{type:"scene_cards_changed",sceneCards:narrated,validation:sceneValidationModule.validateSceneCardDrafts(narrated,approvedSnapshot)});
check("Narration change clears visual plan", cardsChangedSession.visualPlan.length===0 && cardsChangedSession.visualProof===null);
check("Narration change invalidates scene approval", cardsChangedSession.sceneCardApproval==="invalidated");
check("Narration change invalidates planning approval", cardsChangedSession.planningApproval==="invalidated");
const visualChangedSession = planning.reduceScenePlanningSession(approvedPlanning,{type:"visual_plan_changed",sceneCards:primaryOverride.sceneCards,sceneValidation:sceneValidationModule.validateSceneCardDrafts(primaryOverride.sceneCards,approvedSnapshot),visualPlan:primaryOverride.visualPlan,visualProof:visualModule.validateVisualAssetPlan(primaryOverride.visualPlan,primaryOverride.sceneCards,approvedSnapshot)});
check("Visual override keeps exact plan", visualChangedSession.visualPlan[0].primaryStrategy==="generated_image");
check("Visual override invalidates scene approval", visualChangedSession.sceneCardApproval==="invalidated");
check("Visual override invalidates planning approval", visualChangedSession.planningApproval==="invalidated");
const cancelledScene = planning.reduceScenePlanningSession(sceneApprovedSession,{type:"scene_cards_approval_cancelled"});
check("Scene approval cancel invalidates", cancelledScene.sceneCardApproval==="invalidated");
const cancelledPlan = planning.reduceScenePlanningSession(approvedPlanning,{type:"planning_approval_cancelled"});
check("Planning approval cancel invalidates", cancelledPlan.planningApproval==="invalidated");
const scriptChangedSession = planning.reduceScenePlanningSession(approvedPlanning,{type:"approved_script_changed",snapshot:{...approvedSnapshot,scriptNormalizedHash:"e".repeat(64)}});
check("Script change clears all planning", scriptChangedSession.sceneCards.length===0 && scriptChangedSession.visualPlan.length===0 && scriptChangedSession.planningApproval==="not_approved");
const resetSession = planning.reduceScenePlanningSession(approvedPlanning,{type:"reset_all"});
check("Reset all clears Slice 4", resetSession.sceneCards.length===0 && resetSession.visualPlan.length===0 && resetSession.approvedScript!==null);
check("Planning reducer input mutation zero", approvedPlanning.planningApproval==="approved" && JSON.stringify(sceneOne)===originalScenesJson);

const orchestrationSource = readRepo("components/editorial-v2/EditorialV2Workbench.tsx");
const intelligenceSource = readRepo("components/editorial-v2/EditorialIntelligenceWorkbench.tsx");
const uiSource = readRepo("components/editorial-v2/ScenePlanningWorkbench.tsx");
const cssSource = readRepo("components/editorial-v2/ScenePlanningWorkbench.module.css");
check("Intelligence callback prop exists", intelligenceSource.includes("onApprovedScriptChange"));
check("Intelligence callback approved snapshot", intelligenceSource.includes("cloneApprovedDetailedScriptSnapshot"));
check("Intelligence raw invalidates callback", /function updateScriptRaw[\s\S]*?invalidateApprovedScript/u.test(intelligenceSource));
check("Intelligence preview invalidates callback", /function previewScriptImport[\s\S]*?invalidateApprovedScript/u.test(intelligenceSource));
check("Intelligence repair invalidates callback", /function applyRepair[\s\S]*?invalidateApprovedScript/u.test(intelligenceSource));
check("Intelligence reset invalidates callback", /function reset\(\)[\s\S]*?invalidateApprovedScript/u.test(intelligenceSource));
check("Intelligence evidence cancel available", intelligenceSource.includes("cancelEvidenceApproval"));
check("Intelligence script approval cancel available", intelligenceSource.includes("cancelDetailedScriptApproval"));
check("Intelligence snapshot includes hashes", intelligenceSource.includes("scriptRawHash") && intelligenceSource.includes("scriptNormalizedHash") && intelligenceSource.includes("evidenceIdentity"));
check("Orchestrator connects research", orchestrationSource.includes("<ResearchImportWorkbench"));
check("Orchestrator connects intelligence", orchestrationSource.includes("<EditorialIntelligenceWorkbench"));
check("Orchestrator connects planning", orchestrationSource.includes("<ScenePlanningWorkbench"));
check("Orchestrator stores approved script", orchestrationSource.includes("approvedScriptSnapshot"));
check("Orchestrator upstream clears script", /handleApprovedTrendBriefChange[\s\S]*?setApprovedScriptSnapshot\(null\)/u.test(orchestrationSource));
check("Orchestrator planning key uses hashes", orchestrationSource.includes("scriptNormalizedHash") && orchestrationSource.includes("evidenceIdentity") && orchestrationSource.includes("key={planningKey}"));
check("Orchestrator locked planning notice", orchestrationSource.includes("Scene Planning이 잠겨 있습니다"));
check("Orchestrator session-only notice", orchestrationSource.includes("Scene Planning session-only"));
check("Planning UI client component", uiSource.startsWith('"use client"'));
for (const token of ["Scene Cards","8개 Scene Card","Visual Plan","Deterministic Visual Asset Plan","Scene-specific controls","Validation and Approval","evidence-first","manual-only","Rights structural review","비용 가능 계획 Owner 확인","AI prompt draft","Direct upload required","deterministic reset","실제 자산 생성·파일 업로드·장면별 재렌더는 아직 지원하지 않습니다","세션 승인, 저장되지 않음","실제 자산·렌더는 생성되지 않음","Slice 5는 구현되지 않았습니다","Slice 4 reset all"])
  check(`Planning UI contract: ${token}`, uiSource.includes(token));
check("Planning UI has four numbered steps", ["<span>1</span>","<span>2</span>","<span>3</span>","<span>4</span>"].every((token)=>uiSource.includes(token)));
check("Planning UI maps eight scene source", uiSource.includes("session.sceneCards.map"));
check("Planning UI provenance read-only", uiSource.includes("읽기 전용 provenance"));
check("Planning UI edit controls", ["editSceneNarration","editSceneKeyCaption","editSceneRetentionBeat","toggleSceneEnabled"].every((token)=>uiSource.includes(token)));
check("Planning UI strategy controls", uiSource.includes("overridePrimaryStrategy") && uiSource.includes("overrideSecondaryStrategies"));
check("Planning UI approval disabled gate", uiSource.includes("disabled={!canApproveScenePlanning(session)}"));
check("Planning UI status not color only", uiSource.includes("차단") && uiSource.includes("경고"));
check("Planning UI label elements", (uiSource.match(/<label/g)??[]).length>=10);
check("Planning UI no network persistence", !/\bfetch\s*\(|localStorage|indexedDB/u.test(uiSource));
check("Planning UI no dangerous HTML", !/dangerouslySetInnerHTML/u.test(uiSource));
check("Planning CSS responsive one column", cssSource.includes("@media") && cssSource.includes("grid-template-columns: 1fr"));
check("Planning CSS focus visible", cssSource.includes(":focus-visible"));
check("Planning CSS errors have text-compatible style", cssSource.includes('[data-kind="error"]') && cssSource.includes('[data-kind="warning"]'));
check("Planning CSS desktop grids", cssSource.includes(".sceneGrid") && cssSource.includes(".planGrid") && cssSource.includes(".summaryGrid"));

const projectState = readRepo("_ai/PROJECT_STATE.md");
const nextAction = readRepo("_ai/NEXT_ACTION.md");
for (const token of ["Slice 3: `FINAL_PASS`","governance: `ACTIVE`","Slice 4: `IMPLEMENTATION_COMPLETE_AWAITING_CROSS_REVIEW`","Slice 4 Cross Review: `NOT_STARTED`","Slice 5: `BLOCKED`","Scene Cards: `SESSION_ONLY`","Visual Plan: `STRUCTURAL_PRECHECK_ONLY`","actual assets: `NOT_CREATED`","Character system: `NOT_IMPLEMENTED`","render: `NOT_IMPLEMENTED`","runtime UI: `UNVERIFIED`","durable persistence: `NOT_IMPLEMENTED`","product operational capability: `NOT_CLAIMED`","Push: `NOT_AUTHORIZED`","automatic continuation: `DISABLED`","official progress: `NOT_CALCULATED`","Slice 3 maintenance backlog"])
  check(`PROJECT_STATE contract: ${token}`, projectState.includes(token));
for (const token of ["Claude Code Slice 4 read-only Cross Review","ChatGPT 중간 전달 불필요","Claude 결과는 Codex에 전달","일반 P1","P0/BLOCKED/scope expansion","Slice 5 자동 시작 금지"])
  check(`NEXT_ACTION contract: ${token}`, nextAction.includes(token));

let diffCheckPassed = true;
try { git(["diff", "--check"]); } catch { diffCheckPassed = false; }
check("git diff --check passes", diffCheckPassed);
const whitespaceIssues = baseline.slice4NewFileAllowlist.filter((file) => readRepo(file).split(/\r?\n/u).some((line) => /[ \t]+$/u.test(line)));
check("Slice 4 new files trailing whitespace zero", whitespaceIssues.length === 0, whitespaceIssues.join(", "));
check("checker has at least 220 independent checks", pass + fail >= 220, String(pass + fail));

if (fail > 0) {
  console.error(`SHORTS_EDITORIAL_OS_V2_SLICE4_CHECK_FAIL ${pass}/${pass + fail} PASS`);
  process.exit(1);
}
console.log(`SHORTS_EDITORIAL_OS_V2_SLICE4_CHECK_PASS ${pass}/${pass} PASS`);
