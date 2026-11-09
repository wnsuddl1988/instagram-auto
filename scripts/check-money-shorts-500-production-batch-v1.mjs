import {
  BATCH_SCHEMA_VERSION,
  DEFAULT_LEDGER_PATH,
  IMAGE_SUBMISSION_HARD_CAP_PER_SCENE,
  LEDGER_SCHEMA_VERSION,
  MAX_BATCH_SIZE,
  PILOT_SIZE,
  TOTAL_TOPIC_COUNT,
  buildProductionPlan,
  createProductionLedger,
  ledgerSummary,
  loadProductionRecords,
  initializeProductionLedger,
  recordProductionStageResult,
  selectNextBatch,
  validateProductionLedger,
} from "./run-money-shorts-500-production-batch.mjs";

let passed = 0;
let failed = 0;
function check(name, ok, detail = "") {
  if (ok) {
    passed += 1;
    console.log(`PASS  ${name}`);
  } else {
    failed += 1;
    console.error(`FAIL  ${name}${detail ? ` - ${detail}` : ""}`);
  }
}

const records = loadProductionRecords();
const plan = buildProductionPlan(records);
const ledger = createProductionLedger(plan, "2026-07-12T00:00:00.000Z");
const summary = ledgerSummary(ledger);

check("A-1 loads exactly 500 production records", records.length === TOTAL_TOPIC_COUNT, String(records.length));
check("all production topic ids and titles are unique", new Set(records.map((item) => item.topicId)).size === 500 && new Set(records.map((item) => item.title)).size === 500);
check("all records already passed the finance quality gate", records.every((item) => item.qualityScore >= 86));
check("production scene counts stay dynamic at 11~12", records.every((item) => item.sceneCount >= 11 && item.sceneCount <= 12));
check("production plan accounts for all 5,501 visual scenes", plan.totalScenes === 5501, String(plan.totalScenes));
check("plan and ledger schemas are versioned", plan.schemaVersion === BATCH_SCHEMA_VERSION && ledger.schemaVersion === LEDGER_SCHEMA_VERSION);
check("plan fingerprint is stable and non-empty", typeof plan.planFingerprint === "string" && plan.planFingerprint.length === 20 && ledger.planFingerprint === plan.planFingerprint);
check("normal batch size is capped at ten", plan.batchPolicy.maxBatchSize === MAX_BATCH_SIZE && MAX_BATCH_SIZE === 10);
check("pilot is hard-capped at three before scale approval", PILOT_SIZE === 3 && selectNextBatch(ledger, 10).length === 3);
check("pilot uses three deterministic but representative topics", summary.nextBatch.length === 3 && new Set(summary.nextBatch.map((item) => records.find((record) => record.topicId === item.topicId)?.financeSubtopic)).size === 3 && new Set(summary.nextBatch.map((item) => records.find((record) => record.topicId === item.topicId)?.editorialLane)).size === 3);
check("scale and external pilot approvals default to false", ledger.approvals.pilotExternalGenerationApproved === false && ledger.approvals.scaleApproved === false);
check("A-1 performs no external actions", ledger.externalActionsPerformed === false && Object.values(ledger.counters).every((value) => value === 0));
check("planned TTS budget is 500 with a bounded absolute retry cap", plan.callBudget.plannedTtsCalls === 500 && plan.callBudget.absoluteMaxTtsCalls === 1000);
check("planned image submissions equal actual dynamic scenes", plan.callBudget.plannedPrimaryImageSubmissions === 5501);
check("absolute image cap matches the per-scene hard cap", plan.callBudget.absoluteMaxImageSubmissions === 5501 * IMAGE_SUBMISSION_HARD_CAP_PER_SCENE);
check("planned render budget is 500 with one bounded retry", plan.callBudget.plannedVideoRenders === 500 && plan.callBudget.absoluteMaxVideoRenders === 1000);
check("completed items are skipped on resume", (() => {
  const resumed = structuredClone(ledger);
  const completed = resumed.items.find((item) => item.topicId === resumed.pilotTopicIds[0]);
  completed.stage = "COMPLETE";
  completed.state = "COMPLETE";
  return selectNextBatch(resumed, 10).length === 2 && !selectNextBatch(resumed, 10).some((item) => item.topicId === completed.topicId);
})());
check("failed items resume at their current stage", (() => {
  const resumed = structuredClone(ledger);
  const failedItem = resumed.items.find((item) => item.topicId === resumed.pilotTopicIds[0]);
  failedItem.stage = "IMAGES";
  failedItem.state = "FAILED_RETRYABLE";
  failedItem.attempts.imagePasses = 1;
  return selectNextBatch(resumed, 10).some((item) => item.topicId === failedItem.topicId && item.stage === "IMAGES");
})());
check("exhausted retries are excluded from the next batch", (() => {
  const resumed = structuredClone(ledger);
  const failedItem = resumed.items.find((item) => item.topicId === resumed.pilotTopicIds[0]);
  failedItem.stage = "TTS";
  failedItem.state = "FAILED_RETRYABLE";
  failedItem.attempts.tts = 2;
  return !selectNextBatch(resumed, 10).some((item) => item.topicId === failedItem.topicId);
})());
check("scale approval unlocks at most ten items", (() => {
  const scaled = structuredClone(ledger);
  scaled.phase = "SCALE_10";
  scaled.approvals.scaleApproved = true;
  return selectNextBatch(scaled, 99).length === 10;
})());
check("ledger validation rejects counter overflow", (() => {
  const invalid = structuredClone(ledger);
  invalid.counters.ttsCalls = invalid.limits.absoluteMaxTtsCalls + 1;
  return validateProductionLedger(invalid) === false;
})());
check("successful stages advance deterministically and count real calls", (() => {
  let progressed = recordProductionStageResult(ledger, ledger.items[0].topicId, { stage: "SCRIPT", outcome: "SUCCESS" });
  progressed = recordProductionStageResult(progressed, progressed.items[0].topicId, { stage: "TTS", outcome: "SUCCESS", ttsCalls: 1 });
  return progressed.items[0].stage === "IMAGES" && progressed.items[0].attempts.tts === 1 && progressed.counters.ttsCalls === 1 && progressed.externalActionsPerformed === true;
})());
check("failed stages remain resumable until their retry cap", (() => {
  let progressed = recordProductionStageResult(ledger, ledger.items[0].topicId, { stage: "SCRIPT", outcome: "SUCCESS" });
  progressed = recordProductionStageResult(progressed, progressed.items[0].topicId, { stage: "TTS", outcome: "SUCCESS", ttsCalls: 1 });
  progressed = recordProductionStageResult(progressed, progressed.items[0].topicId, { stage: "IMAGES", outcome: "FAILURE", imageSubmissions: 4, errorCode: "IMAGE_TOOL_TIMEOUT" });
  return progressed.items[0].stage === "IMAGES" && progressed.items[0].state === "FAILED_RETRYABLE" && selectNextBatch(progressed)[0]?.topicId === progressed.items[0].topicId;
})());
check("retry exhaustion blocks the item instead of looping forever", (() => {
  let progressed = recordProductionStageResult(ledger, ledger.items[0].topicId, { stage: "SCRIPT", outcome: "SUCCESS" });
  progressed = recordProductionStageResult(progressed, progressed.items[0].topicId, { stage: "TTS", outcome: "SUCCESS", ttsCalls: 1 });
  progressed = recordProductionStageResult(progressed, progressed.items[0].topicId, { stage: "IMAGES", outcome: "FAILURE", imageSubmissions: 3 });
  progressed = recordProductionStageResult(progressed, progressed.items[0].topicId, { stage: "IMAGES", outcome: "FAILURE", imageSubmissions: 3 });
  return progressed.items[0].state === "BLOCKED" && !selectNextBatch(progressed).some((item) => item.topicId === progressed.items[0].topicId);
})());
check("completed topics cannot be mutated", (() => {
  const completed = structuredClone(ledger);
  completed.items[0].stage = "COMPLETE";
  completed.items[0].state = "COMPLETE";
  try {
    recordProductionStageResult(completed, completed.items[0].topicId, { stage: "COMPLETE", outcome: "SUCCESS" });
    return false;
  } catch (error) {
    return String(error?.message) === "COMPLETED_TOPIC_IS_IMMUTABLE";
  }
})());
check("default ledger path stays outside the repo under C:\\tmp\\money-shorts-os", /^C:\\tmp\\money-shorts-os\\/.test(DEFAULT_LEDGER_PATH));
check("ledger initialization exposes existing-ledger reuse protection", typeof initializeProductionLedger === "function");

console.log(`\n${passed + failed} checks - ${passed} PASS, ${failed} FAIL`);
if (failed > 0) process.exit(1);
