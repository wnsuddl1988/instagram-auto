import { createRequire } from "node:module";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url); const ts = require("typescript"); const root = resolve(dirname(fileURLToPath(import.meta.url)), ".."); const cache = new Map();
const PROJECT_ID = "shorts-editorial-os-v2-20-pilot-8e9ba35c13b4";
const EXPECTED_PREFLIGHT_HASH = "f5cf4fc51b6994c883ae0a089885454c3b1711afde28b11ea3b34b6e970cb7ed";
const EXPECTED_PLAN_HASH = "f81eeabaacc0a98e9b1d846bc3ddc4fb0fc61ab50cf9617d0dbe8c10a829e54a";
const EXPECTED_NEW_SCENES = ["selected-angle:revolving-balance-not-erased:scene:01", "selected-angle:revolving-balance-not-erased:scene:02", "selected-angle:revolving-balance-not-erased:scene:03", "selected-angle:revolving-balance-not-erased:scene:05", "selected-angle:revolving-balance-not-erased:scene:06", "selected-angle:revolving-balance-not-erased:scene:07", "selected-angle:revolving-balance-not-erased:scene:08"];
function resolveTs(from, specifier) { const base = resolve(dirname(from), specifier); for (const path of [base, `${base}.ts`, `${base}.tsx`]) if (existsSync(path)) return path; throw new Error(`cannot resolve ${specifier}`); }
function loadTs(path) { const absolute = resolve(root, path); if (cache.has(absolute)) return cache.get(absolute).exports; const module = { exports: {} }; cache.set(absolute, module); const output = ts.transpileModule(readFileSync(absolute, "utf8"), { fileName: absolute, compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText; const localRequire = (specifier) => specifier.startsWith(".") ? loadTs(resolveTs(absolute, specifier)) : require(specifier); new Function("require", "module", "exports", "__filename", "__dirname", output)(localRequire, module, module.exports, absolute, dirname(absolute)); return module.exports; }

function loadOnlyElevenLabsApiKeyFromLocalEnv() {
  const envPath = join(root, ".env.local");
  if (!existsSync(envPath)) return "";
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*ELEVENLABS_API_KEY\s*=\s*(.*)$/);
    if (!match) continue;
    const value = match[1].trim();
    return value.length >= 2 && ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) ? value.slice(1, -1) : value;
  }
  return "";
}

const persistence = loadTs("lib/editorial-v2/persistence-data-root.ts"); const store = loadTs("lib/editorial-v2/project-store-node.ts"); const voice = loadTs("lib/editorial-v2/voice-materialization-node.ts"); const pa5b = loadTs("lib/editorial-v2/pa5b-full-production-candidate-node.ts");
const configuration = persistence.resolveEditorialV2LocalStoreConfiguration();
const apiKey = process.env.ELEVENLABS_API_KEY || loadOnlyElevenLabsApiKeyFromLocalEnv();
if (!apiKey) throw new Error("PA5B_ELEVENLABS_CREDENTIAL_MISSING");
const preflight = await pa5b.buildPa5bFullProductionPreflight(configuration, PROJECT_ID);
if (preflight.preflightHash !== EXPECTED_PREFLIGHT_HASH || preflight.planHash !== EXPECTED_PLAN_HASH || preflight.expectedMaximumTtsRequests !== EXPECTED_NEW_SCENES.length || preflight.newTtsSceneIds.join("|") !== EXPECTED_NEW_SCENES.join("|")) throw new Error("PA5B_APPROVED_PREFLIGHT_CHANGED");
if (preflight.automaticRetryLimit !== 0 || preflight.fallbackLimit !== 0 || preflight.existingAudioSceneIds.length !== 1 || !preflight.existingAudioSceneIds[0]?.endsWith(":scene:04")) throw new Error("PA5B_APPROVED_GUARD_INVALID");
const projectResult = await store.readProject(configuration, PROJECT_ID);
if (!projectResult.ok || !projectResult.snapshot) throw new Error(`PA5B_PROJECT_UNAVAILABLE:${projectResult.status}`);
const plan = voice.buildVoiceMaterializationPlan(projectResult.snapshot, { voiceId: preflight.voiceId, modelId: preflight.modelId });
if (plan.planHash !== EXPECTED_PLAN_HASH || plan.sceneCount !== 8 || plan.automaticRetryLimit !== 0 || plan.fallbackRequestLimit !== 0) throw new Error("PA5B_EXECUTION_PLAN_INVALID");
const result = await voice.materializeVoiceMaterializationPlan(plan, { configuration, apiKey, mode: "initial" });
const generated = result.set.sceneEntries.filter((entry) => entry.status === "generated").map((entry) => entry.sceneId);
const scene04 = result.set.sceneEntries.find((entry) => entry.sceneId.endsWith(":scene:04"));
if (result.externalRequestsThisRun > EXPECTED_NEW_SCENES.length || result.set.automaticRetryCount !== 0 || result.set.failedSceneIds.length > 0 && result.set.failedSceneIds.some((sceneId) => !EXPECTED_NEW_SCENES.includes(sceneId))) throw new Error("PA5B_EXECUTION_BUDGET_OR_SCOPE_INVALID");
console.log(JSON.stringify({ ok: result.ok, message: result.message, externalRequestsThisRun: result.externalRequestsThisRun, automaticRetryCount: result.set.automaticRetryCount, fallbackCount: 0, generatedSceneIds: generated, cacheReusedScene04: scene04?.status === "cache_hit", completeSceneIds: result.set.completeSceneIds, failedSceneIds: result.set.failedSceneIds, pendingSceneIds: result.set.pendingSceneIds, materializationSetId: result.set.materializationSetId }, null, 2));
