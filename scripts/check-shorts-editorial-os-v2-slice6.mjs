import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const root = process.cwd();
const baselinePath = "_ai/SHORTS_EDITORIAL_OS_V2_SLICE_6_BASELINE.json";
const baseline = JSON.parse(readFileSync(resolve(root, baselinePath), "utf8"));
let pass = 0;
let fail = 0;

function check(label, condition, detail = "") {
  if (condition) {
    pass += 1;
    return;
  }
  fail += 1;
  console.error(`FAIL ${label}${detail ? ` :: ${detail}` : ""}`);
}

function readRepo(path) {
  return readFileSync(resolve(root, path), "utf8");
}

function sha256(path) {
  return createHash("sha256").update(readFileSync(resolve(root, path))).digest("hex");
}

function git(args) {
  const result = spawnSync("git", args, { cwd: root, encoding: "utf8", windowsHide: true, maxBuffer: 16 * 1024 * 1024 });
  if (result.status !== 0 || result.error) throw new Error(result.stderr || result.error?.message || `git ${args.join(" ")} failed`);
  return result.stdout.trim();
}

function gitRaw(args) {
  const result = spawnSync("git", args, { cwd: root, encoding: "utf8", windowsHide: true, maxBuffer: 16 * 1024 * 1024 });
  if (result.status !== 0 || result.error) throw new Error(result.stderr || result.error?.message || `git ${args.join(" ")} failed`);
  return result.stdout;
}

function checkTokens(label, source, tokens) {
  for (const token of tokens) check(`${label}: ${token}`, source.includes(token));
}

function checkForbiddenTokens(label, source, tokens) {
  for (const token of tokens) check(`${label} excludes ${token}`, !source.includes(token));
}

check("repository root", resolve(git(["rev-parse", "--show-toplevel"])) === resolve(root));
check("baseline manifest version", baseline.manifestVersion === "1.0.0");
check("baseline reconstructability", baseline.baselineReconstructability === "NOT_RECONSTRUCTABLE");
check("baseline repository name", baseline.repository === "Shorts Editorial OS V2");
check("baseline branch", baseline.git.branch === "codex/source-first-blueprint-clean");
check("baseline HEAD", baseline.git.head === "ce6346411d8a071921e942fad5c895f5fcf94b1b");
check("baseline parent", baseline.git.parent === "80aa56cfdc75f3014fb5415392a6b363ced18feb");
check("baseline upstream ahead", baseline.git.upstream.ahead === 6);
check("baseline upstream behind", baseline.git.upstream.behind === 0);
check("baseline modified count", baseline.git.modifiedCount === 21);
check("baseline untracked count", baseline.git.untrackedCount === 3);
check("baseline staged count", baseline.git.stagedCount === 0);
check("baseline status path count", baseline.git.statusPathCount === 24);
check("baseline protected path count", baseline.statusPaths.length === 24);
check("Slice 6 exact allowlist 17", baseline.slice6ExactAllowlist.length === 17);
check("Slice 6 new allowlist 12", baseline.slice6NewFileAllowlist.length === 12);
check("Slice 6 modified allowlist 5", baseline.slice6ModifiedFileAllowlist.length === 5);
check("protection exceptions exact", JSON.stringify(baseline.protectionExceptions) === JSON.stringify(["_ai/PROJECT_STATE.md", "_ai/NEXT_ACTION.md"]));

const head = git(["rev-parse", "HEAD"]);
const parent = git(["rev-parse", "HEAD^"]);
const ahead = Number(git(["rev-list", "--count", "@{upstream}..HEAD"]));
const behind = Number(git(["rev-list", "--count", "HEAD..@{upstream}"]));
check("current HEAD unchanged", head === baseline.git.head, head);
check("current parent unchanged", parent === baseline.git.parent, parent);
check("current ahead unchanged", ahead === 6, String(ahead));
check("current behind unchanged", behind === 0, String(behind));

