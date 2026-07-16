import {
  MONEY_SHORTS_AUTOMATION_QUEUE_PLANNER_VERSION,
  planMoneyShortsAutomationQueueRun,
} from "../lib/money-shorts-automation-queue-planner.mjs";
import { buildMoneyShortsResumablePlan } from "../lib/money-shorts-resumable-orchestrator.mjs";

let passed = 0;
let failed = 0;
function check(name, condition) {
  if (condition) {
    passed += 1;
    console.log(`PASS  ${name}`);
  } else {
    failed += 1;
    console.error(`FAIL  ${name}`);
  }
}

const base = {
  scriptReady: true,
  characterReady: true,
  realTtsReady: true,
  generatedImageCount: 8,
  expectedImageCount: 8,
  realImagesReady: true,
  flowState: "not_prepared",
  flowReadyForRender: false,
  finalVideoReady: false,
  mediaQualityGateOk: false,
  publishPreflightReady: false,
  publishedAllParts: false,
};

function job(topicId, createdAt, overrides = {}) {
  return {
    jobId: `job-${topicId}`,
    topicId,
    title: `제목 ${topicId}`,
    createdAt,
    livePlan: buildMoneyShortsResumablePlan({ topicId, ...base, ...(overrides.plan ?? {}) }),
    executionGuard: { status: overrides.guardStatus ?? "available", receipt: null },
  };
}

const newest = job("newest", "2026-07-17T04:00:00.000Z");
const oldest = job("oldest", "2026-07-17T03:00:00.000Z");
const source = [newest, oldest];
const first = planMoneyShortsAutomationQueueRun({ jobs: source });
check("planner schema is versioned", first.schemaVersion === MONEY_SHORTS_AUTOMATION_QUEUE_PLANNER_VERSION);
check("oldest eligible queue job is selected", first.selected?.topicId === "oldest" && first.selected.action === "flowMotionPrepare");
check("planner selects at most one job", first.selectionCount === 1 && first.evaluations.filter((item) => item.selected).length === 1);
check("later eligible job explains its deterministic wait", first.evaluations.find((item) => item.topicId === "newest")?.decisionReason.includes("후순위") === true);
check("input queue order is not mutated", source[0].topicId === "newest" && source[1].topicId === "oldest");
check("dry-run reports zero execution and zero receipt", first.safety.actionExecuted === false && first.safety.executionReceiptCreated === false);
check("dry-run disables timer, worker, retry, paid, external, upload, and publication", Object.values(first.safety).every((value) => value === false));

const tied = planMoneyShortsAutomationQueueRun({
  jobs: [job("topic-b", "2026-07-17T03:00:00.000Z"), job("topic-a", "2026-07-17T03:00:00.000Z")],
});
check("equal timestamps use topic id as deterministic tie-breaker", tied.selected?.topicId === "topic-a");

const ownerGate = job("owner-gate", "2026-07-17T01:00:00.000Z", {
  plan: { generatedImageCount: 0, realImagesReady: false },
});
const completed = job("completed", "2026-07-17T01:01:00.000Z", {
  plan: {
    flowState: "render_ready",
    flowReadyForRender: true,
    finalVideoReady: true,
    mediaQualityGateOk: true,
    publishPreflightReady: true,
    publishedAllParts: true,
  },
});
const inFlight = job("in-flight", "2026-07-17T01:02:00.000Z", { guardStatus: "topic_in_flight" });
const manualReview = job("manual-review", "2026-07-17T01:03:00.000Z", { guardStatus: "manual_review_required" });
const identical = job("identical", "2026-07-17T01:04:00.000Z", { guardStatus: "identical_attempt_recorded" });
const unavailable = job("unavailable", "2026-07-17T01:05:00.000Z", { guardStatus: "store_unavailable" });
const fallback = job("fallback", "2026-07-17T02:00:00.000Z");
const skipped = planMoneyShortsAutomationQueueRun({
  jobs: [fallback, unavailable, identical, manualReview, inFlight, completed, ownerGate],
});
const codes = new Map(skipped.evaluations.map((item) => [item.topicId, item.eligibilityCode]));
check("Owner-gated job is skipped", codes.get("owner-gate") === "owner_gate_required");
check("completed job is skipped", codes.get("completed") === "completed");
check("in-flight job is skipped", codes.get("in-flight") === "topic_in_flight");
check("manual-review job is skipped", codes.get("manual-review") === "manual_review_required");
check("identical recorded attempt is skipped", codes.get("identical") === "identical_attempt_recorded");
check("unavailable receipt store is skipped", codes.get("unavailable") === "store_unavailable");
check("oldest remaining eligible job is selected after skips", skipped.selected?.topicId === "fallback");

const none = planMoneyShortsAutomationQueueRun({ jobs: [ownerGate, completed, inFlight] });
check("no eligible job yields a zero-selection preview", none.selected == null && none.selectionCount === 0);

let missingJobsRejected = false;
try {
  planMoneyShortsAutomationQueueRun();
} catch (error) {
  missingJobsRejected = error instanceof Error && error.message === "automation_queue_planner_jobs_required";
}
check("missing job list is rejected", missingJobsRejected);

console.log(`\n${passed + failed} checks - ${passed} PASS, ${failed} FAIL`);
if (failed > 0) process.exit(1);
