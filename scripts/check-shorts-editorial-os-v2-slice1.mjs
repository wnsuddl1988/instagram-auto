import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
} from "node:fs";
import path from "node:path";
import vm from "node:vm";

const ROOT = process.cwd();
const BASELINE_PATH = "_ai/SHORTS_EDITORIAL_OS_V2_SLICE_1_BASELINE.json";
const IMPLEMENTATION_FILES = [
  "lib/editorial-v2/schema-version.ts",
  "lib/editorial-v2/contracts.ts",
  "lib/editorial-v2/state-machine.ts",
  "lib/editorial-v2/feature-flag.ts",
  "lib/editorial-v2/storage.ts",
  "lib/editorial-v2/fixtures.ts",
  "app/editorial-v2/page.tsx",
];
const EXPECTED_LIB_FILES = [
  "lib/editorial-v2/contracts.ts",
  "lib/editorial-v2/feature-flag.ts",
  "lib/editorial-v2/fixtures.ts",
  "lib/editorial-v2/schema-version.ts",
  "lib/editorial-v2/state-machine.ts",
  "lib/editorial-v2/storage.ts",
];
const EXPECTED_ROUTE_FILES = ["app/editorial-v2/page.tsx"];

let pass = 0;
let fail = 0;

function check(name, ok, detail = "") {
  if (ok) {
    pass += 1;
    console.log(`PASS  ${name}`);
  } else {
    fail += 1;
    console.error(`FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

function slash(value) {
  return value.replaceAll("\\", "/");
}

function resolveRepo(relativePath) {
  const resolved = path.resolve(ROOT, relativePath);
  const relative = path.relative(ROOT, resolved);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Path escaped repository boundary: ${relativePath}`);
  }
  return resolved;
}

function readRepo(relativePath) {
  return readFileSync(resolveRepo(relativePath), "utf8");
}

function sha256Bytes(value) {
  return createHash("sha256").update(value).digest("hex");
}

function sha256File(relativePath) {
  return sha256Bytes(readFileSync(resolveRepo(relativePath)));
}

function listFiles(relativeDirectory) {
  const root = resolveRepo(relativeDirectory);
  if (!existsSync(root)) return [];
  const files = [];
  const visit = (directory) => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const absolute = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(absolute);
      if (entry.isFile()) files.push(slash(path.relative(ROOT, absolute)));
    }
  };
  visit(root);
  return files.sort();
}

