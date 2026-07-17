import {
  APPROVED_ENV_KEY_NAMES,
  readWizardFinanceCharacterCastState,
  readWizardFlowMotionStatus,
  readWizardPublishPreflight,
  readWizardPublishResult,
  readWizardRealMediaState,
  resolveWizardFinanceCharacterVoice,
} from "@/lib/owner-web-operator";
import {
  buildMoneyShortsResumablePlan,
  isMoneyShortsSafeAutoAdvanceAction,
} from "@/lib/money-shorts-resumable-orchestrator.mjs";
import {
  inspectMoneyShortsAutomationExecution,
  inspectMoneyShortsAutomationRecovery,
} from "@/lib/money-shorts-automation-execution-store.mjs";
import { readMoneyShortsAutomationQueue } from "@/lib/money-shorts-automation-queue-store.mjs";
import {
  buildMoneyShortsAutomationQueueBatchPolicy,
  planMoneyShortsAutomationQueueRun,
  summarizeMoneyShortsAutomationQueueCapacity,
} from "@/lib/money-shorts-automation-queue-planner.mjs";

export const MONEY_SHORTS_AUTOMATION_READ_MODEL_VERSION =
  "money_shorts_automation_read_model_v1";

export function readMoneyShortsAutomationSnapshot(topicId: string) {
  const media = readWizardRealMediaState(topicId);
  const flowMotion = readWizardFlowMotionStatus(topicId);
  const characterCast = readWizardFinanceCharacterCastState();
  const characterRoute = resolveWizardFinanceCharacterVoice(topicId);
  const parts = media.parts;
  const preflights = parts.map((part) => ({
    partId: part.id,
    evidence: readWizardPublishPreflight(topicId, part.id),
  }));
  const publishResults = parts.map((part) => ({
    partId: part.id,
    result: readWizardPublishResult(topicId, part.id),
  }));
  const publishPreflightReady = parts.length > 0 && preflights.every(({ evidence }) =>
    evidence?.status === "PREFLIGHT_ONLY_OK" &&
    evidence.blockerCode == null &&
    evidence.contentUnitManifestPath != null &&
    evidence.credentialPresentCount === APPROVED_ENV_KEY_NAMES.length);
  const publishedAllParts = parts.length > 0 && publishResults.every(({ result }) =>
    result?.status === "PUBLISHED_DUAL_PLATFORM_OK");
  const plan = buildMoneyShortsResumablePlan({
    topicId,
    scriptReady: media.scriptEngine.finalReady,
    characterReady: characterRoute == null || characterCast.allSelected,
    realTtsReady: media.realTts.ready,
    generatedImageCount: media.realImages.generatedCount,
    expectedImageCount: media.realImages.expectedCount ?? 0,
    realImagesReady: media.realImages.ready,
    flowState: flowMotion.state,
    flowReadyForRender: flowMotion.readyForRender,
    finalVideoReady: media.finalVideo.ready,
    mediaQualityGateOk: media.mediaQualityGate.ok,
    publishPreflightReady,
    publishedAllParts,
  });
  return { plan, preflights, publishResults };
}

export function readMoneyShortsAutomationExecutionGuard(
  plan: ReturnType<typeof buildMoneyShortsResumablePlan>,
) {
  try {
    const recovery = inspectMoneyShortsAutomationRecovery({ topicId: plan.topicId, currentPlan: plan });
    if (recovery.status !== "none") {
      return {
        status: "manual_review_required" as const,
        receipt: recovery.receipt,
        recovery,
      };
    }
    const nextAction = plan.next?.action ?? null;
    if (plan.next?.canAutoAdvance !== true || nextAction == null || !isMoneyShortsSafeAutoAdvanceAction(nextAction)) {
      return { status: "not_applicable" as const, receipt: null, recovery };
    }
    return inspectMoneyShortsAutomationExecution({ topicId: plan.topicId, action: nextAction, plan });
  } catch {
    return { status: "store_unavailable" as const, receipt: null, recovery: null };
  }
}

/**
 * Reconstructs the local queue from current artifacts and execution evidence.
 * This read model has no dispatcher, timer, retry, paid action, upload, or publication authority.
 */
export function readMoneyShortsAutomationQueueView() {
  const queue = readMoneyShortsAutomationQueue();
  const jobs = queue.jobs.map((job: { topicId: string } & Record<string, unknown>) => {
    const snapshot = readMoneyShortsAutomationSnapshot(job.topicId);
    const executionGuard = readMoneyShortsAutomationExecutionGuard(snapshot.plan);
    return {
      ...job,
      livePlan: snapshot.plan,
      executionGuard,
    };
  });
  const runPreview = planMoneyShortsAutomationQueueRun({ jobs });
  const batchPolicy = buildMoneyShortsAutomationQueueBatchPolicy({ runPreview });
  const capacitySummary = summarizeMoneyShortsAutomationQueueCapacity({ batchPolicy });
  return {
    ...queue,
    mode: "owner_click_planning_only" as const,
    jobs,
    runPreview,
    batchPolicy,
    capacitySummary,
    safety: {
      timerEnabled: false,
      backgroundWorkerEnabled: false,
      automaticAdvanceEnabled: false,
      automaticRetryEnabled: false,
      paidActionEnabled: false,
      externalGenerationEnabled: false,
      publicationEnabled: false,
    },
  };
}
