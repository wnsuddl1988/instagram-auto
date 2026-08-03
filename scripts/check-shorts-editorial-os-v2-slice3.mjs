import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import vm from "node:vm";

const ROOT = process.cwd();
const BASELINE_PATH = "_ai/SHORTS_EDITORIAL_OS_V2_SLICE_3_BASELINE.json";
const CHECKPOINT_HEAD = "07840765d312fb6a1a897d68d575fc82ad4957c9";
const CHECKPOINT_PARENT = "58736883c200148e90fe4de44d7e25a1c63f70a2";
const CHECKPOINT_MESSAGE = "docs(editorial-v2): establish control tower escalation governance";
const CHECKPOINT_PATHS = [
  "AGENTS.md",
  "_ai/NEXT_ACTION.md",
  "_ai/PROJECT_STATE.md",
  "_ai/SHORTS_EDITORIAL_OS_V2_GOVERNANCE.md",
];
const TYPECHECK_FILES = [
  "next-env.d.ts",
  "lib/editorial-v2/contracts.ts",
  "lib/editorial-v2/evidence-pack.ts",
  "lib/editorial-v2/topic-candidates.ts",
  "lib/editorial-v2/topic-evaluation.ts",
  "lib/editorial-v2/selected-angle.ts",
  "lib/editorial-v2/script-prompt.ts",
  "lib/editorial-v2/script-import.ts",
  "lib/editorial-v2/intelligence-session.ts",
  "components/editorial-v2/ResearchImportWorkbench.tsx",
  "components/editorial-v2/EditorialV2Workbench.tsx",
  "components/editorial-v2/EditorialIntelligenceWorkbench.tsx",
  "app/editorial-v2/page.tsx",
];
const PRODUCT_FILES = [
  "lib/editorial-v2/evidence-pack.ts",
  "lib/editorial-v2/topic-candidates.ts",
  "lib/editorial-v2/topic-evaluation.ts",
  "lib/editorial-v2/selected-angle.ts",
  "lib/editorial-v2/script-prompt.ts",
  "lib/editorial-v2/script-import.ts",
  "lib/editorial-v2/intelligence-session.ts",
  "components/editorial-v2/ResearchImportWorkbench.tsx",
  "components/editorial-v2/EditorialV2Workbench.tsx",
  "components/editorial-v2/EditorialIntelligenceWorkbench.tsx",
  "app/editorial-v2/page.tsx",
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
function sha256Bytes(value) { return createHash("sha256").update(value).digest("hex"); }
function sha256File(relativePath) { return sha256Bytes(readFileSync(resolveRepo(relativePath))); }
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
const allowedStatusPaths = [...baseline.statusPaths.map((entry) => entry.path), ...baseline.slice3ExactAllowlist];
const baselineByPath = new Map(baseline.statusPaths.map((entry) => [entry.path, entry]));

check("baseline manifest version", baseline.manifestVersion === "1.0.0");
check("baseline repository identity", baseline.repository === "Shorts Editorial OS V2");
check("baseline capture HEAD", baseline.git.head === CHECKPOINT_HEAD);
check("baseline capture parent", baseline.git.parent === CHECKPOINT_PARENT);
check("baseline capture upstream", baseline.git.upstream.ahead === 3 && baseline.git.upstream.behind === 0);
check("baseline modified count 21", baseline.git.modifiedCount === 21);
check("baseline untracked count 3", baseline.git.untrackedCount === 3);
check("baseline staged count 0", baseline.git.stagedCount === 0);
check("baseline status count 24", baseline.git.statusPathCount === 24 && baseline.statusPaths.length === 24);
check("baseline reconstructability explicit", baseline.baselineReconstructability === "NOT_RECONSTRUCTABLE");
check("baseline exact allowlist 17", baseline.slice3ExactAllowlist.length === 17);
check("baseline new allowlist 12", baseline.slice3NewFileAllowlist.length === 12);
check("baseline modified allowlist 5", baseline.slice3ModifiedFileAllowlist.length === 5);
check("baseline protection exceptions exact", sameSet(baseline.protectionExceptions, ["_ai/PROJECT_STATE.md", "_ai/NEXT_ACTION.md"]));
check("all Slice 3 new files exist", baseline.slice3NewFileAllowlist.every((file) => existsSync(resolveRepo(file))));
check("all Slice 3 modified files exist", baseline.slice3ModifiedFileAllowlist.every((file) => existsSync(resolveRepo(file))));
check("status has expected 41 paths", status.length === 41, String(status.length));
check("status contains no unexpected path", statusPaths.every((file) => allowedStatusPaths.includes(file)));
check("status includes every allowlisted path", baseline.slice3ExactAllowlist.every((file) => statusPaths.includes(file)));
check("new file statuses are untracked", baseline.slice3NewFileAllowlist.every((file) => status.find((entry) => entry.path === file)?.status === "??"));
check("modified file statuses are unstaged", baseline.slice3ModifiedFileAllowlist.every((file) => status.find((entry) => entry.path === file)?.status === " M"));
check("staged path count zero", status.filter((entry) => entry.status !== "??" && entry.status[0] !== " ").length === 0);
check("current branch", git(["branch", "--show-current"]) === baseline.git.branch);
check("current HEAD unchanged", git(["rev-parse", "HEAD"]) === CHECKPOINT_HEAD);
check("current upstream +3/-0", git(["rev-list", "--left-right", "--count", "HEAD...@{upstream}"]).split(/\s+/u).join(":") === "3:0");

const protectedHashMismatch = baseline.protectedExistingStatusPaths.filter((file) => sha256File(file) !== baselineByPath.get(file)?.sha256);
const protectedStatusMismatch = baseline.protectedExistingStatusPaths.filter((file) => status.find((entry) => entry.path === file)?.status !== baselineByPath.get(file)?.status);
check("protected dirty hashes unchanged", protectedHashMismatch.length === 0, protectedHashMismatch.join(", "));
check("protected dirty status unchanged", protectedStatusMismatch.length === 0, protectedStatusMismatch.join(", "));
for (const entry of baseline.governanceCriticalPaths) check(`governance critical hash: ${entry.path}`, sha256File(entry.path) === entry.sha256);
const modifiableCritical = new Set(["lib/editorial-v2/contracts.ts", "components/editorial-v2/ResearchImportWorkbench.tsx", "app/editorial-v2/page.tsx"]);
for (const entry of baseline.checkpointCriticalPaths.filter((item) => !modifiableCritical.has(item.path))) {
  check(`checkpoint critical hash: ${entry.path}`, sha256File(entry.path) === entry.sha256);
}
check("checkpoint parent identity", git(["rev-parse", "HEAD^"]) === CHECKPOINT_PARENT);
check("checkpoint message identity", git(["log", "-1", "--format=%s"]) === CHECKPOINT_MESSAGE);
const checkpointNameStatus = gitRaw(["diff-tree", "--no-commit-id", "--name-status", "-r", "HEAD"]).trim().split(/\r?\n/u);
const checkpointPaths = checkpointNameStatus.map((line) => line.split("\t").at(-1));
check("governance checkpoint path count 4", checkpointPaths.length === 4);
check("governance checkpoint exact paths", sameSet(checkpointPaths, CHECKPOINT_PATHS));
check("middleware remains absent", ["middleware.ts", "middleware.js", "src/middleware.ts", "src/middleware.js"].every((file) => !existsSync(resolveRepo(file))));

const contractsNumstat = git(["diff", "--numstat", "HEAD", "--", "lib/editorial-v2/contracts.ts"]).split(/\s+/u).map(Number);
check("contracts additive insertions present", contractsNumstat[0] > 0);
check("contracts deletions zero", contractsNumstat[1] === 0, String(contractsNumstat[1]));
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
]) check(`static safety ${label} zero`, !pattern.test(combinedProduct));
check("no Date.now random UUID in pure core", !/Date\.now|Math\.random|randomUUID|crypto\.randomUUID/u.test(PRODUCT_FILES.filter((file) => file.startsWith("lib/")).map(readRepo).join("\n")));

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
const evidence = loadTypescriptModule("lib/editorial-v2/evidence-pack.ts");
const candidatesModule = loadTypescriptModule("lib/editorial-v2/topic-candidates.ts");
const evaluation = loadTypescriptModule("lib/editorial-v2/topic-evaluation.ts");
const angle = loadTypescriptModule("lib/editorial-v2/selected-angle.ts");
const scriptPrompt = loadTypescriptModule("lib/editorial-v2/script-prompt.ts");
const scriptImport = loadTypescriptModule("lib/editorial-v2/script-import.ts");
const intelligence = loadTypescriptModule("lib/editorial-v2/intelligence-session.ts");
const normalizer = loadTypescriptModule("lib/editorial-v2/import-normalizer.ts");
const repair = loadTypescriptModule("lib/editorial-v2/import-repair.ts");

