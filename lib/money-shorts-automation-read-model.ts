import {
  APPROVED_ENV_KEY_NAMES,
  readWizardFinanceCharacterCastState,
  readWizardFlowMotionStatus,
  readWizardPublishPreflight,
  readWizardPublishResult,
  readWizardTopicPublishRecoveryStates,
  readWizardRealMediaState,
  resolveWizardFinanceCharacterVoice,
} from "@/lib/owner-web-operator";
import {
  buildMoneyShortsResumablePlan,
  isMoneyShortsSafeAutoAdvanceAction,
} from "@/lib/money-shorts-resumable-orchestrator.mjs";
import { coordinateMoneyShortsSafeSessionDryRun } from "@/lib/money-shorts-safe-session-coordinator.mjs";
import {
  inspectMoneyShortsAutomationExecution,
  inspectMoneyShortsAutomationExecutionByFingerprint,
  inspectMoneyShortsAutomationRecovery,
} from "@/lib/money-shorts-automation-execution-store.mjs";
import { readMoneyShortsAutomationQueue } from "@/lib/money-shorts-automation-queue-store.mjs";
import {
  buildMoneyShortsAutomationQueueBatchPolicy,
  planMoneyShortsAutomationQueueRun,
  summarizeMoneyShortsAutomationQueueCapacity,
} from "@/lib/money-shorts-automation-queue-planner.mjs";
import { planMoneyShortsSafeSessionRecovery } from "@/lib/money-shorts-safe-session-recovery.mjs";
import { readMoneyShortsSafeSessionStore } from "@/lib/money-shorts-safe-session-store.mjs";
import { buildMoneyShortsUnattendedPolicyPreview } from "@/lib/money-shorts-unattended-policy.mjs";
import { buildMoneyShortsExternalGenerationBudgetPolicyPreview } from "@/lib/money-shorts-external-generation-budget-policy.mjs";

export const MONEY_SHORTS_AUTOMATION_READ_MODEL_VERSION =
  "money_shorts_automation_read_model_v1";

type MoneyShortsSafeSessionRecoveryPlanner = (input: {
  sessionStore: ReturnType<typeof readMoneyShortsSafeSessionStore>;
  currentPlan?: ReturnType<typeof buildMoneyShortsResumablePlan> | null;
  runPreview?: ReturnType<typeof planMoneyShortsAutomationQueueRun> | null;
  claimExecutionGuard?: ReturnType<typeof inspectMoneyShortsAutomationExecutionByFingerprint> | null;
  executionRecovery?: ReturnType<typeof inspectMoneyShortsAutomationRecovery> | null;
}) => ReturnType<typeof planMoneyShortsSafeSessionRecovery>;

const buildMoneyShortsSafeSessionRecoveryView =
  planMoneyShortsSafeSessionRecovery as unknown as MoneyShortsSafeSessionRecoveryPlanner;

type MoneyShortsSafeSessionCoordinator = (input: {
  sessionStore: ReturnType<typeof readMoneyShortsSafeSessionStore>;
  runPreview: ReturnType<typeof planMoneyShortsAutomationQueueRun>;
}) => ReturnType<typeof coordinateMoneyShortsSafeSessionDryRun>;

const buildMoneyShortsSafeSessionCoordinatorView =
  coordinateMoneyShortsSafeSessionDryRun as unknown as MoneyShortsSafeSessionCoordinator;

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
  const publishRecoveries =
    readWizardTopicPublishRecoveryStates(topicId).map(
      (recovery) => ({
        partId: recovery.partId,
        recovery,
      }),
    );
  const publishPreflightReady = parts.length > 0 && preflights.every(({ evidence }) =>
    evidence?.status === "PREFLIGHT_ONLY_OK" &&
    evidence.blockerCode == null &&
    evidence.contentUnitManifestPath != null &&
    evidence.boundToCurrentArtifacts === true &&
    evidence.credentialPresentCount === APPROVED_ENV_KEY_NAMES.length);
  const publishedAllParts = parts.length > 0 && publishRecoveries.every(({ recovery }) =>
    recovery.state === "complete");
  const publishRecoveryRequired = !publishedAllParts && publishRecoveries.some(
    ({ recovery }) => recovery.genericDualUploadBlocked === true,
  );
  const plan = buildMoneyShortsResumablePlan({
    topicId,
    scriptReady: media.scriptEngine.finalReady,
    characterReady: characterRoute == null || characterCast.allSelected,
    realTtsGenerated: media.realTts.ready,
    realTtsQualityAccepted: media.realTts.qualityAccepted,
    generatedImageCount: media.realImages.generatedCount,
    expectedImageCount: media.realImages.expectedCount ?? 0,
    realImagesReviewable: media.realImages.reviewable,
    realImagesReady: media.realImages.ready,
    flowState: flowMotion.state,
    flowReadyForRender: flowMotion.readyForRender,
    finalVideoReady: media.finalVideo.ready,
    finalVideoOwnerApproved: media.finalVideo.ownerApproved,
    mediaQualityGateOk: media.mediaQualityGate.ok,
    publishPreflightReady,
    publishedAllParts,
    publishRecoveryRequired,
  });
  return { plan, preflights, publishResults, publishRecoveries };
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
  const unattendedPolicy = buildMoneyShortsUnattendedPolicyPreview({
    batchPolicy,
    capacitySummary,
  });
  const externalGenerationBudgetPolicy =
    buildMoneyShortsExternalGenerationBudgetPolicyPreview({
      unattendedPolicy,
    });
  return {
    ...queue,
    mode: "owner_click_planning_only" as const,
    jobs,
    runPreview,
    batchPolicy,
    capacitySummary,
    unattendedPolicy,
    externalGenerationBudgetPolicy,
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

/** Recomputes one no-execution safe-session decision from current durable queue evidence. */
export function readMoneyShortsSafeSessionCoordinatorView(
  sessionStore = readMoneyShortsSafeSessionStore(),
) {
  const queue = readMoneyShortsAutomationQueueView();
  return buildMoneyShortsSafeSessionCoordinatorView({
    sessionStore,
    runPreview: queue.runPreview,
  });
}

/**
 * Rebuilds recovery evidence for the exact active safe-session claim.
 * This view reads only current artifacts, queue preview, and durable execution evidence.
 * It never resolves a receipt, clears a claim, retries, dispatches, renders, uploads, or publishes.
 */
export function readMoneyShortsSafeSessionRecoveryView(
  sessionStore = readMoneyShortsSafeSessionStore(),
) {
  const session = sessionStore.currentSession;
  if (session?.actionInFlight !== true || session.activeClaim == null) {
    return buildMoneyShortsSafeSessionRecoveryView({ sessionStore });
  }

  const claim = session.activeClaim;
  const snapshot = readMoneyShortsAutomationSnapshot(claim.topicId);
  const queue = readMoneyShortsAutomationQueueView();
  const claimExecutionGuard = inspectMoneyShortsAutomationExecutionByFingerprint({
    topicId: claim.topicId,
    action: claim.action,
    planFingerprint: claim.planFingerprint,
  });
  const executionRecovery = inspectMoneyShortsAutomationRecovery({
    topicId: claim.topicId,
    currentPlan: snapshot.plan,
  });

  return buildMoneyShortsSafeSessionRecoveryView({
    sessionStore,
    currentPlan: snapshot.plan,
    runPreview: queue.runPreview,
    claimExecutionGuard,
    executionRecovery,
  });
}