const porcelain = gitRaw(["status", "--porcelain=v1", "-z"]);
const entries = porcelain.split("\0").filter(Boolean).map((entry) => ({ status: entry.slice(0, 2), path: entry.slice(3).replaceAll("\\", "/") }));
const actualPaths = new Set(entries.map((entry) => entry.path));
const expectedPaths = new Set([...baseline.statusPaths.map((entry) => entry.path), ...baseline.slice6ExactAllowlist]);
check("working status exact 41", entries.length === 41, String(entries.length));
check("working modified exact 26", entries.filter((entry) => entry.status.includes("M")).length === 26, JSON.stringify(entries.filter((entry) => entry.status.includes("M"))));
check("working untracked exact 15", entries.filter((entry) => entry.status === "??").length === 15, JSON.stringify(entries.filter((entry) => entry.status === "??")));
check("working staged zero", entries.filter((entry) => entry.status[0] !== " " && entry.status[0] !== "?").length === 0);
check("working rename zero", entries.every((entry) => !entry.status.includes("R")));
check("working delete zero", entries.every((entry) => !entry.status.includes("D")));
check("status path set exact", actualPaths.size === expectedPaths.size && [...actualPaths].every((path) => expectedPaths.has(path)));
for (const entry of baseline.slice6NewFileAllowlist) check(`new file untracked: ${entry}`, entries.some((statusEntry) => statusEntry.path === entry && statusEntry.status === "??"));
for (const entry of baseline.slice6ModifiedFileAllowlist) check(`modified file unstaged: ${entry}`, entries.some((statusEntry) => statusEntry.path === entry && statusEntry.status === " M"));
for (const entry of baseline.statusPaths) {
  check(`protected dirty status: ${entry.path}`, entries.some((statusEntry) => statusEntry.path === entry.path && statusEntry.status === entry.status));
  check(`protected dirty hash: ${entry.path}`, sha256(entry.path) === entry.sha256);
}
for (const entry of [...baseline.governanceCriticalPaths, ...baseline.checkpointCriticalPaths]) {
  if (baseline.slice6ModifiedFileAllowlist.includes(entry.path)) continue;
  check(`critical hash: ${entry.path}`, sha256(entry.path) === entry.sha256, entry.path);
}

const contracts = readRepo("lib/editorial-v2/contracts.ts");
const originalContracts = git(["show", `${baseline.git.head}:lib/editorial-v2/contracts.ts`]).replaceAll("\r\n", "\n").trimEnd();
check("contracts additive-only prefix", contracts.replaceAll("\r\n", "\n").startsWith(originalContracts));
checkForbiddenTokens("contracts", contracts, [" any;", ": any", "<any>"]);
checkTokens("contract type", contracts, [
  "VoiceProviderMode", "VoiceProviderReference", "VoiceRequestScene", "VoiceRequestPlan", "VoiceUsageEstimate",
  "VoiceCostEstimateClass", "VoicePlanValidationIssue", "VoicePlanValidationSummary", "VoicePlanApprovalState",
  "SubtitleAlignmentStatus", "SubtitleCue", "SceneSubtitlePlan", "SubtitleTrackPlan", "SubtitleValidationIssue", "SubtitleValidationSummary",
  "RenderProfileId", "RenderProfile", "RenderLayerType", "SceneRenderLayer", "SceneRenderInput", "SceneRenderFingerprint", "RenderManifest",
  "RenderManifestValidationIssue", "RenderManifestValidationSummary", "SceneRenderExecutionStatus", "RenderAttemptRecord", "RenderRecoveryPlan",
  "RendererBridgeCapability", "RendererBridgePlan", "SyntheticRenderProofResult", "RenderIntegrationApprovalState",
  "ApprovedRenderIntegrationSessionSnapshot", "RenderIntegrationSessionState",
]);
checkTokens("contract literal", contracts, [
  '"plan_only"', '"existing_external_provider"', '"manual_audio_future"', '"estimated_not_audio_aligned"',
  '"preview_540x960"', '"final_1080x1920"', '"base_placeholder"', '"primary_visual"', '"supporting_visual"',
  '"source_metadata"', '"number_chart_metadata"', '"character"', '"subtitle"', '"key_caption"', '"safe_area"',
  '"STRUCTURAL_SAFE_AREA_PRECHECK"', '"INTEGRATION_PRECHECK_ONLY"', '"scene_concat"', '"profile_selection"',
  '"audio_placeholder"', '"subtitle_overlay"', '"character_overlay"', '"text_overlay"', '"transitions"',
  '"fingerprint_verification"', '"manifest_hash_verification"', '"ffprobe_verification"',
]);
checkTokens("contract safety fields", contracts, [
  "actualRequestExecuted: false", "audioCreated: false", "productionReady: false", "renderExecuted: false",
  "externalRequestsMade: false", "previousOutputsAssumed: false", "persistenceUsed: false", "executionReady: false",
  "networkRequired: false", "filesystemAccessDeclared: false", "processExecutionDeclared: false", "v1ImportsUsed: false",
  "characterOccupancyPercent", "characterOccupancyTargetPercent", "characterOverlapsSubtitleSafeZone",
  "characterIntrudesPrimarySafeZone", "obstructionPolicySatisfied", "characterIsPrimaryVisual",
  "captionDensityClass", "evidenceDensityClass", "sessionOnly: true", "ttsConnected: false",
]);

