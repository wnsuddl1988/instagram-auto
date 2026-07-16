import {
  closeSync,
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { randomUUID } from "node:crypto";
import { dirname, join } from "node:path";

import { fingerprintMoneyShortsAutomationPlan } from "./money-shorts-automation-execution-store.mjs";

export const MONEY_SHORTS_AUTOMATION_QUEUE_VERSION = "money_shorts_automation_queue_v1";
export const MONEY_SHORTS_AUTOMATION_QUEUE_ROOT = "C:\\tmp\\money-shorts-os\\automation-queue-v1";

function safeTopicId(topicId) {
  if (typeof topicId !== "string" || !/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,239}$/.test(topicId)) {
    throw new Error("automation_queue_topic_id_invalid");
  }
  return topicId;
}

function cleanTitle(title) {
  if (typeof title !== "string") return null;
  const normalized = title.trim().replace(/\s+/g, " ");
  return normalized.length > 0 ? normalized.slice(0, 160) : null;
}

function pathsFor(rootDir) {
  return {
    queuePath: join(rootDir, "queue.json"),
    lockPath: join(rootDir, "queue-mutation.lock.json"),
  };
}

function emptyQueue() {
  return {
    schemaVersion: MONEY_SHORTS_AUTOMATION_QUEUE_VERSION,
    updatedAt: null,
    jobs: [],
  };
}

function readQueueFile(queuePath) {
  if (!existsSync(queuePath)) return emptyQueue();
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(queuePath, "utf8"));
  } catch {
    throw new Error("automation_queue_store_corrupt");
  }
  if (
    parsed?.schemaVersion !== MONEY_SHORTS_AUTOMATION_QUEUE_VERSION ||
    !Array.isArray(parsed.jobs)
  ) {
    throw new Error("automation_queue_store_schema_invalid");
  }
  return parsed;
}

function writeJsonAtomic(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  const tempPath = `${path}.${randomUUID()}.tmp`;
  writeFileSync(tempPath, `${JSON.stringify(value, null, 2)}\n`, { encoding: "utf8", flag: "wx" });
  renameSync(tempPath, path);
}

function planSnapshot(plan) {
  return {
    fingerprint: fingerprintMoneyShortsAutomationPlan(plan),
    status: plan?.status ?? null,
    completedStageCount: plan?.completedStageCount ?? null,
    totalStageCount: plan?.totalStageCount ?? null,
    currentStageId: plan?.next?.stageId ?? null,
    currentStageLabel: plan?.next?.stageLabel ?? null,
    nextAction: plan?.next?.action ?? null,
    nextGate: plan?.next?.gate ?? null,
    nextReason: plan?.next?.reason ?? null,
    canAutoAdvance: plan?.next?.canAutoAdvance === true,
  };
}

function withQueueMutation({ rootDir, now, mutationId }, mutate) {
  const paths = pathsFor(rootDir);
  mkdirSync(rootDir, { recursive: true });
  let lockFd = null;
  try {
    lockFd = openSync(paths.lockPath, "wx");
    writeFileSync(lockFd, `${JSON.stringify({
      schemaVersion: MONEY_SHORTS_AUTOMATION_QUEUE_VERSION,
      mutationId,
      startedAt: now(),
    }, null, 2)}\n`, "utf8");
    closeSync(lockFd);
    lockFd = null;
  } catch (error) {
    if (lockFd != null) closeSync(lockFd);
    if (error && typeof error === "object" && error.code === "EEXIST") {
      throw new Error("automation_queue_mutation_in_flight");
    }
    throw error;
  }

  try {
    const current = readQueueFile(paths.queuePath);
    const updated = mutate(current);
    writeJsonAtomic(paths.queuePath, updated);
    return updated;
  } finally {
    rmSync(paths.lockPath, { force: true });
  }
}

export function readMoneyShortsAutomationQueue({
  rootDir = MONEY_SHORTS_AUTOMATION_QUEUE_ROOT,
} = {}) {
  const paths = pathsFor(rootDir);
  const queue = readQueueFile(paths.queuePath);
  return structuredClone(queue);
}

/**
 * @param {{topicId: string, title?: string | null, plan: any, rootDir?: string, now?: () => string, mutationId?: string}} input
 */
export function enqueueMoneyShortsAutomationJob({
  topicId,
  title = null,
  plan,
  rootDir = MONEY_SHORTS_AUTOMATION_QUEUE_ROOT,
  now = () => new Date().toISOString(),
  mutationId = randomUUID(),
}) {
  const safeId = safeTopicId(topicId);
  if (plan?.topicId !== safeId) throw new Error("automation_queue_plan_topic_mismatch");
  const timestamp = now();
  return withQueueMutation({ rootDir, now, mutationId }, (queue) => {
    const prior = queue.jobs.find((job) => job.topicId === safeId) ?? null;
    const job = {
      schemaVersion: MONEY_SHORTS_AUTOMATION_QUEUE_VERSION,
      jobId: prior?.jobId ?? randomUUID(),
      topicId: safeId,
      title: cleanTitle(title) ?? prior?.title ?? safeId,
      createdAt: prior?.createdAt ?? timestamp,
      updatedAt: timestamp,
      persistedPlan: planSnapshot(plan),
      lastAdvance: prior?.lastAdvance ?? null,
    };
    return {
      schemaVersion: MONEY_SHORTS_AUTOMATION_QUEUE_VERSION,
      updatedAt: timestamp,
      jobs: [...queue.jobs.filter((item) => item.topicId !== safeId), job]
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    };
  });
}

/**
 * @param {{topicId: string, plan: any, advanceResult?: null | {status?: string | null, blockerCode?: string | null, executedAction?: string | null, actionCount?: number}, rootDir?: string, now?: () => string, mutationId?: string}} input
 */
export function syncMoneyShortsAutomationJob({
  topicId,
  plan,
  advanceResult = null,
  rootDir = MONEY_SHORTS_AUTOMATION_QUEUE_ROOT,
  now = () => new Date().toISOString(),
  mutationId = randomUUID(),
}) {
  const safeId = safeTopicId(topicId);
  if (plan?.topicId !== safeId) throw new Error("automation_queue_plan_topic_mismatch");
  const timestamp = now();
  return withQueueMutation({ rootDir, now, mutationId }, (queue) => {
    const prior = queue.jobs.find((job) => job.topicId === safeId);
    if (!prior) throw new Error("automation_queue_job_not_found");
    const job = {
      ...prior,
      updatedAt: timestamp,
      persistedPlan: planSnapshot(plan),
      lastAdvance: advanceResult == null ? prior.lastAdvance : {
        at: timestamp,
        status: advanceResult.status ?? null,
        blockerCode: advanceResult.blockerCode ?? null,
        executedAction: advanceResult.executedAction ?? null,
        actionCount: advanceResult.actionCount === 1 ? 1 : 0,
        automaticRetryCount: 0,
      },
    };
    return {
      schemaVersion: MONEY_SHORTS_AUTOMATION_QUEUE_VERSION,
      updatedAt: timestamp,
      jobs: queue.jobs.map((item) => item.topicId === safeId ? job : item),
    };
  });
}
