import {
  MONEY_SHORTS_SAFE_AUTO_ADVANCE_ACTIONS,
  MONEY_SHORTS_RESUMABLE_ORCHESTRATOR_VERSION,
  buildMoneyShortsResumablePlan,
  isMoneyShortsSafeAutoAdvanceAction,
} from "../lib/money-shorts-resumable-orchestrator.mjs";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const routeSource = readFileSync(join(ROOT, "app", "api", "money-shorts", "operator", "route.ts"), "utf8");
const helperSource = readFileSync(join(ROOT, "lib", "owner-web-operator.ts"), "utf8");
const wizardSource = readFileSync(join(ROOT, "components", "VideoCreationWizard.tsx"), "utf8");
const controllerSource = readFileSync(join(ROOT, "lib", "money-shorts-resumable-orchestrator.mjs"), "utf8");
const executionStoreSource = readFileSync(join(ROOT, "lib", "money-shorts-automation-execution-store.mjs"), "utf8");
const queueStoreSource = readFileSync(join(ROOT, "lib", "money-shorts-automation-queue-store.mjs"), "utf8");
const queuePlannerSource = readFileSync(join(ROOT, "lib", "money-shorts-automation-queue-planner.mjs"), "utf8");
const safeSessionPlannerSource = readFileSync(join(ROOT, "lib", "money-shorts-safe-session-planner.mjs"), "utf8");
const safeSessionStoreSource = readFileSync(join(ROOT, "lib", "money-shorts-safe-session-store.mjs"), "utf8");

let passed = 0;
let failed = 0;
function check(name, condition, detail = "") {
  if (condition) {
    passed += 1;
    console.log(`PASS  ${name}`);
  } else {
    failed += 1;
    console.error(`FAIL  ${name}${detail ? ` - ${detail}` : ""}`);
  }
}

const readyBase = {
  topicId: "resume-test-topic",
  scriptReady: true,
  characterReady: true,
  realTtsReady: true,
  generatedImageCount: 8,
  expectedImageCount: 8,
  realImagesReady: true,
  flowState: "render_ready",
  flowReadyForRender: true,
  finalVideoReady: true,
  mediaQualityGateOk: true,
  publishPreflightReady: true,
  publishedAllParts: false,
};

const script = buildMoneyShortsResumablePlan({ ...readyBase, scriptReady: false });
check("schema is versioned", script.schemaVersion === MONEY_SHORTS_RESUMABLE_ORCHESTRATOR_VERSION);
check("missing script stops at Owner topic selection", script.next?.stageId === "script" && script.next.gate === "owner_topic_selection" && script.next.canAutoAdvance === false);

const tts = buildMoneyShortsResumablePlan({ ...readyBase, realTtsReady: false });
check("missing TTS offers only the free packet step", tts.next?.action === "realTtsPreflight" && tts.next.canAutoAdvance === true && tts.next.gate === "owner_paid_tts");

const images = buildMoneyShortsResumablePlan({ ...readyBase, generatedImageCount: 0, realImagesReady: false });
check("image generation remains Owner-gated", images.next?.stageId === "images" && images.next.action === "realSceneImagesCreate" && images.next.canAutoAdvance === false);

const visualReview = buildMoneyShortsResumablePlan({ ...readyBase, realImagesReady: false });
check("complete image set stops for Owner visual QA", visualReview.next?.stageId === "visual_review" && visualReview.next.action === null && visualReview.next.gate === "owner_visual_qa");

const flowPrepare = buildMoneyShortsResumablePlan({ ...readyBase, flowState: "not_prepared", flowReadyForRender: false });
check("Flow packet preparation is safe to auto-advance", flowPrepare.next?.action === "flowMotionPrepare" && flowPrepare.next.canAutoAdvance === true);

