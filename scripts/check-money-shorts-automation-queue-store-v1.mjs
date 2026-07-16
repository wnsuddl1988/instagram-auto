import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  MONEY_SHORTS_AUTOMATION_QUEUE_VERSION,
  archiveCompletedMoneyShortsAutomationJob,
  enqueueMoneyShortsAutomationJob,
  moveMoneyShortsAutomationJobPriority,
  pauseMoneyShortsAutomationJob,
  readMoneyShortsAutomationQueue,
  removeMoneyShortsAutomationJob,
  resumeMoneyShortsAutomationJob,
  syncMoneyShortsAutomationJob,
} from "../lib/money-shorts-automation-queue-store.mjs";
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

function planFor(topicId, overrides = {}) {
  return buildMoneyShortsResumablePlan({
    topicId,
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
    ...overrides,
  });
}

const rootDir = mkdtempSync(join(tmpdir(), "money-shorts-automation-queue-"));
const topicA = "queue-topic-a";
const topicB = "queue-topic-b";
const planA = planFor(topicA);
const planAAfter = planFor(topicA, { flowState: "render_ready", flowReadyForRender: true });
const planB = planFor(topicB);
const planBComplete = planFor(topicB, {
  flowState: "render_ready",
  flowReadyForRender: true,
  finalVideoReady: true,
  mediaQualityGateOk: true,
  publishPreflightReady: true,
  publishedAllParts: true,
});