check("artifact kind exactly 12", contracts.EDITORIAL_V2_ARTIFACT_KINDS.length === 12);
check("quality gate exactly 11", contracts.EDITORIAL_V2_QUALITY_GATES.length === 11);
check("detailed beat type exactly 8", contracts.DETAILED_SCRIPT_BEAT_TYPES.length === 8);
const contractsSource = readRepo("lib/editorial-v2/contracts.ts");
const sceneBlock = /export interface SceneCard \{([\s\S]*?)\n\}/u.exec(contractsSource)?.[1] ?? "";
const sceneFields = ["sceneId","order","purpose","narration","keyCaption","evidenceRefs","numberOrComparison","visualizationType","characterMotion","cameraOrScreenMotion","transition","soundEffect","retentionBeat","sourceRefs","enabled"];
check("Scene Card keeps 15 fields", sceneFields.every((field) => new RegExp(`readonly\\s+${field}\\s*:`).test(sceneBlock)));
check("Scene Card fields remain required", sceneFields.every((field) => !new RegExp(`${field}\\s*\\?`).test(sceneBlock)));
check("contracts add no any", !/\bany\b/u.test(contractsSource));
for (const typeName of [
  "ApprovedTrendBriefSessionSnapshot", "EvidenceVerificationLevel", "EvidenceSourceRecord", "EvidenceClaimRecord",
  "EvidenceNumberRecord", "EvidenceCoverageSummary", "EvidencePackDraft", "EvidenceReviewState", "TopicAngleType",
  "TopicCandidate", "TopicEvaluationMetricName", "TopicEvaluationMetric", "TopicEvaluationResult", "SelectedAngleDraft",
  "SelectedAngleValidationIssue", "SelectedAngleApprovalState", "DetailedScriptBeatType", "DetailedScriptBeat",
  "DetailedScriptPackage", "DetailedScriptValidationIssue", "DetailedScriptValidationSummary", "DetailedScriptApprovalState",
  "EditorialIntelligenceSessionState",
]) check(`contract exists: ${typeName}`, new RegExp(`export (?:interface|type) ${typeName}\\b`, "u").test(contractsSource));
check("new contract fields readonly", !/\n\s+(?!readonly|export|\}|\||\/\/)[A-Za-z][A-Za-z0-9]*\??\s*:/u.test(contractsSource.slice(contractsSource.indexOf("export interface ApprovedTrendBriefSessionSnapshot"))));
check("structural-only literal", contractsSource.includes('"structural_only"'));
check("heuristic score meaning literal", contractsSource.includes('"heuristic_pre_score_not_quality_gate"'));

