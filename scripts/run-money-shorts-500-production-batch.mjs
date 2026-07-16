import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import ts from "typescript";

export const BATCH_SCHEMA_VERSION = "money_shorts_500_production_batch_v1";
export const LEDGER_SCHEMA_VERSION = "money_shorts_500_production_ledger_v1";
export const TOTAL_TOPIC_COUNT = 500;
export const PILOT_SIZE = 3;
export const MAX_BATCH_SIZE = 10;
export const MAX_TTS_ATTEMPTS_PER_TOPIC = 2;
export const MAX_IMAGE_PASSES_PER_TOPIC = 2;
export const MAX_VIDEO_ATTEMPTS_PER_TOPIC = 2;
export const IMAGE_SUBMISSION_HARD_CAP_PER_SCENE = 3;
export const DEFAULT_LEDGER_PATH = "C:\\tmp\\money-shorts-os\\production-500-v1\\production-ledger.json";

const ROOT = process.cwd();
const TMP_ROOT_RE = /^C:[\\/]+tmp[\\/]+money-shorts-os[\\/]+/i;
const STAGES = ["SCRIPT", "TTS", "IMAGES", "VIDEO", "QUALITY", "COMPLETE"];
const nodeRequire = createRequire(import.meta.url);

function transpile(filePath) {
  return ts.transpileModule(readFileSync(filePath, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
}

function loadTypescriptModule(filePath, requireFromModule = nodeRequire) {
  const sandboxModule = { exports: {} };
  vm.runInNewContext(transpile(filePath), {
    module: sandboxModule,
    exports: sandboxModule.exports,
    require: requireFromModule,
    console,
    Buffer,
    URL,
    TextEncoder,
    TextDecoder,
    structuredClone,
    setTimeout,
    clearTimeout,
    process: { cwd: () => ROOT, env: {} },
  }, { filename: filePath });
  return sandboxModule.exports;
}

export function loadProductionRecords() {
  const bankPath = path.join(ROOT, "lib", "finance-editorial-topic-bank.ts");
  const enginePath = path.join(ROOT, "lib", "finance-editorial-script-engine.ts");
  const visualPath = path.join(ROOT, "lib", "finance-visual-evidence-engine.ts");
  const discoveryPath = path.join(ROOT, "lib", "platform-discovery-metadata.ts");
  const characterCastPath = path.join(ROOT, "lib", "finance-character-cast.ts");
  const characterVoiceCastPath = path.join(ROOT, "lib", "finance-character-voice-cast.ts");
  const helperPath = path.join(ROOT, "lib", "owner-web-operator.ts");
  const veoSelectorPath = path.join(ROOT, "lib", "veo-scene-selector.ts");
  const flowMotionJobsPath = path.join(ROOT, "lib", "flow-motion-jobs.ts");
  const bank = loadTypescriptModule(bankPath);
  const engine = loadTypescriptModule(enginePath);
  const visual = loadTypescriptModule(visualPath);
  const discovery = loadTypescriptModule(discoveryPath);
  const veoSelector = loadTypescriptModule(veoSelectorPath);
  const flowMotionJobs = loadTypescriptModule(flowMotionJobsPath, (specifier) => {
    if (specifier === "./veo-scene-selector") return veoSelector;
    return nodeRequire(specifier);
  });
  const characterCastData = JSON.parse(readFileSync(path.join(ROOT, "lib", "finance-character-cast-data.json"), "utf8"));
  const characterVoiceCastData = JSON.parse(readFileSync(path.join(ROOT, "lib", "finance-character-voice-cast-data.json"), "utf8"));
  // owner-web-operator.ts imports this ESM-only helper for media-state checks.
  // The deterministic 500-topic planner does not enter those branches, so a
  // no-I/O contract stub keeps this CommonJS VM loader focused on topic planning.
  const manualVisualReview = {
    MONEY_SHORTS_MANUAL_VISUAL_REVIEW_EVIDENCE_FILE: "manual-visual-review.json",
    validateMoneyShortsManualVisualReview: () => ({
      passed: false,
      reason: "MANUAL_VISUAL_REVIEW_NOT_EVALUATED_IN_TOPIC_PLANNER",
      imageSetSha256: null,
    }),
  };
  const characterCast = loadTypescriptModule(characterCastPath, (specifier) => {
    if (specifier === "./finance-character-cast-data.json") return { default: characterCastData };
    if (specifier === "./finance-editorial-topic-bank") return bank;
    return nodeRequire(specifier);
  });
  const characterVoiceCast = loadTypescriptModule(characterVoiceCastPath, (specifier) => {
    if (specifier === "./finance-character-voice-cast-data.json") return { default: characterVoiceCastData };
    if (specifier === "./finance-character-cast") return characterCast;
    if (specifier === "./finance-editorial-topic-bank") return bank;
    return nodeRequire(specifier);
  });
  const helper = loadTypescriptModule(helperPath, (specifier) => {
    if (specifier === "./finance-editorial-topic-bank") return bank;
    if (specifier === "./finance-editorial-script-engine") return engine;
    if (specifier === "./finance-visual-evidence-engine") return visual;
    if (specifier === "./platform-discovery-metadata") return discovery;
    if (specifier === "./finance-character-cast") return characterCast;
    if (specifier === "./finance-character-voice-cast") return characterVoiceCast;
    if (specifier === "./money-shorts-manual-visual-review.mjs") return manualVisualReview;
    if (specifier === "./veo-scene-selector") return veoSelector;
    if (specifier === "./flow-motion-jobs") return flowMotionJobs;
    return nodeRequire(specifier);
  });
  const seeds = helper.buildFinanceEditorialTopicSeeds();
  return seeds.map((seed, index) => {
    const topicId = `gen-finance-${seed.slug}`;
    const script = helper.buildScriptFromGeneratedTopic({
      ...seed,
      topicId,
      category: "finance",
      source: "editorial_bank",
    });
    const gate = helper.getWizardScriptQualityGate(topicId, script);
    if (!gate.passed) throw new Error(`QUALITY_GATE_FAILED:${topicId}:${gate.reasons?.[0] ?? "unknown"}`);
    return {
      index: index + 1,
      topicId,
      title: script.title,
      financeSubtopic: seed.financeSubtopic,
      editorialLane: seed.editorialLane,
      sceneCount: script.scenes.length,
      qualityScore: gate.overallScore,
    };
  });
}

function fingerprint(value) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex").slice(0, 20);
}

function representativePilotTopicIds(records) {
  const subtopics = [...new Set(records.map((record) => record.financeSubtopic))];
  const targetSubtopics = [subtopics[0], subtopics[Math.floor(subtopics.length / 2)], subtopics[subtopics.length - 1]];
  const usedLanes = new Set();
  return targetSubtopics.map((subtopic) => {
    const candidates = records.filter((record) => record.financeSubtopic === subtopic);
    const selected = candidates.find((record) => !usedLanes.has(record.editorialLane)) ?? candidates[0];
    if (!selected) throw new Error("REPRESENTATIVE_PILOT_SELECTION_FAILED");
    usedLanes.add(selected.editorialLane);
    return selected.topicId;
  });
}

export function buildProductionPlan(records) {
  if (!Array.isArray(records) || records.length !== TOTAL_TOPIC_COUNT) {
    throw new Error(`PLAN_REQUIRES_${TOTAL_TOPIC_COUNT}_TOPICS`);
  }
  const topicIds = records.map((record) => record.topicId);
  if (new Set(topicIds).size !== TOTAL_TOPIC_COUNT) throw new Error("PLAN_TOPIC_IDS_NOT_UNIQUE");
  if (records.some((record) => record.sceneCount < 4 || record.sceneCount > 18)) {
    throw new Error("PLAN_SCENE_COUNT_OUT_OF_RANGE");
  }
  const totalScenes = records.reduce((sum, record) => sum + record.sceneCount, 0);
  const pilotTopicIds = representativePilotTopicIds(records);
  const items = records.map((record) => ({
    ...record,
    stage: "SCRIPT",
    state: "PENDING",
    attempts: { tts: 0, imagePasses: 0, video: 0 },
    lastErrorCode: null,
    updatedAt: null,
  }));
  return {
    schemaVersion: BATCH_SCHEMA_VERSION,
    planFingerprint: fingerprint(records.map(({ topicId, title, sceneCount }) => ({ topicId, title, sceneCount }))),
    topicCount: records.length,
    totalScenes,
    batchPolicy: {
      pilotSize: PILOT_SIZE,
      pilotTopicIds,
      maxBatchSize: MAX_BATCH_SIZE,
      pilotMustPassBeforeScale: true,
      completedItemsNeverReexecute: true,
      failedItemsResumeAtCurrentStage: true,
    },
    callBudget: {
      plannedTtsCalls: records.length,
      absoluteMaxTtsCalls: records.length * MAX_TTS_ATTEMPTS_PER_TOPIC,
      plannedPrimaryImageSubmissions: totalScenes,
      absoluteMaxImageSubmissions: totalScenes * IMAGE_SUBMISSION_HARD_CAP_PER_SCENE,
      plannedVideoRenders: records.length,
      absoluteMaxVideoRenders: records.length * MAX_VIDEO_ATTEMPTS_PER_TOPIC,
    },
    items,
  };
}

export function createProductionLedger(plan, now = new Date().toISOString()) {
  if (plan?.schemaVersion !== BATCH_SCHEMA_VERSION || plan.topicCount !== TOTAL_TOPIC_COUNT) {
    throw new Error("INVALID_PRODUCTION_PLAN");
  }
  return {
    schemaVersion: LEDGER_SCHEMA_VERSION,
    planFingerprint: plan.planFingerprint,
    createdAt: now,
    updatedAt: now,
    phase: "PILOT_3",
    pilotTopicIds: [...plan.batchPolicy.pilotTopicIds],
    approvals: { pilotExternalGenerationApproved: false, scaleApproved: false },
    counters: { ttsCalls: 0, imageSubmissions: 0, videoRenders: 0, qualityPassed: 0 },
    limits: plan.callBudget,
    items: structuredClone(plan.items),
    externalActionsPerformed: false,
  };
}

export function validateProductionLedger(ledger) {
  if (ledger?.schemaVersion !== LEDGER_SCHEMA_VERSION) return false;
  if (!Array.isArray(ledger.items) || ledger.items.length !== TOTAL_TOPIC_COUNT) return false;
  if (new Set(ledger.items.map((item) => item.topicId)).size !== TOTAL_TOPIC_COUNT) return false;
  if (!ledger.items.every((item) => STAGES.includes(item.stage))) return false;
  if (ledger.pilotTopicIds != null && (!Array.isArray(ledger.pilotTopicIds) || ledger.pilotTopicIds.length !== PILOT_SIZE)) return false;
  if (ledger.counters.ttsCalls > ledger.limits.absoluteMaxTtsCalls) return false;
  if (ledger.counters.imageSubmissions > ledger.limits.absoluteMaxImageSubmissions) return false;
  if (ledger.counters.videoRenders > ledger.limits.absoluteMaxVideoRenders) return false;
  return true;
}

function itemAttemptAvailable(item) {
  if (item.stage === "TTS") return item.attempts.tts < MAX_TTS_ATTEMPTS_PER_TOPIC;
  if (item.stage === "IMAGES") return item.attempts.imagePasses < MAX_IMAGE_PASSES_PER_TOPIC;
  if (item.stage === "VIDEO") return item.attempts.video < MAX_VIDEO_ATTEMPTS_PER_TOPIC;
  return true;
}

export function selectNextBatch(ledger, requestedSize = MAX_BATCH_SIZE) {
  if (!validateProductionLedger(ledger)) throw new Error("INVALID_PRODUCTION_LEDGER");
  const boundedRequested = Math.max(1, Math.min(MAX_BATCH_SIZE, Number(requestedSize) || MAX_BATCH_SIZE));
  const phaseLimit = ledger.phase === "PILOT_3" && !ledger.approvals.scaleApproved ? PILOT_SIZE : boundedRequested;
  const allowedTopicIds = ledger.phase === "PILOT_3" && !ledger.approvals.scaleApproved
    ? new Set(ledger.pilotTopicIds ?? ledger.items.slice(0, PILOT_SIZE).map((item) => item.topicId))
    : null;
  return ledger.items
    .filter((item) => (!allowedTopicIds || allowedTopicIds.has(item.topicId)))
    .filter((item) => item.stage !== "COMPLETE" && ["PENDING", "FAILED_RETRYABLE"].includes(item.state))
    .filter(itemAttemptAvailable)
    .slice(0, phaseLimit);
}

export function recordProductionStageResult(ledger, topicId, event, now = new Date().toISOString()) {
  if (!validateProductionLedger(ledger)) throw new Error("INVALID_PRODUCTION_LEDGER");
  const next = structuredClone(ledger);
  const item = next.items.find((candidate) => candidate.topicId === topicId);
  if (!item) throw new Error("LEDGER_TOPIC_NOT_FOUND");
  if (item.stage === "COMPLETE" || item.state === "COMPLETE") throw new Error("COMPLETED_TOPIC_IS_IMMUTABLE");
  if (event?.stage !== item.stage || !["SUCCESS", "FAILURE"].includes(event?.outcome)) {
    throw new Error("INVALID_STAGE_RESULT_EVENT");
  }
  const ttsCalls = Number(event.ttsCalls ?? 0);
  const imageSubmissions = Number(event.imageSubmissions ?? 0);
  const videoRenders = Number(event.videoRenders ?? 0);
  if (![ttsCalls, imageSubmissions, videoRenders].every((value) => Number.isInteger(value) && value >= 0)) {
    throw new Error("INVALID_STAGE_RESULT_COUNTERS");
  }
  if (item.stage === "TTS") item.attempts.tts += 1;
  if (item.stage === "IMAGES") item.attempts.imagePasses += 1;
  if (item.stage === "VIDEO") item.attempts.video += 1;
  next.counters.ttsCalls += ttsCalls;
  next.counters.imageSubmissions += imageSubmissions;
  next.counters.videoRenders += videoRenders;
  if (ttsCalls + imageSubmissions + videoRenders > 0) next.externalActionsPerformed = true;

  if (event.outcome === "SUCCESS") {
    const currentIndex = STAGES.indexOf(item.stage);
    item.stage = STAGES[currentIndex + 1];
    item.state = item.stage === "COMPLETE" ? "COMPLETE" : "PENDING";
    item.lastErrorCode = null;
    if (item.stage === "COMPLETE") next.counters.qualityPassed += 1;
  } else {
    item.lastErrorCode = String(event.errorCode ?? "UNKNOWN_STAGE_FAILURE").slice(0, 120);
    item.state = itemAttemptAvailable(item) ? "FAILED_RETRYABLE" : "BLOCKED";
  }
  item.updatedAt = now;
  next.updatedAt = now;
  if (!validateProductionLedger(next)) throw new Error("LEDGER_BUDGET_OR_STATE_VIOLATION");
  return next;
}

export function ledgerSummary(ledger) {
  if (!validateProductionLedger(ledger)) throw new Error("INVALID_PRODUCTION_LEDGER");
  const counts = {};
  for (const item of ledger.items) counts[`${item.stage}:${item.state}`] = (counts[`${item.stage}:${item.state}`] ?? 0) + 1;
  return {
    schemaVersion: ledger.schemaVersion,
    phase: ledger.phase,
    approvals: ledger.approvals,
    counters: ledger.counters,
    limits: ledger.limits,
    itemCounts: counts,
    nextBatch: selectNextBatch(ledger).map(({ index, topicId, title, sceneCount, stage }) => ({ index, topicId, title, sceneCount, stage })),
    externalActionsPerformed: ledger.externalActionsPerformed,
  };
}

function assertLedgerPath(filePath) {
  const resolved = path.resolve(filePath);
  if (!TMP_ROOT_RE.test(resolved) || !resolved.toLowerCase().endsWith(".json")) {
    throw new Error("LEDGER_PATH_MUST_BE_C_TMP_MONEY_SHORTS_JSON");
  }
  return resolved;
}

export function writeProductionLedger(filePath, ledger) {
  if (!validateProductionLedger(ledger)) throw new Error("INVALID_PRODUCTION_LEDGER");
  const resolved = assertLedgerPath(filePath);
  mkdirSync(path.dirname(resolved), { recursive: true });
  const tempPath = `${resolved}.tmp`;
  writeFileSync(tempPath, JSON.stringify(ledger, null, 2), "utf8");
  renameSync(tempPath, resolved);
  return resolved;
}

export function readProductionLedger(filePath) {
  const resolved = assertLedgerPath(filePath);
  if (!existsSync(resolved)) return null;
  const ledger = JSON.parse(readFileSync(resolved, "utf8"));
  if (!validateProductionLedger(ledger)) throw new Error("INVALID_PRODUCTION_LEDGER");
  return ledger;
}

export function initializeProductionLedger(filePath, plan, now = new Date().toISOString()) {
  const existing = readProductionLedger(filePath);
  if (existing) {
    if (existing.planFingerprint !== plan.planFingerprint) {
      throw new Error("LEDGER_PLAN_FINGERPRINT_MISMATCH");
    }
    if (!Array.isArray(existing.pilotTopicIds)) {
      existing.pilotTopicIds = [...plan.batchPolicy.pilotTopicIds];
      existing.updatedAt = now;
      writeProductionLedger(filePath, existing);
    }
    return { ledger: existing, path: assertLedgerPath(filePath), reusedExistingLedger: true };
  }
  const ledger = createProductionLedger(plan, now);
  return { ledger, path: writeProductionLedger(filePath, ledger), reusedExistingLedger: false };
}

function argValue(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] ?? null : null;
}

async function main() {
  if (process.argv.includes("--execute") || process.argv.includes("--arm")) {
    console.error("BLOCKED_A1_EXTERNAL_EXECUTION_NOT_WIRED: A-1 only builds and audits the local ledger.");
    process.exit(3);
  }
  const ledgerPath = argValue("--ledger") ?? DEFAULT_LEDGER_PATH;
  if (process.argv.includes("--status")) {
    const ledger = readProductionLedger(ledgerPath);
    if (!ledger) throw new Error("PRODUCTION_LEDGER_NOT_FOUND");
    console.log(JSON.stringify(ledgerSummary(ledger), null, 2));
    return;
  }
  const records = loadProductionRecords();
  const plan = buildProductionPlan(records);
  let ledger = createProductionLedger(plan);
  const output = { plan: { ...plan, items: undefined }, ledger: ledgerSummary(ledger) };
  if (process.argv.includes("--write-ledger")) {
    const initialized = initializeProductionLedger(ledgerPath, plan);
    ledger = initialized.ledger;
    output.ledger = ledgerSummary(ledger);
    output.ledgerPath = initialized.path;
    output.reusedExistingLedger = initialized.reusedExistingLedger;
  }
  console.log(JSON.stringify(output, null, 2));
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