const flowApproval = buildMoneyShortsResumablePlan({ ...readyBase, flowState: "approval_pending", flowReadyForRender: false });
check("paid Flow generation stops at exact Owner approval", flowApproval.next?.action === "flowMotionGenerate" && flowApproval.next.gate === "owner_paid_flow" && flowApproval.next.canAutoAdvance === false);

const flowInFlight = buildMoneyShortsResumablePlan({ ...readyBase, flowState: "generating", flowReadyForRender: false });
check("in-flight Flow job never retries automatically", flowInFlight.status === "manual_recovery_required" && flowInFlight.next?.action === null);

const flowQa = buildMoneyShortsResumablePlan({ ...readyBase, flowState: "qa_pending", flowReadyForRender: false });
check("downloaded Flow video stops for Owner QA", flowQa.next?.action === "flowMotionQaPass" && flowQa.next.gate === "owner_flow_qa");

const render = buildMoneyShortsResumablePlan({ ...readyBase, finalVideoReady: false, mediaQualityGateOk: false, publishPreflightReady: false });
check("verified assets can advance only to local render", render.next?.action === "finalVideoCreate" && render.next.canAutoAdvance === true);

const preflight = buildMoneyShortsResumablePlan({ ...readyBase, publishPreflightReady: false });
check("accepted final media can advance to no-upload preflight", preflight.next?.action === "wizardPreflight" && preflight.next.canAutoAdvance === true);

const publication = buildMoneyShortsResumablePlan(readyBase);
check("publication is always Owner-confirmed and never auto-advanced", publication.status === "publication_confirmation_required" && publication.next?.action === "actualUpload" && publication.next.canAutoAdvance === false);

const complete = buildMoneyShortsResumablePlan({ ...readyBase, publishedAllParts: true });
check("fully published content is complete", complete.status === "complete" && complete.next === null);
check("planner itself reports zero side effects", Object.values(publication.safety).every((value) => value === false));
check("safe auto list never includes paid generation or publication", !publication.safeAutoAdvanceActions.includes("realTtsCreate") && !publication.safeAutoAdvanceActions.includes("flowMotionGenerate") && !publication.safeAutoAdvanceActions.includes("actualUpload"));
check("safe executor allowlist is exact", MONEY_SHORTS_SAFE_AUTO_ADVANCE_ACTIONS.join(",") === "realTtsPreflight,flowMotionPrepare,finalVideoCreate,wizardPreflight");
check("safe action predicate rejects every external or paid action", ["realTtsCreate", "realSceneImagesCreate", "flowMotionGenerate", "actualUpload"].every((action) => !isMoneyShortsSafeAutoAdvanceAction(action)));

const automationRouteStart = routeSource.indexOf('if (action === "automationPlan")');
const automationRouteEnd = routeSource.indexOf('if (action === "automationAdvance" || action === "automationQueueRunSelected")', automationRouteStart);
const automationRouteBlock = automationRouteStart >= 0 && automationRouteEnd > automationRouteStart
  ? routeSource.slice(automationRouteStart, automationRouteEnd)
  : "";
const snapshotStart = routeSource.indexOf("function readMoneyShortsAutomationSnapshot");
const snapshotEnd = routeSource.indexOf("function runFlowMotionPrepareAction", snapshotStart);
const snapshotBlock = snapshotStart >= 0 && snapshotEnd > snapshotStart
  ? routeSource.slice(snapshotStart, snapshotEnd)
  : "";
const advanceRouteStart = routeSource.indexOf('if (action === "automationAdvance" || action === "automationQueueRunSelected")');
const advanceRouteEnd = routeSource.indexOf('// Flow 모션 준비', advanceRouteStart);
const advanceRouteBlock = advanceRouteStart >= 0 && advanceRouteEnd > advanceRouteStart
  ? routeSource.slice(advanceRouteStart, advanceRouteEnd)
  : "";