const promptInput = { projectId:"session-p", researchCutoffDate:"2026-08-04", researchWindow:"7d", domain:"생활경제", audience:"직장인", targetDurationSeconds:30, additionalFocus:"월급 영향" };
const trendCandidate = {
  schemaVersion:"2.0.0-alpha.1", researchCutoffDate:"2026-08-04", researchWindow:"7d", domain:"생활경제",
  audience:"직장인", targetDurationSeconds:30, briefTitle:"생활 물가 변화", executiveSummary:"검증용 요약",
  sources:[
    {sourceId:"src-1",publisher:"통계기관",title:"물가 자료",url:"https://example.com/a",publishedAt:"2026-08-04T01:00:00Z",eventDate:"2026-08-04"},
    {sourceId:"src-2",publisher:"정책기관",title:"금리 자료",url:"https://example.com/b",publishedAt:"2026-08-03T01:00:00Z",eventDate:"2026-08-03"},
  ],
  signals:[
    {signalId:"sig-1",headline:"생활 물가 신호",claim:"물가 지표가 변했다",whyNow:"최근 자료가 공개됐다",audienceImpact:"직장인의 생활비 판단에 연결된다",sourceRefs:["src-1"],numbers:[{value:3,unit:"%",currency:null,asOf:"2026-08-04",context:"전년 대비"}]},
    {signalId:"sig-2",headline:"금리 신호",claim:"금리 환경이 유지됐다",whyNow:"정책 자료가 발표됐다",audienceImpact:"대출 비용 확인에 연결된다",sourceRefs:["src-2"],numbers:[]},
  ],
};
const snapshot = { candidate:trendCandidate, rawHash:"a".repeat(64), normalizedHash:"b".repeat(64), expectedInput:promptInput, validationSummary:{valid:true,issues:[],validatedAt:"2026-08-04T00:00:00.000Z",blockingIssueCount:0,warningCount:0}, approvalState:"approved" };
const snapshotBefore = JSON.stringify(snapshot);
const packOne = evidence.buildEvidencePackDraft(snapshot);
const packTwo = evidence.buildEvidencePackDraft(snapshot);
check("Evidence deterministic deep equal", JSON.stringify(packOne) === JSON.stringify(packTwo));
check("Evidence input mutation zero", JSON.stringify(snapshot) === snapshotBefore);
check("Evidence pack references isolated", packOne.sources !== trendCandidate.sources && packOne.claims !== trendCandidate.signals);
check("Evidence nested refs isolated", packOne.claims[0].sourceRefs !== trendCandidate.signals[0].sourceRefs);
check("Evidence verification structural-only", packOne.verificationLevel === "structural_only");
check("Evidence raw hash provenance", packOne.provenance.rawHash === snapshot.rawHash);
check("Evidence normalized hash provenance", packOne.provenance.normalizedHash === snapshot.normalizedHash);
check("Evidence source count", packOne.sources.length === 2 && packOne.coverage.sourceCount === 2);
check("Evidence claim count", packOne.claims.length === 2 && packOne.coverage.signalCount === 2);
check("Evidence number count", packOne.numbers.length === 1 && packOne.coverage.numberCount === 1);
check("Evidence stable source order", packOne.sources[0].sourceId === "src-1" && packOne.sources[1].originalIndex === 1);
check("Evidence stable claim IDs", packOne.claims[0].claimId === "claim:sig-1" && packOne.claims[1].claimId === "claim:sig-2");
check("Evidence stable number IDs", packOne.numbers[0].numberId === "number:sig-1:1");
check("Evidence fresh source classification", packOne.sources.every((source) => source.freshness === "fresh"));
check("Evidence source fields preserved", packOne.sources[0].publisher === trendCandidate.sources[0].publisher && packOne.sources[0].url === trendCandidate.sources[0].url);
check("Evidence claim text preserved", packOne.claims[0].claim === trendCandidate.signals[0].claim);
check("Evidence number value preserved", packOne.numbers[0].value === 3 && packOne.numbers[0].unit === "%");
check("Evidence valid review has no blocks", evidence.validateEvidencePackDraft(packOne, snapshot.normalizedHash).blockingIssues.length === 0);
check("Evidence hash mismatch blocking", evidence.validateEvidencePackDraft(packOne, "c".repeat(64)).blockingIssues.includes("normalized_hash_mismatch"));
const duplicateSourcePack = clone(packOne); duplicateSourcePack.sources[1].sourceId = "src-1";
check("Evidence duplicate source blocked", evidence.validateEvidencePackDraft(duplicateSourcePack).blockingIssues.some((entry) => entry.startsWith("duplicate_source_id")));
const duplicateClaimPack = clone(packOne); duplicateClaimPack.claims[1].claimId = duplicateClaimPack.claims[0].claimId;
check("Evidence duplicate claim blocked", evidence.validateEvidencePackDraft(duplicateClaimPack).blockingIssues.some((entry) => entry.startsWith("duplicate_claim_id")));
const duplicateNumberPack = clone(packOne); duplicateNumberPack.numbers.push(clone(packOne.numbers[0]));
check("Evidence duplicate number blocked", evidence.validateEvidencePackDraft(duplicateNumberPack).blockingIssues.some((entry) => entry.startsWith("duplicate_number_id")));
const danglingSourcePack = clone(packOne); danglingSourcePack.claims[0].sourceRefs = ["src-404"];
check("Evidence dangling claim source blocked", evidence.validateEvidencePackDraft(danglingSourcePack).blockingIssues.some((entry) => entry.startsWith("dangling_claim_source_ref")));
const danglingNumberPack = clone(packOne); danglingNumberPack.claims[0].numberRefs = ["number-404"];
check("Evidence dangling claim number blocked", evidence.validateEvidencePackDraft(danglingNumberPack).blockingIssues.some((entry) => entry.startsWith("dangling_claim_number_ref")));
const numberNoSourcePack = clone(packOne); numberNoSourcePack.numbers[0].sourceRefs = [];
check("Evidence number provenance required", evidence.validateEvidencePackDraft(numberNoSourcePack).blockingIssues.some((entry) => entry.startsWith("number_without_provenance")));
const stalePack = clone(packOne); stalePack.sources.forEach((source) => { source.freshness = "stale"; });
check("Evidence no-fresh claim blocked", evidence.validateEvidencePackDraft(stalePack).blockingIssues.some((entry) => entry.startsWith("claim_without_fresh_source")));