const voice = readRepo("lib/editorial-v2/voice-planning.ts");
checkTokens("voice exports", voice, ["export function buildVoiceRequestPlan", "export function validateVoiceRequestPlan", "export function summarizeVoicePlanValidation", "export function canApproveVoicePlan"]);
checkTokens("voice behavior", voice, [
  "SUPPORTED_LOCALES", "ko-KR", "en-US", "characterCount", "wordCount", "estimateDurationSeconds", "durationVarianceSeconds",
  "externalProviderRequired", "requiresOwnerApproval", "ownerApprovalConfirmed", "actualRequestExecuted: false", "audioCreated: false",
  "voice_scenes_missing", "voice_scene_id_missing", "voice_scene_duplicate", "voice_narration_missing", "voice_identity_missing",
  "voice_locale_unverified", "voice_duration_too_short", "voice_execution_forbidden", "voice_provider_missing",
  "external_voice_owner_approval_missing", "voice_plan_execution_forbidden", "voice_target_duration_invalid", "voice_duration_variance_high",
  "voice_cost_basis_missing", "actual_price_claim_prohibited", "manual_basis_only", "provider_estimate_unverified", "unknown",
]);

const subtitles = readRepo("lib/editorial-v2/subtitle-planning.ts");
checkTokens("subtitle exports", subtitles, ["export function buildSubtitleTrackPlan", "export function validateSubtitleTrackPlan", "export function summarizeSubtitleValidation"]);
checkTokens("subtitle behavior", subtitles, [
  "MIN_SCENE_DURATION_SECONDS", "MAX_CUE_CHARACTERS", "splitLongSegment", "splitNarration", "allocateDurations",
  "estimated_not_audio_aligned", "lower_safe_caption_zone", "audioAlignmentPerformed: false", "productionReady: false",
  "subtitle_alignment_false_claim", "subtitle_scene_coverage_mismatch", "subtitle_expected_eight_scene_order", "subtitle_scene_order_mismatch",
  "subtitle_negative_time", "subtitle_scene_time_invalid", "subtitle_scene_gap_or_overlap", "subtitle_narration_mismatch",
  "subtitle_key_caption_mismatch", "subtitle_cue_time_invalid", "subtitle_cue_gap_or_overlap", "subtitle_cue_outside_scene",
  "subtitle_cue_text_missing", "subtitle_cue_too_long", "subtitle_cue_too_short", "subtitle_cue_alignment_false_claim",
  "subtitle_cue_scene_coverage_gap", "subtitle_cue_narration_coverage_mismatch", "subtitle_target_duration_mismatch", "subtitle_estimate_only_warning",
]);

