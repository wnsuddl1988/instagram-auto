import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const root = resolve(process.cwd());
const baseline = JSON.parse(readFileSync(resolve(root, "_ai/SHORTS_EDITORIAL_OS_V2_SLICE_7_BASELINE.json"), "utf8"));
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
check("manifest version", baseline.manifestVersion === "1.0.0");
check("manifest repository", baseline.repository === "Shorts Editorial OS V2");
check("manifest reconstructability", baseline.baselineReconstructability === "NOT_RECONSTRUCTABLE");
check("manifest branch", baseline.git.branch === "codex/source-first-blueprint-clean");
check("manifest HEAD", baseline.git.head === "5e0e0e044b3ebea6af07b98e733a3eac6a96aa2c");
check("manifest parent", baseline.git.parent === "ce6346411d8a071921e942fad5c895f5fcf94b1b");
check("manifest upstream ahead", baseline.git.upstream.ahead === 7);
check("manifest upstream behind", baseline.git.upstream.behind === 0);
check("manifest modified", baseline.git.modifiedCount === 21);
check("manifest untracked", baseline.git.untrackedCount === 3);
check("manifest staged", baseline.git.stagedCount === 0);
check("manifest status paths", baseline.git.statusPathCount === 24);
check("protected status entries", baseline.statusPaths.length === 24);
check("exact allowlist 18", baseline.slice7ExactAllowlist.length === 18);
check("new allowlist 13", baseline.slice7NewFileAllowlist.length === 13);
check("modified allowlist 5", baseline.slice7ModifiedFileAllowlist.length === 5);
check("protection exceptions", JSON.stringify(baseline.protectionExceptions) === JSON.stringify(["_ai/PROJECT_STATE.md", "_ai/NEXT_ACTION.md"]));
check("current HEAD unchanged", git(["rev-parse", "HEAD"]) === baseline.git.head);
check("current parent unchanged", git(["show", "-s", "--format=%P", "HEAD"]) === baseline.git.parent);
check("current ahead seven", Number(git(["rev-list", "--count", "@{upstream}..HEAD"])) === 7);
check("current behind zero", Number(git(["rev-list", "--count", "HEAD..@{upstream}"])) === 0);

const porcelain = git(["status", "--porcelain=v1", "-z"], true);
const statusEntries = porcelain.split("\0").filter(Boolean).map((entry) => ({ status: entry.slice(0, 2), path: entry.slice(3).replaceAll("\\", "/") }));
const expectedStatusPaths = new Set([...baseline.statusPaths.map((entry) => entry.path), ...baseline.slice7ExactAllowlist]);
const actualStatusPaths = new Set(statusEntries.map((entry) => entry.path));
check("working status exact 42", statusEntries.length === 42, String(statusEntries.length));
check("working modified exact 26", statusEntries.filter((entry) => entry.status === " M").length === 26);
check("working untracked exact 16", statusEntries.filter((entry) => entry.status === "??").length === 16);
check("working staged zero", statusEntries.every((entry) => entry.status[0] === " " || entry.status === "??"));
check("working rename zero", statusEntries.every((entry) => !entry.status.includes("R")));
check("working delete zero", statusEntries.every((entry) => !entry.status.includes("D")));
check("status path set exact", actualStatusPaths.size === expectedStatusPaths.size && [...actualStatusPaths].every((path) => expectedStatusPaths.has(path)));
for (const path of baseline.slice7NewFileAllowlist) check(`new file untracked ${path}`, statusEntries.some((entry) => entry.path === path && entry.status === "??"));
for (const path of baseline.slice7ModifiedFileAllowlist) check(`modified file unstaged ${path}`, statusEntries.some((entry) => entry.path === path && entry.status === " M"));
for (const entry of baseline.statusPaths) {
  check(`protected status ${entry.path}`, statusEntries.some((candidate) => candidate.path === entry.path && candidate.status === entry.status));
  check(`protected hash ${entry.path}`, sha256(entry.path) === entry.sha256);
}
for (const entry of [...baseline.governanceCriticalPaths, ...baseline.checkpointCriticalPaths]) {
  if (baseline.slice7ModifiedFileAllowlist.includes(entry.path)) continue;
  check(`critical hash ${entry.path}`, sha256(entry.path) === entry.sha256);
}

