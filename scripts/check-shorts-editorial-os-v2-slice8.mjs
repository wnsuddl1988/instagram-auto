import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const root = resolve(process.cwd());
const baseline = JSON.parse(readFileSync(resolve(root, "_ai/SHORTS_EDITORIAL_OS_V2_SLICE_8_BASELINE.json"), "utf8"));
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
check("manifest HEAD", baseline.git.head === "9a29fd4d2fd3e828a45f31d0c0ee2332465b4a62");
check("manifest parent exact forty chars", baseline.git.parent === "5e0e0e044b3ebea6af07b98e733a3eac6a96aa2c" && baseline.git.parent.length === 40);
check("manifest upstream ahead", baseline.git.upstream.ahead === 8);
check("manifest upstream behind", baseline.git.upstream.behind === 0);
check("manifest modified", baseline.git.modifiedCount === 21);
check("manifest untracked", baseline.git.untrackedCount === 3);
check("manifest staged", baseline.git.stagedCount === 0);
check("manifest status paths", baseline.git.statusPathCount === 24);
check("protected status entries", baseline.statusPaths.length === 24);
check("exact allowlist 17", baseline.slice8ExactAllowlist.length === 17);
check("new allowlist 12", baseline.slice8NewFileAllowlist.length === 12);
check("modified allowlist 5", baseline.slice8ModifiedFileAllowlist.length === 5);
check("allowlist unique", new Set(baseline.slice8ExactAllowlist).size === 17);
check("protection exceptions exact", JSON.stringify(baseline.protectionExceptions) === JSON.stringify(["_ai/PROJECT_STATE.md", "_ai/NEXT_ACTION.md"]));
check("current HEAD unchanged", git(["rev-parse", "HEAD"]) === baseline.git.head);
check("current parent unchanged", git(["show", "-s", "--format=%P", "HEAD"]) === baseline.git.parent);
check("current ahead eight", Number(git(["rev-list", "--count", "@{upstream}..HEAD"])) === 8);
check("current behind zero", Number(git(["rev-list", "--count", "HEAD..@{upstream}"])) === 0);