const topicCandidates = candidatesModule.generateTopicCandidates(packOne);
const topicCandidatesAgain = candidatesModule.generateTopicCandidates(packOne);
check("Topic candidates deterministic", JSON.stringify(topicCandidates) === JSON.stringify(topicCandidatesAgain));
check("Topic candidates max 12", topicCandidates.length <= 12);
check("Topic candidates expected count", topicCandidates.length === 5);
check("Topic stable ordinal", topicCandidates.every((candidate, index) => candidate.ordinal === index + 1));
check("Topic fixed angle order", topicCandidates.slice(0, 3).map((candidate) => candidate.angleType).join(":") === "number_first:why_now:life_impact");
check("Topic number-first only with number", topicCandidates.filter((candidate) => candidate.angleType === "number_first").every((candidate) => candidate.numberRefs.length > 0));
check("Topic no number-first for sig-2", !topicCandidates.some((candidate) => candidate.sourceSignalId === "sig-2" && candidate.angleType === "number_first"));
check("Topic one-signal claim provenance", topicCandidates.every((candidate) => candidate.claimRefs.every((reference) => packOne.claims.find((claim) => claim.claimId === reference)?.signalId === candidate.sourceSignalId)));
check("Topic one-signal number provenance", topicCandidates.every((candidate) => candidate.numberRefs.every((reference) => packOne.numbers.find((number) => number.numberId === reference)?.signalId === candidate.sourceSignalId)));
check("Topic no unsupported source refs", topicCandidates.every((candidate) => candidate.sourceRefs.every((reference) => packOne.sources.some((source) => source.sourceId === reference))));
check("Topic no buy sell advice", topicCandidates.every((candidate) => !/매수|매도|수익 보장/u.test(`${candidate.workingTitle} ${candidate.hookPromise}`)));
check("Topic candidate IDs stable", topicCandidates[0].candidateId === "topic:sig-1:number_first");
check("Topic number literal preserved", topicCandidates[0].workingTitle.includes("3%"));
check("Topic source order stable", topicCandidates.at(-1).sourceSignalId === "sig-2");
const manyPack = clone(packOne); manyPack.claims = Array.from({length:6}, (_, index) => ({...clone(packOne.claims[0]),claimId:`claim:x${index}`,signalId:`x${index}`,numberRefs:[]})); manyPack.numbers=[];
check("Topic candidate hard cap under many signals", candidatesModule.generateTopicCandidates(manyPack).length === 12);

const ranked = evaluation.rankTopicCandidates(topicCandidates, packOne);
check("Evaluation weight total 100", evaluation.topicEvaluationWeightsTotal() === 100);
check("Evaluation result count", ranked.length === topicCandidates.length);
check("Evaluation deterministic", JSON.stringify(ranked) === JSON.stringify(evaluation.rankTopicCandidates(topicCandidates, packOne)));
check("Evaluation ranks contiguous", ranked.every((result, index) => result.rank === index + 1));
check("Evaluation score bounded", ranked.every((result) => result.totalScore >= 0 && result.totalScore <= 100));
check("Evaluation eight metrics", ranked.every((result) => result.scoreBreakdown.length === 8));
check("Evaluation metric scores bounded", ranked.flatMap((result) => result.scoreBreakdown).every((metric) => metric.score >= 0 && metric.score <= 100));
check("Evaluation weights visible", ranked[0].scoreBreakdown.reduce((sum, metric) => sum + metric.weight, 0) === 100);
check("Evaluation reasons present", ranked.flatMap((result) => result.scoreBreakdown).every((metric) => metric.reasons.length > 0));
check("Evaluation heuristic-not-gate marker", ranked.every((result) => result.scoreMeaning === "heuristic_pre_score_not_quality_gate"));
check("Evaluation tie-break deterministic", ranked.every((result) => result.tieBreakKey.length > 0));
const noSourceCandidate = {...topicCandidates[0],sourceRefs:[]};
check("Evaluation source zero blocking", evaluation.evaluateTopicCandidate(noSourceCandidate, packOne).blockingIssues.includes("source_ref_zero"));
const noClaimCandidate = {...topicCandidates[0],claimRefs:[]};
check("Evaluation claim zero blocking", evaluation.evaluateTopicCandidate(noClaimCandidate, packOne).blockingIssues.includes("claim_ref_zero"));
const unsafeCandidate = {...topicCandidates[0],hookPromise:"무조건 매수하면 수익 보장"};
check("Evaluation financial unsafe blocking", evaluation.evaluateTopicCandidate(unsafeCandidate, packOne).blockingIssues.includes("unsafe_financial_language"));
const unsupportedCandidate = {...topicCandidates[0],sourceRefs:["src-404"]};
check("Evaluation unsupported ref blocking", evaluation.evaluateTopicCandidate(unsupportedCandidate, packOne).blockingIssues.includes("unsupported_reference"));
check("Evaluation blocking candidate not first", evaluation.rankTopicCandidates([unsafeCandidate,topicCandidates[0]],packOne)[0].candidateId === topicCandidates[0].candidateId);

const selected = angle.createSelectedAngleDraft(topicCandidates[0]);
const selectedBefore = JSON.stringify(selected);
const selectedSummary = angle.validateSelectedAngleDraft(selected, packOne);
check("Selected draft deterministic ID", selected.selectedAngleId === `selected-angle:${topicCandidates[0].candidateId}`);
check("Selected draft refs copied", selected.sourceRefs !== topicCandidates[0].sourceRefs && selected.claimRefs !== topicCandidates[0].claimRefs);
check("Selected valid draft", selectedSummary.valid && selectedSummary.blockingIssueCount === 0);
check("Selected can approve clean", angle.canApproveSelectedAngle(selectedSummary));
check("Selected validation input mutation zero", JSON.stringify(selected) === selectedBefore);
check("Selected unknown candidate blocked", angle.validateSelectedAngleDraft({...selected,candidateId:"topic:missing:why_now"},packOne).issues.some((entry) => entry.code === "unknown_candidate"));
check("Selected unknown source blocked", angle.validateSelectedAngleDraft({...selected,sourceRefs:["src-404"]},packOne).issues.some((entry) => entry.code === "unknown_source_ref"));
check("Selected unknown claim blocked", angle.validateSelectedAngleDraft({...selected,claimRefs:["claim-404"]},packOne).issues.some((entry) => entry.code === "unknown_claim_ref"));
check("Selected unknown number blocked", angle.validateSelectedAngleDraft({...selected,numberRefs:["number-404"]},packOne).issues.some((entry) => entry.code === "unknown_number_ref"));
check("Selected empty title blocked", angle.validateSelectedAngleDraft({...selected,workingTitle:""},packOne).issues.some((entry) => entry.code === "required_text_missing"));
check("Selected new number blocked", angle.validateSelectedAngleDraft({...selected,hookPromise:`${selected.hookPromise} 999`},packOne).issues.some((entry) => entry.code === "unsupported_numeric_or_date_literal"));
check("Selected allowed number accepted", !angle.validateSelectedAngleDraft({...selected,hookPromise:"3 변화의 의미"},packOne).issues.some((entry) => entry.code === "unsupported_numeric_or_date_literal"));
check("Selected new date blocked", angle.validateSelectedAngleDraft({...selected,hookPromise:"2025-01-01 확인"},packOne).issues.some((entry) => entry.code === "unsupported_numeric_or_date_literal"));
check("Selected allowed date accepted", !angle.validateSelectedAngleDraft({...selected,hookPromise:"2026-08-04 변화 확인"},packOne).issues.some((entry) => entry.code === "unsupported_numeric_or_date_literal"));
check("Selected new URL blocked", angle.validateSelectedAngleDraft({...selected,hookPromise:"https://other.example 확인"},packOne).issues.some((entry) => entry.code === "new_url_not_allowed"));
check("Selected unsafe financial blocked", angle.validateSelectedAngleDraft({...selected,hookPromise:"확실한 수익 보장"},packOne).issues.some((entry) => entry.code === "unsafe_financial_language"));
check("Selected blocking prevents approval", !angle.canApproveSelectedAngle(angle.validateSelectedAngleDraft({...selected,workingTitle:""},packOne)));