const manifestSource = readRepo("lib/editorial-v2/render-manifest.ts");
checkTokens("manifest exports", manifestSource, ["export const RENDER_PROFILES", "export function buildSceneRenderFingerprint", "export function hashRenderManifest", "export function cloneRenderManifest", "export function buildRenderManifest"]);
checkTokens("manifest profiles", manifestSource, [
  'profileId: "preview_540x960"', 'label: "Preview 540×960 · local integration intent"', "width: 540", "height: 960",
  'bitrateIntent: "low_preview"', 'encodingIntent: "fast_preview"', "preview: true", "final: false",
  'profileId: "final_1080x1920"', 'label: "Final 1080×1920 · production intent metadata only"', "width: 1080", "height: 1920",
  'bitrateIntent: "production_intent_unverified"', 'encodingIntent: "production_quality_intent"', "final: true", "executionAllowed: false",
]);
checkTokens("manifest deterministic behavior", manifestSource, [
  "stableSerialize", "deterministicHash", "sceneContentHash", "voiceHash", "subtitleHash", "characterHash", "profileHash",
  "directionOccupancyTarget", "asset://", "encodeURIComponent", "sourcePlanningIdentity", "sourceScriptHash", "selectedAngleId",
  "selectedCharacterDirectionId", "globalSafeAreaPolicy", "evidence_first_no_obstruction", "manifestHash: hashRenderManifest(base)",
  "INTEGRATION_PRECHECK_ONLY", "STRUCTURAL_SAFE_AREA_PRECHECK", "characterOverlapsSubtitleSafeZone: false",
  "obstructionPolicySatisfied", "characterIsPrimaryVisual", "captionDensityClass", "evidenceDensityClass",
]);
for (const layerType of ["base_placeholder", "primary_visual", "supporting_visual", "source_metadata", "number_chart_metadata", "character", "subtitle", "key_caption", "safe_area"]) check(`manifest layer ${layerType}`, manifestSource.includes(`"${layerType}"`));

const validation = readRepo("lib/editorial-v2/render-validation.ts");
checkTokens("validation exports", validation, ["export function validateRenderManifest", "export function summarizeRenderManifestValidation", "export function canApproveRenderIntegration"]);
checkTokens("validation gates", validation, [
  "approved_planning_missing", "approved_character_missing", "planning_identity_mismatch", "script_identity_mismatch", "angle_identity_mismatch",
  "character_identity_mismatch", "enabled_scene_count_outside_range", "voice_validation_blocking", "subtitle_validation_blocking",
  "external_provider_unapproved", "execution_state_forbidden", "subtitle_alignment_false_claim", "production_ready_false_claim",
  "render_profile_mismatch", "final_profile_execution_forbidden", "manifest_hash_invalid", "unknown_scene_id", "duplicate_render_scene",
  "scene_duration_invalid", "scene_voice_missing", "scene_subtitle_missing", "primary_visual_layer_missing", "required_visual_unresolved",
  "character_only_primary_forbidden", "character_occupancy_over_target", "character_subtitle_safe_zone_overlap",
  "character_primary_safe_zone_intrusion", "character_obstruction_policy_violation", "character_occupancy_near_limit",
  "caption_density_warning", "evidence_density_warning", "safe_area_precheck_missing", "manual_visual_asset_missing",
  "paid_visual_owner_approval_missing", "visual_rights_unresolved", "visual_cost_unknown", "ai_stock_manual_warning",
  "physical_file_path_forbidden", "network_url_forbidden", "logical_uri_scheme_invalid", "required_layer_unresolved",
  "character_layer_primary_forbidden", "scene_fingerprint_invalid", "enabled_scene_count_mismatch", "manifest_duration_mismatch",
  "tts_not_connected_warning", "voice_cost_unknown_warning", "manual_upload_required_warning", "subtitle_estimated_warning",
  "renderer_complexity_unverified", "final_profile_metadata_only", "browser_runtime_unverified",
]);
checkTokens("validation levels", validation, ["INTEGRATION_PRECHECK_ONLY", "estimated_not_audio_aligned", "asset://", "0.85", "7", "10"]);

