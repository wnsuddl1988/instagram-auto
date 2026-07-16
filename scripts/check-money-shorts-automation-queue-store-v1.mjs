import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  MONEY_SHORTS_AUTOMATION_QUEUE_VERSION,
  enqueueMoneyShortsAutomationJob,
  readMoneyShortsAutomationQueue,
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