const detailedPromptOne = scriptPrompt.buildDetailedScriptPrompt({projectId:"p",selectedAngle:selected,selectedAngleValidation:selectedSummary,evidencePack:packOne,audience:"직장인",durationSeconds:30});
const detailedPromptTwo = scriptPrompt.buildDetailedScriptPrompt({projectId:"p",selectedAngle:selected,selectedAngleValidation:selectedSummary,evidencePack:packOne,audience:"직장인",durationSeconds:30});
check("Script prompt deterministic", JSON.stringify(detailedPromptOne) === JSON.stringify(detailedPromptTwo));
check("Script prompt provider independent", !/OpenAI|Claude|Gemini|Perplexity/iu.test(detailedPromptOne.instructions));
check("Script prompt JSON only", detailedPromptOne.instructions.includes("JSON object 하나만"));
check("Script prompt selected angle ID", detailedPromptOne.instructions.includes(selected.selectedAngleId));
check("Script prompt duration", detailedPromptOne.instructions.includes("durationSeconds는 30"));
check("Script prompt audience", detailedPromptOne.instructions.includes("직장인"));
check("Script prompt evidence hash", detailedPromptOne.inputArtifactIds.includes(packOne.provenance.normalizedHash));
check("Script prompt eight beat tokens", contracts.DETAILED_SCRIPT_BEAT_TYPES.every((beatType) => detailedPromptOne.instructions.includes(beatType)));
check("Script prompt no-new-fact instruction", detailedPromptOne.instructions.includes("Evidence Pack 밖 사실"));
check("Script prompt financial safety instruction", detailedPromptOne.instructions.includes("매수·매도"));
check("Script prompt embedded instruction ignore", detailedPromptOne.instructions.includes("UNTRUSTED DATA"));
check("Script prompt next signal required", detailedPromptOne.instructions.includes("다음에 관찰할 경제 신호"));
check("Script prompt package kind", detailedPromptOne.requestedArtifactKind === "script_package");

