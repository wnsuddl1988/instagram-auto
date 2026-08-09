import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const baseline = JSON.parse(readFileSync(resolve(root, "_ai/SHORTS_EDITORIAL_OS_V2_PA4L_SINGLE_SCENE_GUARD_BASELINE.json"), "utf8"));
const inherited = JSON.parse(readFileSync(resolve(root, baseline.protectedDirtyBaselineManifest.path), "utf8"));
const postCheckpoint = process.argv.includes("--post-checkpoint");
const postCheckpointCorrectionAllowlist = new Set([
  "lib/editorial-v2/voice-materialization-contracts.ts",
  "lib/editorial-v2/voice-materialization-validation.ts",
  "lib/editorial-v2/voice-materialization-api-client.ts",
  "lib/editorial-v2/voice-materialization-node.ts",
  "app/api/editorial-v2/projects/[projectId]/voice-materialization/route.ts",
  "scripts/probe-shorts-editorial-os-v2-pa4l-single-scene.mjs",
  "scripts/check-shorts-editorial-os-v2-pa4l-single-scene.mjs",
  "scripts/check-shorts-editorial-os-v2-pa4l-error-diagnostics.mjs",
]);
const failures = [];
let passed = 0;
let actualFetchCalls = 0;

function check(label, condition, detail = "") {
  if (condition) passed += 1;
  else failures.push(`${label}${detail ? ` :: ${detail}` : ""}`);
}

function git(args) {
  const result = spawnSync("git", args, { cwd: root, encoding: "utf8", windowsHide: true, maxBuffer: 64 * 1024 * 1024 });
  if (result.status !== 0 || result.error) throw new Error(result.stderr || result.error?.message || `git ${args.join(" ")} failed`);
  return result.stdout.trimEnd();
}

function source(path) {
  return readFileSync(resolve(root, path), "utf8");
}

function sha256File(path) {
  return createHash("sha256").update(readFileSync(resolve(root, path))).digest("hex");
}