const contracts = readRepo("lib/editorial-v2/contracts.ts");
const originalContracts = git(["show", `${baseline.git.head}:lib/editorial-v2/contracts.ts`]).replaceAll("\r\n", "\n");
let cursor = 0;
let additiveOnly = true;
for (const line of originalContracts.split("\n").filter((line) => line.trim())) {
  const next = contracts.replaceAll("\r\n", "\n").indexOf(line, cursor);
  if (next < 0) { additiveOnly = false; break; }
  cursor = next + line.length;
}
check("contracts original non-empty lines preserved in order", additiveOnly);
checkForbiddenTokens("contracts", contracts, [" any;", ": any", "<any>", "readonly?:"]);
const artifactBlock = contracts.match(/EDITORIAL_V2_ARTIFACT_KINDS\s*=\s*\[([\s\S]*?)\]\s*as const/u)?.[1] ?? "";
const qualityBlock = contracts.match(/EDITORIAL_V2_QUALITY_GATES\s*=\s*\[([\s\S]*?)\]\s*as const/u)?.[1] ?? "";
const sceneCardBlock = contracts.match(/export interface SceneCard \{([\s\S]*?)\n\}/u)?.[1] ?? "";
check("artifact kind remains 12", (artifactBlock.match(/"[^"]+"/gu) ?? []).length === 12);
check("quality gate remains 11", (qualityBlock.match(/"[^"]+"/gu) ?? []).length === 11);
check("SceneCard remains 15 fields", (sceneCardBlock.match(/^  readonly /gmu) ?? []).length === 15);
checkTokens("Slice 7 contract types", contracts, [
  "ApprovedRenderIntegrationSessionSnapshot", "PublishPlatformId", "PublishExecutionIntent", "PublishVisibilityIntent", "PlatformPolicyAuthority", "PlatformMetadataPolicy",
  "PublishExpectedDestinationIdentity", "PublishObservedDestinationIdentity", "PublishIdentityObservationLevel", "PublishIdentityComparison", "PublishMetadataDraft", "PublishHashtagPlan",
  "PublishSourceDisclosurePlan", "PublishCoverPlan", "PublishScheduleIntent", "PlatformPublishPackage", "PublishPackage", "PublishDeduplicationKey", "PublishDuplicateCheckResult",
  "PublicationAttemptStatus", "PublicationAttemptRecord", "PlatformPublicationState", "SessionPublicationLedger", "PublishRecoveryReason", "PlatformRecoveryAction", "PublishRecoveryPlan",
  "PublishBridgeCapability", "PublishBridgePlan", "PublishDryRunResult", "PublishValidationIssue", "PublishValidationSummary", "PublishApprovalState",
  "ApprovedPublishIntegrationSessionSnapshot", "PublishIntegrationSessionState",
]);
checkTokens("Slice 7 contract literals", contracts, [
  '"instagram_reels"', '"youtube_shorts"', '"immediate_future"', '"scheduled_future"', '"public"', '"unlisted"', '"private"', '"internal_planning_only"',
  '"manual_unverified"', '"external_readonly_future"', '"planned"', '"blocked"', '"dry_run_in_progress"', '"dry_run_success"', '"dry_run_failed"', '"superseded"',
  '"destination_identity_read"', '"media_upload"', '"metadata_publish"', '"cover_publish"', '"immediate_publish"', '"scheduled_publish"',
  '"publication_status_read"', '"publication_cancel"', '"duplicate_remote_check"', '"per_platform_retry"', '"durable_publication_ledger"',
  '"PUBLISH_INTEGRATION_PRECHECK_ONLY"',
]);
checkTokens("Slice 7 contract safety", contracts, [
  "identityExecutionVerified: false", "actualCurrentPlatformLimitsVerified: false", "actualCoverCreated: false", "schedulerAvailable: false", "executionReady: false",
  "executionRequested: false", "externalCallExecuted: false", "uploadExecuted: false", "publicationExecuted: false", "durableLedgerAvailable: false", "externalExecution: false",
  "dryRun: true", "durable: false", "remoteSynchronized: false", "actualRetryExecuted: false", "available: false", "future: true", "executionCommand: null",
  "externalRequest: null", "missingCredentials: true", "missingExternalIdentityVerification: true", "missingDurableLedger: true", "executionEligible: false", "sessionOnly: true",
]);

const moduleExpectations = new Map([
  ["lib/editorial-v2/publish-identity.ts", ["export function normalizePublishDestinationIdentity", "export function comparePublishDestinationIdentity", "export function validatePublishDestinationIdentity", "export function summarizeIdentityValidation", "wrong_account_destination_mismatch", "manual_identity_observation_only", "external_identity_verification_missing", "identityExecutionVerified: false"]],
  ["lib/editorial-v2/publish-metadata.ts", ["export function buildPlatformPublishMetadata", "export function validatePlatformPublishMetadata", "export function buildPublishSourceDisclosure", "export function buildPublishCoverPlan", "DetailedScript", "internal_planning_only", "duplicate_hashtags_normalized", "unsafe_financial_language", "source_existence_unverified", "actual_cover_unavailable", "metadataHash"]],
  ["lib/editorial-v2/publish-package.ts", ["export function buildPublishPackage", "export function clonePublishPackage", "export function hashPublishPackage", "export function validatePublishPackageShape", "render://", "cover://", "executionRequested: false", "externalCallExecuted: false", "uploadExecuted: false", "publicationExecuted: false", "durableLedgerAvailable: false", "executionReady: false"]],
  ["lib/editorial-v2/publish-ledger-session.ts", ["export function buildPublishDeduplicationKey", "export function checkSessionPublishDuplicate", "export function recordSessionPublicationAttempt", "export function cloneSessionPublicationLedger", "export function validateSessionPublicationLedger", "publication_dedupe_key_blocked", "failed_publication_requires_recovery_plan", "attemptOrdinal"]],
  ["lib/editorial-v2/publish-recovery.ts", ["export function buildPublishRecoveryPlan", "export function comparePlatformPublicationStates", "export function canRetryPlatformPublication", "export function buildFailedPlatformRetryPackage", "preserve_success", "retry_failed_dry_run", "change_plan_required", "schedule_expired"]],
  ["lib/editorial-v2/publish-bridge.ts", ["export function buildPublishBridgePlan", "export function validatePublishBridgePlan", "destination_identity_read", "media_upload", "scheduled_publish", "missingCredentials: true", "missingExternalIdentityVerification: true", "missingDurableLedger: true", "executionReady: false", "executionCommand: null", "externalRequest: null"]],
  ["lib/editorial-v2/publish-validation.ts", ["export function validatePublishIntegration", "export function summarizePublishValidation", "export function canApprovePublishIntegration", "approved_render_integration_missing", "validatePublishDestinationIdentity", "publish_schedule_in_past", "session_publish_duplicate_key", "publish_rights_unresolved", "PUBLISH_INTEGRATION_PRECHECK_ONLY"]],
  ["lib/editorial-v2/publish-fixture.ts", ["export function buildSyntheticApprovedRenderIntegrationSnapshot", "export function buildSyntheticPublishFixture", "slice7-synthetic-publish-fixture-v1", "synthetic-instagram-destination", "synthetic-youtube-destination", "actualUserDataIncluded: false", "actualAccountIdIncluded: false", "actualPublicationExecuted: false"]],
]);
for (const [path, tokens] of moduleExpectations) checkTokens(path, readRepo(path), tokens);

const safeModulePaths = [...moduleExpectations.keys(), "components/editorial-v2/PublishIntegrationWorkbench.tsx"];
for (const path of safeModulePaths) {
  const source = readRepo(path);
  check(`${path} no network`, !/\bfetch\s*\(|XMLHttpRequest|WebSocket|EventSource/u.test(source));
  check(`${path} no env`, !/process\.env|import\.meta\.env/u.test(source));
  check(`${path} no persistence`, !/localStorage|sessionStorage|indexedDB/u.test(source));
  check(`${path} no server route`, !/NextRequest|NextResponse|route\.ts/u.test(source));
  check(`${path} no node fs`, !/from ["']node:(?:fs|fs\/promises)["']/u.test(source));
  check(`${path} no process spawn`, !/spawnSync|execSync|execFile|child_process/u.test(source));
  check(`${path} no V1 import`, !/from ["'][^"']*(?:money-shorts|finance-|flow-|owner-web|veo-)/u.test(source));
  check(`${path} no clock randomness`, !/Date\.now|Math\.random|randomUUID/u.test(source));
}

const renderUi = readRepo("components/editorial-v2/RenderIntegrationWorkbench.tsx");
checkTokens("Render callback", renderUi, ["approvedDetailedScriptSnapshot", "cloneDetailedScriptSnapshot", "sourceDetailedScriptSnapshot", "onApprovedRenderIntegrationChange(null)", "sourceCharacterSnapshot", "voicePlan", "subtitleTrack", "renderManifest", "bridgePlan", "sessionOnly: true", "productionReady: false"]);
const editorialUi = readRepo("components/editorial-v2/EditorialV2Workbench.tsx");
checkTokens("Editorial orchestration", editorialUi, ["ApprovedPublishIntegrationSessionSnapshot", "PublishIntegrationWorkbench", "approvedPublishSnapshot", "setApprovedPublishSnapshot(null)", "handleApprovedRenderChange", "approvedDetailedScriptSnapshot", "approvedRenderIntegrationSnapshot", "Publish Integration session-only 연결", "실제 계정 API 조회·OAuth·upload·publish·schedule·network·durable persistence는 없습니다"]);
const publishUi = readRepo("components/editorial-v2/PublishIntegrationWorkbench.tsx");
checkTokens("Publish UI seven steps", publishUi, ["플랫폼 선택", "목적지 계정", "Metadata · Source Disclosure", "실행 의도", "Duplicate · Session Ledger", "Recovery", "Validation · Session Approval"]);
checkTokens("Publish UI gates", publishUi, ["manual_unverified", "mismatch는 hard stop", "최신 플랫폼 제한", "schedulerAvailable: false", "executionReady: false", "Synthetic partial-failure dry-run", "YouTube failed-only retry dry-run", "Session ledger reset", "durable ledger 없음", "remote duplicate 미확인", "actual retry 실행 없음", "실제 계정 검증·upload·publish·schedule·durable ledger·execution eligibility가 아님", "SESSION_ONLY_APPROVED"]);
checkForbiddenTokens("Publish UI", publishUi, ["fetch(", "localStorage", "indexedDB", "dangerouslySetInnerHTML", 'type="file"', "OAuth button", "actual publish button"]);
const css = readRepo("components/editorial-v2/PublishIntegrationWorkbench.module.css");
checkTokens("Publish CSS", css, [".shell", ".hero", ".step", ".platformGrid", ".platformCard", '[data-selected="true"]', ".identityGrid", ".metadataGrid", ".formGrid", ".tableWrap", "overflow-x: auto", ".recoveryGrid", ".issues", '[data-blocking="true"]', ".confirmation", ".actions", ":focus-visible", "@media (max-width: 920px)", "@media (max-width: 640px)", "grid-template-columns: 1fr"]);

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

const fixtureModule = loadTs("lib/editorial-v2/publish-fixture.ts");
const identityModule = loadTs("lib/editorial-v2/publish-identity.ts");
const metadataModule = loadTs("lib/editorial-v2/publish-metadata.ts");
const packageModule = loadTs("lib/editorial-v2/publish-package.ts");
const ledgerModule = loadTs("lib/editorial-v2/publish-ledger-session.ts");
const recoveryModule = loadTs("lib/editorial-v2/publish-recovery.ts");
const bridgeModule = loadTs("lib/editorial-v2/publish-bridge.ts");
const validationModule = loadTs("lib/editorial-v2/publish-validation.ts");

const fixtureA = fixtureModule.buildSyntheticPublishFixture();
const fixtureB = fixtureModule.buildSyntheticPublishFixture();
check("fixture deterministic deep equal", JSON.stringify(fixtureA) === JSON.stringify(fixtureB));
check("fixture top reference isolated", fixtureA !== fixtureB);
check("fixture package reference isolated", fixtureA.publishPackage !== fixtureB.publishPackage);
check("fixture source reference isolated", fixtureA.approvedRenderIntegration.sourceDetailedScriptSnapshot.evidencePack.sources !== fixtureB.approvedRenderIntegration.sourceDetailedScriptSnapshot.evidencePack.sources);
check("fixture synthetic only", fixtureA.syntheticOnly === true);
check("fixture actual user data false", fixtureA.actualUserDataIncluded === false);
check("fixture actual account false", fixtureA.actualAccountIdIncluded === false);
check("fixture actual publication false", fixtureA.actualPublicationExecuted === false);
check("fixture exactly two platforms", fixtureA.publishPackage.platformPackages.length === 2);
check("fixture execution ready false", fixtureA.publishPackage.executionReady === false);

const expected = fixtureA.expectedDestinations[0];
const observed = fixtureA.observedDestinations[0];
check("identity matching plan", identityModule.comparePublishDestinationIdentity(expected, observed).matchesForPlanning === true);
check("identity execution never verified", identityModule.comparePublishDestinationIdentity(expected, observed).identityExecutionVerified === false);
check("identity outer whitespace trimmed", identityModule.comparePublishDestinationIdentity({ ...expected, stableDestinationId: ` ${expected.stableDestinationId} ` }, observed).stableDestinationIdMatches === true);
check("identity case preserved mismatch", identityModule.comparePublishDestinationIdentity({ ...expected, stableDestinationId: expected.stableDestinationId.toUpperCase() }, observed).stableDestinationIdMatches === false);
check("display label not identity key", identityModule.comparePublishDestinationIdentity({ ...expected, displayLabel: "different" }, observed).matchesForPlanning === true);
check("missing expected blocked", identityModule.validatePublishDestinationIdentity({ ...expected, stableDestinationId: "" }, observed).some((entry) => entry.code === "expected_destination_id_missing" && entry.blocking));
check("missing observed blocked", identityModule.validatePublishDestinationIdentity(expected, { ...observed, stableDestinationId: "" }).some((entry) => entry.code === "observed_destination_id_missing" && entry.blocking));
check("wrong account blocked", identityModule.validatePublishDestinationIdentity(expected, { ...observed, stableDestinationId: "wrong" }).some((entry) => entry.code === "wrong_account_destination_mismatch" && entry.blocking));
check("owner confirmation blocked", identityModule.validatePublishDestinationIdentity({ ...expected, ownerConfirmation: false }, observed).some((entry) => entry.code === "owner_account_confirmation_missing" && entry.blocking));

const instagramMetadata = fixtureA.publishPackage.platformPackages.find((entry) => entry.platformId === "instagram_reels").metadata;
const youtubeMetadata = fixtureA.publishPackage.platformPackages.find((entry) => entry.platformId === "youtube_shorts").metadata;
check("instagram visibility public", instagramMetadata.visibilityIntent === "public");
check("youtube visibility private", youtubeMetadata.visibilityIntent === "private");
check("duplicate hashtag normalized", instagramMetadata.hashtags.duplicateCount === 1);
check("source disclosure present", instagramMetadata.sourceDisclosure.sources.length === 1);
check("source existence false", instagramMetadata.sourceDisclosure.sourceExistenceVerified === false);
check("cover metadata only", instagramMetadata.coverPlan.metadataOnly === true && instagramMetadata.coverPlan.actualCoverCreated === false);
check("metadata deterministic", metadataModule.buildPlatformPublishMetadata({ approvedRenderIntegration: fixtureA.approvedRenderIntegration, platformId: "instagram_reels", hashtags: ["#출처확인", "#기준일", "#출처확인"], selectedCoverSceneId: "synthetic-scene-01", coverTitleOverlay: "출처와 기준일", accessibilityDescription: "공식 출처 확인 절차를 보여주는 synthetic 카드", visibilityIntent: "public" }).metadataHash === instagramMetadata.metadataHash);
check("unsafe financial language blocked", metadataModule.validatePlatformPublishMetadata({ ...instagramMetadata, caption: "무조건 매수" }).some((entry) => entry.code === "unsafe_financial_language" && entry.blocking));
check("control character blocked", metadataModule.validatePlatformPublishMetadata({ ...instagramMetadata, caption: `safe\u0001bad` }).some((entry) => entry.code === "publish_metadata_control_character" && entry.blocking));

const initialContext = { approvedRenderIntegration: fixtureA.approvedRenderIntegration, ledger: fixtureA.emptyLedger, rightsResolvedForPlanning: true, paidPossibleOwnerConfirmation: true };
const initialIssues = validationModule.validatePublishIntegration(fixtureA.publishPackage, initialContext);
const initialBridge = bridgeModule.buildPublishBridgePlan(fixtureA.publishPackage, recoveryModule.buildPublishRecoveryPlan(fixtureA.publishPackage, fixtureA.emptyLedger));
const initialSummary = validationModule.summarizePublishValidation([...initialIssues, ...bridgeModule.validatePublishBridgePlan(initialBridge, fixtureA.publishPackage)]);
check("initial package blocking zero", initialSummary.blockingIssueCount === 0, JSON.stringify(initialSummary.issues.filter((entry) => entry.blocking)));
check("initial package approvable", validationModule.canApprovePublishIntegration(initialSummary) === true);
check("initial execution eligible false", initialSummary.executionEligible === false);
check("bridge execution false", initialBridge.executionReady === false);
check("bridge command null", initialBridge.executionCommand === null);
check("bridge request null", initialBridge.externalRequest === null);
check("bridge credentials missing", initialBridge.missingCredentials === true);
check("bridge identity verification missing", initialBridge.missingExternalIdentityVerification === true);
check("bridge durable ledger missing", initialBridge.missingDurableLedger === true);
for (const plan of initialBridge.platformPlans) {
  check(`bridge ${plan.platformId} render logical URI`, plan.logicalRenderUri.startsWith("render://"));
  check(`bridge ${plan.platformId} cover logical URI`, plan.logicalCoverUri.startsWith("cover://"));
  check(`bridge ${plan.platformId} all unavailable`, plan.requiredCapabilities.every((entry) => entry.available === false && entry.future === true));
}

const baseBuildInput = { approvedRenderIntegration: fixtureA.approvedRenderIntegration, selectedPlatforms: ["instagram_reels", "youtube_shorts"], expectedDestinationIdentities: fixtureA.expectedDestinations, observedDestinationIdentities: fixtureA.observedDestinations, platformMetadata: fixtureA.publishPackage.platformPackages.map((entry) => entry.metadata), scheduleIntent: fixtureA.immediateIntent, rightsResolvedForPlanning: true, paidPossible: false, paidPossibleOwnerConfirmation: true, createdFromSessionIdentity: "slice7-synthetic-session" };
const scheduledPackage = packageModule.buildPublishPackage({ ...baseBuildInput, scheduleIntent: fixtureA.scheduledIntent });
check("schedule-only change keeps dedupe", JSON.stringify(scheduledPackage.platformPackages.map((entry) => entry.dedupeKey.value)) === JSON.stringify(fixtureA.publishPackage.platformPackages.map((entry) => entry.dedupeKey.value)));
const changedMetadata = baseBuildInput.platformMetadata.map((entry) => entry.platformId === "youtube_shorts" ? { ...entry, metadataHash: `${entry.metadataHash}-changed` } : entry);
const metadataChangedPackage = packageModule.buildPublishPackage({ ...baseBuildInput, platformMetadata: changedMetadata });
check("metadata change changes key", metadataChangedPackage.platformPackages.find((entry) => entry.platformId === "youtube_shorts").dedupeKey.value !== fixtureA.publishPackage.platformPackages.find((entry) => entry.platformId === "youtube_shorts").dedupeKey.value);
const changedExpected = fixtureA.expectedDestinations.map((entry) => entry.platformId === "youtube_shorts" ? { ...entry, stableDestinationId: "synthetic-youtube-destination-2" } : entry);
const changedObserved = fixtureA.observedDestinations.map((entry) => entry.platformId === "youtube_shorts" ? { ...entry, stableDestinationId: "synthetic-youtube-destination-2" } : entry);
const destinationChangedPackage = packageModule.buildPublishPackage({ ...baseBuildInput, expectedDestinationIdentities: changedExpected, observedDestinationIdentities: changedObserved });
check("destination change changes key", destinationChangedPackage.platformPackages.find((entry) => entry.platformId === "youtube_shorts").dedupeKey.value !== fixtureA.publishPackage.platformPackages.find((entry) => entry.platformId === "youtube_shorts").dedupeKey.value);
const changedRender = { ...fixtureA.approvedRenderIntegration, renderManifest: { ...fixtureA.approvedRenderIntegration.renderManifest, manifestHash: "synthetic-render-manifest-hash-v2" } };
const renderChangedPackage = packageModule.buildPublishPackage({ ...baseBuildInput, approvedRenderIntegration: changedRender });
check("render change changes key", renderChangedPackage.platformPackages.find((entry) => entry.platformId === "instagram_reels").dedupeKey.value !== fixtureA.publishPackage.platformPackages.find((entry) => entry.platformId === "instagram_reels").dedupeKey.value);
for (const entry of fixtureA.publishPackage.platformPackages) check(`dedupe helper matches ${entry.platformId}`, ledgerModule.buildPublishDeduplicationKey(entry).value === entry.dedupeKey.value);

const instagram = fixtureA.publishPackage.platformPackages.find((entry) => entry.platformId === "instagram_reels");
const youtube = fixtureA.publishPackage.platformPackages.find((entry) => entry.platformId === "youtube_shorts");
let ledger = fixtureA.emptyLedger;
const instagramSuccess = { attemptId: "instagram-1", platformId: "instagram_reels", dedupeKey: instagram.dedupeKey.value, attemptOrdinal: 1, status: "dry_run_success", requestedAtIso: "2026-08-06T00:00:00.000Z", completedAtIso: "2026-08-06T00:00:01.000Z", failureCode: null, failureMessage: null, retryable: false, identityMatchAtAttempt: true, externalExecution: false, dryRun: true };
const youtubeFailure = { attemptId: "youtube-1", platformId: "youtube_shorts", dedupeKey: youtube.dedupeKey.value, attemptOrdinal: 1, status: "dry_run_failed", requestedAtIso: "2026-08-06T00:00:00.000Z", completedAtIso: "2026-08-06T00:00:01.000Z", failureCode: "SYNTHETIC", failureMessage: "synthetic", retryable: true, identityMatchAtAttempt: true, externalExecution: false, dryRun: true };
ledger = ledgerModule.recordSessionPublicationAttempt(ledger, instagramSuccess);
ledger = ledgerModule.recordSessionPublicationAttempt(ledger, youtubeFailure);
check("ledger attempt two", ledger.attempts.length === 2);
check("ledger validation clean", ledgerModule.validateSessionPublicationLedger(ledger).length === 0);
check("successful duplicate detected", ledgerModule.checkSessionPublishDuplicate(instagram.dedupeKey, ledger).blocking === true);
let duplicateBlocked = false;
try { ledgerModule.recordSessionPublicationAttempt(ledger, { ...instagramSuccess, attemptId: "instagram-2", attemptOrdinal: 2, status: "planned" }); } catch (error) { duplicateBlocked = error instanceof Error && error.message === "publication_dedupe_key_blocked"; }
check("successful duplicate registration blocked", duplicateBlocked);
let failedWithoutRecoveryBlocked = false;
try { ledgerModule.recordSessionPublicationAttempt(ledger, { ...youtubeFailure, attemptId: "youtube-2", attemptOrdinal: 2, status: "dry_run_success", failureCode: null, failureMessage: null }); } catch (error) { failedWithoutRecoveryBlocked = error instanceof Error && error.message === "failed_publication_requires_recovery_plan"; }
check("failed retry needs recovery", failedWithoutRecoveryBlocked);
const recovery = recoveryModule.buildPublishRecoveryPlan(fixtureA.publishPackage, ledger);
check("recovery preserves Instagram", JSON.stringify(recovery.successfulPlatformIds) === JSON.stringify(["instagram_reels"]));
check("recovery failed YouTube", JSON.stringify(recovery.failedPlatformIds) === JSON.stringify(["youtube_shorts"]));
check("recovery retries YouTube only", JSON.stringify(recovery.retryablePlatformIds) === JSON.stringify(["youtube_shorts"]));
check("recovery action preserves success", recovery.nextAllowedActions.find((entry) => entry.platformId === "instagram_reels")?.action === "preserve_success");
check("recovery action retries failed", recovery.nextAllowedActions.find((entry) => entry.platformId === "youtube_shorts")?.action === "retry_failed_dry_run");
check("retry package YouTube only", JSON.stringify(recoveryModule.buildFailedPlatformRetryPackage(fixtureA.publishPackage, recovery).platformPackages.map((entry) => entry.platformId)) === JSON.stringify(["youtube_shorts"]));

const wrongObserved = fixtureA.observedDestinations.map((entry) => entry.platformId === "youtube_shorts" ? { ...entry, stableDestinationId: "wrong-account" } : entry);
const wrongPackage = packageModule.buildPublishPackage({ ...baseBuildInput, observedDestinationIdentities: wrongObserved });
check("wrong account package blocked", validationModule.validatePublishIntegration(wrongPackage, initialContext).some((entry) => entry.code === "wrong_account_destination_mismatch" && entry.blocking));
const pastPackage = packageModule.buildPublishPackage({ ...baseBuildInput, scheduleIntent: { ...fixtureA.scheduledIntent, scheduledAtIso: "2026-08-05T00:00:00.000Z" } });
check("past schedule blocked", validationModule.validatePublishIntegration(pastPackage, initialContext).some((entry) => entry.code === "publish_schedule_in_past" && entry.blocking));
const noTimezonePackage = packageModule.buildPublishPackage({ ...baseBuildInput, scheduleIntent: { ...fixtureA.scheduledIntent, timezone: "" } });
check("schedule timezone blocked", validationModule.validatePublishIntegration(noTimezonePackage, initialContext).some((entry) => entry.code === "publish_schedule_timezone_missing" && entry.blocking));
const noScheduleOwnerPackage = packageModule.buildPublishPackage({ ...baseBuildInput, scheduleIntent: { ...fixtureA.scheduledIntent, scheduleOwnerConfirmation: false } });
check("schedule Owner blocked", validationModule.validatePublishIntegration(noScheduleOwnerPackage, initialContext).some((entry) => entry.code === "publish_schedule_owner_confirmation_missing" && entry.blocking));
check("rights unresolved blocked", validationModule.validatePublishIntegration(fixtureA.publishPackage, { ...initialContext, rightsResolvedForPlanning: false }).some((entry) => entry.code === "publish_rights_unresolved" && entry.blocking));
const paidPackage = packageModule.buildPublishPackage({ ...baseBuildInput, paidPossible: true, paidPossibleOwnerConfirmation: false });
check("paid possible Owner blocked", validationModule.validatePublishIntegration(paidPackage, { ...initialContext, paidPossibleOwnerConfirmation: false }).some((entry) => entry.code === "publish_paid_possible_owner_confirmation_missing" && entry.blocking));

const probe = readRepo("scripts/probe-shorts-editorial-os-v2-slice7-publish.mjs");
checkTokens("probe scenarios", probe, ["SHORTS_EDITORIAL_OS_V2_SLICE7_SYNTHETIC_PUBLISH_DRY_RUN_PASS", "buildSyntheticPublishFixture", "dry_run_success", "dry_run_failed", "buildPublishRecoveryPlan", "buildFailedPlatformRetryPackage", "publication_dedupe_key_blocked", "wrong_account_destination_mismatch", "publish_schedule_in_past", "owner_account_confirmation_missing", "executionReady", "externalCallExecuted", "uploadExecuted", "publicationExecuted", "statusBefore", "statusAfter", "repository status changed"]);
checkForbiddenTokens("probe safety", probe, ["writeFile", "appendFile", "mkdir", "rmSync", "process.env", "fetch(", "http://", "https://", "C:\\tmp", "localStorage", "indexedDB", "oauth", "access_token", "refresh_token"]);
check("probe imports fs read-only", probe.includes('import { existsSync, readFileSync } from "node:fs"'));

const projectState = readRepo("_ai/PROJECT_STATE.md");
const nextAction = readRepo("_ai/NEXT_ACTION.md");
checkTokens("PROJECT_STATE Slice 7", projectState, ["Slice 0·1·2·3·4·5·6는 `FINAL_PASS`", "Slice 7: `IMPLEMENTATION_COMPLETE_AWAITING_CROSS_REVIEW`", "Slice 7 Cross Review: `NOT_STARTED`", "Slice 8: `BLOCKED`", "Publish Package: `SESSION_ONLY`", "account identity: `MANUAL_UNVERIFIED`", "wrong-account hard stop: `STRUCTURAL`", "platform metadata: `INTERNAL_PLANNING_POLICY`", "schedule: `INTENT_ONLY`", "duplicate prevention: `SESSION_ONLY`", "publication ledger: `SESSION_ONLY`", "recovery: `PLAN_ONLY`", "publish bridge: `executionReady=false`", "OAuth: `NOT_CONNECTED`", "actual upload: `NOT_IMPLEMENTED`", "actual publish: `NOT_IMPLEMENTED`", "durable ledger: `NOT_IMPLEMENTED`", "runtime UI: `UNVERIFIED`", "product operational capability: `NOT_CLAIMED`", "Push: `NOT_AUTHORIZED`", "automatic continuation: `DISABLED`", "progress: `NOT_CALCULATED`"]);
checkTokens("NEXT_ACTION Slice 7", nextAction, ["Claude Code Slice 7 read-only Cross Review", "ChatGPT 중간 전달 불필요", "Claude 결과는 Codex에 전달", "일반 P1", "P0/BLOCKED/scope expansion", "Slice 8 자동 시작 금지", "probe 재실행 금지", "feat(editorial-v2): checkpoint slice 7 publish recovery plan", "exact 18-file checkpoint", "Push: `NOT_AUTHORIZED`"]);

const configPath = ts.findConfigFile(root, ts.sys.fileExists, "tsconfig.json");
check("tsconfig found", Boolean(configPath));
if (configPath) {
  const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
  const parsed = ts.parseJsonConfigFileContent(configFile.config, ts.sys, root, { noEmit: true, incremental: false }, configPath);
  const targets = new Set([
    "lib/editorial-v2/contracts.ts", "lib/editorial-v2/publish-package.ts", "lib/editorial-v2/publish-metadata.ts", "lib/editorial-v2/publish-identity.ts",
    "lib/editorial-v2/publish-validation.ts", "lib/editorial-v2/publish-ledger-session.ts", "lib/editorial-v2/publish-recovery.ts", "lib/editorial-v2/publish-bridge.ts",
    "lib/editorial-v2/publish-fixture.ts", "components/editorial-v2/PublishIntegrationWorkbench.tsx", "components/editorial-v2/EditorialV2Workbench.tsx",
    "components/editorial-v2/RenderIntegrationWorkbench.tsx",
  ].map((path) => resolve(root, path)));
  const program = ts.createProgram({ rootNames: parsed.fileNames, options: parsed.options });
  const syntactic = program.getSyntacticDiagnostics().filter((diagnostic) => !diagnostic.file || targets.has(resolve(diagnostic.file.fileName)));
  const semantic = program.getSemanticDiagnostics().filter((diagnostic) => !diagnostic.file || targets.has(resolve(diagnostic.file.fileName)));
  check("target syntactic diagnostics zero", syntactic.length === 0, syntactic.map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, " ")).join(" | "));
  check("target semantic diagnostics zero", semantic.length === 0, semantic.map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, " ")).join(" | "));
}

let diffCheckPass = true;
try { git(["diff", "--check"]); } catch { diffCheckPass = false; }
check("git diff --check", diffCheckPass);
const whitespaceIssues = baseline.slice7NewFileAllowlist.filter((path) => readRepo(path).split(/\r?\n/u).some((line) => /[ \t]+$/u.test(line)));
check("new files trailing whitespace zero", whitespaceIssues.length === 0, whitespaceIssues.join(", "));
const checkerSource = readRepo("scripts/check-shorts-editorial-os-v2-slice7.mjs");
const checkerAst = ts.createSourceFile("check-shorts-editorial-os-v2-slice7.mjs", checkerSource, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
const checkerImports = checkerAst.statements.filter(ts.isImportDeclaration);
const checkerFsImport = checkerImports.find((statement) => statement.moduleSpecifier.text === "node:fs");
const checkerFsNames = checkerFsImport?.importClause?.namedBindings && ts.isNamedImports(checkerFsImport.importClause.namedBindings)
  ? checkerFsImport.importClause.namedBindings.elements.map((element) => element.name.text).sort()
  : [];
check("checker fs import read-only", JSON.stringify(checkerFsNames) === JSON.stringify(["existsSync", "readFileSync"]));
check("checker at least 380 independent checks", pass + fail >= 380, String(pass + fail));

if (fail > 0) {
  console.error(`SHORTS_EDITORIAL_OS_V2_SLICE7_CHECK_FAIL ${pass}/${pass + fail} PASS`);
  process.exit(1);
}
console.log(`SHORTS_EDITORIAL_OS_V2_SLICE7_CHECK_PASS ${pass}/${pass} PASS`);