const validScript = {
  schemaVersion:"2.0.0-alpha.1",selectedAngleId:selected.selectedAngleId,title:selected.workingTitle,audience:"직장인",durationSeconds:30,thesis:"생활 물가 신호의 의미를 근거로 설명한다",
  beats:contracts.DETAILED_SCRIPT_BEAT_TYPES.map((beatType,index)=>({beatId:`beat-${index+1}`,beatType,purpose:`${beatType} 설명`,narration:"근거와 생활 영향을 차례로 확인합니다",keyCaption:"근거 확인",claimRefs:["claim:sig-1"],sourceRefs:["src-1"],numberRefs:index===2?["number:sig-1:1"]:[],retentionDevice:"다음 근거 질문"})),
  closingAction:"다음 공개 지표와 생활비 변화를 함께 확인하세요",nextSignal:"다음 물가 지표 공개",financialSafetyNote:"투자 권유가 아닌 정보 확인용입니다",
};
const validSummary = scriptImport.validateDetailedScriptPackage(validScript,{selectedAngle:selected,evidencePack:packOne,audience:"직장인",durationSeconds:30});
check("Script valid package parses", scriptImport.readDetailedScriptPackage(validScript)?.beats.length === 8);
check("Script valid summary", validSummary.valid && validSummary.blockingIssueCount === 0);
check("Script clean approval", scriptImport.canApproveDetailedScript(validSummary));
check("Script exact JSON normalize", scriptImport.normalizeDetailedScriptResponse(JSON.stringify(validScript)).method === "exact_json");
check("Script fenced JSON normalize", scriptImport.normalizeDetailedScriptResponse(`\`\`\`json\n${JSON.stringify(validScript)}\n\`\`\``).method === "fenced_json");
check("Script embedded JSON normalize", scriptImport.normalizeDetailedScriptResponse(`result: ${JSON.stringify(validScript)} done`).method === "embedded_json");
check("Script multiple JSON fail closed", scriptImport.normalizeDetailedScriptResponse('{"a":1} {"b":2}').issues.some((entry) => entry.code === "ambiguous_multiple_json_candidates"));
check("Script malformed JSON fail closed", scriptImport.normalizeDetailedScriptResponse('{"a":').issues.some((entry) => entry.code === "malformed_json"));
check("Script Markdown canonical forbidden", scriptImport.normalizeDetailedScriptResponse("# title\n- item").issues.some((entry) => entry.code === "canonical_reformat_required"));
check("Script raw preservation", scriptImport.normalizeDetailedScriptResponse("  {\"a\":1}  ").rawText === "  {\"a\":1}  ");
const wrongSchema = clone(validScript); wrongSchema.schemaVersion="wrong";
check("Script schema mismatch", scriptImport.validateDetailedScriptPackage(wrongSchema,{selectedAngle:selected,evidencePack:packOne,audience:"직장인",durationSeconds:30}).issues.some((entry) => entry.code === "schema_version_mismatch"));
const wrongAngle = clone(validScript); wrongAngle.selectedAngleId="other";
check("Script selected angle mismatch", scriptImport.validateDetailedScriptPackage(wrongAngle,{selectedAngle:selected,evidencePack:packOne,audience:"직장인",durationSeconds:30}).issues.some((entry) => entry.code === "selected_angle_mismatch"));
const wrongAudience = clone(validScript); wrongAudience.audience="다른 시청자";
check("Script audience mismatch", scriptImport.validateDetailedScriptPackage(wrongAudience,{selectedAngle:selected,evidencePack:packOne,audience:"직장인",durationSeconds:30}).issues.some((entry) => entry.code === "audience_mismatch"));
const wrongDuration = clone(validScript); wrongDuration.durationSeconds=45;
check("Script duration mismatch", scriptImport.validateDetailedScriptPackage(wrongDuration,{selectedAngle:selected,evidencePack:packOne,audience:"직장인",durationSeconds:30}).issues.some((entry) => entry.code === "duration_mismatch"));
const sevenBeats = clone(validScript); sevenBeats.beats.pop();
check("Script beat count mismatch", scriptImport.validateDetailedScriptPackage(sevenBeats,{selectedAngle:selected,evidencePack:packOne,audience:"직장인",durationSeconds:30}).issues.some((entry) => entry.code === "beat_count_mismatch"));
const wrongOrder = clone(validScript); [wrongOrder.beats[0].beatType,wrongOrder.beats[1].beatType]=[wrongOrder.beats[1].beatType,wrongOrder.beats[0].beatType];
check("Script beat order mismatch", scriptImport.validateDetailedScriptPackage(wrongOrder,{selectedAngle:selected,evidencePack:packOne,audience:"직장인",durationSeconds:30}).issues.some((entry) => entry.code === "beat_order_mismatch"));
const duplicateBeat = clone(validScript); duplicateBeat.beats[1].beatId=duplicateBeat.beats[0].beatId;
check("Script duplicate beat ID", scriptImport.validateDetailedScriptPackage(duplicateBeat,{selectedAngle:selected,evidencePack:packOne,audience:"직장인",durationSeconds:30}).issues.some((entry) => entry.code === "duplicate_beat_id"));
for (const [label,field,badValue] of [["claim","claimRefs",["claim-404"]],["source","sourceRefs",["src-404"]],["number","numberRefs",["number-404"]]]) {
  const bad = clone(validScript); bad.beats[0][field]=badValue;
  check(`Script unknown ${label} ref`, scriptImport.validateDetailedScriptPackage(bad,{selectedAngle:selected,evidencePack:packOne,audience:"직장인",durationSeconds:30}).issues.some((entry) => entry.code === "unsupported_reference"));
}
const noBeatSource = clone(validScript); noBeatSource.beats[0].sourceRefs=[];
check("Script beat source required", scriptImport.validateDetailedScriptPackage(noBeatSource,{selectedAngle:selected,evidencePack:packOne,audience:"직장인",durationSeconds:30}).issues.some((entry) => entry.code === "beat_source_ref_required"));
for (const field of ["purpose","narration","keyCaption","retentionDevice"]) {
  const empty = clone(validScript); empty.beats[0][field]="";
  check(`Script empty ${field} blocked`, scriptImport.validateDetailedScriptPackage(empty,{selectedAngle:selected,evidencePack:packOne,audience:"직장인",durationSeconds:30}).issues.some((entry) => entry.code === "required_beat_text_missing"));
}
const inventedNumber = clone(validScript); inventedNumber.beats[0].narration="999 변화";
check("Script unsupported number blocked", scriptImport.validateDetailedScriptPackage(inventedNumber,{selectedAngle:selected,evidencePack:packOne,audience:"직장인",durationSeconds:30}).issues.some((entry) => entry.code === "unsupported_numeric_or_date_literal"));
const inventedDate = clone(validScript); inventedDate.beats[0].narration="2025-01-01 변화";
check("Script unsupported date blocked", scriptImport.validateDetailedScriptPackage(inventedDate,{selectedAngle:selected,evidencePack:packOne,audience:"직장인",durationSeconds:30}).issues.some((entry) => entry.code === "unsupported_numeric_or_date_literal"));
const inventedUrl = clone(validScript); inventedUrl.beats[0].narration="https://other.example 확인";
check("Script unsupported URL blocked", scriptImport.validateDetailedScriptPackage(inventedUrl,{selectedAngle:selected,evidencePack:packOne,audience:"직장인",durationSeconds:30}).issues.some((entry) => entry.code === "unsupported_url"));
const unsafeScript = clone(validScript); unsafeScript.beats[0].narration="무조건 매수하면 수익 보장";
check("Script unsafe financial wording blocked", scriptImport.validateDetailedScriptPackage(unsafeScript,{selectedAngle:selected,evidencePack:packOne,audience:"직장인",durationSeconds:30}).issues.some((entry) => entry.code === "unsafe_financial_language"));
const genericScript = clone(validScript); genericScript.beats.forEach((beat) => {beat.narration="짧은 말";});
check("Script generic-only blocked", scriptImport.validateDetailedScriptPackage(genericScript,{selectedAngle:selected,evidencePack:packOne,audience:"직장인",durationSeconds:30}).issues.some((entry) => entry.code === "generic_only_script"));
const noNextSignal = clone(validScript); noNextSignal.nextSignal="";
check("Script next signal required", scriptImport.validateDetailedScriptPackage(noNextSignal,{selectedAngle:selected,evidencePack:packOne,audience:"직장인",durationSeconds:30}).issues.some((entry) => entry.code === "next_signal_required"));
check("Script blocking prevents approval", !scriptImport.canApproveDetailedScript(scriptImport.validateDetailedScriptPackage(noNextSignal,{selectedAngle:selected,evidencePack:packOne,audience:"직장인",durationSeconds:30})));
check("Script approval invalidates", scriptImport.invalidateDetailedScriptApproval("approved") === "invalidated");