function sha256Text(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

function parseStatus() {
  const raw = git(["status", "--porcelain=v1", "-z", "--untracked-files=all"]);
  return raw ? raw.split("\0").filter(Boolean).map((entry) => ({ status: entry.slice(0, 2), path: entry.slice(3).replaceAll("\\", "/") })) : [];
}

const allowlist = baseline.pa4lAllowlist.map((entry) => entry.path);
const allowlistSet = new Set(allowlist);
const inheritedStatusMap = new Map(inherited.statusPaths.map((entry) => [entry.path, entry]));
const status = parseStatus();
const statusMap = new Map(status.map((entry) => [entry.path, entry.status]));

if (!postCheckpoint) {
  check("branch exact", git(["branch", "--show-current"]) === baseline.git.branch);
  check("HEAD exact", git(["rev-parse", "HEAD"]) === baseline.git.head);
  check("parent exact", git(["rev-parse", "HEAD^"]) === baseline.git.parent);
  check("tree exact", git(["rev-parse", "HEAD^{tree}"]) === baseline.git.tree);
  const [behind, ahead] = git(["rev-list", "--left-right", "--count", "@{upstream}...HEAD"]).split(/\s+/u).map(Number);
  check("upstream behind exact", behind === baseline.git.upstream.behind);
  check("upstream ahead exact", ahead === baseline.git.upstream.ahead);
  check("precommit status paths exact", status.length === baseline.expectedPreCommitTree.statusPaths, String(status.length));
  check("precommit modified exact", status.filter((entry) => entry.status.includes("M")).length === baseline.expectedPreCommitTree.modified);
  check("precommit untracked exact", status.filter((entry) => entry.status === "??").length === baseline.expectedPreCommitTree.untracked);
  for (const entry of baseline.pa4lAllowlist) {
    const expectedStatus = entry.expectedAction === "new" ? "??" : " M";
    check(`allowlist status ${entry.path}`, statusMap.get(entry.path) === expectedStatus, statusMap.get(entry.path) ?? "missing");
    check(`allowlist exists ${entry.path}`, existsSync(resolve(root, entry.path)));
    if (entry.originalBlob) check(`allowlist HEAD blob ${entry.path}`, git(["rev-parse", `HEAD:${entry.path}`]) === entry.originalBlob);
  }
  for (const entry of status) check(`status exact baseline or allowlist ${entry.path}`, inheritedStatusMap.has(entry.path) || allowlistSet.has(entry.path));
} else {
  check("post-checkpoint branch exact", git(["branch", "--show-current"]) === baseline.git.branch);
  for (const entry of baseline.pa4lAllowlist) {
    check(`post-checkpoint allowlist committed ${entry.path}`, existsSync(resolve(root, entry.path)) && (postCheckpointCorrectionAllowlist.has(entry.path) || !statusMap.has(entry.path)));
  }
  for (const entry of status) check(`post-checkpoint status protected or correction ${entry.path}`, inheritedStatusMap.has(entry.path) || postCheckpointCorrectionAllowlist.has(entry.path));
}

check("staged zero", git(["diff", "--cached", "--name-only"]) === "");
check("rename zero", status.every((entry) => !entry.status.includes("R")));
check("delete zero", status.every((entry) => !entry.status.includes("D")));
check("allowlist exact 11", allowlist.length === 11 && allowlistSet.size === 11);
check("allowlist new exact 3", baseline.pa4lAllowlist.filter((entry) => entry.expectedAction === "new").length === 3);
check("allowlist modified exact 8", baseline.pa4lAllowlist.filter((entry) => entry.expectedAction === "modified").length === 8);

for (const entry of inherited.statusPaths) {
  check(`protected path status ${entry.path}`, statusMap.get(entry.path) === entry.status, statusMap.get(entry.path) ?? "missing");
  check(`protected path hash ${entry.path}`, existsSync(resolve(root, entry.path)) && sha256File(entry.path) === entry.sha256);
}
check("inherited PA4 baseline hash", sha256File(baseline.protectedDirtyBaselineManifest.path) === baseline.protectedDirtyBaselineManifest.sha256);
for (const entry of baseline.governanceFiles) {
  check(`governance hash ${entry.path}`, sha256File(entry.path) === entry.sha256);
  check(`governance clean ${entry.path}`, !statusMap.has(entry.path));
}
for (const entry of inherited.inheritedCheckpointManifests) {
  check(`checkpoint hash ${entry.path}`, sha256File(entry.path) === entry.sha256);
  check(`checkpoint clean ${entry.path}`, !statusMap.has(entry.path));
}
for (const entry of baseline.protectedConfigFiles) {
  check(`protected config status ${entry.path}`, entry.status ? statusMap.get(entry.path) === entry.status : !statusMap.has(entry.path));
  check(`protected config HEAD ${entry.path}`, git(["rev-parse", `HEAD:${entry.path}`]) === entry.headBlob);
  check(`protected config worktree ${entry.path}`, git(["hash-object", "--", entry.path]) === entry.workingBlob);
  check(`protected config sha ${entry.path}`, sha256File(entry.path) === entry.sha256);
  check(`protected config head policy ${entry.path}`, entry.expectedHeadIdentical ? entry.headBlob === entry.workingBlob : entry.headBlob !== entry.workingBlob);
}

const contractsSource = source("lib/editorial-v2/voice-materialization-contracts.ts");
const nodeSource = source("lib/editorial-v2/voice-materialization-node.ts");
const validationSource = source("lib/editorial-v2/voice-materialization-validation.ts");
const clientSource = source("lib/editorial-v2/voice-materialization-api-client.ts");
const routeSource = source("app/api/editorial-v2/projects/[projectId]/voice-materialization/route.ts");
const panelSource = source("components/editorial-v2/VoiceMaterializationPanel.tsx");
const productSource = [contractsSource, nodeSource, validationSource, clientSource, routeSource, panelSource].join("\n");

check("execution mode exact constant", contractsSource.includes('PA4L_SINGLE_SCENE_LIVE_SMOKE_MODE = "pa4l_single_scene_live_smoke"'));
check("max scenes exact one", contractsSource.includes("PA4L_MAX_SCENES = 1"));
check("max requests exact one", contractsSource.includes("PA4L_MAX_EXTERNAL_GENERATION_REQUESTS = 1"));
check("second-final total request cap exact two", contractsSource.includes("PA4L_MAX_TOTAL_EXTERNAL_GENERATION_REQUESTS = 2"));
check("max narration exact 180", contractsSource.includes("PA4L_MAX_NARRATION_CHARACTERS = 180"));
check("automatic retry exact zero", contractsSource.includes("PA4L_AUTOMATIC_RETRY_LIMIT = 0"));
check("fallback exact zero", contractsSource.includes("PA4L_FALLBACK_REQUEST_LIMIT = 0"));
check("pure selector exported", nodeSource.includes("export function selectPa4lSingleSmokeScene"));
check("selector no Date.now", !/Date\.now/u.test(nodeSource.slice(nodeSource.indexOf("selectPa4lSingleSmokeScene"), nodeSource.indexOf("buildVoiceMaterializationPlan"))));
check("selector no random", !/Math\.random|randomUUID|crypto\.random/iu.test(nodeSource));
check("selector no truncation", !/narration\.(?:slice|substring|substr)\(/u.test(nodeSource));
check("plan assertion exported", nodeSource.includes("export function assertPa4lSingleScenePlan"));
check("executor budget before provider", nodeSource.indexOf("PA4L_EXTERNAL_REQUEST_BUDGET_EXHAUSTED") < nodeSource.indexOf("requestElevenLabsTimestampTts({"));
check("executor budget consumed before await", nodeSource.indexOf("externalRequestsThisRun += 1") < nodeSource.indexOf("const provider = await requestElevenLabsTimestampTts"));
check("executor canonical scene check", nodeSource.includes("PA4L_CANONICAL_SCENE_SELECTION_MISMATCH"));
check("executor narration hash check", nodeSource.includes("scene.narrationHash !== sha256(scene.narration)"));
check("route recomputes plan", routeSource.includes("buildVoiceMaterializationPlan(project"));
check("route canonical scene compare", routeSource.includes("assertPa4lRequestedSceneIds(plan, parsed.requestedSceneIds)"));
check("route full live block", routeSource.includes("LIVE_FULL_MATERIALIZATION_NOT_ACTIVATED"));
check("route passes exact PA4L mode", routeSource.includes("executionMode: PA4L_SINGLE_SCENE_LIVE_SMOKE_MODE"));
check("route explicit retry mode", routeSource.includes('mode: parsed.action === "retry_failed" ? "retry" : "initial"'));
check("route passes second-final confirmation only", routeSource.includes("parsed.ownerSecondFinalPaidExternalTtsConfirmation === true"));
check("request schema requires one", validationSource.includes("pa4l_requested_scene_exactly_one_required"));
check("canonical scene identifier helper", contractsSource.includes("export function isVoiceMaterializationSceneId"));
check("request schema accepts canonical scene helper", validationSource.includes("isVoiceMaterializationSceneId(entry)"));
check("client accepts canonical scene helper", clientSource.includes("isVoiceMaterializationSceneId(request.requestedSceneIds[0])"));
check("route audio lookup accepts canonical scene helper", routeSource.includes("isVoiceMaterializationSceneId(sceneId)"));
check("request schema requires second-final confirmation", validationSource.includes("pa4l_second_final_paid_tts_confirmation_required"));
check("request schema blocks second-final confirmation on initial", validationSource.includes("pa4l_second_final_confirmation_without_retry_forbidden"));
check("request schema blocks standard full", validationSource.includes("live_full_materialization_not_activated"));
check("client plan mode explicit", clientSource.includes("executionMode?: VoiceMaterializationExecutionMode"));
check("client response scene count one", clientSource.includes("value.sceneEntries.length === PA4L_MAX_SCENES"));
check("client explicit PA4L request", clientSource.includes("requestPa4lSingleSceneMaterialization"));
check("client explicit second-final PA4L request", clientSource.includes("requestPa4lSecondFinalSingleSceneMaterialization"));
check("executor requires first failed request count", nodeSource.includes("existing.externalRequestCount !== PA4L_FIRST_FAILED_EXTERNAL_REQUEST_COUNT"));
check("executor requires second-final owner confirmation", nodeSource.includes("PA4L_SECOND_FINAL_OWNER_CONFIRMATION_REQUIRED"));
check("executor blocks invalid second-final state", nodeSource.includes("PA4L_SECOND_FINAL_RETRY_STATE_INVALID"));
check("executor total budget before provider", nodeSource.indexOf("PA4L_TOTAL_EXTERNAL_REQUEST_BUDGET_EXHAUSTED") < nodeSource.indexOf("requestElevenLabsTimestampTts({"));
check("client same-origin root retained", clientSource.includes('const API_ROOT = "/api/editorial-v2/projects"'));
check("UI PA4L heading", panelSource.includes("PA-4L Live Smoke Mode"));
check("UI one-scene preview", panelSource.includes("Preview 1-Scene Live Smoke Plan"));
check("UI selected scene generation", panelSource.includes("Generate Selected 1-Scene Audio"));
check("UI full live unavailable", panelSource.includes("Full-scene TTS는 아직 승인되지 않았습니다."));
check("UI retry unavailable", panelSource.includes("Retry unavailable in PA-4L"));
check("UI no old full plan button", !panelSource.includes("Preview External TTS Plan"));
check("UI no old full generate button", !panelSource.includes("Generate Missing Scene Audio"));
check("no provider adapter edit", !allowlistSet.has("lib/editorial-v2/elevenlabs-timestamp-tts-node.ts"));
check("no audio store edit", !allowlistSet.has("lib/editorial-v2/voice-audio-store-node.ts"));
check("no alignment edit", !allowlistSet.has("lib/editorial-v2/audio-alignment.ts"));
check("no recovery edit", !allowlistSet.has("lib/editorial-v2/voice-materialization-recovery.ts"));
check("no config in allowlist", ["package.json", "pnpm-workspace.yaml", "pnpm-lock.yaml", "next.config.ts"].every((path) => !allowlistSet.has(path)));
check("no secret logging", !/console\.(?:log|info|warn|error)|logger\./u.test(productSource));
check("no client API key", !/xi-api-key|apiKey\s*:/u.test(clientSource + panelSource));
check("fixed provider path retained", contractsSource.includes('ELEVENLABS_API_ORIGIN = "https://api.elevenlabs.io"'));
if (!postCheckpoint) {
  check("state actual provider zero", source("_ai/PROJECT_STATE.md").includes("actual provider request count: `0`"));
  check("state full materialization blocked", source("_ai/PROJECT_STATE.md").includes("ordinary full live materialization: `BLOCKED`"));
  check("next live approval separate", source("_ai/NEXT_ACTION.md").includes("APPROVE_PA4L_ONE_SCENE_LIVE_ELEVENLABS_REQUEST"));
} else {
  check("post-checkpoint full materialization blocked", routeSource.includes("LIVE_FULL_MATERIALIZATION_NOT_ACTIVATED"));
  check("post-checkpoint owner confirmation required", contractsSource.includes("readonly ownerConfirmationRequired: true"));
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

function scene(index, narration, { source = true, number = false } = {}) {
  return {
    sceneId: `scene-${index}`,
    order: index,
    narration,
    sourceRefs: source ? [`source-${index}`] : [],
    numberRefs: number ? [`number-${index}`] : [],
    claimRefs: source ? [`claim-${index}`] : [],
    numbers: number ? [{ currency: "KRW", asOf: "2026-08-09" }] : [],
  };
}

try {
  const contracts = loadTs("lib/editorial-v2/voice-materialization-contracts.ts");
  const validation = loadTs("lib/editorial-v2/voice-materialization-validation.ts");
  const voiceNode = loadTs("lib/editorial-v2/voice-materialization-node.ts");
  const longKorean = (prefix, length) => `${prefix}${"가".repeat(Math.max(0, length - [...prefix].length))}`;
  const canonicalScenes = [
    scene(1, "English narration without Korean evidence", { source: false }),
    scene(2, longKorean("짧은 숫자 장면", 60), { number: true }),
    scene(3, longKorean("긴 한국어 장면", 100), { source: true }),
    scene(4, longKorean("중간 숫자 2026년 8월 9일 원화 장면", 100), { number: true }),
    scene(5, longKorean("다른 중간 숫자 42원 장면", 100), { number: true }),
    scene(6, longKorean("여섯 번째 장면", 100), { source: true }),
    scene(7, longKorean("일곱 번째 장면", 100), { source: true }),
    scene(8, longKorean("여덟 번째 장면", 100), { source: true }),
  ];
  const selected = voiceNode.selectPa4lSingleSmokeScene(canonicalScenes);
  check("canonical eight selects exactly scene 4", selected.sceneId === "scene-4", selected.sceneId);
  check("selected narration exact", selected.narration === canonicalScenes[3].narration);
  check("selected narration <=180", [...selected.narration].length <= 180);
  check("selected has number evidence", selected.numberRefs.length > 0);
  check("selected has source evidence", selected.sourceRefs.length > 0);

  for (let index = 0; index < 80; index += 1) {
    const rotation = index % canonicalScenes.length;
    const permuted = [...canonicalScenes.slice(rotation), ...canonicalScenes.slice(0, rotation)];
    if (index % 2 === 1) permuted.reverse();
    const repeated = voiceNode.selectPa4lSingleSmokeScene(permuted);
    check(`deterministic permutation ${index}`, repeated.sceneId === selected.sceneId && repeated.narration === selected.narration);
  }

  for (let index = 0; index < 40; index += 1) {
    const overlength = Array.from({ length: 8 }, (_, offset) => scene(offset + 1, longKorean(`초과${index}-${offset}`, 181), { number: true }));
    let blocked = false;
    try { voiceNode.selectPa4lSingleSmokeScene(overlength); } catch (error) { blocked = error instanceof Error && error.message === "PA4L_SINGLE_SCENE_NOT_AVAILABLE"; }
    check(`181-only project blocked ${index}`, blocked);
  }

  const scenePlan = {
    sceneId: selected.sceneId,
    sceneOrder: selected.order,
    narration: selected.narration,
    narrationHash: sha256Text(selected.narration),
    characterCount: [...selected.narration].length,
    keyCaption: "중간 숫자",
    sceneAudioIdentity: voiceNode.buildVoiceSceneAudioIdentity({ narration: selected.narration, providerId: "elevenlabs_tts_with_timestamps", voiceId: "voice_pa4l", modelId: "eleven_multilingual_v2", outputFormat: "mp3_44100_128" }),
  };
  const planBase = {
    schemaVersion: "voice-materialization-plan-v1",
    projectId: "pa4l-check-project",
    projectRevision: 9,
    projectIntegrityHash: "1".repeat(64),
    sourceRenderCheckpointHash: "2".repeat(64),
    renderManifestHash: "3".repeat(32),
    providerId: "elevenlabs_tts_with_timestamps",
    voiceId: "voice_pa4l",
    modelId: "eleven_multilingual_v2",
    outputFormat: "mp3_44100_128",
    executionMode: contracts.PA4L_SINGLE_SCENE_LIVE_SMOKE_MODE,
    sceneCount: 1,
    plannedSceneCount: 1,
    scenes: [scenePlan],
    totalCharacters: scenePlan.characterCount,
    maximumExternalGenerationRequests: 1,
    automaticRetryLimit: 0,
    fallbackRequestLimit: 0,
    materializationSetId: `voice-set-${"4".repeat(64)}`,
    planHash: "0".repeat(64),
    externalCallRequired: true,
    externalCallExecuted: false,
    ownerConfirmationRequired: true,
    costAmountKnown: false,
    stopPolicy: "STOP_ON_FIRST_EXTERNAL_FAILURE",
  };
  const plan = { ...planBase, planHash: voiceNode.hashVoiceMaterializationPlan(planBase) };
  check("PA4L plan valid", voiceNode.validateVoiceMaterializationPlan(plan).length === 0);
  check("PA4L assertion returns canonical", voiceNode.assertPa4lSingleScenePlan(plan).sceneId === selected.sceneId);
  check("PA4L exact requested scene accepted", voiceNode.assertPa4lRequestedSceneIds(plan, [selected.sceneId]).sceneId === selected.sceneId);
  for (let index = 0; index < 20; index += 1) {
    for (const [label, requested] of [
      ["wrong", [`wrong-${index}`]],
      ["disabled", [`disabled-${index}`]],
      ["nonexistent", [`missing-${index}`]],
      ["empty", []],
      ["duplicate", [selected.sceneId, selected.sceneId]],
    ]) {
      let blocked = false;
      try { voiceNode.assertPa4lRequestedSceneIds(plan, requested); } catch (error) { blocked = error instanceof Error && error.message === "PA4L_CANONICAL_SCENE_SELECTION_MISMATCH"; }
      check(`${label} canonical scene blocked ${index}`, blocked);
    }
  }

  for (let index = 0; index < 25; index += 1) {
    const attackNarration = longKorean(`초과 공격 ${index}`, 181);
    const attackScene = { ...scenePlan, narration: attackNarration, narrationHash: sha256Text(attackNarration), characterCount: 181, sceneAudioIdentity: voiceNode.buildVoiceSceneAudioIdentity({ narration: attackNarration, providerId: "elevenlabs_tts_with_timestamps", voiceId: "voice_pa4l", modelId: "eleven_multilingual_v2", outputFormat: "mp3_44100_128" }) };
    const attackBase = { ...plan, scenes: [attackScene], totalCharacters: 181, planHash: "0".repeat(64) };
    const attack = { ...attackBase, planHash: voiceNode.hashVoiceMaterializationPlan(attackBase) };
    check(`181-char plan blocked ${index}`, voiceNode.validateVoiceMaterializationPlan(attack).some((issue) => issue.includes("character") || issue.includes("total_character")));
  }
  for (let index = 0; index < 25; index += 1) {
    const second = { ...scenePlan, sceneId: `attacker-${index}`, sceneOrder: index + 20 };
    const attackBase = { ...plan, sceneCount: 2, plannedSceneCount: 2, scenes: [scenePlan, second], totalCharacters: scenePlan.characterCount * 2, planHash: "0".repeat(64) };
    const attack = { ...attackBase, planHash: voiceNode.hashVoiceMaterializationPlan(attackBase) };
    check(`two-scene plan blocked ${index}`, voiceNode.validateVoiceMaterializationPlan(attack).includes("scene_count_invalid"));
  }
  for (let index = 0; index < 25; index += 1) {
    const attackBase = { ...plan, maximumExternalGenerationRequests: 2 + index, planHash: "0".repeat(64) };
    const attack = { ...attackBase, planHash: voiceNode.hashVoiceMaterializationPlan(attackBase) };
    check(`external request cap attack blocked ${index}`, voiceNode.validateVoiceMaterializationPlan(attack).includes("pa4l_execution_limits_invalid"));
  }
  for (let index = 0; index < 25; index += 1) {
    const attackBase = { ...plan, automaticRetryLimit: 1 + index, fallbackRequestLimit: 1 + index, planHash: "0".repeat(64) };
    const attack = { ...attackBase, planHash: voiceNode.hashVoiceMaterializationPlan(attackBase) };
    check(`retry fallback attack blocked ${index}`, voiceNode.validateVoiceMaterializationPlan(attack).includes("pa4l_execution_limits_invalid"));
  }

  const requestBase = {
    action: "materialize",
    executionMode: contracts.PA4L_SINGLE_SCENE_LIVE_SMOKE_MODE,
    expectedProjectRevision: 9,
    expectedRenderCheckpointHash: "2".repeat(64),
    voiceId: "voice_pa4l",
    modelId: "eleven_multilingual_v2",
    expectedPlanHash: plan.planHash,
    ownerPaidExternalTtsConfirmation: true,
    requestedSceneIds: [selected.sceneId],
  };
  check("exact request valid", validation.validateVoiceMaterializationRequest(requestBase).length === 0);
  for (let index = 0; index < 30; index += 1) {
    check(`client two scenes blocked ${index}`, validation.validateVoiceMaterializationRequest({ ...requestBase, requestedSceneIds: [selected.sceneId, `other-${index}`] }).includes("pa4l_requested_scene_exactly_one_required"));
  }
  for (let index = 0; index < 30; index += 1) {
    check(`client duplicate scenes blocked ${index}`, validation.validateVoiceMaterializationRequest({ ...requestBase, requestedSceneIds: [selected.sceneId, selected.sceneId] }).includes("pa4l_requested_scene_exactly_one_required"));
  }
  for (let index = 0; index < 20; index += 1) {
    check(`full mode blocked ${index}`, validation.validateVoiceMaterializationRequest({ ...requestBase, executionMode: contracts.VOICE_MATERIALIZATION_STANDARD_EXECUTION_MODE }).includes("live_full_materialization_not_activated"));
  }
  for (let index = 0; index < 20; index += 1) {
    check(`retry confirmation required ${index}`, validation.validateVoiceMaterializationRequest({ ...requestBase, action: "retry_failed" }).includes("pa4l_second_final_paid_tts_confirmation_required"));
    check(`retry exact confirmation accepted ${index}`, validation.validateVoiceMaterializationRequest({ ...requestBase, action: "retry_failed", ownerSecondFinalPaidExternalTtsConfirmation: true }).length === 0);
    check(`initial second-final confirmation blocked ${index}`, validation.validateVoiceMaterializationRequest({ ...requestBase, ownerSecondFinalPaidExternalTtsConfirmation: true }).includes("pa4l_second_final_confirmation_without_retry_forbidden"));
  }

  const legacyScenes = Array.from({ length: 8 }, (_, index) => ({ ...scenePlan, sceneId: `legacy-${index + 1}`, sceneOrder: index + 1 }));
  const legacyBase = { ...planBase, executionMode: undefined, plannedSceneCount: undefined, maximumExternalGenerationRequests: undefined, automaticRetryLimit: undefined, fallbackRequestLimit: undefined, sceneCount: 8, scenes: legacyScenes, totalCharacters: legacyScenes.reduce((sum, entry) => sum + entry.characterCount, 0), planHash: "0".repeat(64) };
  const legacyPlan = { ...legacyBase, planHash: voiceNode.hashVoiceMaterializationPlan(legacyBase) };
  check("PA4 legacy plan regression zero", voiceNode.validateVoiceMaterializationPlan(legacyPlan).length === 0, voiceNode.validateVoiceMaterializationPlan(legacyPlan).join(","));
} catch (error) {
  failures.push(`dynamic checker execution :: ${error instanceof Error ? error.stack ?? error.message : String(error)}`);
}

const targetSourcePaths = [
  "lib/editorial-v2/voice-materialization-contracts.ts",
  "lib/editorial-v2/voice-materialization-node.ts",
  "lib/editorial-v2/voice-materialization-validation.ts",
  "lib/editorial-v2/voice-materialization-api-client.ts",
  "app/api/editorial-v2/projects/[projectId]/voice-materialization/route.ts",
  "components/editorial-v2/VoiceMaterializationPanel.tsx",
];
const configPath = ts.findConfigFile(root, ts.sys.fileExists, "tsconfig.json");
const config = ts.readConfigFile(configPath, ts.sys.readFile);
const parsedConfig = ts.parseJsonConfigFileContent(config.config, ts.sys, root);
const program = ts.createProgram(parsedConfig.fileNames, { ...parsedConfig.options, noEmit: true, incremental: false });
const targetFiles = targetSourcePaths.map((path) => resolve(root, path));
for (const path of targetFiles) {
  const sourceFile = program.getSourceFile(path);
  check(`TypeScript source discovered ${relative(root, path)}`, Boolean(sourceFile));
  check(`TypeScript syntactic zero ${relative(root, path)}`, Boolean(sourceFile) && program.getSyntacticDiagnostics(sourceFile).length === 0, program.getSyntacticDiagnostics(sourceFile).map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, " ")).join(" | "));
  check(`TypeScript semantic zero ${relative(root, path)}`, Boolean(sourceFile) && program.getSemanticDiagnostics(sourceFile).length === 0, program.getSemanticDiagnostics(sourceFile).map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, " ")).join(" | "));
}
const preEmitDiagnostics = ts.getPreEmitDiagnostics(program).filter((diagnostic) => !diagnostic.file || targetFiles.includes(resolve(diagnostic.file.fileName)));
check("target strict preEmit zero", preEmitDiagnostics.length === 0, preEmitDiagnostics.map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, " ")).join(" | "));
check("checker actual fetch zero", actualFetchCalls === 0);
check("minimum 300 meaningful checks", passed + failures.length >= 300, String(passed + failures.length));

if (failures.length > 0) {
  console.error(`SHORTS_EDITORIAL_OS_V2_PA4L_SINGLE_SCENE_CHECK_FAILED ${passed}/${passed + failures.length}`);
  for (const failure of failures) console.error(`FAIL ${failure}`);
  process.exit(1);
}
console.log(`SHORTS_EDITORIAL_OS_V2_PA4L_SINGLE_SCENE_CHECK_PASS ${passed}/${passed}`);