const recovery = readRepo("lib/editorial-v2/render-recovery.ts");
checkTokens("recovery exports", recovery, ["export function compareRenderManifests", "export function buildRenderRecoveryPlan", "export function canReuseSceneRender"]);
checkTokens("recovery behavior", recovery, [
  "no_previous_manifest", "render_profile_changed", "fps_changed", "canvas_changed", "global_safe_area_changed",
  "character_direction_changed", "voice_global_settings_changed", "subtitle_global_style_changed", "changedSceneIds",
  "reusableSceneIds", "removedSceneIds", "newSceneIds", "retryableSceneIds", "blockedSceneIds",
  "previousOutputsAssumed: false", "persistenceUsed: false", "fingerprint.fingerprint",
]);

const bridge = readRepo("lib/editorial-v2/renderer-bridge.ts");
checkTokens("bridge exports", bridge, ["export function buildRendererBridgePlan", "export function validateRendererBridgePlan"]);
for (const capability of ["scene_concat", "profile_selection", "audio_placeholder", "subtitle_overlay", "character_overlay", "text_overlay", "transitions", "fingerprint_verification", "manifest_hash_verification", "ffprobe_verification"]) check(`bridge capability ${capability}`, bridge.includes(`"${capability}"`));
checkTokens("bridge boundaries", bridge, [
  "audio_track_not_created", "production_render_adapter_not_implemented", "runtime_frame_safe_area_not_verified",
  "final_profile_execution_not_authorized", "executionReady: false", "networkRequired: false", "filesystemAccessDeclared: false",
  "processExecutionDeclared: false", "v1ImportsUsed: false", "bridge_manifest_hash_mismatch", "bridge_profile_mismatch",
  "bridge_capability_missing", "bridge_execution_ready_false_claim", "bridge_boundary_violation", "bridge_logical_uri_invalid",
  "bridge_external_or_file_uri_forbidden", "bridge_missing_audio_requirement_hidden", "bridge_missing_adapter_requirement_hidden",
]);