const repairableScript = clone(validScript); repairableScript.beats[0].narration="";
const repairableSummary = scriptImport.validateDetailedScriptPackage(repairableScript,{selectedAngle:selected,evidencePack:packOne,audience:"직장인",durationSeconds:30});
const repairPaths = scriptImport.getDetailedScriptRepairAllowedPaths(repairableSummary);
check("Script repair path derived from issue", repairPaths.includes("/beats/0/narration"));
check("Script repair root excluded", !repairPaths.includes("/"));
const scriptRepairPrompt = scriptImport.buildDetailedScriptRepairPrompt({projectId:"p",rawText:JSON.stringify(repairableScript),summary:repairableSummary,allowedPaths:repairPaths,researchCutoffDate:"2026-08-04"});
check("Script repair prompt exact path", scriptRepairPrompt.instructions.includes("/beats/0/narration"));
check("Script repair prompt untrusted delimiter", scriptRepairPrompt.instructions.includes("UNTRUSTED_RAW_RESPONSE_START"));
const parsedRepair = repair.parseFieldRepairPackage('{"repairs":[{"path":"/beats/0/narration","value":"근거를 확인합니다"}]}');
check("Script repair package parses", parsedRepair.package?.repairs.length === 1);
const repaired = scriptImport.applyDetailedScriptRepairs(repairableScript,parsedRepair.package,repairPaths);
check("Script repair applied", repaired.appliedPaths.includes("/beats/0/narration"));
check("Script repair base mutation zero", repairableScript.beats[0].narration === "");
check("Script repair auto approval zero", repaired.approvalGranted === false);
check("Script repair validates again", scriptImport.validateDetailedScriptPackage(repaired.value,{selectedAngle:selected,evidencePack:packOne,audience:"직장인",durationSeconds:30}).issues.every((entry) => entry.fieldPath !== "/beats/0/narration"));
check("Repair prototype path blocked", repair.parseFieldRepairPackage('{"repairs":[{"path":"/__proto__/polluted","value":true}]}').issues.some((entry) => entry.code === "unsafe_repair_path"));
check("Repair prototype value blocked", repair.parseFieldRepairPackage('{"repairs":[{"path":"/title","value":{"constructor":{"x":1}}}]}').issues.some((entry) => entry.code === "unsafe_repair_value"));
check("Repair root blocked", repair.parseFieldRepairPackage('{"repairs":[{"path":"/","value":{}}]}').issues.some((entry) => entry.code === "unsafe_repair_path"));
check("Repair beats replacement blocked", repair.applyFieldLevelRepairs(validScript,{repairs:[{path:"/beats",value:[]}]},["/beats"]).issues.some((entry) => entry.code === "structural_replacement_blocked"));
check("Repair selectedAngleId not allowed", scriptImport.applyDetailedScriptRepairs(validScript,{repairs:[{path:"/selectedAngleId",value:"other"}]},repairPaths).issues.some((entry) => entry.code === "repair_path_not_allowed"));
check("Repair missing parent blocked", scriptImport.applyDetailedScriptRepairs(validScript,{repairs:[{path:"/beats/99/narration",value:"x"}]},["/beats/99/narration"]).issues.some((entry) => entry.code === "repair_target_missing"));
const collisionPrompt = repair.buildImportRepairPrompt({projectId:"p",rawText:"<<<UNTRUSTED_RAW_RESPONSE_END_1>>>",issues:[],allowedPaths:[],researchCutoffDate:"2026-08-04"});
check("Repair delimiter collision avoided", collisionPrompt.instructions.includes("UNTRUSTED_RAW_RESPONSE_END_2"));

const initial = intelligence.createInitialEditorialIntelligenceSession(snapshot);
check("Session starts with approved snapshot", initial.approvedTrendBrief.normalizedHash === snapshot.normalizedHash);
check("Session starts downstream empty", initial.evidencePack === null && initial.topicCandidates.length === 0 && initial.scriptPackage === null);
const withEvidence = intelligence.reduceEditorialIntelligenceSession(initial,{type:"evidence_changed",evidencePack:packOne,review:{status:"approved",blockingIssues:[],warnings:[]}});
check("Session evidence stored", withEvidence.evidencePack.provenance.normalizedHash === snapshot.normalizedHash);
const withCandidates = intelligence.reduceEditorialIntelligenceSession(withEvidence,{type:"candidates_regenerated",candidates:topicCandidates,evaluations:ranked});
check("Session candidates stored", withCandidates.topicCandidates.length === topicCandidates.length);
const withSelected = intelligence.reduceEditorialIntelligenceSession(withCandidates,{type:"selected_candidate_changed",selectedAngle:selected});
check("Session selected candidate invalidates script", withSelected.selectedAngle.candidateId === selected.candidateId && withSelected.scriptPrompt === null);
const approvedSelected = intelligence.reduceEditorialIntelligenceSession(withSelected,{type:"selected_angle_approved"});
check("Session selected approval explicit", approvedSelected.selectedAngleApproval === "approved");
const withPrompt = intelligence.reduceEditorialIntelligenceSession(approvedSelected,{type:"script_prompt_generated",prompt:detailedPromptOne});
check("Session script prompt stored", withPrompt.scriptPrompt.packageId === detailedPromptOne.packageId);
const rawChanged = intelligence.reduceEditorialIntelligenceSession({...withPrompt,scriptApproval:"approved",scriptPackage:validScript,scriptValidation:validSummary},{type:"script_raw_changed",rawText:"new"});
check("Session raw change clears preview", rawChanged.scriptPackage === null && rawChanged.scriptValidation === null);
check("Session raw change invalidates approval", rawChanged.scriptApproval === "invalidated");
const repairTextChanged = intelligence.reduceEditorialIntelligenceSession({...withPrompt,scriptApproval:"approved"},{type:"script_repair_response_changed",repairText:"repair"});
check("Session repair text invalidates approval", repairTextChanged.scriptApproval === "invalidated");
const repairApplied = intelligence.reduceEditorialIntelligenceSession(withPrompt,{type:"script_repair_applied",scriptPackage:validScript,validation:validSummary});
check("Session repair apply invalidates approval", repairApplied.scriptApproval === "invalidated");
const evidenceChangedAgain = intelligence.reduceEditorialIntelligenceSession({...withCandidates,selectedAngle:selected,scriptPackage:validScript},{type:"evidence_review_changed",review:{status:"invalidated",blockingIssues:[],warnings:[]}});
check("Session evidence change clears topic", evidenceChangedAgain.topicCandidates.length === 0 && evidenceChangedAgain.selectedAngle === null && evidenceChangedAgain.scriptPackage === null);
const candidateRegenerated = intelligence.reduceEditorialIntelligenceSession({...withSelected,scriptPackage:validScript},{type:"candidates_regenerated",candidates:topicCandidates,evaluations:ranked});
check("Session regeneration clears selection", candidateRegenerated.selectedAngle === null && candidateRegenerated.scriptPackage === null);
const textChanged = intelligence.reduceEditorialIntelligenceSession({...approvedSelected,scriptPackage:validScript},{type:"selected_angle_text_changed",selectedAngle:{...selected,workingTitle:"편집"}});
check("Session selected text clears script", textChanged.scriptPackage === null && textChanged.selectedAngleApproval === "invalidated");
const upstreamChanged = intelligence.reduceEditorialIntelligenceSession({...withCandidates,selectedAngle:selected,scriptPackage:validScript},{type:"approved_trend_brief_changed",snapshot:{...snapshot,normalizedHash:"c".repeat(64)}});
check("Session upstream change clears all downstream", upstreamChanged.evidencePack === null && upstreamChanged.topicCandidates.length === 0 && upstreamChanged.selectedAngle === null && upstreamChanged.scriptPackage === null);
const resetState = intelligence.reduceEditorialIntelligenceSession(withCandidates,{type:"reset"});
check("Session reset clears Slice 3 state", resetState.approvedTrendBrief === null && resetState.evidencePack === null && resetState.topicCandidates.length === 0);
check("Session reducer input mutation zero", withCandidates.selectedAngle === null);