function gitRaw(args) {
  return execFileSync("git", args, {
    cwd: ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function git(args) {
  return gitRaw(args).trim();
}

function parseStatus() {
  const output = gitRaw(["status", "--porcelain=v1", "--untracked-files=all"]).replace(/\r?\n$/u, "");
  if (!output) return [];
  return output.split(/\r?\n/u).map((line) => ({
    status: line.slice(0, 2),
    path: line.slice(3),
  }));
}

function sameStringSet(left, right) {
  return JSON.stringify([...left].sort()) === JSON.stringify([...right].sort());
}

const baseline = JSON.parse(readRepo(BASELINE_PATH));
const status = parseStatus();
const statusPaths = status.map((entry) => entry.path);
const expectedStatusPaths = [
  ...baseline.statusPaths.map((entry) => entry.path),
  ...baseline.slice1NewFileAllowlist,
];

check("baseline manifest version", baseline.manifestVersion === "1.0.0");
check("baseline is explicitly not reconstructable", baseline.baselineReconstructability === "NOT_RECONSTRUCTABLE");
check("baseline captured 27 status paths", baseline.statusPaths.length === 27 && baseline.git.statusPathCount === 27);
check("baseline branch unchanged", git(["branch", "--show-current"]) === baseline.git.branch);
check("baseline HEAD unchanged", git(["rev-parse", "HEAD"]) === baseline.git.head);
check(
  "baseline upstream unchanged",
  git(["rev-list", "--left-right", "--count", "HEAD...@{upstream}"]).split(/\s+/u).join(":") ===
    `${baseline.git.upstream.ahead}:${baseline.git.upstream.behind}`,
);
check("all 11 allowlist files exist", baseline.slice1MutableAllowlist.every((file) => existsSync(resolveRepo(file))));
check("status path set contains baseline plus only Slice 1 new files", sameStringSet(statusPaths, expectedStatusPaths));
check(
  "staged file count remains zero",
  status.filter((entry) => entry.status !== "??" && entry.status[0] !== " ").length === 0,
);
check("lib/editorial-v2 contains only approved files", sameStringSet(listFiles("lib/editorial-v2"), EXPECTED_LIB_FILES));
check("app/editorial-v2 contains only the inert page", sameStringSet(listFiles("app/editorial-v2"), EXPECTED_ROUTE_FILES));

const middlewarePresent = baseline.protectedRepositoryBaseline.middlewareExpectedAbsent.filter((file) =>
  existsSync(resolveRepo(file)),
);
check("middleware files remain absent", middlewarePresent.length === 0, middlewarePresent.join(", "));
check(
  "app/layout.tsx hash unchanged",
  sha256File(baseline.protectedRepositoryBaseline.appLayout.path) ===
    baseline.protectedRepositoryBaseline.appLayout.sha256,
);
check(
  "package.json hash unchanged",
  sha256File(baseline.protectedRepositoryBaseline.packageJson.path) ===
    baseline.protectedRepositoryBaseline.packageJson.sha256,
);

const currentNextConfigs = readdirSync(ROOT)
  .filter((name) => /^next\.config\./u.test(name) && statSync(resolveRepo(name)).isFile())
  .sort();
const baselineNextConfigs = baseline.protectedRepositoryBaseline.nextConfigs.map((entry) => entry.path).sort();
const nextConfigHashesMatch = baseline.protectedRepositoryBaseline.nextConfigs.every(
  (entry) => existsSync(resolveRepo(entry.path)) && sha256File(entry.path) === entry.sha256,
);
check(
  "next.config files and hashes unchanged",
  sameStringSet(currentNextConfigs, baselineNextConfigs) && nextConfigHashesMatch,
);

const existingAppFiles = listFiles("app").filter((file) => !EXPECTED_ROUTE_FILES.includes(file));
const existingAppEntries = existingAppFiles
  .map((file) => `${file}\t${sha256File(file)}`)
  .sort((left, right) => left.localeCompare(right));
const existingAppAggregate = sha256Bytes(existingAppEntries.join("\n"));
check(
  "existing app routes and files unchanged",
  existingAppFiles.length === baseline.protectedRepositoryBaseline.appTree.fileCount &&
    existingAppAggregate === baseline.protectedRepositoryBaseline.appTree.aggregateSha256,
);

const baselineByPath = new Map(baseline.statusPaths.map((entry) => [entry.path, entry]));
const protectedHashMismatches = baseline.protectedExistingStatusPaths.filter((file) => {
  const entry = baselineByPath.get(file);
  return !entry || !existsSync(resolveRepo(file)) || sha256File(file) !== entry.sha256;
});
check(
  "all protected dirty baseline hashes unchanged",
  protectedHashMismatches.length === 0,
  protectedHashMismatches.join(", "),
);
check(
  "only state documents are baseline protection exceptions",
  sameStringSet(baseline.protectionExceptions, ["_ai/PROJECT_STATE.md", "_ai/NEXT_ACTION.md"]),
);

const implementationSources = new Map(
  IMPLEMENTATION_FILES.map((file) => [file, readRepo(file)]),
);
const forbiddenScratchRoot = ["c:", "tmp"].join("\\");
const scratchReferences = [...implementationSources]
  .filter(([, source]) => source.toLowerCase().includes(forbiddenScratchRoot))
  .map(([file]) => file);
check("new implementation contains no legacy scratch-root string", scratchReferences.length === 0, scratchReferences.join(", "));
check(
  "checker access scope is repository-only",
  baseline.constraints.v1DataAccess === "PROHIBITED" &&
    [BASELINE_PATH, ...IMPLEMENTATION_FILES].every((file) => resolveRepo(file).startsWith(ROOT)),
);

const forbiddenImplementationPattern =
  /(?:from\s+["']node:(?:fs|path|net|http|https)|\brequire\s*\(|\bfetch\s*\(|\blocalStorage\b|\bwriteFile(?:Sync)?\b|\bmkdir(?:Sync)?\b|@supabase|\bprisma\b|\bdatabase client\b)/u;
const sideEffectSources = [...implementationSources]
  .filter(([, source]) => forbiddenImplementationPattern.test(source))
  .map(([file]) => file);
check("new implementation has no filesystem, database, network, or write adapter", sideEffectSources.length === 0, sideEffectSources.join(", "));

const allowedImports = new Set([
  "./contracts",
  "./schema-version",
  "../../lib/editorial-v2/feature-flag",
  "next/navigation",
]);
const unexpectedImports = [];
for (const [file, source] of implementationSources) {
  for (const match of source.matchAll(/(?:import|export)\s+(?:type\s+)?(?:[\s\S]*?\s+from\s+)?["']([^"']+)["']/gu)) {
    if (!allowedImports.has(match[1])) unexpectedImports.push(`${file}:${match[1]}`);
  }
}
check("new implementation imports no V1 module", unexpectedImports.length === 0, unexpectedImports.join(", "));

let ts;
try {
  const typescriptModule = await import("typescript");
  ts = typescriptModule.default ?? typescriptModule;
} catch (error) {
  console.error(`UNVERIFIED_TOOLING_LIMITATION — TypeScript module unavailable: ${error.message}`);
  process.exit(2);
}

const configPath = resolveRepo("tsconfig.json");
const configResult = ts.readConfigFile(configPath, ts.sys.readFile);
const parsedConfig = ts.parseJsonConfigFileContent(configResult.config, ts.sys, ROOT, {
  noEmit: true,
  incremental: false,
  tsBuildInfoFile: undefined,
}, configPath);
const program = ts.createProgram({
  rootNames: IMPLEMENTATION_FILES.map(resolveRepo),
  options: parsedConfig.options,
});
const typeDiagnostics = ts.getPreEmitDiagnostics(program);
const diagnosticDetail = typeDiagnostics
  .slice(0, 5)
  .map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, " "))
  .join(" | ");
check("targeted TypeScript diagnostics are empty", typeDiagnostics.length === 0, diagnosticDetail);

const moduleCache = new Map();
function loadTypescriptModule(relativePath) {
  const absolutePath = resolveRepo(relativePath);
  if (moduleCache.has(absolutePath)) return moduleCache.get(absolutePath).exports;

  const transpiled = ts.transpileModule(readFileSync(absolutePath, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
    fileName: absolutePath,
    reportDiagnostics: true,
  });
  const transpileErrors = (transpiled.diagnostics ?? []).filter(
    (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error,
  );
  if (transpileErrors.length > 0) {
    throw new Error(ts.flattenDiagnosticMessageText(transpileErrors[0].messageText, " "));
  }

  const moduleRecord = { exports: {} };
  moduleCache.set(absolutePath, moduleRecord);
  const localRequire = (specifier) => {
    if (!specifier.startsWith(".")) throw new Error(`Unexpected runtime import: ${specifier}`);
    const candidate = path.resolve(path.dirname(absolutePath), specifier);
    const resolved = candidate.endsWith(".ts") ? candidate : `${candidate}.ts`;
    return loadTypescriptModule(slash(path.relative(ROOT, resolved)));
  };
  const wrapper = vm.runInThisContext(
    `(function (exports, require, module) {${transpiled.outputText}\n})`,
    { filename: absolutePath },
  );
  wrapper(moduleRecord.exports, localRequire, moduleRecord);
  return moduleRecord.exports;
}

const schema = loadTypescriptModule("lib/editorial-v2/schema-version.ts");
const contracts = loadTypescriptModule("lib/editorial-v2/contracts.ts");
const stateMachine = loadTypescriptModule("lib/editorial-v2/state-machine.ts");
const featureFlag = loadTypescriptModule("lib/editorial-v2/feature-flag.ts");
const storage = loadTypescriptModule("lib/editorial-v2/storage.ts");
const fixturesModule = loadTypescriptModule("lib/editorial-v2/fixtures.ts");

check(
  "schema and namespace constants are isolated",
  schema.EDITORIAL_V2_NAMESPACE === "shorts-editorial-os-v2" &&
    schema.EDITORIAL_V2_SCHEMA_VERSION === "2.0.0-alpha.1" &&
    schema.EDITORIAL_V2_FEATURE_FLAG_ENV === "SHORTS_EDITORIAL_OS_V2_ENABLED",
);

const expectedArtifactKinds = [
  "trend_brief",
  "evidence_pack",
  "topic_candidates",
  "topic_evaluation",
  "selected_angle",
  "script_package",
  "scene_cards",
  "visual_asset_plan",
  "voice_subtitle_package",
  "preview_render",
  "final_render",
  "publish_package",
];
check(
  "artifact kind tuple contains exactly 12 required kinds",
  JSON.stringify(contracts.EDITORIAL_V2_ARTIFACT_KINDS) === JSON.stringify(expectedArtifactKinds),
);

const expectedQualityGates = [
  "Watch Reason Gate",
  "Freshness Gate",
  "Evidence Gate",
  "Claim-to-Source Gate",
  "Genericity Gate",
  "Visual Proof Gate",
  "Retention Gate",
  "Financial Safety Gate",
  "Rights Gate",
  "Brand Consistency Gate",
  "Publish Readiness Gate",
];
check(
  "quality gate tuple contains exactly 11 required gates",
  JSON.stringify(contracts.EDITORIAL_V2_QUALITY_GATES) === JSON.stringify(expectedQualityGates),
);

const contractsSource = implementationSources.get("lib/editorial-v2/contracts.ts");
const envelopeFields = [
  "namespace",
  "schemaVersion",
  "artifactId",
  "projectId",
  "kind",
  "revision",
  "contentHash",
  "createdAt",
  "updatedAt",
  "upstreamArtifactIds",
  "validation",
  "approval",
];
check(
  "artifact envelope declares every required field",
  envelopeFields.every((field) => new RegExp(`\\b${field}\\s*:`).test(contractsSource)),
);

const sceneCardFields = [
  "sceneId",
  "order",
  "purpose",
  "narration",
  "keyCaption",
  "evidenceRefs",
  "numberOrComparison",
  "visualizationType",
  "characterMotion",
  "cameraOrScreenMotion",
  "transition",
  "soundEffect",
  "retentionBeat",
  "sourceRefs",
  "enabled",
];
check(
  "Scene Card declares every required field",
  sceneCardFields.every((field) => new RegExp(`\\b${field}\\s*:`).test(contractsSource)),
);

const exchangeContracts = [
  "PromptPackage",
  "RawImportedResponse",
  "NormalizedImportedResult",
  "ImportValidationSummary",
  "RepairRequest",
  "FieldLevelRepairResult",
];
check(
  "LLM exchange contracts are declared without parser logic",
  exchangeContracts.every((name) => contractsSource.includes(`interface ${name}`)) &&
    !/JSON\.parse|new URL|repairImported|normalizeImported/u.test(contractsSource),
);
check(
  "raw imported response is marked UNTRUSTED_DATA",
  contracts.RAW_IMPORTED_RESPONSE_TRUST === "UNTRUSTED_DATA" &&
    /trust:\s*typeof RAW_IMPORTED_RESPONSE_TRUST/u.test(contractsSource),
);

check(
  "feature flag defaults OFF and fails unknown values closed",
  featureFlag.isEditorialV2Enabled({}) === false &&
    [undefined, null, "", "   ", "0", "false", "TRUE", "True", "yes", "on", "2"].every(
      (value) => featureFlag.parseEditorialV2Enabled(value) === false,
    ),
);
check(
  "feature flag enables only trimmed exact 1 or true",
  ["1", "true", " 1 ", " true "].every((value) => featureFlag.parseEditorialV2Enabled(value)) &&
    JSON.stringify(featureFlag.EDITORIAL_V2_TRUE_FLAG_VALUES) === JSON.stringify(["1", "true"]),
);

check(
  "lifecycle tuple contains exactly six required states",
  JSON.stringify(stateMachine.EDITORIAL_V2_LIFECYCLE_STATES) ===
    JSON.stringify(["draft", "normalized", "validated", "approval_pending", "approved", "invalidated"]),
);
check("draft cannot transition directly to approved", stateMachine.canTransition("draft", "approved") === false);
check(
  "approval_pending requires passed validation",
  stateMachine.evaluateArtifactTransition({
    from: "validated",
    to: "approval_pending",
    validationStatus: "fail",
    currentApprovalStatus: "pending",
    nextApprovalStatus: "pending",
    contentChanged: false,
    upstreamContentHashChanged: false,
  }).code === "validation_required",
);
check(
  "approved requires approval_pending and approved decision",
  stateMachine.evaluateArtifactTransition({
    from: "approval_pending",
    to: "approved",
    validationStatus: "pass",
    currentApprovalStatus: "pending",
    nextApprovalStatus: "approved",
    contentChanged: false,
    upstreamContentHashChanged: false,
  }).allowed === true,
);
check(
  "rejected artifact cannot become approved directly",
  stateMachine.evaluateArtifactTransition({
    from: "approval_pending",
    to: "approved",
    validationStatus: "pass",
    currentApprovalStatus: "rejected",
    nextApprovalStatus: "approved",
    contentChanged: false,
    upstreamContentHashChanged: false,
  }).code === "rejected_cannot_directly_approve",
);
check(
  "approved content or upstream change requires invalidation",
  stateMachine.requiresInvalidationForApprovedChange({
    from: "approved",
    contentChanged: true,
    upstreamContentHashChanged: false,
  }) &&
    stateMachine.upstreamContentHashChanged(
      [{ artifactId: "upstream-1", contentHash: "hash-a" }],
      [{ artifactId: "upstream-1", contentHash: "hash-b" }],
    ),
);

const dependencyInput = {
  projectId: "project-fixed",
  kind: "script_package",
  dependencies: [
    { artifactId: "artifact-b", contentHash: "hash-b" },
    { artifactId: "artifact-a", contentHash: "hash-a" },
  ],
};
const dependencyBefore = JSON.stringify(dependencyInput);
const downstreamOne = stateMachine.calculateDownstreamArtifactId(dependencyInput);
const downstreamTwo = stateMachine.calculateDownstreamArtifactId({
  ...dependencyInput,
  dependencies: [...dependencyInput.dependencies].reverse(),
});
check(
  "downstream artifact ID is deterministic, dependency-based, and non-mutating",
  downstreamOne === downstreamTwo &&
    downstreamOne.startsWith("shorts-editorial-os-v2:project-fixed:script_package:") &&
    JSON.stringify(dependencyInput) === dependencyBefore,
);

const fixturesOne = fixturesModule.createEditorialV2ContractFixtures();
const fixturesTwo = fixturesModule.createEditorialV2ContractFixtures();
const fixtureSource = implementationSources.get("lib/editorial-v2/fixtures.ts");
check(
  "fixture factory is deterministic and avoids clock/random/UUID",
  JSON.stringify(fixturesOne) === JSON.stringify(fixturesTwo) &&
    !/Date\.now|Math\.random|randomUUID|crypto\.randomUUID/u.test(fixtureSource),
);
check(
  "fixtures include Trend Brief, Evidence Pack, and Scene Card",
  fixturesOne.trendBrief.kind === "trend_brief" &&
    fixturesOne.evidencePack.kind === "evidence_pack" &&
    fixturesOne.sceneCards.kind === "scene_cards" &&
    fixturesOne.sceneCards.payload.scenes.length >= 1,
);
check(
  "fixture validation represents all 11 gates",
  fixturesOne.trendBrief.validation.length === 11 &&
    JSON.stringify(fixturesOne.trendBrief.validation.map((entry) => entry.gate)) ===
      JSON.stringify(expectedQualityGates),
);
check(
  "fixture envelope uses fixed namespace, version, IDs, timestamps, and hashes",
  fixturesOne.trendBrief.namespace === schema.EDITORIAL_V2_NAMESPACE &&
    fixturesOne.trendBrief.schemaVersion === schema.EDITORIAL_V2_SCHEMA_VERSION &&
    fixturesOne.trendBrief.projectId === "fixture-project-contract-v1" &&
    fixturesOne.trendBrief.createdAt === "2026-08-03T00:00:00.000Z" &&
    /^[a-f0-9]{64}$/u.test(fixturesOne.trendBrief.contentHash),
);

const storageSource = implementationSources.get("lib/editorial-v2/storage.ts");
check(
  "storage is interface plus pure key helper only",
  storageSource.includes("interface EditorialV2Storage") &&
    /load\(projectId: string\): Promise/u.test(storageSource) &&
    /list\(\): Promise/u.test(storageSource) &&
    /save\(snapshot: EditorialV2ProjectSnapshot\): Promise<void>/u.test(storageSource) &&
    !/implements\s+EditorialV2Storage|class\s+.*Storage|async\s+function/u.test(storageSource),
);
check(
  "storage key helper is namespace-bound and deterministic",
  storage.buildEditorialV2StorageKey("project one", "artifact/one") ===
    storage.buildEditorialV2StorageKey("project one", "artifact/one") &&
    storage.buildEditorialV2StorageKey("project one").startsWith(
      "shorts-editorial-os-v2:2.0.0-alpha.1:project:",
    ),
);

const routeSource = implementationSources.get("app/editorial-v2/page.tsx");
check(
  "route is a server component with local notFound hard stop",
  !/["']use client["']/u.test(routeSource) &&
    routeSource.includes('from "next/navigation"') &&
    /if\s*\(!isEditorialV2Enabled\(\)\)[\s\S]*?notFound\(\)/u.test(routeSource),
);
check(
  "route shell contains required inert labels",
  routeSource.includes("Shorts Editorial OS V2") &&
    routeSource.includes("Slice 1 contract shell") &&
    routeSource.includes("not connected yet"),
);
check(
  "route has no fetch, server action, form, button, or V1 import",
  !/\bfetch\s*\(|["']use server["']|<form\b|<button\b|\baction\s*=|VideoCreationWizard|money-shorts|fact-cards|owner-web-operator/u.test(
    routeSource,
  ),
);

let diffCheckPassed = true;
let diffCheckDetail = "";
try {
  git(["diff", "--check"]);
} catch (error) {
  diffCheckPassed = false;
  diffCheckDetail = error.stderr?.toString().trim() || error.message;
}
check("git diff --check passes", diffCheckPassed, diffCheckDetail);

const newFileWhitespaceIssues = baseline.slice1NewFileAllowlist.filter((file) =>
  readRepo(file).split(/\r?\n/u).some((line) => /[ \t]+$/u.test(line)),
);
check("Slice 1 new files have no trailing whitespace", newFileWhitespaceIssues.length === 0, newFileWhitespaceIssues.join(", "));

if (fail > 0) {
  console.error(`SHORTS_EDITORIAL_OS_V2_SLICE1_CHECK_FAIL ${pass}/${pass + fail} PASS`);
  process.exit(1);
}

console.log(`SHORTS_EDITORIAL_OS_V2_SLICE1_CHECK_PASS ${pass}/${pass} PASS`);