const safeRunnerStart = routeSource.indexOf("function runOneSafeAutomationAction");
const safeRunnerEnd = routeSource.indexOf("// ── POST: action 실행", safeRunnerStart);
const safeRunnerBlock = safeRunnerStart >= 0 && safeRunnerEnd > safeRunnerStart
  ? routeSource.slice(safeRunnerStart, safeRunnerEnd)
  : "";
const recoveryRouteStart = routeSource.indexOf('if (action === "automationRecoveryResolve")');
const recoveryRouteEnd = routeSource.indexOf('if (action === "automationAdvance" || action === "automationQueueRunSelected")', recoveryRouteStart);
const recoveryRouteBlock = recoveryRouteStart >= 0 && recoveryRouteEnd > recoveryRouteStart
  ? routeSource.slice(recoveryRouteStart, recoveryRouteEnd)
  : "";
const recoveryStoreStart = executionStoreSource.indexOf("export function resolveMoneyShortsAutomationRecovery");
const recoveryStoreBlock = recoveryStoreStart >= 0 ? executionStoreSource.slice(recoveryStoreStart) : "";
const queueStatusRouteStart = routeSource.indexOf('if (action === "automationQueueStatus")');
const queueRouteEnd = routeSource.indexOf('// 중단 영수증 복구', queueStatusRouteStart);
const queueRouteBlock = queueStatusRouteStart >= 0 && queueRouteEnd > queueStatusRouteStart
  ? routeSource.slice(queueStatusRouteStart, queueRouteEnd)
  : "";
const queueLifecycleStart = routeSource.indexOf("// 큐 lifecycle 변경");
const queueLifecycleBlock = queueLifecycleStart >= 0 && recoveryRouteStart > queueLifecycleStart
  ? routeSource.slice(queueLifecycleStart, recoveryRouteStart)
  : "";
const safeSessionRouteStart = routeSource.indexOf('if (action === "safeSessionStatus")');
const safeSessionRouteEnd = routeSource.indexOf('if (action === "automationQueueStatus")', safeSessionRouteStart);
const safeSessionRouteBlock = safeSessionRouteStart >= 0 && safeSessionRouteEnd > safeSessionRouteStart
  ? routeSource.slice(safeSessionRouteStart, safeSessionRouteEnd)
  : "";