const pageSource = readRepo("app/editorial-v2/page.tsx");
const researchSource = readRepo("components/editorial-v2/ResearchImportWorkbench.tsx");
const orchestrationSource = readRepo("components/editorial-v2/EditorialV2Workbench.tsx");
const uiSource = readRepo("components/editorial-v2/EditorialIntelligenceWorkbench.tsx");
const cssSource = readRepo("components/editorial-v2/EditorialIntelligenceWorkbench.module.css");
check("page remains server component", !/["']use client["']/u.test(pageSource));
check("page retains feature flag", pageSource.includes("isEditorialV2Enabled()"));
check("page retains route-local notFound", pageSource.includes("notFound()"));
check("page has no redirect", !/\bredirect\s*\(/u.test(pageSource));
check("page renders EditorialV2Workbench", pageSource.includes("<EditorialV2Workbench />"));
check("orchestrator is client component", orchestrationSource.startsWith('"use client"'));
check("orchestrator connects research", orchestrationSource.includes("<ResearchImportWorkbench"));
check("orchestrator connects intelligence", orchestrationSource.includes("<EditorialIntelligenceWorkbench"));
check("orchestrator invalidates by snapshot key", orchestrationSource.includes("normalizedHash") && orchestrationSource.includes("key={intelligenceKey}"));
check("research callback prop exists", researchSource.includes("onApprovedImportChange"));
check("research raw invalidation callback", /function updateRawText[\s\S]*?invalidatePreview/u.test(researchSource));
check("research approval snapshot clone", researchSource.includes("cloneTrendBriefCandidate"));
check("research blocking gate callback", researchSource.includes("canApproveImport(summary)"));
check("research 24h UTC calendar-day explanation", researchSource.includes("UTC calendar-day"));
for (const token of ["Evidence Pack","structural-only","URL 존재","Topic Candidates","heuristic pre-score","Selected Angle","Script Prompt Export","프롬프트 복사","Script Import","Raw hash","Normalized hash","Script Repair and Approval","Field-level 적용·재검증","세션 승인, 저장되지 않음","Scene Card와 Visual Planning은 아직 생성되지 않았습니다","Slice 3 session reset"])
  check(`UI contract: ${token}`, uiSource.includes(token));
check("UI has six numbered steps", ["<span>1</span>","<span>2</span>","<span>3</span>","<span>4</span>","<span>5</span>","<span>6</span>"].every((token) => uiSource.includes(token)));
check("UI errors not color-only", uiSource.includes("차단 ·") && uiSource.includes("경고 ·"));
check("UI label elements present", (uiSource.match(/<label/g) ?? []).length >= 5);
check("UI no persistence network", !/localStorage|indexedDB|\bfetch\s*\(/u.test(`${uiSource}\n${orchestrationSource}`));
check("UI no dangerous HTML", !/dangerouslySetInnerHTML/u.test(uiSource));
check("CSS responsive one column", cssSource.includes("@media") && cssSource.includes("grid-template-columns: 1fr"));
check("CSS table overflow", cssSource.includes("overflow-x: auto"));
check("CSS candidate cards", cssSource.includes(".cards") && cssSource.includes(".card"));
check("CSS score details compatible", uiSource.includes("<details>"));
check("CSS raw normalized two column", cssSource.includes(".compare") && cssSource.includes("grid-template-columns: 1fr 1fr"));
check("CSS focus-visible", cssSource.includes(":focus-visible"));

const projectState = readRepo("_ai/PROJECT_STATE.md");
const nextAction = readRepo("_ai/NEXT_ACTION.md");
for (const token of ["governance: `ACTIVE`","Slice 3: `IMPLEMENTATION_COMPLETE_AWAITING_CROSS_REVIEW`","Slice 3 Cross Review: `NOT_STARTED`","Slice 4: `BLOCKED`","Evidence Pack: `STRUCTURAL_ONLY`","detailed script package: `SESSION_ONLY`","runtime UI: `UNVERIFIED`","durable persistence: `NOT_IMPLEMENTED`","product operational capability: `NOT_CLAIMED`","Push: `NOT_AUTHORIZED`","official progress: `NOT_CALCULATED`"]) check(`PROJECT_STATE contract: ${token}`, projectState.includes(token));
for (const token of ["Claude Code Slice 3 read-only Cross Review","ChatGPT 중간 전달 불필요","Claude 결과는 Codex에 전달","P1","P0/BLOCKED/scope expansion","Slice 4 자동 시작 금지"]) check(`NEXT_ACTION contract: ${token}`, nextAction.includes(token));

let diffCheckPassed = true;
try { git(["diff", "--check"]); } catch { diffCheckPassed = false; }
check("git diff --check passes", diffCheckPassed);
const whitespaceIssues = baseline.slice3NewFileAllowlist.filter((file) => readRepo(file).split(/\r?\n/u).some((line) => /[ \t]+$/u.test(line)));
check("Slice 3 new files trailing whitespace zero", whitespaceIssues.length === 0, whitespaceIssues.join(", "));
check("checker has at least 180 independent checks", pass + fail >= 180, String(pass + fail));

if (fail > 0) {
  console.error(`SHORTS_EDITORIAL_OS_V2_SLICE3_CHECK_FAIL ${pass}/${pass + fail} PASS`);
  process.exit(1);
}
console.log(`SHORTS_EDITORIAL_OS_V2_SLICE3_CHECK_PASS ${pass}/${pass} PASS`);