const porcelain = git(["status", "--porcelain=v1", "-z"], true);
const statusEntries = porcelain.split("\0").filter(Boolean).map((entry) => ({ status: entry.slice(0, 2), path: entry.slice(3).replaceAll("\\", "/") }));
const expectedStatusPaths = new Set([...baseline.statusPaths.map((entry) => entry.path), ...baseline.slice8ExactAllowlist]);
const actualStatusPaths = new Set(statusEntries.map((entry) => entry.path));
check("working status exact 41", statusEntries.length === 41, String(statusEntries.length));
check("working modified exact 26", statusEntries.filter((entry) => entry.status === " M").length === 26);
check("working untracked exact 15", statusEntries.filter((entry) => entry.status === "??").length === 15);
check("working staged zero", statusEntries.every((entry) => entry.status[0] === " " || entry.status === "??"));
check("working rename zero", statusEntries.every((entry) => !entry.status.includes("R")));
check("working delete zero", statusEntries.every((entry) => !entry.status.includes("D")));
check("status path set exact", actualStatusPaths.size === expectedStatusPaths.size && [...actualStatusPaths].every((path) => expectedStatusPaths.has(path)));
for (const path of baseline.slice8NewFileAllowlist) check(`new file untracked ${path}`, statusEntries.some((entry) => entry.path === path && entry.status === "??"));
for (const path of baseline.slice8ModifiedFileAllowlist) check(`modified file unstaged ${path}`, statusEntries.some((entry) => entry.path === path && entry.status === " M"));
for (const entry of baseline.statusPaths) {
  check(`protected status ${entry.path}`, statusEntries.some((candidate) => candidate.path === entry.path && candidate.status === entry.status));
  check(`protected hash ${entry.path}`, sha256(entry.path) === entry.sha256);
}
for (const entry of [...baseline.governanceCriticalPaths, ...baseline.checkpointCriticalPaths]) {
  if (baseline.slice8ModifiedFileAllowlist.includes(entry.path)) continue;
  check(`critical file exists ${entry.path}`, existsSync(resolve(root, entry.path)));
  check(`critical hash ${entry.path}`, sha256(entry.path) === entry.sha256);
}
check("middleware absent", !existsSync(resolve(root, "middleware.ts")) && !existsSync(resolve(root, "src/middleware.ts")));
check("git diff check", spawnSync("git", ["diff", "--check"], { cwd: root, encoding: "utf8", windowsHide: true }).status === 0);

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
checkForbiddenTokens("contracts", contracts, [" any;", ": any", "<any>", "readonly?:", "// @ts-ignore", "// @ts-expect-error"]);
const artifactBlock = contracts.match(/EDITORIAL_V2_ARTIFACT_KINDS\s*=\s*\[([\s\S]*?)\]\s*as const/u)?.[1] ?? "";
const qualityBlock = contracts.match(/EDITORIAL_V2_QUALITY_GATES\s*=\s*\[([\s\S]*?)\]\s*as const/u)?.[1] ?? "";
const sceneCardBlock = contracts.match(/export interface SceneCard \{([\s\S]*?)\n\}/u)?.[1] ?? "";
check("artifact kind remains 12", (artifactBlock.match(/"[^"]+"/gu) ?? []).length === 12);
check("quality gate remains 11", (qualityBlock.match(/"[^"]+"/gu) ?? []).length === 11);
check("SceneCard remains 15 fields", (sceneCardBlock.match(/^  readonly /gmu) ?? []).length === 15);

checkTokens("Slice 8 contract types", contracts, [
  "ApprovedPublishIntegrationSessionSnapshot", "RepresentativeSampleStatus", "RepresentativeSampleLevel", "RepresentativeSampleScene", "RepresentativeSampleStoryboard",
  "RepresentativeSamplePackage", "RepresentativeSampleRenderProfile", "RepresentativeSampleRenderProof", "RepresentativeSampleReferenceRegistry", "RepresentativeSampleProvenanceChecks", "RepresentativeSampleValidationIssue", "RepresentativeSampleValidationSummary",
  "RelaunchDirectionId", "RelaunchDirectionDefinition", "ProvisionalChannelIdentityDraft", "ChannelHandleCandidate", "ChannelDescriptionPackage", "ChannelSourceDisclosureStandard",
  "ChannelFinancialSafetyStandard", "ProfileAssetDraft", "CoverAssetDraft", "PinnedRelaunchPostDraft", "RelaunchAssetPlan", "RelaunchValidationIssue",
  "RelaunchValidationSummary", "LaunchReadinessCategory", "LaunchReadinessChecklistItem", "LaunchReadinessSummary", "RelaunchApprovalState",
  "ApprovedRelaunchReadinessSessionSnapshot", "Slice8SessionState",
]);
checkTokens("Slice 8 contract boundaries", contracts, [
  "synthetic_local_proof_ready", "user_content_production_blocked", "public_launch_blocked", "REPRESENTATIVE_SAMPLE_PRECHECK_ONLY",
  "syntheticOnly: true", "productionReady: false", "publicLaunchReady: false", "provisionalOnly: true", "finalOwnerApprovalRequired: true",
  "finalBrandApproved: false", "finalHandleAvailabilityVerified: false", "actualAccountChanged: false", "actualProductionAsset: false",
  "currentPlatformLimitsVerified: false", "performanceClaimsIncluded: false", "actualAssetsCreated: false", "controlTowerFinalApprovalRequired: true",
  "publicLaunchApproved: false", "sessionOnly: true",
]);
checkTokens("Slice 8 publish snapshot callback contract", contracts, [
  "sourceRenderIntegrationSnapshot", "sourceRenderIntegrationIdentity", "sceneFingerprints", "selectedCharacterDirectionId", "platformPackages",
  "publishMetadata", "sourceDisclosures", "destinationIdentityPlan", "dedupeKeys",
]);

const moduleExpectations = new Map([
  ["lib/editorial-v2/representative-sample.ts", ["export function buildRepresentativeSamplePackage", "export function buildRepresentativeStoryboard", "export function cloneRepresentativeSamplePackage", "export function hashRepresentativeSamplePackage", "export function validateRepresentativeSamplePackage", "scenes.length !== 8", "actual_visual_asset:not_created", "detailed_script_beat:missing", "representative_provenance_mismatch", "representative_unsupported_evidence_ref", "representative_unsupported_source_ref", "representative_unsupported_number_ref", "upstreamExecutionFlagsClear", "executionRequested: false", "externalRequestsMade: false", "userContentIncluded: false", "actualAssetsIncluded: false", "actualRenderExecuted: false", "productionReady: false", "publicLaunchReady: false"]],
  ["lib/editorial-v2/sample-readiness.ts", ["export function validateRepresentativeSampleReadiness", "export function summarizeRepresentativeSampleReadiness", "export function canApproveRepresentativeSample", "validateRepresentativeSamplePackage", "representative_upstream_provenance_missing", "representative_character_primary_only", "representative_subtitle_plan_missing", "representative_publish_metadata_missing", "representative_public_ready_false_claim", "REPRESENTATIVE_SAMPLE_PRECHECK_ONLY"]],
  ["lib/editorial-v2/relaunch-package.ts", ["export function buildRelaunchDirectionCandidates", "export function createProvisionalChannelIdentityDraft", "export function buildChannelDescriptionPackage", "export function buildPinnedRelaunchPostDraft", "export function buildRelaunchAssetPlan", "export function cloneRelaunchPackage", "Evidence Signal Lab", "Everyday Economy Lens", "Hidden Connection Brief", "provisionalOnly: true", "finalOwnerApprovalRequired: true", "performanceClaimsIncluded: false", "actualProductionAsset: false"]],
  ["lib/editorial-v2/relaunch-validation.ts", ["export function validateProvisionalChannelIdentity", "export function validateRelaunchAssetPlan", "export function summarizeRelaunchValidation", "export function canApproveRelaunchReadiness", "relaunch_money_os_confusion", "relaunch_financial_guarantee", "relaunch_specific_security_trade_confusion", "relaunch_source_standard_missing", "relaunch_financial_safety_standard_missing", "relaunch_actual_asset_false_claim", "relaunch_control_tower_approval_bypassed"]],
  ["lib/editorial-v2/launch-checklist.ts", ["export function buildLaunchReadinessChecklist", "export function summarizeLaunchReadiness", "export function canRequestProductionActivation", "brand-final-direction", "brand-final-channel-name", "account-handle-availability", "account-identity-verification", "account-oauth", "voice-actual-audio", "assets-actual-visuals", "character-production-export", "render-user-content", "render-subtitle-audio-alignment", "persistence-durable-store", "persistence-publication-ledger", "publishing-platform-policy", "publishing-actual-verification", "operations-rollback-runbook", "rights-final-review", "cost-final-approval", "publicLaunchReady: false"]],
]);
for (const [path, tokens] of moduleExpectations) checkTokens(path, readRepo(path), tokens);

const safePaths = [
  ...moduleExpectations.keys(),
  "components/editorial-v2/RelaunchSvgPreview.tsx",
  "components/editorial-v2/SampleRelaunchWorkbench.tsx",
  "components/editorial-v2/EditorialV2Workbench.tsx",
  "components/editorial-v2/PublishIntegrationWorkbench.tsx",
];
for (const path of safePaths) {
  const source = readRepo(path);
  check(`${path} no network`, !/\bfetch\s*\(|XMLHttpRequest|WebSocket|EventSource|axios\./u.test(source));
  check(`${path} no env`, !/process\.env|import\.meta\.env/u.test(source));
  check(`${path} no persistence`, !/localStorage|sessionStorage|indexedDB/u.test(source));
  check(`${path} no server route`, !/NextRequest|NextResponse|route\.ts|server action/u.test(source));
  check(`${path} no node fs`, !/from ["']node:(?:fs|fs\/promises)["']/u.test(source));
  check(`${path} no process spawn`, !/spawnSync|execSync|execFile|child_process/u.test(source));
  check(`${path} no V1 import`, !/from ["'][^"']*(?:money-shorts|finance-|flow-|owner-web|veo-)/u.test(source));
  check(`${path} no clock randomness`, !/Date\.now|Math\.random|randomUUID/u.test(source));
  check(`${path} no dangerous HTML`, !/dangerouslySetInnerHTML/u.test(source));
  check(`${path} no external URL`, !/https?:\/\//u.test(source));
}

const publishUi = readRepo("components/editorial-v2/PublishIntegrationWorkbench.tsx");
checkTokens("Publish callback enrichment", publishUi, ["cloneApprovedRenderIntegrationSnapshot", "sourceRenderIntegrationSnapshot", "sourceRenderIntegrationIdentity", "sceneFingerprints", "selectedCharacterDirectionId", "platformPackages", "publishMetadata", "sourceDisclosures", "destinationIdentityPlan", "dedupeKeys", "onApprovedPublishIntegrationChange(null)"]);
const editorialUi = readRepo("components/editorial-v2/EditorialV2Workbench.tsx");
checkTokens("Slice 8 orchestration", editorialUi, ["ApprovedRelaunchReadinessSessionSnapshot", "SampleRelaunchWorkbench", "approvedPublishSnapshot", "approvedRelaunchSnapshot", "setApprovedRelaunchSnapshot(null)", "handleApprovedPublishChange", "sampleRelaunchKey", "Representative Sample · Relaunch session-only 연결", "Production Activation", "ChatGPT Control Tower"]);
const sampleUi = readRepo("components/editorial-v2/SampleRelaunchWorkbench.tsx");
checkTokens("Sample UI eight steps", sampleUi, ["End-to-end Summary", "Representative Storyboard", "Relaunch Directions", "Channel Identity Draft", "Asset Preview", "Pinned Relaunch Post", "Launch Readiness", "Provisional Approval"]);
checkTokens("Sample UI safety", sampleUi, ["Synthetic local proof", "실제 production video", "production-ready 아님", "provisional-only", "availability 미검증", "실제 logo/profile/cover production asset 아님", "성과 주장 없음", "publicLaunchReady=false", "ChatGPT Control Tower", "실제 TTS·asset·production render·account/OAuth·persistence·publish"]);
checkForbiddenTokens("Sample UI", sampleUi, ["fetch(", "localStorage", "indexedDB", "dangerouslySetInnerHTML", 'type="file"', "OAuth 연결", "실제 게시", "upload button"]);
const svgUi = readRepo("components/editorial-v2/RelaunchSvgPreview.tsx");
checkTokens("SVG previews", svgUi, ["Square profile concept preview only", "Vertical cover title card preview only", "YouTube banner safe concept preview only", "Pinned relaunch post cover preview only", "SafeGuide", "SignalMark", "PROVISIONAL", "NOT A PRODUCTION ASSET", "FINAL BRAND NOT APPROVED"]);
checkForbiddenTokens("SVG preview", svgUi, ["<image", "href=", "xlinkHref", "dangerouslySetInnerHTML", "url(", "@font-face", "logo.svg", "money face"]);
const css = readRepo("components/editorial-v2/SampleRelaunchWorkbench.module.css");
checkTokens("Slice 8 CSS", css, [".shell", ".hero", ".step", ".summaryGrid", ".sceneGrid", ".sceneCard", ".directionGrid", '[data-selected="true"]', ".formGrid", ".tableWrap", "overflow-x: auto", '[data-blocking="true"]', ".issueList", ".actions", "@media (max-width: 820px)"]);

const gaps = readRepo("_ai/SHORTS_EDITORIAL_OS_V2_PRODUCTION_ACTIVATION_GAPS.md");
for (const heading of [
  "## 1. 현재 구현된 기능", "## 2. Session-only 기능", "## 3. Synthetic proof만 완료된 기능", "## 4. 실제 외부 연결이 필요한 기능",
  "## 5. 실제 계정·OAuth 요구", "## 6. 실제 TTS·audio 요구", "## 7. 실제 visual asset 요구", "## 8. Renderer production adapter 요구",
  "## 9. Durable persistence 요구", "## 10. Publication ledger 요구", "## 11. Runtime browser QA 요구", "## 12. 권리·비용·정책 확인",
  "## 13. V1/V2 cutover 조건", "## 14. V1 rollback 조건", "## 15. Public launch 이전 필수 Owner approvals", "## 16. 권장 Production Activation 단계",
  "## 17. 현재 product operational capability",
]) check(`gaps document heading ${heading}`, gaps.includes(heading));
checkTokens("gaps document honesty", gaps, ["product operational capability = NOT_CLAIMED", "publicLaunchReady=false", "Session objects are not durable operational records", "synthetic MP4 is not a user-content", "No automatic publication", "V1 remains the operational path"]);

const probe = readRepo("scripts/probe-shorts-editorial-os-v2-slice8-sample.mjs");
checkTokens("probe requirements", probe, ["SHORTS_EDITORIAL_OS_V2_SLICE8_SYNTHETIC_REPRESENTATIVE_SAMPLE_PASS", "ffmpeg", "ffprobe", "mkdtempSync", "tmpdir", "shorts-editorial-v2-slice8-", "SCENE_COUNT = 8", "WIDTH = 1080", "HEIGHT = 1920", "FPS = 30", "SCENE_SECONDS = 3", "buildScenePpm", "evidenceCard", "numberBar", "lineGraph", "characterMarker", "buildSrt", "synthetic-tone", "videoStreamPresent", "audioStreamPresent", "subtitleStreamPresent", "outputSha256", "publicReady: false", "syntheticOnly: true", "temporaryDirectoryRemoved", "repositoryStatusUnchanged", "repository status changed"]);
checkForbiddenTokens("probe", probe, ["fetch(", "http://", "https://", "node:https", "node:http", "process.env", "OAuth", "actual user content", "logo.png", "fontfile="]);
check("probe writes only after temp creation", probe.indexOf("temporaryDirectory = mkdtempSync") < probe.indexOf("writeFileSync(join(temporaryDirectory"));
check("probe cleanup in finally", probe.indexOf("finally") < probe.indexOf("rmSync(temporaryDirectory"));

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
const representativeModule = loadTs("lib/editorial-v2/representative-sample.ts");
const sampleReadinessModule = loadTs("lib/editorial-v2/sample-readiness.ts");
const relaunchModule = loadTs("lib/editorial-v2/relaunch-package.ts");
const relaunchValidationModule = loadTs("lib/editorial-v2/relaunch-validation.ts");
const checklistModule = loadTs("lib/editorial-v2/launch-checklist.ts");

function buildApprovedPublishSnapshot() {
  const fixture = fixtureModule.buildSyntheticPublishFixture();
  const baseRender = fixture.approvedRenderIntegration;
  const beatTypes = ["anomaly_or_problem", "common_interpretation_crack", "evidence_and_number", "hidden_cause_or_connection", "audience_life_impact", "misread_correction", "practical_check_or_action", "next_signal_to_watch"];
  const numberRecord = { numberId: "synthetic-number-01", signalId: "synthetic-signal-01", value: 100, unit: "index", currency: null, asOf: "2026-08-06", context: "synthetic structural number", sourceRefs: ["synthetic-source-01"] };
  const beats = beatTypes.map((beatType, index) => ({ ...baseRender.sourceDetailedScriptSnapshot.approvedScript.beats[0], beatId: `synthetic-beat-${index + 1}`, beatType, narration: `Synthetic evidence narration ${index + 1}`, keyCaption: `SOURCE FIRST ${index + 1}`, numberRefs: [numberRecord.numberId] }));
  const sourceDetailedScriptSnapshot = {
    ...baseRender.sourceDetailedScriptSnapshot,
    approvedScript: { ...baseRender.sourceDetailedScriptSnapshot.approvedScript, beats },
    evidencePack: {
      ...baseRender.sourceDetailedScriptSnapshot.evidencePack,
      claims: baseRender.sourceDetailedScriptSnapshot.evidencePack.claims.map((claim) => ({ ...claim, numberRefs: [numberRecord.numberId] })),
      numbers: [numberRecord],
      coverage: { ...baseRender.sourceDetailedScriptSnapshot.evidencePack.coverage, numberCount: 1, signalCoverage: baseRender.sourceDetailedScriptSnapshot.evidencePack.coverage.signalCoverage.map((entry) => ({ ...entry, numberCount: 1 })) },
    },
    selectedAngle: { ...baseRender.sourceDetailedScriptSnapshot.selectedAngle, numberRefs: [numberRecord.numberId] },
  };
  const voiceScenes = beats.map((beat, index) => ({ ...baseRender.voicePlan.scenes[0], sceneId: `synthetic-scene-${index + 1}`, sceneOrder: index + 1, narration: beat.narration }));
  const cues = beats.map((beat, index) => ({ ...baseRender.subtitleTrack.cues[0], cueId: `synthetic-cue-${index + 1}`, sceneId: `synthetic-scene-${index + 1}`, sceneOrder: index + 1, text: beat.keyCaption, startSeconds: index * 3, endSeconds: index * 3 + 3 }));
  const subtitleScenes = beats.map((beat, index) => ({ ...baseRender.subtitleTrack.scenePlans[0], sceneId: `synthetic-scene-${index + 1}`, sceneOrder: index + 1, narration: beat.narration, keyCaption: beat.keyCaption, startSeconds: index * 3, endSeconds: index * 3 + 3, cues: [cues[index]] }));
  const renderScenes = beats.map((beat, index) => ({
    ...baseRender.renderManifest.scenes[0],
    sceneId: `synthetic-scene-${index + 1}`,
    sceneOrder: index + 1,
    durationSeconds: 3,
    narration: beat.narration,
    keyCaption: beat.keyCaption,
    numberRefs: [numberRecord.numberId],
    subtitleCueIds: [cues[index].cueId],
    fingerprint: { ...baseRender.renderManifest.scenes[0].fingerprint, sceneId: `synthetic-scene-${index + 1}`, fingerprint: `synthetic-fingerprint-${index + 1}` },
  }));
  const voicePlan = { ...baseRender.voicePlan, scenes: voiceScenes, usage: { ...baseRender.voicePlan.usage, totalEstimatedDurationSeconds: 24 } };
  const subtitleTrack = { ...baseRender.subtitleTrack, targetDurationSeconds: 24, scenePlans: subtitleScenes, cues };
  const renderManifest = { ...baseRender.renderManifest, voicePlan, subtitleTrack, scenes: renderScenes, enabledSceneCount: 8, totalDurationSeconds: 24, manifestHash: "synthetic-render-manifest-hash-slice8" };
  const sourceRenderIntegrationSnapshot = { ...baseRender, sourceDetailedScriptSnapshot, voicePlan, subtitleTrack, renderManifest, bridgePlan: { ...baseRender.bridgePlan, manifestHash: renderManifest.manifestHash, sceneLogicalUris: renderScenes.map((scene) => `asset://${scene.sceneId}`) } };
  const publishPackage = { ...fixture.publishPackage, renderManifestHash: renderManifest.manifestHash };
  return {
    publishPackage,
    validation: { valid: true, blockingIssueCount: 0, warningCount: 0, verificationLevel: "PUBLISH_INTEGRATION_PRECHECK_ONLY", executionEligible: false, issues: [] },
    bridgePlan: { packageId: publishPackage.packageId, executionReady: false },
    ledger: fixture.emptyLedger,
    recoveryPlan: { actualRetryExecuted: false },
    approvalState: "approved",
    sessionOnly: true,
    externalIdentityVerified: false,
    uploadExecuted: false,
    publicationExecuted: false,
    schedulingExecuted: false,
    durableLedgerAvailable: false,
    executionReady: false,
    sourceRenderIntegrationSnapshot,
    sourceRenderIntegrationIdentity: `${renderManifest.sourcePlanningIdentity}:${renderManifest.manifestHash}`,
    sceneFingerprints: renderScenes.map((scene) => ({ ...scene.fingerprint })),
    selectedCharacterDirectionId: sourceRenderIntegrationSnapshot.sourceCharacterSnapshot.selectedDirectionId,
    platformPackages: publishPackage.platformPackages.map((entry) => ({ ...entry })),
    publishMetadata: publishPackage.platformPackages.map((entry) => ({ ...entry.metadata })),
    sourceDisclosures: publishPackage.platformPackages.map((entry) => ({ ...entry.metadata.sourceDisclosure })),
    destinationIdentityPlan: publishPackage.platformPackages.map((entry) => ({ ...entry.expectedDestinationIdentity })),
    dedupeKeys: publishPackage.platformPackages.map((entry) => ({ ...entry.dedupeKey })),
  };
}

const approvedA = buildApprovedPublishSnapshot();
const approvedBefore = JSON.stringify(approvedA);
const sampleA = representativeModule.buildRepresentativeSamplePackage(approvedA);
const sampleB = representativeModule.buildRepresentativeSamplePackage(buildApprovedPublishSnapshot());
check("representative input mutation zero", JSON.stringify(approvedA) === approvedBefore);
check("representative deterministic deep equal", JSON.stringify(sampleA) === JSON.stringify(sampleB));
check("representative package references isolated", sampleA !== sampleB && sampleA.storyboard !== sampleB.storyboard && sampleA.storyboard.scenes !== sampleB.storyboard.scenes);
check("representative package id stable", sampleA.packageId === sampleB.packageId);
check("representative hash stable", representativeModule.hashRepresentativeSamplePackage(sampleA) === representativeModule.hashRepresentativeSamplePackage(sampleB));
check("representative exactly eight scenes", sampleA.storyboard.scenes.length === 8 && sampleA.storyboard.sceneCount === 8);
check("representative order exact", sampleA.storyboard.scenes.every((scene, index) => scene.sceneOrder === index + 1));
check("representative beat types cover eight", new Set(sampleA.storyboard.scenes.map((scene) => scene.beatType)).size === 8);
check("representative evidence refs every scene", sampleA.storyboard.scenes.every((scene) => scene.evidenceRefs.length > 0));
check("representative source refs every scene", sampleA.storyboard.scenes.every((scene) => scene.sourceRefs.length > 0));
check("representative number refs every scene", sampleA.storyboard.scenes.every((scene) => scene.numberRefs.length > 0));
check("representative actual asset false every scene", sampleA.storyboard.scenes.every((scene) => scene.actualAssetAvailable === false));
check("representative production false every scene", sampleA.storyboard.scenes.every((scene) => scene.productionReady === false));
check("representative safe area every scene", sampleA.storyboard.scenes.every((scene) => scene.safeAreaState === "structural_precheck_pass"));
check("representative subtitle every scene", sampleA.storyboard.scenes.every((scene) => scene.subtitleCueSummary.includes("estimated_not_audio_aligned")));
check("representative render profile", sampleA.renderProfile.width === 1080 && sampleA.renderProfile.height === 1920 && sampleA.renderProfile.framesPerSecond === 30 && sampleA.renderProfile.targetDurationSeconds === 24);
check("representative status separated", sampleA.status === "synthetic_local_proof_ready" && sampleA.productionStatus === "user_content_production_blocked" && sampleA.launchStatus === "public_launch_blocked");
check("representative execution flags false", [sampleA.executionRequested, sampleA.externalRequestsMade, sampleA.userContentIncluded, sampleA.actualAssetsIncluded, sampleA.actualRenderExecuted, sampleA.productionReady, sampleA.publicLaunchReady].every((value) => value === false));
check("representative provenance complete", Object.values(sampleA.provenance).every((value) => Array.isArray(value) ? value.length > 0 : String(value).length > 0));
check("representative provenance checks all true", Object.values(sampleA.provenanceChecks).every((value) => value === true));
check("representative reference registry complete", sampleA.referenceRegistry.evidenceRefs.length === 2 && sampleA.referenceRegistry.sourceRefs.length === 1 && sampleA.referenceRegistry.numberRefs.length === 1);
check("representative refs supported", sampleA.storyboard.scenes.every((scene) => scene.evidenceRefs.every((reference) => sampleA.referenceRegistry.evidenceRefs.includes(reference)) && scene.sourceRefs.every((reference) => sampleA.referenceRegistry.sourceRefs.includes(reference)) && scene.numberRefs.every((reference) => sampleA.referenceRegistry.numberRefs.includes(reference))));
const sampleClone = representativeModule.cloneRepresentativeSamplePackage(sampleA);
sampleClone.storyboard.scenes[0].sourceRefs.push("clone-only");
check("representative deep clone source refs", !sampleA.storyboard.scenes[0].sourceRefs.includes("clone-only"));
check("representative clone nested isolated", sampleClone.provenance.platformPackageIdentities !== sampleA.provenance.platformPackageIdentities && sampleClone.storyboard.scenes[0].unresolvedAssets !== sampleA.storyboard.scenes[0].unresolvedAssets);

const sampleIssues = sampleReadinessModule.validateRepresentativeSampleReadiness(sampleA);
const sampleSummary = sampleReadinessModule.summarizeRepresentativeSampleReadiness(sampleIssues);
check("valid sample blocking zero", sampleSummary.blockingIssueCount === 0, JSON.stringify(sampleIssues.filter((issue) => issue.blocking)));
check("valid sample warnings present", sampleSummary.warningCount >= 8);
check("valid sample approvable", sampleReadinessModule.canApproveRepresentativeSample(sampleSummary));
check("valid sample public false", sampleSummary.publicLaunchReady === false);
const sampleAdversaries = [
  ["representative_scene_count_mismatch", { ...sampleA, storyboard: { ...sampleA.storyboard, scenes: sampleA.storyboard.scenes.slice(0, 7) } }],
  ["representative_evidence_refs_missing", { ...sampleA, storyboard: { ...sampleA.storyboard, scenes: sampleA.storyboard.scenes.map((scene, index) => index === 0 ? { ...scene, evidenceRefs: [] } : scene) } }],
  ["representative_source_refs_missing", { ...sampleA, storyboard: { ...sampleA.storyboard, scenes: sampleA.storyboard.scenes.map((scene, index) => index === 0 ? { ...scene, sourceRefs: [] } : scene) } }],
  ["representative_number_refs_missing", { ...sampleA, storyboard: { ...sampleA.storyboard, scenes: sampleA.storyboard.scenes.map((scene, index) => index === 0 ? { ...scene, numberRefs: [] } : scene) } }],
  ["representative_rights_unresolved", { ...sampleA, storyboard: { ...sampleA.storyboard, scenes: sampleA.storyboard.scenes.map((scene, index) => index === 0 ? { ...scene, rightsState: "pending_manual_review" } : scene) } }],
  ["representative_safe_area_blocked", { ...sampleA, storyboard: { ...sampleA.storyboard, scenes: sampleA.storyboard.scenes.map((scene, index) => index === 0 ? { ...scene, safeAreaState: "structural_precheck_blocked" } : scene) } }],
  ["representative_character_primary_only", { ...sampleA, storyboard: { ...sampleA.storyboard, scenes: sampleA.storyboard.scenes.map((scene, index) => index === 0 ? { ...scene, primaryVisualStrategy: "character_motion" } : scene) } }],
  ["representative_subtitle_plan_missing", { ...sampleA, storyboard: { ...sampleA.storyboard, scenes: sampleA.storyboard.scenes.map((scene, index) => index === 0 ? { ...scene, subtitleCueSummary: "missing subtitle plan" } : scene) } }],
  ["representative_publish_metadata_missing", { ...sampleA, publishMetadataPresent: false }],
  ["representative_public_ready_false_claim", { ...sampleA, publicLaunchReady: true }],
  ["representative_unsupported_evidence_ref", { ...sampleA, storyboard: { ...sampleA.storyboard, scenes: sampleA.storyboard.scenes.map((scene, index) => index === 0 ? { ...scene, evidenceRefs: ["unsupported-evidence"] } : scene) } }],
  ["representative_unsupported_source_ref", { ...sampleA, storyboard: { ...sampleA.storyboard, scenes: sampleA.storyboard.scenes.map((scene, index) => index === 0 ? { ...scene, sourceRefs: ["unsupported-source"] } : scene) } }],
  ["representative_unsupported_number_ref", { ...sampleA, storyboard: { ...sampleA.storyboard, scenes: sampleA.storyboard.scenes.map((scene, index) => index === 0 ? { ...scene, numberRefs: ["unsupported-number"] } : scene) } }],
  ["representative_provenance_mismatch", { ...sampleA, provenanceChecks: { ...sampleA.provenanceChecks, renderManifestMatchesPublishPackage: false } }],
];
for (const [code, candidate] of sampleAdversaries) check(`sample adversary ${code}`, sampleReadinessModule.validateRepresentativeSampleReadiness(candidate).some((issue) => issue.code === code && issue.blocking));
const executionFlagSample = representativeModule.buildRepresentativeSamplePackage({ ...buildApprovedPublishSnapshot(), uploadExecuted: true });
check("upstream execution flag true blocked", sampleReadinessModule.validateRepresentativeSampleReadiness(executionFlagSample).some((issue) => issue.code === "representative_provenance_mismatch" && issue.blocking));

const directions = relaunchModule.buildRelaunchDirectionCandidates({ primaryAudience: "생활경제 시청자", sourceFirstRequired: true });
check("directions exactly three", directions.length === 3);
check("direction IDs exact", JSON.stringify(directions.map((entry) => entry.directionId)) === JSON.stringify(["evidence_signal_lab", "everyday_economy_lens", "hidden_connection_brief"]));
check("direction labels exact", JSON.stringify(directions.map((entry) => entry.temporaryDirectionLabel)) === JSON.stringify(["Evidence Signal Lab", "Everyday Economy Lens", "Hidden Connection Brief"]));
check("directions provisional", directions.every((entry) => entry.provisionalOnly && entry.finalOwnerApprovalRequired));
check("directions distinct emphasis", new Set(directions.map((entry) => entry.editorialEmphasis.join("|"))).size === 3);
check("directions no performance claims", directions.every((entry) => !/구독자|조회수|성과\s*보장/u.test(JSON.stringify(entry))));
const identityInput = { channelDisplayNameCandidate: "Source Signal Brief", handleCandidates: [{ handle: "source_signal_brief", platformIntent: "cross_platform" }], oneLinePromise: "출처와 기준일을 먼저 확인하는 생활경제 브리핑", primaryAudience: "생활경제 시청자", preferredDirection: directions[0].temporaryDirectionLabel, prohibitedWords: ["수익 보장", "성공 보장"], optionalTagline: "Facts before forecasts" };
const draft = relaunchModule.createProvisionalChannelIdentityDraft(directions[0], identityInput);
const sourceStandard = relaunchModule.buildDefaultChannelSourceDisclosureStandard();
const descriptions = relaunchModule.buildChannelDescriptionPackage(draft, sourceStandard);
const pinnedPost = relaunchModule.buildPinnedRelaunchPostDraft(draft);
const assetPlan = relaunchModule.buildRelaunchAssetPlan(draft, "loop_signal_navigator");
const relaunchPackage = relaunchModule.buildRelaunchPackage(directions, directions[0].directionId, draft, descriptions, pinnedPost, assetPlan);
const relaunchPackageTwin = relaunchModule.buildRelaunchPackage(directions, directions[0].directionId, relaunchModule.createProvisionalChannelIdentityDraft(directions[0], identityInput), relaunchModule.buildChannelDescriptionPackage(relaunchModule.createProvisionalChannelIdentityDraft(directions[0], identityInput), sourceStandard), relaunchModule.buildPinnedRelaunchPostDraft(relaunchModule.createProvisionalChannelIdentityDraft(directions[0], identityInput)), relaunchModule.buildRelaunchAssetPlan(relaunchModule.createProvisionalChannelIdentityDraft(directions[0], identityInput), "loop_signal_navigator"));
check("relaunch deterministic", JSON.stringify(relaunchPackage) === JSON.stringify(relaunchPackageTwin));
check("relaunch package ID deterministic", relaunchPackage.packageId === relaunchPackageTwin.packageId);
check("draft provisional flags", draft.provisionalOnly && !draft.finalBrandApproved && !draft.finalHandleAvailabilityVerified && !draft.actualAccountChanged && draft.finalOwnerApprovalRequired);
check("handles never verified", draft.handleCandidates.every((entry) => !entry.availabilityVerified && entry.provisionalOnly));
check("descriptions source standard", descriptions.sourceStandard.requiresSourceAndAsOfDate && !descriptions.sourceStandard.sourceExistenceExternallyVerified);
check("descriptions financial standard", !descriptions.financialSafetyStandard.investmentAdviceProvided && !descriptions.financialSafetyStandard.returnGuaranteesAllowed && !descriptions.financialSafetyStandard.specificSecurityRecommendationsAllowed);
check("descriptions no performance claims", descriptions.performanceClaimsIncluded === false);
check("descriptions platform limits unverified", descriptions.currentPlatformLimitsVerified === false);
check("pinned post safe", pinnedPost.performanceClaimsIncluded === false && pinnedPost.publicPostCreated === false && pinnedPost.provisionalOnly === true);
check("assets preview only", !assetPlan.actualAssetsCreated && assetPlan.profile.inlineSvgPreviewOnly && !assetPlan.profile.actualProductionAsset && !assetPlan.profile.thirdPartyAssetsUsed);
check("covers preview only", [assetPlan.verticalCover, assetPlan.youtubeBanner, assetPlan.pinnedPostCover].every((entry) => entry.inlineSvgPreviewOnly && !entry.actualProductionAsset && !entry.thirdPartyAssetsUsed && entry.safeAreaGuideRequired));
check("relaunch package public false", !relaunchPackage.publicLaunchReady && !relaunchPackage.finalBrandApproved && !relaunchPackage.actualAccountChanged && relaunchPackage.controlTowerFinalApprovalRequired);
const relaunchContext = { selectedDirection: directions[0], descriptions, allDirectionsReviewed: true, characterOriginalityStatePresent: true, rightsStateResolvedForPlanning: true, controlTowerFinalApprovalRequired: true };
const relaunchIssues = [...relaunchValidationModule.validateProvisionalChannelIdentity(draft, relaunchContext), ...relaunchValidationModule.validateRelaunchAssetPlan(assetPlan, draft)];
const relaunchSummary = relaunchValidationModule.summarizeRelaunchValidation(relaunchIssues);
check("valid relaunch blocking zero", relaunchSummary.blockingIssueCount === 0, JSON.stringify(relaunchIssues.filter((issue) => issue.blocking)));
check("valid relaunch warnings seven", relaunchSummary.warningCount >= 7);
check("valid relaunch approvable", relaunchValidationModule.canApproveRelaunchReadiness(relaunchSummary));
const identityAdversaries = [
  ["relaunch_channel_name_missing", { ...draft, channelDisplayNameCandidate: "" }, relaunchContext],
  ["relaunch_money_os_confusion", { ...draft, channelDisplayNameCandidate: "Money OS" }, relaunchContext],
  ["relaunch_financial_guarantee", { ...draft, oneLinePromise: "수익 보장 채널" }, relaunchContext],
  ["relaunch_specific_security_trade_confusion", { ...draft, oneLinePromise: "매수 신호 제공" }, relaunchContext],
  ["relaunch_final_brand_false_claim", { ...draft, finalBrandApproved: true }, relaunchContext],
  ["relaunch_handle_availability_false_claim", { ...draft, finalHandleAvailabilityVerified: true }, relaunchContext],
  ["relaunch_account_change_false_claim", { ...draft, actualAccountChanged: true }, relaunchContext],
  ["relaunch_control_tower_approval_bypassed", draft, { ...relaunchContext, controlTowerFinalApprovalRequired: false }],
  ["relaunch_source_standard_missing", draft, { ...relaunchContext, descriptions: { ...descriptions, sourceStandard: { ...descriptions.sourceStandard, shortStatement: "", fullStatement: "" } } }],
  ["relaunch_financial_safety_standard_missing", draft, { ...relaunchContext, descriptions: { ...descriptions, financialSafetyStandard: { ...descriptions.financialSafetyStandard, statement: "" } } }],
  ["relaunch_directions_not_all_reviewed", draft, { ...relaunchContext, allDirectionsReviewed: false }],
  ["relaunch_character_originality_missing", draft, { ...relaunchContext, characterOriginalityStatePresent: false }],
  ["relaunch_rights_state_unresolved", draft, { ...relaunchContext, rightsStateResolvedForPlanning: false }],
];
for (const [code, candidateDraft, context] of identityAdversaries) check(`relaunch adversary ${code}`, relaunchValidationModule.validateProvisionalChannelIdentity(candidateDraft, context).some((issue) => issue.code === code && issue.blocking));
check("asset actual profile blocked", relaunchValidationModule.validateRelaunchAssetPlan({ ...assetPlan, profile: { ...assetPlan.profile, actualProductionAsset: true } }, draft).some((issue) => issue.code === "relaunch_profile_actual_asset_false_claim" && issue.blocking));
check("asset actual cover blocked", relaunchValidationModule.validateRelaunchAssetPlan({ ...assetPlan, verticalCover: { ...assetPlan.verticalCover, actualProductionAsset: true } }, draft).some((issue) => issue.code === "relaunch_actual_asset_false_claim" && issue.blocking));
const relaunchClone = relaunchModule.cloneRelaunchPackage(relaunchPackage);
relaunchClone.identityDraft.handleCandidates.push({ handle: "clone-only", platformIntent: "cross_platform", availabilityVerified: false, provisionalOnly: true });
check("relaunch clone isolated", !relaunchPackage.identityDraft.handleCandidates.some((entry) => entry.handle === "clone-only"));

const checklist = checklistModule.buildLaunchReadinessChecklist({ representativeValidation: sampleSummary, relaunchValidation: relaunchSummary, selectedProvisionalDirection: true, allDirectionsReviewed: true, actualProductionGapsAcknowledged: true, controlTowerFinalApprovalAcknowledged: true });
const readiness = checklistModule.summarizeLaunchReadiness(checklist);
check("checklist twenty items", checklist.length === 20);
check("checklist thirteen categories", readiness.categoryCounts.length === 13 && readiness.categoryCounts.every((entry) => entry.total > 0));
check("checklist public launch false", readiness.publicLaunchReady === false);
check("checklist Production Activation request possible", checklistModule.canRequestProductionActivation(readiness));
check("checklist blockers remain", readiness.blockingCount >= 17);
for (const requiredId of ["brand-final-direction", "brand-final-channel-name", "account-handle-availability", "account-identity-verification", "account-oauth", "voice-actual-audio", "assets-actual-visuals", "character-production-export", "render-user-content", "render-subtitle-audio-alignment", "persistence-durable-store", "persistence-publication-ledger", "publishing-platform-policy", "publishing-actual-verification", "operations-rollback-runbook", "rights-final-review", "cost-final-approval"]) {
  const entry = checklist.find((candidate) => candidate.itemId === requiredId);
  check(`mandatory launch blocker ${requiredId}`, Boolean(entry?.blocking && entry.requiredAction.trim() && entry.evidence.length > 0));
}
const unacknowledgedChecklist = checklistModule.buildLaunchReadinessChecklist({ representativeValidation: sampleSummary, relaunchValidation: relaunchSummary, selectedProvisionalDirection: true, allDirectionsReviewed: true, actualProductionGapsAcknowledged: false, controlTowerFinalApprovalAcknowledged: false });
check("unacknowledged scope request blocked", !checklistModule.canRequestProductionActivation(checklistModule.summarizeLaunchReadiness(unacknowledgedChecklist)));
const blockedChecklist = checklistModule.buildLaunchReadinessChecklist({ representativeValidation: { ...sampleSummary, blockingIssueCount: 1, valid: false, approvable: false }, relaunchValidation: relaunchSummary, selectedProvisionalDirection: true, allDirectionsReviewed: true, actualProductionGapsAcknowledged: true, controlTowerFinalApprovalAcknowledged: true });
check("sample blocker prevents scope request", !checklistModule.canRequestProductionActivation(checklistModule.summarizeLaunchReadiness(blockedChecklist)));

const projectState = readRepo("_ai/PROJECT_STATE.md");
checkTokens("PROJECT_STATE Slice 8", projectState, ["Slice 0~7: `FINAL_PASS`", "Slice 8: `IMPLEMENTATION_COMPLETE_AWAITING_CROSS_REVIEW`", "Slice 8 Cross Review: `NOT_STARTED`", "representative sample: `SYNTHETIC_ONLY`", "user-content production sample: `NOT_IMPLEMENTED`", "relaunch identity: `PROVISIONAL_SESSION_ONLY`", "final brand: `NOT_APPROVED`", "actual account changes: `NOT_EXECUTED`", "external TTS: `NOT_CONNECTED`", "actual visual assets: `NOT_CREATED`", "production render: `NOT_IMPLEMENTED`", "OAuth: `NOT_CONNECTED`", "actual publish: `NOT_IMPLEMENTED`", "durable persistence: `NOT_IMPLEMENTED`", "product operational capability: `NOT_CLAIMED`", "Push: `NOT_AUTHORIZED`", "automatic continuation: `DISABLED`", "progress: `NOT_CALCULATED`"]);
const nextAction = readRepo("_ai/NEXT_ACTION.md");
checkTokens("NEXT_ACTION Slice 8", nextAction, ["Claude Code Slice 8 read-only Cross Review", "ChatGPT 중간 전달 불필요", "Claude 결과는 Codex에 전달", "P1 correction", "P0/BLOCKED/scope expansion", "Production Activation 자동 시작 금지", "feat(editorial-v2): checkpoint slice 8 relaunch readiness", "Push: `NOT_AUTHORIZED`"]);

const configPath = ts.findConfigFile(root, ts.sys.fileExists, "tsconfig.json");
check("tsconfig found", Boolean(configPath));
if (configPath) {
  const config = ts.readConfigFile(configPath, ts.sys.readFile);
  const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, dirname(configPath));
  const program = ts.createProgram(parsed.fileNames, { ...parsed.options, noEmit: true });
  const targetPaths = [
    "lib/editorial-v2/contracts.ts", "components/editorial-v2/EditorialV2Workbench.tsx", "components/editorial-v2/PublishIntegrationWorkbench.tsx",
    "lib/editorial-v2/representative-sample.ts", "lib/editorial-v2/sample-readiness.ts", "lib/editorial-v2/relaunch-package.ts", "lib/editorial-v2/relaunch-validation.ts", "lib/editorial-v2/launch-checklist.ts",
    "components/editorial-v2/RelaunchSvgPreview.tsx", "components/editorial-v2/SampleRelaunchWorkbench.tsx",
  ].map((path) => resolve(root, path));
  const targets = new Set(targetPaths);
  const syntactic = program.getSyntacticDiagnostics().filter((diagnostic) => !diagnostic.file || targets.has(resolve(diagnostic.file.fileName)));
  const semantic = program.getSemanticDiagnostics().filter((diagnostic) => !diagnostic.file || targets.has(resolve(diagnostic.file.fileName)));
  check("target syntactic diagnostics zero", syntactic.length === 0, syntactic.map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, " ")).join(" | "));
  check("target semantic diagnostics zero", semantic.length === 0, semantic.map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, " ")).join(" | "));
}

for (const path of baseline.slice8NewFileAllowlist) {
  check(`new file nonempty ${path}`, readRepo(path).trim().length > 0);
  check(`new file no trailing whitespace ${path}`, !readRepo(path).split(/\r?\n/u).some((line) => /[ \t]+$/u.test(line)));
}
check("minimum 420 independent checks", pass + fail + 1 >= 420, String(pass + fail + 1));

if (fail > 0) {
  console.error(`SHORTS_EDITORIAL_OS_V2_SLICE8_CHECK_FAIL ${pass}/${pass + fail} PASS`);
  process.exit(1);
}
console.log(`SHORTS_EDITORIAL_OS_V2_SLICE8_CHECK_PASS ${pass}/${pass} PASS`);