try {
  check("queue schema is versioned", MONEY_SHORTS_AUTOMATION_QUEUE_VERSION === "money_shorts_automation_queue_v1");
  const empty = readMoneyShortsAutomationQueue({ rootDir });
  check("missing queue file reconstructs an empty queue", empty.jobs.length === 0 && empty.updatedAt == null);

  const queuedA = enqueueMoneyShortsAutomationJob({
    topicId: topicA,
    title: "  첫 번째   주제  ",
    plan: planA,
    rootDir,
    now: () => "2026-07-17T03:00:00.000Z",
    mutationId: "mutation-a",
  });
  check("Owner-selected topic is persisted once", queuedA.jobs.length === 1 && queuedA.jobs[0].topicId === topicA);
  check("queue normalizes title and stores current gate", queuedA.jobs[0].title === "첫 번째 주제" && queuedA.jobs[0].persistedPlan.nextGate === planA.next.gate);
  check("queue stores a deterministic plan fingerprint", /^[a-f0-9]{64}$/.test(queuedA.jobs[0].persistedPlan.fingerprint));
  check("queue mutation lock is released after persistence", !existsSync(join(rootDir, "queue-mutation.lock.json")));

  const firstJobId = queuedA.jobs[0].jobId;
  const queuedAAgain = enqueueMoneyShortsAutomationJob({
    topicId: topicA,
    title: "첫 번째 주제 수정",
    plan: planA,
    rootDir,
    now: () => "2026-07-17T03:01:00.000Z",
    mutationId: "mutation-a-2",
  });
  check("enqueue is idempotent by topic", queuedAAgain.jobs.length === 1 && queuedAAgain.jobs[0].jobId === firstJobId);

  const queuedBoth = enqueueMoneyShortsAutomationJob({
    topicId: topicB,
    title: "두 번째 주제",
    plan: planB,
    rootDir,
    now: () => "2026-07-17T03:02:00.000Z",
    mutationId: "mutation-b",
  });
  check("multiple topics remain in deterministic creation order", queuedBoth.jobs.map((job) => job.topicId).join(",") === `${topicA},${topicB}`);

  const movedEarlier = moveMoneyShortsAutomationJobPriority({
    topicId: topicB,
    direction: "earlier",
    rootDir,
    now: () => "2026-07-17T03:02:30.000Z",
    mutationId: "mutation-priority-earlier",
  });
  check("Owner can move one queued topic earlier with contiguous local priority", movedEarlier.jobs.map((job) => job.topicId).join(",") === `${topicB},${topicA}` && movedEarlier.jobs.map((job) => job.queueOrder).join(",") === "1,2");
  check("priority change writes an auditable local-only history event", movedEarlier.history.at(-1)?.kind === "priority_moved_earlier" && movedEarlier.history.at(-1)?.actionCount === 0);
  let priorityBoundaryRejected = false;
  try {
    moveMoneyShortsAutomationJobPriority({ topicId: topicB, direction: "earlier", rootDir, mutationId: "mutation-priority-boundary" });
  } catch (error) {
    priorityBoundaryRejected = error instanceof Error && error.message === "automation_queue_priority_boundary";
  }
  check("priority cannot move beyond the local queue boundary", priorityBoundaryRejected);

  const synced = syncMoneyShortsAutomationJob({
    topicId: topicA,
    plan: planAAfter,
    advanceResult: {
      status: "success",
      blockerCode: null,
      executedAction: "flowMotionPrepare",
      actionCount: 1,
    },
    rootDir,
    now: () => "2026-07-17T03:03:00.000Z",
    mutationId: "mutation-sync",
  });
  const syncedA = synced.jobs.find((job) => job.topicId === topicA);
  check("explicit one-step result updates the persisted plan", syncedA.persistedPlan.fingerprint !== queuedA.jobs[0].persistedPlan.fingerprint);
  check("queue records at most one action and zero retries", syncedA.lastAdvance.actionCount === 1 && syncedA.lastAdvance.automaticRetryCount === 0);

  const restarted = readMoneyShortsAutomationQueue({ rootDir });
  check("queue membership and last stage survive restart reads", restarted.jobs.length === 2 && restarted.jobs.find((job) => job.topicId === topicA).lastAdvance.executedAction === "flowMotionPrepare");
  const raw = JSON.parse(readFileSync(join(rootDir, "queue.json"), "utf8"));
  check("durable queue file contains no executable schedule", raw.jobs.every((job) => !("runAt" in job) && !("interval" in job) && !("automaticRetry" in job)));

  const paused = pauseMoneyShortsAutomationJob({
    topicId: topicA,
    rootDir,
    now: () => "2026-07-17T03:04:00.000Z",
    mutationId: "mutation-pause",
  });
  check("Owner pause persists without executing an action", paused.jobs.find((job) => job.topicId === topicA).lifecycle.status === "paused" && paused.jobs.find((job) => job.topicId === topicA).lastAdvance.actionCount === 1);
  const resumed = resumeMoneyShortsAutomationJob({
    topicId: topicA,
    rootDir,
    now: () => "2026-07-17T03:05:00.000Z",
    mutationId: "mutation-resume",
  });
  check("Owner resume only changes lifecycle state", resumed.jobs.find((job) => job.topicId === topicA).lifecycle.status === "active");

  const removed = removeMoneyShortsAutomationJob({
    topicId: topicA,
    rootDir,
    now: () => "2026-07-17T03:06:00.000Z",
    mutationId: "mutation-remove",
  });
  check("Owner removal keeps an auditable local history event", removed.jobs.every((job) => job.topicId !== topicA) && removed.history.at(-1)?.kind === "removed");

  const archived = archiveCompletedMoneyShortsAutomationJob({
    topicId: topicB,
    plan: planBComplete,
    executionGuard: { status: "not_applicable", receipt: null, recovery: null },
    rootDir,
    now: () => "2026-07-17T03:07:00.000Z",
    mutationId: "mutation-archive",
  });
  check("only a completed plan can move into bounded archive history", archived.jobs.length === 0 && archived.archivedJobs.length === 1 && archived.archivedJobs[0].archiveReason === "completed_plan");
  check("archive retains last attempt and execution-guard summary", archived.archivedJobs[0].lastAdvance == null && archived.archivedJobs[0].executionGuard.status === "not_applicable");
  const lifecycleRestarted = readMoneyShortsAutomationQueue({ rootDir });
  check("lifecycle history and archived completion survive restart", lifecycleRestarted.jobs.length === 0 && lifecycleRestarted.archivedJobs.length === 1 && lifecycleRestarted.history.length >= 5);

  let mismatchRejected = false;
  try {
    enqueueMoneyShortsAutomationJob({ topicId: topicA, title: "오결합", plan: planB, rootDir });
  } catch (error) {
    mismatchRejected = error instanceof Error && error.message === "automation_queue_plan_topic_mismatch";
  }
  check("topic and plan mismatch is rejected", mismatchRejected);

  let unsafeTopicRejected = false;
  try {
    enqueueMoneyShortsAutomationJob({ topicId: "../unsafe", title: "unsafe", plan: { ...planA, topicId: "../unsafe" }, rootDir });
  } catch (error) {
    unsafeTopicRejected = error instanceof Error && error.message === "automation_queue_topic_id_invalid";
  }
  check("unsafe topic path is rejected", unsafeTopicRejected);
} finally {
  rmSync(rootDir, { recursive: true, force: true });
}

console.log(`\n${passed + failed} checks - ${passed} PASS, ${failed} FAIL`);
if (failed > 0) process.exit(1);