check("operator action enum exposes the read-only automation plan", helperSource.includes('"automationPlan"'));
check("automation route is local-only and returns noLive true", routeSource.includes('"automationPlan",') && automationRouteBlock.includes("noLive: true"));
check("automation route reads durable media/Flow/preflight/publish evidence", [
  "readWizardRealMediaState",
  "readWizardFlowMotionStatus",
  "readWizardPublishPreflight",
  "readWizardPublishResult",
].every((name) => snapshotBlock.includes(name)) && automationRouteBlock.includes("readMoneyShortsAutomationSnapshot"));
check("automation route never spawns or arms an action", !/runOperatorScript|allowArm|ARM_ARG_TOKEN|--arm/u.test(automationRouteBlock));
check("operator action enum exposes the bounded advance action", helperSource.includes('"automationAdvance"') && routeSource.includes('"automationAdvance",'));
check("operator action enum exposes the selected queue execution action", helperSource.includes('"automationQueueRunSelected"') && routeSource.includes('"automationQueueRunSelected",'));
check("advance revalidates planner permission and strict safe predicate", advanceRouteBlock.includes("canAutoAdvance !== true") && advanceRouteBlock.includes("isMoneyShortsSafeAutoAdvanceAction(nextAction)"));
check("advance invokes exactly one safe dispatcher and then recomputes", (advanceRouteBlock.match(/runOneSafeAutomationAction\(/g) ?? []).length === 1 && (advanceRouteBlock.match(/readMoneyShortsAutomationSnapshot\(/g) ?? []).length === 2);
check("advance response proves one action, no chaining, and no retry", advanceRouteBlock.includes("actionCount: 1") && advanceRouteBlock.includes("chainedActionCount: 0") && advanceRouteBlock.includes("automaticRetryCount: 0"));
check("advance writes durable receipt before dispatch and finishes it afterward", advanceRouteBlock.indexOf("beginMoneyShortsAutomationExecution") < advanceRouteBlock.indexOf("runOneSafeAutomationAction") && advanceRouteBlock.indexOf("runOneSafeAutomationAction") < advanceRouteBlock.indexOf("finishMoneyShortsAutomationExecution"));
check("advance refuses duplicate or in-flight execution before dispatch", advanceRouteBlock.includes("AUTOMATION_TOPIC_IN_FLIGHT") && advanceRouteBlock.includes("AUTOMATION_IDENTICAL_ATTEMPT_RECORDED") && advanceRouteBlock.includes("actionCount: 0"));
check("safe dispatcher contains only the four local/no-submit actions", ["realTtsPreflight", "flowMotionPrepare", "finalVideoCreate", "wizardPreflight"].every((action) => safeRunnerBlock.includes(`case "${action}"`)) && !/case "(?:realTtsCreate|realSceneImagesCreate|flowMotionGenerate|actualUpload)"/u.test(safeRunnerBlock));
check("advance route never arms, uploads, or invokes paid generation", !/allowArm|ARM_ARG_TOKEN|--arm|flowMotionGenerate|realTtsCreate|realSceneImagesCreate/u.test(advanceRouteBlock));
check("controller imports no network or process execution API", !/node:child_process|\bfetch\s*\(|https?:\/\//u.test(controllerSource));
check("execution store is local-only and imports no network or child process API", executionStoreSource.includes("C:\\\\tmp\\\\money-shorts-os\\\\automation-execution-v1") && !/node:child_process|\bfetch\s*\(|https?:\/\//u.test(executionStoreSource));
check("execution store uses an atomic exclusive per-topic lock", /openSync\(paths\.lockPath,\s*"wx"\)/u.test(executionStoreSource));
check("execution store writes terminal receipt before removing lock", executionStoreSource.indexOf("writeJsonAtomic(handle.receiptPath, receipt)") < executionStoreSource.indexOf("rmSync(handle.lockPath)"));
check("execution store has no automatic stale-lock expiration", !/mtime|birthtime|staleAfter|expiresAt|Date\.now\(\)\s*-/u.test(executionStoreSource));
check("operator exposes an explicit Owner recovery action", helperSource.includes('"automationRecoveryResolve"') && routeSource.includes('"automationRecoveryResolve",'));
check("recovery compares current plan fingerprint and stage progress", executionStoreSource.includes("currentPlanFingerprint") && executionStoreSource.includes("currentCompletedStageCount > beforeCompletedStageCount"));
check("recovery permits only evidence-matched acknowledgement or manual retry clearance", executionStoreSource.includes('"acknowledge_artifacts_advanced"') && executionStoreSource.includes('"clear_for_manual_retry"') && recoveryStoreBlock.includes("recovery.allowedDecision !== decision"));
check("recovery terminalizes evidence before releasing the lock", recoveryStoreBlock.indexOf("writeJsonAtomic(paths.receiptPath, receipt)") < recoveryStoreBlock.indexOf("rmSync(paths.lockPath)"));
check("recovery route never executes, retries, pays, renders, uploads, or publishes", !/runOneSafeAutomationAction|runOperatorScript|realTtsCreate|flowMotionGenerate|actualUpload|finalVideoCreate/u.test(recoveryRouteBlock) && recoveryRouteBlock.includes("actionCount: 0") && recoveryRouteBlock.includes("automaticRetryCount: 0"));
check("wizard renders evidence and only the server-allowed recovery decision", wizardSource.includes('data-testid="wizard-automation-recovery"') && wizardSource.includes("recovery.allowedDecision ===") && wizardSource.includes('postAction("automationRecoveryResolve"'));
check("manual retry clearance does not auto-run and preserves an archived receipt", executionStoreSource.includes("archiveManualRetryClearance") && executionStoreSource.includes("actionExecuted: false") && !/setTimeout|setInterval/u.test(recoveryStoreBlock));
check("operator exposes local queue status and enqueue actions", helperSource.includes('"automationQueueStatus"') && helperSource.includes('"automationQueueEnqueue"'));
check("operator exposes queue lifecycle actions", ["automationQueuePause", "automationQueueResume", "automationQueueRemove", "automationQueueArchiveCompleted"].every((action) => helperSource.includes(`"${action}"`) && routeSource.includes(`"${action}"`)));
check("operator exposes a local-only queue priority action", helperSource.includes('"automationQueueMovePriority"') && routeSource.includes('"automationQueueMovePriority"'));
check("queue store is local-only and contains no runner, network, timer, or schedule", queueStoreSource.includes("C:\\\\tmp\\\\money-shorts-os\\\\automation-queue-v1") && !/node:child_process|\bfetch\s*\(|https?:\/\/|setTimeout|setInterval|runAt|cron/u.test(queueStoreSource));
check("queue mutations use one atomic exclusive lock and atomic JSON replacement", queueStoreSource.includes('openSync(paths.lockPath, "wx")') && queueStoreSource.includes("writeJsonAtomic(paths.queuePath, updated)"));
check("queue status reconstructs live plans without executing a runner", queueRouteBlock.includes("readMoneyShortsAutomationQueueView") && routeSource.includes("livePlan: snapshot.plan") && !/runOperatorScript|runOneSafeAutomationAction|allowArm/u.test(queueRouteBlock));
check("queue enqueue persists only the selected topic plan", queueRouteBlock.includes("enqueueMoneyShortsAutomationJob") && queueRouteBlock.includes("작업 실행·유료 생성·렌더·업로드·게시는 0회"));
check("selected queue execution recomputes and verifies preview before creating a receipt", advanceRouteBlock.indexOf("readMoneyShortsAutomationQueueView") < advanceRouteBlock.indexOf("verifyMoneyShortsAutomationQueuePreviewClaim") && advanceRouteBlock.indexOf("verifyMoneyShortsAutomationQueuePreviewClaim") < advanceRouteBlock.indexOf("beginMoneyShortsAutomationExecution"));
check("selected queue execution rechecks the live plan fingerprint immediately before receipt creation", advanceRouteBlock.indexOf("fingerprintMoneyShortsAutomationPlan(before.plan)") < advanceRouteBlock.indexOf("beginMoneyShortsAutomationExecution") && advanceRouteBlock.includes("AUTOMATION_QUEUE_SELECTION_DRIFTED"));
check("legacy queued advance bypass is fail-closed without an action receipt", advanceRouteBlock.includes("AUTOMATION_QUEUE_PREVIEW_REQUIRED") && advanceRouteBlock.includes("actionCount: 0"));
check("queued advancement syncs only after terminal receipt", advanceRouteBlock.includes("queueJobRequested") && advanceRouteBlock.includes("syncMoneyShortsAutomationJob") && advanceRouteBlock.indexOf("finishMoneyShortsAutomationExecution") < advanceRouteBlock.indexOf("syncMoneyShortsAutomationJob"));
check("queue UI sends one content-addressed Owner-click claim", wizardSource.includes('data-testid="wizard-action-automation-queue-run-selected"') && wizardSource.includes('postAction("automationQueueRunSelected"') && ["previewFingerprint", "jobId", "selectedAction", "planFingerprint"].every((field) => wizardSource.includes(field)));
check("queue UI has no per-job execution bypass", !wizardSource.includes('data-testid="wizard-action-automation-queue-advance"') && !wizardSource.includes("runQueuedAutomationAdvance"));
check("queue lifecycle route mutates only local queue state with zero executed actions", ["pauseMoneyShortsAutomationJob", "resumeMoneyShortsAutomationJob", "removeMoneyShortsAutomationJob", "archiveCompletedMoneyShortsAutomationJob"].every((name) => queueLifecycleBlock.includes(name)) && queueLifecycleBlock.includes("actionCount: 0") && !/runOneSafeAutomationAction|runOperatorScript|realTtsCreate|realSceneImagesCreate|flowMotionGenerate|finalVideoCreate|actualUpload/u.test(queueLifecycleBlock));
check("queue priority move is a bounded local mutation with no executor", queueRouteBlock.includes("moveMoneyShortsAutomationJobPriority") && queueRouteBlock.includes("automationQueueMovePriority") && queueRouteBlock.includes("actionCount: 0") && !/runOneSafeAutomationAction|runOperatorScript|realTtsCreate|realSceneImagesCreate|flowMotionGenerate|finalVideoCreate|actualUpload/u.test(queueRouteBlock));
check("queue UI exposes lifecycle controls and bounded local history", ["wizard-action-automation-queue-pause-toggle", "wizard-action-automation-queue-remove", "wizard-action-automation-queue-archive", "wizard-automation-queue-history", "wizard-automation-queue-archive"].every((id) => wizardSource.includes(`data-testid=\"${id}\"`)));
check("queue UI exposes one-step local priority controls without per-job execution", ["wizard-action-automation-queue-priority-earlier", "wizard-action-automation-queue-priority-later"].every((id) => wizardSource.includes(`data-testid=\"${id}\"`)) && wizardSource.includes('postAction("automationQueueMovePriority"'));
check("queue planner is a pure dry-run with no I/O, runner, network, or timer", queuePlannerSource.includes('mode: "deterministic_dry_run"') && queuePlannerSource.includes("executionReceiptCreated: false") && !/node:fs|node:child_process|writeFile|runOneSafeAutomationAction|\bfetch\s*\(|setTimeout|setInterval/u.test(queuePlannerSource));
check("queue batch policy is explicitly no-submit and keeps every side-effect flag false", queuePlannerSource.includes('mode: "no_submit_batch_policy_preview"') && queuePlannerSource.includes("buildMoneyShortsAutomationQueueBatchPolicy") && queuePlannerSource.includes("paidActionEnabled: false"));
check("queue capacity summary only aggregates policy categories and keeps every side-effect flag false", queuePlannerSource.includes('mode: "no_submit_capacity_summary"') && queuePlannerSource.includes("summarizeMoneyShortsAutomationQueueCapacity") && queuePlannerSource.includes("localSafeReadyCount"));
check("queue planner uses explicit Owner priority then stable created-time tie breakers and selects at most one", queuePlannerSource.includes("stableQueueOrder") && queuePlannerSource.includes("queueOrder") && queuePlannerSource.includes("leftCreatedAt.localeCompare(rightCreatedAt)") && queuePlannerSource.includes("topicId") && queuePlannerSource.includes("evaluations.find((item) => item.eligible)"));
check("queue planner skips every durable guard blocker", ["topic_in_flight", "manual_review_required", "identical_attempt_recorded", "store_unavailable"].every((status) => queuePlannerSource.includes(status)));
check("queue planner skips an Owner-paused job", queuePlannerSource.includes("paused_by_owner"));
check("safe-session dry-run remains pure and cannot start work", safeSessionPlannerSource.includes('mode: "deterministic_session_dry_run"') && safeSessionPlannerSource.includes("executionReceiptCreated: false") && !/node:fs|node:child_process|writeFile|runOneSafeAutomationAction|\bfetch\s*\(|setTimeout|setInterval/u.test(safeSessionPlannerSource));
check("safe-session store is atomic intent-only state with no worker or external action", safeSessionStoreSource.includes('openSync(paths.lockPath, "wx")') && safeSessionStoreSource.includes("writeJsonAtomic(paths.statePath, updated)") && safeSessionStoreSource.includes("completedActionCount: 0") && !/node:child_process|\bfetch\s*\(|setTimeout|setInterval|runOneSafeAutomationAction|actualUpload|realTtsCreate|flowMotionGenerate/u.test(safeSessionStoreSource));
check("operator exposes Owner safe-session read/start/stop intent actions", ["safeSessionStatus", "safeSessionStart", "safeSessionStop"].every((action) => helperSource.includes(`\"${action}\"`) && routeSource.includes(`\"${action}\"`)));
check("safe-session route mutates only local intent state and proves zero actions", ["readMoneyShortsSafeSessionStore", "startMoneyShortsSafeSession", "requestMoneyShortsSafeSessionStop"].every((name) => safeSessionRouteBlock.includes(name)) && safeSessionRouteBlock.includes("actionCount: 0") && !/runOneSafeAutomationAction|runOperatorScript|beginMoneyShortsAutomationExecution|flowMotionGenerate|realTtsCreate|realSceneImagesCreate|finalVideoCreate|actualUpload|setTimeout|setInterval/u.test(safeSessionRouteBlock));
check("wizard renders safe-session status and Owner start/stop controls without a worker", ["wizard-safe-session", "wizard-action-safe-session-start", "wizard-action-safe-session-stop"].every((id) => wizardSource.includes(`data-testid=\"${id}\"`)) && wizardSource.includes('postAction("safeSessionStart"') && wizardSource.includes('postAction("safeSessionStop"') && wizardSource.includes("작업을 시작하지 않고"));
check("queue status attaches a deterministic run preview without executing", snapshotBlock.includes("planMoneyShortsAutomationQueueRun({ jobs })") && snapshotBlock.includes("runPreview") && queueRouteBlock.includes("실행 영수증·작업 실행은 0회"));
check("queue status attaches the read-only batch policy without an executor", snapshotBlock.includes("buildMoneyShortsAutomationQueueBatchPolicy({ runPreview })") && snapshotBlock.includes("batchPolicy") && !/runOneSafeAutomationAction|runOperatorScript/u.test(snapshotBlock));
check("queue status attaches the read-only capacity summary without an executor", snapshotBlock.includes("summarizeMoneyShortsAutomationQueueCapacity({ batchPolicy })") && snapshotBlock.includes("capacitySummary") && !/runOneSafeAutomationAction|runOperatorScript/u.test(snapshotBlock));
check("wizard shows exact dry-run action and per-job selection reason", wizardSource.includes('data-testid="wizard-automation-queue-dry-run"') && wizardSource.includes("정확한 다음 액션:") && wizardSource.includes('data-testid="wizard-automation-queue-job-decision"'));
check("wizard renders batch policy as a plan-only view", wizardSource.includes('data-testid="wizard-automation-queue-batch-policy"') && wizardSource.includes("큐 전체 다음 단계") && wizardSource.includes("계획 전용 · 실행 없음"));
check("wizard renders capacity summary as an aggregation-only view", wizardSource.includes('data-testid="wizard-automation-queue-capacity-summary"') && wizardSource.includes("큐 준비도 요약") && wizardSource.includes("집계 전용 · 실행 없음"));
check("wizard renders the resumable plan and explicit stop gate", wizardSource.includes('data-testid="wizard-automation-plan"') && wizardSource.includes("실제 게시 확인에서 중단"));
check("wizard exposes one-safe-step button and disables it outside safe plans", wizardSource.includes('data-testid="wizard-action-automation-advance"') && wizardSource.includes('postAction("automationAdvance"') && wizardSource.includes('automationPlan?.next?.canAutoAdvance !== true'));
check("wizard disables advance when durable execution guard is not available", wizardSource.includes('automationExecutionGuard.status !== "available"') && wizardSource.includes("실행 안전장치:"));

console.log(`\n${passed + failed} checks - ${passed} PASS, ${failed} FAIL`);
if (failed > 0) process.exit(1);