const fixture = readRepo("lib/editorial-v2/render-fixture.ts");
checkTokens("fixture exports", fixture, ["export function buildSyntheticRenderFixture", "export function cloneSyntheticRenderFixture"]);
checkTokens("fixture contract", fixture, [
  "slice6-synthetic-render-fixture-v1", "preview_540x960", "width: 540", "height: 960", "framesPerSecond: 30",
  "sceneCount: 8", "totalDurationSeconds: 4", "durationSeconds: 0.5", "generated_sine_tone_fixture_only",
  "synthetic_srt_fixture_only", "SYNTHETIC_SAFE_AREA_GUIDE", "userContentIncluded: false", "productionDataIncluded: false",
  "finalProfileUsed: false", "slice6-fixture-fixed-8x050-540x960-v1", "synthetic-scene-01", "synthetic-scene-08",
  "scene-fixed-01-14213d", "scene-fixed-08-a9d6e5",
]);
check("fixture exactly 8 scene records", (fixture.match(/sceneId: "synthetic-scene-/gu) ?? []).length === 8);
checkForbiddenTokens("fixture", fixture, ["Date.now", "new Date", "Math.random", "fetch(", "process.env", "node:fs", "node:child_process"]);

const characterUi = readRepo("components/editorial-v2/CharacterMotionWorkbench.tsx");
checkTokens("character callback", characterUi, [
  "ApprovedCharacterMotionSessionSnapshot", "onApprovedCharacterMotionChange", "cloneApprovedCharacterMotionSnapshot", "useEffect",
  "sceneMotionAssignments", "reducedMotionAssignments", "originalityReview", "rightsReview", "accessibilityReview",
  "session.approvedSnapshot", "onApprovedCharacterMotionChange(null)", "selection_changed", "reduced_motion_changed",
  "approval_cancelled", 'dispatch({ type: "reset" })', "downstream render integration은 별도 session 승인 필요",
]);

const editorialUi = readRepo("components/editorial-v2/EditorialV2Workbench.tsx");
checkTokens("orchestrator integration", editorialUi, [
  "ApprovedCharacterMotionSessionSnapshot", "ApprovedRenderIntegrationSessionSnapshot", "RenderIntegrationWorkbench",
  "useCallback", "useCallback((snapshot", "}, [])",
  "approvedCharacterSnapshot", "approvedRenderSnapshot", "setApprovedCharacterSnapshot(null)", "setApprovedRenderSnapshot(null)",
  "handleApprovedPlanningChange", "handleApprovedCharacterChange", "onApprovedScenePlanningChange={handleApprovedPlanningChange}",
  "onApprovedCharacterMotionChange={handleApprovedCharacterChange}", "Render Integration session-only 연결", "approvedCharacterMotionSnapshot",
  "onApprovedRenderIntegrationChange={setApprovedRenderSnapshot}", "Synthetic preview proof", "SESSION_ONLY_APPROVED", "NOT_APPROVED",
]);

const renderUi = readRepo("components/editorial-v2/RenderIntegrationWorkbench.tsx");
checkTokens("render UI six steps", renderUi, [
  "Voice Request Plan", "Subtitle Timing Plan", "Render Manifest", "Recovery Plan", "Validation · Renderer Bridge", "Session Approval",
]);
checkTokens("render UI gates", renderUi, [
  "ESTIMATED_NOT_AUDIO_ALIGNED", "INTEGRATION_PRECHECK_ONLY", "STRUCTURAL_SAFE_AREA_PRECHECK", "FINAL EXECUTION FORBIDDEN",
  "NOT_EXECUTED", "TTS connected: false", "audio created: false", "renderExecuted false", "executionReady: false",
  "CLI_ONLY", "production proof 아님", "session-only package", "TTS/audio/asset/render/publish/deploy 권한이 아닙니다",
  "Voice plan 세션 승인", "Render Integration Package 세션 승인", "Slice 6 reset", "onApprovedRenderIntegrationChange(null)",
  "setApprovedVoiceKey(null)", "setApprovedRenderKey(null)", "setLastApprovedManifest(null)", "canApproveRenderIntegration",
]);
checkForbiddenTokens("render UI", renderUi, ["fetch(", "localStorage", "indexedDB", "dangerouslySetInnerHTML", 'type="file"', "node:fs", "node:child_process"]);

const css = readRepo("components/editorial-v2/RenderIntegrationWorkbench.module.css");
checkTokens("render CSS", css, [
  ".shell", ".hero", ".step", ".formGrid", ".summaryGrid", ".profileGrid", ".profileCard", '[data-selected="true"]',
  ".tableWrap", "overflow-x: auto", ".issues", ".blocking", ".warning", ".actions", ":focus-visible",
  "@media (max-width: 920px)", "@media (max-width: 640px)", "grid-template-columns: 1fr",
]);

const safeModulePaths = [
  "lib/editorial-v2/voice-planning.ts", "lib/editorial-v2/subtitle-planning.ts", "lib/editorial-v2/render-manifest.ts",
  "lib/editorial-v2/render-validation.ts", "lib/editorial-v2/render-recovery.ts", "lib/editorial-v2/renderer-bridge.ts",
  "lib/editorial-v2/render-fixture.ts", "components/editorial-v2/RenderIntegrationWorkbench.tsx",
];
for (const path of safeModulePaths) {
  const source = readRepo(path);
  check(`${path} no network call`, !/\bfetch\s*\(|XMLHttpRequest|WebSocket|EventSource/u.test(source));
  check(`${path} no env read`, !/process\.env|import\.meta\.env/u.test(source));
  check(`${path} no persistence`, !/localStorage|sessionStorage|indexedDB/u.test(source));
  check(`${path} no server route`, !/NextRequest|NextResponse|route\.ts/u.test(source));
  check(`${path} no Node fs/process import`, !/from ["']node:(?:fs|child_process|os)["']/u.test(source));
  check(`${path} no V1 import`, !/from ["'][^"']*(?:money-shorts|finance-|flow-|owner-web|veo-)/u.test(source));
  check(`${path} no random clock`, !/Math\.random|Date\.now|new Date\s*\(/u.test(source));
}

const probe = readRepo("scripts/probe-shorts-editorial-os-v2-slice6-render.mjs");
checkTokens("probe safety", probe, [
  "SHORTS_EDITORIAL_OS_V2_SLICE6_SYNTHETIC_RENDER_PROOF_PASS", "mkdtempSync", "tmpdir", "shorts-editorial-v2-slice6-",
  "assertSafeTemporaryDirectory", "isAbsolute", "resolvedCandidate === resolvedRoot", "startsWith(`${resolvedRoot}${sep}`)",
  "git", "rev-parse", "--show-toplevel", "status", "--porcelain=v1", "-z", "statusBefore", "statusAfter",
  "ffmpeg", "ffprobe", "540x960", "r=30", "d=0.5", "concat=n=8", "sine=frequency=880", "synthetic-subtitles.srt",
  "mov_text", "SLICE6_SYNTHETIC_FIXTURE_ONLY", "videoStreamPresent", "audioStreamPresent", "subtitleStreamPresent",
  "durationSeconds < 3.8", "durationSeconds > 4.2", "createHash", "sha256", "statSync", "nonEmptyOutput",
  "finally", "rmSync(temporaryDirectory, { recursive: true, force: true })", "repository status changed", "syntheticOnly: true",
]);
checkForbiddenTokens("probe", probe, ["process.env", "fetch(", "http://", "https://", "1080x1920", "final_1080x1920", "output/", "C:\\tmp"]);
check("probe exactly 8 synthetic colors", (probe.match(/\["[0-9A-F]{6}", "SYNTHETIC 0[1-8]"\]/gu) ?? []).length === 8);
check("probe cleanup inside finally", probe.indexOf("finally") < probe.indexOf("rmSync(temporaryDirectory"));

const projectState = readRepo("_ai/PROJECT_STATE.md");
const nextAction = readRepo("_ai/NEXT_ACTION.md");
checkTokens("PROJECT_STATE", projectState, [
  "Slice 0: `FINAL_PASS`", "Slice 1: `FINAL_PASS`", "Slice 2: `FINAL_PASS`", "Slice 3: `FINAL_PASS`", "Slice 4: `FINAL_PASS`", "Slice 5: `FINAL_PASS`",
  "governance: `ACTIVE`", "Slice 6: `IMPLEMENTATION_COMPLETE_AWAITING_CROSS_REVIEW`", "Slice 6 Cross Review: `NOT_STARTED`",
  "Slice 7: `BLOCKED`", "Voice: `SESSION_ONLY`", "TTS: `NOT_CONNECTED`", "audio: `NOT_CREATED`",
  "Subtitle: `ESTIMATED_NOT_AUDIO_ALIGNED`", "Render Manifest: `INTEGRATION_PRECHECK_ONLY`", "Synthetic render proof:",
  "production render: `NOT_IMPLEMENTED`", "Recovery: `PLAN_ONLY`", "runtime UI: `UNVERIFIED`", "durable persistence: `NOT_IMPLEMENTED`",
  "product operational capability: `NOT_CLAIMED`", "Push: `NOT_AUTHORIZED`", "automatic continuation: `DISABLED`",
  "official progress: `NOT_CALCULATED`", "Slice 3 maintenance backlog", "Slice 4 maintenance backlog", "Slice 5 maintenance backlog",
]);
checkTokens("NEXT_ACTION", nextAction, [
  "Claude Code Slice 6 read-only Cross Review", "ChatGPT 중간 전달 불필요", "Claude 결과는 Codex에 전달",
  "일반 P1", "P0/BLOCKED/scope expansion", "Slice 7 자동 시작 금지", "probe 재실행 금지", "build 재실행 금지",
  "feat(editorial-v2): checkpoint slice 6 render integration", "exact 17-file checkpoint", "Push: `NOT_AUTHORIZED`",
]);

const configPath = ts.findConfigFile(root, ts.sys.fileExists, "tsconfig.json");
check("tsconfig found", Boolean(configPath));
if (configPath) {
  const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
  const parsed = ts.parseJsonConfigFileContent(configFile.config, ts.sys, root, { noEmit: true }, configPath);
  const targetFiles = [
    "lib/editorial-v2/contracts.ts", "lib/editorial-v2/voice-planning.ts", "lib/editorial-v2/subtitle-planning.ts",
    "lib/editorial-v2/render-manifest.ts", "lib/editorial-v2/render-validation.ts", "lib/editorial-v2/render-recovery.ts",
    "lib/editorial-v2/renderer-bridge.ts", "lib/editorial-v2/render-fixture.ts",
    "components/editorial-v2/CharacterMotionWorkbench.tsx", "components/editorial-v2/EditorialV2Workbench.tsx",
    "components/editorial-v2/RenderIntegrationWorkbench.tsx",
  ].map((path) => resolve(root, path));
  const program = ts.createProgram({ rootNames: parsed.fileNames, options: parsed.options });
  const diagnostics = ts.getPreEmitDiagnostics(program).filter((diagnostic) => !diagnostic.file || targetFiles.includes(resolve(diagnostic.file.fileName)));
  check("target TypeScript diagnostics zero", diagnostics.length === 0, diagnostics.map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, " ")).join(" | "));
}

let diffCheckPassed = true;
try { git(["diff", "--check"]); } catch { diffCheckPassed = false; }
check("git diff --check passes", diffCheckPassed);
const whitespaceIssues = baseline.slice6NewFileAllowlist.filter((path) => readRepo(path).split(/\r?\n/u).some((line) => /[ \t]+$/u.test(line)));
check("Slice 6 new files trailing whitespace zero", whitespaceIssues.length === 0, whitespaceIssues.join(", "));
const checkerSource = readRepo("scripts/check-shorts-editorial-os-v2-slice6.mjs");
const checkerAst = ts.createSourceFile("check-shorts-editorial-os-v2-slice6.mjs", checkerSource, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
const checkerImports = checkerAst.statements.filter(ts.isImportDeclaration);
const checkerFsImport = checkerImports.find((statement) => statement.moduleSpecifier.text === "node:fs");
const checkerFsImportNames = checkerFsImport?.importClause?.namedBindings && ts.isNamedImports(checkerFsImport.importClause.namedBindings)
  ? checkerFsImport.importClause.namedBindings.elements.map((element) => element.name.text).sort()
  : [];
check("checker source fs import is read-only allowlist", JSON.stringify(checkerFsImportNames) === JSON.stringify(["existsSync", "readFileSync"]));
check("checker source has no fs promises import", !checkerImports.some((statement) => statement.moduleSpecifier.text === "node:fs/promises"));
check("checker has at least 320 independent checks", pass + fail >= 320, String(pass + fail));

if (fail > 0) {
  console.error(`SHORTS_EDITORIAL_OS_V2_SLICE6_CHECK_FAIL ${pass}/${pass + fail} PASS`);
  process.exit(1);
}
console.log(`SHORTS_EDITORIAL_OS_V2_SLICE6_CHECK_PASS ${pass}/${pass} PASS`);
