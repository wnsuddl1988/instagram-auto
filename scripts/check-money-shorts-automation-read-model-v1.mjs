import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

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

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = readFileSync(join(root, "lib", "money-shorts-automation-read-model.ts"), "utf8");
const routeSource = readFileSync(join(root, "app", "api", "money-shorts", "operator", "route.ts"), "utf8");

check("read model contract is versioned", source.includes('"money_shorts_automation_read_model_v1"'));
check("shared module owns snapshot, guard, and queue view", [
  "export function readMoneyShortsAutomationSnapshot",
  "export function readMoneyShortsAutomationExecutionGuard",
  "export function readMoneyShortsAutomationQueueView",
].every((name) => source.includes(name)));
check("route imports all three read-model functions", routeSource.includes('from "@/lib/money-shorts-automation-read-model"') && [
  "readMoneyShortsAutomationSnapshot",
  "readMoneyShortsAutomationExecutionGuard",
  "readMoneyShortsAutomationQueueView",
].every((name) => routeSource.includes(name)));
check("route no longer defines a private duplicate read model", !/function readMoneyShortsAutomation(?:Snapshot|ExecutionGuard|QueueView)/u.test(routeSource));
check("snapshot rebuilds all artifact-derived production and publication evidence", [
  "readWizardRealMediaState",
  "readWizardFlowMotionStatus",
  "readWizardFinanceCharacterCastState",
  "resolveWizardFinanceCharacterVoice",
  "readWizardPublishPreflight",
  "readWizardPublishResult",
  "buildMoneyShortsResumablePlan",
].every((name) => source.includes(name)));
check("execution guard preserves recovery and duplicate/in-flight evidence inspection", source.includes("inspectMoneyShortsAutomationRecovery") && source.includes("inspectMoneyShortsAutomationExecution") && source.includes('status: "store_unavailable"'));
check("queue view preserves live-plan reconstruction and deterministic previews", source.includes("readMoneyShortsAutomationQueue()") && source.includes("livePlan: snapshot.plan") && source.includes("planMoneyShortsAutomationQueueRun({ jobs })") && source.includes("buildMoneyShortsAutomationQueueBatchPolicy({ runPreview })") && source.includes("summarizeMoneyShortsAutomationQueueCapacity({ batchPolicy })"));
check("queue response schema remains the durable queue schema from spread state", source.includes("...queue") && !/schemaVersion:\s*MONEY_SHORTS_AUTOMATION_READ_MODEL_VERSION/u.test(source));
check("shared read model keeps all scheduler and side-effect flags false", [
  "timerEnabled: false",
  "backgroundWorkerEnabled: false",
  "automaticAdvanceEnabled: false",
  "automaticRetryEnabled: false",
  "paidActionEnabled: false",
  "externalGenerationEnabled: false",
  "publicationEnabled: false",
].every((flag) => source.includes(flag)));
check("shared read model has no dispatcher, receipt writer, timer, network, paid action, render, upload, or publication call", !/runOneSafeAutomationAction|beginMoneyShortsAutomationExecution|finishMoneyShortsAutomationExecution|syncMoneyShortsAutomationJob|runOperatorScript|node:child_process|\bfetch\s*\(|setTimeout|setInterval|realTtsCreate|realSceneImagesCreate|flowMotionGenerate|finalVideoCreate|actualUpload/u.test(source));

console.log(`\n${passed + failed} checks - ${passed} PASS, ${failed} FAIL`);
if (failed > 0) process.exit(1);
